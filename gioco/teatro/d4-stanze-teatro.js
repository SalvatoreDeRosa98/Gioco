/*
 * teatro/d4-stanze-teatro.js — (squadra d4) tre stanze del teatro.
 *
 *   1. I CAMERINI DIETRO LE QUINTE: la stanza `maledetta` di a3 (porta che costa ½ Maschera a ogni passaggio,
 *      dentro un premio e a volte dei custodi) rivestita: porta di servizio con la tenda consunta e il chiodo
 *      sporgente, dentro specchiere con le candele, il baule dei costumi, parrucche, manichini; i custodi sono
 *      manichini da sarta che si animano (IA del Burattino Scucito: passo a scatti, stoccata d'ago che si
 *      legge dalla posa). La REGOLA resta quella di a3 (STANZE_SPECIALI_A3.maledetta): qui cambiano solo
 *      nomi, banner, disegni e il simbolo sulla minimappa.
 *      Già che c'eravamo: nelle stanze di a3 il forziere di a1 (e le bombe accese) finivano SOTTO il tappeto,
 *      perché a1 disegna dentro la catena di disegnaStanzaPixelArt prima che a3 stenda il fondo: ora si
 *      ripassano sopra (sopraIlTappetoD4).
 *
 *   2. LA TERNA DELLA SMORFIA: nella Bisca di a3, accanto al Banco del Lotto, il cartellone di Don Gennaro.
 *      [E] lì vicino apre il riquadro: una rosa di 15 numeri col loro significato, se ne segnano 3 (frecce +
 *      conferma, click o tocco), si paga (STANZE_TEATRO_D4.terna.costo) e dal panariello escono 5 numeri uno
 *      alla volta con la voce di Don Gennaro: un numero preso = pochi grani, ambo = premio buono, terno =
 *      oggetto Forte e molti grani. Probabilità (probTernaD4) e premi in tabella. Una terna per visita.
 *      La smorfia di a3 è ampliata da SMORFIA_D4 (solo significati innocui).
 *
 *   3. LA BUCA DELL'ORCHESTRA: stanza nuova (tipo `buca`, al massimo una per piano, mai al piano 1 la prima
 *      notte): la buca sotto il palco con leggii, timpani, contrabbasso e il direttore d'ombra. Entrando parte
 *      il pezzo (tema `orchestra` aggiunto a MUSICA.temi) e le porte si chiudono: 3-4 ondate entrano A TEMPO,
 *      una ogni 8 battute, e i nemici suonano una «parte» (STANZE_TEATRO_D4.buca.parti): si muovono sui tempi,
 *      caricano in levare (la posa) e colpiscono sul battere. L'orologio (avanzaOrologioD4, battitoD4) segue il
 *      sequencer di a8 quando la musica suona davvero, altrimenti un metronomo interno a tick con lo stesso bpm:
 *      con l'audio spento non cambia niente. Il tempo si legge dalla bacchetta del direttore e dal metronomo;
 *      nessun segno a terra. Finite le ondate senza subire danni l'orchestra applaude e il premio è doppio.
 *
 * Integrazione: si avvolgono funzioni di primo livello (sempre chiamando la base). Di a3 si avvolgono
 * `disegnaRoviA3` (la porta), `disegnaArrediA3` (la stanza), `disegnaMinimappaA3` (il simbolo) e
 * `pagaSangueA3` (il nome della fonte); i banner di a3 passano da `mostraBanner`, dove i testi dei rovi
 * vengono sostituiti (tabella SOSTITUZIONI_D4: chiave = testo di a3). Nessuna riga cambiata in a3 per i Camerini.
 * AGGANCI nei file altrui: a3-stanze-speciali.js › giocaLottoA3 legge il significato da `smorfiaD4` (se c'è);
 * a8-musica.js › temaCorrente chiede il tema a `temaMusicaD4` (se c'è) ed espone `Musica.posizionePassi(base)`.
 * Verifica: tools/qa-teatro-stanze-teatro.js. Script classico (teatro/LEGGIMI.md), caricato dopo c2-tocco.js.
 */

// ===========================================================================
// TABELLE (tutto ciò che si accorda sta qui)
// ===========================================================================

/** Colori comuni dello stile «a ombre»: sagoma scura, contorno color lanterna, pochi accenti. */
const OMBRE_D4 = Object.freeze({ sagoma: '#140c10', buio: '#070403', lume: '#e8c98a', oro: '#f9cb40', rosso: '#b91c1c', legno: '#2a1a10' });

/** Valori delle tre stanze (d4). */
const STANZE_TEATRO_D4 = Object.freeze({
  camerini: Object.freeze({
    /** Aspetto: porta di servizio, fondo della stanza, cella sulla minimappa. */
    aspetto: Object.freeze({
      cornice: '#b08a4a', stipite: '#2a1a10', tenda: '#5e1b26', tendaScura: '#3a1019', toppa: '#7a5a34',
      chiodo: '#cbd5e1', sangue: '#dc2626', minimappa: '#4a1c2a', velo: 'rgba(26, 12, 18, 0.34)', tappeto: '#3a1420',
    }),
    /** Arredi (coordinate del palco 640×360). r = raggio del corpo solido per Ferruccio (0 = si attraversa). */
    specchiere: Object.freeze([200, 262, 378, 440]),
    stand: Object.freeze({ x: 108, y: 122, r: 14 }),
    parrucche: Object.freeze({ x: 534, y: 122, r: 14 }),
    baule: Object.freeze({ x: 118, y: 266, r: 17 }),
    manichinoFermo: Object.freeze({ x: 526, y: 262, r: 9 }),
    /** I custodi (contenuto 'nemici' di a3) diventano manichini: tipo di IA di base, nome, velocità di base. */
    custodi: Object.freeze({ tipo: 'burattino', vel: 1.15, velPerPiano: 0.045, velMax: 1.55, raggio: 11, cdMin: 58, cdMax: 74 }),
    /** Posa del manichino letta da shootCd (stessa IA del Burattino Scucito di 40-combattimento.js). */
    posa: Object.freeze({ anticipoDa: 18, affondoDa: 8 }),
  }),

  terna: Object.freeze({
    costo: 3,                  // 🪙 a terna (la giocata semplice di a3 ne costa 1)
    rosa: 15,                  // numeri proposti: sono anche TUTTI i numeri nel panariello
    scelte: 3,                 // numeri da segnare
    estratti: 5,               // numeri che escono, uno alla volta
    /**
     * Premi per numeri presi. Probabilità (probTernaD4(): 5 estratti senza reimmissione da 15, 3 tuoi):
     * nessuno 26,4% · uno 49,5% · ambo 22,0% · terno 2,2%.
     * Valore atteso (valoreAttesoTernaD4(); l'oggetto Forte vale 7🪙, il prezzo della Fucina): un numero (2🪙) e
     * ambo (7🪙) rendono 0,99 + 1,54 = 2,53🪙 su 3 spesi; col terno (Forte + 9🪙 = 16🪙) si arriva a 2,88🪙:
     * poco sotto il costo. Il terno, col piedistallo occupato, paga ripiegoMonete in più al posto dell'oggetto;
     * se il pool della notte non ha più oggetti Forti esce un oggetto base con ripiegoNonForte monete in più.
     */
    premi: Object.freeze({
      0: Object.freeze({ monete: 0 }),
      1: Object.freeze({ monete: 2 }),
      2: Object.freeze({ monete: 7 }),
      3: Object.freeze({ monete: 9, oggettoForte: true, ripiegoMonete: 7, ripiegoNonForte: 2 }),
    }),
    valoreForte: 7,            // usato solo se manca ECONOMIA_T3.prezzi.forte
    posto: Object.freeze({ x: 500, y: 150, raggioUso: 42, r: 12 }),
    piedistallo: Object.freeze({ x: 452, y: 236 }),
    tempi: Object.freeze({ chiamataTick: 84, esitoTick: 200 }),
    voce: Object.freeze({ note: Object.freeze([118, 132, 105, 140, 124]), formante: Object.freeze([620, 880, 520]), passoSec: 0.11, durataSec: 0.1, volume: 0.09 }),
    pannello: Object.freeze({ x: 110, y: 54, w: 420, h: 254, margine: 12, colonne: 5, cellaL: 76, cellaA: 38, spazio: 4, grigliaY: 46 }),
  }),

  buca: Object.freeze({
    /** Probabilità che la Buca compaia nel piano (oltre l'ultima chiave vale l'ultima). Al massimo una per piano. */
    probPerPiano: Object.freeze({ 1: 0.3, 2: 0.4, 3: 0.45, 4: 0.45 }),
    saltaPrimaNottePiano1: true, // mai al piano 1 la prima notte
    genitori: Object.freeze(['normale']),
    /**
     * Dove può stare: sempre una foglia (una porta sola, verso una stanza di combattimento). Con soloVicoloCieco
     * la cella non toccherebbe nessun'altra stanza (la regola di a3), ma dopo le stanze di a3 il posto così c'è
     * solo in 4 piani su 10 e la tabella delle probabilità mentirebbe: qui può confinare (senza porta) con altre
     * stanze, mai con quelle di maiAccantoA.
     */
    soloVicoloCieco: false,
    maiAccantoA: Object.freeze(['boss', 'segreta']),
    aspetto: Object.freeze({ cornice: '#d4a24a', minimappa: '#5a3d12', velo: 'rgba(10, 6, 12, 0.42)' }),
    /**
     * Il pezzo: nome del tema in MUSICA.temi (a8) e tempo. bpm = TEMPI al minuto; una battuta di 6/8 ha 2 tempi
     * e 6 passi. A 96 bpm: un tempo = 0,625 s, una battuta = 1,25 s, otto battute (una ripresa del tema) = 10 s.
     * Durata: 2 battute d'attacco + un'ondata ogni 8 battute → l'ultima di 4 entra a 32,5 s; in tutto ~40-55 s.
     */
    tema: 'orchestra', bpm: 96, passiPerBattuta: 6,
    battuteAttacco: 2,           // battute a vuoto prima della prima ondata (il direttore dà l'attacco)
    battutePerOndata: 8,         // ogni quante battute entra un'ondata
    anticipa: true,              // a palco vuoto l'ondata dopo entra alla prossima frase invece di aspettare la sua battuta
    fraseBattute: 2,
    ondateMin: 3, ondateMax: 4,
    accordaturaTempi: 2,         // tempi in cui un'ondata appena entrata sta ferma (una battuta)
    scattoFrazione: 0.45,        // quanta parte del tempo dura lo scatto di un passo
    posaColpoTick: 10,           // per quanto si vede la posa del colpo
    /** Premio a concerto finito; senza nessun colpo subito tutto × moltiplicaSenzaDanni (la seconda reliquia è il «bis»). */
    premio: Object.freeze({ monete: 3, oggetti: 1, ripiegoMonete: 5 }),
    moltiplicaSenzaDanni: 2,
    applausoTick: 300,
    piedistallo: Object.freeze({ x: 320, y: 192 }),
    direttore: Object.freeze({ x: 320, xConPortaNord: 370, y: 98, r: 9 }),
    metronomoDx: 40,
    timpani: Object.freeze({ x: 116, y: 118, r: 21 }),
    contrabbasso: Object.freeze({ x: 530, y: 150, r: 12 }), // sotto la minimappa, che copre l'angolo in alto a destra
    filaDiFondoY: 120,           // i leggii più su di qui hanno un orchestrale d'ombra seduto
    leggii: Object.freeze([[176, 100], [226, 95], [272, 94], [414, 95], [464, 100], [108, 238], [532, 238], [156, 284], [484, 284]]),
    /**
     * Le parti degli orchestrali: una mossa per TEMPO (due per battuta), a ciclo; la carica cade in levare e il
     * colpo sul battere dopo. Le ondate pari sono sfasate di una battuta.
     *   p passo verso Ferruccio · P balzo · c carica (la POSA: l'attacco si legge da qui) · s colpo mirato ·
     *   d doppietta · v ventaglio di tre · a stoccata corta · + croce (alternata a ×) · . fermo
     * passo/balzo: frazione della strada che farebbe in un tempo alla sua velocità; colpo: px/tick del proiettile;
     * posa: il valore di shootCd tenuto durante carica/colpo (è ciò che il disegno del nemico legge per la posa);
     * rinculo: px di cui arretra caricando (i volanti non hanno una posa: si tirano indietro).
     * I tipi senza parte (il Bozzo esplosivo) tengono la loro IA.
     */
    parti: Object.freeze({
      vespa_cieca: Object.freeze({ partitura: 'pp', passo: 0.8 }),
      lucciola: Object.freeze({ partitura: 'pcsp', passo: 0.8, colpo: 2.6, rinculo: 12 }),
      gatto: Object.freeze({ partitura: 'pcP.', passo: 0.6, balzo: 1.3 }),
      burattino: Object.freeze({ partitura: 'pcap', passo: 0.85, colpo: 3.5, gittata: 75, posa: Object.freeze({ carica: 14, colpo: 56 }) }),
      predone: Object.freeze({ partitura: 'pcsP', passo: 0.7, balzo: 1.1, devia: 0.55, colpo: 2.8, posa: Object.freeze({ carica: 10, colpo: 66 }) }),
      maschera: Object.freeze({ partitura: '.cv.', colpo: 2.25, apertura: 0.22, posa: Object.freeze({ carica: 21, colpo: 13 }) }),
      statua: Object.freeze({ partitura: '.c+.', colpo: 2.05, posa: Object.freeze({ carica: 20, colpo: 75 }) }),
      guardia: Object.freeze({ partitura: 'pcdp', passo: 0.7, colpo: 2.3, apertura: 0.12, posa: Object.freeze({ carica: 10, colpo: 66 }) }),
    }),
  }),
});

/**
 * Aggiunte alla smorfia di a3 (SMORFIA_A3), solo numeri dal significato innocuo: servono alla rosa della terna
 * e, con l'aggancio in giocaLottoA3, anche alla giocata semplice. Da approvare dall'autore.
 */
const SMORFIA_D4 = Object.freeze({
  2: "'a piccerella", 12: "'o surdato", 15: "'o guaglione", 19: "'a resata", 20: "'a festa", 25: 'Natale',
  31: "'o padrone 'e casa", 32: "'o capitone", 35: "l'aucelluzzo", 36: "'e castagnelle", 42: "'o ccafè", 45: "'o vino buono",
  46: "'e denare", 50: "'o ppane", 51: "'o ciardino", 52: "'a mamma", 54: "'o cappiello", 61: "'o cacciatore",
  68: "'a zuppa cotta", 70: "'o palazzo", 72: "'a maraviglia", 75: 'Pullecenella', 76: "'a funtana", 81: "'e sciure",
  84: "'a chiesa", 86: "'a puteca", 89: "'a vecchia",
});

/** Testi per il giocatore (tutti da approvare dall'autore). */
const TESTI_D4 = Object.freeze({
  camerini: Object.freeze({
    graffio: '🎭 Il chiodo della porta di servizio ti strappa un filo: -½ ❤️',
    rifiuto: "🎭 Il chiodo ti spezzerebbe l'ultimo filo: torna quando avrai più Maschere.",
    risparmia: '🎭 Il chiodo ti risparmia: sei allo stremo.',
    ingressoQuieto: '🎭 I CAMERINI DIETRO LE QUINTE: quel che trovi è tuo, ma anche uscire dalla porta di servizio costa ½ ❤️.',
    ingressoCustodi: '🎭 I CAMERINI DIETRO LE QUINTE: fra gli specchi i manichini si animano!',
    custodiCaduti: '🎭 I manichini tornano di legno: quel che custodivano è tuo!',
    fonte: 'il chiodo della porta di servizio',
    custode: 'Manichino dei Camerini',
  }),
  terna: Object.freeze({
    cartello: (costo) => `🎫 LA TERNA: ${costo}🪙 [E]`,
    cartelloGiocata: '🎫 TERNA GIOCATA',
    titolo: (costo) => `LA TERNA DI DON GENNARO · ${costo}🪙`,
    invito: "«Tre nummere, guagliò: ognuno tene 'a storia soja.»",
    pronta: "«Chiste so' 'e tuoje? E allora paga, ca se tira.»",
    siTira: '«Attenzione... se tira!»',
    senzaGrani: (costo) => `🎫 «Pe' na terna ce vonno ${costo}🪙, guagliò.»`,
    giaGiocata: "🎫 «Na terna pe' sera, guagliò: 'a furtuna nun se sfruculea.»",
    ordini: Object.freeze(['Primo estratto...', 'Secondo estratto...', 'Terzo...', 'Quarto...', "E l'urdemo..."]),
    chiamata: (ordine, numero, significato) => `«${ordine} ${numero}${significato ? `: ${significato}` : ''}!»`,
    preso: " — 'o tiene!",
    esiti: Object.freeze({
      0: "«Niente. 'A smorfia stanotte dorme.»", 1: "«Uno solo: pigliate 'e spicce e statte buono.»",
      2: '«AMBO! Don Gennaro pava, e pava buono.»', 3: "«TERNO SICCO! Maronna mia, 'o banco chiagne!»",
    }),
    titoliEsito: Object.freeze({ 0: 'NIENTE', 1: 'UN NUMERO', 2: 'AMBO!', 3: 'TERNO!' }),
    banner: Object.freeze({
      0: () => '🎫 La terna non esce: Don Gennaro si tiene i grani.',
      1: (n) => `🎫 Un numero preso: Don Gennaro ti allunga ${n}🪙.`,
      2: (n) => `🎫 AMBO! Don Gennaro paga ${n}🪙.`,
      3: (n, nome) => (nome ? `🎫 TERNO SECCO! ${n}🪙 e una reliquia: ${nome} [Click/E]` : `🎫 TERNO SECCO! Don Gennaro svuota la cassa: ${n}🪙.`),
    }),
    tuoi: 'I TUOI NUMERI',
    estratti: 'ESTRATTI',
    bottone: (costo) => `GIOCA LA TERNA: ${costo}🪙`,
    bottoneMancano: (n) => (n === 1 ? 'SEGNA ANCORA 1 NUMERO' : `SEGNA ANCORA ${n} NUMERI`),
    aiutoScegli: '↑↓←→ scegli · [E / Invio] segna o gioca · [ESC] lascia senza pagare',
    aiutoEstrazione: '[E / Invio] avanti il prossimo',
    aiutoEsito: '[E / Invio] chiudi',
  }),
  buca: Object.freeze({
    segno: '♪',
    ingresso: (n) => `♪ LA BUCA DELL'ORCHESTRA: ${n} ondate a tempo di musica. Se non ti toccano, premio doppio!`,
    ondata: (k, n) => `♪ Ondata ${k} di ${n}!`,
    ultima: (n) => `♪ Ondata ${n} di ${n}: gran finale!`,
    applauso: (monete, oggetti) => (oggetti > 0
      ? `♪ NEMMENO UN GRAFFIO: l'orchestra applaude in piedi! Premio doppio: ${monete}🪙 e due reliquie [Click/E]`
      : `♪ NEMMENO UN GRAFFIO: l'orchestra applaude in piedi! Premio doppio: ${monete}🪙.`),
    finita: (monete, oggetti) => (oggetti > 0
      ? `♪ Il pezzo è finito, l'orchestra posa gli archi. Premio: ${monete}🪙 e una reliquia [Click/E]`
      : `♪ Il pezzo è finito, l'orchestra posa gli archi. Premio: ${monete}🪙.`),
    bis: (nome) => `♪ «BIS!» Sul piedistallo compare la seconda reliquia: ${nome} [Click/E]`,
    bisGrani: (n) => `♪ «BIS!» La seconda reliquia non trova posto: l'orchestra te la paga ${n}🪙.`,
  }),
});

/**
 * Testi di a3 (Stanza dei Rovi) → testi dei Camerini. La chiave è il testo esatto di a3-stanze-speciali.js:
 * se a3 cambia una frase, qui la sostituzione smette di scattare e la QA lo segnala (cerca «rovi» nei banner).
 */
const SOSTITUZIONI_D4 = new Map([
  ['✷ I rovi della porta ti graffiano: -½ ❤️', TESTI_D4.camerini.graffio],
  ['✷ I rovi ti ucciderebbero: torna quando avrai più Maschere.', TESTI_D4.camerini.rifiuto],
  ['✷ I rovi ti risparmiano: sei allo stremo.', TESTI_D4.camerini.risparmia],
  ['✷ STANZA DEI ROVI: il bottino è tuo, ma anche uscire costa ½ ❤️.', TESTI_D4.camerini.ingressoQuieto],
  ['✷ STANZA DEI ROVI: i custodi del bottino ti aspettavano!', TESTI_D4.camerini.ingressoCustodi],
  ['✷ I custodi dei rovi sono caduti: il bottino è tuo!', TESTI_D4.camerini.custodiCaduti],
]);
const FONTE_ROVI_A3_D4 = 'i rovi della porta';

/** Interruttori per la QA (foto «prima/dopo»): nel gioco restano tutti accesi. */
const provaD4 = { sopraIlTappeto: true, rngTerna: null, senzaMusica: false, probBuca: null, bucaVicoloCieco: null };

// ===========================================================================
// UTILITÀ DI DISEGNO
// ===========================================================================

const teleD4 = new Map();
/**
 * Tela fuori schermo grande quanto il palco (640×360 alla scala del buffer) per ciò che non cambia mai.
 * @param {string} chiave @param {(g: CanvasRenderingContext2D) => void} disegna chiamata una volta sola
 */
function telaD4(chiave, disegna) {
  const k = `${chiave}@${scalaBase}`;
  let c = teleD4.get(k);
  if (c) return c;
  if (teleD4.size > 6) teleD4.clear();
  c = document.createElement('canvas');
  c.width = Math.ceil(W * scalaBase); c.height = Math.ceil(H * scalaBase);
  const g = c.getContext('2d');
  g.setTransform(scalaBase, 0, 0, scalaBase, 0, 0);
  g.lineJoin = 'round'; g.lineCap = 'round';
  disegna(g);
  teleD4.set(k, c);
  return c;
}

/** Poligono pieno col contorno netto. punti: [[x, y], ...]. */
function sagomaD4(g, punti, pieno = OMBRE_D4.sagoma, bordo = OMBRE_D4.lume, largo = 1) {
  g.beginPath();
  for (let i = 0; i < punti.length; i++) { if (i) g.lineTo(punti[i][0], punti[i][1]); else g.moveTo(punti[i][0], punti[i][1]); }
  g.closePath();
  if (pieno) { g.fillStyle = pieno; g.fill(); }
  if (bordo) { g.strokeStyle = bordo; g.lineWidth = largo; g.stroke(); }
}

/** Asta scura col filo di luce attorno (gambe, bracci, leggii). */
function astaD4(g, x1, y1, x2, y2, largo = 1.4, anima = OMBRE_D4.sagoma, bordo = OMBRE_D4.lume) {
  g.lineCap = 'round';
  g.strokeStyle = bordo; g.lineWidth = largo + 1.2;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  g.strokeStyle = anima; g.lineWidth = largo;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}

function ombraD4(g, x, y, rx, ry) {
  g.fillStyle = 'rgba(8, 5, 3, 0.55)';
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
}

/** Corpo solido rotondo: spinge Ferruccio fuori (come il banco della Bisca di a3). */
function corpoSolidoD4(c) {
  if (!c || !(c.r > 0)) return;
  const dx = player.x - c.x, dy = player.y - c.y;
  const d = Math.hypot(dx, dy), rMin = c.r + 8;
  if (d < rMin && d > 0.01) { player.x = c.x + (dx / d) * rMin; player.y = c.y + (dy / d) * rMin; }
}

// ===========================================================================
// 1. I CAMERINI DIETRO LE QUINTE (rivestimento della stanza `maledetta` di a3)
// ===========================================================================

/**
 * Alla generazione: i custodi della stanza (nemici del piano estratti da a3) diventano manichini da sarta.
 * Tengono vita e campione del nemico estratto; l'IA è quella del Burattino Scucito (passo a scatti e stoccata).
 */
function vestiCustodiD4(s, piano) {
  const C = STANZE_TEATRO_D4.camerini.custodi;
  if (!s || s.tipo !== 'maledetta' || !Array.isArray(s.nemici)) return 0;
  let n = 0;
  for (const e of s.nemici) {
    if (!e || e.boss || e.manichinoD4) continue;
    e.tipoOrigineD4 = e.tipo;
    e.tipo = C.tipo; e.patternMob = C.tipo;
    delete e.comportamento;
    e.manichinoD4 = true;
    e.nome = e.champion ? `${TESTI_D4.camerini.custode} [Campione ${e.champion}]` : TESTI_D4.camerini.custode;
    e.r = C.raggio;
    e.speed = C.vel * Math.min(C.velMax, 1 + (piano - 1) * C.velPerPiano) * (e.champion === 'dorato' ? 1.2 : 1);
    e.maskOpen = false; e.fuseTimer = 0; e.leapTimer = 0; e.crouchTicks = 0;
    e.shootCd = C.cdMin + Math.floor(rng() * (C.cdMax - C.cdMin + 1));
    n++;
  }
  return n;
}

/**
 * Sagoma del manichino da sarta, origine ai piedi del treppiede, rivolto a destra.
 * @param {CanvasRenderingContext2D} g
 * @param {{ braccio?: ''|'giu'|'su'|'affondo', bianco?: boolean, bordo?: string, trema?: number }} [opz]
 */
function sagomaManichinoD4(g, opz = {}) {
  const bordo = opz.bordo || OMBRE_D4.lume;
  const corpo = opz.bianco ? '#f8fafc' : OMBRE_D4.sagoma;
  // treppiede e asta
  astaD4(g, 0, -3, -7, 0, 1.4, corpo, bordo);
  astaD4(g, 0, -3, 7, 0, 1.4, corpo, bordo);
  astaD4(g, 0, -3, 0, 1, 1.4, corpo, bordo);
  astaD4(g, 0, -12, 0, -3, 1.6, corpo, bordo);
  // busto a clessidra
  g.beginPath();
  g.moveTo(-7.5, -30);
  g.quadraticCurveTo(0, -32.5, 7.5, -30);
  g.quadraticCurveTo(10, -26, 5, -19.5);
  g.quadraticCurveTo(6.5, -15, 7.5, -12);
  g.lineTo(-7.5, -12);
  g.quadraticCurveTo(-6.5, -15, -5, -19.5);
  g.quadraticCurveTo(-10, -26, -7.5, -30);
  g.closePath();
  g.fillStyle = corpo; g.fill();
  g.strokeStyle = bordo; g.lineWidth = 1; g.stroke();
  if (!opz.bianco) {
    // cucitura al centro e metro da sarta a tracolla
    g.strokeStyle = 'rgba(249, 203, 64, 0.55)'; g.lineWidth = 0.7;
    g.setLineDash([1.5, 1.5]);
    g.beginPath(); g.moveTo(0, -30); g.lineTo(0, -13); g.stroke();
    g.setLineDash([]);
    g.strokeStyle = OMBRE_D4.rosso; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(-6.5, -29); g.quadraticCurveTo(1, -22, 5.5, -14); g.stroke();
  }
  // collo col pomello
  g.fillStyle = corpo; g.strokeStyle = bordo; g.lineWidth = 1;
  g.fillRect(-1.8, -34, 3.6, 3); g.strokeRect(-1.8, -34, 3.6, 3);
  g.fillStyle = opz.bianco ? '#f8fafc' : OMBRE_D4.oro;
  g.beginPath(); g.arc(0, -35.5, 2, 0, TAU); g.fill();
  // braccio snodato con l'ago da sarta
  const b = opz.braccio || '';
  if (!b) return;
  const tr = opz.trema || 0;
  const P = b === 'su' ? [[7, -28], [12, -34], [8 + tr, -40]] : b === 'affondo' ? [[7, -28], [13, -27], [20, -26]] : [[7, -28], [10.5, -21], [9.5, -14.5]];
  const ago = b === 'su' ? [3.5 + tr, -49] : b === 'affondo' ? [33, -25] : [11.5, -8];
  astaD4(g, P[0][0], P[0][1], P[1][0], P[1][1], 1.3, corpo, bordo);
  astaD4(g, P[1][0], P[1][1], P[2][0], P[2][1], 1.3, corpo, bordo);
  g.strokeStyle = '#e5e7eb'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(P[2][0], P[2][1]); g.lineTo(ago[0], ago[1]); g.stroke();
  if (b !== 'giu') { // la punta che luccica: l'attacco si legge da qui
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(ago[0], ago[1], b === 'su' ? 1.5 : 1.1, 0, TAU); g.fill();
  }
}

/**
 * Il custode animato (al posto dello sprite del nemico di base). La posa segue shootCd come l'IA del
 * Burattino Scucito: salta a scatti, si ferma e ALZA l'ago (anticipo), poi affonda.
 */
function disegnaManichinoD4(n, t) {
  const P = STANZE_TEATRO_D4.camerini.posa;
  const cd = Number(n.shootCd) || 0;
  const fermo = statoRun.graziaIngressoC > 0 || n.stunTicks > 0;
  const affondo = !fermo && cd > 0 && cd <= P.affondoDa;
  const anticipo = !fermo && cd > P.affondoDa && cd <= P.anticipoDa;
  const salta = !fermo && cd > P.anticipoDa && Math.sin(t * 0.28) > 0.1;
  const verso = player.x < n.x ? -1 : 1;
  const bordo = n.champion === 'cremisi' ? '#ef4444' : n.champion === 'dorato' ? OMBRE_D4.oro : n.champion === 'elettrico' ? '#38bdf8' : OMBRE_D4.lume;
  const x = Math.round(n.x), y = Math.round(n.y) + 9;
  ctx.save();
  ombraD4(ctx, x, y + 1, 10, 3.2);
  ctx.translate(x, y - (salta ? 2.5 : 0));
  ctx.scale(verso, 1);
  ctx.rotate(anticipo ? -0.16 : affondo ? 0.2 : salta ? 0.07 : fermo ? 0 : -0.04);
  sagomaManichinoD4(ctx, {
    braccio: fermo ? 'giu' : anticipo ? 'su' : affondo ? 'affondo' : 'giu',
    bianco: n.flash > 0, bordo, trema: anticipo ? Math.sin(t * 1.3) * 0.8 : 0,
  });
  ctx.restore();
  if (n.stunTicks > 0) {
    ctx.save();
    ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(x, y - 44, 6, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}

/** La specchiera sulla parete di fondo (parte ferma: cornice, vetro, mensola, candele spente). */
function specchieraD4(g, x) {
  const y = 86;
  g.fillStyle = OMBRE_D4.buio; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x - 11, y); g.lineTo(x - 11, y - 20); g.quadraticCurveTo(x, y - 33, x + 11, y - 20); g.lineTo(x + 11, y);
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#1e2c36';
  g.beginPath();
  g.moveTo(x - 8, y - 2); g.lineTo(x - 8, y - 19); g.quadraticCurveTo(x, y - 29, x + 8, y - 19); g.lineTo(x + 8, y - 2);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(232, 201, 138, 0.4)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x - 5, y - 6); g.lineTo(x + 2, y - 21); g.stroke();
  g.beginPath(); g.moveTo(x - 1, y - 5); g.lineTo(x + 4, y - 15); g.stroke();
  // mensola del trucco con un barattolo e una piuma da cipria
  g.fillStyle = OMBRE_D4.legno; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 1;
  g.fillRect(x - 19, y, 38, 4); g.strokeRect(x - 18.5, y + 0.5, 37, 3);
  g.fillStyle = OMBRE_D4.sagoma;
  g.fillRect(x - 4, y - 4, 4, 4); g.strokeRect(x - 3.5, y - 3.5, 3, 3);
  g.fillStyle = OMBRE_D4.rosso; g.beginPath(); g.arc(x + 4, y - 2, 2, 0, TAU); g.fill();
  for (const s of [-1, 1]) { g.fillStyle = '#e9dcc0'; g.fillRect(x + s * 15 - 1, y - 8, 2, 8); }
}

/** Tutto ciò che nei Camerini non si muove, su una tela sola. */
function disegnaCameriniFermiD4(g) {
  const C = STANZE_TEATRO_D4.camerini, A = C.aspetto;
  // velo caldo e tappeto liso al centro (il premio ci sta SOPRA: vedi sopraIlTappetoD4)
  g.fillStyle = A.velo; g.fillRect(ARENA.x1 - 12, ARENA.y1 - 12, ARENA.x2 - ARENA.x1 + 24, ARENA.y2 - ARENA.y1 + 24);
  g.save();
  g.globalAlpha = 0.9;
  g.fillStyle = A.tappeto;
  g.beginPath(); g.ellipse(320, 196, 84, 34, 0, 0, TAU); g.fill();
  g.globalAlpha = 1;
  g.strokeStyle = A.cornice; g.lineWidth = 1;
  g.setLineDash([5, 3]);
  g.beginPath(); g.ellipse(320, 196, 78, 29, 0, 0, TAU); g.stroke();
  g.setLineDash([]);
  g.strokeStyle = 'rgba(176, 138, 74, 0.5)';
  for (let i = 0; i < 9; i++) { // frange consumate ai due capi
    g.beginPath(); g.moveTo(238 + (i % 3), 184 + i * 3); g.lineTo(232 - (i * 5) % 4, 185 + i * 3); g.stroke();
    g.beginPath(); g.moveTo(402 - (i % 3), 184 + i * 3); g.lineTo(408 + (i * 7) % 4, 185 + i * 3); g.stroke();
  }
  g.restore();
  for (const x of C.specchiere) specchieraD4(g, x);

  // stand dei costumi (a sinistra): sbarra su due ritti, quattro abiti appesi
  const S = C.stand;
  ombraD4(g, S.x, S.y + 13, 24, 5);
  astaD4(g, S.x - 20, S.y + 12, S.x - 20, S.y - 24, 1.6);
  astaD4(g, S.x + 20, S.y + 12, S.x + 20, S.y - 24, 1.6);
  astaD4(g, S.x - 23, S.y - 24, S.x + 23, S.y - 24, 1.6);
  const abiti = [['#5e1b26', 15], ['#1f2f4a', 19], [OMBRE_D4.sagoma, 13], ['#6b5320', 17]];
  abiti.forEach(([col, lungo], i) => {
    const ax = S.x - 15 + i * 10;
    g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(ax, S.y - 24); g.lineTo(ax, S.y - 21); g.stroke();
    sagomaD4(g, [[ax - 2, S.y - 21], [ax + 2, S.y - 21], [ax + 5, S.y - 21 + lungo], [ax - 5, S.y - 21 + lungo]], col, OMBRE_D4.lume, 0.8);
  });

  // tavolino delle parrucche (a destra): tre teste di legno, due parrucche incipriate e una rossa
  const R = C.parrucche;
  ombraD4(g, R.x, R.y + 13, 22, 5);
  astaD4(g, R.x - 14, R.y + 12, R.x - 14, R.y, 1.4);
  astaD4(g, R.x + 14, R.y + 12, R.x + 14, R.y, 1.4);
  g.fillStyle = OMBRE_D4.legno; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 1;
  g.fillRect(R.x - 19, R.y - 3, 38, 5); g.strokeRect(R.x - 18.5, R.y - 2.5, 37, 4);
  [['#e7e2d6', -12], [OMBRE_D4.rosso, 0], ['#e7e2d6', 12]].forEach(([col, dx], i) => {
    const hx = R.x + dx, hy = R.y - 12;
    g.fillStyle = OMBRE_D4.sagoma; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 0.8;
    g.fillRect(hx - 1.2, hy + 3, 2.4, 6); g.strokeRect(hx - 1.2, hy + 3, 2.4, 6);
    g.beginPath(); g.ellipse(hx, hy, 3.6, 4.4, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = col; // la parrucca: tre boccoli sopra e ai lati
    g.beginPath(); g.arc(hx, hy - 4, 3.8, 0, TAU); g.fill();
    g.beginPath(); g.arc(hx - 4, hy - 1 + (i % 2), 2.8, 0, TAU); g.fill();
    g.beginPath(); g.arc(hx + 4, hy - 1 + (i % 2), 2.8, 0, TAU); g.fill();
    if (i !== 1) { g.beginPath(); g.arc(hx - 4.5, hy + 3.5, 2.2, 0, TAU); g.fill(); g.beginPath(); g.arc(hx + 4.5, hy + 3.5, 2.2, 0, TAU); g.fill(); }
  });

  // baule dei costumi (in basso a sinistra): coperchio alzato, stoffe che escono
  const B = C.baule;
  ombraD4(g, B.x, B.y + 12, 26, 6);
  sagomaD4(g, [[B.x - 21, B.y - 12], [B.x + 21, B.y - 12], [B.x + 19, B.y - 27], [B.x - 19, B.y - 27]], OMBRE_D4.legno, OMBRE_D4.lume, 1);
  sagomaD4(g, [[B.x - 14, B.y - 8], [B.x - 4, B.y - 16], [B.x + 3, B.y - 7]], '#5e1b26', OMBRE_D4.lume, 0.8);
  sagomaD4(g, [[B.x + 2, B.y - 8], [B.x + 11, B.y - 15], [B.x + 16, B.y - 7]], '#6b5320', OMBRE_D4.lume, 0.8);
  g.fillStyle = OMBRE_D4.sagoma; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 1;
  g.fillRect(B.x - 21, B.y - 9, 42, 20); g.strokeRect(B.x - 20.5, B.y - 8.5, 41, 19);
  g.fillStyle = OMBRE_D4.oro;
  g.fillRect(B.x - 21, B.y - 9, 3, 20); g.fillRect(B.x + 18, B.y - 9, 3, 20); g.fillRect(B.x - 2, B.y - 4, 4, 5);
  sagomaD4(g, [[B.x + 8, B.y - 9], [B.x + 20, B.y - 9], [B.x + 25, B.y + 6], [B.x + 14, B.y + 2]], '#5e1b26', OMBRE_D4.lume, 0.8);

  // un manichino che resta di legno (in basso a destra)
  const M = C.manichinoFermo;
  ombraD4(g, M.x, M.y + 10, 10, 3.2);
  g.save(); g.translate(M.x, M.y + 9); sagomaManichinoD4(g, {}); g.restore();
}

/** I Camerini: arredi fermi dalla tela, fiamme delle candele vive. */
function disegnaCameriniD4(st, t) {
  const C = STANZE_TEATRO_D4.camerini;
  ctx.drawImage(telaD4('camerini', disegnaCameriniFermiD4), 0, 0, W, H);
  ctx.save();
  let i = 0;
  for (const x of C.specchiere) {
    for (const s of [-1, 1]) {
      const guizzo = Math.sin(t * 0.21 + i * 2.3) * 0.7 + Math.sin(t * 0.37 + i) * 0.4;
      const fx = x + s * 15, fy = 76;
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(fx, fy - 2, 9 + guizzo, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.ellipse(fx + guizzo * 0.3, fy - 2.4, 1.5, 3 + guizzo * 0.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.ellipse(fx + guizzo * 0.2, fy - 1.6, 0.8, 1.6, 0, 0, TAU); ctx.fill();
      i++;
    }
  }
  ctx.restore();
}

/** Corpi solidi dei Camerini (Ferruccio non attraversa baule, stand, tavolino e manichino). */
function corpiCameriniD4() {
  const C = STANZE_TEATRO_D4.camerini;
  corpoSolidoD4(C.stand); corpoSolidoD4(C.parrucche); corpoSolidoD4(C.baule); corpoSolidoD4(C.manichinoFermo);
}

/**
 * La porta di servizio: stipite di legno, tenda consunta (pieghe, orlo sfilacciato, una toppa, uno strappo)
 * e il chiodo sporgente con la punta rossa. Sostituisce i rovi di a3 su ogni porta da/verso i Camerini.
 * @param {{x:number,y:number,w:number,h:number}} p rettangolo della porta @param {number} t tick
 */
function disegnaPortaServizioD4(p, t) {
  const A = STANZE_TEATRO_D4.camerini.aspetto;
  const st = statoRun.stanzaCorrente;
  const chiusa = Boolean(st && !st.pulita);
  const x0 = p.x - p.w / 2, y0 = p.y - p.h / 2;
  ctx.save();
  ctx.fillStyle = '#0a0604'; ctx.fillRect(x0 - 5, y0 - 5, p.w + 10, p.h + 10);
  ctx.fillStyle = A.stipite; ctx.fillRect(x0 - 3, y0 - 3, p.w + 6, p.h + 6);
  ctx.fillStyle = OMBRE_D4.buio; ctx.fillRect(x0, y0, p.w, p.h);
  const pieghe = Math.max(3, Math.round(p.w / 6));
  const lp = p.w / pieghe;
  for (let i = 0; i < pieghe; i++) {
    const osc = Math.sin(t * 0.035 + i * 1.7) * 0.6;
    const strappo = i === pieghe - 2 ? p.h * 0.36 : 0;
    const orlo = y0 + p.h - 1 - ((i * 7 + 3) % 5) - strappo + osc;
    ctx.fillStyle = i % 2 ? A.tendaScura : A.tenda;
    ctx.beginPath();
    ctx.moveTo(x0 + i * lp, y0 + 1);
    ctx.lineTo(x0 + (i + 1) * lp, y0 + 1);
    ctx.lineTo(x0 + (i + 1) * lp - 0.5, orlo - 1.5);
    ctx.lineTo(x0 + (i + 0.5) * lp, orlo);
    ctx.lineTo(x0 + i * lp + 0.5, orlo - 2.2);
    ctx.closePath(); ctx.fill();
  }
  // toppa cucita
  ctx.fillStyle = A.toppa; ctx.fillRect(x0 + lp * 0.8, y0 + p.h * 0.34, 4.5, 3.5);
  ctx.fillStyle = OMBRE_D4.lume;
  ctx.fillRect(x0 + lp * 0.8, y0 + p.h * 0.34, 1, 1); ctx.fillRect(x0 + lp * 0.8 + 3.5, y0 + p.h * 0.34 + 2.5, 1, 1);
  // asta della tenda
  ctx.fillStyle = A.cornice; ctx.fillRect(x0 - 2, y0 - 1, p.w + 4, 1.6);
  // il chiodo: dallo stipite di destra verso il passaggio, la punta è rossa
  const cy = y0 + p.h * 0.55;
  ctx.strokeStyle = A.chiodo; ctx.lineWidth = 1.3; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(x0 + p.w + 2, cy - 1); ctx.lineTo(x0 + p.w - 5, cy + 1); ctx.stroke();
  ctx.fillStyle = A.chiodo; ctx.fillRect(x0 + p.w + 1, cy - 2.5, 2, 3.5);
  ctx.fillStyle = A.sangue;
  ctx.beginPath(); ctx.arc(x0 + p.w - 5, cy + 1, 1.1 + 0.25 * Math.sin(t * 0.09), 0, TAU); ctx.fill();
  if (chiusa) {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(p.x - 6, y0 + 2, 2, p.h - 4); ctx.fillRect(p.x + 4, y0 + 2, 2, p.h - 4);
  }
  ctx.strokeStyle = A.cornice; ctx.lineWidth = 1;
  ctx.strokeRect(x0 - 3.5, y0 - 3.5, p.w + 7, p.h + 7);
  ctx.restore();
}

/** Minimappa: la cella dei Camerini con lo specchio e le due candele (stessa geometria di a3). */
function minimappaCameriniD4(st) {
  const m = statoRun.mappa;
  if (!m || !st || maledizioneD('mappa')) return;
  const A = STANZE_TEATRO_D4.camerini.aspetto;
  const cell = 12, x0 = W - 118, y0 = 24, mw = 114, mh = 92;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - 5, y0 - 15, mw - 2, mh - 2); ctx.clip();
  for (const s of m.stanze) {
    if (!s.visitata || s.tipo !== 'maledetta') continue;
    const px = x0 + (s.cx - 1) * cell, py = y0 + (s.cy - 1) * cell;
    const corr = st.id === s.id;
    ctx.fillStyle = corr ? OMBRE_D4.oro : A.minimappa;
    ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
    ctx.fillStyle = corr ? '#3a2a08' : '#cfe3ea';
    ctx.strokeStyle = corr ? '#0a0604' : OMBRE_D4.lume; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(px + 6, py + 5.2, 2.3, 3.1, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = corr ? '#0a0604' : '#fbbf24';
    ctx.fillRect(px + 2, py + 7.5, 1.4, 2.5); ctx.fillRect(px + 8.6, py + 7.5, 1.4, 2.5);
  }
  ctx.restore();
}

/**
 * (correzione) Ciò che a1 disegna DENTRO la catena di disegnaStanzaPixelArt (forzieri, bombe accese) veniva
 * coperto dal fondo che a3 stende dopo: lo si ripassa sopra, in tutte le stanze di a3.
 */
function sopraIlTappetoD4(st, t) {
  if (!provaD4.sopraIlTappeto || !st || statoRun.fase !== 'in_gioco') return 0;
  let n = 0;
  if (typeof disegnaForziereA1 === 'function') for (const f of st.forzieriA1 || []) { disegnaForziereA1(f); n++; }
  if (typeof disegnaBombaAccesaA1 === 'function') for (const b of statoRun.bombeA1 || []) { disegnaBombaAccesaA1(b, t); n++; }
  return n;
}

// ===========================================================================
// 2. LA TERNA DELLA SMORFIA AL BANCO DEL LOTTO (nella Bisca di a3)
// ===========================================================================

/** Significato del numero nella smorfia (tabella di a3 più le aggiunte di SMORFIA_D4), o undefined. */
function smorfiaD4(numero) {
  return SMORFIA_A3[numero] || SMORFIA_D4[numero];
}

/** Coefficiente binomiale (numeri piccoli). */
function binomialeD4(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/**
 * Probabilità di prendere k numeri (indice k = 0..scelte): ipergeometrica, `estratti` palline senza
 * reimmissione da un panariello con i `rosa` numeri proposti, di cui `scelte` sono i tuoi.
 */
function probTernaD4(K = STANZE_TEATRO_D4.terna) {
  const tot = binomialeD4(K.rosa, K.estratti);
  const p = [];
  for (let k = 0; k <= K.scelte; k++) p.push((binomialeD4(K.scelte, k) * binomialeD4(K.rosa - K.scelte, K.estratti - k)) / tot);
  return p;
}

/**
 * Valore atteso di una terna in monete (l'oggetto Forte vale il suo prezzo in Fucina).
 * @returns {{ costo: number, senzaTerno: number, conTerno: number, prob: number[] }}
 */
function valoreAttesoTernaD4(K = STANZE_TEATRO_D4.terna) {
  const p = probTernaD4(K);
  const forte = (typeof ECONOMIA_T3 !== 'undefined' && ECONOMIA_T3.prezzi && ECONOMIA_T3.prezzi.forte) || K.valoreForte;
  const vale = (k) => { const R = K.premi[k] || {}; return (R.monete || 0) + (R.oggettoForte ? forte : 0); };
  let senza = 0;
  for (let k = 0; k < K.scelte; k++) senza += p[k] * vale(k);
  return { costo: K.costo, senzaTerno: senza, conTerno: senza + p[K.scelte] * vale(K.scelte), prob: p };
}

/** La rosa proposta: `rosa` numeri diversi fra quelli che hanno un significato, in ordine crescente. */
function rosaTernaD4(rnd = rng) {
  const K = STANZE_TEATRO_D4.terna;
  const tutti = [...new Set(Object.keys(SMORFIA_A3).concat(Object.keys(SMORFIA_D4)).map(Number))].sort((a, b) => a - b);
  for (let i = tutti.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const x = tutti[i]; tutti[i] = tutti[j]; tutti[j] = x; }
  return tutti.slice(0, K.rosa).sort((a, b) => a - b);
}

/** Estrazione: `quanti` numeri diversi dalla rosa, nell'ordine in cui escono (Fisher–Yates parziale). */
function estraiTernaD4(rosa, quanti, rnd = rng) {
  const a = rosa.slice();
  const n = Math.min(quanti, a.length);
  for (let i = 0; i < n; i++) { const j = i + Math.floor(rnd() * (a.length - i)); const x = a[i]; a[i] = a[j]; a[j] = x; }
  return a.slice(0, n);
}

/** Stato della terna nella Bisca (creato la prima volta che serve), o null fuori dalla Bisca. */
function statoTernaD4(st) {
  if (!st || st.tipo !== 'bisca') return null;
  if (!st.ternaD4) st.ternaD4 = { giocata: false, aperta: false, fase: 'scegli', rosa: null, scelti: [], cursore: 0, estratti: [], mostrati: 0, t: 0, presi: 0, voce: '', pagata: false, premio: null };
  return st.ternaD4;
}

/** Il pannello della terna aperto nella stanza corrente, o null. */
function pannelloTernaD4() {
  const st = statoRun.stanzaCorrente;
  if (statoRun.fase !== 'in_gioco' || statoRun.pausa || statoRun.siparioAttivo || statoRun.pannelloB || statoRun.scambioPendente) return null;
  return st && st.ternaD4 && st.ternaD4.aperta ? st.ternaD4 : null;
}

/** Voce di Don Gennaro: qualche sillaba grave (facoltativa: muto e OPZIONI.voceSuono la spengono). */
function voceGennaroD4(sillabe = 3, acuto = false) {
  const c = AudioSys.ctx;
  if (!c || !AudioSys.attivo || (typeof OPZIONI === 'object' && OPZIONI && OPZIONI.voceSuono === false)) return;
  try {
    const V = STANZE_TEATRO_D4.terna.voce;
    for (let i = 0; i < sillabe; i++) {
      const t = c.currentTime + i * V.passoSec;
      const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth';
      const nota = V.note[(i * 3 + sillabe) % V.note.length] * (acuto ? 1.5 : 1);
      o.frequency.setValueAtTime(nota, t);
      o.frequency.linearRampToValueAtTime(nota * 0.92, t + V.durataSec);
      f.type = 'bandpass'; f.frequency.value = V.formante[i % V.formante.length]; f.Q.value = 2.2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(V.volume, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, t + V.durataSec);
      o.connect(f); f.connect(g); g.connect(AudioSys.uscita || c.destination);
      o.onended = () => { try { o.disconnect(); f.disconnect(); g.disconnect(); } catch (_) { /* già scollegati */ } };
      o.start(t); o.stop(t + V.durataSec + 0.02);
    }
  } catch (_) { /* l'audio non deve mai fermare il gioco */ }
}

/** Un suono breve (oscillatore con inviluppo), come gli altri file. */
function suonoD4(freq, durMs, forma = 'triangle', vol = 0.07, freqFine = 0, ritardoSec = 0) {
  const c = AudioSys.ctx;
  if (!c || !AudioSys.attivo) return;
  try {
    const t = c.currentTime + ritardoSec, d = durMs / 1000;
    const o = c.createOscillator(), g = c.createGain();
    o.type = forma;
    o.frequency.setValueAtTime(freq, t);
    if (freqFine > 0) o.frequency.exponentialRampToValueAtTime(freqFine, t + d);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + d);
    o.connect(g); g.connect(AudioSys.uscita || c.destination);
    o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (_) { /* già scollegati */ } };
    o.start(t); o.stop(t + d + 0.02);
  } catch (_) { /* l'audio non deve mai fermare il gioco */ }
}

/** Apre il cartellone della terna (tasto E lì vicino). Una terna per visita; servono le monete. */
function apriTernaD4(st) {
  const K = STANZE_TEATRO_D4.terna, X = TESTI_D4.terna;
  const T = statoTernaD4(st);
  if (!T) return false;
  if (T.giocata) { avvisaA3(X.giaGiocata, 150); return false; }
  if (statoRun.monete < K.costo) { avvisaA3(X.senzaGrani(K.costo), 150); return false; }
  if (!T.rosa) T.rosa = rosaTernaD4(rng);
  T.aperta = true; T.fase = 'scegli'; T.scelti = []; T.cursore = 0; T.estratti = []; T.mostrati = 0; T.t = 0; T.presi = 0;
  T.voce = X.invito;
  player.targetX = null; player.targetY = null;
  voceGennaroD4(4);
  return true;
}

/** Chiude il cartellone (solo mentre si sceglie o a esito pagato: durante l'estrazione no). */
function chiudiTernaD4(st) {
  const T = st && st.ternaD4;
  if (!T || !T.aperta || T.fase === 'estrazione') return false;
  if (T.fase === 'esito' && !T.pagata) pagaTernaD4(st);
  T.aperta = false;
  return true;
}

/** Segna o toglie un numero della rosa (al massimo `scelte`). */
function segnaTernaD4(st, numero) {
  const K = STANZE_TEATRO_D4.terna, T = st && st.ternaD4;
  if (!T || !T.aperta || T.fase !== 'scegli' || !T.rosa.includes(numero)) return false;
  const i = T.scelti.indexOf(numero);
  if (i >= 0) T.scelti.splice(i, 1);
  else if (T.scelti.length < K.scelte) T.scelti.push(numero);
  else { suonoD4(180, 90, 'square', 0.04); return false; }
  suonoD4(i >= 0 ? 420 : 620, 60, 'triangle', 0.05);
  T.voce = T.scelti.length === K.scelte ? TESTI_D4.terna.pronta : TESTI_D4.terna.invito;
  if (T.scelti.length === K.scelte) T.cursore = K.rosa; // il cursore va sul bottone «gioca»
  return true;
}

/**
 * Paga e fa partire l'estrazione. `rnd` è il generatore dei numeri (quello del seme; la QA ne passa uno di prova).
 * @returns {number[]|null} i numeri estratti, nell'ordine in cui usciranno
 */
function giocaTernaD4(st, rnd = provaD4.rngTerna || rng) {
  const K = STANZE_TEATRO_D4.terna, T = st && st.ternaD4;
  if (!T || !T.aperta || T.fase !== 'scegli' || T.scelti.length !== K.scelte) return null;
  if (statoRun.monete < K.costo) { T.voce = TESTI_D4.terna.senzaGrani(K.costo); return null; }
  statoRun.monete -= K.costo;
  T.giocata = true; T.pagata = false; T.premio = null;
  T.estratti = estraiTernaD4(T.rosa, K.estratti, rnd);
  T.fase = 'estrazione'; T.mostrati = 0; T.presi = 0; T.t = Math.round(K.tempi.chiamataTick * 0.45);
  T.voce = TESTI_D4.terna.siTira;
  AudioSys.playMoneta();
  return T.estratti.slice();
}

/** Esce il prossimo numero: la voce lo chiama col suo significato. */
function chiamaTernaD4(st) {
  const K = STANZE_TEATRO_D4.terna, X = TESTI_D4.terna, T = st.ternaD4;
  const numero = T.estratti[T.mostrati];
  const preso = T.scelti.includes(numero);
  T.voce = X.chiamata(X.ordini[Math.min(T.mostrati, X.ordini.length - 1)], numero, smorfiaD4(numero) || '') + (preso ? X.preso : '');
  T.mostrati++;
  if (preso) { T.presi++; suonoD4(880, 260, 'triangle', 0.08, 1320); AudioSys.playMoneta(); } else suonoD4(300, 70, 'triangle', 0.05);
  voceGennaroD4(preso ? 4 : 3, preso);
  T.t = 0;
  if (T.mostrati >= T.estratti.length) { T.fase = 'esito'; T.t = -K.tempi.chiamataTick; T.attesaEsito = true; }
}

/** Consegna il premio dell'esito (una volta sola): monete a terra, e col terno un oggetto Forte. */
function pagaTernaD4(st) {
  const K = STANZE_TEATRO_D4.terna, X = TESTI_D4.terna, T = st.ternaD4;
  if (!T || T.pagata) return null;
  T.pagata = true;
  const R = K.premi[T.presi] || K.premi[0];
  let monete = R.monete || 0, oggetto = null;
  if (R.oggettoForte) {
    oggetto = daiOggettoA3(st, K.piedistallo.x, K.piedistallo.y, true);
    if (!oggetto) monete += R.ripiegoMonete || 0;
    else if (oggetto.tier !== 'forte') monete += R.ripiegoNonForte || 0; // il pool della notte non ha più oggetti Forti
  }
  if (monete > 0) daiMoneteA3(st, monete, K.posto.x - 30, K.posto.y + 50);
  T.premio = { presi: T.presi, monete, oggetto: oggetto ? oggetto.id || true : null };
  if (T.presi >= K.scelte) { scuoti(FEEL.scossa.evento); AudioSys.playCampana(); if (typeof reazionePubblicoB1 === 'function') { try { reazionePubblicoB1('applausoPieno'); } catch (_) { /* pubblico facoltativo */ } } }
  else if (T.presi > 0) AudioSys.playMoneta();
  mostraBanner(X.banner[T.presi](monete, oggetto ? nomeD(oggetto) : ''), T.presi >= 2 ? 230 : 170);
  return T.premio;
}

/** Un tick del cartellone aperto: i numeri escono uno alla volta, poi l'esito. */
function passoTernaD4(st) {
  const K = STANZE_TEATRO_D4.terna, T = st.ternaD4;
  if (!T || !T.aperta) return;
  T.t++;
  if (T.fase === 'estrazione') {
    if (T.t >= K.tempi.chiamataTick) chiamaTernaD4(st);
  } else if (T.fase === 'esito') {
    if (T.attesaEsito && T.t >= 0) { // una pausa dopo l'ultimo numero, poi Don Gennaro tira le somme
      T.attesaEsito = false;
      T.voce = TESTI_D4.terna.esiti[T.presi];
      voceGennaroD4(5, T.presi >= 2);
      pagaTernaD4(st);
    }
    if (T.t >= K.tempi.esitoTick) chiudiTernaD4(st);
  }
}

/** Riquadro della cella i della rosa nel pannello (disegno e click). */
function rettCellaTernaD4(i) {
  const P = STANZE_TEATRO_D4.terna.pannello;
  const col = i % P.colonne, riga = Math.floor(i / P.colonne);
  return { x: P.x + P.margine + col * (P.cellaL + P.spazio), y: P.y + P.grigliaY + riga * (P.cellaA + P.spazio), w: P.cellaL, h: P.cellaA };
}

function rettBottoneTernaD4() {
  const P = STANZE_TEATRO_D4.terna.pannello;
  return { x: P.x + P.w - P.margine - 176, y: P.y + P.h - 50, w: 176, h: 24 };
}

/** Tasti del cartellone (frecce/WASD, conferma, indietro). true = tasto preso. */
function tastoTernaD4(st, code) {
  const K = STANZE_TEATRO_D4.terna, T = st.ternaD4, C = K.pannello.colonne;
  const conferma = code === 'Enter' || code === 'Space' || code === 'KeyE' || code === 'NumpadEnter';
  const indietro = code === 'Escape' || code === 'KeyQ' || code === 'Backspace';
  if (T.fase === 'estrazione') { if (conferma || indietro) T.t = Math.max(T.t, K.tempi.chiamataTick - 6); return true; } // «avanti, il prossimo»
  if (T.fase === 'esito') { if ((conferma || indietro) && !T.attesaEsito) chiudiTernaD4(st); else if (conferma || indietro) T.t = Math.max(T.t, -4); return true; }
  const sulBottone = T.cursore >= K.rosa;
  if (indietro) { chiudiTernaD4(st); return true; }
  if (conferma) {
    if (sulBottone) giocaTernaD4(st); else segnaTernaD4(st, T.rosa[T.cursore]);
    return true;
  }
  const righe = Math.ceil(K.rosa / C);
  let mosso = true;
  if (code === 'ArrowLeft' || code === 'KeyA') { if (!sulBottone) T.cursore = Math.floor(T.cursore / C) * C + ((T.cursore % C) + C - 1) % C; }
  else if (code === 'ArrowRight' || code === 'KeyD') { if (!sulBottone) T.cursore = Math.floor(T.cursore / C) * C + ((T.cursore % C) + 1) % C; }
  else if (code === 'ArrowUp' || code === 'KeyW') { if (sulBottone) T.cursore = K.rosa - 1; else if (T.cursore >= C) T.cursore -= C; }
  else if (code === 'ArrowDown' || code === 'KeyS') {
    if (!sulBottone && Math.floor(T.cursore / C) < righe - 1) T.cursore += C;
    else if (!sulBottone && T.scelti.length === K.scelte) T.cursore = K.rosa;
  } else mosso = false;
  if (mosso) suonoD4(520, 30, 'triangle', 0.025);
  return true;
}

/** Click (o tocco) sul cartellone, coordinate 640×360. */
function clickTernaD4(st, mx, my) {
  const K = STANZE_TEATRO_D4.terna, P = K.pannello, T = st.ternaD4;
  const dentro = (r) => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
  if (T.fase !== 'scegli') { tastoTernaD4(st, 'Enter'); return; }
  for (let i = 0; i < T.rosa.length; i++) {
    if (dentro(rettCellaTernaD4(i))) { T.cursore = i; segnaTernaD4(st, T.rosa[i]); return; }
  }
  if (dentro(rettBottoneTernaD4())) { T.cursore = K.rosa; giocaTernaD4(st); return; }
  if (!dentro(P)) chiudiTernaD4(st);
}

// tasti e click del cartellone: in cattura, prima dei gestori di base (che così non muovono né attaccano);
// gamepad e tocco arrivano da b3 come tasti sintetici (contesto «menu»: vedi il registro in fondo al file)
window.addEventListener('keydown', (e) => {
  const T = pannelloTernaD4();
  if (!T || e.ctrlKey || e.metaKey || e.altKey || /^F\d+$/.test(e.code)) return;
  try { tastoTernaD4(statoRun.stanzaCorrente, e.code); } catch (err) { console.error('[d4] tasto della terna', err); }
  e.preventDefault(); e.stopImmediatePropagation();
}, true);

window.addEventListener('mousedown', (e) => {
  const T = pannelloTernaD4();
  if (!T || e.target !== canvas) return;
  const r = canvas.getBoundingClientRect();
  try { clickTernaD4(statoRun.stanzaCorrente, (e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)); } catch (err) { console.error('[d4] click della terna', err); }
  e.preventDefault(); e.stopImmediatePropagation();
}, true);

// click sul cartellone quando sei vicino: come il tasto E
canvas.addEventListener('mousedown', (e) => {
  const st = statoRun.stanzaCorrente;
  if (statoRun.fase !== 'in_gioco' || !st || st.tipo !== 'bisca' || pannelloTernaD4()) return;
  const P = STANZE_TEATRO_D4.terna.posto;
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height);
  if (Math.hypot(mx - P.x, my - (P.y - 10)) < 26 && Math.hypot(player.x - P.x, player.y - P.y) < P.raggioUso) {
    interagisciStanza();
    player.targetX = null; player.targetY = null;
  }
});

/** Tasto E nella Bisca vicino al cartellone (il piedistallo ha la precedenza, come in a3). true = gestito. */
function interagisciTernaD4(st) {
  if (!st || st.tipo !== 'bisca' || statoRun.fase !== 'in_gioco') return false;
  const P = STANZE_TEATRO_D4.terna.posto, o = st.oggettoPiedistallo;
  if (o && !o.preso && Math.hypot(player.x - o.x, player.y - o.y) < 52) return false;
  if (Math.hypot(player.x - P.x, player.y - P.y) >= P.raggioUso) return false;
  apriTernaD4(st);
  return true;
}

/** Il cartellone della terna nella Bisca: cavalletto, tabella dei numeri, il panariello ai piedi. */
function disegnaCartelloneFermoD4(g) {
  const P = STANZE_TEATRO_D4.terna.posto, x = P.x, y = P.y;
  ombraD4(g, x, y + 13, 20, 5);
  astaD4(g, x - 10, y - 26, x - 15, y + 12, 1.5);
  astaD4(g, x + 10, y - 26, x + 15, y + 12, 1.5);
  astaD4(g, x, y - 24, x + 3, y + 9, 1.3);
  g.fillStyle = OMBRE_D4.sagoma; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 1;
  g.fillRect(x - 17, y - 34, 34, 28); g.strokeRect(x - 16.5, y - 33.5, 33, 27);
  g.fillStyle = OMBRE_D4.oro; g.fillRect(x - 15, y - 32, 30, 4);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      g.fillStyle = (r * 5 + c) % 4 === 1 ? OMBRE_D4.rosso : '#e9dcc0';
      g.fillRect(x - 14 + c * 6, y - 25 + r * 6, 4, 4);
    }
  }
  // il panariello di vimini con le palline
  sagomaD4(g, [[x - 28, y + 3], [x - 14, y + 3], [x - 16, y + 12], [x - 26, y + 12]], OMBRE_D4.legno, OMBRE_D4.lume, 1);
  g.strokeStyle = 'rgba(232, 201, 138, 0.5)'; g.lineWidth = 0.7;
  g.beginPath(); g.moveTo(x - 27, y + 6); g.lineTo(x - 15, y + 6); g.moveTo(x - 26.5, y + 9); g.lineTo(x - 15.5, y + 9); g.stroke();
  g.fillStyle = '#e9dcc0';
  g.beginPath(); g.arc(x - 23, y + 2, 2, 0, TAU); g.fill();
  g.beginPath(); g.arc(x - 19, y + 1.5, 2, 0, TAU); g.fill();
}

function disegnaCartelloneD4(st, t) {
  const K = STANZE_TEATRO_D4.terna, X = TESTI_D4.terna, P = K.posto;
  const T = st.ternaD4;
  ctx.drawImage(telaD4('cartellone', disegnaCartelloneFermoD4), 0, 0, W, H);
  const giocata = Boolean(T && T.giocata);
  drawPillLabel(giocata ? X.cartelloGiocata : X.cartello(K.costo), P.x, P.y - 44, 140, {
    size: 7.5, color: giocata ? '#9ca3af' : '#fde68a', border: giocata ? '#4b5563' : OMBRE_D4.oro,
  });
}

/** Una pallina numerata (i tuoi numeri, gli estratti). */
function pallinaTernaD4(x, y, r, numero, stato) {
  ctx.fillStyle = stato === 'presa' ? OMBRE_D4.oro : stato === 'uscita' ? '#e9dcc0' : stato === 'mia' ? '#3a2412' : '#1c120a';
  ctx.strokeStyle = stato === 'vuota' ? '#5c4024' : stato === 'presa' ? '#fff7d6' : OMBRE_D4.lume;
  ctx.lineWidth = stato === 'presa' ? 2 : 1;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
  if (numero != null) drawTextFit(String(numero), x, y + 3.5, r * 2 - 3, { size: 9.5, color: stato === 'presa' || stato === 'uscita' ? '#1c0f07' : '#fde68a', shadow: false });
}

/** Il pannello della terna sopra la scena. */
function disegnaPannelloTernaD4(t) {
  const T = pannelloTernaD4();
  if (!T) return;
  const K = STANZE_TEATRO_D4.terna, X = TESTI_D4.terna, P = K.pannello, cx = P.x + P.w / 2;
  const usciti = T.estratti.slice(0, T.mostrati);
  ctx.save();
  ctx.fillStyle = 'rgba(5, 3, 2, 0.62)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#140c08'; ctx.fillRect(P.x, P.y, P.w, P.h);
  ctx.strokeStyle = OMBRE_D4.oro; ctx.lineWidth = 2; ctx.strokeRect(P.x + 1, P.y + 1, P.w - 2, P.h - 2);
  ctx.strokeStyle = '#7c5227'; ctx.lineWidth = 1; ctx.strokeRect(P.x + 5.5, P.y + 5.5, P.w - 11, P.h - 11);
  drawTextFit(X.titolo(K.costo), cx, P.y + 20, P.w - 40, { size: 11, color: OMBRE_D4.oro });
  drawTextFit(T.voce, cx, P.y + 35, P.w - 30, { size: 8.5, style: 'italic', weight: '', color: '#f1e3c4' });
  for (let i = 0; i < T.rosa.length; i++) {
    const r = rettCellaTernaD4(i), num = T.rosa[i];
    const mio = T.scelti.includes(num), uscito = usciti.includes(num);
    const ultimo = uscito && usciti[usciti.length - 1] === num && T.fase === 'estrazione';
    ctx.fillStyle = mio && uscito ? '#6b4c0f' : mio ? '#3a2412' : uscito ? '#2a1a1a' : '#1c120a';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = mio ? OMBRE_D4.oro : uscito ? '#8a6a4a' : '#5c4024';
    ctx.lineWidth = mio ? 2 : 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    const spento = T.fase !== 'scegli' && !mio && !uscito;
    drawTextFit(String(num), r.x + r.w / 2, r.y + 17, r.w - 24, { size: 14, color: mio ? '#fde68a' : spento ? '#6b5a44' : '#e9dcc0' });
    drawTextFit(smorfiaD4(num) || '', r.x + r.w / 2, r.y + 31, r.w - 6, { size: 7.5, weight: '', style: 'italic', color: mio ? '#fde68a' : spento ? '#6b5a44' : '#c9a679' });
    if (mio) drawTextFit(mio && uscito ? '★' : '✓', r.x + r.w - 7, r.y + 10, 10, { size: 7.5, color: OMBRE_D4.oro, shadow: false });
    else if (uscito) drawTextFit('●', r.x + r.w - 7, r.y + 10, 10, { size: 7, color: '#e9dcc0', shadow: false });
    if (ultimo) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.strokeRect(r.x - 1.5, r.y - 1.5, r.w + 3, r.h + 3); }
    if (T.fase === 'scegli' && T.cursore === i) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.7 + 0.3 * Math.sin(t * 0.2)).toFixed(2)})`;
      ctx.lineWidth = 2; ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
    }
  }
  // riga di sotto: i tuoi tre numeri a sinistra; a destra il bottone, poi le cinque palline estratte
  const yb = P.y + P.h - 38;
  drawTextFit(X.tuoi, P.x + P.margine + 28, yb - 13, 70, { size: 7, weight: '', color: '#c9a679' });
  for (let i = 0; i < K.scelte; i++) {
    const num = T.scelti[i];
    pallinaTernaD4(P.x + P.margine + 12 + i * 27, yb + 3, 11, num == null ? null : num, num == null ? 'vuota' : usciti.includes(num) ? 'presa' : 'mia');
  }
  if (T.fase === 'scegli') {
    const B = rettBottoneTernaD4(), pronta = T.scelti.length === K.scelte, sopra = T.cursore >= K.rosa;
    ctx.fillStyle = pronta ? '#5a1414' : '#1c120a'; ctx.fillRect(B.x, B.y, B.w, B.h);
    ctx.strokeStyle = pronta ? OMBRE_D4.oro : '#5c4024'; ctx.lineWidth = sopra ? 2.5 : 1;
    ctx.strokeRect(B.x + 0.5, B.y + 0.5, B.w - 1, B.h - 1);
    if (sopra) { ctx.strokeStyle = `rgba(255, 255, 255, ${(0.7 + 0.3 * Math.sin(t * 0.2)).toFixed(2)})`; ctx.lineWidth = 2; ctx.strokeRect(B.x - 2, B.y - 2, B.w + 4, B.h + 4); }
    drawTextFit(pronta ? X.bottone(K.costo) : X.bottoneMancano(K.scelte - T.scelti.length), B.x + B.w / 2, B.y + 15.5, B.w - 12, { size: 9, color: pronta ? '#fde68a' : '#8a7a5c' });
  } else {
    drawTextFit(X.estratti, P.x + P.w - P.margine - 66, yb - 13, 130, { size: 7, weight: '', color: '#c9a679' });
    for (let i = 0; i < K.estratti; i++) {
      const num = i < T.mostrati ? T.estratti[i] : null;
      pallinaTernaD4(P.x + P.w - P.margine - 120 + i * 27, yb + 3, 11, num, num == null ? 'vuota' : T.scelti.includes(num) ? 'presa' : 'uscita');
    }
    if (T.fase === 'esito' && !T.attesaEsito) {
      drawTextFit(X.titoliEsito[T.presi], cx - 8, yb + 8, 130, { size: 13, color: T.presi >= 2 ? OMBRE_D4.oro : T.presi === 1 ? '#fde68a' : '#9ca3af' });
    }
  }
  drawTextFit(T.fase === 'scegli' ? X.aiutoScegli : T.fase === 'esito' ? X.aiutoEsito : X.aiutoEstrazione, cx, P.y + P.h - 9, P.w - 30, { size: 7, weight: '', color: '#9ca3af' });
  ctx.restore();
}


// ===========================================================================
// 3. LA BUCA DELL'ORCHESTRA (stanza nuova, tipo `buca`)
// ===========================================================================

// Il pezzo della Buca nella tabella dei temi di a8 (tarantella d'orchestra, originale): si aggiunge solo se manca.
if (typeof MUSICA !== 'undefined' && MUSICA.temi && !MUSICA.temi[STANZE_TEATRO_D4.buca.tema] && Object.isExtensible(MUSICA.temi)) {
  MUSICA.temi[STANZE_TEATRO_D4.buca.tema] = {
    bpm: STANZE_TEATRO_D4.buca.bpm, radice: 62, scala: 'armonica', basso: 'X..x..', organetto: '.xx.xx', tamburello: 'X..X..', strato: true, volume: 1,
    accordi: ['i', 'i', 'iv', 'V', 'i', 'VI', 'iv', 'V'],
    melodia: ['0 2 4 7 . 4', '5 4 2 4 - .', '3 5 7 8 . 7', '6 - 4 6 . .', '7 . 7 9 7 5', '5 . 5 7 5 3', '3 2 3 5 3 1', '4 - 6 7 - -'],
  };
}

/**
 * Aggancio di a8-musica.js (temaCorrente): nella Buca, a concerto in corso, suona il pezzo dell'orchestra.
 * @param {object} sr lo stato della run @param {(base: string, radice?: number, combattimento?: boolean) => object} tema
 */
function temaMusicaD4(sr, tema) {
  const st = sr && sr.stanzaCorrente;
  if (!st || st.tipo !== 'buca' || !st.bucaD4 || !st.bucaD4.attiva) return null;
  const nome = STANZE_TEATRO_D4.buca.tema;
  return typeof MUSICA !== 'undefined' && MUSICA.temi[nome] ? tema(nome, null, false) : null;
}

/** Tick di logica per PASSO del pezzo (6 passi per battuta, 3 per tempo): lo stesso bpm della musica. */
function tickPerPassoD4() {
  return (60 / STANZE_TEATRO_D4.buca.bpm / 3) * FEEL.passo.hz;
}

/** Posizione in passi del pezzo della Buca se sta suonando davvero (audio acceso, contesto partito), o null. */
function posizioneMusicaD4() {
  if (provaD4.senzaMusica) return null;
  try {
    if (typeof Musica === 'undefined' || typeof Musica.posizionePassi !== 'function') return null;
    const v = Musica.posizionePassi(STANZE_TEATRO_D4.buca.tema);
    return Number.isFinite(v) && v >= 0 ? v : null;
  } catch (_) { return null; }
}

/**
 * L'orologio della Buca, un tick di logica alla volta: segue il sequencer di a8 quando il pezzo suona, altrimenti
 * un metronomo interno con lo stesso bpm (il gioco non dipende dall'audio). Quando la musica manca il metronomo
 * riparte dal punto in cui era, quando torna ci si riaggancia.
 * @returns {number} il passo nella battuta (0..5) appena cominciato, o -1 se in questo tick non ne comincia nessuno
 */
function avanzaOrologioD4(B) {
  const K = STANZE_TEATRO_D4.buca;
  const a = posizioneMusicaD4();
  if (a !== null) { B.pos = a; B.fonte = 'musica'; } else { B.pos += 1 / tickPerPassoD4(); B.fonte = 'metronomo'; }
  const p = Math.floor(B.pos);
  if (p === B.passoVisto) return -1;
  B.passoVisto = p;
  return ((p % K.passiPerBattuta) + K.passiPerBattuta) % K.passiPerBattuta;
}

/**
 * Il tempo corrente della Buca, per chi vuole andare a tempo (sola lettura), o null fuori dal concerto.
 * passo 0..5 nella battuta, battuta e tempo contati dall'ingresso, fase 0..1 dentro il tempo, fonte del battito.
 */
function battitoD4() {
  const st = statoRun.stanzaCorrente, B = st && st.bucaD4;
  if (!B || !B.attiva) return null;
  const K = STANZE_TEATRO_D4.buca, n = K.passiPerBattuta, meta = n / 2;
  const nellaBattuta = ((B.pos % n) + n) % n;
  return { passo: Math.floor(nellaBattuta), battuta: B.battuta, tempo: B.tempo, fase: (nellaBattuta % meta) / meta, fonte: B.fonte, bpm: K.bpm };
}

function probBucaD4(piano) {
  const tab = STANZE_TEATRO_D4.buca.probPerPiano;
  const chiavi = Object.keys(tab).map(Number).sort((a, b) => a - b);
  const k = chiavi.filter((c) => c <= piano).pop() ?? chiavi[0];
  return tab[k] || 0;
}

function nuovoStatoBucaD4(ondateTot) {
  return {
    ondateTot, ondata: 0, attiva: false, finita: false, colpito: false, esito: null, premio: null, bis: 0, scambioVisto: false,
    pos: 0, passoVisto: -1, battuta: 0, tempo: 0, tickDalTempo: 0, tickDallaBattuta: 0, battere: true, prossima: STANZE_TEATRO_D4.buca.battuteAttacco + 1,
    ingressi: [],              // (QA) quando è entrata ogni ondata: { ondata, battuta, pos, fonte }
    fonte: 'metronomo', hpVisto: 0, viteViste: 0, fineTick: 0,
  };
}

/**
 * Appende al piano la Buca dell'Orchestra: una foglia con una sola porta attaccata a una stanza di combattimento,
 * in una cella libera che non confina col boss né con la segreta (vedi STANZE_TEATRO_D4.buca.soloVicoloCieco).
 * Al massimo una per piano; mai al piano 1 la prima notte. Se non c'è posto, questo piano non ha la Buca.
 */
function aggiungiBucaD4(m, piano) {
  const K = STANZE_TEATRO_D4.buca;
  if (!m || m.stanze.some((s) => s.tipo === 'buca')) return null;
  if (K.saltaPrimaNottePiano1 && piano === 1 && (Number(statoRun.numeroNotte) || 1) <= 1) return null;
  if (!(rng() < (provaD4.probBuca ?? probBucaD4(piano)))) return null;
  const G = MAPPA_PIANO;
  const key = (x, y) => `${x},${y}`;
  const griglia = new Map(m.stanze.filter((s) => s.cx >= 1 && s.cy >= 1).map((s) => [key(s.cx, s.cy), s]));
  const dentro = (x, y) => x >= 1 && x <= G.larghezza && y >= 1 && y <= G.altezza;
  for (const g of shuffle(m.stanze.filter((s) => K.genitori.includes(s.tipo)))) {
    for (const d of shuffle(DIREZIONI_A3)) {
      const nx = g.cx + d.dx, ny = g.cy + d.dy;
      if (!dentro(nx, ny) || griglia.has(key(nx, ny))) continue;
      if (g.porte[d.lato] || (g.muroSegreto && g.muroSegreto.lato === d.lato)) continue;
      const vicini = DIREZIONI_A3.map((d2) => griglia.get(key(nx + d2.dx, ny + d2.dy))).filter(Boolean);
      if (!vicini.includes(g) || vicini.some((v) => K.maiAccantoA.includes(v.tipo))) continue;
      if ((provaD4.bucaVicoloCieco ?? K.soloVicoloCieco) && vicini.length !== 1) continue;
      const s = creaStanzaA3(`r${m.stanze.length}`, 'buca', nx, ny);
      g.porte[d.lato] = s.id;
      s.porte[d.opposto] = g.id;
      s.bucaD4 = nuovoStatoBucaD4(K.ondateMin + Math.floor(rng() * (K.ondateMax - K.ondateMin + 1)));
      m.stanze.push(s);
      m.perId.set(s.id, s);
      return s;
    }
  }
  return null;
}

/** Dove sta il direttore in questa stanza (si sposta se la porta è a nord). */
function postoDirettoreD4(st) {
  const D = STANZE_TEATRO_D4.buca.direttore;
  return { x: st && st.porte && st.porte.N ? D.xConPortaNord : D.x, y: D.y, r: D.r };
}

/** Un colpo di timpano (seno che cade). */
function timpanoD4(forte = 1, ritardoSec = 0) {
  suonoD4(96, 320, 'sine', 0.22 * forte, 52, ritardoSec);
}

/** L'applauso dell'orchestra: raffiche di rumore filtrato (solo se non applaude già il pubblico di b1). */
function applausoD4() {
  const c = AudioSys.ctx;
  if (!c || !AudioSys.attivo) return;
  try {
    const durata = 2.6, buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.05), c.sampleRate);
    const d = buf.getChannelData(0);
    let x = 987654321;
    for (let i = 0; i < d.length; i++) { x = (x * 1103515245 + 12345) >>> 0; d[i] = ((x / 4294967296) * 2 - 1) * (1 - i / d.length); }
    const uscita = c.createGain();
    uscita.gain.setValueAtTime(0.16, c.currentTime);
    uscita.gain.linearRampToValueAtTime(0.0001, c.currentTime + durata);
    uscita.connect(AudioSys.uscita || c.destination);
    for (let k = 0; k < 70; k++) {
      x = (x * 1103515245 + 12345) >>> 0;
      const s = c.createBufferSource(), f = c.createBiquadFilter();
      s.buffer = buf; f.type = 'bandpass'; f.frequency.value = 1400 + (x % 1800); f.Q.value = 0.9;
      s.connect(f); f.connect(uscita);
      s.start(c.currentTime + (k / 70) * durata * 0.92 + ((x >>> 8) % 30) / 1000);
    }
    setTimeout(() => { try { uscita.disconnect(); } catch (_) { /* già scollegato */ } }, (durata + 0.5) * 1000);
  } catch (_) { /* l'audio non deve mai fermare il gioco */ }
}

/** Entrando nella Buca: se il concerto non è finito, il pezzo (ri)comincia e le porte si chiudono. */
function dopoIngressoBucaD4(st) {
  const B = st.bucaD4;
  if (!B) return;
  B.hpVisto = statoRun.hpHalf; B.viteViste = statoRun.viteExtra || 0;
  if (B.finita) return;
  B.attiva = true;
  st.pulita = false;
  B.pos = 0; B.passoVisto = -1; B.tickDalTempo = 0; B.tickDallaBattuta = 0;
  if (B.ondata === 0) { B.battuta = 0; B.tempo = 0; B.prossima = STANZE_TEATRO_D4.buca.battuteAttacco + 1; B.ingressi = []; }
  mostraBanner(TESTI_D4.buca.ingresso(B.ondateTot), 250);
}

/** Un comprimario dell'ondata diventa orchestrale: la sua parte al posto dell'IA di base (che resta ferma). */
function preparaOrchestraleD4(n, B) {
  const K = STANZE_TEATRO_D4.buca;
  const perComportamento = { volo_puro: 'vespa_cieca', balzo: 'gatto', host_scudo: 'maschera', torretta_croce: 'statua', bomba_ferma: '' };
  const chiave = n.comportamento ? (perComportamento[n.comportamento] ?? n.tipo) : n.tipo;
  const parte = K.parti[chiave];
  if (!parte) return false; // tipi senza parte (il Bozzo esplosivo): tengono la loro IA
  n.bucaD4 = { parte, i: -K.accordaturaTempi - 1, sfasa: (B.ondata % 2) * 2, vel: n.speed, sc: 0, scTot: 1, sdx: 0, sdy: 0, sdist: 0, balzo: false, posa: '', posaTick: 0, giri: 0 };
  n.speed = 0; n.shootCd = 999; n.leapTimer = 0; n.crouchTicks = 0; n.maskOpen = false; n.vx = 0; n.vy = 0;
  return true;
}

/** Entra un'ondata: i comprimari del piano (gli stessi temi delle stanze di combattimento), lontano da porte e Ferruccio. */
function entraOndataD4(st, B) {
  const X = TESTI_D4.buca;
  B.ondata++;
  const finta = { id: `${st.id}-b${B.ondata}`, tipo: 'normale', porte: {}, nemici: [], ostacoli: [], oggettiATerra: [] };
  popolaStanza(finta, statoRun.piano);
  const vivi = st.nemici.filter((n) => n.hp > 0);
  const vietati = porteVietateC(st).concat([{ x: player.x, y: player.y }]);
  const posti = vivi.map((n) => ({ x: n.x, y: n.y }));
  for (const n of finta.nemici) {
    const p = puntoLontanoDallePorteC(n.x, n.y, vietati, posti);
    n.x = p.x; n.y = p.y; posti.push(p);
    preparaOrchestraleD4(n, B);
    statoRun.ondeEsplosione.push({ x: n.x, y: n.y - 4, r: 3, maxR: 18, color: OMBRE_D4.oro, tick: 0 }); // tick: 0 serve a 60-resa.js per farla sparire
  }
  st.nemici = vivi.concat(finta.nemici);
  B.ingressi.push({ ondata: B.ondata, battuta: B.battuta, pos: B.pos, fonte: B.fonte });
  timpanoD4(1); timpanoD4(0.8, 0.14);
  scuoti(FEEL.scossa.evento);
  mostraBanner(B.ondata >= B.ondateTot ? X.ultima(B.ondateTot) : X.ondata(B.ondata, B.ondateTot), 120);
  return finta.nemici.length;
}

/** Sul battere (inizio di battuta): si contano le battute e, se è ora, entra l'ondata. */
function alBattereD4(st, B) {
  const K = STANZE_TEATRO_D4.buca;
  B.battuta++; B.tickDallaBattuta = 0;
  if (B.ondata === 0) suonoD4(1650, 28, 'square', 0.035); // la bacchetta sul leggio: l'attacco
  if (B.ondata >= B.ondateTot) return;
  const vuoto = st.nemici.every((n) => n.hp <= 0);
  const anticipo = K.anticipa && B.ondata > 0 && vuoto && (B.battuta - 1) % K.fraseBattute === 0;
  if (B.battuta >= B.prossima || anticipo) {
    entraOndataD4(st, B);
    B.prossima = B.battuta + K.battutePerOndata;
  }
}

/** Avvia lo scatto di un orchestrale: `dist` px nella direzione `ang`, spalmati sui primi tick del tempo. */
function scattoD4(n, R, ang, dist, balzo) {
  const D = Math.max(4, Math.round(tickPerPassoD4() * 3 * STANZE_TEATRO_D4.buca.scattoFrazione));
  R.sc = D; R.scTot = D; R.sdx = Math.cos(ang); R.sdy = Math.sin(ang); R.sdist = Math.max(0, dist); R.balzo = Boolean(balzo);
}

/** Una mossa della partitura (vedi STANZE_TEATRO_D4.buca.parti). */
function eseguiMossaD4(n, R, m) {
  const K = STANZE_TEATRO_D4.buca, P = R.parte;
  const tickTempo = tickPerPassoD4() * 3;
  const ang = Math.atan2(player.y - n.y, player.x - n.x);
  const lontano = Math.hypot(player.x - n.x, player.y - n.y);
  const colpo = (a, extra) => {
    const pr = { x: n.x, y: n.y - 6, vx: Math.cos(a) * P.colpo, vy: Math.sin(a) * P.colpo, dist: 0 };
    statoRun.proiettiliNemici.push(extra ? Object.assign(pr, extra) : pr);
  };
  if (m === 'p' || m === 'P') {
    const dev = P.devia ? (R.giri++ % 2 ? -P.devia : P.devia) : 0;
    scattoD4(n, R, ang + dev, Math.min(R.vel * tickTempo * (m === 'P' ? P.balzo : P.passo), Math.max(0, lontano - 4)), m === 'P');
  } else if (m === 'c') {
    R.posa = 'carica'; R.posaTick = Math.round(tickTempo);
    if (P.rinculo) scattoD4(n, R, ang + Math.PI, P.rinculo, false);
  } else if (m === 's') colpo(ang);
  else if (m === 'a') colpo(ang, { maxDist: P.gittata });
  else if (m === 'd') { colpo(ang - P.apertura); colpo(ang + P.apertura); }
  else if (m === 'v') { colpo(ang - P.apertura); colpo(ang); colpo(ang + P.apertura); }
  else if (m === '+') {
    const giro = (R.giri++ % 2) * (Math.PI / 4);
    for (let k = 0; k < 4; k++) colpo(giro + (k * Math.PI) / 2);
  }
  if (m === 's' || m === 'a' || m === 'd' || m === 'v' || m === '+') { R.posa = 'colpo'; R.posaTick = K.posaColpoTick; }
}

/** Su ogni tempo (due per battuta): ogni orchestrale suona la mossa successiva della sua parte. */
function alTempoD4(st, B, battere) {
  B.tempo++; B.tickDalTempo = 0; B.battere = battere;
  for (const n of st.nemici) {
    const R = n.bucaD4;
    if (!R || n.hp <= 0) continue;
    R.i++;
    if (R.i < 0 || n.stunTicks > 0 || statoRun.graziaIngressoC > 0) continue;
    const P = R.parte.partitura;
    eseguiMossaD4(n, R, P[(R.i + R.sfasa) % P.length]);
  }
}

/** Ogni tick: gli scatti in corso e le pose (i contatori dell'IA di base restano fermi sul valore della posa). */
function passoOrchestraliD4(st) {
  for (const n of st.nemici) {
    const R = n.bucaD4;
    if (!R || n.hp <= 0) continue;
    const posa = R.posaTick > 0 ? R.posa : '';
    if (R.posaTick > 0) R.posaTick--;
    const V = R.parte.posa;
    n.speed = 0;
    n.shootCd = posa && V && V[posa] ? V[posa] : 999;
    if (n.tipo === 'gatto') n.crouchTicks = posa === 'carica' ? Math.max(1, R.posaTick) : 0;
    if (n.tipo === 'maschera') n.maskOpen = posa !== '';
    if (R.sc > 0 && !(n.stunTicks > 0)) {
      const u0 = 1 - R.sc / R.scTot;
      R.sc--;
      const u1 = 1 - R.sc / R.scTot;
      const d = R.sdist * ((1 - (1 - u1) * (1 - u1)) - (1 - (1 - u0) * (1 - u0)));
      n.x = Math.max(ARENA.x1 + 14, Math.min(ARENA.x2 - 14, n.x + R.sdx * d));
      n.y = Math.max(ARENA.y1 + 14, Math.min(ARENA.y2 - 14, n.y + R.sdy * d));
      if (n.tipo === 'gatto' && R.balzo) { n.leapTimer = R.sc; n.vx = 0; n.vy = 0; }
    }
  }
}

/** Fine del concerto (dopo verificaStanzaPulita di base): premio normale, o doppio con l'applauso se nessun colpo è andato a segno. */
function chiudiBucaD4(st) {
  const K = STANZE_TEATRO_D4.buca, X = TESTI_D4.buca, B = st.bucaD4;
  B.attiva = false; B.finita = true; B.fineTick = 0;
  const pulito = !B.colpito;
  B.esito = pulito ? 'applauso' : 'normale';
  const molt = pulito ? K.moltiplicaSenzaDanni : 1;
  const P = K.piedistallo;
  let monete = K.premio.monete * molt, oggetti = K.premio.oggetti * molt;
  const primo = oggetti > 0 ? daiOggettoA3(st, P.x, P.y) : null;
  if (oggetti > 0 && !primo) { monete += K.premio.ripiegoMonete * oggetti; oggetti = 0; }
  B.bis = Math.max(0, oggetti - 1);
  daiMoneteA3(st, monete, P.x, P.y + 44);
  B.premio = { doppio: pulito, monete, oggetti };
  const pubblico = typeof reazionePubblicoB1 === 'function' && OPZIONI.pubblico;
  if (pubblico) { try { reazionePubblicoB1(pulito ? 'ovazione' : 'applauso'); } catch (_) { /* pubblico facoltativo */ } }
  if (pulito && !pubblico) applausoD4();
  if (pulito) { timpanoD4(1); timpanoD4(1, 0.12); timpanoD4(1.1, 0.24); }
  mostraBanner(pulito ? X.applauso(monete, oggetti) : X.finita(monete, oggetti), 270);
}

/** Dopo il premio doppio: presa la prima reliquia, sul piedistallo compare la seconda («bis»). */
function bisD4(st, B) {
  const K = STANZE_TEATRO_D4.buca, X = TESTI_D4.buca;
  B.fineTick++;
  if (!(B.bis > 0) || statoRun.scambioPendente) return;
  const o = st.oggettoPiedistallo;
  if (o && !o.preso && !B.scambioVisto) return; // la prima è ancora lì
  B.bis--;
  if ((!o || o.preso)) {
    const nuovo = daiOggettoA3(st, K.piedistallo.x, K.piedistallo.y);
    if (nuovo) { suonoD4(880, 380, 'triangle', 0.07, 1320); mostraBanner(X.bis(nomeD(nuovo)), 220); return; }
  }
  // piedistallo occupato dallo scambio (o pool finito): la seconda reliquia diventa grani
  daiMoneteA3(st, K.premio.ripiegoMonete, K.piedistallo.x, K.piedistallo.y + 44);
  mostraBanner(X.bisGrani(K.premio.ripiegoMonete), 200);
}

/** Un tick della Buca (dopo passoLogico di base). */
function passoBucaD4(st) {
  const K = STANZE_TEATRO_D4.buca, B = st.bucaD4;
  if (!B) return;
  if (B.attiva && (statoRun.hpHalf < B.hpVisto || (statoRun.viteExtra || 0) < B.viteViste)) B.colpito = true;
  B.hpVisto = statoRun.hpHalf; B.viteViste = statoRun.viteExtra || 0;
  if (B.attiva) {
    if (st.pulita && B.ondata < B.ondateTot) st.pulita = false; // il concerto non è finito: le porte restano chiuse
    B.tickDalTempo++; B.tickDallaBattuta++;
    const s = avanzaOrologioD4(B);
    if (s === 0 || s === K.passiPerBattuta / 2) {
      // un tempo «vero» arriva almeno mezzo tempo dopo il precedente: più vicino è un riaggancio alla musica
      // (il pezzo che parte o riparte dopo il muto), e non si conta due volte
      const tickTempo = tickPerPassoD4() * (K.passiPerBattuta / 2);
      if (B.tempo === 0 || B.tickDalTempo >= tickTempo * 0.5) {
        if (s === 0 && (B.battuta === 0 || B.tickDallaBattuta >= tickTempo)) alBattereD4(st, B);
        alTempoD4(st, B, s === 0);
      }
    }
    passoOrchestraliD4(st);
    if (B.ondata >= B.ondateTot && !st.pulita && st.nemici.every((n) => n.hp <= 0)) verificaStanzaPulita();
  } else if (B.finita) bisD4(st, B);
  corpoSolidoD4(K.timpani); corpoSolidoD4(K.contrabbasso); corpoSolidoD4(postoDirettoreD4(st));
}

// --- resa della Buca ---

/** I leggii della stanza: quelli della fila di fondo lasciano il posto a direttore e metronomo. */
function leggiiD4(portaNord) {
  const K = STANZE_TEATRO_D4.buca;
  const dx = portaNord ? K.direttore.xConPortaNord : K.direttore.x;
  return K.leggii.filter(([x, y]) => y > K.filaDiFondoY || (Math.abs(x - dx) > 26 && Math.abs(x - (dx + K.metronomoDx)) > 24 && !(portaNord && Math.abs(x - 320) < 34)));
}

/** Un leggio col foglio di musica. */
function leggioD4(g, x, y) {
  astaD4(g, x, y + 9, x - 5, y + 12, 1.1); astaD4(g, x, y + 9, x + 5, y + 12, 1.1);
  astaD4(g, x, y + 10, x, y - 6, 1.3);
  sagomaD4(g, [[x - 8, y - 5], [x + 8, y - 7], [x + 8, y - 16], [x - 8, y - 14]], OMBRE_D4.sagoma, OMBRE_D4.lume, 1);
  sagomaD4(g, [[x - 6, y - 6.5], [x + 6, y - 8], [x + 6, y - 14.5], [x - 6, y - 13]], '#e9dcc0', null);
  g.fillStyle = '#1c0f07';
  for (let i = 0; i < 4; i++) g.fillRect(x - 4.5 + i * 2.6, y - 11.5 - (i % 2) * 1.6 - i * 0.25, 1.4, 1.2);
}

/** Tutto ciò che nella Buca non si muove: assi del fondo, leggii, timpani, contrabbasso. */
function disegnaBucaFermaD4(g, portaNord) {
  const K = STANZE_TEATRO_D4.buca, A = K.aspetto;
  g.fillStyle = A.velo; g.fillRect(ARENA.x1 - 12, ARENA.y1 - 12, ARENA.x2 - ARENA.x1 + 24, ARENA.y2 - ARENA.y1 + 24);
  // l'orlo della buca: una ringhiera d'ottone a ferro di cavallo
  g.strokeStyle = 'rgba(212, 162, 74, 0.34)'; g.lineWidth = 2;
  g.beginPath(); g.ellipse(320, 188, 236, 104, 0, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(212, 162, 74, 0.16)'; g.lineWidth = 1;
  g.beginPath(); g.ellipse(320, 188, 228, 97, 0, 0, TAU); g.stroke();
  for (const [x, y] of leggiiD4(portaNord)) { ombraD4(g, x, y + 12, 8, 2.6); leggioD4(g, x, y); }

  // i timpani: due caldaie di rame sulle gambe
  const T = K.timpani;
  ombraD4(g, T.x, T.y + 15, 30, 6);
  for (const [dx, dy, r] of [[-12, 0, 14], [13, 4, 12]]) {
    const x = T.x + dx, y = T.y + dy;
    astaD4(g, x - r * 0.6, y + 4, x - r * 0.8, y + 14, 1.2); astaD4(g, x + r * 0.6, y + 4, x + r * 0.8, y + 14, 1.2);
    g.fillStyle = '#3a2412'; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x - r, y - 4); g.quadraticCurveTo(x - r * 0.9, y + 11, x, y + 11); g.quadraticCurveTo(x + r * 0.9, y + 11, x + r, y - 4); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#e9dcc0';
    g.beginPath(); g.ellipse(x, y - 4, r, r * 0.36, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = OMBRE_D4.oro;
    for (const s of [-0.7, 0, 0.7]) g.fillRect(x + s * r - 0.8, y - 1, 1.6, 3);
  }
  astaD4(g, T.x - 2, T.y - 12, T.x + 8, T.y - 22, 1); // le mazze appoggiate
  g.fillStyle = '#e9dcc0'; g.beginPath(); g.arc(T.x + 8, T.y - 22, 2.2, 0, TAU); g.fill();

  // il contrabbasso appoggiato alla parete
  const C = K.contrabbasso;
  ombraD4(g, C.x + 2, C.y + 15, 16, 4.5);
  g.save();
  g.translate(C.x, C.y + 12); g.rotate(0.2);
  astaD4(g, 0, 0, 0, 5, 1.2);
  g.fillStyle = '#3a1a10'; g.strokeStyle = OMBRE_D4.lume; g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-9, -2); g.quadraticCurveTo(-12, -12, -7, -17); g.quadraticCurveTo(-5, -20, -7.5, -24); g.quadraticCurveTo(-8, -33, 0, -34);
  g.quadraticCurveTo(8, -33, 7.5, -24); g.quadraticCurveTo(5, -20, 7, -17); g.quadraticCurveTo(12, -12, 9, -2); g.quadraticCurveTo(0, 2, -9, -2);
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = OMBRE_D4.sagoma; g.fillRect(-1.5, -52, 3, 22); g.strokeRect(-1.5, -52, 3, 22);
  g.beginPath(); g.arc(0, -54, 2.6, 0, TAU); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(232, 201, 138, 0.7)'; g.lineWidth = 0.6;
  for (const s of [-1.2, 0, 1.2]) { g.beginPath(); g.moveTo(s, -50); g.lineTo(s * 1.6, -6); g.stroke(); }
  g.strokeStyle = OMBRE_D4.buio; g.lineWidth = 1;
  g.beginPath(); g.moveTo(-5, -13); g.quadraticCurveTo(-3.5, -10, -5, -7); g.moveTo(5, -13); g.quadraticCurveTo(3.5, -10, 5, -7); g.stroke();
  g.restore();
}

/** Il direttore d'ombra sul podio: la bacchetta scende sul tempo (più ampia sul battere). */
function disegnaDirettoreD4(st, t) {
  const B = st.bucaD4, P = postoDirettoreD4(st), x = P.x, y = P.y;
  const tempo = battitoD4();
  const fase = tempo ? tempo.fase : 0;
  const ampio = B.battere ? 1 : 0.62;
  const alta = tempo ? Math.sin(Math.PI * fase) * ampio : 0; // 0 sul tempo (la bacchetta è giù), 1 a metà
  const inchino = B.finita ? Math.min(1, B.fineTick / 30) * (B.esito === 'applauso' ? 1 : 0.5) : 0;
  ctx.save();
  ombraD4(ctx, x, y + 9, 14, 3.5);
  // podio con le tacche delle ondate
  ctx.fillStyle = OMBRE_D4.legno; ctx.strokeStyle = OMBRE_D4.lume; ctx.lineWidth = 1;
  ctx.fillRect(x - 13, y + 2, 26, 7); ctx.strokeRect(x - 12.5, y + 2.5, 25, 6);
  for (let i = 0; i < B.ondateTot; i++) {
    ctx.fillStyle = i < B.ondata ? OMBRE_D4.oro : '#5c4024';
    ctx.beginPath(); ctx.arc(x - (B.ondateTot - 1) * 2.5 + i * 5, y + 5.5, 1.4, 0, TAU); ctx.fill();
  }
  ctx.translate(x, y + 2);
  ctx.rotate(inchino * 0.5);
  // marsina con le code, testa, colletto
  sagomaD4(ctx, [[-6, -19], [6, -19], [7.5, -6], [4, -6], [5.5, 0], [1.5, -1], [0, -5], [-1.5, -1], [-5.5, 0], [-4, -6], [-7.5, -6]], OMBRE_D4.sagoma, OMBRE_D4.lume, 1);
  ctx.fillStyle = OMBRE_D4.sagoma; ctx.strokeStyle = OMBRE_D4.lume; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, -24, 4.4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e9dcc0'; ctx.fillRect(-1.5, -19.5, 3, 2.5);
  // braccio sinistro che tiene il tempo largo, destro con la bacchetta
  astaD4(ctx, -6, -17, -12, -15 - alta * 3, 1.3);
  const bx = 12, by = -13 - alta * 9;
  astaD4(ctx, 6, -17, bx, by, 1.3);
  ctx.strokeStyle = '#fff7d6'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 9, by - 5 - alta * 7); ctx.stroke();
  ctx.restore();
  // il lampo del tempo sulla punta (discreto: due fotogrammi d'oro, più grande sul battere)
  if (tempo && B.tickDalTempo < 5) {
    ctx.save();
    ctx.globalAlpha = 0.85 - B.tickDalTempo * 0.15;
    ctx.fillStyle = OMBRE_D4.oro;
    ctx.beginPath(); ctx.arc(x + 21, y - 16, B.battere ? 3 : 1.8, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

/** Il metronomo sul bordo: l'asta tocca gli estremi sui tempi. */
function disegnaMetronomoD4(st, t) {
  const B = st.bucaD4, D = postoDirettoreD4(st);
  const x = D.x + STANZE_TEATRO_D4.buca.metronomoDx, y = D.y + 4;
  const tempo = battitoD4();
  const ang = tempo ? Math.cos(Math.PI * (B.pos / (STANZE_TEATRO_D4.buca.passiPerBattuta / 2))) * 0.5 : 0;
  ctx.save();
  ombraD4(ctx, x, y + 6, 8, 2.4);
  sagomaD4(ctx, [[x - 6.5, y + 5], [x + 6.5, y + 5], [x + 3, y - 14], [x - 3, y - 14]], OMBRE_D4.legno, OMBRE_D4.lume, 1);
  ctx.fillStyle = '#e9dcc0'; ctx.fillRect(x - 1.2, y - 11, 2.4, 12);
  ctx.translate(x, y + 2); ctx.rotate(ang);
  ctx.strokeStyle = OMBRE_D4.buio; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -19); ctx.stroke();
  ctx.fillStyle = tempo && B.tickDalTempo < 5 ? '#fff7d6' : OMBRE_D4.oro;
  ctx.fillRect(-2.2, -14, 4.4, 3.2);
  ctx.restore();
}

/** Gli orchestrali d'ombra seduti ai leggii del fondo: dondolano a tempo; all'applauso si alzano e battono le mani. */
function disegnaOrchestraliD4(st, t) {
  const K = STANZE_TEATRO_D4.buca, B = st.bucaD4;
  const tempo = battitoD4();
  const applaude = B.finita && B.esito === 'applauso' && B.fineTick < K.applausoTick;
  let i = 0;
  for (const [x, y] of leggiiD4(Boolean(st.porte.N))) {
    if (y > K.filaDiFondoY) continue;
    const su = applaude ? 5 : tempo ? (B.tickDalTempo < 6 ? 1.2 : 0) : 0;
    const bx = x, by = y - 14 - su;
    ctx.fillStyle = OMBRE_D4.buio; ctx.strokeStyle = 'rgba(232, 201, 138, 0.55)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(bx - 7, by + 4); ctx.quadraticCurveTo(bx, by - 8, bx + 7, by + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx, by - 7, 3.4, 0, TAU); ctx.fill(); ctx.stroke();
    if (applaude) {
      const batte = Math.floor((t + i * 5) / 6) % 2 === 0;
      ctx.strokeStyle = OMBRE_D4.lume; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bx - 5, by - 1); ctx.lineTo(bx - (batte ? 1 : 4), by - 12); ctx.moveTo(bx + 5, by - 1); ctx.lineTo(bx + (batte ? 1 : 4), by - 12); ctx.stroke();
      if (batte) { ctx.fillStyle = OMBRE_D4.oro; ctx.fillRect(bx - 1, by - 15, 2, 2); }
    }
    i++;
  }
}

/** La Buca: fondo e arredi dalla tela, poi orchestrali, direttore e metronomo vivi. */
function disegnaBucaD4(st, t) {
  const nord = Boolean(st.porte.N);
  ctx.drawImage(telaD4(nord ? 'buca-n' : 'buca', (g) => disegnaBucaFermaD4(g, nord)), 0, 0, W, H);
  ctx.save();
  disegnaOrchestraliD4(st, t);
  ctx.restore();
  disegnaDirettoreD4(st, t);
  disegnaMetronomoD4(st, t);
}

/** La porta verso la Buca: cornice d'ottone e la nota (come i segni delle porte di a3). */
function disegnaPorteBucaD4(st, t) {
  if (!statoRun.mappa) return;
  const A = STANZE_TEATRO_D4.buca.aspetto;
  for (const [lato, id] of Object.entries(st.porte || {})) {
    const dest = statoRun.mappa.perId.get(id);
    const p = PORTE_A3[lato];
    if (!p || !dest || dest.tipo !== 'buca') continue;
    ctx.fillStyle = A.cornice;
    ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, 3); ctx.fillRect(p.x - p.w / 2, p.y + p.h / 2 - 3, p.w, 3);
    ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, 3, p.h); ctx.fillRect(p.x + p.w / 2 - 3, p.y - p.h / 2, 3, p.h);
    if (st.pulita) {
      const finita = Boolean(dest.bucaD4 && dest.bucaD4.finita);
      drawTextFit(TESTI_D4.buca.segno, p.x, p.y + 4, p.w - 4, { size: 11, color: finita ? '#9ca3af' : '#fff7d6' });
      if (!finita) { // due righe di pentagramma che pulsano piano: di là si suona
        ctx.strokeStyle = `rgba(249, 203, 64, ${(0.35 + 0.25 * Math.sin(t * 0.1)).toFixed(2)})`; ctx.lineWidth = 1;
        ctx.strokeRect(p.x - p.w / 2 - 3.5, p.y - p.h / 2 - 3.5, p.w + 7, p.h + 7);
      }
    }
  }
}

/** Minimappa: la cella della Buca con la nota (stessa geometria di a3). */
function minimappaBucaD4(st) {
  const m = statoRun.mappa;
  if (!m || !st || maledizioneD('mappa')) return;
  const A = STANZE_TEATRO_D4.buca.aspetto;
  const cell = 12, x0 = W - 118, y0 = 24, mw = 114, mh = 92;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - 5, y0 - 15, mw - 2, mh - 2); ctx.clip();
  for (const s of m.stanze) {
    if (!s.visitata || s.tipo !== 'buca') continue;
    const px = x0 + (s.cx - 1) * cell, py = y0 + (s.cy - 1) * cell;
    const corr = st.id === s.id;
    ctx.fillStyle = corr ? OMBRE_D4.oro : A.minimappa;
    ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
    drawTextFit(TESTI_D4.buca.segno, px + cell / 2, py + cell - 2.5, cell - 2, { size: 8, color: corr ? '#0a0604' : '#fff7d6', shadow: false });
  }
  ctx.restore();
}


// ===========================================================================
// AVVOLGIMENTI (chiamano sempre la base; altre squadre avvolgono le stesse funzioni)
// ===========================================================================

const mostraBannerBaseD4 = mostraBanner;
mostraBanner = function mostraBannerD4(testo, ...resto) {
  return mostraBannerBaseD4.call(this, SOSTITUZIONI_D4.get(testo) || testo, ...resto);
};

if (typeof pagaSangueA3 === 'function') {
  const pagaSangueA3BaseD4 = pagaSangueA3;
  pagaSangueA3 = function pagaSangueD4(costoHalf, letale, fonte, ...resto) {
    return pagaSangueA3BaseD4.call(this, costoHalf, letale, fonte === FONTE_ROVI_A3_D4 ? TESTI_D4.camerini.fonte : fonte, ...resto);
  };
}

if (typeof disegnaRoviA3 === 'function') {
  const disegnaRoviA3BaseD4 = disegnaRoviA3;
  disegnaRoviA3 = function disegnaRoviD4(p, t, ...resto) {
    try { disegnaPortaServizioD4(p, t); } catch (err) { console.error('[d4] porta di servizio', err); return disegnaRoviA3BaseD4.call(this, p, t, ...resto); }
    return undefined;
  };
}

if (typeof disegnaArrediA3 === 'function') {
  const disegnaArrediA3BaseD4 = disegnaArrediA3;
  disegnaArrediA3 = function disegnaArrediD4(st, t, ...resto) {
    let r;
    if (st && st.tipo === 'maledetta') {
      try { disegnaCameriniD4(st, t); } catch (err) { console.error('[d4] camerini', err); }
    } else r = disegnaArrediA3BaseD4.call(this, st, t, ...resto);
    try { sopraIlTappetoD4(st, t); } catch (err) { console.error('[d4] sopra il tappeto', err); }
    return r;
  };
}

if (typeof disegnaMinimappaA3 === 'function') {
  const disegnaMinimappaA3BaseD4 = disegnaMinimappaA3;
  disegnaMinimappaA3 = function disegnaMinimappaD4(st, ...resto) {
    const r = disegnaMinimappaA3BaseD4.call(this, st, ...resto);
    try { minimappaCameriniD4(st); } catch (err) { console.error('[d4] minimappa', err); }
    return r;
  };
}

const disegnaNemicoPittoricoBaseD4 = disegnaNemicoPittorico;
disegnaNemicoPittorico = function disegnaNemicoPittoricoD4(...args) {
  const conCtx = args[0] && typeof args[0].save === 'function';
  const n = conCtx ? args[1] : args[0];
  if (n && n.manichinoD4 && n.hp > 0) {
    try { disegnaManichinoD4(n, (conCtx ? args[2] : args[1]) || 0); return undefined; } catch (err) { console.error('[d4] manichino', err); }
  }
  return disegnaNemicoPittoricoBaseD4.apply(this, args);
};

const generaMappaPianoBaseD4 = generaMappaPiano;
generaMappaPiano = function generaMappaPianoD4(piano, ...resto) {
  const m = generaMappaPianoBaseD4.call(this, piano, ...resto);
  if (!m) return m;
  try {
    for (const s of m.stanze) if (s.tipo === 'maledetta') vestiCustodiD4(s, piano);
    aggiungiBucaD4(m, piano);
  } catch (err) { console.error('[d4] generazione', err); }
  return m;
};

const entraInStanzaBaseD4 = entraInStanza;
entraInStanza = function entraInStanzaD4(stanza, daLato, ...resto) {
  const r = entraInStanzaBaseD4.call(this, stanza, daLato, ...resto);
  try {
    if (stanza && statoRun.stanzaCorrente === stanza) {
      if (stanza.ternaD4) stanza.ternaD4.aperta = false;
      if (stanza.tipo === 'buca') dopoIngressoBucaD4(stanza);
    }
  } catch (err) { console.error('[d4] ingresso', err); }
  return r;
};

const verificaStanzaPulitaBaseD4 = verificaStanzaPulita;
verificaStanzaPulita = function verificaStanzaPulitaD4(...args) {
  const st = statoRun.stanzaCorrente;
  const B = st && st.tipo === 'buca' ? st.bucaD4 : null;
  if (B && B.attiva && !st.pulita && B.ondata < B.ondateTot) return undefined; // il concerto non è finito
  const eraPulita = !st || st.pulita;
  const r = verificaStanzaPulitaBaseD4.apply(this, args);
  try { if (B && B.attiva && !eraPulita && st.pulita) chiudiBucaD4(st); } catch (err) { console.error('[d4] fine del concerto', err); }
  return r;
};

const interagisciStanzaBaseD4 = interagisciStanza;
interagisciStanza = function interagisciStanzaD4(...args) {
  try {
    if (!statoRun.scambioPendente && !statoRun.pannelloB && !statoRun.siparioAttivo && interagisciTernaD4(statoRun.stanzaCorrente)) return undefined;
  } catch (err) { console.error('[d4] interazione', err); }
  return interagisciStanzaBaseD4.apply(this, args);
};

const disegnaStanzaPixelArtBaseD4 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function disegnaStanzaPixelArtD4(t, st, ...resto) {
  const r = disegnaStanzaPixelArtBaseD4.call(this, t, st, ...resto);
  if (!st) return r;
  try {
    if (st.tipo === 'bisca' && statoRun.fase === 'in_gioco') disegnaCartelloneD4(st, t);
    if (st.tipo === 'buca') disegnaBucaD4(st, t);
    disegnaPorteBucaD4(st, t);
  } catch (err) { console.error('[d4] resa stanza', err); }
  return r;
};

const disegnaHUDPixelArtBaseD4 = disegnaHUDPixelArt;
disegnaHUDPixelArt = function disegnaHUDPixelArtD4(st, ...resto) {
  const r = disegnaHUDPixelArtBaseD4.call(this, st, ...resto);
  try {
    minimappaBucaD4(st);
    disegnaPannelloTernaD4(tick);
  } catch (err) { console.error('[d4] resa hud', err); }
  return r;
};

const passoLogicoBaseD4 = passoLogico;
passoLogico = function passoLogicoD4(...args) {
  const st = statoRun.stanzaCorrente;
  const attivo = Boolean(st) && statoRun.fase === 'in_gioco' && ticksCongelati <= 0
    && !(statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo || statoRun.pausa);
  const pxD4 = player.x, pyD4 = player.y;
  if (st && st.bucaD4 && statoRun.scambioPendente) st.bucaD4.scambioVisto = true; // la reliquia è stata scambiata: vedi bisD4
  const r = passoLogicoBaseD4.apply(this, args);
  if (attivo && statoRun.fase === 'in_gioco' && statoRun.stanzaCorrente === st) {
    try {
      if (st.tipo === 'maledetta') corpiCameriniD4();
      else if (st.tipo === 'bisca') {
        if (st.ternaD4 && st.ternaD4.aperta) { // cartellone aperto: Ferruccio sta fermo
          player.x = pxD4; player.y = pyD4; player.targetX = null; player.targetY = null; player.moving = false;
          passoTernaD4(st);
        } else corpoSolidoD4(STANZE_TEATRO_D4.terna.posto);
      }
      else if (st.tipo === 'buca') passoBucaD4(st);
    } catch (err) { console.error('[d4] passo', err); }
  }
  return r;
};

// i ripari dalle ombre lunghe di b2 per gli arredi in piedi dei Camerini
if (window.__teatro && window.__teatro.interni && Array.isArray(window.__teatro.interni.ripariLuceB2)) {
  window.__teatro.interni.ripariLuceB2.push((st, aggiungi) => {
    if (!st) return;
    if (st.tipo === 'maledetta') {
      const C = STANZE_TEATRO_D4.camerini;
      aggiungi(C.stand.x, C.stand.y - 6, 26, 22); aggiungi(C.parrucche.x, C.parrucche.y - 6, 22, 18);
      aggiungi(C.baule.x, C.baule.y - 8, 26, 22); aggiungi(C.manichinoFermo.x, C.manichinoFermo.y - 12, 12, 24);
    }
    else if (st.tipo === 'bisca') { const P = STANZE_TEATRO_D4.terna.posto; aggiungi(P.x, P.y - 10, 20, 26); }
    else if (st.tipo === 'buca') {
      const K = STANZE_TEATRO_D4.buca, D = postoDirettoreD4(st);
      aggiungi(K.timpani.x, K.timpani.y - 2, 30, 20); aggiungi(K.contrabbasso.x, K.contrabbasso.y - 16, 16, 36);
      aggiungi(D.x, D.y - 12, 14, 24); aggiungi(D.x + K.metronomoDx, D.y - 4, 8, 14);
    }
  });
}

// il cartellone della terna è un menu per b3: gamepad e tocco lo navigano con frecce, CONFERMA e INDIETRO
if (window.__teatro && window.__teatro.interni && window.__teatro.interni.comandiB3 && Array.isArray(window.__teatro.interni.comandiB3.menuAperti)) {
  window.__teatro.interni.comandiB3.menuAperti.push(() => Boolean(pannelloTernaD4()));
}
// per a1: accanto al cartellone il tasto E non posa una bomba
if (typeof interazioniVicineA1 !== 'undefined' && Array.isArray(interazioniVicineA1)) {
  interazioniVicineA1.push((st) => Boolean(st && st.tipo === 'bisca' && Math.hypot(player.x - STANZE_TEATRO_D4.terna.posto.x, player.y - STANZE_TEATRO_D4.terna.posto.y) < STANZE_TEATRO_D4.terna.posto.raggioUso));
}

// ===========================================================================
// SONDA QA (tools/qa-teatro-stanze-teatro.js)
// ===========================================================================
if (window.__teatro && window.__teatro.interni) {
  Object.assign(window.__teatro.interni, {
    STANZE_TEATRO_D4, TESTI_D4,
    stanzeTeatroD4: {
      prova: provaD4,
      sostituzioni: SOSTITUZIONI_D4,
      vestiCustodi: vestiCustodiD4,
      sopraIlTappeto: sopraIlTappetoD4,
      smorfia: smorfiaD4, SMORFIA_D4,
      terna: {
        prob: probTernaD4, valoreAtteso: valoreAttesoTernaD4, rosa: rosaTernaD4, estrai: estraiTernaD4,
        stato: statoTernaD4, apri: apriTernaD4, chiudi: chiudiTernaD4, segna: segnaTernaD4, gioca: giocaTernaD4,
        passo: passoTernaD4, pannello: pannelloTernaD4, rettCella: rettCellaTernaD4, rettBottone: rettBottoneTernaD4,
      },
      buca: {
        aggiungi: aggiungiBucaD4, prob: probBucaD4, battito: battitoD4, tickPerPasso: tickPerPassoD4, posizioneMusica: posizioneMusicaD4,
        passo: passoBucaD4, entraOndata: entraOndataD4, chiudi: chiudiBucaD4, temaMusica: temaMusicaD4, postoDirettore: postoDirettoreD4,
      },
    },
  });
}
