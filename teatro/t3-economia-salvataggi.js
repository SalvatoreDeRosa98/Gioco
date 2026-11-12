/*
 * Teatro delle Marionette — passo T3 della roadmap «Novità nel Teatro» (production/roadmap-teatro-novita.md).
 *
 * Script CLASSICO (non modulo), caricato subito dopo lo script principale di gioco/teatro_marionette.html.
 * Legge gli interni del Teatro da window.__teatroInterno (unico punto di esposizione nel file principale) e
 * restituisce i propri ganci in window.__teatroT3, che il file principale chiama con `?.` (se questo script
 * manca, il gioco funziona come prima).
 *
 * Contiene:
 *   - [M] muto (persistente) e allineamento del bottone «Audio» (la campana d'ingresso è un gancio nel file).
 *   - Patto potente: raggio cremisi continuo (Raggio Cremisi del Velo: si tiene la freccia, danno continuo
 *     sulla linea fino al muro) e colpi spettrali (Cuore Sacro di San Leucio: passano colonne, bracieri e
 *     muri); conferma in pagina «−1 maschera massima per sempre» prima di ogni patto.
 *   - Cinque slot di salvataggio in localStorage (chiave ferruccio.teatro.slot.<n>): personaggio, piano
 *     massimo, scintille (monete di luce), flag della trama, data. Riga «Slot 1-5» nel menu dei personaggi,
 *     cancellazione con conferma in pagina. Ogni accesso a localStorage è in try/catch.
 * L'economia (prezzi e drop) è nella tabella ECONOMIA_T3 del file principale; vedi gioco/teatro/sim-economia.js.
 */
(function () {
  'use strict';

  const T = window.__teatroInterno;
  if (!T) {
    console.warn('[T3] window.__teatroInterno assente: economia/salvataggi T3 non attivi.');
    return;
  }
  const { W, H, ARENA, canvas, statoRun, player, keys, AudioSys, drawTextFit } = T;

  // ===========================================================================
  // CONFIGURAZIONE (tutti i numeri e i testi del passo T3)
  // ===========================================================================
  const CONFIG = Object.freeze({
    raggio: Object.freeze({
      idOggetto: 'patto_raggio',
      ogniTick: 5,            // un impulso di danno ogni 5 tick (12 al secondo)
      dannoPerImpulso: 0.18,  // frazione di statoRun.dmg per impulso: 2,16 x DMG al secondo (i colpi ~2,7 x; il raggio trapassa e non manca mai). Era 0,3: troppo forte (autore, 2026-11-09)
      larghezzaPx: 10,        // spessore utile del raggio (si somma al raggio del nemico)
      origineAvantiPx: 10,    // il raggio parte poco davanti al burattino
      colori: Object.freeze({ alone: 'rgba(220, 20, 40, 0.30)', corpo: '#dc2626', anima: '#fde2e2' }),
    }),
    spettrali: Object.freeze({ idOggetto: 'patto_sacro' }),
    salvataggi: Object.freeze({
      prefisso: 'ferruccio.teatro.slot.',
      chiaveAttivo: 'ferruccio.teatro.slotAttivo',
      chiaveMuto: 'ferruccio.teatro.muto',
      numero: 5,
      scintillePerBoss: 1,    // monete di luce: +1 per ogni boss sconfitto (segnaposto finché l'hub T4 non le usa)
      versione: 1,
    }),
    menu: Object.freeze({ rigaY: 284, rigaH: 14, etichettaX: 35, boxX: 84, boxW: 100, boxGap: 4 }),
    avvisoMs: 1600,
  });

  const TESTI = Object.freeze({
    pattoTitolo: 'STRINGERE IL PATTO D\'OMBRA?',
    pattoCosto: '−1 maschera massima per sempre',
    pattoSi: '[E / Invio] Sì, stringo il patto',
    pattoNo: '[Esc / N] No',
    pattoRifiutato: 'Hai rifiutato il Patto d\'Ombra. Le reliquie restano sull\'altare.',
    cancellaTitolo: (n) => `CANCELLARE LO SLOT ${n}?`,
    cancellaAvviso: 'Il salvataggio si perde per sempre.',
    cancellaSi: '[S / Invio] Sì, cancella',
    cancellaNo: '[N / Esc] No',
    // (f1) col tocco e col gamepad: domanda semplice, «No» scelto in partenza
    cancellaSicuraTitolo: 'Cancellare questo salvataggio?',
    cancellaSicuraSi: 'Sì',
    cancellaSicuraNo: 'No',
    aiuto: '[W/S] o click: scegli lo slot · [Canc] cancella · [M] muto',
    muto: 'Audio: muto [M]',
    sonoro: 'Audio: attivo [M]',
  });

  // Il patto diventa potente: le descrizioni delle reliquie dicono cosa fanno davvero.
  for (const p of T.CATALOGO_PATTO) {
    if (p.id === CONFIG.raggio.idOggetto) {
      p.statsDesc = '[😈 PATTO] Raggio Cremisi continuo: tieni la freccia, danno su tutta la linea · Danno x2.1';
    } else if (p.id === CONFIG.spettrali.idOggetto) {
      p.mod = { ...p.mod, spettrali: true };
      p.statsDesc = '[😈 PATTO] Colpi Spettrali: passano colonne e muri · Danno x2.3 · Rigenera la vita';
    }
  }

  // ===========================================================================
  // UTILITÀ
  // ===========================================================================
  const haOggetto = (id) => statoRun.oggettiEquipaggiati.some((o) => o && o.id === id);
  const haModSpettrali = () => statoRun.oggettiEquipaggiati.some((o) => o && o.mod && o.mod.spettrali);

  let avviso = null; // { testo, finoMs }
  function mostraAvviso(testo) {
    avviso = { testo, finoMs: performance.now() + CONFIG.avvisoMs };
  }

  function coordCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }
  const dentro = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

  // ===========================================================================
  // SALVATAGGI: 5 slot in localStorage (try/catch su ogni accesso)
  // ===========================================================================
  const S = CONFIG.salvataggi;
  const memoria = {
    leggi(k) { try { return window.localStorage.getItem(k); } catch (_) { return null; } },
    scrivi(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (_) { return false; } },
    togli(k) { try { window.localStorage.removeItem(k); return true; } catch (_) { return false; } },
  };

  /** Rende valido un salvataggio letto dal disco (campi mancanti o di tipo sbagliato tornano ai default). */
  function normalizzaSlot(d) {
    if (!d || typeof d !== 'object') return null;
    const personaggio = T.PERSONAGGI_GIOCABILI[d.personaggio] ? d.personaggio : 'ferruccio';
    return {
      versione: S.versione,
      personaggio,
      pianoMassimo: Math.max(1, Math.floor(Number(d.pianoMassimo) || 1)),
      scintille: Math.max(0, Math.floor(Number(d.scintille) || 0)),
      flag: d.flag && typeof d.flag === 'object' && !Array.isArray(d.flag) ? { ...d.flag } : {},
      data: typeof d.data === 'string' ? d.data : new Date().toISOString(),
    };
  }

  function leggiSlot(n) {
    const raw = memoria.leggi(S.prefisso + n);
    if (!raw) return null;
    try { return normalizzaSlot(JSON.parse(raw)); } catch (_) { return null; }
  }

  const slots = {};
  for (let n = 1; n <= S.numero; n++) slots[n] = leggiSlot(n);

  let slotAttivo = (() => {
    const n = parseInt(memoria.leggi(S.chiaveAttivo), 10);
    return n >= 1 && n <= S.numero ? n : 1;
  })();

  function scriviSlot(n, dati) {
    const d = normalizzaSlot({ ...dati, data: new Date().toISOString() });
    slots[n] = d;
    memoria.scrivi(S.prefisso + n, JSON.stringify(d));
    return d;
  }

  function scegliSlot(n) {
    if (!(n >= 1 && n <= S.numero)) return;
    slotAttivo = n;
    memoria.scrivi(S.chiaveAttivo, String(n));
    if (slots[n]) T.selezionaPersonaggio(slots[n].personaggio);
  }

  function cancellaSlot(n) {
    slots[n] = null;
    memoria.togli(S.prefisso + n);
  }

  /** Il salvataggio dello slot attivo, creato al primo bisogno. */
  function slotCorrente() {
    if (!slots[slotAttivo]) {
      slots[slotAttivo] = normalizzaSlot({ personaggio: statoRun.personaggioId, pianoMassimo: 1, scintille: 0, flag: {} });
    }
    return slots[slotAttivo];
  }

  /** Osserva la partita e salva solo quando qualcosa cambia (nessun gancio nel file principale). */
  function sorvegliaPartita() {
    if (statoRun.fase !== 'in_gioco') return;
    const d = slotCorrente();
    let cambiato = !memoria.leggi(S.prefisso + slotAttivo);
    if (d.personaggio !== statoRun.personaggioId) { d.personaggio = statoRun.personaggioId; cambiato = true; }
    if (statoRun.piano > d.pianoMassimo) { d.pianoMassimo = statoRun.piano; cambiato = true; }
    const st = statoRun.stanzaCorrente;
    if (st && st.tipo === 'boss' && st.pulita && !st.__t3Scintilla) {
      st.__t3Scintilla = true;
      d.scintille += S.scintillePerBoss;
      cambiato = true;
    }
    if (cambiato) scriviSlot(slotAttivo, d);
  }
  setInterval(sorvegliaPartita, 250);

  // Al caricamento lo slot ricordato riporta il suo personaggio nel menu.
  scegliSlot(slotAttivo);

  // ===========================================================================
  // MUTO [M]
  // ===========================================================================
  function aggiornaBottoneAudio() {
    const b = document.getElementById('btn-audio');
    if (b) b.textContent = AudioSys.attivo ? '🔊 Audio: ON' : '🔇 Audio: OFF';
  }
  function impostaMuto(muto, conAvviso) {
    AudioSys.attivo = !muto;
    memoria.scrivi(S.chiaveMuto, muto ? '1' : '0');
    aggiornaBottoneAudio();
    if (conAvviso) mostraAvviso(muto ? TESTI.muto : TESTI.sonoro);
  }
  if (memoria.leggi(S.chiaveMuto) === '1') impostaMuto(true, false);
  const btnAudio = document.getElementById('btn-audio');
  if (btnAudio) {
    // Il bottone ha già il suo gestore nel file principale: qui si ricorda soltanto la scelta.
    btnAudio.addEventListener('click', () => memoria.scrivi(S.chiaveMuto, AudioSys.attivo ? '0' : '1'));
  }

  // ===========================================================================
  // PATTO: conferma «−1 maschera massima per sempre»
  // ===========================================================================
  let confermaPatto = null; // { item, refSlot }
  let pattoGiaConfermato = false;

  /** Gancio chiamato da acquisisciOggettoConLimite5Slot: true = «aspetta, chiedo conferma». */
  function chiediConfermaPatto(item, refSlot) {
    if (pattoGiaConfermato) return false;
    confermaPatto = { item, refSlot };
    for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) keys[k] = false;
    return true;
  }

  function rispondiPatto(si) {
    const c = confermaPatto;
    confermaPatto = null;
    if (!c) return;
    if (!si) { T.mostraBanner(TESTI.pattoRifiutato, 140); return; }
    pattoGiaConfermato = true;
    try { T.acquisisciOggettoConLimite5Slot({ ...c.item }, 'patto', c.refSlot); } finally { pattoGiaConfermato = false; }
  }

  const BOX_PATTO = { x: 120, y: 92, w: 400, h: 168 };
  const BTN_PATTO_SI = { x: 150, y: 218, w: 180, h: 26 };
  const BTN_PATTO_NO = { x: 350, y: 218, w: 140, h: 26 };

  // ===========================================================================
  // RAGGIO CREMISI CONTINUO
  // ===========================================================================
  const raggio = { attivo: false, dx: 0, dy: 0, ox: 0, oy: 0, ex: 0, ey: 0, tickUltimo: -1, impulsi: 0 };

  function direzioneFrecce() {
    if (keys.ArrowRight || keys.KeyL) return [1, 0];
    if (keys.ArrowLeft || keys.KeyJ) return [-1, 0];
    if (keys.ArrowUp || keys.KeyI) return [0, -1];
    if (keys.ArrowDown || keys.KeyK) return [0, 1];
    if (mouseRaggio.giu) { // col raggio il mouse spara il raggio (tenuto premuto), non i colpi
      const dx = mouseRaggio.x - player.x, dy = mouseRaggio.y - player.y;
      if (Math.abs(dx) >= Math.abs(dy)) return [dx >= 0 ? 1 : -1, 0];
      return [0, dy >= 0 ? 1 : -1];
    }
    return null;
  }

  // Mouse e raggio: con il Raggio Cremisi il click (tenuto) punta il raggio verso il cursore.
  const mouseRaggio = { giu: false, x: 0, y: 0 };
  const posMouse = (e) => {
    const r = canvas.getBoundingClientRect();
    mouseRaggio.x = (e.clientX - r.left) * (W / r.width);
    mouseRaggio.y = (e.clientY - r.top) * (H / r.height);
  };
  canvas.addEventListener('mousedown', (e) => { if (e.button === 0) { mouseRaggio.giu = true; posMouse(e); } });
  canvas.addEventListener('mousemove', (e) => { if (mouseRaggio.giu) posMouse(e); });
  window.addEventListener('mouseup', () => { mouseRaggio.giu = false; });
  window.addEventListener('blur', () => { mouseRaggio.giu = false; });
  // Il click di 70-input spara un colpo nelle 4 direzioni: col raggio non deve.
  if (typeof eseguiAttacco4Direzioni === 'function') {
    const attaccoBaseT3 = eseguiAttacco4Direzioni;
    eseguiAttacco4Direzioni = function (...a) {
      if (haOggetto(CONFIG.raggio.idOggetto) && !confermaPatto) return;
      return attaccoBaseT3.apply(this, a);
    };
  }

  function distanzaPuntoSegmento(px, py, ax, ay, bx, by) {
    const vx = bx - ax, vy = by - ay;
    const l2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2));
    return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
  }

  /** Gancio per tick (prima degli attacchi con le frecce). Con il raggio acceso i colpi restano fermi. */
  function aggiornaRaggio(st) {
    raggio.attivo = false;
    if (!st || !haOggetto(CONFIG.raggio.idOggetto) || confermaPatto) return;
    const dir = direzioneFrecce();
    if (!dir) { raggio.impulsi = 0; return; }
    const [dx, dy] = dir;
    player.dirX = dx; player.dirY = dy;
    if (dx !== 0) player.flipX = dx < 0;
    player.cooldown = Math.max(player.cooldown, 2); // eseguiAttacco4Direzioni non spara colpi
    player.shootAnimTimer = Math.max(player.shootAnimTimer, 2);

    const ox = player.x + dx * CONFIG.raggio.origineAvantiPx;
    const oy = player.y - 6 + dy * CONFIG.raggio.origineAvantiPx;
    const ex = dx > 0 ? ARENA.x2 + 8 : dx < 0 ? ARENA.x1 - 8 : ox;
    const ey = dy > 0 ? ARENA.y2 + 8 : dy < 0 ? ARENA.y1 - 8 : oy;
    Object.assign(raggio, { attivo: true, dx, dy, ox, oy, ex, ey, tickUltimo: T.tick });

    if (raggio.impulsi++ % CONFIG.raggio.ogniTick !== 0) return;
    for (const nem of st.nemici) {
      if (nem.hp <= 0 || (nem.airZ || 0) > 16) continue;
      if (distanzaPuntoSegmento(nem.x, nem.y - 6, ox, oy, ex, ey) <= nem.r + CONFIG.raggio.larghezzaPx / 2) {
        // Spinta nulla: niente hit-stop né scossa a ogni impulso (il raggio è continuo).
        T.danneggiaNemico(nem, statoRun.dmg * CONFIG.raggio.dannoPerImpulso, 0, 0);
      }
    }
    if (st.muroSegreto && !st.muroSegreto.aperto) {
      const pos = { N: [320, ARENA.y1], S: [320, ARENA.y2], W: [ARENA.x1, 188], E: [ARENA.x2, 188] }[st.muroSegreto.lato];
      // --- C: inizio --- ogni impulso del raggio sul muro giusto è un colpo: ne servono 3 (niente apertura diretta)
      if (pos && distanzaPuntoSegmento(pos[0], pos[1], ox, oy, ex, ey) < 26) T.colpisciMuroSegretoC(st, pos[0], pos[1]);
      // --- C: fine ---
    }
  }

  function disegnaRaggio(ctx) {
    if (!raggio.attivo || T.tick - raggio.tickUltimo > 2 || statoRun.fase !== 'in_gioco') return;
    const pulsa = Math.sin(performance.now() / 45);
    const larg = CONFIG.raggio.larghezzaPx;
    ctx.save();
    ctx.lineCap = 'round';
    const tratti = [
      [CONFIG.raggio.colori.alone, larg + 6 + pulsa * 2],
      [CONFIG.raggio.colori.corpo, larg * 0.6 + pulsa],
      [CONFIG.raggio.colori.anima, 2],
    ];
    for (const [colore, spessore] of tratti) {
      ctx.strokeStyle = colore;
      ctx.lineWidth = spessore;
      ctx.beginPath();
      ctx.moveTo(raggio.ox, raggio.oy);
      ctx.lineTo(raggio.ex, raggio.ey);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ===========================================================================
  // MENU: riga «Slot 1-5» e conferma di cancellazione
  // ===========================================================================
  let confermaCancella = null; // numero dello slot da cancellare
  const M = CONFIG.menu;
  const boxSlot = (n) => ({ x: M.boxX + (n - 1) * (M.boxW + M.boxGap), y: M.rigaY, w: M.boxW, h: M.rigaH });
  const boxCroce = (n) => { const b = boxSlot(n); return { x: b.x + b.w - 13, y: b.y + 1, w: 12, h: b.h - 2 }; };
  const BOX_CANC = { x: 150, y: 110, w: 340, h: 140 };
  const BTN_CANC_SI = { x: 172, y: 210, w: 150, h: 26 };
  const BTN_CANC_NO = { x: 336, y: 210, w: 132, h: 26 };
  // (f1) Cancellazione sicura col tocco e col gamepad: il tasto [Canc] lì non c'è (o sta sotto il pollice).
  // Col tocco al posto della ✕ c'è un cestino con un'area di tocco più larga dello slot; la conferma parte su «No»
  // e [Invio]/A conferma la scelta evidenziata. Con tastiera e mouse resta tutto com'era.
  const CESTINO = Object.freeze({ w: 14, tocco: Object.freeze({ sx: 26, dx: 4, su: 8, giu: 8 }) });
  const modoSicuroCanc = () => typeof b3 !== 'undefined' && (b3.dispositivo === 'tocco' || b3.dispositivo === 'pad');
  const cestinoAlTocco = () => typeof inToccoB3 === 'function' && inToccoB3();
  const boxCestinoTocco = (n) => {
    const b = boxSlot(n), t = CESTINO.tocco;
    return { x: b.x + b.w - CESTINO.w - t.sx / 2, y: b.y - t.su, w: CESTINO.w + t.sx / 2 + t.dx, h: b.h + t.su + t.giu };
  };
  let cancSicura = false; // la conferma aperta è quella sicura
  let cancScelta = 'no';  // bottone evidenziato nella conferma sicura
  function apriCancella(n) {
    confermaCancella = n;
    cancSicura = modoSicuroCanc();
    cancScelta = 'no';
  }
  function chiudiCancella(si) {
    const n = confermaCancella;
    confermaCancella = null;
    cancSicura = false;
    if (si && n) { cancellaSlot(n); mostraAvviso(`Slot ${n} cancellato`); }
  }
  /** Cestino a ombre (coperchio, maniglia, corpo a tronco con le doghe) centrato in (x, y). */
  function disegnaCestino(ctx, x, y, colore) {
    ctx.save();
    ctx.fillStyle = colore; ctx.strokeStyle = colore; ctx.lineWidth = 1;
    ctx.fillRect(x - 4.5, y - 4, 9, 1.6);           // coperchio
    ctx.fillRect(x - 1.5, y - 5.5, 3, 1.5);          // maniglia
    ctx.beginPath(); ctx.moveTo(x - 3.6, y - 1.8); ctx.lineTo(x + 3.6, y - 1.8);
    ctx.lineTo(x + 2.8, y + 5); ctx.lineTo(x - 2.8, y + 5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(28, 20, 14, 0.85)'; ctx.lineWidth = 0.7;
    for (const dx of [-1.3, 1.3]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 0.6); ctx.lineTo(x + dx * 0.85, y + 4); ctx.stroke(); }
    ctx.restore();
  }

  function nomeBreve(id) {
    return id === 'ombra' ? 'Ombra' : (T.PERSONAGGI_GIOCABILI[id] || T.PERSONAGGI_GIOCABILI.ferruccio).nome;
  }
  function dataBreve(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const z = (x) => String(x).padStart(2, '0');
    return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()} ${z(d.getHours())}:${z(d.getMinutes())}`;
  }

  function disegnaBottone(ctx, b, testo, attivo) {
    ctx.fillStyle = attivo ? '#6e150d' : '#1c140e';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = attivo ? '#f9cb40' : '#8a5a2b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    drawTextFit(testo, b.x + b.w / 2, b.y + b.h / 2 + 3, b.w - 8, { size: 8, color: attivo ? '#f9cb40' : '#f3dfc1' });
  }

  function disegnaRiquadro(ctx, b, bordo) {
    ctx.fillStyle = 'rgba(5, 3, 2, 0.86)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#17100b';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = bordo;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }

  function disegnaAvviso() {
    if (!avviso || performance.now() > avviso.finoMs) { avviso = null; return; }
    T.drawPillLabel(avviso.testo, W / 2, 62, 220, { size: 8 });
  }

  function disegnaMenu(ctx) {
    ctx.save();
    drawTextFit('SLOT', M.etichettaX + 22, M.rigaY + 10, 44, { size: 8, color: '#f9cb40', align: 'center' });
    for (let n = 1; n <= S.numero; n++) {
      const b = boxSlot(n);
      const d = slots[n];
      const att = n === slotAttivo;
      ctx.fillStyle = att ? '#63150d' : '#1c140e';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = att ? '#f9cb40' : '#382518';
      ctx.lineWidth = att ? 1.4 : 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      const testo = d ? `${n} ${nomeBreve(d.personaggio)} P${d.pianoMassimo} ✦${d.scintille}` : `${n} · vuoto`;
      const spazio = d ? b.w - (cestinoAlTocco() ? CESTINO.w + 6 : 18) : b.w - 6;
      drawTextFit(testo, b.x + 3 + spazio / 2, b.y + 10, spazio, {
        size: 7, color: att ? '#f9cb40' : d ? '#f3dfc1' : '#78716c', shadow: false,
      });
      if (d) {
        const c = boxCroce(n);
        if (cestinoAlTocco()) disegnaCestino(ctx, b.x + b.w - CESTINO.w / 2 - 1, b.y + b.h / 2, '#ef4444');
        else drawTextFit('✕', c.x + c.w / 2, c.y + 9, c.w, { size: 7, color: '#ef4444', shadow: false });
      }
    }
    drawTextFit(typeof testoToccoD7 === 'function' ? testoToccoD7(TESTI.aiuto) : TESTI.aiuto, // (d7) col tocco
      W / 2, 352, 420, { size: 6.5, color: '#a8a29e', shadow: false });

    if (confermaCancella) {
      const n = confermaCancella;
      const d = slots[n];
      disegnaRiquadro(ctx, BOX_CANC, '#ef4444');
      drawTextFit(cancSicura ? TESTI.cancellaSicuraTitolo : TESTI.cancellaTitolo(n), W / 2, BOX_CANC.y + 26, BOX_CANC.w - 20, { size: 10, color: '#ef4444' });
      if (d) {
        drawTextFit(`${nomeBreve(d.personaggio)} · piano massimo ${d.pianoMassimo} · ✦ ${d.scintille} scintille`,
          W / 2, BOX_CANC.y + 50, BOX_CANC.w - 20, { size: 8, color: '#f3dfc1' });
        drawTextFit(`salvato il ${dataBreve(d.data)}`, W / 2, BOX_CANC.y + 66, BOX_CANC.w - 20, { size: 7.5, color: '#a8a29e' });
      }
      drawTextFit(TESTI.cancellaAvviso, W / 2, BOX_CANC.y + 84, BOX_CANC.w - 20, { size: 8, color: '#f9cb40' });
      if (cancSicura) {
        disegnaBottone(ctx, BTN_CANC_SI, TESTI.cancellaSicuraSi, cancScelta === 'si');
        disegnaBottone(ctx, BTN_CANC_NO, TESTI.cancellaSicuraNo, cancScelta === 'no');
      } else {
        disegnaBottone(ctx, BTN_CANC_SI, TESTI.cancellaSi, true);
        disegnaBottone(ctx, BTN_CANC_NO, TESTI.cancellaNo, false);
      }
    }
    disegnaAvviso();
    ctx.restore();
  }

  function disegnaSopra(ctx) {
    ctx.save();
    if (confermaPatto) {
      const { item, refSlot } = confermaPatto;
      disegnaRiquadro(ctx, BOX_PATTO, '#ef4444');
      drawTextFit(TESTI.pattoTitolo, W / 2, BOX_PATTO.y + 26, BOX_PATTO.w - 20, { size: 10.5, color: '#ef4444' });
      drawTextFit(item.nome || '', W / 2, BOX_PATTO.y + 50, BOX_PATTO.w - 20, { size: 8.5, color: '#f9cb40' });
      drawTextFit(item.statsDesc || '', W / 2, BOX_PATTO.y + 68, BOX_PATTO.w - 20, { size: 7, color: '#f3dfc1' });
      const maschere = (refSlot.costoMaxHpHalf || 2) / 2;
      const costo = maschere === 1 ? TESTI.pattoCosto : TESTI.pattoCosto.replace('−1 maschera massima', `−${maschere} maschere massime`);
      drawTextFit(`«${costo}»`, W / 2, BOX_PATTO.y + 98, BOX_PATTO.w - 20, { size: 10, color: '#fca5a5' });
      disegnaBottone(ctx, BTN_PATTO_SI, TESTI.pattoSi, true);
      disegnaBottone(ctx, BTN_PATTO_NO, TESTI.pattoNo, false);
    }
    disegnaAvviso();
    ctx.restore();
  }

  // ===========================================================================
  // INPUT (fase di cattura: arriva prima dei gestori del file principale)
  // ===========================================================================
  const blocca = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };

  window.addEventListener('keydown', (e) => {
    if (confermaPatto) {
      blocca(e);
      if (['KeyE', 'Enter', 'NumpadEnter', 'KeyY', 'KeyS'].includes(e.code)) rispondiPatto(true);
      else if (['Escape', 'KeyN', 'Backspace'].includes(e.code)) rispondiPatto(false);
      return;
    }
    if (confermaCancella && cancSicura) { // (f1) tocco/gamepad: [Invio]/A sceglie il bottone evidenziato
      blocca(e);
      if (['Enter', 'NumpadEnter', 'KeyE', 'Space'].includes(e.code)) chiudiCancella(cancScelta === 'si');
      else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD'].includes(e.code)) cancScelta = cancScelta === 'si' ? 'no' : 'si';
      else if (['Escape', 'KeyN', 'Backspace'].includes(e.code)) chiudiCancella(false);
      return;
    }
    if (confermaCancella) {
      blocca(e);
      if (['KeyS', 'Enter', 'NumpadEnter', 'KeyY'].includes(e.code)) chiudiCancella(true);
      else if (['Escape', 'KeyN', 'Backspace'].includes(e.code)) chiudiCancella(false);
      return;
    }
    if (e.code === 'KeyM' && !e.repeat) {
      impostaMuto(AudioSys.attivo, true);
      return;
    }
    if (statoRun.fase === 'menu_selezione') {
      if (['ArrowUp', 'KeyW'].includes(e.code)) { blocca(e); scegliSlot(((slotAttivo - 2 + S.numero) % S.numero) + 1); }
      else if (['ArrowDown', 'KeyS'].includes(e.code)) { blocca(e); scegliSlot((slotAttivo % S.numero) + 1); }
      else if (['Delete', 'Backspace'].includes(e.code)) {
        blocca(e);
        if (slots[slotAttivo]) apriCancella(slotAttivo);
        else mostraAvviso(`Lo slot ${slotAttivo} è già vuoto`);
      }
    }
  }, true);

  window.addEventListener('mousedown', (e) => {
    if (e.target !== canvas) return;
    const p = coordCanvas(e);
    if (confermaPatto) {
      blocca(e);
      if (dentro(p, BTN_PATTO_SI)) rispondiPatto(true);
      else if (dentro(p, BTN_PATTO_NO) || !dentro(p, BOX_PATTO)) rispondiPatto(false);
      return;
    }
    if (confermaCancella) {
      blocca(e);
      if (dentro(p, BTN_CANC_SI)) chiudiCancella(true);
      else if (dentro(p, BTN_CANC_NO) || !dentro(p, BOX_CANC)) chiudiCancella(false);
      return;
    }
    if (statoRun.fase !== 'menu_selezione') return;
    if (cestinoAlTocco()) { // (f1) il cestino col tocco: area larga, prima della scelta dello slot
      for (let n = 1; n <= S.numero; n++) {
        if (!slots[n] || !dentro(p, boxCestinoTocco(n))) continue;
        blocca(e); scegliSlot(n); apriCancella(n);
        return;
      }
    }
    for (let n = 1; n <= S.numero; n++) {
      if (!dentro(p, boxSlot(n))) continue;
      blocca(e);
      if (slots[n] && dentro(p, boxCroce(n))) { scegliSlot(n); apriCancella(n); }
      else scegliSlot(n);
      return;
    }
  }, true);

  // ===========================================================================
  // GANCI per il file principale + API per i passi successivi (T4: flag della trama nello slot)
  // ===========================================================================
  window.__teatroT3 = Object.freeze({
    aggiornaRaggio,
    spettrali: haModSpettrali,
    chiediConfermaPatto,
    disegnaMenu,
    disegnaMondo: disegnaRaggio,
    disegnaSopra,
    salvataggi: Object.freeze({
      get slotAttivo() { return slotAttivo; },
      leggi: (n) => (slots[n] ? JSON.parse(JSON.stringify(slots[n])) : null),
      scegli: scegliSlot,
      leggiFlag: (k) => slotCorrente().flag[k],
      impostaFlag(k, v) { const d = slotCorrente(); d.flag[k] = v; scriviSlot(slotAttivo, d); },
      aggiungiScintille(q) { const d = slotCorrente(); d.scintille += Math.floor(q) || 0; scriviSlot(slotAttivo, d); },
    }),
    get confermaPattoAperta() { return Boolean(confermaPatto); },
    get raggioAttivo() { return raggio.attivo; },
  });
})();
