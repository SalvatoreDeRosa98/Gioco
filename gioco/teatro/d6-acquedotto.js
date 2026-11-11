/*
 * teatro/d6-acquedotto.js — (squadra d6) L'ACQUEDOTTO CAROLINO: un percorso alternativo al piano 2.
 *
 *   1. LA SCELTA. Battuto il boss del piano 1 del ciclo, accanto alla botola compare la GRATA DEL CONDOTTO
 *      (a sinistra, col cartiglio del luogo). È chiusa da un lucchetto: si apre con una chiave [E], oppure è
 *      già saltata se il boss è caduto senza far perdere più di una Maschera. Chi scende di lì fa il piano 2
 *      all'Acquedotto invece che alla Villa Comunale; dal piano 3 si rientra sul percorso solito (San Leucio).
 *   2. IL QUARTIERE (QUARTIERE_D6, stessi campi di QUARTIERI_PIANI): lastre di tufo, fondale dipinto coi Ponti
 *      della Valle fra i monti, quinte con i tre ordini di archi, fiaccole e drappi, vento e spruzzi.
 *   3. LA REGOLA DEL LUOGO. L'ACQUA DEL CONDOTTO: canali che attraversano alcune stanze; dentro si cammina più
 *      piano e la corrente spinge (giocatore, nemici, raccoglibili); chi vola la ignora. LA RAFFICA: ogni tanto
 *      il vento piega i proiettili (di tutti) per un paio di secondi; l'annunciano le fiaccole e i drappi che
 *      si piegano (nessun segno a terra).
 *   4. I NEMICI DEL LUOGO (NEMICI_D6): il Rondone di Latta (plana, punta, picchiata; parte col vento), la
 *      Lavandaia di Tufo (panni bagnati che inzuppano e rallentano), il Fontaniere (gira la saracinesca: la
 *      corrente cambia verso, poi un getto). Prendono il posto dei nemici della Villa (SOSTITUZIONI_D6).
 *   5. IL BOSS: Il Guardiano delle Acque (SCHEDA_D6, BOSS_D6, STATI_D6: lo stesso schema di b6-boss.js), solo
 *      quando il piano è l'Acquedotto. Alza e abbassa l'acqua dell'arena, s'immerge, riemerge, spara getti.
 *   6. IL PERCHÉ: dopo il Guardiano un oggetto forte garantito («Dono dell'Acquedotto»), il suo segno (a6) e
 *      una riga nel Registro (a7) e nel Diario di Ferruccio (b8).
 *   7. LA MUSICA: tema «acquedotto» aggiunto a MUSICA.temi (a8) e scelto finché si è nel luogo.
 *
 * AGGANCI nei file di base: uno solo, in 40-combattimento.js (IA dei nemici comuni → iaNemicoD6). Tutto il
 * resto avvolge function di primo livello chiamando sempre la base: getQuartierePiano, getFloorTileCanvas,
 * getRaccontoAtto, disegnaAtmosferaQuartiere, nuovaRun, avviaPiano, generaMappaPiano, popolaStanza,
 * entraInStanza, verificaStanzaPulita, interagisciStanza, passoLogico, massaNemico, disegnaNemicoPittorico,
 * disegnaBossPittorico, disegnaStanzaPixelArt, disegnaHUDPixelArt, disegnaPergamenaA7, componiPaginaB8.
 * Script classico caricato dopo teatro/c2-tocco.js. Regole: teatro/LEGGIMI.md.
 * QA: tools/qa-teatro-acquedotto.js. Sonda: window.__teatro.interni.acquedottoD6.
 */

// ===========================================================================
// TABELLE (numeri e testi). Tick a 60 Hz, distanze in px del palco 640×360, velocità in px/tick.
// ===========================================================================

/** Regole del percorso e del luogo. */
const ACQUEDOTTO_D6 = Object.freeze({
  pianoGrata: 1,   // piano del ciclo dopo il cui boss compare la grata
  pianoLuogo: 2,   // piano del ciclo che l'Acquedotto sostituisce (la Villa Comunale)
  /** La grata nella stanza del boss: posizione, raggio di [E] e del click, costo, soglia del «gratis». */
  grata: Object.freeze({ x: 196, y: 188, raggio: 46, raggioClick: 34, chiavi: 1, mezzeGratis: 2 }),
  /** Canali del condotto nelle stanze di combattimento. */
  canali: Object.freeze({
    probStanza: 0.72,     // probabilità che una stanza di combattimento abbia un canale
    rallenta: 0.6,        // nell'acqua resta questa frazione del passo
    spinta: 0.42,         // px/tick lungo la corrente (giocatore)
    spintaNemici: 0.34,
    spintaOggetti: 0.3,
    margineOggetti: 14,   // i raccoglibili si fermano a questa distanza dal muro
    /** Forme possibili. dx/dy: verso di partenza della corrente (il generatore può invertirlo). */
    forme: Object.freeze([
      Object.freeze({ id: 'traversa-alta', peso: 3, canali: Object.freeze([{ x: 76, y: 114, w: 488, h: 26, dx: 1, dy: 0 }]) }),
      Object.freeze({ id: 'traversa-bassa', peso: 3, canali: Object.freeze([{ x: 76, y: 236, w: 488, h: 26, dx: -1, dy: 0 }]) }),
      Object.freeze({ id: 'condotto-ovest', peso: 2, canali: Object.freeze([{ x: 150, y: 78, w: 26, h: 220, dx: 0, dy: 1 }]) }),
      Object.freeze({ id: 'condotto-est', peso: 2, canali: Object.freeze([{ x: 464, y: 78, w: 26, h: 220, dx: 0, dy: -1 }]) }),
      Object.freeze({ id: 'due-traverse', peso: 2, canali: Object.freeze([{ x: 76, y: 114, w: 488, h: 26, dx: 1, dy: 0 }, { x: 76, y: 236, w: 488, h: 26, dx: -1, dy: 0 }]) }),
    ]),
    /** Nella stanza del Guardiano: i due condotti da cui sale la piena. */
    boss: Object.freeze([{ x: 126, y: 78, w: 22, h: 220, dx: 0, dy: 1 }, { x: 492, y: 78, w: 22, h: 220, dx: 0, dy: 1 }]),
  }),
  /** La raffica di vento. */
  vento: Object.freeze({
    primaAttesaTick: 240, attesaMinTick: 420, attesaMaxTick: 780,
    annuncioTick: 72,     // fiaccole e drappi si piegano, poi parte la raffica
    rafficaTick: 132,     // ~2,2 s
    accel: 0.045,         // px/tick² di traverso sui proiettili
    tetto: 1.3,           // velocità di traverso massima che il vento aggiunge a un proiettile
    moltPanni: 1.5,       // i panni bagnati della Lavandaia prendono più vento
    forzaAnnuncio: 0.55,  // quanto si piegano fiaccole e drappi durante l'annuncio (1 = raffica piena)
    strisce: 14,          // strisce d'aria a raffica piena (resa)
  }),
  /** Giocatore inzuppato da un panno bagnato. */
  inzuppato: Object.freeze({ tick: 150, rallenta: 0.6 }),
  /** Il dono dopo il Guardiano. */
  dono: Object.freeze({ x: 170, y: 100 }),  // in alto a sinistra: lontano da botola, Patto e condotti
  /** Come scala popolaStanza di 30-mappa.js (stessi numeri: qui servono per i nemici sostituiti). */
  scala: Object.freeze({ moltCiclo: 1.45, velPerPiano: 0.045, velMax: 1.55, hpCremisi: 1.6, hpCampione: 1.35, velDorato: 1.2, hpBossPerPiano: 45 }),
});

/** Il quartiere: stessi campi delle voci di QUARTIERI_PIANI (00-config.js). TESTI DA APPROVARE DALL'AUTORE. */
const QUARTIERE_D6 = Object.freeze({
  id: 'acquedotto-carolino',
  pianoNelCiclo: 2,
  nome: 'Acquedotto Carolino',
  atmosfera: 'Nel Vento',
  titoloCompleto: 'L\'Acquedotto Carolino nel Vento',
  meteo: 'vento',
  coloreTema: '#7dd3fc',
  bordoPillola: '#0369a1',
  coloreSfondo: '#070a10',
  coloreMuroEsterno: '#2b2418',
  coloreMuroInterno: '#352c1d',
  coloreBordoMuro: '#120e08',
  coloriPiastrelle: Object.freeze(['#3d3424', '#352d1f', '#463c2a', '#2f281c']),
  coloreFughe: '#1a150e',
  coloreRiflesso: '#6b5a3a',
  coloreMuschio: '#3f4a22',
  coloreAcqua: '#0d2a3d',
  coloreSchiuma: '#bfe6fb',
  colorePozzanghera: 'rgba(125, 211, 252, 0.22)',
  nemiciTipici: Object.freeze(['rondone_latta', 'lavandaia_tufo', 'fontaniere']),
  bossTipico: 'guardiano-acque',
  descrizioneSipario: Object.freeze({
    atto: 'ATTO II · ACQUEDOTTO CAROLINO',
    titolo: '«L\'ACQUEDOTTO CAROLINO NEL VENTO»',
    testo1: 'Tre ordini di archi di tufo scavalcano la valle: sopra corre il vento, dentro corre l\'acqua del Re.',
    testo2: 'Il condotto porta l\'acqua fino alle fontane della Reggia. Stanotte porta anche te.',
    testo3: 'Nell\'acqua si cammina piano e la corrente spinge. Quando fiaccole e drappi si piegano, arriva la raffica!',
  }),
});

/** Testi per il giocatore (DA APPROVARE DALL'AUTORE). */
const TESTI_D6 = Object.freeze({
  atto: (piano, stanze) => `ATTO II · ACQUEDOTTO CAROLINO (PIANO ${piano} · ${stanze} STANZE + 1 SEGRETA)`,
  cartiglioLuogo: 'ACQUEDOTTO CAROLINO',
  cartiglioChiusa: (n) => `Un'altra strada · 🗝 ${n} chiave [E]`,
  cartiglioAperta: '▼ SCENDI NEL CONDOTTO [E] ▼',
  bannerGrata: (n) => `· A sinistra la GRATA DEL CONDOTTO (🗝 ${n} chiave).`,
  bannerGrataGratis: '· A sinistra la GRATA DEL CONDOTTO: il lucchetto è saltato!',
  serveChiave: (n) => `La grata del condotto è chiusa col lucchetto: serve ${n} chiave 🗝.`,
  grataAperta: 'La chiave gira, il lucchetto cade: sotto la grata si sente correre l\'acqua. [E] per scendere.',
  presentazione: '«Chi beve l\'acqua del Re, paga il pedaggio.»',
  sconfitta: 'Il Guardiano torna pietra. L\'acqua riprende la sua strada verso la Reggia.',
  dono: '★ DONO DELL\'ACQUEDOTTO',
  bannerDono: '· In alto a sinistra l\'acqua ha lasciato un DONO DELL\'ACQUEDOTTO.',
  inzuppato: 'Inzuppato! I panni bagnati pesano: cammini piano finché non ti asciughi.',
  pergamena: Object.freeze(['Percorso', 'per l\'Acquedotto Carolino']),
  diario: Object.freeze([
    'Stanotte ho preso la strada dell\'acqua: sotto la grata, lungo il condotto, fin sopra i Ponti della Valle.',
    'Sono passato per l\'Acquedotto. Lassù il vento sposta pure i pensieri, e l\'acqua corre senza chiedere permesso a nessuno.',
    'Niente Villa, stanotte: il condotto del Re. Tre ordini di archi, e io sopra come una formica.',
  ]),
});

/**
 * NEMICI del luogo. hp = (hpBase + (piano − 1) × hpPiano) × ciclo × campione, come popolaStanza.
 * sostituisce: il tipo della Villa di cui prendono il posto (gruppi e disposizioni di b7 restano validi).
 * vola: ignora l'acqua. massa: per le spinte (Infinity = non si sposta). Il resto sono i numeri dell'IA.
 */
const NEMICI_D6 = Object.freeze({
  rondone_latta: Object.freeze({
    nome: 'Rondone di Latta', sostituisce: 'lucciola', hpBase: 9, hpPiano: 2.5, vel: 1.5, raggio: 10, vola: true, massa: 0.5,
    quota: 15, raggioOrbita: 98, giro: 0.8, planaTick: Object.freeze([84, 132]), puntaTick: 28, bloccoTick: 9,
    velPicchiata: 4.0, picchiataTick: 24, risaleTick: 22, spintaVento: 1.4, anticipoVentoTick: 10,
  }),
  lavandaia_tufo: Object.freeze({
    nome: 'Lavandaia di Tufo', sostituisce: 'statua', hpBase: 20, hpPiano: 5.5, vel: 0, raggio: 13, vola: false, massa: Infinity,
    lavaTick: Object.freeze([70, 112]), alzaTick: 36, bloccoTick: 10, lanciaTick: 16,
    panno: Object.freeze({ velocita: 2.2, raggio: 7, vitaTick: 150, quotaPx: 16, massimi: 3 }),
  }),
  fontaniere: Object.freeze({
    nome: 'Fontaniere', sostituisce: 'predone', hpBase: 16, hpPiano: 4.5, vel: 1.05, raggio: 11, vola: false, massa: 1.6,
    distanzaPx: 110, bandaPx: 24, giro: 0.5, passo: 0.8, camminaTick: Object.freeze([120, 172]), giraTick: 38, apreTick: 16,
    getto: Object.freeze({ gocce: 3, gocceSenzaCanale: 5, apertura: 0.26, velocita: 2.5 }),
  }),
});

/** Tipo della Villa → tipo dell'Acquedotto (costruita da NEMICI_D6). */
const SOSTITUZIONI_D6 = Object.freeze(Object.fromEntries(Object.entries(NEMICI_D6).map(([tipo, T]) => [T.sostituisce, tipo])));

/** Chi non tocca l'acqua oltre ai nemici del luogo con `vola`. */
const VOLANO_D6 = Object.freeze(['vespa_cieca', 'vespa', 'lucciola']);

/** SCHEDA del boss (stessi campi di SCHEDE_B6). TESTI DA APPROVARE DALL'AUTORE. */
const SCHEDA_D6 = Object.freeze({
  id: 'guardiano-acque', nome: 'Il Guardiano delle Acque', tipo: 'guardiano', pattern: 'piena_guardiano',
  hpBase: 205, speed: 0.8, raggio: 18, ombra: Object.freeze([24, 8]),
  presentazione: TESTI_D6.presentazione,
  sconfitta: TESTI_D6.sconfitta,
  segno: Object.freeze({ sprite: 'segnoTridenteD6', nome: 'Guardiano delle Acque' }),
  foglio: Object.freeze({ nome: 'guardiano-acque', altezza: 74, piedi: 8, pose: Object.freeze({
    scivola: 'muove', gonfia: 'anticipo', rigonfia: 'anticipo', getto: 'attacco', alzaTridente: 'evoca',
    immerge: 'immerge', emerge: 'emerge', secca: 'fermo', cambiaFase: 'colpito' }) }),
});

/**
 * BOSS_D6 — numeri dell'IA del Guardiano. Una chiave <nome>Fase2 sostituisce <nome> sotto la soglia della fase 2.
 * Sequenza: GETTO (si inarca, punta l'otre: una fila di gocce che spazza) → PIENA (alza il tridente: l'acqua
 * dei condotti sale e allaga l'arena; lui s'immerge e riemerge altrove con una corona di gocce) → GETTO
 * nell'arena allagata → SECCA (abbassa il tridente: l'acqua cala, lui resta a secco: la finestra).
 * Fase 2: due getti di fila (il secondo spazza al contrario), due emersioni, corrente più forte.
 */
const BOSS_D6 = Object.freeze({
  sogliaFase2: 0.5,
  dannoHalf: 2,
  tettoProiettili: 26,
  bannerTick: 250,
  sequenza: Object.freeze(['getto', 'piena', 'getto', 'secca']),
  moltVelFase2: 1.25,
  scivola: Object.freeze({ tick: 80, tickFase2: 58, passo: 0.75, distanzaPx: 122, giro: 0.6 }),
  getto: Object.freeze({ anticipoTick: 38, anticipoTickFase2: 31, bloccoTick: 10, colpi: 9, colpiFase2: 11, intervalloTick: 4,
    spazzata: 0.55, velocita: 2.5, getti: 1, gettiFase2: 2, pausaTick: 24 }),
  piena: Object.freeze({ anticipoTick: 50, sottoTick: 46, emergeTick: 28, emersioni: 1, emersioniFase2: 2, corona: 10, coronaFase2: 14,
    velocita: 1.9, distanzaPx: 112, soglia: 0.5, saleTick: 50, calaTick: 54, rallenta: 0.74, spinta: 0.3, spintaFase2: 0.42 }),
  seccaTick: 124, seccaTickFase2: 92,
  cambioFaseTick: 56,
  anime: Object.freeze({ numero: 12, durataTick: 110, salita: 0.45, colori: Object.freeze(['#7dd3fc', '#f9cb40', '#bfe6fb', '#fde68a', '#e0f2fe']) }),
});

/**
 * STATI_D6 — tabella esplicita della macchina a stati (come STATI_B6):
 *   inizio  stato iniziale;
 *   mosse   mossa della sequenza (BOSS_D6.sequenza) → stato d'anticipo con cui comincia;
 *   stati   stato → { durata: chiave di BOSS_D6 (null = la calcola l'azione d'ingresso), poi: stato successivo
 *                     ('prossima' = la mossa successiva), ripeti: stato in cui tornare finché restano ripetizioni }.
 * 'cambiaFase' interrompe qualunque altro stato quando la vita scende sotto la soglia della fase 2.
 */
const STATI_D6 = Object.freeze({
  inizio: 'scivola',
  mosse: Object.freeze({ getto: 'gonfia', piena: 'alzaTridente', secca: 'secca' }),
  stati: Object.freeze({
    scivola: Object.freeze({ durata: 'scivola.tick', poi: 'prossima' }),
    gonfia: Object.freeze({ durata: 'getto.anticipoTick', poi: 'getto' }),              // anticipo: inarcato, l'otre in spalla si gonfia
    getto: Object.freeze({ durata: null, poi: 'scivola', ripeti: 'rigonfia' }),         // (colpi − 1) × intervalloTick
    rigonfia: Object.freeze({ durata: 'getto.pausaTick', poi: 'getto' }),               // anticipo del secondo getto (fase 2)
    alzaTridente: Object.freeze({ durata: 'piena.anticipoTick', poi: 'immerge' }),      // anticipo: tridente alzato a due mani, l'acqua sale
    immerge: Object.freeze({ durata: 'piena.sottoTick', poi: 'emerge' }),               // sott'acqua: non si colpisce e non ferisce
    emerge: Object.freeze({ durata: 'piena.emergeTick', poi: 'scivola', ripeti: 'immerge' }), // corona di gocce
    secca: Object.freeze({ durata: 'seccaTick', poi: 'scivola' }),                      // finestra: l'acqua cala, resta a secco
    cambiaFase: Object.freeze({ durata: 'cambioFaseTick', poi: 'scivola' }),
  }),
});

/** Colori del disegno «a ombre»: china, bordo di lanterna, oro e rosso, più l'acqua del condotto. */
const TINTE_D6 = Object.freeze({
  china: '#0d0907', china2: '#1d1610', bordo: '#c9a15a', oro: '#f9cb40', rosso: '#e53222', lampo: '#fff3d6',
  acqua: '#7dd3fc', schiuma: '#e0f2fe', fondo: '#0d2a3d', fondo2: '#123a52', tufo: '#a08a5c', tufoOmbra: '#5e5034',
  drappo: '#8f160c', drappoOmbra: '#5c120a', ferro: '#2a2622',
});

// Icona 12×12 del segno di completamento (stessa palette degli oggetti).
SPRITE_OGGETTI.segnoTridenteD6 = ['............', '..y..y..y...', '..y..y..y...', '..y..y..y...', '..yyyyyyy...', '.....y......',
  '.....y......', '.....y......', '.....y......', '....kyk.....', '............', '............'];

// Catalogo e segni: il Guardiano entra in POOL_BOSS (il catalogo di tutti i boss) e in SEGNI_A6.
if (!POOL_BOSS.some((x) => x.id === SCHEDA_D6.id)) {
  POOL_BOSS.push({ id: SCHEDA_D6.id, nome: SCHEDA_D6.nome, tipo: SCHEDA_D6.tipo, hpBase: SCHEDA_D6.hpBase, speed: SCHEDA_D6.speed, pattern: SCHEDA_D6.pattern });
}
if (typeof SEGNI_A6 !== 'undefined' && Array.isArray(SEGNI_A6) && !Object.isFrozen(SEGNI_A6) && !SEGNI_A6.some((s) => s.boss === SCHEDA_D6.id)) {
  SEGNI_A6.push(Object.freeze({ boss: SCHEDA_D6.id, sprite: SCHEDA_D6.segno.sprite, nome: SCHEDA_D6.segno.nome }));
}

// ===========================================================================
// STATO DEL MODULO
// ===========================================================================
const d6 = {
  pavimento: null, pavimentoScala: 0,                     // tela del pavimento e della scenografia (statica)
  vento: { fase: 'calma', t: 0, dir: 1, forza: 0 },       // la raffica nella stanza corrente
  rumore: null,                                           // buffer di rumore per i suoni
  anime: [],                                              // dissolvenza del Guardiano sconfitto
};

const limitaD6 = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Il piano è (o sarà) l'Acquedotto Carolino in questa run?
 * @param {number} [piano] piano assoluto; senza argomento, quello in corso
 */
function acquedottoAttivoD6(piano = statoRun.piano) {
  const m = statoRun.percorsoD6;
  return Boolean(m && m[piano] === 'acquedotto');
}

/** Segna il piano come Acquedotto (o lo toglie) senza andarci. */
function segnaAcquedottoD6(piano, si = true) {
  const m = Object.assign({}, statoRun.percorsoD6);
  if (si) m[piano] = 'acquedotto'; else delete m[piano];
  statoRun.percorsoD6 = m;
}

/** Scende nel condotto: il piano successivo è l'Acquedotto. */
function prendiAcquedottoD6() {
  const prossimo = statoRun.piano + 1;
  segnaAcquedottoD6(prossimo, true);
  suonoAcquaD6(0.5);
  avviaPiano(prossimo, true);
}

// ===========================================================================
// SUONI (Web Audio procedurale sul contesto di AudioSys; rispettano il muto)
// ===========================================================================
function rumoreD6(c) {
  if (d6.rumore && d6.rumore.sampleRate === c.sampleRate) return d6.rumore;
  const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = b.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = (s / 4294967296) * 2 - 1; }
  d6.rumore = b;
  return b;
}

/** Rumore filtrato con inviluppo: `da`→`a` Hz in `sec` secondi. */
function soffioD6(sec, da, a, vol, q = 1.2) {
  const c = AudioSys.ctx;
  if (!c || !AudioSys.attivo) return;
  try {
    const t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = rumoreD6(c); src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(da, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, a), t + sec);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0008, t);
    g.gain.exponentialRampToValueAtTime(vol, t + sec * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0008, t + sec);
    src.connect(f); f.connect(g); g.connect(AudioSys.uscita || c.destination);
    src.start(t); src.stop(t + sec + 0.05);
  } catch (_) { /* l'audio non deve mai fermare il gioco */ }
}

/** Il fischio della raffica (annuncio + raffica). */
function suonoVentoD6() {
  const V = ACQUEDOTTO_D6.vento;
  soffioD6((V.annuncioTick + V.rafficaTick) / 60, 260, 880, 0.07, 2.2);
}

/** Uno scroscio d'acqua (grata, saracinesca, emersione). */
function suonoAcquaD6(sec = 0.3) { soffioD6(sec, 1800, 420, 0.06, 0.8); }

// ===========================================================================
// 1. LA SCELTA: la grata del condotto nella stanza del boss del piano 1
// ===========================================================================
const pianoNelCicloD6 = (piano = statoRun.piano) => ((Math.max(1, piano || 1) - 1) % 4) + 1;

/** La grata della stanza corrente, se c'è. */
function grataQuiD6() {
  const st = statoRun.stanzaCorrente;
  return st && st.tipo === 'boss' && st.pulita && st.grataD6 ? st.grataD6 : null;
}

/**
 * [E] accanto alla grata: la apre (una chiave) o ci scende. Rende true se ha consumato l'azione.
 * @returns {boolean}
 */
function usaGrataD6() {
  if (statoRun.fase !== 'in_gioco' || statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo) return false;
  const g = grataQuiD6();
  if (!g) return false;
  const G = ACQUEDOTTO_D6.grata;
  if (Math.hypot(player.x - G.x, player.y - G.y) >= G.raggio) return false;
  if (!g.aperta) {
    if ((statoRun.chiavi || 0) < G.chiavi) { mostraBanner(TESTI_D6.serveChiave(G.chiavi), 160); return true; }
    if (typeof aggiungiChiavi === 'function') aggiungiChiavi(-G.chiavi); else statoRun.chiavi -= G.chiavi;
    g.aperta = true; g.t0 = tick; g.pagata = true;
    suonoAcquaD6(0.45);
    if (typeof AudioSys.playCampana === 'function') AudioSys.playCampana();
    mostraBanner(TESTI_D6.grataAperta, 200);
    return true;
  }
  prendiAcquedottoD6();
  return true;
}

const interagisciStanzaBaseD6 = interagisciStanza;
/** [E]: prima la grata del condotto (se ci sei accanto), poi tutto il resto. */
interagisciStanza = function (...args) {
  try { if (usaGrataD6()) return undefined; } catch (err) { console.error('[d6] grata', err); }
  return interagisciStanzaBaseD6.apply(this, args);
};

// Click (e tocco breve) sulla grata: come per i piedistalli, ci si porta accanto e si usa.
window.addEventListener('mousedown', (e) => {
  try {
    if (e.target !== canvas || statoRun.pausa || !grataQuiD6()) return;
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height);
    const G = ACQUEDOTTO_D6.grata;
    if (Math.hypot(mx - G.x, my - G.y) >= G.raggioClick) return;
    player.x = G.x; player.y = G.y + 14; player.targetX = null; player.targetY = null;
    if (usaGrataD6()) e.stopImmediatePropagation();
  } catch (err) { console.error('[d6] click', err); }
}, true);

const verificaStanzaPulitaBaseD6 = verificaStanzaPulita;
/** Boss del piano 1 caduto: compare la grata. Guardiano caduto: frase, anime, dono, l'acqua cala. */
verificaStanzaPulita = function (...args) {
  const st = statoRun.stanzaCorrente;
  const era = Boolean(st && st.pulita);
  const r = verificaStanzaPulitaBaseD6.apply(this, args);
  try {
    if (st && !era && st.pulita && st.tipo === 'boss' && st.uscitaAperta) {
      if (pianoNelCicloD6() === ACQUEDOTTO_D6.pianoGrata && !st.grataD6) {
        const gratis = (st.persiD6 || 0) <= ACQUEDOTTO_D6.grata.mezzeGratis;
        st.grataD6 = { aperta: gratis, gratis, t0: tick };
        mostraBanner(`${statoRun.banner || ''} ${gratis ? TESTI_D6.bannerGrataGratis : TESTI_D6.bannerGrata(ACQUEDOTTO_D6.grata.chiavi)}`.trim(), 320);
      }
      const b = st.nemici.find((n) => n.boss && n.bossId === SCHEDA_D6.id);
      if (b) guardianoSconfittoD6(st, b);
    }
  } catch (err) { console.error('[d6] stanza pulita', err); }
  return r;
};

/** Disegna la grata e il suo cartiglio (dentro la catena di disegnaStanzaPixelArt: sotto le figure). */
function disegnaGrataD6(g, tk) {
  const G = ACQUEDOTTO_D6.grata, x = G.x, y = G.y;
  const apre = g.aperta ? Math.min(1, (tk - (g.t0 || 0)) / 30) : 0;
  ctx.save();
  // bocca di tufo
  ctx.fillStyle = TINTE_D6.tufoOmbra; ctx.strokeStyle = TINTE_D6.bordo; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.rect(x - 25, y - 20, 50, 40); ctx.fill(); ctx.stroke();
  ctx.fillStyle = TINTE_D6.china; ctx.fillRect(x - 21, y - 16, 42, 32);
  // l'acqua in fondo
  const gr = ctx.createLinearGradient(0, y - 16, 0, y + 16);
  gr.addColorStop(0, TINTE_D6.fondo); gr.addColorStop(1, TINTE_D6.fondo2);
  ctx.fillStyle = gr; ctx.fillRect(x - 21, y - 16 + 10 * (1 - apre), 42, 32 - 10 * (1 - apre));
  ctx.strokeStyle = TINTE_D6.acqua; ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const yy = y - 4 + i * 7, sx = ((tk * 0.5 + i * 13) % 30) - 15;
    ctx.moveTo(x + sx - 5, yy); ctx.lineTo(x + sx + 5, yy);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  // gradini (si vedono quando è aperta)
  if (apre > 0) {
    ctx.fillStyle = TINTE_D6.tufo; ctx.globalAlpha = 0.85 * apre;
    for (let i = 0; i < 3; i++) ctx.fillRect(x - 21, y - 16 + i * 5, 14 - i * 4, 3);
    ctx.globalAlpha = 1;
  }
  // sbarre: chiuse stanno dritte, aperte ruotano sul cardine di sinistra
  ctx.save();
  ctx.translate(x - 21, y);
  ctx.transform(1 - 0.82 * apre, 0, 0, 1, 0, 0);
  ctx.strokeStyle = TINTE_D6.ferro; ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) { ctx.moveTo(i * 7, -16); ctx.lineTo(i * 7, 16); }
  ctx.moveTo(0, -8); ctx.lineTo(42, -8); ctx.moveTo(0, 8); ctx.lineTo(42, 8);
  ctx.stroke();
  ctx.strokeStyle = TINTE_D6.bordo; ctx.lineWidth = 0.6; ctx.globalAlpha = 0.7;
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) { ctx.moveTo(i * 7 - 1, -16); ctx.lineTo(i * 7 - 1, 16); }
  ctx.stroke();
  ctx.restore();
  // lucchetto
  if (!g.aperta) {
    const ly = y + 1 + Math.sin(tk * 0.08) * 0.8;
    ctx.strokeStyle = TINTE_D6.oro; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, ly - 4, 3.6, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = TINTE_D6.oro; ctx.strokeStyle = TINTE_D6.china; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.rect(x - 5, ly - 4, 10, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TINTE_D6.china; ctx.fillRect(x - 0.8, ly - 1.5, 1.6, 3.2);
  }
  // cartiglio col nome del luogo
  const cw = 156, ch = 25, cx = x - cw / 2, cy = y - 20 - ch - 6;
  ctx.fillStyle = '#e6d2aa'; ctx.strokeStyle = '#5c4024'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.fill();
  ctx.strokeRect(cx + 2, cy + 2, cw - 4, ch - 4);
  ctx.fillStyle = '#e6d2aa';
  ctx.beginPath(); ctx.moveTo(x - 5, cy + ch); ctx.lineTo(x, cy + ch + 5); ctx.lineTo(x + 5, cy + ch); ctx.closePath(); ctx.fill();
  drawTextFit(TESTI_D6.cartiglioLuogo, x, cy + 10, cw - 10, { size: 8, color: '#5c1a0c', shadow: false });
  drawTextFit(g.aperta ? TESTI_D6.cartiglioAperta : TESTI_D6.cartiglioChiusa(G.chiavi), x, cy + 20, cw - 10,
    { size: 7, color: g.aperta ? '#14532d' : '#451a03', shadow: false });
  ctx.restore();
}

// ===========================================================================
// 2. IL QUARTIERE: voce, sipario, pavimento e scenografia dipinta
// ===========================================================================
const getQuartierePianoBaseD6 = getQuartierePiano;
/** Il quartiere del piano: l'Acquedotto se il percorso della run lo dice, altrimenti quello di sempre. */
getQuartierePiano = function (piano, ...resto) {
  if (acquedottoAttivoD6(piano)) return QUARTIERE_D6;
  return getQuartierePianoBaseD6.call(this, piano, ...resto);
};

const getRaccontoAttoBaseD6 = getRaccontoAtto;
/** Cartellone d'ingresso del piano: quello dell'Acquedotto quando ci si entra. */
getRaccontoAtto = function (piano, ciclo, ...resto) {
  const base = getRaccontoAttoBaseD6.call(this, piano, ciclo, ...resto);
  try {
    if (base && acquedottoAttivoD6(piano)) {
      const D = QUARTIERE_D6.descrizioneSipario;
      return { ...base, atto: TESTI_D6.atto(piano, numeroStanzeCombattimento(piano)), titolo: D.titolo, testo1: D.testo1, testo2: D.testo2, testo3: D.testo3 };
    }
  } catch (err) { console.error('[d6] sipario', err); }
  return base;
};

/** Generatore deterministico per le trame dipinte. */
function casoFissoD6(seme) {
  let s = seme >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 16) / 65536; };
}

/** FONDALE: cielo notturno, monti e i Ponti della Valle (tre ordini di archi), sulla fascia alta del muro. */
function dipingiFondaleD6(x, r) {
  const y0 = 52, y1 = 70;
  const cielo = x.createLinearGradient(0, y0, 0, y1);
  cielo.addColorStop(0, '#081226'); cielo.addColorStop(1, '#1d3358');
  x.fillStyle = cielo; x.fillRect(48, y0, 544, y1 - y0);
  for (let i = 0; i < 46; i++) {
    x.fillStyle = r() < 0.3 ? '#fff3d6' : '#8fa6cf';
    x.fillRect(Math.round(50 + r() * 540), Math.round(y0 + 1 + r() * 8), 1, 1);
  }
  // luna calante
  x.fillStyle = '#f3e7c0'; x.beginPath(); x.arc(548, 58, 3.4, 0, TAU); x.fill();
  x.fillStyle = '#0c1830'; x.beginPath(); x.arc(546.4, 57.2, 3, 0, TAU); x.fill();
  // monti lontani, poi le due spalle della valle
  x.fillStyle = '#16284a';
  x.beginPath(); x.moveTo(170, y1); x.lineTo(232, 63); x.lineTo(286, 66); x.lineTo(338, 61.5); x.lineTo(402, 65.5); x.lineTo(470, y1); x.closePath(); x.fill();
  x.fillStyle = '#0a1426';
  x.beginPath(); x.moveTo(48, y1); x.lineTo(48, 57); x.lineTo(84, 54.5); x.lineTo(124, 58.5); x.lineTo(168, 64); x.lineTo(214, y1); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(592, y1); x.lineTo(592, 56); x.lineTo(566, 61); x.lineTo(524, 60); x.lineTo(476, 65); x.lineTo(428, y1); x.closePath(); x.fill();
  // il ponte: tre ordini, il più alto è il più lungo
  const ordini = [{ y: 56.5, h: 4.5, xa: 118, xb: 522, passo: 7 }, { y: 61, h: 4.5, xa: 150, xb: 490, passo: 7 }, { y: 65.5, h: 4.5, xa: 186, xb: 454, passo: 7 }];
  for (const o of ordini) {
    x.fillStyle = TINTE_D6.tufo; x.fillRect(o.xa, o.y, o.xb - o.xa, o.h);
    x.fillStyle = '#cdb98a'; x.fillRect(o.xa, o.y, o.xb - o.xa, 0.7); // il filo di luna sul cornicione
    x.fillStyle = '#0c1830';
    for (let ax = o.xa + 2; ax + 4.4 < o.xb; ax += o.passo) {
      x.beginPath(); x.moveTo(ax, o.y + o.h); x.lineTo(ax, o.y + 2.6); x.arc(ax + 2.2, o.y + 2.6, 2.2, Math.PI, 0); x.lineTo(ax + 4.4, o.y + o.h); x.closePath(); x.fill();
    }
  }
  // il listello della tela dipinta
  x.fillStyle = TINTE_D6.china; x.fillRect(48, y1 - 0.6, 544, 1.6);
  x.fillStyle = TINTE_D6.bordo; x.globalAlpha = 0.7; x.fillRect(48, y1 + 0.4, 544, 0.6); x.globalAlpha = 1;
}

/** QUINTA dipinta: un pilone coi tre ordini di archi (la porta laterale cade dentro l'arco di mezzo). */
function dipingiQuintaD6(x, x0, r) {
  const w = 20;
  x.fillStyle = '#4a3f2a'; x.fillRect(x0, 70, w, 234);
  // corsi di tufo
  for (let yy = 72; yy < 304; yy += 6) {
    x.fillStyle = r() < 0.5 ? '#54482f' : '#42381f';
    x.fillRect(x0, yy, w, 5);
    x.fillStyle = '#2a2315';
    const sf = (Math.floor(yy / 6) % 2) * 5;
    for (let bx = x0 + sf; bx < x0 + w; bx += 10) x.fillRect(bx, yy, 0.8, 5);
  }
  for (const yA of [74, 152, 230]) {
    const cx = x0 + w / 2, alto = yA + 12, basso = yA + 70;
    const notte = x.createLinearGradient(0, alto - 6, 0, basso);
    notte.addColorStop(0, '#0a1630'); notte.addColorStop(1, '#16294a');
    x.fillStyle = notte;
    x.beginPath(); x.moveTo(cx - 6, basso); x.lineTo(cx - 6, alto); x.arc(cx, alto, 6, Math.PI, 0); x.lineTo(cx + 6, basso); x.closePath(); x.fill();
    x.strokeStyle = TINTE_D6.bordo; x.globalAlpha = 0.55; x.lineWidth = 0.8; x.stroke(); x.globalAlpha = 1;
    x.fillStyle = '#cdb98a'; x.fillRect(cx - 1.2, alto - 8.4, 2.4, 2.6); // chiave dell'arco
    x.fillStyle = '#8fa6cf'; x.fillRect(Math.round(cx - 3 + r() * 6), Math.round(alto + 4 + r() * 20), 1, 1);
    x.fillStyle = '#2a2315'; x.fillRect(x0, yA + 72, w, 1.4); // cornicione fra gli ordini
    x.fillStyle = '#6b5a3a'; x.fillRect(x0, yA + 73.4, w, 0.8);
  }
  // il bordo della quinta (tela su telaio)
  x.fillStyle = TINTE_D6.china; x.fillRect(x0 === 48 ? x0 + w - 1 : x0, 70, 1.2, 234);
}

/** Tela del pavimento e della scenografia dell'Acquedotto, alla risoluzione del buffer (statica). */
function telaPavimentoD6() {
  if (d6.pavimento && d6.pavimentoScala === scalaBase) return d6.pavimento;
  const q = QUARTIERE_D6;
  const fc = document.createElement('canvas');
  fc.width = Math.round(W * scalaBase);
  fc.height = Math.round(H * scalaBase);
  const x = fc.getContext('2d');
  x.setTransform(scalaBase, 0, 0, scalaBase, 0, 0);
  x.imageSmoothingEnabled = false;
  const r = casoFissoD6(1845 * 7 + 2);
  x.fillStyle = q.coloreSfondo; x.fillRect(0, 0, W, H);
  x.fillStyle = q.coloreMuroInterno; x.fillRect(48, 52, W - 96, H - 96);

  // lastre di tufo a corsi sfalsati
  x.save();
  x.beginPath(); x.rect(68, 70, 504, 234); x.clip();
  const col = q.coloriPiastrelle;
  let riga = 0;
  for (let ty = 70; ty < 304; ty += 16, riga++) {
    for (let tx = 68 - (riga % 2) * 12; tx < 572; tx += 24) {
      x.fillStyle = col[Math.floor(r() * col.length)];
      x.fillRect(tx, ty, 24, 16);
      x.fillStyle = q.coloreFughe;
      x.fillRect(tx, ty + 15, 24, 1); x.fillRect(tx + 23, ty, 1, 16);
      if (r() < 0.4) { x.fillStyle = q.coloreRiflesso; x.globalAlpha = 0.5; x.fillRect(tx + 1, ty + 1, 9, 1); x.globalAlpha = 1; }
      if (r() < 0.3) { x.fillStyle = r() < 0.5 ? q.coloreMuschio : '#2f3a1a'; x.fillRect(tx + 2 + Math.floor(r() * 14), ty + 13, 5, 2); }
      if (r() < 0.22) { x.fillStyle = '#231d12'; x.fillRect(tx + 5 + Math.floor(r() * 12), ty + 4 + Math.floor(r() * 7), 2, 1); }
      if (r() < 0.1) { x.fillStyle = '#5a4c33'; x.fillRect(tx + 4 + Math.floor(r() * 14), ty + 5 + Math.floor(r() * 6), 2, 2); }
    }
  }
  // chiazze d'umido lasciate dagli spruzzi
  for (let i = 0; i < 9; i++) {
    x.fillStyle = 'rgba(10, 22, 34, 0.26)';
    x.beginPath(); x.ellipse(90 + r() * 460, 86 + r() * 200, 16 + r() * 22, 6 + r() * 8, 0, 0, TAU); x.fill();
  }
  x.restore();

  dipingiFondaleD6(x, r);
  dipingiQuintaD6(x, 48, r);
  dipingiQuintaD6(x, 572, r);
  // parapetto di tufo in basso
  x.fillStyle = '#2a2315'; x.fillRect(48, 304, 544, 12);
  for (let bx = 50; bx < 590; bx += 18) { x.fillStyle = r() < 0.5 ? '#54482f' : '#463c26'; x.fillRect(bx, 306, 16, 8); }
  x.fillStyle = TINTE_D6.bordo; x.globalAlpha = 0.45; x.fillRect(48, 304, 544, 0.7); x.globalAlpha = 1;
  x.strokeStyle = q.coloreBordoMuro; x.lineWidth = 2; x.strokeRect(48, 52, W - 96, H - 96);

  d6.pavimento = fc; d6.pavimentoScala = scalaBase;
  return fc;
}

const getFloorTileCanvasBaseD6 = getFloorTileCanvas;
/** Pavimento del piano: quello di tufo se il piano è l'Acquedotto. */
getFloorTileCanvas = function (piano, ...resto) {
  try { if (acquedottoAttivoD6(piano || statoRun.piano)) return telaPavimentoD6(); } catch (err) { console.error('[d6] pavimento', err); }
  return getFloorTileCanvasBaseD6.call(this, piano, ...resto);
};

// --------------------------------------------------------------------------- resa del luogo
/** Un canale: letto scuro, cordoli col filo di lanterna, onde che corrono nel verso della corrente. */
function disegnaCanaleD6(c, tk) {
  const oriz = c.dx !== 0;
  ctx.fillStyle = TINTE_D6.fondo; ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.fillStyle = TINTE_D6.fondo2;
  if (oriz) ctx.fillRect(c.x, c.y + c.h * 0.3, c.w, c.h * 0.4); else ctx.fillRect(c.x + c.w * 0.3, c.y, c.w * 0.4, c.h);
  // cordoli
  ctx.fillStyle = TINTE_D6.tufoOmbra;
  if (oriz) { ctx.fillRect(c.x, c.y - 2, c.w, 2.4); ctx.fillRect(c.x, c.y + c.h - 0.4, c.w, 2.4); }
  else { ctx.fillRect(c.x - 2, c.y, 2.4, c.h); ctx.fillRect(c.x + c.w - 0.4, c.y, 2.4, c.h); }
  ctx.fillStyle = TINTE_D6.bordo; ctx.globalAlpha = 0.6;
  if (oriz) { ctx.fillRect(c.x, c.y - 2, c.w, 0.7); ctx.fillRect(c.x, c.y + c.h + 1.3, c.w, 0.7); }
  else { ctx.fillRect(c.x - 2, c.y, 0.7, c.h); ctx.fillRect(c.x + c.w + 1.3, c.y, 0.7, c.h); }
  ctx.globalAlpha = 1;
  // la corrente: piccole «V» di schiuma che scorrono
  const lung = oriz ? c.w : c.h, larg = oriz ? c.h : c.w, verso = oriz ? c.dx : c.dy;
  const n = Math.max(6, Math.round(lung / 34));
  ctx.strokeStyle = TINTE_D6.acqua; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const corsia = 4 + ((i * 7) % Math.max(1, Math.round(larg - 8)));
    let s = ((i * 53 + tk * 1.25) % lung + lung) % lung;
    if (verso < 0) s = lung - s;
    const a = 3.2 * verso;
    if (oriz) { const px = c.x + s, py = c.y + corsia; ctx.moveTo(px - a, py - 2.2); ctx.lineTo(px, py); ctx.lineTo(px - a, py + 2.2); }
    else { const px = c.x + corsia, py = c.y + s; ctx.moveTo(px - 2.2, py - a); ctx.lineTo(px, py); ctx.lineTo(px + 2.2, py - a); }
  }
  ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
  if (c.giratoD6 !== undefined && tk >= c.giratoD6 && tk - c.giratoD6 < 40) { // la saracinesca ha appena girato
    ctx.fillStyle = TINTE_D6.schiuma; ctx.globalAlpha = 0.4 * (1 - (tk - c.giratoD6) / 40);
    ctx.fillRect(c.x, c.y, c.w, c.h); ctx.globalAlpha = 1;
  }
  // schiuma dove l'acqua esce
  ctx.fillStyle = TINTE_D6.schiuma; ctx.globalAlpha = 0.7;
  for (let i = 0; i < 5; i++) {
    const k = (tk * 0.11 + i * 0.37) % 1, lato = ((i * 5) % Math.max(1, Math.round(larg - 6))) + 3;
    const fx = oriz ? (verso > 0 ? c.x + c.w - 2 - k * 7 : c.x + 2 + k * 7) : c.x + lato;
    const fy = oriz ? c.y + lato : (verso > 0 ? c.y + c.h - 2 - k * 7 : c.y + 2 + k * 7);
    ctx.fillRect(fx - 0.8, fy - 0.8, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
}

/** Fiaccola di ferro al muro: la fiamma si piega col vento (`piega` −1..1). */
function disegnaFiaccolaD6(x, y, piega, tk) {
  ctx.strokeStyle = TINTE_D6.ferro; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x, y + 1); ctx.stroke();
  ctx.fillStyle = TINTE_D6.ferro; ctx.strokeStyle = TINTE_D6.bordo; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(x - 4, y - 1); ctx.lineTo(x + 4, y - 1); ctx.lineTo(x + 2.4, y + 3); ctx.lineTo(x - 2.4, y + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  const trema = Math.sin(tk * 0.45 + x) * 0.9;
  const px = x + piega * 9 + trema * (0.4 + Math.abs(piega)), py = y - 9 + Math.abs(piega) * 5.5;
  ctx.fillStyle = '#ea8626';
  ctx.beginPath(); ctx.moveTo(x - 3, y - 1); ctx.quadraticCurveTo(x - 3.5 + piega * 3, y - 6, px, py); ctx.quadraticCurveTo(x + 3.5 + piega * 3, y - 5, x + 3, y - 1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = TINTE_D6.oro;
  ctx.beginPath(); ctx.moveTo(x - 1.7, y - 1); ctx.quadraticCurveTo(x - 1.6 + piega * 2, y - 4, x + (px - x) * 0.6, y - 1 + (py - y + 1) * 0.6); ctx.quadraticCurveTo(x + 1.8 + piega * 2, y - 3.5, x + 1.7, y - 1); ctx.closePath(); ctx.fill();
}

/** Drappo appeso al listello del fondale: pende, ondeggia, col vento si stende di traverso. */
function disegnaDrappoD6(x, y, piega, tk, fase) {
  const lung = 17, seg = 4, larg = 9;
  const ang = piega * 1.15 + Math.sin(tk * 0.05 + fase) * 0.07 * (1 - Math.abs(piega));
  const batte = Math.abs(piega) > 0.3 ? Math.sin(tk * 0.7 + fase) * 1.3 * Math.abs(piega) : 0;
  ctx.fillStyle = TINTE_D6.ferro; ctx.fillRect(x - larg / 2 - 1.5, y - 1, larg + 3, 1.6);
  ctx.beginPath();
  const sx = [], dx = [];
  for (let i = 0; i <= seg; i++) {
    const k = i / seg, a = ang * (0.35 + 0.65 * k);
    const cx = x + Math.sin(a) * lung * k, cy = y + Math.cos(a) * lung * k + (i % 2 ? batte : -batte) * k;
    const nx = Math.cos(a) * larg / 2, ny = -Math.sin(a) * larg / 2;
    sx.push([cx - nx, cy - ny]); dx.push([cx + nx, cy + ny]);
  }
  ctx.moveTo(sx[0][0], sx[0][1]);
  for (let i = 1; i <= seg; i++) ctx.lineTo(sx[i][0], sx[i][1]);
  const pm = [(sx[seg][0] + dx[seg][0]) / 2 - Math.sin(ang) * 3, (sx[seg][1] + dx[seg][1]) / 2 - Math.cos(ang) * 3]; // coda di rondine
  ctx.lineTo(pm[0], pm[1]);
  for (let i = seg; i >= 0; i--) ctx.lineTo(dx[i][0], dx[i][1]);
  ctx.closePath();
  ctx.fillStyle = TINTE_D6.drappo; ctx.fill();
  ctx.strokeStyle = TINTE_D6.china; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.strokeStyle = TINTE_D6.oro; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo((sx[1][0] + dx[1][0]) / 2, (sx[1][1] + dx[1][1]) / 2); ctx.lineTo((sx[3][0] + dx[3][0]) / 2, (sx[3][1] + dx[3][1]) / 2); ctx.stroke();
}

const POSTI_SCENA_D6 = Object.freeze({ fiaccole: Object.freeze([150, 490]), drappi: Object.freeze([104, 232, 408, 536]), yFiaccola: 62, yDrappo: 71 });

const disegnaAtmosferaQuartiereBaseD6 = disegnaAtmosferaQuartiere;
/** Atmosfera del piano: all'Acquedotto canali, piena, fiaccole e drappi al posto delle lucciole della Villa. */
disegnaAtmosferaQuartiere = function (tk, piano, ...resto) {
  if (!acquedottoAttivoD6(piano)) return disegnaAtmosferaQuartiereBaseD6.call(this, tk, piano, ...resto);
  try { disegnaLuogoD6(tk, statoRun.stanzaCorrente); } catch (err) { console.error('[d6] atmosfera', err); }
  return undefined;
};

/** Tutto ciò che sta a filo del palco o sul muro: acqua, piena, fiaccole, drappi, velo freddo. */
function disegnaLuogoD6(tk, st) {
  const P = POSTI_SCENA_D6, v = d6.vento;
  const piega = v.dir * v.forza;
  ctx.save();
  if (st) {
    for (const c of st.canaliD6 || []) disegnaCanaleD6(c, tk);
    const A = st.acquaD6;
    if (A && A.livello > 0.01) {
      // la piena: un velo d'acqua su tutta l'arena, con le onde nel verso della corrente
      ctx.fillStyle = `rgba(22, 78, 112, ${(0.42 * A.livello).toFixed(3)})`;
      ctx.fillRect(68, 70, 504, 234);
      ctx.strokeStyle = TINTE_D6.acqua; ctx.lineWidth = 1; ctx.lineCap = 'round';
      ctx.globalAlpha = 0.42 * A.livello;
      ctx.beginPath();
      for (let i = 0; i < 34; i++) {
        let s = ((i * 61 + tk * 1.1) % 504 + 504) % 504;
        if (A.dir < 0) s = 504 - s;
        const px = 68 + s, py = 78 + ((i * 37) % 218), a = 3.4 * A.dir;
        ctx.moveTo(px - a, py - 2.4); ctx.lineTo(px, py); ctx.lineTo(px - a, py + 2.4);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  // le fiaccole prendono il posto dei bracieri di base (si ridipinge il pezzo di fondale sotto)
  const tela = telaPavimentoD6(), k = tela.width / W;
  for (const fx of P.fiaccole) {
    ctx.drawImage(tela, (fx - 13) * k, 52 * k, 26 * k, 18 * k, fx - 13, 52, 26, 18);
    disegnaFiaccolaD6(fx, P.yFiaccola, piega, tk);
  }
  P.drappi.forEach((dx, i) => disegnaDrappoD6(dx, P.yDrappo, piega, tk, i * 1.7));
  if (OPZIONI.vignetta !== false) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, 140, W / 2, H / 2, 330);
    vg.addColorStop(0, 'rgba(6, 12, 24, 0)');
    vg.addColorStop(1, 'rgba(6, 12, 24, 0.36)');
    ctx.fillStyle = vg; ctx.fillRect(48, 52, W - 96, H - 96);
  }
  ctx.restore();
}

/** Sopra le figure: le strisce della raffica, gli spruzzi dei canali, le gocce di chi è inzuppato. */
function disegnaAriaD6(tk, st) {
  const V = ACQUEDOTTO_D6.vento, v = d6.vento;
  ctx.save();
  if (v.forza > 0.12) {
    const n = Math.round(V.strisce * v.forza);
    ctx.strokeStyle = TINTE_D6.schiuma; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
    ctx.globalAlpha = 0.3 * v.forza;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      let s = ((i * 97 + tk * (6 + (i % 3) * 2)) % 520 + 520) % 520;
      if (v.dir < 0) s = 520 - s;
      const px = 60 + s, py = 80 + ((i * 53 + Math.floor(tk / 40) * 17) % 214), l = 14 + (i % 4) * 7;
      ctx.moveTo(px, py); ctx.quadraticCurveTo(px - v.dir * l * 0.5, py + Math.sin(i + tk * 0.1) * 1.5, px - v.dir * l, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // spruzzi: goccioline che saltano dai canali
  ctx.fillStyle = TINTE_D6.schiuma;
  for (const c of (st && st.canaliD6) || []) {
    const oriz = c.dx !== 0, lung = oriz ? c.w : c.h;
    for (let i = 0; i < 5; i++) {
      const k = ((tk + i * 23) % 46) / 46, s = (i * 131 + Math.floor((tk + i * 23) / 46) * 71) % lung;
      const alto = Math.sin(k * Math.PI) * 6;
      const px = oriz ? c.x + s : c.x + c.w / 2 + (i % 2 ? 6 : -6), py = oriz ? c.y + c.h / 2 + (i % 2 ? 5 : -5) : c.y + s;
      ctx.globalAlpha = 0.6 * (1 - k);
      ctx.fillRect(px + piegaVentoD6() * k * 8 - 0.7, py - alto - 0.7, 1.4, 1.4);
    }
  }
  ctx.globalAlpha = 1;
  // i panni bagnati della Lavandaia, in volo
  for (const p of (st && st.panniD6) || []) {
    ombraD6(p.x, p.y + 10, 6, 2.2, 0.4);
    ctx.fillStyle = TINTE_D6.acqua; ctx.globalAlpha = 0.7;
    ctx.fillRect(p.x - p.vx * 3 - 0.7, p.y - p.vy * 3 + 3, 1.4, 2); ctx.fillRect(p.x - p.vx * 6 - 0.7, p.y - p.vy * 6 + 6, 1.2, 1.8);
    ctx.globalAlpha = 1;
    pannoD6(p.x, p.y, Math.sin(p.rot) * 0.5, 1.35, tk + p.t, false);
  }
  if ((statoRun.inzuppatoD6 || 0) > 0) {
    ctx.fillStyle = TINTE_D6.acqua;
    for (let i = 0; i < 4; i++) {
      const k = ((tk * 0.05 + i * 0.25) % 1);
      ctx.globalAlpha = 0.85 * (1 - k);
      ctx.fillRect(player.x - 7 + i * 4.5, player.y - 22 + k * 20, 1.4, 2.6);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

const piegaVentoD6 = () => d6.vento.dir * d6.vento.forza;

const disegnaStanzaPixelArtBaseD6 = disegnaStanzaPixelArt;
/** Dopo la stanza: la grata del condotto (se c'è), sotto le figure. */
disegnaStanzaPixelArt = function (tk, st, ...resto) {
  const r = disegnaStanzaPixelArtBaseD6.call(this, tk, st, ...resto);
  try {
    if (st && st.tipo === 'boss' && st.pulita && st.grataD6) disegnaGrataD6(st.grataD6, tk);
    if (st && st.donoD6 && st.oggettoPiedistallo && !st.oggettoPiedistallo.preso) {
      const o = st.oggettoPiedistallo;
      drawPillLabel(TESTI_D6.dono, o.x, o.y + 60, 150, { size: 7.5, color: TINTE_D6.acqua, border: QUARTIERE_D6.bordoPillola }); // sotto il riquadro dell'effetto
    }
  } catch (err) { console.error('[d6] stanza', err); }
  return r;
};

const disegnaHUDPixelArtBaseD6 = disegnaHUDPixelArt;
/** Prima dell'HUD: l'aria del luogo (strisce, spruzzi) e le anime del Guardiano sconfitto. */
disegnaHUDPixelArt = function (st, ...resto) {
  try {
    if (acquedottoAttivoD6() && statoRun.fase === 'in_gioco') disegnaAriaD6(tick, st);
    const A = BOSS_D6.anime;
    for (let i = d6.anime.length - 1; i >= 0; i--) {
      const p = d6.anime[i];
      const eta = tick - p.t0;
      if (eta < 0) continue;
      if (eta > A.durataTick || !statoRun.stanzaCorrente || statoRun.stanzaCorrente.tipo !== 'boss') { d6.anime.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = 1 - eta / A.durataTick;
      puntoD6(p.x + Math.sin(eta * 0.08 + p.fase) * 6, p.y - eta * A.salita, 2.2, p.colore);
      puntoD6(p.x + Math.sin(eta * 0.08 + p.fase) * 6, p.y - eta * A.salita, 0.9, TINTE_D6.lampo);
      ctx.restore();
    }
  } catch (err) { console.error('[d6] aria', err); }
  return disegnaHUDPixelArtBaseD6.call(this, st, ...resto);
};

// ===========================================================================
// 3. LA REGOLA DEL LUOGO: l'acqua del condotto e la raffica
// ===========================================================================
/** Corrente nel punto (x, y) della stanza: il canale (o la piena del Guardiano), oppure null. */
function correnteInD6(st, x, y) {
  if (!st) return null;
  const A = st.acquaD6;
  if (A && A.livello >= BOSS_D6.piena.soglia) return A;
  const cs = st.canaliD6;
  if (cs) for (const c of cs) if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return c;
  return null;
}

/** Il nemico vola (ignora l'acqua)? */
function volaD6(n) {
  const T = NEMICI_D6[n.tipo];
  return Boolean((T && T.vola) || VOLANO_D6.includes(n.tipo) || n.comportamento === 'volo_puro' || (n.airZ || 0) > 8);
}

/** Spinge fuori dagli ostacoli solidi (come passoLogico di base) chi la corrente ci ha portato dentro. */
function fuoriDagliOstacoliD6(st, corpo, raggio) {
  for (const o of st.ostacoli || []) {
    if (o.tipo !== 'colonna' && o.tipo !== 'braciere' && o.tipo !== 'fossa') continue;
    const d = Math.hypot(corpo.x - o.x, corpo.y - o.y), rMin = (o.r || 0) + raggio;
    if (d < rMin && d > 0.01) { corpo.x = o.x + ((corpo.x - o.x) / d) * rMin; corpo.y = o.y + ((corpo.y - o.y) / d) * rMin; }
  }
}

/** Sceglie i canali di una stanza di combattimento (o nessuno). Non copre mai i chiodi del palco di b7. */
function scegliCanaliD6(st) {
  const C = ACQUEDOTTO_D6.canali;
  if (rng() >= C.probStanza) return null;
  const chiodi = (st.suoloB7 || []).filter((o) => o.tipo === 'spuntoni');
  const libera = (f) => f.canali.every((c) => chiodi.every((o) => o.x < c.x - (o.r || 8) || o.x > c.x + c.w + (o.r || 8) || o.y < c.y - (o.r || 8) || o.y > c.y + c.h + (o.r || 8)));
  const buone = C.forme.filter(libera);
  if (!buone.length) return null;
  let tot = 0;
  for (const f of buone) tot += f.peso;
  let t = rng() * tot, scelta = buone[buone.length - 1];
  for (const f of buone) { t -= f.peso; if (t < 0) { scelta = f; break; } }
  return scelta.canali.map((c) => { const s = rng() < 0.5 ? -1 : 1; return { x: c.x, y: c.y, w: c.w, h: c.h, dx: c.dx * s, dy: c.dy * s, forma: scelta.id }; });
}

/** L'acqua della stanza del Guardiano: livello 0..1, meta, verso e forza della corrente quando è alta. */
function nuovaAcquaD6() {
  const P = BOSS_D6.piena;
  return { livello: 0, meta: 0, dir: 1, dx: 1, dy: 0, rallenta: P.rallenta, spinta: P.spinta };
}

const generaMappaPianoBaseD6 = generaMappaPiano;
/** Mappa del piano: all'Acquedotto le stanze di combattimento prendono i canali, quella del boss i condotti. */
generaMappaPiano = function (piano, ...resto) {
  const m = generaMappaPianoBaseD6.call(this, piano, ...resto);
  try {
    if (m && acquedottoAttivoD6(piano)) {
      m.acquedottoD6 = true;
      for (const st of m.stanze) {
        if (st.tipo === 'normale') { const cs = scegliCanaliD6(st); if (cs) st.canaliD6 = cs; }
        else if (st.tipo === 'boss' && st.nemici.some((n) => n.bossId === SCHEDA_D6.id)) {
          st.canaliD6 = ACQUEDOTTO_D6.canali.boss.map((c) => ({ ...c, forma: 'boss' }));
          st.acquaD6 = nuovaAcquaD6();
        }
      }
    }
  } catch (err) { console.error('[d6] mappa', err); }
  return m;
};

/** Stato della raffica all'ingresso in una stanza: calma, con la prima attesa. */
function azzeraVentoD6() {
  const V = ACQUEDOTTO_D6.vento, v = d6.vento;
  v.fase = 'calma'; v.forza = 0; v.dir = 1;
  v.t = V.primaAttesaTick + Math.floor(rng() * (V.attesaMinTick - V.primaAttesaTick));
}

/** Piega un proiettile nel verso della raffica (fino al tetto). */
function piegaProiettileD6(p, dir, accel, tetto) {
  const gia = p.ventoD6 || 0;
  if (gia >= tetto) return;
  p.vx += dir * accel;
  p.ventoD6 = gia + accel;
}

/** Un tick della raffica: calma → annuncio (fiaccole e drappi) → raffica (i proiettili piegano) → calma. */
function aggiornaVentoD6(st) {
  const V = ACQUEDOTTO_D6.vento, v = d6.vento;
  const serve = !st.pulita && st.tipo !== 'boss' && st.nemici.some((n) => n.hp > 0);
  if (!serve && v.fase !== 'raffica') {
    v.fase = 'calma'; v.forza *= 0.94;
    if (v.t < V.primaAttesaTick) v.t = V.primaAttesaTick;
    return;
  }
  v.t--;
  if (v.fase === 'calma') {
    v.forza *= 0.94;
    if (v.t <= 0) { v.fase = 'annuncio'; v.t = V.annuncioTick; v.dir = rng() < 0.5 ? -1 : 1; suonoVentoD6(); }
  } else if (v.fase === 'annuncio') {
    v.forza = Math.min(V.forzaAnnuncio, v.forza + V.forzaAnnuncio / (V.annuncioTick * 0.6));
    if (v.t <= 0) { v.fase = 'raffica'; v.t = V.rafficaTick; }
  } else {
    v.forza = Math.min(1, v.forza + 0.07);
    for (const p of statoRun.proiettili) piegaProiettileD6(p, v.dir, V.accel, V.tetto);
    for (const p of statoRun.proiettiliNemici) piegaProiettileD6(p, v.dir, V.accel, V.tetto);
    for (const p of st.panniD6 || []) piegaProiettileD6(p, v.dir, V.accel * V.moltPanni, V.tetto * V.moltPanni);
    if (v.t <= 0) { v.fase = 'calma'; v.t = V.attesaMinTick + Math.floor(rng() * (V.attesaMaxTick - V.attesaMinTick)); }
  }
}

/** Prima del passo di base: le posizioni da cui misurare il passo di ognuno. */
function primaDelPassoD6(st) {
  for (const n of st.nemici) { n.pxD6 = n.x; n.pyD6 = n.y; n.ptD6 = n.phaseTick || 0; }
  return { x: player.x, y: player.y };
}

/** Dopo il passo di base: vento, acqua (giocatore, nemici, raccoglibili), livello della piena, IA del Guardiano. */
function dopoIlPassoD6(st, prima) {
  const C = ACQUEDOTTO_D6.canali;
  aggiornaVentoD6(st);

  // livello dell'acqua nella stanza del Guardiano
  const A = st.acquaD6;
  if (A) {
    if (!st.nemici.some((n) => n.boss && n.hp > 0)) A.meta = 0;
    const passo = A.meta > A.livello ? 1 / BOSS_D6.piena.saleTick : 1 / BOSS_D6.piena.calaTick;
    A.livello = limitaD6(A.livello + Math.sign(A.meta - A.livello) * Math.min(passo, Math.abs(A.meta - A.livello)), 0, 1);
  }

  // il giocatore: nell'acqua il passo si accorcia e la corrente spinge (chi vola la ignora); inzuppato va piano
  if (statoRun.inzuppatoD6 > 0) statoRun.inzuppatoD6--;
  const vola = Boolean(player.volo || statoRun.volo);
  const c = vola ? null : correnteInD6(st, player.x, player.y);
  let resta = c ? (c.rallenta || C.rallenta) : 1;
  if (statoRun.inzuppatoD6 > 0) resta = Math.min(resta, ACQUEDOTTO_D6.inzuppato.rallenta);
  if (resta < 1) {
    player.x = prima.x + (player.x - prima.x) * resta;
    player.y = prima.y + (player.y - prima.y) * resta;
  }
  if (c) {
    const f = c.spinta || C.spinta;
    player.x = limitaD6(player.x + c.dx * f, ARENA.x1, ARENA.x2);
    player.y = limitaD6(player.y + c.dy * f, ARENA.y1, ARENA.y2);
    fuoriDagliOstacoliD6(st, player, 9);
  }
  d6.inAcqua = Boolean(c);

  // i nemici a terra
  for (const n of st.nemici) {
    if (n.hp <= 0 || n.boss || volaD6(n) || massaNemico(n) === Infinity) continue;
    const cn = correnteInD6(st, n.x, n.y);
    if (!cn) continue;
    const rs = cn.rallenta || C.rallenta, f = cn.spinta ? cn.spinta * 0.8 : C.spintaNemici;
    n.x = limitaD6(n.pxD6 + (n.x - n.pxD6) * rs + cn.dx * f, ARENA.x1 + 14, ARENA.x2 - 14);
    n.y = limitaD6(n.pyD6 + (n.y - n.pyD6) * rs + cn.dy * f, ARENA.y1 + 14, ARENA.y2 - 14);
    fuoriDagliOstacoliD6(st, n, n.r || 10);
  }

  // i raccoglibili vanno con la corrente fino al muro
  const M = C.margineOggetti;
  for (const pk of st.oggettiATerra || []) {
    if (pk.x < ARENA.x1 || pk.x > ARENA.x2 || pk.y < ARENA.y1 || pk.y > ARENA.y2) continue; // in volo (b1): parcheggiati fuori scena
    const cp = correnteInD6(st, pk.x, pk.y);
    if (!cp) continue;
    pk.x = limitaD6(pk.x + cp.dx * C.spintaOggetti, ARENA.x1 + M, ARENA.x2 - M);
    pk.y = limitaD6(pk.y + cp.dy * C.spintaOggetti, ARENA.y1 + M, ARENA.y2 - M);
  }

  aggiornaPanniD6(st);
  if (statoRun.fase !== 'in_gioco' || statoRun.stanzaCorrente !== st) return;

  // il Guardiano agisce nei tick in cui la base ha fatto agire il boss (niente pausa, grazia, stordimento)
  for (const n of st.nemici) {
    if (!n.boss || n.bossId !== SCHEDA_D6.id || n.hp <= 0 || (n.phaseTick || 0) === n.ptD6) continue;
    if (statoRun.stanzaCorrente !== st || statoRun.fase !== 'in_gioco' || statoRun.hpHalf <= 0) break;
    try { iaGuardianoD6(n, st); } catch (err) { console.error('[d6] ia guardiano', err); }
  }
}

const passoLogicoBaseD6 = passoLogico;
/** Attorno al passo di base: le regole del luogo, e il conto delle Maschere perse contro il boss del piano 1. */
passoLogico = function (...args) {
  const st = statoRun.stanzaCorrente;
  const inGioco = Boolean(st) && statoRun.fase === 'in_gioco';
  const attivo = inGioco && acquedottoAttivoD6() && ticksCongelati <= 0
    && !(statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo || statoRun.pausa);
  const hpPrima = statoRun.hpHalf;
  let prima = null;
  if (attivo) { try { prima = primaDelPassoD6(st); } catch (err) { console.error('[d6] prima del passo', err); } }
  const r = passoLogicoBaseD6.apply(this, args);
  try {
    if (inGioco && st.tipo === 'boss' && statoRun.hpHalf < hpPrima) st.persiD6 = (st.persiD6 || 0) + (hpPrima - statoRun.hpHalf);
    if (prima && statoRun.fase === 'in_gioco' && statoRun.stanzaCorrente === st) dopoIlPassoD6(st, prima);
  } catch (err) { console.error('[d6] dopo il passo', err); }
  return r;
};

// ===========================================================================
// 4. I NEMICI DEL LUOGO
// ===========================================================================
/** Veste una stanza appena popolata: i nemici della Villa diventano quelli dell'Acquedotto, il boss il Guardiano. */
function vestiStanzaD6(s, piano) {
  const K = ACQUEDOTTO_D6.scala;
  const ciclo = Math.floor((piano - 1) / 4) + 1;
  const moltCiclo = Math.pow(K.moltCiclo, ciclo - 1);
  const moltVel = Math.min(K.velMax, 1 + (piano - 1) * K.velPerPiano);
  if (s.tipo === 'normale') {
    for (const n of s.nemici) {
      const nuovo = !n.boss && SOSTITUZIONI_D6[n.tipo];
      if (!nuovo) continue;
      const T = NEMICI_D6[nuovo];
      const hpC = n.champion === 'cremisi' ? K.hpCremisi : n.champion ? K.hpCampione : 1;
      n.tipo = nuovo; n.patternMob = nuovo;
      n.nome = n.champion ? `${T.nome} [Campione ${n.champion}]` : T.nome;
      n.maxHp = Math.round((T.hpBase + (piano - 1) * T.hpPiano) * moltCiclo * hpC);
      n.hp = n.maxHp;
      n.speed = T.vel * moltVel * (n.champion === 'dorato' ? K.velDorato : 1);
      n.r = T.raggio;
    }
  } else if (s.tipo === 'boss') {
    const b = s.nemici.find((n) => n.boss);
    const forzato = typeof b6 !== 'undefined' && b6 && b6.forzato;
    if (b && !forzato && b.bossId !== SCHEDA_D6.id && pianoNelCicloD6(piano) !== 4) {
      b.bossId = SCHEDA_D6.id; b.tipo = SCHEDA_D6.tipo; b.pattern = SCHEDA_D6.pattern;
      b.nome = ciclo > 1 ? `${SCHEDA_D6.nome} (Ciclo ${ciclo})` : SCHEDA_D6.nome;
      b.maxHp = Math.round((SCHEDA_D6.hpBase + (pianoNelCicloD6(piano) - 1) * K.hpBossPerPiano) * moltCiclo);
      b.hp = b.maxHp;
      b.speed = SCHEDA_D6.speed * moltVel;
      b.r = SCHEDA_D6.raggio;
    }
  }
}

const popolaStanzaBaseD6 = popolaStanza;
/** Dopo popolaStanza di base (e dei file prima di questo): all'Acquedotto si vestono nemici e boss del luogo. */
popolaStanza = function (s, piano, ...resto) {
  const r = popolaStanzaBaseD6.call(this, s, piano, ...resto);
  try { if (s && acquedottoAttivoD6(piano)) vestiStanzaD6(s, piano); } catch (err) { console.error('[d6] popola', err); }
  return r;
};

const massaNemicoBaseD6 = massaNemico;
/** Massa per le spinte: quella della tabella per i nemici del luogo. */
massaNemico = function (nem, ...resto) {
  const T = nem && !nem.boss ? NEMICI_D6[nem.tipo] : null;
  if (T && T.massa !== undefined) return T.massa;
  return massaNemicoBaseD6.call(this, nem, ...resto);
};

/** Sposta un nemico tenendolo nell'arena; rende true se ha toccato un muro. */
function muoviD6(n, dx, dy, margine = 14) {
  const x = n.x + dx, y = n.y + dy;
  n.x = limitaD6(x, ARENA.x1 + margine, ARENA.x2 - margine);
  n.y = limitaD6(y, ARENA.y1 + margine, ARENA.y2 - margine);
  return n.x !== x || n.y !== y;
}

/** IA dei nemici del luogo, per tipo: (n, st, ang, dist, T). Stati in n.statoD6, timer in n.tD6. */
const IA_D6 = {
  // RONDONE DI LATTA: plana in cerchio attorno al giocatore, poi PUNTA (ali chiuse all'indietro, il becco
  // segue il bersaglio e si blocca) e scende in PICCHIATA dritta; RISALE piano. Quando parte la raffica
  // punta subito, e la picchiata prende la spinta del vento.
  rondone_latta(n, st, ang, dist, T) {
    const v = d6.vento;
    if (!n.statoD6) {
      n.statoD6 = 'plana'; n.giroD6 = rng() < 0.5 ? -1 : 1; n.angD6 = ang;
      n.tD6 = T.planaTick[0] + Math.floor(rng() * (T.planaTick[1] - T.planaTick[0]));
    }
    if (n.statoD6 === 'plana') {
      const rad = limitaD6((dist - T.raggioOrbita) / 40, -1, 1);
      const dx = Math.cos(ang) * rad + Math.cos(ang + n.giroD6 * Math.PI / 2) * T.giro;
      const dy = Math.sin(ang) * rad + Math.sin(ang + n.giroD6 * Math.PI / 2) * T.giro;
      const l = Math.hypot(dx, dy) || 1;
      if (muoviD6(n, (dx / l) * n.speed, (dy / l) * n.speed, 12) && n.tD6 % 24 === 0) n.giroD6 = -n.giroD6;
      n.angD6 = Math.atan2(dy, dx);
      if (v.fase === 'raffica' && n.tD6 > T.anticipoVentoTick) n.tD6 = T.anticipoVentoTick;
      if (--n.tD6 <= 0) { n.statoD6 = 'punta'; n.tD6 = T.puntaTick; }
    } else if (n.statoD6 === 'punta') {
      if (n.tD6 > T.bloccoTick) n.angD6 = ang;
      if (--n.tD6 <= 0) {
        n.statoD6 = 'picchiata'; n.tD6 = T.picchiataTick;
        n.vx = Math.cos(n.angD6) * T.velPicchiata + (v.fase === 'raffica' ? v.dir * T.spintaVento : 0);
        n.vy = Math.sin(n.angD6) * T.velPicchiata;
        n.angD6 = Math.atan2(n.vy, n.vx);
      }
    } else if (n.statoD6 === 'picchiata') {
      const muro = muoviD6(n, n.vx, n.vy, 12);
      if (--n.tD6 <= 0 || muro) { n.statoD6 = 'risale'; n.tD6 = T.risaleTick; }
    } else {
      muoviD6(n, n.vx * 0.12, n.vy * 0.12, 12);
      if (--n.tD6 <= 0) {
        n.statoD6 = 'plana';
        n.tD6 = T.planaTick[0] + Math.floor(rng() * (T.planaTick[1] - T.planaTick[0]));
      }
    }
  },
};

/**
 * AGGANCIO di 40-combattimento.js (IA dei nemici comuni): se il nemico è del luogo lo fa agire e rende true.
 * @param {object} n nemico @param {object} st stanza @param {number} ang angolo verso il giocatore @param {number} dist
 */
function iaNemicoD6(n, st, ang, dist) {
  const ia = IA_D6[n.tipo];
  if (!ia) return false;
  try { ia(n, st, ang, dist, NEMICI_D6[n.tipo]); } catch (err) { console.error('[d6] ia', n.tipo, err); }
  return true;
}

/** Tick a caso fra i due estremi di una coppia [min, max]. */
const fraD6 = (coppia) => coppia[0] + Math.floor(rng() * (coppia[1] - coppia[0]));

// LAVANDAIA DI TUFO: statua ferma al suo lavatoio. LAVA; poi ALZA il panno bagnato sopra la testa (gocciola,
// lei segue il bersaglio e si blocca) e lo LANCIA: un panno lento e largo, che il vento sposta più dei colpi.
// Chi lo prende si fa male e resta INZUPPATO (cammina piano finché non si asciuga).
IA_D6.lavandaia_tufo = function (n, st, ang, dist, T) {
  if (!n.statoD6) { n.statoD6 = 'lava'; n.tD6 = fraD6(T.lavaTick); n.angD6 = ang; }
  if (n.statoD6 === 'lava') {
    if (--n.tD6 <= 0) {
      if ((st.panniD6 || []).length >= T.panno.massimi) n.tD6 = 20;
      else { n.statoD6 = 'alza'; n.tD6 = T.alzaTick; }
    }
  } else if (n.statoD6 === 'alza') {
    if (n.tD6 > T.bloccoTick) n.angD6 = Math.atan2(player.y - 6 - (n.y - T.panno.quotaPx), player.x - n.x);
    if (--n.tD6 <= 0) {
      n.statoD6 = 'lancia'; n.tD6 = T.lanciaTick;
      const a = n.angD6, v = T.panno.velocita;
      (st.panniD6 || (st.panniD6 = [])).push({ x: n.x + Math.cos(a) * 10, y: n.y - T.panno.quotaPx + Math.sin(a) * 6,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, rot: a, fonte: String(n.nome || T.nome).replace(/\s*\[.*?\]/g, '') });
    }
  } else if (--n.tD6 <= 0) { n.statoD6 = 'lava'; n.tD6 = fraD6(T.lavaTick); }
};

// FONTANIERE: tiene la distanza girando di lato; poi PIANTA la chiave della saracinesca e la GIRA (due mani
// sulla maniglia, la chiave ruota sempre più svelta): quando APRE, la corrente di tutti i canali della stanza
// cambia verso e dalla bocchetta parte un getto a ventaglio verso il giocatore.
IA_D6.fontaniere = function (n, st, ang, dist, T) {
  if (!n.statoD6) { n.statoD6 = 'cammina'; n.tD6 = fraD6(T.camminaTick); n.giroD6 = rng() < 0.5 ? -1 : 1; n.angD6 = ang; }
  if (n.statoD6 === 'cammina') {
    const rad = limitaD6((dist - T.distanzaPx) / T.bandaPx, -1, 1);
    const dx = Math.cos(ang) * rad + Math.cos(ang + n.giroD6 * Math.PI / 2) * T.giro;
    const dy = Math.sin(ang) * rad + Math.sin(ang + n.giroD6 * Math.PI / 2) * T.giro;
    const l = Math.hypot(dx, dy) || 1;
    if (muoviD6(n, (dx / l) * n.speed * T.passo, (dy / l) * n.speed * T.passo) && n.tD6 % 20 === 0) n.giroD6 = -n.giroD6;
    if (--n.tD6 <= 0) { n.statoD6 = 'gira'; n.tD6 = T.giraTick; }
  } else if (n.statoD6 === 'gira') {
    n.angD6 = ang;
    if (--n.tD6 <= 0) {
      n.statoD6 = 'apre'; n.tD6 = T.apreTick;
      const canali = (st.canaliD6 || []).filter((c) => c.forma !== 'boss');
      for (const c of canali) { c.dx = -c.dx || 0; c.dy = -c.dy || 0; c.giratoD6 = tick; }
      const G = T.getto, gocce = canali.length ? G.gocce : G.gocceSenzaCanale;
      for (let k = 0; k < gocce; k++) {
        const a = ang + (k - (gocce - 1) / 2) * G.apertura;
        statoRun.proiettiliNemici.push({ x: n.x + Math.cos(a) * 8, y: n.y - 8 + Math.sin(a) * 5, vx: Math.cos(a) * G.velocita, vy: Math.sin(a) * G.velocita,
          dist: 0, gocciaD6: true, fonteA7: `uno spruzzo del ${T.nome}` });
      }
      suonoAcquaD6(0.35);
    }
  } else if (--n.tD6 <= 0) { n.statoD6 = 'cammina'; n.tD6 = fraD6(T.camminaTick); }
};

/** I panni bagnati in volo: avanzano, sbattono su colonne e muri, feriscono e inzuppano chi colpiscono. */
function aggiornaPanniD6(st) {
  const lista = st.panniD6;
  if (!lista || !lista.length) return;
  const P = NEMICI_D6.lavandaia_tufo.panno, Z = ACQUEDOTTO_D6.inzuppato;
  for (let i = lista.length - 1; i >= 0; i--) {
    const p = lista[i];
    p.x += p.vx; p.y += p.vy; p.t++; p.rot += 0.16;
    let via = p.t > P.vitaTick || p.x < ARENA.x1 - 8 || p.x > ARENA.x2 + 8 || p.y < ARENA.y1 - 8 || p.y > ARENA.y2 + 8;
    if (!via) {
      for (const o of st.ostacoli || []) {
        if (o.tipo === 'colonna' && Math.hypot(p.x - o.x, p.y - o.y) < (o.r || 0) + 5) { via = true; break; }
      }
    }
    if (!via && player.invuln <= 0 && !(statoRun.graziaIngressoC > 0) && statoRun.hpHalf > 0
      && Math.hypot(player.x - p.x, (player.y - 6) - p.y) < P.raggio + 9 * (player.scalaA2 || 1)) {
      lista.splice(i, 1);
      statoRun.effettiSplash.push({ x: p.x, y: p.y, tick: 0 });
      subisciColpoGiocatore(statoRun.piano >= 3 ? 2 : 1, `un panno bagnato della ${p.fonte || NEMICI_D6.lavandaia_tufo.nome}`, p.x - p.vx, p.y - p.vy);
      if (statoRun.hpHalf <= 0 || statoRun.fase !== 'in_gioco') return;
      statoRun.inzuppatoD6 = Z.tick;
      suonoAcquaD6(0.25);
      if (statoRun.avvisoInzuppatoD6 !== statoRun.numeroRun) { statoRun.avvisoInzuppatoD6 = statoRun.numeroRun; mostraBanner(TESTI_D6.inzuppato, 170); }
      continue;
    }
    if (via) { statoRun.effettiSplash.push({ x: p.x, y: p.y, tick: 0 }); lista.splice(i, 1); }
  }
}

// --------------------------------------------------------------------------- penne del disegno «a ombre»
/** Penna della sagoma: china col contorno netto color lanterna (bianco nel lampo del colpo). */
function chinaD6(flash) {
  ctx.fillStyle = flash ? TINTE_D6.lampo : TINTE_D6.china;
  ctx.strokeStyle = flash ? '#ffffff' : TINTE_D6.bordo;
  ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
}

/** Un tratto a sagoma (arto, asta): prima il bordo più largo, poi la china. */
function trattoD6(spessore, flash, x1, y1, x2, y2) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = flash ? '#ffffff' : TINTE_D6.bordo; ctx.lineWidth = spessore + 1.6;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = flash ? TINTE_D6.lampo : TINTE_D6.china; ctx.lineWidth = spessore;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function puntoD6(x, y, r, colore) {
  ctx.fillStyle = colore;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

/** Ombra a terra di una figura. */
function ombraD6(x, y, rx, ry, alfa = 0.6) {
  ctx.fillStyle = `rgba(8, 5, 3, ${alfa})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}

/** Alone del campione (stessi colori della base). */
function aloneCampioneD6(n, quota) {
  if (!n.champion) return;
  const col = n.champion === 'cremisi' ? 'rgba(239,68,68,0.45)' : n.champion === 'dorato' ? 'rgba(250,204,21,0.48)' : 'rgba(56,189,248,0.48)';
  const g = ctx.createRadialGradient(n.x, n.y - quota, 2, n.x, n.y - quota, n.r + 12);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(n.x, n.y - quota, n.r + 12, 0, TAU); ctx.fill();
}

/** Segno dei fili tagliati (Forbici di Gaetano), come nella base. */
function stordimentoD6(n, quota) {
  if (!(n.stunTicks > 0)) return;
  ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(n.x, n.y - quota, 7, 0, TAU); ctx.stroke();
}

const DISEGNI_NEMICI_D6 = {
  /** Rondone di Latta: falce di lamiera con le ali lunghe, coda a forbice, ribattini d'oro. */
  rondone_latta(n, tk, flash) {
    const T = NEMICI_D6.rondone_latta, s = n.statoD6 || 'plana';
    const quota = s === 'picchiata' ? T.quota * 0.45 : s === 'risale' ? T.quota * 0.7 : T.quota;
    ombraD6(n.x, n.y + 4, 8, 3, 0.45);
    aloneCampioneD6(n, quota);
    stordimentoD6(n, quota + 16);
    const rot = n.angD6 || 0;
    const trema = s === 'punta' ? Math.sin(tk * 1.5) * 0.9 : 0;
    ctx.save();
    ctx.translate(n.x + trema, n.y - quota + (s === 'plana' ? Math.sin(tk * 0.13 + n.x * 0.1) * 1.6 : 0));
    if (n.champion) ctx.scale(1.18, 1.18);
    ctx.rotate(rot);
    if (Math.cos(rot) < 0) ctx.scale(1, -1); // la pancia resta sotto
    // apertura delle ali: 1 = stese (plana), 0 = chiuse all'indietro (punta, picchiata)
    const ap = s === 'plana' ? 0.8 + Math.sin(tk * 0.32 + n.y * 0.1) * 0.2 : s === 'risale' ? 0.9 : s === 'punta' ? Math.max(0, (n.tD6 || 0) / T.puntaTick - 0.35) : 0;
    if (s === 'picchiata') { // la scia della picchiata
      ctx.strokeStyle = TINTE_D6.bordo; ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-12, -3); ctx.lineTo(-26, -4); ctx.moveTo(-12, 3); ctx.lineTo(-24, 4); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // ali a falce, lunghe e tirate all'indietro (una per lato del corpo)
    for (const lato of [-1, 1]) {
      chinaD6(flash);
      const chiuse = 1 - ap;
      ctx.beginPath();
      ctx.moveTo(5, lato * 1.5);
      ctx.quadraticCurveTo(6 - chiuse * 5, lato * (4 + ap * 13), -9 - chiuse * 8, lato * (4.5 + ap * 16));
      ctx.quadraticCurveTo(-1 - chiuse * 6, lato * (3 + ap * 7), -4, lato * 1.5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // corpo a fuso, coda a forbice
    chinaD6(flash);
    ctx.beginPath();
    ctx.moveTo(11, 0); ctx.quadraticCurveTo(4, -4.2, -6, -2.2); ctx.lineTo(-14, -4.5); ctx.lineTo(-10, 0); ctx.lineTo(-14, 4.5); ctx.lineTo(-6, 2.2); ctx.quadraticCurveTo(4, 4.2, 11, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // becco d'oro, occhio, ribattini
    ctx.fillStyle = TINTE_D6.oro;
    ctx.beginPath(); ctx.moveTo(10, -1.2); ctx.lineTo(14.5, 0); ctx.lineTo(10, 1.2); ctx.closePath(); ctx.fill();
    puntoD6(6.2, -1.2, 1, s === 'punta' || s === 'picchiata' ? TINTE_D6.rosso : TINTE_D6.oro);
    if (!flash) { puntoD6(0, 0, 0.6, TINTE_D6.bordo); puntoD6(-4, 0, 0.6, TINTE_D6.bordo); }
    ctx.restore();
  },
};

/** Un panno bagnato (in mano o in volo): un telo chiaro che sbatte, col bordo di china. */
function pannoD6(x, y, rot, scala, tk, flash) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scala, scala);
  const o = Math.sin(tk * 0.5) * 1.4;
  ctx.fillStyle = flash ? '#ffffff' : TINTE_D6.schiuma; ctx.strokeStyle = TINTE_D6.china; ctx.lineWidth = 1; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-7, -3.5 + o * 0.4); ctx.quadraticCurveTo(-2, -5.5 - o, 3, -3.5); ctx.quadraticCurveTo(6, -2.5 + o, 7.5, -4 + o);
  ctx.lineTo(7, 3.5 + o * 0.6); ctx.quadraticCurveTo(3, 5 + o, -1, 3.2); ctx.quadraticCurveTo(-4, 2 - o, -7.5, 4);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = TINTE_D6.acqua; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-4, -1 + o * 0.3); ctx.quadraticCurveTo(0, 1 - o * 0.3, 4.5, -0.5); ctx.stroke();
  ctx.restore();
}

/** Lavandaia di Tufo: statua inginocchiata al lavatoio, il fazzoletto rosso in testa, il panno fra le mani. */
DISEGNI_NEMICI_D6.lavandaia_tufo = function (n, tk, flash) {
  const T = NEMICI_D6.lavandaia_tufo, s = n.statoD6 || 'lava';
  const flip = player.x < n.x ? -1 : 1;
  const k = s === 'alza' ? 1 - (n.tD6 || 0) / T.alzaTick : 0;
  ombraD6(n.x, n.y + 5, 16, 5, 0.6);
  aloneCampioneD6(n, 12);
  stordimentoD6(n, 46);
  ctx.save();
  ctx.translate(n.x + (s === 'alza' ? Math.sin(tk * 1.4) * 0.8 * k : 0), n.y);
  if (n.champion) ctx.scale(1.18, 1.18);
  ctx.scale(flip, 1);
  // il lavatoio di pietra, davanti a lei
  chinaD6(flash);
  ctx.beginPath(); ctx.moveTo(3, -4); ctx.lineTo(19, -4); ctx.lineTo(17, 7); ctx.lineTo(5, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash ? '#ffffff' : TINTE_D6.acqua; ctx.globalAlpha = 0.85; ctx.fillRect(5, -3, 12, 1.6); ctx.globalAlpha = 1;
  // gonna a campana (è inginocchiata) e busto
  chinaD6(flash);
  ctx.beginPath(); ctx.moveTo(-13, 7); ctx.quadraticCurveTo(-13, -8, -5, -12); ctx.lineTo(4, -12); ctx.quadraticCurveTo(8, -4, 6, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -11); ctx.lineTo(-6.5, -22); ctx.quadraticCurveTo(-6, -26, -2, -26); ctx.lineTo(3, -26); ctx.quadraticCurveTo(6, -25, 5.5, -21); ctx.lineTo(5, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
  // crepe del tufo
  ctx.strokeStyle = flash ? '#ffffff' : TINTE_D6.bordo; ctx.lineWidth = 0.7; ctx.globalAlpha = 0.55;
  ctx.beginPath(); ctx.moveTo(-9, -3); ctx.lineTo(-6, 1); ctx.lineTo(-8, 5); ctx.moveTo(1, -9); ctx.lineTo(-1, -3); ctx.stroke();
  ctx.globalAlpha = 1;
  // testa col fazzoletto annodato
  const capo = s === 'lava' ? 2 + Math.sin(tk * 0.2) * 0.8 : s === 'alza' ? -1 : 0;
  chinaD6(flash);
  ctx.beginPath(); ctx.arc(0.5, -31 + capo, 5.4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash ? '#ffffff' : TINTE_D6.drappo;
  ctx.beginPath(); ctx.moveTo(-5.2, -32 + capo); ctx.quadraticCurveTo(0.5, -41 + capo, 6, -32.5 + capo); ctx.lineTo(3, -34 + capo); ctx.lineTo(-3, -34 + capo); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-5, -33 + capo); ctx.lineTo(-10.5, -30 + capo); ctx.lineTo(-6.5, -29.5 + capo); ctx.closePath(); ctx.fill();
  puntoD6(3, -30.6 + capo, 1.1, s === 'alza' ? TINTE_D6.rosso : TINTE_D6.oro);
  // braccia e panno
  if (s === 'alza') {
    const su = Math.min(1, k * 2.5);
    trattoD6(2.6, flash, -4, -23, -8, -30 - 9 * su);
    trattoD6(2.6, flash, 4, -23, 9, -30 - 9 * su);
    pannoD6(0.5, -40 - 9 * su, 0, 1.25, tk, flash);
    ctx.fillStyle = TINTE_D6.acqua; // il panno gocciola
    for (let i = 0; i < 3; i++) { const kk = (tk * 0.06 + i * 0.33) % 1; ctx.globalAlpha = 1 - kk; ctx.fillRect(-6 + i * 6, -36 - 9 * su + kk * 12, 1.2, 2.2); }
    ctx.globalAlpha = 1;
  } else if (s === 'lancia') {
    trattoD6(2.6, flash, -4, -23, 9, -27);
    trattoD6(2.6, flash, 4, -23, 14, -24);
  } else {
    const sfrega = Math.sin(tk * 0.22) * 2.6;
    trattoD6(2.6, flash, -4, -23, 7 + sfrega, -8);
    trattoD6(2.6, flash, 4, -23, 12 + sfrega, -7);
    pannoD6(11 + sfrega, -5.5, 0, 0.7, tk, flash);
  }
  ctx.restore();
};

/** Fontaniere: grembiule e berretto a visiera, la chiave della saracinesca (una T di ferro alta quanto lui). */
DISEGNI_NEMICI_D6.fontaniere = function (n, tk, flash) {
  const T = NEMICI_D6.fontaniere, s = n.statoD6 || 'cammina';
  const flip = player.x < n.x ? -1 : 1;
  const k = s === 'gira' ? 1 - (n.tD6 || 0) / T.giraTick : 0;
  ombraD6(n.x, n.y + 4, 11, 4, 0.6);
  aloneCampioneD6(n, 12);
  stordimentoD6(n, 44);
  ctx.save();
  ctx.translate(n.x, n.y);
  if (n.champion) ctx.scale(1.18, 1.18);
  ctx.scale(flip, 1);
  const passo = s === 'cammina' ? Math.sin(tk * 0.3 + n.x * 0.05) : 0;
  const oro = flash ? '#ffffff' : TINTE_D6.oro;
  // gambe
  trattoD6(2.4, flash, -2.5, -8, -3.5 - passo * 3, 4);
  trattoD6(2.4, flash, 2.5, -8, 3.5 + passo * 3, 4);
  ctx.save();
  ctx.rotate(s === 'gira' ? 0.2 : s === 'apre' ? -0.1 : 0);
  // grembiule di cuoio
  chinaD6(flash);
  ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(6, -24); ctx.lineTo(7.5, -6); ctx.lineTo(-7.5, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = flash ? '#ffffff' : TINTE_D6.bordo; ctx.lineWidth = 0.7; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(-4, -19); ctx.lineTo(4, -19); ctx.moveTo(-5.5, -10); ctx.lineTo(5.5, -10); ctx.stroke();
  ctx.globalAlpha = 1;
  // testa e berretto a visiera
  chinaD6(flash);
  ctx.beginPath(); ctx.arc(0.5, -29.5, 5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, -31.5); ctx.quadraticCurveTo(0, -39, 5.5, -32); ctx.lineTo(10, -31); ctx.lineTo(5, -30.4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash ? '#ffffff' : TINTE_D6.acqua; ctx.fillRect(-4, -32.8, 9, 1.3);
  puntoD6(3, -29.2, 1.1, s === 'gira' ? TINTE_D6.rosso : TINTE_D6.oro);
  ctx.restore();
  // la chiave a T
  if (s === 'gira') {
    // piantata davanti a lui, due mani sulla maniglia; la maniglia gira (si vede di scorcio), sempre più svelta
    const largo = Math.cos(tk * (0.25 + 0.45 * k)) * 7;
    trattoD6(1.8, flash, 13, -41, 13, 5);
    ctx.strokeStyle = oro; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(13 - largo, -41); ctx.lineTo(13 + largo, -41); ctx.stroke();
    ctx.fillStyle = oro; ctx.fillRect(11, 3, 4, 3.5);
    trattoD6(2.2, flash, -2, -20, 13 - Math.abs(largo) * 0.6, -40);
    trattoD6(2.2, flash, 5, -20, 13 + Math.abs(largo) * 0.6, -40);
    ctx.strokeStyle = TINTE_D6.acqua; ctx.lineWidth = 1; // l'acqua gorgoglia al piede della chiave
    for (let i = 0; i < 2; i++) {
      const kk = (tk * 0.05 + i * 0.5) % 1;
      ctx.globalAlpha = (1 - kk) * (0.4 + 0.6 * k);
      ctx.beginPath(); ctx.ellipse(13, 6, 3 + kk * 8, 1.2 + kk * 3, 0, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (s === 'apre') {
    trattoD6(1.8, flash, -10, -35, -6, 2);
    ctx.strokeStyle = oro; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-15, -34); ctx.lineTo(-5, -36); ctx.stroke();
    trattoD6(2.2, flash, -3, -21, -8, -16);
    trattoD6(2.2, flash, 4, -21, 15, -19); // il braccio indica dove va il getto
  } else {
    // in spalla
    trattoD6(1.8, flash, -11, -38 + passo, 7, -12);
    ctx.strokeStyle = oro; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-15, -34 + passo); ctx.lineTo(-7, -42 + passo); ctx.stroke();
    trattoD6(2.2, flash, -3, -21, -2, -15);
    trattoD6(2.2, flash, 4, -21, 6, -14);
  }
  ctx.restore();
};

const disegnaNemicoPittoricoBaseD6 = disegnaNemicoPittorico;
/** I nemici del luogo si disegnano qui; gli altri restano alla base. Stessa firma: ([ctx], nemico, tick). */
disegnaNemicoPittorico = function (...args) {
  const a = args[0] && typeof args[0].save === 'function' ? args.slice(1) : args;
  const n = a[0];
  const disegno = n && DISEGNI_NEMICI_D6[n.tipo];
  if (!disegno) return disegnaNemicoPittoricoBaseD6.apply(this, args);
  try {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    disegno(n, a[1] || 0, n.flash > 0 && OPZIONI.lampi !== false);
    ctx.restore();
  } catch (err) { console.error('[d6] disegno', n.tipo, err); }
  return undefined;
};

// ===========================================================================
// 5. IL BOSS: Il Guardiano delle Acque (macchina a stati nello schema di b6-boss.js)
// ===========================================================================
/** Numero di BOSS_D6 dalla chiave ('a.b'); in fase 2 vince la chiave <chiave>Fase2 se esiste. */
function valoreD6(chiave, fase2) {
  const leggi = (k) => k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), BOSS_D6);
  const v2 = fase2 ? leggi(`${chiave}Fase2`) : undefined;
  return v2 !== undefined ? v2 : leggi(chiave);
}

const nomeGuardianoD6 = (n) => String(n.nome || '').replace(/\s*\(.*?\)/g, '');
const versoGiocatoreD6 = (n, quota = 8) => Math.atan2(player.y - 6 - (n.y - quota), player.x - n.x);

/** Un colpo del Guardiano (proiettile comune del Teatro), col tetto e il nome del tiratore per il Registro (a7). */
function sparaGuardianoD6(n, x, y, ang, vel) {
  if (statoRun.proiettiliNemici.length >= BOSS_D6.tettoProiettili) return false;
  statoRun.proiettiliNemici.push({ x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, dist: 0, bossShot: true, gocciaD6: true, fonteA7: `un getto de ${nomeGuardianoD6(n)}` });
  return true;
}

function entraStatoD6(n, stato, st) {
  const riga = STATI_D6.stati[stato];
  const f2 = Boolean(n.fase2D6);
  n.statoD6 = stato;
  n.tStatoD6 = 0;
  n.timerD6 = riga.durata ? Math.max(1, Math.round(valoreD6(riga.durata, f2))) : 1;
  n.durataD6 = n.timerD6;
  const az = AZIONI_D6.entra[stato];
  if (az) az(n, BOSS_D6, f2, st);
  n.durataD6 = Math.max(n.durataD6, n.timerD6);
}

function prossimoStatoD6(n) {
  const riga = STATI_D6.stati[n.statoD6];
  if (riga.ripeti && n.ripetiD6 > 0) { n.ripetiD6--; return riga.ripeti; }
  if (riga.poi !== 'prossima') return riga.poi;
  const seq = BOSS_D6.sequenza;
  const mossa = seq[(n.indiceD6 || 0) % seq.length];
  n.indiceD6 = (n.indiceD6 || 0) + 1;
  return STATI_D6.mosse[mossa];
}

/** Un tick dell'IA del Guardiano. */
function iaGuardianoD6(n, st) {
  if (!st.acquaD6) st.acquaD6 = nuovaAcquaD6();
  if (!n.statoD6) {
    n.fase2D6 = false; n.indiceD6 = 0; n.ripetiD6 = 0;
    n.giroD6 = rng() < 0.5 ? -1 : 1; n.angD6 = versoGiocatoreD6(n); n.versoD6 = 1;
    entraStatoD6(n, STATI_D6.inizio, st);
  }
  if (!n.fase2D6 && n.hp < n.maxHp * BOSS_D6.sogliaFase2) {
    n.fase2D6 = true; n.ripetiD6 = 0; n.flash = 12;
    n.sottoD6 = false; n.airZ = 0;
    scuoti(FEEL.scossa.schiantoCapitano);
    statoRun.ondeEsplosione.push({ x: n.x, y: n.y - 12, r: 8, maxR: 58, tick: 0, color: TINTE_D6.rosso });
    entraStatoD6(n, 'cambiaFase', st);
  }
  const f2 = n.fase2D6;
  const passo = AZIONI_D6.passo[n.statoD6];
  if (passo) passo(n, BOSS_D6, f2, st);
  n.tStatoD6++;
  if (--n.timerD6 <= 0) entraStatoD6(n, prossimoStatoD6(n), st);
}

const AZIONI_D6 = {
  entra: {
    gonfia(n, C, f2) { n.ripetiD6 = (f2 ? C.getto.gettiFase2 : C.getto.getti) - 1; n.versoD6 = rng() < 0.5 ? -1 : 1; },
    rigonfia(n) { n.versoD6 = -n.versoD6; },
    getto(n, C, f2) {
      n.colpoD6 = 0;
      n.timerD6 = ((f2 ? C.getto.colpiFase2 : C.getto.colpi) - 1) * C.getto.intervalloTick + 2;
    },
    alzaTridente(n, C, f2, st) {
      const A = st.acquaD6;
      n.ripetiD6 = (f2 ? C.piena.emersioniFase2 : C.piena.emersioni) - 1;
      A.meta = 1; A.dir = -A.dir; A.dx = A.dir; A.dy = 0;
      A.spinta = f2 ? C.piena.spintaFase2 : C.piena.spinta;
      suonoAcquaD6(0.8);
    },
    immerge(n, C) {
      // sott'acqua va verso un punto a distanzaPx dal giocatore, dalla parte del centro del palco
      const cx = (ARENA.x1 + ARENA.x2) / 2, cy = (ARENA.y1 + ARENA.y2) / 2;
      const a = Math.atan2(cy - player.y, cx - player.x) + (rng() - 0.5) * 1.6;
      n.daD6 = { x: n.x, y: n.y };
      n.aD6 = { x: limitaD6(player.x + Math.cos(a) * C.piena.distanzaPx, ARENA.x1 + 40, ARENA.x2 - 40),
        y: limitaD6(player.y + Math.sin(a) * C.piena.distanzaPx, ARENA.y1 + 40, ARENA.y2 - 40) };
      n.sottoD6 = true; n.airZ = 30;
      statoRun.effettiSplash.push({ x: n.x, y: n.y - 6, tick: 0 });
    },
    emerge(n, C, f2) {
      n.sottoD6 = false; n.airZ = 0;
      const quante = f2 ? C.piena.coronaFase2 : C.piena.corona;
      const fase0 = (n.coroneD6 = (n.coroneD6 || 0) + 1) % 2 ? 0 : Math.PI / quante;
      for (let k = 0; k < quante; k++) sparaGuardianoD6(n, n.x, n.y - 8, fase0 + (TAU * k) / quante, C.piena.velocita);
      scuoti(FEEL.scossa.colpo);
      statoRun.ondeEsplosione.push({ x: n.x, y: n.y - 4, r: 6, maxR: 40, tick: 0, color: TINTE_D6.acqua });
      suonoAcquaD6(0.4);
    },
    secca(n, C, f2, st) { st.acquaD6.meta = 0; n.sottoD6 = false; n.airZ = 0; },
    cambiaFase(n) { n.sottoD6 = false; n.airZ = 0; },
  },
  passo: {
    scivola(n, C, f2) {
      const G = C.scivola;
      const ang = Math.atan2(player.y - n.y, player.x - n.x);
      const dist = Math.hypot(player.x - n.x, player.y - n.y);
      const rad = limitaD6((dist - G.distanzaPx) / 40, -1, 1);
      const dx = Math.cos(ang) * rad + Math.cos(ang + n.giroD6 * Math.PI / 2) * G.giro;
      const dy = Math.sin(ang) * rad + Math.sin(ang + n.giroD6 * Math.PI / 2) * G.giro;
      const l = Math.hypot(dx, dy) || 1;
      const v = n.speed * G.passo * (f2 ? C.moltVelFase2 : 1);
      if (muoviD6(n, (dx / l) * v, (dy / l) * v, 24) && n.tStatoD6 % 30 === 0) n.giroD6 = -n.giroD6;
    },
    gonfia(n, C) { if (n.timerD6 > C.getto.bloccoTick) n.angD6 = versoGiocatoreD6(n, 22); },
    rigonfia(n, C) { if (n.timerD6 > C.getto.bloccoTick) n.angD6 = versoGiocatoreD6(n, 22); },
    getto(n, C, f2) {
      const G = C.getto, colpi = f2 ? G.colpiFase2 : G.colpi;
      if (n.tStatoD6 % G.intervalloTick === 0 && n.colpoD6 < colpi) {
        const k = n.colpoD6++;
        const a = n.angD6 + n.versoD6 * (k / (colpi - 1) - 0.5) * G.spazzata;
        n.angGettoD6 = a;
        sparaGuardianoD6(n, n.x + Math.cos(a) * 18, n.y - 22 + Math.sin(a) * 12, a, G.velocita);
      }
    },
    immerge(n) {
      const k = 1 - n.timerD6 / n.durataD6, e = k * k * (3 - 2 * k);
      n.x = n.daD6.x + (n.aD6.x - n.daD6.x) * e;
      n.y = n.daD6.y + (n.aD6.y - n.daD6.y) * e;
    },
  },
};

/**
 * IL PERCHÉ del percorso: battuto il Guardiano all'Acquedotto, un oggetto forte garantito sul piedistallo d'oro
 * (dal pool della run, come quelli «1 su 10» delle stanze). Rende true se l'ha posato.
 */
function posaDonoD6(st) {
  if (!acquedottoAttivoD6() || st.donoD6) return false;
  const D = ACQUEDOTTO_D6.dono;
  st.donoD6 = true;
  let item = null;
  try { item = estraiOggettoForte(); } catch (err) { console.error('[d6] dono', err); }
  if (item) st.oggettoPiedistallo = { ...item, x: D.x, y: D.y, preso: false, forteGratis: true, donoD6: true };
  else { spawnaMonetaATerra(st, D.x - 10, D.y, 3); spawnaMonetaATerra(st, D.x + 10, D.y, 3); } // pool vuoto: almeno i grani
  return true;
}

/** Guardiano sconfitto: frase, anime che salgono, l'acqua cala, il dono garantito. */
function guardianoSconfittoD6(st, b) {
  const dono = posaDonoD6(st);
  mostraBanner(`${SCHEDA_D6.sconfitta} ${st.portaPattoAperta ? 'Porta del Patto d\'Ombra (😈) a destra · ' : ''}Botola aperta!${dono ? ` ${TESTI_D6.bannerDono}` : ''}`, BOSS_D6.bannerTick + (dono ? 60 : 0));
  const A = BOSS_D6.anime;
  for (let k = 0; k < A.numero; k++) {
    d6.anime.push({ x: b.x + (k - A.numero / 2) * 3.2, y: b.y - 6 - (k % 4) * 9, t0: tick + k * 3, fase: k * 1.7, colore: A.colori[k % A.colori.length] });
  }
  if (st.acquaD6) st.acquaD6.meta = 0;
}

const entraInStanzaBaseD6 = entraInStanza;
/** Ingresso in una stanza dell'Acquedotto: il vento riparte dalla calma; il Guardiano si presenta. */
entraInStanza = function (stanza, daLato, ...resto) {
  const r = entraInStanzaBaseD6.call(this, stanza, daLato, ...resto);
  try {
    if (stanza && statoRun.stanzaCorrente === stanza && acquedottoAttivoD6()) {
      azzeraVentoD6();
      stanza.panniD6 = [];
      const b = stanza.tipo === 'boss' && !stanza.pulita ? stanza.nemici.find((n) => n.boss && n.bossId === SCHEDA_D6.id) : null;
      if (b) mostraBanner(`💀 ${b.nome} (${b.hp} HP) — ${SCHEDA_D6.presentazione}`, BOSS_D6.bannerTick);
    }
  } catch (err) { console.error('[d6] ingresso', err); }
  return r;
};

// --------------------------------------------------------------------------- disegno del Guardiano
/** L'otre del Guardiano: la bocca guarda lungo `ang` (coordinate di schermo). `gonfio` 0..1. */
function otreD6(x, y, ang, gonfio, flash, f2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  chinaD6(flash);
  ctx.beginPath(); ctx.ellipse(-3, 0, 7 + gonfio * 2.2, 5 + gonfio * 2.4, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.rect(3.5, -2.2, 5, 4.4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = f2 ? TINTE_D6.rosso : TINTE_D6.oro; ctx.fillRect(8, -2.8, 1.6, 5.6);
  if (gonfio > 0.05) {
    ctx.globalAlpha = Math.min(1, gonfio);
    puntoD6(11, 0, 1.4 + gonfio * 2.2, TINTE_D6.acqua);
    puntoD6(11, 0, 0.8 + gonfio, TINTE_D6.schiuma);
  }
  ctx.restore();
}

/** Tridente d'oro: dal pugno (x, y) lungo `ang`, lungo `lung`. */
function tridenteD6(x, y, ang, lung, flash, f2) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const tx = x + c * lung, ty = y + s * lung;
  trattoD6(1.5, flash, x - c * 12, y - s * 12, tx, ty);
  ctx.strokeStyle = f2 ? TINTE_D6.rosso : TINTE_D6.oro; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tx - s * 5, ty + c * 5); ctx.lineTo(tx + s * 5, ty - c * 5);
  for (const k of [-1, 0, 1]) { ctx.moveTo(tx - s * 5 * k, ty + c * 5 * k); ctx.lineTo(tx - s * 5 * k + c * 7, ty + c * 5 * k + s * 7); }
  ctx.stroke();
}

/** Cerchi d'acqua attorno a un punto (dove sta, dove s'immerge, dove riemerge). */
function cerchiAcquaD6(x, y, tk, forza = 1) {
  ctx.strokeStyle = TINTE_D6.acqua; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const k = ((tk * 0.03 + i / 3) % 1);
    ctx.globalAlpha = 0.6 * (1 - k) * forza;
    ctx.beginPath(); ctx.ellipse(x, y + 4, 10 + k * 20, 3.5 + k * 7, 0, 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Il Guardiano delle Acque: statua di tritone che esce dal condotto, tridente in una mano, otre nell'altra. */
function disegnaGuardianoD6(b, tk) {
  const s = b.statoD6 || 'scivola';
  const f2 = Boolean(b.fase2D6);
  const flash = b.flash > 0 && OPZIONI.lampi !== false;
  const k = b.durataD6 ? 1 - (b.timerD6 || 0) / b.durataD6 : 0;
  const flip = player.x < b.x ? -1 : 1;
  const accento = f2 ? TINTE_D6.rosso : TINTE_D6.oro;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  if (s === 'immerge') { // sott'acqua: solo l'ombra che corre sotto il pelo e i cerchi
    ombraD6(b.x, b.y + 4, 20, 7, 0.5);
    cerchiAcquaD6(b.x, b.y, tk * 2, 1);
    ctx.fillStyle = TINTE_D6.schiuma; ctx.globalAlpha = 0.8;
    for (let i = 0; i < 4; i++) { const kk = ((tk * 0.06 + i * 0.25) % 1); ctx.fillRect(b.x - 8 + i * 5, b.y - kk * 10, 1.6, 1.6); }
    ctx.restore();
    return;
  }
  ombraD6(b.x, b.y + 8, SCHEDA_D6.ombra[0], SCHEDA_D6.ombra[1], 0.68);
  cerchiAcquaD6(b.x, b.y, tk, s === 'secca' ? 0.25 : 0.8);
  const sale = s === 'emerge' ? Math.min(1, 0.25 + k * 1.6) : 1;
  const inclina = s === 'gonfia' || s === 'rigonfia' ? -0.16 * Math.min(1, k * 2) : s === 'getto' ? 0.12 : s === 'secca' ? 0.1 : 0;
  const trema = s === 'alzaTridente' ? Math.sin(tk * 1.3) * (0.4 + k) : s === 'cambiaFase' ? Math.sin(tk * 1.1) * 1.2 : 0;
  ctx.translate(b.x + trema, b.y);
  ctx.scale(1, sale);
  ctx.save();
  ctx.scale(flip, 1);
  // coda di pesce arrotolata, con la pinna
  const onda = s === 'secca' ? 0 : Math.sin(tk * 0.12) * 2.4;
  chinaD6(flash);
  ctx.beginPath();
  ctx.moveTo(8, 6); ctx.quadraticCurveTo(-4, 11, -16, 5); ctx.quadraticCurveTo(-24, 0, -22, -9 + onda);
  ctx.lineTo(-29, -15 + onda); ctx.lineTo(-22.5, -13 + onda); ctx.lineTo(-19, -20 + onda); ctx.lineTo(-17.5, -9 + onda);
  ctx.quadraticCurveTo(-17, -1, -9, -1); ctx.lineTo(8, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
  // busto di statua
  ctx.rotate(inclina);
  ctx.beginPath();
  ctx.moveTo(-9, 2); ctx.lineTo(-10.5, -20); ctx.quadraticCurveTo(-12, -33, -6, -36); ctx.lineTo(6, -36);
  ctx.quadraticCurveTo(12, -33, 10.5, -20); ctx.lineTo(9, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  // cintura di conchiglie, pettorali
  for (const cx of [-6, -2, 2, 6]) puntoD6(cx, -3, 1.1, flash ? '#ffffff' : accento);
  ctx.strokeStyle = flash ? '#ffffff' : TINTE_D6.bordo; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(-6, -27); ctx.quadraticCurveTo(-3, -24, 0, -27); ctx.quadraticCurveTo(3, -24, 6, -27); ctx.moveTo(0, -27); ctx.lineTo(0, -10); ctx.stroke();
  ctx.globalAlpha = 1;
  if (f2) { // crepe che ardono
    ctx.strokeStyle = TINTE_D6.rosso; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(5, -31); ctx.lineTo(2.5, -24); ctx.lineTo(6, -18); ctx.lineTo(3.5, -10); ctx.moveTo(-6, -22); ctx.lineTo(-3.5, -15); ctx.lineTo(-7, -8); ctx.stroke();
  }
  // testa: barba a punta, corona di canne
  const capo = s === 'secca' ? 3 : s === 'gonfia' || s === 'rigonfia' ? -1.5 : 0;
  chinaD6(flash);
  ctx.beginPath(); ctx.moveTo(-4.5, -40 + capo); ctx.lineTo(2, -28 + capo); ctx.lineTo(7, -40 + capo); ctx.closePath(); ctx.fill(); ctx.stroke(); // barba
  ctx.beginPath(); ctx.arc(1, -44 + capo, 6.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = flash ? '#ffffff' : accento; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [cx, alt] of [[-3.5, 5], [0, 7], [3.5, 6], [6.5, 4]]) { ctx.moveTo(cx, -49 + capo); ctx.lineTo(cx + 0.8, -49 - alt + capo); }
  ctx.stroke();
  puntoD6(3.4, -44.6 + capo, s === 'secca' ? 0.7 : 1.3, accento);
  ctx.restore();

  // braccia, tridente e otre: in coordinate di schermo (l'otre guarda dove andrà il getto)
  const spallaT = { x: -flip * 8, y: -33 }, spallaO = { x: flip * 8, y: -33 };
  if (s === 'alzaTridente' || s === 'cambiaFase') {
    const su = Math.min(1, k * 3);
    trattoD6(3, flash, spallaT.x, spallaT.y, -11, -44 - 12 * su);
    trattoD6(3, flash, spallaO.x, spallaO.y, 11, -44 - 12 * su);
    tridenteD6(-16, -46 - 13 * su, 0, 34, flash, f2);
  } else if (s === 'emerge') {
    trattoD6(3, flash, spallaT.x, spallaT.y, -flip * 19, -42);
    trattoD6(3, flash, spallaO.x, spallaO.y, flip * 18, -40);
    tridenteD6(-flip * 19, -42, -Math.PI / 2 - flip * 0.25, 26, flash, f2);
    otreD6(flip * 19, -38, flip > 0 ? -0.5 : Math.PI + 0.5, 0, flash, f2);
  } else {
    const punta = s === 'gonfia' || s === 'rigonfia' || s === 'getto';
    const angT = s === 'secca' ? -Math.PI / 2 - flip * 0.85 : -Math.PI / 2 - flip * 0.12;
    const mt = s === 'secca' ? { x: -flip * 13, y: -17 } : { x: -flip * 13, y: -24 };
    trattoD6(3, flash, spallaT.x, spallaT.y, mt.x, mt.y);
    tridenteD6(mt.x, mt.y, angT, s === 'secca' ? 24 : 34, flash, f2);
    if (punta) {
      const a = s === 'getto' ? (b.angGettoD6 !== undefined ? b.angGettoD6 : b.angD6 || 0) : (b.angD6 || 0);
      const ox = Math.cos(a) * 9, oy = -27 + Math.sin(a) * 6;
      trattoD6(3, flash, spallaO.x, spallaO.y, ox - Math.cos(a) * 5, oy - Math.sin(a) * 5 + 2);
      otreD6(ox, oy, a, s === 'getto' ? 0.5 + 0.3 * Math.sin(tk * 0.9) : Math.min(1, k * 1.4), flash, f2);
    } else {
      trattoD6(3, flash, spallaO.x, spallaO.y, flip * 12, -18);
      otreD6(flip * 13, -13, flip > 0 ? 0.9 : Math.PI - 0.9, 0, flash, f2);
      if (s === 'secca') { // l'ultima acqua gocciola dall'otre
        ctx.fillStyle = TINTE_D6.acqua;
        const kk = (tk * 0.04) % 1;
        ctx.globalAlpha = 1 - kk; ctx.fillRect(flip * 17, -8 + kk * 14, 1.4, 2.4); ctx.globalAlpha = 1;
      }
    }
  }
  ctx.restore();
}

const disegnaBossPittoricoBaseD6 = disegnaBossPittorico;
/** Il Guardiano si disegna qui; gli altri boss restano alla base. Stessa firma: ([ctx], boss, tick). */
disegnaBossPittorico = function (...args) {
  const a = args[0] && typeof args[0].save === 'function' ? args.slice(1) : args;
  const b = a[0];
  if (!b || b.bossId !== SCHEDA_D6.id) return disegnaBossPittoricoBaseD6.apply(this, args);
  try { disegnaGuardianoD6(b, a[1] || 0); } catch (err) { console.error('[d6] disegno guardiano', err); }
  return undefined;
};

// ===========================================================================
// AVVIO DELLA RUN E DEL PIANO
// ===========================================================================
const nuovaRunBaseD6 = nuovaRun;
/** Run nuova: nessun percorso scelto. */
nuovaRun = function (...args) {
  statoRun.percorsoD6 = null;
  statoRun.inzuppatoD6 = 0;
  intonaD6();
  const r = nuovaRunBaseD6.apply(this, args);
  intonaD6();
  return r;
};

const avviaPianoBaseD6 = avviaPiano;
/** Avvio di un piano: se è l'Acquedotto, il vento riparte e la run se ne ricorda. */
avviaPiano = function (piano, ...resto) {
  statoRun.inzuppatoD6 = 0;
  const r = avviaPianoBaseD6.call(this, piano, ...resto);
  try {
    intonaD6();
    if (acquedottoAttivoD6(piano)) ricordaPercorsoD6();
  } catch (err) { console.error('[d6] piano', err); }
  return r;
};

// ===========================================================================
// 6. LA MEMORIA DEL PERCORSO: Registro delle notti (a7) e Diario di Ferruccio (b8)
// ===========================================================================
/** La run in corso è passata per l'Acquedotto: lo si scrive nella sua voce del Registro. */
function ricordaPercorsoD6() {
  statoRun.passatoAcquedottoD6 = statoRun.numeroRun;
  try { if (typeof a7 === 'object' && a7 && a7.run) a7.run.percorso = 'acquedotto'; } catch (_) { /* a7 assente */ }
}

// Registro di a7: una riga in più nella pergamena di fine run (sotto la colonna di sinistra)
if (typeof disegnaPergamenaA7 === 'function') {
  const disegnaPergamenaBaseD6 = disegnaPergamenaA7;
  disegnaPergamenaA7 = function (...args) {
    const r = disegnaPergamenaBaseD6.apply(this, args);
    try {
      const v = a7.pergamena && a7.pergamena.voce;
      if (v && v.percorso === 'acquedotto') {
        const P = CONFIG_A7.pergamena, y = P.y + 70 + 12 * 17, x = P.x + 26;
        drawTextFit(`${TESTI_D6.pergamena[0]}:`, x, y, 120, { size: 7.5, color: '#6b4423', shadow: false, align: 'left' });
        drawTextFit(TESTI_D6.pergamena[1], x + 124, y, P.w / 2 - 36 - 124, { size: 8, color: '#3b2210', shadow: false, align: 'left' });
      }
    } catch (err) { console.error('[d6] pergamena', err); }
    return r;
  };
}

// Diario di Ferruccio di b8: una riga nella pagina di quella notte. Se la notte è finita proprio all'Acquedotto
// prende il posto della riga «sono arrivato alla Villa Comunale» (non ci è passato).
if (typeof componiPaginaB8 === 'function') {
  const componiPaginaBaseD6 = componiPaginaB8;
  componiPaginaB8 = function (v, nota, ...resto) {
    const pagina = componiPaginaBaseD6.call(this, v, nota, ...resto);
    try {
      if (v && v.percorso === 'acquedotto' && v.esito !== 'piazza' && pagina && Array.isArray(pagina.righe)) {
        const riga = TESTI_D6.diario[Math.abs(Math.floor(Number(pagina.notte) || 0)) % TESTI_D6.diario.length];
        if (!pagina.righe.includes(riga)) {
          const dellaVilla = (typeof DIARIO_B8 !== 'undefined' && DIARIO_B8.cammino && DIARIO_B8.cammino[ACQUEDOTTO_D6.pianoLuogo]) || [];
          const i = pagina.righe.findIndex((r) => dellaVilla.some((t) => String(t).toLowerCase() === String(r).toLowerCase()));
          if (i >= 0) pagina.righe[i] = riga; else pagina.righe.splice(Math.min(2, pagina.righe.length), 0, riga);
        }
      }
    } catch (err) { console.error('[d6] diario', err); }
    return pagina;
  };
}

// ===========================================================================
// 7. LA MUSICA DEL LUOGO (a8): un tema in più, scelto finché il piano è l'Acquedotto
// ===========================================================================
/** Tema «acquedotto» nel formato di MUSICA.temi (a8-musica.js): barcarola larga, arpeggi che scorrono. */
const MUSICA_D6 = Object.freeze({
  id: 'acquedotto',
  tema: {
    bpm: 66, radice: 62, scala: 'minore', basso: 'X..x..', organetto: 'tenuto', tamburello: 'x..x..', volume: 1,
    accordi: ['i', 'VII', 'VI', 'V', 'i', 'iv', 'N', 'V'],
    melodia: ['0 2 4 7 4 2', '6 4 2 1 2 4', '5 3 1 0 1 3', '4 - 2 4 - -', '7 4 2 0 2 4', '5 3 5 7 5 3', '1 - 3 5 - 3', '4 - - 2 - -'],
  },
});

/** Registra il tema e punta il piano 2 del ciclo sul tema giusto (Acquedotto o quello di sempre). */
function intonaD6() {
  try {
    if (typeof MUSICA !== 'object' || !MUSICA || !MUSICA.temi || !MUSICA.temaPerPiano) return;
    if (!MUSICA.temi[MUSICA_D6.id] && !Object.isFrozen(MUSICA.temi)) MUSICA.temi[MUSICA_D6.id] = MUSICA_D6.tema;
    if (!MUSICA.temi[MUSICA_D6.id] || Object.isFrozen(MUSICA.temaPerPiano)) return;
    const k = ACQUEDOTTO_D6.pianoLuogo;
    if (d6.temaVilla === undefined) d6.temaVilla = MUSICA.temaPerPiano[k];
    MUSICA.temaPerPiano[k] = acquedottoAttivoD6() ? MUSICA_D6.id : d6.temaVilla;
  } catch (_) { /* senza musica si gioca lo stesso */ }
}
intonaD6();

// ===========================================================================
// SONDA QA / SVILUPPO
// ===========================================================================
Object.assign(window.__teatro.interni, {
  ACQUEDOTTO_D6, QUARTIERE_D6, NEMICI_D6, SOSTITUZIONI_D6, SCHEDA_D6, BOSS_D6, STATI_D6, TESTI_D6, MUSICA_D6,
  acquedottoD6: Object.freeze({
    /** Il piano (o quello in corso) è l'Acquedotto? */
    attivo: (piano) => acquedottoAttivoD6(piano),
    /** Sviluppo/QA: marca un piano come Acquedotto (o no) senza andarci. */
    segna: segnaAcquedottoD6,
    /** Sviluppo/QA: scende subito nel condotto dal piano in corso. */
    prendi: prendiAcquedottoD6,
    /** La grata della stanza corrente: { aperta, gratis } o null. */
    get grata() { const g = grataQuiD6(); return g ? { aperta: g.aperta, gratis: Boolean(g.gratis), x: ACQUEDOTTO_D6.grata.x, y: ACQUEDOTTO_D6.grata.y } : null; },
    /** Stato della raffica. */
    get vento() { return { ...d6.vento }; },
    /** Sviluppo/QA: impone la fase della raffica ('calma' | 'annuncio' | 'raffica') e il verso (−1 | 1). */
    forzaVento(fase, dir = 1, tick0) {
      const V = ACQUEDOTTO_D6.vento;
      d6.vento.fase = fase; d6.vento.dir = dir < 0 ? -1 : 1;
      d6.vento.t = tick0 !== undefined ? tick0 : fase === 'raffica' ? V.rafficaTick : fase === 'annuncio' ? V.annuncioTick : V.attesaMaxTick;
      if (fase === 'raffica') d6.vento.forza = 1;
    },
    /** Canali della stanza corrente (copie). */
    get canali() { const st = statoRun.stanzaCorrente; return ((st && st.canaliD6) || []).map((c) => ({ ...c })); },
    /** C'è corrente nel punto (x, y) della stanza corrente? Rende { dx, dy } o null. */
    corrente(x, y) { const c = correnteInD6(statoRun.stanzaCorrente, x, y); return c ? { dx: c.dx, dy: c.dy } : null; },
    get inAcqua() { return Boolean(d6.inAcqua); },
    /** Il Guardiano della stanza corrente: stato dell'IA, fase, acqua. */
    get stato() {
      const st = statoRun.stanzaCorrente;
      const n = st && st.nemici.find((x) => x.boss && x.bossId === SCHEDA_D6.id);
      if (!n) return null;
      return { bossId: n.bossId, nome: n.nome, stato: n.statoD6 || null, fase2: Boolean(n.fase2D6), sotto: Boolean(n.sottoD6), hp: n.hp, maxHp: n.maxHp,
        x: n.x, y: n.y, livello: st.acquaD6 ? st.acquaD6.livello : 0, dir: st.acquaD6 ? st.acquaD6.dir : 0, proiettili: statoRun.proiettiliNemici.length };
    },
    get anime() { return d6.anime.length; },
  }),
});
