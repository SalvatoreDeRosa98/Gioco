/**
 * motore/oggetti/attivi.js — L'oggetto attivo (tasto `attivo`, Q) a ricarica per stanza. Storia P04/P09 (Teatro
 * OGGETTI_ATTIVI ~2381, usaOggettoAttivo ~2760, verificaStanzaPulita ~3682).
 *
 * Regole del Teatro, numeri da `oggetti-attivi.json`:
 *  - un solo attivo per volta (`equipaggia(id)`: quello iniziale viene dal personaggio), parte CARICO;
 *  - `maxCarica` tacche; a ogni `stanza.pulita` combattuta +`regole.carica_per_stanza`; si usa solo a carica piena e
 *    la carica torna a zero;
 *  - `forbici`: tutti i nemici vivi stordiati per `stordisce_ms` e feriti di DMG × `forbici_frazione_dmg` (minimo `danno`);
 *  - `tamburello`: i proiettili nemici spariscono, i nemici entro `raggio` subiscono DMG × `tamburello_frazione_dmg` e
 *    una spinta radiale di `spinta` px/s;
 *  - `ampolla`: +`cura` maschere intere (tetto `ferruccio.maschere_max`).
 * Eventi: `attivo.equipaggiato` {id}, `attivo.carica` {id, carica, max}, `attivo.usato` {id, effetto, colpiti},
 * `attivo.scarico` {id, carica, max} (Q premuto senza carica). Il DMG è quello delle statistiche alla Isaac
 * (`statistiche()`), altrimenti `combattimento.danno` dei modificatori. Nessun numero e nessuna stringa di gioco qui;
 * nessuna casualità. Dipendenze: solo verso il basso (modificatori, ferruccio, bersagli, proiettili).
 */

/** Effetti conosciuti (chiave `effetto` di oggetti-attivi.json). */
export const EFFETTI_ATTIVO = Object.freeze(['forbici', 'tamburello', 'ampolla']);

const base = (v) => (v && typeof v === 'object' && 'base' in v ? v.base : v);

/**
 * @param {{
 *   tabella: { attivi: Record<string, object>, regole?: object },   oggetti-attivi.json
 *   eventi: { on: Function, emit: Function },
 *   ferruccio: { maschere: number, impostaMaschere: Function, x: number, y: number },
 *   modificatori: { valore: (nome: string) => number },
 *   bersagli: () => object[],
 *   proiettili?: object[] | null,                                    i proiettili nemici (lista condivisa, svuotata dal tamburello)
 *   input?: { premuto: (azione: string) => boolean } | null,
 *   statistiche?: (() => ({ dmg: number } | null)) | null,
 *   azione?: string                                                   nome dell'azione (default 'attivo')
 * }} o
 */
export function creaAttivi({ tabella, eventi, ferruccio, modificatori, bersagli, proiettili = null, input = null, statistiche = null, azione = 'attivo' }) {
  if (!tabella?.attivi || !eventi || !ferruccio || !modificatori || typeof bersagli !== 'function') throw new TypeError('creaAttivi: dipendenze mancanti');
  const regole = tabella.regole ?? {};
  const R = (k) => base(regole[k]) ?? 1;
  let attivo = null;
  let carica = 0;
  let ultimoUso = null;

  const dmg = () => {
    const st = typeof statistiche === 'function' ? statistiche() : null;
    return st?.dmg ?? modificatori.valore('combattimento.danno');
  };
  const maschereMax = () => modificatori.valore('ferruccio.maschere_max');
  const vivi = () => bersagli().filter((b) => b && b.stato !== 'morto' && (b.vita ?? 1) > 0);

  /** Equipaggia l'attivo `id` (carico). Falso se sconosciuto. */
  function equipaggia(id) {
    const def = id ? tabella.attivi[id] : null;
    if (!def) { attivo = null; carica = 0; return false; }
    attivo = def;
    carica = def.maxCarica;
    eventi.emit('attivo.equipaggiato', { id: def.id, carica, max: def.maxCarica });
    return true;
  }

  function ricarica(n) {
    if (!attivo) return;
    const prima = carica;
    carica = Math.min(attivo.maxCarica, carica + n);
    if (carica !== prima) eventi.emit('attivo.carica', { id: attivo.id, carica, max: attivo.maxCarica });
  }

  function effettoForbici(def) {
    let colpiti = 0;
    const danno = Math.max(base(def.danno) ?? 0, dmg() * R('forbici_frazione_dmg'));
    for (const b of vivi()) {
      if (typeof b.stordisci === 'function') b.stordisci(base(def.stordisce_ms));
      if (typeof b.colpisci === 'function') b.colpisci(danno, null);
      colpiti += 1;
    }
    return colpiti;
  }

  function effettoTamburello(def) {
    let colpiti = 0;
    if (Array.isArray(proiettili)) proiettili.length = 0;
    const raggio = base(def.raggio);
    const spinta = base(def.spinta);
    const danno = dmg() * R('tamburello_frazione_dmg');
    const ms = modificatori.valore('combattimento.t_spinta_nemico');
    for (const b of vivi()) {
      const dx = b.x - ferruccio.x;
      const dy = b.y - ferruccio.y;
      const d = Math.hypot(dx, dy);
      if (d > raggio) continue;
      const nx = d > 0 ? dx / d : 1;
      const ny = d > 0 ? dy / d : 0;
      if (typeof b.colpisci === 'function') b.colpisci(danno, { x: nx * spinta, y: ny * spinta, ms });
      colpiti += 1;
    }
    return colpiti;
  }

  function effettoAmpolla(def) {
    const prima = ferruccio.maschere;
    ferruccio.impostaMaschere(Math.min(maschereMax(), ferruccio.maschere + base(def.cura)));
    return ferruccio.maschere - prima;
  }

  /**
   * Usa l'attivo se è carico. Ritorna l'esito.
   * @returns {{ esito: 'usato' | 'scarico' | 'nessuno', id?: string, colpiti?: number }}
   */
  function usa() {
    if (!attivo) return { esito: 'nessuno' };
    if (carica < attivo.maxCarica) {
      eventi.emit('attivo.scarico', { id: attivo.id, carica, max: attivo.maxCarica });
      return { esito: 'scarico', id: attivo.id };
    }
    const effetto = attivo.effetto;
    const colpiti = effetto === 'forbici' ? effettoForbici(attivo)
      : effetto === 'tamburello' ? effettoTamburello(attivo)
        : effetto === 'ampolla' ? effettoAmpolla(attivo) : 0;
    carica = 0;
    ultimoUso = { id: attivo.id, effetto, colpiti };
    eventi.emit('attivo.usato', { id: attivo.id, effetto, colpiti, x: ferruccio.x, y: ferruccio.y });
    eventi.emit('attivo.carica', { id: attivo.id, carica, max: attivo.maxCarica });
    return { esito: 'usato', id: attivo.id, colpiti };
  }

  eventi.on('stanza.pulita', (p) => { if (p?.combattuta) ricarica(R('carica_per_stanza')); });

  return {
    equipaggia,
    usa,
    ricarica,
    /** Un tick: il fronte dell'azione `attivo` usa l'oggetto. */
    tick() { if (input && input.premuto(azione)) usa(); },
    get id() { return attivo?.id ?? null; },
    get carica() { return carica; },
    get maxCarica() { return attivo?.maxCarica ?? 0; },
    get carico() { return Boolean(attivo) && carica >= attivo.maxCarica; },
    get ultimoUso() { return ultimoUso; },
    /** Nuova run: l'attivo torna carico. */
    nuovaRun() { if (attivo) { carica = attivo.maxCarica; eventi.emit('attivo.carica', { id: attivo.id, carica, max: attivo.maxCarica }); } },
    /** Stato per HUD e test. */
    stato() { return attivo ? { id: attivo.id, nome: attivo.nome, descrizione: attivo.descrizione, carica, maxCarica: attivo.maxCarica, carico: carica >= attivo.maxCarica } : null; },
  };
}
