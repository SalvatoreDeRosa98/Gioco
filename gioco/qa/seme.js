/**
 * gioco/qa/seme.js — Genera N piani e riporta violatori dei vincoli e distribuzione dei tipi.
 *
 * Esecuzione: `node gioco/qa/seme.js [N] [--piano P] [--seme S0] [--stampa K]` dalla radice del
 * repository. Genera i piani con i semi S0..S0+N−1 (default N = 200, S0 = 1, piano 1), usa i JSON
 * reali di `contenuti/`, e stampa: violatori (piani con violazioni H1-H10 dopo la consegna), origine
 * (generato / migliore / riserva), tentativi medi, Q media/min/max, distribuzione dei tipi e delle
 * dimensioni, usi dei modelli, tempo per piano. Con `--stampa K` disegna le prime K piante in ASCII.
 * Architettura §7 («Generazione con stanze morte»): questo è lo strumento che riporta i violatori.
 * Esce con codice 1 se c'è almeno un violatore.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import { creaParametri } from '../motore/fondazione/parametri.js';
import { caricaModelli, creaCatalogo, regoleDaParametri, validaParametriGenerazione } from '../motore/mondo/modelli.js';
import { generaPiano, validaPianta } from '../motore/mondo/generazione.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const leggi = (percorso) => JSON.parse(readFileSync(join(RADICE, percorso), 'utf8'));

const LETTERE = { ingresso: 'I', normale: 'N', tesoro: 'T', banchetto: 'Q', boss: 'B', segreta: 'S', ricordo: 'M' };

/** Disegno ASCII della pianta (celle con la lettera del tipo, doppie con due lettere). */
export function disegnaPianta(pianta, corrente = null) {
  const righe = [];
  for (let y = 0; y < pianta.griglia.h; y++) {
    let riga = '';
    for (let x = 0; x < pianta.griglia.w; x++) {
      const s = pianta.stanze.find((st) => st.celle.some((c) => c[0] === x && c[1] === y));
      let l = s ? LETTERE[s.tipo] : '.';
      if (s && s.id === corrente) l = l.toLowerCase();
      riga += ` ${l} `;
    }
    righe.push(riga);
  }
  return righe.join('\n');
}

export async function caricaTutto() {
  const parametri = creaParametri({ log: { error: () => {} } });
  await parametri.carica({
    caricatore: (nome) => leggi(`contenuti/parametri/${nome}.json`),
    statistiche: ['ferruccio', 'combattimento', 'stanza', 'stanze', 'generazione'],
    tabelle: ['input'],
  });
  const indice = leggi('contenuti/modelli-stanza/piazza-dante/indice.json');
  const { modelli, errori } = await caricaModelli({
    caricatore: (nome) => leggi(`contenuti/modelli-stanza/piazza-dante/${nome}.json`),
    indice,
    regole: regoleDaParametri(parametri),
    log: { error: () => {} },
  });
  const riserva = leggi('contenuti/piani/piazza-dante-riserva.json');
  return { parametri, catalogo: creaCatalogo(modelli), erroriModelli: [...errori, ...parametri.errori(), ...validaParametriGenerazione(parametri)], riserva };
}

async function main() {
  const argv = process.argv.slice(2);
  const N = Number(argv.find((a) => /^\d+$/.test(a)) ?? 200);
  const opz = (nome, def) => {
    const i = argv.indexOf(nome);
    return i >= 0 ? Number(argv[i + 1]) : def;
  };
  const piano = opz('--piano', 1);
  const seme0 = opz('--seme', 1);
  const stampa = opz('--stampa', 0);
  const { parametri, catalogo, erroriModelli, riserva } = await caricaTutto();
  if (erroriModelli.length) {
    console.log(`errori di contenuto (${erroriModelli.length}):\n  ${erroriModelli.join('\n  ')}`);
  }
  const origini = { generato: 0, migliore: 0, riserva: 0 };
  const tipi = {};
  const dim = { '1x1': 0, '2x1': 0 };
  const usi = {};
  const violatori = [];
  let tentativi = 0;
  let qSomma = 0;
  let qMin = Infinity;
  let qMax = -Infinity;
  let conSegreta = 0;
  const t0 = performance.now();
  for (let i = 0; i < N; i++) {
    const seme = seme0 + i;
    const esito = generaPiano({ seme, piano, parametri, catalogo, riserva, log: { error: () => {} } });
    origini[esito.origine] += 1;
    tentativi += esito.tentativi;
    const v = validaPianta(esito.pianta, { parametri, catalogo });
    if (v.length) violatori.push({ seme, violazioni: v, origine: esito.origine });
    qSomma += esito.pianta.Q;
    qMin = Math.min(qMin, esito.pianta.Q);
    qMax = Math.max(qMax, esito.pianta.Q);
    if (esito.pianta.segreta) conSegreta += 1;
    for (const s of esito.pianta.stanze) {
      tipi[s.tipo] = (tipi[s.tipo] ?? 0) + 1;
      dim[s.dim] += 1;
      usi[s.modello] = (usi[s.modello] ?? 0) + 1;
    }
    if (i < stampa) {
      console.log(`\nseme ${seme} · piano ${piano} · Q ${esito.pianta.Q} · ${esito.origine} (tentativo ${esito.pianta.tentativo})`);
      console.log(disegnaPianta(esito.pianta));
    }
  }
  const ms = performance.now() - t0;
  console.log(`\npiani generati: ${N} (piano ${piano}, semi ${seme0}..${seme0 + N - 1}) in ${ms.toFixed(0)} ms (${(ms / N).toFixed(2)} ms/piano)`);
  console.log(`origine: generato ${origini.generato} · migliore ${origini.migliore} · riserva ${origini.riserva}; tentativi medi ${(tentativi / N).toFixed(2)}`);
  console.log(`Q: media ${(qSomma / N).toFixed(1)} · min ${qMin} · max ${qMax}; piani con segreta: ${conSegreta}`);
  console.log(`tipi: ${Object.entries(tipi).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  console.log(`dimensioni: 1x1 ${dim['1x1']} · 2x1 ${dim['2x1']}`);
  console.log(`usi dei modelli: ${Object.entries(usi).sort().map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  console.log(`violatori: ${violatori.length}`);
  for (const v of violatori.slice(0, 10)) console.log(`  seme ${v.seme} (${v.origine}): ${v.violazioni.join('; ')}`);
  if (violatori.length) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
