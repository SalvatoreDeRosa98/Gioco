/**
 * motore/attori/bersaglio.js — Interfaccia minima dei bersagli e nemico FANTOCCIO.
 *
 * Il combattimento (combattimento.md, Interactions) chiede ai nemici solo questo contratto:
 *   { x, y, r, vita, peso, imparabile, stato, colpisci(danno, spinta), stordisci(ms) }
 * Qui c'è un manichino di prova per le storie 007-011: resta fermo oppure, con `automatico`
 * o chiamando `attacca()`, esegue un attacco telegrafato in tre tempi (nemici.md regola 1):
 * anticipo → lampo → impatto a `t_impatto` dall'inizio del lampo → colpo → recupero → cooldown.
 * Il nemico vero (gatto d'ombra, IA a stati) arriva con le storie 019-020 e sostituisce questo
 * file mantenendo il contratto. C'è anche un proiettile minimo per provare il riflesso (regola 5).
 *
 * Nessun numero di gioco: tutto da `combattimento.fantoccio.*` e dalle statistiche del
 * combattimento attraverso `modificatori.valore()`. Nessuna casualità (ADR-0003).
 */

import { muoviCerchio, cerchiSiToccano } from '../mondo/fisica.js';

/** Stati del fantoccio. */
export const STATI_FANTOCCIO = Object.freeze(['fermo', 'anticipo', 'lampo', 'colpo', 'recupero', 'stordito', 'morto']);

/**
 * Crea un nemico fantoccio.
 * @param {{
 *   modificatori: { valore: (nome: string) => number },
 *   tempo: { ticksDaMs: (ms: number) => number },
 *   eventi?: { emit: (nome: string, payload?: unknown) => unknown },
 *   x: number, y: number,
 *   r?: number, vita?: number, peso?: number,
 *   imparabile?: boolean, pesante?: boolean, automatico?: boolean,
 *   bersaglio?: { x: number, y: number, r: number, colpisci: (attacco: object) => string },
 *   campo?: import('../mondo/fisica.js').Campo,
 *   id?: string
 * }} opzioni `bersaglio` è la facciata di Ferruccio (combattimento.comeBersaglio)
 */
export function creaFantoccio({
  modificatori, tempo, eventi, x, y, r, vita, peso, imparabile = false, pesante = false,
  automatico = false, bersaglio = null, campo = null, id = 'fantoccio',
}) {
  if (!modificatori || !tempo) throw new TypeError('creaFantoccio: dipendenze mancanti');
  const val = (nome) => modificatori.valore(`combattimento.fantoccio.${nome}`);
  const ticks = (nome) => tempo.ticksDaMs(val(nome));

  const f = {
    id,
    x,
    y,
    r: r ?? val('r'),
    vita: vita ?? val('vita'),
    peso: peso ?? val('peso'),
    imparabile,
    pesante,
    automatico,
    stato: 'fermo',
    faseTicks: 0,
    cooldownTicks: 0,
    lampoTicks: 0,       // tick trascorsi dall'inizio del lampo
    spinta: { vx: 0, vy: 0, ticks: 0, totale: 0 },
    /** registro per i test: danni e spinte ricevuti, impatti inflitti */
    danniSubiti: [],
    spinteSubite: [],
    impatti: [],
  };

  /** Fa partire il telegrafo adesso (se non è morto né stordito). */
  function attacca() {
    if (f.stato === 'morto' || f.stato === 'stordito') return false;
    f.stato = 'anticipo';
    f.faseTicks = ticks('t_anticipo');
    return true;
  }

  /** L'istante d'impatto: il colpo raggiunge il bersaglio. */
  function impatto() {
    if (!bersaglio) return;
    const esito = bersaglio.colpisci({
      danno: undefined, pesante: f.pesante, x: f.x, y: f.y, imparabile: f.imparabile, attaccante: facciata,
    });
    f.impatti.push(esito);
    eventi?.emit('nemico.colpo', { id: f.id, x: f.x, y: f.y, esito });
  }

  function tickSpinta(dt) {
    if (f.spinta.ticks <= 0) return;
    const k = f.spinta.ticks / f.spinta.totale;
    const dx = f.spinta.vx * k * dt;
    const dy = f.spinta.vy * k * dt;
    if (campo) {
      const e = muoviCerchio(campo, f.x, f.y, f.r, dx, dy);
      f.x = e.x;
      f.y = e.y;
      if (e.urto) f.spinta.ticks = 0;
    } else {
      f.x += dx;
      f.y += dy;
    }
    f.spinta.ticks -= 1;
  }

  /**
   * Avanza di un passo fisso.
   * @param {number} dt secondi
   */
  function tick(dt) {
    if (f.stato === 'morto') return;
    tickSpinta(dt);
    switch (f.stato) {
      case 'fermo':
        if (f.cooldownTicks > 0) f.cooldownTicks -= 1;
        else if (f.automatico) attacca();
        break;
      case 'anticipo':
        f.faseTicks -= 1;
        if (f.faseTicks === 0) {
          f.stato = 'lampo';
          f.lampoTicks = 0;
          f.faseTicks = ticks('t_impatto');
        }
        break;
      case 'lampo':
        f.lampoTicks += 1;
        f.faseTicks -= 1;
        if (f.faseTicks === 0) {
          impatto();
          if (f.stato === 'lampo') { // la parata può averlo già stordito
            f.stato = 'colpo';
            f.faseTicks = ticks('t_colpo');
          }
        }
        break;
      case 'colpo':
        f.faseTicks -= 1;
        if (f.faseTicks === 0) {
          f.stato = 'recupero';
          f.faseTicks = ticks('t_recupero');
        }
        break;
      case 'recupero':
        f.faseTicks -= 1;
        if (f.faseTicks === 0) {
          f.stato = 'fermo';
          f.cooldownTicks = ticks('t_cooldown');
        }
        break;
      case 'stordito':
        f.faseTicks -= 1;
        if (f.faseTicks === 0) {
          f.stato = 'fermo';
          f.cooldownTicks = 0;
        }
        break;
      default:
        break;
    }
  }

  /**
   * Subisce un colpo di Ferruccio (combattimento.md regole 6-7).
   * @param {number} danno decimale
   * @param {{ x: number, y: number, ms: number } | null} spinta velocità iniziale (px/s) e durata del decadimento
   */
  function colpisci(danno, spinta) {
    if (f.stato === 'morto') return;
    f.vita -= danno;
    f.danniSubiti.push(danno);
    if (spinta) {
      f.spinteSubite.push({ x: spinta.x, y: spinta.y });
      const n = tempo.ticksDaMs(spinta.ms);
      f.spinta = { vx: spinta.x, vy: spinta.y, ticks: n, totale: n };
    }
    if (f.vita <= 0) {
      f.stato = 'morto';
      eventi?.emit('nemico.morto', { id: f.id, x: f.x, y: f.y });
    }
  }

  /**
   * Stordimento da parata riuscita: interrompe l'attacco in corso.
   * @param {number} ms
   */
  function stordisci(ms) {
    if (f.stato === 'morto') return;
    f.stato = 'stordito';
    f.faseTicks = tempo.ticksDaMs(ms);
    f.stordimentoMs = ms;
  }

  const facciata = {
    get id() { return f.id; },
    get x() { return f.x; },
    set x(v) { f.x = v; },
    get y() { return f.y; },
    set y(v) { f.y = v; },
    get r() { return f.r; },
    get vita() { return f.vita; },
    get peso() { return f.peso; },
    get imparabile() { return f.imparabile; },
    set imparabile(v) { f.imparabile = Boolean(v); },
    get pesante() { return f.pesante; },
    get stato() { return f.stato; },
    get lampoAcceso() { return f.stato === 'lampo' && f.lampoTicks <= ticks('t_lampo'); },
    get stordimentoMs() { return f.stordimentoMs ?? 0; },
    get danniSubiti() { return f.danniSubiti.slice(); },
    get spinteSubite() { return f.spinteSubite.slice(); },
    get impatti() { return f.impatti.slice(); },
    set automatico(v) { f.automatico = Boolean(v); },
    get automatico() { return f.automatico; },
    tick,
    colpisci,
    stordisci,
    attacca,
  };
  return facciata;
}

/**
 * Proiettile minimo per il riflesso della parata (combattimento.md regola 5 ed edge case
 * «proiettile riflesso colpisce chi lo ha lanciato»).
 * @param {{
 *   x: number, y: number, dirX: number, dirY: number, velocita: number, r: number, danno: number,
 *   gittata: number, imparabile?: boolean,
 *   origine: { x: number, y: number, r: number, colpisci: (danno: number, spinta: null) => void },
 *   bersaglio: { x: number, y: number, r: number, colpisci: (attacco: object) => string }
 * }} opzioni
 */
export function creaProiettile({ x, y, dirX, dirY, velocita, r, danno, gittata, imparabile = false, origine, bersaglio }) {
  const l = Math.hypot(dirX, dirY) || 1;
  const p = {
    x, y, dx: dirX / l, dy: dirY / l, velocita, r, danno, gittata, imparabile, percorso: 0, riflesso: false, vivo: true,
  };

  /**
   * Riflesso dalla parata: torna da dove è venuto con il danno e la velocità dati.
   * @param {number} nuovoDanno
   * @param {number} nuovaVelocita
   */
  function rifletti(nuovoDanno, nuovaVelocita) {
    p.dx = -p.dx;
    p.dy = -p.dy;
    p.danno = nuovoDanno;
    p.velocita = nuovaVelocita;
    p.riflesso = true;
    p.percorso = 0;
  }

  function tick(dt) {
    if (!p.vivo) return;
    const passo = p.velocita * dt;
    p.x += p.dx * passo;
    p.y += p.dy * passo;
    p.percorso += passo;
    if (p.percorso > p.gittata) {
      p.vivo = false;
      return;
    }
    if (!p.riflesso) {
      if (bersaglio && cerchiSiToccano(p, bersaglio)) {
        const esito = bersaglio.colpisci({ danno: p.danno, x: p.x, y: p.y, imparabile: p.imparabile, proiettile: facciata });
        if (esito !== 'parata') p.vivo = false;
      }
    } else if (origine && origine.stato !== 'morto' && cerchiSiToccano(p, origine)) {
      origine.colpisci(p.danno, null);
      p.vivo = false;
    }
  }

  const facciata = {
    get x() { return p.x; },
    get y() { return p.y; },
    get r() { return p.r; },
    get danno() { return p.danno; },
    get velocita() { return p.velocita; },
    get direzione() { return { x: p.dx, y: p.dy }; },
    get riflesso() { return p.riflesso; },
    get vivo() { return p.vivo; },
    get stato() { return p.vivo ? (p.riflesso ? 'riflesso' : 'in_volo') : 'spento'; },
    tick,
    rifletti,
  };
  return facciata;
}

/**
 * Scintilla dei ganci dei doni (storia 024; doni-modificatori.md regola 5, effetto `scintilla`):
 * piccolo proiettile che ferisce i nemici vivi che tocca (`colpisci(danno, null)`, una volta per
 * nemico), escluso `escludi` (il bersaglio da cui parte). Con `rimbalzi` > 0, dopo un colpo punta il
 * nemico vivo non ancora colpito più vicino entro `raggioRimbalzo` e riparte (gittata da capo); senza
 * rimbalzi o senza bersagli si spegne. Si spegne anche oltre la `gittata`.
 * @param {{
 *   x: number, y: number, dirX: number, dirY: number, velocita: number, r: number, danno: number, gittata: number,
 *   rimbalzi?: number, raggioRimbalzo?: number,
 *   bersagli: () => object[],  nemici vivi (filtrati da chi compone)
 *   escludi?: object | null
 * }} o
 */
export function creaScintilla({ x, y, dirX, dirY, velocita, r, danno, gittata, rimbalzi = 0, raggioRimbalzo = 0, bersagli, escludi = null }) {
  const l = Math.hypot(dirX, dirY) || 1;
  const p = { x, y, dx: dirX / l, dy: dirY / l, velocita, r, danno, gittata, rimbalzi, percorso: 0, vivo: true };
  const colpiti = new Set();
  if (escludi) colpiti.add(escludi);

  /** Punta il nemico vivo non colpito più vicino entro `raggioRimbalzo`; falso se non c'è. */
  function rimbalza() {
    let scelto = null;
    let dMin = Infinity;
    for (const b of bersagli()) {
      if (!b || colpiti.has(b) || b.stato === 'morto') continue;
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d <= raggioRimbalzo && d < dMin) { dMin = d; scelto = b; }
    }
    if (!scelto) return false;
    const d = dMin || 1;
    p.dx = (scelto.x - p.x) / d;
    p.dy = (scelto.y - p.y) / d;
    p.percorso = 0;
    p.rimbalzi -= 1;
    return true;
  }

  function tick(dt) {
    if (!p.vivo) return;
    const passo = p.velocita * dt;
    p.x += p.dx * passo;
    p.y += p.dy * passo;
    p.percorso += passo;
    if (p.percorso > p.gittata) {
      p.vivo = false;
      return;
    }
    for (const b of bersagli()) {
      if (!b || colpiti.has(b) || b.stato === 'morto' || !cerchiSiToccano(p, b)) continue;
      colpiti.add(b);
      b.colpisci(p.danno, null);
      if (!(p.rimbalzi > 0 && rimbalza())) p.vivo = false;
      return;
    }
  }

  return {
    get x() { return p.x; },
    get y() { return p.y; },
    get r() { return p.r; },
    get danno() { return p.danno; },
    get velocita() { return p.velocita; },
    get direzione() { return { x: p.dx, y: p.dy }; },
    get rimbalzi() { return p.rimbalzi; },
    get vivo() { return p.vivo; },
    get riflesso() { return false; },
    get stato() { return p.vivo ? 'in_volo' : 'spento'; },
    scintilla: true,
    colpiti: () => colpiti.size - (escludi ? 1 : 0),
    tick,
  };
}
