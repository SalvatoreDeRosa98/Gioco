/**
 * motore/attori/ia/direttore.js — Direttore degli attacchi della stanza (nemici.md §8.1-8.3).
 *
 * Decide chi può iniziare un attacco: un nemico entra in Anticipo solo se ottiene un **gettone**
 * (`gettoni` per piano), lo tiene da inizio Anticipo a fine Colpo e lo rilascia all'inizio del
 * Recupero (o alla morte, o allo stordimento). La richiesta è negata se un altro impatto
 * programmato cade a meno di `gap_impatti_min` dal proprio, o se gli imparabili programmati sono
 * già `imparabili_max`. Tutto in tick (il chiamante converte i ms una volta con `tempo.ticksDaMs`).
 *
 * Storia 020: `attaccantiMax` è il tetto globale (manopola `nemici.direttore.attaccanti_max`) agli
 * attaccanti contemporanei, qualunque siano i gettoni del piano: gettoni effettivi = min(gettoni, tetto).
 *
 * Storia 019: niente coda con invecchiamento (§8.4) — i nemici riprovano ogni `t_riprova` e il primo
 * che chiede nel tick vince (edge case «due nemici chiedono nello stesso frame»: ordine dei bersagli,
 * quindi deterministico). Si azzera a ogni `stanza.entrata` se riceve il bus.
 * Nessun numero di gioco: i valori arrivano dal chiamante (letti da `nemici.direttore.*`).
 */

/**
 * Crea un direttore.
 * @param {{
 *   gettoni: number, gapTicks: number, imparabiliMax?: number, attaccantiMax?: number,
 *   eventi?: { on: (nome: string, fn: Function) => unknown }
 * }} o
 */
export function creaDirettore({ gettoni: gettoniPiano, gapTicks, imparabiliMax = Infinity, attaccantiMax = Infinity, eventi = null }) {
  if (!Number.isFinite(gettoniPiano) || gettoniPiano < 1) throw new RangeError('creaDirettore: gettoni deve essere ≥ 1');
  if (!(attaccantiMax >= 1)) throw new RangeError('creaDirettore: attaccantiMax deve essere ≥ 1');
  const gettoni = Math.min(gettoniPiano, attaccantiMax);
  /** @type {Map<object, { impatto: number, imparabile: boolean }>} */
  const tenuti = new Map();
  let ora = 0;
  const statistiche = { concessi: 0, negati: 0 };

  /** Azzera gettoni e impatti programmati (nuova stanza, reset). */
  function azzera() {
    tenuti.clear();
    ora = 0;
  }

  /**
   * Avanza l'orologio del direttore di un tick (chiamato una volta per tick dal proprietario).
   */
  function tick() {
    ora += 1;
  }

  /**
   * Un nemico chiede il gettone per un attacco il cui impatto cade tra `traTicks` tick.
   * @param {object} nemico chiave d'identità (la facciata del nemico)
   * @param {{ traTicks: number, imparabile?: boolean }} richiesta
   * @returns {boolean} vero se il gettone è concesso (o già tenuto da questo nemico)
   */
  function richiedi(nemico, { traTicks, imparabile = false }) {
    if (tenuti.has(nemico)) return true;
    const impatto = ora + Math.max(0, traTicks);
    let nega = tenuti.size >= gettoni;
    let imparabili = 0;
    for (const v of tenuti.values()) {
      if (Math.abs(v.impatto - impatto) < gapTicks) nega = true;
      if (v.imparabile) imparabili += 1;
    }
    if (imparabile && imparabili >= imparabiliMax) nega = true;
    if (nega) {
      statistiche.negati += 1;
      return false;
    }
    tenuti.set(nemico, { impatto, imparabile });
    statistiche.concessi += 1;
    return true;
  }

  /**
   * Rilascia il gettone di un nemico (inizio del Recupero, stordimento, morte).
   * @param {object} nemico
   */
  function rilascia(nemico) {
    tenuti.delete(nemico);
  }

  eventi?.on?.('stanza.entrata', () => azzera());

  return {
    get gettoni() { return gettoni; },
    get attaccantiMax() { return attaccantiMax; },
    get occupati() { return tenuti.size; },
    get ora() { return ora; },
    get statistiche() { return { ...statistiche }; },
    /** Impatti programmati (tick assoluti dell'orologio del direttore). */
    impattiProgrammati: () => Array.from(tenuti.values(), (v) => v.impatto),
    tiene: (nemico) => tenuti.has(nemico),
    richiedi,
    rilascia,
    tick,
    azzera,
  };
}
