/**
 * gioco/qa/boss.wire.test.js — Test di pagina della storia P06 (boss del pool, Donna Luciana, sipario, ciclo; sostituisce
 * la P01 provvisoria) sul renderer pixel-art.
 *
 * Esecuzione: `node gioco/qa/boss.wire.test.js` dalla radice del repository (Playwright preinstallato; non eseguire mai
 * `playwright install`). Avvia `python3 -m http.server` su una porta libera con radice `gioco/`.
 *
 *  1. Per ogni boss di boss.json (pool + finale): apre `?debug=1&piano=1&seme=1845&boss=<id>`, ferma il ciclo rAF, salta alla
 *     stanza `boss`, aspetta la nascita: un solo bersaglio `boss === true`, `bossId` = id, archetipo base, pattern della
 *     tabella, vita = `run.vitaBoss(1)`; lo lascia agire 150 tick: fasi anticipo/lampo/colpo viste, proiettili in volo o
 *     corpo mosso (il Custode non si muove: spara), mai `segnoATerra`; barra della vita nell'HUD (pixel oro della cornice);
 *     screenshot `production/qa/evidence/boss-<id>.png` (Donna Luciana con le Mani scese e i fili).
 *  2. Flusso completo con `&boss=re-gatto`: ucciso via `colpisci` → `boss.sconfitto` {id: 're-gatto', archetipo: 'gatto'},
 *     `boss_battuti` ha `gatto-dei-quattro-canti`, il Medaglione cade e si raccoglie, uscita attiva → `piano.completato`,
 *     velo di discesa, poi il SIPARIO narrativo dell'atto II in DOM (ciclo in `pausa`, testo da interfaccia.json › sipario):
 *     screenshot `sipario.png`; `__gioco.sipario.chiudi()` → notte al piano 2 della stessa run (7 stanze), Medaglione addosso.
 *  3. Donna Luciana al piano 1 (forzata): alla morte `boss.finale_sconfitto`, `profilo.vittorie` 1, `boss_battuti` ha
 *     `donna-luciana`; `?sipario=0` salta il sipario e la discesa porta subito al piano 2 (il ciclo continua).
 *  Zero errori in console. Il server è chiuso nel `finally`.
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
const TESTI = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'interfaccia.json'), 'utf8'));
const BOSS = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'parametri', 'boss.json'), 'utf8'));
/** Teatro: il piano 2 ha n_min stanze (7), letto da generazione.json. */
const N_STANZE_P2 = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'parametri', 'generazione.json'), 'utf8')).piani.p2.n_min.base;
const SEME = 1845;
const ID_MEDAGLIONE = 'medaglione-di-rosa';
const TICKS_AZIONE = 260;

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
    stdio: ['ignore', 'ignore', 'ignore'], // stderr ignorato: il log delle richieste riempirebbe il pipe e bloccherebbe il server
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

/** Apre la pagina con i parametri dati, aspetta il piano e ferma il ciclo; ritorna pagina ed errori raccolti. */
async function apri(browser, base, query) {
  const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const pagina = await contesto.newPage();
  const errori = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  pagina.on('pageerror', (e) => errori.push(String(e)));
  await pagina.goto(`${base}/?${query}`, { waitUntil: 'load' });
  await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano);
  await pagina.waitForFunction(() => window.__gioco.tick() > 5);
  await pagina.evaluate(() => window.__gioco.ciclo.ferma());
  return { contesto, pagina, errori };
}

/** Salta alla stanza boss e aspetta che il boss nasca; Ferruccio in un angolo. */
async function entraNellaStanzaBoss(pagina) {
  return pagina.evaluate(() => {
    const g = window.__gioco;
    const eventi = [];
    for (const n of ['nemico.nato', 'boss.sconfitto', 'boss.finale_sconfitto', 'ricordi.caduto', 'ricordi.raccolto', 'stanza.svuotata', 'stanza.pulita', 'piano.completato',
      'fine_piano.avvio', 'risveglio.fine', 'notte.cancellata', 'economia.fine_notte', 'morte.avvio', 'piano.discesa', 'run.piano', 'narrativa.boss', 'profilo.vittoria',
      'boss.anticipo', 'boss.atterraggio', 'boss.mani_schianto']) g.eventi.on(n, (p) => eventi.push({ nome: n, ...p }));
    window.__eventiBoss = eventi;
    const stanzaBoss = g.piano.stanze.find((s) => s.tipo === 'boss');
    const esito = { id: stanzaBoss.id, vaiA: g.vaiA(stanzaBoss.id), stanze: g.piano.stanze.map((s) => s.id), combatteBoss: g.stanza.combatteBoss };
    let n = 0;
    for (; n < 300 && g.bersagli.length === 0; n++) g.tick(1);
    esito.ticksNascita = n;
    const b = g.bersagli[0];
    esito.bersagli = g.bersagli.map((x) => ({ id: x.id, archetipo: x.archetipo, boss: x.boss, bossId: x.bossId, pattern: x.pattern, vita: x.vita, vitaMax: x.vitaMax, r: x.r, stato: x.stato, nomeBoss: x.nomeBoss }));
    esito.bossStanza = g.stanza.boss === b;
    esito.porte = g.stanza.porte.map((d) => d.stato);
    esito.stato = g.stanza.stato;
    esito.uscita = g.stanza.uscita;
    esito.vitaAttesa = g.run.vitaBoss(1);
    esito.bossRun = { piano: g.run.piano, ciclo: g.run.ciclo, forzato: g.run.forzato, estratti: g.run.bossEstratti };
    g.ferruccio.posiziona(g.stanza.origine.x + g.stanza.cella * 1.5, g.stanza.origine.y + g.stanza.cella * 1.5);
    g.tick(1);
    return esito;
  });
}

async function main() {
  const server = await avviaServer();
  let browser;
  try {
    browser = await chromium.launch();
    fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });

    for (const info of [...BOSS.pool, BOSS.finale]) {
      await caso(`stanza boss con ?boss=${info.id}: nasce il ${info.nome} (${info.pattern}), vita della formula, agisce (fasi del telegrafo sul corpo, proiettili/moto), barra nell'HUD; screenshot boss-${info.id}.png; zero errori`, async () => {
        const { contesto, pagina, errori } = await apri(browser, server.base, `debug=1&piano=1&seme=${SEME}&boss=${info.id}`);
        const nascita = await entraNellaStanzaBoss(pagina);
        assert.equal(nascita.vaiA, true);
        assert.equal(nascita.combatteBoss, true);
        assert.ok(nascita.ticksNascita < 300, 'il boss nasce');
        assert.equal(nascita.bersagli.length, 1, `un solo nemico: ${JSON.stringify(nascita.bersagli)}`);
        const b = nascita.bersagli[0];
        assert.equal(b.boss, true);
        assert.equal(b.bossId, info.id);
        assert.equal(b.archetipo, info.archetipoBase);
        assert.equal(b.pattern, info.pattern);
        assert.equal(b.nomeBoss, info.nome);
        assert.equal(b.vita, nascita.vitaAttesa, 'vita della formula del Teatro (run.vitaBoss)');
        assert.equal(nascita.bossRun.forzato, info.id);
        assert.equal(nascita.bossRun.piano, 1);
        assert.ok(nascita.porte.length >= 1 && nascita.porte.every((s) => s === 'chiusa'));
        assert.equal(nascita.uscita.attiva, false);

        const azione = await pagina.evaluate((ticks) => {
          const g = window.__gioco;
          const b = g.bersagli[0];
          const prima = { x: b.x, y: b.y };
          const fasi = new Set();
          let segni = 0;
          let quotaMax = 0;
          for (let t = 0; t < ticks; t++) {
            g.tick(1);
            fasi.add(b.stato);
            if (b.segnoATerra && b.segnoATerra()) segni += 1;
            quotaMax = Math.max(quotaMax, b.quota || 0);
          }
          return {
            fasi: [...fasi], segni, quotaMax, proiettili: g.proiettili.filter((p) => p.vivo).length, totale: g.proiettili.length,
            mosso: Math.hypot(b.x - prima.x, b.y - prima.y), bersagli: g.bersagli.length, salve: b.salve, vita: b.vita, maschere: g.ferruccio.maschere,
            eventi: window.__eventiBoss.map((e) => e.nome),
          };
        }, TICKS_AZIONE);
        for (const f of ['anticipo', 'lampo', 'colpo']) assert.ok(azione.fasi.includes(f), `fase ${f} vista: ${azione.fasi}`);
        assert.equal(azione.segni, 0, 'mai un segno a terra');
        assert.ok(azione.totale > 0 || azione.mosso > 20, `agisce: ${azione.totale} proiettili, mosso ${azione.mosso.toFixed(0)} px`);
        if (info.pattern === 'gurdy_turret') assert.ok(azione.mosso < 1, 'il Custode non si muove');
        if (info.pattern === 'monstro_jump') assert.ok(azione.quotaMax > 0, 'il Re Gatto salta');
        if (info.pattern === 'marionette_queen') assert.ok(azione.eventi.includes('boss.mani_schianto'), 'schianto delle Mani');
        assert.ok(azione.eventi.includes('boss.anticipo'));

        // screenshot con il boss in azione (dopo qualche tick per avere proiettili a schermo) e la barra della vita nell'HUD
        await pagina.evaluate(() => window.__gioco.tick(20));
        const evidenza = path.join(CARTELLA_EVIDENZE, `boss-${info.id}.png`);
        await pagina.screenshot({ path: evidenza });
        assert.ok(fs.statSync(evidenza).size > 0);
        // storia P13: la barra della vita del boss è quella dell'HUD DOM del Teatro (`.hud-boss`, cornice `hud-barra-boss`), una sola
        const barra = await pagina.evaluate(() => {
          const g = window.__gioco;
          const e = document.querySelector('#interfaccia .hud-boss');
          const r = e.getBoundingClientRect();
          const palco = document.getElementById('palco').getBoundingClientRect();
          return { hud: g.hud().boss, nascosta: e.hidden, centro: (r.left + r.width / 2 - palco.left) / palco.width, alto: (r.top - palco.top) / palco.height, larghezza: r.width / palco.width, riempimento: e.querySelector('.hud-boss-riempimento').getBoundingClientRect().width };
        });
        assert.equal(barra.nascosta, false, 'barra della vita del boss nell\'HUD');
        assert.ok(barra.hud && barra.hud.nome === info.nome && barra.hud.quota > 0 && barra.hud.quota <= 1, JSON.stringify(barra.hud));
        assert.ok(Math.abs(barra.centro - 0.5) < 0.02 && barra.alto < 0.1 && barra.larghezza > 0.25, `in alto al centro: ${JSON.stringify(barra)}`);
        assert.ok(barra.riempimento > 0, 'riempimento visibile');
        assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
        await contesto.close();
      });
    }

    await caso('flusso con ?boss=re-gatto: ucciso → boss.sconfitto {id re-gatto, archetipo gatto}, boss_battuti, Medaglione a terra e raccolto, uscita → piano.completato, velo, SIPARIO dell\'atto II (screenshot sipario.png), chiudi → piano 2 della stessa run; zero errori', async () => {
      const { contesto, pagina, errori } = await apri(browser, server.base, `debug=1&piano=1&seme=${SEME}&boss=re-gatto`);
      const nascita = await entraNellaStanzaBoss(pagina);
      assert.equal(nascita.bersagli[0].bossId, 're-gatto');
      assert.equal(nascita.notteSalvata, undefined);

      const sconfitta = await pagina.evaluate(() => {
        const g = window.__gioco;
        const passo = 1000 / 60;
        const t = (k) => Math.max(1, Math.round(g.parametri.get(`stanze.${k}`) / passo));
        const b = g.bersagli[0];
        let colpi = 0;
        for (; colpi < 50 && b.stato !== 'morto'; colpi++) { b.colpisci(b.vita + 1, null); g.tick(1); }
        if (b.stato !== 'morto') b.forzaStato('morto');
        g.tick(2);
        const esito = { colpi, statoBoss: b.stato, bossDopo: g.stanza.boss };
        g.tick(t('t_pausa_ondata') + t('t_ritardo_apertura') + t('t_ricompensa') + t('t_anim_porta') + 3);
        esito.stato = g.stanza.stato;
        esito.porte = g.stanza.porte.map((d) => d.stato);
        esito.uscita = g.stanza.uscita;
        esito.aTerra = g.ricordi.aTerra().map((o) => ({ id: o.id, x: o.x, y: o.y, stanza: o.stanza }));
        esito.eventi = window.__eventiBoss.map((e) => e.nome);
        esito.sconfitto = window.__eventiBoss.find((e) => e.nome === 'boss.sconfitto');
        esito.bossBattuti = Array.from(g.narrativa.avanzamento().boss_battuti ?? []);
        return esito;
      });
      assert.equal(sconfitta.statoBoss, 'morto', `boss morto in ${sconfitta.colpi} colpi`);
      assert.equal(sconfitta.bossDopo, null);
      assert.equal(sconfitta.stato, 'pulita');
      assert.ok(sconfitta.porte.every((s) => s === 'aperta'));
      assert.equal(sconfitta.uscita.attiva, true);
      assert.equal(sconfitta.eventi.filter((e) => e === 'boss.sconfitto').length, 1);
      assert.equal(sconfitta.sconfitto.id, 're-gatto', 'l\'id vero del boss');
      assert.equal(sconfitta.sconfitto.archetipo, 'gatto');
      assert.equal(sconfitta.sconfitto.pattern, 'monstro_jump');
      assert.ok(sconfitta.bossBattuti.includes('gatto-dei-quattro-canti'), `boss_battuti: ${sconfitta.bossBattuti}`);
      assert.ok(sconfitta.eventi.includes('ricordi.caduto') && sconfitta.eventi.includes('stanza.pulita'));
      assert.equal(sconfitta.aTerra.length, 1, 'il Medaglione è a terra (il boss è il Gatto e tonino_ricordo è null)');
      assert.equal(sconfitta.aTerra[0].id, ID_MEDAGLIONE);

      const raccolta = await pagina.evaluate(() => {
        const g = window.__gioco;
        const o = g.ricordi.aTerra()[0];
        g.ferruccio.posiziona(o.x, o.y);
        let t = 0;
        while (t < 240 && g.ricordi.aTerra().length > 0) { g.tick(1); t++; }
        return { t, inMano: g.ricordi.inMano().slice() };
      });
      assert.ok(raccolta.t < 240 && raccolta.inMano.includes(ID_MEDAGLIONE), `Medaglione raccolto in ${raccolta.t} tick`);

      const uscita = await pagina.evaluate(() => {
        const g = window.__gioco;
        const passo = 1000 / 60;
        const attesa = Math.max(1, Math.round(g.parametri.get('stanze.uscita.t_attesa') / passo));
        const u = g.stanza.uscita;
        g.ferruccio.posiziona(u.x, u.y);
        let t = 0;
        while (t < attesa * 3 && window.__eventiBoss.filter((e) => e.nome === 'piano.completato').length === 0) { g.tick(1); t++; }
        g.tick(2);
        return {
          t, completati: window.__eventiBoss.filter((e) => e.nome === 'piano.completato'), stato: g.stato, attivo: g.risveglio.attivo, motivo: g.risveglio.motivo,
          velo: g.veloMorte(), notteSalvata: g.notteSalvata.presente, pianoMax: g.narrativa.avanzamento().piano_max, notte: g.narrativa.avanzamento().notte,
        };
      });
      assert.equal(uscita.completati.length, 1);
      assert.equal(uscita.stato, 'pausa');
      assert.equal(uscita.motivo, 'discesa');
      assert.equal(uscita.velo.didascalia, TESTI.fine_piano.discesa.replace('{piano}', '2'));
      assert.equal(uscita.notteSalvata, false);
      assert.equal(uscita.pianoMax, 2);
      assert.equal(uscita.notte, 1);

      // fine del velo: il piano 2 è generato ma il SIPARIO dell'atto II tiene il ciclo in pausa
      const sipario = await pagina.evaluate(() => {
        const g = window.__gioco;
        let ticks = 0;
        while (g.risveglio.attivo && ticks < 2000) { g.tick(1); ticks++; }
        g.tick(3);
        const el = document.querySelector('#interfaccia .sipario');
        return {
          ticks, stato: g.stato, sipario: g.sipario.stato(), pianoP: g.piano ? g.piano.p : null, domVisibile: Boolean(el) && !el.hidden,
          testoDom: el ? el.textContent : '', discese: window.__eventiBoss.filter((e) => e.nome === 'piano.discesa').length,
          runPiano: g.run.piano, runCiclo: g.run.ciclo,
        };
      });
      assert.ok(sipario.ticks < 2000, 'il velo finisce');
      assert.equal(sipario.discese, 1);
      assert.equal(sipario.stato, 'pausa', 'il sipario tiene il ciclo in pausa');
      assert.equal(sipario.sipario.aperto, true);
      assert.equal(sipario.domVisibile, true);
      assert.equal(sipario.sipario.piano, 2);
      assert.equal(sipario.sipario.pianoNelCiclo, 2);
      assert.equal(sipario.runPiano, 2);
      assert.equal(sipario.runCiclo, 1);
      const attoII = TESTI.sipario.atti['2'];
      assert.equal(sipario.sipario.titolo, attoII.titolo);
      assert.ok(sipario.sipario.atto.includes('Piano 2') && sipario.sipario.atto.includes(`${N_STANZE_P2} stanze`), sipario.sipario.atto);
      assert.ok(sipario.testoDom.includes(attoII.righe[0]), 'le righe dell\'atto nel DOM');
      const evidenzaSipario = path.join(CARTELLA_EVIDENZE, 'sipario.png');
      await pagina.screenshot({ path: evidenzaSipario });
      assert.ok(fs.statSync(evidenzaSipario).size > 0);

      const ripresa = await pagina.evaluate(() => {
        const g = window.__gioco;
        const chiuso = g.sipario.chiudi();
        g.tick(5);
        return {
          chiuso, stato: g.stato, aperto: g.sipario.aperto, pianoP: g.piano ? g.piano.p : null, nonSegrete: g.piano ? g.piano.stanze.filter((s) => s.tipo !== 'segreta').length : 0,
          stanza: g.stanza ? g.stanza.tipo : null, bersagli: g.bersagli.length, notte: g.narrativa.avanzamento().notte, inMano: g.ricordi.inMano().slice(),
          fine: window.__eventiBoss.find((e) => e.nome === 'risveglio.fine'), chiudiDiNuovo: g.sipario.chiudi(),
        };
      });
      assert.equal(ripresa.chiuso, true);
      assert.equal(ripresa.chiudiDiNuovo, false);
      assert.equal(ripresa.stato, 'notte', 'alzato il sipario la run continua');
      assert.equal(ripresa.pianoP, 2);
      assert.equal(ripresa.nonSegrete, N_STANZE_P2, 'Teatro: piano 2 = 7 stanze');
      assert.equal(ripresa.stanza, 'ingresso');
      assert.equal(ripresa.notte, 1);
      assert.equal(ripresa.fine, undefined, 'nessun risveglio.fine: la run continua con tutto addosso');
      assert.ok(ripresa.inMano.includes(ID_MEDAGLIONE));
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });

    await caso('Donna Luciana forzata al piano 1 con ?sipario=0: alla morte boss.finale_sconfitto, profilo.vittorie 1, boss_battuti ha donna-luciana; la discesa continua al piano 2 senza sipario; zero errori', async () => {
      const { contesto, pagina, errori } = await apri(browser, server.base, `debug=1&piano=1&seme=${SEME}&boss=donna-luciana&sipario=0`);
      const nascita = await entraNellaStanzaBoss(pagina);
      assert.equal(nascita.bersagli[0].bossId, 'donna-luciana');
      const esito = await pagina.evaluate(() => {
        const g = window.__gioco;
        const passo = 1000 / 60;
        const t = (k) => Math.max(1, Math.round(g.parametri.get(`stanze.${k}`) / passo));
        const b = g.bersagli[0];
        const vittoriePrima = g.profilo.vittorie;
        for (let colpi = 0; colpi < 50 && b.stato !== 'morto'; colpi++) { b.colpisci(b.vita + 1, null); g.tick(1); }
        g.tick(t('t_pausa_ondata') + t('t_ritardo_apertura') + t('t_ricompensa') + t('t_anim_porta') + 3);
        const dopo = { vittoriePrima, vittorie: g.profilo.vittorie, cicloMax: g.profilo.cicloMax, bossBattuti: Array.from(g.narrativa.avanzamento().boss_battuti ?? []), stato: g.stanza.stato };
        const finale = window.__eventiBoss.find((e) => e.nome === 'boss.finale_sconfitto');
        const u = g.stanza.uscita;
        g.ferruccio.posiziona(u.x, u.y);
        let k = 0;
        while (k < 600 && window.__eventiBoss.filter((e) => e.nome === 'piano.completato').length === 0) { g.tick(1); k++; }
        let ticks = 0;
        while (g.risveglio.attivo && ticks < 2000) { g.tick(1); ticks++; }
        g.tick(5);
        return { ...dopo, finale, statoCiclo: g.stato, pianoP: g.piano ? g.piano.p : null, sipario: g.sipario.stato(), runPiano: g.run.piano, discese: window.__eventiBoss.filter((e) => e.nome === 'piano.discesa').length };
      });
      assert.equal(esito.stato, 'pulita');
      assert.ok(esito.finale, 'boss.finale_sconfitto emesso');
      assert.equal(esito.finale.id, 'donna-luciana');
      assert.equal(esito.vittorie, esito.vittoriePrima + 1, 'la vittoria va nel profilo');
      assert.ok(esito.cicloMax >= 1);
      assert.ok(esito.bossBattuti.includes('donna-luciana'), `boss_battuti: ${esito.bossBattuti}`);
      assert.equal(esito.discese, 1);
      assert.equal(esito.sipario.aperto, false, '?sipario=0 salta il sipario');
      assert.equal(esito.sipario.mostrati, 0);
      assert.equal(esito.statoCiclo, 'notte');
      assert.equal(esito.pianoP, 2);
      assert.equal(esito.runPiano, 2);
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
