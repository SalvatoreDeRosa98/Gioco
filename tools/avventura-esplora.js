#!/usr/bin/env node
/**
 * tools/avventura-esplora.js — l'esploratore dei percorsi dell'avventura (Node, niente browser).
 *
 * Carica il motore (gioco/avventura/01-logica.js) e i file di storia, poi percorre lo spazio degli stati con una
 * ricerca in ampiezza partendo da una partita nuova. Una MOSSA è ciò che può fare il giocatore:
 *   - nel quadro: guardare / usare ogni punto visibile, usarlo con ciascun oggetto in mano;
 *   - nell'inventario: guardare un oggetto, combinare due oggetti;
 *   - in un dialogo aperto: scegliere un tema, oppure allontanarsi;
 *   - ogni voce di ogni ['scelta'] incontrata è un ramo a sé.
 * Lo STATO confrontato è: quadro + dialogo aperto + flag + inventario + chiavi `visti` rilevanti + `nascosti` + `pose`
 * + temi fatti rilevanti (normalizzati e ridotti a un hash). Una chiave `visti` (o un tema) è «rilevante» se qualche
 * condizione la legge, o se l'unaVolta/il tema che la scrive ha effetti sullo stato: le chiavi delle sole righe di
 * colore non moltiplicano gli stati. Diario, obiettivo e cartelli di capitolo sono presentazione e non contano.
 *
 * Dice (ed esce con 1 se trova problemi):
 *   - i VICOLI CIECHI: stati raggiungibili da cui nessun finale è più raggiungibile (con un cammino d'esempio);
 *   - le 64 combinazioni delle sei decisioni: per ognuna se si arriva a un finale e a quale; quelle impossibili
 *     per regola (gregorio = dialogo senza prove) sono elencate a parte;
 *   - i 17 finali: quali sono raggiungibili; i ['finale'] che non trovano nessun finale;
 *   - quadri, punti, temi e oggetti MAI raggiungibili;
 *   - il cammino più corto dall'inizio a un finale e una stima delle mosse per vedere tutto.
 *   - gli errori del motore (AV.errori) incontrati durante l'esplorazione.
 *
 * Uso: node tools/avventura-esplora.js [--max N] [--cammini] [--json file]
 *   --max N     tetto agli stati (predefinito 400000): se lo raggiunge lo dice, e il risultato è parziale
 *   --completo  niente tappe: confronta gli stati per intero (molto più grande)
 *   --combinazioni  elenca ogni combinazione col suo finale
 *   --cammini   stampa anche il cammino più corto verso ogni finale (e li mette nel JSON)
 *   --chiudi a,b   quadri in cui l'esploratore non entra (per lasciare fuori le zone facoltative: vedi sotto)
 *   ZONA DA SOLA (le due «strade di fuori» insieme moltiplicano gli stati oltre ogni tetto: si provano una per volta):
 *   --da q --meta k1,k2 [--flag a=b,c=d] [--chiudi …]   parte dal quadro q coi flag dati e cerca i vicoli ciechi
 *               rispetto alla META: tutte le chiavi `visti` k1,k2 segnate e di nuovo nel quadro q.
 *   tools/qa-avventura-percorsi.sh lancia la storia principale e le zone, una dopo l'altra.
 *   --json f    scrive il riassunto in JSON
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const RADICE = path.resolve(__dirname, '..');
const CARTELLA = path.join(RADICE, 'gioco', 'avventura', 'storia');
const DECISIONI = ['tonino_ricordo', 'taddeo', 'registro', 'agnese', 'gregorio', 'violante'];
const PRESENTAZIONE = new Set(['dice', 'pensa', 'diario', 'obiettivo', 'effetto', 'suono', 'attendi', 'capitolo']);

const arg = (nome, def) => { const i = process.argv.indexOf(nome); return i >= 0 ? process.argv[i + 1] : def; };
const MAX = Number(arg('--max', 120000)); // stati al più per ogni tappa
const lista = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
const CHIUSI = new Set(lista(arg('--chiudi', '')));
/** La prova di una zona da sola (o null): { da, meta: [chiavi], flag: {…} }. */
const ZONA = arg('--da') ? { da: arg('--da'), meta: lista(arg('--meta', '')), flag: Object.fromEntries(lista(arg('--flag', '')).map((x) => x.split('='))) } : null;

// ---------------------------------------------------------------- caricamento (motore vero + dati)
function carica() {
  const AV = require(path.join(RADICE, 'gioco', 'avventura', '01-logica.js'));
  const nomi = fs.readdirSync(CARTELLA).filter((n) => n.endsWith('.js')).sort();
  for (const nome of nomi) vm.runInNewContext(fs.readFileSync(path.join(CARTELLA, nome), 'utf8'), { AV, console }, { filename: nome });
  return AV;
}

// ---------------------------------------------------------------- analisi statica: che cosa conta nello stato
function analizza(AV) {
  const letti = new Set(); // chiavi lette da condizioni
  const lista = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
  function cond(c) {
    if (!c || typeof c !== 'object') return;
    for (const k of lista(c.visto).concat(lista(c.nonVisto))) letti.add(k);
    for (const s of lista(c.tutti).concat(lista(c.uno))) cond(s);
    if (c.non) cond(c.non);
  }
  // tutte le liste di azioni dei dati, e intanto le condizioni lette
  const tutte = [];
  const temi = []; const dialoghi = [];
  const raccogli = (arr) => { if (!Array.isArray(arr)) return; tutte.push(arr); for (const a of arr) if (Array.isArray(a)) {
    if (a[0] === 'se') { cond(a[1]); raccogli(a[2]); raccogli(a[3]); } else if (a[0] === 'unaVolta') { raccogli(a[2]); raccogli(a[3]); }
    else if (a[0] === 'scelta') for (const v of a[1] || []) { cond(v && v.se); raccogli(v && v.fai); } } };
  for (const O of AV.dati.oggetto.values()) { raccogli(O.guarda); for (const x of Object.values(O.combina || {})) raccogli(x); }
  for (const Q of AV.dati.quadro.values()) { raccogli(Q.entrata); for (const p of Q.punti || []) { cond(p.se); raccogli(p.guarda); raccogli(p.usa); raccogli(p.chiuso); for (const x of Object.values(p.con || {})) raccogli(x); } }
  for (const D of AV.dati.dialogo.values()) { raccogli(D.inizio); raccogli(D.saluto); dialoghi.push(D); for (const t of D.temi || []) { cond(t.se); raccogli(t.fai); temi.push([D, t]); } }
  for (const F of AV.dati.finale.values()) { cond(F.se); raccogli(F.scene); }
  // punto fisso: una chiave conta se una condizione la legge o se è la chiave di un unaVolta con effetti;
  // un 'segna' ha effetto solo se la sua chiave conta; 'posa' è solo aspetto.
  const visti = new Set(letti);
  const effetti = (arr) => (arr || []).some((a) => {
    if (!Array.isArray(a)) return false;
    const [n, x, y, z] = a;
    if (n === 'se') return effetti(y) || effetti(z);
    if (n === 'unaVolta') return visti.has(x) || effetti(y) || effetti(z);
    if (n === 'segna') return visti.has(x);
    if (n === 'scelta') return true;
    return !PRESENTAZIONE.has(n) && n !== 'posa';
  });
  for (let giro = 0, cambiato = true; cambiato && giro < 50; giro++) {
    cambiato = false;
    for (const arr of tutte) for (const a of arr) if (Array.isArray(a) && a[0] === 'unaVolta' && !visti.has(a[1]) && (effetti(a[2]) || effetti(a[3]))) { visti.add(a[1]); cambiato = true; }
  }
  for (const D of dialoghi) if (effetti(D.inizio) && !effetti(D.saluto)) visti.add('dialogo:' + D.id); else if (effetti(D.inizio) || effetti(D.saluto)) visti.add('dialogo:' + D.id);
  const temiR = new Set();
  for (const [D, t] of temi) if (t.unaVolta && effetti(t.fai)) temiR.add(D.id + '/' + t.id);
  return { visti, temi: temiR, effetti };
}

// ---------------------------------------------------------------- esecuzione con tutti i rami delle scelte
/**
 * Esegue `azioni` su una copia di `base` seguendo OGNI ramo delle scelte. Rende una lista di esiti
 * { stato, dialogo, finale, scelte: [testi] }. `prepara(stato)` (facoltativa) si applica alla copia prima di eseguire.
 */
function tuttiIRami(AV, azioni, base, prepara) {
  const esiti = [];
  const coda = [[]];
  while (coda.length) {
    const risposte = coda.shift();
    const s = AV.copia(base);
    const azz = prepara ? prepara(s) : azioni;
    const c = AV.corsa(azz, s);
    const r = risposte.slice(); const testi = [];
    let dialogo = null; let finale; let ev = c.prossimo(); let rotto = false;
    while (ev) {
      if (ev.tipo === 'scelta') {
        if (r.length) { const i = r.shift(); testi.push((ev.voci.find((v) => v.indice === i) || {}).testo); ev = c.prossimo(i); continue; }
        for (const v of ev.voci) coda.push(risposte.concat(v.indice));
        rotto = true; break;
      }
      if (ev.tipo === 'dialogo') dialogo = ev.id;
      if (ev.tipo === 'vai') dialogo = null; // cambiato quadro: un dialogo chiesto prima non resta aperto
      if (ev.tipo === 'finale') { finale = ev.id; break; }
      ev = c.prossimo();
    }
    if (!rotto) esiti.push({ stato: s, dialogo, finale, scelte: testi });
  }
  return esiti;
}

// ---------------------------------------------------------------- tappe (capitoli) e chiave dello stato
/**
 * Lo spazio completo è troppo grande (le cose facoltative si moltiplicano), quindi si esplora PER TAPPE: la tappa di
 * uno stato è il capitolo più avanzato in cui è entrato. Nella tappa di ordine o lo stato si confronta lasciando
 * fuori le chiavi `visti` (e i `nascosti`/temi) che si leggono e si scrivono SOLO in capitoli di ordine < o: le cose
 * già chiuse dei capitoli passati non moltiplicano gli stati dopo. Si tiene lo stato vero di un rappresentante, e i
 * ritorni indietro si esplorano lo stesso. È un'approssimazione (detta nel resoconto): due giocatori che hanno chiuso
 * la piazza in modi diversi, se in tutto il resto sono uguali, per l'esploratore sono uno solo.
 */
function tappe(AV, R) {
  const ordine = new Map([...AV.dati.capitolo.values()].map((c) => [c.id, c.ordine]));
  const lista = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
  const capDi = new Map(); // chiave → ordine massimo fra lettori e scrittori (Infinity = globale)
  const segna = (k, o) => capDi.set(k, Math.max(capDi.has(k) ? capDi.get(k) : -Infinity, o));
  const oggDi = new Map(); // oggetto → ordine massimo dei capitoli che lo cercano (ha/nonHa/con/combina)
  const ogg = (k, o) => oggDi.set(k, Math.max(oggDi.has(k) ? oggDi.get(k) : -Infinity, o));
  function cond(c, o) { if (!c || typeof c !== 'object') return; for (const k of lista(c.visto).concat(lista(c.nonVisto))) segna(k, o); for (const k of lista(c.ha).concat(lista(c.nonHa))) ogg(k, o); for (const x of lista(c.tutti).concat(lista(c.uno))) cond(x, o); if (c.non) cond(c.non, o); }
  function az(arr, o) { for (const a of arr || []) if (Array.isArray(a)) { const [n, x, y, z] = a;
    if (n === 'unaVolta') { segna(x, o); az(y, o); az(z, o); } else if (n === 'se') { cond(x, o); az(y, o); az(z, o); }
    else if (n === 'scelta') for (const v of x || []) { cond(v && v.se, o); az(v && v.fai, o); } } }
  const dlgCap = new Map();
  for (const Q of AV.dati.quadro.values()) {
    const o = ordine.get(Q.capitolo);
    for (const m of JSON.stringify(Q).matchAll(/\["dialogo","([^"]+)"\]/g)) dlgCap.set(m[1], Math.max(dlgCap.get(m[1]) || -Infinity, o));
    az(Q.entrata, o); for (const p of Q.punti || []) { cond(p.se, o); az(p.guarda, o); az(p.usa, o); az(p.chiuso, o); for (const [k, x] of Object.entries(p.con || {})) { ogg(k, o); az(x, o); } }
  }
  for (const D of AV.dati.dialogo.values()) { const o = dlgCap.has(D.id) ? dlgCap.get(D.id) : Infinity; segna('dialogo:' + D.id, o); az(D.inizio, o); az(D.saluto, o); for (const t of D.temi || []) { cond(t.se, o); az(t.fai, o); } }
  for (const O of AV.dati.oggetto.values()) { az(O.guarda, Infinity); for (const [k, x] of Object.entries(O.combina || {})) { ogg(k, Infinity); ogg(O.id, Infinity); az(x, Infinity); } }
  for (const F of AV.dati.finale.values()) { cond(F.se, Infinity); az(F.scene, Infinity); }
  const tappaDi = (s) => Math.max(0, ...s.capitoli.map((c) => ordine.get(c)).filter((x) => x !== undefined));
  const quadroCap = (q) => { const Q = AV.dati.quadro.get(q.split('/')[0]); return Q ? ordine.get(Q.capitolo) : Infinity; };
  return {
    tappaDi,
    vivaVisto: (k, o) => !capDi.has(k) || capDi.get(k) >= o,
    vivoOggetto: (k, o) => !oggDi.has(k) || oggDi.get(k) >= o,
    vivoNascosto: (k, o) => quadroCap(k) >= o,
    vivoTema: (k, o) => { const d = k.split('/')[0]; return (dlgCap.has(d) ? dlgCap.get(d) : Infinity) >= o; },
  };
}

function chiaveStato(s, dlg, R, T) {
  const o = T ? T.tappaDi(s) : -Infinity;
  const v = (k) => !T || T.vivaVisto(k, o);
  const t = [o, s.quadro, dlg || '',
    Object.keys(s.flag).filter((k) => s.flag[k]).sort().map((k) => k + '=' + s.flag[k]).join(','),
    [...new Set(s.inventario)].filter((k) => !T || T.vivoOggetto(k, o)).sort().join(','),
    Object.keys(s.visti).filter((k) => s.visti[k] && R.visti.has(k) && v(k)).sort().join(','),
    Object.keys(s.nascosti).filter((k) => s.nascosti[k] && (!T || T.vivoNascosto(k, o))).sort().join(','),
    Object.keys(s.temiFatti).filter((k) => s.temiFatti[k] && R.temi.has(k) && (!T || T.vivoTema(k, o))).sort().join(',')].join('|');
  return crypto.createHash('sha1').update(t).digest('base64').slice(0, 16);
}

// ---------------------------------------------------------------- la ricerca
function esplora(AV, R, T) {
  const nodi = []; // { padre, mossa, quadro, dlg, flag (solo all'arrivo a un finale), figli: [] }
  const indice = new Map();
  const finaliPresi = new Map(); // finale → { nodo, mossa, profondita }
  const finaliNulli = []; // ['finale'] senza nessun finale valido
  const combinazioni = new Map(); // "a,b,c,d,e,f" → Set(finali)
  const visto = { quadri: new Set(), punti: new Set(), temi: new Set(), oggetti: new Set() };
  const profondita = [];
  const code = new Map(); // tappa → { lista, testa }
  const perTappa = new Map(); // tappa → stati
  let tetto = false;

  function aggiungi(stato, dlg, padre, mossa) {
    const k = chiaveStato(stato, dlg, R, T);
    let i = indice.get(k);
    if (i !== undefined) { if (padre >= 0) nodi[padre].figli.push(i); return; }
    const oT = T ? T.tappaDi(stato) : 0;
    if ((perTappa.get(oT) || 0) >= MAX) { tetto = true; return; }
    perTappa.set(oT, (perTappa.get(oT) || 0) + 1);
    i = nodi.length;
    const meta = Boolean(ZONA) && !dlg && stato.quadro === ZONA.da && ZONA.meta.length > 0 && ZONA.meta.every((k) => stato.visti[k]);
    nodi.push({ padre, mossa, quadro: stato.quadro, dlg, figli: [], fine: meta });
    profondita.push(padre >= 0 ? profondita[padre] + 1 : 0);
    indice.set(k, i);
    if (padre >= 0) nodi[padre].figli.push(i);
    const o = T ? T.tappaDi(stato) : 0;
    if (!code.has(o)) code.set(o, { lista: [], testa: 0 });
    code.get(o).lista.push({ i, stato, dlg });
  }
  function prossimoInCoda() {
    for (const o of [...code.keys()].sort((a, b) => a - b)) { const c = code.get(o); if (c.testa < c.lista.length) { const x = c.lista[c.testa]; c.lista[c.testa++] = null; return x; } }
    return null;
  }

  function arrivo(esito, padre, mossa) {
    if (esito.finale === undefined && CHIUSI.has(esito.stato.quadro)) return; // zona lasciata fuori da questa prova
    if (esito.finale !== undefined) {
      const id = esito.finale;
      const combo = DECISIONI.map((d) => esito.stato.flag[d] || '-').join(',');
      if (!id) { finaliNulli.push({ padre, mossa, combo }); return; }
      if (!combinazioni.has(combo)) combinazioni.set(combo, new Set());
      combinazioni.get(combo).add(id);
      nodi[padre].fine = true;
      const mossaIntera = mossa + (esito.scelte && esito.scelte.length ? ' → «' + esito.scelte.join('» → «') + '»' : '');
      if (!finaliPresi.has(id)) finaliPresi.set(id, { padre, mossa: mossaIntera, passi: profondita[padre] + 1 });
      return;
    }
    let dlg = esito.dialogo;
    const s = esito.stato;
    if (dlg) {
      // l'interfaccia apre il dialogo: apertura (inizio la prima volta, poi saluto), poi i temi
      visto.temi.add(dlg + '/');
      const aperture = tuttiIRami(AV, null, s, (c) => AV.aperturaDialogo(dlg, c));
      // le scelte fatte PRIMA che il dialogo si apra restano scritte nella mossa (servono a chi rifà il cammino)
      const prima = esito.scelte.length ? ' → «' + esito.scelte.join('» → «') + '»' : '';
      for (const a of aperture) {
        if (a.finale !== undefined || a.stato.quadro !== s.quadro) { arrivo({ ...a, dialogo: a.dialogo }, padre, mossa + prima); continue; }
        const aperto = AV.temiDelDialogo(dlg, a.stato).length ? dlg : null;
        aggiungi(a.stato, aperto, padre, mossa + prima + (a.scelte.length ? ' → «' + a.scelte.join('» → «') + '»' : ''));
      }
      return;
    }
    aggiungi(s, null, padre, mossa + (esito.scelte.length ? ' → «' + esito.scelte.join('» → «') + '»' : ''));
  }

  const s0 = AV.nuovoStato();
  if (ZONA) Object.assign(s0.flag, ZONA.flag);
  for (const e of tuttiIRami(AV, [['vai', ZONA ? ZONA.da : AV.quadroIniziale()]], s0)) arrivo(e, -1, 'inizio');
  // il nodo -1 non esiste: i primi stati hanno padre -1
  for (let x = prossimoInCoda(); x; x = prossimoInCoda()) {
    const { i, stato, dlg } = x;
    visto.quadri.add(stato.quadro);
    const mosse = [];
    if (dlg) {
      for (const t of AV.temiDelDialogo(dlg, stato)) {
        visto.temi.add(dlg + '/' + t.id);
        mosse.push({ m: `[${dlg}] tema «${t.testo}»`, f: (c) => AV.azioniDelTema(dlg, t.id, c), dlg });
      }
      // allontanarsi
      aggiungi(AV.copia(stato), null, i, `[${dlg}] allontanati`);
    } else {
      const punti = AV.puntiDelQuadro(stato.quadro, stato);
      for (const p of punti) {
        visto.punti.add(stato.quadro + '/' + p.id);
        for (const v of ['guarda', 'usa']) mosse.push({ m: `${stato.quadro}: ${v} «${p.nome}»`, a: AV.azioniDelPunto(stato.quadro, p.id, v, '', stato) });
        for (const o of new Set(stato.inventario)) mosse.push({ m: `${stato.quadro}: ${o} su «${p.nome}»`, a: AV.azioniDelPunto(stato.quadro, p.id, 'usa', o, stato) });
      }
      const inv = [...new Set(stato.inventario)];
      for (const o of inv) visto.oggetti.add(o);
      for (const o of inv) mosse.push({ m: `guarda l'oggetto ${o}`, a: AV.azioniDellOggetto(o) });
      for (let x = 0; x < inv.length; x++) for (let y = x + 1; y < inv.length; y++) mosse.push({ m: `combina ${inv[x]} + ${inv[y]}`, a: AV.azioniCombina(inv[x], inv[y]) });
    }
    for (const mv of mosse) {
      if (mv.a && !R.effetti(mv.a)) continue; // solo righe e didascalie: lo stato non cambia
      const esiti = mv.f ? tuttiIRami(AV, null, stato, mv.f) : tuttiIRami(AV, mv.a, stato);
      for (const e of esiti) {
        if (mv.dlg && e.finale === undefined) {
          // dopo un tema: si resta nel dialogo se ci sono altri temi e si è nello stesso quadro
          if (e.dialogo) { arrivo(e, i, mv.m); continue; }
          const resta = e.stato.quadro === stato.quadro && AV.temiDelDialogo(mv.dlg, e.stato).length ? mv.dlg : null;
          aggiungi(e.stato, resta, i, mv.m + (e.scelte.length ? ' → «' + e.scelte.join('» → «') + '»' : ''));
          continue;
        }
        arrivo(e, i, mv.m);
      }
    }
  }
  return { nodi, finaliPresi, finaliNulli, combinazioni, visto, profondita, tetto, perTappa };
}

// ---------------------------------------------------------------- resoconto
function cammino(nodi, i) {
  const passi = [];
  while (i >= 0) { passi.push(nodi[i].mossa); i = nodi[i].padre; }
  return passi.reverse();
}

function main() {
  const AV = carica();
  const erroriCarico = AV.errori.slice();
  const R = analizza(AV);
  const t0 = Date.now();
  const completo = process.argv.includes('--completo');
  const E = esplora(AV, R, completo || ZONA ? null : tappe(AV, R));
  const { nodi, finaliPresi, finaliNulli, combinazioni, visto } = E;
  const out = []; let problemi = 0;
  const p = (s) => out.push(s);

  p(`Esplorazione: ${nodi.length} stati in ${((Date.now() - t0) / 1000).toFixed(1)} s` + (completo ? ' [spazio completo, senza tappe]' : ' [per tappe: le cose chiuse dei capitoli passati non distinguono gli stati]') + (E.tetto ? ` — TETTO di ${MAX} stati per tappa RAGGIUNTO: risultato parziale` : ' (spazio completo)') + '\n  stati per tappa (ordine del capitolo): ' + [...E.perTappa].sort((a, b) => a[0] - b[0]).map(([o, n]) => o + ': ' + n).join(' · '));
  if (E.tetto) problemi++;
  if (erroriCarico.length) { problemi++; p(`Errori del motore al caricamento (${erroriCarico.length}):`); for (const e of [...new Set(erroriCarico)]) p('  ' + e); }

  // vicoli ciechi: nodi da cui nessun nodo «fine» è raggiungibile
  const vivo = new Uint8Array(nodi.length);
  const inversi = nodi.map(() => []);
  nodi.forEach((n, i) => { for (const f of n.figli) inversi[f].push(i); });
  const pila = [];
  nodi.forEach((n, i) => { if (n.fine) { vivo[i] = 1; pila.push(i); } });
  while (pila.length) { const i = pila.pop(); for (const g of inversi[i]) if (!vivo[g]) { vivo[g] = 1; pila.push(g); } }
  const morti = []; nodi.forEach((n, i) => { if (!vivo[i]) morti.push(i); });
  if (!E.tetto) {
    if (morti.length) {
      problemi++;
      // i «primi» vicoli: nodi morti con il padre vivo (dove si sbaglia strada), raggruppati per quadro
      let primi = morti.filter((i) => nodi[i].padre >= 0 && vivo[nodi[i].padre]);
      if (!primi.length) primi = morti; // nessun finale raggiungibile da nessuna parte: un esempio per quadro
      const perQuadro = new Map();
      for (const i of primi) { const q = nodi[i].quadro; if (!perQuadro.has(q)) perQuadro.set(q, i); }
      p(`\nVICOLI CIECHI: ${morti.length} stati da cui nessun finale è raggiungibile (${primi.length} punti d'ingresso). Un esempio per quadro:`);
      for (const [q, i] of [...perQuadro].slice(-6)) { p(`  · in ${q}${nodi[i].dlg ? ' (dialogo ' + nodi[i].dlg + ')' : ''}, ${E.profondita[i]} mosse:`); for (const m of cammino(nodi, i)) p('      ' + m); }
    } else p('\nVicoli ciechi: nessuno.');
  } else p(`\nVicoli ciechi: non giudicabili con il tetto raggiunto (${morti.length} stati senza finale fra quelli visti).`);

  if (ZONA) {
    // prova di una zona: contano solo il tetto e i vicoli ciechi rispetto alla meta
    const arrivi = nodi.filter((n) => n.fine).length;
    p(`\nZona da «${ZONA.da}» ${JSON.stringify(ZONA.flag)} · meta ${ZONA.meta.join(' + ')}: ${arrivi ? `raggiunta (${arrivi} stati d'arrivo)` : 'MAI RAGGIUNTA'}`);
    if (!arrivi) problemi++;
    p(problemi ? `\n${problemi} gruppi di problemi` : '\nnessun problema');
    console.log(out.join('\n'));
    process.exit(problemi ? 1 : 0);
  }

  // i finali
  const tutti = [...AV.dati.finale.keys()];
  const mancanti = tutti.filter((f) => !finaliPresi.has(f));
  p(`\nFinali raggiunti: ${finaliPresi.size}/${tutti.length}`);
  for (const f of tutti) p(`  ${finaliPresi.has(f) ? '✓' : '✗'} ${f}${finaliPresi.has(f) ? ` (in ${finaliPresi.get(f).passi} mosse)` : ''}`);
  if (mancanti.length) problemi++;
  if (finaliNulli.length) {
    problemi++;
    const combo = [...new Set(finaliNulli.map((x) => x.combo))];
    p(`\n['finale'] SENZA FINALE VALIDO: ${finaliNulli.length} volte, combinazioni (${DECISIONI.join(',')}): ${combo.join(' · ')}`);
    const x = finaliNulli[0]; for (const m of cammino(nodi, x.padre).concat(x.mossa)) p('      ' + m);
  }

  // le 64 combinazioni
  const VAL = DECISIONI.map((d) => AV.dati.flag.get(d).valori);
  const combos = [[]];
  for (const vs of VAL) { const n = []; for (const c of combos) for (const v of vs) n.push(c.concat(v)); combos.splice(0, combos.length, ...n); }
  const impossibili = []; const senza = []; const con = [];
  for (const c of combos) {
    const [, taddeo, registro, , gregorio] = c;
    const prove = taddeo === 'perdonato' || registro === 'conservato';
    const k = c.join(',');
    if (gregorio === 'dialogo' && !prove) { impossibili.push(k); if (combinazioni.has(k)) p(`  ATTENZIONE: la combinazione impossibile ${k} arriva a un finale`); continue; }
    if (combinazioni.has(k)) con.push(`${k} → ${[...combinazioni.get(k)].join(' / ')}`); else senza.push(k);
  }
  p(`\nCombinazioni delle sei decisioni (${DECISIONI.join(', ')}): ${con.length} arrivano a un finale, ${senza.length} no, ${impossibili.length} impossibili per costruzione`);
  if (process.argv.includes('--combinazioni')) for (const c of con) p('  ✓ ' + c); else if (con.length) p('  (--combinazioni le elenca una per una, col finale)');
  for (const c of senza) p('  ✗ ' + c);
  p(`  impossibili per costruzione (gregorio = dialogo vuole prove = vera, che manca con taddeo = accusato e registro = bruciato):`);
  for (const c of impossibili) p('    ' + c);
  if (senza.length && !E.tetto) problemi++;

  // mai raggiunti
  const maiQ = [...AV.dati.quadro.keys()].filter((q) => !visto.quadri.has(q));
  const maiP = []; for (const Q of AV.dati.quadro.values()) for (const pt of Q.punti || []) if (visto.quadri.has(Q.id) && !visto.punti.has(Q.id + '/' + pt.id)) maiP.push(Q.id + '/' + pt.id);
  const maiT = []; for (const D of AV.dati.dialogo.values()) { if (!visto.temi.has(D.id + '/')) { maiT.push(D.id + ' (mai aperto)'); continue; } for (const t of D.temi || []) if (!visto.temi.has(D.id + '/' + t.id)) maiT.push(D.id + '/' + t.id); }
  const maiO = [...AV.dati.oggetto.keys()].filter((o) => !visto.oggetti.has(o));
  p(`\nMai raggiunti: quadri ${maiQ.length}, punti ${maiP.length} (nei quadri raggiunti), temi ${maiT.length}, oggetti ${maiO.length}`);
  if (maiQ.length) p('  quadri: ' + maiQ.join(', '));
  if (maiP.length) p('  punti: ' + maiP.join(', '));
  if (maiT.length) p('  temi: ' + maiT.join(', '));
  if (maiO.length) p('  oggetti: ' + maiO.join(', '));
  if (CHIUSI.size) p(`  (con --chiudi ${[...CHIUSI].join(',')}: ciò che sta solo oltre quei quadri non conta come problema)`);
  else if (maiQ.length || maiT.length || maiO.length) problemi++;

  // cammino più corto
  let corto = null; for (const [f, x] of finaliPresi) if (!corto || x.passi < corto.passi) corto = { f, ...x };
  if (corto) {
    p(`\nCammino più corto: ${corto.passi} mosse fino a «${corto.f}»`);
    if (process.argv.includes('--cammini')) for (const [f, x] of finaliPresi) { p(`  — ${f} (${x.passi} mosse):`); for (const m of cammino(nodi, x.padre).concat(x.mossa)) p('      ' + m); }
    else for (const m of cammino(nodi, corto.padre).concat(corto.mossa)) p('      ' + m);
  }
  // stima delle mosse per vedere tutto: mosse distinte (punto × verbo, temi, oggetti) dei luoghi raggiunti
  const stima = visto.punti.size * 2 + [...visto.temi].filter((t) => !t.endsWith('/')).length + visto.oggetti.size * 2;
  p(`Stima delle mosse per vedere tutto (ogni punto guardato e usato, ogni tema, ogni oggetto guardato e usato): ~${stima}, `
    + `più il cammino (${corto ? corto.passi : '?'}) ripetuto per le scelte (${AV.dati.finale.size} finali).`);

  const nuovi = [...new Set(AV.errori.slice(erroriCarico.length))];
  if (nuovi.length) { problemi++; p(`\nErrori del motore durante l'esplorazione (${nuovi.length}):`); for (const e of nuovi.slice(0, 30)) p('  ' + e); }

  p(problemi ? `\n${problemi} gruppi di problemi` : '\nnessun problema');
  console.log(out.join('\n'));
  const j = arg('--json');
  if (j) fs.writeFileSync(j, JSON.stringify({ stati: nodi.length, tetto: E.tetto, vicoli: morti.length, finali: [...finaliPresi.keys()], mancanti, combinazioni: con, senza, impossibili, maiQ, maiP, maiT, maiO, corto: corto && corto.passi,
    cammini: process.argv.includes('--cammini') ? Object.fromEntries([...finaliPresi].map(([f, x]) => [f, cammino(nodi, x.padre).concat(x.mossa)])) : undefined }, null, 1));
  process.exit(problemi ? 1 : 0);
}

if (require.main === module) main();
module.exports = { carica, analizza, esplora, tuttiIRami, tappe };
