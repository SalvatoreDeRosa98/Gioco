/**
 * motore/oggetti/slot.js — I cinque slot dei doni passivi con sostituzione (storia P04/P09; Teatro
 * acquisisciOggettoConLimite5Slot ~2788 e confermaSostituzioneSlot ~2822, MAX_SLOT_OGGETTI = `doni.limiti.max_slot_doni`).
 *
 * Ogni acquisizione di un dono passa da qui (`acquisisci(id, opzioni)`):
 *  - con uno slot libero il dono entra subito (`modificatori.aggiungiDono`) → `'aggiunto'`;
 *  - a slot pieni resta PENDENTE (`'pendente'`): chi mostra il modale (interfaccia) chiede 1-5; `conferma(i)` sostituisce il
 *    dono nello slot `i` con il nuovo (`modificatori.sostituisciDono`), `annulla()` rinuncia.
 * Regola del Teatro sul dono tolto: se il nuovo viene da un piedistallo (o da un oggetto gratis) il vecchio TORNA sul
 * piedistallo (`opzioni.restituisci(idVecchio)`), altrimenti (Fucina/banchetto) si perde. `opzioni.suConferma()` fa ciò che
 * l'origine deve fare solo quando il dono è davvero entrato (pagare, segnare lo slot venduto): è chiamata anche
 * nell'acquisizione immediata. `healOnEquip` del blocco `teatro.mod` cura subito (Teatro) in mezze maschere → maschere intere.
 * Eventi: `slot.pendente` {id, origine, attivi}, `slot.sostituito` {rimosso, aggiunto, slot}, `slot.annullato` {id},
 * `slot.aggiunto` {id, origine}. Nessun numero e nessuna stringa di gioco. Dipendenze: modificatori, ferruccio.
 */

/**
 * @param {{
 *   modificatori: { aggiungiDono: Function, sostituisciDono: Function, doniAttivi: () => string[], dono: (id: string) => object | null, valore: Function },
 *   parametri: { get: (chiave: string) => any },
 *   eventi?: { emit: Function } | null,
 *   ferruccio?: { maschere: number, impostaMaschere: Function } | null,
 *   log?: { error: Function }
 * }} o
 */
export function creaSlot({ modificatori, parametri, eventi = null, ferruccio = null, log = console }) {
  if (!modificatori || !parametri) throw new TypeError('creaSlot: modificatori e parametri obbligatori');
  const maxSlot = () => parametri.get('doni').limiti.max_slot_doni.base;
  let pendente = null;

  function curaDiEquipaggiamento(id) {
    const heal = modificatori.dono(id)?.teatro?.mod?.healOnEquip ?? 0;
    if (!ferruccio || heal <= 0) return;
    const max = modificatori.valore('ferruccio.maschere_max');
    ferruccio.impostaMaschere(Math.min(max, ferruccio.maschere + Math.ceil(heal / 2)));
  }

  /**
   * @param {string} id dono del catalogo
   * @param {{ origine?: string, restituisci?: (idVecchio: string) => void, suConferma?: () => void }} [opzioni]
   * @returns {'aggiunto' | 'pendente' | false}
   */
  function acquisisci(id, opzioni = {}) {
    if (!modificatori.dono(id)) { log?.error?.(`[slot] dono sconosciuto '${id}'`); return false; }
    if (modificatori.doniAttivi().includes(id)) return false;
    if (pendente) return false; // un solo scambio per volta (Teatro: scambioPendente)
    if (modificatori.doniAttivi().length < maxSlot()) {
      if (!modificatori.aggiungiDono(id)) return false;
      opzioni.suConferma?.();
      curaDiEquipaggiamento(id);
      eventi?.emit('slot.aggiunto', { id, origine: opzioni.origine ?? null, attivi: modificatori.doniAttivi() });
      return 'aggiunto';
    }
    pendente = { id, origine: opzioni.origine ?? null, restituisci: opzioni.restituisci ?? null, suConferma: opzioni.suConferma ?? null };
    eventi?.emit('slot.pendente', { id, origine: pendente.origine, attivi: modificatori.doniAttivi() });
    return 'pendente';
  }

  /** Sostituisce il dono nello slot `i` (0-based) con quello pendente. */
  function conferma(i) {
    if (!pendente) return false;
    const attivi = modificatori.doniAttivi();
    if (!Number.isInteger(i) || i < 0 || i >= attivi.length) return false;
    const vecchio = attivi[i];
    const p = pendente;
    if (!modificatori.sostituisciDono(i, p.id)) return false;
    pendente = null;
    p.suConferma?.();
    curaDiEquipaggiamento(p.id);
    p.restituisci?.(vecchio);
    eventi?.emit('slot.sostituito', { rimosso: vecchio, aggiunto: p.id, slot: i, attivi: modificatori.doniAttivi() });
    return true;
  }

  /** Rinuncia al dono pendente (resta dov'era). */
  function annulla() {
    if (!pendente) return false;
    const { id } = pendente;
    pendente = null;
    eventi?.emit('slot.annullato', { id });
    return true;
  }

  return {
    acquisisci,
    conferma,
    annulla,
    get pendente() { return pendente ? { id: pendente.id, origine: pendente.origine } : null; },
    get pieno() { return modificatori.doniAttivi().length >= maxSlot(); },
    get max() { return maxSlot(); },
    /** Stato per il modale e i test. */
    stato() {
      return { pendente: pendente ? { id: pendente.id, origine: pendente.origine, nome: modificatori.dono(pendente.id)?.nome ?? pendente.id } : null, attivi: modificatori.doniAttivi(), max: maxSlot() };
    },
  };
}
