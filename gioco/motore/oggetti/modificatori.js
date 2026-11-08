/**
 * motore/oggetti/modificatori.js — Statistiche nominate, doni, ganci e sinergie (ADR-0002, GDD
 * doni-modificatori.md regole 1-6, GDD combattimento.md regola 9). Storie 007-011 (minimo) e 023.
 *
 * `valore(nome)` è il valore EFFETTIVO di una statistica `{base, min, max}` dei parametri dopo i
 * doni, calcolato nell'ordine fisso della regola 4:
 *   1. imposta — se c'è almeno un `imposta`, sostituisce la base (vince il dono raccolto per ultimo;
 *      a parità di istante, l'id minore in ordine alfabetico);
 *   2. somma   — tutte le somme, nell'unità della statistica;
 *   3. moltiplica — il PRODOTTO dei moltiplicatori, bloccato nel `pi_cap` della statistica, applicato
 *      al risultato del passo 2: `(base + Σsomme) × Π`, mai `base × Π + somme`;
 *   4. clamp   — in `[min, max]` del parametro;
 *   5. arrotondamento — a intero (mezzo in su) per le statistiche marcate `arrotonda` nel registro.
 * Il registro (`contenuti/parametri/doni.json › statistiche`) dà il percorso del parametro, le
 * operazioni ammesse, l'intervallo per dono e il cap Π. Una statistica fuori registro (es.
 * `combattimento.fantoccio.vita`) si legge per percorso: niente cap, niente arrotondamento.
 *
 * Il combattimento e il controllo leggono SOLO da qui: i doni cambiano i numeri senza rami di codice.
 * Il ricalcolo avviene solo quando la lista cambia (cache per statistica), mai a ogni frame.
 *
 * I modificatori di doni, sinergie e bonus temporanei entrano NELLA STESSA LISTA (stessi cap e clamp).
 * I ganci (`su_colpo`, `su_uccisione`, `su_parata`, `su_affondo`, `su_danno_subito`,
 * `su_stanza_pulita`, `su_raccolta`) chiamano effetti di libreria (`oggetti/effetti.js`) nominati e
 * parametrici: probabilità con il generatore seminato `rng`, ricarica, tetto per stanza, profondità 1
 * (un payload con `origine: 'gancio'` non attiva ganci), budget per frame (gli ultimi iscritti sono
 * scartati per primi). Le sinergie (`sinergie.json`) si rivalutano a ogni cambio della lista dei doni e
 * valgono una volta sola.
 *
 * Il tempo interno avanza con `tick(dt)` (secondi, passo fisso): serve a ricariche e bonus temporanei.
 * Dipendenze: `parametri` iniettato; `fondazione/rng.js`; `oggetti/effetti.js`; `oggetti/catalogo.js`.
 */

import { creaRng } from '../fondazione/rng.js';
import { creaLibreria, ORIGINE_GANCIO } from './effetti.js';
import { OPERAZIONI, risolviStatistica, normalizzaGancio, validaCatalogo, validaSinergie } from './catalogo.js';

export { OPERAZIONI };

/** Prefissi delle origini dei modificatori nella lista comune. */
const ORIGINE = Object.freeze({ manuale: 'manuale', dono: 'dono:', sinergia: 'sinergia:', bonus: 'bonus:' });

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Crea il calcolatore delle statistiche effettive e il contenitore dei doni.
 * @param {{ statistica: (chiave: string) => { base: number, min: number, max: number }, ha?: (chiave: string) => boolean, get: (chiave: string) => unknown }} parametri
 * @param {{
 *   catalogo?: object | null,     contenuto di contenuti/parametri/doni.json (senza: solo valore/applica)
 *   sinergie?: object | null,     contenuto di contenuti/parametri/sinergie.json
 *   eventi?: { emit: (nome: string, payload?: unknown) => number } | null,
 *   rng?: () => number,           generatore seminato per le probabilità dei ganci (ADR-0003)
 *   log?: { error: (...a: unknown[]) => void }
 * }} [opzioni]
 */
export function creaModificatori(parametri, opzioni = {}) {
  if (!parametri || typeof parametri.statistica !== 'function') {
    throw new TypeError('creaModificatori: manca `parametri.statistica`');
  }
  const { catalogo = null, sinergie: fileSinergie = null, eventi = null, rng = creaRng(0), log = console } = opzioni;
  const ha = typeof parametri.ha === 'function' ? parametri.ha : (k) => { try { parametri.statistica(k); return true; } catch { return false; } };
  const parametriPerCatalogo = { ha, statistica: parametri.statistica };

  // ---- contenuti --------------------------------------------------------------------------------
  const registro = catalogo?.statistiche ?? {};
  /** @type {Map<string, object>} percorso → definizione del registro */
  const perPercorso = new Map();
  for (const [nome, def] of Object.entries(registro)) {
    if (!nome.startsWith('_') && def?.parametro) perPercorso.set(def.parametro, { nome, ...def });
  }
  const nomiGanci = new Set(Array.isArray(catalogo?.ganci) ? catalogo.ganci : []);
  const libreria = creaLibreria(catalogo?.effetti ?? {});
  const erroriContenuto = libreria.errori.slice();
  let indice = new Map();
  let sinergieValide = [];
  if (catalogo) {
    const esito = validaCatalogo(catalogo, { parametri: parametriPerCatalogo, libreria: libreria.voci });
    erroriContenuto.push(...esito.errori);
    indice = esito.indice;
  }
  if (fileSinergie) {
    const esito = validaSinergie(fileSinergie, { catalogo, parametri: parametriPerCatalogo, libreria: libreria.voci });
    erroriContenuto.push(...esito.errori);
    sinergieValide = esito.valide;
  }
  for (const e of erroriContenuto) log.error(`[modificatori] errore di contenuto: ${e}`);
  const limite = (nome) => {
    const voce = catalogo?.limiti?.[nome];
    return voce && typeof voce.base === 'number' ? voce.base : Infinity;
  };

  // ---- stato ------------------------------------------------------------------------------------
  /** @typedef {{ statistica: string, operazione: string, valore: number, origine: string, istante: number, id: string, scade?: number }} Voce */
  /** @type {Map<string, Voce[]>} percorso → voci */
  const perStatistica = new Map();
  /** @type {Map<string, number>} cache dei valori effettivi */
  const cache = new Map();
  /** @type {string[]} id dei doni attivi in ordine di raccolta */
  const attivi = [];
  /** @type {object[]} iscrizioni ai ganci (doni e sinergie) in ordine di iscrizione */
  const iscrizioni = [];
  /** @type {Map<string, Voce>} chiave `origine|statistica|operazione` → bonus temporaneo */
  const bonus = new Map();
  /** @type {string[]} id delle sinergie attive */
  let sinergieAttiveIds = [];
  /** @type {Map<string, Record<string, number>>} effetto canonico → somme dei param_extra attivi */
  let paramExtra = new Map();
  let istante = 0;
  let oraMs = 0;
  let effettiFrame = 0;

  const invalida = () => cache.clear();

  function aggiungiVoce(voce) {
    let lista = perStatistica.get(voce.statistica);
    if (!lista) {
      lista = [];
      perStatistica.set(voce.statistica, lista);
    }
    lista.push(voce);
    invalida();
    return voce;
  }

  function togliVoce(voce) {
    const lista = perStatistica.get(voce.statistica);
    if (!lista) return;
    const i = lista.indexOf(voce);
    if (i >= 0) lista.splice(i, 1);
    if (lista.length === 0) perStatistica.delete(voce.statistica);
    invalida();
  }

  function togliPerOrigine(origine) {
    for (const lista of perStatistica.values()) {
      for (let i = lista.length - 1; i >= 0; i--) if (lista[i].origine === origine) lista.splice(i, 1);
    }
    for (const [k, lista] of perStatistica) if (lista.length === 0) perStatistica.delete(k);
    invalida();
  }

  /** Percorso del parametro per un nome del catalogo o un percorso già completo. */
  function percorsoDi(nome) {
    const p = risolviStatistica(nome, registro);
    if (!p) throw new RangeError(`modificatori: statistica sconosciuta '${nome}'`);
    return p;
  }

  // ---- calcolo ----------------------------------------------------------------------------------

  /**
   * Valore effettivo di una statistica nominata (es. 'ferruccio.v_base' o 'v_base' se nel registro).
   * @param {string} nome percorso `file.chiave` o nome corto del registro
   * @returns {number}
   */
  function valore(nome) {
    const percorso = percorsoDi(nome);
    if (cache.has(percorso)) return cache.get(percorso);
    const { base, min, max } = parametri.statistica(percorso);
    const lista = perStatistica.get(percorso);
    const def = perPercorso.get(percorso);
    let v;
    if (!lista || lista.length === 0) {
      v = base;
    } else {
      let imposto = null;
      for (const m of lista) {
        if (m.operazione !== 'imposta') continue;
        if (!imposto || m.istante > imposto.istante || (m.istante === imposto.istante && m.id < imposto.id)) imposto = m;
      }
      let s = imposto ? imposto.valore : base;
      for (const m of lista) if (m.operazione === 'somma') s += m.valore;
      let prodotto = 1;
      for (const m of lista) if (m.operazione === 'moltiplica') prodotto *= m.valore;
      if (def?.pi_cap) prodotto = clamp(prodotto, def.pi_cap.min, def.pi_cap.max);
      v = clamp(s * prodotto, min, max);
    }
    if (def?.arrotonda) v = Math.round(v);
    cache.set(percorso, v);
    return v;
  }

  /**
   * Registra un modificatore manuale (strumenti di debug, test); restituisce la funzione che lo toglie.
   * @param {{ statistica: string, operazione: 'imposta'|'somma'|'moltiplica', valore: number|boolean }} modificatore
   * @returns {() => void}
   */
  function applica(modificatore) {
    const { statistica, operazione, valore: v0 } = modificatore ?? {};
    if (!OPERAZIONI.includes(operazione)) throw new RangeError(`modificatori.applica: operazione sconosciuta '${operazione}'`);
    const v = operazione === 'imposta' && typeof v0 === 'boolean' ? Number(v0) : v0;
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`modificatori.applica: valore non numerico per '${statistica}'`);
    const percorso = percorsoDi(statistica);
    parametri.statistica(percorso); // lancia se la statistica non esiste
    const voce = aggiungiVoce({ statistica: percorso, operazione, valore: v, origine: ORIGINE.manuale, istante: ++istante, id: ORIGINE.manuale });
    return () => togliVoce(voce);
  }

  /**
   * Modificatori attivi su una statistica (copia), qualunque sia l'origine.
   * @param {string} nome
   */
  function attiviSu(nome) {
    return (perStatistica.get(percorsoDi(nome)) ?? []).map((m) => ({ ...m }));
  }

  // ---- ganci ------------------------------------------------------------------------------------

  function creaIscrizione(g, proprietario, origine) {
    const n = normalizzaGancio(g);
    return { ...n, proprietario, origine, ultimo: -Infinity, nStanza: 0, seq: ++istante };
  }

  function parametriEffetto(iscrizione) {
    const voce = libreria.voci.get(iscrizione.effetto);
    const p = { ...voce.predefiniti, ...iscrizione.parametri };
    const extra = paramExtra.get(voce.canonico);
    if (extra) for (const [k, d] of Object.entries(extra)) p[k] = (p[k] ?? 0) + d;
    return p;
  }

  /**
   * Emette un evento di gancio: per ogni iscrizione si verificano ricarica, tetto per stanza e
   * probabilità; gli effetti che partono sono limitati dal budget per frame (gli ultimi iscritti
   * sono scartati per primi). Un payload con `origine: 'gancio'` non attiva nulla (profondità 1).
   * @param {string} nome uno dei ganci di doni.json
   * @param {object} [payload] quello dell'evento di combattimento (x, y, bersaglio, direzione, ...)
   * @returns {object[]} esiti degli effetti partiti, nell'ordine di iscrizione
   */
  function emetti(nome, payload = {}) {
    if (!nomiGanci.has(nome)) throw new RangeError(`modificatori.ganci.emetti: gancio sconosciuto '${nome}'`);
    if (payload?.origine === ORIGINE_GANCIO) return [];
    const partono = [];
    for (const i of iscrizioni) {
      if (i.evento !== nome) continue;
      if (oraMs - i.ultimo < i.ricarica_ms) continue;
      if (i.max_per_stanza !== null && i.nStanza >= i.max_per_stanza) continue;
      if (i.probabilita < 1 && !(rng() < i.probabilita)) continue;
      partono.push(i);
    }
    const rimasti = Math.max(0, limite('max_effetti_gancio_frame') - effettiFrame);
    const scelti = partono.length > rimasti ? partono.slice(0, rimasti) : partono;
    const esiti = [];
    for (const i of scelti) {
      i.ultimo = oraMs;
      i.nStanza += 1;
      effettiFrame += 1;
      const voce = libreria.voci.get(i.effetto);
      const contesto = { payload, eventi, modificatori: api, dono: i.proprietario, ora: oraMs };
      try {
        esiti.push(voce.fn(contesto, parametriEffetto(i)));
      } catch (errore) {
        log.error(`[modificatori] errore nell'effetto '${i.effetto}' di '${i.proprietario}':`, errore);
      }
    }
    return esiti;
  }

  /** Iscrizioni attive a un gancio (copie), per debug e test. */
  function iscrizioniA(nome) {
    return iscrizioni.filter((i) => i.evento === nome).map((i) => ({ ...i, parametri: parametriEffetto(i) }));
  }

  /** Nuova stanza: azzera i contatori `max_per_stanza`. */
  function nuovaStanza() {
    for (const i of iscrizioni) i.nStanza = 0;
  }

  /**
   * Modificatore a tempo nella lista comune. Stesso (origine, statistica, operazione): rinnova la
   * durata, non si somma. Scade con `tick`.
   * @param {{ origine: string, statistica: string, operazione: string, valore: number, durata_ms: number }} b
   * @returns {{ statistica: string, operazione: string, valore: number, scade: number, rinnovato: boolean }}
   */
  function bonusTemporaneo({ origine, statistica, operazione, valore: v, durata_ms }) {
    const percorso = percorsoDi(statistica);
    const chiave = `${origine}|${percorso}|${operazione}`;
    const scade = oraMs + durata_ms;
    const esistente = bonus.get(chiave);
    if (esistente) {
      esistente.scade = scade;
      return { statistica: percorso, operazione, valore: esistente.valore, scade, rinnovato: true };
    }
    const voce = aggiungiVoce({ statistica: percorso, operazione, valore: v, origine: ORIGINE.bonus + origine, istante: ++istante, id: origine, scade });
    bonus.set(chiave, voce);
    return { statistica: percorso, operazione, valore: v, scade, rinnovato: false };
  }

  function togliBonusDi(origine) {
    for (const [chiave, voce] of bonus) {
      if (voce.origine === ORIGINE.bonus + origine) {
        togliVoce(voce);
        bonus.delete(chiave);
      }
    }
  }

  /**
   * Avanza il tempo interno (ricariche, scadenze dei bonus) e azzera il budget del frame.
   * @param {number} dt secondi (passo fisso)
   */
  function tick(dt) {
    oraMs += dt * 1000;
    effettiFrame = 0;
    for (const [chiave, voce] of bonus) {
      if (voce.scade <= oraMs) {
        togliVoce(voce);
        bonus.delete(chiave);
      }
    }
  }

  // ---- sinergie ---------------------------------------------------------------------------------

  function tagDi(id) {
    return new Set(indice.get(id)?.tag ?? []);
  }

  /** Vero se due doni DISTINTI tenuti portano i due tag (GDD formula `sinergia_attiva`). */
  function sinergiaAttiva(s) {
    for (const a of attivi) {
      if (!tagDi(a).has(s.tag_a)) continue;
      for (const b of attivi) if (b !== a && tagDi(b).has(s.tag_b)) return true;
    }
    return false;
  }

  function rivalutaSinergie() {
    const nuove = sinergieValide.filter(sinergiaAttiva).map((s) => s.id);
    const cambiate = nuove.length !== sinergieAttiveIds.length || nuove.some((id, i) => id !== sinergieAttiveIds[i]);
    // si ricostruisce tutto: lo stato delle sinergie è derivato, mai salvato
    for (const s of sinergieValide) togliPerOrigine(ORIGINE.sinergia + s.id);
    for (let i = iscrizioni.length - 1; i >= 0; i--) if (iscrizioni[i].origine === 'sinergia') iscrizioni.splice(i, 1);
    paramExtra = new Map();
    for (const id of nuove) {
      const s = sinergieValide.find((x) => x.id === id);
      const e = s.effetto ?? {};
      for (const m of e.modificatori ?? []) {
        aggiungiVoce({ statistica: percorsoDi(m.statistica), operazione: m.operazione, valore: m.valore, origine: ORIGINE.sinergia + id, istante, id });
      }
      for (const g of e.ganci_extra ?? []) iscrizioni.push(creaIscrizione(g, id, 'sinergia'));
      for (const [nomeEffetto, extra] of Object.entries(e.param_extra ?? {})) {
        const canonico = libreria.voci.get(nomeEffetto)?.canonico ?? nomeEffetto;
        const somma = paramExtra.get(canonico) ?? {};
        for (const [k, d] of Object.entries(extra)) somma[k] = (somma[k] ?? 0) + d;
        paramExtra.set(canonico, somma);
      }
    }
    sinergieAttiveIds = nuove;
    invalida();
    if (cambiate) eventi?.emit('doni.sinergie', { attive: nuove.slice() });
  }

  // ---- doni -------------------------------------------------------------------------------------

  /**
   * Raccoglie un dono del catalogo: modificatori nella lista, ganci iscritti, sinergie rivalutate.
   * @param {string} id
   * @returns {boolean} falso (con errore loggato) se l'id è sconosciuto, escluso dal validatore o già attivo
   */
  function aggiungiDono(id, opzioniAggiunta = {}) {
    const dono = indice.get(id);
    if (!dono) {
      log.error(`[modificatori] errore di contenuto: dono sconosciuto o non valido '${id}'`);
      return false;
    }
    if (attivi.includes(id)) {
      log.error(`[modificatori] dono '${id}' già attivo`);
      return false;
    }
    const maxSlot = Math.min(5, limite('max_slot_doni'));
    let rimosso = null;
    if (attivi.length >= maxSlot) {
      const idDaTogliere = opzioniAggiunta.sostituisciId && attivi.includes(opzioniAggiunta.sostituisciId)
        ? opzioniAggiunta.sostituisciId
        : attivi[0];
      rimuoviDono(idDaTogliere);
      rimosso = idDaTogliere;
    }
    istante += 1;
    for (const m of dono.modificatori ?? []) {
      const v = m.operazione === 'imposta' && typeof m.valore === 'boolean' ? Number(m.valore) : m.valore;
      aggiungiVoce({ statistica: percorsoDi(m.statistica), operazione: m.operazione, valore: v, origine: ORIGINE.dono + id, istante, id });
    }
    for (const g of dono.ganci ?? []) iscrizioni.push(creaIscrizione(g, id, 'dono'));
    attivi.push(id);
    rivalutaSinergie();
    if (rimosso) {
      eventi?.emit('doni.sostituito', { rimosso, aggiunto: id, attivi: attivi.slice() });
    }
    eventi?.emit('doni.aggiunto', { id, rimosso, attivi: attivi.slice() });
    return true;
  }

  function sostituisciDono(idVecchioOSlot, idNuovo) {
    const idVecchio = typeof idVecchioOSlot === 'number' ? attivi[idVecchioOSlot] : idVecchioOSlot;
    if (!idVecchio || !attivi.includes(idVecchio)) return false;
    return aggiungiDono(idNuovo, { sostituisciId: idVecchio });
  }

  /**
   * Toglie un dono (ricordo restituito, consumabile scaduto): modificatori, ganci e bonus
   * temporanei nati da lui escono; le sinergie si rivalutano nello stesso istante.
   * @param {string} id
   * @returns {boolean} falso se non era attivo
   */
  function rimuoviDono(id) {
    const i = attivi.indexOf(id);
    if (i < 0) return false;
    attivi.splice(i, 1);
    togliPerOrigine(ORIGINE.dono + id);
    for (let k = iscrizioni.length - 1; k >= 0; k--) if (iscrizioni[k].origine === 'dono' && iscrizioni[k].proprietario === id) iscrizioni.splice(k, 1);
    togliBonusDi(id);
    rivalutaSinergie();
    eventi?.emit('doni.rimosso', { id, attivi: attivi.slice() });
    return true;
  }

  /** Id dei doni attivi, in ordine di raccolta (copia). */
  function doniAttivi() {
    return attivi.slice();
  }

  /** Id delle sinergie attive (copia), nell'ordine del file. */
  function sinergieAttive() {
    return sinergieAttiveIds.slice();
  }

  /** Dono del catalogo (copia congelata superficiale) o null. */
  function dono(id) {
    const d = indice.get(id);
    return d ? Object.freeze({ ...d }) : null;
  }

  /** Toglie tutto: doni, modificatori manuali, bonus, iscrizioni (cambio di notte, test). */
  function azzera() {
    perStatistica.clear();
    attivi.length = 0;
    iscrizioni.length = 0;
    bonus.clear();
    sinergieAttiveIds = [];
    paramExtra = new Map();
    effettiFrame = 0;
    invalida();
  }

  const api = {
    valore,
    applica,
    azzera,
    attivi: attiviSu,
    aggiungiDono,
    rimuoviDono,
    sostituisciDono,
    doniAttivi,
    sinergieAttive,
    dono,
    catalogo: () => Array.from(indice.keys()),
    ganci: { emetti, iscrizioni: iscrizioniA, nuovaStanza, nomi: () => Array.from(nomiGanci) },
    bonusTemporaneo,
    tick,
    ora: () => oraMs,
    errori: () => erroriContenuto.slice(),
  };
  return api;
}
