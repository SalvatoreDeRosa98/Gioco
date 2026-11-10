/*
 * teatro/b4-trasformazioni.js — (squadra b4) TEMI degli oggetti, TRASFORMAZIONI SCENICHE e SINERGIE A COPPIE.
 *
 * 1. TEMI: ogni oggetto ha uno o due temi (denari, ombra, maschera, fili, sacro, fuoco, bestia, cibo).
 *    `temiDi(item)` legge prima `item.temi` (oggetti nuovi della squadra b5), poi la voce del catalogo,
 *    poi la tabella TEMI_OGGETTI_B4 qui sotto (tutti gli oggetti di CATALOGO_OGGETTI/PATTO/SEGRETO).
 * 2. TRASFORMAZIONI: con TRASFORMAZIONI_B4.soglia (3) oggetti DIVERSI dello stesso tema Ferruccio si
 *    trasforma: una volta per tema, resta per tutta la run (anche se un oggetto viene poi sostituito).
 *    Annuncio grande (cartiglio + suono + lampo + scossa), costume disegnato sopra/attorno al burattino,
 *    voce nel Diario (tasto T). Otto trasformazioni, una per tema, ognuna con un effetto diverso.
 * 3. SINERGIE: coppie di oggetti precisi (SINERGIE_B4) attive finché li hai entrambi; annunciate la prima
 *    volta nella run («SINERGIA: …») e registrate nel Diario (seconda pagina del tasto T).
 *
 * BILANCIO (tetti di OGGETTI_D.clamp e di ricalcolaStatistiche sempre rispettati):
 *   trasformazione        | effetto                                   | numeri                          | tetto
 *   Re di Denari          | monete perforanti che rimbalzano          | +2 rimbalzi, gittata ×1,35      | rimbalzi ≤ 3, gittata ≤ 320
 *   L'Ombra del Velo      | fili neri: ferisce chi è vicino           | 35% danno ogni 12 tick, 44 px   | solo in mischia (≈ +1,75 danni/s × danno)
 *   Pulcinella Traditore  | secondo colpo + critici con sberleffo     | eco al 50% dopo 5 tick; 15% ×2  | proiettili ≤ 48 (tetto di sparaProiettiliDirezione)
 *   Burattino senza Fili  | gomitoli + fili nemici recisi             | +2 gomitoli; 18% fermo 45 tick  | orbitali ≤ 3; mai sui boss
 *   Santo di Cera         | scudo a stanza + onda di luce se colpito  | onda 2,5× danno entro 80 px     | scudoStanza ≤ 1; al più 1 onda/s (i-frames)
 *   Mastro di Fucina      | bruciatura + colpo di maglio ogni 3°      | maglio 2,2× danno, scoppio 40 px| 1 solo maglio per attacco, proiettili ≤ 48
 *   Re dei Gatti          | due gatti randagi + passo svelto          | 2 gatti da 2,0 danno; +0,15 vel | famigli ≤ 4, velocità ≤ ×2
 *   Il Mangiamaccheroni   | vita e ristoro                            | +2 maschere, cura piena, +½ a stanza | maschere ≤ 12
 *
 * Script classico: avvolge funzioni globali (ricalcolaStatistiche, danneggiaNemico, eseguiAttacco4Direzioni,
 * rimbalzaD, subisciColpoGiocatore, verificaStanzaPulita, passoLogico, disegnaFerruccioPittorico,
 * disegnaHUDPixelArt, tastoDiarioD, clickDiarioD, disegnaDiarioD) chiamando SEMPRE la versione precedente.
 * Nessuna modifica ai file di base. Stato della run in statoRun.trasfB4 (si rifà da solo quando cambia
 * statoRun.numeroRun). Verifica: tools/qa-teatro-trasformazioni.js.
 */

// ===========================================================================
// TABELLE (tutti i numeri e i testi stanno qui)
// ===========================================================================

/** I temi: ordine dell'HUD, nome mostrato, colore dei pallini e icona 8×8 (lettere di PALETTE). */
const TEMI_B4 = Object.freeze({
  ordine: Object.freeze(['denari', 'ombra', 'maschera', 'fili', 'sacro', 'fuoco', 'bestia', 'cibo']),
  nomi: Object.freeze({ denari: 'Denari', ombra: 'Ombra', maschera: 'Maschera', fili: 'Fili', sacro: 'Sacro', fuoco: 'Fuoco', bestia: 'Bestia', cibo: 'Cibo' }),
  colori: Object.freeze({ denari: '#f9cb40', ombra: '#a78bfa', maschera: '#f3dfc1', fili: '#fbbf24', sacro: '#fde68a', fuoco: '#fb923c', bestia: '#94a3b8', cibo: '#ea8626' }),
  icone: Object.freeze({
    denari: ['..kkkk..', '.kyyyyk.', 'kywyyyok', 'kyyoyyok', 'kyyoyyok', 'kyyyyook', '.kyoook.', '..kkkk..'],
    ombra: ['..kkkk..', '.kppPPk.', 'kpPPkkk.', 'kpPk....', 'kpPk....', 'kpPPkkk.', '.kpPPPk.', '..kkkk..'],
    maschera: ['.kkkkkk.', 'kcccccck', 'ckkcckkc', 'kcccccck', 'kcrccrck', '.kcccck.', '..kcck..', '...kk...'],
    fili: ['...mm...', 'mmmmmmmm', '...mm...', '.y.mm.y.', '.y....y.', '.y....y.', '.y....y.', '.o....o.'],
    sacro: ['...yy...', '...yy...', '.yyyyyy.', '.yywwyy.', '...yy...', '...yy...', '...yy...', '...oo...'],
    fuoco: ['....r...', '...rr...', '..rro.r.', '.rrooorr', '.rooyoor', '.rooyyor', '..royyr.', '...rrr..'],
    bestia: ['G......G', 'GG....GG', 'GGGGGGGG', 'GyGGGGyG', 'GGGGGGGG', 'GGGrrGGG', '.GGGGGG.', '..GGGG..'],
    cibo: ['..kkkk..', '.kooook.', 'koommook', 'kom..mok', 'kom..mok', 'koommook', '.kooook.', '..kkkk..'],
  }),
});

/**
 * Temi degli oggetti esistenti (id → temi). Gli oggetti nuovi portano `temi` sull'oggetto (convenzione b5).
 * maschera = scena e commedia (maschere, sipario, camerino, piazza); fili = marionetta, cucito, giocattoli;
 * denari = reggia, oro, gioco; bestia = animali (e ciò che viene da loro).
 */
const TEMI_OGGETTI_B4 = Object.freeze({
  // --- catalogo dell'autore (13) ---
  spada: ['fuoco'], piombo: ['fuoco'], anello: ['ombra'], triplo: ['fili'], catena: ['fuoco'], venti: ['maschera'],
  chiodo: ['fuoco'], fuoco: ['fuoco'], doppia: ['fili'], mercurio: ['denari'], cuore: ['sacro'], stivali: ['fili'], mantice: ['fuoco'],
  // --- B (15) ---
  corno: ['sacro', 'bestia'], campana: ['sacro'], fiaccola: ['fuoco'], lanterna: ['ombra'], sole: ['denari'], nastro: ['maschera'],
  ago: ['fili'], castagna: ['cibo', 'bestia'], cornetto: ['sacro'], bottone: ['denari'], pettine: ['bestia'], pipa: ['maschera'],
  pagnotta: ['cibo'], chiave: ['maschera'], dado: ['denari'],
  // --- D (34) ---
  trottola: ['fili'], sfogliatella: ['cibo'], pastiera: ['cibo'], cucchiaio: ['denari', 'cibo'], astrolabio: ['denari'],
  gomma: ['fili'], piedigrotta: ['fuoco'], ragno: ['bestia', 'fili'], 'velo-madonna': ['sacro'], cuoio: ['maschera'],
  gomitolo: ['fili'], ostia: ['sacro'], pupo_tonino: ['fili'], pupa_agnese: ['fili'], gatto: ['bestia'], diavoletto: ['ombra'],
  pulcinellino: ['maschera'], campanello: ['denari'], tarallo: ['cibo'], 'carta-ventaglio': ['maschera'], 'cuore-sacro': ['sacro'],
  bombarda: ['fuoco'], 'occhio-vetro': ['maschera'], 'cappello-mago': ['maschera', 'denari'], sugna: ['cibo', 'bestia'],
  ranocchio: ['bestia'], latte: ['cibo'], corda: ['sacro'], zoccoli: ['bestia'], spillo: ['fili'], salasso: ['ombra'],
  nebbia: ['ombra'], lume: ['ombra'], benda: ['ombra'],
  // --- reliquie del Patto d'Ombra (8) ---
  patto_raggio: ['ombra', 'fuoco'], patto_coltello: ['ombra', 'fili'], patto_patto: ['ombra'], patto_marchio: ['ombra'],
  patto_abisso: ['ombra'], patto_collare: ['ombra', 'bestia'], patto_tunica: ['ombra', 'sacro'], patto_contratto: ['ombra', 'denari'],
  // --- stanze segrete (7) ---
  trascendenza: ['fili'], fungo_1up: ['sacro'], fegato_crudo: ['cibo'], chiave_scheletro: ['ombra'], barile_polvere: ['denari'],
  loto_nero: ['denari', 'ombra'], soldi_potere: ['denari'],
});

/** Numeri delle trasformazioni, dell'annuncio, dell'HUD e del Diario. Tick a 60 Hz, distanze in px logici. */
const TRASFORMAZIONI_B4 = Object.freeze({
  soglia: 3, // oggetti DIVERSI dello stesso tema (i doppioni non contano)
  denari: Object.freeze({ rimbalzi: 2, gittataMult: 1.35, tipoProiettile: 'moneta' }),
  ombra: Object.freeze({ raggioPx: 44, ogniTick: 12, frazioneDanno: 0.35, dannoMin: 1.0 }),
  maschera: Object.freeze({ ritardoEcoTick: 5, scalaEco: 0.5, probCritico: 0.15, moltCritico: 2.0, fumettoTick: 50 }),
  fili: Object.freeze({ orbitali: 2, probRecidi: 0.18, fermoTick: 45 }),
  sacro: Object.freeze({ scudoStanza: 1, raggioOndaPx: 80, moltOnda: 2.5, raggioProiettiliPx: 80 }),
  fuoco: Object.freeze({ ogniColpi: 3, moltMaglio: 2.2, raggioMaglio: 8, scoppioPx: 40, velocita: 3.6, gittataPx: 200 }),
  bestia: Object.freeze({ gatti: 2, famDmg: 2.0, speedUp: 0.15 }),
  cibo: Object.freeze({ bonusMaxHpHalf: 4, curaStanzaHalf: 1 }),
  annuncio: Object.freeze({ durataTick: 210, durataSinergiaTick: 150, apreTick: 12, chiudeTick: 20, lampoTick: 18,
    y: 58, larghezza: 372, altezza: 54, larghezzaSinergia: 340, altezzaSinergia: 32 }),
  hud: Object.freeze({ xDestra: 630, y: 104, cella: 14, altezza: 17, impulsoTick: 45 }),
  diario: Object.freeze({ tasto: 'KeyT', rigaTrasf: 32, rigaSin: 28, colonneSin: 2 }),
  effettiMax: 24, // tagli/scintille disegnati insieme
});

/** Nome, effetto e motto di ogni trasformazione (testi da approvare dall'autore). */
const TESTI_TRASFORMAZIONI_B4 = Object.freeze({
  denari: Object.freeze({ nome: 'Re di Denari', effetto: 'I colpi diventano monete d\'oro: trapassano i nemici e rimbalzano sui muri.',
    motto: 'Il re delle carte ha trovato la sua corona.' }),
  ombra: Object.freeze({ nome: 'L\'Ombra del Velo', effetto: 'Fili neri e taglienti ti avvolgono: feriscono chiunque si avvicini.',
    motto: 'Il Velo ti ha messo i suoi fili. Ora tagliano per te.' }),
  maschera: Object.freeze({ nome: 'Pulcinella Traditore', effetto: 'Ogni attacco colpisce due volte. Colpi critici con sberleffo.',
    motto: 'Ride sempre. Non è mai dalla parte di chi ride con lui.' }),
  fili: Object.freeze({ nome: 'Burattino senza Fili', effetto: 'Due gomitoli ti girano attorno; i tuoi colpi recidono i fili dei nemici e li lasciano fermi.',
    motto: 'Chi non ha fili sa dove tagliare quelli degli altri.' }),
  sacro: Object.freeze({ nome: 'Santo di Cera', effetto: 'Uno scudo a ogni stanza; chi ti colpisce è investito da un\'onda di luce.',
    motto: 'Ex voto di cera: si consuma al posto tuo.' }),
  fuoco: Object.freeze({ nome: 'Mastro di Fucina', effetto: 'Colpi roventi; ogni terzo attacco cala un colpo di maglio che esplode.',
    motto: 'Tre colpi sull\'incudine: il terzo è quello buono.' }),
  bestia: Object.freeze({ nome: 'Re dei Gatti', effetto: 'Due gatti randagi combattono per te e cammini più svelto.',
    motto: 'I tetti di Caserta hanno scelto il loro re.' }),
  cibo: Object.freeze({ nome: 'Il Mangiamaccheroni', effetto: '+2 Maschere massime, salute piena, e mezza Maschera a ogni stanza ripulita.',
    motto: 'A pancia piena il Velo fa meno paura.' }),
});

/** Sberleffi di Pulcinella Traditore a ogni colpo critico (fumetto, niente voce). Da approvare dall'autore. */
const SBERLEFFI_B4 = Object.freeze(['Tiè!', 'Marameo!', 'Uè uè!', 'Pigliate chesta!', 'Cucù!', 'Statte buono!', 'Ma va\'!', 'Prrr!', 'Ih, che paura!']);

/**
 * Sinergie a coppie: idA + idB → effetto. `eff` usa solo meccaniche che esistono già in 40-combattimento.js:
 *   piercing/burn/triplo (bool) · rimbalzi/orbitali (+n, con tetto) · oming/esplosiva (massimo) ·
 *   bloccoProb (+p, tetto 0,5) · dmgMult/cadenzaMult/projScale (×) · speedUp (+) ·
 *   famigli {ids, dmgMult, cadenzaMult, oming} · e i ganci: fuocoCorrePx (la bruciatura passa ai vicini
 *   quando un nemico in fiamme cade), catenaRaggioPx (secondo anello del fulmine), rimbalzoDmg (+% a
 *   rimbalzo), spinta (× spinta dei colpi), contrattacco (× danno del colpo che riparte a ogni parata),
 *   curaSuScudoHalf (mezze maschere quando lo scudo di stanza para), caricaExtra (tacche dell'attivo a stanza pulita).
 */
const SINERGIE_B4 = Object.freeze([
  { id: 'fucina-accesa', a: 'fuoco', b: 'mantice', nome: 'Fucina Accesa', desc: 'Quando un nemico in fiamme cade, il fuoco passa ai vicini.', eff: { fuocoCorrePx: 64 } },
  { id: 'argento-vivo', a: 'catena', b: 'mercurio', nome: 'Argento Vivo', desc: 'Il fulmine della catena salta molto più lontano.', eff: { catenaRaggioPx: 130 } },
  { id: 'carambola', a: 'gomma', b: 'anello', nome: 'Carambola Cremisi', desc: 'A ogni rimbalzo il colpo fa il 35% di danno in più.', eff: { rimbalzoDmg: 0.35 } },
  { id: 'sistema-mondo', a: 'astrolabio', b: 'gomitolo', nome: 'Sistema del Mondo', desc: 'Due gomitoli in più ti girano attorno.', eff: { orbitali: 2 } },
  { id: 'coppia-scena', a: 'pupo_tonino', b: 'pupa_agnese', nome: 'Coppia di Scena', desc: 'I due burattini tirano colpi a ricerca, più forti.', eff: { famigli: { ids: ['pupo_tonino', 'pupa_agnese'], dmgMult: 1.5, oming: true } } },
  { id: 'gatto-latte', a: 'gatto', b: 'latte', nome: 'Il Gatto e il Latte', desc: 'Il gatto di Vico Lungo, sazio, graffia il doppio.', eff: { famigli: { ids: ['gatto'], dmgMult: 2.0 } } },
  { id: 'palla-cannone', a: 'piombo', b: 'sole', nome: 'Palla di Cannone', desc: 'Colpi più grossi che spazzano via i nemici.', eff: { spinta: 3, projScale: 1.25 } },
  { id: 'rosa-venti', a: 'venti', b: 'triplo', nome: 'Rosa dei Venti', desc: 'Dodici colpi a ogni tiro, e la mano torna svelta.', eff: { cadenzaMult: 1.4 } },
  { id: 'botta-risposta', a: 'carta-ventaglio', b: 'cuoio', nome: 'Botta e Risposta', desc: 'Ogni colpo parato dalla maschera riparte contro il nemico più vicino.', eff: { contrattacco: 1.5 } },
  { id: 'grazia-ricevuta', a: 'velo-madonna', b: 'ostia', nome: 'Grazia Ricevuta', desc: 'Quando il Velo para un colpo, ritrovi mezza Maschera.', eff: { curaSuScudoHalf: 1 } },
  { id: 'nzogna-pepe', a: 'tarallo', b: 'sugna', nome: '\'Nzogna e Pepe', desc: 'La sugna non pesa più: passo svelto e colpi più duri.', eff: { speedUp: 0.25, dmgMult: 1.15 } },
  { id: 'ferri-mestiere', a: 'spada', b: 'chiodo', nome: 'Ferri del Mestiere', desc: 'A ogni fendente parte anche un chiodo che trapassa.', eff: { piercing: true } },
  { id: 'gioco-ombre', a: 'lanterna', b: 'doppia', nome: 'Gioco d\'Ombre', desc: 'Il doppio colpo diventa un ventaglio di tre.', eff: { triplo: true } },
  { id: 'diavolo-acquasanta', a: 'diavoletto', b: 'cuore-sacro', nome: 'Il Diavolo e l\'Acqua Santa', desc: 'Il Diavoletto, punto sul vivo, tira al doppio della fretta.', eff: { famigli: { ids: ['diavoletto'], cadenzaMult: 2.0 } } },
  { id: 'festa-piedigrotta', a: 'piedigrotta', b: 'fiaccola', nome: 'Festa di Piedigrotta', desc: 'I razzi scoppiano molto più larghi.', eff: { esplosiva: 60 } },
  { id: 'malocchio', a: 'corno', b: 'cornetto', nome: 'Contro il Malocchio', desc: 'Un colpo nemico su quattro ti scivola addosso.', eff: { bloccoProb: 0.25 } },
  { id: 'scampanata', a: 'campana', b: 'campanello', nome: 'Scampanata', desc: 'A stanza ripulita l\'oggetto attivo si ricarica di una tacca in più.', eff: { caricaExtra: 1 } },
  { id: 'ago-filo', a: 'ago', b: 'gomitolo', nome: 'Ago e Filo', desc: 'I colpi seguono il filo fino al nemico.', eff: { oming: 0.05 } },
].map((r) => Object.freeze({ ...r, eff: Object.freeze(r.eff) })));

/** Testi dell'interfaccia (da approvare dall'autore). */
const TESTI_B4 = Object.freeze({
  sopraTitolo: 'TRASFORMAZIONE',
  sinergia: 'SINERGIA',
  nuova: 'nuova nel Diario',
  diarioTrasf: 'TRASFORMAZIONI',
  diarioSin: 'SINERGIE',
  diarioIgnota: 'Raccogli 3 oggetti di questo tema nella stessa notte.',
  sinergiaIgnota: 'Due oggetti che vanno d\'accordo: trovali insieme.',
  piedeTrasf: 'T: sinergie · C: consumabili · Esc/O: torna al menu',
  piedeSin: 'T: oggetti · C: consumabili · Esc/O: torna al menu',
  suggerimento: 'T: trasformazioni',
  temi: 'Temi',
  attivaOra: 'attiva stanotte',
});

/** Suoni procedurali (Web Audio): [frequenza Hz, inizio s, durata s, volume, forma]. */
const SUONI_B4 = Object.freeze({
  trasformazione: [[98, 0, 0.9, 0.11, 'sine'], [392, 0, 0.14, 0.07, 'triangle'], [523.25, 0.12, 0.14, 0.07, 'triangle'],
    [659.25, 0.24, 0.14, 0.07, 'triangle'], [783.99, 0.36, 0.6, 0.08, 'triangle'], [1567.98, 0.36, 0.5, 0.03, 'sine']],
  sinergia: [[659.25, 0, 0.12, 0.06, 'sine'], [987.77, 0.1, 0.3, 0.06, 'sine']],
  maglio: [[196, 0, 0.09, 0.07, 'square'], [880, 0, 0.06, 0.04, 'triangle']],
  onda: [[1046.5, 0, 0.45, 0.06, 'sine'], [1568, 0.03, 0.4, 0.04, 'sine']],
  sberleffo: [[170, 0, 0.16, 0.05, 'sawtooth'], [120, 0.05, 0.14, 0.04, 'sawtooth']],
});

// Sprite dei colpi nuovi (stesso formato di SPRITE_PROIETTILI in 10-sprite.js)
SPRITE_PROIETTILI.moneta = ['..kkkk..', '.kyyyyk.', 'kywyyyok', 'kyyoyyok', 'kyyoyyok', 'kyyyyook', '.kyoook.', '..kkkk..'];
SPRITE_PROIETTILI.maglio = ['....kkkk....', '..kkrrrrkk..', '.krrooooRRk.', '.kroyyyyoRk.', 'kroyywwyyoRk', 'kroywwwwyoRk',
  'kroywwwwyoRk', 'kroyywwyyoRk', '.kroyyyyoRk.', '.kRrooooRRk.', '..kkRRRRkk..', '....kkkk....'];

// ===========================================================================
// TEMI E STATO
// ===========================================================================

/** Oggetto di uno qualunque dei cataloghi (oggetti, patto, segreto) per id; null se non c'è. */
function trovaOggettoB4(id) {
  return CATALOGO_OGGETTI.find((o) => o.id === id) || CATALOGO_PATTO.find((o) => o.id === id)
    || CATALOGO_SEGRETO.find((o) => o.id === id) || null;
}

/**
 * Temi di un oggetto (o di un id): prima `item.temi`, poi `temi` della voce di catalogo, poi TEMI_OGGETTI_B4.
 * @param {{id?: string, temi?: string[]}|string} item
 * @returns {readonly string[]} elenco (anche vuoto) dei temi
 */
function temiDi(item) {
  if (!item) return [];
  if (typeof item !== 'string' && Array.isArray(item.temi) && item.temi.length) return item.temi;
  const id = typeof item === 'string' ? item : item.id;
  const voce = trovaOggettoB4(id);
  if (voce && Array.isArray(voce.temi) && voce.temi.length) return voce.temi;
  return TEMI_OGGETTI_B4[id] || [];
}

/** Stato b4 della run corrente (si rifà quando comincia una run nuova). */
function statoB4() {
  let s = statoRun.trasfB4;
  if (!s || s.run !== statoRun.numeroRun) {
    s = statoRun.trasfB4 = {
      run: statoRun.numeroRun, attive: {}, ordine: [], conteggi: {}, impulsi: {}, sinergie: {}, annunciate: {}, eff: {},
      coda: [], annuncio: null, lampo: 0, colpiMaglio: 0, eco: null, fumetto: null, prossimoSberleffo: 0,
      gatti: [], tagli: [], critForzato: null,
    };
  }
  return s;
}

/** Stato b4 solo se c'è una run in corso sul palco (null nei menu, nell'hub, in morte). */
function statoInScenaB4() {
  return statoRun.fase === 'in_gioco' ? statoB4() : null;
}

/** Quanti oggetti DIVERSI per tema ha addosso il giocatore. */
function contaTemiB4() {
  const n = {};
  for (const t of TEMI_B4.ordine) n[t] = 0;
  const visti = new Set();
  for (const it of statoRun.oggettiEquipaggiati || []) {
    if (!it || visti.has(it.id)) continue;
    visti.add(it.id);
    for (const t of temiDi(it)) if (t in n) n[t]++;
  }
  return n;
}

const memoriaB4 = { trasformazioniB4: [], sinergieB4: [] };

/** Id già scoperti nello slot di salvataggio (flag `trasformazioniB4` / `sinergieB4`); senza T3, in memoria. */
function vistiB4(chiave) {
  const sv = window.__teatroT3 && window.__teatroT3.salvataggi;
  if (!sv) return memoriaB4[chiave];
  const v = sv.leggiFlag(chiave);
  return Array.isArray(v) ? v : [];
}

/** Segna `id` come scoperto. true se è la prima volta nello slot. */
function segnaVistoB4(chiave, id) {
  const lista = vistiB4(chiave);
  if (lista.includes(id)) return false;
  const nuova = lista.concat([id]);
  const sv = window.__teatroT3 && window.__teatroT3.salvataggi;
  if (sv) sv.impostaFlag(chiave, nuova); else memoriaB4[chiave] = nuova;
  return true;
}

// ===========================================================================
// SUONI
// ===========================================================================

/** Suona una voce di SUONI_B4 sull'uscita comune degli effetti (rispetta muto e volume). */
function suonoB4(nome) {
  try {
    if (!AudioSys.attivo) return;
    const ac = AudioSys.ctx;
    const uscita = AudioSys.uscita;
    if (!ac || !uscita || ac.state !== 'running') return;
    const t = ac.currentTime;
    for (const [freq, inizio, durata, vol, forma] of SUONI_B4[nome] || []) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = forma;
      osc.frequency.setValueAtTime(freq, t + inizio);
      if (nome === 'sberleffo') osc.frequency.exponentialRampToValueAtTime(freq * 0.55, t + inizio + durata);
      if (nome === 'maglio') osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + inizio + durata);
      g.gain.setValueAtTime(0.0001, t + inizio);
      g.gain.exponentialRampToValueAtTime(vol, t + inizio + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + inizio + durata);
      osc.connect(g);
      g.connect(uscita);
      osc.start(t + inizio);
      osc.stop(t + inizio + durata + 0.03);
    }
  } catch (_) { /* l'audio non deve mai fermare il gioco */ }
}

// ===========================================================================
// ATTIVAZIONE (dentro ricalcolaStatistiche)
// ===========================================================================

/** Accende la trasformazione del tema `t`: bonus una tantum, voce nel Diario, annuncio in coda. */
function attivaTrasformazioneB4(s, t) {
  const T = TRASFORMAZIONI_B4;
  s.attive[t] = true;
  s.ordine.push(t);
  if (t === 'cibo') {
    statoRun.baseMaxHpHalf = Math.min(24, statoRun.baseMaxHpHalf + T.cibo.bonusMaxHpHalf);
    statoRun.maxHpHalf = Math.max(2, Math.min(24, statoRun.maxHpHalf + T.cibo.bonusMaxHpHalf));
    statoRun.hpHalf = statoRun.maxHpHalf;
  }
  if (t === 'sacro') statoRun.scudoStanzaD = Math.max(statoRun.scudoStanzaD || 0, T.sacro.scudoStanza); // vale già in questa stanza
  const nuova = segnaVistoB4('trasformazioniB4', t);
  const X = TESTI_TRASFORMAZIONI_B4[t];
  s.coda.push({ tipo: 'trasformazione', tema: t, titolo: X.nome, sotto: X.effetto, nuova, t: 0, durata: T.annuncio.durataTick });
}

/** Sinergie attive adesso (funzione pura degli oggetti addosso): annuncia quelle appena accese. */
function aggiornaSinergieB4(s) {
  const ho = new Set();
  for (const it of statoRun.oggettiEquipaggiati || []) if (it) ho.add(it.id);
  const attive = {};
  for (const r of SINERGIE_B4) {
    if (!ho.has(r.a) || !ho.has(r.b)) continue;
    attive[r.id] = true;
    if (!s.annunciate[r.id]) {
      s.annunciate[r.id] = true;
      const nuova = segnaVistoB4('sinergieB4', r.id);
      if (statoRun.fase === 'in_gioco') {
        s.coda.push({ tipo: 'sinergia', sinergia: r, titolo: r.nome, sotto: r.desc, nuova, t: 0, durata: TRASFORMAZIONI_B4.annuncio.durataSinergiaTick });
      }
    }
  }
  s.sinergie = attive;
}

/** Applica a statoRun gli effetti di trasformazioni e sinergie attive (dopo il calcolo di base, con gli stessi tetti). */
function applicaEffettiB4(s) {
  const T = TRASFORMAZIONI_B4;
  const C = OGGETTI_D.clamp;
  const D = statoRun.statD;
  const eff = { fuocoCorrePx: 0, catenaRaggioPx: 0, rimbalzoDmg: 0, spinta: 1, contrattacco: 0, curaSuScudoHalf: 0, caricaExtra: 0 };
  let dmgMult = 1, cadenzaMult = 1, speedUp = 0, projScale = 1, nonBlocco = 1;

  // --- sinergie ---
  for (const r of SINERGIE_B4) {
    if (!s.sinergie[r.id]) continue;
    const e = r.eff;
    if (e.piercing) statoRun.piercing = true;
    if (e.burn) statoRun.burn = true;
    if (e.triplo) statoRun.triplo = true;
    if (e.rimbalzi) D.rimbalzi = Math.min(C.rimbalzi, D.rimbalzi + e.rimbalzi);
    if (e.orbitali) D.orbitali = Math.min(C.orbitali, D.orbitali + e.orbitali);
    if (e.oming) D.oming = Math.max(D.oming, e.oming);
    if (e.esplosiva) D.esplosiva = Math.max(D.esplosiva, e.esplosiva);
    if (e.bloccoProb) nonBlocco *= 1 - e.bloccoProb;
    if (e.dmgMult) dmgMult *= e.dmgMult;
    if (e.cadenzaMult) cadenzaMult *= e.cadenzaMult;
    if (e.speedUp) speedUp += e.speedUp;
    if (e.projScale) projScale *= e.projScale;
    if (e.fuocoCorrePx) eff.fuocoCorrePx = Math.max(eff.fuocoCorrePx, e.fuocoCorrePx);
    if (e.catenaRaggioPx) eff.catenaRaggioPx = Math.max(eff.catenaRaggioPx, e.catenaRaggioPx);
    if (e.rimbalzoDmg) eff.rimbalzoDmg += e.rimbalzoDmg;
    if (e.spinta) eff.spinta *= e.spinta;
    if (e.contrattacco) eff.contrattacco = Math.max(eff.contrattacco, e.contrattacco);
    if (e.curaSuScudoHalf) eff.curaSuScudoHalf += e.curaSuScudoHalf;
    if (e.caricaExtra) eff.caricaExtra += e.caricaExtra;
    if (e.famigli) {
      for (const f of statoRun.famigliD || []) {
        if (!e.famigli.ids.includes(f.id)) continue;
        if (e.famigli.dmgMult) f.dmg *= e.famigli.dmgMult;
        if (e.famigli.cadenzaMult) f.cadenza *= e.famigli.cadenzaMult;
        if (e.famigli.oming) f.oming = true;
      }
    }
  }

  // --- trasformazioni ---
  if (s.attive.denari) {
    statoRun.tipoProiettile = T.denari.tipoProiettile;
    statoRun.piercing = true;
    D.rimbalzi = Math.min(C.rimbalzi, D.rimbalzi + T.denari.rimbalzi);
    statoRun.range = Math.max(C.rangeMin, Math.min(320, Math.round(statoRun.range * T.denari.gittataMult)));
  }
  if (s.attive.fili) D.orbitali = Math.min(C.orbitali, D.orbitali + T.fili.orbitali);
  if (s.attive.sacro) D.scudoStanza = Math.min(C.scudoStanza, Math.max(D.scudoStanza, T.sacro.scudoStanza));
  if (s.attive.fuoco) statoRun.burn = true;
  if (s.attive.bestia) {
    speedUp += T.bestia.speedUp;
    while (s.gatti.length < T.bestia.gatti) {
      s.gatti.push({ id: 'gatto', tipo: 'contatto', dmg: T.bestia.famDmg, cadenza: 1, auto: false, oming: false, x: player.x, y: player.y, cd: 0, b4: true });
    }
    for (const g of s.gatti) {
      g.dmg = T.bestia.famDmg;
      if ((statoRun.famigliD || []).length < C.famigli) statoRun.famigliD.push(g);
    }
  }

  if (nonBlocco < 1) D.bloccoProb = Math.min(C.bloccoProb, 1 - (1 - D.bloccoProb) * nonBlocco);
  if (dmgMult !== 1) statoRun.dmg = Math.max(1.0, statoRun.dmg * dmgMult);
  if (cadenzaMult !== 1) {
    statoRun.colpiAlSec = Math.max(0.85, Math.min(7.5, statoRun.colpiAlSec * cadenzaMult));
    statoRun.cooldownMax = Math.max(7, Math.round(60 / statoRun.colpiAlSec));
  }
  if (speedUp) statoRun.speed = 2.0 * Math.max(0.7, Math.min(2.0, statoRun.speed / 2.0 + speedUp));
  if (projScale !== 1) statoRun.projScale = Math.min(2.2, statoRun.projScale * projScale);
  s.eff = eff;
}

/** Dopo ogni ricalcolo: conta i temi, accende trasformazioni e sinergie, riapplica gli effetti. */
function dopoRicalcoloB4() {
  const s = statoB4();
  const prima = s.conteggi;
  s.conteggi = contaTemiB4();
  for (const t of TEMI_B4.ordine) {
    if ((s.conteggi[t] || 0) > (prima[t] || 0)) s.impulsi[t] = tick;
    if (!s.attive[t] && s.conteggi[t] >= TRASFORMAZIONI_B4.soglia) attivaTrasformazioneB4(s, t);
  }
  aggiornaSinergieB4(s);
  applicaEffettiB4(s);
}

const ricalcolaBaseB4 = ricalcolaStatistiche;
ricalcolaStatistiche = function ricalcolaStatisticheB4(...args) {
  const r = ricalcolaBaseB4.apply(this, args);
  try { dopoRicalcoloB4(); } catch (err) { console.error('[b4] ricalcolo', err); }
  return r;
};

// ===========================================================================
// COMBATTIMENTO (ganci)
// ===========================================================================

/** Aggiunge un effetto breve sul palco (taglio dei fili neri, filo reciso, critico). */
function effettoB4(s, tipo, x, y) {
  s.tagli.push({ tipo, x, y, t0: tick });
  if (s.tagli.length > TRASFORMAZIONI_B4.effettiMax) s.tagli.shift();
}

/** Fumetto con lo sberleffo successivo e suono (colpo critico di Pulcinella Traditore). */
function sberleffoB4(s) {
  s.fumetto = { testo: SBERLEFFI_B4[s.prossimoSberleffo % SBERLEFFI_B4.length], t0: tick };
  s.prossimoSberleffo = (s.prossimoSberleffo + 1 + Math.floor(Math.random() * 2)) % SBERLEFFI_B4.length;
  suonoB4('sberleffo');
}

const danneggiaBaseB4 = danneggiaNemico;
danneggiaNemico = function danneggiaNemicoB4(nem, dmg, knockX, knockY, ...resto) {
  const s = statoInScenaB4();
  if (!s || !nem) return danneggiaBaseB4.call(this, nem, dmg, knockX, knockY, ...resto);
  const T = TRASFORMAZIONI_B4;
  const diretto = Math.hypot(knockX || 0, knockY || 0) > 0; // colpo, fendente, onda: non bruciatura né fili neri
  let critico = false;
  if (diretto && s.attive.maschera) {
    critico = s.critForzato === null ? Math.random() < T.maschera.probCritico : Boolean(s.critForzato);
    if (critico) dmg *= T.maschera.moltCritico;
  }
  if (diretto && s.eff.spinta > 1) { knockX *= s.eff.spinta; knockY *= s.eff.spinta; }
  const hpPrima = nem.hp;
  const bruciava = (nem.burnTicks || 0) > 0;
  const r = danneggiaBaseB4.call(this, nem, dmg, knockX, knockY, ...resto);
  if (!(nem.hp < hpPrima)) return r;
  const st = statoRun.stanzaCorrente;
  if (critico) { sberleffoB4(s); effettoB4(s, 'critico', nem.x, nem.y - 14); }
  // Burattino senza Fili: il colpo recide i fili d'oro del nemico, che resta fermo (mai i boss)
  if (diretto && s.attive.fili && nem.hp > 0 && !nem.boss && Math.random() < T.fili.probRecidi) {
    nem.stunTicks = Math.max(nem.stunTicks || 0, T.fili.fermoTick);
    effettoB4(s, 'reciso', nem.x, nem.y - 20);
  }
  // Argento Vivo: secondo anello del fulmine a catena (stesso danno e stessa resa del primo)
  if (statoRun.chain && s.eff.catenaRaggioPx > 72 && st) {
    for (const altro of st.nemici) {
      if (altro === nem || altro.hp <= 0) continue;
      const d = Math.hypot(altro.x - nem.x, altro.y - nem.y);
      if (d >= 72 && d < s.eff.catenaRaggioPx) {
        altro.hp -= dmg * 0.45;
        altro.flash = 4;
        statoRun.scintilleFulmine.push({ x1: nem.x, y1: nem.y - 8, x2: altro.x, y2: altro.y - 8, tick: 6 });
      }
    }
  }
  // Fucina Accesa: un nemico in fiamme che cade passa il fuoco ai vicini
  if (nem.hp <= 0 && hpPrima > 0 && s.eff.fuocoCorrePx > 0 && (bruciava || statoRun.burn) && st) {
    let acceso = false;
    for (const altro of st.nemici) {
      if (altro === nem || altro.hp <= 0) continue;
      if (Math.hypot(altro.x - nem.x, altro.y - nem.y) <= s.eff.fuocoCorrePx) { altro.burnTicks = Math.max(altro.burnTicks || 0, 120); acceso = true; }
    }
    if (acceso) statoRun.ondeEsplosione.push({ x: nem.x, y: nem.y - 6, r: 6, maxR: s.eff.fuocoCorrePx, color: '#fb923c' });
  }
  return r;
};

/** Dopo un attacco andato a segno (il cooldown è partito): eco di Pulcinella e colpo di maglio. */
function dopoAttaccoB4(s, dx, dy) {
  const T = TRASFORMAZIONI_B4;
  const st = statoRun.stanzaCorrente;
  if (s.attive.maschera) s.eco = { quando: tick + T.maschera.ritardoEcoTick, dx, dy, stanza: st };
  if (s.attive.fuoco) {
    s.colpiMaglio++;
    if (s.colpiMaglio >= T.fuoco.ogniColpi) {
      s.colpiMaglio = 0;
      if (statoRun.proiettili.length < OGGETTI_D.clamp.proiettiliGiocatore) {
        const a = Math.atan2(dy, dx);
        statoRun.proiettili.push({
          x: player.x + Math.cos(a) * 12, y: player.y - 6 + Math.sin(a) * 12,
          vx: Math.cos(a) * T.fuoco.velocita, vy: Math.sin(a) * T.fuoco.velocita,
          dist: 0, maxDist: T.fuoco.gittataPx, dmg: statoRun.dmg * T.fuoco.moltMaglio, r: T.fuoco.raggioMaglio,
          tipo: 'maglio', piercing: false, overflowPierce: false, hitIds: new Set(), oming: 0, rimbalzi: 0,
          orbitaD: null, esplosiva: T.fuoco.scoppioPx, prossimita: false, bloccaProiettili: false, maglioB4: true,
        });
        suonoB4('maglio');
      }
    }
  }
}

const attaccoBaseB4 = eseguiAttacco4Direzioni;
eseguiAttacco4Direzioni = function eseguiAttacco4DirezioniB4(dx, dy, ...resto) {
  const pronto = player.cooldown <= 0;
  const r = attaccoBaseB4.call(this, dx, dy, ...resto);
  const s = statoInScenaB4();
  if (s && pronto && player.cooldown > 0) dopoAttaccoB4(s, dx, dy);
  return r;
};

const rimbalzaBaseB4 = rimbalzaD;
rimbalzaD = function rimbalzaDB4(p, ...resto) {
  const ok = rimbalzaBaseB4.call(this, p, ...resto);
  const s = ok ? statoInScenaB4() : null;
  if (s && s.eff.rimbalzoDmg > 0 && p && !p.famD) p.dmg *= 1 + s.eff.rimbalzoDmg; // Carambola Cremisi
  return ok;
};

/** Santo di Cera: onda di luce attorno al giocatore appena colpito (ferisce, respinge, spegne i colpi vicini). */
function ondaSacraB4() {
  const T = TRASFORMAZIONI_B4.sacro;
  const st = statoRun.stanzaCorrente;
  if (!st) return;
  statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 8, maxR: T.raggioOndaPx, color: '#fde68a' });
  suonoB4('onda');
  for (let j = statoRun.proiettiliNemici.length - 1; j >= 0; j--) {
    const pr = statoRun.proiettiliNemici[j];
    if (Math.hypot(pr.x - player.x, pr.y - (player.y - 6)) <= T.raggioProiettiliPx) {
      statoRun.effettiSplash.push({ x: pr.x, y: pr.y, tick: 0 });
      statoRun.proiettiliNemici.splice(j, 1);
    }
  }
  for (const n of st.nemici.slice()) {
    if (n.hp <= 0 || (n.airZ || 0) > 16) continue;
    const d = Math.hypot(n.x - player.x, n.y - player.y);
    if (d <= T.raggioOndaPx + (n.r || 0)) {
      const k = d > 0.01 ? 1 / d : 0;
      danneggiaNemico(n, statoRun.dmg * T.moltOnda, k ? (n.x - player.x) * k : 1, k ? (n.y - player.y) * k : 0);
    }
  }
}

const colpoGiocatoreBaseB4 = subisciColpoGiocatore;
subisciColpoGiocatore = function subisciColpoGiocatoreB4(...args) {
  const s0 = statoInScenaB4();
  const hp0 = statoRun.hpHalf, scudo0 = statoRun.scudoStanzaD || 0, rosa0 = Boolean(statoRun.scudoRosaC);
  const r = colpoGiocatoreBaseB4.apply(this, args);
  const s = statoInScenaB4();
  if (!s || s !== s0 || statoRun.hpHalf <= 0) return r; // run finita o ricominciata dentro il colpo
  const parato = (statoRun.scudoStanzaD || 0) < scudo0;
  const colpito = parato || statoRun.hpHalf < hp0 || (rosa0 && !statoRun.scudoRosaC);
  if (!colpito) return r;
  if (parato && s.eff.curaSuScudoHalf > 0) statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + s.eff.curaSuScudoHalf); // Grazia Ricevuta
  if (s.attive.sacro) ondaSacraB4();
  return r;
};

const stanzaPulitaBaseB4 = verificaStanzaPulita;
verificaStanzaPulita = function verificaStanzaPulitaB4(...args) {
  const st = statoRun.stanzaCorrente;
  const era = st ? Boolean(st.pulita) : true;
  const r = stanzaPulitaBaseB4.apply(this, args);
  const s = statoInScenaB4();
  if (s && st && !era && st.pulita && st === statoRun.stanzaCorrente && st.nemici.length > 0) {
    if (s.attive.cibo && statoRun.hpHalf > 0 && statoRun.hpHalf < statoRun.maxHpHalf) { // Il Mangiamaccheroni
      statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + TRASFORMAZIONI_B4.cibo.curaStanzaHalf);
      statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 4, maxR: 22, color: '#4ade80' });
    }
    if (s.eff.caricaExtra > 0 && statoRun.oggettoAttivo) { // Scampanata
      statoRun.caricaAttivo = Math.min(statoRun.oggettoAttivo.maxCarica, statoRun.caricaAttivo + s.eff.caricaExtra);
    }
  }
  return r;
};

/** L'Ombra del Velo: i fili neri tagliano chi è entro il raggio (danno senza spinta, niente critici). */
function auraOmbraB4(s, st) {
  const T = TRASFORMAZIONI_B4.ombra;
  if (tick % T.ogniTick !== 0) return;
  const danno = Math.max(T.dannoMin, statoRun.dmg * T.frazioneDanno);
  for (const n of st.nemici.slice()) {
    if (n.hp <= 0 || (n.airZ || 0) > 16) continue;
    if (Math.hypot(n.x - player.x, n.y - player.y) <= T.raggioPx + (n.r || 0)) {
      danneggiaNemico(n, danno, 0, 0);
      effettoB4(s, 'taglio', n.x, n.y - 10);
    }
  }
}

/** Botta e Risposta: un colpo a ricerca riparte dal giocatore verso il nemico più vicino. */
function contrattaccoB4(s, st) {
  if (statoRun.proiettili.length >= OGGETTI_D.clamp.proiettiliGiocatore) return;
  const n = nemicoVicinoD(st, player.x, player.y - 6);
  const a = n ? Math.atan2(n.y - 6 - (player.y - 6), n.x - player.x) : Math.atan2(player.dirY, player.dirX);
  const F = OGGETTI_D.famiglio;
  statoRun.proiettili.push({
    x: player.x, y: player.y - 6, vx: Math.cos(a) * 4.2, vy: Math.sin(a) * 4.2, dist: 0, maxDist: 260,
    dmg: statoRun.dmg * s.eff.contrattacco, r: 4.5, tipo: 'viola', piercing: false, overflowPierce: false,
    hitIds: new Set(), oming: F.omingForza, rimbalzi: 0, orbitaD: null, esplosiva: 0, prossimita: false, bloccaProiettili: false,
  });
}

const passoBaseB4 = passoLogico;
passoLogico = function passoLogicoB4(...args) {
  const s0 = statoInScenaB4();
  const parati0 = statoRun.bloccatiD || 0;
  const r = passoBaseB4.apply(this, args);
  const s = statoInScenaB4();
  if (!s || s !== s0) return r;
  const st = statoRun.stanzaCorrente;
  if (!st || statoRun.pausa || statoRun.siparioAttivo || statoRun.pannelloB || statoRun.scambioPendente) return r;
  // annuncio: uno alla volta, col suo suono e il suo lampo
  if (!s.annuncio && s.coda.length) {
    s.annuncio = s.coda.shift();
    if (s.annuncio.tipo === 'trasformazione') {
      s.lampo = TRASFORMAZIONI_B4.annuncio.lampoTick;
      suonoB4('trasformazione');
      if (OPZIONI.scossa > 0) scuoti(FEEL.scossa.evento);
      statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 8, r: 8, maxR: 120, color: TEMI_B4.colori[s.annuncio.tema] });
    } else {
      suonoB4('sinergia');
    }
  }
  if (s.annuncio) {
    s.annuncio.t++;
    if (s.annuncio.t >= s.annuncio.durata) {
      if (s.annuncio.tipo === 'trasformazione') mostraBanner(`✦ ${s.annuncio.titolo}: ${s.annuncio.sotto}`, 200);
      s.annuncio = null;
    }
  }
  if (s.lampo > 0) s.lampo--;
  if (ticksCongelati > 0) return r; // hit-stop: la logica del palco è ferma
  if (s.attive.ombra) auraOmbraB4(s, st);
  if (s.eco && tick >= s.eco.quando) { // secondo colpo di Pulcinella Traditore
    const e = s.eco;
    s.eco = null;
    if (e.stanza === st) {
      sparaProiettiliDirezione(e.dx, e.dy, TRASFORMAZIONI_B4.maschera.scalaEco);
      player.shootAnimTimer = Math.max(player.shootAnimTimer, 5);
      AudioSys.playSparo();
    }
  }
  if (s.eff.contrattacco > 0) {
    for (let k = (statoRun.bloccatiD || 0) - parati0; k > 0; k--) contrattaccoB4(s, st);
  }
  return r;
};

// ===========================================================================
// RESA: costume sopra/attorno al burattino
// ===========================================================================

/** Punti d'attacco del costume per personaggio (coordinate locali dello sprite, rivolto a destra). */
const ANCORE_B4 = Object.freeze({
  normale: Object.freeze({ viso: [3.8, -21.2], occhi: [[2.2, -21.0], [6.1, -21.2]], banda: [-2.6, -29.0, -0.22], cima: [-9.5, -41],
    aureola: [-1, -44], orecchie: [[-9.6, -24.6, -6.6, -28.6, -12.6, -32.2], [3.2, -29.2, 7.6, -27.0, 8.0, -35.0]] }),
  taddeo: Object.freeze({ viso: [1.5, -19.5], occhi: [[-1.2, -19.6], [4.2, -19.6]], banda: [0, -31.5, 0], cima: [0, -44],
    aureola: [0, -48], orecchie: [[-10.5, -27, -6.5, -31, -11.5, -36], [6.5, -31, 10.5, -27, 11.5, -36]] }),
});

const aloniB4 = new Map();

/** Alone radiale in cache (canvas fuori schermo): nessun gradiente creato per frame. */
function aloneB4(colore, raggio) {
  const k = colore + '|' + raggio;
  let c = aloniB4.get(k);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = raggio * 2;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(raggio, raggio, 1, raggio, raggio, raggio);
    g.addColorStop(0, colore);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, raggio * 2, raggio * 2);
    aloniB4.set(k, c);
  }
  return c;
}

/** Entra nelle coordinate locali del burattino (stessa trasformazione di disegnaFerruccioPittorico). Torna la scala. */
function apriPupazzoB4(px, py, opts) {
  const t = opts.tick || 0;
  const bob = opts.moving ? Math.sin(t * 0.34) * 1.8 : Math.sin(t * 0.09) * 1.1;
  const sc = opts.scalaA2 && opts.scalaA2 !== 1 ? opts.scalaA2 : 1;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(px, py + bob);
  if (sc !== 1) ctx.scale(sc, sc);
  if (opts.flipX) ctx.scale(-1, 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return sc;
}

/** Filo nero con bordo viola (i fili del Velo): da (x0, y0) a (x1, y1) con una pancia `curva`. */
function filoNeroB4(x0, y0, x1, y1, curva) {
  for (let passata = 0; passata < 2; passata++) {
    ctx.strokeStyle = passata ? '#07040a' : 'rgba(139, 92, 246, 0.42)';
    ctx.lineWidth = passata ? 1.1 : 2.4;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2 + curva, (y0 + y1) / 2, x1, y1);
    ctx.stroke();
  }
}

/** Parti del costume che stanno DIETRO al corpo (mantello, coda, fili che salgono, aloni). */
function disegnaDietroB4(s, px, py, opts, sulPalco) {
  const t = opts.tick || 0;
  const A = (opts.charInfo && opts.charInfo.id) === 'taddeo' ? ANCORE_B4.taddeo : ANCORE_B4.normale;
  const sc = apriPupazzoB4(px, py, opts);
  if (s.attive.sacro) { // luce di cera attorno al santo
    const alfa0 = ctx.globalAlpha;
    ctx.globalAlpha = alfa0 * (0.55 + Math.sin(t * 0.07) * 0.12);
    ctx.drawImage(aloneB4('rgba(253, 230, 138, 0.75)', 28), -28, -44);
    ctx.globalAlpha = alfa0;
  }
  if (s.attive.ombra) {
    if (sulPalco) { // lame di filo che girano al raggio dell'aura
      const R = TRASFORMAZIONI_B4.ombra.raggioPx / sc;
      for (let k = 0; k < 3; k++) {
        const a0 = t * 0.075 + (k * TAU) / 3;
        for (let passata = 0; passata < 2; passata++) {
          ctx.strokeStyle = passata ? '#07040a' : 'rgba(139, 92, 246, 0.38)';
          ctx.lineWidth = passata ? 1.3 : 2.8;
          ctx.beginPath();
          ctx.arc(0, -5, R, a0, a0 + 0.95);
          ctx.stroke();
        }
        const xa = Math.cos(a0 + 0.95) * R, ya = -5 + Math.sin(a0 + 0.95) * R; // punta tagliente
        ctx.fillStyle = '#ddd6fe';
        ctx.fillRect(xa - 0.8, ya - 0.8, 1.6, 1.6);
      }
    }
    const alto = sulPalco ? -(py + 6) / sc : -70; // i fili salgono fin sopra il palco
    filoNeroB4(-9, alto, -5.5, -14, Math.sin(t * 0.05) * 3);
    filoNeroB4(9, alto, 5, -14, Math.cos(t * 0.045) * 3);
    filoNeroB4(A.cima[0] - 2, alto, A.cima[0], A.cima[1], Math.sin(t * 0.04 + 1) * 2);
    for (let k = 0; k < 3; k++) { // riflessi taglienti che scendono lungo i fili
      const f = ((t * 0.012 + k * 0.37) % 1);
      const x = k === 0 ? -9 + 3.5 * f : k === 1 ? 9 - 4 * f : A.cima[0] - 2 + 2 * f;
      const y1 = k === 2 ? A.cima[1] : -14;
      ctx.fillStyle = 'rgba(221, 214, 254, 0.9)';
      ctx.fillRect(x - 0.6, alto + (y1 - alto) * f - 1.5, 1.2, 3);
    }
  }
  if (s.attive.denari) { // mantello d'ebano con l'orlo d'oro
    const w = Math.sin(t * 0.11) * 1.6;
    ctx.fillStyle = '#17100b';
    ctx.strokeStyle = '#c9992e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6, -14.5);
    ctx.bezierCurveTo(-14, -10, -19, -2, -21 + w, 5.5);
    ctx.quadraticCurveTo(-13, 8.5 + w * 0.4, -5, 5.5);
    ctx.quadraticCurveTo(3, 8.5 - w * 0.4, 10, 5.2);
    ctx.quadraticCurveTo(14.5, 5.5, 16, 3);
    ctx.bezierCurveTo(13, -4, 9.5, -10, 5.5, -14.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(201, 153, 46, 0.5)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-12, -6); ctx.quadraticCurveTo(-15, 0, -17 + w, 5);
    ctx.moveTo(11, -5); ctx.quadraticCurveTo(13, 0, 13.5, 4);
    ctx.stroke();
  }
  if (s.attive.bestia) { // coda di gatto che ondeggia
    const sw = Math.sin(t * 0.09) * 3;
    ctx.strokeStyle = '#0d0907';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.bezierCurveTo(-16, 4, -22, -5, -17 + sw, -14);
    ctx.stroke();
    ctx.strokeStyle = '#3a2a1f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-17.5 + sw, -12); ctx.lineTo(-17 + sw, -14);
    ctx.stroke();
  }
  ctx.restore();
}

/** Parti del costume SOPRA il corpo (corona, maschera, orecchie, aureola, grembiule, tovagliolo, fili recisi, fumetto). */
function disegnaSopraB4(s, px, py, opts, sulPalco) {
  const t = opts.tick || 0;
  const A = (opts.charInfo && opts.charInfo.id) === 'taddeo' ? ANCORE_B4.taddeo : ANCORE_B4.normale;
  apriPupazzoB4(px, py, opts);

  if (s.attive.fuoco) { // grembiule di cuoio, maglio che si arroventa, faville
    ctx.fillStyle = '#3a2416';
    ctx.strokeStyle = '#120c08';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-4.5, -9.5); ctx.lineTo(4.2, -9.5); ctx.lineTo(6.8, 0.6); ctx.quadraticCurveTo(0, 2.8, -7.4, 0.8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5b3a22';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-4.5, -9.5); ctx.lineTo(-3, -12.2);
    ctx.moveTo(4.2, -9.5); ctx.lineTo(3, -12.2);
    ctx.moveTo(-3, -3.5); ctx.lineTo(3.5, -3.5);
    ctx.stroke();
    const caldo = (s.colpiMaglio + 1) / TRASFORMAZIONI_B4.fuoco.ogniColpi; // più rovente verso il terzo colpo
    ctx.strokeStyle = '#6d4c2f';
    ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.moveTo(1.2, -1); ctx.lineTo(9.5, -10.5); ctx.stroke();
    ctx.save();
    ctx.translate(10.2, -11.4);
    ctx.rotate(-0.85);
    ctx.fillStyle = '#2b2b30';
    ctx.strokeStyle = '#0a0604';
    ctx.lineWidth = 0.9;
    ctx.fillRect(-4.2, -2.6, 8.4, 5.2);
    ctx.strokeRect(-4.2, -2.6, 8.4, 5.2);
    ctx.globalAlpha *= Math.min(1, 0.25 + caldo * 0.75);
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(1.6, -2.1, 2.2, 4.2);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(2.8, -1.4, 0.9, 2.8);
    ctx.restore();
    const alfaFaville = ctx.globalAlpha;
    for (let k = 0; k < 4; k++) {
      const f = ((t * 0.02 + k * 0.27) % 1);
      ctx.globalAlpha = alfaFaville * (1 - f);
      ctx.fillStyle = k % 2 ? '#fde047' : '#fb923c';
      ctx.fillRect(9 + Math.sin(t * 0.1 + k * 2.1) * 4 - k * 3, -12 - f * 24, 1.3, 1.3);
    }
    ctx.globalAlpha = alfaFaville;
  }

  if (s.attive.denari) { // risvolti del mantello col fermaglio, corona d'ebano
    ctx.fillStyle = '#17100b';
    ctx.strokeStyle = '#c9992e';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-6, -14.2); ctx.lineTo(-9.5, -5.5); ctx.lineTo(-6.2, -3.2); ctx.lineTo(-3.6, -11.8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5.2, -14.2); ctx.lineTo(8.6, -5.8); ctx.lineTo(5.8, -3.6); ctx.lineTo(3.4, -11.8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f9cb40';
    ctx.beginPath(); ctx.arc(0, -11.2, 1.5, 0, TAU); ctx.fill();
    ctx.save();
    ctx.translate(A.banda[0], A.banda[1]);
    ctx.rotate(A.banda[2]);
    ctx.fillStyle = '#17100b';
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-7, 1.6); ctx.lineTo(-7.6, -5.4); ctx.lineTo(-4.4, -2.2); ctx.lineTo(-2.4, -6.6); ctx.lineTo(0, -2.4);
    ctx.lineTo(2.4, -6.6); ctx.lineTo(4.4, -2.2); ctx.lineTo(7.6, -5.4); ctx.lineTo(7, 1.6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f9cb40';
    for (const cx of [-7.6, -2.4, 2.4, 7.6]) { ctx.beginPath(); ctx.arc(cx, cx === -7.6 || cx === 7.6 ? -5.6 : -6.8, 0.9, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e53222';
    ctx.beginPath(); ctx.arc(0, -0.2, 1.1, 0, TAU); ctx.fill();
    ctx.restore();
  }

  if (s.attive.cibo) { // tovagliolo al collo, forchetta coi maccheroni
    ctx.fillStyle = '#f5efe2';
    ctx.strokeStyle = '#120c08';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-4.2, -12.2); ctx.lineTo(4.6, -12.2); ctx.lineTo(0.4, -4.4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#df3624';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-2.2, -10.6); ctx.lineTo(2.8, -10.6);
    ctx.moveTo(-1, -8.6); ctx.lineTo(1.8, -8.6);
    ctx.stroke();
    ctx.strokeStyle = '#c9a23a';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-7.5, -5); ctx.lineTo(-11.5, -17); ctx.stroke();
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const dx of [-1.3, 0, 1.3]) { ctx.moveTo(-11.5 + dx, -17); ctx.lineTo(-12.2 + dx, -20.4); }
    ctx.stroke();
    ctx.strokeStyle = '#f3dc8a';
    ctx.lineWidth = 1;
    const o = Math.sin(t * 0.12) * 1.2;
    ctx.beginPath();
    ctx.ellipse(-12, -19.2, 2.6, 1.6, -0.3, 0, TAU);
    ctx.moveTo(-13.6, -18.6); ctx.quadraticCurveTo(-15.5 + o, -15.5, -14 + o, -12.5);
    ctx.moveTo(-10.6, -18.4); ctx.quadraticCurveTo(-9 - o, -15.5, -10.2 - o, -13.2);
    ctx.stroke();
  }

  if (s.attive.bestia) { // orecchie, baffi, pupille a fessura
    for (const [x1, y1, x2, y2, xa, ya] of A.orecchie) {
      ctx.fillStyle = '#0d0907';
      ctx.strokeStyle = '#3a2a1f';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(xa, ya); ctx.lineTo(x2, y2); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a8452f';
      ctx.beginPath();
      ctx.moveTo((x1 * 2 + x2) / 3, (y1 * 2 + y2) / 3); ctx.lineTo((xa * 2 + (x1 + x2) / 2) / 3, (ya * 2 + (y1 + y2) / 2) / 3); ctx.lineTo((x1 + x2 * 2) / 3, (y1 + y2 * 2) / 3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = '#e8dcc0';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    const [vx, vy] = A.viso;
    ctx.moveTo(vx + 4, vy + 1.6); ctx.lineTo(vx + 9.5, vy + 0.4);
    ctx.moveTo(vx + 4, vy + 2.6); ctx.lineTo(vx + 9.5, vy + 3.6);
    ctx.moveTo(vx - 4, vy + 1.6); ctx.lineTo(vx - 8.5, vy + 0.6);
    ctx.moveTo(vx - 4, vy + 2.6); ctx.lineTo(vx - 8.5, vy + 3.6);
    ctx.stroke();
    for (const [ex, ey] of A.occhi) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.arc(ex, ey, 1.35, 0, TAU); ctx.fill();
      ctx.fillStyle = '#0a0604';
      ctx.fillRect(ex - 0.3, ey - 1.2, 0.6, 2.4);
    }
  }

  if (s.attive.maschera) { // mezza maschera di cuoio col naso a becco
    const [vx, vy] = A.viso;
    ctx.fillStyle = '#2a1a12';
    ctx.strokeStyle = '#8a5a3a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(vx - 4.6, vy - 0.4);
    ctx.quadraticCurveTo(vx - 4.2, vy - 4.8, vx, vy - 4.6);
    ctx.quadraticCurveTo(vx + 4.4, vy - 4.4, vx + 4.6, vy - 1.2);
    ctx.quadraticCurveTo(vx + 8.6, vy - 0.6, vx + 9.6, vy + 2.6); // il naso a becco
    ctx.quadraticCurveTo(vx + 9.2, vy + 4.6, vx + 7.2, vy + 3.8);
    ctx.quadraticCurveTo(vx + 6.6, vy + 2.2, vx + 3.4, vy + 1.8);
    ctx.quadraticCurveTo(vx - 1, vy + 2.6, vx - 4.6, vy - 0.4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#8a5a3a';
    ctx.lineWidth = 0.6;
    ctx.beginPath(); // rughe della fronte
    ctx.moveTo(vx - 2.6, vy - 3.4); ctx.quadraticCurveTo(vx, vy - 4, vx + 2.8, vy - 3.2);
    ctx.stroke();
    for (const [ex, ey] of A.occhi) { // occhi furbi nei fori della maschera
      ctx.fillStyle = '#fffdf5';
      ctx.beginPath(); ctx.arc(ex, ey, 1.15, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#0a0604';
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(ex - 1.5, ey - 1.9); ctx.lineTo(ex + 1.4, ey - 1.2); ctx.stroke();
    }
  }

  if (s.attive.ombra) { // occhi velati di viola
    for (const [ex, ey] of A.occhi) {
      ctx.fillStyle = 'rgba(139, 92, 246, 0.55)';
      ctx.beginPath(); ctx.arc(ex, ey, 2.1, 0, TAU); ctx.fill();
    }
  }

  if (s.attive.fili) { // fili d'oro recisi che fluttuano verso l'alto
    const basi = [[-5.5, -14, 15], [5, -14, 13], [A.cima[0], A.cima[1], 11], [1.2, -2, 9]];
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 0.95;
    for (let k = 0; k < basi.length; k++) {
      const [bx, by, lung] = basi[k];
      const o1 = Math.sin(t * 0.07 + k * 1.7) * 3, o2 = Math.cos(t * 0.05 + k * 2.3) * 4;
      const xe = bx + o2 + (k % 2 ? 3 : -3), ye = by - lung;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.bezierCurveTo(bx + o1, by - lung * 0.35, bx - o1 + (k % 2 ? 2 : -2), by - lung * 0.7, xe, ye);
      ctx.moveTo(xe, ye); ctx.lineTo(xe - 1.6, ye - 2.2); // estremità sfilacciata
      ctx.moveTo(xe, ye); ctx.lineTo(xe + 1.4, ye - 2.4);
      ctx.stroke();
    }
  }

  if (s.attive.sacro) { // aureola, fiammella in cima, colature di cera
    const [ax, ay] = A.aureola;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.ellipse(ax, ay, 8.6, 2.7, -0.1, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.ellipse(ax, ay, 8.6, 2.7, -0.1, 0, TAU); ctx.stroke();
    const [cx, cy] = A.cima;
    const fl = Math.sin(t * 0.4) * 0.6;
    ctx.fillStyle = '#fb923c';
    ctx.beginPath(); ctx.ellipse(cx + fl * 0.4, cy - 2.6, 1.7, 3.1 + fl * 0.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.ellipse(cx + fl * 0.3, cy - 2, 0.85, 1.7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff7e0';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy + 3); ctx.lineTo(cx + 1, cy + 6.5);
    ctx.moveTo(cx + 3.6, cy + 6); ctx.lineTo(cx + 3.6, cy + 8.4);
    ctx.moveTo(-6.8, -13.6); ctx.lineTo(-6.8, -10.6);
    ctx.moveTo(6.2, -13.4); ctx.lineTo(6.2, -11.2);
    ctx.stroke();
  }

  // fumetto dello sberleffo (non ribaltato)
  const f = s.fumetto;
  if (f && sulPalco) {
    const eta = tick - f.t0;
    const D = TRASFORMAZIONI_B4.maschera.fumettoTick;
    if (eta > D) s.fumetto = null;
    else {
      if (opts.flipX) ctx.scale(-1, 1);
      const pop = Math.min(1, eta / 5);
      const by = Math.max(-58, -(py - 18));
      ctx.save();
      ctx.translate(10, by);
      ctx.scale(pop, pop);
      ctx.globalAlpha *= Math.min(1, (D - eta) / 10);
      ctx.font = 'bold 8px ui-monospace, monospace';
      const larg = Math.ceil(ctx.measureText(f.testo).width) + 10;
      ctx.fillStyle = '#fdf6e3';
      ctx.strokeStyle = '#120c08';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-larg / 2 + 3, -8); ctx.lineTo(larg / 2 - 3, -8); ctx.quadraticCurveTo(larg / 2, -8, larg / 2, -5);
      ctx.lineTo(larg / 2, 3); ctx.quadraticCurveTo(larg / 2, 6, larg / 2 - 3, 6);
      ctx.lineTo(-2, 6); ctx.lineTo(-7, 12); ctx.lineTo(-7, 6); ctx.lineTo(-larg / 2 + 3, 6);
      ctx.quadraticCurveTo(-larg / 2, 6, -larg / 2, 3); ctx.lineTo(-larg / 2, -5); ctx.quadraticCurveTo(-larg / 2, -8, -larg / 2 + 3, -8);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      drawTextFit(f.testo, 0, 2, larg - 4, { size: 8, color: '#5c1a0c', shadow: false });
      ctx.restore();
    }
  }
  ctx.restore();
}

/** Effetti brevi sul palco, in coordinate del mondo: tagli dei fili neri, fili recisi, critici. */
function disegnaEffettiB4(s) {
  if (!s.tagli.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = s.tagli.length - 1; i >= 0; i--) {
    const e = s.tagli[i];
    const eta = tick - e.t0;
    if (eta > 12) { s.tagli.splice(i, 1); continue; }
    const k = eta / 12;
    ctx.globalAlpha = 1 - k;
    if (e.tipo === 'taglio') {
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.8)';
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(e.x - 8 + k * 4, e.y - 7); ctx.lineTo(e.x + 8 - k * 4, e.y + 7); ctx.stroke();
      ctx.strokeStyle = '#07040a';
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(e.x - 8 + k * 4, e.y - 7); ctx.lineTo(e.x + 8 - k * 4, e.y + 7); ctx.stroke();
    } else if (e.tipo === 'reciso') {
      ctx.strokeStyle = '#f9cb40';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(e.x - 5, e.y - 4 - k * 6); ctx.lineTo(e.x - 2, e.y - k * 3);
      ctx.moveTo(e.x + 5, e.y - 4 - k * 6); ctx.lineTo(e.x + 2, e.y - k * 3);
      ctx.moveTo(e.x - 4, e.y + 2); ctx.lineTo(e.x + 4, e.y - 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#fffdf5';
      ctx.lineWidth = 1.4;
      const R = 4 + k * 9;
      ctx.beginPath();
      for (let a = 0; a < 4; a++) {
        const an = a * (Math.PI / 2) + 0.4;
        ctx.moveTo(e.x + Math.cos(an) * R * 0.4, e.y + Math.sin(an) * R * 0.4);
        ctx.lineTo(e.x + Math.cos(an) * R, e.y + Math.sin(an) * R);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

const ferruccioBaseB4 = disegnaFerruccioPittorico;
disegnaFerruccioPittorico = function disegnaFerruccioPittoricoB4(...args) {
  const conCtx = Boolean(args[0] && typeof args[0].save === 'function');
  const px = conCtx ? args[1] : args[0];
  const py = conCtx ? args[2] : args[1];
  const opts = (conCtx ? args[3] : args[2]) || {};
  // solo il burattino della run in corso (palco e cartellone dell'atto), mai menu, hub o registro
  const s = statoRun.fase === 'in_gioco' && opts.sinergie && opts.sinergie === statoRun.sinergieVisive ? statoRun.trasfB4 : null;
  const mio = Boolean(s && s.run === statoRun.numeroRun && (s.ordine.length || s.fumetto));
  if (!mio) return ferruccioBaseB4.apply(this, args);
  const sulPalco = px === player.x && py === player.y && !statoRun.siparioAttivo;
  try { disegnaDietroB4(s, px, py, opts, sulPalco); } catch (err) { console.error('[b4] costume', err); }
  const r = ferruccioBaseB4.apply(this, args);
  try {
    disegnaSopraB4(s, px, py, opts, sulPalco);
    if (sulPalco) disegnaEffettiB4(s);
  } catch (err) { console.error('[b4] costume', err); }
  return r;
};

// ===========================================================================
// RESA: HUD (progresso dei temi), annuncio, lampo
// ===========================================================================

/** Fila di icone sotto la minimappa: solo i temi che hai addosso; pallini n/3, cornice d'oro se trasformato. */
function disegnaStrisciaTemiB4(s) {
  const G = TRASFORMAZIONI_B4.hud;
  const soglia = TRASFORMAZIONI_B4.soglia;
  let n = 0;
  for (const t of TEMI_B4.ordine) if ((s.conteggi[t] || 0) > 0 || s.attive[t]) n++;
  if (!n) return;
  const x0 = G.xDestra - n * G.cella;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 6, 4, 0.82)';
  ctx.fillRect(x0 - 2, G.y - 2, n * G.cella + 2, G.altezza + 2);
  let i = 0;
  for (const t of TEMI_B4.ordine) {
    const c = s.conteggi[t] || 0;
    const att = Boolean(s.attive[t]);
    if (!c && !att) continue;
    const cx = x0 + i * G.cella + G.cella / 2 - 1;
    i++;
    const eta = tick - (s.impulsi[t] === undefined ? -9999 : s.impulsi[t]);
    const scala = eta >= 0 && eta < G.impulsoTick ? 1 + 0.7 * (1 - eta / G.impulsoTick) : 1;
    if (att) {
      ctx.strokeStyle = '#f9cb40';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 5.5, G.y - 0.5, 11, 11);
    }
    drawPixelSprite(TEMI_B4.icone[t], cx, G.y + 5, scala);
    for (let k = 0; k < soglia; k++) {
      ctx.fillStyle = att ? '#f9cb40' : k < c ? TEMI_B4.colori[t] : '#3f342a';
      ctx.fillRect(Math.round(cx - 5 + k * 4), G.y + 12, 3, 2);
    }
  }
  ctx.restore();
}

/** Cartiglio grande della trasformazione (o fascia della sinergia) che si srotola sotto il banner. */
function disegnaAnnuncioB4(s) {
  const a = s.annuncio;
  if (!a) return;
  const A = TRASFORMAZIONI_B4.annuncio;
  const grande = a.tipo === 'trasformazione';
  const apre = Math.min(1, a.t / A.apreTick);
  const w = Math.round((grande ? A.larghezza : A.larghezzaSinergia) * (0.15 + 0.85 * apre));
  const h = grande ? A.altezza : A.altezzaSinergia;
  const x = Math.round((W - w) / 2), y = A.y;
  const col = grande ? TEMI_B4.colori[a.tema] : '#67e8f9';
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, (a.durata - a.t) / A.chiudeTick));
  ctx.fillStyle = 'rgba(14, 8, 5, 0.93)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = col;
  ctx.lineWidth = grande ? 2 : 1.2;
  ctx.strokeRect(x, y, w, h);
  if (grande) {
    ctx.strokeStyle = '#5a3818';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
  }
  ctx.beginPath();
  ctx.rect(x + 2, y + 2, w - 4, h - 4);
  ctx.clip();
  if (apre >= 1) {
    if (grande) {
      const batte = 3 + Math.sin(a.t * 0.2) * 0.25;
      drawPixelSprite(TEMI_B4.icone[a.tema], x + 26, y + h / 2, batte);
      drawPixelSprite(TEMI_B4.icone[a.tema], x + w - 26, y + h / 2, batte);
      drawTextFit(`✦ ${TESTI_B4.sopraTitolo} ✦${a.nuova ? ' · ' + TESTI_B4.nuova : ''}`, W / 2, y + 13, w - 110, { size: 7, color: col });
      drawTextFit(a.titolo.toUpperCase(), W / 2, y + 31, w - 110, { size: 15, color: '#fffdf5' });
      drawTextFit(a.sotto, W / 2, y + 45, w - 104, { size: 7.5, color: '#4ade80', weight: '' });
    } else {
      const r = a.sinergia;
      const sa = trovaOggettoB4(r.a), sb = trovaOggettoB4(r.b);
      if (sa) drawPixelSprite(SPRITE_OGGETTI[sa.sprite] || SPRITE_OGGETTI.spada, x + 16, y + h / 2, 1.3);
      if (sb) drawPixelSprite(SPRITE_OGGETTI[sb.sprite] || SPRITE_OGGETTI.spada, x + 34, y + h / 2, 1.3);
      drawTextFit(`${TESTI_B4.sinergia}: ${a.titolo}${a.nuova ? ' · ' + TESTI_B4.nuova : ''}`, x + 48 + (w - 56) / 2, y + 13, w - 60, { size: 9.5, color: col });
      drawTextFit(a.sotto, x + 48 + (w - 56) / 2, y + 25, w - 60, { size: 7.5, color: '#e6d2aa', weight: '' });
    }
  }
  ctx.restore();
}

const hudBaseB4 = disegnaHUDPixelArt;
disegnaHUDPixelArt = function disegnaHUDPixelArtB4(...args) {
  const r = hudBaseB4.apply(this, args);
  const s = statoRun.fase === 'in_gioco' ? statoRun.trasfB4 : null;
  if (!s || s.run !== statoRun.numeroRun) return r;
  try {
    disegnaStrisciaTemiB4(s);
    disegnaAnnuncioB4(s);
    if (s.lampo > 0 && OPZIONI.lampi !== false) { // lampo caldo della trasformazione (spento se «lampi» è spento)
      const k = s.lampo / TRASFORMAZIONI_B4.annuncio.lampoTick;
      ctx.save();
      ctx.globalAlpha = 0.55 * k * k;
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(-24, -24, W + 48, H + 48);
      ctx.restore();
    }
  } catch (err) { console.error('[b4] hud', err); }
  return r;
};

// ===========================================================================
// DIARIO: tasto T → Trasformazioni → Sinergie → oggetti
// ===========================================================================

const tastoDiarioBaseB4 = tastoDiarioD;
tastoDiarioD = function tastoDiarioDB4(code, ...resto) {
  const d = statoRun.diarioD;
  if (d && code === TRASFORMAZIONI_B4.diario.tasto) {
    d.paginaB4 = ((d.paginaB4 || 0) + 1) % 3;
    if (d.paginaB4) d.paginaA2 = false;
    return undefined;
  }
  if (d && d.paginaB4) {
    if (['Escape', 'KeyO', 'Enter', 'Space'].includes(code)) { statoRun.diarioD = null; return undefined; }
    if (code !== 'KeyC') return undefined;
    d.paginaB4 = 0; // C: si passa ai consumabili (li gestisce chi sta sotto)
  }
  return tastoDiarioBaseB4.call(this, code, ...resto);
};

const clickDiarioBaseB4 = clickDiarioD;
clickDiarioD = function clickDiarioDB4(mx, my, ...resto) {
  const d = statoRun.diarioD;
  if (d && d.paginaB4) { if (my < 30 || my > H - 20) statoRun.diarioD = null; return undefined; }
  return clickDiarioBaseB4.call(this, mx, my, ...resto);
};

/** Cornice comune delle pagine del Diario (come disegnaDiarioD). */
function corniceDiarioB4(titolo) {
  ctx.fillStyle = 'rgba(5, 3, 2, 0.94)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1c130c';
  ctx.strokeStyle = '#f9cb40';
  ctx.lineWidth = 2;
  ctx.fillRect(24, 14, W - 48, H - 24);
  ctx.strokeRect(24, 14, W - 48, H - 24);
  drawTextFit(titolo, W / 2, 32, W - 80, { size: 10, color: '#f9cb40' });
}

/** Pagina 1 del tasto T: le otto trasformazioni (nome ed effetto solo se già scoperte) e il progresso di stanotte. */
function disegnaDiarioTrasformazioniB4() {
  const viste = vistiB4('trasformazioniB4');
  const s = statoRun.fase === 'in_gioco' && statoRun.trasfB4 && statoRun.trasfB4.run === statoRun.numeroRun ? statoRun.trasfB4 : null;
  const soglia = TRASFORMAZIONI_B4.soglia;
  const passo = TRASFORMAZIONI_B4.diario.rigaTrasf;
  ctx.save();
  corniceDiarioB4(`📖 ${TESTI_B4.diarioTrasf} — Scoperte ${TEMI_B4.ordine.filter((t) => viste.includes(t)).length} / ${TEMI_B4.ordine.length}`);
  TEMI_B4.ordine.forEach((t, i) => {
    const y = 44 + i * passo;
    const nota = viste.includes(t);
    const att = Boolean(s && s.attive[t]);
    const X = TESTI_TRASFORMAZIONI_B4[t];
    ctx.fillStyle = att ? '#3b2a1a' : '#2a1d14';
    ctx.fillRect(36, y, W - 72, passo - 3);
    ctx.strokeStyle = att ? '#f9cb40' : '#57534e';
    ctx.lineWidth = 1;
    ctx.strokeRect(36, y, W - 72, passo - 3);
    drawPixelSprite(TEMI_B4.icone[t], 52, y + 14, 2);
    drawTextFit(nota ? X.nome : '???', 70, y + 10, 250, { size: 9, color: nota ? '#f9cb40' : '#a8a29e', align: 'left' });
    drawTextFit(nota ? X.effetto : TESTI_B4.diarioIgnota, 70, y + 19, W - 190, { size: 7, color: nota ? '#4ade80' : '#78716c', align: 'left', weight: '', shadow: false });
    if (nota) drawTextFit(`«${X.motto}»`, 70, y + 27, W - 190, { size: 6.5, color: '#e6d2aa', align: 'left', weight: '', style: 'italic', shadow: false });
    drawTextFit(`${soglia} oggetti · ${TEMI_B4.nomi[t].toUpperCase()}`, W - 44, y + 10, 110, { size: 7, color: TEMI_B4.colori[t], align: 'right' });
    if (s) {
      const c = Math.min(soglia, s.conteggi[t] || 0);
      for (let k = 0; k < soglia; k++) {
        ctx.fillStyle = att ? '#f9cb40' : k < c ? TEMI_B4.colori[t] : '#3f342a';
        ctx.fillRect(W - 44 - (soglia - k) * 9, y + 15, 7, 4);
      }
      drawTextFit(att ? TESTI_B4.attivaOra : `${c} / ${soglia}`, W - 44, y + 27, 110, { size: 6.5, color: att ? '#f9cb40' : '#a8a29e', align: 'right', shadow: false });
    }
  });
  drawTextFit(TESTI_B4.piedeTrasf, W / 2, H - 14, W - 80, { size: 7, color: '#9ca3af' });
  ctx.restore();
}

/** Pagina 2 del tasto T: le sinergie (sagome dei due oggetti finché non le scopri). */
function disegnaDiarioSinergieB4() {
  const viste = vistiB4('sinergieB4');
  const s = statoRun.fase === 'in_gioco' && statoRun.trasfB4 && statoRun.trasfB4.run === statoRun.numeroRun ? statoRun.trasfB4 : null;
  const G = TRASFORMAZIONI_B4.diario;
  const perCol = Math.ceil(SINERGIE_B4.length / G.colonneSin);
  const largCol = (W - 72) / G.colonneSin;
  ctx.save();
  corniceDiarioB4(`📖 ${TESTI_B4.diarioSin} — Scoperte ${SINERGIE_B4.filter((r) => viste.includes(r.id)).length} / ${SINERGIE_B4.length}`);
  SINERGIE_B4.forEach((r, i) => {
    const x = 36 + Math.floor(i / perCol) * largCol;
    const y = 44 + (i % perCol) * G.rigaSin;
    const nota = viste.includes(r.id);
    const att = Boolean(s && s.sinergie[r.id]);
    ctx.fillStyle = att ? '#3b2a1a' : '#2a1d14';
    ctx.fillRect(x, y, largCol - 4, G.rigaSin - 3);
    ctx.strokeStyle = att ? '#67e8f9' : '#57534e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, largCol - 4, G.rigaSin - 3);
    const oa = trovaOggettoB4(r.a), ob = trovaOggettoB4(r.b);
    for (const [o, dx] of [[oa, 12], [ob, 30]]) {
      if (!o) continue;
      const g = SPRITE_OGGETTI[o.sprite] || SPRITE_OGGETTI.spada;
      drawPixelSprite(nota ? g : sagomaB4(o.sprite, g), x + dx, y + 12, 1.2);
    }
    drawTextFit(nota ? r.nome : '??? + ???', x + 44, y + 10, largCol - 54, { size: 8, color: nota ? '#67e8f9' : '#a8a29e', align: 'left' });
    drawTextFit(nota ? r.desc : TESTI_B4.sinergiaIgnota, x + 44, y + 20, largCol - 54, { size: 6.5, color: nota ? '#e6d2aa' : '#78716c', align: 'left', weight: '', shadow: false });
  });
  drawTextFit(TESTI_B4.piedeSin, W / 2, H - 14, W - 80, { size: 7, color: '#9ca3af' });
  ctx.restore();
}

const sagomeB4 = new Map();

/** Sagoma scura di uno sprite a griglia (indizio delle sinergie non ancora scoperte). */
function sagomaB4(chiave, griglia) {
  if (!sagomeB4.has(chiave)) sagomeB4.set(chiave, griglia.map((riga) => riga.replace(/[^.]/g, 'k')));
  return sagomeB4.get(chiave);
}

const disegnaDiarioBaseB4 = disegnaDiarioD;
disegnaDiarioD = function disegnaDiarioDB4(...args) {
  const d = statoRun.diarioD;
  if (!d) return undefined;
  if (d.paginaB4 === 1) { disegnaDiarioTrasformazioniB4(); return undefined; }
  if (d.paginaB4 === 2) { disegnaDiarioSinergieB4(); return undefined; }
  const r = disegnaDiarioBaseB4.apply(this, args);
  try {
    drawTextFit(TESTI_B4.suggerimento, 40, H - 14, 90, { size: 7, color: '#f9cb40', align: 'left' });
    const o = d.paginaA2 ? null : CATALOGO_OGGETTI[d.sel];
    if (o && conosciutoD(o.id)) { // temi dell'oggetto scelto, accanto alla sua descrizione
      const temi = temiDi(o).filter((t) => TEMI_B4.icone[t]);
      const yD = cellaDiarioD(CATALOGO_OGGETTI.length - 1).y + OGGETTI_D.diario.cellaA + 6;
      temi.forEach((t, i) => {
        drawPixelSprite(TEMI_B4.icone[t], W - 48 - i * 44, yD - 3, 1);
        drawTextFit(TEMI_B4.nomi[t], W - 54 - i * 44, yD, 34, { size: 6.5, color: TEMI_B4.colori[t], align: 'right', shadow: false });
      });
    }
  } catch (err) { console.error('[b4] diario', err); }
  return r;
};

// ===========================================================================
// SONDA QA
// ===========================================================================

/**
 * Fotografia dello stato delle trasformazioni e delle sinergie (per QA e per le altre squadre).
 * @returns {{soglia: number, conteggi: object, attive: string[], trasformazioni: object[], sinergie: string[],
 *   annuncio: object|null, inCoda: number, scoperte: string[], sinergieScoperte: string[], eff: object}}
 */
function statoTrasformazioni() {
  const s = statoB4();
  return {
    soglia: TRASFORMAZIONI_B4.soglia,
    conteggi: { ...s.conteggi },
    attive: s.ordine.slice(),
    trasformazioni: TEMI_B4.ordine.map((t) => ({ tema: t, nome: TESTI_TRASFORMAZIONI_B4[t].nome, attiva: Boolean(s.attive[t]), conteggio: s.conteggi[t] || 0 })),
    sinergie: Object.keys(s.sinergie),
    annuncio: s.annuncio ? { tipo: s.annuncio.tipo, titolo: s.annuncio.titolo, t: s.annuncio.t } : null,
    inCoda: s.coda.length,
    scoperte: vistiB4('trasformazioniB4').slice(),
    sinergieScoperte: vistiB4('sinergieB4').slice(),
    eff: { ...s.eff },
  };
}

/**
 * (QA) Dà al giocatore l'oggetto `id` di un qualunque catalogo (oggetti, patto, segreto) senza costi.
 * @param {string} id @returns {boolean} false se l'id non esiste
 */
function daiOggettoQA(id) {
  const o = trovaOggettoB4(id);
  if (!o) return false;
  acquisisciOggettoConLimite5Slot({ ...o }, 'qa', null);
  return true;
}

/** (QA) Toglie tutti gli oggetti e spegne trasformazioni e sinergie della run in corso. */
function azzeraTrasformazioniQA() {
  statoRun.oggettiEquipaggiati = [];
  statoRun.trasfB4 = null;
  ricalcolaStatistiche();
}

Object.assign(window.__teatro.interni, {
  TEMI_B4, TEMI_OGGETTI_B4, TRASFORMAZIONI_B4, TESTI_TRASFORMAZIONI_B4, SINERGIE_B4, SBERLEFFI_B4,
  temiDi, statoTrasformazioni, daiOggettoQA, azzeraTrasformazioniQA, statoB4,
  // gli interni esposti prima puntano alle versioni non avvolte: si aggiornano
  ricalcolaStatistiche, subisciColpoGiocatore, sparaProiettiliDirezione, disegnaFerruccioPittorico, tastoDiarioD,
  eseguiAttacco4Direzioni, passoLogico, verificaStanzaPulita,
});
if (window.__teatroInterno) window.__teatroInterno.danneggiaNemico = danneggiaNemico; // il raggio del patto (T3) passa dai ganci
