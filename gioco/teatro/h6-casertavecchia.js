/*
 * teatro/h6-casertavecchia.js — (squadra h6) CASERTAVECCHIA, «Le Campane del Perdono»: una zona del piano 3.
 * Bibbia, Espansione I: il borgo antico in cima al colle, dove le campane custodiscono le parole che gli
 * abitanti non hanno mai pronunciato.
 *
 *   1. LA SCELTA. Battuto il boss del piano 2 alla VILLA COMUNALE (non all'Acquedotto di d6), oltre alla botola
 *      compare un CANCELLETTO con la campanella: [E] «Sali a Casertavecchia» → il piano 3 di quella notte è
 *      Casertavecchia (`statoRun.zonaP3 = 'casertavecchia'`, contratto comune con h7). La botola porta a San
 *      Leucio come sempre. `statoRun.zonaP3` si azzera all'inizio di ogni piano che non è il terzo del ciclo.
 *   2. IL LUOGO (QUARTIERE_H6): selciato di pietra lavica, quinte di tufo grigio con archi medievali, fondale
 *      col campanile del duomo e la torre sotto la luna, lumini votivi nelle nicchie; luce fredda (LUCE_H6).
 *   3. LA MEMORIA: riga «Percorso» nel conto della notte (e6: noteVoceE6), nel Diario (b8) e nel salvataggio di
 *      «Riprendi la notte» (e6 copia da sé i campi `statoRun.percorso*`: qui `percorsoH6`).
 *
 * AGGANCI nei file altrui: h2-memorie.js (il fazzoletto di Bianca non sta a Casertavecchia). Tutto il resto
 * avvolge function di primo livello chiamando sempre la base. Script classico caricato dopo
 * teatro/h1-agnese-taddeo.js. QA: tools/qa-teatro-casertavecchia.js. Sonda: window.__teatro.interni.casertavecchiaH6.
 */

// ===========================================================================
// TABELLE (numeri e testi). Tick a 60 Hz, distanze in px del palco 640×360.
// ===========================================================================

/** Regole del percorso e del luogo. */
const CASERTAVECCHIA_H6 = Object.freeze({
  pianoCancello: 2, // piano del ciclo dopo il cui boss (alla Villa) compare il cancelletto
  pianoLuogo: 3,    // piano del ciclo che Casertavecchia sostituisce (San Leucio)
  zona: 'casertavecchia',
  /** Il cancelletto nella stanza del boss della Villa: posizione e raggi di [E] e del click. */
  cancello: Object.freeze({ x: 196, y: 186, raggio: 46, raggioClick: 34 }),
  /** Posti fissi della scenografia (fondale e muro). */
  scena: Object.freeze({ lumini: Object.freeze([[58, 120], [58, 200], [582, 120], [582, 200]]), yLumini: 0 }),
});

/** Luce della ribalta di b2 a Casertavecchia: luna fredda, ombre lunghe. */
const LUCE_H6 = Object.freeze({ lume: Object.freeze([156, 170, 204]), luce: 0.86, ombra: 1.1, vignetta: 1.2 });

/** Colori del disegno «a ombre»: china, bordo di lanterna, oro e rosso, tufo grigio e pietra lavica. */
const TINTE_H6 = Object.freeze({
  china: '#0b0a0c', china2: '#1a181c', bordo: '#c9a15a', oro: '#f9cb40', rosso: '#e53222', lampo: '#fff3d6',
  tufo: '#8c8a86', tufoChiaro: '#a9a6a0', tufoOmbra: '#55534f', lava: '#2c2b2e', lava2: '#363539', lava3: '#25242a',
  luna: '#dfe6f2', cielo0: '#070d1c', cielo1: '#1b2742', monte: '#0c1222', lumino: '#ffb347', ferro: '#26232a',
});

/** Testi per il giocatore (DA APPROVARE DALL'AUTORE). Tutto ciò che va a schermo sta qui. */
const TESTI_H6 = Object.freeze({
  atto: (piano, stanze) => `ATTO III · CASERTAVECCHIA (PIANO ${piano} · ${stanze} STANZE + 1 SEGRETA)`,
  cartiglioLuogo: 'CASERTAVECCHIA',
  cartiglioCancello: '▲ SALI A CASERTAVECCHIA [E] ▲',
  bannerCancello: '· A sinistra un CANCELLETTO con la campanella: la mulattiera sale a Casertavecchia.',
  salita: 'Il cancelletto cigola, la campanella suona una volta. La mulattiera sale verso il borgo.',
  pergamena: Object.freeze(['Percorso', 'per Casertavecchia']),
  diario: Object.freeze([
    'Stanotte non sono sceso nella botola: ho preso la mulattiera, fino al borgo vecchio sul colle.',
    'Sono salito a Casertavecchia. Lassù le campane suonano da sole, e la pietra si ricorda di tutto.',
    'Niente San Leucio, stanotte: le vie di Casertavecchia, il duomo, e quelle campane che non stanno mai zitte.',
  ]),
});

/** Il quartiere: stessi campi delle voci di QUARTIERI_PIANI (00-config.js). TESTI DA APPROVARE DALL'AUTORE. */
const QUARTIERE_H6 = Object.freeze({
  id: 'casertavecchia',
  pianoNelCiclo: 3,
  nome: 'Casertavecchia',
  atmosfera: 'delle Campane',
  titoloCompleto: 'Casertavecchia e le Campane del Perdono',
  meteo: 'luna',
  coloreTema: '#c7d2e8',
  bordoPillola: '#4b5675',
  coloreSfondo: '#08090d',
  coloreMuroEsterno: '#3a3936',
  coloreMuroInterno: '#46443f',
  coloreBordoMuro: '#121114',
  coloriPiastrelle: Object.freeze(['#2c2b2e', '#333236', '#28272b', '#38363a']),
  coloreFughe: '#151417',
  coloreRiflesso: '#5d6274',
  coloreMuschio: '#3a4230',
  coloreAcqua: '#1b2132',
  coloreSchiuma: '#c7d2e8',
  colorePozzanghera: 'rgba(160, 176, 210, 0.16)',
  nemiciTipici: Object.freeze(['penitente_pietra', 'sagrestano', 'corvo_campanile', 'battaglio']),
  bossTipico: 'campanaro-senza-volto',
  descrizioneSipario: Object.freeze({
    atto: 'ATTO III · CASERTAVECCHIA',
    titolo: '«LE CAMPANE DEL PERDONO»',
    testo1: 'In cima al colle il borgo antico dorme di pietra: archi, vicoli, e il campanile del duomo contro la luna.',
    testo2: 'Le campane custodiscono le parole che gli abitanti non hanno mai pronunciato.',
    testo3: 'Quando la corda si tende la campana sta per suonare: la pietra si sveglia, chi è vivo resta stordito.',
  }),
});

// ===========================================================================
// STATO DEL MODULO
// ===========================================================================
const h6 = { pavimento: null, pavimentoScala: 0 };

const limitaH6 = (v, a, b) => Math.max(a, Math.min(b, v));
const pianoNelCicloH6 = (piano = statoRun.piano) => ((Math.max(1, piano || 1) - 1) % 4) + 1;

/**
 * Il piano è (o sarà) Casertavecchia in questa run?
 * Per il piano in corso vale il contratto comune `statoRun.zonaP3`; per gli altri la memoria `percorsoH6`.
 * @param {number} [piano] piano assoluto; senza argomento, quello in corso
 * @returns {boolean}
 */
function casertavecchiaAttivaH6(piano = statoRun.piano) {
  if (pianoNelCicloH6(piano) !== CASERTAVECCHIA_H6.pianoLuogo) return false;
  const m = statoRun.percorsoH6;
  if (!m || m[piano] !== CASERTAVECCHIA_H6.zona) return false;
  return piano !== statoRun.piano || statoRun.zonaP3 === CASERTAVECCHIA_H6.zona;
}

/** Segna il piano come Casertavecchia (o lo toglie) senza andarci. */
function segnaCasertavecchiaH6(piano, si = true) {
  const m = Object.assign({}, statoRun.percorsoH6);
  if (si) m[piano] = CASERTAVECCHIA_H6.zona; else delete m[piano];
  statoRun.percorsoH6 = m;
}

/** Sale per la mulattiera: il piano successivo è Casertavecchia. */
function prendiCasertavecchiaH6() {
  const prossimo = statoRun.piano + 1;
  segnaCasertavecchiaH6(prossimo, true);
  try { if (typeof AudioSys.playCampana === 'function') AudioSys.playCampana(); } catch (_) { /* senza audio */ }
  mostraBanner(TESTI_H6.salita, 160);
  avviaPiano(prossimo, true);
}

// ===========================================================================
// 1. LA SCELTA: il cancelletto con la campanella nella stanza del boss della Villa
// ===========================================================================
/** Il cancelletto della stanza corrente, se c'è. */
function cancelloQuiH6() {
  const st = statoRun.stanzaCorrente;
  return st && st.tipo === 'boss' && st.pulita && st.cancelloH6 ? st.cancelloH6 : null;
}

/**
 * [E] accanto al cancelletto: si sale a Casertavecchia. Rende true se ha consumato l'azione.
 * @returns {boolean}
 */
function usaCancelloH6() {
  if (statoRun.fase !== 'in_gioco' || statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo) return false;
  if (!cancelloQuiH6()) return false;
  const G = CASERTAVECCHIA_H6.cancello;
  if (Math.hypot(player.x - G.x, player.y - G.y) >= G.raggio) return false;
  prendiCasertavecchiaH6();
  return true;
}

const interagisciStanzaBaseH6 = interagisciStanza;
/** [E]: prima il cancelletto (se ci sei accanto), poi tutto il resto. */
interagisciStanza = function (...args) {
  try { if (usaCancelloH6()) return undefined; } catch (err) { console.error('[h6] cancello', err); }
  return interagisciStanzaBaseH6.apply(this, args);
};

// Click (e tocco breve) sul cancelletto: ci si porta accanto e si usa.
window.addEventListener('mousedown', (e) => {
  try {
    if (e.target !== canvas || statoRun.pausa || !cancelloQuiH6()) return;
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height);
    const G = CASERTAVECCHIA_H6.cancello;
    if (Math.hypot(mx - G.x, my - G.y) >= G.raggioClick) return;
    player.x = G.x; player.y = G.y + 14; player.targetX = null; player.targetY = null;
    if (usaCancelloH6()) e.stopImmediatePropagation();
  } catch (err) { console.error('[h6] click', err); }
}, true);

/** true se il cancelletto deve comparire in questa stanza del boss appena ripulita. */
function cancelloDovutoH6(st) {
  if (pianoNelCicloH6() !== CASERTAVECCHIA_H6.pianoCancello || st.cancelloH6) return false;
  if (typeof acquedottoAttivoD6 === 'function' && acquedottoAttivoD6()) return false; // dall'Acquedotto no
  return true;
}

const verificaStanzaPulitaBaseH6 = verificaStanzaPulita;
/** Boss della Villa caduto: compare il cancelletto. */
verificaStanzaPulita = function (...args) {
  const st = statoRun.stanzaCorrente;
  const era = Boolean(st && st.pulita);
  const r = verificaStanzaPulitaBaseH6.apply(this, args);
  try {
    if (st && !era && st.pulita && st.tipo === 'boss' && st.uscitaAperta) {
      if (cancelloDovutoH6(st)) {
        st.cancelloH6 = { t0: tick };
        mostraBanner(`${statoRun.banner || ''} ${TESTI_H6.bannerCancello}`.trim(), 320);
      }
      if (typeof dopoStanzaPulitaH6 === 'function') dopoStanzaPulitaH6(st);
    }
  } catch (err) { console.error('[h6] stanza pulita', err); }
  return r;
};

/** Disegna il cancelletto: due pilastrini di tufo, il ferro battuto, la campanella e la mulattiera dietro. */
function disegnaCancelloH6(g, tk) {
  const G = CASERTAVECCHIA_H6.cancello, x = G.x, y = G.y, T = TINTE_H6;
  const vicino = Math.hypot(player.x - x, player.y - y) < G.raggio;
  ctx.save();
  // la mulattiera che sale: una striscia di selciato che si stringe verso l'alto
  ctx.fillStyle = 'rgba(12, 14, 22, 0.75)';
  ctx.beginPath(); ctx.moveTo(x - 18, y + 8); ctx.lineTo(x + 18, y + 8); ctx.lineTo(x + 7, y - 26); ctx.lineTo(x - 7, y - 26); ctx.closePath(); ctx.fill();
  ctx.fillStyle = T.tufoOmbra;
  for (let k = 0; k < 5; k++) { const yy = y + 4 - k * 7, l = 15 - k * 2.2; ctx.fillRect(x - l, yy, l * 2, 1); }
  // pilastrini
  for (const px of [x - 22, x + 16]) {
    ctx.fillStyle = T.tufo; ctx.fillRect(px, y - 30, 7, 40);
    ctx.fillStyle = T.tufoChiaro; ctx.fillRect(px, y - 30, 7, 2);
    ctx.fillStyle = T.tufoOmbra; ctx.fillRect(px + 5, y - 28, 2, 38);
    ctx.strokeStyle = T.china; ctx.lineWidth = 1; ctx.strokeRect(px, y - 30, 7, 40);
  }
  // il cancelletto socchiuso: sbarre e un ricciolo
  const apre = vicino ? 0.35 : 0.08;
  ctx.strokeStyle = T.ferro; ctx.lineWidth = 1.4;
  ctx.beginPath();
  const xa = x - 15, xb = x - 15 + 30 * Math.cos(apre);
  for (let k = 0; k <= 5; k++) { const sx = xa + (xb - xa) * (k / 5); ctx.moveTo(sx, y + 8); ctx.lineTo(sx, y - 18); }
  ctx.moveTo(xa, y - 18); ctx.lineTo(xb, y - 18); ctx.moveTo(xa, y - 4); ctx.lineTo(xb, y - 4);
  ctx.stroke();
  ctx.strokeStyle = T.bordo; ctx.globalAlpha = 0.7; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.arc((xa + xb) / 2, y - 22, 4, Math.PI, 0); ctx.stroke(); ctx.globalAlpha = 1;
  // la campanella sul pilastrino di destra, che oscilla appena
  const osc = Math.sin(tk * 0.06) * (vicino ? 0.45 : 0.12);
  ctx.save(); ctx.translate(x + 19.5, y - 33); ctx.rotate(osc);
  ctx.strokeStyle = T.ferro; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 3); ctx.stroke();
  ctx.fillStyle = T.oro; ctx.beginPath(); ctx.moveTo(-3.6, 9); ctx.quadraticCurveTo(-3, 3, 0, 3); ctx.quadraticCurveTo(3, 3, 3.6, 9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = T.china; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.fillStyle = T.china; ctx.fillRect(-0.7, 9, 1.4, 1.6);
  ctx.restore();
  ctx.restore();
  drawPillLabel(TESTI_H6.cartiglioLuogo, x, y - 48, 110, { size: 7, color: TINTE_H6.luna, border: QUARTIERE_H6.bordoPillola });
  if (vicino) drawPillLabel(TESTI_H6.cartiglioCancello, x, y + 24, 150, { size: 7, color: TINTE_H6.oro, border: QUARTIERE_H6.bordoPillola });
}

// ===========================================================================
// 2. IL LUOGO: voce, sipario, pavimento e scenografia dipinta
// ===========================================================================
const getQuartierePianoBaseH6 = getQuartierePiano;
/** Il quartiere del piano: Casertavecchia se il percorso della run lo dice, altrimenti quello di sempre. */
getQuartierePiano = function (piano, ...resto) {
  try { if (casertavecchiaAttivaH6(piano || statoRun.piano)) return QUARTIERE_H6; } catch (_) { /* statoRun non pronto */ }
  return getQuartierePianoBaseH6.call(this, piano, ...resto);
};

const getRaccontoAttoBaseH6 = getRaccontoAtto;
/** Cartellone d'ingresso del piano: quello di Casertavecchia quando ci si entra. */
getRaccontoAtto = function (piano, ciclo, ...resto) {
  const base = getRaccontoAttoBaseH6.call(this, piano, ciclo, ...resto);
  try {
    if (base && casertavecchiaAttivaH6(piano)) {
      const D = QUARTIERE_H6.descrizioneSipario;
      return { ...base, atto: TESTI_H6.atto(piano, numeroStanzeCombattimento(piano)), titolo: D.titolo, testo1: D.testo1, testo2: D.testo2, testo3: D.testo3 };
    }
  } catch (err) { console.error('[h6] sipario', err); }
  return base;
};

/** Generatore deterministico per le trame dipinte. */
function casoFissoH6(seme) {
  let s = seme >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 16) / 65536; };
}

/** FONDALE: cielo di luna, il colle col borgo, il campanile del duomo e la torre, sulla fascia alta del muro. */
function dipingiFondaleH6(x, r) {
  const T = TINTE_H6, y0 = 52, y1 = 70;
  const cielo = x.createLinearGradient(0, y0, 0, y1);
  cielo.addColorStop(0, T.cielo0); cielo.addColorStop(1, T.cielo1);
  x.fillStyle = cielo; x.fillRect(48, y0, 544, y1 - y0);
  for (let i = 0; i < 40; i++) {
    x.fillStyle = r() < 0.3 ? '#fff3d6' : '#9aa8c8';
    x.fillRect(Math.round(50 + r() * 540), Math.round(y0 + 1 + r() * 7), 1, 1);
  }
  // luna piena con l'alone
  x.fillStyle = 'rgba(223, 230, 242, 0.16)'; x.beginPath(); x.arc(118, 58, 6.5, 0, TAU); x.fill();
  x.fillStyle = T.luna; x.beginPath(); x.arc(118, 58, 3.8, 0, TAU); x.fill();
  // il colle
  x.fillStyle = T.monte;
  x.beginPath(); x.moveTo(48, y1); x.lineTo(48, 66); x.lineTo(150, 63); x.lineTo(250, 59); x.lineTo(330, 57.5); x.lineTo(420, 59.5); x.lineTo(520, 64); x.lineTo(592, 66); x.lineTo(592, y1); x.closePath(); x.fill();
  // le case del borgo: tetti a capanna in fila sul crinale
  x.fillStyle = '#141a2b';
  for (let hx = 220; hx < 470; hx += 9 + Math.floor(r() * 5)) {
    const h = 2 + r() * 3, base = 59.5 - Math.abs(hx - 330) * 0.012;
    x.beginPath(); x.moveTo(hx, base + 1); x.lineTo(hx, base - h); x.lineTo(hx + 4, base - h - 2); x.lineTo(hx + 8, base - h); x.lineTo(hx + 8, base + 1); x.closePath(); x.fill();
  }
  // la torre (a sinistra del duomo), merlata
  x.fillStyle = '#161d30'; x.fillRect(262, 49, 9, 11);
  for (let k = 0; k < 3; k++) x.fillRect(262 + k * 3.4, 47.6, 2, 1.6);
  // il duomo e il campanile (a destra), con la cella delle campane illuminata appena
  x.fillStyle = '#161d30';
  x.beginPath(); x.moveTo(318, 59); x.lineTo(318, 54); x.lineTo(332, 50.5); x.lineTo(346, 54); x.lineTo(346, 59); x.closePath(); x.fill();
  x.fillRect(356, 44, 8, 16);
  x.beginPath(); x.moveTo(355, 44); x.lineTo(360, 39.5); x.lineTo(365, 44); x.closePath(); x.fill();
  x.fillStyle = 'rgba(255, 179, 71, 0.55)'; x.fillRect(358, 46, 1.4, 2.4); x.fillRect(360.8, 46, 1.4, 2.4);
  // il filo di luna sui profili
  x.fillStyle = T.luna; x.globalAlpha = 0.35; x.fillRect(262, 49, 0.8, 11); x.fillRect(356, 44, 0.8, 16); x.globalAlpha = 1;
  // il listello della tela dipinta
  x.fillStyle = T.china; x.fillRect(48, y1 - 0.6, 544, 1.6);
  x.fillStyle = T.bordo; x.globalAlpha = 0.7; x.fillRect(48, y1 + 0.4, 544, 0.6); x.globalAlpha = 1;
}

/** QUINTA dipinta: muro di tufo grigio con due archi medievali ogivali e una nicchia col lumino. */
function dipingiQuintaH6(x, x0, r) {
  const T = TINTE_H6, w = 20;
  x.fillStyle = '#4c4a46'; x.fillRect(x0, 70, w, 234);
  for (let yy = 72; yy < 304; yy += 7) {
    x.fillStyle = r() < 0.5 ? '#57554f' : '#46443f';
    x.fillRect(x0, yy, w, 6);
    x.fillStyle = '#2b2a28';
    const sf = (Math.floor(yy / 7) % 2) * 6;
    for (let bx = x0 + sf; bx < x0 + w; bx += 12) x.fillRect(bx, yy, 0.8, 6);
  }
  for (const yA of [84, 222]) {
    const cx = x0 + w / 2, alto = yA, basso = yA + 58;
    x.fillStyle = '#0d1120';
    x.beginPath(); x.moveTo(cx - 6, basso); x.lineTo(cx - 6, alto + 8); x.quadraticCurveTo(cx - 6, alto, cx, alto - 4); x.quadraticCurveTo(cx + 6, alto, cx + 6, alto + 8); x.lineTo(cx + 6, basso); x.closePath(); x.fill();
    x.strokeStyle = T.tufoChiaro; x.globalAlpha = 0.5; x.lineWidth = 0.8; x.stroke(); x.globalAlpha = 1;
  }
  // nicchia dell'edicola a metà: il lumino lo accende disegnaLuogoH6
  const cy = 176;
  x.fillStyle = '#1d1a18'; x.beginPath(); x.moveTo(x0 + 4, cy + 12); x.lineTo(x0 + 4, cy); x.arc(x0 + 10, cy, 6, Math.PI, 0); x.lineTo(x0 + 16, cy + 12); x.closePath(); x.fill();
  x.fillStyle = T.bordo; x.globalAlpha = 0.5; x.fillRect(x0 + 3, cy + 12, 14, 1); x.globalAlpha = 1;
  x.fillStyle = T.china; x.fillRect(x0 === 48 ? x0 + w - 1 : x0, 70, 1.2, 234);
}

/** Tela del pavimento e della scenografia di Casertavecchia, alla risoluzione del buffer (statica). */
function telaPavimentoH6() {
  if (h6.pavimento && h6.pavimentoScala === scalaBase) return h6.pavimento;
  const q = QUARTIERE_H6, T = TINTE_H6;
  const fc = document.createElement('canvas');
  fc.width = Math.round(W * scalaBase);
  fc.height = Math.round(H * scalaBase);
  const x = fc.getContext('2d');
  x.setTransform(scalaBase, 0, 0, scalaBase, 0, 0);
  x.imageSmoothingEnabled = false;
  const r = casoFissoH6(1845 * 11 + 3);
  x.fillStyle = q.coloreSfondo; x.fillRect(0, 0, W, H);
  x.fillStyle = q.coloreMuroInterno; x.fillRect(48, 52, W - 96, H - 96);

  // selciato di pietra lavica: basoli irregolari a file sfalsate, con le fughe chiare di tufo
  x.save();
  x.beginPath(); x.rect(68, 70, 504, 234); x.clip();
  x.fillStyle = '#4a4844'; x.fillRect(68, 70, 504, 234);
  const col = q.coloriPiastrelle;
  let riga = 0;
  for (let ty = 70; ty < 304; ty += 14, riga++) {
    let tx = 68 - (riga % 2) * 9;
    while (tx < 572) {
      const l = 16 + Math.floor(r() * 10);
      x.fillStyle = col[Math.floor(r() * col.length)];
      x.beginPath();
      x.moveTo(tx + 1.5, ty + 1); x.lineTo(tx + l - 1, ty + 0.6 + r()); x.lineTo(tx + l - 0.6, ty + 12.4); x.lineTo(tx + 1, ty + 12.8 - r()); x.closePath(); x.fill();
      if (r() < 0.45) { x.fillStyle = q.coloreRiflesso; x.globalAlpha = 0.35; x.fillRect(tx + 3, ty + 2, l * 0.4, 0.8); x.globalAlpha = 1; }
      if (r() < 0.12) { x.fillStyle = q.coloreMuschio; x.fillRect(tx + l - 4, ty + 10, 3, 2); }
      tx += l;
    }
  }
  // la luna sul selciato: una lama chiara di traverso
  const lama = x.createLinearGradient(68, 70, 420, 304);
  lama.addColorStop(0, 'rgba(200, 214, 240, 0.08)'); lama.addColorStop(0.5, 'rgba(200, 214, 240, 0.03)'); lama.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
  x.fillStyle = lama; x.fillRect(68, 70, 504, 234);
  x.restore();

  dipingiFondaleH6(x, r);
  dipingiQuintaH6(x, 48, r);
  dipingiQuintaH6(x, 572, r);
  // il parapetto del sagrato in basso
  x.fillStyle = '#2b2a28'; x.fillRect(48, 304, 544, 12);
  for (let bx = 50; bx < 590; bx += 20) { x.fillStyle = r() < 0.5 ? '#5a5853' : '#4a4844'; x.fillRect(bx, 306, 18, 8); }
  x.fillStyle = T.bordo; x.globalAlpha = 0.45; x.fillRect(48, 304, 544, 0.7); x.globalAlpha = 1;
  x.strokeStyle = q.coloreBordoMuro; x.lineWidth = 2; x.strokeRect(48, 52, W - 96, H - 96);

  h6.pavimento = fc; h6.pavimentoScala = scalaBase;
  return fc;
}

const getFloorTileCanvasBaseH6 = getFloorTileCanvas;
/** Pavimento del piano: il selciato di pietra lavica se il piano è Casertavecchia. */
getFloorTileCanvas = function (piano, ...resto) {
  try { if (casertavecchiaAttivaH6(piano || statoRun.piano)) return telaPavimentoH6(); } catch (err) { console.error('[h6] pavimento', err); }
  return getFloorTileCanvasBaseH6.call(this, piano, ...resto);
};

/** Un lumino votivo: bicchierino rosso e fiammella calda che trema, con l'alone. */
function disegnaLuminoH6(x, y, tk, k) {
  const tremo = 0.8 + 0.2 * Math.sin(tk * 0.23 + k * 2.1) + 0.08 * Math.sin(tk * 0.61 + k);
  ctx.fillStyle = `rgba(255, 179, 71, ${(0.16 * tremo).toFixed(3)})`;
  ctx.beginPath(); ctx.arc(x, y - 2, 10, 0, TAU); ctx.fill();
  ctx.fillStyle = '#7a1d14'; ctx.fillRect(x - 2, y - 1, 4, 4);
  ctx.fillStyle = TINTE_H6.lumino; ctx.beginPath(); ctx.ellipse(x, y - 3, 1.2, 2.2 * tremo, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = TINTE_H6.lampo; ctx.fillRect(x - 0.4, y - 3, 0.8, 1.2);
}

const disegnaAtmosferaQuartiereBaseH6 = disegnaAtmosferaQuartiere;
/** Atmosfera del piano: a Casertavecchia lumini nelle nicchie e velo di luna al posto di quella di San Leucio. */
disegnaAtmosferaQuartiere = function (tk, piano, ...resto) {
  if (!casertavecchiaAttivaH6(piano)) return disegnaAtmosferaQuartiereBaseH6.call(this, tk, piano, ...resto);
  try { disegnaLuogoH6(tk, statoRun.stanzaCorrente); } catch (err) { console.error('[h6] atmosfera', err); }
  return undefined;
};

/** Tutto ciò che sta a filo del palco o sul muro: lumini, velo di luna (le corde le aggiunge la sezione 3). */
function disegnaLuogoH6(tk, st) {
  ctx.save();
  // i bracieri di base non ci sono: si ridipinge il fondale sotto (stessa tela)
  const tela = telaPavimentoH6(), k = tela.width / W;
  for (const fx of [150, 490]) ctx.drawImage(tela, (fx - 13) * k, 52 * k, 26 * k, 18 * k, fx - 13, 52, 26, 18);
  disegnaLuminoH6(58, 186, tk, 0);
  disegnaLuminoH6(582, 186, tk, 1);
  if (typeof disegnaRintocchiH6 === 'function') disegnaRintocchiH6(tk, st);
  if (OPZIONI.vignetta !== false) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, 140, W / 2, H / 2, 330);
    vg.addColorStop(0, 'rgba(8, 10, 22, 0)');
    vg.addColorStop(1, 'rgba(8, 10, 22, 0.42)');
    ctx.fillStyle = vg; ctx.fillRect(48, 52, W - 96, H - 96);
  }
  ctx.restore();
}

const disegnaStanzaPixelArtBaseH6 = disegnaStanzaPixelArt;
/** Dopo la stanza: il cancelletto (se c'è), sotto le figure. */
disegnaStanzaPixelArt = function (tk, st, ...resto) {
  const r = disegnaStanzaPixelArtBaseH6.call(this, tk, st, ...resto);
  try {
    if (st && st.tipo === 'boss' && st.pulita && st.cancelloH6) disegnaCancelloH6(st.cancelloH6, tk);
    if (typeof disegnaSopraStanzaH6 === 'function') disegnaSopraStanzaH6(tk, st);
  } catch (err) { console.error('[h6] stanza', err); }
  return r;
};

if (typeof luceLuogoB2 === 'function') {
  const luceLuogoBaseH6 = luceLuogoB2;
  /** La luce della ribalta (b2): a Casertavecchia fredda di luna. */
  luceLuogoB2 = function (...a) {
    try { if (statoRun && casertavecchiaAttivaH6()) return LUCE_H6; } catch (_) { /* fuori dalla run */ }
    return luceLuogoBaseH6.apply(this, a);
  };
}

// ===========================================================================
// AVVIO DELLA RUN E DEL PIANO (contratto `statoRun.zonaP3`)
// ===========================================================================
const nuovaRunBaseH6 = nuovaRun;
/** Run nuova: nessun percorso scelto. */
nuovaRun = function (...args) {
  statoRun.percorsoH6 = null;
  delete statoRun.zonaP3;
  return nuovaRunBaseH6.apply(this, args);
};

const avviaPianoBaseH6 = avviaPiano;
/**
 * Avvio di un piano: fuori dal terzo del ciclo `zonaP3` si azzera; al terzo, se la mulattiera è stata presa
 * (o la notte ripresa lo ricorda in `percorsoH6`), vale 'casertavecchia' PRIMA che la base generi la mappa.
 */
avviaPiano = function (piano, ...resto) {
  try {
    if (pianoNelCicloH6(piano) !== CASERTAVECCHIA_H6.pianoLuogo) delete statoRun.zonaP3;
    else if (statoRun.percorsoH6 && statoRun.percorsoH6[piano] === CASERTAVECCHIA_H6.zona) statoRun.zonaP3 = CASERTAVECCHIA_H6.zona;
  } catch (err) { console.error('[h6] zona', err); }
  const r = avviaPianoBaseH6.call(this, piano, ...resto);
  try {
    if (casertavecchiaAttivaH6(piano)) ricordaPercorsoH6();
    if (typeof intonaH6 === 'function') intonaH6();
  } catch (err) { console.error('[h6] piano', err); }
  return r;
};

// ===========================================================================
// LA MEMORIA DEL PERCORSO: conto della notte (e6), Registro (a7), Diario (b8)
// ===========================================================================
/** La run in corso è salita a Casertavecchia: lo si scrive nella sua voce del Registro. */
function ricordaPercorsoH6() {
  try { if (typeof a7 === 'object' && a7 && a7.run) a7.run.zonaH6 = CASERTAVECCHIA_H6.zona; } catch (_) { /* a7 assente */ }
}

if (typeof noteVoceE6 === 'function') {
  const noteVoceBaseH6 = noteVoceE6;
  /** Il conto della notte: la riga «Percorso per Casertavecchia». */
  noteVoceE6 = function (v, ...resto) {
    const note = noteVoceBaseH6.call(this, v, ...resto);
    try { if (v && v.zonaH6 === CASERTAVECCHIA_H6.zona && Array.isArray(note)) note.push([TESTI_H6.pergamena[0], TESTI_H6.pergamena[1]]); } catch (_) { /* niente */ }
    return note;
  };
}

if (typeof componiPaginaB8 === 'function') {
  const componiPaginaBaseH6 = componiPaginaB8;
  /** Diario di Ferruccio: una riga per la salita a Casertavecchia (al posto di quella di San Leucio, se c'è). */
  componiPaginaB8 = function (v, ...resto) {
    const pagina = componiPaginaBaseH6.call(this, v, ...resto);
    try {
      if (v && v.zonaH6 === CASERTAVECCHIA_H6.zona && v.esito !== 'piazza' && pagina && Array.isArray(pagina.righe)) {
        const riga = TESTI_H6.diario[Math.abs(Math.floor(Number(pagina.notte) || 0)) % TESTI_H6.diario.length];
        if (!pagina.righe.includes(riga)) {
          const diLeucio = (typeof DIARIO_B8 !== 'undefined' && DIARIO_B8.cammino && DIARIO_B8.cammino[CASERTAVECCHIA_H6.pianoLuogo]) || [];
          const i = pagina.righe.findIndex((r) => diLeucio.some((t) => String(t).toLowerCase() === String(r).toLowerCase()));
          if (i >= 0) pagina.righe[i] = riga; else pagina.righe.splice(Math.min(2, pagina.righe.length), 0, riga);
        }
      }
    } catch (err) { console.error('[h6] diario', err); }
    return pagina;
  };
}

// ===========================================================================
// SONDA QA / SVILUPPO
// ===========================================================================
Object.assign(window.__teatro.interni, {
  CASERTAVECCHIA_H6, QUARTIERE_H6, TESTI_H6, LUCE_H6,
  casertavecchiaH6: {
    /** Il piano (o quello in corso) è Casertavecchia? */
    attivo: (piano) => casertavecchiaAttivaH6(piano),
    /** Sviluppo/QA: marca un piano come Casertavecchia senza andarci. */
    segna: segnaCasertavecchiaH6,
    /** Sviluppo/QA: sale subito per la mulattiera dal piano in corso. */
    prendi: prendiCasertavecchiaH6,
    /** Il cancelletto della stanza corrente, o null. */
    get cancello() { return cancelloQuiH6() ? { x: CASERTAVECCHIA_H6.cancello.x, y: CASERTAVECCHIA_H6.cancello.y } : null; },
  },
});
