/**
 * motore/attori/boss/base.js — Attrezzi comuni dei pattern dei boss (storia P06).
 *
 * Un pattern è un oggetto `{ tick(dt), stato, lampoAcceso, inTelegrafo, direzione, quota, salve, nome }` creato da
 * una factory `(contesto) => pattern` che la fabbrica dei nemici (`attori/nemico.js`, opzione `pattern`) chiama e fa
 * girare al posto dell'IA base: il nemico resta un nemico (vita, colpi, stordimento della parata con
 * `t_stordito_boss`/`t_immunita_boss`, morte e bottino), il pattern decide solo movimento e attacchi.
 *
 * Il contesto `contesto` che la fabbrica fornisce: `corpo` {x, y, r} (lettura), `muovi(dx, dy, volo?)` → urto, `bersaglio()`
 * (Ferruccio o null), `campo`, `rng` (derivato dal seme: mai casualità nativa), `ticks(ms)`, `B(chiave)` (la scheda
 * del boss in `nemici.json › boss.<id>`), `comune(chiave)` (`nemici.json › boss.comuni`), `lancia(dir, fattore, origine?)`
 * (un proiettile nemico del boss), `genera(archetipo, x, y)` (evoca un nemico comune nella stanza), `altri()`,
 * `emit(nome, payload)`, `vita()`, `vitaMax()`, `furia()` (vita sotto `soglia_furia`), `moltVel`, `dentroCampo(x, y, margine)`.
 *
 * Il telegrafo è SOLO sul corpo (regola dell'autore 2026-11-08): la macchina passa per `anticipo` (postura) e `lampo`
 * (occhi rossi) prima di ogni `colpo`, con i tempi di `boss.comuni`; nessun segno a terra.
 */

const TAU = Math.PI * 2;
/** Fasi di un pattern: gli stessi nomi degli stati dell'IA base, così renderer e debug li leggono allo stesso modo. */
export const FASI_BOSS = Object.freeze(['insegue', 'anticipo', 'lampo', 'colpo', 'recupero']);
const FASI_TELEGRAFO = Object.freeze(['anticipo', 'lampo', 'colpo']);

/** Gradi → radianti. */
export const rad = (gradi) => (gradi * Math.PI) / 180;

/**
 * La macchina a fasi di un boss: insegue (cooldown) → anticipo → lampo → colpo (l'azione) → recupero → insegue.
 * `tick(dt, insegui)` ritorna true quando il boss è pronto ad attaccare (fase `insegue` a cooldown finito).
 * @param {object} contesto contesto del pattern
 */
export function creaMacchinaBoss(contesto) {
  const C = (k) => contesto.comune(k);
  const s = { fase: 'insegue', ticks: 0, cd: Math.max(0, contesto.ticks(C('t_cd_iniziale'))), salve: 0, azione: null };

  /**
   * Avvia un attacco: `azione` = { inizio?(), tick?(t, dt) → true a fine colpo, fine?(), cdMs }.
   * Falso se il boss non è in `insegue`.
   */
  function attacca(azione) {
    if (s.fase !== 'insegue') return false;
    s.fase = 'anticipo';
    s.ticks = 0;
    s.azione = azione;
    contesto.emit('boss.anticipo', { x: contesto.corpo.x, y: contesto.corpo.y, salve: s.salve });
    return true;
  }

  function tick(dt, insegui) {
    s.ticks += 1;
    switch (s.fase) {
      case 'insegue':
        if (s.cd > 0) s.cd -= 1;
        insegui?.(dt);
        return s.cd <= 0;
      case 'anticipo':
        if (s.ticks >= contesto.ticks(C('t_anticipo'))) { s.fase = 'lampo'; s.ticks = 0; }
        return false;
      case 'lampo':
        if (s.ticks >= contesto.ticks(C('t_lampo'))) {
          s.fase = 'colpo';
          s.ticks = 0;
          s.salve += 1;
          s.azione?.inizio?.();
        }
        return false;
      case 'colpo': {
        const fine = s.azione?.tick ? s.azione.tick(s.ticks, dt) : true;
        if (fine) {
          s.azione?.fine?.();
          s.fase = 'recupero';
          s.ticks = 0;
        }
        return false;
      }
      case 'recupero':
        if (s.ticks >= contesto.ticks(C('t_recupero'))) {
          s.fase = 'insegue';
          s.ticks = 0;
          s.cd = Math.max(0, contesto.ticks(s.azione?.cdMs ?? 0));
          s.azione = null;
        }
        return false;
      default:
        return false;
    }
  }

  return {
    tick,
    attacca,
    get fase() { return s.fase; },
    get salve() { return s.salve; },
    get inTelegrafo() { return FASI_TELEGRAFO.includes(s.fase); },
    get lampoAcceso() { return s.fase === 'lampo'; },
    get cooldown() { return s.cd; },
  };
}

/** Vettore verso Ferruccio (null senza bersaglio): {x, y} unitario, `d` distanza, `angolo`. */
export function versoBersaglio(contesto) {
  const b = contesto.bersaglio();
  if (!b) return null;
  const dx = b.x - contesto.corpo.x;
  const dy = b.y - contesto.corpo.y;
  const d = Math.hypot(dx, dy);
  const angolo = Math.atan2(dy, dx);
  return d > 0 ? { x: dx / d, y: dy / d, d, angolo } : { x: Math.cos(angolo), y: 0, d: 0, angolo };
}

/** Cooldown in ms di una chiave della scheda, nella variante `_furia` sotto la soglia. */
export function cdMs(contesto, chiave) {
  return contesto.furia() ? contesto.B(`${chiave}_furia`) : contesto.B(chiave);
}

/**
 * Insegue Ferruccio a `velocita × fattore_insegue × moltVel` px/s; ritorna la direzione del passo (per il verso della sagoma).
 * @param {object} contesto
 * @param {number} dt secondi
 */
export function insegui(contesto, dt) {
  const v = versoBersaglio(contesto);
  if (!v || v.d <= 0) return null;
  const passo = contesto.B('velocita') * contesto.B('fattore_insegue') * contesto.moltVel * dt;
  contesto.muovi(v.x * passo, v.y * passo);
  return v;
}

/**
 * Anello di `n` proiettili a passo uniforme ruotato di `rotazione` radianti (Teatro: `TAU·k/n + fase`).
 * @returns {number} proiettili lanciati davvero
 */
export function anello(contesto, n, fattore, rotazione = 0, origine = null) {
  let lanciati = 0;
  const q = Math.max(0, Math.round(n));
  for (let k = 0; k < q; k++) {
    const a = (TAU * k) / q + rotazione;
    if (contesto.lancia({ x: Math.cos(a), y: Math.sin(a) }, fattore, origine)) lanciati += 1;
  }
  return lanciati;
}

/**
 * Ventaglio di `n` proiettili centrato su `angolo`, a `passo` radianti l'uno dall'altro (Teatro: `ang + k·0,14`).
 * @returns {number} proiettili lanciati davvero
 */
export function ventaglio(contesto, angolo, n, passo, fattore, origine = null) {
  let lanciati = 0;
  const q = Math.max(1, Math.round(n));
  const meta = (q - 1) / 2;
  for (let k = 0; k < q; k++) {
    const a = angolo + (k - meta) * passo;
    if (contesto.lancia({ x: Math.cos(a), y: Math.sin(a) }, fattore, origine)) lanciati += 1;
  }
  return lanciati;
}

/**
 * Costruisce l'oggetto pattern a partire dalla macchina e dallo stato del modulo (lettura uniforme per la fabbrica).
 * `extra` aggiunge metodi propri del pattern (es. `mani` di Donna Luciana) senza perdere i getter (mai spargere l'oggetto con `...`).
 * @param {{ nome: string, macchina: object, tick: (dt: number) => void, direzione: () => {x: number, y: number}, quota?: () => number, extra?: object }} o
 */
export function esponiPattern({ nome, macchina, tick, direzione, quota = () => 0, extra = {} }) {
  return {
    ...extra,
    nome,
    tick,
    get stato() { return macchina.fase; },
    get lampoAcceso() { return macchina.lampoAcceso; },
    get inTelegrafo() { return macchina.inTelegrafo; },
    get direzione() { return direzione(); },
    get quota() { return quota(); },
    get salve() { return macchina.salve; },
    get cooldown() { return macchina.cooldown; },
  };
}
