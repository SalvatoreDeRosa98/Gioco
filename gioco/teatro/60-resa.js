/*
 * teatro/60-resa.js — Disegno: risoluzione, pannello sviluppatore, stanza, menu di selezione, frame, HUD, sipario, menu di pausa.
 * Script classico (niente moduli ES): le dichiarazioni di primo livello stanno nello scope globale
 * condiviso con gli altri file di teatro/. Ordine di caricamento e regole: teatro/LEGGIMI.md.
 */

function adattaRisoluzione() {
  const cssL = canvas.clientWidth || W;
  const dpr = window.devicePixelRatio || 1;
  let s = (cssL * dpr) / W;
  if (RISOLUZIONE.scalaIntera) s = Math.ceil(s - 1e-6);
  if (typeof tettoScalaC2 === 'function') s = Math.min(s, tettoScalaC2()); // --- c2: tetto più basso sui dispositivi a tocco (teatro/c2-tocco.js) ---
  s = Math.max(1, Math.min(s, RISOLUZIONE.bufferMaxL / W, RISOLUZIONE.bufferMaxA / H));
  const bl = Math.round(W * s), ba = Math.round(H * s);
  if (canvas.width !== bl || canvas.height !== ba) {
    canvas.width = bl; canvas.height = ba; // azzera lo stato del contesto: lo ripristina iniziaFrame()
    floorCachesPerPiano.clear(); // i pavimenti dei quartieri si ridisegnano alla nuova risoluzione
  }
  scalaBase = bl / W;
}

/** Stato base del contesto a inizio frame: scala 640x360 → buffer, pixel-art netta. */
function iniziaFrame() {
  ctx.setTransform(scalaBase, 0, 0, scalaBase, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = false;
}

window.addEventListener('resize', adattaRisoluzione);

document.addEventListener('fullscreenchange', adattaRisoluzione);

document.addEventListener('webkitfullscreenchange', adattaRisoluzione);

if (typeof ResizeObserver === 'function') new ResizeObserver(() => adattaRisoluzione()).observe(canvas);

// Stanza dello Sviluppatore: pannello con tutto il catalogo, una sola scelta, poi la stanza si chiude.
/** Apre il pannello di scelta nella Stanza dello Sviluppatore (se non già usata). */
function apriPannelloSviluppatoreB(st) {
  if (!st || st.tipo !== 'sviluppatore' || st.sceltaFattaB) return false;
  statoRun.pannelloB = { sel: statoRun.pannelloB ? statoRun.pannelloB.sel : 0 };
  return true;
}

/** Il giocatore prende l'oggetto `idx` del catalogo: va nell'HUD, il pannello si chiude, la porta si mura. */
function scegliOggettoSviluppatoreB(idx) {
  const st = statoRun.stanzaCorrente;
  const item = CATALOGO_OGGETTI[idx];
  if (!st || st.tipo !== 'sviluppatore' || st.sceltaFattaB || !item) return false;
  st.sceltaFattaB = true;
  statoRun.pannelloB = null;
  const P = statoRun.poolRunB;
  if (P && P.rimasti.includes(item.id)) P.rimasti.splice(P.rimasti.indexOf(item.id), 1); // non riesce dal pool
  acquisisciOggettoConLimite5Slot({ ...item }, 'sviluppatore', null);
  const g = st.genitoreB && statoRun.mappa?.perId.get(st.genitoreB.id);
  if (g) {
    delete g.porte[st.genitoreB.lato]; // la stanza si chiude alle tue spalle
    st.porte = {};
    st.visitata = false;
    entraInStanza(g, st.genitoreB.lato);
  }
  mostraBanner(`✎ Lo Sviluppatore ti dona ${item.nome}: la sua stanza si chiude alle tue spalle.`, 240);
  return true;
}

/** Tasti del pannello: frecce/WASD per muovere, E/Invio/Spazio per scegliere, Esc per chiudere. */
function tastoPannelloB(code) {
  const p = statoRun.pannelloB;
  if (!p) return false;
  const n = CATALOGO_OGGETTI.length;
  const C = OGGETTI_B.sviluppatore.colonne;
  if (['ArrowLeft', 'KeyA'].includes(code)) p.sel = (p.sel - 1 + n) % n;
  else if (['ArrowRight', 'KeyD'].includes(code)) p.sel = (p.sel + 1) % n;
  else if (['ArrowUp', 'KeyW'].includes(code)) p.sel = (p.sel - C + n * C) % n;
  else if (['ArrowDown', 'KeyS'].includes(code)) p.sel = (p.sel + C) % n;
  else if (['KeyE', 'Enter', 'Space'].includes(code)) scegliOggettoSviluppatoreB(p.sel);
  else if (code === 'Escape') statoRun.pannelloB = null;
  return true;
}

/** Geometria della cella `i` del pannello (coordinate logiche 640×360). */
function cellaPannelloB(i) {
  const S = OGGETTI_B.sviluppatore;
  const x0 = Math.round((W - S.colonne * S.cellaL) / 2);
  return { x: x0 + (i % S.colonne) * S.cellaL, y: 50 + Math.floor(i / S.colonne) * S.cellaA, w: S.cellaL - 4, h: S.cellaA - 4 };
}

/** Click nel pannello: una cella la seleziona, un secondo click sulla stessa la sceglie. */
function clickPannelloB(mx, my) {
  const p = statoRun.pannelloB;
  if (!p) return false;
  for (let i = 0; i < CATALOGO_OGGETTI.length; i++) {
    const c = cellaPannelloB(i);
    if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
      if (p.sel === i) scegliOggettoSviluppatoreB(i);
      else p.sel = i;
      return true;
    }
  }
  return true;
}

/** Disegna il pannello: griglia con icona e nome di tutti gli oggetti, sotto la descrizione di quello scelto. */
function disegnaPannelloSviluppatoreB() {
  const p = statoRun.pannelloB;
  if (!p) return;
  const S = OGGETTI_B.sviluppatore;
  const nomeCorto = (s) => s.replace(/\s*\(.*?\)/g, '');
  ctx.save();
  ctx.fillStyle = 'rgba(5, 3, 2, 0.9)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0d1418';
  ctx.strokeStyle = S.colore;
  ctx.lineWidth = 2;
  ctx.fillRect(28, 22, W - 56, H - 40);
  ctx.strokeRect(28, 22, W - 56, H - 40);
  drawTextFit('✎ STANZA DELLO SVILUPPATORE — SCEGLI UN OGGETTO TRA TUTTI ✎', W / 2, 38, W - 80, { size: 10, color: S.colore });
  const pool = statoRun.poolRunB ? statoRun.poolRunB.ids : [];
  for (let i = 0; i < CATALOGO_OGGETTI.length; i++) {
    const o = CATALOGO_OGGETTI[i];
    const c = cellaPannelloB(i);
    const sel = i === p.sel;
    ctx.fillStyle = sel ? '#1f3a44' : '#17100b';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = sel ? '#ffffff' : o.tier === 'forte' ? '#f9cb40' : '#57534e';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    // --- D: sconosciuti in sagoma scura e «???» (scelta dell'autore per questa stanza) ---
    const notoD = effettoVisibileD(o);
    drawPixelSprite(spriteD(o, !notoD), c.x + c.w / 2, c.y + 13, 1.4);
    drawTextFit(notoD ? nomeCorto(o.nome) : '???', c.x + c.w / 2, c.y + c.h - 4, c.w - 4, { size: 6.5, color: sel ? '#ffffff' : '#e6d2aa', shadow: false });
    if (!pool.includes(o.id)) {
      ctx.fillStyle = S.colore;
      ctx.fillRect(c.x + c.w - 5, c.y + 2, 3, 3); // fuori dal pool di questa run
    }
  }
  const o = CATALOGO_OGGETTI[p.sel];
  const yD = cellaPannelloB(CATALOGO_OGGETTI.length - 1).y + S.cellaA + 8;
  if (o) {
    const notoD = effettoVisibileD(o); // --- D ---
    drawTextFit(`${notoD ? o.nome : '???'}${pool.includes(o.id) ? '' : '  · fuori dal pool di questa notte'}`, W / 2, yD, W - 80, { size: 9, color: '#4ade80' });
    drawTextFit(descD(o), W / 2, yD + 13, W - 80, { size: 8, color: '#67e8f9' });
    drawTextFit(notoD ? (o.lore || '') : '', W / 2, yD + 25, W - 80, { size: 7.5, color: '#e6d2aa', weight: '', style: 'italic' });
  }
  drawTextFit('Frecce/WASD o click: scegli · E/Invio (o secondo click): prendi · Esc: chiudi · ▪ azzurro = fuori dal pool della notte', W / 2, H - 26, W - 80, { size: 7.5, color: '#9ca3af' });
  ctx.restore();
}

/** Disegna l'altare della Stanza dello Sviluppatore. */
function disegnaAltareSviluppatoreB(st, tick) {
  const S = OGGETTI_B.sviluppatore;
  ctx.save();
  ctx.fillStyle = '#0b2a30';
  ctx.fillRect(210, 130, 220, 114);
  ctx.strokeStyle = S.colore;
  ctx.lineWidth = 2;
  ctx.strokeRect(212, 132, 216, 110);
  drawPixelSprite(SPRITE_SCENA.piedistalloOro, 320, 202, 1.8);
  if (!st.sceltaFattaB) {
    const k = Math.floor(tick / 20) % CATALOGO_OGGETTI.length;
    const o = CATALOGO_OGGETTI[k];
    drawPixelSprite(SPRITE_OGGETTI[o.sprite] || SPRITE_OGGETTI.spada, 320, 172 + Math.sin(tick * 0.08) * 3, 2);
    drawPillLabel('✎ STANZA DELLO SVILUPPATORE [E]', 320, 120, 220, { size: 7.5, color: S.colore, border: S.colore });
  }
  ctx.restore();
}

/** HUD degli oggetti passivi: icone piccole su OGGETTI_B.hud.righe righe, il passo si stringe se non entrano. */
function disegnaIconeOggettiB(dy0) {
  const Hd = OGGETTI_B.hud;
  const lista = statoRun.oggettiEquipaggiati;
  const n = lista.length;
  const larg = Hd.xMax - Hd.xMin;
  const perRiga = Math.max(1, Math.ceil(n / Hd.righe));
  const passo = Math.min(Hd.passo, perRiga > 1 ? (larg - Hd.lato) / (perRiga - 1) : Hd.passo);
  ctx.save();
  ctx.fillStyle = 'rgba(15, 12, 10, 0.85)';
  ctx.fillRect(Hd.xMin - 3, dy0 - 1, Math.min(larg, (Math.min(n, perRiga) - 1) * passo + Hd.lato) + 6 + (n ? 0 : 40), 28);
  if (!n) drawTextFit('nessun oggetto', Hd.xMin + 20, dy0 + 16, 50, { size: 6.5, color: '#57534e', shadow: false });
  for (let i = 0; i < n; i++) {
    const it = lista[i];
    const r = Math.floor(i / perRiga);
    const c = i % perRiga;
    const x = Hd.xMin + c * passo + Hd.lato / 2;
    const y = dy0 + r * (Hd.lato + 2) + Hd.lato / 2 + 1;
    drawPixelSprite(SPRITE_OGGETTI[it.sprite] || SPRITE_OGGETTI.spada, x, y, Hd.scala);
    if (it.doppioneB) { ctx.fillStyle = '#f9cb40'; ctx.fillRect(x + 4, y - 6, 2, 2); }
  }
  ctx.restore();
}
// --- B: fine ---

function getRaccontoAtto(piano, ciclo) {
  const pianoNelCiclo = ((Math.max(1, piano || 1) - 1) % 4) + 1;
  const pInfo = PERSONAGGI_GIOCABILI[statoRun.personaggioId] || PERSONAGGI_GIOCABILI.ferruccio;
  const q = getQuartierePiano(piano);

  if (ciclo > 1 && pianoNelCiclo === 1) {
    return {
      atto: `CICLO INFINITO ${ciclo} · ATTO I · ${q.nome.toUpperCase()} (PIANO ${piano} · ${numeroStanzeCombattimento(piano)} STANZE + SEGRETA)`,
      titolo: '«BIS! I FILI SOPRA LA BURATTINAIA»',
      testo1: 'Spezzando Donna Luciana hai scoperto l\'inganno: anche ai suoi polsi erano legati fili d\'oro',
      testo2: 'che salgono ancora più in alto nel buio del Teatro! Una voce invisibile grida: «BIS! DA CAPO!»',
      testo3: `Il palco si ricuce più feroce (+${Math.round((ciclo - 1) * 45)}% Vita/Vel). Conservi i tuoi oggetti e le monete!`,
    };
  }
  if (pianoNelCiclo === 1) {
    const numNotte = statoRun.numeroNotte || 1;
    return {
      atto: `NOTTE ${numNotte} · ATTO I · ${q.nome.toUpperCase()} (PIANO 1 · ${pInfo.nome.toUpperCase()})`,
      titolo: `«${q.titoloCompleto.toUpperCase()}»`,
      testo1: 'La pioggia battente scroscia sui basoli neri dei Quattro Canti. Ferruccio cerca la verità.',
      testo2: 'Gatti d\'Ombra balzano tra i lampioni bagnati mentre l\'odore di ruggine sale dai vicoli.',
      testo3: 'Trova la via per la Villa Comunale e scova la Stanza Segreta! Premi [ESC] per il Menù di Pausa.',
    };
  }
  if (pianoNelCiclo === 2) {
    return {
      atto: `ATTO II · ${q.nome.toUpperCase()} (PIANO ${piano} · ${numeroStanzeCombattimento(piano)} STANZE + 1 SEGRETA)`,
      titolo: `«${q.titoloCompleto.toUpperCase()}»`,
      testo1: 'I viali di tufo e muschio brillano nel buio trafitti da sciami di lucciole dorate.',
      testo2: 'Accanto alla fontana silenziosa, il Custode di Marmo veglia sul registro segreto del crollo del 1839.',
      testo3: `Risparmia le monete e scova la Stanza Segreta per permetterti le Reliquie Forti (${ECONOMIA_T3.prezzi.forte}🪙) della Fucina!`,
    };
  }
  if (pianoNelCiclo === 3) {
    return {
      atto: `ATTO III · ${q.nome.toUpperCase()} (PIANO ${piano} · ${numeroStanzeCombattimento(piano)} STANZE + 1 SEGRETA)`,
      titolo: `«${q.titoloCompleto.toUpperCase()}»`,
      testo1: 'Il primo raggio radente dell\'aurora dorata penetra tra i mattoni e i telai del setificio reale.',
      testo2: 'Agnese tesse la sciarpa rossa senza memoria. Maschere d\'osso e Spezzafili sorvegliano i fusi.',
      testo3: 'Da questo piano il Velo stringe più forte: ogni colpo subito spezza 1 Maschera intera.',
    };
  }
  return {
    atto: `ATTO IV · ${q.nome.toUpperCase()} (PIANO ${piano} · ${numeroStanzeCombattimento(piano)} STANZE + 1 SEGRETA)`,
    titolo: ciclo > 1 ? `«DONNA LUCIANA ASCESA (CICLO ${ciclo})»` : `«${q.titoloCompleto.toUpperCase()}»`,
    testo1: 'I saloni reali risplendono del fuoco vivo di torce dorate e bracieri d\'ottone.',
    testo2: 'Sulla grande scacchiera di marmo ed ebano, la guardia borbonica protegge la Sala del Trono.',
    testo3: 'Donna Luciana ti attende: recidi i fili della Burattinaia per restituire la verità a Caserta!',
  };
}

/** Disegna famigli e gomitoli orbitanti (sprite dell'oggetto, piccoli). */
function disegnaFamigliOrbitaliD() {
  for (const f of statoRun.famigliD || []) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(Math.round(f.x - 5), Math.round(f.y + 5), 10, 3);
    drawPixelSprite(SPRITE_OGGETTI[f.id] || SPRITE_OGGETTI.pupo_tonino, f.x, f.y - 6 + Math.sin(tick * 0.12) * 1.5, 1.3);
  }
  for (const o of statoRun.orbitaliPosD || []) drawPixelSprite(SPRITE_OGGETTI.gomitolo, o.x, o.y, 1.0);
}

/** Lume Spento: buio oltre OGGETTI_D.buio.raggioPx attorno al giocatore. */
function disegnaBuioD() {
  const R = OGGETTI_D.buio.raggioPx;
  const g = ctx.createRadialGradient(player.x, player.y - 6, R * 0.55, player.x, player.y - 6, R);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.94)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Cartiglio al primo raccolto: nome, effetto e lore per OGGETTI_D.cartiglioTick tick. */
function disegnaCartiglioD() {
  const c = statoRun.cartiglioD;
  if (!c || statoRun.fase !== 'in_gioco') return;
  const t = tick - c.t0;
  if (t > OGGETTI_D.cartiglioTick) { statoRun.cartiglioD = null; return; }
  const o = c.item;
  const bw = 400, bh = 52, bx = (W - bw) / 2, by = 268;
  ctx.save();
  ctx.globalAlpha = Math.min(1, t / 10, (OGGETTI_D.cartiglioTick - t) / 15);
  ctx.fillStyle = '#e6d2aa';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#5c4024';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 3, by + 3, bw - 6, bh - 6);
  drawPixelSprite(SPRITE_OGGETTI[o.sprite] || SPRITE_OGGETTI.spada, bx + 24, by + bh / 2, 2);
  drawTextFit(`✦ Scoperto: ${o.nome}`, bx + bw / 2 + 16, by + 15, bw - 70, { size: 9, color: '#5c1a0c', shadow: false });
  drawTextFit(o.statsDesc, bx + bw / 2 + 16, by + 29, bw - 70, { size: 7.5, color: '#14532d', shadow: false });
  drawTextFit(`«${o.lore || ''}»`, bx + bw / 2 + 16, by + 42, bw - 70, { size: 7, color: '#451a03', weight: '', style: 'italic', shadow: false });
  ctx.restore();
}

function disegnaDiarioD() {
  const d = statoRun.diarioD;
  if (!d) return;
  const noti = conosciutiD();
  ctx.save();
  ctx.fillStyle = 'rgba(5, 3, 2, 0.94)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1c130c';
  ctx.strokeStyle = '#f9cb40';
  ctx.lineWidth = 2;
  ctx.fillRect(24, 14, W - 48, H - 24);
  ctx.strokeRect(24, 14, W - 48, H - 24);
  const nNoti = CATALOGO_OGGETTI.filter((o) => noti.includes(o.id)).length;
  drawTextFit(`📖 DIARIO DEGLI OGGETTI — Conosciuti ${nNoti} / ${CATALOGO_OGGETTI.length}`, W / 2, 32, W - 80, { size: 10, color: '#f9cb40' });
  for (let i = 0; i < CATALOGO_OGGETTI.length; i++) {
    const o = CATALOGO_OGGETTI[i];
    const c = cellaDiarioD(i);
    const noto = noti.includes(o.id);
    const sel = i === d.sel;
    ctx.fillStyle = sel ? '#3b2a1a' : noto ? '#2a1d14' : '#4a3a2a';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = sel ? '#ffffff' : o.polarita === 'negativo' && noto ? '#b91c1c' : o.tier === 'forte' ? '#f9cb40' : '#57534e';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    drawPixelSprite(spriteD(o, !noto, 'k'), c.x + c.w / 2, c.y + 10, 1.2);
    drawTextFit(noto ? o.nome : '???', c.x + c.w / 2, c.y + c.h - 3, c.w - 4, { size: 6, color: noto ? '#e6d2aa' : '#a8a29e', shadow: false });
  }
  const o = CATALOGO_OGGETTI[d.sel];
  const noto = o && noti.includes(o.id);
  const yD = cellaDiarioD(CATALOGO_OGGETTI.length - 1).y + OGGETTI_D.diario.cellaA + 6;
  if (o) {
    drawTextFit(noto ? o.nome : '???', W / 2, yD, W - 80, { size: 9, color: '#4ade80' });
    drawTextFit(noto ? o.statsDesc : 'Effetto: ??? — raccoglilo per scoprirlo.', W / 2, yD + 12, W - 80, { size: 8, color: '#67e8f9' });
    if (noto) drawTextFit(`«${o.lore || ''}»`, W / 2, yD + 23, W - 80, { size: 7.5, color: '#e6d2aa', weight: '', style: 'italic' });
  }
  drawTextFit('Frecce/WASD o click: scorri · Esc/O: torna al menu', W / 2, H - 14, W - 80, { size: 7, color: '#9ca3af' });
  ctx.restore();
}

/** Disegna le macchie sul pavimento (sotto ostacoli, nemici e giocatore). */
function disegnaMacchie() {
  if (!macchieStanza.length) return;
  const M = FEEL.macchie;
  ctx.save();
  ctx.globalAlpha = M.alpha;
  for (const m of macchieStanza) {
    ctx.fillStyle = m.legno ? M.coloreLegno : M.coloreChina;
    for (const g of m.gocce) {
      ctx.save();
      ctx.translate(m.x + g.dx, m.y + g.dy);
      ctx.rotate(g.ang);
      ctx.beginPath();
      if (m.legno) ctx.rect(-g.r * 1.4, -g.r * 0.35, g.r * 2.8, g.r * 0.7);
      else ctx.ellipse(0, 0, g.r * 1.5, g.r * 0.8, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * Disegna i DUE fili d'oro di una marionetta: dalla Mano sinistra alla spalla sinistra e dalla destra
 * alla destra (FEEL.fili, come motore/resa/fili.js). Mai su Ferruccio e i giocabili.
 * @param {{x: number, piedi: number, altezza: number, mezza: number}} corpo
 * @param {[number, number]} [manoS] @param {[number, number]} [manoD]
 */

function disegnaFiliMarionetta(corpo, manoS = FEEL.fili.manoSinistra, manoD = FEEL.fili.manoDestra) {
  const F = FEEL.fili;
  const y = corpo.piedi - corpo.altezza * F.ancoraggioY;
  const dx = corpo.mezza * F.scartoX;
  ctx.save();
  ctx.globalAlpha = F.alpha;
  ctx.strokeStyle = F.colore;
  ctx.lineWidth = F.spessore;
  ctx.setLineDash([]);
  ctx.beginPath();
  for (const [[ax, ay], bx] of [[manoS, corpo.x - dx], [manoD, corpo.x + dx]]) {
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo((ax + bx) / 2, (ay + y) / 2 + F.curvaPx, bx, y);
  }
  ctx.stroke();
  ctx.restore();
}

// ===========================================================================
// ===========================================================================
// PAVIMENTO DEI QUARTIERI E STANZA PIXEL-ART
// ===========================================================================
const floorCachesPerPiano = new Map();

function getFloorTileCanvas(piano) {
  const pNelCiclo = ((Math.max(1, piano || statoRun?.piano || 1) - 1) % 4) + 1;
  if (floorCachesPerPiano.has(pNelCiclo)) return floorCachesPerPiano.get(pNelCiclo);

  const q = getQuartierePiano(pNelCiclo);
  const fc = document.createElement('canvas');
  // (T5) alla risoluzione del buffer: si disegna in coordinate 640x360 con la stessa scala del palco
  fc.width = Math.round(W * scalaBase);
  fc.height = Math.round(H * scalaBase);
  const x = fc.getContext('2d');
  x.setTransform(scalaBase, 0, 0, scalaBase, 0, 0);
  x.imageSmoothingEnabled = false;

  // Sfondo scuro del teatro attorno alla pedana della stanza
  x.fillStyle = q.coloreSfondo;
  x.fillRect(0, 0, W, H);

  // Pavimento interno della stanza
  x.fillStyle = q.coloreMuroInterno;
  x.fillRect(48, 52, W - 96, H - 96);
  x.strokeStyle = q.coloreBordoMuro;
  x.lineWidth = 2;
  x.strokeRect(48, 52, W - 96, H - 96);

  // Merlatura e perimetro in legno/pietra della parete
  for (let bx = 52; bx < W - 52; bx += 24) {
    x.fillStyle = q.coloreMuroEsterno;
    x.fillRect(bx, 56, 20, 12);
    x.fillRect(bx, H - 60, 20, 12);
  }
  for (let by = 68; by < H - 64; by += 20) {
    x.fillStyle = q.coloreMuroEsterno;
    x.fillRect(52, by, 12, 16);
    x.fillRect(W - 64, by, 12, 16);
  }

  // Generatore deterministico di numeri casuali per la texture del pavimento
  let seed = 1337 + pNelCiclo * 997;
  const nextR = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed >>> 16) / 65536; };

  if (pNelCiclo === 1) {
    // -------------------------------------------------------------------------
    // PIANO 1: CORSO TRIESTE SOTTO LA PIOGGIA
    // Basoli vesuviani scuri bagnati, pozzanghere con riflessi lucidi cerulei
    // -------------------------------------------------------------------------
    const colors = q.coloriPiastrelle;
    for (let ty = 70; ty < 304; ty += 16) {
      for (let tx = 68; tx < 572; tx += 16) {
        const c = colors[Math.floor(nextR() * colors.length)];
        x.fillStyle = c;
        x.fillRect(tx, ty, 16, 16);

        // Fughe bagnate scure
        x.fillStyle = q.coloreFughe;
        x.fillRect(tx, ty + 15, 16, 1);
        x.fillRect(tx + 15, ty, 1, 16);

        // Bordo superiore/sinistro lucido per bagnato
        if (nextR() < 0.40) {
          x.fillStyle = q.coloreRiflesso;
          x.fillRect(tx + 1, ty + 1, 6, 1);
          x.fillRect(tx + 1, ty + 2, 1, 5);
        }

        // Pori e scanalature della pietra lavica
        if (nextR() < 0.22) {
          x.fillStyle = '#0f141f';
          x.fillRect(tx + 4, ty + 6, 3, 1);
          x.fillRect(tx + 10, ty + 11, 2, 1);
        }
      }
    }

    // Pozzanghere d'acqua piovana con riflessi cerulei e lucentezza
    const pozzanghere = [
      { x: 140, y: 110, rx: 32, ry: 16 },
      { x: 480, y: 120, rx: 36, ry: 18 },
      { x: 230, y: 220, rx: 42, ry: 19 },
      { x: 420, y: 240, rx: 38, ry: 17 },
      { x: 310, y: 160, rx: 48, ry: 20 },
      { x: 170, y: 250, rx: 28, ry: 14 },
    ];
    for (const p of pozzanghere) {
      x.save();
      x.fillStyle = q.colorePozzanghera;
      x.beginPath();
      x.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      x.fill();
      // Riflesso specchiato sulla superficie dell'acqua
      x.fillStyle = 'rgba(224, 242, 254, 0.28)';
      x.beginPath();
      x.ellipse(p.x - p.rx * 0.25, p.y - p.ry * 0.25, p.rx * 0.45, p.ry * 0.35, -0.2, 0, Math.PI * 2);
      x.fill();
      x.restore();
    }

  } else if (pNelCiclo === 2) {
    // -------------------------------------------------------------------------
    // PIANO 2: VILLA COMUNALE CON LE LUCCIOLE
    // Viali di ghiaia, tufo umido, ciuffi di muschio verde e foglie d'autunno
    // -------------------------------------------------------------------------
    const colors = q.coloriPiastrelle;
    for (let ty = 70; ty < 304; ty += 16) {
      for (let tx = 68; tx < 572; tx += 16) {
        const c = colors[Math.floor(nextR() * colors.length)];
        x.fillStyle = c;
        x.fillRect(tx, ty, 16, 16);

        // Fughe terrose
        x.fillStyle = q.coloreFughe;
        x.fillRect(tx, ty + 15, 16, 1);
        x.fillRect(tx + 15, ty, 1, 16);

        // Ciuffi di muschio verde nei giunti e negli angoli
        if (nextR() < 0.35) {
          x.fillStyle = nextR() < 0.5 ? '#365314' : q.coloreMuschio;
          x.fillRect(tx + 2, ty + 13, 4, 2);
          x.fillRect(tx + 13, ty + 2, 2, 4);
        }

        // Granelli di tufo e ciottoli
        if (nextR() < 0.25) {
          x.fillStyle = '#2b3f24';
          x.fillRect(tx + 7, ty + 6, 2, 2);
        }

        // Foglie secche autunnali sparse (ambra, ruggine e castagna)
        if (nextR() < 0.14) {
          const leafCols = ['#78350f', '#92400e', '#b45309', '#5c3210'];
          x.fillStyle = leafCols[Math.floor(nextR() * leafCols.length)];
          const lx = tx + 3 + Math.floor(nextR() * 9);
          const ly = ty + 3 + Math.floor(nextR() * 9);
          x.fillRect(lx, ly, 3, 2);
          x.fillRect(lx + 1, ly + 1, 2, 1);
        }
      }
    }

  } else if (pNelCiclo === 3) {
    // -------------------------------------------------------------------------
    // PIANO 3: SAN LEUCIO ALL'ALBA
    // Cotto antico della manifattura reale, mattoni rossicci, assi dei telai
    // -------------------------------------------------------------------------
    const colors = q.coloriPiastrelle;
    for (let ty = 70; ty < 304; ty += 16) {
      for (let tx = 68; tx < 572; tx += 16) {
        const c = colors[Math.floor(nextR() * colors.length)];
        x.fillStyle = c;
        x.fillRect(tx, ty, 16, 16);

        // Fughe di malta rossa antica
        x.fillStyle = q.coloreFughe;
        x.fillRect(tx, ty + 15, 16, 1);
        x.fillRect(tx + 15, ty, 1, 16);

        // Luce calda d'alba sui bordi superiori dei mattoni
        if (nextR() < 0.42) {
          x.fillStyle = '#6e3325';
          x.fillRect(tx + 1, ty + 1, 12, 1);
        }

        // Texture di cotto e argilla
        if (nextR() < 0.20) {
          x.fillStyle = '#29100a';
          x.fillRect(tx + 5, ty + 8, 3, 1);
        }

        // Trama di seta dorata/rosata incorporata
        if (nextR() < 0.16) {
          x.fillStyle = q.coloreSeta;
          x.fillRect(tx + 4, ty + 4, 3, 2);
        }
      }
    }

    // Assi e longheroni in legno di castagno dei telai lungo i bordi della stanza
    x.fillStyle = '#2c140c';
    x.fillRect(72, 74, 496, 4);
    x.fillRect(72, 296, 496, 4);
    x.fillStyle = '#5c2e17';
    for (let lx = 80; lx < 560; lx += 32) {
      x.fillRect(lx, 74, 2, 4);
      x.fillRect(lx, 296, 2, 4);
    }

  } else {
    // -------------------------------------------------------------------------
    // PIANO 4: LA REGGIA CON LE TORCE
    // Scacchiera regale in marmo avorio ed ebano lucido con intarsi in oro borbonico
    // -------------------------------------------------------------------------
    for (let ty = 70; ty < 304; ty += 16) {
      const row = Math.floor((ty - 70) / 16);
      for (let tx = 68; tx < 572; tx += 16) {
        const col = Math.floor((tx - 68) / 16);
        const isIvory = (row + col) % 2 === 0;

        if (isIvory) {
          // Marmo avorio borbonico
          x.fillStyle = nextR() < 0.5 ? '#cfc5b4' : '#dfd6c7';
          x.fillRect(tx, ty, 16, 16);
          // Venatura tenue di marmo
          if (nextR() < 0.35) {
            x.fillStyle = '#b8aca0';
            x.fillRect(tx + 3, ty + 4, 4, 1);
            x.fillRect(tx + 6, ty + 5, 5, 1);
          }
        } else {
          // Marmo nero ebano lucidato
          x.fillStyle = nextR() < 0.5 ? '#1f1b18' : '#28231f';
          x.fillRect(tx, ty, 16, 16);
          // Riflesso lucido a specchio
          if (nextR() < 0.35) {
            x.fillStyle = '#3a332c';
            x.fillRect(tx + 2, ty + 2, 5, 1);
          }
        }

        // Bordo tra le lastre
        x.fillStyle = '#14100c';
        x.fillRect(tx, ty + 15, 16, 1);
        x.fillRect(tx + 15, ty, 1, 16);
      }
    }

    // Intarsio geometrico regale in oro lungo il perimetro interno
    x.strokeStyle = q.coloreOro;
    x.lineWidth = 2;
    x.strokeRect(96, 94, 448, 186);

    // Rosetta dorata stilizzata al centro della scacchiera della Reggia
    x.fillStyle = 'rgba(249, 203, 64, 0.40)';
    x.fillRect(312, 172, 16, 16);
    x.fillStyle = q.coloreOro;
    x.fillRect(318, 166, 4, 28);
    x.fillRect(306, 178, 28, 4);
    x.fillRect(314, 174, 12, 12);
  }

  // Bordo perimetrale esterno del pavimento della stanza
  x.strokeStyle = q.coloreBordoMuro;
  x.lineWidth = 2;
  x.strokeRect(68, 70, 504, 234);

  floorCachesPerPiano.set(pNelCiclo, fc);
  return fc;
}

/**
 * Disegna gli effetti atmosferici, meteo, particellari e la luce tipica del quartiere.
 */
function disegnaAtmosferaQuartiere(tick, piano) {
  const pNelCiclo = ((Math.max(1, piano || statoRun?.piano || 1) - 1) % 4) + 1;

  if (pNelCiclo === 1) {
    // -------------------------------------------------------------------------
    // PIANO 1: PIOGGIA NOTTURNA BATTENTE SU CORSO TRIESTE
    // -------------------------------------------------------------------------
    ctx.save();
    // 1. Strie di pioggia diagonale scrosciante
    ctx.strokeStyle = 'rgba(186, 215, 248, 0.36)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 48; i++) {
      const rx = ((i * 53 + tick * 3.8) % 520) + 60;
      const ry = ((i * 37 + tick * 9.2) % 250) + 65;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2.5, ry + 11);
    }
    ctx.stroke();

    // 2. Cerchi concentrici d'impatto gocce d'acqua (ripple)
    for (let i = 0; i < 6; i++) {
      const cx = 110 + ((i * 89) % 420);
      const cy = 95 + ((i * 67) % 180);
      const prog = ((tick * 0.35 + i * 9) % 24);
      const r = prog;
      const alpha = Math.max(0, 0.40 - prog * 0.016);
      ctx.strokeStyle = `rgba(186, 215, 248, ${alpha.toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.45, 0, 0, TAU);
      ctx.stroke();
    }

    // 3. Vignettatura fredda notturna
    const vg = ctx.createRadialGradient(W / 2, H / 2, 140, W / 2, H / 2, 330);
    vg.addColorStop(0, 'rgba(8, 12, 20, 0)');
    vg.addColorStop(1, 'rgba(8, 12, 20, 0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(48, 52, W - 96, H - 96);
    ctx.restore();

  } else if (pNelCiclo === 2) {
    // -------------------------------------------------------------------------
    // PIANO 2: NOTTE INCANTATA CON LE LUCCIOLE ALLA VILLA COMUNALE
    // -------------------------------------------------------------------------
    ctx.save();
    // 1. Lucciole fluttuanti con luce verde/oro pulsante
    for (let i = 0; i < 18; i++) {
      const fx = 80 + ((i * 59 + tick * 0.42) % 480) + Math.sin(tick * 0.04 + i) * 18;
      const fy = 80 + ((i * 47 + tick * 0.25) % 200) + Math.cos(tick * 0.035 + i * 1.8) * 14;
      const pulse = 0.45 + 0.55 * Math.sin(tick * 0.09 + i * 2.1);
      const rHalo = Math.max(1, 10 + 6 * pulse);

      // Alone luminoso radiale
      const g = ctx.createRadialGradient(fx, fy, 1, fx, fy, rHalo);
      g.addColorStop(0, `rgba(190, 242, 100, ${(0.42 * pulse).toFixed(2)})`);
      g.addColorStop(0.5, `rgba(163, 230, 53, ${(0.22 * pulse).toFixed(2)})`);
      g.addColorStop(1, 'rgba(163, 230, 53, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fx, fy, rHalo, 0, TAU);
      ctx.fill();

      // Cuore brillante della lucciola
      ctx.fillStyle = pulse > 0.7 ? '#ffffff' : '#fef08a';
      ctx.fillRect(Math.round(fx) - 1, Math.round(fy) - 1, 2, 2);
    }

    // 2. Vignettatura boscosa verde cupo
    const vg = ctx.createRadialGradient(W / 2, H / 2, 130, W / 2, H / 2, 330);
    vg.addColorStop(0, 'rgba(5, 18, 7, 0)');
    vg.addColorStop(1, 'rgba(5, 18, 7, 0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(48, 52, W - 96, H - 96);
    ctx.restore();

  } else if (pNelCiclo === 3) {
    // -------------------------------------------------------------------------
    // PIANO 3: LUCE RADENTE DELL'ALBA E PULVISCOLO DI SETA A SAN LEUCIO
    // -------------------------------------------------------------------------
    ctx.save();
    // 1. Fascio di luce radente dell'aurora che fende la sala
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(560, 56);
    ctx.lineTo(600, 56);
    ctx.lineTo(240, 310);
    ctx.lineTo(160, 310);
    ctx.closePath();
    const beamGrad = ctx.createLinearGradient(580, 56, 200, 310);
    beamGrad.addColorStop(0, 'rgba(254, 215, 170, 0.14)');
    beamGrad.addColorStop(0.6, 'rgba(251, 146, 60, 0.08)');
    beamGrad.addColorStop(1, 'rgba(244, 114, 182, 0.02)');
    ctx.fillStyle = beamGrad;
    ctx.fill();
    ctx.restore();

    // 2. Pulviscolo di seta e pagliuzze d'oro fluttuanti nell'aria
    for (let i = 0; i < 20; i++) {
      const mx = 80 + ((i * 71 + tick * 0.35) % 480);
      const my = 80 + ((i * 43 + Math.sin(tick * 0.035 + i) * 16 + tick * 0.12) % 200);
      const glint = 0.3 + 0.7 * Math.sin(tick * 0.12 + i * 1.5);
      ctx.fillStyle = `rgba(253, 224, 71, ${Math.max(0, glint).toFixed(2)})`;
      ctx.fillRect(Math.round(mx), Math.round(my), 2, 2);
      if (glint > 0.8) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(Math.round(mx), Math.round(my) - 1, 1, 3);
        ctx.fillRect(Math.round(mx) - 1, Math.round(my), 3, 1);
      }
    }

    // 3. Vignettatura calda rosata d'alba
    const vg = ctx.createRadialGradient(W / 2, H / 2, 140, W / 2, H / 2, 330);
    vg.addColorStop(0, 'rgba(30, 10, 8, 0)');
    vg.addColorStop(1, 'rgba(30, 10, 8, 0.32)');
    ctx.fillStyle = vg;
    ctx.fillRect(48, 52, W - 96, H - 96);
    ctx.restore();

  } else {
    // -------------------------------------------------------------------------
    // PIANO 4: FIAMME VIVE DELLE TORCE E FAVILLE INCANDESCENTI ALLA REGGIA
    // -------------------------------------------------------------------------
    ctx.save();
    // 1. Bagliore caldo pulsante dai bracieri reali
    const flicker = Math.sin(tick * 0.20) * 8 + Math.cos(tick * 0.33) * 5;
    for (const bx of [150, 490]) {
      const brGrad = ctx.createRadialGradient(bx, 64, 4, bx, 64, 70 + flicker);
      brGrad.addColorStop(0, 'rgba(249, 115, 22, 0.26)');
      brGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.12)');
      brGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = brGrad;
      ctx.beginPath();
      ctx.arc(bx, 64, 70 + flicker, 0, TAU);
      ctx.fill();
    }

    // 2. Faville e scintille incandescenti che salgono verso l'alto
    for (let i = 0; i < 24; i++) {
      const sx = 80 + ((i * 57 + Math.sin(tick * 0.07 + i) * 14) % 480);
      const distSalita = (i * 39 + tick * 1.7) % 210;
      const sy = 280 - distSalita;
      const tNorm = distSalita / 210;
      const alpha = Math.max(0, 1 - tNorm * 1.1);
      const col = tNorm < 0.35 ? '#fde047' : tNorm < 0.70 ? '#f97316' : '#ef4444';
      ctx.fillStyle = col;
      ctx.globalAlpha = alpha;
      ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
    }
    ctx.globalAlpha = 1;

    // 3. Vignettatura regale ambrata e ombre drammatiche
    const vg = ctx.createRadialGradient(W / 2, H / 2, 130, W / 2, H / 2, 330);
    vg.addColorStop(0, 'rgba(20, 14, 8, 0)');
    vg.addColorStop(1, 'rgba(20, 14, 8, 0.40)');
    ctx.fillStyle = vg;
    ctx.fillRect(48, 52, W - 96, H - 96);
    ctx.restore();
  }
}

function disegnaStanzaPixelArt(tick, st) {
  ctx.drawImage(getFloorTileCanvas(statoRun.piano), 0, 0, W, H); // (T5) la cache è alla risoluzione del buffer

  if (st.tipo === 'tesoro' || st.tipo === 'fucina' || st.tipo === 'boss' || st.tipo === 'segreta' || st.tipo === 'patto') {
    ctx.fillStyle = st.tipo === 'tesoro'
      ? '#5c4214'
      : st.tipo === 'fucina'
        ? '#472112'
        : st.tipo === 'segreta'
          ? '#2d193c'
          : st.tipo === 'patto'
            ? '#240812'
            : '#4a1210';
    const rx = (st.tipo === 'fucina' || st.tipo === 'patto') ? 126 : 210;
    const rw = (st.tipo === 'fucina' || st.tipo === 'patto') ? 388 : 220;
    ctx.fillRect(rx, 130, rw, 114);
    ctx.strokeStyle = st.tipo === 'segreta' ? '#c084fc' : st.tipo === 'patto' ? '#ef4444' : '#f9cb40';
    ctx.lineWidth = 2;
    ctx.strokeRect(rx + 2, 132, rw - 4, 110);
  }

  const brFrame = Math.floor(tick / 8) % 2 === 0 ? SPRITE_SCENA.braciere0 : SPRITE_SCENA.braciere1;
  for (const tx of [150, 490]) {
    drawPixelSprite(brFrame, tx, 62, 1.5);
  }

  const chiuse = !st.pulita;
  const porte = {
    N: { x: 320, y: 61, w: 36, h: 18 },
    S: { x: 320, y: 313, w: 36, h: 18 },
    W: { x: 59, y: 187, w: 18, h: 36 },
    E: { x: 581, y: 187, w: 18, h: 36 },
  };

  if (st.muroSegreto && !st.muroSegreto.aperto) {
    const p = porte[st.muroSegreto.lato];
    // --- C: inizio --- crepa discreta, visibile solo da vicino (STANZE_C.segreta.raggioCrepa), senza etichetta
    const dCrepa = p ? Math.hypot(player.x - p.x, player.y - p.y) : Infinity;
    if (p && dCrepa < STANZE_C.segreta.raggioCrepa) {
      const vis = 1 - dCrepa / STANZE_C.segreta.raggioCrepa;
      ctx.save();
      ctx.strokeStyle = `rgba(20, 12, 8, ${(0.25 + 0.35 * vis).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x - 5, p.y - 4);
      ctx.lineTo(p.x - 1, p.y);
      ctx.lineTo(p.x + 3, p.y - 2);
      ctx.lineTo(p.x + 1, p.y + 4);
      ctx.stroke();
      ctx.restore();
    }
  }
  // --- C: fine ---

  for (const [lato, idDest] of Object.entries(st.porte)) {
    const dest = statoRun.mappa.perId.get(idDest);
    const p = porte[lato];
    // --- B: inizio --- (porta speciale della Stanza dello Sviluppatore)
    const colCornice = dest?.tipo === 'sviluppatore' ? OGGETTI_B.sviluppatore.colore : dest?.tipo === 'tesoro'
    // --- B: fine ---
      ? '#f9cb40'
      : dest?.tipo === 'fucina'
        ? '#ea8626'
        : dest?.tipo === 'boss'
          ? '#e53222'
          : dest?.tipo === 'segreta'
            ? '#c084fc'
            : '#9ca3af';

    ctx.fillStyle = '#0a0604';
    ctx.fillRect(p.x - p.w / 2 - 2, p.y - p.h / 2 - 2, p.w + 4, p.h + 4);
    ctx.fillStyle = colCornice;
    ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
    ctx.fillStyle = chiuse ? '#571b14' : '#090604';
    ctx.fillRect(p.x - p.w / 2 + 3, p.y - p.h / 2 + 3, p.w - 6, p.h - 6);

    if (chiuse) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(p.x - 6, p.y - p.h / 2 + 3, 2, p.h - 6);
      ctx.fillRect(p.x + 4, p.y - p.h / 2 + 3, 2, p.h - 6);
    } else if (dest) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px ui-monospace, monospace';
      ctx.textAlign = 'center';
      // --- B: inizio ---
      const tag = dest.tipo === 'sviluppatore' ? '✎' : dest.tipo === 'tesoro'
      // --- B: fine ---
        ? '★'
        : dest.tipo === 'fucina'
          ? '⚒'
          : dest.tipo === 'boss'
            ? '💀'
            : dest.tipo === 'segreta'
              ? '?'
              : '';
      if (tag) ctx.fillText(tag, p.x, p.y + 3);
    }
    // --- B: inizio --- (cornice pulsante: la porta dello Sviluppatore si riconosce da lontano)
    if (dest?.tipo === 'sviluppatore') {
      ctx.save();
      ctx.strokeStyle = OGGETTI_B.sviluppatore.colore;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(tick * 0.12);
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - p.w / 2 - 5, p.y - p.h / 2 - 5, p.w + 10, p.h + 10);
      ctx.restore();
    }
    // --- B: fine ---
  }
  // --- B: inizio ---
  if (st.tipo === 'sviluppatore') disegnaAltareSviluppatoreB(st, tick);
  // --- B: fine ---
  disegnaAtmosferaQuartiere(tick, statoRun.piano);
}

// ===========================================================================
// MENÙ INIZIALE DI SELEZIONE DEL PERSONAGGIO ()
// ===========================================================================
function disegnaMenuSelezionePersonaggio(tick) {
  // 1. Fondale teatrale e pedana in legno
  ctx.fillStyle = '#0a0604';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#180e08';
  ctx.fillRect(0, 276, W, H - 276);
  ctx.strokeStyle = '#2d180d';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 276, W, H - 276);
  for (let tx = 0; tx < W; tx += 36) {
    ctx.beginPath();
    ctx.moveTo(tx, 276);
    ctx.lineTo(tx, H);
    ctx.stroke();
  }

  // 2. Drappeggi e tende del teatro in alto
  ctx.fillStyle = '#5c120a';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, 36);
  for (let x = W; x >= 0; x -= 32) {
    ctx.quadraticCurveTo(x - 16, 46 + Math.sin(x) * 2.5, x - 32, 36);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f9cb40';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Frange e quinte laterali
  ctx.fillStyle = '#3a0805';
  ctx.fillRect(0, 36, 20, H - 36);
  ctx.fillRect(W - 20, 36, 20, H - 36);
  ctx.strokeStyle = '#f9cb40';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(0, 36, 20, H - 36);
  ctx.strokeRect(W - 20, 36, 20, H - 36);

  // Grandi Mani di Marionetta che muovono i bilancini in alto
  disegnaManoMarionettaPittorica(140, 24, 1, 0.95, tick, false);
  disegnaManoMarionettaPittorica(500, 24, -1, 0.95, tick + 14, false);

  // 3. Titolo del Menù
  drawTextFit('★ TEATRO DELLE MARIONETTE D\'OMBRA ★', W / 2, 17, 360, {
    size: 10.5, color: '#f9cb40', shadow: true, weight: 'bold',
  });
  drawTextFit('SCEGLI IL TUO BURATTINO PER INIZIARE LA COMMEDIA', W / 2, 40, 460, {
    size: 7.8, color: '#f3dfc1', shadow: false,
  });

  // 4. Le 4 Card dei personaggi affiancate
  const listaPersonaggi = ['ferruccio', 'agnese', 'taddeo', 'ombra'];
  const cardW = 132, cardH = 226, cardY = 56;
  const gap = 14;
  const startX = 35;

  for (let i = 0; i < listaPersonaggi.length; i++) {
    const pId = listaPersonaggi[i];
    const p = PERSONAGGI_GIOCABILI[pId];
    const cx = startX + i * (cardW + gap);
    const isSelected = statoRun.personaggioId === pId;

    ctx.save();
    // Filo dorato che scende dal soffitto verso la pedana del burattino
    ctx.strokeStyle = isSelected ? 'rgba(249, 203, 64, 0.85)' : 'rgba(249, 203, 64, 0.35)';
    ctx.lineWidth = isSelected ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + cardW / 2, 34);
    ctx.lineTo(cx + cardW / 2, cardY + 20);
    ctx.stroke();

    // Card Box
    ctx.fillStyle = isSelected ? '#24140b' : '#140c08';
    ctx.fillRect(cx, cardY, cardW, cardH);
    ctx.strokeStyle = isSelected ? '#f9cb40' : '#452c1a';
    ctx.lineWidth = isSelected ? 2.5 : 1.2;
    ctx.strokeRect(cx, cardY, cardW, cardH);

    // Bagliore dorato pulsante sulla card selezionata
    if (isSelected) {
      const pulse = 0.55 + 0.45 * Math.sin(tick * 0.12);
      ctx.strokeStyle = `rgba(249, 203, 64, ${pulse.toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 3, cardY + 3, cardW - 6, cardH - 6);
    }

    // Pedana circolare di legno sotto il personaggio
    const pedX = cx + cardW / 2;
    const pedY = cardY + 68;
    ctx.fillStyle = isSelected ? '#4a2c16' : '#28170c';
    ctx.beginPath();
    ctx.ellipse(pedX, pedY + 8, 28, 9, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#f9cb40' : '#694121';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Disegno pittorico completo del personaggio in posa animata
    const charSinergie = {};
    if (p.passivoIniziale) charSinergie[p.passivoIniziale] = true;
    if (pId === 'ombra') charSinergie.patto_raggio = true;

    disegnaFerruccioPittorico(pedX, pedY, {
      charId: pId,
      charInfo: p,
      flipX: false,
      moving: false,
      tick,
      haSpada: pId === 'taddeo' || p.passivoIniziale === 'spada',
      sinergie: charSinergie,
    });

    // Tasto rapido [1]..[4]
    drawPillLabel(`[${i + 1}]`, cx + 18, cardY + 12, 24, {
      size: 7,
      color: isSelected ? '#f9cb40' : '#9ca3af',
      border: isSelected ? '#f9cb40' : '#4b5563',
    });

    // Nome Personaggio
    drawTextFit(p.nome.toUpperCase(), pedX, cardY + 95, cardW - 10, {
      size: 8.5,
      color: isSelected ? '#f9cb40' : '#ffffff',
      weight: 'bold',
    });
    // Sottotitolo / Ruolo
    drawTextFit(p.titolo, pedX, cardY + 107, cardW - 12, {
      size: 7,
      color: isSelected ? '#67e8f9' : '#a8a29e',
      weight: '',
    });

    // Statistiche
    const schedaD2v = typeof schedaD2 === 'function' ? schedaD2(pId) : {}; // (d2) teatro/d2-personaggi.js
    // j1: la vita sono Maschere disegnate, non cuori
    if (schedaD2v.vita || typeof disegnaFilaMaschereJ1 !== 'function') {
      drawTextFit(`Vita: ${schedaD2v.vita || p.hpHalf / 2} Maschera`, pedX, cardY + 126, cardW - 12, { size: 7.5, color: '#ef4444' });
    } else {
      drawTextFit(TESTI_J1.vita, pedX - 30, cardY + 126, 30, { size: 7.5, color: '#ef4444', align: 'left' });
      disegnaFilaMaschereJ1(pedX + 12, cardY + 123, p.hpHalf, p.hpHalf, { centro: true });
    }
    drawTextFit(`⚔ DMG: ${p.baseDmg.toFixed(2)}  🥾 SPD: ${p.baseSpd.toFixed(2)}`, pedX, cardY + 140, cardW - 12, {
      size: 7.5, color: '#f9cb40',
    });

    // Oggetto Attivo [Q]
    const att = OGGETTI_ATTIVI[p.attivoIniziale];
    drawTextFit(`Attivo [Q]: ${att ? att.nome.split(' ')[0] : 'Forbici'}`, pedX, cardY + 160, cardW - 10, {
      size: 7.5, color: '#38bdf8',
    });

    // Oggetto / Potere Iniziale
    const donoNome = schedaD2v.dono ? schedaD2v.dono : pId === 'agnese' ? '👓 Lente 20/20' : pId === 'taddeo' ? '🗡 Spada Gaetano' : pId === 'ombra' ? '🩸 Anello Cremisi' : '✨ Libero dai Fili';
    drawTextFit(`Dono: ${donoNome}`, pedX, cardY + 175, cardW - 10, {
      size: 7.5, color: '#4ade80',
    });
    if (schedaD2v.stile) drawTextFit(schedaD2v.stile, pedX, cardY + 116.5, cardW - 10, { size: 6, color: '#e9d5b7', weight: '' }); // (d2)

    // Indicatore di Selezione
    if (isSelected) {
      ctx.fillStyle = '#63150d';
      ctx.fillRect(cx + 8, cardY + 196, cardW - 16, 20);
      ctx.strokeStyle = '#f9cb40';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx + 8, cardY + 196, cardW - 16, 20);
      drawTextFit('★ SELEZIONATO ★', pedX, cardY + 209, cardW - 20, {
        size: 7.5, color: '#f9cb40', weight: 'bold',
      });
    } else {
      ctx.fillStyle = '#1c140e';
      ctx.fillRect(cx + 8, cardY + 196, cardW - 16, 20);
      ctx.strokeStyle = '#382518';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 8, cardY + 196, cardW - 16, 20);
      drawTextFit('Clicca per scegliere', pedX, cardY + 209, cardW - 20, {
        size: 7, color: '#78716c',
      });
    }

    ctx.restore();
  }

  // 5. Pulsante Dorato Avvia Commedia in basso
  const curP = PERSONAGGI_GIOCABILI[statoRun.personaggioId] || PERSONAGGI_GIOCABILI.ferruccio;
  const btnW = 320, btnH = 34;
  const btnX = (W - btnW) / 2, btnY = 302;
  const pulseBtn = 0.8 + 0.2 * Math.sin(tick * 0.14);

  ctx.save();
  ctx.fillStyle = '#6e150d';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = `rgba(249, 203, 64, ${pulseBtn.toFixed(2)})`;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  drawTextFit(`▶ INIZIA LA COMMEDIA CON ${curP.nome.toUpperCase()} ◀`, W / 2, btnY + 16, btnW - 16, {
    size: 9.5, color: '#f9cb40', weight: 'bold',
  });
  drawTextFit('Clicca qui o premi [SPAZIO / INVIO] per entrare nel Teatro', W / 2, btnY + 27, btnW - 16, {
    size: 7.5, color: '#ffffff',
  });
  ctx.restore();
}

function disegnaFrame(dtMs) {
  // --- T4: inizio ---
  if (t4Gancio('disegna', dtMs)) return;
  // --- T4: fine ---
  if (statoRun.fase === 'menu_selezione') {
    disegnaMenuSelezionePersonaggio(tick);
    // --- T3: inizio ---
    window.__teatroT3?.disegnaMenu?.(ctx); // riga «Slot 1-5» e conferma di cancellazione
    // --- T3: fine ---
    return;
  }
  const st = statoRun.stanzaCorrente;
  // =========================================================================
  // RENDERING PITTORICO DARK-FAIRYTALE DELLA SCENA
  // =========================================================================
  const scossa = offsetScossa(dtMs);
  ctx.save();
  if (scossa.x || scossa.y) ctx.translate(scossa.x, scossa.y);

  if (st) {
    disegnaStanzaPixelArt(tick, st);

    // 1. Macchie permanenti sul palco (Inchiostro di china, sangue del Velo, schegge)
    if (st.macchie && st.macchie.length > 0) {
      for (const m of st.macchie) {
        ctx.fillStyle = m.col;
        ctx.beginPath();
        if (m.tipo === 'scheggia') {
          ctx.ellipse(m.x, m.y, m.r * 1.6, m.r * 0.6, 0.4, 0, TAU);
        } else {
          ctx.arc(m.x, m.y, m.r, 0, TAU);
        }
        ctx.fill();
      }
    }
    disegnaMacchie(); // (T1) china o schegge dei nemici caduti, finché si resta nella stanza

    // 2. Pozzanghere di fuoco attivo dai bracieri rovesciati
    if (st.pozzanghereFuoco && st.pozzanghereFuoco.length > 0) {
      for (const fz of st.pozzanghereFuoco) {
        const fg = ctx.createRadialGradient(fz.x, fz.y, 2, fz.x, fz.y, fz.r);
        fg.addColorStop(0, '#fef08a');
        fg.addColorStop(0.5, 'rgba(249, 115, 22, 0.65)');
        fg.addColorStop(1, 'rgba(185, 28, 28, 0)');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(fz.x, fz.y, fz.r, 0, TAU); ctx.fill();
        // Fiammella viva
        const fy = fz.y + Math.sin(tick * 0.4 + fz.x) * 3;
        ctx.fillStyle = tick % 2 === 0 ? '#fbbf24' : '#ef4444';
        ctx.beginPath(); ctx.arc(fz.x + Math.sin(tick * 0.3) * 4, fy - 3, 3, 0, TAU); ctx.fill();
      }
    }

    // 3. Ostacoli Tattici Ambientali sul Palco
    for (const o of st.ostacoli) {
      if (typeof disegnaOstacoloB9 === 'function' && disegnaOstacoloB9(o, tick)) continue; // --- b9: immagine di scena dell'autore, se c'è (b9-immagini.js) ---
      if (o.variante && typeof disegnaOstacoloB7 === 'function' && disegnaOstacoloB7(o, tick)) continue; // --- b7: ostacoli con una pelle (b7-stanze.js) ---
      if (o.tipo === 'fossa') {
        // Botola teatrale / fossa scura tra le assi
        ctx.fillStyle = '#050302';
        ctx.fillRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
      } else if (o.tipo === 'colonna') {
        // Pilastro di pietra barocco di Caserta
        // Ombra a terra
        ctx.fillStyle = 'rgba(8, 5, 3, 0.65)';
        ctx.beginPath(); ctx.ellipse(o.x, o.y + 7, 16, 6, 0, 0, TAU); ctx.fill();
        // Fusto in pietra con chiaroscuro
        const cg = ctx.createLinearGradient(o.x - 12, o.y - 20, o.x + 12, o.y);
        cg.addColorStop(0, '#94a3b8');
        cg.addColorStop(0.5, '#475569');
        cg.addColorStop(1, '#1e293b');
        ctx.fillStyle = cg;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(o.x, o.y - 18, 12, 4.5, 0, 0, TAU);
        ctx.ellipse(o.x, o.y + 2, 12, 4.5, 0, 0, TAU);
        ctx.fill(); ctx.stroke();
        ctx.fillRect(o.x - 12, o.y - 18, 24, 20);
        ctx.strokeRect(o.x - 12, o.y - 18, 24, 20);
      } else {
        // Braciere di scena in ferro battuto
        ctx.fillStyle = 'rgba(8, 5, 3, 0.6)';
        ctx.beginPath(); ctx.ellipse(o.x, o.y + 4, 13, 5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1c1917';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(o.x - 10, o.y - 12);
        ctx.lineTo(o.x + 10, o.y - 12);
        ctx.lineTo(o.x + 4, o.y + 2);
        ctx.lineTo(o.x - 4, o.y + 2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        if (o.acceso) {
          const fy = o.y - 16 + Math.sin(tick * 0.4) * 2;
          ctx.fillStyle = '#f97316';
          ctx.beginPath(); ctx.arc(o.x, fy, 4, 0, TAU); ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath(); ctx.arc(o.x, fy - 1, 2, 0, TAU); ctx.fill();
        }
      }
    }

    if (st.oggettiATerra && st.oggettiATerra.length > 0) {
      for (const pk of st.oggettiATerra) {
        const bounce = Math.round(Math.sin(tick * 0.12 + pk.x) * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(Math.round(pk.x - 5), Math.round(pk.y + 5), 10, 3);
        drawPixelSprite(SPRITE_OGGETTI[pk.sprite] || SPRITE_OGGETTI.moneta1, pk.x, pk.y + bounce, 1.8);
        if (pk.tipo === 'moneta' && pk.valore >= 3) {
          drawTextFit('3🪙', pk.x, pk.y - 9 + bounce, 28, { size: 7, color: '#67e8f9' });
        }
      }
    }

    if (st.pulita && st.oggettoPiedistallo) {
      const o = st.oggettoPiedistallo;
      const spPed = o.forteGratis ? SPRITE_SCENA.piedistalloOro : SPRITE_SCENA.piedistallo;
      drawPixelSprite(spPed, o.x, o.y + 8, 2);
      if (!o.preso) {
        const floatY = Math.round(Math.sin(tick * 0.08) * 3);
        drawPixelSprite(o.cuoreB ? SPRITE_OGGETTI[o.sprite] : spriteD(o), o.x, o.y - 12 + floatY, 2); // D: sagoma col Cieco
        const badge = o.forteGratis ? '★ FORTE GRATIS' : '🎁 OGGETTO GRATIS';
        drawPillLabel(`${badge}: ${o.cuoreB ? o.nome : nomeD(o)} [Click/E]`, o.x, o.y - 28, 300, {
          size: 8,
          color: o.forteGratis ? '#f9cb40' : '#67e8f9',
          border: o.forteGratis ? '#f9cb40' : '#0891b2',
        });
        const pw = 336, ph = 30;
        const px = Math.max(82, Math.min(W - pw - 82, Math.round(o.x - pw / 2)));
        const py = Math.min(256, Math.round(o.y + 18));
        ctx.fillStyle = 'rgba(10, 6, 4, 0.92)';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = o.forteGratis ? '#f9cb40' : '#5c4024';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, pw, ph);
        drawTextFit(o.cuoreB ? o.statsDesc : descD(o), px + pw / 2, py + 12, pw - 12, { size: 8, color: '#4ade80' }); // D
        drawTextFit(`«${o.cuoreB ? o.lore : loreD(o)}»`, px + pw / 2, py + 24, pw - 12, { size: 7.5, style: 'italic', weight: '', color: '#e6d2aa' });
      }
    }

    // NOTA: Ferruccio NON ha il filo! Solo i nemici, i boss e Mastro Peppe hanno i fili d'oro!
    const fili = [];

    // La Fucina (⚒ bottega)
    if (st.tipo === 'fucina') {
      fili.push([320, 124]);
      const peppeFrame = Math.floor(tick / 14) % 2 === 0 ? SPRITE_SCENA.mercante : SPRITE_SCENA.mercante1;
      drawPixelSprite(peppeFrame, 320, 138, 1.9);
      drawPixelSprite(SPRITE_SCENA.incudine, 282, 146, 1.6);
      // --- T3: inizio ---
      // brFrame era definito solo in disegnaStanzaPixelArt: qui lanciava ReferenceError e fermava il loop nella Fucina.
      const brFrame = Math.floor(tick / 8) % 2 === 0 ? SPRITE_SCENA.braciere0 : SPRITE_SCENA.braciere1;
      // --- T3: fine ---
      drawPixelSprite(brFrame, 210, 142, 1.7);
      drawPixelSprite(brFrame, 430, 142, 1.7);

      drawPillLabel(
        `⚒ LA FUCINA DI MASTRO PEPPE · OGGETTI ${statoRun.oggettiEquipaggiati.length} ⚒`,
        320,
        112,
        376,
        { size: 8, color: '#f9cb40', border: '#f9cb40' }
      );

      let slotVicino = null;
      let minDistSlot = 999;

      for (const sl of st.slotFucina) {
        const spPed = sl.tier === 'forte' ? SPRITE_SCENA.piedistalloOro : SPRITE_SCENA.piedistallo;
        drawPixelSprite(spPed, sl.x, sl.y + 10, 1.55);
        if (!sl.comprato) {
          const dPlayer = Math.hypot(player.x - sl.x, player.y - sl.y);
          if (dPlayer < minDistSlot) {
            minDistSlot = dPlayer;
            slotVicino = sl;
          }
          const floatY = Math.round(Math.sin(tick * 0.08 + sl.x) * 2);
          drawPixelSprite(sl.item ? spriteD(sl.item) : (SPRITE_OGGETTI[sl.sprite] || SPRITE_OGGETTI.cuore), sl.x, sl.y - 6 + floatY, 1.75); // D
          drawPillLabel(sl.item && maledizioneD('cieco') ? '???' : (sl.nomeBreve || sl.nome), sl.x, sl.y - 20, 96, {
            size: 7.5,
            color: sl.tier === 'forte' ? '#f9cb40' : '#ffffff',
            border: sl.tier === 'forte' ? '#f9cb40' : '#5c4024',
          });
          if (sl.inSaldo) {
            drawPillLabel(`SALDI ${sl.prezzo}🪙!`, sl.x, sl.y + 27, 88, {
              size: 7.5, color: '#4ade80', border: '#22c55e',
            });
          } else {
            const puo = statoRun.monete >= sl.prezzo;
            drawPillLabel(`${sl.prezzo}🪙 [Click/E]`, sl.x, sl.y + 27, 92, {
              size: 7.5,
              color: puo ? '#f9cb40' : '#f87171',
              border: puo ? '#8a5a2b' : '#7f1d1d',
            });
          }
        } else {
          drawPillLabel('VENDUTO', sl.x, sl.y + 2, 72, { size: 7, color: '#64748b', border: '#334155' });
        }
      }

      if (slotVicino) {
        const bx = 132, by = 232, bw = 376, bh = 28;
        ctx.fillStyle = 'rgba(10, 6, 4, 0.94)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = slotVicino.tier === 'forte' ? '#f9cb40' : '#8a5a2b';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
        drawTextFit(
          `${slotVicino.item && maledizioneD('cieco') ? '???' : slotVicino.nome} (${slotVicino.prezzo}🪙)`, // D
          bx + bw / 2,
          by + 11,
          bw - 12,
          { size: 8, color: slotVicino.tier === 'forte' ? '#f9cb40' : '#ffffff' }
        );
        drawTextFit(
          slotVicino.item ? descD(slotVicino.item) : slotVicino.statsDesc, // D: effetto nascosto
          bx + bw / 2,
          by + 23,
          bw - 12,
          { size: 7.5, color: '#4ade80' }
        );
      }
    }

    // PROPOSTA 2: Stanza del Patto d'Ombra (😈)
    if (st.tipo === 'patto') {
      drawPillLabel(
        `😈 STANZA DEL PATTO D'OMBRA · SACRIFICA 1 MASCHERA INTERA (-1 MASCHERA MAX) 😈`,
        320,
        106,
        410,
        { size: 8, color: '#f87171', border: '#ef4444' }
      );
      for (const p of (st.slotPatto || [])) {
        drawPixelSprite(SPRITE_SCENA.piedistalloOro, p.x, p.y + 10, 1.8);
        if (!p.comprato) {
          const floatY = Math.round(Math.sin(tick * 0.08 + p.x) * 3);
          drawPixelSprite(SPRITE_OGGETTI[p.sprite] || SPRITE_OGGETTI.anello, p.x, p.y - 8 + floatY, 1.9);
          drawPillLabel(p.nomeBreve || p.nome, p.x, p.y - 24, 150, {
            size: 8, color: '#fca5a5', border: '#ef4444',
          });
          drawPillLabel(`PATTO: -1 Maschera max [Click/E]`, p.x, p.y + 28, 148, {
            size: 7.5, color: '#f87171', border: '#991b1b',
          });
          drawTextFit(p.statsDesc, p.x, p.y + 42, 170, { size: 7.5, color: '#4ade80' });
        } else {
          drawPillLabel('PATTO SIGILLATO', p.x, p.y + 2, 110, { size: 7.5, color: '#9ca3af', border: '#4b5563' });
        }
      }
      // Portale per tornare alla Stanza del Boss
      ctx.fillStyle = '#1f0910';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.fillRect(280, 248, 80, 22);
      ctx.strokeRect(280, 248, 80, 22);
      drawTextFit('▲ TORNA AL BOSS [Click/E]', 320, 262, 140, { size: 7.5, color: '#fca5a5' });
    }

    // Botola del Boss + Porta di Velluto Cremisi del Patto d'Ombra!
    if (st.tipo === 'boss') {
      ctx.fillStyle = '#0a0604';
      ctx.fillRect(302, 174, 36, 32);
      ctx.strokeStyle = st.uscitaAperta ? '#f9cb40' : '#8f160c';
      ctx.lineWidth = 2;
      ctx.strokeRect(302, 174, 36, 32);
      const pianoNelCiclo = ((statoRun.piano - 1) % 4) + 1;
      const msgBotola = st.uscitaAperta
        ? (pianoNelCiclo === 4
          ? `▼ BIS! LOOP INFINITO · PIANO ${statoRun.piano + 1} (CICLO ${statoRun.ciclo + 1}) [Click/E] ▼`
          : `▼ SCENDI AL PIANO ${statoRun.piano + 1} [Click/E] ▼`)
        : (typeof lucianaInScenaD7 === 'function' && lucianaInScenaD7() ? '' : '🔒 SCONFIGGI IL BOSS PER APRIRE LA BOTOLA'); // (d7) non copre Donna Luciana
      if (msgBotola) drawPillLabel(msgBotola, 320, 222, 340, {
        size: 8,
        color: st.uscitaAperta ? '#f9cb40' : '#f87171',
        border: st.uscitaAperta ? '#f9cb40' : '#8f160c',
      });

      if (st.portaPattoAperta) {
        ctx.fillStyle = '#24060d';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.fillRect(422, 168, 48, 40);
        ctx.strokeRect(422, 168, 48, 40);
        drawTextFit('😈', 446, 193, 30, { size: 13, color: '#ef4444' });
        drawPillLabel('😈 PATTO D\'OMBRA [Click/E]', 446, 156, 142, {
          size: 7.5, color: '#fca5a5', border: '#ef4444',
        });
      }
    }

    // Onde d'urto delle esplosioni (Bozzoli Esplosivi / Atterraggio del Re Gatto / Tamburello)
    if (statoRun.ondeEsplosione && statoRun.ondeEsplosione.length > 0) {
      for (let i = statoRun.ondeEsplosione.length - 1; i >= 0; i--) {
        const onda = statoRun.ondeEsplosione[i];
        onda.r += (onda.maxR - onda.r) * 0.25;
        onda.tick = (onda.tick || 0) + 1; // molte onde nascono senza tick: con «tick++» restavano a schermo per sempre
        const alpha = Math.max(0, 1 - onda.tick / 16);
        ctx.save();
        ctx.globalAlpha = alpha;          // l'anello sfuma anche quando ha un colore suo
        ctx.strokeStyle = onda.color || onda.colore || `rgba(251, 146, 60, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(onda.x, onda.y, onda.r, 0, TAU);
        ctx.stroke();
        ctx.restore();
        if (onda.tick >= 16) statoRun.ondeEsplosione.splice(i, 1);
      }
    }

    // Nemici e Boss dipinti in stile pittorico dark-fairytale!
    for (const n of st.nemici) {
      if (n.hp <= 0) continue;
      const airOffset = n.airZ || 0;
      if (!n.senzaFili) fili.push([n.x, n.y - 18 - airOffset, n.boss ? 18 : 9]); // (h5) le figure del Sottopalco non hanno fili

      if (n.boss) {
        disegnaBossPittorico(ctx, n, tick);
        if (n.bossId === 'donna-luciana') {
          // --- A: inizio --- esattamente DUE Mani (n.maniA), mobili, con i due fili di disegnaFiliMarionetta
          const LA = BOSS_A.luciana;
          const mani = n.maniA || [-1, 1].map((s) => ({ lato: -s, x: n.x + s * LA.scartoMani, y: LA.quotaRiposoY, fase: 'riposo' }));
          for (const m of mani) {
            if (m.fase !== 'mira' && m.fase !== 'discesa') continue;
            const k = m.fase === 'mira' ? 1 - m.t / LA.miraTick : 1;
            ctx.save();
            ctx.fillStyle = `rgba(220, 38, 38, ${0.18 + 0.32 * k})`;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(m.x, m.ty + LA.palmoY + 4, LA.raggioSchianto * (1.3 - 0.3 * k), 7 * (1.3 - 0.3 * k), 0, 0, TAU);
            ctx.fill(); ctx.stroke();
            ctx.restore();
          }
          disegnaFiliMarionetta({ x: n.x, piedi: n.y - 18, altezza: 0, mezza: 18 },
            [mani[0].x, mani[0].y + 15 * LA.scala], [mani[1].x, mani[1].y + 15 * LA.scala]);
          disegnaManoMarionettaPittorica(mani[0].x, mani[0].y, 1, LA.scala, tick, false);
          disegnaManoMarionettaPittorica(mani[1].x, mani[1].y, -1, LA.scala, tick + 12, false);
          // --- A: fine ---
        }
        // --- A: inizio --- Custode di Marmo: alone d'oro quando è aperto (vulnerabile), guscio di pietra se chiuso
        if (n.bossId === 'colosso-statua') {
          ctx.save();
          if (n.apertoCM) {
            const pul = 0.55 + Math.sin(tick * 0.25) * 0.25;
            const gl = ctx.createRadialGradient(n.x, n.y - 18, 2, n.x, n.y - 18, 34);
            gl.addColorStop(0, `rgba(249, 203, 64, ${0.55 * pul})`);
            gl.addColorStop(1, 'rgba(249, 203, 64, 0)');
            ctx.fillStyle = gl;
            ctx.beginPath(); ctx.arc(n.x, n.y - 18, 34, 0, TAU); ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.arc(n.x, n.y - 18, 30, 0, TAU); ctx.stroke();
          } else {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
            ctx.lineWidth = 2.4;
            ctx.setLineDash([5, 4]);
            ctx.beginPath(); ctx.arc(n.x, n.y - 18, 30, 0, TAU); ctx.stroke();
          }
          ctx.restore();
        }
        // --- A: fine ---
        // --- A: inizio --- Spezzafili d'Ottone: linea di mira della carica e forbici rotanti a boomerang
        if (n.bossId === 'maestro-fucina') {
          if (n.statoSF === 'mira') {
            ctx.save();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.moveTo(n.x, n.y - 6);
            ctx.lineTo(n.x + Math.cos(n.angSF || 0) * 140, n.y - 6 + Math.sin(n.angSF || 0) * 140);
            ctx.stroke();
            ctx.restore();
          }
          for (const f of n.forbiciA || []) {
            const apre = 0.35 + Math.abs(Math.sin(f.t * 0.3)) * 0.35;
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rot);
            ctx.fillStyle = '#e8c35a';
            ctx.strokeStyle = '#3b1d0b';
            ctx.lineWidth = 1.1;
            for (const sg of [-1, 1]) {
              ctx.save();
              ctx.rotate(sg * apre);
              ctx.beginPath();
              ctx.moveTo(0, 0); ctx.quadraticCurveTo(7, -2.2, 13, 0); ctx.quadraticCurveTo(7, 2.2, 0, 0);
              ctx.fill(); ctx.stroke();
              ctx.beginPath(); ctx.arc(-5, 0, 3, 0, TAU); ctx.stroke();
              ctx.restore();
            }
            ctx.fillStyle = '#f9cb40';
            ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, TAU); ctx.fill();
            ctx.restore();
          }
        }
        // --- A: fine ---
      } else {
        disegnaNemicoPittorico(ctx, n, tick);
        if (n.mobSoldi) {
          drawTextFit('🪙', n.x, n.y - 25, 20, { size: 7.5, color: '#f9cb40' });
        } else if (n.champion) {
          const chCol = n.champion === 'cremisi' ? '#ef4444' : n.champion === 'dorato' ? '#f9cb40' : '#38bdf8';
          drawTextFit(`★${String(n.champion).toUpperCase()}`, n.x, n.y - 25, 58, { size: 6.5, color: chCol });
        }
        if (n.hp < n.maxHp) {
          ctx.fillStyle = '#0a0604';
          ctx.fillRect(n.x - 12, n.y - 21, 24, 4);
          ctx.fillStyle = n.burnTicks > 0 ? '#ea8626' : '#ef4444';
          ctx.fillRect(n.x - 11, n.y - 20, Math.round(22 * Math.max(0, n.hp / n.maxHp)), 2);
        }
      }
    }
    // --- T2: inizio ---
    t2Gancio('dopoNemici', ctx, st, tick); // pose di morte dei nemici appena abbattuti
    // --- T2: fine ---

    // Ferruccio Pittorico Dark-Fairytale fedele all'immagine di riferimento (SENZA ALCUN FILO!)
    // (T1) I-frames: lampeggio ad alpha FEEL.iframes.alpha a semionde di FEEL.iframes.semiperiodoMs
    const pSpento = player.invuln > 0 && Math.floor((tick * MS_PER_TICK) / FEEL.iframes.semiperiodoMs) % 2 === 1;
    const pFlash = false;
    ctx.save();
    if (pSpento) ctx.globalAlpha = FEEL.iframes.alpha;
    disegnaFerruccioPittorico(ctx, player.x, player.y, {
      scale: 1.0, scalaA2: player.scalaA2, // A2: elisir del Gigante e della Pulce (10-sprite.js)
      flipX: player.flipX,
      tick,
      moving: player.moving,
      shootAnim: player.shootAnimTimer > 0,
      pickup: player.pickupTimer > 0,
      flash: pFlash,
      haSpada: statoRun.haSpada && !(typeof fendenteVisibileJ1 === 'function' && fendenteVisibileJ1()), // j1: il fendente lo disegna j1
      swordAnimTick: player.swordAnimTick,
      swordAngle: player.swordAngle,
      charInfo: getCharCorrente(),
      sinergie: statoRun.sinergieVisive,
    });
    if (typeof disegnaFendenteJ1 === 'function') disegnaFendenteJ1(); // j1: anticipo, arco con scia, recupero
    ctx.restore();

    if (player.pickupTimer > 0 && player.pickupItem) {
      drawPixelSprite(SPRITE_OGGETTI[player.pickupItem.sprite] || SPRITE_OGGETTI.spada, player.x, player.y - 38, 2);
    }

    // Proiettili di Ferruccio
    for (const p of statoRun.proiettili) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(Math.round(p.x - 4), Math.round(p.y + 7), 8, 3);
      const sp = SPRITE_PROIETTILI[p.tipo] || SPRITE_PROIETTILI.base;
      drawPixelSprite(sp, p.x, p.y, 1.55 * statoRun.projScale);
    }

    disegnaFamigliOrbitaliD(); // --- D ---
    // Proiettili Nemici
    for (const pr of statoRun.proiettiliNemici) {
      if (typeof aloneProiettileD7 === 'function') aloneProiettileD7(pr); // (d7) leggibili sugli scacchi
      drawPixelSprite(SPRITE_PROIETTILI.nemico, pr.x, pr.y, pr.bossShot ? PROIETTILE_NEMICO_J1.scalaBoss : PROIETTILE_NEMICO_J1.scalaBase); // j1: base più piccoli (prima 1.55)
    }

    // Splash di impatto a 4 frame
    for (let i = statoRun.effettiSplash.length - 1; i >= 0; i--) {
      const ef = statoRun.effettiSplash[i];
      const fIdx = Math.min(3, Math.floor(ef.tick / 3));
      drawPixelSprite(SPRITE_PROIETTILI.splash[fIdx], ef.x, ef.y, 1.8);
      ef.tick++;
      if (ef.tick >= 12) statoRun.effettiSplash.splice(i, 1);
    }

    // Fulmini a catena
    for (let i = statoRun.scintilleFulmine.length - 1; i >= 0; i--) {
      const f = statoRun.scintilleFulmine[i];
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(f.x1, f.y1);
      ctx.lineTo((f.x1 + f.x2) / 2, (f.y1 + f.y2) / 2 - 6);
      ctx.lineTo(f.x2, f.y2);
      ctx.stroke();
      f.tick--;
      if (f.tick <= 0) statoRun.scintilleFulmine.splice(i, 1);
    }

    // Grandi Mani di Marionetta sopra a tutto (i fili d'oro scendono SOLO verso tutti gli altri e MAI verso Ferruccio!)
    const pianoNelCiclo = ((statoRun.piano - 1) % 4) + 1;
    const inBossFinale = st.tipo === 'boss' && pianoNelCiclo === 4 && st.nemici.some((n) => n.hp > 0);
    if (!inBossFinale) {
      // (T1) Due fili d'oro per marionetta, uno per Mano, 1 px al 30% (FEEL.fili)
      for (const [tx, ty, mezza] of fili) {
        disegnaFiliMarionetta({ x: tx, piedi: ty, altezza: 0, mezza: mezza || 10 });
      }
      // --- A: inizio --- (ordine unico x, y, lato, scala, tick, flash: due Mani simmetriche)
      disegnaManoMarionettaPittorica(216, 25, 1, 0.95, tick, false);
      disegnaManoMarionettaPittorica(424, 25, -1, 0.95, tick + 12, false);
      // --- A: fine ---
    }

    if (maledizioneD('buio')) disegnaBuioD(); // --- D: Lume Spento ---
    // --- T3: inizio ---
    window.__teatroT3?.disegnaMondo?.(ctx); // raggio cremisi (sotto l'HUD, dentro la scossa)
    // --- T3: fine ---
    disegnaHUDPixelArt(st);
    disegnaCartiglioD(); // --- D ---
    // --- B: inizio ---
    if (statoRun.pannelloB) disegnaPannelloSviluppatoreB();
    // --- B: fine ---
    if (statoRun.siparioAttivo) disegnaSiparioNarrativo(statoRun.siparioAttivo);
    if (statoRun.pausa) disegnaMenuPausa();
  }
  ctx.restore();
  // --- T3: inizio ---
  window.__teatroT3?.disegnaSopra?.(ctx); // conferma del patto
  // --- T3: fine ---
}

// ===========================================================================
// HUD PIXEL-ART CON STATISTICHE + MINIMAPPA AD ESPLORAZIONE + DOCK 5 SLOT
// (Ogni singola scritta usa drawTextFit + clip per NON uscire mai dai riquadri!)
// ===========================================================================
function disegnaHUDPixelArt(st) {
  // 1. Box alto a sinistra: Vita (Maschere intere e mezze) + Statistiche (danno, cadenza, velocità, monete)
  // (d7) fondo semitrasparente: la balconata del pubblico si intravede dietro il riquadro
  const hx = 6, hy = 5, hw = 172, hh = 52;
  const sj1 = typeof stileHudJ1 === 'function' ? stileHudJ1() : { fondo: 0.62, bordo: '#f9cb40', spessore: 1 }; // j1: HUD leggero
  ctx.save();
  ctx.fillStyle = `rgba(10, 6, 4, ${sj1.fondo})`;
  ctx.fillRect(hx, hy, hw, hh);
  ctx.strokeStyle = sj1.bordo;
  ctx.lineWidth = sj1.spessore;
  ctx.strokeRect(hx, hy, hw, hh);
  ctx.beginPath();
  ctx.rect(hx + 2, hy + 2, hw - 4, hh - 4);
  ctx.clip();

  const etichettaCiclo = statoRun.ciclo > 1 ? ` · Ciclo ∞${statoRun.ciclo}` : '';
  const chInfo = getCharCorrente();
  drawTextFit(`NOTTE ${statoRun.numeroNotte || 1} · ${chInfo.nome} · P.${statoRun.piano}${etichettaCiclo}`, hx + 6, hy + 11, hw - 12, {
    size: 8.5, color: '#ffffff', align: 'left',
  });

  // Vita: fila di Maschere (1 Maschera = 2 mezze-maschere), mai oltre il massimo (j1)
  if (typeof disegnaFilaMaschereJ1 === 'function') disegnaFilaMaschereJ1(hx + 6, hy + 19, statoRun.hpHalf, statoRun.maxHpHalf);
  else {
  const hpRatio = Math.max(0, Math.min(1, statoRun.hpHalf / statoRun.maxHpHalf));
  ctx.fillStyle = '#2d1210';
  ctx.fillRect(hx + 6, hy + 15, 98, 8);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(hx + 6, hy + 15, Math.round(98 * hpRatio), 8);
  ctx.strokeStyle = '#0a0604';
  ctx.strokeRect(hx + 6, hy + 15, 98, 8);
  drawTextFit(
    `${(Math.min(statoRun.hpHalf, statoRun.maxHpHalf) / 2).toFixed(1)}/${(statoRun.maxHpHalf / 2).toFixed(0)} Maschere`,
    hx + 108,
    hy + 22,
    hw - 112,
    { size: 7.5, color: '#ffffff', align: 'left' }
  );
  }

  // Statistiche
  drawTextFit(
    `⚔DMG:${statoRun.dmg.toFixed(2)}  ✦CAD:${statoRun.colpiAlSec.toFixed(1)}/s`,
    hx + 6,
    hy + 35,
    hw - 12,
    { size: 8, color: '#f9cb40', align: 'left' }
  );
  drawTextFit(
    `🪙${statoRun.monete}${typeof testoInventarioA1 === 'function' ? testoInventarioA1() : ''} · 🥾SPD:${(statoRun.speed / 2).toFixed(2)} · Ogg:${statoRun.oggettiEquipaggiati.length}`,
    hx + 6,
    hy + 47,
    hw - 12,
    { size: 8, color: '#e6d2aa', align: 'left' }
  );
  ctx.restore();

  // 2. In alto al centro: Barra Vita Boss (con HP numerici!) o Info Piano
  const boss = st.nemici.find((n) => n.boss && n.hp > 0);
  if (boss) {
    const bw = 204, bx = Math.round((W - bw) / 2), by = 17;
    ctx.save();
    ctx.fillStyle = 'rgba(10,6,4,0.92)';
    ctx.fillRect(bx - 6, 4, bw + 12, 26);
    ctx.strokeStyle = '#e53222';
    ctx.strokeRect(bx - 6, 4, bw + 12, 26);
    drawTextFit(
      `${boss.nome.toUpperCase()} (${Math.ceil(boss.hp)}/${boss.maxHp})`,
      W / 2,
      13,
      bw + 4,
      { size: 7.5, color: '#f9cb40' }
    );
    ctx.fillStyle = '#2d0c0a';
    ctx.fillRect(bx, by, bw, 8);
    ctx.fillStyle = '#e53222';
    ctx.fillRect(bx, by, Math.round(bw * Math.max(0, boss.hp / boss.maxHp)), 8);
    ctx.restore();
  }
  // (d7) fuori dal boss il centro in alto resta alla balconata del pubblico: quartiere e stanze scoperte
  // stanno nell'intestazione della minimappa (il nome del quartiere e l'atmosfera li annuncia il banner).

  // 3. Minimappa ad ESPLORAZIONE in alto a destra:
  const m = statoRun.mappa;
  if (m && !maledizioneD('mappa')) { // D: Nebbia del Volturno nasconde la minimappa
    const cell = 12, x0 = W - 118, y0 = 24;
    // j1: alto quanto le righe scoperte (prima sempre 92)
    const righeJ1 = Math.max(1, ...m.stanze.filter((s) => s.visitata).map((s) => s.cy));
    const mw = 114, mh = Math.min(92, 20 + righeJ1 * cell);
    ctx.save();
    ctx.fillStyle = `rgba(10,6,4,${sj1.fondo})`; // (d7) semitrasparente come il riquadro di sinistra; j1 più leggero
    ctx.fillRect(x0 - 6, y0 - 16, mw, mh);
    if (typeof hudJ1 !== 'undefined') hudJ1.fondoMinimappa = y0 - 16 + mh; // j1: i riquadri sotto la seguono
    ctx.lineWidth = sj1.spessore;
    ctx.strokeStyle = sj1.bordo;
    ctx.strokeRect(x0 - 6, y0 - 16, mw, mh);
    ctx.beginPath();
    ctx.rect(x0 - 5, y0 - 15, mw - 2, mh - 2);
    ctx.clip();

    const scoperte = m.stanze.filter((s) => s.visitata).length;
    const totMappa = m.stanze.filter((s) => !((s.tipo === 'segreta' || s.tipo === 'patto') && !s.visitata)).length;
    drawTextFit(
      // una stanza può dare il suo nome al luogo (st.nomeLuogoHud: lo scontro Sopra la Ribalta di d1)
      `${((statoRun.stanzaCorrente && statoRun.stanzaCorrente.nomeLuogoHud) || getQuartierePiano(statoRun.piano).nome).toUpperCase()}${statoRun.ciclo > 1 ? ' ∞' + statoRun.ciclo : ''} · ${scoperte}/${totMappa}`, // (d7)
      x0 - 6 + mw / 2,
      y0 - 5,
      mw - 8,
      { size: 7.5, color: '#f9cb40' }
    );

    for (const s of m.stanze) {
      if (!s.visitata) continue;

      const px = x0 + (s.cx - 1) * cell;
      const py = y0 + (s.cy - 1) * cell;
      const corr = st.id === s.id;
      ctx.fillStyle = corr
        ? '#f9cb40'
        : s.tipo === 'boss'
          ? '#7f1d1d'
          : s.tipo === 'tesoro'
            ? '#713f12'
            // --- B: inizio ---
            : s.tipo === 'sviluppatore' ? '#0e7490'
            // --- B: fine ---
            : s.tipo === 'fucina'
              ? '#7c2d12'
              : s.tipo === 'segreta'
                ? '#581c87'
                : '#57534e';
      ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);

      ctx.fillStyle = '#f9cb40';
      if (s.porte.N) ctx.fillRect(px + 5, py - 1, 2, 2);
      if (s.porte.S) ctx.fillRect(px + 5, py + cell - 1, 2, 2);
      if (s.porte.W) ctx.fillRect(px - 1, py + 5, 2, 2);
      if (s.porte.E) ctx.fillRect(px + cell - 1, py + 5, 2, 2);

      // --- B: inizio ---
      const ic = s.tipo === 'sviluppatore' ? '✎' : s.tipo === 'tesoro'
      // --- B: fine ---
        ? '★'
        : s.tipo === 'fucina'
          ? '⚒'
          : s.tipo === 'boss'
            ? '💀'
            : s.tipo === 'segreta'
              ? '?'
              : s.oggettoPiedistallo && !s.oggettoPiedistallo.preso
                ? '🎁'
                : '';
      if (ic) {
        drawTextFit(ic, px + cell / 2, py + cell - 3, cell - 2, {
          size: 6.5, color: corr ? '#0a0604' : '#ffffff', shadow: false,
        });
      }
    }
    ctx.restore();
  }

  // 4. IN BASSO AL CENTRO: DOCK CON ARMA + I 5 SLOT MASSIMI (1..5) + SLOT ATTIVO [Q] CON CARICHE!
  const slotSize = 26;
  const gap = 5;
  // --- B: inizio --- (dock: arma + icone piccole di tutti gli oggetti; la posizione resta quella del vecchio dock)
  const totBoxes = 1;
  const dockW = 6 * (slotSize + gap) + 12;
  // --- B: fine ---
  const dx0 = Math.round((W - dockW) / 2);
  const dy0 = H - 34;

  // PROPOSTA 5: Slot Oggetto Attivo [Q] a sinistra del dock con barra di carica a tacche
  const act = statoRun.oggettoAttivo;
  if (act) {
    const ax = dx0 - 44;
    const ay = dy0;
    const maxC = act.maxCarica || 3;
    const curC = statoRun.caricaAttivo ?? maxC;
    const pronto = curC >= maxC;
    ctx.fillStyle = 'rgba(15, 12, 10, 0.94)';
    ctx.fillRect(ax, ay, slotSize, slotSize);
    ctx.strokeStyle = pronto ? '#4ade80' : '#38bdf8';
    ctx.lineWidth = pronto ? 2 : 1.5;
    ctx.strokeRect(ax, ay, slotSize, slotSize);
    drawPixelSprite(SPRITE_OGGETTI[act.sprite] || SPRITE_OGGETTI.forbici, ax + slotSize / 2, ay + slotSize / 2, 1.55);
    drawTextFit('Q', ax + 3, ay + 8, 10, {
      size: 7, color: pronto ? '#4ade80' : '#38bdf8', align: 'left', shadow: false,
    });
    // Barra verticale cariche a fianco dello slot [Q]
    const barX = ax + slotSize + 3;
    const segH = Math.floor((slotSize - 2) / maxC);
    for (let c = 0; c < maxC; c++) {
      const sy = ay + slotSize - 1 - (c + 1) * segH;
      ctx.fillStyle = c < curC ? (pronto ? '#4ade80' : '#38bdf8') : '#1c1917';
      ctx.fillRect(barX, sy, 5, segH - 1);
      ctx.strokeStyle = '#0a0604';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(barX, sy, 5, segH - 1);
    }
  }

  for (let i = 0; i < totBoxes; i++) {
    const sx = dx0 + 4 + i * (slotSize + gap) + (i > 0 ? 4 : 0);
    ctx.fillStyle = 'rgba(15, 12, 10, 0.94)';
    ctx.fillRect(sx, dy0, slotSize, slotSize);

    if (i === 0) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, dy0, slotSize, slotSize);
      if (statoRun.haSpada) {
        drawPixelSprite(SPRITE_OGGETTI.spada, sx + slotSize / 2, dy0 + slotSize / 2, 1.6);
      } else {
        drawPixelSprite(SPRITE_PROIETTILI[statoRun.tipoProiettile] || SPRITE_PROIETTILI.base, sx + slotSize / 2, dy0 + slotSize / 2, 2.0);
      }
    }
  }
  // --- B: inizio ---
  disegnaIconeOggettiB(dy0);
  // --- B: fine ---

  // --- C: inizio --- effetto del Medaglione sotto il riquadro HUD di sinistra
  if (statoRun.medaglioneC) {
    const mc = statoRun.medaglioneC;
    const scudo = mc.scudoStanza ? (statoRun.scudoRosaC ? ' \u00b7 scudo pronto' : ' \u00b7 scudo usato') : '';
    drawTextFit(`\u2726 ${mc.nome}${scudo}`, 8, 67, 170, { size: 7.5, color: mc.id === 'oblio' ? '#c084fc' : '#67e8f9', align: 'left' });
  }
  // --- C: fine ---
  // 5. Banner informativo (con auto-fit rigoroso dentro i 500px!)
  if (statoRun.bannerTimer > 0) {
    statoRun.bannerTimer--;
    // --- C: inizio --- fascia in alto sotto l'HUD (STANZE_C.banner): la porta sud resta visibile
    const { x: bx, y: by, w: bw, h: bh } = STANZE_C.banner;
    // --- C: fine ---
    ctx.save();
    ctx.fillStyle = 'rgba(10, 6, 4, 0.95)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.beginPath();
    ctx.rect(bx + 2, by + 1, bw - 4, bh - 2);
    ctx.clip();
    drawTextFit(statoRun.banner, bx + bw / 2, by + 12, bw - 14, { size: 8, color: '#f9cb40' });
    ctx.restore();
  }
}

// --- B: inizio --- (il modale di sostituzione a 5 slot non esiste più: oggetti infiniti)
// --- B: fine ---

// ===========================================================================
// SIPARIO NARRATIVO DEGLI ATTI (CON AUTO-FIT E CLIP RIGOROSO DENTRO LA CORNICE!)
// ===========================================================================
function disegnaSiparioNarrativo(info) {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 3, 2, 0.88)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#5c110b';
  ctx.fillRect(58, 42, 24, 276);
  ctx.fillRect(W - 82, 42, 24, 276);

  const cx = 82, cy = 46, cw = 476, ch = 268;
  ctx.fillStyle = '#140c08';
  ctx.strokeStyle = '#f9cb40';
  ctx.lineWidth = 2;
  ctx.fillRect(cx, cy, cw, ch);
  ctx.strokeRect(cx, cy, cw, ch);
  ctx.beginPath();
  ctx.rect(cx + 6, cy + 6, cw - 12, ch - 12);
  ctx.clip();

  // Le Mani di Marionetta sopra il cartellone + Ferruccio pittorico al centro
  // --- A: inizio --- (ordine unico x, y, lato, scala, tick, flash)
  disegnaManoMarionettaPittorica(232, 82, 1, 0.92, tick, false);
  disegnaManoMarionettaPittorica(408, 82, -1, 0.92, tick, false);
  // --- A: fine ---
  disegnaFerruccioPittorico(ctx, 320, 108, {
    scale: 0.95,
    flipX: false,
    tick,
    moving: false,
    shootAnim: false,
    pickup: false,
    flash: false,
    haSpada: true,
    swordAnimTick: -1,
    swordAngle: 0,
    charInfo: getCharCorrente(),
    sinergie: statoRun.sinergieVisive,
  });

  const maxTextW = cw - 28;
  drawTextFit(info.atto, W / 2, 144, maxTextW, { size: 9.5, color: '#f9cb40' });
  drawTextFit(info.titolo, W / 2, 166, maxTextW, { size: 11, color: '#ffffff' });
  drawTextFit(info.testo1, W / 2, 194, maxTextW, { size: 8.5, weight: '', color: '#f3dfc1' });
  drawTextFit(info.testo2, W / 2, 214, maxTextW, { size: 8.5, weight: '', color: '#f3dfc1' });
  drawTextFit(info.testo3, W / 2, 236, maxTextW, { size: 8.5, color: '#4ade80' });

  ctx.fillStyle = '#7a1c12';
  ctx.strokeStyle = '#f9cb40';
  ctx.fillRect(206, 264, 228, 28);
  ctx.strokeRect(206, 264, 228, 28);
  drawTextFit('▶ ALZA IL SIPARIO [Click / Spazio]', W / 2, 281, 214, { size: 9, color: '#ffffff' });
  ctx.restore();
}

// ===========================================================================
// MENÙ DI PAUSA & IMPOSTAZIONI (ESC)
// ===========================================================================
function gestisciClickMenuPausa(mx, my) {
  const btnW = 236, btnH = 26;
  const bx = W / 2 - btnW / 2;
  // --- D: inizio --- il menu è salito di 12 px per far posto al Diario
  if (statoRun.diarioD) { clickDiarioD(mx, my); return true; }
  const my0 = 30;
  if (mx >= bx && mx <= bx + btnW && my >= my0 + 230 && my <= my0 + 230 + btnH) { apriDiarioD(); return true; }
  // --- D: fine ---
  // 1. Riprendi (y: my0 + 60)
  if (mx >= bx && mx <= bx + btnW && my >= my0 + 60 && my <= my0 + 60 + btnH) {
    statoRun.pausa = false;
    return true;
  }
  // 2. Audio (y: my0 + 94)
  if (mx >= bx && mx <= bx + btnW && my >= my0 + 94 && my <= my0 + 94 + btnH) {
    AudioSys.toggle();
    return true;
  }
  // 3. Fullscreen (y: my0 + 128)
  if (mx >= bx && mx <= bx + btnW && my >= my0 + 128 && my <= my0 + 128 + btnH) {
    try {
      if (!document.fullscreenElement) {
        const req = wrap.requestFullscreen || wrap.webkitRequestFullscreen || document.documentElement.requestFullscreen;
        if (req) req.call(wrap || document.documentElement);
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      }
    } catch (_) {}
    return true;
  }
  // 4. Ricomincia Notte (y: my0 + 162)
  if (mx >= bx && mx <= bx + btnW && my >= my0 + 162 && my <= my0 + 162 + btnH) {
    ricominciaNotte();
    return true;
  }
  // 5. Menù Personaggi (y: my0 + 196)
  if (mx >= bx && mx <= bx + btnW && my >= my0 + 196 && my <= my0 + 196 + btnH) {
    statoRun.pausa = false;
    statoRun.fase = 'menu_selezione';
    return true;
  }
  return false;
}

function disegnaMenuPausa() {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 4, 3, 0.85)';
  ctx.fillRect(0, 0, W, H);

  const mx = 170, my = 30, mw = 300, mh = 318; // D: un bottone in più (Diario)
  ctx.fillStyle = '#140c08';
  ctx.strokeStyle = '#f9cb40';
  ctx.lineWidth = 2;
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeRect(mx, my, mw, mh);

  ctx.strokeStyle = '#5a3818';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx + 4, my + 4, mw - 8, mh - 8);

  const chInfo = getCharCorrente();
  const qPausa = getQuartierePiano(statoRun.piano);
  drawTextFit(`🌙 NOTTE ${statoRun.numeroNotte || 1} — IN PAUSA`, W / 2, my + 24, mw - 20, { size: 12, color: '#f9cb40', weight: 'bold' });
  drawTextFit(`${chInfo.nome} · ${qPausa.titoloCompleto} · ${statoRun.monete}🪙`, W / 2, my + 42, mw - 20, { size: 8, color: '#c9a679' });

  const btnW = 236, btnH = 26;
  const bx = W / 2 - btnW / 2;
  const bottoni = [
    { id: 'riprendi', testo: '▶ RIPRENDI GIOCO [ESC]', y: my + 60, col: '#8a1c12' },
    { id: 'audio', testo: AudioSys.attivo ? '🔊 AUDIO: ON' : '🔇 AUDIO: MUTATO', y: my + 94, col: '#22150d' },
    { id: 'fullscreen', testo: document.fullscreenElement ? '⛶ SCHERMO INTERO: ON' : '⛶ SCHERMO INTERO: OFF', y: my + 128, col: '#22150d' },
    { id: 'ricomincia', testo: '🎲 RICOMINCIA NOTTE [R]', y: my + 162, col: '#22150d' },
    { id: 'menu', testo: '🎭 MENÙ PERSONAGGI', y: my + 196, col: '#22150d' },
    { id: 'diario', testo: '📖 DIARIO DEGLI OGGETTI [O]', y: my + 230, col: '#22150d' }, // D
  ];

  for (const b of bottoni) {
    ctx.fillStyle = b.col;
    ctx.fillRect(bx, b.y, btnW, btnH);
    ctx.strokeStyle = '#7c5227';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, b.y, btnW, btnH);
    drawTextFit(b.testo, W / 2, b.y + 17, btnW - 12, { size: 8.5, color: '#ffffff', weight: 'bold' });
  }

  ctx.fillStyle = '#26170e';
  ctx.fillRect(mx + 10, my + 266, mw - 20, 34);
  ctx.strokeStyle = '#4a2c14';
  ctx.strokeRect(mx + 10, my + 266, mw - 20, 34);
  drawTextFit('WASD: Movimento · Frecce/Mouse: Spara/Attacca', W / 2, my + 279, mw - 28, { size: 7.5, color: '#e6d2aa' });
  drawTextFit('Q: Attivo · E: Compra/Patto/Raccogli · ESC: Pausa', W / 2, my + 292, mw - 28, { size: 7.5, color: '#e6d2aa' });

  ctx.restore();
  if (statoRun.diarioD) disegnaDiarioD(); // --- D ---
}
