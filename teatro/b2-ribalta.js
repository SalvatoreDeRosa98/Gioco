/*
 * teatro/b2-ribalta.js — IL PALCOSCENICO VIVO, parte 2 (squadra b2 «ribalta») e «game feel» fisico.
 *
 *  1. Luci della ribalta: lumi a olio lungo il bordo basso del palco, fiamma che tremola, alone caldo sul
 *     pavimento e OMBRE LUNGHE delle marionette (Ferruccio, nemici, boss) verso il fondo della scena.
 *     Ombra finta: la stessa figura ridisegnata su una tela d'appoggio, resa sagoma scura, schiacciata in un
 *     ventaglio e sfumata. Niente ray casting, niente lettura di pixel.
 *  2. Scenografia che scende dall'alto: all'ingresso in una stanza non ripulita colonne e bracieri calano
 *     appesi a due cavi (sfalsati, con rimbalzo e tonfo), le botole si aprono. A stanza ripulita i cavi si
 *     tendono. Le collisioni non cambiano mai: si sposta solo il DISEGNO (vedi spostaScenografia).
 *  3. Fisica della marionetta: alla morte i due fili d'oro si spezzano con uno schiocco e il corpo crolla in
 *     pezzi (ritagli della figura stessa) che cadono, rimbalzano e restano a terra finché si è nella stanza.
 *     Trucioli e polvere sui colpi, scintille sul metallo, scricchiolio delle giunture a passi e fendenti.
 *  4. Atmosfera: grana di pellicola (OPZIONI.grana), vignettatura (OPZIONI.vignetta), riflessi bagnati delle
 *     marionette e dei lumi al piano 1 (Corso Trieste sotto la pioggia).
 *
 * Costo: luce dei lumi, ombre lunghe e vignetta stanno in UNA tela a bassa risoluzione (lo «strato di luce»)
 * composta sul palco con un solo passaggio 'hard-light'; la grana è un secondo passaggio (trama ripetuta).
 * Le ombre lunghe si spengono con OPZIONI.ombre === false (assente = accese) e, se i frame restano sotto
 * soglia per qualche secondo, le sagome si aggiornano a frequenza dimezzata (RIBALTA_B2.prestazioni).
 *
 * Lo strato di luce si stende DOPO tutta la catena di disegnaStanzaPixelArt, quindi anche sopra ciò che gli
 * altri file disegnano lì dentro (forzieri di a1, arredi di a3). Per non sporcarli:
 *  - le etichette (drawPillLabel) disegnate dentro la catena vengono ripassate sopra la luce;
 *  - attorno a ciò che sta in piedi le ombre lunghe si spengono: sono i «ripari» (RIBALTA_B2.luce.ripari).
 *    Chi aggiunge un arredo nella catena registra il suo riparo in window.__teatro.interni.ripariLuceB2.
 *
 * Script classico caricato dopo teatro/a7-registro-bilancio.js. Nessuna modifica ai file di base: avvolge
 * (chiamando sempre la base) disegnaFrame, disegnaStanzaPixelArt, disegnaFamigliOrbitaliD, drawPillLabel,
 * t4Gancio('sopra'), passoLogico, entraInStanza, danneggiaNemico (e il riferimento che ne tiene
 * window.__teatroInterno, usato dal raggio di T3), AudioSys.playPasso/playFendente e il gancio
 * window.__teatro.t2.dopoNemici. Unica eccezione dichiarata: disegnaFerruccioPittorico NON chiama la base
 * mentre il corpo di Ferruccio è già crollato in pezzi (fase 'morte'), altrimenti si vedrebbe due volte.
 *
 * Regole che il file rispetta:
 *  - non chiama mai rng() del gioco (solo Math.random): la partita resta identica con o senza questo file;
 *  - non legge pixel (getImageData): da file:// le immagini degli sprite «sporcano» il canvas;
 *  - nessun segno a terra per gli attacchi nemici: le ombre sono solo delle figure e della scenografia;
 *  - non tocca i tempi della sequenza di morte (t4-hub-storia.js): disegna soltanto.
 * Immagini: ogni elemento di scena ha la SUA funzione di disegno (disegnaLume, disegnaCavo), così chi
 * collegherà le immagini dell'autore (lume-ribalta.png, cavo-gancio.png) sostituisce solo quel corpo.
 * QA: tools/qa-teatro-ribalta.js. Sonda: window.__teatro.interni.ribaltaB2.
 */

// ===========================================================================
// TABELLE (tutti i numeri del file stanno qui; i tempi in tick sono a 60 Hz)
// ===========================================================================
const RIBALTA_B2 = Object.freeze({
  /** Interruttori di sviluppo/QA (non sono opzioni del giocatore: quelle stanno in OPZIONI). */
  attivi: { lumi: true, ombre: true, scenografia: true, crollo: true, particelle: true, scricchiolii: true, riflessi: true },

  lumi: Object.freeze({
    x: Object.freeze([96, 152, 208, 264, 376, 432, 488, 544]), // lontani dalla porta sud (x 302..338)
    y: 311,                    // orlo della conchiglia, sulla fascia bassa della parete (sotto ARENA.y2)
    fiammaAlta: 6,             // altezza media della fiamma, px
    coloreFiamma: '#f9a53a',
    coloreCuore: '#fff3c4',
    coloreConchiglia: '#0a0604',
    coloreOrlo: '#f9cb40',
  }),

  /**
   * Strato di luce della ribalta: una tela a bassa risoluzione grande quanto la stanza, composta sul palco
   * in 'hard-light' (grigio medio = neutro, più chiaro = luce calda, più scuro = ombra e vignettatura).
   * Su un pavimento scuro la luce si vede molto, su uno chiaro (il marmo della Reggia) non brucia.
   */
  luce: Object.freeze({
    zona: Object.freeze({ x: 48, y: 52, l: 544, a: 264 }), // la stanza: pavimento e pareti
    risoluzione: 0.5,
    neutro: 127,
    coloreLume: Object.freeze([255, 196, 124]),
    alfaLume: 0.22,            // al centro della pozza di ogni lume
    raggio: 90,
    schiaccia: 1.35,           // la pozza sale verso il fondo più di quanto si allarga
    alfaBagno: 0.16,           // luce radente che arriva fino in fondo al palco: accanto ai lumi…
    alfaBagnoFondo: 0.09,      // …e sulla parete di fondo
    // Le porte restano fuori dallo strato di luce: il colore della cornice dice che stanza c'è dietro
    // (grigio, oro, arancio Fucina, rosso boss…) e la luce calda non deve falsarlo. [cx, cy, l, a] come 60-resa.js.
    porte: Object.freeze([Object.freeze([320, 61, 36, 18]), Object.freeze([320, 313, 36, 18]), Object.freeze([59, 187, 18, 36]), Object.freeze([581, 187, 18, 36])]),
    marginePorte: 6,
    /**
     * Regolazione per quartiere (piano nel ciclo): moltiplicatori della luce dei lumi, della densità delle
     * ombre lunghe e della vignetta. Sul marmo chiaro della Reggia (4) la luce pesa meno e le ombre di più.
     */
    quartieri: Object.freeze({
      1: Object.freeze({ luce: 1, ombra: 1, vignetta: 1 }),
      2: Object.freeze({ luce: 1, ombra: 1, vignetta: 1 }),
      3: Object.freeze({ luce: 1, ombra: 1, vignetta: 1 }),
      4: Object.freeze({ luce: 0.8, ombra: 1.15, vignetta: 0.8 }),
    }),
    etichetteMax: 16,          // etichette della stanza ripassate sopra lo strato di luce, per frame
    /**
     * Ripari: attorno a ciò che sta in piedi sotto lo strato di luce le ombre lunghe si spengono (un'ombra
     * stesa sopra un forziere o sulla Cartomante li renderebbe illeggibili). [dx, dy, rx, ry] dal punto
     * dell'oggetto; `sfuma` = frazione del raggio da cui il riparo comincia a cedere.
     */
    ripari: Object.freeze({
      max: 24,
      sfuma: 0.45,
      forziere: Object.freeze([0, -4, 20, 17]),            // a1: st.forzieriA1
      // a3: nome della voce in STANZE_SPECIALI_A3[tipo della stanza] → riparo
      arredi: Object.freeze({
        sfida: Object.freeze({ piedistallo: Object.freeze([0, -6, 20, 28]) }),
        sacrificio: Object.freeze({ ceppo: Object.freeze([0, -2, 30, 20]) }),
        bisca: Object.freeze({ banco: Object.freeze([0, -6, 34, 26]), cartomante: Object.freeze([0, -6, 22, 30]) }),
      }),
    }),
  }),

  /**
   * Prestazioni: se la media dei frame resta sotto `sogliaFps` per `finestreLente` finestre di fila, le sagome
   * delle ombre lunghe si aggiornano a frequenza dimezzata (un gradino); se poi regge `recuperoFps` per
   * `finestreBuone` finestre torna su. Dopo `recuperiMax` risalite resta dov'è: niente altalena.
   */
  prestazioni: Object.freeze({
    finestraMs: 1000,          // durata di una finestra di misura
    pausaMs: 250,              // un frame più lungo di così (scheda in secondo piano, singhiozzo) annulla la finestra
    sogliaFps: 50,
    finestreLente: 4,          // ~4 s sotto soglia → un gradino
    gradiniMax: 1,             // 1 = ombre a metà frequenza; 2 = fino a un quarto
    recuperoFps: 58,
    finestreBuone: 20,
    recuperiMax: 2,
  }),

  ombre: Object.freeze({
    max: 14,                   // figure con l'ombra lunga per frame (Ferruccio compreso)
    lunghezzaVicino: 1.45,     // allungamento accanto ai lumi…
    lunghezzaLontano: 2.05,    // …e in fondo al palco
    ventaglio: 0.5,            // inclinazione massima ai lati della scena
    alfaVicino: 0.8,           // sullo strato di luce: quanto l'ombra copre la luce accanto ai lumi…
    alfaLontano: 0.5,          // …e in fondo al palco
    alfaPunta: 0.15,           // quanto resta dell'ombra in punta (sfumatura lungo la lunghezza)
    sfumaPx: 80,               // altezza della figura oltre la quale l'ombra è già «in punta»
    tremito: 0.05,             // l'ombra respira con la fiamma
    risoluzione: 0.5,          // atlante delle ombre a metà risoluzione logica: la sfocatura è gratis
    colore: 'rgb(54, 46, 60)', // sullo strato di luce: sotto il grigio medio = scurisce il pavimento
    coloreContatto: '#070403', // ombre di contatto disegnate direttamente sul palco (pezzi, atterraggi)
    cellaL: 160, cellaA: 128, piedi: 114, colonne: 4, // cella dell'atlante; `piedi` = riga del suolo nella cella
    giocatoreOgni: 4,          // frame fra due ricatture della sagoma di Ferruccio quando si muove…
    giocatoreFermoOgni: 10,    // …e quando sta fermo
    nemiciOgni: 2,             // le sagome dei nemici si ridisegnano a frame alterni
    quotaMaxBoss: 14,          // un boss in volo più alto di così non proietta l'ombra lunga
    altezzaGiocatore: 48,
    piediGiocatore: 9, piediNemico: 5, piediBoss: 6, quotaVolo: 8, // suolo sotto il punto (x, y) dell'entità
    zonaAppoggio: Object.freeze({ y: 122 }), // dove si ritrae sul canvas ciò che non ha un foglio sprite
    scenografia: Object.freeze({ colonna: Object.freeze([12, 30]), braciere: Object.freeze([9, 15]), alfa: 0.8 }), // [mezza base, altezza]
  }),

  /** Sagome dei fogli sprite (t2-sprite.js): larghezza del corpo in rapporto all'altezza, per tagliare i pezzi. */
  sagome: Object.freeze({
    larghezza: Object.freeze({
      giocatore: 0.66, gatto: 1.35, 'vespa-cieca': 1.15, lucciola: 1.1, maschera: 0.95, 'bomba-ferma': 0.9,
      guardia: 0.62, statua: 0.62, predone: 0.7, burattino: 0.62, capitano: 0.72, 'donna-luciana': 0.85,
      'custode-marmo': 0.8, spezzafili: 0.72, 'regina-vespa': 1.15,
    }),
    larghezzaPredefinita: 0.72,
    fogliBoss: Object.freeze({
      're-gatto': 'gatto', 'capitano-guardia': 'capitano', 'colosso-statua': 'custode-marmo',
      'maestro-fucina': 'spezzafili', 'donna-luciana': 'donna-luciana', 'regina-vespa': 'regina-vespa',
    }),
    altezzeBoss: Object.freeze({ 're-gatto': 52 }), // come customH di t2-sprite.js
    volano: Object.freeze(['vespa_cieca', 'lucciola']),
    scalaCampione: 1.18,       // come disegnaNemicoPittorico
  }),

  scenografia: Object.freeze({
    attesaTick: 6,             // dopo l'ingresso, prima che cali il primo pezzo
    sfalsamentoTick: 6,        // fra un pezzo e il successivo (0,1 s)
    cadutaTick: 25,            // discesa (0,42 s)
    curvaCaduta: 1.35,         // 1 = velocità costante (calata dal cavo), 2 = caduta libera
    rimbalzo1Tick: 6, rimbalzo1Px: 5,
    rimbalzo2Tick: 4, rimbalzo2Px: 1.5, // in tutto 35 tick = 0,58 s per pezzo
    quotaExtra: 44,            // parte da sopra il bordo alto del canvas
    botolaTick: 18,            // le fosse non scendono: la botola si apre
    botolaChiusa: 0.06,
    scossa: Object.freeze([1.2, 70]), // [px, ms] al tonfo
    sollevaPx: 2,              // a stanza ripulita i cavi tesi tengono il pezzo appena staccato da terra (solo disegno)
    sussultoPx: 1.5, sussultoTick: 40,
    aggancio: Object.freeze({ colonna: Object.freeze([8, 20]), braciere: Object.freeze([7, 11]), predefinito: Object.freeze([7, 12]) }), // [mezza distanza fra i cavi, attacco sopra o.y]
    peso: Object.freeze({ colonna: 1.25, braciere: 0.8, predefinito: 1 }),
    cavo: Object.freeze({ colore: '#b08d57', alfa: 0.4, alfaTeso: 0.35, spessore: 1, lasco: 4, rapidita: 0.12 }),
  }),

  crollo: Object.freeze({
    senzaCrollo: Object.freeze(['bomba_ferma']), // il Bozzo esplode: resta l'animazione del suo foglio
    ritardoGiocatoreMs: 1600,  // Ferruccio crolla quando la sequenza di morte spezza i fili (t4: fasiMs.lanterne)
    risoluzioneMax: 3,         // pixel per px logico delle tele dei pezzi
    cattureMax: 8,             // tele dei caduti tenute in memoria
    inAttesaMax: 8,
    pezziMax: 30,              // resti a terra per stanza: oltre, i più vecchi svaniscono
    svanisceTick: 18,
    gravita: 0.42,
    elasticita: 0.4,
    attritoUrto: 0.55,
    rimbalziMax: 2,
    velMinRimbalzo: 0.9,
    spinta: 1.25, spintaBoss: 0.8,
    alfaResti: 0.92,
    coloreResti: 'rgba(8, 5, 3, 0.38)', // i resti a terra si scuriscono: non si confondono coi vivi
    // Filo di contorno chiaro attorno alla sagoma dei pezzi (la luce dei lumi sul bordo): senza, i resti
    // scuri (il gatto nero) spariscono sul selciato. `px` in px logici; `alfa` per materiale.
    contorno: Object.freeze({ colore: '#e8c98a', px: 0.7, alfa: 0.4, alfaPerMateriale: Object.freeze({ ombra: 0.8, fuliggine: 0.7, metallo: 0.5 }) }),
    // righe del taglio: [dall'alto, fino a, colonne] in frazione dell'altezza della figura
    taglio: Object.freeze({
      mob: Object.freeze([[0, 0.38, 1], [0.38, 0.7, 3], [0.7, 1, 2]]),
      largo: Object.freeze([[0, 0.5, 2], [0.5, 1, 3]]),
      boss: Object.freeze([[0, 0.3, 2], [0.3, 0.64, 3], [0.64, 1, 3]]),
    }),
    filo: Object.freeze({ durataTick: 26, rottura: 0.86, frusta: 5, alfa: 0.9 }),
  }),

  particelle: Object.freeze({
    max: 140,
    gravita: 0.3,
    truciolo: Object.freeze({ vitaMin: 34, vitaMax: 60, dimMin: 1.1, dimMax: 2.4 }),
    polvere: Object.freeze({ vitaMin: 20, vitaMax: 34, dimMin: 3, dimMax: 9, alfa: 0.3 }),
    scintilla: Object.freeze({ vitaMin: 9, vitaMax: 20, colori: Object.freeze(['#fff3c4', '#f9cb40', '#ea8626']) }),
  }),

  materiali: Object.freeze({
    predefinito: 'legno',
    corazza: 'corazza', // Maschera chiusa: il colpo rimbalza
    // Colpi continui senza spinta che arrivano da window.__teatroInterno.danneggiaNemico (il raggio del patto,
    // T3: un impulso ogni 5 tick): poche schegge lungo il raggio, non a ogni impulso.
    continuo: Object.freeze({ forza: 0.45, ogniImpulsi: 2 }),
    perTipo: Object.freeze({ guardia: 'metallo', statua: 'pietra', gatto: 'ombra', vespa_cieca: 'ombra', lucciola: 'ombra', bomba_ferma: 'fuliggine' }),
    perBoss: Object.freeze({ 'capitano-guardia': 'metallo', 'maestro-fucina': 'metallo', 'colosso-statua': 'pietra', 're-gatto': 'ombra', 'regina-vespa': 'ombra' }),
    effetti: Object.freeze({
      legno: Object.freeze({ trucioli: 5, polvere: 2, scintille: 0, tintinnio: false, colori: Object.freeze(['#c89b5a', '#8a5a2b', '#e8c98a', '#5c3a1c']) }),
      metallo: Object.freeze({ trucioli: 1, polvere: 1, scintille: 8, tintinnio: true, colori: Object.freeze(['#8a5a2b', '#c89b5a']) }),
      pietra: Object.freeze({ trucioli: 4, polvere: 3, scintille: 1, tintinnio: false, colori: Object.freeze(['#94a3b8', '#cbd5e1', '#64748b']) }),
      ombra: Object.freeze({ trucioli: 3, polvere: 2, scintille: 0, tintinnio: false, colori: Object.freeze(['#0b0704', '#1c1410', '#2a1d14']) }),
      fuliggine: Object.freeze({ trucioli: 4, polvere: 3, scintille: 2, tintinnio: false, colori: Object.freeze(['#0b0704', '#3b1d0b', '#78350f']) }),
      corazza: Object.freeze({ trucioli: 0, polvere: 1, scintille: 5, tintinnio: true, colori: Object.freeze(['#c89b5a']) }),
    }),
  }),

  suoni: Object.freeze({
    schiocco: 0.1,             // filo che si spezza
    tonfo: 0.2,                // scenografia che tocca il palco
    legno: 0.05,               // pezzo che rimbalza
    scricchiolio: 0.3,         // guadagno dopo il filtro passa-banda: all'orecchio resta molto basso
    tintinnio: 0.035,
    cavo: 0.22,
    probPasso: 0.55,           // non a ogni passo: uno scricchiolio fisso stanca
    probFendente: 0.8,
    pausaScricchiolioS: 0.09,
    pausaLegnoS: 0.04,
    pausaTintinnioS: 0.05,
  }),

  pellicola: Object.freeze({
    cella: 128,                // lato (in granuli) della trama di grana pre-calcolata
    alfaGrana: 0.17,           // alfa massima di un granulo scuro
    quotaChiari: 0.3,          // quanti granuli sono chiari (sul nero la pellicola quasi non si vede)…
    alfaChiari: 0.3,           // …e quanto pesano rispetto a quelli scuri
    grossezza: 0.5,            // granulo = scalaBase × grossezza pixel del buffer (minimo 1)
    cadenzaTick: 3,            // la grana cambia ~20 volte al secondo, come una pellicola
    graffi: Object.freeze({ prob: 0.006, durataTick: 4, alfa: 0.06, colore: '#f6e7c4' }),
    alfaVignetta: 0.5,         // quanto la vignetta porta verso il suo colore negli angoli della stanza
    raggioInterno: 0.5,        // dentro questo raggio (in frazione della diagonale) la vignetta non scurisce
    coloreVignetta: Object.freeze([26, 20, 22]), // sullo strato di luce: sotto il grigio medio = scurisce
  }),

  riflessi: Object.freeze({
    piano: 1,                  // piano del ciclo coi riflessi bagnati (Corso Trieste)
    // copia delle pozzanghere disegnate da getFloorTileCanvas (60-resa.js), che non le espone
    pozzanghere: Object.freeze([
      Object.freeze({ x: 140, y: 110, rx: 32, ry: 16 }), Object.freeze({ x: 480, y: 120, rx: 36, ry: 18 }),
      Object.freeze({ x: 230, y: 220, rx: 42, ry: 19 }), Object.freeze({ x: 420, y: 240, rx: 38, ry: 17 }),
      Object.freeze({ x: 310, y: 160, rx: 48, ry: 20 }), Object.freeze({ x: 170, y: 250, rx: 28, ry: 14 }),
    ]),
    pavimento: Object.freeze({ x: 68, y: 70, l: 504, a: 234 }),
    alfaSelciato: 0.1,         // riflesso tenue su tutto il selciato bagnato
    alfaPozza: 0.34,           // riflesso nelle pozzanghere
    schiaccia: 0.8,
    banda: 6,                  // il riflesso nelle pozze è a strisce che ondeggiano
    ampOnda: 1.6, velOnda: 0.11,
    strisciaL: 10, strisciaA: 90, alfaStriscia: 0.2, alfaStrisciaPozza: 0.5, // riflesso dei lumi
    coloreStriscia: Object.freeze([255, 190, 100]),
  }),
});

(function ribaltaB2() {
  'use strict';
  const C = RIBALTA_B2;
  const caso = Math.random; // mai rng(): gli effetti non devono toccare la partita
  const tra = (a, b) => a + (b - a) * caso();
  const limita = (v, a, b) => (v < a ? a : v > b ? b : v);
  const scegli = (lista) => lista[Math.floor(caso() * lista.length) % lista.length];
  const inScena = () => statoRun.fase === 'in_gioco' || statoRun.fase === 'morte';
  const fermoUI = () => Boolean(statoRun.pausa || statoRun.siparioAttivo || statoRun.pannelloB || statoRun.scambioPendente);
  const pianoNelCiclo = () => ((Math.max(1, statoRun.piano || 1) - 1) % 4) + 1;
  const t2 = () => (window.__teatro && window.__teatro.t2) || null;
  /** Le ombre lunghe: interruttore di sviluppo E opzione del giocatore (OPZIONI.ombre assente = accese). */
  const ombreAccese = () => C.attivi.ombre && OPZIONI.ombre !== false;
  const QUARTIERE_NEUTRO = Object.freeze({ luce: 1, ombra: 1, vignetta: 1 });
  /** Regolazione di luce e ombre del quartiere corrente (RIBALTA_B2.luce.quartieri). */
  const quartiere = () => C.luce.quartieri[pianoNelCiclo()] || QUARTIERE_NEUTRO;

  function nuovaTela(l, a) {
    const t = document.createElement('canvas');
    t.width = Math.max(1, Math.round(l)); t.height = Math.max(1, Math.round(a));
    return t;
  }

  let erroriVisti = 0;
  function errore(dove, err) { if (erroriVisti++ < 6) console.error('[B2] ' + dove, err); }

  // ===========================================================================
  // STATO (tutto di resa: niente di ciò che sta qui entra nelle regole del gioco)
  // ===========================================================================
  const O = C.ombre;
  const RIGHE_ATLANTE = Math.ceil(O.max / O.colonne);
  const S = {
    stanza: null,
    discesa: null,        // { t, attiva, bloccata, voci: [{ o, ritardo, yVera, wVera, hVera, dy }] }
    spostate: null,       // le voci spostate in questo frame (da rimettere a posto)
    tensione: 0,          // 0 cavi laschi … 1 cavi tesi
    tTensione: -1,
    pulitaNota: false,
    morti: new WeakSet(),
    crollati: new WeakSet(),
    ultimoColpo: new WeakMap(),
    inAttesa: [],         // figure da ritrarre e fare a pezzi al prossimo frame
    catture: [],          // { tela, tctx, k, vivi, fermi, scurita }
    teleLibere: [],
    pezzi: [],
    fili: [],
    giocatore: { tMorte: -1, crollato: false },
    inCattura: false,
    slot: [],             // una cella dell'atlante per figura: la 0 è di Ferruccio
    celle: new WeakMap(), // nemico → cella (stabile finché vive: si ridisegna a frame alterni)
    frame: 0,
    graffio: { x: 0, vita: 0 },
    granaX: 0, granaY: 0,
    atlanteSporco: true,  // una sagoma è stata ritratta: le ombre vanno ricavate di nuovo
    degrado: 0,           // gradini di degrado delle ombre (0 = piena frequenza)
    misura: { ultimo: 0, inizio: 0, frame: 0, lente: 0, buone: 0, recuperi: 0, fps: 0, bloccata: false },
    etichette: [],        // argomenti delle drawPillLabel disegnate dentro la stanza in questo frame
    registraEtichette: false,
    ripari: [],           // { x, y, rx, ry } del frame
    nRipari: 0,
    passaggiColpo: 0,     // quante volte un colpo è passato dall'avvolgimento di danneggiaNemico
    impulsi: new WeakMap(), // nemico → impulsi del colpo continuo (raggio) ricevuti
    conteggi: { schiocco: 0, tonfo: 0, legno: 0, scricchiolio: 0, tintinnio: 0, cavo: 0, trucioli: 0, polvere: 0, scintille: 0, grana: 0, vignetta: 0, ombre: 0, riflessi: 0, ritratti: 0, etichette: 0, ripari: 0 },
  };
  for (let i = 0; i < C.luce.ripari.max; i++) S.ripari.push({ x: 0, y: 0, rx: 0, ry: 0 });
  for (let i = 0; i < O.max; i++) S.slot.push({ usato: false, valido: false, chi: null, visto: -1, ultima: -99, flip: false, cella: i, gx: 0, gy: 0, h: 0, ent: { genere: 'nemico', n: null, taglio: 0 } });
  S.slot[0].ent.genere = 'giocatore';

  const atlA = nuovaTela(O.cellaL * O.colonne, O.cellaA * RIGHE_ATLANTE); // figure a colori (riflessi)
  const actx = atlA.getContext('2d');
  const atlB = nuovaTela(atlA.width * O.risoluzione, atlA.height * O.risoluzione); // sagome scure sfumate (ombre)
  const bctx = atlB.getContext('2d');
  const sfumaB = (() => {
    const g = bctx.createLinearGradient(0, 0, 0, atlB.height);
    const tot = O.cellaA * RIGHE_ATLANTE;
    for (let r = 0; r < RIGHE_ATLANTE; r++) {
      const base = r * O.cellaA;
      g.addColorStop((base + 0.01) / tot, `rgba(0,0,0,${O.alfaPunta})`);
      g.addColorStop(Math.max(base + 0.02, base + O.piedi - O.sfumaPx) / tot, `rgba(0,0,0,${O.alfaPunta})`);
      g.addColorStop((base + O.piedi) / tot, 'rgba(0,0,0,1)');
      g.addColorStop((base + O.cellaA - 0.01) / tot, 'rgba(0,0,0,1)');
    }
    return g;
  })();

  // ===========================================================================
  // SUONI (Web Audio procedurale sul contesto di AudioSys, collegati ad AudioSys.uscita)
  // ===========================================================================
  const ultimi = { scricchiolio: -1, legno: -1, tintinnio: -1 };
  let rumore = null;
  function audioPronto() {
    try {
      if (!AudioSys.attivo) return null;
      const a = AudioSys.ctx;
      return a && a.state === 'running' && AudioSys.uscita ? a : null;
    } catch (_) { return null; }
  }
  function tamponeRumore(a) {
    if (!rumore || rumore.sampleRate !== a.sampleRate) {
      rumore = a.createBuffer(1, Math.floor(a.sampleRate * 0.5), a.sampleRate);
      const d = rumore.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return rumore;
  }
  function tono(a, t, forma, f0, f1, durata, volume) {
    const o = a.createOscillator(), g = a.createGain();
    o.type = forma;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + durata);
    g.gain.setValueAtTime(Math.max(0.0001, volume), t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + durata);
    o.connect(g); g.connect(AudioSys.uscita);
    o.start(t); o.stop(t + durata + 0.02);
  }
  function soffio(a, t, durata, volume, filtro, freq, q) {
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = tamponeRumore(a);
    f.type = filtro; f.frequency.value = freq; f.Q.value = q || 0.8;
    g.gain.setValueAtTime(Math.max(0.0001, volume), t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + durata);
    s.connect(f); f.connect(g); g.connect(AudioSys.uscita);
    s.start(t, Math.random() * 0.3, durata + 0.02);
  }
  /** Schiocco teso di un filo che si spezza (`ritardo` in secondi, `altezza` moltiplica l'intonazione). */
  function suonoSchiocco(ritardo, altezza) {
    const a = audioPronto(); if (!a) return;
    try {
      const t = a.currentTime + (ritardo || 0), k = (altezza || 1) * tra(0.92, 1.08);
      tono(a, t, 'triangle', 1500 * k, 260 * k, 0.075, C.suoni.schiocco);
      soffio(a, t, 0.016, C.suoni.schiocco * 0.6, 'highpass', 3200, 0.7);
      S.conteggi.schiocco++;
    } catch (_) { /* audio non disponibile: il gioco continua */ }
  }
  /** Tonfo di legno della scenografia che tocca il palco. */
  function suonoTonfo(peso, forza) {
    const a = audioPronto(); if (!a) return;
    try {
      const t = a.currentTime, v = C.suoni.tonfo * forza;
      tono(a, t, 'sine', (118 / peso) * tra(0.94, 1.06), 46 / peso, 0.16, v);
      soffio(a, t, 0.05, v * 0.45, 'lowpass', 720, 0.7);
      tono(a, t, 'triangle', (410 / peso) * tra(0.9, 1.1), 190 / peso, 0.035, v * 0.3);
      S.conteggi.tonfo++;
    } catch (_) { /* come sopra */ }
  }
  /** Legno contro legno: un pezzo di marionetta che rimbalza sul palco. */
  function suonoLegno(forza) {
    const a = audioPronto(); if (!a) return;
    try {
      const t = a.currentTime;
      if (t - ultimi.legno < C.suoni.pausaLegnoS) return;
      ultimi.legno = t;
      const f = tra(620, 1050), v = C.suoni.legno * limita(forza, 0.3, 1.6);
      tono(a, t, 'sine', f, f * 0.62, 0.035, v);
      tono(a, t, 'triangle', f * 2.7, f * 1.9, 0.02, v * 0.4);
      S.conteggi.legno++;
    } catch (_) { /* come sopra */ }
  }
  /** Scricchiolio delle giunture: dente di sega lento dentro un passa-banda, ogni volta diverso. */
  function suonoScricchiolio(forza, lungo) {
    const a = audioPronto(); if (!a) return;
    try {
      const t = a.currentTime;
      if (t - ultimi.scricchiolio < C.suoni.pausaScricchiolioS) return;
      ultimi.scricchiolio = t;
      const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
      const dur = lungo ? tra(0.2, 0.3) : tra(0.06, 0.13), fr = lungo ? tra(520, 900) : tra(900, 1900);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(tra(48, 90), t);
      o.frequency.linearRampToValueAtTime(tra(60, 120), t + dur);
      f.type = 'bandpass'; f.Q.value = tra(5, 9);
      f.frequency.setValueAtTime(fr, t);
      f.frequency.linearRampToValueAtTime(fr * tra(0.75, 1.3), t + dur);
      const v = forza * tra(0.6, 1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(f); f.connect(g); g.connect(AudioSys.uscita);
      o.start(t); o.stop(t + dur + 0.02);
      if (lungo) S.conteggi.cavo++; else S.conteggi.scricchiolio++;
    } catch (_) { /* come sopra */ }
  }
  /** Tintinnio breve dei colpi sul metallo. */
  function suonoTintinnio() {
    const a = audioPronto(); if (!a) return;
    try {
      const t = a.currentTime;
      if (t - ultimi.tintinnio < C.suoni.pausaTintinnioS) return;
      ultimi.tintinnio = t;
      const f = tra(2300, 3400);
      tono(a, t, 'sine', f, f * 0.98, 0.07, C.suoni.tintinnio);
      tono(a, t, 'sine', f * 1.51, f * 1.5, 0.04, C.suoni.tintinnio * 0.5);
      S.conteggi.tintinnio++;
    } catch (_) { /* come sopra */ }
  }

  // ===========================================================================
  // TELE PRE-CALCOLATE (alone dei lumi, bagliore, sbuffo, striscia, vignetta, grana)
  // ===========================================================================
  const tele = {};
  const LZ = C.luce.zona, RL = C.luce.risoluzione;
  const telaLuce = nuovaTela(LZ.l * RL, LZ.a * RL); // lo strato di luce del frame
  const lctx = telaLuce.getContext('2d');
  const telaOmbre = nuovaTela(telaLuce.width, telaLuce.height); // le sole ombre lunghe del frame (coi ripari)
  const octx = telaOmbre.getContext('2d');
  const NEUTRO = `rgb(${C.luce.neutro},${C.luce.neutro},${C.luce.neutro})`;
  /** La luce dei lumi (RGBA): una pozza calda per lume più una luce radente fino in fondo al palco. */
  function telaLumi() {
    if (tele.lumi) return tele.lumi;
    const U = C.luce, t = nuovaTela(telaLuce.width, telaLuce.height), x = t.getContext('2d');
    x.setTransform(RL, 0, 0, RL, -LZ.x * RL, -LZ.y * RL);
    const [cr, cg, cb] = U.coloreLume;
    const bagno = x.createLinearGradient(0, C.lumi.y, 0, LZ.y);
    bagno.addColorStop(0, `rgba(${cr},${cg},${cb},${U.alfaBagno})`);
    bagno.addColorStop(1, `rgba(${cr},${cg},${cb},${U.alfaBagnoFondo})`);
    x.fillStyle = bagno; x.fillRect(LZ.x, LZ.y, LZ.l, LZ.a);
    for (const lx of C.lumi.x) {
      x.save();
      x.translate(lx, C.lumi.y - 4); x.scale(1, U.schiaccia);
      const g = x.createRadialGradient(0, 0, 2, 0, 0, U.raggio);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${U.alfaLume})`);
      g.addColorStop(0.4, `rgba(${cr},${cg},${cb},${U.alfaLume * 0.4})`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      x.fillStyle = g;
      x.beginPath(); x.arc(0, 0, U.raggio, 0, TAU); x.fill();
      x.restore();
    }
    return (tele.lumi = t);
  }
  function telaTonda(nome, lato, stop) {
    if (tele[nome]) return tele[nome];
    const t = nuovaTela(lato, lato), x = t.getContext('2d');
    const g = x.createRadialGradient(lato / 2, lato / 2, 0, lato / 2, lato / 2, lato / 2);
    for (const [p, col] of stop) g.addColorStop(p, col);
    x.fillStyle = g; x.fillRect(0, 0, lato, lato);
    return (tele[nome] = t);
  }
  const telaBagliore = () => telaTonda('bagliore', 32, [[0, 'rgba(255,214,140,0.95)'], [0.3, 'rgba(255,170,70,0.5)'], [1, 'rgba(255,150,50,0)']]);
  const telaSbuffo = () => telaTonda('sbuffo', 32, [[0, 'rgba(222,204,170,0.9)'], [0.55, 'rgba(190,170,140,0.45)'], [1, 'rgba(170,150,120,0)']]);
  const telaRiparo = () => telaTonda('riparo', 64, [[0, 'rgba(0,0,0,1)'], [C.luce.ripari.sfuma, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
  function telaStriscia() {
    if (tele.striscia) return tele.striscia;
    const R = C.riflessi, t = nuovaTela(R.strisciaL, R.strisciaA), x = t.getContext('2d');
    const [cr, cg, cb] = R.coloreStriscia;
    const v = x.createLinearGradient(0, R.strisciaA, 0, 0);
    v.addColorStop(0, `rgba(${cr},${cg},${cb},1)`); v.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.45)`); v.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    x.fillStyle = v; x.fillRect(0, 0, R.strisciaL, R.strisciaA);
    const o = x.createLinearGradient(0, 0, R.strisciaL, 0);
    o.addColorStop(0, 'rgba(0,0,0,0)'); o.addColorStop(0.5, 'rgba(0,0,0,1)'); o.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalCompositeOperation = 'destination-in';
    x.fillStyle = o; x.fillRect(0, 0, R.strisciaL, R.strisciaA);
    return (tele.striscia = t);
  }
  /** La vignetta della stanza, alla risoluzione dello strato di luce. */
  function telaVignetta() {
    if (tele.vignetta) return tele.vignetta;
    const P = C.pellicola, l = telaLuce.width, a = telaLuce.height, t = nuovaTela(l, a), x = t.getContext('2d');
    const [cr, cg, cb] = P.coloreVignetta;
    x.translate(l / 2, a / 2); x.scale(1, a / l);
    const R = Math.hypot(l / 2, l / 2);
    const g = x.createRadialGradient(0, 0, R * P.raggioInterno, 0, 0, R);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},0)`);
    g.addColorStop(0.55, `rgba(${cr},${cg},${cb},${P.alfaVignetta * 0.42})`);
    g.addColorStop(1, `rgba(${cr},${cg},${cb},${P.alfaVignetta})`);
    x.fillStyle = g; x.fillRect(-l, -l, l * 2, l * 2);
    return (tele.vignetta = t);
  }
  let motivoGrana = null;
  /** Trama di grana pre-calcolata, già ai pixel del buffer (granuli di `g` pixel): si ripete senza riscalare. */
  function telaGrana(g) {
    if (tele.grana && tele.granaG === g) return tele.grana;
    const P = C.pellicola, n = P.cella, piccola = nuovaTela(n, n), x = piccola.getContext('2d');
    const img = x.createImageData(n, n), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const chiaro = Math.random() < P.quotaChiari;
      d[i] = chiaro ? 255 : 0; d[i + 1] = chiaro ? 240 : 0; d[i + 2] = chiaro ? 214 : 0;
      d[i + 3] = Math.round(Math.pow(Math.random(), 1.6) * P.alfaGrana * (chiaro ? P.alfaChiari : 1) * 255);
    }
    x.putImageData(img, 0, 0);
    const t = nuovaTela(n * g, n * g), y = t.getContext('2d');
    y.imageSmoothingEnabled = false;
    y.drawImage(piccola, 0, 0, n * g, n * g);
    tele.grana = t; tele.granaG = g; motivoGrana = null;
    return t;
  }
  let pozze = null;
  function sentieroPozze() {
    if (pozze) return pozze;
    pozze = new Path2D();
    for (const p of C.riflessi.pozzanghere) { pozze.moveTo(p.x + p.rx, p.y); pozze.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, TAU); }
    return pozze;
  }

  // ===========================================================================
  // 1. LUCI DELLA RIBALTA E OMBRE LUNGHE
  // ===========================================================================
  /** Intensità (0,35..1) della fiamma del lume `i` al tick `tk`: tremolio proprio più qualche spiffero comune. */
  function fiamma(i, tk) {
    const spiffero = Math.max(0, Math.sin(tk * 0.017) * Math.sin(tk * 0.0113 + 1.3) - 0.55) * 1.6;
    const v = 0.82 + 0.1 * Math.sin(tk * 0.31 + i * 1.7) + 0.07 * Math.sin(tk * 0.83 + i * 2.9)
      - spiffero * (0.25 + 0.2 * Math.sin(tk * 1.3 + i));
    return limita(v, 0.35, 1);
  }
  const fiammaMedia = (tk) => (fiamma(0, tk) + fiamma(3, tk) + fiamma(5, tk)) / 3;

  /**
   * La fiamma di UN lume in (x, y): alone e lingua di fuoco. `f` = intensità 0,35..1, `i` = indice del lume
   * (sfasa l'ondeggiare), `tk` = tick. Resta disegnata dal codice anche quando la conchiglia sarà un'immagine.
   */
  function disegnaFiammaLume(x, y, f, i, tk) {
    const L = C.lumi;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.6 * f;
    ctx.drawImage(telaBagliore(), x - 12, y - 17, 24, 24);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const h = L.fiammaAlta * (0.65 + 0.55 * f), sx = Math.sin(tk * 0.37 + i * 2.3) * 1.1 * (1.25 - f);
    ctx.fillStyle = L.coloreFiamma;
    ctx.beginPath();
    ctx.moveTo(x - 1.9, y - 1.5);
    ctx.quadraticCurveTo(x - 2.5 + sx, y - 1.5 - h * 0.55, x + sx, y - 1.5 - h);
    ctx.quadraticCurveTo(x + 2.5 + sx, y - 1.5 - h * 0.55, x + 1.9, y - 1.5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = L.coloreCuore;
    ctx.beginPath(); ctx.ellipse(x + sx * 0.4, y - 1.5 - h * 0.32, 0.9, Math.max(0.6, h * 0.28), 0, 0, TAU); ctx.fill();
  }

  /**
   * Il corpo di UN lume a olio in (x, y), visto dal pubblico: conchiglia in sagoma scura, orlo d'ottone acceso
   * dalla fiamma (`f` = intensità 0,35..1). ELEMENTO DI SCENA CON FUNZIONE PROPRIA: chi collega l'immagine
   * dell'autore (lume-ribalta.png) sostituisce solo questo corpo; la fiamma sta in disegnaFiammaLume.
   */
  function disegnaLume(x, y, f) {
    const L = C.lumi;
    ctx.fillStyle = L.coloreConchiglia;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 1.5); ctx.lineTo(x + 6, y - 1.5);
    ctx.quadraticCurveTo(x + 5.5, y + 4, x, y + 4.5);
    ctx.quadraticCurveTo(x - 5.5, y + 4, x - 6, y - 1.5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = L.coloreOrlo;
    ctx.globalAlpha = 0.5 + 0.5 * f;
    ctx.beginPath(); ctx.moveTo(x - 6, y - 1.5); ctx.lineTo(x + 6, y - 1.5); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /** Tutti i lumi della ribalta (posizioni in RIBALTA_B2.lumi): per ognuno la fiamma, poi il corpo. */
  function disegnaLumi(tk) {
    const L = C.lumi;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.lineWidth = 1;
    for (let i = 0; i < L.x.length; i++) {
      const f = fiamma(i, tk);
      disegnaFiammaLume(L.x[i], L.y, f, i, tk);
      disegnaLume(L.x[i], L.y, f);
    }
    ctx.restore();
  }

  const optGiocatore = { scale: 1.0 };
  function opzioniGiocatore() {
    const o = optGiocatore;
    o.scalaA2 = player.scalaA2; o.flipX = player.flipX; o.tick = tick; o.moving = player.moving;
    o.shootAnim = player.shootAnimTimer > 0; o.pickup = player.pickupTimer > 0; o.flash = false;
    o.haSpada = statoRun.haSpada; o.swordAnimTick = player.swordAnimTick; o.swordAngle = player.swordAngle;
    o.charInfo = getCharCorrente(); o.sinergie = statoRun.sinergieVisive;
    return o;
  }

  /**
   * Ritrae ciò che non ha un foglio sprite (Ferruccio pittorico, nemici senza foglio) usando il canvas del
   * gioco come tela d'appoggio: la figura è disegnata dalle funzioni vere in una zona al centro del palco,
   * copiata nel riquadro di `d`, e subito dopo il pavimento la ricopre (si chiama solo prima della stanza).
   */
  function ritraiDalPalco(d, x0, y0, k, ent) {
    const zx = Math.round(W / 2 - O.cellaL / 2), zy = O.zonaAppoggio.y, n = ent.n;
    const m = ctx.getTransform();
    let lampo = 0, camp = null, hp = 1;
    if (n) { lampo = n.flash; camp = n.champion; hp = n.hp; n.flash = 0; n.champion = null; if (hp <= 0) n.hp = 1; }
    ctx.save();
    S.inCattura = true;
    try {
      ctx.clearRect(zx, zy, O.cellaL, O.cellaA);
      ctx.beginPath(); ctx.rect(zx, zy, O.cellaL, O.piedi - (ent.taglio || 0)); ctx.clip();
      if (ent.genere === 'giocatore') {
        ctx.translate(zx + O.cellaL / 2 - player.x, zy + O.piedi - O.piediGiocatore - player.y);
        disegnaFerruccioPittorico(ctx, player.x, player.y, opzioniGiocatore());
      } else if (ent.genere === 'boss') {
        ctx.translate(zx + O.cellaL / 2 - n.x, zy + O.piedi - O.piediBoss - n.y);
        disegnaBossPittorico(ctx, n, tick);
      } else {
        ctx.translate(zx + O.cellaL / 2 - n.x, zy + O.piedi - O.piediNemico - n.y);
        disegnaNemicoPittorico(ctx, n, tick);
      }
    } finally {
      S.inCattura = false;
      ctx.restore();
      if (n) { n.flash = lampo; n.champion = camp; n.hp = hp; }
    }
    d.save();
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.globalCompositeOperation = 'source-over'; d.globalAlpha = 1;
    d.imageSmoothingEnabled = true;
    d.clearRect(x0, y0, O.cellaL * k, O.cellaA * k);
    d.drawImage(canvas, m.a * zx + m.e, m.d * zy + m.f, m.a * O.cellaL, m.d * O.cellaA, x0, y0, O.cellaL * k, O.cellaA * k);
    d.restore();
    return true;
  }

  /**
   * Ritrae la sola figura di un'entità nel riquadro (x0, y0) di `d`, a `k` pixel per px logico, col suolo
   * in (cellaL/2, piedi). Nemici e boss col foglio sprite passano da t2-sprite.js (stesso sprite, stessa
   * posa, nessuna ombra a terra né aura); il resto da ritraiDalPalco.
   * @returns {boolean} false se non si è potuto disegnare nulla
   */
  function ritrai(d, x0, y0, k, ent) {
    const n = ent.n, g = t2();
    let fatto = false;
    if (n && g) {
      const lampo = n.flash, camp = n.champion, hp = n.hp;
      n.flash = 0; n.champion = null; if (hp <= 0) n.hp = 1;
      d.save();
      try {
        d.setTransform(1, 0, 0, 1, 0, 0);
        d.globalCompositeOperation = 'source-over'; d.globalAlpha = 1;
        d.beginPath(); d.rect(x0, y0, O.cellaL * k, O.cellaA * k); d.clip();
        d.clearRect(x0, y0, O.cellaL * k, O.cellaA * k);
        if (n.boss) {
          d.setTransform(k, 0, 0, k, x0 + (O.cellaL / 2) * k, y0 + (O.piedi - O.piediBoss - Math.min(n.airZ || 0, O.quotaMaxBoss)) * k);
          fatto = typeof g.boss === 'function' && Boolean(g.boss(d, n, tick));
        } else {
          const s = k * (camp ? C.sagome.scalaCampione : 1);
          d.setTransform(s, 0, 0, s, x0 + (O.cellaL / 2) * k, y0 + (O.piedi - O.piediNemico) * k);
          fatto = typeof g.nemico === 'function' && Boolean(g.nemico(d, n, tick));
        }
      } finally {
        d.restore();
        n.flash = lampo; n.champion = camp; n.hp = hp;
      }
    }
    return fatto || ritraiDalPalco(d, x0, y0, k, ent);
  }

  const foglioDi = (n) => (n.boss ? C.sagome.fogliBoss[n.bossId] : String(n.tipo || '').replace(/_/g, '-'));
  /** Altezza a schermo (px logici) della figura di un nemico o di un boss. */
  function altezzaDi(n) {
    const g = t2(), foglio = foglioDi(n);
    if (n.boss && C.sagome.altezzeBoss[n.bossId]) return C.sagome.altezzeBoss[n.bossId];
    const a = g && g.CONFIG && g.CONFIG.altezza ? g.CONFIG.altezza[foglio] : 0;
    return (a || Math.max(24, (n.r || 11) * 2.6)) * (n.champion && !n.boss ? C.sagome.scalaCampione : 1);
  }

  /** Prima del pavimento: ritrae le figure nell'atlante (celle stabili) e ne ricava le sagome d'ombra. */
  function preparaSagome(st) {
    for (const s of S.slot) s.usato = false;
    const ombre = ombreAccese();
    const servono = ombre || (C.attivi.riflessi && pianoNelCiclo() === C.riflessi.piano);
    if (!servono) return;
    // Degrado (RIBALTA_B2.prestazioni): a ogni gradino le sagome si ritraggono un frame ogni `passo`, e con
    // metà (un quarto) della cadenza. Le posizioni delle ombre restano aggiornate a ogni frame.
    const passo = 1 << S.degrado, turno = S.frame % passo === 0, giro = (S.frame / passo) | 0;
    // Ferruccio: cella 0. Ritrarlo costa una copia dal canvas del gioco: lo si rifà ogni pochi frame.
    const io = S.slot[0];
    if (!S.giocatore.crollato) {
      const mosso = player.moving || (player.swordAnimTick >= 0 && player.swordAnimTick < 14) || player.shootAnimTimer > 0 || player.pickupTimer > 0;
      if (!io.valido || io.flip !== player.flipX || S.frame - io.ultima >= (mosso ? O.giocatoreOgni : O.giocatoreFermoOgni) * passo) {
        ritrai(actx, 0, 0, 1, io.ent);
        io.valido = true; io.flip = player.flipX; io.ultima = S.frame;
        S.atlanteSporco = true; S.conteggi.ritratti++;
      }
      io.usato = true;
      io.gx = player.x; io.gy = player.y + O.piediGiocatore;
      io.h = O.altezzaGiocatore * (player.scalaA2 || 1);
    } else io.valido = false;
    for (const n of st.nemici) {
      if (!n || n.hp <= 0) continue;
      if (n.boss && (n.airZ || 0) > O.quotaMaxBoss) continue;
      let i = S.celle.get(n), nuova = false;
      if (i === undefined || S.slot[i].chi !== n) {
        i = -1;
        for (let k = 1; k < O.max; k++) if (!S.slot[k].chi) { i = k; break; }
        if (i < 0) continue; // atlante pieno: questa figura resta senza ombra lunga
        S.slot[i].chi = n; S.celle.set(n, i); nuova = true;
      }
      const s = S.slot[i];
      s.visto = S.frame;
      if (nuova || !s.valido || (turno && (giro + i) % O.nemiciOgni === 0)) {
        s.ent.genere = n.boss ? 'boss' : 'nemico'; s.ent.n = n;
        s.valido = ritrai(actx, (i % O.colonne) * O.cellaL, ((i / O.colonne) | 0) * O.cellaA, 1, s.ent);
        s.ent.n = null;
        S.atlanteSporco = true; S.conteggi.ritratti++;
      }
      if (!s.valido) continue;
      s.usato = true;
      s.gx = n.x; s.gy = n.y + (n.boss ? O.piediBoss : O.piediNemico);
      s.h = altezzaDi(n) + (C.sagome.volano.includes(n.tipo) ? O.quotaVolo : 0);
    }
    for (let k = 1; k < O.max; k++) { // chi è caduto o uscito lascia la cella
      const s = S.slot[k];
      if (s.chi && s.visto !== S.frame) { s.chi = null; s.valido = false; }
    }
    if (ombre && S.atlanteSporco) { // le sagome d'ombra si ricavano solo se una figura è stata ritratta di nuovo
      S.atlanteSporco = false;
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.globalAlpha = 1;
      bctx.imageSmoothingEnabled = true;
      bctx.globalCompositeOperation = 'copy';
      bctx.drawImage(atlA, 0, 0, atlB.width, atlB.height);
      bctx.globalCompositeOperation = 'source-in';
      bctx.fillStyle = O.colore; bctx.fillRect(0, 0, atlB.width, atlB.height);
      bctx.globalCompositeOperation = 'destination-in';
      bctx.fillStyle = sfumaB; bctx.fillRect(0, 0, atlB.width, atlB.height);
      bctx.globalCompositeOperation = 'source-over';
    }
  }

  /** Allungamento, inclinazione e alfa dell'ombra di chi poggia in (gx, gy). Scrive in `geo`. */
  const geo = { lung: 1, inc: 0, alfa: 0 };
  function geometriaOmbra(gx, gy, tk) {
    const lontano = limita((C.lumi.y - gy) / (C.lumi.y - ARENA.y1), 0, 1);
    const f = fiammaMedia(tk);
    geo.lung = (O.lunghezzaVicino + (O.lunghezzaLontano - O.lunghezzaVicino) * lontano) * (1 + O.tremito * (f - 0.8));
    geo.inc = O.ventaglio * limita((gx - W / 2) / (W / 2), -1, 1) + O.tremito * 0.4 * Math.sin(tk * 0.23);
    geo.alfa = O.alfaVicino + (O.alfaLontano - O.alfaVicino) * lontano;
  }

  // --- ripari: dove le ombre lunghe si spengono (ciò che sta in piedi sotto lo strato di luce) ---
  /** Aggiunge al frame un riparo ellittico centrato in (x, y), semiassi (rx, ry), in coordinate del palco. */
  function aggiungiRiparo(x, y, rx, ry) {
    if (S.nRipari >= S.ripari.length || !(rx > 0) || !(ry > 0) || !Number.isFinite(x + y)) return;
    const r = S.ripari[S.nRipari++];
    r.x = x; r.y = y; r.rx = rx; r.ry = ry;
  }
  const riparoDa = (p, q) => { if (p && q) aggiungiRiparo(p.x + q[0], p.y + q[1], q[2], q[3]); };
  /** Ripari dei forzieri (a1-bombe-chiavi.js): quelli aperti con l'oggetto sono sostituiti dal piedistallo. */
  function ripariForzieri(st) {
    const q = C.luce.ripari.forziere;
    for (const f of st.forzieriA1 || []) if (f && !(f.aperto && f.oggetto)) riparoDa(f, q);
  }
  /** Ripari degli arredi delle stanze speciali (a3-stanze-speciali.js), dalle posizioni della sua tabella. */
  function ripariArredi(st) {
    const A = C.luce.ripari.arredi[st.tipo];
    if (!A || typeof STANZE_SPECIALI_A3 === 'undefined') return;
    const T = STANZE_SPECIALI_A3[st.tipo];
    if (!T) return;
    if (st.tipo === 'sfida' && st.sfidaA3 && st.sfidaA3.finita) return; // il piedistallo se n'è andato
    for (const nome of Object.keys(A)) {
      if (nome === 'cartomante' && !(st.biscaA3 && st.biscaA3.cartomante && !st.biscaA3.cartomante.andata)) continue;
      riparoDa(T[nome], A[nome]);
    }
  }
  /**
   * Chi dà i ripari: funzioni (stanza, aggiungi) che chiamano aggiungi(x, y, rx, ry) per ogni cosa in piedi che
   * disegnano dentro la catena di disegnaStanzaPixelArt. Esposta come window.__teatro.interni.ripariLuceB2:
   * gli altri file vi aggiungono la loro con push().
   */
  const fontiRipari = [ripariForzieri, ripariArredi];
  function raccogliRipari(st) {
    S.nRipari = 0;
    for (const fonte of fontiRipari) {
      try { fonte(st, aggiungiRiparo); } catch (err) { errore('riparo', err); }
    }
  }

  /** Le ombre lunghe del frame (scenografia e figure) sulla loro tela, in coordinate del palco, coi ripari. */
  function disegnaOmbre(st, tk) {
    const r = O.risoluzione, densita = quartiere().ombra;
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.globalCompositeOperation = 'source-over';
    octx.globalAlpha = 1;
    octx.imageSmoothingEnabled = true;
    octx.clearRect(0, 0, telaOmbre.width, telaOmbre.height);
    octx.setTransform(RL, 0, 0, RL, -LZ.x * RL, -LZ.y * RL);
    if (S.discesa) { // la scenografia, sotto la stessa luce: un trapezio in due passate (più denso alla base)
      octx.fillStyle = O.colore;
      for (const v of S.discesa.voci) {
        const o = v.o, sag = O.scenografia[o.tipo];
        if (!sag || st.ostacoli.indexOf(o) < 0) continue;
        if (S.discesa.attiva && S.discesa.t < v.ritardo + C.scenografia.cadutaTick) continue;
        const gy = v.yVera + 3;
        geometriaOmbra(o.x, gy, tk);
        for (let passata = 0; passata < 2; passata++) {
          const al = sag[1] * geo.lung * (passata ? 0.55 : 1), dx = geo.inc * al;
          octx.globalAlpha = Math.min(1, geo.alfa * O.scenografia.alfa * 0.6 * densita);
          octx.beginPath();
          octx.moveTo(o.x - sag[0], gy); octx.lineTo(o.x + sag[0], gy);
          octx.lineTo(o.x + sag[0] * 0.8 + dx, gy - al); octx.lineTo(o.x - sag[0] * 0.8 + dx, gy - al);
          octx.closePath(); octx.fill();
        }
      }
    }
    for (const s of S.slot) {
      if (!s.usato) continue;
      geometriaOmbra(s.gx, s.gy, tk);
      const col = s.cella % O.colonne, riga = (s.cella / O.colonne) | 0;
      octx.save();
      octx.transform(1, 0, -geo.inc, geo.lung, s.gx, s.gy);
      octx.globalAlpha = Math.min(1, geo.alfa * densita);
      octx.drawImage(atlB, col * O.cellaL * r, riga * O.cellaA * r, O.cellaL * r, O.piedi * r, -O.cellaL / 2, -O.piedi, O.cellaL, O.piedi);
      octx.restore();
      S.conteggi.ombre++;
    }
    if (S.nRipari > 0) {
      octx.globalAlpha = 1;
      octx.globalCompositeOperation = 'destination-out';
      const tela = telaRiparo();
      for (let i = 0; i < S.nRipari; i++) {
        const q = S.ripari[i];
        octx.drawImage(tela, q.x - q.rx, q.y - q.ry, q.rx * 2, q.ry * 2);
        S.conteggi.ripari++;
      }
      octx.globalCompositeOperation = 'source-over';
    }
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.globalAlpha = 1;
  }

  /** Compone lo strato di luce del frame (luce dei lumi, ombre lunghe, vignetta) e lo stende sul palco. */
  function disegnaLuce(st, tk) {
    const Q = quartiere();
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalCompositeOperation = 'source-over';
    lctx.globalAlpha = 1;
    lctx.imageSmoothingEnabled = true;
    lctx.fillStyle = NEUTRO;
    lctx.fillRect(0, 0, telaLuce.width, telaLuce.height);
    if (C.attivi.lumi) {
      lctx.globalAlpha = Math.min(1, (0.68 + 0.32 * fiammaMedia(tk)) * Q.luce);
      lctx.drawImage(telaLumi(), 0, 0);
      lctx.globalAlpha = 1;
    }
    if (ombreAccese()) {
      raccogliRipari(st);
      disegnaOmbre(st, tk);
      lctx.drawImage(telaOmbre, 0, 0);
    }
    if (OPZIONI.vignetta) {
      lctx.globalAlpha = Math.min(1, Q.vignetta);
      lctx.drawImage(telaVignetta(), 0, 0);
      lctx.globalAlpha = 1;
      S.conteggi.vignetta++;
    }
    lctx.setTransform(RL, 0, 0, RL, -LZ.x * RL, -LZ.y * RL);
    lctx.fillStyle = NEUTRO;
    const mp = C.luce.marginePorte;
    for (const q of C.luce.porte) lctx.fillRect(q[0] - q[2] / 2 - mp, q[1] - q[3] / 2 - mp, q[2] + mp * 2, q[3] + mp * 2);
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'hard-light';
    ctx.drawImage(telaLuce, LZ.x, LZ.y, LZ.l, LZ.a);
    ctx.restore();
  }

  /** Ripassa sopra lo strato di luce le etichette che la catena della stanza ha disegnato sotto. */
  function ripassaEtichette() {
    const n = S.etichette.length;
    if (!n) return;
    ctx.save();
    for (let i = 0; i < n; i++) drawPillLabelBaseB2.apply(null, S.etichette[i]);
    ctx.restore();
    S.conteggi.etichette += n;
  }

  // ===========================================================================
  // 4b. RIFLESSI BAGNATI (piano 1): marionette e lumi sul selciato e nelle pozzanghere
  // ===========================================================================
  function riflettiSagoma(s, alfa, onde, tk) {
    const R = C.riflessi;
    const col = s.cella % O.colonne, riga = (s.cella / O.colonne) | 0;
    const alto = Math.min(O.piedi, Math.ceil(s.h + 8));
    ctx.save();
    ctx.transform(1, 0, 0, -R.schiaccia, s.gx, s.gy + 1);
    ctx.globalAlpha = alfa;
    if (!onde) {
      ctx.drawImage(atlA, col * O.cellaL, riga * O.cellaA + O.piedi - alto, O.cellaL, alto, -O.cellaL / 2, -alto, O.cellaL, alto);
    } else {
      const n = Math.ceil(alto / R.banda);
      for (let j = 0; j < n; j++) {
        const h0 = j * R.banda;
        const onda = Math.sin(tk * R.velOnda + j * 1.3 + s.gx * 0.05) * R.ampOnda * (0.35 + j / n);
        ctx.drawImage(atlA, col * O.cellaL, riga * O.cellaA + O.piedi - h0 - R.banda, O.cellaL, R.banda,
          -O.cellaL / 2 + onda, -(h0 + R.banda), O.cellaL, R.banda);
      }
    }
    ctx.restore();
  }

  function disegnaStrisceLumi(tk, alfa, largo) {
    const R = C.riflessi, L = C.lumi, bande = 5, hb = R.strisciaA / bande, tela = telaStriscia();
    for (let i = 0; i < L.x.length; i++) {
      ctx.globalAlpha = alfa * fiamma(i, tk);
      for (let j = 0; j < bande; j++) {
        const onda = Math.sin(tk * 0.11 + i * 2.1 + j * 1.7) * (0.5 + j * 0.45);
        ctx.drawImage(tela, 0, R.strisciaA - (j + 1) * hb, R.strisciaL, hb,
          L.x[i] - (R.strisciaL * largo) / 2 + onda, L.y - 8 - (j + 1) * hb, R.strisciaL * largo, hb);
      }
    }
  }

  function vicinoAUnaPozza(s) {
    for (const p of C.riflessi.pozzanghere) {
      if (s.gx + 40 > p.x - p.rx && s.gx - 40 < p.x + p.rx && s.gy + s.h > p.y - p.ry && s.gy < p.y + p.ry) return true;
    }
    return false;
  }

  function disegnaRiflessi(tk) {
    const R = C.riflessi, P = R.pavimento;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.beginPath(); ctx.rect(P.x, P.y, P.l, P.a); ctx.clip();
    if (C.attivi.lumi) {
      ctx.globalCompositeOperation = 'lighter';
      disegnaStrisceLumi(tk, R.alfaStriscia, 1);
      ctx.globalCompositeOperation = 'source-over';
    }
    for (const s of S.slot) if (s.usato) riflettiSagoma(s, R.alfaSelciato, false, tk);
    ctx.clip(sentieroPozze());
    if (C.attivi.lumi) {
      ctx.globalCompositeOperation = 'lighter';
      disegnaStrisceLumi(tk, R.alfaStrisciaPozza, 1.7);
      ctx.globalCompositeOperation = 'source-over';
    }
    for (const s of S.slot) {
      if (s.usato && vicinoAUnaPozza(s)) { riflettiSagoma(s, R.alfaPozza, true, tk); S.conteggi.riflessi++; }
    }
    ctx.restore();
  }

  // ===========================================================================
  // 2. LA SCENOGRAFIA SCENDE DALL'ALTO
  // ===========================================================================
  /** Spostamento verticale (≤ 0 = in alto) di un pezzo di scenografia al tempo `t` della discesa. */
  function quotaScenografia(v, t) {
    const D = C.scenografia, tau = t - v.ritardo, alto = v.yVera + D.quotaExtra;
    if (tau < 0) return -alto;
    if (tau < D.cadutaTick) return -alto * (1 - Math.pow(tau / D.cadutaTick, D.curvaCaduta));
    let r = tau - D.cadutaTick;
    if (r < D.rimbalzo1Tick) { const u = r / D.rimbalzo1Tick; return -D.rimbalzo1Px * 4 * u * (1 - u); }
    r -= D.rimbalzo1Tick;
    if (r < D.rimbalzo2Tick) { const u = r / D.rimbalzo2Tick; return -D.rimbalzo2Px * 4 * u * (1 - u); }
    return 0;
  }

  /**
   * Solo per la durata del disegno del frame sposta in alto gli ostacoli in discesa (e stringe le botole):
   * così li disegna il codice di base, identici a sempre, e la logica (collisioni, colpi, bombe) non vede
   * mai lo spostamento. rimettiScenografia() li rimette a posto nel `finally` di disegnaFrame.
   */
  function spostaScenografia() {
    const st = statoRun.stanzaCorrente, dsc = S.discesa;
    if (!C.attivi.scenografia || !dsc || !st || st !== S.stanza || !inScena() || !dsc.voci.length) return false;
    const D = C.scenografia;
    const scorre = dsc.attiva && !dsc.bloccata && !fermoUI();
    const t = dsc.t + (scorre ? limita(accumuloMs / MS_PER_TICK, 0, 1) : 0);
    let alza = D.sollevaPx * S.tensione;
    if (S.tTensione >= 0 && S.tTensione < D.sussultoTick) alza += D.sussultoPx * Math.sin(S.tTensione * 0.55) * Math.exp(-S.tTensione * 0.1);
    for (const v of dsc.voci) {
      const o = v.o;
      v.yVera = o.y; v.wVera = o.w; v.hVera = o.h; v.dy = 0;
      if (o.tipo === 'fossa') {
        if (dsc.attiva) {
          const u = limita((t - v.ritardo) / D.botolaTick, 0, 1), e = 1 - (1 - u) * (1 - u);
          o.w = v.wVera * (D.botolaChiusa + (1 - D.botolaChiusa) * e);
        }
        continue;
      }
      v.dy = (dsc.attiva ? quotaScenografia(v, t) : 0) - alza;
      o.y = v.yVera + v.dy;
    }
    S.spostate = dsc.voci;
    return true;
  }
  function rimettiScenografia() {
    const voci = S.spostate;
    S.spostate = null;
    if (!voci) return;
    for (const v of voci) { v.o.y = v.yVera; v.o.w = v.wVera; v.o.h = v.hVera; }
  }

  function atterra(v, forza) {
    const D = C.scenografia, o = v.o;
    suonoTonfo(D.peso[o.tipo] || D.peso.predefinito, forza);
    if (forza >= 1) { try { scuoti(D.scossa); } catch (_) { /* la scossa è un di più */ } }
    if (C.attivi.particelle) for (let k = 0; k < Math.round(5 * forza); k++) sbuffo(o.x + tra(-12, 12), o.y + 5 + tra(-2, 3), tra(-0.6, 0.6), 0);
  }

  function passoScenografia(st) {
    const dsc = S.discesa, D = C.scenografia;
    if (!dsc) return;
    if (dsc.attiva && !dsc.bloccata && C.attivi.scenografia) {
      dsc.t++;
      let finite = true;
      for (const v of dsc.voci) {
        const tau = dsc.t - v.ritardo;
        if (v.o.tipo === 'fossa') {
          if (tau === 0) suonoLegno(1.5);
          if (tau < D.botolaTick) finite = false;
          continue;
        }
        if (tau === D.cadutaTick) atterra(v, 1);
        else if (tau === D.cadutaTick + D.rimbalzo1Tick) atterra(v, 0.4);
        if (tau < D.cadutaTick + D.rimbalzo1Tick + D.rimbalzo2Tick) finite = false;
      }
      if (finite) dsc.attiva = false;
    }
    const pulita = Boolean(st.pulita);
    if (pulita !== S.pulitaNota) {
      S.pulitaNota = pulita;
      S.tTensione = 0;
      if (pulita && dsc.voci.some((v) => v.o.tipo !== 'fossa') && C.attivi.scenografia) suonoScricchiolio(C.suoni.cavo, true);
    }
    S.tensione += ((pulita ? 1 : 0) - S.tensione) * D.cavo.rapidita;
    if (S.tTensione >= 0 && S.tTensione < D.sussultoTick) S.tTensione++;
  }

  /**
   * UN cavo di scena, da sopra il bordo alto del palco fino al punto d'aggancio (x, yBasso). `lasco` = pancia
   * in px (0 = teso), `lato` = -1/1 (da che parte fa la pancia), `fase` = ondeggiare. ELEMENTO DI SCENA CON
   * FUNZIONE PROPRIA: chi collega l'immagine dell'autore (cavo-gancio.png) sostituisce solo questo corpo.
   * Colore, spessore e alfa arrivano già impostati da disegnaCaviEAtterraggi.
   */
  function disegnaCavo(x, yBasso, lato, lasco, fase) {
    ctx.beginPath(); ctx.moveTo(x, -6);
    if (lasco > 0.05) ctx.quadraticCurveTo(x + lato * lasco * 2 + Math.sin(fase) * lasco * 0.5, yBasso * 0.55, x, yBasso);
    else ctx.lineTo(x, yBasso);
    ctx.stroke();
  }

  /** L'ombra nel punto d'arrivo (x, y) di UN pezzo di scenografia che cala: cresce con `p` (0..1 = quanto è sceso). */
  function disegnaOmbraDiArrivo(x, y, p) {
    ctx.globalAlpha = 0.12 + 0.45 * p;
    ctx.fillStyle = O.coloreContatto;
    ctx.beginPath(); ctx.ellipse(x, y, 15 * (0.4 + 0.6 * p), 5.5 * (0.4 + 0.6 * p), 0, 0, TAU); ctx.fill();
  }

  /** I due cavi di ogni pezzo di scenografia della stanza e, mentre cala, l'ombra del suo punto d'arrivo. */
  function disegnaCaviEAtterraggi(st, tk) {
    const dsc = S.discesa, D = C.scenografia;
    if (!dsc || !dsc.voci.length) return;
    ctx.save();
    ctx.lineWidth = D.cavo.spessore; ctx.lineCap = 'round'; ctx.strokeStyle = D.cavo.colore;
    const lampoTeso = S.tTensione >= 0 && S.tTensione < D.sussultoTick ? Math.exp(-S.tTensione * 0.12) * (S.pulitaNota ? 1 : 0) : 0;
    for (let i = 0; i < dsc.voci.length; i++) {
      const v = dsc.voci[i], o = v.o;
      if (o.tipo === 'fossa' || st.ostacoli.indexOf(o) < 0) continue;
      const tau = dsc.t - v.ritardo, inVolo = dsc.attiva && tau < D.cadutaTick;
      if (inVolo && tau >= 0) disegnaOmbraDiArrivo(o.x, v.yVera + 6, tau / D.cadutaTick);
      const g = D.aggancio[o.tipo] || D.aggancio.predefinito;
      const yBasso = v.yVera + v.dy - g[1];
      if (yBasso < -4) continue;
      const tesi = inVolo ? 1 : S.tensione, lasco = D.cavo.lasco * (1 - tesi);
      ctx.globalAlpha = D.cavo.alfa + D.cavo.alfaTeso * lampoTeso;
      for (let lato = -1; lato <= 1; lato += 2) disegnaCavo(o.x + lato * g[0], yBasso, lato, lasco, tk * 0.045 + i * 1.9 + lato);
    }
    ctx.restore();
  }

  // ===========================================================================
  // 3. FISICA DELLA MARIONETTA: particelle, fili che si spezzano, corpo in pezzi
  // ===========================================================================
  const particelle = [];
  for (let i = 0; i < C.particelle.max; i++) {
    particelle.push({ viva: false, genere: 0, x: 0, y: 0, z: 0, px: 0, py: 0, vx: 0, vy: 0, vz: 0, eta: 0, vita: 1, rot: 0, vr: 0, dim: 1, colore: '#000', rimbalzi: 0 });
  }
  let cursore = 0;
  const TRUCIOLO = 0, POLVERE = 1, SCINTILLA = 2;
  function nuovaParticella(genere) {
    let p = null;
    for (let k = 0; k < particelle.length; k++) {
      const q = particelle[(cursore + k) % particelle.length];
      if (!q.viva) { p = q; cursore = (cursore + k + 1) % particelle.length; break; }
    }
    if (!p) { p = particelle[cursore]; cursore = (cursore + 1) % particelle.length; }
    p.viva = true; p.genere = genere; p.eta = 0; p.rimbalzi = 0; p.vr = 0; p.rot = 0;
    return p;
  }
  function sbuffo(x, y, vx, vy) {
    const Q = C.particelle.polvere, p = nuovaParticella(POLVERE);
    p.x = x; p.y = y; p.z = tra(1, 5); p.vx = vx; p.vy = vy; p.vz = tra(0.08, 0.2);
    p.vita = Math.round(tra(Q.vitaMin, Q.vitaMax)); p.dim = tra(0.7, 1.2);
    S.conteggi.polvere++;
  }
  /** Schegge del materiale colpito in (x, y), lanciate lungo (dx, dy). `forza` moltiplica quantità e slancio. */
  function schizzaColpo(x, y, quota, dx, dy, materiale, forza) {
    const M = C.materiali.effetti[materiale] || C.materiali.effetti.legno, Q = C.particelle;
    const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    for (let i = 0; i < Math.round(M.trucioli * forza); i++) {
      const p = nuovaParticella(TRUCIOLO), v = tra(0.7, 2.3);
      p.x = x + tra(-3, 3); p.y = y + tra(-2, 2); p.z = quota + tra(-4, 6);
      p.vx = ux * v + tra(-0.8, 0.8); p.vy = uy * v * 0.7 + tra(-0.5, 0.5); p.vz = tra(1.1, 2.9);
      p.vita = Math.round(tra(Q.truciolo.vitaMin, Q.truciolo.vitaMax)); p.dim = tra(Q.truciolo.dimMin, Q.truciolo.dimMax);
      p.rot = tra(0, TAU); p.vr = tra(-0.45, 0.45); p.colore = scegli(M.colori);
      S.conteggi.trucioli++;
    }
    for (let i = 0; i < Math.round(M.polvere * forza); i++) sbuffo(x + tra(-5, 5), y + tra(-2, 3), ux * 0.35 + tra(-0.3, 0.3), uy * 0.2);
    for (let i = 0; i < Math.round(M.scintille * forza); i++) {
      const p = nuovaParticella(SCINTILLA), v = tra(1.4, 3.6);
      p.x = x; p.y = y; p.z = quota + tra(-2, 6);
      p.vx = ux * v + tra(-1.5, 1.5); p.vy = uy * v * 0.7 + tra(-0.9, 0.9); p.vz = tra(0.4, 3);
      p.px = p.x; p.py = p.y - p.z;
      p.vita = Math.round(tra(Q.scintilla.vitaMin, Q.scintilla.vitaMax)); p.colore = scegli(Q.scintilla.colori);
      S.conteggi.scintille++;
    }
  }
  function passoParticelle() {
    const g = C.particelle.gravita;
    for (const p of particelle) {
      if (!p.viva) continue;
      if (++p.eta >= p.vita) { p.viva = false; continue; }
      if (p.genere === POLVERE) { p.x += p.vx; p.y += p.vy; p.z += p.vz; p.vx *= 0.93; p.vy *= 0.93; continue; }
      p.px = p.x; p.py = p.y - p.z;
      p.x += p.vx; p.y += p.vy; p.z += p.vz; p.vz -= g; p.rot += p.vr;
      if (p.z <= 0) {
        p.z = 0;
        if (p.genere === SCINTILLA) { p.viva = false; continue; }
        if (p.rimbalzi < 1 && p.vz < -0.8) { p.vz = -p.vz * 0.35; p.vx *= 0.5; p.vy *= 0.5; p.vr *= 0.4; p.rimbalzi++; }
        else { p.vz = 0; p.vx = 0; p.vy = 0; p.vr = 0; }
      }
    }
  }
  function disegnaParticelle() {
    const Q = C.particelle;
    let scintille = false;
    for (const p of particelle) {
      if (!p.viva) continue;
      const k = p.eta / p.vita;
      if (p.genere === TRUCIOLO) {
        ctx.save();
        ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        ctx.translate(p.x, p.y - p.z); ctx.rotate(p.rot);
        ctx.fillStyle = p.colore;
        ctx.fillRect(-p.dim, -p.dim * 0.35, p.dim * 2, p.dim * 0.7);
        ctx.restore();
      } else if (p.genere === POLVERE) {
        const d = (Q.polvere.dimMin + (Q.polvere.dimMax - Q.polvere.dimMin) * k) * p.dim;
        ctx.globalAlpha = Q.polvere.alfa * (1 - k);
        ctx.drawImage(telaSbuffo(), p.x - d, p.y - p.z - d, d * 2, d * 2);
      } else scintille = true;
    }
    ctx.globalAlpha = 1;
    if (!scintille) return;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    for (const p of particelle) {
      if (!p.viva || p.genere !== SCINTILLA) continue;
      ctx.globalAlpha = 1 - (p.eta / p.vita) * 0.8;
      ctx.strokeStyle = p.colore;
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y - p.z); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /** Materiale di un nemico per le schegge dei colpi (tabella RIBALTA_B2.materiali). */
  function materialeDi(n) {
    const M = C.materiali, tipo = n.patternMob || n.tipo;
    if (tipo === 'maschera' && !n.maskOpen) return M.corazza;
    return (n.boss && M.perBoss[n.bossId]) || M.perTipo[tipo] || M.predefinito;
  }

  function dopoColpo(n, hpPrima, kx, ky) {
    if (!(n.hp < hpPrima)) return;
    const forza = Math.hypot(kx || 0, ky || 0);
    if (!(forza > 0)) return; // bruciature e colpi senza direzione: niente schegge
    let c = S.ultimoColpo.get(n);
    if (!c) { c = { x: 0, y: 0 }; S.ultimoColpo.set(n, c); }
    c.x = kx / forza; c.y = ky / forza;
    if (!C.attivi.particelle || !inScena()) return;
    const mat = materialeDi(n);
    schizzaColpo(n.x, n.y + 3, n.boss ? 22 : 12, kx, ky, mat, 1);
    if ((C.materiali.effetti[mat] || {}).tintinnio) suonoTintinnio();
  }

  /**
   * Colpo continuo senza spinta arrivato da window.__teatroInterno.danneggiaNemico (il raggio del patto di T3):
   * le schegge partono lungo il raggio, da Ferruccio verso il nemico, un impulso ogni `continuo.ogniImpulsi`;
   * se il nemico cade, i pezzi volano via nella stessa direzione.
   */
  function dopoColpoContinuo(n, hpPrima) {
    if (!(n.hp < hpPrima)) return;
    const dx = n.x - player.x, dy = n.y - player.y, l = Math.hypot(dx, dy) || 1;
    let c = S.ultimoColpo.get(n);
    if (!c) { c = { x: 0, y: 0 }; S.ultimoColpo.set(n, c); }
    c.x = dx / l; c.y = dy / l;
    if (!C.attivi.particelle || !inScena()) return;
    const K = C.materiali.continuo, k = S.impulsi.get(n) || 0;
    S.impulsi.set(n, k + 1);
    if (k % Math.max(1, K.ogniImpulsi) !== 0) return;
    const mat = materialeDi(n);
    schizzaColpo(n.x, n.y + 3, n.boss ? 22 : 12, c.x, c.y, mat, K.forza);
    if ((C.materiali.effetti[mat] || {}).tintinnio) suonoTintinnio();
  }

  // --- fili che si spezzano ---
  function spezzaFili(st, n) {
    suonoSchiocco(0, n.boss ? 0.8 : 1);
    suonoSchiocco(0.045, n.boss ? 0.72 : 1.12);
    const finale = st.tipo === 'boss' && pianoNelCiclo() === 4 && st.nemici.some((q) => q.hp > 0);
    let manoS = FEEL.fili.manoSinistra, manoD = FEEL.fili.manoDestra;
    if (n.bossId === 'donna-luciana') {
      // i suoi fili partono dalle SUE due Mani (n.maniA), dove stanno in questo istante; prima che la lotta
      // le crei valgono le posizioni di riposo, come nel disegno di base (60-resa.js)
      if (typeof BOSS_A === 'undefined') return;
      const LA = BOSS_A.luciana, sc = 15 * LA.scala;
      const mani = n.maniA && n.maniA.length >= 2 ? n.maniA : [{ x: n.x - LA.scartoMani, y: LA.quotaRiposoY }, { x: n.x + LA.scartoMani, y: LA.quotaRiposoY }];
      manoS = [mani[0].x, mani[0].y + sc]; manoD = [mani[1].x, mani[1].y + sc];
    } else if (finale) return; // nella sala di Donna Luciana le Mani in alto non ci sono: niente fili da spezzare
    const y = n.y - 18 - (n.airZ || 0), dx = (n.boss ? 18 : 9) * FEEL.fili.scartoX;
    S.fili.push({ ax: manoS[0], ay: manoS[1], bx: n.x - dx, by: y, t: 0, lato: -1 });
    S.fili.push({ ax: manoD[0], ay: manoD[1], bx: n.x + dx, by: y, t: 0, lato: 1 });
    if (S.fili.length > 16) S.fili.splice(0, S.fili.length - 16);
  }
  function disegnaFiliSpezzati() {
    const F = C.crollo.filo;
    if (!S.fili.length) return;
    ctx.save();
    ctx.strokeStyle = FEEL.fili.colore; ctx.lineWidth = 1; ctx.lineCap = 'round';
    for (const f of S.fili) {
      const u = limita(f.t / F.durataTick, 0, 1), e = 1 - (1 - u) * (1 - u);
      const cx = (f.ax + f.bx) / 2, cy = (f.ay + f.by) / 2 + FEEL.fili.curvaPx * (1 - e);
      // il capo di sopra frusta indietro verso la Mano
      const fine = F.rottura * (1 - 0.8 * e), passi = 10;
      ctx.globalAlpha = F.alfa * Math.pow(1 - u, 0.7);
      ctx.beginPath();
      for (let i = 0; i <= passi; i++) {
        const q = (fine * i) / passi, r = 1 - q;
        let x = r * r * f.ax + 2 * r * q * cx + q * q * f.bx, y = r * r * f.ay + 2 * r * q * cy + q * q * f.by;
        const onda = Math.sin(i * 1.5 - f.t * 1.1) * F.frusta * (i / passi) * (1 - e);
        x += onda * f.lato; y -= Math.abs(onda) * 0.35;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // il moncone di sotto ricade col corpo
      const cade = 0.16 * f.t * f.t;
      ctx.beginPath();
      ctx.moveTo(f.bx, f.by + cade);
      ctx.quadraticCurveTo(f.bx + f.lato * 5 * e, f.by + cade - 7 * (1 - e), f.bx + f.lato * 8 * e, f.by + cade - 12 * (1 - e) + 4 * e);
      ctx.stroke();
      if (f.t < 4) { // la scintilla dello strappo
        const r = 1 - F.rottura, q = F.rottura;
        const x = r * r * f.ax + 2 * r * q * cx + q * q * f.bx, y = r * r * f.ay + 2 * r * q * cy + q * q * f.by;
        ctx.globalAlpha = 1 - f.t / 4;
        ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // --- tele dei caduti e pezzi ---
  function nuovaCattura() {
    const K = C.crollo;
    while (S.catture.length >= K.cattureMax) { // la più vecchia lascia il posto: i suoi resti spariscono
      const vecchia = S.catture[0];
      for (let i = S.pezzi.length - 1; i >= 0; i--) if (S.pezzi[i].cat === vecchia) S.pezzi.splice(i, 1);
      liberaCattura(vecchia);
    }
    const k = limita(Math.round(scalaBase), 1, K.risoluzioneMax);
    let tela = S.teleLibere.pop();
    if (!tela) tela = nuovaTela(O.cellaL * k, O.cellaA * k);
    if (tela.width !== Math.round(O.cellaL * k)) { tela.width = Math.round(O.cellaL * k); tela.height = Math.round(O.cellaA * k); }
    const cat = { tela, tctx: tela.getContext('2d'), k, vivi: 0, fermi: 0, scurita: false };
    S.catture.push(cat);
    return cat;
  }
  function liberaCattura(cat) {
    const i = S.catture.indexOf(cat);
    if (i >= 0) S.catture.splice(i, 1);
    if (S.teleLibere.length < C.crollo.cattureMax) S.teleLibere.push(cat.tela);
  }
  function togliPezzo(i) {
    const p = S.pezzi[i];
    S.pezzi.splice(i, 1);
    p.cat.vivi--;
    if (p.fermo) p.cat.fermi--;
    if (p.cat.vivi <= 0) liberaCattura(p.cat);
  }
  function scurisci(cat) {
    const x = cat.tctx;
    x.save();
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = C.crollo.coloreResti;
    x.fillRect(0, 0, cat.tela.width, cat.tela.height);
    x.restore();
    cat.scurita = true;
  }

  const OTTO_LATI = Object.freeze([[-1, 0], [1, 0], [0, -1], [0, 1], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]);
  const teleContorno = { piatta: null, bordo: null };
  /**
   * Stende un filo di contorno chiaro attorno alla sagoma ritratta in `cat` (sotto la figura, mai sopra):
   * la sagoma resa tinta unita, spostata negli otto versi e composta dietro. `materiale` sceglie l'alfa
   * (RIBALTA_B2.crollo.contorno): i resti scuri ne hanno più bisogno.
   */
  function contorna(cat, materiale) {
    const K = C.crollo.contorno, proprio = K.alfaPerMateriale[materiale];
    const alfa = typeof proprio === 'number' ? proprio : K.alfa;
    if (!(alfa > 0) || !(K.px > 0)) return;
    const l = cat.tela.width, a = cat.tela.height, T = teleContorno;
    if (!T.piatta) { T.piatta = nuovaTela(l, a); T.bordo = nuovaTela(l, a); }
    for (const t of [T.piatta, T.bordo]) if (t.width !== l || t.height !== a) { t.width = l; t.height = a; }
    const p = T.piatta.getContext('2d'), b = T.bordo.getContext('2d'), s = Math.max(1, K.px * cat.k);
    p.setTransform(1, 0, 0, 1, 0, 0); p.globalAlpha = 1;
    p.globalCompositeOperation = 'copy'; p.drawImage(cat.tela, 0, 0);
    p.globalCompositeOperation = 'source-in'; p.fillStyle = K.colore; p.fillRect(0, 0, l, a);
    p.globalCompositeOperation = 'source-over';
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
    b.clearRect(0, 0, l, a);
    for (const [dx, dy] of OTTO_LATI) b.drawImage(T.piatta, dx * s, dy * s);
    const d = cat.tctx;
    d.save();
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.globalCompositeOperation = 'destination-over';
    d.globalAlpha = Math.min(1, alfa);
    d.drawImage(T.bordo, 0, 0);
    d.restore();
  }

  /** Taglia la figura ritratta in `cat` nei pezzi della marionetta e li lancia. */
  function creaPezzi(cat, a) {
    const K = C.crollo, G = C.sagome, n = a.n;
    let gx, gy, alta, larga, quota = 0, righe = K.taglio.mob, spinta = K.spinta;
    if (!n) {
      gx = player.x; gy = player.y + O.piediGiocatore;
      alta = O.altezzaGiocatore * (player.scalaA2 || 1); larga = alta * G.larghezza.giocatore;
    } else {
      gx = n.x; gy = n.y + (n.boss ? O.piediBoss : O.piediNemico);
      alta = altezzaDi(n); larga = alta * (G.larghezza[foglioDi(n)] || G.larghezzaPredefinita);
      if (G.volano.includes(n.tipo)) quota = O.quotaVolo;
      if (n.boss) { righe = K.taglio.boss; spinta = K.spintaBoss; }
    }
    if (larga > alta * 1.05) righe = K.taglio.largo;
    alta = Math.min(alta, O.piedi - quota - 10);
    for (const [da, fino, colonne] of righe) {
      for (let c = 0; c < colonne; c++) {
        const passo = larga / colonne, esterno = larga * (colonne >= 3 ? 0.45 : colonne === 2 ? 0.25 : 0.35);
        let x0 = -larga / 2 + c * passo, x1 = x0 + passo;
        if (c === 0) x0 -= esterno;
        if (c === colonne - 1) x1 += esterno;
        x0 = Math.max(x0, -O.cellaL / 2); x1 = Math.min(x1, O.cellaL / 2);
        const cima = alta * (1 - da) + (da === 0 ? 9 : 0) + quota, fondo = alta * (1 - fino) + quota;
        const lw = x1 - x0, lh = cima - fondo, ox = (x0 + x1) / 2, hz = (cima + fondo) / 2;
        const p = {
          cat, sx: (O.cellaL / 2 + x0) * cat.k, sy: (O.piedi - cima) * cat.k, sw: lw * cat.k, sh: lh * cat.k, lw, lh,
          x: gx + ox, y: gy, z: hz, zRiposo: Math.max(1.5, Math.min(lw, lh) * 0.3),
          vx: a.kx * spinta + ox * 0.05 + tra(-0.6, 0.6), vy: a.ky * spinta * 0.6 + tra(-0.35, 0.35),
          vz: tra(0.9, 2.3) + hz * 0.02, rot: 0, vr: tra(-0.22, 0.22),
          rimbalzi: 0, fermo: false, svanisce: -1, sicuro: colonne < 3 || c === 1,
        };
        S.pezzi.push(p);
        cat.vivi++;
      }
    }
    // oltre il limite i resti più vecchi svaniscono
    let restano = 0;
    for (const p of S.pezzi) if (p.svanisce < 0) restano++;
    for (let i = 0; i < S.pezzi.length && restano > K.pezziMax; i++) {
      if (S.pezzi[i].svanisce < 0 && S.pezzi[i].cat !== cat) { S.pezzi[i].svanisce = K.svanisceTick; restano--; }
    }
  }

  /** Prima del pavimento: ritrae chi è appena caduto e lo fa a pezzi. */
  function eseguiCatture() {
    while (S.inAttesa.length) {
      const a = S.inAttesa.shift();
      const cat = nuovaCattura();
      const ent = a.n ? { genere: a.n.boss ? 'boss' : 'nemico', n: a.n, taglio: 3 } : { genere: 'giocatore', n: null, taglio: 4 };
      let riuscita = false;
      try { riuscita = ritrai(cat.tctx, 0, 0, cat.k, ent); } catch (err) { errore('ritratto del caduto', err); }
      if (!riuscita) { liberaCattura(cat); if (a.n) S.crollati.delete(a.n); continue; }
      try { contorna(cat, a.n ? materialeDi(a.n) : C.materiali.predefinito); } catch (err) { errore('contorno dei resti', err); }
      creaPezzi(cat, a);
      if (!a.n) S.giocatore.crollato = true;
    }
  }

  function alMorire(st, n) {
    const tipo = n.patternMob || n.tipo, c = S.ultimoColpo.get(n);
    let kx, ky;
    if (c) { kx = c.x; ky = c.y; } else { const dx = n.x - player.x, dy = n.y - player.y, l = Math.hypot(dx, dy) || 1; kx = dx / l; ky = dy / l; }
    if (C.attivi.particelle) schizzaColpo(n.x, n.y + 3, n.boss ? 22 : 12, kx, ky, materialeDi(n), n.boss ? 2.2 : 1.5);
    if (!C.attivi.crollo || C.crollo.senzaCrollo.includes(tipo) || S.inAttesa.length >= C.crollo.inAttesaMax) return;
    S.crollati.add(n);
    S.inAttesa.push({ n, kx, ky });
    spezzaFili(st, n);
  }

  function passoPezzi() {
    const K = C.crollo;
    for (let i = S.pezzi.length - 1; i >= 0; i--) {
      const p = S.pezzi[i];
      if (p.svanisce >= 0) { if (--p.svanisce <= 0) togliPezzo(i); continue; }
      if (p.fermo) continue;
      p.x += p.vx; p.y += p.vy; p.z += p.vz; p.vz -= K.gravita; p.rot += p.vr;
      if (p.x < ARENA.x1 - 4) { p.x = ARENA.x1 - 4; p.vx = Math.abs(p.vx) * 0.4; } else if (p.x > ARENA.x2 + 4) { p.x = ARENA.x2 + 4; p.vx = -Math.abs(p.vx) * 0.4; }
      if (p.y < ARENA.y1) { p.y = ARENA.y1; p.vy = Math.abs(p.vy) * 0.4; } else if (p.y > ARENA.y2 + 6) { p.y = ARENA.y2 + 6; p.vy = -Math.abs(p.vy) * 0.4; }
      if (p.z > p.zRiposo) continue;
      p.z = p.zRiposo;
      if (p.rimbalzi < K.rimbalziMax && -p.vz > K.velMinRimbalzo) {
        suonoLegno(-p.vz * 0.35);
        if (C.attivi.particelle && p.rimbalzi === 0 && p.sicuro) sbuffo(p.x, p.y + 2, p.vx * 0.2, 0);
        p.vz = -p.vz * K.elasticita; p.vx *= K.attritoUrto; p.vy *= K.attritoUrto; p.vr *= 0.55; p.rimbalzi++;
      } else {
        p.fermo = true; p.vx = 0; p.vy = 0; p.vz = 0; p.vr = 0;
        p.cat.fermi++;
        if (p.cat.fermi >= p.cat.vivi && !p.cat.scurita) scurisci(p.cat);
      }
    }
  }
  function disegnaPezzi(fermi) {
    const K = C.crollo;
    if (!S.pezzi.length) return;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    for (const p of S.pezzi) {
      if (p.fermo !== fermi) continue;
      const alfa = (p.fermo ? K.alfaResti : 1) * (p.svanisce >= 0 ? p.svanisce / K.svanisceTick : 1);
      if (p.sicuro) { // l'ombra di contatto: dice quanto il pezzo è alto da terra
        ctx.globalAlpha = 0.3 * alfa * limita(1 - p.z / 70, 0.25, 1);
        ctx.fillStyle = O.coloreContatto;
        ctx.beginPath(); ctx.ellipse(p.x, p.y + 1.5, Math.max(2, p.lw * 0.42), Math.max(1.2, p.lw * 0.16), 0, 0, TAU); ctx.fill();
      }
      ctx.save();
      ctx.globalAlpha = alfa;
      ctx.translate(p.x, p.y - p.z); ctx.rotate(p.rot);
      ctx.drawImage(p.cat.tela, p.sx, p.sy, p.sw, p.sh, -p.lw / 2, -p.lh / 2, p.lw, p.lh);
      ctx.restore();
    }
    ctx.restore();
  }

  // ===========================================================================
  // 4a. PELLICOLA: grana e vignettatura
  // ===========================================================================
  function disegnaGrana() {
    const P = C.pellicola, g = Math.max(1, Math.round(scalaBase * P.grossezza));
    ctx.save();
    if (S.graffio.vita > 0) {
      ctx.globalAlpha = P.graffi.alfa * Math.min(1, S.graffio.vita / 2);
      ctx.fillStyle = P.graffi.colore;
      ctx.fillRect(S.graffio.x, 0, 1, H);
    }
    const tela = telaGrana(g);
    if (!motivoGrana) motivoGrana = ctx.createPattern(tela, 'repeat');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = motivoGrana;
    const ox = S.granaX * g, oy = S.granaY * g;
    ctx.translate(-ox, -oy);
    ctx.fillRect(ox, oy, canvas.width, canvas.height);
    ctx.restore();
    S.conteggi.grana++;
  }
  function passoPellicola() {
    const P = C.pellicola;
    if (tick % P.cadenzaTick === 0) { S.granaX = Math.floor(caso() * P.cella); S.granaY = Math.floor(caso() * P.cella); }
    if (S.graffio.vita > 0) S.graffio.vita--;
    else if (caso() < P.graffi.prob) { S.graffio.x = Math.floor(tra(40, W - 40)); S.graffio.vita = P.graffi.durataTick; }
  }

  // ===========================================================================
  // STANZA: aggancio, passo logico (solo effetti), strati di disegno
  // ===========================================================================
  /** Azzera gli effetti e prepara la scenografia della stanza in cui si entra. */
  function agganciaStanza(st) {
    const D = C.scenografia;
    S.stanza = st || null;
    S.pezzi.length = 0; S.fili.length = 0; S.inAttesa.length = 0;
    while (S.catture.length) liberaCattura(S.catture[0]);
    for (const p of particelle) p.viva = false;
    S.morti = new WeakSet(); S.crollati = new WeakSet();
    S.giocatore.tMorte = -1; S.giocatore.crollato = false;
    for (const s of S.slot) { s.usato = false; s.valido = false; s.chi = null; }
    S.celle = new WeakMap();
    S.discesa = null; S.spostate = null;
    if (!st) return;
    for (const n of st.nemici || []) if (n && n.hp <= 0) S.morti.add(n);
    S.pulitaNota = Boolean(st.pulita);
    S.tensione = st.pulita ? 1 : 0;
    S.tTensione = -1;
    const voci = (st.ostacoli || []).slice().sort((a, b) => a.x - b.x)
      .map((o, i) => ({ o, ritardo: D.attesaTick + i * D.sfalsamentoTick, yVera: o.y, wVera: o.w, hVera: o.h, dy: 0 }));
    S.discesa = { t: 0, attiva: !st.pulita && voci.length > 0 && C.attivi.scenografia, bloccata: false, voci };
  }

  function passoB2() {
    passoPellicola();
    if (statoRun.fase === 'morte') {
      const g = S.giocatore;
      if (g.tMorte < 0) g.tMorte = 0;
      else if (!g.crollato && g.tMorte >= 0) {
        g.tMorte++;
        if (g.tMorte === ticksDaMs(C.crollo.ritardoGiocatoreMs) && C.attivi.crollo && S.stanza === statoRun.stanzaCorrente) {
          S.inAttesa.push({ n: null, kx: player.flipX ? 0.6 : -0.6, ky: 0.2 });
          suonoSchiocco(0, 0.9); suonoSchiocco(0.05, 1.05);
          if (C.attivi.particelle) schizzaColpo(player.x, player.y + 7, 14, player.flipX ? 1 : -1, 0, 'legno', 1.6);
        }
      }
    } else if (S.giocatore.tMorte >= 0) { S.giocatore.tMorte = -1; S.giocatore.crollato = false; }
    if (!inScena()) return;
    const st = statoRun.stanzaCorrente;
    if (!st) return;
    if (st !== S.stanza) agganciaStanza(st);
    for (const n of st.nemici) {
      if (n && n.hp <= 0 && !S.morti.has(n)) { S.morti.add(n); alMorire(st, n); }
    }
    if (fermoUI()) return;
    passoScenografia(st);
    if (ticksCongelati > 0) return; // hit-stop: i pezzi restano composti un istante, poi il corpo cede
    passoPezzi();
    passoParticelle();
    for (let i = S.fili.length - 1; i >= 0; i--) if (++S.fili[i].t > C.crollo.filo.durataTick) S.fili.splice(i, 1);
  }

  // ===========================================================================
  // PRESTAZIONI: misura dei frame e degrado prudente delle ombre lunghe
  // ===========================================================================
  /**
   * Decide il gradino di degrado delle ombre lunghe da una finestra di misura chiusa a `fps` frame al secondo
   * (tabella RIBALTA_B2.prestazioni). Separata dalla misura perché la QA la possa provare coi numeri.
   * @param {number} fps media dei frame nella finestra appena chiusa
   * @returns {number} il gradino dopo la decisione (0 = piena frequenza, 1 = sagome a metà frequenza…)
   */
  function valutaFinestra(fps) {
    const P = C.prestazioni, M = S.misura;
    M.fps = fps;
    if (fps < P.sogliaFps) {
      M.buone = 0;
      if (++M.lente >= P.finestreLente) { M.lente = 0; if (S.degrado < P.gradiniMax) S.degrado++; }
    } else {
      M.lente = 0;
      if (fps >= P.recuperoFps && S.degrado > 0 && M.recuperi < P.recuperiMax) {
        if (++M.buone >= P.finestreBuone) { M.buone = 0; S.degrado--; M.recuperi++; }
      } else M.buone = 0;
    }
    return S.degrado;
  }
  /**
   * Conta i frame disegnati in finestre da `finestraMs` e a ogni finestra chiusa chiama valutaFinestra.
   * Fuori scena, in pausa, a scheda nascosta o con le ombre spente non misura: lì non c'è nulla da alleggerire.
   */
  function misuraFrame() {
    const P = C.prestazioni, M = S.misura, ora = performance.now(), dt = ora - M.ultimo;
    M.ultimo = ora;
    if (M.bloccata) return; // QA: decide solo valutaFinestra chiamata a mano
    if (!(dt > 0) || dt > P.pausaMs || document.hidden || !inScena() || fermoUI() || !ombreAccese()) { M.inizio = ora; M.frame = 0; return; }
    M.frame++;
    if (ora - M.inizio < P.finestraMs) return;
    const fps = (M.frame * 1000) / (ora - M.inizio);
    M.inizio = ora; M.frame = 0;
    valutaFinestra(fps);
  }

  /** Strato del palco: sopra il pavimento, sotto ostacoli, nemici e Ferruccio. */
  function disegnaStratoPalco(tk, st) {
    if (C.attivi.lumi || ombreAccese() || OPZIONI.vignetta) { disegnaLuce(st, tk); ripassaEtichette(); }
    if (C.attivi.riflessi && pianoNelCiclo() === C.riflessi.piano) disegnaRiflessi(tk);
    disegnaPezzi(true);
    if (C.attivi.scenografia) disegnaCaviEAtterraggi(st, tk);
    if (C.attivi.lumi) disegnaLumi(tk);
  }
  /** Strato alto: sopra nemici e Ferruccio, sotto i colpi nemici, le Mani e l'HUD. */
  function disegnaStratoAlto() {
    disegnaPezzi(false);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    disegnaParticelle();
    ctx.restore();
    disegnaFiliSpezzati();
  }

  // ===========================================================================
  // AVVOLGIMENTI (chiamano sempre la base; ogni strato è protetto: un errore qui non ferma il gioco)
  // ===========================================================================
  const disegnaFrameBaseB2 = disegnaFrame;
  disegnaFrame = function disegnaFrameB2(...args) {
    let spostata = false;
    try { spostata = spostaScenografia(); } catch (err) { errore('scenografia', err); }
    try { return disegnaFrameBaseB2.apply(this, args); } finally {
      if (spostata || S.spostate) rimettiScenografia();
      S.frame++;
      try { misuraFrame(); } catch (err) { errore('misura dei frame', err); }
    }
  };

  // Le etichette disegnate dentro la catena della stanza (arredi di a3 e di chi verrà) finiscono sotto lo
  // strato di luce: se ne prende nota per ripassarle sopra (ripassaEtichette). Fuori dalla stanza non costa nulla.
  const drawPillLabelBaseB2 = drawPillLabel;
  drawPillLabel = function drawPillLabelB2(...args) {
    if (S.registraEtichette && S.etichette.length < C.luce.etichetteMax) S.etichette.push(args);
    return drawPillLabelBaseB2.apply(this, args);
  };

  const disegnaStanzaBaseB2 = disegnaStanzaPixelArt;
  disegnaStanzaPixelArt = function disegnaStanzaPixelArtB2(tk, st, ...resto) {
    const mia = Boolean(st) && st === statoRun.stanzaCorrente && inScena();
    if (mia) {
      try {
        if (st !== S.stanza) agganciaStanza(st);
        eseguiCatture();
        preparaSagome(st);
      } catch (err) { errore('sagome', err); }
    }
    S.etichette.length = 0;
    S.registraEtichette = mia;
    let r;
    try { r = disegnaStanzaBaseB2.call(this, tk, st, ...resto); } finally { S.registraEtichette = false; }
    if (mia) {
      ctx.save();
      try { disegnaStratoPalco(tk, st); } catch (err) { errore('strato del palco', err); } finally { ctx.restore(); }
    }
    return r;
  };

  const disegnaFamigliBaseB2 = disegnaFamigliOrbitaliD;
  disegnaFamigliOrbitaliD = function disegnaFamigliOrbitaliDB2(...args) {
    const r = disegnaFamigliBaseB2.apply(this, args);
    if (inScena() && statoRun.stanzaCorrente === S.stanza) {
      ctx.save();
      try { disegnaStratoAlto(); } catch (err) { errore('strato alto', err); } finally { ctx.restore(); }
    }
    return r;
  };

  const t4GancioBaseB2 = t4Gancio;
  t4Gancio = function t4GancioB2(nome, ...args) {
    const r = t4GancioBaseB2.call(this, nome, ...args);
    if (nome === 'sopra') { try { if (OPZIONI.grana) disegnaGrana(); } catch (err) { errore('grana', err); } }
    return r;
  };

  const passoLogicoBaseB2 = passoLogico;
  passoLogico = function passoLogicoB2(...args) {
    const r = passoLogicoBaseB2.apply(this, args);
    try { passoB2(); } catch (err) { errore('passo', err); }
    return r;
  };

  const entraInStanzaBaseB2 = entraInStanza;
  entraInStanza = function entraInStanzaB2(...args) {
    const colpiPrima = statoRun.proiettili;
    const r = entraInStanzaBaseB2.apply(this, args);
    try {
      // la base è passata davvero (un lucchetto può respingere) se ha rifatto la lista dei colpi
      if (statoRun.proiettili !== colpiPrima || statoRun.stanzaCorrente !== S.stanza) agganciaStanza(statoRun.stanzaCorrente);
    } catch (err) { errore('ingresso', err); }
    return r;
  };

  const danneggiaNemicoBaseB2 = danneggiaNemico;
  danneggiaNemico = function danneggiaNemicoB2(nem, dmg, kx, ky, ...resto) {
    const hpPrima = nem ? nem.hp : 0;
    S.passaggiColpo++;
    const r = danneggiaNemicoBaseB2.call(this, nem, dmg, kx, ky, ...resto);
    try { if (nem) dopoColpo(nem, hpPrima, kx, ky); } catch (err) { errore('colpo', err); }
    return r;
  };

  // Il raggio del patto (T3) non chiama la danneggiaNemico globale ma il riferimento che 80-ciclo.js ha messo
  // in window.__teatroInterno prima di ogni avvolgimento: lo si avvolge allo stesso modo, chiamando sempre
  // ciò che c'era. Se un altro file l'ha già rimandato alla funzione globale, le schegge dei colpi con spinta
  // le ha già fatte l'avvolgimento qui sopra (lo dice S.passaggiColpo) e non si ripetono.
  {
    const TI = window.__teatroInterno;
    if (TI && typeof TI.danneggiaNemico === 'function') {
      const internoBaseB2 = TI.danneggiaNemico;
      TI.danneggiaNemico = function danneggiaNemicoInternoB2(nem, dmg, kx, ky, ...resto) {
        const hpPrima = nem ? nem.hp : 0, passaggi = S.passaggiColpo;
        const r = internoBaseB2.call(this, nem, dmg, kx, ky, ...resto);
        try {
          if (nem) {
            if (Math.hypot(kx || 0, ky || 0) > 0) { if (S.passaggiColpo === passaggi) dopoColpo(nem, hpPrima, kx, ky); }
            else dopoColpoContinuo(nem, hpPrima);
          }
        } catch (err) { errore('colpo dal riferimento interno', err); }
        return r;
      };
    }
  }

  // Ferruccio crollato in pezzi non si ridisegna intero sotto il velo della morte (unica base non chiamata).
  const ferruccioBaseB2 = disegnaFerruccioPittorico;
  disegnaFerruccioPittorico = function disegnaFerruccioPittoricoB2(...args) {
    if (S.giocatore.crollato && !S.inCattura && statoRun.fase === 'morte') return undefined;
    return ferruccioBaseB2.apply(this, args);
  };

  // La posa di morte del foglio (t2) resta per chi non crolla in pezzi (il Bozzo che esplode).
  {
    const g = t2();
    if (g && typeof g.dopoNemici === 'function') {
      const dopoBase = g.dopoNemici, finta = { nemici: [] };
      g.dopoNemici = function dopoNemiciB2(c, st, ...resto) {
        if (!st || !st.nemici || !C.attivi.crollo) return dopoBase.call(this, c, st, ...resto);
        finta.nemici.length = 0;
        for (const n of st.nemici) if (!S.crollati.has(n)) finta.nemici.push(n);
        return dopoBase.call(this, c, finta, ...resto);
      };
    }
  }

  // Scricchiolio delle giunture di legno a passi e fendenti (leggero, variato, non a ogni passo).
  {
    const passoBase = AudioSys.playPasso, fendenteBase = AudioSys.playFendente;
    AudioSys.playPasso = function playPassoB2(...args) {
      const r = passoBase.apply(this, args);
      if (C.attivi.scricchiolii && caso() < C.suoni.probPasso) suonoScricchiolio(C.suoni.scricchiolio * 0.8, false);
      return r;
    };
    AudioSys.playFendente = function playFendenteB2(...args) {
      const r = fendenteBase.apply(this, args);
      if (C.attivi.scricchiolii && caso() < C.suoni.probFendente) suonoScricchiolio(C.suoni.scricchiolio, false);
      return r;
    };
  }

  // ===========================================================================
  // SONDA QA (tools/qa-teatro-ribalta.js)
  // ===========================================================================
  if (window.__teatro && window.__teatro.interni) {
    Object.assign(window.__teatro.interni, {
      RIBALTA_B2,
      /**
       * Ripari dalle ombre lunghe: chi disegna qualcosa che sta in piedi dentro la catena di
       * disegnaStanzaPixelArt aggiunge qui una funzione (stanza, aggiungi) e chiama aggiungi(x, y, rx, ry).
       */
      ripariLuceB2: fontiRipari,
      ribaltaB2: {
        /** Fotografia dello stato degli effetti (sola lettura). */
        stato() {
          let vive = 0;
          for (const p of particelle) if (p.viva) vive++;
          const d = S.discesa;
          return {
            pezzi: S.pezzi.length, pezziFermi: S.pezzi.filter((p) => p.fermo).length, catture: S.catture.length,
            particelle: vive, fili: S.fili.length, sagome: S.slot.filter((s) => s.usato).length,
            discesaAttiva: Boolean(d && d.attiva), discesaT: d ? d.t : -1, voci: d ? d.voci.length : 0,
            quote: d ? d.voci.map((v) => Math.round(v.dy)) : [], tensione: Number(S.tensione.toFixed(3)),
            giocatoreCrollato: S.giocatore.crollato, errori: erroriVisti, conteggi: Object.assign({}, S.conteggi),
            ombreAccese: ombreAccese(), degrado: S.degrado, fps: Math.round(S.misura.fps), frame: S.frame,
            ripari: S.nRipari, etichette: S.etichette.length,
            filiDa: S.fili.map((f) => [Math.round(f.ax), Math.round(f.ay)]),
          };
        },
        /** QA: fa valutare una finestra di misura finta a `fps` frame al secondo; rende il gradino di degrado. */
        valutaFinestra,
        /** QA: riporta il degrado delle ombre a zero e azzera i contatori della misura. */
        azzeraPrestazioni() { S.degrado = 0; Object.assign(S.misura, { frame: 0, lente: 0, buone: 0, recuperi: 0, fps: 0 }); },
        /** QA: ferma (true) o riavvia (false) la misura automatica dei frame, per provare il degrado coi numeri. */
        bloccaMisura(si) { S.misura.bloccata = Boolean(si); },
        /** QA: ferma la discesa della scenografia al tick `t` (per fotografarla a mezz'aria). */
        fermaDiscesa(t) { if (S.discesa) { S.discesa.attiva = true; S.discesa.bloccata = true; S.discesa.t = t; } },
        /** QA: la discesa riprende da dov'era. */
        riprendiDiscesa() { if (S.discesa) S.discesa.bloccata = false; },
        /** QA: durata in tick della discesa dell'ultimo pezzo della stanza corrente. */
        durataDiscesa() {
          const D = C.scenografia, d = S.discesa;
          const ultimo = d && d.voci.length ? d.voci[d.voci.length - 1].ritardo : 0;
          return ultimo + D.cadutaTick + D.rimbalzo1Tick + D.rimbalzo2Tick;
        },
        materialeDi,
      },
    });
  }
})();
