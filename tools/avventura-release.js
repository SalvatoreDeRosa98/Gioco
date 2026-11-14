#!/usr/bin/env node
/*
 * tools/avventura-release.js — l'avventura grafica in un solo file HTML.
 *
 * Uso: node tools/avventura-release.js [--uscita <file.html>]   →  production/release/avventura.html (se non indicato)
 *
 * Parte da gioco/avventura.html e:
 *  1. incorpora ogni <script src="avventura/…js"></script> nello stesso punto e nello stesso ordine;
 *  2. nell'elenco delle immagini (avventura/05-immagini.js) cambia ogni `src` in un data: URI, col PNG alleggerito
 *     da tools/ottimizza-png-release.py quando Python 3 + Pillow ci sono (altrimenti l'originale).
 * Il risultato si apre con un doppio clic, senza altri file accanto. Rif.: gioco/avventura/LEGGIMI.md.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

const RADICE = path.resolve(__dirname, '..');
const GIOCO = path.join(RADICE, 'gioco');
const SORGENTE = path.join(GIOCO, 'avventura.html');
const iUscita = process.argv.indexOf('--uscita');
const USCITA = iUscita > 0 && process.argv[iUscita + 1]
  ? path.resolve(process.argv[iUscita + 1])
  : path.join(RADICE, 'production', 'release', 'avventura.html');

/** Rende sicuro un sorgente JS dentro <script>…</script>. */
const sicuroInScript = (js) => js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

/** Data e commit da cui nasce il file unico. */
function versione() {
  let commit = '';
  try { commit = execSync('git rev-parse --short HEAD', { cwd: RADICE, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (_) { /* senza git resta la data */ }
  return `${new Date().toISOString().slice(0, 16).replace('T', ' ')}${commit ? ` · ${commit}` : ''}`;
}

/** L'elenco delle immagini con i PNG dentro: ogni "src": "assets/…png" diventa un data: URI. */
function incorporaImmagini(js, conto) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'avventura-release-'));
  const out = js.replace(/"src":\s*"(assets\/[^"]+\.png)"/g, (tutto, rel) => {
    const file = path.join(GIOCO, rel);
    if (!fs.existsSync(file)) { conto.mancanti.push(rel); return tutto; }
    let dati = fs.readFileSync(file);
    const leggero = path.join(tmp, rel.replace(/\//g, '_'));
    const r = spawnSync('python3', [path.join(__dirname, 'ottimizza-png-release.py'), file, leggero], { stdio: 'ignore' });
    if (r.status === 0 && fs.existsSync(leggero) && fs.statSync(leggero).size < dati.length) { dati = fs.readFileSync(leggero); conto.alleggerite++; }
    conto.immagini++;
    return `"src": "data:image/png;base64,${dati.toString('base64')}"`;
  });
  fs.rmSync(tmp, { recursive: true, force: true });
  return out;
}

function main() {
  let html = fs.readFileSync(SORGENTE, 'utf8');
  const conto = { immagini: 0, alleggerite: 0, mancanti: [] };
  const incorporati = []; const mancanti = [];
  let primo = true;
  html = html.replace(/<script\s+src="(avventura\/[^"]+\.js)"\s*><\/script>/g, (tutto, rel) => {
    const file = path.join(GIOCO, rel);
    if (!fs.existsSync(file)) { mancanti.push(rel); return tutto; }
    let js = fs.readFileSync(file, 'utf8');
    if (rel.endsWith('05-immagini.js')) js = incorporaImmagini(js, conto);
    incorporati.push(rel);
    let out = `<script>\n/* ${rel} */\n${sicuroInScript(js)}\n</script>`;
    if (primo) { primo = false; out = `<script>window.__avventuraVersione = ${JSON.stringify(versione())};</script>\n` + out; }
    return out;
  });
  fs.mkdirSync(path.dirname(USCITA), { recursive: true });
  fs.writeFileSync(USCITA, html);
  console.log(`scritto ${path.relative(RADICE, USCITA)} (${(fs.statSync(USCITA).size / 1024).toFixed(0)} KB)`);
  console.log(`script incorporati: ${incorporati.length}${mancanti.length ? ` · NON trovati: ${mancanti.join(', ')}` : ''}`);
  console.log(`immagini incorporate: ${conto.immagini} (alleggerite: ${conto.alleggerite})${conto.mancanti.length ? ` · mancano: ${conto.mancanti.join(', ')}` : ''}`);
  if (mancanti.length || conto.mancanti.length) process.exitCode = 1;
}

main();
