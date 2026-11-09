/**
 * gioco/qa/notte.wire.test.js — Test di pagina della storia 030: salvataggio della notte con ricarica della
 * pagina, «Continua», morte → risveglio nell'hub con notte + 1.
 *
 * Esecuzione: `node gioco/qa/notte.wire.test.js` dalla radice (Playwright preinstallato; non eseguire mai
 * `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice `gioco/`, apre
 * `?debug=1&wire=1&hub=1&seme=1845`, chiude la targa, parte dall'ingresso (notte 1, seme derivato), entra in una
 * stanza, cambia maschere, doni e monete, passa in un'altra stanza (la notte si salva) e apre una scena lasciandola a
 * metà. Poi RICARICA la pagina (stesso contesto: stesso localStorage): la scena a metà non è in `scene_viste`, nell'hub
 * c'è il pannello «Continua» (screenshot `production/qa/evidence/notte-ripresa.png`); il click su «Continua» rigenera
 * lo stesso piano dal seme e ripristina stanza, maschere, doni e monete. Infine la morte: ciclo in `pausa`, velo DOM
 * con le fasi (screenshot `notte-morte.png`), dopo ≤ 5 s di tick si è nell'hub con `notte` 2, flag, scintille e
 * `piano_max` conservati, monete e doni spariti, notte salvata cancellata (screenshot `notte-risveglio.png`).
 * Zero errori in console.
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
  ripresa: path.join(CARTELLA_EVIDENZE, 'notte-ripresa.png'),
  morte: path.join(CARTELLA_EVIDENZE, 'notte-morte.png'),
  risveglio: path.join(CARTELLA_EVIDENZE, 'notte-risveglio.png'),
};
const SEME = 1845;
/** piano=0 annulla il piano=1 della meta gioco-avvio di index.html: l'hub vale solo senza piano. */
const URL_HUB = `/?debug=1&wire=1&hub=1&piano=0&seme=${SEME}`;
/** Limite del criterio: la sequenza di morte dura al più 5 s. */
const T_MAX_MS = 5000;
const SCENA_TONINO = 'piazza-dante.tonino-primo-incontro';
const DONO = 'mantice';
const MASCHERE = 2;
const MONETE = 17;
const SCINTILLE = 3;

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

/** Aspetta la pagina pronta nell'hub e ferma il ciclo (poi solo tick forzati). */
async function pronta(pagina) {
  await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.hub && window.__gioco.hub.attivo);
  await pagina.evaluate(() => window.__gioco.ciclo.ferma());
}

async function main() {
  const server = await avviaServer();
  let browser;
  try {
    browser = await chromium.launch();

    await caso('notte salvata al cambio di stanza, ricarica → scena a metà non vista, «Continua» ripristina; morte → velo, hub con notte 2; tre screenshot', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}${URL_HUB}`, { waitUntil: 'load' });
      await pronta(pagina);
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      // notte 1: chiude la targa automatica, poi parte dall'ingresso
      const partenza = await pagina.evaluate(({ dono, maschere, monete, scintille, scena }) => {
        const g = window.__gioco;
        g.tick(2);
        g.tick(Math.ceil(g.parametri.get('incontri.antirimbalzo') / (1000 / 60)));
        g.premi('avanza', 1);
        g.tick(2);
        const senzaNotteSalvata = g.notteSalvata.presente;
        const pannelloPrima = g.ripresa.stato();
        const i = g.hub.ingresso;
        g.ferruccio.posiziona(i.x - g.hub.cella, i.y + i.h / 2);
        g.tieni('destra');
        let n = 0;
        while (g.stato === 'hub' && n < 240) { g.tick(1); n++; }
        g.lascia('destra');
        g.tick(2);
        const salvataIngresso = g.notteSalvata.carica();
        // va in una stanza, cambia il suo stato, poi passa in un'altra: la notte si salva al cambio
        const stanze = g.piano.stanze.map((s) => s.id);
        const ingresso = g.stanza.id;
        const altre = stanze.filter((s) => s !== ingresso);
        const a = altre[0];
        const b = altre[1];
        g.vaiA(a);
        g.tick(1);
        g.ferruccio.impostaMaschere(maschere);
        g.modificatori.aggiungiDono(dono);
        g.economia.aggiungiMonete(monete, 'test');
        g.economia.aggiungiScintille(scintille, 'test');
        g.imposta('taddeo', 'perdonato');
        g.narrativa.raggiungiPiano(1);
        const primaDelCambio = g.notteSalvata.carica();
        g.vaiA(b);
        g.tick(1);
        const salvata = g.notteSalvata.carica();
        // scena lasciata a metà
        const d = g.incontri.mostra(scena);
        d.avanza();
        return {
          senzaNotteSalvata, pannelloPrima, stato: g.stato, semeNotte: g.notte.seme, salvataIngresso, primaDelCambio, salvata, a, b,
          pianta: g.piano.stanze.map((s) => `${s.id}:${s.modello}:${s.tipo}`), dialogo: g.dialogo()?.id ?? null, statoDialogo: g.stato,
          scintille: g.profilo.scintille, viste: g.narrativa.avanzamento().scene_viste,
        };
      }, { dono: DONO, maschere: MASCHERE, monete: MONETE, scintille: SCINTILLE, scena: SCENA_TONINO });
      assert.equal(partenza.senzaNotteSalvata, false, 'all\'inizio nessuna notte salvata');
      assert.equal(partenza.pannelloPrima, null, 'nessun pannello «Continua»');
      assert.notEqual(partenza.semeNotte, SEME);
      assert.ok(partenza.pianta.some((r) => r.startsWith(`${partenza.salvataIngresso.stanza}:`) && r.endsWith(':ingresso')), 'salvata all\'ingresso del piano');
      assert.equal(partenza.salvataIngresso.seme, partenza.semeNotte, 'salvata già all\'ingresso');
      assert.equal(partenza.primaDelCambio.stanza, partenza.a);
      assert.equal(partenza.primaDelCambio.maschere, partenza.salvataIngresso.maschere, 'dentro la stanza non si salva');
      assert.deepEqual(partenza.salvata, { seme: partenza.semeNotte, piano: 1, stanza: partenza.b, notte: 1, maschere: MASCHERE, doni: [DONO], monete: MONETE });
      assert.equal(partenza.dialogo, SCENA_TONINO);
      assert.equal(partenza.statoDialogo, 'pausa');
      assert.equal(partenza.viste.includes(SCENA_TONINO), false);
      assert.equal(partenza.scintille, SCINTILLE);

      // «chiusura e riapertura»: ricarica la pagina nello stesso contesto (stesso localStorage)
      await pagina.reload({ waitUntil: 'load' });
      await pronta(pagina);
      const riaperta = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.tick(2);
        return {
          stato: g.stato, viste: g.narrativa.avanzamento().scene_viste, notte: g.narrativa.avanzamento().notte, dialogo: g.dialogo(),
          presente: g.notteSalvata.presente, pannello: g.ripresa.stato(), piano: g.piano, flag: g.narrativa.flag().taddeo,
          scintille: g.profilo.scintille, pianoMax: g.narrativa.avanzamento().piano_max, hidden: document.querySelector('#interfaccia .ripresa')?.hidden,
        };
      });
      assert.equal(riaperta.stato, 'hub');
      assert.equal(riaperta.viste.includes(SCENA_TONINO), false, 'la scena a metà alla chiusura non è vista');
      assert.equal(riaperta.dialogo, null);
      assert.equal(riaperta.notte, 1);
      assert.equal(riaperta.presente, true);
      assert.equal(riaperta.pannello?.piano, 1);
      assert.equal(riaperta.pannello?.stanza, partenza.b);
      assert.equal(riaperta.hidden, false);
      assert.equal(riaperta.piano, null, 'la notte non riparte da sola');
      assert.equal(riaperta.flag, 'perdonato');
      assert.equal(riaperta.scintille, SCINTILLE);
      assert.equal(riaperta.pianoMax, 1);
      fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
      await pagina.screenshot({ path: EVIDENZE.ripresa });

      // click su «Continua» (DOM): stesso piano, stessa stanza, maschere, doni e monete
      await pagina.click('#interfaccia .ripresa .ripresa-continua');
      const ripresa = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.tick(2);
        return {
          stato: g.stato, seme: g.notte?.seme ?? null, stanza: g.stanza?.id ?? null, pianta: g.piano ? g.piano.stanze.map((s) => `${s.id}:${s.modello}:${s.tipo}`) : null,
          maschere: g.ferruccio.maschere, doni: g.modificatori.doniAttivi(), monete: g.economia.monete, pannello: g.ripresa.stato(), hubAttivo: g.hub.attivo,
          poolRaccolti: g.pool.raccolti(), stanzaEconomia: g.economia.stanzaCorrente, hud: document.querySelectorAll('#interfaccia .hud-doni li.dono').length,
        };
      });
      assert.equal(ripresa.stato, 'notte');
      assert.equal(ripresa.seme, partenza.semeNotte, 'stesso seme');
      assert.deepEqual(ripresa.pianta, partenza.pianta, 'stesso piano rigenerato dal seme');
      assert.equal(ripresa.stanza, partenza.b, 'stanza corrente ripristinata');
      assert.equal(ripresa.stanzaEconomia, partenza.b);
      assert.equal(ripresa.maschere, MASCHERE);
      assert.deepEqual(ripresa.doni, [DONO]);
      assert.deepEqual(ripresa.poolRaccolti, [DONO]);
      assert.equal(ripresa.monete, MONETE);
      assert.equal(ripresa.pannello, null, 'pannello nascosto nella notte');
      assert.equal(ripresa.hubAttivo, false);
      assert.equal(ripresa.hud, 1);

      // morte: pausa logica, velo con le fasi, poi hub con notte 2
      const morte = await pagina.evaluate(() => {
        const g = window.__gioco;
        const semeNotte1 = g.hub.semeNotte();
        g.ferruccio.impostaMaschere(1);
        g.ferruccio.subisciDanno({ danno: 1, x: g.ferruccio.x + 1, y: g.ferruccio.y });
        g.tick(1);
        const subito = { stato: g.stato, attivo: g.risveglio.attivo, fase: g.risveglio.fase, velo: g.veloMorte(), presente: g.notteSalvata.presente, monete: g.economia.monete, corpo: g.ferruccio.stato };
        let ticks = 1;
        while (g.risveglio.fase !== 'maschera' && ticks < 1000) { g.tick(1); ticks++; }
        const aMeta = { fase: g.risveglio.fase, velo: g.veloMorte(), stato: g.stato };
        return { semeNotte1, subito, aMeta, ticks };
      });
      assert.equal(morte.subito.stato, 'pausa', 'pausa logica durante la sequenza');
      assert.equal(morte.subito.attivo, true);
      assert.equal(morte.subito.fase, 'lanterne');
      assert.equal(morte.subito.velo.fase, 'lanterne');
      assert.equal(morte.subito.presente, false, 'la notte salvata è cancellata alla morte');
      assert.equal(morte.subito.monete, 0);
      assert.equal(morte.subito.corpo, 'morto');
      assert.equal(morte.aMeta.fase, 'maschera');
      assert.equal(morte.aMeta.velo.maschera, 'staccata');
      assert.equal(morte.aMeta.velo.fili, 'spezzati');
      assert.equal(morte.aMeta.velo.spente, morte.aMeta.velo.lanterne);
      await pagina.screenshot({ path: EVIDENZE.morte });

      const risveglio = await pagina.evaluate((tMax) => {
        const g = window.__gioco;
        let ticks = 0;
        while (g.risveglio.attivo && ticks < 1000) { g.tick(1); ticks++; }
        const totale = g.risveglio.durataMs();
        g.tick(2);
        return {
          ticks, totale, tMaxOk: totale <= tMax, stato: g.stato, hubAttivo: g.hub.attivo, notte: g.narrativa.avanzamento().notte, cartellino: g.cartellinoHub(),
          piano: g.piano, nottePresente: g.notteSalvata.presente, pannello: g.ripresa.stato(), velo: g.veloMorte(),
          doni: g.modificatori.doniAttivi(), monete: g.economia.monete, scintille: g.profilo.scintille, flag: g.narrativa.flag().taddeo,
          pianoMax: g.narrativa.avanzamento().piano_max, maschere: g.ferruccio.maschere, maschereMax: g.modificatori.valore('ferruccio.maschere_max'),
          corpo: g.ferruccio.stato, semeNotte2: g.hub.semeNotte(), bersagli: g.bersagli.length, hud: document.querySelectorAll('#interfaccia .hud-doni li.dono').length,
          profiloSalvato: JSON.parse(localStorage.getItem('ferruccio.v3.profilo.1')).dati.avanzamento.notte, notteSalvataSuDisco: localStorage.getItem('ferruccio.v3.notte.1'),
        };
      }, T_MAX_MS);
      assert.equal(risveglio.tMaxOk, true, `la sequenza dura ${risveglio.totale} ms`);
      assert.ok(risveglio.ticks * (1000 / 60) <= T_MAX_MS + 1000 / 60, `${risveglio.ticks} tick`);
      assert.equal(risveglio.stato, 'hub', 'dopo la sequenza si è nell\'hub');
      assert.equal(risveglio.hubAttivo, true);
      assert.equal(risveglio.notte, 2, 'notte + 1');
      assert.ok(risveglio.cartellino.notte.includes('2'), risveglio.cartellino.notte);
      assert.equal(risveglio.piano, null, 'la notte è lasciata');
      assert.equal(risveglio.bersagli, 0);
      assert.equal(risveglio.nottePresente, false);
      assert.equal(risveglio.notteSalvataSuDisco, null);
      assert.equal(risveglio.pannello, null, 'niente «Continua» dopo la morte');
      assert.equal(risveglio.velo, null);
      assert.deepEqual(risveglio.doni, [], 'i doni della notte spariscono');
      assert.equal(risveglio.hud, 0);
      assert.equal(risveglio.monete, 0, 'le monete spariscono');
      assert.equal(risveglio.scintille, SCINTILLE, 'le scintille restano');
      assert.equal(risveglio.flag, 'perdonato', 'i flag restano');
      assert.equal(risveglio.pianoMax, 1, 'piano_max resta');
      assert.equal(risveglio.maschere, risveglio.maschereMax);
      assert.equal(risveglio.corpo, 'fermo');
      assert.notEqual(risveglio.semeNotte2, morte.semeNotte1, 'la notte 2 avrà un altro seme');
      assert.equal(risveglio.profiloSalvato, 2, 'il profilo su disco porta la notte 2');
      await pagina.screenshot({ path: EVIDENZE.risveglio });
      for (const f of Object.values(EVIDENZE)) assert.ok(fs.statSync(f).size > 0, f);
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });
  } finally {
    if (browser) await browser.close();
    await server.chiudi();
  }
  const falliti = esiti.filter((e) => !e.ok);
  console.log(`\n# casi ${esiti.length}, falliti ${falliti.length}`);
  process.exit(falliti.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
