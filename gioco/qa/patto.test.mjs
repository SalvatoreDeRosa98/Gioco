/**
 * gioco/qa/patto.test.mjs — Storia P04/P09: il Patto d'Ombra (oggetti/patto.js), il Raggio Cremisi Continuo e le Lacrime
 * Spettrali (attori/combattimento.js + attori/statistiche.js) con i numeri di patto.json. Esecuzione: `node gioco/qa/patto.test.mjs`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { creaMondoAttivi } from './attivi.test.mjs';
import { creaPatto, MOTIVI_PATTO } from '../motore/oggetti/patto.js';
import { FLAG_MOD } from '../motore/attori/statistiche.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const leggi = (p) => JSON.parse(readFileSync(join(RADICE, p), 'utf8'));
const TAB = leggi('contenuti/parametri/patto.json');
const reliquia = (id) => TAB.patti.find((p) => p.id === id);

/** Mondo con il patto: una «notte» finta con una stanza al centro del campo. */
async function creaMondoPatto({ personaggio = 'ferruccio', rngValori = [0, 0, 0, 0, 0, 0] } = {}) {
  const m = await creaMondoAttivi({ personaggio });
  let i = 0;
  const rng = () => rngValori[Math.min(i++, rngValori.length - 1)];
  const stanza = { id: 'boss1', tipo: 'boss', cella: m.campo.cella, origine: { x: m.campo.x, y: m.campo.y }, geo: { colonne: m.parametri.get('stanza.colonne'), righe: m.parametri.get('stanza.righe') } };
  const notte = { stanza };
  m.combattimento.impostaRaggio(TAB.regole.raggio);
  const patto = creaPatto({ tabella: m.parametri.get('patto'), eventi: m.eventi, statistiche: m.statistiche, ferruccio: m.ferruccio, modificatori: m.modificatori, parametri: m.parametri, rng, notte: () => notte, input: m.input });
  const tickP = (n = 1) => { for (let k = 0; k < n; k++) { m.tick(1); patto.tick(); } };
  const premiP = (a) => { m.input.sorgenteGiu(m.tasto(a)); tickP(1); m.input.sorgenteSu(m.tasto(a)); };
  return { ...m, patto, notte, stanza, tickP, premiP };
}

test('contenuti: patto.json ha i 3 patti del Teatro + Raggio Cremisi Continuo (flag raggio) + Lacrime Spettrali (flag spettrale), tutti a costo 2 mezze maschere e dmgMult ≥ 2 (i più alti del gioco); regole dell\'altare e del raggio; testi', () => {
  const ids = TAB.patti.map((p) => p.id);
  for (const id of ['patto_raggio', 'patto_sacro', 'patto_coltello', 'patto_raggio_continuo', 'patto_spettrale']) assert.ok(ids.includes(id), id);
  assert.ok(reliquia('patto_raggio_continuo').mod.raggio === true);
  assert.ok(reliquia('patto_spettrale').mod.spettrale === true);
  for (const p of TAB.patti) {
    assert.equal(p.costoMaxHpHalf, 2, `${p.id}: una maschera intera`);
    assert.ok((p.mod.dmgMult ?? 1) >= 2, `${p.id}: dmgMult ${p.mod.dmgMult}`);
  }
  const doni = leggi('contenuti/parametri/doni.json').doni.filter((d) => d.teatro?.mod?.dmgMult);
  const maxDoni = Math.max(...doni.map((d) => d.teatro.mod.dmgMult));
  assert.ok(TAB.patti.every((p) => p.mod.dmgMult >= maxDoni), `i patti (≥ ×2) battono il miglior dono (×${maxDoni})`);
  assert.ok(FLAG_MOD.includes('raggio') && FLAG_MOD.includes('spettrale'));
  for (const k of ['p_altare_senza_danno', 'p_altare_con_danno', 'reliquie_per_altare']) assert.ok('base' in TAB.regole[k], k);
  for (const k of ['carica_ms', 'durata_ms', 'tick_ms', 'frazione_danno_tick', 'larghezza', 'molt_portata']) assert.ok(TAB.regole.raggio[k].base > 0, `raggio.${k}`);
  const testi = leggi('contenuti/interfaccia.json').patto;
  assert.ok(/−1 Maschera massima per sempre/.test(testi.costo), 'il pannello dice chiaramente il costo permanente');
  assert.deepEqual(MOTIVI_PATTO, ['maschere', 'stretto', 'nessuno']);
});

test('P1: dopo il boss (boss.sconfitto nella stanza corrente) senza danni l\'altare compare sempre e offre reliquie_per_altare reliquie distinte; con danni compare solo se rng < p_altare_con_danno', async () => {
  const m = await creaMondoPatto({ rngValori: [0.99, 0, 0.5] });
  m.eventi.emit('stanza.entrata', { id: 'boss1', tipo: 'boss' });
  const altari = [];
  m.eventi.on('patto.altare', (p) => altari.push(p));
  m.eventi.emit('boss.sconfitto', { id: 'gatto', stanza: 'boss1', x: 0, y: 0 });
  assert.equal(altari.length, 1, 'rng 0,99 < p_altare_senza_danno = 1');
  const n = TAB.regole.reliquie_per_altare.base;
  assert.equal(m.patto.altare.reliquie.length, n);
  assert.equal(new Set(m.patto.altare.reliquie.map((r) => r.id)).size, n, 'reliquie distinte');
  assert.ok(m.patto.inStanzaAltare());
  // con danni: rng 0,99 ≥ 0,60 → niente altare
  const m2 = await creaMondoPatto({ rngValori: [0.99, 0, 0] });
  m2.eventi.emit('stanza.entrata', { id: 'boss1', tipo: 'boss' });
  m2.ferruccio.impostaMaschere(m2.ferruccio.maschere - 1);
  m2.eventi.emit('boss.sconfitto', { id: 'gatto', stanza: 'boss1', x: 0, y: 0 });
  assert.equal(m2.patto.altare, null, 'con danni e rng 0,99 ≥ p_altare_con_danno niente altare');
  const m3 = await creaMondoPatto({ rngValori: [0.3, 0, 0] });
  m3.eventi.emit('stanza.entrata', { id: 'boss1', tipo: 'boss' });
  m3.ferruccio.impostaMaschere(m3.ferruccio.maschere - 1);
  m3.eventi.emit('boss.sconfitto', { id: 'gatto', stanza: 'boss1', x: 0, y: 0 });
  assert.ok(m3.patto.altare, 'con danni e rng 0,3 < 0,60 l\'altare compare');
});

test('P2b: le maschere correnti non restano sopra il massimo quando il massimo scende fuori da patto.conferma (statistiche.stringiPatto diretto, strumento di QA): al tick successivo Ferruccio le allinea al tetto (Teatro ~2729)', async () => {
  const m = await creaMondoPatto();
  const maxPrima = m.modificatori.valore('ferruccio.maschere_max');
  m.ferruccio.impostaMaschere(maxPrima);
  m.statistiche.stringiPatto(reliquia('patto_raggio_continuo'));
  const maxDopo = m.modificatori.valore('ferruccio.maschere_max');
  assert.equal(maxDopo, maxPrima - 1);
  assert.equal(m.ferruccio.maschere, maxPrima, 'prima del tick le correnti sono ancora quelle di prima');
  m.tick(1);
  assert.equal(m.ferruccio.maschere, maxDopo, 'dopo un tick le correnti non superano il nuovo massimo');
  assert.equal(m.ferruccio.stato !== 'morto', true);
});

test('P2: interagisci vicino a una reliquia la PROPONE (pannello), indietro rifiuta, conferma la stringe: −1 maschera massima PERMANENTE (sopravvive a stanza e piano), DMG ≥ ×2, flag applicati; la stessa reliquia non si ripropone; a maschere insufficienti rifiutato', async () => {
  const m = await creaMondoPatto({ rngValori: [0, 0, 0] });
  m.eventi.emit('stanza.entrata', { id: 'boss1', tipo: 'boss' });
  m.eventi.emit('boss.sconfitto', { id: 'gatto', stanza: 'boss1' });
  const r0 = m.patto.altare.reliquie[0];
  const def = reliquia(r0.id);
  const stPrima = m.statistiche.correnti();
  const maxPrima = m.modificatori.valore('ferruccio.maschere_max');
  m.ferruccio.posiziona(r0.x + 10, r0.y);
  m.premiP('interagisci');
  assert.equal(m.patto.pendente?.id, r0.id, 'proposta aperta');
  m.premiP('indietro');
  assert.equal(m.patto.pendente, null, 'rifiutata: resta sull\'altare');
  assert.equal(m.patto.altare.reliquie[0].stretto, false);
  m.premiP('interagisci');
  const stretti = [];
  m.eventi.on('patto.stretto', (p) => stretti.push(p));
  m.premiP('conferma');
  assert.equal(stretti.length, 1);
  const stDopo = m.statistiche.correnti();
  assert.equal(stDopo.maxHpHalf, stPrima.maxHpHalf - def.costoMaxHpHalf, 'una maschera intera in meno');
  assert.equal(m.modificatori.valore('ferruccio.maschere_max'), maxPrima - 1);
  assert.ok(m.ferruccio.maschere <= maxPrima - 1, 'le maschere correnti non superano il nuovo massimo');
  assert.ok(stDopo.dmg >= stPrima.dmg * 2 * 0.99, `DMG ${stDopo.dmg} ≥ 2 × ${stPrima.dmg}`);
  for (const f of ['raggio', 'spettrale', 'piercing', 'spada']) if (def.mod[f]) assert.equal(stDopo.flags[f], true, f);
  // permanenza: cambio di stanza e di piano non restituiscono la maschera
  m.eventi.emit('notte.stanza', { da: 'boss1', a: 'r2', tipo: 'normale' });
  m.eventi.emit('stanza.entrata', { id: 'r2', tipo: 'normale' });
  m.patto.nuovoPiano();
  assert.equal(m.modificatori.valore('ferruccio.maschere_max'), maxPrima - 1, 'dopo la stanza successiva il costo resta');
  assert.equal(m.statistiche.correnti().maxHpHalf, stPrima.maxHpHalf - def.costoMaxHpHalf);
  assert.deepEqual(m.patto.stretti, [r0.id]);
  assert.equal(m.patto.altare, null, 'l\'altare del piano precedente sparisce, il patto no');
  // maschere insufficienti: Agnese (hpHalf 4) dopo un patto ha 2 = costo → il secondo è rifiutato
  const a = await creaMondoPatto({ personaggio: 'agnese', rngValori: [0, 0, 0] });
  a.eventi.emit('stanza.entrata', { id: 'boss1', tipo: 'boss' });
  a.eventi.emit('boss.sconfitto', { id: 'gatto', stanza: 'boss1' });
  a.patto.proponi(0);
  assert.equal(a.patto.conferma().esito, 'stretto');
  a.patto.proponi(1);
  const esito = a.patto.conferma();
  assert.equal(esito.esito, 'rifiutato');
  assert.equal(esito.motivo, 'maschere');
  // nuova run: patti sciolti, maschere massime del personaggio
  a.patto.nuovaRun();
  assert.equal(a.statistiche.correnti().maxHpHalf, a.tab.personaggi.agnese.hpHalf);
});

test('P3: Raggio Cremisi Continuo — con la freccia tenuta: carica per carica_ms (nessun proiettile), poi raggio acceso che ferisce ogni tick_ms TUTTI i bersagli sulla linea (DMG × frazione) e NESSUNO fuori linea; rilasciando si spegne; dopo durata_ms si ricarica', async () => {
  const m = await creaMondoPatto({ rngValori: [0, 0, 0] });
  m.statistiche.stringiPatto(reliquia('patto_raggio_continuo'));
  const st = m.statistiche.correnti();
  assert.equal(st.flags.raggio, true);
  const R = TAB.regole.raggio;
  const sulla1 = m.fantoccio('s1', 150, 0);
  const sulla2 = m.fantoccio('s2', 300, 6);
  const fuori = m.fantoccio('f', 150, R.larghezza.base + 60);
  const dietro = m.fantoccio('d', -150, 0);
  const vita = (b) => b.vita;
  const v0 = [sulla1, sulla2, fuori, dietro].map(vita);
  const caricaTicks = m.tempo.ticksDaMs(R.carica_ms.base);
  m.input.sorgenteGiu(m.tasto('spara_destra'));
  m.tick(Math.max(1, caricaTicks - 1));
  assert.equal(m.combattimento.proiettiliFerruccio().length, 0, 'il raggio non spara proiettili');
  assert.equal(m.combattimento.raggio().attivo, false, 'in carica');
  assert.ok(m.combattimento.raggio().carica > 0);
  assert.deepEqual([sulla1, sulla2, fuori, dietro].map(vita), v0, 'nessun danno durante la carica');
  m.tick(2);
  assert.equal(m.combattimento.raggio().attivo, true, 'raggio acceso');
  const rg = m.combattimento.raggio();
  assert.deepEqual([rg.dx, rg.dy], [1, 0]);
  assert.ok(rg.lunghezza >= 300 + sulla2.r, `lunghezza ${rg.lunghezza}`);
  const dannoTick = st.dmg * R.frazione_danno_tick.base;
  assert.ok(Math.abs((v0[0] - sulla1.vita) - dannoTick) < 1e-9, `primo tick: ${v0[0] - sulla1.vita} ≠ ${dannoTick}`);
  assert.ok(Math.abs((v0[1] - sulla2.vita) - dannoTick) < 1e-9, 'anche il secondo sulla linea: il raggio non si ferma');
  assert.equal(fuori.vita, v0[2], 'fuori linea: intatto');
  assert.equal(dietro.vita, v0[3], 'dietro: intatto');
  const tickMs = m.tempo.ticksDaMs(R.tick_ms.base);
  m.tick(tickMs * 3);
  assert.ok(Math.abs((v0[0] - sulla1.vita) - dannoTick * 4) < 1e-6, 'danno continuo a tick');
  assert.equal(fuori.vita, v0[2]);
  m.input.sorgenteSu(m.tasto('spara_destra'));
  m.tick(1);
  assert.equal(m.combattimento.raggio().attivo, false, 'rilasciata: spento');
  assert.equal(m.combattimento.raggio().carica, 0);
  // durata: tenuta a lungo si spegne e ricarica
  m.input.sorgenteGiu(m.tasto('spara_destra'));
  m.tick(caricaTicks + 1);
  assert.equal(m.combattimento.raggio().attivo, true);
  m.tick(m.tempo.ticksDaMs(R.durata_ms.base) + 1);
  assert.equal(m.combattimento.raggio().attivo, false, 'dopo durata_ms si spegne');
  m.tick(caricaTicks + 1);
  assert.equal(m.combattimento.raggio().attivo, true, 'e si riaccende dopo una nuova carica');
  m.input.sorgenteSu(m.tasto('spara_destra'));
});

test('P4: Lacrime Spettrali — il proiettile normale si ferma sull\'ostacolo (ferruccio.colpo_muro) e non colpisce chi sta dietro; quello spettrale lo attraversa, lo colpisce e muore al bordo del campo', async () => {
  const bersaglioDietro = async (spettrale) => {
    const m = await creaMondoPatto({ rngValori: [0, 0, 0] });
    if (spettrale) m.statistiche.stringiPatto(reliquia('patto_spettrale'));
    // un ostacolo pieno tra Ferruccio e il bersaglio (campo.solidi è ciò che il combattimento legge)
    const cella = m.campo.cella;
    const ost = { id: 'colonna', x: m.ferruccio.x + 90, y: m.ferruccio.y - 40 - cella, w: cella, h: cella * 2 + 20, ferma_passo: true, ferma_colpi: true };
    m.campo.solidi.push(ost);
    const dietro = m.fantoccio('dietro', 90 + cella + 80, 0);
    const v0 = dietro.vita;
    const muri = [];
    m.eventi.on('ferruccio.colpo_muro', (p) => muri.push(p));
    m.input.sorgenteGiu(m.tasto('spara_destra'));
    m.tick(1);
    m.input.sorgenteSu(m.tasto('spara_destra'));
    const p = m.combattimento.proiettiliFerruccio()[0];
    assert.ok(p, 'un proiettile è partito');
    assert.equal(Boolean(p.spettrale), spettrale);
    m.tick(240);
    return { m, dietro, v0, muri };
  };
  const n = await bersaglioDietro(false);
  assert.equal(n.muri.length >= 1, true, 'il proiettile normale colpisce l\'ostacolo');
  assert.equal(n.muri[0].solido.id, 'colonna');
  assert.equal(n.dietro.vita, n.v0, 'chi sta dietro è intatto');
  const s = await bersaglioDietro(true);
  assert.equal(s.muri.length, 0, 'lo spettrale non tocca l\'ostacolo');
  assert.ok(s.dietro.vita < s.v0, 'e ferisce chi sta dietro');
  assert.equal(s.m.combattimento.proiettiliFerruccio().length, 0, 'poi muore (bordo o portata)');
});

test('regole: patto.js senza Math.random, senza numeri e stringhe di gioco; il renderer non disegna segni a terra d\'anticipo (regola dell\'autore 2026-11-08) nel blocco della squadra', () => {
  const testo = readFileSync(join(RADICE, 'motore/oggetti/patto.js'), 'utf8');
  assert.ok(!/Math\.random/.test(testo));
  const codice = testo.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for (const n of ['0.6', '0.60', '100']) assert.ok(!new RegExp(`[^\\w.']${n.replace('.', '\\.')}(?![\\d.\\w])`).test(codice), `patto.js contiene ${n}`);
  const renderer = readFileSync(join(RADICE, 'motore/resa/renderer.js'), 'utf8');
  const blocco = renderer.slice(renderer.indexOf('function disegnaSquadraOggetti'), renderer.indexOf('function disegnaOggettiEInteragibili'));
  assert.ok(blocco.length > 0);
  assert.ok(!/setLineDash\(\[\s*[1-9]/.test(blocco), 'nessun tratteggio d\'anticipo nel blocco della squadra oggetti');
});
