/**
 * gioco/qa/hud.wire.test.js — Test di pagina della storia P13: l'HUD completo del Teatro in DOM (`interfaccia/hud.js`).
 *
 * Esecuzione: `node gioco/qa/hud.wire.test.js` dalla radice (Playwright preinstallato; mai `playwright install`). Avvia
 * `python3 -m http.server` su una porta libera con radice `gioco/` e, a deviceScaleFactor 1 su 1280×720:
 *  1. `/?debug=1&piano=1&seme=1845&personaggio=agnese&slot=1`: la scheda in alto a sinistra (nome e titolo di Agnese da
 *     personaggi.json, «Piano 1», il tipo della stanza, le maschere piene = ceil(hpHalf/2) come PNG caricati, le quattro
 *     statistiche con le icone e i valori di `statistiche.correnti()`, monete), il dock in basso al centro (attivo iniziale
 *     con le tacche piene e la scritta del tasto, cinque slot vuoti visibili), niente barra del boss, nessun HUD vecchio
 *     (`.hud`, `.hud-doni`, `.attivo-hud`) → `production/qa/evidence/hud.png`;
 *  2. un dono raccolto con `__gioco.slotDoni.acquisisci` → l'icona PNG `oggetto-<id_teatro>` nel primo slot (`hud-slot-pieno.png`);
 *  3. stanza del boss (`vaiA`) → la barra della vita del boss in alto al centro con il nome, una sola (`hud-boss.png`);
 *  4. un dialogo aperto (`incontri.mostra`) nasconde l'HUD; chiuso, ricompare;
 *  5. a 400 px di larghezza nessuno scroll orizzontale e l'HUD resta nel palco (`hud-400.png`);
 *  6. il prototipo dell'autore `teatro_marionette.html` in gioco (Spazio, qualche passo) → `teatro-hud-riferimento.png`,
 *     il riferimento per confrontare l'impaginazione;
 *  7. `index.html` senza parametri parte nel menu: l'HUD è nascosto.
 * Zero errori in console in ogni caso.
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
const leggi = (p) => JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, p), 'utf8'));
const PERSONAGGI = leggi('contenuti/parametri/personaggi.json');
const TESTI = leggi('contenuti/interfaccia.json');
const DONI = leggi('contenuti/parametri/doni.json');
const ATTIVI = leggi('contenuti/parametri/oggetti-attivi.json');
const SEME = 1845;
const ID_PERSONAGGIO = 'agnese';
const PERSONAGGIO = PERSONAGGI.personaggi[ID_PERSONAGGIO];
const MASCHERE_ATTESE = Math.ceil(PERSONAGGIO.hpHalf / 2);
const ATTIVO_INIZIALE = ATTIVI.attivi[PERSONAGGIO.attivoIniziale];
const MAX_SLOT = DONI.limiti.max_slot_doni.base;
const DONO_CON_PNG = DONI.doni.find((d) => d.teatro?.id_teatro && d.sagoma?.tipo !== 'profilo');
const VISTA = { width: 1280, height: 720 };
const VISTA_STRETTA = { width: 400, height: 800 };

function portaLibera() {
  return new Promise((risolvi, rifiuta) => {
    const s = net.createServer();
    s.once('error', rifiuta);
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => risolvi(port)); });
  });
}
async function attendiServer(url) {
  for (let i = 0; i < 100; i++) {
    const ok = await new Promise((r) => { const req = http.get(url, (res) => { res.resume(); r(res.statusCode < 500); }); req.on('error', () => r(false)); });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`il server statico non risponde su ${url}`);
}
async function avviaServer() {
  const porta = await portaLibera();
  const proc = spawn('python3', ['-m', 'http.server', String(porta), '--bind', '127.0.0.1', '--directory', RADICE_GIOCO], { stdio: ['ignore', 'ignore', 'ignore'] });
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
  try { await fn(); esiti.push({ nome, ok: true }); console.log(`ok - ${nome}`); } catch (e) { esiti.push({ nome, ok: false, errore: e }); console.log(`not ok - ${nome}\n  ${e.stack ?? e}`); }
}

/** Apre una pagina con la raccolta degli errori di console. */
async function apri(browser, url, viewport = VISTA) {
  const contesto = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const pagina = await contesto.newPage();
  const errori = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  pagina.on('pageerror', (e) => errori.push(String(e)));
  await pagina.goto(url, { waitUntil: 'load' });
  return { contesto, pagina, errori };
}
const attendiGioco = (pagina) => pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.tick() > 5);
/** Fotografia dell'HUD più le misure del DOM (in frazione del palco). */
const fotografa = (pagina) => pagina.evaluate(() => {
  const g = window.__gioco;
  const palco = document.getElementById('palco').getBoundingClientRect();
  const misura = (sel) => { const e = document.querySelector(sel); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return { x: (r.left - palco.left) / palco.width, y: (r.top - palco.top) / palco.height, w: r.width / palco.width, h: r.height / palco.height, cx: (r.left + r.width / 2 - palco.left) / palco.width }; };
  const immaginiCaricate = (sel) => Array.from(document.querySelectorAll(sel)).filter((i) => !i.hidden).map((i) => i.complete && i.naturalWidth > 0);
  return {
    hud: g.hud(), nascosto: document.querySelector('#interfaccia .hud-teatro').hidden,
    scheda: misura('#interfaccia .hud-scheda'), dock: misura('#interfaccia .hud-dock'), boss: misura('#interfaccia .hud-boss'),
    maschereDom: document.querySelectorAll('#interfaccia .hud-maschera:not([hidden])').length,
    maschereCaricate: immaginiCaricate('#interfaccia .hud-maschera'), iconeCaricate: immaginiCaricate('#interfaccia .hud-icona'),
    slotDom: document.querySelectorAll('#interfaccia .hud-slot:not([hidden])').length, slotPieniDom: document.querySelectorAll('#interfaccia .hud-slot.pieno').length,
    iconeSlotCaricate: immaginiCaricate('#interfaccia .hud-slot-icona'), attivoCaricata: immaginiCaricate('#interfaccia .hud-attivo-icona'),
    tacche: document.querySelectorAll('#interfaccia .hud-attivo .tacca:not([hidden])').length, taccePiene: document.querySelectorAll('#interfaccia .hud-attivo .tacca.piena:not([hidden])').length,
    testoNome: document.querySelector('#interfaccia .hud-nome').textContent, testoTitolo: document.querySelector('#interfaccia .hud-titolo').textContent,
    testoPiano: document.querySelector('#interfaccia .hud-piano').textContent, testoStanza: document.querySelector('#interfaccia .hud-stanza').textContent,
    vecchi: ['.hud', '.hud-doni', '.attivo-hud', '.hud-monete .valore'].map((s) => document.querySelector(`#interfaccia ${s}`) !== null),
    barreBoss: document.querySelectorAll('#interfaccia .hud-boss').length,
    scrollX: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth,
    stanza: g.stanza?.tipo ?? null, correnti: g.statistiche.correnti(), monete: g.economia.monete, maschere: g.ferruccio.maschere,
  };
});

(async () => {
  const server = await avviaServer();
  const browser = await chromium.launch();
  fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
  const url = `${server.base}/?debug=1&piano=1&seme=${SEME}&personaggio=${ID_PERSONAGGIO}&slot=1`;
  try {
    await caso('1. piano 1 con Agnese: scheda (nome, titolo, piano, stanza, maschere PNG, statistiche con icone, monete), dock (attivo con tacche, 5 slot vuoti), niente barra del boss né HUD vecchio; hud.png', async () => {
      const { contesto, pagina, errori } = await apri(browser, url);
      await attendiGioco(pagina);
      // il pannello delle istruzioni (meta `gioco-avvio`) è centrato con sfondo pieno e sparisce al primo tasto: lo chiudiamo prima dell'evidenza
      assert.equal(await pagina.evaluate(() => window.__gioco.pannelloProva()), true, 'pannello di prova a schermo all\'avvio');
      await pagina.keyboard.press('ShiftLeft');
      await pagina.waitForFunction(() => window.__gioco.pannelloProva() === false);
      await pagina.waitForFunction(() => !document.querySelector('#interfaccia .hud-teatro').hidden && window.__gioco.hud().attivo);
      await pagina.waitForFunction(() => Array.from(document.querySelectorAll('#interfaccia .hud-teatro img')).filter((i) => !i.hidden).every((i) => i.complete));
      const f = await fotografa(pagina);
      assert.equal(f.nascosto, false);
      assert.equal(f.hud.nome, PERSONAGGIO.nome);
      assert.equal(f.testoNome, PERSONAGGIO.nome);
      assert.equal(f.testoTitolo, PERSONAGGIO.titolo);
      assert.equal(f.testoPiano, TESTI.hud.piano.replace('{piano}', '1'));
      assert.equal(f.stanza, 'ingresso');
      assert.equal(f.testoStanza, TESTI.hud.stanze.ingresso);
      // maschere: massime = ceil(hpHalf/2), tutte piene, PNG caricati
      assert.deepEqual({ max: f.hud.maschere.max, piene: f.hud.maschere.piene }, { max: MASCHERE_ATTESE, piene: MASCHERE_ATTESE });
      assert.equal(f.maschereDom, MASCHERE_ATTESE);
      assert.ok(f.maschereCaricate.length === MASCHERE_ATTESE && f.maschereCaricate.every(Boolean), `PNG delle maschere caricati: ${JSON.stringify(f.maschereCaricate)}`);
      // statistiche: i valori reali con le cifre di resa.json, icone PNG caricate (dmg, tears, spd, range, moneta, scintilla)
      assert.equal(f.hud.statistiche.dmg, f.correnti.dmg.toFixed(leggi('contenuti/parametri/resa.json').hud.decimali_dmg.base));
      assert.equal(f.hud.statistiche.tears, f.correnti.tearsPerSec.toFixed(leggi('contenuti/parametri/resa.json').hud.decimali_tears.base));
      assert.equal(f.hud.statistiche.spd, f.correnti.speed.toFixed(leggi('contenuti/parametri/resa.json').hud.decimali_spd.base));
      assert.ok(f.iconeCaricate.length >= 6 && f.iconeCaricate.every(Boolean), `icone caricate: ${JSON.stringify(f.iconeCaricate)}`);
      assert.equal(f.hud.monete, f.monete);
      // dock: attivo iniziale del personaggio carico, tacche = maxCarica, icona PNG; cinque slot vuoti visibili
      assert.equal(f.hud.attivo.id, PERSONAGGIO.attivoIniziale);
      assert.equal(f.tacche, ATTIVO_INIZIALE.maxCarica);
      assert.equal(f.taccePiene, ATTIVO_INIZIALE.maxCarica);
      assert.ok(f.attivoCaricata.length === 1 && f.attivoCaricata[0], 'PNG dell\'attivo caricato');
      assert.equal(f.slotDom, MAX_SLOT);
      assert.equal(f.slotPieniDom, 0);
      assert.equal(f.hud.slot.length, MAX_SLOT);
      // impaginazione del Teatro: scheda in alto a sinistra, dock in basso al centro, nessuna barra del boss
      assert.ok(f.scheda && f.scheda.x < 0.03 && f.scheda.y < 0.03 && f.scheda.w > 0.2, `scheda: ${JSON.stringify(f.scheda)}`);
      assert.ok(f.dock && Math.abs(f.dock.cx - 0.5) < 0.05 && f.dock.y + f.dock.h > 0.9, `dock: ${JSON.stringify(f.dock)}`);
      assert.equal(f.boss, null);
      assert.deepEqual(f.vecchi, [false, false, false, false], 'nessun doppione dell\'HUD vecchio');
      assert.equal(f.scrollX, false);
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'hud.png') });
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      await caso('2. un dono raccolto con __gioco → icona PNG oggetto-<id_teatro> nel primo slot; hud-slot-pieno.png', async () => {
        const dopo = await pagina.evaluate((id) => {
          const g = window.__gioco;
          const esito = g.slotDoni.acquisisci(id, { origine: 'qa' });
          g.tick(2);
          return { esito, doni: g.modificatori.doniAttivi() };
        }, DONO_CON_PNG.id);
        assert.deepEqual(dopo.doni, [DONO_CON_PNG.id], JSON.stringify(dopo));
        await pagina.waitForFunction(() => document.querySelectorAll('#interfaccia .hud-slot.pieno').length === 1);
        await pagina.waitForFunction(() => Array.from(document.querySelectorAll('#interfaccia .hud-slot-icona')).filter((i) => !i.hidden).every((i) => i.complete && i.naturalWidth > 0));
        const f = await fotografa(pagina);
        assert.equal(f.slotPieniDom, 1);
        assert.equal(f.hud.slot[0].id, DONO_CON_PNG.id);
        assert.equal(f.hud.slot[0].nome, DONO_CON_PNG.nome);
        assert.ok(f.hud.slot[0].icona && f.hud.slot[0].icona.includes(`oggetto-${DONO_CON_PNG.teatro.id_teatro}`), f.hud.slot[0].icona);
        assert.deepEqual(f.iconeSlotCaricate, [true]);
        assert.ok(f.hud.slot.slice(1).every((s) => s === null));
        await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'hud-slot-pieno.png') });
        assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      });

      await caso('3. stanza del boss → barra della vita in alto al centro con il nome del boss, una sola; hud-boss.png', async () => {
        const boss = await pagina.evaluate(() => {
          const g = window.__gioco;
          const st = g.piano.stanze.find((s) => s.tipo === 'boss');
          const ok = g.vaiA(st.id);
          g.tick(Math.round(g.parametri.get('stanze.camera.t_transizione') / (1000 / 60)) + 2);
          let t = 0;
          while (t < 600 && !g.bersagli.some((b) => b.boss)) { g.tick(1); t++; }
          g.tick(10);
          const b = g.bersagli.find((x) => x.boss);
          return { ok, tipo: g.stanza.tipo, nome: b?.nomeBoss ?? null, vita: b?.vita ?? null, vitaMax: b?.vitaMax ?? null, t };
        });
        assert.equal(boss.ok, true);
        assert.equal(boss.tipo, 'boss');
        assert.ok(boss.nome, 'il boss del piano è nato');
        await pagina.waitForFunction(() => !document.querySelector('#interfaccia .hud-boss').hidden && window.__gioco.hud().boss);
        const f = await fotografa(pagina);
        assert.equal(f.barreBoss, 1, 'una sola barra');
        assert.equal(f.hud.boss.nome, boss.nome);
        assert.ok(f.hud.boss.titolo.includes(boss.nome.toUpperCase()), f.hud.boss.titolo);
        assert.ok(f.hud.boss.quota > 0 && f.hud.boss.quota <= 1);
        assert.equal(f.hud.boss.max, Math.round(boss.vitaMax));
        assert.ok(f.boss && Math.abs(f.boss.cx - 0.5) < 0.02 && f.boss.y < 0.05, `barra in alto al centro: ${JSON.stringify(f.boss)}`);
        assert.equal(f.testoStanza, TESTI.hud.stanze.boss);
        await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'hud-boss.png') });
        assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      });

      await caso('4. un dialogo aperto nasconde l\'HUD; chiuso, ricompare', async () => {
        const scena = Object.keys(leggi('contenuti/ancoraggi.json').scene ?? {}).find((id) => id.startsWith('piazza-dante.tonino')) ?? 'piazza-dante.tonino-primo-incontro';
        await pagina.evaluate((id) => { window.__gioco.incontri.mostra(id); }, scena);
        await pagina.waitForFunction(() => window.__gioco.dialogo() !== null);
        await pagina.waitForFunction(() => document.querySelector('#interfaccia .hud-teatro').hidden === true);
        assert.equal((await fotografa(pagina)).hud.visibile, false);
        await pagina.evaluate(() => { window.__gioco.incontri.abbandona(); });
        await pagina.waitForFunction(() => window.__gioco.dialogo() === null);
        await pagina.waitForFunction(() => document.querySelector('#interfaccia .hud-teatro').hidden === false);
        assert.equal((await fotografa(pagina)).hud.visibile, true);
        assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      });
      await contesto.close();
    });

    await caso('5. a 400 px di larghezza nessuno scroll orizzontale, HUD dentro il palco; hud-400.png', async () => {
      const { contesto, pagina, errori } = await apri(browser, url, VISTA_STRETTA);
      await attendiGioco(pagina);
      await pagina.keyboard.press('ShiftLeft'); // chiude il pannello di prova
      await pagina.waitForFunction(() => !document.querySelector('#interfaccia .hud-teatro').hidden);
      const f = await fotografa(pagina);
      assert.equal(f.scrollX, false, 'nessuno scroll orizzontale');
      assert.ok(f.scheda && f.scheda.x >= 0 && f.scheda.x + f.scheda.w <= 1.001, `scheda nel palco: ${JSON.stringify(f.scheda)}`);
      assert.ok(f.dock && f.dock.x >= 0 && f.dock.x + f.dock.w <= 1.001, `dock nel palco: ${JSON.stringify(f.dock)}`);
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'hud-400.png') });
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });

    await caso('6. il Teatro dell\'autore in gioco (Spazio, qualche passo): teatro-hud-riferimento.png, il riferimento dell\'impaginazione', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/teatro_marionette.html`);
      await pagina.waitForTimeout(500);
      await pagina.keyboard.press('Space'); // scelta del personaggio
      await pagina.waitForTimeout(400);
      await pagina.keyboard.press('Space'); // alza il sipario dell'atto I
      await pagina.waitForTimeout(400);
      await pagina.keyboard.down('KeyD');
      await pagina.waitForTimeout(350);
      await pagina.keyboard.up('KeyD');
      await pagina.waitForTimeout(200);
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'teatro-hud-riferimento.png') });
      assert.ok(fs.statSync(path.join(CARTELLA_EVIDENZE, 'teatro-hud-riferimento.png')).size > 0);
      assert.deepEqual(errori, [], `errori in console del Teatro:\n${errori.join('\n')}`);
      await contesto.close();
    });

    await caso('7. index.html senza parametri: nel menu l\'HUD è nascosto', async () => {
      const { contesto, pagina, errori } = await apri(browser, `${server.base}/`);
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.menu() !== null);
      const f = await pagina.evaluate(() => ({ stato: window.__gioco.stato, nascosto: document.querySelector('#interfaccia .hud-teatro').hidden, visibile: window.__gioco.hud().visibile }));
      assert.equal(f.stato, 'menu');
      assert.equal(f.nascosto, true);
      assert.equal(f.visibile, false);
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });
  } finally {
    await browser.close();
    await server.chiudi();
  }
  const falliti = esiti.filter((e) => !e.ok);
  console.log(`\n# hud.wire: ${esiti.length - falliti.length}/${esiti.length} casi verdi`);
  process.exit(falliti.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
