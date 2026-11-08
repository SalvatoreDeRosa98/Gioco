/**
 * motore/interfaccia/doni.js — Interfaccia DOM MINIMALE dei doni: HUD dei doni raccolti e cartiglio
 * del dono (GDD doni-modificatori.md regole 10-11). Storia 024.
 *
 * Non è grafica definitiva (il renderer vero aspetta l'approvazione dell'autore): elementi in
 * `#interfaccia` con classi semantiche e stile in `stile/interfaccia.css` (colori solo dai token).
 * - HUD: una fila di sagome (`<li class="dono oro|azzurro">`) in ordine di raccolta, con la forma della
 *   sagoma come testo provvisorio; i ricordi hanno la classe `azzurro` (alone).
 * - Cartiglio: a ogni `doni.aggiunto` mostra nome e la riga del catalogo per `tCartiglioMs()` di tempo
 *   di gioco (`tick(dt)`), senza fermare il ciclo; un secondo cartiglio sostituisce il primo e riparte
 *   il timer; se `piedistallo.raccolto` dice `alMassimo`, sotto compare la riga «già al massimo»; un
 *   sostituto (cuore/monete) ha il suo testo. Quando nessun cartiglio di raccolta è acceso e un
 *   piedistallo offerto è nel cono di luce, lo stesso elemento mostra l'ANTEPRIMA (classe `anteprima`)
 *   con nome, riga e l'istruzione del tasto.
 * Tutti i testi vengono da `contenuti/interfaccia.json › doni`; nome e riga dal catalogo.
 */

import { riempi } from './banchetto.js';

/**
 * @param {{
 *   documento: Document, contenitore: HTMLElement,
 *   testi: object,                                    contenuti/interfaccia.json
 *   modificatori: { doniAttivi: () => string[], dono: (id: string) => object | null },
 *   eventi: { on: Function },
 *   piedistalli?: (() => (ReturnType<import('../oggetti/piedistallo.js').creaPiedistalli> | null)) | null,
 *   tCartiglioMs: () => number,
 *   tastoInteragisci: () => string
 * }} o
 */
export function creaInterfacciaDoni({ documento, contenitore, testi, modificatori, eventi, piedistalli = null, tCartiglioMs, tastoInteragisci }) {
  if (!documento || !contenitore || !testi || !modificatori || !eventi || typeof tCartiglioMs !== 'function') {
    throw new TypeError('creaInterfacciaDoni: dipendenze mancanti');
  }
  const T = testi.doni ?? {};

  const hud = documento.createElement('section');
  hud.className = 'hud-doni';
  hud.hidden = true; // compare con il primo dono
  const titolo = documento.createElement('h2');
  titolo.textContent = T.titolo ?? '';
  const lista = documento.createElement('ol');
  hud.append(titolo, lista);
  contenitore.append(hud);

  const cartiglio = documento.createElement('aside');
  cartiglio.className = 'cartiglio';
  cartiglio.hidden = true;
  const nome = documento.createElement('h3');
  nome.className = 'nome';
  const riga = documento.createElement('p');
  riga.className = 'riga';
  const avviso = documento.createElement('p');
  avviso.className = 'avviso';
  cartiglio.append(nome, riga, avviso);
  contenitore.append(cartiglio);

  /** Stato del cartiglio: null, oppure { tipo: 'raccolto'|'anteprima', id, nome, riga, avviso, azzurro, restanteMs }. */
  let corrente = null;
  let firmaHud = '';
  let firmaCartiglio = '';

  const eAzzurro = (dono) => dono?.sagoma?.tipo === 'profilo';

  /** Testo del sostituto del pool (cuore o monete). */
  function testoFallback(f) {
    if (!f) return { nome: '', riga: '' };
    if (f.tipo === 'cuore') return { nome: T.fallback_cuore ?? '', riga: T.fallback_cuore_riga ?? '' };
    return { nome: riempi(T.fallback_monete, { n: f.valore }), riga: T.fallback_monete_riga ?? '' };
  }

  /** Accende il cartiglio di raccolta per il dono `id` (sostituisce il precedente, timer da capo). */
  function mostraRaccolto(id, { avviso: av = '', fallback = null } = {}) {
    const dono = id ? modificatori.dono(id) : null;
    const base = dono ? { nome: dono.nome, riga: dono.cartiglio } : testoFallback(fallback);
    corrente = { tipo: 'raccolto', id, nome: base.nome, riga: base.riga, avviso: av, azzurro: eAzzurro(dono), restanteMs: tCartiglioMs() };
  }

  eventi.on('doni.aggiunto', (p) => { if (p?.id) mostraRaccolto(p.id); });
  eventi.on('piedistallo.raccolto', (p) => {
    if (!p) return;
    if (p.id) {
      if (corrente?.tipo === 'raccolto' && corrente.id === p.id && p.alMassimo) corrente.avviso = T.gia_al_massimo ?? '';
    } else if (p.fallback) {
      mostraRaccolto(null, { fallback: p.fallback });
    }
  });

  /**
   * Avanza il timer del cartiglio (tempo di gioco, non ferma nulla).
   * @param {number} dt secondi
   */
  function tick(dt) {
    if (corrente?.tipo !== 'raccolto') return;
    corrente.restanteMs -= dt * 1000;
    if (corrente.restanteMs <= 0) corrente = null;
  }

  /** Riscrive HUD e cartiglio se qualcosa è cambiato (una volta per frame). */
  function aggiorna() {
    const attivi = modificatori.doniAttivi();
    const firma = attivi.join('|');
    if (firma !== firmaHud) {
      firmaHud = firma;
      lista.replaceChildren();
      for (const id of attivi) {
        const dono = modificatori.dono(id);
        const li = documento.createElement('li');
        li.className = `dono ${eAzzurro(dono) ? 'azzurro' : 'oro'}`;
        li.dataset.id = id;
        li.title = dono ? `${dono.nome} — ${dono.cartiglio}` : id;
        li.textContent = dono?.sagoma?.forma ?? id;
        lista.append(li);
      }
      hud.hidden = attivi.length === 0;
    }
    // anteprima: solo se nessun cartiglio di raccolta è acceso
    if (!corrente || corrente.tipo === 'anteprima') {
      const p = piedistalli?.()?.anteprima() ?? null;
      if (p) {
        const base = p.dono ? { nome: p.dono.nome, riga: p.dono.cartiglio } : testoFallback(p.fallback);
        corrente = { tipo: 'anteprima', id: p.id, nome: base.nome, riga: base.riga, avviso: riempi(T.anteprima, { tasto: tastoInteragisci?.() ?? '' }), azzurro: eAzzurro(p.dono), restanteMs: 0 };
      } else {
        corrente = null;
      }
    }
    const nuova = corrente ? `${corrente.tipo}|${corrente.id}|${corrente.nome}|${corrente.avviso}` : '';
    if (nuova === firmaCartiglio) return;
    firmaCartiglio = nuova;
    if (!corrente) {
      cartiglio.hidden = true;
      return;
    }
    cartiglio.hidden = false;
    cartiglio.className = `cartiglio ${corrente.tipo} ${corrente.azzurro ? 'azzurro' : 'oro'}`;
    nome.textContent = corrente.nome;
    riga.textContent = corrente.riga;
    avviso.textContent = corrente.avviso;
    avviso.hidden = !corrente.avviso;
  }

  return {
    tick,
    aggiorna,
    disegna: aggiorna,
    /** Stato del cartiglio per debug e test (copia) o null. */
    cartiglio: () => (corrente ? { ...corrente } : null),
    elementi: { hud, lista, cartiglio, nome, riga, avviso },
  };
}
