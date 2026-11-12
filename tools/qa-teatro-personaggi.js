#!/usr/bin/env node
/*
 * QA dei quattro personaggi (teatro/d2-personaggi.js): per ognuno parte una run e l'attacco fa danno;
 * Agnese devia un proiettile e supera una fossa con la piroetta (tastiera e RT del gamepad finto);
 * Taddeo rompe un vaso col maglio, carica tenendo premuto e non viene spinto; l'Ombra muore con un colpo,
 * vola sopra una colonna e il colpo attraversa colonna e nemico; bottone MOSSA a tocco solo con Agnese;
 * nessun errore in ERRORI_TEATRO. Uso: node tools/qa-teatro-personaggi.js <html> <prefisso-assoluto>
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-personaggi');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });
  await p.addInitScript(() => {
    window.__pad = { id: 'Pad finto (QA)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => (window.__padAcceso ? [window.__pad, null, null, null] : [null, null, null, null]) });
  });
  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(600);

  /** Run nuova col personaggio, stanza normale ripulita, un nemico robusto (fermo) se richiesto. */
  const prepara = (pid, conNemico = true) => p.evaluate(({ pid, conNemico }) => {
    const I = window.__teatro.interni;
    if (I.progressione && I.progressione.sbloccaTutto) I.progressione.sbloccaTutto(); else if (I.sbloccaTutto) I.sbloccaTutto();
    selezionaPersonaggio(pid);
    statoRun.fase = 'in_gioco';
    // Seme fisso: nuovaRun lo prende da Date.now/performance.now, quindi stanza e nemico modello cambiavano
    // a ogni giro. Con l'orologio fermo per la sola chiamata la mappa (e il bersaglio) è sempre la stessa.
    const oraVera = Date.now, perfVera = performance.now;
    Date.now = () => 1845; performance.now = () => 0;
    try { nuovaRun(false); } finally { Date.now = oraVera; performance.now = perfVera; }
    statoRun.siparioAttivo = null;
    // La prima stanza normale che ha un bersaglio adatto (non solo la prima in assoluto: col seme fisso basta una
    // parte nuova che usa il caso per cambiarla), senza i due quadri né le botole di d5, che nascondono i nemici.
    const bozzoQui = (n) => [n.comportamento, n.patternMob, n.tipo].includes('bomba_ferma');
    const normali = statoRun.mappa.stanze.filter((x) => x.tipo === 'normale');
    const s = normali.find((x) => x.nemici.some((n) => !n.boss && !bozzoQui(n))) || normali[0];
    delete s.quadriD5; delete s.botoleD5;
    entraInStanza(s, null);
    statoRun.siparioAttivo = null; statoRun.pausa = false;
    const st = statoRun.stanzaCorrente;
    // mai il Bozzo Esplosivo come bersaglio di prova: scoppia da solo e falsa le misure di danno
    // Il ciclo decide il comportamento con `n.comportamento || n.tipo` (40-combattimento.js): un nemico col
    // comportamento del Bozzo ma un altro tipo/patternMob passava il vecchio filtro, scoppiava da solo
    // (fuseTimer → hp = 0) e il bersaglio da 900 PF finiva a 0 dopo «un colpo». Si esclude da tutti e tre.
    const bozzo = (n) => [n.comportamento, n.patternMob, n.tipo].includes('bomba_ferma');
    const modello = st.nemici.find((n) => !n.boss && !bozzo(n) && n.tipo !== 'maschera') || st.nemici.find((n) => !n.boss && !bozzo(n));
    if (conNemico && !modello) throw new Error('stanza di prova senza un bersaglio adatto (seme fisso da cambiare)');
    st.nemici = []; st.ostacoli = []; st.fragiliB7 = []; st.oggettiATerra = []; st.muroSegreto = null; st.suoloB7 = [];
    statoRun.proiettili.length = 0; statoRun.proiettiliNemici.length = 0;
    player.x = 300; player.y = 200; player.targetX = null; player.targetY = null; player.invuln = 0; player.cooldown = 0;
    player.dirX = 1; player.dirY = 0; player.flipX = false;
    statoRun.graziaIngressoC = 0; statoRun.scudoRosaC = false; statoRun.scudoStanzaD = 0;
    if (conNemico && modello) {
      const n = Object.assign({}, modello, { id: 'qa1', x: 345, y: 200, hp: 900, maxHp: 900, vx: 0, vy: 0 });
      st.nemici.push(n); st.pulita = false;
    }
    const D = I.personaggiD2.d2; D.giro = 0; D.ricarica = 0; D.carica = null; D.deviati = 0; D.rotti = 0;
    return { modello: modello && (modello.comportamento || modello.tipo), pg: statoRun.personaggioId, hp: statoRun.hpHalf, max: statoRun.maxHpHalf, nemici: st.nemici.length };
  }, { pid, conNemico });
  const tieniTasto = async (k, ms) => { await p.keyboard.down(k); await p.waitForTimeout(ms); await p.keyboard.up(k); };
  const hpNemici = () => p.evaluate(() => statoRun.stanzaCorrente.nemici.map((n) => n.hp));
  const quiete = () => p.waitForFunction(() => { const P = window.__teatro.interni.progressione; return !P || (!P.notifica && !(P.coda || []).length); }, null, { timeout: 20000 }).catch(() => {});

  // ---------------------------------------------------------------- 0. scheda del menu
  await p.evaluate(() => { const I = window.__teatro.interni; if (I.progressione && I.progressione.sbloccaTutto) I.progressione.sbloccaTutto(); else if (I.sbloccaTutto) I.sbloccaTutto(); statoRun.fase = 'menu_selezione'; statoRun.personaggioId = 'agnese'; });
  await quiete();
  await p.waitForTimeout(300);
  await p.screenshot({ path: foto('01-menu') });
  const scheda = await p.evaluate(() => ['ferruccio', 'agnese', 'taddeo', 'ombra'].map((id) => ({ id, nome: PERSONAGGI_GIOCABILI[id].nome, titolo: PERSONAGGI_GIOCABILI[id].titolo, ...schedaD2(id) })));
  ok('scheda-riga-stile', scheda.every((s) => s.stile && s.stile.length > 8), scheda);
  ok('ombra-nome-nuovo', scheda[3].nome === 'L\'Ombra Senza Fili' && !/judas|pulcinella/i.test(scheda[3].nome + scheda[3].titolo), scheda[3]);

  // I controlli girano a passi di logica contati (passoLogico chiamato N volte dentro un evaluate): niente tempi reali.
  const passi = (n, prima) => p.evaluate(({ n, prima }) => {
    if (prima) (0, eval)(prima);
    for (let i = 0; i < n; i++) { ticksCongelati = 0; passoLogico(); }
  }, { n, prima });
  const tasto = (code, giu) => p.evaluate(({ code, giu }) => window.dispatchEvent(new KeyboardEvent(giu ? 'keydown' : 'keyup', { code, key: '', bubbles: true })), { code, giu });

  // ---------------------------------------------------------------- 1. ogni personaggio: l'attacco fa danno
  for (const pid of ['ferruccio', 'agnese', 'taddeo', 'ombra']) {
    const info = await prepara(pid);
    const h0 = await hpNemici();
    await tasto('ArrowRight', true); await passi(pid === 'taddeo' ? 6 : 24); await tasto('ArrowRight', false); await passi(20);
    const h1 = await hpNemici();
    ok(`${pid}-run-e-danno`, info.pg === pid && h1[0] < h0[0], { info, h0, h1 });
  }

  // ---------------------------------------------------------------- 2. Agnese
  const proiettile = 'statoRun.proiettiliNemici.push({ x: player.x + 30, y: player.y - 6, vx: -2.2, vy: 0, dist: 0 }); window.__teatro.interni.personaggiD2.d2.ricarica = 0; player.invuln = 0;';
  await prepara('agnese', false);
  // tastiera: evento come quelli veri, nello stesso passo in cui arriva il colpo (i tempi veri non contano)
  await passi(16, proiettile + "window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft', key: '', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft', key: '', bubbles: true }));");
  const dv = await p.evaluate(() => ({ deviati: window.__teatro.interni.personaggiD2.d2.deviati, hp: statoRun.hpHalf, max: statoRun.maxHpHalf, rimandati: statoRun.proiettili.filter((q) => q.deviatoD2).length }));
  ok('agnese-devia-tastiera', dv.deviati >= 1 && dv.hp === dv.max && dv.rimandati >= 1, dv);
  // senza mossa lo stesso colpo la ferisce
  await prepara('agnese', false);
  await passi(30, proiettile);
  const senza = await p.evaluate(() => statoRun.hpHalf < statoRun.maxHpHalf);
  ok('agnese-senza-mossa-ferita', senza);
  // foto durante il giro con colpi in arrivo
  await prepara('agnese', false);
  await passi(8, 'for (let i = 0; i < 6; i++) { const a = i * 1.05; statoRun.proiettiliNemici.push({ x: player.x + Math.cos(a) * 44, y: player.y - 6 + Math.sin(a) * 44, vx: -Math.cos(a) * 1.5, vy: -Math.sin(a) * 1.5, dist: 0 }); }');
  await passi(5, 'window.__teatro.interni.personaggiD2.mossa()');
  await p.screenshot({ path: foto('02-agnese-piroetta') });
  // gamepad: RT (b3 legge il pad nel suo ciclo: qui servono tempi veri, si controlla solo che il giro parta)
  await prepara('agnese', false);
  await p.evaluate(() => { window.__padAcceso = true; });
  await p.waitForTimeout(200);
  await p.evaluate(() => { window.__pad.buttons[7].pressed = true; window.__pad.buttons[7].value = 1; });
  await p.waitForTimeout(150);
  await p.evaluate(() => { window.__pad.buttons[7].pressed = false; window.__pad.buttons[7].value = 0; });
  await p.waitForTimeout(100);
  const rt = await p.evaluate(() => window.__teatro.interni.personaggiD2.d2.ricarica);
  ok('agnese-mossa-gamepad-RT', rt > 0, { ricarica: rt });
  await p.evaluate(() => { window.__padAcceso = false; });
  await p.mouse.move(640, 360);
  // fossa: senza piroetta si ferma, con la piroetta passa
  const fossa = async (conMossa) => {
    await prepara('agnese', false);
    await passi(1, "statoRun.stanzaCorrente.ostacoli.push({ tipo: 'fossa', x: 360, y: 200, r: 16, w: 34, h: 22 }); player.x = 333; keys.KeyD = true;");
    if (conMossa) await passi(1, 'window.__teatro.interni.personaggiD2.mossa()');
    await passi(20);
    return p.evaluate(() => { keys.KeyD = false; return player.x; });
  };
  const xSenza = await fossa(false);
  const xCon = await fossa(true);
  ok('agnese-fossa-ferma-senza-mossa', xSenza < 340, { xSenza });
  ok('agnese-supera-fossa', xCon > 386, { xCon });

  // ---------------------------------------------------------------- 3. Taddeo
  await prepara('taddeo', false);
  await passi(1, "const st = statoRun.stanzaCorrente; const o = { tipo: 'colonna', variante: 'vaso', x: 335, y: 195, r: 11, w: 22, h: 22, fragileB7: { genere: 'comune', colpi: 3, esplode: false } }; st.ostacoli.push(o); st.fragiliB7 = [o];");
  await passi(4, 'keys.ArrowRight = true;');
  await passi(2, 'keys.ArrowRight = false;');
  // il ciclo vero recupera i tick spesi qui: per la foto l'arco riparte da «2 tick fa»
  await p.evaluate(() => { const D = window.__teatro.interni.personaggiD2.d2; if (D.arco) D.arco.t0 = tick - 1; for (const L of D.lampi) L.t = tick - 1; });
  await p.screenshot({ path: foto('03-taddeo-maglio') });
  await passi(10);
  const dopoVaso = await p.evaluate(() => ({ ostacoli: statoRun.stanzaCorrente.ostacoli.length, proiettili: statoRun.proiettili.length, rotti: window.__teatro.interni.personaggiD2.d2.rotti }));
  ok('taddeo-rompe-vaso', dopoVaso.ostacoli === 0 && dopoVaso.rotti === 1, dopoVaso);
  ok('taddeo-non-spara', dopoVaso.proiettili === 0, dopoVaso);
  // carica: tenuto fino al pieno fa più danno di un tocco
  await prepara('taddeo');
  await passi(3, 'keys.ArrowRight = true;'); await passi(60, 'keys.ArrowRight = false;');
  const hT = await hpNemici();
  await passi(45, 'player.cooldown = 0; keys.ArrowRight = true;'); await passi(5, 'keys.ArrowRight = false;');
  const hC = await hpNemici();
  const tocco = 900 - hT[0], carico = hT[0] - hC[0];
  ok('taddeo-carica-piu-danno', tocco > 0 && carico > tocco * 1.5, { tocco, carico });
  // contraccolpo
  const spinta = async (pid) => {
    await prepara(pid, false);
    await passi(15, "player.invuln = 0; statoRun.hpHalf = statoRun.maxHpHalf; subisciColpoGiocatore(1, 'la QA', player.x + 8, player.y);");
    return p.evaluate(() => Math.abs(player.x - 300) + Math.abs(player.y - 200));
  };
  const sF = await spinta('ferruccio');
  const sT = await spinta('taddeo');
  ok('taddeo-non-spinto', sT < 0.5 && sF > 2, { ferruccio: sF, taddeo: sT });

  // ---------------------------------------------------------------- 4. Ombra
  const om = await prepara('ombra', false);
  ok('ombra-mezza-maschera', om.hp === 1 && om.max === 1, om);
  const m0 = await p.evaluate(() => statoRun.monete);
  await passi(3, "statoRun.stanzaCorrente.oggettiATerra.push({ tipo: 'cura', valore: 2, x: player.x + 4, y: player.y });");
  const conv1 = await p.evaluate(() => ({ monete: statoRun.monete, hp: statoRun.hpHalf, cure: statoRun.stanzaCorrente.oggettiATerra.filter((k) => k.tipo === 'cura').length }));
  ok('ombra-maschera-in-monete', conv1.monete > m0 && conv1.cure === 0 && conv1.hp === 1, { prima: m0, ...conv1 });
  await passi(1, "statoRun.stanzaCorrente.ostacoli.push({ tipo: 'colonna', x: 345, y: 200, r: 14, w: 26, h: 26 }); player.x = 315; keys.KeyD = true;");
  await passi(40);
  const xO = await p.evaluate(() => { keys.KeyD = false; return player.x; });
  ok('ombra-vola-sopra-colonna', xO > 372, { xO });
  await prepara('ombra');
  await passi(1, "const st = statoRun.stanzaCorrente; st.ostacoli.push({ tipo: 'colonna', x: 325, y: 194, r: 12, w: 24, h: 24 }); st.nemici.push(Object.assign({}, st.nemici[0], { id: 'qa2', x: 400, hp: 900, maxHp: 900 })); keys.ArrowRight = true;");
  await passi(8);
  await p.screenshot({ path: foto('04-ombra-spettrali') });
  await passi(30, 'keys.ArrowRight = false;');
  const hO = await hpNemici();
  ok('ombra-colpo-attraversa', hO[0] < 900 && hO[1] < 900, { hO });
  await prepara('ombra', false);
  await passi(5, "player.invuln = 0; subisciColpoGiocatore(1, 'la QA', player.x + 8, player.y);");
  const morta = await p.evaluate(() => ({ hp: statoRun.hpHalf, fase: statoRun.fase }));
  ok('ombra-muore-con-un-colpo', morta.hp === 0 || morta.fase !== 'in_gioco', morta);

  // ---------------------------------------------------------------- 5. tocco: bottone MOSSA solo con Agnese
  const ctxT = await browser.newContext({ viewport: { width: 915, height: 412 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const t = await ctxT.newPage();
  t.on('pageerror', (e) => errori.push('tocco: ' + String(e)));
  await t.goto('file://' + file);
  await t.waitForTimeout(600);
  await t.touchscreen.tap(450, 200);
  await t.waitForTimeout(300);
  const vistaMossa = async (pid) => {
    await t.evaluate((pid) => {
      const I = window.__teatro.interni; if (I.progressione && I.progressione.sbloccaTutto) I.progressione.sbloccaTutto(); else if (I.sbloccaTutto) I.sbloccaTutto();
      selezionaPersonaggio(pid); statoRun.fase = 'in_gioco'; nuovaRun(false); statoRun.siparioAttivo = null;
      const s = statoRun.mappa.stanze.find((x) => x.tipo === 'normale'); entraInStanza(s, null); statoRun.siparioAttivo = null;
      statoRun.stanzaCorrente.nemici = []; window.__teatro.interni.personaggiD2.d2.ricarica = 0;
    }, pid);
    await t.waitForTimeout(400);
    return t.evaluate(() => { const b = document.querySelector('.c2-mossa'); if (!b) return { c: false }; const r = b.getBoundingClientRect(); return { c: true, vis: !b.hidden && r.width > 10, x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  };
  const vA = await vistaMossa('agnese');
  const vF = await vistaMossa('ferruccio');
  ok('tocco-mossa-solo-agnese', vA.vis && !vF.vis, { vA, vF });
  await vistaMossa('agnese');
  await t.screenshot({ path: foto('05-tocco-mossa') });
  if (vA.vis) {
    await t.touchscreen.tap(vA.x, vA.y);
    await t.waitForTimeout(150);
    const giro = await t.evaluate(() => window.__teatro.interni.personaggiD2.d2.ricarica);
    ok('tocco-mossa-parte', giro > 0, { ricarica: giro });
  }
  const erroriTeatro = await p.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO.length : -1));
  const erroriT = await t.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO.map(String) : []));
  ok('nessun-errore', erroriTeatro === 0 && erroriT.length === 0 && errori.length === 0, { erroriTeatro, erroriT, errori });
  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ totale: esiti.length, falliti: falliti.length, esiti }, null, 1));
  process.exit(falliti.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
