/**
 * motore/storia/stato-narrativo.js — La memoria del gioco: sei flag, derivati, avanzamento,
 * disponibilità delle scene, decisioni e profilo (ADR-0004, ADR-0006; GDD stato-narrativo.md
 * regole 1-10 e formula `disponibile`). Storia 026.
 *
 * Il modulo non contiene nomi di flag né di scene: legge `storia.json` (flag, scene, capitoli, boss),
 * `narrativa.json` (derivati, booleani, finale → mondo, tipi obbligatori, schema dell'avanzamento) e
 * `ancoraggi.json` (ancoraggio e ripetibilità per scena). Le condizioni passano per `condizioni.js`.
 *
 * - `decidi(flag, valore)` → `{ ok, motivo }`. Rifiuti: flag ignoto o derivato, valore fuori elenco,
 *   flag già deciso (regola 1: mai indietro), valore non offerto da nessuna scena di scelta disponibile
 *   nello stato corrente (es. `gregorio = dialogo` con `prove = falsa`: la sola scena che offre
 *   `dialogo` ha `quando: {prove: vera}`). Decidere il flag del finale imposta `finale_visto` e `mondo`.
 * - `disponibile(scena)` applica la formula del GDD: quando ∧ quando_or ∧ non vista (o ripetibile) ∧
 *   nessuna obbligatoria/boss non vista con ordine minore nello stesso capitolo.
 * - `disponibili(ancoraggio)` / `disponibiliPer(filtro)`: scene disponibili ordinate per `ordine`,
 *   una sola per (capitolo, ordine): a parità si sceglie la più specifica (più coppie in `quando`),
 *   poi la prima nel file, e il conflitto è loggato come errore di contenuto.
 * - Ogni mutazione emette un evento (`narrativa.*`) e salva il profilo (`salvataggio.salva('profilo',
 *   slot, serializza())`) se un salvataggio è iniettato; `crea` ricarica il profilo dello slot se c'è.
 * - `imposta(flag, valore)` è il gancio di debug/QA (`window.__gioco.imposta`, `qa/stati64.js`):
 *   forza un flag senza i rifiuti di `decidi` (ma con valori validi).
 * Dipendenze: `storia/condizioni.js`; `eventi` e `salvataggio` iniettati.
 */

import { creaSchema, valuta, valutaOr, TIPI } from './condizioni.js';

/** Motivi di rifiuto di `decidi` / `imposta` (codici stabili, non testo di gioco). */
export const MOTIVI = Object.freeze({
  flagIgnoto: 'flag_ignoto',
  derivato: 'derivato',
  valoreIgnoto: 'valore_ignoto',
  giaDeciso: 'gia_deciso',
  nonOfferto: 'non_offerto',
});

/**
 * Crea lo stato narrativo.
 * @param {{
 *   storia: object,                 contenuto di contenuti/storia.json
 *   regole: object,                 contenuto di contenuti/narrativa.json
 *   ancoraggi?: object,             contenuto di contenuti/ancoraggi.json ({ scene: { id: { ancoraggio, ripetibile } } })
 *   eventi?: { emit: Function } | null,
 *   salvataggio?: { salva: Function, carica: Function } | null,
 *   slot?: number|string,           slot del profilo (default 1)
 *   log?: { error: Function }
 * }} o
 */
export function crea({ storia, regole, ancoraggi = null, eventi = null, salvataggio = null, slot = 1, log = console }) {
  if (!storia || !Array.isArray(storia.scene)) throw new TypeError('stato-narrativo.crea: manca `storia.scene`');
  if (!regole || typeof regole !== 'object') throw new TypeError('stato-narrativo.crea: mancano le regole (narrativa.json)');
  const errore = (m) => log?.error?.(`[stato-narrativo] errore di contenuto: ${m}`);

  // ---- contenuti --------------------------------------------------------------------------------
  const { schema, decisioni, derivati, errori: erroriSchema } = creaSchema({ storia, regole });
  for (const e of erroriSchema) errore(e);
  const scene = storia.scene;
  /** @type {Map<string, object>} */
  const perId = new Map(scene.map((s) => [s.id, s]));
  const posizione = new Map(scene.map((s, i) => [s.id, i]));
  const perCapitolo = new Map();
  for (const s of scene) {
    if (!perCapitolo.has(s.capitolo)) perCapitolo.set(s.capitolo, []);
    perCapitolo.get(s.capitolo).push(s);
  }
  const tipiObbligatori = new Set(regole.tipi_obbligatori ?? []);
  const datiScena = (id) => ancoraggi?.scene?.[id] ?? null;
  const ripetibile = (s) => Boolean(datiScena(s.id)?.ripetibile ?? s.ripetibile);
  const ancoraggioDi = (s) => datiScena(s.id)?.ancoraggio ?? s.ancoraggio ?? null;
  const parole = regole.booleani ?? {};
  const capitoloDopoFinale = regole.piani?.capitolo_dopo_finale ?? null;
  const pianoMassimo = Math.max(0, ...(storia.capitoli ?? []).filter((c) => c.id !== capitoloDopoFinale).map((c) => c.ordine ?? 0));
  const idBoss = new Set((storia.boss ?? []).map((b) => b.id));
  const flagFinale = regole.finale?.flag ?? null;
  if (flagFinale && !decisioni.includes(flagFinale)) errore(`narrativa.finale.flag '${flagFinale}' non è un flag di scelta`);
  const avanzamentoDef = regole.avanzamento ?? {};
  for (const campo of ['campo_notte', 'campo_piano_max']) {
    if (avanzamentoDef[regole.piani?.[campo]]?.tipo !== 'numero') errore(`narrativa.piani.${campo} deve indicare un campo numerico dell'avanzamento`);
  }

  // ---- stato ------------------------------------------------------------------------------------
  /** @type {Record<string, string|null>} */
  const flag = Object.fromEntries(decisioni.map((n) => [n, null]));
  const avanzamento = {};
  function azzeraAvanzamento() {
    for (const [nome, def] of Object.entries(avanzamentoDef)) {
      if (def.tipo === 'numero') avanzamento[nome] = def.iniziale ?? 0;
      else if (def.tipo === 'insieme') avanzamento[nome] = new Set();
      else if (def.tipo === 'booleano') avanzamento[nome] = Boolean(def.iniziale);
      else avanzamento[nome] = null;
    }
  }
  azzeraAvanzamento();

  // ---- viste ------------------------------------------------------------------------------------

  /** Vista piatta per le condizioni: flag, derivati (vera/falsa), avanzamento (booleani come parole, insiemi come array). */
  function stato() {
    const piatto = { ...flag };
    const soloFlag = { ...flag };
    for (const nome of derivati) {
      piatto[nome] = valutaOr(regole.derivati[nome], soloFlag, schema, { log, dove: `derivato ${nome}` }) ? parole.vero : parole.falso;
    }
    for (const [nome, def] of Object.entries(avanzamentoDef)) {
      const v = avanzamento[nome];
      if (def.tipo === 'insieme') piatto[nome] = Array.from(v);
      else if (def.tipo === 'booleano') piatto[nome] = v ? parole.vero : parole.falso;
      else piatto[nome] = v;
    }
    return piatto;
  }

  /** Valori dei soli derivati (`vera`/`falsa`). */
  function derivatiCorrenti() {
    const s = stato();
    return Object.fromEntries(derivati.map((n) => [n, s[n]]));
  }

  /** Copia dei sei flag. */
  function flagCorrenti() {
    return { ...flag };
  }

  /** Copia dell'avanzamento (insiemi come array). */
  function avanzamentoCorrente() {
    const copia = {};
    for (const [nome, v] of Object.entries(avanzamento)) copia[nome] = v instanceof Set ? Array.from(v) : v;
    return copia;
  }

  // ---- persistenza ------------------------------------------------------------------------------

  /** Stato intero, JSON-serializzabile (ADR-0006: il profilo). */
  function serializza() {
    return { flag: flagCorrenti(), avanzamento: avanzamentoCorrente() };
  }

  /**
   * Ripristina da `serializza()`. Flag o valori ignoti sono errori di contenuto (ignorati, loggati);
   * id di scena o di boss che non esistono più sono ignorati in silenzio; `piano_max` è riportato nel
   * massimo disponibile. Non emette e non salva.
   * @param {object} dati
   * @returns {string[]} errori di contenuto
   */
  function ripristina(dati) {
    const errori = [];
    for (const n of decisioni) flag[n] = null;
    azzeraAvanzamento();
    for (const [nome, v] of Object.entries(dati?.flag ?? {})) {
      if (!decisioni.includes(nome)) {
        errori.push(`profilo: flag ignoto '${nome}'`);
        continue;
      }
      if (v !== null && !schema[nome].valori.includes(v)) {
        errori.push(`profilo: '${nome}' = '${v}' fuori dall'elenco`);
        continue;
      }
      flag[nome] = v;
    }
    for (const [nome, v] of Object.entries(dati?.avanzamento ?? {})) {
      const def = avanzamentoDef[nome];
      if (!def) {
        errori.push(`profilo: campo di avanzamento ignoto '${nome}'`);
        continue;
      }
      if (def.tipo === 'numero') {
        if (typeof v !== 'number' || !Number.isFinite(v)) errori.push(`profilo: '${nome}' non numerico`);
        else avanzamento[nome] = Math.max(def.min ?? -Infinity, v);
      } else if (def.tipo === 'insieme') {
        const membri = schema[nome]?.membri;
        avanzamento[nome] = new Set((Array.isArray(v) ? v : []).filter((id) => !membri || membri.size === 0 || membri.has(id)));
      } else if (def.tipo === 'booleano') avanzamento[nome] = Boolean(v);
      else if (v === null || schema[nome]?.valori.includes(v)) avanzamento[nome] = v;
      else errori.push(`profilo: '${nome}' = '${v}' fuori dall'elenco`);
    }
    for (const [nome, def] of Object.entries(avanzamentoDef)) {
      if (def.tipo === 'numero' && nome === chiavePiano()) avanzamento[nome] = Math.min(avanzamento[nome], pianoMassimo);
    }
    for (const e of errori) errore(e);
    return errori;
  }

  /** Nome del campo di avanzamento che misura il piano massimo (narrativa.json › piani). */
  function chiavePiano() {
    return regole.piani?.campo_piano_max;
  }

  /**
   * Scrive flag e avanzamento nello slot del profilo, conservando i campi che vi scrivono altri moduli
   * (scintille, sblocchi e ricordi restituiti di `persistenza/profilo.js`): la busta è una sola (ADR-0006).
   */
  function salva() {
    if (!salvataggio) return false;
    const altri = salvataggio.carica('profilo', slot) ?? {};
    return salvataggio.salva('profilo', slot, { ...altri, ...serializza() });
  }

  function emetti(nome, payload) {
    eventi?.emit(nome, payload);
  }

  // ---- disponibilità ----------------------------------------------------------------------------

  function condizioniVere(s, st) {
    const dove = `scena ${s.id}`;
    if (!valuta(s.quando, st, schema, { log, dove })) return false;
    if (Array.isArray(s.quando_or) && s.quando_or.length > 0 && !valutaOr(s.quando_or, st, schema, { log, dove })) return false;
    return true;
  }

  function bloccataDaObbligatoria(s, viste) {
    for (const o of perCapitolo.get(s.capitolo) ?? []) {
      if (o !== s && tipiObbligatori.has(o.tipo) && o.ordine < s.ordine && !viste.has(o.id)) return true;
    }
    return false;
  }

  /**
   * Formula `disponibile(s)` del GDD.
   * @param {object|string} scena oggetto scena o id
   * @returns {boolean} falsa anche per una scena ignota (errore di contenuto)
   */
  function disponibile(scena) {
    const s = typeof scena === 'string' ? perId.get(scena) : scena;
    if (!s) {
      errore(`scena ignota '${scena}'`);
      return false;
    }
    const viste = avanzamento[chiaveViste()];
    if (viste.has(s.id) && !ripetibile(s)) return false;
    if (!condizioniVere(s, stato())) return false;
    return !bloccataDaObbligatoria(s, viste);
  }

  function chiaveViste() {
    return Object.entries(avanzamentoDef).find(([, d]) => d.tipo === 'insieme' && d.valori_da === 'scene')?.[0];
  }
  function chiaveBoss() {
    return Object.entries(avanzamentoDef).find(([, d]) => d.tipo === 'insieme' && d.valori_da === 'boss')?.[0];
  }

  const specificita = (s) => Object.keys(s.quando ?? {}).length;

  /**
   * Scene disponibili che passano il filtro, ordinate per `ordine` (poi posizione nel file), una sola
   * per (capitolo, ordine). Un conflitto (due disponibili con lo stesso ordine) è loggato: vince la più
   * specifica, poi la prima nel file.
   * @param {(s: object) => boolean} filtro
   * @returns {object[]} copie superficiali delle scene
   */
  function disponibiliPer(filtro) {
    const candidate = scene.filter((s) => filtro(s) && disponibile(s));
    candidate.sort((a, b) => a.ordine - b.ordine || posizione.get(a.id) - posizione.get(b.id));
    const scelte = [];
    const perSlot = new Map();
    for (const s of candidate) {
      const k = `${s.capitolo}\u0000${s.ordine}`;
      const vincente = perSlot.get(k);
      if (!vincente) {
        perSlot.set(k, s);
        scelte.push(s);
        continue;
      }
      errore(`scene '${vincente.id}' e '${s.id}' disponibili insieme allo stesso ordine ${s.ordine}: si mostra la più specifica`);
      if (specificita(s) > specificita(vincente)) {
        scelte[scelte.indexOf(vincente)] = s;
        perSlot.set(k, s);
      }
    }
    return scelte.map((s) => ({ ...s }));
  }

  /**
   * Scene disponibili per un ancoraggio (GDD incontri-dialoghi.md regola 1), ordinate.
   * @param {string} ancoraggio es. 'hub:tonino', 'epilogo'
   */
  function disponibili(ancoraggio) {
    return disponibiliPer((s) => ancoraggioDi(s) === ancoraggio);
  }

  /**
   * Obbligatorie (e boss) non ancora viste di un capitolo, in ordine: gli ancoraggi che la generazione
   * del piano deve garantire (regola 6).
   * @param {string} capitolo
   */
  function obbligatorieNonViste(capitolo) {
    const viste = avanzamento[chiaveViste()];
    return (perCapitolo.get(capitolo) ?? []).filter((s) => tipiObbligatori.has(s.tipo) && !viste.has(s.id)).sort((a, b) => a.ordine - b.ordine).map((s) => ({ ...s }));
  }

  /**
   * Battute di una scena filtrate con `se` nello stato corrente (regola 4: `se` ha la stessa semantica di `quando`).
   * @param {string} id
   * @returns {object[]}
   */
  function battute(id) {
    const s = perId.get(id);
    if (!s) {
      errore(`scena ignota '${id}'`);
      return [];
    }
    const st = stato();
    return (s.battute ?? []).filter((b) => valuta(b.se, st, schema, { log, dove: `battuta di ${id}` })).map((b) => ({ ...b }));
  }

  // ---- mutazioni --------------------------------------------------------------------------------

  function applicaFinale(valore) {
    if (!flagFinale) return;
    for (const [nome, def] of Object.entries(avanzamentoDef)) {
      if (def.tipo !== 'scelta') continue;
      if (def.valori_da === 'finale') avanzamento[nome] = valore;
      if (def.valori_da === 'mondo') {
        const mondo = valore === null ? null : regole.mondo?.[valore] ?? null;
        if (valore !== null && mondo === null) errore(`narrativa.mondo: nessun mondo per '${flagFinale}' = '${valore}'`);
        avanzamento[nome] = mondo;
      }
    }
  }

  /** Vero se una scena di scelta disponibile offre proprio questo valore del flag. */
  function offerto(nome, valore) {
    const st = stato();
    return scene.some((s) => s.scelta && s.scelta.flag === nome
      && (s.scelta.opzioni ?? []).some((o) => o.valore === valore)
      && condizioniVere(s, st));
  }

  function controllaFlag(nome, valore, { permettiNull = false } = {}) {
    if (schema[nome]?.derivato) return { ok: false, motivo: MOTIVI.derivato };
    if (!decisioni.includes(nome)) return { ok: false, motivo: MOTIVI.flagIgnoto };
    if (valore === null && permettiNull) return { ok: true };
    if (!schema[nome].valori.includes(valore)) return { ok: false, motivo: MOTIVI.valoreIgnoto };
    return { ok: true };
  }

  /**
   * Prende una decisione (regola 1: definitiva). Vedi i rifiuti in `MOTIVI`.
   * @param {string} nome uno dei sei flag
   * @param {string} valore
   * @returns {{ ok: boolean, motivo?: string }}
   */
  function decidi(nome, valore) {
    const c = controllaFlag(nome, valore);
    if (!c.ok) return c;
    if (flag[nome] !== null) return { ok: false, motivo: MOTIVI.giaDeciso };
    if (!offerto(nome, valore)) return { ok: false, motivo: MOTIVI.nonOfferto };
    flag[nome] = valore;
    if (nome === flagFinale) applicaFinale(valore);
    emetti('narrativa.decisione', { flag: nome, valore, derivati: derivatiCorrenti() });
    salva();
    return { ok: true };
  }

  /**
   * Forza un flag (debug/QA, GDD «Strumenti QA»): salta i rifiuti di `decidi` tranne la validità del
   * valore; `null` lo riporta a non deciso.
   * @param {string} nome
   * @param {string|null} valore
   * @returns {{ ok: boolean, motivo?: string }}
   */
  function imposta(nome, valore) {
    const c = controllaFlag(nome, valore, { permettiNull: true });
    if (!c.ok) return c;
    flag[nome] = valore;
    if (nome === flagFinale) applicaFinale(valore);
    emetti('narrativa.decisione', { flag: nome, valore, derivati: derivatiCorrenti(), forzata: true });
    salva();
    return { ok: true };
  }

  /**
   * Segna una scena come vista. Falso (con errore) per un id ignoto.
   * @param {string} id
   */
  function segnaVista(id) {
    if (!perId.has(id)) {
      errore(`segnaVista: scena ignota '${id}'`);
      return false;
    }
    avanzamento[chiaveViste()].add(id);
    emetti('narrativa.vista', { id });
    salva();
    return true;
  }

  /**
   * Registra un boss battuto. Falso (con errore) per un id ignoto.
   * @param {string} id
   */
  function registraBoss(id) {
    if (!idBoss.has(id)) {
      errore(`registraBoss: boss ignoto '${id}'`);
      return false;
    }
    avanzamento[chiaveBoss()].add(id);
    emetti('narrativa.boss', { id });
    salva();
    return true;
  }

  /**
   * Aggiorna il piano massimo raggiunto (solo in su, nel massimo disponibile).
   * @param {number} piano
   * @returns {number} piano_max dopo l'aggiornamento
   */
  function raggiungiPiano(piano) {
    const k = chiavePiano();
    const n = Math.min(pianoMassimo, Math.max(avanzamentoDef[k]?.min ?? 0, Math.floor(piano)));
    if (n > avanzamento[k]) {
      avanzamento[k] = n;
      emetti('narrativa.piano', { piano_max: n });
      salva();
    }
    return avanzamento[k];
  }

  /** Nuova notte: il contatore sale di uno. @returns {number} */
  function nuovaNotte() {
    const k = regole.piani?.campo_notte;
    avanzamento[k] += 1;
    emetti('narrativa.notte', { notte: avanzamento[k] });
    salva();
    return avanzamento[k];
  }

  /**
   * Imposta un campo booleano dell'avanzamento (fucina aperta, identità restituita).
   * @param {string} campo
   * @param {boolean} valore
   * @returns {boolean} falso se il campo non è booleano
   */
  function segnaAvanzamento(campo, valore) {
    if (avanzamentoDef[campo]?.tipo !== 'booleano') {
      errore(`segnaAvanzamento: '${campo}' non è un campo booleano`);
      return false;
    }
    avanzamento[campo] = Boolean(valore);
    emetti('narrativa.avanzamento', { campo, valore: avanzamento[campo] });
    salva();
    return true;
  }

  /** Piano di un capitolo (ordine), o null se ignoto o se è il capitolo dopo il finale. */
  function pianoDi(capitolo) {
    const c = (storia.capitoli ?? []).find((x) => x.id === capitolo);
    return c && c.id !== capitoloDopoFinale ? c.ordine : null;
  }

  // ---- avvio ------------------------------------------------------------------------------------
  if (salvataggio) {
    const dati = salvataggio.carica('profilo', slot);
    if (dati) ripristina(dati);
  }

  return {
    flag: flagCorrenti,
    avanzamento: avanzamentoCorrente,
    derivati: derivatiCorrenti,
    stato,
    schema: () => ({ ...schema }),
    decisioni: () => decisioni.slice(),
    decidi,
    imposta,
    disponibile,
    disponibili,
    disponibiliPer,
    obbligatorieNonViste,
    battute,
    segnaVista,
    registraBoss,
    raggiungiPiano,
    nuovaNotte,
    segnaAvanzamento,
    pianoDi,
    pianoMassimo: () => pianoMassimo,
    serializza,
    ripristina,
    scena: (id) => (perId.has(id) ? { ...perId.get(id) } : null),
    errori: () => erroriSchema.slice(),
  };
}
