/**
 * gioco/qa/stati64.js — Copertura dei 64 stati narrativi (GDD stato-narrativo.md, formula
 * `numero_percorsi` e criterio «ogni ordine da 10 a 110 ha una scena epilogo»; ADR-0004). Storia 026.
 *
 * Esecuzione: `node gioco/qa/stati64.js` dalla radice. Forza, con `imposta`, ciascuna delle 2^5 × 2 = 64
 * combinazioni dei cinque flag di percorso × il flag del finale (letti da storia.json e narrativa.json,
 * non scritti qui), con nessuna scena vista, e per ogni ordine da 10 a 110 (passo 10) del capitolo dopo
 * il finale verifica che esista almeno una scena disponibile. Stampa i buchi per ordine e per stato e
 * i conflitti (due scene allo stesso ordine). È lecito trovare buchi: sono di contenuto, e vanno
 * riportati, non nascosti. Codice di uscita: 0 nessun buco, 2 buchi di contenuto, 1 errore dello script.
 * File CommonJS (nessun package.json): i moduli ES si caricano con `import()`.
 */

'use strict';

const { readFileSync } = require('node:fs');
const path = require('node:path');

const CONTENUTI = path.resolve(__dirname, '..', 'contenuti');
const MOTORE = path.resolve(__dirname, '..', 'motore');
const leggi = (nome) => JSON.parse(readFileSync(path.join(CONTENUTI, `${nome}.json`), 'utf8'));

const ORDINE_MIN = 10;
const ORDINE_MAX = 110;
const PASSO = 10;

async function main() {
  const { crea } = await import(`file://${path.join(MOTORE, 'storia', 'stato-narrativo.js')}`);
  const storia = leggi('storia');
  const regole = leggi('narrativa');
  const ancoraggi = leggi('ancoraggi');
  const capitolo = regole.piani.capitolo_dopo_finale;
  const flagFinale = regole.finale.flag;
  const voci = [];
  const log = { error: (...a) => voci.push(a.map(String).join(' ')) };
  const sn = crea({ storia, regole, ancoraggi, log });
  if (sn.errori().length) {
    console.error('schema con errori:', sn.errori());
    process.exit(1);
  }
  const percorso = sn.decisioni().filter((f) => f !== flagFinale);
  const valori = Object.fromEntries(sn.decisioni().map((f) => [f, storia.flag[f].valori]));
  const totale = 2 ** percorso.length * valori[flagFinale].length;
  const ordini = [];
  for (let o = ORDINE_MIN; o <= ORDINE_MAX; o += PASSO) ordini.push(o);
  const ordiniPresenti = new Set(storia.scene.filter((s) => s.capitolo === capitolo).map((s) => s.ordine));

  console.log(`stati64 — capitolo '${capitolo}', flag di percorso: ${percorso.join(', ')}; finale: ${flagFinale}; stati: ${totale}`);
  console.log(`ordini verificati: ${ORDINE_MIN}..${ORDINE_MAX} (passo ${PASSO}); ordini presenti nel capitolo: ${Array.from(ordiniPresenti).sort((a, b) => a - b).join(', ')}`);

  const buchiPerOrdine = new Map(ordini.map((o) => [o, []]));
  const statiConBuchi = [];
  let statiCompleti = 0;
  for (let n = 0; n < totale; n++) {
    const stato = {};
    let resto = n;
    for (const f of percorso) {
      stato[f] = valori[f][resto % 2];
      resto = Math.floor(resto / 2);
    }
    stato[flagFinale] = valori[flagFinale][resto % valori[flagFinale].length];
    for (const [f, v] of Object.entries(stato)) {
      const esito = sn.imposta(f, v);
      if (!esito.ok) throw new Error(`imposta(${f}, ${v}): ${esito.motivo}`);
    }
    const disponibili = sn.disponibiliPer((s) => s.capitolo === capitolo);
    const coperti = new Set(disponibili.map((s) => s.ordine));
    const mancanti = ordini.filter((o) => !coperti.has(o));
    const etichetta = Object.entries(stato).map(([f, v]) => `${f}=${v}`).join(' ');
    if (mancanti.length === 0) statiCompleti += 1;
    else {
      statiConBuchi.push({ etichetta, mancanti });
      for (const o of mancanti) buchiPerOrdine.get(o).push(etichetta);
    }
  }

  console.log(`\nstati completi: ${statiCompleti}/${totale}`);
  const conBuchi = ordini.filter((o) => buchiPerOrdine.get(o).length > 0);
  if (conBuchi.length === 0) console.log('nessun buco: ogni ordine ha almeno una scena in ogni stato.');
  else {
    console.log('\nBUCHI per ordine (stati senza nessuna scena disponibile):');
    for (const o of conBuchi) {
      const stati = buchiPerOrdine.get(o);
      const scene = storia.scene.filter((s) => s.capitolo === capitolo && s.ordine === o).map((s) => `${s.id} quando=${JSON.stringify(s.quando)}`);
      // riassunto: quale valore del finale manca
      const perFinale = {};
      for (const e of stati) {
        const v = e.match(new RegExp(`${flagFinale}=(\\S+)`))[1];
        perFinale[v] = (perFinale[v] ?? 0) + 1;
      }
      console.log(`  ordine ${o}: ${stati.length}/${totale} stati senza scena — per ${flagFinale}: ${JSON.stringify(perFinale)}${ordiniPresenti.has(o) ? '' : ' (nessuna scena a quest\'ordine nel file)'}`);
      for (const s of scene) console.log(`      scena presente: ${s}`);
    }
    console.log(`\nstati con almeno un buco: ${statiConBuchi.length}/${totale}; primi 4:`);
    for (const s of statiConBuchi.slice(0, 4)) console.log(`  ${s.etichetta} → mancano ${s.mancanti.join(', ')}`);
  }
  const conflitti = voci.filter((v) => v.includes('stesso ordine'));
  console.log(`\nconflitti (due scene disponibili allo stesso ordine): ${conflitti.length}`);
  for (const c of Array.from(new Set(conflitti)).slice(0, 10)) console.log(`  ${c}`);
  const altri = voci.filter((v) => !v.includes('stesso ordine'));
  if (altri.length) {
    console.log(`\naltri errori di contenuto (${altri.length}):`);
    for (const a of Array.from(new Set(altri)).slice(0, 10)) console.log(`  ${a}`);
  }
  process.exit(conBuchi.length === 0 && conflitti.length === 0 ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
