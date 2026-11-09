/**
 * gioco/qa/boss.wire.test.js — Test di pagina della storia P01 (PROVVISORIA, build di prova per l'autore;
 * la storia 022 la sostituisce) in fil di ferro: boss provvisorio e uscita del piano.
 *
 * Esecuzione: `node gioco/qa/boss.wire.test.js` dalla radice del repository (Playwright preinstallato;
 * non eseguire mai `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice
 * `gioco/`, apre `?debug=1&wire=1&piano=1&seme=1845`, ferma il ciclo rAF e lo guida a tick forzati via
 * `window.__gioco`: salta alla stanza `boss` del piano, aspetta che il boss nasca (un solo bersaglio con
 * `boss === true`, archetipo gatto, porte chiuse, uscita chiusa), salva `production/qa/evidence/boss-provvisorio.png`
 * (gatto scalato con etichetta «boss (provvisorio)», arco tratteggiato dell'uscita), lo uccide via `colpisci`
 * (ripiego `forzaStato('morto')`), verifica `boss.sconfitto`, il Medaglione a terra (`__gioco.ricordi.aTerra()`),
 * la stanza pulita e l'uscita attiva; raccoglie il Medaglione camminandoci; cammina sull'uscita: `piano.completato`
 * una volta, ciclo in `pausa`, velo DOM con motivo `vittoria` e il testo di `interfaccia.json › fine_piano.velo`,
 * notte salvata cancellata; poi la notte riparte dallo stesso seme (senza hub) con `notte` 2 e `piano_max` 2.
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
const EVIDENZA = path.join(CARTELLA_EVIDENZE, 'boss-provvisorio.png');
const TESTI = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'interfaccia.json'), 'utf8'));
/** Teatro: il piano 2 ha n_min stanze (7), letto da generazione.json. */
const N_STANZE_P2 = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'parametri', 'generazione.json'), 'utf8')).piani.p2.n_min.base;
const SEME = 1845;
const ID_MEDAGLIONE = 'medaglione-di-rosa';

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

    await caso('stanza boss: un solo gatto boss provvisorio, ucciso → boss.sconfitto, Medaglione a terra e raccolto, stanza pulita, uscita attiva → piano.completato una volta, velo di discesa, piano 2 nella stessa run (notte 1, Medaglione addosso); screenshot; zero errori', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}/?debug=1&wire=1&piano=1&seme=${SEME}`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano);
      await pagina.waitForFunction(() => window.__gioco.tick() > 5);
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      // nella stanza boss: il boss nasce dal contenuto, uno solo, boss === true, porte chiuse, uscita chiusa
      const nascita = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.ciclo.ferma();
        const eventi = [];
        for (const n of ['nemico.nato', 'boss.sconfitto', 'ricordi.caduto', 'ricordi.raccolto', 'stanza.svuotata', 'stanza.pulita', 'piano.completato',
          'fine_piano.avvio', 'risveglio.fine', 'notte.cancellata', 'economia.fine_notte', 'morte.avvio']) g.eventi.on(n, (p) => eventi.push({ nome: n, ...p }));
        window.__eventiBoss = eventi;
        const stanzaBoss = g.piano.stanze.find((s) => s.tipo === 'boss');
        const esito = { id: stanzaBoss.id, modello: stanzaBoss.modello, vaiA: g.vaiA(stanzaBoss.id), stanze: g.piano.stanze.map((s) => s.id) };
        esito.combatteBoss = g.stanza.combatteBoss;
        esito.uscitaPrima = g.stanza.uscita;
        let n = 0;
        for (; n < 300 && g.bersagli.length === 0; n++) g.tick(1);
        esito.ticksNascita = n;
        const b = g.bersagli[0];
        esito.bersagli = g.bersagli.map((x) => ({ archetipo: x.archetipo, boss: x.boss, vita: x.vita, r: x.r, stato: x.stato }));
        esito.bossStanza = g.stanza.boss === b;
        esito.porte = g.stanza.porte.map((d) => d.stato);
        esito.stato = g.stanza.stato;
        esito.uscita = g.stanza.uscita;
        esito.vitaBoss = g.parametri.get('nemici.boss_provvisorio.vita');
        esito.notteSalvata = g.notteSalvata.presente;
        // Ferruccio in un angolo, lontano dal centro (uscita e bottino)
        g.ferruccio.posiziona(g.stanza.origine.x + g.stanza.cella * 1.5, g.stanza.origine.y + g.stanza.cella * 1.5);
        g.tick(1);
        return esito;
      });
      assert.equal(nascita.vaiA, true);
      assert.equal(nascita.combatteBoss, true);
      assert.ok(nascita.ticksNascita < 300, 'il boss nasce');
      assert.equal(nascita.bersagli.length, 1, `un solo nemico: ${JSON.stringify(nascita.bersagli)}`);
      assert.equal(nascita.bersagli[0].boss, true);
      assert.equal(nascita.bersagli[0].archetipo, 'gatto');
      assert.equal(nascita.bersagli[0].vita, nascita.vitaBoss, 'vita della scheda boss_provvisorio');
      assert.equal(nascita.bossStanza, true);
      assert.ok(nascita.porte.length >= 1 && nascita.porte.every((s) => s === 'chiusa'), `porte ${nascita.porte}`);
      assert.equal(nascita.stato, 'ondata');
      assert.equal(nascita.uscitaPrima.attiva, false);
      assert.equal(nascita.uscita.attiva, false, 'uscita chiusa con il boss vivo');
      assert.equal(nascita.uscita.attraversata, false);

      // screenshot: gatto scalato con l'etichetta «boss (provvisorio)», arco tratteggiato dell'uscita al centro
      fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
      await pagina.screenshot({ path: EVIDENZA });
      assert.ok(fs.statSync(EVIDENZA).size > 0);

      // uccide il boss: boss.sconfitto, Medaglione a terra, stanza pulita, uscita attiva
      const sconfitta = await pagina.evaluate(() => {
        const g = window.__gioco;
        const passo = 1000 / 60;
        const t = (k) => Math.max(1, Math.round(g.parametri.get(`stanze.${k}`) / passo));
        const b = g.bersagli[0];
        let colpi = 0;
        for (; colpi < 50 && b.stato !== 'morto'; colpi++) { b.colpisci(b.vita + 1, null); g.tick(1); }
        if (b.stato !== 'morto') b.forzaStato('morto');
        g.tick(2);
        const esito = { colpi, statoBoss: b.stato, statoSubito: g.stanza.stato, bossDopo: g.stanza.boss };
        g.tick(t('t_pausa_ondata') + t('t_ritardo_apertura') + t('t_ricompensa') + t('t_anim_porta') + 3);
        esito.stato = g.stanza.stato;
        esito.porte = g.stanza.porte.map((d) => d.stato);
        esito.uscita = g.stanza.uscita;
        esito.aTerra = g.ricordi.aTerra().map((o) => ({ id: o.id, x: o.x, y: o.y, stanza: o.stanza }));
        esito.bottino = g.economia.aTerra(g.stanza.id).length;
        esito.gettoni = g.direttore.gettoni ?? null;
        esito.eventi = window.__eventiBoss.map((e) => e.nome);
        esito.sconfitto = window.__eventiBoss.find((e) => e.nome === 'boss.sconfitto');
        return esito;
      });
      assert.equal(sconfitta.statoBoss, 'morto', `boss morto in ${sconfitta.colpi} colpi`);
      assert.equal(sconfitta.bossDopo, null);
      assert.equal(sconfitta.stato, 'pulita');
      assert.ok(sconfitta.porte.every((s) => s === 'aperta'), `porte riaperte: ${sconfitta.porte}`);
      assert.equal(sconfitta.uscita.attiva, true, 'uscita attiva a stanza pulita');
      assert.equal(sconfitta.eventi.filter((e) => e === 'boss.sconfitto').length, 1);
      assert.equal(sconfitta.sconfitto.id, 'gatto');
      assert.ok(Number.isFinite(sconfitta.sconfitto.x) && Number.isFinite(sconfitta.sconfitto.y));
      assert.ok(sconfitta.eventi.includes('ricordi.caduto') && sconfitta.eventi.includes('stanza.svuotata') && sconfitta.eventi.includes('stanza.pulita'));
      assert.equal(sconfitta.aTerra.length, 1, 'il Medaglione è a terra');
      assert.equal(sconfitta.aTerra[0].id, ID_MEDAGLIONE);
      assert.equal(sconfitta.aTerra[0].stanza, nascita.id);
      assert.equal(sconfitta.eventi.filter((e) => e === 'piano.completato').length, 0, 'nessun piano.completato in un angolo');

      // raccoglie il Medaglione camminandoci sopra
      const raccolta = await pagina.evaluate(() => {
        const g = window.__gioco;
        const o = g.ricordi.aTerra()[0];
        g.ferruccio.posiziona(o.x, o.y);
        let t = 0;
        while (t < 240 && g.ricordi.aTerra().length > 0) { g.tick(1); t++; }
        return { t, inMano: g.ricordi.inMano().slice(), aTerra: g.ricordi.aTerra().length, completati: window.__eventiBoss.filter((e) => e.nome === 'piano.completato').length };
      });
      assert.ok(raccolta.t < 240, `Medaglione raccolto in ${raccolta.t} tick`);
      assert.equal(raccolta.aTerra, 0);
      assert.ok(raccolta.inMano.includes(ID_MEDAGLIONE), `in mano: ${raccolta.inMano}`);
      assert.equal(raccolta.completati, 0);

      // cammina sull'uscita: piano.completato una volta, pausa, velo di vittoria, notte salvata cancellata
      const uscita = await pagina.evaluate(() => {
        const g = window.__gioco;
        const passo = 1000 / 60;
        const attesa = Math.max(1, Math.round(g.parametri.get('stanze.uscita.t_attesa') / passo));
        const u = g.stanza.uscita;
        g.ferruccio.posiziona(u.x, u.y);
        let t = 0;
        while (t < attesa * 3 && window.__eventiBoss.filter((e) => e.nome === 'piano.completato').length === 0) { g.tick(1); t++; }
        g.tick(2);
        const completati = window.__eventiBoss.filter((e) => e.nome === 'piano.completato');
        return {
          t, attesa, completati, stato: g.stato, attivo: g.risveglio.attivo, motivo: g.risveglio.motivo, fase: g.risveglio.fase,
          pianoProssimo: g.risveglio.pianoProssimo, velo: g.veloMorte(), notteSalvata: g.notteSalvata.presente,
          cancellata: window.__eventiBoss.find((e) => e.nome === 'notte.cancellata'), eventi: window.__eventiBoss.map((e) => e.nome),
          pianoMax: g.narrativa.avanzamento().piano_max, notte: g.narrativa.avanzamento().notte,
        };
      });
      assert.equal(uscita.completati.length, 1, `piano.completato una volta (${uscita.t} tick)`);
      assert.equal(uscita.completati[0].piano, 1);
      assert.equal(uscita.stato, 'pausa', 'pausa logica durante il velo');
      assert.equal(uscita.attivo, true);
      assert.equal(uscita.motivo, 'discesa', 'Teatro: dopo il boss dei piani 1-3 si scende');
      assert.equal(uscita.fase, 'discesa');
      assert.equal(uscita.pianoProssimo, 2);
      assert.equal(uscita.velo.motivo, 'discesa');
      assert.equal(uscita.velo.didascalia, TESTI.fine_piano.discesa.replace('{piano}', '2'), 'il testo del velo viene da interfaccia.json › fine_piano.discesa');
      assert.equal(uscita.notteSalvata, false, 'notte salvata cancellata');
      assert.equal(uscita.cancellata && uscita.cancellata.motivo, 'vittoria');
      assert.ok(uscita.eventi.includes('fine_piano.avvio') && !uscita.eventi.includes('economia.fine_notte') && !uscita.eventi.includes('morte.avvio'), 'scendendo la notte dell\'economia non si chiude');
      assert.equal(uscita.pianoMax, 2, 'piano_max registrato');
      assert.equal(uscita.notte, 1, 'la notte avanza solo al risveglio');

      // fine del velo: la run continua al piano 2 (stesso seme della run, pianta nuova), notte invariata, nessun risveglio.fine, nessun secondo piano.completato
      const ripresa = await pagina.evaluate(() => {
        const g = window.__gioco;
        let ticks = 0;
        while (g.risveglio.attivo && ticks < 2000) { g.tick(1); ticks++; }
        g.tick(5);
        return {
          ticks, stato: g.stato, attivo: g.risveglio.attivo, motivo: g.risveglio.motivo, piano: g.piano ? g.piano.stanze.map((s) => s.id) : null,
          pianoP: g.piano ? g.piano.p : null, nonSegrete: g.piano ? g.piano.stanze.filter((s) => s.tipo !== 'segreta').length : 0,
          stanza: g.stanza ? g.stanza.tipo : null, bersagli: g.bersagli.length, notte: g.narrativa.avanzamento().notte, pianoMax: g.narrativa.avanzamento().piano_max,
          morti: g.risveglio.morti, fine: window.__eventiBoss.find((e) => e.nome === 'risveglio.fine'), velo: g.veloMorte(),
          completati: window.__eventiBoss.filter((e) => e.nome === 'piano.completato').length, inMano: g.ricordi.inMano().slice(), maschere: g.ferruccio.maschere,
        };
      });
      assert.ok(ripresa.ticks < 2000, 'il velo finisce');
      assert.equal(ripresa.attivo, false);
      assert.equal(ripresa.motivo, null);
      assert.equal(ripresa.stato, 'notte', 'la run continua: si scende al piano 2');
      assert.equal(ripresa.pianoP, 2, 'piano 2 della stessa run');
      assert.equal(ripresa.nonSegrete, N_STANZE_P2, 'Teatro: piano 2 = 7 stanze');
      assert.notDeepEqual(ripresa.piano, nascita.stanze, 'una pianta nuova, non quella del piano 1');
      assert.equal(ripresa.stanza, 'ingresso');
      assert.equal(ripresa.bersagli, 0);
      assert.equal(ripresa.notte, 1, 'la notte non avanza scendendo');
      assert.equal(ripresa.pianoMax, 2);
      assert.equal(ripresa.morti, 0, 'scendere non conta come morte');
      assert.equal(ripresa.fine, undefined, 'nessun risveglio.fine: la run continua con tutto addosso');
      assert.ok(ripresa.inMano.includes(ID_MEDAGLIONE), 'il Medaglione resta addosso scendendo');
      assert.equal(ripresa.completati, 1);

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
