#!/usr/bin/env node
/**
 * tools/avventura-valida.js — controlla che i dati dell'avventura (gioco/avventura/storia/*.js) rispettino il
 * contratto di gioco/avventura/LEGGIMI.md: campi, id unici, riferimenti (quadri, oggetti, personaggi, dialoghi,
 * flag e loro valori), nomi e forma delle azioni, condizioni, misure dei punti, elementi del fondale.
 * Non apre il browser: carica i file in un contesto vuoto dove `AV` registra soltanto.
 * Uso: node tools/avventura-valida.js [--elenco]   (--elenco stampa anche il conto per capitolo)
 * Esce con 1 se trova errori. `caricaStoria()` è esportata per gli altri strumenti (esploratore, elenco dei testi).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RADICE = path.resolve(__dirname, '..');
const CARTELLA = path.join(RADICE, 'gioco', 'avventura', 'storia');

const GENERI = ['flag', 'personaggio', 'oggetto', 'capitolo', 'quadro', 'dialogo', 'finale'];
/** nome dell'azione → [numero minimo di argomenti, numero massimo] */
const AZIONI = {
  dice: [2, 2], pensa: [1, 1], flag: [2, 2], segna: [1, 1], prendi: [1, 1], togli: [1, 1], vai: [1, 1], scelta: [1, 1],
  se: [2, 3], unaVolta: [2, 3], dialogo: [1, 1], diario: [1, 1], obiettivo: [1, 1], posa: [2, 2], mostra: [1, 1],
  nascondi: [1, 1], effetto: [1, 1], suono: [1, 1], attendi: [1, 1], capitolo: [1, 1], finale: [0, 1],
};
const EFFETTI = ['buio', 'luce', 'lampo', 'scossa', 'velo', 'anime', 'sipario'];
const CHI_SPECIALI = ['didascalia', 'voce'];
const ELEMENTI = ['cielo', 'quinte', 'suolo', 'case', 'palazzo', 'arco', 'colonna', 'porta', 'finestra', 'lampione', 'albero',
  'siepe', 'fontana', 'statua', 'banco', 'telaio', 'scala', 'tenda', 'muro', 'luce', 'nebbia', 'fili', 'immagine', 'forma'];
const SAGOME = ['uomo', 'donna', 'bambina', 'vecchio', 'guardia', 'gatto', 'ombra', 'anima', 'lampione', 'porta', 'finestra',
  'foglio', 'libro', 'chiave', 'ferro', 'cassa', 'telaio', 'statua', 'campana', 'fontana'];
const CHIAVI_COND = ['flag', 'ha', 'nonHa', 'visto', 'nonVisto', 'tutti', 'uno', 'non'];
const AREA = { w: 640, yMin: 16, yMax: 292 };

/** Carica i file della storia e rende { flag, personaggio, …: Map id → voce, file: [nomi], errori: [] }. */
function caricaStoria(cartella = CARTELLA) {
  const S = { errori: [], file: [] };
  for (const g of GENERI) S[g] = new Map();
  let corrente = '';
  const AV = {};
  for (const g of GENERI) {
    AV[g] = (voce) => {
      if (!voce || typeof voce !== 'object' || typeof voce.id !== 'string') { S.errori.push(`${corrente}: AV.${g}() senza id`); return; }
      if (!/^[a-z0-9][a-z0-9._-]*$/.test(voce.id)) S.errori.push(`${corrente}: id «${voce.id}» non valido (minuscole, cifre, punto, trattino)`);
      if (S[g].has(voce.id)) S.errori.push(`${corrente}: ${g} «${voce.id}» registrato due volte (anche in ${S[g].get(voce.id)._file})`);
      S[g].set(voce.id, Object.assign(voce, { _file: corrente }));
    };
  }
  const nomi = fs.existsSync(cartella) ? fs.readdirSync(cartella).filter((n) => n.endsWith('.js')).sort() : [];
  for (const nome of nomi) {
    corrente = nome;
    S.file.push(nome);
    try { vm.runInNewContext(fs.readFileSync(path.join(cartella, nome), 'utf8'), { AV, console }, { filename: nome }); }
    catch (err) { S.errori.push(`${nome}: non si carica: ${err.message}`); }
  }
  return S;
}

/** Controlla la storia caricata; aggiunge a S.errori e rende i conteggi. */
function valida(S) {
  const err = (dove, msg) => S.errori.push(`${dove}: ${msg}`);
  const conta = { battute: 0, scelte: 0, azioni: 0 };
  const segnati = new Set(); const cercati = new Set(); const presi = new Set(); const usati = new Set();
  const lista = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

  function condizione(c, dove) {
    if (c === undefined) return;
    if (!c || typeof c !== 'object' || Array.isArray(c)) { err(dove, 'condizione non è un oggetto'); return; }
    for (const k of Object.keys(c)) if (!CHIAVI_COND.includes(k)) err(dove, `condizione: chiave «${k}» sconosciuta`);
    for (const [k, v] of Object.entries(c.flag || {})) {
      const F = S.flag.get(k);
      if (!F) { err(dove, `condizione: flag «${k}» non dichiarato`); continue; }
      for (const x of lista(v)) if (x !== '' && x !== '*' && !(F.valori || []).includes(x)) err(dove, `condizione: «${x}» non è un valore di «${k}»`);
    }
    for (const o of lista(c.ha).concat(lista(c.nonHa))) { if (!S.oggetto.has(o)) err(dove, `condizione: oggetto «${o}» non esiste`); usati.add(o); }
    for (const k of lista(c.visto).concat(lista(c.nonVisto))) cercati.add(k);
    for (const sub of lista(c.tutti).concat(lista(c.uno))) condizione(sub, dove);
    if (c.non !== undefined) condizione(c.non, dove);
  }

  function azioni(arr, dove, contesto = {}) {
    if (arr === undefined) return;
    if (!Array.isArray(arr)) { err(dove, 'le azioni devono essere un array'); return; }
    arr.forEach((a, i) => {
      const qui = `${dove}[${i}]`;
      if (!Array.isArray(a) || typeof a[0] !== 'string') { err(qui, 'azione non è un array che comincia col nome'); return; }
      const [nome, ...arg] = a;
      const forma = AZIONI[nome];
      if (!forma) { err(qui, `azione «${nome}» sconosciuta`); return; }
      if (arg.length < forma[0] || arg.length > forma[1]) err(qui, `«${nome}» vuole da ${forma[0]} a ${forma[1]} argomenti, ne ha ${arg.length}`);
      conta.azioni++;
      const testo = (t) => { if (typeof t !== 'string' || !t.trim()) err(qui, `«${nome}»: testo vuoto`); };
      if (nome === 'dice') { conta.battute++; testo(arg[1]); if (!CHI_SPECIALI.includes(arg[0]) && !S.personaggio.has(arg[0])) err(qui, `«dice»: personaggio «${arg[0]}» non esiste`); if (arg[0] === 'ferruccio') err(qui, 'Ferruccio non parla: usa «pensa» o una didascalia'); }
      else if (nome === 'pensa' || nome === 'diario' || nome === 'obiettivo') { conta.battute++; testo(arg[0]); }
      else if (nome === 'flag') { const F = S.flag.get(arg[0]); if (!F) err(qui, `flag «${arg[0]}» non dichiarato`); else if (!(F.valori || []).includes(arg[1])) err(qui, `«${arg[1]}» non è un valore di «${arg[0]}»`); }
      else if (nome === 'segna') segnati.add(arg[0]);
      else if (nome === 'prendi') { if (!S.oggetto.has(arg[0])) err(qui, `oggetto «${arg[0]}» non esiste`); presi.add(arg[0]); }
      else if (nome === 'togli') { if (!S.oggetto.has(arg[0])) err(qui, `oggetto «${arg[0]}» non esiste`); }
      else if (nome === 'vai') { if (!S.quadro.has(arg[0])) err(qui, `quadro «${arg[0]}» non esiste`); }
      else if (nome === 'dialogo') { if (!S.dialogo.has(arg[0])) err(qui, `dialogo «${arg[0]}» non esiste`); }
      else if (nome === 'capitolo') { if (!S.capitolo.has(arg[0])) err(qui, `capitolo «${arg[0]}» non esiste`); }
      else if (nome === 'finale') { if (arg[0] !== undefined && !S.finale.has(arg[0])) err(qui, `finale «${arg[0]}» non esiste`); }
      else if (nome === 'effetto') { if (!EFFETTI.includes(arg[0])) err(qui, `effetto «${arg[0]}» sconosciuto`); }
      else if (nome === 'attendi') { if (typeof arg[0] !== 'number') err(qui, '«attendi» vuole i millisecondi'); }
      else if (nome === 'posa' || nome === 'mostra' || nome === 'nascondi') { if (contesto.punti && !contesto.punti.has(arg[0])) err(qui, `«${nome}»: il punto «${arg[0]}» non è di questo quadro`); }
      else if (nome === 'se') { condizione(arg[0], qui); azioni(arg[1], `${qui}.allora`, contesto); azioni(arg[2], `${qui}.altrimenti`, contesto); }
      else if (nome === 'unaVolta') { if (typeof arg[0] !== 'string') err(qui, '«unaVolta» vuole una chiave'); segnati.add(arg[0]); azioni(arg[1], `${qui}.prima`, contesto); azioni(arg[2], `${qui}.poi`, contesto); }
      else if (nome === 'scelta') {
        conta.scelte++;
        if (!Array.isArray(arg[0]) || arg[0].length < 2) { err(qui, '«scelta» vuole almeno due voci'); return; }
        arg[0].forEach((v, k) => { if (!v || typeof v.testo !== 'string' || !v.testo.trim()) err(`${qui}.voce${k}`, 'voce senza testo'); condizione(v && v.se, `${qui}.voce${k}`); azioni(v && v.fai, `${qui}.voce${k}`, contesto); });
      }
    });
  }

  function figura(f, dove) {
    if (!f) return;
    if (f.sagoma !== undefined && !SAGOME.includes(f.sagoma)) err(dove, `sagoma «${f.sagoma}» sconosciuta`);
    if (f.sagoma === undefined && f.foglio === undefined && f.punti === undefined) err(dove, 'figura senza foglio, sagoma o punti');
  }

  for (const F of S.flag.values()) if (!Array.isArray(F.valori) || !F.valori.length) err(`flag ${F.id}`, 'senza valori');
  for (const P of S.personaggio.values()) { if (!P.nome) err(`personaggio ${P.id}`, 'senza nome'); figura(P.figura, `personaggio ${P.id}`); }
  for (const O of S.oggetto.values()) {
    if (!O.nome || !O.descrizione) err(`oggetto ${O.id}`, 'serve nome e descrizione');
    figura(O.icona, `oggetto ${O.id}`);
    azioni(O.guarda, `oggetto ${O.id}.guarda`);
    for (const [k, a] of Object.entries(O.combina || {})) { if (!S.oggetto.has(k)) err(`oggetto ${O.id}.combina`, `«${k}» non esiste`); azioni(a, `oggetto ${O.id}.combina.${k}`); }
  }
  for (const C of S.capitolo.values()) if (!C.titolo || typeof C.ordine !== 'number') err(`capitolo ${C.id}`, 'serve titolo e ordine');

  for (const Q of S.quadro.values()) {
    const dove = `quadro ${Q.id}`;
    if (!S.capitolo.has(Q.capitolo)) err(dove, `capitolo «${Q.capitolo}» non esiste`);
    if (!Q.nome) err(dove, 'senza nome');
    const fd = Q.fondale || {};
    if (!fd.immagine && !Array.isArray(fd.disegno)) err(dove, 'fondale senza immagine né disegno');
    for (const el of fd.disegno || []) if (!Array.isArray(el) || !ELEMENTI.includes(el[0])) err(dove, `elemento del fondale «${el && el[0]}» sconosciuto`);
    const punti = new Set();
    for (const p of Q.punti || []) {
      const qui = `${dove}.${p && p.id}`;
      if (!p || typeof p.id !== 'string') { err(dove, 'punto senza id'); continue; }
      if (punti.has(p.id)) err(qui, 'id del punto ripetuto nel quadro');
      punti.add(p.id);
    }
    const contesto = { punti };
    azioni(Q.entrata, `${dove}.entrata`, contesto);
    for (const p of Q.punti || []) {
      if (!p || typeof p.id !== 'string') continue;
      const qui = `${dove}.${p.id}`;
      if (!p.nome) err(qui, 'senza nome');
      if (![p.x, p.y, p.w, p.h].every((n) => typeof n === 'number')) err(qui, 'servono x, y, w, h');
      else if (p.x < 0 || p.x + p.w > AREA.w || p.y < AREA.yMin || p.y + p.h > AREA.yMax) err(qui, `fuori dalla scena (x 0-${AREA.w}, y ${AREA.yMin}-${AREA.yMax})`);
      if (p.personaggio !== undefined && !S.personaggio.has(p.personaggio)) err(qui, `personaggio «${p.personaggio}» non esiste`);
      if (p.sagoma !== undefined && !SAGOME.includes(p.sagoma)) err(qui, `sagoma «${p.sagoma}» sconosciuta`);
      if (p.uscita !== undefined && !S.quadro.has(p.uscita)) err(qui, `uscita verso «${p.uscita}», che non esiste`);
      if (p.uscita === undefined && p.usa === undefined && p.guarda === undefined && p.con === undefined) err(qui, 'punto che non fa niente (né uscita, né usa, né guarda, né con)');
      condizione(p.se, qui);
      for (const k of ['guarda', 'usa', 'chiuso']) azioni(p[k], `${qui}.${k}`, contesto);
      for (const [k, a] of Object.entries(p.con || {})) { if (k !== '*' && !S.oggetto.has(k)) err(`${qui}.con`, `oggetto «${k}» non esiste`); else if (k !== '*') usati.add(k); azioni(a, `${qui}.con.${k}`, contesto); }
    }
  }
  for (const D of S.dialogo.values()) {
    const dove = `dialogo ${D.id}`;
    if (D.con !== undefined && !S.personaggio.has(D.con)) err(dove, `personaggio «${D.con}» non esiste`);
    azioni(D.inizio, `${dove}.inizio`); azioni(D.saluto, `${dove}.saluto`);
    const visti = new Set();
    for (const t of D.temi || []) {
      if (!t || typeof t.id !== 'string' || !t.testo) { err(dove, 'tema senza id o testo'); continue; }
      if (visti.has(t.id)) err(dove, `tema «${t.id}» ripetuto`);
      visti.add(t.id);
      condizione(t.se, `${dove}.${t.id}`); azioni(t.fai, `${dove}.${t.id}`);
    }
  }
  for (const F of S.finale.values()) {
    const dove = `finale ${F.id}`;
    if (!F.titolo || !F.riassunto) err(dove, 'serve titolo e riassunto');
    condizione(F.se, dove); azioni(F.scene, `${dove}.scene`);
  }
  // avvisi (non errori): cose cercate e mai segnate, oggetti mai presi o mai usati
  const avvisi = [];
  for (const k of cercati) if (!segnati.has(k)) avvisi.push(`«${k}» è cercato con visto/nonVisto ma nessuna azione lo segna`);
  for (const o of S.oggetto.keys()) { if (!presi.has(o)) avvisi.push(`oggetto «${o}» mai preso`); else if (!usati.has(o)) avvisi.push(`oggetto «${o}» preso ma mai usato in una condizione o in un «con»`); }
  return { conta, avvisi };
}

if (require.main === module) {
  const S = caricaStoria();
  const { conta, avvisi } = valida(S);
  const righe = [`file: ${S.file.length} · capitoli ${S.capitolo.size} · quadri ${S.quadro.size} · dialoghi ${S.dialogo.size} · oggetti ${S.oggetto.size} · personaggi ${S.personaggio.size} · flag ${S.flag.size} · finali ${S.finale.size}`,
    `battute e didascalie: ${conta.battute} · scelte: ${conta.scelte} · azioni: ${conta.azioni}`];
  if (process.argv.includes('--elenco')) {
    for (const C of [...S.capitolo.values()].sort((a, b) => a.ordine - b.ordine)) righe.push(`  ${C.ordine}. ${C.titolo}: ${[...S.quadro.values()].filter((q) => q.capitolo === C.id).length} quadri`);
  }
  console.log(righe.join('\n'));
  for (const a of avvisi) console.log(`avviso: ${a}`);
  for (const e of S.errori) console.log(`ERRORE ${e}`);
  console.log(S.errori.length ? `\n${S.errori.length} errori` : '\nnessun errore');
  process.exit(S.errori.length ? 1 : 0);
}

module.exports = { caricaStoria, valida, RADICE, CARTELLA, AZIONI, ELEMENTI, SAGOME, EFFETTI };
