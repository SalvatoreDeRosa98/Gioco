/**
 * motore/oggetti/gratis.js — Gli oggetti GRATIS delle stanze (storia P04/P09; Teatro tiraOggettoGratisStanza ~3078 e
 * verificaStanzaPulita ~3700): «1 stanza su 3 ha un oggetto base gratis e 1 su 10 uno forte».
 *
 * A `stanza.pulita` combattuta di una stanza `normale` (e alla pulizia della `segreta`) si tira UNA volta per stanza con il
 * generatore derivato dal `seme_stanza` del record (`derivato(creaRng(seme), 'gratis')`): `< p_forte` → tier `forte`,
 * `< p_forte + p_base` → tier `base`, altrimenti niente (economia.json › gratis). Il dono esce dal catalogo per
 * `teatro.tier`, senza ripetizione nella run (né doni già addosso). Il piedistallo gratis sta al centro della stanza
 * (`puntoSicuro` del record non serve: la cella centrale dei modelli è libera; se è occupata si usa la prima cella libera).
 * `tick()`: `interagisci` entro `economia.r_interagisci` lo raccoglie attraverso i cinque slot (`acquisisci`): se gli slot sono
 * pieni il modale decide; il dono sostituito torna sul piedistallo (regola del Teatro, `restituisci`).
 * Eventi: `gratis.posato` {stanza, id, tier, x, y}, `gratis.raccolto` {stanza, id}. Nessun numero e nessuna stringa di gioco.
 */

import { creaRng, derivato } from '../fondazione/rng.js';

/** Tier del Teatro ammessi. */
export const TIER_GRATIS = Object.freeze(['base', 'forte']);
/** Tipi di stanza che tirano l'oggetto gratis a pulizia. */
export const TIPI_GRATIS = Object.freeze(['normale', 'segreta']);

/**
 * Tiro puro dell'oggetto gratis (Teatro tiraOggettoGratisStanza).
 * @param {{ rng: () => number, pForte: number, pBase: number, garantito?: boolean }} o
 * @returns {'forte' | 'base' | null}
 */
export function tiraTier({ rng, pForte, pBase, garantito = false }) {
  const u = rng();
  if (u < pForte) return 'forte';
  if (garantito || u < pForte + pBase) return 'base';
  return null;
}

/**
 * @param {{
 *   parametri: { get: Function },
 *   catalogo: object[],                                   doni.json › doni (si legge teatro.tier)
 *   eventi: { on: Function, emit: Function },
 *   notte: () => ({ stanza: object | null, pianta: object } | null),
 *   ferruccio: { x: number, y: number, stato: string },
 *   modificatori: { doniAttivi: () => string[], dono: Function },
 *   acquisisci: (id: string, opzioni: object) => ('aggiunto' | 'pendente' | false),
 *   input?: { premuto: (azione: string) => boolean } | null
 * }} o
 */
export function creaGratis({ parametri, catalogo, eventi, notte, ferruccio, modificatori, acquisisci, input = null }) {
  if (!parametri || !Array.isArray(catalogo) || !eventi || typeof notte !== 'function' || !ferruccio || !modificatori || typeof acquisisci !== 'function') {
    throw new TypeError('creaGratis: dipendenze mancanti');
  }
  const E = (k) => parametri.get(`economia.${k}`);
  /** @type {Map<string, object>} stanza → { id, tier, x, y, stato } */
  const perStanza = new Map();
  const offerti = new Set();

  function pescaDono(tier, rng) {
    const addosso = new Set(modificatori.doniAttivi());
    const candidati = catalogo.filter((d) => d.teatro?.tier === tier && !offerti.has(d.id) && !addosso.has(d.id));
    if (!candidati.length) return null;
    return candidati[Math.min(candidati.length - 1, Math.floor(rng() * candidati.length))];
  }

  function centroStanza(st) {
    return { x: st.origine.x + (st.geo.colonne * st.cella) / 2, y: st.origine.y + (st.geo.righe * st.cella) / 2 };
  }

  eventi.on('stanza.pulita', (p) => {
    const n = notte();
    const st = n?.stanza;
    if (!st || !p || st.id !== p.id || !TIPI_GRATIS.includes(p.tipo) || perStanza.has(p.id)) return;
    if (p.tipo === 'normale' && !p.combattuta) return;
    const record = n.pianta?.stanze?.find((r) => r.id === p.id);
    const rng = derivato(creaRng(record?.seme_stanza ?? 0), 'gratis');
    const tier = tiraTier({ rng, pForte: E('gratis.p_forte'), pBase: E('gratis.p_base') });
    const dono = tier ? pescaDono(tier, rng) : null;
    perStanza.set(p.id, dono ? { id: dono.id, tier, ...centroStanza(st), stato: 'offerto' } : null);
    if (!dono) return;
    offerti.add(dono.id);
    eventi.emit('gratis.posato', { stanza: p.id, id: dono.id, tier, x: perStanza.get(p.id).x, y: perStanza.get(p.id).y });
  });

  /** L'oggetto gratis della stanza corrente (offerto o preso), o null. */
  function corrente() {
    const st = notte()?.stanza;
    const g = st ? perStanza.get(st.id) : null;
    return g ? { ...g, stanza: st.id, dono: modificatori.dono(g.id) } : null;
  }

  /** Vero se Ferruccio è entro `r_interagisci` dall'oggetto offerto. */
  function vicino() {
    const g = corrente();
    return Boolean(g && g.stato === 'offerto' && Math.hypot(g.x - ferruccio.x, g.y - ferruccio.y) <= E('r_interagisci'));
  }

  /** Raccoglie l'oggetto gratis della stanza corrente attraverso i cinque slot. */
  function raccogli() {
    const st = notte()?.stanza;
    const g = st ? perStanza.get(st.id) : null;
    if (!g || g.stato !== 'offerto') return false;
    const esito = acquisisci(g.id, {
      origine: 'gratis',
      suConferma: () => { g.stato = 'preso'; eventi.emit('gratis.raccolto', { stanza: st.id, id: g.id }); },
      restituisci: (idVecchio) => { g.id = idVecchio; g.stato = 'offerto'; },
    });
    return esito;
  }

  return {
    corrente, vicino, raccogli,
    /** Un tick: `interagisci` vicino all'oggetto gratis lo raccoglie. */
    tick() { if (input && input.premuto('interagisci') && vicino()) raccogli(); },
    /** Stati per stanza (test). */
    stati() { return Object.fromEntries(Array.from(perStanza, ([k, v]) => [k, v ? { ...v } : null])); },
    /** Nuovo piano: le stanze cambiano, gli offerti della run restano. */
    nuovoPiano() { perStanza.clear(); },
    /** Nuova run. */
    nuovaRun() { perStanza.clear(); offerti.clear(); },
  };
}
