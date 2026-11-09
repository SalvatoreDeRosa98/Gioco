#!/usr/bin/env node
/*
 * tools/qa-teatro-musica.js — verifica Playwright del miglioramento 8 (musica procedurale, teatro/a8-musica.js).
 *
 * Uso: node tools/qa-teatro-musica.js <file html> [prefisso screenshot]
 * Da file://, 1280x720. Controlla via window.__teatro.interni.Musica: niente contesto prima del gesto; dopo il
 * primo tasto il contesto c'è e la musica pianifica note; il tema cambia entrando nell'hub, nel piano 1, nelle
 * stanze tesoro/Fucina (variante calma), nel boss (e la morte dà la cadenza); strato di combattimento acceso con
 * nemici vivi e spento a stanza pulita; un tema per ciascun piano del ciclo; con [M] il guadagno principale va a
 * 0 e non si pianifica nulla, con [M] di nuovo riparte; le voci vive restano poche; nessun errore in console.
 * Screenshot nel prefisso indicato (cartella o file). Esce con codice 1 se un controllo fallisce.
 * Chromium preinstallato nella sessione: non lanciare `playwright install`.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const pref = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-musica');
const foto = (n) => (pref.endsWith('/') ? path.join(pref, n + '.png') : `${pref}-${n}.png`);
if (pref.endsWith('/')) fs.mkdirSync(pref, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const verifica = (nome, ok, dati) => { esiti.push({ nome, ok: Boolean(ok), dati }); };
  const M = () => p.evaluate(() => window.__teatro.interni.Musica.stato);
  const attendi = (ms) => p.waitForTimeout(ms);

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await attendi(400);
  let s = await M();
  verifica('prima del gesto: nessun contesto, niente note', s.ctx === null && !s.suona && s.notePianificate === 0, s);

  await p.keyboard.press('Space'); // menu → hub (primo gesto)
  await attendi(700);
  for (let i = 0; i < 40; i++) {
    const d = await p.evaluate(() => window.__teatro.t4qa.dialogo);
    if (!d) break;
    await p.keyboard.press(d.scelta ? 'Digit1' : 'Space');
    await attendi(60);
  }
  await attendi(600);
  s = await M();
  verifica('hub: tema hub, contesto vivo, note pianificate', s.tema === 'hub' && s.ctx === 'running' && s.suona && s.notePianificate > 0, s);
  await p.screenshot({ path: foto('hub') });

  // [M] muto: guadagno a 0, niente pianificazione; [M] di nuovo riparte
  await p.keyboard.press('KeyM');
  await attendi(600);
  const n0 = (await M()).notePianificate;
  await attendi(800);
  s = await M();
  verifica('muto [M]: master a 0 e nessuna nota nuova', s.obiettivoMaster === 0 && s.guadagnoMaster < 0.001 && !s.suona && s.notePianificate === n0
    && (await p.evaluate(() => window.__teatro.interni.AudioSys.attivo)) === false, s);
  await p.keyboard.press('KeyM');
  await attendi(700);
  s = await M();
  verifica('di nuovo [M]: la musica riparte', s.suona && s.obiettivoMaster > 0 && s.notePianificate > n0, s);

  // ingresso nel piano 1
  const ing = await p.evaluate(() => window.__teatro.t4qa.ingresso);
  await p.evaluate((g) => { const P = window.__teatro.interni.player; P.x = g.x - 40; P.y = g.y; }, ing);
  await p.keyboard.down('KeyD'); await attendi(900); await p.keyboard.up('KeyD');
  await p.keyboard.press('Space'); // alza il sipario
  await attendi(400);
  s = await M();
  verifica('piano 1: tema piano1 (ingresso, nessun nemico)', s.tema === 'piano1' && !s.combattimento, s);

  const entra = (tipo) => p.evaluate((t) => {
    const I = window.__teatro.interni; const R = I.statoRun;
    R.siparioAttivo = null;
    const st = R.mappa.stanze.find((x) => x.tipo === t);
    I.entraInStanza(st, null);
    return Boolean(st);
  }, tipo);

  await entra('normale');
  await attendi(700);
  s = await M();
  verifica('stanza di combattimento: piano1 + strato ritmico', s.tema === 'piano1' && s.combattimento && s.obiettivoStrato === 1 && s.guadagnoStrato > 0.5, s);
  await p.screenshot({ path: foto('combattimento') });
  await p.evaluate(() => { const st = window.__teatro.interni.statoRun.stanzaCorrente; st.nemici.forEach((n) => { n.hp = 0; }); });
  await attendi(900); // la rampa d'uscita dura MUSICA.rampaStratoSec
  const ns = (await M()).noteStrato;
  await attendi(900);
  s = await M();
  // (il valore del gain di un bus senza voci non si aggiorna in Chromium: si controlla obiettivo e note)
  verifica('nemici morti: strato spento', !s.combattimento && s.obiettivoStrato === 0 && s.noteStrato === ns && ns > 0, s);

  await entra('tesoro');
  await attendi(500);
  s = await M();
  verifica('tesoro: variante calma del piano', s.tema === 'quiete-piano1' && s.base === 'quiete', s);
  await entra('fucina');
  await attendi(300);
  s = await M();
  verifica('Fucina: variante calma', s.base === 'quiete', s);

  const c0 = s.cambiTema;
  await entra('boss');
  await attendi(700);
  s = await M();
  verifica('boss: tema boss con cambio e dissolvenza', s.tema === 'boss' && s.cambiTema > c0 && s.suona, s);
  await p.screenshot({ path: foto('boss') });

  // un tema per piano del ciclo (logica pura, senza toccare la run)
  const perPiano = await p.evaluate(() => {
    const Mu = window.__teatro.interni.Musica;
    return [1, 2, 3, 4, 5].map((piano) => Mu.temaCorrente({ fase: 'in_gioco', piano, stanzaCorrente: { tipo: 'ingresso', pulita: true, nemici: [] } }).id);
  });
  verifica('temi per piano 1..4 distinti, il 5 ripete il 1', perPiano.join() === 'piano1,piano2,piano3,piano4,piano1', perPiano);
  const radici = await p.evaluate(() => { const T = window.__teatro.interni.MUSICA.temi; return [1, 2, 3, 4].map((k) => T['piano' + k].radice); });
  verifica('più cupo salendo: radice del piano 4 sotto quella del piano 1', radici[3] < radici[0], radici);

  // morte vera: colpo letale → fase morte → cadenza → hub
  await p.evaluate(() => {
    const I = window.__teatro.interni; I.statoRun.hpHalf = 1; I.player.invuln = 0;
    I.subisciColpoGiocatore(1);
  });
  await attendi(300);
  s = await M();
  const fase = await p.evaluate(() => window.__teatro.fase);
  verifica('morte: cadenza', fase !== 'morte' || s.tema === 'morte', { fase, s });
  let tornato = null;
  for (let i = 0; i < 40; i++) {
    await attendi(250);
    const f = await p.evaluate(() => window.__teatro.fase);
    if (f === 'hub') { await attendi(150); tornato = await M(); break; }
  }
  verifica('ritorno all\'hub: tema hub', tornato && tornato.tema === 'hub', tornato);

  s = await M();
  verifica('voci vive poche (nodi liberati)', s.vociVive < 60, s);
  verifica('nessun errore in console', errori.length === 0, errori);

  await browser.close();
  for (const e of esiti) console.log(`${e.ok ? 'OK  ' : 'FAIL'} ${e.nome}${e.ok ? '' : '  ' + JSON.stringify(e.dati)}`);
  const ko = esiti.filter((e) => !e.ok).length;
  console.log(ko ? `${ko} controlli falliti` : `tutti i ${esiti.length} controlli passati`);
  process.exit(ko ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
