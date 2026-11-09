/**
 * motore/oggetti/economia.js — Monete di luce, cuori a terra, scintille, formule dell'economia
 * (Feature, GDD economia.md). Storia 025.
 *
 * Due parti:
 *  - **formule pure** (sezione Formulas del GDD), testabili senza stato: `prezzo` in aritmetica
 *    intera, `moneteBoss`, `scintilleBoss`, `pCuore`, `residuoNotte`, `costoSblocco`,
 *    `moneteAtteseStanza`, `redditoPiano`, `estraiMoneta` (tabella dei drop), `pesiRarita`,
 *    `estraiDono` (slot dono del banchetto, finché la storia 024 non porta il pool vero);
 *  - **lo stato della notte** (`creaEconomia`): le monete in tasca (tetto `tetto_monete`), gli oggetti
 *    a terra per stanza (monete e cuori: restano finché non sono presi, anche dopo l'uscita), le
 *    stanze di combattimento ripulite, i consumabili attivi. Le scintille NON vivono qui: vanno nel
 *    profilo (`persistenza/profilo.js`) nel momento in cui sono raccolte, così la morte non le tocca.
 *
 * Ascolta (verso l'alto, senza conoscere chi emette): `nemico.bottino` (drop dalla tabella di
 * `economia.json` con il generatore derivato `drop`, ignorando le monete calcolate dal nemico;
 * `boss: true` → monete e scintille del boss), `stanza.ricompensa` (bonus di stanza al centro e
 * tiro del cuore con `p_cuore`; storia 018: gli oggetti pre-estratti della stanza — `ricompensa.oggetti`
 * di stanze-porte.md regola 23 — cadono sparsi con il generatore `drop` entro `dispersione` dal centro,
 * riportati con il gancio `puntoSicuro` del payload alla cella sicura se cadono su ostacolo o pericolo:
 * monete e cuori a terra, scintille accreditate subito al profilo come quelle del boss), `stanza.pulita` (`combattuta` → conta e scala i consumabili),
 * `notte.stanza` (stanza corrente), `ferruccio.morto` (monete perse, residuo di notte accreditato). La fine della notte
 * vinta non è più `piano.completato` (storia P01): con la discesa del Teatro (storia P03) la run continua al piano dopo con
 * monete, consumabili e ricordi addosso, e `fineNotte()` (residuo accreditato, `economia.fine_notte`, che fa perdere ai
 * ricordi ciò che è a terra) la chiama il risveglio prima di `nuovaNotte()`, solo quando la run finisce davvero.
 * Emette: `economia.monete` {monete, delta, motivo}, `economia.oggetto` {stanza, oggetto, preso},
 * `economia.scintille` {scintille, accreditate, motivo}, `economia.morte` {monete_perse},
 * `economia.fine_notte` {stanze_ripulite, residuo}, `economia.consumabile` {id, attivo, restanti}.
 * `tick()` raccoglie ciò che Ferruccio tocca entro `r_raccolta_moneta` (nessun tasto).
 *
 * Nessun numero di gioco: tutto da `economia.*` (il `PCT` è la scala del percento della formula
 * intera, un'unità di misura, non un valore). Nessuna casualità nativa: `rng` iniettato (ADR-0003).
 */

/** Scala del percento nella formula intera del prezzo (100 = 100 %). Unità, non valore di gioco. */
export const PCT = 100;

/** Tipi di oggetto a terra. */
export const TIPI_OGGETTO = Object.freeze(['moneta', 'cuore']);

/** Rarità in vendita (l'`unico` non si compra: GDD doni regola 2). */
export const RARITA_VENDIBILI = Object.freeze(['comune', 'raro', 'prezioso']);

// ---------------------------------------------------------------------------------------------
// Formule pure
// ---------------------------------------------------------------------------------------------

/**
 * Formula `prezzo` in aritmetica intera:
 * `floor((base × rar_pct × (PCT + inc_pct × piano) × (PCT − sconto) + PCT³/2) / PCT³)`, mai sotto `minimo`.
 * Equivale a base × rarità × (1 + 0,15 × piano) × (1 − sconto) arrotondato a mezzo in su.
 * @param {{ base: number, rarPct: number, incPct: number, piano: number, scontoPct?: number, scontoMax?: number, minimo?: number }} o
 * @returns {number}
 */
export function prezzo({ base, rarPct, incPct, piano, scontoPct = 0, scontoMax = PCT, minimo = 1 }) {
  const sconto = Math.max(0, Math.min(Math.floor(scontoPct), Math.floor(scontoMax)));
  const den = PCT * PCT * PCT;
  const num = Math.floor(base) * Math.floor(rarPct) * (PCT + Math.floor(incPct) * Math.floor(piano)) * (PCT - sconto);
  return Math.max(Math.floor(minimo), Math.floor((num + den / 2) / den));
}

/**
 * `monete_boss(p) = s0 + k × p`.
 * @param {{ s0: number, k: number, piano: number }} o
 */
export function moneteBoss({ s0, k, piano }) {
  return s0 + k * piano;
}

/**
 * `scintille_boss(p) = s0 + ds × (p − 1) + bonus`.
 * @param {{ s0: number, ds: number, piano: number, bonus?: number }} o
 */
export function scintilleBoss({ s0, ds, piano, bonus = 0 }) {
  return s0 + ds * (piano - 1) + bonus;
}

/**
 * `p_cuore = (m = 0) ? 0 : min(max, k × m)` con `m` maschere mancanti.
 * @param {{ m: number, k: number, max: number }} o
 */
export function pCuore({ m, k, max }) {
  if (m <= 0) return 0;
  return Math.min(max, k * m);
}

/**
 * Residuo di notte: `floor(stanze / per)`; 0 se il rubinetto è spento (`per` = 0).
 * @param {{ stanze: number, perScintilla: number }} o
 */
export function residuoNotte({ stanze, perScintilla }) {
  if (!(perScintilla > 0)) return 0;
  return Math.floor(Math.max(0, stanze) / perScintilla);
}

/**
 * `costo_sblocco(k) = min(costo_max, floor(c0 × g^k + 0,5))`.
 * @param {{ k: number, c0: number, g: number, costoMax: number }} o
 */
export function costoSblocco({ k, c0, g, costoMax }) {
  return Math.min(costoMax, Math.floor(c0 * g ** Math.max(0, k) + 0.5));
}

/**
 * Valore medio di una moneta caduta: `v_medio = (1 − q) × v_piccola + q × v_grande`.
 * @param {{ qGrande: number, vPiccola: number, vGrande: number }} o
 */
export function valoreMedioMoneta({ qGrande, vPiccola, vGrande }) {
  return (1 - qGrande) * vPiccola + qGrande * vGrande;
}

/**
 * `E_stanza(p) = n_nem × p_drop × v_medio + bonus_stanza`.
 * @param {{ nNem: number, pDrop: number, vMedio: number, bonus: number }} o
 */
export function moneteAtteseStanza({ nNem, pDrop, vMedio, bonus }) {
  return nNem * pDrop * vMedio + bonus;
}

/**
 * `T(p) = ρ × N_comb × E_stanza(p) + p_segreta × monete_segreta + monete_boss(p)`.
 * @param {{ rho: number, nComb: number, eStanza: number, pSegreta: number, moneteSegreta: number, moneteBoss: number }} o
 */
export function redditoPiano({ rho, nComb, eStanza, pSegreta, moneteSegreta, moneteBoss: mb }) {
  return rho * nComb * eStanza + pSegreta * moneteSegreta + mb;
}

/**
 * Tabella dei drop di un nemico comune (regola 2): con `pDrop` cade una moneta, grande con `qGrande`.
 * Consuma al massimo due numeri del generatore. Ritorna il valore della moneta o 0.
 * @param {{ rng: () => number, pDrop: number, qGrande: number, vPiccola: number, vGrande: number }} o
 * @returns {number}
 */
export function estraiMoneta({ rng, pDrop, qGrande, vPiccola, vGrande }) {
  if (rng() >= pDrop) return 0;
  return rng() < qGrande ? vGrande : vPiccola;
}

/**
 * Pesi delle classi di rarità al piano `p`: `W_r(p) = max(0, W0_r × (1 + d_r × (p − 1)))`, con le
 * derive in percento (`derivePct` → d_r = derivePct / PCT).
 * @param {{ pesi: Record<string, number>, derivePct: Record<string, number>, piano: number }} o
 * @returns {Record<string, number>}
 */
export function pesiRarita({ pesi, derivePct, piano }) {
  const esito = {};
  for (const r of RARITA_VENDIBILI) {
    const w0 = pesi[r] ?? 0;
    const d = (derivePct[r] ?? 0) / PCT;
    esito[r] = Math.max(0, w0 * (1 + d * (piano - 1)));
  }
  return esito;
}

/**
 * Estrae un dono vendibile dal catalogo (slot dono del banchetto; la storia 024 porta il pool vero):
 * eleggibile se `mvp`, `piano_min ≤ piano`, rarità vendibile, canale `banchetto` (o nessun canale),
 * `sblocco` nullo, non in `esclusi`. Prima la classe di rarità per peso (classi vuote saltate), poi un
 * dono nella classe pesato da `peso`. Null se il pool è vuoto.
 * @param {{ catalogo: object[], piano: number, esclusi?: Iterable<string>, rng: () => number, pesi: Record<string, number> }} o
 * @returns {object | null}
 */
export function estraiDono({ catalogo, piano, esclusi = [], rng, pesi }) {
  const fuori = new Set(esclusi);
  const eleggibili = (catalogo ?? []).filter((d) => d && d.mvp !== false && RARITA_VENDIBILI.includes(d.rarita)
    && (d.piano_min ?? 1) <= piano && (!Array.isArray(d.canale) || d.canale.includes('banchetto'))
    && (d.sblocco === null || d.sblocco === undefined) && !fuori.has(d.id));
  if (eleggibili.length === 0) return null;
  const classi = RARITA_VENDIBILI.filter((r) => (pesi[r] ?? 0) > 0 && eleggibili.some((d) => d.rarita === r));
  if (classi.length === 0) return null;
  const tot = classi.reduce((a, r) => a + pesi[r], 0);
  let u = rng() * tot;
  let classe = classi[classi.length - 1];
  for (const r of classi) {
    u -= pesi[r];
    if (u < 0) { classe = r; break; }
  }
  const candidati = eleggibili.filter((d) => d.rarita === classe);
  const totPeso = candidati.reduce((a, d) => a + (d.peso ?? 1), 0);
  let v = rng() * totPeso;
  let scelto = candidati[candidati.length - 1];
  for (const d of candidati) {
    v -= d.peso ?? 1;
    if (v < 0) { scelto = d; break; }
  }
  return scelto;
}

// ---------------------------------------------------------------------------------------------
// Stato della notte
// ---------------------------------------------------------------------------------------------

/**
 * Crea l'economia della notte.
 * @param {{
 *   parametri: { get: (chiave: string) => any },
 *   eventi?: { on: Function, emit: Function } | null,
 *   rng: () => number,                      generatore derivato 'drop'
 *   profilo: { scintille: number, aggiungiScintille: (n: number, tetto: number) => number },
 *   ferruccio?: { x: number, y: number, maschere: number, impostaMaschere: (n: number) => void } | null,
 *   modificatori?: { valore: (nome: string) => number, applica: Function } | null,
 *   piano?: number,
 *   log?: { error: Function }
 * }} o
 */
export function creaEconomia({ parametri, eventi = null, rng, profilo, ferruccio = null, modificatori = null, piano = 1, log = console }) {
  if (!parametri || typeof rng !== 'function' || !profilo) throw new TypeError('creaEconomia: parametri, rng e profilo obbligatori');
  const E = (k) => parametri.get(`economia.${k}`);
  const maschereMax = () => (modificatori ? modificatori.valore('ferruccio.maschere_max') : parametri.get('ferruccio.maschere_max'));

  const s = {
    monete: 0,
    stanzeRipulite: 0,
    stanzaCorrente: /** @type {string | null} */ (null),
    piano,
    /** @type {Map<string, object[]>} oggetti a terra per stanza */
    aTerra: new Map(),
    /** @type {Map<string, { def: object, rimuovi: () => void, restanti: number }>} */
    consumabili: new Map(),
    bossPagati: new Set(),
    conclusa: false,
    prossimoId: 0,
  };

  const emetti = (nome, payload) => eventi?.emit(nome, payload);

  /**
   * Aggiunge monete fino al tetto. Ritorna quante sono entrate davvero.
   * @param {number} n
   * @param {string} [motivo]
   */
  function aggiungiMonete(n, motivo = 'manuale') {
    const q = Math.max(0, Math.floor(n));
    const prima = s.monete;
    s.monete = Math.min(E('tetto_monete'), prima + q);
    const delta = s.monete - prima;
    if (delta !== 0) emetti('economia.monete', { monete: s.monete, delta, motivo });
    return delta;
  }

  /**
   * Scala `n` monete se bastano (soglia `≥`): atomico, nessun debito.
   * @param {number} n
   * @param {string} [motivo]
   * @returns {boolean}
   */
  function togliMonete(n, motivo = 'acquisto') {
    const q = Math.max(0, Math.floor(n));
    if (s.monete < q) return false;
    s.monete -= q;
    emetti('economia.monete', { monete: s.monete, delta: -q, motivo });
    return true;
  }

  /**
   * Accredita scintille al profilo subito (regola 4) e lo segnala.
   * @param {number} n
   * @param {string} [motivo]
   */
  function aggiungiScintille(n, motivo = 'manuale') {
    const accreditate = profilo.aggiungiScintille(n, E('tetto_scintille'));
    if (accreditate > 0) emetti('economia.scintille', { scintille: profilo.scintille, accreditate, motivo });
    return accreditate;
  }

  /**
   * Lascia un oggetto a terra nella stanza `stanzaId`.
   * @param {string} stanzaId
   * @param {{ tipo: 'moneta'|'cuore', valore?: number, x: number, y: number, grande?: boolean }} oggetto
   */
  function lascia(stanzaId, oggetto) {
    if (!TIPI_OGGETTO.includes(oggetto?.tipo)) throw new RangeError(`economia.lascia: tipo sconosciuto '${oggetto?.tipo}'`);
    const id = stanzaId ?? s.stanzaCorrente ?? '';
    const lista = s.aTerra.get(id) ?? [];
    const voce = { id: `o${s.prossimoId++}`, tipo: oggetto.tipo, valore: oggetto.valore ?? 1, x: oggetto.x, y: oggetto.y, grande: Boolean(oggetto.grande) };
    lista.push(voce);
    s.aTerra.set(id, lista);
    emetti('economia.oggetto', { stanza: id, oggetto: { ...voce }, preso: false });
    return voce;
  }

  /** Oggetti a terra della stanza (copia). @param {string} [stanzaId] */
  function aTerra(stanzaId = s.stanzaCorrente) {
    return (s.aTerra.get(stanzaId ?? '') ?? []).map((o) => ({ ...o }));
  }

  /** Lancia una moneta dal punto del bottino nella direzione data. */
  function lasciaMoneta({ x, y, direzione, lancio, valore }) {
    const dx = direzione?.x ?? 0;
    const dy = direzione?.y ?? 0;
    const l = lancio ?? 0;
    return lascia(s.stanzaCorrente, { tipo: 'moneta', valore, x: x + dx * l, y: y + dy * l, grande: valore >= E('v_moneta_grande') });
  }

  /** Drop di un nemico comune o del boss (regole 2 e 4). */
  function suBottino(p) {
    if (!p) return;
    if (p.cuore) {
      lascia(s.stanzaCorrente, { tipo: 'cuore', valore: 1, x: p.x, y: p.y });
      return;
    }
    if (p.boss) {
      const chiave = `${s.piano}`;
      if (s.bossPagati.has(chiave)) return; // un solo pagamento per piano
      s.bossPagati.add(chiave);
      const m = moneteBoss({ s0: E('monete_boss.s0'), k: E('monete_boss.k'), piano: s.piano });
      lasciaMoneta({ x: p.x, y: p.y, direzione: p.direzione, lancio: p.lancio, valore: m });
      aggiungiScintille(scintilleBoss({ s0: E('scintille.s0'), ds: E('scintille.ds'), piano: s.piano, bonus: E('scintille.bonus_boss') }), 'boss');
      return;
    }
    const v = estraiMoneta({ rng, pDrop: E('p_drop_moneta'), qGrande: E('q_moneta_grande'), vPiccola: E('v_moneta_piccola'), vGrande: E('v_moneta_grande') });
    if (v > 0) lasciaMoneta({ x: p.x, y: p.y, direzione: p.direzione, lancio: p.lancio, valore: v });
  }

  /**
   * Punto sparso attorno a un centro entro `dispersione` (uniforme sul disco, generatore `drop`),
   * riportato alla cella sicura dal gancio `puntoSicuro` del payload se c'è.
   * @param {{ x: number, y: number, dispersione?: number, puntoSicuro?: (x: number, y: number) => { x: number, y: number } }} p
   */
  function puntoSparso(p) {
    const raggio = (p.dispersione ?? 0) * Math.sqrt(rng());
    const angolo = rng() * Math.PI * 2;
    const x = p.x + Math.cos(angolo) * raggio;
    const y = p.y + Math.sin(angolo) * raggio;
    return typeof p.puntoSicuro === 'function' ? p.puntoSicuro(x, y) : { x, y };
  }

  /**
   * Bonus di stanza al centro e tiro del cuore (economia.md regole 2 e 3); poi gli oggetti della
   * ricompensa pre-estratta della stanza (stanze-porte.md regole 23-24, storia 018).
   */
  function suRicompensa(p) {
    if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return;
    const n = E('bonus_stanza');
    const raggio = E('lancio_bonus_stanza');
    for (let i = 0; i < n; i++) {
      const angolo = (i / n) * Math.PI * 2;
      lascia(s.stanzaCorrente, { tipo: 'moneta', valore: E('v_moneta_piccola'), x: p.x + Math.cos(angolo) * raggio, y: p.y + Math.sin(angolo) * raggio });
    }
    if (ferruccio) {
      const m = maschereMax() - ferruccio.maschere;
      const pc = pCuore({ m, k: E('p_cuore.k'), max: E('p_cuore.max') });
      if (pc > 0 && rng() < pc) lascia(s.stanzaCorrente, { tipo: 'cuore', valore: 1, x: p.x, y: p.y });
    }
    for (const o of p.ricompensa?.oggetti ?? []) {
      if (o.tipo === 'scintilla') {
        aggiungiScintille(1, 'ricompensa');
      } else if (TIPI_OGGETTO.includes(o.tipo)) {
        const q = puntoSparso(p);
        const valore = o.tipo === 'moneta' ? E('v_moneta_piccola') : 1;
        lascia(s.stanzaCorrente, { tipo: o.tipo, valore, x: q.x, y: q.y });
      } else {
        log.error(`[economia] oggetto di ricompensa sconosciuto '${o.tipo}' nella stanza ${p.id}`);
      }
    }
  }

  /** Stanza di combattimento ripulita: conteggio e consumabili. */
  function suPulita(p) {
    if (!p?.combattuta) return;
    s.stanzeRipulite += 1;
    for (const [id, c] of Array.from(s.consumabili)) {
      c.restanti -= 1;
      if (c.restanti <= 0) {
        c.rimuovi();
        s.consumabili.delete(id);
        emetti('economia.consumabile', { id, attivo: false, restanti: 0 });
      } else {
        emetti('economia.consumabile', { id, attivo: true, restanti: c.restanti });
      }
    }
  }

  /**
   * Applica un consumabile (regola 5): modificatore manuale sulla statistica, durata in stanze di
   * combattimento ripulite; lo stesso consumabile ricomprato rinnova la durata, non la somma.
   * @param {{ id: string, statistica: string, operazione: string, valore: number, durata_stanze: number }} def
   * @returns {{ id: string, restanti: number, rinnovato: boolean }}
   */
  function applicaConsumabile(def) {
    if (!modificatori) throw new TypeError('economia.applicaConsumabile: modificatori mancanti');
    const esistente = s.consumabili.get(def.id);
    if (esistente) {
      esistente.restanti = def.durata_stanze;
      emetti('economia.consumabile', { id: def.id, attivo: true, restanti: def.durata_stanze, rinnovato: true });
      return { id: def.id, restanti: def.durata_stanze, rinnovato: true };
    }
    const rimuovi = modificatori.applica({ statistica: def.statistica, operazione: def.operazione, valore: def.valore });
    s.consumabili.set(def.id, { def, rimuovi, restanti: def.durata_stanze });
    emetti('economia.consumabile', { id: def.id, attivo: true, restanti: def.durata_stanze, rinnovato: false });
    return { id: def.id, restanti: def.durata_stanze, rinnovato: false };
  }

  /** Toglie tutti i consumabili (fine notte). */
  function togliConsumabili() {
    for (const [id, c] of s.consumabili) {
      c.rimuovi();
      emetti('economia.consumabile', { id, attivo: false, restanti: 0 });
    }
    s.consumabili.clear();
  }

  /**
   * Fine della notte (vinta o persa): residuo di scintille accreditato una volta sola.
   * @returns {number} scintille del residuo
   */
  function fineNotte() {
    if (s.conclusa) return 0;
    s.conclusa = true;
    const residuo = residuoNotte({ stanze: s.stanzeRipulite, perScintilla: E('scintille.stanze_per_scintilla') });
    if (residuo > 0) aggiungiScintille(residuo, 'residuo');
    togliConsumabili();
    emetti('economia.fine_notte', { stanze_ripulite: s.stanzeRipulite, residuo });
    return residuo;
  }

  /** Morte: tutte le monete della notte si perdono; le scintille (nel profilo) restano. */
  function morte() {
    const perse = s.monete;
    s.monete = 0;
    s.aTerra.clear(); // le monete a terra scompaiono con la notte
    if (perse > 0) emetti('economia.monete', { monete: 0, delta: -perse, motivo: 'morte' });
    emetti('economia.morte', { monete_perse: perse, scintille: profilo.scintille });
    fineNotte();
    return perse;
  }

  /**
   * Nuova notte (storia 030): monete, oggetti a terra, stanze ripulite, boss pagati e consumabili
   * azzerati; la notte riparte aperta (`conclusa` falso). Le scintille, nel profilo, non si toccano.
   */
  function nuovaNotte() {
    togliConsumabili();
    s.monete = 0;
    s.aTerra.clear();
    s.stanzeRipulite = 0;
    s.bossPagati.clear();
    s.conclusa = false;
    s.stanzaCorrente = null;
    emetti('economia.nuova_notte', { piano: s.piano });
  }

  /** Raccolta passando sopra (regola 2): un oggetto per tick al massimo, con le regole del tetto. */
  function tick() {
    if (!ferruccio || !s.stanzaCorrente) return;
    const lista = s.aTerra.get(s.stanzaCorrente);
    if (!lista || lista.length === 0) return;
    const r = E('r_raccolta_moneta');
    for (let i = 0; i < lista.length; i++) {
      const o = lista[i];
      if (Math.hypot(o.x - ferruccio.x, o.y - ferruccio.y) > r) continue;
      if (o.tipo === 'moneta') {
        if (s.monete >= E('tetto_monete')) continue; // resta a terra: niente spreco silenzioso
        aggiungiMonete(o.valore, 'raccolta');
      } else if (o.tipo === 'cuore') {
        if (ferruccio.maschere >= maschereMax()) continue; // a maschere piene il cuore resta a terra
        ferruccio.impostaMaschere(ferruccio.maschere + o.valore);
      }
      lista.splice(i, 1);
      emetti('economia.oggetto', { stanza: s.stanzaCorrente, oggetto: { ...o }, preso: true });
      return;
    }
  }

  const disiscrizioni = [];
  if (eventi) {
    disiscrizioni.push(eventi.on('notte.stanza', (p) => { s.stanzaCorrente = p?.a ?? s.stanzaCorrente; }));
    disiscrizioni.push(eventi.on('nemico.bottino', suBottino));
    disiscrizioni.push(eventi.on('stanza.ricompensa', suRicompensa));
    disiscrizioni.push(eventi.on('stanza.pulita', suPulita));
    disiscrizioni.push(eventi.on('ferruccio.morto', () => morte()));
    // `piano.completato` NON chiude la notte: fra un piano e l'altro (piano.discesa) tutto resta addosso; alla fine
    // della run è il risveglio a chiamare `fineNotte()` (storia P03).
  }

  /** Prezzo di uno slot del banchetto con i parametri correnti (rarità solo per il dono). */
  function prezzoDi({ tipo, rarita = 'comune', piano: p = s.piano }) {
    const base = tipo === 'dono' ? E('prezzi.base_dono') : tipo === 'cuore' ? E('prezzi.base_cuore') : E('prezzi.base_consumabile');
    const rarPct = tipo === 'dono' ? E(`prezzi.rar_pct.${rarita}`) : PCT;
    return prezzo({ base, rarPct, incPct: E('prezzi.inc_pct'), piano: p, scontoPct: E('prezzi.sconto_pct'), scontoMax: E('prezzi.sconto_max'), minimo: E('prezzi.prezzo_min') });
  }

  return {
    get monete() { return s.monete; },
    get scintille() { return profilo.scintille; },
    get stanzeRipulite() { return s.stanzeRipulite; },
    get stanzaCorrente() { return s.stanzaCorrente; },
    get piano() { return s.piano; },
    get conclusa() { return s.conclusa; },
    profilo,
    aggiungiMonete,
    togliMonete,
    aggiungiScintille,
    lascia,
    aTerra,
    /** Imposta la stanza corrente (la notte lo fa via `notte.stanza`; qui per i test e la scena wire). */
    entraIn: (id) => { s.stanzaCorrente = id; },
    impostaPiano: (p) => { s.piano = p; },
    applicaConsumabile,
    consumabili: () => Array.from(s.consumabili, ([id, c]) => ({ id, restanti: c.restanti })),
    prezzoDi,
    morte,
    fineNotte,
    nuovaNotte,
    tick,
    /** Toglie gli ascoltatori (test). */
    distruggi: () => { for (const d of disiscrizioni) d(); disiscrizioni.length = 0; },
    /** Fotografia per il debug. */
    stato: () => ({ monete: s.monete, scintille: profilo.scintille, stanzeRipulite: s.stanzeRipulite, stanza: s.stanzaCorrente, aTerra: aTerra(), consumabili: Array.from(s.consumabili.keys()) }),
  };
}
