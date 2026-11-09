/**
 * gioco/qa/hud.test.mjs — Storia P13: l'HUD completo del Teatro in DOM (`motore/interfaccia/hud.js`) su un DOM finto.
 *
 * Esecuzione: `node gioco/qa/hud.test.mjs`. Casi: ogni elemento della scheda, della barra del boss e del dock è presente e
 * si aggiorna dallo stato (statistiche, attivo, slot, economia, maschere a metà, boss, patti); testi da interfaccia.json e
 * personaggi.json (mai scritti qui); si nasconde nel menu e a dialogo aperto; i nomi del manifesto degli sprite usati
 * dall'HUD esistono in sprite.json; regole del codice (nessun Math.random, nessun percorso di immagine scritto nel modulo).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaHud } from '../motore/interfaccia/hud.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const leggi = (p) => JSON.parse(readFileSync(join(RADICE, p), 'utf8'));
const TESTI = leggi('contenuti/interfaccia.json');
const PERSONAGGI = leggi('contenuti/parametri/personaggi.json');
const RESA = leggi('contenuti/parametri/resa.json');
const DONI = leggi('contenuti/parametri/doni.json');
const ATTIVI = leggi('contenuti/parametri/oggetti-attivi.json');
const PATTO = leggi('contenuti/parametri/patto.json');
const BOSS = leggi('contenuti/parametri/boss.json');
const SPRITE = leggi('contenuti/sprite.json');
const DECIMALI = Object.fromEntries(['dmg', 'tears', 'spd', 'range', 'vita'].map((k) => [k, RESA.hud[`decimali_${k}`].base]));
const MAX_SLOT = DONI.limiti.max_slot_doni.base;
const ID_PERSONAGGIO = PERSONAGGI.ordine?.[0] ?? Object.keys(PERSONAGGI.personaggi)[0];
const PERSONAGGIO = PERSONAGGI.personaggi[ID_PERSONAGGIO];
const DONO_CON_PNG = DONI.doni.find((d) => d.teatro?.id_teatro);
const RICORDO = DONI.doni.find((d) => d.sagoma?.tipo === 'profilo');
const LISTA_ATTIVI = Array.isArray(ATTIVI.attivi) ? ATTIVI.attivi : Object.entries(ATTIVI.attivi).map(([id, a]) => ({ id, ...a }));
const ATTIVO = LISTA_ATTIVI[0];
const MAX_CARICA = typeof ATTIVO.maxCarica === 'object' ? MAX_CARICA : ATTIVO.maxCarica; // oggetti-attivi.json: numero intero di tacche
const LISTA_PATTI = Array.isArray(PATTO.patti) ? PATTO.patti : Object.entries(PATTO.patti).map(([id, p]) => ({ id, ...p }));
const RELIQUIA = LISTA_PATTI[0];
const BOSS_POOL = BOSS.pool[0];

/** DOM finto: quanto basta all'HUD (append, className, hidden, textContent, title, dataset, style, src, ascoltatori). */
function documentoFinto() {
  const crea = (tag) => {
    const el = {
      tag, children: [], className: '', hidden: false, textContent: '', title: '', src: '', alt: '', dataset: {}, style: {}, attributi: {}, ascoltatori: {},
      append(...n) { for (const x of n) if (typeof x !== 'string') el.children.push(x); },
      setAttribute(k, v) { el.attributi[k] = v; },
      addEventListener(nome, fn) { el.ascoltatori[nome] = fn; },
    };
    return el;
  };
  return { createElement: crea };
}
/** Elementi con una classe, in profondità. */
function perClasse(el, classe) {
  const fuori = [];
  const visita = (e) => { if (e.className?.split(' ').includes(classe)) fuori.push(e); for (const c of e.children ?? []) visita(c); };
  visita(el);
  return fuori;
}

/** Mondo finto con tutte le dipendenze mutabili dal test. */
function mondo({ personaggio = ID_PERSONAGGIO } = {}) {
  const documento = documentoFinto();
  const contenitore = documento.createElement('div');
  const spriteChiesti = [];
  const st = {
    stato: 'notte', dialogo: false, id: personaggio, correnti: { dmg: 3.5, tearsPerSec: 2.75, speed: 1.1, range: 260, maxHpHalf: PERSONAGGIO.hpHalf },
    maschere: Math.ceil(PERSONAGGIO.hpHalf / 2), maschereMax: Math.ceil(PERSONAGGIO.hpHalf / 2), monete: 7, scintille: 3,
    piano: 1, ciclo: 1, pianiPerCiclo: BOSS.piani_per_ciclo.base, stanza: { tipo: 'ingresso' }, hubAttivo: false,
    attivo: { id: ATTIVO.id, nome: ATTIVO.nome, carica: MAX_CARICA, maxCarica: MAX_CARICA, carico: true },
    doni: [], patti: [], boss: null,
  };
  const hud = creaHud({
    documento, contenitore, testi: TESTI, decimali: DECIMALI,
    sprite: (nome) => { spriteChiesti.push(nome); return SPRITE.voci.some((v) => v.nome === nome) ? `src:${nome}` : null; },
    personaggi: PERSONAGGI.personaggi,
    statistiche: { get id() { return st.id; }, correnti: () => st.correnti },
    ferruccio: { get maschere() { return st.maschere; } },
    maschereMax: () => st.maschereMax,
    economia: { get monete() { return st.monete; }, get scintille() { return st.scintille; } },
    run: () => ({ piano: st.piano, ciclo: st.ciclo, pianiPerCiclo: st.pianiPerCiclo }),
    notte: () => (st.stanza ? { stanza: st.stanza } : null),
    hub: () => ({ attivo: st.hubAttivo }),
    attivi: { stato: () => (st.attivo ? { ...st.attivo } : null) },
    doni: () => ({ attivi: st.doni.slice(), max: MAX_SLOT }),
    dono: (id) => DONI.doni.find((d) => d.id === id) ?? null,
    patti: () => st.patti.slice(),
    reliquia: (id) => LISTA_PATTI.find((p) => p.id === id) ?? null,
    boss: () => st.boss,
    visibile: () => st.stato !== 'menu',
    dialogoAperto: () => st.dialogo,
    tastoAttivo: () => 'KeyQ',
  });
  return { st, hud, contenitore, spriteChiesti, radice: hud.elementi.radice };
}

test('H01 costruzione: scheda, barra del boss (nascosta), dock con l\'attivo e i cinque slot vuoti visibili; testi da interfaccia.json e personaggi.json', () => {
  const m = mondo();
  m.hud.aggiorna();
  const s = m.hud.stato();
  assert.equal(m.radice.hidden, false);
  assert.equal(s.nome, PERSONAGGIO.nome);
  assert.equal(s.titolo, PERSONAGGIO.titolo);
  assert.equal(m.hud.elementi.nome.textContent, PERSONAGGIO.nome);
  assert.equal(s.pianoTesto, TESTI.hud.piano.replace('{piano}', '1'));
  assert.equal(s.stanzaTesto, TESTI.hud.stanze.ingresso);
  assert.equal(m.hud.elementi.stanza.dataset.tipo, 'ingresso');
  // maschere: tutte piene, tante quante le massime (PNG hud-cuore-pieno)
  assert.equal(s.maschere.max, Math.ceil(PERSONAGGIO.hpHalf / 2));
  assert.equal(s.maschere.piene, s.maschere.max);
  assert.equal(perClasse(m.hud.elementi.vita, 'pieno').length, s.maschere.max);
  assert.ok(perClasse(m.hud.elementi.vita, 'pieno').every((img) => img.src === 'src:hud-cuore-pieno'));
  // statistiche: quattro voci con etichetta dal JSON e valore con le cifre di resa.json
  for (const k of ['dmg', 'tears', 'spd', 'range']) assert.ok(perClasse(m.hud.elementi.scheda, `hud-stat-${k}`).length === 1, k);
  assert.equal(s.statistiche.dmg, (3.5).toFixed(DECIMALI.dmg));
  assert.equal(s.statistiche.tears, (2.75).toFixed(DECIMALI.tears));
  assert.equal(m.hud.elementi.statistiche.dmg.textContent, s.statistiche.dmg);
  assert.equal(perClasse(m.hud.elementi.scheda, 'hud-etichetta').map((e) => e.textContent).join('|'), [TESTI.hud.dmg, TESTI.hud.tears, TESTI.hud.spd, TESTI.hud.range].join('|'));
  assert.equal(m.hud.elementi.monete.textContent, '7');
  assert.equal(m.hud.elementi.scintille.textContent, '3');
  // boss: nascosto senza boss
  assert.equal(m.hud.elementi.boss.hidden, true);
  assert.equal(s.boss, null);
  // dock: attivo con tacche piene e tasto; cinque slot vuoti, visibili, con il numero
  assert.equal(m.hud.elementi.attivo.hidden, false);
  assert.equal(s.attivo.tacche, MAX_CARICA);
  assert.equal(s.attivo.piene, MAX_CARICA);
  assert.equal(s.attivo.icona, `src:attivo-${ATTIVO.id}`);
  assert.equal(perClasse(m.hud.elementi.attivo, 'hud-attivo-tasto')[0].textContent, 'Q', 'il tasto in forma corta, come la «Q» del Teatro');
  assert.equal(s.slot.length, MAX_SLOT);
  assert.ok(s.slot.every((x) => x === null));
  assert.equal(m.hud.elementi.slot.length, MAX_SLOT);
  assert.ok(m.hud.elementi.slot.every((v, i) => v.li.className.includes('vuoto') && !v.li.hidden && v.numero.textContent === String(i + 1)));
  assert.equal(m.hud.elementi.slot[0].li.title, TESTI.hud.slot_vuoto.replace('{n}', '1'));
  assert.equal(m.hud.elementi.slot[0].li.style.backgroundImage, 'url("src:hud-slot-vuoto")');
  assert.equal(m.hud.elementi.attivo.style.backgroundImage, 'url("src:hud-slot-attivo")');
});

test('H02 aggiornamento: statistiche, monete, maschere a metà, attivo scarico e slot con icona PNG o sagoma (ricordo azzurro)', () => {
  const m = mondo();
  m.hud.aggiorna();
  m.st.correnti = { ...m.st.correnti, dmg: 5.25 };
  m.st.monete = 12;
  m.st.maschere = 2.5; m.st.maschereMax = 4;
  m.st.attivo = { ...m.st.attivo, carica: 1, carico: false };
  m.st.doni = [DONO_CON_PNG.id, RICORDO.id];
  m.hud.aggiorna();
  const s = m.hud.stato();
  assert.equal(s.statistiche.dmg, (5.25).toFixed(DECIMALI.dmg));
  assert.equal(m.hud.elementi.monete.textContent, '12');
  assert.deepEqual({ piene: s.maschere.piene, mezza: s.maschere.mezza, vuote: s.maschere.vuote, max: s.maschere.max }, { piene: 2, mezza: true, vuote: 1, max: 4 });
  const maschere = m.hud.elementi.maschere.filter((x) => !x.hidden);
  assert.deepEqual(maschere.map((x) => x.className), ['hud-maschera pieno', 'hud-maschera pieno', 'hud-maschera mezzo', 'hud-maschera vuoto']);
  assert.equal(maschere[2].src, 'src:hud-cuore-mezzo');
  assert.equal(maschere[3].src, 'src:hud-cuore-vuoto');
  assert.equal(s.attivo.piene, 1);
  assert.equal(m.hud.elementi.attivo.className, 'hud-attivo');
  assert.deepEqual(m.hud.elementi.tacche.map((t) => t.className), ['tacca piena', 'tacca', 'tacca'].slice(0, MAX_CARICA).concat(Array(Math.max(0, MAX_CARICA - 3)).fill('tacca')));
  // slot 1: dono con PNG `oggetto-<id_teatro>`; slot 2: ricordo senza PNG → sagoma come testo e classe azzurro; gli altri vuoti
  assert.equal(s.slot[0].id, DONO_CON_PNG.id);
  assert.equal(s.slot[0].icona, `src:oggetto-${DONO_CON_PNG.teatro.id_teatro}`);
  assert.equal(m.hud.elementi.slot[0].li.className, 'hud-slot pieno');
  assert.equal(m.hud.elementi.slot[0].li.title, DONO_CON_PNG.nome);
  assert.equal(m.hud.elementi.slot[0].icona.hidden, false);
  assert.equal(s.slot[1].id, RICORDO.id);
  assert.equal(s.slot[1].azzurro, true);
  assert.equal(s.slot[1].icona, null);
  assert.equal(m.hud.elementi.slot[1].li.className, 'hud-slot pieno azzurro');
  assert.equal(m.hud.elementi.slot[1].sagoma.textContent, RICORDO.sagoma.forma);
  assert.equal(m.hud.elementi.slot[1].li.dataset.id, RICORDO.id);
  assert.equal(s.slot.filter(Boolean).length, 2);
  assert.ok(m.hud.elementi.slot.slice(2).every((v) => v.li.className === 'hud-slot vuoto'));
  // la didascalia al passaggio del puntatore porta il nome
  m.hud.elementi.slot[0].li.ascoltatori.mouseenter();
  assert.equal(m.hud.elementi.didascalia.textContent, DONO_CON_PNG.nome);
  m.hud.elementi.slot[0].li.ascoltatori.mouseleave();
  assert.equal(m.hud.elementi.didascalia.textContent, '');
});

test('H03 si nasconde nel menu e a dialogo aperto, ricompare dopo; senza personaggio scelto mostra il nome di riserva e nessuna statistica', () => {
  const m = mondo();
  m.hud.aggiorna();
  assert.equal(m.radice.hidden, false);
  m.st.dialogo = true;
  m.hud.aggiorna();
  assert.equal(m.radice.hidden, true);
  assert.equal(m.hud.stato().visibile, false);
  m.st.dialogo = false;
  m.hud.aggiorna();
  assert.equal(m.radice.hidden, false);
  m.st.stato = 'menu';
  m.hud.aggiorna();
  assert.equal(m.radice.hidden, true);
  m.st.stato = 'notte';
  m.st.id = null; m.st.correnti = null;
  m.hud.aggiorna();
  const s = m.hud.stato();
  assert.equal(m.radice.hidden, false);
  assert.equal(s.nome, TESTI.hud.senza_personaggio);
  assert.equal(s.statistiche, null);
  assert.equal(perClasse(m.hud.elementi.scheda, 'hud-statistiche')[0].hidden, true);
});

test('H04 piano e ciclo dalla run, tipo della stanza dal JSON, hub tra le notti', () => {
  const m = mondo();
  m.st.piano = 6; m.st.ciclo = 2; m.st.stanza = { tipo: 'banchetto' };
  m.hud.aggiorna();
  let s = m.hud.stato();
  assert.equal(s.pianoTesto, TESTI.hud.piano_ciclo.replace('{piano}', '6').replace('{ciclo}', '2'));
  assert.equal(s.stanzaTesto, TESTI.hud.stanze.banchetto);
  for (const tipo of ['normale', 'tesoro', 'segreta', 'boss']) {
    m.st.stanza = { tipo }; m.hud.aggiorna();
    assert.equal(m.hud.stato().stanzaTesto, TESTI.hud.stanze[tipo], tipo);
  }
  m.st.stanza = null; m.st.hubAttivo = true;
  m.hud.aggiorna();
  s = m.hud.stato();
  assert.equal(s.piano, null);
  assert.equal(s.pianoTesto, TESTI.hud.hub);
  assert.equal(s.stanzaTesto, TESTI.hud.stanze.hub);
});

test('H05 barra del boss: titolo da boss_hud con piano/ciclo/nome, quota della vita, vita numerica; sparisce da morto; una sola barra', () => {
  const m = mondo();
  m.st.boss = { boss: true, nomeBoss: BOSS_POOL.nome, vita: 150, vitaMax: 200, stato: 'insegue' };
  m.hud.aggiorna();
  let s = m.hud.stato();
  assert.equal(m.hud.elementi.boss.hidden, false);
  assert.equal(s.boss.nome, BOSS_POOL.nome);
  assert.equal(s.boss.quota, 0.75);
  assert.equal(s.boss.vita, 150);
  assert.equal(s.boss.max, 200);
  const atteso = TESTI.boss_hud.titolo.replace('{piano}', '1').replace('{piani}', String(m.st.pianiPerCiclo)).replace('{nome}', BOSS_POOL.nome.toUpperCase());
  assert.equal(s.boss.titolo, atteso);
  assert.equal(m.hud.elementi.bossNome.textContent, atteso);
  assert.equal(m.hud.elementi.bossRiempimento.style.width, '75.0%');
  assert.equal(perClasse(m.hud.elementi.boss, 'hud-boss-vita')[0].textContent, TESTI.hud.boss_vita.replace('{vita}', '150').replace('{max}', '200'));
  assert.equal(perClasse(m.radice, 'hud-boss').length, 1, 'una sola barra');
  m.st.ciclo = 2;
  m.hud.aggiorna();
  assert.ok(m.hud.stato().boss.titolo.includes('2'), 'con il ciclo > 1 il titolo con il ciclo');
  m.st.boss = { ...m.st.boss, stato: 'morto', vita: 0 };
  m.hud.aggiorna();
  assert.equal(m.hud.elementi.boss.hidden, true);
  assert.equal(m.hud.stato().boss, null);
});

test('H06 reliquie del Patto accanto agli slot: icona `patto-<id>` dal manifesto o sigla, nome nel title', () => {
  const m = mondo();
  m.st.patti = [RELIQUIA.id];
  m.hud.aggiorna();
  const s = m.hud.stato();
  assert.equal(s.patti.length, 1);
  assert.equal(s.patti[0].nome, RELIQUIA.nome);
  const nomeSprite = `patto-${RELIQUIA.id.replace(/^patto[_-]/, '').replace(/_/g, '-')}`;
  assert.ok(m.spriteChiesti.includes(nomeSprite), `chiede ${nomeSprite} al manifesto`);
  const v = m.hud.elementi.patti[0];
  assert.equal(v.e.hidden, false);
  assert.equal(v.e.title, TESTI.hud.patto.replace('{nome}', RELIQUIA.nome));
  if (s.patti[0].icona) assert.equal(v.icona.hidden, false); else assert.equal(v.sigla.textContent, RELIQUIA.nome.charAt(0));
  m.st.patti = [];
  m.hud.aggiorna();
  assert.equal(m.hud.elementi.patti[0].e.hidden, true);
});

test('H07 il manifesto degli sprite ha ogni voce che l\'HUD usa (maschere, icone, slot, barra, attivi, patti consegnati, oggetti dei doni con id_teatro)', () => {
  const nomi = new Set(SPRITE.voci.map((v) => v.nome));
  for (const n of ['hud-cuore-pieno', 'hud-cuore-mezzo', 'hud-cuore-vuoto', 'hud-icona-dmg', 'hud-icona-tears', 'hud-icona-spd', 'hud-icona-range', 'hud-icona-moneta', 'hud-icona-scintilla', 'hud-slot-vuoto', 'hud-slot-attivo', 'hud-barra-boss']) {
    assert.ok(nomi.has(n), `manca ${n}`);
  }
  for (const a of LISTA_ATTIVI) assert.ok(nomi.has(`attivo-${a.id}`), `manca attivo-${a.id}`);
  for (const d of DONI.doni.filter((x) => x.teatro?.id_teatro)) assert.ok(nomi.has(`oggetto-${d.teatro.id_teatro}`), `manca oggetto-${d.teatro.id_teatro}`);
  for (const v of SPRITE.voci.filter((x) => /^(hud|oggetto|attivo|patto)-/.test(x.nome))) assert.ok(v.file.startsWith(SPRITE.cartella), v.nome);
});

test('H08 dipendenze mancanti → TypeError; regole del codice (nessun Math.random, nessun percorso di immagine scritto nel modulo, testi dal JSON)', () => {
  assert.throws(() => creaHud({}), TypeError);
  const sorgente = readFileSync(join(RADICE, 'motore/interfaccia/hud.js'), 'utf8');
  assert.ok(!sorgente.includes('Math.random'));
  assert.ok(!/assets\//.test(sorgente), 'le immagini vengono dal manifesto, non da percorsi scritti qui');
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(sorgente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'nessun colore nel modulo (stile/hud.css)');
  for (const parola of ['Maschere', 'Piano ', 'Stanza']) assert.ok(!sorgente.includes(`'${parola}`), `stringa di gioco nel codice: ${parola}`);
});
