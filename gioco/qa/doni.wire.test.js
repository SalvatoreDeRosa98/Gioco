/**
 * gioco/qa/doni.wire.test.js — Test di pagina della storia 024: piedistallo della bottega, raccolta con
 * `interagisci`, cartiglio e HUD dei doni in DOM, ganci collegati al combattimento, nel piano 1 in fil di ferro.
 *
 * Esecuzione: `node gioco/qa/doni.wire.test.js` dalla radice (Playwright preinstallato; non eseguire mai
 * `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice `gioco/`, apre
 * `?debug=1&wire=1&piano=1&seme=1845`, ferma il ciclo rAF e guida a tick forzati via `window.__gioco`:
 * va nella stanza `tesoro`, verifica il piedistallo (offerto, nel pool del piano, cono di luce), porta
 * Ferruccio a 50 px, legge l'anteprima nel DOM, preme `interagisci`, verifica dono nella lista, cartiglio
 * (nome e riga del catalogo, visibile, poi spento dopo t_cartiglio), HUD dei doni, piedistallo preso, pool
 * aggiornato, rientro conservato; poi, con l'Acciarino a probabilità forzata, un fendente su un nemico vero
 * fa partire una scintilla (`doni.scintilla`, proiettile in volo). Zero errori in console. Salva
 * `production/qa/evidence/doni-piedistallo.png` (cartiglio acceso, HUD con il dono, piedistallo preso).
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
const EVIDENZA = path.join(CARTELLA_EVIDENZE, 'doni-piedistallo.png');

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

    await caso('piano 1: bottega con il piedistallo, anteprima nel cono di luce, raccolta con interagisci, cartiglio e HUD in DOM, pool aggiornato, rientro conservato; screenshot', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}/?debug=1&wire=1&piano=1&seme=1845`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano);
      await pagina.waitForFunction(() => window.__gioco.tick() > 5);
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      const bottega = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.ciclo.ferma();
        const eventi = [];
        for (const nome of ['piedistallo.posato', 'piedistallo.raccolto', 'doni.aggiunto', 'doni.scintilla', 'pool.offerto']) g.eventi.on(nome, (p) => eventi.push({ nome, ...p }));
        window.__eventiDoni = eventi;
        const tesoro = g.piano.stanze.find((s) => s.tipo === 'tesoro');
        const vaiA = g.vaiA(tesoro.id);
        g.tick(Math.round(g.parametri.get('stanze.camera.t_transizione') / (1000 / 60)) + 2);
        const el = g.piedistalli.elenco();
        return {
          vaiA, id: tesoro.id, attivo: g.piedistalli.attivo, stanza: g.stanza.tipo, piedistalli: el.map((p) => ({ id: p.id, stato: p.stato, x: p.x, y: p.y, nome: p.dono?.nome, riga: p.dono?.cartiglio, tipo: p.dono?.sagoma?.tipo })),
          offerti: g.pool.offertiIn(1), rAnteprima: g.piedistalli.rAnteprima(), eventi: eventi.map((e) => e.nome),
          contenuti: g.stanza.contenuti.filter((c) => c.tipo === 'piedistallo').map((c) => ({ x: c.x, y: c.y })),
          doniAttivi: g.modificatori.doniAttivi(), hudNascosto: document.querySelector('#interfaccia .hud-doni').hidden,
          cartiglioNascosto: document.querySelector('#interfaccia .cartiglio').hidden,
        };
      });
      assert.equal(bottega.vaiA, true);
      assert.equal(bottega.stanza, 'tesoro');
      assert.equal(bottega.attivo, true);
      assert.equal(bottega.piedistalli.length, 1, 'al piano 1 un piedistallo');
      const [p] = bottega.piedistalli;
      assert.equal(p.stato, 'offerto');
      assert.ok(p.id && p.nome && p.riga, JSON.stringify(p));
      assert.equal(p.tipo, 'geometrica', 'un dono del piedistallo non è mai un ricordo');
      assert.deepEqual({ x: p.x, y: p.y }, bottega.contenuti[0], 'sul punto `piedistallo` del modello');
      assert.ok(bottega.offerti.includes(p.id));
      assert.ok(bottega.eventi.includes('piedistallo.posato'));
      assert.deepEqual(bottega.doniAttivi, []);
      assert.equal(bottega.hudNascosto, true, 'HUD dei doni vuoto: nascosto');

      // anteprima: Ferruccio a 50 px, fermo; il cartiglio tratteggiato mostra nome e riga; nessun dono raccolto
      const anteprima = await pagina.evaluate(({ x, y }) => {
        const g = window.__gioco;
        g.ferruccio.posiziona(x - 50, y);
        g.tick(2);
        const c = document.querySelector('#interfaccia .cartiglio');
        return { nascosto: c.hidden, classe: c.className, nome: c.querySelector('.nome').textContent, riga: c.querySelector('.riga').textContent, avviso: c.querySelector('.avviso').textContent, stato: g.cartiglio()?.tipo, doni: g.modificatori.doniAttivi() };
      }, p);
      assert.equal(anteprima.nascosto, false);
      assert.ok(anteprima.classe.includes('anteprima'));
      assert.equal(anteprima.nome, p.nome);
      assert.equal(anteprima.riga, p.riga);
      assert.ok(anteprima.avviso.includes('KeyE'), anteprima.avviso);
      assert.deepEqual(anteprima.doni, []);

      // raccolta: interagisci → dono nella lista nello stesso tick, cartiglio pieno, HUD con una sagoma, piedistallo preso
      const raccolta = await pagina.evaluate(() => {
        const g = window.__gioco;
        const t0 = g.tick();
        g.premi('interagisci', 1);
        const c = document.querySelector('#interfaccia .cartiglio');
        const hud = document.querySelector('#interfaccia .hud-doni');
        return {
          tick: g.tick() - t0, doni: g.modificatori.doniAttivi(), stato: g.piedistalli.elenco()[0].stato, raccolti: g.pool.raccolti(),
          cartiglio: { nascosto: c.hidden, classe: c.className, nome: c.querySelector('.nome').textContent, riga: c.querySelector('.riga').textContent },
          hud: { nascosto: hud.hidden, voci: Array.from(hud.querySelectorAll('li')).map((li) => ({ id: li.dataset.id, classe: li.className, testo: li.textContent })) },
          eventi: window.__eventiDoni.map((e) => e.nome), statoGioco: g.stato,
        };
      });
      assert.equal(raccolta.tick, 1);
      assert.deepEqual(raccolta.doni, [p.id]);
      assert.equal(raccolta.stato, 'preso');
      assert.deepEqual(raccolta.raccolti, [p.id]);
      assert.equal(raccolta.cartiglio.nascosto, false);
      assert.ok(raccolta.cartiglio.classe.includes('raccolto') && raccolta.cartiglio.classe.includes('oro'), raccolta.cartiglio.classe);
      assert.equal(raccolta.cartiglio.nome, p.nome);
      assert.equal(raccolta.cartiglio.riga, p.riga);
      assert.equal(raccolta.hud.nascosto, false);
      assert.equal(raccolta.hud.voci.length, 1);
      assert.equal(raccolta.hud.voci[0].id, p.id);
      assert.ok(raccolta.hud.voci[0].classe.includes('oro'));
      assert.ok(raccolta.eventi.includes('doni.aggiunto') && raccolta.eventi.includes('piedistallo.raccolto'));
      assert.equal(raccolta.statoGioco, 'notte', 'il cartiglio non mette in pausa');

      // screenshot: cartiglio acceso, HUD con il dono, piedistallo preso sul fil di ferro
      fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
      await pagina.evaluate(() => window.__gioco.tick(1));
      await pagina.screenshot({ path: EVIDENZA });
      assert.ok(fs.statSync(EVIDENZA).size > 0);

      // il cartiglio dura t_cartiglio di tempo di gioco e poi si spegne; il rientro nella bottega conserva lo stato
      const dopo = await pagina.evaluate(() => {
        const g = window.__gioco;
        const t = g.parametri.get('doni').piedistallo.t_cartiglio.base;
        const passo = 1000 / 60;
        g.tick(Math.round(t / passo) - 2 - Math.round(100 / passo));
        const prima = document.querySelector('#interfaccia .cartiglio').hidden;
        g.tick(Math.round(200 / passo));
        const spento = document.querySelector('#interfaccia .cartiglio').hidden;
        const id = g.stanza.id;
        const ingresso = g.piano.stanze.find((s) => s.tipo === 'ingresso');
        g.vaiA(ingresso.id);
        const fuori = g.piedistalli.attivo;
        g.vaiA(id);
        g.tick(2);
        return { prima, spento, fuori, attivo: g.piedistalli.attivo, stati: g.piedistalli.elenco().map((p) => p.stato), posati: window.__eventiDoni.filter((e) => e.nome === 'piedistallo.posato').length, doni: g.modificatori.doniAttivi() };
      });
      assert.equal(dopo.prima, false, 'ancora acceso prima della scadenza');
      assert.equal(dopo.spento, true, 'spento dopo t_cartiglio');
      assert.equal(dopo.fuori, false);
      assert.equal(dopo.attivo, true);
      assert.deepEqual(dopo.stati, ['preso']);
      assert.equal(dopo.posati, 1, 'il rientro non rigenera il piedistallo');
      assert.equal(dopo.doni.length, 1);

      // ganci nel mondo vero: con l'Acciarino (p forzata a 1 via il catalogo in memoria non è possibile: usiamo il dono
      // di prova dei modificatori) un fendente su un nemico vero emette su_colpo e la scintilla parte
      const scintilla = await pagina.evaluate(() => {
        const g = window.__gioco;
        const prima = window.__eventiDoni.filter((e) => e.nome === 'doni.scintilla').length;
        g.modificatori.aggiungiDono('acciarino');
        let nati = 0;
        const nuovo = () => { const n = g.creaNemico({ archetipo: 'guardia', x: g.ferruccio.x + 50, y: g.ferruccio.y, id: `prova-${nati++}` }); n.forzaStato('insegue'); return n; };
        let n = nuovo();
        let colpi = 0;
        const via = g.eventi.on('ferruccio.colpo', () => { colpi += 1; });
        // molti fendenti: con p 0,20 e ricarica 400 ms almeno una scintilla in 40 colpi è pressoché certa
        for (let i = 0; i < 40 && window.__eventiDoni.filter((e) => e.nome === 'doni.scintilla').length === prima; i++) {
          if (n.stato === 'morto') n = nuovo();
          g.premi('attacco', 1);
          g.tick(30);
        }
        if (typeof via === 'function') via();
        const dopo = window.__eventiDoni.filter((e) => e.nome === 'doni.scintilla').length;
        return { colpi, scintille: dopo - prima, proiettili: g.proiettili.filter((p) => p.scintilla).length, doni: g.modificatori.doniAttivi(), hud: document.querySelectorAll('#interfaccia .hud-doni li').length };
      });
      assert.ok(scintilla.colpi >= 1, 'il fendente colpisce il nemico vero');
      assert.ok(scintilla.scintille >= 1, `su_colpo collegato: ${scintilla.scintille} scintille su ${scintilla.colpi} colpi`);
      assert.equal(scintilla.doni.length, 2);
      assert.equal(scintilla.hud, 2, 'l\'HUD elenca anche il dono preso fuori dal piedistallo');

      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
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
