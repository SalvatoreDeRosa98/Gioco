#!/usr/bin/env node
/*
 * tools/qa-teatro-avvio.js — verifica Playwright del bug autore «il gioco non è partito nell'hub iniziale».
 *
 * Uso: node tools/qa-teatro-avvio.js <file html> [prefisso screenshot]
 * Da file://, 1280x720. Ogni modo di iniziare deve portare all'hub di Piazza Dante (fase 'hub'), mai
 * direttamente al piano: Spazio e Invio nel menu, click sulla carta selezionata, click su una carta non
 * selezionata e poi di nuovo, doppio click, pulsante «Inizia», con slot vuoto e con slot già usato, dopo una
 * ricarica, dopo menu ESC → Menù personaggi, dopo menu ESC → Ricomincia notte (tasto R e click), dopo la morte.
 * Screenshot in production/qa/evidence/teatro-bug-avvio-[<prefisso>-]*.png. Esce con 1 se un caso fallisce.
 * Chromium preinstallato nella sessione: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] ? process.argv[3] + '-' : '';
// un prefisso assoluto (es. cartella scratchpad) scrive lì, fuori dal repo
const foto = (n) => (path.isAbsolute(process.argv[3] || '') ? process.argv[3] + '-' + n + '.png'
  : path.join(RADICE, 'production', 'qa', 'evidence', `teatro-bug-avvio-${prefisso}${n}.png`));

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const fase = () => p.evaluate(() => window.__teatro.fase);
  /** Punto della pagina che corrisponde a (x, y) nelle coordinate logiche 640x360 del canvas. */
  const punto = (x, y) => p.evaluate(([x, y]) => {
    const c = document.querySelector('canvas'); const r = c.getBoundingClientRect();
    return { x: r.left + (x * r.width) / window.__teatro.interni.W, y: r.top + (y * r.height) / window.__teatro.interni.H };
  }, [x, y]);
  const clicca = async (x, y, n = 1) => { const q = await punto(x, y); await p.mouse.click(q.x, q.y, { clickCount: n }); };
  const alMenu = async () => {
    await p.evaluate(() => { const R = window.__teatro.interni.statoRun; R.pausa = false; R.fase = 'menu_selezione'; R.siparioAttivo = null; });
    await p.waitForTimeout(150);
  };
  const verifica = async (nome) => {
    await p.waitForTimeout(400);
    const f = await fase();
    const s = await p.evaluate(() => ({ stanza: window.__teatro.stanza, notte: window.__teatro.interni.statoRun.numeroNotte }));
    esiti.push({ caso: nome, fase: f, ok: f === 'hub', notte: s.notte });
    if (f !== 'hub') await p.screenshot({ path: foto('FALLITO-' + nome) });
    return f;
  };
  const chiudiDialogo = async () => {
    for (let i = 0; i < 40; i++) {
      const d = await p.evaluate(() => window.__teatro.t4qa.dialogo);
      if (!d) return;
      await p.keyboard.press(d.scelta ? 'Digit1' : 'Space');
      await p.waitForTimeout(40);
    }
  };
  const entraNelPiano = async () => {
    await chiudiDialogo();
    const ing = await p.evaluate(() => window.__teatro.t4qa.ingresso);
    await p.evaluate((g) => { const P = window.__teatro.interni.player; P.x = g.x - 40; P.y = g.y; }, ing);
    await p.keyboard.down('KeyD'); await p.waitForTimeout(900); await p.keyboard.up('KeyD');
    return fase();
  };
  const CARTA = (i) => [35 + i * 146 + 66, 56 + 112];

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  // (miglioramento 6) qui si provano i modi di partire con ogni burattino: tutti sbloccati (QA)
  await p.evaluate(() => window.__teatro.interni.sbloccaTutto?.());
  await p.reload();
  await p.waitForTimeout(500);
  await p.screenshot({ path: foto('01-menu-slot-vuoto') });
  await p.keyboard.press('Space');
  await verifica('spazio-slot-vuoto');
  await p.screenshot({ path: foto('02-hub-dal-menu') });
  await alMenu(); await p.keyboard.press('Enter'); await verifica('invio');
  await alMenu(); await clicca(...CARTA(0)); await verifica('click-carta-selezionata');
  await alMenu(); await clicca(...CARTA(1)); await p.waitForTimeout(100); await clicca(...CARTA(1)); await verifica('click-altra-carta-due-volte');
  await alMenu(); await clicca(...CARTA(2), 2); await verifica('doppio-click-carta');
  await alMenu(); await clicca(320, 320); await verifica('pulsante-inizia');
  await alMenu(); await clicca(320, 320, 2); await verifica('pulsante-inizia-doppio-click');
  await alMenu(); await p.keyboard.press('Digit1'); await p.keyboard.press('Space');
  // nel piano: ESC → Ricomincia notte (R) → hub, non il piano
  await verifica('spazio-di-nuovo');
  const f1 = await entraNelPiano();
  esiti.push({ caso: 'ingresso-porta-hub-porta-al-piano', fase: f1, ok: f1 === 'in_gioco' });
  await p.keyboard.press('Space'); // sipario
  await p.keyboard.press('Escape'); await p.waitForTimeout(100); await p.keyboard.press('KeyR');
  await verifica('esc-ricomincia-tasto-R');
  await entraNelPiano(); await p.keyboard.press('Space');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  await clicca(320, 42 + 162 + 13); // Ricomincia Notte
  await verifica('esc-ricomincia-click');
  await p.screenshot({ path: foto('03-hub-dopo-ricomincia') });
  await entraNelPiano(); await p.keyboard.press('Space');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  await clicca(320, 42 + 196 + 13); // Menù Personaggi
  await p.waitForTimeout(200);
  esiti.push({ caso: 'esc-menu-personaggi-porta-al-menu', fase: await fase(), ok: (await fase()) === 'menu_selezione' });
  await p.keyboard.press('Space');
  await verifica('menu-personaggi-poi-spazio');
  // morte → hub
  await entraNelPiano(); await p.keyboard.press('Space');
  await p.evaluate(() => window.__teatro.t4qa.morteForzata());
  await p.waitForTimeout(4200);
  await verifica('dopo-morte');
  // slot già usato, dopo una ricarica
  await p.reload(); await p.waitForTimeout(500);
  await p.screenshot({ path: foto('04-menu-slot-usato') });
  const usato = await p.evaluate(() => Boolean(window.__teatroT3.salvataggi.leggi(window.__teatroT3.salvataggi.slotAttivo)));
  await p.keyboard.press('Space');
  const fu = await verifica('ricarica-slot-usato');
  esiti[esiti.length - 1].slotUsato = usato;
  await p.reload(); await p.waitForTimeout(500);
  await clicca(320, 320);
  await verifica('ricarica-pulsante-inizia');
  await p.screenshot({ path: foto('05-hub-dopo-ricarica') });
  await browser.close();
  console.log(JSON.stringify({ file: path.relative(RADICE, file), esiti, errori }, null, 1));
  process.exit(esiti.every((e) => e.ok) && !errori.length && fu === 'hub' ? 0 : 1);
})();
