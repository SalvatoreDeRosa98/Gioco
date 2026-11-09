/**
 * motore/interfaccia/oggetti.js — Interfaccia DOM della squadra oggetti (storia P04/P09): lo slot dell'oggetto ATTIVO con le
 * tacche di carica (Teatro HUD ~5056), il MODALE di sostituzione dei cinque slot (Teatro disegnaModalSostituzione5Slot
 * ~5297: 1-5 sceglie lo slot, Esc/Q rinuncia) e il PANNELLO di conferma del Patto d'Ombra («−1 Maschera massima per
 * sempre»; le azioni `conferma`/`indietro` le legge `oggetti/patto.js` dall'input). Testi da `contenuti/interfaccia.json ›
 * attivi | sostituzione | patto`; stile in `stile/oggetti.css` (colori dai token). Il modale legge i tasti dal DOM in
 * cattura come il menu (`interfaccia/menu.js`) e li consuma, così non arrivano al gioco.
 */

import { riempi } from './banchetto.js';

/** Tasti del modale (KeyboardEvent.code): cifre 1-5 e rinuncia. Non sono valori di gioco. */
const TASTI_MODALE = Object.freeze({ cifra: /^Digit[1-5]$/, rinuncia: ['Escape', 'KeyQ'] });

/**
 * @param {{
 *   documento: Document, finestra?: Window | null, contenitore: HTMLElement,
 *   testi: object,
 *   attivi: { stato: () => object | null },
 *   slot: { stato: () => object, conferma: Function, annulla: Function },
 *   patto: { pendente: object | null },
 *   modificatori: { dono: (id: string) => object | null },
 *   tastoAttivo: () => string, tastoConferma: () => string, tastoIndietro: () => string
 * }} o
 */
export function creaInterfacciaOggetti({ documento, finestra = null, contenitore, testi, attivi, slot, patto, modificatori, tastoAttivo, tastoConferma, tastoIndietro }) {
  if (!documento || !contenitore || !testi || !attivi || !slot || !patto || !modificatori) throw new TypeError('creaInterfacciaOggetti: dipendenze mancanti');
  const T = testi.attivi ?? {};
  const TS = testi.sostituzione ?? {};
  const TP = testi.patto ?? {};
  const el = (tag, classe, padre) => { const e = documento.createElement(tag); if (classe) e.className = classe; padre.appendChild(e); return e; };

  // HUD dell'attivo
  const hud = el('div', 'attivo-hud', contenitore);
  hud.hidden = true;
  const hudNome = el('span', 'attivo-nome', hud);
  const hudTacche = el('span', 'attivo-tacche', hud);
  const hudIstruzione = el('span', 'attivo-istruzione', hud);

  // modale di sostituzione
  const modale = el('div', 'sostituzione', contenitore);
  modale.hidden = true;
  const modTitolo = el('h2', 'sostituzione-titolo', modale);
  const modNuovo = el('p', 'sostituzione-nuovo', modale);
  const modLista = el('ol', 'sostituzione-lista', modale);
  const modIstruzione = el('p', 'sostituzione-istruzione', modale);
  const modRinuncia = el('button', 'sostituzione-rinuncia', modale);
  modRinuncia.type = 'button';
  modRinuncia.addEventListener('click', () => slot.annulla());

  // pannello del patto
  const pannello = el('div', 'patto-conferma', contenitore);
  pannello.hidden = true;
  const pTitolo = el('h2', 'patto-titolo', pannello);
  const pNome = el('p', 'patto-nome', pannello);
  const pStats = el('p', 'patto-stats', pannello);
  const pLore = el('p', 'patto-lore', pannello);
  const pCosto = el('p', 'patto-costo', pannello);
  const pIstruzione = el('p', 'patto-istruzione', pannello);

  let firmaHud = '';
  let firmaModale = '';
  let firmaPatto = '';

  function suTasto(e) {
    if (modale.hidden) return;
    if (TASTI_MODALE.cifra.test(e.code)) slot.conferma(Number(e.code.slice(5)) - 1);
    else if (TASTI_MODALE.rinuncia.includes(e.code)) slot.annulla();
    else return;
    e.preventDefault();
    e.stopPropagation();
  }
  finestra?.addEventListener('keydown', suTasto, true);

  function aggiornaHud() {
    const st = attivi.stato();
    const firma = st ? `${st.id}|${st.carica}|${st.maxCarica}` : '';
    if (firma === firmaHud) return;
    firmaHud = firma;
    hud.hidden = !st;
    if (!st) return;
    hudNome.textContent = st.nome;
    hudTacche.textContent = '';
    for (let i = 0; i < st.maxCarica; i++) {
      const t = el('i', `tacca${i < st.carica ? ' piena' : ''}`, hudTacche);
      t.setAttribute('aria-hidden', 'true');
    }
    hud.classList.toggle('carico', st.carico);
    hudIstruzione.textContent = riempi(T.istruzione ?? '', { tasto: tastoAttivo(), carica: st.carica, max: st.maxCarica });
  }

  function aggiornaModale() {
    const st = slot.stato();
    const firma = st.pendente ? `${st.pendente.id}|${st.attivi.join(',')}` : '';
    if (firma === firmaModale) return;
    firmaModale = firma;
    modale.hidden = !st.pendente;
    if (!st.pendente) return;
    modTitolo.textContent = TS.titolo ?? '';
    modNuovo.textContent = riempi(TS.nuovo ?? '', { nome: st.pendente.nome });
    modLista.textContent = '';
    st.attivi.forEach((id, i) => {
      const li = el('li', 'sostituzione-voce', modLista);
      const b = el('button', 'sostituzione-slot', li);
      b.type = 'button';
      b.textContent = `${i + 1}. ${modificatori.dono(id)?.nome ?? id}`;
      b.addEventListener('click', () => slot.conferma(i));
    });
    modIstruzione.textContent = TS.istruzione ?? '';
    modRinuncia.textContent = TS.rinuncia ?? '';
  }

  function aggiornaPatto() {
    const p = patto.pendente;
    const firma = p ? p.id : '';
    if (firma === firmaPatto) return;
    firmaPatto = firma;
    pannello.hidden = !p;
    if (!p) return;
    pTitolo.textContent = TP.titolo ?? '';
    pNome.textContent = p.reliquia?.nome ?? p.id;
    pStats.textContent = p.reliquia?.statsDesc ?? '';
    pLore.textContent = p.reliquia?.lore ?? '';
    pCosto.textContent = TP.costo ?? '';
    pIstruzione.textContent = riempi(TP.istruzione ?? '', { conferma: tastoConferma(), indietro: tastoIndietro() });
  }

  return {
    aggiorna() { aggiornaHud(); aggiornaModale(); aggiornaPatto(); },
    /** Stato del DOM per i test. */
    stato() {
      return {
        attivo: hud.hidden ? null : { nome: hudNome.textContent, tacche: hudTacche.children.length, piene: hudTacche.querySelectorAll('.piena').length, carico: hud.classList.contains('carico') },
        sostituzione: modale.hidden ? null : { titolo: modTitolo.textContent, nuovo: modNuovo.textContent, voci: Array.from(modLista.children, (li) => li.textContent) },
        patto: pannello.hidden ? null : { nome: pNome.textContent, costo: pCosto.textContent, istruzione: pIstruzione.textContent },
      };
    },
    smonta() { finestra?.removeEventListener('keydown', suTasto, true); },
  };
}
