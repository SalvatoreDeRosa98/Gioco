/*
 * teatro/b5-oggetti.js — (squadra b5) il catalogo del Teatro arriva a 200 oggetti.
 *
 *   Prima: 62 passivi + 8 patti + 7 segreti + 3 attivi = 80. Qui: 94 passivi, 6 patti, 5 segreti e 15 attivi nuovi.
 *   - Ogni oggetto nuovo ha nome, riga di «lore», `temi` (convenzione delle squadre b: denari, ombra, maschera, fili,
 *     sacro, fuoco, bestia, cibo), tier, polarità, descrizione dell'effetto e icona (teatro/b5-oggetti-icone.js).
 *   - I passivi entrano in CATALOGO_OGGETTI (pool di 20 della run con le quote di D, tesoro, Fucina ai prezzi di
 *     ECONOMIA_T3, Stanza dello Sviluppatore), i patti in CATALOGO_PATTO, i segreti in CATALOGO_SEGRETO, gli attivi
 *     in OGGETTI_ATTIVI: gli attivi ora si trovano anche in gioco (tesoro e Fucina) e si scambiano con quello in mano.
 *   - Meccaniche nuove (chiavi di `mod` in CHIAVI_B5, tutte con un tetto): colpi che si dividono, tornano indietro,
 *     lasciano scie, crescono con la distanza, si caricano; scudi a tempo; famigli che raccolgono, parano, sparano;
 *     effetti all'ingresso in stanza, a stanza ripulita, al colpo subito, alla raccolta di monete/chiavi/bombe,
 *     legati al gradimento del pubblico (se un'altra squadra espone interni.gradimentoPubblico) e alla notte;
 *     oggetti che cambiano la Fucina, il tesoro e il Patto; oggetti a rischio.
 *   - Una ventina di oggetti nuovi sta dietro uno sblocco (SBLOCCHI_B5, stesse condizioni di a6-progressione.js).
 *   - Diario e Stanza dello Sviluppatore a pagine (prima: una griglia sola, con 200 voci usciva dallo schermo).
 *
 * Nessun gancio nei file di base: si avvolgono function di primo livello chiamando sempre la base.
 * Script classico caricato dopo teatro/a7-registro-bilancio.js e teatro/b5-oggetti-icone.js. Regole: teatro/LEGGIMI.md.
 * QA: tools/qa-teatro-oggetti200.js. Bilancio ed elenco: production/oggetti-200.md.
 */

// ===========================================================================
// 1. TABELLE: tutti i numeri e i tetti delle meccaniche nuove (tick a 60 Hz, px logici 640×360)
// ===========================================================================
const OGGETTI_B5 = Object.freeze({
  totaleAtteso: 200,
  tetti: Object.freeze({
    famigli: 4,              // famigli B5 permanenti (oltre ai 4 di OGGETTI_D.clamp.famigli)
    scie: 36,                // pozze a terra vive insieme
    eco: 4,                  // salve d'eco in attesa
    lampi: 6,                // saette disegnate insieme
    proiettiliExtra: 12,     // colpi oltre OGGETTI_D.clamp.proiettiliGiocatore concessi a schegge e oggetti attivi
    moltDanno: 3.0,          // tetto del moltiplicatore dinamico del danno (furia, da fermo, pubblico…)
    moltCadenza: 2.2,        // tetto del moltiplicatore dinamico della cadenza
    cooldownMinTick: 5,      // mai meno di tanti tick fra due colpi
    puliziaDannoTot: 1.5,    // Cilindro del Primo Attore
    illesoDannoTot: 1.6,     // Grani d'Incenso
    tarloTot: 0.8,           // Tarlo del Legno
    notteDanno: 4.0,         // Luna nel Pozzo + Luna Nera
    invulnMinTick: 20,       // i-frames minimi anche con lo Specchio Rotto
    raccoltaPerTick: 5,      // quante monete/chiavi/bombe «contano» in un tick (un forziere, un dono)
    prezzoMin: 1,            // nessuno sconto porta un prezzo sotto 1
    bossStordimento: 0.4,    // sui boss gli stordimenti durano il 40%
    catenaScoppi: 6,         // scoppi a catena per tick (Castagnola)
  }),
  colpi: Object.freeze({
    divisioneDanno: 0.5, divisioneGittata: 80, divisioneApertura: 1.3, // schegge: danno, px, apertura (rad) all'indietro
    ritornoGittata: 2.4,     // il colpo che torna vive fino a 2,4 gittate (andata + ritorno)
    ritornoDanno: 0.6,       // al ritorno il colpo vale il 60% (all'andata trapassa: sennò non tornerebbe mai)
    crescitaRaggio: 0.5,     // il raggio cresce metà di quanto cresce il danno
    caricaTick: 90, caricaRaggio: 1.7, // 1,5 s senza sparare; il colpo caricato è più grande
    criticoMult: 3,
    rosaApertura: 0.16, retroDanno: 0.8, lateraliDanno: 0.5,
    ventaglioPasso: 0.17, ventaglioDanno: 0.7, anelloDanno: 0.6,
    ecoTick: 14, ecoDanno: 0.6,
    ondaRad: 0.05, ondaFreq: 0.09,
  }),
  scie: Object.freeze({
    ogniTick: 12,            // cadenza del danno delle pozze
    passoColpoPx: 20,        // un colpo lascia una pozza ogni tanti px
    passoPassiPx: 16,        // camminando se ne lascia una ogni tanti px
    tipi: Object.freeze({
      fuoco: Object.freeze({ r: 9, vita: 150, dannoMult: 0.3, brucia: 60, lento: 0, colore: '#f97316', alpha: 0.55 }),
      china: Object.freeze({ r: 11, vita: 210, dannoMult: 0, brucia: 0, lento: 50, colore: '#0b0704', alpha: 0.6 }),
      santa: Object.freeze({ r: 10, vita: 130, dannoMult: 0.4, brucia: 0, lento: 0, colore: '#93c5fd', alpha: 0.5 }),
      pozza: Object.freeze({ r: 44, vita: 480, dannoMult: 0.45, brucia: 0, lento: 0, colore: '#38bdf8', alpha: 0.5 }),
    }),
  }),
  nemici: Object.freeze({ lentoFattore: 0.5, lentoBoss: 0.8, geloTick: 60, geloBossTick: 20, scoppioDannoMult: 1.2, iellaVita: 1.6 }),
  difesa: Object.freeze({ spineRaggio: 46, ondaRaggio: 120, ondaSpintaPx: 26, furiaMult: 1.6, pocaVitaHalf: 2, scudoPrimaTick: 60 }),
  famigli: Object.freeze({
    seguiPx: 34, largoPx: 18, // distanza a cui seguono; sotto `largoPx` dal giocatore si scostano
    raccoglitore: Object.freeze({ velocita: 2.6, presaPx: 9 }),
    scudiero: Object.freeze({ distanzaPx: 22, raggioBlocco: 11, ricaricaTick: 30 }),
    torretta: Object.freeze({ gittataPx: 260, velocitaColpo: 3.6, raggioColpo: 3.5 }),
    pastore: Object.freeze({ danno: 1.6, cadenza: 1.0 }),
    lume: Object.freeze({ ogniTick: 30, bruciaTick: 50 }),
    bombarolo: Object.freeze({ ogniTick: 240, gittataPx: 220, danno: 6, dannoPerPiano: 1.5, raggio: 34, velocita: 3.2 }),
    cardellino: Object.freeze({ numero: 3, velocita: 2.3, danno: 2.5, ogniTick: 14, vitaTick: 720 }),
  }),
  attivi: Object.freeze({
    cordone: Object.freeze({ invulnTick: 180 }),
    clessidra: Object.freeze({ tick: 300, fattore: 0.5 }),
    tricTrac: Object.freeze({ colpi: 12, dannoMult: 1.2, raggio: 34, gittata: 130, velocita: 3.4 }),
    specchio: Object.freeze({ max: 24, dannoMult: 0.8, velocita: 1.3 }),
    salvadanaio: Object.freeze({ monete: 3 }),
    tazzulella: Object.freeze({ tick: 360, cadenza: 1.8, speedUp: 0.25 }),
    cilicio: Object.freeze({ costoHalf: 1, danno: 1.7 }),
    trampoli: Object.freeze({ px: 96, passoPx: 8, invulnTick: 40 }),
    turibolo: Object.freeze({ bruciaTick: 180, stordisciTick: 60 }),
    calamita: Object.freeze({ stordisciTick: 90, frazione: 0.8 }),
    calza: Object.freeze({ pesi: Object.freeze({ moneta: 40, cura: 25, bomba: 17, chiave: 18 }) }),
    topolino: Object.freeze({ pesi: Object.freeze({ moneta: 50, bomba: 25, chiave: 25 }) }),
  }),
  attiviPool: Object.freeze({ probTesoro: 0.2, probFucina: 0.3 }), // un oggetto attivo al posto del passivo
  gradimento: Object.freeze({ basso: 0.3, alto: 0.7 }),             // soglie di fischi e applausi (0..1)
  raccolta: Object.freeze({ magneteVelocita: 2.4, scintille: Object.freeze({ velocita: 3.6, gittata: 110, dannoMult: 0.7, raggio: 3.5 }) }),
  stanza: Object.freeze({ ondaIngresso: 150, monetaPulizia: Object.freeze([346, 176]), donoPulizia: Object.freeze([296, 214]) }),
  fonteBombaPropria: 'la tua bomba',                                // fonte del danno delle proprie bombe (a1)
  diario: Object.freeze({ colonne: 8, righe: 6, cellaL: 66, cellaA: 30, y0: 60 }),
  pannello: Object.freeze({ righe: 6 }),
});

/**
 * Chiavi nuove di `mod` e come si sommano fra più oggetti: [modo, tetto, pavimento].
 *   bool = acceso/spento · max = vince il più alto (fino al tetto) · somma = si sommano (fra pavimento e tetto)
 *   prob = 1 − Π(1 − p) fino al tetto · minPos = «ogni N»: vince l'N più piccolo, mai sotto il tetto
 *   ultimo = vale l'ultimo raccolto · lista = si accodano (al massimo `tetto`)
 */
const CHIAVI_B5 = Object.freeze({
  // colpi
  divisione: ['max', 3], ritorno: ['bool'], scia: ['ultimo'], sciaPassi: ['ultimo'], crescita: ['max', 1.5], caricato: ['max', 4],
  onda: ['bool'], retro: ['bool'], laterali: ['bool'], rosa: ['max', 5], eco: ['bool'], ogniN: ['lista', 3],
  critico: ['prob', 0.4], dispersione: ['somma', 0.45], cilecca: ['prob', 0.3], inceppo: ['ultimo'],
  // danno ai nemici
  rallenta: ['max', 180], gelo: ['prob', 0.25], primoColpo: ['max', 2.5], finisci: ['max', 0.25], dannoBoss: ['max', 1.5],
  dannoFermo: ['max', 1.6], cadenzaMoto: ['max', 1.4], pocaVita: ['max', 2.2], vitaPienaDanno: ['max', 1.5], vitaPienaCadenza: ['max', 1.2],
  uccisioneEsplode: ['max', 48], rubaVita: ['minPos', 6], uccisioneMoneta: ['prob', 0.15],
  // difesa e colpo subito
  scudoTempo: ['minPos', 900], invulnExtra: ['somma', 60, -30], spine: ['somma', 16], colpoStordisci: ['max', 120], colpoFuria: ['max', 420],
  salvaPiano: ['bool'], colpoOnda: ['minPos', 360], oboloMorte: ['minPos', 5], dannoDoppio: ['bool'],
  colpoPerdeMonete: ['somma', 6], colpoTarlo: ['somma', 0.16],
  // ingresso in stanza e stanza ripulita
  ingressoStordisci: ['max', 100], ingressoBrucia: ['max', 240], ingressoFulmine: ['max', 5], ingressoIella: ['prob', 0.6], fiutoSegreto: ['bool'],
  puliziaDanno: ['somma', 0.1], puliziaCarica: ['somma', 2], puliziaMoneta: ['prob', 0.5], puliziaIllesoCura: ['minPos', 2],
  puliziaCura: ['minPos', 3], illesoDanno: ['somma', 0.16], puliziaDono: ['prob', 0.4],
  // raccolta
  magnete: ['max', 120], monetaCura: ['minPos', 4], monetaScintille: ['max', 8], chiaveMoneta: ['somma', 2], bombaDoppia: ['bool'],
  immuneBombe: ['bool'], pianoBombe: ['somma', 2], pianoChiavi: ['somma', 2],
  // pubblico e notte
  gradimentoDanno: ['somma', 0.5], gradimentoCadenza: ['somma', 0.4], fischiDanno: ['max', 1.5], applausiDanno: ['ultimo'], lunario: ['max', 0.8],
  // bottega e stanze speciali
  sconto: ['prob', 0.6], scontoFisso: ['somma', 2, -2], acquistoSangue: ['max', 1], pattoGratis: ['somma', 3], tesoroBis: ['prob', 0.6],
  rivelaEffetti: ['bool'], segretaVista: ['bool'], pastori: ['max', 3], auraBrucia: ['max', 60],
});

/** Testi mostrati al giocatore dal codice (banner): DA APPROVARE DALL'AUTORE insieme a nomi, effetti e lore. */
const TESTI_B5 = Object.freeze({
  scudoParato: '☂ Parato! Lo scudo si riapre fra poco.',
  obolo: (n) => `🪙 OBOLO DEL BARCAIOLO: paghi ${n} monete e resti in scena!`,
  exVoto: '✚ EX VOTO: per grazia ricevuta resti in piedi con ½ Maschera!',
  fiuto: '🐽 Odore di tartufo: in questa stanza c\'è un passaggio murato…',
  iella: '🧿 Lo iettatore ha guardato un nemico: è più coriaceo!',
  fulmine: '⚡ FUOCO DI SANT\'ELMO!',
  indulgenza: '📜 INDULGENZA PLENARIA: questo Patto non ti costa Maschere.',
  tesoroBis: '🧳 DOPPIO FONDO: sotto c\'era un altro oggetto!',
  perseMonete: (n) => `Ti cadono ${n} monete!`,
  acquistoSangue: '⚖ La bilancia pesa anche te: -½ Maschera.',
  attivoPreso: (nome, desc) => `⚡ ${nome}: ${desc}`,
  attivoLasciato: (nome) => `Lasci ${nome}: resta qui se ci ripensi.`,
  bussolotto: '🎲 BUSSOLOTTO: gli oggetti della stanza cambiano!',
  bussolottoVuoto: '🎲 Niente da rimescolare qui: la carica resta.',
  cordone: '🎭 CALA IL SIPARIO: nessuno può toccarti per 3 secondi!',
  clessidra: '⏳ CLESSIDRA: il tempo dei nemici rallenta!',
  tricTrac: '🧨 TRIC-TRAC!',
  acquasantiera: '💧 ACQUASANTIERA: una pozza benedetta ai tuoi piedi.',
  specchio: (n) => `🪞 SPECCHIO DEL CAMERINO: ${n} proiettili tornano al mittente!`,
  specchioVuoto: '🪞 Nessun proiettile da rimandare: la carica resta.',
  salvadanaio: '🏺 SALVADANAIO ROTTO: raccogli le monete!',
  tazzulella: '☕ TAZZULELLA \'E CAFÈ: sei una furia per 6 secondi!',
  bacchetta: '🌿 LA BACCHETTA TREMA: il muro era finto!',
  bacchettaVuoto: '🌿 La bacchetta non trema: qui non c\'è niente. La carica resta.',
  cilicio: '⛓ CILICIO: ½ Maschera di penitenza, Danno x1.7 finché resti in questa stanza!',
  cilicioNo: '⛓ Troppo debole per la penitenza: la carica resta.',
  gabbia: '🐦 Tre cardellini volano sui nemici!',
  trampoli: '🤸 BALZO DEL SALTIMBANCO!',
  turibolo: '⛪ TURIBOLO: una nuvola d\'incenso ardente!',
  calamita: '🧲 CALAMITA: i nemici finiscono in mezzo alla stanza!',
  calza: Object.freeze({ moneta: '🧦 Dalla calza esce una moneta!', cura: '🧦 Dalla calza esce mezza Maschera!', bomba: '🧦 Dalla calza esce una bomba!', chiave: '🧦 Dalla calza esce una chiave!' }),
  diarioTitolo: '📖 DIARIO DEGLI OGGETTI',
  diarioIgnoto: 'Effetto: ??? — raccoglilo per scoprirlo.',
  diarioBloccato: (cond) => `🔒 Non ancora in scena: ${cond}`,
  diarioSezioni: Object.freeze({ passivi: 'Oggetti', attivi: 'Oggetti attivi [Q]', patti: 'Patti d\'Ombra', segreti: 'Oggetti segreti' }),
  pannelloPagina: (i, n) => `pagina ${i} / ${n} · PagSu/PagGiù`,
  inScena: (nome) => `${nome}. Ora può comparire nel Teatro.`,
});

// ===========================================================================
// 2. CATALOGO: i 120 oggetti nuovi. NOMI, EFFETTI E LORE SONO TESTI DA APPROVARE DALL'AUTORE.
// ===========================================================================
/** Passivi nuovi: [id, nome, tier, polarità, temi, effetto, lore, mod]. L'icona ha la stessa chiave dell'id. */
const RIGHE_PASSIVI_B5 = [
  // --- colpi che cambiano forma ---
  ['melagrana', 'Melagrana di Capodanno', 'base', 'positivo', ['cibo', 'sacro'], '[BASE] All\'impatto ogni colpo si divide in 2 schegge',
    'Si spacca a mezzanotte sulla soglia: ogni chicco, un colpo di fortuna.', { divisione: 2 }],
  ['rocchetto', 'Rocchetto di Seta Reale', 'forte', 'positivo', ['fili'], '[★ FORTE] I colpi trapassano i nemici e tornano indietro lungo il filo (al ritorno 60% del Danno) · +20 Gittata',
    'Seta di San Leucio avvolta stretta: quello che lanci, ritorna.', { ritorno: true, rangeUp: 20 }],
  ['olio-lucerna', 'Olio di Lucerna', 'base', 'positivo', ['fuoco'], '[BASE] I colpi lasciano a terra una scia di fuoco',
    'Gocciola dal lume e accende il selciato dei vicoli.', { scia: 'fuoco' }],
  ['china-copista', 'China del Copista', 'base', 'positivo', ['ombra'], '[BASE] I colpi lasciano macchie di china che rallentano i nemici',
    'Il copista di corte la versava sui nomi da dimenticare.', { scia: 'china' }],
  ['acqua-montevergine', 'Acqua Santa di Montevergine', 'forte', 'positivo', ['sacro'], '[★ FORTE] Camminando lasci una scia benedetta che ferisce i nemici',
    'Portata a piedi dal santuario: benedice la strada di chi cammina.', { sciaPassi: 'santa' }],
  ['struffolo', 'Struffolo Rotolante', 'base', 'positivo', ['cibo'], '[BASE] I colpi crescono con la distanza: fino a Danno x2 a fine Gittata',
    'Rotola nel miele e s\'ingrossa a ogni giro.', { crescita: 1.0 }],
  ['archetto', 'Archetto di Violino', 'forte', 'positivo', ['fili', 'maschera'], '[★ FORTE] Se non spari per 1,5 s il prossimo colpo è caricato: Danno x3.5, enorme e perforante',
    'Il primo violino aspetta la battuta giusta, poi entra.', { caricato: 3.5 }],
  ['matita-censore', 'Matita del Censore', 'base', 'positivo', ['ombra', 'denari'], '[BASE] Ogni 12 colpi una raffica di 7 a ventaglio',
    'Cancella le righe scomode dei copioni.', { ogniN: { n: 12, tipo: 'ventaglio', colpi: 7 } }],
  ['cartella-tombola', 'Cartella della Tombola', 'base', 'positivo', ['denari'], '[BASE] Ogni 5° colpo è d\'oro: Danno x2.5',
    'Cinquina! Il quinto numero è sempre quello buono.', { ogniN: { n: 5, tipo: 'oro', mult: 2.5 } }],
  ['girandola', 'Girandola di Piedigrotta', 'forte', 'positivo', ['fuoco'], '[★ FORTE] Ogni 8 colpi un anello di 8 scintille infuocate attorno a te',
    'Gira, fischia e sputa fuoco sopra le teste della festa.', { ogniN: { n: 8, tipo: 'anello', colpi: 8 } }],
  ['nastro-tarantella', 'Nastro della Tarantella', 'base', 'positivo', ['fili', 'maschera'], '[BASE] I colpi serpeggiano come un nastro · +0.4 Cadenza',
    'Chi lo tiene in mano non riesce a stare fermo.', { onda: true, cadenzaUp: 0.4 }],
  ['erma-giano', 'Erma di Giano', 'base', 'positivo', ['maschera'], '[BASE] Ogni colpo ne lancia un altro alle tue spalle',
    'Due facce di marmo nel parco della Reggia: una guarda avanti, una indietro.', { retro: true }],
  ['candelabro', 'Candelabro a Tre Bracci', 'forte', 'positivo', ['sacro', 'fuoco'], '[★ FORTE] Ogni colpo ne aggiunge due ai lati (a metà Danno) · +0.3 Danno',
    'Tre fiamme sull\'altare: una per chi parte, due per chi resta.', { laterali: true, dmgUp: 0.3 }],
  ['quaterna', 'Quaterna Secca', 'base', 'positivo', ['denari'], '[BASE] 15% dei colpi è un colpo d\'oro: Danno x3',
    'Quattro numeri giocati sulla ruota di Napoli. Ogni tanto escono.', { critico: 0.15 }],
  ['sorbetto', 'Sorbetto al Limone', 'base', 'positivo', ['cibo'], '[BASE] I colpi rallentano i nemici per 2 s · 8% di gelarli sul posto',
    'Neve del Matese e limoni: ferma il respiro, e pure i nemici.', { rallenta: 120, gelo: 0.08 }],
  ['guanto-sfida', 'Guanto di Sfida', 'base', 'positivo', ['maschera'], '[BASE] Il primo colpo su un nemico illeso fa Danno x2',
    'Si getta a terra davanti all\'avversario: il primo affondo è il tuo.', { primoColpo: 2 }],
  ['mannaia', 'Mannaia di Piazza Mercato', 'forte', 'positivo', ['ombra'], '[★ FORTE] I nemici comuni sotto il 18% di vita cadono subito · +0.3 Danno',
    'Il banco del macellaio e il palco del boia stavano nella stessa piazza.', { finisci: 0.18, dmgUp: 0.3 }],
  ['lancia-michele', 'Lancia di San Michele', 'forte', 'positivo', ['sacro'], '[★ FORTE] Danno x1.5 contro i boss · +0.3 Danno',
    'L\'arcangelo la tiene puntata sul drago da mille anni senza stancarsi.', { dannoBoss: 1.5, dmgUp: 0.3 }],
  // --- uccisioni e movimento ---
  ['castagnola', 'Castagnola', 'base', 'positivo', ['fuoco'], '[BASE] I nemici sconfitti scoppiano e feriscono quelli vicini',
    'Il botto piccolo dei bambini a Capodanno: uno tira l\'altro.', { uccisioneEsplode: 38 }],
  ['sanguinaccio', 'Sanguinaccio di Carnevale', 'forte', 'positivo', ['cibo', 'ombra'], '[★ FORTE] Ogni 14 nemici sconfitti rigeneri ½ Maschera',
    'Cioccolato scuro e un segreto che a Carnevale non si chiede.', { rubaVita: 14 }],
  ['borsellino', 'Borsellino del Gabelliere', 'base', 'positivo', ['denari'], '[BASE] 10% che un nemico sconfitto lasci una moneta',
    'Il gabelliere contava tutto, tranne quello che gli cadeva.', { uccisioneMoneta: 0.10 }],
  ['piedistallo-mimo', 'Piedistallo del Mimo', 'base', 'positivo', ['maschera'], '[BASE] Da fermo: Danno x1.4',
    'Chi ci sale diventa statua. E le statue non sbagliano.', { dannoFermo: 1.4 }],
  ['scarpette', 'Scarpette da Ballo', 'base', 'positivo', ['fili'], '[BASE] In movimento: Cadenza x1.25 · +0.10 Velocità',
    'Consumate sulla punta: ballano anche senza la ballerina.', { cadenzaMoto: 1.25, speedUp: 0.1 }],
  // --- difesa e colpo subito ---
  ['ombrello', 'Ombrello di Corso Trieste', 'forte', 'positivo', ['maschera'], '[★ FORTE] Scudo a tempo: para un colpo, poi si riapre dopo 25 s',
    'Sotto la pioggia del Corso ripara da tutto, una goccia alla volta.', { scudoTempo: 1500 }],
  ['mantellina', 'Mantellina di San Gennaro', 'base', 'positivo', ['sacro'], '[BASE] Dopo un colpo subito resti intoccabile 0,8 s in più',
    'Il santo la stende su Napoli quando la montagna brontola.', { invulnExtra: 48 }],
  ['riccio', 'Riccio di Castagna', 'base', 'positivo', ['bestia', 'cibo'], '[BASE] Quando vieni colpito, i nemici vicini si pungono (Danno 8)',
    'Verde, tondo e pieno di spine: nessuno lo raccoglie due volte.', { spine: 8 }],
  ['campanaccio', 'Campanaccio del Pastore', 'base', 'positivo', ['bestia'], '[BASE] Quando vieni colpito tutti i nemici restano storditi 1,5 s',
    'Un colpo solo e il gregge intero si ferma a guardare.', { colpoStordisci: 90 }],
  ['peperoncini', 'Mazzetto di Peperoncini', 'base', 'positivo', ['cibo', 'fuoco'], '[BASE] Dopo un colpo subito: Danno x1.6 per 5 s',
    'Appeso alla porta contro l\'invidia. Morso, fa vedere rosso.', { colpoFuria: 300 }],
  ['ex-voto', 'Ex Voto d\'Argento', 'forte', 'positivo', ['sacro'], '[★ FORTE] Una volta per piano il colpo mortale ti lascia con ½ Maschera',
    'Una gamba d\'argento appesa in chiesa: per grazia ricevuta.', { salvaPiano: true }],
  ['angelo-cartapesta', 'Angelo di Cartapesta', 'forte', 'positivo', ['sacro', 'maschera'], '[★ FORTE] Quando vieni colpito un\'onda spazza i proiettili e respinge i nemici (ogni 8 s)',
    'Scende dal soffitto del teatro appeso a un filo, nell\'ultimo atto.', { colpoOnda: 480 }],
  ['obolo', 'Obolo del Barcaiolo', 'forte', 'positivo', ['denari', 'ombra'], '[★ FORTE] Con almeno 5 monete, il colpo mortale ti costa 5 monete invece della vita',
    'Il barcaiolo del Volturno passa tutti. Basta pagare.', { oboloMorte: 5 }],
  // --- famigli ---
  ['gazza', 'Gazza Ladra', 'base', 'positivo', ['bestia', 'denari'], '[BASE] Famiglio: una gazza che raccoglie le monete per te',
    'Ruba tutto quello che luccica, ma a te lo riporta.', { famB5: 'raccoglitore' }],
  ['pupo-paladino', 'Pupo Paladino', 'forte', 'positivo', ['fili', 'maschera'], '[★ FORTE] Famiglio: un paladino con lo scudo che para i proiettili davanti a te',
    'Armatura di latta, cuore di legno: si mette sempre in mezzo.', { famB5: 'scudiero' }],
  ['zampognaro', 'Zampognaro del Presepe', 'base', 'positivo', ['sacro', 'fili'], '[BASE] Famiglio: si pianta dove entri e spara al nemico più vicino (2.5 Danno)',
    'Scende dai monti a Natale e suona fermo sulla porta.', { famB5: 'torretta', famDmg: 2.5, famCadenza: 1.2 }],
  ['civetta', 'Civetta della Reggia', 'forte', 'positivo', ['bestia', 'ombra'], '[★ FORTE] Famiglio: mira da sola al nemico più vicino (2.6 Danno, rapida)',
    'Dal cornicione della Reggia vede tutto quello che si muove di notte.', { famiglio: 'tiratore', mira: 'auto', famDmg: 2.6, famCadenza: 1.1 }],
  ['topolino', 'Topolino del Suggeritore', 'base', 'positivo', ['bestia', 'maschera'], '[BASE] Famiglio: a stanza ripulita ogni tanto ti porta una moneta, una bomba o una chiave',
    'Abita nella buca del suggeritore e sa dove cade ogni cosa.', { famB5: 'seguace', puliziaDono: 0.25 }],
  ['lucciola-barattolo', 'Lucciola in Barattolo', 'base', 'positivo', ['bestia', 'fuoco'], '[BASE] Famiglio: scaccia il buio del Lume Spento e scotta i nemici vicini',
    'Presa alla Villa Comunale in una sera d\'estate che non finisce.', { famB5: 'lume', auraBrucia: 46 }],
  ['cane-pastore', 'Cane del Pastore', 'forte', 'positivo', ['bestia'], '[★ FORTE] Famiglio: un cane che azzanna i nemici (4.5 Danno)',
    'Bianco come le pecore che guarda, e molto meno paziente.', { famiglio: 'contatto', famDmg: 4.5 }],
  ['ciuccio', 'Ciuccio del Presepe', 'base', 'positivo', ['bestia', 'sacro'], '[BASE] Famiglio da soma: +1 bomba e +1 chiave subito e a ogni piano',
    'Porta la soma senza lamentarsi. Quasi.', { famB5: 'seguace', subitoBombe: 1, subitoChiavi: 1, pianoBombe: 1, pianoChiavi: 1 }],
  ['fuochista', 'Fuochista di Piedigrotta', 'forte', 'positivo', ['fuoco', 'fili'], '[★ FORTE] Famiglio: ogni 4 s lancia un petardo sul nemico più vicino',
    'Ha perso due dita e nessuna voglia di smettere.', { famB5: 'bombarolo' }],
  // --- ingresso in stanza ---
  ['grancassa', 'Grancassa della Banda', 'base', 'positivo', ['maschera'], '[BASE] Entrando in una stanza un colpo di grancassa stordisce i nemici per 1,2 s',
    'Quando entra la banda, pure i gatti si fermano.', { ingressoStordisci: 72 }],
  ['zolfo', 'Zolfo della Solfatara', 'forte', 'positivo', ['fuoco'], '[★ FORTE] Entrando in una stanza tutti i nemici prendono fuoco',
    'Giallo e puzzolente, raccolto dove la terra fuma.', { ingressoBrucia: 180 }],
  ['fuoco-elmo', 'Fuoco di Sant\'Elmo', 'forte', 'positivo', ['sacro', 'fuoco'], '[★ FORTE] Entrando in una stanza una saetta colpisce il nemico più forte (Danno x4)',
    'La fiamma azzurra sugli alberi delle navi, la notte prima della tempesta.', { ingressoFulmine: 4 }],
  ['naso-tartufaio', 'Naso del Tartufaio', 'base', 'positivo', ['bestia', 'cibo'], '[BASE] Fiuti i passaggi murati quando entri in una stanza · +15 Gittata',
    'Naso finto di cartone, fiuto vero: sente quello che i muri nascondono.', { fiutoSegreto: true, rangeUp: 15 }],
  // --- stanza ripulita ---
  ['cilindro-attore', 'Cilindro del Primo Attore', 'base', 'positivo', ['maschera'], '[BASE] A ogni stanza ripulita un inchino: +0.05 Danno fisso (fino a +1.5)',
    'Se lo toglie a ogni applauso. Ne vuole sempre un altro.', { puliziaDanno: 0.05 }],
  ['biglietto-bis', 'Biglietto del Bis', 'base', 'positivo', ['maschera', 'denari'], '[BASE] Ogni stanza ripulita ricarica una tacca in più dell\'oggetto attivo [Q]',
    'Strappato a metà: vale per la replica.', { puliziaCarica: 1 }],
  ['cassetta-elemosine', 'Cassetta delle Elemosine', 'base', 'positivo', ['sacro', 'denari'], '[BASE] 30% di una moneta in più a ogni stanza ripulita',
    'Chi dà ai poveri presta a Dio. Tu sei il povero.', { puliziaMoneta: 0.3 }],
  ['baba', 'Babà al Rum', 'forte', 'positivo', ['cibo'], '[★ FORTE] Ogni 2 stanze ripulite senza subire colpi rigeneri ½ Maschera',
    '«Si\' nu babbà»: il complimento più grande che c\'è.', { puliziaIllesoCura: 2 }],
  ['cera-vergine', 'Cera Vergine', 'base', 'positivo', ['sacro'], '[BASE] Ogni 4 stanze ripulite rigeneri ½ Maschera',
    'Cera d\'api per le candele buone: rattoppa anche le maschere.', { puliziaCura: 4 }],
  ['grani-incenso', 'Grani d\'Incenso', 'base', 'positivo', ['sacro'], '[BASE] Stanza ripulita senza subire colpi: +0.08 Danno fisso (fino a +1.6) · un colpo subito dimezza il bonus',
    'Brucia piano finché nessuno disturba la funzione.', { illesoDanno: 0.08 }],
  // --- raccolta di monete, chiavi e bombe ---
  ['ferro-calamitato', 'Ferro di Cavallo Calamitato', 'base', 'positivo', ['fuoco', 'bestia'], '[BASE] Monete, cuori, bombe e chiavi a terra volano verso di te',
    'Mastro Peppe giura che porta fortuna. Di sicuro porta spiccioli.', { magnete: 95 }],
  ['porcellino', 'Porcellino di Terracotta', 'base', 'positivo', ['denari', 'bestia'], '[BASE] Ogni 6 monete raccolte rigeneri ½ Maschera',
    'Si ingrassa di spiccioli e ti vuole bene.', { monetaCura: 6 }],
  ['zecchino', 'Zecchino Scintillante', 'forte', 'positivo', ['denari', 'fuoco'], '[★ FORTE] Ogni moneta raccolta sprigiona 6 scintille d\'oro tutt\'intorno',
    'Appena coniato: scotta ancora.', { monetaScintille: 6 }],
  ['mazzo-portinaio', 'Mazzo del Portinaio', 'base', 'positivo', ['denari'], '[BASE] +1 chiave subito e a ogni piano · ogni chiave raccolta porta anche una moneta',
    'Apre tutti i portoni del Corso. Il portinaio non lo sa che manca.', { subitoChiavi: 1, pianoChiavi: 1, chiaveMoneta: 1 }],
  ['fiasca-polvere', 'Fiasca di Polvere Nera', 'base', 'positivo', ['fuoco'], '[BASE] +2 bombe subito · ogni bomba raccolta vale doppio',
    'Asciutta nonostante la pioggia: le guardie la tenevano sotto il mantello.', { subitoBombe: 2, bombaDoppia: true }],
  ['santa-barbara', 'Santino di Santa Barbara', 'forte', 'positivo', ['sacro', 'fuoco'], '[★ FORTE] Le tue bombe non ti feriscono · +1 bomba subito e a ogni piano',
    'Protettrice di chi maneggia la polvere. E di chi le sta vicino.', { immuneBombe: true, subitoBombe: 1, pianoBombe: 1 }],
  // --- pubblico e notte ---
  ['rosa-loggione', 'Rosa dal Loggione', 'base', 'positivo', ['maschera'], '[BASE] +0.3 Danno · col favore del pubblico fino a Danno x1.35',
    'Lanciata dall\'ultima fila: è lì che siedono quelli che capiscono.', { dmgUp: 0.3, gradimentoDanno: 0.35 }],
  ['binocolo', 'Binocolo da Teatro', 'base', 'positivo', ['maschera', 'denari'], '[BASE] +0.3 Cadenza · col favore del pubblico fino a Cadenza x1.3',
    'Dal palco reale non si perde una mossa.', { cadenzaUp: 0.3, gradimentoCadenza: 0.3 }],
  ['pomodoro-marcio', 'Pomodoro Marcio', 'base', 'misto', ['cibo', 'maschera'], '[◐ MISTO] +0.4 Danno · se il pubblico fischia Danno x1.5, se applaude Danno x0.9',
    'Il giudizio del loggione, quando la serata va storta.', { dmgUp: 0.4, fischiDanno: 1.5, applausiDanno: 0.9 }],
  ['lunario', 'Lunario del Barbanera', 'base', 'positivo', ['ombra'], '[BASE] Nelle notti pari +0.8 Cadenza, nelle notti dispari +0.8 Danno',
    'Dice quando seminare, quando tagliarsi i capelli e quando menare.', { lunario: 0.8 }],
  ['luna-pozzo', 'Luna nel Pozzo', 'forte', 'positivo', ['ombra'], '[★ FORTE] +0.1 Danno fisso per ogni notte vissuta (fino a +2.0)',
    'Più notti passi a guardarla, più ti sembra di poterla prendere.', { notteDanno: 0.1, notteDannoMax: 2.0 }],
  // --- bottega e stanze speciali ---
  ['polizza-monte', 'Polizza del Monte di Pietà', 'base', 'positivo', ['denari'], '[BASE] Tutto nella Fucina costa il 25% in meno',
    'Un pegno riscattato: Mastro Peppe ti guarda con altri occhi.', { sconto: 0.25 }],
  ['bilancia-truccata', 'Bilancia Truccata', 'base', 'misto', ['denari', 'ombra'], '[◐ MISTO] La Fucina costa il 50% in meno, ma ogni acquisto ti toglie ½ Maschera',
    'Pesa sempre a favore di qualcuno. Stavolta, quasi di te.', { sconto: 0.5, acquistoSangue: 1 }],
  ['indulgenza', 'Indulgenza Plenaria', 'forte', 'positivo', ['sacro', 'ombra'], '[★ FORTE] Il prossimo Patto d\'Ombra non ti costa Maschere (una volta sola)',
    'Firmata, timbrata e pagata: il peccato di domani è già perdonato.', { pattoGratis: 1 }],
  ['doppio-fondo', 'Baule a Doppio Fondo', 'forte', 'positivo', ['denari', 'ombra'], '[★ FORTE] 40% che la stanza del tesoro nasconda un secondo oggetto',
    'Il baule del trovarobe: sotto i costumi c\'è sempre dell\'altro.', { tesoroBis: 0.4 }],
  // --- a rischio: forti, ma con un prezzo ---
  ['campana-vetro', 'Campana di Vetro', 'forte', 'misto', ['sacro'], '[◐ MISTO] ★ Danno x1.7 · ma ogni colpo subito ti toglie il doppio',
    'Protegge il santo dalla polvere. Dai sassi, no.', { dmgMult: 1.7, dannoDoppio: true }],
  ['moccolo', 'Moccolo dell\'Ultima Replica', 'base', 'misto', ['fuoco', 'ombra'], '[◐ MISTO] Con 1 Maschera o meno: Danno x1.9 · altrimenti -0.2 Danno',
    'Brucia meglio quando sta per finire.', { pocaVita: 1.9, dmgUp: -0.2 }],
  ['maschera-porcellana', 'Maschera di Porcellana', 'forte', 'misto', ['maschera'], '[◐ MISTO] ★ A Maschere piene: Danno x1.5 e Cadenza x1.2 · ferito, non dà nulla',
    'Bellissima finché non la tocchi.', { vitaPienaDanno: 1.5, vitaPienaCadenza: 1.2 }],
  ['fiasco-gragnano', 'Fiasco di Gragnano', 'base', 'misto', ['cibo'], '[◐ MISTO] +0.9 Danno · +0.5 Cadenza · ma la mira barcolla',
    'Rosso, frizzante e traditore.', { dmgUp: 0.9, cadenzaUp: 0.5, dispersione: 0.2 }],
  ['tromboncino', 'Tromboncino del Brigante', 'forte', 'misto', ['fuoco', 'ombra'], '[◐ MISTO] ★ Ogni sparo è una rosa di 5 pallettoni · -70 Gittata · Cadenza x0.7',
    'Caricato a chiodi e bestemmie sulle strade del Matese.', { rosa: 5, rangeUp: -70, dmgMult: 0.62, cadenzaMult: 0.7 }],
  // --- negativi ---
  ['tasca-bucata', 'Tasca Bucata', 'negativo', 'negativo', ['denari'], '[✗ NEGATIVO] Ogni colpo subito ti fa perdere 2 monete',
    'Ci infili la mano e trovi solo il buco.', { colpoPerdeMonete: 2 }],
  ['occhiali-appannati', 'Occhiali Appannati', 'negativo', 'negativo', ['maschera'], '[✗ NEGATIVO] La mira barcolla',
    'Li aveva dimenticati il suggeritore. Ora si capisce perché sbagliava le battute.', { dispersione: 0.28 }],
  ['gatto-nero', 'Gatto Nero', 'negativo', 'negativo', ['bestia', 'ombra'], '[✗ NEGATIVO] 15% dei colpi fa cilecca',
    'Ti attraversa la strada ogni volta che stai per colpire.', { cilecca: 0.15 }],
  ['specchio-rotto', 'Specchio Rotto', 'negativo', 'negativo', ['maschera', 'ombra'], '[✗ NEGATIVO] Dopo un colpo subito resti intoccabile per meno tempo (-0,4 s)',
    'Sette anni di guai, dicono. Qui la notte non finisce mai.', { invulnExtra: -24 }],
  ['miele-rappreso', 'Miele Rappreso', 'negativo', 'negativo', ['cibo', 'bestia'], '[✗ NEGATIVO] I tuoi colpi volano lenti e appiccicosi',
    'Dolce, denso e pieno di vespe addormentate.', { velocitaColpo: 0.62 }],
  ['iettatore', 'Monocolo dello Iettatore', 'negativo', 'negativo', ['ombra'], '[✗ NEGATIVO] In ogni stanza, una volta su tre, un nemico comune ha il 60% di vita in più',
    'Basta che ti guardi una volta. Meglio fare le corna.', { ingressoIella: 0.34 }],
  ['tarlo', 'Tarlo del Legno', 'negativo', 'negativo', ['bestia', 'fili'], '[✗ NEGATIVO] Ogni colpo subito: -0.08 Danno fisso (fino a -0.8)',
    'Scava piano dentro la marionetta. Lo senti solo la notte.', { colpoTarlo: 0.08 }],
  ['carlino-falso', 'Carlino Falso', 'negativo', 'negativo', ['denari'], '[✗ NEGATIVO] Nella Fucina tutto costa 1 moneta in più',
    'Suona male sull\'incudine. Mastro Peppe se n\'è accorto.', { scontoFisso: -1 }],
  ['filo-ingarbugliato', 'Filo Ingarbugliato', 'negativo', 'negativo', ['fili'], '[✗ NEGATIVO] Ogni 8 colpi i fili s\'ingarbugliano: 0,6 s senza sparare',
    'Più tiri, più si annoda.', { inceppo: { n: 8, tick: 36 } }],
  ['ceppi-galeotto', 'Ceppi del Galeotto', 'negativo', 'negativo', ['fili'], '[✗ NEGATIVO] -0.2 Velocità · -0.3 Cadenza',
    'Ferro ai polsi e alle caviglie: la marionetta peggio legata del regno.', { speedUp: -0.2, cadenzaUp: -0.3 }],
  ['ruggine', 'Ruggine della Chiusa', 'negativo', 'negativo', ['fuoco'], '[✗ NEGATIVO] -0.6 Danno fisso',
    'Mangia il ferro buono, un inverno alla volta.', { flatDmg: -0.6 }],
  ['pane-raffermo', 'Pane Raffermo', 'negativo', 'negativo', ['cibo'], '[✗ NEGATIVO] +1 Maschera Massima (vuota) · -0.4 Danno',
    'Riempie la pancia e spegne la voglia.', { bonusMaxHp: 2, dmgUp: -0.4 }],
  // --- solo numeri ---
  ['zeppola', 'Zeppola di San Giuseppe', 'base', 'positivo', ['cibo', 'sacro'], '[BASE] +1 Maschera Massima · Rigenera +1 Maschera · +0.2 Cadenza',
    'Fritta il diciannove di marzo, con la crema e l\'amarena in cima.', { bonusMaxHp: 2, healOnEquip: 2, cadenzaUp: 0.2 }],
  ['friarielli', 'Friarielli e Salsiccia', 'base', 'positivo', ['cibo'], '[BASE] +0.5 Danno · +0.25 Cadenza',
    'Amari al punto giusto: rimettono in piedi un morto.', { dmgUp: 0.5, cadenzaUp: 0.25 }],
  ['treccia-bufala', 'Treccia di Bufala', 'base', 'positivo', ['cibo', 'bestia'], '[BASE] +1 Maschera Massima · Rigenera +1 Maschera · +0.10 Velocità',
    'Dalle bufale del Volturno: ancora tiepida di siero.', { bonusMaxHp: 2, healOnEquip: 2, speedUp: 0.1 }],
  ['limone-sorrento', 'Limone di Sorrento', 'base', 'positivo', ['cibo'], '[BASE] +0.6 Cadenza · +15 Gittata',
    'Grosso come un pugno, aspro come la verità.', { cadenzaUp: 0.6, rangeUp: 15 }],
  ['ragu', 'Ragù della Domenica', 'forte', 'positivo', ['cibo'], '[★ FORTE] +1 Maschera Massima · Rigenera 3 Maschere · +0.5 Danno',
    'Deve pippiare dall\'alba. La pazienza è l\'ingrediente.', { bonusMaxHp: 2, healOnEquip: 6, dmgUp: 0.5 }],
  ['rosario-corallo', 'Rosario di Corallo', 'base', 'positivo', ['sacro'], '[BASE] +0.4 Danno · +0.3 Cadenza · +15 Gittata',
    'Grani rossi di Torre del Greco, consumati dal pollice.', { dmgUp: 0.4, cadenzaUp: 0.3, rangeUp: 15 }],
  ['sigillo-borbone', 'Sigillo dei Borbone', 'forte', 'positivo', ['denari'], '[★ FORTE] +0.7 Danno · +0.4 Cadenza · +20 Gittata',
    'Tre gigli in ceralacca: apre porte che le chiavi non aprono.', { dmgUp: 0.7, cadenzaUp: 0.4, rangeUp: 20 }],
  ['filo-ferro', 'Filo di Ferro', 'base', 'positivo', ['fili', 'fuoco'], '[BASE] +0.5 Danno · +25 Gittata',
    'Trafilato alla fucina: tiene su le marionette pesanti.', { dmgUp: 0.5, rangeUp: 25 }],
  ['croce-comando', 'Croce di Comando', 'forte', 'positivo', ['fili'], '[★ FORTE] Danno x1.2 · +0.5 Cadenza · +0.2 Velocità',
    'Il legno a croce da cui pendono i fili. In mano tua, per una volta.', { dmgMult: 1.2, cadenzaUp: 0.5, speedUp: 0.2 }],
  ['dente-lupo', 'Dente di Lupo del Matese', 'base', 'positivo', ['bestia'], '[BASE] +0.7 Danno',
    'Legato al collo dei pastori: il lupo riconosce i suoi.', { dmgUp: 0.7 }],
  ['tenaglie', 'Tenaglie di Gaetano', 'forte', 'positivo', ['fuoco'], '[★ FORTE] +1.2 Danno fisso · Danno x1.2',
    'Hanno ancora il segno delle sue mani sui manici.', { flatDmg: 1.2, dmgMult: 1.2 }],
  ['ombra-lunga', 'Ombra Lunga', 'base', 'positivo', ['ombra'], '[BASE] +45 Gittata · +0.3 Danno',
    'Al tramonto arriva prima di te in fondo alla strada.', { rangeUp: 45, dmgUp: 0.3 }],
];

/** Passivi nuovi come oggetti del catalogo (il prezzo lo fissa registraCatalogoB5 da ECONOMIA_T3). */
const PASSIVI_B5 = RIGHE_PASSIVI_B5.map(([id, nome, tier, polarita, temi, statsDesc, lore, mod]) =>
  ({ id, sprite: id, nome, tier, polarita, temi, statsDesc, lore, mod }));

/** Patti d'Ombra nuovi (stessa forma di CATALOGO_PATTO). */
const PATTI_B5 = [
  { id: 'patto_eco', sprite: 'patto_eco', polarita: 'positivo', nome: 'Ombra Gemella', tier: 'patto', temi: ['ombra', 'maschera'], costoMaxHpHalf: 4,
    statsDesc: '[😈 PATTO] Un\'ombra ripete ogni tuo colpo dopo un istante (60% del Danno)',
    lore: 'La tua ombra si stacca dal muro e impara a fare quello che fai tu.', mod: { eco: true } },
  { id: 'patto_fame', sprite: 'patto_fame', polarita: 'positivo', nome: 'Fame del Velo', tier: 'patto', temi: ['ombra', 'bestia'], costoMaxHpHalf: 2,
    statsDesc: '[😈 PATTO] Ogni 9 nemici sconfitti rigeneri ½ Maschera · +0.4 Danno',
    lore: 'Il Velo mangia i ricordi. Tu impari a mangiare con lui.', mod: { rubaVita: 9, dmgUp: 0.4 } },
  { id: 'patto_trenta', sprite: 'patto_trenta', polarita: 'misto', nome: 'Trenta Denari', tier: 'patto', temi: ['ombra', 'denari'], costoMaxHpHalf: 2,
    statsDesc: '[😈 PATTO] +15 monete subito · ogni colpo subito ti fa perdere 3 monete',
    lore: 'Contali pure: sono giusti. È il resto che non torna.', mod: { moneteSubito: 15, colpoPerdeMonete: 3 } },
  { id: 'patto_luna_nera', sprite: 'patto_luna_nera', polarita: 'positivo', nome: 'Luna Nera', tier: 'patto', temi: ['ombra'], costoMaxHpHalf: 2,
    statsDesc: '[😈 PATTO] +0.2 Danno fisso per ogni notte vissuta (fino a +3.0)',
    lore: 'La notte immobile ha una luna che nessuno guarda. Lei guarda te.', mod: { notteDanno: 0.2, notteDannoMax: 3.0 } },
  { id: 'patto_nodo', sprite: 'patto_nodo', polarita: 'positivo', nome: 'Nodo Scorsoio', tier: 'patto', temi: ['ombra', 'fili'], costoMaxHpHalf: 2,
    statsDesc: '[😈 PATTO] I colpi rallentano i nemici · i nemici comuni sotto il 25% di vita cadono subito',
    lore: 'Un filo d\'oro annodato a cappio: stringe da solo.', mod: { rallenta: 150, finisci: 0.25 } },
  { id: 'patto_candela', sprite: 'patto_candela', polarita: 'misto', nome: 'Candela Nera', tier: 'patto', temi: ['ombra', 'fuoco'], costoMaxHpHalf: 2,
    statsDesc: '[😈 PATTO] Con 1 Maschera o meno: Danno x2.2 · +2 Maschere di Cera',
    lore: 'Si accende per chiedere il male di qualcuno. Stanotte, del Velo.', mod: { pocaVita: 2.2, ceraExtra: 4 } },
];

/** Oggetti segreti nuovi (stessa forma di CATALOGO_SEGRETO). */
const SEGRETI_B5 = [
  { id: 'lanterna_munaciello', sprite: 'lanterna_munaciello', polarita: 'positivo', nome: 'Lanterna del Munaciello', tier: 'segreto', temi: ['ombra', 'fuoco'],
    statsDesc: '[👁 SEGRETO] La Stanza Segreta di ogni piano è già segnata sulla mappa',
    lore: 'Il piccolo monaco la lascia accesa nei cunicoli per chi gli sta simpatico.', mod: { segretaVista: true } },
  { id: 'tombola_piena', sprite: 'tombola_piena', polarita: 'positivo', nome: 'Tombola Piena', tier: 'segreto', temi: ['denari'],
    statsDesc: '[👁 SEGRETO] +7 monete · +3 bombe · +3 chiavi · salute ripristinata',
    lore: 'Tutti e quindici i numeri: il panariello è tuo.', mod: { moneteSubito: 7, subitoBombe: 3, subitoChiavi: 3, curaTotale: true } },
  { id: 'corona_latta', sprite: 'corona_latta', polarita: 'positivo', nome: 'Corona di Latta', tier: 'segreto', temi: ['denari', 'maschera'],
    statsDesc: '[👁 SEGRETO] Nella Fucina tutto costa la metà · +0.5 Danno',
    lore: 'La corona del re di scena. Mastro Peppe s\'inchina lo stesso.', mod: { sconto: 0.5, dmgUp: 0.5 } },
  { id: 'presepe_intero', sprite: 'presepe_intero', polarita: 'positivo', nome: 'Presepe Intero', tier: 'segreto', temi: ['sacro', 'fili'],
    statsDesc: '[👁 SEGRETO] Tre pastorelli ti seguono e sparano da soli (1.6 Danno ciascuno)',
    lore: 'Tutte le statuine di San Gregorio Armeno, in fila dietro di te.', mod: { pastori: 3 } },
  { id: 'occhio_lucia', sprite: 'occhio_lucia', polarita: 'positivo', nome: 'Occhi di Santa Lucia', tier: 'segreto', temi: ['sacro'],
    statsDesc: '[👁 SEGRETO] Vedi l\'effetto di ogni oggetto prima di prenderlo · +30 Gittata',
    lore: 'Due occhi su un piattino d\'argento: vedono quello che tu non sai ancora.', mod: { rivelaEffetti: true, rangeUp: 30 } },
];

/** Oggetti attivi nuovi: [id, nome, cariche, tier (prezzo in Fucina), temi, effetto, lore]. Tasto Q. */
const RIGHE_ATTIVI_B5 = [
  ['bussolotto', 'Bussolotto della Bisca', 3, 'base', ['denari'], 'Rimescola gli oggetti della stanza: piedistallo e banchi cambiano',
    'Tre dadi, un bicchiere di cuoio e la faccia tosta di ritirare.'],
  ['cordone-sipario', 'Cordone del Sipario', 3, 'base', ['maschera', 'fili'], 'Cala il sipario: via tutti i proiettili e 3 s senza poter essere colpito',
    'Un colpo secco e la scena sparisce. Anche per chi ti stava sparando.'],
  ['clessidra', 'Clessidra della Specola', 3, 'forte', ['ombra'], 'Per 5 s nemici e proiettili si muovono a metà velocità',
    'La sabbia scende piano. In questa notte, quasi per niente.'],
  ['tric-trac', 'Tric-Trac di Capodanno', 2, 'base', ['fuoco'], 'Dodici petardi esplosivi partono in cerchio attorno a te',
    'Chi spara a mezzanotte scaccia il male dell\'anno vecchio.'],
  ['acquasantiera', 'Acquasantiera', 3, 'base', ['sacro'], 'Versa una pozza d\'acqua santa: per 8 s ferisce i nemici che la toccano',
    'Presa in prestito da San Sebastiano. Si restituisce, prima o poi.'],
  ['specchio-camerino', 'Specchio del Camerino', 3, 'forte', ['maschera'], 'I proiettili nemici in volo diventano tuoi e tornano al mittente',
    'Circondato di lumini: rimanda indietro tutto quello che riceve.'],
  ['salvadanaio', 'Salvadanaio di Creta', 6, 'base', ['denari'], 'Rompilo: 3 monete rotolano a terra',
    'Per aprirlo c\'è un modo solo.'],
  ['tazzulella', 'Tazzulella \'e Cafè', 2, 'base', ['cibo'], 'Per 6 s: Cadenza x1.8 e Velocità più alta',
    'Amaro, bollente, in tre sorsi. Poi il mondo corre.'],
  ['bacchetta-rabdomante', 'Bacchetta del Rabdomante', 3, 'base', ['ombra', 'denari'], 'Apre il passaggio murato della stanza, se c\'è; se non c\'è, la carica resta',
    'Un ramo di nocciolo a forcella: trema dove il muro è finto.'],
  ['cilicio', 'Cilicio del Penitente', 2, 'forte', ['sacro', 'ombra'], 'Paghi ½ Maschera: Danno x1.7 finché resti in questa stanza',
    'Chi soffre in silenzio colpisce più forte. Così dicevano.'],
  ['gabbia-cardellini', 'Gabbia dei Cardellini', 3, 'base', ['bestia'], 'Liberi 3 cardellini che beccano i nemici per 12 s',
    'La portava il venditore di numeri: l\'uccellino sceglieva il biglietto.'],
  ['trampoli', 'Trampoli del Saltimbanco', 2, 'base', ['maschera', 'fili'], 'Un balzo dove guardi: attraversi nemici e proiettili senza danni',
    'Due passi dei suoi valgono dieci dei tuoi.'],
  ['turibolo', 'Turibolo d\'Ottone', 3, 'base', ['sacro', 'fuoco'], 'Una nuvola d\'incenso ardente: i nemici prendono fuoco e restano storditi 1 s',
    'Dondola tre volte. Alla terza, la navata è piena di fumo.'],
  ['calamita', 'Calamita del Fabbro', 2, 'base', ['fuoco'], 'Trascina i nemici comuni al centro della stanza e li stordisce 1,5 s',
    'Gaetano ci raccoglieva i chiodi caduti. Tu, qualcos\'altro.'],
  ['calza-befana', 'Calza della Befana', 5, 'base', ['cibo', 'denari'], 'Ne esce una sorpresa: una moneta, mezza Maschera, una bomba o una chiave',
    'Carbone per i cattivi. Tu speri di essere stato buono.'],
];

const ATTIVI_B5 = RIGHE_ATTIVI_B5.map(([id, nome, maxCarica, tier, temi, effetto, lore]) => ({
  id, sprite: id, nome, maxCarica, tier, temi, lore, polarita: 'positivo', attivoB5: true,
  desc: `[Q] ${effetto}`, statsDesc: `[Q · ${maxCarica} cariche] ${effetto}`, mod: {},
}));

/**
 * SBLOCCHI degli oggetti nuovi: stessa forma e stesse condizioni di SBLOCCHI_A6 (boss, piano, notte, parla, flag,
 * sblocco), più { conosciuti: n } = oggetti scoperti nel Diario. TESTI DA APPROVARE DALL'AUTORE.
 */
const SBLOCCHI_B5 = Object.freeze([
  ['cane-pastore', [{ boss: 're-gatto' }], 'Sconfiggi il Gatto dei Quattro Canti'],
  ['gabbia-cardellini', [{ boss: 're-gatto' }], 'Sconfiggi il Gatto dei Quattro Canti'],
  ['ex-voto', [{ boss: 'colosso-statua' }], 'Sconfiggi il Custode di Marmo'],
  ['pupo-paladino', [{ boss: 'capitano-guardia' }], 'Sconfiggi il Capitano di Piombo'],
  ['fuochista', [{ boss: 'maestro-fucina' }], 'Sconfiggi lo Spezzafili d\'Ottone'],
  ['lancia-michele', [{ boss: 'donna-luciana' }], 'Sconfiggi Donna Luciana'],
  ['patto_eco', [{ boss: 'donna-luciana' }], 'Sconfiggi Donna Luciana'],
  ['girandola', [{ piano: 2 }], 'Arriva al Piano 2'],
  ['doppio-fondo', [{ piano: 3 }], 'Arriva al Piano 3'],
  ['specchio-camerino', [{ piano: 3 }], 'Arriva al Piano 3'],
  ['indulgenza', [{ piano: 4 }], 'Arriva al Piano 4'],
  ['cilicio', [{ piano: 5 }], 'Arriva al Piano 5 (secondo giro)'],
  ['lunario', [{ notte: 2 }], 'Arriva alla Notte 2'],
  ['clessidra', [{ notte: 3 }], 'Arriva alla Notte 3'],
  ['civetta', [{ notte: 4 }], 'Arriva alla Notte 4'],
  ['luna-pozzo', [{ notte: 5 }], 'Arriva alla Notte 5'],
  ['patto_luna_nera', [{ notte: 6 }], 'Arriva alla Notte 6'],
  ['rocchetto', [{ sblocco: 'agnese' }], 'Sblocca Agnese'],
  ['guanto-sfida', [{ sblocco: 'taddeo' }], 'Sblocca Taddeo'],
  ['maschera-porcellana', [{ sblocco: 'ombra' }], 'Sblocca l\'Ombra Senza Fili'],
  ['zecchino', [{ conosciuti: 30 }], 'Scopri 30 oggetti nel Diario'],
  ['occhio_lucia', [{ conosciuti: 60 }], 'Scopri 60 oggetti nel Diario'],
  ['presepe_intero', [{ conosciuti: 100 }], 'Scopri 100 oggetti nel Diario'],
].map(([oggetto, quando, condizione]) => Object.freeze({ id: `b5-${oggetto}`, cosa: Object.freeze({ oggetto }), quando, condizione })));

// ===========================================================================
// 3. REGISTRAZIONE NEI CATALOGHI E RICERCA UNIFICATA
// ===========================================================================
/** Aggiunge gli oggetti nuovi ai cataloghi di base (una volta sola) coi prezzi di ECONOMIA_T3. */
function registraCatalogoB5() {
  const prezzi = ECONOMIA_T3.prezzi;
  for (const o of PASSIVI_B5) {
    if (CATALOGO_OGGETTI.some((x) => x.id === o.id)) continue;
    o.prezzo = o.polarita === 'negativo' ? prezzi.negativo : (prezzi[o.tier] != null ? prezzi[o.tier] : prezzi.base);
    CATALOGO_OGGETTI.push(o);
  }
  for (const o of PATTI_B5) if (!CATALOGO_PATTO.some((x) => x.id === o.id)) CATALOGO_PATTO.push(o);
  for (const o of SEGRETI_B5) if (!CATALOGO_SEGRETO.some((x) => x.id === o.id)) CATALOGO_SEGRETO.push(o);
  for (const a of ATTIVI_B5) if (!OGGETTI_ATTIVI[a.id]) OGGETTI_ATTIVI[a.id] = a;
  // Tutti gli attivi (anche i tre di partenza) hanno ciò che serve a piedistallo, Fucina e Diario.
  for (const a of Object.values(OGGETTI_ATTIVI)) {
    a.attivoB5 = true;
    if (!a.tier) a.tier = 'base';
    if (!a.polarita) a.polarita = 'positivo';
    if (!a.statsDesc) a.statsDesc = `[Q · ${a.maxCarica} cariche] ${String(a.desc || '').replace(/^\[Q\]\s*/, '')}`;
    if (a.lore == null) a.lore = '';
    if (!a.mod) a.mod = {};
    a.prezzo = prezzi[a.tier] != null ? prezzi[a.tier] : prezzi.base;
  }
}
registraCatalogoB5();

let indiceExtraB5 = null;
let firmaIndiceB5 = '';

/** Indice per id di patti, segreti e attivi (i passivi li trova già trovaOggettoB di base). */
function extraPerIdB5() {
  const firma = `${CATALOGO_PATTO.length}|${CATALOGO_SEGRETO.length}|${Object.keys(OGGETTI_ATTIVI).length}`;
  if (!indiceExtraB5 || firma !== firmaIndiceB5) {
    indiceExtraB5 = new Map();
    for (const o of CATALOGO_PATTO) indiceExtraB5.set(o.id, o);
    for (const o of CATALOGO_SEGRETO) indiceExtraB5.set(o.id, o);
    for (const o of Object.values(OGGETTI_ATTIVI)) indiceExtraB5.set(o.id, o);
    firmaIndiceB5 = firma;
  }
  return indiceExtraB5;
}

const trovaOggettoBBaseB5 = trovaOggettoB;
/** Oggetto per id in TUTTI i cataloghi (passivi, patti, segreti, attivi): così anche questi si «conoscono» nel Diario. */
trovaOggettoB = function (id, ...resto) {
  return trovaOggettoBBaseB5.call(this, id, ...resto) || extraPerIdB5().get(id) || null;
};

/** Le quattro sezioni del catalogo completo: { chiave, titolo, voci }. */
function sezioniCatalogoB5() {
  const T = TESTI_B5.diarioSezioni;
  return [
    { chiave: 'passivi', titolo: T.passivi, voci: CATALOGO_OGGETTI },
    { chiave: 'attivi', titolo: T.attivi, voci: Object.values(OGGETTI_ATTIVI) },
    { chiave: 'patti', titolo: T.patti, voci: CATALOGO_PATTO },
    { chiave: 'segreti', titolo: T.segreti, voci: CATALOGO_SEGRETO },
  ];
}

/** Tutti gli oggetti del gioco in un elenco solo (i consumabili di a2 non sono oggetti). */
function tuttiGliOggettiB5() {
  return sezioniCatalogoB5().flatMap((s) => s.voci);
}

// ===========================================================================
// 4. SBLOCCHI (si appoggiano allo stato e alle notifiche di a6-progressione.js, se c'è)
// ===========================================================================
const A6_PRESENTE_B5 = typeof statoA6 === 'function' && typeof oggettoSbloccatoA6 === 'function' && typeof valutaSblocchiA6 === 'function';
const sblocchiB5 = { cache: null, cacheTick: -1, coda: [] };

function sbloccoB5(idOgg) {
  return SBLOCCHI_B5.find((s) => s.cosa.oggetto === idOgg) || null;
}

function statoSblocchiB5() {
  if (!sblocchiB5.cache || sblocchiB5.cacheTick !== tick) { sblocchiB5.cache = statoA6(); sblocchiB5.cacheTick = tick; }
  return sblocchiB5.cache;
}

/** true se l'oggetto può comparire nello slot attivo (senza a6, o con «sblocca tutto», sempre). */
function oggettoSbloccatoB5(idOgg) {
  const sb = sbloccoB5(idOgg);
  if (!sb || !A6_PRESENTE_B5 || tuttoSbloccatoA6()) return true;
  return Boolean(statoSblocchiB5().sbloccati[sb.id]);
}

function alternativaVeraB5(c, s, ft) {
  if (c.conosciuti) return conosciutiD().length >= c.conosciuti;
  return alternativaVeraA6(c, s, ft);
}

if (A6_PRESENTE_B5) {
  const oggettoSbloccatoA6BaseB5 = oggettoSbloccatoA6;
  oggettoSbloccatoA6 = function (idOgg, ...resto) {
    return sbloccoB5(idOgg) ? oggettoSbloccatoB5(idOgg) : oggettoSbloccatoA6BaseB5.call(this, idOgg, ...resto);
  };

  const valutaSblocchiA6BaseB5 = valutaSblocchiA6;
  /** Dopo gli sblocchi di a6 valuta quelli di SBLOCCHI_B5 sullo stesso stato; la prima volta in uno slot, in silenzio. */
  valutaSblocchiA6 = function (s, ...resto) {
    const stato = s || statoA6();
    const nuovi = valutaSblocchiA6BaseB5.call(this, stato, ...resto);
    try {
      const ft = flagTramaA6();
      const primaVolta = !stato.sbloccati['b5-migrato'];
      let cambiato = primaVolta;
      stato.sbloccati['b5-migrato'] = true;
      let ancora = true;
      while (ancora) {
        ancora = false;
        for (const sb of SBLOCCHI_B5) {
          if (stato.sbloccati[sb.id] || !sb.quando.some((c) => alternativaVeraB5(c, stato, ft))) continue;
          stato.sbloccati[sb.id] = true;
          cambiato = true; ancora = true;
          if (!primaVolta) sblocchiB5.coda.push(sb);
        }
      }
      if (cambiato) { scriviA6(stato); sblocchiB5.cache = null; }
    } catch (err) { console.error('[B5] sblocchi', err); }
    return nuovi;
  };
}

/** Passa ad a6 (una alla volta, quando la sua coda è vuota) le notifiche «SBLOCCATO» degli oggetti nuovi. */
function smaltisciNotificheB5() {
  if (!A6_PRESENTE_B5 || !sblocchiB5.coda.length || a6.coda.length || a6.notifica) return;
  const sb = sblocchiB5.coda.shift();
  const o = trovaOggettoB(sb.cosa.oggetto);
  if (o) a6.coda.push({ testo: TESTI_B5.inScena(o.nome), nome: o.nome, sprite: o.sprite, personaggio: null });
}

const estraiOggettoPattoBaseB5 = estraiOggettoPatto;
/** I patti ancora bloccati non escono (si ripesca). */
estraiOggettoPatto = function (...args) {
  let o = estraiOggettoPattoBaseB5.apply(this, args);
  for (let k = 0; k < 12 && o && !oggettoSbloccatoB5(o.id); k++) o = estraiOggettoPattoBaseB5.apply(this, args);
  return o;
};

const estraiOggettoSegretoBaseB5 = estraiOggettoSegreto;
/** I segreti ancora bloccati non escono (si ripesca). */
estraiOggettoSegreto = function (...args) {
  let o = estraiOggettoSegretoBaseB5.apply(this, args);
  for (let k = 0; k < 12 && o && !oggettoSbloccatoB5(o.id); k++) o = estraiOggettoSegretoBaseB5.apply(this, args);
  return o;
};

// ===========================================================================
// 5. STATO DELLA RUN E STATISTICHE
// ===========================================================================
/** Stato delle meccaniche B5 per la run corrente (lo ricrea B5() quando cambia statoRun.numeroRun). */
function nuovoStatoB5() {
  return {
    run: statoRun.numeroRun, piano: null, stanzaRef: null, eraPulita: true, avevaNemici: false, stanzaTick: 0, colpitoInStanza: false,
    colpi: 0, colpiInceppo: 0, caricaTick: 0, eco: [],
    uccisioni: 0, contaVita: 0, catena: 0, inFinisci: false,
    scudoPronto: false, scudoTick: 0, furiaTick: 0, ondaTick: 0, exVotoPiano: 0,
    inchini: 0, illeso: 0, tarlo: 0, stanzePulite: 0, contaIlleso: 0, contaCura: 0,
    contaMonete: 0, ultimoMonete: null, ultimoChiavi: null, ultimoBombe: null, ultimoBaseMax: null,
    scie: [], famigli: [], ultimaSciaX: null, ultimaSciaY: null,
    pattiGratisUsati: 0, cilicioStanza: null, caffeTick: 0, clessidraTick: 0,
    moltDanno: 1, gradimento: null, tesoroBis: null, cariche: {},
  };
}

/** Stato B5 della run in corso. */
function B5() {
  if (!statoRun.b5 || statoRun.b5.run !== statoRun.numeroRun) statoRun.b5 = nuovoStatoB5();
  return statoRun.b5;
}

/** Somma il valore `v` della chiave `k` nell'accumulatore secondo CHIAVI_B5 (modo, tetto, pavimento). */
function aggregaB5(acc, k, v) {
  const [modo, tetto, pavimento] = CHIAVI_B5[k];
  if (modo === 'bool') acc[k] = acc[k] || Boolean(v);
  else if (modo === 'max') acc[k] = Math.min(tetto, Math.max(acc[k] || 0, v));
  else if (modo === 'somma') acc[k] = Math.max(pavimento != null ? pavimento : -Infinity, Math.min(tetto, (acc[k] || 0) + v));
  else if (modo === 'prob') acc[k] = Math.min(tetto, 1 - (1 - (acc[k] || 0)) * (1 - v));
  else if (modo === 'minPos') acc[k] = Math.max(tetto, acc[k] ? Math.min(acc[k], v) : v);
  else if (modo === 'ultimo') acc[k] = v;
  else if (modo === 'lista') { if (!acc[k]) acc[k] = []; if (acc[k].length < tetto) acc[k].push(v); }
}

/** Statistiche B5 dagli oggetti equipaggiati (si leggono i `mod` del catalogo, come fa D: valgono anche i doppioni). */
function calcolaStatB5() {
  const T = OGGETTI_B5.tetti;
  const S = { attivo: false, famigli: [], notteDanno: 0 };
  const notti = getNumeroNotte();
  for (const item of statoRun.oggettiEquipaggiati) {
    const m = (trovaOggettoB(item.id) || item).mod || {};
    for (const k in m) {
      if (CHIAVI_B5[k]) { aggregaB5(S, k, m[k]); S.attivo = true; }
    }
    if (m.famB5 && S.famigli.length < T.famigli) { S.famigli.push({ id: item.id, tipo: m.famB5, dmg: m.famDmg || 0, cadenza: m.famCadenza || 1 }); S.attivo = true; }
    if (m.notteDanno) { S.notteDanno += Math.min(m.notteDannoMax || T.notteDanno, m.notteDanno * notti); S.attivo = true; }
  }
  S.notteDanno = Math.min(T.notteDanno, S.notteDanno);
  return S;
}

/** Bonus additivi che dipendono dalla run (inchini, incenso, tarlo, notti, caffè) come «oggetto virtuale» per la formula di base. */
function voceVirtualeB5(S, B) {
  const T = OGGETTI_B5.tetti;
  let flat = S.notteDanno || 0, dmgUp = 0, cad = 0, spd = 0;
  if (S.puliziaDanno) flat += Math.min(T.puliziaDannoTot, B.inchini * S.puliziaDanno);
  if (S.illesoDanno) flat += Math.min(T.illesoDannoTot, B.illeso * S.illesoDanno);
  if (B.tarlo) flat -= Math.min(T.tarloTot, B.tarlo);
  if (S.lunario) { if (getNumeroNotte() % 2 === 0) cad += S.lunario; else dmgUp += S.lunario; }
  if (B.caffeTick > 0) spd += OGGETTI_B5.attivi.tazzulella.speedUp;
  if (!flat && !dmgUp && !cad && !spd) return null;
  return { id: '__b5', sprite: '', nome: '', virtualeB5: true, mod: { flatDmg: flat, dmgUp, cadenzaUp: cad, speedUp: spd } };
}

/** Allinea i famigli B5 alle statistiche (tenendo posizione e ricarica di quelli che c'erano già). */
function sincronizzaFamigliB5() {
  const S = statoRun.statB5;
  if (!S) return;
  const B = B5();
  const vecchi = B.famigli;
  const prendi = (id, tipo) => {
    const i = vecchi.findIndex((f) => f.id === id && f.tipo === tipo && !f.temp);
    return i >= 0 ? vecchi.splice(i, 1)[0] : null;
  };
  const nuovi = [];
  for (const spec of S.famigli) {
    const posto = postoFamiglioB5(nuovi.length);
    const f = prendi(spec.id, spec.tipo) || { id: spec.id, tipo: spec.tipo, x: posto.x, y: posto.y, cd: 30, tx: posto.x, ty: posto.y, porta: null };
    f.dmg = spec.dmg; f.cadenza = spec.cadenza;
    nuovi.push(f);
  }
  for (let i = 0; i < (S.pastori || 0); i++) {
    const posto = postoFamiglioB5(nuovi.length);
    nuovi.push(prendi('presepe_intero', 'pastore') || { id: 'presepe_intero', tipo: 'pastore', sprite: 'b5_pastore', x: posto.x, y: posto.y, cd: 20 + i * 15 });
  }
  for (const f of vecchi) if (f.temp) nuovi.push(f);
  B.famigli = nuovi;
}

const ricalcolaStatisticheBaseB5 = ricalcolaStatistiche;
/** Calcola statoRun.statB5 e passa alla formula di base i bonus additivi di B5 (oggetto virtuale, tolto subito dopo). */
ricalcolaStatistiche = function (...args) {
  let virt = null;
  try {
    const B = B5();
    const S = calcolaStatB5();
    statoRun.statB5 = S;
    virt = voceVirtualeB5(S, B);
    if (virt) statoRun.oggettiEquipaggiati.push(virt);
  } catch (err) { console.error('[B5] statistiche', err); }
  try {
    return ricalcolaStatisticheBaseB5.apply(this, args);
  } finally {
    if (virt) {
      const i = statoRun.oggettiEquipaggiati.indexOf(virt);
      if (i >= 0) statoRun.oggettiEquipaggiati.splice(i, 1);
      if (statoRun.sinergieVisive) delete statoRun.sinergieVisive[virt.id];
    }
    try { sincronizzaFamigliB5(); } catch (err) { console.error('[B5] famigli', err); }
  }
};

/** Gradimento del pubblico 0..1 se un'altra squadra lo espone in interni.gradimentoPubblico; altrimenti null. */
function gradimentoB5() {
  try {
    const I = window.__teatro && window.__teatro.interni;
    let g = I ? I.gradimentoPubblico : undefined;
    if (typeof g === 'function') g = g();
    if (g && typeof g === 'object') g = g.valore != null ? g.valore : (g.livello != null ? g.livello : g.gradimento);
    if (typeof g !== 'number' || !Number.isFinite(g)) return null;
    if (g > 1) g /= 100;
    return Math.max(0, Math.min(1, g));
  } catch (_) { return null; }
}

/** Moltiplicatore dinamico del danno (da fermo, furia, poca vita, vita piena, cilicio, pubblico): un valore per tick. */
function aggiornaMoltDannoB5(S, B, st) {
  const D = OGGETTI_B5.difesa;
  const G = OGGETTI_B5.gradimento;
  let m = 1;
  if (S.dannoFermo > 1 && !player.moving) m *= S.dannoFermo;
  if (B.furiaTick > 0) m *= D.furiaMult;
  if (S.pocaVita > 1 && statoRun.hpHalf <= D.pocaVitaHalf) m *= S.pocaVita;
  if (S.vitaPienaDanno > 1 && statoRun.hpHalf >= statoRun.maxHpHalf) m *= S.vitaPienaDanno;
  if (B.cilicioStanza && st && B.cilicioStanza === st.id) m *= OGGETTI_B5.attivi.cilicio.danno;
  const g = B.gradimento;
  if (g != null) {
    if (S.gradimentoDanno) m *= 1 + S.gradimentoDanno * g;
    if (S.fischiDanno > 1) m *= g < G.basso ? S.fischiDanno : g > G.alto ? (S.applausiDanno || 1) : 1;
  }
  B.moltDanno = Math.min(OGGETTI_B5.tetti.moltDanno, m);
}

/** Moltiplicatore dinamico della cadenza al momento dello sparo (≥ 1). */
function moltCadenzaB5(S, B) {
  let f = 1;
  if (S.cadenzaMoto > 1 && player.moving) f *= S.cadenzaMoto;
  if (S.vitaPienaCadenza > 1 && statoRun.hpHalf >= statoRun.maxHpHalf) f *= S.vitaPienaCadenza;
  if (B.caffeTick > 0) f *= OGGETTI_B5.attivi.tazzulella.cadenza;
  if (B.gradimento != null && S.gradimentoCadenza) f *= 1 + S.gradimentoCadenza * B.gradimento;
  return Math.min(OGGETTI_B5.tetti.moltCadenza, f);
}

// ===========================================================================
// 6. COLPI: divisione, ritorno, scie, crescita, carica, onda, rose, eco…
// ===========================================================================
/** Copia del colpo `p` che parte dal giocatore con angolo `ang` e danno × `molt`. */
function copiaColpoB5(p, ang, molt) {
  const v = Math.hypot(p.vx, p.vy) || 4.2;
  return {
    ...p, x: player.x + Math.cos(ang) * 10, y: player.y - 6 + Math.sin(ang) * 10, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
    dist: 0, dmg: p.dmg * molt, hitIds: new Set(), orbitaD: p.orbitaD ? { ang, r: 10 } : null, b5: p.b5 ? { ...p.b5 } : null,
  };
}

function ruotaColpoB5(p, rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  const vx = p.vx * c - p.vy * s;
  p.vy = p.vx * s + p.vy * c;
  p.vx = vx;
}

/** Aggiunge una pozza a terra (scia di un colpo, passi benedetti, Acquasantiera). Tetto: OGGETTI_B5.tetti.scie. */
function aggiungiSciaB5(x, y, tipo) {
  const T = OGGETTI_B5.scie.tipi[tipo];
  if (!T) return;
  const B = B5();
  if (B.scie.length >= OGGETTI_B5.tetti.scie) B.scie.shift();
  B.scie.push({ x: Math.max(ARENA.x1, Math.min(ARENA.x2, x)), y: Math.max(ARENA.y1, Math.min(ARENA.y2, y)), tipo, vita: T.vita });
}

/** Dopo una salva del giocatore: i colpi da L[n0] in poi sono nuovi; applica le meccaniche B5 dei colpi. */
function dopoSparoB5(n0, dx, dy, eco) {
  const S = statoRun.statB5;
  const L = statoRun.proiettili;
  if (!S || L.length <= n0) return;
  const B = B5();
  const C = OGGETTI_B5.colpi;
  const tetto = OGGETTI_D.clamp.proiettiliGiocatore;
  const ang0 = Math.atan2(dy, dx);
  const primo = L[n0];
  const aggiungi = (p) => { if (L.length < tetto) L.push(p); };
  if (!eco) {
    B.colpi++;
    if (S.rosa > 1) for (let i = 1; i < S.rosa; i++) aggiungi(copiaColpoB5(primo, ang0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * C.rosaApertura, 1));
    if (S.retro) aggiungi(copiaColpoB5(primo, ang0 + Math.PI, C.retroDanno));
    if (S.laterali) { aggiungi(copiaColpoB5(primo, ang0 + Math.PI / 2, C.lateraliDanno)); aggiungi(copiaColpoB5(primo, ang0 - Math.PI / 2, C.lateraliDanno)); }
    for (const R of S.ogniN || []) {
      if (B.colpi % R.n !== 0) continue;
      if (R.tipo === 'ventaglio') {
        for (let i = 0; i < R.colpi; i++) aggiungi(copiaColpoB5(primo, ang0 + (i - (R.colpi - 1) / 2) * C.ventaglioPasso, C.ventaglioDanno));
      } else if (R.tipo === 'anello') {
        for (let i = 0; i < R.colpi; i++) {
          const p = copiaColpoB5(primo, (TAU * i) / R.colpi, C.anelloDanno);
          p.tipo = 'fuoco'; p.b5 = { brucia: true, figlio: true };
          aggiungi(p);
        }
      } else if (R.tipo === 'oro') { primo.dmg *= R.mult; primo.tipo = 'oro'; }
    }
  }
  const carico = !eco && S.caricato > 0 && B.caricaTick >= C.caricaTick;
  for (let i = L.length - 1; i >= n0; i--) {
    const p = L[i];
    if (S.cilecca && Math.random() < S.cilecca) { statoRun.effettiSplash.push({ x: p.x, y: p.y, tick: 0 }); L.splice(i, 1); continue; }
    const b = p.b5 || (p.b5 = {});
    if (eco) p.tipo = 'ombra';
    if (carico) { p.dmg *= S.caricato; p.r *= C.caricaRaggio; p.piercing = true; p.tipo = 'oro'; b.grande = C.caricaRaggio; }
    if (S.critico && Math.random() < S.critico) { p.dmg *= C.criticoMult; p.tipo = 'oro'; }
    if (S.dispersione) ruotaColpoB5(p, (Math.random() * 2 - 1) * S.dispersione);
    if (b.figlio) continue;
    if (S.divisione) b.div = S.divisione;
    if (S.ritorno && !p.orbitaD) { b.rit = 1; b.giro = p.maxDist; p.maxDist *= C.ritornoGittata; p.piercing = true; }
    if (S.scia) { b.scia = S.scia; b.sciaDa = 0; }
    if (S.crescita) { b.cresc = S.crescita; b.m = 1; b.r0 = p.r; b.gitt = p.maxDist; }
    if (S.onda && !p.orbitaD) b.onda = true;
  }
  if (carico) { statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 4, maxR: 26, color: '#f9cb40' }); AudioSys.playCampana(); }
  if (!eco && S.eco && B.eco.length < OGGETTI_B5.tetti.eco) B.eco.push({ t: tick + C.ecoTick, dx, dy });
}

const sparaProiettiliDirezioneBaseB5 = sparaProiettiliDirezione;
sparaProiettiliDirezione = function (dx, dy, dmgScale = 1.0, ...resto) {
  const n0 = statoRun.proiettili.length;
  const r = sparaProiettiliDirezioneBaseB5.call(this, dx, dy, dmgScale, ...resto);
  try { if (statoRun.statB5 && statoRun.statB5.attivo) dopoSparoB5(n0, dx, dy, false); } catch (err) { console.error('[B5] sparo', err); }
  return r;
};

const eseguiAttacco4DirezioniBaseB5 = eseguiAttacco4Direzioni;
/** Dopo ogni colpo partito: azzera la carica, applica la cadenza dinamica e l'eventuale inceppo. */
eseguiAttacco4Direzioni = function (dx, dy, ...resto) {
  const cdPrima = player.cooldown;
  const r = eseguiAttacco4DirezioniBaseB5.call(this, dx, dy, ...resto);
  try {
    const S = statoRun.statB5;
    if (S && statoRun.fase === 'in_gioco' && cdPrima <= 0 && player.cooldown > 0) {
      const B = B5();
      B.caricaTick = 0;
      const f = moltCadenzaB5(S, B);
      if (f > 1) player.cooldown = Math.max(OGGETTI_B5.tetti.cooldownMinTick, Math.round(player.cooldown / f));
      if (S.inceppo) { B.colpiInceppo++; if (B.colpiInceppo % S.inceppo.n === 0) player.cooldown += S.inceppo.tick; }
    }
  } catch (err) { console.error('[B5] attacco', err); }
  return r;
};

const aggiornaProiettileDBaseB5 = aggiornaProiettileD;
/** Prima del passo di ogni colpo: onda, crescita, ritorno e scia (solo se il colpo ha l'etichetta b5). */
aggiornaProiettileD = function (p, st, ...resto) {
  const r = aggiornaProiettileDBaseB5.call(this, p, st, ...resto);
  const b = p.b5;
  if (!b) return r;
  const C = OGGETTI_B5.colpi;
  if (b.onda) ruotaColpoB5(p, Math.cos(p.dist * C.ondaFreq) * C.ondaRad);
  if (b.cresc) {
    const m = 1 + b.cresc * Math.max(0, Math.min(1, p.dist / (b.gitt || 1)));
    p.dmg *= m / b.m;
    b.m = m;
    p.r = b.r0 * (1 + (m - 1) * C.crescitaRaggio);
  }
  if (b.rit === 1) {
    const nx = p.x + p.vx, ny = p.y + p.vy;
    if (p.dist >= b.giro || nx < ARENA.x1 - 4 || nx > ARENA.x2 + 4 || ny < ARENA.y1 - 4 || ny > ARENA.y2 + 4) { b.rit = 2; p.hitIds = new Set(); p.rimbalzi = 0; p.dmg *= C.ritornoDanno; }
  }
  if (b.rit === 2) {
    const ddx = player.x - p.x, ddy = player.y - 6 - p.y;
    const d = Math.hypot(ddx, ddy);
    const v = Math.hypot(p.vx, p.vy) || 4.2;
    if (d < v + 6) { p.dist = p.maxDist; b.div = 0; p.esplosiva = 0; } else { p.vx = (ddx / d) * v; p.vy = (ddy / d) * v; }
  }
  if (b.scia && p.dist - b.sciaDa >= OGGETTI_B5.scie.passoColpoPx) { b.sciaDa = p.dist; aggiungiSciaB5(p.x, p.y + 8, b.scia); }
  return r;
};

const esplodiDBaseB5 = esplodiD;
/** Quando un colpo finisce (impatto o fine gittata): le schegge della Melagrana partono all'indietro. */
esplodiD = function (p, st, ...resto) {
  const r = esplodiDBaseB5.call(this, p, st, ...resto);
  const b = p && p.b5;
  if (!b || !(b.div > 0) || b.diviso) return r;
  b.diviso = true;
  const C = OGGETTI_B5.colpi;
  const L = statoRun.proiettili;
  const tetto = OGGETTI_D.clamp.proiettiliGiocatore + OGGETTI_B5.tetti.proiettiliExtra;
  const a0 = Math.atan2(p.vy, p.vx) + Math.PI;
  const v = Math.hypot(p.vx, p.vy) || 4.2;
  const x = Math.max(ARENA.x1, Math.min(ARENA.x2, p.x)), y = Math.max(ARENA.y1, Math.min(ARENA.y2, p.y));
  for (let i = 0; i < b.div && L.length < tetto; i++) {
    const a = a0 + (i - (b.div - 1) / 2) * C.divisioneApertura;
    L.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, dist: 0, maxDist: C.divisioneGittata, dmg: p.dmg * C.divisioneDanno,
      r: Math.max(2.5, p.r * 0.7), tipo: p.tipo, piercing: false, overflowPierce: false, hitIds: new Set(p.hitIds), oming: p.oming || 0,
      rimbalzi: 0, orbitaD: null, esplosiva: 0, prossimita: false, bloccaProiettili: Boolean(p.bloccaProiettili), b5: { figlio: true },
    });
  }
  return r;
};

// ===========================================================================
// 7. DANNO AI NEMICI E COLPO SUBITO
// ===========================================================================
/** Rallenta un nemico per `ticks` (la velocità torna quella di prima allo scadere). */
function rallentaNemicoB5(n, ticks) {
  const N = OGGETTI_B5.nemici;
  if (!(n.lentoB5 > 0)) { n.speedB5 = n.speed; n.speed *= n.boss ? N.lentoBoss : N.lentoFattore; }
  n.lentoB5 = Math.max(n.lentoB5 || 0, ticks);
}

/** Rigenera `half` mezze maschere (true se ha curato). */
function curaB5(half) {
  if (statoRun.hpHalf >= statoRun.maxHpHalf) return false;
  statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + half);
  statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 4, maxR: 22, color: '#4ade80' });
  return true;
}

/** Una moneta a terra (non passa dal filtro del piano 1 di spawnaMonetaATerra: è un premio dell'oggetto). */
function monetaB5(x, y) {
  return { tipo: 'moneta', valore: 1, sprite: 'moneta1', x: Math.max(ARENA.x1 + 20, Math.min(ARENA.x2 - 20, x)), y: Math.max(ARENA.y1 + 20, Math.min(ARENA.y2 - 20, y)) };
}

/** Lascia a terra un dono estratto dai `pesi` ({ moneta, cura, bomba, chiave }); ritorna il tipo uscito. */
function lasciaDonoB5(st, x, y, pesi) {
  let tot = 0;
  for (const k in pesi) tot += pesi[k];
  let r = rng() * tot, tipo = 'moneta';
  for (const k in pesi) { r -= pesi[k]; if (r < 0) { tipo = k; break; } }
  if (tipo === 'cura') st.oggettiATerra.push({ tipo: 'cura', valore: 1, sprite: 'mezzaMaschera', x, y });
  else if (tipo !== 'moneta' && typeof spargiPezzoA1 === 'function') spargiPezzoA1(st, tipo, x, y);
  else { tipo = 'moneta'; st.oggettiATerra.push(monetaB5(x, y)); }
  return tipo;
}

const danneggiaNemicoBaseB5 = danneggiaNemico;
/** Moltiplicatori dinamici, bonus sui boss, primo colpo, colpi che rallentano/gelano, esecuzione sotto soglia. */
danneggiaNemico = function (nem, dmg, knockX, knockY, ...resto) {
  const S = statoRun.statB5;
  if (!S || !nem || statoRun.fase !== 'in_gioco') return danneggiaNemicoBaseB5.call(this, nem, dmg, knockX, knockY, ...resto);
  const B = B5();
  const diretto = Boolean(knockX || knockY);
  let d = dmg * (B.moltDanno || 1);
  if (nem.boss && S.dannoBoss > 1) d *= S.dannoBoss;
  if (diretto && S.primoColpo > 1 && nem.hp >= nem.maxHp) d *= S.primoColpo;
  const r = danneggiaNemicoBaseB5.call(this, nem, d, knockX, knockY, ...resto);
  if (diretto && nem.hp > 0) {
    const N = OGGETTI_B5.nemici;
    if (S.rallenta) rallentaNemicoB5(nem, S.rallenta);
    if (S.gelo && Math.random() < S.gelo) nem.stunTicks = Math.max(nem.stunTicks || 0, nem.boss ? N.geloBossTick : N.geloTick);
    if (S.finisci && !nem.boss && !B.inFinisci && nem.hp <= nem.maxHp * S.finisci) {
      B.inFinisci = true;
      try { danneggiaNemicoBaseB5.call(this, nem, nem.hp + 1, 0, 0); } finally { B.inFinisci = false; }
    }
  }
  return r;
};

/** Colpo parato da uno scudo B5: niente danno, i-frames, rimbalzo e un'onda del colore dato. */
function paraColpoB5(daX, daY, colore) {
  if (Number.isFinite(daX) && Number.isFinite(daY)) spingi(player, player.x - daX, player.y - daY, FEEL.iframes.rimbalzoPx);
  player.invuln = ticksDaMs(FEEL.iframes.durataMs);
  statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 6, maxR: 34, color: colore });
  AudioSys.playColpo();
}

/** Onda dell'Angelo di Cartapesta: via i proiettili vicini, nemici comuni respinti. */
function ondaAngeloB5(st) {
  const D = OGGETTI_B5.difesa;
  statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 8, maxR: D.ondaRaggio, color: '#fef3c7' });
  for (let j = statoRun.proiettiliNemici.length - 1; j >= 0; j--) {
    const pr = statoRun.proiettiliNemici[j];
    if (Math.hypot(pr.x - player.x, pr.y - player.y) <= D.ondaRaggio) statoRun.proiettiliNemici.splice(j, 1);
  }
  for (const n of st.nemici) {
    if (n.hp <= 0 || n.boss || !Number.isFinite(massaNemico(n))) continue;
    const d = Math.hypot(n.x - player.x, n.y - player.y);
    if (d <= D.ondaRaggio && d > 0.01) spingi(n, n.x - player.x, n.y - player.y, D.ondaSpintaPx);
  }
}

/** Effetti dopo un colpo che ha tolto vita davvero. */
function dopoColpoB5() {
  const S = statoRun.statB5;
  const B = B5();
  const st = statoRun.stanzaCorrente;
  const T = OGGETTI_B5.tetti;
  let ricalcola = false;
  B.colpitoInStanza = true;
  if (S.invulnExtra) player.invuln = Math.max(T.invulnMinTick, player.invuln + S.invulnExtra);
  if (S.colpoFuria) B.furiaTick = S.colpoFuria;
  if (S.colpoPerdeMonete && statoRun.monete > 0) {
    const n = Math.min(statoRun.monete, S.colpoPerdeMonete);
    statoRun.monete -= n;
    B.ultimoMonete = statoRun.monete;
    mostraBanner(TESTI_B5.perseMonete(n), 90);
  }
  if (S.colpoTarlo) { B.tarlo = Math.min(T.tarloTot, B.tarlo + S.colpoTarlo); ricalcola = true; }
  if (S.illesoDanno && B.illeso > 0) { B.illeso = Math.floor(B.illeso / 2); ricalcola = true; }
  if (st) {
    if (S.colpoStordisci) {
      for (const n of st.nemici) if (n.hp > 0) n.stunTicks = Math.max(n.stunTicks || 0, Math.round(S.colpoStordisci * (n.boss ? T.bossStordimento : 1)));
    }
    if (S.spine) {
      for (const n of st.nemici) {
        if (n.hp > 0 && Math.hypot(n.x - player.x, n.y - player.y) <= OGGETTI_B5.difesa.spineRaggio + n.r) danneggiaNemico(n, S.spine + statoRun.piano, 0, 0);
      }
    }
    if (S.colpoOnda && B.ondaTick <= 0) { B.ondaTick = S.colpoOnda; ondaAngeloB5(st); }
  }
  if (ricalcola) ricalcolaStatistiche();
}

const subisciColpoGiocatoreBaseB5 = subisciColpoGiocatore;
/** Scudo a tempo, bombe proprie innocue, danno doppio, Obolo ed Ex Voto sul colpo mortale; poi gli effetti «quando sei colpito». */
subisciColpoGiocatore = function (mezze, fonte, daX, daY, ...resto) {
  const S = statoRun.statB5;
  if (!S || statoRun.fase !== 'in_gioco' || player.invuln > 0 || statoRun.graziaIngressoC > 0) {
    return subisciColpoGiocatoreBaseB5.call(this, mezze, fonte, daX, daY, ...resto);
  }
  const B = B5();
  const scudiDiBase = Boolean(statoRun.scudoRosaC) || statoRun.scudoStanzaD > 0; // prima si consumano gli scudi di C e D
  if (!scudiDiBase) {
    if (S.immuneBombe && fonte === OGGETTI_B5.fonteBombaPropria) return undefined;
    if (S.scudoTempo && B.scudoPronto) {
      B.scudoPronto = false;
      B.scudoTick = S.scudoTempo;
      paraColpoB5(daX, daY, '#93c5fd');
      mostraBanner(TESTI_B5.scudoParato, 90);
      return undefined;
    }
    if (S.dannoDoppio) mezze *= 2;
    const effettivo = statoRun.statD && statoRun.statD.dannoMaxHalf ? Math.min(1, mezze) : mezze;
    if (statoRun.hpHalf - effettivo <= 0 && !(statoRun.viteExtra > 0)) {
      if (S.oboloMorte && statoRun.monete >= S.oboloMorte) {
        statoRun.monete -= S.oboloMorte;
        B.ultimoMonete = statoRun.monete;
        paraColpoB5(daX, daY, '#f9cb40');
        mostraBanner(TESTI_B5.obolo(S.oboloMorte), 170);
        return undefined;
      }
      if (S.salvaPiano && B.exVotoPiano !== statoRun.piano) {
        B.exVotoPiano = statoRun.piano;
        mostraBanner(TESTI_B5.exVoto, 170);
        if (statoRun.hpHalf <= 1) { paraColpoB5(daX, daY, '#e5e7eb'); return undefined; }
        mezze = statoRun.hpHalf - 1; // resta ½ maschera
      }
    }
  }
  const prima = statoRun.hpHalf;
  const run = statoRun.numeroRun;
  const r = subisciColpoGiocatoreBaseB5.call(this, mezze, fonte, daX, daY, ...resto);
  try {
    if (statoRun.fase === 'in_gioco' && statoRun.numeroRun === run && statoRun.hpHalf < prima && statoRun.hpHalf > 0) dopoColpoB5();
  } catch (err) { console.error('[B5] colpo subito', err); }
  return r;
};

// ===========================================================================
// 8. STANZE E PIANI: ingresso, stanza ripulita, cambio di piano, raccolta
// ===========================================================================
/** Banner da mostrare fra `ritardo` tick (per non coprire quello dell'oggetto appena raccolto). */
function bannerDopoB5(testo, ritardo) {
  B5().bannerDopo = { t: tick + ritardo, testo };
}

/** Prezzi della Fucina con gli sconti in vigore (si ricalcolano dal prezzo d'origine a ogni ingresso e acquisto). */
function applicaScontiB5(st, S) {
  if (!st || !Array.isArray(st.slotFucina)) return;
  const sconto = S.sconto || 0, fisso = S.scontoFisso || 0;
  for (const sl of st.slotFucina) {
    if (sl.comprato || typeof sl.prezzo !== 'number') continue;
    if (sl.prezzoBaseB5 == null) sl.prezzoBaseB5 = sl.prezzo;
    sl.prezzo = (sconto || fisso) ? Math.max(OGGETTI_B5.tetti.prezzoMin, Math.round(sl.prezzoBaseB5 * (1 - sconto)) - fisso) : sl.prezzoBaseB5;
  }
}

/** Lanterna del Munaciello: la Stanza Segreta del piano compare sulla mappa. */
function segnaSegretaB5() {
  const m = statoRun.mappa;
  if (!m || !m.stanze) return;
  for (const s of m.stanze) if (s.tipo === 'segreta') s.visitata = true;
}

/** Inizio di un piano (`primo` = il primo della run: nessun dono di piano). */
function alPianoB5(S, B, primo) {
  if (!primo) {
    if (S.pianoBombe && typeof aggiungiBombe === 'function') aggiungiBombe(S.pianoBombe);
    if (S.pianoChiavi && typeof aggiungiChiavi === 'function') aggiungiChiavi(S.pianoChiavi);
    B.ultimoBombe = statoRun.bombe || 0;
    B.ultimoChiavi = statoRun.chiavi || 0;
  }
  if (S.segretaVista) segnaSegretaB5();
}

/** Ingresso in una stanza (rilevato al primo tick dentro): effetti «entrando», famigli al seguito, sconti della Fucina. */
function allIngressoB5(st, S, B) {
  const T = OGGETTI_B5.tetti;
  B.stanzaTick = 0;
  B.colpitoInStanza = false;
  B.eraPulita = Boolean(st.pulita);
  B.avevaNemici = false;
  B.scie.length = 0;
  B.eco.length = 0;
  B.ultimaSciaX = null;
  if (B.famigli.some((f) => f.temp)) B.famigli = B.famigli.filter((f) => !f.temp);
  B.famigli.forEach((f, i) => {
    const posto = postoFamiglioB5(i);
    f.x = posto.x; f.y = posto.y; f.porta = null; f.cd = Math.max(f.cd || 0, 30);
    if (f.tipo === 'torretta') { f.tx = posto.x; f.ty = posto.y; }
  });
  const nemici = st.nemici || [];
  for (const n of nemici) if (n.hp <= 0) n.mortoB5 = true;
  const vivi = nemici.filter((n) => n.hp > 0);
  if (!st.pulita && vivi.length && !st.ingressoB5) {
    st.ingressoB5 = true;
    if (S.ingressoStordisci) {
      for (const n of vivi) n.stunTicks = Math.max(n.stunTicks || 0, Math.round(S.ingressoStordisci * (n.boss ? T.bossStordimento : 1)));
      statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 8, maxR: OGGETTI_B5.stanza.ondaIngresso, color: '#f9cb40' });
    }
    if (S.ingressoBrucia) for (const n of vivi) n.burnTicks = Math.max(n.burnTicks || 0, S.ingressoBrucia);
    if (S.ingressoFulmine) {
      let forte = vivi[0];
      for (const n of vivi) if (n.hp > forte.hp) forte = n;
      statoRun.scintilleFulmine.push({ x1: forte.x + 14, y1: ARENA.y1 - 40, x2: forte.x, y2: forte.y - 8, tick: 10 });
      statoRun.ondeEsplosione.push({ x: forte.x, y: forte.y - 6, r: 4, maxR: 30, color: '#67e8f9' });
      danneggiaNemico(forte, statoRun.dmg * S.ingressoFulmine, 0, 0);
    }
    if (S.ingressoIella && rng() < S.ingressoIella) {
      const comuni = vivi.filter((n) => !n.boss && n.hp > 0);
      if (comuni.length) {
        const n = comuni[Math.floor(rng() * comuni.length)];
        n.maxHp = Math.round(n.maxHp * OGGETTI_B5.nemici.iellaVita);
        n.hp = Math.round(n.hp * OGGETTI_B5.nemici.iellaVita);
        n.flash = 10;
        mostraBanner(TESTI_B5.iella, 120);
      }
    }
  }
  if (S.fiutoSegreto && st.muroSegreto && !st.muroSegreto.aperto) mostraBanner(TESTI_B5.fiuto, 200);
  if (st.tipo === 'fucina') applicaScontiB5(st, S);
}

/** Stanza di combattimento appena ripulita. */
function allaPuliziaB5(st, S, B) {
  if (!B.avevaNemici) return;
  const P = OGGETTI_B5.stanza;
  let ricalcola = false;
  B.stanzePulite++;
  if (S.puliziaDanno) { B.inchini++; ricalcola = true; }
  if (S.illesoDanno && !B.colpitoInStanza) { B.illeso++; ricalcola = true; }
  if (S.puliziaCarica && statoRun.oggettoAttivo) statoRun.caricaAttivo = Math.min(statoRun.oggettoAttivo.maxCarica, statoRun.caricaAttivo + S.puliziaCarica);
  if (S.puliziaMoneta && rng() < S.puliziaMoneta) st.oggettiATerra.push(monetaB5(P.monetaPulizia[0], P.monetaPulizia[1]));
  if (S.puliziaCura) { B.contaCura++; if (B.contaCura >= S.puliziaCura && curaB5(1)) B.contaCura = 0; }
  if (S.puliziaIllesoCura && !B.colpitoInStanza) { B.contaIlleso++; if (B.contaIlleso >= S.puliziaIllesoCura && curaB5(1)) B.contaIlleso = 0; }
  if (S.puliziaDono && rng() < S.puliziaDono) lasciaDonoB5(st, P.donoPulizia[0], P.donoPulizia[1], OGGETTI_B5.attivi.topolino.pesi);
  if (ricalcola) ricalcolaStatistiche();
}

/** Nemico appena caduto (qualunque sia la causa: lo rileva la scansione di ogni tick). */
function allaUccisioneB5(n, st, S, B) {
  B.uccisioni++;
  if (S.rubaVita) { B.contaVita++; if (B.contaVita >= S.rubaVita && curaB5(1)) B.contaVita = 0; }
  if (S.uccisioneMoneta && !n.boss && rng() < S.uccisioneMoneta) st.oggettiATerra.push(monetaB5(n.x, n.y));
  if (S.uccisioneEsplode && B.catena < OGGETTI_B5.tetti.catenaScoppi) {
    B.catena++;
    statoRun.ondeEsplosione.push({ x: n.x, y: n.y - 6, r: 5, maxR: S.uccisioneEsplode, color: '#fb923c' });
    for (const o of st.nemici) {
      if (o === n || o.hp <= 0) continue;
      const d = Math.hypot(o.x - n.x, o.y - n.y);
      if (d <= S.uccisioneEsplode + o.r) danneggiaNemico(o, statoRun.dmg * OGGETTI_B5.nemici.scoppioDannoMult, 0, 0);
    }
  }
}

/** Anello di scintille d'oro dello Zecchino. */
function scintilleB5(n) {
  const Z = OGGETTI_B5.raccolta.scintille;
  const L = statoRun.proiettili;
  const tetto = OGGETTI_D.clamp.proiettiliGiocatore + OGGETTI_B5.tetti.proiettiliExtra;
  const fase = ((tick % 60) / 60) * TAU;
  for (let i = 0; i < n && L.length < tetto; i++) {
    const a = fase + (TAU * i) / n;
    L.push({
      x: player.x, y: player.y - 6, vx: Math.cos(a) * Z.velocita, vy: Math.sin(a) * Z.velocita, dist: 0, maxDist: Z.gittata,
      dmg: statoRun.dmg * Z.dannoMult, r: Z.raggio, tipo: 'oro', piercing: false, overflowPierce: false, hitIds: new Set(), oming: 0, rimbalzi: 0, famD: true,
    });
  }
}

/** Confronta monete, chiavi e bombe col tick prima: raccolte (aumenti) e acquisti in Fucina (monete in meno). */
function osservaRisorseB5(S, B, st) {
  const T = OGGETTI_B5.tetti;
  const m = statoRun.monete || 0, c = statoRun.chiavi || 0, b = statoRun.bombe || 0;
  if (B.ultimoMonete != null) {
    if (m > B.ultimoMonete) {
      const n = Math.min(T.raccoltaPerTick, m - B.ultimoMonete);
      if (S.monetaCura) { B.contaMonete = Math.min(S.monetaCura * 2, B.contaMonete + n); if (B.contaMonete >= S.monetaCura && curaB5(1)) B.contaMonete -= S.monetaCura; }
      if (S.monetaScintille) scintilleB5(S.monetaScintille);
    } else if (m < B.ultimoMonete && S.acquistoSangue && st.tipo === 'fucina' && statoRun.hpHalf > S.acquistoSangue) {
      statoRun.hpHalf -= S.acquistoSangue;
      statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 4, maxR: 24, color: '#ef4444' });
      bannerDopoB5(TESTI_B5.acquistoSangue, 215);
    }
  }
  if (B.ultimoChiavi != null && c > B.ultimoChiavi && S.chiaveMoneta) {
    statoRun.monete = Math.min(99, (statoRun.monete || 0) + Math.min(T.raccoltaPerTick, c - B.ultimoChiavi) * S.chiaveMoneta);
  }
  if (B.ultimoBombe != null && b > B.ultimoBombe && S.bombaDoppia && typeof aggiungiBombe === 'function') aggiungiBombe(Math.min(T.raccoltaPerTick, b - B.ultimoBombe));
  B.ultimoMonete = statoRun.monete || 0;
  B.ultimoChiavi = statoRun.chiavi || 0;
  B.ultimoBombe = statoRun.bombe || 0;
  B.ultimoBaseMax = statoRun.baseMaxHpHalf;
  B.ultimoHp = statoRun.hpHalf;
}

/** Ferro di Cavallo Calamitato: i raccoglibili entro `raggio` scivolano verso il giocatore. */
function attiraB5(st, raggio) {
  const v = OGGETTI_B5.raccolta.magneteVelocita;
  for (const pk of st.oggettiATerra || []) {
    if (pk.tipo !== 'moneta' && pk.tipo !== 'bomba' && pk.tipo !== 'chiave' && !(pk.tipo === 'cura' && statoRun.hpHalf < statoRun.maxHpHalf)) continue;
    const dx = player.x - pk.x, dy = player.y - pk.y;
    const d = Math.hypot(dx, dy);
    if (d > raggio || d < 4) continue;
    pk.x += (dx / d) * Math.min(v, d);
    pk.y += (dy / d) * Math.min(v, d);
  }
}

const dopoRaccoltaDBaseB5 = dopoRaccoltaD;
/** Dopo ogni raccolta: doni immediati degli oggetti nuovi, Indulgenza sul Patto, doppio fondo del tesoro, sconti. */
dopoRaccoltaD = function (item, ...resto) {
  const r = dopoRaccoltaDBaseB5.call(this, item, ...resto);
  try { allaRaccoltaB5(item); } catch (err) { console.error('[B5] raccolta', err); }
  return r;
};

function allaRaccoltaB5(item) {
  const S = statoRun.statB5;
  if (!item || !S || statoRun.fase !== 'in_gioco') return;
  const B = B5();
  const st = statoRun.stanzaCorrente;
  const base = trovaOggettoB(item.id) || item;
  const m = base.mod || {};
  if (m.moneteSubito) {
    const prima = statoRun.monete || 0;
    statoRun.monete = Math.min(99, prima + m.moneteSubito);
    if (B.ultimoMonete != null) B.ultimoMonete += statoRun.monete - prima; // un dono non è una raccolta
  }
  if (m.subitoBombe && typeof aggiungiBombe === 'function') { const prima = statoRun.bombe || 0; aggiungiBombe(m.subitoBombe); if (B.ultimoBombe != null) B.ultimoBombe += (statoRun.bombe || 0) - prima; }
  if (m.subitoChiavi && typeof aggiungiChiavi === 'function') { const prima = statoRun.chiavi || 0; aggiungiChiavi(m.subitoChiavi); if (B.ultimoChiavi != null) B.ultimoChiavi += (statoRun.chiavi || 0) - prima; }
  if (m.curaTotale) statoRun.hpHalf = statoRun.maxHpHalf;
  if (m.segretaVista) segnaSegretaB5();
  if (st && st.tipo === 'fucina') applicaScontiB5(st, S);
  // Indulgenza Plenaria: il Patto appena stretto non costa maschere (si rimette il massimo di prima)
  if (base.tier === 'patto' && (S.pattoGratis || 0) > B.pattiGratisUsati && B.ultimoBaseMax != null && statoRun.baseMaxHpHalf < B.ultimoBaseMax) {
    B.pattiGratisUsati++;
    statoRun.baseMaxHpHalf = B.ultimoBaseMax;
    ricalcolaStatistiche();
    if (B.ultimoHp != null) statoRun.hpHalf = Math.min(statoRun.maxHpHalf, Math.max(statoRun.hpHalf, B.ultimoHp));
    bannerDopoB5(TESTI_B5.indulgenza, 215);
  }
  // Baule a Doppio Fondo: una possibilità sola per stanza del tesoro
  if (S.tesoroBis && st && st.tipo === 'tesoro' && !st.bisB5 && st.oggettoPiedistallo && st.oggettoPiedistallo.preso) {
    st.bisB5 = true;
    if (rng() < S.tesoroBis) B.tesoroBis = st;
  }
}

// ===========================================================================
// 9. FAMIGLI NUOVI: raccoglitore, scudiero, torretta, pastori, lume, fuochista, cardellini
// ===========================================================================
function seguiB5(f, capo, dist) {
  const d = Math.hypot(capo.x - f.x, capo.y - f.y);
  if (d > dist) { const k = ((d - dist) / d) * 0.25; f.x += (capo.x - f.x) * k; f.y += (capo.y - f.y) * k; }
  const dp = Math.hypot(player.x - f.x, player.y - f.y); // mai sopra il giocatore
  if (dp < OGGETTI_B5.famigli.largoPx) {
    const a = dp > 0.01 ? Math.atan2(f.y - player.y, f.x - player.x) : 2.4;
    f.x = Math.max(ARENA.x1, Math.min(ARENA.x2, f.x + Math.cos(a) * 1.2));
    f.y = Math.max(ARENA.y1, Math.min(ARENA.y2, f.y + Math.sin(a) * 1.2));
  }
}

/** Posto di partenza dell'i-esimo famiglio: a ventaglio dietro il giocatore, dentro l'arena. */
function postoFamiglioB5(i) {
  const lato = i % 2 ? 1 : -1;
  return {
    x: Math.max(ARENA.x1 + 6, Math.min(ARENA.x2 - 6, player.x + lato * (22 + 12 * Math.floor(i / 2)))),
    y: Math.max(ARENA.y1 + 6, Math.min(ARENA.y2 - 6, player.y + 12 + 7 * (i % 3))),
  };
}

function versoB5(f, x, y, vel) {
  const d = Math.hypot(x - f.x, y - f.y);
  if (d > 0.5) { const k = Math.min(d, vel) / d; f.x += (x - f.x) * k; f.y += (y - f.y) * k; }
  return d;
}

/** Colpo di un famiglio B5 verso il nemico `n` (rispetta il tetto dei proiettili del giocatore). */
function colpoFamiglioB5(f, n, dmg, extra) {
  const L = statoRun.proiettili;
  if (L.length >= OGGETTI_D.clamp.proiettiliGiocatore) return false;
  const T = OGGETTI_B5.famigli.torretta;
  const vel = (extra && extra.velocita) || T.velocitaColpo;
  const ang = Math.atan2(n.y - 6 - (f.y - 6), n.x - f.x);
  L.push({
    x: f.x, y: f.y - 6, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, dist: 0, maxDist: T.gittataPx, dmg, r: T.raggioColpo,
    tipo: (extra && extra.tipo) || 'base', piercing: false, overflowPierce: false, hitIds: new Set(), oming: 0, rimbalzi: 0,
    esplosiva: (extra && extra.esplosiva) || 0, famD: true,
  });
  return true;
}

/** Un tick di logica dei famigli B5 nella stanza `st`. */
function aggiornaFamigliB5(st, S, B) {
  if (!B.famigli.length) return;
  const F = OGGETTI_B5.famigli;
  for (let i = B.famigli.length - 1; i >= 0; i--) {
    const f = B.famigli[i];
    if (f.temp && --f.vita <= 0) B.famigli.splice(i, 1);
  }
  let capo = player;
  for (const fd of statoRun.famigliD || []) if (fd.tipo !== 'contatto') capo = fd; // in coda ai famigli di D
  for (const f of B.famigli) {
    if (f.cd > 0) f.cd--;
    if (f.tipo === 'raccoglitore') {
      if (f.porta && !(st.oggettiATerra || []).includes(f.porta)) f.porta = null;
      if (f.porta) {
        versoB5(f, player.x, player.y, F.raccoglitore.velocita);
        f.porta.x = f.x; f.porta.y = f.y;
      } else {
        let meta = null, md = Infinity;
        for (const pk of st.oggettiATerra || []) {
          if (pk.tipo !== 'moneta') continue;
          const d = Math.hypot(pk.x - f.x, pk.y - f.y);
          if (d < md) { md = d; meta = pk; }
        }
        if (!meta) { seguiB5(f, capo, F.seguiPx); capo = f; }
        else if (versoB5(f, meta.x, meta.y, F.raccoglitore.velocita) <= F.raccoglitore.presaPx) f.porta = meta;
      }
    } else if (f.tipo === 'scudiero') {
      const tiro = statoRun.ultimoTiroD;
      const ang = tiro && tick - tiro.tick < 90 ? tiro.ang : Math.atan2(player.dirY || 0, player.dirX || 1);
      const C = F.scudiero;
      f.x += (player.x + Math.cos(ang) * C.distanzaPx - f.x) * 0.3;
      f.y += (player.y + Math.sin(ang) * C.distanzaPx - f.y) * 0.3;
      if (f.cd <= 0) {
        const PN = statoRun.proiettiliNemici;
        for (let j = PN.length - 1; j >= 0; j--) {
          if (Math.hypot(PN[j].x - f.x, PN[j].y - (f.y - 6)) > C.raggioBlocco) continue;
          statoRun.effettiSplash.push({ x: PN[j].x, y: PN[j].y, tick: 0 });
          PN.splice(j, 1);
          f.cd = C.ricaricaTick;
          break;
        }
      }
    } else if (f.tipo === 'torretta') {
      f.x = f.tx; f.y = f.ty;
      if (f.cd <= 0) {
        const n = nemicoVicinoD(st, f.x, f.y, F.torretta.gittataPx);
        if (n && colpoFamiglioB5(f, n, f.dmg || 2)) f.cd = Math.max(8, Math.round(60 / (f.cadenza || 1)));
      }
    } else if (f.tipo === 'pastore') {
      seguiB5(f, capo, F.seguiPx * 0.6); capo = f;
      if (f.cd <= 0) {
        const n = nemicoVicinoD(st, f.x, f.y, F.torretta.gittataPx);
        if (n && colpoFamiglioB5(f, n, F.pastore.danno)) f.cd = Math.round(60 / F.pastore.cadenza);
      }
    } else if (f.tipo === 'lume') {
      seguiB5(f, capo, F.seguiPx); capo = f;
      if (S.auraBrucia && tick % F.lume.ogniTick === 0) {
        for (const n of st.nemici) {
          if (n.hp > 0 && Math.hypot(n.x - f.x, n.y - f.y) <= S.auraBrucia + n.r) n.burnTicks = Math.max(n.burnTicks || 0, F.lume.bruciaTick);
        }
      }
    } else if (f.tipo === 'bombarolo') {
      seguiB5(f, capo, F.seguiPx); capo = f;
      if (f.cd <= 0) {
        const C = F.bombarolo;
        const n = nemicoVicinoD(st, f.x, f.y, C.gittataPx);
        if (n && colpoFamiglioB5(f, n, C.danno + C.dannoPerPiano * (statoRun.piano - 1), { esplosiva: C.raggio, tipo: 'fuoco', velocita: C.velocita })) f.cd = C.ogniTick;
      }
    } else if (f.tipo === 'cardellino') {
      const C = F.cardellino;
      const n = nemicoVicinoD(st, f.x, f.y);
      if (!n) versoB5(f, player.x + 14, player.y - 16, C.velocita);
      else if (versoB5(f, n.x, n.y - 4, C.velocita) <= n.r + 6 && f.cd <= 0) { danneggiaNemico(n, C.danno, 0, 0); f.cd = C.ogniTick; }
    } else {
      seguiB5(f, capo, F.seguiPx); capo = f;
    }
  }
}

/** Pozze a terra: scadono e, ogni OGGETTI_B5.scie.ogniTick, feriscono/bruciano/rallentano chi ci sta sopra. */
function aggiornaScieB5(st, B) {
  const C = OGGETTI_B5.scie;
  for (let i = B.scie.length - 1; i >= 0; i--) if (--B.scie[i].vita <= 0) B.scie.splice(i, 1);
  if (!B.scie.length || tick % C.ogniTick !== 0) return;
  for (const n of st.nemici) {
    if (n.hp <= 0 || (n.airZ || 0) > 16) continue;
    for (const s of B.scie) {
      const T = C.tipi[s.tipo];
      if (Math.hypot(n.x - s.x, n.y - s.y) > T.r + n.r * 0.6) continue;
      if (T.dannoMult > 0) danneggiaNemico(n, Math.max(0.5, statoRun.dmg * T.dannoMult), 0, 0);
      if (T.brucia) n.burnTicks = Math.max(n.burnTicks || 0, T.brucia);
      if (T.lento && n.hp > 0) rallentaNemicoB5(n, T.lento);
      break;
    }
  }
}

// ===========================================================================
// 10. IL TICK DI B5 (dopo il passo logico di base)
// ===========================================================================
/** Un tick delle meccaniche B5: eventi di stanza/piano, uccisioni, timer, risorse, famigli, scie, moltiplicatori. */
function tickB5() {
  smaltisciNotificheB5();
  if (statoRun.fase !== 'in_gioco') return;
  const st = statoRun.stanzaCorrente;
  const S = statoRun.statB5;
  if (!st || !S) return;
  const B = B5();
  if (B.piano !== statoRun.piano) { const primo = B.piano === null; B.piano = statoRun.piano; alPianoB5(S, B, primo); }
  if (B.stanzaRef !== st) {
    if (B.stanzaRef && !B.eraPulita && B.stanzaRef.pulita) allaPuliziaB5(B.stanzaRef, S, B);
    B.stanzaRef = st;
    allIngressoB5(st, S, B);
  }
  if (st.nemici && st.nemici.length) B.avevaNemici = true;
  if (!B.eraPulita && st.pulita) { B.eraPulita = true; allaPuliziaB5(st, S, B); }
  if (B.bannerDopo && tick >= B.bannerDopo.t) { mostraBanner(B.bannerDopo.testo, 150); B.bannerDopo = null; }
  if (statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo || statoRun.pausa || ticksCongelati > 0) return;

  B.stanzaTick++;
  B.catena = 0;
  for (const n of st.nemici || []) {
    if (n.hp > 0) { if (n.lentoB5 > 0 && --n.lentoB5 <= 0) n.speed = n.speedB5; } else if (!n.mortoB5) { n.mortoB5 = true; allaUccisioneB5(n, st, S, B); }
  }
  if (B.furiaTick > 0) B.furiaTick--;
  if (B.ondaTick > 0) B.ondaTick--;
  if (S.scudoTempo && !B.scudoPronto) { if (B.scudoTick > 0) B.scudoTick--; else B.scudoPronto = true; }
  if (S.caricato) B.caricaTick = Math.min(B.caricaTick + 1, OGGETTI_B5.colpi.caricaTick + 1);
  if (B.caffeTick > 0 && --B.caffeTick === 0) ricalcolaStatistiche();
  if (B.clessidraTick > 0) {
    const k = OGGETTI_B5.attivi.clessidra.fattore;
    B.clessidraTick--;
    for (const pr of statoRun.proiettiliNemici) {
      if (B.clessidraTick > 0 && !pr.lentoB5) { pr.lentoB5 = true; pr.vx *= k; pr.vy *= k; } else if (B.clessidraTick === 0 && pr.lentoB5) { pr.lentoB5 = false; pr.vx /= k; pr.vy /= k; }
    }
  }
  while (B.eco.length && B.eco[0].t <= tick) {
    const e = B.eco.shift();
    const n0 = statoRun.proiettili.length;
    sparaProiettiliDirezioneBaseB5(e.dx, e.dy, OGGETTI_B5.colpi.ecoDanno);
    dopoSparoB5(n0, e.dx, e.dy, true);
  }
  osservaRisorseB5(S, B, st);
  if (S.magnete) attiraB5(st, S.magnete);
  if (S.sciaPassi && player.moving) {
    if (B.ultimaSciaX === null || Math.hypot(player.x - B.ultimaSciaX, player.y - B.ultimaSciaY) >= OGGETTI_B5.scie.passoPassiPx) {
      B.ultimaSciaX = player.x; B.ultimaSciaY = player.y;
      aggiungiSciaB5(player.x, player.y + 6, S.sciaPassi);
    }
  }
  if (B.tesoroBis) {
    const s = B.tesoroBis;
    B.tesoroBis = null;
    if (s === st && s.oggettoPiedistallo && s.oggettoPiedistallo.preso) {
      const o = estraiOggettoBase();
      s.oggettoPiedistallo = { ...o, x: 320, y: 192, preso: false, forteGratis: false };
      statoRun.ondeEsplosione.push({ x: 320, y: 186, r: 6, maxR: 40, color: '#f9cb40' });
      bannerDopoB5(TESTI_B5.tesoroBis, 215);
    }
  }
  aggiornaFamigliB5(st, S, B);
  aggiornaScieB5(st, B);
  if (tick % 30 === 0) B.gradimento = gradimentoB5();
  aggiornaMoltDannoB5(S, B, st);
}

const passoLogicoBaseB5 = passoLogico;
passoLogico = function (...args) {
  const r = passoLogicoBaseB5.apply(this, args);
  try { tickB5(); } catch (err) { console.error('[B5] tick', err); }
  return r;
};

// ===========================================================================
// 11. OGGETTI ATTIVI: si trovano in gioco, si scambiano, effetti dei 15 nuovi
// ===========================================================================
/** Un oggetto attivo a caso fra quelli sbloccati, diverso da quello in mano (e da `escludiId`). */
function estraiAttivoB5(escludiId) {
  const corrente = statoRun.oggettoAttivo && statoRun.oggettoAttivo.id;
  const lista = Object.values(OGGETTI_ATTIVI).filter((a) => a.id !== corrente && a.id !== escludiId && oggettoSbloccatoB5(a.id));
  return lista.length ? { ...lista[Math.floor(rng() * lista.length)] } : null;
}

/** Un passivo tolto da un piedistallo o da un banco torna fra quelli che possono ancora uscire. */
function rimettiNelPoolB5(id) {
  const P = statoRun.poolRunB;
  if (P && id && P.ids.includes(id) && !P.rimasti.includes(id)) P.rimasti.push(id);
}

/** Mette l'oggetto `o` (passivo o attivo) sul banco `sl` della Fucina, col suo prezzo di ECONOMIA_T3. */
function aggiornaSlotFucinaB5(sl, o) {
  const stella = sl.tier === 'forte' ? '★ ' : '';
  sl.item = o;
  sl.nome = stella + o.nome;
  sl.nomeBreve = stella + String(o.nome).replace(/\s*\(.*?\)/g, '');
  sl.statsDesc = o.statsDesc;
  sl.sprite = o.sprite;
  sl.prezzo = o.prezzo != null ? o.prezzo : ECONOMIA_T3.prezzi.base;
  sl.prezzoBaseB5 = sl.prezzo;
  sl.inSaldo = false;
}

/** Tesoro e Fucina: con probabilità OGGETTI_B5.attiviPool un oggetto attivo prende il posto del passivo. */
function piazzaAttiviB5(s) {
  const A = OGGETTI_B5.attiviPool;
  if (s.tipo === 'tesoro') {
    const tiro = rng();
    const ped = s.oggettoPiedistallo;
    if (tiro < A.probTesoro && ped && ped.id && !ped.cuoreB && ped.polarita !== 'negativo') {
      const a = estraiAttivoB5();
      if (a) { rimettiNelPoolB5(ped.id); s.oggettoPiedistallo = { ...a, x: ped.x, y: ped.y, preso: false, forteGratis: a.tier === 'forte' }; }
    }
  } else if (s.tipo === 'fucina' && Array.isArray(s.slotFucina)) {
    const tiro = rng();
    const sl = s.slotFucina.find((x) => x.tipo === 'oggetto' && x.tier === 'base' && x.item && !x.item.cuoreB && x.item.polarita !== 'negativo');
    if (tiro < A.probFucina && sl) {
      const a = estraiAttivoB5();
      if (a) { rimettiNelPoolB5(sl.item.id); aggiornaSlotFucinaB5(sl, a); }
    }
  }
}

const popolaStanzaBaseB5 = popolaStanza;
popolaStanza = function (s, ...resto) {
  const r = popolaStanzaBaseB5.call(this, s, ...resto);
  try { piazzaAttiviB5(s); } catch (err) { console.error('[B5] attivi in stanza', err); }
  return r;
};

/**
 * Prende un oggetto attivo: va nello slot [Q]; quello che avevi resta sul piedistallo (con la sua carica) o, in
 * Fucina, lo tiene Mastro Peppe. Un attivo mai avuto arriva carico; uno già avuto riprende la carica che aveva.
 * @param {object} item voce di OGGETTI_ATTIVI (copia) @param {string} origine 'piedistallo' | 'fucina' | altro @param {object} [ref] piedistallo o banco
 */
function prendiAttivoB5(item, origine, ref) {
  const def = OGGETTI_ATTIVI[item.id];
  if (!def) return false;
  const B = B5();
  const vecchio = statoRun.oggettoAttivo;
  const caricaVecchia = statoRun.caricaAttivo || 0;
  if (vecchio) B.cariche[vecchio.id] = caricaVecchia;
  const carica = item.caricaB5 != null ? item.caricaB5 : (B.cariche[def.id] != null ? B.cariche[def.id] : def.maxCarica);
  if (origine === 'fucina' && ref) { statoRun.monete -= ref.prezzo; ref.comprato = true; }
  if (origine === 'piedistallo' && ref) {
    if (vecchio && OGGETTI_ATTIVI[vecchio.id]) {
      const x = ref.x, y = ref.y;
      for (const k of Object.keys(ref)) delete ref[k];
      Object.assign(ref, OGGETTI_ATTIVI[vecchio.id], { x, y, preso: false, forteGratis: false, caricaB5: caricaVecchia });
    } else ref.preso = true;
  }
  statoRun.oggettoAttivo = { ...def };
  statoRun.caricaAttivo = Math.max(0, Math.min(def.maxCarica, carica));
  dopoRaccoltaD(def);
  player.pickupTimer = 55;
  player.pickupItem = def;
  mostraBanner(TESTI_B5.attivoPreso(def.nome, def.desc), 210);
  return true;
}

const acquisisciOggettoBaseB5 = acquisisciOggettoConLimite5Slot;
/** Gli oggetti attivi non finiscono fra i passivi: vanno nello slot [Q] (prendiAttivoB5). Tutto il resto alla base. */
acquisisciOggettoConLimite5Slot = function (nuovoItem, origine, refSlot, ...resto) {
  if (nuovoItem && nuovoItem.attivoB5 && OGGETTI_ATTIVI[nuovoItem.id]) { prendiAttivoB5(nuovoItem, origine, refSlot); return undefined; }
  return acquisisciOggettoBaseB5.call(this, nuovoItem, origine, refSlot, ...resto);
};

/** Dà al giocatore l'oggetto `id` di qualunque catalogo (QA e sviluppo). */
function daiOggettoB5(id) {
  const o = trovaOggettoB(id);
  if (!o) return false;
  acquisisciOggettoConLimite5Slot({ ...o }, 'dono', null);
  return true;
}

/** Colpo «di oggetto attivo» che parte dal giocatore (Tric-Trac, Specchio). */
function colpoAttivoB5(x, y, vx, vy, dmg, extra) {
  const L = statoRun.proiettili;
  if (L.length >= OGGETTI_D.clamp.proiettiliGiocatore + OGGETTI_B5.tetti.proiettiliExtra) return false;
  L.push(Object.assign({ x, y, vx, vy, dist: 0, maxDist: 260, dmg, r: 4.5, tipo: 'base', piercing: false, overflowPierce: false, hitIds: new Set(), oming: 0, rimbalzi: 0, esplosiva: 0, famD: true }, extra));
  return true;
}

/**
 * Effetti degli oggetti attivi nuovi: (stanza, statoB5, statB5) → false se non c'era niente da fare (la carica resta).
 */
const EFFETTI_ATTIVI_B5 = {
  'bussolotto'(st, B, S) {
    let n = 0;
    const ped = st.oggettoPiedistallo;
    if (st.pulita && ped && !ped.preso && ped.tier !== 'patto') {
      const nuovo = ped.attivoB5 ? estraiAttivoB5(ped.id) : ped.tier === 'segreto' ? estraiOggettoSegreto() : ped.tier === 'forte' ? estraiOggettoForte() : estraiOggettoBase();
      if (nuovo) { st.oggettoPiedistallo = { ...nuovo, x: ped.x, y: ped.y, preso: false, forteGratis: nuovo.tier === 'forte' || nuovo.tier === 'segreto' }; n++; }
    }
    if (st.tipo === 'fucina') {
      for (const sl of st.slotFucina || []) {
        if (sl.comprato || sl.tipo !== 'oggetto' || !sl.item) continue;
        const nuovo = sl.item.attivoB5 ? estraiAttivoB5(sl.item.id) : sl.tier === 'forte' ? estraiOggettoForte() : estraiOggettoBase();
        if (nuovo) { aggiornaSlotFucinaB5(sl, nuovo); n++; }
      }
      applicaScontiB5(st, S);
    }
    if (st.tipo === 'patto') {
      for (const sl of st.slotPatto || []) {
        if (sl.comprato) continue;
        const p = estraiOggettoPatto();
        if (!p) continue;
        Object.assign(sl, { item: p, nome: p.nome, nomeBreve: p.nome, statsDesc: p.statsDesc, costoMaxHpHalf: p.costoMaxHpHalf || 2, sprite: p.sprite });
        n++;
      }
    }
    if (!n) { mostraBanner(TESTI_B5.bussolottoVuoto, 150); return false; }
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 8, maxR: 110, color: '#f9cb40' });
    mostraBanner(TESTI_B5.bussolotto, 170);
    return true;
  },
  'cordone-sipario'() {
    statoRun.proiettiliNemici = [];
    player.invuln = Math.max(player.invuln, OGGETTI_B5.attivi.cordone.invulnTick);
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 8, maxR: 200, color: '#b91c1c' });
    mostraBanner(TESTI_B5.cordone, 170);
    return true;
  },
  'clessidra'(st, B) {
    const A = OGGETTI_B5.attivi.clessidra;
    B.clessidraTick = A.tick;
    for (const n of st.nemici) if (n.hp > 0) rallentaNemicoB5(n, A.tick);
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 8, maxR: 220, color: '#c084fc' });
    mostraBanner(TESTI_B5.clessidra, 170);
    return true;
  },
  'tric-trac'() {
    const A = OGGETTI_B5.attivi.tricTrac;
    for (let i = 0; i < A.colpi; i++) {
      const a = (TAU * i) / A.colpi;
      const v = A.velocita + (i % 3) * 0.4;
      colpoAttivoB5(player.x, player.y - 6, Math.cos(a) * v, Math.sin(a) * v, statoRun.dmg * A.dannoMult, { tipo: 'fuoco', maxDist: A.gittata, esplosiva: A.raggio });
    }
    mostraBanner(TESTI_B5.tricTrac, 120);
    return true;
  },
  'acquasantiera'() {
    aggiungiSciaB5(player.x, player.y + 4, 'pozza');
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y, r: 6, maxR: OGGETTI_B5.scie.tipi.pozza.r, color: '#7dd3fc' });
    mostraBanner(TESTI_B5.acquasantiera, 160);
    return true;
  },
  'specchio-camerino'() {
    const A = OGGETTI_B5.attivi.specchio;
    const PN = statoRun.proiettiliNemici;
    if (!PN.length) { mostraBanner(TESTI_B5.specchioVuoto, 150); return false; }
    let n = 0;
    for (const pr of PN) {
      if (n >= A.max) break;
      if (colpoAttivoB5(pr.x, pr.y, -pr.vx * A.velocita, -pr.vy * A.velocita, statoRun.dmg * A.dannoMult, { tipo: 'cremisi', r: 4 })) n++;
    }
    statoRun.proiettiliNemici = [];
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 8, maxR: 180, color: '#67e8f9' });
    mostraBanner(TESTI_B5.specchio(n), 170);
    return true;
  },
  'salvadanaio'(st) {
    const n = OGGETTI_B5.attivi.salvadanaio.monete;
    for (let i = 0; i < n; i++) {
      const a = (TAU * i) / n + 0.5;
      st.oggettiATerra.push(monetaB5(player.x + Math.cos(a) * 30, player.y + Math.sin(a) * 24));
    }
    mostraBanner(TESTI_B5.salvadanaio, 150);
    return true;
  },
  'tazzulella'(st, B) {
    B.caffeTick = OGGETTI_B5.attivi.tazzulella.tick;
    ricalcolaStatistiche();
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 6, maxR: 40, color: '#a16207' });
    mostraBanner(TESTI_B5.tazzulella, 170);
    return true;
  },
  'bacchetta-rabdomante'(st) {
    if (!st.muroSegreto || st.muroSegreto.aperto) { mostraBanner(TESTI_B5.bacchettaVuoto, 150); return false; }
    apriMuroSegreto(st);
    bannerDopoB5(TESTI_B5.bacchetta, 2);
    return true;
  },
  'cilicio'(st, B) {
    const A = OGGETTI_B5.attivi.cilicio;
    if (statoRun.hpHalf <= A.costoHalf) { mostraBanner(TESTI_B5.cilicioNo, 150); return false; }
    statoRun.hpHalf -= A.costoHalf;
    B.cilicioStanza = st.id;
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 6, maxR: 60, color: '#ef4444' });
    mostraBanner(TESTI_B5.cilicio, 190);
    return true;
  },
  'gabbia-cardellini'(st, B) {
    const C = OGGETTI_B5.famigli.cardellino;
    for (let i = 0; i < C.numero; i++) {
      B.famigli.push({ id: 'gabbia-cardellini', tipo: 'cardellino', sprite: 'b5_cardellino', temp: true, vita: C.vitaTick, x: player.x + (i - 1) * 10, y: player.y - 12, cd: i * 4 });
    }
    mostraBanner(TESTI_B5.gabbia, 150);
    return true;
  },
  'trampoli'() {
    const A = OGGETTI_B5.attivi.trampoli;
    let dx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), dy = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
    if (!dx && !dy) { dx = player.dirX || 0; dy = player.dirY || 0; }
    if (!dx && !dy) dx = player.flipX ? -1 : 1;
    const l = Math.hypot(dx, dy);
    dx /= l; dy /= l;
    for (let k = 0; k * A.passoPx < A.px; k++) {
      if (k % 2 === 0) statoRun.effettiSplash.push({ x: player.x, y: player.y - 6, tick: 0 });
      player.x = Math.max(ARENA.x1, Math.min(ARENA.x2, player.x + dx * A.passoPx));
      player.y = Math.max(ARENA.y1, Math.min(ARENA.y2, player.y + dy * A.passoPx));
    }
    player.targetX = null; player.targetY = null;
    player.invuln = Math.max(player.invuln, A.invulnTick);
    mostraBanner(TESTI_B5.trampoli, 110);
    return true;
  },
  'turibolo'(st) {
    const A = OGGETTI_B5.attivi.turibolo;
    for (const n of st.nemici) {
      if (n.hp <= 0) continue;
      n.burnTicks = Math.max(n.burnTicks || 0, A.bruciaTick);
      n.stunTicks = Math.max(n.stunTicks || 0, Math.round(A.stordisciTick * (n.boss ? OGGETTI_B5.tetti.bossStordimento : 1)));
    }
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 8, maxR: 230, color: '#d6d3d1' });
    mostraBanner(TESTI_B5.turibolo, 170);
    return true;
  },
  'calamita'(st) {
    const A = OGGETTI_B5.attivi.calamita;
    const cx = (ARENA.x1 + ARENA.x2) / 2, cy = (ARENA.y1 + ARENA.y2) / 2;
    for (const n of st.nemici) {
      if (n.hp <= 0 || n.boss || !Number.isFinite(massaNemico(n))) continue;
      const d = Math.hypot(cx - n.x, cy - n.y);
      if (d > 6) spingi(n, cx - n.x, cy - n.y, d * A.frazione);
      n.stunTicks = Math.max(n.stunTicks || 0, A.stordisciTick);
    }
    statoRun.ondeEsplosione.push({ x: cx, y: cy, r: 8, maxR: 120, color: '#93c5fd' });
    mostraBanner(TESTI_B5.calamita, 160);
    return true;
  },
  'calza-befana'(st) {
    const tipo = lasciaDonoB5(st, Math.max(ARENA.x1 + 20, Math.min(ARENA.x2 - 20, player.x + 20)), player.y, OGGETTI_B5.attivi.calza.pesi);
    mostraBanner(TESTI_B5.calza[tipo] || TESTI_B5.calza.moneta, 150);
    return true;
  },
};

const usaOggettoAttivoBaseB5 = usaOggettoAttivo;
/** Dopo la base (che consuma la carica): l'effetto degli attivi nuovi; chi non trova niente da fare la riprende. */
usaOggettoAttivo = function (...args) {
  const att = statoRun.oggettoAttivo;
  const pronto = Boolean(att) && statoRun.caricaAttivo >= att.maxCarica && !(statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo);
  const r = usaOggettoAttivoBaseB5.apply(this, args);
  try {
    if (pronto && statoRun.oggettoAttivo === att && statoRun.caricaAttivo === 0) {
      const eff = EFFETTI_ATTIVI_B5[att.id];
      const st = statoRun.stanzaCorrente;
      if (eff && (statoRun.fase !== 'in_gioco' || !st)) statoRun.caricaAttivo = att.maxCarica;
      else {
        if (segnaConosciutoD(att.id) && statoRun.fase === 'in_gioco') statoRun.cartiglioD = { item: trovaOggettoB(att.id), t0: tick };
        if (eff && eff(st, B5(), statoRun.statB5 || {}) === false) statoRun.caricaAttivo = att.maxCarica;
      }
    }
  } catch (err) { console.error('[B5] oggetto attivo', err); }
  return r;
};

// ===========================================================================
// 12. EFFETTI SULLE REGOLE DI BASE: effetti rivelati, buio scacciato
// ===========================================================================
const effettoVisibileDBaseB5 = effettoVisibileD;
/** Occhi di Santa Lucia: l'effetto si legge anche prima di raccogliere (ma non con la Benda del Cieco). */
effettoVisibileD = function (o, ...resto) {
  if (effettoVisibileDBaseB5.call(this, o, ...resto)) return true;
  const S = statoRun.statB5;
  return Boolean(o && S && S.rivelaEffetti && statoRun.fase === 'in_gioco' && !maledizioneD('cieco'));
};

const maledizioneDBaseB5 = maledizioneD;
/** Lucciola in Barattolo: il buio del Lume Spento non cala. */
maledizioneD = function (k, ...resto) {
  if (k === 'buio' && statoRun.statB5 && statoRun.statB5.famigli && statoRun.statB5.famigli.some((f) => f.tipo === 'lume')) return false;
  return maledizioneDBaseB5.call(this, k, ...resto);
};

// ===========================================================================
// 13. DISEGNO: scie a terra, famigli, scudo, carica (stile a ombre: sagome scure, accenti oro e rosso)
// ===========================================================================
SPRITE_OGGETTI.b5_cardellino = ['........', '..kk....', '.kyrk...', 'kyyyyk..', '.kyyyykk', '..kyyyk.', '...kkk..', '........'];
SPRITE_OGGETTI.b5_pastore = ['..kkk...', '.kmmmk..', '..kck...', '.kvvvk..', 'kcvvvck.', '.kvvvk..', '.kv.vk..', '.kk.kk..'];

/** Pozze a terra (sotto nemici e giocatore). */
function disegnaScieB5() {
  const B = statoRun.b5;
  if (!B || !B.scie.length || statoRun.fase !== 'in_gioco') return;
  const tipi = OGGETTI_B5.scie.tipi;
  ctx.save();
  for (const s of B.scie) {
    const T = tipi[s.tipo];
    ctx.globalAlpha = T.alpha * Math.min(1, s.vita / 40);
    ctx.fillStyle = T.colore;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, T.r, T.r * 0.55, 0, 0, TAU);
    ctx.fill();
    if (s.tipo === 'fuoco') { ctx.fillStyle = '#f9cb40'; ctx.fillRect(Math.round(s.x - 1), Math.round(s.y - 3 - ((tick + Math.round(s.x)) % 8 < 4 ? 1 : 0)), 2, 3); }
    if (s.tipo === 'pozza') { ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(s.x, s.y, T.r * 0.7, T.r * 0.38, 0, 0, TAU); ctx.stroke(); }
  }
  ctx.restore();
}

const disegnaMacchieBaseB5 = disegnaMacchie;
disegnaMacchie = function (...args) {
  const r = disegnaMacchieBaseB5.apply(this, args);
  try { disegnaScieB5(); } catch (err) { console.error('[B5] scie', err); }
  return r;
};

/** Sopra i colpi: colpi cresciuti/caricati alla loro grandezza, famigli B5, scudo a tempo, arco della carica. */
function disegnaSopraB5() {
  const B = statoRun.b5, S = statoRun.statB5;
  if (!B || !S || statoRun.fase !== 'in_gioco') return;
  for (const p of statoRun.proiettili) {
    const b = p.b5;
    if (!b) continue;
    const k = b.grande || (b.r0 ? p.r / b.r0 : 1);
    if (k > 1.08) drawPixelSprite(SPRITE_PROIETTILI[p.tipo] || SPRITE_PROIETTILI.base, p.x, p.y, 1.55 * statoRun.projScale * k);
  }
  for (const f of B.famigli) {
    const vola = f.tipo === 'raccoglitore' || f.tipo === 'cardellino' || f.tipo === 'lume';
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(Math.round(f.x - 5), Math.round(f.y + 5), 10, 3);
    if (f.tipo === 'lume') {
      ctx.save();
      ctx.globalAlpha = 0.22 + Math.sin(tick * 0.1) * 0.06;
      ctx.fillStyle = '#f9cb40';
      ctx.beginPath(); ctx.arc(f.x, f.y - 10, 16, 0, TAU); ctx.fill();
      ctx.restore();
    }
    const griglia = SPRITE_OGGETTI[f.sprite || f.id] || SPRITE_OGGETTI.pupo_tonino;
    drawPixelSprite(griglia, f.x, f.y - 6 - (vola ? 5 : 0) + Math.sin(tick * 0.12 + f.x * 0.05) * 1.5, griglia.length < 12 ? 1.5 : 1.25, f.tipo === 'scudiero' ? false : player.x < f.x);
    if (f.tipo === 'scudiero' && f.cd > 0) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(Math.round(f.x - 6), Math.round(f.y - 16), 12, 2); }
  }
  if (S.scudoTempo && B.scudoPronto) {
    ctx.save();
    ctx.strokeStyle = '#93c5fd';
    ctx.globalAlpha = 0.55 + Math.sin(tick * 0.08) * 0.15;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(player.x, player.y - 8, 15, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.restore();
  }
  if (S.caricato) {
    const q = Math.min(1, B.caricaTick / OGGETTI_B5.colpi.caricaTick);
    ctx.save();
    ctx.strokeStyle = q >= 1 ? '#f9cb40' : '#a16207';
    ctx.globalAlpha = q >= 1 ? 0.9 : 0.5;
    ctx.lineWidth = q >= 1 ? 2 : 1;
    ctx.beginPath(); ctx.arc(player.x, player.y + 4, 11, Math.PI * 0.15, Math.PI * (0.15 + 0.7 * q)); ctx.stroke();
    ctx.restore();
  }
  if (B.furiaTick > 0 || B.caffeTick > 0 || (B.cilicioStanza && statoRun.stanzaCorrente && B.cilicioStanza === statoRun.stanzaCorrente.id)) {
    ctx.save();
    ctx.fillStyle = B.caffeTick > 0 ? '#f9cb40' : '#ef4444';
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 3; i++) ctx.fillRect(Math.round(player.x - 8 + i * 7), Math.round(player.y - 30 - ((tick + i * 5) % 12) * 0.5), 2, 3);
    ctx.restore();
  }
}

const disegnaFamigliOrbitaliDBaseB5 = disegnaFamigliOrbitaliD;
disegnaFamigliOrbitaliD = function (...args) {
  const r = disegnaFamigliOrbitaliDBaseB5.apply(this, args);
  try { disegnaSopraB5(); } catch (err) { console.error('[B5] disegno', err); }
  return r;
};

// ===========================================================================
// 14. DIARIO A PAGINE (tutti i 200 oggetti, in quattro sezioni) E STANZA DELLO SVILUPPATORE A PAGINE
// ===========================================================================
/** Pagine del Diario: ogni sezione del catalogo spezzata in griglie da colonne × righe. */
function pagineDiarioB5() {
  const G = OGGETTI_B5.diario;
  const perPag = G.colonne * G.righe;
  const pagine = [];
  for (const sez of sezioniCatalogoB5()) {
    const n = Math.max(1, Math.ceil(sez.voci.length / perPag));
    for (let i = 0; i < n; i++) {
      pagine.push({ chiave: sez.chiave, titolo: n > 1 ? `${sez.titolo} ${i + 1}/${n}` : sez.titolo, voci: sez.voci.slice(i * perPag, (i + 1) * perPag) });
    }
  }
  return pagine;
}

/** true se il Diario mostra la pagina degli oggetti (e non una pagina di un'altra squadra, es. i consumabili di a2). */
function paginaOggettiB5(d) {
  return Boolean(d) && !Object.keys(d).some((k) => k.startsWith('pagina') && d[k]);
}

function cellaDiarioB5(i) {
  const G = OGGETTI_B5.diario;
  const x0 = Math.round((W - G.colonne * G.cellaL) / 2);
  return { x: x0 + (i % G.colonne) * G.cellaL, y: G.y0 + Math.floor(i / G.colonne) * G.cellaA, w: G.cellaL - 4, h: G.cellaA - 3 };
}

/** Pagina e selezione correnti del Diario (rimesse nei limiti). */
function statoDiarioB5(d) {
  const pagine = pagineDiarioB5();
  d.pagB5 = Math.max(0, Math.min(pagine.length - 1, d.pagB5 || 0));
  const pg = pagine[d.pagB5];
  d.selB5 = Math.max(0, Math.min(pg.voci.length - 1, d.selB5 || 0));
  return { pagine, pg };
}

function cambiaPaginaDiarioB5(d, passo, pagine) {
  d.pagB5 = (d.pagB5 + passo + pagine.length) % pagine.length;
  d.selB5 = 0;
}

/** Tasti del Diario a pagine: frecce/WASD dentro la pagina (ai bordi si cambia pagina), Q/E o PagSu/PagGiù. */
function navigaDiarioB5(d, code) {
  const { pagine, pg } = statoDiarioB5(d);
  const C = OGGETTI_B5.diario.colonne;
  const n = pg.voci.length;
  if (['ArrowLeft', 'KeyA'].includes(code)) { if (d.selB5 > 0) d.selB5--; else { cambiaPaginaDiarioB5(d, -1, pagine); d.selB5 = pagine[d.pagB5].voci.length - 1; } }
  else if (['ArrowRight', 'KeyD'].includes(code)) { if (d.selB5 < n - 1) d.selB5++; else cambiaPaginaDiarioB5(d, 1, pagine); }
  else if (['ArrowUp', 'KeyW'].includes(code)) { if (d.selB5 - C >= 0) d.selB5 -= C; }
  else if (['ArrowDown', 'KeyS'].includes(code)) { if (d.selB5 + C < n) d.selB5 += C; else if (Math.floor(d.selB5 / C) < Math.floor((n - 1) / C)) d.selB5 = n - 1; }
  else if (['PageDown', 'KeyE'].includes(code)) cambiaPaginaDiarioB5(d, 1, pagine);
  else if (['PageUp', 'KeyQ'].includes(code)) cambiaPaginaDiarioB5(d, -1, pagine);
}

function coloreBordoB5(o, noto) {
  if (o.polarita === 'negativo' && noto) return '#b91c1c';
  if (o.tier === 'patto') return '#7f1d1d';
  if (o.tier === 'segreto') return '#0891b2';
  if (o.attivoB5) return '#15803d';
  return o.tier === 'forte' ? '#f9cb40' : '#57534e';
}

/** Disegna la pagina corrente del Diario sopra il pannello di base (la griglia di base è fuori schermo). */
function disegnaDiarioB5(d) {
  const { pagine, pg } = statoDiarioB5(d);
  const G = OGGETTI_B5.diario;
  const noti = new Set(conosciutiD());
  const tutti = tuttiGliOggettiB5();
  let nNoti = 0;
  for (const o of tutti) if (noti.has(o.id)) nNoti++;
  ctx.save();
  ctx.fillStyle = '#1c130c';
  ctx.fillRect(27, 17, W - 54, 38);
  drawTextFit(`${TESTI_B5.diarioTitolo} — Conosciuti ${nNoti} / ${tutti.length}`, W / 2, 31, W - 80, { size: 10, color: '#f9cb40' });
  drawTextFit(`‹ Q    ${pg.titolo}  ·  pagina ${d.pagB5 + 1} / ${pagine.length}    E ›`, W / 2, 47, W - 120, { size: 8, color: '#67e8f9' });
  for (let i = 0; i < pg.voci.length; i++) {
    const o = pg.voci[i];
    const c = cellaDiarioB5(i);
    const noto = noti.has(o.id);
    const sel = i === d.selB5;
    ctx.fillStyle = sel ? '#3b2a1a' : noto ? '#2a1d14' : '#4a3a2a';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = sel ? '#ffffff' : coloreBordoB5(o, noto);
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    drawPixelSprite(spriteD(o, !noto, 'k'), c.x + c.w / 2, c.y + 10, 1.2);
    drawTextFit(noto ? o.nome : '???', c.x + c.w / 2, c.y + c.h - 3, c.w - 4, { size: 6, color: noto ? '#e6d2aa' : '#a8a29e', shadow: false });
  }
  const o = pg.voci[d.selB5];
  const yD = G.y0 + G.righe * G.cellaA + 10;
  if (o) {
    const noto = noti.has(o.id);
    const sb = sbloccoB5(o.id);
    const bloccato = sb && !oggettoSbloccatoB5(o.id);
    drawTextFit(noto ? o.nome : '???', W / 2, yD, W - 80, { size: 9, color: '#4ade80' });
    drawTextFit(noto ? o.statsDesc : bloccato ? TESTI_B5.diarioBloccato(sb.condizione) : TESTI_B5.diarioIgnoto, W / 2, yD + 13, W - 80, { size: 8, color: noto ? '#67e8f9' : bloccato ? '#fca5a5' : '#67e8f9' });
    if (noto && o.lore) drawTextFit(`«${o.lore}»`, W / 2, yD + 25, W - 80, { size: 7.5, color: '#e6d2aa', weight: '', style: 'italic' });
    if (noto && o.temi && o.temi.length) drawTextFit(`Temi: ${o.temi.join(' · ')}`, W / 2, yD + 37, W - 80, { size: 7, color: '#a8a29e', weight: '' });
  }
  ctx.restore();
}

const cellaDiarioDBaseB5 = cellaDiarioD;
/** Con il Diario a pagine la griglia unica di base non si vede (né si clicca): le celle finiscono fuori schermo. */
cellaDiarioD = function (i, ...resto) {
  if (statoRun.diarioD && paginaOggettiB5(statoRun.diarioD)) return { x: -4000, y: -4000, w: 1, h: 1 };
  return cellaDiarioDBaseB5.call(this, i, ...resto);
};

const disegnaDiarioDBaseB5 = disegnaDiarioD;
disegnaDiarioD = function (...args) {
  const r = disegnaDiarioDBaseB5.apply(this, args);
  try { const d = statoRun.diarioD; if (d && paginaOggettiB5(d)) disegnaDiarioB5(d); } catch (err) { console.error('[B5] diario', err); }
  return r;
};

const tastoDiarioDBaseB5 = tastoDiarioD;
tastoDiarioD = function (code, ...resto) {
  const d = statoRun.diarioD;
  const mia = paginaOggettiB5(d);
  const r = tastoDiarioDBaseB5.call(this, code, ...resto);
  try { if (mia && statoRun.diarioD === d && paginaOggettiB5(d)) navigaDiarioB5(d, code); } catch (err) { console.error('[B5] diario tasti', err); }
  return r;
};

const clickDiarioDBaseB5 = clickDiarioD;
clickDiarioD = function (mx, my, ...resto) {
  const d = statoRun.diarioD;
  const mia = paginaOggettiB5(d);
  const r = clickDiarioDBaseB5.call(this, mx, my, ...resto);
  try {
    if (mia && statoRun.diarioD === d) {
      const { pagine, pg } = statoDiarioB5(d);
      if (my >= 38 && my <= 54) { if (mx < W / 2 - 60) cambiaPaginaDiarioB5(d, -1, pagine); else if (mx > W / 2 + 60) cambiaPaginaDiarioB5(d, 1, pagine); }
      for (let i = 0; i < pg.voci.length; i++) {
        const c = cellaDiarioB5(i);
        if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) { d.selB5 = i; break; }
      }
    }
  } catch (err) { console.error('[B5] diario click', err); }
  return r;
};

/** Oggetti per pagina nella Stanza dello Sviluppatore. */
function perPaginaPannelloB5() {
  return OGGETTI_B.sviluppatore.colonne * OGGETTI_B5.pannello.righe;
}

const cellaPannelloBBaseB5 = cellaPannelloB;
/** Stanza dello Sviluppatore a pagine: si vede la pagina dell'oggetto selezionato, le altre celle sono fuori schermo. */
cellaPannelloB = function (i, ...resto) {
  const perPag = perPaginaPannelloB5();
  if (CATALOGO_OGGETTI.length <= perPag) return cellaPannelloBBaseB5.call(this, i, ...resto);
  const p = statoRun.pannelloB;
  const pagina = Math.floor(((p && p.sel) || 0) / perPag);
  if (Math.floor(i / perPag) !== pagina) {
    const c = cellaPannelloBBaseB5.call(this, perPag - 1, ...resto);
    c.x = -4000;
    return c;
  }
  return cellaPannelloBBaseB5.call(this, i % perPag, ...resto);
};

const tastoPannelloBBaseB5 = tastoPannelloB;
tastoPannelloB = function (code, ...resto) {
  const p = statoRun.pannelloB;
  if (p && (code === 'PageDown' || code === 'PageUp')) {
    const perPag = perPaginaPannelloB5();
    const n = CATALOGO_OGGETTI.length;
    const pagine = Math.ceil(n / perPag);
    const pagina = (Math.floor(p.sel / perPag) + (code === 'PageDown' ? 1 : pagine - 1)) % pagine;
    p.sel = Math.min(n - 1, pagina * perPag);
    return true;
  }
  return tastoPannelloBBaseB5.call(this, code, ...resto);
};

const disegnaPannelloSviluppatoreBBaseB5 = disegnaPannelloSviluppatoreB;
disegnaPannelloSviluppatoreB = function (...args) {
  const r = disegnaPannelloSviluppatoreBBaseB5.apply(this, args);
  try {
    const p = statoRun.pannelloB;
    const perPag = perPaginaPannelloB5();
    if (p && CATALOGO_OGGETTI.length > perPag) {
      drawTextFit(TESTI_B5.pannelloPagina(Math.floor(p.sel / perPag) + 1, Math.ceil(CATALOGO_OGGETTI.length / perPag)), W / 2, H - 40, 220, { size: 7.5, color: '#f9cb40' });
    }
  } catch (err) { console.error('[B5] pannello', err); }
  return r;
};

// ===========================================================================
// 15. SONDA QA / SVILUPPO
// ===========================================================================
Object.assign(window.__teatro.interni, {
  OGGETTI_B5, CHIAVI_B5, TESTI_B5, SBLOCCHI_B5, ICONE_B5_DIFETTI,
  CATALOGO_PATTO, CATALOGO_SEGRETO, OGGETTI_ATTIVI, SPRITE_PROIETTILI,
  nuoviB5: Object.freeze({ passivi: PASSIVI_B5.map((o) => o.id), patti: PATTI_B5.map((o) => o.id), segreti: SEGRETI_B5.map((o) => o.id), attivi: ATTIVI_B5.map((o) => o.id) }),
  tuttiGliOggettiB5, sezioniCatalogoB5, daiOggettoB5, oggettoSbloccatoB5, estraiAttivoB5, gradimentoB5,
  /** Stato B5 della run in corso (riferimento vivo). */
  statoB5: () => B5(),
  /** Statistiche B5 correnti (riferimento vivo). */
  statB5: () => statoRun.statB5 || null,
});
