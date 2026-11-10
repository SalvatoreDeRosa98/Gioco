/*
 * teatro/b7-stanze.js — (b7) Varianti di stanza e due eventi nuovi.
 *
 *   1. DISPOSIZIONI: le stanze di combattimento sono disegnate a mano in DISPOSIZIONI_B7 (griglia di caratteri
 *      15×7: ostacoli, botole, bracieri, punti di comparsa), con varianti specchiate, peso, piano minimo e
 *      quartiere (0 = comune; 1 Corso Trieste: lampioni e pozzanghere; 2 Villa Comunale: aiuole e fontane;
 *      3 San Leucio: telai e balle di seta; 4 Reggia: colonnati e statue).
 *      Regole dure, verificate da verificaDisposizioniB7() e da tools/qa-teatro-stanze-varianti.js: ogni porta
 *      raggiungibile a piedi da ogni altra (flood fill), nessun nemico a meno di STANZE_C.distanzaPorte px da
 *      una porta né dentro un ostacolo, spazio per muoversi, valide con le porte su qualunque lato.
 *   2. ELEMENTI DI SCENA (ELEMENTI_B7): chiodi del palco a ritmo, casse di polvere, botti/vasi/balle/bauli
 *      fragili, Vasi di Capodimonte, pedana a pressione con cancello, pozzanghere scivolose (solo Corso Trieste).
 *      Gli ostacoli solidi stanno in stanza.ostacoli con gli stessi campi di quelli di base (tipo 'colonna' |
 *      'fossa' | 'braciere', x, y, r, w, h, acceso) più `variante` per il disegno; ciò che sta a filo del
 *      palco (pozzanghere, chiodi, pedane) sta in stanza.suoloB7 e non scende dai cavi.
 *   3. GRUPPI DI NEMICI (GRUPPI_B7): combinazioni per quartiere con tre gradi di difficoltà scelti secondo la
 *      distanza dall'ingresso (CURVA_B7) e stanze a tema rare con un piccolo premio (TEMI_RARI_B7).
 *   4. LE TRE SCATOLE DEL CIARLATANO (CIARLATANO_B7): un ciarlatano d'ombra nella Bisca mescola a vista tre
 *      scatole di cartapesta; ciò che si vede finire sotto una scatola è ciò che c'è (lo stato logico e il
 *      disegno leggono le stesse posizioni).
 *   5. LA CLESSIDRA DELLA RIBALTA (CLESSIDRA_B7): variante a tempo della stanza della Sfida.
 *
 * Agganci nei file di base (una riga ciascuno): 30-mappa.js popolaStanza → gruppoNemiciB7 (i tipi dei nemici,
 * così statistiche e campioni restano quelli di base); 60-resa.js ciclo degli ostacoli → disegnaOstacoloB7.
 * Tutto il resto avvolge le funzioni globali chiamando sempre la base.
 * Script classico: le dichiarazioni di primo livello stanno nello scope globale condiviso (teatro/LEGGIMI.md).
 * Verifica: tools/qa-teatro-stanze-varianti.js.
 */

// ===========================================================================
// TABELLE (tutti i valori di gioco si accordano da qui)
// ===========================================================================

/** Parametri generali delle stanze di combattimento disegnate a mano. */
const STANZE_B7 = Object.freeze({
  griglia: Object.freeze({ colonne: 15, righe: 7 }),
  raggioGiocatore: 9,          // come nella collisione di base (o.r + 9)
  passoFlood: 4,               // px fra i nodi del flood fill
  spazioMinimo: 0.55,          // quota minima dell'arena raggiungibile a piedi
  liberoPorta: 46,             // px senza ostacoli né chiodi attorno a ogni punto di entrata
  comparseMin: 4,              // punti di comparsa validi per OGNI combinazione di porte
  margineComparsa: 14,         // px fra il bordo di un ostacolo e un punto di comparsa
  distanzaNemici: 26,          // px fra due nemici alla comparsa (come in puntoLontanoDallePorteC)
  tolleranzaSacche: 14,        // nodi isolati tollerati (spicchi fra due ostacoli vicini)
  pesoQuartiere: 2.2,          // le disposizioni del quartiere pesano così tante volte quelle comuni
  /** I nemici che camminano girano attorno agli ostacoli (chi vola o sta fermo no). */
  nemiciUrtanoOstacoli: true,
  nemiciTerrestri: Object.freeze(['gatto', 'burattino', 'predone', 'guardia', 'maschera']),
  raggioUrtoNemico: 7,
  /**
   * Fragili: si rompono coi colpi (proiettili, fendente, bombe, scoppi) e a volte lasciano qualcosa.
   * pelle: aspetto del fragile comune secondo il quartiere. tipi.*.premi: pesi di ciò che cade.
   * I Vasi di Capodimonte (richiesta dell'autore) sono più ricchi, ma ogni tanto ne esce un ragno
   * arrabbiato: `ragno` è il tipo del nemico piccolo che compare (oggi la Vespa Cieca).
   */
  fragili: Object.freeze({
    pelle: Object.freeze({ 1: 'botte', 2: 'vaso', 3: 'balla', 4: 'baule' }),
    tipi: Object.freeze({
      comune: Object.freeze({ colpi: 2, premi: Object.freeze({ niente: 0.85, moneta: 0.12, mezzaMaschera: 0.03, ragno: 0 }) }),
      capodimonte: Object.freeze({ colpi: 1, premi: Object.freeze({ niente: 0.45, moneta: 0.3, mezzaMaschera: 0.1, ragno: 0.15 }),
        ragno: 'vespa_cieca', stordimentoRagnoTick: 36 }),
    }),
  }),
  /** Fendente di base (come in passoLogico): portata e avanzamento del colpo, per rompere i fragili. */
  fendente: Object.freeze({ portata: 38, avanti: 20 }),
  /** Cassa di polvere: un colpo e salta. Ferisce nemici e Ferruccio, accende le casse vicine. */
  polvere: Object.freeze({
    colpi: 1, raggio: 52, dannoBase: 14, dannoPerPiano: 4,
    raggioGiocatore: 40, dannoGiocatoreHalf: 1, raggioCatena: 72, ritardoCatenaTick: 9,
  }),
  /** Chiodi del palco: fermi, poi le punte tremano (avviso), salgono, restano fuori, rientrano. */
  spuntoni: Object.freeze({
    raggio: 13, giuTick: 80, avvisoTick: 30, salitaTick: 4, suTick: 44, rientroTick: 12,
    dannoHalf: 1,
  }),
  /** Pozzanghera: tratto scivoloso. presa = quanta della spinta dei piedi arriva a ogni tick (1 = asciutto). */
  pozza: Object.freeze({ rx: 31, ry: 16, presa: 0.09, saltoMaxPx: 12 }),
  /** Pedana a pressione e cancello dell'alcova. */
  pedana: Object.freeze({ raggio: 13 }),
  alcova: Object.freeze({ moneteMin: 1, moneteMax: 2, probMezzaMaschera: 0.25 }),
});

/**
 * Legenda della griglia. `dove`: 'ostacoli' (solidi, in stanza.ostacoli) | 'suolo' (a filo del palco, in
 * stanza.suoloB7) | 'comparsa' | 'premio'. `tipo` è il tipo di base che decide collisioni e colpi:
 * 'colonna' ferma Ferruccio e i colpi, 'fossa' ferma solo Ferruccio, 'braciere' si rovescia se colpito.
 */
const ELEMENTI_B7 = Object.freeze({
  '.': null,
  e: Object.freeze({ dove: 'comparsa' }),
  $: Object.freeze({ dove: 'premio' }),
  // --- comuni ---
  C: Object.freeze({ dove: 'ostacoli', tipo: 'colonna', r: 14, w: 26, h: 26 }),
  o: Object.freeze({ dove: 'ostacoli', tipo: 'fossa', r: 16, w: 34, h: 22 }),
  B: Object.freeze({ dove: 'ostacoli', tipo: 'braciere', r: 10, w: 26, h: 26, acceso: true }),
  b: Object.freeze({ dove: 'ostacoli', tipo: 'colonna', r: 11, w: 22, h: 22, fragile: 'comune' }),
  c: Object.freeze({ dove: 'ostacoli', tipo: 'colonna', variante: 'capodimonte', r: 10, w: 20, h: 20, fragile: 'capodimonte' }),
  P: Object.freeze({ dove: 'ostacoli', tipo: 'colonna', variante: 'polvere', r: 12, w: 24, h: 24, fragile: 'polvere' }),
  G: Object.freeze({ dove: 'ostacoli', tipo: 'colonna', variante: 'cancello', r: 14, w: 28, h: 28, cancello: true }),
  '^': Object.freeze({ dove: 'suolo', tipo: 'spuntoni', sfasa: 0 }),
  v: Object.freeze({ dove: 'suolo', tipo: 'spuntoni', sfasa: 0.5 }),
  '=': Object.freeze({ dove: 'suolo', tipo: 'pedana' }),
  // --- Corso Trieste ---
  L: Object.freeze({ dove: 'ostacoli', tipo: 'colonna', variante: 'lampione', r: 7, w: 14, h: 14 }),
  '~': Object.freeze({ dove: 'suolo', tipo: 'pozza' }),
  // --- Villa Comunale ---
  A: Object.freeze({ dove: 'ostacoli', tipo: 'fossa', variante: 'aiuola', r: 15, w: 34, h: 18 }),
  F: Object.freeze({ dove: 'ostacoli', tipo: 'colonna', variante: 'fontana', r: 19, w: 40, h: 20 }),
  // --- San Leucio ---
  T: Object.freeze({ dove: 'ostacoli', tipo: 'colonna', variante: 'telaio', r: 15, w: 34, h: 20 }),
  S: Object.freeze({ dove: 'ostacoli', tipo: 'colonna', variante: 'balla', r: 12, w: 24, h: 20, fragile: 'comune' }),
  // --- Reggia ---
  K: Object.freeze({ dove: 'ostacoli', tipo: 'colonna', variante: 'marmo', r: 12, w: 22, h: 22 }),
  M: Object.freeze({ dove: 'ostacoli', tipo: 'colonna', variante: 'statua', r: 13, w: 24, h: 24 }),
});

/**
 * Le disposizioni disegnate a mano. q: 0 comune, 1-4 quartiere (piano del ciclo). peso: frequenza relativa.
 * pianoMin: primo piano (assoluto) in cui può uscire. specchi: 'x' (sinistra/destra), 'y' (alto/basso),
 * 'xy' (tutte e tre le varianti). g: 7 righe da 15 caratteri (legenda in ELEMENTI_B7); la colonna 7 e la
 * riga 3 sono gli assi delle porte e restano libere vicino ai muri.
 */
const DISPOSIZIONI_B7 = Object.freeze([
  // ------------------------------------------------------------------ comuni
  { id: 'palco-sgombro', nome: 'Il palco sgombro', q: 0, peso: 0.6, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '...............',
    '...e..e.e..e...',
    '...............',
    '..e.........e..',
    '...............'] },
  { id: 'quattro-colonne', nome: 'Le quattro colonne', q: 0, peso: 1.2, pianoMin: 1, specchi: '', g: [
    '...............',
    '...e.......e...',
    '....C.....C....',
    '...e...e...e...',
    '....C.....C....',
    '...e.......e...',
    '...............'] },
  { id: 'due-colonne', nome: 'Le due colonne', q: 0, peso: 1, pianoMin: 1, specchi: 'y', g: [
    '...............',
    '..e.........e..',
    '....C.....C....',
    '...e...e...e...',
    '...............',
    '...e.......e...',
    '...............'] },
  { id: 'botole-sfalsate', nome: 'Le botole sfalsate', q: 0, peso: 1, pianoMin: 1, specchi: 'x', g: [
    '...............',
    '..e.........e..',
    '.....o.........',
    '...e...e...e...',
    '.........o.....',
    '...e.......e...',
    '...............'] },
  { id: 'braciere-centrale', nome: 'Il braciere in mezzo', q: 0, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '...............',
    '...e...B...e...',
    '...............',
    '..e.........e..',
    '...............'] },
  { id: 'doppio-colonnato', nome: 'Il doppio colonnato', q: 0, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..C..C...C..C..',
    '...e.......e...',
    '....e.....e....',
    '...e.......e...',
    '..C..C...C..C..',
    '...............'] },
  { id: 'croce-di-botole', nome: 'Le quattro botole', q: 0, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '......o.o......',
    '...e.......e...',
    '......o.o......',
    '..e.........e..',
    '...............'] },
  { id: 'deposito-di-polvere', nome: 'Il deposito di polvere', q: 0, peso: 0.9, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '....P.....P....',
    '...e...B...e...',
    '....P.....P....',
    '..e.........e..',
    '...............'] },
  { id: 'botti-in-fila', nome: 'Le botti in fila', q: 0, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e..b...b..e..',
    '...............',
    '...e..b.b..e...',
    '...............',
    '..e..b...b..e..',
    '...............'] },
  { id: 'chiodi-del-palco', nome: 'I chiodi del palco', q: 0, peso: 0.9, pianoMin: 2, specchi: '', g: [
    '...............',
    '..e.........e..',
    '....^.v.^.v....',
    '...e.......e...',
    '....v.^.v.^....',
    '..e.........e..',
    '...............'] },
  { id: 'pedana-e-cancello', nome: 'La pedana e il cancello', q: 0, peso: 0.5, pianoMin: 2, specchi: 'xy', g: [
    '............C$.',
    '..e..........GC',
    '....C..........',
    '...e...e...e...',
    '..........C....',
    '..=.........e..',
    '...............'] },
  { id: 'colonne-a-losanga', nome: 'Le colonne a losanga', q: 0, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..C.........C..',
    '...eC.....Ce...',
    '.....e.e.e.....',
    '...eC.....Ce...',
    '..C.........C..',
    '...............'] },
  { id: 'fossato', nome: 'Il fossato', q: 0, peso: 0.9, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '...oo.....oo...',
    '...e...e...e...',
    '...oo.....oo...',
    '..e.........e..',
    '...............'] },
  { id: 'bracieri-ai-canti', nome: 'I bracieri ai quattro canti', q: 0, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..eB.......Be..',
    '...............',
    '....e..C..e....',
    '...............',
    '..eB.......Be..',
    '...............'] },
  { id: 'scacchiera-di-botole', nome: 'La scacchiera di botole', q: 0, peso: 0.8, pianoMin: 2, specchi: '', g: [
    '...............',
    '..e.o.....o.e..',
    '...............',
    '...e.o.e.o.e...',
    '...............',
    '..e.o.....o.e..',
    '...............'] },
  { id: 'chiodi-e-botti', nome: 'Chiodi e botti', q: 0, peso: 0.8, pianoMin: 2, specchi: '', g: [
    '...............',
    '..e.........e..',
    '...b.^...v.b...',
    '...e...e...e...',
    '...b.v...^.b...',
    '..e.........e..',
    '...............'] },
  { id: 'polveriera-in-fila', nome: 'La polveriera in fila', q: 0, peso: 0.6, pianoMin: 2, specchi: '', g: [
    '...............',
    '..e.........e..',
    '...............',
    '...eP.P.P.Pe...',
    '...............',
    '..e.........e..',
    '...............'] },
  { id: 'vasi-di-capodimonte', nome: 'I vasi di Capodimonte', q: 0, peso: 0.7, pianoMin: 1, specchi: 'y', g: [
    '...............',
    '..e..c...c..e..',
    '...............',
    '...e..C.C..e...',
    '...............',
    '..e.........e..',
    '...............'] },
  // ------------------------------------------------------------------ 1 · Corso Trieste (lampioni, pozzanghere)
  { id: 'viale-dei-lampioni', nome: 'Il viale dei lampioni', q: 1, peso: 1.2, pianoMin: 1, specchi: '', g: [
    '...............',
    '..L.........L..',
    '...e.......e...',
    '.....~~~~~.....',
    '...e.......e...',
    '..L.........L..',
    '...............'] },
  { id: 'quattro-canti', nome: 'I Quattro Canti', q: 1, peso: 1.2, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '.....L...L.....',
    '...e..~~~..e...',
    '.....L...L.....',
    '..e.........e..',
    '...............'] },
  { id: 'vicolo-delle-botti', nome: 'Il vicolo delle botti', q: 1, peso: 1, pianoMin: 1, specchi: 'y', g: [
    '...............',
    '..eb.......be..',
    '...b.......b...',
    '....e.~~~.e....',
    '...............',
    '..e..L...L..e..',
    '...............'] },
  { id: 'pioggia-sul-corso', nome: 'Pioggia sul Corso', q: 1, peso: 1, pianoMin: 1, specchi: 'x', g: [
    '...............',
    '..e~~.......e..',
    '....~~~........',
    '...e...L...e...',
    '........~~~....',
    '..e.......~~e..',
    '...............'] },
  { id: 'polvere-nei-vicoli', nome: 'Polvere nei vicoli', q: 1, peso: 0.9, pianoMin: 1, specchi: 'y', g: [
    '...............',
    '..e.........e..',
    '...Pb.....bP...',
    '...e...L...e...',
    '...............',
    '..e..~~~~~..e..',
    '...............'] },
  { id: 'tombino-allagato', nome: 'Il tombino allagato', q: 1, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '....L.~~~.L....',
    '...e.~~o~~.e...',
    '......~~~......',
    '..e.........e..',
    '...............'] },
  { id: 'lampioni-sfalsati', nome: 'I lampioni sfalsati', q: 1, peso: 1, pianoMin: 1, specchi: 'x', g: [
    '...............',
    '..e.L.......e..',
    '..........L....',
    '...e.~~.~~.e...',
    '....L..........',
    '..e.......L.e..',
    '...............'] },
  // ------------------------------------------------------------------ 2 · Villa Comunale (aiuole, fontane)
  { id: 'la-fontana', nome: 'La fontana', q: 2, peso: 1.2, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '....A.....A....',
    '...e...F...e...',
    '....A.....A....',
    '..e.........e..',
    '...............'] },
  { id: 'viale-delle-aiuole', nome: 'Il viale delle aiuole', q: 2, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '...AA.....AA...',
    '...e...e...e...',
    '...AA.....AA...',
    '..e.........e..',
    '...............'] },
  { id: 'due-fontane', nome: 'Le due fontane', q: 2, peso: 1, pianoMin: 1, specchi: 'y', g: [
    '...............',
    '..e.........e..',
    '....F.....F....',
    '...e..A.A..e...',
    '...............',
    '..e..b...b..e..',
    '...............'] },
  { id: 'labirinto-di-siepi', nome: 'Il labirinto di siepi', q: 2, peso: 0.9, pianoMin: 2, specchi: '', g: [
    '...............',
    '..eA.......Ae..',
    '...A..A.A..A...',
    '......e.e......',
    '...A..A.A..A...',
    '..eA.......Ae..',
    '...............'] },
  { id: 'aiuola-grande', nome: "L'aiuola grande", q: 2, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e..b...b..e..',
    '...............',
    '...e.AAAAA.e...',
    '...............',
    '..e..b...b..e..',
    '...............'] },
  { id: 'chiosco-delle-lucciole', nome: 'Il chiosco delle lucciole', q: 2, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.A.....A.e..',
    '...............',
    '...eB..F..Be...',
    '...............',
    '..e.A.....A.e..',
    '...............'] },
  { id: 'giardino-di-sbieco', nome: 'Il giardino di sbieco', q: 2, peso: 1, pianoMin: 1, specchi: 'x', g: [
    '...............',
    '..eA...........',
    '.....A.....e...',
    '...e...F...e...',
    '...e.....A.....',
    '...........Ae..',
    '...............'] },
  // ------------------------------------------------------------------ 3 · San Leucio (telai, balle di seta)
  { id: 'sala-dei-telai', nome: 'La sala dei telai', q: 3, peso: 1.2, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '...T.T...T.T...',
    '....e..e..e....',
    '...T.T...T.T...',
    '..e.........e..',
    '...............'] },
  { id: 'magazzino-della-seta', nome: 'Il magazzino della seta', q: 3, peso: 1, pianoMin: 1, specchi: 'y', g: [
    '...............',
    '..eSS.....SSe..',
    '...S.......S...',
    '....e..e..e....',
    '...............',
    '..e..S...S..e..',
    '...............'] },
  { id: 'telaio-maestro', nome: 'Il telaio maestro', q: 3, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '....S.....S....',
    '...e.TT.TT.e...',
    '....S.....S....',
    '..e.........e..',
    '...............'] },
  { id: 'corsia-degli-aghi', nome: 'La corsia degli aghi', q: 3, peso: 0.9, pianoMin: 3, specchi: '', g: [
    '...............',
    '..e.T.....T.e..',
    '......^.v......',
    '...e.v...^.e...',
    '......^.v......',
    '..e.T.....T.e..',
    '...............'] },
  { id: 'filatoio', nome: 'Il filatoio', q: 3, peso: 1, pianoMin: 1, specchi: 'x', g: [
    '...............',
    '..eT...........',
    '.....T.....e...',
    '...e...S...e...',
    '...e.....T.....',
    '...........Te..',
    '...............'] },
  { id: 'tintoria', nome: 'La tintoria', q: 3, peso: 1, pianoMin: 1, specchi: 'y', g: [
    '...............',
    '..e.........e..',
    '....o..B..o....',
    '...e.S...S.e...',
    '....o.....o....',
    '..e.........e..',
    '...............'] },
  { id: 'deposito-chiuso', nome: 'Il deposito chiuso', q: 3, peso: 0.6, pianoMin: 3, specchi: 'xy', g: [
    '.$T............',
    'TG..........e..',
    '..........T....',
    '...e...e...e...',
    '....T..........',
    '..e.........=..',
    '...............'] },
  // ------------------------------------------------------------------ 4 · Reggia (colonnati, statue)
  { id: 'colonnato-reale', nome: 'Il colonnato reale', q: 4, peso: 1.2, pianoMin: 1, specchi: '', g: [
    '...............',
    '..K.K.....K.K..',
    '...e.......e...',
    '....e..e..e....',
    '...e.......e...',
    '..K.K.....K.K..',
    '...............'] },
  { id: 'galleria-delle-statue', nome: 'La galleria delle statue', q: 4, peso: 1.2, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.........e..',
    '...M..M.M..M...',
    '....e.....e....',
    '...M..M.M..M...',
    '..e.........e..',
    '...............'] },
  { id: 'anticamera-del-trono', nome: "L'anticamera del trono", q: 4, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..eK.......Ke..',
    '.....B...B.....',
    '...e...e...e...',
    '.....B...B.....',
    '..eK.......Ke..',
    '...............'] },
  { id: 'scacchiera-reale', nome: 'La scacchiera reale', q: 4, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.M.....M.e..',
    '......K.K......',
    '...e.M...M.e...',
    '......K.K......',
    '..e.M.....M.e..',
    '...............'] },
  { id: 'rotonda', nome: 'La rotonda', q: 4, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '.....K...K.....',
    '...e.......e...',
    '...K.e.M.e.K...',
    '...e.......e...',
    '.....K...K.....',
    '...............'] },
  { id: 'polveriera-reale', nome: 'La polveriera reale', q: 4, peso: 0.8, pianoMin: 4, specchi: '', g: [
    '...............',
    '..e.........e..',
    '...MP.....PM...',
    '...e...B...e...',
    '...MP.....PM...',
    '..e.........e..',
    '...............'] },
  { id: 'tesoro-del-re', nome: 'Il tesoro del re', q: 4, peso: 0.6, pianoMin: 4, specchi: 'xy', g: [
    '...............',
    '..e.........e..',
    '....K.....K....',
    '...e...e...e...',
    '..........=....',
    'KG..........e..',
    '.$K............'] },
  { id: 'sala-delle-porcellane', nome: 'La sala delle porcellane', q: 4, peso: 1, pianoMin: 1, specchi: '', g: [
    '...............',
    '..e.c.....c.e..',
    '......K.K......',
    '...e.......e...',
    '......K.K......',
    '..e.c.....c.e..',
    '...............'] },
  { id: 'chiodi-dorati', nome: 'I chiodi dorati', q: 4, peso: 0.8, pianoMin: 4, specchi: '', g: [
    '...............',
    '..e.K.....K.e..',
    '.....^.v.^.....',
    '...e.......e...',
    '.....v.^.v.....',
    '..e.K.....K.e..',
    '...............'] },
].map((d) => Object.freeze({ ...d, g: Object.freeze(d.g) })));

/**
 * Gruppi di nemici per quartiere. diff: 1 facile, 2 medio, 3 difficile (CURVA_B7 sceglie il grado secondo
 * la distanza dall'ingresso). Solo nemici che già esistono; statistiche, velocità e campioni li decide
 * popolaStanza di base.
 */
const GRUPPI_B7 = Object.freeze({
  1: Object.freeze([ // al piano 1 mai più di due gatti per stanza (come il Vicolo dei Gatti dell'autore)
    { id: 'gatto-e-vespa', diff: 1, peso: 3, tipi: ['gatto', 'vespa_cieca'] },
    { id: 'due-vespe', diff: 1, peso: 2, tipi: ['vespa_cieca', 'vespa_cieca'] },
    { id: 'due-gatti', diff: 1, peso: 2, tipi: ['gatto', 'gatto'] },
    { id: 'bozzi', diff: 1, peso: 1, tipi: ['bomba_ferma', 'bomba_ferma'] },
    { id: 'coppia-di-gatti', diff: 2, peso: 4, tipi: ['gatto', 'gatto'] },
    { id: 'gatto-e-vespe', diff: 2, peso: 2, tipi: ['gatto', 'vespa_cieca', 'vespa_cieca'] },
    { id: 'nido', diff: 2, peso: 2, tipi: ['vespa_cieca', 'vespa_cieca', 'vespa_cieca'] },
    { id: 'gatto-e-bozzo', diff: 2, peso: 1, tipi: ['gatto', 'bomba_ferma', 'vespa_cieca'] },
    { id: 'gatti-e-vespa', diff: 3, peso: 3, tipi: ['gatto', 'gatto', 'vespa_cieca'] },
    { id: 'nido-grande', diff: 3, peso: 2, tipi: ['vespa_cieca', 'vespa_cieca', 'vespa_cieca', 'vespa_cieca'] },
    { id: 'gatti-e-bozzo', diff: 3, peso: 2, tipi: ['gatto', 'gatto', 'bomba_ferma'] },
    { id: 'vicolo-minato', diff: 3, peso: 1, tipi: ['gatto', 'vespa_cieca', 'vespa_cieca', 'bomba_ferma'] },
  ]),
  2: Object.freeze([
    { id: 'due-lucciole', diff: 1, peso: 3, tipi: ['lucciola', 'lucciola'] },
    { id: 'lucciola-e-torrione', diff: 1, peso: 3, tipi: ['lucciola', 'statua'] },
    { id: 'predone-e-lucciola', diff: 1, peso: 2, tipi: ['predone', 'lucciola'] },
    { id: 'tre-lucciole', diff: 2, peso: 2, tipi: ['lucciola', 'lucciola', 'lucciola'] },
    { id: 'due-predoni', diff: 2, peso: 2, tipi: ['predone', 'predone'] },
    { id: 'torrione-e-predone', diff: 2, peso: 3, tipi: ['statua', 'predone'] },
    { id: 'due-torrioni', diff: 2, peso: 2, tipi: ['statua', 'statua'] },
    { id: 'torrione-e-lucciole', diff: 2, peso: 2, tipi: ['statua', 'lucciola', 'lucciola'] },
    { id: 'predoni-e-lucciola', diff: 3, peso: 3, tipi: ['predone', 'predone', 'lucciola'] },
    { id: 'torrioni-e-predone', diff: 3, peso: 2, tipi: ['statua', 'statua', 'predone'] },
    { id: 'quattro-lucciole', diff: 3, peso: 2, tipi: ['lucciola', 'lucciola', 'lucciola', 'lucciola'] },
    { id: 'viale-sorvegliato', diff: 3, peso: 2, tipi: ['statua', 'predone', 'lucciola'] },
  ]),
  3: Object.freeze([
    { id: 'due-burattini', diff: 1, peso: 3, tipi: ['burattino', 'burattino'] },
    { id: 'burattino-e-maschera', diff: 1, peso: 2, tipi: ['burattino', 'maschera'] },
    { id: 'guardia-sola', diff: 1, peso: 1, tipi: ['guardia', 'vespa_cieca'] },
    { id: 'burattino-e-guardia', diff: 2, peso: 3, tipi: ['burattino', 'guardia'] },
    { id: 'due-maschere', diff: 2, peso: 2, tipi: ['maschera', 'maschera'] },
    { id: 'due-guardie', diff: 2, peso: 2, tipi: ['guardia', 'guardia'] },
    { id: 'tre-burattini', diff: 2, peso: 2, tipi: ['burattino', 'burattino', 'burattino'] },
    { id: 'guardie-e-burattino', diff: 3, peso: 3, tipi: ['guardia', 'guardia', 'burattino'] },
    { id: 'maschere-e-burattino', diff: 3, peso: 2, tipi: ['maschera', 'maschera', 'burattino'] },
    { id: 'ronda-completa', diff: 3, peso: 2, tipi: ['guardia', 'maschera', 'burattino'] },
    { id: 'burattini-e-guardia', diff: 3, peso: 1, tipi: ['burattino', 'burattino', 'burattino', 'guardia'] },
  ]),
  4: Object.freeze([
    { id: 'guardia-e-torrione', diff: 1, peso: 3, tipi: ['guardia', 'statua'] },
    { id: 'guardia-e-predone', diff: 1, peso: 2, tipi: ['guardia', 'predone'] },
    { id: 'maschera-e-predone', diff: 1, peso: 2, tipi: ['maschera', 'predone'] },
    { id: 'guardie-e-predone', diff: 2, peso: 3, tipi: ['guardia', 'guardia', 'predone'] },
    { id: 'galleria', diff: 2, peso: 3, tipi: ['statua', 'guardia', 'maschera'] },
    { id: 'corte', diff: 2, peso: 2, tipi: ['maschera', 'predone', 'guardia'] },
    { id: 'guardie-e-maschera', diff: 2, peso: 2, tipi: ['guardia', 'guardia', 'maschera'] },
    { id: 'picchetto', diff: 3, peso: 2, tipi: ['guardia', 'guardia', 'guardia', 'predone'] },
    { id: 'torrioni-e-guardie', diff: 3, peso: 2, tipi: ['statua', 'statua', 'guardia', 'guardia'] },
    { id: 'ballo-in-maschera', diff: 3, peso: 2, tipi: ['maschera', 'maschera', 'predone', 'predone'] },
    { id: 'sala-del-trono', diff: 3, peso: 2, tipi: ['guardia', 'guardia', 'maschera', 'statua'] },
  ]),
});

/** Curva di difficoltà dentro il piano: pesi dei gradi secondo la distanza (in stanze) dall'ingresso. */
const CURVA_B7 = Object.freeze([
  Object.freeze({ finoA: 1, pesi: Object.freeze({ 1: 1, 2: 0, 3: 0 }) }),
  Object.freeze({ finoA: 2, pesi: Object.freeze({ 1: 0.55, 2: 0.45, 3: 0 }) }),
  Object.freeze({ finoA: 3, pesi: Object.freeze({ 1: 0.25, 2: 0.6, 3: 0.15 }) }),
  Object.freeze({ finoA: 99, pesi: Object.freeze({ 1: 0.15, 2: 0.55, 3: 0.3 }) }),
]);

/**
 * Stanze a tema, rare: un solo tipo di nemico in forze e un premio un po' migliore alla pulizia.
 * prob: probabilità per stanza di combattimento (mai accanto all'ingresso: profonditaMin).
 * I testi `avviso` e `vinta` sono da approvare dall'autore.
 */
const TEMI_RARI_B7 = Object.freeze({
  prob: 0.06, profonditaMin: 2, unaPerPiano: true,
  premio: Object.freeze({ monete: 1, probMezzaMaschera: 0.35 }),
  1: Object.freeze([
    { id: 'sciame', nome: 'Lo Sciame dei Quattro Canti', tipi: Array(5).fill('vespa_cieca'),
      avviso: '🐝 LO SCIAME DEI QUATTRO CANTI: un nido intero di Vespe Cieche. Chi lo spazza via trova qualcosa in più.' },
    { id: 'agguato', nome: "L'Agguato dei Gatti", tipi: Array(3).fill('gatto'),
      avviso: "🐈 L'AGGUATO DEI GATTI: tre paia d'occhi nel buio del vicolo. Chi ne esce trova qualcosa in più." },
  ]),
  2: Object.freeze([
    { id: 'ballo-delle-lucciole', nome: 'Il Ballo delle Lucciole', tipi: Array(5).fill('lucciola'),
      avviso: '✨ IL BALLO DELLE LUCCIOLE: la Villa si accende tutta insieme. Chi le spegne trova qualcosa in più.' },
    { id: 'predoni-della-villa', nome: 'I Predoni della Villa', tipi: Array(3).fill('predone'),
      avviso: "🗡 I PREDONI DELLA VILLA: tre ombre dietro le siepi. Chi le stana trova qualcosa in più." },
  ]),
  3: Object.freeze([
    { id: 'teatrino', nome: 'Il Teatrino degli Scuciti', tipi: Array(4).fill('burattino'),
      avviso: '🧵 IL TEATRINO DEGLI SCUCITI: una compagnia intera di burattini senza padrone. Chi cala il sipario trova qualcosa in più.' },
    { id: 'plotone', nome: 'Il Plotone di San Leucio', tipi: Array(3).fill('guardia'),
      avviso: '🛡 IL PLOTONE DI SAN LEUCIO: la ronda al completo. Chi rompe le righe trova qualcosa in più.' },
  ]),
  4: Object.freeze([
    { id: 'plotone-reale', nome: 'Il Plotone delle Guardie', tipi: Array(4).fill('guardia'),
      avviso: '🛡 IL PLOTONE DELLE GUARDIE: la guardia borbonica schierata. Chi rompe le righe trova qualcosa in più.' },
    { id: 'corte-delle-maschere', nome: 'La Corte delle Maschere', tipi: Array(3).fill('maschera'),
      avviso: '🎭 LA CORTE DELLE MASCHERE: tre volti chiusi che aspettano. Chi li fa parlare trova qualcosa in più.' },
  ]),
  vinta: '★ STANZA A TEMA RIPULITA: il Teatro applaude e lascia cadere qualcosa in più.',
});

/**
 * Le tre scatole del ciarlatano (nella Bisca; nota dell'autore: scatole di cartapesta al posto delle carte).
 * Il ciarlatano alza le tre scatole e mostra cosa c'è sotto (il premio, forse una bomba, niente), le copre e
 * le mescola a vista. Onesto: ordine[posto] dice quale scatola sta in ogni posto e il disegno usa le stesse
 * posizioni (posizioniScatoleB7): quello che si vede finire sotto una scatola è ciò che c'è.
 * Tempi in tick (60 al secondo). poste: costo → premio (monete × moltiplica, oppure moneteVincita; con
 * probOggettoForte il premio è un oggetto Forte); probBomba = probabilità che una delle due scatole senza
 * premio nasconda una bomba accesa; scambi e scambioTick (durata del primo scambio) × accelera a ogni
 * scambio: la velocità cresce con la posta e durante la mano.
 */
const CIARLATANO_B7 = Object.freeze({
  probCiarlatano: 0.75,
  posto: Object.freeze({ x: 126, y: 136, raggioUso: 44, raggioCorpo: 13 }),
  partiteMax: 4, vinciteMax: 2, viaDopoOggetto: true,
  mostraTick: 96, copriTick: 22, rivelaTick: 26, esitoTick: 100, pausaScambioTick: 3, scambioMinTick: 7,
  arcoPx: 16,                  // quanto si scostano due scatole che si incrociano (× la distanza in posti)
  /** La bomba che spunta: miccia e scoppio (se c'è a1 si usa la sua bomba, con la sua miccia e i suoi danni). */
  bomba: Object.freeze({ micciaTick: 110, raggio: 60, dannoGiocatoreHalf: 1, distanzaPx: 34 }),
  ripiegoMonete: 7,            // se il piedistallo è occupato l'oggetto Forte diventa monete (prezzo della Fucina)
  poste: Object.freeze([
    Object.freeze({ id: 'piccola', nome: 'Due grani', costoMonete: 2, costoHalf: 0, moltiplica: 2, moneteVincita: 0, probOggettoForte: 0, probBomba: 0.35, scambi: 5, scambioTick: 24, accelera: 0.97 }),
    Object.freeze({ id: 'tipica', nome: 'Cinque grani', costoMonete: 5, costoHalf: 0, moltiplica: 2, moneteVincita: 0, probOggettoForte: 0.3, probBomba: 0.6, scambi: 8, scambioTick: 15, accelera: 0.96 }),
    Object.freeze({ id: 'maschera', nome: '½ Maschera', costoMonete: 0, costoHalf: 1, moltiplica: 0, moneteVincita: 4, probOggettoForte: 0.5, probBomba: 0.8, scambi: 11, scambioTick: 11, accelera: 0.97 }),
  ]),
  pannello: Object.freeze({ x: 138, y: 84, w: 364, h: 204, slotX: Object.freeze([246, 320, 394]), slotY: 206, scatolaL: 50, scatolaA: 46, alzataPx: 34 }),
});

/**
 * La Clessidra della Ribalta: variante della Sfida (a3). La sabbia scorre da quando si tocca il piedistallo.
 * Premio pieno (ondate finite in tempo): l'oggetto del piedistallo + monetePieno. Premio ridotto (sabbia
 * finita): solo moneteRidotto. Non si muore per il tempo.
 */
const CLESSIDRA_B7 = Object.freeze({
  probVariante: 0.4,
  secondiBase: 6, secondiPerOndata: 13,
  ultimiSecondi: 8,
  monetePieno: 2, moneteRidotto: 3,
  posto: Object.freeze({ x: 228, y: 204, raggioCorpo: 16 }),
  scala: 1.3,                  // la clessidra è grande: 50 × 88 px a 640×360
  battito: Object.freeze({ normaleTick: 60, incalzaTick: 30, finaleTick: 12, finaleSecondi: 3 }),
});

/** Testi per il giocatore (tutti da approvare dall'autore). */
const TESTI_B7 = Object.freeze({
  pedana: '⚙ La pedana cede sotto i piedi: da qualche parte un cancello si abbassa.',
  polvere: 'una cassa di polvere',
  spuntoni: 'i chiodi del palco',
  ciarlatanoSaluto: "🎩 Nell'angolo un ciarlatano d'ombra ha tre scatole di cartapesta: «Scatola vince, scatola perde!» [E]",
  ciarlatanoInvito: "«Scatola vince, scatola perde! Quanto ce miette, guagliò?»",
  ciarlatanoGuarda: "«Guarda buono addò sta 'o premio... e mo' nun 'o perdere d'uocchie.»",
  ciarlatanoMescola: '«Gira, gira, gira...»',
  ciarlatanoScegli: "«Addò sta? Scegli na scatola.»",
  ciarlatanoVinta: "«Uh, tiene l'uocchie bbuone! Pigliatello.»",
  ciarlatanoVuota: '«Scatola vacante! Ritenta, sarai cchiù furtunato.»',
  ciarlatanoBomba: "«'A bomba! Fuje, guagliò!»",
  ciarlatanoVia: "🎩 «Troppa furtuna pe' na sera sola.» Il ciarlatano raccoglie le scatole e svanisce nel buio.",
  ciarlatanoStanco: '🎩 «Pe stasera basta accussì.» Il ciarlatano raccoglie le scatole e svanisce nel buio.',
  ciarlatanoSenzaGrani: '🎩 «Senza grani nun se joca, guagliò.»',
  ciarlatanoUltimaMaschera: "🎩 «L'ultima mezza Maschera nun m'a piglio: tornatenne sano.»",
  ciarlatanoBombaBanner: "💣 Dalla scatola spunta una bomba accesa: scappa!",
  ciarlatanoMonete: (n) => `🎩 Sotto la scatola c'erano ${n}🪙: sono tuoi.`,
  ciarlatanoOggetto: (nome) => `🎩 Sotto la scatola c'era una reliquia: ${nome} [Click/E]`,
  ciarlatanoRipiego: (n) => `🎩 La reliquia non trova posto: il ciarlatano te la paga ${n}🪙.`,
  titoloCiarlatano: 'LE TRE SCATOLE DEL CIARLATANO',
  ragno: '🕷 Dal vaso di Capodimonte salta fuori un ragno arrabbiato!',
  clessidraIngresso: '⌛ LA CLESSIDRA DELLA RIBALTA: tocca il piedistallo e ripulisci le ondate prima che finisca la sabbia. A sabbia finita il premio si riduce.',
  clessidraScaduta: '⌛ LA SABBIA È FINITA: il premio si sbriciola in pochi grani. Finisci le ondate per prenderli.',
  clessidraPieno: (nome, n) => `⌛ SFIDA VINTA PRIMA DELL'ULTIMO GRANELLO! Premio pieno: ${nome} e ${n}🪙 [Click/E]`,
  clessidraRidotto: (n) => `⌛ Sfida vinta, ma a sabbia finita: restano ${n}🪙.`,
  clessidraFinita: '⌛ SABBIA FINITA',
});

// ===========================================================================
// GRIGLIA, VARIANTI SPECCHIATE, REGOLE DURE
// ===========================================================================

const LATI_B7 = Object.freeze(['N', 'E', 'S', 'W']);
const TERRESTRI_B7 = new Set(STANZE_B7.nemiciTerrestri);

/** Durata in tick di un giro completo dei chiodi del palco. */
function periodoSpuntoniB7() {
  const S = STANZE_B7.spuntoni;
  return S.giuTick + S.avvisoTick + S.salitaTick + S.suTick + S.rientroTick;
}

/** Centro in px della cella (colonna, riga) della griglia delle disposizioni. */
function cellaB7(c, r) {
  const G = STANZE_B7.griglia;
  return {
    x: Math.round(ARENA.x1 + ((c + 0.5) * (ARENA.x2 - ARENA.x1)) / G.colonne),
    y: Math.round(ARENA.y1 + ((r + 0.5) * (ARENA.y2 - ARENA.y1)) / G.righe),
  };
}

let variantiCacheB7 = null;
/** Tutte le varianti (originale e specchiate, senza doppioni) delle disposizioni: { id, disp, righe }. */
function variantiB7() {
  if (variantiCacheB7) return variantiCacheB7;
  const out = [];
  for (const d of DISPOSIZIONI_B7) {
    const viste = new Set();
    const specchi = [[false, false]];
    if (d.specchi.includes('x')) specchi.push([true, false]);
    if (d.specchi.includes('y')) specchi.push([false, true]);
    if (d.specchi === 'xy') specchi.push([true, true]);
    for (const [sx, sy] of specchi) {
      let righe = d.g.map((riga) => (sx ? [...riga].reverse().join('') : riga));
      if (sy) righe = righe.slice().reverse();
      const chiave = righe.join('|');
      if (viste.has(chiave)) continue;
      viste.add(chiave);
      out.push(Object.freeze({ id: d.id + (sx ? '~x' : '') + (sy ? '~y' : ''), disp: d, righe: Object.freeze(righe) }));
    }
  }
  variantiCacheB7 = Object.freeze(out);
  return variantiCacheB7;
}

/**
 * Traduce una variante in oggetti di gioco per il quartiere dato: ostacoli (stessi campi di quelli di base),
 * elementi a filo del palco, punti di comparsa e premi dell'alcova. Non tocca nessuna stanza.
 */
function elementiVarianteB7(v, quartiere) {
  const F = STANZE_B7, G = F.griglia;
  const el = { ostacoli: [], suolo: [], comparse: [], premi: [], errori: [] };
  if (v.righe.length !== G.righe) el.errori.push(`${v.righe.length} righe invece di ${G.righe}`);
  v.righe.forEach((riga, r) => {
    if (riga.length !== G.colonne) el.errori.push(`riga ${r} lunga ${riga.length}`);
    [...riga].forEach((ch, c) => {
      const E = ELEMENTI_B7[ch];
      if (E === undefined) { el.errori.push(`carattere «${ch}» sconosciuto in ${c},${r}`); return; }
      if (!E) return;
      const p = cellaB7(c, r);
      if (E.dove === 'comparsa') { el.comparse.push(p); return; }
      if (E.dove === 'premio') { el.premi.push(p); return; }
      if (E.dove === 'suolo') {
        const o = { tipo: E.tipo, x: p.x, y: p.y };
        if (E.tipo === 'spuntoni') { o.r = F.spuntoni.raggio; o.sfasa = Math.round(E.sfasa * periodoSpuntoniB7()); }
        else if (E.tipo === 'pozza') { o.rx = F.pozza.rx; o.ry = F.pozza.ry; }
        else if (E.tipo === 'pedana') { o.r = F.pedana.raggio; o.premuta = false; }
        el.suolo.push(o);
        return;
      }
      const o = { tipo: E.tipo, x: p.x, y: p.y, r: E.r, acceso: Boolean(E.acceso), w: E.w, h: E.h, idB7: `${c}.${r}` };
      const variante = E.variante || (E.fragile === 'comune' ? F.fragili.pelle[quartiere] || F.fragili.pelle[1] : null);
      if (variante) o.variante = variante;
      if (E.fragile === 'polvere') o.fragileB7 = { genere: 'polvere', colpi: F.polvere.colpi, esplode: true };
      else if (E.fragile) o.fragileB7 = { genere: E.fragile, colpi: F.fragili.tipi[E.fragile].colpi, esplode: false };
      if (E.cancello) o.cancelloB7 = true;
      el.ostacoli.push(o);
    });
  });
  return el;
}

/**
 * Flood fill dell'arena a passi di STANZE_B7.passoFlood: il centro di Ferruccio non entra a meno di
 * o.r + raggioGiocatore da un ostacolo (la stessa regola della collisione di base).
 * @returns {{conta:number[], totale:number, di:(x:number,y:number)=>number}} di(x, y) = regione (>0) o -1 se occupato
 */
function regioniB7(solidi) {
  const p = STANZE_B7.passoFlood, R = STANZE_B7.raggioGiocatore;
  const nx = Math.floor((ARENA.x2 - ARENA.x1) / p) + 1, ny = Math.floor((ARENA.y2 - ARENA.y1) / p) + 1;
  const reg = new Int16Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = ARENA.x1 + i * p, y = ARENA.y1 + j * p;
      for (const o of solidi) if (Math.hypot(x - o.x, y - o.y) < o.r + R) { reg[j * nx + i] = -1; break; }
    }
  }
  const conta = [0];
  const pila = [];
  let k = 0;
  for (let s = 0; s < reg.length; s++) {
    if (reg[s] !== 0) continue;
    k++;
    let n = 0;
    reg[s] = k; pila.push(s);
    while (pila.length) {
      const a = pila.pop();
      n++;
      const i = a % nx, j = (a - i) / nx;
      if (i > 0 && reg[a - 1] === 0) { reg[a - 1] = k; pila.push(a - 1); }
      if (i < nx - 1 && reg[a + 1] === 0) { reg[a + 1] = k; pila.push(a + 1); }
      if (j > 0 && reg[a - nx] === 0) { reg[a - nx] = k; pila.push(a - nx); }
      if (j < ny - 1 && reg[a + nx] === 0) { reg[a + nx] = k; pila.push(a + nx); }
    }
    conta.push(n);
  }
  const di = (x, y) => {
    const i = Math.max(0, Math.min(nx - 1, Math.round((x - ARENA.x1) / p)));
    const j = Math.max(0, Math.min(ny - 1, Math.round((y - ARENA.y1) / p)));
    return reg[j * nx + i];
  };
  return { conta, totale: nx * ny, di };
}

const analisiB7 = new Map();
/**
 * Le regole dure su una variante, per tutte e 15 le combinazioni di porte (la crepa della segreta conta come
 * una porta): porte collegate a piedi, niente a ridosso delle entrate, spazio per muoversi, nessuna sacca
 * chiusa, comparse fuori dagli ostacoli e almeno comparseMin a distanzaPorte da ogni porta presente,
 * alcova chiusa dal cancello e pedana raggiungibile. Risultato in cache.
 * @returns {{id:string, ok:boolean, motivi:string[], quota:number, comparse:number, perMaschera:number[]}}
 */
function analizzaVarianteB7(v) {
  if (analisiB7.has(v.id)) return analisiB7.get(v.id);
  const F = STANZE_B7;
  const el = elementiVarianteB7(v, v.disp.q || 1);
  const motivi = el.errori.slice();
  const solidi = el.ostacoli;
  const chiusa = regioniB7(solidi);
  const aperta = regioniB7(solidi.filter((o) => !o.cancelloB7));
  const principale = chiusa.di(ENTRATE_C.N.x, ENTRATE_C.N.y);
  for (const l of LATI_B7) {
    const e = ENTRATE_C[l];
    if (principale <= 0 || chiusa.di(e.x, e.y) !== principale) motivi.push(`porta ${l} non raggiungibile dalle altre`);
    for (const o of solidi) if (Math.hypot(o.x - e.x, o.y - e.y) < F.liberoPorta) motivi.push(`ostacolo a ridosso della porta ${l}`);
    for (const o of el.suolo) {
      if (o.tipo === 'spuntoni' && Math.hypot(o.x - e.x, o.y - e.y) < F.liberoPorta) motivi.push(`chiodi a ridosso della porta ${l}`);
    }
  }
  const quota = principale > 0 ? chiusa.conta[principale] / chiusa.totale : 0;
  if (quota < F.spazioMinimo) motivi.push(`spazio percorribile solo ${(quota * 100).toFixed(0)}%`);
  const princAperta = aperta.di(ENTRATE_C.N.x, ENTRATE_C.N.y);
  let isolati = 0;
  for (let k = 1; k < aperta.conta.length; k++) if (k !== princAperta) isolati += aperta.conta[k];
  if (isolati > F.tolleranzaSacche) motivi.push(`sacca chiusa di ${isolati} nodi`);
  const cancelli = solidi.filter((o) => o.cancelloB7), pedane = el.suolo.filter((o) => o.tipo === 'pedana');
  if (cancelli.length || pedane.length || el.premi.length) {
    if (!cancelli.length || !pedane.length || !el.premi.length) motivi.push('cancello, pedana e premio vanno insieme');
    for (const q of pedane) if (chiusa.di(q.x, q.y) !== principale) motivi.push('pedana non raggiungibile a cancello chiuso');
    for (const q of el.premi) {
      if (chiusa.di(q.x, q.y) === principale) motivi.push('premio raggiungibile a cancello chiuso');
      if (aperta.di(q.x, q.y) !== princAperta) motivi.push('premio non raggiungibile a cancello aperto');
    }
  }
  const comparse = [];
  for (const q of el.comparse) {
    let male = null;
    if (chiusa.di(q.x, q.y) !== principale) male = 'fuori dalla zona percorribile';
    for (const o of solidi) if (Math.hypot(o.x - q.x, o.y - q.y) < o.r + F.margineComparsa) male = 'dentro un ostacolo';
    for (const o of el.suolo) if (o.tipo === 'spuntoni' && Math.hypot(o.x - q.x, o.y - q.y) < o.r + 4) male = 'sui chiodi';
    if (male) motivi.push(`comparsa ${q.x},${q.y} ${male}`); else comparse.push(q);
  }
  const perMaschera = [0];
  for (let m = 1; m < 16; m++) {
    const lati = LATI_B7.filter((_, i) => m & (1 << i));
    const valide = comparse.filter((q) => lati.every((l) => Math.hypot(q.x - PORTE_C[l].x, q.y - PORTE_C[l].y) >= STANZE_C.distanzaPorte));
    perMaschera.push(valide.length);
    if (valide.length < F.comparseMin) motivi.push(`porte ${lati.join('')}: solo ${valide.length} comparse valide`);
  }
  const ris = Object.freeze({ id: v.id, ok: motivi.length === 0, motivi, quota, comparse: comparse.length, perMaschera });
  analisiB7.set(v.id, ris);
  return ris;
}

/**
 * Verifica tutte le disposizioni × varianti × combinazioni di porte (per la QA e per chi tocca la tabella).
 * @returns {{disposizioni:number, varianti:number, combinazioni:number, violazioni:string[], righe:object[]}}
 */
function verificaDisposizioniB7() {
  const vv = variantiB7();
  const righe = vv.map(analizzaVarianteB7);
  const ids = new Set();
  const violazioni = righe.filter((r) => !r.ok).flatMap((r) => r.motivi.map((m) => `${r.id}: ${m}`));
  for (const d of DISPOSIZIONI_B7) { if (ids.has(d.id)) violazioni.push(`${d.id}: id doppio`); ids.add(d.id); }
  return { disposizioni: DISPOSIZIONI_B7.length, varianti: vv.length, combinazioni: vv.length * 15, violazioni, righe };
}

// ===========================================================================
// GENERAZIONE: disposizione, gruppo di nemici, comparse (avvolge generaMappaPiano)
// ===========================================================================

/** Estrazione pesata col rng del seme: voci[] e una funzione peso. null se non c'è nulla da estrarre. */
function estraiPesatoB7(voci, peso) {
  const tot = voci.reduce((a, x) => a + Math.max(0, peso(x)), 0);
  if (!voci.length || !(tot > 0)) return voci[0] || null;
  let r = rng() * tot;
  for (const x of voci) { r -= Math.max(0, peso(x)); if (r < 0) return x; }
  return voci[voci.length - 1];
}

const quartiereB7 = (piano) => ((Math.max(1, piano || 1) - 1) % 4) + 1;

/** Variante per una stanza di combattimento del piano: comuni + quelle del quartiere, solo se valide. */
function scegliVarianteB7(piano) {
  const q = quartiereB7(piano);
  const candidati = variantiB7().filter((v) => (v.disp.q === 0 || v.disp.q === q) && piano >= v.disp.pianoMin
    && analizzaVarianteB7(v).ok);
  const quante = new Map();
  for (const v of candidati) quante.set(v.disp.id, (quante.get(v.disp.id) || 0) + 1);
  return estraiPesatoB7(candidati, (v) => (v.disp.peso * (v.disp.q ? STANZE_B7.pesoQuartiere : 1)) / quante.get(v.disp.id));
}

/** Monta una variante in una stanza: ostacoli, suolo, comparse, fragili e premio dell'alcova. */
function applicaDisposizioneB7(s, v, piano) {
  const el = elementiVarianteB7(v, quartiereB7(piano));
  s.ostacoli = el.ostacoli;
  s.suoloB7 = el.suolo;
  s.comparseB7 = el.comparse;
  s.premiB7 = el.premi;
  s.fragiliB7 = el.ostacoli.filter((o) => o.fragileB7);
  s.disposizioneB7 = { id: v.disp.id, variante: v.id, nome: v.disp.nome };
  const A = STANZE_B7.alcova;
  for (const p of el.premi) {
    const n = A.moneteMin + Math.floor(rng() * (A.moneteMax - A.moneteMin + 1));
    for (let i = 0; i < n; i++) {
      s.oggettiATerra.push({ tipo: 'moneta', valore: 1, sprite: 'moneta1', x: p.x + (i - (n - 1) / 2) * 10, y: p.y + 3, alcovaB7: true });
    }
    if (rng() < A.probMezzaMaschera) s.oggettiATerra.push({ tipo: 'cura', valore: 1, sprite: 'mezzaMaschera', x: p.x, y: p.y - 6, alcovaB7: true });
  }
  return s;
}

/** Distanza in stanze dall'ingresso (porte aperte), per la curva di difficoltà. */
function profonditaStanzeB7(m) {
  const prof = new Map();
  const ing = m.stanze.find((s) => s.tipo === 'ingresso');
  if (!ing) return prof;
  prof.set(ing.id, 0);
  const coda = [ing];
  while (coda.length) {
    const a = coda.shift();
    for (const id of Object.values(a.porte || {})) {
      const b = m.perId.get(id);
      if (!b || prof.has(id)) continue;
      prof.set(id, prof.get(a.id) + 1);
      coda.push(b);
    }
  }
  return prof;
}

/** Gruppo di nemici per una stanza a `profondita` stanze dall'ingresso: a volte una stanza a tema. */
function scegliGruppoB7(piano, profondita, statoPiano) {
  const q = quartiereB7(piano), T = TEMI_RARI_B7;
  if (profondita >= T.profonditaMin && !(T.unaPerPiano && statoPiano.tema) && rng() < T.prob) {
    const temi = T[q] || [];
    if (temi.length) {
      statoPiano.tema = true;
      const t = temi[Math.floor(rng() * temi.length)];
      return { id: t.id, tema: t, tipi: t.tipi.slice() };
    }
  }
  const riga = CURVA_B7.find((c) => profondita <= c.finoA) || CURVA_B7[CURVA_B7.length - 1];
  const grado = Number(estraiPesatoB7(Object.keys(riga.pesi), (k) => riga.pesi[k]));
  const tutti = GRUPPI_B7[q] || GRUPPI_B7[1];
  const delGrado = tutti.filter((g) => g.diff === grado);
  const g = estraiPesatoB7(delGrado.length ? delGrado : tutti, (x) => x.peso);
  return { id: g.id, tema: null, diff: g.diff, tipi: g.tipi.slice() };
}

let gruppoRichiestoB7 = null;
/**
 * Aggancio in popolaStanza (30-mappa.js): se b7 ha chiesto un gruppo, sostituisce i tipi estratti dal tema
 * di base. Le statistiche, i campioni e la Vespa in più delle notti restano quelli di popolaStanza.
 * @param {object} s stanza @param {number} piano @param {string[]} tipi lista modificata sul posto
 */
function gruppoNemiciB7(s, piano, tipi) {
  if (!gruppoRichiestoB7 || !Array.isArray(tipi)) return;
  tipi.length = 0;
  for (const t of gruppoRichiestoB7) tipi.push(t);
  gruppoRichiestoB7 = null;
}

/** Nemici di tipi dati, creati da popolaStanza di base su una stanza d'appoggio (stessi campi e statistiche). */
function creaNemiciB7(s, piano, tipi) {
  const finta = { id: s.id, tipo: 'normale', porte: {}, muroSegreto: null, nemici: [], ostacoli: [], oggettiATerra: [] };
  gruppoRichiestoB7 = tipi.slice();
  try { popolaStanza(finta, piano); } finally { gruppoRichiestoB7 = null; }
  return finta.nemici;
}

/**
 * Punto più vicino a (x, y) che rispetta le regole dure: a distanzaPorte da ogni punto vietato, fuori dagli
 * ostacoli e dai chiodi, lontano dall'alcova chiusa e (se possibile) a distanzaNemici dagli altri.
 */
function puntoValidoB7(st, x, y, vietati, altri) {
  const F = STANZE_B7, D = STANZE_C.distanzaPorte;
  const solidi = st.ostacoli || [], suolo = st.suoloB7 || [], premi = st.premiB7 || [];
  const lontano = (px, py) => vietati.every((p) => Math.hypot(px - p.x, py - p.y) >= D);
  const libero = (px, py) => solidi.every((o) => Math.hypot(px - o.x, py - o.y) >= (o.r || 0) + F.margineComparsa)
    && suolo.every((o) => o.tipo !== 'spuntoni' || Math.hypot(px - o.x, py - o.y) >= o.r + 4)
    && premi.every((o) => Math.hypot(px - o.x, py - o.y) >= 48);
  const spazio = (px, py) => altri.every((o) => Math.hypot(px - o.x, py - o.y) >= F.distanzaNemici);
  if (lontano(x, y) && libero(x, y) && spazio(x, y)) return { x, y };
  for (const conSpazio of [true, false]) {
    let best = null, bd = Infinity;
    for (let gy = ARENA.y1 + 24; gy <= ARENA.y2 - 24; gy += 6) {
      for (let gx = ARENA.x1 + 24; gx <= ARENA.x2 - 24; gx += 6) {
        if (!lontano(gx, gy) || !libero(gx, gy) || (conSpazio && !spazio(gx, gy))) continue;
        const d = Math.hypot(gx - x, gy - y);
        if (d < bd) { bd = d; best = { x: gx, y: gy }; }
      }
    }
    if (best) return best;
  }
  return puntoLontanoDallePorteC(x, y, vietati, altri);
}

/** Rimette in regola i nemici vivi di una stanza disegnata a mano (porte, punti vietati in più, ostacoli). */
function sistemaNemiciB7(st, extra = []) {
  if (!st || !st.disposizioneB7) return 0;
  const vietati = [...porteVietateC(st), ...extra];
  const posti = [];
  let mossi = 0;
  for (const n of st.nemici || []) {
    if (n.hp <= 0) continue;
    const p = puntoValidoB7(st, n.x, n.y, vietati, posti);
    if (p.x !== n.x || p.y !== n.y) { n.x = p.x; n.y = p.y; mossi++; }
    posti.push(p);
  }
  return mossi;
}

/** Mette i nemici sui punti di comparsa della disposizione validi per le porte della stanza. */
function piazzaNemiciB7(s) {
  const vietati = porteVietateC(s), D = STANZE_C.distanzaPorte;
  const valide = shuffle((s.comparseB7 || []).filter((p) => vietati.every((v) => Math.hypot(p.x - v.x, p.y - v.y) >= D)));
  const vivi = (s.nemici || []).filter((n) => n.hp > 0);
  vivi.forEach((n, i) => {
    if (!valide.length) return;
    const p = valide[i % valide.length];
    const giro = Math.floor(i / valide.length);
    n.x = p.x + (giro ? (rng() - 0.5) * 60 : 0);
    n.y = p.y + (giro ? (rng() - 0.5) * 44 : 0);
  });
  sistemaNemiciB7(s);
}

/** Disposizione, gruppo e comparse di una stanza di combattimento. */
function arredaStanzaB7(s, piano, profondita, statoPiano) {
  const v = scegliVarianteB7(piano);
  if (!v) return;
  applicaDisposizioneB7(s, v, piano);
  s.profonditaB7 = profondita;
  // Prova dei gatti dell'autore (PLAYTEST_GATTI): accanto all'ingresso del piano 1 resta il Vicolo dei Gatti di base
  const vicoloGatti = PLAYTEST_GATTI.attivo && PLAYTEST_GATTI.vicoloAccantoIngresso && piano === 1
    && Object.values(s.porte || {}).includes('r0');
  if (vicoloGatti) {
    s.gruppoB7 = 'vicolo-dei-gatti';
  } else {
    const scelta = scegliGruppoB7(piano, profondita, statoPiano);
    const nuovi = creaNemiciB7(s, piano, scelta.tipi);
    if (nuovi.length) {
      s.nemici = nuovi;
      s.gruppoB7 = scelta.id;
      s.temaB7 = scelta.tema ? { id: scelta.tema.id, nome: scelta.tema.nome, avviso: scelta.tema.avviso, premiato: false } : null;
    }
  }
  piazzaNemiciB7(s);
}

/** Passata di b7 su una mappa appena generata: stanze di combattimento, Clessidra, ciarlatano. */
function arredaMappaB7(m, piano) {
  const prof = profonditaStanzeB7(m);
  const statoPiano = { tema: false };
  for (const s of m.stanze) {
    if (s.tipo === 'normale') arredaStanzaB7(s, piano, prof.get(s.id) || 1, statoPiano);
    else if (s.tipo === 'sfida' && s.sfidaA3) preparaClessidraB7(s);
    else if (s.tipo === 'bisca' && s.biscaA3) preparaCiarlatanoB7(s);
  }
  return m;
}

const generaMappaPianoBaseB7 = generaMappaPiano;
generaMappaPiano = function generaMappaPianoB7(piano, ...resto) {
  const m = generaMappaPianoBaseB7.call(this, piano, ...resto);
  if (m) { try { arredaMappaB7(m, piano); } catch (err) { console.error('[b7] mappa', err); } }
  return m;
};

// ===========================================================================
// ELEMENTI DI SCENA: logica (fragili, polvere, chiodi, pozzanghere, pedana)
// ===========================================================================

/** Suono breve procedurale sul contesto di AudioSys (rispetta il muto e il volume degli effetti). */
function suonoB7(freq, durMs, forma = 'triangle', vol = 0.08, freqFine = 0) {
  const c = AudioSys.ctx;
  if (!c || !AudioSys.attivo) return;
  try {
    const t = c.currentTime, d = durMs / 1000;
    const o = c.createOscillator(), g = c.createGain();
    o.type = forma;
    o.frequency.setValueAtTime(freq, t);
    if (freqFine > 0) o.frequency.exponentialRampToValueAtTime(freqFine, t + d);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + d);
    o.connect(g); g.connect(AudioSys.uscita || c.destination);
    o.start(t); o.stop(t + d + 0.02);
  } catch (_) { /* l'audio non deve mai fermare il gioco */ }
}

/** Monete a terra promesse (premi, non drop: niente filtro di rarità del piano 1). */
function moneteATerraB7(st, n, x, y) {
  for (let i = 0; i < n; i++) {
    st.oggettiATerra.push({
      tipo: 'moneta', valore: 1, sprite: 'moneta1',
      x: Math.max(ARENA.x1 + 20, Math.min(ARENA.x2 - 20, x + (i - (n - 1) / 2) * 14)),
      y: Math.max(ARENA.y1 + 20, Math.min(ARENA.y2 - 20, y + (i % 2) * 6)),
    });
  }
}

/**
 * Stato dei chiodi del palco al tick t: fase ('giu' | 'avviso' | 'su' | 'rientro'), alt 0..1 (quanto
 * sporgono) e pericolo (feriscono solo mentre salgono e stanno fuori). La resa disegna esattamente questo.
 */
function statoSpuntoniB7(o, t = tick) {
  const S = STANZE_B7.spuntoni, per = periodoSpuntoniB7();
  const f = (((t + (o.sfasa || 0)) % per) + per) % per;
  let a = S.giuTick;
  if (f < a) return { fase: 'giu', alt: 0, pericolo: false };
  if (f < a + S.avvisoTick) return { fase: 'avviso', alt: 0.22, pericolo: false };
  a += S.avvisoTick;
  if (f < a + S.salitaTick) return { fase: 'su', alt: 0.22 + 0.78 * ((f - a + 1) / S.salitaTick), pericolo: true };
  a += S.salitaTick;
  if (f < a + S.suTick) return { fase: 'su', alt: 1, pericolo: true };
  a += S.suTick;
  return { fase: 'rientro', alt: Math.max(0, 1 - (f - a + 1) / S.rientroTick), pericolo: false };
}

/** Un colpo su un fragile (proiettile o fendente): quando i colpi finiscono si rompe a fine tick. */
function colpisciFragileB7(st, o) {
  if (o.rottoB7 || o.finitoB7) return;
  o.fragileB7.colpi--;
  o.scossoB7 = 8;
  statoRun.effettiSplash.push({ x: o.x, y: o.y - 8, tick: 0 });
  if (o.fragileB7.colpi <= 0) o.rottoB7 = true; else AudioSys.playColpo();
}

const SCHEGGE_B7 = Object.freeze({ botte: '#3b2414', vaso: '#7c3a14', balla: '#ea8626', baule: '#4a2814', capodimonte: '#efe6d2', polvere: '#2b1a10' });

/** Il ragno arrabbiato del Vaso di Capodimonte: un nemico piccolo che già esiste, stordito un istante. */
function liberaRagnoB7(st, o, T) {
  st.ragniB7 = (st.ragniB7 || 0) + 1;
  const n = creaNemiciB7({ id: `${st.id}-ragno${st.ragniB7}` }, statoRun.piano, [T.ragno])[0];
  if (!n) return null;
  n.x = o.x; n.y = o.y;
  n.nome = 'Ragno arrabbiato';
  n.ragnoB7 = true;
  n.stunTicks = T.stordimentoRagnoTick;
  st.nemici.push(n);
  mostraBanner(TESTI_B7.ragno, 120);
  return n;
}

/** Scoppio di una cassa di polvere: nemici, Ferruccio, casse e fragili vicini, bracieri, muro segreto. */
function esplodiPolvereB7(st, o) {
  const P = STANZE_B7.polvere;
  scuoti(FEEL.scossa.bomba);
  congela(FEEL.hitstop.uccisioneMs);
  AudioSys.playEsplosione();
  statoRun.ondeEsplosione.push({ x: o.x, y: o.y, r: 6, maxR: P.raggio, color: '#fb923c' });
  if (!st.macchie) st.macchie = [];
  const rm = rngMacchia(Math.round(o.x) * 73856093 ^ Math.round(o.y) * 19349663);
  for (let k = 0; k < 8; k++) {
    st.macchie.push({ x: o.x + (rm() - 0.5) * 40, y: o.y + (rm() - 0.5) * 28, r: 3.5 + rm() * 4.5,
      col: rm() < 0.7 ? '#050302' : '#450a0a', tipo: 'bruciatura' });
  }
  const danno = P.dannoBase + (statoRun.piano - 1) * P.dannoPerPiano;
  for (const nem of st.nemici.slice()) {
    if (nem.hp <= 0 || (nem.airZ || 0) > 16) continue;
    const dx = nem.x - o.x, dy = nem.y - o.y, d = Math.hypot(dx, dy);
    if (d >= P.raggio + (nem.r || 0)) continue;
    const eraChiusa = (nem.patternMob || nem.tipo) === 'maschera' && !nem.maskOpen;
    if (eraChiusa) nem.maskOpen = true; // lo scoppio passa anche la maschera chiusa (come la bomba)
    danneggiaNemico(nem, danno, d > 0 ? dx / d : 0, d > 0 ? dy / d : 0);
    if (eraChiusa && nem.hp > 0) nem.maskOpen = false;
  }
  for (const f of st.fragiliB7 || []) {
    if (f === o || f.rottoB7 || f.finitoB7 || Math.hypot(f.x - o.x, f.y - o.y) >= P.raggioCatena) continue;
    if (f.fragileB7.esplode) f.micciaB7 = Math.min(f.micciaB7 || Infinity, P.ritardoCatenaTick);
    else f.rottoB7 = true;
  }
  for (const b of st.ostacoli) {
    if (b.tipo !== 'braciere' || !b.acceso || Math.hypot(b.x - o.x, b.y - o.y) >= P.raggio + b.r) continue;
    b.acceso = false;
    if (!st.pozzanghereFuoco) st.pozzanghereFuoco = [];
    st.pozzanghereFuoco.push({ x: b.x, y: b.y, r: 26, tick: 360 });
    statoRun.ondeEsplosione.push({ x: b.x, y: b.y, r: 6, maxR: 32, color: '#f97316' });
  }
  if (st.muroSegreto && !st.muroSegreto.aperto) {
    const pm = { N: [320, ARENA.y1], S: [320, ARENA.y2], W: [ARENA.x1, 188], E: [ARENA.x2, 188] }[st.muroSegreto.lato];
    if (pm && Math.hypot(o.x - pm[0], o.y - pm[1]) < STANZE_C.segreta.raggioEsplosione) apriMuroSegreto(st);
  }
  if (Math.hypot(player.x - o.x, player.y - o.y) < P.raggioGiocatore) {
    subisciColpoGiocatore(P.dannoGiocatoreHalf, TESTI_B7.polvere, o.x, o.y);
  }
}

/** Rompe un fragile: via dagli ostacoli, schegge, premio secondo la tabella del suo genere (o scoppio). */
function rompiFragileB7(st, o) {
  if (o.finitoB7) return null;
  o.finitoB7 = true; o.rottoB7 = true;
  const i = st.ostacoli.indexOf(o);
  if (i >= 0) st.ostacoli.splice(i, 1);
  const j = st.fragiliB7.indexOf(o);
  if (j >= 0) st.fragiliB7.splice(j, 1);
  if (o.fragileB7.esplode) { esplodiPolvereB7(st, o); return 'scoppio'; }
  if (!st.macchie) st.macchie = [];
  const rm = rngMacchia(Math.round(o.x) * 73856093 ^ Math.round(o.y) * 19349663);
  const col = SCHEGGE_B7[o.variante] || '#3b2414';
  for (let k = 0; k < 6; k++) {
    st.macchie.push({ x: o.x + (rm() - 0.5) * 30, y: o.y + (rm() - 0.5) * 18, r: 2 + rm() * 2.5, col, tipo: 'scheggia' });
  }
  statoRun.effettiSplash.push({ x: o.x, y: o.y - 8, tick: 0 });
  AudioSys.playColpo();
  if (o.variante === 'capodimonte' || o.variante === 'vaso') suonoB7(1900, 90, 'triangle', 0.07, 700);
  const T = STANZE_B7.fragili.tipi[o.fragileB7.genere];
  if (!T) return 'niente';
  const esito = estraiPesatoB7(Object.keys(T.premi), (k) => T.premi[k]);
  if (esito === 'moneta') spawnaMonetaATerra(st, o.x, o.y, 1);
  else if (esito === 'mezzaMaschera') st.oggettiATerra.push({ tipo: 'cura', valore: 1, sprite: 'mezzaMaschera', x: o.x, y: o.y });
  else if (esito === 'ragno') liberaRagnoB7(st, o, T);
  return esito;
}

/** Prima del passo di base: quali fragili saranno colpiti in questo tick da proiettili e fendente. */
function primaDelPassoB7(st) {
  const fr = st.fragiliB7;
  if (!fr || !fr.length) return;
  for (const p of statoRun.proiettili) {
    const nx = p.x + p.vx, ny = p.y + p.vy;
    for (const o of fr) {
      if (o.rottoB7 || p.ultimoB7 === o) continue;
      if (Math.hypot(nx - o.x, ny - o.y) < o.r + (p.r || 3)) { p.ultimoB7 = o; colpisciFragileB7(st, o); break; }
    }
  }
  if (player.swordAnimTick >= 0 && player.swordHitIds) {
    const fi = Math.floor(player.swordAnimTick / 3), Z = STANZE_B7.fendente;
    if (fi >= 1 && fi <= 4) {
      const hx = player.x + Math.cos(player.swordAngle) * Z.avanti;
      const hy = (player.y - 6) + Math.sin(player.swordAngle) * Z.avanti;
      for (const o of fr) {
        const k = `b7:${o.idB7}`;
        if (o.rottoB7 || player.swordHitIds.has(k)) continue;
        if (Math.hypot(hx - o.x, hy - o.y) <= Z.portata + o.r) { player.swordHitIds.add(k); colpisciFragileB7(st, o); }
      }
    }
  }
}

/** Dopo il passo di base: micce, fragili finiti (anche tolti da una bomba di a1), tremolio. */
function aggiornaFragiliB7(st) {
  for (const f of st.fragiliB7.slice()) {
    if (f.finitoB7) continue;
    if (f.scossoB7 > 0) f.scossoB7--;
    if (f.micciaB7 > 0 && --f.micciaB7 === 0) f.rottoB7 = true;
    if (f.rottoB7 || !st.ostacoli.includes(f)) rompiFragileB7(st, f);
  }
}

const scivolataB7 = { attiva: false, vx: 0, vy: 0, ux: 0, uy: 0 };

/** (x, y) sta su una pozzanghera della stanza? */
function sullaPozzaB7(st, x, y) {
  for (const o of st.suoloB7 || []) {
    if (o.tipo !== 'pozza') continue;
    const dx = (x - o.x) / o.rx, dy = (y - o.y) / o.ry;
    if (dx * dx + dy * dy < 1) return true;
  }
  return false;
}

/**
 * Tratto scivoloso: su una pozzanghera lo spostamento del tick (px, py → posizione attuale) diventa una
 * spinta che arriva poco per volta (STANZE_B7.pozza.presa) e l'abbrivio continua a tasti rilasciati.
 */
function scivolaB7(st, px, py) {
  const Z = STANZE_B7.pozza, S = scivolataB7;
  const dx = player.x - px, dy = player.y - py;
  const salto = Math.hypot(dx, dy) > Z.saltoMaxPx;
  if (salto || !sullaPozzaB7(st, px, py)) {
    // all'asciutto si ricorda solo l'ultimo passo: è la velocità con cui si entra nella pozzanghera
    S.attiva = false; S.vx = 0; S.vy = 0; S.ux = salto ? 0 : dx; S.uy = salto ? 0 : dy;
    return;
  }
  if (!S.attiva) { S.attiva = true; S.vx = S.ux; S.vy = S.uy; }
  S.vx += (dx - S.vx) * Z.presa; S.vy += (dy - S.vy) * Z.presa;
  if (Math.hypot(S.vx, S.vy) < 0.03) { S.vx = 0; S.vy = 0; }
  let nx = Math.max(ARENA.x1, Math.min(ARENA.x2, px + S.vx));
  let ny = Math.max(ARENA.y1, Math.min(ARENA.y2, py + S.vy));
  for (const o of st.ostacoli) {
    const d = Math.hypot(nx - o.x, ny - o.y), rMin = o.r + STANZE_B7.raggioGiocatore;
    if (d < rMin && d > 0.01) { nx = o.x + ((nx - o.x) / d) * rMin; ny = o.y + ((ny - o.y) / d) * rMin; S.vx *= 0.6; S.vy *= 0.6; }
  }
  player.x = nx; player.y = ny;
}

/** La pedana cede: i cancelli della stanza si abbassano (restano disegnati a filo del palco). */
function premiPedanaB7(st, o) {
  o.premuta = true;
  for (let i = st.ostacoli.length - 1; i >= 0; i--) {
    const c = st.ostacoli[i];
    if (!c.cancelloB7) continue;
    st.ostacoli.splice(i, 1);
    st.suoloB7.push({ tipo: 'cancelloAperto', x: c.x, y: c.y, daTick: tick });
  }
  AudioSys.playColpo();
  suonoB7(180, 260, 'sawtooth', 0.06, 70);
  scuoti(FEEL.scossa.colpo);
  mostraBanner(TESTI_B7.pedana, 160);
}

/** Chiodi che feriscono e pedane che cedono (un tick). */
function aggiornaSuoloB7(st) {
  const S = STANZE_B7.spuntoni;
  for (const o of st.suoloB7) {
    if (o.tipo === 'spuntoni') {
      if (player.invuln <= 0 && Math.hypot(player.x - o.x, player.y - o.y) < o.r + 4 && statoSpuntoniB7(o).pericolo) {
        subisciColpoGiocatore(S.dannoHalf, TESTI_B7.spuntoni, o.x, o.y);
      }
    } else if (o.tipo === 'pedana' && !o.premuta && Math.hypot(player.x - o.x, player.y - o.y) < o.r) {
      premiPedanaB7(st, o);
    }
  }
}

/** I nemici che camminano girano attorno agli ostacoli (cerchi, come Ferruccio). */
function urtiNemiciB7(st) {
  if (!STANZE_B7.nemiciUrtanoOstacoli || !st.ostacoli.length) return;
  const R = STANZE_B7.raggioUrtoNemico;
  for (const n of st.nemici) {
    if (n.hp <= 0 || n.boss || (n.airZ || 0) > 2 || !TERRESTRI_B7.has(n.patternMob || n.tipo)) continue;
    for (const o of st.ostacoli) {
      const d = Math.hypot(n.x - o.x, n.y - o.y), rMin = o.r + R;
      if (d < rMin && d > 0.01) { n.x = o.x + ((n.x - o.x) / d) * rMin; n.y = o.y + ((n.y - o.y) / d) * rMin; }
    }
  }
}

/** Oggetti a terra e forzieri finiti dentro un ostacolo: li sposta sul bordo, dove si raccolgono. */
function liberaOggettiB7(st) {
  for (const lista of [st.oggettiATerra, st.forzieriA1]) {
    for (const pk of lista || []) {
      if (pk.alcovaB7) continue;
      for (const o of st.ostacoli) {
        const d = Math.hypot(pk.x - o.x, pk.y - o.y), rMin = o.r + 12;
        if (d >= rMin) continue;
        const ux = d > 0.01 ? (pk.x - o.x) / d : 0, uy = d > 0.01 ? (pk.y - o.y) / d : -1;
        pk.x = o.x + ux * rMin; pk.y = o.y + uy * rMin;
      }
    }
  }
}

/** Ferruccio non attraversa un corpo di scena rotondo (clessidra, ciarlatano). */
function corpoSolidoB7(c) {
  const dx = player.x - c.x, dy = player.y - c.y, d = Math.hypot(dx, dy), rMin = c.raggioCorpo + STANZE_B7.raggioGiocatore;
  if (d < rMin && d > 0.01) { player.x = c.x + (dx / d) * rMin; player.y = c.y + (dy / d) * rMin; }
}

/** Premio della stanza a tema ripulita. */
function premiaTemaB7(st) {
  const P = TEMI_RARI_B7.premio;
  st.temaB7.premiato = true;
  moneteATerraB7(st, P.monete, 344, 172);
  if (rng() < P.probMezzaMaschera) st.oggettiATerra.push({ tipo: 'cura', valore: 1, sprite: 'mezzaMaschera', x: 296, y: 172 });
  mostraBanner(TEMI_RARI_B7.vinta, 190);
}

// ===========================================================================
// LE TRE SCATOLE DEL CIARLATANO
// ===========================================================================

/** Alla generazione: nella Bisca a volte c'è il ciarlatano. */
function preparaCiarlatanoB7(s) {
  s.ciarlatanoB7 = rng() < CIARLATANO_B7.probCiarlatano
    ? { partite: 0, vinte: 0, andato: false, aperto: false, salutato: false, oggettoVinto: false, partita: null, cursore: 1, cursorePosta: 1, voce: '' }
    : null;
  return s.ciarlatanoB7;
}

/**
 * Una mano nuova (stato puro, senza pagare né incassare: lo usano il gioco e la QA).
 * contenuti[scatola]: la 0 ha il premio, la 1 una bomba o niente, la 2 niente. ordine[posto] = scatola.
 * @param {string} postaId @param {() => number} [rnd] @param {() => object|null} [estraiForte] oggetto Forte in palio
 */
function nuovaManoB7(postaId, rnd = rng, estraiForte = null) {
  const C = CIARLATANO_B7;
  const P = C.poste.find((p) => p.id === postaId) || C.poste[0];
  const monete = P.moltiplica ? P.costoMonete * P.moltiplica : P.moneteVincita;
  const oggetto = rnd() < P.probOggettoForte && estraiForte ? estraiForte() : null;
  const contenuti = [
    oggetto ? { tipo: 'oggetto', oggetto } : { tipo: 'monete', n: monete },
    { tipo: rnd() < P.probBomba ? 'bomba' : 'niente' },
    { tipo: 'niente' },
  ];
  const ordine = [0, 1, 2];
  for (let i = 2; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = ordine[i]; ordine[i] = ordine[j]; ordine[j] = t; }
  return { posta: P, contenuti, ordine, fase: 'mostra', t: 0, scambiFatti: 0, scambio: null, attesa: 0, ultimaCoppia: -1,
    scelta: -1, esito: null, pagata: false, rnd };
}

const COPPIE_B7 = Object.freeze([[0, 1], [1, 2], [0, 2]]);

/** Il prossimo scambio della mano: una coppia di posti diversa dall'ultima, sempre più svelta. */
function prossimoScambioB7(G) {
  const C = CIARLATANO_B7;
  let k = Math.floor(G.rnd() * 3);
  if (k === G.ultimaCoppia) k = (k + 1 + Math.floor(G.rnd() * 2)) % 3;
  G.ultimaCoppia = k;
  const durata = Math.max(C.scambioMinTick, Math.round(G.posta.scambioTick * Math.pow(G.posta.accelera, G.scambiFatti)));
  G.scambio = { a: COPPIE_B7[k][0], b: COPPIE_B7[k][1], t: 0, durata, verso: G.rnd() < 0.5 ? 1 : -1 };
}

/** Un tick della mano: mostra → copri → mescola → scegli (attende) → rivela → esito → fine. */
function passoManoB7(G) {
  const C = CIARLATANO_B7;
  G.t++;
  if (G.fase === 'mostra') {
    if (G.t >= C.mostraTick) { G.fase = 'copri'; G.t = 0; }
  } else if (G.fase === 'copri') {
    if (G.t >= C.copriTick) { G.fase = 'mescola'; G.t = 0; G.attesa = C.pausaScambioTick; }
  } else if (G.fase === 'mescola') {
    if (G.attesa > 0) {
      if (--G.attesa === 0) prossimoScambioB7(G);
    } else if (G.scambio && ++G.scambio.t >= G.scambio.durata) {
      const S = G.scambio, tmp = G.ordine[S.a];
      G.ordine[S.a] = G.ordine[S.b]; G.ordine[S.b] = tmp;
      G.scambio = null;
      G.scambiFatti++;
      if (G.scambiFatti >= G.posta.scambi) { G.fase = 'scegli'; G.t = 0; } else G.attesa = C.pausaScambioTick;
    }
  } else if (G.fase === 'rivela') {
    if (G.t >= C.rivelaTick * 2) { G.fase = 'esito'; G.t = 0; }
  } else if (G.fase === 'esito') {
    if (G.t >= C.esitoTick) { G.fase = 'fine'; G.t = 0; }
  }
  return G.fase;
}

/**
 * Dove sta ogni scatola in questo tick, per posto: { posto, scatola, x, y, alzata 0..1 }. È l'unica fonte
 * delle posizioni: la usa il disegno e la usa la QA per «seguire con gli occhi» la scatola del premio.
 */
function posizioniScatoleB7(G) {
  const C = CIARLATANO_B7, P = C.pannello;
  const out = [0, 1, 2].map((i) => ({ posto: i, scatola: G.ordine[i], x: P.slotX[i], y: P.slotY, alzata: 0 }));
  if (G.fase === 'mostra') {
    const u = Math.min(1, G.t / 12);
    for (const o of out) o.alzata = u;
  } else if (G.fase === 'copri') {
    const u = 1 - Math.min(1, G.t / C.copriTick);
    for (const o of out) o.alzata = u;
  } else if (G.fase === 'mescola' && G.scambio) {
    const S = G.scambio, u = S.t / S.durata, e = u * u * (3 - 2 * u);
    const xa = P.slotX[S.a], xb = P.slotX[S.b];
    const arco = Math.sin(Math.PI * e) * C.arcoPx * Math.abs(S.b - S.a) * S.verso;
    out[S.a].x = xa + (xb - xa) * e; out[S.a].y = P.slotY - arco;
    out[S.b].x = xb + (xa - xb) * e; out[S.b].y = P.slotY + arco;
  } else if (G.fase === 'rivela' || G.fase === 'esito' || G.fase === 'fine') {
    for (const o of out) {
      const ritardo = o.posto === G.scelta ? 0 : C.rivelaTick;
      o.alzata = G.fase === 'rivela' ? Math.max(0, Math.min(1, (G.t - ritardo) / 12)) : 1;
    }
  }
  return out;
}

/** Il giocatore indica un posto: 'vinta' (premio), 'bomba' o 'vuota'. Solo nella fase 'scegli'. */
function scegliScatolaB7(G, posto) {
  if (!G || G.fase !== 'scegli' || !(posto >= 0 && posto <= 2)) return null;
  const c = G.contenuti[G.ordine[posto]];
  G.scelta = posto;
  G.esito = c.tipo === 'niente' ? 'vuota' : c.tipo === 'bomba' ? 'bomba' : 'vinta';
  G.fase = 'rivela'; G.t = 0;
  return G.esito;
}

/** Il pannello del ciarlatano aperto nella stanza corrente, o null. */
function pannelloCiarlatanoB7() {
  const st = statoRun.stanzaCorrente;
  if (statoRun.fase !== 'in_gioco' || statoRun.pausa || statoRun.siparioAttivo || statoRun.pannelloB || statoRun.scambioPendente) return null;
  return st && st.ciarlatanoB7 && st.ciarlatanoB7.aperto ? st.ciarlatanoB7 : null;
}

/** Apre il tavolino (tasto E vicino al ciarlatano). */
function apriCiarlatanoB7(st) {
  const T = st && st.ciarlatanoB7;
  if (!T || T.andato) return false;
  T.aperto = true; T.partita = null;
  T.voce = TESTI_B7.ciarlatanoInvito;
  player.targetX = null; player.targetY = null;
  return true;
}

function chiudiCiarlatanoB7(st) {
  const T = st && st.ciarlatanoB7;
  if (T && !T.partita) T.aperto = false;
}

/** La posta si può pagare adesso? */
function postaPossibileB7(P) {
  if (P.costoMonete > 0 && statoRun.monete < P.costoMonete) return false;
  if (P.costoHalf > 0 && statoRun.hpHalf <= P.costoHalf) return false;
  return true;
}

/** Paga la posta e comincia una mano. null se non si può. */
function puntaCiarlatanoB7(st, postaId) {
  const C = CIARLATANO_B7, T = st && st.ciarlatanoB7;
  const P = C.poste.find((p) => p.id === postaId);
  if (!T || T.andato || T.partita || !P) return null;
  if (P.costoMonete > 0 && statoRun.monete < P.costoMonete) { T.voce = TESTI_B7.ciarlatanoSenzaGrani; mostraBanner(TESTI_B7.ciarlatanoSenzaGrani, 120); return null; }
  if (P.costoHalf > 0 && statoRun.hpHalf <= P.costoHalf) { T.voce = TESTI_B7.ciarlatanoUltimaMaschera; mostraBanner(TESTI_B7.ciarlatanoUltimaMaschera, 140); return null; }
  statoRun.monete -= P.costoMonete;
  if (P.costoHalf > 0) { statoRun.hpHalf -= P.costoHalf; AudioSys.playDannoGiocatore(); } else AudioSys.playMoneta();
  T.partite++;
  T.cursore = 1;
  T.partita = nuovaManoB7(P.id, rng, () => estraiOggettoForte());
  T.voce = TESTI_B7.ciarlatanoGuarda;
  return T.partita;
}

/** La bomba accesa che spunta dalla scatola: quella di a1 se c'è (sua miccia a parte), altrimenti nostra. */
function accendiBombaB7(st) {
  const C = CIARLATANO_B7, B = C.bomba;
  const x = C.posto.x + B.distanzaPx, y = C.posto.y + 18;
  if (typeof BOMBE_CHIAVI_A1 !== 'undefined') {
    if (!statoRun.bombeA1) statoRun.bombeA1 = [];
    statoRun.bombeA1.push({ x, y, miccia: B.micciaTick, tot: B.micciaTick });
  } else {
    st.bombaB7 = { x, y, miccia: B.micciaTick };
  }
  suonoB7(900, 300, 'sawtooth', 0.05, 300);
}

/** Incassa (o subisce) l'esito della mano, una volta sola, quando le scatole sono alzate. */
function pagaManoB7(st, G) {
  const C = CIARLATANO_B7, T = st.ciarlatanoB7;
  if (G.pagata) return;
  G.pagata = true;
  const c = G.contenuti[G.ordine[G.scelta]];
  if (G.esito === 'vinta') {
    T.vinte++;
    if (c.tipo === 'oggetto' && c.oggetto && (!st.oggettoPiedistallo || st.oggettoPiedistallo.preso)) {
      st.oggettoPiedistallo = { ...c.oggetto, x: C.posto.x + 46, y: C.posto.y + 50, preso: false, forteGratis: c.oggetto.tier === 'forte' };
      T.oggettoVinto = true;
      mostraBanner(TESTI_B7.ciarlatanoOggetto(nomeD(c.oggetto)), 210);
    } else {
      const n = c.tipo === 'oggetto' ? C.ripiegoMonete : c.n;
      statoRun.monete = Math.min(99, statoRun.monete + n);
      mostraBanner(c.tipo === 'oggetto' ? TESTI_B7.ciarlatanoRipiego(n) : TESTI_B7.ciarlatanoMonete(n), 170);
    }
    AudioSys.playMoneta();
    T.voce = TESTI_B7.ciarlatanoVinta;
  } else if (G.esito === 'bomba') {
    T.voce = TESTI_B7.ciarlatanoBomba;
    accendiBombaB7(st);
    mostraBanner(TESTI_B7.ciarlatanoBombaBanner, 150);
    T.partita = null; T.aperto = false; // il tavolino si chiude: si scappa
    fineManoB7(st);
  } else {
    T.voce = TESTI_B7.ciarlatanoVuota;
    suonoB7(220, 240, 'triangle', 0.06, 110);
  }
}

/** Dopo una mano: il ciarlatano resta, o se ne va (troppe vincite, un oggetto vinto, troppe mani). */
function fineManoB7(st) {
  const C = CIARLATANO_B7, T = st.ciarlatanoB7;
  const troppaFortuna = T.vinte >= C.vinciteMax || (C.viaDopoOggetto && T.oggettoVinto);
  if (!troppaFortuna && T.partite < C.partiteMax) { if (T.aperto) T.voce = TESTI_B7.ciarlatanoInvito; return false; }
  T.andato = true; T.aperto = false; T.partita = null;
  mostraBanner(troppaFortuna ? TESTI_B7.ciarlatanoVia : TESTI_B7.ciarlatanoStanco, 200);
  return true;
}

/** Un tick del tavolino aperto. */
function passoCiarlatanoB7(st) {
  const T = st.ciarlatanoB7, G = T && T.partita;
  if (!G) return;
  const prima = G.fase;
  passoManoB7(G);
  if (G.fase === 'mescola' && G.scambio && G.scambio.t === 1) suonoB7(520, 60, 'triangle', 0.035, 260);
  if (prima !== G.fase) {
    if (G.fase === 'mescola') T.voce = TESTI_B7.ciarlatanoMescola;
    else if (G.fase === 'scegli') { T.voce = TESTI_B7.ciarlatanoScegli; suonoB7(660, 120, 'triangle', 0.06); }
    else if (G.fase === 'esito') pagaManoB7(st, G);
    else if (G.fase === 'fine') { T.partita = null; fineManoB7(st); }
  }
}

/** Il giocatore sceglie una scatola dal tavolino. */
function scegliCiarlatanoB7(st, posto) {
  const T = st && st.ciarlatanoB7;
  if (!T || !T.partita) return null;
  const e = scegliScatolaB7(T.partita, posto);
  if (e) { T.cursore = posto; AudioSys.playColpo(); }
  return e;
}

/** Riga della posta i nel pannello (per disegno e click). */
function rettPostaB7(i) {
  const P = CIARLATANO_B7.pannello;
  return { x: P.x + 22, y: P.y + P.h - 62 + i * 15, w: P.w - 44, h: 14 };
}

/** Tasti del tavolino. true = tasto preso. */
function tastoCiarlatanoB7(st, code) {
  const C = CIARLATANO_B7, T = st.ciarlatanoB7, G = T.partita;
  const cifra = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[code];
  const conferma = code === 'Enter' || code === 'Space' || code === 'KeyE' || code === 'NumpadEnter';
  if (!G) {
    if (cifra !== undefined) { T.cursorePosta = cifra; puntaCiarlatanoB7(st, C.poste[cifra].id); }
    else if (code === 'ArrowUp' || code === 'KeyW') T.cursorePosta = (T.cursorePosta + C.poste.length - 1) % C.poste.length;
    else if (code === 'ArrowDown' || code === 'KeyS') T.cursorePosta = (T.cursorePosta + 1) % C.poste.length;
    else if (conferma) puntaCiarlatanoB7(st, C.poste[T.cursorePosta].id);
    else if (code === 'Escape' || code === 'KeyQ' || code === 'Backspace') chiudiCiarlatanoB7(st);
    return true;
  }
  if (G.fase === 'scegli') {
    if (cifra !== undefined) scegliCiarlatanoB7(st, cifra);
    else if (code === 'ArrowLeft' || code === 'KeyA') T.cursore = Math.max(0, T.cursore - 1);
    else if (code === 'ArrowRight' || code === 'KeyD') T.cursore = Math.min(2, T.cursore + 1);
    else if (conferma) scegliCiarlatanoB7(st, T.cursore);
  }
  return true;
}

/** Click sul tavolino (coordinate 640×360). */
function clickCiarlatanoB7(st, mx, my) {
  const C = CIARLATANO_B7, P = C.pannello, T = st.ciarlatanoB7, G = T.partita;
  if (!G) {
    for (let i = 0; i < C.poste.length; i++) {
      const r = rettPostaB7(i);
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) { T.cursorePosta = i; puntaCiarlatanoB7(st, C.poste[i].id); return; }
    }
    if (mx < P.x || mx > P.x + P.w || my < P.y || my > P.y + P.h) chiudiCiarlatanoB7(st);
    return;
  }
  if (G.fase !== 'scegli') return;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(mx - P.slotX[i]) <= P.scatolaL / 2 + 8 && my >= P.slotY - P.scatolaA - 10 && my <= P.slotY + 10) { scegliCiarlatanoB7(st, i); return; }
  }
}

// tasti e click del tavolino: in cattura, prima dei gestori di base (che così non muovono né attaccano)
window.addEventListener('keydown', (e) => {
  const T = pannelloCiarlatanoB7();
  if (!T || e.ctrlKey || e.metaKey || e.altKey || /^F\d+$/.test(e.code)) return;
  if (e.code === 'Escape' && T.partita) return; // durante la mano Esc resta il menu di pausa
  tastoCiarlatanoB7(statoRun.stanzaCorrente, e.code);
  e.preventDefault(); e.stopImmediatePropagation();
}, true);

window.addEventListener('mousedown', (e) => {
  const T = pannelloCiarlatanoB7();
  if (!T || e.target !== canvas) return;
  const r = canvas.getBoundingClientRect();
  clickCiarlatanoB7(statoRun.stanzaCorrente, (e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height));
  e.preventDefault(); e.stopImmediatePropagation();
}, true);

// ===========================================================================
// LA CLESSIDRA DELLA RIBALTA
// ===========================================================================

/** Alla generazione: a volte la Sfida è a tempo. */
function preparaClessidraB7(s) {
  const C = CLESSIDRA_B7, S = s.sfidaA3;
  if (!S || !(rng() < C.probVariante)) return null;
  const tot = ticksDaMs((C.secondiBase + C.secondiPerOndata * S.ondateTot) * 1000);
  s.clessidraB7 = { totTick: tot, restoTick: tot, scaduta: false, chiusa: false, esito: null, premioPieno: S.premio };
  return s.clessidraB7;
}

/** La sabbia è finita: il premio del piedistallo si riduce a pochi grani (la Sfida continua). */
function scadeClessidraB7(st) {
  const C = CLESSIDRA_B7, K = st.clessidraB7, S = st.sfidaA3;
  if (!K || K.scaduta || K.chiusa) return;
  K.scaduta = true; K.restoTick = 0;
  S.premio = { id: 'b7-grani-della-clessidra', nome: `${C.moneteRidotto} grani`, sprite: 'moneta3', statsDesc: '', lore: '',
    x: K.premioPieno.x, y: K.premioPieno.y, preso: false, forteGratis: false, consolazioneB7: true };
  AudioSys.playCampana();
  suonoB7(196, 700, 'sawtooth', 0.07, 98);
  scuoti(FEEL.scossa.evento);
  mostraBanner(TESTI_B7.clessidraScaduta, 220);
}

/** Un tick di sabbia (solo a Sfida in corso) e il battito che incalza negli ultimi secondi. */
function passoClessidraB7(st) {
  const C = CLESSIDRA_B7, K = st.clessidraB7, S = st.sfidaA3;
  if (!K || !S || !S.attiva || K.scaduta || K.chiusa) return;
  K.restoTick--;
  if (K.restoTick <= 0) { scadeClessidraB7(st); return; }
  const sec = (K.restoTick * MS_PER_TICK) / 1000, B = C.battito;
  const ogni = sec <= B.finaleSecondi ? B.finaleTick : sec <= C.ultimiSecondi ? B.incalzaTick : B.normaleTick;
  if (K.restoTick % ogni === 0) {
    if (sec <= C.ultimiSecondi) suonoB7(sec <= B.finaleSecondi ? 1480 : 1180, 55, 'square', 0.075);
    else suonoB7(760, 40, 'triangle', 0.03);
  }
}

/** A Sfida finita: premio pieno (oggetto + monete) o ridotto (solo monete). */
function chiudiClessidraB7(st) {
  const C = CLESSIDRA_B7, K = st.clessidraB7;
  if (!K || K.chiusa) return;
  K.chiusa = true;
  if (K.scaduta) {
    if (st.oggettoPiedistallo && st.oggettoPiedistallo.consolazioneB7) st.oggettoPiedistallo = null;
    moneteATerraB7(st, C.moneteRidotto, K.premioPieno.x, K.premioPieno.y + 22);
    K.esito = 'ridotto';
    mostraBanner(TESTI_B7.clessidraRidotto(C.moneteRidotto), 200);
  } else {
    moneteATerraB7(st, C.monetePieno, K.premioPieno.x, K.premioPieno.y + 34);
    K.esito = 'pieno';
    suonoB7(880, 420, 'triangle', 0.07, 1760);
    mostraBanner(TESTI_B7.clessidraPieno(nomeD(K.premioPieno), C.monetePieno), 240);
  }
}

// ===========================================================================
// AVVOLGIMENTI DI LOGICA (chiamano sempre la base)
// ===========================================================================

/** Dopo l'ingresso in una stanza: nemici in regola rispetto agli ostacoli, avvisi. */
function dopoIngressoB7(st) {
  scivolataB7.attiva = false; scivolataB7.vx = 0; scivolataB7.vy = 0; scivolataB7.ux = 0; scivolataB7.uy = 0;
  if (st.ciarlatanoB7) { st.ciarlatanoB7.aperto = false; st.ciarlatanoB7.partita = null; }
  if (st.disposizioneB7 && !st.pulita) {
    sistemaNemiciB7(st, [{ x: player.x, y: player.y }]);
    if (st.temaB7) mostraBanner(st.temaB7.avviso, 230);
  }
  if (st.clessidraB7 && st.sfidaA3 && !st.sfidaA3.avviata) mostraBanner(TESTI_B7.clessidraIngresso, 250);
}

const entraInStanzaBaseB7 = entraInStanza;
entraInStanza = function entraInStanzaB7(stanza, daLato, ...resto) {
  const r = entraInStanzaBaseB7.call(this, stanza, daLato, ...resto);
  try { if (stanza && statoRun.stanzaCorrente === stanza) dopoIngressoB7(stanza); } catch (err) { console.error('[b7] ingresso', err); }
  return r;
};

const verificaStanzaPulitaBaseB7 = verificaStanzaPulita;
verificaStanzaPulita = function verificaStanzaPulitaB7(...args) {
  const st = statoRun.stanzaCorrente;
  const eraPulita = !st || st.pulita;
  const S = st ? st.sfidaA3 : null;
  const eraFinita = Boolean(S && S.finita);
  const r = verificaStanzaPulitaBaseB7.apply(this, args);
  try {
    if (st && !eraPulita && st.pulita) {
      if (st.temaB7 && !st.temaB7.premiato) premiaTemaB7(st);
      if (st.disposizioneB7) liberaOggettiB7(st);
    }
    if (S && !eraFinita && S.finita && st.clessidraB7) chiudiClessidraB7(st);
  } catch (err) { console.error('[b7] pulizia', err); }
  return r;
};

const interagisciStanzaBaseB7 = interagisciStanza;
interagisciStanza = function interagisciStanzaB7(...args) {
  const st = statoRun.stanzaCorrente, T = st && st.ciarlatanoB7;
  if (T && !T.andato && !T.aperto && statoRun.fase === 'in_gioco' && !statoRun.scambioPendente && !statoRun.pannelloB && !statoRun.siparioAttivo) {
    const P = CIARLATANO_B7.posto, o = st.oggettoPiedistallo;
    const piedistalloVicino = o && !o.preso && Math.hypot(player.x - o.x, player.y - o.y) < 52;
    if (!piedistalloVicino && Math.hypot(player.x - P.x, player.y - P.y) < P.raggioUso && apriCiarlatanoB7(st)) return undefined;
  }
  return interagisciStanzaBaseB7.apply(this, args);
};

/** Dopo il passo di base (un tick): tavolino, fragili, suolo, urti dei nemici, clessidra. */
function dopoIlPassoB7(st, px, py) {
  if (statoRun.stanzaCorrente !== st) { scivolataB7.attiva = false; return; }
  const T = st.ciarlatanoB7;
  if (T && T.aperto) {
    player.x = px; player.y = py; player.targetX = null; player.targetY = null; player.moving = false;
    passoCiarlatanoB7(st);
    return;
  }
  if (st.fragiliB7 && st.fragiliB7.length) aggiornaFragiliB7(st);
  if (st.suoloB7 && st.suoloB7.length) { scivolaB7(st, px, py); aggiornaSuoloB7(st); }
  if (st.disposizioneB7) urtiNemiciB7(st);
  if (st.clessidraB7) { passoClessidraB7(st); corpoSolidoB7(CLESSIDRA_B7.posto); }
  if (T && !T.andato) {
    const P = CIARLATANO_B7.posto;
    corpoSolidoB7(P);
    if (!T.salutato && Math.hypot(player.x - P.x, player.y - P.y) < P.raggioUso + 30) { T.salutato = true; mostraBanner(TESTI_B7.ciarlatanoSaluto, 210); }
  }
  if (st.bombaB7 && --st.bombaB7.miccia <= 0) { // solo senza a1
    const b = st.bombaB7, B = CIARLATANO_B7.bomba;
    st.bombaB7 = null;
    scuoti(FEEL.scossa.bomba); AudioSys.playEsplosione();
    statoRun.ondeEsplosione.push({ x: b.x, y: b.y, r: 6, maxR: B.raggio, color: '#fb923c' });
    if (Math.hypot(player.x - b.x, player.y - b.y) < B.raggio) subisciColpoGiocatore(B.dannoGiocatoreHalf, 'la bomba del ciarlatano', b.x, b.y);
  }
}

const passoLogicoBaseB7 = passoLogico;
passoLogico = function passoLogicoB7(...args) {
  const st = statoRun.stanzaCorrente;
  const attivo = Boolean(st) && statoRun.fase === 'in_gioco' && ticksCongelati <= 0
    && !(statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo || statoRun.pausa);
  const px = player.x, py = player.y;
  if (attivo) { try { primaDelPassoB7(st); } catch (err) { console.error('[b7] prima del passo', err); } }
  const r = passoLogicoBaseB7.apply(this, args);
  if (attivo && statoRun.fase === 'in_gioco') { try { dopoIlPassoB7(st, px, py); } catch (err) { console.error('[b7] dopo il passo', err); } }
  return r;
};

// ===========================================================================
// RESA (stile a ombre: sagome scure, contorno netto, pochi accenti caldi)
// ===========================================================================

/** Indicazioni scritte sul tavolino del ciarlatano (da approvare dall'autore). */
const GUIDA_CIARLATANO_B7 = Object.freeze({
  posta: '[1] [2] [3] o click per puntare · [Esc] lascia il tavolino · più alta la posta, più svelte le mani',
  mostra: "Guarda cosa c'è sotto ogni scatola.",
  mescola: 'Segui la scatola con gli occhi.',
  scegli: '[←] [→] e [Invio], oppure [1] [2] [3] o un click sulla scatola',
  vinta: 'HAI TROVATO IL PREMIO!',
  vuota: 'SCATOLA VUOTA',
  bomba: 'UNA BOMBA!',
});

const timbriB7 = new Map();
/** Sagoma statica disegnata una volta su un canvas fuori schermo alla risoluzione del buffer. */
function timbroB7(chiave, P) {
  const k = `${chiave}@${scalaBase}`;
  let c = timbriB7.get(k);
  if (c) return c;
  if (timbriB7.size > 96) timbriB7.clear();
  c = document.createElement('canvas');
  c.width = Math.ceil(P.l * scalaBase); c.height = Math.ceil(P.a * scalaBase);
  const g = c.getContext('2d');
  g.setTransform(scalaBase, 0, 0, scalaBase, P.ax * scalaBase, P.ay * scalaBase);
  P.disegna(g);
  timbriB7.set(k, c);
  return c;
}

function ombraB7(g, rx, ry, dy = 3) {
  g.fillStyle = 'rgba(8, 5, 3, 0.6)';
  g.beginPath(); g.ellipse(0, dy, rx, ry, 0, 0, TAU); g.fill();
}

function sagomaB7(g, punti, fill, stroke = '#050302', lw = 1.2) {
  g.beginPath();
  punti.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = fill; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}

function rettB7(g, x, y, w, h, fill, stroke = '#050302', lw = 1.2) {
  g.fillStyle = fill; g.fillRect(x, y, w, h);
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.strokeRect(x, y, w, h); }
}

/**
 * Le pelli degli ostacoli con `variante` (origine = centro della collisione, ai piedi dell'oggetto):
 * l × a del timbro, ancora (ax, ay) e disegno statico. Gli accenti vivi (luce, acqua, miccia) li aggiunge
 * disegnaOstacoloB7 a ogni frame.
 */
const PELLI_B7 = Object.freeze({
  lampione: { l: 44, a: 72, ax: 22, ay: 62, disegna(g) {
    ombraB7(g, 9, 3.5);
    rettB7(g, -5, -3, 10, 6, '#0d0907');
    rettB7(g, -1.8, -40, 3.6, 38, '#0d0907', null);
    rettB7(g, -3.5, -14, 7, 2, '#1c1410', null);
    sagomaB7(g, [[-4.5, -51], [4.5, -51], [6.5, -40], [-6.5, -40]], '#0d0907');
    sagomaB7(g, [[-3, -49.5], [3, -49.5], [4.6, -41.5], [-4.6, -41.5]], '#fbbf24', null);
    sagomaB7(g, [[-6.5, -51], [6.5, -51], [0, -57]], '#0d0907');
    rettB7(g, -0.8, -59.5, 1.6, 3, '#0d0907', null);
    g.fillStyle = '#fef3c7'; g.fillRect(-1, -47.5, 2, 4.5);
  } },
  aiuola: { l: 48, a: 36, ax: 24, ay: 24, disegna(g) {
    ombraB7(g, 19, 7, 2);
    g.fillStyle = '#1c1917'; g.strokeStyle = '#050302'; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(0, 0, 17, 8, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#10200d'; g.beginPath(); g.ellipse(0, -1, 14, 6, 0, 0, TAU); g.fill();
    g.fillStyle = '#1f3d17';
    for (const [x, y, h] of [[-10, 0, 7], [-6, 2, 9], [-2, -1, 8], [3, 2, 10], [7, 0, 8], [11, 1, 6], [0, 3, 7]]) {
      g.beginPath(); g.moveTo(x - 2.5, y); g.quadraticCurveTo(x - 1, y - h, x, y - h - 1); g.quadraticCurveTo(x + 1, y - h, x + 2.5, y); g.closePath(); g.fill();
    }
    for (const [x, y, c] of [[-6, -8, '#e53222'], [3, -9, '#f9cb40'], [9, -6, '#e53222'], [-1, -5, '#f9cb40']]) {
      g.fillStyle = c; g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill();
    }
  } },
  fontana: { l: 60, a: 62, ax: 30, ay: 46, disegna(g) {
    ombraB7(g, 23, 8, 5);
    g.strokeStyle = '#050302'; g.lineWidth = 1.2;
    g.fillStyle = '#262b33'; g.beginPath(); g.ellipse(0, 4, 21, 9, 0, 0, TAU); g.fill(); g.stroke();
    g.fillRect(-21, -1, 42, 5);
    g.fillStyle = '#3a414c'; g.beginPath(); g.ellipse(0, -1, 21, 9, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#12303f'; g.beginPath(); g.ellipse(0, -1, 17, 6.5, 0, 0, TAU); g.fill();
    rettB7(g, -2.5, -24, 5, 23, '#2b3038');
    g.fillStyle = '#94a3b8'; g.fillRect(-2.5, -24, 1.2, 23);
    g.fillStyle = '#3a414c'; g.strokeStyle = '#050302'; g.beginPath(); g.ellipse(0, -24, 9, 3.5, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#2b3038'; g.beginPath(); g.arc(0, -29, 2.6, 0, TAU); g.fill(); g.stroke();
  } },
  telaio: { l: 56, a: 64, ax: 28, ay: 52, disegna(g) {
    ombraB7(g, 21, 6, 4);
    rettB7(g, -18, -2, 36, 5, '#1a0f08');
    rettB7(g, -18, -42, 4, 41, '#1a0f08'); rettB7(g, 14, -42, 4, 41, '#1a0f08');
    rettB7(g, -20, -46, 40, 5, '#24150b');
    g.strokeStyle = 'rgba(249, 203, 64, 0.8)'; g.lineWidth = 0.6;
    for (let x = -12; x <= 12; x += 3) { g.beginPath(); g.moveTo(x, -41); g.lineTo(x, -15); g.stroke(); }
    rettB7(g, -15, -16, 30, 4, '#2b1a10');
    rettB7(g, -13, -11, 26, 8, '#9c4c12', null);
    g.fillStyle = '#ea8626'; g.fillRect(-13, -8, 26, 2);
    g.fillStyle = '#f9cb40'; g.fillRect(-13, -5, 26, 1);
  } },
  statua: { l: 40, a: 66, ax: 20, ay: 54, disegna(g) {
    ombraB7(g, 15, 5, 4);
    rettB7(g, -10, -10, 20, 13, '#2f343c');
    rettB7(g, -12, -13, 24, 4, '#3a414c');
    sagomaB7(g, [[-9, -13], [9, -13], [7, -27], [3, -30], [-3, -30], [-7, -27]], '#4b5360');
    rettB7(g, -2, -33, 4, 4, '#4b5360', null);
    g.fillStyle = '#4b5360'; g.strokeStyle = '#050302'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, -37, 5.5, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = '#aab3bf'; g.lineWidth = 1;
    g.beginPath(); g.arc(0, -37, 4.4, Math.PI * 0.9, Math.PI * 1.5); g.stroke();
    g.beginPath(); g.moveTo(-7.5, -26); g.lineTo(-8.3, -15); g.stroke();
    g.fillStyle = '#c9a23a'; g.fillRect(-12, -13, 24, 1.2);
  } },
  marmo: { l: 36, a: 76, ax: 18, ay: 64, disegna(g) {
    ombraB7(g, 14, 5, 4);
    rettB7(g, -11, -3, 22, 6, '#b9ae9b');
    rettB7(g, -8, -50, 16, 47, '#d8cfbf');
    g.fillStyle = '#a2988a'; g.fillRect(1, -49.4, 6.4, 45.8);
    g.strokeStyle = 'rgba(40, 32, 24, 0.55)'; g.lineWidth = 0.6;
    for (const x of [-5, -2, 1, 4]) { g.beginPath(); g.moveTo(x, -49); g.lineTo(x, -4); g.stroke(); }
    rettB7(g, -11, -56, 22, 6, '#c9a23a');
    g.fillStyle = '#f9cb40'; g.fillRect(-10.4, -55.4, 20.8, 1.5);
  } },
  botte: { l: 34, a: 42, ax: 17, ay: 32, disegna(g) {
    ombraB7(g, 12, 4.5);
    g.beginPath(); g.moveTo(-8, -22); g.lineTo(8, -22); g.quadraticCurveTo(13, -10, 8, 2); g.lineTo(-8, 2); g.quadraticCurveTo(-13, -10, -8, -22); g.closePath();
    g.fillStyle = '#3b2414'; g.fill(); g.strokeStyle = '#050302'; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = 'rgba(5, 3, 2, 0.5)'; g.lineWidth = 0.6;
    for (const x of [-4, 0, 4]) { g.beginPath(); g.moveTo(x, -20); g.lineTo(x, 1); g.stroke(); }
    g.strokeStyle = '#8a6a2a'; g.lineWidth = 1.5;
    for (const y of [-16, -4]) { g.beginPath(); g.moveTo(-10, y); g.quadraticCurveTo(0, y + 2, 10, y); g.stroke(); }
    g.fillStyle = '#4a2c17'; g.strokeStyle = '#050302'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, -22, 8, 2.8, 0, 0, TAU); g.fill(); g.stroke();
  } },
  vaso: { l: 34, a: 50, ax: 17, ay: 40, disegna(g) {
    ombraB7(g, 11, 4);
    g.fillStyle = '#16301a';
    for (const [dx, dy] of [[-10, -11], [-6, -17], [0, -20], [6, -17], [10, -11]]) {
      g.beginPath(); g.moveTo(-1.5, -14); g.quadraticCurveTo(dx * 0.4, -14 + dy * 0.7, dx, -14 + dy); g.quadraticCurveTo(dx * 0.8, -14 + dy * 0.4, 1.5, -14); g.closePath(); g.fill();
    }
    sagomaB7(g, [[-8, -12], [8, -12], [6, 2], [-6, 2]], '#7c3a14');
    rettB7(g, -9.5, -15, 19, 4, '#9c4c12');
    g.fillStyle = 'rgba(5, 3, 2, 0.3)'; g.fillRect(2, -11, 5, 12);
  } },
  balla: { l: 38, a: 38, ax: 19, ay: 28, disegna(g) {
    ombraB7(g, 14, 5);
    g.beginPath(); g.moveTo(-12, -14); g.quadraticCurveTo(-14, -18, -9, -18); g.lineTo(9, -18); g.quadraticCurveTo(14, -18, 12, -14);
    g.lineTo(13, 0); g.quadraticCurveTo(13, 3, 9, 3); g.lineTo(-9, 3); g.quadraticCurveTo(-13, 3, -13, 0); g.closePath();
    g.fillStyle = '#5a4326'; g.fill(); g.strokeStyle = '#050302'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = '#ea8626'; g.fillRect(-11.4, -13, 22.8, 3);
    g.fillStyle = '#f9cb40'; g.fillRect(-11.4, -10, 22.8, 1);
    g.strokeStyle = '#1a0f08'; g.lineWidth = 1.2;
    for (const x of [-5, 5]) { g.beginPath(); g.moveTo(x, -18); g.lineTo(x, 3); g.stroke(); }
  } },
  baule: { l: 38, a: 36, ax: 19, ay: 26, disegna(g) {
    ombraB7(g, 13, 4.5);
    rettB7(g, -11, -10, 22, 12, '#3b1f10');
    g.beginPath(); g.moveTo(-11, -10); g.quadraticCurveTo(-11, -18, 0, -18); g.quadraticCurveTo(11, -18, 11, -10); g.closePath();
    g.fillStyle = '#4a2814'; g.fill(); g.strokeStyle = '#050302'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = '#f9cb40'; g.fillRect(-11, -11, 22, 1.6); g.fillRect(-1.5, -17.4, 3, 19); g.fillRect(-2.5, -9, 5, 4);
  } },
  capodimonte: { l: 30, a: 46, ax: 15, ay: 36, disegna(g) {
    ombraB7(g, 9, 3.5);
    g.beginPath(); g.moveTo(-3, -26); g.lineTo(3, -26); g.quadraticCurveTo(2, -21, 6, -17); g.quadraticCurveTo(11, -9, 5, 0);
    g.lineTo(4, 2); g.lineTo(-4, 2); g.lineTo(-5, 0); g.quadraticCurveTo(-11, -9, -6, -17); g.quadraticCurveTo(-2, -21, -3, -26); g.closePath();
    g.fillStyle = '#efe6d2'; g.fill(); g.strokeStyle = '#050302'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = 'rgba(120, 104, 80, 0.45)';
    g.beginPath(); g.moveTo(3, -17); g.quadraticCurveTo(9, -9, 4, 0); g.lineTo(1, 0); g.quadraticCurveTo(5, -9, 1, -17); g.closePath(); g.fill();
    g.fillStyle = '#c9a23a'; g.fillRect(-4.5, -27.5, 9, 2); g.fillRect(-4.5, 0.5, 9, 1.5);
    g.strokeStyle = '#1d4ed8'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-6, -14); g.quadraticCurveTo(-1, -17, 5, -14); g.stroke();
    g.fillStyle = '#1d4ed8'; g.beginPath(); g.arc(-1, -8, 2.6, 0, TAU); g.fill();
    g.fillStyle = '#e53222'; g.beginPath(); g.arc(-1, -8, 1, 0, TAU); g.fill();
  } },
  polvere: { l: 36, a: 44, ax: 18, ay: 32, disegna(g) {
    ombraB7(g, 14, 5);
    rettB7(g, -11, -18, 22, 20, '#2b1a10');
    g.strokeStyle = 'rgba(5, 3, 2, 0.7)'; g.lineWidth = 0.8;
    for (const y of [-12, -5]) { g.beginPath(); g.moveTo(-11, y); g.lineTo(11, y); g.stroke(); }
    rettB7(g, -11, -18, 3, 20, '#3b2414', null); rettB7(g, 8, -18, 3, 20, '#3b2414', null);
    sagomaB7(g, [[0, -14], [5, -8], [0, -2], [-5, -8]], '#b91c1c', '#050302', 0.8);
    g.fillStyle = '#0a0604'; g.beginPath(); g.arc(0, -8, 1.8, 0, TAU); g.fill();
    g.strokeStyle = '#c9a679'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(4, -18); g.quadraticCurveTo(8, -22, 6, -26); g.stroke();
  } },
  cancello: { l: 44, a: 54, ax: 22, ay: 42, disegna(g) {
    ombraB7(g, 16, 4.5);
    rettB7(g, -15, -31, 4, 33, '#0d0907'); rettB7(g, 11, -31, 4, 33, '#0d0907');
    g.fillStyle = '#1c1917'; for (const x of [-9, -4, 1, 6]) g.fillRect(x, -27, 2.4, 28);
    g.fillStyle = '#f9cb40';
    for (const x of [-9, -4, 1, 6]) { g.beginPath(); g.moveTo(x - 0.8, -27); g.lineTo(x + 1.2, -32); g.lineTo(x + 3.2, -27); g.closePath(); g.fill(); }
    g.fillStyle = '#0d0907'; g.fillRect(-15, -23, 30, 2); g.fillRect(-15, -7, 30, 2);
    g.fillStyle = '#f9cb40'; g.fillRect(-16, -33, 6, 2); g.fillRect(10, -33, 6, 2);
  } },
});

/**
 * Aggancio nel ciclo degli ostacoli di disegnaFrame (60-resa.js): disegna gli ostacoli che hanno `variante`.
 * @returns {boolean} true se l'ha disegnato (la base salta il suo disegno), false se non lo conosce
 */
function disegnaOstacoloB7(o, t) {
  const P = PELLI_B7[o.variante];
  if (!P) return false;
  const c = timbroB7(o.variante, P);
  const dx = o.scossoB7 > 0 ? (o.scossoB7 % 2 ? 1 : -1) : 0;
  ctx.drawImage(c, Math.round(o.x) - P.ax + dx, Math.round(o.y) - P.ay, P.l, P.a);
  if (o.variante === 'lampione') {
    const a = 0.15 + 0.04 * Math.sin(t * 0.21 + o.x);
    ctx.fillStyle = `rgba(251, 191, 36, ${a.toFixed(2)})`;
    ctx.beginPath(); ctx.arc(o.x, o.y - 45, 16, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(o.x, o.y - 45, 8, 0, TAU); ctx.fill();
  } else if (o.variante === 'fontana') {
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.75)'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]); ctx.lineDashOffset = -t * 0.5;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(o.x, o.y - 31); ctx.quadraticCurveTo(o.x + s * 8, o.y - 31, o.x + s * 10, o.y - 3); ctx.stroke();
    }
    ctx.setLineDash([]);
    const f = (t * 0.02) % 1;
    ctx.strokeStyle = `rgba(186, 230, 253, ${(0.5 * (1 - f)).toFixed(2)})`;
    ctx.beginPath(); ctx.ellipse(o.x, o.y - 1, 5 + f * 11, 2 + f * 4, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  } else if (o.variante === 'polvere' && o.micciaB7 > 0) {
    ctx.fillStyle = t % 4 < 2 ? '#fef08a' : '#ef4444';
    ctx.beginPath(); ctx.arc(o.x + 6, o.y - 26, 2.4, 0, TAU); ctx.fill();
  }
  return true;
}

/** Ciò che sta a filo del palco: pozzanghere, chiodi, pedane, cancelli abbassati (sotto le entità). */
function disegnaSuoloB7(st, t) {
  const suolo = st.suoloB7;
  if (!suolo || !suolo.length) return;
  ctx.save();
  let pozze = 0;
  ctx.beginPath();
  for (const o of suolo) {
    if (o.tipo !== 'pozza') continue;
    ctx.moveTo(o.x + o.rx, o.y); ctx.ellipse(o.x, o.y, o.rx, o.ry, 0, 0, TAU);
    pozze++;
  }
  if (pozze) {
    ctx.fillStyle = 'rgba(6, 12, 24, 0.5)'; ctx.fill();
    ctx.fillStyle = getQuartierePiano(statoRun.piano).colorePozzanghera || 'rgba(56, 189, 248, 0.22)'; ctx.fill();
    ctx.lineWidth = 1;
    let i = 0;
    for (const o of suolo) {
      if (o.tipo !== 'pozza') continue;
      i++;
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.3)';
      ctx.beginPath(); ctx.ellipse(o.x - 5, o.y - 3, o.rx * 0.45, o.ry * 0.32, 0, Math.PI * 1.05, Math.PI * 1.75); ctx.stroke();
      const f = (t * 0.018 + i * 0.37) % 1;
      const gx = o.x + Math.sin(i * 12.9898) * o.rx * 0.5, gy = o.y + Math.cos(i * 78.233) * o.ry * 0.4;
      ctx.strokeStyle = `rgba(186, 230, 253, ${(0.55 * (1 - f)).toFixed(2)})`;
      ctx.beginPath(); ctx.ellipse(gx, gy, 2 + f * 9, (2 + f * 9) * 0.45, 0, 0, TAU); ctx.stroke();
    }
    if (scivolataB7.attiva && Math.hypot(scivolataB7.vx, scivolataB7.vy) > 0.5) {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
      ctx.beginPath(); ctx.ellipse(player.x, player.y + 6, 9, 3.5, 0, 0, TAU); ctx.stroke();
    }
  }
  for (const o of suolo) {
    if (o.tipo === 'spuntoni') {
      const s = statoSpuntoniB7(o, t);
      ctx.fillStyle = '#1a0f08'; ctx.fillRect(o.x - 14, o.y - 9, 28, 18);
      ctx.strokeStyle = '#6b4a1e'; ctx.lineWidth = 1; ctx.strokeRect(o.x - 13.5, o.y - 8.5, 27, 17);
      for (const r of [-4, 4]) {
        for (const c of [-8, 0, 8]) {
          const hx = o.x + c, hy = o.y + r;
          ctx.fillStyle = '#050302'; ctx.fillRect(hx - 1.5, hy - 1, 3, 2);
          if (s.alt <= 0) continue;
          const h = s.alt * 13, tr = s.fase === 'avviso' ? Math.sin(t * 1.3 + c + r) * 0.7 : 0;
          ctx.fillStyle = '#9ca3af'; ctx.fillRect(hx - 1 + tr, hy - h, 2, h);
          ctx.fillStyle = s.pericolo ? '#f9cb40' : '#e5e7eb'; ctx.fillRect(hx - 1 + tr, hy - h - 1, 2, 2);
        }
      }
    } else if (o.tipo === 'pedana') {
      ctx.fillStyle = '#050302'; ctx.fillRect(o.x - 13, o.y - 9, 26, 18);
      const giu = o.premuta ? 2 : 0;
      ctx.fillStyle = o.premuta ? '#3b2a12' : '#6b4a1e'; ctx.fillRect(o.x - 11, o.y - 8 + giu, 22, 15 - giu);
      ctx.strokeStyle = o.premuta ? '#5a3c1e' : `rgba(249, 203, 64, ${(0.6 + 0.3 * Math.sin(t * 0.1)).toFixed(2)})`;
      ctx.lineWidth = 1; ctx.strokeRect(o.x - 10.5, o.y - 7.5 + giu, 21, 14 - giu);
      ctx.fillStyle = o.premuta ? '#8a6a2a' : '#f9cb40';
      ctx.beginPath(); ctx.arc(o.x, o.y - 0.5 + giu, 2.5, 0, TAU); ctx.fill();
    } else if (o.tipo === 'cancelloAperto') {
      ctx.fillStyle = 'rgba(8, 5, 3, 0.6)'; ctx.beginPath(); ctx.ellipse(o.x, o.y + 3, 16, 4.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#0d0907'; ctx.fillRect(o.x - 15, o.y - 31, 4, 33); ctx.fillRect(o.x + 11, o.y - 31, 4, 33);
      ctx.fillStyle = '#050302'; ctx.fillRect(o.x - 10, o.y - 1, 20, 3);
      ctx.fillStyle = '#f9cb40';
      for (const x of [-9, -4, 1, 6]) { ctx.beginPath(); ctx.moveTo(o.x + x - 0.8, o.y); ctx.lineTo(o.x + x + 1.2, o.y - 4); ctx.lineTo(o.x + x + 3.2, o.y); ctx.closePath(); ctx.fill(); }
      ctx.fillRect(o.x - 16, o.y - 33, 6, 2); ctx.fillRect(o.x + 10, o.y - 33, 6, 2);
    }
  }
  ctx.restore();
}

/** La Clessidra della Ribalta in scena: grande, con la sabbia vera (restoTick / totTick) e i secondi. */
function disegnaClessidraB7(st, t) {
  const C = CLESSIDRA_B7, K = st.clessidraB7, S = st.sfidaA3;
  if (!K || !S) return;
  const x = C.posto.x, y = C.posto.y, k = C.scala;
  const f = Math.max(0, Math.min(1, K.restoTick / K.totTick));
  const sec = Math.ceil((K.restoTick * MS_PER_TICK) / 1000);
  const corre = S.attiva && !K.scaduta && !K.chiusa;
  const urgente = corre && sec <= C.ultimiSecondi;
  const lampo = urgente && Math.floor(t / (sec <= C.battito.finaleSecondi ? 6 : 12)) % 2 === 0;
  const vetro = () => {
    ctx.beginPath();
    ctx.moveTo(-12, -60); ctx.lineTo(12, -60); ctx.quadraticCurveTo(12, -44, 2, -33); ctx.lineTo(2, -31);
    ctx.quadraticCurveTo(12, -20, 12, -4); ctx.lineTo(-12, -4); ctx.quadraticCurveTo(-12, -20, -2, -31);
    ctx.lineTo(-2, -33); ctx.quadraticCurveTo(-12, -44, -12, -60); ctx.closePath();
  };
  ctx.save();
  ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(8, 5, 3, 0.6)'; ctx.beginPath(); ctx.ellipse(0, 5, 22, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0d0907'; ctx.fillRect(-17, -64, 3, 64); ctx.fillRect(14, -64, 3, 64);
  vetro(); ctx.fillStyle = 'rgba(12, 18, 28, 0.85)'; ctx.fill();
  ctx.save();
  vetro(); ctx.clip();
  ctx.fillStyle = K.scaduta ? '#7c2d12' : lampo ? '#ef4444' : '#f9cb40';
  const ySu = -33 - 26 * f;
  ctx.fillRect(-13, ySu, 26, -32.5 - ySu);
  const g = 1 - f;
  if (g > 0.001) {
    const yGiu = -4 - 23 * g;
    ctx.beginPath(); ctx.moveTo(-13, -4); ctx.lineTo(-13, yGiu + 7); ctx.quadraticCurveTo(0, yGiu - 5, 13, yGiu + 7); ctx.lineTo(13, -4); ctx.closePath(); ctx.fill();
  }
  if (corre) ctx.fillRect(-0.8 + Math.sin(t * 0.9) * 0.2, -33, 1.6, 29);
  ctx.restore();
  vetro(); ctx.strokeStyle = urgente ? 'rgba(254, 202, 202, 0.95)' : 'rgba(226, 232, 240, 0.75)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-8, -56); ctx.quadraticCurveTo(-9, -46, -4, -39); ctx.stroke();
  for (const yy of [-62, -2]) {
    ctx.fillStyle = '#24150b'; ctx.strokeStyle = '#050302'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, yy, 19, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c9a23a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, yy - 1, 17, 3.6, 0, Math.PI, TAU); ctx.stroke();
  }
  ctx.restore();
  const testo = K.scaduta ? TESTI_B7.clessidraFinita : `⌛ ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  drawPillLabel(testo, x, y - 70 * k - 6, 110, {
    size: urgente ? 10.5 : 9.5,
    color: K.scaduta ? '#fca5a5' : urgente ? (lampo ? '#ffffff' : '#fca5a5') : '#fde68a',
    border: K.scaduta || urgente ? '#dc2626' : '#c9a23a',
  });
}

/** Il ciarlatano d'ombra col tavolino pieghevole, nell'angolo della Bisca. */
function disegnaCiarlatanoB7(st, t) {
  const T = st.ciarlatanoB7;
  if (!T || T.andato) return;
  const P = CIARLATANO_B7.posto, x = P.x, y = P.y, osc = Math.sin(t * 0.045) * 1.1;
  ctx.save();
  ctx.fillStyle = 'rgba(8, 5, 3, 0.6)'; ctx.beginPath(); ctx.ellipse(x, y + 15, 22, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = `rgba(251, 191, 36, ${(0.13 + 0.04 * Math.sin(t * 0.3)).toFixed(2)})`;
  ctx.beginPath(); ctx.arc(x + 23, y - 6, 12, 0, TAU); ctx.fill();
  const alone = ctx.createRadialGradient(x, y - 14, 4, x, y - 14, 40);
  alone.addColorStop(0, 'rgba(251, 191, 36, 0.20)'); alone.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = alone; ctx.beginPath(); ctx.arc(x, y - 14, 40, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0d0810'; ctx.strokeStyle = 'rgba(201, 162, 58, 0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - 13, y + 6); ctx.quadraticCurveTo(x - 11, y - 14, x + osc, y - 18); ctx.quadraticCurveTo(x + 11, y - 14, x + 13, y + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + osc, y - 22, 5.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.rect(x + osc - 8, y - 28, 16, 2.2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + osc - 5, y - 28); ctx.lineTo(x + osc - 5.5, y - 39); ctx.lineTo(x + osc + 4, y - 41); ctx.lineTo(x + osc + 5, y - 28); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8f160c'; ctx.fillRect(x + osc - 5, y - 31, 10, 2);
  ctx.fillStyle = '#fbbf24'; ctx.fillRect(x + osc - 3.2, y - 23.5, 1.7, 1.7); ctx.fillRect(x + osc + 1.5, y - 23.5, 1.7, 1.7);
  ctx.strokeStyle = '#1a0f08'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x - 15, y + 7); ctx.lineTo(x + 12, y + 16); ctx.moveTo(x + 15, y + 7); ctx.lineTo(x - 12, y + 16); ctx.stroke();
  ctx.fillStyle = '#3b2414'; ctx.strokeStyle = '#050302'; ctx.lineWidth = 1.2;
  ctx.fillRect(x - 19, y + 2, 38, 5); ctx.strokeRect(x - 19, y + 2, 38, 5);
  ctx.fillStyle = '#14532d'; ctx.fillRect(x - 18, y + 1, 36, 2);
  for (let i = -1; i <= 1; i++) {
    const bx = x + i * 11;
    ctx.fillStyle = '#c9a679';
    ctx.beginPath(); ctx.moveTo(bx - 3, y - 6); ctx.lineTo(bx + 3, y - 6); ctx.lineTo(bx + 4.5, y + 1); ctx.lineTo(bx - 4.5, y + 1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#050302'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = '#8f160c'; ctx.fillRect(bx - 4, y - 2, 8, 1.2);
  }
  ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(x + 23, y - 6 + Math.sin(t * 0.3) * 0.6, 1.8, 0, TAU); ctx.fill();
  ctx.restore();
  if (!T.aperto) drawPillLabel('🎩 TRE SCATOLE [E]', x + 8, y - 50, 124, { size: 7.5, color: '#fde68a', border: '#c9a23a' });
}

/** Testo di una posta per il tavolino: costo e premio possibile. */
function descPostaB7(P) {
  const n = P.moltiplica ? P.costoMonete * P.moltiplica : P.moneteVincita;
  return `${P.nome} (${P.costoHalf ? '-½ ❤️' : `${P.costoMonete}🪙`}): vinci ${n}🪙${P.probOggettoForte > 0 ? ' o una reliquia Forte' : ''}`;
}

/** Ciò che sta sotto una scatola (si vede solo a scatola alzata). */
function disegnaContenutoB7(x, y, c, t) {
  if (c.tipo === 'monete') {
    drawPixelSprite(SPRITE_OGGETTI.moneta3 || SPRITE_OGGETTI.moneta1, x, y - 12, 2);
    drawTextFit(`${c.n}🪙`, x, y + 1, 44, { size: 8, color: '#fde68a' });
  } else if (c.tipo === 'oggetto') {
    drawPixelSprite(spriteD(c.oggetto), x, y - 13, 2);
    drawTextFit('★ FORTE', x, y + 1, 46, { size: 7, color: '#f9cb40' });
  } else if (c.tipo === 'bomba') {
    if (SPRITE_OGGETTI.bombaA1) drawPixelSprite(SPRITE_OGGETTI.bombaA1, x, y - 11, 2);
    else { ctx.fillStyle = '#0a0604'; ctx.beginPath(); ctx.arc(x, y - 9, 8, 0, TAU); ctx.fill(); }
    ctx.fillStyle = t % 6 < 3 ? '#fef08a' : '#ef4444';
    ctx.beginPath(); ctx.arc(x + 7, y - 22, 2, 0, TAU); ctx.fill();
  }
}

/** Una scatola di cartapesta (tutte uguali da chiuse), alzata di `alzata` 0..1 sopra il suo contenuto. */
function disegnaScatolaB7(x, yBase, alzata, contenuto, scelta, t) {
  const P = CIARLATANO_B7.pannello, L = P.scatolaL, A = P.scatolaA;
  ctx.fillStyle = 'rgba(5, 3, 2, 0.5)';
  ctx.beginPath(); ctx.ellipse(x, yBase + 2, L * 0.52 - alzata * 5, 5 - alzata * 1.5, 0, 0, TAU); ctx.fill();
  if (alzata > 0.12 && contenuto) disegnaContenutoB7(x, yBase - 2, contenuto, t);
  const yb = yBase - alzata * P.alzataPx, yt = yb - A;
  const corpo = () => { ctx.beginPath(); ctx.moveTo(x - L * 0.36, yt); ctx.lineTo(x + L * 0.36, yt); ctx.lineTo(x + L / 2, yb); ctx.lineTo(x - L / 2, yb); ctx.closePath(); };
  corpo(); ctx.fillStyle = '#c9a679'; ctx.fill();
  ctx.fillStyle = 'rgba(60, 38, 18, 0.42)';
  ctx.beginPath(); ctx.moveTo(x + L * 0.12, yt); ctx.lineTo(x + L * 0.36, yt); ctx.lineTo(x + L / 2, yb); ctx.lineTo(x + L * 0.18, yb); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(246, 231, 196, 0.5)'; ctx.lineWidth = 0.8;
  for (const k of [0.22, 0.48, 0.7]) {
    ctx.beginPath(); ctx.moveTo(x - L * (0.34 + 0.13 * k), yt + A * k); ctx.lineTo(x + L * (0.2 + 0.1 * k), yt + A * k + 2); ctx.stroke();
  }
  ctx.fillStyle = '#8f160c';
  ctx.beginPath(); ctx.moveTo(x - L * 0.47, yb - 10); ctx.lineTo(x + L * 0.47, yb - 10); ctx.lineTo(x + L * 0.49, yb - 4); ctx.lineTo(x - L * 0.49, yb - 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f9cb40';
  ctx.beginPath(); ctx.moveTo(x, yt + 8); ctx.lineTo(x + 6, yt + 17); ctx.lineTo(x, yt + 26); ctx.lineTo(x - 6, yt + 17); ctx.closePath(); ctx.fill();
  corpo(); ctx.strokeStyle = scelta ? '#f9cb40' : '#0a0604'; ctx.lineWidth = scelta ? 2.2 : 1.5; ctx.stroke();
}

/** Il tavolino del ciarlatano in primo piano (sopra l'HUD): scatole, poste, indicazioni. */
function disegnaPannelloCiarlatanoB7(t) {
  const T = pannelloCiarlatanoB7();
  if (!T) return;
  const C = CIARLATANO_B7, P = C.pannello, G = T.partita, cx = P.x + P.w / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(5, 3, 2, 0.62)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#140c08'; ctx.fillRect(P.x, P.y, P.w, P.h);
  ctx.strokeStyle = '#c9a23a'; ctx.lineWidth = 2; ctx.strokeRect(P.x + 1, P.y + 1, P.w - 2, P.h - 2);
  ctx.strokeStyle = '#5a3c1e'; ctx.lineWidth = 1; ctx.strokeRect(P.x + 5, P.y + 5, P.w - 10, P.h - 10);
  drawTextFit(TESTI_B7.titoloCiarlatano, cx, P.y + 19, P.w - 30, { size: 10.5, color: '#f9cb40', weight: 'bold' });
  drawTextFit(T.voce || '', cx, P.y + 33, P.w - 30, { size: 8.5, style: 'italic', weight: '', color: '#e6d2aa' });
  const pannoY = P.y + 42, pannoA = (G ? P.h - 62 : P.slotY + 12 - pannoY);
  ctx.fillStyle = '#0f2a1a'; ctx.fillRect(P.x + 16, pannoY, P.w - 32, pannoA);
  ctx.strokeStyle = '#14532d'; ctx.lineWidth = 1.5; ctx.strokeRect(P.x + 16.5, pannoY + 0.5, P.w - 33, pannoA - 1);
  if (!G) {
    for (let i = 0; i < 3; i++) disegnaScatolaB7(P.slotX[i], P.slotY, 0, null, false, t);
    C.poste.forEach((posta, i) => {
      const r = rettPostaB7(i), sel = T.cursorePosta === i, si = postaPossibileB7(posta);
      ctx.fillStyle = sel ? 'rgba(249, 203, 64, 0.16)' : 'rgba(255, 255, 255, 0.04)'; ctx.fillRect(r.x, r.y, r.w, r.h);
      if (sel) { ctx.strokeStyle = '#c9a23a'; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); }
      drawTextFit(`[${i + 1}] ${descPostaB7(posta)}`, cx, r.y + 10, r.w - 12, { size: 8, color: si ? '#fde68a' : '#6b7280' });
    });
    drawTextFit(GUIDA_CIARLATANO_B7.posta, cx, P.y + P.h - 9, P.w - 24, { size: 6.8, color: '#9ca3af', weight: '' });
  } else {
    const pos = posizioniScatoleB7(G).sort((a, b) => a.y - b.y);
    const scoperte = G.fase !== 'mescola' && G.fase !== 'scegli';
    for (const o of pos) {
      const scelta = (G.fase === 'scegli' && o.posto === T.cursore) || (G.scelta === o.posto && G.fase !== 'scegli');
      disegnaScatolaB7(o.x, o.y, o.alzata, scoperte ? G.contenuti[o.scatola] : null, scelta, t);
    }
    if (G.fase === 'scegli') {
      const ax = P.slotX[T.cursore], ay = P.slotY - P.scatolaA - 12 + Math.sin(t * 0.18) * 2;
      ctx.fillStyle = '#f9cb40';
      ctx.beginPath(); ctx.moveTo(ax - 6, ay - 7); ctx.lineTo(ax + 6, ay - 7); ctx.lineTo(ax, ay); ctx.closePath(); ctx.fill();
    }
    const finale = G.fase === 'esito' || (G.fase === 'rivela' && G.t > C.rivelaTick);
    const guida = finale ? GUIDA_CIARLATANO_B7[G.esito] : GUIDA_CIARLATANO_B7[G.fase === 'copri' ? 'mostra' : G.fase] || '';
    drawTextFit(guida, cx, P.y + P.h - 10, P.w - 24, finale
      ? { size: 10, weight: 'bold', color: G.esito === 'vinta' ? '#4ade80' : G.esito === 'bomba' ? '#f87171' : '#9ca3af' }
      : { size: 7.5, color: '#cbd5e1', weight: '' });
  }
  ctx.restore();
}

const disegnaStanzaPixelArtBaseB7 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function disegnaStanzaPixelArtB7(tickR, st, ...resto) {
  const r = disegnaStanzaPixelArtBaseB7.call(this, tickR, st, ...resto);
  if (!st) return r;
  try {
    disegnaSuoloB7(st, tickR);
    if (st.clessidraB7) disegnaClessidraB7(st, tickR);
    if (st.ciarlatanoB7) disegnaCiarlatanoB7(st, tickR);
  } catch (err) { console.error('[b7] resa stanza', err); }
  return r;
};

const disegnaHUDPixelArtBaseB7 = disegnaHUDPixelArt;
disegnaHUDPixelArt = function disegnaHUDPixelArtB7(st, ...resto) {
  const r = disegnaHUDPixelArtBaseB7.call(this, st, ...resto);
  try { disegnaPannelloCiarlatanoB7(tick); } catch (err) { console.error('[b7] tavolino', err); }
  return r;
};

// ===========================================================================
// SONDA QA (tools/qa-teatro-stanze-varianti.js)
// ===========================================================================

/**
 * (QA) Monta una variante nella stanza corrente con un gruppo di nemici dato (o nessuno) e rimette tutto in
 * regola. Serve agli screenshot e alle prove degli elementi di scena; non è usata dal gioco.
 */
function allestisciB7(idVariante, piano = statoRun.piano, tipi = null) {
  const st = statoRun.stanzaCorrente;
  const v = variantiB7().find((x) => x.id === idVariante);
  if (!st || !v) return null;
  st.oggettiATerra = []; st.pozzanghereFuoco = []; st.macchie = []; st.forzieriA1 = [];
  applicaDisposizioneB7(st, v, piano);
  st.nemici = tipi && tipi.length ? creaNemiciB7(st, piano, tipi).slice(0, tipi.length) : [];
  st.pulita = !st.nemici.length;
  piazzaNemiciB7(st);
  return st;
}

if (window.__teatro && window.__teatro.interni) {
  Object.assign(window.__teatro.interni, {
    STANZE_B7, ELEMENTI_B7, DISPOSIZIONI_B7, GRUPPI_B7, CURVA_B7, TEMI_RARI_B7, CIARLATANO_B7, CLESSIDRA_B7, TESTI_B7,
    PORTE_C, ENTRATE_C,
    variantiB7, elementiVarianteB7, analizzaVarianteB7, verificaDisposizioniB7, regioniB7, applicaDisposizioneB7,
    scegliVarianteB7, scegliGruppoB7, creaNemiciB7, piazzaNemiciB7, sistemaNemiciB7, allestisciB7,
    statoSpuntoniB7, periodoSpuntoniB7, rompiFragileB7, colpisciFragileB7, premiPedanaB7, sullaPozzaB7, scivolataB7,
    nuovaManoB7, passoManoB7, posizioniScatoleB7, scegliScatolaB7, preparaCiarlatanoB7, apriCiarlatanoB7,
    puntaCiarlatanoB7, scegliCiarlatanoB7, tastoCiarlatanoB7, pannelloCiarlatanoB7,
    preparaClessidraB7, scadeClessidraB7, passoClessidraB7,
    // versioni avvolte (lo stesso comportamento del gioco)
    passoLogico: (...a) => passoLogico(...a), entraInStanza: (...a) => entraInStanza(...a),
    interagisciStanza: (...a) => interagisciStanza(...a), verificaStanzaPulita: () => verificaStanzaPulita(),
    disegnaStanzaPixelArt: (...a) => disegnaStanzaPixelArt(...a),
  });
}
