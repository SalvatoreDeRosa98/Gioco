#!/usr/bin/env node
/*
 * tools/qa-teatro-cestino.js — verifica Playwright del cestino degli slot col tocco (f1, t3-economia-salvataggi.js).
 *
 * Telefono Android in verticale (tocchi veri via CDP). Crea lo slot 2, tocca il cestino, controlla la domanda
 * «Cancellare questo salvataggio?» con «No» evidenziato, tocca No (lo slot resta), ritocca il cestino, tocca Sì
 * (lo slot è vuoto). Poi su PC: il tasto [Canc] apre la conferma di sempre e [Invio] cancella (invariato).
 *
 * Uso: node tools/qa-teatro-cestino.js <file html> [prefisso screenshot]. Esce con 1 se un controllo fallisce.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium, devices } = require('playwright');
const { aspetta } = require('./qa-teatro-comune');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-cestino');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

const SLOT = 2; // lo slot di prova
const DATI_SLOT = { personaggio: 'ferruccio', pianoMassimo: 3, scintille: 7, flag: {} };
const MENU = { rigaY: 284, rigaH: 14, boxX: 84, boxW: 100, boxGap: 4 }; // CONFIG.menu di t3
const BTN_SI = { x: 172 + 75, y: 210 + 13 }, BTN_NO = { x: 336 + 66, y: 210 + 13 };
const cestino = (n) => ({ x: MENU.boxX + (n - 1) * (MENU.boxW + MENU.boxGap) + MENU.boxW - 8, y: MENU.rigaY + MENU.rigaH / 2 });

const esiti = [];
const errori = [];
const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });

async function apri(browser, opzioni) {
  const cx = await browser.newContext(opzioni);
  const p = await cx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  await p.goto('file://' + file);
  await p.evaluate(([n, d]) => {
    localStorage.clear();
    localStorage.setItem('ferruccio.teatro.slot.' + n, JSON.stringify({ ...d, data: new Date().toISOString() }));
  }, [SLOT, DATI_SLOT]);
  await p.reload();
  await aspetta(p, 700);
  return { cx, p };
}

// Lo slot ATTIVO cancellato si ricrea subito nuovo (t3 slotCorrente: piano 1, 0 scintille): «pieno» = ha ancora i dati di prova.
const slotPieno = (p) => p.evaluate(([n, d]) => { const s = window.__teatroT3.salvataggi.leggi(n);
  return Boolean(s && s.pianoMassimo === d.pianoMassimo && s.scintille === d.scintille); }, [SLOT, DATI_SLOT]);
const fase = (p) => p.evaluate(() => window.__teatro.interni.statoRun.fase);

(async () => {
  const browser = await chromium.launch();
  try {
    // ---------------------------------------------------------------- tocco
    const { cx, p } = await apri(browser, { viewport: { width: 416, height: 657 }, deviceScaleFactor: 3, isMobile: true,
      hasTouch: true, userAgent: devices['Pixel 7'].userAgent });
    const cdp = await cx.newCDPSession(p);
    const punto = (x, y) => p.evaluate(([x, y]) => { const r = document.getElementById('c').getBoundingClientRect(); return { x: r.left + (x * r.width) / 640, y: r.top + (y * r.height) / 360 }; }, [x, y]);
    const tocca = async (x, y) => {
      const q = await punto(x, y);
      const tp = [{ x: Math.round(q.x), y: Math.round(q.y), id: 9, radiusX: 9, radiusY: 9, force: 1 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp });
      await p.waitForTimeout(60);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: tp });
      await aspetta(p, 160);
    };
    ok('menu di selezione all\'avvio', (await fase(p)) === 'menu_selezione', await fase(p));
    ok('slot di prova creato', await slotPieno(p));
    await tocca(320, 120); // primo dito: lo strato a tocco si accende
    const disp = await p.evaluate(() => window.__teatro.interni.comandiB3.stato.dispositivo);
    ok('dispositivo tocco', disp === 'tocco', disp);
    await p.screenshot({ path: foto('01-cestino') });
    const c = cestino(SLOT);
    await tocca(c.x, c.y);
    await p.screenshot({ path: foto('02-conferma') });
    const testo = await p.evaluate(() => (window.__teatro.interni.testiDisegnati || []).join('|')).catch(() => '');
    ok('il cestino apre la conferma (slot ancora pieno)', await slotPieno(p), testo || undefined);
    await tocca(BTN_NO.x, BTN_NO.y);
    ok('«No» lascia lo slot', await slotPieno(p));
    await tocca(c.x, c.y);
    await p.screenshot({ path: foto('03-conferma-di-nuovo') });
    await tocca(BTN_SI.x, BTN_SI.y);
    ok('«Sì» svuota lo slot', !(await slotPieno(p)));
    await p.screenshot({ path: foto('04-cancellato') });
    await cx.close();

    // ---------------------------------------------------------------- tastiera (invariata)
    const pc = await apri(browser, { viewport: { width: 1280, height: 720 } });
    await pc.p.evaluate((n) => window.__teatroT3.salvataggi.scegli(n), SLOT);
    await pc.p.keyboard.press('Delete');
    await aspetta(pc.p, 150);
    await pc.p.screenshot({ path: foto('05-pc-conferma') });
    ok('PC: [Canc] non cancella da solo', await slotPieno(pc.p));
    await pc.p.keyboard.press('Enter');
    await aspetta(pc.p, 150);
    ok('PC: [Invio] conferma la cancellazione come prima', !(await slotPieno(pc.p)));
    await pc.cx.close();
  } finally { await browser.close(); }
  ok('nessun errore in console', errori.length === 0, errori.slice(0, 3));
  for (const e of esiti) console.log(`${e.ok ? 'OK  ' : 'NO  '} ${e.caso}${e.dati !== undefined ? ' ' + JSON.stringify(e.dati) : ''}`);
  const rossi = esiti.filter((e) => !e.ok).length;
  console.log(rossi ? `ROSSO: ${rossi} controlli falliti` : `VERDE: ${esiti.length} controlli`);
  process.exit(rossi ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
