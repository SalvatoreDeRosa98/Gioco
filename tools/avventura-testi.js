#!/usr/bin/env node
/**
 * tools/avventura-testi.js — l'elenco di tutti i testi dell'avventura, da far leggere all'autore.
 * Scrive production/avventura-testi.md: per capitolo e per quadro le battute e le didascalie (chi: testo), le voci
 * delle scelte, i temi dei dialoghi, nomi e descrizioni degli oggetti, i finali. Ogni riga porta [bibbia] o [nuovo]
 * secondo il commento a fine riga nel sorgente (gioco/avventura/storia/*.js); [?] se il commento manca.
 * In fondo, l'elenco dei fondali da disegnare (fondale.immagine di ogni quadro).
 * Uso: node tools/avventura-testi.js [file d'uscita]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { caricaStoria, RADICE, CARTELLA } = require('./avventura-valida.js');

const S = caricaStoria();
const USCITA = process.argv[2] || path.join(RADICE, 'production', 'avventura-testi.md');

// --- i marchi [bibbia]/[nuovo] letti dal sorgente
const norm = (t) => String(t).replace(/\\(.)/g, '$1').replace(/['"`]/g, '').replace(/\s+/g, ' ');
const sorgenti = {};
for (const f of S.file) {
  const righe = fs.readFileSync(path.join(CARTELLA, f), 'utf8').split('\n');
  sorgenti[f] = righe.map((r) => ({ n: norm(r), marchio: /\/\/\s*\[bibbia/.test(r) ? 'bibbia' : /\/\/\s*\[nuovo/.test(r) ? 'nuovo' : '' }));
}
function marchio(file, testo) {
  const righe = sorgenti[file] || [];
  const pezzo = norm(testo).slice(0, 50);
  for (let i = 0; i < righe.length; i++) {
    if (!righe[i].n.includes(pezzo)) continue;
    for (let k = i; k < Math.min(i + 4, righe.length); k++) if (righe[k].marchio) return righe[k].marchio;
    return '?';
  }
  return '?';
}

const nomeDi = (chi) => (chi === 'didascalia' ? 'Didascalia' : chi === 'voce' ? 'La Voce' : (S.personaggio.get(chi) || { nome: chi }).nome);
function righeAzioni(azioni, file, rientro, out) {
  for (const a of azioni || []) {
    if (!Array.isArray(a)) continue;
    const [n, x, y, z] = a;
    const r = (testo, chi, mostra) => out.push(`${rientro}- ${chi ? `**${chi}:** ` : ''}${mostra || testo} [${marchio(file, testo)}]`);
    if (n === 'dice') r(y, nomeDi(x));
    else if (n === 'pensa') r(x, '', `*${x}*`);
    else if (n === 'diario') r(x, 'Diario');
    else if (n === 'obiettivo') r(x, 'Obiettivo');
    else if (n === 'se' || n === 'unaVolta') { righeAzioni(y, file, rientro, out); if (z && z.length) { out.push(`${rientro}- *(altrimenti)*`); righeAzioni(z, file, rientro + '  ', out); } }
    else if (n === 'scelta') for (const v of x || []) { out.push(`${rientro}- ▸ Scelta: «${v.testo}» [${marchio(file, v.testo)}]`); righeAzioni(v.fai, file, rientro + '  ', out); }
  }
}

const out = ['# Ferruccio — La Notte Immobile · tutti i testi dell\'avventura', '',
  `Generato da \`tools/avventura-testi.js\` da \`gioco/avventura/storia/\`. [bibbia] = parola per parola dalla bibbia;`,
  `[nuovo] = scritto per l'avventura; [?] = commento mancante nel sorgente. *Corsivo* = ciò che Ferruccio vede o fa (non parla).`, ''];
const capitoli = [...S.capitolo.values()].sort((a, b) => a.ordine - b.ordine);
for (const C of capitoli) {
  out.push(`## ${C.ordine}. ${C.titolo}${C.sottotitolo ? ' — ' + C.sottotitolo : ''}`, '');
  const quadri = [...S.quadro.values()].filter((q) => q.capitolo === C.id);
  const files = new Set(quadri.map((q) => q._file));
  for (const Q of quadri) {
    out.push(`### ${Q.nome} (\`${Q.id}\`)`, '');
    if (Q.entrata && Q.entrata.length) { out.push('Entrando:'); righeAzioni(Q.entrata, Q._file, '', out); out.push(''); }
    for (const p of Q.punti || []) {
      const blocchi = [];
      for (const v of ['guarda', 'usa', 'chiuso']) { const o = []; righeAzioni(p[v], Q._file, '  ', o); if (o.length) blocchi.push(`- *${v}*`, ...o); }
      for (const [k, a] of Object.entries(p.con || {})) { const o = []; righeAzioni(a, Q._file, '  ', o); if (o.length) blocchi.push(`- *con ${k === '*' ? 'altro oggetto' : (S.oggetto.get(k) || { nome: k }).nome}*`, ...o); }
      if (blocchi.length) out.push(`**${p.nome}** (\`${p.id}\`)`, ...blocchi, '');
    }
  }
  // dialoghi e oggetti del file del capitolo (una volta sola per file)
  for (const f of files) {
    if (out.includes(`<!-- ${f} -->`)) continue;
    out.push(`<!-- ${f} -->`);
    const dlg = [...S.dialogo.values()].filter((d) => d._file === f);
    for (const D of dlg) {
      out.push(`### Dialogo con ${nomeDi(D.con)} (\`${D.id}\`)`, '');
      if (D.inizio) { out.push('La prima volta:'); righeAzioni(D.inizio, f, '', out); }
      if (D.saluto) { out.push('Le volte dopo:'); righeAzioni(D.saluto, f, '', out); }
      for (const t of D.temi || []) { out.push(`- ▸ Tema: «${t.testo}» [${marchio(f, t.testo)}]`); righeAzioni(t.fai, f, '  ', out); }
      out.push('');
    }
    const ogg = [...S.oggetto.values()].filter((o) => o._file === f);
    if (ogg.length) {
      out.push(`### Oggetti (${f})`, '');
      for (const O of ogg) { out.push(`- **${O.nome}** (\`${O.id}\`): ${O.descrizione} [${marchio(f, O.descrizione)}]`); righeAzioni(O.guarda, f, '  ', out); for (const [k, a] of Object.entries(O.combina || {})) { out.push(`  - *con ${k}*`); righeAzioni(a, f, '    ', out); } }
      out.push('');
    }
  }
}
const comuni = [...S.oggetto.values()].filter((o) => o._file === '00-base.js');
out.push('## Oggetti comuni (00-base.js)', '');
for (const O of comuni) out.push(`- **${O.nome}** (\`${O.id}\`): ${O.descrizione} [${marchio('00-base.js', O.descrizione)}]`);
out.push('', '## I finali', '');
for (const F of S.finale.values()) {
  out.push(`### ${F.titolo} (\`${F.id}\`)`, '', `*${F.riassunto}*`, '');
  righeAzioni(F.scene, F._file, '', out); out.push('');
}
out.push('## Fondali da far disegnare', '', '| Quadro | Immagine (gioco/assets/…png) | Capitolo |', '|---|---|---|');
for (const Q of S.quadro.values()) out.push(`| ${Q.nome} (\`${Q.id}\`) | \`${(Q.fondale || {}).immagine || '—'}\` | ${(S.capitolo.get(Q.capitolo) || {}).titolo || Q.capitolo} |`);
const testo = out.filter((r) => !r.startsWith('<!-- ')).join('\n') + '\n';
fs.mkdirSync(path.dirname(USCITA), { recursive: true });
fs.writeFileSync(USCITA, testo);
const conta = { bibbia: (testo.match(/\[bibbia\]/g) || []).length, nuovo: (testo.match(/\[nuovo\]/g) || []).length, ignoto: (testo.match(/\[\?\]/g) || []).length };
console.log(`scritto ${path.relative(RADICE, USCITA)}: ${testo.split('\n').length} righe · [bibbia] ${conta.bibbia} · [nuovo] ${conta.nuovo} · senza marchio ${conta.ignoto}`);
