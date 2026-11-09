/**
 * motore/resa/feel.js — Game feel della resa (storia P08, richieste testuali dell'autore).
 *
 * Tre cose, tutte dati di `contenuti/parametri/resa.json`, tutte solo visive (il renderer legge, non muta):
 *  - **lampeggio semitrasparente** della sagoma di Ferruccio colpito: `alphaSagoma(ferruccio, tick)` dà
 *    `lampeggio.alpha` nelle semionde pari (la prima, subito dopo il colpo) e 1 nelle impari, con
 *    semiperiodo `lampeggio.semiperiodo_ms`; durante lo scatto la sagoma resta piena;
 *  - **scossa contestuale** della camera: `scuoti(px, frame)` chiede uno spostamento di `px` per `frame`
 *    frame disegnati (il più ampio vince, non si somma); `offsetScossa()` è letto una volta per frame dal
 *    renderer e torna a {0, 0} a fine corsa: nessuna scossa costante, con moto ridotto i px sono 0 dai
 *    parametri (`moto-ridotto.json`). Gli eventi ascoltati: `ferruccio.colpo` (colpo a segno),
 *    `ferruccio.parata`, `nemico.esplosione` (la Bomba Ferma, storia P15: un solo nome, quello di attori/nemico.js),
 *    `boss.atterraggio` (Re-Gatto), `boss.mani_schianto` (Mani di Donna Luciana): i tre nomi emessi dalle squadre nemici;
 *  - **macchie permanenti**: a `nemico.morto` resta a terra una chiazza d'inchiostro di china (o schegge
 *    di legno per `statua`, `guardia`, `bomba` e per gli archetipi elencati in `pezzi`/`legno`), seminata con
 *    `derivato(rng, 'fx')` e identica a ogni replay; il buffer è per stanza e si azzera a `notte.stanza`.
 *
 * Nessuna casualità non seminata, nessun numero di gioco nel codice, nessuna stringa di gioco. Il disegno delle
 * macchie (`disegnaMacchie(ctx)`) sta qui perché questo è un modulo di `resa/`.
 */

import { derivato } from '../fondazione/rng.js';

/** Archetipi (e tipi di `pezzi`) che si rompono in schegge di legno invece di sanguinare china. */
const ARCHETIPI_LEGNO = Object.freeze(['statua', 'guardia', 'bomba']);
const TAU = Math.PI * 2;

/**
 * Crea il game feel della resa.
 * @param {{
 *   parametri: { get: (percorso: string) => any },
 *   eventi?: { on: (nome: string, fn: Function) => any },
 *   rng?: () => number,
 *   tempo?: { ticksDaMs: (ms: number) => number },
 *   token?: (nome: string) => string
 * }} o
 */
export function creaFeel({ parametri, eventi = null, rng = null, tempo = null, token = null }) {
  if (!parametri) throw new TypeError('creaFeel: manca `parametri`');
  const R = (chiave) => parametri.get(`resa.${chiave}`);
  const rngFx = derivato(rng ?? (() => 0), 'fx');

  // --- scossa ---------------------------------------------------------------------------------
  const scossa = { px: 0, frame: 0, totale: 0 };

  /**
   * Chiede una scossa di `px` per `frame` frame disegnati. Non si somma: vince l'ampiezza maggiore e la
   * durata residua maggiore. Con `px` o `frame` nulli non fa nulla.
   * @param {number} px
   * @param {number} frame
   */
  function scuoti(px, frame) {
    if (!(px > 0) || !(frame > 0)) return;
    scossa.px = Math.max(scossa.px, px);
    scossa.frame = Math.max(scossa.frame, Math.round(frame));
    scossa.totale = Math.max(scossa.totale, scossa.frame);
  }

  /**
   * Spostamento della camera per il frame corrente (consuma un frame di scossa). Il segno alterna a
   * ogni frame (colpo secco alla Isaac), l'ampiezza decade linearmente fino a 0.
   * @returns {{ x: number, y: number }}
   */
  function offsetScossa() {
    if (scossa.frame <= 0) {
      scossa.px = 0;
      scossa.totale = 0;
      return { x: 0, y: 0 };
    }
    const k = scossa.frame / scossa.totale;
    const segno = scossa.frame % 2 === 0 ? 1 : -1;
    const a = scossa.px * k;
    scossa.frame -= 1;
    if (scossa.frame <= 0) { scossa.px = 0; scossa.totale = 0; } // finita: la prossima lettura è {0, 0}
    return { x: segno * a, y: -segno * a * 0.5 };
  }

  /** @returns {{ px: number, frame: number }} scossa residua (strumento di test/debug). */
  function statoScossa() {
    return { px: scossa.px, frame: scossa.frame };
  }

  // --- lampeggio -------------------------------------------------------------------------------
  let tickColpo = null;
  /**
   * Alpha della sagoma di Ferruccio per il frame: `lampeggio.alpha` nelle semionde pari dell'invulnerabilità
   * da colpo (stato `colpito`), 1 altrimenti (anche in scatto). Il conteggio parte dal tick del colpo,
   * così il frame successivo al colpo è già semitrasparente.
   * @param {{ invulnerabile: () => boolean, stato: string }} ferruccio
   * @param {number} tick tick corrente della simulazione
   * @returns {number} alpha in [0, 1]
   */
  function alphaSagoma(ferruccio, tick) {
    if (!ferruccio || !ferruccio.invulnerabile() || ferruccio.stato !== 'colpito') {
      tickColpo = null;
      return 1;
    }
    if (tickColpo === null) tickColpo = tick;
    const semi = Math.max(1, tempo ? tempo.ticksDaMs(R('lampeggio.semiperiodo_ms')) : Math.round(R('lampeggio.semiperiodo_ms') / (1000 / 60)));
    const fase = Math.floor((tick - tickColpo) / semi) % 2;
    return fase === 0 ? R('lampeggio.alpha') : 1;
  }

  // --- macchie ---------------------------------------------------------------------------------
  /** @type {{ x: number, y: number, tipo: 'china' | 'legno', gocce: { dx: number, dy: number, r: number, ang: number }[] }[]} */
  const macchieStanza = [];
  let stanzaCorrente = null;

  /**
   * Aggiunge a terra la macchia di un nemico morto. Deterministica dato il generatore 'fx'.
   * @param {{ x: number, y: number, archetipo?: string, pezzi?: string, boss?: boolean }} ev
   * @returns {object} la macchia aggiunta
   */
  function aggiungiMacchia(ev) {
    const legno = ARCHETIPI_LEGNO.includes(ev?.archetipo) || ARCHETIPI_LEGNO.includes(ev?.pezzi);
    const n = Math.round(R(legno ? 'macchie.schegge' : 'macchie.gocce_china'));
    const raggio = R('macchie.raggio_px');
    const dMin = R('macchie.dim_min_px');
    const dMax = R('macchie.dim_max_px');
    const gocce = [];
    for (let i = 0; i < n; i++) {
      const ang = rngFx() * TAU;
      const d = Math.sqrt(rngFx()) * raggio;
      gocce.push({ dx: Math.cos(ang) * d, dy: Math.sin(ang) * d * 0.55, r: dMin + rngFx() * (dMax - dMin), ang: rngFx() * TAU });
    }
    const macchia = { x: ev.x, y: ev.y, tipo: legno ? 'legno' : 'china', gocce };
    macchieStanza.push(macchia);
    const max = R('macchie.max_per_stanza');
    if (macchieStanza.length > max) macchieStanza.splice(0, macchieStanza.length - max);
    return macchia;
  }

  /** Azzera il buffer delle macchie (cambio di stanza). */
  function azzeraMacchie() {
    macchieStanza.length = 0;
  }

  /** @returns {readonly object[]} le macchie della stanza corrente (sola lettura). */
  function macchie() {
    return macchieStanza;
  }

  /**
   * Disegna le macchie sul pavimento: china nera (token `--inchiostro`) o schegge di legno (token `--bruno`).
   * @param {CanvasRenderingContext2D} ctx
   */
  function disegnaMacchie(ctx) {
    if (!macchieStanza.length) return;
    const china = (token && token('--inchiostro')) || '#0b0704';
    const legno = (token && token('--bruno')) || '#5a2a0e';
    for (const m of macchieStanza) {
      ctx.fillStyle = m.tipo === 'legno' ? legno : china;
      for (const g of m.gocce) {
        ctx.save();
        ctx.translate(m.x + g.dx, m.y + g.dy);
        ctx.rotate(g.ang);
        ctx.beginPath();
        if (m.tipo === 'legno') ctx.rect(-g.r * 1.4, -g.r * 0.35, g.r * 2.8, g.r * 0.7);
        else ctx.ellipse(0, 0, g.r * 1.5, g.r * 0.8, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // --- eventi ----------------------------------------------------------------------------------
  if (eventi) {
    eventi.on('ferruccio.colpo', () => scuoti(R('scossa.colpo_px'), R('scossa.colpo_frame')));
    eventi.on('ferruccio.parata', () => scuoti(parametri.get('combattimento.feel.scossa_parata_px'), R('scossa.parata_frame')));
    eventi.on('nemico.esplosione', () => scuoti(R('scossa.bomba_px'), R('scossa.bomba_frame')));
    eventi.on('boss.atterraggio', () => scuoti(R('scossa.boss_atterraggio_px'), R('scossa.boss_atterraggio_frame')));
    eventi.on('boss.mani_schianto', () => scuoti(R('scossa.mani_schianto_px'), R('scossa.mani_schianto_frame')));
    eventi.on('nemico.morto', (ev) => { if (ev && Number.isFinite(ev.x) && Number.isFinite(ev.y)) aggiungiMacchia(ev); });
    eventi.on('notte.stanza', (ev) => {
      const id = ev?.a ?? ev?.id ?? null;
      if (id !== stanzaCorrente) {
        stanzaCorrente = id;
        azzeraMacchie();
      }
    });
  }

  return { scuoti, offsetScossa, statoScossa, alphaSagoma, aggiungiMacchia, azzeraMacchie, macchie, disegnaMacchie };
}
