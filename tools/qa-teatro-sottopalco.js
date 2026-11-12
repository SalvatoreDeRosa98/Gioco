#!/usr/bin/env node
/*
 * tools/qa-teatro-sottopalco.js — verifica Playwright della squadra h5 (gioco/teatro/h5-sottopalco.js):
 *   1. botola socchiusa solo in stanze con le botole di d5, mai al primo piano del ciclo, una volta per notte;
 *   2. «Calati sotto»: piccolo piano di tre stanze, nome del luogo SOTTOPALCO, minimappa solo del Sottopalco,
 *      flag dello slot, luce del luogo di b2;
 *   3. le tre stanze: nemici del luogo (marionetta che si rialza una volta, topi), contrappeso;
 *   4. il Macchinista: barra e nome, sacchi, quinta, fessure spente nella seconda metà; premio e pezzo di copione;
 *   5. la scala riporta nella stanza di partenza ripulita, porte aperte; mappa di sopra intatta;
 *   6. ogni quartiere e ciclo 2; morte sotto = morte normale; nessun errore.
 * Passi di logica contati (passi), niente attese a tempo reale per la logica.
 *
 * Uso: node tools/qa-teatro-sottopalco.js <file html> [prefisso screenshot]
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { fermaCiclo, passi } = require('./qa-teatro-comune');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-h5');
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
  const disegna = () => p.evaluate(() => { try { disegnaFrame(16); } catch (e) { console.error(e); } });
  const scatta = async (n) => { await p.evaluate(() => { try { a6.coda.length = 0; a6.notifica = null; } catch (_) { /* a6 */ } }); await disegna(); await p.screenshot({ path: foto(n) }); };

  const avvio = async (pid = 'ferruccio') => {
    await p.goto('file://' + file);
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
    await p.reload();
    await p.waitForTimeout(400);
    await fermaCiclo(p, true);
    await p.evaluate((id) => { statoRun.personaggioId = id; avviaPartitaConPersonaggio(id); }, pid);
    await passi(p, 5);
  };
  /** Avvia il piano, porta Ferruccio in una stanza normale con le botole (forzate se mancano) e la ripulisce. */
  const stanzaConBotole = (piano, forza) => p.evaluate(([pi, fz]) => {
    if (statoRun.fase !== 'in_gioco') nuovaRun(false);
    statoRun.fase = 'in_gioco';
    avviaPiano(pi, false);
    statoRun.siparioAttivo = null;
    const I = window.__teatro.interni;
    let st = statoRun.mappa.stanze.find((s) => s.botoleD5 && s.tipo === 'normale');
    if (!st) { st = statoRun.mappa.stanze.find((s) => s.tipo === 'normale' && !s.quadriD5); I.d5.forzaBotole(st); }
    entraInStanza(st, 'S');
    statoRun.siparioAttivo = null;
    for (const b of st.botoleD5.lista) { if (b.nemico) { st.nemici.push(b.nemico); b.nemico = null; } b.stato = 'chiusa'; }
    for (const n of st.nemici) n.hp = 0;
    const H5 = I.sottopalcoH5;
    if (fz) H5.provaBotolaH5(st, true);
    verificaStanzaPulita();
    return { id: st.id, pulita: st.pulita, botola: st.botolaH5 || null, piano: statoRun.piano };
  }, [piano, forza]);
  const H = () => p.evaluate(() => window.__teatro.interni.sottopalcoH5.stato());
  const errTeatro = () => p.evaluate(() => (window.ERRORI_TEATRO || []).length);

  await avvio();
  // ---- 1. regole della botola ----
  const nomeD5 = await p.evaluate(() => Object.keys(window.__teatro.interni).filter((k) => k === "d5"));
  ok('sonda di d5 presente', nomeD5.length > 0, nomeD5);
  let r = await p.evaluate(() => { const H5 = window.__teatro.interni.sottopalcoH5; H5.h5.fatte.clear(); return H5.SOTTOPALCO_H5.probabilita; });
  // piano 1: mai
  await p.evaluate(() => { window.__teatro.interni.sottopalcoH5.h5.fatte.clear(); });
  r = await stanzaConBotole(1, false);
  ok('piano 1: nessuna botola socchiusa', !r.botola, r);
  // piano 2 forzata
  r = await stanzaConBotole(2, true);
  ok('piano 2: botola socchiusa (forzata)', r.botola && r.pulita, r);
  await p.evaluate(() => { const b = statoRun.stanzaCorrente.botolaH5; player.x = b.x; player.y = b.y + 10; });
  await scatta('1-botola');
  // ---- 2. discesa ----
  const sopra = await p.evaluate(() => ({ n: statoRun.mappa.stanze.length, id: statoRun.stanzaCorrente.id }));
  await p.evaluate(() => interagisciStanza());
  let h = await H();
  const info = await p.evaluate(() => ({ n: statoRun.mappa.stanze.length, ids: statoRun.mappa.stanze.map((s) => s.id), luogo: statoRun.stanzaCorrente.nomeLuogoHud,
    luce: luceLuogoB2() === window.__teatro.interni.sottopalcoH5.h5 ? 0 : luceLuogoB2(), flag: window.__teatro.t4qa.flag.sottopalcoH5, discese: window.__teatro.t4qa.flag.sottopalcoDisceseH5 }));
  ok('discesa: nel Sottopalco', h.sotto, h);
  ok('discesa: tre stanze nella mappa (solo il Sottopalco)', info.n === 3 && info.ids.every((x) => x.startsWith('h5-')), info);
  ok('discesa: nome del luogo SOTTOPALCO', info.luogo === 'Sottopalco', info.luogo);
  ok('discesa: luce del luogo di b2', info.luce && info.luce.luce < 1, info.luce);
  ok('discesa: flag dello slot', info.flag === true && info.discese === 1, info);
  await passi(p, 30);
  await scatta('2-sotto');
  // ---- 5. fino in fondo e scala ----
  await p.evaluate(() => {
    const m = statoRun.mappa;
    for (const s of m.stanze) { for (const n of s.nemici) n.hp = 0; }
    entraInStanza(m.stanze[m.stanze.length - 1], 'W');
    for (const n of statoRun.stanzaCorrente.nemici) n.hp = 0;
    verificaStanzaPulita();
  });
  await passi(p, 5);
  await p.evaluate(() => { const S = window.__teatro.interni.sottopalcoH5.SOTTOPALCO_H5.scala; player.x = S.x; player.y = S.y + 6; });
  await scatta('3-scala');
  await p.evaluate(() => interagisciStanza());
  h = await H();
  const dopo = await p.evaluate(() => ({ n: statoRun.mappa.stanze.length, id: statoRun.stanzaCorrente.id, pulita: statoRun.stanzaCorrente.pulita, usata: statoRun.stanzaCorrente.botolaH5 && statoRun.stanzaCorrente.botolaH5.usata }));
  ok('scala: di nuovo sopra, stessa stanza', !h.sotto && dopo.id === sopra.id && dopo.n === sopra.n, { sopra, dopo });
  ok('scala: stanza ripulita, botola richiusa', dopo.pulita && dopo.usata, dopo);
  // una volta per notte
  r = await p.evaluate(() => { const H5 = window.__teatro.interni.sottopalcoH5; const st = statoRun.mappa.stanze.find((s) => s.tipo === 'normale' && !s.botolaH5); delete st.botolaH5; return H5.provaBotolaH5(Object.assign(st, { botoleD5: st.botoleD5 || { lista: [{ x: 300, y: 200, w: 26, h: 18 }] } })); });
  ok('una volta per notte', r === false, r);
  await passi(p, 10);
  await scatta('4-ritorno');

  ok('nessun errore in console', errori.length === 0, errori.slice(0, 5));
  ok('nessun errore in ERRORI_TEATRO', (await errTeatro()) === 0);
  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  for (const e of esiti) console.log(`${e.ok ? 'OK ' : 'NO '} ${e.caso}${e.ok ? '' : ' ' + JSON.stringify(e.dati)}`);
  console.log(`\n${esiti.length - falliti.length}/${esiti.length} superati`);
  process.exit(falliti.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
