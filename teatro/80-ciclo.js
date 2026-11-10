/*
 * teatro/80-ciclo.js — Loop a passo fisso, esposizione degli interni per T3/T4/QA e avvio (ultimo file).
 * Script classico (niente moduli ES): le dichiarazioni di primo livello stanno nello scope globale
 * condiviso con gli altri file di teatro/. Ordine di caricamento e regole: teatro/LEGGIMI.md.
 */

// ===========================================================================
// LOOP DI GIOCO E IA DIFFERENZIATA NEMICI/BOSS
// ===========================================================================
let tick = 0;

// (T1) Passo fisso a FEEL.passo.hz con accumulatore e tetto di tick per frame: a 120 Hz il gioco va
// alla stessa velocità che a 60 Hz. Come motore/fondazione/ciclo.js.
let ultimoFrameMs = null;

let accumuloMs = 0;

function loop(oraMs) {
  // Il prossimo fotogramma si prenota per primo: un errore in questo non ferma più il gioco (000-errori.js).
  requestAnimationFrame(loop);
  const ora = Number.isFinite(oraMs) ? oraMs : performance.now();
  if (ultimoFrameMs === null) ultimoFrameMs = ora - MS_PER_TICK;
  const dtMs = Math.min(FEEL.passo.maxDeltaMs, Math.max(0, ora - ultimoFrameMs));
  ultimoFrameMs = ora;
  accumuloMs += dtMs;
  let passi = 0;
  while (accumuloMs >= MS_PER_TICK && passi < FEEL.passo.maxTickPerFrame) {
    try {
      passoLogico();
      // Rete di sicurezza: un nemico può morire senza passare da danneggiaNemico (Bozzo che esplode, fuoco…);
      // se sono tutti a terra, la stanza si apre comunque.
      const st = statoRun.stanzaCorrente;
      if (st && !st.pulita && statoRun.fase === 'in_gioco' && st.nemici.every((n) => n.hp <= 0)) verificaStanzaPulita();
    } catch (err) {
      segnalaErroreTeatro('logica', err);
    }
    accumuloMs -= MS_PER_TICK;
    passi++;
  }
  if (passi >= FEEL.passo.maxTickPerFrame) accumuloMs = Math.min(accumuloMs, MS_PER_TICK);
  try {
    iniziaFrame(); // (T5) scala base 640x360 → buffer
    disegnaFrame(dtMs);
    // --- T4: inizio ---
    t4Gancio('sopra', dtMs);
    // --- T4: fine ---
    fusibileScenaTeatro(true);
  } catch (err) {
    segnalaErroreTeatro('disegno', err);
    ripulisciContestoTeatro(ctx); // save/restore rimasti aperti a metà fotogramma
    fusibileScenaTeatro(false);
  }
}

statoRun.fase = 'menu_selezione';

// --- T3: inizio ---
// Unico punto di esposizione degli interni per gioco/teatro/t3-economia-salvataggi.js (script classico
// caricato subito dopo questo). Riferimenti vivi, non copie: lo script T3 li legge e li modifica.
window.__teatroInterno = {
  W, H, ARENA, ctx, canvas, statoRun, player, keys, AudioSys, CATALOGO_PATTO, CATALOGO_OGGETTI, CATALOGO_SEGRETO, ECONOMIA_T3,
  PERSONAGGI_GIOCABILI, drawTextFit, drawPillLabel, mostraBanner, danneggiaNemico, apriMuroSegreto,
  colpisciMuroSegretoC, // C
  acquisisciOggettoConLimite5Slot, selezionaPersonaggio, estraiOggettoSegreto,
  get tick() { return tick; },
};
// --- T3: fine ---

// Sonda di sola lettura per la QA automatica (Playwright): non cambia nulla del gioco.
window.__teatro = Object.freeze({
  get tick() { return tick; },
  get fase() { return statoRun.fase; },
  get player() { return { x: player.x, y: player.y, invuln: player.invuln }; },
  get stanza() { return statoRun.stanzaCorrente ? statoRun.stanzaCorrente.tipo : null; },
});

// --- T2: inizio ---
function t2Gancio(nome, ...args) {
  const g = window.__teatro && window.__teatro.t2;
  if (!g || typeof g[nome] !== 'function') return false;
  try { return Boolean(g[nome](...args)); } catch (err) { console.error('[T2]', nome, err); return false; }
}
// --- T2: fine ---

// --- T4: inizio ---
// Passo T4 (hub, storia, morte e risveglio): il codice sta in teatro/t4-hub-storia.js, script classico
// caricato dopo questo. Qui solo i ganci: t4Gancio(nome, ...) chiama window.__teatro.t4[nome] se c'è
// (true = il T4 ha gestito l'evento). La sonda sopra è congelata: la si ricopia (getter compresi) in un
// oggetto estendibile, così T3 e T4 vi aggiungono proprietà con Object.assign senza sovrascriversi.
function t4Gancio(nome, ...args) {
  const g = window.__teatro && window.__teatro.t4;
  if (!g || typeof g[nome] !== 'function') return false;
  try { return Boolean(g[nome](...args)); } catch (err) { console.error('[T4]', nome, err); return false; }
}
// --- T4: fine ---

if (Object.isFrozen(window.__teatro)) {
  window.__teatro = Object.defineProperties({}, Object.getOwnPropertyDescriptors(window.__teatro));
}

Object.assign(window.__teatro, {
  interni: Object.assign(window.__teatro.interni || {}, {
    ctx, W, H, TAU, ARENA, FEEL, MS_PER_TICK, statoRun, player, keys, SPRITE_OGGETTI, SPRITE_SCENA,
    PERSONAGGI_GIOCABILI, AudioSys, drawTextFit, drawPillLabel, drawPixelSprite, getFloorTileCanvas,
    disegnaFerruccioPittorico, disegnaManoMarionettaPittorica, disegnaFiliMarionetta, getCharCorrente,
    selezionaPersonaggio, nuovaRun, mostraBanner, scuoti, rng,
    // (T4) un solo contatore delle notti, quello dell'autore; menu ESC dell'autore disegnato anche nell'hub
    getNumeroNotte, incrementaNumeroNotte, disegnaMenuPausa,
    NOTTI_C, effettiNotteC, STANZE_C, // C
    // (QA generatore) mappa di un piano con un seme dato; non tocca la run in corso
    mappaConSeme(piano, seme) {
      const salvato = runSeed;
      const salvatiPool = [statoRun.poolOggettiBase, statoRun.poolOggettiForti, statoRun.poolPatto, statoRun.bossOrdine];
      runSeed = seme >>> 0;
      if (!statoRun.bossOrdine || !statoRun.bossOrdine.length) statoRun.bossOrdine = POOL_BOSS.slice();
      statoRun.poolOggettiBase = shuffle(CATALOGO_OGGETTI.filter((x) => x.tier === 'base'));
      statoRun.poolOggettiForti = shuffle(CATALOGO_OGGETTI.filter((x) => x.tier === 'forte'));
      statoRun.poolPatto = shuffle(CATALOGO_PATTO);
      // --- B: inizio ---
      const salvatoPoolB = statoRun.poolRunB;
      statoRun.poolRunB = null;
      // --- B: fine ---
      try { return generaMappaPiano(piano); } finally {
        // --- B: inizio ---
        statoRun.poolRunB = salvatoPoolB;
        // --- B: fine ---
        runSeed = salvato;
        [statoRun.poolOggettiBase, statoRun.poolOggettiForti, statoRun.poolPatto, statoRun.bossOrdine] = salvatiPool;
      }
    },
    MAPPA_PIANO, STANZE_COMBATTIMENTO_PER_PIANO,
  }),
});

// --- B: inizio --- (sonda QA degli oggetti infiniti, del pool della run e della Stanza dello Sviluppatore)
Object.assign(window.__teatro.interni, {
  OGGETTI_B, CATALOGO_OGGETTI, acquisisciOggetto: acquisisciOggettoConLimite5Slot, estraiOggettoBase,
  estraiOggettoForte, tiraOggettoGratisStanza, avviaPiano, entraInStanza, interagisciStanza,
  scegliOggettoSviluppatoreB, apriPannelloSviluppatoreB, tastoPannelloB,
});
// --- B: fine ---

// --- D: inizio --- (sonda QA delle meccaniche e del catalogo D)
Object.assign(window.__teatro.interni, {
  OGGETTI_D, ECONOMIA_T3, conosciutiD, descD, apriDiarioD, gestisciClickMenuPausa, estraiNegativoD, sparaProiettiliDirezione, subisciColpoGiocatore, ricalcolaStatistiche, maledizioneD, trovaOggettoB,
});
// --- D: fine ---

adattaRisoluzione(); // (T5) primo dimensionamento del buffer

requestAnimationFrame(loop);
