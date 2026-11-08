/**
 * motore/storia/incontri.js — Incontri per ancoraggio: quale scena (o battuta di ripetizione) parte
 * quando Ferruccio interagisce con un ancoraggio, la sequenza dei cartigli, la spezzatura delle battute,
 * la scelta con i suoi esiti e la durata dei tableau (GDD incontri-dialoghi.md regole 1-6, 9-10 e le
 * formule `scena_da_mostrare` e `durata_tableau`). Storia 027. Logica pura, senza DOM: l'interfaccia
 * (`ui/cartiglio.js`, `ui/tableau.js`) legge il dialogo corrente e chiama `avanza`/`scegli`/`salta`.
 *
 * - `interagisci(ancoraggio, { porteChiuse })`: niente a porte chiuse (regola 2, evento
 *   `incontri.rifiutato`); altrimenti la prima scena disponibile con battute per quell'ancoraggio, se
 *   l'NPC non ha ancora mostrato una scena nuova stanotte in quel luogo (hub o piano) o se la scena è di
 *   un tipo che non aspetta (regola 3); altrimenti una battuta di ripetizione vera per lo stato
 *   (`ripetizioni.json`), alternata; se nessuna è vera, errore di contenuto e didascalia generica.
 * - `automatiche(ancoraggio)`: le scene che partono da sole (ingresso-piano, dopo-boss, epilogo), in
 *   ordine; una scena senza battute è segnata vista subito (`incontri.scena` con `muta: true`).
 * - Il dialogo: `cartigli` (una battuta alla volta, spezzata a `max_caratteri_battuta` alla
 *   punteggiatura più vicina alla metà, altrimenti alla parola; nome del parlante da storia.json;
 *   `didascalia: true` per le didascalie), `scelta` con le opzioni di storia.json, `esito` (la scena
 *   condizionale disponibile a ordine successivo nello stesso ancoraggio, nello stesso cartiglio),
 *   `tableau` con `durataMs`. La scena è segnata vista SOLO alla chiusura: chi chiude il gioco a metà
 *   la rivede dall'inizio. `salta` chiude un dialogo già visto (regola 9), mai una scelta.
 * - Storia 028: `puoAprire(scena)` (iniettato) può negare una scena a `interagisci`/`automatiche`
 *   (es. la scelta di un ricordo senza il ricordo in mano): si passa alla successiva o alla ripetizione.
 *   `mostra` (QA) non lo consulta.
 * - Eventi verso l'alto: `incontri.avvio`, `incontri.battuta`, `incontri.scelta`, `incontri.fine`,
 *   `incontri.rifiutato`, `incontri.scena`. Nessuna stringa di gioco e nessun numero qui: testi da
 *   storia.json/ripetizioni.json/interfaccia.json, numeri da `parametri` (`incontri.json`).
 * Dipendenze: `storia/condizioni.js`; `stato` (stato-narrativo), `parametri`, `eventi` iniettati.
 */

import { valuta } from './condizioni.js';

/** Fasi del dialogo. */
export const FASI = Object.freeze({ battute: 'battute', scelta: 'scelta', esito: 'esito', finito: 'finito' });

/** Motivi di `incontri.rifiutato` (codici stabili). */
export const RIFIUTI = Object.freeze({ porteChiuse: 'porte_chiuse', occupato: 'occupato', nessunaScena: 'nessuna_scena' });

/** Prefissi degli ancoraggi (regola 1) e luoghi della regola 3. */
export const ANCORAGGI = Object.freeze({ hub: 'hub:', ricordo: 'ricordo:', dopoBoss: 'dopo-boss:', ingresso: 'ingresso-piano:', epilogo: 'epilogo' });
export const LUOGHI = Object.freeze({ hub: 'hub', piano: 'piano' });

/** Valore di `chi` che storia.json usa per le didascalie (convenzione del file, non testo di gioco). */
const CHI_DIDASCALIA = 'didascalia';
/** Punteggiatura dopo la quale una battuta lunga si può spezzare (caratteri, non testo). */
const PUNTEGGIATURA = /[.,;:!?…]/;

/**
 * Spezza una battuta più lunga di `max` caratteri in pezzi ≤ `max` dello stesso parlante, senza
 * riscriverla: al segno di punteggiatura seguito da spazio più vicino alla metà; se non c'è, allo
 * spazio più vicino alla metà; se non c'è nemmeno quello, a `max`. `pezzi.join(' ')` ridà il testo
 * (a spazi singoli). Ricorsiva: un pezzo ancora lungo si spezza di nuovo.
 * @param {string} testo
 * @param {number} max caratteri massimi per cartiglio
 * @returns {string[]}
 */
export function spezza(testo, max) {
  const t = String(testo ?? '').trim();
  const limite = Math.max(1, Math.floor(max));
  if (t.length <= limite) return [t];
  const meta = t.length / 2;
  let taglio = -1;
  let distanza = Infinity;
  for (let i = 1; i < t.length - 1; i++) {
    if (PUNTEGGIATURA.test(t[i]) && t[i + 1] === ' ' && Math.abs(i + 1 - meta) < distanza) {
      distanza = Math.abs(i + 1 - meta);
      taglio = i + 1;
    }
  }
  if (taglio < 0) {
    for (let i = 1; i < t.length - 1; i++) {
      if (t[i] === ' ' && Math.abs(i - meta) < distanza) {
        distanza = Math.abs(i - meta);
        taglio = i;
      }
    }
  }
  if (taglio < 0) taglio = limite;
  const a = t.slice(0, taglio).trim();
  const b = t.slice(taglio).trim();
  if (!a || !b) return [t];
  return [...spezza(a, limite), ...spezza(b, limite)];
}

/**
 * Formula `durata_tableau` del GDD: max(t_min, t_base + ms_per_carattere × caratteri).
 * @param {{ caratteri: number, tMinMs: number, tBaseMs: number, msPerCarattere: number }} o
 * @returns {number} millisecondi
 */
export function durataTableau({ caratteri, tMinMs, tBaseMs, msPerCarattere }) {
  return Math.max(tMinMs, tBaseMs + msPerCarattere * Math.max(0, caratteri));
}

/** Luogo (regola 3) di un ancoraggio: hub per `hub:*`, piano per tutto il resto. */
export function luogoDi(ancoraggio) {
  return String(ancoraggio).startsWith(ANCORAGGI.hub) ? LUOGHI.hub : LUOGHI.piano;
}

/** Vero per gli ancoraggi le cui scene partono da sole (regola 2). */
export function eAutomatico(ancoraggio) {
  const a = String(ancoraggio);
  return a.startsWith(ANCORAGGI.ingresso) || a.startsWith(ANCORAGGI.dopoBoss) || a === ANCORAGGI.epilogo;
}

/**
 * Crea il modulo degli incontri.
 * @param {{
 *   stato: ReturnType<import('./stato-narrativo.js').crea>,
 *   storia: object,                       contenuti/storia.json (personaggi → nomi)
 *   ancoraggi?: object,                   contenuti/ancoraggi.json (campo `tableau`)
 *   ripetizioni?: object,                 contenuti/ripetizioni.json
 *   parametri: { get: (p: string) => number },
 *   notte: () => number,                  numero della notte corrente (dall'avanzamento)
 *   tipiSenzaAttesa?: string[],           tipi che non aspettano la notte dopo (narrativa.json › tipi_senza_attesa)
 *   testi?: { ripetizione_generica?: string }, contenuti/interfaccia.json › incontri
 *   puoAprire?: (scena: object) => boolean,  storia 028: requisito esterno per aprire una scena (la scelta di un
 *                                            ricordo si apre solo con il ricordo in mano: `oggetti/ricordi.js`);
 *                                            una scena rifiutata è saltata (resta disponibile), mai segnata vista
 *   eventi?: { emit: Function } | null,
 *   log?: { error: Function }
 * }} o
 */
export function creaIncontri({ stato, storia, ancoraggi = null, ripetizioni = null, parametri, notte, tipiSenzaAttesa = [], testi = {}, puoAprire = () => true, eventi = null, log = console }) {
  if (!stato || typeof stato.disponibili !== 'function') throw new TypeError('creaIncontri: manca lo stato narrativo');
  if (!storia || !storia.personaggi) throw new TypeError('creaIncontri: manca storia.json');
  if (!parametri || typeof parametri.get !== 'function') throw new TypeError('creaIncontri: mancano i parametri');
  if (typeof notte !== 'function') throw new TypeError('creaIncontri: manca `notte()`');
  const P = (nome) => parametri.get(`incontri.${nome}`);
  const errore = (m) => log?.error?.(`[incontri] errore di contenuto: ${m}`);
  const emetti = (nome, payload) => eventi?.emit(nome, payload);
  const senzaAttesa = new Set(tipiSenzaAttesa);
  const schema = stato.schema();

  const nomeDi = (chi) => storia.personaggi?.[chi]?.nome ?? chi;
  const datiScena = (id) => ancoraggi?.scene?.[id] ?? null;
  const eTableau = (s) => Boolean(datiScena(s.id)?.tableau ?? s.tableau ?? s.ricordo);
  const npcDi = (ancoraggio) => {
    const a = String(ancoraggio);
    if (a.startsWith(ANCORAGGI.hub)) return a.slice(ANCORAGGI.hub.length);
    return ripetizioni?.npc_per_ancoraggio?.[a] ?? null;
  };

  /** @type {Map<string, number>} scene nuove mostrate per `notte|npc|luogo` (regola 3). */
  const nuove = new Map();
  /** @type {Map<string, number>} contatore delle ripetizioni per NPC (alternanza). */
  const giri = new Map();
  const segnalate = new Set();
  let corrente = null;

  /**
   * Cartigli di una scena: battute vere per lo stato (`se`), spezzate a `max_caratteri_battuta`.
   * @param {string} id
   * @returns {{ chi: string, nome: string, didascalia: boolean, testo: string, posa: string|null, parte: number, parti: number }[]}
   */
  function cartigliDi(id) {
    const max = P('max_caratteri_battuta');
    const fuori = [];
    for (const b of stato.battute(id)) {
      const pezzi = spezza(b.testo, max);
      pezzi.forEach((testo, i) => fuori.push({
        chi: b.chi, nome: nomeDi(b.chi), didascalia: b.chi === CHI_DIDASCALIA, testo, posa: b.posa ?? null, parte: i, parti: pezzi.length,
      }));
    }
    return fuori;
  }

  /** Prima scena disponibile con battute per l'ancoraggio (le mute sono segnalate una volta e saltate). */
  function candidata(ancoraggio, { ordineMinimo = -Infinity } = {}) {
    for (const s of stato.disponibili(ancoraggio)) {
      if (s.ordine <= ordineMinimo) continue;
      if (!puoAprire(s)) continue; // storia 028: es. scelta di un ricordo senza il ricordo in mano
      if (cartigliDi(s.id).length > 0) return s;
      if (!segnalate.has(s.id)) {
        segnalate.add(s.id);
        errore(`scena '${s.id}' senza battute all'ancoraggio '${ancoraggio}': saltata`);
      }
    }
    return null;
  }

  /** Battuta di ripetizione vera per lo stato (alternata), o la didascalia generica. */
  function ripetizione(npc) {
    const st = stato.stato();
    const vere = (ripetizioni?.npc?.[npc] ?? []).filter((b) => valuta(b.quando, st, schema, { log, dove: `ripetizione di ${npc}` }));
    const giro = giri.get(npc) ?? 0;
    giri.set(npc, giro + 1);
    if (vere.length === 0) {
      errore(`nessuna battuta di ripetizione vera per '${npc}' nello stato corrente`);
      const testo = String(testi.ripetizione_generica ?? '').replaceAll('{nome}', nomeDi(npc));
      return { chi: CHI_DIDASCALIA, nome: nomeDi(CHI_DIDASCALIA), didascalia: true, testo, posa: null, parte: 0, parti: 1, generica: true };
    }
    const b = vere[giro % vere.length];
    return { chi: b.chi, nome: nomeDi(b.chi), didascalia: b.chi === CHI_DIDASCALIA, testo: b.testo, posa: b.posa ?? null, parte: 0, parti: 1, generica: false };
  }

  function durataDi(cartigli) {
    const caratteri = cartigli.filter((c) => !c.didascalia).reduce((n, c) => n + c.testo.length, 0);
    return durataTableau({ caratteri, tMinMs: P('tableau.t_min'), tBaseMs: P('tableau.t_base'), msPerCarattere: P('tableau.ms_per_carattere') });
  }

  /**
   * Avvia un dialogo (scena o ripetizione). Uno solo alla volta.
   * @returns {object|null} il dialogo
   */
  function apri({ scena = null, ancoraggio, cartigli, tipo, automatico = false, forzata = false }) {
    const tableau = scena ? eTableau(scena) : false;
    let segnata = false;
    const d = {
      id: scena?.id ?? null,
      tipo,
      ancoraggio,
      automatico,
      tableau,
      durataMs: tableau ? durataDi(cartigli) : 0,
      cartigli,
      indice: 0,
      fase: FASI.battute,
      scelta: null,
      esito: null,
      // regola 9: si salta una ripetizione o una scena ripetibile (una non ripetibile si vede una volta sola)
      saltabile: tipo === 'ripetizione' || forzata || Boolean(scena && datiScena(scena.id)?.ripetibile),
      /** Cartiglio corrente (copia) o null. */
      corrente() { return d.cartigli[d.indice] ? { ...d.cartigli[d.indice] } : null; },
      /** Voce del tableau: tutte le battute parlate, nell'ordine. */
      voce() { return d.cartigli.filter((c) => !c.didascalia).map((c) => c.testo).join(' '); },
      avanza,
      seleziona,
      scegli,
      salta,
    };
    corrente = d;
    emetti('incontri.avvio', { id: d.id, tipo, ancoraggio, tableau, cartigli: cartigli.length, scelta: Boolean(scena?.scelta) });
    emetti('incontri.battuta', { id: d.id, indice: 0, ...d.corrente() });
    return d;

    function avanza() {
      if (corrente !== d) return false;
      if (d.fase === FASI.scelta || d.fase === FASI.finito) return false;
      d.indice += 1;
      if (d.indice < d.cartigli.length) {
        emetti('incontri.battuta', { id: d.id, indice: d.indice, ...d.corrente() });
        return true;
      }
      if (d.fase === FASI.battute && scena?.scelta) {
        d.fase = FASI.scelta;
        d.scelta = {
          flag: scena.scelta.flag,
          opzioni: (scena.scelta.opzioni ?? []).map((o) => ({ valore: o.valore, etichetta: o.etichetta, cosa_sacrifica: o.cosa_sacrifica ?? '' })),
          selezionata: -1,
        };
        emetti('incontri.scelta', { id: d.id, flag: d.scelta.flag, opzioni: d.scelta.opzioni.map((o) => o.valore) });
        return true;
      }
      chiudi();
      return true;
    }

    function seleziona(i) {
      if (corrente !== d || d.fase !== FASI.scelta) return false;
      if (!Number.isInteger(i) || i < 0 || i >= d.scelta.opzioni.length) return false;
      d.scelta.selezionata = i;
      return true;
    }

    /** Conferma l'opzione `i` (o quella selezionata): decisione definitiva, poi l'esito nello stesso cartiglio. */
    function scegli(i = d.scelta?.selezionata) {
      if (corrente !== d || d.fase !== FASI.scelta) return { ok: false, motivo: 'fase' };
      const opzione = d.scelta.opzioni[i];
      if (!opzione) return { ok: false, motivo: 'opzione' };
      const esito = stato.decidi(d.scelta.flag, opzione.valore);
      if (!esito.ok) {
        errore(`scelta '${d.id}': decisione rifiutata (${esito.motivo})`);
        return esito;
      }
      stato.segnaVista(scena.id);
      segnata = true;
      const prossima = ancoraggio ? candidata(ancoraggio, { ordineMinimo: scena.ordine }) : null;
      if (prossima) {
        d.esito = prossima.id;
        d.cartigli = cartigliDi(prossima.id);
        d.indice = 0;
        d.fase = FASI.esito;
        emetti('incontri.battuta', { id: d.esito, indice: 0, ...d.corrente() });
      } else {
        chiudi();
      }
      return { ok: true, valore: opzione.valore };
    }

    function salta() {
      if (corrente !== d || !d.saltabile || d.fase === FASI.scelta) return false;
      chiudi();
      return true;
    }

    function chiudi() {
      if (d.fase === FASI.finito) return;
      d.fase = FASI.finito;
      corrente = null;
      const viste = [];
      if (scena && !segnata) viste.push(scena.id);
      if (d.esito) viste.push(d.esito);
      segnata = true;
      for (const id of viste) stato.segnaVista(id);
      emetti('incontri.fine', { id: d.id, esito: d.esito, tipo, ancoraggio, viste });
      if (automatico) automatiche(ancoraggio);
    }
  }

  /** Regola 3: può partire una scena nuova per questo NPC, stanotte, in questo luogo? */
  function puoMostrareNuova(npc, luogo, scena) {
    if (senzaAttesa.has(scena.tipo)) return true;
    return (nuove.get(`${notte()}|${npc}|${luogo}`) ?? 0) < P('max_nuove_per_notte');
  }

  /**
   * Interazione con un ancoraggio (regole 2-3).
   * @param {string} ancoraggio
   * @param {{ porteChiuse?: boolean }} [o]
   * @returns {object|null} il dialogo avviato, o null (evento `incontri.rifiutato`)
   */
  function interagisci(ancoraggio, { porteChiuse = false } = {}) {
    if (corrente) {
      emetti('incontri.rifiutato', { ancoraggio, motivo: RIFIUTI.occupato });
      return null;
    }
    if (porteChiuse) {
      emetti('incontri.rifiutato', { ancoraggio, motivo: RIFIUTI.porteChiuse });
      return null;
    }
    const npc = npcDi(ancoraggio);
    const luogo = luogoDi(ancoraggio);
    const s = candidata(ancoraggio);
    if (s && puoMostrareNuova(npc ?? ancoraggio, luogo, s)) {
      const k = `${notte()}|${npc ?? ancoraggio}|${luogo}`;
      nuove.set(k, (nuove.get(k) ?? 0) + 1);
      return apri({ scena: s, ancoraggio, cartigli: cartigliDi(s.id), tipo: 'scena' });
    }
    if (!npc) {
      emetti('incontri.rifiutato', { ancoraggio, motivo: RIFIUTI.nessunaScena });
      return null;
    }
    return apri({ ancoraggio, cartigli: [ripetizione(npc)], tipo: 'ripetizione' });
  }

  /**
   * Scene che partono da sole a un ancoraggio (regola 2): le mute sono segnate viste subito, la prima
   * con battute parte; alla sua chiusura si richiama da solo per le successive.
   * @param {string} ancoraggio
   * @returns {object|null} il dialogo avviato (null se nessuna scena con battute o se un dialogo è aperto)
   */
  function automatiche(ancoraggio) {
    if (corrente) return null;
    // la lista si ricalcola dopo ogni scena muta: segnarla vista può sbloccare la successiva (regola 6)
    const mute = new Set();
    for (;;) {
      const s = stato.disponibili(ancoraggio).find((x) => !mute.has(x.id) && puoAprire(x));
      if (!s) return null;
      const cartigli = cartigliDi(s.id);
      if (cartigli.length === 0) {
        mute.add(s.id);
        stato.segnaVista(s.id);
        emetti('incontri.scena', { id: s.id, ancoraggio, muta: true });
        continue;
      }
      return apri({ scena: s, ancoraggio, cartigli, tipo: 'scena', automatico: true });
    }
    return null;
  }

  /**
   * Strumento di debug/QA: avvia una scena per id senza controllare la disponibilità (la chiusura la
   * segna vista come al solito). Null per id ignoto o dialogo già aperto.
   * @param {string} id
   */
  function mostra(id) {
    if (corrente) return null;
    const s = stato.scena(id);
    if (!s) {
      errore(`mostra: scena ignota '${id}'`);
      return null;
    }
    const cartigli = cartigliDi(id);
    if (cartigli.length === 0 && !s.scelta) {
      errore(`mostra: scena '${id}' senza battute`);
      return null;
    }
    return apri({ scena: s, ancoraggio: datiScena(id)?.ancoraggio ?? null, cartigli, tipo: 'scena', forzata: true });
  }

  /** Chiude il dialogo corrente SENZA segnarlo visto (uscita dal gioco a metà scena). */
  function abbandona() {
    if (!corrente) return false;
    const d = corrente;
    corrente = null;
    d.fase = FASI.finito;
    emetti('incontri.fine', { id: d.id, esito: null, tipo: d.tipo, ancoraggio: d.ancoraggio, viste: [], abbandonato: true });
    return true;
  }

  return {
    interagisci,
    automatiche,
    mostra,
    abbandona,
    cartigliDi,
    ripetizione,
    npcDi,
    /** Dialogo corrente o null. */
    dialogo: () => corrente,
    /** Scene nuove mostrate stanotte da un NPC in un luogo. */
    nuoveMostrate: (npc, luogo) => nuove.get(`${notte()}|${npc}|${luogo}`) ?? 0,
  };
}
