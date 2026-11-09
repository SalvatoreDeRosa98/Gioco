/**
 * motore/audio/sintesi.js — Sintetizzatore minimale con Web Audio API (storia P10). Nessun file audio.
 *
 * Ricette di suoni (oscillatori e rumore con inviluppi) i cui numeri vengono TUTTI da
 * `contenuti/parametri/audio.json` (`audio.suoni.<nome>.*`, `audio.master.volume`, `audio.rumore.*`); qui stanno
 * solo le forme d'onda e la struttura dei grafi di nodi, che non sono numeri. L'`AudioContext` è creato (e ripreso)
 * al primo gesto dell'utente, perché i browser lo richiedono: `collega({ finestra })` registra ascoltatori una tantum
 * su tastiera e puntatore, `sveglia()` lo fa a mano. Senza `AudioContext` (Node, browser senza Web Audio) il modulo
 * degrada in silenzio: nessun errore, `suona` ritorna `false`. La `fabbrica` del contesto è iniettabile per i test
 * (contesto finto che registra i nodi creati). Il rumore bianco e l'impulso del riverbero sono generati una volta con
 * il generatore seminato di `fondazione/rng.js` (mai il generatore casuale nativo, ADR-0003).
 *
 * Il sintetizzatore non conosce il gioco: non ascolta eventi (lo fa `eventi-audio.js`) e non legge lo stato.
 * Dipendenze: `fondazione/rng.js`, `fondazione/parametri.js` (solo lettura dei parametri).
 */

import { creaRng } from '../fondazione/rng.js';

/** Nomi dei suoni disponibili (chiavi di `audio.suoni` in audio.json). */
export const NOMI_SUONI = Object.freeze([
  'passo', 'passo_nemico', 'sibilo', 'tonfo', 'campana', 'colpo_a_segno', 'colpo_subito', 'moneta', 'porta_chiusa', 'attivo',
]);

/** Soglia (vincolo tecnico delle rampe esponenziali di Web Audio, che non arrivano a zero), non un valore di gioco. */
const SOGLIA_SILENZIO = 0.0001;
/** Eventi del DOM che contano come gesto dell'utente per sbloccare il contesto. */
const GESTI = Object.freeze(['keydown', 'pointerdown', 'mousedown', 'touchstart']);

/**
 * Fabbrica predefinita del contesto: `AudioContext` (o `webkitAudioContext`) dell'ambiente, `null` se non esiste.
 * @param {object} [globale]
 * @returns {(() => AudioContext) | null}
 */
export function fabbricaPredefinita(globale = globalThis) {
  const Costruttore = globale?.AudioContext ?? globale?.webkitAudioContext;
  return typeof Costruttore === 'function' ? () => new Costruttore() : null;
}

/**
 * Crea il sintetizzatore.
 * @param {{
 *   parametri: { get: (chiave: string) => number },
 *   fabbrica?: (() => object) | null,
 *   log?: { error: (...a: unknown[]) => void }
 * }} o `fabbrica` ritorna un AudioContext (vero o finto); `null` = nessun audio disponibile
 */
export function creaSintesi({ parametri, fabbrica = fabbricaPredefinita(), log = console }) {
  if (!parametri || typeof parametri.get !== 'function') throw new TypeError('creaSintesi: manca `parametri`');
  /** @type {any} */
  let ctx = null;
  /** @type {any} */
  let master = null;
  let muto = false;
  let fallito = false;
  let bufferRumore = null;
  let bufferRiverbero = null;
  /** @type {Record<string, number>} suoni effettivamente emessi, per nome */
  const emessi = Object.fromEntries(NOMI_SUONI.map((n) => [n, 0]));
  /** @type {Array<() => void>} rimozioni degli ascoltatori dei gesti */
  let scollegaGesti = [];

  const p = (chiave) => parametri.get(`audio.${chiave}`);
  const ms = (v) => v / 1000;

  /** Volume del master dato lo stato del muto. */
  function volumeMaster() {
    return muto ? 0 : p('master.volume');
  }

  /**
   * Crea il contesto (al primo gesto) e lo riprende se sospeso. Idempotente.
   * @returns {boolean} vero se un contesto esiste dopo la chiamata
   */
  function sveglia() {
    if (!fabbrica || fallito) return false;
    try {
      if (!ctx) {
        ctx = fabbrica();
        if (!ctx) { fallito = true; return false; }
        master = ctx.createGain();
        master.gain.value = volumeMaster();
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        const esito = ctx.resume();
        if (esito && typeof esito.catch === 'function') esito.catch(() => {});
      }
      return true;
    } catch (errore) {
      fallito = true;
      log.error('[audio] contesto non disponibile: audio spento', errore);
      return false;
    }
  }

  /**
   * Registra gli ascoltatori dei gesti dell'utente che sbloccano il contesto; si tolgono da soli appena il contesto gira.
   * @param {{ finestra?: object }} o
   */
  function collega({ finestra } = {}) {
    if (!finestra || typeof finestra.addEventListener !== 'function' || !fabbrica) return;
    const suGesto = () => {
      sveglia();
      if (ctx && ctx.state === 'running') scollega();
    };
    const scollega = () => {
      for (const via of scollegaGesti) via();
      scollegaGesti = [];
    };
    for (const nome of GESTI) {
      finestra.addEventListener(nome, suGesto, { capture: true, passive: true });
      scollegaGesti.push(() => finestra.removeEventListener(nome, suGesto, { capture: true }));
    }
  }

  /** Rumore bianco seminato, un buffer riusato da tutte le ricette. */
  function rumore() {
    if (bufferRumore) return bufferRumore;
    const n = Math.max(1, Math.round(ctx.sampleRate * ms(p('rumore.durata_buffer_ms'))));
    bufferRumore = ctx.createBuffer(1, n, ctx.sampleRate);
    const dati = bufferRumore.getChannelData(0);
    const rng = creaRng(p('rumore.seme'));
    for (let i = 0; i < n; i++) dati[i] = rng() * 2 - 1;
    return bufferRumore;
  }

  /** Impulso del riverbero sintetico: rumore con decadimento esponenziale lungo `tonfo.riverbero_ms`. */
  function riverbero() {
    if (bufferRiverbero) return bufferRiverbero;
    const n = Math.max(1, Math.round(ctx.sampleRate * ms(p('suoni.tonfo.riverbero_ms'))));
    bufferRiverbero = ctx.createBuffer(1, n, ctx.sampleRate);
    const dati = bufferRiverbero.getChannelData(0);
    const rng = creaRng(p('rumore.seme') + 1);
    const k = p('rumore.decadimento_riverbero');
    for (let i = 0; i < n; i++) dati[i] = (rng() * 2 - 1) * Math.exp(-k * (i / n));
    return bufferRiverbero;
  }

  /** Inviluppo attacco lineare → decadimento esponenziale fino a `SOGLIA_SILENZIO`. */
  function inviluppo(gain, t0, { attacco, durata, volume }) {
    gain.gain.setValueAtTime(SOGLIA_SILENZIO, t0);
    gain.gain.linearRampToValueAtTime(Math.max(SOGLIA_SILENZIO, volume), t0 + attacco);
    gain.gain.exponentialRampToValueAtTime(SOGLIA_SILENZIO, t0 + durata);
  }

  /** Oscillatore `forma` da `freq` a `freqFine` (rampa esponenziale), con inviluppo; acceso e spento. */
  function oscillatore(t0, { forma, freq, freqFine = freq, attacco, durata, volume }) {
    const osc = ctx.createOscillator();
    osc.type = forma;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqFine !== freq) osc.frequency.exponentialRampToValueAtTime(freqFine, t0 + durata);
    const gain = ctx.createGain();
    inviluppo(gain, t0, { attacco, durata, volume });
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + durata);
    return gain;
  }

  /** Sorgente di rumore attraverso un filtro `tipo` (`filtro` → `filtroFine`), con inviluppo; ritorna il gain d'uscita. */
  function sbuffo(t0, { tipo, filtro, filtroFine = filtro, q = null, attacco, durata, volume }) {
    const sorgente = ctx.createBufferSource();
    sorgente.buffer = rumore();
    const f = ctx.createBiquadFilter();
    f.type = tipo;
    f.frequency.setValueAtTime(filtro, t0);
    if (filtroFine !== filtro) f.frequency.exponentialRampToValueAtTime(filtroFine, t0 + durata);
    if (q !== null) f.Q.value = q;
    const gain = ctx.createGain();
    inviluppo(gain, t0, { attacco, durata, volume });
    sorgente.connect(f);
    f.connect(gain);
    gain.connect(master);
    sorgente.start(t0);
    sorgente.stop(t0 + durata);
    return gain;
  }

  /** Parametri comuni di un suono letti dal JSON. */
  function comuni(nome) {
    return { attacco: ms(p(`suoni.${nome}.attacco_ms`)), durata: ms(p(`suoni.${nome}.durata_ms`)), volume: p(`suoni.${nome}.volume`) };
  }

  /** «Toc» di legno: triangolo in caduta più uno sbuffo passa-basso. */
  function tocco(nome, t0) {
    const c = comuni(nome);
    oscillatore(t0, { forma: 'triangle', freq: p(`suoni.${nome}.freq_hz`), freqFine: p(`suoni.${nome}.freq_fine_hz`), ...c });
    sbuffo(t0, { tipo: 'lowpass', filtro: p(`suoni.${nome}.filtro_hz`), ...c, volume: p(`suoni.${nome}.rumore_volume`) });
  }

  /** Tono semplice (seno/quadra/dente di sega) con rampa di frequenza. */
  function tono(nome, forma, t0) {
    oscillatore(t0, { forma, freq: p(`suoni.${nome}.freq_hz`), freqFine: p(`suoni.${nome}.freq_fine_hz`), ...comuni(nome) });
  }

  /** Sibilo metallico: rumore passa-banda in salita. */
  function sibilo(nome, t0) {
    sbuffo(t0, { tipo: 'bandpass', filtro: p(`suoni.${nome}.filtro_hz`), filtroFine: p(`suoni.${nome}.filtro_fine_hz`), q: p(`suoni.${nome}.q`), ...comuni(nome) });
  }

  /** Tonfo profondo: rumore passa-basso in caduta, più la coda del convolver sintetico. */
  function tonfo(nome, t0) {
    const c = comuni(nome);
    const secco = sbuffo(t0, { tipo: 'lowpass', filtro: p(`suoni.${nome}.filtro_hz`), filtroFine: p(`suoni.${nome}.filtro_fine_hz`), ...c });
    const conv = ctx.createConvolver();
    conv.buffer = riverbero();
    const coda = ctx.createGain();
    coda.gain.value = p(`suoni.${nome}.riverbero_volume`);
    secco.connect(conv);
    conv.connect(coda);
    coda.connect(master);
  }

  /** Rintocco di campana: fondamentale più due parziali inarmonici, decadimento lungo. */
  function campana(nome, t0) {
    const c = comuni(nome);
    const f = p(`suoni.${nome}.freq_hz`);
    oscillatore(t0, { forma: 'sine', freq: f, ...c });
    const vp = { ...c, volume: c.volume * p(`suoni.${nome}.volume_parziali`) };
    oscillatore(t0, { forma: 'sine', freq: f * p(`suoni.${nome}.parziale_2`), ...vp });
    oscillatore(t0, { forma: 'sine', freq: f * p(`suoni.${nome}.parziale_3`), ...vp });
  }

  /** Ricette: nome del suono → costruzione del grafo di nodi al tempo `t0`. */
  const RICETTE = Object.freeze({
    passo: (t0) => tocco('passo', t0),
    passo_nemico: (t0) => tocco('passo_nemico', t0),
    sibilo: (t0) => sibilo('sibilo', t0),
    tonfo: (t0) => tonfo('tonfo', t0),
    campana: (t0) => campana('campana', t0),
    colpo_a_segno: (t0) => tono('colpo_a_segno', 'square', t0),
    colpo_subito: (t0) => tono('colpo_subito', 'sawtooth', t0),
    moneta: (t0) => tono('moneta', 'sine', t0),
    porta_chiusa: (t0) => tono('porta_chiusa', 'square', t0),
    attivo: (t0) => tono('attivo', 'sine', t0),
  });

  /**
   * Suona `nome` adesso. Niente nodi senza contesto, con contesto non in esecuzione (viene ripreso), o in muto.
   * @param {string} nome uno di `NOMI_SUONI`
   * @returns {boolean} vero se i nodi sono stati creati
   */
  function suona(nome) {
    const ricetta = RICETTE[nome];
    if (!ricetta) throw new RangeError(`sintesi.suona: suono sconosciuto '${nome}'`);
    if (!ctx || fallito) return false;
    if (ctx.state !== 'running') { sveglia(); return false; }
    if (muto) return false;
    try {
      ricetta(ctx.currentTime);
      emessi[nome] += 1;
      return true;
    } catch (errore) {
      log.error(`[audio] errore nel suono '${nome}'`, errore);
      return false;
    }
  }

  /**
   * Accende o spegne il muto (il master va a zero; nessun nodo nuovo finché è muto).
   * @param {boolean} valore
   */
  function impostaMuto(valore) {
    muto = Boolean(valore);
    if (master) master.gain.value = volumeMaster();
    return muto;
  }

  return {
    sveglia,
    collega,
    suona,
    impostaMuto,
    /** Inverte il muto e ritorna il nuovo stato. */
    alternaMuto: () => impostaMuto(!muto),
    get muto() { return muto; },
    /** Vero se c'è un contesto in esecuzione (si può suonare). */
    pronto: () => Boolean(ctx) && !fallito && ctx.state === 'running',
    /** Tempo del contesto in ms (0 senza contesto): orologio dell'anti-affollamento. */
    ora: () => (ctx ? ctx.currentTime * 1000 : 0),
    /** Conteggio dei suoni emessi per nome (debug e test). */
    emessi: () => ({ ...emessi }),
    /** Stato per debug e test: disponibilità, stato del contesto, muto, volume del master. */
    stato: () => ({
      disponibile: Boolean(fabbrica) && !fallito,
      contesto: ctx ? ctx.state : null,
      muto,
      volume: master ? master.gain.value : null,
    }),
  };
}
