#!/usr/bin/env node
/*
 * tools/qa-teatro-partenza-segreta.js — verifica Playwright della partenza segreta di Piazza Dante
 * (gioco/teatro/c1-partenza-segreta.js): bomba al lampione, domanda di Tonino, verità e bugia, scena dei fili,
 * fagotto (arma + 10 potenziamenti con tastiera, mouse e gamepad finto), consegna a inizio run, Registro di a7,
 * Diario di b8, notte dopo, Medaglione di Rosa, nessun indizio nelle scritte dell'hub.
 *
 * Uso: node tools/qa-teatro-partenza-segreta.js <file html> [prefisso screenshot]
 * Un prefisso assoluto (es. una cartella della scratchpad) scrive lì: <prefisso>-NN-nome.png; altrimenti in
 * production/qa/evidence/teatro-partenza-segreta-[<prefisso>-]NN-nome.png. Esce con 1 se un controllo fallisce.
 * Chromium preinstallato nella sessione: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const arg = process.argv[3] || '';
const foto = (n) => (path.isAbsolute(arg) ? `${arg}-${n}.png`
  : path.join(RADICE, 'production', 'qa', 'evidence', `teatro-partenza-segreta-${arg ? arg + '-' : ''}${n}.png`));

/** Parole che non devono comparire in nessuna scritta dell'hub finché il lampione è acceso. */
const INDIZI = /lampion|bomb|fagott|segret|bugia|busc[iì]a|vetro|micc|svegli|\[E\]|fili\b/i;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (nome, cond, det) => { esiti.push({ nome, ok: Boolean(cond), ...(cond ? {} : { det }) }); if (!cond) console.log('  ✗', nome, JSON.stringify(det)); };
  const tela = p.locator('#c');
  const scatta = (n) => tela.screenshot({ path: foto(n) });

  // spia delle scritte disegnate sul canvas (per il controllo «nessun indizio») e gamepad finto (come qa-teatro-comandi)
  await p.addInitScript(() => {
    window.__testi = null;
    for (const nome of ['fillText', 'strokeText']) {
      const base = CanvasRenderingContext2D.prototype[nome];
      CanvasRenderingContext2D.prototype[nome] = function (t, ...r) { if (window.__testi) window.__testi.add(String(t)); return base.call(this, t, ...r); };
    }
    window.__padAcceso = false;
    window.__pad = { id: 'Pad finto (QA)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => (window.__padAcceso ? [window.__pad, null, null, null] : [null, null, null, null]) });
  });

  const S = () => p.evaluate(() => window.__teatro.interni.partenzaSegretaC1.stato);
  const fase = () => p.evaluate(() => window.__teatro.fase);
  const dialogo = () => p.evaluate(() => window.__teatro.t4qa.dialogo);
  const run = () => p.evaluate(() => {
    const R = window.__teatro.interni.statoRun;
    return { fase: R.fase, bombe: R.bombe, notte: R.numeroNotte, oggetti: R.oggettiEquipaggiati.map((o) => o.id), spada: R.haSpada, pannello: Boolean(R.pannelloB),
      px: window.__teatro.interni.player.x, py: window.__teatro.interni.player.y, banner: R.banner };
  });
  const metti = (x, y) => p.evaluate(([x, y]) => { const P = window.__teatro.interni.player; P.x = x; P.y = y; P.targetX = null; P.targetY = null; }, [x, y]);
  const testiHub = async (ms = 350) => {
    await p.evaluate(() => { window.__testi = new Set(); });
    await p.waitForTimeout(ms);
    return p.evaluate(() => { const t = [...window.__testi]; window.__testi = null; return t; });
  };
  /** Chiude pergamena di a7, cartigli di b8 e dialoghi di T4 finché la piazza è libera. */
  const libera = async () => {
    for (let i = 0; i < 60; i++) {
      const s = await p.evaluate(() => {
        /* global a7, b8 */
        return { perg: typeof a7 === 'object' && Boolean(a7.pergamena), d: window.__teatro.t4qa.dialogo, cart: typeof b8 === 'object' && Boolean(b8.cart) };
      });
      if (!s.perg && !s.d && !s.cart) { await p.waitForTimeout(120); if (!(await dialogo())) return; }
      await p.keyboard.press(s.d && s.d.scelta ? 'Digit1' : 'Space');
      await p.waitForTimeout(90);
    }
  };
  /** Legge un cartiglio fino alla scelta (o alla fine): rende le battute lette e le etichette della scelta. */
  const leggi = async () => {
    const battute = [];
    for (let i = 0; i < 30; i++) {
      const d = await dialogo();
      if (!d) return { battute, scelta: null };
      if (d.scelta) return { battute, scelta: d.scelta };
      battute.push(d.testo);
      await p.keyboard.press('Space');
      await p.waitForTimeout(70);
    }
    return { battute, scelta: null };
  };
  const daTonino = async () => { const s = await S(); await metti(s.tonino.x + 26, s.tonino.y + 4); await p.waitForTimeout(120); };
  const parla = async () => { await daTonino(); await p.keyboard.press('KeyE'); await p.waitForTimeout(160); };
  const alLampione = async () => { const s = await S(); await metti(s.lampione.x + 16, s.lampione.y + 26); await p.waitForTimeout(120); return s.lampione; };
  const spegni = async () => { await alLampione(); await p.keyboard.press('KeyE'); await p.waitForTimeout(1900); };
  const parti = async () => {
    const g = await p.evaluate(() => window.__teatro.t4qa.ingresso);
    await metti(g.x - 40, g.y);
    await p.keyboard.down('KeyD');
    for (let i = 0; i < 30 && (await fase()) !== 'in_gioco'; i++) await p.waitForTimeout(100);
    await p.keyboard.up('KeyD');
    await p.waitForTimeout(250);
  };
  const muori = async () => {
    for (let i = 0; i < 40 && (await fase()) === 'in_gioco'; i++) {
      await p.evaluate(() => {
        const I = window.__teatro.interni, R = I.statoRun;
        R.siparioAttivo = null; R.graziaIngressoC = 0; I.player.invuln = 0; R.hpHalf = 1; R.scudoRosaC = false; R.scudoStanzaD = 0; R.viteExtra = 0;
        R.proiettiliNemici.push({ x: I.player.x, y: I.player.y - 6, vx: 0.01, vy: 0, dist: 0 });
      });
      await p.waitForTimeout(200);
    }
    for (let i = 0; i < 100 && (await fase()) !== 'hub'; i++) await p.waitForTimeout(100);
    await p.waitForTimeout(700);
  };
  const clicca = async (r, volte = 1) => {
    const b = await tela.boundingBox();
    for (let i = 0; i < volte; i++) { await p.mouse.click(b.x + ((r.x + r.w / 2) * b.width) / 640, b.y + ((r.y + r.h / 2) * b.height) / 360); await p.waitForTimeout(70); }
  };
  const pad = async (i, ms = 80) => {
    await p.evaluate((i) => { const b = window.__pad.buttons[i]; b.pressed = true; b.value = 1; }, i);
    await p.waitForTimeout(ms);
    await p.evaluate((i) => { const b = window.__pad.buttons[i]; b.pressed = false; b.value = 0; }, i);
    await p.waitForTimeout(90);
  };

  // ------------------------------------------------------------------ avvio: menu → piazza, notte 1
  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await p.keyboard.press('Space');
  await p.waitForTimeout(400);
  await libera();
  const T = await p.evaluate(() => JSON.parse(JSON.stringify(window.__teatro.interni.TESTI_C1, (k, v) => (typeof v === 'function' ? undefined : v))));
  const dieci = await p.evaluate(() => window.__teatro.interni.PARTENZA_C1.armeria.doni);
  ok('piazza', (await fase()) === 'hub' && (await S()).stato === 'acceso', await S());

  // 1. nessun indizio col lampione acceso (lontano e accanto al lampione)
  const lontano = await testiHub();
  const lamp = await alLampione();
  const vicino = await testiHub();
  ok('hub-senza-indizi', lontano.length > 0 && !lontano.concat(vicino).some((t) => INDIZI.test(t)), { lontano, vicino });
  ok('nessuna-etichetta-al-lampione', !vicino.some((t) => /Premi|\bE\b/.test(t) && !lontano.includes(t)), vicino.filter((t) => !lontano.includes(t)));

  // 2. E lontano dal lampione non fa nulla; Spazio e Invio accanto al lampione nemmeno
  await metti(lamp.x, lamp.y + 63);
  const prima = await run();
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(200);
  const dopoE = await S();
  ok('E-lontano-niente', dopoE.stato === 'acceso' && !dopoE.bomba && !(await dialogo()) && (await run()).banner === prima.banner, dopoE);
  await alLampione();
  await p.keyboard.press('Space'); await p.keyboard.press('Enter');
  await p.waitForTimeout(150);
  ok('altri-tasti-niente', (await S()).stato === 'acceso' && !(await S()).bomba, await S());

  // 3. E accanto al lampione: una bomba sola, miccia, scoppio, luce spenta
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(250);
  const miccia = await S();
  ok('bomba-posata', miccia.stato === 'miccia' && miccia.bomba && miccia.bomba.miccia > 0 && !miccia.lampioneSpento, miccia);
  await scatta('01-miccia');
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(100);
  ok('una-sola-bomba', (await S()).stato === 'miccia', await S());
  await metti(lamp.x + 60, lamp.y + 70);
  await p.waitForTimeout(1700);
  const spento = await S();
  ok('lampione-spento', spento.stato === 'spento' && spento.lampioneSpento && !spento.bomba, spento);
  await p.waitForTimeout(900);
  await scatta('02-lampione-spento');
  await alLampione();
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(150);
  ok('niente-seconda-bomba', (await S()).stato === 'spento' && !(await S()).bomba, await S());

  // 4. Tonino: prima la scena della storia non ancora vista (primo incontro), poi la domanda
  await parla();
  const primo = await leggi();
  ok('prima-la-storia', primo.battute[0] === "Uagliò, ma che è 'sta faccia?" && !primo.scelta, primo);
  await parla();
  const domanda = await leggi();
  ok('tonino-chiede', JSON.stringify(domanda.battute) === JSON.stringify(T.domanda.map((r) => r[1]))
    && JSON.stringify(domanda.scelta) === JSON.stringify(T.risposte.map((r) => r.etichetta)), domanda);
  await scatta('03-domanda');

  // 5. la verità: due battute e niente di più; non richiede; la run parte con una bomba in meno
  await p.keyboard.press('Digit1');
  await p.waitForTimeout(150);
  const verita = await leggi();
  const dopoSi = await S();
  ok('verita-niente', JSON.stringify(verita.battute) === JSON.stringify(T.verita.map((r) => r[1])) && dopoSi.stato === 'verita' && !dopoSi.aperta && !dopoSi.fagotto
    && !(await run()).pannello && !(await p.evaluate(() => window.__teatro.interni.partenzaSegretaC1.scoperta().scoperto)), { verita, dopoSi });
  await libera();
  await parla();
  const solite = await leggi();
  ok('non-richiede', solite.battute.length > 0 && !solite.scelta && !T.domanda.some((r) => solite.battute.includes(r[1])) && (await S()).lampioneSpento, solite);
  await libera();
  const inizioBombe = await p.evaluate(() => window.__teatro.interni.BOMBE_CHIAVI_A1.inizio.bombe);
  await parti();
  const run1 = await run();
  const a7run1 = await p.evaluate(() => window.__teatro.interni.runInCorsoA7());
  ok('run-con-una-bomba-in-meno', run1.fase === 'in_gioco' && run1.bombe === inizioBombe - 1 && run1.oggetti.length === 0 && !(a7run1 && a7run1.partenzaSegreta), { run1, inizioBombe });

  // 6. la notte dopo: lampione acceso, Tonino quello di sempre, e il segreto si può rifare
  await muori();
  await libera();
  const notte2 = await S();
  ok('notte-dopo-acceso', (await fase()) === 'hub' && notte2.stato === 'acceso' && !notte2.lampioneSpento && notte2.notte === 2, notte2);
  await parla();
  const solite2 = await leggi();
  ok('tonino-normale-la-notte-dopo', solite2.battute.length > 0 && !solite2.scelta && !T.domanda.some((r) => solite2.battute.includes(r[1])), solite2);
  await libera();
  await spegni();
  ok('si-rifa-ogni-notte', (await S()).stato === 'spento', await S());

  // 7. la bugia: battute, piazza ferma, fili che compaiono, si tendono e si spezzano, il ricordo
  await parla();
  const domanda2 = await leggi();
  await p.keyboard.press('Digit2');
  await p.waitForTimeout(150);
  const bugia = await leggi();
  await p.waitForTimeout(150);
  const s0 = await S();
  ok('bugia-avvia-la-scena', JSON.stringify(bugia.battute) === JSON.stringify(T.bugia.map((r) => r[1])) && domanda2.scelta && s0.stato === 'risveglio' && s0.scena && s0.fermo, { bugia, s0 });
  ok('scoperto-nello-slot', await p.evaluate(() => window.__teatroT3.salvataggi.leggiFlag('partenzaSegretaC1').scoperto === true), null);
  const fermoPrima = await run();
  await p.keyboard.down('KeyD'); await p.waitForTimeout(250); await p.keyboard.up('KeyD');
  await p.keyboard.press('KeyE');
  const fermoDopo = await run();
  ok('piazza-ferma-durante-la-scena', fermoDopo.px === fermoPrima.px && fermoDopo.py === fermoPrima.py && !(await dialogo()), { fermoPrima, fermoDopo });
  const aspetta = async (cond, ms = 6000) => { for (let i = 0; i < ms / 25; i++) { const s = await S(); if (cond(s)) return s; await p.waitForTimeout(25); } return S(); };
  const ferma = (v) => p.evaluate((v) => window.__teatro.interni.partenzaSegretaC1.ferma(v), v);
  let s = await aspetta((x) => x.scena && x.scena.fase === 'tensione' && x.scena.t >= 34);
  await ferma(true);
  ok('fili-visibili-e-tesi', s.scena && s.scena.fase === 'tensione' && s.fili && s.fili.length === 2 && !s.fili[0].rotto && s.maniAlfa > 0.2, s);
  await scatta('04-fili-tesi');
  await ferma(false);
  s = await aspetta((x) => x.scena && x.scena.fase === 'strappo' && x.scena.t >= 20);
  await ferma(true);
  ok('fili-spezzati', s.fili && s.fili[0].rotto && s.fili[1].rotto, s);
  await scatta('05-fili-spezzati');
  await ferma(false);
  s = await aspetta((x) => x.scena && x.scena.fase === 'barcolla' && x.scena.t >= 58);
  await ferma(true);
  await scatta('06-testa-alle-mani');
  await ferma(false);
  await aspetta((x) => !x.scena && x.risveglio === 'ricordo');
  await p.waitForTimeout(150);
  await scatta('07-ricordo');
  const ricordo = await leggi();
  ok('ricordo', JSON.stringify(ricordo.battute) === JSON.stringify(T.ricordo.concat(T.fagotto).map((r) => r[1])), ricordo);

  // 8. il fagotto: prima l'arma
  s = await aspetta((x) => x.aperta, 4000);
  const contesto = await p.evaluate(() => window.__teatro.interni.comandiB3.stato.contesto);
  ok('fagotto-aperto', s.aperta && s.stato === 'fagotto' && s.armeria.passo === 'arma' && contesto === 'pannello', { s, contesto });
  const attese = ['di-sempre', 'spada', 'piedigrotta', 'bombarda', 'patto_raggio', 'patto_coltello'];
  ok('armi-vere', attese.every((id) => s.armeria.armi.includes(id)) && s.armeria.armi[0] === 'di-sempre', s.armeria.armi);
  ok('potenziamenti-senza-patti', s.armeria.doni >= 150 && await p.evaluate(() => {
    const I = window.__teatro.interni, l = I.partenzaSegretaC1.listaDoni();
    const patti = new Set(I.CATALOGO_PATTO.concat(I.CATALOGO_SEGRETO).map((o) => o.id));
    const primoNeg = l.findIndex((o) => o.negativo);
    return !l.some((o) => patti.has(o.id)) && primoNeg > 0 && l.slice(primoNeg).every((o) => o.negativo) && new Set(l.map((o) => o.id)).size === l.length;
  }), s.armeria.doni);
  const iSpada = s.armeria.armi.indexOf('spada');
  for (let i = 0; i < iSpada; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(40); }
  await p.waitForTimeout(120);
  await scatta('08-fagotto-arma');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(120);
  s = await S();
  ok('arma-scelta', s.armeria.passo === 'doni' && s.armeria.arma === 'spada' && s.aperta, s.armeria);

  // 9. i potenziamenti: 9 non bastano, 11 non entrano, si tolgono e si rimettono (tastiera, mouse, gamepad)
  for (let i = 0; i < dieci - 1; i++) { await p.keyboard.press('Enter'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(40); }
  s = await S();
  ok('nove-scelti', s.armeria.scelti.length === dieci - 1, s.armeria);
  for (let i = 0; i < 8 && !(await S()).armeria.barra; i++) { await p.keyboard.press('ArrowDown'); await p.waitForTimeout(40); }
  await p.keyboard.press('Enter');
  await p.waitForTimeout(120);
  s = await S();
  ok('nove-non-si-conferma', s.aperta && s.stato === 'fagotto' && !s.fagotto && s.armeria.barra && Boolean(s.armeria.avviso), s.armeria);
  await p.keyboard.press('ArrowUp');
  await p.keyboard.press('Enter'); // il decimo (il cursore era rimasto sulla cella dopo l'ultima scelta)
  await p.waitForTimeout(80);
  s = await S();
  ok('dieci-scelti', s.armeria.scelti.length === dieci && !s.armeria.barra, s.armeria);
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('Enter'); // l'undicesimo non entra
  await p.waitForTimeout(80);
  s = await S();
  ok('undici-no', s.armeria.scelti.length === dieci && Boolean(s.armeria.avviso), s.armeria);
  // mouse: tre posti si svuotano, poi tre oggetti dello stesso tema (per la trasformazione di b4) con due click l'uno
  for (const k of [dieci - 1, dieci - 2, dieci - 3]) await clicca(await p.evaluate((k) => window.__teatro.interni.partenzaSegretaC1.posto(k), k));
  s = await S();
  ok('mouse-toglie', s.armeria.scelti.length === dieci - 3, s.armeria);
  const tema = await p.evaluate((gia) => {
    const I = window.__teatro.interni, l = I.partenzaSegretaC1.listaDoni();
    for (const t of ['cibo', 'fili', 'denari', 'sacro', 'fuoco', 'bestia', 'maschera']) {
      const con = l.map((o, i) => ({ i, id: o.id, neg: o.negativo, temi: I.temiDi(I.trovaOggettoB(o.id)) })).filter((o) => !o.neg && o.temi.includes(t));
      const gias = con.filter((o) => gia.includes(o.id)).length;
      const nuovi = con.filter((o) => !gia.includes(o.id)).slice(0, 3);
      if (nuovi.length === 3) return { tema: t, nuovi, gias };
    }
    return null;
  }, s.armeria.scelti);
  const perPag = await p.evaluate(() => perPaginaPannelloB5());
  for (const o of tema.nuovi) {
    for (let i = 0; i < 6 && Math.floor((await S()).armeria.sel / perPag) !== Math.floor(o.i / perPag); i++) { await p.keyboard.press('PageDown'); await p.waitForTimeout(50); }
    const r = await p.evaluate((i) => window.__teatro.interni.partenzaSegretaC1.cella(i), o.i);
    await clicca(r, (await S()).armeria.sel === o.i ? 1 : 2);
  }
  s = await S();
  ok('mouse-mette', s.armeria.scelti.length === dieci && tema.nuovi.every((o) => s.armeria.scelti.includes(o.id)), { scelti: s.armeria.scelti, tema });
  // gamepad finto: croce a destra, A toglie e rimette, B torna all'arma, A la riprende
  await p.evaluate(() => { window.__padAcceso = true; });
  await p.waitForTimeout(150);
  const selPad = (await S()).armeria.sel;
  await pad(14); // croce a sinistra
  const selPad2 = (await S()).armeria.sel;
  await pad(15); // croce a destra: di nuovo sull'ultimo scelto
  await pad(0);  // A: lo toglie
  const tolto = (await S()).armeria.scelti.length;
  await pad(0);  // A: lo rimette
  const rimesso = (await S()).armeria.scelti.length;
  await pad(1);  // B: torna all'arma
  const passoB = (await S()).armeria.passo;
  await pad(0);  // A: riprende la stessa arma
  s = await S();
  await p.evaluate(() => { window.__padAcceso = false; });
  await p.keyboard.press('ShiftLeft'); // l'ultimo dispositivo torna la tastiera (scritte dei comandi)
  await p.waitForTimeout(120);
  ok('gamepad', selPad2 !== selPad && tolto === dieci - 1 && rimesso === dieci && passoB === 'arma' && s.armeria.passo === 'doni' && s.armeria.arma === 'spada' && s.armeria.scelti.length === dieci,
    { selPad, selPad2, tolto, rimesso, passoB, armeria: s.armeria });
  const scelti = s.armeria.scelti.slice();
  await scatta('09-fagotto-dieci');
  await clicca(await p.evaluate(() => window.__teatro.interni.partenzaSegretaC1.conferma()));
  await p.waitForTimeout(200);
  s = await S();
  const congedo = await leggi();
  ok('conferma', !s.aperta && s.stato === 'sveglio' && s.fagotto && s.fagotto.arma === 'spada' && s.fagotto.doni.length === dieci
    && JSON.stringify(congedo.battute) === JSON.stringify(T.congedo.map((r) => r[1])), { s, congedo });

  // 10. Tonino sveglio per quella notte
  await libera();
  const sveglio = [];
  for (let i = 0; i < 3; i++) { await parla(); sveglio.push(...(await leggi()).battute); await libera(); }
  ok('tonino-sveglio', JSON.stringify(sveglio) === JSON.stringify(T.sveglio.map((r) => r[1])), sveglio);
  await daTonino();
  await p.waitForTimeout(200);
  await scatta('10-tonino-sveglio');

  // 11. la run comincia con l'arma e i dieci potenziamenti addosso; il Registro la segna
  await parti();
  const run2 = await run();
  const dopo = await p.evaluate((ids) => {
    const I = window.__teatro.interni;
    return { a7: I.runInCorsoA7(), tr: I.statoTrasformazioni(), noti: ids.filter((id) => I.conosciutiD().includes(id)).length,
      pool: ids.filter((id) => I.statoRun.poolRunB.rimasti.includes(id)).length };
  }, scelti);
  ok('run-armata', run2.fase === 'in_gioco' && run2.oggetti.length === dieci + 1 && scelti.every((id) => run2.oggetti.includes(id)) && run2.oggetti.includes('spada') && run2.spada
    && run2.bombe === inizioBombe - 1, run2);
  ok('oggetti-veri', dopo.noti === dieci && dopo.pool === 0 && dopo.a7.oggetti.length === dieci + 1, { noti: dopo.noti, pool: dopo.pool, a7: dopo.a7.oggetti.length });
  ok('trasformazione', dopo.tr.attive.includes(tema.tema), { tema: tema.tema, attive: dopo.tr.attive, conteggi: dopo.tr.conteggi });
  ok('registro-in-corso', dopo.a7.partenzaSegreta === true, dopo.a7.partenzaSegreta);
  await p.keyboard.press('Space'); // alza il sipario
  await p.waitForTimeout(1600);
  await scatta('11-ingresso-armato');

  // 12. fine run: pergamena con la riga, Registro e Diario; la notte dopo tutto da capo
  await muori();
  const perg = await p.evaluate(() => (typeof a7 === 'object' && a7.pergamena ? { tipo: a7.pergamena.tipo, segreta: a7.pergamena.voce.partenzaSegreta === true } : null));
  const testiPerg = await testiHub(250);
  ok('pergamena', perg && perg.segreta && testiPerg.includes(T.pergamena[1]), { perg });
  await scatta('12-pergamena');
  await libera();
  const fine = await p.evaluate(() => {
    const I = window.__teatro.interni;
    return { reg: I.registroRun().map((v) => [v.notte, v.partenzaSegreta === true]), pagine: I.finaliB8.pagine().map((x) => ({ notte: x.notte, righe: x.righe })) };
  });
  ok('registro', JSON.stringify(fine.reg) === JSON.stringify([[1, false], [2, true]]), fine.reg);
  const pag1 = fine.pagine.find((x) => x.notte === 1), pag2 = fine.pagine.find((x) => x.notte === 2);
  ok('diario', pag2 && pag2.righe.some((r) => T.diario.includes(r)) && pag1 && !pag1.righe.some((r) => T.diario.includes(r)), fine.pagine);
  const notte3 = await S();
  ok('notte-dopo-da-capo', notte3.stato === 'acceso' && !notte3.lampioneSpento && !notte3.fili && !notte3.fagotto && notte3.notte === 3, notte3);
  const testi3 = await testiHub();
  ok('ancora-nessun-indizio', !testi3.some((t) => INDIZI.test(t)), testi3);
  await parla();
  const solite3 = await leggi();
  ok('tonino-non-ricorda', solite3.battute.length > 0 && !solite3.scelta && !T.sveglio.concat(T.domanda).some((r) => solite3.battute.includes(r[1])), solite3);
  await libera();
  await scatta('13-notte-dopo');

  // 13. col Medaglione di Rosa in mano la scelta del ricordo viene prima della domanda del lampione
  await p.evaluate(() => window.__teatro.t4qa.impostaFlag({ medaglione_in_mano: true }));
  await spegni();
  await parla();
  const med = await leggi();
  ok('medaglione-prima', med.scelta && med.scelta[0] === 'Restituisci il ricordo di Rosa', med);
  await p.keyboard.press('Digit1');
  await p.waitForTimeout(120);
  await leggi();
  await libera();
  ok('medaglione-deciso', await p.evaluate(() => window.__teatro.t4qa.flag.tonino_ricordo === 'restituito' && !window.__teatro.t4qa.flag.medaglione_in_mano), null);
  await parla();
  const domanda3 = await leggi();
  ok('poi-la-domanda', JSON.stringify(domanda3.scelta) === JSON.stringify(T.risposte.map((r) => r.etichetta)), domanda3);
  await p.keyboard.press('Digit1');
  await p.waitForTimeout(120);
  await libera();

  // 14. la partenza normale dal passaggio resta quella di sempre
  await parti();
  ok('partenza-normale', (await fase()) === 'in_gioco' && (await run()).oggetti.length === 0, await run());

  ok('nessun-errore', errori.length === 0, errori);
  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ controlli: esiti.length, passati: esiti.length - falliti.length, falliti: falliti.map((e) => e.nome), errori }, null, 1));
  await browser.close();
  process.exit(falliti.length ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
