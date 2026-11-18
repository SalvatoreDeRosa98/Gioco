#!/usr/bin/env node
/*
 * tools/meshy-animali.js — dai modelli 3D FERMI di Meshy (animali: niente scheletro) ai fogli del Teatro.
 *
 * Meshy dà lo scheletro solo alle figure umane: gli animali escono in una posa fissa. Qui ogni fotogramma del foglio
 * è un modello visto di profilo, spostato, ruotato o schiacciato quanto serve (balzi, tremiti, cadute), nella STESSA
 * griglia dei fogli dell'autore (assets/sprite_teatro/layout.json): il gioco li usa senza cambiare una riga.
 * Il gatto ha quattro modelli (fermo, cammina, accucciato, salto), la vespa uno.
 * Risultato in gioco/assets/sprite_teatro_meshy/<foglio>.png (si accende in SPRITE_V2 di 10-sprite.js: 'meshy').
 *
 * Uso: node tools/meshy-animali.js <cartella con node_modules/three> [gatto] [vespa-cieca]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const THREE_DIR = path.resolve(process.argv[2] || '.');
const FUORI = path.join(RADICE, 'gioco', 'assets', 'sprite_teatro_meshy');
const LAYOUT = JSON.parse(fs.readFileSync(path.join(RADICE, 'gioco', 'assets', 'sprite_teatro', 'layout.json'), 'utf8'));
const STILE = { filtro: 'brightness(1.3) contrast(1.12) saturate(0.82)', velo: 'rgba(14, 9, 20, 0.3)', contorno: 2.2, inchiostro: '#070404' };

/**
 * I fogli. Per ogni fotogramma: m = modello, e (facoltativi) dy (px in su), rot (gradi), sx/sy (schiaccio),
 * k (misura rispetto alla posa di riferimento). Del foglio: parte ('sinistra' | 'destra': tiene solo quel pezzo della
 * resa), perno ('centro' per chi vola: ruota intorno al proprio centro invece che ai piedi).
 * `rif` = il modello che dà la misura: la sua altezza nella cella vale `alto` (frazione dell'altezza di riferimento).
 */
const FOGLI = {
  gatto: {
    giro: 82, alzo: 10, rif: 'gatto-fermo', alto: 0.96,
    righe: [
      [{ m: 'gatto-fermo' }, { m: 'gatto-fermo', sy: 0.975 }],
      [{ m: 'gatto-cammina', k: 1.12 }, { m: 'gatto-fermo', sy: 0.95, dy: -2 }, { m: 'gatto-cammina', k: 1.12, dy: 5, rot: -3 }, { m: 'gatto-fermo', sy: 0.97 }],
      [{ m: 'gatto-accucciato', k: 0.98 }, { m: 'gatto-accucciato', k: 0.98, sy: 0.93 }],
      [{ m: 'gatto-salto', k: 1.2, dy: 14, rot: -8 }, { m: 'gatto-salto', k: 1.2, dy: 22, rot: 4 }],
      [{ m: 'gatto-fermo', rot: -9, dy: 3 }],
      [{ m: 'gatto-fermo', rot: 10, sy: 0.92 }, { m: 'gatto-accucciato', k: 0.98, sy: 0.82 }, { m: 'gatto-accucciato', k: 1.02, sy: 0.58 }, { m: 'gatto-accucciato', k: 1.06, sy: 0.36 }],
    ],
  },
  'vespa-cieca': {
    giro: 180, alzo: 6, rif: 'vespa', alto: 0.8, parte: 'sinistra', perno: 'centro',
    righe: [
      [{ m: 'vespa' }, { m: 'vespa', sy: 0.94, dy: 3 }, { m: 'vespa', rot: -3, dy: 5 }, { m: 'vespa', sy: 0.95, dy: 2 }],
      [{ m: 'vespa', rot: 14, k: 0.95 }, { m: 'vespa', rot: 20, k: 0.95, sy: 0.95 }],
      [{ m: 'vespa', rot: -16, k: 0.92 }],
      [{ m: 'vespa', rot: 40, k: 0.86, dy: -6 }, { m: 'vespa', rot: 95, k: 0.78, dy: -14 }, { m: 'vespa', rot: 150, k: 0.7, dy: -22, sy: 0.9 }],
    ],
  },
};

(async () => {
  const soli = process.argv.slice(3);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const p = await b.newPage({ viewport: { width: 900, height: 900 } });
  const err = []; p.on('pageerror', (e) => err.push(String(e).slice(0, 200)));
  await p.route('http://resa.locale/**', (route) => {
    const u = decodeURIComponent(new URL(route.request().url()).pathname);
    const f = u === '/pagina.html' ? path.join(__dirname, 'meshy-foglio.html') : u.startsWith('/node_modules/') ? path.join(THREE_DIR, u)
      : u.startsWith('/modelli/') ? path.join(RADICE, 'meshy_output', u.slice('/modelli/'.length)) : '';
    if (!f || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'manca ' + u });
    return route.fulfill({ status: 200, contentType: f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await p.goto('http://resa.locale/pagina.html');
  await p.waitForFunction(() => window.pronta, null, { timeout: 30000 });
  fs.mkdirSync(FUORI, { recursive: true });
  for (const [nome, F] of Object.entries(FOGLI)) {
    if (soli.length && !soli.includes(nome)) continue;
    const Ly = LAYOUT[nome]; const cl = Ly.cella_l, ca = Ly.cella_a, col = Ly.colonne, margine = Ly.margine || 0;
    const modelli = [...new Set(F.righe.flat().map((c) => c.m))]; const rese = {};
    for (const m of modelli) {
      const r = await p.evaluate((o) => window.rendi(o), { url: `./modelli/${m}/${m}.glb`, L: 1000, A: 800, S: 1, giro: F.giro, alzo: F.alzo, margine: 1.08, largo: true, luce: false, tempi: [0] });
      rese[m] = r.fotogrammi[0];
    }
    const png = await p.evaluate(async ({ F, rese, cl, ca, col, margine, STILE, altoRif }) => {
      const carica = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
      // ogni resa ritagliata sul suo ingombro (e, se chiesto, sul solo pezzo di sinistra o di destra)
      const pezzi = {};
      for (const [m, src] of Object.entries(rese)) {
        const im = await carica(src); const c = Object.assign(document.createElement('canvas'), { width: im.naturalWidth, height: im.naturalHeight }); const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data; const pieno = (x) => { for (let y = 0; y < c.height; y++) if (d[(y * c.width + x) * 4 + 3] > 40) return true; return false; };
        let x0 = 0, x1 = c.width - 1; while (x0 < x1 && !pieno(x0)) x0++; while (x1 > x0 && !pieno(x1)) x1--;
        if (F.parte) { // il pezzo di sinistra (o di destra): fino alla prima colonna vuota dopo l'inizio
          if (F.parte === 'sinistra') { let x = x0; while (x < x1 && pieno(x)) x++; x1 = x - 1; } else { let x = x1; while (x > x0 && pieno(x)) x--; x0 = x + 1; }
        }
        // via i pezzetti staccati (briciole del modello): restano solo le isole grandi almeno un cinquantesimo della maggiore
        { const W = c.width, H = c.height, segno = new Int32Array(W * H), aree = [0]; const pila = [];
          for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x; if (segno[i] || d[i * 4 + 3] <= 40) continue;
            const n = aree.length; let area = 0; pila.push(i); segno[i] = n;
            while (pila.length) { const j = pila.pop(); area++; const jx = j % W, jy = (j / W) | 0;
              for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const qx = jx + ax, qy = jy + ay; if (qx < x0 || qx > x1 || qy < 0 || qy >= H) continue; const q = qy * W + qx; if (!segno[q] && d[q * 4 + 3] > 40) { segno[q] = n; pila.push(q); } } }
            aree.push(area); }
          const soglia = Math.max(...aree) / 50; const img = g.getImageData(0, 0, W, H);
          for (let i = 0; i < W * H; i++) { const x = i % W; if (x < x0 || x > x1 || (segno[i] && aree[segno[i]] < soglia)) img.data[i * 4 + 3] = 0; }
          g.putImageData(img, 0, 0); d.set(img.data); }
        while (x0 < x1 && !pieno(x0)) x0++; while (x1 > x0 && !pieno(x1)) x1--;
        let y0 = c.height, y1 = -1; for (let y = 0; y < c.height; y++) for (let x = x0; x <= x1; x++) if (d[(y * c.width + x) * 4 + 3] > 40) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
        pezzi[m] = { tela: c, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
      }
      const rif = pezzi[F.rif]; const scalaRif = (altoRif * F.alto) / rif.h; // px di cella per px di resa, sulla posa di riferimento
      const tela = Object.assign(document.createElement('canvas'), { width: cl * col, height: ca * F.righe.length }); const g = tela.getContext('2d');
      for (let ry = 0; ry < F.righe.length; ry++) for (let cx = 0; cx < F.righe[ry].length; cx++) {
        const c = F.righe[ry][cx], P = pezzi[c.m]; const s = scalaRif * (c.k || 1) * (rif.w / P.w > 0 ? 1 : 1);
        const dw = P.w * s, dh = P.h * s;
        const t = Object.assign(document.createElement('canvas'), { width: cl, height: ca }); const tg = t.getContext('2d');
        tg.imageSmoothingQuality = 'high'; tg.filter = STILE.filtro;
        // i piedi al centro in basso della cella (margine), poi spostamento, rotazione e schiaccio intorno al punto d'appoggio
        const largoMax = (cl - 8) / dw; const adatta = Math.min(1, largoMax, (ca - 6) / dh); // mai fuori dalla cella
        const centro = F.perno === 'centro'; // chi vola ruota intorno al proprio centro, chi cammina intorno ai piedi
        tg.translate(cl / 2, ca - margine - (c.dy || 0) - (centro ? (dh * adatta) / 2 : 0)); tg.rotate(((c.rot || 0) * Math.PI) / 180); tg.scale(c.sx || 1, c.sy || 1);
        tg.drawImage(P.tela, P.x, P.y, P.w, P.h, (-dw / 2) * adatta, centro ? (-dh / 2) * adatta : -dh * adatta, dw * adatta, dh * adatta);
        tg.setTransform(1, 0, 0, 1, 0, 0); tg.filter = 'none';
        tg.globalCompositeOperation = 'source-atop'; const v = tg.createLinearGradient(0, ca * 0.2, 0, ca); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, STILE.velo); tg.fillStyle = v; tg.fillRect(0, 0, cl, ca); tg.globalCompositeOperation = 'source-over';
        const sag = Object.assign(document.createElement('canvas'), { width: cl, height: ca }); const sg = sag.getContext('2d'); sg.drawImage(t, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = STILE.inchiostro; sg.fillRect(0, 0, cl, ca);
        g.save(); g.beginPath(); g.rect(cx * cl, ry * ca, cl, ca); g.clip();
        for (let a = 0; a < 16; a++) g.drawImage(sag, cx * cl + Math.cos(a / 16 * Math.PI * 2) * STILE.contorno, ry * ca + Math.sin(a / 16 * Math.PI * 2) * STILE.contorno);
        g.drawImage(t, cx * cl, ry * ca); g.restore();
      }
      return tela.toDataURL('image/png');
    }, { F, rese, cl, ca, col, margine, STILE, altoRif: Ly.altezza_rif });
    fs.writeFileSync(path.join(FUORI, nome + '.png'), Buffer.from(png.split(',')[1], 'base64'));
    console.log('scritto', nome + '.png', `${cl * col}×${ca * F.righe.length}`, 'righe', F.righe.map((r) => r.length).join(','), '(atteso', Ly.righe.map((r) => (Array.isArray(r) ? r[1] : r.fotogrammi)).join(','), ')');
  }
  if (err.length) console.log('errori:', err.slice(0, 3));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
