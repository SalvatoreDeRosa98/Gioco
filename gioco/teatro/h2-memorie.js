/**
 * teatro/h2-memorie.js — (squadra h2) LE MEMORIE: tre cose di trama che la bibbia prevede.
 *
 *   1. LE RIVELAZIONI DEI BOSS (bibbia §XII, righe 849-867). Alla caduta di ogni boss di piano (POOL_BOSS di
 *      00-config.js, la rosa di b6-boss.js, il Guardiano di d6-acquedotto.js; NON Donna Luciana né il Grande
 *      Burattinaio) il corpo si dissolve in piccole anime colorate che salgono piano e svaniscono. La prima
 *      volta per slot che cade un certo boss: una didascalia con la sua rivelazione. Dopo tre rivelazioni
 *      diverse, una volta sola, la riga «non erano mostri». Le rivelazioni lette restano nel Registro di Scena
 *      (d3, Primi attori: aggancio `rivelazioneRegistroH2`) e nel Diario di Ferruccio di quella notte.
 *      Il Guardiano ha già le sue anime (d6): qui riceve solo la rivelazione.
 *
 * Agganci: avvolge verificaStanzaPulita (dopo d6), disegnaHUDPixelArt (le anime, sotto l'HUD), componiPaginaB8.
 * Salvataggio: localStorage `ferruccio.teatro.memorieH2.<slot>` → { epoca, rivelazioni: {id: notte}, svolta }.
 * L'«epoca» è quella di b8: uno slot cancellato e ricominciato non ricorda le rivelazioni vecchie.
 */

// ===========================================================================
// 0. NUMERI E TESTI
// ===========================================================================
/** Numeri delle anime che salgono (tutti in tick logici). */
const ANIME_H2 = Object.freeze({
  numero: 16,            // anime per boss (metà se OPZIONI.lampi è spento)
  durataTick: 150,       // vita di un'anima (≈ 2,5 s a 60 tick/s)
  scaglionaTick: 4,      // ritardo fra la partenza di un'anima e la successiva
  salita: 0.42,          // px per tick verso l'alto
  ondeggio: 5,           // ampiezza dell'ondeggiare laterale (px)
  sparsoX: 26, sparsoY: 22, // da dove partono, attorno al corpo
  raggio: 2.3,
  maxVive: 64,
  coloriPerBoss: Object.freeze({
    're-gatto': Object.freeze(['#fde68a', '#fca5a5', '#fbcfe8', '#fef3c7']),
    'regina-vespa': Object.freeze(['#fcd34d', '#fdba74', '#fef08a', '#fde68a']),
    'colosso-statua': Object.freeze(['#e0f2fe', '#bfdbfe', '#f5f5f4', '#c7d2fe']),
    'tessitrice-pietra': Object.freeze(['#fecaca', '#f9a8d4', '#fde68a', '#fef2f2']),
  }),
  coloriComuni: Object.freeze(['#fde68a', '#a7f3d0', '#bfdbfe', '#fbcfe8', '#fed7aa']),
  // il corpo che sbiadisce: un alone color lanterna che si spegne sul punto in cui è caduto
  alone: Object.freeze({ durataTick: 70, raggio: 30, colore: 'rgba(255, 214, 140, ' }),
});

/** Regole delle rivelazioni. */
const RIVELAZIONI_H2 = Object.freeze({
  chiave: 'ferruccio.teatro.memorieH2', // + '.' + slot
  sogliaSvolta: 3,                       // rivelazioni diverse prima della riga «non erano mostri»
  pianoFinale: 4,                        // il piano del ciclo di Donna Luciana: nessuna rivelazione qui
});

/**
 * TESTI_H2 — tutti i testi a schermo di h2.
 * rivelazioni: per i quattro boss della bibbia (§XII) il contenuto della tabella, scritto come didascalia;
 *   per gli altri (NUOVI, da approvare) una persona o un ricordo di Caserta dietro la marionetta.
 */
const TESTI_H2 = Object.freeze({
  rivelazioni: Object.freeze({
    // --- dalla bibbia (§XII) ---
    're-gatto': 'Dal Gatto salgono una culla, un mestolo, una ninna nanna: ricordi di casa rubati alle famiglie. Le creature d\'ombra custodiscono qualcosa di umano.',
    'regina-vespa': 'Le vespe portavano promesse mai mantenute dei lavori della Reggia. Desideri rubati, trascinati verso il palazzo.',
    'colosso-statua': 'Il marmo custodiva gli operai morti al cantiere. Nel loro ricordo Gaetano non causò l\'incidente: tentò di salvare gli altri.',
    'tessitrice-pietra': 'La guardiana dei telai si scioglie in fili di seta. Il Velo nasce dalla seta, e il giglio lega i guardiani a Donna Luciana.',
    // --- NUOVI (non nella bibbia) ---
    'capitano-guardia': 'Sotto il piombo c\'era una guardia di Palazzo che fece il turno di notte per trent\'anni. Il Velo gli ha lasciato solo la ronda.',
    'maestro-fucina': 'L\'ottone ricorda un garzone di bottega che affilava forbici in Via San Carlo. Tagliava i fili perché nessuno gli aveva insegnato a cucirli.',
    'lampionaio': 'Era l\'uomo che accendeva i lumi di Corso Trieste ogni sera. Quando Caserta si è addormentata, ha continuato ad accenderli per nessuno.',
    'cigno-latta': 'Il cigno era un giocattolo di latta, regalo di un padre a una bambina della Villa. La bambina è cresciuta; il cigno no.',
    'giostra-lucciole': 'La giostra girava per i bambini della festa del 1845. Le lucciole sono le risate di quella sera, chiuse dentro.',
    'guardiano-acque': 'Il Guardiano ha la voce degli scalpellini dell\'Acquedotto: tufo e acqua per la Reggia, e i nomi di chi c\'è rimasto sotto.',
  }),
  svolta: 'Ferruccio guarda le anime salire. Non erano mostri. Erano quello che resta di Caserta, e lui li sta lasciando andare.', // NUOVO
  registroEtichetta: 'Rivelazione: ', // NUOVO (prefisso nella scheda del Registro)
  diario: (nome, testo) => `Quando ${nome} è caduto, ho capito una cosa: ${testo.charAt(0).toLowerCase()}${testo.slice(1)}`, // NUOVO
  diarioSvolta: 'Stanotte ho smesso di chiamarli mostri.', // NUOVO
});

// ===========================================================================
// 1. STATO E SALVATAGGIO
// ===========================================================================
const h2 = {
  anime: [],   // { x, y, t0, fase, colore, r }
  aloni: [],   // { x, y, t0 }
  cache: null, cacheChiave: null,
};

function slotH2() {
  const sv = window.__teatroT3 && window.__teatroT3.salvataggi;
  return sv && sv.slotAttivo != null ? sv.slotAttivo : 0;
}
function epocaH2() {
  try { return typeof statoB8 === 'function' ? (statoB8().epoca || null) : null; } catch (_) { return null; }
}
function chiaveH2() { return `${RIVELAZIONI_H2.chiave}.${slotH2()}`; }

/**
 * Memoria dello slot attivo: { epoca, rivelazioni: {bossId: notte}, svolta: notte|0, bianca: {...} }.
 * @returns {object}
 */
function memoriaH2() {
  const k = chiaveH2();
  const ep = epocaH2();
  if (h2.cache && h2.cacheChiave === k && h2.cache.epoca === ep) return h2.cache;
  let m = null;
  try { m = JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { m = null; }
  if (!m || typeof m !== 'object' || (m.epoca || null) !== ep) m = { epoca: ep, rivelazioni: {}, svolta: 0 };
  if (!m.rivelazioni || typeof m.rivelazioni !== 'object') m.rivelazioni = {};
  h2.cache = m; h2.cacheChiave = k;
  return m;
}
function scriviMemoriaH2(m) {
  h2.cache = m; h2.cacheChiave = chiaveH2();
  try { localStorage.setItem(h2.cacheChiave, JSON.stringify(m)); } catch (_) { /* memoria negata: vale per la sessione */ }
}
function notteH2() { try { return getNumeroNotte(); } catch (_) { return 1; } }

// ===========================================================================
// 2. LE ANIME CHE SALGONO
// ===========================================================================
/** true se il boss è uno dei «boss di piano» liberati (ha una rivelazione in TESTI_H2). */
function bossDiPianoH2(n) { return Boolean(n && n.boss && TESTI_H2.rivelazioni[n.bossId]); }

/**
 * Fa salire le anime dal corpo del boss caduto. Non blocca nulla: sono solo disegni.
 * @param {object} b nemico boss (x, y, bossId)
 */
function liberaAnimeH2(b) {
  const A = ANIME_H2;
  const pocheLuci = typeof OPZIONI === 'object' && OPZIONI && OPZIONI.lampi === false;
  const n = pocheLuci ? Math.ceil(A.numero / 2) : A.numero;
  const colori = A.coloriPerBoss[b.bossId] || A.coloriComuni;
  for (let k = 0; k < n; k++) {
    const u = (k * 0.618034) % 1, v = (k * 0.381966 + 0.25) % 1; // sparso deterministico
    h2.anime.push({ x: b.x + (u - 0.5) * 2 * A.sparsoX, y: b.y - 4 + (v - 0.5) * 2 * A.sparsoY,
      t0: tick + k * A.scaglionaTick, fase: k * 1.37, colore: colori[k % colori.length], r: A.raggio * (0.75 + 0.5 * v) });
  }
  if (h2.anime.length > A.maxVive) h2.anime.splice(0, h2.anime.length - A.maxVive);
  if (!pocheLuci) h2.aloni.push({ x: b.x, y: b.y, t0: tick });
}

/** Disegna (e consuma) anime e aloni; chiamato sotto l'HUD. */
function disegnaAnimeH2() {
  const A = ANIME_H2;
  const st = statoRun.stanzaCorrente;
  if (!st || st.tipo !== 'boss' || statoRun.fase !== 'in_gioco') { h2.anime.length = 0; h2.aloni.length = 0; return; }
  ctx.save();
  for (let i = h2.aloni.length - 1; i >= 0; i--) {
    const a = h2.aloni[i], eta = tick - a.t0;
    if (eta > A.alone.durataTick) { h2.aloni.splice(i, 1); continue; }
    const f = 1 - eta / A.alone.durataTick;
    const g = ctx.createRadialGradient(a.x, a.y, 2, a.x, a.y, A.alone.raggio * (1 + 0.4 * (1 - f)));
    g.addColorStop(0, `${A.alone.colore}${(0.45 * f).toFixed(3)})`);
    g.addColorStop(1, `${A.alone.colore}0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(a.x, a.y, A.alone.raggio * 1.4, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = h2.anime.length - 1; i >= 0; i--) {
    const p = h2.anime[i], eta = tick - p.t0;
    if (eta < 0) continue;
    if (eta > A.durataTick) { h2.anime.splice(i, 1); continue; }
    const f = eta / A.durataTick;
    const x = p.x + Math.sin(eta * 0.06 + p.fase) * A.ondeggio * (0.4 + f);
    const y = p.y - eta * A.salita * (1 - 0.35 * f);
    const alfa = f < 0.12 ? f / 0.12 : 1 - (f - 0.12) / 0.88;
    ctx.globalAlpha = Math.max(0, alfa) * 0.35;
    ctx.fillStyle = p.colore;
    ctx.beginPath(); ctx.arc(x, y, p.r * 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = Math.max(0, alfa);
    ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath(); ctx.arc(x, y - p.r * 0.3, p.r * 0.4, 0, Math.PI * 2); ctx.fill();
    // una scia breve, verso il basso: salgono
    ctx.strokeStyle = p.colore; ctx.lineWidth = 1; ctx.globalAlpha = Math.max(0, alfa) * 0.5;
    ctx.beginPath(); ctx.moveTo(x, y + p.r); ctx.quadraticCurveTo(x + Math.sin(eta * 0.1 + p.fase) * 3, y + p.r * 3, x, y + p.r * 5); ctx.stroke();
  }
  ctx.restore();
}

// ===========================================================================
// 3. LA RIVELAZIONE (prima caduta per slot) E LA SVOLTA
// ===========================================================================
function didascaliaH2(testo) {
  if (typeof notaDidB8 === 'function') notaDidB8(testo);
  else if (typeof mostraBanner === 'function') mostraBanner(testo, 300);
}

/**
 * Boss di piano caduto: anime (salvo il Guardiano, che ha le sue), e la rivelazione se è la prima volta nello slot.
 * @returns {string|null} il testo della rivelazione mostrata, o null
 */
function bossLiberatoH2(st, b) {
  if (!bossDiPianoH2(b) || b.liberatoH2) return null;
  b.liberatoH2 = true;
  const pnc = ((statoRun.piano - 1) % 4) + 1;
  if (pnc === RIVELAZIONI_H2.pianoFinale) return null;
  const dalD6 = typeof SCHEDA_D6 === 'object' && SCHEDA_D6 && b.bossId === SCHEDA_D6.id;
  if (!dalD6) liberaAnimeH2(b);
  const m = memoriaH2();
  if (m.rivelazioni[b.bossId]) return null;
  m.rivelazioni[b.bossId] = notteH2();
  const testo = TESTI_H2.rivelazioni[b.bossId];
  didascaliaH2(testo);
  if (!m.svolta && Object.keys(m.rivelazioni).length >= RIVELAZIONI_H2.sogliaSvolta) {
    m.svolta = notteH2();
    didascaliaH2(TESTI_H2.svolta);
  }
  scriviMemoriaH2(m);
  return testo;
}

const verificaStanzaPulitaBaseH2 = verificaStanzaPulita;
/** Stanza del boss ripulita: libera le anime del boss di piano e, la prima volta, la sua rivelazione. */
verificaStanzaPulita = function (...args) {
  const st = statoRun.stanzaCorrente;
  const era = Boolean(st && st.pulita);
  const r = verificaStanzaPulitaBaseH2.apply(this, args);
  try {
    if (st && !era && st.pulita && st.tipo === 'boss') {
      for (const n of st.nemici) if (bossDiPianoH2(n) && n.hp <= 0) bossLiberatoH2(st, n);
    }
  } catch (err) { console.error('[h2] boss', err); }
  return r;
};

const disegnaHUDPixelArtBaseH2 = disegnaHUDPixelArt;
/** Sotto l'HUD: le anime che salgono dal boss caduto. */
disegnaHUDPixelArt = function (...args) {
  try { if (h2.anime.length || h2.aloni.length) disegnaAnimeH2(); } catch (err) { console.error('[h2] anime', err); }
  return disegnaHUDPixelArtBaseH2.apply(this, args);
};

/**
 * Aggancio del Registro di Scena (d3, scheda di un Primo attore): mette davanti la rivelazione letta.
 * @param {string} id bossId · @param {string[]} righe righe già pronte della scheda
 * @returns {string[]}
 */
function rivelazioneRegistroH2(id, righe) {
  try {
    const m = memoriaH2();
    if (!m.rivelazioni[id] || !TESTI_H2.rivelazioni[id]) return righe;
    return [TESTI_H2.registroEtichetta + TESTI_H2.rivelazioni[id], ...righe.filter(Boolean).slice(0, 1)];
  } catch (_) { return righe; }
}

function nomeBossH2(id) {
  try {
    const b = POOL_BOSS.find((x) => x.id === id) || (typeof SCHEDE_B6 === 'object' && SCHEDE_B6[id]) || null;
    return b ? String(b.nome).split(' — ')[0] : 'il guardiano';
  } catch (_) { return 'il guardiano'; }
}

// Diario di Ferruccio (b8): una riga per rivelazione letta in quella notte, e la svolta.
if (typeof componiPaginaB8 === 'function') {
  const componiPaginaBaseH2 = componiPaginaB8;
  componiPaginaB8 = function (v, ...resto) {
    const pagina = componiPaginaBaseH2.call(this, v, ...resto);
    try {
      if (pagina && Array.isArray(pagina.righe)) {
        const m = memoriaH2();
        const n = Number(pagina.notte) || 0;
        const nuove = [];
        for (const [id, notte] of Object.entries(m.rivelazioni)) {
          if (Number(notte) === n && TESTI_H2.rivelazioni[id]) nuove.push(TESTI_H2.diario(nomeBossH2(id), TESTI_H2.rivelazioni[id]));
        }
        if (Number(m.svolta) === n) nuove.push(TESTI_H2.diarioSvolta);
        const dove = Math.max(1, pagina.righe.length - 1); // prima della chiusa
        for (const r of nuove) if (!pagina.righe.includes(r)) pagina.righe.splice(dove, 0, r);
        aggiuntaDiarioH2(pagina, n);
      }
    } catch (err) { console.error('[h2] diario', err); }
    return pagina;
  };
}
/** Posto per le righe della parte 2 (Bianca) nella pagina del Diario. */
function aggiuntaDiarioH2() { /* vedi sotto */ }

// ===========================================================================
// 4. ASSUNTA (al posto della «festaiola» di t4): la popolana che con Tonino introduce la bottega di Gaetano
//    (trama/inizio-memoria-e-doni.md). In piazza dalla prima notte. Aggancio in t4-hub-storia.js:
//    assuntaInPiazzaH2 (presenze), battuteAssuntaH2 (dialogo), disegnaAssuntaH2 (figura).
// ===========================================================================
/** Numeri di Assunta. */
const ASSUNTA_H2 = Object.freeze({
  daNotte: 1,
  // PNG facoltativo: assets/sprite_teatro/assunta.png, una riga di 4 pose (ferma, scialle, ventaglio, cesto),
  // celle 96×128, piedi in basso al centro. `png: true` quando l'autore lo aggiunge (evita la richiesta a vuoto).
  png: Object.freeze({ attivo: false, nome: 'assunta', celle: 4, w: 34, h: 46 }),
  gesto: Object.freeze({ cicloTick: 420, scialle: Object.freeze([40, 110]), ventaglio: Object.freeze([230, 330]) }),
  tinte: Object.freeze({
    ombra: '#0a0604', panno: '#1f1510', scialle: '#2b1d16', frangia: '#4a3526', piega: '#3a2a1c',
    volto: '#c9a679', cesto: '#3d2b1a', vimini: '#6b4f33', contorno: 'rgba(249, 203, 64, 0.55)',
    coccarda: '#b91c1c', coccardaCuore: '#f9cb40',
  }),
});

/**
 * Battute di Assunta (tutte NUOVE: la bibbia non le scrive). Si sceglie il gruppo per sigilli rotti della
 * porta (interni.sigilli) e notte; dentro il gruppo ruotano.
 */
const TESTI_ASSUNTA_H2 = Object.freeze({
  nome: 'Assunta',
  notte1: Object.freeze([
    ['assunta', "Tu si' 'o guaglione nuovo d'a piazza? Chella porta llà è 'a bottega 'e Gaetano, 'o fabbro. Da 'a sera d'a festa nun s'è aperta cchiù."],
    ['didascalia', 'Ha ancora la coccarda della festa appuntata allo scialle. Il cesto è pieno di nastri che nessuno ha comprato.'],
  ]),
  notti: Object.freeze([
    Object.freeze([['assunta', "'A sera d'a festa, 'o '45, stèvemo tutte a ballà. Po' 'e lanterne se so' fermate, e Caserta s'è addurmuta cu 'o sorriso 'nfaccia."]]),
    Object.freeze([['assunta', "Gaetano batteva 'o fierro pure 'e notte. Tonino 'o sape: si 'o martello se sente ancora, vuol dire ca isso nun s'è scurdato."]]),
    Object.freeze([['assunta', "Vennevo nastri p' 'a festa. Mo' 'e tengo tutte cca: nisciuno se ricorda cchiù 'e se fa' bello."]]),
  ]),
  sigilli12: Object.freeze([['assunta', "Hê rotto 'nu sigillo d' 'a bottega? Mamma mia... 'o giglio 'ncopp' 'a ceralacca è chillo d' 'a Reggia. Statte accorto, guagliò."]]),
  sigilli3: Object.freeze([['assunta', "Tre sigilli 'nterra. Io 'o sento, 'o martello: tre colpe, 'na pausa, uno. Gaetano te sta aspettanno."]]),
});
const assuntaH2 = { giro: 0 };

/** true se Assunta sta in piazza stanotte (dalla notte ASSUNTA_H2.daNotte). */
function assuntaInPiazzaH2(notte) { return (Number(notte) || 1) >= ASSUNTA_H2.daNotte; }

function sigilliH2() {
  try { const I = window.__teatro && window.__teatro.interni; return Math.max(0, Math.min(3, Number(I && I.sigilli) || 0)); } catch (_) { return 0; }
}

/**
 * Battute di Assunta per il dialogo di t4 (array di {chi, testo}).
 * @param {object} flag flag della storia (non usati per ora) · @param {number} notte
 */
function battuteAssuntaH2(flag, notte) {
  const T = TESTI_ASSUNTA_H2;
  const s = sigilliH2();
  let righe;
  if (s >= 3) righe = T.sigilli3;
  else if (s >= 1 && assuntaH2.giro % 2 === 0) righe = T.sigilli12;
  else if ((Number(notte) || 1) <= 1 && assuntaH2.giro === 0) righe = T.notte1;
  else righe = T.notti[(assuntaH2.giro + (Number(notte) || 1)) % T.notti.length];
  assuntaH2.giro++;
  return righe.map(([chi, testo]) => ({ chi, testo }));
}

/** Posa del gesto nel ciclo: 'ferma' | 'scialle' | 'ventaglio' e la sua fase 0..1. */
function posaAssuntaH2(t) {
  const G = ASSUNTA_H2.gesto, k = ((t % G.cicloTick) + G.cicloTick) % G.cicloTick;
  if (k >= G.scialle[0] && k < G.scialle[1]) return { posa: 'scialle', u: (k - G.scialle[0]) / (G.scialle[1] - G.scialle[0]), col: 1 };
  if (k >= G.ventaglio[0] && k < G.ventaglio[1]) return { posa: 'ventaglio', u: (k - G.ventaglio[0]) / (G.ventaglio[1] - G.ventaglio[0]), col: 2 };
  return { posa: 'ferma', u: 0, col: 0 };
}

/**
 * Disegna Assunta a sagoma d'ombra: fazzoletto annodato, scialle con la frangia, gonna a pieghe che si muovono
 * appena, cesto al braccio, la coccarda rossa come unico colore; ogni tanto si sistema lo scialle o si sventola.
 * Se c'è il PNG (ASSUNTA_H2.png.attivo) usa quello.
 * @returns {boolean} true se ha disegnato
 */
function disegnaAssuntaH2(c, x, y, t) {
  const K = ASSUNTA_H2.tinte;
  const P = posaAssuntaH2(t);
  c.save();
  c.fillStyle = 'rgba(8, 5, 3, 0.6)';
  c.beginPath(); c.ellipse(x, y + 10, 13, 4, 0, 0, Math.PI * 2); c.fill();
  const g = ASSUNTA_H2.png;
  if (g.attivo && typeof disegnaCellaTeatro === 'function'
    && disegnaCellaTeatro(c, g.nome, P.col, g.celle, x - g.w / 2, y + 11 - g.h, g.w, g.h)) { c.restore(); return true; }
  c.translate(Math.round(x), Math.round(y));
  const resp = Math.sin(t * 0.045) * 0.6;           // il respiro
  const onda = (i) => Math.sin(t * 0.05 + i * 1.3) * 0.9; // le pieghe della gonna
  // --- il contorno color lanterna: le sagome esterne disegnate un poco più larghe ---
  const gonna = () => {
    c.beginPath(); c.moveTo(-6, -8);
    c.quadraticCurveTo(-10, 0, -12 + onda(0), 10);
    for (let i = 1; i <= 4; i++) c.lineTo(-12 + i * 6 + onda(i) * 0.6, 10 + (i % 2 ? 1 : 0));
    c.quadraticCurveTo(10, 0, 6, -8); c.closePath();
  };
  const busto = () => { c.beginPath(); c.moveTo(-5, -9); c.lineTo(-6, -20 + resp); c.lineTo(6, -20 + resp); c.lineTo(5, -9); c.closePath(); };
  const testa = () => { c.beginPath(); c.ellipse(0, -27 + resp, 4.6, 5.6, 0, 0, Math.PI * 2); };
  const alzaScialle = P.posa === 'scialle' ? Math.sin(P.u * Math.PI) : 0;
  const scialle = () => {
    c.beginPath(); c.moveTo(-8, -18 + resp);
    c.quadraticCurveTo(-9, -12, -4, -6 - alzaScialle * 2);
    c.lineTo(0, -4); c.lineTo(4, -6);
    c.quadraticCurveTo(9, -12, 8, -18 + resp);
    c.quadraticCurveTo(0, -23 + resp, -8, -18 + resp); c.closePath();
  };
  c.strokeStyle = K.contorno; c.lineWidth = 2; c.lineJoin = 'round';
  for (const f of [gonna, busto, scialle, testa]) { f(); c.stroke(); }
  // gonna e pieghe
  c.fillStyle = K.ombra; gonna(); c.fill();
  c.strokeStyle = K.piega; c.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) { const px = -6 + i * 4; c.beginPath(); c.moveTo(px * 0.6, -6); c.quadraticCurveTo(px + onda(i) * 0.5, 2, px * 1.5 + onda(i), 9.5); c.stroke(); }
  // grembiule scuro
  c.fillStyle = K.panno; c.beginPath(); c.moveTo(-4, -7); c.lineTo(-6, 7); c.lineTo(6, 7); c.lineTo(4, -7); c.closePath(); c.fill();
  // busto
  c.fillStyle = K.ombra; busto(); c.fill();
  // cesto al braccio sinistro (di chi guarda: a sinistra)
  c.fillStyle = K.cesto; c.strokeStyle = K.vimini; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(-17, -8); c.lineTo(-7, -8); c.lineTo(-8.5, -2); c.lineTo(-15.5, -2); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-16, -6); c.lineTo(-8, -6); c.moveTo(-15.6, -4); c.lineTo(-8.4, -4); c.stroke();
  c.beginPath(); c.arc(-12, -8, 4.5, Math.PI, 0); c.stroke(); // il manico
  c.fillStyle = K.frangia; c.fillRect(-15, -10, 2, 2); c.fillRect(-11, -11, 2, 3); // nastri nel cesto
  // scialle con la frangia
  c.fillStyle = K.scialle; scialle(); c.fill();
  c.strokeStyle = K.frangia; c.lineWidth = 0.7;
  for (let i = -3; i <= 3; i++) { const fx = i * 1.3; c.beginPath(); c.moveTo(fx, -5 + Math.abs(i) * -0.4); c.lineTo(fx + Math.sin(t * 0.06 + i) * 0.6, -2.5 + Math.abs(i) * -0.4); c.stroke(); }
  // braccio destro: a riposo sul grembiule, oppure sullo scialle, oppure col ventaglio davanti al viso
  c.fillStyle = K.ombra;
  let mx = 5, my = -7;
  if (P.posa === 'scialle') { mx = 7 - alzaScialle * 3; my = -8 - alzaScialle * 9; }
  else if (P.posa === 'ventaglio') { mx = 9; my = -20 + resp; }
  c.strokeStyle = K.ombra; c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(6, -17 + resp); c.quadraticCurveTo(9, -12, mx, my); c.stroke();
  if (P.posa === 'ventaglio') {
    const a = Math.sin(P.u * Math.PI * 8) * 0.35;
    c.save(); c.translate(mx, my); c.rotate(-0.6 + a);
    c.fillStyle = K.ombra; c.strokeStyle = K.contorno; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 6, -Math.PI * 0.9, -Math.PI * 0.2); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
  c.fillStyle = K.ombra; c.beginPath(); c.arc(mx, my, 1.6, 0, Math.PI * 2); c.fill();
  // testa: volto e fazzoletto annodato
  c.fillStyle = K.volto; testa(); c.fill();
  c.fillStyle = K.ombra;
  c.beginPath(); c.moveTo(-5.6, -26 + resp); c.quadraticCurveTo(-6, -34 + resp, 0, -34 + resp);
  c.quadraticCurveTo(6, -34 + resp, 5.6, -25 + resp); c.quadraticCurveTo(0, -29 + resp, -5.6, -25 + resp); c.fill();
  c.beginPath(); c.moveTo(-5.4, -25 + resp); c.lineTo(-7.5, -19 + resp); c.lineTo(-3.5, -22 + resp); c.closePath(); c.fill(); // la falda dietro
  // il nodo, dietro la nuca: due cocche che pendono di lato
  c.beginPath(); c.moveTo(-5, -28 + resp); c.lineTo(-9.5, -26 + resp); c.lineTo(-8, -23.5 + resp); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-5, -28 + resp); c.lineTo(-8.5, -30.5 + resp); c.lineTo(-9.5, -27.5 + resp); c.closePath(); c.fill();
  c.strokeStyle = K.contorno; c.lineWidth = 0.6;
  c.beginPath(); c.moveTo(-9.5, -26 + resp); c.lineTo(-8, -23.5 + resp); c.moveTo(-8.5, -30.5 + resp); c.lineTo(-9.5, -27.5 + resp); c.stroke();
  c.fillRect(-2.4, -26 + resp, 1.2, 1.2); c.fillRect(1.2, -26 + resp, 1.2, 1.2); // occhi aperti, fissi
  c.fillRect(-1, -23.5 + resp, 2, 0.8);
  // la coccarda della festa: l'unico colore
  c.fillStyle = K.coccarda; c.beginPath(); c.arc(-3, -15 + resp, 2.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = K.coccardaCuore; c.beginPath(); c.arc(-3, -15 + resp, 0.9, 0, Math.PI * 2); c.fill();
  c.fillStyle = K.coccarda; c.fillRect(-4, -13 + resp, 0.9, 2.5); c.fillRect(-2.8, -13 + resp, 0.9, 2.2);
  c.restore();
  return true;
}

// ===========================================================================
// 9. QA
// ===========================================================================
if (Object.isFrozen(window.__teatro)) {
  window.__teatro = Object.defineProperties({}, Object.getOwnPropertyDescriptors(window.__teatro));
}
window.__teatro.h2 = {
  get anime() { return h2.anime.length; },
  memoria: () => JSON.parse(JSON.stringify(memoriaH2())),
  azzera() { try { localStorage.removeItem(chiaveH2()); } catch (_) { /* idem */ } h2.cache = null; h2.anime.length = 0; },
  rivelazioneRegistro: rivelazioneRegistroH2,
  TESTI: TESTI_H2,
};
