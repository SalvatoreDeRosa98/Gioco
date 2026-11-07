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
 *    prova gira la notte (`mondo/notte.js`): stanza corrente, porte, ondate di fantocci segnaposto
 *    (`archetipo`), transizioni della camera; `window.__gioco` espone `piano`, `stanza`, `vaiA`;
 *  - la superficie di debug `window.__gioco`, presente SOLO con `?debug=1` (ADR-0003).
 *
 * La risoluzione logica è un vincolo del motore (ADR-0001), non un valore di gioco.
 * Nessun numero di gioco e nessuna stringa di gioco qui: i parametri vengono dai JSON, i colori dai
 * token CSS, i testi (quando arriveranno) da contenuti/interfaccia.json.
 */

import { creaTempo } from './fondazione/tempo.js';
import { creaCiclo } from './fondazione/ciclo.js';
import { creaInput, collega as collegaInput } from './fondazione/input.js';
import { creaRng, derivato } from './fondazione/rng.js';
import { creaBus } from './fondazione/eventi.js';
import { creaParametri, leggiOverrideUrl } from './fondazione/parametri.js';
import { creaModificatori } from './oggetti/modificatori.js';
import { creaCampo } from './mondo/fisica.js';
import { creaFerruccio } from './attori/ferruccio.js';
import { creaCombattimento } from './attori/combattimento.js';
import { creaFantoccio } from './attori/bersaglio.js';
import { creaResaDebug } from './resa/debug.js';
import { caricaModelli, creaCatalogo, regoleDaParametri, validaParametriGenerazione } from './mondo/modelli.js';
import { generaPiano } from './mondo/generazione.js';
import { creaCamera } from './mondo/camera.js';
import { creaNotte } from './mondo/notte.js';

/** Risoluzione logica della scena (ADR-0001). */
const RISOLUZIONE = Object.freeze({ larghezza: 1280, altezza: 720 });

/** Cartella dei parametri e file da caricare (nomi di file, non valori di gioco). */
const CARTELLA_PARAMETRI = 'contenuti/parametri/';
const FILE_STATISTICHE = ['ferruccio', 'combattimento', 'stanza', 'stanze', 'generazione'];
const FILE_TABELLE = ['input', 'doni', 'sinergie'];
const FILE_MOTO_RIDOTTO = 'moto-ridotto';

/** Contenuti del piano 1 (nomi di cartelle e file, non valori di gioco). */
const CARTELLA_MODELLI = 'contenuti/modelli-stanza/piazza-dante/';
const FILE_INDICE_MODELLI = 'indice';
const FILE_RISERVA = 'contenuti/piani/piazza-dante-riserva.json';

/**
 * Scena diagnostica del modo `wire` (non è contenuto di gioco: posizioni in celle della griglia).
 * Ferruccio al centro; un fantoccio fermo a destra (`fermo`), uno che attacca a ciclo se l'URL ha
 * `fantoccio=attacca`, una colonna con un fantoccio dietro per la linea di colpo, un peso 3.
 */
const SCENA_WIRE = Object.freeze({
  ferruccio: { colonna: 6.5, riga: 3.5 },
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
 * Renderer segnaposto (da sostituire con resa/renderer.js, storia 005).
 * @param {HTMLCanvasElement} canvas
 * @param {{ debug: boolean, contaTick: () => number }} opzioni
 */
function creaSegnaposto(canvas, { debug, contaTick }) {
  const ctx = canvas.getContext('2d');
  return {
    disegna() {
      ctx.fillStyle = token('--colore-fondo');
      ctx.fillRect(0, 0, RISOLUZIONE.larghezza, RISOLUZIONE.altezza);
      if (debug) {
        ctx.fillStyle = token('--colore-testo');
        ctx.font = `24px ${token('--font-testo')}`;
        ctx.textBaseline = 'top';
        ctx.fillText(`tick ${contaTick()}`, 16, 16);
      }
    },
  };
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
  const conPiano = wire && Number.isInteger(pianoRichiesto) && pianoRichiesto >= 1 && pianoRichiesto <= 5;
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
    ostacoli: wire && !conPiano ? SCENA_WIRE.ostacoli : [],
  });
  const cella = (c, r) => ({ x: campo.x + c * campo.cella, y: campo.y + r * campo.cella });
  const partenza = cella(SCENA_WIRE.ferruccio.colonna, SCENA_WIRE.ferruccio.riga);
  const ferruccio = creaFerruccio({ modificatori, tempo, eventi, input, campo, x: partenza.x, y: partenza.y });
  /** @type {object[]} */
  const bersagli = [];
  /** @type {object[]} */
  const proiettili = [];
  const combattimento = creaCombattimento({ modificatori, tempo, eventi, input, campo, ferruccio, bersagli: () => bersagli });
  /** Factory dei nemici delle ondate: oggi fantocci segnaposto con `archetipo` (le storie 019-021 la sostituiscono). */
  const creaNemico = ({ archetipo, x, y, id }) => {
    const f = creaFantoccio({ modificatori, tempo, eventi, campo, bersaglio: combattimento.comeBersaglio, id, x, y });
    f.archetipo = archetipo;
    return f;
  };

  // Piano generato dal seme (storie 014-017): modelli, catalogo, pianta, camera e notte.
  let notte = null;
  let camera = null;
  if (conPiano) {
    const indice = await caricaJson(`${CARTELLA_MODELLI}${FILE_INDICE_MODELLI}.json`);
    const { modelli } = await caricaModelli({
      caricatore: (nome) => caricaJson(`${CARTELLA_MODELLI}${nome}.json`),
      indice,
      regole: regoleDaParametri(parametri),
    });
    const riserva = await caricaJson(FILE_RISERVA);
    const catalogo = creaCatalogo(modelli);
    const esito = generaPiano({ seme, piano: pianoRichiesto, parametri, catalogo, riserva });
    camera = creaCamera({ parametri, tempo, scena: RISOLUZIONE, eventi });
    notte = creaNotte({
      seme, numeroPiano: pianoRichiesto, pianta: esito.pianta, catalogo, parametri, tempo, eventi, campo, scena: RISOLUZIONE,
      ferruccio, combattimento, bersagli, proiettili, camera, creaNemico,
    });
    notte.entra(esito.pianta.stanze.find((st) => st.tipo === 'ingresso').id);
  }

  if (wire && !conPiano) {
    const attaccaAuto = url.searchParams.get('fantoccio') === 'attacca';
    for (const f of SCENA_WIRE.fantocci) {
      const p = cella(f.colonna, f.riga);
      bersagli.push(creaFantoccio({
        modificatori, tempo, eventi, campo, bersaglio: combattimento.comeBersaglio,
        id: f.id, x: p.x, y: p.y, peso: f.peso, r: f.r, vita: f.vita,
        automatico: f.automatico === 'fantoccio' && attaccaAuto,
      }));
    }
  }
  if (notte) {
    // la notte fa girare lei Ferruccio, combattimento, bersagli, proiettili e stanza (e ignora l'input in transizione)
    ciclo.registra(notte, { stati: ['notte'] });
  } else {
    ciclo.registra(ferruccio, { stati: ['notte'] });
    ciclo.registra(combattimento, { stati: ['notte'] });
    ciclo.registra({
      tick: (dt) => {
        for (const b of bersagli) b.tick(dt);
        for (const p of proiettili) p.tick(dt);
      },
    }, { stati: ['notte'] });
  }

  if (wire) {
    ciclo.registra(creaResaDebug({
      canvas, campo, ferruccio, combattimento, bersagli: () => bersagli, proiettili: () => proiettili,
      token, scena: RISOLUZIONE, contaTick: ciclo.contaTick, notte: () => notte, camera,
    }));
    ciclo.vaiA('hub');
    ciclo.vaiA('notte');
  } else {
    ciclo.registra(creaSegnaposto(canvas, { debug, contaTick: ciclo.contaTick }));
  }

  if (debug) {
    /** Superficie di debug (ADR-0003, storia 004). `imposta` e `vaiA` sono ganci per le storie
     *  dello stato narrativo e delle stanze: finché quei moduli non si registrano, rispondono false. */
    const ganci = { imposta: null, vaiA: notte ? (id) => notte.vaiA(id) : null };
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
      /** Storie 014-017: pianta del piano, stanza corrente, notte e camera (null senza `?piano=N`). */
      get piano() { return notte?.pianta ?? null; },
      get stanza() { return notte?.stanza ?? null; },
      notte,
      camera,
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
}

avvia().catch((errore) => {
  console.error('[avvio] il gioco non è partito:', errore);
});
