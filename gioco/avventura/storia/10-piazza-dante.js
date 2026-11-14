/*
 * storia/10-piazza-dante.js — Prologo, Capitolo 1 «Piazza Dante» e la Fucina del Ricordo (si gioca dopo il Corso).
 * Solo dati (contratto in ../LEGGIMI.md). Fonti: trama/ferruccio-bibbia.md §I, §III atto I, §VI, §IX, §X, §XI, §XII;
 * trama/inizio-memoria-e-doni.md; scene di trama/storia.json (capitolo piazza-dante, corso-trieste.fucina-del-ricordo).
 * Battute: // [bibbia] = parola per parola dalla bibbia; // [nuovo] = scritte qui, nello stesso tono.
 *
 * MAPPA DEL CAPITOLO
 * ------------------
 * PROLOGO (ordine 0)
 *   prologo.festa ........ la festa del 1845 si ferma, la luna immobile, tutti dormono sorridendo   [piazza-dante.risveglio]
 *                          punti: luna, fuochi fermi, ballerini, banda, «la figura a terra» → prologo.risveglio
 *   prologo.risveglio .... Ferruccio si sveglia col volto nero e senza voce (flag volto = nero)       [piazza-dante.risveglio, .tutorial]
 *                          i gesti: GUARDA la pozzanghera (il volto), TOCCA la gola (la voce), PRENDI la spada,
 *                          MOSTRA la spada al dormiente; uscita → piazza.centro (serve la spada)
 * PIAZZA DANTE (ordine 1)
 *   piazza.centro ........ banco di Tonino, sedia vuota, mozzarelle, dormiente; uscite a nastri / finestra / bottega / targa
 *                          dialogo tonino.banco: primo incontro (mozzarella) [tonino-primo-incontro], la bottega
 *                          di Gaetano [bottega-di-gaetano], i Quattro Canti, LA DECISIONE [scelta-tonino]
 *   piazza.nastri ........ Assunta coi nastri; banchetti fermi.  ENIGMA 1: il nastro azzurro scappato (è nei sigilli
 *                          della bottega) → ad Assunta → lei presta la lanterna e racconta la bottega di Gaetano
 *   piazza.bottega ....... la porta sprangata coi sigilli; il nastro impigliato; la porta → fucina.bottega
 *                          solo con visto 'corso-percorso' (prima risponde «chiuso»)
 *   piazza.finestra ...... Mariella alla finestra (dialogo mariella.finestra: il ferro che risuona sul Corso
 *                          [bottega-di-gaetano]); la filastrocca di Bianca [filastrocca]
 *   piazza.targa ......... la targa del 1839 con la versione ufficiale; il nome che manca; la spada sulla targa
 *                          [targa-commemorativa]
 *   piazza.quattro-canti . ENIGMA 2, il confronto col Gatto dei Quattro Canti [gatto-dei-quattro-canti]:
 *                          (1) la lanterna di Assunta illumina il buio → il gatto sul mucchio di cose di casa;
 *                          (la spada lo spezza ma si ricompone: non è un mostro da abbattere)
 *                          (2) la mozzarella di Tonino → scende dal mucchio e mangia;  (3) accarezzalo → si scioglie
 *                          in anime; resta il ricordo di Rosa (oggetto ricordo-rosa)
 *                          uscita verso Corso Trieste (USCITA → corso.inizio) quando: tonino_ricordo deciso,
 *                          targa colpita, indizio di Mariella → segna 'piazza-finita'
 *   DECISIONE 1 (piazza.centro, Tonino col ricordo-rosa in mano, o tema del dialogo):
 *       restituito → tonino_ricordo = restituito, lettera_agnese = vera, prendi lettera-agnese  [ricordo-restituito]
 *       negato     → tonino_ricordo = negato,     lettera_agnese = falsa, Ferruccio tiene ricordo-rosa [ricordo-negato]
 * FUCINA DEL RICORDO (ordine 2.5: dopo Corso Trieste; ingresso dalla porta della bottega in piazza)
 *   fucina.bottega ....... la bottega fredda; i ferri di Gaetano sul muro (tenaglie, l'impronta del punzone che manca,
 *                          l'ago da tracciare). ENIGMA 3: il mantice risveglia la forgia, il chiavistello della porta
 *                          del retro diventa rovente → con le tenaglie lo si alza → fucina.cuore
 *   fucina.cuore ......... Gaetano che batte (dialogo gaetano.fucina): il volto nero sull'incudine, Ferruccio tiene
 *                          il ferro con le tenaglie, Gaetano batte → flag volto = umano, il nome [corso-trieste.fucina-del-ricordo]
 *
 * CHIAVI 'segna' per gli altri capitoli: 'piazza-finita' (fine del capitolo 1), 'volto-ritrovato' (dopo la Fucina),
 * 'gatto-sciolto', 'targa-colpita', 'mariella-indizio'. Chiave attesa dal Corso: 'corso-percorso' (apre la Fucina).
 */

// --- I capitoli ---
AV.capitolo({ id: 'prologo', titolo: 'Prologo', ordine: 0, sottotitolo: 'La notte che si ferma' });
AV.capitolo({ id: 'piazza-dante', titolo: 'Piazza Dante', ordine: 1, sottotitolo: 'Il risveglio' });
AV.capitolo({ id: 'fucina-del-ricordo', titolo: 'La Fucina del Ricordo', ordine: 2.5, sottotitolo: 'Il nome e il volto' });

// --- Gli oggetti del capitolo ---
AV.oggetto({ id: 'spada-di-gaetano', nome: 'La spada', icona: { sagoma: 'ferro' },
  descrizione: "Una lama corta, battuta a mano. Pesa giusta, come se l'avessero fatta per il tuo braccio.",
  guarda: [
    ['pensa', "Una lama forgiata con gli ultimi strumenti di un fabbro. Non sai chi l'ha battuta. La mano, sì: non vuole lasciarla."], // [nuovo]
  ] });
AV.oggetto({ id: 'mozzarella', nome: 'La mozzarella di Tonino', icona: { punti: [[-6, 2], [-4, -4], [0, -6], [4, -4], [6, 2], [0, 6]] },
  descrizione: "Avvolta in una foglia, ancora tiepida. In tutta la piazza è l'unica cosa che sa di qualcosa.",
  guarda: [['pensa', "Profuma di latte e di mattina. Non hai fame: sotto la maschera non c'è una bocca. La tieni lo stesso."]] }); // [nuovo]
AV.oggetto({ id: 'nastro-azzurro', nome: 'Il nastro azzurro', icona: { punti: [[-7, -2], [7, -5], [6, 2], [-6, 5]] },
  descrizione: "Un nastro di seta azzurra, sfilacciato da un capo. Il vento della festa l'ha portato lontano.",
  guarda: [['pensa', "Seta buona, di quella che viene da San Leucio. Qualcuno, in piazza, lo starà cercando."]] }); // [nuovo]
AV.oggetto({ id: 'lanterna-di-assunta', nome: 'La lanterna di Assunta', icona: { sagoma: 'lampione' },
  descrizione: "Una lanterna di latta con un mozzicone di candela. La luce trema, ed è l'unica cosa che si muove.",
  guarda: [['pensa', "La fiamma trema. In tutta la città ferma, è l'unica cosa che respira insieme a te."]] }); // [nuovo]
AV.oggetto({ id: 'ricordo-rosa', nome: 'Il ricordo di Rosa', icona: { sagoma: 'anima' },
  descrizione: "Un'anima color di rosa, posata dentro un vecchio medaglione. È calda come una mano.",
  guarda: [
    ['pensa', "Stringi il medaglione e la piazza cambia. Una donna con le maniche arrotolate rimprovera un venditore che regala troppo. Rosa."], // [nuovo]
    ['pensa', "Rideva con la testa all'indietro. Sedeva accanto al banco, la sera, e contava i soldi due volte. Poi un inverno la sedia è rimasta vuota."], // [nuovo]
    ['se', { flag: { tonino_ricordo: 'negato' } },
      [['pensa', "È ancora calda. Tonino, laggiù, ride da solo. Il dolore di Rosa adesso lo porti tu."]], // [nuovo]
      [['pensa', "È il ricordo di Rosa, la moglie di Tonino. Con lei tornerebbe anche il dolore di averla persa."]]], // [nuovo]
  ] });
AV.oggetto({ id: 'lettera-agnese', nome: 'La lettera di Agnese', icona: { sagoma: 'foglio' },
  descrizione: "Una lettera piegata in quattro, chiusa con un filo di seta rossa. Tonino l'ha custodita per qualcuno.",
  guarda: [
    ['pensa', "Non la apri: non ancora. Sopra, una mano di donna ha scritto soltanto: «Per te.»"], // [nuovo]
    ['pensa', "Il filo rosso che la chiude ti stringe qualcosa nel petto. Non sai cosa. Lo saprai."], // [nuovo]
  ] });
AV.oggetto({ id: 'tenaglie-di-gaetano', nome: 'Le tenaglie di Gaetano', icona: { sagoma: 'ferro' },
  descrizione: "Tenaglie da forgia, il manico consumato dove la mano stringeva. Lungo il ferro, segni di mille prese.",
  guarda: [['pensa', "Il manico ha preso la forma di una mano. La tua ci entra quasi tutta."]] }); // [nuovo]

// --- Personaggio del capitolo (non è nei comuni) ---
AV.personaggio({ id: 'gatto-canti', nome: 'Il Gatto dei Quattro Canti', colore: '#6b7280', figura: { sagoma: 'gatto', alt: 70 } });

// --- Azioni condivise: la decisione su Tonino (si apre col ricordo in mano su Tonino o dal dialogo) ---
const DECISIONE_TONINO = [
  ['pensa', "Apri la mano. La luce di Rosa si alza dal medaglione e illumina il banco."], // [nuovo]
  ['dice', 'tonino', "Uh, che bella luce. Pare 'a lampa 'e 'na casa."], // [nuovo]
  ['pensa', "Se glielo rendi, Tonino ritroverà Rosa: e con lei il lutto. Se chiudi la mano, continuerà a sorridere a una sedia vuota, senza sapere perché."], // [nuovo]
  ['scelta', [
    { testo: 'Porgigli il ricordo di Rosa', fai: [
      ['flag', 'tonino_ricordo', 'restituito'], ['flag', 'lettera_agnese', 'vera'], ['togli', 'ricordo-rosa'],
      ['effetto', 'anime'],
      ['dice', 'didascalia', "Tonino riconosce un vecchio medaglione appartenuto a Rosa."], // [bibbia]
      ['dice', 'tonino', "Rosa..."], // [bibbia]
      ['dice', 'tonino', "Maronna mia. Erano anni che non dicevo il suo nome."], // [bibbia]
      ['dice', 'didascalia', "Comincia a piangere."], // [bibbia]
      ['dice', 'didascalia', "Ferruccio si avvicina."], // [bibbia]
      ['dice', 'tonino', "Nun fa niente, guagliò."], // [bibbia]
      ['dice', 'tonino', "Mi mancava pure questo."], // [bibbia]
      ['attendi', 600],
      ['dice', 'tonino', "Aspè. Mo' che me ricordo 'e Rosa, me ricordo pure 'n'ata cosa."], // [nuovo]
      ['dice', 'tonino', "'Na guagliona 'e San Leucio, 'na tessitrice, me lassaje 'na lettera. «Pe' 'nu fabbro», dicette. «Si nun torna isso, tenitela vuje.»"], // [nuovo]
      ['dice', 'tonino', "Tu tiene 'e mane 'e 'nu ferraro. Pigliatela. Rosa avesse fatto accussì."], // [nuovo]
      ['prendi', 'lettera-agnese'],
      ['segna', 'tonino-deciso'],
      ['diario', "Ho reso a Tonino il ricordo di Rosa. Adesso piange, e ride lo stesso. Mi ha dato una lettera di una tessitrice di San Leucio."], // [nuovo]
    ] },
    { testo: 'Chiudi la mano e lascialo sorridere', fai: [
      ['flag', 'tonino_ricordo', 'negato'], ['flag', 'lettera_agnese', 'falsa'],
      ['pensa', "Chiudi la mano. La luce si spegne fra le dita."], // [nuovo]
      ['dice', 'didascalia', "Tonino continua a sorridere."], // [bibbia]
      ['dice', 'tonino', "Moglie? Io? E chi se la ricorda!"], // [bibbia]
      ['dice', 'didascalia', "Ride da solo, poi torna a fissare una sedia vuota accanto al banchetto."], // [bibbia]
      ['segna', 'tonino-deciso'],
      ['diario', "Non ho reso a Tonino il ricordo di Rosa. Sorride ancora. Il medaglione lo porto io."], // [nuovo]
    ] },
  ]],
  ['obiettivo', "Uscire dai Quattro Canti verso Corso Trieste."], // [nuovo]
];

// Condizione per lasciare la piazza verso il Corso
const PIAZZA_PRONTA = { flag: { tonino_ricordo: '*' }, visto: ['targa-colpita', 'mariella-indizio'] };

// ============================== PROLOGO ==============================
AV.quadro({
  id: 'prologo.festa', capitolo: 'prologo', nome: 'Caserta, la notte della festa',
  fondale: { immagine: 'avventura/prologo-festa',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['palazzo', { x: 120, w: 400, h: 120, archi: 5, finestre: 3 }],
      ['case', { n: 5, finestre: 2 }], ['suolo', { tipo: 'selciato', y: 250 }], ['lampione', { x: 80, y: 250, h: 90, acceso: true }],
      ['lampione', { x: 560, y: 250, h: 90, acceso: true }], ['luce', { x: 320, y: 120, r: 160, colore: '#f6c56b' }], ['fili', { n: 5 }]],
    luce: { tono: 'notte' } },
  musica: 'festa',
  entrata: [
    ['unaVolta', 'prologo-visto', [
      ['capitolo', 'prologo'],
      ['dice', 'didascalia', "Caserta, 1845. La Reggia è finita, e la città fa festa."], // [nuovo]
      ['dice', 'didascalia', "Lanterne, una banda, i fuochi sopra i tetti. A mezzanotte qualcosa scende dalla luna, leggero come un velo di seta."], // [nuovo]
      ['effetto', 'velo'],
      ['dice', 'didascalia', "La musica si ferma a metà di una nota. La luna si ferma a metà del cielo. La gente si addormenta in piedi, sorridendo."], // [nuovo]
      ['obiettivo', "Guarda la festa ferma (clic destro), poi scendi verso la figura a terra."], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'luna', nome: 'La luna', x: 430, y: 24, w: 60, h: 56,
      guarda: [['pensa', "Una luna piena, ferma come un chiodo. Non cala, non sale. Pare che ascolti."]] }, // [nuovo]
    { id: 'fuochi', nome: 'I fuochi fermi', x: 180, y: 30, w: 120, h: 60,
      guarda: [['pensa', "Un fuoco d'artificio aperto a raggiera, immobile nel cielo, come un fiore di vetro."]] }, // [nuovo]
    { id: 'ballerini', nome: 'I ballerini', x: 250, y: 190, w: 70, h: 70, sagoma: 'donna',
      guarda: [['pensa', "Una coppia ferma a metà del giro. Lei ha gli occhi chiusi e sorride. Lui pure. Dormono ballando."]] }, // [nuovo]
    { id: 'banda', nome: 'La banda', x: 440, y: 190, w: 90, h: 70, sagoma: 'uomo',
      guarda: [['pensa', "Un trombone alzato verso la luna, le guance gonfie. La nota non esce. Il suonatore sorride, felice di non suonarla."]] }, // [nuovo]
    { id: 'figura', nome: 'Una figura a terra', x: 60, y: 240, w: 90, h: 46, uscita: 'prologo.risveglio',
      guarda: [['pensa', "Sul selciato di Piazza Dante, una figura nera, vestita da festa. È l'unica che non sorride."]] }, // [nuovo]
  ],
});

AV.quadro({
  id: 'prologo.risveglio', capitolo: 'prologo', nome: 'Il risveglio',
  fondale: { immagine: 'avventura/prologo-risveglio',
    disegno: [['cielo', { tono: 'notte', luna: true }], ['case', { n: 6, alto: true, finestre: 2 }], ['suolo', { tipo: 'selciato', y: 240 }],
      ['banco', { x: 420, y: 240, w: 120 }], ['luce', { x: 480, y: 210, r: 70, colore: '#f6c56b' }],
      ['forma', { punti: [[140, 262], [230, 256], [250, 270], [150, 278]], colore: '#1d2a3a', bordo: '#4b6a8a' }], ['nebbia', { alfa: 0.15 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'risveglio-visto', [
      ['flag', 'volto', 'nero'],
      ['pensa', "Apri gli occhi sulle pietre fredde. Il silenzio è così fitto che senti il tuo cuore."], // [nuovo]
      ['pensa', "Non sai perché sei vivo. Sai soltanto di aver perso tuo padre, la voce e la donna che amavi."], // [nuovo, da §I]
      ['diario', "Mi sono svegliato in Piazza Dante. La città dorme sotto una luna che non si muove."], // [nuovo]
      ['obiettivo', "Impara i gesti: GUARDA la pozzanghera (clic destro), TOCCA la gola (clic), PRENDI la spada, MOSTRA la spada al dormiente."], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'pozzanghera', nome: 'La pozzanghera', x: 140, y: 250, w: 110, h: 30,
      guarda: [
        ['pensa', "Nell'acqua ferma c'è una faccia nera, liscia, senza bocca. Alzi la mano: la faccia alza la mano."], // [nuovo]
        ['pensa', "È la tua."], // [nuovo]
        ['unaVolta', 'volto-visto', [['diario', "Il mio volto è nero, come una maschera che non si toglie."]]], // [nuovo]
      ],
      usa: [['pensa', "Tocchi l'acqua. Il riflesso trema e si ricompone, nero come prima."]] }, // [nuovo]
    { id: 'gola', nome: 'La tua gola', x: 270, y: 150, w: 50, h: 50,
      guarda: [['pensa', "Sotto la maschera, la gola. Il respiro c'è."]], // [nuovo]
      usa: [
        ['pensa', "Provi a chiamare qualcuno. Il fiato esce; la voce, no."], // [nuovo]
        ['unaVolta', 'voce-provata', [['diario', "Non ho più la voce. Parlerò con le mani e con le cose."]]], // [nuovo]
      ] },
    { id: 'spada', nome: 'Una spada', x: 330, y: 250, w: 70, h: 28, sagoma: 'ferro', se: { nonHa: 'spada-di-gaetano' },
      guarda: [['pensa', "Una spada corta, a terra accanto a te. La lama è battuta a mano, come facevano i fabbri di una volta."]], // [nuovo]
      usa: [
        ['prendi', 'spada-di-gaetano'],
        ['pensa', "La prendi. Il manico è caldo, come se qualcuno l'avesse appena lasciato."], // [nuovo]
        ['diario', "Avevo accanto una spada. La mano la conosce meglio di me."], // [nuovo]
      ] },
    { id: 'dormiente', nome: 'Un uomo addormentato', x: 520, y: 170, w: 44, h: 80, personaggio: 'cittadino',
      guarda: [['pensa', "Un uomo in abito da festa, appoggiato al banco. Dorme in piedi, e sorride come chi ha appena smesso di avere paura."]], // [nuovo]
      usa: [['pensa', "Lo scuoti piano. Non si sveglia. Mormora: «Si sta bene.»"]], // [nuovo]
      con: {
        'spada-di-gaetano': [
          ['pensa', "Gli mostri la lama, gliela fai luccicare sotto gli occhi. Non trema. Sorride alla spada come sorride alla luna."], // [nuovo]
          ['unaVolta', 'mostra-provato', [['diario', "Nessuno ha più paura di niente. Nemmeno di una spada."]]], // [nuovo]
        ],
        '*': [['pensa', "Non lo guarda nemmeno."]], // [nuovo]
      } },
    { id: 'lanterne', nome: 'Le lanterne della festa', x: 400, y: 40, w: 200, h: 50,
      guarda: [['pensa', "File di lanterne di carta da una casa all'altra. Le fiamme dentro non tremano: dipinte."]] }, // [nuovo]
    { id: 'in-piedi', nome: 'Alzati: la piazza', x: 600, y: 120, w: 36, h: 160, uscita: 'piazza.centro', se: { ha: 'spada-di-gaetano' },
      guarda: [['pensa', "La piazza, i banchetti, una luce di lanterna che, quella sì, trema."]], // [nuovo]
      chiuso: [['pensa', "Fai un passo e ti volti. C'è qualcosa, a terra, che non vuoi lasciare."]] }, // [nuovo]
  ],
});

// ============================== PIAZZA DANTE ==============================
AV.quadro({
  id: 'piazza.centro', capitolo: 'piazza-dante', nome: 'Piazza Dante',
  fondale: { immagine: 'avventura/piazza-centro',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['case', { n: 7, finestre: 3 }], ['suolo', { tipo: 'selciato', y: 250 }],
      ['banco', { x: 170, y: 250, w: 130 }], ['lampione', { x: 300, y: 250, h: 110, acceso: true }], ['luce', { x: 230, y: 210, r: 90, colore: '#f6c56b' }],
      ['porta', { x: 380, y: 186, w: 40, h: 64, stato: 'chiusa' }], ['finestra', { x: 470, y: 120, w: 30, h: 36, accesa: true }]],
    luce: { tono: 'notte' } },
  musica: 'piazza',
  entrata: [
    ['unaVolta', 'piazza-entrata', [
      ['capitolo', 'piazza-dante'],
      ['pensa', "Piazza Dante. Le bancarelle della festa sono rimaste aperte, con la merce in mostra e nessuno che compra."], // [nuovo]
      ['obiettivo', "C'è una lanterna che trema, dietro un banchetto. Qualcuno è sveglio?"], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'tonino', nome: 'Tonino', x: 190, y: 168, w: 44, h: 82, personaggio: 'tonino', posa: 0,
      guarda: [
        ['se', { flag: { tonino_ricordo: 'restituito' } },
          [['pensa', "Tonino ha gli occhi rossi e la voce di sempre. Ogni tanto guarda la sedia, e non è più uno sguardo vuoto."]], // [nuovo]
          [['pensa', "Un uomo grosso col grembiule, dietro un banco di mozzarelle. Sorride a tutti e a nessuno."]]], // [nuovo]
      ],
      usa: [['dialogo', 'tonino.banco']],
      con: {
        'ricordo-rosa': [['se', { flag: { tonino_ricordo: '' } }, DECISIONE_TONINO,
          [['pensa', "Tonino guarda la luce nella tua mano come si guarda una lucciola. Non la riconosce. Hai scelto tu, per lui."]]]], // [nuovo]
        'lettera-agnese': [['dice', 'tonino', "Chella è pe' te, guagliò. Io l'aggio sulo tenuta calda."]], // [nuovo]
        'spada-di-gaetano': [['dice', 'tonino', "Uagliò, posa 'sta cosa. Ccà se venneno mozzarelle, no guerre."]], // [nuovo]
        '*': [['dice', 'tonino', "E che m'aggia fa' cu chesto? Tienatello tu."]], // [nuovo]
      } },
    { id: 'sedia', nome: 'La sedia vuota', x: 244, y: 206, w: 34, h: 44,
      guarda: [
        ['se', { flag: { tonino_ricordo: 'restituito' } },
          [['pensa', "Sulla sedia, adesso, c'è il medaglione di Rosa. Tonino non ci fa sedere nessuno."]], // [nuovo]
          [['pensa', "Una sedia di paglia accanto al banco, la seduta consumata da qualcuno che ci stava ogni sera. È vuota. Tonino le sorride."]]], // [nuovo]
      ],
      usa: [['pensa', "Fai per sederti. Tonino, senza smettere di sorridere, allunga la mano e ti ferma."]] }, // [nuovo]
    { id: 'mozzarelle', nome: 'Il banco delle mozzarelle', x: 150, y: 222, w: 36, h: 30,
      guarda: [['pensa', "Mozzarelle in una conca d'acqua, foglie di mirto, un cartello: «Freschissime». È l'unico banco dove la lanterna brucia davvero."]] }, // [nuovo]
    { id: 'dormiente', nome: 'Una donna addormentata', x: 320, y: 172, w: 40, h: 78, personaggio: 'cittadino', posa: 0,
      guarda: [['pensa', "Una donna col cesto al braccio, ferma a metà di un passo. Nel cesto, il pane per domani. Sorride a domani, che non viene."]], // [nuovo]
      usa: [['pensa', "Le tocchi il braccio. È tiepido. Dorme."]] }, // [nuovo]
    { id: 'verso-nastri', nome: 'I banchetti della festa', x: 0, y: 140, w: 40, h: 140, uscita: 'piazza.nastri',
      guarda: [['pensa', "Di là, file di nastri colorati. Qualcuno ci si muove in mezzo."]] }, // [nuovo]
    { id: 'verso-finestra', nome: 'La finestra illuminata', x: 456, y: 110, w: 58, h: 60, uscita: 'piazza.finestra',
      guarda: [['pensa', "Una finestra accesa al primo piano. Una ragazza è affacciata, e non dorme."]] }, // [nuovo]
    { id: 'verso-bottega', nome: 'La porta sprangata', x: 376, y: 182, w: 48, h: 70, uscita: 'piazza.bottega',
      guarda: [['pensa', "In fondo alla piazza, una porta coperta di assi e di sigilli."]] }, // [nuovo]
    { id: 'verso-targa', nome: 'Verso la targa', x: 600, y: 130, w: 40, h: 150, uscita: 'piazza.targa',
      guarda: [['pensa', "Sul muro, oltre i banchi, una lapide bianca. E più in là il buio dei Quattro Canti."]] }, // [nuovo]
  ],
});

AV.dialogo({ id: 'tonino.banco', con: 'tonino',
  inizio: [
    ['dice', 'tonino', "Uagliò, ma che è 'sta faccia?"], // [bibbia]
    ['dice', 'didascalia', "Ferruccio indica la propria maschera."], // [bibbia]
    ['dice', 'tonino', "Ah, è proprio la tua. E che ne sapevo io?"], // [bibbia]
    ['dice', 'didascalia', "Gli offre una mozzarella."], // [bibbia]
    ['dice', 'tonino', "Mangia. Magari sotto 'sta maschera ce sta ancora qualcuno."], // [bibbia]
    ['prendi', 'mozzarella'],
    ['segna', 'tonino-incontrato'],
    ['diario', "Tonino, il venditore di mozzarelle, è sveglio. O quasi: sorride come gli altri, ma parla."], // [nuovo]
    ['obiettivo', "Esplorare la piazza: i banchetti, la finestra accesa, la porta sprangata, la lapide."], // [nuovo]
  ],
  saluto: [
    ['se', { flag: { volto: 'umano' } }, [['dice', 'tonino', "Uh, mo' sì ca se capisce chi si'. Assiettate. No, no 'ncopp' a chella."]], // [nuovo]
      [['se', { flag: { tonino_ricordo: 'restituito' } }, [['dice', 'tonino', "Stongo ccà, guagliò. Io, Rosa e 'o dolore: tutt'e tre."]], // [nuovo]
        [['se', { flag: { tonino_ricordo: 'negato' } }, [['dice', 'tonino', "Uagliò! Tutto a posto? Io sto 'na bellezza. Nun me manca niente."]], // [nuovo]
          [['dice', 'tonino', "Ancora ccà? Statte, statte. Tanto stanotte nun se fa juorno."]]]]]]], // [nuovo]
  ],
  temi: [
    { id: 'sedia', testo: 'Indica la sedia vuota', unaVolta: true, se: { flag: { tonino_ricordo: '' } }, fai: [
      ['dice', 'tonino', "Chella? È 'na sedia. Nun ce s'assetta nisciuno."], // [nuovo]
      ['dice', 'tonino', "Nun saccio pecché 'a tengo. Ma si m'a levano, me pare ca manca 'o banco sano."], // [nuovo]
      ['segna', 'sedia-chiesta'],
      ['diario', "Accanto al banco di Tonino c'è una sedia vuota. Lui non sa perché la tiene."], // [nuovo]
    ] },
    { id: 'bottega', testo: 'Indica la porta sprangata in fondo alla piazza', unaVolta: true, fai: [
      ['dice', 'tonino', "Chella era 'a puteca 'e Gaetano, 'o ferraro. 'Nu mastro: 'e mane d'oro e 'a capa tosta."], // [nuovo]
      ['dice', 'tonino', "Doppo 'o crollo d''o trentanove l'hanno chiusa cu 'e sigilli. Dicettero ca 'a colpa era 'a soja."], // [nuovo]
      ['dice', 'tonino', "Io nun ce credevo. E mo' nun m'arricordo manco pecché nun ce credevo. Strano, eh?"], // [nuovo]
      ['segna', 'bottega-raccontata'],
      ['diario', "La porta sprangata era la bottega di Gaetano, un fabbro. Dopo il crollo del 1839 gli hanno dato la colpa."], // [nuovo]
    ] },
    { id: 'canti', testo: 'Indica il buio oltre la lapide', se: { nonVisto: 'gatto-sciolto' }, fai: [
      ['dice', 'tonino', "'E Quattro Canti? Llà ce sta 'nu gatto gruosso quanto a 'nu ciuccio. Fatto 'e scuro."], // [nuovo]
      ['dice', 'tonino', "S'è pigliato tutte cose d''e case: cucchiare, culle, ritratte... Io nun ce vaco. E che m'aggia piglià? Nun me manca niente."], // [nuovo]
      ['unaVolta', 'gatto-sentito', [['diario', "Ai Quattro Canti c'è un gatto d'ombra che ruba le cose delle case."]]], // [nuovo]
    ] },
    { id: 'rosa', testo: 'Apri la mano: la luce del medaglione', se: { ha: 'ricordo-rosa', flag: { tonino_ricordo: '' } }, fai: DECISIONE_TONINO },
    { id: 'volto', testo: 'Mostragli il tuo volto', unaVolta: true, se: { flag: { volto: 'umano' } }, fai: [
      ['dice', 'tonino', "Maronna... e chi è 'stu bello guaglione?"], // [nuovo]
      ['dice', 'tonino', "Aspè. Tiene 'a stessa fronte 'e Gaetano, 'o ferraro. Uguale, uguale."], // [nuovo]
      ['diario', "Tonino mi ha guardato in faccia e ha visto mio padre."], // [nuovo]
    ] },
  ] });

AV.quadro({
  id: 'piazza.nastri', capitolo: 'piazza-dante', nome: 'I banchetti della festa',
  fondale: { immagine: 'avventura/piazza-nastri',
    disegno: [['cielo', { tono: 'notte', luna: true }], ['case', { n: 5, finestre: 2 }], ['suolo', { tipo: 'selciato', y: 252 }],
      ['banco', { x: 300, y: 252, w: 140 }], ['banco', { x: 80, y: 252, w: 120 }], ['tenda', { x: 300, y: 150, w: 140, h: 40, colore: '#7a2d3a' }],
      ['fili', { n: 4 }], ['lampione', { x: 500, y: 252, h: 100, acceso: false }]],
    luce: { tono: 'notte' } },
  musica: 'piazza',
  punti: [
    { id: 'assunta', nome: 'Assunta', x: 340, y: 172, w: 42, h: 80, personaggio: 'assunta', posa: 0,
      guarda: [['pensa', "Una donna fra i nastri, con le dita che annodano e snodano sempre lo stesso fiocco. Canticchia, sorridendo."]], // [nuovo]
      usa: [['dialogo', 'assunta.nastri']],
      con: {
        'nastro-azzurro': [['dialogo', 'assunta.nastri']],
        '*': [['dice', 'assunta', "Bello, bello. Ma io vendo nastri, nun accatto niente."]], // [nuovo]
      } },
    { id: 'nastri', nome: 'I nastri appesi', x: 290, y: 120, w: 160, h: 46,
      guarda: [['pensa', "Nastri rossi, gialli, verdi, appesi a un filo. Ne manca uno: c'è un chiodo vuoto, fra il verde e il giallo."]] }, // [nuovo]
    { id: 'dolci', nome: 'Il banco dei dolci', x: 70, y: 212, w: 120, h: 40,
      guarda: [['pensa', "Torroni, susamielli, una ruota di zucchero. Una vespa è ferma in aria sopra il miele, le ali aperte."]] }, // [nuovo]
    { id: 'bambino', nome: 'Un bambino addormentato', x: 210, y: 210, w: 30, h: 42, sagoma: 'bambina',
      guarda: [['pensa', "Un bambino seduto per terra con un torrone in mano. Il primo morso non l'ha dato. Dorme con la bocca aperta e sorride."]], // [nuovo]
      usa: [['pensa', "Gli sistemi il berretto storto. Non se ne accorge."]] }, // [nuovo]
    { id: 'lampione', nome: 'Il lampione spento', x: 494, y: 150, w: 24, h: 102, sagoma: 'lampione',
      guarda: [['pensa', "Il lampione si è spento nell'istante in cui tutto si è fermato. Non c'è vento che lo riaccenda."]] }, // [nuovo]
    { id: 'torna', nome: 'Torna al centro della piazza', x: 600, y: 140, w: 40, h: 140, uscita: 'piazza.centro',
      guarda: [['pensa', "Il banco di Tonino, con la sua lanterna."]] }, // [nuovo]
  ],
});

AV.dialogo({ id: 'assunta.nastri', con: 'assunta',
  inizio: [
    ['dice', 'assunta', "Nastri p' 'a festa! Rosse p' 'e zite, gialle p' 'e criature..."], // [nuovo]
    ['dice', 'assunta', "Ma qua' festa era? Boh. È bella 'o stesso."], // [nuovo]
    ['dice', 'assunta', "M'è scappato 'o cchiù bello, chillo azzurro. S' 'o purtaje 'o viento, verso 'o funno d' 'a piazza."], // [nuovo]
    ['segna', 'assunta-incontrata'],
    ['diario', "Assunta vende nastri. Ha perso quello azzurro: il vento l'ha portato verso il fondo della piazza."], // [nuovo]
  ],
  saluto: [['dice', 'assunta', "Ancora tu? Nastri? No? E allora statte buono."]], // [nuovo]
  temi: [
    { id: 'nastro', testo: 'Porgile il nastro azzurro', unaVolta: true, se: { ha: 'nastro-azzurro' }, fai: [
      ['togli', 'nastro-azzurro'],
      ['dice', 'assunta', "Uh! 'O nastro mio! Addò stava?"], // [nuovo]
      ['pensa', "Indichi la porta sprangata, in fondo alla piazza."], // [nuovo]
      ['dice', 'assunta', "'Ncopp' 'a porta 'e Gaetano? Gaetano 'o ferraro..."], // [nuovo]
      ['dice', 'assunta', "Quann'ero piccerella me faceva 'e fibbie p' 'e scarpe, e nun se faceva pavà. Doppo 'o crollo nun s'ha potuto cchiù nummenà."], // [nuovo]
      ['dice', 'assunta', "Tie', pigliate 'a lanterna mia. Io 'e nastri 'e saccio fa' pure a scuro."], // [nuovo]
      ['prendi', 'lanterna-di-assunta'],
      ['segna', 'bottega-raccontata'],
      ['diario', "Assunta mi ha dato la sua lanterna. Si ricorda di Gaetano, il fabbro della bottega sprangata: era buono, poi nessuno ha più potuto nominarlo."], // [nuovo]
      ['obiettivo', "Con una lanterna si può guardare nel buio dei Quattro Canti."], // [nuovo]
    ] },
    { id: 'buio', testo: 'Indica il buio dei Quattro Canti', se: { nonHa: 'lanterna-di-assunta', nonVisto: 'gatto-sciolto' }, fai: [
      ['dice', 'assunta', "Llà? Llà nun se vede manco 'a mano toja. Ce vo' 'na lanterna, e ce vo' curaggio."], // [nuovo]
    ] },
    { id: 'gatto', testo: 'Mima un gatto che si stiracchia', se: { visto: 'gatto-sciolto' }, unaVolta: true, fai: [
      ['dice', 'assunta', "'O gatto? Stanotte aggio sentuto 'na cosa calla passà p' 'e case. Comme quanno torna uno ca s'aspettava."], // [nuovo]
    ] },
  ] });

AV.quadro({
  id: 'piazza.bottega', capitolo: 'piazza-dante', nome: 'La bottega sprangata',
  fondale: { immagine: 'avventura/piazza-bottega',
    disegno: [['cielo', { tono: 'notte', luna: true }], ['muro', { x: 120, y: 60, w: 400, h: 192, tono: 'tufo' }], ['suolo', { tipo: 'selciato', y: 252 }],
      ['porta', { x: 270, y: 132, w: 100, h: 120, stato: 'chiusa' }], ['finestra', { x: 430, y: 120, w: 40, h: 44, accesa: false }],
      ['forma', { punti: [[262, 150], [378, 196], [378, 206], [262, 160]], colore: '#3b2a1e', bordo: '#1a120c' }],
      ['forma', { punti: [[262, 200], [378, 154], [378, 164], [262, 210]], colore: '#3b2a1e', bordo: '#1a120c' }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [['unaVolta', 'bottega-vista', [['diario', "In fondo alla piazza c'è una bottega sprangata, con le assi in croce e i sigilli."]]]], // [nuovo]
  punti: [
    { id: 'porta', nome: 'La porta della bottega', x: 280, y: 140, w: 80, h: 112, uscita: 'fucina.bottega', se: { visto: 'corso-percorso' },
      guarda: [['se', { visto: 'corso-percorso' },
        [['pensa', "Dietro le assi, un battito lento di martello. Tin. Tin. Lo stesso del Corso. La porta, adesso, cede alla mano."]], // [nuovo]
        [['pensa', "Una porta di quercia, sprangata con due assi in croce. Accosti l'orecchio: dentro, il silenzio di una stanza chiusa da anni."]]]], // [nuovo]
      chiuso: [
        ['pensa', "Spingi. Le assi tengono, i sigilli pure. Da dentro non viene nessun suono."], // [nuovo]
        ['se', { visto: 'mariella-indizio' }, [['pensa', "Mariella ha sentito un ferro battere dietro una porta su Corso Trieste. Forse la strada per entrare qui passa da là."]]], // [nuovo]
      ] },
    { id: 'sigilli', nome: 'I sigilli', x: 300, y: 176, w: 40, h: 26,
      guarda: [
        ['pensa', "Ceralacca rossa con lo stemma del Re, e un cartiglio: «Bottega posta sotto sequestro per l'incidente del cantiere. 1839.»"], // [nuovo]
        ['pensa', "Hai voglia di strapparli. La mano si ferma da sola, come se qualcuno l'avesse insegnato a non toccare il lavoro degli altri."], // [nuovo]
      ],
      con: { 'spada-di-gaetano': [['pensa', "Infili la punta sotto la ceralacca. Poi la ritrai. Non così: non di nascosto, come un ladro."]] } }, // [nuovo]
    { id: 'nastro', nome: 'Un nastro azzurro', x: 340, y: 150, w: 30, h: 20, se: { nonVisto: 'nastro-preso' },
      guarda: [['pensa', "Un nastro di seta azzurra, impigliato nelle assi. Il vento della festa l'ha portato fin qui e poi si è fermato pure lui."]], // [nuovo]
      usa: [['prendi', 'nastro-azzurro'], ['segna', 'nastro-preso'], ['pensa', "Lo sfili dalle assi, piano, senza strapparlo."]] }, // [nuovo]
    { id: 'insegna', nome: "L'insegna", x: 270, y: 70, w: 100, h: 40,
      guarda: [['pensa', "Un'insegna di ferro battuto, un ferro di cavallo e un martello incrociati. Qualcuno ci ha passato sopra la vernice nera, ma le lettere si leggono ancora: «GAETANO — FABBRO»."]] }, // [nuovo]
    { id: 'grata', nome: 'La finestrella con la grata', x: 424, y: 116, w: 52, h: 52, sagoma: 'finestra',
      guarda: [['pensa', "Una grata di ferro a riccioli, lavorata come un merletto. Al centro, un giglio. Non ne fanno più così."]], // [nuovo]
      usa: [['pensa', "Il ferro è freddo. Ma le volute ti tornano sotto le dita come una canzone sentita da piccolo."]] }, // [nuovo]
    { id: 'torna', nome: 'Torna al centro della piazza', x: 0, y: 140, w: 40, h: 140, uscita: 'piazza.centro',
      guarda: [['pensa', "La piazza, Tonino, la sua lanterna."]] }, // [nuovo]
  ],
});

AV.quadro({
  id: 'piazza.finestra', capitolo: 'piazza-dante', nome: 'La finestra di Mariella',
  fondale: { immagine: 'avventura/piazza-finestra',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['palazzo', { x: 140, w: 360, h: 230, archi: 3, finestre: 2 }],
      ['suolo', { tipo: 'selciato', y: 256 }], ['finestra', { x: 290, y: 90, w: 60, h: 70, accesa: true }],
      ['luce', { x: 320, y: 125, r: 80, colore: '#f6d48b' }], ['scala', { x: 260, y: 230, w: 120, h: 26 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  punti: [
    { id: 'mariella', nome: 'Mariella', x: 296, y: 92, w: 48, h: 66, personaggio: 'mariella', posa: 0,
      guarda: [['pensa', "Una ragazza alla finestra, il mento sulle mani. Ha un sorriso quieto, da cartolina. Gli occhi guardano lontano, ma non cercano niente."]], // [nuovo]
      usa: [['dialogo', 'mariella.finestra']],
      con: { '*': [['dice', 'mariella', "Che bello. Non mi serve niente, però. Non mi serve più niente."]] } }, // [nuovo]
    { id: 'filastrocca', nome: 'Una filastrocca', x: 290, y: 166, w: 60, h: 24, sagoma: 'foglio',
      guarda: [
        ['pensa', "Sotto il davanzale, scritta col gesso da una mano di bambina e ripassata tante volte:"], // [nuovo]
        ['dice', 'didascalia', "«Quando il giglio si addormenta, la luna ascolta e non si lamenta.»"], // [bibbia]
        ['unaVolta', 'filastrocca-letta', [['diario', "Sotto la finestra, una filastrocca: «Quando il giglio si addormenta, la luna ascolta e non si lamenta.» Non so che cosa voglia dire."]]], // [nuovo]
      ],
      usa: [['pensa', "Passi il dito sul gesso. Non si cancella: qualcuno l'ha ripassata per anni."]] }, // [nuovo]
    { id: 'gerani', nome: 'I gerani', x: 352, y: 150, w: 40, h: 22,
      guarda: [['pensa', "Un vaso di gerani sul davanzale. Le foglie sono secche: chi li innaffiava ha smesso di ricordarsene."]] }, // [nuovo]
    { id: 'guardia', nome: 'Una guardia addormentata', x: 430, y: 180, w: 40, h: 76, sagoma: 'guardia',
      guarda: [['pensa', "Una guardia seduta sul gradino, l'elmo sulle ginocchia. Dorme con la faccia di un bambino a cui hanno promesso qualcosa."]], // [nuovo]
      usa: [['pensa', "Non si sveglia. Ha la mano sull'elsa, ma la stringe come si stringe una mano."]] }, // [nuovo]
    { id: 'gradini', nome: 'I gradini', x: 260, y: 230, w: 120, h: 26,
      guarda: [['pensa', "Tre gradini di pietra consumati. Ci sono segni di gesso anche qui: una campana, il gioco dei bambini. Le caselle si fermano al numero sette."]] }, // [nuovo]
    { id: 'torna', nome: 'Torna al centro della piazza', x: 0, y: 140, w: 40, h: 140, uscita: 'piazza.centro',
      guarda: [['pensa', "La piazza, Tonino, la sua lanterna."]] }, // [nuovo]
  ],
});

AV.dialogo({ id: 'mariella.finestra', con: 'mariella',
  inizio: [
    ['dice', 'mariella', "Bella sera, eh? La luna sta ferma. Anch'io sto ferma. Si sta così bene."], // [nuovo]
    ['dice', 'mariella', "Prima avevo paura dei rumori. Adesso non ho più paura di niente. Non ho più voglia di niente, a dire il vero. È uguale."], // [nuovo]
    ['segna', 'mariella-incontrata'],
    ['diario', "Alla finestra c'è Mariella. Non dorme, ma è come se dormisse."], // [nuovo]
  ],
  saluto: [['dice', 'mariella', "Ancora tu. Il ragazzo nero. Non fa niente: qui va tutto bene."]], // [nuovo]
  temi: [
    { id: 'ferro', testo: 'Indica la bottega sprangata e batti il pugno sul palmo, come un martello', unaVolta: true, fai: [
      ['dice', 'mariella', "Il ferro? Sì, l'ho sentito. Stanotte, quando tutto taceva."], // [nuovo]
      ['dice', 'mariella', "Giù per il Corso Trieste, dietro una porta. Un ferro che batte da solo. Tin. Tin. Come un cuore che non vuole addormentarsi."], // [nuovo]
      ['dice', 'mariella', "Mi faceva paura, una volta, un rumore così. Adesso no. Adesso è solo un suono."], // [nuovo]
      ['pensa', "Ti porti la mano alla maschera. Poi indichi la direzione del Corso."], // [nuovo, da storia.json]
      ['segna', 'mariella-indizio'],
      ['diario', "Mariella ha sentito un ferro battere da solo dietro una porta, su Corso Trieste. Lo stesso suono della bottega di Gaetano?"], // [nuovo]
      ['obiettivo', "Prima di lasciare la piazza: la lapide, e il buio dei Quattro Canti."], // [nuovo]
    ] },
    { id: 'filastrocca', testo: 'Indica la filastrocca sotto il davanzale', unaVolta: true, fai: [
      ['dice', 'mariella', "Una bambina la cantava sempre, qui sotto. Saltava sulle caselle e la cantava."], // [nuovo]
      ['dice', 'mariella', "Com'era? I capelli... no. Non me lo ricordo. Non fa niente."], // [nuovo]
    ] },
    { id: 'reggia', testo: 'Indica lontano, verso la Reggia', unaVolta: true, fai: [
      ['dice', 'mariella', "Mio fratello fa la guardia, laggiù. Prima piangevo, la notte, e lui restava sveglio con me."], // [nuovo]
      ['dice', 'mariella', "Adesso non piango più. Adesso dormiamo tutti. Lui dice che è meglio."], // [nuovo]
    ] },
  ] });

AV.quadro({
  id: 'piazza.targa', capitolo: 'piazza-dante', nome: 'La targa del 1839',
  fondale: { immagine: 'avventura/piazza-targa',
    disegno: [['cielo', { tono: 'notte', luna: true }], ['case', { n: 4, alto: true, finestre: 2 }], ['suolo', { tipo: 'marmo', y: 254 }],
      ['muro', { x: 200, y: 90, w: 240, h: 164, tono: 'pietra' }],
      ['forma', { punti: [[240, 110], [400, 110], [400, 200], [240, 200]], colore: '#d9d4c7', bordo: '#8a8476' }],
      ['lampione', { x: 470, y: 254, h: 110, acceso: true }], ['luce', { x: 470, y: 150, r: 70, colore: '#f6c56b' }], ['arco', { x: 560, y: 120, w: 80, h: 134 }]],
    luce: { tono: 'notte' } },
  musica: 'targa',
  punti: [
    { id: 'targa', nome: 'La targa', x: 240, y: 110, w: 160, h: 90,
      guarda: [
        ['dice', 'didascalia', "«In memoria degli uomini caduti nell'adempimento del loro dovere.»"], // [bibbia]
        ['pensa', "Sotto, i nomi degli operai morti nel crollo del cantiere, 1839. Li leggi uno a uno, col dito."], // [nuovo]
        ['pensa', "Cerchi un nome. Non sai quale; lo sapresti se lo vedessi. Non c'è."], // [nuovo]
        ['se', { visto: 'targa-colpita' }, [['pensa', "Sul marmo resta il segno della lama. È l'unica cosa vera che ci sia scritta."]], // [nuovo]
          [['unaVolta', 'targa-letta', [['diario', "La lapide del crollo del 1839 elenca gli operai morti. Manca un nome, e io so che manca."]]]]], // [nuovo]
      ],
      usa: [['pensa', "Appoggi il palmo sulla pietra fredda. La rabbia sale, e non ha voce per uscire."]], // [nuovo]
      con: {
        'spada-di-gaetano': [['unaVolta', 'targa-colpo', [
          ['effetto', 'scossa'], ['suono', 'colpo'],
          ['dice', 'didascalia', "Ferruccio colpisce la targa con la spada."], // [bibbia]
          ['dice', 'didascalia', "Nessuna parola. Soltanto un gesto di rabbia."], // [bibbia]
          ['segna', 'targa-colpita'],
          ['diario', "Ho colpito la lapide. Non mi ha risposto nessuno. Il nome che manca, lo troverò io."], // [nuovo]
        ], [['pensa', "Alzi di nuovo la lama. Poi la abbassi. Il segno c'è già."]]]], // [nuovo]
        '*': [['pensa', "Non è questo che la pietra si merita."]], // [nuovo]
      } },
    { id: 'fiori', nome: 'I fiori secchi', x: 270, y: 222, w: 100, h: 30,
      guarda: [['pensa', "Mazzi di fiori secchi ai piedi della lapide. Uno solo è ancora legato con un nastro. Gli altri, nessuno è più venuto a cambiarli."]] }, // [nuovo]
    { id: 'notabile', nome: 'Un signore addormentato', x: 150, y: 176, w: 40, h: 78, personaggio: 'cittadino', posa: 0,
      guarda: [['pensa', "Un signore col cilindro, fermo davanti alla lapide col cappello in mano, come per un discorso. Sorride al marmo."]], // [nuovo]
      usa: [['pensa', "Gli tocchi la spalla. Nel sonno, mormora: «Una disgrazia. Nessuna colpa. Nessuna colpa.»"]] }, // [nuovo]
    { id: 'lampione', nome: 'Il lampione', x: 460, y: 140, w: 22, h: 114, sagoma: 'lampione',
      guarda: [['pensa', "Il lampione illumina la lapide e basta. Come se qualcuno avesse deciso che cosa si deve vedere."]] }, // [nuovo]
    { id: 'verso-canti', nome: 'I Quattro Canti', x: 566, y: 124, w: 70, h: 130, uscita: 'piazza.quattro-canti',
      guarda: [['pensa', "Sotto l'arco, l'incrocio dei Quattro Canti. Buio pesto. Da là dentro, ogni tanto, due occhi verdi."]] }, // [nuovo]
    { id: 'torna', nome: 'Torna al centro della piazza', x: 0, y: 140, w: 40, h: 140, uscita: 'piazza.centro',
      guarda: [['pensa', "La piazza, Tonino, la sua lanterna."]] }, // [nuovo]
  ],
});

AV.quadro({
  id: 'piazza.quattro-canti', capitolo: 'piazza-dante', nome: 'I Quattro Canti',
  fondale: { immagine: 'avventura/piazza-quattro-canti',
    disegno: [['cielo', { tono: 'notte', luna: true }], ['case', { n: 4, alto: true, finestre: 1 }], ['suolo', { tipo: 'selciato', y: 256 }],
      ['arco', { x: 40, y: 110, w: 90, h: 146 }], ['arco', { x: 510, y: 110, w: 90, h: 146 }], ['nebbia', { alfa: 0.35 }]],
    luce: { tono: 'notte' } },
  musica: 'ombra',
  entrata: [['unaVolta', 'canti-entrata', [
    ['pensa', "All'incrocio la luce della luna non arriva. Qualcosa di grande respira nel buio, e fa le fusa come un temporale lontano."], // [nuovo]
    ['obiettivo', "Il buio dei Quattro Canti: serve una luce."], // [nuovo]
  ]]],
  punti: [
    { id: 'buio', nome: 'Il buio', x: 200, y: 110, w: 240, h: 146, se: { nonVisto: 'canti-illuminati' },
      guarda: [['pensa', "Buio fitto, che si muove. Due occhi verdi si aprono e si chiudono, alti come una finestra."]], // [nuovo]
      usa: [['pensa', "Allunghi la mano. Il buio è caldo, e soffia. Ritrai la mano."]], // [nuovo]
      con: {
        'lanterna-di-assunta': [
          ['effetto', 'luce'],
          ['pensa', "Alzi la lanterna. Il buio arretra, e si raccoglie in una forma: un gatto d'ombra grande come un carretto, acciambellato su un mucchio di cose."], // [nuovo]
          ['segna', 'canti-illuminati'],
          ['diario', "Con la lanterna ho visto il Gatto dei Quattro Canti: dorme su un mucchio di cose rubate alle case."], // [nuovo]
          ['obiettivo', "Il Gatto custodisce il mucchio. Come farlo scendere?"], // [nuovo]
        ],
        '*': [['pensa', "Il buio se lo prende, lo annusa, te lo rende. Serve una luce."]], // [nuovo]
      } },
    { id: 'gatto', nome: 'Il Gatto dei Quattro Canti', x: 230, y: 120, w: 150, h: 120, personaggio: 'gatto-canti',
      se: { visto: 'canti-illuminati', nonVisto: 'gatto-sciolto' },
      guarda: [
        ['se', { visto: 'gatto-sazio' },
          [['pensa', "Il Gatto si lecca i baffi e ti guarda senza soffiare. Da vicino, il suo pelo non è pelo: sono ombre di stanze, di tavole apparecchiate, di letti rifatti."]], // [nuovo]
          [['pensa', "Un gatto fatto di buio, acciambellato sul suo tesoro. Ti fissa e soffia. Ha la pancia vuota: lo senti brontolare come una pentola."]]], // [nuovo]
      ],
      usa: [['se', { visto: 'gatto-sazio' }, [
        ['pensa', "Allunghi la mano e lo accarezzi, piano, fra le orecchie. Il Gatto chiude gli occhi."], // [nuovo]
        ['pensa', "Sotto la tua mano l'ombra si allenta, si sfila come lana. Non è un mostro: è fatto delle cose di casa di tutta la piazza."], // [nuovo]
        ['effetto', 'anime'], ['suono', 'anime'],
        ['dice', 'didascalia', "Il Gatto dei Quattro Canti si dissolve in anime colorate che salgono lentamente."], // [nuovo, da §XII]
        ['pensa', "Le anime salgono e tornano verso le finestre, una per casa. Una, color di rosa, resta indietro e ti gira intorno alla mano."], // [nuovo]
        ['segna', 'gatto-sciolto'],
        ['diario', "Il Gatto non era un mostro. Le creature d'ombra custodiscono qualcosa di umano: ricordi tolti alle case."], // [nuovo, da §XII]
        ['obiettivo', "Raccogliere l'anima rimasta indietro."], // [nuovo]
      ], [
        ['pensa', "Allunghi la mano: il Gatto si gonfia, soffia, e il buio ti respinge indietro di un passo."], // [nuovo]
      ]]],
      con: {
        'mozzarella': [
          ['togli', 'mozzarella'],
          ['pensa', "Gli tendi la mozzarella di Tonino. Il Gatto annusa. Poi scende dal mucchio, piano, e la mangia in un boccone."], // [nuovo]
          ['pensa', "Fa le fusa. Il temporale lontano è diventato una stufa accesa."], // [nuovo]
          ['segna', 'gatto-sazio'],
          ['diario', "Il Gatto ha mangiato la mozzarella di Tonino ed è sceso dal mucchio. Non soffia più."], // [nuovo]
          ['obiettivo', "Il Gatto è tranquillo. Avvicinati."], // [nuovo]
        ],
        'spada-di-gaetano': [
          ['effetto', 'lampo'],
          ['pensa', "Colpisci. La lama passa, e il Gatto si spezza in cento ombre: un cucchiaio di legno, una culla, un ritratto, una ninnananna. Poi si ricompone, come se niente fosse."], // [nuovo]
          ['unaVolta', 'gatto-spada', [['diario', "La spada non ferma il Gatto: si spezza e si ricompone. È fatto di cose di casa. Che cosa vuole?"]]], // [nuovo]
        ],
        '*': [['pensa', "Il Gatto guarda l'oggetto, guarda te, e sbadiglia."]], // [nuovo]
      } },
    { id: 'mucchio', nome: 'Il mucchio di cose', x: 390, y: 200, w: 90, h: 56, se: { visto: 'canti-illuminati', nonVisto: 'gatto-sciolto' },
      guarda: [['pensa', "Cucchiai, cuffiette, ventagli, un fischietto, un ritratto senza faccia, un medaglione. Ombre di cose che stavano sopra le credenze. Ogni casa della piazza ha perso qualcosa."]], // [nuovo]
      usa: [['se', { visto: 'gatto-sazio' },
        [['pensa', "Tocchi il medaglione. È freddo, come se aspettasse qualcuno. Il Gatto ti guarda: è ancora suo."]], // [nuovo]
        [['pensa', "Il Gatto ti mostra i denti. Il mucchio è suo, e lo custodisce."]]]] }, // [nuovo]
    { id: 'anima', nome: "L'anima color di rosa", x: 300, y: 150, w: 40, h: 50, sagoma: 'anima',
      se: { visto: 'gatto-sciolto', nonVisto: 'rosa-presa' },
      guarda: [['pensa', "Un'anima piccola e calda, posata su un vecchio medaglione. Odora di latte e di basilico."]], // [nuovo]
      usa: [
        ['prendi', 'ricordo-rosa'], ['segna', 'rosa-presa'],
        ['pensa', "La raccogli. Nel palmo, per un istante, vedi una sedia di paglia e una donna che ride."], // [nuovo]
        ['diario', "Ho raccolto un ricordo: Rosa, la moglie di Tonino. Lui non sa più di averla avuta."], // [nuovo]
        ['obiettivo', "Riportare il ricordo di Rosa al banco di Tonino. Decidere se renderglielo."], // [nuovo]
      ] },
    { id: 'edicola', nome: "L'edicola votiva", x: 140, y: 96, w: 40, h: 50,
      guarda: [['pensa', "Una Madonnina in una nicchia, col lumino spento. Davanti, qualcuno ha lasciato un fiocco di nastro rosso, di quelli di Assunta."]] }, // [nuovo]
    { id: 'verso-corso', nome: 'Verso Corso Trieste', x: 520, y: 120, w: 76, h: 136,
      guarda: [['pensa', "Sotto l'altro arco comincia il Corso Trieste. Laggiù, lontano, un suono di ferro."]], // [nuovo]
      usa: [['se', PIAZZA_PRONTA, [
        ['pensa', "Ti volti un'ultima volta verso la piazza ferma. Poi passi sotto l'arco."], // [nuovo]
        ['segna', 'piazza-finita'],
        ['diario', "Lascio Piazza Dante. Cerco il ferro che risuona dietro una porta, su Corso Trieste."], // [nuovo]
        ['obiettivo', "Percorrere Corso Trieste e trovare il ferro che risuona."], // [nuovo]
        ['vai', 'corso.inizio'],
      ], [
        ['pensa', "Fai un passo sotto l'arco, poi ti fermi. La piazza non ha ancora finito con te."], // [nuovo]
        ['se', { flag: { tonino_ricordo: '' } }, [['pensa', "Tonino. C'è qualcosa che gli devi, o che gli devi negare."]]], // [nuovo]
        ['se', { nonVisto: 'targa-colpita' }, [['pensa', "La lapide. Quel nome che manca ti brucia ancora in mano."]]], // [nuovo]
        ['se', { nonVisto: 'mariella-indizio' }, [['pensa', "La ragazza alla finestra sa qualcosa del suono di ferro. Chiediglielo."]]], // [nuovo]
      ]]] },
    { id: 'torna', nome: 'Torna alla targa', x: 44, y: 120, w: 76, h: 136, uscita: 'piazza.targa',
      guarda: [['pensa', "La lapide bianca, il lampione."]] }, // [nuovo]
  ],
});

// ============================== FUCINA DEL RICORDO ==============================
AV.quadro({
  id: 'fucina.bottega', capitolo: 'fucina-del-ricordo', nome: 'La bottega di Gaetano',
  fondale: { immagine: 'avventura/fucina-bottega',
    disegno: [['cielo', { tono: 'interno' }], ['muro', { x: 0, y: 16, w: 640, h: 244, tono: 'tufo' }], ['suolo', { tipo: 'assi', y: 256 }],
      ['banco', { x: 80, y: 256, w: 150 }], ['forma', { punti: [[400, 256], [400, 160], [520, 140], [540, 256]], colore: '#2a1d16', bordo: '#5a3a28' }],
      ['porta', { x: 560, y: 150, w: 60, h: 106, stato: 'chiusa' }], ['luce', { x: 460, y: 220, r: 50, colore: '#c2410c' }], ['nebbia', { alfa: 0.25 }]],
    luce: { tono: 'interno' } },
  musica: 'fucina',
  entrata: [['unaVolta', 'fucina-entrata', [
    ['capitolo', 'fucina-del-ricordo'],
    ['pensa', "Le assi cedono. Dentro, odore di carbone vecchio e di ferro. La polvere ha coperto tutto, ma non il suono: tin, tin, da dietro la porta in fondo."], // [nuovo]
    ['diario', "Sono entrato nella bottega di Gaetano. Il ferro batte dietro la porta in fondo."], // [nuovo]
    ['obiettivo', "Raggiungere il suono del ferro, oltre la porta in fondo."], // [nuovo]
  ]]],
  punti: [
    { id: 'tenaglie', nome: 'Le tenaglie', x: 90, y: 70, w: 50, h: 40, sagoma: 'ferro', se: { nonHa: 'tenaglie-di-gaetano' },
      guarda: [['pensa', "Sul muro, al loro chiodo, le tenaglie. Il manico consumato a forma di mano."]], // [nuovo]
      usa: [['prendi', 'tenaglie-di-gaetano'], ['pensa', "Le stacchi dal chiodo. La mano sa già come tenerle."]] }, // [nuovo]
    { id: 'punzone', nome: "L'impronta del punzone", x: 150, y: 70, w: 40, h: 40,
      guarda: [['pensa', "Fra le tenaglie e l'ago, nella polvere del muro, la sagoma pulita di un ferro che non c'è più: un punzone. Qualcuno l'ha portato via."]], // [nuovo]
      usa: [['pensa', "Passi il dito sull'impronta. La mano chiude il pugno su un manico che non c'è."]] }, // [nuovo]
    { id: 'ago', nome: "L'ago da tracciare", x: 200, y: 70, w: 40, h: 40, sagoma: 'ferro',
      guarda: [['pensa', "Un ago d'acciaio lungo una spanna, per segnare il ferro prima di tagliarlo. Misura due volte, taglia una: lo dice la mano, non la memoria."]], // [nuovo]
      usa: [['pensa', "Lo lasci al suo chiodo. È di chi lo usava."]] }, // [nuovo]
    { id: 'banco', nome: 'Il banco da lavoro', x: 80, y: 210, w: 150, h: 46,
      guarda: [['pensa', "Il banco di Gaetano: una morsa, una lima, trucioli di ferro. E un disegno a carboncino: le travi di un ponteggio, con una nota: «Legname marcio. Avvisare.»"]] }, // [nuovo]
    { id: 'mantice', nome: 'Il mantice', x: 330, y: 200, w: 60, h: 56,
      guarda: [['se', { visto: 'mantice-soffiato' },
        [['pensa', "La forgia arde di una luce che non è fuoco: bianca, quieta. Dalla porta in fondo il suono è più forte."]], // [nuovo]
        [['pensa', "Un mantice di cuoio, afflosciato accanto alla forgia spenta. Nella cenere, un tizzone che non vuole morire."]]]], // [nuovo]
      usa: [['unaVolta', 'mantice-soffiato', [
        ['effetto', 'luce'],
        ['pensa', "Pompi il mantice. Il tizzone si sveglia, la forgia si accende di una luce bianca. Il chiavistello della porta in fondo diventa rosso, come un ferro pronto."], // [nuovo]
        ['diario', "Il mantice ha risvegliato la forgia. Il chiavistello della porta in fondo è rovente."], // [nuovo]
        ['obiettivo', "Il chiavistello scotta: serve qualcosa per alzarlo."], // [nuovo]
      ], [['pensa', "Il mantice respira con te. La forgia risponde."]]]] }, // [nuovo]
    { id: 'porta-retro', nome: 'La porta in fondo', x: 560, y: 150, w: 60, h: 106,
      guarda: [['se', { visto: 'mantice-soffiato' },
        [['pensa', "Il chiavistello di ferro è rosso fuoco. Dietro, il martello batte: tin, tin."]], // [nuovo]
        [['pensa', "Una porta bassa, col chiavistello di ferro freddo e incrostato. Dietro, il martello batte."]]]], // [nuovo]
      usa: [['se', { visto: 'mantice-soffiato' },
        [['pensa', "Avvicini la mano al chiavistello e la ritrai. Scotta come la forgia."]], // [nuovo]
        [['pensa', "Il chiavistello non si muove: è grippato dalla ruggine, saldato dal freddo."]]]], // [nuovo]
      con: {
        'tenaglie-di-gaetano': [['se', { visto: 'mantice-soffiato' }, [
          ['pensa', "Stringi il chiavistello rovente con le tenaglie e lo sollevi. La porta si apre su una luce d'oro."], // [nuovo]
          ['segna', 'fucina-aperta'],
          ['vai', 'fucina.cuore'],
        ], [['pensa', "Le tenaglie scivolano sul ferro freddo e incrostato. Bisognerebbe scaldarlo."]]]], // [nuovo]
        '*': [['pensa', "Non è così che si apre una porta di fabbro."]], // [nuovo]
      } },
    { id: 'piazza', nome: 'Torna in Piazza Dante', x: 0, y: 140, w: 40, h: 116, uscita: 'piazza.bottega',
      guarda: [['pensa', "La porta da cui sei entrato, e oltre la piazza ferma."]] }, // [nuovo]
  ],
});

AV.quadro({
  id: 'fucina.cuore', capitolo: 'fucina-del-ricordo', nome: 'La Fucina del Ricordo',
  fondale: { immagine: 'avventura/fucina-cuore',
    disegno: [['cielo', { tono: 'interno' }], ['quinte', { colore: '#1a0f0a' }], ['suolo', { tipo: 'tufo', y: 256 }],
      ['luce', { x: 320, y: 210, r: 140, colore: '#f59e0b' }], ['fili', { n: 6 }],
      ['forma', { punti: [[280, 256], [290, 226], [350, 226], [360, 256]], colore: '#111', bordo: '#7c4a1e' }]],
    luce: { tono: 'interno' } },
  musica: 'fucina',
  entrata: [['unaVolta', 'cuore-entrata', [
    ['pensa', "Una stanza che la bottega non può contenere. Le scintille non cadono: salgono, e in ognuna c'è una cosa fatta a mano, un cancello, un chiodo, una grata a gigli."], // [nuovo]
    ['pensa', "All'incudine, un uomo anziano batte un ferro rovente. Non alza la testa."], // [nuovo]
    ['obiettivo', "Avvicinarsi all'uomo che batte il ferro."], // [nuovo]
  ]]],
  punti: [
    { id: 'gaetano', nome: "L'uomo all'incudine", x: 250, y: 160, w: 50, h: 96, personaggio: 'gaetano', posa: 0, se: { nonVisto: 'volto-ritrovato' },
      guarda: [['pensa', "Spalle larghe, le maniche arrotolate, un grembiule di cuoio bruciacchiato. Ha le tue mani. Non lo sai ancora, ma le guardi come si guarda uno specchio."]], // [nuovo]
      usa: [['dialogo', 'gaetano.fucina']],
      con: { 'tenaglie-di-gaetano': [['dialogo', 'gaetano.fucina']], '*': [['dice', 'gaetano', "Dopo, guagliò. Mo' batto."]] } }, // [nuovo]
    { id: 'incudine', nome: "L'incudine", x: 286, y: 222, w: 70, h: 34,
      guarda: [['se', { visto: 'volto-ritrovato' },
        [['pensa', "L'incudine è rimasta calda. Il martello batte ancora, da solo, piano: tin, tin. Come un cuore che non vuole addormentarsi."]], // [nuovo]
        [['pensa', "Un'incudine nera, lucida al centro come una moneta consumata."]]]], // [nuovo]
      usa: [['pensa', "Appoggi la mano sul ferro. È caldo, ma non brucia. Ti riconosce."]] }, // [nuovo]
    { id: 'scintille', nome: 'Le scintille', x: 200, y: 30, w: 240, h: 90,
      guarda: [['pensa', "In una scintilla, un cancello per una villa. In un'altra, le fibbie di una bambina. In un'altra ancora, una trave tenuta su a mani nude. Salgono e non si spengono."]] }, // [nuovo]
    { id: 'martello', nome: 'Il martello', x: 360, y: 200, w: 40, h: 40, sagoma: 'ferro', se: { visto: 'volto-ritrovato' },
      guarda: [['pensa', "Il martello di Gaetano batte da solo sull'incudine. Lui non c'è più. Il suono resta."]], // [nuovo]
      usa: [['pensa', "Lo lasci battere. Non è tuo da fermare."]] }, // [nuovo]
    { id: 'esci', nome: 'Torna nella bottega', x: 0, y: 140, w: 40, h: 116, uscita: 'fucina.bottega',
      guarda: [['pensa', "La porta bassa, e la bottega polverosa."]] }, // [nuovo]
  ],
});

AV.dialogo({ id: 'gaetano.fucina', con: 'gaetano',
  inizio: [
    ['dice', 'gaetano', "Chiudi 'a porta, ca 'o ferro se fredda."], // [nuovo]
    ['pensa', "Il martello sale e scende. L'uomo non ti guarda. Batte."], // [nuovo]
    ['segna', 'gaetano-incontrato'],
  ],
  saluto: [['dice', 'gaetano', "Ancora ccà? 'O ferro nun aspetta."]], // [nuovo]
  temi: [
    { id: 'volto', testo: 'Indica il tuo volto nero', unaVolta: true, fai: [
      ['pensa', "L'uomo alza gli occhi. Guarda la tua maschera a lungo, come si guarda un lavoro venuto storto."], // [nuovo]
      ['dice', 'gaetano', "Chesta nun è 'na faccia. È 'nu lavoro fatto a metà."], // [nuovo]
      ['dice', 'gaetano', "Miettete ccà. E tienemi fermo 'o ferro, ca io sulo nun ce 'a faccio cchiù."], // [nuovo]
      ['se', { ha: 'tenaglie-di-gaetano' }, [
        ['pensa', "Stringi le tenaglie sul ferro rovente. L'uomo alza il martello."], // [nuovo]
        ['effetto', 'lampo'], ['suono', 'incudine'],
        ['pensa', "Un colpo. Il nero ti si incrina sulla fronte."], // [nuovo]
        ['effetto', 'lampo'], ['suono', 'incudine'],
        ['pensa', "Due. Ti cade dalle guance come scaglia di forgia."], // [nuovo]
        ['effetto', 'scossa'], ['suono', 'incudine'],
        ['pensa', "Tre. Senti l'aria sulla pelle. La tua pelle."], // [nuovo]
        ['flag', 'volto', 'umano'],
        ['dice', 'gaetano', "Eccolo ccà."], // [nuovo]
        ['dice', 'gaetano', "Ferruccio."], // [nuovo]
        ['pensa', "Il tuo nome. Lo senti e lo riconosci, come si riconosce una porta di casa al buio."], // [nuovo]
        ['dice', 'gaetano', "Tieni 'a faccia mia quann'avevo vint'anne. Povero a te."], // [nuovo]
        ['dice', 'gaetano', "'E tenaglie tienatelle. Erano 'e mie; mo' so' 'e toje."], // [nuovo]
        ['segna', 'volto-ritrovato'],
        ['diario', "Mi chiamo Ferruccio. Nella Fucina del Ricordo un fabbro mi ha reso il volto e il nome. Aveva le mie mani."], // [nuovo]
        ['obiettivo', "Riprendere la strada oltre Corso Trieste."], // [nuovo]
        ['effetto', 'luce'],
        ['pensa', "Quando alzi gli occhi, all'incudine non c'è più nessuno. Il martello batte da solo, piano."], // [nuovo]
      ], [['dice', 'gaetano', "Cu 'e mane? Te vuò abbruscià? 'E tenaglie stanno 'o muro, 'a bottega."]]], // [nuovo]
    ] },
    { id: 'targa', testo: 'Mima il colpo di spada alla lapide', se: { visto: 'targa-colpita' }, unaVolta: true, fai: [
      ['dice', 'gaetano', "Nun me spià 'e cose ca nun saccio. Io saccio sulo 'o ferro."], // [nuovo]
      ['dice', 'gaetano', "'O ferro nun dice buscìe. Si 'na trave è fràceta, 'o ferro t' 'o dice. Basta ca uno 'o sta a sentì."], // [nuovo]
    ] },
  ] });

/*
 * IMMAGINI DA FAR DISEGNARE (gioco/assets/avventura/<nome>.png, 1280×720, teatro d'ombre in vista 3/4, sagome scure,
 * luci calde di lanterna, luna ferma; la fascia bassa y ≥ 600 resta libera per l'interfaccia):
 *  - avventura/prologo-festa ......... Caserta in festa vista dall'alto della piazza: la Reggia appena finita sullo sfondo,
 *                                       file di lanterne di carta, un fuoco d'artificio aperto e fermo nel cielo, ballerini e banda
 *                                       immobili, un velo di seta pallida che scende dalla luna piena.
 *  - avventura/prologo-risveglio ..... Il selciato di Piazza Dante a terra, in primo piano una pozzanghera col riflesso della luna;
 *                                       una spada corta sulle pietre; un uomo in abito da festa che dorme in piedi contro un banco.
 *  - avventura/piazza-centro ......... Piazza Dante: case basse, il banco di Tonino con conca di mozzarelle e lanterna accesa,
 *                                       una sedia di paglia vuota accanto, una donna col cesto addormentata, la porta sprangata in fondo,
 *                                       una finestra accesa al primo piano.
 *  - avventura/piazza-nastri ......... I banchetti della festa: il banco di Assunta sotto una tenda rossa, nastri appesi a un filo
 *                                       (un chiodo vuoto), il banco dei dolci con una vespa ferma in aria, un bambino addormentato col torrone.
 *  - avventura/piazza-bottega ........ Facciata di tufo con la porta di quercia sbarrata da due assi in croce e sigilli rossi;
 *                                       insegna di ferro battuto annerita «GAETANO — FABBRO»; finestrella con grata a riccioli e un giglio;
 *                                       un nastro azzurro impigliato nelle assi.
 *  - avventura/piazza-finestra ....... Palazzetto con una finestra accesa: Mariella affacciata col mento sulle mani, gerani secchi,
 *                                       una filastrocca scritta col gesso sotto il davanzale, gradini con la campana di gesso,
 *                                       una guardia che dorme seduta sul gradino.
 *  - avventura/piazza-targa .......... Una lapide di marmo bianco su un muro, illuminata da un solo lampione; fiori secchi ai piedi;
 *                                       un notabile col cilindro fermo davanti; a destra un arco nero verso i Quattro Canti.
 *  - avventura/piazza-quattro-canti .. Incrocio stretto fra quattro case alte, due archi, un'edicola votiva spenta; al centro
 *                                       un buio denso dove si intravedono due occhi verdi e la sagoma di un gatto enorme su un mucchio
 *                                       di oggetti di casa (cucchiai, culla, ritratto, medaglione).
 *  - avventura/fucina-bottega ........ Interno di bottega di fabbro abbandonata: muro con tenaglie e ago appesi e l'impronta pulita
 *                                       di un punzone mancante, banco con morsa e un disegno di ponteggio, forgia spenta col mantice,
 *                                       porta bassa in fondo col chiavistello.
 *  - avventura/fucina-cuore .......... La Fucina del Ricordo: stanza senza pareti visibili, un'incudine al centro sotto una luce
 *                                       d'oro, scintille che salgono invece di cadere (in ognuna un piccolo oggetto di ferro),
 *                                       fili d'oro dall'alto; posto per la sagoma di Gaetano all'incudine.
 */
