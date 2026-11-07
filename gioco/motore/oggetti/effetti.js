/**
 * motore/oggetti/effetti.js — Libreria degli effetti dei ganci (ADR-0002, GDD doni-modificatori.md
 * regola 5). Storia 023.
 *
 * Il catalogo dei doni non contiene codice: un'iscrizione a un gancio cita un effetto PER NOME
 * (`scintilla`, `catena`, `onda`, `bonus_temporaneo`, `cura`, `ricarica_scatto`) con parametri
 * numerici. Il vocabolario è chiuso e vive qui; i nomi obbligatori, i predefiniti e gli alias
 * (es. `lancia_scintilla` → `scintilla`) sono dati in `contenuti/parametri/doni.json › effetti`.
 *
 * Gli effetti che agiscono sul mondo (proiettili, danno ad area, cura, cariche) stanno in livelli
 * sopra `oggetti/` (attori, mondo): qui si EMETTE la richiesta sul bus (`doni.scintilla`,
 * `doni.catena`, `doni.onda`, `doni.cura`, `doni.ricarica_scatto`) con `origine: 'gancio'`, così chi la
 * esegue sa che non deve rigenerare eventi di gancio (profondità 1). `bonus_temporaneo` agisce
 * direttamente sui modificatori. Ogni effetto restituisce un descrittore dell'esito (per i test e
 * per il dispatcher).
 *
 * Firma di ogni effetto: `(contesto, parametri) => esito`, con
 * `contesto = { payload, eventi, modificatori, dono, ora }` (payload = quello del gancio; dono =
 * id del dono o della sinergia che ha iscritto il gancio; ora = ms della notte).
 * Dipendenze: nessuna.
 */

/** Marcatore degli eventi nati da un effetto di gancio (profondità 1). */
export const ORIGINE_GANCIO = 'gancio';

/**
 * Posizione da cui parte un effetto: il bersaglio del payload se c'è, altrimenti il payload stesso.
 * @param {{ x?: number, y?: number, bersaglio?: { x: number, y: number } }} payload
 */
function origineDi(payload) {
  const b = payload?.bersaglio;
  if (b && typeof b.x === 'number' && typeof b.y === 'number') return { x: b.x, y: b.y };
  return { x: payload?.x ?? 0, y: payload?.y ?? 0 };
}

/** Emette la richiesta sul bus, se c'è un bus, e restituisce il descrittore. */
function richiedi(contesto, nomeEvento, descrittore) {
  const esito = { ...descrittore, origine: ORIGINE_GANCIO, dono: contesto.dono, da: origineDi(contesto.payload), bersaglio: contesto.payload?.bersaglio ?? null };
  contesto.eventi?.emit(nomeEvento, esito);
  return esito;
}

/** Effetti canonici, per nome. @type {Record<string, (contesto: object, parametri: object) => object>} */
export const EFFETTI = Object.freeze({
  /** Lancia `n` piccoli proiettili dal bersaglio (o da Ferruccio se il bersaglio è lui). */
  scintilla(contesto, p) {
    return richiedi(contesto, 'doni.scintilla', {
      effetto: 'scintilla', n: p.n, danno: p.danno, rimbalzi: p.rimbalzi, raggio_rimbalzo_px: p.raggio_rimbalzo_px,
      ventaglio_gradi: p.ventaglio_gradi, direzione: contesto.payload?.direzione ?? null,
    });
  },
  /** Danno ai `n_bersagli` nemici più vicini al bersaglio, entro il raggio. */
  catena(contesto, p) {
    return richiedi(contesto, 'doni.catena', { effetto: 'catena', n_bersagli: p.n_bersagli, raggio_px: p.raggio_px, danno: p.danno });
  },
  /** Area circolare centrata sul bersaglio: danno e stordimento. */
  onda(contesto, p) {
    return richiedi(contesto, 'doni.onda', { effetto: 'onda', raggio_px: p.raggio_px, danno: p.danno, stordisce_ms: p.stordisce_ms });
  },
  /** Modificatore a tempo nella lista comune; stesso (dono, statistica): rinnova la durata. */
  bonus_temporaneo(contesto, p) {
    const bonus = contesto.modificatori.bonusTemporaneo({
      origine: contesto.dono, statistica: p.statistica, operazione: p.operazione, valore: p.valore, durata_ms: p.durata_ms,
    });
    return { effetto: 'bonus_temporaneo', origine: ORIGINE_GANCIO, dono: contesto.dono, ...bonus };
  },
  /** Ripristina maschere correnti, fino a `maschere_max` (lo applica il corpo di Ferruccio). */
  cura(contesto, p) {
    return richiedi(contesto, 'doni.cura', { effetto: 'cura', maschere: p.maschere });
  },
  /** Ripristina cariche di scatto, fino a `cariche_scatto` (lo applica il corpo di Ferruccio). */
  ricarica_scatto(contesto, p) {
    return richiedi(contesto, 'doni.ricarica_scatto', { effetto: 'ricarica_scatto', cariche: p.cariche });
  },
});

/**
 * Costruisce la libreria risolvendo gli alias dichiarati nei dati: ogni voce di `definizioni` (il
 * blocco `effetti` di doni.json) diventa `{ nome, canonico, fn, obbligatori, predefiniti }`.
 * @param {Record<string, { alias?: string, obbligatori?: string[], predefiniti?: Record<string, number> }>} definizioni
 * @returns {{ voci: Map<string, { nome: string, canonico: string, fn: Function, obbligatori: string[], predefiniti: Record<string, unknown> }>, errori: string[] }}
 */
export function creaLibreria(definizioni) {
  const voci = new Map();
  const errori = [];
  const def = definizioni && typeof definizioni === 'object' ? definizioni : {};
  // prima i canonici, poi gli alias (che ereditano obbligatori e predefiniti)
  for (const [nome, d] of Object.entries(def)) {
    if (nome.startsWith('_') || !d || typeof d !== 'object' || d.alias) continue;
    const fn = EFFETTI[nome];
    if (typeof fn !== 'function') {
      errori.push(`effetti.${nome}: nessuna funzione di libreria con questo nome`);
      continue;
    }
    voci.set(nome, {
      nome, canonico: nome, fn,
      obbligatori: Array.isArray(d.obbligatori) ? d.obbligatori.slice() : [],
      predefiniti: d.predefiniti && typeof d.predefiniti === 'object' ? { ...d.predefiniti } : {},
    });
  }
  for (const [nome, d] of Object.entries(def)) {
    if (nome.startsWith('_') || !d || typeof d !== 'object' || !d.alias) continue;
    const base = voci.get(d.alias);
    if (!base) {
      errori.push(`effetti.${nome}: alias di '${d.alias}' che non esiste`);
      continue;
    }
    voci.set(nome, { ...base, nome, obbligatori: base.obbligatori.slice(), predefiniti: { ...base.predefiniti } });
  }
  for (const nome of Object.keys(EFFETTI)) {
    if (!voci.has(nome)) errori.push(`effetti.${nome}: funzione di libreria non dichiarata nei dati`);
  }
  return { voci, errori };
}

/**
 * Vero se `nome` è un effetto della libreria canonica (senza passare dai dati).
 * @param {string} nome
 */
export function eEffetto(nome) {
  return typeof EFFETTI[nome] === 'function';
}
