/**
 * gioco/qa/fili.wire.test.js — Test di pagina dei due fili d'oro per marionetta (regola dell'autore, 2026-11-09).
 *
 * Esecuzione: `node gioco/qa/fili.wire.test.js` dalla radice (Playwright preinstallato; mai `playwright install`).
 * Avvia `python3 -m http.server` su una porta libera con radice `gioco/`. Due casi con il renderer pixel-art:
 *  1. hub di Piazza Dante (`?debug=1&hub=1&piano=0&seme=1845`): Tonino è una marionetta del Velo → `__gioco.resa.fili()`
 *     conta marionette ≥ 1 e fili = 2 × marionette, spessore 1 e alpha nel 25-35 %; screenshot `fili-hub.png`;
 *  2. piano 1 con un nemico vero (`&nemico=gatto`): stessa regola; screenshot `fili-marionette.png`.
 * Ferruccio non entra mai nel conteggio (ha spezzato i fili). Zero errori in console. Server chiuso nel `finally`.
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
const RESA = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'parametri', 'resa.json'), 'utf8'));
const SEME = 1845;

function portaLibera() {
  return new Promise((risolvi, rifiuta) => {
    const s = net.createServer();
    s.once('error', rifiuta);
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => risolvi(port)); });
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
  const proc = spawn('python3', ['-m', 'http.server', String(porta), '--bind', '127.0.0.1', '--directory', RADICE_GIOCO], { stdio: ['ignore', 'ignore', 'pipe'] });
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
  try { await fn(); esiti.push({ nome, ok: true }); console.log(`ok - ${nome}`); }
  catch (e) { esiti.push({ nome, ok: false, errore: e }); console.log(`not ok - ${nome}\n  ${String(e && e.stack ? e.stack : e).split('\n').join('\n  ')}`); }
}

/** Legge i fili dell'ultimo frame e verifica la regola: due per marionetta, 1 px, oro al 25-35 %. */
async function verificaFili(pagina, minimoMarionette) {
  await pagina.waitForFunction((n) => window.__gioco.resa.fili().marionette >= n, minimoMarionette, { timeout: 15000 });
  const f = await pagina.evaluate(() => window.__gioco.resa.fili());
  assert.ok(f.marionette >= minimoMarionette, `marionette: ${f.marionette}`);
  assert.equal(f.fili, 2 * f.marionette, 'ogni marionetta ha esattamente due fili (uno per Mano)');
  assert.equal(f.spessore, RESA.fili.spessore.base);
  assert.equal(f.spessore, 1, 'linea di 1 px');
  assert.ok(f.alpha >= 0.25 && f.alpha <= 0.35, `alpha ${f.alpha} nel 25-35 %`);
  return f;
}

async function main() {
  const server = await avviaServer();
  fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch();
    const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const pagina = await contesto.newPage();
    const errori = [];
    pagina.on('pageerror', (e) => errori.push(String(e)));
    pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });

    await caso('hub di Piazza Dante: Tonino pende da due fili (Mano sinistra e destra), 1 px, oro al 25-35 %; screenshot fili-hub.png', async () => {
      await pagina.goto(`${server.base}/?debug=1&hub=1&piano=0&seme=${SEME}`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.hub && window.__gioco.hub.attivo);
      const f = await verificaFili(pagina, 1);
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'fili-hub.png') });
      console.log(`  hub: marionette ${f.marionette}, fili ${f.fili}, alpha ${f.alpha}, spessore ${f.spessore}`);
    });

    await caso('piano 1 con un nemico vero: due fili per marionetta, mai su Ferruccio; screenshot fili-marionette.png', async () => {
      await pagina.goto(`${server.base}/?debug=1&piano=1&seme=${SEME}&nemico=gatto`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano);
      await pagina.waitForFunction(() => window.__gioco.bersagli.some((b) => b.id === 'nemico-prova'));
      const f = await verificaFili(pagina, 1);
      const vivi = await pagina.evaluate(() => window.__gioco.bersagli.filter((b) => b.stato !== 'morto').length);
      assert.equal(f.marionette, vivi, 'tutte e sole le marionette vive hanno i fili (Ferruccio escluso)');
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'fili-marionette.png') });
      console.log(`  piano 1: marionette ${f.marionette}, fili ${f.fili}`);
    });

    await caso('zero errori in console', async () => { assert.deepEqual(errori, []); });
    await contesto.close();
  } finally {
    if (browser) await browser.close();
    await server.chiudi();
  }
  const falliti = esiti.filter((e) => !e.ok).length;
  console.log(`# ${esiti.length - falliti}/${esiti.length} casi verdi`);
  process.exit(falliti ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
