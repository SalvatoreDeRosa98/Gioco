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
  casuale: Math.random, // il caso degli indizi di Bianca (sostituibile nelle prove)
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
  // un'epoca che nasce adesso (b8 la scrive al primo salvataggio dello slot) non cancella ciò che c'era
  if (h2.cache && h2.cacheChiave === k && (h2.cache.epoca === ep || h2.cache.epoca === null)) { h2.cache.epoca = ep; return h2.cache; }
  let m = null;
  try { m = JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { m = null; }
  if (m && typeof m === 'object' && (m.epoca || null) === null) m.epoca = ep;
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
  png: Object.freeze({ attivo: true, nome: 'assunta', celle: 4, w: 34, h: 46 }), // foglio dell'autore dal 2026-11-12
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
  if (typeof filastroccaAssuntaH2 === 'function' && (assuntaH2.giro >= 1 || (Number(notte) || 1) > 1) && !biancaTrovatoH2('piazza')) {
    assuntaH2.giro++;
    return filastroccaAssuntaH2();
  }
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
// 5. BIANCA (bibbia §XI, righe 787-848). Non torna in vita e non è un boss: tre oggetti e quattro indizi.
//    Piazza Dante: la filastrocca vicino alla finestra (la indica Assunta). Villa Comunale (piano 2): la memoria
//    nel marmo e il disegno della Reggia incompleta. San Leucio (piano 3): il fazzoletto col giglio. Reggia
//    (piano 4, solo dopo gli altri tre): la scatola musicale, che suona. Uno per slot, in una stanza normale
//    già ripulita, a probabilità che cresce. Chiusura dopo il finale vero (uccisa / risparmiata).
// ===========================================================================
/** Regole degli indizi di Bianca. */
const BIANCA_H2 = Object.freeze({
  // pianoNelCiclo → luogo; prob: base e crescita per ogni notte in cui il piano è stato raggiunto senza trovarlo
  luoghi: Object.freeze({
    2: Object.freeze({ id: 'villa', prob: 0.45, crescita: 0.25 }),
    3: Object.freeze({ id: 'leucio', prob: 0.45, crescita: 0.25 }),
    4: Object.freeze({ id: 'reggia', prob: 0.6, crescita: 0.4, dopo: Object.freeze(['piazza', 'villa', 'leucio']) }),
  }),
  punti: Object.freeze([[118, 112], [522, 112], [118, 262], [522, 262]]), // angoli discreti della stanza
  raggio: 26,                 // distanza per [E]
  ritardoChiusuraTick: 120,   // in piazza, dopo il ritorno dal finale
  scatola: Object.freeze({    // la melodia della scatola musicale (Hz, durata in s)
    note: Object.freeze([[784, 0.32], [659, 0.32], [698, 0.32], [587, 0.5], [659, 0.32], [523, 0.32], [587, 0.7]]),
    volume: 0.09,
  }),
});

/**
 * Testi di Bianca. Le righe senza «NUOVO» sono della bibbia, parola per parola (Violante → Donna Luciana).
 */
const TESTI_BIANCA_H2 = Object.freeze({
  piazza: Object.freeze([
    ['assunta', "Sotto 'a fenesta 'e Mariella ce sta ancora scritta 'na filastrocca p' 'e criature. Nun l'aggio maie capita."], // NUOVO
    ['didascalia', 'Vicino a una finestra si trova una vecchia filastrocca dedicata ai bambini.'],
    ['didascalia', '«Quando il giglio si addormenta, la luna ascolta e non si lamenta.»'],
    ['didascalia', 'Non è ancora chiaro cosa significhi.'],
  ]),
  villa: Object.freeze([
    'Una memoria conservata nel marmo mostra Gregorio mentre insegna a Bianca a fare un inchino. La bambina ride e sbaglia apposta.',
    'Bianca: «Ancora! Ma stavolta fallo tu!»',
    'Il ricordo svanisce quando Gregorio cerca di prenderle la mano. A terra resta un foglio: un disegno della Reggia ancora incompleta.', // seconda frase NUOVA
  ]),
  leucio: Object.freeze([
    'Accanto ai telai si trova un piccolo fazzoletto ricamato con un giglio incompleto.',
    'Agnese spiega che Donna Luciana chiedeva spesso di riprodurre quel disegno. Agnese: «Nessuno riusciva a farlo uguale.»',
    'Agnese: «Forse perché era stato fatto da una bambina.»',
  ]),
  reggia: Object.freeze([
    'Ferruccio trova una scatola musicale. La melodia è la stessa che si sente, debolmente, durante tutti gli incontri con le statue.',
    'Donna Luciana la apre. «Aveva promesso di imparare a suonarla.» «Non ne ha avuto il tempo.»',
    'Il Velo non è stato creato per riportare Bianca in vita. È stato creato perché sua madre non potesse più provare il dolore di averla perduta.',
  ]),
  chiusura: Object.freeze({
    uccisa: Object.freeze(['Il ricordo di Bianca viene liberato. Il giglio ricamato perde la sua luce.', 'Rimane un semplice fazzoletto.']),
    risparmiata: Object.freeze(['Il giglio continua a brillare. La scatola musicale suona da sola.',
      'Donna Luciana ascolta una voce che ripete sempre lo stesso verso: «Quando il giglio si addormenta, la luna ascolta e non si lamenta.»']),
  }),
  prompt: '[E] Guarda', // NUOVO
  // la pagina «Bianca» del Diario di Ferruccio (NUOVI)
  pagina: Object.freeze({
    titolo: 'Bianca',
    piazza: 'Una filastrocca sotto la finestra di Mariella: «Quando il giglio si addormenta, la luna ascolta e non si lamenta.»',
    villa: 'Un disegno della Reggia ancora incompleta, rimasto dopo il ricordo di Gregorio e della bambina che sbagliava apposta l\'inchino.',
    leucio: 'Un piccolo fazzoletto con un giglio incompleto. Nessuno riusciva a farlo uguale.',
    reggia: 'Una piccola scatola musicale. Aveva promesso di imparare a suonarla.',
    manca: '…',
    uccisa: 'Il giglio si è spento. È rimasto un fazzoletto.',
    risparmiata: 'Il giglio brilla ancora, e la scatola suona da sola.',
  }),
  diario: (luogo) => ({ villa: 'Nel marmo della Villa ho visto ridere una bambina.', leucio: 'A San Leucio ho trovato un fazzoletto col giglio a metà.',
    reggia: 'Alla Reggia una scatola musicale ha suonato la melodia delle statue.', piazza: 'Assunta mi ha mostrato una filastrocca per bambini.' }[luogo]), // NUOVI
});

/** Memoria di Bianca dello slot: { trovati: {luogo: notte}, tentativi: {luogo: n}, chiusura: scelta|null }. */
function biancaH2() {
  const m = memoriaH2();
  if (!m.bianca || typeof m.bianca !== 'object') m.bianca = { trovati: {}, tentativi: {}, chiusura: null };
  return m.bianca;
}
/** true se l'indizio del luogo è già stato trovato nello slot. */
function biancaTrovatoH2(luogo) { return Boolean(biancaH2().trovati[luogo]); }

function segnaTrovatoH2(luogo) {
  const B = biancaH2();
  if (B.trovati[luogo]) return false;
  B.trovati[luogo] = notteH2();
  scriviMemoriaH2(memoriaH2());
  aggiornaPaginaBiancaH2();
  return true;
}

/** Battute della filastrocca per il dialogo di Assunta; segna l'indizio di Piazza Dante. */
function filastroccaAssuntaH2() {
  segnaTrovatoH2('piazza');
  return TESTI_BIANCA_H2.piazza.map(([chi, testo]) => ({ chi, testo }));
}

/** La pagina «Bianca» del Diario di Ferruccio (b8): una sola, aggiornata a ogni oggetto trovato. */
function aggiornaPaginaBiancaH2() {
  if (typeof aggiungiPaginaB8 !== 'function') return null;
  try {
    const B = biancaH2(), P = TESTI_BIANCA_H2.pagina;
    const righe = ['piazza', 'villa', 'leucio', 'reggia'].map((k) => (B.trovati[k] ? P[k] : P.manca));
    if (B.chiusura && P[B.chiusura]) righe.push(P[B.chiusura]);
    const notti = Object.values(B.trovati).map(Number).filter(Boolean);
    return aggiungiPaginaB8({ id: 'bianca-h2', notte: notti.length ? Math.max(...notti) : notteH2(), titolo: P.titolo, righe,
      esito: 'bianca', personaggio: '', data: new Date().toISOString() });
  } catch (err) { console.error('[h2] pagina Bianca', err); return null; }
}

/** Righe della pagina della notte: un oggetto di Bianca trovato stanotte (chiamata dal Diario). */
function aggiuntaDiarioH2(pagina, n) {
  const B = biancaH2();
  for (const [k, notte] of Object.entries(B.trovati)) {
    const r = Number(notte) === n ? TESTI_BIANCA_H2.diario(k) : null;
    if (r && !pagina.righe.includes(r)) pagina.righe.splice(Math.max(1, pagina.righe.length - 1), 0, r);
  }
}

/** Piano avviato: forse stanotte l'indizio del luogo è in una stanza normale. */
function preparaIndizioH2() {
  const pnc = ((statoRun.piano - 1) % 4) + 1;
  const L = BIANCA_H2.luoghi[pnc];
  if (!L || !statoRun.mappa || biancaTrovatoH2(L.id)) return null;
  if (L.id === 'villa' && typeof acquedottoAttivoD6 === 'function' && acquedottoAttivoD6()) return null; // stanotte niente Villa
  if (L.id === 'leucio' && statoRun.zonaP3) return null; // (h6/h7) stanotte il piano 3 non è San Leucio
  if (L.dopo && !L.dopo.every((k) => biancaTrovatoH2(k))) return null;
  const B = biancaH2();
  const n = B.tentativi[L.id] || 0;
  const prob = Math.min(1, L.prob + L.crescita * n);
  const stanze = statoRun.mappa.stanze.filter((s) => s.tipo === 'normale');
  if (!stanze.length) return null;
  if (h2.casuale() >= prob) { B.tentativi[L.id] = n + 1; scriviMemoriaH2(memoriaH2()); return null; }
  const st = stanze[Math.floor(h2.casuale() * stanze.length) % stanze.length];
  const [x, y] = BIANCA_H2.punti[Math.floor(h2.casuale() * BIANCA_H2.punti.length) % BIANCA_H2.punti.length];
  st.biancaH2 = { luogo: L.id, x, y, preso: false };
  return st;
}

function indizioQuiH2() {
  const st = statoRun.stanzaCorrente;
  const b = st && st.biancaH2;
  return b && !b.preso && st.pulita ? b : null;
}
function vicinoIndizioH2() {
  const b = indizioQuiH2();
  return b && Math.hypot(player.x - b.x, player.y - b.y) <= BIANCA_H2.raggio ? b : null;
}

/** [E] accanto all'oggetto di Bianca: le parole della bibbia in didascalia, l'oggetto nel Diario. */
function raccogliIndizioH2() {
  const b = vicinoIndizioH2();
  if (!b) return false;
  b.preso = true;
  if (!segnaTrovatoH2(b.luogo)) return true;
  for (const t of TESTI_BIANCA_H2[b.luogo]) didascaliaH2(t);
  if (b.luogo === 'reggia') suonaScatolaH2();
  return true;
}

/** La scatola musicale: poche note di carillon (Web Audio su AudioSys.uscita). */
function suonaScatolaH2() {
  try {
    const ac = AudioSys.ctx, out = AudioSys.uscita;
    if (!ac || !out) return false;
    let t = ac.currentTime + 0.05;
    for (const [f, d] of BIANCA_H2.scatola.note) {
      for (const [molt, vol] of [[1, 1], [2.01, 0.25]]) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = f * molt;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(BIANCA_H2.scatola.volume * vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0005, t + d * 2.2);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + d * 2.3);
      }
      t += d;
    }
    h2.ultimaScatola = performance.now();
    return true;
  } catch (err) { console.warn('[h2] scatola', err); return false; }
}

/** Disegna l'oggetto (a ombra, con un luccichio color lanterna) e la scritta [E] quando sei vicino. */
function disegnaIndizioH2(tk) {
  const b = indizioQuiH2();
  if (!b) return;
  ctx.save();
  ctx.translate(b.x, b.y);
  const luce = 0.35 + 0.25 * Math.sin(tk * 0.07);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
  g.addColorStop(0, `rgba(255, 226, 160, ${luce.toFixed(3)})`); g.addColorStop(1, 'rgba(255, 226, 160, 0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0a0604'; ctx.strokeStyle = 'rgba(249, 203, 64, 0.7)'; ctx.lineWidth = 1;
  if (b.luogo === 'villa') { // il foglio arrotolato a metà, col profilo della Reggia
    ctx.beginPath(); ctx.rect(-8, -5, 16, 10); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(249, 203, 64, 0.5)';
    ctx.beginPath(); ctx.moveTo(-6, 3); ctx.lineTo(-6, -1); ctx.lineTo(-2, -1); ctx.lineTo(-2, -3); ctx.lineTo(2, -3); ctx.lineTo(2, 0); ctx.stroke();
  } else if (b.luogo === 'leucio') { // il fazzoletto piegato, col giglio rosso a metà
    ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(0, -6); ctx.lineTo(8, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(-2, 2); ctx.lineTo(0, 1); ctx.closePath(); ctx.fill();
  } else { // la scatola musicale con la manovella
    ctx.beginPath(); ctx.rect(-7, -4, 14, 9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(10, 0); ctx.lineTo(10, -3); ctx.stroke();
    ctx.fillStyle = '#f9cb40'; ctx.fillRect(-2, -1, 4, 2);
  }
  ctx.restore();
  if (vicinoIndizioH2() && typeof drawPillLabel === 'function') drawPillLabel(TESTI_BIANCA_H2.prompt, b.x, b.y - 18, 70, { size: 7.5 });
}

/** In piazza dopo il finale vero: la chiusura dell'arco (una volta per slot, se il fazzoletto è stato trovato). */
function chiusuraBiancaH2() {
  const B = biancaH2();
  if (B.chiusura || !biancaTrovatoH2('leucio')) return false;
  let scelta = null;
  try { scelta = typeof statoB8 === 'function' ? statoB8().scelta : null; } catch (_) { scelta = null; }
  const testi = scelta && TESTI_BIANCA_H2.chiusura[scelta];
  if (!testi) return false;
  B.chiusura = scelta;
  scriviMemoriaH2(memoriaH2());
  for (const t of testi) didascaliaH2(t);
  if (scelta === 'risparmiata' && biancaTrovatoH2('reggia')) suonaScatolaH2();
  aggiornaPaginaBiancaH2();
  return true;
}

const avviaPianoBaseH2 = avviaPiano;
/** Piano avviato: forse l'indizio di Bianca del luogo. */
avviaPiano = function (...args) {
  const r = avviaPianoBaseH2.apply(this, args);
  try { preparaIndizioH2(); } catch (err) { console.error('[h2] indizio', err); }
  return r;
};

const interagisciStanzaBaseH2 = interagisciStanza;
/** [E] (tastiera, gamepad, tocco: l'azione «interagisci» di sempre): prima l'oggetto di Bianca, se sei accanto. */
interagisciStanza = function (...args) {
  try { if (raccogliIndizioH2()) return undefined; } catch (err) { console.error('[h2] raccogli', err); }
  return interagisciStanzaBaseH2.apply(this, args);
};

const disegnaStanzaPixelArtBaseH2 = disegnaStanzaPixelArt;
/** Nella stanza: l'oggetto di Bianca (sopra il pavimento). */
disegnaStanzaPixelArt = function (...args) {
  const r = disegnaStanzaPixelArtBaseH2.apply(this, args);
  try { if (statoRun.fase === 'in_gioco') disegnaIndizioH2(tick); } catch (err) { console.error('[h2] disegno indizio', err); }
  return r;
};

const passoLogicoBaseH2 = passoLogico;
/** In piazza: la chiusura dell'arco di Bianca, qualche istante dopo il ritorno dal finale. */
passoLogico = function (...args) {
  const r = passoLogicoBaseH2.apply(this, args);
  try {
    if (statoRun.fase === 'hub') {
      h2.inPiazza = (h2.inPiazza || 0) + 1;
      if (h2.inPiazza === BIANCA_H2.ritardoChiusuraTick) chiusuraBiancaH2();
    } else h2.inPiazza = 0;
  } catch (err) { console.error('[h2] chiusura', err); }
  return r;
};

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
  bianca: () => JSON.parse(JSON.stringify(biancaH2())),
  fissaCaso(v) { h2.casuale = v == null ? Math.random : () => v; },
  preparaIndizio: () => { const st = preparaIndizioH2(); return st ? { id: st.id, ...st.biancaH2 } : null; },
  get vicino() { return Boolean(vicinoIndizioH2()); },
  chiusura: chiusuraBiancaH2,
  get ultimaScatola() { return h2.ultimaScatola || 0; },
  TESTI: TESTI_H2,
};

// Il foglio di Assunta si carica all'avvio: in piazza è già pronto.
try { if (ASSUNTA_H2.png.attivo && typeof getSpriteTeatro === 'function') getSpriteTeatro(ASSUNTA_H2.png.nome); } catch (_) { /* si disegna sul canvas */ }
