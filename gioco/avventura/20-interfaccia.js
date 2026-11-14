/*
 * avventura/20-interfaccia.js — L'interfaccia dell'avventura: scena, punti sensibili, Ferruccio che cammina, fascia degli
 * oggetti, testo e dialoghi a temi, bivio delle decisioni, Diario, menu (slot, capitoli, finali, opzioni), finale.
 * Tutto si disegna sul canvas a 640×360 logici; ogni riquadro cliccabile è una «zona» (rifatte a ogni fotogramma), e
 * tastiera e gamepad passano fra le stesse zone. La logica sta in 01-logica.js (AV.corsa e compagni): qui non si
 * decide niente della storia. Un errore nei dati non ferma il gioco: AV.errore e si va avanti.
 */
(function (AV) {
  'use strict';
  const D = AV.D, W = 640, H = 360, FASCIA = 300;
  const CHIAVE = 'ferruccio.avventura.';
  const SLOT = 3;
  /** Valori di resa e di interfaccia (non di gioco). */
  const CFG = {
    passo: 150, // velocità di Ferruccio (unità logiche al secondo)
    camminaMax: 2.5, // oltre (secondi), Ferruccio arriva comunque
    pressioneLunga: 0.45, // secondi
    velocita: [{ nome: 'Lenta', cps: 22 }, { nome: 'Normale', cps: 45 }, { nome: 'Veloce', cps: 100 }, { nome: 'Subito', cps: 1e9 }],
    sicurezzaBivio: 0.6, // secondi in cui il bivio non accetta risposte (niente conferme per sbaglio)
    font: 'Georgia, "Times New Roman", serif',
  };
  const U = AV.UI = { CFG };

  const G = U.G = {
    t: 0, dt: 0, zone: [], fuoco: null, sotto: null, mouse: { x: -99, y: -99, dentro: false }, tutti: false,
    titolo: true, overlay: null, conferma: false, pagina: 0,
    stato: null, quadro: null, corse: [], testo: null, bivio: null, temi: null, dialogo: null, attesa: null, cartello: null, finale: null,
    inMano: '', fer: { x: 90, y: 270, dir: 1, meta: null, cammina: false }, fx: D.nuoviEffetti(), etichetta: null,
    slot: 1, capitoliSalvati: {}, finaliVisti: [], opzioni: { volume: 7, velocita: 1 }, salvaDopo: false,
  };

  // ------------------------------------------------------------------ memoria (localStorage)
  const leggi = (k, d) => { try { const v = localStorage.getItem(CHIAVE + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const scrivi = (k, v) => { try { localStorage.setItem(CHIAVE + k, JSON.stringify(v)); } catch (e) { /* memoria piena o vietata */ } };
  U.leggiSlot = (n) => leggi(String(n), null);
  function salva() {
    if (!G.stato || G.titolo) return;
    scrivi(String(G.slot), { stato: G.stato, capitoli: G.capitoliSalvati, quadroNome: G.quadro ? G.quadro.nome : '', versione: 1 });
    scrivi('slot', G.slot);
  }
  U.salva = salva;
  function segnaFinale(id) { if (!G.finaliVisti.includes(id)) { G.finaliVisti.push(id); scrivi('finali', G.finaliVisti); } }

  // ------------------------------------------------------------------ esecuzione delle azioni
  function eseguiAzioni(azioni, alFine) {
    G.corse.push({ c: AV.corsa(azioni, G.stato), alFine });
    continua();
  }
  U.eseguiAzioni = eseguiAzioni;

  /** Fa avanzare la storia finché serve una risposta del giocatore o finiscono le azioni. */
  function continua(risposta) {
    let r = risposta;
    for (let giri = 0; giri < 10000; giri++) {
      const cima = G.corse[G.corse.length - 1];
      if (!cima) { if (G.salvaDopo) G.salvaDopo = false; salva(); return; }
      let ev = null;
      try { ev = cima.c.prossimo(r); } catch (e) { AV.errore('azione fallita: ' + e.message); ev = null; }
      r = undefined;
      if (!ev) { G.corse.pop(); if (cima.alFine && cima.alFine()) return; continue; }
      let aspetta = false;
      try { aspetta = gestisci(ev); } catch (e) { AV.errore(`evento «${ev.tipo}» fallito: ${e.message}`); }
      if (aspetta) { if (G.salvaDopo) { G.salvaDopo = false; salva(); } return; }
    }
  }
  U.continua = continua;

  function gestisci(ev) {
    switch (ev.tipo) {
      case 'dice': case 'pensa': mostraTesto(ev); return true;
      case 'scelta': G.bivio = { voci: ev.voci, t0: G.t }; G.fuoco = null; suono('scelta'); return true;
      case 'vai': entraQuadro(ev.quadro, ev.da, ev.nuovoCapitolo); return false;
      case 'dialogo':
        G.dialogo = ev.id;
        G.corse.push({ c: AV.corsa(AV.aperturaDialogo(ev.id, G.stato), G.stato), alFine: mostraTemi });
        return false;
      case 'effetto': {
        D.avviaEffetto(G.fx, ev.nome, G.t);
        if (ev.nome === 'lampo' || ev.nome === 'scossa' || ev.nome === 'anime' || ev.nome === 'sipario') suono(ev.nome);
        const ms = D.durataEffetto(ev.nome);
        if (ms) { G.attesa = { fino: G.t + ms / 1000 }; return true; }
        return false;
      }
      case 'suono': suono(ev.nome); return false;
      case 'attendi': G.attesa = { fino: G.t + Math.min(ev.ms, 10000) / 1000 }; return true;
      case 'capitolo': {
        const C = AV.dati.capitolo.get(ev.id) || { titolo: ev.id };
        if (!G.capitoliSalvati[ev.id]) G.capitoliSalvati[ev.id] = AV.copia(G.stato);
        G.cartello = { titolo: C.titolo, sotto: C.sottotitolo || '', t0: G.t, dura: 3.2 }; suono('campana'); salva();
        return true;
      }
      case 'finale': {
        const F = ev.id && AV.dati.finale.get(ev.id);
        if (!F) { AV.errore('nessun finale vale per questo stato: la storia continua'); return false; }
        G.corse.push({ c: AV.corsa(F.scene || [], G.stato), alFine: () => { iniziaFinale(F); return true; } });
        return false;
      }
      default: AV.errore(`evento «${ev.tipo}» sconosciuto`); return false;
    }
  }

  function mostraTemi() {
    if (!G.dialogo) return false;
    const lista = AV.temiDelDialogo(G.dialogo, G.stato);
    if (!lista.length) { G.dialogo = null; return false; }
    G.temi = { id: G.dialogo, lista }; G.fuoco = null;
    return true;
  }
  function sceltaTema(t) { G.temi = null; G.corse.push({ c: AV.corsa(AV.azioniDelTema(G.dialogo, t, G.stato), G.stato), alFine: mostraTemi }); suono('tic'); continua(); }
  function allontanati() { G.temi = null; G.dialogo = null; suono('tic'); continua(); }

  const NOMI_SPECIALI = { voce: { nome: 'La Voce', colore: '#b9a7ff' } };
  function mostraTesto(ev) {
    let nome = '', colore = '#f3dfc1';
    if (ev.tipo === 'dice' && ev.chi !== 'didascalia') {
      const P = AV.dati.personaggio.get(ev.chi) || NOMI_SPECIALI[ev.chi];
      if (!P) AV.errore(`personaggio «${ev.chi}» non esiste`);
      nome = P ? P.nome : ev.chi; colore = (P && P.colore) || colore;
    }
    G.testo = { nome, colore, testo: ev.testo, corsivo: ev.tipo === 'pensa', didascalia: ev.chi === 'didascalia', n: 0, t0: G.t };
    if (ev.tipo === 'dice') suono('voce');
  }
  function avantiTesto() {
    const T = G.testo; if (!T) return;
    if (T.n < T.testo.length) { T.n = T.testo.length; return; }
    G.testo = null; continua();
  }
  function scegli(indice) {
    if (!G.bivio || G.t - G.bivio.t0 < CFG.sicurezzaBivio) return;
    G.bivio = null; G.salvaDopo = true; suono('scelta'); continua(indice);
  }

  // ------------------------------------------------------------------ quadri e Ferruccio
  function suoloY(Q) { try { return D.fondale(Q, U.k || 1).suoloY; } catch (e) { return 250; } }
  function entraQuadro(id, da, nuovoCapitolo) {
    const Q = AV.dati.quadro.get(id); if (!Q) return;
    G.quadro = Q; G.inMano = G.inMano && G.stato.inventario.includes(G.inMano) ? G.inMano : '';
    const sy = suoloY(Q);
    const ritorno = (Q.punti || []).find((p) => p.uscita && p.uscita === da);
    const x = ritorno ? Math.max(30, Math.min(610, ritorno.x + ritorno.w / 2)) : 90;
    G.fer = { x, y: Math.min(292, sy + 26), dir: x > 320 ? -1 : 1, meta: null, cammina: false };
    G.etichetta = { testo: Q.nome || '', t0: G.t };
    if (nuovoCapitolo && !G.capitoliSalvati[nuovoCapitolo]) G.capitoliSalvati[nuovoCapitolo] = AV.copia(G.stato);
    if (AV.audio) AV.audio.musica(Q.musica || 'notte');
    salva();
  }
  /** Dove Ferruccio si ferma per agire su un punto. */
  function postoPer(p) {
    const sy = G.quadro ? suoloY(G.quadro) : 250;
    const base = p.y + p.h;
    const y = base < sy ? Math.min(292, sy + 14) : Math.min(292, base + 3);
    let x = p.x + p.w / 2;
    if (p.personaggio || p.w < 60) { const lato = G.fer.x < x ? -1 : 1; x += lato * (p.w / 2 + 14); }
    return { x: Math.max(16, Math.min(624, x)), y };
  }
  function cammina(p, poi) {
    const m = postoPer(p);
    if (G.fer.meta && G.fer.meta.punto === p.id) { arriva(); return; } // secondo clic: si salta la camminata
    if (Math.hypot(m.x - G.fer.x, m.y - G.fer.y) < 6) { G.fer.dir = p.x + p.w / 2 >= G.fer.x ? 1 : -1; poi(); return; }
    G.fer.meta = { x: m.x, y: m.y, punto: p.id, poi, t0: G.t, verso: p.x + p.w / 2 };
  }
  function arriva() {
    const m = G.fer.meta; if (!m) return;
    G.fer.x = m.x; G.fer.y = m.y; G.fer.meta = null; G.fer.cammina = false;
    G.fer.dir = m.verso >= G.fer.x ? 1 : -1;
    m.poi();
  }
  function muoviFerruccio(dt) {
    const m = G.fer.meta; if (!m) { G.fer.cammina = false; return; }
    if (!inScena()) { G.fer.cammina = false; return; } // il menu o un testo fermano la camminata, non la saltano
    const dx = m.x - G.fer.x, dy = m.y - G.fer.y, d = Math.hypot(dx, dy), v = CFG.passo * dt;
    if (d <= v || G.t - m.t0 > CFG.camminaMax) { arriva(); return; }
    G.fer.x += (dx / d) * v; G.fer.y += (dy / d) * v; G.fer.dir = dx >= 0 ? 1 : -1; G.fer.cammina = true;
  }
  const inScena = () => !G.titolo && !G.overlay && !G.testo && !G.bivio && !G.temi && !G.attesa && !G.cartello && !G.finale && !G.corse.length;

  function agisci(p, verbo) {
    if (!inScena()) return;
    const oggetto = G.inMano;
    const az = AV.azioniDelPunto(G.quadro, p.id, verbo, verbo === 'guarda' ? '' : oggetto, G.stato);
    if (verbo === 'guarda') { G.fer.meta = null; G.fer.dir = p.x + p.w / 2 >= G.fer.x ? 1 : -1; suono('tic'); eseguiAzioni(az); return; }
    cammina(p, () => { if (oggetto) G.inMano = ''; eseguiAzioni(az); });
  }
  function prendiInMano(id) {
    if (!inScena()) return;
    if (G.inMano && G.inMano !== id) { const a = G.inMano; G.inMano = ''; suono('tic'); eseguiAzioni(AV.azioniCombina(a, id)); return; }
    G.inMano = G.inMano === id ? '' : id; suono('tic');
  }
  function guardaOggetto(id) { if (!inScena()) return; G.inMano = ''; suono('tic'); eseguiAzioni(AV.azioniDellOggetto(id)); }

  // ------------------------------------------------------------------ partite
  function quadroDaIndirizzo() {
    try { const q = new URLSearchParams(location.search).get('quadro'); return q && AV.dati.quadro.has(q) ? q : ''; } catch (e) { return ''; }
  }
  function nuovaStoria() {
    G.titolo = false; G.overlay = null; G.conferma = false; G.corse = []; G.testo = G.bivio = G.temi = G.attesa = G.cartello = G.finale = null; G.dialogo = null;
    G.fx = D.nuoviEffetti(); G.inMano = ''; G.capitoliSalvati = {};
    const inizio = quadroDaIndirizzo() || AV.quadroIniziale();
    G.stato = AV.nuovoStato();
    if (!inizio) { AV.errore('nessun quadro registrato: non c\'è storia da giocare'); G.titolo = true; return; }
    eseguiAzioni([['vai', inizio]]);
  }
  function avviaDa(stato, capitoli) {
    G.titolo = false; G.overlay = null; G.conferma = false; G.corse = []; G.testo = G.bivio = G.temi = G.attesa = G.cartello = G.finale = null; G.dialogo = null;
    G.fx = D.nuoviEffetti(); G.inMano = ''; G.titoloSolo = false;
    G.stato = AV.ripara(stato); if (capitoli) G.capitoliSalvati = capitoli;
    const q = AV.dati.quadro.has(G.stato.quadro) ? G.stato.quadro : AV.quadroIniziale();
    G.stato.quadro = '';
    eseguiAzioni([['vai', q]]); // rientrare nel quadro ne esegue l'entrata (le prime volte sono custodite da «unaVolta»)
  }
  function continuaPartita() {
    if (G.stato && !G.titoloSolo) { G.overlay = null; G.titolo = false; return; }
    const s = U.leggiSlot(G.slot); if (s && s.stato) avviaDa(s.stato, s.capitoli || {});
  }
  U.nuovaStoria = nuovaStoria; U.avviaDa = avviaDa;

  function iniziaFinale(F) { segnaFinale(F.id); G.finale = { F, fase: 0, t0: G.t }; G.testo = null; suono('campana'); if (AV.audio) AV.audio.musica('finale'); }
  function avantiFinale() {
    const f = G.finale; if (!f || G.t - f.t0 < 0.6) return;
    f.fase++; f.t0 = G.t;
    if (f.fase > 2) { G.finale = null; G.corse = []; G.overlay = 'menu'; G.titoloSolo = true; G.titolo = true; G.pagina = 0; }
  }

  // ------------------------------------------------------------------ zone (cliccabili) e comandi
  function zona(z) { G.zone.push(z); return z; }
  const dentro = (z, x, y) => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h;
  function zonaIn(x, y) { for (let i = G.zone.length - 1; i >= 0; i--) if (dentro(G.zone[i], x, y) && !G.zone[i].sfondo) return G.zone[i]; for (let i = G.zone.length - 1; i >= 0; i--) if (dentro(G.zone[i], x, y)) return G.zone[i]; return null; }
  const zonaFuoco = () => G.zone.find((z) => z.chiave === G.fuoco && !z.sfondo) || null;

  function naviga(dx, dy) {
    const scelte = G.zone.filter((z) => !z.sfondo); if (!scelte.length) return;
    const z0 = zonaFuoco();
    if (!z0) { G.fuoco = scelte[0].chiave; return; }
    const cx = z0.x + z0.w / 2, cy = z0.y + z0.h / 2; let meglio = null, punti = Infinity;
    for (const z of scelte) {
      if (z === z0) continue;
      const ex = z.x + z.w / 2 - cx, ey = z.y + z.h / 2 - cy, lungo = ex * dx + ey * dy;
      if (lungo <= 2) continue;
      const largo = Math.abs(ex * dy - ey * dx), p = lungo + largo * 2.2;
      if (p < punti) { punti = p; meglio = z; }
    }
    if (meglio) { G.fuoco = meglio.chiave; suono('fuoco'); }
  }
  function ciclo(passo) {
    const scelte = G.zone.filter((z) => !z.sfondo); if (!scelte.length) return;
    const i = scelte.findIndex((z) => z.chiave === G.fuoco);
    G.fuoco = scelte[(i + passo + scelte.length) % scelte.length].chiave; suono('fuoco');
  }
  /** Un comando del giocatore (tastiera, gamepad, prove): su giu sx dx avanti indietro usa guarda oggetti diario evidenzia menu. */
  U.comando = function (c) {
    if (AV.audio) AV.audio.sblocca();
    switch (c) {
      case 'su': return naviga(0, -1);
      case 'giu': return naviga(0, 1);
      case 'sx': return naviga(-1, 0);
      case 'dx': return naviga(1, 0);
      case 'avanti': return ciclo(1);
      case 'indietro': return ciclo(-1);
      case 'usa': { const z = zonaFuoco(); if (z && z.usa) return z.usa(); const pred = G.zone.find((x) => x.predefinita); if (pred) return pred.usa(); return naviga(1, 0); }
      case 'guarda': { const z = zonaFuoco(); if (z && z.guarda) return z.guarda(); if (G.testo) return avantiTesto(); return; }
      case 'oggetti': { const z = G.zone.find((x) => x.chiave && x.chiave.startsWith('ogg:')); if (z) G.fuoco = z.chiave; return; }
      case 'diario': if (G.overlay === 'diario') G.overlay = null; else if (!G.titolo && !G.finale) G.overlay = 'diario'; return;
      case 'evidenzia': G.tutti = !G.tutti; return;
      case 'menu':
        if (G.overlay && G.overlay !== 'menu') { G.overlay = G.titolo ? 'menu' : null; G.pagina = 0; return; }
        if (G.overlay === 'menu') { if (!G.titolo) G.overlay = null; G.conferma = false; return; }
        if (G.inMano) { G.inMano = ''; return; }
        if (!G.finale) { G.overlay = 'menu'; G.conferma = false; } return;
      default: return;
    }
  };

  // ------------------------------------------------------------------ testo
  const righeCache = new Map();
  function aCapo(ctx, testo, larg, font) {
    const k = font + '|' + larg + '|' + testo; let r = righeCache.get(k); if (r) return r;
    ctx.font = font; r = [];
    for (const par of String(testo).split('\n')) {
      let riga = '';
      for (const p of par.split(' ')) { const prova = riga ? riga + ' ' + p : p; if (ctx.measureText(prova).width > larg && riga) { r.push(riga); riga = p; } else riga = prova; }
      r.push(riga);
    }
    if (righeCache.size > 400) righeCache.clear();
    righeCache.set(k, r); return r;
  }
  const fnt = (px, stile) => `${stile || ''} ${px}px ${CFG.font}`.trim();
  function scritta(ctx, testo, x, y, px, colore, allinea, stile) { ctx.font = fnt(px, stile); ctx.textAlign = allinea || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = colore; ctx.fillText(testo, x, y); }
  function pannello(ctx, x, y, w, h, alfa, bordo) {
    D.rr(ctx, x, y, w, h, 5); ctx.fillStyle = `rgba(16,10,7,${alfa === undefined ? 0.92 : alfa})`; ctx.fill();
    ctx.strokeStyle = bordo || 'rgba(217,164,86,0.7)'; ctx.lineWidth = 1; ctx.stroke();
  }

  // ------------------------------------------------------------------ disegno di un fotogramma
  function disegnaScena(ctx) {
    const Q = G.quadro; if (!Q) return;
    const f = D.fondale(Q, U.k);
    const [sx, sy] = D.scossa(G.fx, G.t);
    ctx.save(); ctx.translate(sx, sy);
    ctx.drawImage(f.tela, 0, 0, W, H);
    D.atmosfera(ctx, f, G.t);
    const punti = AV.puntiDelQuadro(Q, G.stato);
    const figure = punti.map((p) => ({ p, y: p.y + p.h }));
    figure.push({ fer: true, y: G.fer.y });
    figure.sort((a, b) => a.y - b.y);
    const PF = AV.dati.personaggio.get('ferruccio') || { id: 'ferruccio', figura: { foglio: 'ferruccio', alt: 62 } };
    for (const o of figure) {
      try {
        if (o.fer) { if (Q.senzaFerruccio) continue; const s = 0.86 + 0.14 * Math.max(0, Math.min(1, (G.fer.y - f.suoloY) / (FASCIA - f.suoloY))); D.figura(ctx, PF, G.fer.x, G.fer.y, { cammina: G.fer.cammina, t: G.t, dir: G.fer.dir, alt: ((PF.figura && PF.figura.alt) || 62) * s }); continue; }
        const p = o.p;
        if (p.personaggio) { const P = AV.dati.personaggio.get(p.personaggio); D.figura(ctx, P, p.x + p.w / 2, p.y + p.h, { posa: p.posa, t: G.t, alt: P && P.figura && P.figura.alt ? Math.min(P.figura.alt, p.h * 1.15) : p.h }); }
        else if (p.sagoma) D.sagoma(ctx, p.sagoma, p.x, p.y, p.w, p.h, { posa: p.posa, t: G.t });
      } catch (e) { AV.errore(`punto «${o.p ? o.p.id : 'ferruccio'}» non si disegna: ${e.message}`); }
    }
    D.effetti(ctx, G.fx, G.t, G.dt);
    ctx.restore();
    // punti sensibili (zone) e luci di passaggio
    const esplora = inScena();
    for (const p of punti) {
      const z = zona({ chiave: 'punto:' + p.id, x: p.x, y: p.y, w: p.w, h: p.h, nome: p.nome, punto: p,
        usa: () => agisci(p, 'usa'), guarda: () => agisci(p, 'guarda') });
      if (!esplora) G.zone.pop();
      else z.disegna = true;
    }
    if (esplora) for (const p of punti) {
      const acceso = G.tutti || (G.sotto && G.sotto.chiave === 'punto:' + p.id) || G.fuoco === 'punto:' + p.id;
      if (p.uscita) freccia(ctx, p, acceso);
      if (!acceso) continue;
      const forte = (G.sotto && G.sotto.chiave === 'punto:' + p.id) || G.fuoco === 'punto:' + p.id;
      ctx.save(); ctx.globalAlpha = forte ? 0.75 + 0.25 * Math.sin(G.t * 5) : 0.45;
      D.rr(ctx, p.x - 2, p.y - 2, p.w + 4, p.h + 4, 4); ctx.strokeStyle = p.attivo ? '#ffcf7a' : '#a0938a'; ctx.lineWidth = forte ? 1.5 : 1; ctx.stroke(); ctx.restore();
      etichetta(ctx, G.inMano && forte ? `${(AV.dati.oggetto.get(G.inMano) || { nome: '' }).nome} → ${p.nome}` : p.nome, p.x + p.w / 2, p.y - 5, forte);
    }
    // il nome del quadro, appena si entra
    if (G.etichetta && G.t - G.etichetta.t0 < 3.2 && esplora !== null) {
      const a = Math.min(1, (3.2 - (G.t - G.etichetta.t0)) / 0.8);
      ctx.save(); ctx.globalAlpha = a; scritta(ctx, G.etichetta.testo, 16, 30, 13, '#efe2bd', 'left', 'italic'); ctx.restore();
    }
  }
  function freccia(ctx, p, acceso) {
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2; let a = -Math.PI / 2;
    if (cx < 110) a = Math.PI; else if (cx > 530) a = 0; else if (p.y + p.h > 270) a = Math.PI / 2;
    const off = 3 * Math.sin(G.t * 3);
    ctx.save(); ctx.translate(cx + Math.cos(a) * off, cy + Math.sin(a) * off); ctx.rotate(a);
    ctx.globalAlpha = acceso ? 0.95 : 0.5; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-5, -8); ctx.lineTo(-2, 0); ctx.lineTo(-5, 8); ctx.closePath();
    ctx.fillStyle = p.attivo ? '#ffcf7a' : '#8a7f78'; ctx.fill(); ctx.strokeStyle = '#120b08'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  }
  function etichetta(ctx, testo, x, y, forte) {
    ctx.font = fnt(forte ? 12 : 10); const w = ctx.measureText(testo).width + 12;
    const xx = Math.max(4, Math.min(W - w - 4, x - w / 2)), yy = Math.max(4, y - 16);
    D.rr(ctx, xx, yy, w, 16, 3); ctx.fillStyle = 'rgba(16,10,7,0.85)'; ctx.fill();
    scritta(ctx, testo, xx + w / 2, yy + 12, forte ? 12 : 10, forte ? '#ffe2a8' : '#d9c8a8', 'center');
  }

  function disegnaFascia(ctx) {
    const g = ctx.createLinearGradient(0, FASCIA, 0, H); g.addColorStop(0, '#1d130d'); g.addColorStop(1, '#0b0705');
    ctx.fillStyle = g; ctx.fillRect(0, FASCIA, W, H - FASCIA);
    ctx.fillStyle = 'rgba(217,164,86,0.55)'; ctx.fillRect(0, FASCIA, W, 1);
    const esplora = inScena();
    const inv = G.stato ? G.stato.inventario : [];
    inv.slice(0, 11).forEach((id, i) => {
      const O = AV.dati.oggetto.get(id) || { nome: id, icona: { sagoma: 'cassa' } };
      const x = 8 + i * 46, y = 306;
      const scelto = G.inMano === id, sopra = (G.sotto && G.sotto.chiave === 'ogg:' + id) || G.fuoco === 'ogg:' + id;
      D.rr(ctx, x, y, 42, 44, 4); ctx.fillStyle = scelto ? 'rgba(217,164,86,0.35)' : 'rgba(40,26,16,0.9)'; ctx.fill();
      ctx.strokeStyle = sopra || scelto ? '#ffcf7a' : 'rgba(217,164,86,0.35)'; ctx.stroke();
      if (!(scelto && G.mouse.dentro && G.mouse.y < FASCIA)) D.icona(ctx, O.icona, x + 3, y + 3, 36, 38, G.t);
      if (esplora) zona({ chiave: 'ogg:' + id, x, y, w: 42, h: 44, nome: O.nome, usa: () => prendiInMano(id), guarda: () => guardaOggetto(id) });
      if (sopra && esplora) etichetta(ctx, G.inMano && G.inMano !== id ? `${(AV.dati.oggetto.get(G.inMano) || { nome: '' }).nome} + ${O.nome}` : O.nome, x + 21, y - 2, true);
    });
    const bottone = (chiave, testo, x, fai) => {
      const sopra = (G.sotto && G.sotto.chiave === chiave) || G.fuoco === chiave;
      D.rr(ctx, x, 310, 56, 36, 4); ctx.fillStyle = sopra ? 'rgba(217,164,86,0.3)' : 'rgba(40,26,16,0.9)'; ctx.fill(); ctx.strokeStyle = 'rgba(217,164,86,0.6)'; ctx.stroke();
      scritta(ctx, testo, x + 28, 333, 12, '#efe2bd', 'center');
      if (esplora) zona({ chiave, x, y: 310, w: 56, h: 36, nome: testo, usa: fai });
    };
    bottone('btn:diario', 'Diario', 516, () => U.comando('diario'));
    bottone('btn:menu', 'Menu', 578, () => U.comando('menu'));
    if (G.inMano && esplora) {
      const O = AV.dati.oggetto.get(G.inMano);
      if (O && G.mouse.dentro) D.icona(ctx, O.icona, G.mouse.x + 6, G.mouse.y + 6, 26, 26, G.t);
    }
  }

  function disegnaTesto(ctx) {
    const T = G.testo; if (!T) return;
    T.n = Math.min(T.testo.length, T.n + CFG.velocita[G.opzioni.velocita].cps * G.dt);
    const x = 14, y = 268, w = W - 28, h = 88;
    pannello(ctx, x, y, w, h, 0.94, T.corsivo ? 'rgba(160,170,190,0.6)' : T.colore);
    const font = fnt(14, T.corsivo || T.didascalia ? 'italic' : '');
    const righe = aCapo(ctx, T.testo, w - 36, font);
    let resta = Math.floor(T.n), yy = y + (T.nome ? 40 : 28);
    if (T.nome) { scritta(ctx, T.nome, x + 16, y + 20, 13, T.colore, 'left', 'bold'); }
    for (const r of righe.slice(0, 4)) {
      const parte = r.slice(0, Math.max(0, resta)); resta -= r.length + 1;
      scritta(ctx, parte, x + 16, yy, 14, T.corsivo ? '#cfd6e2' : '#f3e6cc', 'left', T.corsivo || T.didascalia ? 'italic' : '');
      yy += 18;
    }
    if (T.n >= T.testo.length) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(G.t * 5); scritta(ctx, '▸', x + w - 16, y + h - 10, 13, '#ffcf7a', 'center'); ctx.globalAlpha = 1; }
    zona({ chiave: 'testo', x: 0, y: 0, w: W, h: H, sfondo: true, predefinita: true, usa: avantiTesto, guarda: avantiTesto });
  }

  function disegnaBivio(ctx) {
    const B = G.bivio; if (!B) return;
    ctx.fillStyle = 'rgba(5,3,2,0.62)'; ctx.fillRect(0, 0, W, H);
    scritta(ctx, 'Che cosa fa Ferruccio?', W / 2, 64, 16, '#efe2bd', 'center', 'italic');
    const pronto = G.t - B.t0 >= CFG.sicurezzaBivio;
    const n = B.voci.length;
    B.voci.forEach((v, i) => {
      let x, y, w, h;
      if (n === 2) { w = 262; h = 150; x = i === 0 ? 38 : W - 38 - w; y = 96; } else { w = 480; h = Math.min(44, 220 / n - 6); x = 80; y = 90 + i * (h + 6); }
      const chiave = 'voce:' + v.indice, sopra = (G.sotto && G.sotto.chiave === chiave) || G.fuoco === chiave;
      pannello(ctx, x, y, w, h, 0.95, sopra && pronto ? '#ffcf7a' : 'rgba(217,164,86,0.55)');
      if (sopra && pronto) { ctx.fillStyle = 'rgba(217,164,86,0.14)'; D.rr(ctx, x, y, w, h, 5); ctx.fill(); }
      const righe = aCapo(ctx, v.testo, w - 32, fnt(n === 2 ? 17 : 14));
      const alto = righe.length * (n === 2 ? 22 : 17);
      righe.forEach((r, k) => scritta(ctx, r, x + w / 2, y + h / 2 - alto / 2 + (n === 2 ? 17 : 13) + k * (n === 2 ? 22 : 17), n === 2 ? 17 : 14, pronto ? '#f3e6cc' : '#9a8f80', 'center'));
      zona({ chiave, x, y, w, h, nome: v.testo, usa: () => scegli(v.indice) });
    });
    if (n === 2) scritta(ctx, 'oppure', W / 2, 176, 12, '#a89880', 'center', 'italic');
    zona({ chiave: 'fondo-bivio', x: 0, y: 0, w: W, h: H, sfondo: true });
  }

  function disegnaTemi(ctx) {
    const T = G.temi; if (!T) return;
    const D0 = AV.dati.dialogo.get(T.id) || {}; const P = AV.dati.personaggio.get(D0.con);
    const voci = T.lista.map((t) => ({ chiave: 'tema:' + t.id, testo: t.testo, fai: () => sceltaTema(t) }));
    voci.push({ chiave: 'tema:-via', testo: 'Allontanati', fai: allontanati, via: true });
    const rh = 24, h = 34 + voci.length * rh, x = 360, y = Math.max(20, 262 - h), w = 266;
    pannello(ctx, x, y, w, h, 0.94, (P && P.colore) || undefined);
    scritta(ctx, P ? P.nome : 'Gesti', x + 14, y + 20, 13, (P && P.colore) || '#efe2bd', 'left', 'bold');
    voci.forEach((v, i) => {
      const yy = y + 28 + i * rh, sopra = (G.sotto && G.sotto.chiave === v.chiave) || G.fuoco === v.chiave;
      if (sopra) { ctx.fillStyle = 'rgba(217,164,86,0.22)'; ctx.fillRect(x + 6, yy, w - 12, rh - 2); }
      scritta(ctx, (v.via ? '← ' : '• ') + v.testo, x + 16, yy + 16, 13, v.via ? '#b8a890' : sopra ? '#ffe2a8' : '#f3e6cc', 'left', v.via ? 'italic' : '');
      zona({ chiave: v.chiave, x: x + 6, y: yy, w: w - 12, h: rh - 2, nome: v.testo, usa: v.fai });
    });
    zona({ chiave: 'fondo-temi', x: 0, y: 0, w: W, h: H, sfondo: true });
  }

  function disegnaCartello(ctx) {
    const C = G.cartello; if (!C) return;
    const d = G.t - C.t0, a = Math.min(1, d / 0.5, Math.max(0, (C.dura - d) / 0.6));
    if (d >= C.dura) { G.cartello = null; continua(); return; }
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(5,3,2,0.8)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(217,164,86,0.6)'; ctx.fillRect(W / 2 - 90, 150, 180, 1); ctx.fillRect(W / 2 - 90, 206, 180, 1);
    scritta(ctx, C.titolo, W / 2, 186, 26, '#efe2bd', 'center');
    if (C.sotto) scritta(ctx, C.sotto, W / 2, 230, 14, '#c8b898', 'center', 'italic');
    ctx.restore();
    zona({ chiave: 'cartello', x: 0, y: 0, w: W, h: H, sfondo: true, predefinita: true, usa: () => { if (d > 0.5) { G.cartello = null; continua(); } } });
  }

  function disegnaFinale(ctx) {
    const f = G.finale; if (!f) return;
    const d = G.t - f.t0;
    ctx.fillStyle = '#060403'; ctx.fillRect(0, 0, W, H);
    if (f.fase === 0) {
      const a = Math.min(1, d / 1.2);
      ctx.save(); ctx.globalAlpha = a;
      scritta(ctx, 'Finale', W / 2, 130, 13, '#a89880', 'center', 'italic');
      scritta(ctx, f.F.titolo, W / 2, 176, 28, '#efe2bd', 'center');
      aCapo(ctx, f.F.riassunto || '', 460, fnt(14, 'italic')).forEach((r, i) => scritta(ctx, r, W / 2, 214 + i * 19, 14, '#c8b898', 'center', 'italic'));
      ctx.restore();
      if (d > 6) avantiFinale();
    } else if (f.fase === 1) {
      const righe = ['Ferruccio — La Notte Immobile', '', 'Dalla storia di Ferruccio', 'Caserta, 1845', '', 'Teatro d\'ombre, luci e fili d\'oro', '', 'Grazie per aver giocato.'];
      const y0 = 330 - d * 26;
      righe.forEach((r, i) => scritta(ctx, r, W / 2, y0 + i * 26, i === 0 ? 20 : 14, i === 0 ? '#efe2bd' : '#c8b898', 'center', i ? 'italic' : ''));
      if (y0 + righe.length * 26 < 0) avantiFinale();
    } else {
      const tutti = [...AV.dati.finale.values()], visti = tutti.filter((F) => G.finaliVisti.includes(F.id)).length;
      scritta(ctx, 'Finali trovati', W / 2, 120, 22, '#efe2bd', 'center');
      scritta(ctx, `${visti} di ${tutti.length}`, W / 2, 160, 30, '#ffcf7a', 'center');
      scritta(ctx, 'Clic per tornare al menu', W / 2, 220, 12, '#a89880', 'center', 'italic');
    }
    zona({ chiave: 'finale', x: 0, y: 0, w: W, h: H, sfondo: true, predefinita: true, usa: avantiFinale });
  }

  // ------------------------------------------------------------------ menu, Diario, opzioni, capitoli, galleria
  function voceMenu(ctx, chiave, testo, x, y, w, attivo, fai, piccolo) {
    const sopra = attivo && ((G.sotto && G.sotto.chiave === chiave) || G.fuoco === chiave);
    pannello(ctx, x, y, w, piccolo ? 24 : 28, 0.9, sopra ? '#ffcf7a' : 'rgba(217,164,86,0.45)');
    if (sopra) { ctx.fillStyle = 'rgba(217,164,86,0.2)'; D.rr(ctx, x, y, w, piccolo ? 24 : 28, 5); ctx.fill(); }
    scritta(ctx, testo, x + w / 2, y + (piccolo ? 16 : 19), piccolo ? 12 : 14, attivo ? (sopra ? '#ffe2a8' : '#f3e6cc') : '#6f665c', 'center');
    if (attivo) zona({ chiave, x, y, w, h: piccolo ? 24 : 28, nome: testo, usa: () => { suono('tic'); fai(); } });
  }
  function fondoOverlay(ctx) { ctx.fillStyle = 'rgba(5,3,2,0.78)'; ctx.fillRect(0, 0, W, H); zona({ chiave: 'fondo-overlay', x: 0, y: 0, w: W, h: H, sfondo: true }); }

  function disegnaMenu(ctx) {
    fondoOverlay(ctx);
    scritta(ctx, 'Ferruccio', W / 2, 66, 34, '#efe2bd', 'center');
    scritta(ctx, 'La Notte Immobile', W / 2, 92, 15, '#d9a456', 'center', 'italic');
    const s = U.leggiSlot(G.slot);
    const inCorso = G.stato && !G.titoloSolo;
    const x = W / 2 - 110, w = 220; let y = 112;
    voceMenu(ctx, 'm:continua', 'Continua', x, y, w, !!(inCorso || (s && s.stato)), continuaPartita); y += 34;
    voceMenu(ctx, 'm:nuova', G.conferma ? `Cancella lo slot ${G.slot} e ricomincia?` : 'Nuova storia', x, y, w, true, () => { if (s && s.stato && !G.conferma) { G.conferma = true; return; } G.titoloSolo = false; nuovaStoria(); }); y += 34;
    voceMenu(ctx, 'm:capitoli', 'Capitoli', x, y, w, true, () => { G.overlay = 'capitoli'; G.pagina = 0; }); y += 34;
    voceMenu(ctx, 'm:finali', `Finali trovati (${G.finaliVisti.filter((id) => AV.dati.finale.has(id)).length} di ${AV.dati.finale.size})`, x, y, w, true, () => { G.overlay = 'finali'; G.pagina = 0; }); y += 34;
    voceMenu(ctx, 'm:opzioni', 'Opzioni', x, y, w, true, () => { G.overlay = 'opzioni'; }); y += 38;
    for (let n = 1; n <= SLOT; n++) {
      const sn = U.leggiSlot(n);
      const testo = `${G.slot === n ? '◆' : '◇'} ${n}${sn && sn.stato ? ' · ' + (sn.quadroNome || '…').slice(0, 14) : ' · vuoto'}`;
      voceMenu(ctx, 'm:slot' + n, testo, W / 2 - 225 + (n - 1) * 152, y, 146, true, () => { if (G.slot !== n) { G.slot = n; G.conferma = false; scrivi('slot', n); if (G.stato && !G.titoloSolo) { G.stato = null; G.titoloSolo = true; G.titolo = true; } } }, true);
    }
    scritta(ctx, 'clic = usa · clic destro o pressione lunga = guarda · H = mostra i punti · I oggetti · D Diario · Esc menu', W / 2, 348, 9.5, '#8a7f70', 'center', 'italic');
  }

  function disegnaDiario(ctx) {
    fondoOverlay(ctx);
    pannello(ctx, 24, 18, W - 48, 324, 0.97);
    scritta(ctx, 'Diario di Ferruccio', W / 2, 44, 18, '#efe2bd', 'center');
    const S = G.stato || AV.nuovoStato();
    scritta(ctx, 'Che cosa manca', 44, 72, 12, '#d9a456', 'left', 'bold');
    let y = 90;
    for (const r of aCapo(ctx, S.obiettivo || '—', 260, fnt(13, 'italic')).slice(0, 3)) { scritta(ctx, r, 44, y, 13, '#f3e6cc', 'left', 'italic'); y += 17; }
    y += 8; scritta(ctx, 'Che cosa so', 44, y, 12, '#d9a456', 'left', 'bold'); y += 18;
    const righe = []; for (const d of S.diario) for (const [i, r] of aCapo(ctx, d, 260, fnt(12)).entries()) righe.push((i ? '   ' : '· ') + r);
    for (const r of righe.slice(-Math.floor((330 - y) / 15))) { scritta(ctx, r, 44, y, 12, '#e6d8be', 'left'); y += 15; }
    let y2 = 72;
    scritta(ctx, 'Decisioni', 340, y2, 12, '#d9a456', 'left', 'bold'); y2 += 18;
    const dec = AV.decisioniPrese(S);
    if (!dec.length) { scritta(ctx, 'Nessuna, per ora.', 340, y2, 12, '#a89880', 'left', 'italic'); y2 += 15; }
    for (const d of dec.slice(0, 8)) { scritta(ctx, `${d.nome}: ${d.valore.replace(/-/g, ' ')}`, 340, y2, 12, '#e6d8be', 'left'); y2 += 15; }
    y2 += 10; scritta(ctx, 'Ciò che porta con sé', 340, y2, 12, '#d9a456', 'left', 'bold'); y2 += 8;
    S.inventario.slice(0, 12).forEach((id, i) => {
      const O = AV.dati.oggetto.get(id) || { nome: id }; const x = 340 + (i % 2) * 130, yy = y2 + Math.floor(i / 2) * 30;
      D.icona(ctx, O.icona, x, yy, 24, 24, G.t); scritta(ctx, O.nome.slice(0, 36), x + 28, yy + 16, 11, '#e6d8be', 'left');
    });
    voceMenu(ctx, 'd:chiudi', 'Chiudi', W / 2 - 50, 310, 100, true, () => { G.overlay = null; }, true);
  }

  function disegnaOpzioni(ctx) {
    fondoOverlay(ctx);
    pannello(ctx, 150, 70, 340, 220, 0.97);
    scritta(ctx, 'Opzioni', W / 2, 100, 18, '#efe2bd', 'center');
    const o = G.opzioni;
    scritta(ctx, `Volume: ${o.volume}`, W / 2, 136, 14, '#f3e6cc', 'center');
    voceMenu(ctx, 'o:vol-', '−', 190, 120, 40, true, () => { o.volume = Math.max(0, o.volume - 1); applicaOpzioni(); }, true);
    voceMenu(ctx, 'o:vol+', '+', 410, 120, 40, true, () => { o.volume = Math.min(10, o.volume + 1); applicaOpzioni(); }, true);
    voceMenu(ctx, 'o:vel', `Velocità del testo: ${CFG.velocita[o.velocita].nome}`, 190, 160, 260, true, () => { o.velocita = (o.velocita + 1) % CFG.velocita.length; applicaOpzioni(); });
    voceMenu(ctx, 'o:schermo', 'Schermo intero', 190, 198, 260, true, schermoIntero);
    voceMenu(ctx, 'o:indietro', 'Indietro', 190, 248, 260, true, () => { G.overlay = 'menu'; });
  }
  function applicaOpzioni() { scrivi('opzioni', G.opzioni); if (AV.audio) AV.audio.volume(G.opzioni.volume / 10); }
  function schermoIntero() {
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* non disponibile */ }
  }

  function disegnaCapitoli(ctx) {
    fondoOverlay(ctx);
    scritta(ctx, 'Capitoli', W / 2, 50, 20, '#efe2bd', 'center');
    scritta(ctx, `Slot ${G.slot}: si riparte dall'inizio del capitolo, com'era quando ci si è entrati.`, W / 2, 72, 11, '#a89880', 'center', 'italic');
    const s = G.stato && !G.titoloSolo ? { capitoli: G.capitoliSalvati } : (U.leggiSlot(G.slot) || { capitoli: {} });
    const caps = Object.keys(s.capitoli || {}).map((id) => AV.dati.capitolo.get(id)).filter(Boolean).sort((a, b) => a.ordine - b.ordine);
    if (!caps.length) scritta(ctx, 'Nessun capitolo raggiunto in questo slot.', W / 2, 150, 14, '#c8b898', 'center', 'italic');
    caps.slice(0, 8).forEach((C, i) => voceMenu(ctx, 'c:' + C.id, `${C.titolo}${C.sottotitolo ? ' — ' + C.sottotitolo : ''}`, 120, 88 + i * 30, 400, true, () => avviaDa(AV.copia(s.capitoli[C.id]), s.capitoli), true));
    voceMenu(ctx, 'c:indietro', 'Indietro', W / 2 - 60, 330, 120, true, () => { G.overlay = 'menu'; }, true);
  }

  function disegnaFinali(ctx) {
    fondoOverlay(ctx);
    const tutti = [...AV.dati.finale.values()].sort((a, b) => (a.percorso || 0) - (b.percorso || 0));
    const visti = tutti.filter((F) => G.finaliVisti.includes(F.id));
    scritta(ctx, `Finali trovati: ${visti.length} di ${tutti.length}`, W / 2, 40, 18, '#efe2bd', 'center');
    const perPagina = 7, pagine = Math.max(1, Math.ceil(tutti.length / perPagina)); G.pagina = Math.min(G.pagina, pagine - 1);
    tutti.slice(G.pagina * perPagina, (G.pagina + 1) * perPagina).forEach((F, i) => {
      const y = 56 + i * 38, visto = G.finaliVisti.includes(F.id);
      pannello(ctx, 60, y, 520, 34, 0.9, visto ? 'rgba(217,164,86,0.6)' : 'rgba(120,110,100,0.4)');
      scritta(ctx, visto ? F.titolo : '— non ancora trovato —', 72, y + 14, 12, visto ? '#ffe2a8' : '#7d746a', 'left', visto ? 'bold' : 'italic');
      if (visto) scritta(ctx, (F.riassunto || '').slice(0, 92), 72, y + 28, 10.5, '#d8c8aa', 'left', 'italic');
    });
    if (pagine > 1) {
      voceMenu(ctx, 'f:prima', '‹', 60, 330, 40, G.pagina > 0, () => { G.pagina--; }, true);
      voceMenu(ctx, 'f:dopo', '›', 540, 330, 40, G.pagina < pagine - 1, () => { G.pagina++; }, true);
    }
    voceMenu(ctx, 'f:indietro', 'Indietro', W / 2 - 60, 330, 120, true, () => { G.overlay = 'menu'; }, true);
  }

  const TITOLO = { id: '_titolo', nome: '', fondale: { disegno: [['cielo', { tono: 'notte', luna: true }], ['case', { n: 7, finestre: 2, alto: 120 }],
    ['suolo', { tipo: 'selciato', y: 262 }], ['lampione', { x: 96, y: 262, h: 120 }], ['lampione', { x: 548, y: 262, h: 110 }], ['quinte', { colore: '#3a1418' }], ['fili', { n: 6 }]] } };

  function fotogramma(ctx) {
    G.zone = [];
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (G.titolo || !G.quadro) { const f = D.fondale(TITOLO, U.k); ctx.drawImage(f.tela, 0, 0, W, H); D.atmosfera(ctx, f, G.t); if (!G.overlay && !G.finale) G.overlay = 'menu'; }
    else { muoviFerruccio(G.dt); disegnaScena(ctx); disegnaFascia(ctx); }
    if (G.finale) { G.zone = []; disegnaFinale(ctx); }
    else if (G.overlay) {
      G.zone = [];
      ({ menu: disegnaMenu, diario: disegnaDiario, opzioni: disegnaOpzioni, capitoli: disegnaCapitoli, finali: disegnaFinali }[G.overlay] || disegnaMenu)(ctx);
    } else {
      if (G.attesa && G.t >= G.attesa.fino) { G.attesa = null; continua(); }
      if (G.attesa) zona({ chiave: 'attesa', x: 0, y: 0, w: W, h: H, sfondo: true, predefinita: true, usa: () => { G.attesa = null; continua(); } });
      disegnaTemi(ctx); disegnaTesto(ctx); disegnaBivio(ctx); disegnaCartello(ctx);
    }
    if (G.fuoco && !G.zone.some((z) => z.chiave === G.fuoco)) G.fuoco = null;
    const z = zonaFuoco();
    if (z && (z.chiave.startsWith('m:') || z.chiave.startsWith('c:') || z.chiave.startsWith('o:') || z.chiave.startsWith('f:') || z.chiave.startsWith('d:'))) { /* già evidenziata dal disegno */ }
    G.sotto = G.mouse.dentro ? zonaIn(G.mouse.x, G.mouse.y) : null;
    if (U.canvas) U.canvas.style.cursor = G.sotto && !G.sotto.sfondo ? 'pointer' : 'default';
  }

  // ------------------------------------------------------------------ suoni
  function suono(nome) { try { if (AV.audio) AV.audio.suono(nome); } catch (e) { /* l'audio non ferma mai il gioco */ } }

  // ------------------------------------------------------------------ ingresso: mouse, tocco, tastiera, gamepad
  function logico(e) { const r = U.canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }; }
  function clicLogico(x, y, verbo) {
    if (AV.audio) AV.audio.sblocca();
    G.sotto = zonaIn(x, y);
    const z = G.sotto; if (!z) return;
    if (verbo === 'guarda') {
      if (G.inMano && inScena() && !(z.chiave || '').startsWith('ogg:')) { G.inMano = ''; return; }
      if (z.guarda) z.guarda(); else if (z.usa && (z.sfondo || z.predefinita)) z.usa();
    } else if (z.usa) z.usa();
  }
  U.clicLogico = clicLogico;

  function collegaIngressi(c) {
    let premuto = null;
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('pointermove', (e) => { const p = logico(e); G.mouse = { x: p.x, y: p.y, dentro: e.pointerType !== 'touch' || !!premuto }; });
    c.addEventListener('pointerleave', () => { G.mouse.dentro = false; });
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault(); const p = logico(e);
      G.mouse = { x: p.x, y: p.y, dentro: true };
      if (e.button === 2) { clicLogico(p.x, p.y, 'guarda'); premuto = null; return; }
      if (e.button !== 0) return;
      premuto = { x: p.x, y: p.y, t: G.t, id: e.pointerId, tocco: e.pointerType === 'touch', fatto: false,
        timer: setTimeout(() => { if (premuto && !premuto.fatto) { premuto.fatto = true; clicLogico(premuto.x, premuto.y, 'guarda'); } }, CFG.pressioneLunga * 1000) };
    });
    c.addEventListener('pointerup', (e) => {
      if (!premuto || e.pointerId !== premuto.id) return;
      clearTimeout(premuto.timer);
      const p = premuto; premuto = null;
      if (!p.fatto) clicLogico(p.x, p.y, 'usa');
      if (p.tocco) G.mouse.dentro = false;
    });
    c.addEventListener('pointercancel', () => { if (premuto) clearTimeout(premuto.timer); premuto = null; });
    const TASTI = { ArrowUp: 'su', ArrowDown: 'giu', ArrowLeft: 'sx', ArrowRight: 'dx', Enter: 'usa', ' ': 'usa', e: 'usa', E: 'usa', q: 'guarda', Q: 'guarda', g: 'guarda', G: 'guarda',
      i: 'oggetti', I: 'oggetti', d: 'diario', D: 'diario', h: 'evidenzia', H: 'evidenzia', Escape: 'menu', w: 'su', s: 'giu', a: 'sx' };
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); U.comando(e.shiftKey ? 'indietro' : 'avanti'); return; }
      if (e.key >= '1' && e.key <= '9' && G.bivio) { const v = G.bivio.voci[Number(e.key) - 1]; if (v) { G.fuoco = 'voce:' + v.indice; } return; }
      const c2 = TASTI[e.key]; if (!c2) return;
      if (e.repeat && (c2 === 'usa' || c2 === 'menu' || c2 === 'diario' || c2 === 'evidenzia')) return;
      e.preventDefault(); U.comando(c2);
    });
  }
  const pad = { prima: {}, ripeti: 0 };
  function leggiGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const gp = [...navigator.getGamepads()].find(Boolean); if (!gp) return;
    const MAPPA = { 0: 'usa', 1: 'guarda', 2: 'evidenzia', 3: 'diario', 8: 'oggetti', 9: 'menu', 12: 'su', 13: 'giu', 14: 'sx', 15: 'dx', 4: 'indietro', 5: 'avanti' };
    for (const [b, c] of Object.entries(MAPPA)) { const giu = gp.buttons[b] && gp.buttons[b].pressed; if (giu && !pad.prima[b]) U.comando(c); pad.prima[b] = giu; }
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (Math.abs(ax) > 0.55 || Math.abs(ay) > 0.55) {
      if (G.t > pad.ripeti) { U.comando(Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'dx' : 'sx') : (ay > 0 ? 'giu' : 'su')); pad.ripeti = G.t + 0.28; }
    } else pad.ripeti = 0;
  }

  // ------------------------------------------------------------------ avvio e ciclo
  function adatta() {
    const c = U.canvas, vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / W, vh / H), cw = Math.floor(W * s), ch = Math.floor(H * s);
    c.style.width = cw + 'px'; c.style.height = ch + 'px'; c.style.left = Math.floor((vw - cw) / 2) + 'px'; c.style.top = Math.floor((vh - ch) / 2) + 'px';
    const k = Math.max(1, Math.round(s * (window.devicePixelRatio || 1) * 100) / 100);
    c.width = Math.round(W * k); c.height = Math.round(H * k); U.k = k; D.sporca();
  }
  /** Avvia l'interfaccia sul canvas dato. */
  U.avvia = function (canvas) {
    U.canvas = canvas; const ctx = canvas.getContext('2d');
    G.slot = leggi('slot', 1); G.finaliVisti = leggi('finali', []); G.opzioni = Object.assign(G.opzioni, leggi('opzioni', {}));
    if (!CFG.velocita[G.opzioni.velocita]) G.opzioni.velocita = 1;
    if (AV.audio) AV.audio.volume(G.opzioni.volume / 10);
    adatta(); window.addEventListener('resize', adatta);
    collegaIngressi(canvas);
    let prima = performance.now();
    const giro = (ora) => {
      G.dt = Math.min(0.1, Math.max(0, (ora - prima) / 1000)); prima = ora; G.t += G.dt;
      try { leggiGamepad(); ctx.setTransform(U.k, 0, 0, U.k, 0, 0); ctx.imageSmoothingEnabled = true; fotogramma(ctx); }
      catch (e) { if (!U._ultimo || U._ultimo !== e.message) { U._ultimo = e.message; AV.errore('fotogramma: ' + e.message); } }
      requestAnimationFrame(giro);
    };
    requestAnimationFrame(giro);
    if (quadroDaIndirizzo()) nuovaStoria();
  };
})(AV);
