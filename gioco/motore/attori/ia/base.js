/**
 * motore/attori/ia/base.js — IA base a stati di ogni nemico (nemici.md «States and Transitions»).
 *
 *   emersione → pattuglia ⇄ insegue → anticipo → lampo → colpo → recupero → insegue
 *                                      colpo → stordito (parata riuscita) → insegue
 *                                      qualunque → morto (gestito dal proprietario, `nemico.js`)
 *
 * La macchina non conosce il contratto del combattimento né il corpo: riceve un **contesto** con
 * la scheda già scalata per piano (numeri in px, px/s e TICK), il corpo `{x, y, r}` da leggere, il
 * bersaglio (facciata di Ferruccio), e i ganci `muovi(dx, dy)`, `lineaLibera(x1, y1, x2, y2)`,
 * `colpisci()` (impatto del Colpo: ritorna 'parata' | 'danno' | 'ignorato' | null se fuori hitbox),
 * `direttore` (gettoni, può mancare: allora il gettone è sempre concesso) e `emit`.
 *
 * Regole implementate qui:
 *  - §2.2 contatto passivo innocuo: in Insegue il nemico si ferma a `r + r_corpo + d_contatto` e
 *    non tocca mai Ferruccio camminando; senza gettone o in cooldown tiene `d_attesa`;
 *  - §1 R1 ordine fisso anticipo → lampo → colpo, R5 direzione fissata all'inizio del lampo
 *    (parabili) o dell'anticipo (imparabili), R7 un solo attacco per nemico;
 *  - transizioni della tabella del GDD: allerta per `r_aggro` con linea di vista, ferita o allarme
 *    di stanza; perdita dopo `t_perdita` oltre `r_lose`; Anticipo che non si interrompe;
 *  - armatura del telegrafo (prototipo): un colpo subìto non interrompe anticipo, lampo e colpo;
 *  - Ferruccio morto: i nemici restano neutri (nessun attacco, nessun movimento verso di lui).
 *
 * Storia 020 (gatto d'ombra, ma scritto in generale sulla scheda):
 *  - **anello d'attesa** (GDD 4.1): senza gettone o in cooldown, se `omegaAttesa` > 0 il nemico gira
 *    attorno a Ferruccio sulla banda `dAttesa ± tolleranzaAttesa` a velocità angolare ≤ `omegaAttesa`
 *    (verso `versoOrbita`, scelto col seme), mai sotto `d_min` senza gettone;
 *  - **portata dinamica** (`balzoExtra` non nullo): la lunghezza del Colpo è
 *    `clamp(d_lampo + balzoExtra, balzoMin, portata)`, fissata all'inizio del lampo come la direzione;
 *  - **hitbox ritardata** (`hitDal`, REPORT del prototipo: 0,45): la hitbox si accende a
 *    `max(1, round(hitDal × tImp))` tick dall'inizio del Colpo, così l'impatto cade sempre a
 *    `tLamp + max(1, round(hitDal × tImp))` tick dall'inizio del lampo, qualunque sia la distanza
 *    (`istanteImpatto`; coi valori del GDD 19 + 5 = 24 tick ≈ 400 ms: la finestra di pressione
 *    valida F4 diventa 190-370 ms dopo il lampo invece dei 100-280 scritti nel GDD);
 *  - **anello** (`tAnello` > 0): a `tAnello` tick dall'inizio del lampo emette `telegrafo.anello`
 *    (la chiusura dell'anello rosso: il segnale di tempo per la parata); `anello` è il suo progresso.
 *
 * La pattuglia usa il generatore derivato ricevuto (ADR-0003: niente casualità nativa).
 * Nessun numero di gioco: tutto dalla scheda (`contenuti/parametri/nemici.json`).
 */

import { intero } from '../../fondazione/rng.js';

/** Stati del nemico (ordine della tabella del GDD; `lampo` è la fase L dell'Anticipo). */
export const STATI_NEMICO = Object.freeze(['emersione', 'pattuglia', 'insegue', 'anticipo', 'lampo', 'colpo', 'recupero', 'stordito', 'morto']);

/** Transizioni ammesse (tabella «Da → A» del GDD; `morto` è raggiungibile da ovunque). */
export const TRANSIZIONI_NEMICO = Object.freeze({
  emersione: Object.freeze(['pattuglia']),
  pattuglia: Object.freeze(['insegue']),
  insegue: Object.freeze(['pattuglia', 'anticipo']),
  anticipo: Object.freeze(['lampo']),
  lampo: Object.freeze(['colpo']),
  colpo: Object.freeze(['recupero', 'stordito']),
  recupero: Object.freeze(['insegue']),
  stordito: Object.freeze(['insegue']),
  morto: Object.freeze([]),
});

/** Stati in cui il nemico è impegnato nel telegrafo (R7, armatura). */
export const STATI_TELEGRAFO = Object.freeze(['anticipo', 'lampo', 'colpo']);

/**
 * @typedef {object} SchedaIa
 * @property {number} r raggio della hitbox
 * @property {number} rAggro
 * @property {number} rLose
 * @property {number} vPattuglia px/s
 * @property {number} vInsegue px/s
 * @property {number} dAttesa distanza tenuta senza gettone o in cooldown
 * @property {number} [omegaAttesa] gradi/s dell'orbita sull'anello d'attesa (0 = sta fermo)
 * @property {number} [versoOrbita] +1 o −1
 * @property {number} dContatto margine del fermo a contatto (§2.2: 6 px)
 * @property {number} tolleranzaAttesa isteresi attorno a dAttesa
 * @property {number} tEmersione tick
 * @property {number} tAllarme tick dalla fine dell'emersione
 * @property {number} tPerdita tick
 * @property {number} tRiprova tick tra due richieste di gettone negate
 * @property {number} rPattuglia raggio della zona di pattuglia attorno alla nascita
 * @property {number} puntiMin
 * @property {number} puntiMax
 * @property {number} pausaMin tick
 * @property {number} pausaMax tick
 * @property {{ tAnt: number, tLamp: number, tImp: number, tRec: number, tCd: number, dMin: number, dMax: number,
 *             portata: number, larghezza: number, settoreGradi: number, pesante: boolean, imparabile: boolean,
 *             avanza: boolean, lineaLibera: boolean, hitDal?: number, balzoExtra?: number | null, balzoMin?: number,
 *             tAnello?: number, senzaGettone?: boolean }} attacco tempi in tick; `senzaGettone` (storia P05) non chiede il gettone al direttore
 */

/**
 * Crea la macchina a stati di un nemico.
 * @param {{
 *   scheda: SchedaIa,
 *   corpo: { x: number, y: number, r: number },
 *   bersaglio: { x: number, y: number, r: number, stato: string } | null,
 *   campo: { x: number, y: number, larghezza: number, altezza: number },
 *   rng: () => number,
 *   muovi: (dx: number, dy: number) => boolean,
 *   lineaLibera: (x1: number, y1: number, x2: number, y2: number) => boolean,
 *   colpisci: (attacco: { direzione: { x: number, y: number }, origine: { x: number, y: number } }) => string | null,
 *   direttore?: { richiedi: Function, rilascia: Function } | null,
 *   chiave?: object,
 *   emit?: (nome: string, payload?: unknown) => unknown,
 *   id?: string,
 *   ferito?: () => boolean,
 *   dentroHitbox?: Function
 * }} ctx
 */
export function creaIaBase(ctx) {
  const { scheda, corpo, campo, rng, muovi, lineaLibera, colpisci } = ctx;
  if (!scheda || !corpo || !campo || typeof rng !== 'function' || typeof muovi !== 'function' || typeof lineaLibera !== 'function' || typeof colpisci !== 'function') {
    throw new TypeError('creaIaBase: contesto incompleto');
  }
  const emit = ctx.emit ?? (() => {});
  const direttore = ctx.direttore ?? null;
  const chiave = () => ctx.chiave ?? corpo; // pigro: la facciata del nemico nasce dopo l'IA
  const id = ctx.id ?? 'nemico';
  const ferito = ctx.ferito ?? (() => false);
  const A = scheda.attacco;
  const hitDal = Math.min(1, Math.max(0, A.hitDal ?? 0));
  const balzoExtra = Number.isFinite(A.balzoExtra) ? A.balzoExtra : null;
  const balzoMin = A.balzoMin ?? A.portata;
  const tAnello = Math.max(0, A.tAnello ?? 0);
  const omegaAttesa = Math.max(0, scheda.omegaAttesa ?? 0);
  const versoOrbita = (scheda.versoOrbita ?? 1) < 0 ? -1 : 1;
  /** Tick del Colpo (contati dal primo tick DOPO il passaggio lampo → colpo) in cui la hitbox si accende:
   *  almeno 1 (con hitDal 0 è il primo tick utile, come nella storia 019) e almeno un tick di hitbox resta. */
  const hitTicks = Math.min(Math.max(1, A.tImp - 1), Math.max(1, Math.round(hitDal * A.tImp)));

  const s = {
    stato: 'emersione',
    faseTicks: scheda.tEmersione,
    faseDurata: scheda.tEmersione,
    portataColpo: A.portata,  // lunghezza del Colpo corrente (dinamica per il balzo), fissata al lampo
    origineLampo: { x: 0, y: 0 },
    colpoTicks: 0,            // tick trascorsi dall'inizio del Colpo
    anelloEmesso: false,
    cooldownTicks: 0,
    daEmersione: 0,          // tick dalla fine dell'emersione (allarme di stanza)
    fuoriVista: 0,           // tick consecutivi oltre r_lose
    riprovaTicks: 0,
    lampoTicks: 0,
    direzione: { x: 1, y: 0 },
    puntiPattuglia: /** @type {{x:number,y:number}[]} */ ([]),
    indicePattuglia: 0,
    pausaTicks: 0,
    colpoFatto: false,
    esitoColpo: /** @type {string|null} */ (null),
    avanzato: 0,
    origineColpo: { x: 0, y: 0 }, // posizione all'inizio del Colpo: la hitbox parte da qui (F4: I = inizio del colpo)
    gettone: false,
  };

  // --- utilità -------------------------------------------------------------------------------

  const bersaglio = () => ctx.bersaglio ?? null;
  const bersaglioVivo = () => {
    const b = bersaglio();
    return Boolean(b) && b.stato !== 'morto';
  };
  const distanza = () => {
    const b = bersaglio();
    return b ? Math.hypot(b.x - corpo.x, b.y - corpo.y) : Infinity;
  };
  const versoBersaglio = () => {
    const b = bersaglio();
    if (!b) return { x: s.direzione.x, y: s.direzione.y };
    const dx = b.x - corpo.x;
    const dy = b.y - corpo.y;
    const d = Math.hypot(dx, dy);
    return d === 0 ? { x: s.direzione.x, y: s.direzione.y } : { x: dx / d, y: dy / d };
  };
  const vedeBersaglio = () => {
    const b = bersaglio();
    return Boolean(b) && lineaLibera(corpo.x, corpo.y, b.x, b.y);
  };
  /** Distanza minima del fermo a contatto (§2.2). */
  const dFermo = () => corpo.r + (bersaglio()?.r ?? 0) + scheda.dContatto;

  function vai(nuovo) {
    if (s.stato === nuovo) return;
    if (!TRANSIZIONI_NEMICO[s.stato].includes(nuovo)) throw new RangeError(`ia ${id}: transizione non ammessa ${s.stato} -> ${nuovo}`);
    const da = s.stato;
    s.stato = nuovo;
    emit('nemico.stato', { id, da, a: nuovo });
  }

  /** Imposta la durata della fase corrente (per `progresso`). */
  function fase(ticks) {
    s.faseTicks = ticks;
    s.faseDurata = Math.max(1, ticks);
  }

  /** Lunghezza del Colpo per una distanza al lampo (portata dinamica del balzo o fissa). */
  function portataPer(d) {
    if (balzoExtra === null) return A.portata;
    return Math.min(A.portata, Math.max(balzoMin, d + balzoExtra));
  }

  /** Punti di pattuglia nella zona di nascita, dentro l'area calpestabile (scelti col seme). */
  function generaPattuglia() {
    const n = intero(rng, scheda.puntiMin, scheda.puntiMax);
    const punti = [];
    for (let i = 0; i < n; i++) {
      const angolo = rng() * Math.PI * 2;
      const d = rng() * scheda.rPattuglia;
      const x = Math.min(campo.x + campo.larghezza - corpo.r, Math.max(campo.x + corpo.r, corpo.x + Math.cos(angolo) * d));
      const y = Math.min(campo.y + campo.altezza - corpo.r, Math.max(campo.y + corpo.r, corpo.y + Math.sin(angolo) * d));
      punti.push({ x, y });
    }
    return punti;
  }

  /**
   * Muove verso un punto di `passo` px al massimo; ritorna vero se è arrivato o si è urtato.
   */
  function avvicina(px, py, passo) {
    const dx = px - corpo.x;
    const dy = py - corpo.y;
    const d = Math.hypot(dx, dy);
    if (d <= passo || d === 0) {
      if (d > 0) muovi(dx, dy);
      return true;
    }
    s.direzione = { x: dx / d, y: dy / d };
    const urto = muovi((dx / d) * passo, (dy / d) * passo);
    return urto;
  }

  /** Il cooldown scorre in ogni stato tranne quelli del telegrafo e lo stordimento. */
  function tickCooldown() {
    if (s.cooldownTicks > 0) s.cooldownTicks -= 1;
    if (s.riprovaTicks > 0) s.riprovaTicks -= 1;
  }

  // --- stati ---------------------------------------------------------------------------------

  function tickPattuglia(dt) {
    tickCooldown();
    s.daEmersione += 1;
    const b = bersaglio();
    const allerta = bersaglioVivo() && (
      (distanza() <= scheda.rAggro && vedeBersaglio()) || ferito() || s.daEmersione >= scheda.tAllarme
    );
    if (allerta && b) {
      vai('insegue');
      s.fuoriVista = 0;
      return;
    }
    if (scheda.vPattuglia <= 0 || s.puntiPattuglia.length === 0) return;
    if (s.pausaTicks > 0) {
      s.pausaTicks -= 1;
      return;
    }
    const p = s.puntiPattuglia[s.indicePattuglia];
    if (avvicina(p.x, p.y, scheda.vPattuglia * dt)) {
      s.indicePattuglia = (s.indicePattuglia + 1) % s.puntiPattuglia.length;
      s.pausaTicks = intero(rng, scheda.pausaMin, scheda.pausaMax);
    }
  }

  /** Richiesta del gettone e ingresso in Anticipo; ritorna vero se l'attacco è partito. */
  function provaAttacco(d) {
    if (s.cooldownTicks > 0 || s.riprovaTicks > 0) return false;
    if (d < A.dMin || d > A.dMax) return false;
    if (A.lineaLibera && !vedeBersaglio()) return false;
    const traTicks = A.tAnt + A.tLamp + hitTicks;
    // storia P05: `senzaGettone` (statua, bomba: pericoli ambientali alla Isaac) salta il direttore
    const ok = direttore && !A.senzaGettone ? direttore.richiedi(chiave(), { traTicks, imparabile: A.imparabile }) : true;
    if (!ok) {
      s.riprovaTicks = scheda.tRiprova;
      return false;
    }
    s.gettone = !A.senzaGettone;
    vai('anticipo');
    fase(A.tAnt);
    if (A.imparabile) s.direzione = versoBersaglio(); // R5: gli imparabili fissano la direzione all'inizio dell'anticipo
    emit('telegrafo.anticipo', { id, x: corpo.x, y: corpo.y, imparabile: A.imparabile, tAnt: A.tAnt, direzione: { ...s.direzione } });
    return true;
  }

  function tickInsegue(dt) {
    tickCooldown();
    s.daEmersione += 1;
    if (!bersaglioVivo()) return; // Ferruccio morto: stato neutro
    const d = distanza();
    // perdita del bersaglio (solo senza allarme di stanza)
    if (d > scheda.rLose) s.fuoriVista += 1;
    else s.fuoriVista = 0;
    if (s.fuoriVista >= scheda.tPerdita && s.daEmersione < scheda.tAllarme) {
      vai('pattuglia');
      return;
    }
    if (provaAttacco(d)) return;
    if (scheda.vInsegue <= 0) return; // statue: ruotano soltanto
    // distanza obiettivo: con cooldown pronto avvicina fino alla banda d'attacco, altrimenti tiene d_attesa;
    // mai sotto il fermo a contatto (§2.2); se è troppo vicino per attaccare (d < d_min) arretra fino alla banda
    const pronto = s.cooldownTicks <= 0 && s.riprovaTicks <= 0;
    const obiettivo = Math.max(dFermo(), pronto ? Math.min(A.dMax, scheda.dAttesa) : scheda.dAttesa);
    const v = versoBersaglio();
    if (d < A.dMin && d < obiettivo) {
      const passo = Math.min(scheda.vInsegue * dt, A.dMin - d);
      s.direzione = v;
      muovi(-v.x * passo, -v.y * passo);
      return;
    }
    const isteresi = obiettivo > dFermo() ? scheda.tolleranzaAttesa : 0; // il fermo a contatto è esatto
    if (d <= obiettivo + isteresi) {
      // nella banda: contatto passivo innocuo; senza gettone gira sull'anello d'attesa (storia 020)
      if (!pronto && omegaAttesa > 0 && d > dFermo()) orbita(v, d, dt);
      return;
    }
    const passo = Math.min(scheda.vInsegue * dt, d - obiettivo);
    s.direzione = v;
    muovi(v.x * passo, v.y * passo);
  }

  /** Un passo tangenziale attorno a Ferruccio a velocità angolare ≤ omegaAttesa (e lineare ≤ vInsegue). */
  function orbita(v, d, dt) {
    const omegaRad = (omegaAttesa * Math.PI) / 180;
    const passo = Math.min(scheda.vInsegue * dt, d * omegaRad * dt);
    // versoOrbita +1 = angolo (atan2 attorno a Ferruccio) crescente, cioè orario sullo schermo (y verso il basso)
    const tx = v.y * versoOrbita;
    const ty = -v.x * versoOrbita;
    s.direzione = { x: tx, y: ty };
    muovi(tx * passo, ty * passo);
  }

  function tickAnticipo() {
    s.faseTicks -= 1;
    if (s.faseTicks > 0) return;
    if (!A.imparabile) s.direzione = versoBersaglio(); // R5: i parabili fissano la direzione all'inizio del lampo
    s.portataColpo = portataPer(distanza()); // GDD 4.1: d_balzo fissata all'inizio del lampo
    s.origineLampo = { x: corpo.x, y: corpo.y };
    vai('lampo');
    fase(A.tLamp);
    s.lampoTicks = 0;
    s.anelloEmesso = false;
    emit('telegrafo.lampo', {
      id, x: corpo.x, y: corpo.y, direzione: { ...s.direzione }, imparabile: A.imparabile, tLamp: A.tLamp, tImp: A.tImp,
      portata: s.portataColpo, larghezza: A.larghezza, settoreGradi: A.settoreGradi, tAnello, hitTicks,
    });
  }

  function tickLampo() {
    s.lampoTicks += 1;
    if (tAnello > 0 && !s.anelloEmesso && s.lampoTicks >= tAnello) {
      s.anelloEmesso = true;
      emit('telegrafo.anello', { id, x: corpo.x, y: corpo.y, direzione: { ...s.direzione }, imparabile: A.imparabile, hitTicks: A.tLamp - s.lampoTicks + hitTicks });
    }
    s.faseTicks -= 1;
    if (s.faseTicks > 0) return;
    vai('colpo');
    fase(A.tImp);
    s.colpoTicks = 0;
    s.colpoFatto = false;
    s.esitoColpo = null;
    s.avanzato = 0;
    s.origineColpo = { x: corpo.x, y: corpo.y };
    emit('telegrafo.colpo', { id, x: corpo.x, y: corpo.y, direzione: { ...s.direzione }, imparabile: A.imparabile, tImp: A.tImp, portata: s.portataColpo, hitTicks });
  }

  function tickColpo(dt) {
    const origine = s.origineColpo;
    const L = s.portataColpo;
    if (A.avanza && A.tImp > 0) {
      // il corpo percorre `portataColpo` in `t_imp` (balzo, picchiata); contro un muro si ferma
      const passo = Math.min(L / A.tImp, L - s.avanzato);
      if (passo > 0) {
        const urto = muovi(s.direzione.x * passo, s.direzione.y * passo);
        s.avanzato += passo;
        if (urto) s.avanzato = L;
      }
    }
    s.colpoTicks += 1;
    if (!s.colpoFatto && s.colpoTicks >= hitTicks) {
      const esito = colpisci({ direzione: { ...s.direzione }, origine, dt });
      if (esito) {
        s.colpoFatto = true;
        s.esitoColpo = esito;
        emit('nemico.colpo', { id, x: corpo.x, y: corpo.y, esito, imparabile: A.imparabile });
        if (s.stato !== 'colpo') return; // la parata lo ha già stordito
      }
    }
    s.faseTicks -= 1;
    if (s.faseTicks > 0) return;
    rilasciaGettone();
    vai('recupero');
    fase(A.tRec);
  }

  function tickRecupero() {
    s.faseTicks -= 1;
    if (s.faseTicks > 0) return;
    vai('insegue');
    s.cooldownTicks = A.tCd;
    s.fuoriVista = 0;
  }

  function tickStordito() {
    s.faseTicks -= 1;
    if (s.faseTicks > 0) return;
    vai('insegue');
    s.cooldownTicks = 0; // il cooldown ricomincia da 0 (tabella delle transizioni)
    s.fuoriVista = 0;
  }

  function rilasciaGettone() {
    if (!s.gettone) return;
    s.gettone = false;
    direttore?.rilascia(chiave());
  }

  // --- API -----------------------------------------------------------------------------------

  /**
   * Avanza di un passo fisso.
   * @param {number} dt secondi
   */
  function tick(dt) {
    switch (s.stato) {
      case 'emersione':
        s.faseTicks -= 1;
        if (s.faseTicks <= 0) {
          s.puntiPattuglia = generaPattuglia();
          s.daEmersione = 0;
          vai('pattuglia');
        }
        break;
      case 'pattuglia': tickPattuglia(dt); break;
      case 'insegue': tickInsegue(dt); break;
      case 'anticipo': tickAnticipo(); break;
      case 'lampo': tickLampo(); break;
      case 'colpo': tickColpo(dt); break;
      case 'recupero': tickRecupero(); break;
      case 'stordito': tickStordito(); break;
      default: break;
    }
  }

  /**
   * Stordimento (parata riuscita, combattimento.md regola 5): interrompe il Colpo. Ritorna falso se
   * ignorato (già stordito: lo stordimento non si prolunga; morto; o fuori dal Colpo per un
   * imparabile: la parata non ha effetto).
   * @param {number} ticks durata
   */
  function stordisci(ticks) {
    if (s.stato === 'morto' || s.stato === 'stordito' || s.stato === 'emersione') return false;
    if (STATI_TELEGRAFO.includes(s.stato) && s.stato !== 'colpo') return false; // R7: il telegrafo non si annulla prima del colpo
    rilasciaGettone();
    if (s.stato === 'colpo') vai('stordito');
    else {
      // stordimento fuori dal colpo (riflesso del proiettile, storia 021): fuori tabella, ammesso
      const da = s.stato;
      s.stato = 'stordito';
      emit('nemico.stato', { id, da, a: 'stordito' });
    }
    fase(Math.max(1, ticks));
    emit('nemico.stordito', { id, x: corpo.x, y: corpo.y, ticks: s.faseTicks });
    return true;
  }

  /** Morte: rilascia il gettone e ferma la macchina (la dissoluzione è del proprietario). */
  function muori() {
    if (s.stato === 'morto') return;
    rilasciaGettone();
    const da = s.stato;
    s.stato = 'morto';
    emit('nemico.stato', { id, da, a: 'morto' });
  }

  /**
   * Strumento di debug e test: porta la macchina in uno stato (senza controllare la tabella).
   * @param {string} stato
   */
  function forza(stato) {
    if (!STATI_NEMICO.includes(stato)) throw new RangeError(`ia ${id}: stato sconosciuto '${stato}'`);
    if (stato === 'pattuglia' && s.puntiPattuglia.length === 0) s.puntiPattuglia = generaPattuglia();
    s.stato = stato;
    s.faseTicks = 0;
    s.cooldownTicks = 0;
    s.riprovaTicks = 0;
  }

  return {
    get stato() { return s.stato; },
    get faseTicks() { return s.faseTicks; },
    get cooldownTicks() { return s.cooldownTicks; },
    get direzione() { return { ...s.direzione }; },
    get gettone() { return s.gettone; },
    get lampoAcceso() { return s.stato === 'lampo'; },
    /** 0 → 1 dentro la fase corrente (emersione, anticipo, lampo, colpo, recupero, stordito). */
    get progresso() { return s.faseDurata > 0 ? Math.min(1, Math.max(0, 1 - s.faseTicks / s.faseDurata)) : 1; },
    /** Lunghezza del Colpo corrente (dinamica per il balzo), fissata all'inizio del lampo. */
    get portataColpo() { return s.portataColpo; },
    /** Posizione all'inizio del lampo: da qui parte il segno a terra. */
    get origineLampo() { return { ...s.origineLampo }; },
    /** Vero nei tick del Colpo in cui la hitbox è accesa (da `hitTicks` in poi). */
    get hitboxAttiva() { return s.stato === 'colpo' && s.colpoTicks >= hitTicks; },
    /** Tick del Colpo (dal suo inizio) in cui la hitbox si accende. */
    get hitTicks() { return hitTicks; },
    /** Istante d'impatto in tick dall'inizio del lampo: costante, qualunque sia la distanza. */
    get istanteImpatto() { return A.tLamp + hitTicks; },
    /** Quota del percorso del Colpo da cui la hitbox è attiva (0 = dall'origine). */
    get hitDal() { return hitDal; },
    /** Progresso 0 → 1 della chiusura dell'anello del lampo (1 fuori dal lampo o senza anello). */
    get anello() { return s.stato === 'lampo' && tAnello > 0 ? Math.min(1, s.lampoTicks / tAnello) : 1; },
    get versoOrbita() { return versoOrbita; },
    get esitoColpo() { return s.esitoColpo; },
    get origineColpo() { return { ...s.origineColpo }; },
    get puntiPattuglia() { return s.puntiPattuglia.map((p) => ({ ...p })); },
    get inTelegrafo() { return STATI_TELEGRAFO.includes(s.stato); },
    get allarme() { return s.daEmersione >= scheda.tAllarme; },
    dFermo,
    tick,
    stordisci,
    muori,
    forza,
  };
}
