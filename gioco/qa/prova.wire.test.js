/**
 * gioco/qa/prova.wire.test.js — Pagina di prova (storia P02, PROVVISORIA). Playwright: avvia un server statico su
 * una porta libera con radice `gioco/`, apre `prova.html?debug=1&seme=1845` (la meta `gioco-avvio` deve dare da sola
 * wire e hub), verifica zero errori, `__gioco` presente, ciclo in `hub`, pannello dei tasti visibile che sparisce al
 * primo tasto; poi che `index.html` senza parametri non mostri il pannello. Salva
 * `production/qa/evidence/prova-pagina.png`. Esecuzione: `node gioco/qa/prova.wire.test.js`.
 */

'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { chromium } = require('playwright');

const RADICE_GIOCO = path.resolve(__dirname, '..');
const EVIDENZA = path.resolve(RADICE_GIOCO, '..', 'production', 'qa', 'evidence', 'prova-pagina.png');

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

async function apri(browser, url) {
  const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pagina = await contesto.newPage();
  const errori = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  pagina.on('pageerror', (e) => errori.push(String(e)));
  await pagina.goto(url, { waitUntil: 'load' });
  return { contesto, pagina, errori };
}

const esiti = [];
async function caso(nome, fn) {
  try { await fn(); esiti.push({ nome, ok: true }); console.log(`ok - ${nome}`); }
  catch (e) { esiti.push({ nome, ok: false }); console.log(`not ok - ${nome}\n  ${String(e && e.stack ? e.stack : e).split('\n').join('\n  ')}`); }
}

async function main() {
  const server = await avviaServer();
  let browser;
  try {
    browser = await chromium.launch();

    await caso('prova.html: la meta gioco-avvio dà wire e hub, pannello dei tasti visibile, sparisce al primo tasto, zero errori', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/prova.html?debug=1&seme=1845`);
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato());
      await pagina.waitForFunction(() => window.__gioco.stato === 'hub');
      const prima = await pagina.evaluate(() => ({
        stato: window.__gioco.stato,
        seme: window.__gioco.seme,
        pannello: window.__gioco.pannelloProva(),
        pannelloDom: Boolean(document.querySelector('#interfaccia .prova')),
        righe: Array.from(document.querySelectorAll('#interfaccia .prova-riga')).map((e) => e.textContent),
        hub: Boolean(window.__gioco.hub && window.__gioco.hub.attivo),
      }));
      assert.equal(prima.stato, 'hub');
      assert.equal(prima.seme, 1845, 'l\'URL vince sulla meta per il seme');
      assert.equal(prima.pannello, true);
      assert.equal(prima.pannelloDom, true);
      assert.ok(prima.righe.length >= 3, 'righe delle istruzioni');
      assert.ok(prima.righe.join(' ').includes('fendente'), 'le istruzioni nominano il fendente');
      assert.equal(prima.hub, true);
      await pagina.waitForTimeout(300);
      await pagina.screenshot({ path: EVIDENZA });
      await pagina.keyboard.press('KeyD');
      await pagina.waitForTimeout(100);
      const dopo = await pagina.evaluate(() => ({
        pannello: window.__gioco.pannelloProva(),
        pannelloDom: Boolean(document.querySelector('#interfaccia .prova')),
        tocco: 'tocco' in window.__gioco,
      }));
      assert.equal(dopo.pannello, false);
      assert.equal(dopo.pannelloDom, false);
      assert.equal(dopo.tocco, false, 'nessun controllo touch: il gioco è da tastiera');
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });

    await caso('index.html senza meta: nessun pannello di prova, pannelloProva() è null', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=1&seme=1845`);
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato());
      const r = await pagina.evaluate(() => ({ pannello: window.__gioco.pannelloProva(), dom: Boolean(document.querySelector('#interfaccia .prova')), stato: window.__gioco.stato }));
      assert.equal(r.pannello, null);
      assert.equal(r.dom, false);
      assert.equal(r.stato, 'menu');
      assert.deepEqual(errori, []);
      await contesto.close();
    });
  } finally {
    if (browser) await browser.close();
    await server.chiudi();
  }
  const falliti = esiti.filter((e) => !e.ok).length;
  console.log(`\n${esiti.length - falliti}/${esiti.length} casi superati`);
  process.exit(falliti ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
