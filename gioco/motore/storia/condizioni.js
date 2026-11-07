/**
 * motore/storia/condizioni.js — Valutazione pura delle condizioni `quando` / `se` di storia.json
 * (ADR-0004, GDD stato-narrativo.md regole 4 e 10). Storia 026.
 *
 * Una condizione è un oggetto `{flag: atteso}` vero se TUTTE le coppie sono vere. Per i flag di
 * scelta (e per derivati e booleani, che valgono `vera`/`falsa`): `"*"` = deciso (qualunque valore),
 * `""` = non deciso, `"!x"` = diverso da x (anche non deciso), altrimenti uguaglianza. Per i flag
 * numerici (`notte`, `piano_max`): confronti con prefisso `">=2"`, `"<5"`, `">"`, `"<="`, `"="`,
 * oppure un numero = uguaglianza, `"*"` = sempre vero. Per gli insiemi (`boss_battuti`,
 * `scene_viste`): `"x"` = contiene x, `"!x"` = non contiene, `"*"` = non vuoto, `""` = vuoto.
 * `valutaOr(lista)`: basta che una condizione sia vera.
 *
 * Integrità (regola 10): un flag ignoto, un valore fuori dall'elenco (nella condizione o nello
 * stato), una condizione malformata sono ERRORI DI CONTENUTO: loggati e valutati FALSI, mai veri.
 *
 * Il modulo non conosce nomi di flag né di scene: lo schema (tipi e valori ammessi) arriva da
 * `creaSchema({storia, regole})`, costruito da storia.json e contenuti/narrativa.json.
 * Dipendenze: nessuna.
 */

/** Tipi di flag dello schema. */
export const TIPI = Object.freeze({ scelta: 'scelta', numero: 'numero', insieme: 'insieme' });

const CONFRONTO = /^(>=|<=|==|=|>|<)?\s*(-?\d+(?:\.\d+)?)$/;

/**
 * Costruisce lo schema dei flag (tipo e valori ammessi) da storia.json e dalle regole narrative.
 * I flag di scelta vengono da `storia.flag` (quelli elencati in `regole.derivati` sono derivati:
 * stesso tipo nelle condizioni, ma non decidibili); i campi di avanzamento da `regole.avanzamento`.
 * @param {{ storia: object, regole: object }} o
 * @returns {{ schema: Record<string, { tipo: string, valori?: string[], membri?: Set<string>, derivato?: boolean }>, decisioni: string[], derivati: string[], errori: string[] }}
 */
export function creaSchema({ storia, regole }) {
  const schema = {};
  const errori = [];
  const derivati = Object.keys(regole?.derivati ?? {});
  const decisioni = [];
  for (const [nome, def] of Object.entries(storia?.flag ?? {})) {
    if (!Array.isArray(def?.valori) || def.valori.length === 0) {
      errori.push(`storia.flag.${nome}: senza 'valori'`);
      continue;
    }
    const derivato = derivati.includes(nome);
    schema[nome] = { tipo: TIPI.scelta, valori: def.valori.slice(), derivato };
    if (!derivato) decisioni.push(nome);
  }
  for (const d of derivati) if (!schema[d]) errori.push(`narrativa.derivati.${d}: flag assente in storia.flag`);
  const bool = regole?.booleani ?? {};
  const paroleBool = [bool.vero, bool.falso].filter((p) => typeof p === 'string');
  if (paroleBool.length !== 2) errori.push('narrativa.booleani: servono le parole vero e falso');
  const sorgenti = {
    boss: () => (storia?.boss ?? []).map((b) => b.id),
    scene: () => (storia?.scene ?? []).map((s) => s.id),
    finale: () => storia?.flag?.[regole?.finale?.flag]?.valori ?? [],
    mondo: () => Object.values(regole?.mondo ?? {}),
  };
  for (const [nome, def] of Object.entries(regole?.avanzamento ?? {})) {
    if (schema[nome]) {
      errori.push(`narrativa.avanzamento.${nome}: nome già usato da un flag della storia`);
      continue;
    }
    if (def.tipo === 'numero') schema[nome] = { tipo: TIPI.numero };
    else if (def.tipo === 'insieme') {
      const membri = sorgenti[def.valori_da]?.();
      if (!membri) errori.push(`narrativa.avanzamento.${nome}: valori_da '${def.valori_da}' sconosciuto`);
      schema[nome] = { tipo: TIPI.insieme, membri: new Set(membri ?? []) };
    } else if (def.tipo === 'booleano') schema[nome] = { tipo: TIPI.scelta, valori: paroleBool.slice(), booleano: true };
    else if (def.tipo === 'scelta') {
      const valori = sorgenti[def.valori_da]?.();
      if (!valori || valori.length === 0) errori.push(`narrativa.avanzamento.${nome}: valori_da '${def.valori_da}' vuoto o sconosciuto`);
      schema[nome] = { tipo: TIPI.scelta, valori: (valori ?? []).slice() };
    } else errori.push(`narrativa.avanzamento.${nome}: tipo '${def.tipo}' sconosciuto`);
  }
  return { schema, decisioni, derivati, errori };
}

/** Logga un errore di contenuto, se c'è un logger. */
function segnala(log, messaggio) {
  log?.error?.(`[condizioni] errore di contenuto: ${messaggio}`);
}

function comeInsieme(v) {
  if (v instanceof Set) return v;
  if (Array.isArray(v)) return new Set(v);
  return null;
}

/**
 * Valuta una coppia flag/atteso. Restituisce `false` (dopo aver loggato) su ogni errore di contenuto.
 * @param {string} flag
 * @param {unknown} atteso
 * @param {object} stato
 * @param {object} schema
 * @param {{ error: Function } | null} log
 * @param {string} dove etichetta per i messaggi
 */
function valutaCoppia(flag, atteso, stato, schema, log, dove) {
  const def = schema[flag];
  if (!def) {
    segnala(log, `${dove}: flag ignoto '${flag}'`);
    return false;
  }
  const valore = stato?.[flag];
  if (def.tipo === TIPI.numero) {
    if (typeof atteso === 'number') return typeof valore === 'number' && valore === atteso;
    if (atteso === '*') return typeof valore === 'number';
    const m = typeof atteso === 'string' ? CONFRONTO.exec(atteso.trim()) : null;
    if (!m) {
      segnala(log, `${dove}: confronto numerico non valido '${atteso}' su '${flag}'`);
      return false;
    }
    if (typeof valore !== 'number') {
      segnala(log, `${dove}: '${flag}' non è un numero nello stato`);
      return false;
    }
    const n = Number(m[2]);
    switch (m[1] ?? '=') {
      case '>=': return valore >= n;
      case '<=': return valore <= n;
      case '>': return valore > n;
      case '<': return valore < n;
      default: return valore === n;
    }
  }
  if (typeof atteso !== 'string') {
    segnala(log, `${dove}: valore atteso non stringa per '${flag}'`);
    return false;
  }
  if (def.tipo === TIPI.insieme) {
    const insieme = comeInsieme(valore);
    if (!insieme) {
      segnala(log, `${dove}: '${flag}' non è un insieme nello stato`);
      return false;
    }
    if (atteso === '*') return insieme.size > 0;
    if (atteso === '') return insieme.size === 0;
    const negato = atteso.startsWith('!');
    const membro = negato ? atteso.slice(1) : atteso;
    if (def.membri && def.membri.size > 0 && !def.membri.has(membro)) {
      segnala(log, `${dove}: '${membro}' non è un membro ammesso di '${flag}'`);
      return false;
    }
    return negato ? !insieme.has(membro) : insieme.has(membro);
  }
  // scelta (decisioni, derivati, booleani)
  if (valore !== null && valore !== undefined && !def.valori.includes(valore)) {
    segnala(log, `${dove}: lo stato ha '${flag}' = '${valore}' fuori dall'elenco [${def.valori.join(', ')}]`);
    return false;
  }
  const deciso = valore !== null && valore !== undefined;
  if (atteso === '*') return deciso;
  if (atteso === '') return !deciso;
  if (atteso.startsWith('!')) {
    const x = atteso.slice(1);
    if (!def.valori.includes(x)) {
      segnala(log, `${dove}: valore '${x}' fuori dall'elenco di '${flag}' [${def.valori.join(', ')}]`);
      return false;
    }
    return valore !== x;
  }
  if (!def.valori.includes(atteso)) {
    segnala(log, `${dove}: valore '${atteso}' fuori dall'elenco di '${flag}' [${def.valori.join(', ')}]`);
    return false;
  }
  return valore === atteso;
}

/**
 * Vera se tutte le coppie della condizione sono vere. Oggetto vuoto o assente = sempre vera.
 * Qualunque errore di contenuto → falsa (e loggato).
 * @param {Record<string, unknown> | null | undefined} cond
 * @param {Record<string, unknown>} stato vista piatta dello stato (flag, derivati, avanzamento)
 * @param {Record<string, object>} schema da `creaSchema`
 * @param {{ log?: { error: Function } | null, dove?: string }} [o]
 * @returns {boolean}
 */
export function valuta(cond, stato, schema, { log = console, dove = 'condizione' } = {}) {
  if (cond === null || cond === undefined) return true;
  if (typeof cond !== 'object' || Array.isArray(cond)) {
    segnala(log, `${dove}: la condizione non è un oggetto`);
    return false;
  }
  if (!schema || typeof schema !== 'object') {
    segnala(log, `${dove}: schema assente`);
    return false;
  }
  let esito = true;
  for (const [flag, atteso] of Object.entries(cond)) {
    if (!valutaCoppia(flag, atteso, stato, schema, log, dove)) esito = false; // si valutano tutte per loggare ogni errore
  }
  return esito;
}

/**
 * Vera se almeno una condizione della lista è vera. Lista vuota o non lista → falsa (errore se non lista).
 * @param {Array<Record<string, unknown>>} lista
 * @param {Record<string, unknown>} stato
 * @param {Record<string, object>} schema
 * @param {{ log?: { error: Function } | null, dove?: string }} [o]
 * @returns {boolean}
 */
export function valutaOr(lista, stato, schema, { log = console, dove = 'condizione' } = {}) {
  if (!Array.isArray(lista)) {
    segnala(log, `${dove}: quando_or non è una lista`);
    return false;
  }
  let esito = false;
  lista.forEach((c, i) => {
    if (valuta(c, stato, schema, { log, dove: `${dove}[${i}]` })) esito = true;
  });
  return esito;
}
