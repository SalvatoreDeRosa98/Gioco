/**
 * motore/oggetti/banchetto.js — Il banchetto di Tonino: tre slot a prezzo fisso (Feature, GDD
 * economia.md regola 5). Storia 025.
 *
 * Uno per piano. Gli slot (un dono, un cuore, un consumabile) sono generati alla creazione con il
 * generatore derivato `banchetto` dal seme della notte e CONSERVATI se si esce e si rientra: uno slot
 * comprato resta vuoto, gli altri uguali. Il prezzo viene dalla formula intera di `economia.js`
 * (`economia.prezzoDi`). L'acquisto (`compra(i)`) è atomico: monete ≥ prezzo → si scalano,
 * l'oggetto è applicato nello stesso frame (dono → `modificatori.aggiungiDono`; cuore → +1 maschera;
 * consumabile → `economia.applicaConsumabile`), lo slot si svuota. Altrimenti è rifiutato con un motivo
 * (`monete`, `maschere_piene`, `vuoto`, `slot`) e nessun accodamento.
 *
 * `tick()` legge il fronte di `interagisci` e compra lo slot più vicino entro `r_interagisci` quando il
 * banchetto è `attivo` (la stanza corrente è del tipo giusto). Le posizioni degli slot le dà chi
 * monta la stanza (`posiziona(punti)`): celle del banco del modello o il punto di Tonino.
 * Eventi: `banchetto.acquisto` {slot, tipo, id, prezzo, monete}, `banchetto.rifiutato` {slot, motivo, prezzo}.
 * Nessun numero e nessuna stringa di gioco (i nomi li mette l'interfaccia).
 */

import { estraiDono, pesiRarita, RARITA_VENDIBILI } from './economia.js';

/** Tipi degli slot, nell'ordine del GDD. */
export const TIPI_SLOT = Object.freeze(['dono', 'cuore', 'consumabile']);

/** Motivi di rifiuto. */
export const MOTIVI_RIFIUTO = Object.freeze(['monete', 'maschere_piene', 'vuoto', 'slot']);

/**
 * @param {{
 *   economia: ReturnType<import('./economia.js').creaEconomia>,
 *   modificatori: { valore: Function, aggiungiDono: Function, doniAttivi: () => string[] },
 *   parametri: { get: (chiave: string) => any },
 *   catalogo: object[],                    doni.json → doni
 *   consumabili: object[],                 consumabili.json → consumabili
 *   rng: () => number,                     generatore derivato 'banchetto'
 *   piano: number,
 *   ferruccio?: { x: number, y: number, maschere: number, impostaMaschere: Function } | null,
 *   input?: { premuto: (azione: string) => boolean } | null,
 *   eventi?: { emit: Function } | null,
 *   esclusi?: Iterable<string>,            doni già offerti nel piano (piedistallo), senza pool
 *   pool?: { estrai: Function } | null,    storia 024: il pool della notte (canale 'banchetto'); se c'è, sostituisce estraiDono
 *   log?: { error: Function }
 * }} o
 */
export function creaBanchetto({
  economia, modificatori, parametri, catalogo, consumabili, rng, piano, ferruccio = null, input = null, eventi = null, esclusi = [], pool = null, log = console,
}) {
  if (!economia || !modificatori || !parametri || !Array.isArray(catalogo) || !Array.isArray(consumabili) || typeof rng !== 'function') {
    throw new TypeError('creaBanchetto: dipendenze mancanti');
  }
  const E = (k) => parametri.get(`economia.${k}`);
  const maschereMax = () => modificatori.valore('ferruccio.maschere_max');

  // --- generazione degli slot (una volta, dal seme) ---
  const pesi = pesiRarita({
    pesi: Object.fromEntries(RARITA_VENDIBILI.map((r) => [r, E(`banchetto.peso_rarita.${r}`)])),
    derivePct: Object.fromEntries(RARITA_VENDIBILI.map((r) => [r, E(`banchetto.deriva_rarita_pct.${r}`)])),
    piano,
  });
  const fuori = new Set([...esclusi, ...modificatori.doniAttivi()]);
  const dono = pool ? pool.estrai({ piano, canale: 'banchetto' }) : estraiDono({ catalogo, piano, esclusi: fuori, rng, pesi });
  const consumabile = consumabili.length > 0 ? consumabili[Math.min(consumabili.length - 1, Math.floor(rng() * consumabili.length))] : null;

  /** @type {object[]} */
  const slots = [
    dono
      ? { indice: 0, tipo: 'dono', id: dono.id, rarita: dono.rarita, prezzo: economia.prezzoDi({ tipo: 'dono', rarita: dono.rarita, piano }), comprato: false, fallback: false }
      // pool vuoto (edge case): lo slot non resta mai vuoto → un cuore al prezzo di un comune
      : { indice: 0, tipo: 'cuore', id: null, rarita: 'comune', prezzo: economia.prezzoDi({ tipo: 'dono', rarita: 'comune', piano }), comprato: false, fallback: true },
    { indice: 1, tipo: 'cuore', id: null, rarita: null, prezzo: economia.prezzoDi({ tipo: 'cuore', piano }), comprato: false, fallback: false },
    consumabile
      ? { indice: 2, tipo: 'consumabile', id: consumabile.id, rarita: null, prezzo: economia.prezzoDi({ tipo: 'consumabile', piano }), comprato: false, fallback: false }
      : { indice: 2, tipo: 'cuore', id: null, rarita: null, prezzo: economia.prezzoDi({ tipo: 'consumabile', piano }), comprato: false, fallback: true },
  ];
  /** @type {{ x: number, y: number }[]} */
  let posizioni = [];
  let attivo = false;
  let ultimoEsito = null;

  /** Vero se Ferruccio può pagare e ricevere lo slot ora (per l'interfaccia: prezzo barrato se falso). */
  function accessibile(slot) {
    if (slot.comprato) return false;
    if (economia.monete < slot.prezzo) return false;
    if (slot.tipo === 'cuore' && ferruccio && ferruccio.maschere >= maschereMax()) return false;
    return true;
  }

  /** Copia degli slot con `accessibile`. */
  function elenco() {
    return slots.map((sl) => ({ ...sl, accessibile: accessibile(sl), posizione: posizioni[sl.indice] ? { ...posizioni[sl.indice] } : null }));
  }

  /**
   * Compra lo slot `i`.
   * @param {number} i
   * @returns {{ esito: 'comprato'|'rifiutato', motivo?: string, slot: number, prezzo?: number }}
   */
  function compra(i) {
    const slot = slots[i];
    const rifiuta = (motivo) => {
      ultimoEsito = { esito: 'rifiutato', motivo, slot: i, prezzo: slot?.prezzo };
      eventi?.emit('banchetto.rifiutato', { slot: i, motivo, prezzo: slot?.prezzo ?? null, monete: economia.monete });
      return ultimoEsito;
    };
    if (!slot) return rifiuta('slot');
    if (slot.comprato) return rifiuta('vuoto');
    if (slot.tipo === 'cuore' && ferruccio && ferruccio.maschere >= maschereMax()) return rifiuta('maschere_piene');
    if (economia.monete < slot.prezzo) return rifiuta('monete');
    if (!economia.togliMonete(slot.prezzo, 'banchetto')) return rifiuta('monete');
    // applicazione nello stesso frame
    if (slot.tipo === 'dono') {
      if (!modificatori.aggiungiDono(slot.id)) log?.error?.(`[banchetto] il dono '${slot.id}' non si è attivato`);
    } else if (slot.tipo === 'cuore') {
      ferruccio?.impostaMaschere(ferruccio.maschere + 1);
    } else if (slot.tipo === 'consumabile') {
      const def = consumabili.find((c) => c.id === slot.id);
      if (def) economia.applicaConsumabile(def);
    }
    slot.comprato = true;
    ultimoEsito = { esito: 'comprato', slot: i, prezzo: slot.prezzo, tipo: slot.tipo, id: slot.id };
    eventi?.emit('banchetto.acquisto', { slot: i, tipo: slot.tipo, id: slot.id, prezzo: slot.prezzo, monete: economia.monete });
    return ultimoEsito;
  }

  /** Indice dello slot più vicino a Ferruccio entro `r_interagisci`, o −1. */
  function vicino() {
    if (!ferruccio) return -1;
    const r = E('r_interagisci');
    let migliore = -1;
    let dMin = Infinity;
    posizioni.forEach((p, i) => {
      if (!p) return;
      const d = Math.hypot(p.x - ferruccio.x, p.y - ferruccio.y);
      if (d <= r && d < dMin) { dMin = d; migliore = i; }
    });
    return migliore;
  }

  /** Un tick: con il banchetto attivo, `interagisci` compra lo slot vicino. */
  function tick() {
    if (!attivo || !input) return;
    if (!input.premuto('interagisci')) return;
    const i = vicino();
    if (i >= 0) compra(i);
  }

  return {
    get piano() { return piano; },
    get attivo() { return attivo; },
    get ultimoEsito() { return ultimoEsito; },
    slots: elenco,
    compra,
    vicino,
    tick,
    /** Posizioni (x, y) degli slot nella stanza, nell'ordine degli slot. */
    posiziona: (punti) => { posizioni = (punti ?? []).slice(0, slots.length).map((p) => ({ x: p.x, y: p.y })); },
    posizioni: () => posizioni.map((p) => ({ ...p })),
    /** Attiva/disattiva (si entra/esce dalla stanza del banchetto). */
    attiva: (v) => { attivo = Boolean(v); if (!attivo) ultimoEsito = null; },
    /** Azzera l'ultimo esito (l'interfaccia lo ha mostrato). */
    dimenticaEsito: () => { ultimoEsito = null; },
  };
}

/**
 * Punti degli slot dentro una stanza montata: i centri delle celle `banco` del modello (da sinistra),
 * altrimenti attorno al contenuto `tonino`, altrimenti il centro.
 * @param {{ ostacoli: object[], contenuti: object[], cella: number, origine: { x: number, y: number }, geo: { colonne: number, righe: number } }} stanza
 * @param {number} n numero di slot
 * @returns {{ x: number, y: number }[]}
 */
export function puntiSlot(stanza, n) {
  const banchi = (stanza.ostacoli ?? []).filter((o) => o.id === 'banco').sort((a, b) => a.x - b.x || a.y - b.y);
  if (banchi.length >= n) {
    // i banchi sono solidi: lo slot sta sulla cella davanti (sotto) al banco
    return banchi.slice(0, n).map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h + stanza.cella / 2 }));
  }
  const tonino = (stanza.contenuti ?? []).find((c) => c.tipo === 'tonino');
  const centro = tonino ?? { x: stanza.origine.x + (stanza.geo.colonne * stanza.cella) / 2, y: stanza.origine.y + (stanza.geo.righe * stanza.cella) / 2 };
  const punti = [];
  for (let i = 0; i < n; i++) punti.push({ x: centro.x + (i - (n - 1) / 2) * stanza.cella, y: centro.y + stanza.cella });
  return punti;
}
