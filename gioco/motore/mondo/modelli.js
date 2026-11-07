/**
 * motore/mondo/modelli.js — Modelli di stanza: legenda, geometria, validazione, catalogo (Core).
 *
 * Implementa stanze-porte.md regole 1, 3, 4, 13, 25 e 28 (storie 014 e 017). Un modello è un file
 * JSON in `contenuti/modelli-stanza/<quartiere>/` (nessun modello nel codice): griglia di caratteri
 * (una riga per riga di celle), punti di nascita, tavolozza dei nemici, difficoltà, piani, tag.
 * Qui si traduce la griglia in ostacoli/pericoli/terreni con i flag `ferma_passo`/`ferma_volo`/
 * `ferma_colpi`, si calcolano gli slot delle porte e il vestibolo per la dimensione (1x1, 2x1) e si
 * valida il modello: una violazione della regola 25 è un ERRORE di contenuto (con id e cella), non un
 * avviso. Il catalogo filtra per tipo, dimensione e piano (generazione-piani.md regola 19).
 *
 * Funzioni pure, senza DOM: il caricamento riceve il caricatore (fetch o lettura da disco) da fuori.
 * Nessun numero di gioco: dimensioni e soglie arrivano dai parametri (`stanza.*`, `stanze.*`).
 */

/** I sette tipi di stanza (stanze-porte.md regola 9). */
export const TIPI_STANZA = Object.freeze(['ingresso', 'normale', 'tesoro', 'banchetto', 'boss', 'segreta', 'ricordo']);

/** Dimensioni ammesse (regola 1). */
export const DIMENSIONI = Object.freeze(['1x1', '2x1']);

/** Tipi di nemico ammessi nell'MVP (regola 19; nemici.md). */
export const ARCHETIPI = Object.freeze(['gatto', 'vespa', 'statua', 'guardia']);

/** Tag di difficoltà richiesto a ogni modello (storia 017): il nome per `difficolta` 1..5. */
export const TAG_DIFFICOLTA = Object.freeze({ 1: 'facile', 2: 'media', 3: 'dura', 4: 'durissima', 5: 'picco' });

/**
 * Legenda della griglia (regola 28) con i flag della regola 13. `vita` è il nome della voce in
 * `stanze.vita.*` per gli ostacoli distruttibili. I pericoli e i terreni non sono ostacoli: il
 * braciere ha un piede che ferma il passo (non i colpi né il volo).
 */
export const LEGENDA = Object.freeze({
  '.': Object.freeze({ genere: 'pavimento' }),
  C: Object.freeze({ genere: 'ostacolo', id: 'colonna', ferma_passo: true, ferma_volo: true, ferma_colpi: true, vita: null }),
  K: Object.freeze({ genere: 'ostacolo', id: 'colonna_crepata', ferma_passo: true, ferma_volo: true, ferma_colpi: true, vita: 'colonna_crepata' }),
  P: Object.freeze({ genere: 'ostacolo', id: 'panca', ferma_passo: true, ferma_volo: false, ferma_colpi: false, vita: null }),
  X: Object.freeze({ genere: 'ostacolo', id: 'cassa', ferma_passo: true, ferma_volo: false, ferma_colpi: true, vita: 'cassa' }),
  G: Object.freeze({ genere: 'ostacolo', id: 'grata', ferma_passo: true, ferma_volo: false, ferma_colpi: false, vita: null }),
  H: Object.freeze({ genere: 'ostacolo', id: 'siepe', ferma_passo: true, ferma_volo: true, ferma_colpi: true, vita: 'siepe' }),
  L: Object.freeze({ genere: 'ostacolo', id: 'telaio', ferma_passo: true, ferma_volo: true, ferma_colpi: true, vita: null }),
  B: Object.freeze({ genere: 'ostacolo', id: 'banco', ferma_passo: true, ferma_volo: false, ferma_colpi: true, vita: null }),
  S: Object.freeze({ genere: 'ostacolo', id: 'statua_dormiente', ferma_passo: true, ferma_volo: true, ferma_colpi: true, vita: null }),
  W: Object.freeze({ genere: 'terreno', id: 'pozza' }),
  R: Object.freeze({ genere: 'terreno', id: 'rigagnolo' }),
  F: Object.freeze({ genere: 'pericolo', id: 'braciere', ferma_passo: true, ferma_volo: false, ferma_colpi: false }),
  h: Object.freeze({ genere: 'pericolo', id: 'siepe_spinosa', ferma_passo: false, ferma_volo: false, ferma_colpi: false }),
});

/** Versori dei quattro lati. */
export const VERSO_LATO = Object.freeze({
  N: Object.freeze({ x: 0, y: -1 }),
  E: Object.freeze({ x: 1, y: 0 }),
  S: Object.freeze({ x: 0, y: 1 }),
  W: Object.freeze({ x: -1, y: 0 }),
});

/** Lato opposto. */
export const LATO_OPPOSTO = Object.freeze({ N: 'S', S: 'N', E: 'W', W: 'E' });

/**
 * Geometria di una stanza: colonne effettive e slot delle porte (regola 3). Gli slot sono celle
 * nel muro (riga −1 / `righe`, colonna −1 / `colonne`). La doppia ha N0/S0 sulla metà sinistra e
 * N1/S1 sulla destra; W sulla sinistra, E sulla destra.
 * @param {{ dim: string, colonne: number, righe: number }} o `colonne` è quella della stanza 1x1
 * @returns {{ colonne: number, righe: number, meta: number, slots: Record<string, { c: number, r: number, lato: string, meta: number }> }}
 */
export function geometriaStanza({ dim, colonne, righe }) {
  const larghe = dim === '2x1' ? colonne * 2 : colonne;
  const cN = Math.floor(colonne / 2);
  const rW = Math.floor(righe / 2);
  const slots = dim === '2x1'
    ? {
      N0: { c: cN, r: -1, lato: 'N', meta: 0 },
      N1: { c: colonne + cN, r: -1, lato: 'N', meta: 1 },
      S0: { c: cN, r: righe, lato: 'S', meta: 0 },
      S1: { c: colonne + cN, r: righe, lato: 'S', meta: 1 },
      W: { c: -1, r: rW, lato: 'W', meta: 0 },
      E: { c: larghe, r: rW, lato: 'E', meta: 1 },
    }
    : {
      N: { c: cN, r: -1, lato: 'N', meta: 0 },
      E: { c: larghe, r: rW, lato: 'E', meta: 0 },
      S: { c: cN, r: righe, lato: 'S', meta: 0 },
      W: { c: -1, r: rW, lato: 'W', meta: 0 },
    };
  return { colonne: larghe, righe, meta: colonne, slots };
}

/**
 * Le `n` celle interne davanti a uno slot (regola 4), dalla più vicina alla porta.
 * @param {{ c: number, r: number, lato: string }} slot
 * @param {number} n `vestibolo_celle`
 * @returns {{ c: number, r: number }[]}
 */
export function vestiboloDi(slot, n) {
  const v = VERSO_LATO[slot.lato];
  const celle = [];
  for (let i = 1; i <= n; i++) celle.push({ c: slot.c - v.x * i, r: slot.r - v.y * i });
  return celle;
}

/**
 * Traduce la griglia del modello in liste di ostacoli, pericoli, terreni e contenuti.
 * @param {object} modello
 * @returns {{ ostacoli: object[], pericoli: object[], terreni: object[], contenuti: object[], errori: string[] }}
 */
export function analizzaGriglia(modello) {
  const ostacoli = [];
  const pericoli = [];
  const terreni = [];
  const errori = [];
  const griglia = Array.isArray(modello?.griglia) ? modello.griglia : [];
  for (let r = 0; r < griglia.length; r++) {
    const riga = String(griglia[r]);
    for (let c = 0; c < riga.length; c++) {
      const simbolo = riga[c];
      const voce = LEGENDA[simbolo];
      if (!voce) {
        errori.push(`${modello.id}: simbolo sconosciuto '${simbolo}' in (${c}, ${r})`);
        continue;
      }
      if (voce.genere === 'ostacolo') ostacoli.push({ c, r, ...voce, simbolo });
      else if (voce.genere === 'pericolo') pericoli.push({ c, r, ...voce, simbolo });
      else if (voce.genere === 'terreno') terreni.push({ c, r, ...voce, simbolo });
    }
  }
  const contenuti = Array.isArray(modello?.contenuti) ? modello.contenuti.map((x) => ({ ...x })) : [];
  return { ostacoli, pericoli, terreni, contenuti, errori };
}

/**
 * Valida un modello (regola 25 e storia 017). Restituisce la lista degli errori, vuota se valido.
 * Controlla: campi obbligatori e tipi; griglia 13×7 o 26×7; simboli noti; vestiboli liberi; porte
 * raggiungibili l'una dall'altra su celle libere da `ferma_passo` e da pericoli; celle di spawn
 * libere, raggiungibili dalle porte, a `d_porta_min` da ogni slot, almeno `spawn_min`; tavolozza con
 * tipi noti; `difficolta` 1..5 con il tag corrispondente; `scena_id` per il tipo `ricordo`.
 * @param {object} modello
 * @param {{ colonne: number, righe: number, cella: number, vestiboloCelle: number, spawnMin1x1: number, spawnMin2x1: number, dPortaMin: number }} regole
 * @returns {string[]}
 */
export function validaModello(modello, regole) {
  const errori = [];
  const id = modello?.id ?? '(senza id)';
  if (!modello || typeof modello !== 'object') return [`${id}: il modello non è un oggetto`];
  if (typeof modello.id !== 'string' || !modello.id) errori.push(`${id}: manca 'id'`);
  if (!TIPI_STANZA.includes(modello.tipo)) errori.push(`${id}: tipo sconosciuto '${modello.tipo}'`);
  if (!DIMENSIONI.includes(modello.dim)) errori.push(`${id}: dim sconosciuta '${modello.dim}'`);
  if (!Array.isArray(modello.piani) || modello.piani.length === 0 || !modello.piani.every((p) => Number.isInteger(p) && p >= 1 && p <= 5)) {
    errori.push(`${id}: 'piani' deve essere una lista di interi 1..5`);
  }
  if (!Number.isInteger(modello.difficolta) || modello.difficolta < 1 || modello.difficolta > 5) {
    errori.push(`${id}: 'difficolta' deve essere un intero 1..5`);
  } else if (!Array.isArray(modello.tag) || !modello.tag.includes(TAG_DIFFICOLTA[modello.difficolta])) {
    errori.push(`${id}: manca il tag di difficoltà '${TAG_DIFFICOLTA[modello.difficolta]}'`);
  }
  if (typeof modello.peso_base !== 'number' || !(modello.peso_base > 0)) errori.push(`${id}: 'peso_base' deve essere un numero > 0`);
  if (modello.tipo === 'ricordo' && (typeof modello.scena_id !== 'string' || !modello.scena_id)) errori.push(`${id}: la stanza-ricordo richiede 'scena_id'`);
  if (!Array.isArray(modello.spawn)) errori.push(`${id}: 'spawn' deve essere una lista`);
  if (!Array.isArray(modello.tavolozza)) errori.push(`${id}: 'tavolozza' deve essere una lista`);
  if (errori.length) return errori;

  const geo = geometriaStanza({ dim: modello.dim, colonne: regole.colonne, righe: regole.righe });
  const griglia = modello.griglia;
  if (!Array.isArray(griglia) || griglia.length !== geo.righe || griglia.some((riga) => String(riga).length !== geo.colonne)) {
    errori.push(`${id}: la griglia deve essere ${geo.colonne}×${geo.righe}`);
    return errori;
  }
  const analisi = analizzaGriglia(modello);
  errori.push(...analisi.errori);
  if (errori.length) return errori;

  const chiave = (c, r) => `${c},${r}`;
  const bloccate = new Set();
  for (const o of analisi.ostacoli) if (o.ferma_passo) bloccate.add(chiave(o.c, o.r));
  for (const p of analisi.pericoli) bloccate.add(chiave(p.c, p.r)); // zona di pericolo: mai attraversata dal cammino sicuro
  const occupate = new Set([
    ...analisi.ostacoli.map((o) => chiave(o.c, o.r)),
    ...analisi.pericoli.map((p) => chiave(p.c, p.r)),
    ...analisi.terreni.map((t) => chiave(t.c, t.r)),
  ]);

  // vestiboli liberi (regola 4): per tutti gli slot, anche senza porta
  const vestibolo = new Set();
  for (const [nome, slot] of Object.entries(geo.slots)) {
    for (const cella of vestiboloDi(slot, regole.vestiboloCelle)) {
      vestibolo.add(chiave(cella.c, cella.r));
      if (occupate.has(chiave(cella.c, cella.r))) errori.push(`${id}: vestibolo dello slot ${nome} occupato in (${cella.c}, ${cella.r})`);
    }
  }

  // raggiungibilità: BFS su celle libere dalla prima cella del vestibolo di ogni slot
  const libera = (c, r) => c >= 0 && r >= 0 && c < geo.colonne && r < geo.righe && !bloccate.has(chiave(c, r));
  const raggiungibili = (partenza) => {
    const viste = new Set([chiave(partenza.c, partenza.r)]);
    const coda = [partenza];
    while (coda.length) {
      const { c, r } = coda.shift();
      for (const v of Object.values(VERSO_LATO)) {
        const nc = c + v.x;
        const nr = r + v.y;
        if (libera(nc, nr) && !viste.has(chiave(nc, nr))) {
          viste.add(chiave(nc, nr));
          coda.push({ c: nc, r: nr });
        }
      }
    }
    return viste;
  };
  const ingressi = Object.entries(geo.slots).map(([nome, slot]) => ({ nome, cella: vestiboloDi(slot, 1)[0] }));
  const daPrimo = raggiungibili(ingressi[0].cella);
  for (const i of ingressi.slice(1)) {
    if (!daPrimo.has(chiave(i.cella.c, i.cella.r))) errori.push(`${id}: la porta ${i.nome} non è raggiungibile dalla porta ${ingressi[0].nome}`);
  }

  // spawn: celle libere, non nel vestibolo, raggiungibili, lontane dagli slot, in numero sufficiente
  const spawnMin = modello.dim === '2x1' ? regole.spawnMin2x1 : regole.spawnMin1x1;
  const combattimento = modello.tipo === 'normale';
  if (combattimento && modello.spawn.length < spawnMin) errori.push(`${id}: ${modello.spawn.length} punti di nascita, minimo ${spawnMin}`);
  if (combattimento && modello.tavolozza.length === 0) errori.push(`${id}: una stanza di combattimento richiede una tavolozza`);
  const vistiSpawn = new Set();
  for (const s of modello.spawn) {
    if (!Number.isInteger(s?.c) || !Number.isInteger(s?.r) || !['T', 'V'].includes(s?.tipo)) {
      errori.push(`${id}: punto di nascita non valido ${JSON.stringify(s)}`);
      continue;
    }
    const k = chiave(s.c, s.r);
    if (vistiSpawn.has(k)) errori.push(`${id}: punto di nascita duplicato in (${s.c}, ${s.r})`);
    vistiSpawn.add(k);
    if (!libera(s.c, s.r) || occupate.has(k)) errori.push(`${id}: punto di nascita su ostacolo, pericolo o fuori griglia in (${s.c}, ${s.r})`);
    else if (vestibolo.has(k)) errori.push(`${id}: punto di nascita nel vestibolo in (${s.c}, ${s.r})`);
    else if (!daPrimo.has(k)) errori.push(`${id}: punto di nascita non raggiungibile dalle porte in (${s.c}, ${s.r})`);
    for (const [nome, slot] of Object.entries(geo.slots)) {
      const d = Math.hypot((s.c - slot.c) * regole.cella, (s.r - slot.r) * regole.cella);
      if (d < regole.dPortaMin) errori.push(`${id}: punto di nascita (${s.c}, ${s.r}) a ${d.toFixed(0)} px dallo slot ${nome} (minimo ${regole.dPortaMin})`);
    }
  }
  for (const voce of modello.tavolozza) {
    if (!ARCHETIPI.includes(voce?.tipo)) errori.push(`${id}: tipo di nemico sconosciuto '${voce?.tipo}' nella tavolozza`);
    if (!(voce?.peso >= 0) || !Number.isInteger(voce?.min) || !Number.isInteger(voce?.max) || voce.min > voce.max) {
      errori.push(`${id}: voce di tavolozza non valida ${JSON.stringify(voce)}`);
    }
  }
  return errori;
}

/**
 * Regole di validazione lette dai parametri (così il chiamante non conosce i nomi delle chiavi).
 * @param {{ get: (chiave: string) => any }} parametri
 */
export function regoleDaParametri(parametri) {
  return {
    colonne: parametri.get('stanza.colonne'),
    righe: parametri.get('stanza.righe'),
    cella: parametri.get('stanza.cella'),
    vestiboloCelle: parametri.get('stanze.vestibolo_celle'),
    spawnMin1x1: parametri.get('stanze.spawn_min_1x1'),
    spawnMin2x1: parametri.get('stanze.spawn_min_2x1'),
    dPortaMin: parametri.get('stanze.d_porta_min'),
  };
}

/**
 * Invariante dei parametri del generatore (generazione-piani.md, formula L_min): `L_min[p] ≤ n_min[p] − 4`.
 * @param {{ get: (chiave: string) => any, ha: (chiave: string) => boolean }} parametri
 * @returns {string[]} errori con il nome del parametro
 */
export function validaParametriGenerazione(parametri) {
  const errori = [];
  for (let p = 1; p <= 5; p++) {
    if (!parametri.ha(`generazione.piani.p${p}.n_min`)) continue;
    const nMin = parametri.get(`generazione.piani.p${p}.n_min`);
    const lMin = parametri.get(`generazione.piani.p${p}.L_min`);
    if (lMin > nMin - 4) errori.push(`generazione.piani.p${p}.L_min (${lMin}) > n_min − 4 (${nMin - 4})`);
  }
  return errori;
}

/**
 * Catalogo dei modelli: lookup per id e filtri per tipo/dimensione/piano (regola 19).
 * @param {object[]} modelli
 */
export function creaCatalogo(modelli) {
  const perId = new Map();
  for (const m of modelli) {
    if (perId.has(m.id)) throw new RangeError(`catalogo: id di modello duplicato '${m.id}'`);
    perId.set(m.id, m);
  }
  return {
    get tutti() { return Array.from(perId.values()); },
    perId: (id) => perId.get(id) ?? null,
    /**
     * @param {{ tipo: string, dim?: string, piano?: number, piani?: number[] }} f
     */
    filtra: ({ tipo, dim = null, piano = null, piani = null }) => Array.from(perId.values()).filter((m) => (
      m.tipo === tipo
      && (dim === null || m.dim === dim)
      && (piano === null || m.piani.includes(piano))
      && (piani === null || piani.some((p) => m.piani.includes(p)))
    )),
    /** Conteggi per tipo e dimensione (per la storia 017 e gli strumenti). */
    conteggi: () => {
      const c = {};
      for (const m of perId.values()) {
        const k = `${m.tipo}/${m.dim}`;
        c[k] = (c[k] ?? 0) + 1;
      }
      return c;
    },
  };
}

/**
 * Carica i modelli elencati in un indice e li valida. Gli errori di contenuto sono raccolti (e
 * loggati) ma non lanciati: chi chiama decide (il generatore richiede un catalogo valido).
 * @param {{
 *   caricatore: (nome: string) => Promise<object> | object,
 *   indice: { modelli: string[] },
 *   regole: ReturnType<typeof regoleDaParametri>,
 *   log?: { error: (...a: unknown[]) => void }
 * }} o `caricatore(nome)` restituisce il JSON del file `<nome>.json`
 * @returns {Promise<{ modelli: object[], errori: string[] }>}
 */
export async function caricaModelli({ caricatore, indice, regole, log = console }) {
  const modelli = [];
  const errori = [];
  if (!indice || !Array.isArray(indice.modelli)) return { modelli, errori: ['indice dei modelli senza la lista `modelli`'] };
  for (const nome of indice.modelli) {
    let m;
    try {
      m = await caricatore(nome);
    } catch (e) {
      errori.push(`${nome}: impossibile caricare (${e?.message ?? e})`);
      continue;
    }
    const e = validaModello(m, regole);
    if (e.length) errori.push(...e);
    else modelli.push(m);
  }
  for (const e of errori) log.error(`[modelli] errore di contenuto: ${e}`);
  return { modelli, errori };
}
