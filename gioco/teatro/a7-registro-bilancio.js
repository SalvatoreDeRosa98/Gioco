/*
 * teatro/a7-registro-bilancio.js — Miglioramento 7: REGISTRO DI FINE RUN e Registro delle notti.
 *
 *   - Durante la run si contano: tempo di gioco (tick di logica fuori pausa), stanze ripulite, nemici caduti,
 *     oggetti presi (nome; «?» se raccolti sotto la Benda del Cieco; ✦ = scoperto ora), monete/bombe/chiavi
 *     prese e spese (differenze dell'inventario a ogni tick, per piano), consumabili usati, danni subiti per
 *     fonte (l'ultima fonte è la causa della morte), sangue dato alle stanze speciali (ceppo, rovi), lucchetti.
 *   - Alla morte (gancio T4 'morte') la run si chiude e si salva; la pergamena del riepilogo compare appena
 *     la sequenza di morte riporta in Piazza Dante (così la sequenza, il watchdog e il ritorno all'hub restano
 *     quelli di t4-hub-storia.js). Alla vittoria su Donna Luciana la pergamena si apre in scena (la run
 *     continua dopo averla chiusa). Un tasto qualunque o un click la chiude.
 *   - Registro per slot di salvataggio (ultime CONFIG_A7.maxRun run) in localStorage, chiave dedicata
 *     CONFIG_A7.prefisso + slot (non gonfia lo slot T3). Abbandoni (Ricomincia notte, menu, pagina chiusa)
 *     restano registrati con l'esito corrispondente.
 *   - Menu ESC: «Registro delle notti» [L] con le ultime run e le statistiche; [X] esporta il JSON.
 *   - window.__teatro.interni.registroRun() e esportaRegistro() (JSON da copiare), runInCorsoA7().
 *
 * Nessun gancio nei file di base: si avvolgono le function di primo livello nuovaRun, passoLogico,
 * subisciColpoGiocatore, pagaSangueA3, dopoRaccoltaD, usaConsumabileA2, entraInStanza, avviaPiano,
 * disegnaMenuPausa, gestisciClickMenuPausa e t4Gancio ('morte', 'ricomincia', 'bossSconfitto', 'sopra').
 * Script classico caricato dopo teatro/a6-progressione.js. Regole: teatro/LEGGIMI.md.
 * Ispirazione: il riepilogo di fine partita dei roguelike a stanze (nomi e testi nostri).
 */

// ===========================================================================
// CONFIGURAZIONE (numeri e testi del miglioramento 7)
// ===========================================================================
const CONFIG_A7 = Object.freeze({
  prefisso: 'ferruccio.teatro.registro.',   // localStorage: + numero dello slot T3
  versione: 1,
  maxRun: 50,                               // run conservate per slot (le più vecchie escono)
  maxDanniPerRun: 60,                       // voci del diario dei colpi tenute per run
  righeRegistro: 9,                         // run mostrate nella pagina del Registro delle notti
  causeMostrate: 6,
  tastoRegistro: 'KeyL',                    // dal menu ESC
  tastoEsporta: 'KeyX',                     // nel Registro: esporta il JSON
  raggioFonteProiettilePx: 14,              // un colpo si attribuisce al proiettile più vicino del tick prima
  bossFinale: 'donna-luciana',
  pergamena: Object.freeze({ x: 50, y: 22, w: 540, h: 316 }),
  bottonePausa: Object.freeze({ w: 236, h: 15, y: 332 }), // sotto il menu ESC dell'autore (60-resa.js)
});

/** Testi per il giocatore. DA APPROVARE DALL'AUTORE. */
const TESTI_A7 = Object.freeze({
  titoloMorte: (n) => `REGISTRO DELLA NOTTE ${n}`,
  titoloVittoria: (n) => `NOTTE ${n}: I FILI SONO SPEZZATI`,
  causa: (f) => `Caduto contro ${f}`,
  vittoria: 'Donna Luciana è sconfitta. Il Teatro continua: chiudi la pergamena e prosegui.',
  chiudi: 'Un tasto o un click per chiudere · Registro delle notti: Esc, poi L',
  registro: 'REGISTRO DELLE NOTTI',
  vuoto: 'Nessuna notte registrata in questo slot.',
  piedeRegistro: 'X: esporta il registro (JSON) · Esc / L: torna al menu',
  esportato: 'Registro copiato negli appunti (o scaricato come file).',
  bottone: '📜 REGISTRO DELLE NOTTI [L]',
  esiti: Object.freeze({ morte: 'morte', vittoria: 'vittoria', abbandono: 'abbandonata', interrotta: 'interrotta', 'in corso': 'in corso' }),
  stanze: Object.freeze({
    ingresso: 'ingresso', normale: 'di combattimento', boss: 'del boss', tesoro: 'del tesoro', fucina: 'la Fucina',
    segreta: 'segreta', patto: 'del Patto', sviluppatore: 'dello Sviluppatore', sfida: 'della Sfida',
    sacrificio: 'del Sacrificio', maledetta: 'dei Rovi', bisca: 'la Bisca',
  }),
});

// ===========================================================================
// STATO
// ===========================================================================
const a7 = {
  run: null,              // run in corso (oggetto serializzabile)
  inv: null,              // ultimo inventario visto { monete, bombe, chiavi }
  stanza: null,           // stanza corrente vista dall'ultimo tick
  proiettili: [],         // istantanea { x, y, fonte } dei proiettili nemici al tick prima
  inSangue: false, sangueRegistrato: false,
  pergamena: null,        // { voce, tipo: 'morte'|'vittoria' } da mostrare
  inAttesaHub: null,      // pergamena che aspetta il ritorno in Piazza Dante
  registroAperto: false,
  avviso: null,           // { testo, finoMs }
};

function slotA7() {
  const sv = window.__teatroT3 && window.__teatroT3.salvataggi;
  return sv ? sv.slotAttivo : 0;
}

/** Elenco delle run registrate nello slot attivo (dalla più vecchia alla più recente). */
function leggiRegistroA7(slot = slotA7()) {
  try {
    const d = JSON.parse(localStorage.getItem(CONFIG_A7.prefisso + slot) || 'null');
    return d && Array.isArray(d.run) ? d.run : [];
  } catch (_) { return []; }
}

function scriviRegistroA7(lista, slot = slotA7()) {
  try {
    localStorage.setItem(CONFIG_A7.prefisso + slot, JSON.stringify({ versione: CONFIG_A7.versione, slot, run: lista.slice(-CONFIG_A7.maxRun) }));
  } catch (err) { console.warn('[A7] registro non salvato', err); }
}

/** Inserisce o aggiorna (stesso id) la voce della run nel registro dello slot. */
function salvaVoceA7(voce) {
  const lista = leggiRegistroA7(voce.slot);
  const i = lista.findIndex((v) => v.id === voce.id);
  if (i >= 0) lista[i] = voce; else lista.push(voce);
  scriviRegistroA7(lista, voce.slot);
}

const pulisciNomeA7 = (s) => String(s || '').replace(/\s*\(.*?\)/g, '').trim(); // via i riferimenti fra parentesi

// ===========================================================================
// RUN IN CORSO
// ===========================================================================
function nuovaVoceA7() {
  const ch = getCharCorrente();
  return {
    id: `${Date.now().toString(36)}-${statoRun.numeroRun}`,
    slot: slotA7(), data: new Date().toISOString(),
    personaggio: statoRun.personaggioId, nomePersonaggio: ch.nome,
    notte: statoRun.numeroNotte || getNumeroNotte(),
    esito: 'in corso', vittoria: false, causa: null,
    piano: statoRun.piano || 1, stanza: null, stanzeVisitatePiano: 0,
    tick: 0, tempoMs: 0,
    stanzePulite: 0, nemiciUccisi: 0, boss: [],
    oggetti: [], consumabili: [],
    monete: { prese: 0, spese: 0 }, bombe: { prese: 0, spese: 0 }, chiavi: { prese: 0, spese: 0 },
    perPiano: {},              // piano → { monete, moneteSpese, bombe, chiavi, chiaviSpese, lucchetti, lucchettiAperti, dannoHalf, stanze, tempoMs }
    danni: [],                 // { fonte, half, piano, stanza }
    sangueHalf: 0,             // dato al ceppo e ai rovi (costo delle stanze speciali)
    stanzeSpeciali: {},        // tipo → visite
    hpFine: null, maxHpFine: null, moneteFine: 0,
  };
}

function pianoA7(r, p = statoRun.piano || 1) {
  return r.perPiano[p] || (r.perPiano[p] = { monete: 0, moneteSpese: 0, bombe: 0, chiavi: 0, chiaviSpese: 0, lucchetti: 0, lucchettiAperti: 0, dannoHalf: 0, stanze: 0, tempoMs: 0 });
}

function inventarioA7() {
  return { monete: statoRun.monete || 0, bombe: statoRun.bombe || 0, chiavi: statoRun.chiavi || 0 };
}

function iniziaRunA7() {
  if (a7.run && a7.run.esito === 'in corso') chiudiRunA7('abbandono', null);
  a7.run = nuovaVoceA7();
  a7.inv = inventarioA7();
  a7.stanza = null;
  a7.proiettili = [];
  contaLucchettiA7();
}

/** Differenze dell'inventario: crescite = prese, cali = spese (Fucina, lucchetti, bombe, lotto...). */
function osservaInventarioA7() {
  const r = a7.run;
  if (!r || !a7.inv) return;
  const ora = inventarioA7();
  const pp = pianoA7(r);
  for (const k of ['monete', 'bombe', 'chiavi']) {
    const d = ora[k] - a7.inv[k];
    if (d > 0) { r[k].prese += d; pp[k === 'monete' ? 'monete' : k] += d; }
    if (d < 0) { r[k].spese -= d; if (k === 'monete') pp.moneteSpese -= d; if (k === 'chiavi') pp.chiaviSpese -= d; }
  }
  a7.inv = ora;
}

/** Un tick in run: tempo, stanza, uccisioni, pulizie, inventario, istantanea dei proiettili. */
function osservaTickA7() {
  const r = a7.run;
  if (!r || r.esito !== 'in corso' || statoRun.fase !== 'in_gioco') return;
  if (!statoRun.pausa) { r.tick++; pianoA7(r).tempoMs += MS_PER_TICK; }
  r.tempoMs = Math.round(r.tick * MS_PER_TICK);
  if (statoRun.piano > r.piano) { r.piano = statoRun.piano; r.stanzeVisitatePiano = 0; }
  const st = statoRun.stanzaCorrente;
  if (st && st !== a7.stanza) {
    a7.stanza = st;
    if (!st.__vistaA7) {
      st.__vistaA7 = true;
      r.stanzeVisitatePiano++;
      pianoA7(r).stanze++;
      if (['sfida', 'sacrificio', 'maledetta', 'bisca'].includes(st.tipo)) r.stanzeSpeciali[st.tipo] = (r.stanzeSpeciali[st.tipo] || 0) + 1;
    }
    if (!st.pulita) st.__daPulireA7 = true;
  }
  if (st) {
    r.stanza = { tipo: st.tipo, id: st.id, boss: st.tipo === 'boss' ? pulisciNomeA7((st.nemici.find((n) => n.boss) || {}).nome) : null };
    for (const n of st.nemici) {
      if (n.hp <= 0 && !n.__mortoA7) { n.__mortoA7 = true; r.nemiciUccisi++; }
    }
    if (!st.pulita && st.nemici.some((n) => n.hp > 0)) st.__daPulireA7 = true;
    if (st.__daPulireA7 && st.pulita) { st.__daPulireA7 = false; r.stanzePulite++; }
  }
  osservaInventarioA7();
  a7.proiettili = (statoRun.proiettiliNemici || []).map((p) => ({ x: p.x, y: p.y, fonte: p.fonteA7 || fonteProiettileA7(p, st) }));
}

/** Chi ha sparato: il nemico vivo più vicino alla nascita del proiettile (il nome resta sul proiettile). */
function fonteProiettileA7(p, st) {
  if (p.fonteA7) return p.fonteA7;
  let best = null, dBest = Infinity;
  for (const n of (st && st.nemici) || []) {
    if (n.hp <= 0 && !n.boss) continue;
    const d = Math.hypot(n.x - p.x, n.y - 6 - p.y);
    if (d < dBest) { dBest = d; best = n; }
  }
  p.fonteA7 = best ? `un colpo di ${pulisciNomeA7(best.nome)}` : 'un proiettile del Velo';
  return p.fonteA7;
}

function registraDannoA7(fonte, half, sangue) {
  const r = a7.run;
  if (!r || half <= 0) return;
  const st = statoRun.stanzaCorrente;
  const f = pulisciNomeA7(fonte) || 'le ombre';
  r.causa = f;
  pianoA7(r).dannoHalf += half;
  if (sangue) r.sangueHalf += half;
  r.danni.push({ fonte: f, half, piano: statoRun.piano, stanza: st ? st.tipo : null });
  if (r.danni.length > CONFIG_A7.maxDanniPerRun) r.danni.shift();
}

/** Fonte del colpo: per i proiettili generici, il tiratore del proiettile più vicino al punto d'origine. */
function risolviFonteA7(fonte, daX, daY) {
  if (fonte !== 'un proiettile del Velo' || !Number.isFinite(daX)) return fonte;
  let best = null, dBest = CONFIG_A7.raggioFonteProiettilePx;
  for (const p of a7.proiettili) {
    const d = Math.hypot(p.x - daX, p.y - daY);
    if (d < dBest) { dBest = d; best = p; }
  }
  if (best) return best.fonte;
  const st = statoRun.stanzaCorrente;
  const boss = st && st.tipo === 'boss' && st.nemici.find((n) => n.boss);
  return boss ? `un colpo di ${pulisciNomeA7(boss.nome)}` : fonte;
}

function contaLucchettiA7() {
  const r = a7.run;
  const m = statoRun.mappa;
  if (!r || !m || m.__lucchettiA7) return;
  m.__lucchettiA7 = true;
  pianoA7(r, m.piano || statoRun.piano).lucchetti += m.stanze.filter((s) => s.chiusaA1).length;
}

/** Fotografia finale della run e salvataggio nel registro. */
function chiudiRunA7(esito, causa) {
  const r = a7.run;
  if (!r) return null;
  osservaInventarioA7();
  if (r.esito === 'in corso' || r.esito === 'vittoria') r.esito = r.vittoria && esito !== 'vittoria' ? `vittoria, poi ${TESTI_A7.esiti[esito] || esito}` : esito;
  if (causa) r.causa = pulisciNomeA7(causa);
  r.piano = Math.max(r.piano, statoRun.piano || 1);
  r.hpFine = statoRun.hpHalf; r.maxHpFine = statoRun.maxHpHalf; r.moneteFine = statoRun.monete || 0;
  r.fine = new Date().toISOString();
  salvaVoceA7(r);
  if (esito !== 'vittoria') a7.run = null; // la vittoria non chiude la run: si continua
  return r;
}

// ===========================================================================
// AVVOLGIMENTI
// ===========================================================================
const nuovaRunBaseA7 = nuovaRun;
nuovaRun = function (...args) {
  const r = nuovaRunBaseA7.apply(this, args);
  try { iniziaRunA7(); } catch (err) { console.error('[A7] nuova run', err); }
  return r;
};

const avviaPianoBaseA7 = avviaPiano;
avviaPiano = function (...args) {
  try { osservaInventarioA7(); } catch (_) { /* osservazione facoltativa */ }
  const r = avviaPianoBaseA7.apply(this, args);
  try { if (a7.run) { a7.inv = inventarioA7(); contaLucchettiA7(); } } catch (err) { console.error('[A7] piano', err); }
  return r;
};

const entraInStanzaBaseA7 = entraInStanza;
entraInStanza = function (stanza, ...resto) {
  const chiusa = Boolean(stanza && stanza.chiusaA1);
  try { osservaInventarioA7(); } catch (_) { /* idem */ }
  const r = entraInStanzaBaseA7.call(this, stanza, ...resto);
  try { if (a7.run && chiusa && !stanza.chiusaA1) pianoA7(a7.run).lucchettiAperti++; } catch (_) { /* idem */ }
  return r;
};

const passoLogicoBaseA7 = passoLogico;
passoLogico = function (...args) {
  const r = passoLogicoBaseA7.apply(this, args);
  try { osservaTickA7(); } catch (err) { console.error('[A7] tick', err); }
  return r;
};

const subisciBaseA7 = subisciColpoGiocatore;
subisciColpoGiocatore = function (half, fonte, daX, daY, ...resto) {
  const prima = statoRun.hpHalf;
  const vera = risolviFonteA7(fonte, daX, daY);
  if (a7.run && statoRun.fase === 'in_gioco') a7.run.causa = pulisciNomeA7(vera); // vale anche per il colpo letale
  const r = subisciBaseA7.call(this, half, fonte, daX, daY, ...resto);
  const tolto = prima - statoRun.hpHalf;
  if (tolto > 0 || (prima > 0 && statoRun.fase === 'morte')) {
    registraDannoA7(vera, Math.max(tolto, prima), a7.inSangue);
    if (a7.inSangue) a7.sangueRegistrato = true;
  }
  return r;
};

if (typeof pagaSangueA3 === 'function') {
  const pagaSangueBaseA7 = pagaSangueA3;
  pagaSangueA3 = function (costoHalf, letale, fonte, ...resto) {
    const prima = statoRun.hpHalf;
    a7.inSangue = true; a7.sangueRegistrato = false;
    try {
      const r = pagaSangueBaseA7.call(this, costoHalf, letale, fonte, ...resto);
      if (!a7.sangueRegistrato && prima > statoRun.hpHalf) registraDannoA7(fonte, prima - statoRun.hpHalf, true);
      return r;
    } finally { a7.inSangue = false; }
  };
}

const dopoRaccoltaBaseA7 = dopoRaccoltaD;
dopoRaccoltaD = function (item, ...resto) {
  try {
    const base = trovaOggettoB(item && item.id);
    if (a7.run && base) {
      a7.run.oggetti.push({
        id: base.id, nome: maledizioneD('cieco') ? '?' : base.nome, tier: base.tier || null,
        polarita: base.polarita || null, scoperto: !conosciutoD(base.id), piano: statoRun.piano,
      });
    }
  } catch (err) { console.error('[A7] oggetto', err); }
  return dopoRaccoltaBaseA7.call(this, item, ...resto);
};

if (typeof usaConsumabileA2 === 'function') {
  const usaConsBaseA7 = usaConsumabileA2;
  usaConsumabileA2 = function (...args) {
    const S = statoRun.consumabiliA2;
    if (a7.pergamena && statoRun.fase === 'in_gioco') return false; // la pergamena prende i tasti
    const c = S && S.run === statoRun.numeroRun ? S.slot : null;
    const r = usaConsBaseA7.apply(this, args);
    try {
      if (r && c && a7.run) {
        const e = effettoA2(c);
        a7.run.consumabili.push({ fam: c.fam, nome: nomeA2(c), effetto: e ? e.nome : '?', id: c.fam === 'ampolla' ? `ampolla:${e && e.id}` : `carta:${c.id}`, piano: statoRun.piano });
      }
    } catch (err) { console.error('[A7] consumabile', err); }
    return r;
  };
}

const t4GancioBaseA7 = t4Gancio;
t4Gancio = function (nome, ...args) {
  if (nome === 'morte' && statoRun.fase === 'in_gioco' && a7.run) {
    try {
      osservaTickA7();
      const v = chiudiRunA7('morte', a7.run.causa || args[0]);
      a7.inAttesaHub = { voce: v, tipo: 'morte' };
    } catch (err) { console.error('[A7] morte', err); }
  } else if (nome === 'ricomincia' && a7.run && statoRun.fase === 'in_gioco') {
    try { chiudiRunA7('abbandono', null); } catch (err) { console.error('[A7] abbandono', err); }
  } else if (nome === 'bossSconfitto' && a7.run) {
    try { bossSconfittoA7(args[0]); } catch (err) { console.error('[A7] boss', err); }
  }
  const r = t4GancioBaseA7(nome, ...args);
  if (nome === 'sopra') { try { sopraA7(); } catch (err) { console.error('[A7] disegno', err); } }
  return r;
};

function bossSconfittoA7(st) {
  const b = st && st.nemici && (st.nemici.find((n) => n.boss) || st.nemici[0]);
  if (!b) return;
  const r = a7.run;
  r.boss.push({ id: b.bossId || null, nome: pulisciNomeA7(b.nome), piano: statoRun.piano });
  if (b.bossId === CONFIG_A7.bossFinale && !r.vittoria) {
    r.vittoria = true;
    osservaInventarioA7();
    r.esito = 'vittoria';
    salvaVoceA7(r);
    a7.pergamena = { voce: JSON.parse(JSON.stringify(r)), tipo: 'vittoria' };
  }
}

/** Run lasciata senza morte: menu personaggi dal menu ESC, oppure pagina chiusa. */
function controllaAbbandonoA7() {
  if (a7.run && a7.run.esito !== 'morte' && statoRun.fase === 'menu_selezione') chiudiRunA7('abbandono', null);
  if (a7.inAttesaHub && statoRun.fase === 'hub') { a7.pergamena = a7.inAttesaHub; a7.inAttesaHub = null; }
  if (a7.inAttesaHub && statoRun.fase === 'menu_selezione') a7.inAttesaHub = null;
}
window.addEventListener('pagehide', () => { try { if (a7.run) chiudiRunA7('interrotta', null); } catch (_) { /* uscita */ } });

// ===========================================================================
// STATISTICHE
// ===========================================================================
function statisticheA7(lista = leggiRegistroA7()) {
  const chiuse = lista.filter((v) => v.esito !== 'in corso');
  const morti = chiuse.filter((v) => /morte/.test(v.esito));
  const cause = {};
  for (const v of morti) { const c = v.causa || 'ignota'; cause[c] = (cause[c] || 0) + 1; }
  const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const p1 = chiuse.map((v) => v.perPiano && v.perPiano[1] && v.perPiano[2] ? v.perPiano[1].monete : null).filter((x) => x !== null);
  return {
    run: chiuse.length, morti: morti.length, vittorie: chiuse.filter((v) => v.vittoria).length,
    pianoMedio: media(chiuse.map((v) => v.piano || 1)), pianoMax: chiuse.reduce((m, v) => Math.max(m, v.piano || 1), 0),
    tempoMedioMs: media(chiuse.map((v) => v.tempoMs || 0)),
    moneteMediePiano1: p1.length ? media(p1) : null, // solo run che hanno finito il piano 1
    causeMorte: Object.entries(cause).sort((a, b) => b[1] - a[1]).map(([causa, n]) => ({ causa, n })),
  };
}

function esportaRegistroA7() {
  return JSON.stringify({ gioco: 'Ferruccio — Teatro delle Marionette', registro: 'a7', versione: CONFIG_A7.versione,
    slot: slotA7(), esportato: new Date().toISOString(), statistiche: statisticheA7(), run: leggiRegistroA7() }, null, 1);
}

function esportaVersoUtenteA7() {
  const testo = esportaRegistroA7();
  let fatto = false;
  try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(testo).catch(() => scaricaA7(testo)); fatto = true; } } catch (_) { fatto = false; }
  if (!fatto) scaricaA7(testo);
  a7.avviso = { testo: TESTI_A7.esportato, finoMs: performance.now() + 2500 };
}

function scaricaA7(testo) {
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([testo], { type: 'application/json' }));
    a.download = `registro-notti-slot${slotA7()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
  } catch (err) { console.warn('[A7] esportazione', err); }
}

// ===========================================================================
// DISEGNO
// ===========================================================================
const tempoA7 = (ms) => { const s = Math.round((ms || 0) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function aCapoA7(parole, maxW, size) {
  ctx.save();
  ctx.font = `bold ${size}px Georgia, serif`;
  const righe = [];
  let riga = '';
  for (const p of parole) {
    const prova = riga ? `${riga}, ${p}` : p;
    if (ctx.measureText(prova).width > maxW && riga) { righe.push(`${riga},`); riga = p; } else riga = prova;
  }
  if (riga) righe.push(riga);
  ctx.restore();
  return righe;
}

function fondoPergamenaA7(x, y, w, h) {
  ctx.fillStyle = 'rgba(4, 2, 1, 0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e6d2aa';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(120, 80, 40, 0.18)';
  ctx.fillRect(x, y, w, 8); ctx.fillRect(x, y + h - 8, w, 8);
  ctx.strokeStyle = '#5c4024';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  ctx.strokeStyle = 'rgba(92, 64, 36, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
}

function disegnaPergamenaA7() {
  const { voce: v, tipo } = a7.pergamena;
  const P = CONFIG_A7.pergamena;
  const ink = '#3b2210', rosso = '#7f1d1d';
  const T = (t, x, y, w, o = {}) => drawTextFit(t, x, y, w, { size: 8, color: ink, shadow: false, align: 'left', ...o });
  ctx.save();
  fondoPergamenaA7(P.x, P.y, P.w, P.h);
  const cx = P.x + P.w / 2;
  T(tipo === 'vittoria' ? TESTI_A7.titoloVittoria(v.notte) : TESTI_A7.titoloMorte(v.notte), cx, P.y + 26, P.w - 40, { size: 14, color: rosso, align: 'center' });
  T(tipo === 'vittoria' ? TESTI_A7.vittoria : TESTI_A7.causa(v.causa || 'le ombre'), cx, P.y + 44, P.w - 40, { size: 9, style: 'italic', align: 'center' });
  const xs = P.x + 26, xd = P.x + P.w / 2 + 10, lw = P.w / 2 - 36;
  const stanza = v.stanza ? `${TESTI_A7.stanze[v.stanza.tipo] || v.stanza.tipo}${v.stanza.boss ? ` (${v.stanza.boss})` : ''}` : '—';
  const sx = [
    ['Personaggio', v.nomePersonaggio],
    ['Notte', String(v.notte)],
    ['Piano raggiunto', `${v.piano} · stanza ${stanza}`],
    ['Stanze visitate nel piano', String(v.stanzeVisitatePiano)],
    ['Tempo', tempoA7(v.tempoMs)],
    ['Stanze ripulite', String(v.stanzePulite)],
    ['Nemici caduti', String(v.nemiciUccisi)],
    ['Boss battuti', v.boss.length ? v.boss.map((b) => b.nome).join(', ') : 'nessuno'],
    ['Sangue alle stanze speciali', `${v.sangueHalf / 2} ❤`],
  ];
  sx.forEach(([k, val], i) => {
    const y = P.y + 70 + i * 17;
    T(`${k}:`, xs, y, 120, { size: 7.5, color: '#6b4423' });
    T(val, xs + 124, y, lw - 124, { size: 8 });
  });
  const dx = [
    ['Monete', `prese ${v.monete.prese} · spese ${v.monete.spese} · in tasca ${v.moneteFine}`],
    ['Bombe', `prese ${v.bombe.prese} · usate ${v.bombe.spese}`],
    ['Chiavi', `prese ${v.chiavi.prese} · usate ${v.chiavi.spese}`],
  ];
  dx.forEach(([k, val], i) => {
    const y = P.y + 70 + i * 17;
    T(`${k}:`, xd, y, 60, { size: 7.5, color: '#6b4423' });
    T(val, xd + 60, y, lw - 60, { size: 8 });
  });
  let y = P.y + 70 + 3 * 17 + 4;
  T(`Consumabili usati (${v.consumabili.length}):`, xd, y, lw, { size: 7.5, color: '#6b4423' });
  const cons = v.consumabili.length ? aCapoA7(v.consumabili.map((c) => (c.fam === 'ampolla' ? `${c.nome} (${c.effetto})` : c.nome)), lw, 7.5) : ['nessuno'];
  for (const riga of cons.slice(0, 3)) { y += 12; T(riga, xd, y, lw, { size: 7.5 }); }
  y += 17;
  T(`Oggetti presi (${v.oggetti.length}):`, xd, y, lw, { size: 7.5, color: '#6b4423' });
  const ogg = v.oggetti.length ? aCapoA7(v.oggetti.map((o) => `${o.scoperto && o.nome !== '?' ? '✦' : ''}${o.nome}`), lw, 7.5) : ['nessuno'];
  const maxR = 6;
  ogg.slice(0, maxR).forEach((riga, i) => T(i === maxR - 1 && ogg.length > maxR ? `${riga} …` : riga, xd, y + 12 + i * 12, lw, { size: 7.5 }));
  T(TESTI_A7.chiudi, cx, P.y + P.h - 16, P.w - 40, { size: 7, color: '#6b4423', align: 'center', style: 'italic' });
  ctx.restore();
}

function disegnaRegistroA7() {
  const lista = leggiRegistroA7();
  const s = statisticheA7(lista);
  const P = CONFIG_A7.pergamena;
  const ink = '#3b2210';
  const T = (t, x, y, w, o = {}) => drawTextFit(t, x, y, w, { size: 7.5, color: ink, shadow: false, align: 'left', ...o });
  ctx.save();
  fondoPergamenaA7(P.x, P.y, P.w, P.h);
  T(`📜 ${TESTI_A7.registro} — slot ${slotA7()}`, P.x + P.w / 2, P.y + 24, P.w - 40, { size: 13, color: '#7f1d1d', align: 'center' });
  T(`Run ${s.run} · morti ${s.morti} · vittorie ${s.vittorie} · piano medio ${s.pianoMedio.toFixed(1)} · piano massimo ${s.pianoMax} · tempo medio ${tempoA7(s.tempoMedioMs)}${s.moneteMediePiano1 !== null ? ` · monete al piano 1: ${s.moneteMediePiano1.toFixed(1)}` : ''}`,
    P.x + P.w / 2, P.y + 41, P.w - 40, { size: 7.5, align: 'center' });
  const cause = s.causeMorte.slice(0, CONFIG_A7.causeMostrate).map((c) => `${c.causa} ×${c.n}`).join(' · ') || '—';
  T(`Morti per causa: ${cause}`, P.x + P.w / 2, P.y + 55, P.w - 40, { size: 7, align: 'center', style: 'italic' });
  const col = [P.x + 20, P.x + 102, P.x + 178, P.x + 212, P.x + 246, P.x + 432, P.x + 478];
  const tit = ['Data', 'Personaggio', 'Notte', 'Piano', 'Esito e causa', 'Tempo', 'Monete'];
  tit.forEach((t, i) => T(t, col[i], P.y + 74, 90, { size: 7, color: '#6b4423' }));
  ctx.fillStyle = 'rgba(92, 64, 36, 0.5)';
  ctx.fillRect(P.x + 18, P.y + 79, P.w - 36, 1);
  const ultime = lista.slice(-CONFIG_A7.righeRegistro).reverse();
  if (!ultime.length) T(TESTI_A7.vuoto, P.x + P.w / 2, P.y + 110, P.w - 40, { align: 'center', style: 'italic' });
  ultime.forEach((v, i) => {
    const y = P.y + 94 + i * 21;
    const d = new Date(v.data);
    T(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, col[0], y, 78);
    T(v.nomePersonaggio || v.personaggio, col[1], y, 72);
    T(String(v.notte), col[2], y, 30);
    T(String(v.piano), col[3], y, 30);
    T(`${v.vittoria ? '★ ' : ''}${TESTI_A7.esiti[v.esito] || v.esito}${v.causa && /morte/.test(v.esito) ? `: ${v.causa}` : ''}`, col[4], y, 182);
    T(tempoA7(v.tempoMs), col[5], y, 42);
    T(`+${v.monete.prese} −${v.monete.spese}`, col[6], y, 54);
    T(`${v.stanzePulite} stanze · ${v.nemiciUccisi} nemici · ${v.oggetti.length} oggetti · ${v.consumabili.length} consumabili · bombe ${v.bombe.spese} · chiavi ${v.chiavi.spese}`, col[1], y + 9, P.w - 140, { size: 6.5, color: '#6b4423', weight: '' });
  });
  T(TESTI_A7.piedeRegistro, P.x + P.w / 2, P.y + P.h - 16, P.w - 40, { size: 7, color: '#6b4423', align: 'center', style: 'italic' });
  if (a7.avviso && performance.now() < a7.avviso.finoMs) drawPillLabel(a7.avviso.testo, W / 2, P.y + P.h - 34, 360, { size: 7.5 });
  ctx.restore();
}

function rettBottonePausaA7() {
  const B = CONFIG_A7.bottonePausa;
  return { x: W / 2 - B.w / 2, y: B.y, w: B.w, h: B.h };
}

const disegnaMenuPausaBaseA7 = disegnaMenuPausa;
disegnaMenuPausa = function (...args) {
  const r = disegnaMenuPausaBaseA7.apply(this, args);
  try {
    if (!statoRun.diarioD) {
      const R = rettBottonePausaA7();
      ctx.save();
      ctx.fillStyle = '#22150d';
      ctx.fillRect(R.x, R.y, R.w, R.h);
      ctx.strokeStyle = '#7c5227';
      ctx.lineWidth = 1;
      ctx.strokeRect(R.x, R.y, R.w, R.h);
      drawTextFit(TESTI_A7.bottone, W / 2, R.y + 10.5, R.w - 12, { size: 7.5, color: '#f9cb40', weight: 'bold' });
      ctx.restore();
    }
  } catch (err) { console.error('[A7] menu', err); }
  return r;
};

const clickMenuPausaBaseA7 = gestisciClickMenuPausa;
gestisciClickMenuPausa = function (mx, my, ...resto) {
  if (a7.registroAperto) { a7.registroAperto = false; return true; }
  const R = rettBottonePausaA7();
  if (!statoRun.diarioD && mx >= R.x && mx <= R.x + R.w && my >= R.y && my <= R.y + R.h) { a7.registroAperto = true; return true; }
  return clickMenuPausaBaseA7.call(this, mx, my, ...resto);
};

/** Disegno sopra tutto (dopo il gancio 'sopra' del T4: sequenza di morte, cartigli, menu nell'hub). */
function sopraA7() {
  controllaAbbandonoA7();
  if (a7.registroAperto && !statoRun.pausa) a7.registroAperto = false;
  if (a7.registroAperto) disegnaRegistroA7();
  else if (a7.pergamena && (statoRun.fase === 'hub' || statoRun.fase === 'in_gioco')) disegnaPergamenaA7();
}

// ===========================================================================
// INPUT (fase di cattura: la pergamena e il registro prendono i tasti finché sono aperti)
// ===========================================================================
const MODIFICATORI_A7 = new Set(['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight']);
function bloccaA7(e) { e.preventDefault(); e.stopImmediatePropagation(); }

window.addEventListener('keydown', (e) => {
  if (a7.registroAperto) {
    if (e.code === CONFIG_A7.tastoEsporta && !e.repeat) esportaVersoUtenteA7();
    else if (['Escape', CONFIG_A7.tastoRegistro, 'Enter', 'Space'].includes(e.code)) a7.registroAperto = false;
    bloccaA7(e);
    return;
  }
  if (a7.pergamena && (statoRun.fase === 'hub' || statoRun.fase === 'in_gioco') && !statoRun.pausa) {
    if (MODIFICATORI_A7.has(e.code) || e.repeat) return;
    a7.pergamena = null;
    bloccaA7(e);
    return;
  }
  if (statoRun.pausa && !statoRun.diarioD && e.code === CONFIG_A7.tastoRegistro) { a7.registroAperto = true; bloccaA7(e); }
}, true);

window.addEventListener('mousedown', (e) => {
  if (a7.pergamena && !a7.registroAperto && !statoRun.pausa && (statoRun.fase === 'hub' || statoRun.fase === 'in_gioco')) {
    a7.pergamena = null;
    bloccaA7(e);
  }
}, true);

/** Con la pergamena della vittoria aperta in scena la logica della stanza aspetta. */
const passoLogicoPausaA7 = passoLogico;
passoLogico = function (...args) {
  if (a7.pergamena && statoRun.fase === 'in_gioco') { tick++; return undefined; }
  return passoLogicoPausaA7.apply(this, args);
};

// ===========================================================================
// SONDA QA / ESPORTAZIONE
// ===========================================================================
Object.assign(window.__teatro.interni, {
  CONFIG_A7,
  /** Registro dello slot attivo: elenco delle run (copia). */
  registroRun: () => JSON.parse(JSON.stringify(leggiRegistroA7())),
  /** JSON da copiare e mandare (statistiche + run). */
  esportaRegistro: esportaRegistroA7,
  statisticheRegistro: () => statisticheA7(),
  runInCorsoA7: () => (a7.run ? JSON.parse(JSON.stringify(a7.run)) : null),
  registroA7: Object.freeze({
    get pergamena() { return a7.pergamena ? { tipo: a7.pergamena.tipo, causa: a7.pergamena.voce.causa } : null; },
    get aperto() { return a7.registroAperto; },
    apri() { a7.registroAperto = true; },
    chiudi() { a7.registroAperto = false; a7.pergamena = null; },
    azzera() { scriviRegistroA7([]); },
  }),
  // versioni avvolte per la QA (stessi effetti + registro)
  nuovaRun, avviaPiano, entraInStanza, subisciColpoGiocatore,
});
