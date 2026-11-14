#!/usr/bin/env node
/**
 * tools/avventura-immagini.js — scrive gioco/avventura/05-immagini.js, l'elenco delle immagini che ESISTONO:
 *   fondi: tutti i PNG di gioco/assets/avventura/ (nome «avventura/<percorso>») e quelli nominati dagli elementi
 *          `immagine` e da `fondale.immagine` se il file c'è (nome = percorso sotto gioco/assets/, senza .png);
 *   fogli: i fogli di gioco/assets/sprite_teatro/ nominati dai personaggi (`figura.foglio`) e dalle icone (`icona.foglio`),
 *          nella versione che usa anche il Teatro (tabella SPRITE_V2 di gioco/teatro/10-sprite.js).
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
for (const n of [...nomiFogli].sort()) {
  const v = (CARTELLE_V2[V2[n]] && voce(CARTELLE_V2[V2[n]] + n)) || voce('sprite_teatro/' + n);
  if (!v) continue;
  const g = griglia(n); if (g) v.griglia = g;
  fogli[n] = v;
}

const testo = `/*
 * avventura/05-immagini.js — GENERATO da tools/avventura-immagini.js: non modificare a mano.
 * Le immagini che esistono davvero (con misure). Ciò che non è qui si disegna a codice.
 */
AV.immagini = ${JSON.stringify({ fondi, fogli }, null, 1)};
`;
if (process.argv.includes('--controlla')) {
  const ora = fs.existsSync(USCITA) ? fs.readFileSync(USCITA, 'utf8') : '';
  console.log(ora === testo ? '05-immagini.js aggiornato' : '05-immagini.js da rigenerare');
  process.exit(ora === testo ? 0 : 1);
}
fs.writeFileSync(USCITA, testo);
console.log(`scritto ${path.relative(RADICE, USCITA)}: fondi ${Object.keys(fondi).length}, fogli ${Object.keys(fogli).length}`);
