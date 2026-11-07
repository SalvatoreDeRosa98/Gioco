/**
 * motore/avvio.js — Radice di composizione della pagina.
 *
 * Unico modulo che conosce il DOM e tutti i moduli di `fondazione/`: li crea, li collega e avvia
 * il ciclo. Storie 001-004. Qui vivono anche:
 *  - l'adattamento del canvas (1280×720 logici scalati al contenitore, device pixel ratio rispettato);
 *  - il renderer SEGNAPOSTO (fondo dal token CSS, numero di tick in debug) che la storia 005
 *    sostituisce con `resa/renderer.js`;
 *  - la superficie di debug `window.__gioco`, presente SOLO con `?debug=1` (ADR-0003).
 *
 * La risoluzione logica è un vincolo del motore (ADR-0001), non un valore di gioco.
 * Nessun numero di gioco e nessuna stringa di gioco qui: i parametri vengono dai JSON, i colori dai
 * token CSS, i testi (quando arriveranno) da contenuti/interfaccia.json.
 */

import { creaTempo } from './fondazione/tempo.js';
import { creaCiclo } from './fondazione/ciclo.js';
import { creaInput, collega as collegaInput } from './fondazione/input.js';
import { creaRng } from './fondazione/rng.js';
import { creaBus } from './fondazione/eventi.js';
import { creaParametri, leggiOverrideUrl } from './fondazione/parametri.js';

/** Risoluzione logica della scena (ADR-0001). */
const RISOLUZIONE = Object.freeze({ larghezza: 1280, altezza: 720 });

/** Cartella dei parametri e file da caricare (nomi di file, non valori di gioco). */
const CARTELLA_PARAMETRI = 'contenuti/parametri/';
const FILE_STATISTICHE = ['ferruccio', 'combattimento'];
const FILE_TABELLE = ['input'];
const FILE_MOTO_RIDOTTO = 'moto-ridotto';

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

  const parametri = creaParametri();
  await parametri.carica({
    caricatore: async (nome) => {
      const risposta = await fetch(`${CARTELLA_PARAMETRI}${nome}.json`, { cache: 'no-cache' });
      if (!risposta.ok) throw new Error(`parametri: impossibile caricare ${nome}.json (${risposta.status})`);
      return risposta.json();
    },
    statistiche: FILE_STATISTICHE,
    tabelle: FILE_TABELLE,
    sovrascritture: motoRidotto ? [FILE_MOTO_RIDOTTO] : [],
    override,
  });

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
  ciclo.registra(creaSegnaposto(canvas, { debug, contaTick: ciclo.contaTick }));

  if (debug) {
    /** Superficie di debug (ADR-0003, storia 004). `imposta` e `vaiA` sono ganci per le storie
     *  dello stato narrativo e delle stanze: finché quei moduli non si registrano, rispondono false. */
    const ganci = { imposta: null, vaiA: null };
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
      imposta: (flag, valore) => (ganci.imposta ? ganci.imposta(flag, valore) : false),
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
