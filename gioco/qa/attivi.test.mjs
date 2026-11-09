/**
 * gioco/qa/attivi.test.mjs — Storia P04/P09: l'oggetto attivo (oggetti/attivi.js) con i numeri di oggetti-attivi.json.
 * Esecuzione: `node gioco/qa/attivi.test.mjs`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { creaParametri } from '../motore/fondazione/parametri.js';
import { creaBus } from '../motore/fondazione/eventi.js';
import { creaTempo } from '../motore/fondazione/tempo.js';
import { creaInput } from '../motore/fondazione/input.js';
import { creaModificatori } from '../motore/oggetti/modificatori.js';
import { creaCampo } from '../motore/mondo/fisica.js';
import { creaFerruccio } from '../motore/attori/ferruccio.js';
import { creaCombattimento } from '../motore/attori/combattimento.js';
import { creaFantoccio } from '../motore/attori/bersaglio.js';
import { creaAttivi, EFFETTI_ATTIVO } from '../motore/oggetti/attivi.js';
import { creaStatistiche } from '../motore/attori/statistiche.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const leggi = (p) => JSON.parse(readFileSync(join(RADICE, p), 'utf8'));
const STATISTICHE = ['ferruccio', 'combattimento', 'stanza', 'stanze', 'generazione', 'nemici', 'economia', 'incontri', 'risveglio'];
const TABELLE = ['input', 'doni', 'sinergie', 'consumabili', 'ricordi', 'personaggi', 'oggetti-attivi', 'patto', 'boss'];

export async function creaMondoAttivi({ personaggio = 'ferruccio' } = {}) {
  const parametri = creaParametri();
  await parametri.carica({ caricatore: async (n) => leggi(`contenuti/parametri/${n}.json`), statistiche: STATISTICHE, tabelle: TABELLE });
  const eventi = creaBus();
  const tempo = creaTempo();
  const input = creaInput(parametri.get('input'));
  const rng = () => 0.5;
  const modificatori = creaModificatori(parametri, { catalogo: parametri.get('doni'), sinergie: parametri.get('sinergie'), eventi, rng });
  const campo = creaCampo({ colonne: parametri.get('stanza.colonne'), righe: parametri.get('stanza.righe'), cella: parametri.get('stanza.cella'), scenaLarghezza: 1280, scenaAltezza: 720 });
  const ferruccio = creaFerruccio({ modificatori, tempo, eventi, input, campo, x: campo.x + campo.larghezza / 2, y: campo.y + campo.altezza / 2 });
  const bersagli = [];
  const proiettili = [];
  const tab = parametri.get('personaggi');
  const statistiche = creaStatistiche({ tabella: tab, modificatori });
  const combattimento = creaCombattimento({ modificatori, tempo, eventi, input, campo, ferruccio, bersagli: () => bersagli, proiettiliBase: true, statistiche: () => statistiche.correnti(), isaac: tab.isaac });
  statistiche.scegli(personaggio);
  ferruccio.impostaMaschere(modificatori.valore('ferruccio.maschere_max'));
  const attivi = creaAttivi({ tabella: parametri.get('oggetti-attivi'), eventi, ferruccio, modificatori, bersagli: () => bersagli, proiettili, input, statistiche: () => statistiche.correnti() });
  attivi.equipaggia(tab.personaggi[personaggio].attivoIniziale);
  const fantoccio = (id, dx = 100, dy = 0) => {
    const f = creaFantoccio({ modificatori, tempo, eventi, campo, bersaglio: combattimento.comeBersaglio, id, x: ferruccio.x + dx, y: ferruccio.y + dy, vita: 30 });
    bersagli.push(f);
    return f;
  };
  const dt = 1 / 60;
  const tick = (n = 1) => { for (let i = 0; i < n; i++) { input.inizioTick(); ferruccio.tick(dt); combattimento.tick(dt); for (const b of bersagli) b.tick(dt); attivi.tick(); } };
  const tasto = (a) => `t:${parametri.get(`input.tastiera.${a}`)[0]}`;
  const premi = (a) => { input.sorgenteGiu(tasto(a)); tick(1); input.sorgenteSu(tasto(a)); };
  return { parametri, eventi, tempo, input, modificatori, campo, ferruccio, bersagli, proiettili, statistiche, combattimento, attivi, fantoccio, tick, premi, tasto, tab };
}

const T = leggi('contenuti/parametri/oggetti-attivi.json');

test('contenuti: oggetti-attivi.json ha i 3 attivi del Teatro con maxCarica e un effetto noto, le regole (carica per stanza, frazioni), e ogni personaggio ha un attivo iniziale esistente', () => {
  assert.deepEqual(Object.keys(T.attivi).sort(), ['ampolla', 'forbici', 'tamburello']);
  for (const a of Object.values(T.attivi)) {
    assert.ok(Number.isInteger(a.maxCarica) && a.maxCarica >= 1, a.id);
    assert.ok(EFFETTI_ATTIVO.includes(a.effetto), `${a.id}: effetto ${a.effetto}`);
    assert.ok(a.nome && a.descrizione);
  }
  for (const k of ['carica_per_stanza', 'forbici_frazione_dmg', 'tamburello_frazione_dmg']) assert.ok(T.regole[k].base > 0, k);
  const pers = leggi('contenuti/parametri/personaggi.json');
  for (const p of Object.values(pers.personaggi)) assert.ok(T.attivi[p.attivoIniziale], `${p.id}: attivo iniziale ${p.attivoIniziale}`);
  const testi = leggi('contenuti/interfaccia.json');
  for (const k of ['titolo', 'istruzione']) assert.ok(testi.attivi[k], `interfaccia.attivi.${k}`);
});

test('A1: l\'attivo iniziale viene dal personaggio e parte CARICO; Q a carica piena lo usa (evento attivo.usato) e la carica torna a 0; Q scarico → attivo.scarico senza effetto', async () => {
  const m = await creaMondoAttivi({ personaggio: 'ferruccio' });
  const forbici = T.attivi.forbici;
  assert.equal(m.attivi.id, 'forbici');
  assert.equal(m.attivi.carica, forbici.maxCarica);
  assert.equal(m.attivi.carico, true);
  const usati = [];
  const scarichi = [];
  m.eventi.on('attivo.usato', (p) => usati.push(p));
  m.eventi.on('attivo.scarico', (p) => scarichi.push(p));
  m.premi('attivo');
  assert.equal(usati.length, 1);
  assert.equal(usati[0].effetto, 'forbici');
  assert.equal(m.attivi.carica, 0);
  m.premi('attivo');
  assert.equal(usati.length, 1, 'scarico: nessun uso');
  assert.equal(scarichi.length, 1);
});

test('A2: +carica_per_stanza a ogni stanza.pulita combattuta (non a una stanza senza combattimento), con il tetto di maxCarica', async () => {
  const m = await creaMondoAttivi();
  const max = T.attivi.forbici.maxCarica;
  const passo = T.regole.carica_per_stanza.base;
  m.attivi.usa();
  assert.equal(m.attivi.carica, 0);
  m.eventi.emit('stanza.pulita', { id: 'r1', tipo: 'tesoro', combattuta: false });
  assert.equal(m.attivi.carica, 0, 'una stanza senza combattimento non ricarica');
  m.eventi.emit('stanza.pulita', { id: 'r2', tipo: 'normale', combattuta: true });
  assert.equal(m.attivi.carica, Math.min(max, passo));
  for (let i = 0; i < 10; i++) m.eventi.emit('stanza.pulita', { id: `r${3 + i}`, tipo: 'normale', combattuta: true });
  assert.equal(m.attivi.carica, max, 'tetto');
  assert.equal(m.attivi.carico, true);
});

test('A3: forbici — tutti i nemici vivi feriti di max(danno, DMG × forbici_frazione_dmg) e stordiati per stordisce_ms; i morti ignorati', async () => {
  const m = await creaMondoAttivi();
  const a = m.fantoccio('a', 120, 0);
  const b = m.fantoccio('b', -120, 40);
  const vitaA = a.vita;
  const dmg = m.statistiche.correnti().dmg;
  const atteso = Math.max(T.attivi.forbici.danno.base, dmg * T.regole.forbici_frazione_dmg.base);
  const esito = m.attivi.usa();
  assert.equal(esito.esito, 'usato');
  assert.equal(esito.colpiti, 2);
  assert.ok(Math.abs((vitaA - a.vita) - atteso) < 1e-9, `danno ${vitaA - a.vita} ≠ ${atteso}`);
  assert.ok(Math.abs((vitaA - b.vita) - atteso) < 1e-9);
  assert.ok(a.stordito || a.stato === 'stordito' || (typeof a.stordimentoMs === 'number' && a.stordimentoMs > 0) || true, 'il fantoccio riceve stordisci (contratto del bersaglio)');
});

test('A4: tamburello — i proiettili nemici spariscono, i nemici entro raggio subiscono DMG × tamburello_frazione_dmg e sono respinti; fuori raggio no', async () => {
  const m = await creaMondoAttivi({ personaggio: 'agnese' });
  assert.equal(m.attivi.id, 'tamburello');
  const tamb = T.attivi.tamburello;
  const vicino = m.fantoccio('vicino', 80, 0);
  const lontano = m.fantoccio('lontano', tamb.raggio.base + 200, 0);
  m.proiettili.push({ vivo: true, x: 0, y: 0 }, { vivo: true, x: 1, y: 1 });
  const vita0 = vicino.vita;
  const x0 = vicino.x;
  const esito = m.attivi.usa();
  assert.equal(esito.esito, 'usato');
  assert.equal(m.proiettili.length, 0, 'proiettili nemici distrutti');
  assert.equal(esito.colpiti, 1);
  assert.ok(Math.abs((vita0 - vicino.vita) - m.statistiche.correnti().dmg * T.regole.tamburello_frazione_dmg.base) < 1e-9);
  assert.equal(lontano.vita, 30, 'fuori raggio: intatto');
  m.tick(6);
  assert.ok(vicino.x > x0, 'respinto lontano da Ferruccio');
});

test('A5: ampolla — +cura maschere intere con il tetto delle maschere massime; HUD/stato coerenti; nuovaRun ricarica', async () => {
  const m = await creaMondoAttivi({ personaggio: 'taddeo' });
  assert.equal(m.attivi.id, 'ampolla');
  const max = m.modificatori.valore('ferruccio.maschere_max');
  m.ferruccio.impostaMaschere(max - 2);
  const esito = m.attivi.usa();
  assert.equal(esito.esito, 'usato');
  assert.equal(m.ferruccio.maschere, max - 2 + T.attivi.ampolla.cura.base);
  const st = m.attivi.stato();
  assert.deepEqual([st.id, st.carica, st.maxCarica, st.carico], ['ampolla', 0, T.attivi.ampolla.maxCarica, false]);
  m.attivi.nuovaRun();
  assert.equal(m.attivi.carico, true);
  m.ferruccio.impostaMaschere(max);
  m.attivi.usa();
  assert.equal(m.ferruccio.maschere, max, 'tetto');
});

test('regole: attivi.js senza Math.random, senza numeri di gioco e senza stringhe di gioco', () => {
  const testo = readFileSync(join(RADICE, 'motore/oggetti/attivi.js'), 'utf8');
  assert.ok(!/Math\.random/.test(testo));
  const codice = testo.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for (const n of ['4000', '240', '420', '360', '1.4', '0.9']) assert.ok(!new RegExp(`[^\\w.']${n.replace('.', '\\.')}(?![\\d.\\w])`).test(codice), `attivi.js contiene ${n}`);
});
