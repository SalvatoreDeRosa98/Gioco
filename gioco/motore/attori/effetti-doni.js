/**
 * motore/attori/effetti-doni.js — Esecuzione MINIMA degli effetti dei ganci nel mondo (GDD
 * doni-modificatori.md regola 5; ADR-0002). Storia 024.
 *
 * `oggetti/effetti.js` emette solo richieste sul bus; qui, nel livello degli attori, si eseguono:
 *  - `doni.scintilla` → `n` scintille (`creaScintilla` di bersaglio.js) dal punto `da`, in ventaglio
 *    di `ventaglio_gradi` attorno alla direzione del payload (o verso il nemico vivo più vicino), con
 *    velocità, raggio e gittata da `combattimento.scintilla.*`; il bersaglio d'origine è escluso; tetto
 *    `doni.limiti.max_proiettili_attivi` sulle scintille in volo (le eccedenti sono scartate);
 *  - `doni.catena` → danno ai `n_bersagli` nemici vivi più vicini a `da` entro `raggio_px`, escluso il
 *    bersaglio d'origine;
 *  - `doni.onda` → danno e stordimento (`stordisce_ms`) a tutti i nemici vivi entro `raggio_px` da `da`;
 *  - `doni.cura` → maschere correnti +n fino a `maschere_max`; `doni.ricarica_scatto` → cariche +n.
 * Il danno degli effetti è quello dei parametri (non scalato da `danno`). Le uccisioni provocate qui
 * non passano dal combattimento, quindi non emettono `ferruccio.uccisione`: profondità 1 garantita.
 * Nessun numero di gioco. Dipendenze: bersaglio.js (scintilla); il resto è iniettato.
 */

import { creaScintilla } from './bersaglio.js';

/** Gradi → radianti (unità, non valore di gioco). */
const RAD = Math.PI / 180;

/**
 * @param {{
 *   eventi: { on: Function },
 *   parametri: { get: (chiave: string) => any },
 *   modificatori: { valore: (nome: string) => number },
 *   ferruccio: { x: number, y: number, maschere: number, impostaMaschere: Function, ricaricaScatto: Function },
 *   bersagli: () => object[],
 *   proiettili: object[],
 *   log?: { error: Function }
 * }} o
 */
export function collegaEffettiDoni({ eventi, parametri, modificatori, ferruccio, bersagli, proiettili, log = console }) {
  if (!eventi || !parametri || !modificatori || !ferruccio || typeof bersagli !== 'function' || !Array.isArray(proiettili)) {
    throw new TypeError('collegaEffettiDoni: dipendenze mancanti');
  }
  const S = (k) => modificatori.valore(`combattimento.scintilla.${k}`);
  const maxScintille = parametri.get('doni').limiti.max_proiettili_attivi.base;
  const maschereMax = () => modificatori.valore('ferruccio.maschere_max');

  const vivi = () => bersagli().filter((b) => b && b.stato !== 'morto' && (typeof b.vita !== 'number' || b.vita > 0));
  const scintilleAttive = () => proiettili.filter((p) => p.scintilla && p.vivo).length;

  /** Nemici vivi ordinati per distanza da (x, y), escluso `escludi`, entro `raggio` (Infinity = tutti). */
  function perDistanza(x, y, escludi, raggio) {
    return vivi()
      .filter((b) => b !== escludi)
      .map((b) => ({ b, d: Math.hypot(b.x - x, b.y - y) }))
      .filter(({ d }) => d <= raggio)
      .sort((a, c) => a.d - c.d)
      .map(({ b }) => b);
  }

  function suScintilla(p) {
    const da = p.da ?? { x: ferruccio.x, y: ferruccio.y };
    let dir = p.direzione && (p.direzione.x || p.direzione.y) ? { x: p.direzione.x, y: p.direzione.y } : null;
    if (!dir) {
      const [vicino] = perDistanza(da.x, da.y, p.bersaglio, Infinity);
      dir = vicino ? { x: vicino.x - da.x, y: vicino.y - da.y } : { x: 1, y: 0 };
    }
    const base = Math.atan2(dir.y, dir.x);
    const n = Math.max(1, Math.floor(p.n));
    const ventaglio = (p.ventaglio_gradi ?? 0) * RAD;
    for (let i = 0; i < n; i++) {
      if (scintilleAttive() >= maxScintille) break;
      const a = n === 1 ? base : base - ventaglio / 2 + (ventaglio * i) / (n - 1);
      proiettili.push(creaScintilla({
        x: da.x, y: da.y, dirX: Math.cos(a), dirY: Math.sin(a), velocita: S('velocita'), r: S('r'), gittata: S('gittata'),
        danno: p.danno, rimbalzi: p.rimbalzi ?? 0, raggioRimbalzo: p.raggio_rimbalzo_px ?? 0, bersagli: vivi, escludi: p.bersaglio ?? null,
      }));
    }
  }

  function suCatena(p) {
    const da = p.da ?? { x: ferruccio.x, y: ferruccio.y };
    for (const b of perDistanza(da.x, da.y, p.bersaglio, p.raggio_px).slice(0, Math.max(0, Math.floor(p.n_bersagli)))) b.colpisci(p.danno, null);
  }

  function suOnda(p) {
    const da = p.da ?? { x: ferruccio.x, y: ferruccio.y };
    for (const b of perDistanza(da.x, da.y, null, p.raggio_px)) {
      b.colpisci(p.danno, null);
      if (p.stordisce_ms > 0) b.stordisci?.(p.stordisce_ms);
    }
  }

  function suCura(p) {
    ferruccio.impostaMaschere(Math.min(maschereMax(), ferruccio.maschere + Math.max(0, Math.floor(p.maschere))));
  }

  function suRicarica(p) {
    ferruccio.ricaricaScatto(Math.max(0, Math.floor(p.cariche)));
  }

  const sicuro = (fn) => (p) => { try { fn(p); } catch (e) { log?.error?.('[effetti-doni]', e); } };
  const via = [
    eventi.on('doni.scintilla', sicuro(suScintilla)),
    eventi.on('doni.catena', sicuro(suCatena)),
    eventi.on('doni.onda', sicuro(suOnda)),
    eventi.on('doni.cura', sicuro(suCura)),
    eventi.on('doni.ricarica_scatto', sicuro(suRicarica)),
  ];

  return {
    scintilleAttive,
    maxScintille,
    scollega: () => { for (const f of via) if (typeof f === 'function') f(); },
  };
}

/**
 * Collega i ganci dei doni agli eventi del combattimento e della stanza (ADR-0002, GDD regola 5):
 * `ferruccio.colpo` → `su_colpo`; `ferruccio.uccisione` → `su_uccisione`; `ferruccio.parata` →
 * `su_parata`; il primo `ferruccio.colpo` di ogni affondo → `su_affondo` (nessun colpo, nessun evento);
 * `ferruccio.danno` con danno > 0 → `su_danno_subito`; `stanza.pulita` combattuta → `su_stanza_pulita`;
 * `doni.aggiunto` → `su_raccolta`; `stanza.entrata` azzera i tetti per stanza.
 * @param {{ eventi: { on: Function }, modificatori: { ganci: { emetti: Function, nuovaStanza: Function } }, combattimento: { stato: string } }} o
 * @returns {() => void} scollega
 */
export function collegaGanci({ eventi, modificatori, combattimento }) {
  let affondoAperto = false;
  const emetti = (nome, p) => modificatori.ganci.emetti(nome, p);
  const via = [
    eventi.on('ferruccio.colpo', (p) => {
      emetti('su_colpo', p);
      if (affondoAperto && combattimento.stato === 'affondo') {
        affondoAperto = false;
        emetti('su_affondo', p);
      }
    }),
    eventi.on('ferruccio.affondo', () => { affondoAperto = true; }),
    eventi.on('ferruccio.uccisione', (p) => emetti('su_uccisione', p)),
    eventi.on('ferruccio.parata', (p) => emetti('su_parata', p)),
    eventi.on('ferruccio.danno', (p) => { if ((p?.danno ?? 0) > 0) emetti('su_danno_subito', p); }),
    eventi.on('stanza.pulita', (p) => { if (p?.combattuta) emetti('su_stanza_pulita', p); }),
    eventi.on('stanza.entrata', () => { affondoAperto = false; modificatori.ganci.nuovaStanza(); }),
    eventi.on('doni.aggiunto', (p) => emetti('su_raccolta', { ...p, bersaglio: null })),
  ];
  return () => { for (const f of via) if (typeof f === 'function') f(); };
}
