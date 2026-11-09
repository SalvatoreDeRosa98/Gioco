/**
 * motore/oggetti/patto.js — Il Patto d'Ombra: l'altare che compare nella stanza del boss dopo la vittoria e le
 * reliquie proibite che costano una Maschera massima per sempre (storia P04/P09; Teatro CATALOGO_PATTO ~2397,
 * popolaStanzaIsaac 'patto' ~3240, verificaStanzaPulita ~3692, acquisisciOggettoConLimite5Slot 'patto' ~2788).
 *
 * Regole (numeri da `patto.json › regole`):
 *  - a `boss.sconfitto` l'altare compare con probabilità `p_altare_senza_danno` se Ferruccio non ha perso maschere nella
 *    stanza del boss, `p_altare_con_danno` altrimenti (generatore iniettato, derivato dal seme); offre
 *    `reliquie_per_altare` reliquie estratte senza ripetizione nella run tra quelle non ancora strette;
 *  - vicino a una reliquia (`economia.r_interagisci`) `interagisci` la PROPONE (pannello di conferma: «−1 Maschera massima
 *    per sempre»); `conferma` (azione `conferma`) la stringe, `indietro` rifiuta;
 *  - stringere: `maxHpHalf` deve restare sopra il costo (Teatro: `maxHpHalf > costoMaxHpHalf`), poi
 *    `statistiche.stringiPatto(reliquia)` (le statistiche ricalcolano DMG, flag `raggio`/`spettrale`, maschere massime),
 *    le maschere correnti sono tagliate al nuovo massimo, `healOnEquip` cura fino al massimo (Cuore Sacro);
 *  - il patto vale per tutta la run (sopravvive al cambio di stanza e di piano); `nuovaRun()` scioglie tutto.
 * Eventi: `patto.altare` {stanza, reliquie}, `patto.proposto` {id}, `patto.stretto` {id, maschereMax}, `patto.rifiutato`
 * {id, motivo}, `patto.annullato` {id}. Nessun numero e nessuna stringa di gioco. Dipendenze verso il basso.
 */

/** Motivi di rifiuto. */
export const MOTIVI_PATTO = Object.freeze(['maschere', 'stretto', 'nessuno']);

const base = (v) => (v && typeof v === 'object' && 'base' in v ? v.base : v);

/**
 * @param {{
 *   tabella: { patti: object[], regole: object },           patto.json
 *   eventi: { on: Function, emit: Function },
 *   statistiche: { stringiPatto: Function, azzeraPatti: Function, correnti: () => object | null, patti: object[] },
 *   ferruccio: { x: number, y: number, maschere: number, impostaMaschere: Function },
 *   modificatori: { valore: Function },
 *   parametri: { get: Function },
 *   rng: () => number,
 *   notte: () => ({ stanza: object | null } | null),
 *   input?: { premuto: (azione: string) => boolean } | null
 * }} o
 */
export function creaPatto({ tabella, eventi, statistiche, ferruccio, modificatori, parametri, rng, notte, input = null }) {
  if (!tabella?.patti || !eventi || !statistiche || !ferruccio || !modificatori || !parametri || typeof rng !== 'function' || typeof notte !== 'function') {
    throw new TypeError('creaPatto: dipendenze mancanti');
  }
  const R = (k) => base(tabella.regole?.[k]);
  const stretti = new Set();
  let altare = null;            // { stanza, reliquie: [{ indice, id, x, y, stretto }] }
  let pendente = null;          // indice della reliquia proposta
  let maschereInizioBoss = null;
  let dannoNelBoss = false;

  const reliquia = (id) => tabella.patti.find((p) => p.id === id) ?? null;
  const maschereMax = () => modificatori.valore('ferruccio.maschere_max');

  /** Estrae `n` reliquie non strette, senza ripetizione, con il generatore. */
  function estrai(n) {
    const candidati = tabella.patti.filter((p) => !stretti.has(p.id)).map((p) => p.id);
    const scelte = [];
    while (scelte.length < n && candidati.length > 0) {
      const i = Math.min(candidati.length - 1, Math.floor(rng() * candidati.length));
      scelte.push(candidati.splice(i, 1)[0]);
    }
    return scelte;
  }

  /** Posa l'altare nella stanza corrente (quella del boss), attorno al punto dato. */
  function posaAltare(stanzaId, punto) {
    const st = notte()?.stanza;
    const cella = st?.cella ?? 0;
    const ids = estrai(R('reliquie_per_altare'));
    if (!ids.length) return null;
    const centro = punto ?? (st ? { x: st.origine.x + (st.geo.colonne * cella) / 2, y: st.origine.y + (st.geo.righe * cella) / 2 } : { x: ferruccio.x, y: ferruccio.y });
    altare = {
      stanza: stanzaId,
      reliquie: ids.map((id, i) => ({ indice: i, id, x: centro.x + (i - (ids.length - 1) / 2) * cella * 2, y: centro.y, stretto: false })),
    };
    eventi.emit('patto.altare', { stanza: stanzaId, reliquie: altare.reliquie.map((r) => ({ ...r })) });
    return altare;
  }

  eventi.on('stanza.entrata', (p) => {
    if (p?.tipo === 'boss') { maschereInizioBoss = ferruccio.maschere; dannoNelBoss = false; }
  });
  eventi.on('ferruccio.danno', () => { if (maschereInizioBoss !== null) dannoNelBoss = true; });
  eventi.on('boss.sconfitto', (p) => {
    const st = notte()?.stanza;
    if (!st || (p?.stanza && p.stanza !== st.id)) return;
    if (maschereInizioBoss !== null && ferruccio.maschere < maschereInizioBoss) dannoNelBoss = true;
    const prob = dannoNelBoss ? R('p_altare_con_danno') : R('p_altare_senza_danno');
    maschereInizioBoss = null;
    if (rng() < prob) posaAltare(st.id, null);
  });

  /** Indice della reliquia offerta vicina a Ferruccio nella stanza corrente, o −1. */
  function vicino() {
    const st = notte()?.stanza;
    if (!altare || !st || st.id !== altare.stanza) return -1;
    const r = parametri.get('economia.r_interagisci');
    let migliore = -1;
    let dMin = Infinity;
    for (const q of altare.reliquie) {
      if (q.stretto) continue;
      const d = Math.hypot(q.x - ferruccio.x, q.y - ferruccio.y);
      if (d <= r && d < dMin) { dMin = d; migliore = q.indice; }
    }
    return migliore;
  }

  /** Propone la reliquia `i` (apre la conferma). */
  function proponi(i) {
    const q = altare?.reliquie[i];
    if (!q || q.stretto || pendente !== null) return false;
    pendente = i;
    eventi.emit('patto.proposto', { id: q.id, costoMaxHpHalf: reliquia(q.id)?.costoMaxHpHalf ?? 0 });
    return true;
  }

  /** Stringe la reliquia proposta. */
  function conferma() {
    if (pendente === null) return { esito: 'rifiutato', motivo: 'nessuno' };
    const q = altare.reliquie[pendente];
    const def = reliquia(q.id);
    const st = statistiche.correnti();
    const costo = def?.costoMaxHpHalf ?? 0;
    if (!def || !st || st.maxHpHalf <= costo) {
      pendente = null;
      eventi.emit('patto.rifiutato', { id: q.id, motivo: 'maschere' });
      return { esito: 'rifiutato', motivo: 'maschere', id: q.id };
    }
    statistiche.stringiPatto(def);
    stretti.add(def.id);
    q.stretto = true;
    pendente = null;
    const max = maschereMax();
    const cura = def.mod?.healOnEquip ? max : Math.min(ferruccio.maschere, max);
    ferruccio.impostaMaschere(Math.min(max, cura));
    eventi.emit('patto.stretto', { id: def.id, maschereMax: max, maschere: ferruccio.maschere, stanza: altare.stanza });
    return { esito: 'stretto', id: def.id, maschereMax: max };
  }

  /** Rifiuta la reliquia proposta (resta sull'altare). */
  function annulla() {
    if (pendente === null) return false;
    const { id } = altare.reliquie[pendente];
    pendente = null;
    eventi.emit('patto.annullato', { id });
    return true;
  }

  /** Un tick: `interagisci` vicino a una reliquia propone; con la proposta aperta `conferma`/`indietro` decidono. */
  function tick() {
    if (!input) return;
    if (pendente !== null) {
      if (input.premuto('conferma')) conferma();
      else if (input.premuto('indietro')) annulla();
      return;
    }
    if (input.premuto('interagisci')) {
      const i = vicino();
      if (i >= 0) proponi(i);
    }
  }

  return {
    tick, vicino, proponi, conferma, annulla, posaAltare,
    get altare() { return altare ? { stanza: altare.stanza, reliquie: altare.reliquie.map((r) => ({ ...r, reliquia: reliquia(r.id) })) } : null; },
    get pendente() { return pendente === null ? null : { indice: pendente, ...altare.reliquie[pendente], reliquia: reliquia(altare.reliquie[pendente].id) }; },
    get stretti() { return Array.from(stretti); },
    /** Vero se la stanza corrente è quella dell'altare (resa più cupa). */
    inStanzaAltare() { const st = notte()?.stanza; return Boolean(altare && st && st.id === altare.stanza); },
    reliquia,
    /** Nuova run: altare via, patti sciolti. */
    nuovaRun() { altare = null; pendente = null; stretti.clear(); maschereInizioBoss = null; statistiche.azzeraPatti(); },
    /** Cambio di piano: l'altare del piano precedente sparisce, i patti restano. */
    nuovoPiano() { altare = null; pendente = null; maschereInizioBoss = null; },
  };
}
