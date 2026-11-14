/*
 * storia/50-reggia.js — Capitolo 5: la Reggia di Caserta. Gregorio il Custode, Donna Luciana, Bianca, il bivio.
 * Solo dati (contratto in ../LEGGIMI.md). Fonti: trama/ferruccio-bibbia.md §VII (466-557), §VIII (558-655),
 * §XI (823-848), §XVI Scene 1-2 (1058-1129), §III atti III-IV, §XIV; scene `reggia.*` di trama/storia.json.
 * Le battute della bibbia sono marcate // [bibbia]; quelle scritte per l'avventura // [nuovo].
 *
 * MAPPA DEL CAPITOLO
 *
 *   [leucio.arrivo] <-- reggia.cancello (viale, statua del cavaliere, garitta col registro delle guardie)
 *                          |  enigma 1: il registro dice quale chiave apre la porticina (quella col giglio)
 *                          v
 *                     reggia.scalone (leoni, stemma coi gigli, ritratto di famiglia) --- portone del Cortile
 *                     /        |         \                                  («Oltre questa porta non si torna»,
 *     reggia.fili         reggia.bianca     reggia.cappella                  serve la scatola musicale)
 *     enigma 2 (facolt.): stanza di Bianca  memoria del funerale,                   |
 *     i quattro frammenti enigma 3: la       la chiavetta fra i gigli secchi         v
 *     di seta in ordine;  scatola muta  <--  ------------------------------->  reggia.cortile
 *     memoria del                                                              5ª decisione (gregorio),
 *     tradimento                                                               confronto in 3 passi, morte
 *                                                                                    |
 *                                                                                    v
 *                                                                              reggia.ultima (Cortile, dopo)
 *                                                                              Donna Luciana: rivelazione,
 *                                                                              scatola, ultima conversazione,
 *                                                                              6ª decisione (violante)
 *                                                                              → epilogo.libera / epilogo.velata
 *
 * Scene di storia.json coperte: memoria-funerale-bianca (cappella), memoria-tradimento-marito (fili, recuperata da
 * Luciana se persa), progressione-del-velo (fili, recuperata), scelta-gregorio / attacco-senza-prove,
 * confronto-dialogo / confronto-attacco, scontro-custode, morte-del-custode, custode-sconfitto (cortile → ultima),
 * nucleo-del-velo, scatola-musicale, ultima-conversazione, scelta-violante. velo-ricucito e velo-spezzato sono dei
 * finali (90-finali.js).
 */

AV.capitolo({ id: 'reggia', titolo: 'La Reggia di Caserta', ordine: 5, sottotitolo: 'Il Custode e la Signora' });

// --- Oggetti del capitolo ---
AV.oggetto({
  id: 'chiave-giglio', nome: 'La chiave col giglio', icona: { sagoma: 'chiave' },
  descrizione: 'Una chiave della garitta, con un giglio sull\'impugnatura. Apre la porticina del cancello. E forse altro.',
  guarda: [['pensa', 'Il giglio dell\'impugnatura è consumato dalle dita. Chi l\'ha usata, l\'ha usata ogni notte.']], // [nuovo]
});
AV.oggetto({
  id: 'frammenti-di-seta', nome: 'I quattro frammenti di seta', icona: { sagoma: 'foglio' },
  descrizione: 'Quattro ritagli di seta di San Leucio, con quattro cartellini scritti dalla stessa mano.',
  guarda: [
    ['pensa', 'Alleviare il dolore. Cancellare il dolore. Impedire nuovi dolori. Eliminare la libertà.'], // [nuovo] (bibbia §VIII, la progressione)
    ['pensa', 'Quattro passi. Nessuno, da solo, sembra il passo di un mostro.'], // [nuovo]
  ],
});
AV.oggetto({
  id: 'chiavetta-scatola', nome: 'La chiavetta d\'ottone', icona: { sagoma: 'chiave' },
  descrizione: 'Una chiavetta da carica, piccola come un dito di bambina. Era in mezzo ai gigli secchi dell\'altare.',
});
AV.oggetto({
  id: 'scatola-musicale', nome: 'La scatola musicale di Bianca', icona: { sagoma: 'cassa' },
  descrizione: 'Una scatola di legno chiaro. Sul coperchio, una bambina intagliata regge un giglio.',
  guarda: [['pensa', 'La melodia è la stessa che si sente, debolmente, vicino alle statue. Ora Ferruccio sa da dove viene.']], // [nuovo] (bibbia §XI)
});

// --- Il confronto col Custode e la sua morte (le stesse azioni servono da due punti) ---
const R5_MORTE_CUSTODE = [
  ['effetto', 'lampo'],
  ['dice', 'didascalia', 'Al termine dello scontro, l\'armatura si spezza. Gregorio cade sulle ginocchia.'], // [bibbia]
  ['posa', 'gregorio', 6],
  ['suono', 'metallo'],
  ['dice', 'didascalia', 'L\'alabarda tocca il pavimento con un rumore metallico.'], // [bibbia]
  ['dice', 'didascalia', 'Il giglio sul suo petto si incrina, poi si spezza.'], // [bibbia]
  ['dice', 'didascalia', 'Dall\'armatura esce una piccola luce azzurra.'], // [bibbia]
  ['pensa', 'Per la prima volta, dietro l\'elmo, un volto umano.'], // [bibbia] adattata: «Il giocatore vede per la prima volta un volto umano dietro l'elmo.»
  ['dice', 'gregorio', 'Non era un ordine del Re...'], // [bibbia]
  ['dice', 'gregorio', 'Era una promessa fatta a mia moglie.'], // [bibbia]
  ['se', { flag: { gregorio: 'dialogo' } },
    [['dice', 'gregorio', 'Tuo padre era innocente.']], // [bibbia]
    [['dice', 'gregorio', 'Anche io avevo paura di perderla.']]], // [bibbia]
  ['dice', 'gregorio', 'Ho protetto la porta per tutta la vita...'], // [bibbia]
  ['dice', 'gregorio', 'E non ho visto cosa entrava.'], // [bibbia]
  ['dice', 'didascalia', 'Ferruccio si avvicina.'], // [bibbia]
  ['dice', 'didascalia', 'Gregorio tende una mano verso il balcone.'], // [bibbia]
  ['dice', 'gregorio', 'Lei... crede ancora di poterla salvare.'], // [bibbia]
  ['dice', 'didascalia', 'Il Custode muore.'], // [bibbia]
  ['effetto', 'anime'],
  ['dice', 'didascalia', 'Gregorio muore e la sua anima sale lentamente verso il balcone.'], // [bibbia]
  ['dice', 'didascalia', 'Ferruccio solleva lo sguardo.'], // [bibbia]
  ['segna', 'custode-morto'],
  ['diario', 'Gregorio è morto nel Cortile d\'Onore. Non era un ordine del Re: era una promessa fatta a sua moglie.'], // [nuovo]
  ['se', { flag: { gregorio: 'dialogo' } },
    [['diario', 'Prima di morire ha detto che mio padre era innocente.']], // [nuovo]
    [['diario', 'Prima di morire ha detto che anche lui aveva paura di perderla. Non ho saputo quanto fosse ancora lui.']]], // [nuovo]
  ['attendi', 800],
  ['vai', 'reggia.ultima'],
];

// --- 1. Il viale e il cancello ---
AV.quadro({
  id: 'reggia.cancello', capitolo: 'reggia', nome: 'Il viale della Reggia',
  fondale: {
    immagine: 'avventura/reggia-cancello',
    disegno: [
      ['cielo', { tono: 'notte', luna: true, stelle: true }],
      ['palazzo', { x: 150, y: 70, w: 340, h: 120, archi: 5, finestre: 9 }],
      ['albero', { x: 40, y: 250, h: 150, tipo: 'leccio' }], ['albero', { x: 600, y: 250, h: 150, tipo: 'leccio' }],
      ['suolo', { tipo: 'selciato', y: 250 }],
      ['muro', { x: 0, y: 200, w: 640, h: 50, tono: 'scuro' }],
      ['porta', { x: 280, y: 160, w: 80, h: 90, stato: 'chiusa' }],
      ['statua', { x: 110, y: 250, h: 70 }],
      ['muro', { x: 470, y: 180, w: 60, h: 70, tono: 'pietra' }],
      ['lampione', { x: 420, y: 250, h: 90, acceso: true }],
      ['luce', { x: 420, y: 165, r: 60, colore: '#f6c76b' }],
      ['nebbia', { alfa: 0.15 }],
    ],
    luce: { tono: 'notte' },
  },
  musica: 'reggia',
  entrata: [
    ['unaVolta', 'cap-reggia', [
      ['capitolo', 'reggia'],
      ['pensa', 'Il viale è lungo e dritto come una lama. In fondo, la Reggia: mille finestre, una sola accesa.'], // [nuovo]
      ['diario', 'Sono arrivato alla Reggia. Tutti i fili d\'oro della città corrono qui.'], // [nuovo]
      ['se', { flag: { agnese: 'risvegliata' } },
        [['diario', 'Agnese mi ha chiesto di cercare la verità, non un colpevole. Ci provo.']], // [nuovo] (bibbia §III, atto III)
        [['diario', 'Qualcuno, qui dentro, deve pagare. Lo cerco.']]], // [nuovo] (bibbia §III, atto III)
      ['obiettivo', 'Entra nella Reggia. Il cancello è chiuso.'], // [nuovo]
      // le strade di fuori (60-vie-laterali.js): il tradimento compiuto da Taddeo sul sagrato si vede qui
      ['se', { visto: 'taddeo-tradimento-compiuto' }, [['pensa', 'Sul pilastro del cancello, un foglio fresco di colla: «Si cerca un burattino che cammina sveglio. Risponde al nome di Ferruccio.» Il nome venduto sul sagrato di Casertavecchia è arrivato prima di lui.']]], // [nuovo]
    ]],
  ],
  punti: [
    {
      id: 'cancello', nome: 'Il cancello', x: 270, y: 150, w: 100, h: 100, sagoma: 'porta',
      guarda: [['pensa', 'Ferro battuto, gigli in cima a ogni sbarra. Accanto, una porticina con la serratura.']], // [nuovo]
      usa: [['se', { visto: 'reggia-porticina' }, [['vai', 'reggia.scalone']],
        [['pensa', 'La porticina è chiusa a chiave. La guardia sorride e non si muove.']]]], // [nuovo]
      con: {
        'chiave-giglio': [
          ['suono', 'serratura'],
          ['pensa', 'La chiave col giglio gira due volte. La porticina si apre senza un cigolio: qualcuno la tiene unta.'], // [nuovo]
          ['segna', 'reggia-porticina'],
          ['diario', 'Sono entrato con la chiave col giglio. Le guardie hanno l\'ordine di non darla a nessuno.'], // [nuovo]
          ['obiettivo', 'Cerca nella Reggia chi tiene i fili.'], // [nuovo]
          ['vai', 'reggia.scalone'],
        ],
        '*': [['pensa', 'Non entra nella serratura.']], // [nuovo]
      },
    },
    {
      id: 'guardia', nome: 'La guardia', x: 380, y: 170, w: 36, h: 80, personaggio: 'guardia', posa: 0,
      guarda: [['pensa', 'Un ragazzo in divisa, l\'alabarda dritta. Sorride al viale vuoto.']], // [nuovo]
      usa: [
        ['dice', 'guardia', 'Tutto a posto, signo\'. Tutto a posto. La Signora veglia.'], // [nuovo]
        ['se', { flag: { volto: 'umano' } },
          [['pensa', 'La guardia guarda il volto di Ferruccio. Per un istante abbassa lo sguardo, come chi ricorda di dover ricordare qualcosa.']], // [nuovo]
          [['pensa', 'La guardia guarda la maschera nera di Ferruccio e non vede niente di strano. Nel Velo, niente è strano.']]], // [nuovo]
      ],
      con: { '*': [['dice', 'guardia', 'Bello, bello. Tutto a posto.']] }, // [nuovo]
    },
    {
      id: 'garitta', nome: 'La garitta', x: 470, y: 180, w: 60, h: 70, sagoma: 'porta',
      guarda: [['pensa', 'Dentro la garitta, un registro aperto e un chiodo con un mazzo di chiavi.']], // [nuovo]
      usa: [
        ['dice', 'didascalia', 'Registro delle guardie. L\'ultima pagina scritta è di sei anni fa.'], // [nuovo]
        ['dice', 'didascalia', '«Dal giorno del funerale il Custode non dorme e non mangia. Non parla. Gli ordini scendono dal piano nobile, scritti dalla mano della Signora.»'], // [nuovo]
        ['dice', 'didascalia', '«La chiave col giglio apre la porticina. Quella con la corona non si dà a nessuno: è del Re, e il Re non viene più.»'], // [nuovo]
        ['segna', 'registro-guardie-letto'],
        ['unaVolta', 'diario-registro-guardie', [['diario', 'Il registro delle guardie: gli ordini al Custode li scriveva la Signora, non il Re.']]], // [nuovo]
      ],
    },
    {
      id: 'chiavi-chiodo', nome: 'Il mazzo di chiavi', x: 500, y: 196, w: 20, h: 22, sagoma: 'chiave', se: { nonHa: 'chiave-giglio' },
      guarda: [['pensa', 'Quattro chiavi: una con la corona, una col giglio, due lisce.']], // [nuovo]
      usa: [['se', { visto: 'registro-guardie-letto' },
        [['pensa', 'Ferruccio stacca dal mazzo la chiave col giglio. La guardia continua a sorridere.'], ['prendi', 'chiave-giglio'], ['nascondi', 'chiavi-chiodo']], // [nuovo]
        [['pensa', 'Quattro chiavi, e una sola serratura. Prima di provarle tutte sotto gli occhi della guardia, meglio capire quale.']]]], // [nuovo]
    },
    {
      id: 'statua', nome: 'Il cavaliere inginocchiato', x: 90, y: 180, w: 44, h: 70, sagoma: 'statua',
      guarda: [
        ['pensa', 'Un cavaliere inginocchiato davanti a un giglio. Sulla base è inciso:'], // [bibbia] adattata
        ['dice', 'didascalia', '«Non tutte le catene fanno rumore.»'], // [bibbia]
      ],
      usa: [
        ['pensa', 'La pietra è fredda. Il cavaliere ha le mani legate al giglio, ma le corde sono scolpite così sottili che sembrano oro.'], // [nuovo]
        ['unaVolta', 'diario-cavaliere', [['diario', '«Non tutte le catene fanno rumore.» Il cavaliere davanti al giglio, anche qui.']]], // [nuovo]
      ],
    },
    {
      id: 'reggia-lontana', nome: 'La facciata', x: 160, y: 70, w: 320, h: 70,
      guarda: [['pensa', 'Una sola finestra accesa, al piano nobile. I fili d\'oro della città ci entrano tutti, come in una cruna.']], // [nuovo]
    },
    {
      id: 'verso-leucio', nome: 'Il viale verso San Leucio', x: 0, y: 120, w: 34, h: 130,
      guarda: [['pensa', 'Dietro, la strada per San Leucio. Si può ancora tornare indietro.']], // [nuovo]
      uscita: 'leucio.belvedere',
      usa: [['segna', 'reggia-verso-leucio'], ['pensa', 'Ferruccio si volta verso San Leucio.']], // [nuovo]
    },
  ],
});

// --- 2. Lo Scalone reale ---
AV.quadro({
  id: 'reggia.scalone', capitolo: 'reggia', nome: 'Lo Scalone reale',
  fondale: {
    immagine: 'avventura/reggia-scalone',
    disegno: [
      ['cielo', { tono: 'interno' }],
      ['suolo', { tipo: 'marmo', y: 255 }],
      ['scala', { x: 220, y: 110, w: 200, h: 145 }],
      ['colonna', { x: 150, y: 255, h: 200 }], ['colonna', { x: 490, y: 255, h: 200 }],
      ['statua', { x: 200, y: 255, h: 50 }], ['statua', { x: 440, y: 255, h: 50 }],
      ['porta', { x: 30, y: 160, w: 60, h: 95, stato: 'socchiusa' }],
      ['porta', { x: 550, y: 160, w: 60, h: 95, stato: 'socchiusa' }],
      ['porta', { x: 280, y: 40, w: 80, h: 70, stato: 'socchiusa' }],
      ['luce', { x: 320, y: 60, r: 90, colore: '#f6c76b' }],
      ['fili', { n: 5 }],
    ],
    luce: { tono: 'interno' },
  },
  musica: 'reggia',
  entrata: [
    ['unaVolta', 'reggia-scalone-prima', [
      ['pensa', 'Lo Scalone sale nel buio. I fili d\'oro scendono dall\'alto e si perdono nelle stanze, come radici.'], // [nuovo]
      ['obiettivo', 'Esplora la Reggia: le stanze dei fili, la Cappella, la stanza in cima allo Scalone.'], // [nuovo]
    ]],
  ],
  punti: [
    {
      id: 'leoni', nome: 'I leoni di marmo', x: 180, y: 200, w: 44, h: 55, sagoma: 'statua',
      guarda: [['pensa', 'Due leoni. Uno ruggisce, l\'altro dorme. Qualcuno ha appeso al collo di quello che dorme un nastrino di seta.']], // [nuovo]
      usa: [['pensa', 'Il nastrino è caldo come una mano. Ferruccio lo lascia dov\'è.']], // [nuovo]
    },
    {
      id: 'stemma', nome: 'Lo stemma reale', x: 290, y: 116, w: 60, h: 40,
      guarda: [['pensa', 'Lo stemma del Re, coi suoi gigli. Ma uno dei gigli non è dipinto: è d\'oro vero, e manda una luce che non viene da nessuna lanterna.']], // [nuovo]
      usa: [
        ['pensa', 'Ferruccio sfiora il giglio d\'oro. Un filo sottile ne esce e corre giù, verso il Cortile d\'Onore.'], // [nuovo]
        ['unaVolta', 'diario-stemma', [['diario', 'Il giglio torna dappertutto: sulla statua, sulle stoffe di San Leucio, sullo stemma. Un filo lo lega al Cortile.']]], // [nuovo]
      ],
    },
    {
      id: 'ritratto', nome: 'Il ritratto di famiglia', x: 100, y: 60, w: 70, h: 80,
      guarda: [
        ['pensa', 'Un ufficiale col mantello rosso, una donna gentile, una bambina in mezzo che ride a bocca aperta.'], // [nuovo]
        ['pensa', 'Sul petto dell\'ufficiale, un giglio d\'oro dipinto dopo: la vernice è più fresca del resto.'], // [nuovo]
      ],
      usa: [
        ['dice', 'didascalia', 'Sulla cornice, una targhetta: «Il Custode Gregorio, Donna Luciana e la piccola Bianca.»'], // [nuovo]
        ['pensa', 'Il Custode ha una moglie. E una figlia.'], // [nuovo]
        ['segna', 'ritratto-visto'],
        ['unaVolta', 'diario-ritratto', [['diario', 'Il Custode si chiama Gregorio. Sua moglie è Donna Luciana. La bambina del ritratto si chiamava Bianca.']]], // [nuovo]
      ],
    },
    { id: 'verso-fili', nome: 'Le stanze dei fili', x: 30, y: 160, w: 60, h: 95, uscita: 'reggia.fili',
      guarda: [['pensa', 'Da questa porta viene un fruscio di telai, senza nessuno che tessa.']] }, // [nuovo]
    { id: 'verso-cappella', nome: 'La Cappella Palatina', x: 550, y: 160, w: 60, h: 95, uscita: 'reggia.cappella',
      guarda: [['pensa', 'Odore di cera fredda e di fiori secchi.']] }, // [nuovo]
    { id: 'verso-bianca', nome: 'In cima allo Scalone', x: 280, y: 40, w: 80, h: 70, uscita: 'reggia.bianca',
      guarda: [['pensa', 'Una porta bassa, dipinta di bianco. Ha la maniglia all\'altezza di una bambina.']] }, // [nuovo]
    {
      id: 'portone-cortile', nome: 'Il portone del Cortile d\'Onore', x: 280, y: 200, w: 80, h: 55, sagoma: 'porta',
      guarda: [['pensa', 'Dietro il portone, passi di ferro. Regolari, sempre uguali, avanti e indietro.']], // [nuovo]
      usa: [['se', { ha: 'scatola-musicale' },
        [
          ['pensa', 'Oltre questa porta non si torna.'], // [nuovo]
          ['se', { uno: [{ ha: 'ferro-tenaglie' }, { ha: 'ferro-punzone' }, { ha: 'ferro-ago' }], non: { ha: ['ferro-tenaglie', 'ferro-punzone', 'ferro-ago'] } }, [
            ['pensa', 'I ferri di mio padre pesano nella giubba. Di là non potrò più cercare quelli che mancano.'], // [nuovo]
            ['se', { nonHa: 'ferro-tenaglie' }, [['pensa', 'Mancano le tenaglie: battevano sul Corso, dietro il muro che suona vuoto.']]], // [nuovo]
            ['se', { nonHa: 'ferro-punzone' }, [['pensa', 'Manca il punzone: batteva alla Villa, nell\'acqua della fontana.']]], // [nuovo]
            ['se', { nonHa: 'ferro-ago' }, [['pensa', 'Manca l\'ago: batteva a San Leucio, sul telaio.']]], // [nuovo]
          ]],
          ['scelta', [
            { testo: 'Apri il portone', fai: [['segna', 'reggia-cortile-aperto'], ['vai', 'reggia.cortile']] }, // [nuovo]
            { testo: 'Non ancora', fai: [['pensa', 'Ferruccio ritira la mano. I passi di ferro continuano.']] }, // [nuovo]
          ]],
        ],
        [
          ['pensa', 'Ferruccio appoggia la mano al portone, poi si ferma. In cima allo Scalone c\'è una stanza che lo chiama, come una canzone che non si sente.'], // [nuovo]
          ['obiettivo', 'Prima del Cortile, sali in cima allo Scalone: la stanza bianca.'], // [nuovo]
        ]]],
    },
    { id: 'verso-viale', nome: 'Il viale', x: 600, y: 260, w: 40, h: 30, uscita: 'reggia.cancello',
      guarda: [['pensa', 'Il viale, e dietro la strada per San Leucio.']] }, // [nuovo]
  ],
});

// --- 3. Le stanze dei fili: la seta di San Leucio diventa il Velo ---
const R5_FRAMMENTO = (n, x, data, testo, prima) => ({
  id: `frammento-${n}`, nome: `Il frammento ${['', 'primo', 'secondo', 'terzo', 'quarto'][n]}`,
  x, y: 200, w: 44, h: 30, sagoma: 'foglio', se: { nonVisto: `seta-${n}` },
  guarda: [['dice', 'didascalia', `Un ritaglio di seta. Il cartellino dice: «${data}. ${testo}»`]], // [nuovo]
  usa: [['se', prima ? { visto: `seta-${n - 1}` } : {},
    [['pensa', 'Ferruccio infila il ritaglio sul telaio, dopo gli altri. Il telaio lo prende e lo tesse da solo.'], ['segna', `seta-${n}`], ['nascondi', `frammento-${n}`]], // [nuovo]
    [['pensa', 'Non ancora: la data è più tarda. Prima viene un altro ritaglio.']]]], // [nuovo]
});

AV.quadro({
  id: 'reggia.fili', capitolo: 'reggia', nome: 'Le stanze dei fili',
  fondale: {
    immagine: 'avventura/reggia-fili',
    disegno: [
      ['cielo', { tono: 'interno' }],
      ['suolo', { tipo: 'assi', y: 250 }],
      ['muro', { x: 0, y: 30, w: 640, h: 220, tono: 'scuro' }],
      ['telaio', { x: 440, y: 120, w: 140, h: 130 }],
      ['telaio', { x: 40, y: 150, w: 90, h: 100 }],
      ['banco', { x: 140, y: 235, w: 300 }],
      ['finestra', { x: 280, y: 60, w: 60, h: 80, accesa: false }],
      ['fili', { n: 9 }],
      ['luce', { x: 510, y: 160, r: 70, colore: '#e8c35a' }],
      ['nebbia', { alfa: 0.2 }],
    ],
    luce: { tono: 'interno' },
  },
  musica: 'fili',
  entrata: [
    ['unaVolta', 'reggia-fili-prima', [
      ['effetto', 'velo'],
      ['pensa', 'Telai senza tessitrici. Le navette vanno e vengono da sole, e il filo che ne esce è d\'oro.'], // [nuovo]
      ['pensa', 'Sul banco, quattro ritagli di seta con un cartellino ciascuno. Il telaio grande sembra aspettarli.'], // [nuovo]
    ]],
  ],
  punti: [
    R5_FRAMMENTO(3, 150, '1843', 'Per la via dei Tessitori: niente gelosie, niente liti, niente voglie. Così nessuno soffre.', true),
    R5_FRAMMENTO(1, 220, '1839', 'Per Concetta, che non dorme da quando le è morto il marito. Una notte sola di riposo.', false),
    R5_FRAMMENTO(4, 290, '1845', 'Per tutti. Per sempre. Non serve più chiedere a nessuno.', true),
    R5_FRAMMENTO(2, 360, '1841', 'Per i Ruggiero, che non si danno pace per il figlio. Che non lo ricordino. È meglio così.', true),
    {
      id: 'telaio-grande', nome: 'Il telaio grande', x: 440, y: 120, w: 140, h: 130, sagoma: 'telaio',
      guarda: [
        ['pensa', 'La stoffa che esce dal telaio ha lo stesso giglio delle stoffe di San Leucio. Lo stesso, punto per punto.'], // [nuovo] (bibbia §VII)
        ['se', { visto: 'progressione-vista' }, [['pensa', 'Ora il giglio è intero, e i fili che ne partono escono dalla finestra verso la città.']]], // [nuovo]
      ],
      usa: [['se', { visto: ['seta-1', 'seta-2', 'seta-3', 'seta-4'] },
        [['unaVolta', 'progressione-vista', [
          ['effetto', 'luce'],
          ['pensa', 'I quattro ritagli diventano una sola tela. Prima un fazzoletto per dormire una notte. Poi un oblio. Poi una briglia. Poi il Velo.'], // [nuovo] (bibbia §VIII, la progressione morale)
          ['pensa', 'Ferruccio stacca dal telaio i cartellini e se li mette in tasca.'], // [nuovo]
          ['prendi', 'frammenti-di-seta'],
          ['diario', 'Le stanze dei fili: Donna Luciana ha cominciato aiutando una vedova a dormire. Ha finito togliendo a tutti la libertà. Anno dopo anno, un passo alla volta.'], // [nuovo]
        ], [['pensa', 'Il telaio tesse da solo. Non ha più bisogno di nessuno.']]]], // [nuovo]
        [['pensa', 'Il telaio aspetta i ritagli del banco. In che ordine? I cartellini hanno una data.']]]], // [nuovo]
    },
    {
      id: 'telaio-bruciato', nome: 'Il telaio bruciato', x: 40, y: 150, w: 90, h: 100, sagoma: 'telaio',
      guarda: [['pensa', 'Un telaio più vecchio, annerito, spaccato da un colpo di lama. Dentro, un brandello di seta che ancora luccica.']], // [nuovo]
      usa: [['unaVolta', 'memoria-tradimento', [
        ['effetto', 'velo'],
        ['pensa', 'Ferruccio tocca il brandello. La stanza si ferma, e torna com\'era sei anni fa.'], // [nuovo]
        ['dice', 'didascalia', 'Quando Gregorio scopre il progetto, le chiede di fermarsi.'], // [bibbia]
        ['dice', 'gregorio', 'Bianca non avrebbe voluto questo.'], // [bibbia]
        ['dice', 'violante', 'Bianca non vuole più niente.'], // [bibbia]
        ['dice', 'didascalia', 'Gregorio rimane in silenzio.'], // [bibbia]
        ['dice', 'violante', 'E non permetterò che un\'altra madre debba pronunciare quelle parole.'], // [bibbia]
        ['dice', 'didascalia', 'Quando Gregorio tenta di distruggere il primo nucleo del Velo, Donna Luciana lo lega al giglio d\'oro.'], // [bibbia] (a schermo: Donna Luciana)
        ['effetto', 'lampo'],
        ['pensa', 'Ferruccio stringe l\'elsa della spada. Il giglio è inciso dappertutto, in questa Reggia.'], // [nuovo] (storia.json)
        ['diario', 'Il Custode ha provato a fermarla. Lei lo ha legato al giglio d\'oro: da allora ogni suo passo è un ordine di lei.'], // [nuovo]
      ], [['pensa', 'Il brandello è spento, ora. È solo seta bruciata.']]]], // [nuovo]
    },
    {
      id: 'navette', nome: 'Le navette', x: 450, y: 60, w: 120, h: 50,
      guarda: [['pensa', 'Vanno e vengono, vanno e vengono. Il rumore è quello di un respiro.']], // [nuovo]
    },
    {
      id: 'finestra-fili', nome: 'La finestra', x: 280, y: 60, w: 60, h: 80, sagoma: 'finestra',
      guarda: [['pensa', 'I fili escono di qui, sopra i tetti, verso San Leucio, Piazza Dante, il Corso. Tutta Caserta è cucita a questa stanza.']], // [nuovo]
    },
    { id: 'torna-scalone', nome: 'Lo Scalone', x: 590, y: 200, w: 50, h: 90, uscita: 'reggia.scalone',
      guarda: [['pensa', 'Di là, lo Scalone.']] }, // [nuovo]
  ],
});

// --- 4. La stanza di Bianca ---
AV.quadro({
  id: 'reggia.bianca', capitolo: 'reggia', nome: 'La stanza di Bianca',
  fondale: {
    immagine: 'avventura/reggia-bianca',
    disegno: [
      ['cielo', { tono: 'interno' }],
      ['suolo', { tipo: 'assi', y: 250 }],
      ['muro', { x: 0, y: 30, w: 640, h: 220, tono: 'chiaro' }],
      ['finestra', { x: 470, y: 70, w: 80, h: 100, accesa: false }],
      ['tenda', { x: 460, y: 60, w: 100, h: 120, colore: '#e9e1d0' }],
      ['forma', { punti: [[80, 250], [80, 200], [230, 200], [230, 250]], colore: '#2a2420', bordo: '#6b5a48' }],
      ['banco', { x: 300, y: 240, w: 110 }],
      ['luce', { x: 350, y: 200, r: 50, colore: '#f6e3a8' }],
    ],
    luce: { tono: 'interno' },
  },
  musica: 'bianca',
  entrata: [
    ['unaVolta', 'reggia-bianca-prima', [
      ['pensa', 'Una stanza piccola, pulita come se la bambina fosse uscita un minuto fa. Nessuno ci dorme da sei anni.'], // [nuovo]
    ]],
  ],
  punti: [
    {
      id: 'lettino', nome: 'Il lettino', x: 80, y: 196, w: 150, h: 54,
      guarda: [['pensa', 'Le coperte sono rimboccate. Sul cuscino, l\'impronta di una testa piccola che qualcuno non ha voluto spianare.']], // [nuovo]
      usa: [['pensa', 'Ferruccio non lo tocca.']], // [nuovo]
    },
    {
      id: 'scatola', nome: 'La scatola musicale', x: 330, y: 214, w: 40, h: 26, sagoma: 'cassa', se: { nonHa: 'scatola-musicale' },
      guarda: [['pensa', 'Una scatola musicale. Sul coperchio, una bambina di legno regge un giglio. Il buco della carica è vuoto.']], // [nuovo]
      usa: [['pensa', 'Ferruccio solleva il coperchio. Il rullo non gira: è muta. Manca la chiavetta per caricarla.'], // [nuovo]
        ['obiettivo', 'La scatola di Bianca è muta: trova la chiavetta per caricarla.']], // [nuovo]
      con: {
        'chiavetta-scatola': [
          ['pensa', 'La chiavetta entra. Tre giri. Il rullo comincia a girare.'], // [nuovo]
          ['suono', 'carillon'],
          ['dice', 'didascalia', 'La melodia è la stessa che si sente, debolmente, durante tutti gli incontri con le statue.'], // [bibbia] adattata
          ['pensa', 'Ferruccio resta immobile finché la musica finisce. Poi chiude il coperchio e porta la scatola con sé.'], // [nuovo]
          ['togli', 'chiavetta-scatola'],
          ['prendi', 'scatola-musicale'],
          ['nascondi', 'scatola'],
          ['diario', 'Nella stanza di Bianca ho trovato la sua scatola musicale. Suona la canzone delle statue.'], // [nuovo]
          ['obiettivo', 'Scendi nel Cortile d\'Onore. Oltre il portone non si torna.'], // [nuovo]
        ],
        '*': [['pensa', 'Non entra nel buco della carica.']], // [nuovo]
      },
    },
    {
      id: 'quaderno', nome: 'Il quaderno', x: 300, y: 222, w: 26, h: 18, sagoma: 'libro',
      guarda: [['pensa', 'Un quaderno di righe storte, a matita.']], // [nuovo]
      usa: [
        ['dice', 'didascalia', '«Mamma mi ha regalato la scatola che suona. Prometto che imparo la canzone tutta intera.»'], // [nuovo]
        ['pensa', 'Le pagine dopo sono bianche.'], // [nuovo]
      ],
    },
    {
      id: 'disegno', nome: 'Il disegno sul muro', x: 150, y: 70, w: 80, h: 60,
      guarda: [['pensa', 'A carboncino, ad altezza di bambina: un uomo grande col mantello rosso, una donna, una bambina in mezzo. Si tengono per mano tutti e tre.']], // [nuovo]
      usa: [['pensa', 'Sotto, in lettere grandi: «PAPÀ FA LA GUARDIA. MAMMA AIUTA TUTTI.»']], // [nuovo]
    },
    {
      id: 'finestrella', nome: 'La finestra', x: 470, y: 70, w: 80, h: 100, sagoma: 'finestra',
      guarda: [['pensa', 'Giù, nel Cortile d\'Onore, il Custode cammina avanti e indietro. Sempre gli stessi passi. Il giglio sul suo petto brilla nel buio.']], // [nuovo]
      usa: [['pensa', 'Da qui la bambina vedeva suo padre fare la guardia. Lui, forse, alzava gli occhi a questa finestra.']], // [nuovo]
    },
    { id: 'torna-scalone', nome: 'Lo Scalone', x: 0, y: 200, w: 50, h: 90, uscita: 'reggia.scalone',
      guarda: [['pensa', 'Di là, lo Scalone.']] }, // [nuovo]
  ],
});

// --- 5. La Cappella Palatina ---
AV.quadro({
  id: 'reggia.cappella', capitolo: 'reggia', nome: 'La Cappella Palatina',
  fondale: {
    immagine: 'avventura/reggia-cappella',
    disegno: [
      ['cielo', { tono: 'interno' }],
      ['suolo', { tipo: 'marmo', y: 250 }],
      ['colonna', { x: 100, y: 250, h: 210 }], ['colonna', { x: 540, y: 250, h: 210 }],
      ['arco', { x: 230, y: 60, w: 180, h: 140 }],
      ['banco', { x: 120, y: 260, w: 140 }], ['banco', { x: 380, y: 260, w: 140 }],
      ['forma', { punti: [[260, 200], [380, 200], [380, 235], [260, 235]], colore: '#3a2e26', bordo: '#8a6a3a' }],
      ['luce', { x: 320, y: 180, r: 60, colore: '#f6c76b' }],
    ],
    luce: { tono: 'interno' },
  },
  musica: 'cappella',
  punti: [
    {
      id: 'altare', nome: 'L\'altare', x: 260, y: 190, w: 120, h: 45,
      guarda: [
        ['pensa', 'Gigli secchi, tanti, a mazzi. Qualcuno ne porta di nuovi senza togliere i vecchi.'], // [nuovo]
        ['se', { nonVisto: 'chiavetta-presa' }, [['pensa', 'In mezzo ai gigli luccica una chiavetta d\'ottone, piccola come un dito di bambina.']]], // [nuovo]
      ],
      usa: [['unaVolta', 'chiavetta-presa',
        [['pensa', 'Ferruccio scosta i gigli secchi, che si sbriciolano. Prende la chiavetta.'], ['prendi', 'chiavetta-scatola']], // [nuovo]
        [['pensa', 'Solo gigli secchi, ora.']]]], // [nuovo]
    },
    {
      id: 'inginocchiatoio', nome: 'L\'inginocchiatoio', x: 290, y: 240, w: 60, h: 30,
      guarda: [['pensa', 'Il velluto è consumato in due punti, dove si posano le ginocchia. Qualcuno ci viene ogni notte.']], // [nuovo]
      usa: [['unaVolta', 'memoria-funerale', [
        ['effetto', 'velo'],
        ['pensa', 'La Cappella si riempie di gente ferma. Nessuno respira. Davanti all\'altare, una piccola bara.'], // [nuovo]
        ['dice', 'didascalia', 'Durante il funerale di Bianca rimane immobile davanti alla piccola bara.'], // [bibbia]
        ['dice', 'didascalia', 'Gregorio tenta di prenderle la mano.'], // [bibbia]
        ['dice', 'violante', 'Non voglio più vedere un bambino morire.'], // [bibbia]
        ['pensa', 'Ferruccio abbassa il capo. La frase era generosa. Lo è stata per un po\'.'], // [nuovo] (storia.json)
        ['diario', 'Al funerale di Bianca, Donna Luciana disse: «Non voglio più vedere un bambino morire.» Tutto è cominciato da lì.'], // [nuovo]
      ], [['pensa', 'Ora è solo velluto consumato.']]]], // [nuovo]
    },
    {
      id: 'banchi', nome: 'I banchi', x: 120, y: 236, w: 140, h: 30,
      guarda: [['pensa', 'Sul primo banco, un nome inciso a punta di coltello da qualche bambino annoiato: «CONCETTA». Il nome del primo cartellino di seta.']], // [nuovo]
    },
    {
      id: 'lapide', nome: 'La lapide piccola', x: 440, y: 150, w: 50, h: 40,
      guarda: [['pensa', 'Una lastra di marmo, piccola. Un nome solo: «Bianca». Sotto, un giglio scolpito.']], // [nuovo]
      usa: [['pensa', 'Il marmo è lucido, consumato dalle carezze.']], // [nuovo]
    },
    {
      id: 'lampada', nome: 'La lampada votiva', x: 300, y: 70, w: 40, h: 60,
      guarda: [['pensa', 'Una fiammella rossa che non trema. Qui dentro anche il fuoco obbedisce.']], // [nuovo]
    },
    { id: 'torna-scalone', nome: 'Lo Scalone', x: 0, y: 200, w: 50, h: 90, uscita: 'reggia.scalone',
      guarda: [['pensa', 'Di là, lo Scalone.']] }, // [nuovo]
  ],
});

// --- 6. Il Cortile d'Onore: la quinta decisione e il confronto col Custode ---
const R5_FUORI_TEMPO = [['pensa', 'Non ancora. L\'alabarda cala e risale, cala e risale, e non lascia avvicinare.']]; // [nuovo]

AV.quadro({
  id: 'reggia.cortile', capitolo: 'reggia', nome: 'Il Cortile d\'Onore',
  fondale: {
    immagine: 'avventura/reggia-cortile',
    disegno: [
      ['cielo', { tono: 'notte', luna: true }],
      ['palazzo', { x: 0, y: 40, w: 640, h: 200, archi: 7, finestre: 12 }],
      ['suolo', { tipo: 'selciato', y: 245 }],
      ['forma', { punti: [[250, 80], [390, 80], [390, 95], [250, 95]], colore: '#1c1a22', bordo: '#8a7a5a' }],
      ['colonna', { x: 60, y: 245, h: 170 }], ['colonna', { x: 580, y: 245, h: 170 }],
      ['lampione', { x: 120, y: 245, h: 80, acceso: true }], ['lampione', { x: 520, y: 245, h: 80, acceso: true }],
      ['luce', { x: 120, y: 165, r: 50, colore: '#f6c76b' }], ['luce', { x: 520, y: 165, r: 50, colore: '#f6c76b' }],
      ['fili', { n: 3 }],
    ],
    luce: { tono: 'notte' },
  },
  musica: 'custode',
  entrata: [
    ['unaVolta', 'reggia-cortile-prima', [
      ['dice', 'didascalia', 'Cortile d\'Onore · Notte · Poche luci calde'], // [bibbia]
      ['pensa', 'Il portone si chiude alle spalle di Ferruccio. Il Custode si ferma, si volta, e avanza con l\'alabarda.'], // [nuovo]
      ['diario', 'Il Custode mi aspettava nel Cortile d\'Onore.'], // [nuovo]
      ['obiettivo', 'Il Custode avanza. Decidi come affrontarlo.'], // [nuovo]
    ]],
  ],
  punti: [
    {
      id: 'gregorio', nome: 'Gregorio, il Custode', x: 290, y: 150, w: 60, h: 100, personaggio: 'gregorio', posa: 0,
      guarda: [
        ['pensa', 'Un\'armatura alta il doppio di un uomo, il mantello rosso sulle spalle. Dietro la visiera, niente che si veda.'], // [nuovo]
        ['se', { visto: 'confronto-iniziato' }, [['pensa', 'I colpi sono violenti e regolari, come quelli di una macchina che continua a eseguire un ordine.']]], // [bibbia] adattata
      ],
      usa: [
        ['se', { nonVisto: 'confronto-iniziato' }, [
          // LA QUINTA DECISIONE (bibbia §VII, «I due confronti possibili»; storia.json reggia.scelta-gregorio / reggia.attacco-senza-prove)
          ['se', { flag: { prove: 'vera' } },
            [['scelta', [
              { testo: 'Mostragli le prove', se: { flag: { prove: 'vera' } }, fai: [ // [bibbia] (etichetta di storia.json)
                ['flag', 'gregorio', 'dialogo'],
                ['dice', 'didascalia', 'Ferruccio mostra il registro o il messaggio di Taddeo.'], // [bibbia]
                ['se', { flag: { registro: 'conservato' } }, [['pensa', 'Il registro di Gaetano, aperto alla pagina della spada.']]], // [nuovo]
                ['se', { flag: { taddeo: 'perdonato' } }, [['pensa', 'Il messaggio di Taddeo, con la sua confessione.']]], // [nuovo]
                ['dice', 'didascalia', 'Gregorio si ferma per un istante.'], // [bibbia]
                ['dice', 'gregorio', 'Gaetano...'], // [bibbia]
                ['dice', 'gregorio', 'Gli abbiamo fatto un torto terribile.'], // [bibbia]
                ['effetto', 'lampo'],
                ['dice', 'didascalia', 'Poi il giglio si illumina.'], // [bibbia]
                ['dice', 'gregorio', 'Va\' via. Prima che mi faccia ucciderti.'], // [bibbia]
                ['dice', 'didascalia', 'Il combattimento comincia.'], // [bibbia]
                ['diario', 'Il Custode ha riconosciuto il nome di mio padre. «Gli abbiamo fatto un torto terribile.» Poi il giglio lo ha ripreso.'], // [nuovo]
              ] },
              { testo: 'Sguaina la spada e attacca', fai: [ // [nuovo] (storia.json: «Attacca il Custode»)
                ['flag', 'gregorio', 'attacco'],
                ['dice', 'didascalia', 'Gregorio solleva immediatamente l\'alabarda.'], // [bibbia]
                ['dice', 'gregorio', 'Un altro figlio viene a chiedermi conto dei padri.'], // [bibbia]
                ['dice', 'didascalia', 'Il combattimento comincia.'], // [bibbia]
              ] },
            ]]],
            [['scelta', [
              { testo: 'Cerca le prove nella giubba', fai: [ // [nuovo]
                ['pensa', 'Le mani di Ferruccio cercano nella giubba qualcosa che non c\'è.'], // [nuovo] (storia.json reggia.attacco-senza-prove)
                ['se', { flag: { registro: 'bruciato' } }, [['pensa', 'Il registro è cenere.']], [['pensa', 'Il registro non è nella giubba.']]], // [nuovo]
                ['se', { flag: { taddeo: 'perdonato' } }, [], [['pensa', 'Taddeo non ha lasciato nessun messaggio.']]], // [nuovo]
                ['pensa', 'Non c\'è niente da mostrare. La spada esce da sola dal fodero.'], // [nuovo]
                ['flag', 'gregorio', 'attacco'],
                ['dice', 'didascalia', 'Gregorio solleva immediatamente l\'alabarda.'], // [bibbia]
                ['dice', 'gregorio', 'Un altro figlio viene a chiedermi conto dei padri.'], // [bibbia]
                ['dice', 'didascalia', 'Il combattimento comincia.'], // [bibbia]
              ] },
              { testo: 'Sguaina la spada e attacca', fai: [ // [nuovo]
                ['flag', 'gregorio', 'attacco'],
                ['dice', 'didascalia', 'Gregorio solleva immediatamente l\'alabarda.'], // [bibbia]
                ['dice', 'gregorio', 'Un altro figlio viene a chiedermi conto dei padri.'], // [bibbia]
                ['dice', 'didascalia', 'Il combattimento comincia.'], // [bibbia]
              ] },
            ]]]],
          ['segna', 'confronto-iniziato'],
          ['effetto', 'scossa'],
          ['obiettivo', 'Il Custode colpisce come una macchina. Guarda il ritmo dell\'alabarda.'], // [nuovo]
        ]],
        ['se', { visto: 'scontro-2' }, [['pensa', 'L\'alabarda trema. Il giglio sul petto aspetta una chiave.']]], // [nuovo]
        // passo 2: nella pausa, l'alabarda vuole abbassarsi
        ['se', { tutti: [{ visto: 'scontro-1' }, { nonVisto: 'scontro-2' }] }, [
          ['pensa', 'Nella pausa, Ferruccio abbassa la spada. Non colpisce. Aspetta.'], // [nuovo]
          ['dice', 'didascalia', 'In alcuni momenti il Custode sembra voler abbassare l\'alabarda, ma una forza lo obbliga a sollevarla.'], // [bibbia]
          ['pensa', 'Mentre l\'alabarda risale, Ferruccio vede i fili: dal giglio sul petto salgono al balcone, tesi come redini.'], // [nuovo]
          ['segna', 'scontro-2'],
          ['obiettivo', 'Il giglio è chiuso sul petto del Custode con una serratura. Guarda le chiavi alla sua cintura.'], // [nuovo]
        ]],
      ],
      con: { 'chiave-giglio': [['se', { visto: 'scontro-2' }, R5_MORTE_CUSTODE, R5_FUORI_TEMPO]], '*': R5_FUORI_TEMPO },
    },
    {
      id: 'giglio', nome: 'Il giglio sul petto', x: 306, y: 170, w: 28, h: 26,
      guarda: [['pensa', 'Un giglio d\'oro, fissato al pettorale con una piccola serratura. Il buco della chiave ha la forma di un giglio.']], // [nuovo]
      usa: [['se', { visto: 'scontro-2' }, [['pensa', 'Serve una chiave. Una chiave col giglio.']], R5_FUORI_TEMPO]], // [nuovo]
      con: { 'chiave-giglio': [['se', { visto: 'scontro-2' }, R5_MORTE_CUSTODE, R5_FUORI_TEMPO]], '*': R5_FUORI_TEMPO },
    },
    {
      id: 'alabarda', nome: 'L\'alabarda', x: 350, y: 90, w: 30, h: 150,
      guarda: [['pensa', 'Tre colpi uguali, poi una pausa. Sempre la stessa. Come un orologio caricato da un altro.']], // [nuovo]
      usa: [['se', { tutti: [{ visto: 'confronto-iniziato' }, { nonVisto: 'scontro-1' }] },
        [
          ['pensa', 'Ferruccio conta tre colpi e scivola dentro la pausa. La spada batte sul pettorale.'], // [nuovo]
          ['effetto', 'lampo'],
          ['dice', 'didascalia', 'Ogni volta che Gregorio subisce un colpo, il giglio sul suo petto emette un lampo.'], // [bibbia] adattata
          ['pensa', 'Non è l\'armatura che fa male al Custode. È il giglio.'], // [nuovo]
          ['segna', 'scontro-1'],
          ['obiettivo', 'Nella pausa il Custode trema. Avvicinati a lui, senza colpire.'], // [nuovo]
        ],
        [['se', { nonVisto: 'confronto-iniziato' }, [['pensa', 'Il Custode non ha ancora alzato l\'alabarda.']], [['pensa', 'L\'alabarda cala e risale. Il ritmo, ormai, Ferruccio lo conosce.']]]]]], // [nuovo]
    },
    {
      id: 'chiavi', nome: 'Le chiavi alla cintura', x: 296, y: 205, w: 28, h: 20, sagoma: 'chiave',
      guarda: [['pensa', 'Le chiavi della Reggia, una per serratura. Ne manca una: quella col giglio. Quella della garitta.']], // [nuovo]
      usa: [['pensa', 'Ferruccio tocca la tasca: la chiave col giglio è lì.']], // [nuovo]
    },
    {
      id: 'balcone', nome: 'Il balcone', x: 250, y: 60, w: 140, h: 40,
      guarda: [['pensa', 'Il balcone del piano nobile. La finestra accesa. Qualcuno guarda giù, dietro la tenda.']], // [nuovo]
    },
    {
      id: 'torce', nome: 'Le torce', x: 100, y: 150, w: 40, h: 40,
      guarda: [['pensa', 'Poche luci calde, e il resto buio. La luna non si muove da sei anni.']], // [nuovo]
    },
    {
      id: 'portone', nome: 'Il portone', x: 590, y: 170, w: 50, h: 80, sagoma: 'porta',
      guarda: [['pensa', 'Chiuso. Non si torna.']], // [nuovo]
      usa: [['pensa', 'Il portone non si muove. Ferruccio lo sapeva.']], // [nuovo]
    },
  ],
});

// --- 7. Il Cortile d'Onore, dopo: Donna Luciana, l'ultima conversazione, il bivio ---
AV.quadro({
  id: 'reggia.ultima', capitolo: 'reggia', nome: 'Il Cortile d\'Onore, dopo',
  fondale: {
    immagine: 'avventura/reggia-ultima',
    disegno: [
      ['cielo', { tono: 'velo', luna: true }],
      ['palazzo', { x: 0, y: 40, w: 640, h: 200, archi: 7, finestre: 12 }],
      ['suolo', { tipo: 'selciato', y: 245 }],
      ['scala', { x: 400, y: 95, w: 80, h: 150 }],
      ['colonna', { x: 60, y: 245, h: 170 }], ['colonna', { x: 580, y: 245, h: 170 }],
      ['forma', { punti: [[180, 245], [200, 215], [250, 210], [270, 245]], colore: '#7a1a1a', bordo: '#3a0a0a' }],
      ['finestra', { x: 520, y: 120, w: 30, h: 40, accesa: true }],
      ['fili', { n: 12 }],
      ['nebbia', { alfa: 0.25 }],
    ],
    luce: { tono: 'velo' },
  },
  musica: 'luciana',
  entrata: [
    ['unaVolta', 'custode-sconfitto', [
      ['dice', 'didascalia', 'Il mantello rosso, vuoto, rimasto sull\'armatura.'], // [bibbia] adattata («L'ultima immagine della sua sottotrama è il mantello rosso…»)
      ['dice', 'didascalia', 'Dall\'alto si sente una voce femminile.'], // [bibbia]
      ['dice', 'violante', 'Gregorio?'], // [bibbia]
      ['dice', 'didascalia', 'La donna compare sul balcone.'], // [bibbia]
      ['dice', 'violante', 'Avevi promesso che saremmo rimasti insieme.'], // [bibbia]
      ['effetto', 'buio'],
      ['dice', 'didascalia', 'Scende lentamente una breve scala laterale, mentre le torce si spengono una dopo l\'altra.'], // [bibbia]
      ['dice', 'violante', 'E tu devi essere Ferruccio.'], // [bibbia]
      ['dice', 'didascalia', 'Lo osserva con tristezza.'], // [bibbia]
      ['dice', 'violante', 'Pensavo di averti tolto abbastanza ricordi da farti riposare.'], // [bibbia]
      ['dice', 'didascalia', 'Ferruccio punta la spada verso di lei.'], // [bibbia]
      ['dice', 'violante', 'Non ho mai odiato questa città.'], // [bibbia]
      ['dice', 'didascalia', 'Una finestra si illumina dietro il colonnato.'], // [bibbia]
      ['dice', 'violante', 'L\'ho amata più di quanto meritasse.'], // [bibbia]
      ['dice', 'didascalia', 'La donna mostra il fazzoletto di Bianca.'], // [bibbia]
      ['dice', 'violante', 'Ed è per questo che non posso lasciarla andare.'], // [bibbia]
      ['effetto', 'luce'],
      ['dice', 'didascalia', 'I fili dorati si irradiano da lei fino alle strade di Caserta.'], // [bibbia] adattata («Il giocatore vede i fili dorati irradiarsi da Violante…»)
      // reggia.nucleo-del-velo: mostrato, non spiegato (bibbia §VIII, «Perché Ferruccio non può semplicemente distruggere il Velo?»)
      ['pensa', 'Ferruccio guarda il giglio spezzato sul mantello. Spento. Poi guarda i fili: non partivano dal giglio. Partono da lei.'], // [nuovo]
      ['pensa', 'Il giglio era la sua voce. Gregorio, la sua porta. Ma il nodo del Velo è lei, viva.'], // [nuovo]
      ['segna', 'nucleo-capito'],
      ['diario', 'Donna Luciana è la Signora del Velo. Spezzare il giglio ha liberato Gregorio, troppo tardi. Non ha liberato la città: i fili partono da lei.'], // [nuovo]
      ['obiettivo', 'Donna Luciana aspetta. Mostrale la scatola di Bianca.'], // [nuovo]
    ]],
  ],
  punti: [
    {
      id: 'luciana', nome: 'Donna Luciana', x: 300, y: 130, w: 50, h: 120, personaggio: 'violante', posa: 0,
      guarda: [['pensa', 'Una donna gentile, gli occhi asciutti da troppo tempo. Nella mano, un fazzoletto ricamato con un giglio che brilla.']], // [nuovo]
      usa: [['dialogo', 'violante.cortile']],
      con: {
        'scatola-musicale': [['dialogo', 'violante.cortile']],
        'frammenti-di-seta': [
          ['dice', 'violante', 'Concetta ha dormito, quella notte. La prima dopo un mese. Me l\'ha detto piangendo di gratitudine.'], // [nuovo]
          ['dice', 'violante', 'Dimmi tu dov\'era il passo sbagliato.'], // [nuovo]
        ],
        '*': [['dice', 'violante', 'Non c\'è niente, in quelle tasche, che io non abbia già visto.']], // [nuovo]
      },
    },
    {
      id: 'mantello', nome: 'Il mantello rosso', x: 180, y: 205, w: 90, h: 40,
      guarda: [['pensa', 'Il mantello rosso, vuoto, rimasto sull\'armatura. Il giglio spezzato in due, sopra.']], // [bibbia] adattata
      usa: [['pensa', 'Ferruccio si china e chiude la visiera sul volto del Custode.']], // [nuovo]
    },
    {
      id: 'fili', nome: 'I fili dorati', x: 360, y: 20, w: 200, h: 80,
      guarda: [['pensa', 'Partono da lei, dalle sue mani, dal suo respiro. Scavalcano i tetti e scendono su ogni casa di Caserta.']], // [nuovo]
      usa: [['pensa', 'Ferruccio tende la spada verso un filo. Il filo non si taglia: si piega, e torna dritto.']], // [nuovo]
    },
    {
      id: 'citta', nome: 'La città oltre il cortile', x: 20, y: 40, w: 150, h: 100,
      guarda: [['pensa', 'Oltre il colonnato, le luci di Caserta. Ferme. Serene. Nessuno, laggiù, sta piangendo.']], // [nuovo]
    },
    {
      id: 'scala', nome: 'La scala laterale', x: 400, y: 100, w: 80, h: 145,
      guarda: [['pensa', 'La scala da cui è scesa. In cima, la finestra accesa della stanza dei fili.']], // [nuovo]
    },
    {
      id: 'torce-spente', nome: 'Le torce spente', x: 100, y: 150, w: 40, h: 40,
      guarda: [['pensa', 'Fumano ancora. Ora l\'unica luce è quella dei fili.']], // [nuovo]
    },
  ],
});

// --- Il dialogo nel Cortile: ciò che il giocatore può aver perso viene recuperato qui (bibbia §XV, riga 1056) ---
AV.dialogo({
  id: 'violante.cortile', con: 'violante',
  inizio: [['dice', 'violante', 'Vuoi parlarmi senza voce. Va bene. Sono abituata a capire chi non parla.']], // [nuovo]
  saluto: [['dice', 'violante', 'Sono ancora qui, Ferruccio.']], // [nuovo]
  temi: [
    {
      id: 'scatola', testo: 'Porgile la scatola di Bianca', se: { ha: 'scatola-musicale' }, unaVolta: true, fai: [
        ['pensa', 'Ferruccio tende la scatola. Donna Luciana la prende con due mani, come una cosa viva.'], // [nuovo]
        ['dice', 'didascalia', 'Donna Luciana la apre.'], // [bibbia] (Violante la apre.)
        ['suono', 'carillon'],
        ['dice', 'violante', 'Aveva promesso di imparare a suonarla.'], // [bibbia]
        ['dice', 'violante', 'Non ne ha avuto il tempo.'], // [bibbia]
        ['pensa', 'Ferruccio comprende finalmente che il Velo non è stato creato per riportare Bianca in vita.'], // [bibbia]
        ['pensa', 'È stato creato perché sua madre non potesse più provare il dolore di averla perduta.'], // [bibbia]
        ['togli', 'scatola-musicale'], // resta a lei: nel finale velato suona da sola (bibbia §XI)
        ['segna', 'scatola-aperta'],
        ['diario', 'Il Velo non doveva riportare indietro Bianca. Doveva impedire a sua madre di sentirne la mancanza. E poi a tutti gli altri.'], // [nuovo]
        ['obiettivo', 'Ascolta Donna Luciana. Quando sei pronto, alza la spada.'], // [nuovo]
      ],
    },
    {
      id: 'fili', testo: 'Indica i fili che partono da lei', fai: [
        ['dice', 'violante', 'La seta di San Leucio li ha soltanto portati nelle case. Il nodo sono io.'], // [nuovo] (bibbia §VIII)
        ['dice', 'violante', 'Gregorio era la porta, il giglio era la mia voce. Hai spezzato la voce, non il Velo.'], // [nuovo]
        ['dice', 'violante', 'Finché respiro, i fili tengono. E se si strappano, li ricucio.'], // [nuovo]
        ['se', { nonVisto: 'progressione-vista' }, [
          ['dice', 'violante', 'All\'inizio era un fazzoletto per dormire una notte. Poi un modo per non ricordare i morti. Poi per non litigare, per non invidiare.'], // [nuovo] (progressione, recuperata)
          ['dice', 'violante', 'Poi non serviva più chiedere a nessuno. Chi dice di no non sa cosa è meglio per lui.'], // [nuovo]
        ]],
      ],
    },
    {
      id: 'mantello', testo: 'Indica il mantello rosso', fai: [
        ['se', { nonVisto: 'memoria-tradimento' },
          [
            ['dice', 'violante', 'Mi disse: «Bianca non avrebbe voluto questo.»'], // [nuovo] (cita la bibbia §VIII)
            ['dice', 'violante', 'Io gli risposi: «Bianca non vuole più niente.»'], // [nuovo] (cita la bibbia §VIII)
            ['dice', 'violante', 'Poi provò a distruggere il primo telaio. E io lo legai al giglio che gli avevo regalato.'], // [nuovo]
          ],
          [['dice', 'violante', 'L\'hai visto, quel giorno. Lo so. La seta ricorda.']]], // [nuovo]
        ['dice', 'violante', 'Lo tenevo con me. Era l\'unico modo che avevo per non perdere anche lui.'], // [nuovo]
      ],
    },
    {
      id: 'padre', testo: 'Batti il pugno sul petto, dove batteva il martello di tuo padre', fai: [ // [nuovo]
        ['se', { flag: { gregorio: 'dialogo' } },
          [['dice', 'violante', 'Te l\'ha detto, vero? Che tuo padre era innocente. Era vero.']], // [nuovo]
          [
            ['dice', 'violante', 'Il fabbro. Gaetano. Non aveva fatto niente: serviva un nome, e il suo era a portata di mano.'], // [nuovo]
            ['dice', 'violante', 'Gregorio lo sapeva. Non ha avuto il tempo di dirtelo.'], // [nuovo]
          ]],
        ['se', { flag: { registro: 'bruciato' } },
          [['dice', 'violante', 'C\'era un registro che lo provava. L\'hai bruciato tu, mi dicono. Allora lo sappiamo solo noi due.']]], // [nuovo]
      ],
    },
    {
      id: 'citta', testo: 'Indica la città oltre il cortile', fai: [
        ['dice', 'violante', 'Guardali. Dormono. Nessuno ha fame di qualcosa che non può avere.'], // [nuovo]
        ['se', { flag: { tonino_ricordo: 'negato' } },
          [['dice', 'violante', 'Il ragazzo della piazza ride ancora. Se mi uccidi, domattina si ricorda di Rosa.']], // [nuovo]
          [['se', { flag: { tonino_ricordo: 'restituito' } }, [['dice', 'violante', 'Il ragazzo della piazza piange già sua sorella, per colpa tua. Se mi uccidi, piangeranno tutti così.']]]]], // [nuovo]
        ['se', { flag: { agnese: 'sognante' } },
          [['dice', 'violante', 'La tua tessitrice sorride, nel sonno. Se muoio, si sveglia. E ricorda tutto: anche quello che le farà male.']], // [nuovo]
          [['se', { flag: { agnese: 'risvegliata' } }, [['dice', 'violante', 'La tua tessitrice è sveglia. Ha scelto il dolore per stare con te. Vuoi sceglierlo per tutti?']]]]], // [nuovo]
        ['dice', 'violante', 'E nessuno, nessuno, ti dirà grazie.'], // [nuovo] (bibbia §III, atto IV: «il liberatore odiato»)
        ['segna', 'citta-capita'],
      ],
    },
    {
      id: 'spada', testo: 'Alza la spada', se: { visto: 'scatola-aperta' }, unaVolta: true, fai: [
        // le strade di fuori (60-vie-laterali.js): ciò che ha detto il Giudice dell'Arena
        ['se', { visto: 'arena-dimenticati' }, [['pensa', 'Il Giudice l\'aveva detto: il Velo è un giuramento vecchio di secoli. Lei l\'ha ricevuto. Chi l\'ha ricevuto, lo può sciogliere.']]], // [nuovo]
        // reggia.ultima-conversazione (bibbia §VIII, «L'ultima conversazione»)
        ['dice', 'violante', 'Guardati. Hai attraversato un\'intera città per uccidere qualcuno.'], // [bibbia]
        ['dice', 'didascalia', 'Ferruccio tiene la spada alzata.'], // [bibbia]
        ['dice', 'violante', 'Io ho fatto tutto questo affinché nessuno dovesse farlo mai più.'], // [bibbia]
        ['dice', 'didascalia', 'Il ragazzo guarda la città oltre il cortile.'], // [bibbia]
        ['dice', 'violante', 'Se mi uccidi, torneranno la fame, l\'odio e la paura.'], // [bibbia]
        ['dice', 'violante', 'Se mi risparmi, continueranno a sorridere.'], // [bibbia]
        ['dice', 'didascalia', 'Dopo qualche istante, la donna si inginocchia accanto al mantello del marito.'], // [bibbia]
        ['posa', 'luciana', 1],
        ['dice', 'violante', 'Dimmi, Ferruccio. Chi di noi due è davvero un mostro?'], // [bibbia]
        // LA SESTA DECISIONE (bibbia §XVI, Scena 2 «Il bivio»)
        ['dice', 'didascalia', 'Quanto vale la felicità?'], // [bibbia]
        ['dice', 'didascalia', 'Donna Luciana attende la tua decisione.'], // [bibbia] (Violante attende la tua decisione.)
        ['scelta', [
          { testo: 'Spezza il Velo — La città sarà libera. Tornerà anche il dolore.', fai: [['flag', 'violante', 'uccisa']] }, // [bibbia]
          { testo: 'Risparmia Donna Luciana — La città resterà in pace. Nessuno potrà più scegliere.', fai: [['flag', 'violante', 'risparmiata']] }, // [bibbia] (Risparmia Violante)
        ]],
        ['segna', 'reggia-finita'],
        ['se', { flag: { violante: 'uccisa' } }, [
          ['attendi', 300],
          ['vai', 'epilogo.libera'],
        ]],
        ['se', { flag: { violante: 'risparmiata' } }, [
          ['attendi', 300],
          ['vai', 'epilogo.velata'],
        ]],
      ],
    },
  ],
});

/*
 * IMMAGINI DA FAR DISEGNARE (gioco/assets/avventura/, 640×360, teatro d'ombre: sagome scure, luci calde, luna ferma)
 * - reggia-cancello.png: il viale dritto fra due file di lecci, il cancello coi gigli e la porticina, la garitta a
 *   destra con un lampione, la statua del cavaliere inginocchiato davanti al giglio a sinistra; in fondo la facciata
 *   con mille finestre buie e una sola accesa al piano nobile; i fili d'oro della città che vi convergono.
 * - reggia-scalone.png: lo Scalone reale che sale nel buio, i due leoni (uno ruggisce, uno dorme), lo stemma col
 *   giglio d'oro vero, il ritratto di famiglia a sinistra in alto, tre porte (sinistra, destra, in cima, quella in
 *   cima bassa e bianca), il portone del Cortile in basso al centro; fili d'oro che scendono come radici.
 * - reggia-fili.png: stanza di telai senza tessitrici, navette che vanno da sole, un telaio grande a destra con una
 *   tela col giglio, un telaio vecchio annerito e spaccato a sinistra, un banco con quattro ritagli di seta, una
 *   finestra da cui escono i fili verso i tetti.
 * - reggia-bianca.png: cameretta bianca, lettino rimboccato a sinistra, tavolino con quaderno e scatola musicale
 *   (bambina di legno col giglio sul coperchio), disegno a carboncino sul muro (padre col mantello rosso, madre,
 *   bambina per mano), finestra con tenda che dà sul Cortile.
 * - reggia-cappella.png: cappella palatina, colonne, arco sull'altare coperto di gigli secchi, inginocchiatoio di
 *   velluto consumato, banchi, una piccola lapide col giglio, lampada votiva rossa.
 * - reggia-cortile.png: il Cortile d'Onore di notte, colonnato e archi, poche torce, il balcone del piano nobile con
 *   la finestra accesa, luna ferma; spazio al centro per il Custode (figura `gregorio`).
 * - reggia-ultima.png: lo stesso Cortile, torce spente e fumanti, la scala laterale a destra, l'armatura a terra col
 *   mantello rosso vuoto e il giglio spezzato, una finestra accesa dietro il colonnato, fili dorati che si irradiano
 *   dal centro (dove sta Donna Luciana) verso la città oltre il colonnato.
 */
