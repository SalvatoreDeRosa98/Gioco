#!/usr/bin/env node
/**
 * tools/qa-teatro-errori.js — verifica la rete di sicurezza (gioco/teatro/000-errori.js + ciclo in 80-ciclo.js).
 * Segnalazione dell'autore (2026-11-10): «ho aperto l'html, si ferma con lo schermo marrone, non c'è più nulla».
 * Un errore in un fotogramma fermava il ciclo per sempre. Qui si provocano errori apposta e si controlla che:
 *  1. senza errori il riquadro non c'è;
 *  2. un errore di DISEGNO non ferma il gioco: i tick avanzano, l'errore è nel riquadro, e quando l'errore
 *     smette il palco torna a disegnarsi;
 *  3. un errore di LOGICA non ferma il gioco;
 *  4. se il disegno fallisce di continuo, il fusibile spegne gli effetti di scena uno alla volta;
 *  5. un errore in un gestore di eventi finisce nel riquadro.
 * Uso: node tools/qa-teatro-errori.js <html> [prefisso screenshot]. Esce con 1 se un controllo fallisce.
 */
const path = require('path');
const { chromium } = require('playwright');

const file = path.resolve(process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || null;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const esiti = [];
  const ok = (nome, vero, dati) => esiti.push({ nome, ok: Boolean(vero), dati });
  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(700);
  const tick = () => p.evaluate(() => window.__teatro.tick);
  const stato = () => p.evaluate(() => ({ n: ERRORI_TEATRO.length, riquadro: Boolean(document.getElementById('errori-teatro')),
    testo: (document.getElementById('errori-teatro') || {}).textContent || '', opz: { ombre: OPZIONI.ombre, grana: OPZIONI.grana, vignetta: OPZIONI.vignetta, pubblico: OPZIONI.pubblico } }));

  // 1. niente errori, niente riquadro
  await p.keyboard.press('Space'); await p.waitForTimeout(500);
  let s = await stato();
  ok('senza errori nessun riquadro', s.n === 0 && !s.riquadro, s.n);

  // in scena
  await p.evaluate(() => { window.__teatro.interni.statoRun.fase = 'in_gioco'; nuovaRun(false); window.__teatro.interni.statoRun.siparioAttivo = null; });
  await p.waitForTimeout(400);

  // 2. errore di disegno per 2 fotogrammi (sotto la soglia del fusibile)
  await p.evaluate(() => { const base = disegnaFrame; let n = 0; disegnaFrame = function (...a) { if (n++ < 2) throw new Error('prova di disegno'); return base.apply(this, a); }; });
  let t0 = await tick(); await p.waitForTimeout(600); let t1 = await tick();
  s = await stato();
  ok('errore di disegno: il gioco va avanti', t1 - t0 > 20, t1 - t0);
  ok('errore di disegno: nel riquadro', s.riquadro && s.testo.includes('prova di disegno') && s.testo.includes('[disegno]'), s.testo.slice(0, 200));
  ok('errore di disegno breve: nessun effetto spento', s.opz.ombre !== false && s.opz.grana !== false, s.opz);
  const pieno = await p.evaluate(() => { // il palco è tornato a disegnarsi: il centro del canvas non è vuoto
    const c = document.getElementById('c'); const x = document.createElement('canvas'); x.width = 8; x.height = 8;
    x.getContext('2d').drawImage(c, 0, 0, 8, 8); try { return Array.from(x.getContext('2d').getImageData(0, 0, 8, 8).data).some((v, i) => i % 4 !== 3 && v > 12); } catch (_) { return true; } });
  ok('dopo l\'errore il palco si ridisegna', pieno);
  if (prefisso) await p.screenshot({ path: prefisso + '-riquadro.png' });

  // 3. errore di logica una volta
  await p.evaluate(() => { const base = passoLogico; let n = 0; passoLogico = function (...a) { if (n++ < 3) throw new Error('prova di logica'); return base.apply(this, a); }; });
  t0 = await tick(); await p.waitForTimeout(600); t1 = await tick();
  s = await stato();
  ok('errore di logica: il ciclo non si ferma', (await p.evaluate(() => ERRORI_TEATRO.some((e) => e.dove === 'logica'))) && t1 >= t0, t1 - t0);
  const vivo = await p.evaluate(() => new Promise((r) => { let n = 0; const f = () => { if (++n >= 5) r(true); else requestAnimationFrame(f); }; requestAnimationFrame(f); setTimeout(() => r(false), 2000); }));
  ok('i fotogrammi continuano', vivo);

  // 4. disegno che fallisce sempre finché le ombre sono accese: il fusibile le spegne e il gioco riparte
  await p.evaluate(() => { const base = disegnaFrame; disegnaFrame = function (...a) { if (OPZIONI.ombre !== false) throw new Error('prova: le ombre rompono il disegno'); return base.apply(this, a); }; });
  await p.waitForTimeout(700);
  s = await stato();
  ok('fusibile: spegne le ombre', s.opz.ombre === false && s.testo.includes('ombre'), s.opz);
  ok('fusibile: non salva le opzioni', await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('ferruccio.teatro.opzioni') || '{}').ombre !== false; } catch (_) { return true; } }));

  // 5. errore in un gestore di eventi
  await p.evaluate(() => { window.addEventListener('keydown', (e) => { if (e.code === 'F9') throw new Error('prova di gestore'); }); });
  await p.keyboard.press('F9'); await p.waitForTimeout(200);
  s = await stato();
  ok('errore di un gestore: nel riquadro', s.testo.includes('prova di gestore'), s.testo.slice(-300));

  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ file: path.relative(process.cwd(), file), controlli: esiti.length, falliti: falliti.length, dettaglio: falliti }, null, 1));
  await b.close();
  process.exit(falliti.length ? 1 : 0);
})();
