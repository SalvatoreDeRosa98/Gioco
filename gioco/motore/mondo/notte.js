/**
 * motore/mondo/notte.js — La notte in corso: piano, stanza corrente, passaggi tra stanze (Core).
 *
 * Storie 014-016, architettura §4 («Avvio di una notte»). Tiene la pianta del piano, monta la
 * stanza corrente dentro il campo condiviso (stanza.js), conserva lo `StatoStanza` di ogni stanza
 * visitata (una stanza pulita resta pulita quando si rientra, regola 26), guida la camera nelle
 * transizioni (camera.js) e fa girare in ordine, in un solo `tick`, Ferruccio → combattimento →
 * bersagli → proiettili → stanza. Durante una transizione nulla gira e l'input è ignorato (storia
 * 015): i fronti dei tasti si consumano nel tick e non arrivano a nessuno.
 *
 * `salvataggio()` restituisce SOLO {seme, piano, stanza} (ADR-0006: la notte si riprende
 * rigenerando il piano dal seme; lo stato delle stanze è dentro questo modulo e sarà serializzato
 * dal modulo di persistenza della storia 032). `vaiA(id)` è lo strumento di debug che sostituisce il
 * gancio di `window.__gioco`.
 *
 * Eventi: `notte.stanza` {da, a, lato}. Nessun numero di gioco qui.
 */

import { creaStanza } from './stanza.js';
import { LATO_OPPOSTO } from './modelli.js';

/**
 * @param {{
 *   seme: number, numeroPiano: number, pianta: object,
 *   catalogo: { perId: (id: string) => object | null },
 *   parametri: { get: (chiave: string) => any },
 *   tempo: { ticksDaMs: (ms: number) => number },
 *   eventi: { emit: Function, on: Function },
 *   campo: object, scena: { larghezza: number, altezza: number },
 *   ferruccio: object, combattimento: object,
 *   bersagli: object[], proiettili: object[],
 *   camera: ReturnType<import('./camera.js').creaCamera>,
 *   creaNemico: (o: { archetipo: string, x: number, y: number, id: string }) => object,
 *   log?: { error: Function }
 * }} o
 */
export function creaNotte({
  seme, numeroPiano, pianta, catalogo, parametri, tempo, eventi, campo, scena, ferruccio, combattimento,
  bersagli, proiettili, camera, creaNemico, log = console,
}) {
  if (!pianta || !catalogo || !parametri || !tempo || !eventi || !campo || !scena || !ferruccio || !combattimento || !bersagli || !proiettili || !camera || !creaNemico) {
    throw new TypeError('creaNotte: dipendenze mancanti');
  }
  /** @type {Map<string, object>} StatoStanza per id */
  const stati = new Map();
  let stanza = null;
  const recordDi = (id) => pianta.stanze.find((s) => s.id === id) ?? null;

  /**
   * Monta la stanza `id` e posiziona Ferruccio sullo slot d'arrivo (o al centro).
   * @param {string} id
   * @param {string | null} slotArrivo
   * @param {string | null} lato lato di marcia (per l'evento)
   */
  function entra(id, slotArrivo = null, lato = null) {
    const record = recordDi(id);
    if (!record) throw new RangeError(`notte: stanza sconosciuta '${id}'`);
    const modello = catalogo.perId(record.modello);
    if (!modello) throw new RangeError(`notte: modello sconosciuto '${record.modello}' per ${id}`);
    const da = stanza?.id ?? null;
    if (stanza) stati.set(stanza.id, stanza.esci());
    bersagli.length = 0;
    proiettili.length = 0;
    stanza = creaStanza({
      record, modello, piano: numeroPiano, parametri, tempo, eventi, campo, scena, bersagli, creaNemico, ferruccio,
      statoSalvato: stati.get(id) ?? null,
    });
    camera.inquadra(campo);
    const p = stanza.puntoArrivo(slotArrivo);
    ferruccio.posiziona(p.x, p.y);
    combattimento.interrompi();
    stanza.entra();
    stati.set(id, stanza.statoSalvabile());
    eventi.emit('notte.stanza', { da, a: id, lato, tipo: record.tipo });
  }

  /** Slot della stanza `verso` rivolto alla stanza `daId`. */
  function slotDiRitorno(verso, daId) {
    const record = recordDi(verso);
    for (const [slot, id] of Object.entries(record?.porte ?? {})) if (id === daId) return slot;
    return null;
  }

  /**
   * Un passo fisso della notte.
   * @param {number} dt secondi
   */
  function tick(dt) {
    camera.tick();
    if (camera.inTransizione) return;
    if (!stanza) return;
    ferruccio.tick(dt);
    combattimento.tick(dt);
    for (const b of bersagli.slice()) b.tick(dt);
    for (const p of proiettili.slice()) p.tick(dt);
    stanza.tick(dt);
    stati.set(stanza.id, stanza.statoSalvabile());
    const porta = stanza.attraversata();
    if (porta) {
      const da = stanza.id;
      camera.avviaTransizione(porta.lato);
      entra(porta.verso, slotDiRitorno(porta.verso, da) ?? LATO_OPPOSTO[porta.lato], porta.lato);
    }
  }

  /**
   * Strumento di debug: salta alla stanza `id` (al centro). Ritorna false se non esiste.
   * @param {string} id
   */
  function vaiA(id) {
    if (!recordDi(id)) return false;
    entra(id, null, null);
    return true;
  }

  /** Ciò che la notte salva (ADR-0006, storia 016): solo seme, piano e stanza corrente. */
  function salvataggio() {
    return { seme, piano: numeroPiano, stanza: stanza?.id ?? null };
  }

  return {
    get stanza() { return stanza; },
    get pianta() { return pianta; },
    get piano() { return numeroPiano; },
    get seme() { return seme; },
    get inTransizione() { return camera.inTransizione; },
    camera,
    entra,
    tick,
    vaiA,
    salvataggio,
    statoDi: (id) => stati.get(id) ?? null,
    stati: () => Array.from(stati.values()),
  };
}
