#!/usr/bin/env node
/*
 * tools/meshy-foglio.js — da un modello 3D animato (GLB di Meshy: camminata, corsa, figura ferma) a un foglio 2D per
 * il Teatro: una riga per posa, celle uguali, figura vista dal davanti-alto e girata di tre quarti, contorno a
 * inchiostro, piedi sempre alla stessa quota. La pagina tools/meshy-foglio.html rende col motore three.js in Chromium
 * (Playwright); il foglio si impagina su una tela 2D.
 *
 * Uso: node tools/meshy-foglio.js <configurazione.json>
 * La configurazione (esempio: production/arte/meshy/taddeo.json):
 *   modelli   cartella coi GLB scaricati da Meshy (pesanti: stanno in meshy_output/, fuori dal repository)
 *   three     cartella che contiene node_modules/three (npm install three@0.170.0 in una cartella di lavoro)
 *   uscita    il PNG da scrivere (gioco/assets/sprite_teatro/<nome>_meshy.png)
 *   L, A      misure della cella; S sovracampionamento; giro (gradi: quanto la figura è girata verso destra);
 *   alzo      gradi della camera sopra l'orizzonte; margine (altezza inquadrata / altezza della figura);
 *   filtro    filtro CSS sui colori (i modelli escono scuri); contorno (px) e colore del contorno;
 *   righe     [{ nome, file, tempi: [frazioni 0..1 del ciclo] }]
 * Stampa dove cadono testa e piedi nella cella: vanno copiati in FIGURE_M1 (gioco/teatro/m1-meshy.js).
 */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const D = __dirname;
const RADICE = path.resolve(__dirname, '..');
(async () => {
  if (!process.argv[2]) { console.error('uso: node tools/meshy-foglio.js <configurazione.json>'); process.exit(2); }
  const conf = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), 'utf8'));
  const cartella = (v) => path.resolve(RADICE, v);
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const p = await b.newPage({ viewport: { width: 900, height: 700 } });
  const err = []; p.on('pageerror', (e) => err.push(String(e).slice(0, 300))); p.on('console', (m) => { if (m.type() === 'error') err.push(m.text().slice(0, 300)); });
  // i file locali serviti sotto un indirizzo finto (fetch non legge file://)
  await p.route('http://resa.locale/**', (route) => {
    const u = decodeURIComponent(new URL(route.request().url()).pathname);
    const f = u === '/pagina.html' ? path.join(D, 'meshy-foglio.html')
      : u.startsWith('/node_modules/') ? path.join(cartella(conf.three), u)
      : u.startsWith('/modelli/') ? path.join(cartella(conf.modelli), u.slice('/modelli/'.length)) : '';
    if (!f || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'manca ' + u });
    const tipo = f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.glb') ? 'model/gltf-binary' : 'application/octet-stream';
    return route.fulfill({ status: 200, contentType: tipo, body: fs.readFileSync(f) });
  });
  await p.goto('http://resa.locale/pagina.html');
  await p.waitForFunction(() => window.pronta, null, { timeout: 30000 }).catch(() => {});
  if (err.length) console.log('errori pagina:', err);
  const righe = [];
  for (const r of conf.righe) {
    const res = await p.evaluate((o) => window.rendi(o), { url: './modelli/' + r.file, L: conf.L, A: conf.A, S: conf.S || 2, giro: conf.giro, alzo: conf.alzo, margine: conf.margine, luce: conf.luce, tempi: r.tempi });
    console.log(r.nome, 'durata', res.durata.toFixed(2), 'alt', res.alt.toFixed(3), 'terra alla riga', res.terra.toFixed(1), 'fotogrammi', res.fotogrammi.length, 'anca', res.ossa);
    righe.push({ nome: r.nome, fotogrammi: res.fotogrammi });
  }
  // impaginazione col contorno: in pagina, su una tela 2D
  const foglio = await p.evaluate(async ({ righe, L, A, contorno, colore, filtro }) => {
    const col = Math.max(...righe.map((r) => r.fotogrammi.length));
    const c = document.createElement('canvas'); c.width = col * L; c.height = righe.length * A; const g = c.getContext('2d');
    const t = document.createElement('canvas'); t.width = L; t.height = A; const tg = t.getContext('2d');
    const carica = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
    let basso = 0, alto = A;
    for (let y = 0; y < righe.length; y++) for (let x = 0; x < righe[y].fotogrammi.length; x++) {
      const im = await carica(righe[y].fotogrammi[x]);
      tg.clearRect(0, 0, L, A); tg.imageSmoothingQuality = 'high'; tg.filter = filtro || 'none'; tg.drawImage(im, 0, 0, L, A); tg.filter = 'none';
      // sagoma scura allargata = contorno a inchiostro
      const s = document.createElement('canvas'); s.width = L; s.height = A; const sg = s.getContext('2d');
      sg.drawImage(t, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = colore; sg.fillRect(0, 0, L, A);
      for (let a = 0; a < 16; a++) g.drawImage(s, x * L + Math.cos(a / 16 * Math.PI * 2) * contorno, y * A + Math.sin(a / 16 * Math.PI * 2) * contorno);
      g.drawImage(t, x * L, y * A);
      const d = tg.getImageData(0, 0, L, A).data;
      for (let yy = 0; yy < A; yy++) for (let xx = 0; xx < L; xx++) if (d[(yy * L + xx) * 4 + 3] > 128) { if (yy > basso) basso = yy; if (yy < alto) alto = yy; }
    }
    return { png: c.toDataURL('image/png'), col, basso, alto };
  }, { righe, L: conf.L, A: conf.A, contorno: conf.contorno, colore: conf.colore, filtro: conf.filtro });
  fs.writeFileSync(cartella(conf.uscita), Buffer.from(foglio.png.split(',')[1], 'base64'));
  console.log('scritto', conf.uscita, 'colonne', foglio.col, 'testa a', foglio.alto, 'piedi a', foglio.basso, 'su', conf.A, err.length ? 'ERRORI ' + JSON.stringify(err.slice(0, 3)) : '');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
