/**
 * gioco/qa/mondo.wire.test.js — Test di pagina del piano 1 in fil di ferro (storie 014-017).
 *
 * Esecuzione: `node gioco/qa/mondo.wire.test.js` dalla radice del repository (Playwright preinstallato;
 * non eseguire mai `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice
 * `gioco/`, apre `?debug=1&wire=1&piano=1&seme=1845`, ferma il ciclo rAF e lo guida a tick forzati via
 * `window.__gioco`: verifica la pianta (8 stanze + eventuale segreta, ingresso corrente), attraversa
 * una porta aperta camminando (transizione della camera, stanza nuova, Ferruccio sulla soglia
 * opposta), entra in una stanza normale (porte chiuse, fantocci con `archetipo`), la pulisce
 * uccidendo i fantocci (porte riaperte, `stanza.pulita`), rientra (resta pulita). Zero errori in
 * console. Salva `production/qa/evidence/mondo-wire.png` (stanza con porte, ostacoli, soglie, pianta
 * nell'angolo) e `production/qa/evidence/mondo-pianta.png` (transizione a metà corsa con la pianta che
 * mostra visitate e corrente). Il server è chiuso nel `finally`.
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
/** Teatro: il piano 1 ha n_min stanze (5), letto da generazione.json. */
const N_STANZE_P1 = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'parametri', 'generazione.json'), 'utf8')).piani.p1.n_min.base;
const CARTELLA_EVIDENZE = path.resolve(RADICE_GIOCO, '..', 'production', 'qa', 'evidence');
const EVIDENZA_WIRE = path.join(CARTELLA_EVIDENZE, 'mondo-wire.png');
const EVIDENZA_PIANTA = path.join(CARTELLA_EVIDENZE, 'mondo-pianta.png');

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

    await caso('piano 1 in fil di ferro: pianta generata, ingresso, attraversamento di una porta, stanza con fantocci chiusa e ripulita, rientro pulito, zero errori; due screenshot', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}/?debug=1&wire=1&piano=1&seme=1845`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano);
      await pagina.waitForFunction(() => window.__gioco.tick() > 5);
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      const iniziale = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.ciclo.ferma();
        const p = g.piano;
        return {
          stato: g.stato, wire: g.wire, seme: g.seme, p: p.p, Q: p.Q, riserva: Boolean(p.riserva),
          stanze: p.stanze.map((s) => ({ id: s.id, tipo: s.tipo, dim: s.dim, porte: Object.keys(s.porte).length, modello: s.modello })),
          corrente: { id: g.stanza.id, tipo: g.stanza.tipo, stato: g.stanza.stato, porte: g.stanza.porte.map((d) => [d.slot, d.stato]) },
          bersagli: g.bersagli.length, scala: g.camera.scala, erroriContenuto: g.parametri.errori(),
          ferruccio: { x: g.ferruccio.x, y: g.ferruccio.y }, campo: { x: g.campo.x, y: g.campo.y, l: g.campo.larghezza, a: g.campo.altezza },
        };
      });
      assert.equal(iniziale.stato, 'notte');
      assert.equal(iniziale.seme, 1845);
      assert.equal(iniziale.p, 1);
      assert.equal(iniziale.riserva, false);
      assert.deepEqual(iniziale.erroriContenuto, []);
      const nonSegrete = iniziale.stanze.filter((s) => s.tipo !== 'segreta');
      assert.equal(nonSegrete.length, N_STANZE_P1, 'Teatro: piano 1 = 5 stanze (generazione.json)');
      for (const tipo of ['ingresso', 'boss', 'tesoro', 'banchetto']) assert.equal(iniziale.stanze.filter((s) => s.tipo === tipo).length, 1, tipo);
      assert.equal(iniziale.stanze.filter((s) => s.tipo === 'ricordo').length, 0, 'Teatro: niente stanza-ricordo nel piano');
      assert.equal(iniziale.corrente.tipo, 'ingresso');
      assert.equal(iniziale.corrente.stato, 'pulita');
      assert.ok(iniziale.corrente.porte.length >= 2 && iniziale.corrente.porte.every(([, st]) => st === 'aperta'));
      assert.equal(iniziale.bersagli, 0);
      assert.equal(iniziale.scala, 1);
      assert.ok(Math.abs(iniziale.ferruccio.x - (iniziale.campo.x + iniziale.campo.l / 2)) < 1, 'Ferruccio al centro dell\'ingresso');

      // attraversa una porta aperta camminando: transizione, stanza nuova, soglia opposta
      const passaggio = await pagina.evaluate(() => {
        const g = window.__gioco;
        const eventi = [];
        for (const nome of ['notte.stanza', 'camera.transizione', 'stanza.chiusa', 'stanza.pulita', 'nemico.nato']) g.eventi.on(nome, (p) => eventi.push({ nome, ...p }));
        window.__eventiMondo = eventi;
        const porta = g.stanza.porte[0];
        const da = g.stanza.id;
        const soglia = g.stanza.puntoArrivo(porta.slot);
        g.ferruccio.posiziona(soglia.x, soglia.y);
        const dir = { N: 'su', S: 'giu', E: 'destra', W: 'sinistra' }[porta.lato];
        g.tieni(dir);
        let n = 0;
        for (; n < 90 && !g.camera.inTransizione; n++) g.tick(1);
        const inizio = { inTransizione: g.camera.inTransizione, lato: g.camera.lato, scorrimento: g.camera.scorrimento(), a: g.stanza.id };
        g.tick(7);
        const meta = { progresso: g.camera.progresso(), scorrimento: g.camera.scorrimento(), inTransizione: g.camera.inTransizione };
        return { da, verso: porta.verso, lato: porta.lato, slot: porta.slot, n, inizio, meta, dir };
      });
      assert.ok(passaggio.inizio.inTransizione, `transizione partita dopo ${passaggio.n} tick`);
      assert.equal(passaggio.inizio.lato, passaggio.lato);
      assert.equal(passaggio.inizio.a, passaggio.verso, 'la stanza corrente è la destinazione');
      assert.ok(Math.abs(passaggio.inizio.scorrimento.x) + Math.abs(passaggio.inizio.scorrimento.y) > 600, 'la nuova stanza parte fuori schermo');
      assert.ok(passaggio.meta.inTransizione && passaggio.meta.progresso > 0.4 && passaggio.meta.progresso < 0.6, `metà corsa (${passaggio.meta.progresso})`);

      // screenshot a metà transizione: scorrimento visibile, pianta con stanza corrente e visitata
      fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
      await pagina.screenshot({ path: EVIDENZA_PIANTA });
      assert.ok(fs.statSync(EVIDENZA_PIANTA).size > 0);

      const fine = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.lascia('su'); g.lascia('giu'); g.lascia('destra'); g.lascia('sinistra'); // il rilascio è letto dal primo tick dopo la transizione
        g.tick(8);
        const opposto = { N: 'S', S: 'N', E: 'W', W: 'E' };
        return {
          inTransizione: g.camera.inTransizione, stanza: g.stanza.id, tipo: g.stanza.tipo, stato: g.stanza.stato,
          porte: g.stanza.porte.map((d) => [d.slot, d.stato, d.verso]), ferruccio: { x: g.ferruccio.x, y: g.ferruccio.y },
          campo: { x: g.campo.x, y: g.campo.y, l: g.campo.larghezza, a: g.campo.altezza, cella: g.campo.cella }, opposto,
          eventi: window.__eventiMondo.map((e) => e.nome),
        };
      });
      assert.equal(fine.inTransizione, false);
      assert.equal(fine.stanza, passaggio.verso);
      const lato = passaggio.lato;
      const attesoY = lato === 'N' ? fine.campo.y + fine.campo.a - fine.campo.cella / 2 : lato === 'S' ? fine.campo.y + fine.campo.cella / 2 : null;
      const attesoX = lato === 'E' ? fine.campo.x + fine.campo.cella / 2 : lato === 'W' ? fine.campo.x + fine.campo.l - fine.campo.cella / 2 : null;
      if (attesoY !== null) assert.ok(Math.abs(fine.ferruccio.y - attesoY) < 1, `Ferruccio sulla soglia ${fine.opposto[lato]} (y ${fine.ferruccio.y} vs ${attesoY})`);
      if (attesoX !== null) assert.ok(Math.abs(fine.ferruccio.x - attesoX) < 1, `Ferruccio sulla soglia ${fine.opposto[lato]} (x ${fine.ferruccio.x} vs ${attesoX})`);
      assert.ok(fine.porte.some(([, , verso]) => verso === passaggio.da), 'la stanza nuova ha la porta di ritorno');
      assert.ok(fine.eventi.includes('notte.stanza') && fine.eventi.filter((e) => e === 'camera.transizione').length === 2);

      // stanza normale: porte chiuse con i fantocci, riaperte e pulita quando muoiono; il rientro resta pulito
      const combattimento = await pagina.evaluate(() => {
        const g = window.__gioco;
        const normale = g.piano.stanze.find((s) => s.tipo === 'normale');
        const esito = { vaiA: g.vaiA(normale.id), id: normale.id };
        esito.statoIniziale = g.stanza.stato;
        esito.segnalini = g.stanza.segnalini.length;
        const tMarker = Math.round(800 / g.parametri.get('stanze.t_marker') * g.parametri.get('stanze.t_marker') / (1000 / 60));
        g.tick(tMarker + 1);
        esito.nemici = g.bersagli.map((b) => ({ archetipo: b.archetipo, vita: b.vita, stato: b.stato }));
        esito.porteChiuse = g.stanza.porte.map((d) => d.stato);
        esito.statoOndata = g.stanza.stato;
        esito.passoBloccato = g.stanza.porte.every((d) => d.solido.ferma_passo === true);
        return esito;
      });
      assert.equal(combattimento.vaiA, true);
      assert.equal(combattimento.statoIniziale, 'annuncio');
      assert.ok(combattimento.segnalini >= 1);
      assert.ok(combattimento.nemici.length >= 1 && combattimento.nemici.every((n) => ['gatto', 'vespa', 'statua', 'guardia'].includes(n.archetipo)), JSON.stringify(combattimento.nemici));
      assert.ok(combattimento.porteChiuse.every((s) => s === 'chiusa'), `porte ${combattimento.porteChiuse}`);
      assert.equal(combattimento.passoBloccato, true);
      assert.equal(combattimento.statoOndata, 'ondata');

      // screenshot della stanza di combattimento: porte chiuse, fantocci, ostacoli, pianta
      await pagina.screenshot({ path: EVIDENZA_WIRE });
      assert.ok(fs.statSync(EVIDENZA_WIRE).size > 0);

      const pulizia = await pagina.evaluate(() => {
        const g = window.__gioco;
        const passo = 1000 / 60;
        const t = (k) => Math.max(1, Math.round(g.parametri.get(`stanze.${k}`) / passo));
        for (let guardia = 0; guardia < 10 && g.stanza.stato !== 'pulita'; guardia++) {
          for (const b of g.bersagli) if (b.stato !== 'morto') b.colpisci(99, null);
          g.tick(t('t_pausa_ondata') + t('t_marker') + t('t_ritardo_apertura') + 3);
        }
        const esito = { stato: g.stanza.stato, porte: g.stanza.porte.map((d) => d.stato) };
        g.tick(t('t_anim_porta') + 1);
        esito.porteDopo = g.stanza.porte.map((d) => d.stato);
        const id = g.stanza.id;
        const ingresso = g.piano.stanze.find((s) => s.tipo === 'ingresso');
        g.vaiA(ingresso.id);
        g.vaiA(id);
        g.tick(t('t_marker') + 5);
        esito.rientro = { stato: g.stanza.stato, bersagli: g.bersagli.length, porte: g.stanza.porte.map((d) => d.stato), segnalini: g.stanza.segnalini.length };
        esito.salvataggio = g.notte.salvataggio();
        esito.eventi = window.__eventiMondo.map((e) => e.nome);
        return esito;
      });
      assert.equal(pulizia.stato, 'pulita');
      assert.ok(pulizia.porteDopo.every((s) => s === 'aperta'), `porte riaperte: ${pulizia.porteDopo}`);
      assert.deepEqual(pulizia.rientro, { stato: 'pulita', bersagli: 0, porte: pulizia.porteDopo.map(() => 'aperta'), segnalini: 0 });
      assert.deepEqual(Object.keys(pulizia.salvataggio).sort(), ['piano', 'seme', 'stanza']);
      assert.equal(pulizia.salvataggio.stanza, combattimento.id);
      assert.ok(pulizia.eventi.includes('stanza.chiusa') && pulizia.eventi.includes('stanza.pulita') && pulizia.eventi.includes('nemico.nato'));

      // sulla tela c'è qualcosa oltre il fondo (il pavimento della stanza)
      const pixel = await pagina.evaluate(() => {
        const c = document.getElementById('scena');
        const ctx = c.getContext('2d');
        const scala = c.width / 1280;
        const leggi = (x, y) => Array.from(ctx.getImageData(Math.floor(x * scala), Math.floor(y * scala), 1, 1).data).slice(0, 3);
        return { fondo: leggi(640, 700), pavimento: leggi(500, 300) };
      });
      assert.notDeepEqual(pixel.fondo, pixel.pavimento);

      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });

    await caso('con piano=0 (annulla il piano=1 della meta gioco-avvio): la scena di prova delle storie 007-011 resta identica (4 fantocci, piano null, vaiA false)', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}/?debug=1&wire=1&piano=0&seme=1845`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato());
      const v = await pagina.evaluate(() => ({ piano: window.__gioco.piano, stanza: window.__gioco.stanza, bersagli: window.__gioco.bersagli.length, vaiA: window.__gioco.vaiA('r1') }));
      assert.deepEqual(v, { piano: null, stanza: null, bersagli: 4, vaiA: false });
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
