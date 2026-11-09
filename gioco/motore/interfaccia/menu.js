/**
 * motore/interfaccia/menu.js — Menu di selezione del personaggio e dello slot (storia P04 / 032, Teatro).
 *
 * Veste del Teatro (`disegnaMenuSelezionePersonaggio` ~4042) in DOM: sipario rosso con frange d'oro, quattro
 * carte affiancate (sprite in pixel-art su un piccolo canvas, vita a cuori, DMG, SPD, oggetto attivo, dono
 * iniziale) e, sotto, i cinque slot di salvataggio con il riassunto (personaggio, run, scintille, piano
 * massimo) e «Cancella» con conferma in pagina. Tasti: frecce/A-D o 1-4 scelgono il personaggio, Tab o W/S
 * lo slot, Spazio/Invio iniziano; il mouse fa lo stesso. Testi da `contenuti/interfaccia.json › menu`,
 * nomi dei personaggi da `personaggi.json`. Il menu non conosce il ciclo: `apri()` ritorna una Promise
 * risolta con `{ personaggio, slot }`; chi compone decide cosa farne.
 * Dipendenze: solo il DOM iniettato, `resa/pixel-sprites.js` per lo sprite, `riempi` dei testi.
 */

import { riempi } from './banchetto.js';
import { disegnaGrigliaPixel, SPRITE_FERRUCCIO } from '../resa/pixel-sprites.js';

/** Codici dei tasti del menu (tasti dell'interfaccia, non azioni di gioco: la mappa di input.json resta del gioco). */
const TASTI = Object.freeze({
  sinistra: ['ArrowLeft', 'KeyA'], destra: ['ArrowRight', 'KeyD'], slotSu: ['ArrowUp', 'KeyW'], slotGiu: ['ArrowDown', 'KeyS', 'Tab'],
  inizia: ['Space', 'Enter'], cancella: ['Delete', 'Backspace'], esc: ['Escape'],
});

/**
 * @param {{
 *   documento: Document, finestra: Window, contenitore: HTMLElement,
 *   testi: { menu: Record<string, string> },
 *   personaggi: { ordine: string[], predefinito: string, personaggi: Record<string, object> },
 *   attivi: Record<string, { nome: string }>,
 *   nomeDono: (id: string) => string,
 *   statistiche: (id: string) => { dmg: number, speed: number, maschereMax: number },
 *   salvataggio: { carica: (tipo: string, slot: string) => object | null, cancella: (slot: string) => void },
 *   slots: string[],
 *   nomePersonaggio?: (id: string) => string
 * }} o
 */
export function creaMenu({ documento, finestra, contenitore, testi, personaggi, attivi, nomeDono, statistiche, salvataggio, slots }) {
  if (!documento || !contenitore || !testi?.menu || !personaggi?.personaggi || !salvataggio || !Array.isArray(slots)) {
    throw new TypeError('creaMenu: dipendenze mancanti');
  }
  const T = testi.menu;
  const ordine = personaggi.ordine ?? Object.keys(personaggi.personaggi);
  let scelto = personaggi.predefinito ?? ordine[0];
  let slotScelto = slots[0];
  let daCancellare = null;
  let risolvi = null;
  let aperto = false;

  const radice = documento.createElement('section');
  radice.className = 'menu-teatro';
  radice.hidden = true;
  radice.setAttribute('role', 'dialog');
  const sipario = documento.createElement('div');
  sipario.className = 'menu-sipario';
  const titolo = documento.createElement('h1');
  titolo.textContent = T.titolo;
  const sotto = documento.createElement('p');
  sotto.className = 'menu-sottotitolo';
  sotto.textContent = T.sottotitolo;
  const carte = documento.createElement('div');
  carte.className = 'menu-carte';
  const slotTitolo = documento.createElement('h2');
  slotTitolo.textContent = T.slot_titolo;
  const listaSlot = documento.createElement('ol');
  listaSlot.className = 'menu-slot';
  const conferma = documento.createElement('div');
  conferma.className = 'menu-conferma';
  conferma.hidden = true;
  const bInizia = documento.createElement('button');
  bInizia.type = 'button';
  bInizia.className = 'menu-inizia';
  bInizia.textContent = T.inizia;
  const istruzioni = documento.createElement('p');
  istruzioni.className = 'menu-istruzioni';
  istruzioni.textContent = T.istruzioni;
  radice.append(sipario, titolo, sotto, carte, slotTitolo, listaSlot, conferma, bInizia, istruzioni);
  contenitore.append(radice);

  /** @type {Map<string, HTMLElement>} */
  const cartePerId = new Map();
  const cuori = (n) => '♥'.repeat(Math.max(0, n));

  function costruisciCarte() {
    carte.replaceChildren();
    cartePerId.clear();
    ordine.forEach((id, i) => {
      const p = personaggi.personaggi[id];
      const carta = documento.createElement('button');
      carta.type = 'button';
      carta.className = 'menu-carta';
      carta.dataset.personaggio = id;
      const tasto = documento.createElement('span');
      tasto.className = 'menu-tasto';
      tasto.textContent = riempi(T.tasto, { n: i + 1 });
      const tela = documento.createElement('canvas');
      tela.className = 'menu-sprite';
      tela.width = 80;
      tela.height = 80;
      const ctx = tela.getContext?.('2d');
      if (ctx) disegnaGrigliaPixel(ctx, SPRITE_FERRUCCIO.idle0, 40, 44, 3, false, false);
      const nome = documento.createElement('strong');
      nome.textContent = p.nome;
      const tit = documento.createElement('em');
      tit.textContent = p.titolo;
      const st = statistiche(id);
      const dl = documento.createElement('dl');
      const riga = (k, v, classe) => {
        const dt = documento.createElement('dt'); dt.textContent = k;
        const dd = documento.createElement('dd'); dd.textContent = v; if (classe) dd.className = classe;
        dl.append(dt, dd);
      };
      riga(T.vita, cuori(st.maschereMax), 'menu-cuori');
      riga(T.dmg, st.dmg.toFixed(2));
      riga(T.spd, st.speed.toFixed(2));
      riga(T.attivo, attivi?.[p.attivoIniziale]?.nome ?? p.attivoIniziale ?? T.nessuno);
      riga(T.dono, p.passivoIniziale ? nomeDono(p.passivoIniziale) : T.nessuno);
      const desc = documento.createElement('p');
      desc.textContent = p.descrizione ?? '';
      carta.append(tasto, tela, nome, tit, dl, desc);
      carta.addEventListener('click', () => { scegli(id); });
      carta.addEventListener('dblclick', () => { scegli(id); inizia(); });
      carte.append(carta);
      cartePerId.set(id, carta);
    });
  }

  /** Riassunto di uno slot dal salvataggio (profilo e notte), tollerante ai campi assenti. */
  function riassuntoSlot(slot) {
    const profilo = salvataggio.carica('profilo', slot);
    const notte = salvataggio.carica('notte', slot);
    if (!profilo && !notte) return null;
    const av = profilo?.avanzamento ?? profilo ?? {};
    return {
      personaggio: profilo?.personaggio ?? null,
      notte: av.notte ?? notte?.notte ?? 1,
      scintille: profilo?.scintille ?? 0,
      piano_max: av.piano_max ?? 1,
      notteInCorso: Boolean(notte),
    };
  }

  function costruisciSlot() {
    listaSlot.replaceChildren();
    for (const slot of slots) {
      const li = documento.createElement('li');
      li.className = 'menu-slot-voce';
      li.dataset.slot = slot;
      if (slot === slotScelto) li.classList.add('scelto');
      const b = documento.createElement('button');
      b.type = 'button';
      b.className = 'menu-slot-scegli';
      const r = riassuntoSlot(slot);
      const nome = riempi(T.slot_nome, { n: slot });
      const riga = r
        ? riempi(T.slot_riga, {
          personaggio: r.personaggio ? (personaggi.personaggi[r.personaggio]?.nome ?? r.personaggio) : T.nessuno,
          notte: r.notte, scintille: r.scintille, piano_max: r.piano_max,
        })
        : T.slot_vuoto;
      b.textContent = `${nome} — ${riga}`;
      b.addEventListener('click', () => { slotScelto = slot; daCancellare = null; aggiorna(); });
      li.append(b);
      if (r) {
        const c = documento.createElement('button');
        c.type = 'button';
        c.className = 'menu-slot-cancella';
        c.textContent = T.cancella;
        c.addEventListener('click', () => { daCancellare = slot; aggiorna(); });
        li.append(c);
      }
      listaSlot.append(li);
    }
  }

  function costruisciConferma() {
    conferma.replaceChildren();
    if (daCancellare === null) { conferma.hidden = true; return; }
    conferma.hidden = false;
    const p = documento.createElement('p');
    p.textContent = riempi(T.conferma_cancella, { n: daCancellare });
    const si = documento.createElement('button');
    si.type = 'button';
    si.className = 'menu-conferma-si';
    si.textContent = T.si;
    si.addEventListener('click', () => { salvataggio.cancella(daCancellare); daCancellare = null; aggiorna(); });
    const no = documento.createElement('button');
    no.type = 'button';
    no.className = 'menu-conferma-no';
    no.textContent = T.no;
    no.addEventListener('click', () => { daCancellare = null; aggiorna(); });
    conferma.append(p, si, no);
  }

  function aggiorna() {
    for (const [id, carta] of cartePerId) carta.classList.toggle('scelta', id === scelto);
    costruisciSlot();
    costruisciConferma();
  }

  function scegli(id) {
    if (!personaggi.personaggi[id]) return;
    scelto = id;
    aggiorna();
  }

  function inizia() {
    if (!aperto || daCancellare !== null) return;
    const esito = { personaggio: scelto, slot: slotScelto };
    chiudi();
    risolvi?.(esito);
    risolvi = null;
  }

  function suTasto(e) {
    if (!aperto) return;
    const i = ordine.indexOf(scelto);
    const js = slots.indexOf(slotScelto);
    if (TASTI.sinistra.includes(e.code)) scegli(ordine[(i - 1 + ordine.length) % ordine.length]);
    else if (TASTI.destra.includes(e.code)) scegli(ordine[(i + 1) % ordine.length]);
    else if (TASTI.slotGiu.includes(e.code)) { slotScelto = slots[(js + 1) % slots.length]; aggiorna(); }
    else if (TASTI.slotSu.includes(e.code)) { slotScelto = slots[(js - 1 + slots.length) % slots.length]; aggiorna(); }
    else if (/^Digit[1-9]$/.test(e.code)) { const n = Number(e.code.slice(5)) - 1; if (ordine[n]) scegli(ordine[n]); }
    else if (TASTI.inizia.includes(e.code)) { if (daCancellare !== null) { salvataggio.cancella(daCancellare); daCancellare = null; aggiorna(); } else inizia(); }
    else if (TASTI.esc.includes(e.code)) { daCancellare = null; aggiorna(); }
    else return;
    e.preventDefault();
    e.stopPropagation();
  }

  function chiudi() {
    aperto = false;
    radice.hidden = true;
    finestra?.removeEventListener('keydown', suTasto, true);
  }

  bInizia.addEventListener('click', inizia);
  costruisciCarte();

  return {
    /**
     * Mostra il menu e aspetta la scelta.
     * @param {{ personaggio?: string, slot?: string }} [iniziale]
     * @returns {Promise<{ personaggio: string, slot: string }>}
     */
    apri(iniziale = {}) {
      if (iniziale.personaggio && personaggi.personaggi[iniziale.personaggio]) scelto = iniziale.personaggio;
      if (iniziale.slot && slots.includes(String(iniziale.slot))) slotScelto = String(iniziale.slot);
      daCancellare = null;
      aperto = true;
      radice.hidden = false;
      aggiorna();
      finestra?.addEventListener('keydown', suTasto, true);
      return new Promise((r) => { risolvi = r; });
    },
    chiudi,
    scegli,
    scegliSlot(slot) { if (slots.includes(String(slot))) { slotScelto = String(slot); aggiorna(); } },
    inizia,
    /** Stato del menu (debug e test). */
    stato() {
      return aperto ? { personaggio: scelto, slot: slotScelto, daCancellare, slots: slots.map((s) => ({ slot: s, riassunto: riassuntoSlot(s) })) } : null;
    },
    get aperto() { return aperto; },
  };
}
