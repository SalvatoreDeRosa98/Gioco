#!/usr/bin/env node
/*
 * tools/avventura-richieste-immagini.js — scrive production/arte/richieste-gemini-avventura.md: l'elenco dei fondali
 * dell'avventura da far disegnare, quadro per quadro, con ciò che c'è e ciò che manca.
 * Le descrizioni vengono dai blocchi «IMMAGINI DA FAR DISEGNARE» in fondo ai file di storia (righe « *  - avventura/<nome> … »);
 * se un quadro non ha la sua riga, resta il nome del luogo. Rilanciare quando cambiano i quadri o arrivano immagini.
 * Uso: node tools/avventura-richieste-immagini.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { caricaStoria, RADICE } = require('./avventura-valida.js');

const STORIA = path.join(RADICE, 'gioco', 'avventura', 'storia');
const ASSETS = path.join(RADICE, 'gioco', 'assets');
const USCITA = path.join(RADICE, 'production', 'arte', 'richieste-gemini-avventura.md');

// descrizioni dai commenti dei capitoli: dentro il blocco «IMMAGINI DA FAR DISEGNARE» ogni voce comincia con
// «[- ][avventura/]nome[.png]» (con «avventura/» o «.png») e continua nelle righe rientrate che seguono
const descr = {};
for (const f of fs.readdirSync(STORIA).filter((n) => n.endsWith('.js')).sort()) {
  const righe = fs.readFileSync(path.join(STORIA, f), 'utf8').split('\n');
  let dentro = false; let cor = null;
  for (const r of righe) {
    if (/IMMAGINI DA FAR DISEGNARE/.test(r)) { dentro = true; cor = null; continue; }
    if (!dentro) continue;
    if (/\*\//.test(r)) { dentro = false; cor = null; continue; }
    const m = /^\s*\*\s+(?:-\s+)?`?(avventura\/[a-z0-9-]+(?:\.png)?|[a-z0-9-]+\.png)`?\s*[.:—–-]*\s*(.*)$/.exec(r);
    if (m) { cor = 'avventura/' + m[1].replace(/^avventura\//, '').replace(/\.png$/, ''); descr[cor] = m[2].trim(); continue; }
    const seg = /^\s*\*\s{2,}(\S.*)$/.exec(r);
    if (cor && seg) descr[cor] += ' ' + seg[1].trim(); else cor = null;
  }
}

const S = caricaStoria();
const capitoli = [...S.capitolo.values()].sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
let n = 0, fatti = 0;
let md = `# Immagini da far disegnare — l'avventura grafica

Documento per l'autore, generato da \`tools/avventura-richieste-immagini.js\` (non modificare a mano: rilanciare).

L'avventura oggi disegna ogni luogo **col codice**, in stile teatro d'ombre. Ogni fondale che arriva prende il posto
del disegno provvisorio, senza toccare i file \`.js\` e \`.html\`: basta aggiungere il PNG col nome esatto in
\`gioco/assets/avventura/\` e rilanciare \`node tools/avventura-immagini.js\` (lo faccio io).

**Misura:** 1280×720 (16:9), opaco. **La fascia in basso (un sesto dell'altezza, sotto i 600 px) resta scura e vuota:**
lì il gioco mette gli oggetti raccolti e i pulsanti. **Senza personaggi dentro** (Ferruccio, Tonino, Agnese… li mette il
gioco) e senza scritte. Il pavimento dove si cammina sta fra i 470 e i 600 px di altezza.

**Stile:** lo stesso del Teatro (\`design/art/art-bible.md\`): sagome scure, luce calda di lanterna, luna ferma, fili d'oro
che scendono dall'alto dove la scena è sotto il Velo. Prompt di contesto e frase di stile: quelli di
\`production/arte/richieste-gemini-seconda-ondata.md\`.

`;
for (const C of capitoli) {
  const quadri = [...S.quadro.values()].filter((Q) => Q.capitolo === C.id);
  if (!quadri.length) continue;
  md += `## ${C.titolo || C.nome || C.id}\n\n| | File (in \`gioco/assets/avventura/\`) | Luogo | Che cosa si vede |\n|---|---|---|---|\n`;
  for (const Q of quadri) {
    const nome = Q.fondale && Q.fondale.immagine; if (!nome) continue;
    n++;
    const c = fs.existsSync(path.join(ASSETS, nome + '.png')); if (c) fatti++;
    md += `| ${c ? '✅' : '⬜'} | \`${nome.replace(/^avventura\//, '')}.png\` | ${Q.nome || Q.id} | ${(descr[nome] || '(descrizione da scrivere: è ' + (Q.nome || Q.id) + ')').replace(/\|/g, '/')} |\n`;
  }
  md += '\n';
}
md += `## Figure che oggi sono sagome a codice

| File (in \`gioco/assets/sprite_teatro/\`) | Foglio | Descrizione |
|---|---|---|
`;
for (const P of S.personaggio.values()) {
  if (P.figura && P.figura.foglio) continue;
  md += `| \`avv_${P.id}.png\` | 1 riga × 2 pose (fermo; parla o gesto), celle 256×320 | ${P.nome}: oggi è la sagoma «${(P.figura && P.figura.sagoma) || 'uomo'}». |\n`;
}
md += `\nFondali: ${fatti} disegnati su ${n}.\n`;
fs.mkdirSync(path.dirname(USCITA), { recursive: true });
fs.writeFileSync(USCITA, md);
console.log(`scritto ${path.relative(RADICE, USCITA)}: ${n} fondali (${fatti} già disegnati), ${Object.keys(descr).length} descrizioni trovate`);
