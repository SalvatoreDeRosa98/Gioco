/**
 * gioco/qa/feel.wire.test.js — Test di pagina del game feel (storia P08) sul renderer pixel-art.
 *
 * Esecuzione: `node gioco/qa/feel.wire.test.js` dalla radice del repository (Playwright preinstallato;
 * mai `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice `gioco/`,
 * apre `?debug=1&piano=1&seme=1845`, ferma il ciclo rAF e lo guida a mano via `window.__gioco`:
 *  1. colpo subito → nel frame successivo la sagoma di Ferruccio è semitrasparente (alpha del frame < 1
 *     E il pixel più chiaro della sagoma si scurisce rispetto a un frame pieno) e il corpo è arretrato
 *     rispetto alla fonte; screenshot `feel-iframes.png`;
 *  2. colpo inferto a un nemico vero → `ferruccio.colpo`, i tick di simulazione restano fermi per
 *     2-3 frame (`hit_stop_ms`, o `hit_stop_uccisione_ms` se il colpo uccide) mentre `contaFrame()` avanza;
 *  3. morte del nemico → una macchia in `feel.macchie()` e un pixel scuro sul pavimento dove è caduto,
 *     che resta dopo altri frame; screenshot `feel-macchie.png`; al cambio di stanza il buffer si azzera.
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

/** Funzioni in pagina condivise dai casi (serializzate da Playwright). */
const IN_PAGINA = `
  const g = window.__gioco;
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  /** Coordinate del buffer del canvas per un punto del mondo (trasformazione della camera + scala del buffer). */
  const schermo = (wx, wy) => {
    const cx = 640, cy = 360;
    const s = g.camera ? g.camera.scala : 1;
    const sc = g.camera ? g.camera.scorrimento() : { x: 0, y: 0 };
    const kx = canvas.width / 1280, ky = canvas.height / 720;
    return { x: (cx + sc.x + (wx - cx) * s) * kx, y: (cy + sc.y + (wy - cy) * s) * ky };
  };
  const luminanza = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  /** Pixel più chiaro di una finestra quadrata attorno a un punto del mondo. */
  const piuChiaro = (wx, wy, semi) => {
    const p = schermo(wx, wy);
    const x0 = Math.max(0, Math.round(p.x - semi)), y0 = Math.max(0, Math.round(p.y - semi));
    const w = Math.min(canvas.width - x0, semi * 2), h = Math.min(canvas.height - y0, semi * 2);
    const d = ctx.getImageData(x0, y0, w, h).data;
    let best = { l: -1, x: 0, y: 0 };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const l = luminanza(d, i);
      if (l > best.l) best = { l, x: x0 + x, y: y0 + y };
    }
    return best;
  };
  const luminanzaIn = (x, y) => { const d = ctx.getImageData(x, y, 1, 1).data; return luminanza(d, 0); };
  /** Numero di pixel scuri (china) in una finestra attorno a un punto del mondo. */
  const scuriAttorno = (wx, wy, semi, soglia) => {
    const p = schermo(wx, wy);
    const x0 = Math.max(0, Math.round(p.x - semi)), y0 = Math.max(0, Math.round(p.y - semi));
    const w = Math.min(canvas.width - x0, semi * 2), h = Math.min(canvas.height - y0, semi * 2);
    const d = ctx.getImageData(x0, y0, w, h).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (luminanza(d, i) < soglia) n++;
    return n;
  };
  /** Un frame del ciclo guidato a mano (16,67 ms dopo l'ultimo). */
  window.__t = window.__t ?? performance.now();
  const frame = () => { window.__t += 1000 / 60; return g.ciclo.frame(window.__t); };
`;

async function main() {
  const server = await avviaServer();
  let browser;
  try {
    browser = await chromium.launch();
    const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const pagina = await contesto.newPage();
    const errori = [];
    pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
    pagina.on('pageerror', (e) => errori.push(String(e)));
    await pagina.goto(`${server.base}/?debug=1&piano=1&seme=${SEME}`, { waitUntil: 'load' });
    await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano);
    await pagina.waitForFunction(() => window.__gioco.tick() > 5);
    fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });

    await caso('i-frames: colpo subito → frame dopo con alpha < 1 (pixel più scuro), lampeggio a semionde, corpo arretrato; screenshot feel-iframes.png', async () => {
      const esito = await pagina.evaluate(`(() => { ${IN_PAGINA}
        g.ciclo.ferma();
        g.ciclo.frame(window.__t);
        const f = g.ferruccio;
        const x0 = f.x, y0 = f.y;
        const pieno = piuChiaro(f.x, f.y - 20, 36); // il pixel più chiaro della sagoma sana (cappuccio/occhi)
        const alphaPrima = g.resa.ultimoAlphaSagoma();
        const esito = { x0, alphaPrima, pienoL: pieno.l, applicato: f.subisciDanno({ x: f.x + 40, y: f.y }).applicato };
        frame(); // il frame successivo al colpo
        esito.alphaDopo = g.resa.ultimoAlphaSagoma();
        esito.statoDopo = f.stato;
        const traslucido = piuChiaro(f.x, f.y - 20, 36);
        esito.traslucidoL = traslucido.l;
        esito.alphaJson = g.parametri.get('resa.lampeggio.alpha');
        esito.semi = Math.max(1, Math.round(g.parametri.get('resa.lampeggio.semiperiodo_ms') / (1000 / 60)));
        // la semionda successiva è piena: l'alpha torna a 1 mentre il corpo è ancora invulnerabile
        const alphe = [esito.alphaDopo];
        for (let i = 0; i < esito.semi * 2; i++) { frame(); alphe.push(g.resa.ultimoAlphaSagoma()); }
        esito.alphe = alphe;
        esito.invulnerabile = f.invulnerabile();
        // la spinta finisce entro t_spinta: il corpo è arretrato (fonte a destra → verso sinistra)
        const tSpinta = Math.round(g.parametri.get('ferruccio.t_spinta') / (1000 / 60));
        for (let i = 0; i < tSpinta; i++) frame();
        esito.x1 = f.x; esito.y1 = f.y;
        // torna su una semionda semitrasparente per lo screenshot
        for (let i = 0; i < esito.semi * 2 && g.resa.ultimoAlphaSagoma() >= 1; i++) frame();
        esito.alphaScreenshot = g.resa.ultimoAlphaSagoma();
        return esito;
      })()`);
      assert.equal(esito.applicato, true, 'il colpo è applicato');
      assert.equal(esito.alphaPrima, 1, 'sano: sagoma piena');
      assert.equal(esito.statoDopo, 'colpito');
      assert.equal(esito.alphaDopo, esito.alphaJson, `frame dopo il colpo: alpha ${esito.alphaDopo} = resa.lampeggio.alpha`);
      assert.ok(esito.alphaDopo < 1);
      assert.ok(esito.traslucidoL < esito.pienoL - 10, `pixel più chiaro della sagoma: ${esito.traslucidoL.toFixed(1)} (semitrasparente) < ${esito.pienoL.toFixed(1)} (pieno)`);
      assert.ok(esito.alphe.includes(1) && esito.alphe.includes(esito.alphaJson), `lampeggio a semionde: ${esito.alphe.join(',')}`);
      assert.equal(esito.invulnerabile, true, 'ancora invulnerabile (t_invuln ≥ 1000 ms)');
      assert.ok(esito.x1 < esito.x0 - 5, `arretrato di ${(esito.x0 - esito.x1).toFixed(1)} px rispetto alla fonte (a destra)`);
      assert.ok(esito.alphaScreenshot < 1, 'screenshot su una semionda semitrasparente');
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'feel-iframes.png') });
    });

    await caso('hit-stop: colpo inferto a un nemico vero → la simulazione resta ferma per hit_stop_ms (2-3 frame) mentre i frame disegnati avanzano', async () => {
      const esito = await pagina.evaluate(`(() => { ${IN_PAGINA}
        const esito = { tentate: [] };
        // finisce l'invulnerabilità del caso precedente, poi cerca una stanza con nemici
        while (g.ferruccio.invulnerabile()) frame();
        const esclusi = ['boss', 'ingresso', 'bottega', 'segreta', 'banchetto', 'inizio', 'partenza'];
        const candidate = g.piano.stanze.filter((s) => s.id !== g.stanza.id && !esclusi.includes(s.tipo));
        let b = null;
        for (const s of candidate) {
          if (!g.vaiA(s.id)) continue;
          let n = 0;
          for (; n < 240 && g.bersagli.length === 0; n++) g.tick(1);
          esito.tentate.push({ id: s.id, tipo: s.tipo, nemici: g.bersagli.length, n });
          if (g.bersagli.length > 0) { b = g.bersagli[0]; break; }
        }
        if (!b) return esito;
        for (let n = 0; n < 300 && (b.stato === 'emersione' || b.stato === 'nato'); n++) g.tick(1);
        esito.nemico = { archetipo: b.archetipo, stato: b.stato, vita: b.vita, peso: b.peso, r: b.r };
        // Ferruccio a sinistra del nemico, mira a destra, fendente
        g.ferruccio.posiziona(b.x - (b.r + 30), b.y);
        g.tieni('destra'); g.tick(1); g.lascia('destra'); g.tick(1);
        const colpi = [];
        g.eventi.on('ferruccio.colpo', (p) => colpi.push({ frame: g.ciclo.contaFrame(), tick: g.ciclo.contaTick(), congelato: g.ciclo.congelato(), vita: p.bersaglio.vita }));
        window.__colpi = colpi;
        g.premi('attacco', 1);
        let f = 0;
        for (; f < 60 && colpi.length === 0; f++) frame();
        esito.frameAlColpo = f;
        esito.colpi = colpi.slice();
        if (!colpi.length) return esito;
        esito.hitStopMs = g.parametri.get('combattimento.feel.hit_stop_ms');
        esito.hitStopUccisioneMs = g.parametri.get('combattimento.feel.hit_stop_uccisione_ms');
        esito.ucciso = colpi[0].vita <= 0;
        esito.congelatoDopo = g.ciclo.congelato();
        const tick0 = g.ciclo.contaTick(), frame0 = g.ciclo.contaFrame();
        const passi = [];
        for (let i = 0; i < esito.congelatoDopo; i++) passi.push({ eseguiti: frame(), tick: g.ciclo.contaTick() - tick0, frame: g.ciclo.contaFrame() - frame0 });
        esito.passi = passi;
        esito.ripresa = frame();
        esito.tickDopo = g.ciclo.contaTick() - tick0;
        return esito;
      })()`);
      assert.ok(esito.nemico, `nessuna stanza con nemici trovata: ${JSON.stringify(esito.tentate)}`);
      assert.ok(esito.colpi.length >= 1, `il fendente colpisce il ${esito.nemico.archetipo} (frame ${esito.frameAlColpo})`);
      const passo = 1000 / 60;
      const attesi = Math.max(1, Math.round((esito.ucciso ? esito.hitStopUccisioneMs : esito.hitStopMs) / passo));
      assert.ok(Math.round(esito.hitStopMs / passo) >= 2 && Math.round(esito.hitStopMs / passo) <= 3, 'hit_stop_ms vale 2-3 frame');
      assert.equal(esito.congelatoDopo, attesi, `congelato per ${esito.congelatoDopo} tick (attesi ${attesi}, ucciso=${esito.ucciso})`);
      for (const p of esito.passi) assert.equal(p.eseguiti, 0, `frame congelato senza tick: ${JSON.stringify(p)}`);
      assert.equal(esito.passi[esito.passi.length - 1].tick, 0, 'la simulazione non è avanzata');
      assert.equal(esito.passi[esito.passi.length - 1].frame, attesi, 'i frame disegnati sono avanzati');
      assert.equal(esito.ripresa, 1, 'poi la simulazione riparte');
      assert.equal(esito.tickDopo, 1);
    });

    await caso('macchie: nemico morto → macchia in feel.macchie() e pixel scuri sul pavimento che restano; cambio di stanza → buffer azzerato; screenshot feel-macchie.png', async () => {
      const esito = await pagina.evaluate(`(() => { ${IN_PAGINA}
        const b = g.bersagli.find((x) => x.stato !== 'morto');
        if (!b) return { nessunNemico: true };
        const esito = { prima: g.feel.macchie().length };
        const x = b.x, y = b.y;
        const morti = [];
        g.eventi.on('nemico.morto', (p) => morti.push(p));
        for (let i = 0; i < 50 && b.stato !== 'morto'; i++) { b.colpisci(b.vita + 1, null); frame(); }
        esito.stato = b.stato;
        esito.morti = morti.length;
        esito.dopo = g.feel.macchie().length;
        esito.macchia = g.feel.macchie()[g.feel.macchie().length - 1];
        // oltre la dissoluzione, così sul pavimento resta solo la macchia; e ancora dopo, per la permanenza
        const tDiss = Math.round((morti[0]?.tDissoluzione ?? 0) / (1000 / 60)) + 5;
        for (let i = 0; i < tDiss; i++) frame();
        const semi = Math.round(g.parametri.get('resa.macchie.raggio_px') * (g.camera ? g.camera.scala : 1)) + 4;
        esito.scuri1 = scuriAttorno(esito.macchia.x, esito.macchia.y, semi, 40);
        for (let i = 0; i < 120; i++) frame();
        esito.scuri2 = scuriAttorno(esito.macchia.x, esito.macchia.y, semi, 40);
        esito.ancora = g.feel.macchie().length;
        // posiziona Ferruccio lontano dalla macchia per lo screenshot pulito
        return esito;
      })()`);
      assert.ok(!esito.nessunNemico, 'c\'è un nemico da uccidere');
      assert.equal(esito.stato, 'morto');
      assert.equal(esito.morti, 1, 'un evento nemico.morto');
      assert.equal(esito.dopo, esito.prima + 1, 'una macchia in più');
      assert.ok(['china', 'legno'].includes(esito.macchia.tipo));
      assert.ok(esito.scuri1 > 0, `pixel scuri (china) sul pavimento attorno alla macchia: ${esito.scuri1}`);
      assert.ok(esito.scuri2 > 0, `restano dopo 120 frame: ${esito.scuri2}`);
      assert.equal(esito.ancora, esito.dopo, 'il buffer resta finché si è nella stanza');
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'feel-macchie.png') });
      const cambio = await pagina.evaluate(`(() => { ${IN_PAGINA}
        const altra = g.piano.stanze.find((s) => s.id !== g.stanza.id);
        const ok = g.vaiA(altra.id);
        g.tick(2);
        return { ok, macchie: g.feel.macchie().length, stanza: g.stanza.id, altra: altra.id };
      })()`);
      assert.equal(cambio.ok, true);
      assert.equal(cambio.macchie, 0, 'cambio di stanza: macchie azzerate');
    });

    assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
    console.log('ok - zero errori in console');
  } finally {
    if (browser) await browser.close();
    await server.chiudi();
  }
  const falliti = esiti.filter((e) => !e.ok);
  console.log(`# ${esiti.length - falliti.length}/${esiti.length} casi verdi`);
  if (falliti.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
