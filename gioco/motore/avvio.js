/**
 * motore/avvio.js — Radice di composizione della pagina.
 *
 * Unico modulo che conosce il DOM e tutti i moduli di `fondazione/`: li crea, li collega e avvia
 * il ciclo. Storie 001-004. Qui vivono anche:
 *  - l'adattamento del canvas (1280×720 logici scalati al contenitore, device pixel ratio rispettato);
 *  - il renderer SEGNAPOSTO (fondo dal token CSS, numero di tick in debug) che la storia 005
 *    sostituisce con `resa/renderer.js`; con `?debug=1&wire=1` al suo posto gira il disegno
 *    diagnostico in fil di ferro di `resa/debug.js` (storie 007-011), dentro una scena di prova
 *    con fantocci (`SCENA_WIRE`), e il ciclo entra subito nello stato `notte`;
 *  - la composizione di Ferruccio e del combattimento (storie 007-011): campo, modificatori,
 *    corpo, spada, bersagli;
 *  - con `?debug=1&wire=1&piano=N` (storie 014-017) il piano N viene generato dal seme
 *    (`mondo/generazione.js`) con i modelli di `contenuti/modelli-stanza/`, e al posto della scena di
 *    prova gira la notte (`mondo/notte.js`): stanza corrente, porte, ondate di nemici veri per
 *    archetipo (`attori/nemico.js`, storia 019: IA base, telegrafo, direttore dei gettoni),
 *    transizioni della camera; `window.__gioco` espone `piano`, `stanza`, `vaiA`, `direttore`;
 *  - l'economia (storia 025): salvataggio in localStorage → profilo (scintille), `oggetti/economia.js`
 *    (monete, drop, oggetti a terra, consumabili) e il banchetto di Tonino del piano
 *    (`oggetti/banchetto.js`, attivo nella stanza di tipo `banchetto`), con l'interfaccia DOM minimale
 *    (`interfaccia/banchetto.js`: HUD e lista dei prezzi, testi da `contenuti/interfaccia.json`);
 *  - i doni (storia 024): il pool della notte (`oggetti/pool.js`, generatore derivato 'pool', flag
 *    narrativi da `__gioco.flag` finché lo stato narrativo non è composto qui), i piedistalli della bottega (`oggetti/piedistallo.js`, attivi
 *    nella stanza `tesoro`), i ganci dei doni collegati agli eventi del combattimento e della stanza e
 *    gli effetti `doni.*` eseguiti dagli attori (`attori/effetti-doni.js`), l'HUD dei doni e il
 *    cartiglio in DOM (`interfaccia/doni.js`);
 *  - la storia (storie 026-027): lo stato narrativo (`storia/stato-narrativo.js`: storia.json, narrativa.json,
 *    ancoraggi.json, profilo nel salvataggio), gli incontri per ancoraggio (`storia/incontri.js`: scene,
 *    ripetizioni di `ripetizioni.json`, scelte, tableau), il cartiglio dei dialoghi e il tableau in DOM
 *    (`ui/cartiglio.js`, `ui/tableau.js`, stile `stile/cartiglio.css`); durante un dialogo il ciclo è in
 *    `pausa` (pausa logica: nemici e timer fermi) e torna in `notte` alla chiusura; nella stanza del
 *    banchetto `interagisci` lontano dagli slot parla con Tonino (ancoraggio `banchetto`), mai a porte
 *    chiuse; con `?debug=1&wire=1&scena=<id>` la scena parte subito (strumento di QA);
 *  - i ricordi (storia 028, `oggetti/ricordi.js`, `contenuti/parametri/ricordi.json`): all'evento
 *    `boss.sconfitto` {id, x, y} (il boss vero è della storia 022: in debug lo emette `__gioco.eventi`) il
 *    ricordo del boss cade a terra se il suo flag è `null`, si raccoglie passandoci sopra (dono azzurro),
 *    apre la scena di scelta solo se è in mano (`puoAprire` negli incontri), la decisione lo cede
 *    (scintille al profilo) o lo tiene fino a fine notte; morte → perso, il boss lo lascia di nuovo. Il
 *    pool dei doni legge ora i flag dallo stato narrativo (più gli override di `__gioco.flag`);
 *  - l'hub di Piazza Dante (storia 029, `mondo/hub.js`, modello `contenuti/modelli-stanza/hub/piazza-dante.json`):
 *    con `?debug=1&wire=1&hub=1` il ciclo resta in `hub`; l'hub monta il suo campo (mura chiuse tranne l'ingresso al
 *    piano), risolve le presenze sullo stato narrativo (Tonino al banchetto, porta della bottega chiusa finché
 *    `fucina_aperta` è falso, finestra accesa di Mariella, Taddeo se perdonato, Agnese se risvegliata, luna e fili
 *    d'oro), fa partire le scene automatiche del modello (notte 1: risveglio, tutorial, targa) e, quando Ferruccio
 *    attraversa l'ingresso, emette `hub.partenza` {piano, seme}: qui si genera il piano con quel seme (derivato dal
 *    seme del profilo e dal numero della notte), la notte parte (`avviaNotte`) e all'ingresso del piano partono le
 *    scene automatiche `ingresso-piano:N`; il cartellino DOM (`interfaccia/hub.js`) mostra la notte e i suggerimenti;
 *  - morte → risveglio e salvataggio della notte (storia 030, ADR-0006, GDD stato-narrativo regola 8):
 *    `storia/risveglio.js` ascolta `ferruccio.morto` e fa la sequenza in quattro fasi (`risveglio.json`, ≤ 5 s) mentre
 *    il ciclo sta in `pausa`; al `risveglio.fine` (notte + 1, doni e pool azzerati, economia nuova, Ferruccio in piedi)
 *    la notte è lasciata e si torna nell'hub (`hub.entra`, ciclo `hub`; senza hub la notte riparte dallo stesso seme);
 *    il velo DOM (`interfaccia/morte.js`) mostra la dissolvenza. `persistenza/notte-salvata.js` salva la notte a ogni
 *    `notte.stanza` e la cancella alla morte; nell'hub il pannello «Continua» (`interfaccia/ripresa.js`) la riprende
 *    rigenerando il piano dal seme nella stanza salvata (`avviaNotte` con `stanza`) e ripristinando maschere, doni e
 *    monete; `?debug=1&wire=1&hub=1&continua=1` preme «Continua» da solo all'avvio (strumento di QA);
 *  - storia P01 (PROVVISORIA, build di prova; la 022 la sostituisce): nella stanza `boss` la factory dei nemici riceve
 *    `boss: true` e crea il gatto con la taglia di `nemici.boss_provvisorio` (`schedaBossProvvisorio`); alla sua morte la
 *    stanza emette `boss.sconfitto` (i ricordi fanno cadere il Medaglione) e, pulita, attiva l'uscita: `piano.completato`
 *    → `storia/risveglio.js` registra `piano_max`, mostra il velo (`fine_piano.avvio`: qui pausa logica come alla morte)
 *    e chiude con lo stesso `risveglio.fine` della morte (motivo `vittoria`): si torna in piazza con notte + 1, la notte
 *    salvata è cancellata (`notte-salvata.js`); senza hub la notte riparte dallo stesso seme;
 *  - storia P02 (PROVVISORIA, build di prova): la pagina può dichiarare i parametri di avvio di default con
 *    `<meta name="gioco-avvio" content="debug=1&wire=1&hub=1">` (`fondazione/avvio-url.js`; l'URL vince sempre) e, se la
 *    meta c'è, all'avvio compare il pannello dei tasti (`interfaccia/prova.js`) che sparisce al primo tasto o click.
 *    Il gioco è pensato per la tastiera (e il gamepad): nessun controllo touch, per scelta dell'autore;
 *  - la superficie di debug `window.__gioco`, presente SOLO con `?debug=1` (ADR-0003).
 *
 * La risoluzione logica è un vincolo del motore (ADR-0001), non un valore di gioco.
 * Nessun numero di gioco e nessuna stringa di gioco qui: i parametri vengono dai JSON, i colori dai
 * token CSS, i testi (quando arriveranno) da contenuti/interfaccia.json.
 */

import { creaTempo } from './fondazione/tempo.js';
import { creaCiclo } from './fondazione/ciclo.js';
import { creaInput, collega as collegaInput } from './fondazione/input.js';
import { creaRng, derivato, mescola } from './fondazione/rng.js';
import { creaBus } from './fondazione/eventi.js';
import { creaParametri, leggiOverrideUrl } from './fondazione/parametri.js';
import { fondiDefault, leggiMetaAvvio } from './fondazione/avvio-url.js';
import { creaModificatori } from './oggetti/modificatori.js';
import { creaCampo } from './mondo/fisica.js';
import { creaFerruccio } from './attori/ferruccio.js';
import { creaCombattimento } from './attori/combattimento.js';
import { creaFantoccio } from './attori/bersaglio.js';
import { creaNemico as creaNemicoArchetipo, schedaBossProvvisorio } from './attori/nemico.js';
import { creaGatto, ARCHETIPO_GATTO } from './attori/gatto.js'; // storia 020: il gatto d'ombra con la posa
import { creaDirettore } from './attori/ia/direttore.js';
import { creaResaDebug } from './resa/debug.js';
import { creaRenderer } from './resa/renderer.js';
import { caricaModelli, creaCatalogo, regoleDaParametri, validaParametriGenerazione } from './mondo/modelli.js';
import { generaPiano } from './mondo/generazione.js';
import { creaCamera } from './mondo/camera.js';
import { creaNotte } from './mondo/notte.js';
import { creaSalvataggio } from './persistenza/salvataggio.js';
import { creaProfilo } from './persistenza/profilo.js';
import { creaEconomia } from './oggetti/economia.js';
import { creaBanchetto, puntiSlot, TIPI_SLOT } from './oggetti/banchetto.js';
import { creaInterfacciaEconomia } from './interfaccia/banchetto.js';
import { creaPool } from './oggetti/pool.js';
import { creaPiedistalli } from './oggetti/piedistallo.js';
import { collegaEffettiDoni, collegaGanci } from './attori/effetti-doni.js';
import { creaInterfacciaDoni } from './interfaccia/doni.js';
import { crea as creaStatoNarrativo } from './storia/stato-narrativo.js';
import { creaIncontri } from './storia/incontri.js';
import { creaCartiglio } from './ui/cartiglio.js';
import { creaTableau } from './ui/tableau.js';
import { creaRicordi } from './oggetti/ricordi.js';
import { creaHub } from './mondo/hub.js';
import { creaInterfacciaHub } from './interfaccia/hub.js';
import { creaRisveglio } from './storia/risveglio.js';
import { creaNotteSalvata, MOTIVI_CANCELLAZIONE } from './persistenza/notte-salvata.js';
import { creaInterfacciaMorte } from './interfaccia/morte.js';
import { creaInterfacciaRipresa } from './interfaccia/ripresa.js';
import { creaInterfacciaProva } from './interfaccia/prova.js';
import { creaMenu } from './interfaccia/menu.js'; // storia P04: menu di selezione (personaggio e slot)
import { creaStatistiche, calcolaStatistiche } from './attori/statistiche.js'; // storia P04: statistiche alla Isaac
// --- squadra oggetti (storie P04/P09): inizio ---
import { creaAttivi } from './oggetti/attivi.js';
import { creaSlot } from './oggetti/slot.js';
import { creaPatto } from './oggetti/patto.js';
import { creaGratis } from './oggetti/gratis.js';
import { creaSegreta } from './mondo/segreta.js';
import { creaInterfacciaOggetti } from './interfaccia/oggetti.js';
// --- squadra oggetti: fine ---

/** Risoluzione logica della scena (ADR-0001). */
const RISOLUZIONE = Object.freeze({ larghezza: 1280, altezza: 720 });

/** Cartella dei parametri e file da caricare (nomi di file, non valori di gioco). */
const CARTELLA_PARAMETRI = 'contenuti/parametri/';
const FILE_STATISTICHE = ['ferruccio', 'combattimento', 'stanza', 'stanze', 'generazione', 'nemici', 'economia', 'incontri', 'risveglio'];
const FILE_TABELLE = ['input', 'doni', 'sinergie', 'consumabili', 'ricordi', 'personaggi', 'oggetti-attivi', 'patto', 'boss'];
const FILE_MOTO_RIDOTTO = 'moto-ridotto';
/** Testi dell'interfaccia (storia 025) e slot del profilo salvato (nome di slot, non valore di gioco). */
const FILE_INTERFACCIA = 'contenuti/interfaccia.json';
/** Storia P04: i cinque slot del salvataggio (nomi di slot), lo slot predefinito e i parametri dell'URL che saltano il menu. */
const SLOTS = Object.freeze(['1', '2', '3', '4', '5']);
const SLOT_PREDEFINITO = '1';
const PARAM_SLOT = 'slot';
const PARAM_PERSONAGGIO = 'personaggio';
/** Contenuti della storia (storie 026-027): nomi di file, non valori di gioco. */
const FILE_STORIA = 'contenuti/storia.json';
const FILE_NARRATIVA = 'contenuti/narrativa.json';
const FILE_ANCORAGGI = 'contenuti/ancoraggi.json';
const FILE_RIPETIZIONI = 'contenuti/ripetizioni.json';
/** Tipo della stanza del banchetto e ancoraggio di Tonino dentro i piani (GDD incontri regola 1: `banchetto`). */
const STANZA_BANCHETTO = 'banchetto';
const ANCORAGGIO_BANCHETTO = 'banchetto';
/** Stati della stanza a porte aperte (stanza.js): fuori da questi, o con nemici vivi, nessun dialogo (regola 2). */
const STATI_PORTE_APERTE = ['non_visitata', 'pulita'];
/** Stanza fittizia della scena di prova `wire` per gli oggetti a terra dell'economia. */
const STANZA_WIRE = 'wire';

/** Contenuti del piano 1 (nomi di cartelle e file, non valori di gioco). */
const CARTELLA_MODELLI = 'contenuti/modelli-stanza/piazza-dante/';
const FILE_INDICE_MODELLI = 'indice';
const FILE_RISERVA = 'contenuti/piani/piazza-dante-riserva.json';
/** Storia 029: modello dell'hub di Piazza Dante (nomi di cartella e file) e prefisso degli ancoraggi automatici all'ingresso di un piano. */
const CARTELLA_MODELLI_HUB = 'contenuti/modelli-stanza/hub/';
const FILE_MODELLO_HUB = 'piazza-dante';
const ANCORAGGIO_INGRESSO_PIANO = 'ingresso-piano:';

/**
 * Scena diagnostica del modo `wire` (non è contenuto di gioco: posizioni in celle della griglia).
 * Ferruccio al centro; un fantoccio fermo a destra (`fermo`), uno che attacca a ciclo se l'URL ha
 * `fantoccio=attacca`, una colonna con un fantoccio dietro per la linea di colpo, un peso 3.
 */
const SCENA_WIRE = Object.freeze({
  ferruccio: { colonna: 6.5, riga: 3.5 },
  nemico: { colonna: 1.5, riga: 1.5 },
  ostacoli: [{ colonna: 4, riga: 3, id: 'colonna' }],
  fantocci: [
    { id: 'destra', colonna: 8.5, riga: 3.5 },
    { id: 'dietro-colonna', colonna: 3.5, riga: 3.5 },
    { id: 'pesante', colonna: 10.5, riga: 1.5, peso: 3, r: 22, vita: 20 },
    { id: 'attaccante', colonna: 6.5, riga: 5.5, automatico: 'fantoccio' },
  ],
});

/**
 * Legge un token CSS dalla radice del documento.
 * @param {string} nome es. '--colore-fondo'
 * @returns {string}
 */
function token(nome) {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

/**
 * Adatta il buffer del canvas alla sua dimensione a schermo moltiplicata per il device pixel ratio
 * e imposta la trasformazione così che il codice disegni sempre in coordinate logiche 1280×720.
 * @param {HTMLCanvasElement} canvas
 * @returns {number} fattore di scala logico → pixel fisici
 */
function adattaCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const r = canvas.getBoundingClientRect();
  const larghezza = Math.max(1, Math.round(r.width * dpr));
  const altezza = Math.max(1, Math.round(r.height * dpr));
  if (canvas.width !== larghezza || canvas.height !== altezza) {
    canvas.width = larghezza;
    canvas.height = altezza;
  }
  const scala = canvas.width / RISOLUZIONE.larghezza;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scala, 0, 0, scala, 0, 0);
  return scala;
}

/**
 * Legge il seme della notte dall'URL (`?seme=`) o lo deriva dall'orologio (mai dal generatore
 * casuale nativo: ADR-0003).
 * @param {URLSearchParams} query
 * @returns {number}
 */
function semeIniziale(query) {
  const daUrl = query.get('seme');
  if (daUrl !== null && Number.isFinite(Number(daUrl))) return Number(daUrl) >>> 0;
  return Date.now() >>> 0;
}

async function avvia() {
  const url = new URL(window.location.href);
  // storia P02 (provvisoria): `<meta name="gioco-avvio" content="debug=1&wire=1&hub=1">` dà i DEFAULT della query
  // (prova.html); l'URL vince sempre. `leggiOverrideUrl` deve vedere la query fusa.
  const metaAvvio = leggiMetaAvvio(document);
  if (metaAvvio !== null) url.search = fondiDefault(url.search, metaAvvio);
  const { debug, override } = leggiOverrideUrl(url.search);
  const motoRidotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const caricaJson = async (percorso) => {
    const risposta = await fetch(percorso, { cache: 'no-cache' });
    if (!risposta.ok) throw new Error(`impossibile caricare ${percorso} (${risposta.status})`);
    return risposta.json();
  };
  const parametri = creaParametri();
  await parametri.carica({
    caricatore: (nome) => caricaJson(`${CARTELLA_PARAMETRI}${nome}.json`),
    statistiche: FILE_STATISTICHE,
    tabelle: FILE_TABELLE,
    sovrascritture: motoRidotto ? [FILE_MOTO_RIDOTTO] : [],
    override,
  });
  for (const e of validaParametriGenerazione(parametri)) console.error(`[parametri] errore di contenuto: ${e}`);

  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('scena'));
  adattaCanvas(canvas);
  window.addEventListener('resize', () => adattaCanvas(canvas));

  const eventi = creaBus();
  const tempo = creaTempo();
  const ciclo = creaCiclo({ tempo, eventi });
  const seme = semeIniziale(url.searchParams);
  const rng = creaRng(seme);

  const input = creaInput(parametri.get('input'));
  collegaInput(input, {
    finestra: window,
    documento: document,
    canvas,
    navigatore: navigator,
    larghezza: RISOLUZIONE.larghezza,
    altezza: RISOLUZIONE.altezza,
  });

  // L'input è il primo sistema: fotografa i fronti all'inizio di ogni tick.
  ciclo.registra({ tick: () => input.inizioTick() });

  // Ferruccio e combattimento (storie 007-011): campo della stanza standard, statistiche effettive,
  // corpo, spada, bersagli. Girano solo nello stato `notte`.
  const wire = debug && url.searchParams.get('wire') === '1';
  const pianoRichiesto = Number(url.searchParams.get('piano'));
  const conPiano = debug && Number.isInteger(pianoRichiesto) && pianoRichiesto >= 1 && pianoRichiesto <= 5;
  // scena diagnostica dei fantocci: `?debug=1&wire=1` senza piano né hub (storie 007-011, 019-020, 027)
  const scenaWire = wire && !conPiano && url.searchParams.get('hub') !== '1';
  // storia 029 + P04: senza piano e senza scena di prova si parte dal menu e poi dall'hub di Piazza Dante;
  // `&hub=1`, `&piano=N`, `&slot=`/`&personaggio=` (QA) saltano il menu
  const conHub = !conPiano && !scenaWire;
  const saltaMenu = conPiano || scenaWire || url.searchParams.get('hub') === '1' || url.searchParams.has(PARAM_SLOT) || url.searchParams.has(PARAM_PERSONAGGIO);
  const slotUrl = url.searchParams.get(PARAM_SLOT);
  const slotScelto = slotUrl !== null && SLOTS.includes(slotUrl) ? slotUrl : SLOT_PREDEFINITO;
  // Storia 023: catalogo dei doni e sinergie dai JSON, probabilità dei ganci dal generatore derivato 'doni'.
  const modificatori = creaModificatori(parametri, {
    catalogo: parametri.get('doni'), sinergie: parametri.get('sinergie'), eventi, rng: derivato(rng, 'doni'),
  });
  const campo = creaCampo({
    colonne: parametri.get('stanza.colonne'),
    righe: parametri.get('stanza.righe'),
    cella: parametri.get('stanza.cella'),
    scenaLarghezza: RISOLUZIONE.larghezza,
    scenaAltezza: RISOLUZIONE.altezza,
    ostacoli: scenaWire ? SCENA_WIRE.ostacoli : [],
  });
  const cella = (c, r) => ({ x: campo.x + c * campo.cella, y: campo.y + r * campo.cella });
  const partenza = cella(SCENA_WIRE.ferruccio.colonna, SCENA_WIRE.ferruccio.riga);
  const ferruccio = creaFerruccio({ modificatori, tempo, eventi, input, campo, x: partenza.x, y: partenza.y });
  /** @type {object[]} */
  const bersagli = [];
  /** @type {object[]} */
  const proiettili = [];
  // storia P04: statistiche alla Isaac (personaggi.json); valgono solo dopo la scelta del personaggio (menu o `?personaggio=`)
  const tabPersonaggi = parametri.get('personaggi');
  const statistiche = creaStatistiche({ tabella: tabPersonaggi, modificatori });
  const combattimento = creaCombattimento({
    modificatori,
    tempo,
    eventi,
    input,
    campo,
    ferruccio,
    bersagli: () => bersagli,
    proiettiliBase: !scenaWire,
    statistiche: () => statistiche.correnti(),
    isaac: tabPersonaggi.isaac,
  });
  // Storia 025: profilo persistente (scintille) ed economia della notte (monete, drop con il generatore
  // derivato 'drop', oggetti a terra, consumabili); il banchetto del piano estrae gli slot dal generatore 'banchetto'.
  const salvataggio = creaSalvataggio();
  const profilo = creaProfilo({ salvataggio, slot: slotScelto, eventi });
  const pianoEconomia = conPiano ? pianoRichiesto : 1;
  const economia = creaEconomia({ parametri, eventi, rng: derivato(rng, 'drop'), profilo, ferruccio, modificatori, piano: pianoEconomia });
  const testiInterfaccia = await caricaJson(FILE_INTERFACCIA);
  // Storie 026-027: stato narrativo (profilo nello stesso salvataggio) e incontri per ancoraggio.
  const [storia, regoleNarrativa, ancoraggi, ripetizioni] = await Promise.all([FILE_STORIA, FILE_NARRATIVA, FILE_ANCORAGGI, FILE_RIPETIZIONI].map(caricaJson));
  const narrativa = creaStatoNarrativo({ storia, regole: regoleNarrativa, ancoraggi, eventi, salvataggio, slot: slotScelto });
  // Storia 028: i ricordi (dono azzurro con un volto); la scena di scelta si apre solo con il ricordo in mano.
  const ricordi = creaRicordi({
    parametri, catalogo: parametri.get('doni').doni, storia, narrativa, modificatori, profilo, economia, ferruccio, eventi,
    stanza: scenaWire ? STANZA_WIRE : null,
  });
  const incontri = creaIncontri({
    stato: narrativa, storia, ancoraggi, ripetizioni, parametri, eventi, testi: testiInterfaccia.incontri,
    notte: () => narrativa.avanzamento()[regoleNarrativa.piani.campo_notte], tipiSenzaAttesa: regoleNarrativa.tipi_senza_attesa,
    puoAprire: (scena) => ricordi.puoAprire(scena),
  });
  // pausa logica (regola 4): durante un dialogo il ciclo sta in `pausa`; alla chiusura torna in `notte`
  let pausaDaIncontro = false;
  eventi.on('incontri.avvio', () => {
    if (ciclo.stato() === 'notte') { ciclo.vaiA('pausa'); pausaDaIncontro = true; }
  });
  eventi.on('incontri.fine', () => {
    if (pausaDaIncontro && ciclo.stato() === 'pausa') ciclo.vaiA('notte');
    pausaDaIncontro = false;
  });
  // Storia 024: pool dei doni della notte (pesi W0_r e derive da economia.json; flag narrativi da un oggetto che lo
  // stato narrativo riempirà quando sarà composto qui — in debug è `__gioco.flag`), piedistalli, ganci ed effetti.
  const flagNotte = {};
  const RARITA = ['comune', 'raro', 'prezioso'];
  const pool = creaPool({
    catalogo: parametri.get('doni').doni,
    pesi: Object.fromEntries(RARITA.map((r) => [r, parametri.get(`economia.banchetto.peso_rarita.${r}`)])),
    derivePct: Object.fromEntries(RARITA.map((r) => [r, parametri.get(`economia.banchetto.deriva_rarita_pct.${r}`)])),
    fallbackMonete: parametri.get('economia.banchetto.fallback_monete'),
    rng: derivato(rng, 'pool'), flag: () => ({ ...narrativa.flag(), ...flagNotte }), restituiti: () => profilo.ricordiRestituiti, eventi,
  });
  pool.preparaPiano(pianoEconomia);
  // --- squadra oggetti (storia P09): i cinque slot dei doni; ogni acquisizione (piedistallo, banchetto, gratis) passa da `acquisisci` ---
  const slot = creaSlot({ modificatori, parametri, eventi, ferruccio });
  const acquisisci = (id, o) => slot.acquisisci(id, o);
  // --- squadra oggetti: fine ---
  const banchetto = creaBanchetto({
    economia, modificatori, parametri, catalogo: parametri.get('doni').doni, consumabili: parametri.get('consumabili').consumabili,
    rng: derivato(rng, 'banchetto'), piano: pianoEconomia, ferruccio, input, eventi, pool, acquisisci,
  });
  const piedistalli = creaPiedistalli({ pool, modificatori, parametri, piano: pianoEconomia, ferruccio, input, economia, eventi, acquisisci });
  collegaGanci({ eventi, modificatori, combattimento });
  // Storia 030: morte → risveglio (sequenza a fasi, poi notte + 1 e azzeramento di doni, pool ed economia).
  const risveglio = creaRisveglio({
    parametri, tempo, eventi, narrativa, modificatori, ferruccio, economia, pool, combattimento, campoNotte: regoleNarrativa.piani.campo_notte,
  });
  ciclo.registra({ tick: (dt) => risveglio.tick(dt) }, { stati: ['notte', 'pausa'] });
  // pausa logica durante la sequenza (morte o fine del piano, storia P01): nemici, pericoli e timer fermi; il velo gira sul disegno
  const pausaPerSequenza = () => {
    pausaDaIncontro = false;
    if (ciclo.stato() === 'notte') ciclo.vaiA('pausa');
  };
  eventi.on('morte.avvio', pausaPerSequenza);
  eventi.on('fine_piano.avvio', pausaPerSequenza);
  const effettiDoni = collegaEffettiDoni({ eventi, parametri, modificatori, ferruccio, bersagli: () => bersagli, proiettili });
  ciclo.registra({ tick: (dt) => modificatori.tick(dt) }, { stati: ['notte'] });
  // Storia 019: nemici veri per archetipo (nemici.json), un direttore dei gettoni per piano
  // (si azzera a ogni `stanza.entrata`), generatori derivati dal seme per nemico.
  let pianoCorrente = conPiano ? pianoRichiesto : 1;
  const direttore = creaDirettore({
    gettoni: parametri.get(`nemici.direttore.gettoni.p${pianoCorrente}`),
    gapTicks: tempo.ticksDaMs(parametri.get('nemici.direttore.gap_impatti_min')),
    imparabiliMax: parametri.get(`nemici.direttore.imparabili_max.p${pianoCorrente}`),
    attaccantiMax: parametri.get('nemici.direttore.attaccanti_max'), // storia 020: tetto agli attaccanti contemporanei
    eventi,
  });
  ciclo.registra({ tick: () => direttore.tick() }, { stati: ['notte'] });
  let rngNemici = derivato(rng, 'nemici'); // storia 029: dalla partenza dall'hub deriva dal seme della notte
  let natiNemici = 0;

  /** Storia P04: pool dei boss dei piani 1-3 (estratti senza ripetizione a ogni run) e Donna Luciana al piano finale del
   *  ciclo, da `contenuti/parametri/boss.json` (prima costanti qui). */
  const tabBoss = parametri.get('boss');
  const POOL_BOSS_PIANI = tabBoss.pool;
  const BOSS_FINALE_DONNA_LUCIANA = tabBoss.finale;
  const PIANI_PER_CICLO = tabBoss.piani_per_ciclo.base;
  let semeRun = seme;
  let usiModelliRun = {};
  let bossRun = mescola(derivato(creaRng(semeRun), 'boss-run'), POOL_BOSS_PIANI);
  const bossDelPiano = (p) => {
    const pianoNelCiclo = ((p - 1) % PIANI_PER_CICLO) + 1;
    return pianoNelCiclo === tabBoss.piano_finale_nel_ciclo.base ? BOSS_FINALE_DONNA_LUCIANA : bossRun[(p - 1) % bossRun.length];
  };

  /** Factory dei nemici delle ondate (iniettata nella stanza): archetipo dalla tavolozza del modello;
   *  con `boss: true` seleziona il boss randomico della run per i piani 1-3 e Donna Luciana al piano 4. */
  const creaNemico = ({ archetipo, x, y, id, boss = false }) => {
    const infoBoss = boss ? bossDelPiano(pianoCorrente) : null;
    const archEffettivo = infoBoss ? infoBoss.archetipoBase : archetipo;
    const baseTaglia = boss ? schedaBossProvvisorio({ modificatori, parametri }) : null;
    const schedaBoss = boss && baseTaglia && infoBoss
      ? {
        vita: Math.max(tabBoss.vita_min.base, baseTaglia.vita + (pianoCorrente - 1) * tabBoss.vita_per_piano.base + infoBoss.bonusVita),
        scalaRaggio: infoBoss.scalaRaggio,
        scalaPortata: infoBoss.scalaPortata,
      }
      : baseTaglia;
    const attore = (archEffettivo === ARCHETIPO_GATTO ? creaGatto : creaNemicoArchetipo)({
      modificatori, parametri, tempo, eventi, campo, bersaglio: combattimento.comeBersaglio, altri: () => bersagli, direttore,
      rng: derivato(rngNemici, `${id}#${natiNemici++}`), archetipo: archEffettivo, piano: pianoCorrente, x, y, id,
      ferito: () => ferruccio.maschere < modificatori.valore('ferruccio.maschere_max'),
      boss, schedaBoss,
    });
    if (infoBoss) {
      attore.bossId = infoBoss.id;
      attore.nomeBoss = infoBoss.nome;
    }
    return attore;
  };

  // Piano generato dal seme (storie 014-017): modelli, catalogo, pianta, camera e notte. Dalla storia 029 la
  // notte può partire anche dopo, dall'hub (`avviaNotte` con il seme derivato dal profilo): `notte` è riassegnata
  // e chi la usa la legge in modo pigro.
  let notte = null;
  let camera = null;
  let catalogoModelli = null;
  let riservaPiano = null;
  /** Carica una volta i modelli del piano 1 e il piano di riserva. */
  async function caricaCatalogo() {
    if (catalogoModelli) return catalogoModelli;
    const indice = await caricaJson(`${CARTELLA_MODELLI}${FILE_INDICE_MODELLI}.json`);
    const { modelli } = await caricaModelli({
      caricatore: (nome) => caricaJson(`${CARTELLA_MODELLI}${nome}.json`),
      indice,
      regole: regoleDaParametri(parametri),
    });
    riservaPiano = await caricaJson(FILE_RISERVA);
    catalogoModelli = creaCatalogo(modelli);
    return catalogoModelli;
  }
  /**
   * Genera il piano dal seme e monta la notte nella stanza d'ingresso, o nella stanza `stanza` se è data
   * e esiste nel piano (ripresa, storia 030). Il catalogo deve essere caricato.
   * @param {{ seme: number, piano: number, stanza?: string | null }} o
   */
  function avviaNotte({ seme: semeNotte, piano, stanza = null }) {
    pianoCorrente = piano;
    const pianoModello = ((piano - 1) % PIANI_PER_CICLO) + 1;
    const esito = generaPiano({ seme: semeNotte + piano * tabBoss.seme_sale.base, piano: pianoModello, usiModelli: usiModelliRun, parametri, catalogo: catalogoModelli, riserva: riservaPiano });
    usiModelliRun = esito.usiModelli;
    rngNemici = derivato(creaRng(semeNotte), `nemici-p${piano}`);
    natiNemici = 0;
    notte = creaNotte({
      seme: semeNotte, numeroPiano: pianoModello, pianta: esito.pianta, catalogo: catalogoModelli, parametri, tempo, eventi, campo, scena: RISOLUZIONE,
      ferruccio, combattimento, bersagli, proiettili, camera, creaNemico,
    });
    const ingressoId = esito.pianta.stanze.find((st) => st.tipo === 'ingresso').id;
    const iniziale = stanza && esito.pianta.stanze.some((st) => st.id === stanza) ? stanza : ingressoId;
    if (stanza && iniziale !== stanza) console.error(`[avvio] la stanza salvata '${stanza}' non è nel piano rigenerato: si riparte dall'ingresso`);
    notte.entra(iniziale);
    return notte;
  }
  /** Lascia la notte in corso (morte): nessuna stanza montata, liste vuote, banchetto e piedistalli spenti. */
  function lasciaNotte() {
    notte = null;
    bersagli.length = 0;
    proiettili.length = 0;
    banchetto.attiva(false);
    piedistalli.disattiva();
  }
  // Storia 030: la notte salvata a ogni cambio di stanza (ADR-0006) e cancellata alla morte; `riprendiNotte` è «Continua».
  const notteSalvata = creaNotteSalvata({
    salvataggio, slot: slotScelto, eventi, notte: () => notte, ferruccio, modificatori, economia, pool,
    numeroNotte: () => narrativa.avanzamento()[regoleNarrativa.piani.campo_notte],
  });
  function riprendiNotte() {
    if (!catalogoModelli || !camera) return false;
    const esito = notteSalvata.riprendi({
      avvia: ({ seme: semeNotte, piano, stanza }) => {
        hub?.esci();
        avviaNotte({ seme: semeNotte, piano, stanza });
      },
    });
    if (!esito.ok) return false;
    if (ciclo.stato() === 'hub') ciclo.vaiA('notte');
    return true;
  }
  if (!scenaWire) {
    camera = creaCamera({ parametri, tempo, scena: RISOLUZIONE, eventi });
    await caricaCatalogo();
    // storia 025: il banchetto è attivo (slot posizionati sui banchi del modello) solo nella sua stanza
    eventi.on('notte.stanza', ({ tipo }) => {
      if (tipo === 'banchetto' && notte?.stanza) {
        banchetto.posiziona(puntiSlot(notte.stanza, TIPI_SLOT.length));
        banchetto.attiva(true);
      } else {
        banchetto.attiva(false);
      }
      // storia 024: i piedistalli vivono solo nella bottega (stanza `tesoro`)
      if (tipo === 'tesoro' && notte?.stanza) piedistalli.attiva(notte.stanza);
      else piedistalli.disattiva();
    });
  }
  if (conPiano) avviaNotte({ seme, piano: pianoRichiesto });
  // Discesa al piano successivo (1 → 2 → 3 → 4) dopo aver battuto il boss del piano:
  // Ferruccio conserva tutti gli oggetti (doni), le monete e le maschere, mentre la Fucina e la Stanza Oggetto estraggono nuovi oggetti randomici!
  eventi.on('piano.discesa', ({ aPiano }) => {
    if (scenaWire) return;
    lasciaNotte();
    pool.preparaPiano(aPiano);
    banchetto.rigenera(aPiano);
    piedistalli.impostaPiano(aPiano);
    avviaNotte({ seme: semeRun, piano: aPiano });
    if (ciclo.stato() === 'pausa') ciclo.vaiA('notte');
    incontri.automatiche(`${ANCORAGGIO_INGRESSO_PIANO}${aPiano}`);
  });

  // Al risveglio (morte o vittoria finale al 4° piano contro Donna Luciana): nuova run con nuovo seme, stanze, boss e oggetti tutti nuovi!
  eventi.on('risveglio.fine', () => {
    if (!scenaWire) lasciaNotte();
    if (!url.searchParams.has('seme')) {
      semeRun = (semeRun + tabBoss.passo_seme_run.base) >>> 0;
    }
    usiModelliRun = {};
    bossRun = mescola(derivato(creaRng(semeRun), 'boss-run'), POOL_BOSS_PIANI);
    if (hub) {
      hub.entra();
      camera?.inquadra(campo);
      if (ciclo.stato() !== 'hub') ciclo.vaiA('hub');
    } else {
      if (conPiano) {
        pool.preparaPiano(1);
        banchetto.rigenera(1);
        piedistalli.impostaPiano(1);
        avviaNotte({ seme: semeRun, piano: 1 });
      }
      if (ciclo.stato() === 'pausa') ciclo.vaiA('notte');
    }
  });
  // Storia 029: l'hub di Piazza Dante come stanza speciale (mondo/hub.js): presenze dallo stato narrativo,
  // Tonino al banchetto, la porta della bottega, l'ingresso al piano; attraversandolo parte la notte con il
  // seme derivato dal profilo (`hub.partenza`), e all'ingresso del piano partono le scene automatiche.
  let hub = null;
  if (conHub) { // storia P04: anche senza `&hub=1` (menu → hub)
    const modelloHub = await caricaJson(`${CARTELLA_MODELLI_HUB}${FILE_MODELLO_HUB}.json`);
    hub = creaHub({
      modello: modelloHub, parametri, eventi, campo, scena: RISOLUZIONE, ferruccio, input, narrativa, incontri,
      semeProfilo: seme, campoNotte: regoleNarrativa.piani.campo_notte,
    });
    eventi.on('hub.partenza', ({ seme: semeNotte, piano }) => {
      if (notteSalvata.presente) notteSalvata.cancella(MOTIVI_CANCELLAZIONE.lasciata); // storia 030: una partenza nuova lascia la notte salvata
      hub.esci();
      semeRun = semeNotte;
      usiModelliRun = {};
      bossRun = mescola(derivato(creaRng(semeRun), 'boss-run'), POOL_BOSS_PIANI);
      pool.preparaPiano(piano);
      banchetto.rigenera(piano);
      piedistalli.impostaPiano(piano);
      avviaNotte({ seme: semeNotte, piano });
      if (ciclo.stato() === 'hub') ciclo.vaiA('notte');
      incontri.automatiche(`${ANCORAGGIO_INGRESSO_PIANO}${piano}`);
    });
  }

  if (scenaWire) {
    const attaccaAuto = url.searchParams.get('fantoccio') === 'attacca';
    // storia 019: `&nemico=<archetipo>` aggiunge un nemico vero (nemici.json) in alto a sinistra della scena di prova
    const archetipoWire = url.searchParams.get('nemico');
    if (archetipoWire && parametri.ha(`nemici.archetipi.${archetipoWire}`)) {
      const p = cella(SCENA_WIRE.nemico.colonna, SCENA_WIRE.nemico.riga);
      bersagli.push(creaNemico({ archetipo: archetipoWire, x: p.x, y: p.y, id: 'nemico' }));
    }
    for (const f of SCENA_WIRE.fantocci) {
      const p = cella(f.colonna, f.riga);
      bersagli.push(creaFantoccio({
        modificatori, tempo, eventi, campo, bersaglio: combattimento.comeBersaglio,
        id: f.id, x: p.x, y: p.y, peso: f.peso, r: f.r, vita: f.vita,
        automatico: f.automatico === 'fantoccio' && attaccaAuto,
      }));
    }
  }
  if (!scenaWire) {
    // la notte fa girare lei Ferruccio, combattimento, bersagli, proiettili e stanza (e ignora l'input in transizione);
    // nell'hub (storia 029) gira l'hub: solo Ferruccio, le presenze e l'ingresso
    ciclo.registra({ tick: (dt) => notte?.tick(dt) }, { stati: ['notte'] });
    if (hub) ciclo.registra({ tick: (dt) => hub.tick(dt) }, { stati: ['hub'] });
  } else {
    economia.entraIn(STANZA_WIRE);
    ciclo.registra(ferruccio, { stati: ['notte'] });
    ciclo.registra(combattimento, { stati: ['notte'] });
    ciclo.registra({
      tick: (dt) => {
        for (const b of bersagli) b.tick(dt);
        for (const p of proiettili) p.tick(dt);
      },
    }, { stati: ['notte'] });
  }

  // storia 025: raccolta passando sopra e tasto `interagisci` al banchetto, dopo la notte (stessi stati)
  ciclo.registra({ tick: () => { economia.tick(); banchetto.tick(); piedistalli.tick(); ricordi.tick(); } }, { stati: ['notte'] });
  // storia 027: nella stanza del banchetto, `interagisci` lontano dagli slot parla con Tonino; a porte chiuse niente
  ciclo.registra({
    tick: () => {
      const st = notte?.stanza;
      if (!st || st.tipo !== STANZA_BANCHETTO || !input.premuto('interagisci') || banchetto.vicino() >= 0) return;
      incontri.interagisci(ANCORAGGIO_BANCHETTO, { porteChiuse: st.vivi() > 0 || !STATI_PORTE_APERTE.includes(st.stato) });
    },
  }, { stati: ['notte'] });
  const interfaccia = creaInterfacciaEconomia({
    documento: document, contenitore: document.getElementById('interfaccia'), testi: testiInterfaccia, economia, ferruccio,
    maschereMax: () => modificatori.valore('ferruccio.maschere_max'), banchetto: () => banchetto,
    nomeDono: (id) => modificatori.dono(id)?.nome ?? id, tastoInteragisci: () => parametri.get('input.tastiera.interagisci')[0],
  });
  const interfacciaDoni = creaInterfacciaDoni({
    documento: document, contenitore: document.getElementById('interfaccia'), testi: testiInterfaccia, modificatori, eventi,
    piedistalli: () => piedistalli, tCartiglioMs: () => parametri.get('doni').piedistallo.t_cartiglio.base,
    tastoInteragisci: () => parametri.get('input.tastiera.interagisci')[0],
  });
  ciclo.registra({ tick: (dt) => interfacciaDoni.tick(dt) }, { stati: ['notte'] });
  // storia 029: cartellino DOM dell'hub (notte, suggerimento), visibile solo con l'hub attivo
  const interfacciaHub = creaInterfacciaHub({
    documento: document, contenitore: document.getElementById('interfaccia'), testi: testiInterfaccia, hub: () => hub, ferruccio,
    nomeDi: (id) => storia.personaggi?.[id]?.nome ?? id, tastoInteragisci: () => parametri.get('input.tastiera.interagisci')[0],
  });
  // storia 027: cartiglio dei dialoghi e tableau (DOM), vivi anche in `pausa` e nell'hub
  const cartiglio = creaCartiglio({
    documento: document, contenitore: document.getElementById('interfaccia'), testi: testiInterfaccia, input, incontri,
    antirimbalzoMs: () => parametri.get('incontri.antirimbalzo'),
  });
  const tableau = creaTableau({
    documento: document, contenitore: document.getElementById('interfaccia'), input, incontri, tMinMs: () => parametri.get('incontri.tableau.t_min'),
  });
  ciclo.registra({ tick: (dt) => { cartiglio.tick(dt); tableau.tick(dt); } }, { stati: ['notte', 'pausa', 'hub'] });
  // storia 030: velo della sequenza di morte e pannello «Continua» (solo nell'hub, se c'è una notte salvata)
  const interfacciaMorte = creaInterfacciaMorte({ documento: document, contenitore: document.getElementById('interfaccia'), testi: testiInterfaccia, risveglio: () => risveglio });
  const interfacciaRipresa = creaInterfacciaRipresa({
    documento: document, contenitore: document.getElementById('interfaccia'), testi: testiInterfaccia, notteSalvata,
    visibile: () => Boolean(hub?.attivo) && ciclo.stato() === 'hub', suContinua: riprendiNotte, motivoLasciata: MOTIVI_CANCELLAZIONE.lasciata,
  });
  // storia P02: pannello delle istruzioni iniziali, solo nella pagina con la meta `gioco-avvio` (prova.html)
  const interfacciaProva = metaAvvio !== null
    ? creaInterfacciaProva({ documento: document, finestra: window, contenitore: document.getElementById('interfaccia'), testi: testiInterfaccia })
    : null;
  ciclo.registra({ disegna: () => { interfaccia.aggiorna(); interfacciaDoni.aggiorna(); cartiglio.aggiorna(); tableau.aggiorna(); interfacciaHub.aggiorna(); interfacciaMorte.aggiorna(); interfacciaRipresa.aggiorna(); } });

  // storia P04: il menu di selezione (personaggio e slot) e l'applicazione della scelta. Il ciclo parte in `menu`;
  // dal menu si va all'hub con il personaggio scelto; Esc nell'hub (azione `menu`, a dialogo chiuso) torna al menu.
  // Cambiare slot ricarica la pagina con `?slot=&personaggio=`: profilo, stato narrativo e notte salvata sono legati allo
  // slot alla composizione. Le statistiche del personaggio si applicano al corpo unico (il corpo è uno, cambia la scheda).
  const menu = creaMenu({
    documento: document, finestra: window, contenitore: document.getElementById('interfaccia'), testi: testiInterfaccia,
    personaggi: tabPersonaggi, attivi: parametri.get('oggetti-attivi').attivi, salvataggio, slots: SLOTS.slice(),
    nomeDono: (id) => {
      const doni = parametri.get('doni').doni;
      const d = doni.find((x) => x.teatro?.id_teatro === id || x.id === id);
      return d?.nome ?? id;
    },
    statistiche: (id) => calcolaStatistiche({ personaggio: tabPersonaggi.personaggi[id], isaac: tabPersonaggi.isaac, catalogo: parametri.get('doni').doni }),
  });
  function applicaScelta({ personaggio, slot }) {
    if (slot !== slotScelto) {
      const u = new URL(window.location.href);
      u.searchParams.set(PARAM_SLOT, slot);
      u.searchParams.set(PARAM_PERSONAGGIO, personaggio);
      window.location.assign(u.href);
      return false;
    }
    // la scelta può arrivare anche da `__gioco.scegli` (QA) mentre il menu è aperto: va chiuso qui, altrimenti resta a
    // schermo e continua a catturare i suoi tasti (frecce/WASD, Invio) sopra l'hub
    if (menu.aperto) menu.chiudi();
    statistiche.scegli(personaggio);
    ferruccio.impostaMaschere(modificatori.valore('ferruccio.maschere_max'));
    salvataggio.salva('profilo', slot, { ...(salvataggio.carica('profilo', slot) ?? {}), [PARAM_PERSONAGGIO]: personaggio });
    eventi.emit('personaggio.scelto', { personaggio, slot, statistiche: statistiche.correnti() });
    if (hub) {
      hub.entra();
      if (ciclo.stato() === 'menu') ciclo.vaiA('hub');
    }
    return true;
  }
  async function apriMenu() {
    if (menu.aperto) return null;
    if (ciclo.stato() === 'hub') {
      hub?.esci();
      ciclo.vaiA('menu');
    }
    const scelta = await menu.apri({ personaggio: statistiche.id, slot: slotScelto });
    applicaScelta(scelta);
    return scelta;
  }
  ciclo.registra({
    tick: () => { if (hub?.attivo && input.premuto('menu') && !incontri.dialogo()) apriMenu(); },
  }, { stati: ['hub'] });

  // --- squadra oggetti (storie P04/P09): oggetto attivo (Q), Patto d'Ombra (altare dopo il boss), oggetti gratis, Crepa Dorata
  // della segreta, interfaccia DOM (HUD dell'attivo, modale dei cinque slot, conferma del patto). Numeri da oggetti-attivi.json,
  // patto.json, economia.json › gratis/monete_segreta; testi da interfaccia.json. ---
  const tabAttivi = parametri.get('oggetti-attivi');
  const attivi = creaAttivi({ tabella: tabAttivi, eventi, ferruccio, modificatori, bersagli: () => bersagli, proiettili, input, statistiche: () => statistiche.correnti() });
  eventi.on('personaggio.scelto', ({ personaggio }) => attivi.equipaggia(tabPersonaggi.personaggi[personaggio]?.attivoIniziale ?? null));
  const tabPatto = parametri.get('patto');
  combattimento.impostaRaggio(tabPatto.regole?.raggio ?? null);
  const patto = creaPatto({ tabella: tabPatto, eventi, statistiche, ferruccio, modificatori, parametri, rng: derivato(rng, 'patto'), notte: () => notte, input });
  const gratis = creaGratis({ parametri, catalogo: parametri.get('doni').doni, eventi, notte: () => notte, ferruccio, modificatori, acquisisci, input });
  const segreta = creaSegreta({ eventi, notte: () => notte, combattimento, ferruccio, parametri, economia });
  ciclo.registra({ tick: () => { if (!notte && !scenaWire) return; attivi.tick(); patto.tick(); gratis.tick(); segreta.tick(); } }, { stati: ['notte'] });
  eventi.on('piano.discesa', () => { patto.nuovoPiano(); gratis.nuovoPiano(); segreta.nuovoPiano(); });
  eventi.on('risveglio.fine', () => { patto.nuovaRun(); gratis.nuovaRun(); segreta.nuovoPiano(); attivi.nuovaRun(); slot.annulla(); });
  eventi.on('hub.partenza', () => { patto.nuovaRun(); gratis.nuovaRun(); segreta.nuovoPiano(); attivi.nuovaRun(); });
  const interfacciaOggetti = creaInterfacciaOggetti({
    documento: document, finestra: window, contenitore: document.getElementById('interfaccia'), testi: testiInterfaccia, attivi, slot, patto, modificatori,
    tastoAttivo: () => parametri.get('input.tastiera.attivo')[0], tastoConferma: () => parametri.get('input.tastiera.conferma')[0],
    tastoIndietro: () => parametri.get('input.tastiera.indietro')[0],
  });
  ciclo.registra({ disegna: () => interfacciaOggetti.aggiorna() });
  const squadraOggetti = { attivi: () => attivi, slot: () => slot, patto: () => patto, gratis: () => gratis, segreta: () => segreta };
  const debugOggetti = { attivi, slot, patto, gratis, segreta, interfacciaOggetti: () => interfacciaOggetti.stato() };
  // --- squadra oggetti: fine ---

  // Renderer del Teatro (pixel-art) sempre; con `?debug=1&wire=1&diagnostica=1` il disegno diagnostico in fil di ferro.
  const usaDiagnostica = wire && url.searchParams.get('diagnostica') === '1';
  const creaResa = usaDiagnostica ? creaResaDebug : creaRenderer;
  ciclo.registra(creaResa({
    canvas, campo, ferruccio, combattimento, bersagli: () => bersagli, proiettili: () => proiettili,
    token, scena: RISOLUZIONE, contaTick: ciclo.contaTick, notte: () => notte, camera,
    economia: () => economia, banchetto: () => banchetto, piedistalli: () => piedistalli, ricordi: () => ricordi,
    hub: () => hub, ciclo, eventi, motoRidotto,
    squadraOggetti, // --- squadra oggetti (storie P04/P09): crepa, gratis, altare, raggio ---
  }));
  if (saltaMenu) {
    ciclo.vaiA('hub');
    if (!conHub) ciclo.vaiA('notte');
  }

  if (debug) {
    /** Superficie di debug (ADR-0003, storia 004). `imposta` e `vaiA` sono ganci per le storie
     *  dello stato narrativo e delle stanze: finché quei moduli non si registrano, rispondono false. */
    const ganci = { imposta: (flag, valore) => narrativa.imposta(flag, valore).ok, vaiA: (id) => (notte ? notte.vaiA(id) : false) };
    /** Sorgente sintetica della tastiera per un'azione (primo tasto della mappa). */
    const sorgente = (azione) => `t:${parametri.get(`input.tastiera.${azione}`)[0]}`;
    window.__gioco = Object.freeze({
      get stato() { return ciclo.stato(); },
      tick: (n) => ciclo.tick(n ?? 0),
      seme,
      parametri,
      eventi,
      input,
      ciclo,
      rng,
      motoRidotto,
      modificatori,
      campo,
      ferruccio,
      combattimento,
      bersagli,
      proiettili,
      wire,
      /** Storie 014-017: pianta del piano, stanza corrente (storia P01: anche `boss`, `uscita`, `combatteBoss`), notte e camera (null senza `?piano=N`). */
      get piano() { return notte?.pianta ?? null; },
      get stanza() { return notte?.stanza ?? null; },
      get notte() { return notte; },
      camera,
      /** Storia 029: l'hub (`presenze`, `vicino`, `semeNotte`, `notte`, `entra`, `partito`) e lo stato del suo cartellino DOM. */
      hub,
      cartellinoHub: () => interfacciaHub.stato(),
      /** Storia 030: il risveglio (`fase`, `progresso`, `stato()`; storia P01: `motivo`, `completaPiano(piano)`), la notte salvata
       *  (`presente`, `carica`, `cancella`, `fotografa`), il pannello «Continua» (`ripresa.continua()` / `lascia()` / `stato()`) e lo
       *  stato del velo di morte (e di fine piano) nel DOM. */
      risveglio,
      notteSalvata,
      ripresa: { continua: () => interfacciaRipresa.continua(), lascia: () => interfacciaRipresa.lascia(), stato: () => interfacciaRipresa.stato() },
      veloMorte: () => interfacciaMorte.stato(),
      /** Storia P02 (provvisoria): pannello delle istruzioni iniziali di prova.html (`true` finché è a schermo, `null` senza la meta). */
      pannelloProva: () => (interfacciaProva ? interfacciaProva.visibile() : null),
      /** Storia P04: statistiche alla Isaac (`correnti()`, `scegli(id)`, `stringiPatto`, `id`), slot del salvataggio in uso, il
       *  menu DOM (`menu()` = stato o null, `apriMenu()`, `scegli(personaggio, slot)` = applica subito la scelta). */
      statistiche,
      slot: slotScelto,
      menu: () => menu.stato(),
      apriMenu,
      scegli: (personaggio, slot = slotScelto) => applicaScelta({ personaggio, slot }),
      /** Storia 019: direttore degli attacchi e factory dei nemici (`creaNemico({archetipo, x, y, id})` aggiunge ai bersagli). */
      direttore,
      creaNemico: (o) => { const n = creaNemico(o); bersagli.push(n); return n; },
      /** Storia 025: economia della notte (monete, oggetti a terra), banchetto del piano, profilo (scintille), salvataggio. */
      economia,
      banchetto,
      profilo,
      salvataggio,
      /** Storia 024: pool dei doni, piedistalli della bottega, effetti dei ganci, stato del cartiglio e i flag
       *  narrativi letti dal pool (oggetto scrivibile di debug, finché lo stato narrativo non è composto qui). */
      pool,
      piedistalli,
      effettiDoni,
      cartiglio: () => interfacciaDoni.cartiglio(),
      flag: flagNotte,
      /** Storie 026-027: stato narrativo, incontri, dialogo corrente, stato del cartiglio dei dialoghi e del tableau. */
      narrativa,
      incontri,
      dialogo: () => incontri.dialogo(),
      cartiglioScena: () => cartiglio.stato(),
      tableau: () => tableau.stato(),
      /** Storia 028: i ricordi (`cade`, `raccogli`, `inMano`, `aTerra`, `puoAprire`, `perdi`, `modello`, `stato`); il drop
       *  si prova con `eventi.emit('boss.sconfitto', { id: 'gatto', x, y })`. */
      ricordi,
      /** Tiene giù un'azione del contratto (es. 'destra') finché non si chiama `lascia`. */
      tieni: (azione) => input.sorgenteGiu(sorgente(azione)),
      lascia: (azione) => input.sorgenteSu(sorgente(azione)),
      /** Preme un'azione per `n` tick forzati (giù, n tick, su); ritorna il contatore dei tick. */
      premi: (azione, n = 1) => {
        input.sorgenteGiu(sorgente(azione));
        const esito = ciclo.tick(Math.max(1, n));
        input.sorgenteSu(sorgente(azione));
        return esito;
      },
      // --- squadra oggetti (storie P04/P09): `attivi`, `slot`, `patto`, `gratis`, `segreta`, `interfacciaOggetti()` ---
      ...debugOggetti,
      // --- squadra oggetti: fine ---
      imposta: (flag, valore) => (ganci.imposta ? ganci.imposta(flag, valore) : false),
      /** Salta alla stanza `id` del piano (notte.vaiA); false senza piano o con id sconosciuto. */
      vaiA: (stanza) => (ganci.vaiA ? ganci.vaiA(stanza) : false),
      /** Registra l'implementazione di `imposta` o `vaiA` quando il modulo relativo esiste. */
      estendi: (nome, fn) => {
        if (!(nome in ganci)) throw new RangeError(`__gioco.estendi: gancio sconosciuto '${nome}'`);
        ganci[nome] = fn;
      },
    });
  }

  ciclo.avvia();
  eventi.emit('gioco.avviato', { seme, debug });
  // storia 029: nell'hub Ferruccio compare sull'arrivo e partono le scene automatiche del modello (notte 1)
  if (hub && saltaMenu) {
    // storia P04: con `?personaggio=` (QA) il personaggio si applica subito; senza, Ferruccio con i valori del GDD
    const persUrl = url.searchParams.get(PARAM_PERSONAGGIO);
    if (persUrl && tabPersonaggi.personaggi[persUrl]) applicaScelta({ personaggio: persUrl, slot: slotScelto });
    else hub.entra();
    // storia 030, strumento di QA: `&continua=1` preme «Continua» da solo se c'è una notte salvata
    if (url.searchParams.get('continua') === '1' && notteSalvata.presente) interfacciaRipresa.continua();
  } else if (hub) {
    apriMenu();
  } else {
    const persUrl = url.searchParams.get(PARAM_PERSONAGGIO);
    if (persUrl && tabPersonaggi.personaggi[persUrl]) applicaScelta({ personaggio: persUrl, slot: slotScelto });
  }
  // storia 027, strumento di QA: `?debug=1&wire=1&scena=<id>` fa partire subito quella scena
  const scenaRichiesta = wire ? url.searchParams.get('scena') : null;
  if (scenaRichiesta) incontri.mostra(scenaRichiesta);
}

avvia().catch((errore) => {
  console.error('[avvio] il gioco non è partito:', errore);
});
