/**
 * motore/oggetti/ricordi.js — I ricordi: doni azzurri con un volto (GDD ricordi-scelta.md regole 1-4
 * e 7, stati Nel Velo → In mano → Ceduto | Tenuto → Deciso). Storia 028: il Medaglione di Rosa.
 *
 * Un ricordo è un dono del catalogo (`doni.json`, categoria `ricordi`: il bonus_tenuto sono i suoi
 * `modificatori`, l'HUD lo mostra azzurro) più i campi di `contenuti/parametri/ricordi.json`:
 * `persona`, `flag`, `scena_scelta`, `boss`, `valore_restituzione`, `effetto_ceduto`. Il modulo non
 * conosce nomi di doni, flag, scene o boss: li legge dai file e ne verifica la coerenza con storia.json.
 *
 * - **Cade** (`boss.sconfitto` {id, x?, y?}; id del boss di storia.json o `archetipo_boss`): se il flag è
 *   ancora `null`, il ricordo non è già in mano né a terra e il profilo non lo ha restituito, il ricordo
 *   cade a terra nella stanza corrente (al punto dato o su Ferruccio) → `ricordi.caduto`; altrimenti
 *   `ricordi.nessuno` {boss, motivo} (chi gestisce il boss, storia 022, lascia un dono d'oro dal pool: regola 7).
 * - **Raccolta** (`tick()`): passando entro `r_raccolta` → `modificatori.aggiungiDono(id)` → `ricordi.raccolto`
 *   (il cartiglio e la goccia azzurra dell'HUD arrivano da `doni.aggiunto`, `interfaccia/doni.js`).
 * - **Scelta** (regola 3): `puoAprire(scena)` risponde falso per la scena di scelta di un ricordo che
 *   non è in mano (iniettato in `storia/incontri.js`); etichette e `cosa_sacrifica` sono di storia.json.
 * - **Decisione** (`narrativa.decisione` {flag, valore}, dallo stato narrativo dopo `decidi`): con il
 *   ricordo in mano, `valore_restituzione` lo CEDE (dono tolto, bonus finito, scintille di `effetto_ceduto`
 *   al profilo, `profilo.restituisci(id)`) → `ricordi.ceduto`; ogni altro valore lo TIENE (bonus fino a
 *   fine notte) → `ricordi.tenuto`. Una decisione forzata (QA) senza ricordo in mano non ha effetti.
 * - **Perdita** (regola 4): `ferruccio.morto` e `economia.fine_notte` (fine della run, non del piano: scendendo di piano il
 *   ricordo resta addosso, storia P03) tolgono i ricordi in mano e a terra senza toccare i flag (`ricordi.perso` {motivo}):
 *   alla prossima vittoria il boss lo lascia di nuovo.
 * Nessun numero e nessuna stringa di gioco qui. Dipendenze (iniettate): `parametri`, catalogo, storia,
 * stato narrativo, modificatori, profilo, economia (scintille), Ferruccio, bus degli eventi.
 */

/** Nomi degli eventi emessi (verso l'alto). */
export const EVENTI_RICORDI = Object.freeze({
  caduto: 'ricordi.caduto', raccolto: 'ricordi.raccolto', ceduto: 'ricordi.ceduto', tenuto: 'ricordi.tenuto', perso: 'ricordi.perso', nessuno: 'ricordi.nessuno',
});

/** Motivi di `ricordi.nessuno` e di `ricordi.perso` (codici stabili, non testo di gioco). */
export const MOTIVI_RICORDI = Object.freeze({
  bossIgnoto: 'boss_ignoto', deciso: 'deciso', inMano: 'in_mano', aTerra: 'a_terra', restituito: 'gia_restituito', morte: 'morte', fineNotte: 'fine_notte',
});

/** Categoria del catalogo dei doni che marca i ricordi (convenzione di doni.json, non testo di gioco). */
const CATEGORIA_RICORDI = 'ricordi';

const eNumero = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Costruisce il modello di un ricordo unendo il dono del catalogo e la voce di ricordi.json.
 * @param {object} dono voce di doni.json
 * @param {object} def voce di ricordi.json › ricordi[id]
 * @returns {object} modello congelato
 */
export function modelloRicordo(dono, def) {
  return Object.freeze({
    id: dono.id,
    nome: dono.nome,
    cartiglio: dono.cartiglio,
    sagoma: dono.sagoma ? { ...dono.sagoma } : null,
    persona: def.persona,
    flag: def.flag,
    scena_scelta: def.scena_scelta,
    boss: def.boss,
    archetipo_boss: def.archetipo_boss ?? null,
    valore_restituzione: def.valore_restituzione,
    bonus_tenuto: (dono.modificatori ?? []).map((m) => ({ ...m })),
    effetto_ceduto: { scintille: def.effetto_ceduto?.scintille?.base ?? 0 },
  });
}

/**
 * Valida ricordi.json contro il catalogo e storia.json e costruisce i modelli.
 * @param {{ tabella: object, catalogo: object[], storia?: object | null }} o
 * @returns {{ errori: string[], modelli: Map<string, object> }}
 */
export function validaRicordi({ tabella, catalogo, storia = null }) {
  const errori = [];
  const modelli = new Map();
  const voci = tabella?.ricordi;
  if (!voci || typeof voci !== 'object') return { errori: ['ricordi.json: manca `ricordi`'], modelli };
  if (!eNumero(tabella.r_raccolta?.base)) errori.push('ricordi.json: r_raccolta deve essere {base,min,max}');
  const perId = new Map((catalogo ?? []).map((d) => [d.id, d]));
  const scene = new Map((storia?.scene ?? []).map((s) => [s.id, s]));
  const boss = new Set((storia?.boss ?? []).map((b) => b.id));
  for (const [id, def] of Object.entries(voci)) {
    if (id.startsWith('_')) continue;
    const dove = `ricordo '${id}'`;
    const miei = [];
    const dono = perId.get(id);
    if (!dono) miei.push(`${dove}: non è un dono del catalogo`);
    else if (dono.categoria !== CATEGORIA_RICORDI) miei.push(`${dove}: il dono non ha categoria '${CATEGORIA_RICORDI}'`);
    for (const campo of ['persona', 'flag', 'scena_scelta', 'boss', 'valore_restituzione']) {
      if (typeof def?.[campo] !== 'string' || def[campo] === '') miei.push(`${dove}: manca '${campo}'`);
    }
    if (!eNumero(def?.effetto_ceduto?.scintille?.base) || def.effetto_ceduto.scintille.base < 0) miei.push(`${dove}: effetto_ceduto.scintille deve essere {base,min,max} ≥ 0`);
    if (dono?.scelta) {
      if (dono.scelta.id_scena !== def?.scena_scelta) miei.push(`${dove}: scena_scelta '${def?.scena_scelta}' ≠ catalogo '${dono.scelta.id_scena}'`);
      if (dono.scelta.flag !== def?.flag) miei.push(`${dove}: flag '${def?.flag}' ≠ catalogo '${dono.scelta.flag}'`);
      if (dono.scelta.valore_restituzione !== def?.valore_restituzione) miei.push(`${dove}: valore_restituzione '${def?.valore_restituzione}' ≠ catalogo '${dono.scelta.valore_restituzione}'`);
    }
    if (storia) {
      const f = storia.flag?.[def?.flag];
      if (!f) miei.push(`${dove}: flag '${def?.flag}' ignoto a storia.json`);
      else if (!(f.valori ?? []).includes(def?.valore_restituzione)) miei.push(`${dove}: '${def?.valore_restituzione}' non è un valore di '${def?.flag}'`);
      const s = scene.get(def?.scena_scelta);
      if (!s) miei.push(`${dove}: scena '${def?.scena_scelta}' ignota`);
      else if (s.scelta?.flag !== def?.flag) miei.push(`${dove}: la scena '${def?.scena_scelta}' non decide '${def?.flag}'`);
      if (boss.size > 0 && !boss.has(def?.boss)) miei.push(`${dove}: boss '${def?.boss}' ignoto`);
      if (storia.personaggi && def?.persona && !storia.personaggi[def.persona]) miei.push(`${dove}: persona '${def.persona}' ignota`);
    }
    if (miei.length) errori.push(...miei);
    else modelli.set(id, modelloRicordo(dono, def));
  }
  return { errori, modelli };
}

/**
 * Crea il modulo dei ricordi.
 * @param {{
 *   parametri: { get: (chiave: string) => unknown },        ricordi.json come tabella (`get('ricordi')`)
 *   catalogo: object[],                                     doni.json › doni
 *   storia?: object | null,                                 contenuti/storia.json (verifica di coerenza)
 *   narrativa: { flag: () => Record<string, string|null> }, stato narrativo
 *   modificatori: { aggiungiDono: Function, rimuoviDono: Function, doniAttivi: () => string[] },
 *   profilo: { restituisci: Function, ricordiRestituiti: string[] },
 *   economia?: { aggiungiScintille: (n: number, motivo?: string) => number } | null,
 *   ferruccio?: { x: number, y: number } | null,
 *   eventi: { on: Function, emit: Function },
 *   stanza?: string | null,                                 stanza corrente iniziale (poi `notte.stanza`)
 *   log?: { error: Function }
 * }} o
 */
export function creaRicordi({ parametri, catalogo, storia = null, narrativa, modificatori, profilo, economia = null, ferruccio = null, eventi, stanza = null, log = console }) {
  if (!parametri || typeof parametri.get !== 'function') throw new TypeError('creaRicordi: mancano i parametri');
  if (!Array.isArray(catalogo)) throw new TypeError('creaRicordi: manca il catalogo dei doni');
  if (!narrativa || typeof narrativa.flag !== 'function') throw new TypeError('creaRicordi: manca lo stato narrativo');
  if (!modificatori || typeof modificatori.aggiungiDono !== 'function') throw new TypeError('creaRicordi: mancano i modificatori');
  if (!profilo || typeof profilo.restituisci !== 'function') throw new TypeError('creaRicordi: manca il profilo');
  if (!eventi || typeof eventi.on !== 'function') throw new TypeError('creaRicordi: manca il bus degli eventi');
  const tabella = parametri.get('ricordi');
  const { errori, modelli } = validaRicordi({ tabella, catalogo, storia });
  for (const e of errori) log?.error?.(`[ricordi] errore di contenuto: ${e}`);
  const R = (nome) => tabella?.[nome]?.base;
  const emetti = (nome, payload) => eventi.emit(nome, payload);

  const perBoss = new Map();
  const perFlag = new Map();
  const perScena = new Map();
  for (const m of modelli.values()) {
    perBoss.set(m.boss, m);
    if (m.archetipo_boss) perBoss.set(m.archetipo_boss, m);
    perFlag.set(m.flag, m);
    perScena.set(m.scena_scelta, m);
  }

  /** @type {Map<string, { id: string, x: number, y: number, stanza: string }>} ricordi caduti, per id */
  const aTerra = new Map();
  let stanzaCorrente = stanza;

  /** Id dei ricordi in mano (doni attivi che sono ricordi), in ordine di raccolta. */
  function inMano() {
    return modificatori.doniAttivi().filter((id) => modelli.has(id));
  }

  /**
   * Il boss `idBoss` si è dissolto: lascia il suo ricordo se lo stato lo permette.
   * @param {string} idBoss id di storia.json o archetipo
   * @param {{ x?: number, y?: number }} [dove] punto della caduta (default: Ferruccio)
   * @returns {object|null} il ricordo caduto o null (evento `ricordi.nessuno`)
   */
  function cade(idBoss, dove = {}) {
    const m = perBoss.get(idBoss);
    const rifiuta = (motivo) => {
      emetti(EVENTI_RICORDI.nessuno, { boss: idBoss, id: m?.id ?? null, motivo });
      return null;
    };
    if (!m) return rifiuta(MOTIVI_RICORDI.bossIgnoto);
    if (narrativa.flag()[m.flag] !== null) return rifiuta(MOTIVI_RICORDI.deciso);
    if (profilo.ricordiRestituiti.includes(m.id)) return rifiuta(MOTIVI_RICORDI.restituito);
    if (inMano().includes(m.id)) return rifiuta(MOTIVI_RICORDI.inMano);
    if (aTerra.has(m.id)) return rifiuta(MOTIVI_RICORDI.aTerra);
    const x = eNumero(dove.x) ? dove.x : ferruccio?.x ?? 0;
    const y = eNumero(dove.y) ? dove.y : ferruccio?.y ?? 0;
    const voce = { id: m.id, x, y, stanza: stanzaCorrente };
    aTerra.set(m.id, voce);
    emetti(EVENTI_RICORDI.caduto, { ...voce, boss: idBoss, flag: m.flag, persona: m.persona });
    return { ...voce };
  }

  /**
   * Raccoglie il ricordo `id` da terra: entra tra i doni (bonus_tenuto attivo).
   * @param {string} id
   * @returns {boolean}
   */
  function raccogli(id) {
    const voce = aTerra.get(id);
    if (!voce) return false;
    if (!modificatori.aggiungiDono(id)) return false;
    aTerra.delete(id);
    const m = modelli.get(id);
    emetti(EVENTI_RICORDI.raccolto, { id, x: voce.x, y: voce.y, stanza: voce.stanza, flag: m.flag, persona: m.persona, bonus_tenuto: m.bonus_tenuto });
    return true;
  }

  /** Un tick: Ferruccio raccoglie il primo ricordo a terra entro `r_raccolta` nella stanza corrente. */
  function tick() {
    if (!ferruccio || aTerra.size === 0) return;
    const r = R('r_raccolta');
    for (const voce of aTerra.values()) {
      if (voce.stanza !== stanzaCorrente) continue;
      if (Math.hypot(voce.x - ferruccio.x, voce.y - ferruccio.y) > r) continue;
      raccogli(voce.id);
      return;
    }
  }

  /**
   * Regola 3: la scena di scelta di un ricordo si apre solo con il ricordo in mano; ogni altra scena sì.
   * @param {{ id: string }} scena
   */
  function puoAprire(scena) {
    const m = perScena.get(scena?.id);
    return !m || inMano().includes(m.id);
  }

  /** Decisione presa sul flag di un ricordo in mano: cede o tiene. */
  function suDecisione(p) {
    const m = perFlag.get(p?.flag);
    if (!m || !inMano().includes(m.id)) return;
    if (p.valore === m.valore_restituzione) {
      modificatori.rimuoviDono(m.id);
      profilo.restituisci(m.id);
      const scintille = economia ? economia.aggiungiScintille(m.effetto_ceduto.scintille, 'ricordo') : 0;
      emetti(EVENTI_RICORDI.ceduto, { id: m.id, flag: m.flag, valore: p.valore, persona: m.persona, scintille });
    } else {
      emetti(EVENTI_RICORDI.tenuto, { id: m.id, flag: m.flag, valore: p.valore, persona: m.persona });
    }
  }

  /**
   * Toglie ogni ricordo in mano e a terra senza toccare i flag (morte, fine della notte).
   * @param {string} motivo
   * @returns {string[]} id tolti
   */
  function perdi(motivo) {
    const tolti = [];
    for (const id of inMano()) {
      modificatori.rimuoviDono(id);
      tolti.push(id);
    }
    for (const id of aTerra.keys()) tolti.push(id);
    aTerra.clear();
    if (tolti.length > 0) emetti(EVENTI_RICORDI.perso, { ids: tolti, motivo });
    return tolti;
  }

  const disiscrizioni = [
    // storia P06: l'id è quello di boss.json (es. `re-gatto`); se il modello del ricordo non lo conosce vale l'archetipo (`gatto`)
    eventi.on('boss.sconfitto', (p) => {
      if (!p || typeof p.id !== 'string') return;
      const id = !perBoss.has(p.id) && typeof p.archetipo === 'string' && perBoss.has(p.archetipo) ? p.archetipo : p.id;
      cade(id, p);
    }),
    eventi.on('narrativa.decisione', suDecisione),
    eventi.on('ferruccio.morto', () => perdi(MOTIVI_RICORDI.morte)),
    eventi.on('economia.fine_notte', () => perdi(MOTIVI_RICORDI.fineNotte)),
    eventi.on('notte.stanza', (p) => { if (p?.a) stanzaCorrente = p.a; }),
  ];

  return {
    cade,
    raccogli,
    tick,
    puoAprire,
    perdi,
    inMano,
    /** Ricordi caduti e non ancora raccolti (copie), tutti o della stanza data. */
    aTerra: (stanzaId = null) => Array.from(aTerra.values()).filter((v) => stanzaId === null || v.stanza === stanzaId).map((v) => ({ ...v })),
    /** Modello di un ricordo per id di dono, o null. */
    modello: (id) => modelli.get(id) ?? null,
    /** Modello del ricordo di un boss (id di storia.json o archetipo), o null. */
    perBoss: (idBoss) => perBoss.get(idBoss) ?? null,
    /** Modello del ricordo deciso da un flag, o null. */
    perFlag: (flag) => perFlag.get(flag) ?? null,
    /** Tutti i modelli, nell'ordine del file. */
    modelli: () => Array.from(modelli.values()),
    /** Imposta la stanza corrente (la notte lo fa via `notte.stanza`; qui per i test e la scena wire). */
    entraIn: (id) => { stanzaCorrente = id; },
    get stanzaCorrente() { return stanzaCorrente; },
    errori: () => errori.slice(),
    /** Toglie gli ascoltatori (test). */
    distruggi: () => { for (const d of disiscrizioni) d?.(); disiscrizioni.length = 0; },
    /** Fotografia per il debug. */
    stato: () => ({ inMano: inMano(), aTerra: Array.from(aTerra.values()).map((v) => ({ ...v })), stanza: stanzaCorrente }),
  };
}
