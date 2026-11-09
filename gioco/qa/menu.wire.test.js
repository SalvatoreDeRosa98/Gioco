/**
 * gioco/qa/menu.wire.test.js — Test di pagina della storia P04/P05 (porting del Teatro): menu di selezione del
 * personaggio e dello slot, ingresso nell'hub, Esc dall'hub, sparo con le frecce.
 *
 * Esecuzione: `node gioco/qa/menu.wire.test.js` dalla radice (Playwright preinstallato; mai `playwright install`).
 * Avvia `python3 -m http.server` su una porta libera con radice `gioco/` (schema di pagina.test.js) e apre:
 *  1. `index.html` senza parametri (meta `gioco-avvio` = `debug=1`): il ciclo è in `menu`, nel DOM c'è `.menu-teatro`
 *     con le carte di `personaggi.json` nell'ordine del JSON e i cinque slot; screenshot `menu-selezione.png`;
 *     con la tastiera `Digit2` sceglie il secondo personaggio (Agnese), `ArrowDown` passa allo slot 2; screenshot
 *     `menu-slot.png`; `Enter` inizia: lo slot è diverso dal predefinito, quindi la pagina ricarica con
 *     `?slot=2&personaggio=agnese` e parte direttamente nell'hub di Piazza Dante con le statistiche di Agnese
 *     (HUD maschere `2/2` = due cuori da `hpHalf` 4); `Esc` (azione `menu`) nell'hub riporta al menu.
 *  2. `?debug=1&wire=1&piano=1&seme=1845&personaggio=ferruccio`: tenendo la freccia destra (`spara_destra`) senza
 *     spada partono proiettili verso destra (vx > 0, vy = 0) e Ferruccio non si muove.
 * Zero errori in console. Nessun valore di gioco fissato nel test: i valori attesi vengono dai JSON serviti.
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
  selezione: path.join(CARTELLA_EVIDENZE, 'menu-selezione.png'),
  slot: path.join(CARTELLA_EVIDENZE, 'menu-slot.png'),
};
const SEME = 1845;
const SLOT_SCELTO = '2';
const INDICE_PERSONAGGIO = 2; // tasto Digit2 → secondo personaggio dell'ordine del JSON

const personaggiJson = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'parametri', 'personaggi.json'), 'utf8'));
const inputJson = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'parametri', 'input.json'), 'utf8'));
const ORDINE = personaggiJson.ordine;
const ID_SCELTO = ORDINE[INDICE_PERSONAGGIO - 1];
const HP_HALF_SCELTO = personaggiJson.personaggi[ID_SCELTO].hpHalf;
const MASCHERE_ATTESE = Math.ceil(HP_HALF_SCELTO / 2);

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

const casi = [];
function caso(nome, fn) { casi.push({ nome, fn }); }

async function attendiGioco(pagina) {
  await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato());
  await pagina.waitForFunction(() => window.__gioco.tick() > 2);
}

caso('menu → Agnese con la tastiera, slot 2, inizio → hub con due cuori, Esc → menu', async (pagina, base) => {
  const errori = [];
  pagina.on('pageerror', (e) => errori.push(String(e)));
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });

  await pagina.goto(`${base}/index.html`);
  await attendiGioco(pagina);
  const inizio = await pagina.evaluate(() => ({
    stato: window.__gioco.stato,
    menu: window.__gioco.menu(),
    visibile: !document.querySelector('.menu-teatro').hidden,
    carte: [...document.querySelectorAll('.menu-carta')].map((c) => c.dataset.personaggio),
    slots: document.querySelectorAll('.menu-slot-voce').length,
  }));
  assert.equal(inizio.stato, 'menu', 'il ciclo parte in menu');
  assert.ok(inizio.menu, 'il menu è aperto');
  assert.ok(inizio.visibile, '.menu-teatro visibile');
  assert.deepEqual(inizio.carte, ORDINE, 'una carta per personaggio, nell\'ordine del JSON');
  assert.equal(inizio.menu.slots.length, inizio.slots, 'i cinque slot del salvataggio sono nel DOM');
  assert.equal(inizio.menu.personaggio, personaggiJson.predefinito, 'il predefinito è evidenziato');
  await pagina.screenshot({ path: EVIDENZE.selezione });

  await pagina.keyboard.press(`Digit${INDICE_PERSONAGGIO}`);
  await pagina.keyboard.press('ArrowDown');
  const dopoTasti = await pagina.evaluate(() => window.__gioco.menu());
  assert.equal(dopoTasti.personaggio, ID_SCELTO, 'Digit2 sceglie il secondo personaggio');
  assert.equal(dopoTasti.slot, SLOT_SCELTO, 'ArrowDown passa allo slot 2');
  const sceltaDom = await pagina.evaluate(() => ({
    carta: document.querySelector('.menu-carta.scelta')?.dataset.personaggio,
    slot: document.querySelector('.menu-slot-voce.scelto')?.dataset.slot,
  }));
  assert.equal(sceltaDom.carta, ID_SCELTO, 'la carta scelta è evidenziata nel DOM');
  assert.equal(sceltaDom.slot, SLOT_SCELTO, 'lo slot scelto è evidenziato nel DOM');
  await pagina.screenshot({ path: EVIDENZE.slot });

  // Invio: slot diverso dal predefinito → la pagina ricarica con ?slot=&personaggio= e parte nell'hub
  await Promise.all([
    pagina.waitForURL((u) => u.searchParams.get('slot') === SLOT_SCELTO && u.searchParams.get('personaggio') === ID_SCELTO),
    pagina.keyboard.press('Enter'),
  ]);
  await attendiGioco(pagina);
  await pagina.waitForFunction(() => window.__gioco.stato === 'hub');
  const hub = await pagina.evaluate(() => ({
    stato: window.__gioco.stato,
    menu: window.__gioco.menu(),
    slot: window.__gioco.slot,
    personaggio: window.__gioco.statistiche.id,
    attive: window.__gioco.statistiche.attive,
    maschere: window.__gioco.ferruccio.maschere,
    maschereMax: window.__gioco.modificatori.valore('ferruccio.maschere_max'),
    hud: document.querySelector('.hud-maschere .valore')?.textContent,
    hubAttivo: window.__gioco.hub?.attivo ?? null,
  }));
  assert.equal(hub.stato, 'hub', 'dopo Invio si è nell\'hub di Piazza Dante');
  assert.equal(hub.menu, null, 'il menu è chiuso');
  assert.equal(hub.slot, SLOT_SCELTO, 'lo slot in uso è il 2');
  assert.equal(hub.personaggio, ID_SCELTO, 'il personaggio scelto è applicato');
  assert.ok(hub.attive, 'le statistiche del personaggio sono attive');
  assert.equal(hub.maschereMax, MASCHERE_ATTESE, `maschere massime = ceil(hpHalf/2) = ${MASCHERE_ATTESE}`);
  assert.equal(hub.maschere, MASCHERE_ATTESE, 'si parte a maschere piene');
  assert.equal(hub.hud, `${MASCHERE_ATTESE}/${MASCHERE_ATTESE}`, 'l\'HUD mostra due cuori (2/2)');
  assert.equal(hub.hubAttivo, true, 'l\'hub è attivo');

  // alla notte 1 nell'hub parte da sola la targa: Esc è ignorato a dialogo aperto (regola della storia P04), quindi
  // si chiudono prima le scene automatiche con `avanza` (antirimbalzo da incontri.json), poi Esc (azione `menu`) → menu
  await pagina.evaluate(() => {
    const g = window.__gioco;
    const attesa = Math.ceil(g.parametri.get('incontri.antirimbalzo') / (1000 / 60));
    for (let i = 0; i < 40 && g.dialogo(); i++) { g.tick(attesa); g.premi('avanza', 1); g.tick(2); }
  });
  assert.equal(await pagina.evaluate(() => window.__gioco.dialogo()), null, 'le scene automatiche sono chiuse');
  await pagina.evaluate(() => window.__gioco.premi('menu', 2));
  const dopoEsc = await pagina.evaluate(() => ({ stato: window.__gioco.stato, menu: window.__gioco.menu(), visibile: !document.querySelector('.menu-teatro').hidden }));
  assert.equal(dopoEsc.stato, 'menu', 'Esc dall\'hub riporta il ciclo in menu');
  assert.ok(dopoEsc.menu && dopoEsc.visibile, 'il menu è di nuovo aperto e visibile');
  assert.equal(dopoEsc.menu.personaggio, ID_SCELTO, 'il menu ricorda il personaggio corrente');
  assert.equal(dopoEsc.menu.slot, SLOT_SCELTO, 'il menu ricorda lo slot corrente');

  assert.deepEqual(errori, [], 'zero errori in console');
});

caso('frecce: con spara_destra tenuta partono proiettili verso destra senza muoversi', async (pagina, base) => {
  const errori = [];
  pagina.on('pageerror', (e) => errori.push(String(e)));
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });

  await pagina.goto(`${base}/index.html?debug=1&wire=1&piano=1&seme=${SEME}&personaggio=${ORDINE[0]}`);
  await attendiGioco(pagina);
  assert.equal(inputJson.tastiera.spara_destra[0], 'ArrowRight', 'la freccia destra è spara_destra in input.json');
  const esito = await pagina.evaluate(() => {
    const g = window.__gioco;
    const prima = { x: g.ferruccio.x, y: g.ferruccio.y, n: g.combattimento.proiettiliFerruccio().length };
    const st = g.statistiche.correnti();
    g.tieni('spara_destra');
    g.tick(st.cooldownTicks * 2 + 2);
    const proiettili = g.combattimento.proiettiliFerruccio().map((p) => ({ vx: p.vx, vy: p.vy, tipo: p.tipo }));
    g.lascia('spara_destra');
    return { prima, dopo: { x: g.ferruccio.x, y: g.ferruccio.y }, proiettili, cooldown: st.cooldownTicks, spada: st.flags.spada, mira: g.ferruccio.direzioneMira };
  });
  assert.equal(esito.prima.n, 0, 'nessun proiettile prima della freccia');
  assert.ok(!esito.spada, 'Ferruccio parte senza spada: la freccia spara');
  assert.ok(esito.proiettili.length >= 2, `almeno due proiettili in ${esito.cooldown * 2 + 2} tick (cadenza ${esito.cooldown})`);
  for (const p of esito.proiettili) {
    assert.ok(p.vx > 0, 'il proiettile va verso destra');
    assert.ok(Math.abs(p.vy) < 1e-9, 'il proiettile non devia in verticale');
  }
  assert.equal(esito.dopo.x, esito.prima.x, 'Ferruccio non si è mosso in x');
  assert.equal(esito.dopo.y, esito.prima.y, 'Ferruccio non si è mosso in y');
  assert.deepEqual(errori, [], 'zero errori in console');
});

(async () => {
  fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
  const server = await avviaServer();
  const browser = await chromium.launch();
  let falliti = 0;
  try {
    for (const c of casi) {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      const pagina = await contesto.newPage();
      try {
        await c.fn(pagina, server.base);
        console.log(`ok - ${c.nome}`);
      } catch (e) {
        falliti++;
        console.log(`not ok - ${c.nome}\n  ${e.stack ?? e}`);
      } finally {
        await contesto.close();
      }
    }
  } finally {
    await browser.close();
    await server.chiudi();
  }
  console.log(`# ${casi.length - falliti}/${casi.length} casi verdi`);
  process.exit(falliti ? 1 : 0);
})();
