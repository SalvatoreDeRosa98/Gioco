/**
 * gioco/qa/ricordi.wire.test.js — Test di pagina della storia 028 (il Medaglione di Rosa) in fil di ferro.
 *
 * Esecuzione: `node gioco/qa/ricordi.wire.test.js` dalla radice (Playwright preinstallato; non eseguire
 * `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice `gioco/`, apre
 * `?debug=1&wire=1&piano=1&seme=1845`, ferma il ciclo e lo guida a tick forzati via `window.__gioco`:
 * il boss non esiste ancora (storia 022), quindi la dissoluzione è `__gioco.eventi.emit('boss.sconfitto',
 * {id: 'gatto', x, y})`. Verifica: il Medaglione cade a terra (goccia azzurra nel wire), raccolto
 * camminandoci sopra entra nell'HUD dei doni come `li.dono.azzurro` e il danno sale di +1
 * (`production/qa/evidence/ricordi-medaglione.png`); nella stanza del banchetto, con le obbligatorie
 * precedenti viste, `interagisci` apre `piazza-dante.scelta-tonino`: due `li.opzione` con etichetta e
 * `cosa_sacrifica` da storia.json, nessuna `selezionata` (`ricordi-scelta.png`); giù + conferma →
 * «restituito»: flag deciso, Medaglione sparito dall'HUD, +12 scintille, esito `ricordo-restituito`; poi
 * `ferruccio.morto` con un nuovo Medaglione in mano (seconda pagina) → sparisce e il Gatto lo lascia di nuovo.
 * Zero errori in console. Il server è chiuso nel `finally`.
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
  medaglione: path.join(CARTELLA_EVIDENZE, 'ricordi-medaglione.png'),
  scelta: path.join(CARTELLA_EVIDENZE, 'ricordi-scelta.png'),
};

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

async function apriPagina(browser, base) {
  const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pagina = await contesto.newPage();
  const errori = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  pagina.on('pageerror', (e) => errori.push(String(e)));
  await pagina.goto(`${base}/?debug=1&wire=1&piano=1&seme=1845`, { waitUntil: 'load' });
  await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano);
  await pagina.waitForFunction(() => window.__gioco.tick() > 5);
  await pagina.evaluate(() => window.__gioco.ciclo.ferma());
  return { contesto, pagina, errori };
}

async function main() {
  fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
  const server = await avviaServer();
  let browser;
  try {
    browser = await chromium.launch();

    await caso('il Gatto si dissolve → Medaglione a terra, raccolto camminando: HUD azzurro, +1 danno; al banchetto la scelta con due pulsanti; restituito → 12 scintille ed esito; due screenshot', async () => {
      const { contesto, pagina, errori } = await apriPagina(browser, server.base);
      const caduta = await pagina.evaluate(() => {
        const g = window.__gioco;
        const eventi = [];
        for (const n of ['ricordi.caduto', 'ricordi.raccolto', 'ricordi.ceduto', 'ricordi.nessuno', 'ricordi.perso', 'doni.aggiunto', 'doni.rimosso']) g.eventi.on(n, (p) => eventi.push({ n, ...p }));
        window.__eventiRicordi = eventi;
        const dannoPrima = g.modificatori.valore('combattimento.danno');
        const flagPrima = g.narrativa.flag().tonino_ricordo;
        g.eventi.emit('boss.sconfitto', { id: 'gatto', x: g.ferruccio.x + 90, y: g.ferruccio.y });
        g.tick(1);
        const aTerra = g.ricordi.aTerra();
        const inManoPrima = g.ricordi.inMano().slice();
        let t = 0;
        g.tieni('destra');
        while (t < 240 && g.ricordi.aTerra().length > 0) { g.tick(1); t++; }
        g.lascia('destra');
        g.tick(2);
        const li = Array.from(document.querySelectorAll('#interfaccia .hud-doni li.dono'));
        return {
          flagPrima, dannoPrima, aTerra, inManoPrima, t, inMano: g.ricordi.inMano(), danno: g.modificatori.valore('combattimento.danno'),
          hud: li.map((x) => ({ classe: x.className, id: x.dataset.id })), hudNascosto: document.querySelector('#interfaccia .hud-doni').hidden,
          cartiglio: g.cartiglio(), eventi: eventi.map((e) => e.n), stato: g.stato, stanza: g.ricordi.stanzaCorrente,
        };
      });
      assert.equal(caduta.flagPrima, null);
      assert.equal(caduta.aTerra.length, 1, 'il Medaglione è a terra');
      assert.equal(caduta.aTerra[0].id, 'medaglione-di-rosa');
      assert.equal(caduta.aTerra[0].stanza, caduta.stanza);
      assert.deepEqual(caduta.inManoPrima, []);
      assert.ok(caduta.t > 0 && caduta.t < 240, `raccolto camminando in ${caduta.t} tick`);
      assert.deepEqual(caduta.inMano, ['medaglione-di-rosa']);
      assert.equal(caduta.danno, caduta.dannoPrima + 1, '+1 danno finché tenuto');
      assert.deepEqual(caduta.hud, [{ classe: 'dono azzurro', id: 'medaglione-di-rosa' }], 'goccia azzurra nell\'HUD');
      assert.equal(caduta.hudNascosto, false);
      assert.equal(caduta.cartiglio?.azzurro, true);
      assert.deepEqual(caduta.eventi, ['ricordi.caduto', 'doni.aggiunto', 'ricordi.raccolto']);
      assert.equal(caduta.stato, 'notte');
      await pagina.screenshot({ path: EVIDENZE.medaglione });

      // al banchetto (porte aperte: la stanza non ha ondate), con le obbligatorie precedenti viste
      const scelta = await pagina.evaluate(() => {
        const g = window.__gioco;
        const banchetto = g.piano.stanze.find((s) => s.tipo === 'banchetto');
        g.vaiA(banchetto.id);
        g.tick(Math.round(g.parametri.get('stanze.camera.t_transizione') / (1000 / 60)) + 2);
        const scena = g.narrativa.scena('piazza-dante.scelta-tonino');
        for (const s of g.narrativa.obbligatorieNonViste(scena.capitolo)) if (s.ordine < scena.ordine) g.narrativa.segnaVista(s.id);
        const anti = Math.ceil(g.parametri.get('incontri.antirimbalzo') / (1000 / 60)) + 1;
        g.premi('interagisci', 1);
        const d = g.dialogo();
        const id = d?.id;
        for (let i = 0; i < 20 && d && d.fase === 'battute'; i++) { g.tick(anti); g.premi('avanza', 1); }
        g.tick(1);
        const el = document.querySelector('#interfaccia .cartiglio-scena');
        const opzioni = Array.from(el.querySelectorAll('li.opzione')).map((li) => ({ classe: li.className, etichetta: li.querySelector('.etichetta').textContent, sacrificio: li.querySelector('.sacrificio').textContent }));
        return { id, fase: d?.fase, tipo: d?.tipo, selezionata: d?.scelta?.selezionata, opzioni, nascosto: el.hidden, stato: g.stato, vicinoSlot: g.banchetto.vicino(), stanza: g.stanza.tipo };
      });
      assert.equal(scelta.stanza, 'banchetto');
      assert.equal(scelta.vicinoSlot, -1);
      assert.equal(scelta.id, 'piazza-dante.scelta-tonino');
      assert.equal(scelta.tipo, 'scena');
      assert.equal(scelta.fase, 'scelta');
      assert.equal(scelta.selezionata, -1, 'nessuna selezione predefinita');
      assert.equal(scelta.nascosto, false);
      assert.equal(scelta.stato, 'pausa');
      assert.deepEqual(scelta.opzioni.map((o) => o.classe), ['opzione', 'opzione']);
      assert.deepEqual(scelta.opzioni.map((o) => o.etichetta), ['Restituisci il ricordo di Rosa', 'Lascialo dimenticare']);
      assert.ok(scelta.opzioni.every((o) => o.sacrificio.length > 0), 'riga cosa_sacrifica sotto ogni pulsante');
      await pagina.screenshot({ path: EVIDENZE.scelta });

      const esito = await pagina.evaluate(() => {
        const g = window.__gioco;
        const anti = Math.ceil(g.parametri.get('incontri.antirimbalzo') / (1000 / 60)) + 1;
        const scintillePrima = g.profilo.scintille;
        g.premi('giu', 1); // da −1 alla prima opzione: «restituito»
        g.tick(anti);
        g.premi('conferma', 1);
        g.tick(1);
        const d = g.dialogo();
        const el = document.querySelector('#interfaccia .cartiglio-scena');
        return {
          flag: g.narrativa.flag().tonino_ricordo, fase: d?.fase, esito: d?.esito, battuta: el.querySelector('.battuta').textContent,
          inMano: g.ricordi.inMano(), danno: g.modificatori.valore('combattimento.danno'), scintille: g.profilo.scintille - scintillePrima,
          restituiti: g.profilo.ricordiRestituiti, hud: document.querySelectorAll('#interfaccia .hud-doni li.dono').length,
          eventi: window.__eventiRicordi.map((e) => e.n), eleggibiliBoss: g.pool.eleggibili({ piano: 1, canale: 'boss' }).map((x) => x.id),
        };
      });
      assert.equal(esito.flag, 'restituito');
      assert.equal(esito.fase, 'esito');
      assert.equal(esito.esito, 'piazza-dante.ricordo-restituito');
      assert.equal(esito.battuta, 'Tonino riconosce un vecchio medaglione appartenuto a Rosa.');
      assert.deepEqual(esito.inMano, []);
      assert.equal(esito.danno, caduta.dannoPrima, 'il danno torna alla base');
      assert.equal(esito.scintille, 12);
      assert.deepEqual(esito.restituiti, ['medaglione-di-rosa']);
      assert.equal(esito.hud, 0, 'il Medaglione è sparito dall\'HUD');
      assert.ok(esito.eventi.includes('ricordi.ceduto') && esito.eventi.includes('doni.rimosso'));
      assert.deepEqual(esito.eleggibiliBoss, [], 'il pool legge i flag dallo stato narrativo e i restituiti dal profilo');

      // un nuovo Gatto nella stessa pagina: niente (flag deciso)
      const dopo = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.incontri.abbandona();
        g.tick(1);
        g.eventi.emit('boss.sconfitto', { id: 'gatto', x: g.ferruccio.x, y: g.ferruccio.y });
        g.tick(1);
        const ultimo = window.__eventiRicordi.at(-1);
        return { n: ultimo.n, motivo: ultimo.motivo, aTerra: g.ricordi.aTerra().length, stato: g.stato };
      });
      assert.deepEqual(dopo, { n: 'ricordi.nessuno', motivo: 'deciso', aTerra: 0, stato: 'notte' });
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });

    await caso('morte con il Medaglione in mano: sparisce senza decidere il flag; il Gatto lo lascia di nuovo', async () => {
      const { contesto, pagina, errori } = await apriPagina(browser, server.base);
      // il profilo in localStorage della pagina precedente appartiene a un altro contesto: qui è nuovo
      const r = await pagina.evaluate(() => {
        const g = window.__gioco;
        const persi = [];
        g.eventi.on('ricordi.perso', (p) => persi.push(p));
        g.eventi.emit('boss.sconfitto', { id: 'gatto' }); // senza x,y: cade su Ferruccio
        g.tick(1);
        const inMano = g.ricordi.inMano().slice();
        g.eventi.emit('ferruccio.morto', { x: g.ferruccio.x, y: g.ferruccio.y, direzione: { x: 0, y: 1 } });
        g.tick(1);
        const dopoMorte = { inMano: g.ricordi.inMano(), flag: g.narrativa.flag().tonino_ricordo, hud: document.querySelectorAll('#interfaccia .hud-doni li.dono').length, persi: persi.map((p) => p.ids) };
        g.eventi.emit('boss.sconfitto', { id: 'gatto', x: g.ferruccio.x + 200, y: g.ferruccio.y });
        g.tick(1);
        return { inMano, dopoMorte, aTerra: g.ricordi.aTerra().map((o) => o.id) };
      });
      assert.deepEqual(r.inMano, ['medaglione-di-rosa']);
      assert.deepEqual(r.dopoMorte, { inMano: [], flag: null, hud: 0, persi: [['medaglione-di-rosa']] });
      assert.deepEqual(r.aTerra, ['medaglione-di-rosa'], 'il Gatto lo lascia di nuovo');
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
