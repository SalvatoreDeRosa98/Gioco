/**
 * motore/fondazione/risorse.js — Risoluzione dei percorsi delle risorse binarie (PNG degli sprite).
 *
 * Nella pagina servita da un server il percorso relativo (es. `assets/sprite/ferruccio.png`) va bene così.
 * Nel file unico prodotto da `tools/impacchetta.js` le immagini sono incorporate come data: URI in
 * `globalThis.__risorse` (chiave = percorso relativo): qui si traduce. Nessun valore di gioco.
 */

/**
 * Percorso da usare per caricare una risorsa: il data: URI del pacchetto se c'è, altrimenti il percorso stesso.
 * @param {string} percorso percorso relativo alla pagina (es. `assets/sprite/gatto.png`)
 * @returns {string}
 */
export function percorsoRisorsa(percorso) {
  const mappa = globalThis.__risorse;
  if (mappa && Object.prototype.hasOwnProperty.call(mappa, percorso)) return mappa[percorso];
  return percorso;
}
