/**
 * motore/oggetti/modificatori.js — Statistiche nominate: valore effettivo dopo i doni (ADR-0002).
 *
 * Versione MINIMA per le storie 007-011: `valore(nome)` restituisce il valore effettivo di una
 * statistica `{base, min, max}` dei parametri, cioè `clamp((base + Σ somme) × Π moltiplicatori,
 * min, max)`. Le somme e i moltiplicatori arrivano da `applica(...)` (qui usato dai test e dagli
 * strumenti di debug); il catalogo dei doni, i flag `imposta` e i ganci arrivano con la storia 023.
 *
 * Il combattimento e il controllo leggono SOLO da qui (mai `parametri.get` per le statistiche
 * nominate): così i doni modificano i numeri senza rami di codice nel motore.
 * Dipendenze: solo `parametri` iniettato.
 */

/** Operazioni ammesse su una statistica, nell'ordine in cui si applicano (ADR-0002). */
export const OPERAZIONI = Object.freeze(['somma', 'moltiplica']);

/**
 * Crea il calcolatore delle statistiche effettive.
 * @param {{ statistica: (chiave: string) => { base: number, min: number, max: number }, get: (chiave: string) => unknown }} parametri
 * @returns {{
 *   valore: (nome: string) => number,
 *   applica: (modificatore: { statistica: string, operazione: 'somma'|'moltiplica', valore: number }) => () => void,
 *   azzera: () => void,
 *   attivi: (nome: string) => { statistica: string, operazione: string, valore: number }[]
 * }}
 */
export function creaModificatori(parametri) {
  if (!parametri || typeof parametri.statistica !== 'function') {
    throw new TypeError('creaModificatori: manca `parametri.statistica`');
  }
  /** @type {Map<string, { statistica: string, operazione: string, valore: number }[]>} */
  const perStatistica = new Map();

  /**
   * Valore effettivo di una statistica nominata (es. 'ferruccio.v_base').
   * @param {string} nome percorso `file.chiave`
   * @returns {number}
   */
  function valore(nome) {
    const { base, min, max } = parametri.statistica(nome);
    const lista = perStatistica.get(nome);
    if (!lista || lista.length === 0) return base;
    let v = base;
    for (const m of lista) if (m.operazione === 'somma') v += m.valore;
    for (const m of lista) if (m.operazione === 'moltiplica') v *= m.valore;
    return Math.min(max, Math.max(min, v));
  }

  /**
   * Registra un modificatore; restituisce la funzione che lo toglie.
   * @param {{ statistica: string, operazione: 'somma'|'moltiplica', valore: number }} modificatore
   * @returns {() => void}
   */
  function applica(modificatore) {
    const { statistica, operazione, valore: v } = modificatore ?? {};
    if (!OPERAZIONI.includes(operazione)) throw new RangeError(`modificatori.applica: operazione sconosciuta '${operazione}'`);
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`modificatori.applica: valore non numerico per '${statistica}'`);
    parametri.statistica(statistica); // lancia se la statistica non esiste
    let lista = perStatistica.get(statistica);
    if (!lista) {
      lista = [];
      perStatistica.set(statistica, lista);
    }
    const voce = { statistica, operazione, valore: v };
    lista.push(voce);
    return () => {
      const i = lista.indexOf(voce);
      if (i >= 0) lista.splice(i, 1);
    };
  }

  /** Toglie tutti i modificatori (cambio di notte, test). */
  function azzera() {
    perStatistica.clear();
  }

  /**
   * Modificatori attivi su una statistica (copia).
   * @param {string} nome
   */
  function attivi(nome) {
    return (perStatistica.get(nome) ?? []).map((m) => ({ ...m }));
  }

  return { valore, applica, azzera, attivi };
}
