#!/usr/bin/env node
/**
 * tools/impacchetta.js — Impacchetta la pagina del gioco in UN SOLO file HTML autosufficiente.
 *
 * Uso (dalla radice del repository, Node ≥ 18, nessuna dipendenza):
 *
 *   node tools/impacchetta.js [--entrata gioco/index.html] [--uscita production/build/ferruccio-prova.html]
 *                             [--frammento] [--dettagli]
 *
 * Il file prodotto funziona anche aperto da `file://` e dentro un iframe con una CSP che ammette solo
 * script e stili inline e `data:` per le immagini: nessun `<script type="module" src>`, nessuna import map,
 * nessun `fetch` di rete. Come:
 *
 *  1. segue il grafo dei moduli ES a partire dallo `<script type="module" src="…">` della pagina e
 *     trasforma ogni modulo in una funzione di un registro con memoizzazione (mini bundler): le forme
 *     `import`/`export` supportate sono elencate in `tools/README-impacchetta.md`; ogni modulo trasformato
 *     è verificato con `node --check` prima della composizione e una forma sconosciuta fa fallire il tool;
 *  2. inlinea i CSS dei `<link rel="stylesheet">` come `<style>` nell'ordine originale (gli `url()` relativi
 *     diventano `data:` URI);
 *  3. inlinea TUTTI i JSON di `contenuti/` (ricorsivamente) in una mappa e installa un `fetch` che la serve
 *     per i percorsi relativi presenti, delegando al `fetch` originale per il resto;
 *  4. conserva il resto della pagina. Con `--frammento` omette doctype/html/head/body e mette `<title>`,
 *     `<style>` e `<script>` in testa al contenuto del body (per un hosting che avvolge da solo la pagina).
 *
 * Non usa `eval` né `new Function`: il codice trasformato è scritto in uno `<script>` classico in strict mode.
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/** Identificatori riservati del registro: il tool fallisce se un modulo li usa già. */
const NOMI = Object.freeze({
  esporta: '__esporta',
  richiedi: '__richiedi',
  meta: '__meta',
  moduli: '__moduli',
  contenuti: '__contenuti',
  prefissoTemporaneo: '__m',
});

const MIME = Object.freeze({
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
});

class ErroreImpacchetta extends Error {}

// ---------------------------------------------------------------------------------------------
// Riga di comando
// ---------------------------------------------------------------------------------------------

function aiuto() {
  return [
    'uso: node tools/impacchetta.js [opzioni]',
    '',
    '  --entrata <file>   pagina d\'ingresso (default: gioco/index.html)',
    '  --uscita <file>    file HTML prodotto (default: production/build/ferruccio-prova.html; la cartella è creata)',
    '  --frammento        omette doctype/html/head/body: <title>, <style> e <script> in testa al contenuto del body',
    '  --dettagli         elenca i moduli e i contenuti inclusi',
    '  --aiuto            questa guida',
  ].join('\n');
}

function leggiOpzioni(argv) {
  const opzioni = { entrata: 'gioco/index.html', uscita: 'production/build/ferruccio-prova.html', frammento: false, dettagli: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const [nome, valoreInline] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
    const valore = () => {
      if (valoreInline !== undefined) return valoreInline;
      if (i + 1 >= argv.length) throw new ErroreImpacchetta(`l'opzione ${nome} richiede un valore`);
      return argv[++i];
    };
    switch (nome) {
      case '--entrata': opzioni.entrata = valore(); break;
      case '--uscita': opzioni.uscita = valore(); break;
      case '--frammento': opzioni.frammento = true; break;
      case '--dettagli': opzioni.dettagli = true; break;
      case '--aiuto': case '-h': case '--help': opzioni.aiuto = true; break;
      default: throw new ErroreImpacchetta(`opzione sconosciuta: ${a}\n${aiuto()}`);
    }
  }
  return opzioni;
}

// ---------------------------------------------------------------------------------------------
// Scansione lessicale leggera: maschera di commenti, stringhe e template (1 = non è codice)
// ---------------------------------------------------------------------------------------------

/**
 * Se in `i` inizia un commento, una stringa o un template, lo marca nella maschera e ritorna l'indice
 * dopo la sua fine; altrimenti ritorna -1. I letterali regex NON sono riconosciuti (limite documentato).
 */
function saltaSpeciale(src, i, m) {
  const c = src[i];
  const d = src[i + 1];
  if (c === '/' && d === '/') {
    const f = src.indexOf('\n', i);
    const fine = f === -1 ? src.length : f;
    m.fill(1, i, fine);
    return fine;
  }
  if (c === '/' && d === '*') {
    const f = src.indexOf('*/', i + 2);
    const fine = f === -1 ? src.length : f + 2;
    m.fill(1, i, fine);
    return fine;
  }
  if (c === "'" || c === '"') {
    let j = i + 1;
    while (j < src.length && src[j] !== c && src[j] !== '\n') {
      if (src[j] === '\\') j++;
      j++;
    }
    m.fill(1, i, Math.min(j + 1, src.length));
    return j + 1;
  }
  if (c === '`') return scansionaTemplate(src, i, m);
  return -1;
}

function scansionaTemplate(src, inizio, m) {
  let j = inizio + 1;
  m[inizio] = 1;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { m[j] = 1; if (j + 1 < src.length) m[j + 1] = 1; j += 2; continue; }
    if (c === '`') { m[j] = 1; return j + 1; }
    if (c === '$' && src[j + 1] === '{') {
      m[j] = 1; m[j + 1] = 1;
      j = scansionaEspressioneTemplate(src, j + 2, m);
      continue;
    }
    m[j] = 1;
    j++;
  }
  return j;
}

function scansionaEspressioneTemplate(src, inizio, m) {
  let prof = 0;
  let i = inizio;
  while (i < src.length) {
    const salto = saltaSpeciale(src, i, m);
    if (salto !== -1) { i = salto; continue; }
    const c = src[i];
    if (c === '{') prof++;
    else if (c === '}') {
      if (prof === 0) { m[i] = 1; return i + 1; }
      prof--;
    }
    i++;
  }
  return i;
}

/** Maschera dei caratteri che NON sono codice (commenti, stringhe, template). */
function mascheraNonCodice(src) {
  const m = new Uint8Array(src.length);
  let i = 0;
  while (i < src.length) {
    const salto = saltaSpeciale(src, i, m);
    i = salto === -1 ? i + 1 : salto;
  }
  return m;
}

function rigaDi(src, indice) {
  let n = 1;
  for (let i = 0; i < indice && i < src.length; i++) if (src[i] === '\n') n++;
  return n;
}

// ---------------------------------------------------------------------------------------------
// Trasformazione di un modulo ES in funzione del registro
// ---------------------------------------------------------------------------------------------

const ID = '[A-Za-z_$][\\w$]*';
const reId = new RegExp(`^${ID}$`);

/**
 * Nomi legati da una lista di specificatori `a, b as c, default as d`.
 * @returns {Array<{ importato: string, locale: string }>}
 */
function analizzaSpecificatori(lista, dove) {
  const esito = [];
  for (const voce of lista.split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = voce.match(new RegExp(`^(${ID})(?:\\s+as\\s+(${ID}))?$`));
    if (!m) throw new ErroreImpacchetta(`${dove}: specificatore non supportato «${voce}» (sono ammessi solo nomi semplici, anche con \`as\`)`);
    esito.push({ importato: m[1], locale: m[2] ?? m[1] });
  }
  return esito;
}

/** Spezza `testo` sulle virgole a profondità 0 di parentesi (le stringhe sono già state escluse dalla maschera). */
function spezzaVirgole(testo, maschera, base) {
  const parti = [];
  let prof = 0;
  let inizio = 0;
  for (let i = 0; i < testo.length; i++) {
    if (maschera[base + i]) continue;
    const c = testo[i];
    if (c === '(' || c === '[' || c === '{') prof++;
    else if (c === ')' || c === ']' || c === '}') prof--;
    else if (c === ',' && prof === 0) { parti.push({ testo: testo.slice(inizio, i), base: base + inizio }); inizio = i + 1; }
  }
  parti.push({ testo: testo.slice(inizio), base: base + inizio });
  return parti.filter((p) => p.testo.trim() !== '');
}

/** Indice del primo `carattere` a profondità 0 in `testo` (−1 se assente). */
function indiceProf0(testo, maschera, base, carattere) {
  let prof = 0;
  for (let i = 0; i < testo.length; i++) {
    if (maschera[base + i]) continue;
    const c = testo[i];
    if (c === '(' || c === '[' || c === '{') prof++;
    else if (c === ')' || c === ']' || c === '}') prof--;
    else if (c === carattere && prof === 0) return i;
  }
  return -1;
}

/** Nomi legati da un bersaglio di dichiarazione: identificatore o pattern di destrutturazione. */
function nomiBersaglio(testo, maschera, base, dove) {
  const t = testo.trim();
  const scarto = testo.indexOf(t);
  const b = base + scarto;
  if (reId.test(t)) return [t];
  if (t[0] === '{' || t[0] === '[') {
    const chiusa = t[0] === '{' ? '}' : ']';
    if (t[t.length - 1] !== chiusa) throw new ErroreImpacchetta(`${dove}: pattern di destrutturazione non chiuso «${t}»`);
    const interno = t.slice(1, -1);
    const nomi = [];
    for (const voce of spezzaVirgole(interno, maschera, b + 1)) {
      const iUguale = indiceProf0(voce.testo, maschera, voce.base, '=');
      let bersaglio = iUguale === -1 ? voce.testo : voce.testo.slice(0, iUguale);
      let baseB = voce.base;
      const bt = bersaglio.trim();
      if (bt.startsWith('...')) {
        nomi.push(...nomiBersaglio(bersaglio.slice(bersaglio.indexOf('...') + 3), maschera, baseB + bersaglio.indexOf('...') + 3, dove));
        continue;
      }
      if (t[0] === '{') {
        const iDue = indiceProf0(bersaglio, maschera, baseB, ':');
        if (iDue !== -1) { baseB += iDue + 1; bersaglio = bersaglio.slice(iDue + 1); }
      }
      nomi.push(...nomiBersaglio(bersaglio, maschera, baseB, dove));
    }
    return nomi;
  }
  throw new ErroreImpacchetta(`${dove}: bersaglio di dichiarazione non supportato «${t}»`);
}

/**
 * Fine (esclusa) dell'istruzione di dichiarazione che inizia in `inizio`: `;` a profondità 0, oppure un
 * a capo a profondità 0 che non è continuazione (l'ultimo carattere non è un operatore aperto e la riga
 * seguente non inizia con `.`, `?`, `:`, `,`).
 */
function fineDichiarazione(src, maschera, inizio) {
  let prof = 0;
  let ultimo = '';
  for (let i = inizio; i < src.length; i++) {
    if (maschera[i]) { if (src[i] !== '\n') ultimo = 'x'; continue; }
    const c = src[i];
    if (c === '(' || c === '[' || c === '{') prof++;
    else if (c === ')' || c === ']' || c === '}') prof--;
    if (prof === 0 && c === ';') return i;
    if (prof === 0 && c === '\n') {
      const continua = /[=,+\-*/%&|^?:(<>!~]$/.test(ultimo);
      const seguente = src.slice(i + 1).match(/^\s*(\S{1,2})/);
      const seguenteContinua = seguente && /^(\.|\?\.|\?|:|,|&&|\|\||\?\?)/.test(seguente[1]);
      if (!continua && !seguenteContinua && ultimo !== '') return i;
      continue;
    }
    if (c !== ' ' && c !== '\t' && c !== '\r' && c !== '\n') ultimo = c;
  }
  return src.length;
}

/**
 * Trasforma il sorgente di un modulo in corpo di funzione del registro.
 * @param {string} src
 * @param {string} chiave  chiave del modulo (es. `/motore/avvio.js`)
 * @param {(spec: string) => string} risolvi  da specificatore relativo a chiave
 * @returns {{ codice: string, dipendenze: string[], usaMeta: boolean }}
 */
function trasformaModulo(src, chiave, risolvi) {
  const maschera = mascheraNonCodice(src);
  const dove = (i) => `${chiave}:${rigaDi(src, i)}`;

  // identificatori riservati
  const riservati = new RegExp(`\\b(${Object.values(NOMI).filter((n) => n !== NOMI.prefissoTemporaneo).join('|')}|${NOMI.prefissoTemporaneo}\\d+)\\b`, 'g');
  for (const m of src.matchAll(riservati)) {
    if (!maschera[m.index]) throw new ErroreImpacchetta(`${dove(m.index)}: l'identificatore «${m[0]}» è riservato al registro dei moduli e non può comparire nel sorgente`);
  }

  const modifiche = []; // { inizio, fine, testo }
  const inTesta = []; // assegnazioni hoistate (funzioni)
  const inCoda = []; // assegnazioni finali (const/let/class/export {…})
  const dipendenze = new Set();
  let contatore = 0;
  const temporaneo = () => `${NOMI.prefissoTemporaneo}${contatore++}`;
  const chiaveDi = (spec, i) => {
    if (!spec.startsWith('./') && !spec.startsWith('../')) {
      throw new ErroreImpacchetta(`${dove(i)}: specificatore «${spec}» non relativo (sono supportati solo './' e '../')`);
    }
    const k = risolvi(spec);
    dipendenze.add(k);
    return JSON.stringify(k);
  };

  const sticky = (re) => new RegExp(re.source, re.flags.includes('y') ? re.flags : `${re.flags}y`);
  const prova = (re, i) => { const r = sticky(re); r.lastIndex = i; return r.exec(src); };

  for (const m of src.matchAll(/^(import|export)\b/gm)) {
    const i = m.index;
    if (maschera[i]) continue;
    const parola = m[1];
    let r;
    if (parola === 'import') {
      if ((r = prova(/import\s*(['"])([^'"\n]+)\1\s*;?/, i))) {
        modifiche.push({ inizio: i, fine: i + r[0].length, testo: `${NOMI.richiedi}(${chiaveDi(r[2], i)});` });
        continue;
      }
      if ((r = prova(/import\s+([\s\S]*?)\s+from\s*(['"])([^'"\n]+)\2\s*;?/, i))) {
        const clausola = r[1].trim();
        const k = chiaveDi(r[3], i);
        const righe = [];
        const ri = clausola.match(new RegExp(`^(?:(${ID})\\s*,\\s*)?(?:\\*\\s*as\\s+(${ID})|\\{([^}]*)\\})$`))
          ?? clausola.match(new RegExp(`^(${ID})()()$`));
        if (!ri) throw new ErroreImpacchetta(`${dove(i)}: forma di import non supportata «${r[0].trim()}»`);
        const [, predefinito, spazio, nominati] = ri;
        let sorgente = `${NOMI.richiedi}(${k})`;
        if (predefinito && (spazio || nominati !== undefined)) {
          const t = temporaneo();
          righe.push(`const ${t} = ${sorgente};`);
          sorgente = t;
        }
        if (predefinito) righe.push(`const ${predefinito} = ${sorgente}.default;`);
        if (spazio) righe.push(`const ${spazio} = ${sorgente};`);
        if (nominati !== undefined) {
          const voci = analizzaSpecificatori(nominati, dove(i));
          if (voci.length === 0) righe.push(`${sorgente};`);
          else righe.push(`const { ${voci.map((v) => (v.importato === v.locale ? v.locale : `${v.importato}: ${v.locale}`)).join(', ')} } = ${sorgente};`);
        }
        modifiche.push({ inizio: i, fine: i + r[0].length, testo: righe.join(' ') });
        continue;
      }
      throw new ErroreImpacchetta(`${dove(i)}: forma di import non supportata «${src.slice(i, src.indexOf('\n', i) === -1 ? undefined : src.indexOf('\n', i)).trim()}»`);
    }

    // export
    if ((r = prova(new RegExp(`export\\s+default\\s+(async\\s+function\\s*\\*?|function\\s*\\*?|class)\\s+(${ID})`), i))) {
      const prefisso = r[0].length - r[0].replace(/^export\s+default\s+/, '').length;
      modifiche.push({ inizio: i, fine: i + prefisso, testo: '' });
      (r[1].startsWith('class') ? inCoda : inTesta).push(`${NOMI.esporta}.default = ${r[2]};`);
      continue;
    }
    if ((r = prova(/export\s+default\s+/, i))) {
      modifiche.push({ inizio: i, fine: i + r[0].length, testo: `${NOMI.esporta}.default = ` });
      continue;
    }
    if ((r = prova(new RegExp(`export\\s+(async\\s+function\\s*\\*?|function\\s*\\*?|class)\\s+(${ID})`), i))) {
      const prefisso = r[0].match(/^export\s+/)[0].length;
      modifiche.push({ inizio: i, fine: i + prefisso, testo: '' });
      (r[1].startsWith('class') ? inCoda : inTesta).push(`${NOMI.esporta}.${r[2]} = ${r[2]};`);
      continue;
    }
    if ((r = prova(/export\s+(const|let|var)\s+/, i))) {
      const prefisso = r[0].match(/^export\s+/)[0].length;
      modifiche.push({ inizio: i, fine: i + prefisso, testo: '' });
      const inizioDich = i + r[0].length;
      const fine = fineDichiarazione(src, maschera, inizioDich);
      const dichiarazione = src.slice(inizioDich, fine);
      for (const d of spezzaVirgole(dichiarazione, maschera, inizioDich)) {
        const iUguale = indiceProf0(d.testo, maschera, d.base, '=');
        const bersaglio = iUguale === -1 ? d.testo : d.testo.slice(0, iUguale);
        for (const nome of nomiBersaglio(bersaglio, maschera, d.base, dove(i))) inCoda.push(`${NOMI.esporta}.${nome} = ${nome};`);
      }
      continue;
    }
    if ((r = prova(new RegExp(`export\\s*\\*\\s*as\\s+(${ID})\\s+from\\s*(['"])([^'"\\n]+)\\2\\s*;?`), i))) {
      modifiche.push({ inizio: i, fine: i + r[0].length, testo: `${NOMI.esporta}.${r[1]} = ${NOMI.richiedi}(${chiaveDi(r[3], i)});` });
      continue;
    }
    if ((r = prova(/export\s*\*\s*from\s*(['"])([^'"\n]+)\1\s*;?/, i))) {
      const t = temporaneo();
      modifiche.push({ inizio: i, fine: i + r[0].length, testo: `const ${t} = ${NOMI.richiedi}(${chiaveDi(r[2], i)}); for (const n in ${t}) if (n !== 'default') ${NOMI.esporta}[n] = ${t}[n];` });
      continue;
    }
    if ((r = prova(/export\s*\{([^}]*)\}\s*from\s*(['"])([^'"\n]+)\2\s*;?/, i))) {
      const t = temporaneo();
      const voci = analizzaSpecificatori(r[1], dove(i));
      modifiche.push({ inizio: i, fine: i + r[0].length, testo: `const ${t} = ${NOMI.richiedi}(${chiaveDi(r[3], i)}); ${voci.map((v) => `${NOMI.esporta}.${v.locale} = ${t}.${v.importato};`).join(' ')}` });
      continue;
    }
    if ((r = prova(/export\s*\{([^}]*)\}\s*;?/, i))) {
      const voci = analizzaSpecificatori(r[1], dove(i));
      modifiche.push({ inizio: i, fine: i + r[0].length, testo: '' });
      for (const v of voci) inCoda.push(`${NOMI.esporta}.${v.locale} = ${v.importato};`);
      continue;
    }
    throw new ErroreImpacchetta(`${dove(i)}: forma di export non supportata «${src.slice(i, src.indexOf('\n', i) === -1 ? undefined : src.indexOf('\n', i)).trim()}»`);
  }

  // import.meta → oggetto sintetico
  let usaMeta = false;
  for (const m of src.matchAll(/\bimport\.meta\b/g)) {
    if (maschera[m.index]) continue;
    usaMeta = true;
    modifiche.push({ inizio: m.index, fine: m.index + m[0].length, testo: NOMI.meta });
  }

  // controllo: nessun `import(` dinamico nel codice
  for (const m of src.matchAll(/\bimport\s*\(/g)) {
    if (!maschera[m.index]) throw new ErroreImpacchetta(`${dove(m.index)}: \`import()\` dinamico non supportato (il pacchetto è un unico script; rendi l'import statico)`);
  }

  modifiche.sort((a, b) => b.inizio - a.inizio);
  for (let k = 1; k < modifiche.length; k++) {
    if (modifiche[k].fine > modifiche[k - 1].inizio) throw new ErroreImpacchetta(`${chiave}: modifiche sovrapposte (bug del tool)`);
  }
  let codice = src;
  for (const m of modifiche) codice = codice.slice(0, m.inizio) + m.testo + codice.slice(m.fine);

  const corpo = [
    ...(inTesta.length ? [inTesta.join(' ')] : []),
    codice.replace(/\s+$/, ''),
    ...(inCoda.length ? [inCoda.join(' ')] : []),
  ].join('\n');
  return { codice: corpo, dipendenze: [...dipendenze], usaMeta };
}

/** Verifica con `node --check` che il corpo trasformato sia una funzione valida (strict, non async). */
function verificaSintassi(corpo, chiave, cartellaTemporanea) {
  const file = path.join(cartellaTemporanea, `${chiave.replace(/[^\w.-]+/g, '_')}.js`);
  // il prefisso sta sulla prima riga del corpo: i numeri di riga segnalati da node coincidono con quelli del modulo
  fs.writeFileSync(file, `'use strict'; (function (${NOMI.esporta}, ${NOMI.richiedi}, ${NOMI.meta}) {${corpo}\n});\n`);
  const esito = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (esito.status !== 0) {
    const testo = (esito.stderr || esito.stdout || '').replace(new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), chiave);
    if (/await is only valid|Unexpected reserved word|await/.test(testo) && /\bawait\b/.test(corpo)) {
      throw new ErroreImpacchetta(`${chiave}: top-level \`await\` non supportato dal pacchetto (il modulo diventa una funzione sincrona). Sposta l'await dentro una funzione async.\n${testo}`);
    }
    throw new ErroreImpacchetta(`${chiave}: il modulo trasformato non è sintatticamente valido (forma non riconosciuta dal tool?)\n${testo}`);
  }
}

// ---------------------------------------------------------------------------------------------
// Grafo dei moduli
// ---------------------------------------------------------------------------------------------

function chiaveDaPagina(radicePagina, fileAssoluto) {
  const rel = path.relative(radicePagina, fileAssoluto).split(path.sep).join('/');
  if (rel.startsWith('..')) throw new ErroreImpacchetta(`il modulo ${fileAssoluto} è fuori dalla cartella della pagina (${radicePagina})`);
  return `/${rel}`;
}

/**
 * Carica e trasforma tutti i moduli raggiungibili dall'ingresso.
 * @returns {{ ordine: string[], moduli: Map<string, { codice: string, usaMeta: boolean, dipendenze: string[] }>, cicli: string[][] }}
 */
function costruisciGrafo(radicePagina, chiaveIngresso, cartellaTemporanea) {
  const moduli = new Map();
  const ordine = [];
  const cicli = [];
  const stato = new Map(); // chiave → 'in corso' | 'fatto'
  const pila = [];

  function visita(chiave) {
    if (stato.get(chiave) === 'fatto') return;
    if (stato.get(chiave) === 'in corso') {
      cicli.push([...pila.slice(pila.indexOf(chiave)), chiave]);
      return;
    }
    stato.set(chiave, 'in corso');
    pila.push(chiave);
    const file = path.join(radicePagina, chiave);
    if (!fs.existsSync(file)) {
      const da = pila.length > 1 ? ` (importato da ${pila[pila.length - 2]})` : '';
      throw new ErroreImpacchetta(`modulo non trovato: ${chiave}${da}`);
    }
    const src = fs.readFileSync(file, 'utf8');
    const risolvi = (spec) => chiaveDaPagina(radicePagina, path.resolve(path.dirname(file), spec));
    const t = trasformaModulo(src, chiave, risolvi);
    verificaSintassi(t.codice, chiave, cartellaTemporanea);
    moduli.set(chiave, t);
    for (const d of t.dipendenze) visita(d);
    pila.pop();
    stato.set(chiave, 'fatto');
    ordine.push(chiave);
  }
  visita(chiaveIngresso);
  return { ordine, moduli, cicli };
}

// ---------------------------------------------------------------------------------------------
// HTML, CSS, contenuti
// ---------------------------------------------------------------------------------------------

/** Attributi di un tag HTML `<nome a="b" c>` → oggetto (chiavi minuscole). */
function attributi(tag) {
  const esito = {};
  const corpo = tag.replace(/^<\s*[\w-]+/, '').replace(/\/?>$/, '');
  for (const m of corpo.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    esito[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return esito;
}

function analizzaPagina(html, fileHtml) {
  const script = [];
  for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    const a = attributi(m[0].slice(0, m[0].indexOf('>') + 1));
    script.push({ tag: m[0], indice: m.index, attributi: a, interno: m[1] });
  }
  const moduloConSrc = script.filter((s) => (s.attributi.type ?? '').toLowerCase() === 'module' && s.attributi.src);
  if (moduloConSrc.length !== 1) {
    throw new ErroreImpacchetta(`${fileHtml}: attesi esattamente uno <script type="module" src="…">, trovati ${moduloConSrc.length}`);
  }
  const altri = script.filter((s) => s !== moduloConSrc[0] && !/^(application\/json|application\/ld\+json|text\/template)$/i.test(s.attributi.type ?? ''));
  for (const s of altri) {
    if (s.attributi.src) throw new ErroreImpacchetta(`${fileHtml}: <script src="${s.attributi.src}"> classico non supportato (il tool inlinea solo il grafo dei moduli ES)`);
    if ((s.attributi.type ?? '').toLowerCase() === 'module') throw new ErroreImpacchetta(`${fileHtml}: <script type="module"> inline non supportato`);
  }
  const fogli = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const a = attributi(m[0]);
    const rel = (a.rel ?? '').toLowerCase().split(/\s+/);
    if (rel.includes('stylesheet')) {
      if (!a.href) throw new ErroreImpacchetta(`${fileHtml}: <link rel="stylesheet"> senza href`);
      if (/^(https?:)?\/\//i.test(a.href) || /^data:/i.test(a.href)) throw new ErroreImpacchetta(`${fileHtml}: foglio di stile remoto non supportato: ${a.href}`);
      fogli.push({ tag: m[0], indice: m.index, href: a.href });
    } else if (rel.includes('modulepreload')) {
      fogli.push({ tag: m[0], indice: m.index, href: null }); // rimosso
    }
  }
  const titolo = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i);
  if (!body) throw new ErroreImpacchetta(`${fileHtml}: manca <body>`);
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i);
  return { script: moduloConSrc[0], fogli, titolo: titolo ? titolo[0] : null, body: body[1], head: head ? head[1] : '' };
}

function inlineaCss(fileCss, radicePagina) {
  if (!fs.existsSync(fileCss)) throw new ErroreImpacchetta(`foglio di stile non trovato: ${chiaveDaPagina(radicePagina, fileCss)}`);
  let css = fs.readFileSync(fileCss, 'utf8');
  if (/@import\b/.test(css)) throw new ErroreImpacchetta(`${chiaveDaPagina(radicePagina, fileCss)}: @import non supportato (inlinea il foglio con un <link> nella pagina)`);
  css = css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (tutto, virgolette, riferimento) => {
    const r = riferimento.trim();
    if (/^(data:|https?:|\/\/|#|blob:)/i.test(r)) return tutto;
    const pulito = r.replace(/[?#].*$/, '');
    const file = path.resolve(path.dirname(fileCss), pulito);
    if (!fs.existsSync(file)) throw new ErroreImpacchetta(`${chiaveDaPagina(radicePagina, fileCss)}: risorsa url(${r}) non trovata`);
    const mime = MIME[path.extname(file).toLowerCase()];
    if (!mime) throw new ErroreImpacchetta(`${chiaveDaPagina(radicePagina, fileCss)}: tipo MIME sconosciuto per url(${r})`);
    return `url("data:${mime};base64,${fs.readFileSync(file).toString('base64')}")`;
  });
  if (/<\/style/i.test(css)) throw new ErroreImpacchetta(`${chiaveDaPagina(radicePagina, fileCss)}: contiene «</style», non inlineabile`);
  return css;
}

/** Tutti i JSON sotto `cartella`, ricorsivamente: chiave relativa alla pagina (es. `contenuti/parametri/ferruccio.json`). */
function raccogliContenuti(radicePagina, cartella) {
  const mappa = {};
  const base = path.join(radicePagina, cartella);
  if (!fs.existsSync(base)) throw new ErroreImpacchetta(`cartella dei contenuti non trovata: ${cartella}`);
  const visita = (dir) => {
    for (const voce of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(dir, voce.name);
      if (voce.isDirectory()) visita(p);
      else if (voce.isFile() && voce.name.endsWith('.json')) {
        const chiave = path.relative(radicePagina, p).split(path.sep).join('/');
        try {
          mappa[chiave] = JSON.parse(fs.readFileSync(p, 'utf8'));
        } catch (e) {
          throw new ErroreImpacchetta(`${chiave}: JSON non valido — ${e.message}`);
        }
      }
    }
  };
  visita(base);
  return mappa;
}

/** Rende un testo sicuro dentro uno <script> inline (chiusura del tag e commenti HTML). */
function sicuroInScript(testo) {
  return testo.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
}

// ---------------------------------------------------------------------------------------------
// Composizione dello script
// ---------------------------------------------------------------------------------------------

function componiScript({ ordine, moduli, chiaveIngresso, contenuti }) {
  const righe = [];
  righe.push(`'use strict';`);
  righe.push(`// Generato da tools/impacchetta.js — NON modificare a mano: rigenera dal sorgente in gioco/.`);
  righe.push(`(function () {`);
  // --- contenuti e fetch
  righe.push(`  var ${NOMI.contenuti} = ${JSON.stringify(contenuti)};`);
  righe.push(`  var __fetchOriginale = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;`);
  righe.push(`  function __chiaveContenuto(input) {`);
  righe.push(`    var grezzo = typeof input === 'string' ? input : (input && typeof input.url === 'string') ? input.url : (input && typeof input.href === 'string') ? input.href : null;`);
  righe.push(`    if (grezzo === null) return null;`);
  righe.push(`    var candidati = [grezzo.replace(/[?#][\\s\\S]*$/, '').replace(/^(\\.\\/)+/, '').replace(/^\\//, '')];`);
  righe.push(`    try {`);
  righe.push(`      var u = new URL(grezzo, document.baseURI); u.search = ''; u.hash = '';`);
  righe.push(`      var base = new URL('.', document.baseURI).href;`);
  righe.push(`      if (u.href.indexOf(base) === 0) candidati.push(decodeURIComponent(u.href.slice(base.length)));`);
  righe.push(`    } catch (e) { /* URL non analizzabile: si prova solo il percorso grezzo */ }`);
  righe.push(`    for (var i = 0; i < candidati.length; i++) if (Object.prototype.hasOwnProperty.call(${NOMI.contenuti}, candidati[i])) return candidati[i];`);
  righe.push(`    return null;`);
  righe.push(`  }`);
  righe.push(`  function __risposta(testo) {`);
  righe.push(`    if (typeof Response === 'function') { try { return new Response(testo, { status: 200, headers: { 'Content-Type': 'application/json' } }); } catch (e) { /* ambiente senza Response utilizzabile */ } }`);
  righe.push(`    return { ok: true, status: 200, statusText: 'OK', url: '', headers: { get: function (n) { return /content-type/i.test(n) ? 'application/json' : null; } },`);
  righe.push(`      json: function () { return Promise.resolve(JSON.parse(testo)); }, text: function () { return Promise.resolve(testo); }, clone: function () { return __risposta(testo); } };`);
  righe.push(`  }`);
  righe.push(`  window.fetch = function (input, init) {`);
  righe.push(`    var chiave = __chiaveContenuto(input);`);
  righe.push(`    if (chiave !== null) return Promise.resolve(__risposta(JSON.stringify(${NOMI.contenuti}[chiave])));`);
  righe.push(`    if (__fetchOriginale) return __fetchOriginale(input, init);`);
  righe.push(`    return Promise.reject(new TypeError('impacchetta: fetch non disponibile per ' + String(input)));`);
  righe.push(`  };`);
  // --- registro
  righe.push(`  var ${NOMI.moduli} = Object.create(null);`);
  righe.push(`  var __cache = Object.create(null);`);
  righe.push(`  function ${NOMI.richiedi}(chiave) {`);
  righe.push(`    var e = __cache[chiave];`);
  righe.push(`    if (e) return e; // anche parziale, per i riferimenti circolari`);
  righe.push(`    var f = ${NOMI.moduli}[chiave];`);
  righe.push(`    if (!f) throw new Error('impacchetta: modulo sconosciuto ' + chiave);`);
  righe.push(`    e = __cache[chiave] = Object.create(null);`);
  righe.push(`    f(e, ${NOMI.richiedi});`);
  righe.push(`    return e;`);
  righe.push(`  }`);
  for (const chiave of ordine) {
    const m = moduli.get(chiave);
    righe.push(`  // ---- ${chiave}`);
    righe.push(`  ${NOMI.moduli}[${JSON.stringify(chiave)}] = function (${NOMI.esporta}, ${NOMI.richiedi}) {`);
    if (m.usaMeta) righe.push(`  var ${NOMI.meta} = { url: new URL(${JSON.stringify(chiave.slice(1))}, document.baseURI).href };`);
    righe.push(m.codice);
    righe.push(`  };`);
  }
  righe.push(`  function __avvia() { ${NOMI.richiedi}(${JSON.stringify(chiaveIngresso)}); }`);
  righe.push(`  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', __avvia); else __avvia();`);
  righe.push(`})();`);
  return sicuroInScript(righe.join('\n'));
}

// ---------------------------------------------------------------------------------------------
// Programma principale
// ---------------------------------------------------------------------------------------------

function impacchetta(opzioni, log = console) {
  const radice = process.cwd();
  const fileHtml = path.resolve(radice, opzioni.entrata);
  const fileUscita = path.resolve(radice, opzioni.uscita);
  if (!fs.existsSync(fileHtml)) throw new ErroreImpacchetta(`pagina d'ingresso non trovata: ${opzioni.entrata}`);
  const radicePagina = path.dirname(fileHtml);
  const html = fs.readFileSync(fileHtml, 'utf8');
  const pagina = analizzaPagina(html, opzioni.entrata);

  const src = pagina.script.attributi.src;
  if (/^(https?:)?\/\//i.test(src)) throw new ErroreImpacchetta(`${opzioni.entrata}: modulo d'ingresso remoto non supportato: ${src}`);
  const chiaveIngresso = chiaveDaPagina(radicePagina, path.resolve(radicePagina, src.replace(/[?#].*$/, '')));

  const cartellaTemporanea = fs.mkdtempSync(path.join(os.tmpdir(), 'impacchetta-'));
  let grafo;
  try {
    grafo = costruisciGrafo(radicePagina, chiaveIngresso, cartellaTemporanea);
  } finally {
    fs.rmSync(cartellaTemporanea, { recursive: true, force: true });
  }
  for (const c of grafo.cicli) log.warn(`avviso: import circolare ${c.join(' → ')} (il registro restituisce l'oggetto parziale; le costanti del modulo in corso sono ancora undefined)`);

  const css = pagina.fogli.filter((f) => f.href !== null).map((f) => ({ ...f, testo: inlineaCss(path.resolve(radicePagina, f.href.replace(/[?#].*$/, '')), radicePagina) }));
  const contenuti = raccogliContenuti(radicePagina, 'contenuti');
  const script = componiScript({ ordine: grafo.ordine, moduli: grafo.moduli, chiaveIngresso, contenuti });

  const blocchiStile = (f) => `<style>\n/* ${f.href} */\n${f.testo}\n</style>`;
  const blocoScript = `<script>\n${script}\n</script>`;
  let uscita;
  if (opzioni.frammento) {
    const meta = [...pagina.head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]).filter((t) => {
      const a = attributi(t);
      return !('charset' in a) && (a.name ?? '').toLowerCase() !== 'viewport';
    });
    const corpoSenzaScript = pagina.body.replace(pagina.script.tag, '').trim();
    uscita = [
      `<!-- Generato da tools/impacchetta.js (frammento): ${opzioni.entrata} -->`,
      pagina.titolo ?? '',
      ...meta,
      ...css.map(blocchiStile),
      blocoScript,
      corpoSenzaScript,
    ].filter(Boolean).join('\n') + '\n';
  } else {
    uscita = html;
    // sostituzioni dal fondo verso l'inizio per non spostare gli indici
    const sostituzioni = [
      ...pagina.fogli.map((f) => ({ indice: f.indice, tag: f.tag, testo: f.href === null ? '' : blocchiStile(css.find((c) => c.indice === f.indice)) })),
      { indice: pagina.script.indice, tag: pagina.script.tag, testo: blocoScript },
    ].sort((a, b) => b.indice - a.indice);
    for (const s of sostituzioni) uscita = uscita.slice(0, s.indice) + s.testo + uscita.slice(s.indice + s.tag.length);
    uscita = uscita.replace(/^(\s*)<html\b/, `$1<!-- Generato da tools/impacchetta.js da ${opzioni.entrata}: NON modificare a mano -->\n$1<html`);
  }

  // scrittura atomica
  fs.mkdirSync(path.dirname(fileUscita), { recursive: true });
  const temporaneo = `${fileUscita}.tmp-${process.pid}`;
  fs.writeFileSync(temporaneo, uscita);
  fs.renameSync(temporaneo, fileUscita);

  const dimensione = Buffer.byteLength(uscita);
  log.log(`impacchetta: ${opzioni.entrata} → ${path.relative(radice, fileUscita)}${opzioni.frammento ? ' (frammento)' : ''}`);
  log.log(`  moduli: ${grafo.ordine.length}  fogli di stile: ${css.length}  contenuti JSON: ${Object.keys(contenuti).length}  dimensione: ${(dimensione / 1024).toFixed(1)} KiB`);
  if (opzioni.dettagli) {
    for (const k of grafo.ordine) log.log(`  modulo ${k}${grafo.moduli.get(k).usaMeta ? ' (import.meta)' : ''}`);
    for (const f of css) log.log(`  stile ${f.href}`);
    for (const k of Object.keys(contenuti)) log.log(`  contenuto ${k}`);
  }
  return { fileUscita, dimensione, moduli: grafo.ordine, contenuti: Object.keys(contenuti), cicli: grafo.cicli };
}

if (require.main === module) {
  try {
    const opzioni = leggiOpzioni(process.argv.slice(2));
    if (opzioni.aiuto) {
      console.log(aiuto());
    } else {
      impacchetta(opzioni);
    }
  } catch (e) {
    if (e instanceof ErroreImpacchetta) {
      console.error(`impacchetta: ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
}

module.exports = { impacchetta, trasformaModulo, leggiOpzioni, ErroreImpacchetta };
