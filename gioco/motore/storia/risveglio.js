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
 *
 * Storia P01 (PROVVISORIA, build di prova): la **fine del piano**. A `piano.completato` {piano} (l'uscita della
 * stanza boss, `mondo/stanza.js`) il modulo registra `piano_max = max(piano_max, piano + 1)` con
 * `narrativa.raggiungiPiano`, fa una sequenza di una sola fase (`velo`, durata `risveglio.fine_piano.t_velo`;
 * eventi `fine_piano.avvio` {durata_ms, piano, notte} e `fine_piano.fase`) e poi lo STESSO risveglio della
 * morte (notte + 1, doni/pool/economia azzerati, corpo in piedi) con `risveglio.fine` {…, motivo: 'vittoria'}:
 * la radice di composizione non distingue i due casi. `morti` non cresce. Il piano 2 non esiste: la build di
 * prova torna in piazza. `boss_battuti` non è toccato (storia 022).
 * Nessun numero e nessuna stringa di gioco: durate e numero di lanterne dai parametri; i nomi delle fasi
 * sono etichette di stato (come gli stati del corpo), non testo mostrato.
 * Dipendenze: solo moduli iniettati.
 */

/** Fasi della sequenza, nell'ordine (etichette di stato; le durate sono in `risveglio.fasi.<fase>`). */
export const FASI_MORTE = Object.freeze(['lanterne', 'fili', 'maschera', 'buio']);

/** Storia P01: fasi della sequenza di fine piano (una sola: il velo con la didascalia). */
export const FASI_FINE_PIANO = Object.freeze(['velo']);
export const FASI_DISCESA_PIANO = Object.freeze(['discesa']);
export const PIANO_FINALE = 4;

/** Motivi del risveglio (codici stabili nel payload di `risveglio.fine`). */
export const MOTIVI_RISVEGLIO = Object.freeze({ morte: 'morte', vittoria: 'vittoria', discesa: 'discesa' });

/** Stato della sequenza quando non è in corso. */
export const INATTIVO = 'inattivo';

/**
 * Crea il modulo del risveglio.
 * @param {{
 *   parametri: { get: (chiave: string) => any },
 *   tempo: { ticksDaMs: (ms: number) => number },
 *   eventi: { on: Function, emit: Function },
 *   narrativa: { nuovaNotte: () => number, avanzamento: () => object, raggiungiPiano?: (piano: number) => number },
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
    /** motivo della sequenza in corso (null da inattivo) e fasi/durate che la descrivono */
    motivo: null,
    /** @type {readonly string[]} */
    fasi: FASI_MORTE,
    /** storia P01: piano completato dalla sequenza di vittoria in corso (null altrimenti) */
    pianoCompletato: null,
  };

  /** Durate in ms delle fasi di un motivo (lette ora: i parametri possono cambiare in debug). */
  function durateMsDi(motivo) {
    if (motivo === MOTIVI_RISVEGLIO.discesa) return [Math.min(900, R('fine_piano.t_velo'))];
    if (motivo === MOTIVI_RISVEGLIO.vittoria) return FASI_FINE_PIANO.map((f) => R(`fine_piano.t_${f}`));
    return FASI_MORTE.map((f) => R(`fasi.${f}`));
  }

  /** Durate delle fasi della sequenza di morte in ms. */
  function durateMs() {
    return durateMsDi(MOTIVI_RISVEGLIO.morte);
  }

  /** Durata totale in ms della sequenza del motivo dato (morte se omesso) con i parametri correnti. */
  function durataMs(motivo = MOTIVI_RISVEGLIO.morte) {
    return durateMsDi(motivo).reduce((a, b) => a + b, 0);
  }

  /** Avvia la sequenza di morte (idempotente mentre una sequenza è in corso). */
  function avvia() {
    if (s.fase !== INATTIVO) return false;
    const ms = durateMs();
    if (ms.reduce((a, b) => a + b, 0) > R('t_max')) log?.error?.(`[risveglio] errore di contenuto: la sequenza dura ${ms.reduce((a, b) => a + b, 0)} ms, oltre t_max ${R('t_max')}`);
    s.morti += 1;
    avviaSequenza({ motivo: MOTIVI_RISVEGLIO.morte, fasi: FASI_MORTE, ms });
    eventi.emit('morte.avvio', { durata_ms: s.durataMsAvvio, fasi: FASI_MORTE.slice(), notte: narrativa.avanzamento()[campoNotte], motivo: s.motivo });
    entraFase(0);
    return true;
  }

  /**
   * Storia P01: il piano `piano` è completato (uscita della stanza boss). Registra `piano_max`, poi la
   * sequenza del velo e il risveglio con motivo `vittoria`. Falso se una sequenza è già in corso.
   * @param {number} piano
   */
  function completaPiano(piano) {
    if (s.fase !== INATTIVO) return false;
    if (!Number.isInteger(piano) || piano < 1) {
      log?.error?.(`[risveglio] piano.completato con un piano non valido: ${piano}`);
      return false;
    }
    narrativa.raggiungiPiano?.(piano + 1);
    s.pianoCompletato = piano;
    // Dopo aver sconfitto i Boss dei Piani 1-3 e anche dopo aver ucciso Donna Luciana al Piano 4,
    // la run continua all'infinito nei Cicli successivi (Piano 5, 6, 7, 8...)!
    const eDiscesa = true;
    const motivo = eDiscesa ? MOTIVI_RISVEGLIO.discesa : MOTIVI_RISVEGLIO.vittoria;
    const fasi = eDiscesa ? FASI_DISCESA_PIANO : FASI_FINE_PIANO;
    avviaSequenza({ motivo, fasi, ms: durateMsDi(motivo) });
    eventi.emit('fine_piano.avvio', { durata_ms: s.durataMsAvvio, fasi: fasi.slice(), piano, notte: narrativa.avanzamento()[campoNotte], motivo: s.motivo });
    entraFase(0);
    return true;
  }

  /** Fotografa motivo, fasi e durate (tick) di una sequenza che parte. */
  function avviaSequenza({ motivo, fasi, ms }) {
    s.motivo = motivo;
    s.fasi = fasi;
    s.durataMsAvvio = ms.reduce((a, b) => a + b, 0);
    s.durate = ms.map((m) => Math.max(0, tempo.ticksDaMs(m)));
    s.durataTicks = s.durate.reduce((a, b) => a + b, 0);
    s.ticksTotali = 0;
  }

  /** Entra nella fase `i` saltando quelle a durata zero; oltre l'ultima → risveglio. */
  function entraFase(i) {
    while (i < s.fasi.length && s.durate[i] === 0) i += 1;
    if (i >= s.fasi.length) {
      risveglia();
      return;
    }
    s.indice = i;
    s.fase = s.fasi[i];
    s.ticksFase = 0;
    const nome = (s.motivo === MOTIVI_RISVEGLIO.vittoria || s.motivo === MOTIVI_RISVEGLIO.discesa) ? 'fine_piano.fase' : 'morte.fase';
    eventi.emit(nome, { fase: s.fase, indice: i, durata_ms: durateMsDi(s.motivo)[i], motivo: s.motivo });
  }

  /** Il risveglio: per morte o vittoria finale azzera la run; per discesa passa al piano successivo conservando oggetti, monete e maschere. */
  function risveglia() {
    const motivo = s.motivo ?? MOTIVI_RISVEGLIO.morte;
    const piano = s.pianoCompletato;
    s.fase = INATTIVO;
    s.indice = -1;
    s.motivo = null;
    s.pianoCompletato = null;
    if (motivo === MOTIVI_RISVEGLIO.discesa && Number.isInteger(piano) && piano < PIANO_FINALE) {
      combattimento?.interrompi?.();
      eventi.emit('piano.discesa', { daPiano: piano, aPiano: piano + 1 });
      return;
    }
    const notte = narrativa.nuovaNotte();
    modificatori.azzera();
    pool?.azzera?.();
    economia?.nuovaNotte?.();
    combattimento?.interrompi?.();
    ferruccio.risveglia();
    eventi.emit('risveglio.fine', { notte, maschere: ferruccio.maschere, motivo, piano });
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

  /** Lanterne già spente: una a una nella prima fase, tutte dopo, nessuna da inattivo né nella vittoria. */
  function lanterneSpente() {
    const n = R('lanterne');
    if (s.fase === INATTIVO || s.motivo !== MOTIVI_RISVEGLIO.morte) return 0;
    if (s.indice > 0) return n;
    return Math.min(n, Math.floor(progressoFase() * n));
  }

  const disiscrizioni = [
    eventi.on('ferruccio.morto', () => avvia()),
    eventi.on('piano.completato', (p) => completaPiano(p?.piano)),
  ];

  return {
    get attivo() { return s.fase !== INATTIVO; },
    get fase() { return s.fase; },
    get indice() { return s.indice; },
    get morti() { return s.morti; },
    /** Storia P01: motivo della sequenza in corso (`morte` | `vittoria`, null da inattivo), piano completato e prossimo. */
    get motivo() { return s.motivo; },
    get pianoCompletato() { return s.pianoCompletato; },
    get pianoProssimo() { return s.pianoCompletato === null ? null : s.pianoCompletato + 1; },
    completaPiano,
    lanterne: () => R('lanterne'),
    durataMs,
    progresso,
    progressoFase,
    lanterneSpente,
    avvia,
    tick,
    /** Fotografia per il debug e i test. */
    stato: () => ({ fase: s.fase, indice: s.indice, progresso: progresso(), progressoFase: progressoFase(), lanterneSpente: lanterneSpente(), morti: s.morti, motivo: s.motivo, pianoCompletato: s.pianoCompletato }),
    /** Toglie gli ascoltatori (test). */
    distruggi: () => { for (const d of disiscrizioni) d(); disiscrizioni.length = 0; },
  };
}
