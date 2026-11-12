#!/usr/bin/env node
/*
 * tools/teatro-release.js — build del Teatro delle Marionette in un solo file HTML.
 *
 * Uso: node tools/teatro-release.js [--uscita <file.html>]   →  production/release/teatro.html (se non indicato)
 *
 * Parte da gioco/teatro_marionette.html e:
 *  1. incorpora inline ogni <script src="teatro/*.js"></script> il cui file esiste in gioco/teatro/
 *     (T2 sprite, T3 economia e salvataggi, T4 hub e storia, e quelli che verranno), nello stesso punto e
 *     nello stesso ordine; uno script che manca resta com'è e viene segnalato;
 *  2. trasforma in data: URI i PNG di gioco/assets/sprite_teatro/ che il gioco usa (fogli di t2-sprite.js e
 *     boss/ di 10-sprite.js), alleggeriti da tools/ottimizza-png-release.py, nella mappa globale
 *     window.__risorseTeatro['assets/sprite_teatro/<nome>.png'], inserita prima del primo script di teatro/;
 *     delle immagini di scena dell'autore (assets/sprite_teatro/scena/) entrano SOLO quelle che la tabella
 *     IMMAGINI_B9 di teatro/b9-immagini.js segna `usa: true`: le scartate restano fuori dal file unico.
 * Il risultato si apre da file:// senza altri file accanto. Serve Node; con Python 3 + Pillow le immagini
 * vengono alleggerite, altrimenti si incorporano gli originali.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const { spawnSync } = require('child_process');

const RADICE = path.resolve(__dirname, '..');
const SORGENTE = path.join(RADICE, 'gioco', 'teatro_marionette.html');
const CARTELLA_GIOCO = path.join(RADICE, 'gioco');
const SPRITE = path.join(CARTELLA_GIOCO, 'assets', 'sprite_teatro');
const CARTELLE_V2 = { leggera: path.join(CARTELLA_GIOCO, 'assets', 'sprite_teatro_v2'),
  ombre: path.join(CARTELLA_GIOCO, 'assets', 'sprite_teatro_v2_ombre') };
const iUscita = process.argv.indexOf('--uscita');
const USCITA = iUscita > 0 && process.argv[iUscita + 1]
  ? path.resolve(process.argv[iUscita + 1])
  : path.join(RADICE, 'production', 'release', 'teatro.html');
// Fogli citati in t2-sprite.js da lasciare comunque fuori dal file unico.
const FOGLI_NON_USATI = []; // (t2 precarica tutti i fogli del suo LAYOUT: toglierne uno darebbe un errore di file mancante)

/** Rende sicuro un sorgente JS dentro <script>…</script>. */
const sicuroInScript = (js) => js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

/**
 * Le immagini di scena da incorporare: i nomi con `usa: true` nella tabella IMMAGINI_B9 di b9-immagini.js
 * (il blocco fra i segnaposto <tabella-immagini> è fatto di soli dati e si valuta così com'è).
 * @returns {string[]} nomi senza estensione; vuoto se il file o la tabella non ci sono
 */
function immaginiDiScenaUsate(jsB9) {
  const m = /\/\/ <tabella-immagini>([\s\S]*?)\/\/ <\/tabella-immagini>/.exec(jsB9);
  if (!m) return [];
  const ambiente = {};
  vm.runInNewContext(m[1].replace('const IMMAGINI_B9 =', 'IMMAGINI_B9 ='), ambiente);
  const T = ambiente.IMMAGINI_B9 || {};
  return Object.keys(T).filter((nome) => T[nome] && T[nome].usa === true).sort();
}

/**
 * La tabella SPRITE_V2 di teatro/10-sprite.js (fra i segnaposto <sprite-v2>): nome → false | 'leggera' | 'ombre'.
 * @returns {Object<string, boolean>} vuota se manca (allora si incorporano gli originali)
 */
function tabellaSpriteV2(js) {
  const m = /\/\/ <sprite-v2>([\s\S]*?)\/\/ <\/sprite-v2>/.exec(js);
  if (!m) return {};
  const ambiente = { Object };
  vm.runInNewContext(m[1].replace('const SPRITE_V2 =', 'SPRITE_V2 ='), ambiente);
  return ambiente.SPRITE_V2 || {};
}

/** Data e commit da cui nasce il file unico: chi prova il gioco la manda con la diagnosi. */
function versioneRelease() {
  let commit = '';
  try { commit = require('child_process').execSync('git rev-parse --short HEAD', { cwd: RADICE, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (_) { /* senza git resta la data */ }
  return `${new Date().toISOString().slice(0, 16).replace('T', ' ')}${commit ? ` · ${commit}` : ''}`;
}

function main() {
  let html = fs.readFileSync(SORGENTE, 'utf8');

  // 1) risorse: solo i PNG che il gioco usa davvero, alleggeriti → data: URI
  //    - fogli animati: i nomi citati fra apici in teatro/t2-sprite.js (chiavi del suo LAYOUT);
  //    - boss: i file di boss/ citati fra apici in teatro/10-sprite.js (tabella SPRITE_BOSS_A).
  //    Gli altri PNG della cartella (ritagli grezzi dei fogli modello) restano fuori dal file unico.
  const citato = (js, nome) => js.includes(`'${nome}'`) || js.includes(`"${nome}"`);
  const leggiJs = (rel) => { const f = path.join(CARTELLA_GIOCO, rel); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
  const jsT2 = leggiJs('teatro/t2-sprite.js');
  const jsSprite = leggiJs('teatro/10-sprite.js');
  //    - immagini singole o a una riga disegnate da altri file con getSpriteTeatro/disegnaCellaTeatro (il Ragno
  //      della Seta di d7, guanto, forbici e ombra del capo del Grande Burattinaio di d1): i nomi fra apici.
  //      E le figure della terza ondata (Gregorio, Assunta, Agnese al telaio, Macchinista, Campanaro, Giudice).
  const jsSingole = ['teatro/d1-burattinaio.js', 'teatro/d7-rifiniture.js', 'teatro/h1-agnese-taddeo.js', 'teatro/h2-memorie.js',
    'teatro/h3-gregorio.js', 'teatro/h5-sottopalco.js', 'teatro/h6-casertavecchia.js', 'teatro/h7-anfiteatro.js'].map(leggiJs).join('\n');
  const daIncorporare = [];
  for (const f of fs.readdirSync(SPRITE).filter((n) => n.endsWith('.png')).sort()) {
    const nome = f.slice(0, -4);
    if ((citato(jsT2, nome) || citato(jsSingole, nome)) && !FOGLI_NON_USATI.includes(nome)) daIncorporare.push(f);
  }
  const cartellaBoss = path.join(SPRITE, 'boss');
  if (fs.existsSync(cartellaBoss)) {
    for (const f of fs.readdirSync(cartellaBoss).filter((n) => n.endsWith('.png')).sort()) {
      if (citato(jsSprite, f.slice(0, -4))) daIncorporare.push(`boss/${f}`);
    }
  }
  // immagini di scena dell'autore: solo quelle usate (tabella di teatro/b9-immagini.js)
  const scena = immaginiDiScenaUsate(leggiJs('teatro/b9-immagini.js'));
  const scenaMancanti = [];
  for (const nome of scena) {
    if (fs.existsSync(path.join(SPRITE, 'scena', `${nome}.png`))) daIncorporare.push(`scena/${nome}.png`);
    else scenaMancanti.push(nome);
  }
  const spriteV2 = tabellaSpriteV2(jsSprite);
  let usatiV2 = 0;
  const risorse = {};
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'teatro-release-'));
  let alleggeriti = 0;
  for (const f of daIncorporare) {
    // versione migliorata se accesa in SPRITE_V2 (10-sprite.js) e presente in sprite_teatro_v2/
    const scelta = spriteV2[f.slice(0, -4)];
    const v2 = CARTELLE_V2[scelta] ? path.join(CARTELLE_V2[scelta], f) : '';
    const origine = v2 && fs.existsSync(v2) ? v2 : path.join(SPRITE, f);
    if (origine === v2) usatiV2++;
    const leggero = path.join(tmp, f.replace(/\//g, '_'));
    let dati = fs.readFileSync(origine);
    const r = spawnSync('python3', [path.join(__dirname, 'ottimizza-png-release.py'), origine, leggero], { stdio: 'ignore' });
    if (r.status === 0 && fs.existsSync(leggero) && fs.statSync(leggero).size < dati.length) { dati = fs.readFileSync(leggero); alleggeriti++; }
    risorse[`assets/sprite_teatro/${f}`] = 'data:image/png;base64,' + dati.toString('base64');
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  const blocco = `<script>\n// Risorse incorporate da tools/teatro-release.js (PNG di assets/sprite_teatro come data: URI)\n`
    + `window.__risorseTeatro = ${JSON.stringify(risorse)};\n`
    + `window.__teatroVersione = ${JSON.stringify(versioneRelease())}; // finisce nel file di diagnosi (F8)\n</script>\n`;

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
  console.log(`immagini di scena incorporate: ${scena.length - scenaMancanti.length}${scenaMancanti.length ? ` (mancano i file: ${scenaMancanti.join(', ')})` : ''}`);
  console.log(`script incorporati: ${incorporati.join(', ') || 'nessuno'}`);
  if (mancanti.length) console.log(`script non trovati (lasciati come riferimento esterno): ${mancanti.join(', ')}`);
  console.log(`immagini incorporate: ${Object.keys(risorse).length} (alleggerite: ${alleggeriti}, versione migliorata v2: ${usatiV2})`);
}

main();
