/**
 * motore/storia/risveglio.js — Morte → risveglio: la sequenza di morte e il passaggio alla notte
 * successiva (storia 030; GDD stato-narrativo.md regola 8 e stato «Hub», ADR-0006, art bible §2
 * «Morte / risveglio»).
 *
 * Ascolta `ferruccio.morto` (verso l'alto, senza conoscere chi emette) e avvia la sequenza in quattro
 * fasi (`FASI_MORTE`: lanterne che si spengono una a una, fili d'oro che si spezzano, maschera che si
 * stacca in pezzi azzurri, buio) con le durate di `risveglio.fasi.*` (ms, somma dei massimi ≤ `t_max`
 * = 5 s del criterio). Alla fine del buio avviene il **risveglio**:
 *  - `narrativa.nuovaNotte()` → `notte + 1` (il profilo si salva da solo: flag, scene viste,
 *    `piano_max`, boss restano: una decisione presa non va perduta, regola 8);
 *  - `modificatori.azzera()` → i doni della notte spariscono (le scintille sono già nel profilo);
 *  - `pool.azzera()` e `economia.nuovaNotte()` → pool, monete, stanze ripulite e consumabili azzerati
 *    (le monete le ha già perse l'economia a `ferruccio.morto`);
 *  - `ferruccio.risveglia()` e `combattimento.interrompi()` → il corpo torna in piedi con tutte le maschere.
 * Il modulo non cambia lo stato del ciclo né entra nell'hub: emette `morte.avvio` {durata_ms, fasi},
 * `morte.fase` {fase, indice}, `risveglio.fine` {notte} e la radice di composizione fa il resto
 * (pausa logica durante la sequenza, poi `hub`). Il velo DOM (`interfaccia/morte.js`) legge
 * `fase`, `progresso`, `progressoFase` e `lanterneSpente()`.
 * Nessun numero e nessuna stringa di gioco: durate e numero di lanterne dai parametri; i nomi delle fasi
 * sono etichette di stato (come gli stati del corpo), non testo mostrato.
 * Dipendenze: solo moduli iniettati.
 */

/** Fasi della sequenza, nell'ordine (etichette di stato; le durate sono in `risveglio.fasi.<fase>`). */
export const FASI_MORTE = Object.freeze(['lanterne', 'fili', 'maschera', 'buio']);

/** Stato della sequenza quando non è in corso. */
export const INATTIVO = 'inattivo';

/**
 * Crea il modulo del risveglio.
 * @param {{
 *   parametri: { get: (chiave: string) => any },
 *   tempo: { ticksDaMs: (ms: number) => number },
 *   eventi: { on: Function, emit: Function },
 *   narrativa: { nuovaNotte: () => number, avanzamento: () => object },
 *   modificatori: { azzera: () => void },
 *   ferruccio: { risveglia: () => void, maschere: number },
 *   economia?: { nuovaNotte: () => void } | null,
 *   pool?: { azzera: () => void } | null,
 *   combattimento?: { interrompi: () => void } | null,
 *   campoNotte: string,                 campo dell'avanzamento che conta la notte (narrativa.json › piani)
 *   log?: { error: Function }
 * }} o
 */
export function creaRisveglio({
  parametri, tempo, eventi, narrativa, modificatori, ferruccio, economia = null, pool = null, combattimento = null, campoNotte, log = console,
}) {
  if (!parametri || !tempo || !eventi || !narrativa || !modificatori || !ferruccio) throw new TypeError('creaRisveglio: dipendenze mancanti');
  if (typeof campoNotte !== 'string') throw new TypeError('creaRisveglio: manca `campoNotte`');
  const R = (k) => parametri.get(`risveglio.${k}`);

  const s = {
    fase: INATTIVO,
    indice: -1,
    ticksFase: 0,
    ticksTotali: 0,
    durataTicks: 0,
    /** @type {number[]} ticks di ogni fase, fotografati all'avvio */
    durate: [],
    morti: 0,
  };

  /** Durate delle fasi in ms (lette ora: i parametri possono cambiare in debug). */
  function durateMs() {
    return FASI_MORTE.map((f) => R(`fasi.${f}`));
  }

  /** Durata totale della sequenza in ms con i parametri correnti. */
  function durataMs() {
    return durateMs().reduce((a, b) => a + b, 0);
  }

  /** Avvia la sequenza (idempotente mentre è in corso). */
  function avvia() {
    if (s.fase !== INATTIVO) return false;
    const ms = durateMs();
    if (ms.reduce((a, b) => a + b, 0) > R('t_max')) log?.error?.(`[risveglio] errore di contenuto: la sequenza dura ${ms.reduce((a, b) => a + b, 0)} ms, oltre t_max ${R('t_max')}`);
    s.durate = ms.map((m) => Math.max(0, tempo.ticksDaMs(m)));
    s.durataTicks = s.durate.reduce((a, b) => a + b, 0);
    s.ticksTotali = 0;
    s.morti += 1;
    eventi.emit('morte.avvio', { durata_ms: ms.reduce((a, b) => a + b, 0), fasi: FASI_MORTE.slice(), notte: narrativa.avanzamento()[campoNotte] });
    entraFase(0);
    return true;
  }

  /** Entra nella fase `i` saltando quelle a durata zero; oltre l'ultima → risveglio. */
  function entraFase(i) {
    while (i < FASI_MORTE.length && s.durate[i] === 0) i += 1;
    if (i >= FASI_MORTE.length) {
      risveglia();
      return;
    }
    s.indice = i;
    s.fase = FASI_MORTE[i];
    s.ticksFase = 0;
    eventi.emit('morte.fase', { fase: s.fase, indice: i, durata_ms: R(`fasi.${s.fase}`) });
  }

  /** Il risveglio: notte + 1, doni e pool azzerati, economia nuova, corpo in piedi. */
  function risveglia() {
    s.fase = INATTIVO;
    s.indice = -1;
    const notte = narrativa.nuovaNotte();
    modificatori.azzera();
    pool?.azzera?.();
    economia?.nuovaNotte?.();
    combattimento?.interrompi?.();
    ferruccio.risveglia();
    eventi.emit('risveglio.fine', { notte, maschere: ferruccio.maschere });
  }

  /**
   * Un passo fisso della sequenza (nulla se inattiva).
   * @param {number} dt secondi (ignorato: la sequenza conta i tick)
   */
  function tick(dt) { // eslint-disable-line no-unused-vars
    if (s.fase === INATTIVO) return;
    s.ticksFase += 1;
    s.ticksTotali += 1;
    if (s.ticksFase >= s.durate[s.indice]) entraFase(s.indice + 1);
  }

  /** Avanzamento 0→1 della fase corrente (0 se inattiva). */
  function progressoFase() {
    if (s.fase === INATTIVO || !(s.durate[s.indice] > 0)) return 0;
    return Math.min(1, s.ticksFase / s.durate[s.indice]);
  }

  /** Avanzamento 0→1 dell'intera sequenza (0 se inattiva). */
  function progresso() {
    if (s.fase === INATTIVO || !(s.durataTicks > 0)) return 0;
    return Math.min(1, s.ticksTotali / s.durataTicks);
  }

  /** Lanterne già spente: una a una nella prima fase, tutte dopo, nessuna da inattivo. */
  function lanterneSpente() {
    const n = R('lanterne');
    if (s.fase === INATTIVO) return 0;
    if (s.indice > 0) return n;
    return Math.min(n, Math.floor(progressoFase() * n));
  }

  const disiscrizioni = [eventi.on('ferruccio.morto', () => avvia())];

  return {
    get attivo() { return s.fase !== INATTIVO; },
    get fase() { return s.fase; },
    get indice() { return s.indice; },
    get morti() { return s.morti; },
    lanterne: () => R('lanterne'),
    durataMs,
    progresso,
    progressoFase,
    lanterneSpente,
    avvia,
    tick,
    /** Fotografia per il debug e i test. */
    stato: () => ({ fase: s.fase, indice: s.indice, progresso: progresso(), progressoFase: progressoFase(), lanterneSpente: lanterneSpente(), morti: s.morti }),
    /** Toglie gli ascoltatori (test). */
    distruggi: () => { for (const d of disiscrizioni) d(); disiscrizioni.length = 0; },
  };
}
