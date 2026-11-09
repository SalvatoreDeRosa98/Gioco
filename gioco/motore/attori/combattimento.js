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
export function creaCombattimento({
  modificatori, tempo, eventi, input, campo, ferruccio, bersagli = () => [], proiettiliBase = false, statistiche = null, isaac = null,
}) {
  if (!modificatori || !tempo || !eventi || !input || !campo || !ferruccio) throw new TypeError('creaCombattimento: dipendenze mancanti');
  const val = (nome) => modificatori.valore(`combattimento.${nome}`);
  const ticks = (nome) => tempo.ticksDaMs(val(nome));
  const proiettiliFerruccio = [];
  const esplosioniProiettili = [];
  /** Storia P04: fulmini a catena da disegnare {x1,y1,x2,y2,tick} e bruciature attive {bersaglio, ticks, ogni, danno}. */
  const scintilleFulmine = [];
  const bruciature = [];
  // --- squadra oggetti (storia P09): raggio cremisi continuo del Patto (configurazione da patto.json › regole.raggio) ---
  let cfgRaggio = null;
  const raggio = { carica: 0, durata: 0, attivo: false, dir: null, tickDanno: 0 };
  const cfgR = (nome) => { const v = cfgRaggio?.[nome]; return v && typeof v === 'object' ? v.base : (typeof v === 'number' ? v : 0); };
  function azzeraRaggio() {
    if (raggio.attivo) eventi.emit('ferruccio.raggio_fine', { x: ferruccio.x, y: ferruccio.y });
    raggio.carica = 0; raggio.durata = 0; raggio.attivo = false; raggio.dir = null; raggio.tickDanno = 0;
  }
  /** Lunghezza del raggio: portata delle statistiche × molt_portata. */
  function lunghezzaRaggio(st) { return (st?.range ?? val('portata')) * (cfgR('molt_portata') || 1); }
  /** Danno a tutti i bersagli vivi sulla linea del raggio (distanza dall'asse ≤ larghezza/2 + r, davanti, entro la lunghezza). */
  function dannoRaggio(st) {
    const dir = raggio.dir;
    const lung = lunghezzaRaggio(st);
    const mezza = cfgR('larghezza') / 2;
    const danno = (st?.dmg ?? val('danno')) * cfgR('frazione_danno_tick');
    const colpiti = [];
    for (const b of bersagli()) {
      if (!b || b.stato === 'morto') continue;
      const rx = b.x - ferruccio.x;
      const ry = b.y - ferruccio.y;
      const lungo = rx * dir.x + ry * dir.y;
      if (lungo < 0 || lungo > lung) continue;
      const trasv = Math.abs(rx * dir.y - ry * dir.x);
      if (trasv > mezza + (b.r ?? 0)) continue;
      feriscuBersaglio(b, danno, dir.x, dir.y, 0);
      colpiti.push(b);
    }
    if (colpiti.length) eventi.emit('ferruccio.raggio_colpo', { n: colpiti.length, danno });
  }
  /** Un tick con la freccia tenuta e il flag `raggio`: carica, poi raggio per `durata_ms`, poi di nuovo carica. */
  function tickRaggio(dir, st) {
    s.mira = dir;
    s.angolo = Math.atan2(dir.y, dir.x);
    if (raggio.dir && (raggio.dir.x !== dir.x || raggio.dir.y !== dir.y)) azzeraRaggio();
    raggio.dir = dir;
    if (!raggio.attivo) {
      raggio.carica += 1;
      if (raggio.carica < tempo.ticksDaMs(cfgR('carica_ms'))) return true;
      raggio.attivo = true;
      raggio.durata = 0;
      raggio.tickDanno = tempo.ticksDaMs(cfgR('tick_ms')); // il primo tick ferisce subito
      eventi.emit('ferruccio.raggio', { x: ferruccio.x, y: ferruccio.y, direzione: { ...dir } });
    }
    raggio.durata += 1;
    raggio.tickDanno += 1;
    if (raggio.tickDanno >= tempo.ticksDaMs(cfgR('tick_ms'))) { raggio.tickDanno = 0; dannoRaggio(st); }
    if (raggio.durata >= tempo.ticksDaMs(cfgR('durata_ms'))) azzeraRaggio();
    return true;
  }
  /** Solido con `ferma_colpi` sul punto, o null (mura, finestre, ostacoli). */
  function solidoSulPunto(x, y) {
    for (const sol of campo.solidi ?? []) {
      if (sol.ferma_colpi && x >= sol.x && x <= sol.x + sol.w && y >= sol.y && y <= sol.y + sol.h) return sol;
    }
    return null;
  }
  const fuoriCampo = (x, y) => x < campo.x || x > campo.x + campo.larghezza || y < campo.y || y > campo.y + campo.altezza;
  // --- squadra oggetti: fine ---
  /** Costante del blocco `isaac` di personaggi.json (tabella: {base,min,max}); `null` se il blocco non è iniettato. */
  const k = (gruppo, nome) => {
    const v = gruppo ? isaac?.[gruppo]?.[nome] : isaac?.[nome];
    return v && typeof v === 'object' ? v.base : (typeof v === 'number' ? v : null);
  };
  /** Statistiche alla Isaac correnti (storia P04) o null senza personaggio. */
  const stat = () => (typeof statistiche === 'function' ? statistiche() : null);

  function haSpada() {
    const st = stat();
    if (st) return Boolean(st.flags?.spada);
    if (!proiettiliBase) return true;
    const doni = typeof modificatori.doniAttivi === 'function' ? modificatori.doniAttivi() : [];
    return doni.includes('stocco-d-argento');
  }

  function direzione4Vie() {
    const m = s.miraForzata ?? ferruccio.direzioneMira();
    if (Math.abs(m.x) >= Math.abs(m.y)) {
      return { x: m.x >= 0 ? 1 : -1, y: 0 };
    }
    return { x: 0, y: m.y >= 0 ? 1 : -1 };
  }

  /** Azioni di sparo a 4 direzioni (storia P04: le frecce di input.json). La prima tenuta vince. */
  const AZIONI_SPARO = Object.freeze([
    ['spara_destra', { x: 1, y: 0 }], ['spara_sinistra', { x: -1, y: 0 }], ['spara_giu', { x: 0, y: 1 }], ['spara_su', { x: 0, y: -1 }],
  ]);
  /** Direzione della freccia tenuta, o null. */
  function direzioneSparo() {
    for (const [azione, dir] of AZIONI_SPARO) if (input.tenuto(azione)) return { ...dir };
    return null;
  }
  /** Vero se una freccia è stata premuta in questo tick (fronte). */
  function sparoPremuto() {
    return AZIONI_SPARO.some(([azione]) => input.premuto(azione));
  }

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
    miraForzata: null,     // storia P04: direzione della freccia che ha chiesto l'attacco (vince su direzioneMira)
    cooldownSparo: 0,      // storia P04: tick alla prossima raffica senza spada (cooldownTicks delle statistiche)
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
    s.mira = s.miraForzata ?? direzioneSparo() ?? ferruccio.direzioneMira();
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

  /**
   * Spara i proiettili di Ferruccio nella direzione a 4 vie corrente (Teatro `sparaProiettiliDirezione`):
   * quadDir = quattro direzioni insieme, triplo = ventaglio di tre, doppia (senza triplo) = due paralleli;
   * tipo, perforazione, overflowPierce, bruciatura e catena dalle statistiche alla Isaac (storia P04).
   * Senza statistiche (tests delle storie 007-011) vale la regola precedente dell'autore sui doni.
   * @param {number} frazioneDanno 1 senza spada; `isaac.spada.frazione_danno` con la spada
   */
  function sparaProiettili(frazioneDanno = 1) {
    const dir = direzione4Vie();
    s.mira = dir;
    s.angolo = Math.atan2(dir.y, dir.x);
    const st = stat();
    const scala = k(null, 'scala_px') ?? 2;
    const baseDmg = st ? st.dmg * frazioneDanno : dannoColpo(1, 1);
    let tipo = 'base';
    let flags = { triplo: false, doppia: false, quadDir: false, piercing: false, overflowPierce: false, burn: false, chain: false, spettrale: false };
    if (st) {
      tipo = st.tipoProiettile ?? 'base';
      flags = { ...flags, ...st.flags };
    } else {
      const doni = typeof modificatori.doniAttivi === 'function' ? modificatori.doniAttivi() : [];
      tipo = doni.includes('anello-cremisi') ? 'cremisi'
        : doni.includes('tizzone-ardente') || doni.includes('acciarino-caserta') ? 'fuoco'
          : doni.includes('catena-della-chiusa') ? 'elettrico' : 'base';
      flags.piercing = tipo === 'cremisi';
      flags.triplo = doni.includes('bilancino-spezzato');
    }
    const velocita = (k('proiettile', 'velocita_px_frame') ?? 3.9) * scala;
    const rBase = (k('proiettile', 'r_base') ?? 3) * scala * (st?.projScale ?? 1);
    const offDoppia = (k('proiettile', 'offset_doppia') ?? 4) * scala;
    const angTriplo = k('proiettile', 'angolo_triplo') ?? 0.22;
    const bocca = (k('proiettile', 'offset_bocca') ?? 9) * scala;
    const alzata = (k('proiettile', 'alzata') ?? 8) * scala;
    const maxDist = st ? st.range : Math.max(220, val('portata') * 3.4);
    const direzioni = flags.quadDir ? [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a) => s.angolo + a) : [s.angolo];
    const angoli = flags.triplo ? [-angTriplo, 0, angTriplo] : [0];
    const offsets = flags.doppia && !flags.triplo ? [-offDoppia, offDoppia] : [0];
    for (const dirAng of direzioni) {
      for (const da of angoli) {
        for (const off of offsets) {
          const a = dirAng + da;
          proiettiliFerruccio.push({
            x: ferruccio.x + Math.cos(a) * bocca - Math.sin(a) * off,
            y: ferruccio.y - alzata + Math.sin(a) * bocca + Math.cos(a) * off,
            vx: Math.cos(a) * velocita,
            vy: Math.sin(a) * velocita,
            r: rBase,
            danno: baseDmg,
            dist: 0,
            maxDist,
            tipo,
            perforante: Boolean(flags.piercing),
            overflowPierce: Boolean(flags.overflowPierce),
            burn: Boolean(flags.burn),
            chain: Boolean(flags.chain),
            spettrale: Boolean(flags.spettrale), // storia P09: ignora mura e ostacoli, muore al bordo del campo
            colpiti: new Set(),
          });
        }
      }
    }
    eventi.emit('ferruccio.sparo', { x: ferruccio.x, y: ferruccio.y, direzione: { ...dir }, n: proiettiliFerruccio.length, tipo });
  }

  /** Danno a un bersaglio da un proiettile o da un suo effetto, con gli eventi del combattimento. */
  function feriscuBersaglio(b, danno, dx, dy, spinta) {
    const inamovibile = (b.peso ?? 0) >= val('peso_inamovibile');
    const vettore = inamovibile || !spinta ? null : { x: dx * spinta, y: dy * spinta, ms: val('t_spinta_nemico') };
    b.colpisci(danno, vettore);
    eventi.emit('ferruccio.colpo', { x: b.x, y: b.y, direzione: { x: dx, y: dy }, bersaglio: b, danno });
    if (b.vita <= 0) eventi.emit('ferruccio.uccisione', { x: b.x, y: b.y, direzione: { x: dx, y: dy }, bersaglio: b, danno });
  }

  /** Bruciatura (Tizzone): danno a intervalli finché dura; una sola per bersaglio, rinnovata. */
  function brucia(b, dannoColpoBase) {
    const durata = k('burn', 'durata_ticks');
    if (!durata) return;
    const voce = bruciature.find((v) => v.bersaglio === b);
    const danno = dannoColpoBase * (k('burn', 'frazione_danno') ?? 0);
    if (voce) { voce.ticks = durata; voce.danno = Math.max(voce.danno, danno); return; }
    bruciature.push({ bersaglio: b, ticks: durata, ogni: k('burn', 'ogni_ticks') ?? 1, contatore: 0, danno });
  }

  /** Fulmine a catena (Catena della Chiusa): ai vicini del colpito, entro il raggio, una frazione del danno. */
  function catena(b, dannoColpoBase) {
    const raggio = (k('chain', 'raggio') ?? 0) * (k(null, 'scala_px') ?? 2);
    const frazione = k('chain', 'frazione_danno') ?? 0;
    if (raggio <= 0 || frazione <= 0) return;
    for (const altro of bersagli()) {
      if (!altro || altro === b || altro.stato === 'morto') continue;
      if (Math.hypot(altro.x - b.x, altro.y - b.y) > raggio) continue;
      let dx = altro.x - b.x; let dy = altro.y - b.y;
      const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      feriscuBersaglio(altro, dannoColpoBase * frazione, dx, dy, 0);
      scintilleFulmine.push({ x1: b.x, y1: b.y, x2: altro.x, y2: altro.y, tick: 0, maxTick: 6 });
    }
  }

  function tickBruciature() {
    for (let i = bruciature.length - 1; i >= 0; i--) {
      const v = bruciature[i];
      if (!v.bersaglio || v.bersaglio.stato === 'morto' || v.ticks <= 0) { bruciature.splice(i, 1); continue; }
      v.ticks -= 1;
      v.contatore += 1;
      if (v.contatore >= v.ogni) {
        v.contatore = 0;
        feriscuBersaglio(v.bersaglio, v.danno, 0, 0, 0);
      }
    }
    for (let i = scintilleFulmine.length - 1; i >= 0; i--) {
      scintilleFulmine[i].tick += 1;
      if (scintilleFulmine[i].tick >= scintilleFulmine[i].maxTick) scintilleFulmine.splice(i, 1);
    }
  }

  function tickProiettili() {
    for (let i = proiettiliFerruccio.length - 1; i >= 0; i--) {
      const p = proiettiliFerruccio[i];
      p.x += p.vx;
      p.y += p.vy;
      p.dist += Math.hypot(p.vx, p.vy);
      let rimuovi = p.dist >= p.maxDist;
      // --- squadra oggetti (storia P09): mura e ostacoli fermano il proiettile (la Crepa Dorata lo ascolta), salvo spettrale ---
      if (!rimuovi) {
        if (p.spettrale) {
          if (fuoriCampo(p.x, p.y)) rimuovi = true;
        } else {
          const sol = solidoSulPunto(p.x, p.y);
          if (sol) {
            eventi.emit('ferruccio.colpo_muro', { x: p.x, y: p.y, solido: sol, tipo: p.tipo });
            esplosioniProiettili.push({ x: p.x, y: p.y, tick: 0, maxTick: 12, tipo: p.tipo });
            proiettiliFerruccio.splice(i, 1);
            continue;
          }
        }
      }
      // --- squadra oggetti: fine ---
      for (const b of bersagli()) {
        if (!b || b.stato === 'morto' || p.colpiti.has(b)) continue;
        const d = Math.hypot(b.x - p.x, (b.y - 14) - p.y);
        if (d <= (b.r ?? 20) + p.r) {
          p.colpiti.add(b);
          const norm = Math.hypot(p.vx, p.vy) || 1;
          const dx = p.vx / norm;
          const dy = p.vy / norm;
          const vitaPrima = b.vita;
          feriscuBersaglio(b, p.danno, dx, dy, val('spinta_f'));
          if (p.burn && b.vita > 0) brucia(b, p.danno);
          if (p.chain) catena(b, p.danno);
          esplosioniProiettili.push({ x: p.x, y: p.y, tick: 0, maxTick: 12, tipo: p.tipo });
          // overflowPierce (Lacrima di Piombo): il danno in eccesso sull'ucciso prosegue oltre
          if (p.overflowPierce && b.vita <= 0 && p.danno > vitaPrima) {
            p.danno -= vitaPrima;
            continue;
          }
          if (!p.perforante) {
            rimuovi = true;
            break;
          }
        }
      }
      if (rimuovi) {
        if (p.dist >= p.maxDist) {
          esplosioniProiettili.push({ x: p.x, y: p.y, tick: 0, maxTick: 12, tipo: p.tipo });
        }
        proiettiliFerruccio.splice(i, 1);
      }
    }
    for (let i = esplosioniProiettili.length - 1; i >= 0; i--) {
      esplosioniProiettili[i].tick += 1;
      if (esplosioniProiettili[i].tick >= esplosioniProiettili[i].maxTick) {
        esplosioniProiettili.splice(i, 1);
      }
    }
  }

  function avviaFendente() {
    const numero = s.prossimo;
    s.numero = numero;
    s.colpiti = new Set();
    fissaMira();
    consumaControcolpo();
    s.comboTicks = 0;
    if (!haSpada()) {
      sparaProiettili(1);
    } else {
      // Teatro: con la spada i proiettili escono solo se triplo, quadDir, perforanti o di un tipo speciale
      const st = stat();
      const f = st?.flags ?? {};
      if (st && (f.triplo || f.quadDir || f.piercing || (st.tipoProiettile && st.tipoProiettile !== 'base'))) {
        sparaProiettili(k('spada', 'frazione_danno') ?? 1);
      }
    }
    s.miraForzata = null;
    vai('fendente', 'startup', numero > 1 ? 't_startup_combo' : 't_startup_f');
  }

  /**
   * Storia P04: lo sparo con le frecce. Senza spada: finché una freccia è tenuta, una raffica ogni
   * `cooldownTicks` delle statistiche (Teatro: `player.cooldown = cooldownMax`). Con la spada: la freccia
   * premuta dà il fendente in quella direzione (cadenza della combo come con J).
   * @returns {boolean} vero se un'azione è partita
   */
  function tickSparo() {
    if (s.cooldownSparo > 0) s.cooldownSparo -= 1;
    const dir = direzioneSparo();
    if (!dir) { if (raggio.dir) azzeraRaggio(); return false; }
    // --- squadra oggetti (storia P09): con il Raggio Cremisi Continuo la freccia tenuta è un laser, non una raffica ---
    const stR = stat();
    if (stR?.flags?.raggio && cfgRaggio && !haSpada()) {
      if (!corpoLibero()) { azzeraRaggio(); return false; }
      return tickRaggio(dir, stR);
    }
    // --- squadra oggetti: fine ---
    if (haSpada()) {
      if (sparoPremuto() && puoAttaccare()) {
        s.miraForzata = dir;
        s.bufferTicks = 0;
        avviaFendente();
        return true;
      }
      return false;
    }
    if (s.cooldownSparo > 0 || !corpoLibero() || s.stato !== 'pronto') return false;
    const st = stat();
    s.miraForzata = dir;
    fissaMira();
    consumaControcolpo();
    sparaProiettili(1);
    s.miraForzata = null;
    s.cooldownSparo = st ? st.cooldownTicks : ticks('t_startup_f') + ticks('t_attivo_f') + ticks('t_recupero_f');
    return true;
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
    if (s.fase === 'attivo' && haSpada()) {
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
    // storia P04: le frecce sparano (o danno il fendente con la spada); la parata resta prioritaria
    const sparoPartito = !parataPartita && tickSparo();
    if (!parataPartita && !sparoPartito) {
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

    tickProiettili();
    tickBruciature();

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

  function frameSpada() {
    if (s.stato !== 'fendente') return 0;
    if (s.fase === 'startup') return s.faseTicks > 2 ? 0 : 1;
    if (s.fase === 'attivo') return s.faseTicks > 2 ? 2 : 3;
    return s.faseTicks > 3 ? 4 : 5;
  }

  return {
    get stato() { return s.controcolpoTicks > 0 && s.stato === 'pronto' ? 'controcolpo' : s.stato; },
    get fase() { return s.fase; },
    get numero() { return s.numero; },
    get mira() { return { ...s.mira }; },
    get caricaCompleta() { return s.stato === 'carica' && s.tenutoTicks >= ticks('t_carica'); },
    get controcolpoAttivo() { return s.controcolpoTicks > 0; },
    get bufferAttivo() { return s.bufferTicks > 0; },
    haSpada,
    frameSpada,
    proiettiliFerruccio: () => proiettiliFerruccio,
    esplosioniProiettili: () => esplosioniProiettili,
    /** Storia P04: fulmini a catena da disegnare, bruciature attive, direzione della freccia tenuta, tick alla prossima raffica. */
    scintilleFulmine: () => scintilleFulmine,
    bruciature: () => bruciature.map((v) => ({ bersaglio: v.bersaglio, ticks: v.ticks, danno: v.danno })),
    direzioneSparo,
    get cooldownSparo() { return s.cooldownSparo; },
    // --- squadra oggetti (storia P09): raggio continuo del Patto ---
    /** Imposta la configurazione del raggio (patto.json › regole.raggio); senza, il flag `raggio` non fa nulla. */
    impostaRaggio: (cfg) => { cfgRaggio = cfg ?? null; },
    /** Stato del raggio per renderer e test: {attivo, carica 0..1, x, y, dx, dy, lunghezza, larghezza}. */
    raggio: () => {
      const st = stat();
      const caricaTicks = tempo.ticksDaMs(cfgR('carica_ms'));
      return {
        attivo: raggio.attivo, carica: caricaTicks > 0 ? Math.min(1, raggio.carica / caricaTicks) : (raggio.dir ? 1 : 0),
        x: ferruccio.x, y: ferruccio.y, dx: raggio.dir?.x ?? 0, dy: raggio.dir?.y ?? 0,
        lunghezza: raggio.dir ? lunghezzaRaggio(st) : 0, larghezza: cfgR('larghezza'),
      };
    },
    // --- squadra oggetti: fine ---
    /** Statistiche alla Isaac correnti o null (storia P04). */
    statistiche: () => stat(),
    tick,
    ricevi,
    comeBersaglio,
    hitboxCorrente,
    puoScattare,
    modVelocita,
    interrompi,
  };
}
