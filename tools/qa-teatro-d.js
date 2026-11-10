#!/usr/bin/env node
/*
 * tools/qa-teatro-d.js — verifica Playwright del feedback autore D (catalogo esteso degli oggetti) sul Teatro.
 * Uso: node tools/qa-teatro-d.js [file html]
 * Osserva: errori di console; catalogo e negativi; le 5 meccaniche minime (scudoStanza, omingForza, rimbalzi,
 * orbitali, famiglio tiratore) e le altre; effetti nascosti e conosciuti nello slot (anche dopo il reload);
 * cartiglio; Diario dal menu ESC; Stanza dello Sviluppatore. Screenshot production/qa/evidence/teatro-d-*.png.
 * Stampa osservazioni in JSON, nessun verdetto. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const foto = (n) => path.join(RADICE, 'production', 'qa', 'evidence', `teatro-d-${n}.png`);

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const oss = {};
  const avvia = async () => {
    await p.evaluate(() => {
      const I = window.__teatro.interni;
      I.statoRun.fase = 'in_gioco';
      I.nuovaRun(false);
      I.statoRun.siparioAttivo = null;
    });
    await p.waitForTimeout(150);
  };
  // stanza di prova: un nemico fermo, nessun proiettile
  const stanzaProva = () => p.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.stanzaCorrente;
    st.nemici = [];
    I.statoRun.proiettili = []; I.statoRun.proiettiliNemici = [];
    I.statoRun.graziaIngressoC = 0; I.player.invuln = 0;
  });
  const dai = (ids) => p.evaluate((ids) => {
    const I = window.__teatro.interni;
    I.statoRun.oggettiEquipaggiati = [];
    for (const id of ids) I.acquisisciOggetto({ ...I.trovaOggettoB(id) }, 'sviluppatore', null);
    I.ricalcolaStatistiche();
  }, ids);

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await avvia();

  oss.catalogo = await p.evaluate(() => {
    const C = window.__teatro.interni.CATALOGO_OGGETTI;
    return { totale: C.length, negativi: C.filter((o) => o.polarita === 'negativo').length,
      misti: C.filter((o) => o.polarita === 'misto').length, nomiConParentesi: C.filter((o) => /\(/.test(o.nome)).map((o) => o.nome),
      senzaSprite: C.filter((o) => !window.__teatro.interni.SPRITE_OGGETTI[o.sprite]).map((o) => o.id) };
  });

  oss.pool = await p.evaluate(() => {
    const I = window.__teatro.interni; const P = I.statoRun.poolRunB;
    const pol = P.ids.map((id) => I.trovaOggettoB(id).polarita);
    const prezzi = {};
    for (const o of I.CATALOGO_OGGETTI) prezzi[o.polarita + '/' + o.tier] = o.prezzo;
    return { dimensione: P.ids.length, negativi: pol.filter((x) => x === 'negativo').length, prezzi, prezzoNegativoEconomia: I.ECONOMIA_T3.prezzi.negativo };
  });
  // la Fucina/il dono ingannevole non ripropongono negativi conosciuti
  oss.negativiConosciuti = await p.evaluate(() => {
    const I = window.__teatro.interni; const P = I.statoRun.poolRunB;
    const neg = P.rimasti.filter((id) => I.trovaOggettoB(id).polarita === 'negativo');
    const prima = I.estraiNegativoD(1);
    window.__teatroT3.salvataggi.impostaFlag('oggettiConosciuti', I.CATALOGO_OGGETTI.filter((o) => o.polarita === 'negativo').map((o) => o.id));
    const dopo = I.estraiNegativoD(1);
    window.__teatroT3.salvataggi.impostaFlag('oggettiConosciuti', []);
    return { negativiNelPool: neg.length, sconosciutoEsce: prima ? prima.id : null, conosciutoEsce: dopo ? dopo.id : null };
  });

  // --- meccaniche ---
  await stanzaProva();
  await dai(['velo-madonna']);
  oss.scudoStanza = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun;
    S.graziaIngressoC = 0; S.scudoRosaC = false; I.player.invuln = 0;
    const h0 = S.hpHalf; I.subisciColpoGiocatore(1, 'prova', I.player.x + 10, I.player.y);
    const h1 = S.hpHalf; I.player.invuln = 0; I.subisciColpoGiocatore(1, 'prova', I.player.x + 10, I.player.y);
    const h2 = S.hpHalf;
    I.entraInStanza(S.stanzaCorrente, null);
    return { prima: h0, dopoPrimoColpo: h1, dopoSecondo: h2, scudoDopoNuovaStanza: S.scudoStanzaD };
  });

  await stanzaProva();
  await dai(['cucchiaio']);
  oss.omingForza = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    P.x = 200; P.y = 200;
    S.stanzaCorrente.nemici = [{ id: 'bersaglioD', x: 300, y: 150, r: 10, hp: 9999, maxHp: 9999, tipo: 'mosca', speed: 0, stunTicks: 99999 }];
    I.sparaProiettiliDirezione(1, 0);
    const pr = S.proiettili[0];
    return { vy0: pr.vy, oming: pr.oming };
  });
  await p.waitForTimeout(120);
  oss.omingForza.vyDopo = await p.evaluate(() => { const pr = window.__teatro.interni.statoRun.proiettili[0]; return pr ? pr.vy : null; });
  await p.waitForTimeout(500);
  oss.omingForza.bersaglio = await p.evaluate(() => { const n = window.__teatro.interni.statoRun.stanzaCorrente.nemici[0]; return n ? { hp: n.hp, x: n.x, y: n.y } : null; });

  await stanzaProva();
  await dai(['gomma']);
  oss.rimbalzi = await p.evaluate(async () => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    P.x = I.ARENA.x2 - 30; P.y = 190;
    I.sparaProiettiliDirezione(1, 0);
    const pr = S.proiettili[0];
    const r0 = pr.rimbalzi;
    await new Promise((r) => setTimeout(r, 300));
    return { rimbalziIniziali: r0, rimbalziDopo: pr.rimbalzi, vxDopo: pr.vx, vivo: S.proiettili.includes(pr), distNonAzzerata: pr.dist > 20 };
  });

  await stanzaProva();
  await dai(['gomitolo', 'gomitolo']);
  oss.orbitali = await p.evaluate(async () => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    P.x = 320; P.y = 200;
    for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12; S.proiettiliNemici.push({ x: P.x + Math.cos(a) * 34, y: P.y - 6 + Math.sin(a) * 34, vx: 0, vy: 0, dist: 0 }); }
    const n0 = S.proiettiliNemici.length;
    await new Promise((r) => setTimeout(r, 120));
    return { quanti: S.statD.orbitali, proiettiliNemiciPrima: n0, dopo: S.proiettiliNemici.length, posizioni: (S.orbitaliPosD || []).length };
  });
  await p.screenshot({ path: foto('01-orbitali') });

  await stanzaProva();
  await dai(['pupo_tonino', 'pupa_agnese', 'diavoletto', 'pulcinellino', 'pupo_tonino']);
  oss.famiglio = await p.evaluate(async () => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    P.x = 200; P.y = 200;
    S.stanzaCorrente.nemici = [{ id: 'bersaglioF', x: 420, y: 200, r: 10, hp: 9999, maxHp: 9999, tipo: 'mosca', speed: 0, stunTicks: 99999 }];
    I.sparaProiettiliDirezione(1, 0);
    await new Promise((r) => setTimeout(r, 300));
    return { famigli: S.famigliD.length, tipi: S.famigliD.map((f) => f.id), colpiFamiglio: S.proiettili.filter((x) => x.famD).length };
  });
  await p.screenshot({ path: foto('02-famigli') });

  // altre meccaniche
  await stanzaProva();
  await dai(['piedigrotta', 'ragno', 'cappello-mago', 'cuoio', 'cuoio', 'cuoio', 'ostia', 'ranocchio', 'spillo', 'occhio-vetro']);
  oss.altre = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun;
    S.proiettili = [];
    I.sparaProiettiliDirezione(1, 0);
    const n = S.proiettili.length;
    S.proiettili = [];
    for (let k = 0; k < 40; k++) I.sparaProiettiliDirezione(1, 0);
    const tetto = S.proiettili.length;
    S.proiettili = [];
    S.scudoStanzaD = 0; S.scudoRosaC = false; S.graziaIngressoC = 0; I.player.invuln = 0;
    const h0 = S.hpHalf; I.subisciColpoGiocatore(2, 'prova', 0, 0);
    return { colpiPerTiro: n, tettoProiettili: tetto, esplosiva: S.statD.esplosiva, bloccoProb: S.statD.bloccoProb, range: S.range,
      dannoConOstia: h0 - S.hpHalf };
  });
  await stanzaProva();
  await dai(['nebbia', 'lume']);
  oss.maledizioni = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun;
    return { mappa: I.maledizioneD('mappa'), buio: I.maledizioneD('buio') };
  });
  await p.screenshot({ path: foto('03-maledizioni-buio-mappa') });
  oss.maledizioni.pianoDopo = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun;
    I.avviaPiano(S.piano + 1, false);
    return { mappa: I.maledizioneD('mappa'), buio: I.maledizioneD('buio') };
  });

  // --- effetti nascosti, conosciuti, cartiglio, diario, Sviluppatore ---
  await p.evaluate(() => { window.__teatroT3.salvataggi.impostaFlag('oggettiConosciuti', []); window.__teatro.interni.selezionaPersonaggio('ombra'); });
  await avvia();
  await stanzaProva();
  oss.nascosti = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun;
    const iniziale = I.statoRun.oggettiEquipaggiati[0] ? I.statoRun.oggettiEquipaggiati[0].id : null;
    const o = I.trovaOggettoB('gomma');
    const st = S.stanzaCorrente;
    st.tipo = 'tesoro'; st.pulita = true;
    st.oggettoPiedistallo = { ...o, x: 320, y: 192, preso: false, forteGratis: false };
    I.player.x = 320; I.player.y = 250;
    return { inizialeConosciuto: I.conosciutiD().includes(iniziale), iniziale, descPrima: I.descD(o) };
  });
  await p.waitForTimeout(200);
  await p.screenshot({ path: foto('04-piedistallo-sconosciuto') });
  await p.evaluate(() => { const I = window.__teatro.interni; I.player.x = 320; I.player.y = 200; I.interagisciStanza(); });
  await p.waitForTimeout(400);
  oss.nascosti.descDopo = await p.evaluate(() => window.__teatro.interni.descD(window.__teatro.interni.trovaOggettoB('gomma')));
  oss.nascosti.cartiglio = await p.evaluate(() => Boolean(window.__teatro.interni.statoRun.cartiglioD));
  await p.screenshot({ path: foto('05-cartiglio-primo-raccolto') });
  await p.reload();
  await p.waitForTimeout(600);
  oss.nascosti.dopoReload = await p.evaluate(() => window.__teatro.interni.conosciutiD().includes('gomma'));
  await avvia();
  // diario dal menu ESC (tasto Escape, poi click sul bottone)
  await p.keyboard.press('Escape');
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('06-menu-esc') });
  const box = await p.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); return { x: c.left, y: c.top, w: c.width, h: c.height }; });
  await p.mouse.click(box.x + box.w * (320 / 640), box.y + box.h * ((30 + 230 + 13) / 360));
  await p.waitForTimeout(150);
  oss.diario = await p.evaluate(() => ({ aperto: Boolean(window.__teatro.interni.statoRun.diarioD), pausa: window.__teatro.interni.statoRun.pausa }));
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(100);
  await p.screenshot({ path: foto('07-diario') });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(100);
  oss.diario.chiusoTornaMenu = await p.evaluate(() => ({ diario: Boolean(window.__teatro.interni.statoRun.diarioD), pausa: window.__teatro.interni.statoRun.pausa }));
  await p.keyboard.press('Escape');
  // Stanza dello Sviluppatore con sconosciuti «???»
  await p.evaluate(() => {
    const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
    st.tipo = 'sviluppatore'; st.sceltaFattaB = false; I.apriPannelloSviluppatoreB(st);
  });
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('08-sviluppatore') });
  await p.evaluate(() => { window.__teatro.interni.statoRun.pannelloB = null; });

  oss.errori = errori;
  console.log(JSON.stringify(oss, null, 1));
  await browser.close();
})();
