/**
 * motore/interfaccia/banchetto.js — Interfaccia DOM MINIMALE dell'economia: HUD (monete, scintille,
 * maschere) e lista del banchetto con i prezzi. Storia 025.
 *
 * Non è grafica definitiva (il renderer vero aspetta l'approvazione dell'autore): è una lista in
 * `#interfaccia` con classi semantiche, stile in `stile/interfaccia.css`. Tutti i testi vengono da
 * `contenuti/interfaccia.json` (iniettato come `testi`); i nomi dei doni dal catalogo, quelli dei
 * consumabili da `testi.consumabili`. Il prezzo di uno slot non accessibile è dentro `<s>` (barrato);
 * uno slot comprato mostra `testi.banchetto.comprato`. `aggiorna()` va chiamato una volta per frame
 * (è registrato nel ciclo come sistema di disegno): riscrive solo ciò che è cambiato.
 * Dipendenze: il DOM (iniettato) e gli oggetti `economia`, `banchetto`, `ferruccio`.
 */

/**
 * Riempie i segnaposto `{nome}` di un testo.
 * @param {string} testo
 * @param {Record<string, string|number>} valori
 */
export function riempi(testo, valori) {
  return String(testo ?? '').replace(/\{(\w+)\}/g, (_, k) => (k in valori ? String(valori[k]) : `{${k}}`));
}

/**
 * @param {{
 *   documento: Document, contenitore: HTMLElement,
 *   testi: object,                                    contenuti/interfaccia.json
 *   economia: { monete: number, scintille: number },
 *   ferruccio: { maschere: number },
 *   maschereMax: () => number,
 *   banchetto: () => (ReturnType<import('../oggetti/banchetto.js').creaBanchetto> | null),
 *   nomeDono: (id: string) => string,
 *   tastoInteragisci: () => string
 * }} o
 */
export function creaInterfacciaEconomia({ documento, contenitore, testi, economia, ferruccio, maschereMax, banchetto, nomeDono, tastoInteragisci }) {
  if (!documento || !contenitore || !testi || !economia || !ferruccio) throw new TypeError('creaInterfacciaEconomia: dipendenze mancanti');
  const T = testi;

  const hud = documento.createElement('div');
  hud.className = 'hud';
  const voci = {};
  for (const k of ['monete', 'scintille', 'maschere']) {
    const voce = documento.createElement('span');
    voce.className = `hud-${k}`;
    const etichetta = documento.createElement('span');
    etichetta.className = 'etichetta';
    etichetta.textContent = T.hud?.[k] ?? k;
    const valore = documento.createElement('span');
    valore.className = 'valore';
    voce.append(etichetta, ' ', valore);
    hud.append(voce);
    voci[k] = valore;
  }
  contenitore.append(hud);

  const sezione = documento.createElement('section');
  sezione.className = 'banchetto';
  sezione.hidden = true;
  const titolo = documento.createElement('h2');
  titolo.textContent = T.banchetto?.titolo ?? '';
  const istruzione = documento.createElement('p');
  istruzione.className = 'istruzione';
  const lista = documento.createElement('ol');
  const esito = documento.createElement('p');
  esito.className = 'esito';
  sezione.append(titolo, istruzione, lista, esito);
  contenitore.append(sezione);

  /** Nome mostrato di uno slot. */
  function nomeSlot(slot) {
    if (slot.tipo === 'dono') return nomeDono?.(slot.id) ?? slot.id;
    if (slot.tipo === 'cuore') return T.banchetto?.cuore ?? 'cuore';
    return T.consumabili?.[slot.id]?.nome ?? slot.id;
  }

  /** Testo dell'esito dell'ultimo acquisto. */
  function testoEsito(e, slots) {
    if (!e) return '';
    if (e.esito === 'comprato') return riempi(T.banchetto?.esito_comprato, { nome: nomeSlot(slots[e.slot] ?? {}), prezzo: e.prezzo });
    if (e.motivo === 'monete') return riempi(T.banchetto?.esito_monete, { prezzo: e.prezzo ?? '' });
    if (e.motivo === 'maschere_piene') return T.banchetto?.esito_maschere_piene ?? '';
    if (e.motivo === 'vuoto') return T.banchetto?.esito_comprato_gia ?? '';
    return '';
  }

  let firma = '';

  /** Aggiorna HUD e banchetto (una volta per frame). */
  function aggiorna() {
    voci.monete.textContent = String(economia.monete);
    voci.scintille.textContent = String(economia.scintille);
    voci.maschere.textContent = `${ferruccio.maschere}/${maschereMax()}`;
    const b = banchetto?.();
    if (!b || !b.attivo) {
      if (!sezione.hidden) sezione.hidden = true;
      firma = '';
      return;
    }
    const slots = b.slots();
    const vicino = b.vicino();
    const nuovaFirma = JSON.stringify([slots.map((s) => [s.comprato, s.accessibile, s.prezzo, s.id]), vicino, b.ultimoEsito, economia.monete]);
    if (sezione.hidden) sezione.hidden = false;
    if (nuovaFirma === firma) return;
    firma = nuovaFirma;
    istruzione.textContent = riempi(T.banchetto?.istruzione, { tasto: tastoInteragisci?.() ?? '' });
    lista.replaceChildren();
    slots.forEach((slot, i) => {
      const li = documento.createElement('li');
      li.className = `slot slot-${slot.tipo}${slot.comprato ? ' comprato' : ''}${slot.accessibile ? ' accessibile' : ' non-accessibile'}${i === vicino ? ' vicino' : ''}`;
      li.dataset.slot = String(i);
      const nome = documento.createElement('span');
      nome.className = 'nome';
      nome.textContent = slot.comprato ? (T.banchetto?.vuoto ?? '') : nomeSlot(slot);
      const prezzo = documento.createElement('span');
      prezzo.className = 'prezzo';
      if (slot.comprato) {
        prezzo.textContent = T.banchetto?.comprato ?? '';
      } else if (slot.accessibile) {
        prezzo.textContent = String(slot.prezzo);
      } else {
        const barrato = documento.createElement('s');
        barrato.textContent = String(slot.prezzo);
        prezzo.append(barrato);
      }
      li.append(nome, ' ', prezzo);
      lista.append(li);
    });
    esito.textContent = testoEsito(b.ultimoEsito, slots);
  }

  return { aggiorna, disegna: aggiorna, elementi: { hud, sezione, lista, esito } };
}
