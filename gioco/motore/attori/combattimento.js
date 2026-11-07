/**
 * motore/attori/combattimento.js — La spada di Ferruccio (Feature, GDD combattimento.md).
 *
 * Macchina degli attacchi (regole 1-7, tabella «States and Transitions»):
 *   Pronto → Fendente 1/2/3 (startup → attivo → recupero) → Pronto | Carica (attacco ancora tenuto)
 *   Carica → (rilascio dopo `t_carica`) Affondo (startup → attivo → recupero) → Pronto
 *   Pronto | recupero del fendente → Parata (startup → finestra → recupero) → Pronto
 *   Parata riuscita → Controcolpo (timer `t_controcolpo`, consumato dal prossimo fendente o affondo)
 * Storie 009 (fendente, combo, buffer, cancellazioni), 010 (affondo), 011 (parata).
 *
 * Regole di input: parata > attacco nello stesso tick; un attacco premuto quando non si può
 * attaccare è bufferizzato per `t_buffer` (congelato finché dura lo scatto, se lo scatto finisce
 * dentro il buffer: edge case «attacco premuto durante lo scatto»); scatto e parata interrompono
 * il recupero di un fendente, non lo startup; il danno subito (evento `ferruccio.danno`)
 * interrompe tutto tranne l'attivo dell'affondo.
 *
 * Il danno è decimale senza arrotondamento, minimo `danno_min` (regola 6, formula `danno_colpo`).
 * Le hitbox sono risolte da `mondo/fisica.js` (settore, rettangolo spazzato, linea di colpo).
 * I bersagli rispettano l'interfaccia minima di `attori/bersaglio.js`
 * {x, y, r, vita, peso, imparabile, stato, colpisci(danno, spinta), stordisci(ms)}.
 *
 * Eventi emessi: `ferruccio.colpo`, `ferruccio.uccisione`, `ferruccio.parata`,
 * `ferruccio.parata_mancata`, `ferruccio.affondo`; payload {x, y, direzione, bersaglio?, danno?}.
 * Le statistiche si leggono da `modificatori.valore()` (ADR-0002), i tempi si convertono in tick
 * con `tempo.ticksDaMs` quando il timer parte.
 */

import { settoreColpisceCerchio, rettangoloColpisceCerchio, lineaLibera } from '../mondo/fisica.js';

/** Stati della macchina degli attacchi. */
export const STATI_ATTACCO = Object.freeze(['pronto', 'fendente', 'carica', 'affondo', 'parata']);

/** Transizioni ammesse (il danno subito riporta a `pronto` da ogni stato tranne l'attivo dell'affondo). */
export const TRANSIZIONI_ATTACCO = Object.freeze({
  pronto: Object.freeze(['fendente', 'parata']),
  fendente: Object.freeze(['fendente', 'pronto', 'carica', 'parata']),
  carica: Object.freeze(['affondo', 'pronto']),
  affondo: Object.freeze(['pronto']),
  parata: Object.freeze(['pronto']),
});

/** Nomi delle statistiche del moltiplicatore di combo per fendente 1, 2, 3 (regola 2). */
const MOLT_FENDENTE = Object.freeze(['molt_f1', 'molt_f2', 'molt_f3']);

/**
 * Crea il sistema di combattimento.
 * @param {{
 *   modificatori: { valore: (nome: string) => number },
 *   tempo: { ticksDaMs: (ms: number) => number },
 *   eventi: { emit: (nome: string, payload?: unknown) => unknown, on: (nome: string, fn: (p: any) => void) => () => void },
 *   input: { premuto: (a: string) => boolean, tenuto: (a: string) => boolean, rilasciato: (a: string) => boolean, direzione: () => { x: number, y: number } },
 *   campo: import('../mondo/fisica.js').Campo,
 *   ferruccio: ReturnType<import('./ferruccio.js').creaFerruccio>,
 *   bersagli: () => { x: number, y: number, r: number, vita: number, peso: number, stato: string, colpisci: Function, stordisci?: Function }[]
 * }} opzioni
 */
export function creaCombattimento({ modificatori, tempo, eventi, input, campo, ferruccio, bersagli = () => [] }) {
  if (!modificatori || !tempo || !eventi || !input || !campo || !ferruccio) throw new TypeError('creaCombattimento: dipendenze mancanti');
  const val = (nome) => modificatori.valore(`combattimento.${nome}`);
  const ticks = (nome) => tempo.ticksDaMs(val(nome));

  const s = {
    stato: 'pronto',
    fase: null,            // 'startup' | 'attivo' | 'recupero' | 'finestra'
    faseTicks: 0,
    numero: 0,             // fendente corrente 1..3
    prossimo: 1,           // prossimo fendente della combo
    comboTicks: 0,         // finestra di combo residua (dalla fine dell'attivo)
    bufferTicks: 0,        // attacco bufferizzato
    bufferCongelato: false,
    bufferParataTicks: 0,
    tenutoTicks: -1,       // tick da cui attacco è tenuto (−1 = non tracciato)
    controcolpoTicks: 0,
    moltControcolpo: 1,    // moltiplicatore consumato dall'attacco corrente
    mira: { x: 1, y: 0 },
    angolo: 0,
    /** @type {Set<object>} */
    colpiti: new Set(),
    affondo: { x0: 0, y0: 0, passo: 0, fermato: false },
    parataRiuscita: false,
    statoCorpoPrecedente: ferruccio.stato,
  };

  function vai(nuovo, fase = null, nomeDurata = null) {
    if (s.stato !== nuovo && !TRANSIZIONI_ATTACCO[s.stato].includes(nuovo)) {
      throw new RangeError(`combattimento: transizione non ammessa ${s.stato} -> ${nuovo}`);
    }
    s.stato = nuovo;
    s.fase = fase;
    s.faseTicks = nomeDurata ? ticks(nomeDurata) : 0;
  }

  function azzeraCombo() {
    s.prossimo = 1;
    s.comboTicks = 0;
  }

  /** Riporta a Pronto svuotando buffer e combo (danno subito, cancellazione da scatto). */
  function interrompi() {
    s.stato = 'pronto';
    s.fase = null;
    s.faseTicks = 0;
    s.numero = 0;
    s.bufferTicks = 0;
    s.bufferCongelato = false;
    s.bufferParataTicks = 0;
    s.tenutoTicks = -1;
    s.parataRiuscita = false;
    azzeraCombo();
  }

  function fissaMira() {
    s.mira = ferruccio.direzioneMira();
    s.angolo = Math.atan2(s.mira.y, s.mira.x);
  }

  /** Il corpo permette un'azione volontaria ora? */
  function corpoLibero() {
    return ferruccio.corpoLibero();
  }

  /** Vero se è possibile far partire un fendente adesso (pronto o combo nel recupero). */
  function puoAttaccare() {
    if (!corpoLibero()) return false;
    if (s.stato === 'pronto') return true;
    return s.stato === 'fendente' && s.fase === 'recupero' && s.prossimo > 1 && s.comboTicks > 0;
  }

  /** Vero se è possibile parare adesso (regola 3: la parata cancella il recupero del fendente). */
  function puoParare() {
    if (ferruccio.stato === 'morto' || ferruccio.stato === 'scatta' || ferruccio.inSpinta()) return false;
    return s.stato === 'pronto' || (s.stato === 'fendente' && s.fase === 'recupero');
  }

  /** Esposto a Ferruccio: lo scatto interrompe solo Pronto e il recupero del fendente. */
  function puoScattare() {
    return s.stato === 'pronto' || (s.stato === 'fendente' && s.fase === 'recupero');
  }

  /** Moltiplicatore del passo imposto al corpo (tabella degli stati). */
  function modVelocita() {
    switch (s.stato) {
      case 'parata':
      case 'affondo':
        return 0;
      case 'carica':
        return val('mod_velocita_carica');
      case 'fendente':
        return s.fase === 'recupero' ? val('mod_velocita_recupero') : 1;
      default:
        return 1;
    }
  }

  /** Consuma il controcolpo (se attivo) per l'attacco che parte ora. */
  function consumaControcolpo() {
    if (s.controcolpoTicks > 0) {
      s.moltControcolpo = val('molt_controcolpo');
      s.controcolpoTicks = 0;
    } else {
      s.moltControcolpo = 1;
    }
  }

  function avviaFendente() {
    const numero = s.prossimo;
    s.numero = numero;
    s.colpiti = new Set();
    fissaMira();
    consumaControcolpo();
    s.comboTicks = 0;
    vai('fendente', 'startup', numero > 1 ? 't_startup_combo' : 't_startup_f');
  }

  function avviaAffondo() {
    s.colpiti = new Set();
    fissaMira();
    consumaControcolpo();
    azzeraCombo();
    vai('affondo', 'startup', 't_startup_affondo');
  }

  function avviaParata() {
    s.parataRiuscita = false;
    azzeraCombo();
    s.bufferParataTicks = 0;
    vai('parata', 'startup', 't_startup_p');
  }

  /**
   * `danno_colpo` (regola 6): decimale, senza arrotondamento, minimo `danno_min`.
   * @param {number} moltCombo
   * @param {number} moltAffondo
   */
  function dannoColpo(moltCombo, moltAffondo) {
    return Math.max(val('danno_min'), val('danno') * moltCombo * moltAffondo * s.moltControcolpo);
  }

  /**
   * Applica un colpo a ogni bersaglio nella hitbox non ancora colpito da questo attacco, con linea
   * di colpo libera (regola 6) e spinta (regola 7; peso ≥ `peso_inamovibile` → nessuna spinta).
   * @param {(b: { x: number, y: number, r: number }) => boolean} dentro test geometrico
   * @param {number} danno
   * @param {number} spinta px/s
   * @returns {object[]} bersagli colpiti in questo tick
   */
  function colpisciBersagli(dentro, danno, spinta) {
    const colpiti = [];
    for (const b of bersagli()) {
      if (!b || b.stato === 'morto' || s.colpiti.has(b)) continue;
      if (!dentro(b)) continue;
      if (!lineaLibera(campo, ferruccio.x, ferruccio.y, b.x, b.y)) continue;
      s.colpiti.add(b);
      let dx = b.x - ferruccio.x;
      let dy = b.y - ferruccio.y;
      const d = Math.hypot(dx, dy);
      if (d === 0) {
        dx = s.mira.x;
        dy = s.mira.y;
      } else {
        dx /= d;
        dy /= d;
      }
      const inamovibile = (b.peso ?? 0) >= val('peso_inamovibile');
      const vettore = inamovibile ? null : { x: dx * spinta, y: dy * spinta, ms: val('t_spinta_nemico') };
      b.colpisci(danno, vettore);
      eventi.emit('ferruccio.colpo', { x: b.x, y: b.y, direzione: { x: dx, y: dy }, bersaglio: b, danno });
      if (b.vita <= 0) {
        eventi.emit('ferruccio.uccisione', { x: b.x, y: b.y, direzione: { x: dx, y: dy }, bersaglio: b, danno });
      }
      colpiti.push(b);
    }
    return colpiti;
  }

  /** Settore del fendente corrente (formula `area_fendente`). */
  function settoreCorrente() {
    return {
      x: ferruccio.x,
      y: ferruccio.y,
      angolo: s.angolo,
      portata: val('portata'),
      arcoGradi: val(s.numero === 3 ? 'arco_f3' : 'arco_f'),
    };
  }

  /** Rettangolo spazzato dell'affondo: dal punto di partenza alla posizione corrente più la lama. */
  function rettangoloCorrente() {
    const lama = val('lama_affondo');
    return {
      x1: s.affondo.x0,
      y1: s.affondo.y0,
      x2: ferruccio.x + s.mira.x * lama,
      y2: ferruccio.y + s.mira.y * lama,
      larghezza: val('larg_affondo'),
    };
  }

  function tickFendente() {
    if (s.fase === 'attivo') {
      const settore = settoreCorrente();
      colpisciBersagli((b) => settoreColpisceCerchio(settore, b), dannoColpo(val(MOLT_FENDENTE[s.numero - 1]), 1), val('spinta_f'));
    }
    s.faseTicks -= 1;
    if (s.faseTicks > 0) return;
    if (s.fase === 'startup') {
      s.fase = 'attivo';
      s.faseTicks = ticks('t_attivo_f');
    } else if (s.fase === 'attivo') {
      s.fase = 'recupero';
      s.faseTicks = ticks(s.numero === 3 ? 't_recupero_f3' : 't_recupero_f');
      if (s.numero < 3) {
        s.prossimo = s.numero + 1;
        s.comboTicks = ticks('t_finestra_combo');
      } else {
        azzeraCombo();
      }
    } else {
      s.numero = 0;
      if (s.tenutoTicks >= 0 && input.tenuto('attacco')) {
        vai('carica');
      } else {
        vai('pronto');
      }
    }
  }

  function tickAffondo() {
    if (s.fase === 'attivo') {
      if (!s.affondo.fermato) {
        const esito = ferruccio.spostaForzato(s.mira.x * s.affondo.passo, s.mira.y * s.affondo.passo);
        if (esito.urto) s.affondo.fermato = true;
      }
      const rett = rettangoloCorrente();
      const colpiti = colpisciBersagli((b) => rettangoloColpisceCerchio(rett, b), dannoColpo(1, val('molt_affondo')), val('spinta_affondo'));
      if (colpiti.some((b) => (b.peso ?? 0) >= val('peso_inamovibile'))) s.affondo.fermato = true;
    }
    s.faseTicks -= 1;
    if (s.faseTicks > 0) return;
    if (s.fase === 'startup') {
      s.fase = 'attivo';
      const n = ticks('t_affondo');
      s.faseTicks = n;
      s.affondo = { x0: ferruccio.x, y0: ferruccio.y, passo: val('d_affondo') / n, fermato: false };
      eventi.emit('ferruccio.affondo', { x: ferruccio.x, y: ferruccio.y, direzione: { ...s.mira } });
    } else if (s.fase === 'attivo') {
      s.fase = 'recupero';
      s.faseTicks = ticks('t_recupero_affondo');
    } else {
      vai('pronto');
    }
  }

  function tickParata() {
    s.faseTicks -= 1;
    if (s.faseTicks > 0) return;
    if (s.fase === 'startup') {
      s.fase = 'finestra';
      s.faseTicks = ticks('t_finestra_p');
    } else if (s.fase === 'finestra') {
      if (s.parataRiuscita) {
        vai('pronto');
      } else {
        eventi.emit('ferruccio.parata_mancata', { x: ferruccio.x, y: ferruccio.y, direzione: { x: ferruccio.verso, y: 0 } });
        s.fase = 'recupero';
        s.faseTicks = ticks('t_recupero_p');
      }
    } else {
      vai('pronto');
    }
  }

  /** Buffer dell'attacco: congelato finché il corpo è in scatto o nel suo recupero, se lo scatto è finito in tempo. */
  function tickBuffer() {
    const corpo = ferruccio.stato;
    if (s.statoCorpoPrecedente === 'scatta' && corpo === 'recupero_scatto' && s.bufferTicks > 0) s.bufferCongelato = true;
    if (corpo !== 'recupero_scatto' && corpo !== 'scatta') s.bufferCongelato = false;
    s.statoCorpoPrecedente = corpo;
    if (s.bufferTicks > 0 && !s.bufferCongelato) {
      s.bufferTicks -= 1;
      if (s.bufferTicks === 0) s.bufferCongelato = false;
    }
    if (s.bufferParataTicks > 0) s.bufferParataTicks -= 1;
  }

  /**
   * Avanza di un passo fisso. Va registrato DOPO Ferruccio nel ciclo.
   * @param {number} _dt secondi (i timer sono in tick)
   */
  function tick(_dt) {
    if (ferruccio.stato === 'morto') return;
    if (s.controcolpoTicks > 0) s.controcolpoTicks -= 1;
    if (s.comboTicks > 0) {
      s.comboTicks -= 1;
      if (s.comboTicks === 0 && s.stato !== 'fendente') azzeraCombo();
    }
    tickBuffer();

    // tenuta del tasto attacco (carica)
    if (s.tenutoTicks >= 0) {
      if (input.tenuto('attacco')) s.tenutoTicks += 1;
      else {
        const completa = s.tenutoTicks >= ticks('t_carica');
        s.tenutoTicks = -1;
        if (s.stato === 'carica') {
          if (completa) avviaAffondo();
          else vai('pronto');
        }
      }
    }

    // input: parata > attacco
    let parataPartita = false;
    const parataChiesta = input.premuto('parata') || s.bufferParataTicks > 0;
    if (parataChiesta) {
      if (puoParare()) {
        avviaParata();
        parataPartita = true;
      } else if (input.premuto('parata')) {
        s.bufferParataTicks = ticks('t_buffer_parata');
      }
    }
    if (!parataPartita) {
      if (input.premuto('attacco')) {
        s.tenutoTicks = 0;
        if (puoAttaccare()) {
          s.bufferTicks = 0;
          avviaFendente();
        } else if (s.stato !== 'carica') {
          s.bufferTicks = ticks('t_buffer');
          s.bufferCongelato = false;
        }
      } else if (s.bufferTicks > 0 && !s.bufferCongelato && puoAttaccare()) {
        s.bufferTicks = 0;
        avviaFendente();
      }
    }

    switch (s.stato) {
      case 'fendente':
        tickFendente();
        break;
      case 'affondo':
        tickAffondo();
        break;
      case 'parata':
        tickParata();
        break;
      case 'carica':
        break;
      default:
        break;
    }

    // contatto passivo: i corpi si separano senza danno (controllo-ferruccio.md regola 6)
    for (const b of bersagli()) {
      if (b && b.stato !== 'morto') ferruccio.separaDa(b);
    }
  }

  /**
   * Un attacco nemico raggiunge Ferruccio (regola 5). Decide tra parata e danno.
   * @param {{ danno?: number, pesante?: boolean, x?: number, y?: number, imparabile?: boolean,
   *           attaccante?: { stordisci?: (ms: number) => void }, proiettile?: { rifletti?: (danno: number, v: number) => void } }} attacco
   * @returns {'parata'|'danno'|'ignorato'}
   */
  function ricevi(attacco = {}) {
    if (ferruccio.stato === 'morto') return 'ignorato';
    const inFinestra = s.stato === 'parata' && s.fase === 'finestra';
    if (inFinestra && !attacco.imparabile) {
      s.parataRiuscita = true;
      let dx = (attacco.x ?? ferruccio.x) - ferruccio.x;
      let dy = (attacco.y ?? ferruccio.y) - ferruccio.y;
      const d = Math.hypot(dx, dy);
      if (d === 0) {
        dx = ferruccio.verso;
        dy = 0;
      } else {
        dx /= d;
        dy /= d;
      }
      attacco.attaccante?.stordisci?.(val('t_stordito'));
      attacco.proiettile?.rifletti?.(val('danno_riflesso'), val('v_riflesso'));
      ferruccio.ricaricaScatto(1);
      s.controcolpoTicks = ticks('t_controcolpo');
      eventi.emit('ferruccio.parata', {
        x: ferruccio.x, y: ferruccio.y, direzione: { x: dx, y: dy }, bersaglio: attacco.attaccante ?? attacco.proiettile ?? null,
      });
      return 'parata';
    }
    const esito = ferruccio.subisciDanno(attacco);
    return esito.applicato ? 'danno' : 'ignorato';
  }

  /** Facciata di Ferruccio come bersaglio per i nemici: cerchio del corpo + `colpisci(attacco)`. */
  const comeBersaglio = Object.freeze({
    get x() { return ferruccio.x; },
    get y() { return ferruccio.y; },
    get r() { return ferruccio.r; },
    get stato() { return ferruccio.stato; },
    colpisci: (attacco) => ricevi(attacco),
  });

  /** Hitbox o alone da disegnare in debug; `null` se niente è attivo. */
  function hitboxCorrente() {
    if (s.stato === 'fendente' && s.fase === 'attivo') return { tipo: 'settore', ...settoreCorrente() };
    if (s.stato === 'fendente') return { tipo: 'settore', fase: s.fase, ...settoreCorrente() };
    if (s.stato === 'affondo' && s.fase === 'attivo') return { tipo: 'rettangolo', ...rettangoloCorrente() };
    if (s.stato === 'parata') return { tipo: 'parata', fase: s.fase, x: ferruccio.x, y: ferruccio.y, r: ferruccio.r + val('portata') / 2 };
    return null;
  }

  // Il danno subito interrompe tutto tranne l'attivo dell'affondo; lo scatto cancella il recupero.
  eventi.on('ferruccio.danno', () => {
    if (s.stato === 'affondo' && s.fase === 'attivo') return;
    interrompi();
  });
  eventi.on('ferruccio.scatto', () => {
    if (s.stato === 'fendente' && s.fase === 'recupero') {
      s.stato = 'pronto';
      s.fase = null;
      s.faseTicks = 0;
      s.numero = 0;
      azzeraCombo();
    }
  });
  ferruccio.collegaVincoli({ puoScattare, modVelocita });

  return {
    get stato() { return s.controcolpoTicks > 0 && s.stato === 'pronto' ? 'controcolpo' : s.stato; },
    get fase() { return s.fase; },
    get numero() { return s.numero; },
    get mira() { return { ...s.mira }; },
    get caricaCompleta() { return s.stato === 'carica' && s.tenutoTicks >= ticks('t_carica'); },
    get controcolpoAttivo() { return s.controcolpoTicks > 0; },
    get bufferAttivo() { return s.bufferTicks > 0; },
    tick,
    ricevi,
    comeBersaglio,
    hitboxCorrente,
    puoScattare,
    modVelocita,
    interrompi,
  };
}
