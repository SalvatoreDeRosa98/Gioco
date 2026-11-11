/*
 * teatro/00-config.js — Costanti, contesto del canvas, FEEL, palette e tabelle di gioco (stanze, personaggi, patto, cataloghi oggetti, boss, economia, notti).
 * Script classico (niente moduli ES): le dichiarazioni di primo livello stanno nello scope globale
 * condiviso con gli altri file di teatro/. Ordine di caricamento e regole: teatro/LEGGIMI.md.
 */

const W = 640, H = 360, TAU = Math.PI * 2;

const canvas = document.getElementById('c');

const ctx = canvas.getContext('2d');

ctx.imageSmoothingEnabled = false;

const wrap = document.getElementById('wrap');

// ===========================================================================
// (T5) RISOLUZIONE INTERNA ALTA
// La logica ragiona sempre in 640x360 (W, H, ARENA, posizioni, collisioni, velocità invariati).
// Il buffer del canvas è la dimensione reale a schermo × devicePixelRatio, arrotondata in su al
// multiplo intero di 640 (scala intera: la pixel-art resta a griglia regolare), con tetto
// RISOLUZIONE.bufferMaxL × bufferMaxA. Ogni frame parte da ctx.setTransform(scalaBase, …): ogni
// save/restore del frame (scossa compresa) torna a questa scala base, mai all'identità.
// ===========================================================================
const RISOLUZIONE = Object.freeze({
  bufferMaxL: 3840, // tetto del buffer (3840x2160)
  bufferMaxA: 2160,
  scalaIntera: true, // arrotonda la scala all'intero superiore: pixel netti, nessun pixel doppio irregolare
});

let scalaBase = 1;
/**
 * Ricalcola il buffer del canvas dalla sua dimensione a schermo (CSS dell'autore) × devicePixelRatio.
 * Chiamata all'avvio, al resize, al cambio di schermo intero e da ResizeObserver.
 */

// ===========================================================================
// FEEL (roadmap «Novità nel Teatro», passo T1): tutti i numeri nuovi di passo fisso, colpi, scossa,
// macchie e fili stanno qui. Riferimenti del motore: motore/fondazione/ciclo.js + tempo.js (passo fisso,
// congela), motore/resa/feel.js, motore/resa/fili.js, contenuti/parametri/resa.json (stessi valori base).
// ===========================================================================
const FEEL = Object.freeze({
  passo: Object.freeze({
    hz: 60,              // la logica avanza sempre a 60 tick al secondo, qualunque sia il refresh dello schermo
    maxTickPerFrame: 5,  // tetto di tick per frame: dopo un blocco lungo il gioco non "recupera" a raffica
    maxDeltaMs: 250,     // un frame più lungo di così (scheda in background) conta come 250 ms
  }),
  iframes: Object.freeze({
    durataMs: 1000,      // invulnerabilità dopo un colpo subito (prima: 52 tick ≈ 867 ms)
    alpha: 0.4,          // lampeggio: alpha della sagoma nelle semionde "spente" (resa.lampeggio.alpha)
    semiperiodoMs: 66,   // durata di ogni semionda del lampeggio (resa.lampeggio.semiperiodo_ms)
    rimbalzoPx: 14,      // il giocatore colpito rimbalza all'indietro (lontano dalla fonte) di tanti px in tutto
  }),
  hitstop: Object.freeze({
    colpoMs: 40,         // colpo a segno su un nemico: la logica si ferma, la resa no
    uccisioneMs: 60,     // colpo che uccide; due richieste insieme non si sommano (vince la più lunga)
  }),
  knockback: Object.freeze({
    impulsoPx: 6,        // spinta totale in px di un colpo su massa 1; spinta reale = impulsoPx / massa
    attrito: 0.72,       // per tick la velocità di spinta si moltiplica per questo (decadimento)
    massaDefault: 1.5,
    masse: Object.freeze({ // massa per tipo di nemico (patternMob || tipo); Infinity = non si sposta
      vespa_cieca: 0.4,  // 15 px: vola via
      gatto: 1.5,        // 4 px
      maschera: 2,       // 3 px
      guardia: 3,        // 2 px
      bomba_ferma: 12,   // 0,5 px: come prima, quasi ferma
      statua: Infinity,  // ferma
    }),
    massaBoss: Infinity, // i boss restano fermi
  }),
  scossa: Object.freeze({ // [px, durata in ms]: vince l'ampiezza e la durata maggiore, non si somma
    colpo: [1.5, 50],              // colpo a segno su un nemico (1-2 px)
    ferita: [3, 160],              // il giocatore subisce un colpo
    bomba: [5.5, 140],             // esplosione di un Bozzo (5-6 px)
    atterraggioReGatto: [11, 180], // atterraggio del Re-Gatto (10-12 px)
    schiantoMani: [11, 180],       // schianto delle Mani di Donna Luciana (10-12 px; il Teatro non ha ancora l'attacco)
    schiantoCapitano: [6, 160],    // carica del Capitano contro il muro (valore di prima)
    evento: [5, 200],              // muro segreto aperto, oggetto attivo (valore di prima)
  }),
  macchie: Object.freeze({ // china (o schegge di legno) che restano a terra finché si resta nella stanza (pulito, non invasivo)
    goccieChina: 3,
    schegge: 2,
    raggioPx: 14,
    dimMinPx: 2,
    dimMaxPx: 4,
    maxPerStanza: 16,
    alpha: 0.45,
    coloreChina: '#0b0704',
    coloreLegno: '#7a4a22',
    tipiLegno: Object.freeze(['statua', 'guardia', 'bomba_ferma']), // patternMob || tipo
  }),
  fili: Object.freeze({ // due fili d'oro per marionetta, uno per Mano (resa.fili)
    colore: '#f9cb40',
    alpha: 0.3,
    spessore: 1,
    ancoraggioY: 0.75,   // altezza dell'attacco sul corpo, contata dai piedi
    scartoX: 0.55,       // scostamento delle due spalle, in mezze larghezze
    curvaPx: 16,         // il filo pende con una leggera curva verso il basso
    manoSinistra: Object.freeze([216, 36]),
    manoDestra: Object.freeze([424, 36]),
  }),
});

const MS_PER_TICK = 1000 / FEEL.passo.hz;

// ---------------------------------------------------------------------------
// OPZIONI DEL GIOCATORE (menu Opzioni). Un solo oggetto vivo, letto da tutti i file di teatro/ a runtime:
//   volumeEffetti, volumeMusica (0..1) · scossa (0..1, moltiplica lo scuotimento dello schermo)
//   grana, vignetta, pubblico, ombre (effetti scenici accesi/spenti) · lampi (lampi bianchi sui colpi)
//   voce (didascalie della Voce del Burattinaio)
// Salvate in localStorage 'ferruccio.teatro.opzioni'. Chi le cambia chiama salvaOpzioni().
// ---------------------------------------------------------------------------
const OPZIONI_PREDEFINITE = Object.freeze({ volumeEffetti: 1, volumeMusica: 1, scossa: 1, grana: true, vignetta: true, pubblico: true, lampi: true, ombre: true, voce: true });
const OPZIONI = (() => {
  let salvate = {};
  try { salvate = JSON.parse(localStorage.getItem('ferruccio.teatro.opzioni') || '{}') || {}; } catch (_) { salvate = {}; }
  return Object.assign({}, OPZIONI_PREDEFINITE, salvate);
})();
/** Salva le opzioni correnti (da chiamare dopo ogni modifica di OPZIONI). */
function salvaOpzioni() {
  try { localStorage.setItem('ferruccio.teatro.opzioni', JSON.stringify(OPZIONI)); } catch (_) {}
}

const ticksDaMs = (ms) => Math.max(1, Math.round(ms / MS_PER_TICK));

// ===========================================================================
// PALETTE PIXEL-ART 16-BIT & COMPILATORE DI SPRITE DISEGNATI 1 AD 1
// ===========================================================================
const PALETTE = {
  '.': null,
  'k': '#0a0604',
  'd': '#1f1510',
  'w': '#ffffff',
  'c': '#f3dfc1',
  's': '#c9a679',
  'e': '#9c7850',
  'r': '#e53222',
  'R': '#8f160c',
  'y': '#f9cb40',
  'o': '#ea8626',
  'O': '#9c4c12',
  'b': '#3b82f6',
  'B': '#1d4ed8',
  'a': '#67e8f9',
  'A': '#0891b2',
  'g': '#cbd5e1',
  'G': '#64748b',
  'D': '#334155',
  'm': '#854d0e',
  'M': '#451a03',
  'p': '#c084fc',
  'P': '#6b21a8',
  'v': '#4ade80',
  'V': '#15803d',
};

// ===========================================================================
// BILANCIAMENTO REALE:
// - Ferruccio NON ha il filo (solo i nemici, i boss e il mercante hanno i fili!)
// - Mappa ad esplorazione (solo quando entri in una stanza compare sulla minimappa)
// - 1 Stanza Segreta per piano con mob dorati (il modo principale per fare soldi!)
// - 1 stanza su 3 ha un OGGETTO GRATIS (tier 'base') e 1 stanza su 10 ha un OGGETTO FORTE GRATIS (tier 'forte')
// - Economia: parti da 0🪙, i mostri normali non regalano piogge di monete,
//   devi risparmiare e cercare la Stanza Segreta per comprare gli oggetti forti (15-18🪙) ne La Fucina!
// ===========================================================================
// (bug autore «il generatore di stanze è sbagliato») Stanze di COMBATTIMENTO per piano del ciclo;
// ingresso, tesoro, fucina, boss, segreta e patto sono in aggiunta. Prima il piano 1 ne aveva una.
const STANZE_COMBATTIMENTO_PER_PIANO = { 1: 6, 2: 7, 3: 8, 4: 9 };

// ===========================================================================
// IDENTITÀ E QUARTIERI DEI PIANI DALLA BIBBIA NARRATIVA
// Piano 1: Corso Trieste sotto la pioggia
// Piano 2: Villa Comunale con le lucciole
// Piano 3: San Leucio all'alba
// Piano 4: La Reggia con le torce
// ===========================================================================
const QUARTIERI_PIANI = Object.freeze({
  1: Object.freeze({
    id: 'corso-trieste',
    pianoNelCiclo: 1,
    nome: 'Corso Trieste',
    atmosfera: 'Sotto la Pioggia',
    titoloCompleto: 'Corso Trieste sotto la Pioggia',
    meteo: 'pioggia',
    coloreTema: '#60a5fa',
    bordoPillola: '#1d4ed8',
    coloreSfondo: '#080c14',
    coloreMuroEsterno: '#101726',
    coloreMuroInterno: '#161f30',
    coloreBordoMuro: '#0a0e18',
    coloriPiastrelle: Object.freeze(['#1b2333', '#161c2b', '#202a3d', '#131926']),
    coloreFughe: '#0e131d',
    coloreRiflesso: '#2d3f5e',
    colorePozzanghera: 'rgba(56, 189, 248, 0.22)',
    nemiciTipici: Object.freeze(['gatto', 'vespa_cieca', 'bomba_ferma']),
    bossTipico: 're-gatto',
    descrizioneSipario: Object.freeze({
      atto: 'ATTO I · CORSO TRIESTE',
      titolo: '«CORSO TRIESTE SOTTO LA PIOGGIA»',
      testo1: 'La pioggia scroscia sui basoli neri dei Quattro Canti.',
      testo2: 'Gatti d\'Ombra balzano tra i lampioni bagnati mentre l\'odore di ruggine sale dai vicoli.',
      testo3: 'Trova il passaggio verso la Villa Comunale e scova la Stanza Segreta!',
    }),
  }),
  2: Object.freeze({
    id: 'villa-comunale',
    pianoNelCiclo: 2,
    nome: 'Villa Comunale',
    atmosfera: 'Con le Lucciole',
    titoloCompleto: 'Villa Comunale con le Lucciole',
    meteo: 'lucciole',
    coloreTema: '#a3e635',
    bordoPillola: '#4d7c0f',
    coloreSfondo: '#071007',
    coloreMuroEsterno: '#132113',
    coloreMuroInterno: '#1b2d1a',
    coloreBordoMuro: '#091309',
    coloriPiastrelle: Object.freeze(['#1e2d1a', '#172414', '#243620', '#131e10']),
    coloreFughe: '#0d150b',
    coloreRiflesso: '#365314',
    coloreMuschio: '#4d7c0f',
    nemiciTipici: Object.freeze(['statua', 'guardia', 'vespa_cieca']),
    bossTipico: 'colosso-statua',
    descrizioneSipario: Object.freeze({
      atto: 'ATTO II · VILLA COMUNALE',
      titolo: '«VILLA COMUNALE CON LE LUCCIOLE»',
      testo1: 'I viali di ghiaia e tufo brillano nel buio trafitti da sciami di lucciole dorate.',
      testo2: 'Tra le siepi e la fontana silenziosa veglia il Custode di Marmo sui ricordi di Gaetano.',
      testo3: 'Attento ai colpi pesanti delle statue: conservano il silenzio del lutto borbonico!',
    }),
  }),
  3: Object.freeze({
    id: 'san-leucio',
    pianoNelCiclo: 3,
    nome: 'San Leucio',
    atmosfera: 'All\'Alba',
    titoloCompleto: 'San Leucio all\'Alba',
    meteo: 'alba',
    coloreTema: '#fb923c',
    bordoPillola: '#c2410c',
    coloreSfondo: '#140a08',
    coloreMuroEsterno: '#291410',
    coloreMuroInterno: '#381c16',
    coloreBordoMuro: '#180b08',
    coloriPiastrelle: Object.freeze(['#47221a', '#3d1b14', '#52281f', '#351610']),
    coloreFughe: '#220d09',
    coloreRiflesso: '#7c2d12',
    coloreSeta: 'rgba(251, 146, 60, 0.22)',
    nemiciTipici: Object.freeze(['maschera', 'guardia', 'vespa_cieca']),
    bossTipico: 'capitano-guardia', // il Capitano di Piombo al piano 3: sblocca Taddeo (a6)
    descrizioneSipario: Object.freeze({
      atto: 'ATTO III · SAN LEUCIO',
      titolo: '«SAN LEUCIO ALL\'ALBA»',
      testo1: 'Il primo raggio radente dell\'aurora dorata penetra tra i telai del setificio reale.',
      testo2: 'Fili dorati vibrano nell\'aria. Maschere d\'osso e spezzafili sorvegliano i ricordi di Agnese.',
      testo3: 'Qui ogni colpo subito spezza 1 Maschera intera (-1 ❤️): prepara il tuo attacco prima della Reggia!',
    }),
  }),
  4: Object.freeze({
    id: 'la-reggia',
    pianoNelCiclo: 4,
    nome: 'La Reggia',
    atmosfera: 'Con le Torce',
    titoloCompleto: 'La Reggia con le Torce',
    meteo: 'torce',
    coloreTema: '#f59e0b',
    bordoPillola: '#b45309',
    coloreSfondo: '#0f0c08',
    coloreMuroEsterno: '#221c16',
    coloreMuroInterno: '#30271e',
    coloreBordoMuro: '#120e0a',
    coloriPiastrelle: Object.freeze(['#cfc5b4', '#1f1b18', '#dfd6c7', '#28231f']),
    coloreFughe: '#854d0e',
    coloreOro: '#f9cb40',
    nemiciTipici: Object.freeze(['guardia', 'statua', 'maschera']),
    bossTipico: 'donna-luciana',
    descrizioneSipario: Object.freeze({
      atto: 'ATTO IV · LA REGGIA BORBONICA',
      titolo: '«LA REGGIA CON LE TORCE»',
      testo1: 'I saloni reali risplendono del fuoco vivo di torce dorate e bracieri d\'ottone.',
      testo2: 'Sulla grande scacchiera di marmo ed ebano, la guardia borbonica protegge la Sala del Trono.',
      testo3: 'Donna Luciana ti attende: recidi i fili della Burattinaia per restituire la verità a Caserta!',
    }),
  }),
});

function getQuartierePiano(piano) {
  const p = ((Math.max(1, piano || 1) - 1) % 4) + 1;
  return QUARTIERI_PIANI[p] || QUARTIERI_PIANI[1];
}

/** Forma della mappa (generaMappaPiano). Celle della griglia 1..larghezza × 1..altezza (minimappa 7×6). */
// Prova dei gatti (richiesta dell'autore, 2026-11-09): con attivo = true al Piano 1 le stanze accanto all'ingresso
// sono sempre il «Vicolo dei Gatti» e il primo boss della run è il Gatto dei Quattro Canti.
// Spenta l'11-11-2026 su richiesta dell'autore («spegni i gatti»): il gioco normale ha attivo = false.
const PLAYTEST_GATTI = Object.freeze({ attivo: false, bossGattoPrimo: true, vicoloAccantoIngresso: true });

const MAPPA_PIANO = Object.freeze({
  larghezza: 7, altezza: 6,
  catenaMin: 4,            // stanze di combattimento minime fra ingresso e boss
  catenaExtraMax: 2,       // la catena principale ne ha da catenaMin a catenaMin + catenaExtraMax (resto in rami)
  proseguiRamo: 0.45,      // probabilità che un ramo prosegua dall'ultima stanza aggiunta (corridoi laterali)
  tentativi: 400,
});

// --- PROPOSTA 3: ROSTER DI 4 PERSONAGGI GIOCABILI ---
const PERSONAGGI_GIOCABILI = {
  ferruccio: {
    id: 'ferruccio', nome: 'Ferruccio', titolo: 'Il Burattino Senza Filo',
    hpHalf: 6, baseDmg: 3.50, baseSpd: 1.00, attivoIniziale: 'forbici', passivoIniziale: null,
  },
  agnese: {
    id: 'agnese', nome: 'Agnese', titolo: 'La Tessitrice di San Leucio',
    hpHalf: 4, baseDmg: 3.20, baseSpd: 1.25, attivoIniziale: 'tamburello', passivoIniziale: 'doppia',
  },
  taddeo: {
    id: 'taddeo', nome: 'Taddeo', titolo: 'La Guardia Pentita',
    hpHalf: 8, baseDmg: 4.10, baseSpd: 0.88, attivoIniziale: 'ampolla', passivoIniziale: 'spada',
  },
  ombra: {
    id: 'ombra', nome: 'Pulcinella d\'Ombra', titolo: 'Lo Spettro del Velo (Judas)',
    hpHalf: 4, baseDmg: 5.10, baseSpd: 1.12, attivoIniziale: 'forbici', passivoIniziale: 'anello',
  },
};

// --- PROPOSTA 5: OGGETTI ATTIVI A RICARICA PER STANZA ([Q] O CLICK SULLO SLOT ATTIVO) ---
const OGGETTI_ATTIVI = {
  forbici: {
    id: 'forbici', sprite: 'forbici', nome: 'Forbici di Gaetano', maxCarica: 3,
    desc: '[Q] Spezza i fili d\'oro: immobilizza tutti i nemici per 4s e infligge danno!',
  },
  tamburello: {
    id: 'tamburello', sprite: 'tamburello', nome: 'Tamburello di Piazza Dante', maxCarica: 2,
    desc: '[Q] Onda d\'urto sonora: distrugge tutti i proiettili nemici e respinge i mostri!',
  },
  ampolla: {
    id: 'ampolla', sprite: 'ampolla', nome: 'Ampolla di San Gennaro', maxCarica: 4,
    desc: '[Q] Miracolo cremisi: rigenera subito +1 ❤️ Maschera intera!',
  },
};

// --- PROPOSTA 2: RELIQUIE DEL PATTO D'OMBRA ---
const CATALOGO_PATTO = [
  {
    id: 'patto_raggio', sprite: 'patto_raggio', nome: 'Raggio Cremisi del Velo', tier: 'patto',
    statsDesc: '[😈 PATTO] Raggio Cremisi Continuo Perforante · Danno x1.5',
    lore: 'Stringi il patto col Velo: i tuoi colpi diventano un fascio di fuoco cremisi continuo.',
    costoMaxHpHalf: 4,
    mod: { laser: true, dmgMult: 1.5, piercing: true, tipoProiettile: 'cremisi', size: 1.5, armaSpeciale: true },
  },
  {
    id: 'patto_coltello', sprite: 'patto_coltello', nome: 'Lama della Burattinaia', tier: 'patto',
    statsDesc: '[😈 PATTO] Fendente da Mischia Perforante · Danno x2.0',
    lore: 'La lama affilata di Donna Luciana: recide i nemici al contatto.',
    costoMaxHpHalf: 4,
    mod: { spada: true, dmgMult: 2.0, piercing: true, tipoProiettile: 'cremisi', armaSpeciale: true },
  },
  {
    id: 'patto_patto', sprite: 'patto_patto', nome: 'Giuramento di Sangue', tier: 'patto',
    statsDesc: '[😈 PATTO] +0.5 Danno · +0.7 Cadenza · +2 Maschere di Cera',
    lore: 'Un accordo inciso a fuoco nel palcoscenico: vigore e rapidità.',
    costoMaxHpHalf: 4,
    mod: { dmgUp: 0.5, cadenzaUp: 0.7, ceraExtra: 4 },
  },
  {
    id: 'patto_marchio', sprite: 'patto_marchio', nome: 'Sigillo dell\'Ombra', tier: 'patto',
    statsDesc: '[😈 PATTO] +1.0 Danno · +0.2 Velocità · +1 Maschera di Cera',
    lore: 'Un sigillo impresso sulla cera: rende i tuoi passi e i tuoi colpi inesorabili.',
    costoMaxHpHalf: 2,
    mod: { dmgUp: 1.0, speedUp: 0.2, ceraExtra: 2 },
  },
  {
    id: 'patto_abisso', sprite: 'patto_abisso', nome: 'Manto dell\'Abisso', tier: 'patto',
    statsDesc: '[😈 PATTO] Rimuove Maschere Massime · +1.5 Danno · +0.2 Velocità · +6 Maschere di Cera',
    lore: 'Consuma ogni residuo di vita mortale per donare pura potenza d\'ombra.',
    costoMaxHpHalf: 4,
    mod: { dmgUp: 1.5, speedUp: 0.2, ceraAbisso: true, ceraExtra: 12 },
  },
  {
    id: 'patto_collare', sprite: 'patto_collare', nome: 'Collare del Gatto Randagio', tier: 'patto',
    statsDesc: '[😈 PATTO] 50% di Risorgere con ½ Maschera alla Morte',
    lore: 'Nove vite rubate dai tetti di Caserta: la morte ha solo metà presa su di te.',
    costoMaxHpHalf: 2,
    mod: { risorgiCollare: true },
  },
  {
    id: 'patto_tunica', sprite: 'patto_tunica', nome: 'Mozzetta Nera del Confratello', tier: 'patto',
    statsDesc: '[😈 PATTO] +1.0 Danno · +3 Maschere di Cera',
    lore: 'Vesti liturgiche del Velo: avvolgono la marionetta conferendole durezza e potenza.',
    costoMaxHpHalf: 2,
    mod: { dmgUp: 1.0, ceraExtra: 6 },
  },
  {
    id: 'patto_contratto', sprite: 'patto_contratto', nome: 'Cambiale del Sottosuolo', tier: 'patto',
    statsDesc: '[😈 PATTO] Raddoppia le Ricompense di Fine Stanza',
    lore: 'Ogni vittoria frutta il doppio di monete e risorse dai recessi del teatro.',
    costoMaxHpHalf: 2,
    mod: { dropDoppi: true },
  },
];

// --- STANZE SEGRETE ---
const CATALOGO_SEGRETO = [
  {
    id: 'trascendenza', sprite: 'trascendenza', nome: 'Ali di Cartapesta', tier: 'segreto',
    statsDesc: '[👁 SEGRETO] Volo Spettrale (Sorvola baratri, trappole e ostacoli)',
    lore: 'I fili si staccano dal ponte di comando: la marionetta galleggia libera nell\'aria.',
    mod: { volo: true },
  },
  {
    id: 'fungo_1up', sprite: 'fungo_1up', nome: 'Corno della Seconda Vita', tier: 'segreto',
    statsDesc: '[👁 SEGRETO] +1 Vita Extra · Risorgi con la salute completamente ripristinata!',
    lore: 'Intagliato nel legno di un albero secolare del Parco Reale: ti dona un altro atto in scena.',
    mod: { vitaExtra: 1 },
  },
  {
    id: 'fegato_crudo', sprite: 'fegato_crudo', nome: 'Zuppa di Soffritto', tier: 'segreto',
    statsDesc: '[👁 SEGRETO] +2 Maschere Massime (+4 mezze) · Ripristino Completo Salute',
    lore: 'Nutrimento primordiale dei mercati di pietra: rinnova completamente le tue fibre.',
    mod: { bonusMaxHp: 4, healFull: true },
  },
  {
    id: 'chiave_scheletro', sprite: 'chiave_scheletro', nome: 'Chiave del Munaciello', tier: 'segreto',
    statsDesc: '[👁 SEGRETO] 99 Chiavi (Apre ogni cassa e porta senza esaurirsi)',
    lore: 'Forgiata sulle antiche catacombe borboniche: spalanca ogni serratura.',
    mod: { maxChiavi: 99 },
  },
  {
    id: 'barile_polvere', sprite: 'barile_polvere', nome: 'Cassa di Zecchini Borbonici', tier: 'segreto',
    statsDesc: '[👁 SEGRETO] 99 Monete Dorate d\'Epoca',
    lore: 'Un forziere dimenticato nei corridoi di servizio: oro a profusione.',
    mod: { bonusMonete: 99 },
  },
  {
    id: 'loto_nero', sprite: 'loto_nero', nome: 'Giglio Nero del Belvedere', tier: 'segreto',
    statsDesc: '[👁 SEGRETO] +1 Maschera Massima · +2 Maschere di Cera Protettive',
    lore: 'Rarissimo fiore cresciuto nell\'umido silenzio delle stanze nascoste.',
    mod: { bonusMaxHp: 2, ceraExtra: 4 },
  },
  {
    id: 'soldi_potere', sprite: 'soldi_potere', nome: 'Borsa dell\'Usuraio', tier: 'segreto',
    statsDesc: '[👁 SEGRETO] +0.04 Danno per ogni moneta d\'oro posseduta!',
    lore: 'La cupidigia alimenta la carica dei tuoi proiettili: più sei ricco, più colpisci duro.',
    mod: { moneyIsPower: true },
  },
];

const CATALOGO_OGGETTI = [
  // --- OGGETTI FORTI (TIER 'forte': 1 stanza su 10 gratis, oppure 15-18🪙 ne La Fucina) ---
  {
    id: 'spada', sprite: 'spada', nome: 'Spada di Gaetano', tier: 'forte',
    statsDesc: '[★ FORTE] Equipa Spada (6 frame) · Danno x1.45 · +1.0 Danno fisso',
    lore: 'Forgiata con gli ultimi attrezzi di tuo padre prima del crollo del 1839.',
    prezzo: 15,
    mod: { spada: true, flatDmg: 1.0, dmgMult: 1.45, armaSpeciale: true },
  },
  {
    id: 'piombo', sprite: 'piombo', nome: 'Pallino di Piombo', tier: 'forte',
    statsDesc: '[★ FORTE] +3.8 Danno fisso · Danno x1.9 · Cadenza x0.48 (Colpi Giganti)',
    lore: 'Pesante come il silenzio di Piazza Dante sotto il Velo.',
    prezzo: 18,
    mod: { flatDmg: 3.8, dmgMult: 1.9, cadenzaMult: 0.48, tipoProiettile: 'piombo', size: 1.55, overflowPierce: true },
  },
  {
    id: 'anello', sprite: 'anello', nome: 'Anello Cremisi', tier: 'forte',
    statsDesc: '[★ FORTE] +0.8 Danno · Danno x1.5 · Proiettili Perforanti',
    lore: 'Anello caduto dal dito di una burattinaia: trapassa ogni marionetta.',
    prezzo: 16,
    mod: { dmgUp: 0.8, dmgMult: 1.5, piercing: true, tipoProiettile: 'cremisi' },
  },
  {
    id: 'triplo', sprite: 'triplo', nome: 'Triplo Occhio', tier: 'forte',
    statsDesc: '[★ FORTE] Triplo Colpo a ventaglio · +0.4 Danno · Cadenza x0.58',
    lore: 'Tre pupille di vetro che vedono i fili d\'oro nel cielo.',
    prezzo: 15,
    mod: { triplo: true, dmgUp: 0.4, cadenzaMult: 0.58 },
  },
  {
    id: 'catena', sprite: 'catena', nome: 'Catena della Chiusa', tier: 'forte',
    statsDesc: '[★ FORTE] +0.6 Cadenza · Fulmini a catena tra tutti i nemici',
    lore: 'Spezzata dalla chiusa reale: scarica scintille azzurrine a ogni impatto.',
    prezzo: 15,
    mod: { cadenzaUp: 0.6, chain: true, tipoProiettile: 'elettrico' },
  },
  {
    id: 'venti', sprite: 'venti', nome: 'Maschera dei 4 Venti', tier: 'forte',
    statsDesc: '[★ FORTE] Spara contemporaneamente nelle 4 direzioni · +0.5 Danno',
    lore: 'Quattro volti di Pulcinella che guardano ogni angolo del palco.',
    prezzo: 15,
    mod: { quadDir: true, dmgUp: 0.5 },
  },

  // --- OGGETTI BASE (TIER 'base': 1 stanza su 3 gratis, oppure 10🪙 ne La Fucina) ---
  {
    id: 'chiodo', sprite: 'chiodo', nome: 'Chiodo della Fucina', tier: 'base',
    statsDesc: '[BASE] +0.65 Danno · +20 Gittata',
    lore: 'Un chiodo battuto a mano da Ferruccio prima dell\'incantesimo.',
    prezzo: 10,
    mod: { dmgUp: 0.65, rangeUp: 20 },
  },
  {
    id: 'fuoco', sprite: 'fuoco', nome: 'Tizzone di Bragia', tier: 'base',
    statsDesc: '[BASE] +0.6 Danno · Proiettili Infuocati (Bruciatura DoT)',
    lore: 'Carbone ardente della vecchia fucina di famiglia.',
    prezzo: 10,
    mod: { dmgUp: 0.6, burn: true, tipoProiettile: 'fuoco' },
  },
  {
    id: 'doppia', sprite: 'doppia', nome: 'Lente di San Leucio', tier: 'base',
    statsDesc: '[BASE] Doppio Colpo parallelo · Danno x0.80',
    lore: 'Lente da tessitrice usata da Agnese sul telaio reale.',
    prezzo: 10,
    mod: { doppia: true, dmgMult: 0.80 },
  },
  {
    id: 'mercurio', sprite: 'mercurio', nome: 'Goccia di Mercurio', tier: 'base',
    statsDesc: '[BASE] +0.85 Cadenza (Raffica) · +0.10 Velocità',
    lore: 'Argento vivo degli specchi del teatro reale.',
    prezzo: 10,
    mod: { cadenzaUp: 0.85, speedUp: 0.10 },
  },
  {
    id: 'cuore', sprite: 'cuore', nome: 'Medaglione di Rosa', tier: 'base',
    statsDesc: '[BASE] +1 Maschera Massima · Rigenera +1 Maschera · +0.2 Danno',
    lore: 'Il ricordo della moglie che Tonino ha dimenticato per non soffrire.',
    prezzo: 10,
    mod: { bonusMaxHp: 2, dmgUp: 0.2, healOnEquip: 2 },
  },
  {
    id: 'stivali', sprite: 'stivali', nome: 'Sciarpa Rossa di Agnese', tier: 'base',
    statsDesc: '[BASE] +0.25 Velocità · +0.4 Danno · +35 Gittata',
    lore: 'Tessuta da Agnese senza ricordare per chi le tremassero le mani.',
    prezzo: 10,
    mod: { speedUp: 0.25, dmgUp: 0.4, rangeUp: 35 },
  },
  {
    id: 'mantice', sprite: 'mantice', nome: 'Mantice del Fabbro', tier: 'base',
    statsDesc: '[BASE] +0.55 Danno · +0.45 Cadenza',
    lore: 'Soffia aria calda nella vecchia bottega di Piazza Dante.',
    prezzo: 10,
    mod: { dmgUp: 0.55, cadenzaUp: 0.45 },
  },
];

// --- B: inizio ---
// OGGETTI SENZA LIMITE (feedback autore B, 2026-11-09):
//  1. niente più limite di 5 slot: gli oggetti passivi si accumulano senza fine (HUD a icone piccole);
//  2. pool della run: a inizio run si estraggono `dimensionePool` oggetti DIVERSI da CATALOGO_OGGETTI
//     (base + forti; il dono iniziale del personaggio resta fuori); tesoro, Fucina, segreta e ricompense
//     pescano solo da lì senza ripetizioni; esauriti (cap raggiunto) ogni ricompensa è un oggetto a caso dei
//     20 (anche già preso: doppione) oppure un Cuore di Cera. Il patto ha il suo pool a parte (CATALOGO_PATTO).
//  3. Stanza dello Sviluppatore ai piani `sviluppatore.piani`: un pannello con TUTTO il catalogo, se ne sceglie uno.
// Doppioni: si sommano solo le voci additive di `stack.chiaviSommabili` (Danno, Cadenza, Speed, Range,
// vita…); moltiplicatori ed effetti on/off non si ripetono. Se l'oggetto non ha voci additive (es. la Lente
// 20/20) il doppione vale `stack.bonusGenerico` (+0.3 Danno, +0.2 Cadenza).
const OGGETTI_B = Object.freeze({
  dimensionePool: 20,                 // oggetti diversi per run (cap)
  dopoCap: Object.freeze({
    probCuore: 0.35,                  // dopo il cap: probabilità che la ricompensa sia un cuore invece di uno dei 20
    curaCuoreHalf: 2,                 // il Cuore di Cera rigenera 1 maschera intera
  }),
  stack: Object.freeze({
    chiaviSommabili: Object.freeze(['dmgUp', 'flatDmg', 'cadenzaUp', 'speedUp', 'rangeUp', 'bonusMaxHp', 'healOnEquip']),
    fattore: 1.0,                     // un doppione somma il 100% delle voci additive
    bonusGenerico: Object.freeze({ dmgUp: 0.3, cadenzaUp: 0.2 }),
    descGenerico: '+0.3 Danno · +0.2 Cadenza',
  }),
  hud: Object.freeze({ lato: 12, passo: 13, righe: 2, xMin: 256, xMax: 566, scala: 1.0 }),
  sviluppatore: Object.freeze({
    piani: Object.freeze([7]),        // piani con la Stanza dello Sviluppatore (7 = ciclo 2, terzo piano)
    colonne: 9, cellaL: 62, cellaA: 34, // D: 62 oggetti in 7 righe (prima 8 × 38: con il catalogo D usciva dallo schermo)
    colore: '#67e8f9',
  }),
});

// Catalogo esteso (B): 15 oggetti nuovi, così il pool di 20 è un vero sottoinsieme del catalogo (28 oggetti) e
// la Stanza dello Sviluppatore offre anche oggetti fuori pool. Solo modificatori già gestiti da
// ricalcolaStatistiche; i prezzi li fissa ECONOMIA_T3 qui sotto, per tier.
const OGGETTI_NUOVI_B = [
  { id: 'corno', sprite: 'corno', nome: 'Corno di Corallo', tier: 'forte',
    statsDesc: '[★ FORTE] +1 Maschera Massima · +0.6 Danno · Danno x1.25 · +0.15 Velocità · +20 Gittata',
    lore: 'Il corno rosso appeso alla porta della bottega: tiene lontano il malocchio del Velo.',
    mod: { bonusMaxHp: 2, healOnEquip: 2, dmgUp: 0.6, dmgMult: 1.25, speedUp: 0.15, rangeUp: 20 } },
  { id: 'campana', sprite: 'campana', nome: 'Campana di San Lorenzo', tier: 'forte',
    statsDesc: '[★ FORTE] +1.0 Danno · +0.5 Danno fisso',
    lore: 'Suonava a morto la notte del crollo: ora suona per te.',
    mod: { dmgUp: 1.0, flatDmg: 0.5 } },
  { id: 'fiaccola', sprite: 'fiaccola', nome: 'Fiaccola del Vesuvio', tier: 'forte',
    statsDesc: '[★ FORTE] Proiettili Infuocati e Perforanti · +0.4 Danno',
    lore: 'Accesa al fuoco della montagna, non si spegne nemmeno sotto il Velo.',
    mod: { burn: true, piercing: true, dmgUp: 0.4, tipoProiettile: 'fuoco' } },
  { id: 'lanterna', sprite: 'lanterna', nome: 'Lanterna Magica', tier: 'forte',
    statsDesc: '[★ FORTE] Doppio Colpo parallelo · +0.5 Cadenza · +0.3 Danno',
    lore: 'Proietta due ombre per ogni figura: il pubblico non sa quale sia vera.',
    mod: { doppia: true, cadenzaUp: 0.5, dmgUp: 0.3 } },
  { id: 'sole', sprite: 'sole', nome: 'Sole d\'Ottone', tier: 'forte',
    statsDesc: '[★ FORTE] Colpi più grandi · +1.5 Danno fisso · +0.3 Cadenza',
    lore: 'Il sole di scena del Teatro: brilla anche quando il sipario è chiuso.',
    mod: { size: 1.35, flatDmg: 1.5, cadenzaUp: 0.3 } },
  { id: 'nastro', sprite: 'nastro', nome: 'Nastro del Sipario', tier: 'base',
    statsDesc: '[BASE] +0.20 Velocità · +0.4 Cadenza',
    lore: 'Il nastro rosso che lega il sipario a riposo.',
    mod: { speedUp: 0.2, cadenzaUp: 0.4 } },
  { id: 'ago', sprite: 'ago', nome: 'Ago di Agnese', tier: 'base',
    statsDesc: '[BASE] +40 Gittata · +0.35 Danno',
    lore: 'Cuce i fili strappati: arriva lontano e punge piano.',
    mod: { rangeUp: 40, dmgUp: 0.35 } },
  { id: 'castagna', sprite: 'castagna', nome: 'Castagna del Ciuccio', tier: 'base',
    statsDesc: '[BASE] +1 Maschera Massima · Rigenera +1 Maschera',
    lore: 'Arrostita sul braciere della piazza, sa ancora di casa.',
    mod: { bonusMaxHp: 2, healOnEquip: 2 } },
  { id: 'cornetto', sprite: 'cornetto', nome: 'Cornetto Portafortuna', tier: 'base',
    statsDesc: '[BASE] +0.5 Danno · +0.10 Velocità',
    lore: 'Mai regalato, mai comprato: trovato. Così porta fortuna.',
    mod: { dmgUp: 0.5, speedUp: 0.1 } },
  { id: 'bottone', sprite: 'bottone', nome: 'Bottone di Madreperla', tier: 'base',
    statsDesc: '[BASE] +0.7 Cadenza',
    lore: 'Staccato dalla giacca buona, quella delle feste.',
    mod: { cadenzaUp: 0.7 } },
  { id: 'pettine', sprite: 'pettine', nome: 'Pettine di Tartaruga', tier: 'base',
    statsDesc: '[BASE] +0.35 Cadenza · +25 Gittata · +0.10 Velocità',
    lore: 'Pettina i fili d\'oro senza spezzarli.',
    mod: { cadenzaUp: 0.35, rangeUp: 25, speedUp: 0.1 } },
  { id: 'pipa', sprite: 'pipa', nome: 'Pipa di Pulcinella', tier: 'base',
    statsDesc: '[BASE] +0.45 Danno · +30 Gittata',
    lore: 'Fuma pensieri: ogni boccata un ricordo che torna.',
    mod: { dmgUp: 0.45, rangeUp: 30 } },
  { id: 'pagnotta', sprite: 'pagnotta', nome: 'Pagnotta di Port\'Alba', tier: 'base',
    statsDesc: '[BASE] +1 Maschera Massima · Rigenera +1 Maschera · +0.05 Velocità',
    lore: 'Ancora calda, avvolta in un foglio di giornale del 1839.',
    mod: { bonusMaxHp: 2, healOnEquip: 2, speedUp: 0.05 } },
  { id: 'chiave', sprite: 'chiave', nome: 'Chiave del Camerino', tier: 'base',
    statsDesc: '[BASE] +0.3 Danno · +0.3 Cadenza · +0.10 Velocità · +15 Gittata',
    lore: 'Apre il camerino dove le marionette si tolgono il trucco.',
    mod: { dmgUp: 0.3, cadenzaUp: 0.3, speedUp: 0.1, rangeUp: 15 } },
  { id: 'dado', sprite: 'dado', nome: 'Dado della Bisca', tier: 'base',
    statsDesc: '[BASE] +0.8 Danno fisso',
    lore: 'Truccato, ma solo un poco.',
    mod: { flatDmg: 0.8 } },
];

for (const o of OGGETTI_NUOVI_B) CATALOGO_OGGETTI.push({ prezzo: o.tier === 'forte' ? 15 : 10, ...o });

// --- D: inizio ---
// CATALOGO ESTESO (feedback autore D, production/arte/oggetti-teatro.md §3): 34 oggetti nuovi
// (22 positivi meno i 2 «fase 2» elmo/pupara, 8 misti meno matita/malocchio, 8 negativi). `polarita`:
// positivo | misto | negativo. Le meccaniche nuove
// (omingForza, rimbalzi, orbitali, famiglio, maledizione…) le legge ricalcolaStatistiche (blocchi D).
const OGGETTI_NUOVI_D = [
  { id: 'trottola', sprite: 'trottola', nome: 'Trottola di Piazza Mercato', tier: 'base', polarita: 'positivo',
    statsDesc: '[BASE] +0.3 Velocità · +0.2 Cadenza',
    lore: 'Gira da sola da quando il Velo è sceso.',
    mod: { speedUp: 0.3, cadenzaUp: 0.2 } },
  { id: 'sfogliatella', sprite: 'sfogliatella', nome: 'Sfogliatella Riccia', tier: 'base', polarita: 'positivo',
    statsDesc: '[BASE] +1 Maschera Massima (vuota)',
    lore: 'Croccante anche dopo sei anni di incantesimo.',
    mod: { bonusMaxHp: 2 } },
  { id: 'pastiera', sprite: 'pastiera', nome: 'Fetta di Pastiera', tier: 'forte', polarita: 'positivo',
    statsDesc: '[★ FORTE] +1 Maschera Massima · Rigenera 2 Maschere · +0.3 Danno',
    lore: 'La faceva Rosa a Pasqua: il profumo riporta la memoria.',
    mod: { bonusMaxHp: 2, healOnEquip: 4, dmgUp: 0.3 } },
  { id: 'cucchiaio', sprite: 'cucchiaio', nome: 'Cucchiaio del Re', tier: 'base', polarita: 'positivo',
    statsDesc: '[BASE] Colpi a ricerca (curvano verso i nemici)',
    lore: 'Rubato dalla credenza della Reggia: si piega verso i nemici.',
    mod: { omingForza: 0.06, tipoProiettile: 'viola' } },
  { id: 'astrolabio', sprite: 'astrolabio', nome: 'Astrolabio della Specola', tier: 'forte', polarita: 'positivo',
    statsDesc: '[★ FORTE] I colpi ti orbitano attorno · +40 Gittata · +0.4 Danno',
    lore: 'Misurava le stelle sopra la Reggia; ora i tuoi colpi gli girano attorno.',
    mod: { orbitaleProiettili: true, rangeUp: 40, dmgUp: 0.4 } },
  { id: 'gomma', sprite: 'gomma', nome: 'Gomma del Burattinaio', tier: 'base', polarita: 'positivo',
    statsDesc: '[BASE] I colpi rimbalzano 2 volte sui muri',
    lore: 'La colla dei fili: tutto ci rimbalza.',
    mod: { rimbalzi: 2 } },
  { id: 'piedigrotta', sprite: 'piedigrotta', nome: 'Razzo di Piedigrotta', tier: 'forte', polarita: 'positivo',
    statsDesc: '[★ FORTE] Colpi esplosivi · Danno x1.6 · Cadenza x0.55',
    lore: 'Fuoco d\'artificio della festa di settembre.',
    mod: { esplosiva: 42, dmgMult: 1.6, cadenzaMult: 0.55, tipoProiettile: 'fuoco', sparabombe: true, armaSpeciale: true } },
  { id: 'ragno', sprite: 'ragno', nome: 'Ragno della Seta di San Leucio', tier: 'forte', polarita: 'positivo',
    statsDesc: '[★ FORTE] 4 colpi a ventaglio · Cadenza x0.42',
    lore: 'Tesse quattro fili per volta.',
    mod: { quattroColpi: true, cadenzaMult: 0.42 } },
  { id: 'velo-madonna', sprite: 'velo-madonna', nome: 'Velo della Madonna dell\'Arco', tier: 'forte', polarita: 'positivo',
    statsDesc: '[★ FORTE] Para il primo colpo di ogni stanza',
    lore: 'Benedetto in processione: para il primo colpo di ogni stanza.',
    mod: { scudoStanza: 1 } },
  { id: 'cuoio', sprite: 'cuoio', nome: 'Maschera di Cuoio', tier: 'base', polarita: 'positivo',
    statsDesc: '[BASE] 25% di parare i proiettili nemici',
    lore: 'La maschera da scena vera di Pulcinella, dura come uno scudo.',
    mod: { bloccoProb: 0.25 } },
  { id: 'gomitolo', sprite: 'gomitolo', nome: 'Gomitolo di Fili d\'Oro', tier: 'base', polarita: 'positivo',
    statsDesc: '[BASE] Un gomitolo ti orbita attorno: para i colpi e ferisce',
    lore: 'Fili che non si possono tagliare, avvolti stretti.',
    mod: { orbitali: 1 } },
  { id: 'ostia', sprite: 'ostia', nome: 'Ostia della Cappella Palatina', tier: 'forte', polarita: 'positivo',
    statsDesc: '[★ FORTE] Ogni colpo toglie al massimo ½ Maschera',
    lore: 'Leggera: ti fa sentire leggero anche il dolore.',
    mod: { dannoMaxHalf: true } },
  { id: 'pupo_tonino', sprite: 'pupo_tonino', nome: 'Burattino di Tonino', tier: 'base', polarita: 'positivo',
    statsDesc: '[BASE] Famiglio: un burattino che spara con te (3.0 Danno)',
    lore: 'Un pupazzetto che Tonino intagliò per un figlio mai nato.',
    mod: { famiglio: 'tiratore', famDmg: 3.0, famCadenza: 0.9 } },
  { id: 'pupa_agnese', sprite: 'pupa_agnese', nome: 'Pupattola di Agnese', tier: 'base', polarita: 'positivo',
    statsDesc: '[BASE] Famiglio: una bambola che spara con te (4.5 Danno)',
    lore: 'Bambola di pezza cucita sul telaio reale.',
    mod: { famiglio: 'tiratore', famDmg: 4.5, famCadenza: 0.7 } },
  { id: 'gatto', sprite: 'gatto', nome: 'Gatto di Vico Lungo', tier: 'forte', polarita: 'positivo',
    statsDesc: '[★ FORTE] Famiglio: un gatto che graffia i nemici (3.0 Danno)',
    lore: 'Il gatto randagio del vicolo: graffia chi ti tocca.',
    mod: { famiglio: 'contatto', famDmg: 3.0 } },
  { id: 'diavoletto', sprite: 'diavoletto', nome: 'Diavoletto del Presepe', tier: 'forte', polarita: 'positivo',
    statsDesc: '[★ FORTE] Famiglio: spara da solo al nemico più vicino (3.5 Danno)',
    lore: 'Statuina rossa del presepe di San Gregorio Armeno.',
    mod: { famiglio: 'tiratore', mira: 'auto', famDmg: 3.5, famCadenza: 0.8 } },
  { id: 'pulcinellino', sprite: 'pulcinellino', nome: 'Pulcinellino', tier: 'forte', polarita: 'positivo',
    statsDesc: '[★ FORTE] Famiglio: colpi a ricerca (3.0 Danno)',
    lore: 'Un Pulcinella piccolo così: non sbaglia un colpo.',
    mod: { famiglio: 'tiratore', famDmg: 3.0, famCadenza: 1.0, famOming: true } },
  { id: 'campanello', sprite: 'campanello', nome: 'Campanello del Portiere', tier: 'base', polarita: 'positivo',
    statsDesc: '[BASE] +0.5 Cadenza · +20 Gittata',
    lore: 'Suona e la porta si apre.',
    mod: { cadenzaUp: 0.5, rangeUp: 20 } },
  { id: 'tarallo', sprite: 'tarallo', nome: 'Tarallo Sugna e Pepe', tier: 'base', polarita: 'positivo',
    statsDesc: '[BASE] +0.4 Danno · +1 Maschera Massima',
    lore: 'Duro come la vita del popolo.',
    mod: { dmgUp: 0.4, bonusMaxHp: 2 } },
  { id: 'carta-ventaglio', sprite: 'carta-ventaglio', nome: 'Ventaglio di Carta', tier: 'base', polarita: 'positivo',
    statsDesc: '[BASE] I tuoi colpi annullano i proiettili nemici · +0.2 Danno',
    lore: 'Ventaglio della dama del palco reale.',
    mod: { bloccaProiettili: true, dmgUp: 0.2 } },
  { id: 'cuore-sacro', sprite: 'cuore-sacro', nome: 'Cuore Sacro di Santa Chiara', tier: 'forte', polarita: 'misto',
    statsDesc: '[◐ MISTO] ★ Danno x2.3 · +1 Maschera · Colpi a ricerca · Cadenza x0.6',
    lore: 'Ex voto d\'argento: ti rende lento ma inesorabile.',
    mod: { dmgMult: 2.3, bonusMaxHp: 2, healOnEquip: 2, omingForza: 0.05, cadenzaMult: 0.6 } },
  { id: 'bombarda', sprite: 'bombarda', nome: 'Bombarda di Gaeta', tier: 'forte', polarita: 'misto',
    statsDesc: '[◐ MISTO] ★ Danno x2.6 · Colpi enormi e lenti · Cadenza x0.3',
    lore: 'Il cannone della fortezza: un colpo ogni tanto, e la stanza trema.',
    mod: { dmgMult: 2.6, size: 1.8, cadenzaMult: 0.3, velocitaColpo: 0.6, sparabombe: true, armaSpeciale: true } },
  { id: 'occhio-vetro', sprite: 'occhio-vetro', nome: 'Occhio di Vetro del Ciarlatano', tier: 'forte', polarita: 'misto',
    statsDesc: '[◐ MISTO] ★ Danno x2 da vicino, cala con la distanza · -60 Gittata · +0.5 Danno',
    lore: 'Lo vendeva un ciarlatano a Piazza Mercato: vede bene solo da vicino.',
    mod: { prossimita: true, rangeUp: -60, dmgUp: 0.5 } },
  { id: 'cappello-mago', sprite: 'cappello-mago', nome: 'Cappello del Mago di Corte', tier: 'base', polarita: 'misto',
    statsDesc: '[◐ MISTO] I colpi partono in due diagonali · +0.3 Cadenza',
    lore: 'Il mago della Reggia non tirava mai dritto.',
    mod: { diagonale: true, cadenzaUp: 0.3 } },
  { id: 'sugna', sprite: 'sugna', nome: 'Sugna del Macellaio', tier: 'base', polarita: 'negativo',
    statsDesc: '[◐ MISTO] +2 Maschere Massime · Rigenera 2 Maschere · -0.25 Velocità',
    lore: 'Ti sazia per una settimana, ma ti appesantisce.',
    mod: { bonusMaxHp: 4, healOnEquip: 4, speedUp: -0.25 } },
  { id: 'ranocchio', sprite: 'ranocchio', nome: 'Ranocchio della Fontana', tier: 'base', polarita: 'negativo',
    statsDesc: '[◐ MISTO] +1.4 Cadenza · -110 Gittata',
    lore: 'Sputa acqua dalla fontana della Reggia: tanto, e corto.',
    mod: { cadenzaUp: 1.4, rangeUp: -110 } },
  { id: 'latte', sprite: 'latte', nome: 'Latte di Mandorla', tier: 'negativo', polarita: 'negativo',
    statsDesc: '[✗ NEGATIVO] Danno x0.2 · Cadenza x5.5 (pioggerella)',
    lore: 'Dolce e leggero: i colpi diventano una pioggerella.',
    mod: { dmgMult: 0.2, cadenzaMult: 5.5 } },
  { id: 'corda', sprite: 'corda', nome: 'Corda del Campanaro', tier: 'negativo', polarita: 'negativo',
    statsDesc: '[✗ NEGATIVO] -0.6 Cadenza',
    lore: 'Sembra un dono; ti lega le mani.',
    mod: { cadenzaUp: -0.6 } },
  { id: 'zoccoli', sprite: 'zoccoli', nome: 'Zoccoli di Legno', tier: 'negativo', polarita: 'negativo',
    statsDesc: '[✗ NEGATIVO] -0.25 Velocità',
    lore: 'Rumorosi e pesanti sul selciato.',
    mod: { speedUp: -0.25 } },
  { id: 'spillo', sprite: 'spillo', nome: 'Spillo Spuntato', tier: 'negativo', polarita: 'negativo',
    statsDesc: '[✗ NEGATIVO] -50 Gittata · +0.1 Danno',
    lore: 'Punge, ma non arriva.',
    mod: { rangeUp: -50, dmgUp: 0.1 } },
  { id: 'salasso', sprite: 'salasso', nome: 'Ventosa del Barbiere', tier: 'negativo', polarita: 'negativo',
    statsDesc: '[✗ NEGATIVO] -1 Maschera Massima',
    lore: 'Il barbiere salassatore di Via Mazzini «cura» tutti.',
    mod: { bonusMaxHp: -2 } },
  { id: 'nebbia', sprite: 'nebbia', nome: 'Nebbia del Volturno', tier: 'negativo', polarita: 'negativo',
    statsDesc: '[✗ NEGATIVO] Maledizione: la mappa sparisce fino a fine piano',
    lore: 'La nebbia sale dal fiume e cancella le strade.',
    mod: { maledizione: 'mappa' } },
  { id: 'lume', sprite: 'lume', nome: 'Lume Spento', tier: 'negativo', polarita: 'negativo',
    statsDesc: '[✗ NEGATIVO] Maledizione: buio attorno a te fino a fine piano',
    lore: 'Il lume a olio di San Leucio, ormai senza stoppino.',
    mod: { maledizione: 'buio' } },
  { id: 'benda', sprite: 'benda', nome: 'Benda del Cieco', tier: 'negativo', polarita: 'negativo',
    statsDesc: '[✗ NEGATIVO] Maledizione: gli oggetti tornano «???» fino a fine piano',
    lore: 'Il cieco del sagrato ti presta la sua benda.',
    mod: { maledizione: 'cieco' } },
];

for (const o of CATALOGO_OGGETTI) if (!o.polarita) o.polarita = 'positivo';

for (const o of OGGETTI_NUOVI_D) CATALOGO_OGGETTI.push({ prezzo: o.tier === 'forte' ? 7 : o.tier === 'negativo' ? 2 : 5, ...o });

/** Numeri delle meccaniche D (oggetti-teatro.md §2 e §5): clamp, raggi, cadenze; tick a 60 Hz, px logici. */
const OGGETTI_D = Object.freeze({
  clamp: Object.freeze({ rimbalzi: 3, orbitali: 3, scudoStanza: 1, bloccoProb: 0.5, famigli: 4, proiettiliGiocatore: 48, rangeMin: 50 }),
  oming: Object.freeze({ raggioPx: 160 }),
  orbitaProiettili: Object.freeze({ raggioPx: 46, radPerTick: 0.09, gittataMult: 1.6 }),
  orbitali: Object.freeze({ raggioPx: 34, radPerTick: 0.06, danno: 2.0, ogniTick: 10, raggioBlocco: 8 }),
  prossimita: Object.freeze({ multVicino: 2.0, multLontano: 0.3 }),
  quattroColpi: Object.freeze([-0.3, -0.1, 0.1, 0.3]),
  diagonaleRad: Math.PI / 4,
  famiglio: Object.freeze({ distanzaPx: 28, velocitaColpo: 3.6, gittataPx: 200, raggioColpo: 3.5, contattoOgniTick: 12,
    velocitaContatto: 1.6, finestraTiroTick: 20, omingForza: 0.06, cadenzaMinTick: 6 }),
  buio: Object.freeze({ raggioPx: 150 }),
  pool: Object.freeze({ pesoNegativi: 0.15, probDonoIngannevole: 0.5, probNegativoFucina: 0.35 }),
  cartiglioTick: 180,
  diario: Object.freeze({ colonne: 8, cellaL: 66, cellaA: 30 }),
});

// --- T3: inizio ---
// ECONOMIA DELL'AUTORE (roadmap «Novità nel Teatro», passo T3): prezzi della Fucina e drop di monete.
// Obiettivo: 5-8 monete in media al Piano 1. Verifica: `node gioco/teatro/sim-economia.js` (→ tools/sim-bilancio-teatro.js),
// che genera i piani e i drop col codice del gioco: i numeri restano solo QUI.
const ECONOMIA_T3 = {
  prezzi: { cuore: 3, consumabile: 2, base: 5, forte: 7, negativo: 2 }, // D: negativo = 2 (oggetti-teatro.md §1)
  // (bilancio 7) probMonetaAltre 0,35 → 0,5: con 6 stanze di combattimento la media del piano 1 era 5,3 (p10 = 1),
  // al bordo basso di 5-8; ora ~6,1 + rovi e carte ≈ 6,5 (tools/sim-bilancio-teatro.js, production/bilancio-teatro.md).
  piano1: { probMonetaSegreta: 0.5, probMonetaAltre: 0.5 },
  dorato: { prob3: 0.28, probExtra: 0.45 },
  boss: { prob3: 0.35 },
  pulizia: { probMoneta: 0.25, probCura: 0.40, valoreSegreta: 3 },
};

for (const o of CATALOGO_OGGETTI) {
  if (ECONOMIA_T3.prezzi[o.tier] != null) o.prezzo = ECONOMIA_T3.prezzi[o.tier];
}
// --- T3: fine ---

// --- D: inizio --- i negativi (anche i misti «negativi per prezzo», sugna e ranocchio) costano 2
for (const o of CATALOGO_OGGETTI) if (o.polarita === 'negativo') o.prezzo = ECONOMIA_T3.prezzi.negativo;
// --- D: fine ---

// Pool dei boss
/**
 * Re-Gatto (pattern 'salto_gatto') a salti (bug autore «il boss
 * che salta spara troppi colpi»: prima 84 proiettili in 10 s, 98 in rabbia, una rosa di 14 a ogni salto).
 * Ogni mossa è seguita da un riposo in cui il gatto si avvicina camminando; mai due mosse che sparano di
 * fila (dopo un salto alto o uno sputo vengono sempre i saltelli). Caso peggiore: 3 mosse che sparano in
 * 10 s × 8 colpi = 24 proiettili. Tempi in tick a 60 Hz, velocità in px/tick.
 */

const SALTI_REGATTO = Object.freeze({
  riposoTick: 75,             // pausa fra una mossa e l'altra (cammina verso il giocatore)
  riposoRabbiaTick: 55,       // in rabbia (vita sotto il 50%)
  passoRiposo: 0.45,          // frazione della velocità del boss mentre riposa
  pesoSaltoAlto: 0.5,         // probabilità delle mosse quando può sparare (il resto sono saltelli)
  pesoSputo: 0.35,
  saltoAlto: Object.freeze({ durataTick: 56, quotaPx: 95, inseguimento: 0.09, corona: 8, velocita: 1.35 }),
  sputo: Object.freeze({ caricaTick: 18, colpi: 6, apertura: 0.16, velocita: 1.9 }),
  saltelli: Object.freeze({ numero: 3, durataTick: 22, quotaPx: 14, passoPx: 26 }), // nessun colpo
});
// --- A: inizio ---
/**
 * BOSS_A (feedback autore A): parametri dei boss rifatti. Tick a 60 Hz, distanze in px, velocità in px/tick.
 * luciana: Donna Luciana non fa danno a contatto; spara a turno ventaglio, spirale e raffica mirata.
 *   Le sue DUE Mani riposano in alto, a turno mirano sopra il giocatore (ombra rossa a terra), scendono a
 *   schiacciare e fanno danno SOLO a contatto mentre toccano terra, poi risalgono.
 */

const BOSS_A = Object.freeze({
  luciana: Object.freeze({
    passo: 0.55,              // frazione della velocità del boss con cui si avvicina
    quotaRiposoY: 46,         // quota delle Mani a riposo (sopra il palco, come le Mani del teatro)
    scartoMani: 92,           // distanza orizzontale delle Mani dal corpo a riposo
    inseguimento: 0.07,       // inerzia delle Mani verso la posizione di riposo
    inseguimentoMira: 0.09,   // inerzia della Mano che mira sopra il giocatore
    primaAttesaTick: 70,      // prima del primo schianto
    pausaTick: 85,            // fra uno schianto e l'altro (le Mani si alternano)
    pausaRabbiaTick: 58,      // sotto il 50% della vita
    miraTick: 48, discesaTick: 14, aTerraTick: 26, risalitaTick: 34,
    palmoY: 8,                // punto di contatto (dita) rispetto al centro della Mano
    raggioSchianto: 20,       // raggio del contatto della Mano
    scala: 1.1,               // grandezza disegnata delle Mani
    cdSparoTick: 72, cdSparoRabbiaTick: 52,
    sequenza: Object.freeze(['ventaglio', 'spirale', 'mirato']),
    ventaglio: Object.freeze({ colpi: 5, apertura: 0.2, velocita: 2.3 }),
    spirale: Object.freeze({ colpi: 10, colpiRabbia: 12, velocita: 2.0, passo: 0.3 }),
    mirato: Object.freeze({ colpi: 3, intervalloTick: 8, velocita: 2.8 }),
  }),
  // spezzafili: Lo Spezzafili d'Ottone cammina verso il giocatore lanciando forbici rotanti che tornano
  //   indietro come boomerang; poi mira (linea rossa) e carica in linea retta. Sotto il 50% (fase 2) è più
  //   veloce, lancia due forbici a ventaglio e all'ingresso in fase 2 ne lancia una croce di quattro.
  spezzafili: Object.freeze({
    passo: 0.62, ondeggio: 0.5,          // camminata verso il giocatore (frazione velocità, serpeggio rad)
    camminaTick: 150, camminaFase2Tick: 105,
    miraTick: 36, caricaTick: 40, velCarica: 4.0, velCaricaFase2: 4.8, storditoTick: 34,
    cdForbiciTick: 62, cdForbiciFase2Tick: 46,
    forbici: Object.freeze({
      velocita: 3.4, frenata: 0.965, velMinima: 0.35, andataMaxTick: 70,
      velRitorno: 3.6, accelRitorno: 0.12, raggio: 9, vitaMaxTick: 420, rotazione: 0.38,
      aperturaFase2: 0.32, crocePerFase2: 4,
    }),
    moltVelFase2: 1.35,
  }),
  // custode: Il Custode di Marmo, immobile al centro. Macchina a stati con tabella esplicita
  //   (sequenza): pausa → croci (+ e × alternate) → pausa → spirale → pausa → raffica mirata a 3 → pausa →
  //   evocazione di 2 vespe o 2 statuette (a turno) → pausa → APERTO (vulnerabile, nessun attacco) → da capo.
  //   Danno subito ×1,5 da aperto e ×0,6 da chiuso. Durata stimata del duello per Ferruccio base
  //   (3,5 danno × 2,73 colpi/s, ~60% a segno = 5,7 danno/s): ciclo ≈ 607 tick con il 25% aperto →
  //   moltiplicatore medio ≈ 0,83 → ≈ 4,7 danno/s → 235 PV (piano 1) ≈ 50 s, 325 PV (piano 3) ≈ 69 s.
  custode: Object.freeze({
    x: 320, y: 165,
    sequenza: Object.freeze(['croci', 'spirale', 'raffica', 'evoca', 'aperto']),
    pausaTick: 40, pausaRabbiaTick: 28,
    croci: Object.freeze({ salve: 4, intervalloTick: 26, intervalloRabbiaTick: 20, velocita: 2.1 }),
    spirale: Object.freeze({ durataTick: 96, ogniTick: 8, bracci: 2, bracciRabbia: 3, giro: 0.22, velocita: 2.0 }),
    raffica: Object.freeze({ colpi: 3, intervalloTick: 9, velocita: 2.8 }),
    evoca: Object.freeze({ durataTick: 30, numero: 2, maxServi: 4, hpVespa: 8, hpStatuetta: 14 }),
    aperto: Object.freeze({ durataTick: 150 }),
    moltAperto: 1.5, moltChiuso: 0.6,
  }),
});
// --- A: fine ---

const POOL_BOSS = [
  { id: 're-gatto', nome: 'Il Gatto dei Quattro Canti', tipo: 'gatto', hpBase: 175, speed: 1.05, pattern: 'salto_gatto' },
  { id: 'capitano-guardia', nome: 'Il Capitano di Piombo', tipo: 'guardia', hpBase: 210, speed: 0.92, pattern: 'carica_capitano' },
  { id: 'regina-vespa', nome: 'La Regina delle Vespe', tipo: 'vespa', hpBase: 165, speed: 1.15, pattern: 'sciame_regina' },
  { id: 'colosso-statua', nome: 'Il Custode di Marmo', tipo: 'statua', hpBase: 235, speed: 0.40, pattern: 'torre_custode' },
  { id: 'maestro-fucina', nome: 'Lo Spezzafili d\'Ottone', tipo: 'guardia', hpBase: 195, speed: 1.05, pattern: 'scissor_blades' },
];

const BOSS_FINALE = {
  id: 'donna-luciana',
  nome: 'Donna Luciana — La Burattinaia del Velo',
  tipo: 'donna-luciana',
  hpBase: 480,
  speed: 0.92,
  pattern: 'marionette_queen',
};

const ARENA = { x1: 76, y1: 78, x2: 564, y2: 298 };
// --- C: inizio ---
/**
 * STANZE_C — parametri delle richieste dell'autore (feedback C).
 * banner: fascia del testo in alto, fra il riquadro HUD di sinistra (x 6..178) e la minimappa
 *   (x ≥ 516), sotto la barra del boss (y ≤ 30) e sopra la porta nord (y ≥ 52): la porta sud resta libera.
 * distanzaPorte: px minimi fra un nemico e ogni porta / il punto di entrata.
 * graziaIngressoMs: dopo l'ingresso in stanza i nemici non attaccano e il contatto non fa danno.
 * segreta: la crepa si vede solo entro raggioCrepa px; servono colpiMuro colpi sul muro giusto.
 */

const STANZE_C = Object.freeze({
  banner: Object.freeze({ x: 184, y: 33, w: 332, h: 17 }),
  distanzaPorte: 110,
  graziaIngressoMs: 700,
  segreta: Object.freeze({ raggioCrepa: 70, colpiMuro: 3, raggioEsplosione: 95 }),
});

/**
 * NOTTI_C — ogni notte (contatore dell'autore getNumeroNotte) cambia qualcosa. Le righe sono cumulative:
 * alla notte n valgono tutte quelle con daNotte ≤ n. Cambi visibili nell'hub, moderati nel gioco.
 *   notte 2: la sagoma di Mariella alla finestra illuminata (bibbia IX: «una finestra illuminata… una
 *            breve sagoma»); la luna si sposta di lunaPassoC celle per notte (fino a lunaMaxNotte).
 *   notte 3: una battuta nuova di Tonino; probNemicoExtra = probabilità di una Vespa in più per stanza.
 *   notte 4: hub più buio (buioExtra sull'opacità del velo notturno) e un NPC nuovo, una festaiola della
 *            festa del 1845 addormentata dal Velo (bibbia «La notte dell'inizio»).
 *   notte 5+: ricompense un po' migliori: bonusForte sulla probabilità di oggetto forte gratis,
 *            probMonetaExtra = probabilità di un grano in più a stanza pulita.
 */

const NOTTI_C = Object.freeze([
  Object.freeze({ daNotte: 2, mariellaAllaFinestra: true, lunaPassoC: 0.8, lunaMaxNotte: 6 }),
  Object.freeze({ daNotte: 3, battutaTonino: true, probNemicoExtra: 0.35 }),
  Object.freeze({ daNotte: 4, buioExtra: 0.16, npcNuovo: 'festaiola' }),
  Object.freeze({ daNotte: 5, bonusForte: 0.05, probMonetaExtra: 0.3 }),
]);

/** Effetti della notte n: unione delle righe di NOTTI_C con daNotte ≤ n (valori neutri se nessuna). */
/** Effetto del Medaglione di Rosa attivo stanotte (lo decide t4-hub-storia.js), o null. */
function medaglioneC() {
  const f = window.__teatro && window.__teatro.effettoMedaglioneC;
  try { return typeof f === 'function' ? f() : null; } catch (_) { return null; }
}

function effettiNotteC(n = getNumeroNotte()) {
  const e = { notte: n, mariellaAllaFinestra: false, lunaPassoC: 0, lunaMaxNotte: 1, battutaTonino: false,
    probNemicoExtra: 0, buioExtra: 0, npcNuovo: null, bonusForte: 0, probMonetaExtra: 0 };
  for (const riga of NOTTI_C) if (n >= riga.daNotte) Object.assign(e, riga);
  delete e.daNotte;
  return e;
}
// --- C: fine ---
