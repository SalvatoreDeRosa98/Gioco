/**
 * gioco/qa/statistiche.test.mjs — Storia P04: statistiche alla Isaac (attori/statistiche.js) contro valori calcolati a
 * mano con le formule di `ricalcolaStatisticheIsaac` del Teatro, per i 4 personaggi e tre combinazioni di doni/patti.
 * I dati sono i JSON reali (personaggi.json, doni.json › teatro, patto.json). Esecuzione: `node gioco/qa/statistiche.test.mjs`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calcolaStatistiche, creaStatistiche, applicaAlModificatori } from '../motore/attori/statistiche.js';
import { creaParametri } from '../motore/fondazione/parametri.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const P = join(QUI, '..', 'contenuti', 'parametri');
const leggi = (n) => JSON.parse(readFileSync(join(P, `${n}.json`), 'utf8'));
const tab = leggi('personaggi');
const catalogo = leggi('doni').doni;
const patti = leggi('patto').patti;
const dono = (id) => catalogo.find((d) => d.id === id);
const vicino = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const calcola = (id, doni = [], pt = []) => calcolaStatistiche({ personaggio: tab.personaggi[id], isaac: tab.isaac, doni, patti: pt, catalogo });

test('contenuti: 4 personaggi del Teatro con hpHalf/baseDmg/baseSpd, 13 doni con il blocco teatro, 3 patti, boss.json', () => {
  assert.deepEqual(tab.ordine, ['ferruccio', 'agnese', 'taddeo', 'ombra']);
  for (const id of tab.ordine) for (const k of ['hpHalf', 'baseDmg', 'baseSpd', 'attivoIniziale', 'nome', 'titolo']) assert.ok(k in tab.personaggi[id], `${id}.${k}`);
  const conTeatro = catalogo.filter((d) => d.teatro);
  assert.equal(conTeatro.length, 13, 'CATALOGO_OGGETTI del Teatro: 6 forti + 7 base');
  assert.equal(conTeatro.filter((d) => d.teatro.tier === 'forte').length, 6);
  assert.ok(conTeatro.every((d) => d.teatro.prezzo >= 10 && d.teatro.prezzo <= 18));
  assert.ok(patti.length >= 3, 'i 3 patti del Teatro più quelli della storia P09 (raggio continuo, lacrime spettrali)');
  assert.ok(patti.every((p) => p.costoMaxHpHalf === 2));
  assert.ok(patti.every((p) => (p.mod.dmgMult ?? 1) >= 2), 'storia P09: i moltiplicatori di danno dei patti sono i più alti del gioco (≥ ×2)');
  const boss = leggi('boss');
  assert.equal(boss.pool.length, 5);
  assert.equal(boss.finale.id, 'donna-luciana');
  assert.equal(boss.passo_seme_run.base, 0x9e3779b9);
  assert.equal(boss.seme_sale.base, 131);
  assert.equal(leggi('oggetti-attivi').attivi.forbici.maxCarica, 3);
});

test('Ferruccio: dmg 3.50, tears 2.73 → cooldown 22, speed 1.0, range 340 px (170 × 2), 6 mezze maschere → 3 maschere', () => {
  const s = calcola('ferruccio');
  vicino(s.dmg, 3.5); vicino(s.tearsPerSec, 2.73); assert.equal(s.cooldownTicks, 22);
  vicino(s.speed, 1.0); assert.equal(s.range, 340); assert.equal(s.maxHpHalf, 6); assert.equal(s.maschereMax, 3);
  assert.equal(s.flags.spada, false); assert.equal(s.tipoProiettile, 'base');
});

test('Agnese: Lente (doppia, DMG ×0.80) → dmg 2.56, speed 1.25, 2 maschere, doppia', () => {
  const s = calcola('agnese');
  vicino(s.dmg, 3.2 * 0.8); vicino(s.speed, 1.25); assert.equal(s.maschereMax, 2); assert.equal(s.flags.doppia, true);
  assert.equal(s.cooldownTicks, 22);
});

test('Taddeo: Spada (+1 flat, ×1.45) → dmg 7.395, speed 0.88, 4 maschere, spada', () => {
  const s = calcola('taddeo');
  vicino(s.dmg, (4.1 + 1) * 1.45); vicino(s.speed, 0.88); assert.equal(s.maschereMax, 4); assert.equal(s.flags.spada, true);
});

test("Pulcinella d'Ombra: Anello (+0.8 up, ×1.5, perforante, cremisi) → dmg 5.1 × sqrt(1.96) × 1.5 = 10.71", () => {
  const s = calcola('ombra');
  vicino(s.dmg, 10.71); vicino(s.speed, 1.12); assert.equal(s.maschereMax, 2);
  assert.equal(s.flags.piercing, true); assert.equal(s.tipoProiettile, 'cremisi');
});

test('combo 1: Ferruccio + Mantice + Chiodo → dmg 3.5 × sqrt(2.44) = 5.467, tears 3.1575 → cooldown 19, range 380', () => {
  const s = calcola('ferruccio', [dono('mantice'), dono('lima')]);
  vicino(s.dmg, 3.5 * Math.sqrt(1.2 * 1.2 + 1)); vicino(s.tearsPerSec, 2.73 + 0.45 * 0.95);
  assert.equal(s.cooldownTicks, 19); assert.equal(s.range, 380);
});

test('combo 2: Ferruccio + Lacrima di Piombo → dmg (3.5 + 3.8) × 1.9 = 13.87, tears ×0.48 → cooldown 46, piombo, size 1.55, overflow', () => {
  const s = calcola('ferruccio', [dono('martello-da-fabbro')]);
  vicino(s.dmg, 13.87); vicino(s.tearsPerSec, 2.73 * 0.48); assert.equal(s.cooldownTicks, 46);
  assert.equal(s.tipoProiettile, 'piombo'); vicino(s.projScale, 1.55); assert.equal(s.flags.overflowPierce, true);
});

test('combo 3: Ombra + Triplo Occhio + Medaglione + Patto del Raggio → dmg 34.003, cooldown 38, hp 4 + 2 − 2 → 2 maschere, triplo e perforante', () => {
  const s = calcola('ombra', [dono('bilancino-spezzato'), dono('cuore-di-legno')], [patti.find((p) => p.id === 'patto_raggio')]);
  vicino(s.dmg, 5.1 * Math.sqrt(2.9 * 1.2 + 1) * 1.5 * 2.1, 1e-3);
  assert.equal(s.cooldownTicks, 38); assert.equal(s.maxHpHalf, 4); assert.equal(s.maschereMax, 2);
  assert.equal(s.flags.triplo, true); assert.equal(s.flags.piercing, true); vicino(s.projScale, 1.45);
});

test('clamp del Teatro: tears tra 0.85 e 7.5, speed tra 0.7 e 2.0, hp tra 2 e 24, dmg ≥ 1', () => {
  const s = calcola('agnese', [{ tearsMult: 0.01, dmgMult: 0.01, speedUp: 5, bonusMaxHp: 100 }]);
  vicino(s.tearsPerSec, 0.85); vicino(s.speed, 2.0); assert.equal(s.maxHpHalf, 24); vicino(s.dmg, 1.0);
  const t = calcola('agnese', [{ tearsUp: 100, speedUp: -5 }], [{ costoMaxHpHalf: 10 }]);
  vicino(t.tearsPerSec, 7.5); assert.equal(t.cooldownTicks, 8); vicino(t.speed, 0.7); assert.equal(t.maxHpHalf, 2);
});

test('creaStatistiche: nullo finché non si sceglie; la scelta scrive danno/v_base/maschere_max nei modificatori e il ricalcolo segue i doni', async () => {
  const parametri = creaParametri({ log: { error: () => {} } });
  await parametri.carica({ caricatore: leggi, statistiche: ['ferruccio', 'combattimento', 'stanza'], tabelle: ['doni', 'sinergie', 'personaggi'] });
  const mod = creaModificatori(parametri, { catalogo: parametri.get('doni'), sinergie: parametri.get('sinergie') });
  const st = creaStatistiche({ tabella: parametri.get('personaggi'), modificatori: mod });
  assert.equal(st.correnti(), null);
  assert.equal(mod.valore('combattimento.danno'), 1);
  st.scegli('taddeo');
  vicino(mod.valore('combattimento.danno'), 7.395);
  vicino(mod.valore('ferruccio.v_base'), 220 * 0.88);
  assert.equal(mod.valore('ferruccio.maschere_max'), 4);
  mod.aggiungiDono('lima');
  vicino(st.correnti().dmg, (4.1 * Math.sqrt(0.65 * 1.2 + 1) + 1) * 1.45);
  vicino(mod.valore('combattimento.danno'), st.correnti().dmg);
  st.scegli('agnese');
  assert.equal(mod.valore('ferruccio.maschere_max'), 2);
  st.azzera();
  assert.equal(mod.valore('combattimento.danno'), 1);
  assert.equal(st.correnti(), null);
  const via = applicaAlModificatori(mod, { dmg: 2, speed: 1.5, maschereMax: 5 });
  assert.equal(mod.valore('ferruccio.v_base'), 330);
  via();
  assert.equal(mod.valore('ferruccio.v_base'), 220);
});

test('regole del codice: statistiche.js e menu.js senza Math.random e senza numeri di gioco nelle formule (costanti dai JSON)', () => {
  const src = readFileSync(join(QUI, '..', 'motore', 'attori', 'statistiche.js'), 'utf8');
  assert.ok(!src.includes('Math.random'));
  assert.ok(!/2\.73|0\.95|7\.5|170|320/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'nessuna costante del Teatro nel codice');
  assert.ok(!readFileSync(join(QUI, '..', 'motore', 'interfaccia', 'menu.js'), 'utf8').includes('Math.random'));
});
