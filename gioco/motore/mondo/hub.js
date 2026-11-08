/**
 * motore/mondo/hub.js — L'hub di Piazza Dante tra le notti come stanza SPECIALE (storia 029).
 *
 * GDD incontri-dialoghi.md regola 7, stato-narrativo.md (stato "Hub"), art bible Principio C (il
 * diorama ricorda). Monta il modello `contenuti/modelli-stanza/hub/<id>.json` nel campo condiviso
 * (stessa legenda della griglia dei modelli del piano, `mondo/modelli.js`), senza porte di stanza né
 * nascite di nemici: le mura corrono tutt'attorno tranne lo slot dell'`ingresso`, la porta speciale
 * verso il piano. Le `presenze` del modello (Tonino al banchetto, la porta della bottega di Gaetano,
 * la finestra accesa di Mariella, Taddeo, Agnese sotto il portico, la luna, i fili d'oro) sono risolte
 * a ogni lettura contro lo stato narrativo: `quando` con la sintassi delle scene (`storia/condizioni.js`)
 * decide chi c'è, `aperta_se` se una porta è aperta. Il modulo non conosce nomi di flag, di NPC o di
 * scene: li legge dal modello e dallo stato.
 *
 * - `entra()`: posiziona Ferruccio sulla cella di `arrivo`, emette `hub.entrata` {notte} e fa partire
 *   le scene `automatiche` del modello la cui condizione è vera (notte 1: risveglio, tutorial, targa).
 * - `tick(dt)`: fa camminare Ferruccio (fermo mentre un dialogo è aperto: nell'hub non c'è la pausa
 *   logica del ciclo); `interagisci` vicino a un NPC presente (entro `incontri.r_interazione`, il più
 *   vicino vince) apre il suo ancoraggio negli incontri (mai "porte chiuse": nell'hub non ci sono nemici);
 *   quando il corpo di Ferruccio tocca la cella dell'ingresso emette UNA volta `hub.partenza`
 *   {piano, seme, notte}: il seme della notte è derivato dal seme del profilo e dal numero della notte
 *   (`rng.derivato`), quindi cambia a ogni notte ed è uguale a parità di profilo; `notte` NON cambia
 *   qui (cresce alla morte, storia 030).
 * - `presenze()`: le presenze risolte con `presente`, `stato` (porte) e coordinate di scena, per il
 *   renderer e per i test. `vicino()`: l'NPC interagibile più vicino, o null.
 * Eventi verso l'alto: `hub.entrata`, `hub.partenza`, `hub.interazione`. Nessun numero e nessuna
 * stringa di gioco: geometria dal modello e dai parametri (`stanza.*`), raggio da `incontri.r_interazione`.
 * Dipendenze: `mondo/fisica.js`, `mondo/modelli.js`, `mondo/stanza.js` (mura), `fondazione/rng.js`,
 * `storia/condizioni.js`; `narrativa`, `incontri`, `ferruccio`, `input`, `eventi` iniettati.
 */

import { creaCampo, cerchioInRettangolo } from './fisica.js';
import { analizzaGriglia, geometriaStanza } from './modelli.js';
import { costruisciMura } from './stanza.js';
import { creaRng, derivato } from '../fondazione/rng.js';
import { valuta } from '../storia/condizioni.js';

/** Tipo del modello dell'hub (non è uno dei sette tipi di stanza del piano). */
export const TIPO_HUB = 'hub';

/** Tipi di presenza ammessi nel modello. */
export const TIPI_PRESENZA = Object.freeze(['npc', 'porta', 'finestra', 'scenografia']);

/** Stati della porta della bottega (etichette di stato, non testo di gioco). */
export const STATI_PORTA_HUB = Object.freeze({ chiusa: 'chiusa', aperta: 'aperta' });

/** Id del solido dell'ingresso nel campo (per il renderer diagnostico). */
export const ID_INGRESSO = 'ingresso';

/** Prefisso dell'etichetta con cui il seme della notte è derivato dal seme del profilo. */
const ETICHETTA_NOTTE = 'notte#';

/**
 * Seme della notte `notte` per un profilo con seme `semeProfilo` (puro, deterministico).
 * @param {number} semeProfilo
 * @param {number} notte
 * @returns {number} intero a 32 bit senza segno, diverso da `semeProfilo` salvo collisione dell'hash
 */
export function semeNotte(semeProfilo, notte) {
  return derivato(creaRng(semeProfilo), `${ETICHETTA_NOTTE}${notte}`).seme;
}

/**
 * Valida il modello dell'hub. Restituisce gli errori di contenuto (vuoto se valido).
 * @param {object} modello
 * @param {{ colonne: number, righe: number }} regole griglia della stanza 1x1
 * @returns {string[]}
 */
export function validaModelloHub(modello, { colonne, righe }) {
  const errori = [];
  const id = modello?.id ?? '?';
  if (!modello || typeof modello !== 'object') return [`hub: modello assente`];
  if (modello.tipo !== TIPO_HUB) errori.push(`${id}: tipo '${modello.tipo}' (atteso '${TIPO_HUB}')`);
  const geo = geometriaStanza({ dim: modello.dim, colonne, righe });
  const griglia = Array.isArray(modello.griglia) ? modello.griglia : [];
  if (griglia.length !== geo.righe || griglia.some((r) => String(r).length !== geo.colonne)) errori.push(`${id}: griglia non ${geo.colonne}×${geo.righe}`);
  errori.push(...analizzaGriglia(modello).errori);
  if (!modello.ingresso || !geo.slots[modello.ingresso.slot]) errori.push(`${id}: ingresso senza slot valido`);
  if (!Number.isInteger(modello.ingresso?.piano) || modello.ingresso.piano < 1) errori.push(`${id}: ingresso.piano non valido`);
  if (!modello.arrivo || !Number.isFinite(modello.arrivo.c) || !Number.isFinite(modello.arrivo.r)) errori.push(`${id}: arrivo mancante`);
  const visti = new Set();
  for (const p of modello.presenze ?? []) {
    if (!p?.id || visti.has(p.id)) errori.push(`${id}: presenza senza id o duplicata ('${p?.id}')`);
    visti.add(p?.id);
    if (!TIPI_PRESENZA.includes(p?.tipo)) errori.push(`${id}: presenza '${p?.id}' di tipo sconosciuto '${p?.tipo}'`);
    if (p?.tipo === 'npc' && typeof p.ancoraggio !== 'string') errori.push(`${id}: npc '${p.id}' senza ancoraggio`);
    if (!Number.isFinite(p?.c) || !Number.isFinite(p?.r)) errori.push(`${id}: presenza '${p?.id}' senza cella`);
  }
  for (const a of modello.automatiche ?? []) if (typeof a?.ancoraggio !== 'string') errori.push(`${id}: automatica senza ancoraggio`);
  return errori;
}

/**
 * Crea l'hub.
 * @param {{
 *   modello: object,                       contenuti/modelli-stanza/hub/<id>.json
 *   parametri: { get: (chiave: string) => any },
 *   eventi: { emit: Function },
 *   campo: object,                         campo condiviso, sostituito in loco (come stanza.js)
 *   scena: { larghezza: number, altezza: number },
 *   ferruccio: { x: number, y: number, r: number, tick: Function, posiziona: Function },
 *   input: { premuto: (azione: string) => boolean },
 *   narrativa: ReturnType<import('../storia/stato-narrativo.js').crea>,
 *   incontri: ReturnType<import('../storia/incontri.js').creaIncontri>,
 *   semeProfilo: number,                   seme del profilo (URL o orologio): da qui derivano i semi delle notti
 *   campoNotte: string,                    nome del campo di avanzamento che conta la notte (narrativa.json › piani)
 *   azioneInteragisci?: string,            azione del contratto di input (default 'interagisci')
 *   log?: { error: Function }
 * }} o
 */
export function creaHub({
  modello, parametri, eventi, campo, scena, ferruccio, input, narrativa, incontri, semeProfilo, campoNotte, azioneInteragisci = 'interagisci', log = console,
}) {
  if (!modello || !parametri || !eventi || !campo || !scena || !ferruccio || !input || !narrativa || !incontri) throw new TypeError('creaHub: dipendenze mancanti');
  if (!Number.isFinite(semeProfilo)) throw new TypeError('creaHub: manca `semeProfilo`');
  if (typeof campoNotte !== 'string') throw new TypeError('creaHub: manca `campoNotte`');
  const errore = (m) => log?.error?.(`[hub] errore di contenuto: ${m}`);
  const colonne = parametri.get('stanza.colonne');
  const righe = parametri.get('stanza.righe');
  const cella = parametri.get('stanza.cella');
  const errori = validaModelloHub(modello, { colonne, righe });
  for (const e of errori) errore(e);
  const schema = narrativa.schema();

  // ---- geometria: campo centrato, mura attorno all'apertura dell'ingresso -----------------------
  const geo = geometriaStanza({ dim: modello.dim, colonne, righe });
  const analisi = analizzaGriglia(modello);
  const base = creaCampo({
    colonne: geo.colonne, righe: geo.righe, cella, scenaLarghezza: scena.larghezza, scenaAltezza: scena.altezza,
    ostacoli: analisi.ostacoli.map((o) => ({ colonna: o.c, riga: o.r, id: o.id, ferma_passo: o.ferma_passo, ferma_colpi: o.ferma_colpi })),
  });
  const origine = { x: base.x, y: base.y };
  const centroCella = (c, r) => ({ x: origine.x + (c + 0.5) * cella, y: origine.y + (r + 0.5) * cella });
  const rettCella = (c, r) => ({ x: origine.x + c * cella, y: origine.y + r * cella, w: cella, h: cella });
  const slotIngresso = geo.slots[modello.ingresso?.slot] ?? null;
  const aperture = new Set();
  /** Solido dell'ingresso: passabile (è la soglia verso il piano), ferma i colpi come un muro. */
  const ingresso = slotIngresso
    ? { id: ID_INGRESSO, slot: modello.ingresso.slot, lato: slotIngresso.lato, ...rettCella(slotIngresso.c, slotIngresso.r), ferma_passo: false, ferma_colpi: true }
    : null;
  if (slotIngresso) aperture.add(`${slotIngresso.c},${slotIngresso.r}`);
  const ostacoli = base.solidi.filter((s) => s.id !== 'muro');
  const solidi = [...costruisciMura({ geo, cella, origine, aperture }), ...(ingresso ? [ingresso] : []), ...ostacoli];

  /** Monta il campo dell'hub nel campo condiviso. */
  function monta() {
    for (const k of Object.keys(campo)) delete campo[k];
    Object.assign(campo, { ...base, solidi });
  }

  // ---- presenze ---------------------------------------------------------------------------------
  const presenzeStatiche = (modello.presenze ?? []).map((p) => ({
    ...p,
    ...centroCella(p.c, p.r),
    fino_a: p.fino_a ? centroCella(p.fino_a.c, p.fino_a.r) : null,
  }));

  /**
   * Presenze risolte nello stato narrativo corrente.
   * @returns {{ id: string, tipo: string, x: number, y: number, presente: boolean, stato: string|null, nome: string|null }[]}
   */
  function presenze() {
    const st = narrativa.stato();
    return presenzeStatiche.map((p) => ({
      ...p,
      presente: valuta(p.quando, st, schema, { log, dove: `presenza ${p.id} dell'hub` }),
      stato: p.tipo === 'porta'
        ? (valuta(p.aperta_se, st, schema, { log, dove: `porta ${p.id} dell'hub` }) ? STATI_PORTA_HUB.aperta : STATI_PORTA_HUB.chiusa)
        : null,
    }));
  }

  /** L'NPC presente più vicino a Ferruccio entro `incontri.r_interazione`, o null. */
  function vicino() {
    const r = parametri.get('incontri.r_interazione');
    let migliore = null;
    let dMin = Infinity;
    for (const p of presenze()) {
      if (p.tipo !== 'npc' || !p.presente) continue;
      const d = Math.hypot(p.x - ferruccio.x, p.y - ferruccio.y);
      if (d <= r && d < dMin) {
        dMin = d;
        migliore = p;
      }
    }
    return migliore;
  }

  // ---- stato ------------------------------------------------------------------------------------
  let attivo = false;
  let partito = false;
  const notteCorrente = () => narrativa.avanzamento()[campoNotte];

  /** Seme della notte che partirà da qui (profilo + numero della notte). */
  function semeDellaNotte() {
    return semeNotte(semeProfilo, notteCorrente());
  }

  /**
   * Entra nell'hub: campo montato, Ferruccio sull'arrivo, scene automatiche del modello.
   * @returns {object|null} il dialogo automatico avviato, se c'è
   */
  function entra() {
    monta();
    attivo = true;
    partito = false;
    const a = modello.arrivo ? centroCella(modello.arrivo.c, modello.arrivo.r) : { x: origine.x + base.larghezza / 2, y: origine.y + base.altezza / 2 };
    ferruccio.posiziona(a.x, a.y);
    eventi.emit('hub.entrata', { id: modello.id, notte: notteCorrente() });
    const st = narrativa.stato();
    let dialogo = null;
    for (const auto of modello.automatiche ?? []) {
      if (!valuta(auto.quando, st, schema, { log, dove: `automatica ${auto.ancoraggio} dell'hub` })) continue;
      dialogo = incontri.automatiche(auto.ancoraggio) ?? dialogo;
    }
    return dialogo;
  }

  /** Esce dall'hub (la notte è partita o il gioco va altrove). */
  function esci() {
    attivo = false;
  }

  /**
   * Un passo fisso dell'hub.
   * @param {number} dt secondi
   */
  function tick(dt) {
    if (!attivo) return;
    const dialogo = incontri.dialogo();
    if (!dialogo) ferruccio.tick(dt);
    if (!dialogo && input.premuto(azioneInteragisci)) {
      const p = vicino();
      if (p) {
        eventi.emit('hub.interazione', { id: p.id, ancoraggio: p.ancoraggio });
        incontri.interagisci(p.ancoraggio, { porteChiuse: false });
      }
    }
    if (!partito && ingresso && cerchioInRettangolo(ferruccio.x, ferruccio.y, ferruccio.r, ingresso)) {
      partito = true;
      eventi.emit('hub.partenza', { id: modello.id, piano: modello.ingresso.piano, seme: semeDellaNotte(), notte: notteCorrente() });
    }
  }

  return {
    get id() { return modello.id; },
    get tipo() { return TIPO_HUB; },
    get attivo() { return attivo; },
    get partito() { return partito; },
    get piano() { return modello.ingresso?.piano ?? null; },
    modello,
    geo,
    cella,
    origine,
    ingresso,
    ostacoli,
    centroCella,
    presenze,
    vicino,
    semeNotte: semeDellaNotte,
    notte: notteCorrente,
    entra,
    esci,
    tick,
    errori: () => errori.slice(),
  };
}
