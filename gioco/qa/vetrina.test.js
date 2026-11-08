/**
 * gioco/qa/vetrina.test.js — Test di pagina della vetrina dei modelli del piano 1 (storia 017).
 *
 * Esecuzione: `node gioco/qa/vetrina.test.js` dalla radice del repository (Playwright preinstallato; non eseguire
 * mai `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice `gioco/`, apre
 * `qa/vetrina-stanze.html?grigi=1` e verifica: zero errori in console e di contenuto; i 14 modelli dell'indice
 * disegnati (6 normali 1×1, 2 doppie 2×1, ingresso, ricordo, boss, tesoro, banchetto, segreta), ognuno con il tag
 * di difficoltà; il filtro in scala di grigi attivo; per ogni modello il centro di ogni ostacolo e pericolo è una
 * sagoma scura (luminanza bassa) mentre il pavimento libero resta chiaro. Salva
 * `production/qa/evidence/vetrina-stanze-grigi.png` (pagina intera in scala di grigi) e, dopo aver tolto il filtro
 * dalla casella, `vetrina-stanze.png` a colori. Il server è chiuso nel `finally`.
 */

'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

const RADICE_GIOCO = path.resolve(__dirname, '..');
const CARTELLA_EVIDENZE = path.resolve(RADICE_GIOCO, '..', 'production', 'qa', 'evidence');
const EVIDENZA_GRIGI = path.join(CARTELLA_EVIDENZE, 'vetrina-stanze-grigi.png');
const EVIDENZA_COLORI = path.join(CARTELLA_EVIDENZE, 'vetrina-stanze.png');

/** Conteggi attesi per `tipo/dim` (criterio della storia 017). */
const CONTEGGI_ATTESI = { 'normale/1x1': 6, 'normale/2x1': 2, 'ingresso/1x1': 1, 'ricordo/1x1': 1, 'boss/1x1': 1, 'tesoro/1x1': 1, 'banchetto/1x1': 1, 'segreta/1x1': 1 };
const MODELLI_ATTESI = 14;
/** Soglie di lettura della sagoma (luminanza 0-255): sotto la prima è «nero», sopra la seconda è pavimento chiaro. */
const LUMINANZA_SAGOMA_MAX = 40;
const LUMINANZA_PAVIMENTO_MIN = 80;
const SIMBOLO_PAVIMENTO = '.';

function portaLibera() {
  return new Promise((risolvi, rifiuta) => {
    const s = net.createServer();
    s.once('error', rifiuta);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => risolvi(port));
    });
  });
}

async function attendiServer(url) {
  for (let i = 0; i < 100; i++) {
    const ok = await new Promise((r) => {
      const req = http.get(url, (res) => { res.resume(); r(res.statusCode < 500); });
      req.on('error', () => r(false));
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`il server statico non risponde su ${url}`);
}

async function avviaServer() {
  const porta = await portaLibera();
  const proc = spawn('python3', ['-m', 'http.server', String(porta), '--bind', '127.0.0.1', '--directory', RADICE_GIOCO], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  const base = `http://127.0.0.1:${porta}`;
  await attendiServer(`${base}/index.html`);
  return {
    base,
    chiudi: () => new Promise((r) => {
      if (proc.exitCode !== null) return r();
      proc.once('exit', () => r());
      proc.kill('SIGTERM');
      setTimeout(() => { if (proc.exitCode === null) proc.kill('SIGKILL'); }, 2000).unref();
    }),
  };
}

const esiti = [];
async function caso(nome, fn) {
  try {
    await fn();
    esiti.push({ nome, ok: true });
    console.log(`ok - ${nome}`);
  } catch (e) {
    esiti.push({ nome, ok: false, errore: e });
    console.log(`not ok - ${nome}\n  ${String(e && e.stack ? e.stack : e).split('\n').join('\n  ')}`);
  }
}

async function main() {
  const server = await avviaServer();
  let browser;
  try {
    browser = await chromium.launch();

    await caso('vetrina: 14 modelli del piano 1 in fil di ferro, conteggi e tag di difficoltà, zero errori, ostacoli e pericoli in sagoma nera in scala di grigi; screenshot', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}/qa/vetrina-stanze.html?grigi=1`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__vetrina && window.__vetrina.pronta);
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      const stato = await pagina.evaluate(() => {
        const v = window.__vetrina;
        return {
          grigi: v.grigi(), filtro: getComputedStyle(document.body).filter, errori: v.errori, conteggi: v.conteggi,
          modelli: v.modelli, schede: document.querySelectorAll('#griglia .modello canvas').length,
        };
      });
      assert.deepEqual(stato.errori, [], 'errori di contenuto nei modelli');
      assert.equal(stato.grigi, true);
      assert.match(stato.filtro, /grayscale\(1\)/, 'filtro in scala di grigi attivo sulla pagina');
      assert.equal(stato.modelli.length, MODELLI_ATTESI);
      assert.equal(stato.schede, MODELLI_ATTESI, 'un canvas per modello');
      assert.deepEqual(stato.conteggi, CONTEGGI_ATTESI);
      const tagDifficolta = { 1: 'facile', 2: 'media', 3: 'dura', 4: 'durissima', 5: 'picco' };
      for (const m of stato.modelli) assert.ok(m.tag.includes(tagDifficolta[m.difficolta]), `${m.id}: tag di difficoltà`);

      // ogni ostacolo e pericolo si legge in sagoma nera: centro scuro; il pavimento libero resta chiaro
      let sagome = 0;
      for (const m of stato.modelli) {
        // una stanza senza ostacoli (es. `piazza_aperta`) è legittima: il criterio riguarda gli ostacoli che ci sono
        const solidi = [...m.ostacoli, ...m.pericoli];
        for (const s of solidi) {
          const lum = await pagina.evaluate(([id, c, r]) => window.__vetrina.luminanza(id, c, r), [m.id, s.c, s.r]);
          assert.ok(lum !== null && lum < LUMINANZA_SAGOMA_MAX, `${m.id}: ${s.id} in (${s.c}, ${s.r}) non è una sagoma nera (luminanza ${lum})`);
          sagome++;
        }
        const r = m.griglia.findIndex((riga) => riga.includes(SIMBOLO_PAVIMENTO));
        const c = m.griglia[r].indexOf(SIMBOLO_PAVIMENTO);
        const lumPav = await pagina.evaluate(([id, cc, rr]) => window.__vetrina.luminanza(id, cc, rr), [m.id, c, r]);
        assert.ok(lumPav > LUMINANZA_PAVIMENTO_MIN, `${m.id}: il pavimento libero in (${c}, ${r}) non è chiaro (luminanza ${lumPav})`);
      }
      assert.ok(sagome > 0, 'almeno una sagoma verificata');

      fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
      await pagina.screenshot({ path: EVIDENZA_GRIGI, fullPage: true });
      assert.ok(fs.statSync(EVIDENZA_GRIGI).size > 0);

      // la casella toglie il filtro: screenshot a colori per confronto
      await pagina.click('#grigi');
      await pagina.waitForFunction(() => !window.__vetrina.grigi());
      const filtroDopo = await pagina.evaluate(() => getComputedStyle(document.body).filter);
      assert.equal(filtroDopo, 'none');
      await pagina.screenshot({ path: EVIDENZA_COLORI, fullPage: true });
      assert.ok(fs.statSync(EVIDENZA_COLORI).size > 0);
      assert.deepEqual(errori, [], `errori in console alla fine:\n${errori.join('\n')}`);
      await contesto.close();
    });
  } finally {
    if (browser) await browser.close();
    await server.chiudi();
  }

  const falliti = esiti.filter((e) => !e.ok);
  console.log(`\n${esiti.length - falliti.length}/${esiti.length} casi superati`);
  if (falliti.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
