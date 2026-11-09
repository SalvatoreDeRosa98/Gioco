/**
 * gioco/qa/pacchetto.test.js — Test del pacchetto autosufficiente prodotto da `tools/impacchetta.js`.
 *
 * Esecuzione: `node gioco/qa/pacchetto.test.js` dalla radice del repository (Playwright preinstallato; non
 * eseguire mai `playwright install`). Esegue il tool su `gioco/index.html` (→ `production/build/ferruccio-prova.html`
 * e, con `--frammento`, `ferruccio-prova.frammento.html`), poi apre il pacchetto:
 *  - via http (server statico `python3 -m http.server` su `production/build/`) e via `file://`, con
 *    `?debug=1&wire=1&seme=1845` (la meta gioco-avvio di index.html aggiunge `piano=1`): zero errori di console/eccezioni
 *    in 3 s, `window.__gioco` presente, `__gioco.tick(60)` avanza di 60, stato del ciclo `notte`, stanza d'ingresso del piano 1;
 *    screenshot `production/qa/evidence/pacchetto-file.png` dalla versione `file://`;
 *  - il frammento avvolto in uno scheletro con CSP «solo inline e data:» (`default-src 'none'; script-src
 *    'unsafe-inline'; style-src 'unsafe-inline'; img-src data:`), via http: stesse verifiche;
 *  - determinismo: la pagina originale servita da `gioco/` e il pacchetto, con lo stesso seme, dopo
 *    `__gioco.ciclo.ferma(); __gioco.tick(120)` hanno gli stessi `__gioco.ferruccio.x/y`;
 *  - se esiste `gioco/prova.html`, lo impacchetta e lo apre via `file://` (zero errori; se espone `__gioco`, i tick
 *    avanzano); altrimenti stampa `# salto prova.html`.
 */

'use strict';

const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const RADICE_GIOCO = path.resolve(__dirname, '..');
const RADICE = path.resolve(RADICE_GIOCO, '..');
const TOOL = path.join(RADICE, 'tools', 'impacchetta.js');
const CARTELLA_BUILD = path.join(RADICE, 'production', 'build');
const PACCHETTO = path.join(CARTELLA_BUILD, 'ferruccio-prova.html');
const FRAMMENTO = path.join(CARTELLA_BUILD, 'ferruccio-prova.frammento.html');
const SCHELETRO_CSP = path.join(CARTELLA_BUILD, 'prova-csp.html');
const PACCHETTO_PROVA = path.join(CARTELLA_BUILD, 'prova.html');
const PAGINA_PROVA = path.join(RADICE_GIOCO, 'prova.html');
const EVIDENZA = path.join(RADICE, 'production', 'qa', 'evidence', 'pacchetto-file.png');
/** Storia P04: la meta di index.html è `debug=1` (menu); la query di QA chiede il piano 1: ciclo in `notte`, stanza d'ingresso. */
const QUERY = '?debug=1&wire=1&seme=1845&piano=1';
const ATTESA_ERRORI_MS = 3000;

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

/** Avvia un server statico sulla cartella data. */
async function avviaServer(cartella, fileDiProva) {
  const porta = await portaLibera();
  const proc = spawn('python3', ['-m', 'http.server', String(porta), '--bind', '127.0.0.1', '--directory', cartella], {
    stdio: ['ignore', 'ignore', 'pipe'], // stderr incanalato e letto sotto (così il log delle richieste non blocca il server)
  });
  let stderr = '';
  proc.stderr.on('data', (d) => { stderr += d; });
  const base = `http://127.0.0.1:${porta}`;
  await attendiServer(`${base}/${fileDiProva}`);
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
async function apri(browser, url) {
  const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pagina = await contesto.newPage();
  const errori = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  pagina.on('pageerror', (e) => errori.push(String(e)));
  await pagina.goto(url, { waitUntil: 'load' });
  return { contesto, pagina, errori };
}

/** Verifiche comuni sul pacchetto aperto con QUERY: zero errori in 3 s, __gioco, tick, stato notte, stanza d'ingresso del piano 1. */
async function verificaPacchetto(browser, url) {
  const { contesto, pagina, errori } = await apri(browser, url);
  await pagina.waitForTimeout(ATTESA_ERRORI_MS);
  assert.deepEqual(errori, [], `errori in console/pagina (${url}):\n${errori.join('\n')}`);
  const esito = await pagina.evaluate(() => {
    const g = window.__gioco;
    if (!g) return { gioco: false };
    const t0 = g.tick();
    g.tick(60);
    return {
      gioco: true,
      stato: g.stato,
      avanzati: g.tick() - t0,
      stanza: g.stanza ? g.stanza.tipo : null,
      stanze: g.piano ? g.piano.stanze.length : 0,
      caricato: g.parametri.caricato(),
      moduleScript: document.querySelectorAll('script[type="module"], script[src]').length,
    };
  });
  assert.equal(esito.gioco, true, 'window.__gioco assente');
  assert.equal(esito.caricato, true, 'parametri non caricati');
  assert.equal(esito.avanzati, 60, `tick(60) ha avanzato di ${esito.avanzati}`);
  assert.equal(esito.stato, 'notte');
  assert.equal(esito.stanza, 'ingresso');
  assert.ok(esito.stanze >= 5, `piano 1 generato (${esito.stanze} stanze)`);
  assert.equal(esito.moduleScript, 0, 'il pacchetto contiene ancora <script type="module"> o <script src>');
  assert.deepEqual(errori, [], `errori dopo le verifiche:\n${errori.join('\n')}`);
  return { contesto, pagina, errori, esito };
}

/** Posizione di Ferruccio dopo `ferma(); tick(120)` con lo stesso seme. */
async function posizioneDeterministica(browser, url) {
  const { contesto, pagina, errori } = await apri(browser, url);
  await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano && window.__gioco.stanza);
  const esito = await pagina.evaluate(() => {
    const g = window.__gioco;
    g.ciclo.ferma();
    g.tick(120);
    return { x: g.ferruccio.x, y: g.ferruccio.y, stato: g.stato, seme: g.seme, stanza: g.stanza.id, stanze: g.piano.stanze.map((s) => s.id) };
  });
  assert.deepEqual(errori, [], `errori (${url}):\n${errori.join('\n')}`);
  await contesto.close();
  return esito;
}

function eseguiTool(argomenti) {
  const esito = spawnSync(process.execPath, [TOOL, ...argomenti], { cwd: RADICE, encoding: 'utf8' });
  const output = `${esito.stdout}${esito.stderr}`.trim();
  if (output) console.log(output.split('\n').map((r) => `  ${r}`).join('\n'));
  assert.equal(esito.status, 0, `impacchetta.js è uscito con ${esito.status}`);
  return esito;
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
  let browser;
  let serverBuild;
  let serverGioco;
  try {
    await caso('tool: impacchetta gioco/index.html in pagina intera e in frammento', async () => {
      eseguiTool(['--entrata', 'gioco/index.html', '--uscita', path.relative(RADICE, PACCHETTO)]);
      eseguiTool(['--entrata', 'gioco/index.html', '--uscita', path.relative(RADICE, FRAMMENTO), '--frammento']);
      const html = fs.readFileSync(PACCHETTO, 'utf8');
      assert.match(html, /^<!DOCTYPE html>/i);
      assert.ok(!/<script[^>]*type="module"/.test(html) && !/<script[^>]*\ssrc=/.test(html), 'nessuno script module/src');
      assert.ok(!/<link[^>]*stylesheet/.test(html), 'nessun <link rel="stylesheet">');
      assert.ok(!/\bimport\s*\(|importmap|blob:/.test(html.replace(/\/\*[\s\S]*?\*\//g, '')), 'nessuna import map, import() o blob:');
      assert.ok(html.includes('<div id="palco">') && html.includes('<canvas id="scena"') && html.includes('<div id="interfaccia">'), 'palco conservato');
      const frammento = fs.readFileSync(FRAMMENTO, 'utf8');
      assert.ok(!/<!DOCTYPE|<html|<head|<body/i.test(frammento), 'il frammento non ha doctype/html/head/body');
      assert.ok(frammento.indexOf('<title>') < frammento.indexOf('<style>') && frammento.indexOf('<style>') < frammento.indexOf('<script>') && frammento.indexOf('<script>') < frammento.indexOf('<div id="palco">'), 'ordine title, style, script, contenuto');
      console.log(`  dimensione pacchetto: ${(fs.statSync(PACCHETTO).size / 1024).toFixed(1)} KiB; frammento: ${(fs.statSync(FRAMMENTO).size / 1024).toFixed(1)} KiB`);

      // scheletro con CSP che ammette solo inline e data: — simula l'hosting che avvolge il frammento
      fs.writeFileSync(SCHELETRO_CSP, [
        '<!DOCTYPE html>',
        '<html lang="it"><head><meta charset="utf-8">',
        '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        '</head><body>',
        frammento,
        '</body></html>',
      ].join('\n'));
    });

    browser = await chromium.launch();
    serverBuild = await avviaServer(CARTELLA_BUILD, path.basename(PACCHETTO));
    serverGioco = await avviaServer(RADICE_GIOCO, 'index.html');

    await caso('pacchetto via http: zero errori in 3 s, __gioco, tick(60), stato notte, stanza d\'ingresso del piano 1', async () => {
      const { contesto } = await verificaPacchetto(browser, `${serverBuild.base}/${path.basename(PACCHETTO)}${QUERY}`);
      await contesto.close();
    });

    await caso('pacchetto via file://: zero errori in 3 s, __gioco, tick(60), stato notte, stanza d\'ingresso del piano 1; screenshot', async () => {
      const url = `${pathToFileURL(PACCHETTO).href}${QUERY}`;
      const { contesto, pagina, errori } = await verificaPacchetto(browser, url);
      fs.mkdirSync(path.dirname(EVIDENZA), { recursive: true });
      await pagina.screenshot({ path: EVIDENZA });
      assert.ok(fs.statSync(EVIDENZA).size > 0);
      assert.deepEqual(errori, []);
      await contesto.close();
    });

    await caso('frammento dentro uno scheletro con CSP (solo inline e data:) via http: zero errori, gioco nel piano 1', async () => {
      const { contesto } = await verificaPacchetto(browser, `${serverBuild.base}/${path.basename(SCHELETRO_CSP)}${QUERY}`);
      await contesto.close();
    });

    await caso('determinismo: originale e pacchetto, stesso seme, stessa posizione di Ferruccio dopo ferma(); tick(120)', async () => {
      const originale = await posizioneDeterministica(browser, `${serverGioco.base}/index.html${QUERY}`);
      const pacchetto = await posizioneDeterministica(browser, `${pathToFileURL(PACCHETTO).href}${QUERY}`);
      assert.deepEqual(pacchetto, originale, `originale ${JSON.stringify(originale)} ≠ pacchetto ${JSON.stringify(pacchetto)}`);
      console.log(`  ferruccio: ${JSON.stringify(originale)}`);
    });

    // --- storia P14: gli sprite veri (PNG incorporati come data: URI) si vedono anche nel pacchetto a file unico ---
    await caso('pacchetto via file:// con ?nemico=gatto: il canvas contiene i pixel del foglio gatto.png attorno al nemico', async () => {
      const url = `${pathToFileURL(PACCHETTO).href}${QUERY}&nemico=gatto`;
      const { contesto, pagina, errori } = await apri(browser, url);
      try {
        await pagina.waitForFunction(() => Boolean(window.__gioco), null, { timeout: 15000 });
        await pagina.waitForFunction(() => { const s = window.__gioco.resa.sprite?.(); return s && s.richiesti > 0 && s.caricamento === 0; }, null, { timeout: 20000 });
        await pagina.evaluate(() => { window.__gioco.ciclo.ferma(); window.__gioco.tick(6); });
        await pagina.waitForTimeout(250);
        const esito = await pagina.evaluate(async () => {
          const g = window.__gioco;
          const stato = g.resa.sprite();
          const b = g.bersagli.find((x) => x.id === 'nemico-prova');
          if (!b) return { stato, nemico: false };
          const colori = async (nome) => {
            const voce = g.sprite.voce(nome);
            const img = new Image();
            await new Promise((ris, rif) => { img.onload = ris; img.onerror = rif; img.src = window.__risorse[voce.file]; });
            const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
            const x = c.getContext('2d'); x.drawImage(img, 0, 0);
            const d = x.getImageData(0, 0, c.width, c.height).data;
            const s = new Set();
            for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255) s.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
            return s;
          };
          const propri = await colori('gatto');
          for (const k of await colori('scena-pavimento-tile')) propri.delete(k);
          const v = g.sprite.voce('gatto');
          const ctx = document.getElementById('scena').getContext('2d');
          const x0 = Math.floor(b.x - v.larghezza / 2 - 24), y0 = Math.floor(b.y + b.r * 0.5 - v.altezza - 24);
          const d = ctx.getImageData(x0, y0, v.larghezza + 48, v.altezza + 48).data;
          let n = 0;
          for (let i = 0; i < d.length; i += 4) if (propri.has((d[i] << 16) | (d[i + 1] << 8) | d[i + 2])) n++;
          return { stato, nemico: true, pixel: n, incorporati: Object.keys(window.__risorse ?? {}).length };
        });
        assert.ok(esito.nemico, 'il nemico di prova esiste nel pacchetto');
        assert.deepEqual(esito.stato.inErrore, [], 'nessun foglio in errore nel pacchetto');
        assert.ok(esito.incorporati >= 91, `PNG incorporati: ${esito.incorporati}`);
        assert.ok(esito.pixel >= 40, `pixel del foglio gatto attorno al nemico: ${esito.pixel}`);
        assert.deepEqual(errori, []);
      } finally {
        await contesto.close();
      }
    });

    if (fs.existsSync(PAGINA_PROVA)) {
      await caso('prova.html: impacchettata e aperta via file:// senza errori', async () => {
        eseguiTool(['--entrata', path.relative(RADICE, PAGINA_PROVA), '--uscita', path.relative(RADICE, PACCHETTO_PROVA)]);
        const { contesto, pagina, errori } = await apri(browser, `${pathToFileURL(PACCHETTO_PROVA).href}${QUERY}`);
        await pagina.waitForTimeout(ATTESA_ERRORI_MS);
        assert.deepEqual(errori, [], `errori in console/pagina:\n${errori.join('\n')}`);
        const esito = await pagina.evaluate(() => {
          const g = window.__gioco;
          if (!g) return { gioco: false };
          const t0 = g.tick();
          g.tick(60);
          return { gioco: true, avanzati: g.tick() - t0, stato: g.stato };
        });
        if (esito.gioco) assert.equal(esito.avanzati, 60, `tick(60) ha avanzato di ${esito.avanzati}`);
        else console.log('  # prova.html non espone __gioco: verificati solo gli errori');
        await contesto.close();
      });
    } else {
      console.log('# salto prova.html');
    }
  } finally {
    if (browser) await browser.close();
    if (serverBuild) await serverBuild.chiudi();
    if (serverGioco) await serverGioco.chiudi();
  }

  const falliti = esiti.filter((e) => !e.ok);
  console.log(`\n${esiti.length - falliti.length}/${esiti.length} casi superati`);
  if (falliti.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
