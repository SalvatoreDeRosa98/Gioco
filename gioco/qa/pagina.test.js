/**
 * gioco/qa/pagina.test.js — Test di pagina con Playwright (storie 001-004).
 *
 * Esecuzione: `node gioco/qa/pagina.test.js` dalla radice del repository (Playwright è
 * preinstallato nella sessione; non eseguire mai `playwright install`).
 * Avvia `python3 -m http.server` su una porta libera con radice `gioco/`, apre la pagina in Chromium
 * e verifica: zero errori in console; `window.__gioco` presente con `?debug=1` e assente con `?debug=0` (index.html
 * dichiara la meta gioco-avvio `debug=1&wire=1&piano=1` come default della query: l'URL vince, e la pagina parte nel piano 1);
 * 60 ± 2 tick in 1000 ms di orologio; frame lungo recuperato con al massimo 5 tick; override
 * `?p.*` solo in debug; `prefers-reduced-motion` che azzera scossa e scie; tastiera diagonale
 * normalizzata; canvas scalato al contenitore senza scroll. Salva uno screenshot in
 * `production/qa/evidence/fondazione-pagina.png` e chiude il server alla fine.
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
const EVIDENZA = path.resolve(RADICE_GIOCO, '..', 'production', 'qa', 'evidence', 'fondazione-pagina.png');

/** Porta TCP libera scelta dal sistema. */
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

/** Attende che il server risponda su `url` (al massimo ~10 s). */
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

/** Avvia il server statico sulla cartella gioco/. */
async function avviaServer() {
  const porta = await portaLibera();
  const proc = spawn('python3', ['-m', 'http.server', String(porta), '--bind', '127.0.0.1', '--directory', RADICE_GIOCO], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  proc.stderr.on('data', (d) => { stderr += d; });
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
    stderr: () => stderr,
  };
}

/** Apre una pagina raccogliendo errori di console e di pagina. */
async function apri(browser, url, opzioni = {}) {
  const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...opzioni });
  const pagina = await contesto.newPage();
  const errori = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  pagina.on('pageerror', (e) => errori.push(String(e)));
  await pagina.goto(url, { waitUntil: 'load' });
  return { contesto, pagina, errori };
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

    await caso('debug: pagina senza errori, __gioco presente, 60 ± 2 tick in 1000 ms, frame lungo ≤ 5 tick', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=1&seme=1845`);
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato());
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      const superficie = await pagina.evaluate(() => ({
        stato: window.__gioco.stato,
        seme: window.__gioco.seme,
        tipi: ['tick', 'imposta', 'vaiA', 'estendi'].map((k) => typeof window.__gioco[k]),
        haParametri: typeof window.__gioco.parametri.get === 'function',
        vBase: window.__gioco.parametri.get('ferruccio.v_base'),
        portata: window.__gioco.parametri.get('combattimento.portata'),
        erroriContenuto: window.__gioco.parametri.errori(),
        imposta: window.__gioco.imposta('x', 1),
        vaiA: window.__gioco.vaiA('x'),
      }));
      assert.equal(superficie.stato, 'menu', 'storia P04: index.html parte nel menu di selezione (meta gioco-avvio debug=1)');
      assert.equal(superficie.seme, 1845);
      assert.deepEqual(superficie.tipi, ['function', 'function', 'function', 'function']);
      assert.ok(superficie.haParametri);
      assert.equal(typeof superficie.vBase, 'number');
      assert.equal(superficie.portata, 70);
      assert.deepEqual(superficie.erroriContenuto, []);
      assert.equal(superficie.imposta, false);
      assert.equal(superficie.vaiA, false);

      // 1000 ms di orologio → 60 ± 2 tick (misurati con performance.now nella pagina)
      await pagina.waitForFunction(() => window.__gioco.tick() > 10);
      const misura = await pagina.evaluate(() => new Promise((r) => {
        const t0 = window.__gioco.tick();
        const inizio = performance.now();
        setTimeout(() => r({ tick: window.__gioco.tick() - t0, ms: performance.now() - inizio }), 1000);
      }));
      const attesi = misura.ms / (1000 / 60);
      assert.ok(Math.abs(misura.tick - attesi) <= 2, `tick in ${misura.ms.toFixed(1)} ms: ${misura.tick} (attesi ${attesi.toFixed(1)} ± 2)`);
      console.log(`  tick in ${misura.ms.toFixed(1)} ms: ${misura.tick}`);

      // frame lungo 200 ms: al massimo 5 tick recuperati (guidando il ciclo a mano)
      const recupero = await pagina.evaluate(() => {
        const prima = window.__gioco.ciclo.contaTick();
        const n = window.__gioco.ciclo.frame(performance.now() + 200);
        return { n, dopo: window.__gioco.ciclo.contaTick() - prima };
      });
      assert.ok(recupero.n <= 5 && recupero.dopo <= 5, JSON.stringify(recupero));

      // tick(n) forzati
      const forzati = await pagina.evaluate(() => {
        const prima = window.__gioco.tick();
        return window.__gioco.tick(7) - prima;
      });
      assert.equal(forzati, 7);

      // canvas: 1280×720 logici scalati al contenitore, nessuno scroll
      const canvas = await pagina.evaluate(() => {
        const c = document.getElementById('scena');
        const r = c.getBoundingClientRect();
        return {
          w: r.width, h: r.height, bw: c.width, bh: c.height, dpr: window.devicePixelRatio,
          scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight,
          innerW: window.innerWidth, innerH: window.innerHeight,
        };
      });
      assert.ok(Math.abs(canvas.w / canvas.h - 16 / 9) < 0.01, `rapporto ${canvas.w}×${canvas.h}`);
      assert.ok(canvas.w <= canvas.innerW && canvas.h <= canvas.innerH);
      assert.equal(canvas.bw, Math.round(canvas.w * canvas.dpr));
      assert.equal(canvas.bh, Math.round(canvas.h * canvas.dpr));
      assert.ok(canvas.scrollW <= canvas.innerW && canvas.scrollH <= canvas.innerH, 'nessuno scroll');

      // tastiera: diagonale normalizzata e fronti letti dal tick
      await pagina.keyboard.down('KeyW');
      await pagina.keyboard.down('KeyD');
      await pagina.waitForFunction(() => window.__gioco.input.tenuto('su') && window.__gioco.input.tenuto('destra'));
      const dir = await pagina.evaluate(() => window.__gioco.input.direzione());
      assert.ok(Math.abs(Math.hypot(dir.x, dir.y) - 1) < 1e-9, JSON.stringify(dir));
      await pagina.keyboard.up('KeyW');
      await pagina.keyboard.up('KeyD');
      await pagina.mouse.move(640, 360);
      const mouse = await pagina.evaluate(() => window.__gioco.input.mouse());
      assert.ok(Math.abs(mouse.x - 640) < 2 && Math.abs(mouse.y - 360) < 2, JSON.stringify(mouse));

      // eventi: payload nello stesso tick, errore isolato
      const bus = await pagina.evaluate(() => {
        const ricevuti = [];
        const off = window.__gioco.eventi.on('nemico.morto', (p) => ricevuti.push(p));
        window.__gioco.eventi.on('nemico.morto', () => { throw new Error('ascoltatore rotto (atteso)'); });
        window.__gioco.eventi.emit('nemico.morto', { id: 'g1', x: 1, y: 2 });
        off();
        window.__gioco.eventi.emit('nemico.morto', { id: 'g2', x: 3, y: 4 });
        window.__gioco.eventi.azzera();
        return ricevuti;
      });
      assert.deepEqual(bus, [{ id: 'g1', x: 1, y: 2 }]);
      // l'errore dell'ascoltatore è loggato una volta (console.error) e non ha fermato gli altri
      const loggati = errori.filter((e) => e.includes('ascoltatore rotto'));
      assert.equal(loggati.length, 2, 'un log per ciascuna delle due emissioni');
      errori.length = 0;

      fs.mkdirSync(path.dirname(EVIDENZA), { recursive: true });
      await pagina.screenshot({ path: EVIDENZA });
      assert.ok(fs.statSync(EVIDENZA).size > 0);
      assert.deepEqual(errori, []);
      await contesto.close();
    });

    await caso('debug: override ?p.combattimento.portata=90 vale 90', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=1&p.combattimento.portata=90`);
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato());
      assert.equal(await pagina.evaluate(() => window.__gioco.parametri.get('combattimento.portata')), 90);
      assert.deepEqual(errori, []);
      await contesto.close();
    });

    await caso('debug: override fuori range è segnalato in console come errore di contenuto', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=1&p.combattimento.portata=900`);
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato());
      assert.equal(await pagina.evaluate(() => window.__gioco.parametri.get('combattimento.portata')), 96);
      assert.equal(errori.length, 1, errori.join('\n'));
      assert.ok(errori[0].includes('[parametri]') && errori[0].includes('fuori'));
      await contesto.close();
    });

    await caso('debug: prefers-reduced-motion azzera scossa e scie dai parametri', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=1`, { reducedMotion: 'reduce' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato());
      const v = await pagina.evaluate(() => ({
        ridotto: window.__gioco.motoRidotto,
        scossa: window.__gioco.parametri.get('ferruccio.feel.scossa_px'),
        scia: window.__gioco.parametri.get('ferruccio.feel.copie_scia'),
        scossaParata: window.__gioco.parametri.get('combattimento.feel.scossa_parata_px'),
      }));
      assert.deepEqual(v, { ridotto: true, scossa: 0, scia: 0, scossaParata: 0 });
      assert.deepEqual(errori, []);
      await contesto.close();
    });

    await caso('senza debug (debug=0 vince sul default della meta gioco-avvio): __gioco assente, override ignorato, nessun errore', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=0&p.combattimento.portata=90`);
      await pagina.waitForTimeout(500);
      assert.equal(await pagina.evaluate(() => typeof window.__gioco), 'undefined');
      assert.deepEqual(errori, []);
      // la pagina gira: il canvas ha il colore di fondo dal token
      const fondo = await pagina.evaluate(() => {
        const c = document.getElementById('scena');
        const px = c.getContext('2d').getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
        const token = getComputedStyle(document.documentElement).getPropertyValue('--colore-fondo').trim();
        return { px: Array.from(px).slice(0, 3), token };
      });
      const atteso = [1, 3, 5].map((i) => parseInt(fondo.token.slice(i, i + 2), 16));
      assert.deepEqual(fondo.px, atteso, `fondo ${JSON.stringify(fondo)}`);
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
