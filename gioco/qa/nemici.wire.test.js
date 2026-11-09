/**
 * gioco/qa/nemici.wire.test.js — Test di pagina della storia P05 (nemici alla Isaac del Teatro e proiettili nemici)
 * con il renderer pixel-art.
 *
 * Esecuzione: `node gioco/qa/nemici.wire.test.js` dalla radice del repository (Playwright preinstallato; non eseguire
 * mai `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice `gioco/` e, per ogni archetipo
 * di `nemici.json`, apre `?debug=1&piano=1&seme=1845&nemico=<archetipo>`: un nemico vero (`nemico-prova`) nasce nella
 * stanza d'ingresso; il test ferma il ciclo, porta Ferruccio a tiro, forza `insegue` e avanza a tick finché il nemico è
 * in anticipo/lampo (telegrafo solo sul corpo: nessun segno a terra nel renderer), salva
 * `production/qa/evidence/nemici-<archetipo>.png` (deviceScaleFactor 1), poi verifica il Colpo: i tiratori (`tiratore`)
 * mettono proiettili in `__gioco.proiettili`, la bomba emette `nemico.esplosione`, gli altri una hitbox; infine lo uccide
 * (`colpisci`) e controlla `nemico.morto`. Zero errori in console. Il server è chiuso nel `finally`.
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
const NEMICI = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'parametri', 'nemici.json'), 'utf8'));
const ARCHETIPI = Object.keys(NEMICI.archetipi).filter((k) => !k.startsWith('_'));
const SEME = 1845;
const ID_PROVA = 'nemico-prova';

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
  fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch();
    for (const archetipo of ARCHETIPI) {
      const scheda = NEMICI.archetipi[archetipo];
      await caso(`${archetipo}: nasce nel piano 1 da ?nemico=, telegrafo sul corpo (anticipo/lampo, screenshot nemici-${archetipo}.png), il Colpo è ${scheda.sparo ? 'una salva di proiettili' : scheda.esplosione ? 'un\'esplosione' : 'una hitbox'}, muore; zero errori`, async () => {
        const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
        const pagina = await contesto.newPage();
        const errori = [];
        pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
        pagina.on('pageerror', (e) => errori.push(String(e)));
        await pagina.goto(`${server.base}/?debug=1&piano=1&seme=${SEME}&nemico=${archetipo}`, { waitUntil: 'load' });
        await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano);
        await pagina.waitForFunction((id) => window.__gioco.bersagli.some((b) => b.id === id), ID_PROVA);
        const esito = await pagina.evaluate(({ id, dMax, dMin }) => {
          const g = window.__gioco;
          g.ciclo.ferma();
          const eventi = [];
          for (const n of ['telegrafo.anticipo', 'telegrafo.lampo', 'nemico.sparo', 'nemico.esplosione', 'nemico.colpo', 'nemico.morto', 'ferruccio.danno']) {
            g.eventi.on(n, (p) => eventi.push({ nome: n, ...p }));
          }
          const b = g.bersagli.find((x) => x.id === id);
          const r = { archetipo: b.archetipo, stanza: g.stanza.tipo, statoNascita: b.stato, tiratore: b.tiratore, esplosivo: b.esplosivo, aperta: b.aperta };
          // Ferruccio a sinistra del nemico, dentro la banda d'attacco (in linea, senza ostacoli nella stanza d'ingresso)
          const d = Math.max(dMin + 10, Math.min(dMax - 10, 160));
          g.ferruccio.posiziona(b.x - d, b.y);
          b.forzaStato('insegue');
          let n = 0;
          for (; n < 600 && b.stato !== 'anticipo'; n++) g.tick(1);
          r.ticksAnticipo = b.stato === 'anticipo' ? n : -1;
          r.gettone = b.gettone;
          r.apertaInAnticipo = b.aperta;
          for (n = 0; n < 600 && b.stato !== 'lampo'; n++) g.tick(1);
          r.lampo = b.stato === 'lampo';
          g.tick(2); // dentro il lampo: occhi rossi sul corpo
          r.statoFoto = b.stato;
          r.segnoATerraNelRenderer = typeof b.segnoATerra === 'function' ? b.segnoATerra() : null; // dato per il solo debug: il renderer pixel-art non lo disegna
          window.__eventiNemico = eventi;
          return r;
        }, { id: ID_PROVA, dMax: scheda.attacco.d_max.base, dMin: scheda.attacco.d_min.base });
        assert.equal(esito.archetipo, archetipo);
        assert.equal(esito.stanza, 'ingresso');
        assert.equal(esito.statoNascita === 'emersione' || esito.statoNascita === 'pattuglia' || esito.statoNascita === 'insegue', true, esito.statoNascita);
        assert.ok(esito.ticksAnticipo >= 0, `non entra in anticipo (${JSON.stringify(esito)})`);
        assert.equal(esito.gettone, !scheda.attacco.senza_gettone || !scheda.attacco.senza_gettone.base, 'gettone solo per chi lo chiede');
        assert.equal(esito.lampo, true, 'lampo');
        assert.equal(esito.statoFoto, 'lampo');
        if (scheda.corazza) assert.equal(esito.apertaInAnticipo, true, 'la maschera si apre nell\'anticipo');
        await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, `nemici-${archetipo}.png`) });
        const colpo = await pagina.evaluate(({ id }) => {
          const g = window.__gioco;
          const b = g.bersagli.find((x) => x.id === id);
          let n = 0;
          for (; n < 600 && b.stato === 'lampo'; n++) g.tick(1);
          g.tick(2);
          const eventi = window.__eventiNemico;
          const r = {
            stato: b.stato, esito: b.esitoColpo,
            proiettili: g.proiettili.filter((p) => p.nemico).length,
            spari: eventi.filter((e) => e.nome === 'nemico.sparo').length,
            esplosioni: eventi.filter((e) => e.nome === 'nemico.esplosione').length,
            anticipo: eventi.filter((e) => e.nome === 'telegrafo.anticipo').length,
            lampo: eventi.filter((e) => e.nome === 'telegrafo.lampo').length,
          };
          // il nemico muore (la bomba è già morta esplodendo)
          if (b.stato !== 'morto') {
            for (let k = 0; k < 80 && b.stato !== 'morto'; k++) b.colpisci(99, null);
            g.tick(1);
          }
          r.morto = b.stato === 'morto';
          r.eventoMorte = eventi.some((e) => e.nome === 'nemico.morto' && e.id === id);
          // i proiettili volano e si spengono (muri o Ferruccio) entro pochi secondi
          for (let k = 0; k < 400 && g.proiettili.some((p) => p.nemico && p.vivo); k++) g.tick(1);
          r.proiettiliVivi = g.proiettili.filter((p) => p.nemico && p.vivo).length;
          r.danniFerruccio = eventi.filter((e) => e.nome === 'ferruccio.danno').length;
          return r;
        }, { id: ID_PROVA });
        assert.equal(colpo.anticipo >= 1 && colpo.lampo >= 1, true, JSON.stringify(colpo));
        if (scheda.sparo) {
          assert.equal(colpo.esito, 'sparo', JSON.stringify(colpo));
          assert.equal(colpo.proiettili, scheda.sparo.n_colpi.base, `proiettili ${JSON.stringify(colpo)}`);
          assert.equal(colpo.spari, 1);
        } else if (scheda.esplosione) {
          assert.equal(colpo.esplosioni, 1, JSON.stringify(colpo));
          assert.equal(colpo.proiettili, scheda.esplosione.n_schegge.base, 'schegge');
          assert.equal(colpo.stato, 'morto', 'la bomba muore esplodendo');
        } else {
          assert.ok(['colpo', 'recupero', 'insegue', 'stordito'].includes(colpo.stato), colpo.stato);
          assert.equal(colpo.proiettili, 0);
        }
        assert.equal(colpo.morto, true);
        assert.equal(colpo.eventoMorte, true);
        assert.equal(colpo.proiettiliVivi, 0, 'i proiettili si spengono');
        assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
        await contesto.close();
      });
    }
  } finally {
    if (browser) await browser.close();
    await server.chiudi();
  }
  const falliti = esiti.filter((e) => !e.ok).length;
  console.log(`\n${esiti.length - falliti}/${esiti.length} casi superati`);
  process.exitCode = falliti ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
