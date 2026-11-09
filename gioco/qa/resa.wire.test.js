/**
 * gioco/qa/resa.wire.test.js — Test di pagina della storia P14 (sprite veri ovunque) con il renderer pixel-art.
 *
 * Esecuzione: `node gioco/qa/resa.wire.test.js` dalla radice del repository (Playwright preinstallato; non eseguire mai
 * `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice `gioco/` e:
 *  - per gatto/maschera/bomba/guardia/statua/predone/vespa apre `?debug=1&piano=1&seme=1845&nemico=<archetipo>`, aspetta che
 *    tutti i fogli del manifesto siano caricati (`__gioco.resa.sprite()`), salva `production/qa/evidence/resa-<archetipo>.png`
 *    (deviceScaleFactor 1) e verifica che in una finestra attorno al nemico il canvas contenga pixel con i colori esatti del
 *    foglio PNG di quell'archetipo (colori che NON stanno nel tile del pavimento): lo sprite vero è a schermo;
 *  - hub: `?debug=1&seme=1845` + `__gioco.scegli('ferruccio')` → `resa-hub.png`, con i pixel di `hub-tonino` attorno a Tonino;
 *  - bottega: salta alla stanza `tesoro` del piano → `resa-bottega.png`, con i pixel di `scena-piedistallo` attorno al piedistallo
 *    e quelli dell'icona del dono (`oggetto-<id_teatro>`) sopra;
 *  - boss: `?boss=re-gatto`, salta alla stanza `boss` → `resa-boss.png`, con i pixel di `re-gatto` attorno al boss;
 *  - zero errori in console e nessun foglio in errore. Il server è chiuso nel `finally`.
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
const MANIFESTO = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'sprite.json'), 'utf8'));
const SEME = 1845;
const ID_PROVA = 'nemico-prova';
/** Archetipo del motore → nome del foglio nel manifesto (la stessa mappa del renderer). */
const FOGLIO_ARCHETIPO = { gatto: 'gatto', vespa: 'vespa-cieca', maschera: 'maschera', bomba: 'bomba-ferma', guardia: 'guardia', statua: 'statua', predone: 'predone' };
const ARCHETIPI = Object.keys(FOGLIO_ARCHETIPO);
/** Pixel con i colori del foglio che devono stare nella finestra attorno al soggetto perché lo sprite sia «a schermo». */
const MIN_PIXEL = 40;

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
    stdio: ['ignore', 'ignore', 'ignore'], // stderr ignorato: il log delle richieste (91 PNG) riempirebbe il pipe
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
    console.log(`not ok - ${nome}\n  ${String(e && e.stack ? e.stack : e).replace(/\n/g, '\n  ')}`);
  }
}

async function apri(browser, url) {
  const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const pagina = await contesto.newPage();
  const errori = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  pagina.on('pageerror', (e) => errori.push(String(e)));
  await pagina.goto(url, { waitUntil: 'load' });
  await pagina.waitForFunction(() => Boolean(window.__gioco), null, { timeout: 15000 });
  return { contesto, pagina, errori };
}

/** Aspetta che tutti i fogli del manifesto siano caricati (o in errore) e torna lo stato. */
async function attendiFogli(pagina) {
  await pagina.waitForFunction(() => {
    const s = window.__gioco.resa.sprite?.();
    return s && s.richiesti > 0 && s.caricamento === 0;
  }, null, { timeout: 20000 });
  const stato = await pagina.evaluate(() => window.__gioco.resa.sprite());
  assert.deepEqual(stato.inErrore, [], `fogli in errore: ${stato.inErrore.join(', ')}`);
  assert.equal(stato.caricati, MANIFESTO.voci.length, 'tutti i fogli del manifesto caricati');
  return stato;
}

/**
 * Conta nel canvas, nella finestra data (coordinate di scena), i pixel il cui colore esatto appartiene al foglio `nome`
 * (pixel opachi del PNG) e non al tile del pavimento né a quello del muro: se ce ne sono, lo sprite vero è a schermo.
 */
async function pixelDelFoglio(pagina, nome, finestra) {
  return pagina.evaluate(async ({ nome, finestra }) => {
    const g = window.__gioco;
    const colori = async (voce) => {
      const img = new Image();
      const src = (window.__risorse && window.__risorse[voce.file]) || voce.file;
      await new Promise((ris, rif) => { img.onload = ris; img.onerror = rif; img.src = src; });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      const s = new Set();
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255) s.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
      return s;
    };
    const voceDi = (n) => g.sprite.voce(n);
    const propri = await colori(voceDi(nome));
    for (const sfondo of ['scena-pavimento-tile', 'scena-muro-tile']) for (const k of await colori(voceDi(sfondo))) propri.delete(k);
    const canvas = document.getElementById('scena');
    const ctx = canvas.getContext('2d');
    const x0 = Math.max(0, Math.floor(finestra.x)), y0 = Math.max(0, Math.floor(finestra.y));
    const w = Math.min(canvas.width - x0, Math.ceil(finestra.w)), h = Math.min(canvas.height - y0, Math.ceil(finestra.h));
    const d = ctx.getImageData(x0, y0, w, h).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (propri.has((d[i] << 16) | (d[i + 1] << 8) | d[i + 2])) n++;
    return { pixel: n, coloriPropri: propri.size, finestra: { x0, y0, w, h } };
  }, { nome, finestra });
}

/** Finestra attorno a un corpo ancorato ai piedi (x, yPiedi) con il fotogramma `voce`. */
function finestraCorpo(voce, x, yPiedi, margine = 24) {
  return { x: x - voce.larghezza / 2 - margine, y: yPiedi - voce.altezza - margine, w: voce.larghezza + 2 * margine, h: voce.altezza + 2 * margine };
}

/** Un frame disegnato dopo lo stato corrente (il ciclo disegna da solo a ogni rAF). */
const attendiFrame = (pagina) => pagina.waitForTimeout(250);

async function main() {
  fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
  const server = await avviaServer();
  let browser = null;
  try {
    browser = await chromium.launch();

    for (const arch of ARCHETIPI) {
      await caso(`nemico ${arch}: il foglio ${FOGLIO_ARCHETIPO[arch]} è a schermo (resa-${arch}.png), zero errori`, async () => {
        const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=1&piano=1&seme=${SEME}&nemico=${arch}`);
        try {
          await attendiFogli(pagina);
          await pagina.evaluate(() => { window.__gioco.ciclo.ferma(); window.__gioco.tick(6); });
          await attendiFrame(pagina);
          const b = await pagina.evaluate((id) => {
            const n = window.__gioco.bersagli.find((x) => x.id === id);
            return n ? { x: n.x, y: n.y, r: n.r, stato: n.stato } : null;
          }, ID_PROVA);
          assert.ok(b, 'il nemico di prova esiste');
          const nome = FOGLIO_ARCHETIPO[arch];
          const voce = MANIFESTO.voci.find((v) => v.nome === nome);
          const esito = await pixelDelFoglio(pagina, nome, finestraCorpo(voce, b.x, b.y + b.r * 0.5));
          await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, `resa-${arch}.png`) });
          assert.ok(esito.coloriPropri > 0, 'il foglio ha colori propri');
          assert.ok(esito.pixel >= MIN_PIXEL, `pixel del foglio ${nome} attorno al nemico: ${esito.pixel} (stato ${b.stato})`);
          assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
        } finally {
          await contesto.close();
        }
      });
    }

    await caso('hub di Piazza Dante: Tonino, porta di Gaetano, finestra di Mariella e luna con i fogli hub-* (resa-hub.png)', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=1&seme=${SEME}`);
      try {
        await attendiFogli(pagina);
        await pagina.evaluate(() => { window.__gioco.scegli('ferruccio'); window.__gioco.ciclo.ferma(); window.__gioco.tick(4); });
        // passo di integrazione (P16): index.html mostra il pannello dei tasti (interfaccia/prova.js) che coprirebbe l'hub nello
        // screenshot: un pointerdown sulla finestra lo chiude come farebbe il primo click (non raggiunge il cartiglio del dialogo)
        await pagina.evaluate(() => { window.dispatchEvent(new PointerEvent('pointerdown')); });
        await attendiFrame(pagina);
        const st = await pagina.evaluate(() => ({
          stato: window.__gioco.stato, pannello: window.__gioco.pannelloProva(),
          presenze: window.__gioco.hub.presenze().filter((p) => p.presente).map((p) => ({ id: p.id, tipo: p.tipo, x: p.x, y: p.y })),
        }));
        assert.equal(st.stato, 'hub');
        assert.notEqual(st.pannello, true, 'il pannello dei tasti è chiuso prima dello screenshot dell\'hub');
        const tonino = st.presenze.find((p) => p.id === 'tonino');
        assert.ok(tonino, 'Tonino è presente nell\'hub');
        const voce = MANIFESTO.voci.find((v) => v.nome === 'hub-tonino');
        const esito = await pixelDelFoglio(pagina, 'hub-tonino', finestraCorpo(voce, tonino.x, tonino.y + 6));
        await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'resa-hub.png') });
        assert.ok(esito.pixel >= MIN_PIXEL, `pixel di hub-tonino attorno a Tonino: ${esito.pixel}`);
        const porta = st.presenze.find((p) => p.tipo === 'porta');
        if (porta) {
          const vp = MANIFESTO.voci.find((v) => v.nome === 'hub-gaetano-porta');
          const ep = await pixelDelFoglio(pagina, 'hub-gaetano-porta', finestraCorpo(vp, porta.x, porta.y + 26));
          assert.ok(ep.pixel >= MIN_PIXEL, `pixel della porta di Gaetano: ${ep.pixel}`);
        }
        assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      } finally {
        await contesto.close();
      }
    });

    await caso('bottega (stanza tesoro): piedistallo di scena e icona del dono (resa-bottega.png)', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=1&piano=1&seme=${SEME}`);
      try {
        await attendiFogli(pagina);
        const info = await pagina.evaluate(() => {
          const g = window.__gioco;
          const tesoro = g.piano.stanze.find((s) => s.tipo === 'tesoro');
          if (!tesoro) return null;
          g.ciclo.ferma();
          g.vaiA(tesoro.id);
          g.tick(90); // la transizione della camera si esaurisce
          const pd = g.piedistalli.elenco().filter((p) => p.stato === 'offerto');
          return { stanza: g.stanza.tipo, piedistalli: pd.map((p) => ({ x: p.x, y: p.y, id: p.dono?.id ?? null, idTeatro: p.dono?.teatro?.id_teatro ?? null })) };
        });
        assert.ok(info, 'il piano ha una stanza tesoro');
        assert.equal(info.stanza, 'tesoro');
        assert.ok(info.piedistalli.length >= 1, 'almeno un piedistallo offerto');
        await attendiFrame(pagina);
        const p = info.piedistalli[0];
        const vp = MANIFESTO.voci.find((v) => v.nome === 'scena-piedistallo');
        const ep = await pixelDelFoglio(pagina, 'scena-piedistallo', finestraCorpo(vp, p.x, p.y + 14));
        await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'resa-bottega.png') });
        assert.ok(ep.pixel >= MIN_PIXEL, `pixel del piedistallo: ${ep.pixel}`);
        const icona = p.idTeatro ? `oggetto-${p.idTeatro}` : null;
        if (icona && MANIFESTO.voci.some((v) => v.nome === icona)) {
          const ei = await pixelDelFoglio(pagina, icona, { x: p.x - 32, y: p.y - 60, w: 64, h: 60 });
          assert.ok(ei.pixel >= 10, `pixel dell'icona ${icona}: ${ei.pixel}`);
        }
        assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      } finally {
        await contesto.close();
      }
    });

    await caso('boss (Re Gatto forzato): il foglio re-gatto è a schermo nella stanza boss (resa-boss.png)', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/?debug=1&piano=1&seme=${SEME}&boss=re-gatto&sipario=0`);
      try {
        await attendiFogli(pagina);
        const b = await pagina.evaluate(() => {
          const g = window.__gioco;
          const stanza = g.piano.stanze.find((s) => s.tipo === 'boss');
          g.ciclo.ferma();
          g.vaiA(stanza.id);
          g.tick(90);
          const boss = g.bersagli.find((x) => x.boss && x.stato !== 'morto');
          return boss ? { x: boss.x, y: boss.y, r: boss.r, bossId: boss.bossId, stato: boss.stato } : null;
        });
        assert.ok(b, 'il boss è nato nella stanza boss');
        assert.equal(b.bossId, 're-gatto');
        await attendiFrame(pagina);
        const voce = MANIFESTO.voci.find((v) => v.nome === 're-gatto');
        const esito = await pixelDelFoglio(pagina, 're-gatto', finestraCorpo(voce, b.x, b.y + b.r * 0.5));
        await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'resa-boss.png') });
        assert.ok(esito.pixel >= MIN_PIXEL, `pixel di re-gatto attorno al boss: ${esito.pixel} (stato ${b.stato})`);
        assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      } finally {
        await contesto.close();
      }
    });
  } finally {
    if (browser) await browser.close();
    await server.chiudi();
  }

  const falliti = esiti.filter((e) => !e.ok);
  console.log(`\n# ${esiti.length - falliti.length}/${esiti.length} casi verdi`);
  if (falliti.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
