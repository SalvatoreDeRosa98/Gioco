/**
 * motore/interfaccia/morte.js — Velo DOM MINIMALE della sequenza di morte (storia 030).
 *
 * Non è grafica definitiva (il renderer vero aspetta l'approvazione dell'autore): una dissolvenza in
 * DOM sopra la scena, con il buio che cresce con `progresso`, le lanterne (span) che si spengono una a
 * una, i fili che si spezzano, la maschera che si stacca in pezzi azzurri e una didascalia per fase da
 * `contenuti/interfaccia.json › morte`. L'elemento porta `data-fase` e la variabile CSS `--progresso`;
 * le classi `spenta`, `spezzati`, `staccata` seguono lo stato del risveglio (`storia/risveglio.js`).
 * Visibile solo mentre la sequenza è in corso. Dipendenze: solo il DOM iniettato.
 *
 * Storia P01 (provvisoria): lo stesso velo serve la fine del piano (`risveglio.motivo === 'vittoria'`): lanterne,
 * fili e maschera restano nascosti, la didascalia viene da `interfaccia.json › fine_piano` (per fase; `{piano}` è
 * il piano successivo, che non esiste ancora) e l'elemento porta `data-motivo`.
 */

/** Pezzi in cui la maschera si stacca nel velo (scelta di disegno del segnaposto, non valore di gioco). */
const PEZZI_MASCHERA = 3;

/**
 * @param {{
 *   documento: Document, contenitore: HTMLElement,
 *   testi: { morte: Record<string, string>, fine_piano?: Record<string, string> },
 *   risveglio: () => ({ attivo: boolean, fase: string, indice: number, motivo?: string | null, pianoProssimo?: number | null, progresso: () => number, progressoFase: () => number, lanterneSpente: () => number, lanterne: () => number } | null)
 * }} o
 */
export function creaInterfacciaMorte({ documento, contenitore, testi, risveglio }) {
  if (!documento || !contenitore || !testi?.morte || typeof risveglio !== 'function') throw new TypeError('creaInterfacciaMorte: dipendenze mancanti');
  const T = testi.morte;
  const T_FINE = testi.fine_piano ?? {};
  const MOTIVO_VITTORIA = 'vittoria';
  const MOTIVO_MORTE = 'morte';
  const velo = documento.createElement('div');
  velo.className = 'morte-velo';
  velo.hidden = true;
  const lanterne = documento.createElement('div');
  lanterne.className = 'morte-lanterne';
  const fili = documento.createElement('div');
  fili.className = 'morte-fili';
  const maschera = documento.createElement('div');
  maschera.className = 'morte-maschera';
  for (let i = 0; i < PEZZI_MASCHERA; i++) {
    const pezzo = documento.createElement('span');
    pezzo.className = 'pezzo';
    maschera.append(pezzo);
  }
  const didascalia = documento.createElement('p');
  didascalia.className = 'morte-didascalia';
  velo.append(lanterne, fili, maschera, didascalia);
  contenitore.append(velo);
  /** @type {object[]} */
  let spanLanterne = [];

  function costruisciLanterne(n) {
    if (spanLanterne.length === n) return;
    spanLanterne = [];
    for (let i = 0; i < n; i++) {
      const l = documento.createElement('span');
      l.className = 'lanterna';
      spanLanterne.push(l);
    }
    lanterne.replaceChildren(...spanLanterne);
  }

  /** Allinea il DOM allo stato della sequenza (chiamata a ogni disegno). */
  function aggiorna() {
    const r = risveglio();
    if (!r || !r.attivo) {
      velo.hidden = true;
      return;
    }
    velo.hidden = false;
    const vittoria = r.motivo === MOTIVO_VITTORIA;
    velo.dataset.motivo = vittoria ? MOTIVO_VITTORIA : MOTIVO_MORTE;
    lanterne.hidden = vittoria;
    fili.hidden = vittoria;
    maschera.hidden = vittoria;
    costruisciLanterne(r.lanterne());
    const spente = r.lanterneSpente();
    spanLanterne.forEach((l, i) => { l.className = i < spente ? 'lanterna spenta' : 'lanterna'; });
    const fase = r.fase;
    const i = r.indice;
    velo.dataset.fase = fase;
    velo.style?.setProperty?.('--progresso', String(r.progresso()));
    fili.className = i >= 1 ? 'morte-fili spezzati' : 'morte-fili';
    maschera.className = i >= 2 ? 'morte-maschera staccata' : 'morte-maschera';
    didascalia.textContent = vittoria ? (T_FINE[fase] ?? '').replace('{piano}', String(r.pianoProssimo ?? '')) : (T[fase] ?? '');
  }

  /** Stato del DOM per i test, o null se nascosto. */
  function stato() {
    if (velo.hidden) return null;
    return {
      fase: velo.dataset.fase, motivo: velo.dataset.motivo, didascalia: didascalia.textContent,
      lanterne: spanLanterne.length, spente: spanLanterne.filter((l) => l.className.includes('spenta')).length,
      fili: fili.className.includes('spezzati') ? 'spezzati' : 'tesi', maschera: maschera.className.includes('staccata') ? 'staccata' : 'intera',
    };
  }

  return { aggiorna, stato, velo };
}
