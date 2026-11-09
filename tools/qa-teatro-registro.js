#!/usr/bin/env node
/*
 * tools/qa-teatro-registro.js — verifica Playwright del miglioramento 7 (gioco/teatro/a7-registro-bilancio.js):
 * registro di fine run (contatori, causa della morte dal tiratore del proiettile, sangue delle stanze speciali),
 * pergamena dopo la sequenza di morte (che torna all'hub come prima), un tasto la chiude, Registro delle notti
 * dal menu ESC, esportazione JSON, tetto di 50 run per slot.
 *
 * Uso: node tools/qa-teatro-registro.js <file html> [prefisso screenshot]
 * Screenshot <prefisso>-01-pergamena.png, -02-registro.png, -03-menu-esc.png. Esce con 1 se un controllo fallisce.
 * Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-registro');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });
  const fase = () => p.evaluate(() => window.__teatro.fase);
  const chiudiDialoghi = async () => {
    for (let i = 0; i < 40; i++) {
      const d = await p.evaluate(() => window.__teatro.t4qa.dialogo);
      if (!d) return;
      await p.keyboard.press(d.scelta ? 'Digit1' : 'Space');
      await p.waitForTimeout(50);
    }
  };
  const entraNelTeatro = async () => {
    await chiudiDialoghi();
    const ing = await p.evaluate(() => window.__teatro.t4qa.ingresso);
    await p.evaluate((g) => { const P = window.__teatro.interni.player; P.x = g.x - 40; P.y = g.y; }, ing);
    await p.keyboard.down('KeyD'); await p.waitForTimeout(900); await p.keyboard.up('KeyD');
    await p.keyboard.press('Space');
    await p.waitForTimeout(150);
  };

  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await p.waitForTimeout(500);
  await p.keyboard.press('Space'); // menu → hub
  await p.waitForTimeout(300);
  await entraNelTeatro();
  ok('in-gioco', (await fase()) === 'in_gioco', await fase());
  ok('run-in-corso', await p.evaluate(() => Boolean(window.__teatro.interni.runInCorsoA7())));

  // 1. Una stanza ripulita: si uccidono i nemici della prima stanza di combattimento con il danno del gioco
  const prep = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    R.siparioAttivo = null;
    const st = R.mappa.stanze.find((s) => s.tipo === 'normale');
    I.entraInStanza(st, null);
    R.graziaIngressoC = 0; I.player.invuln = 999;
    const n = st.nemici.filter((x) => x.hp > 0).length;
    for (const x of st.nemici.slice()) if (x.hp > 0) danneggiaNemico(x, 9999, 0, 0);
    R.proiettiliNemici = [];
    return { n, pulita: st.pulita };
  });
  await p.waitForTimeout(200);
  // 2. Inventario: monete prese e spese, una bomba piazzata, una chiave presa; un oggetto; un consumabile
  await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    R.monete += 5;
  });
  await p.waitForTimeout(80);
  await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    R.monete -= 3;
  });
  await p.waitForTimeout(80);
  await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    I.aggiungiChiavi(1);
    I.piazzaBombaA1();
    const o = I.CATALOGO_OGGETTI.find((x) => x.tier === 'base' && x.polarita !== 'negativo' && !['bloccoProb', 'bloccaProiettili', 'scudoStanza', 'dannoMaxHalf', 'maledizione', 'famiglio', 'orbitali'].some((k) => x.mod && x.mod[k]));
    I.acquisisciOggetto({ ...o }, 'regalo', null);
    I.prendiConsumabileA2(I.creaConsumabileA2('carta', 'tre_denari'));
    usaConsumabileA2(); // la funzione globale (avvolta dal registro), come il tasto F
    R.cartiglioD = null;
  });
  await p.waitForTimeout(2000); // la bomba esplode lontano (invuln alto)
  const meta = await p.evaluate(() => window.__teatro.interni.runInCorsoA7());
  ok('stanza-ripulita', meta.stanzePulite >= 1 && prep.pulita, { prep, stanzePulite: meta.stanzePulite });
  ok('nemici-uccisi', meta.nemiciUccisi >= prep.n, meta.nemiciUccisi);
  ok('monete-prese-spese', meta.monete.prese >= 5 + 3 && meta.monete.spese >= 3, meta.monete); // +3 della carta
  ok('bomba-spesa', meta.bombe.spese >= 1, meta.bombe);
  ok('chiave-presa', meta.chiavi.prese >= 1, meta.chiavi);
  ok('oggetto-preso', meta.oggetti.length >= 1 && meta.oggetti[0].nome, meta.oggetti);
  ok('consumabile-usato', meta.consumabili.length === 1 && meta.consumabili[0].nome === 'Tre di Denari', meta.consumabili);
  ok('tempo-scorre', meta.tempoMs > 1000, meta.tempoMs);

  // 3. Sangue delle stanze speciali (prezzo del ceppo, non letale)
  const sangue = await p.evaluate(() => {
    const R = window.__teatro.interni.statoRun; R.hpHalf = R.maxHpHalf;
    pagaSangueA3(1, false, 'il ceppo dei chiodi');
    return window.__teatro.interni.runInCorsoA7();
  });
  ok('sangue-speciali', sangue.sangueHalf === 1 && sangue.causa === 'il ceppo dei chiodi', { s: sangue.sangueHalf, c: sangue.causa });

  // 4. Morte per un proiettile: la causa è il nemico che l'ha sparato
  const tiratore = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    const st = R.mappa.stanze.find((s) => s.tipo === 'normale' && s !== R.stanzaCorrente && s.nemici.some((n) => n.hp > 0 && (n.patternMob || n.tipo) !== 'bomba_ferma'));
    I.entraInStanza(st, null);
    st.nemici = st.nemici.filter((n) => n.hp > 0 && (n.patternMob || n.tipo) !== 'bomba_ferma').slice(0, 1);
    const n = st.nemici[0];
    n.x = 200; n.y = 150; n.speed = 0; n.shootCd = 9999; n.stateTimer = 9999;
    R.graziaIngressoC = 0; I.player.invuln = 0; R.hpHalf = 1; R.scudoRosaC = false; R.scudoStanzaD = 0;
    I.player.x = 200; I.player.y = 260;
    R.proiettiliNemici = [{ x: 200, y: 226, vx: 0, vy: 1, dist: 0 }];
    st.ostacoli = [];
    return n.nome.replace(/\s*\(.*?\)/g, '');
  });
  let vistoMorte = false;
  for (let i = 0; i < 120; i++) {
    const f = await fase();
    if (f === 'morte') vistoMorte = true;
    if (f === 'hub') break;
    await p.waitForTimeout(100);
  }
  if (process.env.DEBUG_A7) console.log(await p.evaluate(() => { const I = window.__teatro.interni; const R = I.statoRun; return { hp: R.hpHalf, inv: I.player.invuln, px: I.player.x, py: I.player.y, pr: R.proiettiliNemici, st: R.stanzaCorrente.tipo, sip: R.siparioAttivo, pausa: R.pausa, ban: R.banner, carti: !!R.cartiglioD, dia: window.__teatro.t4qa.dialogo }; }));
  ok('morte-poi-hub', vistoMorte && (await fase()) === 'hub', await fase());
  await p.waitForTimeout(300);
  const perg = await p.evaluate(() => window.__teatro.interni.registroA7.pergamena);
  ok('pergamena-in-hub', perg && perg.tipo === 'morte', perg);
  ok('causa-tiratore', perg && perg.causa === `un colpo di ${tiratore}`, { perg, tiratore });
  await p.screenshot({ path: foto('01-pergamena') });
  const reg = await p.evaluate(() => window.__teatro.interni.registroRun());
  ok('registro-una-run', reg.length === 1 && reg[0].esito === 'morte' && reg[0].piano === 1, reg.map((v) => [v.esito, v.causa, v.piano]));
  ok('registro-campi', reg[0] && reg[0].nomePersonaggio && reg[0].notte >= 1 && reg[0].stanza && reg[0].perPiano[1], reg[0] && Object.keys(reg[0]));
  await p.keyboard.press('KeyK');
  await p.waitForTimeout(120);
  ok('tasto-chiude', !(await p.evaluate(() => window.__teatro.interni.registroA7.pergamena)));

  // 5. Registro delle notti dal menu ESC (nell'hub), esportazione, chiusura
  await chiudiDialoghi();
  await p.keyboard.press('Escape');
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('03-menu-esc') });
  await p.keyboard.press('KeyL');
  await p.waitForTimeout(150);
  ok('registro-aperto', await p.evaluate(() => window.__teatro.interni.registroA7.aperto));
  await p.screenshot({ path: foto('02-registro') });
  const exp = await p.evaluate(() => JSON.parse(window.__teatro.interni.esportaRegistro()));
  ok('esporta-json', exp.run.length === 1 && exp.statistiche.run === 1 && exp.statistiche.causeMorte[0].n === 1, exp.statistiche);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(100);
  const dopo = await p.evaluate(() => ({ aperto: window.__teatro.interni.registroA7.aperto, pausa: window.__teatro.interni.statoRun.pausa }));
  ok('esc-chiude-registro', !dopo.aperto && dopo.pausa, dopo);
  await p.keyboard.press('Escape');

  // 6. Tetto di 50 run per slot; una seconda run abbandonata con Ricomincia notte
  await p.evaluate(() => {
    const vecchia = window.__teatro.interni.registroRun()[0];
    const lista = []; for (let i = 0; i < 55; i++) lista.push({ ...vecchia, id: `finta-${i}` });
    const slot = window.__teatroT3.salvataggi.slotAttivo;
    localStorage.setItem(`ferruccio.teatro.registro.${slot}`, JSON.stringify({ versione: 1, slot, run: lista }));
  });
  await entraNelTeatro();
  await p.evaluate(() => { window.__teatro.interni.statoRun.siparioAttivo = null; });
  await p.keyboard.press('Escape');
  await p.keyboard.press('KeyR');
  await p.waitForTimeout(300);
  const fine = await p.evaluate(() => window.__teatro.interni.registroRun());
  ok('tetto-50', fine.length === 50, fine.length);
  ok('abbandono-registrato', fine[fine.length - 1].esito === 'abbandono', fine[fine.length - 1].esito);

  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ file: path.relative(RADICE, file), esiti, erroriConsole: errori }, null, 1));
  console.log(falliti.length || errori.length ? `FALLITI: ${falliti.map((e) => e.caso).join(', ')}${errori.length ? ' + errori console' : ''}` : 'TUTTO OK');
  process.exitCode = falliti.length || errori.length ? 1 : 0;
})();
