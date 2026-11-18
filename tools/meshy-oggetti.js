#!/usr/bin/env node
/*
 * tools/meshy-oggetti.js — dai modelli 3D fermi di Meshy (oggetti di scena) alle immagini 2D del Teatro, in stile cupo.
 *
 * Per ogni oggetto rende il modello (tools/meshy-foglio.html, three.js in Chromium) e lo impagina in un PNG con la
 * STESSA tela e lo STESSO ingombro del disegno dell'autore (gioco/assets/sprite_teatro/scena/ostacolo-<nome>.png):
 * così ancore e altezze della tabella di b9-immagini.js valgono senza toccarle. Il risultato va in
 * gioco/assets/sprite_teatro_meshy/scena/ (i disegni dell'autore restano dove sono).
 * Stile cupo: colori smorzati e scuriti, ombra che cresce verso il basso, contorno a inchiostro.
 *
 * Uso: node tools/meshy-oggetti.js <cartella con node_modules/three> [nome nome …]
 * I modelli si cercano in meshy_output/<nome>/<nome>.glb (tools/meshy-lotto.js).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const THREE_DIR = path.resolve(process.argv[2] || '.');
const ORIG = path.join(RADICE, 'gioco', 'assets', 'sprite_teatro', 'scena');
const FUORI = path.join(RADICE, 'gioco', 'assets', 'sprite_teatro_meshy', 'scena');
/** Oggetti: giro e alzo della vista; `celle` quando il disegno dell'autore ha più celle in riga. */
const OGGETTI = {
  lampione: {}, botte: {}, fontanella: {}, statua: {}, carretto: { giro: -18 }, albero: {}, telaio: {}, colonna: {}, panchina: { alzo: 24 },
  braciere: { celle: 2, cellaModello: 1, spento: 0 }, candelabro: {}, arcolaio: {}, 'balla-seta': {}, aiuola: {}, sacco: {}, 'cassa-polvere': {},
};
const STILE = { filtro: 'brightness(0.95) contrast(1.14) saturate(0.7)', velo: 'rgba(16, 10, 22, 0.34)', contorno: 2.4, inchiostro: '#0a0605', scala: 2, giro: 0, alzo: 9 };

(async () => {
  const soli = process.argv.slice(3);
  const nomi = Object.keys(OGGETTI).filter((n) => (!soli.length || soli.includes(n)) && fs.existsSync(path.join(RADICE, 'meshy_output', n, n + '.glb')));
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const p = await b.newPage({ viewport: { width: 900, height: 900 } });
  const err = []; p.on('pageerror', (e) => err.push(String(e).slice(0, 200)));
  await p.route('http://resa.locale/**', (route) => {
    const u = decodeURIComponent(new URL(route.request().url()).pathname);
    const f = u === '/pagina.html' ? path.join(__dirname, 'meshy-foglio.html')
      : u.startsWith('/node_modules/') ? path.join(THREE_DIR, u)
      : u.startsWith('/modelli/') ? path.join(RADICE, 'meshy_output', u.slice('/modelli/'.length))
      : u.startsWith('/originali/') ? path.join(ORIG, u.slice('/originali/'.length)) : '';
    if (!f || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'manca ' + u });
    const tipo = f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream';
    return route.fulfill({ status: 200, contentType: tipo, body: fs.readFileSync(f) });
  });
  await p.goto('http://resa.locale/pagina.html');
  await p.waitForFunction(() => window.pronta, null, { timeout: 30000 });
  fs.mkdirSync(FUORI, { recursive: true });
  for (const nome of nomi) {
    const O = OGGETTI[nome];
    const resa = await p.evaluate((o) => window.rendi(o), { url: `./modelli/${nome}/${nome}.glb`, L: 900, A: 900, S: 1, giro: O.giro === undefined ? STILE.giro : O.giro, alzo: O.alzo === undefined ? STILE.alzo : O.alzo, margine: 1.1, largo: true, luce: false, tempi: [0] });
    const png = await p.evaluate(async ({ nome, foto, O, STILE }) => {
      const carica = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
      const riquadro = (g, x0, y0, w, h) => { const d = g.getImageData(x0, y0, w, h).data; let a = w, b = h, c = -1, e = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > e) e = y; }
        return c < 0 ? null : { x: a, y: b, w: c - a + 1, h: e - b + 1 }; };
      const orig = await carica(`./originali/ostacolo-${nome}.png`); const fot = await carica(foto);
      const celle = O.celle || 1, k = STILE.scala, cw = orig.naturalWidth / celle, ch = orig.naturalHeight;
      const og = Object.assign(document.createElement('canvas'), { width: orig.naturalWidth, height: ch }).getContext('2d', { willReadFrequently: true }); og.drawImage(orig, 0, 0);
      const fg = Object.assign(document.createElement('canvas'), { width: fot.naturalWidth, height: fot.naturalHeight }).getContext('2d', { willReadFrequently: true }); fg.drawImage(fot, 0, 0);
      const rf = riquadro(fg, 0, 0, fot.naturalWidth, fot.naturalHeight);
      const tela = Object.assign(document.createElement('canvas'), { width: orig.naturalWidth * k, height: ch * k }); const g = tela.getContext('2d');
      for (let c = 0; c < celle; c++) {
        // l'ingombro del disegno dell'autore nella cella del modello (per il braciere: quella accesa)
        const rifCella = O.cellaModello === undefined ? c : O.cellaModello;
        const ro = riquadro(og, rifCella * cw, 0, cw, ch);
        const s = Math.min(ro.h / rf.h, (cw - 4) / rf.w) * k;                 // stessa altezza del disegno (senza uscire dalla cella)
        const dw = rf.w * s, dh = rf.h * s, dx = c * cw * k + (ro.x + ro.w / 2) * k - dw / 2, dy = (ro.y + ro.h) * k - dh; // stessa base, stesso asse
        // la figura scurita su una tela d'appoggio: filtro, velo che cresce verso il basso, poi contorno a inchiostro
        const t = Object.assign(document.createElement('canvas'), { width: cw * k, height: ch * k }); const tg = t.getContext('2d');
        tg.imageSmoothingQuality = 'high'; tg.filter = STILE.filtro; tg.drawImage(fot, rf.x, rf.y, rf.w, rf.h, dx - c * cw * k, dy, dw, dh); tg.filter = 'none';
        tg.globalCompositeOperation = 'source-atop'; const v = tg.createLinearGradient(0, dy, 0, dy + dh); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, STILE.velo); tg.fillStyle = v; tg.fillRect(0, 0, cw * k, ch * k);
        tg.globalCompositeOperation = 'source-over';
        if (O.spento === c) { // la cella spenta: via ciò che sta sopra l'orlo del disegno spento dell'autore, e i colori del fuoco
          tg.clearRect(0, 0, cw * k, dy + dh * 0.44); // il fuoco occupa la parte alta del modello acceso
          const z = Object.assign(document.createElement('canvas'), { width: cw * k, height: ch * k }); const zg = z.getContext('2d'); zg.filter = 'grayscale(0.85) brightness(0.7)'; zg.drawImage(t, 0, 0);
          tg.clearRect(0, 0, cw * k, ch * k); tg.drawImage(z, 0, 0);
        }
        const sag = Object.assign(document.createElement('canvas'), { width: cw * k, height: ch * k }); const sg = sag.getContext('2d');
        sg.drawImage(t, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = STILE.inchiostro; sg.fillRect(0, 0, cw * k, ch * k);
        g.save(); g.beginPath(); g.rect(c * cw * k, 0, cw * k, ch * k); g.clip();
        for (let a = 0; a < 16; a++) g.drawImage(sag, c * cw * k + Math.cos(a / 16 * Math.PI * 2) * STILE.contorno, Math.sin(a / 16 * Math.PI * 2) * STILE.contorno);
        g.drawImage(t, c * cw * k, 0); g.restore();
      }
      return tela.toDataURL('image/png');
    }, { nome, foto: resa.fotogrammi[0], O, STILE });
    fs.writeFileSync(path.join(FUORI, `ostacolo-${nome}.png`), Buffer.from(png.split(',')[1], 'base64'));
    console.log('scritto', `ostacolo-${nome}.png`);
  }
  if (err.length) console.log('errori:', err.slice(0, 3));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
