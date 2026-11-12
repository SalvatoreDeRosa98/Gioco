/*
 * teatro/b9-immagini.js — (squadra b9) IMMAGINI DI SCENA dell'autore al posto dei disegni provvisori a canvas.
 *
 * Decisione dell'autore: «usa la mia immagine dove migliora il gioco, tieni il disegno a codice dove è più
 * bello». Ogni PNG di gioco/assets/sprite_teatro/scena/ ha UNA voce nella tabella IMMAGINI_B9: celle del
 * foglio, altezza a schermo, àncora, dove si usa e `usa: true/false` (col motivo se false). Solo le voci con
 * `usa: true` si caricano, si disegnano e finiscono nel file unico di release (tools/teatro-release.js legge
 * questa tabella). Elenco ragionato e foto prima/dopo: production/arte/immagini-collegate.md.
 *
 * COME FUNZIONA
 *   - immagineScena(nome) → Image pronta oppure null (cache; in release da window.__risorseTeatro, altrimenti
 *     dal percorso relativo). Finché un'immagine non c'è (manca, non è ancora caricata, è spenta) ogni
 *     elemento resta disegnato dal codice di prima: mai uno schermo vuoto, mai un errore.
 *   - Le immagini non si riducono mai a ogni fotogramma: fotogrammaB9() prepara ogni cella UNA volta su una
 *     tela fuori schermo già alla scala del buffer (dimezzamenti successivi: niente scalette), e a ogni frame
 *     si copia quella tela pixel su pixel. I pezzi fermi del teatro (palchetti, platea) finiscono nelle tele
 *     in cache di b1.
 *   - Niente logica di gioco: collisioni, economia e rng() non si toccano. L'immagine si adatta all'ingombro
 *     dell'elemento (campo `alt` della tabella), non il contrario.
 *
 * SCELTE (2026-11-10, guardando ogni immagine nel gioco accanto al disegno a codice): 28 usate, 24 a codice.
 * Le scartate restano collegate ma spente: se l'autore le rigenera basta rimettere `usa: true` nella tabella.
 * Le immagini scure prendono un filo di luce calda sul contorno (opzione `filo`), come le sagome «a ombre».
 *
 * AGGANCI (dove non c'era una funzione da avvolgere): 60-resa.js (ciclo degli ostacoli → disegnaOstacoloB9),
 * b2-ribalta.js (disegnaLumeB9, disegnaCavoB9), b7-stanze.js (spuntoniImmagineB9, saccoImmagineB9),
 * a3-stanze-speciali.js (arredoImmagineB9), b3-comandi-opzioni.js (cartiglioOpzioniB9, interruttoreB9,
 * tastoPergamenaB9, cursoreB9). Il resto avvolge: ELEMENTI_B1 (b1), reazionePubblicoB1, disegnaForziereA1,
 * disegnaLucchettoA1, disegnaClessidraB7, disegnaCiarlatanoB7, parteCoronaB4, parteMascheraB4,
 * disegnaDietroB4, disegnaSegniA6, drawTextFit, disegnaStanzaPixelArt. Ogni avvolgimento chiama la base
 * quando l'immagine non c'è.
 *
 * Da file:// le immagini «sporcano» il canvas come i fogli sprite (niente getImageData dopo averle disegnate):
 * nella release, dove arrivano da data: URI, non succede.
 *
 * QA: tools/qa-teatro-immagini.js. Sonda: window.__teatro.interni.immaginiB9.
 */

// ===========================================================================
// TABELLA DELLE IMMAGINI (solo dati: la legge anche tools/teatro-release.js)
//   celle  [righe, colonne] del foglio (celle tutte uguali)
//   alt    altezza a schermo di UNA cella, in px del canvas 640×360
//   ancora [fx, fy] punto della cella (0..1) che va sul punto dell'elemento (piedi, centro, appiglio)
//   dove   file e funzione in cui si disegna
//   usa    true = collegata; false = resta il disegno a codice, e `motivo` dice perché
// ===========================================================================
// <tabella-immagini>
const IMMAGINI_B9 = Object.freeze({
  // --- A. il teatro attorno al palco (b1-pubblico.js) ---
  'palchetto': { celle: [1, 1], alt: 93, ancora: [0.5, 0.667], dove: 'b1 ELEMENTI_B1.palcoLato*/balconata* (fondo e parapetto ritagliati dalla stessa immagine)', usa: true },
  'spettatori': { celle: [6, 4], alt: 46, ancora: [0.5, 0.9], dove: 'b1 ELEMENTI_B1.spettatore', usa: false,
    motivo: 'sagome quasi identiche (un ovale con la testa) e fotogrammi che non si distinguono: le sagome a codice hanno cilindri, piume, ventagli e si muovono' },
  'platea': { celle: [1, 1], alt: 53.3, ancora: [0, 1], dove: 'b1 ELEMENTI_B1.buioPlatea (fila di fondo, dietro le sagome animate, col filo di luce sulle teste)', usa: true },
  'sipario-telo': { celle: [1, 1], alt: 360, ancora: [0, 0], dove: 'b1 ELEMENTI_B1.teloSipario', usa: false,
    motivo: 'strisce piatte senza pieghe né ombre: il velluto a codice ha volume, gallone e frangia' },
  'sipario-mantovana': { celle: [1, 1], alt: 58, ancora: [0, 0], dove: 'b1 ELEMENTI_B1.mantovana', usa: false,
    motivo: 'festoni a tre fasce di rosso piatto: accanto al velluto a pieghe del telo stonano; la mantovana a codice ha pieghe, ombre, frangia e nappe' },
  'lancio-fiore': { celle: [1, 1], alt: 13, ancora: [0.5, 0.56], dove: 'b1 ELEMENTI_B1.fiore (applausi)', usa: true },
  'lancio-mazzo': { celle: [1, 1], alt: 14, ancora: [0.5, 0.57], dove: 'b1 ELEMENTI_B1.fiore (un lancio su due)', usa: true },
  'lancio-ortaggio': { celle: [1, 1], alt: 12, ancora: [0.5, 0.5], dove: 'b1 ELEMENTI_B1.fiore dopo i fischi (lanciaOrtaggiB9)', usa: true },
  // --- A. la ribalta (b2-ribalta.js) ---
  'lume-ribalta': { celle: [1, 4], alt: 30, ancora: [0.5, 0.742], dove: 'b2 disegnaLumi → disegnaLumeB9', usa: true },
  'cavo-gancio': { celle: [1, 1], alt: 20, ancora: [0.5, 0.95], dove: 'b2 disegnaCavo → disegnaCavoB9 (gancio in fondo a ogni cavo)', usa: true },
  // --- B. scenografia appesa ai cavi: ostacoli (60-resa.js, b7-stanze.js) ---
  'ostacolo-lampione': { celle: [1, 1], alt: 64, ancora: [0.5, 0.94], dove: 'ostacolo «lampione» di b7 (Corso Trieste)', usa: true },
  'ostacolo-carretto': { celle: [1, 1], alt: 46, ancora: [0.5, 0.8], dove: 'colonna di base al Corso Trieste', usa: true },
  'ostacolo-fontanella': { celle: [1, 1], alt: 58, ancora: [0.5, 0.9], dove: 'colonna di base al Corso Trieste', usa: true },
  'ostacolo-albero': { celle: [1, 1], alt: 62, ancora: [0.5, 0.89], dove: 'colonna di base alla Villa Comunale', usa: true },
  'ostacolo-aiuola': { celle: [1, 1], alt: 24, ancora: [0.486, 0.62], dove: 'ostacolo «aiuola» di b7 (Villa Comunale)', usa: true },
  'ostacolo-panchina': { celle: [1, 1], alt: 22, ancora: [0.497, 0.82], dove: 'colonna di base alla Villa Comunale', usa: true },
  'ostacolo-telaio': { celle: [1, 1], alt: 58, ancora: [0.5, 0.86], dove: 'ostacolo «telaio» di b7 e colonna di base a San Leucio', usa: true },
  'ostacolo-balla-seta': { celle: [1, 1], alt: 40, ancora: [0.5, 0.78], dove: 'fragile «balla» di b7 (San Leucio)', usa: false,
    motivo: 'un ovale bianco col bollo rosso: a schermo sembra un uovo o uno scudo, non una balla di seta; la balla a codice si riconosce meglio' },
  'ostacolo-arcolaio': { celle: [1, 1], alt: 56, ancora: [0.5, 0.9], dove: 'colonna di base a San Leucio', usa: false,
    motivo: 'figura filiforme e scura: non si legge come un ostacolo pieno (blocca passi e colpi) e sul pavimento rosso scuro quasi sparisce' },
  'ostacolo-colonna': { celle: [1, 1], alt: 62, ancora: [0.5, 0.87], dove: 'ostacolo «marmo» di b7 e colonna di base alla Reggia', usa: true },
  'ostacolo-statua': { celle: [1, 1], alt: 58, ancora: [0.5, 0.885], dove: 'ostacolo «statua» di b7 (Reggia)', usa: true },
  'ostacolo-candelabro': { celle: [1, 1], alt: 50, ancora: [0.5, 0.89], dove: 'ostacolo «candela» accesa di b7', usa: true },
  'ostacolo-braciere': { celle: [1, 2], alt: 40, ancora: [0.5, 0.89], dove: 'braciere di base (spento / acceso)', usa: true },
  'ostacolo-cassa-polvere': { celle: [1, 1], alt: 34, ancora: [0.47, 0.82], dove: 'fragile «polvere» di b7', usa: true },
  'ostacolo-botte': { celle: [1, 1], alt: 33, ancora: [0.5, 0.83], dove: 'fragile «botte» di b7 (Corso Trieste)', usa: true },
  'ostacolo-sacco': { celle: [1, 1], alt: 30, ancora: [0.5, 0.5], dove: 'sacco di sabbia appeso di b7 (disegnaSacchiB7)', usa: true },
  'trappola-chiodi': { celle: [1, 3], alt: 19.8, ancora: [0.5, 0.57], dove: 'chiodi del palco di b7 (disegnaSuoloB7)', usa: false,
    motivo: 'chiodi grigio scuro e sottili sulle assi brune: a schermo i tre stati non si distinguono, e una trappola deve dire subito quando è fuori' },
  // --- C. eventi e botteghe (a1, a3, b7) ---
  'carta-dorso': { celle: [1, 1], alt: 30, ancora: [0.5, 1], dove: 'nessuno', usa: false, motivo: 'non serve più: il ciarlatano gioca con tre scatole, non con le carte' },
  'carta-asso-denari': { celle: [1, 1], alt: 30, ancora: [0.5, 1], dove: 'nessuno', usa: false, motivo: 'non serve più: il ciarlatano gioca con tre scatole, non con le carte' },
  'carta-re-coppe': { celle: [1, 1], alt: 30, ancora: [0.5, 1], dove: 'nessuno', usa: false, motivo: 'non serve più: il ciarlatano gioca con tre scatole, non con le carte' },
  'carta-cavallo-spade': { celle: [1, 1], alt: 30, ancora: [0.5, 1], dove: 'nessuno', usa: false, motivo: 'non serve più: il ciarlatano gioca con tre scatole, non con le carte' },
  'npc-ciarlatano': { celle: [2, 4], alt: 63, ancora: [0.5, 0.661], dove: 'b7 disegnaCiarlatanoB7 (le tre scatole restano a codice, sopra il tavolino)', usa: false,
    motivo: 'figura minuta e sottile dentro la cella, col tavolino a crociera che si confonde con le tre scatole del gioco; sul tavolo ha le carte, che non si usano più' },
  'npc-don-gennaro': { celle: [2, 4], alt: 64, ancora: [0.477, 0.7465], dove: 'a3 banco del lotto (arredoImmagineB9)', usa: true },
  'npc-cartomante': { celle: [2, 4], alt: 60, ancora: [0.5, 0.704], dove: 'a3 Cartomante della Bisca (arredoImmagineB9)', usa: true },
  'banco-lotto': { celle: [1, 1], alt: 48, ancora: [0.5, 0.7], dove: 'a3 banco del lotto, se manca Don Gennaro', usa: false,
    motivo: 'doppione: il foglio di Don Gennaro ha già il suo banco; in più porta la scritta «IL LOTTO»' },
  'ceppo-chiodi': { celle: [1, 1], alt: 58, ancora: [0.5, 0.77], dove: 'a3 ceppo del Sacrificio (arredoImmagineB9)', usa: false,
    motivo: 'ceppo quasi nero a tinta piatta: sul pavimento scuro della stanza sparisce e restano solo i chiodi; quello a codice si vede e si capisce' },
  'forzieri': { celle: [2, 2], alt: 42, ancora: [0.5, 0.693], dove: 'a1 disegnaForziereA1 (riga: comune / ferrato; colonna: chiuso / aperto)', usa: true },
  'lucchetto-porta': { celle: [1, 1], alt: 23, ancora: [0.5, 0.57], dove: 'a1 disegnaLucchettoA1 (le catene restano a codice)', usa: true },
  'clessidra': { celle: [1, 1], alt: 101, ancora: [0.5, 0.911], dove: 'b7 disegnaClessidraB7 (la sabbia resta a codice)', usa: true },
  // --- D. trasformazioni (b4-trasformazioni.js) ---
  'trasf-re-denari-corona': { celle: [1, 1], alt: 11.6, ancora: [0.5, 0.714], dove: 'b4 parteCoronaB4', usa: false,
    motivo: 'corona d\'ebano scura: su Taddeo e sull\'Ombra Senza Fili si vedono solo i puntini d\'oro; quella a codice ha il contorno d\'oro e si legge su tutti e quattro' },
  'trasf-re-denari-mantello': { celle: [1, 1], alt: 32, ancora: [0.5, 0.15], dove: 'b4 disegnaDietroB4 (dietro le spalle)', usa: false,
    motivo: 'è visto di spalle e simmetrico: dietro un burattino di tre quarti spunta solo come uno straccio rosso fra le gambe; il mantello a codice si apre dietro le spalle e si muove' },
  'trasf-pulcinella-maschera': { celle: [1, 1], alt: 12, ancora: [0.56, 0.4], dove: 'b4 parteMascheraB4', usa: false,
    motivo: 'macchia nera senza bordo né occhi: sul viso dei burattini non si distingue; la maschera a codice ha il cuoio bruno, il bordo chiaro e il naso a becco' },
  'trasf-ombra-velo': { celle: [1, 1], alt: 38, ancora: [0.5, 0.3], dove: 'b4 disegnaDietroB4 (dietro il burattino)', usa: false,
    motivo: 'un alone grigio con una spirale di tratti rossi e neri: dietro il burattino quasi non si vede e non si legge come un velo; i fili neri a codice bastano' },
  // --- E. porta della bottega (hub: t4-hub-storia.js, di un'altra squadra) ---
  'porta-bottega-chiusa': { celle: [1, 1], alt: 60, ancora: [0.5, 1], dove: 'nessuno (hub)', usa: false, motivo: 'porta la scritta «LA BOTTEGA» ed è un abbozzo a tinte piatte; l\'hub è di un\'altra squadra' },
  'porta-bottega-socchiusa': { celle: [1, 1], alt: 60, ancora: [0.5, 1], dove: 'nessuno (hub)', usa: false, motivo: 'porta la scritta «LA BOTTEGA» ed è un abbozzo a tinte piatte; l\'hub è di un\'altra squadra' },
  'porta-bottega-aperta': { celle: [1, 1], alt: 60, ancora: [0.5, 1], dove: 'nessuno (hub)', usa: false, motivo: 'porta la scritta «LA BOTTEGA» ed è un abbozzo a tinte piatte; l\'hub è di un\'altra squadra' },
  // --- G. interfaccia (b3-comandi-opzioni.js, a6-progressione.js) ---
  'ui-pad-simboli': { celle: [1, 13], alt: 10, ancora: [0.5, 0.5], dove: 'drawTextFit col gamepad: simboli al posto di Ⓐ Ⓑ Ⓧ Ⓨ ✥ [LT] [RB]…', usa: false,
    motivo: 'alla misura delle scritte (7-9 px) sono dischetti scuri con la lettera illeggibile: i caratteri Ⓐ Ⓑ Ⓧ Ⓨ si leggono meglio' },
  'ui-cartiglio-opzioni': { celle: [1, 1], alt: 368, ancora: [0, 0], dove: 'b3 disegnaOpzioniB3 (cartiglioOpzioniB9)', usa: true },
  'ui-tasto-pergamena': { celle: [1, 1], alt: 12.5, ancora: [0, 0], dove: 'b3 riga dei tasti (tastoPergamenaB9, in tre fette)', usa: false,
    motivo: 'alto 12 px, i due estremi decorati (punto d\'oro e staffa rossa) stringono la lettera fra due macchie: il tasto liscio a codice si legge meglio' },
  'ui-cursore-mano': { celle: [1, 1], alt: 13, ancora: [0.5, 0.47], dove: 'b3 cursore del menu di pausa e delle Opzioni (cursoreB9)', usa: true },
  'ui-interruttore-lanterna': { celle: [1, 2], alt: 13, ancora: [0.5, 0.5], dove: 'b3 righe «spunta» delle Opzioni (interruttoreB9)', usa: false,
    motivo: 'in una riga alta 13 px la lanterna è una macchiolina e accesa/spenta si distinguono poco: la levetta a codice lo dice meglio' },
  'segni-boss': { celle: [1, 10], alt: 11, ancora: [0.5, 0.5], usa: true,
    dove: 'a6 disegnaSegniA6: dieci medaglioni (i quattro boss di b6, poi gatto, chiave, ago, campana, forbici, maschera); '
      + 'i segni senza medaglione (Guardiano, Campanaro, Giudice) hanno un medaglione a codice nello stesso stile' },
});
// </tabella-immagini>

/** Numeri e tabelle di questo file (niente valori sparsi nel codice). */
const CONFIG_B9 = Object.freeze({
  cartella: 'assets/sprite_teatro/scena/',
  mipMax: 5,                    // dimezzamenti al massimo (1/32)
  fotogrammiMax: 260,           // tele in cache prima di ripartire
  ombra: 'rgba(8, 5, 3, 0.6)',  // ombra di contatto degli ostacoli (come 60-resa.js e b7)
  filo: Object.freeze({ px: 0.55, colore: 'rgba(236, 184, 96, 0.75)' }), // filo di luce di lanterna attorno alle sagome scure
  // --- palchetto.png: righe e colonne dell'immagine (px d'origine 480×360) ---
  palchetto: Object.freeze({
    cielo: Object.freeze([15, 70]),        // cornice in alto
    festone: Object.freeze([70, 118]),     // drappo a festone (strato DAVANTI agli spettatori)
    vano: Object.freeze([70, 240]),        // festone, drappi e interno (strato DIETRO)
    parapetto: Object.freeze([236, 336]),  // parapetto di stucco dorato (strato DAVANTI)
    vanoX: Object.freeze([92, 392]),       // fra le due colonne
    colonna: Object.freeze([54, 92, 78, 240]),      // colonna di sinistra [x0, x1, y0, y1]
    parapettoX: Object.freeze([48, 434]),
    cieloX: Object.freeze([27, 456]),
    // palchi di proscenio (colonna di 48 px): scala unica, si vede la parte centrale del palchetto
    lati: Object.freeze({ scala: 0.2588, daX: 147.5, festoneSu: 7, pilastro: 4.5 }),
    // balconata in alto: pezzi dello stesso palchetto alla misura dei palchi di b1 (42 px di vano, passo 50)
    alto: Object.freeze({ cieloY: -1.5, cieloA: 6.2, festoneY: 3.2, festoneA: 11.5, colonnaY: 8, colonnaA: 34, parapettoY: 40.2, parapettoA: 13 }),
  }),
  platea: Object.freeze({ righe: Object.freeze([54, 132]), alfa: 0.9, filo: 0.6, coloreFilo: 'rgba(214, 158, 60, 0.5)', margineDock: 14 }),
  mantovana: Object.freeze({ righe: Object.freeze([0, 178]) }),
  ortaggi: Object.freeze({ quanti: 3, attesaTick: 900 }),   // pomodori dopo i fischi (a stanza senza nemici)
  lume: Object.freeze({ ogniTick: 7, bagliore: 13, alfaBagliore: 0.55 }),
  cavo: Object.freeze({ alfa: 0.9, anello: 0.045 }),   // alfa del gancio; anello = quota dell'anello in cima alle quinte (frazione della cella)
  // ostacoli: pelle → immagine, ombra di contatto [rx, ry]; `luce` = alone caldo [dy, raggio]
  ostacoli: Object.freeze({
    varianti: Object.freeze({
      lampione: Object.freeze({ img: 'ostacolo-lampione', ombra: [9, 3.5], luce: [-44, 16] }),
      aiuola: Object.freeze({ img: 'ostacolo-aiuola', ombra: [19, 6] }),
      telaio: Object.freeze({ img: 'ostacolo-telaio', ombra: [17, 5] }),
      balla: Object.freeze({ img: 'ostacolo-balla-seta', ombra: [12, 4.5] }),
      marmo: Object.freeze({ img: 'ostacolo-colonna', ombra: [14, 5] }),
      statua: Object.freeze({ img: 'ostacolo-statua', ombra: [12, 4.5], tinta: 'rgba(46, 54, 70, 0.46)' }), // gesso in ombra: ben diversa dal nemico di marmo bianco
      botte: Object.freeze({ img: 'ostacolo-botte', ombra: [12, 4.5] }),
      polvere: Object.freeze({ img: 'ostacolo-cassa-polvere', ombra: [13, 4.5], miccia: [13, -19] }),
      candela: Object.freeze({ img: 'ostacolo-candelabro', ombra: [8, 3], soloAcceso: true, luce: [-38, 13] }),
    }),
    // colonne di base (senza `variante`): una pelle per quartiere, scelta dalla posizione (sempre la stessa)
    colonne: Object.freeze({
      1: Object.freeze([Object.freeze({ img: 'ostacolo-fontanella', ombra: [12, 4.5] }), Object.freeze({ img: 'ostacolo-carretto', ombra: [16, 5] })]),
      2: Object.freeze([Object.freeze({ img: 'ostacolo-albero', ombra: [13, 4.5] }), Object.freeze({ img: 'ostacolo-panchina', ombra: [15, 4.5] })]),
      3: Object.freeze([Object.freeze({ img: 'ostacolo-telaio', ombra: [16, 5] }), Object.freeze({ img: 'ostacolo-arcolaio', ombra: [13, 4.5] })]),
      4: Object.freeze([Object.freeze({ img: 'ostacolo-colonna', ombra: [14, 5] })]),
    }),
    braciere: Object.freeze({ img: 'ostacolo-braciere', ombra: [11, 4], luce: [-24, 14] }),
  }),
  spuntoni: Object.freeze({ meta: 0.12, fuori: 0.7 }),       // soglie di `alt` per i tre fotogrammi
  forziere: Object.freeze({ vuoto: Object.freeze([96, 110, 47, 17]), coloreVuoto: 'rgba(10, 6, 4, 0.86)', chiaro: 0.5 }), // interno dell'aperto: [cx, cy, rx, ry] nella cella 192×192
  donGennaro: Object.freeze({
    cartello: Object.freeze([28, 227, 72, 43]),             // il cartello sul banco (cella 240×288): si copre, sopra ci va il numero uscito
    coloreCartello: '#e8ddc2', bordoCartello: '#5a3c1e',
    numero: Object.freeze([-11.3, 10.2]),                   // dove si scrive l'ultimo numero uscito, dal punto del banco
    estraeTick: 80, ogniTick: 26,
  }),
  cartomante: Object.freeze({ ogniTick: 34 }),
  ciarlatano: Object.freeze({ ogniTick: 22, mescolaTick: 7 }),
  ceppo: Object.freeze({ faccia: Object.freeze([0, -9.5, 13, 4.2]) }),   // faccia superiore, dal punto del ceppo: [dx, dy, rx, ry]
  // clessidra.png (240×384): i due bulbi, in px d'origine (la sabbia si disegna lì dentro)
  clessidra: Object.freeze({
    vetro: Object.freeze([[73, 53], [167, 53], [167, 128], [124, 189], [124, 197], [167, 252], [167, 331], [73, 331], [73, 252], [116, 197], [116, 189], [73, 128]]),
    collo: 193, alto: 53, basso: 331, mezzo: 120,
  }),
  trasformazioni: Object.freeze({
    corona: Object.freeze({ larg: 16.6, su: 8.3 }),          // attorno alla fascia del cappuccio (ANCORE_B4.banda)
    mantello: Object.freeze({ x: 0, y: -15, alfa: 1 }),
    maschera: Object.freeze({ larg: 16 }),
    velo: Object.freeze({ x: -2, y: -20, alfa: 0.8 }),
  }),
  // ui-pad-simboli.png: colonna di ogni simbolo
  pad: Object.freeze({ 'Ⓐ': 0, 'Ⓑ': 1, 'Ⓧ': 2, 'Ⓨ': 3, LB: 4, RB: 5, LT: 6, RT: 7, START: 8, SELECT: 9, 'LEVETTA S': 10, 'LEVETTA D': 11, '✥': 12 }),
  padAltezza: 1.28,             // altezza del simbolo rispetto al corpo del testo
  cartiglio: Object.freeze({ cornice: Object.freeze([116, 32, 1230, 1003]), rotolo: 112, veloRotoli: 'rgba(24, 6, 4, 0.3)' }), // riquadro scuro e larghezza di un rotolo, px d'origine
  tasto: Object.freeze({ capo: 62, bordo: Object.freeze([8, 8, 377, 89]) }), // estremi decorati (larghezza) e riquadro pieno del tasto, px d'origine
  cursore: Object.freeze({ altOpzioni: 15, altPausa: 21, spintaPausa: 3, dondolio: 0.8 }),
  // sprite del segno (SEGNI_A6) → colonna del foglio segni-boss.png dell'autore (dieci medaglioni dal 2026-11-12)
  segni: Object.freeze({ segnoLumeB6: 0, segnoCignoB6: 1, segnoGiostraB6: 2, segnoSpolaB6: 3, gatto: 4, chiave: 5, ago: 6, campana: 7, forbici: 8, cuoio: 9 }),
  /** Medaglione a codice per i segni che non hanno ancora il loro nel foglio (stesso disco scuro con l'anello d'oro). */
  medaglione: Object.freeze({ fondo: '#0a0604', anello: '#c9992e', spessore: 0.55, margine: 1.1, icona: 0.55 }),
});

// ===========================================================================
// CARICATORE UNICO
// ===========================================================================
const statoB9 = {
  voci: new Map(),          // nome → { img, pronta, errore, mip: [] }
  forzate: new Map(),       // QA e foto prima/dopo: nome → true/false (vince sulla tabella)
  senzaRisorse: false,      // QA: il caricatore risponde sempre null (si provano i ripieghi)
  disegni: {},              // nome → quante volte è finita su una tela
  fotogrammi: new Map(),
  scalaFotogrammi: 0,
  ortaggiFinoA: -1,
  dockPlatea: -1,
  bancoVisto: new WeakMap(),
  pelli: new WeakMap(),
  errori: 0,
};

/**
 * L'immagine di scena `nome` (senza estensione), pronta da disegnare, oppure null se non esiste, non è ancora
 * caricata o il caricamento è fallito. La prima chiamata avvia il caricamento; le successive leggono la cache.
 * In release l'immagine arriva da window.__risorseTeatro, altrimenti dal percorso relativo.
 * @param {string} nome
 * @returns {HTMLImageElement|null}
 */
function immagineScena(nome) {
  if (statoB9.senzaRisorse) return null;
  let v = statoB9.voci.get(nome);
  if (!v) {
    v = { img: new Image(), pronta: false, errore: false, mip: [] };
    statoB9.voci.set(nome, v);
    const percorso = `${CONFIG_B9.cartella}${nome}.png`;
    v.img.onload = () => { v.pronta = v.img.naturalWidth > 0; invalidaImmaginiB9(); };
    v.img.onerror = () => { v.errore = true; console.warn('[b9] immagine di scena non caricata, resta il disegno a codice:', percorso); };
    v.img.src = (window.__risorseTeatro && window.__risorseTeatro[percorso]) || percorso;
  }
  return v.pronta ? v.img : null;
}

/** L'immagine `nome` è da usare adesso? (tabella, salvo forzature della QA) */
function usaImmagineB9(nome) {
  if (statoB9.senzaRisorse) return false;
  const f = statoB9.forzate.get(nome);
  if (f !== undefined) return f;
  const voce = IMMAGINI_B9[nome];
  return Boolean(voce && voce.usa);
}

/** Immagine pronta E da usare, oppure null: è la domanda che fanno tutti i disegni di questo file. */
function scenaB9(nome) {
  return usaImmagineB9(nome) ? immagineScena(nome) : null;
}

/** Butta ciò che è stato composto con le immagini (tele di questo file, di b1 e tavole di b4): si rifà al prossimo frame. */
function invalidaImmaginiB9() {
  statoB9.fotogrammi.clear();
  statoB9.pelli = new WeakMap();
  try { if (typeof invalidaTeleB1 === 'function') invalidaTeleB1(); } catch (_) { /* b1 non c'è */ }
  try { if (typeof tavoleB4 !== 'undefined') tavoleB4.clear(); } catch (_) { /* b4 non c'è */ }
}

function contaB9(nome) { statoB9.disegni[nome] = (statoB9.disegni[nome] || 0) + 1; }

/** Copia dell'immagine dimezzata `livello` volte (cache): le riduzioni forti non fanno scalette. */
function mipB9(v, livello) {
  if (livello <= 0) return v.img;
  let c = v.mip[livello];
  if (!c) {
    const sopra = mipB9(v, livello - 1);
    const l = sopra.naturalWidth || sopra.width, a = sopra.naturalHeight || sopra.height;
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(l / 2)); c.height = Math.max(1, Math.ceil(a / 2));
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(sopra, 0, 0, c.width, c.height);
    v.mip[livello] = c;
  }
  return c;
}

/**
 * Disegna su `g` il ritaglio (sx, sy, sw, sh) dell'immagine `nome` nel riquadro (dx, dy, dw, dh), partendo
 * dalla copia dimezzata più vicina alla misura finale. Serve a comporre tele in cache, non a ogni frame.
 * @returns {boolean} false se l'immagine non è pronta o non è da usare
 */
function disegnaRitaglioB9(g, nome, sx, sy, sw, sh, dx, dy, dw, dh) {
  const img = scenaB9(nome);
  if (!img) return false;
  const v = statoB9.voci.get(nome);
  const m = g.getTransform();
  const rid = Math.max((Math.abs(dw) * Math.hypot(m.a, m.b)) / sw, (Math.abs(dh) * Math.hypot(m.c, m.d)) / sh);
  let liv = 0;
  while (liv < CONFIG_B9.mipMax && rid * (2 << liv) <= 1) liv++;
  const c = mipB9(v, liv);
  const fx = (c.naturalWidth || c.width) / img.naturalWidth, fy = (c.naturalHeight || c.height) / img.naturalHeight;
  const liscio = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(c, sx * fx, sy * fy, sw * fx, sh * fy, dx, dy, dw, dh);
  g.imageSmoothingEnabled = liscio;
  contaB9(nome);
  return true;
}

/**
 * Una cella del foglio `nome` già ridotta alla scala del buffer (tela fuori schermo, in cache): a ogni frame
 * si copia così com'è. `alt` = altezza a schermo in px logici (0 = quella della tabella). `o` (facoltativo):
 *   ritocco(g, l, a, k)  piccola correzione dipinta una volta sulla tela (k = px di tela per px d'origine);
 *   chiave               nome del ritocco (entra nella chiave della cache);
 *   filo                 true = filo di luce calda attorno alla sagoma (CONFIG_B9.filo): le figure scure
 *                        restano leggibili sui pavimenti scuri, come le sagome «a ombre» del resto del gioco;
 *   chiaro               0..1 = quanto schiarire l'immagine (si somma a sé stessa): per i legni troppo scuri.
 * @returns {HTMLCanvasElement|null} null se l'immagine non è pronta o non è da usare
 */
function fotogrammaB9(nome, riga = 0, col = 0, alt = 0, o = null) {
  const img = scenaB9(nome);
  if (!img) return null;
  if (statoB9.scalaFotogrammi !== scalaBase) { statoB9.fotogrammi.clear(); statoB9.scalaFotogrammi = scalaBase; }
  const voce = IMMAGINI_B9[nome];
  const a = alt || voce.alt;
  const chiave = `${nome}|${riga}|${col}|${a}|${o ? `${o.chiave || ''}${o.filo ? 'f' : ''}${o.chiaro || ''}` : ''}`;
  let c = statoB9.fotogrammi.get(chiave);
  if (!c) {
    if (statoB9.fotogrammi.size > CONFIG_B9.fotogrammiMax) statoB9.fotogrammi.clear();
    const cl = img.naturalWidth / voce.celle[1], ca = img.naturalHeight / voce.celle[0];
    c = document.createElement('canvas');
    c.height = Math.max(1, Math.round(a * scalaBase));
    c.width = Math.max(1, Math.round((c.height * cl) / ca));
    const g = c.getContext('2d');
    if (o && o.filo) g.filter = `drop-shadow(0 0 ${(CONFIG_B9.filo.px * scalaBase).toFixed(2)}px ${CONFIG_B9.filo.colore})`;
    disegnaRitaglioB9(g, nome, col * cl, riga * ca, cl, ca, 0, 0, c.width, c.height);
    g.filter = 'none';
    if (o && o.chiaro) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = o.chiaro; g.drawImage(c, 0, 0); g.restore(); }
    if (o && o.ritocco) { g.save(); o.ritocco(g, c.width, c.height, c.height / ca); g.restore(); }
    statoB9.fotogrammi.set(chiave, c);
  }
  return c;
}

/**
 * Copia sul canvas del gioco una cella di `nome` con l'àncora della tabella sul punto (x, y), allineata ai
 * pixel del buffer. `o`: { alt, ancora, specchio, alfa } più le opzioni di fotogrammaB9 (ritocco, chiave, filo).
 * @returns {boolean} false se l'immagine non c'è (il chiamante disegna il ripiego a codice)
 */
function timbraB9(nome, riga, col, x, y, o) {
  const c = fotogrammaB9(nome, riga, col, o && o.alt, o);
  if (!c) return false;
  const s = scalaBase, l = c.width / s, a = c.height / s;
  const an = (o && o.ancora) || IMMAGINI_B9[nome].ancora;
  const alfa = o && o.alfa !== undefined ? o.alfa : 1;
  if (alfa <= 0) return true;
  const alfa0 = ctx.globalAlpha;
  if (alfa < 1) ctx.globalAlpha = alfa0 * alfa;
  if (o && o.specchio) {
    ctx.save();
    ctx.translate(Math.round(x * s) / s, 0); ctx.scale(-1, 1);
    ctx.drawImage(c, -l * an[0], Math.round((y - a * an[1]) * s) / s, l, a);
    ctx.restore();
  } else {
    ctx.drawImage(c, Math.round((x - l * an[0]) * s) / s, Math.round((y - a * an[1]) * s) / s, l, a);
  }
  ctx.globalAlpha = alfa0;
  contaB9(nome);
  return true;
}

const OPZ_FILO_B9 = Object.freeze({ filo: true });

/** Un errore di disegno di questo file non ferma il gioco: si segnala una volta e si torna al disegno a codice. */
function guastoB9(dove, err) {
  if (statoB9.errori++ < 6) console.error(`[b9] ${dove}`, err);
}

// ===========================================================================
// A. IL TEATRO ATTORNO AL PALCO (b1-pubblico.js: voci di ELEMENTI_B1)
// ===========================================================================
/** Avvolge una voce di ELEMENTI_B1: `con(base, ...args)` torna true se ha disegnato, altrimenti si chiama la base. */
function avvolgiElementoB1(voce, con) {
  if (typeof ELEMENTI_B1 === 'undefined' || typeof ELEMENTI_B1[voce] !== 'function') return;
  const base = ELEMENTI_B1[voce];
  ELEMENTI_B1[voce] = function elementoB9(...a) {
    try { if (con(base, ...a)) return undefined; } catch (err) { guastoB9(`b1 ${voce}`, err); }
    return base.apply(this, a);
  };
}

/** Palchi di proscenio, strato DIETRO agli spettatori: parete di b1, poi festone, drappi e interno del palchetto. */
avvolgiElementoB1('palcoLatoFondo', (base, x, w, h) => {
  if (!scenaB9('palchetto')) return false;
  const L = PUBBLICO_B1.posti.lati, P = CONFIG_B9.palchetto, K = P.lati;
  base(x, w, h);
  for (let i = 0; i < L.numero; i++) {
    const y0 = L.cornice + i * L.altPalco;
    disegnaRitaglioB9(x, 'palchetto', K.daX, P.vano[0], w / K.scala, P.vano[1] - P.vano[0], 0, y0 + K.festoneSu, w, (P.vano[1] - P.vano[0]) * K.scala);
  }
  return true;
});

/** Palchi di proscenio, strato DAVANTI: festone, parapetto dorato, pilastro verso il palco, candele. */
avvolgiElementoB1('palcoLatoFronte', (base, x, w, h) => {
  if (!scenaB9('palchetto')) return false;
  const L = PUBBLICO_B1.posti.lati, P = CONFIG_B9.palchetto, K = P.lati, C = COLORI_B1;
  const sl = w / K.scala;
  // cornice in cima alla colonna
  disegnaRitaglioB9(x, 'palchetto', K.daX, P.cielo[0], sl, P.cielo[1] - P.cielo[0], 0, L.cornice + K.festoneSu - (P.cielo[1] - P.cielo[0]) * K.scala, w, (P.cielo[1] - P.cielo[0]) * K.scala);
  for (let i = 0; i < L.numero; i++) {
    const y0 = L.cornice + i * L.altPalco;
    disegnaRitaglioB9(x, 'palchetto', K.daX, P.festone[0], sl, P.festone[1] - P.festone[0], 0, y0 + K.festoneSu, w, (P.festone[1] - P.festone[0]) * K.scala);
  }
  // pilastro verso il palco (chiude il taglio dell'immagine) col filetto d'oro
  const g = x.createLinearGradient(w - K.pilastro, 0, w, 0);
  g.addColorStop(0, C.legnoScuro); g.addColorStop(0.55, C.legnoLuce); g.addColorStop(1, C.legnoScuro);
  x.fillStyle = g; x.fillRect(w - K.pilastro, 0, K.pilastro, h);
  x.fillStyle = C.oroScuro; x.fillRect(w - 1, 0, 1, h); x.fillRect(w - K.pilastro, 0, 0.6, h);
  for (let i = 0; i < L.numero; i++) {
    const y0 = L.cornice + i * L.altPalco;
    const py = y0 + L.davanzale - (240 - P.parapetto[0]) * K.scala;
    disegnaRitaglioB9(x, 'palchetto', K.daX, P.parapetto[0], sl, P.parapetto[1] - P.parapetto[0], 0, py, w, (P.parapetto[1] - P.parapetto[0]) * K.scala);
    candelaB1(x, 45.6, y0 + 33);
  }
  return true;
});

/** Balconata in alto, strato DAVANTI: cornice, festoni, colonnine e parapetti presi dal palchetto dell'autore. */
avvolgiElementoB1('balconataFronte', (base, x) => {
  if (!scenaB9('palchetto')) return false;
  const A = PUBBLICO_B1.posti.alto, P = CONFIG_B9.palchetto, K = P.alto;
  for (let k = -7; k <= 7; k++) {
    const cx = A.centro + k * A.passo, x0 = cx - 21;
    if (A.chiusi.includes(k)) { // dietro le Mani il palco resta chiuso dal telo di b1
      x.save();
      x.beginPath(); x.rect(x0, K.festoneY, 42, 44 - K.festoneY); x.clip();
      pieghetteB1(x, x0, 0, 42, 44, k, 3.2);
      x.fillStyle = 'rgba(0, 0, 0, 0.35)'; x.fillRect(x0, 0, 42, 44);
      x.restore();
    }
    disegnaRitaglioB9(x, 'palchetto', P.cieloX[0], P.cielo[0], P.cieloX[1] - P.cieloX[0], P.cielo[1] - P.cielo[0], cx - A.passo / 2, K.cieloY, A.passo, K.cieloA);
    disegnaRitaglioB9(x, 'palchetto', P.vanoX[0], P.festone[0] - 2, P.vanoX[1] - P.vanoX[0], 82, x0, K.festoneY, 42, K.festoneA);
  }
  for (let k = -8; k <= 7; k++) {
    const px = A.centro + k * A.passo + 25, Cn = P.colonna;
    disegnaRitaglioB9(x, 'palchetto', Cn[0], Cn[2], Cn[1] - Cn[0], Cn[3] - Cn[2], px - 4, K.colonnaY, 8, K.colonnaA);
    candelaB1(x, px, 28);
  }
  for (let k = -7; k <= 7; k++) {
    const cx = A.centro + k * A.passo;
    disegnaRitaglioB9(x, 'palchetto', P.parapettoX[0], P.parapetto[0], P.parapettoX[1] - P.parapettoX[0], P.parapetto[1] - P.parapetto[0], cx - A.passo / 2, K.parapettoY, A.passo, K.parapettoA);
  }
  const om = x.createLinearGradient(0, 52, 0, 58);
  om.addColorStop(0, 'rgba(0, 0, 0, 0.5)'); om.addColorStop(1, 'rgba(0, 0, 0, 0)');
  x.fillStyle = om; x.fillRect(0, 52.5, W, 5.5);
  return true;
});

/** Platea: dietro le sagome animate di b1, la fila di teste dell'autore (ferma, nel buio), mai sotto il dock dell'HUD. */
avvolgiElementoB1('buioPlatea', (base, x, w, h) => {
  const img = scenaB9('platea');
  if (!img) return false;
  const K = CONFIG_B9.platea, R = K.righe;
  const da = Math.min(w, (typeof bordoDockB1 === 'function' ? bordoDockB1() : PUBBLICO_B1.dock.bordoMin) + K.margineDock);
  statoB9.dockPlatea = da;
  base(x, w, h);
  if (da >= w) return true;
  x.save();
  x.beginPath(); x.rect(da, 0, w - da, h); x.clip();
  x.globalAlpha = K.alfa;
  x.filter = `drop-shadow(0 ${(-K.filo * scalaBase).toFixed(2)}px 0 ${K.coloreFilo})`; // filo di luce sulle teste: sagome nere nel buio non si vedrebbero
  disegnaRitaglioB9(x, 'platea', 0, R[0], img.naturalWidth, R[1] - R[0], 0, 0, w, h);
  x.restore();
  return true;
});

avvolgiElementoB1('teloSipario', (base, x, w, h) => {
  const img = scenaB9('sipario-telo');
  return Boolean(img) && disegnaRitaglioB9(x, 'sipario-telo', 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, w, h);
});

avvolgiElementoB1('mantovana', (base, x, w, h) => {
  const img = scenaB9('sipario-mantovana'), R = CONFIG_B9.mantovana.righe;
  return Boolean(img) && disegnaRitaglioB9(x, 'sipario-mantovana', 0, R[0], img.naturalWidth, R[1] - R[0], 0, 0, w, h);
});

/** Riga del foglio spettatori.png per ogni tipo di sagoma di b1 (solo per la prova: l'immagine è scartata). */
const RIGHE_SPETTATORI_B9 = Object.freeze({ cilindro: 0, ventaglio: 1, piuma: 1, ufficiale: 2, bambino: 3, binocolo: 4, popolana: 5 });
avvolgiElementoB1('spettatore', (base, x, tipo) => {
  const img = scenaB9('spettatori'), riga = RIGHE_SPETTATORI_B9[tipo];
  if (!img || riga === undefined) return false;
  const cl = img.naturalWidth / 4, ca = img.naturalHeight / 6;
  return disegnaRitaglioB9(x, 'spettatori', 0, riga * ca, cl, ca, -20, -41, 40, 40 * (ca / cl));
});

/** Ciò che il pubblico lancia: rosa o mazzolino agli applausi, pomodoro dopo i fischi. */
avvolgiElementoB1('fiore', (base, x, y, ang, alfa, chiaro) => {
  const nome = chiaro === 'ortaggio' ? 'lancio-ortaggio' : chiaro ? 'lancio-mazzo' : 'lancio-fiore';
  const c = fotogrammaB9(nome);
  if (!c) return chiaro === 'ortaggio'; // un pomodoro senza immagine non si disegna come un fiore
  const s = scalaBase, l = c.width / s, a = c.height / s, an = IMMAGINI_B9[nome].ancora;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(chiaro === 'ortaggio' ? ang * 0.25 : ang - 0.9);
  ctx.globalAlpha *= alfa;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(c, -l * an[0], -a * an[1], l, a);
  ctx.restore();
  contaB9(nome);
  return true;
});

/**
 * Pomodori dopo i fischi: solo scena, come i fiori di b1 (stesso generatore separato, mai rng()), e come i
 * fiori mai con nemici vivi in stanza: se si fischia in piena lotta arrivano appena la stanza è ripulita.
 */
function lanciaOrtaggiB9() {
  if (typeof pubblicoB1 === 'undefined' || typeof lanciaFioriB1 !== 'function' || !OPZIONI.pubblico) return false;
  if (!fotogrammaB9('lancio-ortaggio')) return false;
  const lista = pubblicoB1.fiori, n0 = lista.length;
  lanciaFioriB1(CONFIG_B9.ortaggi.quanti);
  for (let i = n0; i < lista.length; i++) lista[i].chiaro = 'ortaggio';
  return lista.length > n0;
}

if (typeof reazionePubblicoB1 === 'function') {
  const reazionePubblicoBaseB9 = reazionePubblicoB1;
  reazionePubblicoB1 = function reazionePubblicoB9(nome) {
    const r = reazionePubblicoBaseB9.apply(this, arguments);
    try {
      if (r && nome === 'fischi' && !lanciaOrtaggiB9()) statoB9.ortaggiFinoA = tick + CONFIG_B9.ortaggi.attesaTick;
    } catch (err) { guastoB9('ortaggi', err); }
    return r;
  };
}

/** A ogni frame della stanza: i pomodori rimasti in sospeso partono appena non ci sono più nemici. */
function dopoStanzaB9(st) {
  if (statoB9.dockPlatea >= 0 && typeof bordoDockB1 === 'function' && scenaB9('platea')) {
    const da = Math.min(W, bordoDockB1() + CONFIG_B9.platea.margineDock);
    if (Math.abs(da - statoB9.dockPlatea) > 0.5) { statoB9.dockPlatea = da; invalidaTeleB1(); } // il dock dell'HUD è cresciuto o calato
  }
  if (statoB9.ortaggiFinoA < 0) return;
  if (tick > statoB9.ortaggiFinoA || statoRun.fase !== 'in_gioco') { statoB9.ortaggiFinoA = -1; return; }
  if (!st || st !== statoRun.stanzaCorrente || (st.nemici || []).some((n) => n.hp > 0)) return;
  statoB9.ortaggiFinoA = -1;
  lanciaOrtaggiB9();
}

if (typeof disegnaStanzaPixelArt === 'function') {
  const disegnaStanzaPixelArtBaseB9 = disegnaStanzaPixelArt;
  disegnaStanzaPixelArt = function disegnaStanzaPixelArtB9(...a) {
    const r = disegnaStanzaPixelArtBaseB9.apply(this, a);
    try { dopoStanzaB9(a[1]); } catch (err) { guastoB9('stanza', err); }
    return r;
  };
}

// ===========================================================================
// A. LA RIBALTA (agganci in b2-ribalta.js)
// ===========================================================================
let bagliorB9 = null;
function telaBagliorB9() {
  if (!bagliorB9) {
    const r = 32;
    bagliorB9 = document.createElement('canvas');
    bagliorB9.width = bagliorB9.height = r * 2;
    const g = bagliorB9.getContext('2d');
    const gr = g.createRadialGradient(r, r, 1, r, r, r);
    gr.addColorStop(0, 'rgba(255, 214, 130, 0.9)'); gr.addColorStop(0.4, 'rgba(249, 160, 60, 0.3)'); gr.addColorStop(1, 'rgba(249, 160, 60, 0)');
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
  }
  return bagliorB9;
}

/** Alone caldo sommato alla scena, centrato in (x, y). */
function aloneCaldoB9(x, y, raggio, alfa) {
  const alfa0 = ctx.globalAlpha, comp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alfa0 * alfa;
  ctx.drawImage(telaBagliorB9(), x - raggio, y - raggio, raggio * 2, raggio * 2);
  ctx.globalAlpha = alfa0;
  ctx.globalCompositeOperation = comp;
}

/**
 * AGGANCIO di b2 (disegnaLumi): UN lume della ribalta in (x, y), `f` = intensità 0,35..1, `i` = indice,
 * `tk` = tick. L'immagine ha già la fiamma (4 fotogrammi): qui si aggiunge solo il bagliore.
 * @returns {boolean} true se l'ha disegnato (b2 salta fiamma e conchiglia a codice)
 */
function disegnaLumeB9(x, y, f, i, tk) {
  try {
    const K = CONFIG_B9.lume;
    if (!fotogrammaB9('lume-ribalta')) return false;
    aloneCaldoB9(x, y - 6, K.bagliore, K.alfaBagliore * f);
    return timbraB9('lume-ribalta', 0, (Math.floor(tk / K.ogniTick) + i * 3) % 4, x, y + 5);
  } catch (err) { guastoB9('lume', err); return false; }
}

/**
 * AGGANCIO di b2 (disegnaCavo): UN cavo di scena fino a (x, yBasso). Le quinte dell'autore hanno un anello di
 * ferro in cima: lì arriva un solo cavo, dritto sull'anello (true: b2 non disegna i suoi due). Sugli altri
 * pezzi resta il tratto di b2 (false) e in fondo ci va il gancio dell'autore.
 */
function disegnaCavoB9(x, yBasso, lato, lasco, fase) {
  try {
    const st = statoRun.stanzaCorrente, A = typeof RIBALTA_B2 !== 'undefined' ? RIBALTA_B2.scenografia.aggancio : null;
    if (st && A) {
      let o = null, g = null, dist = 3;
      for (const q of st.ostacoli) {
        const gq = A[q.tipo] || A.predefinito;
        if (Math.abs(q.x + lato * gq[0] - x) > 0.01) continue;
        const d = Math.abs(yBasso + gq[1] - q.y);
        if (d < dist) { dist = d; o = q; g = gq; }
      }
      const p = o ? pelleOstacoloB9(o) : null;
      if (p && scenaB9(p.img)) {
        if (lato > 0) return true;
        const voce = IMMAGINI_B9[p.img];
        const ya = yBasso + g[1] - voce.alt * voce.ancora[1] + voce.alt * CONFIG_B9.cavo.anello;
        if (ya < -4) return true;
        ctx.beginPath(); ctx.moveTo(o.x, -6);
        if (lasco > 0.05) ctx.quadraticCurveTo(o.x + lasco * 1.4 + Math.sin(fase) * lasco * 0.4, ya * 0.55, o.x, ya);
        else ctx.lineTo(o.x, ya);
        ctx.stroke();
        return true;
      }
    }
    if (yBasso > 6 && fotogrammaB9('cavo-gancio')) {
      const alfa0 = ctx.globalAlpha;
      ctx.globalAlpha = CONFIG_B9.cavo.alfa; // i cavi di b2 sono un velo: il gancio di ferro si deve vedere
      timbraB9('cavo-gancio', 0, 0, x, yBasso + 1.5);
      ctx.globalAlpha = alfa0;
    }
  } catch (err) { guastoB9('cavo', err); }
  return false;
}

// ===========================================================================
// B. SCENOGRAFIA APPESA AI CAVI: OSTACOLI (aggancio nel ciclo degli ostacoli di 60-resa.js)
// ===========================================================================
const tinteB9 = new Map();
/** Opzioni di fotogrammaB9 per una quinta tinta (velo di colore sulla sola sagoma) col filo di luce. */
function opzioniTintaB9(colore) {
  let o = tinteB9.get(colore);
  if (!o) {
    o = Object.freeze({ filo: true, chiave: `tinta${colore}`, ritocco(g, l, a) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = colore; g.fillRect(0, 0, l, a); } });
    tinteB9.set(colore, o);
  }
  return o;
}

/** La pelle di un ostacolo (voce di CONFIG_B9.ostacoli) oppure null se resta a codice. */
function pelleOstacoloB9(o) {
  const T = CONFIG_B9.ostacoli;
  if (o.variante) {
    const p = T.varianti[o.variante];
    return p && (!p.soloAcceso || o.acceso) ? p : null;
  }
  if (o.tipo === 'braciere') return T.braciere;
  if (o.tipo !== 'colonna') return null;
  let p = statoB9.pelli.get(o);
  if (p === undefined) {
    const lista = (T.colonne[((Math.max(1, statoRun.piano || 1) - 1) % 4) + 1] || []).filter((q) => usaImmagineB9(q.img));
    p = lista.length ? lista[Math.abs(Math.round(o.x * 0.37)) % lista.length] : null;
    statoB9.pelli.set(o, p);
  }
  return p;
}

/**
 * AGGANCIO di 60-resa.js: disegna un ostacolo con l'immagine dell'autore. Le collisioni non cambiano:
 * l'immagine ha i piedi sul centro della collisione, come i disegni a codice.
 * @returns {boolean} true se l'ha disegnato; false = lo disegna il codice di prima (base o b7)
 */
function disegnaOstacoloB9(o, t) {
  try {
    const p = pelleOstacoloB9(o);
    if (!p) return false;
    const col = o.tipo === 'braciere' && !o.variante && o.acceso ? 1 : 0;
    const opz = p.tinta ? opzioniTintaB9(p.tinta) : OPZ_FILO_B9;
    if (!fotogrammaB9(p.img, 0, col, 0, opz)) return false;
    const dx = o.scossoB7 > 0 ? (o.scossoB7 % 2 ? 1 : -1) : 0;
    ctx.fillStyle = CONFIG_B9.ombra;
    ctx.beginPath(); ctx.ellipse(o.x, o.y + 4, p.ombra[0], p.ombra[1], 0, 0, TAU); ctx.fill();
    timbraB9(p.img, 0, col, o.x + dx, o.y, opz);
    if (p.luce && (o.tipo !== 'braciere' || o.acceso)) {
      aloneCaldoB9(o.x, o.y + p.luce[0], p.luce[1], 0.5 + 0.12 * Math.sin(t * 0.21 + o.x));
    }
    if (p.miccia && o.micciaB7 > 0) { // la miccia accesa è un avviso di gioco: resta ben visibile
      ctx.fillStyle = t % 4 < 2 ? '#fef08a' : '#ef4444';
      ctx.beginPath(); ctx.arc(o.x + p.miccia[0], o.y + p.miccia[1], 2.4, 0, TAU); ctx.fill();
    }
    return true;
  } catch (err) { guastoB9('ostacolo', err); return false; }
}

/** AGGANCIO di b7 (disegnaSuoloB7): i chiodi del palco, tre fotogrammi secondo quanto sono fuori. */
function spuntoniImmagineB9(o, t) {
  try {
    if (!fotogrammaB9('trappola-chiodi') || typeof statoSpuntoniB7 !== 'function') return false;
    const s = statoSpuntoniB7(o, t), K = CONFIG_B9.spuntoni;
    const col = s.alt >= K.fuori ? 2 : s.alt > K.meta ? 1 : 0;
    const tr = s.fase === 'avviso' ? Math.sin(t * 1.3 + o.x) * 0.6 : 0;
    return timbraB9('trappola-chiodi', 0, col, o.x + tr, o.y);
  } catch (err) { guastoB9('chiodi', err); return false; }
}

/** AGGANCIO di b7 (disegnaSacchiB7): il sacco di sabbia appeso o in caduta, col suo cavo. */
function saccoImmagineB9(o, sx, sy) {
  try {
    if (!scenaB9('ostacolo-sacco')) return false;
    if (o.stato === 'appeso') {
      ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx, sy - 13); ctx.lineTo(o.x, ARENA.y1 - 22); ctx.stroke();
    }
    return timbraB9('ostacolo-sacco', 0, 0, sx, sy, OPZ_FILO_B9);
  } catch (err) { guastoB9('sacco', err); return false; }
}

// ===========================================================================
// C. FORZIERI E LUCCHETTO (a1-bombe-chiavi.js)
// ===========================================================================
/** Ritocco del forziere aperto: nel gioco, aperto vuol dire vuoto (il bottino è già a terra). */
function ritoccoForziereApertoB9(g, l, a, k) {
  const V = CONFIG_B9.forziere.vuoto;
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = CONFIG_B9.forziere.coloreVuoto;
  g.beginPath(); g.ellipse(V[0] * k, V[1] * k, V[2] * k, V[3] * k, 0, 0, TAU); g.fill();
}

const OPZ_FORZIERE_B9 = Object.freeze({ filo: true, chiaro: CONFIG_B9.forziere.chiaro });
const OPZ_FORZIERE_APERTO_B9 = Object.freeze({ ritocco: ritoccoForziereApertoB9, chiave: 'vuoto', filo: true, chiaro: CONFIG_B9.forziere.chiaro });

if (typeof disegnaForziereA1 === 'function') {
  const disegnaForziereBaseB9 = disegnaForziereA1;
  disegnaForziereA1 = function disegnaForziereB9(f) {
    try {
      if (!(f.aperto && f.oggetto) && scenaB9('forzieri')) {
        const x = Math.round(f.x), y = Math.round(f.y);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath(); ctx.ellipse(x, y + 7, 14, 4, 0, 0, TAU); ctx.fill();
        if (timbraB9('forzieri', f.tipo === 'chiuso' ? 1 : 0, f.aperto ? 1 : 0, x, y, f.aperto ? OPZ_FORZIERE_APERTO_B9 : OPZ_FORZIERE_B9)) return undefined;
      }
    } catch (err) { guastoB9('forziere', err); }
    return disegnaForziereBaseB9.apply(this, arguments);
  };
}

if (typeof disegnaLucchettoA1 === 'function') {
  const disegnaLucchettoBaseB9 = disegnaLucchettoA1;
  disegnaLucchettoA1 = function disegnaLucchettoB9(x, y, t) {
    try {
      if (fotogrammaB9('lucchetto-porta')) {
        ctx.save();
        ctx.lineCap = 'round';
        for (let passata = 0; passata < 2; passata++) { // catene incrociate sulla porta (come a1, col bordo scuro)
          ctx.strokeStyle = passata ? '#8b98ab' : '#0a0604'; ctx.lineWidth = passata ? 1.6 : 3;
          ctx.beginPath();
          ctx.moveTo(x - 12, y - 7); ctx.lineTo(x + 12, y + 7);
          ctx.moveTo(x + 12, y - 7); ctx.lineTo(x - 12, y + 7);
          ctx.stroke();
        }
        ctx.restore();
        if (timbraB9('lucchetto-porta', 0, 0, x, y + Math.round(Math.sin(t * 0.08) * 0.8))) return undefined;
      }
    } catch (err) { guastoB9('lucchetto', err); }
    return disegnaLucchettoBaseB9.apply(this, arguments);
  };
}

// ===========================================================================
// C. STANZE SPECIALI (agganci in a3-stanze-speciali.js; clessidra e ciarlatano di b7 avvolti)
// ===========================================================================
/** Ritocco del foglio di Don Gennaro: il cartello sul banco diventa bianco (sopra ci va il numero uscito). */
function ritoccoCartelloB9(g, l, a, k) {
  const D = CONFIG_B9.donGennaro, R = D.cartello;
  g.fillStyle = D.coloreCartello; g.fillRect(R[0] * k, R[1] * k, R[2] * k, R[3] * k);
  g.strokeStyle = D.bordoCartello; g.lineWidth = Math.max(1, k * 2);
  g.strokeRect(R[0] * k, R[1] * k, R[2] * k, R[3] * k);
}

const OPZ_DON_GENNARO_B9 = Object.freeze({ ritocco: ritoccoCartelloB9, chiave: 'cartello', filo: true });

/**
 * AGGANCIO di a3 (disegnaArrediA3): un arredo delle stanze speciali con l'immagine dell'autore.
 * `nome`: 'ceppo' (dati = st.sacrificioA3), 'banco' (dati = st.biscaA3), 'cartomante' (dati = posto).
 * Le etichette restano quelle di a3. @returns {boolean} true se l'ha disegnato
 */
function arredoImmagineB9(nome, x, y, dati, t) {
  try {
    if (nome === 'ceppo') {
      if (!scenaB9('ceppo-chiodi')) return false;
      ctx.fillStyle = 'rgba(8,5,3,0.6)';
      ctx.beginPath(); ctx.ellipse(x, y + 10, 24, 7, 0, 0, TAU); ctx.fill();
      timbraB9('ceppo-chiodi', 0, 0, x, y, OPZ_FILO_B9);
      const F = CONFIG_B9.ceppo.faccia;
      ctx.fillStyle = '#7f1d1d'; // macchie di sangue, una per sacrificio (come a3)
      for (let i = 0; i < ((dati && dati.fatti) || 0); i++) {
        ctx.beginPath(); ctx.arc(x + F[0] - F[2] * 0.75 + ((i * 37) % 24) * (F[2] / 16), y + F[1] + ((i * 13) % 6) - 3, 2.2, 0, TAU); ctx.fill();
      }
      return true;
    }
    if (nome === 'banco') {
      const D = CONFIG_B9.donGennaro;
      if (scenaB9('npc-don-gennaro')) {
        let visto = statoB9.bancoVisto.get(dati);
        if (!visto) { visto = { ultimo: dati.ultimo, da: -1e9 }; statoB9.bancoVisto.set(dati, visto); }
        if (visto.ultimo !== dati.ultimo) { visto.ultimo = dati.ultimo; visto.da = t; }
        const eta = t - visto.da, estrae = eta >= 0 && eta < D.estraeTick;
        const col = estrae ? Math.min(3, Math.floor((eta / D.estraeTick) * 4)) : (dati.chiuso ? 0 : Math.floor(t / D.ogniTick) % 4);
        ctx.fillStyle = 'rgba(8,5,3,0.6)';
        ctx.beginPath(); ctx.ellipse(x, y + 14, 26, 7, 0, 0, TAU); ctx.fill();
        timbraB9('npc-don-gennaro', estrae ? 1 : 0, col, x, y, OPZ_DON_GENNARO_B9);
        if (dati.ultimo) drawTextFit(String(dati.ultimo.numero), x + D.numero[0], y + D.numero[1], 16, { size: 8, color: '#5c1a0c', shadow: false });
        return true;
      }
      if (fotogrammaB9('banco-lotto')) {
        ctx.fillStyle = 'rgba(8,5,3,0.6)';
        ctx.beginPath(); ctx.ellipse(x, y + 14, 26, 7, 0, 0, TAU); ctx.fill();
        timbraB9('banco-lotto', 0, 0, x, y);
        if (dati.ultimo) drawTextFit(String(dati.ultimo.numero), x - 14, y + 6, 20, { size: 8, color: '#fde68a' });
        return true;
      }
      return false;
    }
    if (nome === 'cartomante') {
      if (!scenaB9('npc-cartomante')) return false;
      ctx.fillStyle = 'rgba(8,5,3,0.6)';
      ctx.beginPath(); ctx.ellipse(x, y + 14, 17, 5, 0, 0, TAU); ctx.fill();
      aloneCaldoB9(x, y - 8, 22, 0.28 + 0.05 * Math.sin(t * 0.3));
      return timbraB9('npc-cartomante', 0, Math.floor(t / CONFIG_B9.cartomante.ogniTick) % 4, x, y, OPZ_FILO_B9);
    }
  } catch (err) { guastoB9(`arredo ${nome}`, err); }
  return false;
}

if (typeof disegnaClessidraB7 === 'function') {
  const disegnaClessidraBaseB9 = disegnaClessidraB7;
  /** La Clessidra della Ribalta col telaio dell'autore; la sabbia (tempo vero) resta disegnata dal codice. */
  disegnaClessidraB7 = function disegnaClessidraB9(st, t) {
    try {
      const K = st && st.clessidraB7, S = st && st.sfidaA3;
      const c = K && S ? fotogrammaB9('clessidra') : null;
      if (c) {
        const C = CLESSIDRA_B7, G = CONFIG_B9.clessidra, voce = IMMAGINI_B9.clessidra;
        const x = C.posto.x, y = C.posto.y, s = voce.alt / 384;
        const ox = x - 240 * s * voce.ancora[0], oy = y - voce.alt * voce.ancora[1];
        const f = Math.max(0, Math.min(1, K.restoTick / K.totTick));
        const sec = Math.ceil((K.restoTick * MS_PER_TICK) / 1000);
        const corre = S.attiva && !K.scaduta && !K.chiusa;
        const urgente = corre && sec <= C.ultimiSecondi;
        const lampo = urgente && Math.floor(t / (sec <= C.battito.finaleSecondi ? 6 : 12)) % 2 === 0;
        ctx.save();
        ctx.fillStyle = 'rgba(8, 5, 3, 0.6)';
        ctx.beginPath(); ctx.ellipse(x, y + 5, 26, 7, 0, 0, TAU); ctx.fill();
        ctx.translate(ox, oy); ctx.scale(s, s); // da qui: px d'origine dell'immagine
        const vetro = () => { ctx.beginPath(); G.vetro.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };
        vetro(); ctx.fillStyle = 'rgba(12, 18, 28, 0.85)'; ctx.fill();
        ctx.save();
        vetro(); ctx.clip();
        ctx.fillStyle = K.scaduta ? '#7c2d12' : lampo ? '#ef4444' : '#f9cb40';
        const ySu = G.collo - (G.collo - G.alto) * 0.82 * f;        // la sabbia di sopra cala
        ctx.fillRect(G.mezzo - 60, ySu, 120, G.collo - ySu);
        const g = 1 - f;
        if (g > 0.001) {                                             // il mucchio di sotto cresce
          const yGiu = G.basso - (G.basso - G.collo) * 0.72 * g;
          ctx.beginPath(); ctx.moveTo(G.mezzo - 60, G.basso); ctx.lineTo(G.mezzo - 60, yGiu + 26);
          ctx.quadraticCurveTo(G.mezzo, yGiu - 18, G.mezzo + 60, yGiu + 26); ctx.lineTo(G.mezzo + 60, G.basso); ctx.closePath(); ctx.fill();
        }
        if (corre) ctx.fillRect(G.mezzo - 3 + Math.sin(t * 0.9), G.collo, 6, G.basso - G.collo);
        ctx.restore();
        ctx.restore();
        timbraB9('clessidra', 0, 0, x, y);
        if (urgente) { ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s); ctx.beginPath(); G.vetro.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.strokeStyle = 'rgba(254, 202, 202, 0.9)'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); }
        return undefined;
      }
    } catch (err) { guastoB9('clessidra', err); }
    return disegnaClessidraBaseB9.apply(this, arguments);
  };
}

if (typeof disegnaCiarlatanoB7 === 'function') {
  const disegnaCiarlatanoBaseB9 = disegnaCiarlatanoB7;
  /** Il ciarlatano dell'autore col suo tavolino; le tre scatole (quelle del gioco) restano a codice, sopra il panno. */
  disegnaCiarlatanoB7 = function disegnaCiarlatanoB9(st, t) {
    try {
      const T = st && st.ciarlatanoB7;
      if (T && !T.andato && fotogrammaB9('npc-ciarlatano')) {
        const P = CIARLATANO_B7.posto, x = P.x, y = P.y, K = CONFIG_B9.ciarlatano;
        ctx.save();
        ctx.fillStyle = 'rgba(8, 5, 3, 0.6)'; ctx.beginPath(); ctx.ellipse(x, y + 16, 22, 6, 0, 0, TAU); ctx.fill();
        aloneCaldoB9(x, y - 14, 36, 0.3 + 0.05 * Math.sin(t * 0.3));
        timbraB9('npc-ciarlatano', T.aperto ? 1 : 0, Math.floor(t / (T.aperto ? K.mescolaTick : K.ogniTick)) % 4, x, y);
        for (let i = -1; i <= 1; i++) { // le tre scatole di cartapesta (come b7)
          const bx = x + i * 10;
          ctx.fillStyle = '#c9a679';
          ctx.beginPath(); ctx.moveTo(bx - 3, y - 6.5); ctx.lineTo(bx + 3, y - 6.5); ctx.lineTo(bx + 4.5, y + 0.5); ctx.lineTo(bx - 4.5, y + 0.5); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#050302'; ctx.lineWidth = 0.8; ctx.stroke();
          ctx.fillStyle = '#8f160c'; ctx.fillRect(bx - 4, y - 2.5, 8, 1.2);
        }
        ctx.restore();
        if (!T.aperto) drawPillLabel('🎩 TRE SCATOLE [E]', x + 8, y - 50, 124, { size: 7.5, color: '#fde68a', border: '#c9a23a' });
        return undefined;
      }
    } catch (err) { guastoB9('ciarlatano', err); }
    return disegnaCiarlatanoBaseB9.apply(this, arguments);
  };
}

// ===========================================================================
// D. TRASFORMAZIONI (b4-trasformazioni.js): gli accessori seguono le àncore di b4, per tutti i personaggi
// ===========================================================================
if (typeof parteCoronaB4 === 'function') {
  const parteCoronaBaseB9 = parteCoronaB4;
  parteCoronaB4 = function parteCoronaB9(c, A) {
    try {
      const img = scenaB9('trasf-re-denari-corona');
      if (img) {
        const K = CONFIG_B9.trasformazioni.corona, a = K.larg * (img.naturalHeight / img.naturalWidth);
        c.translate(A.banda[0], A.banda[1]);
        c.rotate(A.banda[2]);
        if (disegnaRitaglioB9(c, 'trasf-re-denari-corona', 0, 0, img.naturalWidth, img.naturalHeight, -K.larg / 2, -K.su, K.larg, a)) return undefined;
      }
    } catch (err) { guastoB9('corona', err); }
    return parteCoronaBaseB9.apply(this, arguments);
  };
}

if (typeof parteMascheraB4 === 'function') {
  const parteMascheraBaseB9 = parteMascheraB4;
  parteMascheraB4 = function parteMascheraB9(c, A) {
    try {
      const img = scenaB9('trasf-pulcinella-maschera');
      if (img) {
        const K = CONFIG_B9.trasformazioni.maschera, a = K.larg * (img.naturalHeight / img.naturalWidth);
        if (disegnaRitaglioB9(c, 'trasf-pulcinella-maschera', 0, 0, img.naturalWidth, img.naturalHeight, A.viso[0] - K.larg * 0.56, A.viso[1] - a * 0.42, K.larg, a)) {
          for (const [ex, ey] of A.occhi) { // gli occhi furbi restano quelli di b4: senza, la maschera è una macchia
            c.fillStyle = '#fffdf5';
            c.beginPath(); c.arc(ex, ey, 1.05, 0, TAU); c.fill();
          }
          return undefined;
        }
      }
    } catch (err) { guastoB9('maschera', err); }
    return parteMascheraBaseB9.apply(this, arguments);
  };
}

if (typeof disegnaDietroB4 === 'function') {
  const disegnaDietroBaseB9 = disegnaDietroB4;
  disegnaDietroB4 = function disegnaDietroB9(s, px, py, opts, sulPalco) {
    let mantello = false;
    try {
      const K = CONFIG_B9.trasformazioni;
      if (s && s.attive && (s.attive.denari || s.attive.ombra)) {
        const velo = s.attive.ombra ? fotogrammaB9('trasf-ombra-velo') : null;
        const manto = s.attive.denari ? fotogrammaB9('trasf-re-denari-mantello') : null;
        if (velo || manto) {
          apriPupazzoB4(px, py, opts);
          const t = opts.tick || 0;
          for (const [c, nome, P] of [[velo, 'trasf-ombra-velo', K.velo], [manto, 'trasf-re-denari-mantello', K.mantello]]) {
            if (!c) continue;
            const an = IMMAGINI_B9[nome].ancora, a = IMMAGINI_B9[nome].alt, l = a * (c.width / c.height);
            const alfa0 = ctx.globalAlpha;
            ctx.globalAlpha = alfa0 * P.alfa;
            ctx.save();
            ctx.translate(P.x, P.y);
            ctx.rotate(Math.sin(t * 0.11) * 0.035);
            ctx.drawImage(c, -l * an[0], -a * an[1], l, a);
            ctx.restore();
            ctx.globalAlpha = alfa0;
            contaB9(nome);
          }
          ctx.restore();
          mantello = Boolean(manto);
        }
      }
    } catch (err) { guastoB9('costume', err); }
    if (!mantello) return disegnaDietroBaseB9.apply(this, arguments);
    s.attive.denari = false; // il mantello a codice lascia il posto a quello dell'autore (solo per questo disegno)
    try { return disegnaDietroBaseB9.apply(this, arguments); } finally { s.attive.denari = true; }
  };
}

// ===========================================================================
// G. INTERFACCIA (agganci in b3-comandi-opzioni.js; segni dei boss di a6 avvolti; simboli del gamepad)
// ===========================================================================
let telaCartiglioB9 = null;

/**
 * AGGANCIO di b3 (disegnaOpzioniB3): il cartiglio delle Opzioni con la cornice dell'autore. Il riquadro scuro
 * dell'immagine combacia col pannello `P` {x, y, w, h}; i due rotoli stanno fuori, ai lati.
 * @returns {boolean} true se l'ha disegnato (b3 salta fondo, bordi e rotoli a codice)
 */
function cartiglioOpzioniB9(P) {
  try {
    const img = scenaB9('ui-cartiglio-opzioni');
    if (!img) return false;
    const chiave = `${scalaBase}|${P.x}|${P.y}|${P.w}|${P.h}`;
    if (!telaCartiglioB9 || telaCartiglioB9.chiaveB9 !== chiave || telaCartiglioB9.imgB9 !== img) {
      const K = CONFIG_B9.cartiglio, R = K.cornice;
      const c = document.createElement('canvas');
      c.width = Math.round(W * scalaBase); c.height = Math.round(H * scalaBase);
      const g = c.getContext('2d');
      g.setTransform(scalaBase, 0, 0, scalaBase, 0, 0);
      const ky = (H - 2) / (R[3] - R[1]), lr = K.rotolo * ky;
      disegnaRitaglioB9(g, 'ui-cartiglio-opzioni', R[0], R[1], R[2] - R[0], R[3] - R[1], P.x, 1, P.w, H - 2);
      disegnaRitaglioB9(g, 'ui-cartiglio-opzioni', 0, 0, K.rotolo, img.naturalHeight, P.x - lr + 1, 1, lr, H - 2);
      disegnaRitaglioB9(g, 'ui-cartiglio-opzioni', img.naturalWidth - K.rotolo, 0, K.rotolo, img.naturalHeight, P.x + P.w - 1, 1, lr, H - 2);
      g.globalCompositeOperation = 'source-atop'; // il rosso dei rotoli scende verso il cremisi scuro del velluto del gioco
      g.fillStyle = K.veloRotoli;
      g.fillRect(P.x - lr, 0, lr + 1, H); g.fillRect(P.x + P.w - 1, 0, lr + 1, H);
      c.chiaveB9 = chiave; c.imgB9 = img;
      telaCartiglioB9 = c;
    }
    ctx.drawImage(telaCartiglioB9, 0, 0, W, H);
    contaB9('ui-cartiglio-opzioni');
    return true;
  } catch (err) { guastoB9('cartiglio', err); return false; }
}

/** AGGANCIO di b3: interruttore a lanterna (spenta / accesa) al posto della levetta, in (cx, ly) alto 9 px. */
function interruttoreB9(cx, ly, acceso) {
  try { return timbraB9('ui-interruttore-lanterna', 0, acceso ? 1 : 0, cx + 14, ly + 4.5); } catch (err) { guastoB9('interruttore', err); return false; }
}

/**
 * AGGANCIO di b3: il tasto di pergamena nel riquadro (x, y, l, a), in tre fette: i due estremi decorati
 * restano interi, il centro liscio si allunga quanto serve.
 */
function tastoPergamenaB9(x, y, l, a) {
  try {
    const img = scenaB9('ui-tasto-pergamena');
    if (!img) return false;
    const K = CONFIG_B9.tasto, B = K.bordo, il = img.naturalWidth, ia = img.naturalHeight;
    const k = a / (B[3] - B[1]);                       // px logici per px d'origine
    const larg = Math.max(22, Math.round(l)) + (B[0] + il - B[2]) * k, alt = ia * k, capo = K.capo * k;
    const chiave = `tasto|${scalaBase}|${Math.round(l)}|${a}`;
    let c = statoB9.fotogrammi.get(chiave);
    if (!c) {
      c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(larg * scalaBase)); c.height = Math.max(1, Math.round(alt * scalaBase));
      const g = c.getContext('2d');
      g.setTransform(scalaBase, 0, 0, scalaBase, 0, 0);
      disegnaRitaglioB9(g, 'ui-tasto-pergamena', K.capo, 0, il - 2 * K.capo, ia, capo - 0.3, 0, larg - 2 * capo + 0.6, alt);
      disegnaRitaglioB9(g, 'ui-tasto-pergamena', 0, 0, K.capo, ia, 0, 0, capo, alt);
      disegnaRitaglioB9(g, 'ui-tasto-pergamena', il - K.capo, 0, K.capo, ia, larg - capo, 0, capo, alt);
      statoB9.fotogrammi.set(chiave, c);
    }
    const s = scalaBase;
    ctx.drawImage(c, Math.round((x - B[0] * k) * s) / s, Math.round((y - B[1] * k) * s) / s, c.width / s, c.height / s);
    contaB9('ui-tasto-pergamena');
    return true;
  } catch (err) { guastoB9('tasto', err); return false; }
}

/** AGGANCIO di b3: la mano di marionetta che fa da cursore, centrata in (x, y); `verso` = 1 indica a destra, -1 a sinistra. */
function cursoreB9(x, y, verso = 1) {
  try {
    const K = CONFIG_B9.cursore, opzioni = typeof b3 !== 'undefined' && Boolean(b3.opz);
    const dx = (opzioni ? 0 : K.spintaPausa) * -verso + Math.sin(performance.now() / 180) * K.dondolio * verso;
    return timbraB9('ui-cursore-mano', 0, 0, x + dx, y, { alt: opzioni ? K.altOpzioni : K.altPausa, specchio: verso < 0 });
  } catch (err) { guastoB9('cursore', err); return false; }
}

if (typeof disegnaSegniA6 === 'function') {
  const disegnaSegniBaseB9 = disegnaSegniA6;
  /** I segni di completamento: i medaglioni dell'autore; chi non ne ha uno lo riceve a codice, nello stesso stile. */
  disegnaSegniA6 = function disegnaSegniB9(cx, charId, s) {
    try {
      if (scenaB9('segni-boss')) {
        const S = CONFIG_A6.scheda, G = CONFIG_A6.segni, M = CONFIG_B9.segni;
        const avuti = s.segni[charId] || [];
        const y = S.y + G.y;
        const passo = Math.min(G.passo, (S.w - 20) / Math.max(1, SEGNI_A6.length - 1));
        const x0 = cx + S.w / 2 - ((SEGNI_A6.length - 1) * passo) / 2;
        ctx.save();
        for (let i = 0; i < SEGNI_A6.length; i++) {
          const sg = SEGNI_A6[i], x = x0 + i * passo, preso = avuti.includes(sg.boss);
          ctx.globalAlpha = preso ? 1 : G.spento;
          if (preso) {
            ctx.fillStyle = 'rgba(249, 203, 64, 0.22)';
            ctx.beginPath(); ctx.arc(x, y, Math.min(7, passo / 2 + 0.5), 0, TAU); ctx.fill();
          }
          const alt = Math.min(IMMAGINI_B9['segni-boss'].alt, passo);
          if (M[sg.sprite] === undefined || !timbraB9('segni-boss', 0, M[sg.sprite], x, y, { alt })) {
            // nessun medaglione dell'autore per questo segno: lo stesso disco con l'anello, e dentro l'icona a punti
            const D = CONFIG_B9.medaglione;
            ctx.fillStyle = D.fondo; ctx.strokeStyle = D.anello; ctx.lineWidth = D.spessore;
            ctx.beginPath(); ctx.arc(x, y, alt / 2 - D.margine, 0, TAU); ctx.fill(); ctx.stroke();
            drawPixelSprite(SPRITE_OGGETTI[sg.sprite] || SPRITE_OGGETTI.spada, x, y, G.scala * D.icona);
          }
        }
        ctx.restore();
        return undefined;
      }
    } catch (err) { guastoB9('segni', err); }
    return disegnaSegniBaseB9.apply(this, arguments);
  };
}

/** Simboli del gamepad dentro le scritte: i caratteri Ⓐ Ⓑ Ⓧ Ⓨ ✥ e le sigle fra parentesi quadre. */
const SONDA_PAD_B9 = /[ⒶⒷⓍⓎ✥]|\[(LT|RT|LB|RB|START|SELECT|LEVETTA S|LEVETTA D)\]|^(LT|RT|LB|RB)$/gi;
const VUOTO_PAD_B9 = '\u2007\u2007'; // due spazi larghi una cifra: il posto del simbolo

if (typeof drawTextFit === 'function') {
  const drawTextFitBaseB9 = drawTextFit;
  /**
   * Col gamepad in mano, le scritte mostrano i simboli dell'autore al posto dei caratteri (che cambiano
   * aspetto da un computer all'altro). Senza gamepad, senza immagine o al primo intoppo: la scritta di prima.
   */
  drawTextFit = function drawTextFitB9(text, x, y, maxW, opts) {
    if (typeof text !== 'string' || typeof b3 === 'undefined' || b3.dispositivo !== 'pad' || !usaImmagineB9('ui-pad-simboli')) return drawTextFitBaseB9(text, x, y, maxW, opts);
    let posti = null, t2 = text;
    try {
      const t = b3.adatta && typeof adattaTestoB3 === 'function' ? adattaTestoB3(text) : text;
      SONDA_PAD_B9.lastIndex = 0;
      if (typeof t === 'string' && SONDA_PAD_B9.test(t) && fotogrammaB9('ui-pad-simboli')) {
        posti = [];
        let fuori = '', da = 0, m;
        SONDA_PAD_B9.lastIndex = 0;
        while ((m = SONDA_PAD_B9.exec(t))) {
          const col = CONFIG_B9.pad[(m[1] || m[2] || m[0]).toUpperCase()];
          if (col === undefined) continue;
          fuori += t.slice(da, m.index);
          posti.push([fuori.length, col]);
          fuori += VUOTO_PAD_B9;
          da = m.index + m[0].length;
        }
        t2 = fuori + t.slice(da);
        if (!posti.length) posti = null;
      }
    } catch (err) { guastoB9('simboli', err); posti = null; }
    if (!posti) return drawTextFitBaseB9(text, x, y, maxW, opts);
    const eraBanner = statoRun.banner;
    if (text === eraBanner) statoRun.banner = t2; // b3 riconosce il banner dal testo: resta riconoscibile
    try { drawTextFitBaseB9(t2, x, y, maxW, opts); } finally { if (statoRun.banner === t2) statoRun.banner = eraBanner; }
    try {
      const o = opts || {};
      let size = o.size === undefined ? 8.5 : o.size;
      if (OPZIONI.testoGrande && !b3.dentroPillola && (b3.ambitoGrande > 0 || text === eraBanner) && typeof TESTO_GRANDE_B3 !== 'undefined') size *= TESTO_GRANDE_B3.fattore;
      const stile = `${o.style ? o.style + ' ' : ''}${o.weight === undefined ? 'bold ' : (o.weight ? o.weight + ' ' : '')}`;
      ctx.save();
      ctx.font = `${stile}${size}px ui-monospace, monospace`;
      while (size > 5.5 && ctx.measureText(t2).width > maxW) { size -= 0.5; ctx.font = `${stile}${size}px ui-monospace, monospace`; }
      const tot = ctx.measureText(t2).width, k = tot > maxW ? maxW / tot : 1;
      const al = o.align || 'center', inizio = Math.round(x) - (al === 'center' ? (tot * k) / 2 : al === 'right' ? tot * k : 0);
      const lv = ctx.measureText(VUOTO_PAD_B9).width;
      for (const [i, col] of posti) {
        const cx = inizio + (ctx.measureText(t2.slice(0, i)).width + lv / 2) * k;
        timbraB9('ui-pad-simboli', 0, col, cx, Math.round(y) - size * 0.34, { alt: Math.round(size * CONFIG_B9.padAltezza * 2) / 2 });
      }
      ctx.restore();
    } catch (err) { guastoB9('simboli', err); }
    return undefined;
  };
}

// ===========================================================================
// AVVIO E SONDA QA
// ===========================================================================
for (const nome of Object.keys(IMMAGINI_B9)) if (IMMAGINI_B9[nome].usa) immagineScena(nome);

if (window.__teatro && window.__teatro.interni) {
  Object.assign(window.__teatro.interni, {
    IMMAGINI_B9, CONFIG_B9, immagineScena,
    immaginiB9: {
      /** Stato del caricatore: per ogni immagine se è usata, pronta, in errore e quante volte è stata disegnata. */
      stato() {
        const out = {};
        for (const nome of Object.keys(IMMAGINI_B9)) {
          const v = statoB9.voci.get(nome);
          out[nome] = { usa: usaImmagineB9(nome), tabella: IMMAGINI_B9[nome].usa, pronta: Boolean(v && v.pronta), errore: Boolean(v && v.errore), disegni: statoB9.disegni[nome] || 0 };
        }
        return out;
      },
      /** QA / foto prima-dopo: accende o spegne un'immagine a prescindere dalla tabella (undefined = come da tabella). */
      forza(nome, valore) {
        if (valore === undefined) statoB9.forzate.delete(nome); else statoB9.forzate.set(nome, Boolean(valore));
        if (valore) immagineScena(nome);
        invalidaImmaginiB9();
      },
      /** QA / foto: tutte spente (true), tutte accese comprese le scartate (false), o come da tabella (null). */
      forzaTutte(valore) {
        statoB9.forzate.clear();
        if (valore !== null && valore !== undefined) for (const nome of Object.keys(IMMAGINI_B9)) { statoB9.forzate.set(nome, Boolean(valore)); if (valore) immagineScena(nome); }
        invalidaImmaginiB9();
      },
      /** QA: il caricatore risponde null per tutte le immagini (si provano i ripieghi a codice). */
      senzaRisorse(si) { statoB9.senzaRisorse = Boolean(si); invalidaImmaginiB9(); },
      azzeraConti() { statoB9.disegni = {}; },
      errori: () => statoB9.errori,
      lanciaOrtaggi: lanciaOrtaggiB9,
      pelleOstacolo: (o) => { const p = pelleOstacoloB9(o); return p ? p.img : null; },
    },
  });
}
