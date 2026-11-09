/**
 * motore/mondo/stanza.js — La singola stanza montata da un modello (Core, GDD stanze-porte.md).
 *
 * Storia 014 (e formule usate dalla 016). Da un record della pianta (tipo, modello, seme_stanza,
 * profondità, porte, finestre) e dal modello JSON costruisce il campo (mura segmentate, porte con
 * stato, finestre, ostacoli con `ferma_passo`/`ferma_colpi`, piedi dei bracieri) DENTRO il campo
 * condiviso passato da fuori (lo sostituisce in loco: Ferruccio, combattimento e fantocci lo tengono
 * per riferimento), e fa girare la macchina a stati della stanza (tabella «Stato della stanza»):
 *   non_visitata → annuncio (segnalini; a `t_chiusura_porte` le porte si chiudono) → ondata_k ⇄
 *   intervallo → svuotata (ricompensa a `t_ricompensa`) → pulita (porte riaperte a
 *   `t_ritardo_apertura`); una stanza senza nemici è pulita alla prima visita; una stanza pulita
 *   resta pulita (regola 26); uscire prima della comparsa la riporta a non_visitata (regola 6).
 * Nascite (regole 17-22): `n_nemici`, `ondate`, composizione dalla tavolozza, `punto_valido` con
 * anello di sicurezza, distanza dalle porte e tra nascite, permutazione con `rng_spawn`, ricontrollo
 * alla comparsa con `r_sicurezza_apparizione`, attesa fino a `t_ritardo_max_spawn`, poi il punto
 * più lontano mai sotto `r_min_assoluto`. I nemici sono creati dalla factory `creaNemico` iniettata
 * (oggi fantocci con `archetipo`: le storie 019-021 cambiano solo la factory).
 *
 * Storia 018: i pericoli ambientali (regola 16) girano in OGNI stato della stanza, anche `pulita`
 * (`hazard_in_pulita`): il braciere ha il ciclo `riposo → anticipo → attivo` (`stanze.braciere.*`, fase
 * iniziale dal generatore derivato `pericoli` del `seme_stanza`) e solo in `attivo`, se il disco di
 * fiamma `r_fiamma` tocca il corpo di Ferruccio, gli chiede `subisciDanno({danno: danno_pericolo, x, y})`:
 * è Ferruccio a decidere (invulnerabilità, scatto, spinta radiale dal punto del braciere, morte con
 * `hazard_letale`); i nemici non sono toccati (`hazard_danneggia_nemici` = no). La ricompensa pre-estratta
 * (`record.ricompensa.oggetti`) viaggia nell'evento `stanza.ricompensa` con il raggio di dispersione
 * (`r_dispersione_ricompensa`) e il gancio `puntoSicuro(x, y)` che riporta un punto caduto su ostacolo o
 * pericolo alla cella sicura più vicina (regola 24); a lasciare gli oggetti a terra è l'economia (che usa il
 * suo generatore `drop`). `ricompensa_data` resta vero nello stato salvato: al rientro nessuna ricompensa.
 *
 * Storia P01 (PROVVISORIA, build di prova per l'autore; la storia 022 la sostituisce): la stanza di tipo
 * `boss` combatte una sola ondata con un solo nemico, nato dal punto del contenuto `boss` del modello con
 * l'archetipo scritto lì (`archetipo`, es. gatto) e il flag `boss: true` passato alla factory (che applica
 * la taglia di `nemici.boss_provvisorio`); porte chiuse come una stanza normale; quando il boss muore la
 * stanza emette `boss.sconfitto` {id: archetipo, x, y} (lo ascoltano i ricordi: cade il Medaglione) e passa
 * per `svuotata → pulita` come le altre (il bottino del boss lo dà l'economia dal payload `boss`). Il
 * contenuto `uscita` (regola 24: un arco al centro) è attivo solo a stanza `pulita`: se Ferruccio resta
 * entro `stanze.uscita.raggio` per `t_attesa` di seguito la stanza emette `piano.completato` {piano, id,
 * x, y} una sola volta. `boss_battuti` dello stato narrativo NON è toccato (è della storia 022).
 *
 * Eventi (verso l'alto): `stanza.entrata`, `stanza.chiusa`, `ondata.inizio`, `nemico.nato`,
 * `stanza.svuotata`, `stanza.ricompensa`, `stanza.pulita`, `stanza.abbandonata`, `stanza.pericolo`,
 * `boss.sconfitto`, `piano.completato`.
 * Nessun numero di gioco: tutto da `stanza.*` e `stanze.*`; nessuna casualità nativa (ADR-0003):
 * `rng_comp`, `rng_spawn`, `rng_ric`, `rng_pericoli` derivano dal `seme_stanza`.
 */

import { creaCampo, cerchioInRettangolo, cerchiSiToccano } from './fisica.js';
import { creaRng, derivato, mescola } from '../fondazione/rng.js';
import { creaPorta } from './porte.js';
import { analizzaGriglia, geometriaStanza, vestiboloDi, VERSO_LATO } from './modelli.js';

/** Stati della stanza. */
export const STATI_STANZA = Object.freeze(['non_visitata', 'annuncio', 'ondata', 'intervallo', 'svuotata', 'pulita']);

/** Transizioni ammesse (tabella del GDD; `non_visitata` è il ritorno della regola 6). */
export const TRANSIZIONI_STANZA = Object.freeze({
  non_visitata: Object.freeze(['annuncio', 'pulita']),
  annuncio: Object.freeze(['ondata', 'non_visitata']),
  ondata: Object.freeze(['intervallo', 'svuotata', 'non_visitata']),
  intervallo: Object.freeze(['ondata', 'non_visitata']),
  svuotata: Object.freeze(['pulita']),
  pulita: Object.freeze([]),
});

/** Tipi che combattono con le ondate della tavolozza. */
export const TIPI_COMBATTIMENTO = Object.freeze(['normale']);

/** Storia P01: tipo della stanza del boss e tipi dei contenuti del modello che la stanza gestisce. */
export const TIPO_BOSS = 'boss';
export const CONTENUTO_BOSS = 'boss';
export const CONTENUTO_USCITA = 'uscita';

/** Fasi del ciclo di un pericolo a tempo (braciere, regola 16). */
export const FASI_PERICOLO = Object.freeze(['riposo', 'anticipo', 'attivo']);

/** Id del pericolo con il ciclo a tempo (legenda `F` di modelli.js). */
export const ID_BRACIERE = 'braciere';

// ---------------------------------------------------------------------------------------------
// Formule (sezione Formulas del GDD), pure e testabili
// ---------------------------------------------------------------------------------------------

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Profondità normalizzata `prof = min(1, d / d_boss)`.
 * @param {number} d
 * @param {number} dBoss
 */
export function profondita(d, dBoss) {
  return dBoss > 0 ? Math.min(1, d / dBoss) : 1;
}

/**
 * Formula `n_nemici`.
 * @param {{ parametri: { get: Function }, p: number, d: number, dBoss: number, diff: number, dim: string, variazione?: number }} o
 */
export function nNemici({ parametri, p, d, dBoss, diff, dim, variazione = 0 }) {
  const S = (k) => parametri.get(`stanze.${k}`);
  const prof = profondita(d, dBoss);
  const moltDim = dim === '2x1' ? S('molt_doppia') : 1;
  const cap = dim === '2x1' ? S('n_cap_2x1') : S('n_cap_1x1');
  let n = Math.round((S(`n_base.p${p}`) + S('k_prof') * prof + S('k_diff') * (diff - 3)) * moltDim) + variazione;
  n = clamp(n, 1, cap);
  if (d <= 1) n = Math.min(n, S(`n_cap_ingresso.p${p}`));
  return n;
}

/**
 * Estrae `var ∈ {−1, 0, +1}` con i pesi `peso_var` (rng_comp).
 * @param {{ get: Function }} parametri
 * @param {() => number} rng
 */
export function estraiVariazione(parametri, rng) {
  const pesi = [parametri.get('stanze.peso_var.meno'), parametri.get('stanze.peso_var.zero'), parametri.get('stanze.peso_var.piu')];
  const tot = pesi[0] + pesi[1] + pesi[2];
  let u = rng() * tot;
  if (u < pesi[0]) return -1;
  u -= pesi[0];
  if (u < pesi[1]) return 0;
  return 1;
}

/**
 * Formula `ondate`: quote per ondata (il resto all'ondata 1).
 * @param {{ parametri: { get: Function }, p: number, n: number }} o
 * @returns {number[]}
 */
export function quoteOndate({ parametri, p, n }) {
  const S = (k) => parametri.get(`stanze.${k}`);
  if (n <= 0) return [];
  const naturali = n <= 3 ? 1 : n <= 7 ? 2 : 3;
  const ondate = Math.min(S(`ondate_max.p${p}`), naturali);
  if (ondate === 1) return [n];
  const quote = [0];
  for (let i = 2; i <= ondate; i++) quote.push(Math.round(n * S(`frazione.o${ondate}.i${i}`)));
  quote[0] = n - quote.slice(1).reduce((a, b) => a + b, 0);
  return quote;
}

/**
 * Composizione dell'ondata dalla tavolozza (regola 19): prima i minimi, poi per pesi fino a `n`
 * rispettando i massimi.
 * @param {{ tavolozza: { tipo: string, peso: number, min: number, max: number }[], n: number, rng: () => number }} o
 * @returns {string[]} archetipi
 */
export function composizione({ tavolozza, n, rng }) {
  const esito = [];
  const conti = new Map(tavolozza.map((v) => [v.tipo, 0]));
  for (const v of tavolozza) {
    for (let i = 0; i < v.min && esito.length < n; i++) {
      esito.push(v.tipo);
      conti.set(v.tipo, conti.get(v.tipo) + 1);
    }
  }
  while (esito.length < n) {
    const ammessi = tavolozza.filter((v) => conti.get(v.tipo) < v.max && v.peso > 0);
    if (ammessi.length === 0) break;
    const tot = ammessi.reduce((a, v) => a + v.peso, 0);
    let u = rng() * tot;
    let scelto = ammessi[ammessi.length - 1];
    for (const v of ammessi) {
      u -= v.peso;
      if (u < 0) { scelto = v; break; }
    }
    esito.push(scelto.tipo);
    conti.set(scelto.tipo, conti.get(scelto.tipo) + 1);
  }
  return esito;
}

/**
 * Formula `valore_ricompensa` (unità); 0 se la stanza non è premiata.
 * @param {{ parametri: { get: Function }, p: number, prof: number, diff: number, molt: number, rng: () => number }} o
 */
export function valoreRicompensa({ parametri, p, prof, diff, molt, rng }) {
  const R = (k) => parametri.get(`stanze.ricompensa.${k}`);
  const pR = clamp(R('p_base') + R('k_pd') * (diff - 3), R('p_min'), R('p_max'));
  if (rng() >= pR) return 0;
  return Math.floor(R(`v_base.p${p}`) * (1 + R('k_vr') * prof) * molt);
}

/**
 * Converte le unità in oggetti (regola 23): si estrae finché restano unità tra i tipi il cui
 * costo sta nel residuo, con i pesi `peso_oggetto`.
 * @param {{ parametri: { get: Function }, valore: number, rng: () => number }} o
 * @returns {{ tipo: string, valore: number }[]}
 */
export function oggettiRicompensa({ parametri, valore, rng }) {
  const costi = parametri.get('stanze.ricompensa.costo_oggetto');
  const pesi = parametri.get('stanze.ricompensa.peso_oggetto');
  const tipi = Object.keys(costi).filter((k) => !k.startsWith('_'));
  const oggetti = [];
  let residuo = valore;
  for (let guardia = 0; residuo > 0 && guardia < 64; guardia++) {
    const ammessi = tipi.filter((t) => costi[t].base <= residuo && pesi[t]?.base > 0);
    if (ammessi.length === 0) break;
    const tot = ammessi.reduce((a, t) => a + pesi[t].base, 0);
    let u = rng() * tot;
    let scelto = ammessi[ammessi.length - 1];
    for (const t of ammessi) {
      u -= pesi[t].base;
      if (u < 0) { scelto = t; break; }
    }
    oggetti.push({ tipo: scelto, valore: costi[scelto].base });
    residuo -= costi[scelto].base;
  }
  return oggetti;
}

/**
 * Fase del ciclo di un braciere al tick `t` (riposo → anticipo → attivo, periodico).
 * @param {{ t: number, riposo: number, anticipo: number, attivo: number }} o durate in tick
 * @returns {{ fase: string, progresso: number }} `progresso` 0→1 dentro la fase
 */
export function fasePericolo({ t, riposo, anticipo, attivo }) {
  const totale = riposo + anticipo + attivo;
  if (totale <= 0) return { fase: FASI_PERICOLO[0], progresso: 0 };
  const u = ((t % totale) + totale) % totale;
  if (u < riposo) return { fase: FASI_PERICOLO[0], progresso: riposo > 0 ? u / riposo : 0 };
  if (u < riposo + anticipo) return { fase: FASI_PERICOLO[1], progresso: anticipo > 0 ? (u - riposo) / anticipo : 0 };
  return { fase: FASI_PERICOLO[2], progresso: attivo > 0 ? (u - riposo - anticipo) / attivo : 0 };
}

/**
 * La cella sicura più vicina a un punto (regola 24): tra le celle libere da ostacoli e pericoli,
 * quella con il centro più vicino; il punto stesso se non è occupato.
 * @param {{ x: number, y: number, occupato: (x: number, y: number) => boolean, celleLibere: { x: number, y: number }[] }} o
 * @returns {{ x: number, y: number }}
 */
export function puntoSicuro({ x, y, occupato, celleLibere }) {
  if (!occupato(x, y)) return { x, y };
  let migliore = { x, y };
  let dMin = Infinity;
  for (const c of celleLibere) {
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < dMin) {
      dMin = d;
      migliore = { x: c.x, y: c.y };
    }
  }
  return migliore;
}

/**
 * Formula `punto_valido` (le esclusioni statiche — vestibolo, ostacoli, pericoli — sono già
 * garantite dal validatore del modello).
 * @param {{
 *   punto: { x: number, y: number }, ferruccio: { x: number, y: number }, r: number,
 *   porte: { x: number, y: number }[], dPortaMin: number,
 *   scelti: { x: number, y: number }[], dMinSpawn: number
 * }} o
 */
export function puntoValido({ punto, ferruccio, r, porte, dPortaMin, scelti, dMinSpawn }) {
  if (Math.hypot(punto.x - ferruccio.x, punto.y - ferruccio.y) < r) return false;
  for (const p of porte) if (Math.hypot(punto.x - p.x, punto.y - p.y) < dPortaMin) return false;
  for (const s of scelti) if (Math.hypot(punto.x - s.x, punto.y - s.y) < dMinSpawn) return false;
  return true;
}

/**
 * Il primo punto valido della permutazione non ancora usato, o `null`.
 * @param {{ permutazione: object[], usati: Set<object> } & Parameters<typeof puntoValido>[0]} o (senza `punto`)
 */
export function primoValido({ permutazione, usati, ...criteri }) {
  for (const punto of permutazione) {
    if (usati.has(punto)) continue;
    if (puntoValido({ punto, ...criteri })) return punto;
  }
  return null;
}

/**
 * Ripiego (edge case «tutti i punti validi sono dentro l'anello»): il punto libero più lontano da
 * Ferruccio, mai a meno di `rMin`; `null` se nemmeno quello esiste.
 * @param {{ punti: object[], usati: Set<object>, ferruccio: { x: number, y: number }, rMin: number }} o
 */
export function piuLontano({ punti, usati, ferruccio, rMin }) {
  let migliore = null;
  let dMax = -1;
  for (const p of punti) {
    if (usati.has(p)) continue;
    const d = Math.hypot(p.x - ferruccio.x, p.y - ferruccio.y);
    if (d >= rMin && d > dMax) {
      dMax = d;
      migliore = p;
    }
  }
  return migliore;
}

// ---------------------------------------------------------------------------------------------
// Costruzione del campo
// ---------------------------------------------------------------------------------------------

/**
 * Rettangoli delle mura (spesse una cella) attorno al campo, saltando le celle di `aperture`
 * (porte e finestre, che hanno il proprio solido). Tratti contigui sono fusi in un rettangolo.
 * @param {{ geo: { colonne: number, righe: number }, cella: number, origine: { x: number, y: number }, aperture: Set<string> }} o
 * @returns {object[]}
 */
export function costruisciMura({ geo, cella, origine, aperture }) {
  const rects = [];
  const rett = (a, b) => ({
    id: 'muro',
    x: origine.x + Math.min(a.c, b.c) * cella,
    y: origine.y + Math.min(a.r, b.r) * cella,
    w: (Math.abs(b.c - a.c) + 1) * cella,
    h: (Math.abs(b.r - a.r) + 1) * cella,
    ferma_passo: true,
    ferma_colpi: true,
  });
  const fondi = (celle) => {
    let inizio = null;
    let prec = null;
    for (const cella of celle) {
      const aperta = aperture.has(`${cella.c},${cella.r}`);
      if (!aperta && inizio === null) inizio = cella;
      if (aperta && inizio !== null) {
        rects.push(rett(inizio, prec));
        inizio = null;
      }
      prec = cella;
    }
    if (inizio !== null) rects.push(rett(inizio, prec));
  };
  const sopra = [];
  const sotto = [];
  for (let c = -1; c <= geo.colonne; c++) {
    sopra.push({ c, r: -1 });
    sotto.push({ c, r: geo.righe });
  }
  const sinistra = [];
  const destra = [];
  for (let r = 0; r < geo.righe; r++) {
    sinistra.push({ c: -1, r });
    destra.push({ c: geo.colonne, r });
  }
  fondi(sopra);
  fondi(sotto);
  fondi(sinistra);
  fondi(destra);
  return rects;
}

// ---------------------------------------------------------------------------------------------
// La stanza
// ---------------------------------------------------------------------------------------------

/**
 * Monta una stanza.
 * @param {{
 *   record: { id: string, tipo: string, dim: string, modello: string, seme_stanza: number, profondita: number,
 *             d_boss: number, porte: Record<string, string>, finestre?: string[], ricompensa?: object, elite?: boolean },
 *   modello: object,
 *   piano: number,
 *   parametri: { get: (chiave: string) => any },
 *   tempo: { ticksDaMs: (ms: number) => number },
 *   eventi: { emit: (nome: string, payload?: unknown) => unknown },
 *   campo: object,
 *   scena: { larghezza: number, altezza: number },
 *   bersagli: object[],
 *   creaNemico: (o: { archetipo: string, x: number, y: number, id: string, boss?: boolean }) => object,
 *   ferruccio: { x: number, y: number, r: number },
 *   statoSalvato?: object | null,
 *   log?: { error: Function }
 * }} o `campo` è l'oggetto condiviso che viene sostituito in loco
 */
export function creaStanza({
  record, modello, piano, parametri, tempo, eventi, campo, scena, bersagli, creaNemico, ferruccio, statoSalvato = null, log = console,
}) {
  if (!record || !modello || !parametri || !tempo || !eventi || !campo || !scena || !bersagli || !creaNemico || !ferruccio) {
    throw new TypeError('creaStanza: dipendenze mancanti');
  }
  const S = (k) => parametri.get(`stanze.${k}`);
  const ticks = (k) => tempo.ticksDaMs(S(k));
  const cella = parametri.get('stanza.cella');
  const geo = geometriaStanza({ dim: modello.dim, colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe') });
  const analisi = analizzaGriglia(modello);
  const rngStanza = creaRng(record.seme_stanza);
  const rngComp = derivato(rngStanza, 'comp');
  const rngSpawn = derivato(rngStanza, 'spawn');
  const rngPericoli = derivato(rngStanza, 'pericoli');

  // campo: base centrata nella scena (creaCampo) con gli ostacoli; mura rifatte attorno alle aperture
  const base = creaCampo({
    colonne: geo.colonne,
    righe: geo.righe,
    cella,
    scenaLarghezza: scena.larghezza,
    scenaAltezza: scena.altezza,
    ostacoli: analisi.ostacoli.map((o) => ({ colonna: o.c, riga: o.r, id: o.id, ferma_passo: o.ferma_passo, ferma_colpi: o.ferma_colpi })),
  });
  const origine = { x: base.x, y: base.y };
  const centroCella = (c, r) => ({ x: origine.x + (c + 0.5) * cella, y: origine.y + (r + 0.5) * cella });
  const rettCella = (c, r) => ({ x: origine.x + c * cella, y: origine.y + r * cella, w: cella, h: cella });

  /** @type {Map<string, ReturnType<typeof creaPorta>>} */
  const porte = new Map();
  const finestre = [];
  const aperture = new Set();
  for (const [slot, verso] of Object.entries(record.porte ?? {})) {
    const def = geo.slots[slot];
    if (!def) throw new RangeError(`stanza ${record.id}: slot di porta sconosciuto '${slot}' per ${modello.dim}`);
    porte.set(slot, creaPorta({ slot, lato: def.lato, verso, rett: rettCella(def.c, def.r), tempo, parametri, eventi, stanza: record.id }));
    aperture.add(`${def.c},${def.r}`);
  }
  for (const slot of record.finestre ?? []) {
    const def = geo.slots[slot];
    if (!def) throw new RangeError(`stanza ${record.id}: slot di finestra sconosciuto '${slot}'`);
    if (porte.has(slot)) throw new RangeError(`stanza ${record.id}: lo slot ${slot} è porta e finestra`);
    finestre.push({ id: 'finestra', slot, lato: def.lato, ...rettCella(def.c, def.r), ferma_passo: true, ferma_colpi: true, vita: S('vita.finestra') });
    aperture.add(`${def.c},${def.r}`);
  }
  const ostacoli = base.solidi.filter((s) => s.id !== 'muro').map((s, i) => Object.assign(s, { indice: i, vita: analisi.ostacoli[i].vita ? S(`vita.${analisi.ostacoli[i].vita}`) : null }));
  // storia 018: ciclo del braciere in tick e fase iniziale a seme (rng_pericoli), così due stanze con lo
  // stesso seme hanno gli stessi bracieri e due bracieri della stessa stanza non vanno all'unisono
  const cicloBraciere = { riposo: ticks('braciere.t_riposo'), anticipo: ticks('braciere.t_anticipo'), attivo: ticks('braciere.t_attivo') };
  const periodoBraciere = cicloBraciere.riposo + cicloBraciere.anticipo + cicloBraciere.attivo;
  const pericoli = analisi.pericoli.map((p) => {
    const centro = centroCella(p.c, p.r);
    const piede = cella / 2;
    const braciere = p.id === ID_BRACIERE;
    return {
      ...p,
      ...centro,
      rFiamma: braciere ? S('braciere.r_fiamma') : cella / 2,
      solido: p.ferma_passo
        ? { id: p.id, x: centro.x - piede / 2, y: centro.y - piede / 2, w: piede, h: piede, ferma_passo: true, ferma_colpi: false }
        : null,
      /** fase iniziale del ciclo (tick), 0 per i pericoli senza ciclo */
      sfasamento: braciere ? Math.floor(rngPericoli() * periodoBraciere) : 0,
      fase: braciere ? FASI_PERICOLO[0] : null,
      progresso: 0,
    };
  });
  for (const p of pericoli) if (p.fase) Object.assign(p, fasePericolo({ t: p.sfasamento, ...cicloBraciere }));
  const solidi = [
    ...costruisciMura({ geo, cella, origine, aperture }),
    ...Array.from(porte.values(), (p) => p.solido),
    ...finestre,
    ...ostacoli,
    ...pericoli.filter((p) => p.solido).map((p) => p.solido),
  ];
  for (const k of Object.keys(campo)) delete campo[k];
  Object.assign(campo, { ...base, solidi });

  const contenuti = analisi.contenuti.map((c) => ({ ...c, ...centroCella(c.c, c.r) }));
  // storia P01: il punto e l'archetipo del boss provvisorio (solo nella stanza `boss`) e l'arco dell'uscita
  const contenutoBoss = record.tipo === TIPO_BOSS ? contenuti.find((c) => c.tipo === CONTENUTO_BOSS) ?? null : null;
  if (contenutoBoss && typeof contenutoBoss.archetipo !== 'string') {
    log?.error?.(`[stanza] errore di contenuto: il contenuto 'boss' di ${modello.id} non ha 'archetipo': nessun boss`);
  }
  const puntoBoss = contenutoBoss && typeof contenutoBoss.archetipo === 'string' ? contenutoBoss : null;
  const puntoUscita = contenuti.find((c) => c.tipo === CONTENUTO_USCITA) ?? null;
  // storia 018: celle sicure per la ricompensa (regola 24): libere da ostacoli `ferma_passo` e dai dischi dei pericoli
  const occupato = (x, y) => solidi.some((sol) => sol.ferma_passo && x >= sol.x && x < sol.x + sol.w && y >= sol.y && y < sol.y + sol.h)
    || pericoli.some((p) => Math.hypot(p.x - x, p.y - y) < p.rFiamma);
  const celleLibere = [];
  for (let r = 0; r < geo.righe; r++) {
    for (let c = 0; c < geo.colonne; c++) {
      const centro = centroCella(c, r);
      if (!occupato(centro.x, centro.y)) celleLibere.push(centro);
    }
  }
  const spawnPunti = modello.spawn.map((s) => ({ c: s.c, r: s.r, tipo: s.tipo, ...centroCella(s.c, s.r) }));
  const permutazione = mescola(rngSpawn, spawnPunti);
  const centriPorte = Array.from(porte.values(), (p) => p.centro);

  // composizione pre-estratta (stesso seme → stessa composizione, regola «seme_stanza»)
  const combatteBoss = puntoBoss !== null;
  const combatte = (TIPI_COMBATTIMENTO.includes(record.tipo) && modello.tavolozza.length > 0 && spawnPunti.length > 0) || combatteBoss;
  let totale = 0;
  let quote = [];
  let ondateArchetipi = [];
  if (combatteBoss) {
    // storia P01: una sola ondata con il solo boss, dal punto del contenuto (niente tavolozza né spawn)
    totale = 1;
    quote = [1];
    ondateArchetipi = [[puntoBoss.archetipo]];
  } else if (combatte) {
    const variazione = estraiVariazione(parametri, rngComp);
    totale = nNemici({ parametri, p: piano, d: record.profondita, dBoss: record.d_boss, diff: modello.difficolta, dim: modello.dim, variazione });
    quote = quoteOndate({ parametri, p: piano, n: totale });
    const tutti = composizione({ tavolozza: modello.tavolozza, n: totale, rng: rngComp });
    let i = 0;
    ondateArchetipi = quote.map((q) => tutti.slice(i, (i += q)));
    ondateArchetipi = ondateArchetipi.filter((lista) => lista.length > 0);
    quote = ondateArchetipi.map((l) => l.length);
  }

  const s = {
    stato: statoSalvato?.stato === 'pulita' ? 'pulita' : 'non_visitata',
    visitata: Boolean(statoSalvato?.visitata),
    ondata: 0,
    t: 0,
    tOndata: 0,
    tSvuotata: 0,
    nati: 0,
    ricompensaData: Boolean(statoSalvato?.ricompensa_data),
    /** tick dei pericoli: non si azzera con `entra` (il ciclo del braciere non riparte quando si rientra) */
    tPericoli: 0,
    /** @type {{ archetipo: string, punto: object, nato: number, attesa: number }[]} */
    segnalini: [],
    usati: new Set(),
    /** storia P01: il boss vivo della stanza (null altrove) e l'attesa sull'uscita */
    boss: null,
    uscitaTicks: 0,
    uscitaAttraversata: false,
  };

  function vai(nuovo) {
    if (s.stato === nuovo) return;
    if (!TRANSIZIONI_STANZA[s.stato].includes(nuovo)) throw new RangeError(`stanza ${record.id}: transizione non ammessa ${s.stato} -> ${nuovo}`);
    s.stato = nuovo;
  }

  const cerchioFerruccio = () => ({ x: ferruccio.x, y: ferruccio.y, r: ferruccio.r });
  const vivi = () => bersagli.filter((b) => b && b.stato !== 'morto' && b.vita > 0).length;

  function scegliPunto(r, scelti) {
    const criteri = { ferruccio: cerchioFerruccio(), r, porte: centriPorte, dPortaMin: S('d_porta_min'), scelti, dMinSpawn: S('d_min_spawn') };
    return primoValido({ permutazione, usati: s.usati, ...criteri })
      ?? piuLontano({ punti: permutazione, usati: s.usati, ferruccio: cerchioFerruccio(), rMin: S('r_min_assoluto') });
  }

  /** Crea i segnalini dell'ondata `k` (1-based) con l'anello `r_sicurezza`. */
  function creaSegnalini(k) {
    const scelti = [];
    for (const archetipo of ondateArchetipi[k - 1] ?? []) {
      const punto = combatteBoss ? puntoBoss : scegliPunto(S('r_sicurezza'), scelti);
      if (!punto) break; // nessun punto: l'ondata è più piccola (mai un nemico addosso)
      s.usati.add(punto);
      scelti.push(punto);
      s.segnalini.push({ archetipo, punto, nato: s.t, attesa: 0 });
    }
    eventi.emit('ondata.inizio', { id: record.id, ondata: k, nemici: s.segnalini.length });
  }

  /** Comparsa dei nemici i cui segnalini hanno compiuto `t_marker` (regola 21). */
  function comparsa() {
    const tMarker = ticks('t_marker');
    const tAttesaMax = ticks('t_ritardo_max_spawn');
    const rApp = S('r_sicurezza_apparizione');
    const restanti = [];
    for (const seg of s.segnalini) {
      if (s.t - seg.nato < tMarker || vivi() >= S('n_max_vivi')) {
        restanti.push(seg);
        continue;
      }
      let punto = seg.punto;
      const dentro = Math.hypot(punto.x - ferruccio.x, punto.y - ferruccio.y) < rApp;
      if (dentro) {
        seg.attesa += 1;
        if (seg.attesa < tAttesaMax) {
          restanti.push(seg);
          continue;
        }
        const altro = scegliPunto(rApp, []);
        if (altro) {
          s.usati.add(altro);
          punto = altro;
        }
      }
      s.nati += 1;
      const nemico = creaNemico({ archetipo: seg.archetipo, x: punto.x, y: punto.y, id: `${record.id}-${s.nati}`, boss: combatteBoss });
      if (combatteBoss) s.boss = nemico;
      bersagli.push(nemico);
      eventi.emit('nemico.nato', { id: record.id, archetipo: seg.archetipo, x: punto.x, y: punto.y, ondata: s.ondata, boss: combatteBoss });
    }
    s.segnalini = restanti;
    s.usati.clear(); // i punti tornano disponibili per l'ondata successiva (d_min_spawn vale dentro l'ondata)
    for (const seg of s.segnalini) s.usati.add(seg.punto);
  }

  function chiudiPorte() {
    for (const p of porte.values()) p.chiudi();
    eventi.emit('stanza.chiusa', { id: record.id });
  }

  function apriPorte() {
    for (const p of porte.values()) p.apri();
  }

  /**
   * Consegna della ricompensa pre-estratta (regola 24): una sola volta per stanza, anche al rientro
   * (`ricompensa_data` è nello stato salvato). Chi ascolta lascia gli oggetti attorno al centro entro
   * `dispersione`, spostando con `puntoSicuro` quelli caduti su ostacolo o pericolo.
   */
  function daRicompensa() {
    if (s.ricompensaData) return;
    s.ricompensaData = true;
    const centro = { x: origine.x + base.larghezza / 2, y: origine.y + base.altezza / 2 };
    eventi.emit('stanza.ricompensa', {
      id: record.id,
      ricompensa: record.ricompensa ?? { valore: 0, oggetti: [] },
      ...centro,
      dispersione: S('r_dispersione_ricompensa'),
      puntoSicuro: (x, y) => puntoSicuro({ x, y, occupato, celleLibere }),
    });
  }

  /**
   * Pericoli ambientali (regola 16), in ogni stato della stanza: avanza il ciclo dei bracieri e, in
   * `attivo`, se il disco di fiamma tocca il corpo di Ferruccio gli chiede il danno (è lui a sapere se è
   * invulnerabile o in scatto; la spinta è radiale dal piede). I nemici non sono toccati.
   */
  function tickPericoli() {
    const f = cerchioFerruccio();
    for (const p of pericoli) {
      if (!p.fase) continue;
      Object.assign(p, fasePericolo({ t: s.tPericoli + p.sfasamento, ...cicloBraciere }));
      if (p.fase !== FASI_PERICOLO[2] || typeof ferruccio.subisciDanno !== 'function') continue;
      if (!cerchiSiToccano(f, { x: p.x, y: p.y, r: p.rFiamma })) continue;
      const esito = ferruccio.subisciDanno({ danno: S('danno_pericolo'), x: p.x, y: p.y });
      if (esito?.applicato) eventi.emit('stanza.pericolo', { id: record.id, pericolo: p.id, x: p.x, y: p.y, danno: esito.danno });
    }
  }

  /** Ferruccio è entrato (già posizionato). */
  function entra() {
    s.visitata = true;
    s.t = 0;
    for (const p of porte.values()) p.annulla();
    if (s.stato === 'pulita') {
      eventi.emit('stanza.entrata', { id: record.id, tipo: record.tipo, stato: s.stato });
      return;
    }
    if (!combatte || ondateArchetipi.length === 0) {
      vai('pulita');
      eventi.emit('stanza.entrata', { id: record.id, tipo: record.tipo, stato: s.stato });
      eventi.emit('stanza.pulita', { id: record.id, tipo: record.tipo, combattuta: false });
      return;
    }
    vai('annuncio');
    s.ondata = 1;
    s.segnalini = [];
    s.usati = new Set();
    creaSegnalini(1);
    eventi.emit('stanza.entrata', { id: record.id, tipo: record.tipo, stato: s.stato });
  }

  /**
   * Avanza di un tick (dopo Ferruccio, combattimento e bersagli).
   * @param {number} _dt secondi
   */
  function tick(_dt) {
    s.t += 1;
    s.tPericoli += 1;
    tickPericoli();
    switch (s.stato) {
      case 'annuncio':
        if (s.t === ticks('t_chiusura_porte')) chiudiPorte();
        comparsa();
        if (s.segnalini.length === 0) {
          vai('ondata');
          s.tOndata = s.t;
        }
        break;
      case 'intervallo':
        comparsa();
        if (s.segnalini.length === 0) {
          vai('ondata');
          s.tOndata = s.t;
        }
        break;
      case 'ondata': {
        const v = vivi();
        const da = s.t - s.tOndata;
        if (s.ondata < quote.length) {
          const tMax = ticks('t_ondata_max');
          if ((v <= S('soglia_ondata') && da >= ticks('t_pausa_ondata')) || (tMax > 0 && da >= tMax)) {
            s.ondata += 1;
            vai('intervallo');
            creaSegnalini(s.ondata);
          }
        } else if (v === 0) {
          vai('svuotata');
          s.tSvuotata = s.t;
          if (s.boss) {
            // storia P01: il boss provvisorio è caduto: chi ascolta fa cadere il ricordo (ricordi.js) nel punto della morte
            // storia P06: l'id vero del boss (boss.json) e il suo archetipo (il Medaglione cade per l'archetipo `gatto`)
            eventi.emit('boss.sconfitto', {
              id: s.boss.bossId ?? s.boss.archetipo, archetipo: s.boss.archetipo, pattern: s.boss.pattern ?? null,
              stanza: record.id, x: s.boss.x, y: s.boss.y,
            });
            s.boss = null;
          }
          eventi.emit('stanza.svuotata', { id: record.id });
        }
        break;
      }
      case 'svuotata': {
        const da = s.t - s.tSvuotata;
        if (da >= ticks('t_ricompensa')) daRicompensa();
        if (da >= ticks('t_ritardo_apertura')) {
          daRicompensa();
          apriPorte();
          vai('pulita');
          eventi.emit('stanza.pulita', { id: record.id, tipo: record.tipo, combattuta: true });
        }
        break;
      }
      default:
        break;
    }
    // le porte DOPO la macchina: la chiusura chiesta a `t_chiusura_porte` parte nello stesso tick,
    // così con t_chiusura + t_anim = t_marker sono `chiuse` nel tick in cui i nemici compaiono
    const f = cerchioFerruccio();
    for (const p of porte.values()) p.tick(p.occupataDa(f));
    tickUscita(f);
  }

  /**
   * Storia P01: l'uscita del piano. Attiva solo a stanza `pulita`; Ferruccio deve restarci sopra (centro entro
   * `uscita.raggio`) per `uscita.t_attesa` di seguito; poi `piano.completato` una sola volta per stanza montata.
   * @param {{ x: number, y: number }} f il corpo di Ferruccio
   */
  function tickUscita(f) {
    if (!puntoUscita || s.uscitaAttraversata || s.stato !== 'pulita') {
      s.uscitaTicks = 0;
      return;
    }
    const sopra = Math.hypot(f.x - puntoUscita.x, f.y - puntoUscita.y) < S('uscita.raggio');
    s.uscitaTicks = sopra ? s.uscitaTicks + 1 : 0;
    if (!sopra || s.uscitaTicks < ticks('uscita.t_attesa')) return;
    s.uscitaAttraversata = true;
    eventi.emit('piano.completato', { piano, id: record.id, x: puntoUscita.x, y: puntoUscita.y });
  }

  /** Storia P01: l'uscita del piano per il disegno e i test, o null se il modello non ne ha una. */
  function uscita() {
    if (!puntoUscita) return null;
    const attesa = ticks('uscita.t_attesa');
    return {
      x: puntoUscita.x, y: puntoUscita.y, raggio: S('uscita.raggio'), attiva: s.stato === 'pulita',
      progresso: attesa > 0 ? Math.min(1, s.uscitaTicks / attesa) : (s.uscitaTicks > 0 ? 1 : 0), attraversata: s.uscitaAttraversata,
    };
  }

  /** La porta aperta che Ferruccio ha appena attraversato (centro oltre la metà del muro), o `null`. */
  function attraversata() {
    for (const p of porte.values()) {
      if (!p.passabile()) continue;
      const v = VERSO_LATO[p.lato];
      const c = p.centro;
      const lungo = (ferruccio.x - c.x) * v.x + (ferruccio.y - c.y) * v.y;
      const trasv = Math.abs((ferruccio.x - c.x) * v.y) + Math.abs((ferruccio.y - c.y) * v.x);
      if (lungo >= 0 && trasv <= p.rett.w / 2) return p;
    }
    return null;
  }

  /**
   * Punto d'arrivo di Ferruccio: la prima cella del vestibolo dello slot, o il centro della stanza.
   * @param {string | null} slot
   */
  function puntoArrivo(slot = null) {
    if (slot && geo.slots[slot]) {
      const v = vestiboloDi(geo.slots[slot], 1)[0];
      return centroCella(v.c, v.r);
    }
    return { x: origine.x + base.larghezza / 2, y: origine.y + base.altezza / 2 };
  }

  /** Ferruccio lascia la stanza: se il combattimento non era concluso torna `non_visitata` (regola 6). */
  function esci() {
    if (s.stato === 'annuncio' || s.stato === 'ondata' || s.stato === 'intervallo') {
      vai('non_visitata');
      s.segnalini = [];
      s.usati = new Set();
      s.ondata = 0;
      s.boss = null;
      for (const p of porte.values()) p.annulla();
      eventi.emit('stanza.abbandonata', { id: record.id });
    }
    return statoSalvabile();
  }

  /** `StatoStanza` serializzabile (regola 27). */
  function statoSalvabile() {
    return {
      id: record.id,
      stato: s.stato === 'pulita' ? 'pulita' : s.stato === 'non_visitata' ? 'non_visitata' : 'in_corso',
      visitata: s.visitata,
      ondata: s.ondata,
      ostacoli_distrutti: [],
      finestre_aperte: [],
      oggetti: [],
      ricompensa_data: s.ricompensaData,
      consumata: false,
    };
  }

  /** Vero se il cerchio tocca la cella di una porta. */
  function suPorta(cerchio) {
    for (const p of porte.values()) if (cerchioInRettangolo(cerchio.x, cerchio.y, cerchio.r, p.rett)) return p;
    return null;
  }

  return {
    get id() { return record.id; },
    get tipo() { return record.tipo; },
    get stato() { return s.stato; },
    get ondata() { return s.ondata; },
    get quote() { return quote.slice(); },
    get nNemici() { return totale; },
    get ondateArchetipi() { return ondateArchetipi.map((l) => l.slice()); },
    get segnalini() { return s.segnalini.map((x) => ({ archetipo: x.archetipo, x: x.punto.x, y: x.punto.y })); },
    get tick_() { return s.t; },
    get combatte() { return combatte; },
    /** Storia P01: vero nella stanza del boss provvisorio; il boss vivo (o null); l'uscita del piano (o null). */
    get combatteBoss() { return combatteBoss; },
    get boss() { return s.boss; },
    get uscita() { return uscita(); },
    record,
    modello,
    geo,
    cella,
    origine,
    porte: Array.from(porte.values()),
    portaIn: (slot) => porte.get(slot) ?? null,
    finestre,
    ostacoli,
    pericoli,
    contenuti,
    spawnPunti,
    permutazione,
    centroCella,
    entra,
    tick,
    attraversata,
    puntoArrivo,
    esci,
    statoSalvabile,
    suPorta,
    vivi,
  };
}
