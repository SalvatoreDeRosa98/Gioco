/**
 * motore/resa/sprite.js — Fogli di sprite veri (PNG dell'autore in `assets/sprite/`, manifesto `contenuti/sprite.json`).
 *
 * Storia P14 («sprite veri ovunque»). Il manifesto elenca per ogni voce il file, la dimensione del singolo fotogramma,
 * l'ancora (`piedi-centro`, `centro`, `angolo`) e il `layout` (colonne e righe del foglio, mappa posa → riga, con `da` =
 * colonna iniziale quando più pose stanno sulla stessa riga). Questo modulo:
 *  - carica le immagini con cache per nome (`Image` con `src` risolto da `percorso`, così nel pacchetto a file unico arriva il
 *    data: URI di `fondazione/risorse.js`) e ne tiene lo stato (`caricamento`, `caricato`, `errore`);
 *  - ritaglia un fotogramma (`fotogramma(nome, posa, indice)` → `{img, sx, sy, sw, sh, pronta}`), con posa di ripiego (la
 *    prima del layout) e indice bloccato nell'intervallo dei fotogrammi disponibili sul foglio;
 *  - disegna un fotogramma (`disegna`) con `imageSmoothingEnabled = false`, ancorato ai piedi o al centro come dice il
 *    manifesto (o come chiede chi disegna), ribaltato con `verso < 0`, con `alpha`, `scala` e `rotazione`;
 *  - calcola l'indice dell'animazione a cadenza fissa (`indice`) dai tick del ciclo e dalle cadenze di `resa.json › sprite`
 *    (tick per fotogramma: fermo lento, muove, attacco, morte che si ferma sull'ultimo, oggetti che brillano, scena);
 *  - ripete un tile come pattern (`disegnaPattern`) per pavimento e muro.
 *
 * Regole: la resa legge e non muta; nessun numero di gioco qui (le cadenze vengono dai parametri); se un PNG manca o non è
 * ancora arrivato le funzioni di disegno tornano `false` e chi chiama ripiega sullo sprite provvisorio. Il tempo è il
 * contatore dei tick passato da chi disegna, mai l'orologio reale.
 */

/** Stati di caricamento di un foglio. */
export const STATI_FOGLIO = Object.freeze({ caricamento: 'caricamento', caricato: 'caricato', errore: 'errore' });

/** Ancore ammesse dal manifesto. */
export const ANCORE = Object.freeze(['piedi-centro', 'centro', 'angolo']);

/** Tipi di cadenza letti da `resa.json › sprite.ticks_<tipo>`. */
export const TIPI_CADENZA = Object.freeze(['fermo', 'muove', 'attacco', 'morte', 'oggetto', 'scena']);

/**
 * Trova la posa nel layout della voce: quella chiesta, altrimenti la prima (ripiego), altrimenti una posa sintetica di un
 * fotogramma sulla riga 0.
 * @param {object|null} voce voce del manifesto
 * @param {string} posa nome della posa
 * @returns {{ posa: string, riga: number, da: number, fotogrammi: number, ripiego: boolean }}
 */
export function trovaPosa(voce, posa) {
  const pose = voce?.layout?.pose ?? [];
  const esatta = pose.find((p) => p.posa === posa);
  const scelta = esatta ?? pose[0] ?? null;
  if (!scelta) return { posa, riga: 0, da: 0, fotogrammi: 1, ripiego: true };
  return { posa: scelta.posa, riga: scelta.riga ?? 0, da: scelta.da ?? 0, fotogrammi: Math.max(1, scelta.fotogrammi ?? 1), ripiego: !esatta };
}

/**
 * Quanti fotogrammi della posa stanno davvero sul foglio: il minimo fra quelli dichiarati e le colonne restanti del layout
 * (il manifesto dichiara ad esempio `brillio×4` su un foglio a 1 colonna: si disegna sempre lo stesso fotogramma).
 * @param {object|null} voce
 * @param {{ da: number, fotogrammi: number }} p
 * @returns {number} almeno 1
 */
export function fotogrammiDisponibili(voce, p) {
  const colonne = voce?.layout?.colonne;
  if (!Number.isFinite(colonne) || colonne <= 0) return p.fotogrammi;
  return Math.max(1, Math.min(p.fotogrammi, colonne - p.da));
}

/**
 * Indice del fotogramma di un'animazione a cadenza fissa.
 * @param {number} tick contatore dei tick del ciclo
 * @param {number} cadenza tick per fotogramma (≥ 1)
 * @param {number} n fotogrammi della posa (≥ 1)
 * @param {{ ferma?: boolean, da?: number }} [o] `ferma`: si ferma sull'ultimo fotogramma invece di ciclare (morte, esplosione);
 *   `da`: tick d'inizio dell'animazione (per contare da un evento, es. il tick della morte)
 * @returns {number} 0 … n−1
 */
export function indiceAnimazione(tick, cadenza, n, { ferma = false, da = 0 } = {}) {
  const c = Math.max(1, Math.floor(cadenza) || 1);
  const q = Math.floor(Math.max(0, tick - da) / c);
  if (n <= 1) return 0;
  return ferma ? Math.min(n - 1, q) : q % n;
}

/**
 * Crea il gestore degli sprite.
 * @param {{
 *   manifesto: { voci: object[] },
 *   percorso?: (file: string) => string,
 *   parametri?: { get: (chiave: string) => number } | null,
 *   creaImmagine?: (() => { src: string, complete?: boolean, naturalWidth?: number, onload?: Function, onerror?: Function }) | null,
 * }} o `percorso` risolve il file del manifesto (pacchetto: data: URI); `creaImmagine` costruisce l'elemento immagine (nei test un
 *   finto; nel DOM `() => new Image()`); senza (`null`) niente viene caricato e ogni disegno ripiega.
 */
export function creaSprite({ manifesto, percorso = (f) => f, parametri = null, creaImmagine = null }) {
  const voci = new Map();
  for (const v of manifesto?.voci ?? []) if (v && typeof v.nome === 'string') voci.set(v.nome, v);
  /** @type {Map<string, { img: object|null, stato: string }>} */
  const cache = new Map();
  /** Pattern già costruiti per contesto (chiave nome): si rifanno se cambia il contesto. */
  const pattern = new Map();

  /** Voce del manifesto per nome, o null. */
  function voce(nome) { return voci.get(nome) ?? null; }

  /** Avvia (una volta) il caricamento del foglio e ritorna il suo record `{img, stato}`; null se la voce non esiste. */
  function carica(nome) {
    if (cache.has(nome)) return cache.get(nome);
    const v = voce(nome);
    if (!v || !v.file || typeof creaImmagine !== 'function') {
      const rec = { img: null, stato: STATI_FOGLIO.errore };
      if (v) cache.set(nome, rec);
      return v ? rec : null;
    }
    const img = creaImmagine();
    const rec = { img, stato: STATI_FOGLIO.caricamento };
    cache.set(nome, rec);
    if (img) {
      img.onload = () => { rec.stato = STATI_FOGLIO.caricato; };
      img.onerror = () => { rec.stato = STATI_FOGLIO.errore; rec.img = null; };
      if ('decoding' in img) img.decoding = 'async';
      img.src = percorso(v.file);
      // immagine già in cache del browser (o finto sincrono): `complete` con una larghezza vera
      if (img.complete && (img.naturalWidth ?? 0) > 0) rec.stato = STATI_FOGLIO.caricato;
    } else {
      rec.stato = STATI_FOGLIO.errore;
    }
    return rec;
  }

  /** Vero se il foglio è caricato e disegnabile. */
  function pronto(nome) {
    const rec = carica(nome);
    if (!rec || !rec.img) return false;
    if (rec.stato === STATI_FOGLIO.caricato) return true;
    if (rec.stato === STATI_FOGLIO.caricamento && rec.img.complete && (rec.img.naturalWidth ?? 0) > 0) { rec.stato = STATI_FOGLIO.caricato; return true; }
    return false;
  }

  /**
   * Fotogramma di una posa: rettangolo sorgente nel foglio.
   * @param {string} nome voce del manifesto
   * @param {string} posa nome della posa (ripiego: la prima del layout)
   * @param {number} indice indice del fotogramma (bloccato in 0 … disponibili−1)
   * @returns {{ img: object|null, sx: number, sy: number, sw: number, sh: number, pronta: boolean, posa: string, indice: number, ancora: string }|null}
   *   null se la voce non è nel manifesto
   */
  function fotogramma(nome, posa, indice = 0) {
    const v = voce(nome);
    if (!v) return null;
    const p = trovaPosa(v, posa);
    const n = fotogrammiDisponibili(v, p);
    const i = Math.min(n - 1, Math.max(0, Math.floor(Number.isFinite(indice) ? indice : 0)));
    const sw = v.larghezza;
    const sh = v.altezza;
    const pronta = pronto(nome);
    const rec = cache.get(nome);
    return { img: pronta ? rec.img : null, sx: (p.da + i) * sw, sy: p.riga * sh, sw, sh, pronta, posa: p.posa, indice: i, ancora: v.ancora ?? ANCORE[0] };
  }

  /** Cadenza in tick per fotogramma per un tipo di animazione (`resa.sprite.ticks_<tipo>`); senza parametri 1. */
  function cadenza(tipo) {
    if (!parametri) return 1;
    const t = TIPI_CADENZA.includes(tipo) ? tipo : TIPI_CADENZA[0];
    const v = parametri.get(`resa.sprite.ticks_${t}`);
    return Number.isFinite(v) && v >= 1 ? v : 1;
  }

  /**
   * Indice del fotogramma di `posa` al `tick` dato, con la cadenza del `tipo`.
   * @param {string} nome
   * @param {string} posa
   * @param {number} tick
   * @param {string} tipo uno di TIPI_CADENZA
   * @param {{ ferma?: boolean, da?: number }} [o]
   * @returns {number}
   */
  function indice(nome, posa, tick, tipo, o = {}) {
    const v = voce(nome);
    if (!v) return 0;
    const p = trovaPosa(v, posa);
    return indiceAnimazione(tick, cadenza(tipo), fotogrammiDisponibili(v, p), o);
  }

  /** Fotogrammi davvero disponibili di `posa` (≥ 1; 1 se la voce non esiste). */
  function conta(nome, posa) {
    const v = voce(nome);
    return v ? fotogrammiDisponibili(v, trovaPosa(v, posa)) : 1;
  }

  /** Spostamento dell'angolo in alto a sinistra rispetto al punto d'ancoraggio. */
  function scostamento(ancora, sw, sh) {
    if (ancora === 'centro') return { dx: -sw / 2, dy: -sh / 2 };
    if (ancora === 'angolo') return { dx: 0, dy: 0 };
    return { dx: -sw / 2, dy: -sh }; // piedi-centro
  }

  /**
   * Disegna un fotogramma. Torna false (senza toccare il contesto) se il foglio non è pronto: chi chiama ripiega.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} nome
   * @param {string} posa
   * @param {number} indice
   * @param {number} x punto d'ancoraggio
   * @param {number} y punto d'ancoraggio
   * @param {{ verso?: number, alpha?: number, ancora?: string|null, scala?: number, rotazione?: number }} [o]
   *   `verso` < 0 ribalta orizzontalmente; `ancora` sostituisce quella del manifesto; `rotazione` in radianti attorno all'ancora
   * @returns {boolean}
   */
  function disegna(ctx, nome, posa, indice, x, y, { verso = 1, alpha = 1, ancora = null, scala = 1, rotazione = 0 } = {}) {
    const f = fotogramma(nome, posa, indice);
    if (!f || !f.pronta || !ctx) return false;
    const { dx, dy } = scostamento(ancora ?? f.ancora, f.sw, f.sh);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (alpha !== 1) ctx.globalAlpha = Math.max(0, Math.min(1, alpha)) * (ctx.globalAlpha ?? 1);
    ctx.translate(x, y);
    if (rotazione) ctx.rotate(rotazione);
    if (scala !== 1) ctx.scale(scala, scala);
    if (verso < 0) ctx.scale(-1, 1);
    ctx.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, dx, dy, f.sw, f.sh);
    ctx.restore();
    return true;
  }

  /**
   * Riempie il rettangolo con il tile ripetuto (primo fotogramma della voce). False se il foglio non è pronto.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} nome
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {{ alpha?: number }} [o]
   * @returns {boolean}
   */
  function disegnaPattern(ctx, nome, x, y, w, h, { alpha = 1 } = {}) {
    if (!ctx || !pronto(nome) || typeof ctx.createPattern !== 'function') return false;
    const v = voce(nome);
    let p = pattern.get(nome);
    if (!p || p.ctx !== ctx) {
      // il tile è il primo fotogramma: se il foglio ha più colonne si ritaglia su un canvas intermedio
      let sorgente = cache.get(nome).img;
      const colonne = v.layout?.colonne ?? 1;
      const righe = v.layout?.righe ?? 1;
      if ((colonne > 1 || righe > 1) && typeof document !== 'undefined') {
        const c = document.createElement('canvas');
        c.width = v.larghezza; c.height = v.altezza;
        const cx = c.getContext('2d');
        cx.imageSmoothingEnabled = false;
        cx.drawImage(sorgente, 0, 0, v.larghezza, v.altezza, 0, 0, v.larghezza, v.altezza);
        sorgente = c;
      }
      const creato = ctx.createPattern(sorgente, 'repeat');
      if (!creato) return false;
      p = { ctx, pattern: creato };
      pattern.set(nome, p);
    }
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    ctx.translate(x, y); // il tile parte dall'angolo del rettangolo
    ctx.fillStyle = p.pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return true;
  }

  /** Avvia il caricamento di più fogli (o di tutto il manifesto senza argomento). */
  function precarica(nomi = null) {
    for (const n of nomi ?? voci.keys()) carica(n);
  }

  /** Stato di QA: voci del manifesto, fogli caricati/in caricamento/in errore e l'elenco degli errori. */
  function stato() {
    let caricati = 0, caricamento = 0, errori = 0;
    const inErrore = [];
    for (const [nome, rec] of cache) {
      pronto(nome);
      if (rec.stato === STATI_FOGLIO.caricato) caricati++;
      else if (rec.stato === STATI_FOGLIO.errore) { errori++; inErrore.push(nome); }
      else caricamento++;
    }
    return { voci: voci.size, richiesti: cache.size, caricati, caricamento, errori, inErrore };
  }

  return Object.freeze({ voce, carica, pronto, fotogramma, conta, indice, cadenza, disegna, disegnaPattern, precarica, stato, nomi: () => [...voci.keys()] });
}
