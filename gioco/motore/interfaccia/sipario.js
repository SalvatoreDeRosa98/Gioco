/**
 * motore/interfaccia/sipario.js — Il sipario narrativo degli atti (storia P06; Teatro `getRaccontoAtto` ~2535 e
 * `disegnaSiparioNarrativo` ~5366), in DOM dentro `#interfaccia` (stile `stile/sipario.css`, testi
 * `contenuti/interfaccia.json › sipario`).
 *
 * Si alza fra un piano e l'altro della run: la radice di composizione lo mostra a `piano.discesa` (dopo il velo della
 * discesa e la generazione del piano nuovo) tenendo il ciclo in `pausa`; si chiude con il tasto `conferma` o `scatto`
 * (Spazio, come nel Teatro), con un click, o con `chiudi()` (QA), e la promessa di `mostra` si risolve. Il racconto
 * dipende dal piano nel ciclo (atti I-IV), dal ciclo (il «BIS» al piano 1 dei cicli successivi, il titolo dell'atto IV
 * dal ciclo 2) e dal personaggio scelto; i segnaposto sono {piano}, {ciclo}, {personaggio}, {titolo_personaggio},
 * {stanze}, {bonus}, {tasto}. Nessuna stringa di gioco qui: tutto da interfaccia.json. Il modulo non conosce la run:
 * riceve i dati già calcolati (`mondo/run.js`).
 */

/** Azioni dell'input che alzano il sipario (contratto di input.json). */
const AZIONI_ALZA = Object.freeze(['conferma', 'scatto']);

/**
 * @param {{
 *   documento: Document, contenitore: HTMLElement, testi: { sipario: object },
 *   input?: { premuto: (azione: string) => boolean } | null, tasto?: () => string
 * }} o `tasto` ritorna il nome del tasto di conferma da mostrare sul bottone
 */
export function creaSipario({ documento, contenitore, testi, input = null, tasto = () => '' }) {
  const T = testi?.sipario;
  if (!documento || !contenitore || !T || !T.atti || !T.bis) throw new TypeError('creaSipario: documento, contenitore e testi.sipario obbligatori');

  const radice = documento.createElement('section');
  radice.className = 'sipario';
  radice.hidden = true;
  radice.setAttribute('role', 'dialog');
  const quintaSx = documento.createElement('div'); quintaSx.className = 'sipario-quinta sipario-quinta-sinistra';
  const quintaDx = documento.createElement('div'); quintaDx.className = 'sipario-quinta sipario-quinta-destra';
  const cornice = documento.createElement('div'); cornice.className = 'sipario-cornice';
  const elAtto = documento.createElement('p'); elAtto.className = 'sipario-atto';
  const elTitolo = documento.createElement('h2'); elTitolo.className = 'sipario-titolo';
  const elRighe = documento.createElement('div'); elRighe.className = 'sipario-righe';
  const bottone = documento.createElement('button'); bottone.type = 'button'; bottone.className = 'sipario-alza';
  cornice.append(elAtto, elTitolo, elRighe, bottone);
  radice.append(quintaSx, quintaDx, cornice);
  contenitore.appendChild(radice);

  const s = { aperto: false, piano: 0, ciclo: 1, pianoNelCiclo: 1, atto: '', titolo: '', righe: [], mostrati: 0 };
  let risolvi = null;
  /** Gancio sincrono chiamato in `chiudi()` prima di risolvere la promessa (chi guida il ciclo a tick forzati non aspetta i microtask). */
  let alChiudi = null;

  const compila = (t, dati) => String(t ?? '').replace(/\{(\w+)\}/g, (m, k) => (dati[k] !== undefined && dati[k] !== null ? String(dati[k]) : m));

  /**
   * Il racconto dell'atto per il piano dato (puro: per i test).
   * @param {{ piano: number, ciclo: number, pianoNelCiclo: number, personaggio?: string, titoloPersonaggio?: string, stanze?: number, bonus?: number }} info
   * @returns {{ atto: string, titolo: string, righe: string[], bis: boolean }}
   */
  function racconto(info) {
    const { piano, ciclo, pianoNelCiclo } = info;
    const chiavi = Object.keys(T.atti).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    const ultima = chiavi[chiavi.length - 1];
    const dati = {
      piano, ciclo, personaggio: info.personaggio ?? '', titolo_personaggio: info.titoloPersonaggio ?? '',
      stanze: compila(T.stanze, { stanze: info.stanze ?? '' }), bonus: info.bonus ?? 0, tasto: tasto(),
    };
    const bis = ciclo > 1 && pianoNelCiclo === chiavi[0];
    const voce = bis ? T.bis : (T.atti[String(pianoNelCiclo)] ?? T.atti[String(ultima)]);
    let titolo = voce.titolo;
    if (!bis && ciclo > 1 && pianoNelCiclo === ultima && T.titolo_finale_ciclo) titolo = T.titolo_finale_ciclo;
    return { atto: compila(voce.atto, dati), titolo: compila(titolo, dati), righe: (voce.righe ?? []).map((r) => compila(r, dati)), bis };
  }

  /**
   * Mostra il sipario; `quandoSiAlza` è chiamato in modo sincrono alla chiusura e la promessa si risolve subito dopo.
   * @param {Parameters<typeof racconto>[0]} info
   * @param {(() => void) | null} [quandoSiAlza]
   * @returns {Promise<void>}
   */
  function mostra(info, quandoSiAlza = null) {
    const r = racconto(info);
    alChiudi = typeof quandoSiAlza === 'function' ? quandoSiAlza : null;
    Object.assign(s, { aperto: true, piano: info.piano, ciclo: info.ciclo, pianoNelCiclo: info.pianoNelCiclo, atto: r.atto, titolo: r.titolo, righe: r.righe });
    s.mostrati += 1;
    elAtto.textContent = r.atto;
    elTitolo.textContent = r.titolo;
    elRighe.replaceChildren(...r.righe.map((riga) => { const p = documento.createElement('p'); p.textContent = riga; return p; }));
    bottone.textContent = compila(T.alza, { tasto: tasto() });
    radice.hidden = false;
    if (risolvi) risolvi();
    return new Promise((res) => { risolvi = res; });
  }

  /** Alza il sipario (chiude). Falso se era già chiuso. */
  function chiudi() {
    if (!s.aperto) return false;
    s.aperto = false;
    radice.hidden = true;
    const r = risolvi;
    const g = alChiudi;
    risolvi = null;
    alChiudi = null;
    g?.();
    r?.();
    return true;
  }

  bottone.addEventListener('click', (e) => { e.stopPropagation(); chiudi(); });
  radice.addEventListener('click', () => chiudi());

  /** Da chiamare a ogni tick in `pausa`: il tasto di conferma o lo scatto alzano il sipario. */
  function tick() {
    if (!s.aperto || !input) return;
    if (AZIONI_ALZA.some((a) => input.premuto(a))) chiudi();
  }

  /** Stato per QA e debug. */
  function stato() {
    return { aperto: s.aperto, piano: s.piano, ciclo: s.ciclo, pianoNelCiclo: s.pianoNelCiclo, atto: s.atto, titolo: s.titolo, righe: s.righe.slice(), mostrati: s.mostrati, visibile: !radice.hidden };
  }

  return { mostra, chiudi, tick, stato, racconto, get aperto() { return s.aperto; }, elemento: radice };
}
