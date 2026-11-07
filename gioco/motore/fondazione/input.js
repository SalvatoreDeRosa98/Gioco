/**
 * motore/fondazione/input.js — Input unificato: tastiera, mouse, gamepad.
 *
 * Storia 002 e GDD controllo-ferruccio.md regola 2. Le azioni del contratto (sinistra, destra,
 * su, giu, attacco, parata, scatto, interagisci, avanza, conferma, indietro, menu) sono legate ai
 * tasti dalla mappa `contenuti/parametri/input.json`, mai dal codice.
 *
 * Due parti: `creaInput(mappa)` è lo stato puro (testabile in Node): riceve sorgenti "giù/su"
 * e, a ogni `inizioTick()`, fotografa i fronti così che `premuto(azione)` sia vero una sola volta
 * per pressione, `tenuto` finché il tasto è giù e `rilasciato` nel tick del rilascio.
 * `collega(input, ambiente)` aggancia il DOM (tastiera, mouse in coordinate di scena, gamepad
 * con zona morta) e azzera tutto al blur: nessun tasto incastrato.
 *
 * Dipendenze: nessuna.
 */

/**
 * @typedef {object} MappaInput
 * @property {Record<string, string[]>} tastiera azione → KeyboardEvent.code[]
 * @property {Record<string, number[]>} [mouse] azione → MouseEvent.button[]
 * @property {{ zona_morta: number, assi: { x: number, y: number }, bottoni: Record<string, number[]> }} [gamepad]
 */

/** Azioni di direzione lette da `direzione()`. */
const DIREZIONI = Object.freeze({ sinistra: [-1, 0], destra: [1, 0], su: [0, -1], giu: [0, 1] });

/**
 * Inverte una mappa azione → codici in codice → azioni.
 * @param {Record<string, (string|number)[]> | undefined} mappa
 * @param {string} prefisso
 * @returns {Map<string, string[]>}
 */
function inverti(mappa, prefisso) {
  const esito = new Map();
  for (const [azione, codici] of Object.entries(mappa ?? {})) {
    if (azione.startsWith('_')) continue;
    for (const codice of codici) {
      const chiave = `${prefisso}:${codice}`;
      if (!esito.has(chiave)) esito.set(chiave, []);
      esito.get(chiave).push(azione);
    }
  }
  return esito;
}

/**
 * Crea lo stato dell'input (parte pura).
 * @param {MappaInput} mappa contenuto di input.json
 * @returns {{
 *   azioni: () => string[],
 *   sorgenteGiu: (chiave: string) => void,
 *   sorgenteSu: (chiave: string) => void,
 *   tastoGiu: (codice: string) => boolean,
 *   tastoSu: (codice: string) => boolean,
 *   bottoneMouseGiu: (bottone: number) => boolean,
 *   bottoneMouseSu: (bottone: number) => boolean,
 *   muoviMouse: (x: number, y: number, dentro?: boolean) => void,
 *   aggiornaGamepad: (gamepad: { buttons: { pressed: boolean }[], axes: number[] } | null) => void,
 *   impostaSondaGamepad: (fn: (() => unknown) | null) => void,
 *   inizioTick: () => void,
 *   azzera: () => void,
 *   premuto: (azione: string) => boolean,
 *   tenuto: (azione: string) => boolean,
 *   rilasciato: (azione: string) => boolean,
 *   direzione: () => { x: number, y: number },
 *   mouse: () => { x: number, y: number, dentro: boolean },
 *   levetta: () => { x: number, y: number }
 * }}
 */
export function creaInput(mappa) {
  if (!mappa || typeof mappa !== 'object' || !mappa.tastiera) {
    throw new TypeError('creaInput: mappa dei tasti mancante o senza `tastiera`');
  }
  const perTasto = inverti(mappa.tastiera, 't');
  const perMouse = inverti(mappa.mouse, 'm');
  const perGamepad = inverti(mappa.gamepad?.bottoni, 'g');
  const zonaMorta = mappa.gamepad?.zona_morta ?? 0;
  const assi = mappa.gamepad?.assi ?? { x: 0, y: 1 };

  const tutteLeAzioni = new Set([
    ...Object.keys(mappa.tastiera),
    ...Object.keys(mappa.mouse ?? {}),
    ...Object.keys(mappa.gamepad?.bottoni ?? {}),
  ].filter((a) => !a.startsWith('_')));

  /** @type {Map<string, Set<string>>} azione → sorgenti attualmente giù */
  const sorgenti = new Map();
  /** @type {Set<string>} sorgenti giù (per ignorare le ripetizioni) */
  const sorgentiGiu = new Set();
  let inAttesaPremuti = new Set();
  let inAttesaRilasciati = new Set();
  let premutiTick = new Set();
  let rilasciatiTick = new Set();
  const posMouse = { x: 0, y: 0, dentro: false };
  const posLevetta = { x: 0, y: 0 };
  /** @type {(() => unknown) | null} */
  let sondaGamepad = null;

  function insiemeDi(azione) {
    let s = sorgenti.get(azione);
    if (!s) {
      s = new Set();
      sorgenti.set(azione, s);
    }
    return s;
  }

  /**
   * Segnala che una sorgente (es. 't:KeyA', 'm:0', 'g:5') è andata giù.
   * @param {string} chiave
   * @param {string[]} azioni azioni legate alla sorgente
   */
  function giu(chiave, azioni) {
    if (sorgentiGiu.has(chiave)) return;
    sorgentiGiu.add(chiave);
    for (const azione of azioni) {
      const s = insiemeDi(azione);
      const eraVuoto = s.size === 0;
      s.add(chiave);
      if (eraVuoto) inAttesaPremuti.add(azione);
    }
  }

  function su(chiave, azioni) {
    if (!sorgentiGiu.has(chiave)) return;
    sorgentiGiu.delete(chiave);
    for (const azione of azioni) {
      const s = insiemeDi(azione);
      s.delete(chiave);
      if (s.size === 0) inAttesaRilasciati.add(azione);
    }
  }

  /**
   * Sorgente generica giù, dato il nome completo con prefisso ('t:', 'm:', 'g:').
   * @param {string} chiave
   */
  function sorgenteGiu(chiave) {
    giu(chiave, azioniDi(chiave));
  }

  /** @param {string} chiave */
  function sorgenteSu(chiave) {
    su(chiave, azioniDi(chiave));
  }

  function azioniDi(chiave) {
    return perTasto.get(chiave) ?? perMouse.get(chiave) ?? perGamepad.get(chiave) ?? [];
  }

  /**
   * Tasto della tastiera giù.
   * @param {string} codice KeyboardEvent.code
   * @returns {boolean} true se il codice è mappato a qualche azione
   */
  function tastoGiu(codice) {
    const azioni = perTasto.get(`t:${codice}`);
    if (!azioni) return false;
    giu(`t:${codice}`, azioni);
    return true;
  }

  /**
   * Tasto della tastiera su.
   * @param {string} codice
   * @returns {boolean} true se il codice è mappato
   */
  function tastoSu(codice) {
    const azioni = perTasto.get(`t:${codice}`);
    if (!azioni) return false;
    su(`t:${codice}`, azioni);
    return true;
  }

  /** @param {number} bottone MouseEvent.button */
  function bottoneMouseGiu(bottone) {
    const azioni = perMouse.get(`m:${bottone}`);
    if (!azioni) return false;
    giu(`m:${bottone}`, azioni);
    return true;
  }

  /** @param {number} bottone */
  function bottoneMouseSu(bottone) {
    const azioni = perMouse.get(`m:${bottone}`);
    if (!azioni) return false;
    su(`m:${bottone}`, azioni);
    return true;
  }

  /**
   * Aggiorna la posizione del mouse in coordinate di scena (1280×720 logici).
   * @param {number} x
   * @param {number} y
   * @param {boolean} [dentro=true] se il puntatore è sopra il canvas
   */
  function muoviMouse(x, y, dentro = true) {
    posMouse.x = x;
    posMouse.y = y;
    posMouse.dentro = dentro;
  }

  /**
   * Legge un gamepad (o `null` se scollegato): bottoni come sorgenti 'g:<indice>', levetta
   * sinistra con zona morta.
   * @param {{ buttons: { pressed: boolean }[], axes: number[] } | null} gamepad
   */
  function aggiornaGamepad(gamepad) {
    for (const [chiave, azioni] of perGamepad) {
      const indice = Number(chiave.slice(2));
      const premutoOra = Boolean(gamepad?.buttons?.[indice]?.pressed);
      if (premutoOra) giu(chiave, azioni);
      else su(chiave, azioni);
    }
    const x = gamepad?.axes?.[assi.x] ?? 0;
    const y = gamepad?.axes?.[assi.y] ?? 0;
    if (Math.hypot(x, y) > zonaMorta) {
      posLevetta.x = x;
      posLevetta.y = y;
    } else {
      posLevetta.x = 0;
      posLevetta.y = 0;
    }
  }

  /**
   * Imposta la funzione che `inizioTick` chiama per leggere il gamepad corrente.
   * @param {(() => unknown) | null} fn
   */
  function impostaSondaGamepad(fn) {
    sondaGamepad = fn;
  }

  /**
   * Da chiamare all'inizio di ogni tick: legge il gamepad e fotografa i fronti accumulati dal
   * tick precedente. Dopo questa chiamata `premuto`/`rilasciato` sono stabili per tutto il tick.
   */
  function inizioTick() {
    if (sondaGamepad) aggiornaGamepad(/** @type {never} */ (sondaGamepad()));
    premutiTick = inAttesaPremuti;
    rilasciatiTick = inAttesaRilasciati;
    inAttesaPremuti = new Set();
    inAttesaRilasciati = new Set();
  }

  /**
   * Rilascia ogni sorgente (blur, pagina nascosta): le azioni ancora giù risultano `rilasciate`
   * nel tick successivo, così nessun tasto resta incastrato e nessun sistema resta in carica.
   */
  function azzera() {
    for (const [azione, s] of sorgenti) {
      if (s.size > 0) {
        s.clear();
        inAttesaRilasciati.add(azione);
      }
    }
    sorgentiGiu.clear();
    inAttesaPremuti.clear();
    posLevetta.x = 0;
    posLevetta.y = 0;
  }

  /**
   * Vero nel tick in cui l'azione è passata da su a giù (una sola volta per pressione).
   * @param {string} azione
   */
  function premuto(azione) {
    return premutiTick.has(azione);
  }

  /**
   * Vero finché almeno una sorgente dell'azione è giù.
   * @param {string} azione
   */
  function tenuto(azione) {
    return (sorgenti.get(azione)?.size ?? 0) > 0;
  }

  /**
   * Vero nel tick in cui l'ultima sorgente dell'azione è stata rilasciata.
   * @param {string} azione
   */
  function rilasciato(azione) {
    return rilasciatiTick.has(azione);
  }

  /**
   * Vettore di direzione normalizzato (lunghezza 1 o 0). Tastiera e croce del gamepad hanno la
   * precedenza; altrimenti la levetta sinistra oltre la zona morta.
   * @returns {{ x: number, y: number }}
   */
  function direzione() {
    let x = 0;
    let y = 0;
    for (const [azione, [dx, dy]] of Object.entries(DIREZIONI)) {
      if (tenuto(azione)) {
        x += dx;
        y += dy;
      }
    }
    if (x === 0 && y === 0) {
      x = posLevetta.x;
      y = posLevetta.y;
    }
    const lunghezza = Math.hypot(x, y);
    if (lunghezza === 0) return { x: 0, y: 0 };
    return { x: x / lunghezza, y: y / lunghezza };
  }

  /** Posizione del mouse in coordinate di scena. */
  function mouse() {
    return { x: posMouse.x, y: posMouse.y, dentro: posMouse.dentro };
  }

  /** Levetta sinistra grezza dopo la zona morta (0,0 dentro la zona morta). */
  function levetta() {
    return { x: posLevetta.x, y: posLevetta.y };
  }

  return {
    azioni: () => Array.from(tutteLeAzioni),
    sorgenteGiu,
    sorgenteSu,
    tastoGiu,
    tastoSu,
    bottoneMouseGiu,
    bottoneMouseSu,
    muoviMouse,
    aggiornaGamepad,
    impostaSondaGamepad,
    inizioTick,
    azzera,
    premuto,
    tenuto,
    rilasciato,
    direzione,
    mouse,
    levetta,
  };
}

/** Elementi del DOM in cui i tasti vanno lasciati alla pagina (campi di testo dell'interfaccia). */
const ELEMENTI_TESTO = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Collega lo stato dell'input al browser.
 * @param {ReturnType<typeof creaInput>} input
 * @param {{
 *   finestra: Window,
 *   documento: Document,
 *   canvas: HTMLCanvasElement,
 *   navigatore?: Navigator,
 *   larghezza: number,
 *   altezza: number
 * }} ambiente `larghezza`/`altezza` sono la risoluzione logica della scena
 * @returns {() => void} funzione che scollega tutti gli ascoltatori
 */
export function collega(input, { finestra, documento, canvas, navigatore, larghezza, altezza }) {
  const suTastoGiu = (e) => {
    if (ELEMENTI_TESTO.has(e.target?.tagName)) return;
    // le ripetizioni automatiche (e.repeat) arrivano qui ma `giu` ignora le sorgenti già giù
    if (input.tastoGiu(e.code)) e.preventDefault();
  };
  const suTastoSu = (e) => {
    if (input.tastoSu(e.code)) e.preventDefault();
  };
  const inScena = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * larghezza;
    const y = ((e.clientY - r.top) / r.height) * altezza;
    const dentro = x >= 0 && y >= 0 && x <= larghezza && y <= altezza;
    return { x, y, dentro };
  };
  const suMuoviMouse = (e) => {
    const p = inScena(e);
    input.muoviMouse(p.x, p.y, p.dentro);
  };
  const suMouseGiu = (e) => {
    const p = inScena(e);
    input.muoviMouse(p.x, p.y, p.dentro);
    if (input.bottoneMouseGiu(e.button)) e.preventDefault();
  };
  const suMouseSu = (e) => {
    if (input.bottoneMouseSu(e.button)) e.preventDefault();
  };
  const suContextMenu = (e) => e.preventDefault();
  const suBlur = () => input.azzera();
  const suVisibilita = () => {
    if (documento.visibilityState === 'hidden') input.azzera();
  };

  finestra.addEventListener('keydown', suTastoGiu);
  finestra.addEventListener('keyup', suTastoSu);
  finestra.addEventListener('mousemove', suMuoviMouse);
  finestra.addEventListener('mousedown', suMouseGiu);
  finestra.addEventListener('mouseup', suMouseSu);
  canvas.addEventListener('contextmenu', suContextMenu);
  finestra.addEventListener('blur', suBlur);
  documento.addEventListener('visibilitychange', suVisibilita);

  if (navigatore?.getGamepads) {
    input.impostaSondaGamepad(() => {
      const lista = navigatore.getGamepads();
      for (const g of lista) if (g && g.connected) return g;
      return null;
    });
  }

  return () => {
    finestra.removeEventListener('keydown', suTastoGiu);
    finestra.removeEventListener('keyup', suTastoSu);
    finestra.removeEventListener('mousemove', suMuoviMouse);
    finestra.removeEventListener('mousedown', suMouseGiu);
    finestra.removeEventListener('mouseup', suMouseSu);
    canvas.removeEventListener('contextmenu', suContextMenu);
    finestra.removeEventListener('blur', suBlur);
    documento.removeEventListener('visibilitychange', suVisibilita);
    input.impostaSondaGamepad(null);
    input.azzera();
  };
}
