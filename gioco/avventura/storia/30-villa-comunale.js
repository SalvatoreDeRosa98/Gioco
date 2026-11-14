/*
 * storia/30-villa-comunale.js — Capitolo 3: VILLA COMUNALE (con la via laterale dell'Acquedotto Carolino).
 * Solo dati (contratto in ../LEGGIMI.md). Fonti: trama/ferruccio-bibbia.md §I (15-80), §III (133-152), §VI (408-465),
 * §XI (803-812), §XII (849-867), Espansione II (1339-1345); scene `villa-comunale.*` di trama/storia.json.
 * Battute: `// [bibbia]` = parola per parola dalla bibbia (o dalla mappa che la cita); `// [nuovo]` = scritte qui.
 *
 * MAPPA DEL CAPITOLO
 *
 *                       [acquedotto.nicchia]  (facoltativo: il messaggio del padre → segna 'messaggio-padre')
 *                              |
 *                       [acquedotto.archi]    (facoltativo: le acque della memoria)
 *                              |  sentiero dal fondo
 *   [villa.serra] ---- [villa.cantiere] ----- (pietre del 1839, lapide, la centina: ricordo 1)
 *        |                     |
 *        |              [villa.fontana]       (la Madre di Marmo sulla fontana muta: il confronto; poi il punzone G. F.)
 *        |                     |
 *        +-------------- [villa.viale] ------- [villa.casina]  (registri pubblici; attrezzi; l'armadio → la TERZA DECISIONE)
 *                              |                 (statue: cavaliere col giglio, la memoria di Bianca; Peppe: ricordo 3)
 *                       [villa.cancello]       ← ingresso dal Corso; uscite: Corso Trieste e la strada di San Leucio
 *
 * COME SI ATTRAVERSA
 *  1. Cancello → viale. Nella casina il registro pubblico: Gaetano «per sua imperizia» (scena obbligatoria registri-pubblici).
 *  2. La Madre di Marmo custodisce i ricordi degli operai morti (§XII): li ha in pezzi. ENIGMA DEI RICORDI: tre frammenti
 *     sparsi nella Villa, da posare nella sua conca nell'ordine in cui accaddero (lo dicono i frammenti stessi, se guardati):
 *       ricordo-centina (il legno che cede; al cantiere) → ricordo-mani (le mani sotto la trave; nella serra, con il
 *       rastrello della casina) → ricordo-ragazzi (i ragazzi che escono; il berretto di Peppe, nel viale).
 *     All'ultimo: il ricordo di Gaetano (bibbia 428-441), la Madre si scioglie in anime, la fontana riprende a parlare
 *     (sul fondo il punzone G. F., facoltativo), resta la chiave dell'armadio.
 *  3. Nell'armadio della casina il registro originale con le cancellature: la TERZA DECISIONE (flag `registro`).
 *  4. Dal cancello la strada di San Leucio: segna 'villa-finita' (USCITA → leucio.arrivo).
 *  Facoltativi: cavaliere col giglio (indizio sul Custode), memoria di Bianca nel marmo (secondo indizio), Peppe che
 *  ricorda, la testimonianza di Taddeo (se perdonato), l'Acquedotto e il messaggio del padre, il punzone.
 *
 * COSE CHE ESCONO DAL CAPITOLO: flag `registro`, `prove`; segna 'villa-finita', 'messaggio-padre', 'inchino-bianca',
 * 'cavaliere-giglio', 'ricordo-gaetano', 'peppe-ricorda'; oggetti 'registro-gaetano' (se conservato), 'ferro-punzone'
 * (se preso), 'testimonianza-taddeo' (se Taddeo perdonato).
 */

AV.capitolo({ id: 'villa-comunale', titolo: 'Villa Comunale', ordine: 3, sottotitolo: 'La verità sotto la pietra' });

// --- Personaggi del capitolo ---
AV.personaggio({ id: 'madre-marmo', nome: 'La Madre di Marmo', colore: '#e7e5e4', figura: { foglio: 'custode-marmo', celle: 2, alt: 130 } });
AV.personaggio({ id: 'peppe', nome: 'Peppe, il giardiniere', colore: '#86efac', figura: { sagoma: 'uomo', alt: 58 } });

// --- Oggetti del capitolo ---
AV.oggetto({ id: 'ricordo-centina', nome: 'Una scheggia della centina', descrizione: 'Legno marcio dentro, verniciato fuori. Porta un ricordo del crollo.',
  icona: { sagoma: 'anima' },
  guarda: [
    ['pensa', 'Ferruccio la stringe. Nel ricordo il legno scricchiola sopra le teste degli operai: è il primo rumore, prima di tutto il resto.'], // [nuovo]
    ['dice', 'didascalia', '«La centina! La centina cede!»'], // [nuovo]
  ] });
AV.oggetto({ id: 'ricordo-mani', nome: 'Un guanto da fabbro bruciato', descrizione: 'Cuoio annerito, consumato sul palmo. Porta un ricordo del crollo.',
  icona: { sagoma: 'anima' },
  guarda: [
    ['pensa', 'Nel ricordo, due mani nere di fucina sotto una trave che scende. Le spalle tremano. Le mani non lasciano.'], // [nuovo]
  ] });
AV.oggetto({ id: 'ricordo-ragazzi', nome: 'Un berretto da ragazzo', descrizione: 'Piccolo, di panno, con la visiera rotta. Porta un ricordo del crollo.',
  icona: { sagoma: 'anima' },
  guarda: [
    ['pensa', 'Nel ricordo, ragazzi che corrono fuori dalla polvere. Uno si volta a guardare indietro: là dietro qualcuno tiene ancora.'], // [nuovo]
  ] });
AV.oggetto({ id: 'rastrello', nome: 'Il rastrello di Peppe', descrizione: 'Manico lungo, denti di ferro. Arriva dove le mani non arrivano.',
  icona: { sagoma: 'ferro' },
  guarda: [['pensa', 'I denti li ha ribattuti un fabbro, e bene. Ferruccio riconosce il colpo.']] }); // [nuovo]
AV.oggetto({ id: 'chiave-armadio', nome: 'La chiave della Madre', descrizione: 'Una chiavetta di ferro rimasta nella conca di marmo. È calda, come se qualcuno l\'avesse stretta per sei anni.',
  icona: { sagoma: 'chiave' },
  guarda: [['pensa', 'Sull\'anello, a punta di bulino: «Archivio. Lavori della Real Casa».']] }); // [nuovo]
AV.oggetto({ id: 'registro-gaetano', nome: 'Il registro di Gaetano', descrizione: 'Il registro originale dei lavori del 1839. Le cancellature dimostrano la falsificazione.',
  icona: { sagoma: 'libro' },
  guarda: [
    ['pensa', 'Sotto ogni riga corretta si legge ancora quella vera. Il nome di suo padre c\'è due volte: una scritta, una raschiata.'], // [nuovo]
    ['pensa', 'Ci vorranno anni perché qualcuno lo legga. Ferruccio lo tiene lo stesso.'], // [nuovo]
  ] });


// =====================================================================================================
// 1. IL CANCELLO
// =====================================================================================================
AV.quadro({
  id: 'villa.cancello', capitolo: 'villa-comunale', nome: 'Il cancello della Villa',
  fondale: { immagine: 'avventura/villa-cancello',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['albero', { x: 60, y: 250, h: 170, tipo: 'leccio' }],
      ['albero', { x: 560, y: 250, h: 180, tipo: 'palma' }], ['suolo', { tipo: 'selciato', y: 250 }],
      ['colonna', { x: 230, y: 110, h: 140 }], ['colonna', { x: 400, y: 110, h: 140 }],
      ['porta', { x: 250, y: 120, w: 150, h: 130, stato: 'socchiusa' }], ['siepe', { x: 0, y: 210, w: 220, h: 40 }],
      ['siepe', { x: 430, y: 210, w: 210, h: 40 }], ['lampione', { x: 470, y: 250, h: 110, acceso: true }],
      ['luce', { x: 470, y: 150, r: 70, colore: '#f9cb40' }], ['nebbia', { alfa: 0.15 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'cap-villa-comunale', [
      ['capitolo', 'villa-comunale'],
      ['pensa', 'Il cancello della Villa Comunale è socchiuso. Dietro, i lecci tengono il buio come una coperta.'], // [nuovo]
      ['diario', 'Alla Villa Comunale tengono i registri dei lavori della Reggia. Anche quelli del 1839, l\'anno in cui morì mio padre.'], // [nuovo]
      ['obiettivo', 'Cercare nella Villa che cosa dicono i registri di mio padre.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'cancello', nome: 'Il cancello', x: 250, y: 120, w: 150, h: 130, sagoma: 'porta',
      guarda: [['pensa', 'Le volute del ferro finiscono in un ricciolo stretto, battuto in tre colpi. Era il modo di suo padre.']], // [nuovo]
      usa: [['pensa', 'Ferruccio passa la mano sul ricciolo, poi spinge. Il cancello non cigola: qualcuno lo ungeva, una volta.'], ['vai', 'villa.viale']] }, // [nuovo]
    { id: 'viale', nome: 'Dentro la Villa', x: 300, y: 170, w: 50, h: 78, uscita: 'villa.viale',
      guarda: [['pensa', 'Il viale dei lecci, dritto fino alla fontana. Tutto fermo, anche le foglie.']] }, // [nuovo]
    { id: 'lampione', nome: 'Il lampione', x: 458, y: 140, w: 24, h: 110, sagoma: 'lampione',
      guarda: [['pensa', 'La fiamma non trema. Il lampionaio è rimasto a metà giro, con la pertica in mano, due strade più in là.']] }, // [nuovo]
    { id: 'garitta', nome: 'La garitta del custode', x: 130, y: 150, w: 70, h: 90, sagoma: 'cassa',
      guarda: [['pensa', 'Vuota. Sul banchetto, un pane morso a metà e un orario delle chiusure: «Si chiude al tramonto». Il tramonto non viene più.']] }, // [nuovo]
    { id: 'foglio-taddeo', nome: 'Un foglio fra le sbarre', x: 404, y: 170, w: 24, h: 30, sagoma: 'foglio',
      se: { flag: { taddeo: 'perdonato' } },
      guarda: [['pensa', 'Un foglio piegato in quattro, infilato fra le sbarre all\'altezza degli occhi. Qualcuno voleva che lo trovasse lui.']], // [nuovo]
      usa: [
        ['pensa', 'Ferruccio lo apre. Due righe, la mano di Taddeo: «Sono passato prima di te. Le carte del crollo stanno nella casina.»'], // [nuovo]
        ['unaVolta', 'biglietto-taddeo-villa', [['diario', 'Al cancello della Villa, un biglietto di Taddeo: le carte del crollo sono nella casina. La sua testimonianza firmata ce l\'ho già.']]], // [nuovo]
      ] },
    { id: 'verso-corso', nome: 'Verso Corso Trieste', x: 0, y: 150, w: 40, h: 100,
      guarda: [['pensa', 'Il Corso, con le sue vetrine accese e nessuno che compra.']], // [nuovo]
      usa: [
        ['pensa', 'Ferruccio torna sui suoi passi, verso il Corso.'], // [nuovo]
        ['vai', 'corso.fondo'],
      ] },
    { id: 'verso-leucio', nome: 'La strada di San Leucio', x: 600, y: 150, w: 40, h: 100,
      guarda: [['pensa', 'La strada sale verso la collina di San Leucio, dove battono i telai. Dove c\'è Agnese.']], // [nuovo]
      usa: [
        ['se', { visto: 'registro-deciso' }, [
          ['se', { visto: 'messaggio-padre' }, [['pensa', 'Prima di andare, Ferruccio guarda indietro, verso gli archi. «Chi vuole la verità cerca che cosa è successo.»']]], // [nuovo]
          ['pensa', 'Ferruccio si stringe la sciarpa e prende la salita. Dietro di lui la fontana continua a parlare da sola.'], // [nuovo]
          ['diario', 'Ho lasciato la Villa. Adesso so come è morto mio padre. Non so ancora che cosa farne.'], // [nuovo]
          ['segna', 'villa-finita'],
          ['vai', 'leucio.arrivo'],
        ], [
          ['pensa', 'Non ancora. Ferruccio è venuto per i registri, e i registri sono ancora qui.'], // [nuovo]
        ]],
      ] },
  ],
});

// =====================================================================================================
// 2. IL VIALE DELLE STATUE
// =====================================================================================================
AV.quadro({
  id: 'villa.viale', capitolo: 'villa-comunale', nome: 'Il viale delle statue',
  fondale: { immagine: 'avventura/villa-viale',
    disegno: [['cielo', { tono: 'notte', luna: true }], ['albero', { x: 40, y: 250, h: 190, tipo: 'leccio' }],
      ['albero', { x: 210, y: 245, h: 170, tipo: 'leccio' }], ['albero', { x: 430, y: 245, h: 170, tipo: 'leccio' }],
      ['albero', { x: 600, y: 250, h: 190, tipo: 'leccio' }], ['suolo', { tipo: 'sabbia', y: 245 }],
      ['statua', { x: 150, y: 245, h: 100 }], ['statua', { x: 500, y: 245, h: 95 }], ['banco', { x: 300, y: 250, w: 80 }],
      ['nebbia', { alfa: 0.2 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'viale-prima', [['pensa', 'Le statue del viale guardano tutte dalla stessa parte: verso la fontana.']]], // [nuovo]
  ],
  punti: [
    { id: 'cavaliere', nome: 'Il cavaliere col giglio', x: 120, y: 130, w: 60, h: 115, sagoma: 'statua',
      guarda: [
        ['dice', 'didascalia', 'Nella Villa Comunale Ferruccio trova una statua che rappresenta un cavaliere inginocchiato davanti a un giglio.'], // [bibbia]
      ],
      usa: [
        ['pensa', 'Ferruccio si china sulla base e legge l\'incisione.'], // [nuovo]
        ['dice', 'didascalia', 'Sulla base è inciso:'], // [bibbia]
        ['dice', 'didascalia', 'Non tutte le catene fanno rumore.'], // [bibbia]
        ['pensa', 'Resta un istante a fissare il giglio, poi si tocca il petto, dove il cavaliere porta il fiore.'], // [nuovo]
        ['unaVolta', 'cavaliere-giglio', [['diario', 'Un cavaliere di marmo in ginocchio davanti a un giglio. «Non tutte le catene fanno rumore.» Il Custode porta un giglio d\'oro sul petto.']]], // [nuovo]
      ] },
    { id: 'coppia', nome: 'L\'uomo e la bambina di marmo', x: 470, y: 140, w: 60, h: 105, sagoma: 'statua',
      guarda: [['pensa', 'Un uomo in divisa, chinato, e una bambina che gli arriva alla cintura. Il marmo è più bianco degli altri, come appena lavato.']], // [nuovo]
      usa: [
        ['effetto', 'velo'],
        ['pensa', 'Ferruccio appoggia il palmo sul marmo. È tiepido. Poi il marmo si muove.'], // [nuovo]
        ['pensa', 'Una memoria conservata nel marmo mostra Gregorio mentre insegna a Bianca a fare un inchino.'], // [bibbia]
        ['pensa', 'La bambina ride e sbaglia apposta.'], // [bibbia]
        ['dice', 'bianca', 'Ancora! Ma stavolta fallo tu!'], // [bibbia]
        ['pensa', 'Il ricordo svanisce quando Gregorio cerca di prenderle la mano.'], // [bibbia]
        ['pensa', 'Ferruccio resta immobile davanti al marmo tornato muto.'], // [nuovo]
        ['unaVolta', 'inchino-bianca', [['diario', 'Nel marmo del viale: il capitano Gregorio che insegna un inchino a una bambina, Bianca. Lei rideva. Lui le voleva prendere la mano, e il ricordo è finito lì.']]], // [nuovo]
      ] },
    { id: 'peppe', nome: 'Peppe, il giardiniere', x: 300, y: 175, w: 44, h: 72, personaggio: 'peppe', posa: 0,
      guarda: [['pensa', 'Un uomo giovane con le mani di un vecchio, seduto sulla panchina. Rigira fra le dita un berretto da ragazzo.']], // [nuovo]
      usa: [['dialogo', 'peppe.panchina']],
      con: {
        'ricordo-ragazzi': [['dice', 'peppe', 'No, no. Tienatillo tu. Mo\' pesa meno.']], // [nuovo]
        '*': [['dice', 'peppe', 'E che ne saccio io, guagliò? Io saccio \'e piante.']], // [nuovo]
      } },
    { id: 'leccio', nome: 'Il leccio vecchio', x: 190, y: 60, w: 50, h: 180,
      guarda: [['pensa', 'Sul tronco, a coltello: «T. e F., 1832». Due ragazzi che si arrampicavano qui. Uno era lui.']] }, // [nuovo]
    { id: 'verso-casina', nome: 'La casina dei registri', x: 560, y: 150, w: 60, h: 95, uscita: 'villa.casina',
      guarda: [['pensa', 'Una casina bassa con la finestra accesa. Sulla porta: «Comune di Caserta. Archivio dei lavori».']] }, // [nuovo]
    { id: 'verso-serra', nome: 'La serra', x: 0, y: 140, w: 40, h: 105, uscita: 'villa.serra',
      guarda: [['pensa', 'I vetri della serra brillano fra le siepi, opachi come occhi chiusi.']] }, // [nuovo]
    { id: 'verso-fontana', nome: 'Verso la fontana', x: 385, y: 140, w: 50, h: 100, uscita: 'villa.fontana',
      guarda: [['pensa', 'In fondo al viale, una fontana senza voce e una figura grande, china sull\'acqua.']] }, // [nuovo]
    { id: 'verso-cancello', nome: 'Al cancello', x: 250, y: 255, w: 140, h: 36, uscita: 'villa.cancello',
      guarda: [['pensa', 'Il cancello, e oltre il cancello la città.']] }, // [nuovo]
  ],
});

AV.dialogo({ id: 'peppe.panchina', con: 'peppe',
  inizio: [
    ['dice', 'peppe', 'Uè, guagliò. Assiettate, ca tanto ccà nun se move niente.'], // [nuovo]
    ['pensa', 'L\'uomo non smette di rigirare il berretto. È piccolo, consumato, da ragazzo.'], // [nuovo]
  ],
  saluto: [['dice', 'peppe', 'Ancora tu. \'O viale è sempre chillo.']], // [nuovo]
  temi: [
    { id: 'berretto', testo: 'Indica il berretto', unaVolta: true, fai: [
      ['dice', 'peppe', 'Chisto? Nun saccio \'e chi è. Ce l\'aggio \'mmano da quanno me ricordo, e nun me ricordo niente.'], // [nuovo]
      ['dice', 'peppe', 'Ogni tanto me pesa comme \'na preta. Pigliatillo tu, va\'.'], // [nuovo]
      ['prendi', 'ricordo-ragazzi'],
      ['diario', 'Peppe, il giardiniere, mi ha dato un berretto da ragazzo. Non sa di chi sia. Dentro c\'è un ricordo del crollo.'], // [nuovo]
    ] },
    { id: 'fontana', testo: 'Indica la fontana in fondo al viale', fai: [
      ['dice', 'peppe', 'Da sei anne nun canta cchiù. \'Ncoppa ce sta \'a Mamma \'e Marmo, e nun fa avvicinà a nisciuno.'], // [nuovo]
      ['dice', 'peppe', 'Io \'a guardo \'a luntano e me vene \'a chiagnere. E nun saccio pecché.'], // [nuovo]
    ] },
    { id: 'casina', testo: 'Indica la casina dei registri', fai: [
      ['dice', 'peppe', 'Llà dinto ce stanno \'e registri d\'\'o Comune. E \'e rastrielle mie.'], // [nuovo]
      ['dice', 'peppe', '\'A porta è aperta. Chi vuò ca s\'arrobba \'nu registro?'], // [nuovo]
    ] },
    { id: 'serra', testo: 'Indica la serra', fai: [
      ['dice', 'peppe', '\'E limoni so\' sicchi tutte quante. Ce sta pure \'nu guanto appiso \'ncoppa a \'nu ramo, auto auto. Nun ce arrivo manco io.'], // [nuovo]
    ] },
    { id: 'ricorda', testo: 'Mostragli le mani nere di fucina', se: { visto: 'ricordo-gaetano' }, unaVolta: true, fai: [
      ['pensa', 'Peppe guarda le mani di Ferruccio, poi le sue, vuote. Gli trema il mento.'], // [nuovo]
      ['dice', 'peppe', 'Tenevo dudece anne. Stevo sotto, cu ll\'ati guagliune, a purtà \'e chiuove.'], // [nuovo]
      ['dice', 'peppe', '\'Nu fabbro teneva \'a trave \'ncopp\'\'e spalle. Alluccava: «Prima fate uscire i ragazzi!». E io so\' asciuto.'], // [nuovo]
      ['dice', 'peppe', 'Isso no.'], // [nuovo]
      ['segna', 'peppe-ricorda'],
      ['diario', 'Peppe era uno dei ragazzi sotto la centina. Mio padre lo ha fatto uscire. Adesso se lo ricorda.'], // [nuovo]
    ] },
    { id: 'saluta', testo: 'Saluta con la mano', fai: [['dice', 'peppe', 'Statte buono, guagliò.']] }, // [nuovo]
  ] });

// =====================================================================================================
// 3. LA CASINA DEI REGISTRI (registri pubblici; l'armadio e la terza decisione)
// =====================================================================================================
AV.quadro({
  id: 'villa.casina', capitolo: 'villa-comunale', nome: 'La casina dei registri',
  fondale: { immagine: 'avventura/villa-casina',
    disegno: [['cielo', { tono: 'interno' }], ['muro', { x: 0, y: 40, w: 640, h: 210, tono: 'scuro' }],
      ['suolo', { tipo: 'assi', y: 250 }], ['finestra', { x: 60, y: 80, w: 70, h: 90, accesa: false }],
      ['scala', { x: 520, y: 60, w: 90, h: 190 }], ['banco', { x: 230, y: 250, w: 160 }],
      ['luce', { x: 330, y: 170, r: 90, colore: '#f9cb40' }]],
    luce: { tono: 'interno' } },
  musica: 'notte',
  entrata: [['unaVolta', 'casina-prima', [['pensa', 'Odore di carta umida e di olio di lanterna. Gli scaffali arrivano al soffitto.']]]], // [nuovo]
  punti: [
    { id: 'leggio', nome: 'Il registro pubblico', x: 230, y: 160, w: 90, h: 70, sagoma: 'libro',
      guarda: [['pensa', 'Un registro grosso, aperto su un leggio, con il segnalibro all\'anno 1839. Come se qualcuno lo aspettasse.']], // [nuovo]
      usa: [
        ['pensa', 'Ferruccio sfoglia le pagine e si ferma sul nome del padre.'], // [nuovo]
        ['dice', 'didascalia', '«Crollo della centina al cantiere della Real Casa. Causa: il fabbro Gaetano F., per sua imperizia, rimosse il puntello senza ordine.»'], // [nuovo]
        ['pensa', 'Serra il pugno sull\'elsa. La targa in città parla di uomini caduti nell\'adempimento del loro dovere; qui il dovere ha un colpevole, e ha il suo cognome.'], // [nuovo]
        ['unaVolta', 'registri-letti', [
          ['diario', 'Nel registro pubblico: «Gaetano F., per sua imperizia». Il nome di mio padre, scritto come una colpa.'], // [nuovo]
          ['obiettivo', 'La statua sulla fontana muta custodisce i ricordi degli operai morti. Andarle vicino.'], // [nuovo]
        ]],
      ],
      con: {
        'testimonianza-taddeo': [['pensa', 'Ferruccio mette il foglio di Taddeo accanto al registro. Due carte che dicono due cose diverse sulla stessa notte. Una è firmata da un amico.']], // [nuovo]
        'registro-gaetano': [['pensa', 'Le due copie, una accanto all\'altra. Dove l\'originale è cancellato, la copia pubblica è pulitissima.']], // [nuovo]
      } },
    { id: 'armadio', nome: 'L\'armadio chiuso', x: 420, y: 90, w: 80, h: 150, sagoma: 'porta',
      se: { nonVisto: 'registro-deciso' },
      guarda: [['pensa', 'Un armadio di noce con la serratura di ferro. Sopra la serratura, a pennello: «Originali».']], // [nuovo]
      usa: [['pensa', 'Chiuso a chiave. La serratura è piccola, fatta bene. Le mani di un fabbro non la forzano: la rispettano.']], // [nuovo]
      con: {
        'chiave-armadio': [
          ['togli', 'chiave-armadio'],
          ['se', { nonVisto: 'registri-letti' }, [
            ['pensa', 'Prima di aprire, Ferruccio legge il registro sul leggio: «Gaetano F., per sua imperizia».'], // [nuovo]
            ['segna', 'registri-letti'],
          ]],
          ['suono', 'serratura'],
          ['pensa', 'La chiave gira al primo colpo. Dentro, sotto un pacco di ricevute, il registro dei lavori del 1839. L\'originale.'], // [nuovo]
          ['pensa', 'Il documento originale contiene le cancellature e le correzioni che dimostrano la falsificazione.'], // [bibbia]
          ['dice', 'didascalia', '«Centina di legno di seconda scelta, non conforme. Le maestranze avvertono l\'appaltatore, che ordina di proseguire.»'], // [nuovo]
          ['pensa', 'Sopra una riga raschiata, con un\'altra mano: «Il fabbro Gaetano F. ha rimosso il puntello senza ordine». Sotto, ancora leggibile: «Il fabbro Gaetano F. sorregge la trave. Escono i ragazzi».'], // [nuovo]
          ['pensa', 'Ferruccio stringe il registro. Suo padre non era colpevole, e c\'è scritto. Per un momento è soltanto contento: la sua famiglia è stata disonorata ingiustamente, e adesso lo può dimostrare.'], // [nuovo]
          ['pensa', 'Poi, più in basso, una riga che nessuno ha corretto.'], // [nuovo]
          ['dice', 'didascalia', '«Presente il capitano Gregorio Valente, entrato sotto la centina per la figlia. Ne è uscito con la bambina in braccio. Non respirava.»'], // [nuovo]
          ['pensa', 'In fondo, sotto il rapporto falso, la firma: G. Valente.'], // [nuovo]
          ['pensa', 'Il Custode non è più semplicemente il mostro da uccidere.'], // [bibbia]
          ['pensa', 'È un padre che ha commesso un\'ingiustizia mentre cercava di proteggere ciò che restava della propria famiglia.'], // [bibbia]
          ['diario', 'Il registro originale: mio padre non fu colpevole, il rapporto falso lo firmò il capitano Gregorio Valente. Ma Gregorio era sotto la centina, a cercare sua figlia.'], // [nuovo]
          ['pensa', 'Sul tavolo la lanterna è accesa. Ferruccio tiene il registro sopra la fiamma.'], // [nuovo]
          ['pensa', 'Se lo conserva, la verità su suo padre andrà mostrata agli altri, anche se ci vorranno anni.'], // [nuovo] (bibbia 444)
          ['pensa', 'Se lo brucia, il nome di Gaetano non starà più accanto a quel crollo in nessun foglio. Ma brucerà anche l\'unica prova della sua innocenza.'], // [nuovo] (bibbia 446)
          ['se', { visto: 'messaggio-padre' }, [['pensa', 'Gli tornano in mente le parole della nicchia: «Chi vuole la vendetta cerca un colpevole; chi vuole la verità cerca che cosa è successo».']]], // [nuovo]
          ['scelta', [
            { testo: 'Chiudi il registro e tienilo stretto', fai: [
              ['flag', 'registro', 'conservato'],
              ['flag', 'prove', 'vera'],
              ['prendi', 'registro-gaetano'],
              ['pensa', 'Ferruccio allontana il registro dalla fiamma e lo chiude. Lo infila sotto la giacca, contro il petto, dove si sente.'], // [nuovo]
              ['pensa', 'Ci vorranno anni perché qualcuno lo legga. Ma esiste.'], // [nuovo]
              ['diario', 'Ho tenuto il registro originale. Le cancellature dicono che mio padre è innocente. Dovrò trovare qualcuno disposto a leggerle.'], // [nuovo]
            ] },
            { testo: 'Avvicina il registro alla fiamma', fai: [
              ['flag', 'registro', 'bruciato'],
              ['se', { flag: { prove: '' } }, [['flag', 'prove', 'falsa']]],
              ['effetto', 'luce'],
              ['pensa', 'L\'angolo prende fuoco subito, la carta è vecchia. Il nome raschiato brucia insieme a quello scritto.'], // [nuovo]
              ['pensa', 'Il registro brucia sulla fiamma della lanterna. Resta solo ciò che Ferruccio ha visto.'], // [nuovo] (mappa: registro-bruciato)
              ['pensa', 'Nessuno scriverà più che è stata colpa di Gaetano. Nessuno potrà più dimostrare che non lo è stata.'], // [nuovo]
              ['diario', 'Ho bruciato il registro. Il nome di mio padre non è più su quella pagina. Non è più da nessuna parte, tranne che in me.'], // [nuovo]
            ] },
          ]],
          ['segna', 'registro-deciso'],
          ['nascondi', 'armadio'],
          // --- villa-comunale.risoluzione-taddeo: mostrata, non spiegata ---
          ['se', { flag: { taddeo: 'perdonato' } },
            [['pensa', 'Sotto la porta della casina qualcuno ha infilato un foglio piegato. Una firma storta, che Ferruccio conosce: Taddeo.']], // [nuovo]
            [['se', { flag: { taddeo: 'accusato' } },
              [['pensa', 'In fondo al viale una divisa si ferma, lo vede e gira la testa. Taddeo. Se ne va senza voltarsi.']]]]], // [nuovo]
          ['se', { flag: { taddeo: 'perdonato', registro: 'conservato' } }, [['dice', 'didascalia', 'Taddeo confessa ufficialmente la falsificazione e indica gli altri responsabili.']]], // [bibbia]
          ['se', { flag: { taddeo: 'perdonato', registro: 'bruciato' } }, [['dice', 'didascalia', 'Taddeo confessa, ma la sua testimonianza non può essere verificata.']]], // [bibbia]
          ['se', { flag: { taddeo: 'accusato', registro: 'conservato' } }, [['dice', 'didascalia', 'Taddeo tenta di nascondere la propria complicità; Ferruccio possiede comunque la prova.']]], // [bibbia]
          ['se', { flag: { taddeo: 'accusato', registro: 'bruciato' } }, [['dice', 'didascalia', 'Taddeo riesce a negare pubblicamente il tradimento. Rimane però tormentato dalla colpa.']]], // [bibbia]
          ['pensa', 'Ferruccio tocca il registro, o la cenere che ne resta, e guarda verso il Corso.'], // [nuovo]
          ['obiettivo', 'Prendere dal cancello la strada di San Leucio, da Agnese.'], // [nuovo]
        ],
      } },
    { id: 'lanterna', nome: 'La lanterna sul tavolo', x: 340, y: 150, w: 30, h: 50, sagoma: 'lampione',
      guarda: [['pensa', 'Una lanterna a olio, accesa. Chi l\'ha lasciata accesa sei anni fa non è più tornato a spegnerla.']], // [nuovo]
      usa: [['pensa', 'La fiamma è dritta e ferma come tutto il resto. Scalda le dita lo stesso.']] }, // [nuovo]
    { id: 'attrezzi', nome: 'Gli attrezzi dei giardinieri', x: 150, y: 170, w: 60, h: 80, sagoma: 'ferro',
      guarda: [['pensa', 'Vanghe, cesoie, un rastrello dal manico lungo. Le etichette dicono «Peppe» con la stessa calligrafia storta.']], // [nuovo]
      usa: [
        ['unaVolta', 'rastrello-preso', [
          ['prendi', 'rastrello'],
          ['pensa', 'Ferruccio prende il rastrello dal manico lungo. Peppe non se ne avrà a male.'], // [nuovo]
        ], [['pensa', 'Il resto degli attrezzi non gli serve.']]], // [nuovo]
      ] },
    { id: 'scaffali', nome: 'Gli scaffali', x: 520, y: 60, w: 90, h: 180,
      guarda: [['pensa', 'Registri dal 1752 in poi: ogni pietra della Reggia ha una pagina. Su molti dorsi, la polvere ha la forma di una mano.']] }, // [nuovo]
    { id: 'finestra', nome: 'La finestra', x: 60, y: 80, w: 70, h: 90, sagoma: 'finestra',
      guarda: [['pensa', 'Dalla finestra si vede il viale, e in fondo la grande figura di marmo che non si muove.']] }, // [nuovo]
    { id: 'esci', nome: 'Torna al viale', x: 0, y: 255, w: 120, h: 36, uscita: 'villa.viale',
      guarda: [['pensa', 'La porta della casina, aperta sul viale.']] }, // [nuovo]
  ],
});

// =====================================================================================================
// 4. LA SERRA (ricordo 2: il guanto, col rastrello)
// =====================================================================================================
AV.quadro({
  id: 'villa.serra', capitolo: 'villa-comunale', nome: 'La serra dei limoni',
  fondale: { immagine: 'avventura/villa-serra',
    disegno: [['cielo', { tono: 'notte', luna: true }], ['arco', { x: 60, y: 40, w: 520, h: 210 }],
      ['suolo', { tipo: 'tufo', y: 250 }], ['albero', { x: 320, y: 250, h: 170, tipo: 'spoglio' }],
      ['albero', { x: 140, y: 250, h: 110, tipo: 'spoglio' }], ['albero', { x: 500, y: 250, h: 110, tipo: 'spoglio' }],
      ['nebbia', { alfa: 0.35 }]],
    luce: { tono: 'velo' } },
  musica: 'notte',
  entrata: [['unaVolta', 'serra-prima', [['effetto', 'velo'], ['pensa', 'Dentro la serra il Velo è più fitto: si appiccica ai vetri come fiato.']]]], // [nuovo]
  punti: [
    { id: 'limone', nome: 'Il limone secco', x: 280, y: 60, w: 80, h: 190,
      guarda: [['pensa', 'Il limone più grande della serra, secco. Su un ramo alto è appeso un guanto da fabbro, nero, come lasciato ad asciugare.']], // [nuovo]
      usa: [
        ['se', { nonVisto: 'guanto-preso' },
          [['pensa', 'Ferruccio si allunga sulle punte. Il ramo è troppo alto, e troppo secco per arrampicarsi.']], // [nuovo]
          [['pensa', 'Il ramo, adesso vuoto, ondeggia appena. Prima non si muoveva niente.']]], // [nuovo]
      ],
      con: {
        rastrello: [
          ['se', { nonVisto: 'guanto-preso' }, [
            ['pensa', 'Con il rastrello Ferruccio aggancia il guanto e lo tira giù piano. Il ramo si spezza appena lo lascia.'], // [nuovo]
            ['togli', 'rastrello'],
            ['prendi', 'ricordo-mani'],
            ['segna', 'guanto-preso'],
            ['pensa', 'Ferruccio rimette il rastrello contro il vaso, per Peppe.'], // [nuovo]
            ['diario', 'Nella serra, un guanto da fabbro bruciato. Dentro c\'è un ricordo: mani che tengono una trave.'], // [nuovo]
          ], [['pensa', 'Non c\'è più niente da tirare giù.']]], // [nuovo]
        ],
      } },
    { id: 'vetri', nome: 'I vetri appannati', x: 70, y: 50, w: 150, h: 120,
      guarda: [['pensa', 'Qualcuno ci ha scritto col dito, da dentro: «Fa freddo». Le lettere non colano: anche l\'acqua è ferma.']] }, // [nuovo]
    { id: 'vasi', nome: 'I vasi', x: 440, y: 200, w: 110, h: 50, sagoma: 'cassa',
      guarda: [['pensa', 'Vasi di terracotta in fila, ognuno con un nome di donna dipinto. Peppe li chiama così, i suoi limoni.']] }, // [nuovo]
    { id: 'lucciola', nome: 'Una luce fra le foglie secche', x: 150, y: 150, w: 30, h: 30, sagoma: 'anima',
      guarda: [['pensa', 'Una piccola luce, ferma a mezz\'aria. Un\'anima troppo debole per salire, o per sapere di esserlo.']], // [nuovo]
      usa: [['pensa', 'Ferruccio la sfiora. Per un attimo sente odore di limoni maturi, di un\'estate di sei anni fa.']] }, // [nuovo]
    { id: 'esci', nome: 'Torna al viale', x: 560, y: 130, w: 70, h: 120, uscita: 'villa.viale',
      guarda: [['pensa', 'La porta a vetri, verso il viale.']] }, // [nuovo]
    { id: 'verso-cantiere', nome: 'Il passaggio verso il fondo', x: 0, y: 130, w: 50, h: 120, uscita: 'villa.cantiere',
      guarda: [['pensa', 'Una porticina sul retro, verso il fondo della Villa, dove si ammucchiano le pietre.']] }, // [nuovo]
  ],
});

// =====================================================================================================
// 5. LA FONTANA MUTA (la Madre di Marmo: il confronto e il ricordo di Gaetano)
// =====================================================================================================
AV.quadro({
  id: 'villa.fontana', capitolo: 'villa-comunale', nome: 'La fontana muta',
  fondale: { immagine: 'avventura/villa-fontana',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['albero', { x: 50, y: 250, h: 180, tipo: 'leccio' }],
      ['albero', { x: 590, y: 250, h: 180, tipo: 'leccio' }], ['suolo', { tipo: 'marmo', y: 250 }],
      ['fontana', { x: 320, y: 250, w: 260 }], ['lampione', { x: 130, y: 250, h: 110, acceso: true }],
      ['luce', { x: 320, y: 140, r: 120, colore: '#e7e5e4' }], ['nebbia', { alfa: 0.25 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['se', { visto: 'ricordo-gaetano' },
      [['unaVolta', 'fontana-parla', [['pensa', 'La fontana parla di nuovo: un filo d\'acqua, poi un altro. È il primo rumore vivo che Ferruccio sente da quando si è svegliato.']]]], // [nuovo]
      [['unaVolta', 'fontana-prima', [['pensa', 'La fontana non ha voce. Sopra la vasca, una donna di marmo velata tiene in grembo una conca vuota.']]]]], // [nuovo]
  ],
  punti: [
    { id: 'madre', nome: 'La Madre di Marmo', x: 260, y: 30, w: 120, h: 180, personaggio: 'madre-marmo', posa: 0,
      se: { nonVisto: 'ricordo-gaetano' },
      guarda: [['pensa', 'Una donna velata, di marmo, chinata su una conca vuota. Ha le guance rigate, come se il marmo avesse pianto per anni nello stesso punto.']], // [nuovo]
      usa: [
        ['unaVolta', 'madre-parlato', [
          ['effetto', 'scossa'],
          ['pensa', 'Quando Ferruccio si avvicina, la testa di marmo si gira con un rumore di macina. Schegge bianche gli piovono addosso. Ferruccio indietreggia, le braccia sul viso.'], // [nuovo]
          ['dice', 'madre-marmo', 'Non toccare l\'acqua. È tutto quello che resta di loro.'], // [nuovo]
          ['pensa', 'Le schegge smettono di cadere. La statua non lo vuole schiacciare: vuole che non tocchi.'], // [nuovo]
          ['dice', 'madre-marmo', 'Il Velo me li ha portati in pezzi: l\'ultimo momento di ognuno. Li tengo perché nessuno li butti. Ma rotti come sono, non dicono niente.'], // [nuovo]
          ['dice', 'madre-marmo', 'Se ne trovi i pezzi, mettili nella conca. Prima quello che venne prima.'], // [nuovo]
          ['diario', 'La Madre di Marmo custodisce gli ultimi momenti degli operai morti nel crollo, rotti in pezzi. Non è un mostro: è una tomba che non sa di esserlo.'], // [nuovo]
          ['obiettivo', 'Trovare nella Villa i tre ricordi rotti del crollo e posarli nella conca della Madre, nell\'ordine in cui accaddero.'], // [nuovo]
        ], [
          ['dice', 'madre-marmo', 'Prima quello che venne prima. Poi quello che venne dopo.'], // [nuovo]
        ]],
      ],
      con: {
        'ricordo-centina': [
          ['togli', 'ricordo-centina'], ['segna', 'conca-1'],
          ['pensa', 'Ferruccio posa la scheggia nella conca. Il marmo la beve come acqua. Dall\'alto, da lontano, uno scricchiolio di legno.'], // [nuovo]
          ['dice', 'madre-marmo', 'Il legno che cede. Sì. Questo fu il primo.'], // [nuovo]
        ],
        'ricordo-mani': [
          ['se', { visto: 'conca-1' }, [
            ['togli', 'ricordo-mani'], ['segna', 'conca-2'],
            ['pensa', 'Il guanto affonda nel marmo. Le braccia della statua si piegano, come se reggessero un peso.'], // [nuovo]
            ['dice', 'madre-marmo', 'Mani che tengono. Questo venne dopo il legno.'], // [nuovo]
          ], [
            ['dice', 'madre-marmo', 'Non ancora. Prima quello che venne prima.'], // [nuovo]
          ]],
        ],
        'ricordo-ragazzi': [
          ['se', { visto: 'conca-2' }, [
            ['togli', 'ricordo-ragazzi'], ['segna', 'conca-3'],
            ['pensa', 'Il berretto scivola nella conca. La statua chiude gli occhi.'], // [nuovo]
            ['dice', 'madre-marmo', 'E i ragazzi uscirono. Adesso è intero. Guardalo.'], // [nuovo]
            // --- villa-comunale.ricordo-gaetano (obbligatoria) ---
            ['effetto', 'buio'],
            ['attendi', 600],
            ['pensa', 'Soltanto una breve immagine immobile: Gaetano sorregge una trave mentre alcuni operai si mettono in salvo.'], // [bibbia] (riga 434, senza «Il giocatore vede»)
            ['pensa', 'Si sente la sua voce.'], // [bibbia]
            ['dice', 'gaetano', 'Prima fate uscire i ragazzi!'], // [bibbia]
            ['attendi', 600],
            ['pensa', 'L\'immagine scompare.'], // [bibbia]
            ['effetto', 'luce'],
            ['pensa', 'Ferruccio capisce che suo padre morì cercando di salvare altre persone.'], // [bibbia]
            ['segna', 'ricordo-gaetano'],
            // --- villa-comunale.madre-di-marmo: il guardiano si scioglie ---
            ['effetto', 'anime'],
            ['nascondi', 'madre'],
            ['pensa', 'La Madre di Marmo non cade. Si scioglie in anime colorate che salgono lentamente, una per ogni nome inciso sull\'orlo della vasca.'], // [nuovo] (bibbia 861)
            ['suono', 'acqua'],
            ['pensa', 'Dove stava la conca resta una chiavetta di ferro, calda. E sotto, la fontana riprende a parlare.'], // [nuovo]
            ['prendi', 'chiave-armadio'],
            ['mostra', 'punzone'],
            ['diario', 'Ho visto mio padre sotto la trave. «Prima fate uscire i ragazzi!» Non causò il crollo: morì per tenerlo su.'], // [nuovo]
            ['obiettivo', 'Aprire l\'armadio della casina dei registri con la chiave della Madre.'], // [nuovo]
          ], [
            ['dice', 'madre-marmo', 'Non ancora. Questo venne per ultimo.'], // [nuovo]
          ]],
        ],
        '*': [['dice', 'madre-marmo', 'Questo non è loro.']], // [nuovo]
      } },
    { id: 'nomi', nome: 'I nomi sull\'orlo', x: 200, y: 215, w: 240, h: 32,
      guarda: [
        ['pensa', 'Sull\'orlo della vasca, incisi piccoli: Antonio Cerqua. Salvatore Di Lillo. Vincenzo Russo. Gaetano F. Bianca V.'], // [nuovo]
        ['pensa', 'Accanto al nome di suo padre qualcuno ha raschiato una parola. Il marmo è più chiaro lì, come una cicatrice.'], // [nuovo]
      ] },
    { id: 'vasca', nome: 'La vasca', x: 400, y: 200, w: 110, h: 45, sagoma: 'fontana',
      guarda: [
        ['se', { visto: 'ricordo-gaetano' },
          [['pensa', 'L\'acqua corre e chiacchiera. Sul fondo si vedono le monete dei desideri di sei anni fa.']], // [nuovo]
          [['pensa', 'L\'acqua è ferma come vetro. Sul fondo, qualcosa di ferro che non si riesce a vedere bene.']]], // [nuovo]
      ],
      usa: [
        ['se', { visto: 'ricordo-gaetano' },
          [['pensa', 'Ferruccio si bagna le dita. È fredda, ed è viva.']], // [nuovo]
          [['dice', 'madre-marmo', 'Non toccare l\'acqua.']]], // [nuovo]
      ] },
    { id: 'punzone', nome: 'Un ferro sul fondo', x: 430, y: 225, w: 40, h: 22, sagoma: 'ferro',
      se: { visto: 'ricordo-gaetano', nonVisto: 'punzone-preso' },
      guarda: [['pensa', 'Accanto alla fontana, sul fondo della vasca, un ferro piccolo con il manico di legno. Un punzone da fabbro.']], // [nuovo]
      usa: [
        ['pensa', 'Ferruccio trova il vecchio punzone da fabbro del padre. Lo raccoglie e lo rigira: sul manico sono incise due lettere.'], // [bibbia] (mappa: villa-comunale.punzone)
        ['dice', 'didascalia', 'G. F.'], // [bibbia]
        ['pensa', 'Lo stringe, poi lo infila alla cintura.'], // [bibbia]
        ['prendi', 'ferro-punzone'],
        ['segna', 'punzone-preso'],
        ['nascondi', 'punzone'],
        ['diario', 'Nella fontana della Villa, il punzone di mio padre. G. F. L\'acqua l\'ha tenuto per sei anni.'], // [nuovo]
      ] },
    { id: 'lampione', nome: 'Il lampione', x: 118, y: 140, w: 24, h: 110, sagoma: 'lampione',
      guarda: [['pensa', 'Sotto il lampione, una panchina con un ventaglio dimenticato aperto. Nessuno è venuto a prenderlo.']] }, // [nuovo]
    { id: 'verso-cantiere', nome: 'Il fondo della Villa', x: 580, y: 120, w: 60, h: 125, uscita: 'villa.cantiere',
      guarda: [['pensa', 'Dietro la fontana il giardino finisce in un recinto di pietre squadrate.']] }, // [nuovo]
    { id: 'verso-viale', nome: 'Torna al viale', x: 0, y: 255, w: 140, h: 36, uscita: 'villa.viale',
      guarda: [['pensa', 'Il viale dei lecci, verso il cancello.']] }, // [nuovo]
  ],
});

// =====================================================================================================
// 6. IL CANTIERE E LA LAPIDE (ricordo 1: la centina; il sentiero dell'Acquedotto)
// =====================================================================================================
AV.quadro({
  id: 'villa.cantiere', capitolo: 'villa-comunale', nome: 'Le pietre del cantiere',
  fondale: { immagine: 'avventura/villa-cantiere',
    disegno: [['cielo', { tono: 'notte', luna: true }], ['quinte', { colore: '#1c1917' }],
      ['suolo', { tipo: 'tufo', y: 250 }], ['muro', { x: 380, y: 150, w: 200, h: 100, tono: 'tufo' }],
      ['forma', { punti: [[120, 250], [150, 120], [175, 118], [210, 250]], colore: '#3f3a36', bordo: '#78716c' }],
      ['forma', { punti: [[230, 250], [250, 205], [330, 200], [345, 250]], colore: '#44403c' }],
      ['arco', { x: 560, y: 90, w: 70, h: 160 }], ['nebbia', { alfa: 0.2 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [['unaVolta', 'cantiere-prima', [['pensa', 'Il fondo della Villa. Qui, dopo il crollo, hanno portato le pietre del cantiere, e le hanno lasciate dove le hanno buttate.']]]], // [nuovo]
  punti: [
    { id: 'lapide', nome: 'La lapide del crollo', x: 400, y: 160, w: 90, h: 80, sagoma: 'statua',
      guarda: [
        ['pensa', 'Una lapide storta: «Ai caduti del cantiere, 1839». Sotto, i nomi degli operai.'], // [nuovo]
        ['pensa', 'Il nome di Gaetano non c\'è. Al suo posto la pietra è liscia, come se l\'avessero levigata per dimenticarlo.'], // [nuovo]
      ],
      usa: [['pensa', 'Ferruccio passa il pollice sul punto liscio. Poi ci appoggia la fronte, un momento.']], // [nuovo]
      con: {
        'registro-gaetano': [['pensa', 'Ferruccio apre il registro sulla pietra liscia. Un giorno, forse, qualcuno ci inciderà un nome. Non oggi.']], // [nuovo]
        'ferro-punzone': [['pensa', 'Il punzone sarebbe giusto per incidere due lettere. Ferruccio ci pensa, poi lo rimette alla cintura: non si firma una lapide di nascosto.']], // [nuovo]
      } },
    { id: 'centina', nome: 'La centina spezzata', x: 120, y: 120, w: 90, h: 130,
      guarda: [['pensa', 'Un arco di legno spezzato, grigio come un osso. Fuori verniciato, dentro marcio. Fra le schegge, una luccica appena.']], // [nuovo]
      usa: [
        ['unaVolta', 'centina-presa', [
          ['prendi', 'ricordo-centina'],
          ['pensa', 'Ferruccio stacca la scheggia che luccica. È leggera, e nel palmo scricchiola.'], // [nuovo]
          ['diario', 'Al cantiere, una scheggia della centina che cedette. Dentro c\'è un ricordo: il primo rumore del crollo.'], // [nuovo]
        ], [['pensa', 'Il resto è soltanto legno marcio.']]], // [nuovo]
      ] },
    { id: 'pietre', nome: 'Le pietre squadrate', x: 230, y: 200, w: 115, h: 50, sagoma: 'cassa',
      guarda: [['pensa', 'Pietre squadrate con la marca della Real Casa. Ognuna era destinata a un posto preciso della Reggia. Nessuna ci è mai arrivata.']] }, // [nuovo]
    { id: 'carriola', nome: 'La carriola', x: 40, y: 210, w: 60, h: 40, sagoma: 'cassa',
      guarda: [['pensa', 'Una carriola rovesciata, con la ruota di ferro cerchiata a mano. La cerchiatura è fatta bene. Troppo bene per un fabbro «imperito».']] }, // [nuovo]
    { id: 'sentiero', nome: 'Il sentiero verso gli archi', x: 560, y: 90, w: 70, h: 160, uscita: 'acquedotto.archi',
      guarda: [['pensa', 'Un sentiero scende fra i rovi verso un rumore d\'acqua. L\'unica acqua che si muove, in tutta Caserta.']] }, // [nuovo]
    { id: 'verso-fontana', nome: 'Torna alla fontana', x: 0, y: 255, w: 140, h: 36, uscita: 'villa.fontana',
      guarda: [['pensa', 'La fontana, e la grande figura china.']] }, // [nuovo]
    { id: 'verso-serra', nome: 'La porticina della serra', x: 0, y: 120, w: 36, h: 85, uscita: 'villa.serra',
      guarda: [['pensa', 'La porticina sul retro della serra.']] }, // [nuovo]
  ],
});

// =====================================================================================================
// 7-8. VIA LATERALE: L'ACQUEDOTTO CAROLINO (facoltativa)
// =====================================================================================================
AV.quadro({
  id: 'acquedotto.archi', capitolo: 'villa-comunale', nome: 'Gli archi dell\'Acquedotto',
  fondale: { immagine: 'avventura/acquedotto-archi',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }],
      ['palazzo', { x: 0, y: 40, w: 640, h: 200, archi: 7, finestre: 0 }],
      ['suolo', { tipo: 'erba', y: 250 }], ['forma', { punti: [[0, 236], [640, 228], [640, 246], [0, 252]], colore: '#1e3a5f' }],
      ['luce', { x: 200, y: 240, r: 40, colore: '#93c5fd' }], ['luce', { x: 460, y: 235, r: 40, colore: '#c4b5fd' }],
      ['nebbia', { alfa: 0.15 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [['unaVolta', 'acquedotto-prima', [
    ['pensa', 'Gli archi dell\'acquedotto del re, uno sopra l\'altro, fino a dove l\'occhio non arriva. Qui l\'acqua corre.'], // [nuovo]
    ['diario', 'Dal fondo della Villa si arriva agli archi dell\'Acquedotto. L\'acqua va verso la Reggia, e porta qualcosa.'], // [nuovo]
  ]]],
  punti: [
    { id: 'archi', nome: 'Gli archi', x: 60, y: 40, w: 300, h: 150,
      guarda: [['pensa', 'Tre ordini di archi. Ogni pietra l\'hanno portata uomini come quelli della lapide. Il re la chiamava la sua opera; loro la chiamavano la fatica.']] }, // [nuovo]
    { id: 'canale', nome: 'Il canale', x: 120, y: 225, w: 400, h: 30,
      guarda: [['pensa', 'Nell\'acqua scorrono piccole luci, tutte nella stessa direzione: verso la Reggia. Sono troppe per essere riflessi della luna.']], // [nuovo]
      usa: [
        ['effetto', 'velo'],
        ['pensa', 'Ferruccio immerge la mano. Fra le dita gli passano frammenti di voci: una ninna nanna, il nome di un cane, un conto della spesa sbagliato, una risata.'], // [nuovo]
        ['pensa', 'I ricordi che il Velo ha tolto alla città. L\'acqua li porta via, uno per uno, verso il palazzo.'], // [nuovo]
        ['unaVolta', 'acque-memoria', [['diario', 'Nell\'acqua dell\'Acquedotto scorrono i ricordi rubati alla città. Vanno tutti alla Reggia.']]], // [nuovo]
      ] },
    { id: 'anima', nome: 'Una luce impigliata', x: 300, y: 200, w: 30, h: 30, sagoma: 'anima',
      guarda: [['pensa', 'Una luce rimasta impigliata fra due pietre, che gira su se stessa senza riuscire a ripartire.']], // [nuovo]
      usa: [
        ['unaVolta', 'anima-liberata-acquedotto', [
          ['pensa', 'Ferruccio la libera con un dito. Prima di ripartire, la luce gli gira intorno al polso, una volta, come per ringraziare.'], // [nuovo]
          ['nascondi', 'anima'],
        ]],
      ] },
    { id: 'buio', nome: 'Il condotto buio', x: 520, y: 150, w: 60, h: 80,
      guarda: [['pensa', 'Più giù l\'acqua entra nella montagna. Dal buio arriva un respiro lento e grande, come di pietra che beve. Non è il momento.']] }, // [nuovo]
    { id: 'verso-nicchia', nome: 'La nicchia sotto l\'arco', x: 400, y: 100, w: 70, h: 110, uscita: 'acquedotto.nicchia',
      guarda: [['pensa', 'Sotto uno degli archi bassi, una nicchia chiusa da una grata di ferro.']] }, // [nuovo]
    { id: 'torna', nome: 'Torna alla Villa', x: 0, y: 255, w: 140, h: 36, uscita: 'villa.cantiere',
      guarda: [['pensa', 'Il sentiero che risale verso le pietre del cantiere.']] }, // [nuovo]
  ],
});

AV.quadro({
  id: 'acquedotto.nicchia', capitolo: 'villa-comunale', nome: 'La nicchia della grata',
  fondale: { immagine: 'avventura/acquedotto-nicchia',
    disegno: [['cielo', { tono: 'interno' }], ['muro', { x: 0, y: 20, w: 640, h: 230, tono: 'tufo' }],
      ['arco', { x: 220, y: 60, w: 200, h: 190 }], ['suolo', { tipo: 'tufo', y: 250 }],
      ['forma', { punti: [[0, 250], [640, 244], [640, 262], [0, 268]], colore: '#1e3a5f' }],
      ['luce', { x: 320, y: 160, r: 80, colore: '#93c5fd' }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  punti: [
    { id: 'grata', nome: 'La grata', x: 230, y: 70, w: 180, h: 60, sagoma: 'finestra',
      guarda: [['pensa', 'Una grata a riccioli stretti, battuti in tre colpi. In un angolo, piccole, due lettere: G. F. Questa grata l\'ha fatta suo padre.']], // [nuovo]
      usa: [['pensa', 'Ferruccio stringe le sbarre. Il ferro di suo padre tiene ancora.']] }, // [nuovo]
    { id: 'scatola', nome: 'La scatola di latta', x: 290, y: 150, w: 60, h: 50, sagoma: 'cassa',
      se: { nonVisto: 'messaggio-padre' },
      guarda: [['pensa', 'Dietro la grata, nella nicchia asciutta, una scatola di latta da chiodi. Sul coperchio, graffiato: «Per Ferruccio, quando sarà grande».']], // [nuovo]
      usa: [
        ['pensa', 'La grata ha un chiavistello che si apre solo da chi sa dov\'è. Ferruccio lo sa: suo padre li faceva tutti così. Dentro la scatola, un foglio piegato, asciutto.'], // [nuovo]
        ['dice', 'didascalia', '«Ferruccio, ti lascio questo qui, dove l\'acqua passa e non si ferma, perché tu ci arrivi da grande.'], // [nuovo]
        ['dice', 'didascalia', 'Oggi sei tornato a casa col labbro rotto e volevi andare a ripagarlo. Non ti ho fermato con le mani. Ti ho fatto una domanda: perché te l\'ha fatto? E tu non lo sapevi.'], // [nuovo]
        ['dice', 'didascalia', 'Ricordatelo. Chi vuole la vendetta cerca un colpevole; chi vuole la verità cerca che cosa è successo. A volte è la stessa strada. Spesso no.'], // [nuovo]
        ['dice', 'didascalia', 'Il ferro battuto con la rabbia si spezza al primo freddo. Tuo padre, G. F.»'], // [nuovo] (lettera: la voce è scritta, Gaetano non parla da fantasma, bibbia 412)
        ['pensa', 'Ferruccio legge due volte. Poi rimette il foglio nella scatola e la scatola nella nicchia. È il posto suo.'], // [nuovo]
        ['segna', 'messaggio-padre'],
        ['nascondi', 'scatola'],
        ['diario', 'Nella nicchia dell\'Acquedotto, una lettera di mio padre per me: «Chi vuole la vendetta cerca un colpevole; chi vuole la verità cerca che cosa è successo».'], // [nuovo]
      ] },
    { id: 'nicchia-vuota', nome: 'La nicchia', x: 290, y: 150, w: 60, h: 50, sagoma: 'cassa',
      se: { visto: 'messaggio-padre' },
      guarda: [['pensa', 'La scatola di latta è di nuovo al suo posto. Ferruccio sa che cosa c\'è dentro.']] }, // [nuovo]
    { id: 'acqua', nome: 'L\'acqua', x: 40, y: 240, w: 560, h: 30,
      guarda: [['pensa', 'L\'acqua passa sotto la nicchia senza bagnarla. Suo padre ha scelto bene il posto.']] }, // [nuovo]
    { id: 'segni', nome: 'I segni sul muro', x: 470, y: 90, w: 80, h: 80,
      guarda: [['pensa', 'Tacche di gesso sul tufo, a gruppi di cinque: i giorni di lavoro di una squadra. L\'ultima fila si interrompe a metà.']] }, // [nuovo]
    { id: 'torna', nome: 'Torna agli archi', x: 0, y: 100, w: 50, h: 140, uscita: 'acquedotto.archi',
      guarda: [['pensa', 'Gli archi, e il rumore dell\'acqua.']] }, // [nuovo]
  ],
});

/*
 * IMMAGINI DA FAR DISEGNARE (gioco/assets/avventura/, 640×360, teatro d'ombre in vista 3/4, fascia bassa y ≥ 300 scura
 * e vuota per l'interfaccia; nessuna figura dipinta nel fondale: personaggi e punti sensibili li mette il motore):
 *  - avventura/villa-cancello.png    Cancello di ferro battuto socchiuso fra due pilastri, siepi, un leccio a sinistra e una
 *                                     palma a destra, lampione acceso, garitta vuota; luna ferma.
 *  - avventura/villa-viale.png       Viale di lecci in prospettiva verso la fontana; a sinistra il cavaliere di marmo in
 *                                     ginocchio davanti a un giglio, a destra l'uomo in divisa e la bambina di marmo; panchina
 *                                     al centro; a destra la casina con la finestra accesa.
 *  - avventura/villa-casina.png      Interno dell'archivio: scaffali di registri fino al soffitto, leggio, tavolo con lanterna
 *                                     accesa, armadio di noce con serratura di ferro, attrezzi da giardiniere nell'angolo.
 *  - avventura/villa-serra.png       Serra di ferro e vetri appannati, limoni secchi in vasi di terracotta, il limone grande al
 *                                     centro con un guanto nero appeso in alto; foschia fredda del Velo.
 *  - avventura/villa-fontana.png     Fontana a vasca larga, acqua ferma come vetro, nomi incisi sull'orlo; lecci ai lati;
 *                                     al centro lo spazio vuoto per la Madre di Marmo (figura a parte, foglio custode-marmo).
 *  - avventura/villa-cantiere.png    Fondo della Villa: pietre squadrate ammucchiate, centina di legno spezzata, carriola
 *                                     rovesciata, lapide storta su un muro di tufo; a destra un varco fra i rovi.
 *  - avventura/acquedotto-archi.png  Gli archi dell'Acquedotto Carolino su tre ordini, canale d'acqua in basso con piccole luci
 *                                     colorate che scorrono; a destra un condotto che entra nel buio.
 *  - avventura/acquedotto-nicchia.png Volta di tufo sotto un arco basso, nicchia chiusa da una grata a riccioli con le lettere
 *                                     G. F., acqua che passa sotto, tacche di gesso sul muro.
 */
