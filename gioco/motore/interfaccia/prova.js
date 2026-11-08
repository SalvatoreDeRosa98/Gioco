/**
 * motore/interfaccia/prova.js — Pannello DOM delle istruzioni iniziali della build di prova (storia P02, PROVVISORIA).
 *
 * Solo in `prova.html` (la pagina con la meta `gioco-avvio`): all'avvio mostra un pannello con i testi di
 * `contenuti/interfaccia.json › prova` (titolo e righe: tasti, telefono, grafica provvisoria, invito). Sparisce
 * al primo `keydown` o `pointerdown` sulla finestra (ascoltatori in cattura, una sola volta) e non mette in
 * pausa il ciclo: il tasto o il tocco che lo chiude arriva anche al gioco. Dipendenze: solo il DOM iniettato.
 */

/**
 * @param {{
 *   documento: Document, finestra: Window, contenitore: HTMLElement,
 *   testi: { prova: { titolo: string, righe: string[] } }
 * }} o
 */
export function creaInterfacciaProva({ documento, finestra, contenitore, testi }) {
  if (!documento || !finestra || !contenitore || !testi?.prova || !Array.isArray(testi.prova.righe)) {
    throw new TypeError('creaInterfacciaProva: dipendenze mancanti');
  }
  const T = testi.prova;
  const radice = documento.createElement('section');
  radice.className = 'prova';
  radice.setAttribute?.('role', 'dialog');
  const titolo = documento.createElement('h2');
  titolo.className = 'prova-titolo';
  titolo.textContent = T.titolo;
  radice.append(titolo);
  for (const riga of T.righe) {
    const p = documento.createElement('p');
    p.className = 'prova-riga';
    p.textContent = riga;
    radice.append(p);
  }
  contenitore.append(radice);
  let aperto = true;

  /** Chiude il pannello (idempotente). */
  function chiudi() {
    if (!aperto) return;
    aperto = false;
    radice.hidden = true;
    radice.remove?.();
    finestra.removeEventListener('keydown', chiudi, true);
    finestra.removeEventListener('pointerdown', chiudi, true);
  }
  finestra.addEventListener('keydown', chiudi, true);
  finestra.addEventListener('pointerdown', chiudi, true);

  return {
    /** Vero finché il pannello è a schermo. */
    visibile: () => aperto,
    chiudi,
  };
}
