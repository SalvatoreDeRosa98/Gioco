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
  bannerCancello: '· A sinistra il CANCELLETTO: Casertavecchia.',
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
  statoRun.percorsoH6 = null; statoRun.sagratoH6 = null; statoRun.premioH6 = false;
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

// ===========================================================================
// 3. LA REGOLA DEL LUOGO: I RINTOCCHI
// ===========================================================================
/**
 * RINTOCCHI_H6 — in ogni stanza di combattimento (e in quella del boss) pende una corda dalla graticcia.
 * Ciclo: ATTESA → POSA (la corda si tende, la campana oscilla sempre più: è l'annuncio) → SUONA (il rintocco:
 * le figure di pietra si svegliano per `svegliaTick`, quelle vive restano stordite `stordisceTick`) → ATTESA.
 * Colpire la corda (un colpo del giocatore, o [E] accanto) fa suonare subito, con una posa corta e la ricarica.
 */
const RINTOCCHI_H6 = Object.freeze({
  primaAttesaTick: 300, attesaMinTick: 520, attesaMaxTick: 860,
  posaTick: 66,          // la corda si tende e la campana oscilla
  posaColpoTick: 14,     // posa corta quando la corda la tira il giocatore
  suonaTick: 40,         // la campana resta in alto (disegno, cerchi del suono)
  svegliaTick: 150,      // ~2,5 s: le figure di pietra si muovono
  stordisceTick: 75,     // ~1,25 s: le figure vive restano stordite
  ricaricaTick: 420,     // dopo un rintocco tirato a mano
  corda: Object.freeze({ yCima: 52, yFondo: 150, raggioColpo: 7, raggioE: 30 }),
  /** Posti possibili della corda (x); la stanza ne prende uno lontano dal centro e dalle porte. */
  posti: Object.freeze([150, 222, 418, 490]),
});

/** I nemici del luogo. hp = (hpBase + (piano − 1) × hpPiano) × ciclo × campione. sostituisce: tipi di San Leucio. */
const NEMICI_H6 = Object.freeze({
  penitente_pietra: Object.freeze({
    nome: 'Penitente di Pietra', sostituisce: 'burattino', pari: true, hpBase: 14, hpPiano: 4, vel: 0, raggio: 11, massa: Infinity,
    pietra: true, dannoPietra: 0.35, velSveglio: 1.7, giroSveglio: 0.25,
  }),
  battaglio: Object.freeze({
    nome: 'Battaglio Rotolante', sostituisce: 'burattino', pari: false, hpBase: 12, hpPiano: 3.5, vel: 0.4, raggio: 10, massa: 2.2,
    fermoTick: Object.freeze([60, 110]), oscillaTick: 34, bloccoTick: 10, velRotola: 3.3, rotolaTickMax: 80, rimbalzoTick: 20,
  }),
  sagrestano: Object.freeze({
    nome: 'Sagrestano col Turibolo', sostituisce: 'guardia', hpBase: 18, hpPiano: 5, vel: 0.7, raggio: 11, massa: 1.4,
    distanzaPx: 96, bandaPx: 26, camminaTick: Object.freeze([110, 160]), dondolaTick: 40, bloccoTick: 10,
    braci: Object.freeze({ numero: 3, apertura: 0.5, velocita: 1.7 }),
    fumo: Object.freeze({ raggio: 26, vitaTick: 300, deriva: 0.12, rallenta: 0.62, massimi: 4 }),
  }),
  corvo_campanile: Object.freeze({
    nome: 'Corvo del Campanile', sostituisce: 'maschera', anche: Object.freeze(['vespa_cieca']), hpBase: 8, hpPiano: 2.5, vel: 0, raggio: 9, massa: 0.4, vola: true,
    posatoTick: Object.freeze([70, 130]), aliTick: 26, bloccoTick: 8, velVolo: 3.6, voloPx: 230, quota: 4, quotaVolo: 16,
  }),
});

/** Tipo di San Leucio → tipi di Casertavecchia (il burattino si alterna fra penitente e battaglio). */
const SOSTITUZIONI_H6 = Object.freeze((() => {
  const m = {};
  for (const [tipo, T] of Object.entries(NEMICI_H6)) {
    for (const da of [T.sostituisce].concat(T.anche || [])) (m[da] = m[da] || []).push(tipo);
  }
  return m;
})());

/** Scala come popolaStanza di 30-mappa.js (stessi numeri di d6). */
const SCALA_H6 = Object.freeze({ moltCiclo: 1.45, velPerPiano: 0.045, velMax: 1.55, hpCremisi: 1.6, hpCampione: 1.35, velDorato: 1.2, hpBossPerPiano: 45 });

/** Fogli PNG facoltativi (una riga di pose); `attivo: false` finché l'autore non li disegna: si usa il canvas. */
const PNG_H6 = Object.freeze({
  penitente_pietra: Object.freeze({ attivo: false, nome: 'h6_penitente', celle: 2, w: 30, h: 34 }),   // pietra, sveglio
  battaglio: Object.freeze({ attivo: false, nome: 'h6_battaglio', celle: 2, w: 26, h: 22 }),          // fermo, rotola
  sagrestano: Object.freeze({ attivo: false, nome: 'h6_sagrestano', celle: 2, w: 30, h: 38 }),        // cammina, dondola
  corvo_campanile: Object.freeze({ attivo: false, nome: 'h6_corvo', celle: 3, w: 30, h: 24 }),        // posato, ali, volo
});

Object.assign(h6, { alterna: 0, corde: 0 });

/** Il rintocco: parziali inarmoniche di campana con decadimento lungo (Web Audio, rispetta il muto). */
function suonoCampanaH6(grave = 1, vol = 0.09) {
  const c = AudioSys.ctx;
  if (!c || !AudioSys.attivo) return;
  try {
    const t = c.currentTime, f0 = 196 * grave;
    for (const [k, a, d] of [[0.5, 0.5, 3.2], [1, 1, 2.6], [1.19, 0.5, 2], [1.5, 0.4, 1.6], [2, 0.35, 1.3], [2.74, 0.2, 0.9]]) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f0 * k;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * a, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(AudioSys.uscita || c.destination); o.start(t); o.stop(t + d + 0.05);
    }
  } catch (_) { /* l'audio non deve mai fermare il gioco */ }
}

const fraH6 = (coppia) => coppia[0] + Math.floor(rng() * (coppia[1] - coppia[0]));

/** Corda e stato dei rintocchi nuovi per una stanza. */
function nuovaCordaH6(st) {
  const R = RINTOCCHI_H6, P = R.posti;
  const x = P[(h6.corde++) % P.length];
  return { x, fase: 'attesa', t: R.primaAttesaTick, ricarica: 0, suoni: 0, oscilla: 0 };
}

/** La stanza ha la corda? (combattimento e boss, a Casertavecchia) */
function cordaQuiH6(st = statoRun.stanzaCorrente) {
  return st && casertavecchiaAttivaH6() && st.cordaH6 ? st.cordaH6 : null;
}

/** Fa partire la posa (annuncio) del rintocco; `aMano`: tirata dal giocatore (posa corta, ricarica). */
function tiraCordaH6(st, aMano) {
  const c = st && st.cordaH6;
  if (!c || c.fase !== 'attesa') return false;
  if (aMano && c.ricarica > 0) return false;
  c.fase = 'posa'; c.t = aMano ? RINTOCCHI_H6.posaColpoTick : RINTOCCHI_H6.posaTick; c.durata = c.t; c.aMano = Boolean(aMano);
  if (aMano) c.ricarica = RINTOCCHI_H6.ricaricaTick;
  return true;
}

/** Il rintocco vero: la pietra si sveglia, i vivi restano storditi. Lo usa anche il boss (forza 1..2). */
function rintoccoH6(st, forza = 1) {
  const R = RINTOCCHI_H6;
  for (const n of st.nemici) {
    if (n.hp <= 0 || n.boss) continue;
    const T = NEMICI_H6[n.tipo];
    if (T && T.pietra) n.sveglioH6 = Math.round(R.svegliaTick * forza);
    else n.stunTicks = Math.max(n.stunTicks || 0, R.stordisceTick);
  }
  if (st.cordaH6) st.cordaH6.suoni++;
  suonoCampanaH6(forza > 1 ? 0.84 : 1);
  try { scuoti(FEEL.scossa.colpo); } catch (_) { /* senza scossa */ }
}

/** Un tick dei rintocchi nella stanza corrente. */
function passoRintocchiH6(st) {
  const c = st.cordaH6, R = RINTOCCHI_H6;
  if (!c) return;
  if (c.ricarica > 0) c.ricarica--;
  // un colpo del giocatore sulla corda la tira
  if (c.fase === 'attesa' && c.ricarica <= 0) {
    const C = R.corda;
    const i = statoRun.proiettili.findIndex((p) => Math.abs(p.x - c.x) < C.raggioColpo && p.y > C.yCima + 6 && p.y < C.yFondo + 4);
    if (i >= 0 && tiraCordaH6(st, true)) statoRun.proiettili.splice(i, 1);
  }
  const vivi = st.nemici.some((n) => n.hp > 0);
  if (c.fase === 'attesa') { if (vivi && --c.t <= 0) tiraCordaH6(st, false); }
  else if (c.fase === 'posa') { if (--c.t <= 0) { c.fase = 'suona'; c.t = R.suonaTick; rintoccoH6(st, 1); } }
  else if (--c.t <= 0) { c.fase = 'attesa'; c.t = fraH6([R.attesaMinTick, R.attesaMaxTick]); }
  for (const n of st.nemici) if (n.sveglioH6 > 0) n.sveglioH6--;
}

/** [E] accanto alla corda: la tira. */
function usaCordaH6() {
  if (statoRun.fase !== 'in_gioco' || statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo) return false;
  const st = statoRun.stanzaCorrente, c = cordaQuiH6(st);
  if (!c) return false;
  if (Math.hypot(player.x - c.x, player.y - RINTOCCHI_H6.corda.yFondo) >= RINTOCCHI_H6.corda.raggioE) return false;
  tiraCordaH6(st, true);
  return true;
}

const interagisciStanzaCordaH6 = interagisciStanza;
/** [E]: la corda della campana (se ci sei sotto), poi il resto. */
interagisciStanza = function (...args) {
  try { if (usaCordaH6()) return undefined; } catch (err) { console.error('[h6] corda', err); }
  return interagisciStanzaCordaH6.apply(this, args);
};

/** La corda e la campana, sotto le figure (dentro l'atmosfera del luogo). */
function disegnaRintocchiH6(tk, st) {
  const c = st && st.cordaH6;
  if (!c) return;
  const R = RINTOCCHI_H6, C = R.corda, T = TINTE_H6;
  let amp = 0.04 * Math.sin(tk * 0.03), tesa = 0;
  if (c.fase === 'posa') { const k = 1 - c.t / (c.durata || 1); amp = Math.sin(tk * 0.32) * (0.12 + 0.5 * k); tesa = k; }
  else if (c.fase === 'suona') { const k = c.t / R.suonaTick; amp = Math.sin(tk * 0.25) * 0.7 * k; tesa = 0.4 * k; }
  // la corda: lenta pende a curva, tesa si raddrizza e si allunga di un poco
  const yb = C.yFondo + tesa * 8;
  ctx.strokeStyle = '#120f0c'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(c.x, C.yCima + 10); ctx.quadraticCurveTo(c.x + (1 - tesa) * 5 * Math.sin(tk * 0.02), (C.yCima + yb) / 2, c.x, yb); ctx.stroke();
  ctx.strokeStyle = '#8a6a3c'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(c.x, C.yCima + 10); ctx.quadraticCurveTo(c.x + (1 - tesa) * 5 * Math.sin(tk * 0.02), (C.yCima + yb) / 2, c.x, yb); ctx.stroke();
  // il nodo con la nappa rossa
  ctx.fillStyle = T.rosso; ctx.beginPath(); ctx.moveTo(c.x - 3, yb + 7); ctx.lineTo(c.x, yb - 1); ctx.lineTo(c.x + 3, yb + 7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = c.ricarica > 0 ? T.tufoOmbra : T.oro; ctx.beginPath(); ctx.arc(c.x, yb, 2, 0, TAU); ctx.fill();
  // la campana appesa al ceppo della graticcia
  ctx.fillStyle = T.ferro; ctx.fillRect(c.x - 9, C.yCima - 2, 18, 3);
  ctx.save(); ctx.translate(c.x, C.yCima + 1); ctx.rotate(amp);
  ctx.fillStyle = T.china; ctx.strokeStyle = T.bordo; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-7, 11); ctx.quadraticCurveTo(-6, 1, 0, 0); ctx.quadraticCurveTo(6, 1, 7, 11); ctx.lineTo(8, 12.5); ctx.lineTo(-8, 12.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = T.oro; ctx.globalAlpha = 0.6; ctx.fillRect(-6.5, 10, 13, 1); ctx.globalAlpha = 1;
  ctx.fillStyle = T.ferro; ctx.beginPath(); ctx.arc(Math.sin(tk * 0.3) * amp * 6, 13, 1.6, 0, TAU); ctx.fill();
  ctx.restore();
  // il suono: archi che si allargano dalla campana (nella fascia alta, non a terra)
  if (c.fase === 'suona') {
    const k = 1 - c.t / R.suonaTick;
    ctx.strokeStyle = T.luna; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const kk = (k + i / 3) % 1;
      ctx.globalAlpha = 0.55 * (1 - kk);
      ctx.beginPath(); ctx.arc(c.x, C.yCima + 8, 10 + kk * 46, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

// --------------------------------------------------------------------------- i nemici: vestizione e IA
/** Veste una stanza appena popolata: i nemici di San Leucio diventano quelli di Casertavecchia; la corda. */
function vestiStanzaH6(s, piano) {
  const K = SCALA_H6;
  const ciclo = Math.floor((piano - 1) / 4) + 1;
  const moltCiclo = Math.pow(K.moltCiclo, ciclo - 1);
  const moltVel = Math.min(K.velMax, 1 + (piano - 1) * K.velPerPiano);
  if (s.tipo !== 'boss') {
    for (const n of s.nemici || []) {
      const scelte = !n.boss && SOSTITUZIONI_H6[n.tipo];
      if (!scelte) continue;
      const nuovo = scelte.length > 1 ? scelte[(h6.alterna++) % scelte.length] : scelte[0];
      const T = NEMICI_H6[nuovo];
      const hpC = n.champion === 'cremisi' ? K.hpCremisi : n.champion ? K.hpCampione : 1;
      n.tipo = nuovo; n.patternMob = nuovo; n.comportamento = nuovo;
      n.nome = n.champion ? `${T.nome} [Campione ${n.champion}]` : T.nome;
      n.maxHp = Math.round((T.hpBase + (piano - 1) * T.hpPiano) * moltCiclo * hpC);
      n.hp = n.maxHp;
      n.speed = T.vel * moltVel * (n.champion === 'dorato' ? K.velDorato : 1);
      n.velH6 = moltVel * (n.champion === 'dorato' ? K.velDorato : 1);
      n.r = T.raggio;
    }
    if (s.tipo === 'normale' && s.nemici && s.nemici.length && !s.cordaH6) s.cordaH6 = nuovaCordaH6(s);
  } else if (s.tipo === 'boss') {
    if (typeof vestiBossH6 === 'function') vestiBossH6(s, piano, moltCiclo, moltVel);
    s.cordaH6 = nuovaCordaH6(s);
  }
}

const popolaStanzaBaseH6 = popolaStanza;
/** Dopo popolaStanza di base: a Casertavecchia si vestono nemici e boss del luogo. */
popolaStanza = function (s, piano, ...resto) {
  const r = popolaStanzaBaseH6.call(this, s, piano, ...resto);
  try { if (s && casertavecchiaAttivaH6(piano)) vestiStanzaH6(s, piano); } catch (err) { console.error('[h6] popola', err); }
  return r;
};

const massaNemicoBaseH6 = massaNemico;
/** Massa per le spinte: quella della tabella per i nemici del luogo (il penitente sveglio si sposta). */
massaNemico = function (nem, ...resto) {
  const T = nem && !nem.boss ? NEMICI_H6[nem.tipo] : null;
  if (T && T.massa !== undefined) return T.pietra && nem.sveglioH6 > 0 ? 2.5 : T.massa;
  return massaNemicoBaseH6.call(this, nem, ...resto);
};

const danneggiaNemicoBaseH6 = danneggiaNemico;
/** La pietra addormentata si scalfisce appena: il penitente prende danno pieno solo quando è sveglio. */
danneggiaNemico = function (nem, dmg, ...resto) {
  try {
    const T = nem && !nem.boss ? NEMICI_H6[nem.tipo] : null;
    if (T && T.pietra && !(nem.sveglioH6 > 0)) dmg *= T.dannoPietra;
    if (nem && nem.boss && typeof dannoBossH6 === 'function') dmg = dannoBossH6(nem, dmg);
  } catch (err) { console.error('[h6] danno', err); }
  return danneggiaNemicoBaseH6.call(this, nem, dmg, ...resto);
};

/** Sposta un nemico tenendolo nell'arena; rende true se ha toccato un muro. */
function muoviH6(n, dx, dy, margine = 14) {
  const x = n.x + dx, y = n.y + dy;
  n.x = limitaH6(x, ARENA.x1 + margine, ARENA.x2 - margine);
  n.y = limitaH6(y, ARENA.y1 + margine, ARENA.y2 - margine);
  return n.x !== x || n.y !== y;
}

/** Un colpo nemico comune del Teatro, col nome del tiratore per il Registro (a7). */
function sparaH6(x, y, ang, vel, fonte, extra = {}) {
  if (statoRun.proiettiliNemici.length >= 30) return false;
  statoRun.proiettiliNemici.push({ x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, dist: 0, fonteA7: fonte, ...extra });
  return true;
}

/** IA dei nemici del luogo, per tipo: (n, st, ang, dist, T). Stati in n.statoH6, timer in n.tH6. */
const IA_H6 = {
  // PENITENTE DI PIETRA: inginocchiato, fermo come una statua (e duro come la pietra). Al rintocco si alza e
  // ti viene addosso finché la campana non tace.
  penitente_pietra(n, st, ang, dist, T) {
    if (!(n.sveglioH6 > 0)) { n.statoH6 = 'pietra'; return; }
    n.statoH6 = 'sveglio';
    const v = T.velSveglio * (n.velH6 || 1);
    const a = ang + Math.sin(tick * 0.07 + n.x) * T.giroSveglio;
    muoviH6(n, Math.cos(a) * v, Math.sin(a) * v);
    n.versoH6 = Math.cos(ang) < 0 ? -1 : 1;
  },
  // BATTAGLIO ROTOLANTE: il battaglio caduto da una campana. FERMO; poi OSCILLA dondolando sul fianco (punta e
  // si blocca) e ROTOLA dritto fino al muro; RIMBALZA e si ferma.
  battaglio(n, st, ang, dist, T) {
    if (!n.statoH6) { n.statoH6 = 'fermo'; n.tH6 = fraH6(T.fermoTick); n.angH6 = ang; n.giroH6 = 0; }
    if (n.statoH6 === 'fermo') {
      if (--n.tH6 <= 0) { n.statoH6 = 'oscilla'; n.tH6 = T.oscillaTick; }
    } else if (n.statoH6 === 'oscilla') {
      if (n.tH6 > T.bloccoTick) n.angH6 = ang;
      if (--n.tH6 <= 0) { n.statoH6 = 'rotola'; n.tH6 = T.rotolaTickMax; }
    } else if (n.statoH6 === 'rotola') {
      const v = T.velRotola * (n.velH6 || 1);
      n.giroH6 += v * 0.18;
      const muro = muoviH6(n, Math.cos(n.angH6) * v, Math.sin(n.angH6) * v, 12);
      if (muro || --n.tH6 <= 0) { n.statoH6 = 'rimbalza'; n.tH6 = T.rimbalzoTick; if (muro) { try { scuoti(FEEL.scossa.colpo * 0.5); } catch (_) { /* */ } } }
    } else {
      muoviH6(n, -Math.cos(n.angH6) * 0.6, -Math.sin(n.angH6) * 0.6, 12);
      if (--n.tH6 <= 0) { n.statoH6 = 'fermo'; n.tH6 = fraH6(T.fermoTick); }
    }
  },
  // SAGRESTANO COL TURIBOLO: CAMMINA tenendo la distanza; poi DONDOLA il turibolo sempre più largo (punta e si
  // blocca) e lo SLANCIA: tre braci a ventaglio e una nuvola d'incenso che resta, va alla deriva e fa camminare piano.
  sagrestano(n, st, ang, dist, T) {
    if (!n.statoH6) { n.statoH6 = 'cammina'; n.tH6 = fraH6(T.camminaTick); n.giroH6 = rng() < 0.5 ? -1 : 1; n.angH6 = ang; }
    if (n.statoH6 === 'cammina') {
      const rad = limitaH6((dist - T.distanzaPx) / T.bandaPx, -1, 1);
      const dx = Math.cos(ang) * rad + Math.cos(ang + n.giroH6 * Math.PI / 2) * 0.5;
      const dy = Math.sin(ang) * rad + Math.sin(ang + n.giroH6 * Math.PI / 2) * 0.5;
      const l = Math.hypot(dx, dy) || 1;
      if (muoviH6(n, (dx / l) * n.speed, (dy / l) * n.speed) && n.tH6 % 20 === 0) n.giroH6 = -n.giroH6;
      n.versoH6 = Math.cos(ang) < 0 ? -1 : 1;
      if (--n.tH6 <= 0) { n.statoH6 = 'dondola'; n.tH6 = T.dondolaTick; }
    } else {
      if (n.tH6 > T.bloccoTick) { n.angH6 = ang; n.versoH6 = Math.cos(ang) < 0 ? -1 : 1; }
      if (--n.tH6 <= 0) {
        const B = T.braci, ox = n.x + n.versoH6 * 10, oy = n.y - 10;
        for (let k = 0; k < B.numero; k++) sparaH6(ox, oy, n.angH6 + (k / (B.numero - 1) - 0.5) * B.apertura, B.velocita, `una brace del ${T.nome}`, { braceH6: true });
        const F = T.fumo;
        st.fumoH6 = (st.fumoH6 || []).slice(-(F.massimi - 1));
        st.fumoH6.push({ x: ox, y: n.y, t: 0, vita: F.vitaTick, vx: Math.cos(n.angH6) * F.deriva, vy: Math.sin(n.angH6) * F.deriva });
        n.statoH6 = 'cammina'; n.tH6 = fraH6(T.camminaTick);
      }
    }
  },
  // CORVO DEL CAMPANILE: POSATO a terra, saltella; apre le ALI (punta e si blocca) e attraversa il palco in VOLO
  // radente dritto, oltre il punto in cui eri, poi si riposa. Al rintocco si spaventa e parte subito.
  corvo_campanile(n, st, ang, dist, T) {
    if (!n.statoH6) { n.statoH6 = 'posato'; n.tH6 = fraH6(T.posatoTick); n.angH6 = ang; }
    if (n.statoH6 === 'posato') {
      n.versoH6 = Math.cos(ang) < 0 ? -1 : 1;
      const c = st.cordaH6;
      if (c && c.fase === 'suona' && n.tH6 > T.aliTick) n.tH6 = 1; // spaventato dal rintocco
      if (--n.tH6 <= 0) { n.statoH6 = 'ali'; n.tH6 = T.aliTick; }
    } else if (n.statoH6 === 'ali') {
      if (n.tH6 > T.bloccoTick) n.angH6 = ang;
      if (--n.tH6 <= 0) { n.statoH6 = 'volo'; n.restaH6 = T.voloPx; }
    } else {
      const v = T.velVolo;
      const muro = muoviH6(n, Math.cos(n.angH6) * v, Math.sin(n.angH6) * v, 12);
      n.restaH6 -= v;
      n.versoH6 = Math.cos(n.angH6) < 0 ? -1 : 1;
      if (muro || n.restaH6 <= 0) { n.statoH6 = 'posato'; n.tH6 = fraH6(T.posatoTick); }
    }
  },
};

if (typeof iaNemicoD6 === 'function') {
  const iaNemicoBaseH6 = iaNemicoD6;
  /** AGGANCIO di 40-combattimento.js (via iaNemicoD6): i nemici di Casertavecchia agiscono qui e rendono true. */
  iaNemicoD6 = function (n, st, ang, dist, ...resto) {
    const ia = n && IA_H6[n.tipo];
    if (!ia) return iaNemicoBaseH6.call(this, n, st, ang, dist, ...resto);
    try { ia(n, st, ang, dist, NEMICI_H6[n.tipo]); } catch (err) { console.error('[h6] ia', n.tipo, err); }
    return true;
  };
}

/** Il fumo d'incenso: deriva, si dirada; dentro si cammina piano. Rende il fattore di passo del giocatore. */
function passoFumoH6(st) {
  const F = NEMICI_H6.sagrestano.fumo;
  let resta = 1;
  const fumo = st.fumoH6 || [];
  for (let i = fumo.length - 1; i >= 0; i--) {
    const f = fumo[i];
    f.t++; f.x = limitaH6(f.x + f.vx, ARENA.x1, ARENA.x2); f.y = limitaH6(f.y + f.vy, ARENA.y1, ARENA.y2);
    if (f.t > f.vita) { fumo.splice(i, 1); continue; }
    if (Math.hypot(player.x - f.x, (player.y - 4) - f.y) < F.raggio * raggioFumoH6(f)) resta = F.rallenta;
  }
  return resta;
}
const raggioFumoH6 = (f) => Math.min(1, f.t / 24) * (1 - Math.max(0, f.t - f.vita + 60) / 120);

const passoLogicoBaseH6 = passoLogico;
/** Attorno al passo di base: i rintocchi, il fumo d'incenso, il boss del luogo. */
passoLogico = function (...args) {
  const st = statoRun.stanzaCorrente;
  const attivo = Boolean(st) && statoRun.fase === 'in_gioco' && (casertavecchiaAttivaH6() || Boolean(bossH6(st))) && ticksCongelati <= 0
    && !(statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo || statoRun.pausa);
  const px = player.x, py = player.y;
  if (attivo) { for (const n of st.nemici) n.ptH6 = n.phaseTick || 0; }
  const r = passoLogicoBaseH6.apply(this, args);
  try {
    if (attivo && statoRun.fase === 'in_gioco' && statoRun.stanzaCorrente === st) {
      passoRintocchiH6(st);
      const resta = passoFumoH6(st);
      if (resta < 1) { player.x = px + (player.x - px) * resta; player.y = py + (player.y - py) * resta; }
      if (typeof passoBossH6 === 'function') passoBossH6(st);
    }
  } catch (err) { console.error('[h6] passo', err); }
  return r;
};

const entraInStanzaBaseH6 = entraInStanza;
/** Ingresso in una stanza di Casertavecchia: la campana riparte dall'attesa, il fumo si dirada. */
entraInStanza = function (stanza, daLato, ...resto) {
  const r = entraInStanzaBaseH6.call(this, stanza, daLato, ...resto);
  try {
    if (stanza && statoRun.stanzaCorrente === stanza && casertavecchiaAttivaH6()) {
      stanza.fumoH6 = [];
      if (stanza.tipo !== 'boss') vestiStanzaH6(stanza, statoRun.piano); // chi entra in scena dopo la mappa
      if (stanza.cordaH6) Object.assign(stanza.cordaH6, { fase: 'attesa', t: RINTOCCHI_H6.primaAttesaTick, ricarica: 0 });
      if (typeof ingressoBossH6 === 'function') ingressoBossH6(stanza);
    }
  } catch (err) { console.error('[h6] ingresso', err); }
  return r;
};

// --------------------------------------------------------------------------- disegno dei nemici (a ombre)
function chinaH6(flash) {
  ctx.fillStyle = flash ? TINTE_H6.lampo : TINTE_H6.china;
  ctx.strokeStyle = flash ? '#ffffff' : TINTE_H6.bordo;
  ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
}
function ombraH6(x, y, rx, ry, alfa = 0.6) {
  ctx.fillStyle = `rgba(6, 6, 10, ${alfa})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}
function aloneCampioneH6(n, quota) {
  if (!n.champion) return;
  const col = n.champion === 'cremisi' ? 'rgba(239,68,68,0.45)' : n.champion === 'dorato' ? 'rgba(250,204,21,0.48)' : 'rgba(56,189,248,0.48)';
  const g = ctx.createRadialGradient(n.x, n.y - quota, 2, n.x, n.y - quota, n.r + 12);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y - quota, n.r + 12, 0, TAU); ctx.fill();
}
function stordimentoH6(n, quota) {
  if (!(n.stunTicks > 0)) return;
  ctx.fillStyle = TINTE_H6.oro;
  for (let k = 0; k < 3; k++) { const a = tick * 0.12 + k * TAU / 3; ctx.fillRect(n.x + Math.cos(a) * 8 - 1, n.y - quota + Math.sin(a) * 3 - 1, 2, 2); }
}
/** Il PNG della figura, se c'è: rende true se l'ha disegnato. */
function pngH6(n, col) {
  const g = PNG_H6[n.tipo];
  if (!g || !g.attivo || typeof disegnaCellaTeatro !== 'function') return false;
  return disegnaCellaTeatro(ctx, g.nome, col, g.celle, n.x - g.w / 2, n.y + 3 - g.h, g.w, g.h, n.flash > 0 ? '#ffffff' : null, n.flash > 0 ? 0.6 : 0);
}

const DISEGNI_NEMICI_H6 = {
  penitente_pietra(n, tk, flash) {
    const sveglio = n.sveglioH6 > 0;
    ombraH6(n.x, n.y + 2, 11, 3.6);
    aloneCampioneH6(n, 12);
    if (pngH6(n, sveglio ? 1 : 0)) return;
    const s = sveglio ? Math.sin(tk * 0.4) * 1.2 : 0, alto = sveglio ? 6 : 0; // sveglio: si alza dalle ginocchia
    ctx.save(); ctx.translate(n.x, n.y); ctx.scale(n.versoH6 || 1, 1);
    ctx.fillStyle = flash ? TINTE_H6.lampo : (sveglio ? '#4d4b48' : '#6e6c68');
    ctx.strokeStyle = flash ? '#fff' : TINTE_H6.bordo; ctx.lineWidth = 1.1; ctx.lineJoin = 'round';
    // il saio di pietra, la schiena curva e il cappuccio a punta
    ctx.beginPath(); ctx.moveTo(-10, 2); ctx.quadraticCurveTo(-11, -10 - alto, -4, -16 - alto); ctx.lineTo(-1 + s, -27 - alto); ctx.lineTo(4, -17 - alto);
    ctx.quadraticCurveTo(9, -10 - alto, 9, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    // le mani giunte sotto il mento
    ctx.fillStyle = flash ? '#fff' : '#8c8a86'; ctx.beginPath(); ctx.ellipse(5, -11 - alto, 2.4, 3.4, 0.3, 0, TAU); ctx.fill();
    // il volto in ombra; sveglio, due braci negli occhi
    ctx.fillStyle = TINTE_H6.china; ctx.beginPath(); ctx.ellipse(1.5, -19 - alto, 2.6, 3, 0, 0, TAU); ctx.fill();
    if (sveglio) { ctx.fillStyle = TINTE_H6.rosso; ctx.fillRect(1.2, -20 - alto, 1.4, 1.2); ctx.fillRect(3.2, -20 - alto, 1.2, 1.2); }
    // le crepe: si accendono d'oro quando la campana sta per suonare (la posa) e mentre è sveglio
    const c = statoRun.stanzaCorrente && statoRun.stanzaCorrente.cordaH6;
    const vena = sveglio ? 0.9 : c && c.fase === 'posa' ? 0.25 + 0.6 * (1 - c.t / (c.durata || 1)) : 0;
    ctx.strokeStyle = vena > 0 ? `rgba(249, 203, 64, ${vena.toFixed(2)})` : 'rgba(20, 20, 24, 0.7)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-6, -8 - alto); ctx.lineTo(-3, -4 - alto); ctx.lineTo(-5, 0); ctx.moveTo(4, -6 - alto); ctx.lineTo(2, -1); ctx.stroke();
    ctx.restore();
    stordimentoH6(n, 30);
  },
  battaglio(n, tk, flash) {
    ombraH6(n.x, n.y + 2, 11, 3.2);
    aloneCampioneH6(n, 6);
    if (pngH6(n, n.statoH6 === 'rotola' ? 1 : 0)) return;
    const osc = n.statoH6 === 'oscilla' ? Math.sin(tk * 0.55) * 0.35 * (1 - n.tH6 / NEMICI_H6.battaglio.oscillaTick + 0.3) : 0;
    ctx.save(); ctx.translate(n.x, n.y - 6);
    ctx.rotate((n.angH6 || 0) + osc);
    chinaH6(flash); ctx.fillStyle = flash ? TINTE_H6.lampo : TINTE_H6.ferro;
    // il battaglio sdraiato lungo la sua direzione: la pera di ferro davanti, l'anello dietro
    ctx.beginPath(); ctx.ellipse(4, 0, 7, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, -2.2); ctx.lineTo(-10, -1.4); ctx.lineTo(-10, 1.4); ctx.lineTo(-3, 2.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = flash ? '#fff' : TINTE_H6.bordo;
    ctx.beginPath(); ctx.arc(-12.5, 0, 2.6, 0, TAU); ctx.stroke();
    // il riflesso che gira quando rotola
    const g = n.giroH6 || 0;
    ctx.fillStyle = TINTE_H6.oro; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.ellipse(4 + Math.cos(g) * 2, Math.sin(g) * 4, 1.6, 1, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.restore();
    stordimentoH6(n, 18);
  },
  sagrestano(n, tk, flash) {
    ombraH6(n.x, n.y + 2, 10, 3.4);
    aloneCampioneH6(n, 14);
    if (pngH6(n, n.statoH6 === 'dondola' ? 1 : 0)) return;
    const T = NEMICI_H6.sagrestano, d = n.statoH6 === 'dondola';
    const k = d ? 1 - n.tH6 / T.dondolaTick : 0;
    const passo = d ? 0 : Math.sin(tk * 0.2 + n.x) * 1;
    ctx.save(); ctx.translate(n.x, n.y); ctx.scale(n.versoH6 || 1, 1);
    chinaH6(flash);
    // la veste nera fino ai piedi e la cotta bianca
    ctx.beginPath(); ctx.moveTo(-7, 2); ctx.lineTo(-5, -18); ctx.lineTo(5, -18); ctx.lineTo(7, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#d8d2c4'; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-5, -18); ctx.lineTo(5, -18); ctx.lineTo(6, -6); ctx.lineTo(3, -4.5); ctx.lineTo(0, -6); ctx.lineTo(-3, -4.5); ctx.closePath(); ctx.fill();
    // la testa calva e china
    ctx.fillStyle = flash ? TINTE_H6.lampo : TINTE_H6.china; ctx.beginPath(); ctx.arc(1, -22 + passo * 0.3, 4.2, 0, TAU); ctx.fill(); ctx.stroke();
    // il braccio con la catena e il turibolo: dondolo che si allarga nella posa
    const amp = d ? 0.4 + 1.3 * k : 0.25;
    const a = Math.PI / 2 + Math.sin(tk * (d ? 0.32 : 0.1)) * amp;
    const hx = 6, hy = -14, tx = hx + Math.cos(a) * 13, ty = hy + Math.sin(a) * 13;
    ctx.strokeStyle = flash ? '#fff' : '#7a6a4a'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#b08a3a'; ctx.strokeStyle = TINTE_H6.china; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(tx, ty + 2, 3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = `rgba(255, 140, 40, ${(0.5 + 0.4 * k).toFixed(2)})`; ctx.fillRect(tx - 1.4, ty + 1, 2.8, 1.2);
    // il filo di fumo che sale dal turibolo
    ctx.strokeStyle = 'rgba(200, 200, 210, 0.45)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(tx, ty - 1); ctx.quadraticCurveTo(tx + 3 * Math.sin(tk * 0.1), ty - 8, tx - 1, ty - 14); ctx.stroke();
    ctx.restore();
    stordimentoH6(n, 30);
  },
  corvo_campanile(n, tk, flash) {
    const T = NEMICI_H6.corvo_campanile, vola = n.statoH6 === 'volo', ali = n.statoH6 === 'ali';
    const q = vola ? T.quotaVolo : T.quota;
    ombraH6(n.x, n.y + 2, vola ? 7 : 8, 2.6, vola ? 0.35 : 0.55);
    aloneCampioneH6(n, q + 4);
    if (pngH6(n, vola ? 2 : ali ? 1 : 0)) return;
    ctx.save(); ctx.translate(n.x, n.y - q); ctx.scale(n.versoH6 || 1, 1);
    chinaH6(flash);
    // il corpo e la testa col becco
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 4.2, -0.15, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(6, -3, 3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#3a3530'; ctx.beginPath(); ctx.moveTo(8.5, -3.8); ctx.lineTo(13, -2.4); ctx.lineTo(8.5, -1.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = TINTE_H6.oro; ctx.fillRect(6.4, -4.2, 1.1, 1.1);
    // la coda
    chinaH6(flash); ctx.beginPath(); ctx.moveTo(-6, -1); ctx.lineTo(-12, -3); ctx.lineTo(-11, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    // le ali: chiuse da posato, alte e aperte nella posa, battute in volo
    const batti = vola ? Math.sin(tk * 0.8) : ali ? -1 : 0.6;
    ctx.beginPath(); ctx.moveTo(-3, -2); ctx.quadraticCurveTo(-4, -2 - 10 * Math.max(0.2, -batti + 0.2), -12, -4 - 8 * (-batti)); ctx.lineTo(2, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!vola) { ctx.strokeStyle = flash ? '#fff' : '#3a3530'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-1, 4); ctx.lineTo(-1.5, q - 1); ctx.moveTo(2, 4); ctx.lineTo(2.5, q - 1); ctx.stroke(); }
    ctx.restore();
    stordimentoH6(n, q + 10);
  },
};

const disegnaNemicoPittoricoBaseH6 = disegnaNemicoPittorico;
/** I nemici di Casertavecchia si disegnano qui; gli altri restano alla base. Stessa firma: ([ctx], nemico, tick). */
disegnaNemicoPittorico = function (...args) {
  const a = args[0] && typeof args[0].save === 'function' ? args.slice(1) : args;
  const n = a[0];
  const disegno = n && DISEGNI_NEMICI_H6[n.tipo];
  if (!disegno) return disegnaNemicoPittoricoBaseH6.apply(this, args);
  try {
    ctx.save(); ctx.imageSmoothingEnabled = true;
    disegno(n, a[1] || 0, n.flash > 0 && OPZIONI.lampi !== false);
    ctx.restore();
  } catch (err) { console.error('[h6] disegno', n.tipo, err); }
  return undefined;
};

/** Sopra il pavimento e sotto le figure: le nuvole d'incenso. */
function disegnaSopraStanzaH6(tk, st) {
  if (!st || !casertavecchiaAttivaH6()) return;
  disegnaRintocchiH6(tk, st);
  const F = NEMICI_H6.sagrestano.fumo;
  for (const f of st.fumoH6 || []) {
    const k = raggioFumoH6(f);
    if (k <= 0) continue;
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7 + f.t * 0.01, rr = F.raggio * k * (0.55 + 0.15 * i);
      ctx.fillStyle = `rgba(190, 192, 204, ${(0.13 * k).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 6 * k, f.y - 6 + Math.sin(a) * 3 * k, rr, 0, TAU); ctx.fill();
    }
  }
}

Object.assign(window.__teatro.interni, { RINTOCCHI_H6, NEMICI_H6, SOSTITUZIONI_H6 });
Object.defineProperties(window.__teatro.interni.casertavecchiaH6, Object.getOwnPropertyDescriptors({
  /** La corda della stanza corrente (copia) o null. */
  get corda() { const c = cordaQuiH6(); return c ? { ...c } : null; },
  /** Sviluppo/QA: tira la corda (aMano = come il giocatore). */
  tira: (aMano = true) => tiraCordaH6(statoRun.stanzaCorrente, aMano),
  get fumo() { const st = statoRun.stanzaCorrente; return ((st && st.fumoH6) || []).length; },
}));

// --------------------------------------------------------------------------- arredi del borgo
/**
 * Le disposizioni di b7 del piano 3 sono quelle di San Leucio (telai, arcolai). A Casertavecchia restano le
 * stesse colonne (stesse misure e collisioni: cambia solo il disegno), vestite da borgo: un pozzo, un rocchio
 * di colonna, un'edicola col lumino, un sarcofago. Sempre lo stesso arredo nello stesso punto.
 */
/** I temi rari di b7 del piano 3, col nome del borgo (i nemici li veste già vestiStanzaH6). TESTI DA APPROVARE. */
const TEMI_H6 = Object.freeze({
  teatrino: Object.freeze({ nome: 'I Penitenti del Sagrato',
    avviso: '🔔 I PENITENTI DEL SAGRATO: inginocchiati sulla pietra, aspettano la campana. Chi li sveglia e li batte trova qualcosa in più.' }),
  'corte-delle-maschere': Object.freeze({ nome: 'Lo Stormo del Campanile',
    avviso: '🪶 LO STORMO DEL CAMPANILE: i corvi del duomo sono scesi tutti. Chi li abbatte trova qualcosa in più.' }),
  plotone: Object.freeze({ nome: 'La Processione dei Sagrestani',
    avviso: '🔔 LA PROCESSIONE DEI SAGRESTANI: tre turiboli in fila per il vicolo. Chi la scompiglia trova qualcosa in più.' }),
});

const generaMappaPianoTemiH6 = generaMappaPiano;
/** I temi rari di b7 a Casertavecchia prendono il nome del luogo. */
generaMappaPiano = function (piano, ...resto) {
  const m = generaMappaPianoTemiH6.call(this, piano, ...resto);
  try {
    if (m && casertavecchiaAttivaH6(piano)) {
      for (const st of m.stanze) {
        const T = st.temaB7 && TEMI_H6[st.temaB7.id];
        if (T) st.temaB7 = Object.assign({}, st.temaB7, { nome: T.nome, avviso: T.avviso });
      }
    }
  } catch (err) { console.error('[h6] temi', err); }
  return m;
};

const ARREDI_H6 = Object.freeze({ colonne: Object.freeze(['pozzo', 'rocchio', 'edicola', 'sarcofago']) });

/** Un blocco squadrato di tufo grigio coi piedi in (cx, yb). */
function bloccoH6(g, cx, yb, l, a, chiaro = TINTE_H6.tufo) {
  g.fillStyle = chiaro; g.fillRect(cx - l / 2, yb - a, l, a);
  g.fillStyle = TINTE_H6.tufoChiaro; g.fillRect(cx - l / 2, yb - a, l, 2);
  g.fillStyle = TINTE_H6.tufoOmbra; g.fillRect(cx + l / 2 - 3, yb - a + 2, 3, a - 2);
  g.strokeStyle = TINTE_H6.china; g.lineWidth = 1; g.strokeRect(cx - l / 2, yb - a, l, a);
}

const PELLI_H6 = Object.freeze({
  pozzo: { l: 44, a: 46, ax: 22, ay: 36, disegna(g) {
    ombraB7(g, 17, 5);
    g.fillStyle = '#5a5853'; g.beginPath(); g.ellipse(0, -4, 16, 9, 0, 0, TAU); g.fill();
    g.fillStyle = TINTE_H6.tufo; g.fillRect(-16, -14, 32, 10);
    g.fillStyle = '#5a5853'; g.beginPath(); g.ellipse(0, -14, 16, 6, 0, 0, TAU); g.fill();
    g.fillStyle = '#07080c'; g.beginPath(); g.ellipse(0, -14, 12, 4, 0, 0, TAU); g.fill();
    g.strokeStyle = TINTE_H6.china; g.lineWidth = 1; g.beginPath(); g.ellipse(0, -14, 16, 6, 0, 0, TAU); g.stroke();
    g.strokeStyle = TINTE_H6.ferro; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-13, -14); g.lineTo(-13, -32); g.lineTo(13, -32); g.lineTo(13, -14); g.stroke();
    g.strokeStyle = '#8a6a3c'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -32); g.lineTo(0, -20); g.stroke();
  } },
  rocchio: { l: 40, a: 52, ax: 20, ay: 40, disegna(g) {
    ombraB7(g, 15, 5);
    g.fillStyle = TINTE_H6.tufo; g.fillRect(-10, -30, 20, 30);
    g.fillStyle = TINTE_H6.tufoOmbra; for (const x of [-5, 0, 5]) g.fillRect(x, -28, 1.2, 28);
    g.fillStyle = TINTE_H6.tufoChiaro; g.beginPath(); g.moveTo(-10, -30); g.lineTo(-4, -35); g.lineTo(3, -31); g.lineTo(10, -34); g.lineTo(10, -30); g.closePath(); g.fill();
    g.strokeStyle = TINTE_H6.china; g.lineWidth = 1; g.strokeRect(-10, -30, 20, 30);
    bloccoH6(g, 0, 2, 26, 6, '#6e6c68');
  } },
  edicola: { l: 38, a: 56, ax: 19, ay: 44, disegna(g) {
    ombraB7(g, 14, 4.5);
    bloccoH6(g, 0, 0, 24, 36);
    g.fillStyle = '#16141a'; g.beginPath(); g.moveTo(-7, -8); g.lineTo(-7, -24); g.arc(0, -24, 7, Math.PI, 0); g.lineTo(7, -8); g.closePath(); g.fill();
    g.fillStyle = '#c9a15a'; g.globalAlpha = 0.55; g.beginPath(); g.arc(0, -22, 3.4, 0, TAU); g.fill(); g.globalAlpha = 1; // l'immaginetta
    g.fillStyle = '#7a1d14'; g.fillRect(-2, -12, 4, 4);
    g.fillStyle = TINTE_H6.lumino; g.beginPath(); g.ellipse(0, -14, 1.3, 2.4, 0, 0, TAU); g.fill();
    g.fillStyle = TINTE_H6.tufoChiaro; g.beginPath(); g.moveTo(-14, -36); g.lineTo(0, -42); g.lineTo(14, -36); g.closePath(); g.fill();
    g.strokeStyle = TINTE_H6.china; g.lineWidth = 1; g.stroke();
  } },
  sarcofago: { l: 50, a: 38, ax: 25, ay: 28, disegna(g) {
    ombraB7(g, 20, 5);
    bloccoH6(g, 0, 0, 40, 16, '#7a7874');
    g.fillStyle = TINTE_H6.tufoChiaro; g.beginPath(); g.moveTo(-22, -16); g.lineTo(-18, -22); g.lineTo(18, -22); g.lineTo(22, -16); g.closePath(); g.fill();
    g.strokeStyle = TINTE_H6.china; g.lineWidth = 1; g.stroke();
    g.strokeStyle = TINTE_H6.tufoOmbra; for (const x of [-12, -4, 4, 12]) { g.beginPath(); g.arc(x, -6, 3, Math.PI, 0); g.stroke(); }
  } },
});

/** L'arredo del borgo per un ostacolo, o null (gli ostacoli che non sono colonne restano alla base). */
function arredoH6(o) {
  if (o.tipo !== 'colonna') return null;
  const L = ARREDI_H6.colonne;
  return L[Math.abs(Math.round(o.x) * 7 + Math.round(o.y) * 13) % L.length];
}

/** Disegna l'arredo del luogo; true se l'ha disegnato. */
function disegnaArredoH6(o, t) {
  const nome = arredoH6(o);
  if (!nome || typeof timbroB7 !== 'function') return false;
  const P = PELLI_H6[nome];
  const c = timbroB7('h6-' + nome, P);
  const dx = o.scossoB7 > 0 ? (o.scossoB7 % 2 ? 1 : -1) : 0;
  ctx.drawImage(c, Math.round(o.x) - P.ax + dx, Math.round(o.y) - P.ay, P.l, P.a);
  if (nome === 'edicola') {
    const a = 0.12 + 0.05 * Math.sin(t * 0.21 + o.x);
    ctx.fillStyle = `rgba(255, 179, 71, ${a.toFixed(2)})`; ctx.beginPath(); ctx.arc(o.x, o.y - 14, 12, 0, TAU); ctx.fill();
  }
  return true;
}

if (typeof disegnaOstacoloB9 === 'function') {
  const disegnaOstacoloBaseH6 = disegnaOstacoloB9;
  /** Ostacoli del palco (prima b9, poi b7 in 60-resa.js): a Casertavecchia gli arredi del borgo. */
  disegnaOstacoloB9 = function (o, t, ...resto) {
    try { if (casertavecchiaAttivaH6() && disegnaArredoH6(o, t)) return true; } catch (err) { console.error('[h6] arredo', err); }
    return disegnaOstacoloBaseH6.call(this, o, t, ...resto);
  };
}

// ===========================================================================
// 4. IL BOSS: Il Campanaro Senza Volto (macchina a stati nello schema di b6-boss.js e d6)
// ===========================================================================
/** Testi del boss (DA APPROVARE DALL'AUTORE; nuovi: la bibbia dà solo il nome e il «risveglia i rimorsi»). */
const TESTI_BOSS_H6 = Object.freeze({
  presentazione: '«Ogni rintocco è una parola che non hai detto.»',
  sconfitta: 'Il Campanaro lascia andare la corda. Le campane tacciono: per la prima volta il borgo dorme davvero.',
  fase2: 'Le campane si staccano dalla graticcia e cadono sul sagrato!',
  rivelazione: 'Il Campanaro era il sagrestano del duomo. Suonava a morto per chi se n\'era andato senza chiedere perdono, e teneva per sé le parole che nessuno aveva detto. Il Velo gli ha preso il volto: gli ha lasciato solo le corde.',
});

/** SCHEDA del boss (stessi campi di SCHEDE_B6). */
const SCHEDA_H6 = Object.freeze({
  id: 'campanaro-senza-volto', nome: 'Il Campanaro Senza Volto', tipo: 'campanaro', pattern: 'rintocco_campanaro',
  hpBase: 215, speed: 0.7, raggio: 17, ombra: Object.freeze([22, 7]),
  presentazione: TESTI_BOSS_H6.presentazione,
  sconfitta: TESTI_BOSS_H6.sconfitta,
  segno: Object.freeze({ sprite: 'segnoCampanaH6', nome: 'Campanaro Senza Volto' }),
  /** Foglio PNG facoltativo (una riga, una cella per posa); `attivo: false` finché non c'è. */
  foglio: Object.freeze({ attivo: false, nome: 'h6_campanaro', celle: 7, w: 64, h: 80, pose: Object.freeze({
    cammina: 0, alzaCorda: 1, suona: 2, avvolge: 3, sferza: 4, prega: 5, tendeCorde: 1, risuona: 2, cambiaFase: 6 }) }),
});

/**
 * BOSS_H6 — numeri dell'IA. Una chiave <nome>Fase2 sostituisce <nome> sotto la soglia della fase 2.
 * Fase 1: RINTOCCO (alza la corda a due mani sopra il cappuccio → la tira giù: un anello di schegge con un
 * varco, e i rimorsi di pietra si svegliano) → FRUSTA (si avvolge la corda al braccio e la fa girare sopra la
 * testa, punta e si blocca → la sferza: una fila di colpi lungo la corda) → RINTOCCO → REQUIE (s'inginocchia:
 * la finestra). Fase 2: le campane cadono e restano sul sagrato; RISUONA: tende le braccia verso una campana,
 * che comincia a oscillare (la posa è della campana) e poi suona: un anello di schegge dalla campana.
 */
const BOSS_H6 = Object.freeze({
  sogliaFase2: 0.5,
  tettoProiettili: 28,
  bannerTick: 250,
  sequenza: Object.freeze(['rintocco', 'frusta', 'rintocco', 'requie']),
  sequenzaFase2: Object.freeze(['rintocco', 'risuona', 'frusta', 'risuona', 'requie']),
  moltVelFase2: 1.25,
  cammina: Object.freeze({ tick: 84, tickFase2: 60, passo: 0.7, distanzaPx: 128, giro: 0.55 }),
  rintocco: Object.freeze({ anticipoTick: 44, anticipoTickFase2: 36, suonaTick: 26, schegge: 14, scheggeFase2: 18, varco: 3, velocita: 1.8, velocitaFase2: 2.1 }),
  frusta: Object.freeze({ anticipoTick: 38, anticipoTickFase2: 32, bloccoTick: 10, colpi: 7, colpiFase2: 9, velMin: 1.8, velMax: 3.6, sferzaTick: 16 }),
  risuona: Object.freeze({ anticipoTick: 48, anticipoTickFase2: 42, suonaTick: 24, schegge: 10, velocita: 1.7 }),
  /** I rimorsi: a ogni rintocco del Campanaro si alza un penitente di pietra, fino a `massimi` vivi. */
  rimorsi: Object.freeze({ massimi: 1, massimiFase2: 2, hpBase: 10, hpPiano: 2, distanzaPx: 150 }),
  requieTick: 116, requieTickFase2: 88, dannoRequie: 1.25,
  cambioFaseTick: 64,
  /** Le campane che cadono nella fase 2: dove restano (ostacoli rotondi). */
  campane: Object.freeze({ posti: Object.freeze([[176, 136], [464, 136], [320, 262]]), raggio: 15, cadutaTick: 34, quota: 150 }),
  scala: SCALA_H6,
});

/**
 * STATI_H6 — tabella esplicita della macchina a stati (come STATI_B6 e STATI_D6):
 *   inizio  stato iniziale; mosse  mossa della sequenza → stato d'anticipo con cui comincia;
 *   stati   stato → { durata: chiave di BOSS_H6 (null = la calcola l'azione d'ingresso), poi: stato successivo
 *                     ('prossima' = la mossa successiva della sequenza) }.
 * 'cambiaFase' interrompe qualunque altro stato quando la vita scende sotto la soglia della fase 2.
 */
const STATI_H6 = Object.freeze({
  inizio: 'cammina',
  mosse: Object.freeze({ rintocco: 'alzaCorda', frusta: 'avvolge', risuona: 'tendeCorde', requie: 'prega' }),
  stati: Object.freeze({
    cammina: Object.freeze({ durata: 'cammina.tick', poi: 'prossima' }),
    alzaCorda: Object.freeze({ durata: 'rintocco.anticipoTick', poi: 'suona' }),   // anticipo: la corda alta a due mani
    suona: Object.freeze({ durata: 'rintocco.suonaTick', poi: 'cammina' }),        // la tira giù: anello di schegge
    avvolge: Object.freeze({ durata: 'frusta.anticipoTick', poi: 'sferza' }),      // anticipo: la corda gira sopra la testa
    sferza: Object.freeze({ durata: 'frusta.sferzaTick', poi: 'cammina' }),        // la fila di colpi lungo la corda
    tendeCorde: Object.freeze({ durata: 'risuona.anticipoTick', poi: 'risuona' }), // anticipo: una campana oscilla
    risuona: Object.freeze({ durata: 'risuona.suonaTick', poi: 'cammina' }),       // la campana suona
    prega: Object.freeze({ durata: 'requieTick', poi: 'cammina' }),                // finestra: in ginocchio
    cambiaFase: Object.freeze({ durata: 'cambioFaseTick', poi: 'cammina' }),       // le campane cadono
  }),
});

// Icona 12×12 del segno di completamento (stessa palette degli oggetti).
SPRITE_OGGETTI.segnoCampanaH6 = ['............', '.....k......', '....yyy.....', '...yyyyy....', '...yyyyy....', '...yyyyy....',
  '..yyyyyyy...', '.yyyyyyyyy..', '.....k......', '............', '............', '............'];

if (!POOL_BOSS.some((x) => x.id === SCHEDA_H6.id)) {
  POOL_BOSS.push({ id: SCHEDA_H6.id, nome: SCHEDA_H6.nome, tipo: SCHEDA_H6.tipo, hpBase: SCHEDA_H6.hpBase, speed: SCHEDA_H6.speed, pattern: SCHEDA_H6.pattern });
}
if (typeof SEGNI_A6 !== 'undefined' && Array.isArray(SEGNI_A6) && !Object.isFrozen(SEGNI_A6) && !SEGNI_A6.some((s) => s.boss === SCHEDA_H6.id)) {
  SEGNI_A6.push(Object.freeze({ boss: SCHEDA_H6.id, sprite: SCHEDA_H6.segno.sprite, nome: SCHEDA_H6.segno.nome }));
}

Object.assign(h6, { anime: [] });

/** Numero di BOSS_H6 dalla chiave ('a.b'); in fase 2 vince la chiave <chiave>Fase2 se esiste. */
function valoreH6(chiave, fase2) {
  const leggi = (k) => k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), BOSS_H6);
  const v2 = fase2 ? leggi(`${chiave}Fase2`) : undefined;
  return v2 !== undefined ? v2 : leggi(chiave);
}
const nomeCampanaroH6 = (n) => String(n.nome || '').replace(/\s*\(.*?\)/g, '');
const bossH6 = (st) => (st && st.nemici ? st.nemici.find((n) => n.boss && n.bossId === SCHEDA_H6.id) : null);

/** Veste il boss della stanza: il Campanaro al posto di quello di San Leucio; la scorta diventa rimorsi di pietra. */
function vestiBossH6(s, piano, moltCiclo, moltVel) {
  const b = s.nemici.find((n) => n.boss);
  const forzato = typeof b6 !== 'undefined' && b6 && b6.forzato;
  if (!b || forzato || pianoNelCicloH6(piano) === 4) return;
  const ciclo = Math.floor((piano - 1) / 4) + 1;
  b.bossId = SCHEDA_H6.id; b.tipo = SCHEDA_H6.tipo; b.pattern = SCHEDA_H6.pattern;
  b.nome = ciclo > 1 ? `${SCHEDA_H6.nome} (Ciclo ${ciclo})` : SCHEDA_H6.nome;
  b.maxHp = Math.round((SCHEDA_H6.hpBase + (pianoNelCicloH6(piano) - 1) * SCALA_H6.hpBossPerPiano) * moltCiclo);
  b.hp = b.maxHp;
  b.speed = SCHEDA_H6.speed * moltVel;
  b.r = SCHEDA_H6.raggio;
  const T = NEMICI_H6.penitente_pietra;
  for (const n of s.nemici) {
    if (n.boss) continue;
    n.tipo = 'penitente_pietra'; n.patternMob = n.tipo; n.comportamento = n.tipo; n.nome = T.nome;
    n.maxHp = Math.round((T.hpBase + (piano - 1) * T.hpPiano) * moltCiclo); n.hp = n.maxHp; n.speed = 0; n.velH6 = moltVel; n.r = T.raggio;
  }
}

/** Un colpo del Campanaro, col tetto e il nome per il Registro (a7). */
function sparaCampanaroH6(n, x, y, ang, vel, cosa = 'una scheggia') {
  if (statoRun.proiettiliNemici.length >= BOSS_H6.tettoProiettili) return false;
  statoRun.proiettiliNemici.push({ x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, dist: 0, bossShot: true, schegiaH6: true, fonteA7: `${cosa} del ${nomeCampanaroH6(n)}` });
  return true;
}

/** Un anello di schegge da (x, y) con un varco di `varco` colpi verso `angVarco` (null = nessun varco). */
function anelloH6(n, x, y, quante, vel, angVarco, varco, cosa) {
  for (let k = 0; k < quante; k++) {
    const a = (TAU * k) / quante + (n.giroAnelloH6 || 0);
    if (angVarco !== null) {
      let d = Math.abs(((a - angVarco) % TAU + TAU + Math.PI) % TAU - Math.PI);
      if (d < (Math.PI * varco) / quante) continue;
    }
    sparaCampanaroH6(n, x, y, a, vel, cosa);
  }
  n.giroAnelloH6 = (n.giroAnelloH6 || 0) + Math.PI / quante;
}

function entraStatoH6(n, stato, st) {
  const riga = STATI_H6.stati[stato];
  const f2 = Boolean(n.fase2H6);
  n.statoH6 = stato; n.tStatoH6 = 0;
  n.timerH6 = riga.durata ? Math.max(1, Math.round(valoreH6(riga.durata, f2))) : 1;
  n.durataH6 = n.timerH6;
  const az = AZIONI_H6.entra[stato];
  if (az) az(n, BOSS_H6, f2, st);
}

function prossimoStatoH6(n) {
  const riga = STATI_H6.stati[n.statoH6];
  if (riga.poi !== 'prossima') return riga.poi;
  const seq = n.fase2H6 ? BOSS_H6.sequenzaFase2 : BOSS_H6.sequenza;
  const mossa = seq[(n.indiceH6 || 0) % seq.length];
  n.indiceH6 = (n.indiceH6 || 0) + 1;
  return STATI_H6.mosse[mossa];
}

/** Un tick dell'IA del Campanaro. */
function iaCampanaroH6(n, st) {
  if (!st.cordaH6) st.cordaH6 = nuovaCordaH6(st);
  if (!n.statoH6) { n.fase2H6 = false; n.indiceH6 = 0; n.giroH6 = rng() < 0.5 ? -1 : 1; n.angH6 = 0; entraStatoH6(n, STATI_H6.inizio, st); }
  if (!n.fase2H6 && n.hp < n.maxHp * BOSS_H6.sogliaFase2) {
    n.fase2H6 = true; n.indiceH6 = 0; n.flash = 12;
    try { scuoti(FEEL.scossa.schiantoCapitano); } catch (_) { /* */ }
    entraStatoH6(n, 'cambiaFase', st);
  }
  const passo = AZIONI_H6.passo[n.statoH6];
  if (passo) passo(n, BOSS_H6, n.fase2H6, st);
  n.tStatoH6++;
  if (--n.timerH6 <= 0) entraStatoH6(n, prossimoStatoH6(n), st);
}

const AZIONI_H6 = {
  entra: {
    alzaCorda(n, C, f2, st) { if (st.cordaH6) Object.assign(st.cordaH6, { fase: 'posa', t: n.timerH6, durata: n.timerH6 }); },
    suona(n, C, f2, st) {
      const R = C.rintocco;
      anelloH6(n, n.x, n.y - 20, f2 ? R.scheggeFase2 : R.schegge, f2 ? R.velocitaFase2 : R.velocita, Math.atan2(player.y - n.y, player.x - n.x) + Math.PI * (rng() < 0.5 ? 0.5 : -0.5), R.varco, 'una scheggia');
      alzaRimorsoH6(n, st, C.rimorsi, f2);
      rintoccoH6(st, f2 ? 1.4 : 1.1);
      if (st.cordaH6) Object.assign(st.cordaH6, { fase: 'suona', t: RINTOCCHI_H6.suonaTick });
      for (const c of st.campaneH6 || []) c.oscilla = Math.max(c.oscilla || 0, 0.5);
      statoRun.ondeEsplosione.push({ x: n.x, y: n.y - 24, r: 6, maxR: 52, tick: 0, color: TINTE_H6.luna });
    },
    avvolge(n) { n.angH6 = Math.atan2(player.y - 6 - (n.y - 20), player.x - n.x); },
    sferza(n, C, f2) {
      const F = C.frusta, colpi = f2 ? F.colpiFase2 : F.colpi;
      for (let k = 0; k < colpi; k++) sparaCampanaroH6(n, n.x + Math.cos(n.angH6) * 14, n.y - 20 + Math.sin(n.angH6) * 10, n.angH6, F.velMin + (F.velMax - F.velMin) * (k / (colpi - 1)), 'la corda');
      try { scuoti(FEEL.scossa.colpo); } catch (_) { /* */ }
    },
    tendeCorde(n, C, f2, st) {
      const cs = st.campaneH6 || [];
      if (!cs.length) { n.timerH6 = 1; n.campanaH6 = -1; return; }
      // la campana più vicina al giocatore (la posa si legge da lei: comincia a oscillare)
      let i = 0, d = Infinity;
      cs.forEach((c, k) => { const dd = Math.hypot(player.x - c.x, player.y - c.y); if (dd < d) { d = dd; i = k; } });
      n.campanaH6 = i; cs[i].posa = n.timerH6; cs[i].posaDurata = n.timerH6;
    },
    risuona(n, C, f2, st) {
      const c = (st.campaneH6 || [])[n.campanaH6];
      if (!c) return;
      c.posa = 0; c.oscilla = 1;
      anelloH6(n, c.x, c.y - 10, C.risuona.schegge, C.risuona.velocita, null, 0, 'il rintocco di una campana');
      rintoccoH6(st, 1);
      statoRun.ondeEsplosione.push({ x: c.x, y: c.y - 10, r: 6, maxR: 44, tick: 0, color: TINTE_H6.oro });
    },
    cambiaFase(n, C, f2, st) {
      const K = C.campane;
      st.campaneH6 = K.posti.map(([x, y], k) => ({ x, y, z: K.quota + k * 30, vz: 0, oscilla: 0, posa: 0, caduta: false }));
      mostraBanner(TESTI_BOSS_H6.fase2, 180);
    },
  },
  passo: {
    cammina(n, C, f2) {
      const G = C.cammina;
      const ang = Math.atan2(player.y - n.y, player.x - n.x), dist = Math.hypot(player.x - n.x, player.y - n.y);
      const rad = limitaH6((dist - G.distanzaPx) / 40, -1, 1);
      const dx = Math.cos(ang) * rad + Math.cos(ang + n.giroH6 * Math.PI / 2) * G.giro;
      const dy = Math.sin(ang) * rad + Math.sin(ang + n.giroH6 * Math.PI / 2) * G.giro;
      const l = Math.hypot(dx, dy) || 1, v = n.speed * G.passo * (f2 ? C.moltVelFase2 : 1);
      if (muoviH6(n, (dx / l) * v, (dy / l) * v, 24) && n.tStatoH6 % 30 === 0) n.giroH6 = -n.giroH6;
    },
    avvolge(n, C) { if (n.timerH6 > C.frusta.bloccoTick) n.angH6 = Math.atan2(player.y - 6 - (n.y - 20), player.x - n.x); },
  },
};

/** Un rimorso: penitente di pietra che si alza lontano dal giocatore (stessi campi degli spawn del boss di base). */
function alzaRimorsoH6(n, st, M, f2) {
  const vivi = st.nemici.filter((x) => x.hp > 0 && x.tipo === 'penitente_pietra').length;
  if (vivi >= (f2 ? M.massimiFase2 : M.massimi)) return null;
  const T = NEMICI_H6.penitente_pietra;
  const a = Math.atan2(n.y - player.y, n.x - player.x) + (rng() - 0.5) * 1.4;
  const x = limitaH6(player.x + Math.cos(a) * M.distanzaPx, ARENA.x1 + 30, ARENA.x2 - 30);
  const y = limitaH6(player.y + Math.sin(a) * M.distanzaPx, ARENA.y1 + 30, ARENA.y2 - 30);
  const hp = Math.round(M.hpBase + (statoRun.piano - 1) * M.hpPiano);
  h6.rimorsi = (h6.rimorsi || 0) + 1;
  const r = { id: `rimorsoH6-${h6.rimorsi}`, tipo: 'penitente_pietra', patternMob: 'penitente_pietra', comportamento: 'penitente_pietra', nome: T.nome, x, y, vx: 0, vy: 0,
    r: T.raggio, hp, maxHp: hp, speed: 0, velH6: 1, shootCd: 999, boss: false, flash: 6, burnTicks: 0, stunTicks: 0,
    state: 'idle', stateTimer: 20, maskOpen: false, rimorsoH6: true };
  st.nemici.push(r);
  return r;
}

/** Le campane cadute: cadono, oscillano, tengono fuori giocatore e nemici, fermano i colpi del giocatore. */
function passoCampaneH6(st) {
  const cs = st.campaneH6;
  if (!cs) return;
  const K = BOSS_H6.campane;
  for (const c of cs) {
    if (c.z > 0) {
      c.vz += K.quota / (K.cadutaTick * K.cadutaTick) * 2; c.z = Math.max(0, c.z - c.vz);
      if (c.z === 0 && !c.caduta) { c.caduta = true; c.oscilla = 1; suonoCampanaH6(0.7, 0.07); try { scuoti(FEEL.scossa.colpo); } catch (_) { /* */ } }
      continue;
    }
    if (c.posa > 0) c.posa--;
    c.oscilla *= 0.97;
    const spingi = (o, r) => {
      const d = Math.hypot(o.x - c.x, o.y - c.y), min = K.raggio + r;
      if (d < min && d > 0.01) { o.x = c.x + ((o.x - c.x) / d) * min; o.y = c.y + ((o.y - c.y) / d) * min; }
    };
    spingi(player, 8);
    for (const n of st.nemici) if (n.hp > 0) spingi(n, n.r || 10);
    for (let i = statoRun.proiettili.length - 1; i >= 0; i--) {
      const p = statoRun.proiettili[i];
      if (Math.hypot(p.x - c.x, p.y - (c.y - 10)) < K.raggio) { statoRun.proiettili.splice(i, 1); c.oscilla = Math.max(c.oscilla, 0.3); }
    }
  }
}

/** Dopo il passo di base: l'IA del Campanaro nei tick in cui la base ha fatto agire il boss; le campane. */
function passoBossH6(st) {
  const b = bossH6(st);
  if (st.campaneH6 && !(b && b.hp > 0)) st.campaneH6 = null; // il boss è caduto: le campane tacciono e si tolgono
  passoCampaneH6(st);
  if (!b || b.hp <= 0 || (b.phaseTick || 0) === b.ptH6 || statoRun.hpHalf <= 0) return;
  try { iaCampanaroH6(b, st); } catch (err) { console.error('[h6] ia campanaro', err); }
}

/** In ginocchio (REQUIE) il Campanaro prende un poco di più: è la finestra. */
function dannoBossH6(n, dmg) {
  if (n.bossId === SCHEDA_H6.id && n.statoH6 === 'prega') return dmg * BOSS_H6.dannoRequie;
  return dmg;
}

/** Ingresso nella stanza del Campanaro: si presenta. */
function ingressoBossH6(stanza) {
  const b = stanza.tipo === 'boss' && !stanza.pulita ? bossH6(stanza) : null;
  if (b) mostraBanner(`💀 ${b.nome} (${b.hp} HP) — ${SCHEDA_H6.presentazione}`, BOSS_H6.bannerTick);
  if (b && b.avvisatoH6 && stanza.cordaH6) Object.assign(stanza.cordaH6, { fase: 'posa', t: RINTOCCHI_H6.posaTick, durata: RINTOCCHI_H6.posaTick }); // Taddeo l'ha avvisato
}

/**
 * Campanaro sconfitto: frase, anime che salgono (quelle di h2), e la rivelazione la prima volta nello slot
 * (ricordata nella memoria dello slot di h2, campo `campanaroH6`, fuori dalla tabella congelata di h2).
 */
function campanaroSconfittoH6(st, b) {
  if (b.liberatoH6) return;
  b.liberatoH6 = true;
  st.campaneH6 = null;
  mostraBanner(`${SCHEDA_H6.sconfitta} ${st.portaPattoAperta ? 'Porta del Patto d\'Ombra (😈) a destra · ' : ''}Botola aperta!`, BOSS_H6.bannerTick);
  if (typeof liberaAnimeH2 === 'function') { try { liberaAnimeH2(b); } catch (err) { console.error('[h6] anime', err); } }
  try {
    if (typeof memoriaH2 === 'function' && typeof scriviMemoriaH2 === 'function') {
      const m = memoriaH2();
      if (!m.campanaroH6) {
        m.campanaroH6 = typeof notteH2 === 'function' ? notteH2() : 1;
        scriviMemoriaH2(m);
        if (typeof didascaliaH2 === 'function') didascaliaH2(TESTI_BOSS_H6.rivelazione); else mostraBanner(TESTI_BOSS_H6.rivelazione, 300);
        h6.rivelazioneVista = true;
      }
    }
  } catch (err) { console.error('[h6] rivelazione', err); }
  if (typeof premioH6 === 'function') premioH6(st, b);
}

/** Chiamata alla stanza del boss appena ripulita (da verificaStanzaPulita di questo file). */
function dopoStanzaPulitaH6(st) {
  const b = st.nemici.find((n) => n.boss && n.bossId === SCHEDA_H6.id);
  if (b) campanaroSconfittoH6(st, b);
}

// --------------------------------------------------------------------------- disegno del Campanaro
/** Una campana a terra (o in caduta): bronzo scuro col filo d'oro, oscillazione e posa. */
function disegnaCampanaH6(c, tk) {
  const K = BOSS_H6.campane, T = TINTE_H6;
  let a = Math.sin(tk * 0.3) * 0.25 * (c.oscilla || 0);
  if (c.posa > 0) { const k = 1 - c.posa / (c.posaDurata || 1); a = Math.sin(tk * (0.25 + 0.3 * k)) * (0.1 + 0.4 * k); }
  if (c.z <= 0) ombraH6(c.x, c.y + 1, K.raggio, 4.5, 0.6);
  ctx.save(); ctx.translate(c.x, c.y - c.z); ctx.rotate(a);
  ctx.fillStyle = '#2a2018'; ctx.strokeStyle = T.bordo; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-12, -8, -9, -18); ctx.quadraticCurveTo(-7, -26, 0, -26); ctx.quadraticCurveTo(7, -26, 9, -18);
  ctx.quadraticCurveTo(12, -8, 14, 0); ctx.lineTo(15, 2); ctx.lineTo(-15, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = T.oro; ctx.globalAlpha = 0.7; ctx.fillRect(-12, -4, 24, 1.2); ctx.fillRect(-9, -18, 18, 0.9); ctx.globalAlpha = 1;
  ctx.fillStyle = T.ferro; ctx.fillRect(-3, -30, 6, 4);
  ctx.restore();
}

/** Il Campanaro: figura di pietra incappucciata, senza volto, la corda fra le mani. Posa per stato. */
function disegnaCampanaroH6(b, tk) {
  const T = TINTE_H6, st = statoRun.stanzaCorrente;
  const flash = b.flash > 0 && OPZIONI.lampi !== false;
  for (const c of (st && st.campaneH6) || []) if (c.y <= b.y) disegnaCampanaH6(c, tk);
  const s = b.statoH6 || 'cammina', k = b.durataH6 ? 1 - b.timerH6 / b.durataH6 : 0;
  ombraH6(b.x, b.y + 2, 22, 7);
  const F = SCHEDA_H6.foglio;
  if (F.attivo && typeof disegnaCellaTeatro === 'function'
    && disegnaCellaTeatro(ctx, F.nome, F.pose[s] || 0, F.celle, b.x - F.w / 2, b.y + 4 - F.h, F.w, F.h, flash ? '#ffffff' : null, flash ? 0.6 : 0)) {
    for (const c of (st && st.campaneH6) || []) if (c.y > b.y) disegnaCampanaH6(c, tk);
    return;
  }
  const prega = s === 'prega', basso = prega ? 12 : 0;
  const resp = Math.sin(tk * 0.05) * 0.8;
  ctx.save(); ctx.translate(Math.round(b.x), Math.round(b.y));
  // il manto di pietra, largo alla base
  ctx.fillStyle = flash ? T.lampo : '#5a5853'; ctx.strokeStyle = flash ? '#fff' : T.bordo; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-20, 2); ctx.quadraticCurveTo(-18, -26 + basso, -11, -44 + basso + resp); ctx.lineTo(11, -44 + basso + resp); ctx.quadraticCurveTo(18, -26 + basso, 20, 2);
  for (let i = 0; i < 5; i++) ctx.lineTo(16 - i * 8, 2 + (i % 2 ? 2 : 0));
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // le pieghe
  ctx.strokeStyle = 'rgba(20, 20, 24, 0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); for (const x of [-9, 0, 9]) { ctx.moveTo(x * 0.6, -36 + basso); ctx.lineTo(x, 0); } ctx.stroke();
  // il cappuccio a punta, e dentro il buio: nessun volto
  const hy = -44 + basso + resp + (s === 'cambiaFase' ? -3 : 0);
  ctx.fillStyle = flash ? T.lampo : '#4a4844'; ctx.strokeStyle = flash ? '#fff' : T.bordo; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(-12, hy + 4); ctx.quadraticCurveTo(-13, hy - 14, 0, hy - 26); ctx.quadraticCurveTo(13, hy - 14, 12, hy + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#030305'; ctx.beginPath(); ctx.ellipse(0, hy - 6, 6.5, 8.5, 0, 0, TAU); ctx.fill();
  if (b.fase2H6) { ctx.fillStyle = `rgba(249, 203, 64, ${(0.35 + 0.3 * Math.sin(tk * 0.2)).toFixed(2)})`; ctx.fillRect(-0.6, hy - 9, 1.2, 6); } // la crepa d'oro
  // braccia e corda, per posa
  const mano = (x, y) => { ctx.fillStyle = flash ? '#fff' : '#8c8a86'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); };
  const braccio = (x1, y1, x2, y2) => {
    ctx.strokeStyle = flash ? '#fff' : T.bordo; ctx.lineWidth = 6.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = flash ? T.lampo : '#55534f'; ctx.lineWidth = 4.8; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  const corda = (pts) => {
    ctx.strokeStyle = '#120f0c'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
    ctx.strokeStyle = '#8a6a3c'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
  };
  const sy = hy + 12;
  if (s === 'alzaCorda' || s === 'suona') {
    // anticipo: la corda alta a due mani sopra il cappuccio (più alta col passare della posa); suona: tirata giù
    const yM = s === 'alzaCorda' ? hy - 14 - 12 * k : sy + 6;
    braccio(-9, sy, -4, yM); braccio(9, sy, 4, yM);
    corda([[0, -b.y + 52], [0, yM], [2, yM + 14 + (s === 'suona' ? 14 : 4)]]);
    mano(-4, yM); mano(4, yM);
  } else if (s === 'avvolge' || s === 'sferza') {
    const a = b.angH6 || 0, ca = Math.cos(a), sa = Math.sin(a);
    if (s === 'avvolge') {
      const g = tk * (0.25 + 0.25 * k), r = 14 + 6 * k;
      braccio(8, sy, 8, hy - 10); mano(8, hy - 10);
      corda([[8, hy - 10], [8 + Math.cos(g) * r, hy - 14 + Math.sin(g) * r * 0.35]]);
      ctx.strokeStyle = 'rgba(138, 106, 60, 0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(8, hy - 14, r, r * 0.35, 0, 0, TAU); ctx.stroke();
      braccio(-9, sy, -12, sy + 14); mano(-12, sy + 14);
    } else {
      braccio(8, sy, 8 + ca * 16, sy + sa * 10); mano(8 + ca * 16, sy + sa * 10);
      corda([[8 + ca * 16, sy + sa * 10], [8 + ca * 60, sy + sa * 40 - 2], [8 + ca * 96, sy + sa * 64 + 3]]);
      braccio(-9, sy, -12, sy + 14); mano(-12, sy + 14);
    }
  } else if (s === 'tendeCorde' || s === 'risuona') {
    braccio(-9, sy, -24, sy - 4); braccio(9, sy, 24, sy - 4); mano(-24, sy - 4); mano(24, sy - 4);
    const c = ((st && st.campaneH6) || [])[b.campanaH6];
    if (c) corda([[c.x > b.x ? 24 : -24, sy - 4], [c.x - b.x, c.y - b.y - 26]]);
  } else if (prega) {
    braccio(-8, sy, -2, sy + 4); braccio(8, sy, 2, sy + 4); mano(0, sy + 4);
    corda([[0, sy + 4], [6, 2], [14, 3]]);
  } else {
    braccio(-9, sy, -6, sy + 12); braccio(9, sy, 6, sy + 12); mano(-5, sy + 12); mano(5, sy + 12);
    corda([[0, -b.y + 52], [0, sy + 12], [-2, 2]]);
  }
  ctx.restore();
  for (const c of (st && st.campaneH6) || []) if (c.y > b.y) disegnaCampanaH6(c, tk);
}

const disegnaBossPittoricoBaseH6 = disegnaBossPittorico;
/** Il Campanaro si disegna qui; gli altri boss restano alla base. Stessa firma: ([ctx], boss, tick). */
disegnaBossPittorico = function (...args) {
  const a = args[0] && typeof args[0].save === 'function' ? args.slice(1) : args;
  const b = a[0];
  if (!b || b.bossId !== SCHEDA_H6.id) return disegnaBossPittoricoBaseH6.apply(this, args);
  try { ctx.save(); ctx.imageSmoothingEnabled = true; disegnaCampanaroH6(b, a[1] || 0); ctx.restore(); } catch (err) { console.error('[h6] disegno campanaro', err); }
  return undefined;
};

Object.assign(window.__teatro.interni, { SCHEDA_H6, BOSS_H6, STATI_H6, TESTI_BOSS_H6 });
Object.defineProperties(window.__teatro.interni.casertavecchiaH6, Object.getOwnPropertyDescriptors({
  /** Il Campanaro della stanza corrente: stato dell'IA, fase, campane. */
  get boss() {
    const st = statoRun.stanzaCorrente, n = bossH6(st);
    if (!n) return null;
    return { bossId: n.bossId, nome: n.nome, stato: n.statoH6 || null, fase2: Boolean(n.fase2H6), hp: n.hp, maxHp: n.maxHp, x: n.x, y: n.y,
      campane: ((st.campaneH6) || []).map((c) => ({ x: c.x, y: c.y, z: c.z, posa: c.posa })), proiettili: statoRun.proiettiliNemici.length };
  },
  get rivelazioneVista() { try { return Boolean(memoriaH2().campanaroH6); } catch (_) { return false; } },
}));

// ===========================================================================
// 5. TADDEO SUL SAGRATO (bibbia: «potrebbe ricomparire per chiedere perdono o per completare il proprio
//    tradimento, a seconda delle scelte precedenti»), IL PREMIO DEL LUOGO, LA MUSICA
// ===========================================================================
/**
 * Taddeo compare nella stanza accanto a quella del boss (il sagrato), una volta ripulita, secondo il flag
 * `taddeo` dello slot (scritto da h1): perdonato → chiede perdono e lascia un aiuto; accusato → completa il
 * tradimento (il Campanaro è avvisato: più vita e la corda già in posa); nessun flag → una guardia di spalle
 * che non si volta. Giocando con Taddeo la scena non c'è. Ferruccio non parla.
 */
const SAGRATO_H6 = Object.freeze({
  posto: Object.freeze({ x: 452, y: 150 }), raggio: 44,
  aiuto: Object.freeze({ mezzeMaschere: 2, chiavi: 1 }),       // perdonato
  tradimento: Object.freeze({ moltVitaBoss: 1.2 }),           // accusato
  premio: Object.freeze({ x: 456, y: 104 }),                  // il dono del luogo, lontano da botola e porte
});

/** Testi del sagrato e del premio (DA APPROVARE DALL'AUTORE; tutti nuovi, nel tono di h1). */
const TESTI_SAGRATO_H6 = Object.freeze({
  perdonato: Object.freeze([
    ['Taddeo', 'Ferruccio. Sei salito fin quassù.'],
    ['Taddeo', 'A San Leucio mi hai lasciato andare. Non me lo meritavo, e lo sapevamo tutti e due.'],
    ['Taddeo', 'Queste campane suonano per le parole che uno non ha detto. Io una ce l\'ho in gola da vent\'anni: perdonami.'],
    ['', 'Ferruccio non risponde. Gli posa una mano sulla spalla.'],
    ['Taddeo', 'Il Campanaro è là dietro. Prendi questa, è della sagrestia. E tieni dritta la testa: io la mia l\'ho tenuta bassa troppo a lungo.'],
  ]),
  accusato: Object.freeze([
    ['Taddeo', 'Ancora tu.'],
    ['Taddeo', 'A San Leucio mi hai guardato come si guarda un traditore. E allora traditore sia.'],
    ['Taddeo', 'Il Campanaro sa che stai arrivando. Gliel\'ho detto io.'],
    ['', 'Taddeo tira la corda una volta sola, e se ne va per il vicolo senza voltarsi.'],
  ]),
  diSpalle: 'Una guardia, di spalle sul parapetto del sagrato, guarda giù verso la valle. Non si volta.',
  bannerAiuto: (m, c) => `Taddeo ti lascia ${m / 2} Maschera e ${c} chiave della sagrestia.`,
  bannerTradimento: 'Il Campanaro ti aspetta: la corda è già tesa.',
  premio: '★ IL DONO DELLE CAMPANE',
  bannerPremio: '· Dove pendeva la campana grande è rimasto un DONO DELLE CAMPANE.',
  diario: 'Al duomo il Campanaro ha lasciato andare la corda. Ho sentito il silenzio, dopo: pesava meno di tutte quelle parole.',
});

const flagH6 = () => (typeof flagH1 === 'function' ? flagH1() : {});
const apiDialogoH6 = () => (window.__teatro && window.__teatro.h1api) || null;

/** Prepara Taddeo sul sagrato nella mappa del piano (la stanza normale accanto a quella del boss). */
function preparaSagratoH6(m) {
  if (!m || statoRun.personaggioId === 'taddeo') return null;
  const boss = m.stanze.find((s) => s.tipo === 'boss');
  if (!boss) return null;
  const ids = Object.values(boss.porte || {});
  const st = m.stanze.find((s) => ids.includes(s.id) && s.tipo === 'normale') || m.stanze.find((s) => ids.includes(s.id) && s.tipo !== 'segreta');
  if (!st) return null;
  st.sagratoH6 = { visto: false };
  return st;
}

const generaMappaPianoSagratoH6 = generaMappaPiano;
/** Mappa di Casertavecchia: Taddeo sul sagrato. */
generaMappaPiano = function (piano, ...resto) {
  const m = generaMappaPianoSagratoH6.call(this, piano, ...resto);
  try {
    if (m && casertavecchiaAttivaH6(piano)) {
      for (const st of m.stanze) if (st.tipo !== 'boss') vestiStanzaH6(st, piano); // nemici aggiunti dopo popolaStanza (temi, stanze speciali)
      preparaSagratoH6(m);
    }
  } catch (err) { console.error('[h6] sagrato', err); }
  return m;
};

/** Quale scena: 'perdonato' | 'accusato' | 'spalle' (o null se Taddeo è giocato). */
function variaSagratoH6() {
  if (statoRun.personaggioId === 'taddeo') return null;
  const f = flagH6().taddeo;
  return f === 'perdonato' || f === 'accusato' ? f : 'spalle';
}

/** Taddeo è in scena nella stanza (ripulita)? */
function taddeoQuiH6(st = statoRun.stanzaCorrente) {
  return st && st.sagratoH6 && (st.pulita || !st.nemici.some((n) => n.hp > 0)) && casertavecchiaAttivaH6() && variaSagratoH6() ? st.sagratoH6 : null;
}

/** Apre la scena del sagrato (una volta per notte). Rende la variante, o null. */
function apriSagratoH6(st) {
  const S = st.sagratoH6, v = variaSagratoH6();
  if (!S || S.visto || !v) return null;
  S.visto = true; S.variante = v;
  if (v === 'spalle') { mostraBanner(TESTI_SAGRATO_H6.diSpalle, 260); return v; }
  const a = apiDialogoH6();
  const effetto = () => (v === 'perdonato' ? aiutoTaddeoH6() : tradimentoTaddeoH6());
  if (!a) { effetto(); return v; }
  a.apri(TESTI_SAGRATO_H6[v].map(([chi, t]) => a.voce(chi, t)), { poi: effetto });
  return v;
}

/** Perdonato: un aiuto concreto (Maschere e una chiave). */
function aiutoTaddeoH6() {
  const A = SAGRATO_H6.aiuto;
  statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + A.mezzeMaschere);
  if (typeof aggiungiChiavi === 'function') aggiungiChiavi(A.chiavi); else statoRun.chiavi = (statoRun.chiavi || 0) + A.chiavi;
  mostraBanner(TESTI_SAGRATO_H6.bannerAiuto(A.mezzeMaschere, A.chiavi), 200);
  statoRun.sagratoH6 = 'perdonato';
}

/** Accusato: il tradimento si compie (il Campanaro è avvisato: più vita, la corda già in posa). */
function tradimentoTaddeoH6() {
  const boss = statoRun.mappa && statoRun.mappa.stanze.find((s) => s.tipo === 'boss');
  const b = bossH6(boss);
  if (b && !b.avvisatoH6) {
    b.avvisatoH6 = true;
    b.maxHp = Math.round(b.maxHp * SAGRATO_H6.tradimento.moltVitaBoss); b.hp = b.maxHp;
  }
  suonoCampanaH6(0.9, 0.06);
  mostraBanner(TESTI_SAGRATO_H6.bannerTradimento, 200);
  statoRun.sagratoH6 = 'accusato';
}

/** Taddeo sul sagrato: la figura del personaggio (la stessa di h1), di spalle se non c'è flag. */
function disegnaTaddeoH6(st, tk) {
  const S = taddeoQuiH6(st);
  if (!S || (S.visto && S.variante === 'accusato') || typeof disegnaFerruccioPittorico !== 'function' || !PERSONAGGI_GIOCABILI.taddeo) return;
  const P = SAGRATO_H6.posto;
  const spalle = variaSagratoH6() === 'spalle';
  ombraH6(P.x, P.y + 10, 10, 3.4, 0.55);
  disegnaFerruccioPittorico(ctx, P.x, P.y, { scale: 1, tick: spalle ? 0 : tk, charInfo: PERSONAGGI_GIOCABILI.taddeo, flipX: spalle ? P.x < player.x : P.x > player.x, sinergie: {} });
  if (spalle) { ctx.fillStyle = 'rgba(8, 10, 22, 0.35)'; ctx.beginPath(); ctx.ellipse(P.x, P.y - 12, 11, 20, 0, 0, TAU); ctx.fill(); }
}

/** Il premio del luogo (al posto dell'ago): un oggetto forte garantito sul piedistallo, e la riga del Diario. */
function premioH6(st) {
  if (st.premioH6 || !casertavecchiaAttivaH6()) return false;
  const D = SAGRATO_H6.premio;
  st.premioH6 = true;
  let item = null;
  try { item = estraiOggettoForte(); } catch (err) { console.error('[h6] premio', err); }
  if (item) st.oggettoPiedistallo = { ...item, x: D.x, y: D.y, preso: false, forteGratis: true, premioH6: true };
  else { spawnaMonetaATerra(st, D.x - 10, D.y, 3); spawnaMonetaATerra(st, D.x + 10, D.y, 3); }
  try { if (typeof a7 === 'object' && a7 && a7.run) a7.run.premioH6 = true; } catch (_) { /* a7 assente */ }
  statoRun.premioH6 = true;
  mostraBanner(`${statoRun.banner || ''} ${TESTI_SAGRATO_H6.bannerPremio}`.trim(), 300);
  return true;
}

if (typeof componiPaginaB8 === 'function') {
  const componiPaginaPremioH6 = componiPaginaB8;
  /** Diario: la riga del Campanaro battuto. */
  componiPaginaB8 = function (v, ...resto) {
    const pagina = componiPaginaPremioH6.call(this, v, ...resto);
    try {
      if (v && v.premioH6 && pagina && Array.isArray(pagina.righe) && !pagina.righe.includes(TESTI_SAGRATO_H6.diario)) pagina.righe.push(TESTI_SAGRATO_H6.diario);
    } catch (err) { console.error('[h6] diario premio', err); }
    return pagina;
  };
}

const passoLogicoSagratoH6 = passoLogico;
/** Avvicinarsi a Taddeo apre la scena (una volta). */
passoLogico = function (...args) {
  const r = passoLogicoSagratoH6.apply(this, args);
  try {
    const st = statoRun.stanzaCorrente;
    const S = statoRun.fase === 'in_gioco' && !statoRun.siparioAttivo && !statoRun.pausa ? taddeoQuiH6(st) : null;
    if (S && !S.visto) {
      const P = SAGRATO_H6.posto;
      const aperto = window.__teatro.h1api && window.__teatro.h1api.aperto();
      if (!aperto && Math.hypot(player.x - P.x, player.y - P.y) < SAGRATO_H6.raggio) apriSagratoH6(st);
    }
  } catch (err) { console.error('[h6] sagrato passo', err); }
  return r;
};

const disegnaStanzaPixelArtSagratoH6 = disegnaStanzaPixelArt;
/** Dopo la stanza: Taddeo sul sagrato e il cartiglio del premio. */
disegnaStanzaPixelArt = function (tk, st, ...resto) {
  const r = disegnaStanzaPixelArtSagratoH6.call(this, tk, st, ...resto);
  try {
    if (st && st.sagratoH6) disegnaTaddeoH6(st, tk);
    if (st && st.premioH6 && st.oggettoPiedistallo && !st.oggettoPiedistallo.preso) {
      const o = st.oggettoPiedistallo;
      drawPillLabel(TESTI_SAGRATO_H6.premio, o.x, o.y + 60, 150, { size: 7.5, color: TINTE_H6.oro, border: QUARTIERE_H6.bordoPillola });
    }
  } catch (err) { console.error('[h6] sagrato disegno', err); }
  return r;
};

// --------------------------------------------------------------------------- la musica del luogo (a8)
/** Tema «casertavecchia» nel formato di MUSICA.temi (a8-musica.js): lento, organetto tenuto, rintocchi nel basso. */
const MUSICA_H6 = Object.freeze({
  id: 'casertavecchia',
  tema: {
    bpm: 50, radice: 59, scala: 'armonica', basso: 'X.....', organetto: 'tenuto', tamburello: null, volume: 0.9,
    accordi: ['i', 'iv', 'i', 'V', 'VI', 'iv', 'V', 'i'],
    melodia: ['0 - 2 3 - 2', '3 - 5 3 2 -', '0 - - 2 - -', '4 - 2 1 - -', '5 - 4 3 - 2', '3 - 2 0 - -', '1 - 2 4 - 2', '0 - - - - -'],
  },
});

/** Registra il tema e punta il piano 3 del ciclo sul tema giusto (Casertavecchia, o restituisce quello di prima). */
function intonaH6() {
  try {
    if (typeof MUSICA !== 'object' || !MUSICA || !MUSICA.temi || !MUSICA.temaPerPiano) return;
    if (!MUSICA.temi[MUSICA_H6.id] && !Object.isFrozen(MUSICA.temi)) MUSICA.temi[MUSICA_H6.id] = MUSICA_H6.tema;
    if (!MUSICA.temi[MUSICA_H6.id] || Object.isFrozen(MUSICA.temaPerPiano)) return;
    const k = CASERTAVECCHIA_H6.pianoLuogo;
    if (casertavecchiaAttivaH6()) {
      if (MUSICA.temaPerPiano[k] !== MUSICA_H6.id) { h6.temaPrima = MUSICA.temaPerPiano[k]; MUSICA.temaPerPiano[k] = MUSICA_H6.id; }
    } else if (MUSICA.temaPerPiano[k] === MUSICA_H6.id) MUSICA.temaPerPiano[k] = h6.temaPrima;
  } catch (_) { /* senza musica si gioca lo stesso */ }
}
intonaH6();

Object.assign(window.__teatro.interni, { SAGRATO_H6, TESTI_SAGRATO_H6, MUSICA_H6 });
Object.defineProperties(window.__teatro.interni.casertavecchiaH6, Object.getOwnPropertyDescriptors({
  /** Il sagrato della stanza corrente: { visto, variante } o null; e la variante che toccherebbe. */
  get sagrato() { const st = statoRun.stanzaCorrente; return st && st.sagratoH6 ? { ...st.sagratoH6, qui: Boolean(taddeoQuiH6(st)) } : null; },
  get variante() { return variaSagratoH6(); },
  apriSagrato: () => apriSagratoH6(statoRun.stanzaCorrente),
  get tema() { try { return MUSICA.temaPerPiano[CASERTAVECCHIA_H6.pianoLuogo]; } catch (_) { return null; } },
}));
