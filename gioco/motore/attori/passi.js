/**
 * motore/attori/passi.js — Passi delle marionette sul palco (storia P10).
 *
 * Modulo di stato: osserva le posizioni di Ferruccio e degli altri attori a ogni tick e, ogni `lunghezza_px`
 * percorsi (`audio.passi.lunghezza_px` / `lunghezza_nemico_px`), emette `attore.passo` `{ id, tipo, x, y }`: la cadenza
 * segue la velocità. Non sa nulla dell'audio (chi ascolta decide cosa farne); non muta gli attori. Un attore con stato
 * `morto`, o un attore `vivo === false`, non fa passi; una posizione impostata di colpo (teletrasporto, cambio di stanza)
 * non conta: lo spostamento in un tick oltre `salto_max` lunghezze azzera il contatore. Dipendenze: nessuna.
 */

/** Tipi degli attori nel payload. */
export const TIPI_ATTORE = Object.freeze({ ferruccio: 'ferruccio', nemico: 'nemico' });
/** Id di Ferruccio nel payload (nome, non valore di gioco). */
const ID_FERRUCCIO = 'ferruccio';
/** Oltre questo multiplo della lunghezza del passo in un tick si tratta di un salto di posizione, non di un passo. */
const SALTO_MAX = 4;

/**
 * @param {{
 *   eventi: { emit: (nome: string, payload?: unknown) => number },
 *   parametri: { get: (chiave: string) => number },
 *   ferruccio: { x: number, y: number, stato: string },
 *   altri?: () => Array<{ id: string, x: number, y: number, stato?: string, vivo?: boolean }>
 * }} o
 */
export function creaPassi({ eventi, parametri, ferruccio, altri = () => [] }) {
  if (!eventi || typeof eventi.emit !== 'function') throw new TypeError('creaPassi: manca `eventi`');
  if (!parametri || typeof parametri.get !== 'function') throw new TypeError('creaPassi: manca `parametri`');
  if (!ferruccio) throw new TypeError('creaPassi: manca `ferruccio`');
  /** @type {Map<string, { x: number, y: number, acc: number }>} */
  const tracce = new Map();
  let passi = 0;

  function avanza(chiave, attore, lunghezza, tipo) {
    let t = tracce.get(chiave);
    if (!t) {
      t = { x: attore.x, y: attore.y, acc: 0 };
      tracce.set(chiave, t);
      return;
    }
    const d = Math.hypot(attore.x - t.x, attore.y - t.y);
    t.x = attore.x;
    t.y = attore.y;
    if (d > lunghezza * SALTO_MAX) { t.acc = 0; return; }
    t.acc += d;
    while (t.acc >= lunghezza) {
      t.acc -= lunghezza;
      passi += 1;
      eventi.emit('attore.passo', { id: chiave, tipo, x: attore.x, y: attore.y });
    }
  }

  /** Un tick: confronta le posizioni con quelle del tick prima. */
  function tick() {
    const lF = parametri.get('audio.passi.lunghezza_px');
    const lN = parametri.get('audio.passi.lunghezza_nemico_px');
    if (ferruccio.stato === 'morto') tracce.delete(ID_FERRUCCIO);
    else avanza(ID_FERRUCCIO, ferruccio, lF, TIPI_ATTORE.ferruccio);
    const vivi = new Set([ID_FERRUCCIO]);
    for (const a of altri()) {
      if (!a || typeof a.x !== 'number' || typeof a.y !== 'number') continue;
      const chiave = String(a.id ?? '');
      if (!chiave || a.stato === 'morto' || a.vivo === false) continue;
      vivi.add(chiave);
      avanza(chiave, a, lN, TIPI_ATTORE.nemico);
    }
    for (const chiave of tracce.keys()) if (!vivi.has(chiave)) tracce.delete(chiave);
  }

  return {
    tick,
    /** Passi emessi in tutto (debug e test). */
    get passi() { return passi; },
    /** Azzera le tracce (cambio di stanza o di scena). */
    azzera: () => tracce.clear(),
  };
}
