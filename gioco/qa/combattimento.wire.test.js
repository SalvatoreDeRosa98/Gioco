/**
 * gioco/qa/combattimento.wire.test.js — Test di pagina del modo diagnostico `wire` (storie 007-011).
 *
 * Esecuzione: `node gioco/qa/combattimento.wire.test.js` dalla radice del repository (Playwright
 * preinstallato; non eseguire mai `playwright install`). Avvia `python3 -m http.server` su una porta
 * libera con radice `gioco/`, apre `?debug=1&wire=1&seme=1845&fantoccio=attacca`, ferma il ciclo rAF
 * e lo guida a tick forzati via `window.__gioco` (`tieni`, `lascia`, `premi`, `tick`): cammina verso
 * il fantoccio, lo colpisce con un fendente (evento `ferruccio.colpo`, vita che scende), scatta, para
 * (alone della finestra), si fa colpire dal fantoccio che attacca a ciclo (maschere 4). Verifica zero
 * errori in console e salva `production/qa/evidence/combattimento-wire.png` con il fendente attivo.
 * Il server è chiuso nel `finally`.
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
const EVIDENZA = path.resolve(RADICE_GIOCO, '..', 'production', 'qa', 'evidence', 'combattimento-wire.png');

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

    await caso('wire: pagina senza errori, stato notte, Ferruccio cammina, colpisce, scatta, para, subisce il Colpo; screenshot', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      // piano=0 annulla il piano=1 della meta gioco-avvio di index.html: resta la scena di prova con i fantocci
      await pagina.goto(`${server.base}/?debug=1&wire=1&piano=0&seme=1845&fantoccio=attacca`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato());
      await pagina.waitForFunction(() => window.__gioco.tick() > 5);
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      const iniziale = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.ciclo.ferma(); // da qui in avanti il ciclo è guidato a mano: tutto deterministico
        return {
          stato: g.stato, wire: g.wire, tipi: ['premi', 'tieni', 'lascia'].map((k) => typeof g[k]),
          corpo: g.ferruccio.stato, attacco: g.combattimento.stato, maschere: g.ferruccio.maschere,
          cariche: g.ferruccio.cariche, bersagli: g.bersagli.map((b) => ({ id: b.id, vita: b.vita, stato: b.stato })),
          x: g.ferruccio.x, y: g.ferruccio.y, erroriContenuto: g.parametri.errori(),
        };
      });
      assert.equal(iniziale.stato, 'notte');
      assert.equal(iniziale.wire, true);
      assert.deepEqual(iniziale.tipi, ['function', 'function', 'function']);
      assert.equal(iniziale.corpo, 'fermo');
      assert.equal(iniziale.attacco, 'pronto');
      assert.equal(iniziale.maschere, 5);
      assert.equal(iniziale.cariche, 1);
      assert.equal(iniziale.bersagli.length, 4);
      assert.deepEqual(iniziale.erroriContenuto, []);
      assert.ok(Math.abs(iniziale.x - 640) < 1 && Math.abs(iniziale.y - 360) < 1, `partenza ${iniziale.x},${iniziale.y}`);

      // cammina a destra per 20 tick, poi fendente: il fantoccio 'destra' (128 px) perde vita
      const colpo = await pagina.evaluate(() => {
        const g = window.__gioco;
        const eventi = [];
        for (const nome of ['ferruccio.colpo', 'ferruccio.scatto', 'ferruccio.parata', 'ferruccio.danno', 'ferruccio.parata_mancata']) {
          g.eventi.on(nome, (p) => eventi.push({ nome, danno: p.danno ?? null, bersaglio: p.bersaglio?.id ?? null }));
        }
        window.__eventiWire = eventi;
        const x0 = g.ferruccio.x;
        g.tieni('destra');
        g.tick(20);
        g.lascia('destra');
        const dx = g.ferruccio.x - x0;
        g.premi('attacco', 1);
        g.tick(5); // startup 5 tick → primo tick attivo
        const hitbox = g.combattimento.hitboxCorrente();
        return {
          dx, statoCorpo: g.ferruccio.stato, statoAttacco: g.combattimento.stato, fase: g.combattimento.fase, hitbox,
          vitaDestra: g.bersagli.find((b) => b.id === 'destra').vita,
        };
      });
      assert.ok(colpo.dx > 50 && colpo.dx < 80, `camminato ${colpo.dx.toFixed(1)} px in 20 tick`);
      assert.equal(colpo.statoAttacco, 'fendente');
      assert.equal(colpo.fase, 'attivo');
      assert.equal(colpo.hitbox.tipo, 'settore');
      assert.equal(colpo.hitbox.arcoGradi, 110);
      assert.equal(colpo.vitaDestra, 5, 'il fantoccio a destra ha perso 1 vita');

      // screenshot con il settore del fendente attivo (evidenza)
      fs.mkdirSync(path.dirname(EVIDENZA), { recursive: true });
      await pagina.screenshot({ path: EVIDENZA });
      assert.ok(fs.statSync(EVIDENZA).size > 0);

      // qualcosa è stato disegnato oltre al fondo: il pixel al centro del campo non è il colore di fondo
      const pixel = await pagina.evaluate(() => {
        const c = document.getElementById('scena');
        const ctx = c.getContext('2d');
        const scala = c.width / 1280;
        const px = ctx.getImageData(Math.floor(640 * scala), Math.floor(80 * scala), 1, 1).data; // dentro il muro nord → fondo
        const centro = ctx.getImageData(Math.floor(500 * scala), Math.floor(300 * scala), 1, 1).data; // pavimento
        return { fondo: Array.from(px).slice(0, 3), pavimento: Array.from(centro).slice(0, 3) };
      });
      assert.notDeepEqual(pixel.fondo, pixel.pavimento, 'pavimento disegnato sopra il fondo');

      // scatto a destra: 180 px in 10 tick, invulnerabile
      const scatto = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.tick(30); // fine del fendente
        const x0 = g.ferruccio.x;
        g.premi('scatto', 1);
        const stato = g.ferruccio.stato;
        const inv = g.ferruccio.invulnerabile();
        g.tick(9);
        return { stato, inv, dx: g.ferruccio.x - x0, dopo: g.ferruccio.stato, cariche: g.ferruccio.cariche };
      });
      assert.equal(scatto.stato, 'scatta');
      assert.equal(scatto.inv, true);
      assert.ok(scatto.dx > 100, `scattato di ${scatto.dx.toFixed(1)} px (fermato dal fantoccio/muro se minore di 180)`);
      assert.equal(scatto.dopo, 'recupero_scatto');
      assert.equal(scatto.cariche, 0);

      // parata: alone della finestra dopo lo startup
      const parata = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.tick(10);
        g.premi('parata', 1);
        const inizio = g.combattimento.stato;
        g.tick(2);
        const h = g.combattimento.hitboxCorrente();
        g.tick(30);
        return { inizio, h, dopo: g.combattimento.stato };
      });
      assert.equal(parata.inizio, 'parata');
      assert.equal(parata.h.tipo, 'parata');
      assert.equal(parata.h.fase, 'finestra');
      assert.ok(parata.dopo === 'pronto' || parata.dopo === 'parata');

      // il fantoccio automatico colpisce: Ferruccio perde una maschera (o para, se la finestra coincide)
      const danno = await pagina.evaluate(() => {
        const g = window.__gioco;
        const attaccante = g.bersagli.find((b) => b.id === 'attaccante');
        for (let i = 0; i < 400 && attaccante.impatti.length === 0; i++) g.tick(1);
        return { impatti: attaccante.impatti, maschere: g.ferruccio.maschere, corpo: g.ferruccio.stato, eventi: window.__eventiWire };
      });
      assert.deepEqual(danno.impatti, ['danno']);
      assert.equal(danno.maschere, 4);
      assert.ok(danno.eventi.some((e) => e.nome === 'ferruccio.colpo' && e.bersaglio === 'destra' && e.danno === 1), JSON.stringify(danno.eventi));
      assert.ok(danno.eventi.some((e) => e.nome === 'ferruccio.scatto'));
      assert.ok(danno.eventi.some((e) => e.nome === 'ferruccio.danno' && e.danno === 1));

      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });

    await caso('senza wire (wire=0 vince sulla meta gioco-avvio): __gioco non espone la scena diagnostica, nessun fantoccio, stato menu', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}/?debug=1&wire=0&seme=1845`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato());
      const v = await pagina.evaluate(() => ({ wire: window.__gioco.wire, stato: window.__gioco.stato, bersagli: window.__gioco.bersagli.length }));
      assert.deepEqual(v, { wire: false, stato: 'menu', bersagli: 0 });
      assert.deepEqual(errori, []);
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
