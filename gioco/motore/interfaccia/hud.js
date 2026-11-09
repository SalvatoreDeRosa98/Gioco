/**
 * motore/interfaccia/hud.js — L'HUD completo del Teatro in DOM (storia P13; Teatro `disegnaHUDPixelArt` ~5056-5290).
 *
 * Stessa impaginazione del prototipo dell'autore, sopra il canvas, dentro `#interfaccia`:
 *  - in alto a sinistra la SCHEDA: nome e titolo del personaggio scelto (`statistiche.id` → personaggi.json), piano e
 *    ciclo della run (`mondo/run.js`), il tipo della stanza corrente in piccolo, la vita a MEZZE MASCHERE con i PNG
 *    `hud-cuore-pieno/mezzo/vuoto` del manifesto (le massime vuote restano visibili), la riga delle statistiche con le
 *    icone PNG (`hud-icona-dmg`, `-tears`, `-spd`, `-range`) e i valori reali di `statistiche.correnti()`, le monete
 *    (`hud-icona-moneta`) e le scintille (`hud-icona-scintilla`);
 *  - in alto al centro la BARRA DELLA VITA DEL BOSS (`hud-barra-boss` come cornice, riempimento in percentuale) con il
 *    titolo di `interfaccia.json › boss_hud`: è l'unica barra (il renderer non la disegna più);
 *  - in basso al centro il DOCK: lo slot dell'oggetto ATTIVO (`hud-slot-attivo`, icona `attivo-<id>`, tacche di carica,
 *    la scritta del tasto), i CINQUE SLOT dei doni (`hud-slot-vuoto` come cornice, dentro l'icona `oggetto-<id_teatro>`;
 *    senza PNG resta la forma della sagoma come testo; i ricordi sono `azzurro`), le reliquie del Patto (`patto-<id>`)
 *    e una didascalia con il nome dell'oggetto sotto il puntatore (oltre al `title`).
 * Mentre un dialogo è aperto (cartiglio o tableau) o nel menu l'HUD si nasconde. Tutte le immagini vengono dal manifesto
 * (`sprite(nome)` → src risolto da `fondazione/risorse.js`), mai da percorsi scritti qui; i testi da `interfaccia.json ›
 * hud` e `boss_hud`; le cifre decimali da `resa.json › hud`; misure e colori in `stile/hud.css`. Il modulo legge e non
 * muta: nessun numero di gioco, nessuna stringa di gioco. Funziona anche con un DOM finto minimale (createElement,
 * `append`, `className`, `hidden`, `textContent`, `title`): `classList`, `style`, `dataset` e `addEventListener` sono
 * usati solo se esistono.
 */

import { riempi } from './banchetto.js';

/** Prefissi dei nomi del manifesto degli sprite (nomi di file, non valori di gioco). */
const SPRITE = Object.freeze({
  pieno: 'hud-cuore-pieno', mezzo: 'hud-cuore-mezzo', vuoto: 'hud-cuore-vuoto',
  dmg: 'hud-icona-dmg', tears: 'hud-icona-tears', spd: 'hud-icona-spd', range: 'hud-icona-range',
  moneta: 'hud-icona-moneta', scintilla: 'hud-icona-scintilla',
  slotVuoto: 'hud-slot-vuoto', slotAttivo: 'hud-slot-attivo', barraBoss: 'hud-barra-boss',
  oggetto: 'oggetto-', attivo: 'attivo-', patto: 'patto-',
});
/** Le quattro statistiche mostrate, nell'ordine del Teatro, con la chiave di `statistiche.correnti()`. */
const STATISTICHE = Object.freeze([
  { chiave: 'dmg', campo: 'dmg' },
  { chiave: 'tears', campo: 'tearsPerSec' },
  { chiave: 'spd', campo: 'speed' },
  { chiave: 'range', campo: 'range' },
]);
/** Stati del renderer in cui un boss è «vivo» per la barra. */
const STATO_MORTO = 'morto';
/** Etichetta corta di un tasto (KeyboardEvent.code → la lettera o la cifra, come la «Q» del Teatro). Non è un valore di gioco. */
const etichettaTasto = (codice) => String(codice ?? '').replace(/^(Key|Digit)/, '');
/** Nome del manifesto di una reliquia del Patto: `patto_raggio` → `patto-raggio`. */
const nomeSpritePatto = (id) => `${SPRITE.patto}${String(id).replace(/^patto[_-]/, '').replace(/_/g, '-')}`;

/**
 * @param {{
 *   documento: Document, contenitore: HTMLElement,
 *   testi: object,                                              contenuti/interfaccia.json (hud, boss_hud)
 *   decimali: { dmg: number, tears: number, spd: number, range: number },   resa.json › hud
 *   sprite: (nome: string) => (string | null),                  src dell'immagine del manifesto, o null
 *   personaggi: Record<string, { nome: string, titolo?: string }>,
 *   statistiche: { correnti: () => (object | null), id: string | null },
 *   ferruccio: { maschere: number },
 *   maschereMax: () => number,
 *   economia: { monete: number, scintille: number },
 *   run?: (() => ({ piano: number, ciclo: number, pianiPerCiclo?: number } | null)) | null,
 *   notte?: (() => ({ stanza: { tipo: string } | null } | null)) | null,
 *   hub?: (() => ({ attivo: boolean } | null)) | null,
 *   attivi?: { stato: () => (object | null) } | null,
 *   doni: () => ({ attivi: string[], max: number }),
 *   dono: (id: string) => (object | null),
 *   patti?: (() => string[]) | null,
 *   reliquia?: ((id: string) => (object | null)) | null,
 *   boss?: (() => (object | null)) | null,
 *   visibile?: () => boolean,
 *   dialogoAperto?: () => boolean,
 *   tastoAttivo?: () => string
 * }} o
 */
export function creaHud({
  documento, contenitore, testi, decimali, sprite, personaggi, statistiche, ferruccio, maschereMax, economia,
  run = null, notte = null, hub = null, attivi = null, doni, dono, patti = null, reliquia = null, boss = null,
  visibile = () => true, dialogoAperto = () => false, tastoAttivo = () => '',
}) {
  if (!documento || !contenitore || !testi?.hud || !decimali || typeof sprite !== 'function' || !personaggi || !statistiche
    || !ferruccio || typeof maschereMax !== 'function' || !economia || typeof doni !== 'function' || typeof dono !== 'function') {
    throw new TypeError('creaHud: dipendenze mancanti');
  }
  const T = testi.hud;
  const TB = testi.boss_hud ?? {};

  const aggiungi = (padre, figlio) => { if (typeof padre.append === 'function') padre.append(figlio); else padre.appendChild(figlio); };
  const el = (tag, classe, padre) => { const e = documento.createElement(tag); e.className = classe; if (padre) aggiungi(padre, e); return e; };
  const img = (nome, classe, padre) => {
    const e = el('img', classe, padre);
    const src = sprite(nome);
    if (src) e.src = src;
    e.alt = '';
    e.hidden = !src;
    if (typeof e.setAttribute === 'function') e.setAttribute('draggable', 'false');
    return e;
  };
  const sfondo = (e, nome) => { const src = sprite(nome); if (src && e.style) e.style.backgroundImage = `url("${src}")`; };

  const radice = el('section', 'hud-teatro', contenitore);
  radice.hidden = true;

  // 1. scheda in alto a sinistra
  const scheda = el('div', 'hud-scheda', radice);
  const intesta = el('div', 'hud-intesta', scheda);
  const eNome = el('span', 'hud-nome', intesta);
  const eTitolo = el('span', 'hud-titolo', intesta);
  const rigaPiano = el('div', 'hud-piano-riga', scheda);
  const ePiano = el('span', 'hud-piano', rigaPiano);
  const eStanza = el('span', 'hud-stanza', rigaPiano);
  const vita = el('div', 'hud-vita', scheda);
  vita.title = T.vita ?? '';
  /** @type {HTMLElement[]} */
  const maschere = [];
  const eVitaTesto = el('span', 'hud-vita-testo', vita);
  const rigaStat = el('div', 'hud-statistiche', scheda);
  const stat = {};
  for (const s of STATISTICHE) {
    const voce = el('span', `hud-stat hud-stat-${s.chiave}`, rigaStat);
    voce.title = T[s.chiave] ?? s.chiave;
    img(SPRITE[s.chiave], 'hud-icona', voce);
    const et = el('span', 'hud-etichetta', voce);
    et.textContent = T[s.chiave] ?? s.chiave;
    stat[s.chiave] = el('span', 'hud-valore', voce);
  }
  const rigaRisorse = el('div', 'hud-risorse', scheda);
  const eMonete = el('span', 'hud-monete', rigaRisorse);
  eMonete.title = T.monete ?? '';
  img(SPRITE.moneta, 'hud-icona', eMonete);
  const vMonete = el('span', 'hud-valore', eMonete);
  const eScintille = el('span', 'hud-scintille', rigaRisorse);
  eScintille.title = T.scintille ?? '';
  img(SPRITE.scintilla, 'hud-icona', eScintille);
  const vScintille = el('span', 'hud-valore', eScintille);

  // 2. barra del boss in alto al centro
  const eBoss = el('div', 'hud-boss', radice);
  eBoss.hidden = true;
  const eBossNome = el('span', 'hud-boss-nome', eBoss);
  const eBossBarra = el('div', 'hud-boss-barra', eBoss);
  sfondo(eBossBarra, SPRITE.barraBoss);
  const eBossRiempimento = el('div', 'hud-boss-riempimento', eBossBarra);
  const eBossVita = el('span', 'hud-boss-vita', eBoss);

  // 3. dock in basso al centro
  const dock = el('div', 'hud-dock', radice);
  const eAttivo = el('div', 'hud-attivo', dock);
  eAttivo.hidden = true;
  sfondo(eAttivo, SPRITE.slotAttivo);
  const eAttivoTasto = el('span', 'hud-attivo-tasto', eAttivo);
  const eAttivoIcona = img('', 'hud-attivo-icona', eAttivo);
  const eTacche = el('div', 'hud-tacche', eAttivo);
  /** @type {HTMLElement[]} */
  const tacche = [];
  const lista = el('ol', 'hud-slot-lista', dock);
  /** @type {{ li: HTMLElement, numero: HTMLElement, icona: HTMLElement, sagoma: HTMLElement }[]} */
  const slot = [];
  const ePatti = el('div', 'hud-patti', dock);
  /** @type {{ e: HTMLElement, icona: HTMLElement, sigla: HTMLElement }[]} */
  const vociPatti = [];
  const didascalia = el('p', 'hud-didascalia', radice);

  /** Mostra (o toglie) il nome dell'oggetto sotto il puntatore. */
  function passaggio(e, nome) {
    e.addEventListener?.('mouseenter', () => { didascalia.textContent = nome(); });
    e.addEventListener?.('mouseleave', () => { didascalia.textContent = ''; });
  }

  function assicuraSlot(n) {
    while (slot.length < n) {
      const i = slot.length;
      const li = el('li', 'hud-slot vuoto', lista);
      sfondo(li, SPRITE.slotVuoto);
      const numero = el('span', 'hud-slot-numero', li);
      numero.textContent = String(i + 1);
      const icona = img('', 'hud-slot-icona', li);
      const sagoma = el('span', 'hud-slot-sagoma', li);
      const voce = { li, numero, icona, sagoma, nome: '' };
      passaggio(li, () => voce.nome);
      slot.push(voce);
    }
  }
  function assicuraMaschere(n) {
    while (maschere.length < n) {
      const m = img(SPRITE.vuoto, 'hud-maschera vuoto', vita);
      if (vita.insertBefore && eVitaTesto.parentNode === vita) vita.insertBefore(m, eVitaTesto);
      maschere.push(m);
    }
  }
  function assicuraTacche(n) {
    while (tacche.length < n) {
      const t = el('i', 'tacca', eTacche);
      if (typeof t.setAttribute === 'function') t.setAttribute('aria-hidden', 'true');
      tacche.push(t);
    }
  }
  function assicuraPatti(n) {
    while (vociPatti.length < n) {
      const e = el('span', 'hud-patto', ePatti);
      const icona = img('', 'hud-patto-icona', e);
      const sigla = el('span', 'hud-patto-sigla', e);
      const voce = { e, icona, sigla, nome: '' };
      passaggio(e, () => voce.nome);
      vociPatti.push(voce);
    }
  }

  const arrotonda = (v, n) => (Number.isFinite(v) ? Number(v).toFixed(Math.max(0, n | 0)) : '');
  const compila = (t, dati) => riempi(t, dati);

  /** Fotografia dello stato da mostrare (solo lettura dello stato di gioco). */
  function fotografa() {
    const vis = Boolean(visibile()) && !dialogoAperto();
    const idPers = statistiche.id ?? null;
    const pers = idPers ? personaggi[idPers] ?? null : null;
    const r = typeof run === 'function' ? run() : null;
    const n = typeof notte === 'function' ? notte() : null;
    const h = typeof hub === 'function' ? hub() : null;
    const inNotte = Boolean(n?.stanza);
    const nellHub = !inNotte && Boolean(h?.attivo);
    const piano = inNotte && r ? r.piano : null;
    const ciclo = inNotte && r ? r.ciclo : null;
    const tipoStanza = inNotte ? n.stanza.tipo : (nellHub ? 'hub' : null);
    const max = Math.max(0, Math.round(maschereMax()));
    const correnti = Math.max(0, Number(ferruccio.maschere) || 0);
    const piene = Math.min(max, Math.floor(correnti));
    const mezza = piene < max && correnti - Math.floor(correnti) >= 0.5;
    const st = statistiche.correnti?.() ?? null;
    const a = attivi?.stato?.() ?? null;
    const d = doni();
    const idsPatti = patti ? patti() : [];
    const b = boss ? boss() : null;
    const bossVivo = b && b.stato !== STATO_MORTO && b.vita > 0 ? b : null;
    const datiBoss = bossVivo ? {
      piano: r?.piano ?? piano ?? '', piani: r?.pianiPerCiclo ?? '', ciclo: r?.ciclo ?? 1, nome: String(bossVivo.nomeBoss ?? '').toUpperCase(),
    } : null;
    return {
      visibile: vis,
      nome: pers?.nome ?? T.senza_personaggio ?? '',
      titolo: pers?.titolo ?? '',
      piano, ciclo,
      pianoTesto: piano === null
        ? (nellHub ? T.hub ?? '' : '')
        : compila(ciclo > 1 ? T.piano_ciclo : T.piano, { piano, ciclo }),
      stanza: tipoStanza,
      stanzaTesto: tipoStanza ? T.stanze?.[tipoStanza] ?? tipoStanza : '',
      maschere: { correnti, max, piene, mezza, vuote: Math.max(0, max - piene - (mezza ? 1 : 0)) },
      statistiche: st ? Object.fromEntries(STATISTICHE.map((s) => [s.chiave, arrotonda(st[s.campo], decimali[s.chiave])])) : null,
      monete: Number(economia.monete) || 0,
      scintille: Number(economia.scintille) || 0,
      attivo: a ? {
        id: a.id, nome: a.nome, tacche: a.maxCarica, piene: Math.min(a.maxCarica, a.carica), carico: Boolean(a.carico),
        icona: sprite(`${SPRITE.attivo}${a.id}`), tasto: etichettaTasto(tastoAttivo()),
      } : null,
      slot: Array.from({ length: Math.max(d.max, d.attivi.length) }, (_, i) => {
        const id = d.attivi[i];
        if (!id) return null;
        const def = dono(id);
        const idTeatro = def?.teatro?.id_teatro ?? null;
        return {
          indice: i, id, nome: def?.nome ?? id, azzurro: def?.sagoma?.tipo === 'profilo',
          icona: idTeatro ? sprite(`${SPRITE.oggetto}${idTeatro}`) : null, sagoma: def?.sagoma?.forma ?? '',
        };
      }),
      patti: idsPatti.map((id) => {
        const def = reliquia ? reliquia(id) : null;
        return { id, nome: def?.nome ?? id, icona: sprite(nomeSpritePatto(id)) };
      }),
      boss: bossVivo ? {
        nome: bossVivo.nomeBoss ?? '',
        titolo: compila(bossVivo.nomeBoss ? (datiBoss.ciclo > 1 ? TB.titolo_ciclo : TB.titolo) ?? '' : TB.senza_nome ?? '', datiBoss),
        vita: Math.ceil(bossVivo.vita), max: Math.max(1, Math.round(bossVivo.vitaMax ?? bossVivo.vita)),
        quota: Math.max(0, Math.min(1, bossVivo.vita / Math.max(1, bossVivo.vitaMax ?? bossVivo.vita))),
      } : null,
    };
  }

  let ultimo = null;
  let firma = '';

  /** Riscrive il DOM se qualcosa è cambiato (una volta per frame). */
  function aggiorna() {
    const f = fotografa();
    ultimo = f;
    radice.hidden = !f.visibile;
    // il contenuto si riscrive anche da nascosto (dialogo aperto): così il DOM non resta indietro quando ricompare
    const nuova = JSON.stringify({ ...f, visibile: undefined });
    if (nuova === firma) return;
    firma = nuova;

    eNome.textContent = f.nome;
    eTitolo.textContent = f.titolo;
    eTitolo.hidden = !f.titolo;
    ePiano.textContent = f.pianoTesto;
    ePiano.hidden = !f.pianoTesto;
    eStanza.textContent = f.stanzaTesto;
    eStanza.hidden = !f.stanzaTesto;
    if (eStanza.dataset) eStanza.dataset.tipo = f.stanza ?? '';

    assicuraMaschere(f.maschere.max);
    maschere.forEach((m, i) => {
      const stato = i < f.maschere.piene ? 'pieno' : (f.maschere.mezza && i === f.maschere.piene ? 'mezzo' : 'vuoto');
      m.hidden = i >= f.maschere.max;
      if (m.hidden) return;
      m.className = `hud-maschera ${stato}`;
      const src = sprite(SPRITE[stato]);
      if (src && m.src !== src) m.src = src;
      m.hidden = !src;
    });
    eVitaTesto.textContent = compila(T.vita_testo ?? '', { correnti: arrotonda(f.maschere.correnti, decimali.vita ?? 0), max: f.maschere.max });

    rigaStat.hidden = !f.statistiche;
    if (f.statistiche) for (const s of STATISTICHE) stat[s.chiave].textContent = f.statistiche[s.chiave];
    vMonete.textContent = String(f.monete);
    vScintille.textContent = String(f.scintille);

    eBoss.hidden = !f.boss;
    if (f.boss) {
      eBossNome.textContent = f.boss.titolo;
      eBossVita.textContent = compila(T.boss_vita ?? '', { vita: f.boss.vita, max: f.boss.max });
      if (eBossRiempimento.style) eBossRiempimento.style.width = `${(f.boss.quota * 100).toFixed(1)}%`;
      if (eBossRiempimento.setAttribute) eBossRiempimento.setAttribute('aria-valuenow', String(f.boss.vita));
    }

    eAttivo.hidden = !f.attivo;
    if (f.attivo) {
      eAttivo.className = `hud-attivo${f.attivo.carico ? ' carico' : ''}`;
      eAttivo.title = f.attivo.nome;
      eAttivoTasto.textContent = f.attivo.tasto;
      if (f.attivo.icona) eAttivoIcona.src = f.attivo.icona;
      eAttivoIcona.hidden = !f.attivo.icona;
      assicuraTacche(f.attivo.tacche);
      tacche.forEach((t, i) => { t.hidden = i >= f.attivo.tacche; t.className = `tacca${i < f.attivo.piene ? ' piena' : ''}`; });
    }

    assicuraSlot(f.slot.length);
    slot.forEach((v, i) => {
      const s = f.slot[i];
      v.li.hidden = i >= f.slot.length;
      if (v.li.hidden) return;
      v.li.className = `hud-slot ${s ? 'pieno' : 'vuoto'}${s?.azzurro ? ' azzurro' : ''}`;
      v.li.title = s ? s.nome : compila(T.slot_vuoto ?? '', { n: i + 1 });
      v.nome = s ? s.nome : '';
      if (v.li.dataset) v.li.dataset.id = s?.id ?? '';
      if (s?.icona) v.icona.src = s.icona;
      v.icona.hidden = !s?.icona;
      v.sagoma.textContent = s && !s.icona ? s.sagoma : '';
      v.sagoma.hidden = !(s && !s.icona);
    });

    assicuraPatti(f.patti.length);
    vociPatti.forEach((v, i) => {
      const p = f.patti[i];
      v.e.hidden = !p;
      if (!p) return;
      v.e.title = compila(T.patto ?? '{nome}', { nome: p.nome });
      v.nome = p.nome;
      if (v.e.dataset) v.e.dataset.id = p.id;
      if (p.icona) v.icona.src = p.icona;
      v.icona.hidden = !p.icona;
      v.sigla.textContent = p.icona ? '' : p.nome.charAt(0);
      v.sigla.hidden = Boolean(p.icona);
    });
    ePatti.hidden = f.patti.length === 0;
  }

  return {
    aggiorna,
    disegna: aggiorna,
    /** Fotografia dello stato mostrato (per i test e `__gioco.hud()`); è quella dell'ultimo `aggiorna()`. */
    stato() { return ultimo ? JSON.parse(JSON.stringify(ultimo)) : fotografa(); },
    /** Elementi del DOM per i test. */
    elementi: { radice, scheda, nome: eNome, titolo: eTitolo, piano: ePiano, stanza: eStanza, vita, maschere, statistiche: stat, monete: vMonete, scintille: vScintille, boss: eBoss, bossNome: eBossNome, bossRiempimento: eBossRiempimento, attivo: eAttivo, tacche, lista, slot, patti: vociPatti, didascalia },
  };
}
