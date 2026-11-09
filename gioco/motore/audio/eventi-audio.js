/**
 * motore/audio/eventi-audio.js — Dal bus degli eventi ai suoni (storia P10).
 *
 * Ascolta il bus e chiama `sintesi.suona(nome)`: lo stato di gioco non sa nulla dell'audio, emette solo eventi.
 * La mappa evento → suono è `MAPPA_EVENTI` (un nome fisso o una funzione del payload che ritorna il nome o `null`).
 * Anti-affollamento: lo stesso suono non si ripete prima di `audio.suoni.<nome>.gap_min_ms` (orologio del contesto,
 * iniettabile). Dipendenze: nessuna oltre al bus e al sintetizzatore iniettati.
 */

/**
 * Evento del bus → nome del suono (`NOMI_SUONI` di sintesi.js) o funzione `(payload, aiuti) => nome | null`.
 * `aiuti.eBoss(payload)` dice se il colpo è di un boss (impatti dei boss = tonfo).
 */
export const MAPPA_EVENTI = Object.freeze({
  'attore.passo': (p) => (p?.tipo === 'ferruccio' ? 'passo' : 'passo_nemico'),
  'ferruccio.fendente': 'sibilo',
  'ferruccio.affondo': 'sibilo',
  'ferruccio.sparo': 'sibilo',
  'esplosione': 'tonfo',
  'bomba.esplosione': 'tonfo',
  'nemico.colpo': (p, { eBoss }) => (eBoss(p) ? 'tonfo' : null),
  'stanza.entrata': 'campana',
  'ferruccio.colpo': 'colpo_a_segno',
  'ferruccio.danno': 'colpo_subito',
  'economia.monete': (p) => (Number(p?.delta) > 0 ? 'moneta' : null),
  'stanza.chiusa': 'porta_chiusa',
  'attivo.usato': 'attivo',
});

/**
 * Collega il bus al sintetizzatore.
 * @param {{
 *   eventi: { on: (nome: string, fn: Function) => () => void },
 *   sintesi: { suona: (nome: string) => boolean, ora: () => number },
 *   parametri: { get: (chiave: string) => number },
 *   eBoss?: (payload: unknown) => boolean,
 *   ora?: () => number
 * }} o `eBoss` risolve l'id del payload di `nemico.colpo` in un boss; `ora` in ms (default: l'orologio del contesto)
 * @returns {{ scollega: () => void, suonati: () => Record<string, number>, mappa: typeof MAPPA_EVENTI }}
 */
export function collegaEventiAudio({ eventi, sintesi, parametri, eBoss = () => false, ora = null }) {
  if (!eventi || typeof eventi.on !== 'function') throw new TypeError('collegaEventiAudio: manca `eventi`');
  if (!sintesi || typeof sintesi.suona !== 'function') throw new TypeError('collegaEventiAudio: manca `sintesi`');
  if (!parametri || typeof parametri.get !== 'function') throw new TypeError('collegaEventiAudio: manca `parametri`');
  const orologio = ora ?? (() => sintesi.ora());
  /** @type {Record<string, number>} ultimo istante (ms) in cui ogni suono è partito */
  const ultimo = {};
  /** @type {Record<string, number>} suoni richiesti al sintetizzatore e accettati, per nome */
  const suonati = {};
  const aiuti = { eBoss };

  function risolvi(voce, payload) {
    return typeof voce === 'function' ? voce(payload, aiuti) : voce;
  }

  function suona(nome) {
    const t = orologio();
    const gap = parametri.get(`audio.suoni.${nome}.gap_min_ms`);
    if (nome in ultimo && t - ultimo[nome] < gap) return false;
    if (!sintesi.suona(nome)) return false;
    ultimo[nome] = t;
    suonati[nome] = (suonati[nome] ?? 0) + 1;
    return true;
  }

  const rimozioni = Object.entries(MAPPA_EVENTI).map(([evento, voce]) => eventi.on(evento, (payload) => {
    const nome = risolvi(voce, payload);
    if (nome) suona(nome);
  }));

  return {
    scollega: () => { for (const via of rimozioni) via(); },
    suonati: () => ({ ...suonati }),
    mappa: MAPPA_EVENTI,
  };
}
