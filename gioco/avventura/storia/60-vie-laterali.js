/*
 * storia/60-vie-laterali.js — Capitolo FACOLTATIVO «Le strade di fuori»: le due vie laterali fra San Leucio e la Reggia.
 * Solo dati (contratto in ../LEGGIMI.md). Fonti: trama/ferruccio-bibbia.md, «Espansioni e indicazioni per il gioco»
 * (righe 1325-1353: Espansione I, Casertavecchia; Espansione III, Santa Maria Capua Vetere); i testi già approvati del
 * gioco d'azione (gioco/teatro/h6-casertavecchia.js, gioco/teatro/h7-anfiteatro.js), riusati e marcati // [teatro].
 * Battute: // [bibbia] = parola per parola dalla bibbia; // [teatro] = dal Teatro (// [teatro, adattata] se ritoccata
 * per l'avventura); // [nuovo] = scritta per l'avventura nello stesso tono.
 *
 * MAPPA DEL CAPITOLO
 *
 *                       casertavecchia.salita ── casertavecchia.borgo ── casertavecchia.sagrato
 *                              ▲                                          │ (porta: chiave di Taddeo │ finestrella: scala)
 *                              │                                          ▼
 *   [leucio.arrivo] ←── strada.bivio ──→ [reggia.cancello]      casertavecchia.sagrestia ── casertavecchia.campanile
 *                              │                                                              (il Campanaro Senza Volto)
 *                              ▼
 *                       anfiteatro.arcate ── anfiteatro.arena ── anfiteatro.sotterranei ── anfiteatro.gabbie
 *                                            (il Giudice, Agnese)  (due giuramenti, argano)   (il terzo, la rudis)
 *
 * PERCORSO
 *  0. strada.bivio (ingresso, id fisso): la pietra miliare e tre sentieri. La Reggia è sempre aperta: tutto il capitolo
 *     si può saltare. Oltre il cancello della Reggia non si torna indietro (lo dice il «guarda» del sentiero).
 *  CASERTAVECCHIA — «Le Campane del Perdono»
 *  1. ENIGMA 1 — Le parole non dette: tre campane, tre scritte («PER CHI PARTÌ», «PER CHI DIEDE», «PER CHI FECE
 *     TORTO»). Le parole si scoprono nel borgo: «Resta» (ex voto dell'edicola), «Grazie» (la lapide della fontana),
 *     «Perdonami» (Taddeo, se perdonato; altrimenti la porta murata del borgo). Si tira ogni corda pensando alla
 *     parola giusta. Le parole sbagliate fanno solo suonare un rimorso: nessun fallimento.
 *  2. ENIGMA 2 — Entrare in sagrestia: taddeo = perdonato → Taddeo dà la chiave; altrimenti Taddeo ha sbarrato la
 *     porta e avvisato il Campanaro (il costo che si vede): serve la scala a pioli del borgo sotto la finestrella.
 *  3. CONFRONTO — il Campanaro Senza Volto: tacciono le tre campane; resta la sua corda. L'ultima parola non detta è
 *     il suo nome, Anselmo, scritto nel registro della sagrestia. Sale un'anima, resta il ricordo delle campane.
 *     Chiavi: campane-perdono + taddeo-perdono-detto | taddeo-tradimento-compiuto. Ritorno al bivio.
 *  ANFITEATRO — «L'Arena dei Dimenticati»
 *  4. ENIGMA 3 — Scendere nell'ipogeo: la manovella dell'argano è nella sabbia dell'arena; con l'argano si cala il
 *     montacarichi fino alle gabbie. Lungo la strada, tre giuramenti incisi: il compagno di Spartaco (rotto con la
 *     fuga), il soldato longobardo (rotto aprendo la porta ai Saraceni), Felix (sciolto: il popolo gli diede la rudis).
 *  5. CONFRONTO — il Giudice dell'Arena: «portami la prova che un giuramento si scioglie senza tradirlo». Prima la
 *     rudis, poi la tessera col nome di chi la ricevette (in qualunque ordine). Manca il pollice del popolo:
 *     agnese = risvegliata → Agnese, sulle gradinate, lo alza per prima e le ombre la seguono; agnese = sognante →
 *     Ferruccio sale fra le ombre e mostra loro la tessera di Felix (un passo in più). Rivelazione obbligatoria: la
 *     magia di Donna Luciana è tramandata da secoli; il Velo è un giuramento antico che nessuno ha saputo sciogliere.
 *     Chiave: arena-dimenticati. Poi la scena con Agnese (risvegliata) o il gesto accanto a lei che dorme (sognante).
 *
 * Chiavi «segna» che escono dal capitolo: campane-perdono, taddeo-perdono-detto, taddeo-tradimento-compiuto,
 * arena-dimenticati. Nessun flag di decisione nuovo. Oggetti che escono: ricordo-campane, ricordo-arena.
 */

AV.capitolo({ id: 'vie-laterali', titolo: 'Le strade di fuori', ordine: 4.5, sottotitolo: 'Casertavecchia e l\'Arena' });

// --- Personaggi del capitolo ---
AV.personaggio({ id: 'campanaro', nome: 'Il Campanaro Senza Volto', colore: '#b8c0cc',
  figura: { foglio: 'h6_campanaro', celle: 7, alt: 84 } });
AV.personaggio({ id: 'giudice', nome: 'Il Giudice dell\'Arena', colore: '#d6c08a',
  figura: { foglio: 'giudice-arena', celle: 10, alt: 84 } });

// --- Oggetti di Casertavecchia ---
AV.oggetto({ id: 'chiave-sagrestia', nome: 'La chiave della sagrestia',
  descrizione: 'Una chiave lunga, di ferro nero, con l\'anello consumato. Taddeo l\'ha presa dalla sagrestia del duomo.',
  icona: { sagoma: 'chiave' },
  guarda: [['pensa', 'Ferro battuto male, a fretta. Mio padre l\'avrebbe rifatta. Apre lo stesso.']] }); // [nuovo]
AV.oggetto({ id: 'scala-pioli', nome: 'La scala a pioli',
  descrizione: 'Una scala corta di castagno, di quelle per cogliere le olive. Sta in spalla.',
  icona: { punti: [[4, 2], [7, 2], [7, 22], [4, 22], [4, 2], [13, 2], [16, 2], [16, 22], [13, 22]] },
  guarda: [['pensa', 'Sette pioli. Basta per arrivare a una finestra bassa.']] }); // [nuovo]
AV.oggetto({ id: 'ricordo-campane', nome: 'Il ricordo delle campane',
  descrizione: 'Una luce grigia e tiepida, salita dal campanile del duomo. Dentro, un rintocco solo, che non fa male.',
  icona: { sagoma: 'anima' },
  guarda: [
    ['dice', 'didascalia', 'Il Campanaro era il sagrestano del duomo. Suonava a morto per chi se n\'era andato senza chiedere perdono, e teneva per sé le parole che nessuno aveva detto. Il Velo gli ha preso il volto: gli ha lasciato solo le corde.'], // [teatro]
    ['pensa', 'Resta, grazie, perdonami. E un nome. Quattro parole, e il borgo dorme.'], // [nuovo]
  ] });

// ============================================================================================================
// 0. IL BIVIO — quadro d'ingresso del capitolo (id fisso)
// ============================================================================================================
AV.quadro({
  id: 'strada.bivio', capitolo: 'vie-laterali', nome: 'La strada di notte, al bivio',
  fondale: { immagine: 'avventura/strada-bivio',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['quinte', { colore: '#16141f' }],
      ['forma', { punti: [[0, 150], [120, 96], [230, 120], [300, 150], [0, 150]], colore: '#1f1d2a' }],
      ['albero', { x: 70, y: 250, h: 120, tipo: 'leccio' }], ['albero', { x: 560, y: 250, h: 110, tipo: 'pino' }],
      ['suolo', { tipo: 'erba', y: 236 }],
      ['forma', { punti: [[250, 300], [300, 236], [340, 236], [390, 300]], colore: '#3a3428' }],
      ['forma', { punti: [[300, 236], [150, 200], [130, 206], [280, 244]], colore: '#33302a' }],
      ['forma', { punti: [[340, 236], [520, 214], [530, 222], [360, 246]], colore: '#33302a' }],
      ['statua', { x: 318, y: 250, h: 40 }], ['fili', { n: 4 }], ['nebbia', { alfa: 0.12 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'cap-vie-laterali', [
      ['capitolo', 'vie-laterali'],
      ['pensa', 'I fili d\'oro tirano dritti verso la Reggia. Ma la strada, qui, si divide: su per il colle, e giù per la via antica. Due deviazioni. La Reggia può aspettare un poco: la notte non passa.'], // [nuovo]
      ['diario', 'Fra San Leucio e la Reggia la strada si divide. Avanti, la Reggia. Su, la mulattiera di Casertavecchia. Giù, la via Appia verso Santa Maria. Nessuno mi obbliga a deviare.'], // [nuovo]
      ['obiettivo', 'Andare alla Reggia. Oppure, prima, salire a Casertavecchia o scendere all\'Anfiteatro.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'miliare', nome: 'La pietra miliare', x: 304, y: 206, w: 30, h: 48, sagoma: 'statua',
      guarda: [['pensa', 'Una pietra miliare borbonica, col giglio scalpellato in cima. «NAPOLI M. XVI». Qualcuno ci ha appoggiato un lumino, che non si consuma.']], // [nuovo]
      usa: [['pensa', 'Ferruccio passa le dita sul giglio. La pietra è fredda come tutto, stanotte. Ma le miglia sono ancora quelle: il mondo fuori c\'è.']] }, // [nuovo]
    { id: 'verso-reggia', nome: 'Il viale verso la Reggia', x: 256, y: 236, w: 130, h: 56, uscita: 'reggia.cancello',
      guarda: [['pensa', 'Il viale dritto, fra i platani, fino al cancello della Reggia. I fili d\'oro ci entrano tutti. Oltre quel cancello non si torna indietro: le strade di fuori resteranno qui.']], // [nuovo]
      usa: [['pensa', 'Ferruccio si stringe nella giacca e prende il viale. Dietro di lui il bivio resta al buio.']] }, // [nuovo]
    { id: 'verso-casertavecchia', nome: 'La mulattiera di Casertavecchia', x: 130, y: 180, w: 120, h: 50,
      uscita: 'casertavecchia.salita',
      guarda: [
        ['se', { visto: 'campane-perdono' },
          [['pensa', 'Lassù il campanile tace. È il primo silenzio buono di tutta la notte.']], // [nuovo]
          [['pensa', 'La mulattiera sale fra gli ulivi fino al borgo vecchio sul colle. In cima, contro la luna, un campanile. Si sente una campana: suona da sola.']]], // [nuovo]
      ] },
    { id: 'verso-anfiteatro', nome: 'La via Appia, verso Santa Maria', x: 380, y: 200, w: 150, h: 46,
      uscita: 'anfiteatro.arcate',
      guarda: [
        ['se', { visto: 'arena-dimenticati' },
          [['pensa', 'Laggiù l\'arena è vuota, adesso. Le ombre se ne sono andate per conto loro.']], // [nuovo]
          [['pensa', 'Le pietre larghe della via Appia, lisce di duemila anni di passi. Scende verso Santa Maria Capua Vetere, dove c\'è l\'Anfiteatro. Da laggiù viene un rumore di folla, e nessuna folla.']]], // [nuovo]
      ] },
    { id: 'verso-leucio', nome: 'La strada per San Leucio', x: 0, y: 220, w: 50, h: 70, uscita: 'leucio.arrivo',
      guarda: [['pensa', 'Indietro, verso il borgo della seta. I telai battono ancora, piano.']] }, // [nuovo]
    { id: 'fili', nome: 'I fili d\'oro', x: 360, y: 24, w: 200, h: 60,
      guarda: [['pensa', 'Vengono da tutte le parti, dai tetti di Caserta, da San Leucio, dal colle. Si stringono in un fascio solo, sopra il viale. Come le briglie di un cavallo.']] }, // [nuovo]
    { id: 'colle', nome: 'Il colle', x: 60, y: 96, w: 180, h: 60,
      guarda: [['pensa', 'Il colle dei Tifatini. In cima c\'era Caserta prima di Caserta: la Casa Hirta, il borgo vecchio. I Re l\'hanno lasciato lassù e sono scesi in pianura.']] }, // [nuovo]
  ],
});

// ============================================================================================================
// CASERTAVECCHIA — 1. LA SALITA
// ============================================================================================================
AV.quadro({
  id: 'casertavecchia.salita', capitolo: 'vie-laterali', nome: 'La mulattiera di Casertavecchia',
  fondale: { immagine: 'avventura/casertavecchia-salita',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['quinte', { colore: '#14141b' }],
      ['muro', { x: 360, y: 90, w: 280, h: 160, tono: '#3a3936' }], ['arco', { x: 470, y: 130, w: 80, h: 120 }],
      ['forma', { punti: [[560, 90], [580, 30], [600, 90]], colore: '#2a2a2e' }],
      ['albero', { x: 90, y: 250, h: 90, tipo: 'leccio' }], ['albero', { x: 200, y: 246, h: 70, tipo: 'leccio' }],
      ['suolo', { tipo: 'tufo', y: 246 }], ['muro', { x: 260, y: 170, w: 60, h: 80, tono: '#46443f' }],
      ['luce', { x: 290, y: 200, r: 40, colore: '#f9cb40' }], ['nebbia', { alfa: 0.18 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'cv-arrivo', [
      ['suono', 'campana'],
      ['dice', 'didascalia', 'In cima al colle il borgo antico dorme di pietra: archi, vicoli, e il campanile del duomo contro la luna.'], // [teatro]
      ['dice', 'didascalia', 'Ferruccio raggiunge l\'antico borgo di Casertavecchia, dove le campane custodiscono le parole che gli abitanti non hanno mai pronunciato.'], // [bibbia]
      ['diario', 'Sono salito a Casertavecchia. Lassù le campane suonano da sole, e la pietra si ricorda di tutto.'], // [teatro]
      ['obiettivo', 'Entrare nel borgo e salire al duomo, dove suonano le campane.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'giu', nome: 'Giù per la mulattiera', x: 0, y: 230, w: 60, h: 62, uscita: 'strada.bivio',
      guarda: [['pensa', 'La mulattiera torna giù al bivio, fra gli ulivi.']] }, // [nuovo]
    { id: 'porta-borgo', nome: 'La porta del borgo', x: 470, y: 130, w: 80, h: 120, uscita: 'casertavecchia.borgo',
      guarda: [['pensa', 'Un arco di tufo grigio, mangiato dal vento. Una volta c\'era una porta con la sbarra: adesso c\'è solo il buio del vicolo.']] }, // [nuovo]
    { id: 'edicola', nome: 'L\'edicola dei lumini', x: 260, y: 168, w: 60, h: 80,
      guarda: [['pensa', 'Una Madonnina nel muro, e sotto una fila di lumini votivi accesi. Fiamme ferme, che non si consumano. In mezzo, appeso a un chiodo, un ex voto.']], // [nuovo]
      usa: [['pensa', 'Ferruccio si toglie il cappello davanti alla Madonnina. Non sa più pregare, ma le mani se lo ricordano.']] }, // [nuovo]
    { id: 'exvoto', nome: 'L\'ex voto', x: 280, y: 186, w: 22, h: 26, sagoma: 'foglio',
      guarda: [['pensa', 'Un cuore di latta, e appuntato col filo un berretto da soldato, piccolo. Dietro, a matita: «Pe\' Ciccillo, partito pe\' Gaeta. Te l\'avevo da dì e nun te l\'aggio ditto.»']], // [nuovo]
      usa: [
        ['pensa', 'Ferruccio gira il foglietto. In fondo, scritta più piccola, la parola che la madre non disse quando il figlio partì: «Resta».'], // [nuovo]
        ['unaVolta', 'cv-parola-resta', [
          ['segna', 'cv-parola-resta'],
          ['diario', 'Una parola non detta: «Resta». Una madre a un figlio che partiva soldato.'], // [nuovo]
        ]],
      ] },
    { id: 'ulivi', nome: 'Gli ulivi', x: 60, y: 160, w: 170, h: 80,
      guarda: [['pensa', 'Ulivi vecchi, contorti come mani. Sotto, le reti stese per la raccolta, ferme a metà del lavoro da sei anni.']] }, // [nuovo]
    { id: 'valle', nome: 'La valle', x: 100, y: 40, w: 220, h: 80,
      guarda: [['pensa', 'Di quassù si vede tutta la piana: Caserta, i tetti di San Leucio, e laggiù la Reggia, enorme, coi fili d\'oro che ci scendono dentro come in un pozzo.']] }, // [nuovo]
    { id: 'campanile-lontano', nome: 'Il campanile', x: 556, y: 24, w: 50, h: 70,
      guarda: [['pensa', 'Il campanile del duomo, sopra i tetti. Una campana oscilla, e nessuno la tira.']] }, // [nuovo]
  ],
});

// ============================================================================================================
// CASERTAVECCHIA — 2. IL BORGO
// ============================================================================================================
AV.quadro({
  id: 'casertavecchia.borgo', capitolo: 'vie-laterali', nome: 'I vicoli del borgo vecchio',
  fondale: { immagine: 'avventura/casertavecchia-borgo',
    disegno: [['cielo', { tono: 'notte', luna: true }], ['quinte', { colore: '#121116' }],
      ['case', { n: 6, alto: 130, finestre: 1 }], ['arco', { x: 250, y: 110, w: 120, h: 140 }],
      ['suolo', { tipo: 'tufo', y: 250 }], ['fontana', { x: 120, y: 240, w: 70 }],
      ['porta', { x: 430, y: 160, w: 50, h: 90, stato: 'chiusa' }], ['muro', { x: 430, y: 160, w: 50, h: 90, tono: '#3a3936' }],
      ['lampione', { x: 220, y: 160, h: 90, acceso: true }], ['nebbia', { alfa: 0.14 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'cv-borgo', [
      ['pensa', 'Vicoli stretti, archi uno dietro l\'altro. Nessuno. Sulle porte, qua e là, lettere scritte col gesso e lasciate a metà.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'indietro', nome: 'Verso la porta del borgo', x: 0, y: 220, w: 50, h: 72, uscita: 'casertavecchia.salita',
      guarda: [['pensa', 'Indietro, alla porta e alla mulattiera.']] }, // [nuovo]
    { id: 'arco', nome: 'Il vicolo del duomo', x: 260, y: 120, w: 100, h: 130, uscita: 'casertavecchia.sagrato',
      guarda: [['pensa', 'Sotto l\'arco il vicolo sale verso il sagrato. Il rintocco viene di là.']] }, // [nuovo]
    { id: 'fontana', nome: 'La fontana con la lapide', x: 100, y: 200, w: 100, h: 56,
      guarda: [['pensa', 'Una fontana di pietra, con una lapide: «A MASTRO BIAGIO CHE PORTÒ L\'ACQUA AL BORGO E NON VOLLE NIENTE». Sotto c\'è un graffio, piccolo.']], // [nuovo]
      usa: [
        ['pensa', 'Ferruccio si china. Sotto la lapide, inciso con un chiodo, a lettere storte: «gra». Poi niente. Chi lo scriveva s\'è fermato, come se si vergognasse.'], // [nuovo]
        ['unaVolta', 'cv-parola-grazie', [
          ['segna', 'cv-parola-grazie'],
          ['diario', 'Una parola non detta: «Grazie». Il borgo a Mastro Biagio, che gli portò l\'acqua e non volle niente.'], // [nuovo]
        ]],
      ] },
    { id: 'porta-murata', nome: 'La porta murata', x: 430, y: 160, w: 50, h: 90,
      guarda: [['pensa', 'Una porta chiusa con i mattoni, e una croce di gesso sopra. Sul muro nuovo, a gesso, lettere a metà: «perd».']], // [nuovo]
      usa: [
        ['pensa', 'Ferruccio appoggia la mano sui mattoni. Una figlia che se ne andò senza chiedere perdono al padre, e il padre che murò la porta per non vederla tornare. «Perdonami»: nessuno dei due l\'ha detto.'], // [nuovo]
        ['unaVolta', 'cv-parola-perdonami', [
          ['segna', 'cv-parola-perdonami'],
          ['diario', 'Una parola non detta: «Perdonami». Dietro una porta murata del borgo.'], // [nuovo]
        ]],
      ] },
    { id: 'scala', nome: 'Una scala a pioli', x: 500, y: 180, w: 30, h: 70, sagoma: 'cassa',
      se: { tutti: [{ non: { flag: { taddeo: 'perdonato' } } }, { nonVisto: 'cv-scala-presa' }] },
      guarda: [['pensa', 'Una scala corta di castagno, appoggiata al muro sotto un ulivo. Per le olive.']], // [nuovo]
      usa: [['prendi', 'scala-pioli'], ['segna', 'cv-scala-presa'], ['nascondi', 'scala'],
        ['pensa', 'Ferruccio se la mette in spalla. Non pesa niente: è il castagno buono.']] }, // [nuovo]
    { id: 'gatto', nome: 'Un gatto', x: 380, y: 230, w: 30, h: 20, sagoma: 'gatto',
      guarda: [['pensa', 'Un gatto grigio, fermo a metà di un salto, sospeso sopra un gradino. Anche lui aspetta la mattina.']] }, // [nuovo]
    { id: 'lampione', nome: 'Il lampione', x: 212, y: 160, w: 20, h: 90, sagoma: 'lampione',
      guarda: [['pensa', 'Una lanterna a olio sotto l\'arco. Fa una luce gialla che non trema.']] }, // [nuovo]
  ],
});

// ============================================================================================================
// CASERTAVECCHIA — 3. IL SAGRATO (Taddeo)
// ============================================================================================================
AV.quadro({
  id: 'casertavecchia.sagrato', capitolo: 'vie-laterali', nome: 'Il sagrato del duomo',
  fondale: { immagine: 'avventura/casertavecchia-sagrato',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['quinte', { colore: '#101015' }],
      ['palazzo', { x: 150, w: 300, h: 190, archi: 3, finestre: 1 }],
      ['forma', { punti: [[470, 250], [470, 40], [530, 20], [590, 40], [590, 250]], colore: '#2c2b2e', bordo: '#5d6274' }],
      ['finestra', { x: 515, y: 60, w: 30, h: 40, accesa: false }],
      ['suolo', { tipo: 'tufo', y: 250 }], ['porta', { x: 270, y: 170, w: 60, h: 80, stato: 'chiusa' }],
      ['porta', { x: 490, y: 190, w: 40, h: 60, stato: 'chiusa' }], ['finestra', { x: 540, y: 160, w: 24, h: 28, accesa: false }],
      ['muro', { x: 0, y: 236, w: 140, h: 20, tono: '#46443f' }], ['nebbia', { alfa: 0.12 }]],
    luce: { tono: 'notte' } },
  musica: 'velo',
  entrata: [
    ['unaVolta', 'cv-sagrato', [
      ['suono', 'campana'],
      ['pensa', 'Il duomo, con la facciata di pietra a strisce e il campanile accanto. Sul sagrato c\'è qualcuno.'], // [nuovo]
      ['se', { flag: { taddeo: 'perdonato' } },
        [['pensa', 'Taddeo. Seduto sul parapetto, col cappello fra le mani, come chi aspetta da molto.']], // [nuovo]
        [
          ['dice', 'taddeo', 'Ancora tu.'], // [teatro]
          ['dice', 'taddeo', 'Al Corso mi hai guardato come si guarda un traditore. E allora traditore sia.'], // [teatro, adattata]
          ['dice', 'taddeo', 'Il Campanaro sa che stai arrivando. Gliel\'ho detto io.'], // [teatro]
          ['dice', 'taddeo', 'E alla guardia della Reggia ho detto pure il resto: che c\'è un burattino che cammina sveglio, e come si chiama.'], // [nuovo]
          ['suono', 'campana'], ['effetto', 'scossa'],
          ['dice', 'didascalia', 'Taddeo tira la corda una volta sola, e se ne va per il vicolo senza voltarsi.'], // [teatro]
          ['nascondi', 'taddeo'], ['segna', 'cv-taddeo-andato'],
          ['pensa', 'La porta della sagrestia ha una sbarra nuova, di traverso. L\'ha messa lui, prima di andarsene.'], // [nuovo]
          ['diario', 'Taddeo era sul sagrato di Casertavecchia. Ha avvisato il Campanaro, ha sbarrato la sagrestia, ha venduto il mio nome alla guardia. Se n\'è andato senza voltarsi.'], // [nuovo]
          ['obiettivo', 'La sagrestia è sbarrata. Trovare un altro modo di entrare: la finestrella è bassa.'], // [nuovo]
        ]],
    ]],
  ],
  punti: [
    { id: 'taddeo', nome: 'Taddeo', x: 80, y: 172, w: 44, h: 78, personaggio: 'taddeo', posa: 0,
      se: { tutti: [{ flag: { taddeo: 'perdonato' } }, { nonVisto: 'cv-taddeo-andato' }] },
      guarda: [['pensa', 'Taddeo, l\'amico. Ha la faccia di uno che non dorme da sei anni, anche se la notte non è mai finita.']], // [nuovo]
      usa: [
        ['unaVolta', 'cv-taddeo-parla', [
          ['dice', 'taddeo', 'Ferruccio. Sei salito fin quassù.'], // [teatro]
          ['dice', 'taddeo', 'Al Corso mi hai lasciato andare. Non me lo meritavo, e lo sapevamo tutti e due.'], // [teatro, adattata]
          ['dice', 'taddeo', 'Queste campane suonano per le parole che uno non ha detto. Io una ce l\'ho in gola da vent\'anni: perdonami.'], // [teatro]
          ['dice', 'didascalia', 'Ferruccio non risponde. Gli posa una mano sulla spalla.'], // [teatro]
          ['dice', 'taddeo', 'Il Campanaro è là dietro. Prendi questa, è della sagrestia. E tieni dritta la testa: io la mia l\'ho tenuta bassa troppo a lungo.'], // [teatro]
          ['prendi', 'chiave-sagrestia'], ['segna', 'cv-parola-perdonami'],
          ['diario', 'Taddeo mi ha chiesto perdono, sul sagrato. Ha detto la sua parola: «Perdonami». E mi ha dato la chiave della sagrestia.'], // [nuovo]
          ['obiettivo', 'Aprire la sagrestia con la chiave di Taddeo e salire al campanile.'], // [nuovo]
        ], [
          ['dice', 'taddeo', 'Vai. Io resto qua a guardare il campanile. Quando smette di suonare, scendo pure io.'], // [nuovo]
        ]],
      ],
      con: { '*': [['dice', 'taddeo', 'Tienilo tu. Io di cose tue in tasca ne ho tenute abbastanza.']] } }, // [nuovo]
    { id: 'duomo', nome: 'La facciata del duomo', x: 160, y: 70, w: 280, h: 96,
      guarda: [['pensa', 'San Michele Arcangelo. Pietra grigia e pietra chiara, a fasce, e archi intrecciati come in una tela. Lo fecero i Normanni, settecento anni fa, quando Caserta stava tutta quassù.']] }, // [nuovo]
    { id: 'portale', nome: 'Il portale', x: 270, y: 170, w: 60, h: 80,
      guarda: [['pensa', 'Il portone della chiesa, chiuso. Dietro si sente un mormorio, come di tante persone che pregano sottovoce. Ma è la pietra.']], // [nuovo]
      usa: [['pensa', 'Il portone non si muove. Le campane non sono di là: sono nel campanile, e al campanile si sale dalla sagrestia.']] }, // [nuovo]
    { id: 'campanile', nome: 'Il campanile', x: 470, y: 20, w: 120, h: 140,
      guarda: [['pensa', 'Il campanile, con la cella aperta in cima. Dentro, tre campane e una figura che tiene le corde. Non ha faccia: solo pietra liscia sotto il cappuccio.']] }, // [nuovo]
    { id: 'sagrestia-chiusa', nome: 'La porta della sagrestia', x: 490, y: 190, w: 40, h: 60,
      se: { nonVisto: 'cv-sagrestia-aperta' },
      guarda: [
        ['se', { flag: { taddeo: 'perdonato' } },
          [['pensa', 'La porticina della sagrestia, ai piedi del campanile. Chiusa a chiave.']], // [nuovo]
          [['pensa', 'La porticina della sagrestia. Una sbarra di ferro di traverso, inchiodata. Da qui non si entra.']]], // [nuovo]
      ],
      usa: [
        ['se', { flag: { taddeo: 'perdonato' } },
          [['pensa', 'Chiusa. Serve la chiave.']], // [nuovo]
          [['pensa', 'Ferruccio tira la sbarra. I chiodi tengono: chi l\'ha messa sapeva battere. Bisogna entrare da un\'altra parte.']]], // [nuovo]
      ],
      con: { 'chiave-sagrestia': [['suono', 'serratura'], ['togli', 'chiave-sagrestia'], ['segna', 'cv-sagrestia-aperta'],
        ['pensa', 'La chiave gira due volte. La porta si apre su una scaletta e sull\'odore di cera.'], // [nuovo]
        ['vai', 'casertavecchia.sagrestia']],
        'scala-pioli': [['pensa', 'La porta è a terra: la scala serve più in alto. La finestrella, lì accanto.']] } }, // [nuovo]
    { id: 'sagrestia', nome: 'La sagrestia', x: 490, y: 190, w: 40, h: 60, uscita: 'casertavecchia.sagrestia',
      se: { visto: 'cv-sagrestia-aperta' },
      guarda: [['pensa', 'La porta della sagrestia, aperta.']] }, // [nuovo]
    { id: 'finestrella', nome: 'La finestrella della sagrestia', x: 538, y: 156, w: 30, h: 34,
      se: { nonVisto: 'cv-scala-posata' },
      guarda: [['pensa', 'Una finestrella con l\'inferriata rotta, a due metri da terra. Ci passa uno magro. Ferruccio è magro.']], // [nuovo]
      usa: [['pensa', 'Troppo alta per arrivarci con le mani. Ci vorrebbe qualcosa per salire.']], // [nuovo]
      con: { 'scala-pioli': [['togli', 'scala-pioli'], ['segna', 'cv-scala-posata'], ['mostra', 'scala-posata'],
        ['pensa', 'Ferruccio appoggia la scala sotto la finestrella. Sette pioli: basta.']] } }, // [nuovo]
    { id: 'scala-posata', nome: 'La scala sotto la finestrella', x: 536, y: 156, w: 34, h: 94, uscita: 'casertavecchia.sagrestia',
      se: { visto: 'cv-scala-posata' },
      guarda: [['pensa', 'La scala a pioli, appoggiata sotto la finestrella.']], // [nuovo]
      usa: [['pensa', 'Ferruccio sale, si piega e passa fra i ferri dell\'inferriata.']]}, // [nuovo]
    { id: 'parapetto', nome: 'Il parapetto', x: 0, y: 220, w: 70, h: 40,
      guarda: [['pensa', 'Sotto il parapetto, il buio della valle. Una volta, di qui, si sentivano le campane di tutti i paesi della piana. Stanotte si sente solo questa.']] }, // [nuovo]
    { id: 'vicolo', nome: 'Il vicolo, giù al borgo', x: 130, y: 236, w: 60, h: 56, uscita: 'casertavecchia.borgo',
      guarda: [['pensa', 'Il vicolo scende verso la fontana e la porta del borgo.']] }, // [nuovo]
  ],
});

// ============================================================================================================
// CASERTAVECCHIA — 4. LA SAGRESTIA (il registro di Anselmo)
// ============================================================================================================
AV.quadro({
  id: 'casertavecchia.sagrestia', capitolo: 'vie-laterali', nome: 'La sagrestia del duomo',
  fondale: { immagine: 'avventura/casertavecchia-sagrestia',
    disegno: [['cielo', { tono: 'interno' }], ['muro', { x: 0, y: 30, w: 640, h: 230, tono: '#2c2b2e' }],
      ['suolo', { tipo: 'assi', y: 250 }], ['banco', { x: 120, y: 236, w: 160 }],
      ['muro', { x: 380, y: 110, w: 110, h: 140, tono: '#3a2a20' }], ['scala', { x: 540, y: 60, w: 70, h: 190 }],
      ['finestra', { x: 200, y: 60, w: 30, h: 36, accesa: false }],
      ['luce', { x: 180, y: 200, r: 70, colore: '#fbbf24' }]],
    luce: { tono: 'interno' } },
  musica: 'cappella',
  entrata: [
    ['unaVolta', 'cv-sagrestia', [
      ['pensa', 'Odore di cera fredda e di panni chiusi. Su un leggio, un registro aperto. Una scala di legno sale nel campanile, e le corde ci passano accanto, tese.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'registro', nome: 'Il registro del sagrestano', x: 140, y: 196, w: 100, h: 40, sagoma: 'libro',
      guarda: [['pensa', 'Un registro grosso, con una colonna di nomi e una crocetta accanto a ognuno: le campane a morto. Quarant\'anni di nomi, con la stessa mano.']], // [nuovo]
      usa: [
        ['pensa', 'Ferruccio torna alla prima pagina. «Io, Anselmo, sagrestano di questo duomo, suonerò per tutti.» E sotto, piccolo: «Per me, chi suonerà?»'], // [nuovo]
        ['pensa', 'L\'ultima pagina è del giorno del Velo. Il nome di Anselmo è scritto, e cancellato, e riscritto, come se la mano non sapesse più di chi era.'], // [nuovo]
        ['unaVolta', 'cv-nome-anselmo', [
          ['segna', 'cv-nome-anselmo'],
          ['diario', 'Il sagrestano del duomo si chiamava Anselmo. Ha suonato per tutti, quarant\'anni. Il suo nome, nessuno l\'ha mai detto.'], // [nuovo]
        ]],
      ] },
    { id: 'cero', nome: 'Il cero', x: 170, y: 150, w: 20, h: 46,
      guarda: [['pensa', 'Un cero grande, acceso, con la fiamma ferma come dipinta.']] }, // [nuovo]
    { id: 'armadio', nome: 'L\'armadio dei paramenti', x: 380, y: 110, w: 110, h: 140,
      guarda: [['pensa', 'Pianete viola e nere, piegate con cura. In un cassetto, le corde di ricambio e un cappuccio di lana grigia, uguale a quello della figura lassù.']], // [nuovo]
      usa: [['pensa', 'Ferruccio richiude il cassetto piano, come in casa d\'altri.']] }, // [nuovo]
    { id: 'corde', nome: 'Le corde', x: 500, y: 40, w: 30, h: 200,
      guarda: [['pensa', 'Tre corde scendono dalla cella e salgono, scendono e salgono, da sole. Una quarta pende ferma: quella non la tira nessuno.']], // [nuovo]
      usa: [['pensa', 'Le corde scottano di freddo. Da qui sotto non si capisce a quale campana va ciascuna: bisogna salire.']] }, // [nuovo]
    { id: 'su', nome: 'La scala del campanile', x: 540, y: 60, w: 70, h: 190, uscita: 'casertavecchia.campanile',
      guarda: [['pensa', 'Una scala di legno, ripida, che sale nel buio della torre.']] }, // [nuovo]
    { id: 'porta', nome: 'La porta sul sagrato', x: 20, y: 150, w: 60, h: 100,
      guarda: [
        ['se', { visto: 'cv-sagrestia-aperta' },
          [['pensa', 'La porta da cui è entrato, aperta sul sagrato.']], // [nuovo]
          [['pensa', 'La porta sul sagrato. Da questa parte la sbarra è solo infilata negli anelli.']]], // [nuovo]
      ],
      usa: [
        ['se', { visto: 'cv-sagrestia-aperta' }, [], [
          ['suono', 'ferro'], ['segna', 'cv-sagrestia-aperta'],
          ['pensa', 'Ferruccio sfila la sbarra dagli anelli. Taddeo l\'aveva inchiodata da fuori: da dentro bastava una mano.'], // [nuovo]
        ]],
        ['vai', 'casertavecchia.sagrato'],
      ] },
  ],
});

// ============================================================================================================
// CASERTAVECCHIA — 5. LA CELLA CAMPANARIA (confronto: il Campanaro Senza Volto)
// ============================================================================================================

/** Le tre parole che Ferruccio può pensare tirando una corda (compaiono solo quelle scoperte). */
const PAROLE_CV = [
  { parola: 'Resta', chiave: 'cv-parola-resta' },
  { parola: 'Grazie', chiave: 'cv-parola-grazie' },
  { parola: 'Perdonami', chiave: 'cv-parola-perdonami' },
];

/** Dopo ogni campana giusta: se tutte e tre tacciono, il Campanaro abbassa le mani. */
const TRE_CAMPANE_CV = ['se', { visto: ['cv-campana-piccola', 'cv-campana-mezzana', 'cv-campana-grande'] }, [
  ['posa', 'campanaro', 2],
  ['pensa', 'Le tre campane tacciono. Il Campanaro abbassa le mani. Gli resta una corda sola, la quarta, legata al polso: quella che nessuno ha mai tirato per lui.'], // [nuovo]
  ['obiettivo', 'Resta la corda del Campanaro. Qual è la parola che nessuno gli ha mai detto?'], // [nuovo]
]];

/**
 * Le voci della scelta su una corda: una per parola scoperta, più «Lascia la corda».
 * @param {string} giusta la parola della campana
 * @param {string} chiave la chiave da segnare quando la campana tace
 * @param {Array} rimorso le azioni del rintocco storto
 * @param {Array} pace le azioni del rintocco giusto
 */
function corda(giusta, chiave, rimorso, pace) {
  return ['scelta', PAROLE_CV.map((p) => ({
    testo: `Pensa a «${p.parola}» e tira la corda`, se: { visto: p.chiave },
    fai: p.parola === giusta
      ? [['suono', 'campana'], ...pace, ['segna', chiave], TRE_CAMPANE_CV]
      : [['suono', 'campana'], ['effetto', 'scossa'], ...rimorso],
  })).concat([{ testo: 'Lascia la corda', fai: [['pensa', 'Ferruccio lascia andare la corda. Non sa ancora che cosa dirle.']] }])]; // [nuovo]
}

AV.quadro({
  id: 'casertavecchia.campanile', capitolo: 'vie-laterali', nome: 'La cella delle campane',
  fondale: { immagine: 'avventura/casertavecchia-campanile',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }],
      ['arco', { x: 40, y: 40, w: 160, h: 200 }], ['arco', { x: 440, y: 40, w: 160, h: 200 }],
      ['muro', { x: 0, y: 0, w: 640, h: 36, tono: '#2c2b2e' }], ['suolo', { tipo: 'assi', y: 256 }],
      ['forma', { punti: [[60, 40], [580, 40], [580, 48], [60, 48]], colore: '#3a2a20' }],
      ['luce', { x: 320, y: 140, r: 110, colore: '#c7d2e8' }], ['nebbia', { alfa: 0.2 }]],
    luce: { tono: 'notte' } },
  musica: 'creatura',
  entrata: [
    ['unaVolta', 'cv-campanile', [
      ['se', { flag: { taddeo: 'perdonato' } },
        [['suono', 'campana'],
          ['pensa', 'In cima alla scala, la cella. Tre campane sulla graticcia di legno, e in mezzo una figura di pietra col cappuccio, che tira le corde a turno. Ogni rintocco sveglia qualcosa nel petto.']], // [nuovo]
        [['dice', 'didascalia', 'Il Campanaro ti aspetta: la corda è già tesa.'], // [teatro]
          ['suono', 'campana'], ['effetto', 'scossa'], ['suono', 'campana'], ['effetto', 'velo'],
          ['pensa', 'Sapeva che arrivava. Le tre campane suonano insieme, e il rintocco entra nelle ossa: la bottega vuota, il padre che non torna, Agnese che non lo riconosce. Tutto in una volta.']]], // [nuovo]
      ['dice', 'campanaro', 'Chi sale fin qua sopra porta una parola che non ha detto. Tutti. Io la suono, e lui se la ricorda.'], // [nuovo]
      ['dice', 'didascalia', 'Il Campanaro Senza Volto: una figura di pietra che risveglia i rimorsi attraverso i rintocchi.'], // [bibbia, adattata]
      ['diario', 'Nella cella del campanile c\'è il Campanaro Senza Volto. Ogni campana tiene una parola che nessuno ha detto. Se le do la parola giusta, forse tace.'], // [nuovo]
      ['obiettivo', 'Dare a ogni campana la sua parola non detta: leggere le scritte sul bronzo.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'campanaro', nome: 'Il Campanaro Senza Volto', x: 290, y: 150, w: 60, h: 100, personaggio: 'campanaro', posa: 0,
      se: { nonVisto: 'campane-perdono' },
      guarda: [['pensa', 'Pietra grigia, un cappuccio di lana, e sotto il cappuccio niente: una faccia liscia come un sasso di fiume. Le mani, invece, sono di uno che ha lavorato tutta la vita.']], // [nuovo]
      usa: [
        ['se', { visto: ['cv-campana-piccola', 'cv-campana-mezzana', 'cv-campana-grande'] }, [
          ['scelta', [
            { testo: 'Prendi la sua corda e tirala pensando a «Anselmo»', se: { visto: 'cv-nome-anselmo' }, fai: [
              ['suono', 'campana'], ['attendi', 600], ['posa', 'campanaro', 4],
              ['pensa', 'La campana grande suona una volta sola, piano, e il rintocco dice un nome. Anselmo. Sotto il cappuccio, nella pietra liscia, viene fuori una faccia: vecchia, stanca, sorpresa.'], // [nuovo]
              ['dice', 'campanaro', 'Anselmo. Quarant\'anni che nessuno… Grazie, guaglio\'. Mo\' posso scendere pure io.'], // [nuovo]
              ['dice', 'didascalia', 'Il Campanaro lascia andare la corda. Le campane tacciono: per la prima volta il borgo dorme davvero.'], // [teatro]
              ['effetto', 'anime'], ['suono', 'anime'],
              ['dice', 'didascalia', 'Il Campanaro era il sagrestano del duomo. Suonava a morto per chi se n\'era andato senza chiedere perdono, e teneva per sé le parole che nessuno aveva detto. Il Velo gli ha preso il volto: gli ha lasciato solo le corde.'], // [teatro]
              ['nascondi', 'campanaro'],
              ['prendi', 'ricordo-campane'], ['suono', 'prendi'],
              ['segna', 'campane-perdono'],
              ['se', { flag: { taddeo: 'perdonato' } },
                [['segna', 'taddeo-perdono-detto'],
                  ['pensa', 'Giù, sul sagrato, una figura piccola si alza dal parapetto e si toglie il cappello. Taddeo ha sentito il silenzio.']], // [nuovo]
                [['segna', 'taddeo-tradimento-compiuto'],
                  ['pensa', 'Giù, sul sagrato, non c\'è nessuno. Il nome di Ferruccio, adesso, ce l\'ha la guardia della Reggia.']]], // [nuovo]
              ['diario', 'Al duomo il Campanaro ha lasciato andare la corda. Ho sentito il silenzio, dopo: pesava meno di tutte quelle parole.'], // [teatro]
              ['obiettivo', 'Tornare al bivio: la Reggia, o l\'altra strada.'], // [nuovo]
              ['pensa', 'Ferruccio scende la scala, attraversa il borgo che dorme, e torna giù per la mulattiera fino al bivio.'], // [nuovo]
              ['vai', 'strada.bivio'],
            ] },
            { testo: 'Tocca la pietra liscia del suo volto', fai: [
              ['pensa', 'Sotto le dita, la pietra è tiepida. Non ha faccia perché nessuno lo ha mai chiamato. Ma un nome l\'aveva: qualcuno l\'avrà scritto.'], // [nuovo]
              ['se', { visto: 'cv-nome-anselmo' }, [], [['obiettivo', 'Il Campanaro non ha nome. Forse nella sagrestia, nel registro, è scritto chi era.']]], // [nuovo]
            ] },
            { testo: 'Allontanati', fai: [['pensa', 'Ferruccio fa un passo indietro. La quarta corda aspetta.']] }, // [nuovo]
          ]],
        ], [
          ['dice', 'campanaro', 'Non a me. Ogni campana ha la sua parola: dàlla a lei.'], // [nuovo]
        ]],
      ],
      con: { '*': [['dice', 'campanaro', 'Le cose non suonano. Le parole sì.']] } }, // [nuovo]
    { id: 'campana-piccola', nome: 'La campana piccola', x: 90, y: 60, w: 70, h: 70, sagoma: 'campana',
      guarda: [
        ['se', { visto: 'cv-campana-piccola' },
          [['pensa', 'La campana piccola è ferma. Sul bronzo la scritta pare più chiara.']], // [nuovo]
          [['pensa', 'La campana piccola, verde di bronzo vecchio. Sulla fascia, a lettere in rilievo: «PER CHI PARTÌ».']]], // [nuovo]
      ],
      usa: [
        ['se', { visto: 'cv-campana-piccola' }, [['pensa', 'Tace. Ha avuto la sua parola.']], [ // [nuovo]
          corda('Resta', 'cv-campana-piccola',
            [['pensa', 'Il rintocco è storto. A Ferruccio torna in mente la mattina che suo padre uscì per la Reggia e lui, dal banco, non alzò nemmeno la testa.']], // [nuovo]
            [['pensa', 'La campana piccola suona una volta, chiara, e si ferma. Da qualche parte una madre ha detto «resta», con sei anni di ritardo. La corda si allenta.']]), // [nuovo]
        ]],
      ] },
    { id: 'campana-mezzana', nome: 'La campana mezzana', x: 480, y: 60, w: 80, h: 80, sagoma: 'campana',
      guarda: [
        ['se', { visto: 'cv-campana-mezzana' },
          [['pensa', 'La mezzana è ferma, con la corda molle.']], // [nuovo]
          [['pensa', 'La campana mezzana. Sulla fascia: «PER CHI DIEDE». Sotto, una fila di gocce d\'acqua scolpite.']]], // [nuovo]
      ],
      usa: [
        ['se', { visto: 'cv-campana-mezzana' }, [['pensa', 'Tace. Ha avuto la sua parola.']], [ // [nuovo]
          corda('Grazie', 'cv-campana-mezzana',
            [['pensa', 'Rintocco falso. Ferruccio rivede Agnese al telaio, il primo giorno, e se stesso che se ne va senza dire niente.']], // [nuovo]
            [['pensa', 'La mezzana suona tonda, come l\'acqua che cade in una vasca. Giù nel borgo, la fontana di Mastro Biagio fa un rumore: si è mossa. La corda si allenta.']]), // [nuovo]
        ]],
      ] },
    { id: 'campana-grande', nome: 'La campana grande', x: 230, y: 50, w: 180, h: 90, sagoma: 'campana',
      guarda: [
        ['se', { visto: 'cv-campana-grande' },
          [['pensa', 'La campana grande è ferma. Resta solo la quarta corda, quella del Campanaro.']], // [nuovo]
          [['pensa', 'La campana grande, sopra la testa del Campanaro. Sulla fascia: «PER CHI FECE TORTO». Il bronzo è crepato, e la crepa brilla.']]], // [nuovo]
      ],
      usa: [
        ['se', { visto: 'cv-campana-grande' }, [['pensa', 'Tace. Ha avuto la sua parola.']], [ // [nuovo]
          corda('Perdonami', 'cv-campana-grande',
            [['pensa', 'La campana grande rimbomba, e il rimbombo è la voce di Donna Luciana, nel giardino, la notte del Velo. Ferruccio stringe la corda fino a farsi male.']], // [nuovo]
            [['se', { flag: { taddeo: 'perdonato' } },
              [['pensa', 'La campana grande suona bassa, lunga. Dentro c\'è la voce di Taddeo, quella del sagrato: «perdonami». La crepa si chiude. La corda si allenta.']], // [nuovo]
              [['pensa', 'La campana grande suona bassa, lunga. È la parola della porta murata, di un padre e di una figlia. Non è quella di Taddeo: quella, Taddeo se l\'è portata via. La corda si allenta lo stesso.']]]]), // [nuovo]
        ]],
      ] },
    { id: 'luna', nome: 'La luna', x: 470, y: 150, w: 100, h: 80,
      guarda: [['pensa', 'Dall\'arco della cella, la luna. Fredda, ferma, più vicina che in città.']] }, // [nuovo]
    { id: 'giu', nome: 'La scala, giù in sagrestia', x: 20, y: 240, w: 80, h: 52, uscita: 'casertavecchia.sagrestia',
      guarda: [['pensa', 'La scala ripida torna giù in sagrestia.']] }, // [nuovo]
  ],
});

// ============================================================================================================
// ANFITEATRO — oggetti
// ============================================================================================================
AV.oggetto({ id: 'manovella', nome: 'La manovella dell\'argano',
  descrizione: 'Un manico di ferro piegato a gomito, con il foro quadro. Era sepolto nella sabbia dell\'arena.',
  icona: { sagoma: 'ferro' },
  guarda: [['pensa', 'Ferro romano? No: rifatto dopo, da qualche fabbro di Capua. Il foro quadro è per un perno d\'argano.']] }); // [nuovo]
AV.oggetto({ id: 'rudis', nome: 'La rudis', descrizione: 'Una spada di legno, liscia di mani. Ai gladiatori la davano quando erano liberi.',
  icona: { punti: [[10, 1], [13, 4], [12, 17], [16, 18], [16, 20], [12, 20], [11, 23], [9, 23], [8, 20], [4, 20], [4, 18], [8, 17], [7, 4]] },
  guarda: [['pensa', 'Una spada di legno. Io ne facevo da bambino, per giocare coi cavalieri con Taddeo. Questa invece voleva dire: hai finito, vai.']] }); // [nuovo]
AV.oggetto({ id: 'tessera-gladiatore', nome: 'La tessera del gladiatore',
  descrizione: 'Una tessera d\'osso, con un nome inciso: «FELIX · SPECTATVS».',
  icona: { sagoma: 'foglio' },
  guarda: [['dice', 'didascalia', 'Una tessera d\'osso, con un nome inciso. Nessuno se lo ricorda più.'], // [teatro]
    ['pensa', '«Spectatus»: visto, provato. Lo hanno guardato combattere, e hanno deciso che bastava.']] }); // [nuovo]
AV.oggetto({ id: 'ricordo-arena', nome: 'Il ricordo dell\'arena', descrizione: 'Una luce color sabbia, salita dalla toga del Giudice. Dentro, mille pollici alzati.',
  icona: { sagoma: 'anima' },
  guarda: [['dice', 'didascalia', 'Dalla toga del Giudice escono anime di ogni epoca. Avevano giurato tutte alla stessa magia: quella di Donna Luciana non è nata a Caserta. Qualcuno gliel\'ha tramandata, di mano in mano, da secoli.'], // [teatro]
    ['pensa', 'Il Velo è un giuramento. E un giuramento si può sciogliere senza tradirlo: lo deve sciogliere chi l\'ha ricevuto.']] }); // [nuovo]

// ============================================================================================================
// ANFITEATRO — 1. LE ARCATE
// ============================================================================================================
AV.quadro({
  id: 'anfiteatro.arcate', capitolo: 'vie-laterali', nome: 'L\'Anfiteatro Campano, le arcate',
  fondale: { immagine: 'avventura/anfiteatro-arcate',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['quinte', { colore: '#120d0a' }],
      ['palazzo', { x: 60, w: 520, h: 200, archi: 7, finestre: 0 }],
      ['arco', { x: 280, y: 130, w: 80, h: 120 }], ['suolo', { tipo: 'sabbia', y: 250 }],
      ['colonna', { x: 40, y: 250, h: 90 }], ['colonna', { x: 600, y: 250, h: 70 }],
      ['luce', { x: 320, y: 200, r: 60, colore: '#fbbf24' }], ['nebbia', { alfa: 0.1 }]],
    luce: { tono: 'notte' } },
  musica: 'ombra',
  entrata: [
    ['unaVolta', 'an-arrivo', [
      ['dice', 'didascalia', 'Nell\'antico Anfiteatro Campano sono raccolte le memorie dei combattenti di molte epoche.'], // [bibbia]
      ['pensa', 'Le arcate, una sopra l\'altra, travertino e mattone. Dall\'interno viene un rumore di folla: grida, battimani, un tamburo. Poi, di colpo, niente.'], // [nuovo]
      ['diario', 'Sono sceso per la via Appia fino a Santa Maria. L\'Anfiteatro è pieno di ombre, e qualcuno, dentro, giudica.'], // [nuovo]
      ['obiettivo', 'Entrare nell\'arena.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'appia', nome: 'La via Appia, verso il bivio', x: 0, y: 236, w: 60, h: 56, uscita: 'strada.bivio',
      guarda: [['pensa', 'La via antica torna su, verso il bivio e la Reggia.']] }, // [nuovo]
    { id: 'ingresso', nome: 'L\'ingresso dell\'arena', x: 280, y: 130, w: 80, h: 120, uscita: 'anfiteatro.arena',
      guarda: [['pensa', 'Il fornice grande. Di là, la sabbia chiara e le gradinate.']] }, // [nuovo]
    { id: 'chiavi', nome: 'Le teste sulle arcate', x: 100, y: 60, w: 160, h: 40,
      guarda: [['pensa', 'Sulla chiave di ogni arco c\'era una testa di dio scolpita: Giunone, Diana, Mercurio. Ne restano poche, senza naso. Guardano tutte giù, verso chi entra.']] }, // [nuovo]
    { id: 'mura', nome: 'Il travertino', x: 400, y: 100, w: 160, h: 140,
      guarda: [['pensa', 'Blocchi chiari, enormi, e mattone rosso dove la pietra se n\'è andata. Per secoli quelli di Capua ci hanno preso le pietre per farsi le case: mezza città vecchia è fatta d\'anfiteatro.']] }, // [nuovo]
    { id: 'colonna', nome: 'Una colonna spezzata', x: 28, y: 160, w: 26, h: 90, sagoma: 'statua',
      guarda: [['pensa', 'Una colonna rotta a metà, con sopra una corona d\'alloro di bronzo, verde. Qualcuno l\'ha lasciata lì, come un cappello su una sedia.']] }, // [nuovo]
    { id: 'folla', nome: 'Il rumore della folla', x: 220, y: 30, w: 200, h: 60,
      guarda: [['pensa', 'Il rumore torna e se ne va, a ondate. È la memoria di un rumore: duemila anni di domeniche.']] }, // [nuovo]
  ],
});

// ============================================================================================================
// ANFITEATRO — 2. L'ARENA (confronto: il Giudice; Agnese sulle gradinate)
// ============================================================================================================

/** La fine del confronto: il pollice in su, la rivelazione, il ricordo. */
const FINE_ARENA = [
  ['posa', 'giudice', 5], ['suono', 'scelta'],
  ['pensa', 'Il Giudice guarda le gradinate. Poi, lentamente, alza il pollice anche lui.'], // [nuovo]
  ['dice', 'giudice', 'Sciolto. Non rotto: sciolto. Ve ne potete andare, tutti.'], // [nuovo]
  ['dice', 'didascalia', 'Il Giudice dell\'Arena scende dal podio per l\'ultima volta. Le gradinate tacciono.'], // [teatro]
  ['effetto', 'anime'], ['suono', 'anime'],
  ['dice', 'didascalia', 'Dalla toga del Giudice escono anime di ogni epoca. Avevano giurato tutte alla stessa magia: quella di Donna Luciana non è nata a Caserta. Qualcuno gliel\'ha tramandata, di mano in mano, da secoli.'], // [teatro]
  ['dice', 'giudice', 'Il vostro Velo è un giuramento, burattino. Vecchio più di me. Qualcuno lo fece, prima di lei, e non lo seppe sciogliere: e allora l\'ha passato avanti, come si passa un debito.'], // [nuovo]
  ['dice', 'giudice', 'Chi l\'ha ricevuto, lo può sciogliere. Ricordatelo, quando sarai davanti a lei.'], // [nuovo]
  ['dice', 'didascalia', 'Ferruccio scopre che la magia utilizzata da Donna Luciana non nasceva a Caserta, ma era stata tramandata da secoli.'], // [bibbia, adattata: Violante → Donna Luciana]
  ['nascondi', 'giudice'],
  ['prendi', 'ricordo-arena'], ['suono', 'prendi'],
  ['segna', 'arena-dimenticati'],
  ['diario', 'Sono passato per l\'Arena dei Dimenticati. Elmi, scudi, lance: tutti fermi, tutti a guardare me.'], // [teatro]
  ['diario', 'La magia di Donna Luciana non è nata a Caserta: è vecchia di secoli. Il Velo è un giuramento che nessuno ha saputo sciogliere. Chi lo riceve, lo può sciogliere.'], // [nuovo]
  ['se', { flag: { agnese: 'risvegliata' } },
    [['obiettivo', 'Agnese è sulle gradinate. Poi, tornare al bivio per la via Appia.']], // [nuovo]
    [['obiettivo', 'Tornare al bivio per la via Appia. Sulle gradinate, fra le ombre, qualcuno dorme ancora.']]], // [nuovo]
];

/** Agnese risvegliata dà il passo che manca: il pollice del popolo lo alza lei per prima. */
const PASSO_AGNESE = [
  ['dice', 'giudice', 'Ma il pollice, stanotte, chi lo alza? Le gradinate dormono.'], // [nuovo]
  ['posa', 'agnese', 1],
  ['dice', 'agnese', 'Le gradinate dormono? Io no.'], // [nuovo]
  ['pensa', 'Agnese si alza e tende il braccio, col pollice in su. Il filo rosso le scende dalle dita fino alla sabbia. Un\'ombra accanto a lei la guarda, e alza il pollice. Poi un\'altra. Poi tutte.'], // [nuovo]
  ...FINE_ARENA,
];

AV.quadro({
  id: 'anfiteatro.arena', capitolo: 'vie-laterali', nome: 'L\'Arena dei Dimenticati',
  fondale: { immagine: 'avventura/anfiteatro-arena',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }],
      ['forma', { punti: [[0, 60], [640, 60], [640, 200], [0, 200]], colore: '#2a1f16' }],
      ['forma', { punti: [[0, 90], [640, 90], [640, 96], [0, 96]], colore: '#8a7a58' }],
      ['forma', { punti: [[0, 130], [640, 130], [640, 136], [0, 136]], colore: '#8a7a58' }],
      ['forma', { punti: [[0, 170], [640, 170], [640, 176], [0, 176]], colore: '#8a7a58' }],
      ['suolo', { tipo: 'sabbia', y: 210 }], ['muro', { x: 470, y: 150, w: 110, h: 60, tono: '#5e2f1b' }],
      ['luce', { x: 150, y: 180, r: 60, colore: '#f97316' }], ['luce', { x: 490, y: 180, r: 60, colore: '#f97316' }],
      ['nebbia', { alfa: 0.12 }]],
    luce: { tono: 'notte' } },
  musica: 'creatura',
  entrata: [
    ['unaVolta', 'an-arena', [
      ['suono', 'colpo'],
      ['pensa', 'La sabbia è chiara, rastrellata. Sulle gradinate siedono ombre con l\'elmo, col cappuccio, col cappello piumato, con la giubba dei Borboni: combattenti di tutte le epoche. Nessuno applaude.'], // [nuovo]
      ['pensa', 'Sul podio, una figura in toga, con la corona d\'alloro e il braccio teso. Il pollice è girato verso la sabbia.'], // [nuovo]
      ['dice', 'giudice', 'Ogni giuramento ha il suo giudice. Il tuo, burattino, sono io.'], // [teatro]
      ['dice', 'giudice', 'Questi, sulle gradinate, hanno giurato tutti. E hanno rotto tutti. Pollice verso, per l\'eternità.'], // [nuovo]
      ['dice', 'giudice', 'Tu non parli: non puoi giurare. E allora portami una prova. Che un giuramento si può sciogliere senza tradirlo. Portamela, e io alzo il pollice.'], // [nuovo]
      ['se', { flag: { agnese: 'risvegliata' } }, [
        ['suono', 'colpo'], ['effetto', 'scossa'],
        ['pensa', 'Il Giudice gira il pollice verso Ferruccio, e dalle gradinate un\'ombra con la lancia scende sulla sabbia.'], // [nuovo]
        ['dice', 'didascalia', 'Dalle gradinate un filo rosso si tende davanti a Ferruccio: il colpo si ferma sul filo. Agnese, lassù, non dice niente.'], // [teatro]
        ['pensa', 'Agnese. È venuta dietro di lui, tutta la strada. Siede in alto, fra le ombre, con la navetta in mano e il filo rosso che le scende dalle dita.'], // [nuovo]
      ], [
        ['pensa', 'Fra le ombre delle gradinate, in alto, una figura che non è un\'ombra: una ragazza che dorme con la testa appoggiata alla pietra.'], // [nuovo]
      ]],
      ['diario', 'Il Giudice dell\'Arena vuole una prova: che un giuramento si può sciogliere senza tradirlo. Sotto l\'arena ci sono i sotterranei.'], // [nuovo]
      ['obiettivo', 'Cercare nei sotterranei la prova che un giuramento si può sciogliere senza tradirlo.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'giudice', nome: 'Il Giudice dell\'Arena', x: 296, y: 30, w: 56, h: 100, personaggio: 'giudice', posa: 0,
      se: { nonVisto: 'arena-dimenticati' },
      guarda: [['pensa', 'Una toga bianca, gessata di polvere. Sotto la corona d\'alloro, una faccia di marmo senza età. Dalla toga escono fili, come da un rocchetto.']], // [nuovo]
      usa: [
        ['se', { visto: 'an-prova' },
          [['dice', 'giudice', 'La prova c\'è. Manca chi alza il pollice. Il popolo, burattino: è il popolo che scioglie.']], // [nuovo]
          [['dice', 'giudice', 'Una prova. Non una faccia triste: qui ne ho viste abbastanza.']]], // [nuovo]
      ],
      con: {
        'rudis': [['segna', 'an-rudis-mostrata'],
          ['se', { visto: 'an-tessera-mostrata' }, [
            ['dice', 'giudice', 'La rudis. E il nome di chi l\'ebbe: Felix. Non fuggì, non tradì: lo sciolse chi aveva ricevuto il suo giuramento.'], // [nuovo]
            ['segna', 'an-prova'],
          ], [
            ['dice', 'giudice', 'Una spada di legno. La davano a chi era libero. Ma di chi era? Senza un nome è un pezzo di legno.'], // [nuovo]
            ['obiettivo', 'La rudis non basta al Giudice: vuole sapere di chi era.'], // [nuovo]
          ]],
          ['se', { tutti: [{ visto: 'an-prova' }, { flag: { agnese: 'risvegliata' } }] }, PASSO_AGNESE],
          ['se', { tutti: [{ visto: 'an-prova' }, { non: { flag: { agnese: 'risvegliata' } } }] }, [
            ['dice', 'giudice', 'Ma il pollice, stanotte, chi lo alza? Le gradinate dormono.'], // [nuovo]
            ['obiettivo', 'Il pollice lo alza il popolo: le ombre delle gradinate devono riconoscere Felix.'], // [nuovo]
          ]]],
        'tessera-gladiatore': [['segna', 'an-tessera-mostrata'],
          ['se', { visto: 'an-rudis-mostrata' }, [
            ['dice', 'giudice', 'Felix. Spectatus. E la rudis era sua. Non fuggì, non tradì: lo sciolse chi aveva ricevuto il suo giuramento.'], // [nuovo]
            ['segna', 'an-prova'],
          ], [
            ['dice', 'giudice', 'Un nome. Felix. E che ne fece, Felix, del suo giuramento? Portami quello che gli diedero.'], // [nuovo]
            ['obiettivo', 'Il Giudice ha il nome, Felix: vuole vedere che cosa gli diedero.'], // [nuovo]
          ]],
          ['se', { tutti: [{ visto: 'an-prova' }, { flag: { agnese: 'risvegliata' } }] }, PASSO_AGNESE],
          ['se', { tutti: [{ visto: 'an-prova' }, { non: { flag: { agnese: 'risvegliata' } } }] }, [
            ['dice', 'giudice', 'Ma il pollice, stanotte, chi lo alza? Le gradinate dormono.'], // [nuovo]
            ['obiettivo', 'Il pollice lo alza il popolo: le ombre delle gradinate devono riconoscere Felix.'], // [nuovo]
          ]]],
        'ricordo-campane': [['dice', 'giudice', 'Campane. Parole non dette. Qui si giudicano le parole date.']], // [nuovo]
        '*': [['dice', 'giudice', 'Questo non scioglie niente.']] } }, // [nuovo]
    { id: 'agnese', nome: 'Agnese', x: 60, y: 60, w: 50, h: 70, personaggio: 'agnese', posa: 0,
      se: { flag: { agnese: 'risvegliata' } },
      guarda: [['pensa', 'Agnese, seduta fra le ombre, con la navetta in mano. Lo guarda come si guarda uno che è partito di casa senza salutare.']], // [nuovo]
      usa: [
        ['se', { visto: 'arena-dimenticati' }, [
          ['unaVolta', 'an-agnese-scena', [
            ['pensa', 'Ferruccio sale le gradinate, una per una, fino a lei. Si siede accanto. La pietra è ancora tiepida di folla.'], // [nuovo]
            ['dice', 'agnese', 'Ti sono venuta dietro da San Leucio. Non dire niente: tanto non puoi.'], // [nuovo]
            ['se', { flag: { sciarpa: 'al-collo' } },
              [['dice', 'agnese', 'La porti ancora. Ti sta storta, come il nodo che facevi tu.'], // [nuovo]
                ['pensa', 'Lei gliela aggiusta sul collo, con due dita, come si sistema un filo sul telaio.']], // [nuovo]
              [['dice', 'agnese', 'Me lo ricordo, sai, il rosso. Me lo ricordo addosso a te.']]], // [nuovo]
            ['dice', 'agnese', 'Hai sentito quello? Un giuramento si scioglie. Non si rompe. Pure il nostro, se un giorno vuoi: però me lo dici in faccia.'], // [nuovo]
            ['pensa', 'Ferruccio scuote la testa. Poi le prende la mano, e la tiene, e non la lascia finché lei non ride.'], // [nuovo]
            ['dice', 'agnese', 'Va bene. Vai alla Reggia. Io torno al telaio: qualcuno deve tessere, mentre voi altri fate gli eroi.'], // [nuovo]
            ['segna', 'an-agnese-scena'],
            ['diario', 'All\'Arena c\'era Agnese. Mi è venuta dietro. Mi ha tenuto la mano, e poi è tornata a San Leucio.'], // [nuovo]
          ], [
            ['dice', 'agnese', 'Vai, vai. Che la notte non passa da sola.'], // [nuovo]
          ]],
        ], [
          ['dice', 'agnese', 'Lo so, lo so, non puoi parlare. Fai tu: io sto qua. Se serve, ci sono.'], // [nuovo]
        ]],
      ],
      con: { 'ricordo-arena': [['dice', 'agnese', 'Tienilo tu. A me basta che te lo ricordi.']], // [nuovo]
        '*': [['dice', 'agnese', 'Bello. Ma non è questo che vuole quello là sopra.']] } }, // [nuovo]
    // Agnese sognante: dorme fra le ombre; si può solo lasciarle un gesto accanto.
    { id: 'dormiente', nome: 'Una ragazza che dorme', x: 60, y: 60, w: 50, h: 70, personaggio: 'agnese', posa: 0,
      se: { non: { flag: { agnese: 'risvegliata' } } },
      guarda: [['pensa', 'Agnese. Dorme seduta, con la testa contro la pietra e le mani in grembo, aperte, come se ci fosse ancora la navetta. Non è venuta dietro di lui: il Velo l\'ha portata qui da sola, fra i dimenticati.']], // [nuovo]
      usa: [
        ['unaVolta', 'an-agnese-gesto', [
          ['pensa', 'Ferruccio sale fino a lei. Non la sveglia: non saprebbe come. Si toglie la giacca e gliela posa sulle spalle, e le chiude le mani una sull\'altra, perché non prendano freddo.'], // [nuovo]
          ['pensa', 'Lei, nel sonno, stringe la stoffa. Un sorriso piccolo, di quelli che si fanno a un telaio che batte giusto. Poi più niente.'], // [nuovo]
          ['diario', 'All\'Arena c\'era Agnese, addormentata fra le ombre. Le ho lasciato la mia giacca. Non si è svegliata.'], // [nuovo]
        ], [
          ['pensa', 'Dorme. Tiene stretta la giacca.'], // [nuovo]
        ]],
      ],
      con: { 'ricordo-arena': [['pensa', 'Ferruccio le avvicina la luce. Lei si gira dall\'altra parte, nel sonno. Non è questo il ricordo che le manca.']], // [nuovo]
        '*': [['pensa', 'Non è una cosa che le serve. Le serve dormire, e qualcuno che la guardi mentre dorme.']] } }, // [nuovo]
    { id: 'ombre', nome: 'Le ombre sulle gradinate', x: 140, y: 70, w: 140, h: 110,
      guarda: [['pensa', 'Elmi da legionario, cotte di maglia, cappucci da brigante, giubbe borboniche. Tutti seduti, tutti zitti, tutti col pollice girato giù.']], // [nuovo]
      usa: [
        ['se', { tutti: [{ visto: 'an-prova' }, { nonVisto: 'arena-dimenticati' }, { non: { flag: { agnese: 'risvegliata' } } }] },
          [['pensa', 'Ferruccio alza il pollice, davanti alle ombre. Nessuno lo segue: un burattino non ha popolo. Ci vorrebbe il nome di uno di loro.']], // [nuovo]
          [['pensa', 'Le ombre non si girano. Guardano la sabbia, e aspettano un verdetto.']]], // [nuovo]
      ],
      con: { 'tessera-gladiatore': [
        ['se', { tutti: [{ visto: 'an-prova' }, { nonVisto: 'arena-dimenticati' }, { non: { flag: { agnese: 'risvegliata' } } }] }, [
          ['pensa', 'Ferruccio sale tre gradini e alza la tessera d\'osso sopra la testa, verso le ombre. FELIX. Un\'ombra con l\'elmo si volta. Si ricorda. Alza il pollice. Poi un\'altra. Poi tutte.'], // [nuovo]
          ...FINE_ARENA,
        ], [
          ['pensa', 'Le ombre guardano la tessera e poi il Giudice. Prima il Giudice deve sapere di chi parla questo nome.'], // [nuovo]
        ]]],
        '*': [['pensa', 'Le ombre non guardano. Non è roba loro.']] } }, // [nuovo]
    { id: 'manovella', nome: 'Un ferro nella sabbia', x: 400, y: 230, w: 30, h: 24, sagoma: 'ferro',
      se: { nonVisto: 'an-manovella-presa' },
      guarda: [['pensa', 'Un manico di ferro piegato a gomito spunta dalla sabbia, dove i rastrelli non arrivano.']], // [nuovo]
      usa: [['prendi', 'manovella'], ['segna', 'an-manovella-presa'], ['nascondi', 'manovella'],
        ['pensa', 'Ferruccio scava con le mani e lo tira fuori: una manovella d\'argano, col foro quadro.']] }, // [nuovo]
    { id: 'botola', nome: 'La scala dei sotterranei', x: 480, y: 150, w: 90, h: 60, uscita: 'anfiteatro.sotterranei',
      guarda: [['pensa', 'Una fenditura nella sabbia, lungo l\'asse dell\'arena, con una scala di pietra. Di là venivano su le belve e i combattenti.']] }, // [nuovo]
    { id: 'sabbia', nome: 'La sabbia', x: 160, y: 220, w: 200, h: 60,
      guarda: [['pensa', 'Sabbia chiara, fine, buttata sopra a tutto quello che è successo qui. Arena vuol dire questo: sabbia.']] }, // [nuovo]
    { id: 'uscita', nome: 'Il fornice, verso le arcate', x: 0, y: 220, w: 50, h: 72, uscita: 'anfiteatro.arcate',
      guarda: [['pensa', 'Il passaggio torna alle arcate e alla via Appia.']] }, // [nuovo]
  ],
});

// ============================================================================================================
// ANFITEATRO — 3. I SOTTERRANEI (due giuramenti, l'argano)
// ============================================================================================================
AV.quadro({
  id: 'anfiteatro.sotterranei', capitolo: 'vie-laterali', nome: 'I sotterranei dell\'arena',
  fondale: { immagine: 'avventura/anfiteatro-sotterranei',
    disegno: [['cielo', { tono: 'interno' }], ['muro', { x: 0, y: 20, w: 640, h: 240, tono: '#2a1f16' }],
      ['arco', { x: 40, y: 100, w: 90, h: 150 }], ['arco', { x: 180, y: 100, w: 90, h: 150 }], ['arco', { x: 320, y: 100, w: 90, h: 150 }],
      ['suolo', { tipo: 'tufo', y: 250 }], ['forma', { punti: [[480, 60], [580, 60], [580, 250], [480, 250]], colore: '#1d1610', bordo: '#5e2f1b' }],
      ['forma', { punti: [[500, 60], [560, 60], [560, 70], [500, 70]], colore: '#2a2622' }],
      ['luce', { x: 230, y: 160, r: 70, colore: '#fbbf24' }]],
    luce: { tono: 'interno' } },
  musica: 'ombra',
  entrata: [
    ['unaVolta', 'an-sotterranei', [
      ['pensa', 'Corridoi di mattone, gabbie aperte, e un odore di ferro vecchio. Sui muri, fra le gabbie, parole incise col coltello.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'su', nome: 'La scala, su nell\'arena', x: 0, y: 200, w: 40, h: 90, uscita: 'anfiteatro.arena',
      guarda: [['pensa', 'La scala torna su, nella luce della sabbia.']] }, // [nuovo]
    { id: 'giuramento-uno', nome: 'Un\'incisione latina', x: 50, y: 110, w: 70, h: 60,
      guarda: [['pensa', 'Lettere latine, profonde: «URI · VINCIRI · VERBERARI · FERROQUE NECARI». Il giuramento dei gladiatori al padrone: farsi bruciare, legare, battere, uccidere col ferro.']], // [nuovo]
      usa: [['pensa', 'Sotto, più storto, a graffio: «CON SPARTACO». Uno che giurò al padrone e scappò con gli altri, una notte, dalla scuola di Capua. Rotto con la fuga.'], // [nuovo]
        ['unaVolta', 'an-giuramento-uno', [['diario', 'Primo giuramento: un gladiatore giurò al padrone e scappò con Spartaco. Rotto con la fuga.']]]] }, // [nuovo]
    { id: 'giuramento-due', nome: 'Un\'incisione con la croce', x: 190, y: 110, w: 70, h: 60,
      guarda: [['pensa', 'Una croce, un nome longobardo, e una scritta: «giurai al principe di tenere la porta». E più sotto una data, l\'anno 841.']], // [nuovo]
      usa: [['pensa', 'L\'anno che i Saraceni bruciarono Capua antica. Qualcuno quella porta la aprì, di notte, per paura. Rotto col tradimento.'], // [nuovo]
        ['unaVolta', 'an-giuramento-due', [['diario', 'Secondo giuramento: un soldato giurò di tenere la porta di Capua e la aprì ai Saraceni. Rotto col tradimento.']]]] }, // [nuovo]
    { id: 'gabbia', nome: 'Una gabbia', x: 330, y: 120, w: 70, h: 130,
      guarda: [['pensa', 'Una gabbia di ferro, aperta. Dentro, l\'ombra di una belva che gira in tondo e non c\'è.']], // [nuovo]
      usa: [['pensa', 'Ferruccio richiude lo sportello piano. L\'ombra si accuccia.']] }, // [nuovo]
    { id: 'argano', nome: 'L\'argano del montacarichi', x: 470, y: 180, w: 40, h: 60,
      se: { nonVisto: 'an-argano' },
      guarda: [['pensa', 'Un argano di legno e ferro: da qui si calavano le gabbie nell\'ipogeo, più giù. Il perno è quadro, e la manovella non c\'è.']], // [nuovo]
      usa: [['pensa', 'Ferruccio prova a girare il perno con le mani. Niente: ci vuole una manovella.']], // [nuovo]
      con: { 'manovella': [['suono', 'ferro'], ['togli', 'manovella'], ['segna', 'an-argano'],
        ['pensa', 'La manovella entra nel perno quadro come se ci fosse stata sempre. Ferruccio gira: le corde cigolano, il pianale del montacarichi si stacca dal fondo.']] } }, // [nuovo]
    { id: 'montacarichi', nome: 'Il montacarichi', x: 490, y: 70, w: 80, h: 170,
      se: { visto: 'an-argano' }, uscita: 'anfiteatro.gabbie',
      guarda: [['pensa', 'Il pianale di legno, appeso alle corde. Scende nell\'ipogeo, dove stavano le gabbie più fonde.']], // [nuovo]
      usa: [['pensa', 'Ferruccio sale sul pianale, e scende piano nel buio.']] }, // [nuovo]
    { id: 'pozzo', nome: 'Il pozzo del montacarichi', x: 490, y: 70, w: 80, h: 170,
      se: { nonVisto: 'an-argano' },
      guarda: [['pensa', 'Un pozzo quadro, e in fondo il pianale del montacarichi, fermo. Le corde salgono fino all\'argano.']], // [nuovo]
      usa: [['pensa', 'Troppo fondo per saltare. Il pianale va calato con l\'argano.']] }, // [nuovo]
  ],
});

// ============================================================================================================
// ANFITEATRO — 4. LE GABBIE DELL'IPOGEO (il terzo giuramento, la rudis)
// ============================================================================================================
AV.quadro({
  id: 'anfiteatro.gabbie', capitolo: 'vie-laterali', nome: 'Le gabbie dell\'ipogeo',
  fondale: { immagine: 'avventura/anfiteatro-gabbie',
    disegno: [['cielo', { tono: 'interno' }], ['muro', { x: 0, y: 16, w: 640, h: 250, tono: '#1d1610' }],
      ['suolo', { tipo: 'tufo', y: 254 }], ['porta', { x: 120, y: 150, w: 70, h: 100, stato: 'aperta' }],
      ['porta', { x: 260, y: 150, w: 70, h: 100, stato: 'socchiusa' }], ['muro', { x: 420, y: 100, w: 140, h: 150, tono: '#2a1f16' }],
      ['forma', { punti: [[20, 30], [90, 30], [90, 250], [20, 250]], colore: '#14100c', bordo: '#5e2f1b' }],
      ['luce', { x: 300, y: 190, r: 80, colore: '#fbbf24' }], ['nebbia', { alfa: 0.16 }]],
    luce: { tono: 'interno' } },
  musica: 'velo',
  entrata: [
    ['unaVolta', 'an-gabbie', [
      ['pensa', 'L\'ipogeo. Gabbie in fila, piccole, una con lo sportello socchiuso. In fondo, su un muro più vecchio degli altri, una scritta che non è latino.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'su', nome: 'Il montacarichi, su', x: 20, y: 30, w: 70, h: 220, uscita: 'anfiteatro.sotterranei',
      guarda: [['pensa', 'Il pianale del montacarichi, che torna su ai sotterranei.']] }, // [nuovo]
    { id: 'giuramento-tre', nome: 'Un\'incisione con l\'alloro', x: 120, y: 100, w: 80, h: 50,
      guarda: [['pensa', 'Sopra la prima gabbia, inciso con cura, un ramo d\'alloro e una frase: «FELIX GIURÒ DI COMBATTERE FINO ALLA MORTE».']], // [nuovo]
      usa: [['pensa', 'E sotto, con un\'altra mano, più fresca: «IL POPOLO ALZÒ IL POLLICE. EBBE LA RUDIS». Non scappò, non aprì porte. Il suo giuramento non lo ruppe: glielo sciolsero.'], // [nuovo]
        ['unaVolta', 'an-giuramento-tre', [
          ['diario', 'Terzo giuramento: Felix giurò di combattere fino alla morte. Il popolo alzò il pollice e gli diede la rudis. Non l\'ha rotto: gliel\'hanno sciolto.'], // [nuovo]
          ['obiettivo', 'Portare al Giudice la prova di Felix: la rudis, e il suo nome.'], // [nuovo]
        ]]] },
    { id: 'rudis', nome: 'Una spada di legno', x: 150, y: 170, w: 30, h: 60,
      se: { nonVisto: 'an-rudis-presa' },
      guarda: [['pensa', 'Dentro la gabbia aperta, appesa a un chiodo, una spada di legno. La rudis.']], // [nuovo]
      usa: [['prendi', 'rudis'], ['segna', 'an-rudis-presa'], ['nascondi', 'rudis'],
        ['pensa', 'Ferruccio la stacca dal chiodo. È leggera, e liscia come un manico d\'attrezzo.']] }, // [nuovo]
    { id: 'tessera', nome: 'Qualcosa di bianco', x: 280, y: 220, w: 24, h: 20, sagoma: 'foglio',
      se: { nonVisto: 'an-tessera-presa' },
      guarda: [['pensa', 'Nella gabbia socchiusa, nella polvere, una tessera d\'osso.']], // [nuovo]
      usa: [['prendi', 'tessera-gladiatore'], ['segna', 'an-tessera-presa'], ['nascondi', 'tessera'],
        ['dice', 'didascalia', 'Una tessera d\'osso, con un nome inciso. Nessuno se lo ricorda più. Ferruccio la mette in tasca.']] }, // [teatro]
    { id: 'scritta-antica', nome: 'La scritta antica', x: 430, y: 110, w: 120, h: 80,
      guarda: [['pensa', 'Segni più vecchi del latino, a cerchi e a spirali, scavati nel tufo. In mezzo, ripetuto, un segno che Ferruccio conosce: un filo che si avvolge su se stesso, come il Velo sopra Caserta.']], // [nuovo]
      usa: [['pensa', 'Sotto la mano il tufo vibra, come una corda tesa. Un giuramento più vecchio dell\'arena, e nessuno l\'ha mai sciolto. Non c\'è niente, sotto, che dica «fu sciolto».'], // [nuovo]
        ['unaVolta', 'an-scritta-antica', [['diario', 'Nell\'ipogeo c\'è una scritta più vecchia dell\'arena, col segno del Velo. Un giuramento che nessuno ha sciolto.']]]] }, // [nuovo]
    { id: 'gabbie', nome: 'Le gabbie in fila', x: 340, y: 150, w: 70, h: 100,
      guarda: [['pensa', 'Gabbie piccole, per uomini, non per belve. Sui ferri, segni di unghie e di anelli.']] }, // [nuovo]
  ],
});

/*
 * IMMAGINI DA FAR DISEGNARE (gioco/assets/avventura/, teatro d'ombre: sagome scure, luci di lanterna, luna ferma;
 * la fascia in basso resta scura per l'interfaccia)
 *  - strada-bivio.png              Bivio notturno fra San Leucio e la Reggia: una pietra miliare borbonica col giglio, tre
 *                                  sentieri (il viale dei platani al centro, la mulattiera a sinistra, la via Appia a
 *                                  destra), il colle a sinistra, il fascio dei fili d'oro sopra il viale.
 *  - casertavecchia-salita.png     La mulattiera fra gli ulivi, un arco di tufo, un'edicola coi lumini, il campanile in alto
 *                                  contro la luna.
 *  - casertavecchia-borgo.png      Un vicolo ad archi del borgo vecchio, la fontana con la lapide, una porta murata con una
 *                                  croce di gesso, una scala a pioli appoggiata al muro.
 *  - casertavecchia-sagrato.png    La facciata a fasce del duomo, il campanile, la porticina e la finestrella della
 *                                  sagrestia, il parapetto sul vuoto.
 *  - casertavecchia-sagrestia.png  Un leggio col registro, un cero, l'armadio dei paramenti, la scala di legno che sale,
 *                                  le corde delle campane che scendono dal soffitto.
 *  - casertavecchia-campanile.png  La cella con tre campane sulla graticcia, gli archi aperti sulla luna, lo spazio al
 *                                  centro libero (ci sta il Campanaro).
 *  - anfiteatro-arcate.png         Due ordini di arcate di travertino e laterizio, il fornice centrale buio, una colonna
 *                                  spezzata a terra.
 *  - anfiteatro-arena.png          La sabbia chiara, le gradinate a fasce con le ombre sedute, il podio in alto al centro,
 *                                  le torce, la scala dei sotterranei a destra.
 *  - anfiteatro-sotterranei.png    Corridoi di mattone sotto l'arena, gabbie, l'argano e il pozzo del montacarichi.
 *  - anfiteatro-gabbie.png         Gabbie in fila, una aperta e una socchiusa, il pianale del montacarichi a sinistra, un
 *                                  muro più antico con spirali incise.
 */
