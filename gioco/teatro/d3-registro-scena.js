/*
 * teatro/d3-registro-scena.js — (d3) IL REGISTRO DI SCENA e i TRIONFI che portano oggetti nuovi in attrezzeria.
 *
 *  1. REGISTRO DI SCENA: un leggio col librone del teatro in Piazza Dante (hub di t4-hub-storia.js). [E] accanto
 *     al leggio apre un libro a pagine con quattro sezioni:
 *       - Comparse (nemici): figura, nome, volte battuto, aneddoto che si svela dopo N sconfitte.
 *       - Primi attori (boss di 00-config.js e b6-boss.js): figura, nome, volte battuto, battuta, aneddoto.
 *       - Attrezzeria: oggetti conosciuti sul totale, per tema (legge il Diario degli oggetti: conosciutiD,
 *         tuttiGliOggettiB5, temiDi; nessun dato duplicato).
 *       - Trionfi: griglia dei segni di a6 per personaggio e le voci di TRIONFI_D3.
 *     Non è il «Registro delle notti» di a7-registro-bilancio.js (statistiche delle run, dal menu di pausa):
 *     il libro lo ricorda in calce.
 *  2. TRIONFI: ogni segno di completamento di a6 (boss battuto con un personaggio) e alcuni fatti della storia
 *     (finale vero, finale segreto di b8, boss battuto senza un graffio) sono trionfi; TRIONFI_D3 dice quale
 *     oggetto del catalogo ciascuno porta in attrezzeria. Finché il trionfo manca l'oggetto resta fuori dal
 *     pool della run (avvolgendo oggettoSbloccatoA6, che il filtro del pool di a6 già consulta).
 *     Nessun salvataggio vecchio si rompe: i segni di a6 restano dove sono e si leggono soltanto.
 *
 * Salvataggio: localStorage `ferruccio.teatro.registroScena` (globale, non per slot): conteggi e trionfi visti.
 * Robusto a dati vecchi o corrotti (normalizzaD3).
 * Comandi: tastiera (frecce/WASD, Invio, Esc, Tab, 1-4), gamepad e tocco (contesto «menu» di b3 via
 * interni.comandiB3.menuAperti), mouse/tocco sul libro.
 * Avvolge (chiamando sempre la base): passoLogico, danneggiaNemico, subisciColpoGiocatore, entraInStanza,
 * t4Gancio, disegnaFrame, oggettoSbloccatoA6 e i ganci di T4 window.__teatro.hubSenzaNessunoC1, hubFermoC1,
 * coseHubC1. Script classico caricato dopo teatro/c2-tocco.js. QA: tools/qa-teatro-registro-scena.js.
 */

// ===========================================================================
// 1. TABELLE (numeri, posizioni; i testi sono DA APPROVARE DALL'AUTORE)
// ===========================================================================
const CONFIG_D3 = Object.freeze({
  chiave: 'ferruccio.teatro.registroScena',
  versione: 1,
  // leggio nella piazza: cella della griglia dell'hub (13×7 sull'ARENA), raggio per [E], raggio del corpo
  leggio: Object.freeze({ c: 0.9, r: 5.2, raggioE: 32, raggioCorpo: 10 }),
  libro: Object.freeze({ x: 36, y: 18, w: 568, h: 324 }),
  carta: Object.freeze({ fondo: '#eadcbd', bordo: '#5c4024', inchiostro: '#4a2c14', tenue: '#8a6a48', rosso: '#7a1f12', oro: '#b8860b' }),
  carte: Object.freeze({ perPagina: 4, colonne: 4, w: 124, h: 100, x0: [56, 186, 330, 460], y0: [58, 164] }),
  rivelaComparsa: 5,          // sconfitte per svelare l'aneddoto di una comparsa (se la voce non dice altro)
  rivelaPrimoAttore: 1,       // sconfitte per svelare l'aneddoto di un boss
  controlloTrionfiMs: 500,
  scalaComparsa: 1.15,
  scalaPrimoAttore: 0.62,
});

/** Comparse: tipo (patternMob) → nome a schermo e aneddoto. `rivela` = sconfitte che lo svelano. */
const COMPARSE_D3 = Object.freeze([
  Object.freeze({ tipo: 'vespa_cieca', nome: 'Vespa Cieca', rivela: 8,
    aneddoto: 'Ali di carta velina incollate con la colla di farina: il garzone ne rifà dieci a sera, perché la ribalta le brucia.' }),
  Object.freeze({ tipo: 'lucciola', nome: 'Lucciola Pungente', rivela: 6,
    aneddoto: 'Dentro c\'è un mozzicone di candela di sego. Quando si spegne cade giù: in bottega la chiamano «la poveretta».' }),
  Object.freeze({ tipo: 'bomba_ferma', nome: 'Bozzo Esplosivo', rivela: 5,
    aneddoto: 'Polvere avanzata dalla festa di Piedigrotta, cucita in un sacchetto di iuta. Il capocomico giura che in prova non è mai scoppiato.' }),
  Object.freeze({ tipo: 'gatto', nome: 'Gatto d\'Ombra', rivela: 5,
    aneddoto: 'Ritagliato da un vecchio fondale di Vico Lungo: sulla schiena si legge ancora mezza insegna di cantina.' }),
  Object.freeze({ tipo: 'burattino', nome: 'Burattino Scucito', rivela: 5,
    aneddoto: 'Un pupo rimasto senza parte. Ha recitato in troppe commedie e non ricorda più quale: per questo se la prende con tutti.' }),
  Object.freeze({ tipo: 'predone', nome: 'Predone d\'Ombra', rivela: 5,
    aneddoto: 'Sagoma di cartone nero tirata da due fili soli. I macchinisti dicono che si muove anche a teatro chiuso.' }),
  Object.freeze({ tipo: 'maschera', nome: 'Maschera Corazzata', rivela: 4,
    aneddoto: 'Cartapesta su latta, otto mani di vernice. Quando la bocca si apre, dentro c\'è solo il buio delle quinte.' }),
  Object.freeze({ tipo: 'guardia', nome: 'Guardia di Piombo', rivela: 4,
    aneddoto: 'Fusa coi soldatini rotti della fiera di Caserta. Pesa tanto che a sollevarla ci vogliono due burattinai.' }),
  Object.freeze({ tipo: 'statua', nome: 'Torrione di Marmo', rivela: 3,
    aneddoto: 'Non è marmo: è gesso venato a pennello. Ma quando cade, cade come un macigno.' }),
]);

/**
 * Primi attori: battuta (se il boss non ne ha già una in SCHEDE_B6.presentazione) e aneddoto.
 * Nome e figura vengono da POOL_BOSS, BOSS_FINALE e SCHEDE_B6.
 */
const PRIMI_ATTORI_D3 = Object.freeze({
  're-gatto': Object.freeze({ battuta: '«Ai Quattro Canti si paga il pedaggio, guagliò.»',
    aneddoto: 'Il salto si fa con una carrucola nascosta sopra il boccascena: due macchinisti tirano insieme, al tre.' }),
  'capitano-guardia': Object.freeze({ battuta: '«Alt! In nome di Sua Maestà, fermo là!»',
    aneddoto: 'La corazza è una caldaia battuta a martello. A ogni carica suona come la campana di una chiesa.' }),
  'regina-vespa': Object.freeze({ battuta: '«Sciame mio, ronzate per la Signora!»',
    aneddoto: 'La corona è fatta coi ditali delle sarte. Ne manca uno: in sartoria lo cercano ancora.' }),
  'colosso-statua': Object.freeze({ battuta: '(Il marmo non parla. Ascolta.)',
    aneddoto: 'Lo muove una manovella sotto il palco: se senti cigolare, sta per aprirsi.' }),
  'maestro-fucina': Object.freeze({ battuta: '«Ogni filo ha il suo taglio, burattino.»',
    aneddoto: 'Le lame erano cesoie da sarto. Il fabbro della bottega le affilava di notte, perché di giorno facevano paura.' }),
  'donna-luciana': Object.freeze({ battuta: '«Tutti i fili tornano alla mia mano.»',
    aneddoto: 'Quando entra lei la ribalta si abbassa di un palmo: anche le lanterne, dicono, s\'inchinano.' }),
  lampionaio: Object.freeze({ battuta: null,
    aneddoto: 'La pertica è vera: l\'ha lasciata un lampionaio di Corso Trieste che veniva alle recite senza pagare.' }),
  'cigno-latta': Object.freeze({ battuta: null,
    aneddoto: 'Un giocattolo a molla da tre carlini, ingrandito dal falegname. Per caricarlo ci vogliono quaranta giri di chiave.' }),
  'giostra-lucciole': Object.freeze({ battuta: null,
    aneddoto: 'Smontata dopo la festa e rimontata in fretta, al contrario: per questo gira all\'indietro.' }),
  'tessitrice-pietra': Object.freeze({ battuta: null,
    aneddoto: 'Il telaio, dicono, viene da San Leucio. La seta no: è polvere e filo di ragno.' }),
});

/**
 * TRIONFI. `quando`: { boss } boss battuto (qualunque personaggio), { boss, personaggio } con quel personaggio
 * (i segni di a6), { finale: 'vero' | 'segreto' } (stato di b8), { senzaDanni: true } boss battuto senza un
 * colpo subito nella sua stanza. `oggetto`: id del catalogo passivo che il trionfo porta in attrezzeria.
 * 16 oggetti su 200 (8%), nessuno di base, nessuno già dietro gli sblocchi di a6/b5.
 */
const TRIONFI_D3 = Object.freeze([
  Object.freeze({ id: 'gatto', nome: 'Pedaggio pagato', quando: { boss: 're-gatto' }, oggetto: 'corno' }),
  Object.freeze({ id: 'capitano', nome: 'Il piombo s\'inchina', quando: { boss: 'capitano-guardia' }, oggetto: 'tromboncino' }),
  Object.freeze({ id: 'vespa', nome: 'Sciame spento', quando: { boss: 'regina-vespa' }, oggetto: 'ragno' }),
  Object.freeze({ id: 'custode', nome: 'Marmo crepato', quando: { boss: 'colosso-statua' }, oggetto: 'campana-vetro' }),
  Object.freeze({ id: 'spezzafili', nome: 'Fili salvi', quando: { boss: 'maestro-fucina' }, oggetto: 'tenaglie' }),
  Object.freeze({ id: 'lampionaio', nome: 'L\'ultimo lume', quando: { boss: 'lampionaio' }, oggetto: 'ombrello' }),
  Object.freeze({ id: 'cigno', nome: 'Molla scarica', quando: { boss: 'cigno-latta' }, oggetto: 'archetto' }),
  Object.freeze({ id: 'giostra', nome: 'Giostra ferma', quando: { boss: 'giostra-lucciole' }, oggetto: 'piedigrotta' }),
  Object.freeze({ id: 'tessitrice', nome: 'Telaio sciolto', quando: { boss: 'tessitrice-pietra' }, oggetto: 'sigillo-borbone' }),
  Object.freeze({ id: 'luciana-ferruccio', nome: 'Ferruccio alla ribalta', quando: { boss: 'donna-luciana', personaggio: 'ferruccio' }, oggetto: 'angelo-cartapesta' }),
  Object.freeze({ id: 'luciana-agnese', nome: 'Agnese alla ribalta', quando: { boss: 'donna-luciana', personaggio: 'agnese' }, oggetto: 'cuore-sacro' }),
  Object.freeze({ id: 'luciana-taddeo', nome: 'Taddeo alla ribalta', quando: { boss: 'donna-luciana', personaggio: 'taddeo' }, oggetto: 'bombarda' }),
  Object.freeze({ id: 'luciana-ombra', nome: 'L\'Ombra alla ribalta', quando: { boss: 'donna-luciana', personaggio: 'ombra' }, oggetto: 'diavoletto' }),
  Object.freeze({ id: 'finale-vero', nome: 'Il bivio', quando: { finale: 'vero' }, oggetto: 'croce-comando' }),
  Object.freeze({ id: 'finale-segreto', nome: 'Sopra la ribalta', quando: { finale: 'segreto' }, oggetto: 'sole' }),
  Object.freeze({ id: 'senza-danni', nome: 'Recita senza graffi', quando: { senzaDanni: true }, oggetto: 'baba' }),
]);

/** Testi a schermo. DA APPROVARE DALL'AUTORE. */
const TESTI_D3 = Object.freeze({
  titolo: 'Registro di Scena',
  sottotitolo: 'Real Teatro delle Marionette · Caserta, 1845',
  invito: '[E] Registro di Scena',
  sezioni: Object.freeze(['Comparse', 'Primi attori', 'Attrezzeria', 'Trionfi']),
  ignoto: '???',
  battuto: (n) => `Battuto ${n} ${n === 1 ? 'volta' : 'volte'}`,
  mai: 'Mai in scena con te',
  visto: 'Visto in scena, mai battuto',
  daSvelare: (n) => `Batti ancora ${n} ${n === 1 ? 'volta' : 'volte'} per leggerne la storia.`,
  primoAttoreIgnoto: 'Non ha ancora calcato la tua scena.',
  temaTot: (k, n) => `${k} su ${n}`,
  attrezzeria: (k, n) => `Attrezzi conosciuti: ${k} su ${n}. Il Diario degli oggetti li racconta uno per uno ([O] dal menu di pausa).`,
  trionfoPreso: (nome) => `In attrezzeria: ${nome}`,
  trionfoMancante: 'Un attrezzo ancora chiuso nel baule.',
  condizione: (q) => q.finale === 'vero' ? 'Arriva al finale vero.'
    : q.finale === 'segreto' ? 'Trova il finale segreto.'
    : q.senzaDanni ? 'Batti un primo attore senza farti nemmeno un graffio.'
    : q.personaggio ? `Batti ${nomeBossD3(q.boss)} con ${nomePersonaggioD3(q.personaggio)}.`
    : `Batti ${nomeBossD3(q.boss)}.`,
  griglia: 'Segni di completamento: un segno per ogni primo attore battuto con ogni burattino.',
  contoSegni: (n, tot) => `${n} ${n === 1 ? 'segno' : 'segni'} su ${tot}.`,
  nuovo: (nome) => `Nuovo nell'attrezzeria: ${nome}`,
  calce: 'Le cronache delle notti stanno nel Registro delle notti ([L] dal menu di pausa).',
  comandi: '[←][→] sfoglia · [↑] sezioni · [ESC] chiudi',
});

// ===========================================================================
// 2. SALVATAGGIO (localStorage, globale)
// ===========================================================================
const d3 = {
  reg: null,             // registro normalizzato in memoria
  libro: null,           // { sez, spread, sel, schede } se il libro è aperto
  colpitoInStanza: false,
  ultimoControlloMs: 0,
  cache6: null, cache6Tick: -1,
  ultimaNotifica: null,  // per la QA
};

/** Registro vuoto. */
function vuotoD3() { return { versione: CONFIG_D3.versione, iniziato: false, nemici: {}, boss: {}, trionfi: {} }; }

const interoD3 = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? Math.min(n, 1e9) : 0; };

/** Normalizza un registro letto da disco: ogni campo strano torna al predefinito. */
function normalizzaD3(d) {
  const s = vuotoD3();
  if (!d || typeof d !== 'object' || Array.isArray(d)) return s;
  s.iniziato = Boolean(d.iniziato);
  for (const k of ['nemici', 'boss']) {
    const src = d[k];
    if (!src || typeof src !== 'object' || Array.isArray(src)) continue;
    for (const [id, v] of Object.entries(src)) {
      if (!v || typeof v !== 'object') continue;
      s[k][id] = { visti: interoD3(v.visti), battuti: interoD3(v.battuti) };
    }
  }
  if (d.trionfi && typeof d.trionfi === 'object' && !Array.isArray(d.trionfi)) {
    for (const [id, v] of Object.entries(d.trionfi)) if (v === true) s.trionfi[id] = true;
  }
  return s;
}

/** Registro di scena (lo carica la prima volta; mai null). */
function registroD3() {
  if (d3.reg) return d3.reg;
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(CONFIG_D3.chiave) || 'null'); } catch (_) { raw = null; }
  d3.reg = normalizzaD3(raw);
  return d3.reg;
}

function scriviD3() {
  try { localStorage.setItem(CONFIG_D3.chiave, JSON.stringify(registroD3())); } catch (_) { /* memoria piena o negata: resta in memoria */ }
}

function vocePerD3(k, id) {
  const r = registroD3();
  return r[k][id] || (r[k][id] = { visti: 0, battuti: 0 });
}

// ===========================================================================
// 3. CONTEGGI (uno sguardo per passo alla stanza: prende anche chi muore senza danneggiaNemico)
// ===========================================================================
const tipoNemicoD3 = (n) => n.patternMob || n.tipo;

/** Un Bozzo che scoppia da solo (miccia finita, nessun colpo letale) non conta come battuto. */
function scoppiatoDaSoloD3(n) {
  return tipoNemicoD3(n) === 'bomba_ferma' && !n.d3Ucciso && (n.fuseTimer || 0) >= 42;
}

/** Guarda i nemici della stanza corrente: nuovi visti e nuovi caduti. */
function contaStanzaD3() {
  const st = statoRun.stanzaCorrente;
  if (!st || !Array.isArray(st.nemici) || !st.nemici.length) return;
  let cambiato = false;
  for (const n of st.nemici) {
    if (!n || n.d3Contato) continue;
    const k = n.boss ? 'boss' : 'nemici';
    const id = n.boss ? n.bossId : tipoNemicoD3(n);
    if (!id) { n.d3Contato = true; continue; }
    if (!n.d3Visto) { n.d3Visto = true; vocePerD3(k, id).visti++; cambiato = true; }
    if (n.hp <= 0) {
      n.d3Contato = true;
      if (!scoppiatoDaSoloD3(n)) { vocePerD3(k, id).battuti++; cambiato = true; }
    }
  }
  if (cambiato) scriviD3();
}

// ===========================================================================
// 4. NOMI E FIGURE
// ===========================================================================
/** Tutti i primi attori, una volta sola ciascuno: { id, nome, tipo, scheda }. */
function primiAttoriD3() {
  const visti = new Set();
  const out = [];
  const metti = (b) => { if (b && b.id && !visti.has(b.id)) { visti.add(b.id); out.push(b); } };
  try { POOL_BOSS.forEach(metti); } catch (_) { /* senza 00-config */ }
  try { if (typeof SCHEDE_B6 === 'object') Object.values(SCHEDE_B6).forEach(metti); } catch (_) { /* senza b6 */ }
  try { metti(BOSS_FINALE); } catch (_) { /* idem */ }
  return out;
}

function nomeBossD3(id) {
  const b = primiAttoriD3().find((x) => x.id === id);
  return b ? String(b.nome).split(' — ')[0] : id;
}

function nomePersonaggioD3(pid) {
  try { return (PERSONAGGI_GIOCABILI[pid] && PERSONAGGI_GIOCABILI[pid].nome) || pid; } catch (_) { return pid; }
}

// (f1) Sagome in cache. ctx.filter = 'brightness(0)' in Chrome filtra tutta la tela a ogni tratto (~38 ms per
// fotogramma sul telefono). Ogni sagoma si disegna UNA volta, senza filtro, su un riquadro della tela svuotato, si
// copia su una tela piccola, si annerisce con 'source-in' (stesso risultato di brightness(0): nero, alfa intatta) e
// poi si riusa. La chiave porta la scala della tela e la parte frazionaria della posizione: pixel identici.
const cacheSagomeD3 = new Map();
const MAX_SAGOME_D3 = 96; // oltre, si svuota (cambi di risoluzione ripetuti)

/**
 * Disegna in nero la figura di `disegna()` dentro il riquadro logico `box` (coordinate della trasformazione attuale),
 * dalla cache se c'è. Il riquadro deve stare dentro il ritaglio del chiamante. Ritorna false se non può (si ricade
 * sul filtro).
 */
function sagomaInCacheD3(chiave, box, disegna) {
  const t = ctx.getTransform();
  if (t.b !== 0 || t.c !== 0 || t.a <= 0 || t.d <= 0) return false;
  const x0 = Math.ceil(t.a * box.x + t.e), y0 = Math.ceil(t.d * box.y + t.f); // arrotondato verso l'interno
  const x1 = Math.floor(t.a * (box.x + box.w) + t.e), y1 = Math.floor(t.d * (box.y + box.h) + t.f);
  const w = x1 - x0, h = y1 - y0;
  if (w <= 0 || h <= 0) return false;
  const fx = (t.a * box.x + t.e) - x0, fy = (t.d * box.y + t.f) - y0;
  const k = `${chiave}|${t.a.toFixed(3)}|${t.d.toFixed(3)}|${w}x${h}|${fx.toFixed(2)}|${fy.toFixed(2)}`;
  let tela = cacheSagomeD3.get(k);
  if (!tela) {
    const salva = document.createElement('canvas'); salva.width = w; salva.height = h;
    salva.getContext('2d').drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(x0, y0, w, h); ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
    ctx.globalAlpha = 1; ctx.filter = 'none';
    try { disegna(); } finally { ctx.restore(); }
    tela = document.createElement('canvas'); tela.width = w; tela.height = h;
    const tc = tela.getContext('2d');
    tc.drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
    tc.globalCompositeOperation = 'source-in'; tc.fillStyle = '#000'; tc.fillRect(0, 0, w, h);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(x0, y0, w, h); ctx.drawImage(salva, x0, y0); ctx.restore();
    if (cacheSagomeD3.size >= MAX_SAGOME_D3) cacheSagomeD3.clear();
    cacheSagomeD3.set(k, tela);
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(tela, x0, y0); ctx.restore(); // globalAlpha del chiamante
  return true;
}

/** Disegna una comparsa coi piedi in (x, y). sagoma = tutta nera; box = riquadro della sagoma (abilita la cache). */
function figuraComparsaD3(tipo, x, y, scala, sagoma, box) {
  if (sagoma && box && sagomaInCacheD3('c:' + tipo + ':' + scala + ':' + (x - box.x) + ':' + (y - box.y), box,
    () => figuraComparsaD3(tipo, x, y, scala, false))) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scala, scala);
  if (sagoma) ctx.filter = 'brightness(0)';
  try {
    disegnaNemicoPittorico({ x: 0, y: 0, tipo, patternMob: tipo, hp: 1, maxHp: 1, flash: 0, champion: null,
      state: 'idle', stateTimer: 0, maskOpen: true, airZ: 0, fuseTimer: 0, id: 'd3-' + tipo }, 0);
  } catch (_) { disegnaSagomaRipiegoD3(); }
  ctx.restore();
}

/** Disegna un primo attore coi piedi in (x, y). box come in figuraComparsaD3. */
function figuraPrimoAttoreD3(b, x, y, scala, sagoma, box) {
  if (sagoma && box && sagomaInCacheD3('p:' + b.id + ':' + scala + ':' + (x - box.x) + ':' + (y - box.y), box,
    () => figuraPrimoAttoreD3(b, x, y, scala, false))) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scala, scala);
  if (sagoma) ctx.filter = 'brightness(0)';
  try {
    disegnaBossPittorico({ x: 0, y: 0, bossId: b.id, tipo: b.tipo, boss: true, nome: b.nome, hp: 1, maxHp: 1, flash: 0,
      airZ: 0, phase: 1, fase: 1, state: 'idle', stateTimer: 0, pattern: b.pattern, id: 'd3-' + b.id }, 0);
  } catch (_) { disegnaSagomaRipiegoD3(); }
  ctx.restore();
}

function disegnaSagomaRipiegoD3() {
  ctx.fillStyle = '#120c08';
  ctx.beginPath(); ctx.ellipse(0, -14, 9, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -32, 7, 0, Math.PI * 2); ctx.fill();
}

// ===========================================================================
// 5. TRIONFI E SBLOCCO DEGLI OGGETTI
// ===========================================================================
/** Stato di a6 dello slot attivo, una lettura per tick. */
function stato6D3() {
  if (typeof statoA6 !== 'function') return null;
  const t = typeof tick === 'number' ? tick : -2;
  if (!d3.cache6 || d3.cache6Tick !== t) { try { d3.cache6 = statoA6(); } catch (_) { d3.cache6 = null; } d3.cache6Tick = t; }
  return d3.cache6;
}

function stato8D3() {
  try { return typeof statoB8 === 'function' ? statoB8() : null; } catch (_) { return null; }
}

/** true se la condizione del trionfo è vera adesso (senza contare quel che è già nel registro). */
function condizioneVeraD3(t, s6, s8) {
  const q = t.quando;
  if (q.finale === 'vero') return Boolean(s8 && s8.finaleVisto);
  if (q.finale === 'segreto') return Boolean(s8 && s8.segretoVisto);
  if (q.senzaDanni) return false; // si registra solo nel momento (bossSconfittoD3)
  if (!s6 || !q.boss) return false;
  if (q.personaggio) return Array.isArray(s6.segni[q.personaggio]) && s6.segni[q.personaggio].includes(q.boss);
  return s6.boss.includes(q.boss) || Object.values(s6.segni).some((v) => Array.isArray(v) && v.includes(q.boss));
}

/** true se il trionfo è stato ottenuto (registro globale o salvataggio dello slot). */
function trionfoOttenutoD3(id) {
  const t = TRIONFI_D3.find((x) => x.id === id);
  if (!t) return false;
  if (registroD3().trionfi[id]) return true;
  return condizioneVeraD3(t, stato6D3(), null);
}

const TRIONFO_PER_OGGETTO_D3 = new Map(TRIONFI_D3.map((t) => [t.oggetto, t]));

/** true se l'oggetto può uscire nelle estrazioni (gli oggetti fuori da TRIONFI_D3 sempre). */
function oggettoInAttrezzeriaD3(idOgg) {
  const t = TRIONFO_PER_OGGETTO_D3.get(idOgg);
  if (!t) return true;
  try { if (typeof tuttoSbloccatoA6 === 'function' && tuttoSbloccatoA6()) return true; } catch (_) { /* nessuno */ }
  return trionfoOttenutoD3(t.id);
}

/** Registra i trionfi nuovi; annuncia (se `annuncia`) col cartiglio di a6. Restituisce gli id nuovi. */
function controllaTrionfiD3(annuncia = true) {
  const r = registroD3();
  const s6 = stato6D3();
  const s8 = stato8D3();
  const nuovi = [];
  for (const t of TRIONFI_D3) if (!r.trionfi[t.id] && condizioneVeraD3(t, s6, s8)) { r.trionfi[t.id] = true; nuovi.push(t.id); }
  const prima = !r.iniziato;
  r.iniziato = true;
  if (nuovi.length || prima) scriviD3();
  if (annuncia && !prima) for (const id of nuovi) annunciaTrionfoD3(id);
  return nuovi;
}

/** Cartiglio «Nuovo nell'attrezzeria: …» (coda delle notifiche di a6; senza a6, un banner). */
function annunciaTrionfoD3(id) {
  const t = TRIONFI_D3.find((x) => x.id === id);
  if (!t) return;
  let o = null;
  try { o = trovaOggettoB(t.oggetto); } catch (_) { o = null; }
  const nomeOgg = o ? o.nome : t.oggetto;
  d3.ultimaNotifica = TESTI_D3.nuovo(nomeOgg);
  if (typeof a6 === 'object' && a6 && Array.isArray(a6.coda)) a6.coda.push({ testo: TESTI_D3.nuovo(nomeOgg), nome: t.nome, sprite: o ? o.sprite : null, personaggio: null });
  else if (typeof mostraBanner === 'function') mostraBanner(TESTI_D3.nuovo(nomeOgg), 200);
}

/** Boss sconfitto: il trionfo «senza graffi» se nella stanza non hai subito colpi. */
function bossSconfittoD3() {
  const r = registroD3();
  if (!d3.colpitoInStanza && !r.trionfi['senza-danni']) {
    r.trionfi['senza-danni'] = true;
    scriviD3();
    if (r.iniziato) annunciaTrionfoD3('senza-danni');
  }
  controllaTrionfiD3(true);
}

// ===========================================================================
// 6. IL LEGGIO NELLA PIAZZA
// ===========================================================================
function posLeggioD3() {
  const L = CONFIG_D3.leggio;
  const cw = (ARENA.x2 - ARENA.x1) / 13, ch = (ARENA.y2 - ARENA.y1) / 7;
  return { x: ARENA.x1 + (L.c + 0.5) * cw, y: ARENA.y1 + (L.r + 0.5) * ch };
}

function vicinoLeggioD3() {
  const p = posLeggioD3();
  return Math.hypot(player.x - p.x, player.y - p.y) < CONFIG_D3.leggio.raggioE;
}

/** Leggio a ombre: piede, colonna tornita, piano inclinato col librone aperto. (x, y) = piede. */
function disegnaLeggioD3(x, y, t) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 5, 3, 0.55)';
  ctx.beginPath(); ctx.ellipse(x, y + 2, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a110b';
  ctx.strokeStyle = '#c9963a';
  ctx.lineWidth = 1;
  // piede a tre zampe
  ctx.beginPath();
  ctx.moveTo(x - 13, y + 2); ctx.lineTo(x - 3, y - 6); ctx.lineTo(x + 3, y - 6); ctx.lineTo(x + 13, y + 2);
  ctx.lineTo(x + 9, y + 3); ctx.lineTo(x, y - 2); ctx.lineTo(x - 9, y + 3); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // colonna tornita
  ctx.beginPath();
  ctx.moveTo(x - 2.5, y - 5); ctx.lineTo(x - 2.5, y - 20); ctx.quadraticCurveTo(x - 5, y - 23, x - 2.5, y - 26);
  ctx.lineTo(x - 2.5, y - 32); ctx.lineTo(x + 2.5, y - 32); ctx.lineTo(x + 2.5, y - 26);
  ctx.quadraticCurveTo(x + 5, y - 23, x + 2.5, y - 20); ctx.lineTo(x + 2.5, y - 5); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // piano inclinato
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 33); ctx.lineTo(x + 16, y - 33); ctx.lineTo(x + 13, y - 42); ctx.lineTo(x - 13, y - 42); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // librone aperto (carta tenue, unica luce chiara)
  const respiro = 0.75 + 0.08 * Math.sin((t || 0) * 0.05);
  ctx.fillStyle = `rgba(234, 220, 189, ${respiro.toFixed(2)})`;
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 43); ctx.quadraticCurveTo(x - 7, y - 47, x, y - 44); ctx.quadraticCurveTo(x + 7, y - 47, x + 14, y - 43);
  ctx.lineTo(x + 12, y - 38); ctx.quadraticCurveTo(x + 6, y - 41, x, y - 39); ctx.quadraticCurveTo(x - 6, y - 41, x - 12, y - 38);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#5c4024'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - 44); ctx.lineTo(x, y - 39); ctx.stroke();
  // segnalibro rosso
  ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x + 4, y - 41); ctx.lineTo(x + 5, y - 33); ctx.stroke();
  ctx.restore();
}

/** Spinge Ferruccio fuori dal piede del leggio (la piazza di T4 non lo conosce). */
function collisioneLeggioD3() {
  if (statoRun.fase !== 'hub') return;
  const p = posLeggioD3();
  const dx = player.x - p.x, dy = player.y - p.y;
  const d = Math.hypot(dx, dy);
  const R = CONFIG_D3.leggio.raggioCorpo;
  if (d >= R) return;
  if (d < 0.01) { player.y = p.y + R; return; }
  player.x = p.x + (dx / d) * R; player.y = p.y + (dy / d) * R;
}

// ===========================================================================
// 7. IL LIBRO: contenuto delle pagine
// ===========================================================================
/** Le «aperture» (due pagine) di una sezione: { tipo: 'carte', carte } oppure { tipo: 'griglia' }. */
function apertureD3(sez) {
  const per = CONFIG_D3.carte.perPagina * 2;
  let carte = [];
  if (sez === 0) carte = COMPARSE_D3.map((c) => ({ tipo: 'comparsa', voce: c }));
  else if (sez === 1) carte = primiAttoriD3().map((b) => ({ tipo: 'primo', voce: b }));
  else if (sez === 2) carte = ((typeof TEMI_B4 === 'object' && TEMI_B4.ordine) || []).map((t) => ({ tipo: 'tema', voce: t }));
  else carte = TRIONFI_D3.map((t) => ({ tipo: 'trionfo', voce: t }));
  const out = sez === 3 ? [{ tipo: 'griglia', carte: [] }] : [];
  for (let i = 0; i < carte.length; i += per) out.push({ tipo: 'carte', carte: carte.slice(i, i + per) });
  if (!out.length) out.push({ tipo: 'carte', carte: [] });
  return out;
}

/** Conteggio degli oggetti conosciuti per tema (legge il Diario: nessun dato copiato). */
function attrezzeriaD3() {
  let tutti = [];
  try { tutti = typeof tuttiGliOggettiB5 === 'function' ? tuttiGliOggettiB5() : CATALOGO_OGGETTI.slice(); } catch (_) { tutti = []; }
  let noti = [];
  try { noti = typeof conosciutiD === 'function' ? conosciutiD() : []; } catch (_) { noti = []; }
  const set = new Set(noti);
  const perTema = {};
  let k = 0;
  for (const o of tutti) {
    if (!o || !o.id) continue;
    const c = set.has(o.id);
    if (c) k++;
    let temi = [];
    try { temi = typeof temiDi === 'function' ? temiDi(o) : (o.temi || []); } catch (_) { temi = []; }
    for (const t of temi) {
      const v = perTema[t] || (perTema[t] = { k: 0, n: 0 });
      v.n++; if (c) v.k++;
    }
  }
  return { k, n: tutti.length, perTema };
}

// ===========================================================================
// 8. IL LIBRO: resa
// ===========================================================================
function rettCartaD3(i) {
  const C = CONFIG_D3.carte;
  const col = i % C.colonne, riga = Math.floor(i / C.colonne);
  return { x: C.x0[col], y: C.y0[riga], w: C.w, h: C.h };
}

function rettSchedaD3(i) {
  const B = CONFIG_D3.libro;
  const w = 104;
  return { x: B.x + 70 + i * (w + 8), y: B.y + 6, w, h: 18 };
}

const RETT_CHIUDI_D3 = Object.freeze({ x: 578, y: 22, w: 20, h: 18 });
const RETT_PRIMA_D3 = Object.freeze({ x: 44, y: 318, w: 28, h: 18 });
const RETT_DOPO_D3 = Object.freeze({ x: 568, y: 318, w: 28, h: 18 });

/** Testo a capo entro maxW: restituisce le righe. */
function righeD3(testo, maxW, font) {
  ctx.save();
  ctx.font = font;
  const parole = String(testo || '').split(/\s+/);
  const out = [];
  let riga = '';
  for (const p of parole) {
    const prova = riga ? riga + ' ' + p : p;
    if (ctx.measureText(prova).width > maxW && riga) { out.push(riga); riga = p; } else riga = prova;
  }
  if (riga) out.push(riga);
  ctx.restore();
  return out;
}

function testoD3(s, x, y, { size = 8, color = CONFIG_D3.carta.inchiostro, align = 'left', style = '', weight = '' } = {}) {
  ctx.save();
  ctx.font = `${style} ${weight} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
  ctx.restore();
}

/** Disegna il libro aperto sopra la piazza. */
function disegnaLibroD3() {
  const L = d3.libro;
  if (!L) return;
  const B = CONFIG_D3.libro, K = CONFIG_D3.carta;
  const aperture = apertureD3(L.sez);
  L.spread = Math.max(0, Math.min(L.spread, aperture.length - 1));
  const ap = aperture[L.spread];
  ctx.save();
  ctx.fillStyle = 'rgba(6, 4, 2, 0.72)';
  ctx.fillRect(0, 0, W, H);
  // copertina di cuoio
  ctx.fillStyle = '#3b1f12';
  ctx.fillRect(B.x - 6, B.y - 4, B.w + 12, B.h + 10);
  ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1;
  ctx.strokeRect(B.x - 3, B.y - 1, B.w + 6, B.h + 4);
  // le due pagine
  for (const [px, pw] of [[B.x, B.w / 2 - 2], [B.x + B.w / 2 + 2, B.w / 2 - 2]]) {
    const g = ctx.createLinearGradient(px, 0, px + pw, 0);
    const sinistra = px === B.x;
    g.addColorStop(0, sinistra ? '#e2d1ad' : '#cdb98f');
    g.addColorStop(0.08, K.fondo);
    g.addColorStop(0.92, K.fondo);
    g.addColorStop(1, sinistra ? '#cdb98f' : '#e2d1ad');
    ctx.fillStyle = g;
    ctx.fillRect(px, B.y + 28, pw, B.h - 30);
  }
  // testata con le schede delle sezioni
  ctx.fillStyle = K.fondo;
  ctx.fillRect(B.x, B.y, B.w, 28);
  ctx.strokeStyle = K.bordo;
  ctx.beginPath(); ctx.moveTo(B.x + 8, B.y + 28); ctx.lineTo(B.x + B.w - 8, B.y + 28); ctx.stroke();
  testoD3('R', B.x + 10, B.y + 24, { size: 24, color: K.rosso, weight: 'bold' });
  testoD3('egistro', B.x + 27, B.y + 14, { size: 8, color: K.inchiostro, style: 'italic' });
  testoD3('di Scena', B.x + 27, B.y + 24, { size: 8, color: K.inchiostro, style: 'italic' });
  testoD3(TESTI_D3.sottotitolo, B.x + B.w / 2, B.y + B.h - 7, { size: 6.5, color: K.tenue, align: 'center', style: 'italic' });
  TESTI_D3.sezioni.forEach((nome, i) => {
    const r = rettSchedaD3(i);
    const attiva = i === L.sez;
    ctx.fillStyle = attiva ? '#f4e8cc' : '#d8c49c';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = attiva && L.fuoco === 'schede' ? K.rosso : K.bordo;
    ctx.lineWidth = attiva && L.fuoco === 'schede' ? 2 : 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    testoD3(nome, r.x + r.w / 2, r.y + 13, { size: 9, color: attiva ? K.rosso : K.inchiostro, align: 'center', weight: attiva ? 'bold' : '' });
  });
  testoD3('✕', RETT_CHIUDI_D3.x + 10, RETT_CHIUDI_D3.y + 13, { size: 11, color: K.rosso, align: 'center', weight: 'bold' });
  // dorso
  ctx.fillStyle = 'rgba(60, 35, 15, 0.35)';
  ctx.fillRect(B.x + B.w / 2 - 3, B.y + 28, 6, 262 - B.y - 32);
  // striscia di dettaglio in calce: carta piena, senza piega (le righe lunghe non cadono nel dorso)
  ctx.fillStyle = K.fondo;
  ctx.fillRect(B.x + 6, 264, B.w - 12, B.y + B.h - 266);

  if (ap.tipo === 'griglia') disegnaGrigliaD3();
  else ap.carte.forEach((c, i) => disegnaCartaD3(c, rettCartaD3(i), L.fuoco === 'carte' && i === L.sel));

  // striscia di dettaglio
  disegnaDettaglioD3(ap);
  // piede: numeri di pagina, frecce, comandi
  const pag = `— ${L.spread * 2 + 1} · ${L.spread * 2 + 2} —`;
  testoD3(pag, B.x + B.w - 60, B.y + B.h - 7, { size: 7.5, color: K.tenue, align: 'center', style: 'italic' });
  if (L.spread > 0) testoD3('◀', RETT_PRIMA_D3.x + 14, RETT_PRIMA_D3.y + 12, { size: 11, color: K.rosso, align: 'center' });
  if (L.spread < aperture.length - 1) testoD3('▶', RETT_DOPO_D3.x + 14, RETT_DOPO_D3.y + 12, { size: 11, color: K.rosso, align: 'center' });
  drawTextFit(TESTI_D3.comandi, B.x + B.w * 0.27, B.y + B.h + 13, 280, { size: 7, color: '#e6d2aa', shadow: true });
  drawTextFit(TESTI_D3.calce, B.x + B.w * 0.74, B.y + B.h + 13, 290, { size: 6.5, color: '#bfa57a', weight: '', style: 'italic', shadow: true });
  ctx.restore();
}

function disegnaCartaD3(c, r, sel) {
  const K = CONFIG_D3.carta;
  ctx.save();
  ctx.strokeStyle = sel ? K.rosso : 'rgba(92, 64, 36, 0.45)';
  ctx.lineWidth = sel ? 2 : 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (sel) { ctx.fillStyle = 'rgba(122, 31, 18, 0.06)'; ctx.fillRect(r.x, r.y, r.w, r.h); }
  const cx = r.x + r.w / 2;
  const piedi = r.y + 64;
  const reg = registroD3();
  let nome = TESTI_D3.ignoto, riga2 = '';
  if (c.tipo === 'comparsa') {
    const v = reg.nemici[c.voce.tipo] || { visti: 0, battuti: 0 };
    ctx.save(); ctx.beginPath(); ctx.rect(r.x + 2, r.y + 2, r.w - 4, 64); ctx.clip();
    figuraComparsaD3(c.voce.tipo, cx, piedi - 4, CONFIG_D3.scalaComparsa, v.battuti <= 0, { x: r.x + 2, y: r.y + 2, w: r.w - 4, h: 64 });
    ctx.restore();
    if (v.visti > 0 || v.battuti > 0) nome = c.voce.nome;
    riga2 = v.battuti > 0 ? TESTI_D3.battuto(v.battuti) : v.visti > 0 ? TESTI_D3.visto : TESTI_D3.mai;
  } else if (c.tipo === 'primo') {
    const v = reg.boss[c.voce.id] || { visti: 0, battuti: 0 };
    ctx.save(); ctx.beginPath(); ctx.rect(r.x + 2, r.y + 2, r.w - 4, 64); ctx.clip();
    figuraPrimoAttoreD3(c.voce, cx, piedi - 2, CONFIG_D3.scalaPrimoAttore, v.battuti <= 0, { x: r.x + 2, y: r.y + 2, w: r.w - 4, h: 64 });
    ctx.restore();
    if (v.visti > 0 || v.battuti > 0) nome = nomeBossD3(c.voce.id);
    riga2 = v.battuti > 0 ? TESTI_D3.battuto(v.battuti) : v.visti > 0 ? TESTI_D3.visto : TESTI_D3.mai;
  } else if (c.tipo === 'tema') {
    const a = attrezzeriaD3();
    const v = a.perTema[c.voce] || { k: 0, n: 0 };
    try { drawPixelSprite(TEMI_B4.icone[c.voce], cx, r.y + 30, 4); } catch (_) { /* icona facoltativa */ }
    nome = (TEMI_B4.nomi && TEMI_B4.nomi[c.voce]) || c.voce;
    riga2 = TESTI_D3.temaTot(v.k, v.n);
    // barra d'inchiostro
    ctx.fillStyle = 'rgba(92, 64, 36, 0.25)'; ctx.fillRect(r.x + 14, r.y + 60, r.w - 28, 4);
    ctx.fillStyle = K.rosso; ctx.fillRect(r.x + 14, r.y + 60, (r.w - 28) * (v.n ? v.k / v.n : 0), 4);
  } else if (c.tipo === 'trionfo') {
    const preso = trionfoOttenutoD3(c.voce.id);
    let o = null;
    try { o = trovaOggettoB(c.voce.oggetto); } catch (_) { o = null; }
    const spr = o && (SPRITE_OGGETTI[o.sprite] || SPRITE_OGGETTI[o.id]);
    ctx.save();
    const icona = () => { try { drawPixelSprite(spr || SPRITE_OGGETTI.spada, cx, r.y + 32, 3); } catch (_) { /* icona facoltativa */ } };
    if (preso) icona();
    else {
      ctx.globalAlpha = 0.75; // (f1) sagoma dalla cache, come le figure; filtro solo se la cache non si può usare
      if (!sagomaInCacheD3('t:' + c.voce.id + ':' + (cx - r.x), { x: r.x + 2, y: r.y + 2, w: r.w - 4, h: 64 }, icona)) {
        ctx.filter = 'brightness(0)'; icona();
      }
    }
    ctx.restore();
    nome = preso ? c.voce.nome : TESTI_D3.ignoto;
    riga2 = preso && o ? o.nome : '';
    if (preso) { testoD3('✦', r.x + r.w - 10, r.y + 13, { size: 10, color: K.oro, align: 'center' }); }
  }
  drawTextFit(nome, cx, r.y + 80, r.w - 8, { size: 8.5, color: K.inchiostro, shadow: false });
  if (riga2) drawTextFit(riga2, cx, r.y + 93, r.w - 8, { size: 7, color: K.tenue, weight: '', style: 'italic', shadow: false });
  ctx.restore();
}

/** Griglia dei segni (a6): righe = burattini, colonne = primi attori. */
function disegnaGrigliaD3() {
  const K = CONFIG_D3.carta;
  const s6 = stato6D3();
  const boss = (typeof SEGNI_A6 !== 'undefined' ? SEGNI_A6 : []).map((sg) => sg.boss);
  const pg = (CONFIG_A6 && CONFIG_A6.scheda && CONFIG_A6.scheda.ids) || ['ferruccio', 'agnese', 'taddeo', 'ombra'];
  const x0 = 116, y0 = 104, passoX = Math.min(40, (590 - x0) / Math.max(1, boss.length)), passoY = 34; // con 10 colonne il dorso cade fra la 5ª e la 6ª
  const segni = typeof SEGNI_A6 !== 'undefined' ? SEGNI_A6 : [];
  boss.forEach((id, j) => {
    ctx.save();
    ctx.translate(x0 + j * passoX + passoX / 2 - 2, y0 - 4);
    ctx.rotate(-0.55);
    const corto = (segni[j] && segni[j].nome) || nomeBossD3(id);
    testoD3(corto.length > 20 ? corto.slice(0, 19) + '…' : corto, 0, 0, { size: 6.5, color: K.tenue });
    ctx.restore();
  });
  pg.forEach((pid, i) => {
    const y = y0 + 16 + i * passoY;
    testoD3(nomePersonaggioD3(pid), x0 - 8, y + 3, { size: 8, color: K.inchiostro, align: 'right' });
    const avuti = (s6 && s6.segni[pid]) || [];
    boss.forEach((id, j) => {
      const x = x0 + j * passoX + passoX / 2;
      const ok = avuti.includes(id);
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = ok ? K.rosso : 'rgba(92, 64, 36, 0.12)'; ctx.fill();
      ctx.strokeStyle = ok ? K.oro : 'rgba(92, 64, 36, 0.5)'; ctx.lineWidth = 1; ctx.stroke();
      if (ok) testoD3('✦', x, y + 3.5, { size: 9, color: '#f4e8cc', align: 'center' });
    });
  });
}

function disegnaDettaglioD3(ap) {
  const K = CONFIG_D3.carta, B = CONFIG_D3.libro;
  const L = d3.libro;
  const y = 272;
  ctx.save();
  ctx.strokeStyle = 'rgba(92, 64, 36, 0.5)';
  ctx.beginPath(); ctx.moveTo(B.x + 16, y - 4); ctx.lineTo(B.x + B.w - 16, y - 4); ctx.stroke();
  ctx.restore();
  let righe = [];
  if (L.sez === 2) {
    const a = attrezzeriaD3();
    righe = [TESTI_D3.attrezzeria(a.k, a.n)];
  } else if (ap.tipo === 'griglia') {
    const s6 = stato6D3();
    const n = s6 ? Object.values(s6.segni).reduce((acc, v) => acc + (Array.isArray(v) ? v.length : 0), 0) : 0;
    const tot = ((typeof SEGNI_A6 !== 'undefined' ? SEGNI_A6.length : 0) * ((CONFIG_A6 && CONFIG_A6.scheda && CONFIG_A6.scheda.ids.length) || 4));
    righe = [TESTI_D3.griglia, TESTI_D3.contoSegni(n, tot)];
  } else {
    const c = ap.carte[L.sel];
    if (!c) return;
    const reg = registroD3();
    if (c.tipo === 'comparsa') {
      const v = reg.nemici[c.voce.tipo] || { battuti: 0 };
      const soglia = c.voce.rivela || CONFIG_D3.rivelaComparsa;
      righe = [v.battuti >= soglia ? c.voce.aneddoto : (v.battuti > 0 ? TESTI_D3.daSvelare(soglia - v.battuti) : TESTI_D3.ignoto)];
    } else if (c.tipo === 'primo') {
      const v = reg.boss[c.voce.id] || { battuti: 0 };
      const extra = PRIMI_ATTORI_D3[c.voce.id] || {};
      const battuta = (typeof SCHEDE_B6 === 'object' && SCHEDE_B6[c.voce.id] && SCHEDE_B6[c.voce.id].presentazione) || extra.battuta || '';
      righe = v.battuti >= CONFIG_D3.rivelaPrimoAttore ? [battuta, extra.aneddoto || ''] : [TESTI_D3.primoAttoreIgnoto];
    } else if (c.tipo === 'trionfo') {
      const preso = trionfoOttenutoD3(c.voce.id);
      righe = [TESTI_D3.condizione(c.voce.quando)];
      let o = null;
      try { o = trovaOggettoB(c.voce.oggetto); } catch (_) { o = null; }
      righe.push(preso && o ? TESTI_D3.trionfoPreso(o.nome) : TESTI_D3.trionfoMancante);
    }
  }
  // fregio d'inchiostro in calce (la pagina non resta mai nuda)
  ctx.save();
  ctx.strokeStyle = 'rgba(92, 64, 36, 0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 - 90, 316); ctx.quadraticCurveTo(W / 2 - 45, 308, W / 2 - 12, 316); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 + 90, 316); ctx.quadraticCurveTo(W / 2 + 45, 308, W / 2 + 12, 316); ctx.stroke();
  ctx.restore();
  testoD3('❦', W / 2, 320, { size: 12, color: K.rosso, align: 'center' });
  let yy = y + 10;
  const font = "italic 9px Georgia, 'Times New Roman', serif";
  const tutte = righe.filter(Boolean).flatMap((r) => righeD3(r, B.w - 60, font).slice(0, 2)).slice(0, 3);
  for (const r of [0]) {
    for (const riga of tutte) {
      testoD3(riga, W / 2, yy, { size: 9, color: K.inchiostro, align: 'center', style: 'italic' });
      yy += 12;
    }
  }
}

// ===========================================================================
// 9. IL LIBRO: comandi
// ===========================================================================
/** Apre il Registro di Scena (nell'hub). */
function apriRegistroScenaD3() {
  try { controllaTrionfiD3(true); } catch (_) { /* il libro si apre comunque */ }
  d3.libro = { sez: 0, spread: 0, sel: 0, fuoco: 'carte' };
  for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']) keys[k] = false;
  try { AudioSys.playPasso(); } catch (_) { /* audio facoltativo */ }
}

function chiudiRegistroScenaD3() { d3.libro = null; }

function cambiaSezioneD3(i) {
  const L = d3.libro;
  L.sez = (i + 4) % 4; L.spread = 0; L.sel = 0;
}

/** Un tasto col libro aperto (codici canonici: tastiera, gamepad e tocco arrivano qui tramite b3). */
function tastoLibroD3(code) {
  const L = d3.libro;
  if (!L) return;
  const aperture = apertureD3(L.sez);
  const ap = aperture[L.spread];
  const nCarte = ap.tipo === 'carte' ? ap.carte.length : 0;
  const C = CONFIG_D3.carte;
  const sx = ['ArrowLeft', 'KeyA'].includes(code), dx = ['ArrowRight', 'KeyD'].includes(code);
  const su = ['ArrowUp', 'KeyW'].includes(code), giu = ['ArrowDown', 'KeyS'].includes(code);
  if (code === 'Escape' || code === 'Backspace') { chiudiRegistroScenaD3(); return; }
  if (/^Digit[1-4]$/.test(code)) { cambiaSezioneD3(Number(code.slice(5)) - 1); L.fuoco = 'carte'; return; }
  if (code === 'Tab' || code === 'PageDown') { cambiaSezioneD3(L.sez + 1); return; }
  if (code === 'PageUp') { cambiaSezioneD3(L.sez - 1); return; }
  if (L.fuoco === 'schede') {
    if (sx) cambiaSezioneD3(L.sez - 1);
    else if (dx) cambiaSezioneD3(L.sez + 1);
    else if (giu || code === 'Enter' || code === 'Space' || code === 'KeyE') L.fuoco = 'carte';
    return;
  }
  if (ap.tipo !== 'carte' || !nCarte) {
    if (sx && L.spread > 0) L.spread--;
    else if (dx && L.spread < aperture.length - 1) { L.spread++; L.sel = 0; }
    else if (su) L.fuoco = 'schede';
    return;
  }
  const col = L.sel % C.colonne, riga = Math.floor(L.sel / C.colonne);
  if (dx) {
    if (col < C.colonne - 1 && L.sel + 1 < nCarte) L.sel++;
    else if (L.spread < aperture.length - 1) { L.spread++; L.sel = Math.min(riga * C.colonne, apertureD3(L.sez)[L.spread].carte.length - 1); L.sel = Math.max(0, L.sel); }
  } else if (sx) {
    if (col > 0) L.sel--;
    else if (L.spread > 0) {
      L.spread--;
      const prec = apertureD3(L.sez)[L.spread];
      L.sel = prec.tipo === 'carte' ? Math.min(riga * C.colonne + C.colonne - 1, prec.carte.length - 1) : 0;
    }
  } else if (su) {
    if (riga > 0) L.sel -= C.colonne; else L.fuoco = 'schede';
  } else if (giu) {
    if (L.sel + C.colonne < nCarte) L.sel += C.colonne;
  }
}

/** Click (mouse o tocco) sul libro, in coordinate del canvas. */
function clickLibroD3(mx, my) {
  const L = d3.libro;
  const dentro = (r) => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
  const B = CONFIG_D3.libro;
  if (dentro(RETT_CHIUDI_D3) || !dentro({ x: B.x - 6, y: B.y - 4, w: B.w + 12, h: B.h + 10 })) { chiudiRegistroScenaD3(); return; }
  for (let i = 0; i < 4; i++) if (dentro(rettSchedaD3(i))) { cambiaSezioneD3(i); L.fuoco = 'carte'; return; }
  const aperture = apertureD3(L.sez);
  if (dentro(RETT_PRIMA_D3) && L.spread > 0) { L.spread--; L.sel = 0; return; }
  if (dentro(RETT_DOPO_D3) && L.spread < aperture.length - 1) { L.spread++; L.sel = 0; return; }
  const ap = aperture[L.spread];
  if (ap.tipo === 'carte') for (let i = 0; i < ap.carte.length; i++) if (dentro(rettCartaD3(i))) { L.sel = i; L.fuoco = 'carte'; return; }
}

function bloccaD3(e) { e.preventDefault(); e.stopImmediatePropagation(); }

window.addEventListener('keydown', (e) => {
  if (!d3.libro) return;
  if (statoRun.fase !== 'hub') { chiudiRegistroScenaD3(); return; }
  tastoLibroD3(e.code);
  bloccaD3(e);
}, true);
window.addEventListener('keyup', (e) => { if (d3.libro) bloccaD3(e); }, true);

window.addEventListener('mousedown', (e) => {
  if (!d3.libro || e.target !== canvas) return;
  const r = canvas.getBoundingClientRect();
  clickLibroD3((e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height));
  bloccaD3(e);
}, true);

// ===========================================================================
// 10. AVVOLGIMENTI (sempre la base)
// ===========================================================================
const passoLogicoBaseD3 = passoLogico;
passoLogico = function (...args) {
  const r = passoLogicoBaseD3.apply(this, args);
  try { if (statoRun.fase === 'in_gioco') contaStanzaD3(); } catch (err) { console.error('[D3] conteggi', err); }
  return r;
};

const danneggiaNemicoBaseD3 = danneggiaNemico;
danneggiaNemico = function (nem, ...resto) {
  const r = danneggiaNemicoBaseD3.call(this, nem, ...resto);
  try { if (nem && nem.hp <= 0) { nem.d3Ucciso = true; contaStanzaD3(); } } catch (err) { console.error('[D3] colpo', err); }
  return r;
};

const subisciColpoGiocatoreBaseD3 = subisciColpoGiocatore;
subisciColpoGiocatore = function (...args) {
  const prima = player.invuln || 0;
  const r = subisciColpoGiocatoreBaseD3.apply(this, args);
  if (prima <= 0 && (player.invuln || 0) > 0) d3.colpitoInStanza = true; // colpo arrivato (anche se uno scudo l'ha preso)
  return r;
};

const entraInStanzaBaseD3 = entraInStanza;
entraInStanza = function (...args) {
  d3.colpitoInStanza = false;
  return entraInStanzaBaseD3.apply(this, args);
};

const t4GancioBaseD3 = t4Gancio;
t4Gancio = function (nome, ...args) {
  const r = t4GancioBaseD3(nome, ...args);
  if (nome === 'bossSconfitto') { try { contaStanzaD3(); bossSconfittoD3(); } catch (err) { console.error('[D3] boss', err); } }
  return r;
};

if (typeof oggettoSbloccatoA6 === 'function') {
  const oggettoSbloccatoA6BaseD3 = oggettoSbloccatoA6;
  /** Gli oggetti dei trionfi restano fuori dal pool finché il trionfo manca. */
  oggettoSbloccatoA6 = function (idOgg, ...resto) {
    if (TRIONFO_PER_OGGETTO_D3.has(idOgg)) return oggettoInAttrezzeriaD3(idOgg);
    return oggettoSbloccatoA6BaseD3.call(this, idOgg, ...resto);
  };
}

const disegnaFrameBaseD3 = disegnaFrame;
disegnaFrame = function (dtMs) {
  const r = disegnaFrameBaseD3(dtMs);
  try {
    const ora = performance.now();
    if (ora - d3.ultimoControlloMs > CONFIG_D3.controlloTrionfiMs) { d3.ultimoControlloMs = ora; controllaTrionfiD3(true); }
    if (statoRun.fase === 'hub') { collisioneLeggioD3(); if (d3.libro) disegnaLibroD3(); }
    else if (d3.libro) chiudiRegistroScenaD3();
  } catch (err) { console.error('[D3] frame', err); }
  return r;
};

// ganci della piazza (T4 li legge al momento della chiamata)
(function agganciaPiazzaD3() {
  const T = window.__teatro;
  if (!T || Object.isFrozen(T)) return;
  const senzaNessunoBase = T.hubSenzaNessunoC1;
  T.hubSenzaNessunoC1 = function (code, lamp, ...resto) {
    if (code === 'KeyE' && statoRun.fase === 'hub' && !d3.libro && vicinoLeggioD3()) { apriRegistroScenaD3(); return true; }
    return typeof senzaNessunoBase === 'function' ? senzaNessunoBase.call(this, code, lamp, ...resto) : false;
  };
  const fermoBase = T.hubFermoC1;
  T.hubFermoC1 = function (...a) {
    if (d3.libro) return true;
    return typeof fermoBase === 'function' ? fermoBase.apply(this, a) : false;
  };
  const coseBase = T.coseHubC1;
  T.coseHubC1 = function (cose, t, lamp, ...resto) {
    if (typeof coseBase === 'function') coseBase.call(this, cose, t, lamp, ...resto);
    const p = posLeggioD3();
    cose.push({ y: p.y, d: () => disegnaLeggioD3(p.x, p.y, t) });
    if (!d3.libro && vicinoLeggioD3()) {
      let dialogo = false;
      try { dialogo = Boolean(T.t4qa && T.t4qa.dialogo); } catch (_) { dialogo = false; }
      if (!dialogo) cose.push({ y: 5e6, d: () => drawPillLabel(TESTI_D3.invito, p.x + 30, p.y - 56, 200, { size: 8, color: '#ffffff', border: '#f9cb40' }) });
    }
  };
})();

// gamepad e tocco: col libro aperto b3 passa al contesto «menu» (frecce, A = Invio, B/Start = Esc)
try { window.__teatro.interni.comandiB3.menuAperti.push(() => Boolean(d3.libro)); } catch (_) { /* senza b3: solo tastiera e mouse */ }

// ===========================================================================
// 11. SONDA QA
// ===========================================================================
Object.assign(window.__teatro.interni, {
  CONFIG_D3, COMPARSE_D3, PRIMI_ATTORI_D3, TRIONFI_D3, TESTI_D3,
  registroScenaD3: {
    get aperto() { return Boolean(d3.libro); },
    get libro() { return d3.libro ? { ...d3.libro } : null; },
    get ultimaNotifica() { return d3.ultimaNotifica; },
    registro: () => JSON.parse(JSON.stringify(registroD3())),
    ricarica: () => { d3.reg = null; return registroD3(); },
    leggio: posLeggioD3,
    apri: apriRegistroScenaD3,
    chiudi: chiudiRegistroScenaD3,
    tasto: tastoLibroD3,
    aperture: (s) => apertureD3(s).map((a) => ({ tipo: a.tipo, n: a.carte.length })),
    trionfoOttenuto: trionfoOttenutoD3,
    oggettoInAttrezzeria: oggettoInAttrezzeriaD3,
    controllaTrionfi: controllaTrionfiD3,
  },
});
