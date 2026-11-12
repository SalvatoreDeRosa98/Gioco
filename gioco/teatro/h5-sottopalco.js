/*
 * teatro/h5-sottopalco.js — (h5) IL SOTTOPALCO: il piano segreto sotto il tavolato del palcoscenico.
 *
 * Come si incontra: una volta per notte (per ogni ciclo della notte senza fine), mai al primo piano del ciclo, quando
 * una stanza normale con le botole di d5 (`st.botoleD5`) viene ripulita, con probabilità SOTTOPALCO_H5.probabilita
 * UNA botola resta socchiusa con un filo di luce che sale (`st.botolaH5`). Avvicinandosi: «[E] Calati sotto».
 *
 * Sotto: un piccolo piano a parte (statoRun.mappa sostituita da tre stanze in fila, la mappa di sopra messa da parte
 * in h5.sotto.mappaSopra): la minimappa mostra solo il Sottopalco, sopra non ne resta traccia. Buio (luceLuogoB2 →
 * LUCE_H5), luce solo dalle fessure del tavolato e dalla lanterna di Ferruccio. Nemici del luogo (IA nell'aggancio
 * iaNemicoD6), il contrappeso che dondola (pericolo dell'ambiente), in fondo il Macchinista (mezzo-boss).
 * Premio: una cassa con un oggetto (piedistallo del motore) e un pezzo di copione (TESTI_H5.copione, uno per
 * discesa). Una scala a pioli riporta nella stanza di partenza, ripulita e con le porte aperte.
 *
 * Slot: flag T4 `sottopalcoH5` (visto) e `sottopalcoDisceseH5` (quante discese: sceglie il pezzo di copione).
 * Istantanea di e6: e6 la scrive solo in avviaPiano, e sotto avviaPiano non si chiama: «Riprendi la notte» riparte
 * dal piano di sopra come era all'ingresso del piano.
 * Avvolge: verificaStanzaPulita, interagisciStanza, disegnaStanzaPixelArt, disegnaHUDPixelArt, passoLogico,
 * luceLuogoB2, iaNemicoD6, disegnaNemicoPittorico, disegnaBossPittorico, avviaPiano, nuovaRun.
 */
'use strict';

/** Valori di gioco del Sottopalco (tutti qui: si accordano senza toccare il codice). */
const SOTTOPALCO_H5 = Object.freeze({
  probabilita: 0.6,               // una stanza con le botole ripulita: probabilità che una resti socchiusa
  pianiNelCiclo: Object.freeze([2, 3, 4]), // piani del ciclo ammessi (mai il primo)
  raggioBotola: 30,               // px: distanza per «Calati sotto»
  raggioScala: 30,                // px: distanza per «Risali»
  scala: Object.freeze({ x: 500, y: 112 }), // la scala a pioli nell'ultima stanza
  cassa: Object.freeze({ x: 320, y: 150 }), // la cassa del premio nell'ultima stanza
  stanze: 3,
  luce: Object.freeze({
    buio: 0.86,                   // opacità del buio sopra la stanza
    lanterna: 96,                 // raggio della lanterna di Ferruccio
    lame: 4,                      // lame di luce dalle fessure del tavolato per stanza
    polvereOgniTick: 0.18,        // probabilità per tick che cada polvere in una lama
  }),
  copioneTick: 520,               // quanto resta a schermo il pezzo di copione
  // chi c'è in ogni stanza (l'ultima è del Macchinista): marionette scartate, gruppi di topi, contrappesi
  composizione: Object.freeze([
    Object.freeze({ marionette: 2, topi: 3, contrappesi: 0 }),
    Object.freeze({ marionette: 1, topi: 4, contrappesi: 1 }),
    Object.freeze({ marionette: 0, topi: 0, contrappesi: 0 }),
  ]),
  extraCiclo: Object.freeze({ marionette: 1, topi: 1 }), // dal ciclo 2 in su, per ciclo (con un tetto)
  extraMax: 2,
  scala_: Object.freeze({ moltCiclo: 1.45, hpPerPiano: 0.18, velPerPiano: 0.04, velMax: 1.5 }),
  contrappeso: Object.freeze({
    corda: 150,                   // lunghezza della corda (px)
    ampiezza: 0.62,               // radianti
    periodoTick: 200,             // un'andata e ritorno
    raggio: 13,                   // px: chi è sotto il peso quando passa basso
    quotaColpo: 16,               // sotto questa quota il peso colpisce
    danno: 1,                     // mezze maschere
  }),
});

/** I nemici del Sottopalco (valori di base al piano 1, ciclo 1). */
const NEMICI_H5 = Object.freeze({
  marionetta_h5: Object.freeze({ hp: 9, vel: 0.42, raggio: 10, rialzaFrazione: 0.5, giuTick: 80, rialzaTick: 24 }),
  topo_h5: Object.freeze({ hp: 3, vel: 2.2, raggio: 6, corsaTick: 26, sostaTick: 24, scarto: 0.7 }),
});

/** Luce del luogo per b2 (stessa forma di LUCE_D6): lume freddo e poco, ombre forti. */
const LUCE_H5 = Object.freeze({ lume: Object.freeze([196, 150, 92]), luce: 0.5, ombra: 1.35, vignetta: 1.6 });

/** Tutti i testi a schermo del Sottopalco (NUOVI: da far approvare all'autore). */
const TESTI_H5 = Object.freeze({
  luogo: 'Sottopalco',
  calati: '[E] Calati sotto',
  risali: '[E] Risali la scala',
  apri: '[E] Apri la cassa',
  entrata: 'IL SOTTOPALCO — sotto il tavolato, dove il teatro si regge.',
  ritorno: 'Di nuovo sul palco. La botola si richiude.',
  titoloCopione: 'Pezzo di copione — mai messo in scena',
  copione: Object.freeze([]),
  nomi: Object.freeze({ marionetta_h5: 'Marionetta scartata', topo_h5: 'Topo di cartapesta', contrappeso: 'il contrappeso' }),
});

// ===========================================================================
// STATO
// ===========================================================================
/** Stato del modulo: la discesa in corso (null sopra) e le notti in cui la botola è già comparsa. */
const h5 = { sotto: null, fatte: new Set(), copione: null, buioFessure: 0 };

/** Chiave «una volta per notte»: run e ciclo (la notte senza fine conta ogni ciclo). */
function chiaveNotteH5() { return `${statoRun.numeroRun || 0}:${statoRun.ciclo || 1}`; }
/** Piano nel ciclo 1..4. */
function pianoNelCicloH5(p = statoRun.piano) { return ((((p || 1) - 1) % 4) + 4) % 4 + 1; }
/** Vero se Ferruccio è nel Sottopalco. */
function sottoH5() { return Boolean(h5.sotto && statoRun.stanzaCorrente && statoRun.stanzaCorrente.sottopalcoH5); }
const flagH5 = () => { try { return (window.__teatro && window.__teatro.t4qa && window.__teatro.t4qa.flag) || {}; } catch (_) { return {}; } };
function impostaFlagH5(parz) { try { const q = window.__teatro && window.__teatro.t4qa; if (q) q.impostaFlag(parz); } catch (err) { console.warn('[h5] flag', err); } }

// ===========================================================================
// 1. LA BOTOLA SOCCHIUSA
// ===========================================================================
/**
 * Prova a lasciare socchiusa una botola della stanza appena ripulita.
 * @param {object} st stanza @param {boolean} [forza] salta probabilità e «una volta per notte» (QA)
 * @returns {boolean} vero se la botola è rimasta socchiusa
 */
function provaBotolaH5(st, forza = false) {
  if (!st || st.sottopalcoH5 || st.botolaH5 || st.tipo !== 'normale') return false;
  const lista = (typeof listaBotoleD5 === 'function') ? listaBotoleD5(st) : [];
  if (!lista.length) return false;
  if (!forza) {
    if (h5.fatte.has(chiaveNotteH5())) return false;
    if (SOTTOPALCO_H5.pianiNelCiclo.indexOf(pianoNelCicloH5()) < 0) return false;
    if (rng() >= SOTTOPALCO_H5.probabilita) return false;
  }
  const b = lista[Math.floor(rng() * lista.length) % lista.length];
  st.botolaH5 = { x: b.x, y: b.y, w: b.w, h: b.h, usata: false };
  h5.fatte.add(chiaveNotteH5());
  return true;
}

/** Vero se Ferruccio è abbastanza vicino al punto (x, y). */
function vicinoH5(x, y, r) { return Math.hypot(player.x - x, player.y - y) < r; }

// ===========================================================================
// 2. IL PICCOLO PIANO DI SOTTO
// ===========================================================================
/** Una stanza del Sottopalco (tipo 'normale' per il motore, marcata `sottopalcoH5`). */
function nuovaStanzaH5(i) {
  const s = {
    id: `h5-sotto-${i + 1}`, tipo: 'normale', cx: i + 1, cy: 1, porte: {}, muroSegreto: null,
    pulita: true, visitata: false, nemici: [], ostacoli: [], oggettiATerra: [], oggettoPiedistallo: null,
    ricompensaOggetto: null, slotFucina: [], slotPatto: [], uscitaAperta: false, portaPattoAperta: false,
    sottopalcoH5: { indice: i, ultima: i === SOTTOPALCO_H5.stanze - 1, lame: lameH5(i), polvere: [], cadute: [], pesi: [] },
    nomeLuogoHud: TESTI_H5.luogo,
  };
  popolaStanzaH5(s, i);
  return s;
}

/** Moltiplicatori di vita e passo per piano e ciclo (stessa forma di popolaStanza). */
function scalaH5() {
  const K = SOTTOPALCO_H5.scala_, piano = statoRun.piano || 1, ciclo = statoRun.ciclo || 1;
  return { hp: Math.pow(K.moltCiclo, ciclo - 1) * (1 + (piano - 1) * K.hpPerPiano), vel: Math.min(K.velMax, 1 + (piano - 1) * K.velPerPiano) };
}

/** Un nemico del Sottopalco (stessi campi dei nemici del motore; IA e disegno in questo file). */
function nuovoNemicoH5(tipo, x, y, id) {
  const T = NEMICI_H5[tipo], K = scalaH5(), hp = Math.max(1, Math.round(T.hp * K.hp));
  return {
    id, tipo, patternMob: tipo, nome: TESTI_H5.nomi[tipo], boss: false, mobSoldi: false, champion: null,
    x, y, hp, maxHp: hp, speed: T.vel * K.vel, r: T.raggio, flash: 0, burnTicks: 0, stunTicks: 0,
    state: 'idle', stateTimer: 20, maskOpen: false, shootCd: 9999, senzaFili: true, statoH5: 'avvio', tH5: Math.floor(rng() * 20), faseH5: rng() * 6,
  };
}

/** Mette nemici e contrappesi in una stanza del Sottopalco (l'ultima è del Macchinista). */
function popolaStanzaH5(s, i) {
  const C = SOTTOPALCO_H5.composizione[i] || SOTTOPALCO_H5.composizione[0];
  const extra = Math.min(SOTTOPALCO_H5.extraMax, Math.max(0, (statoRun.ciclo || 1) - 1));
  const nm = C.marionette ? C.marionette + extra * SOTTOPALCO_H5.extraCiclo.marionette : 0;
  const nt = C.topi ? C.topi + extra * SOTTOPALCO_H5.extraCiclo.topi : 0;
  for (let k = 0; k < nm; k++) s.nemici.push(nuovoNemicoH5('marionetta_h5', 250 + k * 120 + rng() * 30, 130 + ((k * 70) % 140), `${s.id}-m${k}`));
  const gx = 380 + rng() * 80, gy = 200 + rng() * 50;
  for (let k = 0; k < nt; k++) s.nemici.push(nuovoNemicoH5('topo_h5', gx + (k % 2) * 14, gy + Math.floor(k / 2) * 12, `${s.id}-t${k}`));
  const CP = SOTTOPALCO_H5.contrappeso;
  for (let k = 0; k < C.contrappesi; k++) s.sottopalcoH5.pesi.push({ x: 300 + k * 90, y: 176 + k * 50, fase: rng() * TAU, periodo: CP.periodoTick * (0.9 + rng() * 0.2), quota: 99, dx: 0 });
  if (s.nemici.length) s.pulita = false;
}

/** Lame di luce fisse di una stanza (da fessure del tavolato: posizioni deterministiche per indice). */
function lameH5(i) {
  const out = [], n = SOTTOPALCO_H5.luce.lame;
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n;
    out.push({ x: ARENA.x1 + 40 + u * (ARENA.x2 - ARENA.x1 - 80) + ((i * 37 + k * 53) % 41) - 20, larga: 10 + ((i * 7 + k * 11) % 9) });
  }
  return out;
}

/** Costruisce le stanze del Sottopalco in fila (W→E) e la mappa del piccolo piano. */
function creaSottopalcoH5() {
  const stanze = [];
  for (let i = 0; i < SOTTOPALCO_H5.stanze; i++) stanze.push(nuovaStanzaH5(i));
  for (let i = 0; i + 1 < stanze.length; i++) { stanze[i].porte.E = stanze[i + 1].id; stanze[i + 1].porte.W = stanze[i].id; }
  return { piano: statoRun.piano, stanze, perId: new Map(stanze.map((s) => [s.id, s])), sottopalcoH5: true };
}

/** [E] sulla botola socchiusa: Ferruccio scende. @returns {boolean} */
function scendiH5() {
  const st = statoRun.stanzaCorrente;
  if (!st || !st.botolaH5 || st.botolaH5.usata || h5.sotto) return false;
  const mappa = creaSottopalcoH5();
  h5.sotto = { mappaSopra: statoRun.mappa, stanzaSopra: st, mappa, discesa: (Number(flagH5().sottopalcoDisceseH5) || 0) };
  st.botolaH5.usata = true;
  statoRun.mappa = mappa;
  entraInStanza(mappa.stanze[0], 'W');
  impostaFlagH5({ sottopalcoH5: true, sottopalcoDisceseH5: h5.sotto.discesa + 1 });
  try { mostraBanner(TESTI_H5.entrata, 200); } catch (_) { /* niente */ }
  suonoH5('scendi');
  return true;
}

/** [E] sulla scala a pioli: si torna nella stanza di partenza, ripulita e con le porte aperte. @returns {boolean} */
function risaliH5() {
  const S = h5.sotto;
  if (!S) return false;
  statoRun.mappa = S.mappaSopra;
  h5.sotto = null;
  h5.buioFessure = 0;
  const st = S.stanzaSopra;
  st.pulita = true;
  entraInStanza(st, null);
  const b = st.botolaH5;
  if (b) { player.x = b.x; player.y = Math.min(ARENA.y2 - 14, b.y + b.h / 2 + 16); }
  try { mostraBanner(TESTI_H5.ritorno, 160); } catch (_) { /* niente */ }
  suonoH5('risali');
  return true;
}

/** Vero se la scala dell'ultima stanza è disponibile (stanza ripulita). */
function scalaProntaH5(st = statoRun.stanzaCorrente) { return Boolean(st && st.sottopalcoH5 && st.sottopalcoH5.ultima && st.pulita); }

// ===========================================================================
// 3. SUONI (Web Audio procedurale)
// ===========================================================================
/** Piccoli suoni del luogo: legno, corda, sacco. */
function suonoH5(nome) {
  try {
    const A = AudioSys, c = A && A.ctx;
    if (!c || !A.uscita) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    const f = { scendi: [180, 70, 0.5], risali: [90, 200, 0.4], tonfo: [70, 40, 0.35], leva: [260, 140, 0.2], corda: [420, 300, 0.25] }[nome] || [200, 100, 0.2];
    o.type = 'triangle'; o.frequency.setValueAtTime(f[0], t); o.frequency.exponentialRampToValueAtTime(f[1], t + f[2]);
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + f[2]);
    o.connect(g); g.connect(A.uscita); o.start(t); o.stop(t + f[2] + 0.02);
  } catch (_) { /* audio assente */ }
}

// ===========================================================================
// 4. DISEGNO
// ===========================================================================
const teleH5 = { fondo: new Map(), buio: null, alone: null };

/** Alone radiale bianco (tela fuori schermo) per bucare il buio. */
function aloneH5() {
  if (teleH5.alone) return teleH5.alone;
  const t = document.createElement('canvas'); t.width = t.height = 128;
  const g = t.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  teleH5.alone = t;
  return t;
}

/** Fondo di una stanza del Sottopalco (tela fuori schermo: non cambia). */
function fondoH5(i) {
  if (teleH5.fondo.has(i)) return teleH5.fondo.get(i);
  const t = document.createElement('canvas'); t.width = W; t.height = H;
  const g = t.getContext('2d');
  const x1 = ARENA.x1, y1 = ARENA.y1, x2 = ARENA.x2, y2 = ARENA.y2;
  // terra battuta e assi vecchie
  g.fillStyle = '#17110c'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a1e14'; g.fillRect(x1, y1, x2 - x1, y2 - y1);
  g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 1;
  for (let y = y1 + 14; y < y2; y += 14) { g.beginPath(); g.moveTo(x1, y); g.lineTo(x2, y); g.stroke(); }
  for (let k = 0; k < 60; k++) { const x = x1 + ((k * 97 + i * 31) % (x2 - x1)), y = y1 + ((k * 53 + i * 17) % (y2 - y1)); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y, 6, 1); }
  // muro in fondo: mattoni e travi del tavolato sopra
  g.fillStyle = '#0d0907'; g.fillRect(x1, y1 - 40, x2 - x1, 40);
  for (let x = x1; x < x2; x += 48) { g.fillStyle = '#3a2817'; g.fillRect(x, y1 - 40, 10, 40); g.strokeStyle = '#c99a52'; g.globalAlpha = 0.35; g.strokeRect(x + 0.5, y1 - 39.5, 9, 39); g.globalAlpha = 1; }
  g.fillStyle = '#3a2817'; g.fillRect(x1 - 8, y1 - 46, x2 - x1 + 16, 8); // trave maestra
  const oro = (a) => { g.strokeStyle = '#d9a456'; g.globalAlpha = a; g.lineWidth = 1; };
  // l'argano: un tamburo con la manovella e la corda che sale nel tavolato
  const ax = i === 1 ? x2 - 90 : x1 + 70;
  g.fillStyle = '#0a0705'; g.fillRect(ax - 22, y1 - 30, 44, 26); g.beginPath(); g.ellipse(ax, y1 - 17, 14, 12, 0, 0, TAU); g.fill();
  oro(0.6); g.beginPath(); g.ellipse(ax, y1 - 17, 14, 12, 0, 0, TAU); g.stroke();
  for (let k = -10; k <= 10; k += 4) { g.beginPath(); g.moveTo(ax + k, y1 - 28); g.lineTo(ax + k, y1 - 6); g.stroke(); }
  g.beginPath(); g.moveTo(ax + 14, y1 - 17); g.lineTo(ax + 24, y1 - 24); g.stroke();
  g.beginPath(); g.moveTo(ax, y1 - 29); g.lineTo(ax + 2, y1 - 46); g.stroke(); g.globalAlpha = 1;
  // contrappesi a riposo lungo il muro
  for (let k = 0; k < 3; k++) {
    const cx = x1 + 170 + k * 26 + i * 40;
    oro(0.45); g.beginPath(); g.moveTo(cx, y1 - 46); g.lineTo(cx, y1 - 22 + k * 4); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = '#0a0705'; g.fillRect(cx - 6, y1 - 22 + k * 4, 12, 14); oro(0.5); g.strokeRect(cx - 5.5, y1 - 21.5 + k * 4, 11, 13); g.globalAlpha = 1;
  }
  // quinte smontate appoggiate ai muri laterali (alberi e un cielo sbiaditi, rovescio in tela grezza)
  for (const [qx, qw, dip] of [[x1 + 2, 34, i % 2], [x2 - 40, 38, 1 - (i % 2)]]) {
    g.fillStyle = dip ? '#3c3324' : '#2c2519'; g.fillRect(qx, y1 + 10, qw, 120);
    if (dip) { g.fillStyle = 'rgba(60,90,70,0.35)'; g.beginPath(); g.arc(qx + qw / 2, y1 + 50, qw * 0.45, 0, TAU); g.fill(); g.fillRect(qx + qw / 2 - 2, y1 + 50, 4, 60); }
    else { g.strokeStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.moveTo(qx, y1 + 10); g.lineTo(qx + qw, y1 + 130); g.moveTo(qx + qw, y1 + 10); g.lineTo(qx, y1 + 130); g.stroke(); }
    oro(0.35); g.strokeRect(qx + 0.5, y1 + 10.5, qw - 1, 119); g.globalAlpha = 1;
  }
  // casse di marionette scartate (un braccio di legno che spunta)
  const casse = [[x1 + 60, y2 - 40], [x2 - 110, y2 - 34], [x1 + 210 + i * 30, y1 + 22]];
  for (const [cx, cy] of casse.slice(0, i === 2 ? 2 : 3)) {
    g.fillStyle = '#1c130c'; g.fillRect(cx, cy, 36, 22); g.fillStyle = '#120c08'; g.fillRect(cx, cy, 36, 5);
    oro(0.45); g.strokeRect(cx + 0.5, cy + 0.5, 35, 21); g.beginPath(); g.moveTo(cx, cy + 22); g.lineTo(cx + 36, cy + 5); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = '#0b0806'; g.save(); g.translate(cx + 26, cy + 2); g.rotate(-0.7); g.fillRect(0, -2, 16, 3); g.beginPath(); g.arc(17, -0.5, 2.5, 0, TAU); g.fill(); g.restore();
  }
  // puntelli: travi verticali che reggono il tavolato
  for (const px of [x1 + 130, x2 - 150]) {
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(px - 4, y2 - 70, 14, 4);
    g.fillStyle = '#24180f'; g.fillRect(px - 5, y1 - 40, 10, y2 - y1 - 30);
    oro(0.3); g.strokeRect(px - 4.5, y1 - 39.5, 9, y2 - y1 - 31); g.globalAlpha = 1;
    g.fillStyle = '#24180f'; g.beginPath(); g.moveTo(px - 5, y1 - 30); g.lineTo(px - 30, y1 - 40); g.lineTo(px - 24, y1 - 40); g.lineTo(px - 5, y1 - 22); g.fill(); // saetta
  }
  teleH5.fondo.set(i, t);
  return t;
}

/** Il filo di luce che sale dalla botola socchiusa e la botola stessa (sopra il pavimento di sopra). */
function disegnaBotolaSocchiusaH5(st, tk) {
  const b = st.botolaH5;
  if (!b || b.usata) return;
  if (typeof disegnaBotolaD5 === 'function') disegnaBotolaD5(b.x, b.y, b.w, b.h, 0.14, 0, tk);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pulsa = 0.55 + 0.25 * Math.sin(tk * 0.08);
  ctx.globalAlpha = pulsa;
  ctx.fillStyle = 'rgba(255,214,140,0.8)';
  ctx.fillRect(b.x - 1, b.y - b.h / 2, 2, b.h);
  ctx.globalAlpha = 0.35 * pulsa;
  ctx.drawImage(aloneH5(), b.x - 18, b.y - 30, 36, 40);
  for (let i = 0; i < 4; i++) { // granelli che salgono nel filo di luce
    const f = ((tk * 0.6 + i * 9) % 30) / 30;
    ctx.globalAlpha = 0.6 * (1 - f);
    ctx.fillRect(b.x - 2 + ((i * 3) % 5), b.y - f * 28, 1.2, 1.2);
  }
  ctx.restore();
}

/** L'ambientazione della stanza del Sottopalco (sul pavimento, sotto le figure). */
function disegnaStanzaSottoH5(st, tk) {
  const S = st.sottopalcoH5;
  ctx.drawImage(fondoH5(S.indice), 0, 0);
  // lame di luce dalle fessure (sul pavimento)
  const forza = h5.buioFessure > 0 ? 0 : 1;
  if (forza > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const l of S.lame) {
      ctx.globalAlpha = 0.16 + 0.04 * Math.sin(tk * 0.05 + l.x);
      ctx.fillStyle = '#ffcf86';
      ctx.beginPath();
      ctx.moveTo(l.x - 2, ARENA.y1 - 38); ctx.lineTo(l.x + 2, ARENA.y1 - 38);
      ctx.lineTo(l.x + l.larga + 18, ARENA.y2); ctx.lineTo(l.x + 18, ARENA.y2);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  disegnaPorteH5(st);
  disegnaCaduteEPesiH5(st, tk);
  if (S.ultima) disegnaScalaH5(tk, scalaProntaH5(st));
}

/** La scala a pioli che risale al palco (accostata al muro dell'ultima stanza). */
function disegnaScalaH5(tk, pronta) {
  const { x, y } = SOTTOPALCO_H5.scala;
  ctx.save();
  ctx.globalAlpha = pronta ? 1 : 0.45;
  ctx.strokeStyle = '#120c08'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x - 9, y + 10); ctx.lineTo(x - 7, y - 70); ctx.moveTo(x + 9, y + 10); ctx.lineTo(x + 7, y - 70); ctx.stroke();
  for (let k = 0; k < 7; k++) { const yy = y + 4 - k * 11; ctx.beginPath(); ctx.moveTo(x - 8, yy); ctx.lineTo(x + 8, yy); ctx.stroke(); }
  ctx.strokeStyle = '#d9a456'; ctx.lineWidth = 1; ctx.globalAlpha *= 0.7;
  ctx.beginPath(); ctx.moveTo(x - 10.5, y + 10); ctx.lineTo(x - 8.5, y - 70); ctx.moveTo(x + 10.5, y + 10); ctx.lineTo(x + 8.5, y - 70); ctx.stroke();
  if (pronta) { // la luce del palco che scende dall'alto della scala
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.4 + 0.1 * Math.sin(tk * 0.07);
    ctx.drawImage(aloneH5(), x - 26, y - 96, 52, 46);
  }
  ctx.restore();
}

/** Il buio sopra tutto (tela fuori schermo bucata dalla lanterna e dalle lame). */
function disegnaBuioH5(st, tk) {
  const L = SOTTOPALCO_H5.luce;
  let t = teleH5.buio;
  if (!t) { t = teleH5.buio = document.createElement('canvas'); t.width = W; t.height = H; }
  const g = t.getContext('2d');
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.clearRect(0, 0, W, H);
  g.fillStyle = `rgba(3,2,4,${h5.buioFessure > 0 ? Math.min(0.96, L.buio + 0.08) : L.buio})`;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'destination-out';
  const r = L.lanterna * (1 + 0.03 * Math.sin(tk * 0.21));
  g.globalAlpha = 0.95; g.drawImage(aloneH5(), player.x - r, player.y - 8 - r, r * 2, r * 2);
  if (h5.buioFessure <= 0) {
    g.globalAlpha = 0.6;
    for (const l of st.sottopalcoH5.lame) {
      g.beginPath();
      g.moveTo(l.x - 3, ARENA.y1 - 40); g.lineTo(l.x + 3, ARENA.y1 - 40);
      g.lineTo(l.x + l.larga + 20, ARENA.y2); g.lineTo(l.x + 16, ARENA.y2);
      g.closePath(); g.fill();
    }
    if (st.sottopalcoH5.ultima && st.pulita) { g.globalAlpha = 0.8; const { x, y } = SOTTOPALCO_H5.scala; g.drawImage(aloneH5(), x - 50, y - 100, 100, 120); }
  }
  ctx.drawImage(t, 0, 0);
  // la polvere che cade nelle lame quando sopra qualcuno cammina
  const P = st.sottopalcoH5.polvere;
  ctx.save(); ctx.fillStyle = '#e8d2a4';
  for (const p of P) { ctx.globalAlpha = Math.max(0, 0.7 * (1 - p.t / p.vita)); ctx.fillRect(p.x, p.y, 1.4, 1.4); }
  ctx.restore();
}

/** Etichette [E] del luogo (sopra: la botola; sotto: la scala). */
function disegnaEtichetteH5(st) {
  let testo = null, x = 0, y = 0;
  if (st.botolaH5 && !st.botolaH5.usata && st.pulita && vicinoH5(st.botolaH5.x, st.botolaH5.y, SOTTOPALCO_H5.raggioBotola)) { testo = TESTI_H5.calati; x = st.botolaH5.x; y = st.botolaH5.y - 22; }
  else if (scalaProntaH5(st) && vicinoH5(SOTTOPALCO_H5.scala.x, SOTTOPALCO_H5.scala.y, SOTTOPALCO_H5.raggioScala)) { testo = TESTI_H5.risali; x = SOTTOPALCO_H5.scala.x; y = SOTTOPALCO_H5.scala.y - 84; }
  if (!testo) return;
  if (typeof drawPillLabel === 'function') drawPillLabel(testo, x, y, 150);
  else drawTextFit(testo, x, y, 150, { size: 8, color: '#f9cb40' });
}

/** Un passo della polvere che cade (solo sotto). */
function passoPolvereH5(st) {
  const S = st.sottopalcoH5;
  if (h5.buioFessure <= 0 && rng() < SOTTOPALCO_H5.luce.polvereOgniTick) {
    const l = S.lame[Math.floor(rng() * S.lame.length)];
    S.polvere.push({ x: l.x + rng() * l.larga, y: ARENA.y1 - 30, vy: 0.4 + rng() * 0.5, t: 0, vita: 120 + Math.floor(rng() * 60) });
  }
  for (let i = S.polvere.length - 1; i >= 0; i--) {
    const p = S.polvere[i]; p.t++; p.y += p.vy; p.x += 0.12;
    if (p.t >= p.vita || p.y > ARENA.y2) S.polvere.splice(i, 1);
  }
}

// ===========================================================================
// 5. I NEMICI DEL SOTTOPALCO
// ===========================================================================
const dentroH5 = (n) => { n.x = Math.max(ARENA.x1 + 10, Math.min(ARENA.x2 - 10, n.x)); n.y = Math.max(ARENA.y1 + 10, Math.min(ARENA.y2 - 10, n.y)); };

/** IA per tipo (chiamata dall'aggancio iaNemicoD6): vero se il nemico è del Sottopalco. */
const IA_H5 = {
  /** MARIONETTA SCARTATA: senza fili, striscia a scatti verso Ferruccio; caduta, si rialza una volta (vedi caduteH5). */
  marionetta_h5(n, st, ang) {
    const T = NEMICI_H5.marionetta_h5;
    n.tH5 = (n.tH5 || 0) + 1;
    if (n.statoH5 === 'rialza') { if (n.tH5 >= T.rialzaTick) { n.statoH5 = 'striscia'; n.tH5 = 0; } return; }
    n.statoH5 = 'striscia';
    const spinta = 0.45 + 0.55 * Math.max(0, Math.sin(n.tH5 * 0.09 + n.faseH5)); // trascina il busto, poi si ferma
    n.x += Math.cos(ang) * n.speed * spinta * (n.rialzataH5 ? 1.25 : 1);
    n.y += Math.sin(ang) * n.speed * spinta * (n.rialzataH5 ? 1.25 : 1);
    n.angH5 = ang;
    dentroH5(n);
  },
  /** TOPO DI CARTAPESTA: corre dritto dove ha puntato, poi si ferma e annusa; a gruppi. */
  topo_h5(n, st, ang) {
    const T = NEMICI_H5.topo_h5;
    n.tH5 = (n.tH5 || 0) + 1;
    if (n.statoH5 !== 'corre' && n.statoH5 !== 'sosta') { n.statoH5 = 'sosta'; }
    if (n.statoH5 === 'sosta') {
      if (n.tH5 >= T.sostaTick) { n.statoH5 = 'corre'; n.tH5 = 0; n.angH5 = ang + (rng() - 0.5) * T.scarto; }
      return;
    }
    n.x += Math.cos(n.angH5) * n.speed; n.y += Math.sin(n.angH5) * n.speed;
    const prima = { x: n.x, y: n.y };
    dentroH5(n);
    if (n.tH5 >= T.corsaTick || prima.x !== n.x || prima.y !== n.y) { n.statoH5 = 'sosta'; n.tH5 = 0; }
  },
};

/** Le marionette cadute la prima volta restano a terra e poi si rialzano (una sola volta). */
function caduteH5(st) {
  const S = st.sottopalcoH5, T = NEMICI_H5.marionetta_h5;
  for (const n of st.nemici) {
    if (n.tipo === 'marionetta_h5' && n.hp <= 0 && !n.rialzataH5 && !S.cadute.some((c) => c.n === n)) S.cadute.push({ n, t: 0, x: n.x, y: n.y });
  }
  for (let i = S.cadute.length - 1; i >= 0; i--) {
    const c = S.cadute[i];
    if (++c.t < T.giuTick) continue;
    c.n.hp = Math.max(1, Math.ceil(c.n.maxHp * T.rialzaFrazione));
    c.n.rialzataH5 = true; c.n.statoH5 = 'rialza'; c.n.tH5 = 0; c.n.x = c.x; c.n.y = c.y; c.n.flash = 0;
    S.cadute.splice(i, 1);
    suonoH5('legno');
  }
}

/** Il contrappeso che dondola: si legge dalla corda; colpisce chi sta sotto quando passa basso. */
function passoPesiH5(st) {
  const CP = SOTTOPALCO_H5.contrappeso;
  for (const w of st.sottopalcoH5.pesi) {
    const th = CP.ampiezza * Math.sin(tick * TAU / w.periodo + w.fase);
    w.dx = CP.corda * Math.sin(th);
    w.quota = CP.corda * (1 - Math.cos(th)) * 1.6 + 4; // in alto ai due capi, basso al centro
    const xw = w.x + w.dx;
    if (w.quota < CP.quotaColpo && player.invuln <= 0 && statoRun.hpHalf > 0 && Math.abs(player.x - xw) < CP.raggio && Math.abs(player.y - w.y) < CP.raggio) {
      subisciColpoGiocatore(CP.danno, TESTI_H5.nomi.contrappeso, xw, w.y);
    }
    const prima = w.prima || 0, ora = Math.sign(Math.cos(tick * TAU / w.periodo + w.fase));
    if (prima && ora !== prima) suonoH5('corda');
    w.prima = ora;
  }
}

/** Contorno color lanterna e sagoma: aiuto comune ai disegni. */
function sagomaH5(fn, flash) {
  ctx.fillStyle = flash ? '#fff4dc' : '#0b0806';
  ctx.strokeStyle = '#d9a456'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
  ctx.beginPath(); fn(); ctx.fill(); ctx.globalAlpha *= 0.85; ctx.stroke(); ctx.globalAlpha = 1;
}

/** Disegni dei nemici (sostituibili da PNG con getSpriteTeatro/disegnaCellaTeatro, chiave = tipo). */
const DISEGNI_H5 = {
  marionetta_h5(n, tk, flash) {
    if (pngH5(n.tipo, n.statoH5 === 'rialza' ? 1 : 0, n.x, n.y, 34)) return;
    const sv = Math.sin((n.tH5 || 0) * 0.09 + (n.faseH5 || 0));
    const rialza = n.statoH5 === 'rialza' ? Math.min(1, (n.tH5 || 0) / NEMICI_H5.marionetta_h5.rialzaTick) : 1;
    ctx.save(); ctx.translate(n.x, n.y);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 3, 13, 4, 0, 0, TAU); ctx.fill();
    const dir = Math.cos(n.angH5 || 0) < 0 ? -1 : 1; ctx.scale(dir, 1);
    ctx.rotate(-0.25 * (1 - rialza));
    // busto trascinato quasi a terra, una gamba di legno storta dietro, il braccio che tira
    sagomaH5(() => {
      ctx.ellipse(0, -5, 9, 5, -0.15, 0, TAU);
      ctx.moveTo(-7, -4); ctx.lineTo(-17, -1 + sv); ctx.lineTo(-17, 2 + sv); ctx.lineTo(-6, -1);
      ctx.moveTo(6, -7); ctx.lineTo(13 + sv * 3, -2); ctx.lineTo(14 + sv * 3, 1); ctx.lineTo(5, -3);
    }, flash);
    sagomaH5(() => { ctx.arc(10, -10 - 2 * rialza, 5, 0, TAU); }, flash); // testa ciondolante
    ctx.fillStyle = '#c0392b'; ctx.fillRect(1, -9, 4, 2); // un brandello del costume
    ctx.fillStyle = '#f9cb40'; ctx.fillRect(11, -11 - 2 * rialza, 1.5, 1.5); // l'occhio di vernice
    // i ganci senza filo sulle spalle
    ctx.strokeStyle = '#d9a456'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-2, -11, 2, Math.PI, 0); ctx.stroke();
    ctx.restore();
  },
  topo_h5(n, tk, flash) {
    if (pngH5(n.tipo, n.statoH5 === 'corre' ? Math.floor(tk / 4) % 2 : 2, n.x, n.y, 22)) return;
    const corre = n.statoH5 === 'corre';
    const a = n.angH5 || 0, dir = Math.cos(a) < 0 ? -1 : 1;
    ctx.save(); ctx.translate(n.x, n.y); ctx.scale(dir, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 2, 8, 2.5, 0, 0, TAU); ctx.fill();
    const salto = corre ? Math.abs(Math.sin(tk * 0.6 + n.faseH5)) * 1.5 : 0;
    sagomaH5(() => {
      ctx.moveTo(-7, -2 - salto); ctx.quadraticCurveTo(-2, -9 - salto, 5, -5 - salto); ctx.lineTo(9, -3 - salto); ctx.lineTo(5, -1 - salto); ctx.closePath();
    }, flash);
    ctx.strokeStyle = '#d9a456'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-7, -2 - salto); ctx.quadraticCurveTo(-13, -1, -15, -5 + Math.sin(tk * 0.3) * 2); ctx.stroke(); // coda di spago
    ctx.fillStyle = '#e8d2a4'; ctx.fillRect(-1, -6 - salto, 3, 1); ctx.fillRect(-4, -5 - salto, 2, 1); // le pagine incollate
    ctx.fillStyle = '#ef4444'; ctx.fillRect(5, -5 - salto, 1.4, 1.4);
    ctx.restore();
  },
};

/** Ripiego PNG: se c'è uno sprite del teatro per la chiave, disegna la cella e rende vero. */
function pngH5(chiave, cella, x, y, alto) {
  try {
    if (typeof getSpriteTeatro !== 'function' || typeof disegnaCellaTeatro !== 'function') return false;
    const F = SPRITE_H5[chiave];
    if (!F || !F.presente) return false; // il PNG c'è solo quando l'autore lo consegna: niente richieste a vuoto
    const celle = F.celle;
    return disegnaCellaTeatro(ctx, chiave, Math.min(celle - 1, cella), celle, x - alto / 2, y - alto * 0.85, alto, alto) !== false;
  } catch (_) { return false; }
}

/** Fogli PNG facoltativi in assets/sprite_teatro/ (una riga di celle uguali): `presente: true` quando ci sono. */
const SPRITE_H5 = Object.freeze({
  marionetta_h5: Object.freeze({ celle: 2, presente: false }),   // striscia, si rialza
  topo_h5: Object.freeze({ celle: 3, presente: false }),         // corsa 1, corsa 2, sosta
  macchinista_h5: Object.freeze({ celle: 4, presente: false }),  // cammina, leva, corda, ruota
});

/** Le marionette a terra (morte la prima volta) e i contrappesi. */
function disegnaCaduteEPesiH5(st, tk) {
  const S = st.sottopalcoH5;
  for (const c of S.cadute) { // un mucchio di legno e stracci che trema prima di rialzarsi
    const trema = c.t > NEMICI_H5.marionetta_h5.giuTick * 0.6 ? Math.sin(tk * 1.7) * 1.2 : 0;
    ctx.save(); ctx.translate(c.x + trema, c.y);
    sagomaH5(() => { ctx.ellipse(0, -2, 11, 3.5, 0.1, 0, TAU); ctx.moveTo(8, -3); ctx.arc(11, -3, 4, 0, TAU); }, false);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-3, -4, 4, 2);
    ctx.restore();
  }
}

/** I contrappesi in aria (corda dall'alto, peso di ferro): sopra le figure. */
function disegnaPesiH5(st) {
  for (const w of st.sottopalcoH5.pesi) {
    const xw = w.x + w.dx, yw = w.y - w.quota;
    ctx.save();
    ctx.strokeStyle = '#d9a456'; ctx.globalAlpha = 0.85; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(w.x, ARENA.y1 - 46); ctx.lineTo(xw, yw - 12); ctx.stroke();
    ctx.globalAlpha = 1;
    sagomaH5(() => { ctx.rect(xw - 8, yw - 12, 16, 14); }, false);
    ctx.strokeStyle = '#d9a456'; ctx.beginPath(); ctx.arc(xw, yw - 14, 3, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#3a2817'; ctx.fillRect(xw - 6, yw - 8, 12, 2); ctx.fillRect(xw - 6, yw - 3, 12, 2);
    ctx.restore();
  }
}

/** Le porte del Sottopalco: varchi bui fra i puntelli, sbarrati da assi finché la stanza non è ripulita. */
function disegnaPorteH5(st) {
  for (const lato of ['W', 'E']) {
    if (!st.porte[lato]) continue;
    const x = lato === 'W' ? ARENA.x1 - 14 : ARENA.x2 + 2, y = 188;
    ctx.save();
    ctx.fillStyle = '#050304'; ctx.fillRect(x, y - 26, 12, 52);
    ctx.strokeStyle = '#d9a456'; ctx.globalAlpha = 0.6; ctx.strokeRect(x + 0.5, y - 25.5, 11, 51); ctx.globalAlpha = 1;
    if (!st.pulita) { ctx.fillStyle = '#4a321d'; for (let k = -18; k <= 14; k += 11) { ctx.fillRect(x - 2, y + k, 16, 5); } }
    ctx.restore();
  }
}

// ===========================================================================
// AGGANCI
// ===========================================================================
const verificaStanzaPulitaBaseH5 = verificaStanzaPulita;
verificaStanzaPulita = function verificaStanzaPulitaH5(...a) {
  const st = statoRun.stanzaCorrente;
  try { // sotto: chi è caduto una volta si rialza, la stanza non è ancora ripulita
    if (st && st.sottopalcoH5 && !st.pulita) { caduteH5(st); if (st.sottopalcoH5.cadute.length) return undefined; }
  } catch (err) { console.error('[h5] cadute', err); }
  const era = Boolean(st && st.pulita);
  const r = verificaStanzaPulitaBaseH5.apply(this, a);
  try { if (st && !era && st.pulita && st.botoleD5 && !st.sottopalcoH5) provaBotolaH5(st); } catch (err) { console.error('[h5] botola', err); }
  return r;
};

const interagisciStanzaBaseH5 = interagisciStanza;
interagisciStanza = function interagisciStanzaH5(...a) {
  try {
    const st = statoRun.stanzaCorrente;
    if (st && statoRun.fase === 'in_gioco' && !statoRun.siparioAttivo && !statoRun.scambioPendente) {
      const b = st.botolaH5;
      if (b && !b.usata && st.pulita && vicinoH5(b.x, b.y, SOTTOPALCO_H5.raggioBotola)) { scendiH5(); return undefined; }
      if (scalaProntaH5(st) && vicinoH5(SOTTOPALCO_H5.scala.x, SOTTOPALCO_H5.scala.y, SOTTOPALCO_H5.raggioScala)) { risaliH5(); return undefined; }
    }
  } catch (err) { console.error('[h5] interazione', err); }
  return interagisciStanzaBaseH5.apply(this, a);
};

const disegnaStanzaBaseH5 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function disegnaStanzaH5(t, st, ...resto) {
  const r = disegnaStanzaBaseH5.call(this, t, st, ...resto);
  try {
    const s = st || statoRun.stanzaCorrente;
    if (s && s.sottopalcoH5) disegnaStanzaSottoH5(s, tick);
    else if (s && s.botolaH5) disegnaBotolaSocchiusaH5(s, tick);
  } catch (err) { console.error('[h5] disegno stanza', err); }
  return r;
};

const disegnaHUDBaseH5 = disegnaHUDPixelArt;
disegnaHUDPixelArt = function disegnaHUDH5(st, ...resto) {
  try {
    const s = st || statoRun.stanzaCorrente;
    if (s && s.sottopalcoH5 && statoRun.fase === 'in_gioco') { disegnaPesiH5(s); disegnaBuioH5(s, tick); }
    if (s && statoRun.fase === 'in_gioco') disegnaEtichetteH5(s);
  } catch (err) { console.error('[h5] buio', err); }
  return disegnaHUDBaseH5.call(this, st, ...resto);
};

const passoLogicoBaseH5 = passoLogico;
passoLogico = function passoLogicoH5(...a) {
  const r = passoLogicoBaseH5.apply(this, a);
  try {
    const st = statoRun.stanzaCorrente;
    if (st && st.sottopalcoH5 && statoRun.fase === 'in_gioco' && !statoRun.pausa && !statoRun.siparioAttivo) {
      passoPolvereH5(st);
      caduteH5(st);
      passoPesiH5(st);
    }
  } catch (err) { console.error('[h5] passo', err); }
  return r;
};

const luceLuogoBaseH5 = luceLuogoB2;
luceLuogoB2 = function luceLuogoH5(...a) {
  if (statoRun && statoRun.stanzaCorrente && statoRun.stanzaCorrente.sottopalcoH5) return LUCE_H5;
  return luceLuogoBaseH5.apply(this, a);
};

const iaNemicoBaseH5 = iaNemicoD6;
/** I nemici del Sottopalco hanno la loro IA; gli altri restano a d6 (e alla base). */
iaNemicoD6 = function iaNemicoH5(n, st, ang, dist, ...resto) {
  const ia = n && IA_H5[n.tipo];
  if (!ia) return iaNemicoBaseH5.call(this, n, st, ang, dist, ...resto);
  try { ia(n, st, ang, dist); } catch (err) { console.error('[h5] ia', n.tipo, err); }
  return true;
};

const disegnaNemicoBaseH5 = disegnaNemicoPittorico;
/** I nemici del Sottopalco si disegnano qui. Stessa firma: ([ctx], nemico, tick). */
disegnaNemicoPittorico = function disegnaNemicoH5(...args) {
  const a = args[0] && typeof args[0].save === 'function' ? args.slice(1) : args;
  const n = a[0], d = n && DISEGNI_H5[n.tipo];
  if (!d) return disegnaNemicoBaseH5.apply(this, args);
  try { ctx.save(); d(n, a[1] || 0, n.flash > 0 && OPZIONI.lampi !== false); ctx.restore(); } catch (err) { console.error('[h5] disegno', n.tipo, err); }
  return undefined;
};

const avviaPianoBaseH5 = avviaPiano;
avviaPiano = function avviaPianoH5(...a) { h5.sotto = null; h5.buioFessure = 0; return avviaPianoBaseH5.apply(this, a); };

const nuovaRunBaseH5 = nuovaRun;
nuovaRun = function nuovaRunH5(...a) { h5.sotto = null; h5.buioFessure = 0; h5.copione = null; return nuovaRunBaseH5.apply(this, a); };

// --- sonda QA (tools/qa-teatro-sottopalco.js) ---
if (window.__teatro && window.__teatro.interni) {
  window.__teatro.interni.sottopalcoH5 = {
    SOTTOPALCO_H5, TESTI_H5, h5, provaBotolaH5, scendiH5, risaliH5, sottoH5, scalaProntaH5,
    stato: () => ({ sotto: sottoH5(), stanza: statoRun.stanzaCorrente && statoRun.stanzaCorrente.id, fatte: [...h5.fatte], buio: h5.buioFessure }),
  };
}
