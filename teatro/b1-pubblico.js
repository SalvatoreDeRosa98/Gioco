/*
 * teatro/b1-pubblico.js — «Il palcoscenico vivo», parte 1: il pubblico nei palchetti e il sipario di velluto.
 * Script classico (niente moduli ES): le dichiarazioni di primo livello stanno nello scope globale
 * condiviso con gli altri file di teatro/. Ordine di caricamento e regole: teatro/LEGGIMI.md.
 *
 * 1. PUBBLICO: balconata in alto (dietro l'HUD), palchi di proscenio ai lati, teste di platea in basso.
 *    Reagisce a quello che fai e tiene un indice di GRADIMENTO (0..1) che si vede solo dal suo
 *    comportamento (posti occupati, applausi, mormorii, fischi). Rispetta OPZIONI.pubblico.
 * 2. PREMI LANCIATI: monete, maschere e gli altri raccoglibili che cadono alla morte di un nemico o alla
 *    pulizia della stanza arrivano in volo dai palchetti (arco, ombra a terra, due rimbalzi). In volo
 *    l'oggetto resta in st.oggettiATerra ma «parcheggiato» fuori scena (x, y = PARCHEGGIO_B1): nessuna
 *    raccolta e nessun disegno di base finché non atterra; i conteggi di chi legge la lista non cambiano.
 * 3. SIPARIO: velluto vero al posto del cartellone di testo (i testi di getRaccontoAtto stanno sul velluto).
 *    Chiusura all'avvio di un piano, apertura quando il giocatore lo chiude con un tasto o un click.
 *
 * Nessuna modifica ai file di base: solo avvolgimenti di funzioni globali, che chiamano sempre la base.
 * QA: tools/qa-teatro-pubblico.js. Sonda: window.__teatro.interni.pubblicoB1.
 *
 * DISEGNI: ogni pezzo di scena ha la sua funzione, raccolta in ELEMENTI_B1 (palchi, sagome, telo, mantovana,
 * cartiglio, fiore…). Sono segnaposto a canvas: per passare alle immagini dell'autore si sostituisce la voce
 * di ELEMENTI_B1 e si chiama invalidaTeleB1(), senza toccare il resto.
 * COSTO: gli elementi fermi stanno su tele fuori schermo; il pubblico si compone su quattro tele di zona
 * (ZONE_B1) rifatte solo ogni PUBBLICO_B1.resa.ogniTickFermo tick, o ogniTickVivo dove qualcuno si muove.
 */

// ===========================================================================
// TABELLE (tutti i numeri regolabili stanno qui)
// ===========================================================================
/** Pubblico: gradimento, soglie delle reazioni, premi lanciati, disposizione dei posti. */
const PUBBLICO_B1 = Object.freeze({
  gradimento: Object.freeze({
    inizio: 0.5,              // a inizio run
    riposo: 0.5,              // senza eventi torna piano verso qui...
    ritornoPerSec: 0.003,     // ...di tanto al secondo
    uccisione: 0.012,
    serie: 0.04,              // serie di uccisioni ravvicinate
    stanzaPulita: 0.02,
    stanzaSenzaDanni: 0.05,   // in più, se nella stanza non hai preso colpi
    scampato: 0.05,           // in più, se la ripulisci stando a ½ Maschera
    boss: 0.12,
    bossSenzaDanni: 0.08,
    colpo: -0.07,             // un colpo subito
    colpoRipetuto: -0.04,     // in più, dal secondo colpo dentro colpi.finestraTick
    goffaggine: -0.02,        // in più, se ti fai male da solo (risata)
  }),
  serie: Object.freeze({ uccisioni: 3, finestraTick: 150, pausaTick: 240 }),
  colpi: Object.freeze({ finestraTick: 360, mormorioDa: 2, fischiDa: 3, sogliaFischiFacili: 0.25 }),
  fiato: Object.freeze({
    mezzeMaschere: 1,          // a quante mezze Maschere il pubblico trattiene il fiato
    pausaTick: 480,            // l'«oooh» non si ripete prima
    tensioneStanzaPulita: 0.4, // a stanza vuota resta sporto, ma meno
    rapidita: 0.08,            // quanto in fretta si sporge / si rilassa (per tick)
  }),
  risata: Object.freeze({
    uccisioniStessoTick: 2,    // due nemici che cadono insieme: scena comica
    pausaTick: 360,
    fontiBuffe: Object.freeze(['braciere', 'fiamme', 'bozzo', 'bomba', 'rovi']), // fonti di danno «da ridere»
  }),
  cortesiaDa: 0.6,             // sopra questo gradimento una stanza ripulita (con danni) prende due battimani
  // durata in tick, forza = quota di spettatori che partecipa, priorita: una reazione più debole non interrompe
  reazioni: Object.freeze({
    cortesia: Object.freeze({ tipo: 'applauso', durata: 70, forza: 0.25, priorita: 1, suono: 'applausoPiccolo', voci: 0 }),
    applauso: Object.freeze({ tipo: 'applauso', durata: 110, forza: 0.55, priorita: 2, suono: 'applausoMedio', voci: 1 }),
    applausoPieno: Object.freeze({ tipo: 'applauso', durata: 150, forza: 0.85, priorita: 3, suono: 'applausoMedio', voci: 2, fiori: 4 }),
    ovazione: Object.freeze({ tipo: 'applauso', durata: 300, forza: 1, priorita: 5, suono: 'applausoGrande', voci: 4, fiori: 14, inPiedi: true }),
    sussulto: Object.freeze({ tipo: 'fiato', durata: 90, forza: 1, priorita: 4, suono: 'oooh', voci: 2 }),
    mormorio: Object.freeze({ tipo: 'mormorio', durata: 110, forza: 0.6, priorita: 2, suono: 'mormorio', voci: 1 }),
    fischi: Object.freeze({ tipo: 'fischi', durata: 120, forza: 0.7, priorita: 4, suono: 'fischi', voci: 2 }),
    risata: Object.freeze({ tipo: 'risata', durata: 90, forza: 0.7, priorita: 3, suono: 'risata', voci: 2 }),
  }),
  premi: Object.freeze({
    lanciati: true,
    // solo in queste stanze i drop arrivano dai palchetti; i premi delle stanze speciali restano com'erano
    tipiStanza: Object.freeze(['ingresso', 'normale', 'boss', 'segreta', 'sfida']),
    tipiEsclusi: Object.freeze(['ricordo']),   // raccoglibili di trama: mai lanciati
    variazioneMonete: 0.15,   // il gradimento sposta le monete lanciate di ±15% (0 al gradimento di riposo)
    bonusSenzaDanni: 0.2,     // stanza normale ripulita senza danni: probabilità di 1 moneta in più (passa dal filtro del piano 1)
    posBonus: Object.freeze({ x: 340, y: 178 }),
  }),
  lancio: Object.freeze({
    margineArena: 20,         // come spawnaMonetaATerra
    margineOstacolo: 9,       // distanza minima dal bordo di fosse, colonne, bracieri
    voloTickMin: 26, voloTickMax: 44, tickPerPx: 0.09,
    apicePx: 34,              // altezza dell'arco
    rimbalzi: Object.freeze([Object.freeze({ distPx: 10, altPx: 9, tick: 11 }), Object.freeze({ distPx: 3, altPx: 4, tick: 7 })]),
    scartoTick: 5,            // fra un premio e il successivo dello stesso lancio
    gestoTick: 14,            // durata del gesto del braccio di chi lancia
    maxInVolo: 64,
    // un forziere (A1) pesa: arco più basso, un solo rimbalzo corto
    forziere: Object.freeze({ apicePx: 26, rimbalzi: Object.freeze([Object.freeze({ distPx: 5, altPx: 5, tick: 9 })]) }),
  }),
  fiori: Object.freeze({ max: 30, voloTick: 38, apicePx: 40, vitaTick: 330, dissolvenzaTick: 60, distMin: 26, distMax: 84, scartoTick: 7 }),
  voci: Object.freeze({
    durataTick: 70, salitaPx: 9, max: 6, scartoTick: 9,
    largCarattere: 4.4, largMax: 46, altRiga: 8, aria: 3,  // ingombro stimato del testo (corsivo 7 px): due interiezioni non si sovrappongono mai
    tentativi: 12,                                          // posti provati prima di rinunciare a un'interiezione
    latoX: 25, latoSu: 37,                                  // sopra un palco laterale: centro della colonna, px sopra il davanzale
    plateaSu: Object.freeze([21, 32]),                      // in platea: due righe (px dal bordo basso)
    plateaDaX: 352, plateaMargineDx: 8,                     // in platea mai sopra il dock né sopra la porta sud
  }),
  // la platea lascia libero il dock in basso (consumabile, oggetto attivo, arma, icone degli oggetti): da x = 0 al suo bordo destro
  dock: Object.freeze({ margine: 6, mezzaTesta: 11, bordoMin: 300 }),
  // costo del disegno: ogni zona (balconata, palchi di sinistra, di destra, platea) sta su una tela composta e si rifà solo ogni tanto
  resa: Object.freeze({
    ogniTickFermo: 4,         // pubblico calmo: una zona per tick, a turno
    ogniTickVivo: 2,          // zona in movimento (reazione, lancio, tensione che cambia, chi entra o esce)
    sbalzoLati: 18,           // px oltre il palco laterale: braccia e aloni delle candele
    altoAlt: 58, plateaAlt: 44,
  }),
  posti: Object.freeze({
    sempreQuota: 0.3,         // quota di spettatori che non se ne va mai
    isteresi: 0.04,
    alto: Object.freeze({ centro: 320, passo: 50, davanzale: 41, scala: 0.92, conPubblico: Object.freeze([-1, 0, 1, 3]), chiusi: Object.freeze([-2, 2]) }),
    lati: Object.freeze({ y: 96, larg: 48, altPalco: 68, numero: 3, cornice: 6, davanzale: 51, scala: 1.12, sedie: Object.freeze([15, 31]) }),
    platea: Object.freeze({ y: 372, passo: 23, scala: 1.08 }),
  }),
});

/** Sipario di velluto: tempi e forma del movimento «all'italiana». */
const SIPARIO_B1 = Object.freeze({
  aperturaMs: 950,       // ≤ 1200: non allunga i tempi morti
  chiusuraMs: 520,
  moltSalto: 7,          // un tasto durante l'apertura la finisce di corsa
  graziaSaltoMs: 140,    // il tasto che apre non conta come salto
  finestraGestoMs: 400,  // sipario chiuso da un gesto del giocatore entro tanti ms: si anima; altrimenti sparisce subito
  fasce: 45,             // strisce orizzontali di ogni telo
  ritardoAlto: 0.55,     // quanto la parte alta del telo parte dopo quella bassa
  residuo: 0.16,         // larghezza del telo raccolto (quota di mezzo palco)
  legatura: 0.38,        // altezza (0..1) a cui il telo è legato
  raccolta: 0.55,        // quanto l'orlo sale mentre il telo si raccoglie
  uscitaDa: 0.72,        // da qui il telo raccolto esce di lato
  mantovanaDa: 0.6,      // da qui la mantovana sale via
  testiFinoA: 0.3,       // i testi svaniscono nel primo tratto dell'apertura
  fotoMaxL: 1280,        // larghezza massima della fotografia della scena dietro il sipario che si chiude
  dtMaxMs: 50,           // un frame lento (generazione del piano) non fa saltare l'animazione
  riquadro: Object.freeze({ x: 78, y: 62, w: 484, h: 104 }),   // cartiglio dei testi: copre la cucitura centrale
  invito: Object.freeze({ x: 206, y: 266, w: 228, h: 26 }),
});

/** Suoni procedurali (volumi relativi a AudioSys.uscita). */
const SUONI_B1 = Object.freeze({
  applauso: Object.freeze({
    applausoPiccolo: Object.freeze({ durata: 1.3, mani: 7, seme: 11, volume: 0.1 }),
    applausoMedio: Object.freeze({ durata: 2.4, mani: 22, seme: 23, volume: 0.13 }),
    applausoGrande: Object.freeze({ durata: 4.4, mani: 46, seme: 37, volume: 0.16 }),
  }),
  folla: Object.freeze({ durata: 4, voci: 11, seme: 53, campionamento: 16000 }),
  brusio: Object.freeze({ volume: 0.02, passaBasso: 750, ogniTick: 8 }),
  mormorio: Object.freeze({ volume: 0.11, durata: 1.7 }),
  oooh: Object.freeze({ volume: 0.5, durata: 1.05, attacco: 0.14, voci: 6, fMin: 130, fMax: 330, formanti: Object.freeze([430, 820]), soffocato: 1100 }),
  fischi: Object.freeze({ volume: 0.035, quanti: 3, fMin: 1700, fMax: 2600 }),
  risata: Object.freeze({ volume: 0.4, voci: 4, sillabe: 5, passo: 0.118, formanti: Object.freeze([760, 1180]) }),
  sipario: Object.freeze({ fruscio: 0.06, cigolio: 0.03, carrucola: 0.035, tonfo: 0.26, cigolii: 4 }),
  rimbalzo: Object.freeze({ volume: 0.03, pausaTick: 3 }),
});

/** Testi per il giocatore (interiezioni del pubblico e invito del sipario): da approvare dall'autore. */
const TESTI_B1 = Object.freeze({
  alzaSipario: '▶ ALZA IL SIPARIO [Click / Spazio]',
  voci: Object.freeze({
    applauso: Object.freeze(['Bravo!', 'Bis!', 'Jamme!', 'Evviva!']),
    fiato: Object.freeze(['Oooh…', 'Zitti!', 'Maronn\'!']),
    mormorio: Object.freeze(['Mah…', 'Uffà!', 'Eh…']),
    fischi: Object.freeze(['Fiii!', 'Buuu!']),
    risata: Object.freeze(['Ah ah!', 'Uh uh!']),
  }),
});

/** Colori del teatro (sagome scure, pochi accenti caldi oro e rosso). */
const COLORI_B1 = Object.freeze({
  ombra: '#0b0705', interno: '#060302', legno: '#1a100a', legnoLuce: '#2c1b10', legnoScuro: '#110a06',
  oro: '#c9952e', oroLuce: '#f9cb40', oroScuro: '#7c5a1e', crema: '#f3dfc1',
  velluto: [92, 17, 11], vellutoLuce: [146, 33, 22], vellutoOmbra: [40, 6, 5],
  vellutoPieno: '#5c110b', vellutoChiaro: '#8a1e14', vellutoBuio: '#2a0605',
  contorno: 'rgba(214, 158, 60, 0.42)', occhi: 'rgba(249, 203, 64, 0.92)',
});

const PARCHEGGIO_B1 = -9999; // x, y di un premio in volo: fuori dalla portata di raccolta e dal disegno di base

// ===========================================================================
// STATO
// ===========================================================================
const pubblicoB1 = {
  gradimento: PUBBLICO_B1.gradimento.inizio,
  bloccato: false,     // QA: gradimento fisso
  run: -1,
  stanza: null,
  morti: new WeakSet(),
  noti: new WeakSet(), // raccoglibili già visti (non da lanciare)
  profLancio: 0,
  inBonus: false,
  colpiStanza: 0,
  colpi: [],           // tick dei colpi recenti
  uccisioni: [],       // tick delle uccisioni recenti
  ultimaSerie: -1e9, ultimoSussulto: -1e9, ultimaRisata: -1e9, ultimoRimbalzo: -1e9,
  tensione: 0,
  umore: { nome: 'calmo', tipo: 'calmo', t: 0, durata: 0, forza: 0, priorita: 0, inPiedi: false },
  voli: [],            // { st, pk }
  fiori: [],
  voci: [],
  conti: { lanciati: 0, atterrati: 0, regalate: 0, trattenute: 0, bonus: 0, disegni: 0, ridisegni: 0 },
};

const siparioB1 = {
  stato: 'aperto',     // 'aperto' | 'chiusura' | 'chiuso' | 'apertura'
  k: 1,                // 0 = chiuso, 1 = aperto
  dt: 16, visto: false, info: null, veloce: false,
  gestoMs: -1e9, inizioMs: 0,
  foto: null, fotoValida: false,
  fermo: null,         // QA: sipario bloccato a questa apertura (0..1)
  fermoChiudendo: false, // QA: bloccato come in chiusura (con la scena di prima dietro)
};

/** Generatore separato (non tocca rng() del gioco: le regole di base restano identiche). */
function generatoreB1(seme) {
  let s = seme | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rndB1 = generatoreB1(0xB1);
const limitaB1 = (v, a, b) => Math.max(a, Math.min(b, v));
const liscioB1 = (x) => { const t = limitaB1(x, 0, 1); return t * t * (3 - 2 * t); };

// ===========================================================================
// GRADIMENTO E REAZIONI
// ===========================================================================
/** Gradimento del pubblico, 0..1 (PUBBLICO_B1.gradimento.riposo = neutro). */
function gradimentoPubblico() {
  return pubblicoB1.gradimento;
}

/** Sposta il gradimento di `delta` (resta in 0..1). Ritorna il nuovo valore. */
function spostaGradimentoB1(delta) {
  if (!pubblicoB1.bloccato && Number.isFinite(delta)) pubblicoB1.gradimento = limitaB1(pubblicoB1.gradimento + delta, 0, 1);
  return pubblicoB1.gradimento;
}

/** QA / sviluppo: imposta il gradimento; con `blocca` resta fisso finché non si richiama con blocca = false. */
function impostaGradimentoB1(v, blocca = false) {
  pubblicoB1.gradimento = limitaB1(Number(v) || 0, 0, 1);
  pubblicoB1.bloccato = Boolean(blocca);
  return pubblicoB1.gradimento;
}

/** Quanto il gradimento sposta le monete lanciate: da -variazioneMonete a +variazioneMonete. */
function variazioneMoneteB1() {
  const G = PUBBLICO_B1.gradimento, V = PUBBLICO_B1.premi.variazioneMonete;
  const g = pubblicoB1.gradimento;
  const k = g >= G.riposo ? (g - G.riposo) / Math.max(1e-6, 1 - G.riposo) : (g - G.riposo) / Math.max(1e-6, G.riposo);
  return limitaB1(k, -1, 1) * V;
}

/**
 * Fa reagire il pubblico: 'cortesia' | 'applauso' | 'applausoPieno' | 'ovazione' | 'sussulto' | 'mormorio' |
 * 'fischi' | 'risata' (PUBBLICO_B1.reazioni). Una reazione più debole non interrompe una più forte in corso.
 * @returns {boolean} true se la reazione è partita
 */
function reazionePubblicoB1(nome) {
  const R = PUBBLICO_B1.reazioni[nome];
  if (!R) return false;
  const U = pubblicoB1.umore;
  if (U.t > 12 && U.priorita > R.priorita) return false;
  U.nome = nome; U.tipo = R.tipo; U.t = R.durata; U.durata = R.durata; U.forza = R.forza; U.priorita = R.priorita;
  U.inPiedi = Boolean(R.inPiedi);
  pubblicoB1.conti[nome] = (pubblicoB1.conti[nome] || 0) + 1;
  if (OPZIONI.pubblico) {
    suonoPubblicoB1(R.suono);
    for (let i = 0; i < (R.voci || 0); i++) aggiungiVoceB1(R.tipo, i);
    if (R.fiori) lanciaFioriB1(R.fiori);
  }
  return true;
}

function fonteBuffaB1(fonte) {
  const f = String(fonte || '').toLowerCase();
  return PUBBLICO_B1.risata.fontiBuffe.some((x) => f.includes(x));
}

/** Il giocatore ha subito un colpo (chiamata dall'avvolgimento di subisciColpoGiocatore). */
function colpoSubitoB1(hpPrima, fonte) {
  const P = pubblicoB1, G = PUBBLICO_B1.gradimento, C = PUBBLICO_B1.colpi, F = PUBBLICO_B1.fiato;
  P.colpiStanza++;
  P.colpi.push(tick);
  while (P.colpi.length && tick - P.colpi[0] > C.finestraTick) P.colpi.shift();
  const n = P.colpi.length;
  spostaGradimentoB1(G.colpo + (n >= 2 ? G.colpoRipetuto : 0));
  const caduto = statoRun.hpHalf <= 0 || statoRun.fase !== 'in_gioco';
  const aMezza = statoRun.maxHpHalf > F.mezzeMaschere && statoRun.hpHalf <= F.mezzeMaschere && hpPrima > F.mezzeMaschere;
  if (caduto || aMezza) {
    if (caduto || tick - P.ultimoSussulto > F.pausaTick) { P.ultimoSussulto = tick; reazionePubblicoB1('sussulto'); }
    return;
  }
  if (fonteBuffaB1(fonte) && tick - P.ultimaRisata > PUBBLICO_B1.risata.pausaTick) {
    P.ultimaRisata = tick;
    spostaGradimentoB1(G.goffaggine);
    reazionePubblicoB1('risata');
    return;
  }
  if (n >= C.fischiDa || (n >= C.mormorioDa && P.gradimento < C.sogliaFischiFacili)) reazionePubblicoB1('fischi');
  else if (n >= C.mormorioDa) reazionePubblicoB1('mormorio');
}

/** Nemici caduti in questo tick (contati dal passo, comunque siano morti). */
function uccisioniB1(quanti, boss) {
  const P = pubblicoB1, G = PUBBLICO_B1.gradimento, S = PUBBLICO_B1.serie, R = PUBBLICO_B1.risata;
  spostaGradimentoB1(G.uccisione * quanti);
  if (boss) {
    spostaGradimentoB1(G.boss + (P.colpiStanza === 0 ? G.bossSenzaDanni : 0));
    reazionePubblicoB1('ovazione');
    P.uccisioni.length = 0;
    return;
  }
  for (let i = 0; i < quanti; i++) P.uccisioni.push(tick);
  while (P.uccisioni.length && tick - P.uccisioni[0] > S.finestraTick) P.uccisioni.shift();
  if (P.uccisioni.length >= S.uccisioni && tick - P.ultimaSerie > S.pausaTick) {
    P.ultimaSerie = tick;
    P.uccisioni.length = 0;
    spostaGradimentoB1(G.serie);
    reazionePubblicoB1('applauso');
  } else if (quanti >= R.uccisioniStessoTick && tick - P.ultimaRisata > R.pausaTick) {
    P.ultimaRisata = tick;
    reazionePubblicoB1('risata');
  }
}

/** La stanza è appena stata ripulita (chiamata dall'avvolgimento di verificaStanzaPulita). */
function stanzaPulitaB1(st) {
  const P = pubblicoB1, G = PUBBLICO_B1.gradimento, T = PUBBLICO_B1.premi, F = PUBBLICO_B1.fiato;
  if (!st || st !== statoRun.stanzaCorrente || statoRun.fase !== 'in_gioco') return;
  if (st.tipo === 'boss') return; // l'ovazione parte quando cade il boss
  spostaGradimentoB1(G.stanzaPulita);
  const senzaDanni = P.colpiStanza === 0;
  const aMezza = statoRun.maxHpHalf > F.mezzeMaschere && statoRun.hpHalf <= F.mezzeMaschere;
  if (senzaDanni) {
    spostaGradimentoB1(G.stanzaSenzaDanni);
    reazionePubblicoB1('applausoPieno');
    if (T.lanciati && st.tipo === 'normale' && rndB1() < T.bonusSenzaDanni) {
      P.inBonus = true;
      try { spawnaMonetaATerra(st, T.posBonus.x, T.posBonus.y, 1); P.conti.bonus++; } finally { P.inBonus = false; }
    }
  } else if (aMezza) {
    spostaGradimentoB1(G.scampato);
    reazionePubblicoB1('applauso');
  } else if (P.gradimento >= PUBBLICO_B1.cortesiaDa) {
    reazionePubblicoB1('cortesia');
  }
}

function azzeraPubblicoB1() {
  const P = pubblicoB1;
  P.run = statoRun.numeroRun;
  if (!P.bloccato) P.gradimento = PUBBLICO_B1.gradimento.inizio;
  P.colpi.length = 0; P.uccisioni.length = 0; P.colpiStanza = 0;
  P.ultimaSerie = P.ultimoSussulto = P.ultimaRisata = -1e9;
  P.tensione = 0; P.umore.t = 0; P.umore.tipo = 'calmo'; P.umore.nome = 'calmo'; P.umore.priorita = 0;
  rndB1 = generatoreB1(0xB1 ^ Math.imul(statoRun.numeroRun | 0, 2654435761));
  for (const s of postiB1) if (sottoIlDockB1(s)) { s.dentro = false; s.presenza = 0; } // nessuna testa da far svanire sotto il dock
}

/**
 * Bordo destro (px logici) del dock in basso: slot del consumabile, oggetto attivo, arma e icone degli oggetti
 * (stessa formula di disegnaIconeOggettiB in 60-resa.js: cresce con gli oggetti raccolti).
 */
function bordoDockB1() {
  const D = PUBBLICO_B1.dock;
  let x = D.bordoMin;
  if (typeof OGGETTI_B !== 'undefined' && OGGETTI_B && OGGETTI_B.hud) {
    const Hd = OGGETTI_B.hud, n = statoRun.oggettiEquipaggiati ? statoRun.oggettiEquipaggiati.length : 0;
    const perRiga = Math.max(1, Math.ceil(n / Hd.righe));
    const passo = Math.min(Hd.passo, perRiga > 1 ? (Hd.xMax - Hd.xMin - Hd.lato) / (perRiga - 1) : Hd.passo);
    x = Hd.xMin + 3 + Math.min(Hd.xMax - Hd.xMin, (Math.min(n, perRiga) - 1) * passo + Hd.lato) + (n ? 0 : 40);
  }
  return x;
}

/** Questo posto di platea finirebbe sotto il dock? */
function sottoIlDockB1(s) {
  const D = PUBBLICO_B1.dock;
  return s.zona === 'platea' && s.x - D.mezzaTesta < bordoDockB1() + D.margine;
}

function cambioStanzaB1(st) {
  const P = pubblicoB1;
  atterraTuttoB1();
  P.stanza = st;
  P.colpiStanza = 0;
  P.uccisioni.length = 0;
  P.fiori.length = 0; P.voci.length = 0;
  for (const n of st.nemici || []) if (n.hp <= 0) P.morti.add(n);
  for (const pk of st.oggettiATerra || []) P.noti.add(pk);
  for (const f of st.forzieriA1 || []) P.noti.add(f);
}

/**
 * Un premio sta per cadere in una stanza in cui si è appena entrati, prima che sia passato un tick: il
 * pubblico la «vede» subito, così il cambio di stanza del tick dopo non fa atterrare di colpo i premi in volo.
 */
function allineaStanzaB1(st) {
  if (st && st !== pubblicoB1.stanza && st === statoRun.stanzaCorrente && statoRun.fase === 'in_gioco') cambioStanzaB1(st);
}

/** Un tick del pubblico (dopo il passo di base): cadute, tensione, umore, voli. */
function aggiornaPubblicoB1() {
  const P = pubblicoB1;
  if (tick % SUONI_B1.brusio.ogniTick === 0) aggiornaBrusioB1();
  if (statoRun.fase !== 'in_gioco') { if (P.voli.length) atterraTuttoB1(); P.stanza = null; return; }
  const st = statoRun.stanzaCorrente;
  if (!st) return;
  if (P.run !== statoRun.numeroRun) azzeraPubblicoB1();
  if (st !== P.stanza) cambioStanzaB1(st);
  if (statoRun.pausa || statoRun.siparioAttivo) return;

  let caduti = 0, boss = false, vivi = 0;
  for (const n of st.nemici || []) {
    if (n.hp > 0) { vivi++; continue; }
    if (P.morti.has(n)) continue;
    P.morti.add(n); caduti++;
    if (n.boss) boss = true;
  }
  if (caduti > 0) uccisioniB1(caduti, boss);

  const F = PUBBLICO_B1.fiato, G = PUBBLICO_B1.gradimento;
  const aMezza = statoRun.maxHpHalf > F.mezzeMaschere && statoRun.hpHalf <= F.mezzeMaschere && statoRun.hpHalf > 0;
  const bersaglio = aMezza ? (vivi > 0 ? 1 : F.tensioneStanzaPulita) : 0;
  P.tensione += (bersaglio - P.tensione) * F.rapidita;
  if (P.tensione < 0.002) P.tensione = 0;

  if (P.umore.t > 0 && --P.umore.t <= 0) { P.umore.tipo = 'calmo'; P.umore.nome = 'calmo'; P.umore.priorita = 0; }
  if (!P.bloccato && P.gradimento !== G.riposo) {
    const passo = G.ritornoPerSec / FEEL.passo.hz, d = G.riposo - P.gradimento;
    P.gradimento += Math.abs(d) <= passo ? d : Math.sign(d) * passo;
  }

  const I = PUBBLICO_B1.posti.isteresi, D = PUBBLICO_B1.dock, bordo = bordoDockB1() + D.margine;
  for (const s of postiB1) {
    const coperto = s.zona === 'platea' && s.x - D.mezzaTesta < bordo; // la platea lascia libero il dock
    s.dentro = !coperto && (s.dentro ? P.gradimento >= s.soglia - I : P.gradimento >= s.soglia + I);
    s.presenza += ((s.dentro ? 1 : 0) - s.presenza) * 0.04;
    if (s.lancioT > 0) s.lancioT--;
  }
  aggiornaVoliB1(st);
  for (let i = P.fiori.length - 1; i >= 0; i--) { const f = P.fiori[i]; if (++f.t > f.durata + PUBBLICO_B1.fiori.vitaTick) P.fiori.splice(i, 1); }
  for (let i = P.voci.length - 1; i >= 0; i--) { const v = P.voci[i]; if (++v.t > PUBBLICO_B1.voci.durataTick) P.voci.splice(i, 1); }
}

// ===========================================================================
// PREMI LANCIATI DAI PALCHETTI
// ===========================================================================
/** In questa stanza i drop arrivano dai palchetti? */
function premiLanciatiQuiB1(st) {
  const T = PUBBLICO_B1.premi;
  return Boolean(T.lanciati && st && st === statoRun.stanzaCorrente && statoRun.fase === 'in_gioco'
    && Array.isArray(st.oggettiATerra) && T.tipiStanza.includes(st.tipo));
}

/** (x, y) è dentro un buco, un ostacolo, un forziere, il piedistallo, la botola o la porta del patto? */
function postoOccupatoB1(st, x, y) {
  const M = PUBBLICO_B1.lancio.margineOstacolo;
  for (const o of st.ostacoli || []) {
    if (o.tipo === 'fossa') {
      if (Math.abs(x - o.x) < (o.w || 34) / 2 + M && Math.abs(y - o.y) < (o.h || 22) / 2 + M) return true;
    } else if (Math.hypot(x - o.x, y - o.y) < (o.r || 12) + M) return true;
  }
  for (const f of st.forzieriA1 || []) if (Math.hypot(x - f.x, y - f.y) < 16) return true;
  const ped = st.oggettoPiedistallo;
  if (ped && !ped.preso && Math.hypot(x - ped.x, y - ped.y) < 18) return true;
  if (st.tipo === 'boss') {
    if (Math.abs(x - 320) < 18 + M && Math.abs(y - 190) < 16 + M) return true;                       // botola
    if (st.portaPattoAperta && Math.abs(x - 446) < 24 + M && Math.abs(y - 188) < 20 + M) return true; // porta del patto
  }
  return false;
}

/**
 * Il punto libero più vicino a (x, y): dentro l'arena (margine PUBBLICO_B1.lancio.margineArena) e fuori da
 * buchi e ostacoli. Deterministico.
 * @returns {{x: number, y: number}}
 */
function postoLiberoB1(st, x, y) {
  const m = PUBBLICO_B1.lancio.margineArena;
  const px = limitaB1(Number.isFinite(x) ? x : 320, ARENA.x1 + m, ARENA.x2 - m);
  const py = limitaB1(Number.isFinite(y) ? y : 188, ARENA.y1 + m, ARENA.y2 - m);
  if (!st || !postoOccupatoB1(st, px, py)) return { x: px, y: py };
  for (let r = 8; r <= 160; r += 8) {
    for (let k = 0; k < 12; k++) {
      const a = (TAU * k) / 12 + r * 0.11;
      const cx = limitaB1(px + Math.cos(a) * r, ARENA.x1 + m, ARENA.x2 - m);
      const cy = limitaB1(py + Math.sin(a) * r * 0.8, ARENA.y1 + m, ARENA.y2 - m);
      if (!postoOccupatoB1(st, cx, cy)) return { x: cx, y: cy };
    }
  }
  return { x: px, y: py };
}

/** Sceglie chi lancia (uno spettatore presente, di preferenza in alto) e torna il punto di partenza. */
function lanciatoreB1(tx) {
  let scelto = null, migliore = Infinity;
  if (OPZIONI.pubblico) {
    for (const s of postiB1) {
      if (s.zona === 'platea' || s.presenza < 0.6) continue;
      const peso = Math.abs(s.x - tx) * (s.zona === 'alto' ? 1 : 1.7) + rndB1() * 140 + (s.lancioT > 0 ? 80 : 0);
      if (peso < migliore) { migliore = peso; scelto = s; }
    }
  }
  if (scelto) {
    scelto.lancioT = PUBBLICO_B1.lancio.gestoTick;
    return { x: scelto.x + scelto.dir * 6, y: scelto.y - 16 * scelto.scala };
  }
  return { x: limitaB1(tx + (rndB1() - 0.5) * 120, 190, 500), y: 30 };
}

/**
 * Lancia dai palchetti un raccoglibile già presente in st.oggettiATerra, oppure un forziere di A1 già in
 * st.forzieriA1: vola, rimbalza e si ferma dove stava (spostato solo se era dentro un buco o un ostacolo).
 * In volo non si raccoglie e non si apre.
 * Le altre squadre possono chiamarla per i loro premi; per escluderne uno: pk.nonLanciareB1 = true.
 * @param {object} st stanza @param {object} pk raccoglibile o forziere @param {number} [ordine] posizione nel lancio (scarto di tempo)
 * @returns {boolean} true se è partito
 */
function lanciaPremioB1(st, pk, ordine = 0) {
  const P = pubblicoB1;
  if (!st || !pk || pk.voloB1 || pk.nonLanciareB1 || pk.bloccoA2) return false;
  if (PUBBLICO_B1.premi.tipiEsclusi.includes(pk.tipo) || !Number.isFinite(pk.x) || !Number.isFinite(pk.y)) return false;
  const forziere = Array.isArray(st.forzieriA1) && st.forzieriA1.includes(pk);
  if (forziere && pk.aperto) return false;
  const L = forziere ? { ...PUBBLICO_B1.lancio, ...PUBBLICO_B1.lancio.forziere } : PUBBLICO_B1.lancio;
  const ox = pk.x, oy = pk.y;
  pk.x = PARCHEGGIO_B1; pk.y = PARCHEGGIO_B1; // prima di cercare il posto: un forziere non deve scansare sé stesso
  const dest = postoLiberoB1(st, ox, oy);
  const da = lanciatoreB1(dest.x);
  const dx = dest.x - da.x, dy = dest.y - da.y, dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist, uy = dy / dist;
  const seg = [];
  let ax = da.x, ay = da.y;
  const punti = L.rimbalzi.map((r) => {
    const p = { x: dest.x - ux * r.distPx, y: dest.y - uy * r.distPx };
    return postoOccupatoB1(st, p.x, p.y) || p.y < ARENA.y1 + 6 ? { x: dest.x, y: dest.y } : p;
  });
  punti.push({ x: dest.x, y: dest.y });
  const durate = [Math.round(limitaB1(L.voloTickMin + dist * L.tickPerPx, L.voloTickMin, L.voloTickMax))].concat(L.rimbalzi.map((r) => r.tick));
  const alte = [L.apicePx].concat(L.rimbalzi.map((r) => r.altPx));
  for (let i = 0; i < punti.length; i++) {
    seg.push({ ax, ay, bx: punti[i].x, by: punti[i].y, alt: alte[i], durata: durate[i] });
    ax = punti[i].x; ay = punti[i].y;
  }
  pk.voloB1 = { tx: dest.x, ty: dest.y, t: -Math.max(0, ordine) * L.scartoTick, fase: 0, seg, giro: rndB1() * TAU };
  P.noti.add(pk);
  P.voli.push({ st, pk, forziere });
  P.conti.lanciati++;
  while (P.voli.length > L.maxInVolo) atterraPremioB1(P.voli.shift().pk);
  return true;
}

function atterraPremioB1(pk) {
  const V = pk && pk.voloB1;
  if (!V) return;
  pk.x = V.tx; pk.y = V.ty;
  delete pk.voloB1;
  pubblicoB1.conti.atterrati++;
}

function atterraTuttoB1() {
  const P = pubblicoB1;
  for (const v of P.voli) atterraPremioB1(v.pk);
  P.voli.length = 0;
}

function aggiornaVoliB1(st) {
  const P = pubblicoB1;
  for (let i = P.voli.length - 1; i >= 0; i--) {
    const v = P.voli[i], pk = v.pk, V = pk.voloB1;
    const lista = v.forziere ? st.forzieriA1 : st.oggettiATerra;
    if (!V || v.st !== st || !lista || !lista.includes(pk) || (v.forziere && pk.aperto)) {
      atterraPremioB1(pk); P.voli.splice(i, 1); continue;
    }
    if (++V.t < 0) continue;
    if (V.t < V.seg[V.fase].durata) continue;
    V.fase++; V.t = 0;
    if (tick - P.ultimoRimbalzo >= SUONI_B1.rimbalzo.pausaTick) {
      P.ultimoRimbalzo = tick;
      suonoRimbalzoB1(pk.tipo === 'moneta', V.fase);
    }
    if (V.fase >= V.seg.length) { atterraPremioB1(pk); P.voli.splice(i, 1); }
  }
}

/** Dopo una funzione di base che può far cadere premi: lancia i raccoglibili nuovi della stanza. */
function lanciaNuoviB1(st, daIndice = 0) {
  const P = pubblicoB1;
  const lista = st && st.oggettiATerra;
  if (!Array.isArray(lista)) return;
  const qui = premiLanciatiQuiB1(st);
  let ordine = 0;
  for (let i = daIndice; i < lista.length; i++) {
    const pk = lista[i];
    if (!pk || P.noti.has(pk)) continue;
    P.noti.add(pk);
    if (qui && lanciaPremioB1(st, pk, ordine)) ordine++;
  }
  for (const f of st.forzieriA1 || []) { // forzieri di A1 comparsi alla pulizia: arrivano in volo anche loro
    if (!f || P.noti.has(f)) continue;
    P.noti.add(f);
    if (qui && lanciaPremioB1(st, f, ordine)) ordine++;
  }
}

/** Avvolge una funzione di base che può far cadere premi (morte di un nemico, pulizia della stanza). */
function conLancioB1(base, dopo) {
  return function (...args) {
    const P = pubblicoB1;
    const st = statoRun.stanzaCorrente;
    const lista = st && st.oggettiATerra;
    if (P.profLancio === 0 && Array.isArray(lista)) {
      allineaStanzaB1(st);
      for (const pk of lista) P.noti.add(pk);
      for (const f of st.forzieriA1 || []) P.noti.add(f);
    }
    P.profLancio++;
    try {
      return base.apply(this, args);
    } finally {
      P.profLancio--;
      try { if (dopo) dopo(st); } catch (err) { console.error('[B1] premi', err); }
      try { lanciaNuoviB1(st); } catch (err) { console.error('[B1] lancio', err); }
    }
  };
}

/** Dopo spawnaMonetaATerra: il gradimento sposta di poco la quantità; fuori dagli avvolgimenti la lancia subito. */
function dopoMonetaB1(st, n0) {
  const P = pubblicoB1;
  const lista = st && st.oggettiATerra;
  if (!Array.isArray(lista) || lista.length <= n0 || !premiLanciatiQuiB1(st)) return;
  if (!P.inBonus) {
    const m = variazioneMoneteB1();
    if (m < 0 && rndB1() < -m) { lista.length = n0; P.conti.trattenute++; return; } // il pubblico freddo se la tiene in tasca
    if (m > 0 && rndB1() < m) {
      const pk = lista[lista.length - 1], mg = PUBBLICO_B1.lancio.margineArena;
      lista.push({
        tipo: 'moneta', valore: 1, sprite: 'moneta1',
        x: limitaB1(pk.x + (rndB1() - 0.5) * 30, ARENA.x1 + mg, ARENA.x2 - mg),
        y: limitaB1(pk.y + (rndB1() - 0.5) * 24, ARENA.y1 + mg, ARENA.y2 - mg),
      });
      P.conti.regalate++;
    }
  }
  if (P.profLancio === 0) lanciaNuoviB1(st, n0);
}

// ===========================================================================
// POSTI E SAGOME DEGLI SPETTATORI
// ===========================================================================
const postiB1 = [];
(function creaPostiB1() {
  const T = PUBBLICO_B1.posti, r = generatoreB1(1845);
  const nuovo = (zona, x, y, dir, scala, tipo) => {
    const h = r();
    postiB1.push({
      zona, x, y, dir, scala, tipo, indice: postiB1.length,
      soglia: h < T.sempreQuota ? -1 : 0.08 + ((h - T.sempreQuota) / (1 - T.sempreQuota)) * 0.82,
      estro: r(), fase: r(), battito: 170 + Math.floor(r() * 220),
      presenza: 1, dentro: true, lancioT: 0,
    });
  };
  const A = T.alto;
  const tipiAlto = ['cilindro', 'piuma', 'ventaglio', 'ufficiale', 'binocolo', 'ventaglio', 'popolana', 'bambino'];
  A.conPubblico.forEach((k, i) => {
    const cx = A.centro + k * A.passo;
    nuovo('alto', cx - 10, A.davanzale, 0, A.scala, tipiAlto[(i * 2) % tipiAlto.length]);
    nuovo('alto', cx + 10, A.davanzale, 0, A.scala, tipiAlto[(i * 2 + 1) % tipiAlto.length]);
  });
  const L = T.lati;
  const tipiLati = [['binocolo', 'ventaglio'], ['cilindro', 'piuma'], ['popolana', 'ufficiale'], ['ventaglio', 'cilindro'], ['ufficiale', 'piuma'], ['bambino', 'binocolo']];
  for (let i = 0; i < L.numero; i++) {
    const y = L.y + L.cornice + i * L.altPalco + L.davanzale;
    nuovo('sx', L.sedie[0], y, 1, L.scala * 0.94, tipiLati[i][0]);
    nuovo('sx', L.sedie[1], y, 1, L.scala, tipiLati[i][1]);
    nuovo('dx', W - L.sedie[0], y, -1, L.scala * 0.94, tipiLati[i + 3][0]);
    nuovo('dx', W - L.sedie[1], y, -1, L.scala, tipiLati[i + 3][1]);
  }
  const Pl = T.platea;
  const tipiPlatea = ['retroCilindro', 'retroDama', 'retroNudo', 'retroDama', 'retroBicorno', 'retroNudo', 'retroCilindro'];
  for (let x = 10, i = 0; x < W; x += Pl.passo, i++) {
    nuovo('platea', x + (r() - 0.5) * 7, Pl.y + (i % 2) * 2.5 + r() * 1.5, 0, Pl.scala * (0.94 + r() * 0.14), tipiPlatea[Math.floor(r() * tipiPlatea.length)]);
  }
})();

/** Pezzi (Path2D) di una sagoma a mezzo busto: origine sul davanzale, sguardo verso +x (o frontale). */
function sagomaSpettatoreB1(tipo, frontale) {
  const pezzi = [], accenti = [];
  const hx = frontale ? 0 : 0.8;
  let cy = -15.5, occhi = true;
  const pezzo = (f) => { const p = new Path2D(); f(p); pezzi.push(p); return p; };
  const accento = (colore, f) => { const p = new Path2D(); f(p); accenti.push([p, colore]); };
  const spalle = (l, h) => pezzo((p) => { p.moveTo(-l, 1.5); p.quadraticCurveTo(-l, -h, -2.2, -h - 1); p.lineTo(2.2, -h - 1); p.quadraticCurveTo(l, -h, l, 1.5); p.closePath(); });
  const testa = (rx, ry) => {
    pezzo((p) => p.ellipse(hx, cy, rx, ry, 0, 0, TAU));
    pezzo((p) => p.rect(hx - 1.6, cy + ry - 1, 3.2, 3.4));
    if (!frontale) pezzo((p) => { p.moveTo(hx + rx - 0.6, cy - 1.4); p.lineTo(hx + rx + 1.5, cy + 0.4); p.lineTo(hx + rx - 0.6, cy + 1.3); p.closePath(); });
  };
  const sbuffi = () => { pezzo((p) => p.arc(-6.6, -5.4, 3.2, 0, TAU)); pezzo((p) => p.arc(6.6, -5.4, 3.2, 0, TAU)); };
  const cilindro = () => {
    pezzo((p) => p.rect(hx - 6, cy - 5.4, 12, 1.7));
    pezzo((p) => { p.moveTo(hx - 3.9, cy - 5.2); p.lineTo(hx - 4.4, cy - 13.4); p.lineTo(hx + 4.4, cy - 13.4); p.lineTo(hx + 3.9, cy - 5.2); p.closePath(); });
    accento(COLORI_B1.oroScuro, (p) => p.rect(hx - 4, cy - 7.2, 8, 1.1));
  };
  const bicorno = () => {
    pezzo((p) => { p.moveTo(hx - 8.8, cy - 3.4); p.quadraticCurveTo(hx, cy - 15, hx + 8.8, cy - 3.4); p.quadraticCurveTo(hx, cy - 7, hx - 8.8, cy - 3.4); p.closePath(); });
    accento(COLORI_B1.oro, (p) => p.arc(hx, cy - 7.6, 1, 0, TAU));
  };
  const piuma = (bx, by) => accento(COLORI_B1.vellutoChiaro, (p) => { p.moveTo(bx + 1, by); p.quadraticCurveTo(bx - 3, by - 10.5, bx - 9.5, by - 7); p.quadraticCurveTo(bx - 4, by - 6.4, bx - 1, by + 0.6); p.closePath(); });
  switch (tipo) {
    case 'cilindro': spalle(8.6, 9.5); testa(4.2, 4.8); cilindro(); break;
    case 'ventaglio':
      spalle(7, 8.5); sbuffi(); cy = -15; testa(4, 4.6);
      pezzo((p) => p.arc(frontale ? 0 : hx - 3, cy - 5.1, 2.8, 0, TAU));
      accento(COLORI_B1.oroLuce, (p) => p.arc(frontale ? -4.1 : hx - 0.6, cy + 2.6, 0.75, 0, TAU));
      break;
    case 'binocolo':
      spalle(8.6, 9.5); testa(4.2, 4.8);
      pezzo((p) => p.ellipse(hx - 0.8, cy - 4.2, 3.9, 1.9, 0, 0, TAU));
      break;
    case 'piuma':
      spalle(7, 8.5); sbuffi(); cy = -15; testa(4, 4.6);
      pezzo((p) => p.ellipse(hx, cy - 4.6, 4.8, 1.9, 0, 0, TAU));
      piuma(hx, cy - 5.8);
      break;
    case 'ufficiale':
      spalle(9.2, 9.5); testa(4.2, 4.8); bicorno();
      accento(COLORI_B1.oro, (p) => { p.rect(-9.6, -9.4, 3.8, 1.6); p.rect(5.8, -9.4, 3.8, 1.6); });
      break;
    case 'popolana':
      pezzo((p) => { p.moveTo(hx - 5.2, cy + 0.5); p.quadraticCurveTo(hx, cy - 8.6, hx + 5.2, cy + 0.5); p.lineTo(8.6, 1.5); p.lineTo(-8.6, 1.5); p.closePath(); });
      testa(3.9, 4.5);
      break;
    case 'bambino':
      cy = -5.6;
      pezzo((p) => p.ellipse(0, cy, 3.9, 4.1, 0, 0, TAU));
      pezzo((p) => { p.moveTo(-4.4, cy - 1.6); p.quadraticCurveTo(0, cy - 7.6, 4.4, cy - 1.6); p.closePath(); });
      pezzo((p) => p.rect(frontale ? -4.4 : 1, cy - 2.4, frontale ? 8.8 : 5.4, 1.2));
      accento(COLORI_B1.crema, (p) => { p.arc(-5.6, -0.4, 1.4, 0, TAU); p.moveTo(7, -0.4); p.arc(5.6, -0.4, 1.4, 0, TAU); });
      break;
    case 'retroCilindro': occhi = false; spalle(9.6, 9.5); testa(4.6, 5); cilindro(); break;
    case 'retroDama':
      occhi = false; spalle(7.6, 8.5); sbuffi(); testa(4.3, 4.8);
      pezzo((p) => p.arc(0, cy - 5.6, 3.1, 0, TAU));
      piuma(1.5, cy - 7.4);
      break;
    case 'retroBicorno': occhi = false; spalle(9.6, 9.5); testa(4.4, 4.9); bicorno(); break;
    default: occhi = false; spalle(9, 9.5); testa(4.6, 5); break; // retroNudo
  }
  const retro = tipo.startsWith('retro');
  return {
    pezzi, accenti, hx: retro ? 0 : hx, cy,
    occhi: !occhi ? null : frontale || tipo === 'bambino' ? [[-1.7, cy - 0.5], [1.7, cy - 0.5]] : [[hx + 1.1, cy - 0.6], [hx + 3.3, cy - 0.6]],
  };
}

// ===========================================================================
// TELE IN CACHE (alla risoluzione del buffer, rifatte se cambia scalaBase)
// ===========================================================================
const teleB1 = new Map();
let scalaTeleB1 = 0;

/** Tela fuori schermo di w×h px logici, disegnata una volta da `disegna(x, w, h)` in coordinate logiche. */
function telaB1(nome, w, h, disegna, molt = 1) {
  if (scalaTeleB1 !== scalaBase) { teleB1.clear(); scalaTeleB1 = scalaBase; }
  let c = teleB1.get(nome);
  if (!c) {
    const s = scalaBase * molt;
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * s)); c.height = Math.max(1, Math.ceil(h * s));
    const x = c.getContext('2d');
    x.setTransform(s, 0, 0, s, 0, 0);
    disegna(x, w, h);
    teleB1.set(nome, c);
  }
  return c;
}

/** Butta le tele in cache e le zone composte (da chiamare dopo aver sostituito una voce di ELEMENTI_B1). */
function invalidaTeleB1() {
  teleB1.clear();
  for (const z of ZONE_B1) z.scala = 0;
}

/**
 * ELEMENTI DI SCENA: una funzione di disegno per elemento, sulla tela `x` in px logici con l'origine in alto a
 * sinistra dell'elemento (lo spettatore ha l'origine sul davanzale; il fiore si disegna sul canvas del gioco).
 * Oggetto volutamente non congelato: chi collega le immagini vere sostituisce la voce, per esempio
 *   ELEMENTI_B1.teloSipario = (x, w, h) => x.drawImage(immagine, 0, 0, w, h); invalidaTeleB1();
 */
const ELEMENTI_B1 = {
  balconataFondo: disegnaBalconataFondoB1,       // (x, w, h) 640×54: parete e interno dei palchi in alto
  balconataFronte: disegnaBalconataFronteB1,     // (x, w, h) 640×58: drappi, davanzali, colonnine, candele
  palcoLatoFondo: disegnaPalcoLatoFondoB1,       // (x, w, h) 48×216: colonna di sinistra (a destra si specchia)
  palcoLatoFronte: disegnaPalcoLatoFronteB1,     // (x, w, h) 48×216
  spettatore: disegnaSagomaSpettatoreB1,         // (x, tipo, frontale) 40×46 con origine (20, 42)
  aloneCandela: disegnaAloneCandelaB1,           // (x, w, h) 36×36
  buioPlatea: disegnaBuioPlateaB1,               // (x, w, h) 640×26
  teloSipario: disegnaTeloSiparioB1,             // (x, w, h) 320×360: telo di sinistra (il destro si specchia)
  mantovana: disegnaMantovanaB1,                 // (x, w, h) 640×58
  penombraSipario: disegnaPenombraSiparioB1,     // (x, w, h) 540×140
  cartiglioSipario: disegnaCartiglioSiparioB1,   // (x, w, h) riquadro dei testi (SIPARIO_B1.riquadro)
  fiore: disegnaFioreB1,                         // (x, y, angolo, alfa, chiaro) sul canvas del gioco
};

const SPRITE_SP_B1 = Object.freeze({ w: 40, h: 46, ox: 20, oy: 42, molt: 1.25 });

/** ELEMENTO: sagoma ferma di uno spettatore a mezzo busto (guanti, occhi, ventaglio e binocolo si muovono a parte). */
function disegnaSagomaSpettatoreB1(x, tipo, frontale) {
  const S = sagomaSpettatoreB1(tipo, frontale);
  x.lineJoin = 'round';
  x.strokeStyle = COLORI_B1.contorno; x.lineWidth = 1.2;
  for (const p of S.pezzi) x.stroke(p);
  x.fillStyle = COLORI_B1.ombra;
  for (const p of S.pezzi) x.fill(p);
  for (const [p, col] of S.accenti) { x.fillStyle = col; x.fill(p); }
}

function telaSpettatoreB1(tipo, frontale) {
  const D = SPRITE_SP_B1;
  return telaB1(`sp:${tipo}:${frontale ? 'f' : 'l'}`, D.w, D.h, (x) => { x.translate(D.ox, D.oy); ELEMENTI_B1.spettatore(x, tipo, frontale); }, D.molt);
}

const sagomeB1 = new Map();
function datiSagomaB1(tipo, frontale) {
  const k = tipo + (frontale ? ':f' : ':l');
  let s = sagomeB1.get(k);
  if (!s) { const S = sagomaSpettatoreB1(tipo, frontale); s = { occhi: S.occhi, hx: S.hx, cy: S.cy }; sagomeB1.set(k, s); }
  return s;
}

function mescolaVellutoB1(s) {
  const C = COLORI_B1, t = limitaB1(s, 0, 1);
  const a = t < 0.5 ? C.vellutoOmbra : C.velluto, b = t < 0.5 ? C.velluto : C.vellutoLuce, q = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * q)}, ${Math.round(a[1] + (b[1] - a[1]) * q)}, ${Math.round(a[2] + (b[2] - a[2]) * q)})`;
}

/** Riempie di velluto a pieghe verticali il rettangolo (x0, y0, w, h). */
function pieghetteB1(x, x0, y0, w, h, fase, fitte = 1) {
  const passo = 1 / scalaBase;
  for (let i = 0; i < w; i += passo) {
    const u = (i / 320) * fitte;
    const s = 0.5 + 0.3 * Math.sin(u * TAU * 8.5 + fase) + 0.13 * Math.sin(u * TAU * 21 + fase * 2.7) + 0.07 * Math.sin(u * TAU * 3.3 + 4);
    x.fillStyle = mescolaVellutoB1(s);
    x.fillRect(x0 + i, y0, passo * 1.05, h);
  }
}

/** Frangia dorata lungo una curva quadratica (da p0 a p2, controllo p1). */
function frangiaB1(x, p0, p1, p2, lung) {
  const C = COLORI_B1;
  const n = Math.max(6, Math.round(Math.hypot(p2[0] - p0[0], p2[1] - p0[1]) / 1.4));
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const px = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], py = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
    x.fillStyle = i % 2 ? C.oro : C.oroScuro;
    x.fillRect(px - 0.4, py, 0.8, lung + (i % 3) * 0.4);
  }
  x.strokeStyle = C.oroLuce; x.lineWidth = 1;
  x.beginPath(); x.moveTo(p0[0], p0[1]); x.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); x.stroke();
}

/** Nappa dorata appesa in (cx, y). */
function nappaB1(x, cx, y, scala = 1) {
  const C = COLORI_B1;
  x.strokeStyle = C.oroScuro; x.lineWidth = 0.8 * scala;
  x.beginPath(); x.moveTo(cx, y); x.lineTo(cx, y + 4 * scala); x.stroke();
  x.fillStyle = C.oroLuce;
  x.beginPath(); x.arc(cx, y + 5 * scala, 1.9 * scala, 0, TAU); x.fill();
  x.fillStyle = C.oro;
  x.beginPath(); x.moveTo(cx - 1.6 * scala, y + 6.4 * scala); x.lineTo(cx + 1.6 * scala, y + 6.4 * scala);
  x.lineTo(cx + 2.6 * scala, y + 13 * scala); x.lineTo(cx - 2.6 * scala, y + 13 * scala); x.closePath(); x.fill();
  x.strokeStyle = C.oroScuro; x.lineWidth = 0.5 * scala;
  for (const d of [-1, 0, 1]) { x.beginPath(); x.moveTo(cx + d * 0.9 * scala, y + 7 * scala); x.lineTo(cx + d * 1.5 * scala, y + 13 * scala); x.stroke(); }
}

/** Davanzale bombato (a petto d'oca) con modanatura dorata: da x0 a x1, piano a y. */
function davanzaleB1(x, x0, x1, y, alt, pancia) {
  const C = COLORI_B1, cx = (x0 + x1) / 2;
  const g = x.createLinearGradient(0, y, 0, y + alt + pancia);
  g.addColorStop(0, C.legnoLuce); g.addColorStop(1, C.legnoScuro);
  x.fillStyle = g;
  x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.lineTo(x1, y + alt);
  x.quadraticCurveTo(cx, y + alt + pancia * 2, x0, y + alt); x.closePath(); x.fill();
  x.strokeStyle = C.oroScuro; x.lineWidth = 0.8;
  x.beginPath(); x.moveTo(x0 + 4, y + 3); x.quadraticCurveTo(cx, y + alt + pancia * 1.1, x1 - 4, y + 3); x.stroke();
  x.fillStyle = C.oro;
  x.fillRect(x0, y, x1 - x0, 1.3);
  x.fillStyle = C.oroLuce;
  x.beginPath(); x.ellipse(cx, y + alt * 0.5 + pancia * 0.45, 2.6, 1.7, 0, 0, TAU); x.fill();
  x.fillStyle = C.legnoScuro;
  x.beginPath(); x.ellipse(cx, y + alt * 0.5 + pancia * 0.45, 1.2, 0.8, 0, 0, TAU); x.fill();
}

/** Candela a muro (la fiamma; l'alone si disegna a ogni frame). */
function candelaB1(x, cx, y) {
  const C = COLORI_B1;
  x.fillStyle = C.oroScuro; x.fillRect(cx - 1.6, y + 3, 3.2, 1);
  x.fillStyle = C.crema; x.fillRect(cx - 0.6, y, 1.2, 3);
  x.fillStyle = '#fde68a';
  x.beginPath(); x.moveTo(cx, y - 3.2); x.quadraticCurveTo(cx + 1.3, y - 0.8, cx, y); x.quadraticCurveTo(cx - 1.3, y - 0.8, cx, y - 3.2); x.fill();
}

const candeleB1 = []; // posizioni degli aloni (riempite quando si disegnano le tele)

/** ELEMENTO: balconata in alto, parte DIETRO agli spettatori (parete e interno buio dei palchi). */
function disegnaBalconataFondoB1(x) {
  const A = PUBBLICO_B1.posti.alto, C = COLORI_B1;
  const g = x.createLinearGradient(0, 0, 0, 50);
  g.addColorStop(0, C.legnoScuro); g.addColorStop(1, C.legno);
  x.fillStyle = g; x.fillRect(0, 0, W, 48);
  for (let k = -7; k <= 7; k++) {
    const cx = A.centro + k * A.passo, x0 = cx - 21;
    x.beginPath(); x.moveTo(x0, 44); x.lineTo(x0, 15); x.quadraticCurveTo(cx, 1, x0 + 42, 15); x.lineTo(x0 + 42, 44); x.closePath();
    x.fillStyle = C.interno; x.fill();
    const lume = x.createRadialGradient(cx, 44, 2, cx, 44, 26);
    lume.addColorStop(0, 'rgba(249, 176, 64, 0.16)'); lume.addColorStop(1, 'rgba(249, 176, 64, 0)');
    x.fillStyle = lume; x.fill();
  }
}

function telaBalconataFondoB1() {
  return telaB1('alto:fondo', W, 54, (x, w, h) => ELEMENTI_B1.balconataFondo(x, w, h));
}

/** ELEMENTO: balconata in alto, parte DAVANTI agli spettatori (drappi, davanzali, colonnine con le candele). */
function disegnaBalconataFronteB1(x) {
  const A = PUBBLICO_B1.posti.alto, C = COLORI_B1;
  for (let k = -7; k <= 7; k++) {
    const cx = A.centro + k * A.passo, x0 = cx - 21;
    // drappo: chiuso dietro le Mani, a festone negli altri palchi
    x.save();
    x.beginPath(); x.moveTo(x0, 44); x.lineTo(x0, 15); x.quadraticCurveTo(cx, 1, x0 + 42, 15); x.lineTo(x0 + 42, 44); x.closePath(); x.clip();
    if (A.chiusi.includes(k)) {
      pieghetteB1(x, x0, 0, 42, 44, k, 3.2);
      x.fillStyle = 'rgba(0, 0, 0, 0.35)'; x.fillRect(x0, 0, 42, 44);
    } else {
      x.fillStyle = C.vellutoPieno;
      x.beginPath(); x.moveTo(x0, 0); x.lineTo(x0 + 42, 0); x.lineTo(x0 + 42, 17);
      x.quadraticCurveTo(cx + 11, 23, cx, 13); x.quadraticCurveTo(cx - 11, 23, x0, 17); x.closePath(); x.fill();
      x.strokeStyle = C.vellutoBuio; x.lineWidth = 0.8;
      for (const d of [-13, -6, 6, 13]) { x.beginPath(); x.moveTo(cx + d, 4); x.quadraticCurveTo(cx + d * 0.9, 12, cx + d * 0.75, 17); x.stroke(); }
      frangiaB1(x, [x0, 17], [cx - 11, 23], [cx, 13], 2.2);
      frangiaB1(x, [cx, 13], [cx + 11, 23], [x0 + 42, 17], 2.2);
      nappaB1(x, cx, 12, 0.5);
    }
    x.restore();
    davanzaleB1(x, x0 - 4, x0 + 46, 41, 6, 3);
  }
  for (let k = -8; k <= 7; k++) {
    const px = A.centro + k * A.passo + 25;
    const g = x.createLinearGradient(px - 4, 0, px + 4, 0);
    g.addColorStop(0, C.legnoScuro); g.addColorStop(0.5, C.legnoLuce); g.addColorStop(1, C.legnoScuro);
    x.fillStyle = g; x.fillRect(px - 4, 5, 8, 37);
    x.fillStyle = C.oroScuro; x.fillRect(px - 4.5, 9, 9, 1); x.fillRect(px - 4.5, 38, 9, 1);
    candelaB1(x, px, 28);
  }
  x.fillStyle = C.legnoScuro; x.fillRect(0, 0, W, 5);
  x.fillStyle = C.oro; x.fillRect(0, 5, W, 1);
  const om = x.createLinearGradient(0, 49, 0, 58);
  om.addColorStop(0, 'rgba(0, 0, 0, 0.5)'); om.addColorStop(1, 'rgba(0, 0, 0, 0)');
  x.fillStyle = om; x.fillRect(0, 50, W, 8);
}

function telaBalconataFronteB1() {
  return telaB1('alto:fronte', W, 58, (x, w, h) => ELEMENTI_B1.balconataFronte(x, w, h));
}

/** Altezza (px logici) della colonna dei palchi di proscenio. */
function altezzaLatiB1() {
  const L = PUBBLICO_B1.posti.lati;
  return L.cornice + L.numero * L.altPalco + 6;
}

/** Arco di un palco laterale: percorso sulla tela `x`, y0 = cima del palco. */
function arcoPalcoLatoB1(x, y0) {
  x.beginPath(); x.moveTo(5, y0 + 53); x.lineTo(5, y0 + 17); x.quadraticCurveTo(24.5, y0 + 1, 44, y0 + 17); x.lineTo(44, y0 + 53); x.closePath();
}

/** ELEMENTO: colonna dei palchi di proscenio, parte DIETRO agli spettatori (parete e interno buio dei palchi). */
function disegnaPalcoLatoFondoB1(x, w, h) {
  const L = PUBBLICO_B1.posti.lati, C = COLORI_B1;
  const g = x.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, C.legnoScuro); g.addColorStop(1, C.legno);
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < L.numero; i++) {
    const y0 = L.cornice + i * L.altPalco;
    arcoPalcoLatoB1(x, y0); x.fillStyle = C.interno; x.fill();
    const lume = x.createLinearGradient(44, 0, 8, 0);
    lume.addColorStop(0, 'rgba(249, 176, 64, 0.17)'); lume.addColorStop(1, 'rgba(249, 176, 64, 0)');
    x.fillStyle = lume; x.fill();
  }
}

/** ELEMENTO: colonna dei palchi di proscenio, parte DAVANTI agli spettatori (drappi, davanzali, cornici, candele). */
function disegnaPalcoLatoFronteB1(x, w, h) {
  const L = PUBBLICO_B1.posti.lati, C = COLORI_B1;
  for (let i = 0; i < L.numero; i++) {
    const y0 = L.cornice + i * L.altPalco;
    x.save(); arcoPalcoLatoB1(x, y0); x.clip();
    // festone in alto e telo raccolto sul lato esterno
    x.fillStyle = C.vellutoPieno;
    x.beginPath(); x.moveTo(5, y0); x.lineTo(44, y0); x.lineTo(44, y0 + 20);
    x.quadraticCurveTo(35, y0 + 26, 24.5, y0 + 15); x.quadraticCurveTo(14, y0 + 26, 5, y0 + 20); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(5, y0 + 14); x.lineTo(12, y0 + 18); x.quadraticCurveTo(7.5, y0 + 36, 11, y0 + 53); x.lineTo(5, y0 + 53); x.closePath(); x.fill();
    x.strokeStyle = C.vellutoBuio; x.lineWidth = 0.8;
    for (const d of [-14, -7, 7, 14]) { x.beginPath(); x.moveTo(24.5 + d, y0 + 3); x.quadraticCurveTo(24.5 + d * 0.9, y0 + 13, 24.5 + d * 0.72, y0 + 20); x.stroke(); }
    x.beginPath(); x.moveTo(8, y0 + 20); x.quadraticCurveTo(7, y0 + 36, 8.5, y0 + 52); x.stroke();
    frangiaB1(x, [5, y0 + 20], [14, y0 + 26], [24.5, y0 + 15], 2.6);
    frangiaB1(x, [24.5, y0 + 15], [35, y0 + 26], [44, y0 + 20], 2.6);
    x.fillStyle = C.oro; x.fillRect(5, y0 + 35, 5.4, 1.4);
    x.restore();
    nappaB1(x, 24.5, y0 + 14, 0.62);
    davanzaleB1(x, 1.5, 47, y0 + L.davanzale, 7, 3.6);
    x.fillStyle = 'rgba(0, 0, 0, 0.4)'; x.fillRect(0, y0 + 64, w, 4);
    candelaB1(x, 45.6, y0 + 33);
  }
  // cornice in alto, base, filetto d'oro verso il palco
  x.fillStyle = C.legnoScuro; x.fillRect(0, 0, w, L.cornice - 1); x.fillRect(0, h - 6, w, 6);
  x.fillStyle = C.oro; x.fillRect(0, L.cornice - 1.5, w, 1); x.fillRect(0, h - 6, w, 1);
  x.fillStyle = C.oroScuro; x.fillRect(w - 1, 0, 1, h);
}

function telaLatoB1(fronte) {
  return telaB1(fronte ? 'lato:fronte' : 'lato:fondo', PUBBLICO_B1.posti.lati.larg, altezzaLatiB1(),
    (x, w, h) => (fronte ? ELEMENTI_B1.palcoLatoFronte : ELEMENTI_B1.palcoLatoFondo)(x, w, h));
}

/** ELEMENTO: alone caldo di una candela (si somma alla scena). */
function disegnaAloneCandelaB1(x) {
  const g = x.createRadialGradient(18, 18, 0.5, 18, 18, 18);
  g.addColorStop(0, 'rgba(255, 214, 130, 0.55)'); g.addColorStop(0.35, 'rgba(249, 160, 60, 0.2)'); g.addColorStop(1, 'rgba(249, 160, 60, 0)');
  x.fillStyle = g; x.fillRect(0, 0, 36, 36);
}

function telaAloneB1() {
  return telaB1('alone', 36, 36, (x, w, h) => ELEMENTI_B1.aloneCandela(x, w, h));
}

/** ELEMENTO: buio della platea lungo il bordo basso. */
function disegnaBuioPlateaB1(x) {
  const g = x.createLinearGradient(0, 0, 0, 26);
  g.addColorStop(0, 'rgba(5, 3, 2, 0)'); g.addColorStop(1, 'rgba(5, 3, 2, 0.7)');
  x.fillStyle = g; x.fillRect(0, 0, W, 26);
}

function telaBuioPlateaB1() {
  return telaB1('platea:buio', W, 26, (x, w, h) => ELEMENTI_B1.buioPlatea(x, w, h));
}

(function creaCandeleB1() {
  const A = PUBBLICO_B1.posti.alto, L = PUBBLICO_B1.posti.lati;
  for (const k of [-2, -1, 0, 1, 2, 3]) candeleB1.push([A.centro + k * A.passo + 25, 26]);
  for (let i = 0; i < L.numero; i++) {
    const y = L.y + L.cornice + i * L.altPalco + 31;
    candeleB1.push([45.6, y], [W - 45.6, y]);
  }
})();

// ===========================================================================
// DISEGNO DEL PUBBLICO
// ===========================================================================
/** Uno spettatore sulla tela `x` della sua zona: sagoma in cache più ciò che si muove (occhi, binocolo, ventaglio, guanti). */
function disegnaSpettatoreB1(x, s, t) {
  const P = pubblicoB1, U = P.umore, tens = P.tensione, C = COLORI_B1;
  if (s.presenza <= 0.03) return;
  const retro = s.zona === 'platea', frontale = s.dir === 0;
  const attivo = U.t > 0 && s.estro <= U.forza;
  const D = datiSagomaB1(s.tipo, frontale);
  let dx = 0, dy = (1 - s.presenza) * 5 + Math.sin(t * 0.045 + s.fase * TAU) * 0.45 * (1 - tens);
  let rot = 0, gira = false, mani = 0, bocca = false;
  if (retro) dy -= 1.8 * tens;
  else { dx += s.dir * 2.4 * tens; dy += (frontale ? 1.8 : 0.5) * tens; rot += s.dir * 0.09 * tens; }
  const a = t * 0.5 + s.fase * 40;
  if (attivo) {
    const sfuma = Math.min(1, U.t / 14);
    if (U.tipo === 'applauso') {
      dy -= Math.abs(Math.sin(a * 0.5)) * 0.9 * sfuma;
      mani = 1;
      if (U.inPiedi) { dy -= (retro ? 6 : 2.6) * sfuma; if (s.estro < 0.45) mani = 2; }
    } else if (U.tipo === 'fischi') {
      dx += Math.sin(t * 1.1 + s.fase * 9) * 0.8 * sfuma; rot -= s.dir * 0.05 * sfuma;
      if (s.estro < U.forza * 0.5) bocca = true;
    } else if (U.tipo === 'mormorio') {
      gira = Math.sin(t * 0.11 + s.indice * Math.PI) > 0.15;
      dx += Math.sin(t * 0.2 + s.fase * 9) * 0.7 * sfuma;
    } else if (U.tipo === 'risata') {
      dy -= Math.abs(Math.sin(t * 0.42 + s.fase * 9)) * 1.9 * sfuma; rot -= s.dir * 0.06 * sfuma;
    } else if (U.tipo === 'fiato') {
      dy -= 0.8 * sfuma;
      if (s.tipo === 'ventaglio' || s.tipo === 'piuma' || s.tipo === 'popolana') bocca = true;
    }
  }
  const specchio = (s.dir < 0) !== gira ? -1 : 1;
  x.save();
  x.translate(s.x + dx, s.y + dy);
  if (rot) x.rotate(rot);
  x.scale(s.scala * specchio, s.scala);
  if (s.presenza < 0.97) x.globalAlpha = s.presenza;
  const tela = telaSpettatoreB1(s.tipo, frontale), SP = SPRITE_SP_B1;
  x.drawImage(tela, -SP.ox, -SP.oy, SP.w, SP.h);

  // binocolo da teatro: alzato quando c'è tensione o ogni tanto
  let binocoloSu = false;
  if (s.tipo === 'binocolo') {
    binocoloSu = tens > 0.4 || (t + s.indice * 53) % 420 < 150;
    if (binocoloSu) {
      x.fillStyle = C.ombra; x.strokeStyle = C.oroScuro; x.lineWidth = 0.5;
      if (frontale) { x.fillRect(-3.6, D.cy - 1.9, 3, 2.6); x.fillRect(0.6, D.cy - 1.9, 3, 2.6); x.strokeRect(-3.6, D.cy - 1.9, 3, 2.6); x.strokeRect(0.6, D.cy - 1.9, 3, 2.6); }
      else { x.fillRect(D.hx + 2.2, D.cy - 2, 5.6, 2.6); x.strokeRect(D.hx + 2.2, D.cy - 2, 5.6, 2.6); }
      x.fillStyle = C.oroLuce;
      if (frontale) { x.fillRect(-2.5, D.cy - 1, 0.8, 0.8); x.fillRect(1.7, D.cy - 1, 0.8, 0.8); } else x.fillRect(D.hx + 7, D.cy - 1.2, 0.9, 0.9);
    }
  }
  // occhi accesi nel buio (si spengono a ogni battito di ciglia)
  if (D.occhi && !binocoloSu && (t + s.indice * 37) % s.battito > 5) {
    const r = 0.72 + 0.45 * tens;
    x.fillStyle = C.occhi;
    x.beginPath();
    x.arc(D.occhi[0][0], D.occhi[0][1], r, 0, TAU);
    x.moveTo(D.occhi[1][0] + r, D.occhi[1][1]);
    x.arc(D.occhi[1][0], D.occhi[1][1], r, 0, TAU);
    x.fill();
  }
  // ventaglio
  if (s.tipo === 'ventaglio') {
    const copre = attivo && U.tipo === 'mormorio';
    const chiuso = tens > 0.5;
    const px = frontale ? 6 : 6.5, py = copre ? -10.5 : -6.5;
    x.save();
    x.translate(px, py);
    x.rotate(-1.25 + (copre ? -0.3 : 0) + (chiuso ? 0 : Math.sin(t * 0.33 + s.fase * 9) * 0.2));
    x.fillStyle = C.vellutoChiaro; x.strokeStyle = C.oro; x.lineWidth = 0.5;
    x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 7.4, chiuso ? -0.1 : -0.85, chiuso ? 0.1 : 0.85); x.closePath();
    x.fill(); x.stroke();
    x.restore();
  }
  // guanti chiari: battimani, braccia alzate, mano alla bocca, gesto del lancio
  x.fillStyle = C.crema;
  if (s.lancioT > 0) {
    const q = 1 - s.lancioT / PUBBLICO_B1.lancio.gestoTick, su = Math.sin(q * Math.PI);
    x.beginPath();
    if (retro) x.ellipse(3, -15 - su * 14, 1.6, 1.4, 0, 0, TAU);
    else if (frontale) x.ellipse(4 + q * 2, -9 - su * 13, 1.6, 1.4, 0, 0, TAU);
    else x.ellipse(3 + q * 8, -10 - su * 12, 1.6, 1.4, 0, 0, TAU);
    x.fill();
  } else if (mani === 1) {
    const d = 0.5 + 2.6 * (0.5 + 0.5 * Math.sin(a * 1.9));
    const my = retro ? -24.5 : frontale ? -7.2 : -8.6, mx = retro || frontale ? 0 : 5;
    x.beginPath();
    x.ellipse(mx - d - 0.5, my, 1.5, 1.3, 0, 0, TAU);
    x.moveTo(mx + d + 2, my);
    x.ellipse(mx + d + 0.5, my, 1.5, 1.3, 0, 0, TAU);
    x.fill();
  } else if (mani === 2) {
    x.beginPath();
    x.ellipse(-5.4 + Math.sin(a) * 1.5, -25 - Math.abs(Math.sin(a * 0.7)) * 2.4, 1.5, 1.3, 0, 0, TAU);
    x.moveTo(7, -25);
    x.ellipse(5.4 + Math.sin(a + 1) * 1.5, -25 - Math.abs(Math.cos(a * 0.7)) * 2.4, 1.5, 1.3, 0, 0, TAU);
    x.fill();
  } else if (bocca && !retro) {
    x.beginPath();
    x.ellipse(frontale ? 1.4 : D.hx + 3.6, D.cy + 2.5, 1.5, 1.3, 0, 0, TAU);
    x.fill();
  }
  x.restore();
}

/**
 * Zone del pubblico: balconata, palchi di sinistra, palchi di destra, platea. Ognuna ha la sua tela composta
 * (fondo, sagome, davanzali, lumi) alla risoluzione del buffer; `posti` e `candele` sono quelli che le cadono dentro.
 */
const ZONE_B1 = (() => {
  const L = PUBBLICO_B1.posti.lati, R = PUBBLICO_B1.resa, largL = L.larg + R.sbalzoLati;
  return [
    { nome: 'alto', x: 0, y: 0, w: W, h: R.altoAlt },
    { nome: 'sx', x: 0, y: L.y, w: largL, h: altezzaLatiB1() },
    { nome: 'dx', x: W - largL, y: L.y, w: largL, h: altezzaLatiB1() },
    { nome: 'platea', x: 0, y: H - R.plateaAlt, w: W, h: R.plateaAlt },
  ].map((z, indice) => ({
    ...z, indice, tela: null, cx: null, scala: 0, px: 0, py: 0, tick: -1e9, tensione: 0,
    posti: postiB1.filter((s) => s.zona === z.nome),
    candele: candeleB1.filter((c) => c[0] >= z.x && c[0] < z.x + z.w && c[1] >= z.y && c[1] < z.y + z.h),
  }));
})();

/** Nella zona qualcuno si muove davvero (reazione, lancio, tensione che cambia, chi entra o esce) e non il solo respiro? */
function zonaVivaB1(z) {
  const P = pubblicoB1, U = P.umore;
  if (Math.abs(P.tensione - z.tensione) > 0.004) return true;
  for (const s of z.posti) {
    if (s.lancioT > 0 || Math.abs(s.presenza - (s.dentro ? 1 : 0)) > 0.01) return true;
    if (U.t > 0 && s.presenza > 0.03 && s.estro <= U.forza) return true;
  }
  return false;
}

/** Ciò che in una zona sta DIETRO agli spettatori. */
function disegnaFondoZonaB1(x, z) {
  const L = PUBBLICO_B1.posti.lati, altL = altezzaLatiB1();
  if (z.nome === 'alto') x.drawImage(telaBalconataFondoB1(), 0, 0, W, 54);
  else if (z.nome === 'sx') x.drawImage(telaLatoB1(false), 0, L.y, L.larg, altL);
  else if (z.nome === 'dx') { x.save(); x.translate(W, 0); x.scale(-1, 1); x.drawImage(telaLatoB1(false), 0, L.y, L.larg, altL); x.restore(); }
  else x.drawImage(telaBuioPlateaB1(), 0, H - 26, W, 26);
}

/** Ciò che in una zona sta DAVANTI agli spettatori (la platea non ha nulla davanti). */
function disegnaFronteZonaB1(x, z) {
  const L = PUBBLICO_B1.posti.lati, altL = altezzaLatiB1();
  if (z.nome === 'alto') x.drawImage(telaBalconataFronteB1(), 0, 0, W, 58);
  else if (z.nome === 'sx') x.drawImage(telaLatoB1(true), 0, L.y, L.larg, altL);
  else if (z.nome === 'dx') { x.save(); x.translate(W, 0); x.scale(-1, 1); x.drawImage(telaLatoB1(true), 0, L.y, L.larg, altL); x.restore(); }
}

/** Aloni tremolanti delle candele di una zona (luce di lanterna). */
function disegnaLumiZonaB1(x, z, t) {
  if (!z.candele.length) return;
  const alone = telaAloneB1();
  x.globalCompositeOperation = 'lighter';
  for (const c of z.candele) {
    x.globalAlpha = 0.62 + 0.2 * Math.sin(t * 0.31 + c[0] * 1.7) * Math.sin(t * 0.13 + c[1]);
    x.drawImage(alone, c[0] - 18, c[1] - 18, 36, 36);
  }
  x.globalAlpha = 1;
  x.globalCompositeOperation = 'source-over';
}

/** Ricompone la tela di una zona al tick `t`: fondo, spettatori, davanzali, lumi. */
function ridisegnaZonaB1(z, t) {
  const s = scalaBase;
  if (!z.tela) { z.tela = document.createElement('canvas'); z.cx = z.tela.getContext('2d'); z.scala = 0; }
  if (z.scala !== s) { // tela allineata ai pixel del buffer: la copia non sfoca
    z.px = Math.floor(z.x * s); z.py = Math.floor(z.y * s);
    z.tela.width = Math.max(1, Math.ceil((z.x + z.w) * s) - z.px);
    z.tela.height = Math.max(1, Math.ceil((z.y + z.h) * s) - z.py);
    z.scala = s;
  }
  const x = z.cx;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  x.clearRect(0, 0, z.tela.width, z.tela.height);
  x.setTransform(s, 0, 0, s, -z.px, -z.py);
  x.imageSmoothingEnabled = true;
  disegnaFondoZonaB1(x, z);
  for (const p of z.posti) disegnaSpettatoreB1(x, p, t);
  disegnaFronteZonaB1(x, z);
  disegnaLumiZonaB1(x, z, t);
  z.tick = t; z.tensione = pubblicoB1.tensione;
  pubblicoB1.conti.ridisegni++;
}

/**
 * Balconata, palchi di proscenio e platea. A ogni frame si copiano le quattro tele di zona; una zona si
 * ricompone solo quando tocca a lei (PUBBLICO_B1.resa): il pubblico calmo costa quattro copie per frame.
 */
function disegnaTeatroB1(t) {
  if (!OPZIONI.pubblico) return;
  const R = PUBBLICO_B1.resa, s = scalaBase;
  pubblicoB1.conti.disegni++;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  for (const z of ZONE_B1) {
    const ogni = zonaVivaB1(z) ? R.ogniTickVivo : R.ogniTickFermo;
    if (!z.tela || z.scala !== s || t < z.tick || t - z.tick >= ogni || (t !== z.tick && (t + z.indice) % ogni === 0)) ridisegnaZonaB1(z, t);
    ctx.drawImage(z.tela, z.px / s, z.py / s, z.tela.width / s, z.tela.height / s);
  }
  ctx.restore();
}

/** ELEMENTO: un fiore lanciato dal pubblico, sul canvas del gioco in (x, y). */
function disegnaFioreB1(x, y, ang, alfa, chiaro) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang);
  ctx.globalAlpha = alfa;
  ctx.strokeStyle = '#3f5a2a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-4.5, 0); ctx.lineTo(2, 0); ctx.stroke();
  ctx.fillStyle = chiaro ? COLORI_B1.crema : '#fde68a';
  ctx.beginPath(); ctx.arc(3.2, 0, 2.2, 0, TAU); ctx.fill();
  ctx.fillStyle = COLORI_B1.oro; ctx.fillRect(2.7, -0.5, 1, 1);
  ctx.restore();
}

/** Fiori già a terra (sotto i personaggi): restano qualche secondo e svaniscono. */
function disegnaFioriATerraB1() {
  if (!OPZIONI.pubblico) return;
  const F = PUBBLICO_B1.fiori;
  for (const f of pubblicoB1.fiori) {
    if (f.t < f.durata) continue;
    const resto = f.durata + F.vitaTick - f.t;
    ELEMENTI_B1.fiore(f.tx, f.ty, f.giro, 0.85 * Math.min(1, resto / F.dissolvenzaTick), f.chiaro);
  }
}

/** Premi e fiori in volo (sopra la scena, sotto l'HUD) e interiezioni del pubblico. */
function disegnaVoliB1(st) {
  const P = pubblicoB1;
  for (const v of P.voli) {
    const pk = v.pk, V = pk.voloB1;
    if (!V || v.st !== st || V.t < 0) continue;
    const s = V.seg[V.fase];
    if (!s) continue;
    const u = limitaB1(V.t / s.durata, 0, 1);
    const gx = s.ax + (s.bx - s.ax) * u, gy = s.ay + (s.by - s.ay) * u;
    const h = 4 * s.alt * u * (1 - u);
    if (gy > 60) {
      const vic = 1 - Math.min(1, h / PUBBLICO_B1.lancio.apicePx);
      ctx.fillStyle = `rgba(0, 0, 0, ${(0.16 + 0.26 * vic).toFixed(2)})`;
      ctx.beginPath(); ctx.ellipse(gx, gy + 6, 3.2 + 2.6 * vic, 1.3 + 0.9 * vic, 0, 0, TAU); ctx.fill();
    }
    if (v.forziere) { disegnaForziereInVoloB1(pk, gx, gy - h); continue; }
    const griglia = SPRITE_OGGETTI[pk.sprite] || SPRITE_OGGETTI.moneta1;
    if (pk.tipo === 'moneta') {
      const c = Math.cos(V.giro + (V.fase === 0 ? V.t * 0.45 : 0));
      ctx.save();
      ctx.translate(Math.round(gx), Math.round(gy - h));
      ctx.scale(V.fase === 0 ? Math.sign(c || 1) * Math.max(0.28, Math.abs(c)) : 1, 1);
      drawPixelSprite(griglia, 0, 0, 1.8);
      ctx.restore();
    } else {
      drawPixelSprite(griglia, gx, gy - h, 1.8, false, false, V.fase === 0 ? Math.sin(V.giro + V.t * 0.3) * 0.5 : 0);
    }
  }
  if (!OPZIONI.pubblico) return;
  const F = PUBBLICO_B1.fiori;
  for (const f of P.fiori) {
    if (f.t < 0 || f.t >= f.durata) continue;
    const u = f.t / f.durata;
    ELEMENTI_B1.fiore(f.x0 + (f.tx - f.x0) * u, f.y0 + (f.ty - f.y0) * u - 4 * F.apicePx * u * (1 - u), f.giro + f.t * 0.35, 1, f.chiaro);
  }
  const Vc = PUBBLICO_B1.voci;
  for (const v of P.voci) {
    if (v.t < 0) continue;
    const u = v.t / Vc.durataTick;
    ctx.save();
    ctx.globalAlpha = Math.min(1, u * 6, (1 - u) * 3);
    drawTextFit(v.testo, v.x, v.y - u * Vc.salitaPx, 46, { size: 7, color: v.colore, style: 'italic' });
    ctx.restore();
  }
}

/** Un forziere di A1 in volo: il disegno è quello di A1 (senza la sua ombra, che resta a terra). */
function disegnaForziereInVoloB1(f, x, y) {
  if (typeof disegnaForziereA1 !== 'function') return;
  ctx.save();
  ctx.beginPath(); ctx.rect(x - 12.5, y - 16, 25, 23.2); ctx.clip();
  f.x = x; f.y = y;
  try { disegnaForziereA1(f); } finally { f.x = PARCHEGGIO_B1; f.y = PARCHEGGIO_B1; ctx.restore(); }
}

/** Fiori (solo scena) lanciati attorno a Ferruccio. A stanza con nemici vivi non si lanciano. */
function lanciaFioriB1(quanti) {
  const P = pubblicoB1, F = PUBBLICO_B1.fiori, st = statoRun.stanzaCorrente;
  if (!st || (st.nemici || []).some((n) => n.hp > 0)) return;
  for (let i = 0; i < quanti && P.fiori.length < F.max; i++) {
    const a = rndB1() * TAU, d = F.distMin + rndB1() * (F.distMax - F.distMin);
    const dest = postoLiberoB1(st, player.x + Math.cos(a) * d, player.y + Math.sin(a) * d * 0.7);
    let da = null;
    for (let k = 0; k < 6 && !da; k++) { const s = postiB1[Math.floor(rndB1() * postiB1.length)]; if (s.presenza > 0.6) da = s; }
    if (!da) continue;
    da.lancioT = PUBBLICO_B1.lancio.gestoTick;
    P.fiori.push({ x0: da.x, y0: da.y - 16 * da.scala, tx: dest.x, ty: dest.y, t: -i * F.scartoTick, durata: F.voloTick, giro: rndB1() * TAU, chiaro: rndB1() < 0.6 });
  }
}

/** Riquadro (px logici) che un'interiezione occupa per tutta la sua salita: serve a non sovrapporle. */
function riquadroVoceB1(v) {
  const V = PUBBLICO_B1.voci, m = Math.min(V.largMax, v.testo.length * V.largCarattere) / 2 + V.aria;
  return { x0: v.x - m, x1: v.x + m, y0: v.y - V.salitaPx - V.altRiga, y1: v.y + V.aria };
}

/** Nessuna interiezione ancora in scena tocca il riquadro `q`? */
function voceLiberaB1(q) {
  for (const v of pubblicoB1.voci) {
    const o = riquadroVoceB1(v);
    if (q.x0 < o.x1 && o.x0 < q.x1 && q.y0 < o.y1 && o.y0 < q.y1) return false;
  }
  return true;
}

/**
 * Un'interiezione sopra un palco laterale o in platea, mai sovrapposta a un'altra né sopra il dock: se non
 * trova posto dopo PUBBLICO_B1.voci.tentativi prove, questa volta il pubblico tace.
 * @returns {boolean} true se è partita
 */
function aggiungiVoceB1(tipo, ordine) {
  const P = pubblicoB1, V = PUBBLICO_B1.voci;
  const elenco = TESTI_B1.voci[tipo];
  if (!elenco || P.voci.length >= V.max) return false;
  const testo = elenco[Math.floor(rndB1() * elenco.length)];
  const mezza = Math.min(V.largMax, testo.length * V.largCarattere) / 2 + V.aria;
  const sinistra = Math.max(V.plateaDaX, bordoDockB1() + PUBBLICO_B1.dock.margine) + mezza, destra = W - V.plateaMargineDx - mezza;
  const colore = tipo === 'fischi' || tipo === 'mormorio' ? '#d6b99a' : COLORI_B1.oroLuce;
  for (let k = 0; k < V.tentativi; k++) {
    const s = postiB1[Math.floor(rndB1() * postiB1.length)];
    if (s.zona === 'alto' || s.presenza <= 0.6) continue;
    const lato = s.zona !== 'platea';
    if (!lato && sinistra > destra) continue;
    const v = {
      testo, colore, t: -ordine * V.scartoTick,
      x: lato ? (s.zona === 'sx' ? V.latoX : W - V.latoX) : limitaB1(s.x, sinistra, destra),
      y: lato ? s.y - V.latoSu : H - V.plateaSu[(ordine + k) % V.plateaSu.length],
    };
    if (!voceLiberaB1(riquadroVoceB1(v))) continue;
    P.voci.push(v);
    return true;
  }
  return false;
}

// ===========================================================================
// SIPARIO DI VELLUTO
// ===========================================================================
/** ELEMENTO: telo di sinistra del sipario (mezzo palco × altezza), col gallone sul bordo che si apre. */
function disegnaTeloSiparioB1(x) {
  const C = COLORI_B1, meta = W / 2;
  pieghetteB1(x, 0, 0, meta, H, 0.6);
  const alto = x.createLinearGradient(0, 0, 0, 120);
  alto.addColorStop(0, 'rgba(0, 0, 0, 0.5)'); alto.addColorStop(1, 'rgba(0, 0, 0, 0)');
  x.fillStyle = alto; x.fillRect(0, 0, meta, 120);
  const ribalta = x.createLinearGradient(0, 240, 0, H);
  ribalta.addColorStop(0, 'rgba(255, 170, 80, 0)'); ribalta.addColorStop(1, 'rgba(255, 170, 80, 0.13)');
  x.fillStyle = ribalta; x.fillRect(0, 240, meta, H - 240);
  // ricamo a rombi sopra l'orlo
  x.fillStyle = 'rgba(201, 149, 46, 0.75)';
  for (let i = 10; i < meta; i += 18) { x.save(); x.translate(i, H - 26); x.rotate(Math.PI / 4); x.fillRect(-1.8, -1.8, 3.6, 3.6); x.restore(); }
  x.fillStyle = 'rgba(201, 149, 46, 0.55)'; x.fillRect(0, H - 33, meta, 0.8); x.fillRect(0, H - 19.5, meta, 0.8);
  // gallone e frangia dorata
  x.fillStyle = C.oroScuro; x.fillRect(0, H - 16, meta, 4);
  x.fillStyle = C.oroLuce; x.fillRect(0, H - 15, meta, 1.4);
  for (let i = 0, n = 0; i < meta; i += 1.5, n++) {
    x.fillStyle = n % 2 ? C.oro : C.oroScuro;
    x.fillRect(i, H - 12, 0.9, 10.5 + Math.sin(i * 1.3) * 1.3);
  }
  // gallone lungo il bordo che si apre
  x.fillStyle = C.oroScuro; x.fillRect(meta - 5, 0, 4, H - 12);
  x.fillStyle = C.oroLuce; x.fillRect(meta - 4, 0, 1.3, H - 12);
  x.fillStyle = 'rgba(0, 0, 0, 0.3)'; x.fillRect(meta - 1, 0, 1, H);
}

function telaVellutoB1() {
  return telaB1('sipario:telo', W / 2, H, (x, w, h) => ELEMENTI_B1.teloSipario(x, w, h));
}

/** ELEMENTO: mantovana a festoni in cima al sipario. */
function disegnaMantovanaB1(x) {
  const C = COLORI_B1;
  pieghetteB1(x, 0, 6, W, 18, 2.1, 1.6);
  const n = 5, larg = W / n;
  for (let k = 0; k < n; k++) {
    const x0 = k * larg, mx = x0 + larg / 2;
    x.fillStyle = C.vellutoPieno;
    x.beginPath(); x.moveTo(x0, 16); x.lineTo(x0 + larg, 16); x.lineTo(x0 + larg, 23); x.quadraticCurveTo(mx, 59, x0, 23); x.closePath(); x.fill();
    for (let f = 1; f <= 4; f++) {
      x.strokeStyle = f % 2 ? 'rgba(42, 6, 5, 0.8)' : 'rgba(146, 33, 22, 0.55)'; x.lineWidth = 1.3;
      x.beginPath(); x.moveTo(x0 + f * 7, 18); x.quadraticCurveTo(mx, 18 + (59 - 18) * (1 - f * 0.19), x0 + larg - f * 7, 18); x.stroke();
    }
    frangiaB1(x, [x0, 23], [mx, 59], [x0 + larg, 23], 4);
  }
  const om = x.createLinearGradient(0, 6, 0, 22);
  om.addColorStop(0, 'rgba(0, 0, 0, 0.45)'); om.addColorStop(1, 'rgba(0, 0, 0, 0)');
  x.fillStyle = om; x.fillRect(0, 6, W, 16);
  for (let k = 0; k <= n; k++) nappaB1(x, limitaB1(k * larg, 4, W - 4), 21, 1);
  x.fillStyle = C.legnoScuro; x.fillRect(0, 0, W, 7);
  x.fillStyle = C.oro; x.fillRect(0, 6, W, 1.2);
  x.fillStyle = C.oroScuro; x.fillRect(0, 2.5, W, 0.8);
}

function telaMantovanaB1() {
  return telaB1('sipario:mantovana', W, 58, (x, w, h) => ELEMENTI_B1.mantovana(x, w, h));
}

/** ELEMENTO: penombra morbida dietro il cartiglio dei testi. */
function disegnaPenombraSiparioB1(x) {
  x.save(); x.translate(270, 70); x.scale(1, 70 / 270);
  const g = x.createRadialGradient(0, 0, 40, 0, 0, 270);
  g.addColorStop(0, 'rgba(8, 2, 2, 0.62)'); g.addColorStop(0.7, 'rgba(8, 2, 2, 0.4)'); g.addColorStop(1, 'rgba(8, 2, 2, 0)');
  x.fillStyle = g; x.fillRect(-270, -270, 540, 540);
  x.restore();
}

function telaPenombraB1() {
  return telaB1('sipario:penombra', 540, 140, (x, w, h) => ELEMENTI_B1.penombraSipario(x, w, h));
}

/** ELEMENTO: cartiglio dei testi, uno stendardo di velluto scuro appeso davanti ai teli (w×h px logici). */
function disegnaCartiglioSiparioB1(x, w, h) {
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#210a07'); g.addColorStop(1, '#140504');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // pieghe appena accennate: è stoffa pesante, non un cartello
  for (let i = 0; i < w; i += 2) {
    const p = 0.6 * Math.sin(i * 0.105 + 1.3) + 0.4 * Math.sin(i * 0.031 + 0.4);
    x.fillStyle = p > 0 ? `rgba(146, 33, 22, ${(p * 0.1).toFixed(3)})` : `rgba(0, 0, 0, ${(-p * 0.22).toFixed(3)})`;
    x.fillRect(i, 0, 2, h);
  }
  // ombra lungo i bordi e filetto d'oro scuro
  const b = 12;
  for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, 0, 0, b, 0, 0, w, b], [0, h, 0, h - b, 0, h - b, w, b], [0, 0, b, 0, 0, 0, b, h], [w, 0, w - b, 0, w - b, 0, b, h]]) {
    const o = x.createLinearGradient(x0, y0, x1, y1);
    o.addColorStop(0, 'rgba(0, 0, 0, 0.42)'); o.addColorStop(1, 'rgba(0, 0, 0, 0)');
    x.fillStyle = o; x.fillRect(rx, ry, rw, rh);
  }
  x.strokeStyle = COLORI_B1.oroScuro; x.lineWidth = 0.6;
  x.strokeRect(3.5, 3.5, w - 7, h - 7);
}

function telaCartiglioB1() {
  const R = SIPARIO_B1.riquadro;
  return telaB1('sipario:cartiglio', R.w, R.h, (x, w, h) => ELEMENTI_B1.cartiglioSipario(x, w, h));
}

const bordiSiparioB1 = new Float32Array(SIPARIO_B1.fasce * 2);

/** I due teli e la mantovana, a apertura `e` (0 = chiuso, 1 = aperto; già addolcita). */
function disegnaTendeB1(e) {
  const S = SIPARIO_B1, C = COLORI_B1, meta = W / 2;
  const telo = telaVellutoB1();
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  if (e <= 0.001) {
    ctx.drawImage(telo, 0, 0, meta, H);
    ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(telo, 0, 0, meta, H); ctx.restore();
  } else if (e < 0.999) {
    const N = S.fasce, hSorg = telo.height / N;
    const fuori = liscioB1((e - S.uscitaDa) / (1 - S.uscitaDa)) * (meta * S.residuo + 12);
    const quota = (v) => (v <= S.legatura ? v : S.legatura + (v - S.legatura) * (1 - S.raccolta * e)) * H;
    for (let j = 0; j < N; j++) {
      const v = (j + 0.5) / N;
      const p = limitaB1(e * (1 + S.ritardoAlto) - (1 - v) * S.ritardoAlto, 0, 1);
      bordiSiparioB1[j * 2] = meta * (1 - p * p * (3 - 2 * p) * (1 - S.residuo));
      bordiSiparioB1[j * 2 + 1] = quota(j / N);
    }
    for (let lato = 0; lato < 2; lato++) {
      ctx.save();
      if (lato === 1) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.translate(-fuori, 0);
      for (let j = 0; j < N; j++) {
        const y0 = bordiSiparioB1[j * 2 + 1], y1 = j + 1 < N ? bordiSiparioB1[j * 2 + 3] : quota(1);
        ctx.drawImage(telo, 0, j * hSorg, telo.width, hSorg, 0, y0, bordiSiparioB1[j * 2], y1 - y0 + 0.5);
      }
      // ombra e gallone lungo il bordo raccolto
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'; ctx.lineWidth = 4;
      ctx.beginPath();
      for (let j = 0; j < N; j++) ctx.lineTo(bordiSiparioB1[j * 2] + 2, bordiSiparioB1[j * 2 + 1]);
      ctx.stroke();
      ctx.strokeStyle = C.oroLuce; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let j = 0; j < N; j++) ctx.lineTo(bordiSiparioB1[j * 2] - 0.8, bordiSiparioB1[j * 2 + 1]);
      ctx.stroke();
      ctx.restore();
    }
  }
  if (e < 0.999) {
    const su = liscioB1((e - S.mantovanaDa) / (1 - S.mantovanaDa)) * 62;
    ctx.drawImage(telaMantovanaB1(), 0, -su, W, 58);
  }
  ctx.restore();
}

/** I testi dell'atto ricamati sul velluto e l'invito ad alzare il sipario. */
function disegnaTestiSiparioB1(info, alfa) {
  if (!info || alfa <= 0.01) return;
  const C = COLORI_B1;
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(telaPenombraB1(), 50, 44, 540, 140);
  // cartiglio: uno stendardo scuro appeso davanti ai teli (la cucitura d'oro gli passa dietro, non fra le righe)
  const { x: fx, y: fy, w: fw, h: fh } = SIPARIO_B1.riquadro;
  ctx.drawImage(telaCartiglioB1(), fx, fy, fw, fh);
  ctx.imageSmoothingEnabled = false;
  // cornice ricamata a punti d'oro
  ctx.strokeStyle = 'rgba(249, 203, 64, 0.7)'; ctx.lineWidth = 1;
  ctx.setLineDash([3, 2]);
  ctx.strokeRect(fx, fy, fw, fh);
  ctx.setLineDash([]);
  ctx.fillStyle = C.oroLuce;
  for (const [qx, qy] of [[fx, fy], [fx + fw, fy], [fx, fy + fh], [fx + fw, fy + fh]]) {
    ctx.save(); ctx.translate(qx, qy); ctx.rotate(Math.PI / 4); ctx.fillRect(-2.6, -2.6, 5.2, 5.2); ctx.restore();
  }
  const mw = fw - 24;
  drawTextFit(info.atto, W / 2, 80, mw, { size: 9.5, color: C.oroLuce });
  drawTextFit(info.titolo, W / 2, 100, mw, { size: 11.5, color: '#fff7e0' });
  drawTextFit(info.testo1, W / 2, 121, mw, { size: 8.5, weight: '', color: C.crema });
  drawTextFit(info.testo2, W / 2, 136, mw, { size: 8.5, weight: '', color: C.crema });
  drawTextFit(info.testo3, W / 2, 155, mw, { size: 8.5, color: '#fde68a' });
  // invito
  const battito = 0.75 + 0.25 * Math.sin(tick * 0.1), N = SIPARIO_B1.invito;
  ctx.fillStyle = '#140604';
  ctx.fillRect(N.x, N.y, N.w, N.h);
  ctx.strokeStyle = `rgba(249, 203, 64, ${battito.toFixed(2)})`; ctx.lineWidth = 1.5;
  ctx.strokeRect(N.x, N.y, N.w, N.h);
  drawTextFit(TESTI_B1.alzaSipario, W / 2, N.y + 17, N.w - 14, { size: 9, color: '#ffffff' });
  ctx.restore();
}

/** Ferruccio davanti al sipario, nel cono di un lume (è il giocatore vero: resta dov'è quando il telo si apre). */
function disegnaAttoreB1(alfa, lume) {
  if (alfa <= 0.01) return;
  ctx.save();
  if (lume > 0.01) {
    const px = player.x, py = player.y;
    ctx.globalAlpha = alfa * lume;
    ctx.fillStyle = 'rgba(255, 214, 140, 0.1)';
    ctx.beginPath(); ctx.moveTo(px - 7, 44); ctx.lineTo(px + 7, 44); ctx.lineTo(px + 34, py + 6); ctx.lineTo(px - 34, py + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255, 214, 140, 0.24)';
    ctx.beginPath(); ctx.ellipse(px, py + 6, 34, 8, 0, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = alfa;
  disegnaFerruccioPittorico(ctx, player.x, player.y, {
    scale: 1.0, scalaA2: player.scalaA2, flipX: player.flipX, tick, moving: player.moving,
    shootAnim: false, pickup: false, flash: false, haSpada: statoRun.haSpada, swordAnimTick: -1, swordAngle: 0,
    charInfo: getCharCorrente(), sinergie: statoRun.sinergieVisive,
  });
  ctx.restore();
}

/** Il sipario a apertura k (0..1), con la scena di prima dietro se si sta chiudendo. */
function disegnaSiparioB1(info, k, chiudendo) {
  const S = siparioB1, e = liscioB1(k);
  if (chiudendo && k > 0 && S.fotoValida && S.foto) {
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(S.foto, 0, 0, W, H); ctx.restore();
  }
  disegnaTendeB1(e);
  const alfa = liscioB1(1 - e / SIPARIO_B1.testiFinoA);
  disegnaTestiSiparioB1(info, alfa);
  disegnaAttoreB1(chiudendo ? alfa : 1 - liscioB1((e - 0.5) * 2), 1 - e);
}

function fotografaScenaB1() {
  const S = siparioB1;
  if (!canvas.width || !canvas.height) return;
  if (!S.foto) S.foto = document.createElement('canvas');
  const fl = Math.min(canvas.width, SIPARIO_B1.fotoMaxL), fa = Math.round((fl * canvas.height) / canvas.width);
  if (S.foto.width !== fl || S.foto.height !== fa) { S.foto.width = fl; S.foto.height = fa; }
  const x = S.foto.getContext('2d');
  x.drawImage(canvas, 0, 0, fl, fa);
  S.fotoValida = true;
}

/** Il sipario è attivo in questo frame (chiamata dall'avvolgimento di disegnaSiparioNarrativo). */
function siparioChiusoB1(info) {
  const S = siparioB1;
  S.visto = true; S.info = info;
  if (S.fermo != null) { disegnaSiparioB1(info, S.fermo, S.fermoChiudendo); return; }
  if (S.stato === 'aperto') { S.stato = 'chiuso'; S.k = 0; }
  else if (S.stato === 'apertura') S.stato = 'chiusura';
  if (S.stato === 'chiusura') {
    S.k -= S.dt / SIPARIO_B1.chiusuraMs;
    if (S.k <= 0) { S.k = 0; S.stato = 'chiuso'; suonoTonfoSiparioB1(0.7); }
  }
  disegnaSiparioB1(info, S.k, true);
}

/** Fine del frame: se il giocatore ha appena chiuso il cartellone, il sipario si apre davanti alla scena. */
function dopoFrameSiparioB1() {
  const S = siparioB1, T = SIPARIO_B1;
  if (S.fermo != null) { if (!S.visto && statoRun.fase === 'in_gioco') disegnaSiparioB1(S.info, S.fermo, false); return; }
  if (S.visto) return;
  const inScena = statoRun.fase === 'in_gioco' && !statoRun.pausa;
  if (S.stato === 'chiuso' || S.stato === 'chiusura') {
    if (inScena && performance.now() - S.gestoMs < T.finestraGestoMs) {
      S.stato = 'apertura'; S.veloce = false; S.inizioMs = performance.now();
      suonoMovimentoSiparioB1(((1 - S.k) * T.aperturaMs) / 1000, 1);
    } else { S.stato = 'aperto'; S.k = 1; }
  }
  if (S.stato !== 'apertura') return;
  if (!inScena) { S.stato = 'aperto'; S.k = 1; return; }
  S.k += (S.dt / T.aperturaMs) * (S.veloce ? T.moltSalto : 1);
  if (S.k >= 1) { S.k = 1; S.stato = 'aperto'; suonoTonfoSiparioB1(1); return; }
  disegnaSiparioB1(S.info, S.k, false);
}

/**
 * Segna un gesto del giocatore sul sipario (tasto, click; le altre squadre la chiamano per il gamepad):
 * a sipario chiuso lo fa aprire con l'animazione, durante l'apertura la salta.
 */
function gestoSiparioB1() {
  const S = siparioB1, ora = performance.now();
  if (statoRun.siparioAttivo) S.gestoMs = ora;
  else if (S.stato === 'apertura' && ora - S.inizioMs > SIPARIO_B1.graziaSaltoMs) S.veloce = true;
}

window.addEventListener('keydown', (e) => { if (!e.repeat) gestoSiparioB1(); }, true);
window.addEventListener('mousedown', gestoSiparioB1, true);

// ===========================================================================
// SUONI PROCEDURALI (Web Audio; ogni suono è una funzione (ac, uscita, t0, vol) provabile fuori linea)
// ===========================================================================
const audioB1 = { di: null, rumore: null, buffer: {}, brusio: null, ultimi: {}, conti: {} };

/** Contesto audio pronto (null se muto o prima del primo gesto). Azzera le cache se il contesto cambia. */
function contestoB1() {
  const ac = AudioSys.ctx;
  if (!ac || !AudioSys.attivo) return null;
  if (audioB1.di !== ac) { audioB1.di = ac; audioB1.rumore = null; audioB1.buffer = {}; audioB1.brusio = null; }
  return ac;
}

function rumoreB1(ac) {
  if (ac === audioB1.di && audioB1.rumore) return audioB1.rumore;
  const n = Math.floor(ac.sampleRate * 1.5), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0), r = generatoreB1(7);
  for (let i = 0; i < n; i++) d[i] = r() * 2 - 1;
  if (ac === audioB1.di) audioB1.rumore = b;
  return b;
}

function normalizzaB1(d, picco) {
  let m = 1e-6;
  for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > m) m = a; }
  const g = picco / m;
  for (let i = 0; i < d.length; i++) d[i] *= g;
}

/** Applauso: tante mani, ognuna col suo ritmo e il suo colore (grani di rumore in un risonatore). */
function creaApplausoB1(ac, T) {
  const sr = ac.sampleRate, n = Math.floor(T.durata * sr);
  const buf = ac.createBuffer(1, n, sr), d = buf.getChannelData(0), r = generatoreB1(T.seme);
  for (let m = 0; m < T.mani; m++) {
    const periodo = (0.2 + r() * 0.16) * sr;
    const w = (TAU * (900 + r() * 1700)) / sr, alfa = Math.sin(w) / (2 * (1.2 + r() * 2.2));
    const a0 = 1 + alfa, a1 = -2 * Math.cos(w), a2 = 1 - alfa;
    const amp = 0.35 + r() * 0.65, tau = (0.0018 + r() * 0.0022) * sr, lung = Math.floor(tau * 7);
    const inizio = r() * Math.min(0.4, T.durata * 0.2) * sr, fine = n * (0.5 + r() * 0.5);
    for (let t0 = inizio; t0 < fine; t0 += periodo * (0.9 + r() * 0.2)) {
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      const i0 = Math.floor(t0), ampC = amp * (0.75 + r() * 0.25);
      for (let i = 0; i < lung && i0 + i < n; i++) {
        const x = (r() * 2 - 1) * Math.exp(-i / tau);
        const y = (alfa * x - alfa * x2 - a1 * y1 - a2 * y2) / a0;
        x2 = x1; x1 = x; y2 = y1; y1 = y;
        d[i0 + i] += y * ampC;
      }
    }
  }
  const att = 0.06 * sr, ril = 0.3 * n;
  for (let i = 0; i < n; i++) d[i] *= Math.min(1, i / att) * Math.min(1, (n - i) / ril);
  normalizzaB1(d, 0.9);
  return buf;
}

/** Folla che parlotta: voci fatte di sillabe (impulsi glottali in una formante), ad anello senza giunta. */
function creaFollaB1(ac, T) {
  const sr = T.campionamento, n = Math.floor(T.durata * sr);
  const buf = ac.createBuffer(1, n, sr), d = buf.getChannelData(0), r = generatoreB1(T.seme);
  for (let v = 0; v < T.voci; v++) {
    const f0 = 95 + r() * 150;
    let fase = 0, pos = Math.floor(r() * 0.4 * sr);
    while (pos < n) {
      const lung = Math.floor((0.07 + r() * 0.16) * sr);
      const w = (TAU * (320 + r() * 650)) / sr, alfa = Math.sin(w) / (2 * (3 + r() * 3));
      const a0 = 1 + alfa, a1 = -2 * Math.cos(w), a2 = 1 - alfa;
      const f = f0 * (0.9 + r() * 0.25), amp = 0.4 + r() * 0.6;
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < lung; i++) {
        fase += f / sr; if (fase >= 1) fase -= 1;
        const x = (fase < 0.12 ? 1 : -0.14) + (r() - 0.5) * 0.25;
        const y = (alfa * x - alfa * x2 - a1 * y1 - a2 * y2) / a0;
        x2 = x1; x1 = x; y2 = y1; y1 = y;
        d[(pos + i) % n] += y * Math.sin((Math.PI * i) / lung) * amp;
      }
      pos += lung + Math.floor(r() * 0.22 * sr) + (r() < 0.2 ? Math.floor(r() * 0.6 * sr) : 0);
    }
  }
  normalizzaB1(d, 0.9);
  return buf;
}

function bufferB1(ac, nome) {
  const cache = ac === audioB1.di ? audioB1.buffer : {};
  if (!cache[nome]) cache[nome] = nome === 'folla' ? creaFollaB1(ac, SUONI_B1.folla) : creaApplausoB1(ac, SUONI_B1.applauso[nome]);
  return cache[nome];
}

function suonoApplausoB1(ac, uscita, t0, vol, nome) {
  const T = SUONI_B1.applauso[nome] || SUONI_B1.applauso.applausoMedio;
  const src = ac.createBufferSource(); src.buffer = bufferB1(ac, SUONI_B1.applauso[nome] ? nome : 'applausoMedio');
  const g = ac.createGain(); g.gain.value = T.volume * vol;
  src.connect(g); g.connect(uscita); src.start(t0);
}

function suonoMormorioB1(ac, uscita, t0, vol) {
  const T = SUONI_B1.mormorio, buf = bufferB1(ac, 'folla');
  const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(T.volume * vol, t0 + 0.18);
  g.gain.setValueAtTime(T.volume * vol, t0 + T.durata * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + T.durata);
  src.connect(g); g.connect(uscita);
  src.start(t0, rndB1() * buf.duration * 0.8); src.stop(t0 + T.durata + 0.05);
}

/** Coro di voci a dente di sega dentro due formanti (per «oooh» e risata). */
function coroB1(ac, uscita, formanti, passaBasso) {
  const out = ac.createGain();
  let dest = out;
  if (passaBasso) { const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = passaBasso; lp.connect(out); dest = lp; }
  const filtri = formanti.map((f) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = 5; b.connect(dest); return b; });
  out.connect(uscita);
  return { out, entra(nodo) { for (const b of filtri) nodo.connect(b); } };
}

function suonoOoohB1(ac, uscita, t0, vol) {
  const T = SUONI_B1.oooh, coro = coroB1(ac, uscita, T.formanti, T.soffocato);
  coro.out.gain.setValueAtTime(0.0001, t0);
  coro.out.gain.exponentialRampToValueAtTime(T.volume * vol, t0 + T.attacco);
  coro.out.gain.exponentialRampToValueAtTime(0.0001, t0 + T.durata);
  for (let i = 0; i < T.voci; i++) {
    const o = ac.createOscillator(), g = ac.createGain(), f = T.fMin + rndB1() * (T.fMax - T.fMin);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f * 1.07, t0); o.frequency.exponentialRampToValueAtTime(f * 0.9, t0 + T.durata);
    g.gain.value = 1 / T.voci;
    o.connect(g); coro.entra(g);
    o.start(t0 + rndB1() * 0.05); o.stop(t0 + T.durata + 0.05);
  }
}

function suonoRisataB1(ac, uscita, t0, vol) {
  const T = SUONI_B1.risata, coro = coroB1(ac, uscita, T.formanti, 0);
  coro.out.gain.value = T.volume * vol;
  for (let v = 0; v < T.voci; v++) {
    const o = ac.createOscillator(), g = ac.createGain(), f = 190 + rndB1() * 230, via = t0 + rndB1() * 0.2;
    o.type = 'sawtooth';
    g.gain.setValueAtTime(0.0001, t0);
    for (let s = 0; s < T.sillabe; s++) {
      const ts = via + s * (T.passo + rndB1() * 0.02), cala = 1 - s * 0.05;
      o.frequency.setValueAtTime(f * 1.12 * cala, ts); o.frequency.linearRampToValueAtTime(f * 0.94 * cala, ts + 0.085);
      g.gain.setValueAtTime(0.0001, ts);
      g.gain.linearRampToValueAtTime((1 - s * 0.12) / T.voci, ts + 0.022);
      g.gain.linearRampToValueAtTime(0.0001, ts + 0.09);
    }
    o.connect(g); coro.entra(g);
    o.start(t0); o.stop(via + T.sillabe * (T.passo + 0.02) + 0.1);
  }
}

function suonoFischiB1(ac, uscita, t0, vol) {
  const T = SUONI_B1.fischi;
  for (let k = 0; k < T.quanti; k++) {
    const t = t0 + k * (0.1 + rndB1() * 0.22), f = T.fMin + rndB1() * (T.fMax - T.fMin), dur = 0.34 + rndB1() * 0.2;
    const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), prof = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 0.8, t); o.frequency.linearRampToValueAtTime(f * 1.22, t + 0.09);
    o.frequency.setValueAtTime(f * 1.22, t + dur * 0.55); o.frequency.linearRampToValueAtTime(f * 0.72, t + dur);
    lfo.frequency.value = 21; prof.gain.value = 28; lfo.connect(prof); prof.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(T.volume * vol, t + 0.035);
    g.gain.setValueAtTime(T.volume * vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(uscita);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
  }
}

/** Sipario in movimento: fruscio del velluto, carrucola di legno e cigolii. */
function suonoSiparioB1(ac, uscita, t0, vol, durata) {
  const T = SUONI_B1.sipario, d = Math.max(0.2, durata);
  const src = ac.createBufferSource(); src.buffer = rumoreB1(ac); src.loop = true;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 620;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(T.fruscio * vol, t0 + d * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  src.connect(lp); lp.connect(g); g.connect(uscita); src.start(t0); src.stop(t0 + d + 0.05);
  // carrucola: una nota bassa «a scatti»
  const car = ac.createOscillator(), gc = ac.createGain(), scatti = ac.createOscillator(), ps = ac.createGain();
  car.type = 'sawtooth'; car.frequency.setValueAtTime(64, t0); car.frequency.linearRampToValueAtTime(78, t0 + d);
  const lpc = ac.createBiquadFilter(); lpc.type = 'lowpass'; lpc.frequency.value = 380;
  scatti.type = 'square'; scatti.frequency.value = 17; ps.gain.value = T.carrucola * vol * 0.5;
  gc.gain.setValueAtTime(T.carrucola * vol * 0.5, t0);
  scatti.connect(ps); ps.connect(gc.gain);
  car.connect(lpc); lpc.connect(gc);
  const fine = ac.createGain(); fine.gain.setValueAtTime(1, t0 + d * 0.8); fine.gain.linearRampToValueAtTime(0.0001, t0 + d);
  gc.connect(fine); fine.connect(uscita);
  car.start(t0); scatti.start(t0); car.stop(t0 + d + 0.02); scatti.stop(t0 + d + 0.02);
  // cigolii
  const quanti = Math.max(1, Math.round(T.cigolii * Math.min(1, d / 0.9)));
  for (let k = 0; k < quanti; k++) {
    const t = t0 + ((k + 0.15 + rndB1() * 0.4) * d) / quanti, f = 640 + rndB1() * 520;
    const o = ac.createOscillator(), bp = ac.createBiquadFilter(), gk = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.36, t + 0.07); o.frequency.linearRampToValueAtTime(f * 0.92, t + 0.15);
    bp.type = 'bandpass'; bp.frequency.value = f * 1.15; bp.Q.value = 7;
    gk.gain.setValueAtTime(0.0001, t);
    gk.gain.exponentialRampToValueAtTime(T.cigolio * vol, t + 0.02);
    gk.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(bp); bp.connect(gk); gk.connect(uscita);
    o.start(t); o.stop(t + 0.18);
  }
}

function suonoTonfoB1(ac, uscita, t0, vol) {
  const T = SUONI_B1.sipario;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(96, t0); o.frequency.exponentialRampToValueAtTime(38, t0 + 0.22);
  g.gain.setValueAtTime(T.tonfo * vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
  o.connect(g); g.connect(uscita); o.start(t0); o.stop(t0 + 0.26);
  const src = ac.createBufferSource(); src.buffer = rumoreB1(ac);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
  const gn = ac.createGain(); gn.gain.setValueAtTime(T.tonfo * vol * 0.8, t0); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
  src.connect(lp); lp.connect(gn); gn.connect(uscita); src.start(t0); src.stop(t0 + 0.12);
}

function suonoTicB1(ac, uscita, t0, vol, moneta, quale) {
  const T = SUONI_B1.rimbalzo, v = T.volume * vol / Math.max(1, quale);
  const o = ac.createOscillator(), g = ac.createGain();
  if (moneta) { o.type = 'sine'; o.frequency.setValueAtTime(2500 - quale * 150, t0); o.frequency.exponentialRampToValueAtTime(1800, t0 + 0.04); }
  else { o.type = 'triangle'; o.frequency.setValueAtTime(300, t0); o.frequency.exponentialRampToValueAtTime(140, t0 + 0.05); }
  g.gain.setValueAtTime(v * (moneta ? 1 : 1.6), t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
  o.connect(g); g.connect(uscita); o.start(t0); o.stop(t0 + 0.07);
}

const SUONATORI_B1 = Object.freeze({
  applausoPiccolo: (ac, u, t, v) => suonoApplausoB1(ac, u, t, v, 'applausoPiccolo'),
  applausoMedio: (ac, u, t, v) => suonoApplausoB1(ac, u, t, v, 'applausoMedio'),
  applausoGrande: (ac, u, t, v) => suonoApplausoB1(ac, u, t, v, 'applausoGrande'),
  oooh: suonoOoohB1, mormorio: suonoMormorioB1, fischi: suonoFischiB1, risata: suonoRisataB1,
  sipario: (ac, u, t, v) => suonoSiparioB1(ac, u, t, v, SIPARIO_B1.aperturaMs / 1000),
  tonfo: suonoTonfoB1,
  rimbalzo: (ac, u, t, v) => suonoTicB1(ac, u, t, v, true, 1),
});

function suonaB1(nome, f) {
  audioB1.conti[nome] = (audioB1.conti[nome] || 0) + 1;
  try {
    const ac = contestoB1();
    if (!ac) return;
    const uscita = AudioSys.uscita;
    if (uscita) f(ac, uscita, ac.currentTime + 0.01);
  } catch (_) { /* l'audio non deve mai fermare il gioco */ }
}

/** Suono di una reazione del pubblico (rispetta OPZIONI.pubblico e il muto). */
function suonoPubblicoB1(nome, vol = 1) {
  const f = SUONATORI_B1[nome];
  if (!f || !OPZIONI.pubblico) return;
  suonaB1(nome, (ac, u, t) => f(ac, u, t, vol));
}

function suonoRimbalzoB1(moneta, quale) {
  suonaB1('rimbalzo', (ac, u, t) => suonoTicB1(ac, u, t, 1, moneta, quale));
}

function suonoMovimentoSiparioB1(durataSec, vol) {
  suonaB1('sipario', (ac, u, t) => suonoSiparioB1(ac, u, t, vol, durataSec));
}

function suonoTonfoSiparioB1(vol) {
  suonaB1('tonfo', (ac, u, t) => suonoTonfoB1(ac, u, t, vol));
}

/** Brusio di sala: un anello di folla a volume bassissimo, che tace quando il pubblico trattiene il fiato. */
function aggiornaBrusioB1() {
  try {
    const ac = AudioSys.ctx, T = SUONI_B1.brusio, P = pubblicoB1;
    if (!ac) return;
    let bersaglio = 0;
    if (AudioSys.attivo && OPZIONI.pubblico && T.volume > 0 && statoRun.fase === 'in_gioco' && !statoRun.pausa && !statoRun.siparioAttivo) {
      bersaglio = T.volume * (0.45 + 0.55 * P.gradimento) * Math.max(0, 1 - P.tensione * 1.2);
    }
    if (audioB1.di !== ac) contestoB1();
    let B = audioB1.brusio;
    if (!B) {
      if (bersaglio <= 0 || ac.state !== 'running' || audioB1.di !== ac) return;
      const src = ac.createBufferSource(); src.buffer = bufferB1(ac, 'folla'); src.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = T.passaBasso;
      const g = ac.createGain(); g.gain.value = 0;
      src.connect(lp); lp.connect(g); g.connect(AudioSys.uscita); src.start();
      B = audioB1.brusio = { src, g };
    }
    B.g.gain.setTargetAtTime(bersaglio, ac.currentTime, 0.35);
  } catch (_) { /* idem */ }
}

/** QA: rende ogni suono fuori linea e ne misura picco e valore efficace. */
async function provaSuoniB1() {
  const esiti = {};
  const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!Off) return esiti;
  for (const [nome, f] of Object.entries(SUONATORI_B1)) {
    const sr = 44100, ac = new Off(1, sr * 5, sr);
    f(ac, ac.destination, 0.01, 1);
    const d = (await ac.startRendering()).getChannelData(0);
    let picco = 0, somma = 0, ultimo = 0;
    for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > picco) picco = a; somma += a * a; if (a > 0.002) ultimo = i; }
    const durata = ultimo / sr;
    esiti[nome] = { picco: +picco.toFixed(4), efficace: +Math.sqrt(somma / Math.max(1, ultimo)).toFixed(4), durata: +durata.toFixed(2), finito: Number.isFinite(picco) };
  }
  return esiti;
}

// ===========================================================================
// AVVOLGIMENTI (chiamano sempre la base; altre squadre avvolgono le stesse funzioni)
// ===========================================================================
const passoLogicoBaseB1 = passoLogico;
passoLogico = function (...args) {
  const r = passoLogicoBaseB1.apply(this, args);
  try { aggiornaPubblicoB1(); } catch (err) { console.error('[B1] tick', err); }
  return r;
};

const danneggiaNemicoBaseB1 = danneggiaNemico;
danneggiaNemico = conLancioB1(danneggiaNemicoBaseB1);

// T3 chiama la funzione di base da window.__teatroInterno (raggio del patto): stessi lanci anche da lì
if (window.__teatroInterno && typeof window.__teatroInterno.danneggiaNemico === 'function') {
  try { window.__teatroInterno.danneggiaNemico = conLancioB1(window.__teatroInterno.danneggiaNemico); } catch (_) { /* oggetto non scrivibile */ }
}

const verificaPulitaBaseB1 = verificaStanzaPulita;
verificaStanzaPulita = (() => {
  let eraPulita = true;
  const conEsito = function (...args) {
    const st = statoRun.stanzaCorrente;
    eraPulita = !st || Boolean(st.pulita);
    return verificaPulitaBaseB1.apply(this, args);
  };
  return conLancioB1(conEsito, (st) => {
    const prima = eraPulita;
    eraPulita = true;
    if (st && !prima && st.pulita) stanzaPulitaB1(st);
  });
})();

// A1: chi apre da codice un forziere ancora in volo lo trova già a terra (mai premi sparsi dal parcheggio)
if (typeof apriForziereA1 === 'function') {
  const apriForziereBaseB1 = apriForziereA1;
  apriForziereA1 = function (st, f, ...resto) {
    if (f && f.voloB1) atterraPremioB1(f);
    return apriForziereBaseB1.call(this, st, f, ...resto);
  };
  if (window.__teatro && window.__teatro.interni && window.__teatro.interni.apriForziereA1) window.__teatro.interni.apriForziereA1 = apriForziereA1;
}

const spawnaMonetaBaseB1 = spawnaMonetaATerra;
spawnaMonetaATerra = function (st, ...resto) {
  const n0 = st && Array.isArray(st.oggettiATerra) ? st.oggettiATerra.length : 0;
  if (pubblicoB1.profLancio === 0) allineaStanzaB1(st);
  const r = spawnaMonetaBaseB1.call(this, st, ...resto);
  try { dopoMonetaB1(st, n0); } catch (err) { console.error('[B1] moneta', err); }
  return r;
};

const subisciColpoBaseB1 = subisciColpoGiocatore;
subisciColpoGiocatore = function (half, fonte, daX, daY, ...resto) {
  const prima = statoRun.hpHalf, vite = statoRun.viteExtra, fase = statoRun.fase;
  const r = subisciColpoBaseB1.call(this, half, fonte, daX, daY, ...resto);
  try {
    if (fase === 'in_gioco' && (statoRun.hpHalf < prima || statoRun.viteExtra < vite || statoRun.fase !== fase)) colpoSubitoB1(prima, fonte);
  } catch (err) { console.error('[B1] colpo', err); }
  return r;
};

const disegnaStanzaBaseB1 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function (t, st, ...resto) {
  const r = disegnaStanzaBaseB1.call(this, t, st, ...resto);
  try {
    if (st && (statoRun.fase === 'in_gioco' || statoRun.fase === 'morte')) { disegnaTeatroB1(t); disegnaFioriATerraB1(); }
  } catch (err) { console.error('[B1] teatro', err); }
  return r;
};

const disegnaHUDBaseB1 = disegnaHUDPixelArt;
disegnaHUDPixelArt = function (st, ...resto) {
  try { if (st && statoRun.fase === 'in_gioco') disegnaVoliB1(st); } catch (err) { console.error('[B1] voli', err); }
  return disegnaHUDBaseB1.call(this, st, ...resto);
};

const avviaPianoBaseB1 = avviaPiano;
avviaPiano = function (...args) {
  try { fotografaScenaB1(); } catch (_) { siparioB1.fotoValida = false; }
  const r = avviaPianoBaseB1.apply(this, args);
  try {
    const S = siparioB1;
    if (statoRun.siparioAttivo && S.stato !== 'chiuso' && S.fermo == null) {
      S.stato = 'chiusura';
      if (S.k <= 0) S.k = 1;
      suonoMovimentoSiparioB1((S.k * SIPARIO_B1.chiusuraMs) / 1000, 0.8);
    }
  } catch (err) { console.error('[B1] piano', err); }
  return r;
};

const siparioNarrativoBaseB1 = disegnaSiparioNarrativo;
disegnaSiparioNarrativo = function (info, ...resto) {
  const r = siparioNarrativoBaseB1.call(this, info, ...resto);
  try { siparioChiusoB1(info); } catch (err) { console.error('[B1] sipario', err); }
  return r;
};

const disegnaFrameBaseB1 = disegnaFrame;
disegnaFrame = function (dtMs, ...resto) {
  siparioB1.dt = Math.min(SIPARIO_B1.dtMaxMs, Number.isFinite(dtMs) ? dtMs : MS_PER_TICK);
  siparioB1.visto = false;
  const r = disegnaFrameBaseB1.call(this, dtMs, ...resto);
  try { dopoFrameSiparioB1(); } catch (err) { console.error('[B1] sipario', err); }
  return r;
};

// ===========================================================================
// ESPOSIZIONE (altre squadre e QA)
// ===========================================================================
if (window.__teatro && window.__teatro.interni) {
  Object.assign(window.__teatro.interni, {
    PUBBLICO_B1, SIPARIO_B1, SUONI_B1, TESTI_B1, ELEMENTI_B1, invalidaTeleB1,
    gradimentoPubblico, reazionePubblicoB1, lanciaPremioB1, postoLiberoB1, gestoSiparioB1,
    pubblicoB1: {
      stato: pubblicoB1, sipario: siparioB1, posti: postiB1, audio: audioB1,
      imposta: impostaGradimentoB1, sposta: spostaGradimentoB1, variazione: variazioneMoneteB1,
      occupato: postoOccupatoB1, provaSuoni: provaSuoniB1, PARCHEGGIO: PARCHEGGIO_B1,
      danneggiaNemico: (...a) => danneggiaNemico(...a), verificaStanzaPulita: () => verificaStanzaPulita(),
      spawnaMonetaATerra: (...a) => spawnaMonetaATerra(...a), subisciColpoGiocatore: (...a) => subisciColpoGiocatore(...a),
      avviaPiano: (...a) => avviaPiano(...a), disegnaFrame: (...a) => disegnaFrame(...a),
      bordoDock: bordoDockB1, riquadroVoce: riquadroVoceB1, zone: ZONE_B1,
      /** QA: blocca il sipario a un'apertura fissa (0..1), se `chiudendo` con la scena di prima dietro; null lo libera. */
      fermaSipario(k, chiudendo = false) {
        siparioB1.fermo = k == null ? null : limitaB1(Number(k) || 0, 0, 1);
        siparioB1.fermoChiudendo = k != null && Boolean(chiudendo);
      },
    },
  });
}
