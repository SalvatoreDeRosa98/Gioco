/*
 * teatro/d7-rifiniture.js — (squadra d7) rifiniture rimaste indietro. Solo ciò che è nuovo:
 *  - stacco di Donna Luciana dal pavimento a scacchi della Reggia (occhio di bue, contorno color lanterna,
 *    pavimento dell'arena smorzato, alone dei suoi proiettili): solo resa, il comportamento non cambia;
 *  - il Ragno della Seta (nemico nuovo dei Vasi di Capodimonte, raro a San Leucio).
 * Le correzioni piccole stanno nei file che le contenevano (HUD in 60-resa.js, scritte in b3/c2...).
 * Script classico, caricato dopo teatro/c2-tocco.js. QA: tools/qa-teatro-rifiniture.js.
 */
'use strict';

// ===========================================================================
// DONNA LUCIANA SUGLI SCACCHI (solo resa)
// ===========================================================================
/** Numeri della resa dell'arena di Donna Luciana. */
const LUCIANA_D7 = Object.freeze({
  bossId: 'donna-luciana',
  pavimento: Object.freeze({ x: 68, y: 70, w: 504, h: 234, velo: 'rgba(46, 26, 14, 0.6)' }), // scacchi smorzati: chiare a ~38% di luminosità, tinta calda
  occhioDiBue: Object.freeze({ rx: 58, ry: 22, dy: 8, centro: 'rgba(255, 226, 160, 0.85)', bordo: 'rgba(255, 190, 90, 0)',
    alone: Object.freeze({ dy: -26, r: 64, centro: 'rgba(255, 214, 140, 0.5)', bordo: 'rgba(255, 190, 90, 0)' }) }),
  contorno: Object.freeze({ colore: '#ffc45c', spessore: 2 }), // px logici
  proiettile: Object.freeze({ r: 5.5, fondo: 'rgba(10, 5, 3, 0.85)', anello: '#ffcf6b', spessore: 1.4 }),
});

/** La stanza in cui si gioca (oggetto), o null. */
function stanzaAttualeD7() {
  const s = statoRun.stanzaCorrente;
  if (s && typeof s === 'object') return s;
  return statoRun.mappa?.stanze?.find((x) => x.id === s) || null;
}

/** Donna Luciana viva nella stanza attuale, o null. */
function lucianaInScenaD7() {
  if (statoRun.fase !== 'in_gioco') return null;
  const st = stanzaAttualeD7();
  return st?.nemici?.find((n) => n.boss && n.hp > 0 && n.bossId === LUCIANA_D7.bossId) || null;
}

/** Disegna il velo scuro sugli scacchi dell'arena di Donna Luciana (dopo le macchie, prima delle figure). */
function disegnaArenaLucianaD7() {
  const b = lucianaInScenaD7();
  if (!b) return;
  const P = LUCIANA_D7.pavimento;
  ctx.save();
  ctx.fillStyle = P.velo;
  ctx.fillRect(P.x, P.y, P.w, P.h);
  ctx.restore();
}

const disegnaMacchieBaseD7 = disegnaMacchie;
disegnaMacchie = function disegnaMacchieD7(...a) {
  const r = disegnaMacchieBaseD7.apply(this, a);
  try { disegnaSetaD7(); disegnaArenaLucianaD7(); } catch (err) { console.error('[d7] pavimento', err); }
  return r;
};

let disegniLucianaD7 = 0; // sonda QA: quante volte il contorno è stato applicato
const disegnaBossPittoricoBaseD7 = disegnaBossPittorico;
disegnaBossPittorico = function disegnaBossPittoricoD7(...a) {
  const b = a[0] && typeof a[0].save === 'function' ? a[1] : a[0];
  if (!b || b.bossId !== LUCIANA_D7.bossId) return disegnaBossPittoricoBaseD7.apply(this, a);
  const O = LUCIANA_D7.occhioDiBue, C = LUCIANA_D7.contorno;
  try { // occhio di bue ai suoi piedi (sopra tappeto e arredi, sotto la sagoma)
    ctx.save();
    const yb = b.y + O.dy;
    const g = ctx.createRadialGradient(b.x, yb, 2, b.x, yb, O.rx);
    g.addColorStop(0, O.centro);
    g.addColorStop(1, O.bordo);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(b.x, yb, O.rx, O.ry, 0, 0, TAU);
    ctx.fill();
    const A = O.alone, ya = b.y + A.dy; // alone dietro la figura
    const ga = ctx.createRadialGradient(b.x, ya, 4, b.x, ya, A.r);
    ga.addColorStop(0, A.centro);
    ga.addColorStop(1, A.bordo);
    ctx.fillStyle = ga;
    ctx.beginPath();
    ctx.arc(b.x, ya, A.r, 0, TAU);
    ctx.fill();
    ctx.restore();
  } catch (err) { console.error('[d7] occhio di bue', err); }
  ctx.save();
  const t = ctx.getTransform(), d = (C.spessore * Math.hypot(t.a, t.b)).toFixed(2); // filter lavora in px della tela
  ctx.filter = `drop-shadow(${d}px 0 0 ${C.colore}) drop-shadow(-${d}px 0 0 ${C.colore}) drop-shadow(0 ${d}px 0 ${C.colore}) drop-shadow(0 -${d}px 0 ${C.colore})`; // contorno pieno di lanterna
  disegniLucianaD7++;
  try { return disegnaBossPittoricoBaseD7.apply(this, a); } finally { ctx.restore(); }
};

/**
 * Alone scuro con anello di lanterna sotto un proiettile nemico, solo nell'arena di Donna Luciana
 * (aggancio di una riga nel ciclo dei proiettili di 60-resa.js).
 * @param {{x:number,y:number}} pr proiettile
 */
function aloneProiettileD7(pr) {
  if (!lucianaInScenaD7()) return;
  const A = LUCIANA_D7.proiettile;
  ctx.save();
  ctx.fillStyle = A.fondo;
  ctx.strokeStyle = A.anello;
  ctx.lineWidth = A.spessore;
  ctx.beginPath();
  ctx.arc(pr.x, pr.y, A.r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ===========================================================================
// IL RAGNO DELLA SETA (nemico nuovo: Vasi di Capodimonte, raro a San Leucio)
// ===========================================================================
/**
 * Numeri del Ragno della Seta (tick a 60 al secondo). La vita e il nome stanno nelle tabelle dei nemici di
 * 30-mappa.js (`ragno_seta`); qui il passo, il salto e la seta.
 * Macchina a stati: pausa → scatto (linea retta) → pausa …; da pausa, se Ferruccio è vicino → salto → pausa.
 */
const RAGNO_D7 = Object.freeze({
  tipo: 'ragno_seta',
  pausaTick: Object.freeze([22, 46]),     // ferma, zampe che tremano
  scattoTick: Object.freeze([16, 26]),    // corsa dritta
  velScatto: 2.6,                         // px/tick in corsa
  direzioni: 8,                           // le corse seguono 8 direzioni (dritte o di sbieco)
  versoFerruccio: 0.65,                   // probabilità che la corsa punti verso di lui
  salto: Object.freeze({ distanza: 62, durataTick: 22, altezza: 16, ricaricaTick: 90 }),
  seta: Object.freeze({ ogniTick: 3, vitaTick: 150, raggio: 6, rallenta: 0.5, max: 60 }), // filo dietro di sé
  sanLeucio: Object.freeze({ piano: 3, probabilita: 0.1 }), // raro nelle stanze normali del piano 3
  disegno: Object.freeze({ corpo: '#120a08', contorno: '#ffc45c', occhi: '#e53222', seta: 'rgba(236, 226, 200, 0.75)' }),
});
/** Transizioni ammesse della macchina a stati del ragno. */
const STATI_RAGNO_D7 = Object.freeze({ pausa: Object.freeze(['scatto', 'salto']), scatto: Object.freeze(['pausa']), salto: Object.freeze(['pausa']) });

/** Hash intero di una stringa (scelte di resa e di comparsa senza toccare il seme della run). */
function hashD7(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/** Numero pseudo-casuale 0..1 proprio del ragno (non consuma `rng()` della run). */
function casoRagnoD7(n) { n.casoD7 = (Math.imul(n.casoD7 || hashD7(String(n.id)) || 1, 1103515245) + 12345) >>> 0; return (n.casoD7 >>> 8) / 16777216; }

function cambiaStatoRagnoD7(n, nuovo, durata) {
  if (!STATI_RAGNO_D7[n.statoD7 || 'pausa'].includes(nuovo) && nuovo !== 'pausa') return;
  n.statoD7 = nuovo; n.timerD7 = durata;
}

/**
 * Un passo dell'IA del Ragno della Seta (chiamato dal ciclo dei nemici di 40-combattimento.js).
 * @param {object} n nemico `ragno_seta`
 * @param {number} ang angolo verso Ferruccio
 */
function passoRagnoSetaD7(n, ang) {
  const R = RAGNO_D7;
  if (!n.statoD7) { n.statoD7 = 'pausa'; n.timerD7 = R.pausaTick[0]; n.ricaricaD7 = 0; n.airZ = 0; }
  if (n.ricaricaD7 > 0) n.ricaricaD7--;
  n.timerD7--;
  const tra = (a) => a[0] + Math.floor(casoRagnoD7(n) * (a[1] - a[0] + 1));
  if (n.statoD7 === 'pausa') {
    if (n.timerD7 > 0) return;
    const d = Math.hypot(player.x - n.x, player.y - n.y);
    if (d < R.salto.distanza && n.ricaricaD7 <= 0) {
      cambiaStatoRagnoD7(n, 'salto', R.salto.durataTick);
      const passi = R.salto.durataTick;
      n.vxD7 = (player.x - n.x) / passi; n.vyD7 = (player.y - n.y) / passi;
      n.ricaricaD7 = R.salto.ricaricaTick;
      return;
    }
    const passo = (Math.PI * 2) / R.direzioni;
    const verso = casoRagnoD7(n) < R.versoFerruccio ? ang : casoRagnoD7(n) * Math.PI * 2;
    const a = Math.round(verso / passo) * passo;
    n.vxD7 = Math.cos(a) * R.velScatto; n.vyD7 = Math.sin(a) * R.velScatto;
    cambiaStatoRagnoD7(n, 'scatto', tra(R.scattoTick));
    return;
  }
  const nx = n.x + n.vxD7, ny = n.y + n.vyD7;
  const fuori = nx < ARENA.x1 + 10 || nx > ARENA.x2 - 10 || ny < ARENA.y1 + 10 || ny > ARENA.y2 - 10;
  n.x = Math.max(ARENA.x1 + 10, Math.min(ARENA.x2 - 10, nx));
  n.y = Math.max(ARENA.y1 + 10, Math.min(ARENA.y2 - 10, ny));
  if (n.statoD7 === 'salto') {
    const k = 1 - n.timerD7 / R.salto.durataTick;
    n.airZ = Math.sin(Math.PI * Math.max(0, Math.min(1, k))) * R.salto.altezza;
  } else if ((n.timerD7 % R.seta.ogniTick) === 0) {
    lasciaSetaD7(n);
  }
  if (n.timerD7 <= 0 || (fuori && n.statoD7 === 'scatto')) { n.airZ = 0; cambiaStatoRagnoD7(n, 'pausa', tra(R.pausaTick)); }
}

/** Aggiunge un tratto di seta fra l'ultima posizione e quella attuale del ragno. */
function lasciaSetaD7(n) {
  const st = stanzaAttualeD7();
  if (!st) return;
  const lista = st.setaD7 || (st.setaD7 = []);
  if (n.ultimoD7) lista.push({ x1: n.ultimoD7.x, y1: n.ultimoD7.y, x2: n.x, y2: n.y, vita: RAGNO_D7.seta.vitaTick });
  n.ultimoD7 = { x: n.x, y: n.y };
  if (lista.length > RAGNO_D7.seta.max) lista.shift();
}

/** Vero se il punto (x, y) è sopra un filo di seta. */
function suSetaD7(st, x, y) {
  const r = RAGNO_D7.seta.raggio;
  for (const f of st.setaD7 || []) {
    const dx = f.x2 - f.x1, dy = f.y2 - f.y1, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - f.x1) * dx + (y - f.y1) * dy) / l2));
    if (Math.hypot(x - (f.x1 + dx * t), y - (f.y1 + dy * t)) < r) return true;
  }
  return false;
}

const passoLogicoBaseD7 = passoLogico;
passoLogico = function passoLogicoD7(...a) {
  const st = statoRun.fase === 'in_gioco' ? stanzaAttualeD7() : null;
  const x0 = player.x, y0 = player.y;
  const r = passoLogicoBaseD7.apply(this, a);
  try {
    if (st && st.setaD7 && st.setaD7.length && st === stanzaAttualeD7()) {
      if (suSetaD7(st, x0, y0)) { // la seta trattiene: metà del passo
        const k = RAGNO_D7.seta.rallenta;
        player.x = x0 + (player.x - x0) * k; player.y = y0 + (player.y - y0) * k;
        st.invischiatoD7 = (st.invischiatoD7 || 0) + 1;
      }
      for (let i = st.setaD7.length - 1; i >= 0; i--) if (--st.setaD7[i].vita <= 0) st.setaD7.splice(i, 1);
    }
  } catch (err) { console.error('[d7] seta', err); }
  return r;
};

/** Disegna i fili di seta sul pavimento. */
function disegnaSetaD7() {
  const st = statoRun.fase === 'in_gioco' ? stanzaAttualeD7() : null;
  if (!st || !st.setaD7 || !st.setaD7.length) return;
  ctx.save();
  ctx.strokeStyle = RAGNO_D7.disegno.seta;
  ctx.lineWidth = 0.9;
  for (const f of st.setaD7) {
    ctx.globalAlpha = Math.min(1, f.vita / 40);
    ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
  }
  ctx.restore();
}

/** Sagoma a ombra del Ragno della Seta: otto zampe snodate, contorno di lanterna, occhi rossi. */
function disegnaRagnoSetaD7(n, tick) {
  const D = RAGNO_D7.disegno, z = n.airZ || 0;
  const corre = n.statoD7 === 'scatto';
  const fase = corre ? tick * 0.9 : Math.sin(tick * 0.5) * 0.15;
  ctx.save();
  ctx.fillStyle = 'rgba(8, 5, 3, 0.55)'; // ombra a terra
  ctx.beginPath(); ctx.ellipse(n.x, n.y + 5, 8 - z * 0.15, 3, 0, 0, TAU); ctx.fill();
  ctx.translate(n.x, n.y - z);
  const corpo = n.flash > 0 ? '#ffffff' : D.corpo;
  ctx.strokeStyle = corpo; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
  for (let lato = -1; lato <= 1; lato += 2) {
    for (let k = 0; k < 4; k++) {
      const onda = Math.sin(fase + k * 1.6 + (lato > 0 ? Math.PI : 0)) * (corre ? 2 : 0.6);
      const ay = -3 + k * 2;
      const gx = lato * (6 + (k === 0 || k === 3 ? 1 : 2)), gy = ay - 4 + onda * 0.5;
      const px = lato * (10 + (k === 1 || k === 2 ? 1 : 0)), py = ay + 3 + (k - 1.5) * 1.6 + onda;
      ctx.beginPath(); ctx.moveTo(lato * 2.5, ay); ctx.lineTo(gx, gy); ctx.lineTo(px, py); ctx.stroke();
    }
  }
  ctx.fillStyle = corpo; ctx.strokeStyle = D.contorno; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(0, 3, 5, 5.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); // addome
  ctx.beginPath(); ctx.ellipse(0, -3.5, 3.4, 3, 0, 0, TAU); ctx.fill(); ctx.stroke(); // capo
  ctx.fillStyle = D.contorno; ctx.fillRect(-0.5, 1, 1, 4); // segno d'oro sul dorso
  ctx.fillStyle = D.occhi;
  ctx.fillRect(-2, -5, 1.3, 1.3); ctx.fillRect(0.7, -5, 1.3, 1.3);
  ctx.restore();
}

const disegnaNemicoPittoricoBaseD7 = disegnaNemicoPittorico;
disegnaNemicoPittorico = function disegnaNemicoPittoricoD7(...a) {
  const n = a[0] && typeof a[0].save === 'function' ? a[1] : a[0];
  const tick = (a[0] && typeof a[0].save === 'function' ? a[2] : a[1]) || 0;
  if (!n || n.tipo !== RAGNO_D7.tipo) return disegnaNemicoPittoricoBaseD7.apply(this, a);
  try { disegnaRagnoSetaD7(n, tick); } catch (err) { console.error('[d7] ragno', err); }
  return undefined;
};

let creandoRagnoD7 = false;
const popolaStanzaBaseD7 = popolaStanza;
popolaStanza = function popolaStanzaD7(s, piano, ...resto) {
  const r = popolaStanzaBaseD7.call(this, s, piano, ...resto);
  if (creandoRagnoD7 || (typeof gruppoRichiestoB7 !== 'undefined' && gruppoRichiestoB7) || !s || s.tipo !== 'normale' || !s.nemici || !s.nemici.length) return r;
  try {
    const L = RAGNO_D7.sanLeucio;
    if (((piano - 1) % 4) + 1 !== L.piano) return r;
    if ((hashD7(`${statoRun.seme || ''}:${s.id}:ragno`) % 1000) / 1000 >= L.probabilita) return r;
    creandoRagnoD7 = true;
    const n = creaNemiciB7({ id: `${s.id}-ragnoD7` }, piano, [RAGNO_D7.tipo])[0];
    const via = s.nemici[s.nemici.length - 1];
    if (n && !via.boss) { n.x = via.x; n.y = via.y; s.nemici[s.nemici.length - 1] = n; }
  } catch (err) { console.error('[d7] ragno a San Leucio', err); } finally { creandoRagnoD7 = false; }
  return r;
};

// ===========================================================================
// TELEFONO: scritte senza tasti del PC, linguette del Diario, vibrazione solo col gamepad
// ===========================================================================
/**
 * Col tocco attivo (inToccoB3 di b3) le scritte fisse che nominano tasti del PC si riscrivono coi bottoni a
 * schermo di c2. Prima le frasi intere, poi le parole: i segni fra parentesi ([E], [Q], [ESC]...) li traduce b3.
 */
const TOCCO_D7 = Object.freeze({
  frasi: Object.freeze([
    Object.freeze(['WASD: Movimento · Frecce/Mouse: Spara/Attacca', 'Levetta sinistra: movimento · levetta destra: sparo']),
    Object.freeze(['[W/S] o click: scegli lo slot · [Canc] cancella · [M] muto', 'Tocca uno slot per sceglierlo']),
    Object.freeze(['Q: Attivo · E: Compra/Patto/Raccogli · ESC: Pausa', 'OGGETTO: attivo · AZIONE: compra/patto/raccogli · ❚❚: pausa']),
  ]),
  parole: Object.freeze([
    Object.freeze([/\[(?:Click|Clic|click|clic)\s*\/\s*E\]/g, '[E]']),
    Object.freeze([/(?:premi\s+)?(?:SPAZIO|Spazio|spazio)\s*\/\s*E\b/g, '[E]']),
    Object.freeze([/\b(?:premi|Premi)\s+(?:SPAZIO|Spazio|spazio|INVIO|Invio)\b/g, 'tocca CONFERMA']),
    Object.freeze([/\b(?:SPAZIO|Spazio|INVIO|Invio)\b/g, 'CONFERMA']),
    Object.freeze([/\b(?:Click|Clic|CLICK|CLIC)\b/g, 'Tocca']),
    Object.freeze([/\b(?:click|clic)\b/g, 'tocca']),
    Object.freeze([/\b(?:WASD|Frecce|frecce|Mouse|mouse)\b/g, 'levette']),
    Object.freeze([/\b(?:Esc|ESC)\s*\/\s*O\b/g, 'INDIETRO']),
    Object.freeze([/(^|[\s·(])ESC\b/g, '$1INDIETRO']),
    Object.freeze([/(^|[\s·(])[TNFCOL]:\s/g, '$1']), // «T: trasformazioni»: col tocco ci sono le linguette
  ]),
  linguette: Object.freeze({ y: 318, h: 15, w: 112, spazio: 8,
    voci: Object.freeze([Object.freeze(['KeyT', 'TRASFORMAZIONI']), Object.freeze(['KeyN', 'DIARIO DI FERRUCCIO']), Object.freeze(['KeyF', 'FINALI'])]) }),
});

/** Riscrive per il tocco una scritta che nomina tasti del PC (identica se il tocco non è attivo). */
function testoToccoD7(t) {
  if (typeof t !== 'string' || typeof inToccoB3 !== 'function' || !inToccoB3()) return t;
  if (typeof TESTI_C2 !== 'undefined' && TESTI_C2.interi && TESTI_C2.interi[t]) return t; // la traduce già c2
  for (const [da, a] of TOCCO_D7.frasi) if (t === da) return a;
  let r = t;
  for (const [re, a] of TOCCO_D7.parole) r = r.replace(re, a);
  return r;
}

const drawTextFitBaseD7 = drawTextFit;
drawTextFit = function drawTextFitD7(t, ...a) { return drawTextFitBaseD7.call(this, testoToccoD7(t), ...a); };
const drawPillLabelBaseD7 = drawPillLabel;
drawPillLabel = function drawPillLabelD7(t, ...a) { return drawPillLabelBaseD7.call(this, testoToccoD7(t), ...a); };

/** Rettangoli delle linguette del Diario (coordinate logiche), centrati in basso nel riquadro. */
function linguetteDiarioD7() {
  const L = TOCCO_D7.linguette, n = L.voci.length;
  const x0 = Math.round(W / 2 - (n * L.w + (n - 1) * L.spazio) / 2);
  return L.voci.map(([codice, nome], k) => ({ codice, nome, x: x0 + k * (L.w + L.spazio), y: L.y, w: L.w, h: L.h }));
}

const disegnaDiarioBaseD7 = disegnaDiarioD;
disegnaDiarioD = function disegnaDiarioDD7(...a) {
  const r = disegnaDiarioBaseD7.apply(this, a);
  try {
    if (statoRun.diarioD && typeof inToccoB3 === 'function' && inToccoB3()) {
      ctx.save();
      for (const l of linguetteDiarioD7()) {
        ctx.fillStyle = 'rgba(28, 19, 12, 0.95)';
        ctx.fillRect(l.x, l.y, l.w, l.h);
        ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 1;
        ctx.strokeRect(l.x + 0.5, l.y + 0.5, l.w - 1, l.h - 1);
        drawTextFitBaseD7(l.nome, l.x + l.w / 2, l.y + l.h - 4, l.w - 8, { size: 7, color: '#f9cb40' });
      }
      ctx.restore();
    }
  } catch (err) { console.error('[d7] linguette', err); }
  return r;
};

const clickDiarioBaseD7 = clickDiarioD;
clickDiarioD = function clickDiarioDD7(mx, my, ...a) {
  if (statoRun.diarioD && typeof inToccoB3 === 'function' && inToccoB3()) {
    for (const l of linguetteDiarioD7()) {
      if (mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h) { tastoDiarioD(l.codice); return undefined; }
    }
  }
  return clickDiarioBaseD7.call(this, mx, my, ...a);
};

/** Vero se c'è almeno un gamepad vero collegato (il pad virtuale di c2 non conta). */
function gamepadCollegatoD7() {
  try { return Array.from(navigator.getGamepads ? navigator.getGamepads() : []).some((g) => g && g.connected !== false); } catch (_) { return false; }
}

const righeBaseD7 = righeB3;
righeB3 = function righeB3D7(...a) {
  const r = righeBaseD7.apply(this, a);
  if (!Array.isArray(r) || gamepadCollegatoD7()) return r;
  return r.some((x) => x && x.id === 'vibrazione') ? r.filter((x) => !x || x.id !== 'vibrazione') : r;
};

Object.assign(window.__teatro.interni, { rifinitureD7: { LUCIANA_D7, lucianaInScenaD7, disegniLuciana: () => disegniLucianaD7, RAGNO_D7, suSetaD7, stanzaAttualeD7, testoToccoD7, linguetteDiarioD7, gamepadCollegatoD7 } });
