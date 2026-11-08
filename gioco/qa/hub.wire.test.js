/**
 * gioco/qa/hub.wire.test.js — Test di pagina della storia 029: l'hub di Piazza Dante in fil di ferro.
 *
 * Esecuzione: `node gioco/qa/hub.wire.test.js` dalla radice (Playwright preinstallato; non eseguire mai
 * `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice `gioco/`, apre
 * `?debug=1&wire=1&hub=1&seme=1845`: il ciclo è in `hub`, alla notte 1 la targa parte da sola (cartiglio),
 * le presenze sono Tonino al banchetto, la porta della bottega chiusa, la finestra accesa di Mariella, la luna, i
 * fili d'oro e l'ingresso al piano 1; Taddeo e Agnese assenti; screenshot `production/qa/evidence/hub-wire.png`.
 * Con `taddeo = perdonato` e `agnese = risvegliata` (via `__gioco.imposta`) Taddeo e Agnese compaiono; screenshot
 * `hub-presenze.png`. Vicino a Tonino `interagisci` apre il primo incontro senza mettere il ciclo in pausa (nell'hub
 * non serve) e il cartellino DOM suggerisce il tasto. Camminando nell'ingresso parte la notte: ciclo in `notte`, piano 1
 * generato con il seme derivato dal profilo (≠ 1845, = `hub.semeNotte()`), stanza d'ingresso, `notte` dell'avanzamento
 * ancora 1. Zero errori in console.
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
const EVIDENZE = {
  hub: path.join(CARTELLA_EVIDENZE, 'hub-wire.png'),
  presenze: path.join(CARTELLA_EVIDENZE, 'hub-presenze.png'),
};
const SEME = 1845;

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

    await caso('hub: ciclo in `hub`, targa automatica alla notte 1, presenze base e per stato, Tonino, partenza con seme derivato; due screenshot', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}/?debug=1&wire=1&hub=1&seme=${SEME}`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.hub && window.__gioco.hub.attivo);
      await pagina.evaluate(() => window.__gioco.ciclo.ferma());
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      const base = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.tick(2);
        const presenze = Object.fromEntries(g.hub.presenze().map((p) => [p.id, { tipo: p.tipo, presente: p.presente, stato: p.stato, accesa: p.accesa ?? null }]));
        return {
          stato: g.stato, seme: g.seme, piano: g.piano, dialogo: g.dialogo() ? { id: g.dialogo().id } : null,
          cartiglio: document.querySelector('#interfaccia .cartiglio-scena')?.hidden, cartellino: g.cartellinoHub(),
          bersagli: g.bersagli.length, presenze, ingresso: g.hub.ingresso?.slot, pianoIngresso: g.hub.piano, notte: g.narrativa.avanzamento().notte, semeNotte: g.hub.semeNotte(),
        };
      });
      assert.equal(base.stato, 'hub', 'il ciclo è nell\'hub');
      assert.equal(base.seme, SEME);
      assert.equal(base.piano, null, 'nessun piano prima della partenza');
      assert.equal(base.bersagli, 0, 'nell\'hub nessun fantoccio della scena di prova e nessun nemico');
      assert.equal(base.dialogo?.id, 'piazza-dante.targa-commemorativa', 'alla notte 1 la targa parte da sola');
      assert.equal(base.cartiglio, false);
      assert.equal(base.cartellino.notte.includes('1'), true);
      assert.equal(base.presenze.tonino.presente, true);
      assert.equal(base.presenze.bottega.stato, 'chiusa');
      assert.equal(base.presenze.mariella.tipo, 'finestra');
      assert.equal(base.presenze.mariella.accesa, true);
      assert.equal(base.presenze.luna.presente, true);
      assert.equal(base.presenze.taddeo.presente, false);
      assert.equal(base.presenze.agnese.presente, false);
      assert.equal(base.ingresso, 'E');
      assert.equal(base.pianoIngresso, 1);
      assert.equal(base.notte, 1);
      assert.notEqual(base.semeNotte, SEME);

      // chiude la targa (un solo cartiglio) e scatta lo screenshot dell'hub
      await pagina.evaluate(() => {
        const g = window.__gioco;
        g.tick(Math.ceil(g.parametri.get('incontri.antirimbalzo') / (1000 / 60)));
        g.premi('avanza', 1);
        g.tick(2);
      });
      assert.equal(await pagina.evaluate(() => window.__gioco.dialogo()), null);
      fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
      await pagina.screenshot({ path: EVIDENZE.hub });
      assert.ok(fs.statSync(EVIDENZE.hub).size > 0);

      // presenze per stato (Principio C): Taddeo perdonato, Agnese risvegliata
      const conFlag = await pagina.evaluate(() => {
        const g = window.__gioco;
        const ok = [g.imposta('taddeo', 'perdonato'), g.imposta('agnese', 'risvegliata')];
        g.tick(2);
        const p = Object.fromEntries(g.hub.presenze().map((x) => [x.id, x.presente]));
        return { ok, p, mariellaNpc: g.hub.presenze().some((x) => x.tipo === 'npc' && x.personaggio === 'mariella') };
      });
      assert.deepEqual(conFlag.ok, [true, true]);
      assert.equal(conFlag.p.taddeo, true);
      assert.equal(conFlag.p.agnese, true);
      assert.equal(conFlag.mariellaNpc, false, 'Mariella è solo una finestra');
      await pagina.screenshot({ path: EVIDENZE.presenze });

      // Tonino: vicino a lui interagisci apre il primo incontro, senza pausa del ciclo; il cartellino suggerisce il tasto
      const tonino = await pagina.evaluate(() => {
        const g = window.__gioco;
        const t = g.hub.presenze().find((p) => p.id === 'tonino');
        g.ferruccio.posiziona(t.x + g.ferruccio.r, t.y);
        g.tick(1);
        const suggerimento = g.cartellinoHub().suggerimento;
        g.premi('interagisci', 1);
        g.tick(1);
        const d = g.dialogo();
        return { suggerimento, stato: g.stato, dialogo: d ? { id: d.id, tipo: d.tipo } : null, parlante: document.querySelector('#interfaccia .cartiglio-scena .parlante')?.textContent };
      });
      assert.ok(tonino.suggerimento.includes('Tonino'), tonino.suggerimento);
      assert.equal(tonino.stato, 'hub', 'nell\'hub nessuna pausa logica');
      assert.equal(tonino.dialogo?.id, 'piazza-dante.tonino-primo-incontro');
      assert.equal(tonino.parlante, 'Tonino');
      await pagina.evaluate(() => { window.__gioco.incontri.abbandona(); window.__gioco.tick(1); });

      // partenza: camminando nell'ingresso (lato E) parte la notte con il seme derivato dal profilo
      const partenza = await pagina.evaluate(() => {
        const g = window.__gioco;
        const i = g.hub.ingresso;
        const semeAtteso = g.hub.semeNotte();
        g.ferruccio.posiziona(i.x - g.hub.cella, i.y + i.h / 2);
        g.tieni('destra');
        let n = 0;
        while (g.stato === 'hub' && n < 240) { g.tick(1); n++; }
        g.lascia('destra');
        g.tick(2);
        return {
          n, stato: g.stato, semeAtteso, semeNotte: g.notte?.seme ?? null, piano: g.piano ? g.piano.stanze.length : 0,
          stanza: g.stanza ? g.stanza.tipo : null, notte: g.narrativa.avanzamento().notte, hubAttivo: g.hub.attivo, partito: g.hub.partito,
          cartellino: g.cartellinoHub(),
        };
      });
      assert.equal(partenza.stato, 'notte', `la notte parte (${partenza.n} tick)`);
      assert.equal(partenza.semeNotte, partenza.semeAtteso);
      assert.notEqual(partenza.semeNotte, SEME, 'seme nuovo, non quello del profilo');
      assert.ok(partenza.piano > 0, 'piano generato');
      assert.equal(partenza.stanza, 'ingresso');
      assert.equal(partenza.notte, 1, '`notte` non cambia alla partenza');
      assert.equal(partenza.hubAttivo, false);
      assert.equal(partenza.partito, true);
      assert.equal(partenza.cartellino, null, 'cartellino dell\'hub nascosto nella notte');
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });
  } finally {
    if (browser) await browser.close();
    await server.chiudi();
  }
  const falliti = esiti.filter((e) => !e.ok);
  console.log(`\n# casi ${esiti.length}, falliti ${falliti.length}`);
  process.exit(falliti.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
