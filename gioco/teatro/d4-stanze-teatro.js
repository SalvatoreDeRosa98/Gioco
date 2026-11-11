/*
 * teatro/d4-stanze-teatro.js — (squadra d4) tre stanze del teatro.
 *
 *   1. I CAMERINI DIETRO LE QUINTE: la stanza `maledetta` di a3 (porta che costa ½ Maschera a ogni passaggio,
 *      dentro un premio e a volte dei custodi) rivestita: porta di servizio con la tenda consunta e il chiodo
 *      sporgente, dentro specchiere con le candele, il baule dei costumi, parrucche, manichini; i custodi sono
 *      manichini da sarta che si animano (IA del Burattino Scucito: passo a scatti, stoccata d'ago che si
 *      legge dalla posa). La REGOLA resta quella di a3 (STANZE_SPECIALI_A3.maledetta): qui cambiano solo
 *      nomi, banner, disegni e il simbolo sulla minimappa.
 *      Già che c'eravamo: nelle stanze di a3 il forziere di a1 (e le bombe accese) finivano SOTTO il tappeto,
 *      perché a1 disegna dentro la catena di disegnaStanzaPixelArt prima che a3 stenda il fondo: ora si
 *      ripassano sopra (sopraIlTappetoD4).
 *
 * Integrazione: si avvolgono funzioni di primo livello (sempre chiamando la base). Di a3 si avvolgono
 * `disegnaRoviA3` (la porta), `disegnaArrediA3` (la stanza), `disegnaMinimappaA3` (il simbolo) e
 * `pagaSangueA3` (il nome della fonte); i banner di a3 passano da `mostraBanner`, dove i testi dei rovi
 * vengono sostituiti (tabella SOSTITUZIONI_D4: chiave = testo di a3). Nessuna riga cambiata in a3 per i Camerini.
 * Verifica: tools/qa-teatro-stanze-teatro.js. Script classico (teatro/LEGGIMI.md), caricato dopo c2-tocco.js.
 */

// ===========================================================================
// TABELLE (tutto ciò che si accorda sta qui)
// ===========================================================================

/** Colori comuni dello stile «a ombre»: sagoma scura, contorno color lanterna, pochi accenti. */
const OMBRE_D4 = Object.freeze({ sagoma: '#140c10', buio: '#070403', lume: '#e8c98a', oro: '#f9cb40', rosso: '#b91c1c', legno: '#2a1a10' });

/** Valori delle tre stanze (d4). */
const STANZE_TEATRO_D4 = Object.freeze({
  camerini: Object.freeze({
    /** Aspetto: porta di servizio, fondo della stanza, cella sulla minimappa. */
    aspetto: Object.freeze({
      cornice: '#b08a4a', stipite: '#2a1a10', tenda: '#5e1b26', tendaScura: '#3a1019', toppa: '#7a5a34',
      chiodo: '#cbd5e1', sangue: '#dc2626', minimappa: '#4a1c2a', velo: 'rgba(26, 12, 18, 0.34)', tappeto: '#3a1420',
    }),
    /** Arredi (coordinate del palco 640×360). r = raggio del corpo solido per Ferruccio (0 = si attraversa). */
    specchiere: Object.freeze([200, 262, 378, 440]),
    stand: Object.freeze({ x: 108, y: 122, r: 14 }),
    parrucche: Object.freeze({ x: 534, y: 122, r: 14 }),
    baule: Object.freeze({ x: 118, y: 266, r: 17 }),
    manichinoFermo: Object.freeze({ x: 526, y: 262, r: 9 }),
    /** I custodi (contenuto 'nemici' di a3) diventano manichini: tipo di IA di base, nome, velocità di base. */
    custodi: Object.freeze({ tipo: 'burattino', vel: 1.15, velPerPiano: 0.045, velMax: 1.55, raggio: 11, cdMin: 58, cdMax: 74 }),
    /** Posa del manichino letta da shootCd (stessa IA del Burattino Scucito di 40-combattimento.js). */
    posa: Object.freeze({ anticipoDa: 18, affondoDa: 8 }),
  }),
});

/** Testi per il giocatore (tutti da approvare dall'autore). */
const TESTI_D4 = Object.freeze({
  camerini: Object.freeze({
    graffio: '🎭 Il chiodo della porta di servizio ti strappa un filo: -½ ❤️',
    rifiuto: "🎭 Il chiodo ti spezzerebbe l'ultimo filo: torna quando avrai più Maschere.",
    risparmia: '🎭 Il chiodo ti risparmia: sei allo stremo.',
    ingressoQuieto: '🎭 I CAMERINI DIETRO LE QUINTE: quel che trovi è tuo, ma anche uscire dalla porta di servizio costa ½ ❤️.',
    ingressoCustodi: '🎭 I CAMERINI DIETRO LE QUINTE: fra gli specchi i manichini si animano!',
    custodiCaduti: '🎭 I manichini tornano di legno: quel che custodivano è tuo!',
    fonte: 'il chiodo della porta di servizio',
    custode: 'Manichino dei Camerini',
  }),
});

/**
 * Testi di a3 (Stanza dei Rovi) → testi dei Camerini. La chiave è il testo esatto di a3-stanze-speciali.js:
 * se a3 cambia una frase, qui la sostituzione smette di scattare e la QA lo segnala (cerca «rovi» nei banner).
 */
const SOSTITUZIONI_D4 = new Map([
  ['✷ I rovi della porta ti graffiano: -½ ❤️', TESTI_D4.camerini.graffio],
  ['✷ I rovi ti ucciderebbero: torna quando avrai più Maschere.', TESTI_D4.camerini.rifiuto],
  ['✷ I rovi ti risparmiano: sei allo stremo.', TESTI_D4.camerini.risparmia],
  ['✷ STANZA DEI ROVI: il bottino è tuo, ma anche uscire costa ½ ❤️.', TESTI_D4.camerini.ingressoQuieto],
  ['✷ STANZA DEI ROVI: i custodi del bottino ti aspettavano!', TESTI_D4.camerini.ingressoCustodi],
  ['✷ I custodi dei rovi sono caduti: il bottino è tuo!', TESTI_D4.camerini.custodiCaduti],
]);
const FONTE_ROVI_A3_D4 = 'i rovi della porta';

/** Interruttori per la QA (foto «prima/dopo»): nel gioco restano tutti accesi. */
const provaD4 = { sopraIlTappeto: true };

// ===========================================================================
// UTILITÀ DI DISEGNO
// ===========================================================================

const teleD4 = new Map();
/**
 * Tela fuori schermo grande quanto il palco (640×360 alla scala del buffer) per ciò che non cambia mai.
 * @param {string} chiave @param {(g: CanvasRenderingContext2D) => void} disegna chiamata una volta sola
 */
function telaD4(chiave, disegna) {
  const k = `${chiave}@${scalaBase}`;
  let c = teleD4.get(k);
  if (c) return c;
  if (teleD4.size > 6) teleD4.clear();
  c = document.createElement('canvas');
  c.width = Math.ceil(W * scalaBase); c.height = Math.ceil(H * scalaBase);
  const g = c.getContext('2d');
  g.setTransform(scalaBase, 0, 0, scalaBase, 0, 0);
  g.lineJoin = 'round'; g.lineCap = 'round';
  disegna(g);
  teleD4.set(k, c);
  return c;
}

/** Poligono pieno col contorno netto. punti: [[x, y], ...]. */
function sagomaD4(g, punti, pieno = OMBRE_D4.sagoma, bordo = OMBRE_D4.lume, largo = 1) {
  g.beginPath();
  for (let i = 0; i < punti.length; i++) { if (i) g.lineTo(punti[i][0], punti[i][1]); else g.moveTo(punti[i][0], punti[i][1]); }
  g.closePath();
  if (pieno) { g.fillStyle = pieno; g.fill(); }
  if (bordo) { g.strokeStyle = bordo; g.lineWidth = largo; g.stroke(); }
}

/** Asta scura col filo di luce attorno (gambe, bracci, leggii). */
function astaD4(g, x1, y1, x2, y2, largo = 1.4, anima = OMBRE_D4.sagoma, bordo = OMBRE_D4.lume) {
  g.lineCap = 'round';
  g.strokeStyle = bordo; g.lineWidth = largo + 1.2;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  g.strokeStyle = anima; g.lineWidth = largo;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}

function ombraD4(g, x, y, rx, ry) {
  g.fillStyle = 'rgba(8, 5, 3, 0.55)';
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
}

/** Corpo solido rotondo: spinge Ferruccio fuori (come il banco della Bisca di a3). */
function corpoSolidoD4(c) {
  if (!c || !(c.r > 0)) return;
  const dx = player.x - c.x, dy = player.y - c.y;
  const d = Math.hypot(dx, dy), rMin = c.r + 8;
  if (d < rMin && d > 0.01) { player.x = c.x + (dx / d) * rMin; player.y = c.y + (dy / d) * rMin; }
}

// ===========================================================================
// 1. I CAMERINI DIETRO LE QUINTE (rivestimento della stanza `maledetta` di a3)
// ===========================================================================

/**
 * Alla generazione: i custodi della stanza (nemici del piano estratti da a3) diventano manichini da sarta.
 * Tengono vita e campione del nemico estratto; l'IA è quella del Burattino Scucito (passo a scatti e stoccata).
 */
function vestiCustodiD4(s, piano) {
  const C = STANZE_TEATRO_D4.camerini.custodi;
  if (!s || s.tipo !== 'maledetta' || !Array.isArray(s.nemici)) return 0;
  let n = 0;
  for (const e of s.nemici) {
    if (!e || e.boss || e.manichinoD4) continue;
    e.tipoOrigineD4 = e.tipo;
    e.tipo = C.tipo; e.patternMob = C.tipo;
    delete e.comportamento;
    e.manichinoD4 = true;
    e.nome = e.champion ? `${TESTI_D4.camerini.custode} [Campione ${e.champion}]` : TESTI_D4.camerini.custode;
    e.r = C.raggio;
    e.speed = C.vel * Math.min(C.velMax, 1 + (piano - 1) * C.velPerPiano) * (e.champion === 'dorato' ? 1.2 : 1);
    e.maskOpen = false; e.fuseTimer = 0; e.leapTimer = 0; e.crouchTicks = 0;
    e.shootCd = C.cdMin + Math.floor(rng() * (C.cdMax - C.cdMin + 1));
    n++;
  }
  return n;
}

/**
 * Sagoma del manichino da sarta, origine ai piedi del treppiede, rivolto a destra.
 * @param {CanvasRenderingContext2D} g
 * @param {{ braccio?: ''|'giu'|'su'|'affondo', bianco?: boolean, bordo?: string, trema?: number }} [opz]
 */
function sagomaManichinoD4(g, opz = {}) {
  const bordo = opz.bordo || OMBRE_D4.lume;
  const corpo = opz.bianco ? '#f8fafc' : OMBRE_D4.sagoma;
  // treppiede e asta
  astaD4(g, 0, -3, -7, 0, 1.4, corpo, bordo);
  astaD4(g, 0, -3, 7, 0, 1.4, corpo, bordo);
  astaD4(g, 0, -3, 0, 1, 1.4, corpo, bordo);
  astaD4(g, 0, -12, 0, -3, 1.6, corpo, bordo);
  // busto a clessidra
  g.beginPath();
  g.moveTo(-7.5, -30);
  g.quadraticCurveTo(0, -32.5, 7.5, -30);
  g.quadraticCurveTo(10, -26, 5, -19.5);
  g.quadraticCurveTo(6.5, -15, 7.5, -12);
  g.lineTo(-7.5, -12);
  g.quadraticCurveTo(-6.5, -15, -5, -19.5);
  g.quadraticCurveTo(-10, -26, -7.5, -30);
  g.closePath();
  g.fillStyle = corpo; g.fill();
  g.strokeStyle = bordo; g.lineWidth = 1; g.stroke();
  if (!opz.bianco) {
    // cucitura al centro e metro da sarta a tracolla
    g.strokeStyle = 'rgba(249, 203, 64, 0.55)'; g.lineWidth = 0.7;
    g.setLineDash([1.5, 1.5]);
    g.beginPath(); g.moveTo(0, -30); g.lineTo(0, -13); g.stroke();
    g.setLineDash([]);
    g.strokeStyle = OMBRE_D4.rosso; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(-6.5, -29); g.quadraticCurveTo(1, -22, 5.5, -14); g.stroke();
  }
  // collo col pomello
  g.fillStyle = corpo; g.strokeStyle = bordo; g.lineWidth = 1;
  g.fillRect(-1.8, -34, 3.6, 3); g.strokeRect(-1.8, -34, 3.6, 3);
  g.fillStyle = opz.bianco ? '#f8fafc' : OMBRE_D4.oro;
  g.beginPath(); g.arc(0, -35.5, 2, 0, TAU); g.fill();
  // braccio snodato con l'ago da sarta
  const b = opz.braccio || '';
  if (!b) return;
  const tr = opz.trema || 0;
  const P = b === 'su' ? [[7, -28], [12, -34], [8 + tr, -40]] : b === 'affondo' ? [[7, -28], [13, -27], [20, -26]] : [[7, -28], [10.5, -21], [9.5, -14.5]];
  const ago = b === 'su' ? [3.5 + tr, -49] : b === 'affondo' ? [33, -25] : [11.5, -8];
  astaD4(g, P[0][0], P[0][1], P[1][0], P[1][1], 1.3, corpo, bordo);
  astaD4(g, P[1][0], P[1][1], P[2][0], P[2][1], 1.3, corpo, bordo);
  g.strokeStyle = '#e5e7eb'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(P[2][0], P[2][1]); g.lineTo(ago[0], ago[1]); g.stroke();
  if (b !== 'giu') { // la punta che luccica: l'attacco si legge da qui
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(ago[0], ago[1], b === 'su' ? 1.5 : 1.1, 0, TAU); g.fill();
  }
}

/**
 * Il custode animato (al posto dello sprite del nemico di base). La posa segue shootCd come l'IA del
 * Burattino Scucito: salta a scatti, si ferma e ALZA l'ago (anticipo), poi affonda.
 */
function disegnaManichinoD4(n, t) {
  const P = STANZE_TEATRO_D4.camerini.posa;
  const cd = Number(n.shootCd) || 0;
  const fermo = statoRun.graziaIngressoC > 0 || n.stunTicks > 0;
  const affondo = !fermo && cd > 0 && cd <= P.affondoDa;
  const anticipo = !fermo && cd > P.affondoDa && cd <= P.anticipoDa;
  const salta = !fermo && cd > P.anticipoDa && Math.sin(t * 0.28) > 0.1;
  const verso = player.x < n.x ? -1 : 1;
  const bordo = n.champion === 'cremisi' ? '#ef4444' : n.champion === 'dorato' ? OMBRE_D4.oro : n.champion === 'elettrico' ? '#38bdf8' : OMBRE_D4.lume;
  const x = Math.round(n.x), y = Math.round(n.y) + 9;
  ctx.save();
  ombraD4(ctx, x, y + 1, 10, 3.2);
  ctx.translate(x, y - (salta ? 2.5 : 0));
  ctx.scale(verso, 1);
  ctx.rotate(anticipo ? -0.16 : affondo ? 0.2 : salta ? 0.07 : fermo ? 0 : -0.04);
  sagomaManichinoD4(ctx, {
    braccio: fermo ? 'giu' : anticipo ? 'su' : affondo ? 'affondo' : 'giu',
    bianco: n.flash > 0, bordo, trema: anticipo ? Math.sin(t * 1.3) * 0.8 : 0,
  });
  ctx.restore();
  if (n.stunTicks > 0) {
    ctx.save();
    ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(x, y - 44, 6, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}

/** La specchiera sulla parete di fondo (parte ferma: cornice, vetro, mensola, candele spente). */
function specchieraD4(g, x) {
  const y = 86;
  g.fillStyle = OMBRE_D4.buio; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x - 11, y); g.lineTo(x - 11, y - 20); g.quadraticCurveTo(x, y - 33, x + 11, y - 20); g.lineTo(x + 11, y);
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#1e2c36';
  g.beginPath();
  g.moveTo(x - 8, y - 2); g.lineTo(x - 8, y - 19); g.quadraticCurveTo(x, y - 29, x + 8, y - 19); g.lineTo(x + 8, y - 2);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(232, 201, 138, 0.4)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x - 5, y - 6); g.lineTo(x + 2, y - 21); g.stroke();
  g.beginPath(); g.moveTo(x - 1, y - 5); g.lineTo(x + 4, y - 15); g.stroke();
  // mensola del trucco con un barattolo e una piuma da cipria
  g.fillStyle = OMBRE_D4.legno; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 1;
  g.fillRect(x - 19, y, 38, 4); g.strokeRect(x - 18.5, y + 0.5, 37, 3);
  g.fillStyle = OMBRE_D4.sagoma;
  g.fillRect(x - 4, y - 4, 4, 4); g.strokeRect(x - 3.5, y - 3.5, 3, 3);
  g.fillStyle = OMBRE_D4.rosso; g.beginPath(); g.arc(x + 4, y - 2, 2, 0, TAU); g.fill();
  for (const s of [-1, 1]) { g.fillStyle = '#e9dcc0'; g.fillRect(x + s * 15 - 1, y - 8, 2, 8); }
}

/** Tutto ciò che nei Camerini non si muove, su una tela sola. */
function disegnaCameriniFermiD4(g) {
  const C = STANZE_TEATRO_D4.camerini, A = C.aspetto;
  // velo caldo e tappeto liso al centro (il premio ci sta SOPRA: vedi sopraIlTappetoD4)
  g.fillStyle = A.velo; g.fillRect(ARENA.x1 - 12, ARENA.y1 - 12, ARENA.x2 - ARENA.x1 + 24, ARENA.y2 - ARENA.y1 + 24);
  g.save();
  g.globalAlpha = 0.9;
  g.fillStyle = A.tappeto;
  g.beginPath(); g.ellipse(320, 196, 84, 34, 0, 0, TAU); g.fill();
  g.globalAlpha = 1;
  g.strokeStyle = A.cornice; g.lineWidth = 1;
  g.setLineDash([5, 3]);
  g.beginPath(); g.ellipse(320, 196, 78, 29, 0, 0, TAU); g.stroke();
  g.setLineDash([]);
  g.strokeStyle = 'rgba(176, 138, 74, 0.5)';
  for (let i = 0; i < 9; i++) { // frange consumate ai due capi
    g.beginPath(); g.moveTo(238 + (i % 3), 184 + i * 3); g.lineTo(232 - (i * 5) % 4, 185 + i * 3); g.stroke();
    g.beginPath(); g.moveTo(402 - (i % 3), 184 + i * 3); g.lineTo(408 + (i * 7) % 4, 185 + i * 3); g.stroke();
  }
  g.restore();
  for (const x of C.specchiere) specchieraD4(g, x);

  // stand dei costumi (a sinistra): sbarra su due ritti, quattro abiti appesi
  const S = C.stand;
  ombraD4(g, S.x, S.y + 13, 24, 5);
  astaD4(g, S.x - 20, S.y + 12, S.x - 20, S.y - 24, 1.6);
  astaD4(g, S.x + 20, S.y + 12, S.x + 20, S.y - 24, 1.6);
  astaD4(g, S.x - 23, S.y - 24, S.x + 23, S.y - 24, 1.6);
  const abiti = [['#5e1b26', 15], ['#1f2f4a', 19], [OMBRE_D4.sagoma, 13], ['#6b5320', 17]];
  abiti.forEach(([col, lungo], i) => {
    const ax = S.x - 15 + i * 10;
    g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(ax, S.y - 24); g.lineTo(ax, S.y - 21); g.stroke();
    sagomaD4(g, [[ax - 2, S.y - 21], [ax + 2, S.y - 21], [ax + 5, S.y - 21 + lungo], [ax - 5, S.y - 21 + lungo]], col, OMBRE_D4.lume, 0.8);
  });

  // tavolino delle parrucche (a destra): tre teste di legno, due parrucche incipriate e una rossa
  const R = C.parrucche;
  ombraD4(g, R.x, R.y + 13, 22, 5);
  astaD4(g, R.x - 14, R.y + 12, R.x - 14, R.y, 1.4);
  astaD4(g, R.x + 14, R.y + 12, R.x + 14, R.y, 1.4);
  g.fillStyle = OMBRE_D4.legno; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 1;
  g.fillRect(R.x - 19, R.y - 3, 38, 5); g.strokeRect(R.x - 18.5, R.y - 2.5, 37, 4);
  [['#e7e2d6', -12], [OMBRE_D4.rosso, 0], ['#e7e2d6', 12]].forEach(([col, dx], i) => {
    const hx = R.x + dx, hy = R.y - 12;
    g.fillStyle = OMBRE_D4.sagoma; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 0.8;
    g.fillRect(hx - 1.2, hy + 3, 2.4, 6); g.strokeRect(hx - 1.2, hy + 3, 2.4, 6);
    g.beginPath(); g.ellipse(hx, hy, 3.6, 4.4, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = col; // la parrucca: tre boccoli sopra e ai lati
    g.beginPath(); g.arc(hx, hy - 4, 3.8, 0, TAU); g.fill();
    g.beginPath(); g.arc(hx - 4, hy - 1 + (i % 2), 2.8, 0, TAU); g.fill();
    g.beginPath(); g.arc(hx + 4, hy - 1 + (i % 2), 2.8, 0, TAU); g.fill();
    if (i !== 1) { g.beginPath(); g.arc(hx - 4.5, hy + 3.5, 2.2, 0, TAU); g.fill(); g.beginPath(); g.arc(hx + 4.5, hy + 3.5, 2.2, 0, TAU); g.fill(); }
  });

  // baule dei costumi (in basso a sinistra): coperchio alzato, stoffe che escono
  const B = C.baule;
  ombraD4(g, B.x, B.y + 12, 26, 6);
  sagomaD4(g, [[B.x - 21, B.y - 12], [B.x + 21, B.y - 12], [B.x + 19, B.y - 27], [B.x - 19, B.y - 27]], OMBRE_D4.legno, OMBRE_D4.lume, 1);
  sagomaD4(g, [[B.x - 14, B.y - 8], [B.x - 4, B.y - 16], [B.x + 3, B.y - 7]], '#5e1b26', OMBRE_D4.lume, 0.8);
  sagomaD4(g, [[B.x + 2, B.y - 8], [B.x + 11, B.y - 15], [B.x + 16, B.y - 7]], '#6b5320', OMBRE_D4.lume, 0.8);
  g.fillStyle = OMBRE_D4.sagoma; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 1;
  g.fillRect(B.x - 21, B.y - 9, 42, 20); g.strokeRect(B.x - 20.5, B.y - 8.5, 41, 19);
  g.fillStyle = OMBRE_D4.oro;
  g.fillRect(B.x - 21, B.y - 9, 3, 20); g.fillRect(B.x + 18, B.y - 9, 3, 20); g.fillRect(B.x - 2, B.y - 4, 4, 5);
  sagomaD4(g, [[B.x + 8, B.y - 9], [B.x + 20, B.y - 9], [B.x + 25, B.y + 6], [B.x + 14, B.y + 2]], '#5e1b26', OMBRE_D4.lume, 0.8);

  // un manichino che resta di legno (in basso a destra)
  const M = C.manichinoFermo;
  ombraD4(g, M.x, M.y + 10, 10, 3.2);
  g.save(); g.translate(M.x, M.y + 9); sagomaManichinoD4(g, {}); g.restore();
}

/** I Camerini: arredi fermi dalla tela, fiamme delle candele vive. */
function disegnaCameriniD4(st, t) {
  const C = STANZE_TEATRO_D4.camerini;
  ctx.drawImage(telaD4('camerini', disegnaCameriniFermiD4), 0, 0, W, H);
  ctx.save();
  let i = 0;
  for (const x of C.specchiere) {
    for (const s of [-1, 1]) {
      const guizzo = Math.sin(t * 0.21 + i * 2.3) * 0.7 + Math.sin(t * 0.37 + i) * 0.4;
      const fx = x + s * 15, fy = 76;
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(fx, fy - 2, 9 + guizzo, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.ellipse(fx + guizzo * 0.3, fy - 2.4, 1.5, 3 + guizzo * 0.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.ellipse(fx + guizzo * 0.2, fy - 1.6, 0.8, 1.6, 0, 0, TAU); ctx.fill();
      i++;
    }
  }
  ctx.restore();
}

/** Corpi solidi dei Camerini (Ferruccio non attraversa baule, stand, tavolino e manichino). */
function corpiCameriniD4() {
  const C = STANZE_TEATRO_D4.camerini;
  corpoSolidoD4(C.stand); corpoSolidoD4(C.parrucche); corpoSolidoD4(C.baule); corpoSolidoD4(C.manichinoFermo);
}

/**
 * La porta di servizio: stipite di legno, tenda consunta (pieghe, orlo sfilacciato, una toppa, uno strappo)
 * e il chiodo sporgente con la punta rossa. Sostituisce i rovi di a3 su ogni porta da/verso i Camerini.
 * @param {{x:number,y:number,w:number,h:number}} p rettangolo della porta @param {number} t tick
 */
function disegnaPortaServizioD4(p, t) {
  const A = STANZE_TEATRO_D4.camerini.aspetto;
  const st = statoRun.stanzaCorrente;
  const chiusa = Boolean(st && !st.pulita);
  const x0 = p.x - p.w / 2, y0 = p.y - p.h / 2;
  ctx.save();
  ctx.fillStyle = '#0a0604'; ctx.fillRect(x0 - 5, y0 - 5, p.w + 10, p.h + 10);
  ctx.fillStyle = A.stipite; ctx.fillRect(x0 - 3, y0 - 3, p.w + 6, p.h + 6);
  ctx.fillStyle = OMBRE_D4.buio; ctx.fillRect(x0, y0, p.w, p.h);
  const pieghe = Math.max(3, Math.round(p.w / 6));
  const lp = p.w / pieghe;
  for (let i = 0; i < pieghe; i++) {
    const osc = Math.sin(t * 0.035 + i * 1.7) * 0.6;
    const strappo = i === pieghe - 2 ? p.h * 0.36 : 0;
    const orlo = y0 + p.h - 1 - ((i * 7 + 3) % 5) - strappo + osc;
    ctx.fillStyle = i % 2 ? A.tendaScura : A.tenda;
    ctx.beginPath();
    ctx.moveTo(x0 + i * lp, y0 + 1);
    ctx.lineTo(x0 + (i + 1) * lp, y0 + 1);
    ctx.lineTo(x0 + (i + 1) * lp - 0.5, orlo - 1.5);
    ctx.lineTo(x0 + (i + 0.5) * lp, orlo);
    ctx.lineTo(x0 + i * lp + 0.5, orlo - 2.2);
    ctx.closePath(); ctx.fill();
  }
  // toppa cucita
  ctx.fillStyle = A.toppa; ctx.fillRect(x0 + lp * 0.8, y0 + p.h * 0.34, 4.5, 3.5);
  ctx.fillStyle = OMBRE_D4.lume;
  ctx.fillRect(x0 + lp * 0.8, y0 + p.h * 0.34, 1, 1); ctx.fillRect(x0 + lp * 0.8 + 3.5, y0 + p.h * 0.34 + 2.5, 1, 1);
  // asta della tenda
  ctx.fillStyle = A.cornice; ctx.fillRect(x0 - 2, y0 - 1, p.w + 4, 1.6);
  // il chiodo: dallo stipite di destra verso il passaggio, la punta è rossa
  const cy = y0 + p.h * 0.55;
  ctx.strokeStyle = A.chiodo; ctx.lineWidth = 1.3; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(x0 + p.w + 2, cy - 1); ctx.lineTo(x0 + p.w - 5, cy + 1); ctx.stroke();
  ctx.fillStyle = A.chiodo; ctx.fillRect(x0 + p.w + 1, cy - 2.5, 2, 3.5);
  ctx.fillStyle = A.sangue;
  ctx.beginPath(); ctx.arc(x0 + p.w - 5, cy + 1, 1.1 + 0.25 * Math.sin(t * 0.09), 0, TAU); ctx.fill();
  if (chiusa) {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(p.x - 6, y0 + 2, 2, p.h - 4); ctx.fillRect(p.x + 4, y0 + 2, 2, p.h - 4);
  }
  ctx.strokeStyle = A.cornice; ctx.lineWidth = 1;
  ctx.strokeRect(x0 - 3.5, y0 - 3.5, p.w + 7, p.h + 7);
  ctx.restore();
}

/** Minimappa: la cella dei Camerini con lo specchio e le due candele (stessa geometria di a3). */
function minimappaCameriniD4(st) {
  const m = statoRun.mappa;
  if (!m || !st || maledizioneD('mappa')) return;
  const A = STANZE_TEATRO_D4.camerini.aspetto;
  const cell = 12, x0 = W - 118, y0 = 24, mw = 114, mh = 92;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - 5, y0 - 15, mw - 2, mh - 2); ctx.clip();
  for (const s of m.stanze) {
    if (!s.visitata || s.tipo !== 'maledetta') continue;
    const px = x0 + (s.cx - 1) * cell, py = y0 + (s.cy - 1) * cell;
    const corr = st.id === s.id;
    ctx.fillStyle = corr ? OMBRE_D4.oro : A.minimappa;
    ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
    ctx.fillStyle = corr ? '#3a2a08' : '#cfe3ea';
    ctx.strokeStyle = corr ? '#0a0604' : OMBRE_D4.lume; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(px + 6, py + 5.2, 2.3, 3.1, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = corr ? '#0a0604' : '#fbbf24';
    ctx.fillRect(px + 2, py + 7.5, 1.4, 2.5); ctx.fillRect(px + 8.6, py + 7.5, 1.4, 2.5);
  }
  ctx.restore();
}

/**
 * (correzione) Ciò che a1 disegna DENTRO la catena di disegnaStanzaPixelArt (forzieri, bombe accese) veniva
 * coperto dal fondo che a3 stende dopo: lo si ripassa sopra, in tutte le stanze di a3.
 */
function sopraIlTappetoD4(st, t) {
  if (!provaD4.sopraIlTappeto || !st || statoRun.fase !== 'in_gioco') return 0;
  let n = 0;
  if (typeof disegnaForziereA1 === 'function') for (const f of st.forzieriA1 || []) { disegnaForziereA1(f); n++; }
  if (typeof disegnaBombaAccesaA1 === 'function') for (const b of statoRun.bombeA1 || []) { disegnaBombaAccesaA1(b, t); n++; }
  return n;
}

// %%D4-TERNA%%

// %%D4-BUCA%%

// ===========================================================================
// AVVOLGIMENTI (chiamano sempre la base; altre squadre avvolgono le stesse funzioni)
// ===========================================================================

const mostraBannerBaseD4 = mostraBanner;
mostraBanner = function mostraBannerD4(testo, ...resto) {
  return mostraBannerBaseD4.call(this, SOSTITUZIONI_D4.get(testo) || testo, ...resto);
};

if (typeof pagaSangueA3 === 'function') {
  const pagaSangueA3BaseD4 = pagaSangueA3;
  pagaSangueA3 = function pagaSangueD4(costoHalf, letale, fonte, ...resto) {
    return pagaSangueA3BaseD4.call(this, costoHalf, letale, fonte === FONTE_ROVI_A3_D4 ? TESTI_D4.camerini.fonte : fonte, ...resto);
  };
}

if (typeof disegnaRoviA3 === 'function') {
  const disegnaRoviA3BaseD4 = disegnaRoviA3;
  disegnaRoviA3 = function disegnaRoviD4(p, t, ...resto) {
    try { disegnaPortaServizioD4(p, t); } catch (err) { console.error('[d4] porta di servizio', err); return disegnaRoviA3BaseD4.call(this, p, t, ...resto); }
    return undefined;
  };
}

if (typeof disegnaArrediA3 === 'function') {
  const disegnaArrediA3BaseD4 = disegnaArrediA3;
  disegnaArrediA3 = function disegnaArrediD4(st, t, ...resto) {
    let r;
    if (st && st.tipo === 'maledetta') {
      try { disegnaCameriniD4(st, t); } catch (err) { console.error('[d4] camerini', err); }
    } else r = disegnaArrediA3BaseD4.call(this, st, t, ...resto);
    try { sopraIlTappetoD4(st, t); } catch (err) { console.error('[d4] sopra il tappeto', err); }
    return r;
  };
}

if (typeof disegnaMinimappaA3 === 'function') {
  const disegnaMinimappaA3BaseD4 = disegnaMinimappaA3;
  disegnaMinimappaA3 = function disegnaMinimappaD4(st, ...resto) {
    const r = disegnaMinimappaA3BaseD4.call(this, st, ...resto);
    try { minimappaCameriniD4(st); } catch (err) { console.error('[d4] minimappa', err); }
    return r;
  };
}

const disegnaNemicoPittoricoBaseD4 = disegnaNemicoPittorico;
disegnaNemicoPittorico = function disegnaNemicoPittoricoD4(...args) {
  const conCtx = args[0] && typeof args[0].save === 'function';
  const n = conCtx ? args[1] : args[0];
  if (n && n.manichinoD4 && n.hp > 0) {
    try { disegnaManichinoD4(n, (conCtx ? args[2] : args[1]) || 0); return undefined; } catch (err) { console.error('[d4] manichino', err); }
  }
  return disegnaNemicoPittoricoBaseD4.apply(this, args);
};

const generaMappaPianoBaseD4 = generaMappaPiano;
generaMappaPiano = function generaMappaPianoD4(piano, ...resto) {
  const m = generaMappaPianoBaseD4.call(this, piano, ...resto);
  if (!m) return m;
  try {
    for (const s of m.stanze) if (s.tipo === 'maledetta') vestiCustodiD4(s, piano);
    // %%D4-GENERA%%
  } catch (err) { console.error('[d4] generazione', err); }
  return m;
};

const passoLogicoBaseD4 = passoLogico;
passoLogico = function passoLogicoD4(...args) {
  const st = statoRun.stanzaCorrente;
  const attivo = Boolean(st) && statoRun.fase === 'in_gioco' && ticksCongelati <= 0
    && !(statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo || statoRun.pausa);
  // %%D4-PRIMA-DEL-PASSO%%
  const r = passoLogicoBaseD4.apply(this, args);
  if (attivo && statoRun.fase === 'in_gioco' && statoRun.stanzaCorrente === st) {
    try {
      if (st.tipo === 'maledetta') corpiCameriniD4();
      // %%D4-DOPO-IL-PASSO%%
    } catch (err) { console.error('[d4] passo', err); }
  }
  return r;
};

// i ripari dalle ombre lunghe di b2 per gli arredi in piedi dei Camerini
if (window.__teatro && window.__teatro.interni && Array.isArray(window.__teatro.interni.ripariLuceB2)) {
  window.__teatro.interni.ripariLuceB2.push((st, aggiungi) => {
    if (!st) return;
    if (st.tipo === 'maledetta') {
      const C = STANZE_TEATRO_D4.camerini;
      aggiungi(C.stand.x, C.stand.y - 6, 26, 22); aggiungi(C.parrucche.x, C.parrucche.y - 6, 22, 18);
      aggiungi(C.baule.x, C.baule.y - 8, 26, 22); aggiungi(C.manichinoFermo.x, C.manichinoFermo.y - 12, 12, 24);
    }
    // %%D4-RIPARI%%
  });
}

// ===========================================================================
// SONDA QA (tools/qa-teatro-stanze-teatro.js)
// ===========================================================================
if (window.__teatro && window.__teatro.interni) {
  Object.assign(window.__teatro.interni, {
    STANZE_TEATRO_D4, TESTI_D4,
    stanzeTeatroD4: {
      prova: provaD4,
      sostituzioni: SOSTITUZIONI_D4,
      vestiCustodi: vestiCustodiD4,
      sopraIlTappeto: sopraIlTappetoD4,
      // %%D4-SONDA%%
    },
  });
}
