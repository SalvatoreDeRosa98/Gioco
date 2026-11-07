/**
 * motore/fondazione/parametri.js — Parametri di gioco da JSON, in sola lettura.
 *
 * Implementa ADR-0002 e architettura §1.1: ogni numero di gioco vive in
 * `contenuti/parametri/*.json` come statistica `{base, min, max}`; il motore legge `get('file.chiave')`
 * e ottiene il `base`. I file "tabella" (es. input.json) sono letti così come sono. La validazione
 * segnala in console gli errori di contenuto (voce non `{base,min,max}`, `min > max`, `base` fuori
 * range → riportato nel range). Gli override arrivano da file di sovrascrittura (es.
 * `moto-ridotto.json`) o dall'URL `?p.file.chiave=valore`, quest'ultimo SOLO con `?debug=1`.
 * Storia 003 (e criterio 4 della storia 001 per prefers-reduced-motion).
 *
 * Le funzioni pure (`validaStatistiche`, `leggiOverrideUrl`, `applicaOverride`) non toccano il DOM
 * e sono testabili in Node; `carica` riceve il caricatore (fetch) dall'esterno.
 * Dipendenze: nessuna.
 */

/** Prefisso dei parametri nella query string: `?p.combattimento.portata=90`. */
export const PREFISSO_URL = 'p.';

/**
 * Vero se il valore è una voce statistica `{base, min, max}`.
 * @param {unknown} v
 * @returns {v is { base: number, min: number, max: number }}
 */
export function eStatistica(v) {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v) && 'base' in v;
}

/** Vero se la chiave è metadato (descrizioni, fonti) e non un parametro. */
function eMetadato(chiave) {
  return chiave.startsWith('_');
}

/**
 * Valida un file di statistiche. Ogni foglia (chiave non `_`) deve essere `{base, min, max}` numerici
 * con `min ≤ base ≤ max`; i gruppi (oggetti senza `base`) si attraversano. Un `base` fuori range è
 * riportato nel range e segnalato.
 * @param {string} nome nome del file (radice dei percorsi)
 * @param {unknown} albero contenuto del JSON
 * @returns {{ errori: string[], albero: object }} errori leggibili e albero (eventualmente corretto)
 */
export function validaStatistiche(nome, albero) {
  const errori = [];
  if (!albero || typeof albero !== 'object' || Array.isArray(albero)) {
    return { errori: [`${nome}: il file non è un oggetto JSON`], albero: {} };
  }
  const visita = (nodo, percorso) => {
    for (const [chiave, valore] of Object.entries(nodo)) {
      if (eMetadato(chiave)) continue;
      const qui = `${percorso}.${chiave}`;
      if (eStatistica(valore)) {
        const { base, min, max } = valore;
        if (![base, min, max].every((n) => typeof n === 'number' && Number.isFinite(n))) {
          errori.push(`${qui}: base, min e max devono essere numeri finiti`);
          continue;
        }
        if (min > max) {
          errori.push(`${qui}: min (${min}) > max (${max})`);
          continue;
        }
        if (base < min || base > max) {
          errori.push(`${qui}: base ${base} fuori dall'intervallo [${min}, ${max}]: riportato nel range`);
          valore.base = Math.min(max, Math.max(min, base));
        }
      } else if (valore && typeof valore === 'object' && !Array.isArray(valore)) {
        visita(valore, qui);
      } else {
        errori.push(`${qui}: non è una statistica {base, min, max}`);
      }
    }
  };
  visita(albero, nome);
  return { errori, albero };
}

/**
 * Converte una stringa della query in numero, booleano o stringa.
 * @param {string} s
 */
function interpreta(s) {
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s.trim() !== '' && Number.isFinite(Number(s))) return Number(s);
  return s;
}

/**
 * Legge gli override dalla query string. Restituisce sempre `debug`; gli override sono pieni solo
 * se `debug=1` è presente (ADR-0002: override solo in debug).
 * @param {string} search `location.search` (con o senza `?`)
 * @returns {{ debug: boolean, override: Record<string, number|boolean|string> }}
 */
export function leggiOverrideUrl(search) {
  const parametri = new URLSearchParams(search ?? '');
  const debug = parametri.get('debug') === '1';
  const override = {};
  if (!debug) return { debug, override };
  for (const [chiave, valore] of parametri) {
    if (chiave.startsWith(PREFISSO_URL) && chiave.length > PREFISSO_URL.length) {
      override[chiave.slice(PREFISSO_URL.length)] = interpreta(valore);
    }
  }
  return { debug, override };
}

/**
 * Risolve un percorso puntato dentro la radice.
 * @param {object} radice
 * @param {string} chiave
 * @returns {{ genitore: object, nome: string, valore: unknown } | null}
 */
function risolvi(radice, chiave) {
  const parti = String(chiave).split('.');
  let nodo = radice;
  for (let i = 0; i < parti.length - 1; i++) {
    if (!nodo || typeof nodo !== 'object' || eMetadato(parti[i])) return null;
    nodo = nodo[parti[i]];
  }
  const nome = parti[parti.length - 1];
  if (!nodo || typeof nodo !== 'object' || eMetadato(nome) || !(nome in nodo)) return null;
  return { genitore: nodo, nome, valore: nodo[nome] };
}

/**
 * Applica una mappa di override `{ 'file.chiave': valore }` alla radice. Una statistica riceve il
 * nuovo `base` (riportato in `[min, max]` se fuori, con errore); un valore scalare di tabella viene
 * sostituito; chiavi sconosciute o gruppi sono errori. Muta la radice.
 * @param {object} radice
 * @param {Record<string, unknown>} override
 * @param {string} [origine] etichetta per i messaggi (es. 'url', 'moto-ridotto')
 * @returns {string[]} errori
 */
export function applicaOverride(radice, override, origine = 'override') {
  const errori = [];
  for (const [chiave, valore] of Object.entries(override ?? {})) {
    if (eMetadato(chiave)) continue;
    const r = risolvi(radice, chiave);
    if (!r) {
      errori.push(`${origine}: parametro sconosciuto '${chiave}'`);
      continue;
    }
    if (eStatistica(r.valore)) {
      const n = typeof valore === 'number' ? valore : Number(valore);
      if (!Number.isFinite(n)) {
        errori.push(`${origine}: '${chiave}' richiede un numero, ricevuto '${valore}'`);
        continue;
      }
      const { min, max } = r.valore;
      if (n < min || n > max) {
        errori.push(`${origine}: '${chiave}' = ${n} fuori dall'intervallo [${min}, ${max}]: riportato nel range`);
      }
      r.valore.base = Math.min(max, Math.max(min, n));
    } else if (r.valore !== null && typeof r.valore === 'object') {
      errori.push(`${origine}: '${chiave}' è un gruppo, non un parametro`);
    } else {
      r.genitore[r.nome] = valore;
    }
  }
  return errori;
}

/**
 * Copia profonda e congelata di un valore JSON (per restituire tabelle senza esporre l'interno).
 * @param {unknown} v
 */
function congela(v) {
  if (v === null || typeof v !== 'object') return v;
  const copia = Array.isArray(v) ? v.map(congela) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, congela(x)]));
  return Object.freeze(copia);
}

/**
 * Crea il contenitore dei parametri.
 * @param {{ log?: { error: (...a: unknown[]) => void } }} [opzioni]
 */
export function creaParametri({ log = console } = {}) {
  /** @type {Record<string, object>} */
  let radice = {};
  /** @type {string[]} */
  let erroriContenuto = [];
  let caricato = false;

  /**
   * Carica i file. `caricatore(nome)` deve restituire (una Promise di) il JSON del file `nome`.
   * @param {{
   *   caricatore: (nome: string) => Promise<unknown> | unknown,
   *   statistiche?: string[],
   *   tabelle?: string[],
   *   sovrascritture?: string[],
   *   override?: Record<string, unknown>
   * }} opzioni
   * @returns {Promise<string[]>} errori di contenuto (già loggati)
   */
  async function carica({ caricatore, statistiche = [], tabelle = [], sovrascritture = [], override = {} }) {
    if (typeof caricatore !== 'function') throw new TypeError('parametri.carica: manca `caricatore`');
    const nuova = {};
    const errori = [];
    for (const nome of statistiche) {
      const esito = validaStatistiche(nome, await caricatore(nome));
      errori.push(...esito.errori);
      nuova[nome] = esito.albero;
    }
    for (const nome of tabelle) {
      const contenuto = await caricatore(nome);
      if (!contenuto || typeof contenuto !== 'object') {
        errori.push(`${nome}: il file non è un oggetto JSON`);
        nuova[nome] = {};
      } else {
        nuova[nome] = contenuto;
      }
    }
    for (const nome of sovrascritture) {
      const mappa = await caricatore(nome);
      if (!mappa || typeof mappa !== 'object') {
        errori.push(`${nome}: il file di sovrascrittura non è un oggetto JSON`);
        continue;
      }
      errori.push(...applicaOverride(nuova, mappa, nome));
    }
    errori.push(...applicaOverride(nuova, override, 'url'));
    radice = nuova;
    erroriContenuto = errori;
    caricato = true;
    for (const e of errori) log.error(`[parametri] errore di contenuto: ${e}`);
    return errori.slice();
  }

  /**
   * Vero se la chiave esiste.
   * @param {string} chiave es. 'ferruccio.v_base'
   */
  function ha(chiave) {
    return risolvi(radice, chiave) !== null;
  }

  /**
   * Valore di un parametro: il `base` per una statistica, il valore (congelato) per una tabella.
   * @param {string} chiave es. 'ferruccio.v_base', 'input.tastiera.attacco'
   * @returns {number|boolean|string|object}
   */
  function get(chiave) {
    const r = risolvi(radice, chiave);
    if (!r) throw new RangeError(`parametri.get: parametro sconosciuto '${chiave}'${caricato ? '' : ' (parametri non ancora caricati)'}`);
    return eStatistica(r.valore) ? r.valore.base : congela(r.valore);
  }

  /**
   * Voce completa `{base, min, max}` di una statistica (copia congelata).
   * @param {string} chiave
   */
  function statistica(chiave) {
    const r = risolvi(radice, chiave);
    if (!r || !eStatistica(r.valore)) throw new RangeError(`parametri.statistica: '${chiave}' non è una statistica`);
    return congela(r.valore);
  }

  /**
   * Override puntuale a caldo (solo strumenti di debug). Stessa validazione di `carica`.
   * @param {string} chiave
   * @param {unknown} valore
   * @returns {string[]} errori
   */
  function imposta(chiave, valore) {
    const errori = applicaOverride(radice, { [chiave]: valore }, 'debug');
    for (const e of errori) log.error(`[parametri] ${e}`);
    return errori;
  }

  /** Errori di contenuto dell'ultimo caricamento. */
  function errori() {
    return erroriContenuto.slice();
  }

  /** Istantanea congelata di tutti i parametri (per la superficie di debug). */
  function tutti() {
    return congela(radice);
  }

  return { carica, ha, get, statistica, imposta, errori, tutti, caricato: () => caricato };
}
