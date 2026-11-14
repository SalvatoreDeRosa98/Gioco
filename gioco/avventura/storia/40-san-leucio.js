/*
 * storia/40-san-leucio.js — Capitolo 4: SAN LEUCIO, «La tessitrice». Il cuore sentimentale: Agnese.
 * Solo dati (contratto in ../LEGGIMI.md). Fonti: trama/ferruccio-bibbia.md §IV (165-318), §III (atti II-IV),
 * §XI (813-822, terzo indizio di Bianca), §XII (849-867, la Tessitrice di Pietra); trama/inizio-memoria-e-doni.md
 * (la sciarpa sul telaio); trama/storia.json, capitolo san-leucio (14 scene).
 * Battute: // [bibbia] = parola per parola dalla bibbia; // [nuovo] = scritta per l'avventura nello stesso tono.
 *
 * MAPPA DEL CAPITOLO
 *
 *   [villa.cancello] ←── leucio.arrivo (il borgo della seta, Nunzia) ──→ leucio.belvedere (cortile, lettera)
 *                                                                          │            └─→ [reggia.cancello] (dopo la scelta)
 *                                                                          ▼
 *                         leucio.forgetta ←── leucio.manifattura (telai che vanno da soli) ──→ leucio.telaio (Agnese)
 *                         (martello, incudine)         │ (si apre quando il telaio di Agnese batte)
 *                                                      ▼
 *                                              leucio.magazzino (stoffe col giglio, sciarpa consumata)
 *                                                      │ (seguire il filo d'oro: la pila col giglio)
 *                                                      ▼
 *                                              leucio.filatoio (la Tessitrice di Pietra)
 *
 * PERCORSO
 *  1. Borgo → Belvedere → Manifattura → sala del telaio: incontro con Agnese (scena indispensabile). Il telaio si
 *     blocca: una ruotina dentata è spaccata. «Siete venuto ad aggiustarlo o a finirlo?»
 *  2. ENIGMA 1 — Riparare il telaio: ruota storta (cassa dei pezzi, manifattura) + martello (forgetta) sull'incudine
 *     → ruota dentata; sul telaio di Agnese. Agnese gli dà la ruotina rotta che tiene da sempre (ricordo 1).
 *     Facoltativo: l'ago di Gaetano (ferro-ago), infilato fra i licci. Il fazzoletto col giglio (Bianca, indizio 3).
 *  3. ENIGMA 2 — Seguire i fili d'oro: col telaio che batte, i fili si tendono e liberano la porta del magazzino;
 *     là il filo d'oro entra nella pila col giglio (indizio: il giglio delle stoffe). Fra gli scarti, la sciarpa
 *     consumata (ricordo 2). Spostata la pila, il passaggio al filatoio.
 *  4. CONFRONTO — la Tessitrice di Pietra (§XII): la ruota non si ferma finché le mani della statua filano; il
 *     fazzoletto col giglio incompiuto la distrae (vuole finire il disegno); allora Ferruccio, figlio di fabbro,
 *     sfila il perno. Anime che salgono; resta il ricordo della promessa (ricordo 3).
 *  5. ENIGMA 3 — Ricomporre il ricordo di loro due sul telaio, nell'ordine in cui è accaduto (incontro, sciarpa,
 *     promessa): nasce «Il ricordo di noi due».
 *  6. QUARTA DECISIONE — porgerlo ad Agnese (agnese = risvegliata, sciarpa = al-collo) o tenerlo (sognante,
 *     sciarpa = alla-bottega). Subito dopo il percorso A/B/C/D secondo agnese × taddeo, con le righe in più della
 *     lettera (lettera_agnese = vera). Se ricorda: il dono della sciarpa e la richiesta di rinunciare alla vendetta.
 *  7. Uscita dal Belvedere verso la Reggia: ['segna', 'leucio-finito'].
 *
 * Chiavi «segna» che escono dal capitolo: leucio-finito, leucio-ago-preso, leucio-bianca-indizio,
 * leucio-giglio-stoffe, leucio-tessitrice-sciolta. Flag scritti: agnese, sciarpa.
 * Oggetti che escono: ferro-ago (facoltativo), sciarpa-rossa (solo se Agnese ricorda), fazzoletto-bianca.
 */

AV.capitolo({ id: 'san-leucio', titolo: 'San Leucio', ordine: 4, sottotitolo: 'La tessitrice' });

// --- Personaggi del capitolo ---
AV.personaggio({ id: 'nunzia', nome: 'Nunzia, tessitrice', colore: '#d6c7a1', figura: { sagoma: 'donna', alt: 56 } });
AV.personaggio({ id: 'tessitrice-pietra', nome: 'La Tessitrice di Pietra', colore: '#b8c4d6',
  figura: { foglio: 'tessitrice-pietra', celle: 4, alt: 130 } });

// --- Oggetti del capitolo ---
AV.oggetto({ id: 'ruota-storta', nome: 'Una ruota dentata storta',
  descrizione: 'Una ruotina di ricambio per i telai. Un dente piegato, il mozzo ovale. Così non gira.',
  icona: { sagoma: 'ferro' },
  guarda: [['pensa', 'Ferro dolce, piegato da un colpo. Mio padre direbbe: si raddrizza a freddo, a colpi piccoli, se sai dove battere.']] }); // [nuovo]
AV.oggetto({ id: 'martello', nome: 'Il martelletto della forgetta',
  descrizione: 'Un martello piccolo da aggiustatore di telai. Il manico è lucido di mani.',
  icona: { sagoma: 'ferro' },
  guarda: [['pensa', 'Pesa giusto. Le mani se lo ricordano prima di me.']] }); // [nuovo]
AV.oggetto({ id: 'ruota-dentata', nome: 'La ruota dentata raddrizzata',
  descrizione: 'Gira tonda, ogni dente al suo posto. È fatta per il telaio di Agnese.',
  icona: { sagoma: 'ferro' } });
AV.oggetto({ id: 'ruotina-spezzata', nome: 'La ruotina spezzata',
  descrizione: 'Una piccola ruota di telaio rotta in due. Agnese la teneva nel cesto «da sempre».',
  icona: { sagoma: 'ferro' },
  guarda: [['pensa', 'La conosco. L\'ho rotta io, il primo giorno. Lei l\'ha tenuta senza sapere perché.']] }); // [nuovo]
AV.oggetto({ id: 'sciarpa-consumata', nome: 'La sciarpa consumata',
  descrizione: 'Lunga, rossa, lisa ai bordi. È quella che lei mi regalò. Stava fra gli scarti della Reggia.',
  icona: { punti: [[2, 4], [14, 2], [16, 8], [10, 22], [6, 22], [8, 9]] },
  guarda: [['pensa', 'Ha ancora il nodo che facevo io, storto. Nessun altro lo farebbe così.']] }); // [nuovo]
AV.oggetto({ id: 'fazzoletto-bianca', nome: 'Il fazzoletto col giglio',
  descrizione: 'Un fazzolettino di lino. Un giglio ricamato a punti incerti, lasciato a metà.',
  icona: { sagoma: 'foglio' },
  guarda: [['pensa', 'Punti grandi, storti, tirati troppo. La mano di una bambina. Il giglio si ferma a un petalo dalla fine.']] }); // [nuovo]
AV.oggetto({ id: 'anima-promessa', nome: 'Il ricordo della promessa',
  descrizione: 'Una luce rossa, calda, salita dalla Tessitrice di Pietra. Dentro c\'è una bottega che non esiste ancora.',
  icona: { sagoma: 'anima' },
  guarda: [
    ['dice', 'didascalia', 'Ferruccio le promette che, quando avrà abbastanza denaro, apriranno insieme una bottega.'], // [bibbia]
    ['dice', 'didascalia', 'La loro promessa è semplice: una casa, un lavoro e una vita normale.'], // [bibbia]
  ] });
AV.oggetto({ id: 'ricordo-noi', nome: 'Il ricordo di noi due',
  descrizione: 'Una striscia di trama rossa e oro, tessuta sul telaio di Agnese: il primo giorno, la sciarpa, la promessa.',
  icona: { sagoma: 'anima' },
  guarda: [['pensa', 'Se glielo porgo, ricorderà il mio nome. E con il nome, tutto il resto: l\'attesa, la notte del Velo, il dolore.']] }); // [nuovo]
AV.oggetto({ id: 'sciarpa-rossa', nome: 'La sciarpa rossa',
  descrizione: 'La sciarpa che Agnese ha finito stanotte. Ora la porto al collo.',
  icona: { punti: [[2, 4], [14, 2], [16, 8], [10, 22], [6, 22], [8, 9]] },
  guarda: [['dice', 'agnese', 'Dicono che il rosso protegga dal malocchio.']] }); // [bibbia]

// ============================================================================================================
// 1. IL BORGO DELLA SETA — quadro d'ingresso
// ============================================================================================================
AV.quadro({
  id: 'leucio.arrivo', capitolo: 'san-leucio', nome: 'San Leucio, il borgo della seta',
  fondale: { immagine: 'avventura/leucio-arrivo',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['quinte', { colore: '#1c1a2b' }],
      ['case', { n: 7, alto: 90, finestre: 2 }], ['palazzo', { x: 420, w: 220, h: 170, archi: 3, finestre: 4 }],
      ['suolo', { tipo: 'selciato', y: 248 }], ['fontana', { x: 250, y: 236, w: 70 }],
      ['lampione', { x: 120, y: 160, h: 90, acceso: true }], ['fili', { n: 5 }], ['nebbia', { alfa: 0.15 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'cap-san-leucio', [
      ['capitolo', 'san-leucio'],
      ['pensa', 'Sopra il borgo, dal tetto della manifattura, escono fili d\'oro. Vanno tutti nella stessa direzione: verso la Reggia.'], // [nuovo]
      ['diario', 'San Leucio. Il borgo della seta. Dai tetti escono fili d\'oro che vanno verso la Reggia.'], // [nuovo]
      ['obiettivo', 'Salire al Belvedere, alla manifattura.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'nunzia', nome: 'Una vecchia tessitrice', x: 160, y: 176, w: 40, h: 74, personaggio: 'nunzia',
      guarda: [['pensa', 'Una vecchia seduta sull\'uscio. Le mani fanno il gesto della navetta anche a vuoto.']], // [nuovo]
      usa: [['dialogo', 'nunzia.uscio']],
      con: { 'fazzoletto-bianca': [['dice', 'nunzia', 'Chillo giglio? Ce lo facevano fare a tutte. Nisciuna l\'ha mai fatto uguale.']], // [nuovo]
        'sciarpa-rossa': [['dice', 'nunzia', 'Uh, Madonna. La sciarpa di Agnese. Allora era pe\' te.'], // [nuovo]
          ['pensa', 'La vecchia si asciuga gli occhi col dorso della mano, e ride.']], // [nuovo]
        '*': [['dice', 'nunzia', 'Bello. Ma io nun me ricordo niente, figlio mio. Qua nisciuno se ricorda niente.']] } }, // [nuovo]
    { id: 'case', nome: 'Le case dei tessitori', x: 20, y: 120, w: 120, h: 120,
      guarda: [['pensa', 'Tutte uguali, a schiera, ognuna col suo telaio al piano terra. Il Re le diede ai tessitori con uno statuto: niente doti, niente servi, scuola per tutti i figli.']] }, // [nuovo]
    { id: 'fontana', nome: 'La fontanella', x: 250, y: 220, w: 70, h: 40,
      guarda: [['pensa', 'L\'acqua è ferma a mezz\'aria, come un filo di vetro. Anche qui la notte non passa.']], // [nuovo]
      usa: [['pensa', 'Ferruccio tocca il getto. È freddo, e non si spezza.']] }, // [nuovo]
    { id: 'fili', nome: 'I fili d\'oro nel cielo', x: 250, y: 24, w: 160, h: 70,
      guarda: [['pensa', 'Partono dalla manifattura e si perdono verso sud, verso Caserta. Tremano piano, come corde di un violino che qualcuno suona lontano.']] }, // [nuovo]
    { id: 'lampione', nome: 'Il lampione', x: 112, y: 160, w: 20, h: 90, sagoma: 'lampione',
      guarda: [['pensa', 'Acceso, e nessuno l\'ha acceso. La fiamma non si muove.']] }, // [nuovo]
    { id: 'verso-villa', nome: 'La strada per Caserta, verso la Villa', x: 0, y: 200, w: 40, h: 90,
      guarda: [['pensa', 'La strada scende verso Caserta e la Villa Comunale.']], // [nuovo]
      uscita: 'villa.cancello',
      usa: [['pensa', 'Ferruccio si volta verso la Villa. Il filo d\'oro sopra di lui tira dall\'altra parte.']] }, // [nuovo]
    { id: 'verso-belvedere', nome: 'La salita al Belvedere', x: 470, y: 170, w: 70, h: 100, uscita: 'leucio.belvedere',
      guarda: [['pensa', 'La scalinata sale al Belvedere, dove c\'è la manifattura della seta.']] }, // [nuovo]
  ],
});

AV.dialogo({ id: 'nunzia.uscio', con: 'nunzia',
  inizio: [
    ['dice', 'nunzia', 'Ah, ‘na maschera. Pure stanotte è festa? Qua è sempre stanotte.'], // [nuovo]
    ['pensa', 'Ferruccio fa un inchino.'], // [nuovo]
  ],
  saluto: [['dice', 'nunzia', 'Ancora tu? Sali, sali. Lassù i telai fanno tutto da soli, nun ce sta bisogno di nisciuno.']], // [nuovo]
  temi: [
    { id: 'telai', testo: 'Indica la manifattura in cima', fai: [
      ['dice', 'nunzia', 'Batteno da soli, i telai. Notte e giorno, che poi è sempre notte. Nuje stamme ccà fore e guardammo.'], // [nuovo]
      ['dice', 'nunzia', 'Solo una ci sta ancora dentro. Agnese. Nun se stacca da chillo telaio.'], // [nuovo]
      ['diario', 'In manifattura i telai lavorano da soli. Una sola tessitrice è rimasta dentro: Agnese.'], // [nuovo]
      ['segna', 'nunzia-telai'],
    ] },
    { id: 'agnese', testo: 'Fai il gesto di avvolgerti una sciarpa al collo', se: { visto: 'nunzia-telai' }, unaVolta: true, fai: [
      ['dice', 'nunzia', 'Agnese? Sì, ‘na sciarpa. Sempre la stessa, rossa, longa assai. La finisce, la smonta, la ricomincia.'], // [nuovo]
      ['dice', 'nunzia', 'Io le dico: per chi è? E chella ride. «Nun ‘o saccio, Nunzia. Però ha da essere pronta.»'], // [nuovo]
    ] },
    { id: 'fili', testo: 'Indica i fili d\'oro nel cielo', fai: [
      ['dice', 'nunzia', 'Chilli fili? Erano le stoffe per la Reggia. La Signora le voleva cu ‘e fiori, e cu ‘o giglio.'], // [nuovo]
      ['dice', 'nunzia', 'Quando le finivamo, ce pareva di avere scordato qualche cosa. Po\' nun ce pareva più niente.'], // [nuovo]
    ] },
  ] });

// ============================================================================================================
// 2. IL CORTILE DEL BELVEDERE
// ============================================================================================================
AV.quadro({
  id: 'leucio.belvedere', capitolo: 'san-leucio', nome: 'Il cortile del Belvedere',
  fondale: { immagine: 'avventura/leucio-belvedere',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['palazzo', { x: 140, w: 360, h: 200, archi: 5, finestre: 6 }],
      ['suolo', { tipo: 'tufo', y: 246 }], ['porta', { x: 290, y: 176, w: 60, h: 70, stato: 'socchiusa' }],
      ['albero', { x: 70, y: 246, h: 120, tipo: 'leccio' }], ['banco', { x: 470, y: 244, w: 80 }],
      ['luce', { x: 320, y: 200, r: 60, colore: '#f7c56a' }], ['fili', { n: 7 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'leucio-belvedere-visto', [
      ['pensa', 'Il cortile del Belvedere. Dalle finestre della manifattura viene un rumore di telai, regolare come un cuore.'], // [nuovo]
      ['obiettivo', 'Entrare nella manifattura.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'portone', nome: 'Il portone della manifattura', x: 286, y: 172, w: 68, h: 74, uscita: 'leucio.manifattura',
      guarda: [['pensa', 'Il portone è socchiuso. Dalla fessura passano i fili d\'oro, tesi, e un odore di seta calda.']] }, // [nuovo]
    { id: 'vista', nome: 'La vista su Caserta', x: 520, y: 40, w: 110, h: 80,
      guarda: [['pensa', 'Giù, lontana, la Reggia. Tutti i fili d\'oro finiscono lì, nelle sue finestre accese.']], // [nuovo]
      usa: [['se', { visto: 'leucio-tessitrice-sciolta' },
        [['pensa', 'Ora so che cosa portano quei fili. Seta e ricordi, a Donna Luciana.']], // [nuovo]
        [['pensa', 'Ferruccio segue con gli occhi un filo, dalla manifattura fino alla Reggia. Che cosa ci porteranno?']]]] }, // [nuovo]
    { id: 'gelso', nome: 'Il gelso del cortile', x: 40, y: 130, w: 70, h: 116,
      guarda: [['pensa', 'Un gelso vecchio. I bachi mangiano le sue foglie; da lì comincia tutta la seta di San Leucio.']] }, // [nuovo]
    { id: 'stemma', nome: 'Lo stemma sul portone', x: 300, y: 130, w: 40, h: 34,
      guarda: [['pensa', 'Lo stemma della colonia reale, e sotto una riga scolpita: il lavoro dei tessitori è la loro sola nobiltà.']] }, // [nuovo]
    { id: 'panca', nome: 'La panca di pietra', x: 466, y: 222, w: 88, h: 30,
      guarda: [['pensa', 'Una panca rivolta verso la valle. Ci si siede chi esce dalla manifattura a prendere aria.']], // [nuovo]
      usa: [['se', { flag: { lettera_agnese: 'vera' } },
        [['unaVolta', 'leucio-lettera-letta', [
          ['pensa', 'Ferruccio si siede. Dalla giubba tira fuori la lettera che Tonino gli ha reso: la scrittura di Agnese, prima della maledizione.'], // [nuovo]
          ['dice', 'didascalia', 'Il ricordo recuperato da Tonino nel primo capitolo può aggiungere una lettera d\'amore scritta da Agnese prima della maledizione.'], // [bibbia]
          ['dice', 'agnese', '«Ferrù, oggi al telaio ho sbagliato tre volte la trama, e la colpa è tua, che sei passato sotto la finestra senza salire.»'], // [nuovo]
          ['dice', 'agnese', '«La bottega la voglio con la porta verde. E una sedia per me vicino alla fucina, che ti guardo lavorare e ti dico che sbagli.»'], // [nuovo]
          ['dice', 'agnese', '«Non so scrivere le cose belle. Allora te lo scrivo semplice: torna presto.»'], // [nuovo]
          ['pensa', 'Ferruccio la legge in silenzio, con la manifattura alle spalle. Poi la piega e la ripone vicino al petto.'], // [nuovo]
          ['diario', 'Al Belvedere ho riletto la lettera di Agnese. «Torna presto.»'], // [nuovo]
        ], [['pensa', 'La lettera è al suo posto, vicino al petto.']]]], // [nuovo]
        [['pensa', 'Ferruccio si siede un momento. Il rumore dei telai, la luna ferma. Poi si rialza.']]]] }, // [nuovo]
    { id: 'verso-borgo', nome: 'Giù, al borgo', x: 0, y: 236, w: 40, h: 54, uscita: 'leucio.arrivo',
      guarda: [['pensa', 'La scalinata torna giù, al borgo dei tessitori.']] }, // [nuovo]
    { id: 'verso-reggia', nome: 'La strada per la Reggia', x: 590, y: 150, w: 50, h: 120,
      guarda: [['pensa', 'Una strada scende dal Belvedere seguendo i fili d\'oro, dritta verso la Reggia.']], // [nuovo]
      usa: [['se', { flag: { agnese: '*' } },
        [['pensa', 'Ferruccio si volta un\'ultima volta verso le finestre della manifattura. Poi segue i fili d\'oro.'], // [nuovo]
          ['diario', 'Lascio San Leucio. I fili portano alla Reggia, e alla Reggia c\'è Donna Luciana.'], // [nuovo]
          ['obiettivo', 'Seguire i fili d\'oro fino alla Reggia.'], // [nuovo]
          ['segna', 'leucio-finito'],
          ['vai', 'reggia.cancello'],
        ],
        [['pensa', 'Non ancora. Lassù c\'è una tessitrice che non sa il mio nome.']]]] }, // [nuovo]
  ],
});

// ============================================================================================================
// 3. LA MANIFATTURA — i telai che si muovono da soli
// ============================================================================================================
AV.quadro({
  id: 'leucio.manifattura', capitolo: 'san-leucio', nome: 'La manifattura della seta',
  fondale: { immagine: 'avventura/leucio-manifattura',
    disegno: [['cielo', { tono: 'interno' }], ['muro', { x: 0, y: 40, w: 640, h: 210, tono: 'scuro' }],
      ['finestra', { x: 60, y: 60, w: 50, h: 80, accesa: false }], ['finestra', { x: 530, y: 60, w: 50, h: 80, accesa: false }],
      ['suolo', { tipo: 'assi', y: 250 }], ['telaio', { x: 150, y: 150, w: 90, h: 100 }], ['telaio', { x: 270, y: 150, w: 90, h: 100 }],
      ['telaio', { x: 390, y: 150, w: 90, h: 100 }], ['fili', { n: 9 }], ['luce', { x: 320, y: 120, r: 120, colore: '#e8b04a' }]],
    luce: { tono: 'interno' } },
  musica: 'telai',
  entrata: [
    ['unaVolta', 'leucio-manifattura-vista', [
      ['effetto', 'velo'],
      ['pensa', 'I telai battono. Le navette corrono da sole, i pedali si abbassano sotto piedi che non ci sono.'], // [nuovo]
      ['pensa', 'Alcuni fili, quelli d\'oro, salgono dalle trame e passano dal soffitto. Sono destinati alla Reggia: si muovono anche se nessuno aziona i telai.'], // [nuovo]
      ['diario', 'In manifattura i telai tessono da soli. I fili d\'oro salgono e partono per la Reggia.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'telai', nome: 'I telai che vanno da soli', x: 150, y: 150, w: 330, h: 100,
      guarda: [['pensa', 'Fiori, rami, e in mezzo a ogni pezza lo stesso fiore d\'oro: un giglio. Nessuna mano li guida.']], // [nuovo]
      usa: [['pensa', 'Ferruccio ferma una navetta con la mano. Gli scivola fra le dita e riparte, come un pesce.']], // [nuovo]
      con: { '*': [['pensa', 'Il telaio non si accorge di niente. Tesse.']] } }, // [nuovo]
    { id: 'fili', nome: 'I fili d\'oro', x: 250, y: 20, w: 160, h: 110,
      guarda: [['se', { visto: 'leucio-telaio-riparato' },
        [['pensa', 'Da quando il telaio di Agnese batte, i fili sono tesi come corde. Corrono lungo il soffitto e scendono nel magazzino.']], // [nuovo]
        [['pensa', 'Ondeggiano lenti, molli. Vanno su, e poi chissà dove: così non si capisce la strada.']]]], // [nuovo]
      usa: [['se', { visto: 'leucio-telaio-riparato' },
        [['pensa', 'Ferruccio segue il filo più grosso con lo sguardo: dal soffitto alla porta bassa del magazzino. Lì sotto passa tutto.'], // [nuovo]
          ['segna', 'leucio-fili-seguiti']],
        [['pensa', 'Ferruccio prova a seguirne uno. Si confonde con gli altri. Serve che tirino, per vederne la strada.']]]] }, // [nuovo]
    { id: 'cassa', nome: 'La cassa dei pezzi', x: 40, y: 206, w: 70, h: 44, sagoma: 'cassa',
      guarda: [['pensa', 'Una cassa di ricambi per i telai: spole, molle, cinghie, ruotine di ferro.']], // [nuovo]
      usa: [['se', { visto: 'leucio-telaio-rotto' },
        [['unaVolta', 'leucio-ruota-presa', [
          ['pensa', 'In fondo alla cassa, una ruotina dentata della misura giusta. Ha un dente piegato e il mozzo ovale.'], // [nuovo]
          ['prendi', 'ruota-storta'],
          ['obiettivo', 'Raddrizzare la ruota dentata: alla forgetta c\'è un\'incudine.'], // [nuovo]
        ], [['pensa', 'Il resto sono molle arrugginite e spole vuote.']]]], // [nuovo]
        [['pensa', 'Ferruccio fruga fra i ricambi. Per ora non gli serve niente.']]]] }, // [nuovo]
    { id: 'registro', nome: 'Il banco del capotelaio', x: 500, y: 196, w: 70, h: 54,
      guarda: [['pensa', 'Il libro delle commesse è aperto. L\'ultima riga: «Per la Reggia. Drappi a fiori, col giglio d\'oro. Commissione di Donna Luciana. Tessitrice: Agnese.»']], // [nuovo]
      usa: [['unaVolta', 'leucio-registro-letto', [
        ['pensa', 'Accanto alla riga, a matita, una scrittura che Ferruccio conosce: «I fili si mangiano le cose. Avvisare F.»'], // [nuovo]
        ['pensa', 'La matita si ferma lì. La riga dopo è bianca.'], // [nuovo]
        ['diario', 'Agnese ha tessuto i drappi col giglio per Donna Luciana. Qualcuno ha scritto: «I fili si mangiano le cose. Avvisare F.»'], // [nuovo]
      ], [['pensa', '«Avvisare F.» E poi niente.']]]] }, // [nuovo]
    { id: 'porta-forgetta', nome: 'La forgetta degli aggiustatori', x: 0, y: 120, w: 34, h: 80, uscita: 'leucio.forgetta',
      guarda: [['pensa', 'Una porticina annerita dal fumo. Là dentro si aggiustavano i ferri dei telai.']] }, // [nuovo]
    { id: 'porta-sala', nome: 'La sala del telaio grande', x: 588, y: 150, w: 52, h: 100, uscita: 'leucio.telaio',
      guarda: [['pensa', 'Dalla sala in fondo viene un suono diverso: un telaio solo, e qualcuno che canticchia.']] }, // [nuovo]
    { id: 'verso-belvedere', nome: 'Il portone, verso il Belvedere', x: 290, y: 256, w: 60, h: 34, uscita: 'leucio.belvedere',
      guarda: [['pensa', 'Il portone da cui è entrato. Fuori, il cortile del Belvedere e la luna ferma.']] }, // [nuovo]
    { id: 'porta-magazzino', nome: 'La porta bassa del magazzino', x: 120, y: 254, w: 70, h: 36,
      se: { visto: 'leucio-telaio-riparato' },
      guarda: [['pensa', 'La porta bassa del magazzino. I fili d\'oro le passano sotto, tesi.']], // [nuovo]
      usa: [['vai', 'leucio.magazzino']] },
    { id: 'porta-magazzino-chiusa', nome: 'Una porta bassa, impigliata nei fili', x: 120, y: 254, w: 70, h: 36,
      se: { nonVisto: 'leucio-telaio-riparato' },
      guarda: [['pensa', 'Una porta bassa. I fili d\'oro ci si sono avvolti intorno come un bozzolo, molli e fitti.']], // [nuovo]
      usa: [['pensa', 'Ferruccio tira la maniglia. I fili cedono e si richiudono. Finché sono molli, non lasciano passare.'], // [nuovo]
        ['diario', 'La porta del magazzino è avvolta nei fili d\'oro, molli. Se tirassero, forse si aprirebbe.']] }, // [nuovo]
  ],
});

// ============================================================================================================
// 4. LA FORGETTA — enigma 1, seconda metà
// ============================================================================================================
AV.quadro({
  id: 'leucio.forgetta', capitolo: 'san-leucio', nome: 'La forgetta degli aggiustatori',
  fondale: { immagine: 'avventura/leucio-forgetta',
    disegno: [['cielo', { tono: 'interno' }], ['muro', { x: 0, y: 30, w: 640, h: 220, tono: 'fumo' }],
      ['suolo', { tipo: 'tufo', y: 250 }], ['forma', { punti: [[260, 250], [270, 214], [350, 214], [360, 250]], colore: '#2a2420', bordo: '#5a4a3a' }],
      ['forma', { punti: [[440, 120], [520, 120], [520, 210], [440, 210]], colore: '#2b1d14', bordo: '#7a4a24' }],
      ['luce', { x: 480, y: 170, r: 40, colore: '#7a3a1a' }], ['finestra', { x: 100, y: 70, w: 40, h: 50, accesa: false }]],
    luce: { tono: 'interno' } },
  musica: 'telai',
  entrata: [['unaVolta', 'leucio-forgetta-vista', [
    ['pensa', 'Un\'incudine piccola, una forgia spenta, attrezzi appesi. Odore di carbone vecchio. Ferruccio si ferma sulla soglia come in chiesa.']]]], // [nuovo]
  punti: [
    { id: 'incudine', nome: 'L\'incudine', x: 256, y: 206, w: 108, h: 46,
      guarda: [['pensa', 'Un\'incudine da aggiustatore, col corno stretto per le ruote piccole. Sul fianco, un segno: G. F.']], // [nuovo]
      usa: [['pensa', 'Ferruccio passa il palmo sulla tavola dell\'incudine. Liscia, come quella della bottega.']], // [nuovo]
      con: {
        'ruota-storta': [['se', { ha: 'martello' },
          [['pensa', 'Ferruccio infila la ruota sul corno dell\'incudine. Colpi piccoli, sul mozzo, girando. Poi il dente, di taglio.'], // [nuovo]
            ['suono', 'martello'], ['attendi', 400], ['suono', 'martello'],
            ['pensa', 'La ruota gira tonda. Le mani hanno fatto da sole, come quelle di suo padre.'], // [nuovo]
            ['togli', 'ruota-storta'], ['prendi', 'ruota-dentata'],
            ['diario', 'Ho raddrizzato la ruota dentata alla forgetta. Ora va montata sul telaio di Agnese.'], // [nuovo]
            ['obiettivo', 'Montare la ruota sul telaio di Agnese.']], // [nuovo]
          [['pensa', 'Sull\'incudine, sì. Ma a mani nude il ferro non si raddrizza. Serve un martello.']]]], // [nuovo]
        'martello': [['pensa', 'Ferruccio batte un colpo a vuoto sull\'incudine. Il suono riempie la stanza. Manca il ferro da battere.']], // [nuovo]
        '*': [['pensa', 'Questo non va sull\'incudine.']] } }, // [nuovo]
    { id: 'martello', nome: 'Gli attrezzi appesi', x: 440, y: 40, w: 90, h: 70,
      guarda: [['pensa', 'Pinze, lime, un martelletto da aggiustatore. Tutto in fila, pulito, come se qualcuno dovesse tornare domattina.']], // [nuovo]
      usa: [['unaVolta', 'leucio-martello-preso', [['prendi', 'martello'], ['pensa', 'Ferruccio stacca il martelletto dal chiodo.']], // [nuovo]
        [['pensa', 'Il chiodo vuoto. Gli altri attrezzi sono troppo grossi per una ruota così piccola.']]]] }, // [nuovo]
    { id: 'forgia', nome: 'La forgia spenta', x: 440, y: 120, w: 80, h: 90,
      guarda: [['pensa', 'Brace grigia, fredda. Nessuno l\'ha più accesa da quella notte.']], // [nuovo]
      usa: [['pensa', 'Ferruccio soffia sulla cenere. Niente. Per un dente piegato, però, basta battere a freddo.']] }, // [nuovo]
    { id: 'chiodo-ruote', nome: 'Una fila di ruotine appese', x: 160, y: 60, w: 70, h: 50,
      guarda: [['pensa', 'Ruote dentate di ogni misura, infilate su un chiodo. Tutte troppo grandi per il telaio di Agnese.']] }, // [nuovo]
    { id: 'finestra', nome: 'La finestrella', x: 96, y: 66, w: 48, h: 58, sagoma: 'finestra',
      guarda: [['pensa', 'Fuori, la luna ferma sopra i gelsi.']] }, // [nuovo]
    { id: 'uscita', nome: 'Torna alla manifattura', x: 590, y: 140, w: 50, h: 110, uscita: 'leucio.manifattura',
      guarda: [['pensa', 'Il rumore dei telai, di là.']] }, // [nuovo]
  ],
});

// ============================================================================================================
// 5. LA SALA DEL TELAIO DI AGNESE — la scena indispensabile, l'enigma 3, la quarta decisione
// ============================================================================================================
AV.quadro({
  id: 'leucio.telaio', capitolo: 'san-leucio', nome: 'La sala del telaio grande',
  fondale: { immagine: 'avventura/leucio-telaio',
    disegno: [['cielo', { tono: 'interno' }], ['muro', { x: 0, y: 30, w: 640, h: 220, tono: 'caldo' }],
      ['finestra', { x: 480, y: 50, w: 70, h: 100, accesa: false }], ['suolo', { tipo: 'assi', y: 252 }],
      ['telaio', { x: 230, y: 120, w: 170, h: 132 }], ['forma', { punti: [[270, 140], [360, 140], [356, 200], [274, 200]], colore: '#9b1c1c', bordo: '#d94a3a' }],
      ['luce', { x: 300, y: 150, r: 110, colore: '#f2b35c' }], ['fili', { n: 4 }]],
    luce: { tono: 'interno' } },
  musica: 'agnese',
  entrata: [
    ['unaVolta', 'leucio-agnese-incontrata', [
      // san-leucio.arrivo-manifattura — scena indispensabile: incontro con Agnese e scoperta del Velo
      ['pensa', 'Una sala sola, un telaio solo, e una lanterna. Al telaio una ragazza tesse una lunga sciarpa rossa.'], // [nuovo]
      ['pensa', 'Agnese.'], // [nuovo]
      ['dice', 'agnese', 'Oh. Buonasera. Non vi ho sentito entrare.'], // [nuovo]
      ['pensa', 'Gli sorride come si sorride a uno sconosciuto. Gentile. Da lontano.'], // [nuovo]
      ['pensa', 'Ferruccio si ferma davanti al telaio. Allunga una mano verso la sciarpa, senza toccarla. Poi si tocca il polso.'], // [nuovo]
      ['pensa', 'È identica. Lo stesso rosso, la stessa trama a spina, lo stesso orlo. È la sciarpa che lei gli regalò.'], // [nuovo]
      ['dice', 'didascalia', 'Agnese conserva la sciarpa sul telaio.'], // [bibbia, inizio-memoria-e-doni]
      ['effetto', 'scossa'], ['suono', 'crac'],
      ['pensa', 'La mano di Ferruccio urta il castello del telaio. Uno schiocco: la navetta si ferma di colpo.'], // [nuovo]
      ['dice', 'agnese', 'Siete venuto ad aggiustarlo o a finirlo?'], // [bibbia]
      ['pensa', 'Ferruccio cerca di spiegarsi: le mani, la bocca muta, le mani di nuovo.'], // [nuovo]
      ['dice', 'agnese', 'Ah, siete pure un uomo di poche parole. Almeno quelle non le rompete.'], // [bibbia]
      ['pensa', 'Le stesse parole. Le stesse, di quel primo giorno. Lei non sa di averle già dette.'], // [nuovo]
      ['segna', 'leucio-telaio-rotto'],
      ['diario', 'Agnese è al telaio. Non mi riconosce. Tesse la stessa sciarpa rossa che mi regalò.'], // [nuovo]
      ['diario', 'Ho bloccato il suo telaio: una ruotina dentata si è spaccata.'], // [nuovo]
      ['obiettivo', 'Trovare una ruota dentata nuova per il telaio di Agnese.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'agnese', nome: 'Agnese', x: 330, y: 176, w: 48, h: 76, personaggio: 'agnese', posa: 0,
      guarda: [['se', { flag: { agnese: 'risvegliata' } },
        [['pensa', 'Agnese lo guarda, e questa volta lo vede.']], // [nuovo]
        [['pensa', 'Tesse senza guardare le mani. Ogni tanto si ferma, come se avesse sentito chiamare il suo nome.']]]], // [nuovo]
      usa: [['dialogo', 'agnese.telaio']],
      con: {
        'fazzoletto-bianca': [['dialogo', 'agnese.telaio']],
        'ricordo-noi': [
          // san-leucio.scelta-agnese — la quarta decisione
          ['pensa', 'Ferruccio tiene in mano il ricordo di loro due. Guarda la sciarpa sul telaio, poi Agnese, poi le proprie mani.'], // [nuovo]
          ['pensa', 'Se glielo porge, Agnese ricorderà il suo nome. E con il nome torneranno l\'attesa, la notte dell\'incantesimo, il dolore che quei ricordi contengono. Sarà di nuovo una persona con una storia, e nessuno le promette che finisca bene.'], // [nuovo]
          ['pensa', 'Se lo tiene, lei resterà così: serena, al telaio, a tessere per qualcuno che non ricorda. Ma avrà scelto lui al posto suo, come ha fatto Donna Luciana. E la sciarpa non sarà al suo collo.'], // [nuovo]
          ['scelta', [
            { testo: 'Porgile il ricordo (Agnese ricorderà tutto, anche il dolore)', fai: [
              ['flag', 'agnese', 'risvegliata'], ['flag', 'sciarpa', 'al-collo'],
              ['togli', 'ricordo-noi'],
              ['effetto', 'luce'],
              ['pensa', 'Ferruccio apre la mano. La striscia rossa e oro si scioglie in luce e sale verso di lei, e lei la respira come si respira prima di piangere.'], // [nuovo]
              ['dice', 'agnese', '…Ferruccio.'], // [nuovo]
            ] },
            { testo: 'Stringi il ricordo nel pugno (resterà serena: scegli tu per lei)', fai: [
              ['flag', 'agnese', 'sognante'], ['flag', 'sciarpa', 'alla-bottega'],
              ['togli', 'ricordo-noi'],
              ['pensa', 'Ferruccio chiude la mano. La luce si spegne fra le dita, piano. Agnese non si accorge di niente.'], // [nuovo]
              ['dice', 'agnese', 'Avete un\'aria triste, maschera. Volete sedervi un momento?'], // [nuovo]
            ] },
          ]],
          ['segna', 'leucio-agnese-decisa'],
          // Subito dopo: il percorso giusto fra A, B, C, D (bibbia 209-280)
          ['se', { flag: { agnese: 'risvegliata', taddeo: 'perdonato' } }, [
            // san-leucio.amore-ritrovato — Percorso A
            ['mostra', 'taddeo'],
            ['pensa', 'Dalla porta entra Taddeo, col fiato corto. È venuto da Caserta seguendo Ferruccio.'], // [nuovo]
            ['dice', 'didascalia', 'Taddeo confessa di aver consegnato Ferruccio a Donna Luciana. Aiuta Agnese a ricostruire gli ultimi giorni trascorsi insieme.'], // [bibbia; a schermo la Signora è Donna Luciana]
            ['dice', 'taddeo', 'Sono stato io, Agnese. L\'ho portato io dalla Signora. Ma prima… prima c\'era la bottega, la porta verde. Te la ricordi?'], // [nuovo]
            ['pensa', 'Agnese riconosce Ferruccio e gli si avvicina.'], // [nuovo]
            ['dice', 'agnese', 'Non sapevo più il tuo nome.'], // [bibbia]
            ['dice', 'agnese', 'Ma ricordavo come mi guardavi.'], // [bibbia]
            ['dice', 'didascalia', 'Gli toglie delicatamente la polvere dalla maschera.'], // [bibbia]
            ['pensa', 'Ferruccio resta immobile. Poi le prende la mano e la porta alla propria maschera.'], // [nuovo]
            ['dice', 'agnese', 'Torna da me. Anche se non puoi più essere quello di prima.'], // [bibbia]
          ]],
          ['se', { flag: { agnese: 'risvegliata', taddeo: 'accusato' } }, [
            // san-leucio.amore-senza-fiducia — Percorso B
            ['pensa', 'Agnese ricorda. Ricorda anche Taddeo, e il modo in cui Ferruccio lo ha lasciato a Corso Trieste.'], // [nuovo]
            ['dice', 'agnese', 'Era tuo amico. Era il nostro amico, Ferrù.'], // [nuovo]
            ['dice', 'agnese', 'Ho aspettato un uomo per anni.'], // [bibbia]
            ['dice', 'agnese', 'Adesso ho paura che sia tornata soltanto la sua rabbia.'], // [bibbia]
            ['dice', 'didascalia', 'Ferruccio le mostra la sciarpa consumata e tenta di prenderle la mano.'], // [bibbia]
            ['dice', 'didascalia', 'Lei gliela stringe, ma non gli promette di aspettarlo.'], // [bibbia]
          ]],
          ['se', { flag: { agnese: 'sognante', taddeo: 'perdonato' } }, [
            // san-leucio.amore-dimenticato — Percorso C
            ['mostra', 'taddeo'],
            ['pensa', 'Taddeo è sulla porta. Ha visto la luce spegnersi nel pugno di Ferruccio.'], // [nuovo]
            ['dice', 'didascalia', 'Taddeo cerca di convincerlo a cambiare idea.'], // [bibbia]
            ['dice', 'taddeo', 'Stai facendo esattamente quello che ha fatto Donna Luciana.'], // [bibbia; a schermo «Donna Luciana» per Violante]
            ['dice', 'taddeo', 'Stai scegliendo al posto suo.'], // [bibbia]
            ['dice', 'didascalia', 'Ferruccio abbassa lo sguardo.'], // [bibbia]
            ['dice', 'agnese', 'Questa è pronta. Non so per chi è. Signore, voi che venite dalla città, la portereste a una bottega? Mi pare che stia bene là.'], // [nuovo]
            ['dice', 'taddeo', 'La porto io alla bottega di Gaetano. Sta là, quando ti decidi.'], // [nuovo]
          ]],
          ['se', { flag: { agnese: 'sognante', taddeo: 'accusato' } }, [
            // san-leucio.ultima-sciarpa — Percorso D
            ['pensa', 'Nessuno è venuto con lui. Nessuno lo aspetta fuori.'], // [nuovo]
            ['dice', 'didascalia', 'Agnese non lo riconosce e gli offre soltanto la sciarpa appena terminata.'], // [bibbia]
            ['dice', 'agnese', 'Prendila. Non so perché, ma credo che debba averla tu.'], // [bibbia]
            ['dice', 'didascalia', 'Ferruccio prende la sciarpa, la piega accuratamente e le fa un inchino.'], // [bibbia]
            ['dice', 'didascalia', 'Agnese sorride.'], // [bibbia]
            ['dice', 'agnese', 'Che tipo buffo.'], // [bibbia]
            ['pensa', 'Non la mette al collo. La porterà piegata alla bottega di suo padre, dove le cose aspettano.'], // [nuovo]
          ]],
          // la lettera (lettera_agnese = vera) aggiunge le sue righe
          ['se', { flag: { lettera_agnese: 'vera', agnese: 'risvegliata' } }, [
            ['pensa', 'Ferruccio le mostra la lettera. Lei la riconosce prima di leggerla.'], // [nuovo]
            ['dice', 'agnese', '«Torna presto.» E tu ci hai messo tutta questa notte.'], // [nuovo]
          ]],
          ['se', { flag: { lettera_agnese: 'vera', agnese: 'sognante' } }, [
            ['pensa', 'Ferruccio le mostra la lettera, solo per un momento.'], // [nuovo]
            ['dice', 'agnese', 'È la mia scrittura. Non mi ricordo di averla scritta. Come mi tremano le mani, guardate.'], // [nuovo]
          ]],
          // risvegliata: il dono della sciarpa e la rinuncia alla vendetta
          ['se', { flag: { agnese: 'risvegliata' } }, [
            // san-leucio.dono-sciarpa
            ['pensa', 'Agnese stacca la sciarpa dal telaio, taglia l\'ultimo filo coi denti e gliela avvolge al collo, due giri, stretta.'], // [nuovo]
            ['dice', 'agnese', 'Dicono che il rosso protegga dal malocchio.'], // [bibbia]
            ['dice', 'agnese', 'Io non ci credo. Però con te non si sa mai.'], // [bibbia]
            ['prendi', 'sciarpa-rossa'],
            ['pensa', 'Ferruccio se la stringe al collo e la guarda.'], // [nuovo]
            // san-leucio.rinuncia-vendetta
            ['dice', 'agnese', 'Ferrù. Tuo padre non te lo devo ricordare io. Non lo scordare mai.'], // [nuovo]
            ['dice', 'agnese', 'Però non lasciare che sia la sua morte a decidere tutto quello che fai. Alla Reggia, non andarci per ammazzare qualcuno. Vacci per sapere.'], // [nuovo]
            ['pensa', 'Ferruccio guarda la spada al fianco. Poi guarda lei.'], // [nuovo]
            ['diario', 'Agnese ricorda. Mi ha messo al collo la sciarpa rossa. Mi ha chiesto di andare alla Reggia per sapere, non per uccidere.'], // [nuovo]
          ], [
            ['diario', 'Agnese continua a sognare. Ho scelto io per lei. La sciarpa andrà alla bottega.'], // [nuovo]
          ]],
          ['se', { flag: { agnese: 'sognante', taddeo: 'accusato' } }, [
            ['vai', 'leucio.manifattura'],
            ['dice', 'didascalia', 'Dopo la sua partenza, si accorge di stare piangendo senza conoscerne il motivo.'], // [bibbia]
          ]],
          ['obiettivo', 'Tornare al Belvedere e prendere la strada per la Reggia.'], // [nuovo]
        ],
        'ruotina-spezzata': [['dice', 'agnese', 'L\'ho tenuta tanto. Adesso è vostra. Non me la ridate, che poi mi metto a pensare.']], // [nuovo]
        'sciarpa-consumata': [['dice', 'agnese', 'Questa… sembra la mia sciarpa, vecchia di anni. Ma io non l\'ho mai finita. Io non la finisco mai.']], // [nuovo]
        'anima-promessa': [['pensa', 'La luce rossa trema verso di lei. Non così, da sola: un pezzo di ricordo non basta. Va tessuto insieme agli altri.']], // [nuovo]
        '*': [['dice', 'agnese', 'E che ci devo fare? Io so solo tessere.']] } }, // [nuovo]
    { id: 'telaio', nome: 'Il telaio di Agnese', x: 230, y: 118, w: 96, h: 134,
      guarda: [['se', { visto: 'leucio-telaio-riparato' },
        [['pensa', 'Il telaio batte, regolare. Fra i licci, un ago di ferro che con la seta non c\'entra niente.']], // [nuovo]
        [['pensa', 'Il telaio è fermo. Sotto il subbio, una ruotina dentata spaccata in due: per questo la navetta non passa.']]]], // [nuovo]
      usa: [['se', { visto: 'leucio-ricordo-pronto' },
        [['pensa', 'Il telaio ha finito di tessere il ricordo. Adesso tocca a Ferruccio decidere che farne.']], // [nuovo]
        [['se', { visto: 'leucio-telaio-riparato' },
          [['pensa', 'Il telaio aspetta un filo. Non uno qualunque: un ricordo. Il primo giorno, poi il resto, nell\'ordine in cui è successo.']], // [nuovo]
          [['pensa', 'Ferruccio spinge il pedale. Niente: la ruota spaccata non ingrana.']]]]]], // [nuovo]
      con: {
        'ruota-dentata': [
          ['togli', 'ruota-dentata'],
          ['pensa', 'Ferruccio si inginocchia sotto il subbio, sfila i pezzi spaccati e infila la ruota nuova. Un giro di prova. Ingrana.'], // [nuovo]
          ['suono', 'telaio'], ['posa', 'agnese', 1],
          ['dice', 'agnese', 'Guarda. Allora le sapete aggiustare, le cose.'], // [nuovo]
          ['pensa', 'Il telaio riparte. In tutta la manifattura i telai si fermano un momento, come se ascoltassero; poi i fili d\'oro si tendono di colpo.'], // [nuovo]
          ['effetto', 'scossa'],
          ['dice', 'agnese', 'Tenete. Questa l\'ho trovata nel mio cesto, rotta, da sempre. Non so perché non l\'ho mai buttata.'], // [nuovo]
          ['prendi', 'ruotina-spezzata'],
          ['segna', 'leucio-telaio-riparato'],
          ['diario', 'Il telaio di Agnese batte di nuovo. I fili d\'oro si sono tesi: adesso si vede dove vanno.'], // [nuovo]
          ['diario', 'Agnese mi ha dato una ruotina spezzata. È quella che ruppi il primo giorno.'], // [nuovo]
          ['obiettivo', 'Seguire i fili d\'oro, ora tesi, nella manifattura.'], // [nuovo]
        ],
        'ruota-storta': [['pensa', 'Così storta non ingrana: il dente piegato si incastra. Va raddrizzata, prima.']], // [nuovo]
        'ruotina-spezzata': [['se', { nonVisto: 'leucio-ric-1' },
          [['pensa', 'Ferruccio posa la ruotina spezzata sull\'ordito. Il telaio la prende come un filo.'], // [nuovo]
            ['togli', 'ruotina-spezzata'], ['segna', 'leucio-ric-1'], ['effetto', 'luce'],
            // san-leucio.flashback-telaio
            ['dice', 'didascalia', 'Durante il loro primo incontro lui rompe accidentalmente una piccola ruota del telaio.'], // [bibbia]
            ['pensa', 'La manifattura piena di gente, di giorno. Un ragazzo con la borsa dei ferri, impacciato, e una tessitrice che ride di lui.'], // [nuovo]
            ['dice', 'didascalia', 'Ferruccio cerca di spiegarsi.'], // [bibbia]
            ['dice', 'agnese', 'E tornate domani, che la ruota nuova la voglio vedere girare.'], // [nuovo]
            ['dice', 'didascalia', 'Da quel momento Ferruccio comincia a inventare scuse per tornare nella manifattura.'], // [bibbia]
            ['dice', 'agnese', 'Che disegno è, questo? Non l\'ho mai tessuto.'], // [nuovo]
            ['diario', 'Sul telaio ho intrecciato il primo ricordo: il giorno che ci siamo conosciuti.']], // [nuovo]
          [['pensa', 'Già tessuto.']]]],
        'sciarpa-consumata': [['se', { visto: 'leucio-ric-1' },
          [['se', { nonVisto: 'leucio-ric-2' }, [
            ['pensa', 'Ferruccio stende la sciarpa consumata sulla trama. Il telaio ne prende il colore, e il lembo gli torna in mano.'], // [nuovo]
            ['segna', 'leucio-ric-2'], ['effetto', 'luce'],
            // san-leucio.flashback-sciarpa
            ['dice', 'didascalia', 'Un giorno Agnese gli regala una lunga sciarpa rossa.'], // [bibbia]
            ['dice', 'agnese', 'Dicono che il rosso protegga dal malocchio.'], // [bibbia]
            ['dice', 'agnese', 'Io non ci credo. Però con te non si sa mai.'], // [bibbia]
            ['pensa', 'Il ragazzo se la avvolge al collo, due giri, e fa il nodo storto.'], // [nuovo]
            ['diario', 'Secondo ricordo sul telaio: la sciarpa rossa.'], // [nuovo]
          ], [['pensa', 'Già tessuto.']]]],
          [['pensa', 'Non ancora. Prima della sciarpa c\'è stato il primo giorno.']]]], // [nuovo]
        'anima-promessa': [['se', { visto: 'leucio-ric-2' },
          [['togli', 'anima-promessa'], ['segna', 'leucio-ric-3'], ['effetto', 'luce'],
            ['pensa', 'La luce rossa entra nel pettine. Il telaio batte tre colpi lenti.'], // [nuovo]
            ['dice', 'didascalia', 'Ferruccio le promette che, quando avrà abbastanza denaro, apriranno insieme una bottega.'], // [bibbia]
            ['dice', 'didascalia', 'La loro promessa è semplice: una casa, un lavoro e una vita normale.'], // [bibbia]
            ['pensa', 'Sull\'ordito resta una striscia di trama rossa e oro. Ferruccio la stacca: è leggera come un respiro.'], // [nuovo]
            ['prendi', 'ricordo-noi'], ['segna', 'leucio-ricordo-pronto'],
            ['diario', 'Ho ricomposto il ricordo di noi due. Posso porgerlo ad Agnese, o tenerlo.'], // [nuovo]
            ['obiettivo', 'Decidere: restituire ad Agnese il ricordo di noi due, o lasciarla sognare.']], // [nuovo]
          [['pensa', 'Non ancora. La promessa è venuta dopo: prima il primo giorno, poi la sciarpa.']]]], // [nuovo]
        '*': [['pensa', 'Il telaio non prende questo filo.']] } }, // [nuovo]
    { id: 'ago', nome: 'Un ago di ferro fra i licci', x: 236, y: 96, w: 30, h: 22,
      se: { visto: 'leucio-telaio-riparato', nonVisto: 'leucio-ago-preso' },
      guarda: [['pensa', 'Un ago lungo di ferro battuto, infilato fra i licci. Sul gambo, piccolo piccolo: G. F.']], // [nuovo]
      usa: [['prendi', 'ferro-ago'], ['segna', 'leucio-ago-preso'], ['nascondi', 'ago'],
        ['dice', 'agnese', 'Quello? L\'ha fatto un fabbro di Caserta, per tenere i licci. Prendetelo, a me punge sempre.'], // [nuovo]
        ['pensa', 'L\'ago di mio padre. Il terzo dei suoi ferri.'], // [nuovo]
        ['diario', 'Fra i licci del telaio di Agnese c\'era l\'ago di mio padre.']] }, // [nuovo]
    { id: 'fazzoletto', nome: 'Un fazzoletto accanto al telaio', x: 410, y: 226, w: 34, h: 24,
      se: { nonHa: 'fazzoletto-bianca', nonVisto: 'leucio-fazzoletto-preso' },
      guarda: [['pensa', 'Un piccolo fazzoletto ricamato, in un cestino accanto al telaio. Un giglio, lasciato a metà.']], // [nuovo]
      usa: [['prendi', 'fazzoletto-bianca'], ['segna', 'leucio-fazzoletto-preso'], ['nascondi', 'fazzoletto'],
        ['pensa', 'Ferruccio passa il pollice sul ricamo interrotto.']] }, // [nuovo]
    { id: 'cesto', nome: 'Il cesto dei filati', x: 452, y: 220, w: 50, h: 32,
      guarda: [['pensa', 'Matasse rosse, tutte dello stesso rosso. Agnese non usa altri colori.']] }, // [nuovo]
    { id: 'finestra', nome: 'La finestra sulla valle', x: 480, y: 50, w: 70, h: 100, sagoma: 'finestra',
      guarda: [['pensa', 'Di qui si vedono i fili d\'oro partire per la Reggia. Agnese ci tesse davanti tutta la notte.']] }, // [nuovo]
    { id: 'taddeo', nome: 'Taddeo', x: 100, y: 168, w: 44, h: 84, personaggio: 'taddeo',
      se: { flag: { taddeo: 'perdonato', agnese: '*' } },
      guarda: [['pensa', 'Taddeo, appoggiato alla porta. Non guarda Agnese: guarda Ferruccio.']], // [nuovo]
      usa: [['se', { flag: { agnese: 'risvegliata' } },
        [['dice', 'taddeo', 'Vai, Ferrù. Lei è qua. Adesso hai una cosa da riportare a casa.']], // [nuovo]
        [['dice', 'taddeo', 'Ci penso io alla sciarpa. Ma tu pensaci, a quello che hai fatto.']]]] }, // [nuovo]
    { id: 'uscita', nome: 'Torna alla manifattura', x: 0, y: 140, w: 40, h: 112, uscita: 'leucio.manifattura',
      guarda: [['pensa', 'La porta della manifattura. Di là, i telai che vanno da soli.']] }, // [nuovo]
  ],
});

AV.dialogo({ id: 'agnese.telaio', con: 'agnese',
  inizio: [['dice', 'agnese', 'Se cercate il capotelaio, non c\'è. Non c\'è nessuno. Ci sono io e i telai.']], // [nuovo]
  saluto: [['se', { flag: { agnese: 'risvegliata' } },
    [['dice', 'agnese', 'Sei ancora qua? Vai, prima che la Reggia si accorga di te. E torna.']], // [nuovo]
    [['se', { flag: { agnese: 'sognante' } },
      [['dice', 'agnese', 'Ancora voi, maschera. Mi portate fortuna: stasera il filo non si spezza mai.']], // [nuovo]
      [['dice', 'agnese', 'Allora, maschera? Vi siete deciso a dire qualcosa?']]]]]], // [nuovo]
  temi: [
    { id: 'sciarpa', testo: 'Indica la sciarpa sul telaio', fai: [
      ['dice', 'agnese', 'Bella, eh? La faccio sempre uguale. La finisco, la disfo, la ricomincio.'], // [nuovo]
      ['dice', 'agnese', 'Per chi è? Non lo so. Ma deve essere pronta. Qualcuno verrà a prenderla.'], // [nuovo]
      ['dice', 'didascalia', 'Per questo Agnese continua a tessere la stessa sciarpa, senza sapere per chi.'], // [bibbia]
    ] },
    { id: 'fili', testo: 'Indica i fili d\'oro che partono dalla finestra', fai: [
      ['dice', 'agnese', 'Quelli sono i drappi per la Reggia. Li ho tessuti io, coi fiori e col giglio, come voleva Donna Luciana.'], // [nuovo]
      ['dice', 'agnese', 'Era una seta strana. Calda. Ogni volta che ne finivo un braccio, mi pareva di scordarmi una cosa. Una volta volevo dirlo a qualcuno… non so più a chi.'], // [nuovo]
      ['pensa', 'Si tocca il polso. Lo stesso gesto di Ferruccio. Non se ne accorge.'], // [nuovo]
      ['diario', 'Agnese ha tessuto la seta per la Reggia. Voleva avvertire qualcuno. Non ricorda chi.'], // [nuovo]
    ] },
    { id: 'fazzoletto', testo: 'Mostrale il fazzoletto col giglio', se: { ha: 'fazzoletto-bianca' }, fai: [
      // san-leucio.fazzoletto-giglio — Bianca, terzo indizio
      ['dice', 'agnese', 'Ah, questo. Donna Luciana ce lo chiedeva sempre, questo giglio: su ogni stoffa per la Reggia. Ce lo portò come modello.'], // [nuovo; bibbia: «Violante chiedeva spesso di riprodurre quel disegno»]
      ['dice', 'agnese', 'Nessuno riusciva a farlo uguale.'], // [bibbia]
      ['dice', 'agnese', 'Forse perché era stato fatto da una bambina.'], // [bibbia]
      ['pensa', 'Ferruccio passa il pollice sul ricamo interrotto.'], // [nuovo]
      ['segna', 'leucio-bianca-indizio'],
      ['diario', 'Il fazzoletto col giglio incompleto: Donna Luciana lo voleva riprodotto su ogni stoffa. L\'aveva ricamato una bambina.'], // [nuovo]
    ] },
    { id: 'ruota', testo: 'Indica il telaio, poi le tue mani', se: { visto: 'leucio-telaio-rotto', nonVisto: 'leucio-telaio-riparato' }, fai: [
      ['dice', 'agnese', 'Volete aggiustarlo davvero? C\'è la cassa dei pezzi di là, in manifattura. E la forgetta degli aggiustatori, se le mani vostre sono buone a qualcosa.'], // [nuovo]
    ] },
    { id: 'polso', testo: 'Toccati il polso, piano', unaVolta: true, fai: [
      ['pensa', 'Ferruccio si tocca il polso, come faceva sempre quando non sapeva che dire.'], // [nuovo]
      ['dice', 'agnese', 'Perché fate così? …Scusate. Mi pareva una cosa che conoscevo.'], // [nuovo]
    ] },
    { id: 'saluto', testo: 'Fai un inchino', fai: [['dice', 'agnese', 'Che maniere. Andate, andate, che io tesso.']] }, // [nuovo]
  ] });

// ============================================================================================================
// 6. IL MAGAZZINO DELLE STOFFE — enigma 2 (seguire il filo d'oro), il giglio sulle stoffe
// ============================================================================================================
AV.quadro({
  id: 'leucio.magazzino', capitolo: 'san-leucio', nome: 'Il magazzino delle stoffe',
  fondale: { immagine: 'avventura/leucio-magazzino',
    disegno: [['cielo', { tono: 'interno' }], ['muro', { x: 0, y: 30, w: 640, h: 220, tono: 'scuro' }],
      ['suolo', { tipo: 'assi', y: 252 }], ['scala', { x: 30, y: 120, w: 60, h: 132 }],
      ['forma', { punti: [[140, 252], [140, 150], [240, 150], [240, 252]], colore: '#5e4b6b', bordo: '#8a7a9a' }],
      ['forma', { punti: [[270, 252], [270, 140], [370, 140], [370, 252]], colore: '#3f5a3a', bordo: '#6f8a6a' }],
      ['forma', { punti: [[400, 252], [400, 130], [510, 130], [510, 252]], colore: '#6b4a1e', bordo: '#d4a640' }],
      ['fili', { n: 3 }], ['luce', { x: 455, y: 180, r: 70, colore: '#e6b44a' }]],
    luce: { tono: 'interno' } },
  musica: 'telai',
  entrata: [['unaVolta', 'leucio-magazzino-visto', [
    ['pensa', 'Pile di stoffe fino al soffitto, avvolte in tela. Il filo d\'oro scende dalla botola e corre basso, fra le pile.'], // [nuovo]
    ['obiettivo', 'Trovare dove va il filo d\'oro, fra le pile di stoffe.']]]], // [nuovo]
  punti: [
    { id: 'pila-rose', nome: 'La pila delle rose', x: 140, y: 150, w: 100, h: 100,
      guarda: [['pensa', 'Rotoli di seta a rose. Fra le pieghe passa un filo bianco, di seta comune.']], // [nuovo]
      usa: [['pensa', 'Ferruccio smuove i rotoli. Dietro, il muro. Il filo d\'oro qui non c\'è.']] }, // [nuovo]
    { id: 'pila-foglie', nome: 'La pila delle foglie', x: 270, y: 140, w: 100, h: 110,
      guarda: [['pensa', 'Damaschi verdi a foglie. Un filo verde, spento.']], // [nuovo]
      usa: [['pensa', 'Ferruccio solleva un rotolo. Polvere, e il muro. Il filo d\'oro passa più in là.']] }, // [nuovo]
    { id: 'pila-giglio', nome: 'La pila col giglio', x: 400, y: 130, w: 110, h: 120,
      guarda: [
        // san-leucio.giglio-sulle-stoffe — secondo indizio sulla natura del Custode
        ['pensa', 'Drappi per la Reggia, a fiori, e in mezzo a ognuno un giglio d\'oro. Il filo d\'oro ci entra dentro, caldo come una lanterna.'], // [nuovo]
        ['unaVolta', 'leucio-giglio-stoffe', [
          ['dice', 'didascalia', 'A San Leucio scopre che la stessa forma floreale compare sulle stoffe commissionate da Donna Luciana.'], // [bibbia; a schermo Donna Luciana]
          ['pensa', 'Ferruccio solleva un lembo. Lo stesso fiore che il Custode della Reggia porta sul petto, dove si posa la mano. Il giglio lega chi lo porta a chi lo ha commissionato.'], // [nuovo]
          ['diario', 'Il giglio d\'oro delle stoffe è lo stesso che porta il Custode sul petto. Lo ha voluto Donna Luciana.'], // [nuovo]
        ]]],
      usa: [['se', { visto: 'leucio-passaggio-aperto' },
        [['vai', 'leucio.filatoio']],
        [['pensa', 'Ferruccio appoggia la spalla alla pila e spinge. I rotoli scorrono sulle assi: dietro c\'è una porta stretta, e il filo d\'oro ci passa sotto.'], // [nuovo]
          ['segna', 'leucio-passaggio-aperto'],
          ['diario', 'Il filo d\'oro va nel filatoio, dietro la pila col giglio.'], // [nuovo]
          ['obiettivo', 'Entrare nel filatoio, dove finisce il filo d\'oro.']]]] }, // [nuovo]
    { id: 'scarti', nome: 'Il mucchio degli scarti', x: 530, y: 210, w: 70, h: 42,
      guarda: [['pensa', 'Ritagli, cimose, stracci per le stoppe. Fra il grigio, una cosa rossa.']], // [nuovo]
      usa: [['unaVolta', 'leucio-sciarpa-trovata', [
        ['pensa', 'Ferruccio tira. Viene fuori una sciarpa lunga, rossa, consumata ai bordi. Ha ancora il suo nodo storto.'], // [nuovo]
        ['prendi', 'sciarpa-consumata'],
        ['diario', 'Fra gli scarti del magazzino c\'era la mia sciarpa, quella che Agnese mi regalò.'], // [nuovo]
      ], [['pensa', 'Solo stracci, ora.']]]] }, // [nuovo]
    { id: 'cartellini', nome: 'I cartellini delle spedizioni', x: 420, y: 60, w: 80, h: 40,
      guarda: [['pensa', 'Cartellini appesi a un chiodo: «Reggia, appartamento della Signora». «Reggia, sala del trono». «Reggia, per il Velo della Concordia».']] }, // [nuovo]
    { id: 'botola', nome: 'La botola nel soffitto', x: 200, y: 24, w: 90, h: 30,
      guarda: [['pensa', 'Da lì scendono i fili d\'oro della manifattura. Sono tesi: è il telaio di Agnese che li tira.']] }, // [nuovo]
    { id: 'scala', nome: 'La scala di legno', x: 30, y: 120, w: 60, h: 132, uscita: 'leucio.manifattura',
      guarda: [['pensa', 'La scala risale in manifattura.']] }, // [nuovo]
  ],
});

// ============================================================================================================
// 7. IL FILATOIO — il confronto con la Tessitrice di Pietra (§XII)
// ============================================================================================================
AV.quadro({
  id: 'leucio.filatoio', capitolo: 'san-leucio', nome: 'Il filatoio',
  fondale: { immagine: 'avventura/leucio-filatoio',
    disegno: [['cielo', { tono: 'velo' }], ['muro', { x: 0, y: 20, w: 640, h: 232, tono: 'scuro' }],
      ['suolo', { tipo: 'marmo', y: 252 }], ['forma', { punti: [[330, 60], [470, 60], [470, 200], [330, 200]], colore: '#1a1a24', bordo: '#d4a640' }],
      ['luce', { x: 400, y: 130, r: 90, colore: '#e6b44a' }], ['fili', { n: 11 }], ['nebbia', { alfa: 0.3 }]],
    luce: { tono: 'velo' } },
  musica: 'creatura',
  entrata: [['unaVolta', 'leucio-filatoio-visto', [
    ['effetto', 'velo'],
    // san-leucio.tessitrice-di-pietra
    ['pensa', 'Il filatoio. Una ruota grande come una porta gira senza sosta. La guida una statua di pietra, una tessitrice alta il doppio di un uomo.'], // [nuovo]
    ['pensa', 'Dai suoi rocchetti escono i fili d\'oro. Dentro ogni rocchetto, una luce piccola che si dibatte.'], // [nuovo]
    ['dice', 'tessitrice-pietra', 'Per la Signora. Uguale. Lo voglio uguale.'], // [nuovo]
    ['diario', 'Nel filatoio una statua, la Tessitrice di Pietra, fila i fili d\'oro. Nei rocchetti ci sono delle luci: ricordi.'], // [nuovo]
    ['obiettivo', 'Fermare la ruota del filatoio.']]]], // [nuovo]
  punti: [
    { id: 'tessitrice', nome: 'La Tessitrice di Pietra', x: 180, y: 60, w: 120, h: 192, personaggio: 'tessitrice-pietra', posa: 0,
      se: { nonVisto: 'leucio-tessitrice-sciolta' },
      guarda: [['pensa', 'Le mani di pietra guidano la ruota. Ogni tanto una mano lascia il filo e va al petto, dove c\'è un giglio scolpito: lo tocca, come chi cerca di finire un disegno, e torna alla ruota.'], // [nuovo]
        ['segna', 'leucio-tp-giglio']],
      usa: [['dice', 'tessitrice-pietra', 'Non è uguale. Disfa. Ricomincia. Per la Signora.'], // [nuovo]
        ['pensa', 'La statua non lo guarda nemmeno. Fila.']], // [nuovo]
      con: {
        'fazzoletto-bianca': [
          ['pensa', 'Ferruccio solleva il fazzoletto col giglio incompleto davanti agli occhi di pietra.'], // [nuovo]
          ['posa', 'tessitrice', 1],
          ['dice', 'tessitrice-pietra', '…Questo. Questo è quello vero.'], // [nuovo]
          ['pensa', 'Le mani lasciano la ruota. Prendono il fazzoletto, lo girano, cercano il petalo che manca. Non lo trovano.'], // [nuovo]
          ['dice', 'tessitrice-pietra', 'Manca un petalo. Chi l\'ha fatto non l\'ha finito. Non si può fare uguale.'], // [nuovo]
          ['segna', 'leucio-tp-ferma'],
          ['pensa', 'La ruota gira ancora, ma adesso nessuna mano la guida. Il perno di ferro al centro è libero.'], // [nuovo]
          ['obiettivo', 'La statua è distratta: fermare la ruota del filatoio.'], // [nuovo]
        ],
        'ferro-ago': [['pensa', 'Ferruccio le mostra l\'ago di suo padre. La statua lo guarda un momento: è un ferro da telaio, non le interessa.']], // [nuovo]
        '*': [['pensa', 'Le mani di pietra scansano l\'oggetto e tornano al filo.']] } }, // [nuovo]
    { id: 'ruota', nome: 'La grande ruota', x: 330, y: 60, w: 140, h: 140,
      guarda: [['pensa', 'Legno e ferro, il perno al centro forgiato a mano. La ruota tira tutti i fili d\'oro di San Leucio.']], // [nuovo]
      usa: [['se', { visto: 'leucio-tessitrice-sciolta' },
        [['pensa', 'La ruota è ferma. I fili pendono molli verso la finestra.']], // [nuovo]
        [['se', { visto: 'leucio-tp-ferma' },
          [
            ['pensa', 'Ferruccio afferra il perno. Figlio di fabbro: sa che un perno battuto a caldo esce girandolo contro il verso. Lo gira. Lo sfila.'], // [nuovo]
            ['suono', 'ferro'], ['effetto', 'scossa'],
            ['pensa', 'La ruota rallenta, ondeggia, si ferma.'], // [nuovo]
            ['posa', 'tessitrice', 2],
            ['dice', 'tessitrice-pietra', 'Per la Signora… per la bambina…'], // [nuovo]
            ['effetto', 'anime'],
            ['pensa', 'La statua non cade: si scioglie. La pietra si fa polvere, la polvere si fa luce. Dai rocchetti salgono anime colorate, lente, verso il soffitto: i ricordi delle tessitrici tornano a chi li aveva.'], // [nuovo]
            ['nascondi', 'tessitrice'],
            ['pensa', 'Una luce rossa non sale. Scende, e si posa nella mano di Ferruccio. Dentro c\'è una bottega che non esiste ancora.'], // [nuovo]
            ['prendi', 'anima-promessa'],
            ['pensa', 'Ora sa. Il Velo è nato dalla seta: la seta di San Leucio, filata coi ricordi di chi la tesseva. E il giglio è il segno che lega tutti i guardiani a Donna Luciana.'], // [nuovo]
            ['segna', 'leucio-tessitrice-sciolta'],
            ['diario', 'La Tessitrice di Pietra si è sciolta in anime. Il Velo nasce dalla seta; il giglio lega i guardiani a Donna Luciana.'], // [nuovo]
            ['diario', 'Mi è rimasta una luce rossa: il ricordo della promessa che feci ad Agnese.'], // [nuovo]
            ['obiettivo', 'Ricomporre sul telaio di Agnese il ricordo di noi due: il primo giorno, la sciarpa, la promessa.'], // [nuovo]
          ],
          [['pensa', 'Ferruccio prova a frenarla con le mani. La ruota lo trascina: finché le mani di pietra filano, non si ferma.']]]]]], // [nuovo]
      con: { '*': [['pensa', 'La ruota non si ferma così. Il perno, forse: ma le mani della statua non lo lasciano toccare.']] } }, // [nuovo]
    { id: 'rocchetti', nome: 'I rocchetti luminosi', x: 490, y: 190, w: 110, h: 60,
      guarda: [['se', { visto: 'leucio-tessitrice-sciolta' },
        [['pensa', 'Rocchetti vuoti, spenti. Le luci sono salite.']], // [nuovo]
        [['pensa', 'In ogni rocchetto una luce: un bambino che impara a camminare, una canzone, una lite, un bacio sulla porta. Ricordi delle tessitrici, avvolti in seta.']]]], // [nuovo]
      usa: [['pensa', 'Ferruccio tocca un rocchetto. La luce dentro gli batte sotto le dita, come un passero in mano.']] }, // [nuovo]
    { id: 'finestra', nome: 'La finestra dei fili', x: 520, y: 40, w: 80, h: 90, sagoma: 'finestra',
      guarda: [['pensa', 'Da qui i fili d\'oro escono e vanno alla Reggia. Tutti.']] }, // [nuovo]
    { id: 'giglio-muro', nome: 'Un giglio inciso nel muro', x: 60, y: 60, w: 50, h: 50,
      guarda: [['pensa', 'Sopra la porta, un giglio inciso nella calce. Qualcuno ci ha provato dieci volte, e dieci volte l\'ha cancellato.']] }, // [nuovo]
    { id: 'uscita', nome: 'Torna al magazzino', x: 0, y: 150, w: 40, h: 102, uscita: 'leucio.magazzino',
      guarda: [['pensa', 'La porta stretta, dietro la pila col giglio.']] }, // [nuovo]
  ],
});

/*
 * IMMAGINI DA FAR DISEGNARE (gioco/assets/avventura/, 640×360, teatro d'ombre: sagome scure, luci di lanterna, luna ferma;
 * la fascia y ≥ 300 resta libera per l'interfaccia)
 *  - leucio-arrivo.png       Il borgo della seta: case a schiera dei tessitori, fontanella col getto fermo, lampione acceso,
 *                            sullo sfondo la manifattura del Belvedere con fili d'oro che escono dal tetto verso sud.
 *  - leucio-belvedere.png    Il cortile: facciata a arcate della manifattura, portone socchiuso con lo stemma, gelso,
 *                            panca di pietra verso la valle; a destra lontanissima la Reggia illuminata, dove vanno i fili.
 *  - leucio-manifattura.png  Sala lunga coi telai che battono da soli (navette a mezz'aria, pedali abbassati), fili d'oro
 *                            che salgono al soffitto, banco del capotelaio col libro aperto, porticina annerita a sinistra,
 *                            porta bassa del magazzino in primo piano (due stati: avvolta nei fili / libera).
 *  - leucio-forgetta.png     Forgetta degli aggiustatori: incudine piccola col corno stretto (segno G. F.), forgia spenta,
 *                            attrezzi appesi in fila, fila di ruotine su un chiodo, finestrella con luna.
 *  - leucio-telaio.png       La sala del telaio grande: un solo telaio con la lunga sciarpa rossa sull'ordito, lanterna,
 *                            finestra sulla valle coi fili d'oro, cesto di matasse rosse, cestino col fazzoletto.
 *  - leucio-magazzino.png    Tre pile di stoffe (rose bianche, foglie verdi, drappi a fiori col giglio d'oro), filo d'oro
 *                            che scende dalla botola ed entra nella pila col giglio; scala di legno; mucchio di scarti con
 *                            un lembo rosso; cartellini delle spedizioni.
 *  - leucio-filatoio.png     Grande ruota di legno e ferro col perno forgiato, rocchetti luminosi, foschia fredda del Velo,
 *                            fili d'oro che escono da una finestra; spazio a sinistra per la Tessitrice di Pietra (foglio
 *                            sprite_teatro/tessitrice-pietra, pose: 0 fila, 1 si ferma col fazzoletto, 2 si scioglie).
 *  Figure: Agnese posa 0 tesse, posa 1 si volta (agnese_telaio, 2 celle). Nunzia: sagoma «donna» (manca un foglio).
 */
