/**
 * motore/attori/ferruccio.js — Il corpo di Ferruccio (Core, GDD controllo-ferruccio.md).
 *
 * Macchina a stati del corpo (regole 2-6, 8, 9; tabella «States and Transitions»):
 *   Fermo ⇄ Cammina → Scatta → Recupero scatto → Fermo/Cammina; qualunque stato → Colpito
 *   (danno) → Fermo/Cammina alla fine di `t_invuln`; maschere = 0 → Morto.
 * Storie 007 (movimento, mura, scatto) e 008 (maschere, danno, invulnerabilità, spinta, morte).
 *
 * Tutti i numeri vengono dalle statistiche nominate di `ferruccio.json` lette attraverso
 * `modificatori.valore()` (ADR-0002: il valore è già quello effettivo dopo i doni, con clamp).
 * I tempi dei GDD (ms) si convertono in tick con `tempo.ticksDaMs` nel momento in cui il timer
 * parte, così un dono che cambia una durata vale dal timer successivo.
 *
 * Verso l'alto solo eventi: `ferruccio.scatto`, `ferruccio.scatto_vuoto`, `ferruccio.danno`,
 * `ferruccio.morto` con payload {x, y, direzione, danno?}. Il combattimento (livello Feature)
 * si aggancia con `collegaVincoli` (può scattare? quanto rallenta il passo?) senza che questo
 * modulo lo importi.
 */

import { muoviCerchio, separazioneCerchi } from '../mondo/fisica.js';

/** Stati del corpo. */
export const STATI_CORPO = Object.freeze(['fermo', 'cammina', 'scatta', 'recupero_scatto', 'colpito', 'morto']);

/**
 * Tabella esplicita delle transizioni (da → verso ammessi). Il danno porta a `colpito` da ogni
 * stato non invulnerabile; `morto` è terminale per il gioco: ne esce solo `risveglia()` (storia 030).
 */
export const TRANSIZIONI_CORPO = Object.freeze({
  fermo: Object.freeze(['cammina', 'scatta', 'colpito', 'morto']),
  cammina: Object.freeze(['fermo', 'scatta', 'colpito', 'morto']),
  scatta: Object.freeze(['recupero_scatto', 'morto']),
  recupero_scatto: Object.freeze(['fermo', 'cammina', 'colpito', 'morto']),
  colpito: Object.freeze(['fermo', 'cammina', 'scatta', 'colpito', 'morto']),
  morto: Object.freeze([]),
});

/**
 * @typedef {object} Vincoli
 * @property {() => boolean} [puoScattare] vero se il combattimento permette lo scatto ora
 * @property {() => number} [modVelocita] moltiplicatore del passo imposto dal combattimento (0..1)
 */

/**
 * Crea Ferruccio.
 * @param {{
 *   modificatori: { valore: (nome: string) => number },
 *   tempo: { ticksDaMs: (ms: number) => number },
 *   eventi: { emit: (nome: string, payload?: unknown) => unknown },
 *   input: { premuto: (a: string) => boolean, tenuto: (a: string) => boolean, direzione: () => { x: number, y: number } },
 *   campo: import('../mondo/fisica.js').Campo,
 *   x: number, y: number, verso?: number
 * }} opzioni
 */
export function creaFerruccio({ modificatori, tempo, eventi, input, campo, x, y, verso = 1 }) {
  if (!modificatori || !tempo || !eventi || !input || !campo) throw new TypeError('creaFerruccio: dipendenze mancanti');
  const val = (nome) => modificatori.valore(`ferruccio.${nome}`);
  const ticks = (nome) => tempo.ticksDaMs(val(nome));

  const corpo = {
    x,
    y,
    verso: verso < 0 ? -1 : 1,
    stato: 'fermo',
    vx: 0,
    vy: 0,
    maschere: val('maschere_max'),
    cariche: val('cariche_scatto'),
    ricaricaTicks: 0,
    invulnTicks: 0,
    // scatto
    scattoTicks: 0,
    scattoDir: { x: 1, y: 0 },
    scattoPasso: 0,
    scattoFermato: false,
    recuperoTicks: 0,
    // spinta
    spintaTicks: 0,
    spintaTotale: 0,
    spintaDir: { x: 0, y: 0 },
  };

  /** @type {Required<Vincoli>} */
  const vincoli = { puoScattare: () => true, modVelocita: () => 1 };

  function vai(nuovo) {
    if (corpo.stato === nuovo) return;
    if (!TRANSIZIONI_CORPO[corpo.stato].includes(nuovo)) {
      throw new RangeError(`ferruccio: transizione non ammessa ${corpo.stato} -> ${nuovo}`);
    }
    corpo.stato = nuovo;
  }

  function invulnerabile() {
    return corpo.stato === 'scatta' || corpo.invulnTicks > 0;
  }

  function inSpinta() {
    return corpo.spintaTicks > 0;
  }

  /** Vero se il corpo accetta azioni volontarie (scatto, attacco, parata). */
  function corpoLibero() {
    return corpo.stato === 'fermo' || corpo.stato === 'cammina' || (corpo.stato === 'colpito' && !inSpinta());
  }

  /** Direzione di mira (combattimento.md regola 1): input se presente, altrimenti il verso. */
  /** Azioni di sparo (storia P04): la freccia tenuta vince sulla direzione del passo. */
  const MIRA_FRECCE = Object.freeze([['spara_destra', 1, 0], ['spara_sinistra', -1, 0], ['spara_giu', 0, 1], ['spara_su', 0, -1]]);

  function direzioneMira() {
    for (const [azione, x, y] of MIRA_FRECCE) if (input.tenuto(azione)) return { x, y };
    const d = input.direzione();
    if (d.x !== 0 || d.y !== 0) return d;
    return { x: corpo.verso, y: 0 };
  }

  function emetti(nome, extra = {}) {
    eventi.emit(nome, { x: corpo.x, y: corpo.y, direzione: { x: corpo.verso, y: 0 }, ...extra });
  }

  /**
   * Avvia lo scatto (regola 4). Chi chiama ha già verificato stato e cariche.
   * @param {{ x: number, y: number }} dir direzione normalizzata
   */
  function avviaScatto(dir) {
    corpo.cariche -= 1;
    if (corpo.ricaricaTicks === 0) corpo.ricaricaTicks = ticks('t_ricarica_scatto');
    const n = ticks('t_scatto');
    corpo.scattoTicks = n;
    corpo.scattoDir = { x: dir.x, y: dir.y };
    corpo.scattoPasso = val('d_scatto') / n;
    corpo.scattoFermato = false;
    corpo.vx = 0;
    corpo.vy = 0;
    if (dir.x !== 0) corpo.verso = dir.x > 0 ? 1 : -1;
    vai('scatta');
    emetti('ferruccio.scatto', { direzione: { x: dir.x, y: dir.y } });
  }

  /** Ricarica delle cariche di scatto, una alla volta ogni `t_ricarica_scatto`. */
  function tickRicarica() {
    const max = val('cariche_scatto');
    if (corpo.cariche >= max) {
      corpo.ricaricaTicks = 0;
      return;
    }
    if (corpo.ricaricaTicks === 0) corpo.ricaricaTicks = ticks('t_ricarica_scatto');
    corpo.ricaricaTicks -= 1;
    if (corpo.ricaricaTicks === 0) {
      corpo.cariche += 1;
      if (corpo.cariche < max) corpo.ricaricaTicks = ticks('t_ricarica_scatto');
    }
  }

  /**
   * Passo di camminata con accelerazione lineare `v_eff / t_accel` (regola 2) e spinta residua
   * (regola 6). Risolve le mura con scivolamento.
   * @param {number} dt secondi
   */
  function tickCammina(dt) {
    const vEff = val('v_base');
    const r = val('r_corpo');
    let dir = input.direzione();
    let mod = vincoli.modVelocita();
    if (inSpinta()) mod *= val('mod_input_spinta');
    const target = { x: dir.x * vEff * mod, y: dir.y * vEff * mod };
    const vAttuale = Math.hypot(corpo.vx, corpo.vy);
    const vTarget = Math.hypot(target.x, target.y);
    const tRampa = (vTarget > vAttuale ? val('t_accel') : val('t_decel')) / 1000;
    const dx = target.x - corpo.vx;
    const dy = target.y - corpo.vy;
    const delta = Math.hypot(dx, dy);
    if (tRampa <= 0 || delta === 0) {
      corpo.vx = target.x;
      corpo.vy = target.y;
    } else {
      const passoMax = (vEff / tRampa) * dt;
      if (delta <= passoMax) {
        corpo.vx = target.x;
        corpo.vy = target.y;
      } else {
        corpo.vx += (dx / delta) * passoMax;
        corpo.vy += (dy / delta) * passoMax;
      }
    }
    let sx = 0;
    let sy = 0;
    if (inSpinta()) {
      const v = val('v_spinta') * (corpo.spintaTicks / corpo.spintaTotale);
      sx = corpo.spintaDir.x * v;
      sy = corpo.spintaDir.y * v;
      corpo.spintaTicks -= 1;
    }
    const esito = muoviCerchio(campo, corpo.x, corpo.y, r, (corpo.vx + sx) * dt, (corpo.vy + sy) * dt);
    corpo.x = esito.x;
    corpo.y = esito.y;
    if (esito.urto && inSpinta()) corpo.spintaTicks = 0; // la spinta si annulla al contatto (edge case)
    if (esito.urtoX) corpo.vx = 0;
    if (esito.urtoY) corpo.vy = 0;
    if (dir.x !== 0) corpo.verso = dir.x > 0 ? 1 : -1;
    if (corpo.stato === 'fermo' || corpo.stato === 'cammina') {
      vai(dir.x !== 0 || dir.y !== 0 ? 'cammina' : 'fermo');
    }
  }

  /**
   * Avanza di un passo fisso.
   * @param {number} dt secondi
   */
  function tick(dt) {
    if (corpo.stato === 'morto') return;
    tickRicarica();
    if (corpo.invulnTicks > 0) {
      corpo.invulnTicks -= 1;
      if (corpo.invulnTicks === 0 && corpo.stato === 'colpito') {
        corpo.spintaTicks = 0;
        vai('fermo');
      }
    }

    // Scatto: priorità scatto > movimento (danno arriva fuori dal tick, da subisciDanno).
    if (input.premuto('scatto') && corpoLibero()) {
      if (corpo.cariche >= 1 && vincoli.puoScattare()) {
        const d = input.direzione();
        avviaScatto(d.x !== 0 || d.y !== 0 ? d : { x: corpo.verso, y: 0 });
      } else if (corpo.cariche < 1) {
        emetti('ferruccio.scatto_vuoto');
      }
    }

    switch (corpo.stato) {
      case 'scatta': {
        if (!corpo.scattoFermato) {
          const esito = muoviCerchio(campo, corpo.x, corpo.y, val('r_corpo'),
            corpo.scattoDir.x * corpo.scattoPasso, corpo.scattoDir.y * corpo.scattoPasso);
          corpo.x = esito.x;
          corpo.y = esito.y;
          if (esito.urto) corpo.scattoFermato = true;
        }
        corpo.scattoTicks -= 1;
        if (corpo.scattoTicks === 0) {
          corpo.recuperoTicks = ticks('t_recupero_scatto');
          vai('recupero_scatto');
        }
        break;
      }
      case 'recupero_scatto': {
        tickCammina(dt);
        corpo.recuperoTicks -= 1;
        if (corpo.recuperoTicks === 0) {
          const d = input.direzione();
          vai(d.x !== 0 || d.y !== 0 ? 'cammina' : 'fermo');
        }
        break;
      }
      default:
        tickCammina(dt);
    }
  }

  /**
   * Un Colpo nemico o un pericolo raggiunge Ferruccio (regole 5, 6, 8; formula `danno_subito`).
   * Il contatto passivo NON passa da qui (regola 5): chi chiama è una hitbox di attacco.
   * @param {{ pesante?: boolean, danno?: number, x?: number, y?: number }} attacco posizione dell'attaccante
   * @returns {{ applicato: boolean, danno: number, maschere: number }}
   */
  function subisciDanno(attacco = {}) {
    if (corpo.stato === 'morto' || invulnerabile()) return { applicato: false, danno: 0, maschere: corpo.maschere };
    let dannoColpo = typeof attacco.danno === 'number'
      ? attacco.danno
      : val(attacco.pesante ? 'danno_subito.pesante' : 'danno_subito.comune');
    const armatura = Math.floor(val('armatura'));
    if (armatura > 0) dannoColpo = Math.max(1, dannoColpo - armatura);
    const applicato = Math.min(dannoColpo, corpo.maschere);
    corpo.maschere -= applicato;

    let dx = corpo.x - (attacco.x ?? corpo.x);
    let dy = corpo.y - (attacco.y ?? corpo.y);
    const d = Math.hypot(dx, dy);
    if (d === 0) {
      dx = -corpo.verso;
      dy = 0;
    } else {
      dx /= d;
      dy /= d;
    }
    corpo.invulnTicks = ticks('t_invuln');
    corpo.spintaTotale = ticks('t_spinta');
    corpo.spintaTicks = corpo.spintaTotale;
    corpo.spintaDir = { x: dx, y: dy };
    corpo.vx = 0;
    corpo.vy = 0;
    corpo.scattoTicks = 0;
    corpo.recuperoTicks = 0;
    vai('colpito');
    emetti('ferruccio.danno', { direzione: { x: dx, y: dy }, danno: applicato });
    if (corpo.maschere <= 0) {
      corpo.maschere = 0;
      vai('morto');
      emetti('ferruccio.morto', { direzione: { x: dx, y: dy } });
    }
    return { applicato: true, danno: applicato, maschere: corpo.maschere };
  }

  /**
   * Restituisce cariche di scatto (parata riuscita, combattimento.md regola 5).
   * @param {number} [n=1]
   */
  function ricaricaScatto(n = 1) {
    corpo.cariche = Math.min(val('cariche_scatto'), corpo.cariche + n);
  }

  /**
   * Spostamento imposto dall'esterno (affondo): risolve le mura e riporta l'urto.
   * @param {number} dx
   * @param {number} dy
   */
  function spostaForzato(dx, dy) {
    const esito = muoviCerchio(campo, corpo.x, corpo.y, val('r_corpo'), dx, dy);
    corpo.x = esito.x;
    corpo.y = esito.y;
    return esito;
  }

  /**
   * Contatto passivo (regola 6): se i cerchi si sovrappongono Ferruccio è portato fuori dal
   * corpo dato, senza danno. Restituisce vero se c'è stata separazione.
   * @param {{ x: number, y: number, r: number }} cerchio
   */
  function separaDa(cerchio) {
    if (corpo.stato === 'scatta' || corpo.stato === 'morto') return false; // lo scatto attraversa
    const me = { x: corpo.x, y: corpo.y, r: val('r_corpo') };
    const s = separazioneCerchi(me, cerchio, -corpo.verso);
    if (!s) return false;
    const esito = muoviCerchio(campo, corpo.x, corpo.y, me.r, s.x, s.y);
    corpo.x = esito.x;
    corpo.y = esito.y;
    return true;
  }

  /**
   * Collega i vincoli del combattimento (iniezione, non import: dipendenze verso il basso).
   * @param {Vincoli} nuovi
   */
  function collegaVincoli(nuovi) {
    if (typeof nuovi?.puoScattare === 'function') vincoli.puoScattare = nuovi.puoScattare;
    if (typeof nuovi?.modVelocita === 'function') vincoli.modVelocita = nuovi.modVelocita;
  }

  /**
   * Imposta le maschere correnti (debug e test), entro [0, maschere_max].
   * @param {number} n
   */
  function impostaMaschere(n) {
    corpo.maschere = Math.max(0, Math.min(val('maschere_max'), Math.floor(n)));
  }

  /**
   * Risveglio dopo la morte (storia 030, GDD stato-narrativo regola 8): il corpo torna `fermo` con
   * tutte le maschere e le cariche, senza invulnerabilità, scatto né spinta. È l'unica uscita da
   * `morto` e non passa da `vai`: la tabella delle transizioni lo tiene terminale per il gioco.
   * Emette `ferruccio.risveglio`.
   */
  function risveglia() {
    corpo.stato = 'fermo';
    corpo.maschere = val('maschere_max');
    corpo.cariche = val('cariche_scatto');
    corpo.ricaricaTicks = 0;
    corpo.invulnTicks = 0;
    corpo.scattoTicks = 0;
    corpo.recuperoTicks = 0;
    corpo.spintaTicks = 0;
    corpo.spintaTotale = 0;
    corpo.vx = 0;
    corpo.vy = 0;
    emetti('ferruccio.risveglio', { maschere: corpo.maschere });
  }

  /**
   * Teletrasporto (debug e test).
   * @param {number} nx
   * @param {number} ny
   */
  function posiziona(nx, ny) {
    corpo.x = nx;
    corpo.y = ny;
    corpo.vx = 0;
    corpo.vy = 0;
  }

  return {
    get x() { return corpo.x; },
    get y() { return corpo.y; },
    get r() { return val('r_corpo'); },
    get verso() { return corpo.verso; },
    get stato() { return corpo.stato; },
    get maschere() { return corpo.maschere; },
    get cariche() { return corpo.cariche; },
    get velocita() { return { x: corpo.vx, y: corpo.vy }; },
    get ricaricaTicks() { return corpo.ricaricaTicks; },
    invulnerabile,
    inSpinta,
    corpoLibero,
    direzioneMira,
    tick,
    subisciDanno,
    ricaricaScatto,
    spostaForzato,
    separaDa,
    collegaVincoli,
    impostaMaschere,
    risveglia,
    posiziona,
  };
}
