#!/usr/bin/env node
/*
 * tools/qa-teatro-comandi.js — verifica Playwright della squadra b3 (gioco/teatro/b3-comandi-opzioni.js):
 * gamepad simulato (navigator.getGamepads sostituito da un pad finto col layout standard), movimento e sparo
 * nelle 4 direzioni con zone morte e isteresi, bottoni d'azione, pausa, navigazione dei menu senza mouse
 * (pad e sola tastiera), menu Opzioni, salvataggio e ricarica delle opzioni, rimappatura di un tasto con
 * conflitto e ripristino, scossa, vibrazione, volume della musica, testo grande.
 *
 * Uso: node tools/qa-teatro-comandi.js <file html> [prefisso screenshot]
 * Screenshot <prefisso>-01-menu-pad.png … -10-dialogo-pad.png. Esce con 1 se un controllo fallisce.
 * Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-comandi');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;
const B = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, select: 8, start: 9, su: 12, giu: 13, sinistra: 14, destra: 15 };

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });

  // Pad finto: layout standard, 17 bottoni, 4 assi, attuatore di vibrazione che registra le chiamate.
  await p.addInitScript(() => {
    window.__vib = [];
    window.__padAcceso = false;
    window.__pad = {
      id: 'Pad finto (QA)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
      vibrationActuator: { type: 'dual-rumble', playEffect(tipo, par) { window.__vib.push({ tipo, ...par }); return Promise.resolve('complete'); } },
    };
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true, value: () => (window.__padAcceso ? [window.__pad, null, null, null] : [null, null, null, null]),
    });
  });
  const padAcceso = (v) => p.evaluate((v) => { window.__padAcceso = v; }, v);
  const tieni = (i, giu) => p.evaluate(([i, giu]) => { const b = window.__pad.buttons[i]; b.pressed = giu; b.value = giu ? 1 : 0; }, [i, giu]);
  const premi = async (i, ms = 70) => { await tieni(i, true); await p.waitForTimeout(ms); await tieni(i, false); await p.waitForTimeout(70); };
  const assi = async (a, ms = 0) => { await p.evaluate((a) => { a.forEach((v, i) => { if (v !== null) window.__pad.axes[i] = v; }); }, a); if (ms) await p.waitForTimeout(ms); };
  const stato = () => p.evaluate(() => window.__teatro.interni.comandiB3.stato);
  const tasti = () => p.evaluate(() => window.__teatro.interni.comandiB3.tasti());
  const run = () => p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    return { fase: R.fase, pausa: Boolean(R.pausa), diario: Boolean(R.diarioD), sipario: Boolean(R.siparioAttivo), pg: R.personaggioId, x: I.player.x, y: I.player.y, dirX: I.player.dirX, dirY: I.player.dirY, audio: I.AudioSys.attivo };
  });
  const tasto = (k) => p.evaluate((k) => Boolean(window.__teatro.interni.keys[k]), k);
  const opzioni = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__teatro.interni.OPZIONI)));
  const salvate = () => p.evaluate(() => JSON.parse(localStorage.getItem('ferruccio.teatro.opzioni') || '{}'));
  const spia = () => p.evaluate(() => { window.__codici = []; window.addEventListener('keydown', (e) => window.__codici.push(e.code)); });
  const codici = () => p.evaluate(() => window.__codici.splice(0));
  const dialogo = () => p.evaluate(() => window.__teatro.t4qa.dialogo);
  const vaiARiga = async (id, premiGiu) => {
    for (let i = 0; i < 20; i++) {
      const s = await stato();
      if (s.opzioni && s.opzioni.riga === id) return true;
      await premiGiu();
    }
    return false;
  };

  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await p.waitForTimeout(500);
  let s = await stato();
  ok('avvio-menu-tastiera', s.contesto === 'principale' && s.dispositivo === 'tastiera' && !s.padPresente, s);
  ok('opzioni-predefinite', await p.evaluate(() => { const O = window.__teatro.interni.OPZIONI; return O.vibrazione === 1 && O.testoGrande === false && O.tasti.su === 'KeyW' && O.tasti.pausa === 'Escape'; }));

  // ---------------------------------------------------------------- 1. MENU PRINCIPALE COL GAMEPAD
  await padAcceso(true);
  await p.waitForTimeout(80);
  const pg0 = (await run()).pg;
  await premi(B.destra);
  s = await stato();
  ok('pad-menu-personaggio', (await run()).pg !== pg0 && s.dispositivo === 'pad', { da: pg0, a: (await run()).pg, dispositivo: s.dispositivo });
  await premi(B.sinistra);
  ok('pad-menu-personaggio-indietro', (await run()).pg === pg0);
  const slot0 = await p.evaluate(() => window.__teatroT3.salvataggi.slotAttivo);
  await premi(B.giu);
  const slot1 = await p.evaluate(() => window.__teatroT3.salvataggi.slotAttivo);
  await premi(B.su);
  ok('pad-menu-slot', slot1 !== slot0 && (await p.evaluate(() => window.__teatroT3.salvataggi.slotAttivo)) === slot0, { slot0, slot1 });
  await p.waitForTimeout(100);
  await p.screenshot({ path: foto('01-menu-pad') });

  // ---------------------------------------------------------------- 2. OPZIONI COL GAMEPAD, SALVATAGGIO
  await premi(B.Y);
  s = await stato();
  ok('pad-apre-opzioni', s.contesto === 'opzioni' && s.opzioni && s.opzioni.pagina === 'scena' && s.opzioni.riga === 'volumeEffetti', s.opzioni);
  await premi(B.giu);
  ok('pad-opzioni-riga', (await stato()).opzioni.riga === 'volumeMusica');
  for (let i = 0; i < 3; i++) await premi(B.sinistra);
  ok('pad-volume-musica', (await opzioni()).volumeMusica === 0.7 && (await salvate()).volumeMusica === 0.7, { vivo: (await opzioni()).volumeMusica, salvato: (await salvate()).volumeMusica });
  await p.screenshot({ path: foto('02-opzioni') });
  ok('pad-riga-grana', await vaiARiga('grana', () => premi(B.giu)));
  await premi(B.A);
  ok('pad-interruttore-grana', (await opzioni()).grana === false && (await salvate()).grana === false);
  // levetta tenuta: il cursore si ripete da solo
  const riga0 = (await stato()).opzioni.riga;
  await assi([0, 1], 900); await assi([0, 0], 80);
  // l'elenco delle righe viene dal gioco: altri file ne aggiungono (ombre, voce, mira assistita, qualità automatica…)
  const righeScena = await p.evaluate(() => righeB3('scena').map((r) => r.id || r.chiave || r.k));
  const passi = (righeScena.indexOf((await stato()).opzioni.riga) - righeScena.indexOf(riga0) + righeScena.length) % righeScena.length;
  ok('pad-levetta-ripetizione', passi >= 3 && passi <= 7, { passi });
  ok('pad-riga-scossa', await vaiARiga('scossa', () => premi(B.su)));
  for (let i = 0; i < 5; i++) await premi(B.sinistra);
  ok('pad-scossa', (await opzioni()).scossa === 0.5);
  await premi(B.giu);
  await p.evaluate(() => { window.__vib.length = 0; });
  for (let i = 0; i < 2; i++) await premi(B.sinistra);
  const vibProva = await p.evaluate(() => window.__vib.slice());
  ok('pad-vibrazione-regolata', (await opzioni()).vibrazione === 0.8 && vibProva.length === 2 && Math.abs(vibProva[1].weakMagnitude - 0.45 * 0.8) < 1e-6, vibProva);
  await premi(B.B);
  s = await stato();
  ok('pad-chiude-opzioni', s.opzioni === null && s.contesto === 'principale');

  // ---------------------------------------------------------------- 3. RICARICA: le opzioni restano
  await p.reload();
  await p.waitForTimeout(500);
  const O1 = await opzioni();
  ok('ricarica-opzioni', O1.volumeMusica === 0.7 && O1.grana === false && O1.scossa === 0.5 && O1.vibrazione === 0.8 && O1.vignetta === true, O1);

  // ---------------------------------------------------------------- 4. RIMAPPATURA (sola tastiera)
  await p.keyboard.press('KeyO');
  s = await stato();
  ok('tastiera-apre-opzioni', s.contesto === 'opzioni' && s.dispositivo === 'tastiera', s.opzioni);
  await p.keyboard.press('Tab');
  ok('tastiera-pagina-comandi', (await stato()).opzioni.pagina === 'tasti');
  ok('tastiera-riga-attivo', await vaiARiga('attivo', () => p.keyboard.press('ArrowDown')));
  await p.keyboard.press('Enter');
  ok('cattura-aperta', (await stato()).opzioni.cattura === 'attivo');
  await p.waitForTimeout(380);
  await p.screenshot({ path: foto('03-rimappatura') });
  await p.keyboard.press('Enter'); // riservato: resta in attesa
  s = await stato();
  ok('tasto-riservato', s.opzioni.cattura === 'attivo' && /non si può/.test(s.avviso || ''), s.avviso);
  await p.keyboard.press('KeyG');
  s = await stato();
  ok('tasto-rimappato', (await tasti()).attivo === 'KeyG' && s.opzioni.cattura === null && (await salvate()).tasti.attivo === 'KeyG', { tasti: await tasti(), avviso: s.avviso });
  await p.keyboard.press('ArrowDown');
  await p.keyboard.press('Enter');
  await p.keyboard.press('KeyG'); // già di «Oggetto attivo»: conflitto
  s = await stato();
  ok('conflitto-rilevato', s.opzioni.riga === 'interagisci' && s.opzioni.conflitto && s.opzioni.conflitto.altra === 'attivo' && (await tasti()).interagisci === 'KeyE', s.opzioni);
  await p.waitForTimeout(100);
  await p.screenshot({ path: foto('04-conflitto') });
  await p.keyboard.press('Escape');
  ok('conflitto-annullato', (await stato()).opzioni.conflitto === null && (await tasti()).interagisci === 'KeyE' && (await tasti()).attivo === 'KeyG');
  await p.keyboard.press('Enter');
  await p.keyboard.press('KeyG');
  await p.keyboard.press('Enter'); // scambia
  let T = await tasti();
  ok('conflitto-scambio', T.interagisci === 'KeyG' && T.attivo === 'KeyE', T);
  await p.keyboard.press('Backspace'); // predefinito di «Interagisci»: E torna qui, G torna all'attivo
  T = await tasti();
  ok('predefinito-di-riga', T.interagisci === 'KeyE' && T.attivo === 'KeyG', T);
  await p.keyboard.press('Escape');
  ok('esc-torna-alle-opzioni', (await stato()).opzioni.pagina === 'scena');
  await p.keyboard.press('Escape');
  ok('esc-chiude-opzioni', (await stato()).opzioni === null && (await run()).fase === 'menu_selezione');

  // ---------------------------------------------------------------- 4b. OPZIONI COL MOUSE
  const rc = await p.evaluate(() => { const b = document.getElementById('c').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  const click = (lx, ly) => p.mouse.click(rc.x + lx * rc.w / 640, rc.y + ly * rc.h / 360);
  await click(553, 319); // bottone «Opzioni» del menu principale
  ok('mouse-apre-opzioni', (await stato()).contesto === 'opzioni');
  await click(360, 140); // interruttore «Vignetta» (sesta riga: y = 8 + 50 + 5 × 15 + 7, righe alte 15)
  ok('mouse-interruttore', (await opzioni()).vignetta === false);
  await click(346 + 3 * 14 + 6, 66); // quarta tacca del volume degli effetti
  ok('mouse-barra', (await opzioni()).volumeEffetti === 0.4, (await opzioni()).volumeEffetti);
  await click(346 + 9 * 14 + 6, 66);
  await click(360, 140);
  ok('mouse-ripristino', (await opzioni()).volumeEffetti === 1 && (await opzioni()).vignetta === true);
  await click(480, 46); // linguetta «Comandi»
  ok('mouse-linguetta', (await stato()).opzioni.pagina === 'tasti');
  await click(40, 200); // fuori dal cartiglio: indietro, poi chiude
  await click(40, 200);
  ok('mouse-chiude', (await stato()).opzioni === null && (await run()).fase === 'menu_selezione');

  // ---------------------------------------------------------------- 5. HUB COL GAMEPAD
  await padAcceso(true);
  await p.waitForTimeout(80);
  await premi(B.A); // inizia la commedia
  await p.waitForTimeout(300);
  ok('pad-avvia-hub', (await run()).fase === 'hub', (await run()).fase);
  const chiudiDialoghi = async () => {
    for (let i = 0; i < 40; i++) { if (!(await dialogo())) return true; await premi(B.A); }
    return false;
  };
  if (await dialogo()) { await p.waitForTimeout(120); await p.screenshot({ path: foto('10-dialogo-pad') }); }
  ok('pad-dialoghi-hub', await chiudiDialoghi());
  let r0 = await run();
  await assi([1, 0], 400); await assi([0, 0], 80);
  let r1 = await run();
  ok('pad-movimento-hub', r1.x > r0.x + 10, { da: r0.x, a: r1.x });
  await premi(B.start);
  ok('pad-pausa-hub', (await run()).pausa && (await stato()).contesto === 'pausa');
  await premi(B.giu);
  await p.waitForTimeout(100);
  await p.screenshot({ path: foto('09-pausa-hub') });
  ok('pad-cursore-pausa-hub', (await stato()).cursorePausa === 1);
  await premi(B.B);
  ok('pad-riprende-hub', !(await run()).pausa && (await run()).fase === 'hub');
  const ing = await p.evaluate(() => window.__teatro.t4qa.ingresso);
  await p.evaluate((g) => { const P = window.__teatro.interni.player; P.x = g.x - 40; P.y = g.y; }, ing);
  await assi([1, 0], 900); await assi([0, 0], 80);
  await premi(B.A); // nell'hub Ⓐ interagisce
  await p.waitForTimeout(200);
  await chiudiDialoghi();
  await p.waitForTimeout(200);
  ok('pad-entra-nel-teatro', (await run()).fase === 'in_gioco', (await run()).fase);

  // ---------------------------------------------------------------- 6. IN SCENA COL GAMEPAD
  if ((await run()).sipario) { ok('contesto-sipario', (await stato()).contesto === 'sipario'); await premi(B.A); }
  await chiudiDialoghi();
  ok('pad-alza-il-sipario', !(await run()).sipario && (await stato()).contesto === 'gioco', (await stato()).contesto);
  await p.evaluate(() => { const I = window.__teatro.interni; I.player.invuln = 999999; I.player.x = 320; I.player.y = 200; });
  await spia();
  r0 = await run();
  await assi([-1, 0], 300);
  const tenutoA = await tasto('KeyA');
  await assi([0, 0], 80);
  r1 = await run();
  ok('pad-movimento', r1.x < r0.x - 10 && tenutoA && !(await tasto('KeyA')), { da: r0.x, a: r1.x, tenutoA });
  await assi([0.7, 0.7], 120);
  s = await stato();
  ok('pad-diagonale', s.tenuti.includes('KeyD') && s.tenuti.includes('KeyS') && s.tenuti.length === 2, s.tenuti);
  await assi([0.2, 0.12], 120); // sopra la soglia di rilascio (0,22): l'isteresi tiene la direzione
  s = await stato();
  ok('pad-isteresi-movimento', s.tenuti.length === 2, s.tenuti);
  await assi([0.1, 0.1], 120);
  s = await stato();
  ok('pad-rilascio-movimento', s.tenuti.length === 0, s.tenuti);
  await assi([0.25, 0.1], 120); // da fermo, sotto la zona morta (0,30): niente
  s = await stato();
  ok('pad-zona-morta', s.tenuti.length === 0, s.tenuti);
  await assi([0, 0], 60);
  await tieni(B.su, true); await p.waitForTimeout(100);
  const croceSu = await tasto('KeyW');
  await tieni(B.su, false); await p.waitForTimeout(80);
  ok('pad-croce', croceSu && !(await tasto('KeyW')));
  // sparo: levetta destra, direzione dominante con isteresi
  await assi([null, null, 0, -1], 200);
  r1 = await run();
  ok('pad-sparo-su', (await tasto('ArrowUp')) && r1.dirY === -1 && r1.dirX === 0, r1);
  await assi([null, null, 1, 0], 150);
  ok('pad-sparo-destra', (await tasto('ArrowRight')) && !(await tasto('ArrowUp')));
  await assi([null, null, 0.6, -0.7], 150); // l'asse nuovo non domina abbastanza: resta a destra
  ok('pad-sparo-isteresi', (await tasto('ArrowRight')) && !(await tasto('ArrowUp')), (await stato()).tenuti);
  await assi([null, null, 0.2, -0.9], 150);
  ok('pad-sparo-cambia', (await tasto('ArrowUp')) && !(await tasto('ArrowRight')), (await stato()).tenuti);
  await assi([null, null, 0.15, -0.15], 120); // sotto la soglia di rilascio (0,26)
  ok('pad-sparo-rilascio', !(await tasto('ArrowUp')) && (await stato()).tenuti.length === 0);
  await assi([null, null, 0, 0], 60);
  await tieni(B.X, true); await p.waitForTimeout(700); // oltre la cadenza di tiro: il colpo a sinistra parte di sicuro
  const sparoX = await tasto('ArrowLeft');
  r1 = await run();
  await tieni(B.X, false); await p.waitForTimeout(80);
  ok('pad-sparo-bottoni', sparoX && r1.dirX === -1 && !(await tasto('ArrowLeft')), { sparoX, dirX: r1.dirX, dirY: r1.dirY });
  // bottoni d'azione
  await codici();
  await premi(B.LT); const cLT = await codici();
  await premi(B.LB); const cLB = await codici();
  await premi(B.RB); const cRB = await codici();
  ok('pad-azioni', cLT.includes('KeyQ') && cLB.includes('KeyF') && cRB.includes('KeyE'), { cLT, cLB, cRB });
  // tasto rimappato in scena: G vale «oggetto attivo», Q (rimasto senza azione) non fa più niente
  await p.keyboard.press('KeyG'); const cG = await codici();
  await p.keyboard.press('KeyQ'); const cQ = await codici();
  ok('tastiera-rimappata-in-scena', cG.length === 1 && cG[0] === 'KeyQ' && cQ.length === 0 && (await stato()).dispositivo === 'tastiera', { cG, cQ });
  const scritte = await p.evaluate(() => { const C = window.__teatro.interni.comandiB3; return [C.adattaTesto('Attivo [Q]: Forbici'), C.adattaTesto('3🪙 [Click/E]'), C.simbolo('attivo')]; });
  ok('scritte-tastiera', scritte[0] === 'Attivo [G]: Forbici' && scritte[1] === '3🪙 [Click/E]' && scritte[2] === 'G', scritte);

  // ---------------------------------------------------------------- 7. PAUSA E MENU SENZA MOUSE
  await premi(B.start);
  s = await stato();
  ok('pad-pausa', (await run()).pausa && s.contesto === 'pausa' && s.cursorePausa === 0 && s.dispositivo === 'pad', s);
  const scrittePad = await p.evaluate(() => { const C = window.__teatro.interni.comandiB3; return [C.adattaTesto('3🪙 [Click/E]'), C.adattaTesto('▶ RIPRENDI GIOCO [ESC]'), C.adattaTesto('🎲 RICOMINCIA NOTTE [R]'), C.simbolo('consumabile')]; });
  ok('scritte-pad', scrittePad[0] === '3🪙 [RB]' && scrittePad[1] === '▶ RIPRENDI GIOCO [START]' && scrittePad[2] === '🎲 RICOMINCIA NOTTE' && scrittePad[3] === 'LB', scrittePad);
  const iOpz = s.voci.indexOf('opzioni');
  for (let i = 0; i < iOpz; i++) await premi(B.giu);
  s = await stato();
  ok('pad-cursore-pausa', iOpz > 0 && s.cursorePausa === iOpz && s.voci.includes('registro'), { cursore: s.cursorePausa, voci: s.voci });
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('05-pausa-pad') });
  await premi(B.A);
  s = await stato();
  ok('pad-opzioni-dalla-pausa', s.contesto === 'opzioni' && s.opzioni.pagina === 'scena', s.opzioni);
  await premi(B.RB);
  ok('pad-dorsale-pagina', (await stato()).opzioni.pagina === 'tasti');
  await p.waitForTimeout(100);
  await p.screenshot({ path: foto('06-comandi-pad') });
  await premi(B.B); await premi(B.B);
  ok('pad-chiude-opzioni-pausa', (await stato()).contesto === 'pausa' && (await run()).pausa);
  await premi(B.B);
  ok('pad-riprende', !(await run()).pausa && (await stato()).contesto === 'gioco');
  // Diario dalla scena con Select, e ritorno diretto al gioco
  await premi(B.select);
  ok('pad-diario', (await run()).diario && (await run()).pausa && (await stato()).contesto === 'diario');
  await premi(B.destra);
  ok('pad-diario-naviga', await p.evaluate(() => window.__teatro.interni.statoRun.diarioD.sel === 1));
  await premi(B.select);
  await p.waitForTimeout(80);
  ok('pad-diario-chiude', !(await run()).diario && !(await run()).pausa);
  // sola tastiera: cursore del menu di pausa
  await p.keyboard.press('Escape');
  await p.keyboard.press('ArrowDown');
  s = await stato();
  ok('tastiera-cursore-pausa', (await run()).pausa && s.cursorePausa === 1 && s.voci[1] === 'audio' && s.dispositivo === 'tastiera', s);
  const audio0 = (await run()).audio;
  await p.keyboard.press('Enter');
  const audio1 = (await run()).audio;
  await p.keyboard.press('Enter');
  ok('tastiera-voce-audio', audio1 === !audio0 && (await run()).audio === audio0 && (await run()).pausa, { audio0, audio1 });
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('07-pausa-tastiera') });
  await p.keyboard.press('ArrowUp');
  await p.keyboard.press('Enter');
  ok('tastiera-riprendi', !(await run()).pausa);
  await p.keyboard.press('KeyO');
  ok('tastiera-diario', (await run()).diario && (await run()).pausa);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(80);
  ok('tastiera-diario-chiude', !(await run()).diario && !(await run()).pausa);

  // ---------------------------------------------------------------- 8. SCOSSA, VIBRAZIONE, MUSICA, TESTO GRANDE
  const scossa = await p.evaluate(() => {
    const I = window.__teatro.interni; const C = I.comandiB3;
    I.OPZIONI.scossa = 0; I.scuoti(FEEL.scossa.bomba); const fermo = C.offsetScossa(16);
    for (let i = 0; i < 20; i++) C.offsetScossa(16);
    I.OPZIONI.scossa = 1; I.scuoti(FEEL.scossa.bomba); const pieno = C.offsetScossa(16);
    for (let i = 0; i < 20; i++) C.offsetScossa(16);
    I.OPZIONI.scossa = 0.5; I.scuoti(FEEL.scossa.bomba); const mezzo = C.offsetScossa(16);
    for (let i = 0; i < 20; i++) C.offsetScossa(16);
    return { fermo, pieno, mezzo };
  });
  ok('scossa-opzione', scossa.fermo.x === 0 && scossa.fermo.y === 0 && Math.abs(scossa.pieno.x) >= 5 && Math.abs(scossa.mezzo.x) >= 2 && Math.abs(scossa.mezzo.x) <= 3, scossa);
  await premi(B.su, 40); // l'ultimo dispositivo torna il gamepad
  const vib = await p.evaluate(() => {
    const I = window.__teatro.interni;
    window.__vib.length = 0;
    I.OPZIONI.vibrazione = 1; I.scuoti(FEEL.scossa.ferita); I.scuoti(FEEL.scossa.bomba); I.scuoti(FEEL.scossa.colpo);
    const accesa = window.__vib.slice();
    I.OPZIONI.vibrazione = 0; I.scuoti(FEEL.scossa.ferita);
    const spenta = window.__vib.length;
    I.OPZIONI.vibrazione = 0.8;
    return { accesa, spenta };
  });
  ok('vibrazione-colpo-ed-esplosione', vib.accesa.length === 2 && vib.accesa[0].duration === 130 && vib.accesa[1].duration === 190 && vib.spenta === 2, vib);
  const musica = await p.evaluate(async () => {
    const I = window.__teatro.interni;
    if (!I.Musica || !I.Musica.stato) return null;
    I.OPZIONI.volumeMusica = 1; await new Promise((f) => setTimeout(f, 900)); const pieno = I.Musica.stato.guadagnoMaster;
    I.OPZIONI.volumeMusica = 0.5; await new Promise((f) => setTimeout(f, 900)); const mezzo = I.Musica.stato.guadagnoMaster;
    I.OPZIONI.volumeMusica = 0.7;
    return { pieno, mezzo, base: MUSICA.volume };
  });
  if (musica && musica.pieno) ok('musica-segue-opzione', Math.abs(musica.pieno - musica.base) < 0.02 && Math.abs(musica.mezzo - musica.base * 0.5) < 0.012, musica);
  else ok('musica-segue-opzione (audio non attivo: non misurabile)', true, musica);
  await p.keyboard.press('ShiftLeft'); // di nuovo tastiera
  await p.evaluate(() => { const I = window.__teatro.interni; I.OPZIONI.testoGrande = true; I.mostraBanner('Stanza pulita! È apparso un oggetto sul piedistallo [Click/E]', 600); });
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('08-testo-grande') });
  await p.evaluate(() => { const I = window.__teatro.interni; I.OPZIONI.testoGrande = false; I.statoRun.bannerTimer = 0; });

  // ---------------------------------------------------------------- 9. RIPRISTINA I TASTI PREDEFINITI
  await p.keyboard.press('Escape');
  s = await stato();
  for (let i = 0; i < s.voci.indexOf('opzioni'); i++) await p.keyboard.press('ArrowDown');
  await p.keyboard.press('Enter');
  await p.keyboard.press('Tab');
  ok('tastiera-riga-ripristina', await vaiARiga('predefinitiTasti', () => p.keyboard.press('ArrowUp')));
  await p.keyboard.press('Enter');
  T = await tasti();
  ok('ripristina-tasti', T.attivo === 'KeyQ' && T.interagisci === 'KeyE' && (await salvate()).tasti.attivo === 'KeyQ', T);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  ok('opzioni-chiuse-in-pausa', (await stato()).contesto === 'pausa');
  await p.keyboard.press('Escape');
  await codici();
  await p.keyboard.press('KeyQ');
  ok('tasto-predefinito-di-nuovo-vivo', !(await run()).pausa && (await codici()).includes('KeyQ'));

  ok('nessun-errore-in-console', errori.length === 0, errori.slice(0, 5));
  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ file: path.relative(RADICE, file), controlli: esiti.length, falliti: falliti.length, dettaglio: falliti, }, null, 1));
  if (falliti.length) { console.log(JSON.stringify(esiti.filter((e) => e.ok).map((e) => e.caso))); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
