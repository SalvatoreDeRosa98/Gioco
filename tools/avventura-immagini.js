#!/usr/bin/env node
/**
 * tools/avventura-immagini.js — scrive gioco/avventura/05-immagini.js, l'elenco delle immagini che ESISTONO:
 *   fondi: tutti i PNG di gioco/assets/avventura/ (nome «avventura/<percorso>») e quelli nominati dagli elementi
 *          `immagine` e da `fondale.immagine` se il file c'è (nome = percorso sotto gioco/assets/, senza .png);
 *   fogli: i fogli di gioco/assets/sprite_teatro/ nominati dai personaggi (`figura.foglio`) e dalle icone (`icona.foglio`),
 *          a colori: la versione ripulita di gioco/assets/sprite_teatro_v2/ se c'è, altrimenti l'originale;
 *   arredi: gli oggetti di scena dell'autore (gioco/assets/sprite_teatro/scena/) che i fondali disegnano al posto
 *          della sagoma a codice (lampione, albero, statua, …), con `bb` = [x, y, w, h] della parte non trasparente.
 * Con misure (letta l'intestazione del PNG). Il motore usa SOLO queste: un PNG che manca non fa una richiesta a vuoto
 * e si disegna a codice. Rilanciare dopo aver aggiunto immagini o personaggi.
 * Uso: node tools/avventura-immagini.js [--controlla]   (--controlla: esce con 1 se il file scritto sarebbe diverso)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { caricaStoria, RADICE } = require('./avventura-valida.js');

const GIOCO = path.join(RADICE, 'gioco');
const ASSETS = path.join(GIOCO, 'assets');
const USCITA = path.join(GIOCO, 'avventura', '05-immagini.js');

function misure(file) {
  const b = Buffer.alloc(24); const fd = fs.openSync(file, 'r'); fs.readSync(fd, b, 0, 24, 0); fs.closeSync(fd);
  if (b.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
/** Il riquadro [x, y, w, h] dei pixel non trasparenti (alfa > 24) di un PNG RGBA/RGB a 8 bit, o null. */
function riquadro(file) {
  const b = fs.readFileSync(file); let p = 8, w = 0, h = 0, tipo = 0, prof = 0, inter = 0; const dati = [];
  while (p < b.length) {
    const L = b.readUInt32BE(p), t = b.toString('ascii', p + 4, p + 8), c = b.subarray(p + 8, p + 8 + L);
    if (t === 'IHDR') { w = c.readUInt32BE(0); h = c.readUInt32BE(4); prof = c[8]; tipo = c[9]; inter = c[12]; }
    else if (t === 'IDAT') dati.push(c); else if (t === 'IEND') break;
    p += 12 + L;
  }
  const bpp = tipo === 6 ? 4 : tipo === 2 ? 3 : 0; if (!bpp || prof !== 8 || inter) return null;
  const raw = require('zlib').inflateSync(Buffer.concat(dati)), riga = w * bpp, px = Buffer.alloc(riga * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (riga + 1)], src = y * (riga + 1) + 1, o = y * riga;
    for (let i = 0; i < riga; i++) {
      const a = i >= bpp ? px[o + i - bpp] : 0, u = y ? px[o - riga + i] : 0, ul = y && i >= bpp ? px[o - riga + i - bpp] : 0;
      let v = raw[src + i];
      if (f === 1) v += a; else if (f === 2) v += u; else if (f === 3) v += (a + u) >> 1;
      else if (f === 4) { const q = a + u - ul, pa = Math.abs(q - a), pb = Math.abs(q - u), pc = Math.abs(q - ul); v += pa <= pb && pa <= pc ? a : pb <= pc ? u : ul; }
      px[o + i] = v & 255;
    }
  }
  if (bpp === 3) return [0, 0, w, h];
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[y * riga + x * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}
function voce(rel) {
  const file = path.join(ASSETS, rel + '.png');
  if (!fs.existsSync(file)) return null;
  const m = misure(file); if (!m) return null;
  return { src: 'assets/' + rel + '.png', w: m.w, h: m.h };
}
function scorri(dir, base, fuori) {
  if (!fs.existsSync(dir)) return;
  for (const n of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) scorri(p, base + n + '/', fuori);
    else if (n.endsWith('.png')) fuori.push(base + n.slice(0, -4));
  }
}

const S = caricaStoria();
// la storia-campione delle prove del motore nomina gli stessi fogli: la si legge per non perderli nella pagina di prova
const campione = caricaStoria(path.join(RADICE, 'tools', 'avventura-campione'));
const fondi = {}; const fogli = {};
const nomiFondi = []; scorri(path.join(ASSETS, 'avventura'), 'avventura/', nomiFondi);
const nomiFogli = new Set();
for (const T of [S, campione]) {
  for (const Q of T.quadro.values()) {
    const fd = Q.fondale || {};
    if (fd.immagine) nomiFondi.push(fd.immagine);
    for (const el of fd.disegno || []) if (Array.isArray(el) && el[0] === 'immagine' && el[1] && el[1].nome) nomiFondi.push(el[1].nome);
  }
  for (const P of T.personaggio.values()) if (P.figura && P.figura.foglio) nomiFogli.add(P.figura.foglio);
  for (const O of T.oggetto.values()) if (O.icona && O.icona.foglio) nomiFogli.add(O.icona.foglio);
}
for (const n of nomiFondi) { const v = voce(n); if (v) fondi[n] = v; }
// stessa versione dei fogli che usa il Teatro: tabella SPRITE_V2 di teatro/10-sprite.js (false = l'originale dell'autore)
function tabellaSpriteV2() {
  const f = path.join(GIOCO, 'teatro', '10-sprite.js');
  const m = fs.existsSync(f) ? /\/\/ <sprite-v2>([\s\S]*?)\/\/ <\/sprite-v2>/.exec(fs.readFileSync(f, 'utf8')) : null;
  if (!m) return {};
  const ambiente = { Object };
  require('vm').runInNewContext(m[1].replace('const SPRITE_V2 =', 'SPRITE_V2 ='), ambiente);
  return ambiente.SPRITE_V2 || {};
}
const V2 = tabellaSpriteV2();
const CARTELLE_V2 = { leggera: 'sprite_teatro_v2/', ombre: 'sprite_teatro_v2_ombre/' };
// i fogli a griglia del Teatro (più righe di pose): misure e righe da assets/sprite_teatro/layout.json
const fileLayout = path.join(ASSETS, 'sprite_teatro', 'layout.json');
const LAYOUT = fs.existsSync(fileLayout) ? JSON.parse(fs.readFileSync(fileLayout, 'utf8')) : {};
function griglia(n) {
  const L = LAYOUT[n]; if (!L || !L.cella_l || !Array.isArray(L.righe)) return null;
  const righe = L.righe.map((r) => (Array.isArray(r) ? [r[0], r[1]] : [r.posa, r.fotogrammi]));
  const m = L.margine || 0; const a = L.altezza_rif || (L.cella_a - 2 * m);
  return { cl: L.cella_l, ca: L.cella_a, righe, top: +(m / L.cella_a).toFixed(3), bot: +((m + a) / L.cella_a).toFixed(3) };
}
// L'avventura vuole le figure A COLORI, come Ferruccio: la versione ripulita (sprite_teatro_v2/) se c'è, altrimenti
// l'originale dell'autore; mai quella scurita «a ombre» del Teatro. Dove la tabella dice `false` resta l'originale.
for (const n of [...nomiFogli].sort()) {
  const v = (V2[n] !== false && voce(CARTELLE_V2.leggera + n)) || voce('sprite_teatro/' + n);
  if (!v) continue;
  const g = griglia(n); if (g) v.griglia = g;
  fogli[n] = v;
}

// gli oggetti di scena dell'autore che i fondali usano (nome = come li chiama 10-disegno.js)
const ARREDI = {
  lampione: 'sprite_teatro/scena/ostacolo-lampione', albero: 'sprite_teatro/scena/ostacolo-albero',
  statua: 'sprite_teatro/scena/ostacolo-statua', telaio: 'sprite_teatro/scena/ostacolo-telaio',
  colonna: 'sprite_teatro/scena/ostacolo-colonna', aiuola: 'sprite_teatro/scena/ostacolo-aiuola',
  fontanella: 'sprite_teatro/scena/ostacolo-fontanella', banco: 'sprite_teatro/scena/banchetto-tonino',
};
const arredi = {};
for (const [n, rel] of Object.entries(ARREDI)) {
  const v = voce(rel); if (!v) continue;
  const bb = riquadro(path.join(ASSETS, rel + '.png')); if (bb) v.bb = bb;
  arredi[n] = v;
}

const testo = `/*
 * avventura/05-immagini.js — GENERATO da tools/avventura-immagini.js: non modificare a mano.
 * Le immagini che esistono davvero (con misure). Ciò che non è qui si disegna a codice.
 */
AV.immagini = ${JSON.stringify({ fondi, fogli, arredi }, null, 1)};
`;
if (process.argv.includes('--controlla')) {
  const ora = fs.existsSync(USCITA) ? fs.readFileSync(USCITA, 'utf8') : '';
  console.log(ora === testo ? '05-immagini.js aggiornato' : '05-immagini.js da rigenerare');
  process.exit(ora === testo ? 0 : 1);
}
fs.writeFileSync(USCITA, testo);
console.log(`scritto ${path.relative(RADICE, USCITA)}: fondi ${Object.keys(fondi).length}, fogli ${Object.keys(fogli).length}, arredi ${Object.keys(arredi).length}`);
