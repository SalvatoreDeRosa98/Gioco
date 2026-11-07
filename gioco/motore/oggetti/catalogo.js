/**
 * motore/oggetti/catalogo.js — Validazione del catalogo dei doni e delle sinergie (ADR-0002, GDD
 * doni-modificatori.md regole 2-6). Storia 023. Funzioni pure, testabili in Node.
 *
 * Il validatore applica quello che il GDD chiama «il validatore dei dati»: ogni dono tocca solo
 * statistiche del registro (o parametri esistenti), con operazioni ammesse e moltiplicatori dentro
 * l'intervallo per dono; ogni gancio cita un evento e un effetto esistenti con i parametri
 * obbligatori; ogni tag è nel vocabolario; un dono d'oro non ha `scelta`; le forme d'oro non si
 * ripetono e non sono quelle vietate. Un dono con errori è ESCLUSO dall'indice (non raccoglibile) e
 * segnalato; il resto del catalogo resta valido. Le sinergie hanno esattamente due tag diversi.
 * Dipendenze: nessuna (riceve `parametri` e la libreria degli effetti dall'esterno).
 */

/** Operazioni ammesse su una statistica, nell'ordine in cui si applicano (GDD regola 4). */
export const OPERAZIONI = Object.freeze(['imposta', 'somma', 'moltiplica']);

/** Vero se `n` è un numero finito. */
const eNumero = (n) => typeof n === 'number' && Number.isFinite(n);

/**
 * Risolve il nome di una statistica del catalogo nel percorso `file.chiave` dei parametri: un nome
 * corto passa dal registro (`doni.json › statistiche`); un nome con il punto è già un percorso.
 * @param {string} nome
 * @param {Record<string, { parametro: string }>} registro
 * @returns {string|null} percorso, o null se il nome corto non è nel registro
 */
export function risolviStatistica(nome, registro) {
  if (typeof nome !== 'string' || nome === '') return null;
  if (nome.includes('.')) return nome;
  const def = registro?.[nome];
  return def && typeof def.parametro === 'string' ? def.parametro : null;
}

/**
 * Normalizza un'iscrizione a un gancio: accetta sia `evento` (GDD) sia `gancio` (ADR) come nome
 * dell'evento; i campi mancanti ricevono i valori neutri (probabilità 1, nessuna ricarica, nessun tetto).
 * @param {object} g
 */
export function normalizzaGancio(g) {
  return {
    evento: g?.evento ?? g?.gancio,
    probabilita: g?.probabilita ?? 1,
    ricarica_ms: g?.ricarica_ms ?? 0,
    max_per_stanza: g?.max_per_stanza ?? null,
    effetto: g?.effetto,
    parametri: g?.parametri && typeof g.parametri === 'object' ? { ...g.parametri } : {},
  };
}

/**
 * Valida un modificatore `{statistica, operazione, valore}` contro il registro e i parametri.
 * @param {object} m
 * @param {{ registro: object, parametri: { ha: (k: string) => boolean, statistica: (k: string) => object }, dove: string }} ctx
 * @returns {string[]} errori
 */
export function validaModificatore(m, { registro, parametri, dove }) {
  const errori = [];
  if (!m || typeof m !== 'object') return [`${dove}: modificatore non è un oggetto`];
  const percorso = risolviStatistica(m.statistica, registro);
  if (!percorso) {
    errori.push(`${dove}: statistica sconosciuta '${m.statistica}' (non nel registro di doni.json)`);
    return errori;
  }
  let voce = null;
  try {
    voce = parametri.statistica(percorso);
  } catch {
    errori.push(`${dove}: '${m.statistica}' → parametro '${percorso}' assente nei parametri`);
    return errori;
  }
  if (!eNumero(voce.min) || !eNumero(voce.max)) errori.push(`${dove}: '${percorso}' senza min/max`);
  if (!OPERAZIONI.includes(m.operazione)) {
    errori.push(`${dove}: operazione sconosciuta '${m.operazione}' su '${m.statistica}'`);
    return errori;
  }
  const def = m.statistica.includes('.') ? null : registro[m.statistica];
  if (def?.operazioni && !def.operazioni.includes(m.operazione)) {
    errori.push(`${dove}: operazione '${m.operazione}' non ammessa su '${m.statistica}' (ammesse: ${def.operazioni.join(', ')})`);
  }
  const v = m.operazione === 'imposta' && typeof m.valore === 'boolean' ? Number(m.valore) : m.valore;
  if (!eNumero(v)) {
    errori.push(`${dove}: valore non numerico per '${m.statistica}'`);
    return errori;
  }
  if (m.operazione === 'moltiplica') {
    if (v <= 0) errori.push(`${dove}: moltiplicatore ${v} ≤ 0 su '${m.statistica}'`);
    const pd = def?.per_dono;
    if (pd && (v < pd.min || v > pd.max)) {
      errori.push(`${dove}: moltiplicatore ${v} fuori dall'intervallo per dono [${pd.min}, ${pd.max}] su '${m.statistica}'`);
    }
  }
  return errori;
}

/**
 * Valida un'iscrizione a un gancio (già normalizzata o no).
 * @param {object} g
 * @param {{ ganci: string[], libreria: Map<string, { obbligatori: string[], predefiniti: object }>, registro: object, parametri: object, dove: string }} ctx
 * @returns {string[]} errori
 */
export function validaGancio(g, { ganci, libreria, registro, parametri, dove }) {
  const errori = [];
  const n = normalizzaGancio(g);
  if (!ganci.includes(n.evento)) errori.push(`${dove}: gancio sconosciuto '${n.evento}' (ammessi: ${ganci.join(', ')})`);
  if (!eNumero(n.probabilita) || n.probabilita < 0 || n.probabilita > 1) errori.push(`${dove}: probabilita ${n.probabilita} fuori da [0, 1]`);
  if (!eNumero(n.ricarica_ms) || n.ricarica_ms < 0) errori.push(`${dove}: ricarica_ms ${n.ricarica_ms} negativa o non numerica`);
  if (n.max_per_stanza !== null && (!Number.isInteger(n.max_per_stanza) || n.max_per_stanza < 1)) errori.push(`${dove}: max_per_stanza deve essere null o un intero ≥ 1`);
  const voce = libreria.get(n.effetto);
  if (!voce) {
    errori.push(`${dove}: effetto sconosciuto '${n.effetto}' (non in oggetti/effetti.js)`);
    return errori;
  }
  for (const nome of voce.obbligatori) {
    if (!(nome in n.parametri)) errori.push(`${dove}: effetto '${n.effetto}' senza il parametro obbligatorio '${nome}'`);
  }
  const ammessi = new Set([...voce.obbligatori, ...Object.keys(voce.predefiniti)]);
  for (const nome of Object.keys(n.parametri)) {
    if (!ammessi.has(nome)) errori.push(`${dove}: effetto '${n.effetto}' non accetta il parametro '${nome}'`);
  }
  if (voce.canonico === 'bonus_temporaneo') {
    errori.push(...validaModificatore(
      { statistica: n.parametri.statistica, operazione: n.parametri.operazione, valore: n.parametri.valore },
      { registro, parametri, dove: `${dove} (bonus_temporaneo)` },
    ));
    if (!eNumero(n.parametri.durata_ms) || n.parametri.durata_ms <= 0) errori.push(`${dove}: durata_ms deve essere > 0`);
  }
  return errori;
}

/**
 * Valida il catalogo (il JSON intero di doni.json) e indicizza i doni validi per id.
 * @param {object} catalogo contenuto di doni.json
 * @param {{ parametri: object, libreria: Map<string, object> }} ctx
 * @returns {{ errori: string[], indice: Map<string, object>, esclusi: string[] }}
 */
export function validaCatalogo(catalogo, { parametri, libreria }) {
  const errori = [];
  const indice = new Map();
  const esclusi = [];
  if (!catalogo || typeof catalogo !== 'object') return { errori: ['doni.json: il file non è un oggetto'], indice, esclusi };
  const registro = catalogo.statistiche ?? {};
  const ganci = Array.isArray(catalogo.ganci) ? catalogo.ganci : [];
  const tag = new Set(Array.isArray(catalogo.tag) ? catalogo.tag : []);
  const vietate = new Set(catalogo.sagome?.vietate_oro ?? []);
  for (const [nome, def] of Object.entries(registro)) {
    if (nome.startsWith('_')) continue;
    if (!parametri.ha(def?.parametro)) errori.push(`doni.statistiche.${nome}: parametro '${def?.parametro}' assente`);
    else {
      try {
        parametri.statistica(def.parametro);
      } catch {
        errori.push(`doni.statistiche.${nome}: '${def.parametro}' non è una statistica {base,min,max}`);
      }
    }
    if (def?.pi_cap && !(eNumero(def.pi_cap.min) && eNumero(def.pi_cap.max) && def.pi_cap.min <= def.pi_cap.max)) errori.push(`doni.statistiche.${nome}: pi_cap non valido`);
  }
  const formeOro = new Map();
  for (const dono of Array.isArray(catalogo.doni) ? catalogo.doni : []) {
    const dove = `dono '${dono?.id}'`;
    const miei = [];
    if (!dono || typeof dono.id !== 'string' || dono.id === '') {
      errori.push('dono senza id');
      continue;
    }
    if (indice.has(dono.id) || esclusi.includes(dono.id)) miei.push(`${dove}: id duplicato`);
    for (const m of dono.modificatori ?? []) miei.push(...validaModificatore(m, { registro, parametri, dove }));
    for (const g of dono.ganci ?? []) miei.push(...validaGancio(g, { ganci, libreria, registro, parametri, dove }));
    for (const t of dono.tag ?? []) if (!tag.has(t)) miei.push(`${dove}: tag sconosciuto '${t}'`);
    const oro = dono.categoria !== 'ricordi';
    if (oro && dono.scelta) miei.push(`${dove}: un dono d'oro non può avere 'scelta'`);
    if (!oro && dono.rarita !== 'unico') miei.push(`${dove}: un ricordo deve avere rarita 'unico'`);
    const forma = dono.sagoma?.forma;
    if (oro && forma) {
      if (vietate.has(forma)) miei.push(`${dove}: forma d'oro vietata '${forma}'`);
      if (formeOro.has(forma)) miei.push(`${dove}: forma d'oro '${forma}' già usata da '${formeOro.get(forma)}'`);
      else formeOro.set(forma, dono.id);
    }
    if (miei.length) {
      errori.push(...miei);
      esclusi.push(dono.id);
    } else {
      indice.set(dono.id, dono);
    }
  }
  return { errori, indice, esclusi };
}

/**
 * Valida il file delle sinergie: due tag diversi del vocabolario, effetto con sole chiavi note.
 * @param {object} file contenuto di sinergie.json
 * @param {{ catalogo: object, parametri: object, libreria: Map<string, object> }} ctx
 * @returns {{ errori: string[], valide: object[] }}
 */
export function validaSinergie(file, { catalogo, parametri, libreria }) {
  const errori = [];
  const valide = [];
  const lista = Array.isArray(file?.sinergie) ? file.sinergie : Array.isArray(file) ? file : null;
  if (!lista) return { errori: ['sinergie.json: manca la lista `sinergie`'], valide };
  const registro = catalogo?.statistiche ?? {};
  const ganci = Array.isArray(catalogo?.ganci) ? catalogo.ganci : [];
  const tag = new Set(catalogo?.tag ?? []);
  const visti = new Set();
  for (const s of lista) {
    const dove = `sinergia '${s?.id}'`;
    const miei = [];
    if (!s || typeof s.id !== 'string') {
      errori.push('sinergia senza id');
      continue;
    }
    if (visti.has(s.id)) miei.push(`${dove}: id duplicato`);
    const chiaviTag = Object.keys(s).filter((k) => /^tag_/.test(k));
    if (chiaviTag.length !== 2 || !('tag_a' in s) || !('tag_b' in s)) miei.push(`${dove}: servono esattamente due tag (tag_a, tag_b)`);
    if (s.tag_a === s.tag_b) miei.push(`${dove}: i due tag devono essere diversi`);
    for (const t of [s.tag_a, s.tag_b]) if (!tag.has(t)) miei.push(`${dove}: tag sconosciuto '${t}'`);
    const e = s.effetto;
    if (!e || typeof e !== 'object') miei.push(`${dove}: manca 'effetto'`);
    else {
      for (const k of Object.keys(e)) {
        if (!['modificatori', 'param_extra', 'ganci_extra'].includes(k)) miei.push(`${dove}: effetto con chiave sconosciuta '${k}'`);
      }
      for (const m of e.modificatori ?? []) miei.push(...validaModificatore(m, { registro, parametri, dove }));
      for (const g of e.ganci_extra ?? []) miei.push(...validaGancio(g, { ganci, libreria, registro, parametri, dove }));
      for (const [nomeEffetto, extra] of Object.entries(e.param_extra ?? {})) {
        const voce = libreria.get(nomeEffetto);
        if (!voce) miei.push(`${dove}: param_extra su effetto sconosciuto '${nomeEffetto}'`);
        else {
          const ammessi = new Set([...voce.obbligatori, ...Object.keys(voce.predefiniti)]);
          for (const [p, v] of Object.entries(extra ?? {})) {
            if (!ammessi.has(p)) miei.push(`${dove}: param_extra '${p}' non è un parametro di '${nomeEffetto}'`);
            if (!eNumero(v)) miei.push(`${dove}: param_extra '${p}' non numerico`);
          }
        }
      }
    }
    visti.add(s.id);
    if (miei.length) errori.push(...miei);
    else valide.push(s);
  }
  return { errori, valide };
}
