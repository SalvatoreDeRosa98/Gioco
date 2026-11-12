/*
 * teatro/20-stato.js — Stato della run (statoRun), giocatore, statistiche, seme e rng, notti, scelta del personaggio, nuova run, banner.
 * Script classico (niente moduli ES): le dichiarazioni di primo livello stanno nello scope globale
 * condiviso con gli altri file di teatro/. Ordine di caricamento e regole: teatro/LEGGIMI.md.
 */

let runSeed = Date.now() >>> 0;

function rng() {
  runSeed = (runSeed + 0x6D2B79F5) | 0;
  let t = Math.imul(runSeed ^ (runSeed >>> 15), 1 | runSeed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getNumeroNotte() {
  try {
    const v = parseInt(localStorage.getItem('ferruccio_notte'), 10);
    return isNaN(v) || v < 1 ? 1 : v;
  } catch (_) {
    return 1;
  }
}

function incrementaNumeroNotte() {
  const prox = getNumeroNotte() + 1;
  try { localStorage.setItem('ferruccio_notte', prox); } catch (_) {}
  return prox;
}

const statoRun = {
  fase: 'menu_selezione', // 'menu_selezione' | 'in_gioco'
  numeroRun: 0,
  numeroNotte: getNumeroNotte(),
  pausa: false,
  personaggioId: 'ferruccio',
  piano: 1,
  ciclo: 1,
  bossOrdine: [],
  poolOggettiBase: [],
  poolOggettiForti: [],
  poolPatto: [],
  poolSegreto: [],
  viteExtra: 0,
  volo: false,
  dropDoppi: false,
  oggettiEquipaggiati: [], // (B) oggetti passivi senza limite
  sinergieVisive: {},
  // Oggetto Attivo (Proposta 5: [Q])
  oggettoAttivo: { ...OGGETTI_ATTIVI.forbici },
  caricaAttivo: 3,
  monete: 0,
  hpHalf: 6,
  maxHpHalf: 6,
  baseMaxHpHalf: 6,
  baseDmgChar: 3.50,
  baseSpdChar: 1.00,
  dmg: 3.50,
  colpiAlSec: 2.73,
  cooldownMax: 22,
  speed: 2.0,
  range: 170,
  haSpada: false,
  triplo: false,
  doppia: false,
  quadDir: false,
  piercing: false,
  overflowPierce: false,
  burn: false,
  chain: false,
  tipoProiettile: 'base',
  projScale: 1,
  mappa: null,
  stanzaCorrente: null,
  proiettili: [],
  proiettiliNemici: [],
  effettiSplash: [],
  scintilleFulmine: [],
  ondeEsplosione: [],
  scambioPendente: null,
  // --- B: inizio ---
  pannelloB: null,        // pannello aperto della Stanza dello Sviluppatore ({ sel })
  poolRunB: null,         // pool della run: { ids (20), rimasti, estrazioni }
  // --- B: fine ---
  siparioAttivo: null,
  banner: '',
  bannerTimer: 0,
  scossa: 0,
  dannoSubitoNelBoss: false,
};

const player = {
  x: 320,
  y: 190,
  targetX: null,
  targetY: null,
  dirX: 1,
  dirY: 0,
  flipX: false,
  moving: false,
  cooldown: 0,
  shootAnimTimer: 0,
  swordAnimTick: -1,
  swordAngle: 0,
  swordHitIds: new Set(),
  pickupTimer: 0,
  pickupItem: null,
  invuln: 0,
};

function ricalcolaStatistiche() {
  let totalDmgUps = 0;
  let flatDmg = 0;
  let dmgMult = 1.0;
  let totCadenzaUp = 0;
  let cadenzaMult = 1.0;
  let speedUp = 0;
  let rangeUp = 0;
  let bonusMaxHp = 0;

  let haSpada = false;
  let triplo = false;
  let doppia = false;
  let quadDir = false;
  let piercing = false;
  let overflowPierce = false;
  let burn = false;
  let chain = false;
  let tipoProiettile = 'base';
  let projScale = 1.0;
  const sinergie = {};

  for (const item of statoRun.oggettiEquipaggiati) {
    sinergie[item.id] = true;
    const m = item.mod || {};
    if (m.dmgUp) totalDmgUps += m.dmgUp;
    if (m.flatDmg) flatDmg += m.flatDmg;
    if (m.dmgMult) dmgMult *= m.dmgMult;
    if (m.cadenzaUp) totCadenzaUp += m.cadenzaUp;
    if (m.cadenzaMult) cadenzaMult *= m.cadenzaMult;
    if (m.speedUp) speedUp += m.speedUp;
    if (m.rangeUp) rangeUp += m.rangeUp;
    if (m.bonusMaxHp) bonusMaxHp += m.bonusMaxHp;
    if (m.spada) haSpada = true;
    if (m.triplo) triplo = true;
    if (m.doppia) doppia = true;
    if (m.quadDir) quadDir = true;
    if (m.piercing) piercing = true;
    if (m.overflowPierce) overflowPierce = true;
    if (m.burn) burn = true;
    if (m.chain) chain = true;
    if (m.tipoProiettile) tipoProiettile = m.tipoProiettile;
    if (m.size) projScale = Math.max(projScale, m.size);
    if (m.volo) { statoRun.volo = true; player.volo = true; }
    if (m.moneyIsPower) flatDmg += (statoRun.monete || 0) * 0.04;
  }

  // --- C: effetto passivo del Medaglione (Benedizione di Rosa / Oblio) ---
  const medC = statoRun.fase === 'in_gioco' ? medaglioneC() : null;
  if (medC) { flatDmg += medC.dmg; bonusMaxHp += medC.maxHpHalf; }
  statoRun.medaglioneC = medC;
  const baseD = statoRun.baseDmgChar || 3.50;
  const effDmg = (baseD * Math.sqrt(Math.max(0, totalDmgUps * 1.2 + 1)) + flatDmg) * dmgMult;
  statoRun.dmg = Math.max(1.0, effDmg);

  const cadenzaEff = Math.max(0.5, Math.min(7.5, // e3: pavimento 0,85 → 0,5 (sotto 0,85 i malus di cadenza sparivano e i moltiplicatori di danno si sommavano senza prezzo)
     (2.73 + totCadenzaUp * 0.95) * cadenzaMult));
  statoRun.colpiAlSec = cadenzaEff;
  statoRun.cooldownMax = Math.max(7, Math.round(60 / cadenzaEff));

  const moltVelocita = Math.max(0.7, Math.min(2.0, (statoRun.baseSpdChar || 1.0) + speedUp));
  statoRun.speed = 2.0 * moltVelocita;
  statoRun.range = Math.max(OGGETTI_D.clamp.rangeMin, Math.min(320, 170 + rangeUp)); // D: gittata minima 50 px

  const nuovoMax = Math.max(2, Math.min(24, statoRun.baseMaxHpHalf + bonusMaxHp));
  statoRun.maxHpHalf = nuovoMax;
  if (statoRun.hpHalf > statoRun.maxHpHalf) statoRun.hpHalf = statoRun.maxHpHalf;

  statoRun.haSpada = haSpada;
  statoRun.triplo = triplo;
  statoRun.doppia = doppia;
  statoRun.quadDir = quadDir;
  statoRun.piercing = piercing;
  statoRun.overflowPierce = overflowPierce;
  statoRun.burn = burn;
  statoRun.chain = chain;
  statoRun.tipoProiettile = tipoProiettile;
  statoRun.projScale = projScale;
  statoRun.sinergieVisive = sinergie;
  // --- D: inizio --- meccaniche nuove (oggetti-teatro.md §2): si leggono i mod del catalogo, così anche i
  // doppioni (che in B tengono solo le voci additive) contano: secondo famiglio, secondo gomitolo, cuoio ×2.
  const C = OGGETTI_D.clamp;
  const dD = { oming: 0, rimbalzi: 0, orbitaProiettili: false, orbitali: 0, esplosiva: 0, prossimita: false,
    diagonale: false, quattroColpi: false, scudoStanza: 0, bloccoProb: 0, dannoMaxHalf: false,
    bloccaProiettili: false, velocitaColpo: 1, famigli: [] };
  let nonBlocco = 1;
  for (const item of statoRun.oggettiEquipaggiati) {
    const m = (trovaOggettoB(item.id) || item).mod || {};
    if (m.omingForza) dD.oming = Math.max(dD.oming, m.omingForza);
    if (m.rimbalzi) dD.rimbalzi += m.rimbalzi;
    if (m.orbitaleProiettili) dD.orbitaProiettili = true;
    if (m.orbitali) dD.orbitali += m.orbitali;
    if (m.esplosiva) dD.esplosiva = Math.max(dD.esplosiva, m.esplosiva);
    if (m.prossimita) dD.prossimita = true;
    if (m.diagonale) dD.diagonale = true;
    if (m.quattroColpi) dD.quattroColpi = true;
    if (m.scudoStanza) dD.scudoStanza = Math.max(dD.scudoStanza, m.scudoStanza);
    if (m.bloccoProb) nonBlocco *= 1 - m.bloccoProb;
    if (m.dannoMaxHalf) dD.dannoMaxHalf = true;
    if (m.bloccaProiettili) dD.bloccaProiettili = true;
    if (m.velocitaColpo) dD.velocitaColpo *= m.velocitaColpo;
    if (m.famiglio && dD.famigli.length < C.famigli) {
      dD.famigli.push({ id: item.id, tipo: m.famiglio, dmg: m.famDmg || 3, cadenza: m.famCadenza || 1, auto: m.mira === 'auto', oming: Boolean(m.famOming) });
    }
  }
  dD.rimbalzi = Math.min(C.rimbalzi, dD.rimbalzi);
  dD.orbitali = Math.min(C.orbitali, dD.orbitali);
  dD.scudoStanza = Math.min(C.scudoStanza, dD.scudoStanza);
  dD.bloccoProb = Math.min(C.bloccoProb, 1 - nonBlocco);
  const vecchiF = statoRun.famigliD || [];
  statoRun.famigliD = dD.famigli.map((f, i) => ({ ...f, x: vecchiF[i] ? vecchiF[i].x : player.x, y: vecchiF[i] ? vecchiF[i].y : player.y, cd: 0 }));
  const nuovoScudo = dD.scudoStanza > ((statoRun.statD && statoRun.statD.scudoStanza) || 0);
  statoRun.statD = dD;
  if (nuovoScudo) statoRun.scudoStanzaD = dD.scudoStanza; // vale già nella stanza in cui lo raccogli
  // --- D: fine ---
}

function mostraBanner(testo, durata = 160) {
  statoRun.banner = testo;
  statoRun.bannerTimer = durata;
}

function getCharCorrente() {
  return PERSONAGGI_GIOCABILI[statoRun.personaggioId] || PERSONAGGI_GIOCABILI.ferruccio;
}

function selezionaPersonaggio(charId) {
  if (!PERSONAGGI_GIOCABILI[charId]) return;
  statoRun.personaggioId = charId;
  for (const k of Object.keys(PERSONAGGI_GIOCABILI)) {
    const btn = document.getElementById(`btn-char-${k}`);
    if (btn) btn.classList.toggle('active', k === charId);
  }
}

function avviaPartitaConPersonaggio(charId) {
  if (charId) selezionaPersonaggio(charId);
  // --- T4: inizio ---
  if (t4Gancio('avvio', charId)) return; // il menu porta all'hub di Piazza Dante
  // --- T4: fine ---
  statoRun.fase = 'in_gioco';
  nuovaRun(false);
}

/**
 * «Ricomincia notte» (menu ESC: tasto R o pulsante). Con il T4 la notte nuova comincia nell'hub di
 * Piazza Dante (bug autore: si ripartiva direttamente nel piano); senza T4 il ramo dell'autore.
 */

function ricominciaNotte() {
  statoRun.pausa = false;
  // --- T4: inizio ---
  if (t4Gancio('ricomincia')) return;
  // --- T4: fine ---
  statoRun.fase = 'in_gioco';
  nuovaRun(true);
}

function nuovaRun(incrementaNotte = false) {
  runSeed = (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
  statoRun.fase = 'in_gioco';
  statoRun.pausa = false;
  if (incrementaNotte) {
    statoRun.numeroNotte = incrementaNumeroNotte();
  } else {
    statoRun.numeroNotte = getNumeroNotte();
  }
  const pInfo = PERSONAGGI_GIOCABILI[statoRun.personaggioId] || PERSONAGGI_GIOCABILI.ferruccio;
  statoRun.numeroRun += 1;
  // Effetti degli oggetti segreti che valgono solo per la run: non devono passare alla notte dopo
  statoRun.viteExtra = 0; statoRun.volo = false; statoRun.dropDoppi = false; player.volo = false;
  // Boss assegnati coerentemente ai quartieri della Bibbia narrativa:
  // Piano 1 (Corso Trieste): Il Gatto dei Quattro Canti
  // Piano 2 (Villa Comunale): Il Custode di Marmo (Madre di Marmo)
  // Piano 3 (San Leucio): Il Capitano di Piombo (scelta dell'autore: il suo boss sblocca Taddeo); lo Spezzafili d'Ottone dal piano 5
  // Piano 4 (La Reggia): Donna Luciana (gestita direttamente come boss finale)
  const bossGatto = POOL_BOSS.find((x) => x.id === 're-gatto') || POOL_BOSS[0];
  const bossStatua = POOL_BOSS.find((x) => x.id === 'colosso-statua') || POOL_BOSS[1];
  const bossLeucio = POOL_BOSS.find((x) => x.id === 'capitano-guardia') || POOL_BOSS.find((x) => x.id === 'maestro-fucina') || POOL_BOSS[2];
  const altriBoss = shuffle(POOL_BOSS.filter((x) => x.id !== 're-gatto' && x.id !== 'colosso-statua' && x.id !== bossLeucio.id));
  statoRun.bossOrdine = [bossGatto, bossStatua, bossLeucio, ...altriBoss];
  if (PLAYTEST_GATTI.attivo && PLAYTEST_GATTI.bossGattoPrimo) { // prova dei gatti: il Gatto dei Quattro Canti per primo
    const g = statoRun.bossOrdine.findIndex((x) => x.id === 're-gatto');
    if (g > 0) statoRun.bossOrdine.unshift(statoRun.bossOrdine.splice(g, 1)[0]);
  }
  statoRun.poolOggettiBase = shuffle(CATALOGO_OGGETTI.filter((x) => x.tier === 'base'));
  statoRun.poolOggettiForti = shuffle(CATALOGO_OGGETTI.filter((x) => x.tier === 'forte'));
  statoRun.poolPatto = shuffle(CATALOGO_PATTO);
  statoRun.oggettiEquipaggiati = [];
  if (pInfo.passivoIniziale) {
    const initItem = CATALOGO_OGGETTI.find((x) => x.id === pInfo.passivoIniziale);
    if (initItem) statoRun.oggettiEquipaggiati.push({ ...initItem });
  }
  // --- B: inizio ---
  inizializzaPoolRunB(pInfo.passivoIniziale || null);
  statoRun.pannelloB = null;
  // --- B: fine ---
  // --- D: inizio ---
  statoRun.maledizioniD = {};
  statoRun.cartiglioD = null;
  if (pInfo.passivoIniziale) segnaConosciutoD(pInfo.passivoIniziale); // il dono iniziale è già conosciuto
  statoRun.famigliD = [];
  statoRun.ultimoTiroD = null;
  // --- D: fine ---
  statoRun.oggettoAttivo = { ...(OGGETTI_ATTIVI[pInfo.attivoIniziale] || OGGETTI_ATTIVI.forbici) };
  statoRun.caricaAttivo = statoRun.oggettoAttivo.maxCarica;
  statoRun.scambioPendente = null;
  statoRun.monete = 0;
  statoRun.baseMaxHpHalf = pInfo.hpHalf;
  statoRun.maxHpHalf = pInfo.hpHalf;
  statoRun.hpHalf = pInfo.hpHalf;
  statoRun.baseDmgChar = pInfo.baseDmg;
  statoRun.baseSpdChar = pInfo.baseSpd;
  ricalcolaStatistiche();
  // --- C: con la Benedizione di Rosa la maschera in più parte piena ---
  if (statoRun.medaglioneC && statoRun.medaglioneC.maxHpHalf > 0) {
    statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + statoRun.medaglioneC.maxHpHalf);
  }
  avviaPiano(1, true);
  mostraBanner(`🌙 NOTTE ${statoRun.numeroNotte} — Sipario alzato!`, 180);
}
