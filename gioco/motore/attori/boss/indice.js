/**
 * motore/attori/boss/indice.js — I pattern dei boss per nome (campo `pattern` di `boss.json`, storia P06).
 * La radice di composizione sceglie la factory dal nome del pattern del boss estratto e la passa alla fabbrica dei
 * nemici (`attori/nemico.js`, opzione `pattern`).
 */

import { creaPatternReGatto, PATTERN_MONSTRO } from './re-gatto.js';
import { creaPatternCapitano, PATTERN_CHUB } from './capitano-guardia.js';
import { creaPatternRegina, PATTERN_DUKE } from './regina-vespa.js';
import { creaPatternColosso, PATTERN_GURDY } from './colosso-statua.js';
import { creaPatternMaestro, PATTERN_SCISSOR } from './maestro-fucina.js';
import { creaPatternDonnaLuciana, PATTERN_QUEEN } from './donna-luciana.js';

/** Nome del pattern → factory `(contesto) => pattern`. */
export const PATTERN_BOSS = Object.freeze({
  [PATTERN_MONSTRO]: creaPatternReGatto,
  [PATTERN_CHUB]: creaPatternCapitano,
  [PATTERN_DUKE]: creaPatternRegina,
  [PATTERN_GURDY]: creaPatternColosso,
  [PATTERN_SCISSOR]: creaPatternMaestro,
  [PATTERN_QUEEN]: creaPatternDonnaLuciana,
});

/** La factory del pattern `nome`, o null se sconosciuto (il boss resterebbe un nemico comune ingrandito). */
export function patternPerNome(nome) {
  return PATTERN_BOSS[nome] ?? null;
}
