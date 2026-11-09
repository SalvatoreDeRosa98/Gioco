#!/usr/bin/env node
/*
 * tools/teatro-release.js — build del Teatro delle Marionette in un solo file HTML.
 *
 * Uso: node tools/teatro-release.js   →  production/release/teatro.html
 *
 * Parte da gioco/teatro_marionette.html e:
 *  1. incorpora inline ogni <script src="teatro/*.js"></script> il cui file esiste in gioco/teatro/
 *     (T2 sprite, T3 economia e salvataggi, T4 hub e storia, e quelli che verranno), nello stesso punto e
 *     nello stesso ordine; uno script che manca resta com'è e viene segnalato;
 *  2. trasforma i PNG di gioco/assets/sprite_teatro/ in data: URI nella mappa globale
 *     window.__risorseTeatro['assets/sprite_teatro/<nome>.png'], inserita prima del primo script di teatro/
 *     (t2-sprite.js la legge prima di usare il percorso relativo).
 * Il risultato si apre da file:// senza altri file accanto. Nessuna dipendenza oltre Node.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RADICE = path.resolve(__dirname, '..');
const SORGENTE = path.join(RADICE, 'gioco', 'teatro_marionette.html');
const CARTELLA_GIOCO = path.join(RADICE, 'gioco');
const SPRITE = path.join(CARTELLA_GIOCO, 'assets', 'sprite_teatro');
const USCITA = path.join(RADICE, 'production', 'release', 'teatro.html');

/** Rende sicuro un sorgente JS dentro <script>…</script>. */
const sicuroInScript = (js) => js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

function main() {
  let html = fs.readFileSync(SORGENTE, 'utf8');

  // 1) risorse: PNG → data: URI
  const risorse = {};
  for (const f of fs.readdirSync(SPRITE).filter((n) => n.endsWith('.png')).sort()) {
    risorse[`assets/sprite_teatro/${f}`] = 'data:image/png;base64,' + fs.readFileSync(path.join(SPRITE, f)).toString('base64');
  }
  const blocco = `<script>\n// Risorse incorporate da tools/teatro-release.js (PNG di assets/sprite_teatro come data: URI)\n`
    + `window.__risorseTeatro = ${JSON.stringify(risorse)};\n</script>\n`;

  // 2) script di teatro/ inline
  const rx = /<script\s+src="(teatro\/[^"]+\.js)"\s*><\/script>/g;
  const incorporati = [];
  const mancanti = [];
  let primo = true;
  html = html.replace(rx, (tutto, rel) => {
    const file = path.join(CARTELLA_GIOCO, rel);
    let out;
    if (!fs.existsSync(file)) {
      mancanti.push(rel);
      out = tutto;
    } else {
      incorporati.push(rel);
      out = `<script>\n/* ${rel} (incorporato da tools/teatro-release.js) */\n${sicuroInScript(fs.readFileSync(file, 'utf8'))}\n</script>`;
    }
    if (primo) { primo = false; out = blocco + out; }
    return out;
  });
  if (primo) html = html.replace('</body>', blocco + '</body>'); // nessuno script di teatro/: risorse comunque

  fs.mkdirSync(path.dirname(USCITA), { recursive: true });
  fs.writeFileSync(USCITA, html);
  const kb = (fs.statSync(USCITA).size / 1024).toFixed(0);
  console.log(`scritto ${path.relative(RADICE, USCITA)} (${kb} KB)`);
  console.log(`script incorporati: ${incorporati.join(', ') || 'nessuno'}`);
  if (mancanti.length) console.log(`script non trovati (lasciati come riferimento esterno): ${mancanti.join(', ')}`);
  console.log(`immagini incorporate: ${Object.keys(risorse).length}`);
}

main();
