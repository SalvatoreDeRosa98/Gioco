/**
 * motore/interfaccia/tocco.js — Controlli touch MINIMALI (storia P02, PROVVISORIA, build di prova).
 *
 * Uno strato DOM in `#interfaccia` (inserito per primo, così cartiglio e pannelli, che vengono dopo, restano
 * sopra e ricevono i loro tocchi): sulla metà sinistra del palco una levetta virtuale che compare dove si
 * poggia il dito; sulla metà destra quattro bottoni rotondi (attacco, parata, scatto, interagisci; etichette da
 * `contenuti/interfaccia.json › tocco`). Misure da `contenuti/parametri/input.json › tocco` (raggio della levetta,
 * zona morta, diametro dei bottoni). Pointer Events con `setPointerCapture` e `touch-action: none`.
 *
 * L'input NON è toccato: i tocchi alimentano `input.impostaSondaGamepad` con una sonda COMPOSITA che restituisce
 * il gamepad reale se `navigatore.getGamepads()` ne ha uno connesso, altrimenti un gamepad virtuale
 * `{ buttons: [{pressed}], axes: [x, y] }` costruito dai tocchi con gli indici della mappa `input.json › gamepad`
 * (`avanza`/`conferma` condividono l'indice di `attacco`: nei dialoghi il cartiglio avanza con il bottone
 * dell'attacco). Un bottone premuto e rilasciato tra due letture resta «premuto» per una lettura (latch), così un
 * tap rapido non si perde. Con `attivo` falso non crea nulla e la sonda resta quella di `collega`.
 * Il velo `.ruota` («Ruota il telefono») è nel DOM sempre: lo mostra solo il CSS in portrait su puntatore grosso.
 */

/** Azioni dei quattro bottoni, nell'ordine in cui sono disposti. */
export const AZIONI_BOTTONI = Object.freeze(['attacco', 'parata', 'scatto', 'interagisci']);

/** Selettore degli elementi interattivi del DOM che i controlli touch non devono intercettare. */
export const SELETTORE_INTERATTIVI = 'button, .cartiglio, [data-interattivo]';

/**
 * @param {{
 *   documento: Document, contenitore: HTMLElement,
 *   input: { impostaSondaGamepad: (fn: (() => unknown) | null) => void },
 *   mappa: { assi: { x: number, y: number }, bottoni: Record<string, number[]> },
 *   parametri: { get: (chiave: string) => unknown },
 *   testi: { tocco: Record<string, string> },
 *   attivo: boolean,
 *   navigatore?: { getGamepads?: () => ArrayLike<any> } | null
 * }} o
 */
export function creaTocco({ documento, contenitore, input, mappa, parametri, testi, attivo, navigatore = null }) {
  if (!documento || !contenitore || !input || !mappa?.bottoni || !mappa?.assi || !parametri || !testi?.tocco) {
    throw new TypeError('creaTocco: dipendenze mancanti');
  }
  const T = testi.tocco;
  const raggio = Number(parametri.get('input.tocco.raggio_levetta'));
  const zonaMorta = Number(parametri.get('input.tocco.zona_morta'));
  const diametro = Number(parametri.get('input.tocco.diametro_bottone'));
  /** Indice del gamepad per ogni azione dei bottoni (primo della mappa). */
  const indici = new Map(AZIONI_BOTTONI.filter((a) => Array.isArray(mappa.bottoni[a])).map((a) => [a, mappa.bottoni[a][0]]));
  const nBottoni = 1 + Math.max(-1, ...Object.values(mappa.bottoni).flat());

  const asse = { x: 0, y: 0 };
  /** @type {Set<string>} */
  const premuti = new Set();
  /** @type {Set<string>} */
  const latch = new Set();

  /** Il primo gamepad fisico connesso, o null. */
  function gamepadReale() {
    const lista = navigatore?.getGamepads?.();
    if (!lista) return null;
    for (let i = 0; i < lista.length; i++) {
      const g = lista[i];
      if (g && g.connected) return g;
    }
    return null;
  }

  /** Gamepad virtuale costruito dai tocchi (consuma il latch). */
  function virtuale() {
    const buttons = Array.from({ length: nBottoni }, () => ({ pressed: false }));
    for (const [azione, indice] of indici) {
      if (premuti.has(azione) || latch.has(azione)) buttons[indice] = { pressed: true };
    }
    latch.clear();
    const axes = [];
    axes[mappa.assi.x] = asse.x;
    axes[mappa.assi.y] = asse.y;
    for (let i = 0; i < axes.length; i++) if (axes[i] === undefined) axes[i] = 0;
    return { buttons, axes, virtuale: true };
  }

  /** Sonda composita: il gamepad reale vince, altrimenti il virtuale. */
  function sonda() {
    return gamepadReale() ?? virtuale();
  }

  /**
   * Porta lo spostamento del dito (px dal centro) in un asse normalizzato con zona morta:
   * sotto la zona morta zero, sopra rampa lineare fino a 1 al raggio.
   * @param {number} dx
   * @param {number} dy
   */
  function normalizza(dx, dy) {
    const m = Math.hypot(dx, dy) / raggio;
    if (m <= zonaMorta || m === 0) return { x: 0, y: 0 };
    const mag = Math.min(1, (m - zonaMorta) / (1 - zonaMorta));
    const ux = dx / Math.hypot(dx, dy);
    const uy = dy / Math.hypot(dx, dy);
    return { x: ux * mag, y: uy * mag };
  }

  if (!attivo) {
    return {
      attivo: false,
      levetta: () => ({ x: 0, y: 0 }),
      premuti: () => [],
      sonda,
      virtuale,
      normalizza,
      distruggi() {},
    };
  }

  // ----- DOM -----
  const radice = documento.createElement('div');
  radice.className = 'tocco';
  radice.style.setProperty('--tocco-raggio', `${raggio}px`);
  radice.style.setProperty('--tocco-diametro', `${diametro}px`);
  const levettaEl = documento.createElement('div');
  levettaEl.className = 'tocco-levetta';
  levettaEl.hidden = true;
  const pomello = documento.createElement('div');
  pomello.className = 'tocco-pomello';
  levettaEl.append(pomello);
  const bottoniEl = documento.createElement('div');
  bottoniEl.className = 'tocco-bottoni';
  /** @type {Map<string, any>} */
  const bottoni = new Map();
  for (const azione of AZIONI_BOTTONI) {
    const b = documento.createElement('div');
    b.className = `tocco-bottone tocco-${azione}`;
    b.setAttribute?.('role', 'button');
    b.dataset.azione = azione;
    b.textContent = T[azione] ?? azione;
    bottoniEl.append(b);
    bottoni.set(azione, b);
  }
  const ruota = documento.createElement('div');
  ruota.className = 'ruota';
  ruota.textContent = T.ruota ?? '';
  radice.append(levettaEl, bottoniEl);
  if (typeof contenitore.prepend === 'function') contenitore.prepend(radice);
  else contenitore.append(radice);
  contenitore.append(ruota);

  // ----- Pointer Events -----
  let ditoLevetta = null;
  const centro = { x: 0, y: 0 };
  /** @type {Map<number, string>} pointerId → azione del bottone tenuto */
  const ditaBottoni = new Map();

  const cattura = (el, e) => { try { el.setPointerCapture?.(e.pointerId); } catch { /* evento sintetico */ } };
  const eInterattivo = (t) => typeof t?.closest === 'function' && t.closest(SELETTORE_INTERATTIVI) !== null;

  /** Rettangolo del palco (lo strato copre tutto `#interfaccia`). */
  const rettangolo = () => radice.getBoundingClientRect();

  function suGiuLevetta(e) {
    if (ditoLevetta !== null) return;
    if (eInterattivo(e.target)) return;
    const r = rettangolo();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (x >= r.width / 2) return;
    ditoLevetta = e.pointerId;
    centro.x = x;
    centro.y = y;
    levettaEl.style.setProperty('--x', `${x}px`);
    levettaEl.style.setProperty('--y', `${y}px`);
    pomello.style.setProperty('--dx', '0px');
    pomello.style.setProperty('--dy', '0px');
    levettaEl.hidden = false;
    cattura(radice, e);
    e.preventDefault?.();
  }
  function suMuoviLevetta(e) {
    if (e.pointerId !== ditoLevetta) return;
    const r = rettangolo();
    const dx = e.clientX - r.left - centro.x;
    const dy = e.clientY - r.top - centro.y;
    const a = normalizza(dx, dy);
    asse.x = a.x;
    asse.y = a.y;
    const d = Math.hypot(dx, dy);
    const k = d > raggio ? raggio / d : 1;
    pomello.style.setProperty('--dx', `${dx * k}px`);
    pomello.style.setProperty('--dy', `${dy * k}px`);
    e.preventDefault?.();
  }
  function suSuLevetta(e) {
    if (e.pointerId !== ditoLevetta) return;
    ditoLevetta = null;
    asse.x = 0;
    asse.y = 0;
    levettaEl.hidden = true;
    e.preventDefault?.();
  }
  radice.addEventListener('pointerdown', suGiuLevetta);
  radice.addEventListener('pointermove', suMuoviLevetta);
  radice.addEventListener('pointerup', suSuLevetta);
  radice.addEventListener('pointercancel', suSuLevetta);
  // gli eventi mouse di compatibilità (e i click emulati) non devono arrivare alla finestra come attacco/parata
  const ferma = (e) => e.stopPropagation?.();
  for (const nome of ['mousedown', 'mouseup', 'click', 'contextmenu']) radice.addEventListener(nome, ferma);

  for (const [azione, b] of bottoni) {
    const giu = (e) => {
      e.stopPropagation?.();
      ditaBottoni.set(e.pointerId, azione);
      premuti.add(azione);
      latch.add(azione);
      b.dataset.premuto = '1';
      cattura(b, e);
      e.preventDefault?.();
    };
    const su = (e) => {
      if (ditaBottoni.get(e.pointerId) !== azione) return;
      ditaBottoni.delete(e.pointerId);
      premuti.delete(azione);
      delete b.dataset.premuto;
      e.preventDefault?.();
    };
    b.addEventListener('pointerdown', giu);
    b.addEventListener('pointerup', su);
    b.addEventListener('pointercancel', su);
  }

  input.impostaSondaGamepad(sonda);

  return {
    attivo: true,
    /** Asse della levetta virtuale, normalizzato con zona morta. */
    levetta: () => ({ x: asse.x, y: asse.y }),
    /** Azioni dei bottoni tenuti giù adesso. */
    premuti: () => Array.from(premuti),
    sonda,
    virtuale,
    normalizza,
    /** Stacca la sonda e rimuove il DOM. */
    distruggi() {
      input.impostaSondaGamepad(null);
      radice.remove?.();
      ruota.remove?.();
    },
  };
}
