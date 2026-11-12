/*
 * teatro/b8-finali-diario.js — (squadra b8) IL FINALE VERO, IL FINALE SEGRETO, IL DIARIO DI FERRUCCIO, LA VOCE.
 * Proposta, fonti e testi completi: production/finali-teatro.md. Tutti i testi qui sotto sono DA APPROVARE
 * DALL'AUTORE, tranne quelli presi alla lettera dalla bibbia (trama/ferruccio-bibbia.md, trama/storia.json).
 *
 *   1. FINALE VERO («Ultimo atto: il bivio»). La prima volta che Donna Luciana cade in uno slot, chiusa la
 *      pergamena di a7, parte una sequenza di scene a schermo intero (fase nuova: statoRun.fase === 'finale'):
 *      il bivio della bibbia (Spezza il Velo / Risparmia), le conseguenze secondo i flag (Tonino, Medaglione,
 *      Patto), l'epilogo «Bis», i titoli di coda, il ritorno in Piazza Dante. Sblocca e dichiara la «Notte
 *      senza fine» (il ciclo oltre la Reggia). Dopo la prima volta, caduta Donna Luciana compare il cordone
 *      del sipario: [E] rimette in scena l'ultimo atto. Si rivede dal Diario.
 *   2. FINALE SEGRETO. La porta della bottega di Gaetano nell'hub (t4-hub-storia.js › disegnaPortaBottega) è
 *      chiusa da 3 SIGILLI: uno per quartiere, ciascuno rotto da un ferro di Gaetano (tenaglie nella stanza
 *      segreta del piano 1; punzone G. F. alla fontana dell'ingresso del piano 2 dopo il boss; lima dal boss
 *      del piano 3 battuto senza perdere maschere). Poi serve il finale vero e bussare col ritmo del martello
 *      (tre colpi, una pausa, uno). Dietro: la Fucina del Ricordo (Gaetano rende il volto: ricompensa «Il Volto
 *      Ritrovato», registrata in a6) e la scala che sale SOPRA LA RIBALTA, dal Grande Burattinaio.
 *      AGGANCIO per lo scontro (un'altra squadra): interni.sigilli (0..3), interni.entraSopraLaRibalta(),
 *      interni.finaleSopraLaRibalta(), interni.scontroSopraLaRibalta (null: se è una funzione parte prima).
 *   3. DIARIO DI FERRUCCIO: una pagina per notte composta dal Registro di a7 e da frasi d'autore; ultime 60
 *      notti per slot (localStorage CONFIG_B8.prefissoDiario + slot). [N] dal menu di pausa, dall'hub e dal
 *      Diario degli oggetti; [F] sezione «Finali».
 *   4. LA VOCE: didascalie che non fermano il gioco (boss, fine atto, fine notte, trasformazioni, momenti
 *      rari) con un mormorio sintetizzato; dopo la caduta di Donna Luciana diventano indicazioni «senza regia».
 *
 * Stato per slot nel flag T3 CONFIG_B8.chiaveFlag (come a6). Si avvolgono le function di primo livello
 * t4Gancio, nuovaRun, entraInStanza, interagisciStanza, disegnaStanzaPixelArt, apriMuroSegreto,
 * getRaccontoAtto, disegnaMenuPausa, gestisciClickMenuPausa, tastoDiarioD, clickDiarioD, disegnaDiarioD
 * (sempre chiamando la base). Un solo gancio in un file di base: t4-hub-storia.js › disegnaPortaBottega chiama
 * window.__teatro.portaBottegaB8(p). Script classico caricato dopo a7-registro-bilancio.js. Regole: LEGGIMI.md.
 * QA: tools/qa-teatro-finali.js. Sonda: window.__teatro.interni.finaliB8.
 */

// ===========================================================================
// 1. TABELLE: numeri
// ===========================================================================
const CONFIG_B8 = Object.freeze({
  chiaveFlag: 'finaliB8',                    // flag dello slot T3 con lo stato di finali e segreto
  chiaveLocale: 'ferruccio.teatro.finaliB8', // ripiego se T3 non c'è
  prefissoDiario: 'ferruccio.teatro.diario.', // localStorage: + numero dello slot
  versione: 1,
  maxPagine: 60,                             // notti conservate nel Diario per slot
  bossFinale: 'donna-luciana',
  attesaFinaleTick: 80,                      // dalla chiusura della pergamena di a7 all'inizio del finale
  cacheStatoMs: 250,
  tasti: Object.freeze({ diario: 'KeyN', finali: 'KeyF' }),
  avanza: Object.freeze(['Space', 'KeyE', 'Enter']),
  // scene dei finali
  scena: Object.freeze({ yPalco: 262, transizioneTick: 16, caratteriPerTick: 1.5, minimoNeroTick: 70, rigaTitoliTick: 50 }),
  cartiglio: Object.freeze({ x: 58, y: 266, w: 524, h: 82 }),
  cartiglioHub: Object.freeze({ x: 36, y: 80, w: 568, h: 84 }), // come quello di t4-hub-storia.js
  scelta: Object.freeze({ x: 96, y: 150, w: 448, h: 190, optH: 50 }),
  // didascalie della Voce
  // in gioco la didascalia sta in basso a destra (sotto il muro, fuori dall'HUD); altrove in basso al centro
  didascalia: Object.freeze({ fondo: 354, wMax: 440, wMaxGioco: 318, xGioco: 472, entrataMs: 250, baseMs: 1900, perCarattereMs: 38, uscitaMs: 450, maxCoda: 3, pausaFraMs: 300,
    urgenti: Object.freeze(['boss', 'fineNotte']) }),
  suonoVoce: Object.freeze({ hz: 164, durataS: 0.55, volume: 0.07, formanti: Object.freeze([520, 880, 640]) }),
  // menu di pausa: linguetta accanto al Diario degli oggetti
  linguetta: Object.freeze({ x: 474, y: 258, w: 150, h: 30 }),
  // ultimo atto a richiesta: cordone del sipario nella stanza di Donna Luciana
  cordone: Object.freeze({ x: 112, y: 128, raggio: 42 }),
  // ricompensa «Il Volto Ritrovato»
  volto: Object.freeze({ hpHalf: 1, invulnTick: 120, sblocco: 'b8-volto-ritrovato' }),
  sblocchi: Object.freeze({ senzaFine: 'b8-notte-senza-fine', sipario: 'b8-sipario-calato' }),
  diario: Object.freeze({ x: 60, y: 14, w: 520, h: 334, interlinea: 12.5 }),
});

/** Il segreto della porta della bottega: tre sigilli, tre ferri, il ritmo del martello. */
const SEGRETO_B8 = Object.freeze({
  serveFinaleVero: true,                     // la porta chiede anche l'epilogo «Bis» (decisione aperta n. 8)
  ferri: Object.freeze([
    Object.freeze({ id: 'tenaglie', nome: 'Le Tenaglie di Gaetano', breve: 'le tenaglie', quartiere: 'Corso Trieste', pianoNelCiclo: 1, sprite: 'b8Tenaglie' }),
    Object.freeze({ id: 'punzone', nome: 'Il Punzone G. F.', breve: 'il punzone', quartiere: 'Villa Comunale', pianoNelCiclo: 2, sprite: 'b8Punzone' }),
    Object.freeze({ id: 'lima', nome: 'La Lima di Gaetano', breve: 'la lima', quartiere: 'San Leucio', pianoNelCiclo: 3, sprite: 'b8Lima' }),
  ]),
  prefissoRaccolta: 'b8-ferro-',             // id dei raccoglibili a terra (tipo 'ricordo')
  tenaglie: Object.freeze({ x: 150, y: 246 }), // nella stanza segreta
  fontana: Object.freeze({ x: 498, y: 118, punzoneDy: 26 }), // nell'ingresso del piano 2
  porta: Object.freeze({ x: 320, y: 62, sogliaY: 86, raggio: 46, raggioVoce: 74, raggioSuono: 150 }),
  daNotte: Object.freeze({ luce: 2, voce: 2 }),
  // ritmo del martello dietro la porta (tick a 60 Hz): tre colpi, una pausa, uno
  ritmo: Object.freeze({ battiti: Object.freeze([0, 22, 44, 106]), cicloTick: 214 }),
  // la bussata del giocatore: tre colpi rapidi, una pausa, un colpo, poi silenzio
  bussata: Object.freeze({ rapidoMaxTick: 36, pausaMinTick: 45, pausaMaxTick: 180, silenzioTick: 50 }),
});

// Sprite pixel-art dei tre ferri (palette del Teatro: k nero, G/g acciaio, y oro, m/M legno).
SPRITE_OGGETTI.b8Tenaglie = [
  '.kk...kk.',
  'kGGk.kGGk',
  'kGgk.kgGk',
  '.kGGkGGk.',
  '..kGyGk..',
  '..kGGGk..',
  '.kGkkkGk.',
  '.kGk.kGk.',
  'kGk...kGk',
  'kGk...kGk',
  '.k.....k.',
];
SPRITE_OGGETTI.b8Punzone = [
  '..kkkkk..',
  '.kmmmmmk.',
  '.kmyymyk.',
  '.kmmmmmk.',
  '..kkkkk..',
  '...kGk...',
  '...kgk...',
  '...kGk...',
  '...kgk...',
  '...kGk...',
  '....k....',
];
SPRITE_OGGETTI.b8Lima = [
  '....k....',
  '...kgk...',
  '...kGk...',
  '...kgk...',
  '...kGk...',
  '...kgk...',
  '...kGk...',
  '..kkykk..',
  '..kmmmk..',
  '..kmMmk..',
  '...kkk...',
];

// ===========================================================================
// 2. TABELLE: testi (tutti DA APPROVARE DALL'AUTORE salvo [bibbia])
// ===========================================================================
const TESTI_B8 = Object.freeze({
  nomeSignora: 'Donna Luciana',              // la bibbia dice Violante: una sola costante (decisione aperta n. 1)
  nomi: Object.freeze({
    luciana: null,                           // = nomeSignora
    tonino: 'Tonino', guardia: 'Guardia', cittadino: 'Un cittadino', altro: 'Un altro',
    alto: 'Una voce dall\'alto', gaetano: 'Gaetano', burattinaio: 'Il Grande Burattinaio',
    voce: 'La Voce',
  }),
  avanti: 'Spazio / E',
  salta: 'Esc: chiudi',
  sceltaAiuto: '↑↓ / 1-2 · Conferma: Spazio / E',
  sceltaFatta: 'Scelta già fatta: Spazio / E',
  crediti: Object.freeze([
    'Storia, personaggi e mondo: l\'autore',
    'Teatro, marionette e ombre: la compagnia',
  ]),
  senzaFine: Object.freeze({
    nome: 'Notte senza fine',
    sblocco: 'Dopo Donna Luciana la botola porta al ciclo: il Teatro replica, più feroce.',
    botola: (ciclo, piano) => `▼▼ NOTTE SENZA FINE · CICLO ${ciclo} · PIANO ${piano} [Click / E] ▼▼`,
    atto: 'NOTTE SENZA FINE · CICLO',
    banner: (ciclo) => `★ DONNA LUCIANA È CADUTA! Botola: NOTTE SENZA FINE (ciclo ${ciclo}) · Cordone: cala il sipario`,
    cordone: 'CALA IL SIPARIO [E]',
    cordoneSotto: 'l\'ultimo atto, poi Piazza Dante',
  }),
  volto: Object.freeze({
    nome: 'Il Volto Ritrovato',
    sblocco: 'Una volta per notte, sotto l\'ultima maschera c\'è ancora qualcuno.',
    banner: '✦ IL VOLTO RITROVATO: sotto l\'ultima maschera c\'è un volto. Resti in piedi con ½ Maschera.',
  }),
  sipario: Object.freeze({ nome: 'Il sipario è calato', sblocco: 'Sopra la Ribalta il filo maestro è tagliato.' }),
  ferroTrovato: Object.freeze({
    tenaglie: 'Le tenaglie di mio padre. Con queste io e Taddeo tenemmo il ferro della spada.',
    punzone: 'Il punzone: G. F. L\'acqua lo ha tenuto per sei anni.',
    lima: 'La lima di mio padre, sul telaio. «Almeno quelle non le rompete.»',
  }),
  porta: Object.freeze({
    pillBussa: 'E: bussa alla bottega',
    pillEntra: 'E: entra nella bottega',
    notte1: Object.freeze(['Una porta di legno, sprangata. Sopra, l\'insegna di un fabbro. Sulla spranga, tre sigilli di ceralacca col giglio.']),
    stato: Object.freeze([
      'Dietro la porta un ferro batte. Tre colpi, una pausa, uno. Poi daccapo.',
      'Il primo sigillo è in briciole. Un ferro di mio padre è appeso al chiodo.',
      'Due sigilli rotti. Dentro, il martello ha saltato un colpo.',
    ]),
    indizio: Object.freeze({
      tenaglie: 'La ceralacca non si rompe con le mani: ci vogliono i ferri di chi abitava qui.',
      punzone: 'Mio padre firmava ogni ferro: G. F. Il punzone lo perse alla Villa, vicino all\'acqua. L\'acqua tace finché il suo guardiano è in piedi.',
      lima: 'A San Leucio una ragazza rideva: «Almeno quelle non le rompete.» Lì il ferro si arrende solo a chi non rompe niente. Nemmeno una maschera.',
    }),
    filo: Object.freeze([
      'I tre sigilli sono a terra. Ma un filo d\'oro scende dall\'alto e tiene chiusa la porta.',
      'Finché la Burattinaia regge la scena, non cede.',
    ]),
    bussa: Object.freeze([
      'I tre sigilli sono a terra e il filo d\'oro si è allentato. La porta non cede lo stesso.',
      'Bisogna bussare come batte lui.',
    ]),
    nonRisponde: 'La porta non risponde.',
    rispostaSigilli: 'La porta risponde: tre colpi, una pausa, uno. Ma i sigilli tengono.',
    rispostaFilo: 'La porta risponde. Ma il filo d\'oro la tiene.',
    aperta: 'La spranga cade. La porta della bottega è aperta.',
    sigilloRotto: 'Davanti alla bottega un sigillo si spacca. La ceralacca cade a briciole.',
  }),
  diario: Object.freeze({
    titolo: 'DIARIO DI FERRUCCIO',
    linguetta: 'DIARIO DI FERRUCCIO [N]',
    hub: 'N · Diario di Ferruccio',
    vuoto: 'Il quaderno è ancora bianco. Si scrive quando la notte finisce.',
    piedeNotti: '← → sfoglia · F: finali · N: oggetti · Esc: chiudi',
    piedeFinali: '↑↓ scegli · Invio: rivedi · F: notti · Esc: chiudi',
    piedeOggetti: 'N: Diario di Ferruccio',
    pagina: (i, n) => `pagina ${i} di ${n}`,
    finali: 'I FINALI',
    ignoto: '???',
    veroBloccato: 'Arriva in fondo alla commedia.',
    fucinaBloccata: 'In Piazza Dante c\'è una porta che non si apre.',
    ribaltaBloccata: 'Sopra il palco, qualcosa regge i fili.',
    vero: Object.freeze({ uccisa: 'Ultimo atto — Il Velo spezzato', risparmiata: 'Ultimo atto — Il Velo ricucito' }),
    fucina: 'La Fucina del Ricordo',
    ribalta: 'Sopra la Ribalta — il finale più vero',
    rivedi: 'Invio: rivedi',
    sigilli: (n) => `Sigilli della bottega rotti: ${n} di 3`,
    senzaFine: (si, ciclo) => (si ? `Notte senza fine: sbloccata · primato: ciclo ${ciclo}` : 'Notte senza fine: non ancora'),
    visti: (a, b) => `Finali visti sul palco: Velo spezzato ${a ? '✓' : '—'} · Velo ricucito ${b ? '✓' : '—'}`,
    volto: (si) => `Il Volto Ritrovato: ${si ? 'sì' : 'non ancora'}`,
  }),
});

/** Costruttori delle battute: d = didascalia, b = battuta di un personaggio. */
const dB8 = (testo, extra) => Object.freeze({ chi: 'didascalia', testo, ...(extra || {}) });
const bB8 = (chi, testo, extra) => Object.freeze({ chi, testo, ...(extra || {}) });

/**
 * FINALE_B8 — le scene dei tre finali. Ogni scena: fondale (vedi FONDALI_B8), stato iniziale del fondale,
 * battute (se: condizione sul contesto; set: cambia lo stato del fondale; fx: effetto) e, in coda, una scelta.
 * Condizioni (se): patto, noPatto, toninoRestituito, toninoNegato, toninoNonRestituito, medaglione, uccisa, risparmiata.
 * {signora} = TESTI_B8.nomeSignora, {n} = maschere appese (notti giocate).
 */
const FINALE_B8 = Object.freeze({
  vero: Object.freeze({
    apertura: [
      { id: 'mani-ferme', fondale: 'palco', stato: { signora: 'ginocchio', spada: 'alta' }, battute: [
        dB8('Le grandi Mani restano appese, aperte. Nessun filo le tira più.'),
        dB8('La Voce che raccontava la notte adesso è soltanto una donna in ginocchio sulle assi.'),
        bB8('luciana', 'Guardati. Hai attraversato un\'intera città per uccidere qualcuno.'),
        dB8('Ferruccio tiene la spada alzata.'),
        bB8('luciana', 'Io ho fatto tutto questo affinché nessuno dovesse farlo mai più.'),
        dB8('Le reliquie del Patto, addosso a Ferruccio, sono tiepide come seta appena tessuta.', { se: 'patto' }),
        bB8('luciana', 'E porti addosso i miei doni. Non dirmi che non ti hanno fatto comodo.', { se: 'patto' }),
        bB8('luciana', 'Nemmeno un dono hai voluto da me. Testardo come il ferro.', { se: 'noPatto' }),
        bB8('luciana', 'A quel venditore hai ridato una moglie morta. E lo chiami un regalo?', { se: 'toninoRestituito' }),
        bB8('luciana', 'Al venditore hai lasciato il suo sorriso. Hai scelto al posto suo: proprio come me.', { se: 'toninoNegato' }),
        dB8('In tasca Ferruccio ha ancora il Medaglione di Rosa. Per Tonino non ha deciso nessuno.', { se: 'medaglione' }),
        bB8('luciana', 'Se mi uccidi, torneranno la fame, l\'odio e la paura.'),
        bB8('luciana', 'Se mi risparmi, continueranno a sorridere.'),
        bB8('luciana', 'Dimmi, Ferruccio. Chi di noi due è davvero un mostro?'),
        dB8('La risposta appartiene a te.'),
      ], scelta: {
        flag: 'violante', titolo: 'Quanto vale la felicità?', sotto: '{signora} attende la tua decisione.',
        opzioni: [
          { id: 'uccisa', etichetta: 'Spezza il Velo', nota: 'La città sarà libera. Tornerà anche il dolore.' },
          { id: 'risparmiata', etichetta: 'Risparmia {signora}', nota: 'La città resterà in pace. Nessuno potrà più scegliere.' },
        ],
      } },
    ],
    rami: Object.freeze({
      uccisa: [
        { id: 'velo-spezzato', fondale: 'palco', stato: { signora: 'ginocchio', spada: 'alta' }, battute: [
          dB8('Ferruccio avanza. Lei non tenta di difendersi.'),
          bB8('luciana', 'Allora non hai imparato niente.'),
          dB8('Il giglio ricamato si spegne e i fili che attraversano la città si spezzano.', { set: { signora: 'caduta', spada: 'bassa' }, fx: 'colpo' }),
          dB8('Per un istante non si sente nulla.'),
        ] },
        { id: 'caserta-libera', fondale: 'cielo', stato: {}, battute: [
          dB8('Poi una donna comincia a piangere. Un bambino chiama sua madre.'),
          dB8('Un uomo ride davvero, sorpreso dalla propria risata.'),
          dB8('La luce della luna lascia spazio a un cielo azzurro e vivace.'),
          dB8('Le reliquie del Patto gli si sfanno in cenere tra le dita.', { se: 'patto' }),
        ] },
        { id: 'folla', fondale: 'piazzaGiorno', stato: { tonino: false }, battute: [
          bB8('guardia', 'La Signora! L\'ha ammazzata!'),
          bB8('cittadino', 'Era lei che dava da mangiare ai nostri figli!'),
          bB8('altro', 'Assassino!'),
          dB8('Tonino è tornato capace di soffrire e sa che Ferruccio lo ha aiutato.', { se: 'toninoRestituito', set: { tonino: true } }),
          bB8('tonino', 'Mi hai ridato mia moglie nei ricordi. Ma questo non ti dava diritto di togliere una vita!', { se: 'toninoRestituito' }),
          dB8('Gli scaglia contro un oggetto e tenta di fermarlo.', { se: 'toninoRestituito', set: { lancio: true } }),
          dB8('Il Velo scompare e Tonino ricorda improvvisamente Rosa.', { se: 'toninoNonRestituito', set: { tonino: true } }),
          bB8('tonino', 'E tu saresti quello che ci ha salvati?', { se: 'toninoNonRestituito' }),
          dB8('Ferruccio riesce a fuggire.', { set: { fuga: true } }),
        ] },
        { id: 'nero-uccisa', fondale: 'nero', frase: '«Il primo dono della libertà fu il diritto di odiarlo.»' },
      ],
      risparmiata: [
        { id: 'velo-ricucito', fondale: 'palco', stato: { signora: 'ginocchio', spada: 'alta' }, battute: [
          dB8('Ferruccio abbassa la spada.', { set: { spada: 'bassa' } }),
          bB8('luciana', 'Lo sapevo.'),
          bB8('luciana', 'In fondo, anche tu desideri soltanto che il dolore finisca.'),
          dB8('Ricuce il Velo. I fili tornano a estendersi sulle case di Caserta.', { set: { signora: 'piedi', fili: true } }),
          dB8('Le finestre si illuminano e le persone riprendono a sorridere.'),
          dB8('Le reliquie del Patto, addosso a Ferruccio, tornano a scaldarsi.', { se: 'patto' }),
          bB8('luciana', 'Non sarai ricordato come un eroe.'),
          bB8('luciana', 'Ma potrai vivere in pace.'),
        ] },
        { id: 'piazza-grigia', fondale: 'piazzaGrigia', stato: { piatti: false }, battute: [
          dB8('Piazza Dante. I commercianti sono tornati ai loro banchetti. Nessuno sembra preoccupato.'),
          bB8('tonino', 'Buongiorno, guagliò! Che bella giornata!'),
          dB8('Ferruccio osserva il cielo coperto.'),
          bB8('tonino', 'Eh, bellissima. Proprio bellissima.'),
          dB8('Il Velo torna a cancellare il suo lutto. Tonino canticchia mentre sistema due piatti sul tavolo.', { se: 'toninoRestituito', set: { piatti: true } }),
          bB8('tonino', 'Uno per me e uno per... boh. Sarà l\'abitudine.', { se: 'toninoRestituito' }),
          dB8('Tonino rimane identico al primo incontro.', { se: 'toninoNonRestituito' }),
          bB8('tonino', 'Sempre una bella giornata! Pure quando piove!', { se: 'toninoNonRestituito' }),
        ] },
        { id: 'nero-risparmiata', fondale: 'nero', frase: '«Nessuno aveva più bisogno di essere salvato. Nessuno poteva più chiedere aiuto.»' },
      ],
    }),
    epilogo: [
      { id: 'bis', fondale: 'platea', stato: { signora: 'caduta', mani: false, sipario: 'meta' }, battute: [
        dB8('Il sipario dovrebbe calare. Non cala.'),
        dB8('Ai polsi di {signora} ci sono fili d\'oro. Salgono più in alto, nel buio sopra il palco.', { set: { fili: true } }),
        dB8('Le grandi Mani, che credevi sue, si richiudono da sole. Portano guanti bianchi.', { set: { mani: true } }),
        bB8('alto', 'BIS! DA CAPO!', { fx: 'scossa' }),
        dB8('I fili tirano. La Burattinaia si rialza come si rialza una marionetta. Non parla più.', { set: { signora: 'piedi' } }),
        dB8('La luna torna al suo posto. In Piazza Dante un lampione si riaccende.'),
        dB8('Sul fondale, dove i fili piegano, c\'è dipinta una porta. Ha l\'insegna di un fabbro e tre sigilli.', { set: { porta: true } }),
      ] },
      { id: 'titoli-vero', fondale: 'titoli', righe: [
        { t: '«La libertà non promette la felicità.', stile: 'frase' },
        { t: 'Promette soltanto che sarà tua la scelta.»', stile: 'frase' },
        { t: '' },
        { t: 'FERRUCCIO — LA NOTTE IMMOBILE', stile: 'titolo' },
        { t: 'Caserta, 1845', stile: 'sotto' },
        { t: 'Una storia di marionette per un pubblico di ombre.', stile: 'sotto' },
        { t: '', crediti: true },
        { t: '' },
        { t: 'NOTTE SENZA FINE — sbloccata', stile: 'oro' },
        { t: 'Dopo {signora} la botola porta al ciclo: il Teatro replica, più feroce.', stile: 'sotto' },
        { t: '' },
        { t: '[Il copione è strappato. Nessuno detta più le tue parole.]', stile: 'quadre' },
      ] },
    ],
  }),
  fucina: Object.freeze({
    apertura: [
      { id: 'fucina', fondale: 'fucina', stato: { brace: true, batte: true, volto: false, tempra: false }, battute: [
        dB8('Dietro la porta non c\'è una strada. C\'è una bottega, e in fondo una scala a pioli che sale nel buio.'),
        dB8('La fucina era spenta da sei anni. Quando Ferruccio entra, la brace si riaccende da sola.'),
        dB8('All\'incudine c\'è un uomo di spalle. Batte: tre colpi, una pausa, uno. Poi si ferma.', { set: { batte: false } }),
        bB8('gaetano', 'Ferruccio.'),
        dB8('È la prima volta, in tutta la notte, che il tuo nome non suona come un ordine.'),
        bB8('gaetano', 'Fatti guardare.'),
        dB8('Ti toglie la maschera nera come si toglie un ferro dal fuoco: senza fretta.', { set: { volto: true } }),
        dB8('Sotto c\'è una faccia. È la tua. Te l\'eri scordata.'),
        bB8('gaetano', 'Eccoti.'),
        dB8('Poi tende la mano. Vuole le forbici: quelle che porti dalla prima notte.'),
        bB8('gaetano', 'Queste le ho fatte io. Tagliano la lamiera. L\'oro no: l\'oro va tagliato caldo.', { set: { tempra: true } }),
        dB8('Le arroventa, le ribatte, le tempra. Tre colpi, una pausa, uno.', { set: { batte: true } }),
        bB8('gaetano', 'Io resto qui. I ricordi non salgono le scale.', { set: { batte: false } }),
        bB8('gaetano', 'Non lo fare per me, figlio. Io non te l\'ho mai chiesto.'),
      ], scelta: {
        flag: 'scala', titolo: 'La scala sale sopra la ribalta.', sotto: 'Le forbici sono ancora calde.',
        opzioni: [
          { id: 'sali', etichetta: 'Sali sopra la ribalta', nota: 'Dove le Mani reggono i fili. Non si scende com\'eri salito.' },
          { id: 'resta', etichetta: 'Resta ancora un poco', nota: 'La porta resta aperta. Il fuoco resta acceso.' },
        ],
      } },
    ],
    rami: Object.freeze({
      sali: [
        { id: 'congedo', fondale: 'fucina', stato: { brace: true, batte: false, volto: true, tempra: false, scala: true }, battute: [
          bB8('gaetano', 'Prima fate uscire i ragazzi.'),
          dB8('Lo dice piano, stavolta. E guarda la scala.'),
        ] },
      ],
      resta: [
        { id: 'a-domani', fondale: 'fucina', stato: { brace: true, batte: false, volto: true, tempra: false }, battute: [
          bB8('gaetano', 'A domani, figlio. Il fuoco resta acceso.'),
        ] },
      ],
    }),
    epilogo: [],
  }),
  ribalta: Object.freeze({
    apertura: [
      { id: 'graticcia', fondale: 'ribalta', stato: {}, battute: [
        dB8('Sopra la ribalta non c\'è cielo: c\'è la graticcia. Travi, corde, e sotto, piccolo, tutto il Teatro.'),
        dB8('Ai ganci sono appese le tue maschere: una per ogni notte. Ne conti {n}. Ognuna ricucita con un punto d\'oro.'),
        dB8('È così che ogni sera tornavi in scena. Qualcuno ti rimetteva insieme.'),
        dB8('Da ogni burattino di Caserta sale un filo. Anche dai polsi della Burattinaia. Anche da te.'),
        dB8('Il Burattino Senza Filo ne aveva due, sottili come capelli. Non li aveva mai visti.'),
      ] },
      { id: 'burattinaio', fondale: 'mani', stato: { tagliato: false }, battute: [
        dB8('In cima a tutti i fili ci sono due mani. Guanti bianchi. Sono le Mani che credevi di {signora}.'),
        dB8('Non c\'è un volto, sopra. Solo le Mani, e un paio di forbici grandi come un portone.'),
        dB8('Con quelle, ogni volta che cadevi, ti strappava i fili. Poi li riannodava, e la notte ricominciava.'),
        bB8('burattinaio', 'BIS!', { fx: 'scossa' }),
        bB8('burattinaio', 'DA CAPO!', { fx: 'scossa' }),
        dB8('Non sa dire altro. Non vuole altro: che la commedia non finisca.'),
        dB8('La Signora gli ha dato una città intera da far recitare. Ma le Mani sono più vecchie di lei, e di Caserta.'),
        dB8('Tutti i fili, salendo, si torcono in uno solo: il filo maestro. Lo tiene con due dita.'),
      ] },
      { id: 'filo-maestro', fondale: 'mani', stato: { tagliato: false, assalto: true }, battute: [
        dB8('Le forbici colossali si chiudono dove un attimo prima c\'era Ferruccio. Tagliano l\'aria.', { fx: 'scossa' }),
        dB8('Ferruccio ha in mano le forbici di suo padre. Piccole. Ancora calde di fucina.', { set: { assalto: false } }),
        dB8('Non lo fa per suo padre. Lo fa lo stesso.'),
        dB8('Un colpo solo. Il filo maestro canta come una corda di violino, e si spezza.', { set: { tagliato: true }, fx: 'colpo' }),
        dB8('Le Mani si aprono. Per un momento cercano qualcosa da reggere. Poi restano guanti vuoti.'),
        dB8('I fili d\'oro cadono sul palco come pioggia. Giù, i burattini restano in piedi lo stesso.'),
        dB8('Nessuno gliel\'aveva chiesto. Nemmeno stavolta.'),
      ] },
      { id: 'cala-il-sipario', fondale: 'platea', stato: { signora: 'nessuna', sipario: 'cala', alzati: false }, battute: [
        dB8('Il sipario cala. Stavolta nessuno grida bis.'),
        dB8('In platea le ombre si alzano, una a una. Hanno facce. Si guardano intorno come chi si sveglia in chiesa.', { set: { alzati: true } }),
        dB8('Fuori dal Teatro c\'è Caserta libera, che lo odia. Nessun filo, adesso, li obbliga: lo scelgono.', { se: 'uccisa' }),
        dB8('Fuori dal Teatro c\'è Caserta che sorride sotto il Velo. Ma la commedia che glielo faceva sembrare giusto è finita.', { se: 'risparmiata' }),
        dB8('Ferruccio scende la scala a viso scoperto. Nessuno lo tiene in piedi. Sta in piedi da solo.'),
      ] },
      { id: 'nero-ribalta', fondale: 'nero', frase: '«Sotto la maschera c\'era ancora qualcuno.»' },
      { id: 'titoli-ribalta', fondale: 'titoli', righe: [
        { t: '«La libertà non promette la felicità.', stile: 'frase' },
        { t: 'Promette soltanto che sarà tua la scelta.»', stile: 'frase' },
        { t: '' },
        { t: 'IL FINALE PIÙ VERO — SOPRA LA RIBALTA', stile: 'titolo' },
        { t: 'Il sipario è calato per sempre.', stile: 'sotto' },
        { t: 'Chi vuole può ancora salire sul palco: stavolta per scelta.', stile: 'sotto' },
        { t: '' },
        { t: 'IL VOLTO RITROVATO', stile: 'oro' },
        { t: 'Una volta per notte, sotto l\'ultima maschera c\'è ancora qualcuno.', stile: 'sotto' },
        { t: '' },
        { t: '«Se nessuno vuole essere liberato, hai comunque il diritto di farlo?»', stile: 'frase' },
      ] },
    ],
    rami: Object.freeze({}),
    epilogo: [],
  }),
});

/** Indizi che Tonino aggiunge dopo una chiacchierata, uno per notte. se: condizione sullo stato del segreto. */
const INDIZI_B8 = Object.freeze([
  Object.freeze({ id: 'dopo', daNotte: 1, se: (s) => s.segretoVisto, voci: [
    bB8('tonino', "'O vvi'? T''o dicevo io: sotto 'sta maschera ce steva ancora qualcuno."),
  ] }),
  Object.freeze({ id: 'bottega', daNotte: 3, se: (s) => !s.portaAperta, voci: [
    bB8('tonino', "Chella porta? È 'a puteca 'e Gaetano 'o ferraro."),
    bB8('tonino', "'A sigillajeno doppo 'o fatto d''o cantiere. Tre sigille. E chi s''o ricorda cchiù pecché."),
    bB8('tonino', "Ma 'a notte, si staje zitto, siente 'o martiello."),
  ] }),
  Object.freeze({ id: 'mariella', daNotte: 4, se: (s) => !s.portaAperta && !s.ferri.tenaglie, voci: [
    bB8('tonino', "'A piccerella d''a fenesta nun parla maje. Stanotte ha ditto 'na cosa sola."),
    bB8('tonino', "«'O fierro sona areto a 'na porta ca nun ce sta, 'ncopp''o Corso.»"),
  ] }),
]);

/**
 * DIARIO_B8 — frasi del Diario di Ferruccio (prima persona). Ogni gruppo ha più varianti: non si ripete quella
 * della pagina prima. Segnaposto: {n} notte, {personaggio}, {stanze}, {nemici}, {ciclo}, {boss}, {fonte},
 * {elenco}, {patto}, {nuovo}, {nome}, {quanti}.
 */
const DIARIO_B8 = Object.freeze({
  apertura1: ['Mi sono svegliato in Piazza Dante. La luna non si muove. Non ho voce: scrivo.'],
  apertura: [
    'Notte {n}. Stesso lampione, stessa luna. Io no: io me le ricordo tutte.',
    'Notte {n}. Il lampione si è riacceso da solo, come sempre. Mi sono alzato.',
    'Notte {n}. Ho contato le lanterne prima di partire. Poi ho smesso di contare.',
    'Notte {n}. Tonino mi ha salutato come se fosse la prima volta.',
  ],
  aperturaAltro: [
    'Notte {n}. Stanotte in scena c\'era {personaggio}. Io guardavo da dietro le quinte, e scrivo lo stesso.',
    'Notte {n}. È salito sul palco {personaggio}. Il quaderno però resta mio.',
  ],
  piazza: ['Non sono uscito dalla piazza. Ho guardato la luna finché qualcuno ha spento le lanterne.'],
  cammino: Object.freeze({
    1: ['Non sono uscito da Corso Trieste. La pioggia sa di ruggine.', 'Corso Trieste e basta. I basoli erano bagnati e io ero lento.'],
    2: ['Sono arrivato alla Villa Comunale. Le lucciole fanno più luce delle finestre.', 'Fino alla Villa. Le statue mi guardavano passare senza girare la testa.'],
    3: ['Sono arrivato a San Leucio. I telai battono anche senza nessuno.', 'Fino a San Leucio. Lì ogni colpo costa una maschera intera, e lo si impara presto.'],
    4: ['Ho visto la Reggia con le torce accese. Il marmo a scacchi è freddo anche col fuoco.', 'Sono entrato nella Reggia. Le guardie non mi hanno chiesto chi fossi.'],
    oltre: ['Oltre la Reggia il Teatro ricomincia da capo, più feroce. Ciclo {ciclo}.', 'La botola mi ha riportato a Corso Trieste. Stessa pioggia, denti più lunghi. Ciclo {ciclo}.'],
  }),
  conteggio: ['Ho ripulito {stanze} stanze. {nemici} ombre in meno, per stanotte.', '{stanze} stanze ripulite, {nemici} ombre a terra.'],
  boss: Object.freeze({
    're-gatto': ['Ho battuto il Gatto dei Quattro Canti. Dentro non c\'era un mostro: c\'era la roba di casa di qualcuno.', 'Il Gatto dei Quattro Canti è caduto. Si è sciolto in luci che salivano, come ricordi restituiti.'],
    'regina-vespa': ['Ho battuto la Regina delle Vespe. Le sue vespe portavano qualcosa verso la Reggia: desideri, credo. Non loro.', 'La Regina delle Vespe è caduta. Lo sciame si è perso come una promessa non mantenuta.'],
    'colosso-statua': ['Ho battuto il Custode di Marmo. Custodiva nomi di operai. Quello di mio padre non l\'ho letto.', 'Il Custode di Marmo si è aperto. Per un momento ho sentito una voce: «Prima fate uscire i ragazzi!»'],
    'capitano-guardia': ['Ho battuto il Capitano di Piombo. Sotto il piombo ho riconosciuto un passo che conoscevo da bambino.', 'Il Capitano di Piombo è caduto. Obbediva e basta. Lo so com\'è.'],
    'maestro-fucina': ['Ho battuto lo Spezzafili d\'Ottone. Le sue forbici somigliavano a quelle di mio padre. Non mi è piaciuto.', 'Lo Spezzafili d\'Ottone è caduto. Tagliava fili: non i suoi.'],
    'donna-luciana': ['Ho fermato le Mani di Donna Luciana. La voce che mi raccontava la notte era la sua.', 'Donna Luciana è in ginocchio. Ai polsi ha fili d\'oro, come tutti noi.'],
    generico: ['Ho battuto {boss}. Non ha lasciato un corpo: solo luci che salivano.', '{boss} è caduto. Un\'altra cosa del Velo che torna a essere di qualcuno.'],
  }),
  morte: Object.freeze({
    luciana: ['Mi hanno schiacciato le Mani di Donna Luciana. Scendono dall\'alto come una trave.', 'Donna Luciana. Non mi ha toccato lei: le sue Mani.'],
    boss: ['Mi ha spezzato {fonte}. Ci torno.', '{fonte}: stanotte ha vinto. Ho visto come si muove.'],
    gatto: ['Mi ha preso un gatto d\'ombra. Balzano senza rumore, come la roba che ti manca.', 'Un gatto. Ancora un gatto. La maschera si è spezzata sul selciato bagnato.'],
    vespa: ['Mi hanno finito le vespe. Pungono dove sei già rotto.', 'Una vespa cieca. Lei non vedeva me, io non ho visto lei.'],
    guardia: ['Mi ha abbattuto una guardia. Sparava a doppiette, senza odio. È peggio.', 'Una guardia della Reggia. Faceva il suo dovere, come tutti quella notte.'],
    statua: ['Mi ha spezzato una statua. Sta ferma e ti aspetta: il marmo ha pazienza.', 'Una statua. Le sue croci di luce le ho viste tardi.'],
    maschera: ['Mi ha finito una maschera d\'osso. Si apre solo per sparare, come certa gente parla solo per ferire.', 'Una maschera d\'osso. Somigliava alla mia.'],
    bomba: ['Sono saltato su una bomba. Mia, forse. Non lo scrivo a nessuno.', 'Un botto, poi le lanterne. Le bombe non guardano in faccia.'],
    sangue: ['Ho dato troppo sangue. Certe stanze chiedono e tu paghi, finché non resta niente.'],
    generico: ['Sono caduto contro {fonte}. La maschera si è spezzata.', '{fonte}: stanotte è finita lì.', 'Le maschere sono finite contro {fonte}. Le lanterne si sono spente una a una.'],
    abbandono: ['Ho lasciato la notte a metà. Si può fare: tanto ricomincia.', 'Sono tornato in piazza prima della fine. Nessuno se n\'è accorto.'],
  }),
  oggetti: Object.freeze({
    nessuno: ['Non ho raccolto niente. A mani vuote si cammina leggeri, e si cade lo stesso.'],
    alcuni: ['Ho raccolto {elenco}. Roba d\'altri, che adesso porto io.', 'Ho raccolto {elenco}. Il Teatro presta, non regala.'],
    patto: ['Ho stretto un patto col Velo: {patto}. Mi è costato una maschera. Scalda, e non mi piace che scaldi.', 'Ho preso {patto} dall\'altare dell\'Ombra. È seta sua. Lo so.'],
    nuovo: ['{nuovo}: non l\'avevo mai visto prima. L\'ho segnato nel quaderno.'],
    consumabili: ['Ho usato {quanti} fra ampolle e carte. Le carte napoletane non mentono, le ampolle sì.', 'Ampolle e carte: {quanti}. Si beve senza sapere, come si vive qui.'],
  }),
  speciali: Object.freeze({
    sacrificio: ['Ho lasciato sangue sul ceppo. Il Teatro accetta tutto.'],
    maledetta: ['Sono passato dai Camerini, per la porta di servizio. Il chiodo si è tenuto un filo; gli specchi, la mia faccia.'], // (d4) erano i Rovi
    bisca: ['Alla Bisca ho giocato al lotto. La smorfia dà i numeri, non le ragioni.'],
    sfida: ['Ho accettato una Sfida. Il pubblico di ombre non applaude, ma guarda.'],
  }),
  scelte: Object.freeze({
    restituito: ['Ho ridato a Tonino il ricordo di Rosa. Ha pianto. Ha detto che gli mancava pure quello.'],
    negato: ['Ho tenuto per me il ricordo di Rosa. Tonino ride e guarda una sedia vuota. Ho scelto io per lui.'],
    medaglione: ['Dal Gatto è caduto un medaglione. Dentro c\'è una donna che si chiama Rosa. Non so ancora cosa farne.'],
  }),
  trasformazione: ['Stanotte sono diventato altro: {nome}. Il legno prende la forma di quello che porta.', '{nome}. Non l\'ho scelto: è successo, pezzo dopo pezzo.'],
  finale: Object.freeze({
    uccisa: ['Ho spezzato il Velo. La città si è svegliata e la prima cosa che ha fatto è stata odiarmi.'],
    risparmiata: ['Ho abbassato la spada. Caserta sorride. Io sono l\'unico che sa perché.'],
    bis: ['Poi dall\'alto qualcuno ha gridato bis, e tutto è tornato al suo posto. Le Mani avevano guanti bianchi.'],
  }),
  ferri: Object.freeze({
    tenaglie: ['Dietro un muro di Corso Trieste c\'erano le tenaglie di mio padre. Con quelle io e Taddeo tenemmo il ferro della spada.'],
    punzone: ['Caduto il guardiano, la fontana della Villa ha ripreso a parlare. Sul fondo c\'era il punzone: G. F.'],
    lima: ['A San Leucio non ho rotto niente, per una volta. Sul telaio c\'era la lima di mio padre. «Siete venuto ad aggiustarlo o a finirlo?»'],
  }),
  segreto: Object.freeze({
    fucina: ['La porta della bottega si è aperta. Dentro c\'era mio padre che batteva. Mi ha tolto la maschera. Sotto c\'ero io.', 'Non sono salito. Non ancora. Il fuoco resta acceso.'],
    ribalta: ['Sono salito sopra la ribalta. In cima ai fili ci sono due mani coi guanti bianchi, e nessuna faccia.', 'Ho tagliato il filo maestro con le forbici di mio padre. Nessuno me l\'aveva chiesto.', 'Il sipario è calato. Sotto la maschera c\'era ancora qualcuno.'],
  }),
  semi: Object.freeze({
    porta: [
      'Passando davanti alla bottega chiusa ho sentito battere. Tre colpi, una pausa, uno.',
      'Sulla spranga della bottega ci sono tre sigilli col giglio. Qualcuno non vuole che quella porta faccia parte della scena.',
      'La Voce dice che quella porta è dipinta. Le porte dipinte non fanno rumore.',
    ],
    tenaglie: [
      'Mariella non parla mai. Tonino giura che stanotte ha detto: il ferro suona dietro una porta che non c\'è, sul Corso.',
      'Su Corso Trieste c\'è un muro che suona vuoto. I muri, di solito, non suonano.',
    ],
    punzone: [
      'Mio padre firmava ogni ferro: G. F. Il punzone lo perse alla Villa, vicino all\'acqua.',
      'L\'acqua della Villa tace finché il suo guardiano è in piedi. Dopo, bisogna tornare dove si è entrati.',
    ],
    lima: [
      'Mi è tornata una frase: «Almeno quelle non le rompete.» Era a San Leucio.',
      'A San Leucio il ferro si arrende solo a chi non rompe niente. Nemmeno una maschera.',
    ],
    filo: ['Tre sigilli rotti, e la porta non cede: un filo d\'oro la tiene dall\'alto. Bisogna far cadere chi regge la scena.'],
    bussa: [
      'I sigilli sono a terra e il filo si è allentato. Bisogna bussare come batte lui.',
      'Tre colpi, una pausa, uno. L\'ho scritto la seconda notte e non l\'avevo capito.',
    ],
    aperta: ['La porta resta aperta. Il fuoco resta acceso. In fondo alla bottega c\'è una scala.'],
  }),
  chiusa: [
    'Poi le lanterne si sono spente, una a una.',
    'Domani — cioè stanotte — ricomincio.',
    'Il legno ricorda ogni ferita. Io pure.',
    'Chiudo il quaderno. Il lampione si riaccenderà da solo.',
  ],
  chiusaDopo: ['Chiudo il quaderno. Nessuno, stanotte, mi ha rimesso insieme: mi sono alzato da solo.'],
});

/**
 * VOCE_B8 — didascalie di Donna Luciana (prima della sua caduta). boss: per id (estendibile con
 * interni.finaliB8.registraVoceBoss); {boss} nome del boss, {nome} trasformazione, {ciclo}.
 */
const VOCE_B8 = {
  boss: {
    're-gatto': [
      'Signori, il Gatto dei Quattro Canti: fatto di tutto ciò che le case hanno dimenticato.',
      'Ecco chi fa le fusa sulle vostre soglie vuote. Inchinati, Ferruccio: è il padrone di casa.',
      'Un gatto, una piazza, quattro cantoni. Indovina in quale si nasconde la tua fine.',
    ],
    'capitano-guardia': [
      'Avanti il Capitano di Piombo: non pensa, non dubita, non manca mai il passo.',
      'Un soldato obbedisce, Ferruccio. È tanto più riposante che scegliere.',
      'Piombo nelle vene e un ordine nel petto. Fagli il saluto, prima che lo faccia lui.',
    ],
    'regina-vespa': [
      'S\'inchini la platea alla Regina delle Vespe: ogni suo ago è un desiderio che non era vostro.',
      'Senti come ronza la voglia degli altri? Lei la porta a casa mia, una goccia alla volta.',
      'La Regina non punge per cattiveria. Riscuote.',
    ],
    'colosso-statua': [
      'Il Custode di Marmo: sta in piedi da sei anni e non ha ancora perdonato nessuno.',
      'Piano, Ferruccio. Il marmo custodisce i morti, e i morti hanno il sonno leggero.',
      'Guarda come veglia. Anche lui aveva promesso qualcosa a qualcuno.',
    ],
    'maestro-fucina': [
      'Lo Spezzafili d\'Ottone! Taglia tutto ciò che pende. Tu, per fortuna, non pendi da niente. Vero?',
      'Forbici d\'ottone, mano di fabbro. Ti ricorda qualcuno, piccolo mio?',
      'Zac. Zac. Sentilo come accorda le lame: è la sua ouverture.',
    ],
    'donna-luciana': [
      'Su la tela sull\'ultima scena. Recita bene, Ferruccio: il pubblico ricorda soltanto il finale.',
      'Le mie Mani non applaudono. Schiacciano.',
    ],
  },
  bossGenerico: [
    'Entra in scena {boss}. Non era nel copione: l\'ho aggiunto per te.',
    'Signori, {boss}. Trattatelo bene: è nuovo della compagnia.',
    '{boss}. Ogni teatro ha le sue sorprese, Ferruccio. Questa morde.',
  ],
  fineAtto: {
    1: ['Cala la tela sul primo atto. Hai vinto una scena, Ferruccio: la commedia è lunga.', 'Bravo. Il pubblico non applaude, ma non se n\'è andato.'],
    2: ['Il sipario cala sul secondo atto… ma il legno ricorda ogni ferita.', 'Secondo atto. Hai ancora tutte le dita? Contale: nel terzo servono.'],
    3: ['Terzo atto, fine. Resta la Reggia, e resto io.', 'Il sipario cala sul terzo atto. Riposa, piccolo mio: l\'ultima scena la scrivo io.'],
  },
  fineAttoGenerico: ['Un altro atto finito. Non ti stanchi mai di arrivare in fondo?'],
  senzaDanni: ['Nemmeno un graffio. Reciti quasi troppo bene: così il pubblico smette di crederti.'],
  fineNotte: [
    'Buonanotte, Ferruccio. Domani si replica.',
    'Le maschere si spezzano, il legno no. Per questo ti rialzo ogni sera.',
    'Cala la tela. Non temere: conosco a memoria la tua parte.',
    'Dormi. Chi dorme non soffre: lo ripeto da sei anni, a tutti.',
  ],
  trasformazione: [
    'Guardati: {nome}. Ogni cosa che raccogli ti riscrive un poco.',
    '{nome}! Che bel costume. Te l\'ho forse cucito io?',
    'Ecco: adesso sei {nome}. Il burattino cambia abito, non padrone.',
  ],
  segreta: ['Quel muro non era nel copione. Rimettilo dov\'era, per favore.', 'Curioso come un gatto. Ricorda com\'è finito, il gatto.'],
  patto: ['Una firma col sangue. Vedi che ci intendiamo, tu ed io?', 'Prendi, prendi pure. I miei doni non hanno mai fatto male a nessuno che li ricordi.'],
  ultima: ['Mezza maschera. Così poco legno fra te e il silenzio.', 'Trema, il burattino. Lo vedo anche da quassù.'],
  medaglione: ['Lascialo dormire, quel ricordo. A Tonino ho tolto un peso, non una moglie.'],
  porta: ['Quella porta è dipinta sul fondale, Ferruccio. Non perdere tempo con la scenografia.', 'Ancora lì? Dietro non c\'è niente. L\'ho fatta dipingere io.'],
  ferro: ['Lascia quel ferro vecchio. Non è di scena.', 'Ferraglia. Buttala: ti appesantisce il passo.'],
  bussata: ['Non si bussa a una porta dipinta. Fai ridere il pubblico.'],
  senzaFine: [],
};

/** SILENZIO_B8 — le stesse occasioni dopo la caduta di Donna Luciana: indicazioni nude, fra quadre. */
const SILENZIO_B8 = Object.freeze({
  boss: Object.freeze({ 'donna-luciana': ['[Entra Donna Luciana. Non dice una parola.]'] }),
  bossGenerico: ['[Entra {boss}. Nessuno lo annuncia.]', '[{boss}. Il copione, qui, è strappato.]'],
  fineAtto: Object.freeze({}),
  fineAttoGenerico: ['[Fine dell\'atto. Nessun applauso, nessuna voce.]', '[Il sipario cala da solo.]'],
  senzaDanni: ['[Nemmeno un graffio. Nessuno lo ha visto.]'],
  fineNotte: ['[Le lanterne si spengono. Nessuno augura la buonanotte.]'],
  trasformazione: ['[{nome}. Nessuno commenta.]'],
  segreta: ['[Un muro si apre. Non era scritto da nessuna parte.]'],
  patto: ['[Un patto. Nessuno ringrazia.]'],
  ultima: ['[Mezza maschera. Solo il cigolio delle assi.]'],
  medaglione: [],
  porta: ['[Una porta sul fondale. Dietro, un ferro batte: tre colpi, una pausa, uno.]'],
  ferro: ['[Un ferro vecchio. Pesa come pesano le cose vere.]'],
  bussata: [],
  senzaFine: ['[Notte senza fine, ciclo {ciclo}. Il Teatro replica da solo.]'],
});

// ===========================================================================
// 3. STATO (in memoria) E SALVATAGGIO PER SLOT
// ===========================================================================
const b8 = {
  cache: null, cacheRaw: undefined, cacheSlot: null, cacheMs: 0, locale: null,
  flag: null, flagMs: 0,
  fin: null,              // finale in corso (vedi avviaFinaleB8)
  finalePendente: null,   // { st, attesa } dopo la prima caduta di Donna Luciana
  bannerPendente: null,
  cart: null,             // cartiglio nostro nell'hub { voci, idx, t }
  did: { coda: [], att: null, attesaMs: 0, ultime: {} },
  nota: null,             // osservazioni della run in corso (per la pagina del Diario)
  bussate: [], ultimaBussata: -99999, daValutare: false, risposta: -1, esameIdx: 0,
  scintille: [],
  portaAnim: -99999, sigilloAnim: -99999,
  t4Dialogo: null, posTonino: null,
  vocePortaNotte: 0, indizioNotte: 0,
  bossDaPresentare: null,
  ultimoHp: 0, trasformazioniViste: null, ultimoControlloTick: 0,
  diario: null, diarioDaHub: false,
  voltoUsatoRun: -1, ultimaFase: null,
  righe: new Map(),       // cache degli a capo
};

const hashB8 = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; return h; };
const riempiB8 = (testo, dati) => String(testo).replace(/\{(\w+)\}/g, (m, k) => (dati && dati[k] !== undefined && dati[k] !== null ? String(dati[k]) : m));
const pianoNelCicloB8 = (p = statoRun.piano) => ((Math.max(1, p || 1) - 1) % 4) + 1;
const maiuscolaB8 = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const pulisciNomeB8 = (n) => String(n || '').replace(/\s*\(.*?\)/g, '').split(' — ')[0].trim();
/** «Il Gatto…» dentro una frase diventa «il Gatto…» (a inizio frase ci pensa maiuscolaB8). */
const nomeInFraseB8 = (n) => String(n || '').replace(/^(Il|La|Lo|I|Le|Gli|L')(\s|(?<=')\S)/, (m) => m.charAt(0).toLowerCase() + m.slice(1));
const t4qaB8 = () => (window.__teatro && window.__teatro.t4qa) || null;
function dialogoT4B8() { try { const q = t4qaB8(); return Boolean(q && q.dialogo); } catch (_) { return false; } }

/** Flag della trama di T4 (copia, riletta al più ogni 400 ms: il getter di T4 clona tutto). */
function flagTramaB8(forza) {
  const ora = performance.now();
  if (!forza && b8.flag && ora - b8.flagMs < 400) return b8.flag;
  let f = {};
  try { const q = t4qaB8(); f = (q && q.flag) || {}; } catch (_) { f = {}; }
  b8.flag = f; b8.flagMs = ora;
  return f;
}
/** true dopo la prima sconfitta di Donna Luciana: la Voce tace per sempre. */
function cadutaB8() { return Boolean(flagTramaB8().luciana_sconfitta); }

function salvataggiB8() { return (window.__teatroT3 && window.__teatroT3.salvataggi) || null; }
function slotB8() { const sv = salvataggiB8(); return sv ? sv.slotAttivo : 0; }

function vuotoB8() {
  return { versione: CONFIG_B8.versione, epoca: null, finaleVisto: false, scelta: null, finali: {}, contesti: {},
    senzaFine: false, recordCiclo: 1, ferri: {}, indizi: {}, sigilliMostrati: 0, portaAperta: false,
    fucinaVista: false, volto: false, segretoVisto: false, toninoVisto: null };
}

function normalizzaB8(d) {
  const s = vuotoB8();
  if (!d || typeof d !== 'object') return s;
  for (const k of ['epoca', 'scelta', 'toninoVisto']) if (typeof d[k] === 'string') s[k] = d[k];
  for (const k of ['finaleVisto', 'senzaFine', 'portaAperta', 'fucinaVista', 'volto', 'segretoVisto']) s[k] = Boolean(d[k]);
  for (const k of ['finali', 'contesti', 'ferri', 'indizi']) if (d[k] && typeof d[k] === 'object') s[k] = JSON.parse(JSON.stringify(d[k]));
  s.recordCiclo = Math.max(1, Math.floor(Number(d.recordCiclo) || 1));
  s.sigilliMostrati = Math.max(0, Math.floor(Number(d.sigilliMostrati) || 0));
  return s;
}

/** Stato di finali e segreto dello slot attivo. L'oggetto reso si può modificare e poi passare a scriviB8. */
function statoB8() {
  const sv = salvataggiB8();
  const ora = performance.now();
  const slot = sv ? sv.slotAttivo : 0;
  if (b8.cache && b8.cacheSlot === slot && ora - b8.cacheMs < CONFIG_B8.cacheStatoMs) return b8.cache;
  let raw = null;
  try {
    if (sv) raw = sv.leggiFlag(CONFIG_B8.chiaveFlag);
    else { if (b8.locale === null) b8.locale = JSON.parse(localStorage.getItem(CONFIG_B8.chiaveLocale) || 'null') || false; raw = b8.locale || null; }
  } catch (_) { raw = null; }
  if (!(b8.cache && b8.cacheSlot === slot && raw === b8.cacheRaw && raw)) {
    b8.cache = normalizzaB8(raw);
    b8.cacheRaw = raw; b8.cacheSlot = slot;
  }
  b8.cacheMs = ora;
  return b8.cache;
}

function scriviB8(s) {
  if (!s.epoca) s.epoca = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  const copia = JSON.parse(JSON.stringify(s));
  const sv = salvataggiB8();
  try {
    if (sv) sv.impostaFlag(CONFIG_B8.chiaveFlag, copia);
    else { localStorage.setItem(CONFIG_B8.chiaveLocale, JSON.stringify(copia)); b8.locale = copia; }
  } catch (err) { console.warn('[B8] stato non salvato', err); }
  b8.cache = s; b8.cacheRaw = copia; b8.cacheSlot = sv ? sv.slotAttivo : 0; b8.cacheMs = performance.now();
}

/** Come a6: il ponte T3/T4 non deve mai riscrivere una copia vecchia del nostro flag. */
function proteggiFlagB8() {
  const T = window.__teatro;
  if (!T || typeof T.salvaFlag !== 'function' || T.salvaFlag.__b8) return;
  const base = T.salvaFlag;
  const avvolta = function (flag) {
    const copia = { ...(flag || {}) };
    delete copia[CONFIG_B8.chiaveFlag];
    return base.call(this, copia);
  };
  avvolta.__b8 = true;
  if (base.__a6) avvolta.__a6 = true;
  T.salvaFlag = avvolta;
}
setTimeout(proteggiFlagB8, 0);

/** Registra uno sblocco nella progressione di a6 (stato dello slot + cartiglio «SBLOCCATO»). */
function registraSbloccoB8(id, nome, testo) {
  try {
    if (typeof statoA6 !== 'function' || typeof scriviA6 !== 'function') return false;
    const s6 = statoA6();
    if (s6.sbloccati[id]) return false;
    s6.sbloccati[id] = true;
    scriviA6(s6);
    if (typeof a6 === 'object' && a6 && Array.isArray(a6.coda)) a6.coda.push({ testo, nome, sprite: null, personaggio: null });
    return true;
  } catch (err) { console.warn('[B8] sblocco non registrato', err); return false; }
}

// ===========================================================================
// 4. SUONI (Web Audio procedurale, sull'uscita comune degli effetti)
// ===========================================================================
function audioB8() {
  try {
    const ac = AudioSys.ctx;
    if (!ac || !AudioSys.attivo) return null;
    const out = AudioSys.uscita;
    return out ? { ac, out } : null;
  } catch (_) { return null; }
}

/** Mormorio grave modulato: la «voce» della narratrice. Facoltativo (OPZIONI.voceSuono === false lo spegne). */
function suonoVoceB8() {
  if (typeof OPZIONI === 'object' && OPZIONI && OPZIONI.voceSuono === false) return false;
  const a = audioB8();
  if (!a) return false;
  const { ac, out } = a;
  const S = CONFIG_B8.suonoVoce;
  const t0 = ac.currentTime + 0.01;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  const f = ac.createBiquadFilter();
  f.type = 'bandpass'; f.Q.value = 5;
  f.frequency.setValueAtTime(S.formanti[0], t0);
  f.frequency.linearRampToValueAtTime(S.formanti[1], t0 + S.durataS * 0.45);
  f.frequency.linearRampToValueAtTime(S.formanti[2], t0 + S.durataS);
  const sillabe = 3;
  for (let i = 0; i < sillabe; i++) {
    const a0 = t0 + (i / sillabe) * S.durataS;
    g.gain.linearRampToValueAtTime(S.volume, a0 + 0.05);
    g.gain.linearRampToValueAtTime(S.volume * 0.25, a0 + S.durataS / sillabe - 0.02);
  }
  g.gain.linearRampToValueAtTime(0.0001, t0 + S.durataS + 0.06);
  for (const det of [0, 3.5]) {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(S.hz + det, t0);
    o.frequency.linearRampToValueAtTime(S.hz * 0.9 + det, t0 + S.durataS);
    o.connect(f);
    o.start(t0); o.stop(t0 + S.durataS + 0.1);
  }
  f.connect(g); g.connect(out);
  return true;
}

/** «Tin»: il ferro che risuona dietro la porta (e i ferri raccolti). */
function suonoFerroB8(vol = 0.08) {
  const a = audioB8();
  if (!a) return false;
  const { ac, out } = a;
  const t0 = ac.currentTime + 0.005;
  for (const [hz, v] of [[1760, 1], [2637, 0.5], [3520, 0.2]]) {
    const o = ac.createOscillator(); const g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(hz, t0);
    g.gain.setValueAtTime(Math.max(0.0001, vol * v), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 0.34);
  }
  return true;
}

/** «Toc»: le nocche sul legno. */
function suonoToccoB8() {
  const a = audioB8();
  if (!a) return false;
  const { ac, out } = a;
  const t0 = ac.currentTime + 0.005;
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(150, t0); o.frequency.exponentialRampToValueAtTime(62, t0 + 0.09);
  g.gain.setValueAtTime(0.22, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
  o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 0.13);
  return true;
}

// ===========================================================================
// 5. LA VOCE: didascalie in coda (non fermano il gioco)
// ===========================================================================
function righeEventoB8(evento, dati) {
  const T = cadutaB8() ? SILENZIO_B8 : VOCE_B8;
  if (evento === 'boss') return (T.boss && T.boss[dati && dati.id]) || T.bossGenerico;
  if (evento === 'fineAtto') return (T.fineAtto && T.fineAtto[dati && dati.atto]) || T.fineAttoGenerico;
  return T[evento] || [];
}

function accodaDidB8(d) {
  const D = CONFIG_B8.didascalia;
  const Q = b8.did.coda;
  if (D.urgenti.includes(d.evento)) { // la presentazione di un boss non aspetta in coda: passa davanti a tutto
    Q.length = 0;
    const a = b8.did.att;
    if (a) a.ms = Math.max(a.ms, a.durata - D.uscitaMs);
    b8.did.attesaMs = 0;
  }
  if (Q.length >= D.maxCoda) Q.shift();
  Q.push(d);
}

/**
 * La Voce commenta un evento (boss, fineAtto, senzaDanni, fineNotte, trasformazione, segreta, patto, ultima,
 * medaglione, porta, ferro, bussata, senzaFine). Le varianti ruotano: mai due volte di fila la stessa.
 * @returns {string|null} il testo messo in coda, o null se l'evento non ha righe o la Voce è spenta.
 */
function diciB8(evento, dati) {
  if (typeof OPZIONI === 'object' && OPZIONI && OPZIONI.voce === false) return null;
  const righe = righeEventoB8(evento, dati);
  if (!righe || !righe.length) return null;
  const chiave = `${evento}:${(dati && (dati.id || dati.atto)) || ''}`;
  const prima = b8.did.ultime[chiave];
  const i = prima === undefined ? getNumeroNotte() % righe.length : (prima + 1) % righe.length;
  b8.did.ultime[chiave] = i;
  const testo = riempiB8(righe[i], dati);
  accodaDidB8({ tipo: cadutaB8() ? 'silenzio' : 'voce', testo, evento });
  return testo;
}

/** Didascalia neutra (osservazioni di Ferruccio: la porta, un ferro raccolto). */
function notaDidB8(testo) { if (testo) accodaDidB8({ tipo: 'nota', testo, evento: 'nota' }); }

function registraVoceBossB8(id, righe) {
  if (!id || !Array.isArray(righe) || !righe.length) return false;
  VOCE_B8.boss[id] = righe.map(String);
  return true;
}

// ===========================================================================
// 6. DIARIO DI FERRUCCIO: composizione e salvataggio delle pagine
// ===========================================================================
function nuovaNotaB8() {
  return { run: statoRun.numeroRun, ferri: [], patti: [], trasformazioni: [], medaglione: false, finale: null,
    cicloMax: 1, paginaScritta: false, segreta: false, ultimaDetta: false };
}

/** Variante di un gruppo di frasi: scelta dal seme della notte, mai uguale a quella usata l'ultima volta. */
function variaB8(memoria, gruppo, lista, seme) {
  if (!lista || !lista.length) return '';
  if (lista.length === 1) return lista[0];
  let i = hashB8(`${seme}|${gruppo}`) % lista.length;
  if (memoria[gruppo] === i) i = (i + 1) % lista.length;
  memoria[gruppo] = i;
  return lista[i];
}

function elencoB8(nomi, max) {
  const u = nomi.filter((n, i) => n && nomi.indexOf(n) === i);
  const mostrati = u.slice(0, max);
  const resto = u.length - mostrati.length;
  if (resto > 0) return `${mostrati.join(', ')} e altri ${resto}`;
  if (mostrati.length <= 1) return mostrati.join('');
  return `${mostrati.slice(0, -1).join(', ')} e ${mostrati[mostrati.length - 1]}`;
}

function nomiBossB8() {
  const l = [];
  try { for (const b of POOL_BOSS) l.push(pulisciNomeB8(b.nome).replace(/^(Il|La|Lo)\s+/i, '')); } catch (_) { /* tabella assente */ }
  return l;
}

function rigaMorteB8(v, prendi) {
  const M = DIARIO_B8.morte;
  const causa = String(v.causa || 'le ombre');
  const c = causa.toLowerCase();
  if (/luciana|burattinaia|\bman[oi]\b/.test(c)) return prendi('morte:luciana', M.luciana);
  if (nomiBossB8().some((n) => n && c.includes(n.toLowerCase()))) return prendi('morte:boss', M.boss, { fonte: nomeInFraseB8(causa.replace(/^un colpo d(i|el|ella|ello)\s+/i, '')) });
  if (/sangue|ceppo|rovi|sacrific/.test(c)) return prendi('morte:sangue', M.sangue);
  if (/bomb|esplos|botto|polvere/.test(c)) return prendi('morte:bomba', M.bomba);
  if (/vesp/.test(c)) return prendi('morte:vespa', M.vespa);
  if (/gatt/.test(c)) return prendi('morte:gatto', M.gatto);
  if (/guardi|capitan|soldat|predon/.test(c)) return prendi('morte:guardia', M.guardia);
  if (/statu|marmo/.test(c)) return prendi('morte:statua', M.statua);
  if (/mascher/.test(c)) return prendi('morte:maschera', M.maschera);
  return prendi('morte:generico', M.generico, { fonte: causa });
}

/** Stadio del segreto per il «seme» in fondo alla pagina (chiave di DIARIO_B8.semi) o null. */
function semeSegretoB8(s, notte) {
  if (s.segretoVisto) return null;
  if (s.portaAperta) return 'aperta';
  if (sigilliB8(s) >= 3) return (s.finaleVisto || !SEGRETO_B8.serveFinaleVero) ? 'bussa' : 'filo';
  if (notte < SEGRETO_B8.daNotte.luce) return null;
  const manca = SEGRETO_B8.ferri.find((f) => !s.ferri[f.id]);
  if (!manca) return null;
  if (manca.id === 'tenaglie') return notte >= 4 && notte % 2 === 0 ? 'tenaglie' : 'porta';
  return manca.id;
}

/**
 * Compone la pagina del Diario di una notte.
 * @param {object} v voce del Registro di a7 (o equivalente): notte, personaggio, esito, causa, piano, boss, oggetti…
 * @param {object} nota osservazioni di b8 sulla run (ferri, patti, trasformazioni, finale…)
 * @param {object} s stato del segreto · @param {object} memoria ultime varianti usate (si aggiorna)
 * @param {{sceltaTonino?: string}} [opz]
 * @returns {{id, notte, titolo, righe: string[], esito, personaggio, data}}
 */
function componiPaginaB8(v, nota, s, memoria, opz = {}) {
  const D = DIARIO_B8;
  const n = Math.max(1, Math.floor(Number(v.notte) || 1));
  const seme = `${v.id || ''}|${n}`;
  const base = { n, personaggio: v.nomePersonaggio || 'un altro burattino' };
  const prendi = (gruppo, lista, extra) => maiuscolaB8(riempiB8(variaB8(memoria, gruppo, lista, seme), { ...base, ...(extra || {}) }));
  const righe = [];
  const inPiazza = v.esito === 'piazza';
  const piano = Math.max(1, v.piano || 1);
  const ciclo = Math.floor((piano - 1) / 4) + 1;
  if (v.personaggio && v.personaggio !== 'ferruccio') righe.push(prendi('aperturaAltro', D.aperturaAltro));
  else if (n <= 1) righe.push(prendi('apertura1', D.apertura1));
  else righe.push(prendi('apertura', D.apertura));
  if (opz.sceltaTonino && D.scelte[opz.sceltaTonino]) righe.push(prendi(`scelta:${opz.sceltaTonino}`, D.scelte[opz.sceltaTonino]));
  if (inPiazza) righe.push(prendi('piazza', D.piazza));
  else {
    righe.push(prendi(`cammino:${Math.min(piano, 5)}`, piano > 4 ? D.cammino.oltre : D.cammino[piano], { ciclo }));
    if ((v.stanzePulite || 0) > 0) righe.push(prendi('conteggio', D.conteggio, { stanze: v.stanzePulite, nemici: v.nemiciUccisi || 0 }));
    for (const b of (v.boss || []).slice(0, 4)) righe.push(prendi(`boss:${b.id || 'x'}`, D.boss[b.id] || D.boss.generico, { boss: nomeInFraseB8(pulisciNomeB8(b.nome)) || 'un guardiano' }));
    const ogg = v.oggetti || [];
    const patti = ogg.filter((o) => o.tier === 'patto').map((o) => o.nome).concat(nota.patti || []);
    const altri = ogg.filter((o) => o.tier !== 'patto' && o.nome && o.nome !== '?');
    if (!ogg.length && !patti.length) righe.push(prendi('oggNessuno', D.oggetti.nessuno));
    else if (altri.length) righe.push(prendi('oggAlcuni', D.oggetti.alcuni, { elenco: elencoB8(altri.map((o) => o.nome), 4) }));
    if (patti.length) righe.push(prendi('oggPatto', D.oggetti.patto, { patto: elencoB8(patti, 2) }));
    const nuovo = altri.find((o) => o.scoperto);
    if (nuovo) righe.push(prendi('oggNuovo', D.oggetti.nuovo, { nuovo: nuovo.nome }));
    if ((v.consumabili || []).length) righe.push(prendi('consumabili', D.oggetti.consumabili, { quanti: v.consumabili.length }));
    const sp = Object.keys(v.stanzeSpeciali || {}).find((k) => D.speciali[k]);
    if (sp) righe.push(prendi(`speciale:${sp}`, D.speciali[sp]));
    for (const t of (nota.trasformazioni || []).slice(0, 2)) righe.push(prendi('trasformazione', D.trasformazione, { nome: t }));
    if (nota.medaglione) righe.push(prendi('medaglione', D.scelte.medaglione));
    for (const f of nota.ferri || []) if (D.ferri[f]) righe.push(prendi(`ferro:${f}`, D.ferri[f]));
    if (nota.finale && D.finale[nota.finale]) { righe.push(prendi(`finale:${nota.finale}`, D.finale[nota.finale])); righe.push(prendi('bis', D.finale.bis)); }
    else if (/morte/.test(v.esito || '')) righe.push(rigaMorteB8(v, prendi));
    else if (v.esito !== 'vittoria') righe.push(prendi('abbandono', D.morte.abbandono));
  }
  const sm = semeSegretoB8(s, n);
  if (sm && D.semi[sm]) righe.push(prendi(`seme:${sm}`, D.semi[sm]));
  righe.push(prendi('chiusa', s.segretoVisto ? D.chiusaDopo : D.chiusa));
  let luogo = 'Piazza Dante';
  if (!inPiazza) { try { luogo = getQuartierePiano(piano).nome; } catch (_) { luogo = `piano ${piano}`; } if (piano > 4) luogo += `, ciclo ${ciclo}`; }
  return { id: v.id || seme, notte: n, titolo: `Notte ${n} — ${luogo}`, righe, esito: v.esito || '', personaggio: v.nomePersonaggio || '', data: new Date().toISOString() };
}

function chiaveDiarioB8() { return CONFIG_B8.prefissoDiario + slotB8(); }

/** Diario dello slot attivo: { pagine, memoria }. Un diario di un'altra «epoca» (slot cancellato) non vale. */
function leggiDiarioB8() {
  const s = statoB8();
  const slot = slotB8();
  if (b8.diario && b8.diario.slot === slot && b8.diario.epoca === s.epoca) return b8.diario.dati;
  let d = null;
  try { d = JSON.parse(localStorage.getItem(chiaveDiarioB8()) || 'null'); } catch (_) { d = null; }
  if (!d || !Array.isArray(d.pagine) || !s.epoca || d.epoca !== s.epoca) d = { versione: CONFIG_B8.versione, epoca: s.epoca, pagine: [], memoria: {} };
  if (!d.memoria || typeof d.memoria !== 'object') d.memoria = {};
  b8.diario = { slot, epoca: s.epoca, dati: d };
  return d;
}

function scriviDiarioB8(d) {
  d.pagine = d.pagine.slice(-CONFIG_B8.maxPagine);
  try { localStorage.setItem(chiaveDiarioB8(), JSON.stringify(d)); } catch (err) { console.warn('[B8] diario non salvato', err); }
  b8.diario = { slot: slotB8(), epoca: d.epoca, dati: d };
}

function aggiungiPaginaB8(pagina) {
  const s = statoB8();
  if (!s.epoca) scriviB8(s);
  const d = leggiDiarioB8();
  d.epoca = s.epoca;
  const i = d.pagine.findIndex((p) => p.id === pagina.id);
  if (i >= 0) d.pagine[i] = pagina; else d.pagine.push(pagina);
  scriviDiarioB8(d);
  return pagina;
}

/** Voce minima se il Registro di a7 non c'è. */
function voceDaStatoB8(esito, causa) {
  return { id: `b8-${Date.now().toString(36)}-${statoRun.numeroRun}`, notte: statoRun.numeroNotte || getNumeroNotte(),
    personaggio: statoRun.personaggioId, nomePersonaggio: getCharCorrente().nome, esito, vittoria: false,
    causa: causa || null, piano: statoRun.piano || 1, stanzePulite: 0, nemiciUccisi: 0, boss: [], oggetti: [],
    consumabili: [], stanzeSpeciali: {}, sangueHalf: 0 };
}

/** Scrive (e salva) la pagina della notte dalla voce del Registro. @returns la pagina. */
function scriviPaginaRunB8(v, opz = {}) {
  const s = statoB8();
  if (!s.epoca) scriviB8(s);
  const d = leggiDiarioB8();
  const nota = opz.nota || b8.nota || nuovaNotaB8();
  let sceltaTonino = opz.sceltaTonino || null;
  if (!sceltaTonino && !opz.senzaFlag) {
    const att = flagTramaB8(true).tonino_ricordo || null;
    if (att && att !== (s.toninoVisto || null)) { sceltaTonino = att; s.toninoVisto = att; scriviB8(s); }
  }
  return aggiungiPaginaB8(componiPaginaB8(v, nota, s, d.memoria, { sceltaTonino }));
}

function paginaSegretoB8(tipo, salito) {
  const n = getNumeroNotte();
  const D = DIARIO_B8.segreto;
  const righe = tipo === 'fucina' ? (salito ? [D.fucina[0]] : D.fucina.slice()) : D.ribalta.slice();
  return { id: `segreto-${tipo}`, notte: n, titolo: `Notte ${n} — ${tipo === 'fucina' ? TESTI_B8.diario.fucina : 'Sopra la Ribalta'}`,
    righe, esito: 'segreto', personaggio: '', data: new Date().toISOString() };
}

// ===========================================================================
// 7. IL SEGRETO: sigilli, ferri, porta della bottega
// ===========================================================================
/** Sigilli rotti (0..3) nello slot attivo: uno per ferro di Gaetano trovato. */
function sigilliB8(s = statoB8()) {
  let n = 0;
  for (const f of SEGRETO_B8.ferri) if (s.ferri[f.id]) n++;
  return n;
}

/** Dà un ferro (rompe un sigillo). @returns {boolean} true se era nuovo. */
function daiFerroB8(id, opz = {}) {
  const def = SEGRETO_B8.ferri.find((f) => f.id === id);
  if (!def) return false;
  const s = statoB8();
  if (s.ferri[id]) return false;
  s.ferri[id] = getNumeroNotte();
  scriviB8(s);
  if (b8.nota && !b8.nota.ferri.includes(id)) b8.nota.ferri.push(id);
  if (!opz.muto) {
    suonoFerroB8(0.1);
    notaDidB8(TESTI_B8.ferroTrovato[id]);
    diciB8('ferro');
    try { mostraBanner(`✦ ${def.nome}: un sigillo della bottega si spezza (${sigilliB8(s)}/3)`, 240); } catch (_) { /* banner facoltativo */ }
  }
  return true;
}

function bossDelPianoCadutoB8() {
  const m = statoRun.mappa;
  const b = m && m.stanze && m.stanze.find((x) => x.tipo === 'boss');
  return Boolean(b && b.pulita);
}

function posaFerroB8(st, id, x, y) {
  const def = SEGRETO_B8.ferri.find((f) => f.id === id);
  if (!st || !def) return false;
  const pid = SEGRETO_B8.prefissoRaccolta + id;
  if (!st.oggettiATerra) st.oggettiATerra = [];
  if (st.oggettiATerra.some((o) => o.id === pid)) return false;
  st.oggettiATerra.push({ tipo: 'ricordo', id: pid, sprite: def.sprite,
    x: Math.max(ARENA.x1 + 20, Math.min(ARENA.x2 - 20, x)), y: Math.max(ARENA.y1 + 20, Math.min(ARENA.y2 - 20, y)) });
  return true;
}

/** All'ingresso in una stanza: le tenaglie nella segreta del piano 1, il punzone alla fontana del piano 2. */
function preparaStanzaB8(st) {
  if (!st || statoRun.fase !== 'in_gioco') return;
  const s = statoB8();
  const pc = pianoNelCicloB8();
  if (st.tipo === 'segreta' && pc === 1 && !s.ferri.tenaglie) posaFerroB8(st, 'tenaglie', SEGRETO_B8.tenaglie.x, SEGRETO_B8.tenaglie.y);
  if (st.tipo === 'ingresso' && pc === 2 && !s.ferri.punzone && bossDelPianoCadutoB8()) {
    posaFerroB8(st, 'punzone', SEGRETO_B8.fontana.x, SEGRETO_B8.fontana.y + SEGRETO_B8.fontana.punzoneDy);
  }
}

function bossSconfittoB8(st) {
  const b = st && st.nemici && (st.nemici.find((n) => n.boss) || st.nemici[0]);
  if (!b) return;
  const s = statoB8();
  const pc = pianoNelCicloB8();
  const senzaDanni = !statoRun.dannoSubitoNelBoss;
  if (b.bossId === CONFIG_B8.bossFinale) {
    if (!s.finaleVisto) b8.finalePendente = { st, attesa: CONFIG_B8.attesaFinaleTick };
    else { st.cordoneB8 = true; b8.bannerPendente = { st, testo: TESTI_B8.senzaFine.banner((statoRun.ciclo || 1) + 1) }; }
    return;
  }
  if (pc === 3 && senzaDanni && !s.ferri.lima && !statoRun.zonaP3) posaFerroB8(st, 'lima', b.x + 28, b.y + 30); // (h6/h7) la lima solo a San Leucio
  if (senzaDanni) diciB8('senzaDanni'); else diciB8('fineAtto', { atto: pc });
}

function vicinoPortaB8() {
  const P = SEGRETO_B8.porta;
  return Math.hypot(player.x - P.x, player.y - P.sogliaY) < P.raggio;
}

function scintillaPortaB8(n) {
  const P = SEGRETO_B8.porta;
  for (let i = 0; i < n && b8.scintille.length < 24; i++) {
    b8.scintille.push({ x: P.x - 10 + ((tick * 7 + i * 13) % 20), y: P.y + 8, vx: (((tick + i * 5) % 7) - 3) * 0.25, vy: -0.6 - ((tick + i) % 3) * 0.3, t: 0 });
  }
}

/** Una bussata alla porta (E). La sequenza si valuta dopo il silenzio. */
function bussaB8() {
  b8.bussate.push(tick);
  if (b8.bussate.length > 8) b8.bussate.shift();
  b8.ultimaBussata = tick;
  b8.daValutare = true;
  scintillaPortaB8(2);
  suonoToccoB8();
}

function ritmoGiustoB8(k) {
  const B = SEGRETO_B8.bussata;
  return k.length === 4 && k[1] - k[0] <= B.rapidoMaxTick && k[2] - k[1] <= B.rapidoMaxTick
    && k[3] - k[2] >= B.pausaMinTick && k[3] - k[2] <= B.pausaMaxTick;
}

function valutaBussataB8() {
  if (!b8.daValutare) return;
  const B = SEGRETO_B8.bussata;
  const k = b8.bussate;
  const tre = k.length === 3 && k[1] - k[0] <= B.rapidoMaxTick && k[2] - k[1] <= B.rapidoMaxTick;
  if (tick - b8.ultimaBussata <= (tre ? B.pausaMaxTick : B.silenzioTick)) return;
  b8.daValutare = false;
  const giusta = ritmoGiustoB8(k);
  const quante = k.length;
  b8.bussate = [];
  esitoBussataB8(giusta, quante);
}

/** Righe dell'esame della porta secondo lo stadio del segreto. */
function righeEsameB8(s, notte) {
  const P = TESTI_B8.porta;
  if (notte < SEGRETO_B8.daNotte.luce && sigilliB8(s) === 0) return P.notte1;
  const k = sigilliB8(s);
  if (k >= 3) return (s.finaleVisto || !SEGRETO_B8.serveFinaleVero) ? P.bussa : P.filo;
  const manca = SEGRETO_B8.ferri.find((f) => !s.ferri[f.id]);
  return [P.stato[k], P.indizio[manca.id]];
}

function esitoBussataB8(giusta, quante) {
  const s = statoB8();
  const notte = getNumeroNotte();
  const P = TESTI_B8.porta;
  const k = sigilliB8(s);
  if (giusta) {
    if (k >= 3 && (s.finaleVisto || !SEGRETO_B8.serveFinaleVero)) { apriPortaB8(); return 'aperta'; }
    b8.risposta = tick;
    notaDidB8(k >= 3 ? P.rispostaFilo : P.rispostaSigilli);
    return 'risposta';
  }
  if (quante >= 3) { notaDidB8(P.nonRisponde); if (notte >= SEGRETO_B8.daNotte.voce && !cadutaB8()) diciB8('bussata'); return 'muta'; }
  const righe = righeEsameB8(s, notte);
  notaDidB8(righe[b8.esameIdx % righe.length]);
  b8.esameIdx++;
  return 'esame';
}

/** Apre la porta della bottega (flag di T4 fucina_aperta = 'vera'). */
function apriPortaB8() {
  const s = statoB8();
  if (!s.portaAperta) { s.portaAperta = true; scriviB8(s); }
  try { const q = t4qaB8(); if (q) q.impostaFlag({ fucina_aperta: 'vera' }); } catch (err) { console.warn('[B8] flag della porta', err); }
  b8.flag = null;
  b8.portaAnim = tick;
  scintillaPortaB8(8);
  suonoFerroB8(0.12);
  notaDidB8(TESTI_B8.porta.aperta);
  return true;
}

function distToninoB8() {
  if (!b8.posTonino) {
    try { const p = t4qaB8().presenze.find((x) => x.id === 'tonino'); if (p) b8.posTonino = { x: p.x, y: p.y }; } catch (_) { /* hub non pronto */ }
  }
  return b8.posTonino ? Math.hypot(player.x - b8.posTonino.x, player.y - b8.posTonino.y) : Infinity;
}

/** Indizio di Tonino che tocca stanotte (o null). */
function indizioDisponibileB8(s = statoB8(), notte = getNumeroNotte()) {
  return INDIZI_B8.find((i) => notte >= i.daNotte && !s.indizi[i.id] && i.se(s)) || null;
}

/** Dopo una chiacchierata con Tonino: se c'è un indizio per stanotte, lo aggiunge (uno per notte). */
function indizioToninoB8() {
  const notte = getNumeroNotte();
  if (b8.indizioNotte === notte) return false;
  const s = statoB8();
  const ind = indizioDisponibileB8(s, notte);
  if (!ind) return false;
  b8.indizioNotte = notte;
  s.indizi[ind.id] = notte;
  scriviB8(s);
  b8.cart = { voci: ind.voci, idx: 0, t: 0 };
  return true;
}

function osservaDialogoT4B8() {
  const aperto = dialogoT4B8();
  if (aperto && !b8.t4Dialogo) b8.t4Dialogo = { tonino: distToninoB8() < 64 };
  else if (!aperto && b8.t4Dialogo) {
    const era = b8.t4Dialogo;
    b8.t4Dialogo = null;
    if (era.tonino && statoRun.fase === 'hub') indizioToninoB8();
  }
}

function avanzaCartB8() {
  const c = b8.cart;
  if (!c) return;
  c.idx++; c.t = 0;
  if (c.idx >= c.voci.length) b8.cart = null;
}

function ingressoHubB8() {
  b8.cart = null; b8.bussate = []; b8.daValutare = false; b8.t4Dialogo = null; b8.scintille.length = 0;
  const s = statoB8();
  const k = sigilliB8(s);
  if (k > (s.sigilliMostrati || 0)) {
    s.sigilliMostrati = k; scriviB8(s);
    b8.sigilloAnim = tick;
    notaDidB8(TESTI_B8.porta.sigilloRotto);
  }
}

function logicaHubB8() {
  const s = statoB8();
  const notte = getNumeroNotte();
  const P = SEGRETO_B8.porta;
  const R = SEGRETO_B8.ritmo;
  osservaDialogoT4B8();
  const dist = Math.hypot(player.x - P.x, player.y - P.sogliaY);
  if (!s.portaAperta && notte >= SEGRETO_B8.daNotte.luce && dist < P.raggioSuono && R.battiti.includes(tick % R.cicloTick)) {
    suonoFerroB8(0.012 + 0.05 * (1 - dist / P.raggioSuono));
    if (dist < P.raggio * 1.8) scintillaPortaB8(1);
  }
  if (b8.risposta >= 0) {
    const dt = tick - b8.risposta - 30;
    if (R.battiti.includes(dt)) { suonoFerroB8(0.1); scintillaPortaB8(3); }
    if (dt > R.battiti[R.battiti.length - 1] + 10) b8.risposta = -1;
  }
  if (!s.portaAperta && notte >= SEGRETO_B8.daNotte.voce && dist < P.raggioVoce && b8.vocePortaNotte !== notte && !dialogoT4B8() && !b8.cart) {
    b8.vocePortaNotte = notte;
    diciB8('porta');
  }
  valutaBussataB8();
  for (let i = b8.scintille.length - 1; i >= 0; i--) {
    const sc = b8.scintille[i];
    sc.t++; sc.x += sc.vx; sc.y += sc.vy; sc.vy += 0.04;
    if (sc.t > 26) b8.scintille.splice(i, 1);
  }
}

/** Sonda QA: cosa mostra l'hub stanotte per il segreto. */
function indiziHubB8() {
  const s = statoB8();
  const notte = getNumeroNotte();
  const ind = indizioDisponibileB8(s, notte);
  return { notte, sigilli: sigilliB8(s), ferri: SEGRETO_B8.ferri.filter((f) => s.ferri[f.id]).map((f) => f.id),
    luce: !s.portaAperta && notte >= SEGRETO_B8.daNotte.luce, vocePorta: !s.portaAperta && notte >= SEGRETO_B8.daNotte.voce,
    tonino: ind && b8.indizioNotte !== notte ? ind.id : null, esame: righeEsameB8(s, notte).slice(),
    seme: semeSegretoB8(s, notte), portaAperta: s.portaAperta, filoOro: sigilliB8(s) >= 3 && SEGRETO_B8.serveFinaleVero && !s.finaleVisto && !s.portaAperta };
}

// ===========================================================================
// 8. OSSERVAZIONI IN RUN (Voce, note del Diario, finale pendente)
// ===========================================================================
/** Trasformazioni attive, se la squadra delle trasformazioni espone interni.statoTrasformazioni. */
function trasformazioniB8() {
  let x = null;
  try { x = window.__teatro.interni.statoTrasformazioni; if (typeof x === 'function') x = x(); } catch (_) { x = null; }
  if (!x) return [];
  const nome = (e, k) => (typeof e === 'string' ? e : e && (e.attiva === false || e.completa === false) ? null : (e && (e.nome || e.titolo || e.id)) || k || null);
  if (Array.isArray(x)) return x.map((e) => nome(e)).filter(Boolean);
  if (typeof x === 'object') {
    if (Array.isArray(x.attive)) return x.attive.map((e) => nome(e)).filter(Boolean);
    return Object.entries(x).filter(([, v]) => v === true || (v && typeof v === 'object' && (v.attiva || v.completa))).map(([k, v]) => nome(v === true ? k : v, k)).filter(Boolean);
  }
  return [];
}

function osservaRunB8() {
  const nota = b8.nota;
  const eq = statoRun.oggettiEquipaggiati || [];
  for (const it of eq) {
    if (it && it.tier === 'patto' && it.nome && !nota.patti.includes(it.nome)) { nota.patti.push(it.nome); diciB8('patto'); }
  }
  const tr = trasformazioniB8();
  if (b8.trasformazioniViste === null) b8.trasformazioniViste = tr.slice();
  else for (const t of tr) {
    if (!b8.trasformazioniViste.includes(t)) { b8.trasformazioniViste.push(t); if (!nota.trasformazioni.includes(t)) nota.trasformazioni.push(t); diciB8('trasformazione', { nome: t }); }
  }
  const ciclo = statoRun.ciclo || 1;
  if (ciclo > nota.cicloMax) {
    nota.cicloMax = ciclo;
    diciB8('senzaFine', { ciclo });
    const s = statoB8();
    if (ciclo > s.recordCiclo) { s.recordCiclo = ciclo; scriviB8(s); }
  }
}

function logicaGiocoB8() {
  if (!b8.nota || b8.nota.run !== statoRun.numeroRun) {
    b8.nota = nuovaNotaB8(); b8.ultimoHp = statoRun.hpHalf; b8.trasformazioniViste = null;
  }
  const st = statoRun.stanzaCorrente;
  const fp = b8.finalePendente;
  if (fp) {
    if (fp.st !== st) b8.finalePendente = null;
    else {
      st.uscitaAperta = false; st.portaPattoAperta = false; // la notte finisce qui: niente botola, niente Patto
      if (!(typeof a7 === 'object' && a7 && a7.pergamena) && --fp.attesa <= 0) { b8.finalePendente = null; avviaFinaleB8('vero', {}); return; }
    }
  }
  const bp = b8.bannerPendente;
  if (bp) { b8.bannerPendente = null; if (bp.st === st) mostraBanner(bp.testo, 320); }
  const pb = b8.bossDaPresentare;
  if (pb) {
    if (pb.st !== st || st.pulita) b8.bossDaPresentare = null;
    else if (!statoRun.siparioAttivo && !dialogoT4B8()) { b8.bossDaPresentare = null; diciB8('boss', { id: pb.id, boss: pb.nome }); }
  }
  if (statoRun.hpHalf === 1 && b8.ultimoHp > 1 && statoRun.maxHpHalf > 1 && !b8.nota.ultimaDetta) { b8.nota.ultimaDetta = true; diciB8('ultima'); }
  b8.ultimoHp = statoRun.hpHalf;
  if (tick - b8.ultimoControlloTick >= 30) { b8.ultimoControlloTick = tick; osservaRunB8(); }
}

function logicaB8() {
  const fase = statoRun.fase;
  if (fase !== b8.ultimaFase) { if (fase === 'hub') ingressoHubB8(); b8.ultimaFase = fase; }
  if (statoRun.pausa) return;
  if (fase === 'hub') logicaHubB8();
  else if (fase === 'in_gioco') logicaGiocoB8();
}

/** «Il Volto Ritrovato»: una volta per notte l'ultima maschera non è la fine. @returns true se ha salvato. */
function voltoSalvaB8() {
  if (statoRun.fase !== 'in_gioco') return false;
  if (!statoB8().volto || b8.voltoUsatoRun === statoRun.numeroRun) return false;
  b8.voltoUsatoRun = statoRun.numeroRun;
  statoRun.hpHalf = CONFIG_B8.volto.hpHalf;
  player.invuln = CONFIG_B8.volto.invulnTick;
  try { statoRun.ondeEsplosione.push({ x: player.x, y: player.y, r: 10, maxR: 130, color: '#f3dfc1' }); } catch (_) { /* effetto facoltativo */ }
  mostraBanner(TESTI_B8.volto.banner, 240);
  suonoFerroB8(0.1);
  return true;
}

function dopoMorteB8(fonte) {
  if (statoRun.fase !== 'morte') return;
  const nota = b8.nota || (b8.nota = nuovaNotaB8());
  if (nota.paginaScritta) return;
  nota.paginaScritta = true;
  let v = null;
  try { if (typeof a7 === 'object' && a7 && a7.inAttesaHub && a7.inAttesaHub.voce) v = a7.inAttesaHub.voce; } catch (_) { v = null; }
  scriviPaginaRunB8(v || voceDaStatoB8('morte', fonte), { nota });
  diciB8('fineNotte');
}

function dopoRicominciaB8(primaFase, primaNotte) {
  if (primaFase === 'in_gioco') {
    const nota = b8.nota || nuovaNotaB8();
    if (nota.paginaScritta) return;
    nota.paginaScritta = true;
    let v = null;
    try { if (typeof leggiRegistroA7 === 'function') { const l = leggiRegistroA7(); v = l[l.length - 1] || null; } } catch (_) { v = null; }
    if (!v || v.notte !== primaNotte) v = voceDaStatoB8('abbandonata', null);
    scriviPaginaRunB8({ ...v, notte: primaNotte, esito: /morte|vittoria/.test(v.esito || '') ? v.esito : 'abbandonata' }, { nota });
  } else if (primaFase === 'hub') {
    scriviPaginaRunB8({ ...voceDaStatoB8('piazza', null), notte: primaNotte, id: `piazza-${primaNotte}` }, { nota: nuovaNotaB8() });
  }
}

// ===========================================================================
// 9. MOTORE DEI FINALI (fase 'finale')
// ===========================================================================
function contestoFinaleB8() {
  const f = flagTramaB8(true);
  return { tonino: f.tonino_ricordo || null, medaglione: Boolean(f.medaglione_in_mano),
    patto: (statoRun.oggettiEquipaggiati || []).some((it) => it && it.tier === 'patto'),
    scelta: statoB8().scelta || null, n: Math.max(1, getNumeroNotte() - 1) };
}

function condizioneB8(se, cx) {
  switch (se) {
    case 'patto': return Boolean(cx.patto);
    case 'noPatto': return !cx.patto;
    case 'toninoRestituito': return cx.tonino === 'restituito';
    case 'toninoNegato': return cx.tonino === 'negato';
    case 'toninoNonRestituito': return cx.tonino !== 'restituito';
    case 'medaglione': return Boolean(cx.medaglione) && !cx.tonino;
    case 'uccisa': return cx.scelta === 'uccisa';
    case 'risparmiata': return cx.scelta === 'risparmiata';
    default: return true;
  }
}

const testoFinaleB8 = (t, cx) => riempiB8(t, { signora: TESTI_B8.nomeSignora, n: cx.n });

function preparaSceneB8(lista, cx) {
  return (lista || []).map((sc) => ({ ...sc,
    battute: (sc.battute || []).filter((b) => condizioneB8(b.se, cx)).map((b) => ({ ...b, testo: testoFinaleB8(b.testo, cx) })),
    frase: sc.frase ? testoFinaleB8(sc.frase, cx) : undefined,
    righe: sc.righe ? sc.righe.reduce((acc, r) => acc.concat(r.crediti ? TESTI_B8.crediti.map((t) => ({ t, stile: 'sotto' })) : [{ ...r, t: testoFinaleB8(r.t, cx) }]), []) : undefined,
  }));
}

function statoScenaB8(f) {
  const sc = f.scene[f.i];
  if (!sc) return {};
  const st = { ...(sc.stato || {}) };
  const bt = sc.battute || [];
  for (let k = 0; k <= f.j && k < bt.length; k++) if (bt[k].set) Object.assign(st, bt[k].set);
  return st;
}

function applicaBattutaB8() {
  const f = b8.fin;
  if (!f) return;
  f.t = 0;
  const nuovo = statoScenaB8(f);
  // f.quando[chiave] = tick di scena in cui quel pezzo di stato è cambiato (per le animazioni dei fondali)
  for (const k of Object.keys(nuovo)) if (!f.st || f.st[k] !== nuovo[k] || f.quando[k] === undefined) f.quando[k] = f.st ? f.tScena : 0;
  f.st = nuovo;
  const sc = f.scene[f.i];
  const v = sc && sc.battute && sc.battute[f.j];
  if (v && v.fx) { f.fx = { tipo: v.fx, t: 0 }; if (v.fx === 'colpo') suonoFerroB8(0.14); else suonoToccoB8(); }
}

/**
 * Fa partire un finale: 'vero' (ultimo atto), 'fucina' (dietro la porta), 'ribalta' (Sopra la Ribalta).
 * @param {{rivisto?: boolean, contesto?: object}} [opz] rivisto = dal Diario: nessun effetto sul gioco.
 */
function avviaFinaleB8(id, opz = {}) {
  const def = FINALE_B8[id];
  if (!def || b8.fin) return false;
  const s = statoB8();
  const cx = opz.rivisto && s.contesti && s.contesti[id] ? { ...s.contesti[id] } : contestoFinaleB8();
  if (opz.contesto) Object.assign(cx, opz.contesto);
  let sceltaFissa = null;
  if (opz.rivisto) sceltaFissa = id === 'vero' ? (s.scelta || 'risparmiata') : id === 'fucina' ? (s.segretoVisto ? 'sali' : 'resta') : null;
  b8.fin = { id, cx, scene: preparaSceneB8(def.apertura, cx), i: 0, j: 0, t: 0, tScena: 0, fade: CONFIG_B8.scena.transizioneTick,
    inScelta: false, sel: 0, scelta: null, sceltaFissa, rivisto: Boolean(opz.rivisto), fx: null, st: null, quando: {}, concluso: false,
    ritorno: { fase: statoRun.fase, pausa: Boolean(statoRun.pausa), diario: Boolean(statoRun.diarioD) } };
  statoRun.pausa = false; statoRun.diarioD = null; statoRun.siparioAttivo = null;
  statoRun.banner = null; statoRun.bannerTimer = 0;
  b8.did.coda.length = 0; b8.did.att = null; b8.cart = null; b8.finalePendente = null;
  statoRun.fase = 'finale';
  applicaBattutaB8();
  return true;
}

function prossimaScenaB8() {
  const f = b8.fin;
  f.i++; f.j = 0; f.tScena = 0; f.fade = CONFIG_B8.scena.transizioneTick; f.fx = null; f.st = null; f.quando = {};
  if (f.i >= f.scene.length) { concludiFinaleB8(); return; }
  applicaBattutaB8();
}

function scegliFinaleB8(i) {
  const f = b8.fin;
  const sc = f && f.scene[f.i];
  if (!sc || !sc.scelta) return false;
  const op = sc.scelta.opzioni[i];
  if (!op) return false;
  f.inScelta = false;
  f.scelta = op.id;
  if (sc.scelta.flag === 'violante') f.cx.scelta = op.id;
  const def = FINALE_B8[f.id];
  f.scene = f.scene.slice(0, f.i + 1).concat(preparaSceneB8((def.rami && def.rami[op.id]) || [], f.cx), preparaSceneB8(def.epilogo, f.cx));
  prossimaScenaB8();
  return true;
}

function indiceSceltaFissaB8(f) {
  const sc = f.scene[f.i];
  const i = sc && sc.scelta ? sc.scelta.opzioni.findIndex((o) => o.id === f.sceltaFissa) : -1;
  return i >= 0 ? i : 0;
}

/** Avanza di una battuta (o completa quella che si sta scrivendo, o conferma la scelta). */
function avanzaFinaleB8() {
  const f = b8.fin;
  if (!f) return;
  const S = CONFIG_B8.scena;
  const sc = f.scene[f.i];
  if (!sc) { concludiFinaleB8(); return; }
  if (f.inScelta) { scegliFinaleB8(f.sceltaFissa ? indiceSceltaFissaB8(f) : f.sel); return; }
  if (sc.fondale === 'nero') { if (f.tScena >= S.minimoNeroTick) prossimaScenaB8(); return; }
  if (sc.fondale === 'titoli') {
    const tot = sc.righe.length * S.rigaTitoliTick;
    if (f.tScena < tot) f.tScena = tot; else prossimaScenaB8();
    return;
  }
  const bt = sc.battute || [];
  const v = bt[f.j];
  if (v && f.t * S.caratteriPerTick < v.testo.length) { f.t = 1e6; return; }
  if (f.j < bt.length - 1) { f.j++; applicaBattutaB8(); return; }
  if (sc.scelta && !f.scelta) { f.inScelta = true; f.sel = f.sceltaFissa ? indiceSceltaFissaB8(f) : 0; return; }
  prossimaScenaB8();
}

function aggiornaFinaleB8() {
  const f = b8.fin;
  if (!f) return;
  f.t++; f.tScena++;
  if (f.fade > 0) f.fade--;
  if (f.fx && ++f.fx.t > 44) f.fx = null;
  // nella Fucina il martello batte col ritmo della porta
  if (f.st && f.st.batte && SEGRETO_B8.ritmo.battiti.includes(tick % SEGRETO_B8.ritmo.cicloTick)) suonoFerroB8(0.06);
}

/** QA / «Ricomincia» durante il finale: salta alla fine (la scelta non fatta vale «risparmia» / «resta»). */
function saltaFinaleB8() {
  const f = b8.fin;
  if (!f) return false;
  if (f.id === 'vero' && !f.cx.scelta) f.cx.scelta = 'risparmiata';
  if (f.id === 'fucina' && !f.scelta) f.scelta = 'resta';
  concludiFinaleB8();
  return true;
}

function tornaInPiazzaB8(nuovaNotte) {
  statoRun.pausa = false; statoRun.siparioAttivo = null; statoRun.diarioD = null;
  if (nuovaNotte) { try { statoRun.numeroNotte = incrementaNumeroNotte(); } catch (err) { console.warn('[B8] notte', err); } }
  statoRun.fase = 'menu_selezione';
  if (!t4Gancio('avvio', statoRun.personaggioId)) statoRun.fase = 'menu_selezione';
}

function fineVeroB8(f) {
  const s = statoB8();
  const scelta = f.cx.scelta || 'risparmiata';
  const prima = !s.finaleVisto;
  s.finaleVisto = true; s.scelta = scelta; s.senzaFine = true;
  s.finali[scelta] = statoRun.numeroNotte || getNumeroNotte();
  s.contesti.vero = { ...f.cx, scelta };
  scriviB8(s);
  try { const q = t4qaB8(); if (q) q.impostaFlag({ violante: scelta }); } catch (err) { console.warn('[B8] flag violante', err); }
  b8.flag = null;
  let v = null;
  try {
    if (typeof a7 === 'object' && a7 && a7.run) {
      v = a7.run;
      v.esito = 'vittoria'; v.vittoria = true; v.fine = new Date().toISOString();
      v.piano = Math.max(v.piano || 1, statoRun.piano || 1);
      v.hpFine = statoRun.hpHalf; v.maxHpFine = statoRun.maxHpHalf; v.moneteFine = statoRun.monete || 0;
      if (typeof salvaVoceA7 === 'function') salvaVoceA7(v);
      a7.run = null; a7.pergamena = null; a7.inAttesaHub = null;
    }
  } catch (err) { console.warn('[B8] registro della vittoria', err); }
  if (f.ritorno.fase === 'in_gioco') {
    const nota = b8.nota || nuovaNotaB8();
    nota.finale = scelta;
    if (!nota.paginaScritta) { nota.paginaScritta = true; scriviPaginaRunB8(v || voceDaStatoB8('vittoria', null), { nota }); }
  }
  if (prima) registraSbloccoB8(CONFIG_B8.sblocchi.senzaFine, TESTI_B8.senzaFine.nome, TESTI_B8.senzaFine.sblocco);
  tornaInPiazzaB8(true);
}

function fineFucinaB8(f) {
  const s = statoB8();
  const prima = !s.fucinaVista;
  const salito = f.scelta === 'sali';
  s.fucinaVista = true; s.volto = true;
  s.contesti.fucina = { ...f.cx };
  scriviB8(s);
  if (prima) registraSbloccoB8(CONFIG_B8.volto.sblocco, TESTI_B8.volto.nome, TESTI_B8.volto.sblocco);
  if (prima || !salito) aggiungiPaginaB8(paginaSegretoB8('fucina', salito));
  statoRun.fase = 'hub'; statoRun.pausa = false;
  player.x = SEGRETO_B8.porta.x; player.y = SEGRETO_B8.porta.sogliaY + 10;
  player.targetX = null; player.targetY = null;
  if (salito) entraSopraLaRibaltaB8();
}

function fineRibaltaB8(f) {
  const s = statoB8();
  s.segretoVisto = true; s.volto = true;
  s.contesti.ribalta = { ...f.cx };
  scriviB8(s);
  registraSbloccoB8(CONFIG_B8.sblocchi.sipario, TESTI_B8.sipario.nome, TESTI_B8.sipario.sblocco);
  aggiungiPaginaB8(paginaSegretoB8('ribalta', true));
  tornaInPiazzaB8(false);
}

function concludiFinaleB8() {
  const f = b8.fin;
  if (!f || f.concluso) return;
  f.concluso = true;
  b8.fin = null;
  if (f.rivisto) {
    statoRun.fase = f.ritorno.fase;
    statoRun.pausa = f.ritorno.pausa;
    if (f.ritorno.pausa) statoRun.diarioD = { sel: 0, paginaB8: 'finali', paginaIdx: -1, selFinale: 0 };
    return;
  }
  try {
    if (f.id === 'vero') fineVeroB8(f);
    else if (f.id === 'fucina') fineFucinaB8(f);
    else fineRibaltaB8(f);
  } catch (err) { console.error('[B8] chiusura del finale', err); tornaInPiazzaB8(false); }
}

/**
 * GANCIO «Sopra la Ribalta». Lo chiama la Fucina del Ricordo quando si sale la scala. Oggi porta alla scena
 * finale narrata. Se un'altra squadra assegna una funzione a interni.scontroSopraLaRibalta, parte prima quella:
 * riceve { fine, annulla, sigilli } e a vittoria chiama fine() (= finaleSopraLaRibalta).
 * @returns {'scontro'|'scena'}
 */
function entraSopraLaRibaltaB8() {
  const scontro = window.__teatro.interni.scontroSopraLaRibalta;
  if (typeof scontro === 'function') {
    try {
      scontro({ fine: () => finaleSopraLaRibaltaB8(), annulla: () => { if (statoRun.fase !== 'hub') tornaInPiazzaB8(false); }, sigilli: sigilliB8() });
      return 'scontro';
    } catch (err) { console.error('[B8] scontro Sopra la Ribalta', err); }
  }
  finaleSopraLaRibaltaB8();
  return 'scena';
}

/** La scena finale narrata «Sopra la Ribalta» (taglio del filo maestro, sipario che cala). */
function finaleSopraLaRibaltaB8() { return avviaFinaleB8('ribalta', {}); }

function rettOpzioneB8(i) {
  const S = CONFIG_B8.scelta;
  return { x: S.x + 16, y: S.y + 58 + i * (S.optH + 8), w: S.w - 32, h: S.optH };
}

function tastoFinaleB8(e) {
  const f = b8.fin;
  if (!f || e.repeat) return;
  const code = e.code;
  if (code === 'Escape') { if (f.rivisto) concludiFinaleB8(); return; }
  if (f.inScelta && !f.sceltaFissa) {
    const n = f.scene[f.i].scelta.opzioni.length;
    if (['ArrowUp', 'KeyW', 'ArrowLeft', 'KeyA'].includes(code)) { f.sel = (f.sel - 1 + n) % n; return; }
    if (['ArrowDown', 'KeyS', 'ArrowRight', 'KeyD'].includes(code)) { f.sel = (f.sel + 1) % n; return; }
    if (/^Digit[1-9]$/.test(code) && Number(code.slice(5)) <= n) { f.sel = Number(code.slice(5)) - 1; scegliFinaleB8(f.sel); return; }
  }
  if (CONFIG_B8.avanza.includes(code)) avanzaFinaleB8();
}

function clickFinaleB8(mx, my) {
  const f = b8.fin;
  if (!f) return;
  if (f.inScelta && !f.sceltaFissa) {
    const ops = f.scene[f.i].scelta.opzioni;
    for (let i = 0; i < ops.length; i++) {
      const r = rettOpzioneB8(i);
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) { f.sel = i; scegliFinaleB8(i); return; }
    }
    return;
  }
  avanzaFinaleB8();
}

// ===========================================================================
// 10. INPUT (attraverso il gancio 'tasto'/'click' di T4) E DIARIO
// ===========================================================================
function apriDiarioB8(sezione, daHub) {
  statoRun.pausa = true;
  statoRun.diarioD = { sel: 0, paginaB8: sezione === 'finali' ? 'finali' : 'notti', paginaIdx: -1, selFinale: 0 };
  b8.diarioDaHub = Boolean(daHub);
}

function chiudiDiarioB8() {
  statoRun.diarioD = null;
  if (b8.diarioDaHub) { statoRun.pausa = false; b8.diarioDaHub = false; }
}

/** Voci della sezione «Finali» del Diario. */
function vociFinaliB8() {
  const s = statoB8();
  const D = TESTI_B8.diario;
  return [
    { id: 'vero', disponibile: s.finaleVisto, nome: s.finaleVisto ? D.vero[s.scelta] || D.vero.risparmiata : D.ignoto, aiuto: D.veroBloccato },
    { id: 'fucina', disponibile: s.fucinaVista, nome: s.fucinaVista ? D.fucina : D.ignoto, aiuto: D.fucinaBloccata },
    { id: 'ribalta', disponibile: s.segretoVisto, nome: s.segretoVisto ? D.ribalta : D.ignoto, aiuto: D.ribaltaBloccata },
  ];
}

function tastoDiarioB8(code) {
  const d = statoRun.diarioD;
  if (!d) return;
  if (code === 'Escape' || code === 'KeyO') { chiudiDiarioB8(); return; }
  if (code === CONFIG_B8.tasti.diario) { d.paginaB8 = null; return; }
  if (code === CONFIG_B8.tasti.finali) { d.paginaB8 = d.paginaB8 === 'finali' ? 'notti' : 'finali'; return; }
  if (d.paginaB8 === 'notti') {
    const n = leggiDiarioB8().pagine.length;
    let i = d.paginaIdx < 0 || d.paginaIdx >= n ? n - 1 : d.paginaIdx;
    if (['ArrowLeft', 'KeyA', 'ArrowUp', 'KeyW'].includes(code)) i = Math.max(0, i - 1);
    else if (['ArrowRight', 'KeyD', 'ArrowDown', 'KeyS'].includes(code)) i = Math.min(n - 1, i + 1);
    else if (code === 'Home') i = 0;
    else if (code === 'End') i = n - 1;
    d.paginaIdx = i;
    return;
  }
  const voci = vociFinaliB8();
  if (['ArrowUp', 'KeyW'].includes(code)) d.selFinale = (d.selFinale - 1 + voci.length) % voci.length;
  else if (['ArrowDown', 'KeyS'].includes(code)) d.selFinale = (d.selFinale + 1) % voci.length;
  else if (['Enter', 'Space'].includes(code)) { const v = voci[d.selFinale]; if (v && v.disponibile) avviaFinaleB8(v.id, { rivisto: true }); }
}

function rigaFinaleB8(i) {
  const P = CONFIG_B8.diario;
  return { x: P.x + 30, y: P.y + 78 + i * 34, w: P.w - 60, h: 28 };
}

function clickDiarioB8(mx, my) {
  const d = statoRun.diarioD;
  const P = CONFIG_B8.diario;
  if (!d) return;
  if (mx < P.x || mx > P.x + P.w || my < P.y || my > P.y + P.h) { chiudiDiarioB8(); return; }
  if (d.paginaB8 === 'notti') { tastoDiarioB8(mx < W / 2 ? 'ArrowLeft' : 'ArrowRight'); return; }
  const voci = vociFinaliB8();
  for (let i = 0; i < voci.length; i++) {
    const r = rigaFinaleB8(i);
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
      if (d.selFinale === i && voci[i].disponibile) avviaFinaleB8(voci[i].id, { rivisto: true }); else d.selFinale = i;
      return;
    }
  }
}

function tastoB8(e) {
  if (!e) return false;
  const fase = statoRun.fase;
  const code = e.code;
  if (fase === 'finale' && b8.fin) { tastoFinaleB8(e); return true; }
  if (fase === 'menu_selezione' || fase === 'morte') return false;
  if (statoRun.pausa) {
    if (!statoRun.diarioD && code === CONFIG_B8.tasti.diario && !e.repeat) { apriDiarioB8('notti', false); return true; }
    return false;
  }
  if (fase !== 'hub') return false;
  if (b8.cart) {
    if (code === 'Escape') return false;
    if (CONFIG_B8.avanza.includes(code) && !e.repeat) avanzaCartB8();
    return true;
  }
  if (dialogoT4B8() || (typeof a7 === 'object' && a7 && a7.pergamena)) return false;
  if (code === CONFIG_B8.tasti.diario && !e.repeat) { apriDiarioB8('notti', true); return true; }
  if (CONFIG_B8.avanza.includes(code) && vicinoPortaB8()) {
    if (!e.repeat) { if (statoB8().portaAperta) avviaFinaleB8('fucina', {}); else bussaB8(); }
    return true;
  }
  return false;
}

function clickB8(mx, my) {
  if (statoRun.fase === 'finale' && b8.fin) { clickFinaleB8(mx, my); return true; }
  if (statoRun.fase === 'hub' && b8.cart && !statoRun.pausa) { avanzaCartB8(); return true; }
  return false;
}

// ===========================================================================
// 11. AVVOLGIMENTI DELLE FUNZIONI DI BASE (chiamano sempre la base)
// ===========================================================================
const t4GancioBaseB8 = t4Gancio;
t4Gancio = function (nome, ...args) {
  try {
    if (nome === 'morte' && voltoSalvaB8()) return true;
    if (nome === 'raccogli' && args[0] && String(args[0].id || '').startsWith(SEGRETO_B8.prefissoRaccolta)) {
      daiFerroB8(String(args[0].id).slice(SEGRETO_B8.prefissoRaccolta.length));
      return true;
    }
    if (nome === 'tasto' && tastoB8(args[0])) return true;
    if (nome === 'click' && clickB8(args[0], args[1])) return true;
    if (nome === 'logica' && statoRun.fase === 'hub' && b8.cart && !statoRun.pausa) { b8.cart.t++; return true; } // il nostro cartiglio ferma la piazza
    if (nome === 'ricomincia' && statoRun.fase === 'finale' && b8.fin) { saltaFinaleB8(); return true; }
  } catch (err) { console.error('[B8]', nome, err); }
  const primaFase = statoRun.fase;
  const primaNotte = statoRun.numeroNotte || getNumeroNotte();
  const r = t4GancioBaseB8(nome, ...args);
  try {
    if (nome === 'logica') {
      if (statoRun.fase === 'finale') { if (b8.fin) aggiornaFinaleB8(); else tornaInPiazzaB8(false); return true; }
      logicaB8();
    } else if (nome === 'disegna') {
      if (statoRun.fase === 'finale' && b8.fin) { disegnaFinaleB8(); return true; }
    } else if (nome === 'bossSconfitto') bossSconfittoB8(args[0]);
    else if (nome === 'morte') { if (r && primaFase === 'in_gioco') dopoMorteB8(args[0]); }
    else if (nome === 'ricomincia') { if (r) dopoRicominciaB8(primaFase, primaNotte); }
    else if (nome === 'raccogli') { if (r) { if (b8.nota) b8.nota.medaglione = true; diciB8('medaglione'); } }
    else if (nome === 'sopra') sopraB8(args[0]);
  } catch (err) { console.error('[B8]', nome, err); }
  return r;
};

const nuovaRunBaseB8 = nuovaRun;
nuovaRun = function (...args) {
  const r = nuovaRunBaseB8.apply(this, args);
  try {
    b8.nota = nuovaNotaB8(); b8.ultimoHp = statoRun.hpHalf; b8.trasformazioniViste = null;
    b8.finalePendente = null; b8.bannerPendente = null;
  } catch (err) { console.error('[B8] nuova run', err); }
  return r;
};

const entraInStanzaBaseB8 = entraInStanza;
entraInStanza = function (stanza, ...resto) {
  const r = entraInStanzaBaseB8.call(this, stanza, ...resto);
  try {
    const st = statoRun.stanzaCorrente;
    preparaStanzaB8(st);
    b8.bossDaPresentare = null;
    if (st && st.tipo === 'boss' && !st.pulita) {
      const b = st.nemici.find((n) => n.boss && n.hp > 0);
      if (b) b8.bossDaPresentare = { st, id: b.bossId || null, nome: pulisciNomeB8(b.nome) };
    }
  } catch (err) { console.error('[B8] stanza', err); }
  return r;
};

const interagisciStanzaBaseB8 = interagisciStanza;
/** [E] accanto al cordone del sipario (dopo Donna Luciana, dal secondo trionfo): l'ultimo atto, poi la piazza. */
interagisciStanza = function (...args) {
  try {
    const st = statoRun.stanzaCorrente;
    const C = CONFIG_B8.cordone;
    if (st && st.cordoneB8 && statoRun.fase === 'in_gioco' && !statoRun.siparioAttivo && !statoRun.scambioPendente
      && Math.hypot(player.x - C.x, player.y - C.y) < C.raggio) {
      avviaFinaleB8('vero', {});
      return undefined;
    }
  } catch (err) { console.error('[B8] cordone', err); }
  return interagisciStanzaBaseB8.apply(this, args);
};

const disegnaStanzaBaseB8 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function (t, st, ...resto) {
  const r = disegnaStanzaBaseB8.call(this, t, st, ...resto);
  try { disegnaInStanzaB8(st || statoRun.stanzaCorrente); } catch (err) { console.error('[B8] stanza (disegno)', err); }
  return r;
};

const apriMuroSegretoBaseB8 = apriMuroSegreto;
apriMuroSegreto = function (...args) {
  const r = apriMuroSegretoBaseB8.apply(this, args);
  try { if (statoRun.fase === 'in_gioco') { if (b8.nota) b8.nota.segreta = true; diciB8('segreta'); } } catch (err) { console.error('[B8] segreta', err); }
  return r;
};

const getRaccontoAttoBaseB8 = getRaccontoAtto;
/** Il sipario del ciclo dichiara la modalità: «NOTTE SENZA FINE». */
getRaccontoAtto = function (piano, ciclo, ...resto) {
  const info = getRaccontoAttoBaseB8.call(this, piano, ciclo, ...resto);
  try { if (info && ciclo > 1 && typeof info.atto === 'string') info.atto = info.atto.replace('CICLO INFINITO', TESTI_B8.senzaFine.atto); } catch (_) { /* testo di base cambiato */ }
  return info;
};

const disegnaMenuPausaBaseB8 = disegnaMenuPausa;
disegnaMenuPausa = function (...args) {
  const r = disegnaMenuPausaBaseB8.apply(this, args);
  try { if (!statoRun.diarioD && !(typeof a7 === 'object' && a7 && a7.registroAperto)) disegnaLinguettaB8(); } catch (err) { console.error('[B8] menu', err); }
  return r;
};

const clickMenuPausaBaseB8 = gestisciClickMenuPausa;
gestisciClickMenuPausa = function (mx, my, ...resto) {
  const L = CONFIG_B8.linguetta;
  if (!statoRun.diarioD && !(typeof a7 === 'object' && a7 && a7.registroAperto) && mx >= L.x && mx <= L.x + L.w && my >= L.y && my <= L.y + L.h) {
    apriDiarioB8('notti', false);
    return true;
  }
  return clickMenuPausaBaseB8.call(this, mx, my, ...resto);
};

const tastoDiarioBaseB8 = tastoDiarioD;
/** Nel Diario degli oggetti [N] apre la sezione «Diario di Ferruccio»; lì dentro i tasti sono nostri. */
tastoDiarioD = function (code, ...resto) {
  const d = statoRun.diarioD;
  if (d && d.paginaB8) { try { tastoDiarioB8(code); } catch (err) { console.error('[B8] diario', err); } return undefined; }
  if (d && code === CONFIG_B8.tasti.diario) { d.paginaB8 = 'notti'; d.paginaIdx = -1; d.selFinale = 0; return undefined; }
  return tastoDiarioBaseB8.call(this, code, ...resto);
};

const clickDiarioBaseB8 = clickDiarioD;
clickDiarioD = function (mx, my, ...resto) {
  const d = statoRun.diarioD;
  if (d && d.paginaB8) { try { clickDiarioB8(mx, my); } catch (err) { console.error('[B8] diario', err); } return undefined; }
  return clickDiarioBaseB8.call(this, mx, my, ...resto);
};

const disegnaDiarioBaseB8 = disegnaDiarioD;
disegnaDiarioD = function (...args) {
  const d = statoRun.diarioD;
  if (d && d.paginaB8) { try { disegnaDiarioB8(); } catch (err) { console.error('[B8] diario (disegno)', err); } return undefined; }
  const r = disegnaDiarioBaseB8.apply(this, args);
  try { drawPillLabel(TESTI_B8.diario.piedeOggetti, W - 96, 20, 176, { size: 7, color: '#f9cb40', border: '#8a5a2b' }); } catch (_) { /* decorazione */ }
  return r;
};

// ===========================================================================
// 12. DISEGNO: testo
// ===========================================================================
const FONT_B8 = "Georgia, 'Times New Roman', serif";
const fontB8 = (size, stile) => `${stile ? `${stile} ` : ''}${size}px ${FONT_B8}`;

/** A capo dentro maxW (con cache: niente misure a ogni frame). */
function aCapoB8(testo, maxW, font) {
  const chiave = `${font}|${maxW}|${testo}`;
  const gia = b8.righe.get(chiave);
  if (gia) return gia;
  ctx.save();
  ctx.font = font;
  const righe = [];
  let riga = '';
  for (const p of String(testo).split(/\s+/)) {
    const prova = riga ? `${riga} ${p}` : p;
    if (riga && ctx.measureText(prova).width > maxW) { righe.push(riga); riga = p; } else riga = prova;
  }
  if (riga) righe.push(riga);
  ctx.restore();
  if (b8.righe.size > 400) b8.righe.clear();
  b8.righe.set(chiave, righe);
  return righe;
}

function testoB8(t, x, y, o = {}) {
  if (!t) return;
  ctx.save();
  ctx.font = fontB8(o.size || 10, o.stile || '');
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = 'alphabetic';
  if (o.alpha !== undefined) ctx.globalAlpha *= Math.max(0, Math.min(1, o.alpha));
  if (o.ombra !== false) { ctx.fillStyle = 'rgba(4, 2, 1, 0.9)'; ctx.fillText(t, x + 1, y + 1); }
  ctx.fillStyle = o.color || '#f3dfc1';
  ctx.fillText(t, x, y);
  ctx.restore();
}

const nomeChiB8 = (chi) => (chi === 'luciana' ? TESTI_B8.nomeSignora : TESTI_B8.nomi[chi] || chi);

/** Cartiglio di una battuta (stesso aspetto di quello dell'hub). mostrati = caratteri già scritti. */
function disegnaCartiglioB8(v, mostrati, opz = {}) {
  if (!v) return;
  const { x, y, w, h } = opz.rett || CONFIG_B8.cartiglio;
  const did = v.chi === 'didascalia';
  const grande = v.chi === 'alto' || v.chi === 'burattinaio';
  ctx.save();
  if (opz.velo) { ctx.fillStyle = 'rgba(6, 3, 2, 0.35)'; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = 'rgba(20, 12, 8, 0.96)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = '#5c3a1e'; ctx.lineWidth = 1; ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
  ctx.fillStyle = '#5c110b';
  ctx.fillRect(x - 8, y - 2, 8, h + 4); ctx.fillRect(x + w, y - 2, 8, h + 4);
  if (!did) {
    const n = nomeChiB8(v.chi);
    ctx.font = fontB8(9, 'bold');
    const nw = Math.ceil(ctx.measureText(n).width) + 18;
    ctx.fillStyle = v.chi === 'luciana' || grande ? '#3b0d2a' : '#7a1c12';
    ctx.fillRect(x + 14, y - 10, nw, 16);
    ctx.strokeStyle = '#f9cb40'; ctx.strokeRect(x + 14.5, y - 9.5, nw - 1, 15);
    testoB8(n, x + 14 + nw / 2, y + 2, { size: 9, stile: 'bold', color: '#f9cb40', align: 'center', ombra: false });
  }
  const size = grande ? 20 : 11;
  const stile = did ? 'italic' : 'bold';
  const pieno = did ? v.testo : `«${v.testo}»`;
  const righe = aCapoB8(pieno, w - 44, fontB8(size, stile));
  let resto = mostrati;
  for (let i = 0; i < righe.length && i < 4 && resto > 0; i++) {
    const r = righe[i];
    testoB8(resto >= r.length ? r : r.slice(0, resto), x + 22, y + (grande ? 40 : 24) + i * (size + 4), { size, stile, color: did ? '#c9a679' : '#f3dfc1' });
    resto -= r.length + 1;
  }
  testoB8(`${Math.floor(tick / 20) % 2 === 0 ? '▶' : '▷'} ${TESTI_B8.avanti}`, x + w - 16, y + h - 9, { size: 7.5, color: '#f9cb40', align: 'right', ombra: false });
  ctx.restore();
}

function disegnaSceltaB8(f, sc) {
  const S = CONFIG_B8.scelta;
  const c = sc.scelta;
  ctx.save();
  ctx.fillStyle = 'rgba(4, 2, 1, 0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(20, 12, 8, 0.97)';
  ctx.fillRect(S.x, S.y, S.w, S.h);
  ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 2; ctx.strokeRect(S.x, S.y, S.w, S.h);
  ctx.strokeStyle = '#5c3a1e'; ctx.lineWidth = 1; ctx.strokeRect(S.x + 4.5, S.y + 4.5, S.w - 9, S.h - 9);
  testoB8(testoFinaleB8(c.titolo, f.cx), W / 2, S.y + 27, { size: 15, stile: 'bold', color: '#f9cb40', align: 'center' });
  testoB8(testoFinaleB8(c.sotto, f.cx), W / 2, S.y + 45, { size: 9.5, stile: 'italic', color: '#c9a679', align: 'center' });
  c.opzioni.forEach((op, i) => {
    const r = rettOpzioneB8(i);
    const att = i === f.sel;
    ctx.fillStyle = att ? '#7a1c12' : '#241811';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = att ? '#f9cb40' : '#5c3a1e';
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    testoB8(`${i + 1}. ${testoFinaleB8(op.etichetta, f.cx)}`, r.x + 14, r.y + 21, { size: 12.5, stile: 'bold', color: att ? '#ffffff' : '#c9a679' });
    testoB8(testoFinaleB8(op.nota, f.cx), r.x + 14, r.y + 38, { size: 9.5, stile: 'italic', color: att ? '#f3dfc1' : '#8a7a5c' });
  });
  testoB8(f.sceltaFissa ? TESTI_B8.sceltaFatta : TESTI_B8.sceltaAiuto, S.x + S.w - 14, S.y + S.h - 9, { size: 7.5, color: '#f9cb40', align: 'right', ombra: false });
  ctx.restore();
}

// ===========================================================================
// 13. DISEGNO: sagome (teatro d'ombre: nero pieno, pochi accenti)
// ===========================================================================
const NERO_B8 = '#0a0604';

function ombraTerraB8(x, y, rx) {
  ctx.fillStyle = 'rgba(4, 2, 1, 0.5)';
  ctx.beginPath(); ctx.ellipse(x, y + 2, rx, rx * 0.28, 0, 0, TAU); ctx.fill();
}

/** Quanto è «fresco» l'ultimo colpo del martello (1 sul colpo, poi cala a 0 in 12 tick). */
function colpoRitmoB8() {
  const R = SEGRETO_B8.ritmo;
  const fasi = tick % R.cicloTick;
  let c = 0;
  for (const bt of R.battiti) { const d = fasi - bt; if (d >= 0 && d < 12) c = Math.max(c, 1 - d / 12); }
  return c;
}

const daQuandoB8 = (f, chiave) => Math.max(0, f.tScena - ((f.quando && f.quando[chiave]) || 0));

/** Un cittadino, una guardia: figura in piedi. o: braccio 0/1/2, gonna, cappello, guardia, filo, volto. */
function genteB8(x, y, o = {}) {
  const osc = o.braccio ? Math.round(Math.sin(tick * 0.09 + (o.fase || 0) * 1.7) * 1.5) : 0;
  ombraTerraB8(x, y, 12);
  if (o.filo) {
    ctx.strokeStyle = 'rgba(249, 203, 64, 0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 0.5, y - 52); ctx.lineTo(x + 0.5, 0); ctx.stroke();
  }
  ctx.save();
  ctx.translate(x, y + osc);
  ctx.fillStyle = NERO_B8;
  if (o.gonna) { ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.lineTo(5, -24); ctx.lineTo(-5, -24); ctx.closePath(); ctx.fill(); }
  else { ctx.fillRect(-7, -22, 6, 22); ctx.fillRect(1, -22, 6, 22); }
  ctx.fillRect(-8, -41, 16, 21);
  ctx.beginPath(); ctx.arc(0, -47, 6.5, 0, TAU); ctx.fill();
  if (o.cappello) { ctx.fillRect(-9, -54, 18, 3); ctx.fillRect(-5, -59, 10, 6); }
  if (o.guardia) {
    ctx.fillRect(-6, -62, 12, 10);
    ctx.fillRect(11, -66, 2, 52);
    ctx.fillStyle = '#f9cb40'; ctx.fillRect(-1, -60, 2, 3);
    ctx.fillStyle = '#8f160c'; ctx.fillRect(-8, -39, 16, 3);
    ctx.fillStyle = NERO_B8;
  }
  if (o.braccio >= 1) { ctx.save(); ctx.translate(7, -39); ctx.rotate(-0.45); ctx.fillRect(0, -18, 4, 18); ctx.fillRect(-1, -22, 6, 5); ctx.restore(); }
  if (o.braccio >= 2) { ctx.save(); ctx.translate(-7, -39); ctx.rotate(0.45); ctx.fillRect(-4, -18, 4, 18); ctx.fillRect(-5, -22, 6, 5); ctx.restore(); }
  if (o.volto) { ctx.fillStyle = '#c9a679'; ctx.fillRect(-3, -50, 6, 5); }
  ctx.restore();
}

/** Tonino (berretto, grembiule bianco), come nell'hub. lancio: scaglia qualcosa. */
function toninoB8(x, y, lancio, s = 1.45) {
  ombraTerraB8(x, y, 15);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = NERO_B8;
  ctx.fillRect(-9, -30, 18, 28); ctx.fillRect(-6, -2, 4, 3); ctx.fillRect(2, -2, 4, 3);
  ctx.fillRect(-7, -42, 14, 13); ctx.fillRect(-9, -45, 18, 5);
  ctx.fillStyle = '#f3dfc1'; ctx.fillRect(-6, -20, 12, 16);
  ctx.fillStyle = '#c9a679'; ctx.fillRect(-5, -39, 10, 8);
  ctx.fillStyle = NERO_B8; ctx.fillRect(-3, -37, 2, 2); ctx.fillRect(2, -37, 2, 2); ctx.fillRect(-3, -33, 6, 1);
  ctx.fillStyle = '#9c4c12'; ctx.fillRect(-8, -44, 16, 3);
  if (lancio) {
    const p = (tick % 54) / 54;
    ctx.fillStyle = NERO_B8; ctx.fillRect(8, -46, 4, 18);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(14 + p * 70), Math.round(-50 - Math.sin(p * Math.PI) * 16), 5, 4);
  } else { ctx.fillStyle = NERO_B8; ctx.fillRect(9, -26, 4, 12); }
  ctx.restore();
}

/** La Signora: in ginocchio, in piedi o a terra. Maschera chiara e giglio d'oro come accenti. */
function signoraB8(x, y, posa, s = 1) {
  ombraTerraB8(x, y, 22 * s);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (posa === 'caduta') {
    ctx.fillStyle = NERO_B8;
    ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(20, 0); ctx.lineTo(14, -14); ctx.lineTo(-30, -9); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(26, -8, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3b0d2a'; ctx.fillRect(-28, -7, 34, 4);
    ctx.fillStyle = '#f3dfc1'; ctx.fillRect(24, -12, 6, 7);
    ctx.fillStyle = '#f9cb40'; ctx.fillRect(4, -9, 3, 3);
  } else {
    const inPiedi = posa === 'piedi';
    const h = inPiedi ? 62 : 32;
    const china = inPiedi ? 0 : -8;
    const larg = inPiedi ? 24 : 34;
    ctx.fillStyle = NERO_B8;
    ctx.beginPath(); ctx.moveTo(-larg, 0); ctx.lineTo(larg, 0); ctx.lineTo(9, -h * 0.62); ctx.lineTo(-9, -h * 0.62); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3b0d2a';
    ctx.beginPath(); ctx.moveTo(-larg + 7, -2); ctx.lineTo(larg - 7, -2); ctx.lineTo(6, -h * 0.56); ctx.lineTo(-6, -h * 0.56); ctx.closePath(); ctx.fill();
    ctx.fillStyle = NERO_B8;
    ctx.fillRect(-8 + china * 0.5, -h * 0.92, 16, h * 0.34);
    if (inPiedi) { ctx.fillRect(-15, -h * 0.86, 5, h * 0.36); ctx.fillRect(10, -h * 0.86, 5, h * 0.36); }
    else { ctx.fillRect(-21, -h * 0.84, 5, h * 0.84); ctx.fillRect(-24, -3, 9, 3); ctx.fillRect(6, -h * 0.84, 5, h * 0.4); } // una mano a terra
    ctx.beginPath(); ctx.arc(china, -h - 3, 8, 0, TAU); ctx.fill();
    ctx.fillRect(china - 9, -h - 14, 18, 7); ctx.fillRect(china - 4, -h - 19, 8, 6);
    ctx.fillStyle = '#f3dfc1'; ctx.fillRect(china - 6, -h - 6, 9, 7);
    ctx.fillStyle = NERO_B8; ctx.fillRect(china - 4, -h - 4, 2, 2); ctx.fillRect(china, -h - 4, 2, 2);
    ctx.fillStyle = '#f9cb40'; ctx.fillRect(-1, -h * 0.82, 3, 4); ctx.fillRect(-2, -h * 0.82 + 1, 5, 1);
  }
  ctx.restore();
}

/** Ferruccio com'è nel gioco (disegno pittorico); piedi a y. */
function ferruccioB8(x, y, scala, flip) {
  try {
    disegnaFerruccioPittorico(ctx, x, y - 10 * scala, { scale: scala, flipX: Boolean(flip), tick, moving: false, haSpada: true,
      swordAnimTick: -1, swordAngle: 0, charId: 'ferruccio', charInfo: PERSONAGGI_GIOCABILI.ferruccio, sinergie: {} });
  } catch (_) { ragazzoB8(x, y, {}, scala); }
}

/** Ferruccio a viso scoperto. o: maschera (in mano), forbici, calde. */
function ragazzoB8(x, y, o = {}, s = 1.2) {
  ombraTerraB8(x, y, 13 * s);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = NERO_B8;
  ctx.fillRect(-5, -20, 4, 20); ctx.fillRect(1, -20, 4, 20);
  ctx.beginPath(); ctx.moveTo(-13, -18); ctx.lineTo(13, -18); ctx.lineTo(7, -51); ctx.lineTo(-7, -51); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e9dcc3';
  ctx.beginPath(); ctx.moveTo(-10, -20); ctx.lineTo(10, -20); ctx.lineTo(5, -48); ctx.lineTo(-5, -48); ctx.closePath(); ctx.fill();
  ctx.fillStyle = NERO_B8;
  ctx.beginPath(); ctx.arc(0, -58, 7.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c9a679'; ctx.fillRect(-4, -61, 8, 8);
  ctx.fillStyle = NERO_B8; ctx.fillRect(-3, -59, 2, 2); ctx.fillRect(1, -59, 2, 2); ctx.fillRect(-5, -66, 10, 4);
  if (o.maschera) {
    ctx.fillStyle = NERO_B8; ctx.fillRect(12, -41, 10, 12); ctx.fillRect(15, -47, 4, 6);
    ctx.fillStyle = '#f3dfc1'; ctx.fillRect(14, -37, 2, 2); ctx.fillRect(18, -37, 2, 2);
  }
  if (o.forbici) {
    ctx.fillStyle = o.calde ? '#ea8626' : '#cbd5e1';
    ctx.fillRect(-19, -46, 2, 13); ctx.fillRect(-15, -46, 2, 13);
    ctx.fillStyle = '#f9cb40'; ctx.fillRect(-19, -33, 6, 3);
  }
  ctx.restore();
}

/** Gaetano all'incudine, di spalle. batte: il martello segue il ritmo. girato: un filo di luce sul volto. */
function fabbroB8(x, y, batte, girato) {
  ombraTerraB8(x, y, 18);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = NERO_B8;
  ctx.fillRect(-10, -28, 8, 28); ctx.fillRect(2, -28, 8, 28);
  ctx.beginPath(); ctx.moveTo(-17, -66); ctx.lineTo(17, -66); ctx.lineTo(12, -26); ctx.lineTo(-12, -26); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -75, 8.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3d2614';
  ctx.fillRect(-10, -62, 3, 34); ctx.fillRect(7, -62, 3, 34); ctx.fillRect(-10, -44, 20, 3);
  if (girato) { ctx.fillStyle = '#c9a679'; ctx.fillRect(4, -79, 4, 7); }
  const ang = batte ? -1.25 + colpoRitmoB8() * 1.35 : 0.5;
  ctx.translate(15, -60);
  ctx.rotate(ang);
  ctx.fillStyle = NERO_B8; ctx.fillRect(0, -3, 24, 6); ctx.fillRect(22, -14, 3, 18);
  ctx.fillStyle = '#64748b'; ctx.fillRect(17, -19, 13, 8);
  ctx.restore();
}

function incudineB8(x, y) {
  ctx.fillStyle = NERO_B8;
  ctx.fillRect(x - 13, y - 8, 26, 8); ctx.fillRect(x - 6, y - 19, 12, 11); ctx.fillRect(x - 21, y - 28, 42, 10);
  ctx.beginPath(); ctx.moveTo(x + 21, y - 28); ctx.lineTo(x + 37, y - 23); ctx.lineTo(x + 21, y - 18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#475569'; ctx.fillRect(x - 20, y - 27, 40, 2);
}

/** Una Mano guantata di bianco del Grande Burattinaio (dita in giù). lato +1/-1, aperta = dita distese. */
function manoGuantataB8(x, y, s, lato, aperta) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * lato, s);
  ctx.fillStyle = NERO_B8; ctx.fillRect(-22, -44, 44, 26);
  ctx.fillStyle = '#e9dcc3'; ctx.fillRect(-19, -42, 38, 21);
  ctx.fillStyle = '#f9cb40'; ctx.fillRect(-3, -34, 6, 6);
  ctx.fillStyle = NERO_B8; ctx.fillRect(-27, -20, 54, 40);
  ctx.fillStyle = '#f3ead8'; ctx.fillRect(-24, -18, 48, 36);
  for (let i = 0; i < 4; i++) {
    const dx = -24 + i * 12.5;
    const len = aperta ? 36 - Math.abs(i - 1.5) * 4 : 20 + (i % 2) * 5;
    ctx.fillStyle = NERO_B8; ctx.fillRect(dx - 1, 14, 12.5, len + 4);
    ctx.fillStyle = '#f3ead8'; ctx.fillRect(dx + 1, 14, 8.5, len + 1);
  }
  ctx.fillStyle = NERO_B8; ctx.fillRect(25, -10, 14, aperta ? 30 : 24);
  ctx.fillStyle = '#f3ead8'; ctx.fillRect(27, -8, 10, aperta ? 26 : 20);
  ctx.fillStyle = 'rgba(10, 6, 4, 0.3)';
  for (let i = 0; i < 3; i++) ctx.fillRect(-12 + i * 12, -14, 1, 24);
  ctx.restore();
}

/** Le forbici colossali del Grande Burattinaio. apertura in radianti. */
function forbiciGigantiB8(x, y, s, apertura, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot || 0);
  ctx.scale(s, s);
  for (const l of [-1, 1]) {
    ctx.save();
    ctx.rotate((l * apertura) / 2);
    ctx.fillStyle = NERO_B8;
    ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(6, -4); ctx.lineTo(1.5, 100); ctx.lineTo(-1.5, 100); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.moveTo(l * 1, 4); ctx.lineTo(l * 4.5, 4); ctx.lineTo(0, 94); ctx.closePath(); ctx.fill();
    ctx.fillStyle = NERO_B8; ctx.fillRect(-3, -18, 6, 18);
    ctx.strokeStyle = NERO_B8; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-l * 7, -30, 13, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-l * 7, -30, 13, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#f9cb40'; ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, TAU); ctx.fill();
  ctx.restore();
}

function torciaB8(x, y) {
  const fl = 0.75 + 0.25 * Math.sin(tick * 0.31 + x);
  const g = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, 74);
  g.addColorStop(0, `rgba(249, 203, 64, ${(0.42 * fl).toFixed(3)})`);
  g.addColorStop(1, 'rgba(249, 203, 64, 0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 6, 74, 0, TAU); ctx.fill();
  ctx.fillStyle = NERO_B8; ctx.fillRect(x - 2, y, 4, 26); ctx.fillRect(x - 6, y - 2, 12, 4);
  ctx.fillStyle = '#ea8626'; ctx.fillRect(x - 3, y - 10 - Math.round(fl * 3), 6, 9 + Math.round(fl * 3));
  ctx.fillStyle = '#f9cb40'; ctx.fillRect(x - 1, y - 8, 2, 6);
}

/** Una maschera di Pulcinella appesa a un gancio, ricucita con un punto d'oro. */
function mascheraB8(x, y) {
  ctx.fillStyle = 'rgba(201, 166, 121, 0.5)'; ctx.fillRect(x, y - 11, 1, 6);
  ctx.fillStyle = '#4a2c14'; ctx.fillRect(x - 5, y - 5, 11, 13); ctx.fillRect(x - 2, y - 9, 5, 4);
  ctx.fillStyle = '#120a06'; ctx.fillRect(x - 4, y - 4, 9, 11);
  ctx.fillStyle = '#f3dfc1'; ctx.fillRect(x - 3, y - 1, 2, 2); ctx.fillRect(x + 2, y - 1, 2, 2);
  ctx.fillStyle = '#f9cb40'; ctx.fillRect(x, y - 4, 1, 11);
}

const TETTI_B8 = Object.freeze([[46, 34], [96, 52], [150, 30], [204, 58], [262, 40], [318, 66], [384, 44], [436, 56], [492, 32], [540, 48]]);
/** I tetti di Caserta in sagoma, con base a yBase. finestre = colore delle finestre accese (o null). */
function tettiB8(yBase, colore, finestre) {
  for (let i = 0; i < TETTI_B8.length; i++) {
    const [x, h] = TETTI_B8[i];
    const x2 = i + 1 < TETTI_B8.length ? TETTI_B8[i + 1][0] : 594;
    ctx.fillStyle = colore;
    ctx.fillRect(x, yBase - h, x2 - x, h);
    ctx.fillRect(x + 8, yBase - h - 16, 5, 9);
    ctx.beginPath(); ctx.moveTo(x - 2, yBase - h); ctx.lineTo((x + x2) / 2, yBase - h - 10); ctx.lineTo(x2 + 2, yBase - h); ctx.closePath(); ctx.fill();
    if (finestre) {
      ctx.fillStyle = finestre;
      for (let wx = x + 9; wx < x2 - 8; wx += 16) ctx.fillRect(wx, yBase - h + 10, 5, 7);
    }
  }
}

// ===========================================================================
// 14. DISEGNO: fondali delle scene dei finali
// ===========================================================================
function fondalePalcoB8(f, sc, st) {
  const g = ctx.createLinearGradient(0, 0, 0, 262);
  g.addColorStop(0, '#080504'); g.addColorStop(1, '#2a180c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 262);
  for (let i = 0; i < 3; i++) { // arcate della Reggia
    const ax = 150 + i * 170;
    ctx.fillStyle = '#3d2a17'; ctx.fillRect(ax - 46, 76, 92, 124);
    ctx.beginPath(); ctx.arc(ax, 76, 46, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#0d0805'; ctx.fillRect(ax - 36, 84, 72, 116);
    ctx.beginPath(); ctx.arc(ax, 84, 36, Math.PI, 0); ctx.fill();
  }
  for (let r = 0; r < 4; r++) for (let c = -1; c < 16; c++) { // scacchiera di marmo
    ctx.fillStyle = (r + c) % 2 ? '#1c1713' : '#6f6655';
    ctx.fillRect(40 + c * 38 + r * 5, 200 + r * 16, 38, 16);
  }
  ctx.fillStyle = 'rgba(8, 5, 3, 0.45)'; ctx.fillRect(0, 200, W, 62);
  torciaB8(100, 122); torciaB8(540, 122);
  try { // le Mani, ferme
    disegnaManoMarionettaPittorica(214, 62, 1, 0.95, 0, false);
    disegnaManoMarionettaPittorica(426, 62, -1, 0.95, 0, false);
  } catch (_) { manoGuantataB8(214, 62, 0.8, 1, true); manoGuantataB8(426, 62, 0.8, -1, true); }
  if (st.fili) { // il Velo ricucito: i fili tornano a tendersi
    const k = Math.min(1, daQuandoB8(f, 'fili') / 90);
    ctx.save();
    ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 1; ctx.globalAlpha = 0.75;
    for (let i = 0; i < 11; i++) {
      const tx = 60 + i * 52;
      ctx.beginPath(); ctx.moveTo(392, 176); ctx.lineTo(392 + (tx - 392) * k, 176 - 176 * k); ctx.stroke();
    }
    ctx.restore();
  }
  signoraB8(392, 236, st.signora || 'ginocchio', 1.15);
  ferruccioB8(246, 236, 1.3, false);
}

function fondaleCieloB8() {
  const g = ctx.createLinearGradient(0, 0, 0, 262);
  g.addColorStop(0, '#1d4ed8'); g.addColorStop(0.62, '#60a5fa'); g.addColorStop(1, '#fde68a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 262);
  const s = ctx.createRadialGradient(470, 196, 6, 470, 196, 150);
  s.addColorStop(0, 'rgba(255, 251, 235, 0.95)'); s.addColorStop(1, 'rgba(255, 251, 235, 0)');
  ctx.fillStyle = s; ctx.beginPath(); ctx.arc(470, 196, 150, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0f1b33'; // la Reggia in sagoma
  ctx.fillRect(150, 158, 340, 60);
  ctx.beginPath(); ctx.moveTo(270, 158); ctx.lineTo(320, 132); ctx.lineTo(370, 158); ctx.closePath(); ctx.fill();
  ctx.fillRect(150, 150, 24, 10); ctx.fillRect(466, 150, 24, 10);
  ctx.fillStyle = 'rgba(253, 230, 138, 0.5)';
  for (let x = 162; x < 484; x += 14) ctx.fillRect(x, 172, 5, 9);
  tettiB8(262, '#0b1220', null);
  ctx.save(); // i fili del Velo, spezzati, che scendono
  ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const x = 70 + i * 56 + Math.sin(tick * 0.02 + i) * 6;
    const y = (tick * 0.55 + i * 37) % 210;
    ctx.globalAlpha = Math.max(0, 0.8 - y / 280);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 7, y + 12, x - 2, y + 26); ctx.stroke();
  }
  ctx.restore();
}

function fondalePiazzaGiornoB8(f, sc, st) {
  const g = ctx.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, '#2563eb'); g.addColorStop(1, '#bfdbfe');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 200);
  tettiB8(200, '#0f1b33', null);
  ctx.fillStyle = '#6b4a26'; ctx.fillRect(0, 200, W, 62);
  ctx.fillStyle = 'rgba(15, 27, 51, 0.35)';
  for (let x = 46; x < 594; x += 34) ctx.fillRect(x, 200, 1, 62);
  for (let y = 214; y < 262; y += 16) ctx.fillRect(0, y, W, 1);
  const folla = [[104, 238, 1], [146, 244, 2], [190, 236, 0], [232, 246, 2], [282, 238, 1], [326, 244, 2]];
  folla.forEach(([x, y, br], i) => genteB8(x, y, { braccio: br, cappello: i % 3 === 0, gonna: i % 2 === 1, fase: i }));
  genteB8(380, 244, { guardia: true, braccio: 1, fase: 7 });
  if (st.tonino) toninoB8(258, 252, Boolean(st.lancio));
  const fuga = st.fuga ? Math.min(90, daQuandoB8(f, 'fuga') * 1.4) : 0;
  ferruccioB8(492 + fuga, 246, 1.2, false);
}

function fondalePiazzaGrigiaB8(f, sc, st) {
  const g = ctx.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, '#334155'); g.addColorStop(1, '#94a3b8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 200);
  ctx.fillStyle = 'rgba(203, 213, 225, 0.16)';
  for (let i = 0; i < 4; i++) ctx.fillRect(46 + ((tick * 0.2 + i * 150) % 560) - 60, 60 + i * 30, 180, 10);
  tettiB8(200, '#1e293b', '#fde68a');
  ctx.save(); // i fili d'oro, uno per casa
  ctx.strokeStyle = 'rgba(249, 203, 64, 0.8)'; ctx.lineWidth = 1;
  for (let i = 0; i < TETTI_B8.length; i++) {
    const x = TETTI_B8[i][0] + 24;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 200 - TETTI_B8[i][1] - 8); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#475569'; ctx.fillRect(0, 200, W, 62);
  ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
  for (let x = 46; x < 594; x += 34) ctx.fillRect(x, 200, 1, 62);
  ctx.fillStyle = NERO_B8; ctx.fillRect(128, 224, 108, 26); // il banchetto
  ctx.fillStyle = '#5c3a1e'; ctx.fillRect(130, 226, 104, 22);
  ctx.fillStyle = '#7a4a22'; ctx.fillRect(130, 226, 104, 6);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffffff'; ctx.fillRect(140 + i * 14, 221, 8, 5); }
  if (st.piatti) for (const px of [196, 214]) { ctx.fillStyle = NERO_B8; ctx.fillRect(px - 6, 221, 12, 5); ctx.fillStyle = '#f3dfc1'; ctx.fillRect(px - 5, 222, 10, 3); }
  ctx.fillStyle = NERO_B8; ctx.fillRect(244, 216, 14, 3); ctx.fillRect(244, 216, 2, 34); ctx.fillRect(256, 216, 2, 34); ctx.fillRect(244, 232, 14, 3); // la sedia vuota
  toninoB8(182, 222, false, 1.3);
  genteB8(330, 246, { gonna: true, filo: true });
  genteB8(548, 240, { cappello: true, filo: true });
  ferruccioB8(440, 248, 1.2, true);
}

function fondalePlateaB8(f, sc, st) {
  ctx.fillStyle = '#050302'; ctx.fillRect(0, 0, W, 262);
  const px = 120, py = 28, pw = 400, ph = 188;
  const g = ctx.createLinearGradient(0, py, 0, py + ph);
  g.addColorStop(0, '#1f130a'); g.addColorStop(1, '#4a2c14');
  ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = '#f3dfc1'; ctx.beginPath(); ctx.arc(px + 128, py + 42, 13, 0, TAU); ctx.fill(); // la luna dipinta
  ctx.fillStyle = '#120a06'; // tetti dipinti
  for (let i = 0; i < 8; i++) ctx.fillRect(px + i * 50, py + ph - 60 - ((i * 37) % 26), 50, 60);
  const dx = px + 296, dy = py + 92; // la porta dipinta sul fondale
  if (st.porta) {
    const a = 0.35 + 0.25 * Math.sin(tick * 0.12);
    ctx.fillStyle = `rgba(249, 203, 64, ${a.toFixed(3)})`; ctx.fillRect(dx - 19, dy - 22, 38, 70);
  }
  const bottegaAperta = st.sipario === 'cala'; // nell'ultima scena la bottega è aperta: niente spranga, niente sigilli
  ctx.fillStyle = NERO_B8; ctx.fillRect(dx - 13, dy, 26, 42); ctx.beginPath(); ctx.arc(dx, dy, 13, Math.PI, 0); ctx.fill();
  ctx.fillStyle = bottegaAperta ? '#9c4c12' : '#5c3a1e'; ctx.fillRect(dx - 10, dy + 2, 20, 38); ctx.beginPath(); ctx.arc(dx, dy + 2, 10, Math.PI, 0); ctx.fill();
  if (!bottegaAperta) {
    ctx.fillStyle = '#9ca3af'; ctx.fillRect(dx - 12, dy + 16, 24, 3);
    ctx.fillStyle = '#e53222'; for (let i = 0; i < 3; i++) ctx.fillRect(dx - 8 + i * 7, dy + 15, 3, 4);
  }
  ctx.fillStyle = '#f9cb40'; ctx.fillRect(dx - 5, dy - 20, 10, 3); ctx.fillRect(dx - 2, dy - 17, 4, 3);
  ctx.fillStyle = '#3d2614'; ctx.fillRect(px, py + ph - 16, pw, 16); // le assi
  ctx.fillStyle = '#2a180c'; for (let x = px + 20; x < px + pw; x += 40) ctx.fillRect(x, py + ph - 16, 1, 16);
  const sx = px + 170, sy = py + ph - 10;
  if (st.signora !== 'nessuna') {
    const inPiedi = st.signora === 'piedi';
    if (st.fili) {
      ctx.save();
      ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 1; ctx.globalAlpha = 0.9;
      const yPolso = inPiedi ? sy - 30 : sy - 8;
      for (const l of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx + l * (inPiedi ? 12 : 22), yPolso); ctx.lineTo(sx + l * 44 + Math.sin(tick * 0.04 + l) * 1.5, py + 34); ctx.stroke(); }
      ctx.restore();
    }
    signoraB8(sx, sy, inPiedi ? 'piedi' : 'caduta', 0.85);
  }
  if (st.mani) { manoGuantataB8(sx - 46, py + 20, 0.5, 1, false); manoGuantataB8(sx + 46, py + 20, 0.5, -1, false); }
  const piega = (x, y, w, h) => { // un telo di velluto con le pieghe
    ctx.fillStyle = '#5c110b'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#7a1c12'; for (let k = x + 4; k < x + w - 3; k += 12) ctx.fillRect(k, y, 4, h);
    ctx.fillStyle = '#3a0907'; for (let k = x + 10; k < x + w - 3; k += 12) ctx.fillRect(k, y, 2, h);
  };
  if (st.sipario === 'meta') { piega(px, py, 54, ph); piega(px + pw - 54, py, 54, ph); }
  if (st.sipario === 'cala') {
    const hh = Math.min(ph, 20 + f.tScena * 0.9);
    piega(px, py, pw, hh);
    ctx.fillStyle = '#f9cb40'; for (let k = px + 2; k < px + pw; k += 7) ctx.fillRect(k, py + hh - 2, 3, 5);
  }
  ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 2; ctx.strokeRect(px - 1, py - 1, pw + 2, ph + 2);
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 1; ctx.strokeRect(px - 5.5, py - 5.5, pw + 11, ph + 11);
  const dtAlza = st.alzati ? daQuandoB8(f, 'alzati') : 0;
  for (let i = 0; i < 13; i++) { // la platea: il pubblico di ombre
    const hx = 66 + i * 42 + (i % 2) * 6;
    const su = st.alzati ? Math.min(18, Math.max(0, dtAlza * 0.45 - i * 3)) : 0;
    const hy = 250 - (i % 3) * 4 - su;
    ctx.fillStyle = '#17100b';
    ctx.beginPath(); ctx.arc(hx, hy, 9, 0, TAU); ctx.fill();
    ctx.fillRect(hx - 13, hy + 7, 26, 34 + su);
    ctx.strokeStyle = 'rgba(201, 166, 121, 0.5)'; ctx.lineWidth = 1; // la luce della ribalta sul profilo delle teste
    ctx.beginPath(); ctx.arc(hx, hy, 9, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.fillStyle = 'rgba(201, 166, 121, 0.3)'; ctx.fillRect(hx - 13, hy + 7, 26, 1);
    if (su > 10) { ctx.fillStyle = 'rgba(201, 166, 121, 0.6)'; ctx.fillRect(hx + 2, hy - 4, 5, 6); }
  }
}

function fondaleFucinaB8(f, sc, st) {
  const g = ctx.createLinearGradient(0, 0, 0, 262);
  g.addColorStop(0, '#0d0805'); g.addColorStop(1, '#2a180c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 262);
  ctx.fillStyle = 'rgba(92, 58, 30, 0.16)';
  for (let y = 30; y < 236; y += 18) for (let x = 46 + ((y / 18) % 2) * 20; x < 594; x += 40) ctx.fillRect(x, y, 38, 1);
  const brace = st.brace ? Math.min(1, 0.45 + f.tScena / 140) : 0;
  const fl = 0.8 + 0.2 * Math.sin(tick * 0.27);
  ctx.fillStyle = NERO_B8; ctx.fillRect(66, 124, 104, 112); ctx.beginPath(); ctx.arc(118, 124, 52, Math.PI, 0); ctx.fill(); // la forgia
  ctx.fillStyle = '#1a0f08'; ctx.fillRect(78, 136, 80, 100); ctx.beginPath(); ctx.arc(118, 136, 40, Math.PI, 0); ctx.fill();
  if (brace > 0) {
    const gl = ctx.createRadialGradient(118, 212, 4, 118, 212, 170);
    gl.addColorStop(0, `rgba(234, 134, 38, ${(0.55 * brace * fl).toFixed(3)})`); gl.addColorStop(1, 'rgba(234, 134, 38, 0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(118, 212, 170, 0, TAU); ctx.fill();
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#f9cb40' : '#ea8626';
      ctx.globalAlpha = brace * (0.6 + 0.4 * Math.sin(tick * 0.2 + i));
      ctx.fillRect(86 + i * 8, 222 - (i % 3) * 4, 6, 8 + (i % 3) * 4);
    }
    ctx.globalAlpha = 1;
  }
  const ferri = ['b8Tenaglie', 'b8Punzone', 'b8Lima']; // la rastrelliera dei ferri
  ferri.forEach((sp, i) => { ctx.fillStyle = '#475569'; ctx.fillRect(309 + i * 34, 82, 2, 3); drawPixelSprite(SPRITE_OGGETTI[sp], 310 + i * 34, 100, 2); });
  ctx.fillStyle = '#1a0f08'; ctx.fillRect(0, 236, W, 26);
  ctx.fillStyle = '#3d2614'; ctx.fillRect(0, 236, W, 1);
  ctx.fillStyle = NERO_B8; ctx.fillRect(516, 0, 4, 238); ctx.fillRect(548, 0, 4, 238); // la scala a pioli
  for (let y = 222; y > 0; y -= 18) ctx.fillRect(516, y, 36, 3);
  const buio = ctx.createLinearGradient(0, 0, 0, 120);
  buio.addColorStop(0, 'rgba(0, 0, 0, 0.95)'); buio.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = buio; ctx.fillRect(480, 0, 114, 120);
  ctx.save();
  ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 1; ctx.globalAlpha = st.scala ? 0.5 + 0.3 * Math.sin(tick * 0.1) : 0.28;
  for (const fx of [526, 534, 542]) { ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx + Math.sin(tick * 0.03 + fx) * 1.5, 150); ctx.stroke(); }
  ctx.restore();
  incudineB8(276, 236);
  if (st.tempra) { // le forbici di Gaetano, arroventate
    ctx.fillStyle = `rgba(249, 203, 64, ${(0.5 + 0.3 * fl).toFixed(3)})`; ctx.fillRect(266, 198, 22, 12);
    ctx.fillStyle = '#ea8626'; ctx.fillRect(268, 203, 16, 2); ctx.fillRect(268, 206, 16, 2);
    ctx.fillStyle = '#f9cb40'; ctx.fillRect(284, 202, 5, 7);
  }
  fabbroB8(232, 236, Boolean(st.batte), Boolean(st.volto));
  if (st.volto) ragazzoB8(410, 236, { maschera: !st.tempra, forbici: Boolean(st.scala), calde: true }, 1.3);
  else ferruccioB8(410, 236, 1.3, true);
}

function fondaleRibaltaB8(f) {
  ctx.fillStyle = '#070504'; ctx.fillRect(0, 0, W, 262);
  const gx = ctx.createRadialGradient(390, 262, 10, 390, 262, 190);
  gx.addColorStop(0, 'rgba(234, 134, 38, 0.5)'); gx.addColorStop(1, 'rgba(234, 134, 38, 0)');
  ctx.fillStyle = gx; ctx.beginPath(); ctx.arc(390, 262, 190, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5c110b'; ctx.fillRect(310, 232, 160, 30); // il Teatro, piccolo, là sotto
  ctx.fillStyle = '#f9cb40'; ctx.fillRect(310, 232, 160, 1);
  ctx.fillStyle = '#3d2614'; ctx.fillRect(324, 240, 132, 22);
  ctx.save();
  ctx.strokeStyle = 'rgba(249, 203, 64, 0.6)'; ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const x0 = 332 + i * 14.5;
    ctx.fillStyle = NERO_B8; ctx.fillRect(x0 - 1, 246, 3, 8);
    ctx.beginPath(); ctx.moveTo(x0, 246);
    ctx.quadraticCurveTo(x0 + (390 - x0) * 0.3 + Math.sin(tick * 0.02 + i) * 3, 120, 390 + (i - 4) * 2, 0); ctx.stroke();
  }
  ctx.restore();
  for (const bx of [86, 256, 480, 566]) { ctx.fillStyle = '#1a0f08'; ctx.fillRect(bx, 0, 8, 214); } // la graticcia
  for (const by of [56, 126]) { ctx.fillStyle = '#24160b'; ctx.fillRect(0, by, W, 9); ctx.fillStyle = '#4a2c14'; ctx.fillRect(0, by, W, 2); }
  const n = Math.min(34, Math.max(1, f.cx.n || 1)); // le maschere ai ganci: una per notte
  for (let i = 0; i < n; i++) {
    const riga = i < 17 ? 0 : 1;
    const mx = 62 + (i % 17) * 31 + riga * 10;
    mascheraB8(mx, (riga ? 126 : 56) + 20 + Math.round(Math.sin(tick * 0.03 + i) * 1.2));
  }
  ctx.fillStyle = '#2a180c'; ctx.fillRect(46, 214, 230, 7);
  ctx.fillStyle = '#4a2c14'; ctx.fillRect(46, 214, 230, 1);
  ragazzoB8(160, 214, { forbici: true, calde: true }, 1.2);
}

function fondaleManiB8(f, sc, st) {
  ctx.fillStyle = '#030201'; ctx.fillRect(0, 0, W, 262);
  const gl = ctx.createRadialGradient(320, 0, 10, 320, 0, 260);
  gl.addColorStop(0, 'rgba(243, 223, 193, 0.16)'); gl.addColorStop(1, 'rgba(243, 223, 193, 0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(320, 0, 260, 0, TAU); ctx.fill();
  const tagliato = Boolean(st.tagliato);
  const dt = tagliato ? daQuandoB8(f, 'tagliato') : 0;
  const resp = tagliato ? 0 : Math.sin(tick * 0.03) * 2;
  manoGuantataB8(226, 86 + resp, 1.45, 1, tagliato);
  manoGuantataB8(414, 86 - resp, 1.45, -1, tagliato);
  ctx.save(); // il bilancino
  ctx.translate(320, 158 + (tagliato ? Math.min(70, dt * 1.1) : 0));
  ctx.rotate(tagliato ? Math.min(0.6, dt * 0.012) : Math.sin(tick * 0.02) * 0.03);
  ctx.fillStyle = NERO_B8; ctx.fillRect(-116, -5, 232, 10); ctx.fillRect(-5, -34, 10, 68);
  ctx.fillStyle = '#5c3a1e'; ctx.fillRect(-114, -4, 228, 7); ctx.fillRect(-4, -32, 8, 64);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = '#f9cb40';
  if (!tagliato) { // i fili si torcono nel filo maestro
    ctx.lineWidth = 1; ctx.globalAlpha = 0.75;
    for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(320 + i * 21, 163); ctx.quadraticCurveTo(320 + i * 8, 196, 320, 216); ctx.stroke(); }
    ctx.globalAlpha = 0.35; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(320, 216); ctx.lineTo(320, 262); ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(320, 216); ctx.lineTo(320 + Math.sin(tick * 0.05) * 1.5, 262); ctx.stroke();
  } else { // la pioggia d'oro
    ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
    for (let i = 0; i < 28; i++) {
      const x = 60 + ((i * 53) % 520);
      const y = (dt * (1.5 + (i % 5) * 0.3) + i * 31) % 262;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(i + dt * 0.05) * 3, y + 16); ctx.stroke();
    }
  }
  ctx.restore();
  if (st.assalto) forbiciGigantiB8(196, 150, 1.25, 0.06 + Math.abs(Math.sin(tick * 0.21)) * 0.6, -0.5);
  else forbiciGigantiB8(528, 132 + (tagliato ? Math.min(90, dt * 1.6) : 0), 1.25, tagliato ? 1.0 : 0.38 + Math.sin(tick * 0.04) * 0.08, tagliato ? 0.6 : 0.18);
  ctx.fillStyle = '#24160b'; ctx.fillRect(46, 238, 230, 7);
  ctx.fillStyle = '#4a2c14'; ctx.fillRect(46, 238, 230, 1);
  ragazzoB8(st.assalto ? 112 : 150, 238, { forbici: true, calde: true }, 1.05);
}

function fondaleNeroB8(f, sc) {
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
  const a = Math.min(1, f.tScena / 45);
  const righe = aCapoB8(sc.frase || '', 470, fontB8(17, 'italic'));
  const y0 = H / 2 - (righe.length - 1) * 12;
  righe.forEach((r, i) => testoB8(r, W / 2, y0 + i * 24, { size: 17, stile: 'italic', color: '#f3dfc1', align: 'center', alpha: a }));
  ctx.fillStyle = `rgba(249, 203, 64, ${(a * 0.8).toFixed(3)})`;
  ctx.fillRect(W / 2 - 44, y0 + righe.length * 24 - 6, 88, 1);
  if (f.tScena >= CONFIG_B8.scena.minimoNeroTick && Math.floor(tick / 24) % 2 === 0) testoB8(`▶ ${TESTI_B8.avanti}`, W - 20, H - 14, { size: 7.5, color: '#8a5a2b', align: 'right', ombra: false });
}

const STILI_TITOLI_B8 = Object.freeze({
  frase: { size: 13.5, stile: 'italic', color: '#f3dfc1' },
  titolo: { size: 16, stile: 'bold', color: '#f9cb40' },
  sotto: { size: 9.5, stile: '', color: '#c9a679' },
  oro: { size: 11.5, stile: 'bold', color: '#f9cb40' },
  quadre: { size: 9.5, stile: 'italic', color: '#9ca3af' },
});

function fondaleTitoliB8(f, sc) {
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
  const R = CONFIG_B8.scena.rigaTitoliTick;
  const righe = sc.righe || [];
  const passo = Math.min(24, (H - 70) / Math.max(1, righe.length));
  const y0 = (H - passo * (righe.length - 1)) / 2;
  righe.forEach((r, i) => {
    if (!r.t) return;
    const a = (f.tScena - i * R) / 30;
    if (a <= 0) return;
    const st = STILI_TITOLI_B8[r.stile] || STILI_TITOLI_B8.sotto;
    testoB8(r.t, W / 2, y0 + i * passo, { ...st, align: 'center', alpha: a });
  });
  if (f.tScena >= righe.length * R && Math.floor(tick / 24) % 2 === 0) testoB8(`▶ ${TESTI_B8.avanti}`, W - 20, H - 14, { size: 7.5, color: '#8a5a2b', align: 'right', ombra: false });
}

const FONDALI_B8 = Object.freeze({
  palco: fondalePalcoB8, cielo: fondaleCieloB8, piazzaGiorno: fondalePiazzaGiornoB8, piazzaGrigia: fondalePiazzaGrigiaB8,
  platea: fondalePlateaB8, fucina: fondaleFucinaB8, ribalta: fondaleRibaltaB8, mani: fondaleManiB8,
  nero: fondaleNeroB8, titoli: fondaleTitoliB8,
});

/** Il boccascena di velluto intorno alle scene e il nero sotto la ribalta (dove sta il cartiglio). */
function boccascenaB8() {
  ctx.save();
  for (const lato of [0, 1]) {
    const x0 = lato ? W - 46 : 0;
    ctx.fillStyle = '#3a0907'; ctx.fillRect(x0, 0, 46, 262);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#5c110b' : '#7a1c12'; ctx.fillRect(x0 + 3 + i * 11, 0, 5, 262); }
    ctx.fillStyle = '#f9cb40'; ctx.fillRect(lato ? x0 : x0 + 45, 0, 1, 262);
  }
  ctx.fillStyle = '#5c110b'; ctx.fillRect(0, 0, W, 12);
  for (let x = 0; x < W; x += 32) { ctx.fillStyle = '#7a1c12'; ctx.beginPath(); ctx.arc(x + 16, 12, 16, 0, Math.PI); ctx.fill(); }
  ctx.fillStyle = '#f9cb40'; for (let x = 4; x < W; x += 8) ctx.fillRect(x, 11, 2, 3);
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 262, W, H - 262);
  ctx.fillStyle = '#f9cb40'; ctx.fillRect(0, 262, W, 1);
  ctx.restore();
}

/** Disegna la scena corrente del finale (chiamata dal gancio 'disegna' quando la fase è 'finale'). */
function disegnaFinaleB8() {
  const f = b8.fin;
  const sc = f && f.scene[f.i];
  ctx.save();
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
  if (!sc) { ctx.restore(); return; }
  const S = CONFIG_B8.scena;
  const intera = sc.fondale === 'nero' || sc.fondale === 'titoli';
  ctx.save();
  if (f.fx && f.fx.tipo === 'scossa' && (OPZIONI.scossa === undefined || OPZIONI.scossa > 0)) {
    const k = (1 - f.fx.t / 44) * 3 * (OPZIONI.scossa === undefined ? 1 : OPZIONI.scossa);
    ctx.translate(Math.sin(f.fx.t * 1.7) * k, Math.cos(f.fx.t * 2.3) * k);
  }
  (FONDALI_B8[sc.fondale] || fondaleNeroB8)(f, sc, f.st || {});
  ctx.restore();
  if (!intera) {
    boccascenaB8();
    if (f.fx && f.fx.tipo === 'colpo' && OPZIONI.lampi !== false) {
      ctx.fillStyle = `rgba(255, 243, 196, ${Math.max(0, 0.85 - f.fx.t / 22).toFixed(3)})`;
      ctx.fillRect(0, 0, W, 262);
    }
    if (f.inScelta) disegnaSceltaB8(f, sc);
    else if (sc.battute && sc.battute[f.j]) disegnaCartiglioB8(sc.battute[f.j], Math.floor(f.t * S.caratteriPerTick), {});
  }
  if (f.fade > 0) { ctx.fillStyle = `rgba(0, 0, 0, ${(f.fade / S.transizioneTick).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  if (f.rivisto) testoB8(TESTI_B8.salta, W - 12, H - 4, { size: 7, color: '#6b7280', align: 'right', ombra: false });
  ctx.restore();
}

// ===========================================================================
// 15. DISEGNO: hub (porta della bottega), stanze, didascalie, Diario
// ===========================================================================
/** Sopra la porta della bottega (chiamata da t4-hub-storia.js › disegnaPortaBottega): luce, sigilli, ferri. */
function disegnaPortaB8(p) {
  const s = statoB8();
  const x = p.x;
  const y = SEGRETO_B8.porta.y;
  const notte = getNumeroNotte();
  const k = sigilliB8(s);
  ctx.save();
  if (p.aperta) { // la bottega aperta: bagliore di fucina e, in fondo, la scala
    const fl = 0.36 + 0.1 * Math.sin(tick * 0.2) + 0.05 * Math.sin(tick * 0.53);
    ctx.fillStyle = `rgba(234, 134, 38, ${fl.toFixed(3)})`;
    ctx.fillRect(x - 13, y - 20, 26, 28); ctx.beginPath(); ctx.arc(x, y - 20, 13, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(10, 6, 4, 0.75)';
    ctx.fillRect(x + 3, y - 30, 2, 38); ctx.fillRect(x + 10, y - 30, 2, 38);
    for (let r = 0; r < 5; r++) ctx.fillRect(x + 3, y - 24 + r * 7, 9, 1);
    ctx.fillStyle = 'rgba(249, 203, 64, 0.55)'; ctx.fillRect(x - 13, y + 7, 26, 2);
  } else {
    if (notte >= SEGRETO_B8.daNotte.luce) { // la lama di luce sotto la porta, col ritmo del martello
      const colpo = colpoRitmoB8();
      ctx.fillStyle = `rgba(249, 203, 64, ${Math.min(1, 0.22 + 0.12 * k + colpo * 0.6).toFixed(3)})`;
      ctx.fillRect(x - 12, y + 8, 24, 2);
      if (colpo > 0) { ctx.fillStyle = `rgba(234, 134, 38, ${(colpo * 0.4).toFixed(3)})`; ctx.fillRect(x - 15, y + 10, 30, 3); }
    }
    for (let i = 0; i < 3; i++) { // i tre sigilli di ceralacca sulla spranga
      const sx = x - 9 + i * 9;
      if (i >= k) {
        ctx.fillStyle = NERO_B8; ctx.fillRect(sx - 3, y - 10, 7, 7);
        ctx.fillStyle = '#8f160c'; ctx.fillRect(sx - 2, y - 9, 5, 5);
        ctx.fillStyle = '#e53222'; ctx.fillRect(sx - 2, y - 9, 5, 1);
        ctx.fillStyle = '#f9cb40'; ctx.fillRect(sx, y - 8, 1, 3); ctx.fillRect(sx - 1, y - 7, 3, 1);
      } else {
        ctx.fillStyle = '#5c110b'; ctx.fillRect(sx - 2, y - 9, 1, 2); ctx.fillRect(sx + 1, y - 6, 1, 1);
        ctx.fillStyle = '#8f160c'; ctx.fillRect(sx - 2, y + 9, 2, 1); ctx.fillRect(sx + 1, y + 10, 1, 1);
      }
    }
    if (k >= 3 && SEGRETO_B8.serveFinaleVero && !s.finaleVisto) { // il filo d'oro che tiene chiusa la porta
      ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 1; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(x + Math.sin(tick * 0.03) * 1.5, 0); ctx.lineTo(x, y - 38); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  const posti = [-31, 30, 42]; // i chiodi accanto allo stipite e i ferri appesi
  SEGRETO_B8.ferri.forEach((fr, i) => {
    const fx = x + posti[i];
    if (notte >= SEGRETO_B8.daNotte.luce || k > 0) { ctx.fillStyle = '#9ca3af'; ctx.fillRect(fx, y - 15, 1, 2); }
    if (s.ferri[fr.id]) drawPixelSprite(SPRITE_OGGETTI[fr.sprite], fx, y - 7, 1);
  });
  const da = tick - b8.sigilloAnim;
  if (da >= 0 && da < 50) { ctx.fillStyle = `rgba(229, 50, 34, ${(0.7 * (1 - da / 50)).toFixed(3)})`; ctx.fillRect(x - 16, y - 12, 32, 10); }
  const dp = tick - b8.portaAnim;
  if (dp >= 0 && dp < 70) { ctx.fillStyle = `rgba(249, 203, 64, ${(0.6 * (1 - dp / 70)).toFixed(3)})`; ctx.fillRect(x - 20, y - 38, 40, 50); }
  ctx.restore();
}
window.__teatro.portaBottegaB8 = function (p) {
  try { disegnaPortaB8(p); } catch (err) { if (!b8.errorePorta) { b8.errorePorta = true; console.error('[B8] porta', err); } }
};

function disegnaFontanaB8(x, y, scorre) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 5, 3, 0.55)'; ctx.beginPath(); ctx.ellipse(x, y + 15, 27, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = NERO_B8; ctx.beginPath(); ctx.ellipse(x, y + 8, 25, 10, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.ellipse(x, y + 6, 23, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = scorre ? '#0891b2' : '#1f2937'; ctx.beginPath(); ctx.ellipse(x, y + 6, 19, 5.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = NERO_B8; ctx.fillRect(x - 4, y - 17, 8, 23); ctx.fillRect(x - 9, y - 22, 18, 6);
  ctx.fillStyle = '#94a3b8'; ctx.fillRect(x - 3, y - 16, 6, 21);
  ctx.fillStyle = '#cbd5e1'; ctx.fillRect(x - 8, y - 21, 16, 4);
  if (scorre) {
    ctx.fillStyle = '#67e8f9';
    for (let i = 0; i < 6; i++) {
      const q = (tick * 0.045 + i / 6) % 1;
      for (const l of [-1, 1]) ctx.fillRect(Math.round(x + l * (3 + q * 13)), Math.round(y - 20 + q * q * 25), 2, 2);
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'; ctx.fillRect(x - 12 + ((tick >> 3) % 20), y + 5, 3, 1);
  }
  ctx.restore();
}

function disegnaCordoneB8(x, y) {
  const osc = Math.sin(tick * 0.05) * 2;
  ctx.save();
  const g = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, 34);
  g.addColorStop(0, 'rgba(249, 203, 64, 0.3)'); g.addColorStop(1, 'rgba(249, 203, 64, 0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 6, 34, 0, TAU); ctx.fill();
  ctx.strokeStyle = NERO_B8; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x, ARENA.y1 - 26); ctx.quadraticCurveTo(x + osc, y - 34, x + osc, y - 8); ctx.stroke();
  ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, ARENA.y1 - 26); ctx.quadraticCurveTo(x + osc, y - 34, x + osc, y - 8); ctx.stroke();
  ctx.fillStyle = NERO_B8; ctx.fillRect(Math.round(x + osc) - 6, y - 10, 12, 7);
  ctx.fillStyle = '#f9cb40'; ctx.fillRect(Math.round(x + osc) - 5, y - 9, 10, 5);
  ctx.fillStyle = '#8f160c'; for (let i = -4; i <= 4; i += 2) ctx.fillRect(Math.round(x + osc) + i, y - 4, 1, 10);
  ctx.restore();
}

/** Dentro la stanza (sotto i personaggi): la fontana della Villa, il cordone del sipario. */
function disegnaInStanzaB8(st) {
  if (!st || statoRun.fase !== 'in_gioco') return;
  if (st.tipo === 'ingresso' && pianoNelCicloB8() === 2) disegnaFontanaB8(SEGRETO_B8.fontana.x, SEGRETO_B8.fontana.y, bossDelPianoCadutoB8());
  if (st.cordoneB8) disegnaCordoneB8(CONFIG_B8.cordone.x, CONFIG_B8.cordone.y);
}

function disegnaSopraGiocoB8() {
  if (statoRun.siparioAttivo) return;
  const st = statoRun.stanzaCorrente;
  if (!st) return;
  const T = TESTI_B8.senzaFine;
  if (b8.finalePendente && b8.finalePendente.st === st) {
    drawPillLabel('★  LE MANI SI FERMANO. IL PALCO TRATTIENE IL FIATO…  ★', 320, 222, 340, { color: '#f9cb40', border: '#f9cb40' });
  } else if (st.tipo === 'boss' && st.uscitaAperta && pianoNelCicloB8() === 4 && statoB8().finaleVisto) {
    drawPillLabel(T.botola((statoRun.ciclo || 1) + 1, (statoRun.piano || 4) + 1), 320, 222, 340, { color: '#f9cb40', border: '#f9cb40' });
  }
  if (st.cordoneB8) {
    const C = CONFIG_B8.cordone;
    const vicino = Math.hypot(player.x - C.x, player.y - C.y) < C.raggio;
    drawPillLabel(T.cordone, C.x + 6, C.y + 22, 170, { size: 7.5, color: vicino ? '#ffffff' : '#f9cb40', border: '#f9cb40' });
    if (vicino) drawPillLabel(T.cordoneSotto, C.x + 6, C.y + 35, 190, { size: 6.5, color: '#c9a679', border: '#5c3a1e' });
  }
}

function disegnaSopraHubB8() {
  const P = SEGRETO_B8.porta;
  ctx.save();
  for (const sc of b8.scintille) {
    ctx.globalAlpha = Math.max(0, 1 - sc.t / 26);
    ctx.fillStyle = sc.t < 9 ? '#fff3c4' : '#f9cb40';
    ctx.fillRect(Math.round(sc.x), Math.round(sc.y), 2, 2);
  }
  ctx.restore();
  if (b8.cart) { disegnaCartiglioB8(b8.cart.voci[b8.cart.idx], 1e6, { rett: CONFIG_B8.cartiglioHub, velo: true }); return; }
  if (dialogoT4B8()) return;
  if (vicinoPortaB8()) drawPillLabel(statoB8().portaAperta ? TESTI_B8.porta.pillEntra : TESTI_B8.porta.pillBussa, P.x + 96, P.y - 4, 200, { size: 7.5, color: '#ffffff', border: '#f9cb40' });
  drawPillLabel(TESTI_B8.diario.hub, 84, 18, 160, { size: 7, color: '#c9a679', border: '#5c3a1e' });
}

function didLiberaB8() {
  const fase = statoRun.fase;
  if (fase !== 'in_gioco' && fase !== 'hub' && fase !== 'morte') return false;
  if (statoRun.pausa || statoRun.siparioAttivo || statoRun.cartiglioD || b8.cart || dialogoT4B8()) return false;
  if (typeof a6 === 'object' && a6 && a6.notifica) return false;
  return true;
}

function disegnaDidB8(a, alpha) {
  const D = CONFIG_B8.didascalia;
  const inGioco = statoRun.fase === 'in_gioco';
  const wMax = inGioco ? D.wMaxGioco : D.wMax;
  const font = fontB8(9.5, 'italic');
  const righe = aCapoB8(a.testo, wMax - 30, font).slice(0, 4);
  if (a.larg === undefined || a.largInGioco !== inGioco) {
    ctx.save(); ctx.font = font;
    a.larg = 0;
    for (const r of righe) a.larg = Math.max(a.larg, ctx.measureText(r).width);
    ctx.restore();
    a.largInGioco = inGioco;
  }
  const w = Math.round(Math.min(wMax, Math.max(150, a.larg + 34)));
  const h = 12 + righe.length * 12;
  const x = Math.round(Math.min(W - w - 6, Math.max(6, (inGioco ? D.xGioco : W / 2) - w / 2)));
  const y = D.fondo - h;
  const filetto = a.tipo === 'voce' ? '#f9cb40' : a.tipo === 'silenzio' ? '#6b7280' : '#8a5a2b';
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(10, 6, 4, 0.9)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = filetto;
  ctx.fillRect(x + 10, y, w - 20, 1); ctx.fillRect(x + 10, y + h - 1, w - 20, 1);
  ctx.fillRect(x + 4, y + Math.round(h / 2) - 1, 2, 2); ctx.fillRect(x + w - 6, y + Math.round(h / 2) - 1, 2, 2);
  if (a.nome) {
    ctx.font = fontB8(7.5, 'bold');
    const nw = Math.ceil(ctx.measureText(a.nome).width) + 12;
    ctx.fillStyle = '#3b0d2a'; ctx.fillRect(x + 14, y - 7, nw, 11);
    ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 1; ctx.strokeRect(x + 14.5, y - 6.5, nw - 1, 10);
    testoB8(a.nome, x + 14 + nw / 2, y + 1.5, { size: 7.5, stile: 'bold', color: '#f9cb40', align: 'center', ombra: false });
  }
  const colore = a.tipo === 'voce' ? '#f3dfc1' : a.tipo === 'silenzio' ? '#9ca3af' : '#c9a679';
  righe.forEach((r, k) => testoB8(r, x + w / 2, y + 16 + k * 12, { size: 9.5, stile: 'italic', color: colore, align: 'center' }));
  ctx.restore();
}

/** Coda delle didascalie: una alla volta, entra, resta, esce. coperto = una pergamena le nasconde. */
function aggiornaDidB8(dtMs, coperto) {
  const D = CONFIG_B8.didascalia;
  const S = b8.did;
  const dt = Math.max(0, Math.min(100, dtMs || 16));
  if (!S.att) {
    if (S.attesaMs > 0) { S.attesaMs -= dt; return; }
    if (!S.coda.length || coperto || !didLiberaB8()) return;
    const d = S.coda.shift();
    const nome = d.tipo === 'voce' ? (flagTramaB8().rivelazione_vista ? TESTI_B8.nomeSignora : TESTI_B8.nomi.voce) : null;
    S.att = { ...d, nome, ms: 0, durata: D.entrataMs + D.baseMs + d.testo.length * D.perCarattereMs + D.uscitaMs };
    if (d.tipo === 'voce') suonoVoceB8();
  }
  const a = S.att;
  a.ms += dt;
  if (a.ms >= a.durata) { S.att = null; S.attesaMs = D.pausaFraMs; return; }
  if (!coperto) disegnaDidB8(a, Math.max(0, Math.min(1, a.ms / D.entrataMs, (a.durata - a.ms) / D.uscitaMs)));
}

/** Tutto ciò che si disegna sopra il frame (dopo T4, a6 e a7). */
function sopraB8(dtMs) {
  const fase = statoRun.fase;
  if (fase === 'finale' || fase === 'menu_selezione' || statoRun.pausa) return;
  const coperto = Boolean(typeof a7 === 'object' && a7 && (a7.pergamena || a7.registroAperto));
  if (!coperto && fase === 'hub') disegnaSopraHubB8();
  if (!coperto && fase === 'in_gioco') disegnaSopraGiocoB8();
  aggiornaDidB8(dtMs, coperto);
}

function disegnaLinguettaB8() {
  const L = CONFIG_B8.linguetta;
  ctx.save();
  ctx.fillStyle = '#140c08'; ctx.fillRect(L.x - 4, L.y, L.w + 4, L.h);
  ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 1; ctx.strokeRect(L.x - 3.5, L.y + 0.5, L.w + 3, L.h - 1);
  ctx.fillStyle = '#7a1c12'; ctx.fillRect(L.x, L.y + 3, 4, L.h - 6);
  const n = leggiDiarioB8().pagine.length;
  drawTextFit(TESTI_B8.diario.linguetta, L.x + L.w / 2 + 3, L.y + 13, L.w - 16, { size: 7.5, color: '#f9cb40', weight: 'bold' });
  drawTextFit(n ? `${n} ${n === 1 ? 'notte scritta' : 'notti scritte'}` : 'ancora bianco', L.x + L.w / 2 + 3, L.y + 24, L.w - 16, { size: 6.5, color: '#c9a679', weight: '' });
  ctx.restore();
}

/** Il quaderno: una pagina per notte, oppure la sezione «Finali». */
function disegnaDiarioB8() {
  const d = statoRun.diarioD;
  const P = CONFIG_B8.diario;
  const T = TESTI_B8.diario;
  const ink = '#3b2210', rosso = '#7f1d1d', tenue = '#6b4423';
  const cx = P.x + P.w / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(4, 2, 1, 0.92)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2a170c'; ctx.fillRect(P.x - 8, P.y - 6, P.w + 16, P.h + 12);
  ctx.fillStyle = '#e6d2aa'; ctx.fillRect(P.x, P.y, P.w, P.h);
  ctx.fillStyle = 'rgba(120, 80, 40, 0.16)';
  ctx.fillRect(P.x, P.y, 16, P.h); ctx.fillRect(P.x, P.y, P.w, 6); ctx.fillRect(P.x, P.y + P.h - 6, P.w, 6);
  ctx.fillStyle = 'rgba(92, 64, 36, 0.5)';
  for (let yy = P.y + 14; yy < P.y + P.h - 10; yy += 14) ctx.fillRect(P.x + 7, yy, 2, 6);
  ctx.fillStyle = '#7a1c12'; ctx.fillRect(P.x + P.w - 34, P.y - 6, 9, 36);
  ctx.fillStyle = '#5c110b'; ctx.fillRect(P.x + P.w - 34, P.y + 26, 9, 4);
  testoB8(T.titolo, cx, P.y + 20, { size: 8.5, stile: 'bold', color: tenue, align: 'center', ombra: false });
  if (d.paginaB8 === 'finali') {
    const s = statoB8();
    const voci = vociFinaliB8();
    testoB8(T.finali, P.x + 30, P.y + 50, { size: 15, stile: 'bold', color: rosso, ombra: false });
    ctx.fillStyle = 'rgba(92, 64, 36, 0.5)'; ctx.fillRect(P.x + 30, P.y + 57, P.w - 60, 1);
    voci.forEach((v, i) => {
      const r = rigaFinaleB8(i);
      const sel = i === d.selFinale;
      ctx.fillStyle = sel ? 'rgba(127, 29, 29, 0.14)' : 'rgba(92, 64, 36, 0.06)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = sel ? rosso : 'rgba(92, 64, 36, 0.4)'; ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      testoB8(`${sel ? '▶ ' : ''}${v.nome}`, r.x + 10, r.y + 12, { size: 10.5, stile: 'bold', color: v.disponibile ? ink : tenue, ombra: false });
      testoB8(v.disponibile ? T.rivedi : v.aiuto, r.x + 10, r.y + 23, { size: 8, stile: 'italic', color: tenue, ombra: false });
    });
    let y = rigaFinaleB8(voci.length).y + 14;
    const k = sigilliB8(s);
    for (let i = 0; i < 3; i++) { // i tre sigilli
      const sx = P.x + 40 + i * 14;
      ctx.fillStyle = i < k ? 'rgba(92, 64, 36, 0.35)' : '#8f160c';
      ctx.beginPath(); ctx.arc(sx, y - 3, 5, 0, TAU); ctx.fill();
      if (i >= k) { ctx.fillStyle = '#f9cb40'; ctx.fillRect(sx - 0.5, y - 6, 1, 5); ctx.fillRect(sx - 2, y - 4, 4, 1); }
    }
    testoB8(T.sigilli(k), P.x + 84, y, { size: 9.5, color: ink, ombra: false });
    for (const riga of [T.senzaFine(s.senzaFine, s.recordCiclo), T.visti(Boolean(s.finali.uccisa), Boolean(s.finali.risparmiata)), T.volto(s.volto)]) {
      y += 17;
      testoB8(riga, P.x + 34, y, { size: 9.5, color: ink, ombra: false });
    }
    testoB8(T.piedeFinali, cx, P.y + P.h - 12, { size: 7.5, stile: 'italic', color: tenue, align: 'center', ombra: false });
    ctx.restore();
    return;
  }
  const pagine = leggiDiarioB8().pagine;
  const n = pagine.length;
  if (!n) testoB8(T.vuoto, cx, P.y + 150, { size: 11, stile: 'italic', color: tenue, align: 'center', ombra: false });
  else {
    const i = d.paginaIdx < 0 || d.paginaIdx >= n ? n - 1 : d.paginaIdx;
    const pg = pagine[i];
    testoB8(pg.titolo, P.x + 30, P.y + 50, { size: 15, stile: 'bold', color: rosso, ombra: false });
    if (pg.personaggio) testoB8(pg.personaggio, P.x + P.w - 44, P.y + 50, { size: 8, stile: 'italic', color: tenue, align: 'right', ombra: false });
    ctx.fillStyle = 'rgba(92, 64, 36, 0.5)'; ctx.fillRect(P.x + 30, P.y + 57, P.w - 60, 1);
    const font = fontB8(10, 'italic');
    let y = P.y + 76;
    const yMax = P.y + P.h - 28;
    for (const riga of pg.righe) {
      const rr = aCapoB8(riga, P.w - 72, font);
      if (y + (rr.length - 1) * P.interlinea > yMax) { testoB8('…', P.x + 36, y, { size: 10, color: tenue, ombra: false }); break; }
      for (const r of rr) { testoB8(r, P.x + 36, y, { size: 10, stile: 'italic', color: ink, ombra: false }); y += P.interlinea; }
      y += 2.5;
    }
    testoB8(T.pagina(i + 1, n), P.x + P.w - 30, P.y + P.h - 26, { size: 7.5, color: tenue, align: 'right', ombra: false });
    if (i > 0) testoB8('◀', P.x + 20, P.y + P.h / 2, { size: 11, color: rosso, ombra: false });
    if (i < n - 1) testoB8('▶', P.x + P.w - 22, P.y + P.h / 2, { size: 11, color: rosso, ombra: false });
  }
  testoB8(T.piedeNotti, cx, P.y + P.h - 12, { size: 7.5, stile: 'italic', color: tenue, align: 'center', ombra: false });
  ctx.restore();
}

// ===========================================================================
// 16. SONDA QA E AGGANCI PER LE ALTRE SQUADRE
// ===========================================================================
Object.assign(window.__teatro.interni, {
  CONFIG_B8, SEGRETO_B8, TESTI_B8, FINALE_B8, DIARIO_B8, VOCE_B8, SILENZIO_B8, INDIZI_B8,
  /** GANCIO: si sale Sopra la Ribalta (oggi: scena narrata; domani: prima lo scontro, vedi scontroSopraLaRibalta). */
  entraSopraLaRibalta: entraSopraLaRibaltaB8,
  /** La scena finale narrata Sopra la Ribalta (la chiama lo scontro a vittoria). */
  finaleSopraLaRibalta: finaleSopraLaRibaltaB8,
  /** Lo scontro col Grande Burattinaio: null finché un'altra squadra non assegna function ({ fine, annulla, sigilli }). */
  scontroSopraLaRibalta: window.__teatro.interni.scontroSopraLaRibalta || null,
  finaliB8: Object.freeze({
    stato: () => JSON.parse(JSON.stringify(statoB8())),
    /** QA: azzera finali, segreto e Diario dello slot attivo (e i flag di T4 che dipendono da noi). */
    azzera() {
      const v = vuotoB8();
      scriviB8(v);
      try { localStorage.removeItem(chiaveDiarioB8()); } catch (_) { /* memoria negata */ }
      b8.diario = null; b8.fin = null; b8.cart = null; b8.finalePendente = null; b8.did.coda.length = 0; b8.did.att = null;
      b8.did.ultime = {}; b8.indizioNotte = 0; b8.vocePortaNotte = 0; b8.voltoUsatoRun = -1; b8.esameIdx = 0; b8.bussate = [];
      try { const q = t4qaB8(); if (q) q.impostaFlag({ fucina_aperta: null, violante: null }); } catch (_) { /* T4 assente */ }
      b8.flag = null;
    },
    avviaFinale: (id, opz) => avviaFinaleB8(id, opz || {}),
    get scena() {
      const f = b8.fin;
      if (!f) return null;
      const sc = f.scene[f.i] || {};
      const v = sc.battute && sc.battute[f.j];
      return { finale: f.id, id: sc.id || null, fondale: sc.fondale || null, indice: f.i, scene: f.scene.length, battuta: f.j,
        chi: v ? v.chi : null, testo: v ? v.testo : sc.frase || null, inScelta: f.inScelta,
        opzioni: f.inScelta ? sc.scelta.opzioni.map((o) => o.id) : null, sel: f.sel, rivisto: f.rivisto, stato: { ...(f.st || {}) } };
    },
    avanza: avanzaFinaleB8, scegli: scegliFinaleB8, saltaFinale: saltaFinaleB8,
    daiFerro: (id) => daiFerroB8(id, {}),
    /** QA: imposta i primi n sigilli come rotti (0..3). */
    impostaSigilli(n) {
      const s = statoB8();
      s.ferri = {};
      SEGRETO_B8.ferri.slice(0, Math.max(0, Math.min(3, n))).forEach((f) => { s.ferri[f.id] = getNumeroNotte(); });
      scriviB8(s);
      return sigilliB8(s);
    },
    impostaStato(parz) { const s = statoB8(); Object.assign(s, parz || {}); scriviB8(s); return JSON.parse(JSON.stringify(s)); },
    sigilli: () => sigilliB8(),
    bussa: bussaB8,
    /** QA: l'esito di una bussata col ritmo giusto (tre colpi, una pausa, uno). */
    bussaRitmo: () => esitoBussataB8(true, 4),
    ritmoGiusto: ritmoGiustoB8,
    apriPorta: apriPortaB8,
    indiziHub: indiziHubB8,
    indizioTonino: indizioToninoB8,
    get cartiglio() { const c = b8.cart; return c ? { chi: c.voci[c.idx].chi, testo: c.voci[c.idx].testo, idx: c.idx, voci: c.voci.length } : null; },
    avanzaCartiglio: avanzaCartB8,
    /** QA: compone e salva la pagina di una notte da una voce (anche inventata) e da note di run. */
    scriviPagina: (v, nota, opz) => scriviPaginaRunB8(v, { nota: { ...nuovaNotaB8(), ...(nota || {}) }, senzaFlag: true, ...(opz || {}) }),
    pagine: () => JSON.parse(JSON.stringify(leggiDiarioB8().pagine)),
    apriDiario: (sezione) => apriDiarioB8(sezione, statoRun.fase === 'hub' && !statoRun.pausa),
    chiudiDiario: chiudiDiarioB8,
    voce: diciB8,
    nota: notaDidB8,
    get didascalia() { const a = b8.did.att; return { attiva: a ? { tipo: a.tipo, nome: a.nome, testo: a.testo, evento: a.evento } : null, coda: b8.did.coda.map((d) => ({ tipo: d.tipo, testo: d.testo, evento: d.evento })) }; },
    registraVoceBoss: registraVoceBossB8,
    righeVoce: (evento, dati) => (righeEventoB8(evento, dati) || []).slice(),
    voltoSalva: voltoSalvaB8,
    get notaRun() { return b8.nota ? JSON.parse(JSON.stringify(b8.nota)) : null; },
    get finalePendente() { return Boolean(b8.finalePendente); },
    trasformazioni: trasformazioniB8,
  }),
  // versioni avvolte (T4 e la QA chiamano queste: così passano anche da b8)
  nuovaRun, entraInStanza, interagisciStanza, disegnaMenuPausa, gestisciClickMenuPausa,
});
Object.defineProperty(window.__teatro.interni, 'sigilli', { get: () => sigilliB8(), enumerable: true, configurable: true });
