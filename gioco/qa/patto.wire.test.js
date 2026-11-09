/**
 * gioco/qa/patto.wire.test.js — Test di pagina della storia P09 (Patto d'Ombra): `?debug=1&piano=1&seme=1845&personaggio=ferruccio`,
 * batte il boss, apre la conferma del Patto (screenshot patto-conferma.png con «−1 Maschera massima per sempre»), stringe il
 * Raggio Cremisi Continuo (via `statistiche.stringiPatto`, strumento di QA: l'altare estrae a caso) e tiene la freccia finché il
 * raggio è acceso: screenshot patto-raggio.png con il raggio disegnato; i fantocci sulla linea perdono vita, quelli fuori no.
 * Esporta anche le utilità del server statico per oggetti.wire.test.js. Esecuzione: `node gioco/qa/patto.wire.test.js`.
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
const PATTO = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'parametri', 'patto.json'), 'utf8'));

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
  try {
    await fn();
    esiti.push({ nome, ok: true });
    console.log(`ok - ${nome}`);
  } catch (e) {
    esiti.push({ nome, ok: false, errore: e });
    console.log(`not ok - ${nome}\n  ${String(e && e.stack ? e.stack : e).split('\n').join('\n  ')}`);
  }
}
function riepilogo() {
  const falliti = esiti.filter((e) => !e.ok).length;
  console.log(`# ${esiti.length - falliti}/${esiti.length} casi ok`);
  if (falliti) process.exitCode = 1;
}

async function main() {
  const server = await avviaServer();
  let browser;
  try {
    browser = await chromium.launch();
    await caso('patto: conferma del Patto dopo il boss (pannello con il costo permanente) e Raggio Cremisi Continuo acceso sulla linea; due screenshot', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}/?debug=1&piano=1&seme=1845&personaggio=ferruccio`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano && window.__gioco.statistiche.correnti());
      await pagina.waitForFunction(() => window.__gioco.tick() > 5);
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      const conferma = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.ciclo.ferma();
        const boss = g.piano.stanze.find((s) => s.tipo === 'boss');
        g.vaiA(boss.id);
        for (let i = 0; i < 4000 && g.stanza.stato !== 'pulita'; i++) {
          for (const b of g.bersagli) if (b.stato !== 'morto') b.colpisci(1e6, null);
          g.tick(1);
        }
        const altare = g.patto.altare;
        if (!altare) return { altare: null };
        const r = altare.reliquie[0];
        g.ferruccio.posiziona(r.x + 12, r.y);
        g.premi('interagisci', 2);
        g.tick(1);
        return { altare, pannello: g.interfacciaOggetti().patto, pendente: g.patto.pendente?.id ?? null };
      });
      assert.ok(conferma.altare, 'altare del Patto dopo il boss');
      assert.ok(conferma.pannello, 'pannello di conferma nel DOM');
      assert.ok(/−1 Maschera massima per sempre/.test(conferma.pannello.costo), conferma.pannello.costo);
      assert.equal(conferma.pannello.nome, PATTO.patti.find((p) => p.id === conferma.pendente).nome);
      fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'patto-conferma.png') });

      const raggio = await pagina.evaluate((cfg) => {
        const g = window.__gioco;
        g.premi('indietro', 2); // rifiuta la reliquia estratta: il raggio si stringe via statistiche (strumento di QA)
        const def = g.patto.reliquia('patto_raggio_continuo');
        g.statistiche.stringiPatto(def);
        const st = g.statistiche.correnti();
        // fantocci: due sulla linea a destra, uno fuori linea
        const sulla = g.creaNemico({ archetipo: 'gatto', x: g.ferruccio.x + 160, y: g.ferruccio.y, id: 'qa-sulla' });
        const sulla2 = g.creaNemico({ archetipo: 'gatto', x: g.ferruccio.x + 320, y: g.ferruccio.y + 4, id: 'qa-sulla2' });
        const fuori = g.creaNemico({ archetipo: 'gatto', x: g.ferruccio.x + 160, y: g.ferruccio.y - 160, id: 'qa-fuori' });
        for (const b of [sulla, sulla2, fuori]) b.forzaStato('insegue');
        const v0 = [sulla.vita, sulla2.vita, fuori.vita];
        const carica = Math.ceil(cfg.carica_ms.base / (1000 / 60));
        g.tieni('spara_destra');
        g.tick(carica + 3);
        const stato = g.combattimento.raggio();
        return { flag: st.flags.raggio, stato, v0, v1: [sulla.vita, sulla2.vita, fuori.vita], proiettili: g.combattimento.proiettiliFerruccio().length };
      }, PATTO.regole.raggio);
      assert.equal(raggio.flag, true);
      assert.equal(raggio.stato.attivo, true, 'raggio acceso');
      assert.equal(raggio.proiettili, 0, 'niente proiettili con il raggio');
      assert.ok(raggio.v1[0] < raggio.v0[0] && raggio.v1[1] < raggio.v0[1], 'i due sulla linea perdono vita');
      assert.equal(raggio.v1[2], raggio.v0[2], 'fuori linea: intatto');
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'patto-raggio.png') });
      const spento = await pagina.evaluate(() => { const g = window.__gioco; g.lascia('spara_destra'); g.tick(2); return g.combattimento.raggio().attivo; });
      assert.equal(spento, false, 'rilasciata la freccia il raggio si spegne');
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });
  } finally {
    if (browser) await browser.close();
    await server.chiudi();
  }
  riepilogo();
}

module.exports = { avviaServer, caso, riepilogo };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
