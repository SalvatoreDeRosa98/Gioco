/**
 * gioco/qa/cartiglio.wire.test.js — Test di pagina della storia 027: cartiglio dei dialoghi, scelta e
 * tableau in DOM, pausa logica del ciclo, nel modo wire.
 *
 * Esecuzione: `node gioco/qa/cartiglio.wire.test.js` dalla radice (Playwright preinstallato; non eseguire
 * mai `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice `gioco/`, apre
 * `?debug=1&wire=1&seme=1845&scena=piazza-dante.tonino-primo-incontro`: il cartiglio è acceso con TONINO
 * in maiuscoletto (font-variant small-caps calcolato), il ciclo è in `pausa`; `avanza` porta alla didascalia
 * in corsivo (font-style calcolato) senza nome; screenshot `production/qa/evidence/cartiglio.png`. Poi, con le
 * scene precedenti segnate viste via `__gioco.narrativa`, parte `piazza-dante.scelta-tonino`: due opzioni
 * nessuna selezionata, `giu` + `conferma` → decisione e l'esito nello stesso cartiglio; screenshot
 * `cartiglio-scelta.png`. Infine `villa-comunale.ricordo-gaetano` come tableau: velo acceso con la voce di
 * Gaetano, ancora acceso a 2,9 s, spento dopo la durata; screenshot `tableau.png`. Alla chiusura il ciclo
 * torna in `notte`. Zero errori in console. Nella stanza del banchetto del piano 1 (seconda pagina) `interagisci`
 * lontano dagli slot a porte aperte apre un dialogo con Tonino, e a porte chiuse (stanza in `ondata`) no.
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
  cartiglio: path.join(CARTELLA_EVIDENZE, 'cartiglio.png'),
  scelta: path.join(CARTELLA_EVIDENZE, 'cartiglio-scelta.png'),
  tableau: path.join(CARTELLA_EVIDENZE, 'tableau.png'),
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

async function main() {
  const server = await avviaServer();
  let browser;
  try {
    browser = await chromium.launch();

    await caso('cartiglio (nome in maiuscoletto, didascalia in corsivo, pausa logica), scelta con esito, tableau ≥ 3 s; tre screenshot', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}/?debug=1&wire=1&seme=1845&scena=piazza-dante.tonino-primo-incontro`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.dialogo());
      await pagina.evaluate(() => window.__gioco.ciclo.ferma());
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      const aperto = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.tick(2);
        const el = document.querySelector('#interfaccia .cartiglio-scena');
        const parlante = el.querySelector('.parlante');
        return {
          stato: g.stato, dialogo: { id: g.dialogo().id, indice: g.dialogo().indice, tableau: g.dialogo().tableau },
          nascosto: el.hidden, classe: el.className, parlante: parlante.textContent, variante: getComputedStyle(parlante).fontVariant,
          battuta: el.querySelector('.battuta').textContent, stileBattuta: getComputedStyle(el.querySelector('.battuta')).fontStyle,
          suggerimento: el.querySelector('.suggerimento').textContent, ferruccio: g.ferruccio.x,
        };
      });
      assert.equal(aperto.stato, 'pausa', 'pausa logica durante il cartiglio');
      assert.equal(aperto.dialogo.id, 'piazza-dante.tonino-primo-incontro');
      assert.equal(aperto.dialogo.tableau, false);
      assert.equal(aperto.nascosto, false);
      assert.equal(aperto.parlante, 'Tonino');
      assert.ok(aperto.variante.includes('small-caps'), aperto.variante);
      assert.equal(aperto.battuta, "Uagliò, ma che è 'sta faccia?");
      assert.equal(aperto.stileBattuta, 'normal');
      assert.ok(aperto.suggerimento.length > 0);

      // in pausa Ferruccio non si muove; `avanza` dopo l'antirimbalzo → didascalia in corsivo senza nome
      const didascalia = await pagina.evaluate(() => {
        const g = window.__gioco;
        const x0 = g.ferruccio.x;
        g.premi('destra', 10);
        const mosso = g.ferruccio.x !== x0;
        g.tick(Math.ceil(g.parametri.get('incontri.antirimbalzo') / (1000 / 60)));
        g.premi('avanza', 1);
        g.tick(1);
        const el = document.querySelector('#interfaccia .cartiglio-scena');
        return {
          mosso, indice: g.dialogo().indice, classe: el.className, parlanteNascosto: el.querySelector('.parlante').hidden,
          battuta: el.querySelector('.battuta').textContent, stile: getComputedStyle(el.querySelector('.battuta')).fontStyle,
        };
      });
      assert.equal(didascalia.mosso, false, 'in pausa Ferruccio non cammina');
      assert.equal(didascalia.indice, 1);
      assert.ok(didascalia.classe.includes('didascalia'));
      assert.equal(didascalia.parlanteNascosto, true);
      assert.equal(didascalia.battuta, 'Ferruccio indica la propria maschera.');
      assert.equal(didascalia.stile, 'italic');

      fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
      await pagina.evaluate(() => { const g = window.__gioco; g.tick(Math.ceil(g.parametri.get('incontri.antirimbalzo') / (1000 / 60))); g.premi('avanza', 1); g.tick(1); });
      await pagina.screenshot({ path: EVIDENZE.cartiglio });
      assert.ok(fs.statSync(EVIDENZE.cartiglio).size > 0);

      // fino alla fine: scena vista, ciclo di nuovo in `notte`, cartiglio nascosto
      const fine = await pagina.evaluate(() => {
        const g = window.__gioco;
        const passo = Math.ceil(g.parametri.get('incontri.antirimbalzo') / (1000 / 60));
        for (let i = 0; i < 10 && g.dialogo(); i++) { g.tick(passo); g.premi('avanza', 1); }
        g.tick(1);
        return { dialogo: g.dialogo(), stato: g.stato, nascosto: document.querySelector('#interfaccia .cartiglio-scena').hidden, viste: g.narrativa.avanzamento().scene_viste };
      });
      assert.equal(fine.dialogo, null);
      assert.equal(fine.stato, 'notte');
      assert.equal(fine.nascosto, true);
      assert.ok(fine.viste.includes('piazza-dante.tonino-primo-incontro'));

      // scelta: con le scene precedenti viste, la scelta di Tonino mostra due opzioni; giù + conferma → esito
      const scelta = await pagina.evaluate(() => {
        const g = window.__gioco;
        for (const id of ['piazza-dante.risveglio', 'piazza-dante.tutorial', 'piazza-dante.targa-commemorativa', 'piazza-dante.gatto-dei-quattro-canti']) g.narrativa.segnaVista(id);
        const d = g.incontri.mostra('piazza-dante.scelta-tonino');
        const passo = Math.ceil(g.parametri.get('incontri.antirimbalzo') / (1000 / 60));
        while (d.fase === 'battute') { g.tick(passo); g.premi('avanza', 1); }
        g.tick(1);
        const el = document.querySelector('#interfaccia .cartiglio-scena');
        const prima = { classe: el.className, opzioni: Array.from(el.querySelectorAll('li.opzione')).map((li) => ({ classe: li.className, etichetta: li.querySelector('.etichetta').textContent, sacrificio: li.querySelector('.sacrificio').textContent })), selezionata: d.scelta.selezionata, stato: g.stato };
        g.premi('giu', 1);
        g.tick(1);
        const dopoGiu = { selezionata: d.scelta.selezionata, classi: Array.from(el.querySelectorAll('li.opzione')).map((li) => li.className) };
        window.__scelta = { prima, dopoGiu };
        return window.__scelta;
      });
      assert.ok(scelta.prima.classe.includes('scelta'));
      assert.equal(scelta.prima.opzioni.length, 2);
      assert.equal(scelta.prima.opzioni[0].etichetta, 'Restituisci il ricordo di Rosa');
      assert.ok(scelta.prima.opzioni.every((o) => o.sacrificio.length > 0 && !o.classe.includes('selezionata')), 'nessuna evidenziata per default');
      assert.equal(scelta.prima.stato, 'pausa');
      assert.equal(scelta.dopoGiu.selezionata, 0);
      assert.ok(scelta.dopoGiu.classi[0].includes('selezionata'));
      await pagina.screenshot({ path: EVIDENZE.scelta });

      const esito = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.tick(Math.ceil(g.parametri.get('incontri.antirimbalzo') / (1000 / 60)));
        g.premi('conferma', 1);
        g.tick(1);
        const d = g.dialogo();
        const el = document.querySelector('#interfaccia .cartiglio-scena');
        return { flag: g.narrativa.flag().tonino_ricordo, fase: d?.fase, esito: d?.esito, battuta: el.querySelector('.battuta').textContent, salvato: localStorage.length > 0 };
      });
      assert.equal(esito.flag, 'restituito');
      assert.equal(esito.fase, 'esito');
      assert.equal(esito.esito, 'piazza-dante.ricordo-restituito');
      assert.equal(esito.battuta, 'Tonino riconosce un vecchio medaglione appartenuto a Rosa.');
      assert.equal(esito.salvato, true, 'la decisione è nel profilo salvato');
      await pagina.evaluate(() => { const g = window.__gioco; g.incontri.abbandona(); g.tick(1); });

      // tableau: velo acceso con la voce di Gaetano, ≥ 3 s, poi spento
      const tableau = await pagina.evaluate(() => {
        const g = window.__gioco;
        const d = g.incontri.mostra('villa-comunale.ricordo-gaetano');
        g.tick(2);
        const el = document.querySelector('#interfaccia .tableau');
        return {
          tableau: d.tableau, durata: d.durataMs, nascosto: el.hidden, voce: el.querySelector('.testo').textContent, parlante: el.querySelector('.parlante').textContent,
          variante: getComputedStyle(el.querySelector('.parlante')).fontVariant, cartiglioNascosto: document.querySelector('#interfaccia .cartiglio-scena').hidden, stato: g.stato,
        };
      });
      assert.equal(tableau.tableau, true);
      assert.ok(tableau.durata >= 3000);
      assert.equal(tableau.nascosto, false);
      assert.equal(tableau.voce, 'Prima fate uscire i ragazzi!');
      assert.equal(tableau.parlante, 'Gaetano');
      assert.ok(tableau.variante.includes('small-caps'));
      assert.equal(tableau.cartiglioNascosto, true);
      assert.equal(tableau.stato, 'pausa');
      await pagina.screenshot({ path: EVIDENZE.tableau });

      const spento = await pagina.evaluate(() => {
        const g = window.__gioco;
        const passo = 1000 / 60;
        g.premi('avanza', 1);
        g.tick(Math.floor(2900 / passo) - 3);
        const a29 = { aperto: Boolean(g.dialogo()), nascosto: document.querySelector('#interfaccia .tableau').hidden };
        g.tick(Math.ceil(g.dialogo().durataMs / passo) + 2);
        return { a29, dopo: { aperto: Boolean(g.dialogo()), nascosto: document.querySelector('#interfaccia .tableau').hidden, stato: g.stato }, viste: g.narrativa.avanzamento().scene_viste };
      });
      assert.deepEqual(spento.a29, { aperto: true, nascosto: false }, 'ancora acceso a 2,9 s anche dopo avanza');
      assert.deepEqual(spento.dopo, { aperto: false, nascosto: true, stato: 'notte' });
      assert.ok(spento.viste.includes('villa-comunale.ricordo-gaetano'));

      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });

    await caso('piano 1, stanza del banchetto: interagisci lontano dagli slot parla con Tonino a porte aperte; a porte chiuse nessun cartiglio', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}/?debug=1&wire=1&piano=1&seme=1845`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano);
      await pagina.waitForFunction(() => window.__gioco.tick() > 5);
      const esito = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.ciclo.ferma();
        const rifiuti = [];
        g.eventi.on('incontri.rifiutato', (p) => rifiuti.push(p.motivo));
        const banchetto = g.piano.stanze.find((s) => s.tipo === 'banchetto');
        g.vaiA(banchetto.id);
        g.tick(Math.round(g.parametri.get('stanze.camera.t_transizione') / (1000 / 60)) + 2);
        // lontano dagli slot (punto d'arrivo), porte aperte: la stanza del banchetto non ha ondate
        const vicino = g.banchetto.vicino();
        g.premi('interagisci', 1);
        const aperto = g.dialogo();
        const r1 = { tipo: aperto?.tipo, id: aperto?.id, stato: g.stato, vicino, statoStanza: g.stanza.stato };
        g.incontri.abbandona();
        g.tick(1);
        // porte chiuse simulate: un nemico vivo nella stanza
        g.creaNemico({ archetipo: 'guardia', x: g.ferruccio.x + 200, y: g.ferruccio.y, id: 'ombra' });
        g.premi('interagisci', 1);
        return { r1, chiuso: { dialogo: g.dialogo(), stato: g.stato, rifiuti } };
      });
      assert.equal(esito.r1.vicino, -1, 'il punto d\'arrivo non è su uno slot');
      assert.ok(esito.r1.tipo === 'scena' || esito.r1.tipo === 'ripetizione', JSON.stringify(esito.r1));
      assert.equal(esito.r1.stato, 'pausa');
      assert.equal(esito.chiuso.dialogo, null, 'nemici vivi: nessun cartiglio');
      assert.equal(esito.chiuso.stato, 'notte');
      assert.deepEqual(esito.chiuso.rifiuti, ['porte_chiuse']);
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
