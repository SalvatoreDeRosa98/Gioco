/**
 * motore/attori/boss/colosso-statua.js — Il Custode di Marmo, pattern `gurdy_turret` (Teatro loop ~4556).
 *
 * Come Gurdy: **immobile** dove nasce; a ogni salva una **spirale** (anello di `n_anello` proiettili ruotato di
 * `rotazione_gradi` per salva) e, ogni `ogni_salve_bomba` salve, **genera un Bozzolo di Polvere** (archetipo `bomba`)
 * a una distanza in [d_bomba_min, d_bomba_max] in una direzione dal generatore derivato, dentro il campo, se le bombe
 * vive sono meno di `max_bombe`. Numeri in `nemici.json › boss.colosso-statua`.
 */

import { creaMacchinaBoss, cdMs, anello, esponiPattern, rad } from './base.js';

export const PATTERN_GURDY = 'gurdy_turret';
/** Archetipo generato (chiave di `nemici.archetipi`). */
export const ARCHETIPO_GENERATO = 'bomba';

/** @param {object} contesto contesto fornito dalla fabbrica dei nemici */
export function creaPatternColosso(contesto) {
  const macchina = creaMacchinaBoss(contesto);
  const B = contesto.B;
  let direzione = { x: -1, y: 0 };

  const bombeVive = () => contesto.altri().filter((a) => a && a.archetipo === ARCHETIPO_GENERATO && a.stato !== 'morto' && (a.vita ?? 1) > 0).length;

  function salva() {
    macchina.attacca({
      tick: () => {
        anello(contesto, B('n_anello'), B('v_anello'), rad(B('rotazione_gradi')) * macchina.salve);
        if (macchina.salve % Math.max(1, Math.round(B('ogni_salve_bomba'))) === 0 && bombeVive() < B('max_bombe')) {
          const a = contesto.rng() * Math.PI * 2;
          const d = B('d_bomba_min') + contesto.rng() * (B('d_bomba_max') - B('d_bomba_min'));
          const p = contesto.dentroCampo(contesto.corpo.x + Math.cos(a) * d, contesto.corpo.y + Math.sin(a) * d, B('margine'));
          contesto.genera(ARCHETIPO_GENERATO, p.x, p.y);
        }
        return true;
      },
      cdMs: cdMs(contesto, 't_cd'),
    });
  }

  function tick(dt) {
    const b = contesto.bersaglio();
    if (b && b.x !== contesto.corpo.x) direzione = { x: Math.sign(b.x - contesto.corpo.x), y: 0 };
    if (macchina.tick(dt, null)) salva();
  }

  return esponiPattern({ nome: PATTERN_GURDY, macchina, tick, direzione: () => direzione });
}
