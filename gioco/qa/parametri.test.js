/**
 * gioco/qa/parametri.test.js — Coerenza tra catalogo dei doni, parametri e libreria degli effetti
 * (ADR-0002, storia 023, criterio 5). Esecuzione: `node gioco/qa/parametri.test.js` dalla radice.
 *
 * Verifica, sui file REALI di `contenuti/parametri/`: ogni statistica citata dal catalogo (doni,
 * sinergie, bonus temporanei) esiste nei parametri come `{base, min, max}` con min/max numerici; ogni
 * effetto citato esiste nella libreria `oggetti/effetti.js` con i parametri obbligatori; i limiti del
 * registro (per dono, Π cap) sono rispettati; il validatore non esclude nessun dono; il catalogo è
 * quello del Teatro (25 doni: 20 d'oro + 5 ricordi; 21 MVP = tutti i doni d'oro più il Medaglione, pool
 * unico stile Isaac; forme d'oro uniche e non vietate). File
 * CommonJS (nessun package.json): i moduli ES del motore si caricano con `import()`.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const PARAMETRI = path.resolve(__dirname, '..', 'contenuti', 'parametri');
const MOTORE = path.resolve(__dirname, '..', 'motore');
const leggiJson = (nome) => JSON.parse(readFileSync(path.join(PARAMETRI, `${nome}.json`), 'utf8'));
const modulo = (rel) => import(`file://${path.join(MOTORE, rel)}`);

/** Parametri reali caricati in memoria, con il logger che raccoglie. */
async function parametriReali() {
  const { creaParametri } = await modulo('fondazione/parametri.js');
  const voci = [];
  const parametri = creaParametri({ log: { error: (...a) => voci.push(a.join(' ')) } });
  const errori = await parametri.carica({ caricatore: leggiJson, statistiche: ['ferruccio', 'combattimento', 'stanza'], tabelle: ['doni', 'sinergie', 'input'] });
  assert.deepEqual(errori, [], 'i JSON reali devono essere validi');
  return parametri;
}

/** Tutte le coppie {statistica, operazione, valore} citate da doni e sinergie, con l'origine. */
function modificatoriCitati(catalogo, sinergie) {
  const citati = [];
  for (const d of catalogo.doni) {
    for (const m of d.modificatori) citati.push({ ...m, dove: `dono ${d.id}` });
    for (const g of d.ganci) {
      if (g.effetto === 'bonus_temporaneo') citati.push({ statistica: g.parametri.statistica, operazione: g.parametri.operazione, valore: g.parametri.valore, dove: `bonus di ${d.id}` });
    }
  }
  for (const s of sinergie.sinergie) for (const m of s.effetto.modificatori ?? []) citati.push({ ...m, dove: `sinergia ${s.id}` });
  return citati;
}

test('ogni statistica citata dal catalogo esiste nei parametri con min/max numerici', async () => {
  const parametri = await parametriReali();
  const { risolviStatistica } = await modulo('oggetti/catalogo.js');
  const catalogo = leggiJson('doni');
  const sinergie = leggiJson('sinergie');
  const citati = modificatoriCitati(catalogo, sinergie);
  assert.ok(citati.length >= 20, 'il catalogo cita almeno 20 modificatori');
  for (const m of citati) {
    const percorso = risolviStatistica(m.statistica, catalogo.statistiche);
    assert.ok(percorso, `${m.dove}: '${m.statistica}' non è nel registro doni.statistiche`);
    assert.ok(parametri.ha(percorso), `${m.dove}: '${percorso}' assente nei parametri`);
    const voce = parametri.statistica(percorso);
    for (const k of ['base', 'min', 'max']) assert.equal(typeof voce[k], 'number', `${percorso}.${k} deve essere un numero`);
    assert.ok(voce.min <= voce.base && voce.base <= voce.max, `${percorso}: min ≤ base ≤ max`);
  }
  // anche ogni voce del registro punta a una statistica reale
  for (const [nome, def] of Object.entries(catalogo.statistiche)) {
    if (nome.startsWith('_')) continue;
    assert.ok(parametri.ha(def.parametro), `registro ${nome} → '${def.parametro}' assente`);
    assert.doesNotThrow(() => parametri.statistica(def.parametro), `registro ${nome}: '${def.parametro}' non è {base,min,max}`);
  }
});

test('ogni effetto citato da doni e sinergie esiste nella libreria con i parametri obbligatori', async () => {
  const { creaLibreria, EFFETTI } = await modulo('oggetti/effetti.js');
  const catalogo = leggiJson('doni');
  const sinergie = leggiJson('sinergie');
  const libreria = creaLibreria(catalogo.effetti);
  assert.deepEqual(libreria.errori, []);
  const ganci = [];
  for (const d of catalogo.doni) for (const g of d.ganci) ganci.push({ ...g, dove: `dono ${d.id}` });
  for (const s of sinergie.sinergie) {
    for (const g of s.effetto.ganci_extra ?? []) ganci.push({ ...g, dove: `sinergia ${s.id}` });
    for (const nome of Object.keys(s.effetto.param_extra ?? {})) assert.ok(libreria.voci.has(nome), `sinergia ${s.id}: param_extra su effetto '${nome}' sconosciuto`);
  }
  assert.ok(ganci.length >= 5);
  for (const g of ganci) {
    const voce = libreria.voci.get(g.effetto);
    assert.ok(voce, `${g.dove}: effetto '${g.effetto}' non in oggetti/effetti.js`);
    assert.equal(typeof EFFETTI[voce.canonico], 'function');
    for (const p of voce.obbligatori) assert.ok(p in g.parametri, `${g.dove}: '${g.effetto}' senza '${p}'`);
    assert.ok(catalogo.ganci.includes(g.evento), `${g.dove}: gancio '${g.evento}' sconosciuto`);
  }
  // l'alias dell'ADR esiste e punta all'effetto canonico
  assert.equal(libreria.voci.get('lancia_scintilla').canonico, 'scintilla');
  // i sette ganci dell'ADR-0002
  assert.deepEqual(catalogo.ganci, ['su_colpo', 'su_uccisione', 'su_parata', 'su_affondo', 'su_danno_subito', 'su_stanza_pulita', 'su_raccolta']);
});

test('il validatore accetta tutto il catalogo e tutte le sinergie (nessun dono escluso)', async () => {
  const parametri = await parametriReali();
  const { creaLibreria } = await modulo('oggetti/effetti.js');
  const { validaCatalogo, validaSinergie } = await modulo('oggetti/catalogo.js');
  const catalogo = leggiJson('doni');
  const libreria = creaLibreria(catalogo.effetti).voci;
  const c = validaCatalogo(catalogo, { parametri, libreria });
  assert.deepEqual(c.errori, [], c.errori.join('\n'));
  assert.deepEqual(c.esclusi, []);
  assert.equal(c.indice.size, catalogo.doni.length, 'tutto il catalogo del Teatro (25 doni) è nell\'indice');
  const s = validaSinergie(leggiJson('sinergie'), { catalogo, parametri, libreria });
  assert.deepEqual(s.errori, [], s.errori.join('\n'));
  assert.equal(s.valide.length, 6);
});

test('il catalogo è quello del Teatro: 25 doni, 20 d\'oro, 5 ricordi, 21 MVP (tutti i doni d\'oro + Medaglione), forme d\'oro uniche e lecite', () => {
  const catalogo = leggiJson('doni');
  const doni = catalogo.doni;
  assert.equal(doni.length, 25, 'Teatro: 20 doni d\'oro (CATALOGO_OGGETTI) + 5 ricordi');
  const oro = doni.filter((d) => d.categoria !== 'ricordi');
  const ricordi = doni.filter((d) => d.categoria === 'ricordi');
  assert.equal(oro.length, 20);
  assert.equal(ricordi.length, 5);
  assert.equal(doni.filter((d) => d.mvp).length, 21);
  assert.deepEqual(doni.filter((d) => d.mvp).map((d) => d.id).sort(), [...oro.map((d) => d.id), 'medaglione-di-rosa'].sort(),
    'MVP = tutti i doni d\'oro più il Medaglione (pool unico stile Isaac, niente sblocchi della Fucina)');
  assert.equal(new Set(doni.map((d) => d.id)).size, 25, 'id unici');
  for (const d of oro) {
    assert.equal(d.scelta, null, `${d.id}: un dono d'oro non ha scelta`);
    assert.equal(d.sagoma.tipo, 'geometrica');
    assert.ok(!catalogo.sagome.vietate_oro.includes(d.sagoma.forma), `${d.id}: forma vietata`);
  }
  assert.equal(new Set(oro.map((d) => d.sagoma.forma)).size, 20, 'le forme d\'oro non si ripetono');
  for (const r of ricordi) {
    assert.equal(r.rarita, 'unico');
    assert.equal(r.sagoma.tipo, 'profilo');
    assert.ok(r.tag.includes('ricordo'));
    assert.notEqual(r.fonte, 'generico');
  }
  // i ricordi hanno una fonte reale in storia.json › oggetti
  const storia = JSON.parse(readFileSync(path.resolve(__dirname, '..', 'contenuti', 'storia.json'), 'utf8'));
  const oggetti = new Set(storia.oggetti.map((o) => o.id));
  for (const r of ricordi) assert.ok(oggetti.has(r.fonte), `${r.id}: fonte '${r.fonte}' assente in storia.json › oggetti`);
  for (const d of doni) {
    for (const t of d.tag) assert.ok(catalogo.tag.includes(t), `${d.id}: tag '${t}' fuori vocabolario`);
    if (d.richiede_flag) assert.ok(d.richiede_flag.flag in storia.flag, `${d.id}: richiede_flag su flag ignoto`);
    if (d.escludi_se_flag) assert.ok(d.escludi_se_flag.flag in storia.flag, `${d.id}: escludi_se_flag su flag ignoto`);
  }
});
