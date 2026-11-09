/**
 * motore/fondazione/ciclo.js — Ciclo di gioco e macchina degli stati.
 *
 * Architettura §1.4 e ADR-0003: per ogni frame di `requestAnimationFrame` versa il tempo in
 * `tempo.avanza`, esegue i tick dovuti sui sistemi registrati (`tick(dt)` con dt in secondi, pari
 * a un passo fisso) e poi disegna una volta sola (`disegna(alpha)`). Gli stati del gioco
 * (menu | hub | notte | pausa) sono una macchina minima con tabella esplicita delle transizioni;
 * il cambio di stato è annunciato sul bus con l'evento `ciclo.stato` {da, a}. Storia 001.
 *
 * Hit-stop (storia P08, game feel): `congela(ms)` salta i prossimi tick di simulazione dovuti ai frame
 * (il mondo resta fermo) ma il disegno continua a ogni frame; una seconda richiesta mentre il
 * congelamento è in corso NON si somma (vince la durata più lunga), così un fendente che colpisce più
 * bersagli nello stesso tick produce un solo hit-stop. I tick forzati (`tick(n)`, strumento di debug)
 * ignorano il congelamento. `contaFrame()` conta i frame disegnati.
 *
 * Dipendenze: solo verso il basso (tempo.js, eventi.js iniettati). `requestAnimationFrame` e
 * `performance.now` sono iniettabili, così il ciclo si prova in Node senza DOM.
 */

/** Stati ammessi del gioco. */
export const STATI = Object.freeze(['menu', 'hub', 'notte', 'pausa']);

/** Tabella delle transizioni: da ogni stato, verso quali stati si può andare. */
export const TRANSIZIONI = Object.freeze({
  menu: Object.freeze(['hub']),
  hub: Object.freeze(['notte', 'menu']),
  notte: Object.freeze(['pausa', 'hub', 'menu']),
  pausa: Object.freeze(['notte', 'hub', 'menu']),
});

/**
 * @typedef {object} Sistema
 * @property {(dt: number) => void} [tick] avanzamento di un passo fisso; dt in secondi
 * @property {(alpha: number) => void} [disegna] rendering con la frazione di interpolazione
 */

/**
 * Crea il ciclo.
 * @param {{
 *   tempo: ReturnType<import('./tempo.js').creaTempo>,
 *   eventi?: { emit: (nome: string, payload?: unknown) => unknown },
 *   richiediFrame?: (fn: (ora: number) => void) => number,
 *   annullaFrame?: (id: number) => void,
 *   ora?: () => number,
 *   statoIniziale?: string
 * }} opzioni
 */
export function creaCiclo({
  tempo,
  eventi,
  richiediFrame = globalThis.requestAnimationFrame?.bind(globalThis),
  annullaFrame = globalThis.cancelAnimationFrame?.bind(globalThis),
  ora = () => globalThis.performance.now(),
  statoIniziale = STATI[0],
}) {
  if (!tempo) throw new TypeError('creaCiclo: manca `tempo`');
  if (!STATI.includes(statoIniziale)) throw new RangeError(`creaCiclo: stato iniziale sconosciuto '${statoIniziale}'`);

  /** @type {{ sistema: Sistema, stati: string[] | null }[]} */
  const sistemi = [];
  let statoCorrente = statoIniziale;
  let attivo = false;
  let idFrame = 0;
  let ultimoFrame = null;
  let contatoreTick = 0;
  let contatoreFrame = 0;
  let ticksCongelati = 0;

  /**
   * Registra un sistema. L'ordine di registrazione è l'ordine di esecuzione.
   * @param {Sistema} sistema
   * @param {{ stati?: string[] }} [opzioni] se dato, `tick` gira solo in quegli stati (disegna sempre)
   * @returns {() => void} funzione che rimuove il sistema
   */
  function registra(sistema, { stati = null } = {}) {
    if (!sistema || typeof sistema !== 'object') throw new TypeError('ciclo.registra: sistema non valido');
    if (stati) {
      for (const s of stati) {
        if (!STATI.includes(s)) throw new RangeError(`ciclo.registra: stato sconosciuto '${s}'`);
      }
    }
    const voce = { sistema, stati };
    sistemi.push(voce);
    return () => rimuovi(sistema);
  }

  /**
   * Rimuove un sistema registrato.
   * @param {Sistema} sistema
   */
  function rimuovi(sistema) {
    const i = sistemi.findIndex((v) => v.sistema === sistema);
    if (i >= 0) sistemi.splice(i, 1);
  }

  /** Esegue un singolo tick su tutti i sistemi abilitati nello stato corrente. */
  function unTick() {
    const dt = tempo.passoS;
    for (const { sistema, stati } of sistemi.slice()) {
      if (stati && !stati.includes(statoCorrente)) continue;
      sistema.tick?.(dt);
    }
    contatoreTick++;
  }

  /** Chiama `disegna(alpha)` su tutti i sistemi. */
  function disegnaTutti(alpha) {
    for (const { sistema } of sistemi.slice()) sistema.disegna?.(alpha);
    contatoreFrame++;
  }

  /**
   * Hit-stop: congela la simulazione per `ms` (convertiti in tick con `tempo.ticksDaMs`, almeno 1 per
   * durate positive) mantenendo il disegno. Non si accumula: resta la durata residua più lunga.
   * @param {number} ms
   * @returns {number} tick di congelamento residui
   */
  function congela(ms) {
    const n = tempo.ticksDaMs(ms);
    if (n > ticksCongelati) ticksCongelati = n;
    return ticksCongelati;
  }

  /** @returns {number} tick di simulazione ancora congelati (0 = la simulazione scorre). */
  function congelato() {
    return ticksCongelati;
  }

  /**
   * Elabora un frame: calcola il dt dall'ultimo frame, esegue i tick dovuti, disegna.
   * Pubblico per i test e per chi guida il ciclo a mano.
   * @param {number} oraMs timestamp in millisecondi
   * @returns {number} tick eseguiti in questo frame (quelli saltati dall'hit-stop non contano)
   */
  function frame(oraMs) {
    const dt = ultimoFrame === null ? 0 : oraMs - ultimoFrame;
    ultimoFrame = oraMs;
    const n = tempo.avanza(dt);
    let eseguiti = 0;
    for (let i = 0; i < n; i++) {
      if (ticksCongelati > 0) { ticksCongelati--; continue; } // hit-stop: il frame passa, il mondo no
      unTick();
      eseguiti++;
    }
    disegnaTutti(tempo.alpha());
    return eseguiti;
  }

  function frameAnimazione(oraMs) {
    if (!attivo) return;
    frame(oraMs);
    idFrame = richiediFrame(frameAnimazione);
  }

  /** Avvia il ciclo su requestAnimationFrame (idempotente). */
  function avvia() {
    if (attivo) return;
    if (typeof richiediFrame !== 'function') throw new TypeError('ciclo.avvia: manca richiediFrame');
    attivo = true;
    ultimoFrame = null;
    tempo.azzera();
    idFrame = richiediFrame(frameAnimazione);
  }

  /** Ferma il ciclo (idempotente). */
  function ferma() {
    if (!attivo) return;
    attivo = false;
    if (typeof annullaFrame === 'function') annullaFrame(idFrame);
  }

  /**
   * Forza `n` tick immediati fuori dal frame (strumento di debug e di test); poi disegna.
   * @param {number} [n=1]
   * @returns {number} contatore totale dei tick eseguiti dall'avvio
   */
  function tick(n = 1) {
    const quanti = Math.max(0, Math.floor(n));
    for (let i = 0; i < quanti; i++) unTick();
    if (quanti > 0) disegnaTutti(tempo.alpha());
    return contatoreTick;
  }

  /** Numero totale di tick eseguiti. */
  function contaTick() {
    return contatoreTick;
  }

  /** Numero totale di frame disegnati (avanza anche durante l'hit-stop). */
  function contaFrame() {
    return contatoreFrame;
  }

  /** Stato corrente della macchina. */
  function stato() {
    return statoCorrente;
  }

  /**
   * Verifica se la transizione verso `nuovo` è ammessa dallo stato corrente.
   * @param {string} nuovo
   * @returns {boolean}
   */
  function puoAndareA(nuovo) {
    return TRANSIZIONI[statoCorrente].includes(nuovo);
  }

  /**
   * Cambia stato seguendo la tabella `TRANSIZIONI`; una transizione non ammessa lancia RangeError.
   * Emette `ciclo.stato` {da, a} sul bus, se presente.
   * @param {string} nuovo
   * @returns {string} il nuovo stato
   */
  function vaiA(nuovo) {
    if (!STATI.includes(nuovo)) throw new RangeError(`ciclo.vaiA: stato sconosciuto '${nuovo}'`);
    if (!puoAndareA(nuovo)) throw new RangeError(`ciclo.vaiA: transizione non ammessa ${statoCorrente} -> ${nuovo}`);
    const da = statoCorrente;
    statoCorrente = nuovo;
    eventi?.emit('ciclo.stato', { da, a: nuovo });
    return nuovo;
  }

  return {
    registra,
    rimuovi,
    avvia,
    ferma,
    frame,
    tick,
    contaTick,
    contaFrame,
    congela,
    congelato,
    stato,
    puoAndareA,
    vaiA,
    /** @returns {boolean} true se il ciclo gira su requestAnimationFrame */
    attivo: () => attivo,
    /** @returns {number} ultimo timestamp di frame elaborato */
    ora,
  };
}
