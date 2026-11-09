/**
 * motore/oggetti/piedistallo.js — I piedistalli della bottega (stanza del tesoro): GDD
 * doni-modificatori.md regole 8 e 10, edge case «rientro», «un solo eleggibile», «due entro
 * r_interagisci». Storia 024.
 *
 * Quando si entra in una stanza di tipo `tesoro` (`attiva(stanza)`) la prima volta, si estraggono dal
 * pool `n` doni distinti (1; 2 dal piano `piano_doppio`) e si posano sui punti dati dal modello
 * (`contenuti` di tipo `piedistallo`, altrimenti attorno al centro). Se il pool è vuoto il primo
 * piedistallo ha il SOSTITUTO del pool (cuore o monete); se per il doppio c'è un solo eleggibile, c'è
 * un solo piedistallo. Lo stato per stanza si conserva al rientro (dono preso = piedistallo vuoto, gli
 * altri inerti). `tick()` legge il fronte di `interagisci`: in Fermo, Cammina o Recupero scatto, il
 * piedistallo offerto più vicino entro `r_interagisci` (a pari distanza il più a sinistra) è raccolto
 * NELLO STESSO FRAME: `modificatori.aggiungiDono`, gli altri diventano inerti, il pool lo toglie.
 * `anteprima()` è il dono offerto entro `r_anteprima` (il cono di luce), per il cartiglio in anteprima.
 * Eventi: `piedistallo.posato` {stanza, piedistalli}, `piedistallo.raccolto` {stanza, indice, id, x, y,
 * fallback, alMassimo}. `alMassimo` è vero se nessuna statistica toccata dal dono è cambiata (knob
 * `avviso_cap`). Nessun numero e nessuna stringa di gioco. Dipendenze: pool, modificatori, economia.
 */

/** Stati di un piedistallo. */
export const STATI_PIEDISTALLO = Object.freeze(['offerto', 'preso', 'inerte']);
/** Stati del corpo in cui la raccolta è ammessa (GDD regola 10). */
export const STATI_RACCOLTA = Object.freeze(['fermo', 'cammina', 'recupero_scatto']);
/** Tipo di contenuto del modello che segna un piedistallo. */
export const CONTENUTO_PIEDISTALLO = 'piedistallo';

/**
 * Punti dei piedistalli in una stanza montata: i contenuti `piedistallo` del modello (da sinistra);
 * se non bastano, attorno al primo (o al centro) distanziati di una cella in orizzontale.
 * @param {{ contenuti?: object[], cella: number, origine: { x: number, y: number }, geo: { colonne: number, righe: number } }} stanza
 * @param {number} n
 * @returns {{ x: number, y: number }[]}
 */
export function puntiPiedistallo(stanza, n) {
  const segnati = (stanza.contenuti ?? []).filter((c) => c.tipo === CONTENUTO_PIEDISTALLO && typeof c.x === 'number').sort((a, b) => a.x - b.x || a.y - b.y);
  if (segnati.length >= n) return segnati.slice(0, n).map((c) => ({ x: c.x, y: c.y }));
  const centro = segnati[0] ?? { x: stanza.origine.x + (stanza.geo.colonne * stanza.cella) / 2, y: stanza.origine.y + (stanza.geo.righe * stanza.cella) / 2 };
  const punti = [];
  for (let i = 0; i < n; i++) punti.push({ x: centro.x + (i - (n - 1) / 2) * stanza.cella, y: centro.y });
  return punti;
}

/**
 * @param {{
 *   pool: ReturnType<import('./pool.js').creaPool>,
 *   modificatori: { aggiungiDono: Function, valore: Function, dono: Function },
 *   parametri: { get: (chiave: string) => any },
 *   piano: number,
 *   ferruccio?: { x: number, y: number, stato: string, maschere: number, impostaMaschere: Function } | null,
 *   input?: { premuto: (azione: string) => boolean } | null,
 *   economia?: { aggiungiMonete: Function } | null,
 *   eventi?: { emit: Function } | null,
 *   log?: { error: Function }
 * }} o
 */
export function creaPiedistalli({ pool, modificatori, parametri, piano, ferruccio = null, input = null, economia = null, eventi = null, log = console, acquisisci = null }) {
  if (!pool || !modificatori || !parametri || !Number.isInteger(piano)) throw new TypeError('creaPiedistalli: pool, modificatori, parametri e piano obbligatori');
  const tab = parametri.get('doni').piedistallo;
  if (!tab) throw new RangeError('creaPiedistalli: manca doni.piedistallo nei parametri');
  const P = (k) => tab[k].base;
  const rInteragisci = () => parametri.get('economia.r_interagisci');
  const maschereMax = () => modificatori.valore('ferruccio.maschere_max');

  /** @type {Map<string, object[]>} stanza → piedistalli */
  const perStanza = new Map();
  let pianoCorrente = piano;
  let stanzaId = null;
  let attivo = false;

  /** Genera i piedistalli della stanza (una volta per stanza). */
  function genera(stanza) {
    const n = pianoCorrente >= P('piano_doppio') ? 2 : 1;
    const punti = puntiPiedistallo(stanza, n);
    const lista = [];
    for (let i = 0; i < n; i++) {
      const dono = pool.estrai({ piano: pianoCorrente, canale: 'piedistallo' });
      if (dono) {
        lista.push({ indice: lista.length, id: dono.id, x: punti[i].x, y: punti[i].y, stato: 'offerto', fallback: null });
      } else if (i === 0) {
        const f = pool.fallback({ maschere: ferruccio?.maschere ?? 0, maschereMax: maschereMax() });
        lista.push({ indice: 0, id: null, x: punti[0].x, y: punti[0].y, stato: 'offerto', fallback: f });
      }
      // un solo eleggibile per il doppio: un solo piedistallo, non uno inerte (edge case del GDD)
    }
    perStanza.set(stanza.id, lista);
    eventi?.emit('piedistallo.posato', { stanza: stanza.id, piedistalli: lista.map((p) => ({ ...p })) });
    return lista;
  }

  /**
   * Entra nella stanza del tesoro: genera i piedistalli alla prima visita, altrimenti li ritrova.
   * @param {{ id: string, contenuti?: object[], cella: number, origine: object, geo: object }} stanza
   */
  function attiva(stanza) {
    stanzaId = stanza.id;
    attivo = true;
    if (!perStanza.has(stanza.id)) genera(stanza);
  }

  /** Esce dalla stanza del tesoro. */
  function disattiva() {
    attivo = false;
    stanzaId = null;
  }

  const correnti = () => (stanzaId ? perStanza.get(stanzaId) ?? [] : []);

  /** Copie dei piedistalli della stanza corrente, con `dono` (riga del catalogo) e `distanza`. */
  function elenco() {
    return correnti().map((p) => ({
      ...p, fallback: p.fallback ? { ...p.fallback } : null, dono: p.id ? modificatori.dono(p.id) : null,
      distanza: ferruccio ? Math.hypot(p.x - ferruccio.x, p.y - ferruccio.y) : Infinity,
    }));
  }

  /**
   * Indice del piedistallo offerto più vicino entro `r` (a pari distanza il più a sinistra), o −1.
   * @param {number} r
   */
  function vicino(r) {
    if (!ferruccio) return -1;
    let migliore = -1;
    let dMin = Infinity;
    let xMin = Infinity;
    for (const p of correnti()) {
      if (p.stato !== 'offerto') continue;
      const d = Math.hypot(p.x - ferruccio.x, p.y - ferruccio.y);
      if (d > r) continue;
      if (d < dMin || (d === dMin && p.x < xMin)) { dMin = d; xMin = p.x; migliore = p.indice; }
    }
    return migliore;
  }

  /** Il piedistallo offerto nel cono di luce (`r_anteprima`), o null. */
  function anteprima() {
    if (!attivo) return null;
    const i = vicino(P('r_anteprima'));
    return i >= 0 ? elenco()[i] : null;
  }

  /**
   * Raccoglie il piedistallo `i` della stanza corrente: dono nella lista nello stesso frame, gli altri
   * inerti, pool aggiornato.
   * @param {number} i
   * @returns {{ esito: 'raccolto' | 'rifiutato', motivo?: string, id?: string | null, alMassimo?: boolean }}
   */
  function raccogli(i) {
    const lista = correnti();
    const p = lista[i];
    if (!p) return { esito: 'rifiutato', motivo: 'indice' };
    if (p.stato !== 'offerto') return { esito: 'rifiutato', motivo: p.stato };
    let alMassimo = false;
    if (p.id) {
      const dono = modificatori.dono(p.id);
      const toccate = (dono?.modificatori ?? []).map((m) => m.statistica);
      const prima = toccate.map((st) => modificatori.valore(st));
      // storia P09: con i cinque slot (`acquisisci`) a slot pieni il dono resta PENDENTE sul piedistallo finché il modale
      // decide; il dono sostituito torna qui (regola del Teatro)
      if (typeof acquisisci === 'function') {
        const esitoSlot = acquisisci(p.id, {
          origine: 'piedistallo',
          suConferma: () => { pool.raccolto(p.id); },
          restituisci: (idVecchio) => { p.id = idVecchio; p.stato = 'offerto'; for (const altro of lista) if (altro !== p && altro.stato === 'inerte') altro.stato = 'offerto'; },
        });
        if (esitoSlot === 'pendente') return { esito: 'pendente', id: p.id };
        if (!esitoSlot) return { esito: 'rifiutato', motivo: 'dono' };
      } else if (!modificatori.aggiungiDono(p.id)) {
        log?.error?.(`[piedistallo] il dono '${p.id}' non si è attivato`);
        return { esito: 'rifiutato', motivo: 'dono' };
      }
      alMassimo = P('avviso_cap') > 0 && toccate.length > 0 && toccate.every((st, k) => modificatori.valore(st) === prima[k]);
      if (typeof acquisisci !== 'function') pool.raccolto(p.id);
    } else if (p.fallback?.tipo === 'cuore') {
      ferruccio?.impostaMaschere(Math.min(maschereMax(), ferruccio.maschere + p.fallback.valore));
    } else if (p.fallback?.tipo === 'monete') {
      economia?.aggiungiMonete(p.fallback.valore, 'piedistallo');
    }
    p.stato = 'preso';
    for (const altro of lista) if (altro !== p && altro.stato === 'offerto') altro.stato = 'inerte';
    eventi?.emit('piedistallo.raccolto', { stanza: stanzaId, indice: i, id: p.id, x: p.x, y: p.y, fallback: p.fallback ? { ...p.fallback } : null, alMassimo });
    return { esito: 'raccolto', id: p.id, alMassimo };
  }

  /** Un tick: con la stanza del tesoro attiva, `interagisci` raccoglie il piedistallo vicino. */
  function tick() {
    if (!attivo || !input || !ferruccio) return;
    if (!STATI_RACCOLTA.includes(ferruccio.stato)) return;
    if (input.premuto('interagisci')) {
      const i = vicino(rInteragisci());
      if (i >= 0) raccogli(i);
    }
  }

  return {
    get attivo() { return attivo; },
    get stanza() { return stanzaId; },
    get piano() { return pianoCorrente; },
    impostaPiano: (nuovoPiano) => { pianoCorrente = nuovoPiano; perStanza.clear(); stanzaId = null; attivo = false; },
    attiva,
    disattiva,
    elenco,
    vicino,
    anteprima,
    raccogli,
    tick,
    rAnteprima: () => P('r_anteprima'),
    /** Stato per stanza (per il salvataggio futuro): { stanza: [{indice, id, stato, fallback}] }. */
    stati: () => Object.fromEntries(Array.from(perStanza, ([id, l]) => [id, l.map((p) => ({ indice: p.indice, id: p.id, stato: p.stato, fallback: p.fallback }))])),
  };
}
