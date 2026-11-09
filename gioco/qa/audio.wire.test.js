/**
 * gioco/qa/audio.wire.test.js — Test di pagina della storia P10 (audio dinamico minimale con Web Audio API).
 *
 * Esecuzione: `node gioco/qa/audio.wire.test.js` dalla radice (Playwright preinstallato; non eseguire mai
 * `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice `gioco/`. Non si può ascoltare:
 * prima del caricamento `page.addInitScript` sostituisce `window.AudioContext` con una sottoclasse che conta i contesti
 * creati e le chiamate `create*` (`window.__audioConta`).
 *  1. `?debug=1&seme=1845` (menu): la pagina parte senza errori e SENZA contesto (i browser lo vietano prima di un gesto);
 *     dopo un tasto neutro il contesto esiste ed è `running` o `suspended`, senza eccezioni; se gira, gli eventi del bus
 *     creano i nodi: `stanza.entrata` → ≥ 3 oscillatori (campana), `attore.passo` → sorgente di rumore + filtro (toc),
 *     `esplosione` → convolver (tonfo); `M` → muto (interruttore DOM «Audio: spento (M)» visibile nel menu, master a 0);
 *     screenshot `production/qa/evidence/menu-audio.png`; click sull'interruttore → audio acceso.
 *  2. `?debug=1&hub=1&seme=1845&personaggio=ferruccio` (hub, menu saltato): l'interruttore è nascosto; camminando a destra
 *     per 90 tick partono gli `attore.passo` (`__gioco.audio.passi()` ≥ 1) e, se il contesto gira, i toc; zero errori.
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
const EVIDENZA_MENU = path.join(CARTELLA_EVIDENZE, 'menu-audio.png');
const AUDIO = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'parametri', 'audio.json'), 'utf8'));
const TESTI = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'interfaccia.json'), 'utf8'));
/** Tasto neutro (non mappato in input.json né nel menu) che conta come gesto dell'utente. */
const TASTO_NEUTRO = 'ShiftLeft';
const TASTO_MUTO = 'KeyM';
/** I gain di Web Audio sono float32: confronto con tolleranza. */
const vicino = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} ≠ ${b}`);

/** Eseguito prima di ogni script della pagina: conta contesti e nodi creati. */
function patchAudioContext() {
  const Orig = window.AudioContext;
  const conta = { contesti: 0, nodi: {}, eccezioni: [] };
  window.__audioConta = conta;
  if (typeof Orig !== 'function') return;
  const METODI = ['createOscillator', 'createGain', 'createBiquadFilter', 'createBufferSource', 'createConvolver', 'createBuffer'];
  class Contato extends Orig {
    constructor(...a) { super(...a); conta.contesti += 1; }
  }
  for (const m of METODI) {
    const orig = Orig.prototype[m];
    Contato.prototype[m] = function (...a) {
      conta.nodi[m] = (conta.nodi[m] ?? 0) + 1;
      try { return orig.apply(this, a); } catch (e) { conta.eccezioni.push(`${m}: ${e}`); throw e; }
    };
  }
  window.AudioContext = Contato;
}

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
    stdio: ['ignore', 'ignore', 'ignore'], // stderr ignorato: il log delle richieste (sprite) riempirebbe il pipe e bloccherebbe il server
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

/** Apre una pagina con la patch del contesto e la raccolta degli errori. */
async function apri(browser, url) {
  const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const pagina = await contesto.newPage();
  await pagina.addInitScript(patchAudioContext);
  const errori = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  pagina.on('pageerror', (e) => errori.push(String(e)));
  await pagina.goto(url, { waitUntil: 'load' });
  await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato());
  return { contesto, pagina, errori };
}

async function main() {
  fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
  const server = await avviaServer();
  let browser;
  try {
    browser = await chromium.launch();

    await caso('menu: nessun contesto prima di un gesto; dopo un tasto il contesto è running|suspended senza eccezioni; eventi → nodi; M → muto con interruttore; screenshot', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=1&seme=1845`);
      const prima = await pagina.evaluate(() => ({ stato: window.__gioco.stato, audio: window.__gioco.audio.stato(), conta: window.__audioConta, menu: window.__gioco.menu() !== null }));
      assert.equal(prima.stato, 'menu');
      assert.equal(prima.menu, true);
      assert.deepEqual(prima.audio, { disponibile: true, contesto: null, muto: false, volume: null }, 'nessun contesto prima del gesto');
      assert.equal(prima.conta.contesti, 0);

      await pagina.keyboard.press(TASTO_NEUTRO);
      await pagina.waitForFunction(() => window.__gioco.audio.stato().contesto !== null);
      const dopo = await pagina.evaluate(() => ({ audio: window.__gioco.audio.stato(), conta: window.__audioConta }));
      assert.ok(['running', 'suspended'].includes(dopo.audio.contesto), `stato del contesto: ${dopo.audio.contesto}`);
      assert.equal(dopo.conta.contesti, 1, 'un solo AudioContext');
      assert.deepEqual(dopo.conta.eccezioni, []);
      assert.ok(dopo.conta.nodi.createGain >= 1, 'il master è un gain');
      vicino(dopo.audio.volume, AUDIO.master.volume.base, 'master a audio.master.volume');
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      if (dopo.audio.contesto === 'running') {
        const nodi = await pagina.evaluate(() => {
          const g = window.__gioco;
          const c = window.__audioConta;
          const foto = () => JSON.parse(JSON.stringify(c.nodi));
          const n0 = foto();
          g.eventi.emit('stanza.entrata', { id: 'qa', tipo: 'normale', stato: 'non_visitata' });
          const n1 = foto();
          g.eventi.emit('attore.passo', { id: 'ferruccio', tipo: 'ferruccio', x: 0, y: 0 });
          const n2 = foto();
          g.eventi.emit('esplosione', { x: 0, y: 0 });
          const n3 = foto();
          return { n0, n1, n2, n3, emessi: g.audio.emessi(), suonati: g.audio.suonati(), eccezioni: c.eccezioni };
        });
        const delta = (a, b, k) => (b[k] ?? 0) - (a[k] ?? 0);
        assert.equal(delta(nodi.n0, nodi.n1, 'createOscillator'), 3, 'campana: tre oscillatori');
        assert.equal(delta(nodi.n1, nodi.n2, 'createBufferSource'), 1, 'toc: una sorgente di rumore');
        assert.equal(delta(nodi.n1, nodi.n2, 'createBiquadFilter'), 1, 'toc: un filtro');
        assert.equal(delta(nodi.n1, nodi.n2, 'createOscillator'), 1, 'toc: un oscillatore');
        assert.equal(delta(nodi.n2, nodi.n3, 'createConvolver'), 1, 'tonfo: un convolver');
        assert.deepEqual(nodi.eccezioni, []);
        assert.deepEqual(nodi.suonati, { campana: 1, passo: 1, tonfo: 1 });
        assert.equal(nodi.emessi.campana, 1);
      } else {
        console.log('# contesto sospeso nel browser headless: salto il conteggio dei nodi per evento');
      }

      // M → muto; l'interruttore DOM nel menu mostra «spento»; il master va a zero
      await pagina.keyboard.press(TASTO_MUTO);
      await pagina.waitForFunction(() => window.__gioco.audio.stato().muto === true);
      await pagina.waitForFunction((atteso) => document.querySelector('#interfaccia .audio-interruttore')?.textContent === atteso, TESTI.audio.spento.replace('{tasto}', 'M'));
      const muto = await pagina.evaluate(() => {
        const g = window.__gioco;
        const el = document.querySelector('#interfaccia .audio-interruttore');
        return {
          audio: g.audio.stato(), interruttore: g.audio.interruttore(), hidden: el.hidden, visibile: el.getBoundingClientRect().width > 0,
          classeMuto: el.classList.contains('muto'), suona: g.audio.suona('moneta'),
        };
      });
      assert.equal(muto.audio.muto, true);
      assert.equal(muto.audio.volume, 0);
      assert.equal(muto.interruttore.visibile, true);
      assert.equal(muto.hidden, false);
      assert.equal(muto.visibile, true, 'l\'interruttore è a schermo nel menu');
      assert.equal(muto.classeMuto, true);
      assert.equal(muto.suona, false, 'in muto non nasce nessun nodo');
      await pagina.screenshot({ path: EVIDENZA_MENU });
      assert.ok(fs.existsSync(EVIDENZA_MENU));

      // click sull'interruttore → acceso
      await pagina.click('#interfaccia .audio-interruttore');
      await pagina.waitForFunction(() => window.__gioco.audio.stato().muto === false);
      const acceso = await pagina.evaluate(() => ({ audio: window.__gioco.audio.stato(), testo: document.querySelector('#interfaccia .audio-interruttore').textContent }));
      vicino(acceso.audio.volume, AUDIO.master.volume.base, 'master riacceso');
      assert.equal(acceso.testo, TESTI.audio.acceso.replace('{tasto}', 'M'));
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });

    await caso('piano 1 (stanza d\'ingresso): interruttore nascosto; camminando partono gli attore.passo (e i toc se il contesto gira); zero errori', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=1&wire=1&piano=1&seme=1845`);
      await pagina.waitForFunction(() => window.__gioco.stato === 'notte' && window.__gioco.tick() > 5);
      await pagina.keyboard.press(TASTO_NEUTRO);
      await pagina.waitForFunction(() => window.__gioco.audio.stato().contesto !== null);
      const esito = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.ciclo.ferma();
        const passiPrima = g.audio.passi();
        const x0 = g.ferruccio.x;
        g.premi('destra', 90);
        return {
          stato: g.stato, contesto: g.audio.stato().contesto, interruttore: g.audio.interruttore(), passi: g.audio.passi() - passiPrima,
          spostamento: g.ferruccio.x - x0, suonati: g.audio.suonati(), eccezioni: window.__audioConta.eccezioni,
        };
      });
      assert.equal(esito.stato, 'notte');
      assert.equal(esito.interruttore.visibile, false, 'fuori dal menu l\'interruttore è nascosto');
      assert.ok(esito.spostamento > 0, 'Ferruccio ha camminato');
      const attesi = Math.floor(esito.spostamento / AUDIO.passi.lunghezza_px.base);
      assert.ok(esito.passi >= Math.max(1, attesi - 1) && esito.passi <= attesi + 1, `passi ${esito.passi} per ${esito.spostamento} px (attesi ≈ ${attesi})`);
      if (esito.contesto === 'running') assert.ok((esito.suonati.passo ?? 0) >= 1, 'almeno un toc');
      assert.deepEqual(esito.eccezioni, []);
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
