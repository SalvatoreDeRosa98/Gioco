/**
 * motore/fondazione/avvio-url.js — Parametri di avvio dalla pagina (storia P02, provvisoria).
 *
 * Una pagina può dichiarare i parametri di avvio di default con
 * `<meta name="gioco-avvio" content="debug=1&wire=1&hub=1">`: ogni coppia vale come DEFAULT della
 * query dell'URL, cioè si applica solo se la chiave non è già nell'URL (l'URL vince sempre).
 * Funzioni pure, senza DOM: `avvio.js` le compone con il documento reale.
 */

/** Nome della meta letta da `leggiMetaAvvio`. */
export const META_AVVIO = 'gioco-avvio';

/**
 * Fonde i default della meta nella query dell'URL.
 * @param {string} search la query dell'URL (`url.search`, con o senza `?`)
 * @param {string | null | undefined} contenutoMeta il `content` della meta (`a=1&b=2`), o null se la meta manca
 * @returns {string} la nuova query con il `?` iniziale (stringa vuota se non ci sono parametri)
 */
export function fondiDefault(search, contenutoMeta) {
  const query = new URLSearchParams(search ?? '');
  const base = new URLSearchParams(contenutoMeta ?? '');
  for (const [chiave, valore] of base) {
    if (!query.has(chiave)) query.set(chiave, valore);
  }
  const testo = query.toString();
  return testo ? `?${testo}` : '';
}

/**
 * Legge il `content` della meta `gioco-avvio` dal documento.
 * @param {{ querySelector: (sel: string) => ({ getAttribute: (n: string) => (string | null) } | null) } | null | undefined} documento
 * @returns {string | null} il contenuto (anche vuoto) o null se la meta non c'è
 */
export function leggiMetaAvvio(documento) {
  const meta = documento?.querySelector?.(`meta[name="${META_AVVIO}"]`);
  if (!meta) return null;
  return meta.getAttribute('content') ?? '';
}
