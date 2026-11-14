/*
 * storia/90-finali.js — L'EPILOGO giocabile e TUTTI I FINALI dell'avventura (contratto in ../LEGGIMI.md).
 * Fonti: trama/ferruccio-bibbia.md §XIII (gli otto percorsi), §XVI (i due finali, scena per scena), §XVII-§XVIII
 * (il mondo dopo), §XX (la frase dei titoli), riga 1372 (la domanda finale); i destini dei personaggi (Agnese,
 * Taddeo, Gaetano, Mariella, Tonino, Bianca); trama/storia.json capitolo «epilogo»; production/finali-teatro.md §2
 * (il finale segreto). Le battute della bibbia sono marcate // [bibbia]; quelle scritte qui // [nuovo].
 * La Signora a schermo è Donna Luciana (id del flag e del personaggio: `violante`).
 *
 * I SEDICI FINALI — decisi da taddeo × registro × agnese (il percorso) e da violante (l'esito per Caserta).
 * Tonino (tonino_ricordo) e Gregorio (gregorio, prove) sono varianti DENTRO ogni finale, non finali a parte.
 *
 *  perc. | taddeo    | registro   | agnese      | violante = uccisa                     | violante = risparmiata
 *  ------+-----------+------------+-------------+---------------------------------------+-----------------------------------------
 *    1   | perdonato | conservato | risvegliata | p1-verita-condivisa.uccisa            | p1-verita-condivisa.risparmiata
 *    2   | perdonato | conservato | sognante    | p2-sacrificio-sentimento.uccisa       | p2-sacrificio-sentimento.risparmiata
 *    3   | perdonato | bruciato   | risvegliata | p3-parola-contro-potere.uccisa        | p3-parola-contro-potere.risparmiata
 *    4   | perdonato | bruciato   | sognante    | p4-peso-della-pieta.uccisa            | p4-peso-della-pieta.risparmiata
 *    5   | accusato  | conservato | risvegliata | p5-giustizia-senza-perdono.uccisa     | p5-giustizia-senza-perdono.risparmiata
 *    6   | accusato  | conservato | sognante    | p6-prova-senza-amore.uccisa           | p6-prova-senza-amore.risparmiata
 *    7   | accusato  | bruciato   | risvegliata | p7-amore-sopra-ogni-cosa.uccisa       | p7-amore-sopra-ogni-cosa.risparmiata
 *    8   | accusato  | bruciato   | sognante    | p8-cavaliere-senza-nessuno.uccisa     | p8-cavaliere-senza-nessuno.risparmiata
 *
 *  Le 16 condizioni usano SOLO i quattro flag: coprono tutte le combinazioni e non si sovrappongono.
 *  In più: «segreto-sopra-la-ribalta» (tre ferri + Fucina + porta della bottega aperta bussando + scala salita).
 *  La sua condizione è più specifica (i quattro flag decisi + ha + visto «ribalta-salita», che si segna solo lì);
 *  comunque l'epilogo lo chiama per nome: ['finale', 'segreto-sopra-la-ribalta'], mai con ['finale'] nudo.
 *
 * COME SI GIOCA L'EPILOGO (capitolo «epilogo», ordine 6)
 *  - Donna Luciana uccisa → epilogo.libera (Cortile della Reggia, colori vivi, la folla) → epilogo.libera-corso
 *    (la fuga: Taddeo, Mariella alla finestra) → epilogo.libera-piazza (Piazza Dante sotto il cielo azzurro: Tonino,
 *    la targa, la porta della bottega) → «Fuggi oltre la piazza» = ['finale'].
 *  - Donna Luciana risparmiata → epilogo.velata (Piazza Dante nella foschia: Tonino, Taddeo di ronda, Mariella,
 *    la targa, Agnese sotto il portico, la porta della bottega) → epilogo.velata-manifattura (Agnese al telaio)
 *    → «Esci dalla manifattura» = ['finale'].
 *  - Nei due mondi: la porta della bottega (epilogo.bottega) risponde a chi porta i tre ferri e ha visto la Fucina.
 */

AV.capitolo({ id: 'epilogo', titolo: 'Epilogo', ordine: 6, sottotitolo: 'Il giorno dopo la notte' });

// Il Grande Burattinaio (finale segreto): solo le Mani coi guanti bianchi, nessun volto. Foglio già nel Teatro.
AV.personaggio({ id: 'burattinaio', nome: 'Il Grande Burattinaio', colore: '#f8fafc', figura: { foglio: 'gb_guanto', alt: 120 } });

// --- Pezzi comuni (dati, non codice: liste di azioni riusate da più quadri e più finali) ---

const TRE_FERRI = ['ferro-tenaglie', 'ferro-punzone', 'ferro-ago'];

/** La domanda della bibbia (riga 1372): chiude OGNI finale. */
const DOMANDA = [
  ['effetto', 'buio'],
  ['attendi', 1200],
  ['dice', 'didascalia', 'Se nessuno vuole essere liberato, hai comunque il diritto di farlo?'], // [bibbia]
];

/** I titoli di coda, uguali per le due conclusioni (§XX). */
const TITOLI = [
  ['effetto', 'sipario'],
  ['dice', 'didascalia', 'La libertà non promette la felicità. Promette soltanto che sarà tua la scelta.'], // [bibbia]
];

/** Gregorio: il ricordo delle sue ultime parole dipende da come Ferruccio lo ha affrontato e dalle prove. */
const GREGORIO = [
  ['pensa', 'Nel Cortile, sull\'armatura spezzata, è rimasto il mantello rosso. Vuoto.'], // [bibbia, adattata]
  ['se', { flag: { gregorio: 'dialogo', prove: 'vera' } },
    [['pensa', 'Il Custode aveva capito, prima di cadere. Le sue ultime parole erano state: «Tuo padre era innocente.»']], // [bibbia] la battuta
    [['pensa', 'Le ultime parole del Custode non erano state per lui: «Anche io avevo paura di perderla.»']], // [bibbia] la battuta
  ],
  ['se', { flag: { gregorio: 'attacco' } },
    [['pensa', 'Non gli aveva dato il tempo di parlare. Non saprà mai quanto ancora capisse, dietro l\'elmo.']], // [nuovo]
    [['pensa', 'Aveva cercato le parole, con lui. Non sono bastate a salvarlo: lo hanno solo reso un uomo.']], // [nuovo]
  ],
];

/** Tonino nei finali (eco delle quattro scene conclusive, §Tonino). */
const TONINO_FINALE_LIBERA = [
  ['se', { flag: { tonino_ricordo: 'restituito' } },
    [['pensa', 'Al banco di Piazza Dante, Tonino raccoglie i cocci del piatto che gli ha tirato. Ne tiene uno in mano, a lungo.']], // [nuovo]
    [['pensa', 'Al banco di Piazza Dante, Tonino dice il nome di Rosa a voce alta, per la prima volta da anni. Poi piange, e nessuno lo ferma.']], // [nuovo]
  ],
];
const TONINO_FINALE_VELATA = [
  ['se', { flag: { tonino_ricordo: 'restituito' } },
    [['pensa', 'Al banco di Piazza Dante, Tonino apparecchia due piatti. Non sa per chi sia il secondo.']], // [nuovo]
    [['pensa', 'Al banco di Piazza Dante, Tonino ride. È la stessa risata della prima notte.']], // [nuovo]
  ],
];

/** Mariella (tabella dei possibili esiti, taddeo × violante). */
const MARIELLA_LIBERA = [
  ['se', { flag: { taddeo: 'perdonato' } },
    [['dice', 'didascalia', 'Mariella riacquista la capacità di provare paura. Taddeo comprende che può accompagnarla, ma non cancellare ciò che ha vissuto.']], // [bibbia]
    [['dice', 'didascalia', 'Mariella torna a provare emozioni, ma scopre che suo fratello ha tradito un amico per lei. Lo respinge.']], // [bibbia]
  ],
];
const MARIELLA_VELATA = [
  ['se', { flag: { taddeo: 'perdonato' } },
    [['dice', 'didascalia', 'Mariella continua a sorridere. Taddeo conserva a tratti il ricordo della lettera, senza trovare il coraggio di opporsi.']], // [bibbia]
    [['dice', 'didascalia', 'Mariella rimane serena e Taddeo si convince che il tradimento sia stato necessario.']], // [bibbia]
  ],
];

/** Le due chiusure sul nero (§XVI), poi i titoli e la domanda. */
const CHIUSA_LIBERA = [
  ['effetto', 'buio'],
  ['dice', 'didascalia', 'Il primo dono della libertà fu il diritto di odiarlo.'], // [bibbia]
  ...TITOLI, ...DOMANDA,
];
const CHIUSA_VELATA = [
  ['dice', 'didascalia', 'L\'ultima inquadratura mostra Donna Luciana sul balcone della Reggia.'], // [bibbia, nome a schermo]
  ['dice', 'didascalia', 'Dalle sue dita partono fili d\'oro che attraversano tutta la città.'], // [bibbia]
  ['dice', 'didascalia', 'Il giglio continua a brillare. La scatola musicale suona da sola.'], // [bibbia]
  ['dice', 'didascalia', 'Una voce ripete sempre lo stesso verso della filastrocca. Forse è Bianca. Forse è soltanto un ricordo che la magia ha tenuto.'], // [nuovo] il dubbio resta
  ['effetto', 'buio'],
  ['dice', 'didascalia', 'Nessuno aveva più bisogno di essere salvato. Nessuno poteva più chiedere aiuto.'], // [bibbia]
  ...TITOLI, ...DOMANDA,
];

/** La porta della bottega di Gaetano, in entrambe le piazze dell'epilogo: il ritmo del martello la apre. */
const BUSSATA_SBAGLIATA = [
  ['suono', 'bussa'],
  ['dice', 'didascalia', 'La porta non risponde.'], // [nuovo, finali-teatro]
  ['pensa', 'Dietro, il martello riprende il suo passo. Non è il tuo.'], // [nuovo]
];
const BUSSATA_GIUSTA = [
  ['suono', 'bussa'],
  ['dice', 'didascalia', 'La porta risponde: tre colpi, una pausa, uno.'], // [nuovo, finali-teatro]
  ['dice', 'didascalia', 'La spranga cade. La porta della bottega è aperta.'], // [nuovo, finali-teatro]
  ['segna', 'bottega-aperta'],
  ['diario', 'Ho bussato come batteva mio padre. La bottega mi ha aperto.'], // [nuovo]
  ['vai', 'epilogo.bottega'],
];
const PORTA_BOTTEGA = {
  id: 'bottega', nome: 'La porta della bottega', x: 286, y: 120, w: 52, h: 96, sagoma: 'porta',
  guarda: [
    ['pensa', 'Una porta di legno, sprangata. Sopra, l\'insegna di un fabbro.'], // [nuovo, finali-teatro]
    ['se', { visto: 'bottega-aperta' }, [['pensa', 'La spranga è a terra. Dentro, la brace è accesa.']], [ // [nuovo]
      ['se', { tutti: [{ ha: TRE_FERRI }, { visto: 'fucina-visitata' }] },
        [['pensa', 'Dietro la porta un ferro batte. Tre colpi, una pausa, uno. Poi daccapo.']], // [nuovo, finali-teatro]
        [['pensa', 'Sul legno della spranga, tre impronte: tenaglie, un punzone, un ago. Come se la porta aspettasse i suoi ferri.']], // [nuovo]
      ],
    ]],
  ],
  usa: [
    ['se', { visto: 'bottega-aperta' }, [['vai', 'epilogo.bottega']], [
      ['se', { tutti: [{ ha: TRE_FERRI }, { visto: 'fucina-visitata' }] }, [
        ['pensa', 'Ferruccio alza il pugno sulla porta. Dietro, il martello tace: aspetta.'], // [nuovo]
        ['scelta', [
          { testo: 'Bussa una volta', fai: BUSSATA_SBAGLIATA },
          { testo: 'Bussa tre volte, svelto', fai: [
            ['suono', 'bussa'],
            ['pensa', 'Tre colpi. Il legno trema. Dietro, nessuno si muove ancora.'], // [nuovo]
            ['scelta', [
              { testo: 'Bussa ancora, subito', fai: BUSSATA_SBAGLIATA },
              { testo: 'Trattieni il pugno per un respiro', fai: [
                ['pensa', 'Un respiro. Il silenzio pesa come un ferro sull\'incudine.'], // [nuovo]
                ['scelta', [
                  { testo: 'Un colpo solo', fai: BUSSATA_GIUSTA },
                  { testo: 'Altri tre colpi', fai: BUSSATA_SBAGLIATA },
                ]],
              ] },
            ]],
          ] },
          { testo: 'Bussa due volte, piano', fai: BUSSATA_SBAGLIATA },
        ]],
      ], [
        ['dice', 'didascalia', 'La porta non risponde.'], // [nuovo]
        ['se', { nonVisto: 'fucina-visitata' }, [['pensa', 'Dietro non batte nessuno. Nessuno lo ha ancora riconosciuto, là dentro.']]], // [nuovo]
        ['se', { nonHa: 'ferro-tenaglie' }, [['pensa', 'Manca l\'impronta delle tenaglie. Mariella aveva detto: il ferro suona dietro una porta che non c\'è, sul Corso.']]], // [nuovo]
        ['se', { nonHa: 'ferro-punzone' }, [['pensa', 'Manca l\'impronta del punzone. Era rimasto vicino all\'acqua della Villa.']]], // [nuovo]
        ['se', { nonHa: 'ferro-ago' }, [['pensa', 'Manca l\'impronta dell\'ago. A San Leucio, sul telaio, qualcuno non aveva voluto romperlo.']]], // [nuovo]
      ]],
    ]],
  ],
};

// ======================================================================================================
// IL MONDO LIBERO — Donna Luciana uccisa (§XVI «Se Ferruccio uccide Violante», §XVII colonna sinistra)
// ======================================================================================================

AV.quadro({
  id: 'epilogo.libera', capitolo: 'epilogo', nome: 'Il Cortile della Reggia, dopo',
  fondale: {
    immagine: 'avventura/epilogo-cortile-libero',
    disegno: [
      ['cielo', { tono: 'alba', stelle: false }],
      ['palazzo', { x: 40, w: 560, h: 190, archi: 7, finestre: 9 }],
      ['suolo', { tipo: 'marmo', y: 250 }],
      ['luce', { x: 320, y: 60, r: 260, colore: '#fde68a' }],
      ['albero', { x: 20, y: 250, h: 120, tipo: 'leccio' }],
      ['albero', { x: 610, y: 250, h: 110, tipo: 'leccio' }],
    ],
    luce: { tono: 'alba' },
  },
  musica: 'liberta',
  entrata: [
    ['unaVolta', 'cap-epilogo', [['capitolo', 'epilogo']]],
    ['unaVolta', 'epilogo-libera-inizio', [
      ['flag', 'volto', 'umano'],
      ['dice', 'didascalia', 'Il giglio ricamato si spegne e i fili che attraversano la città si spezzano.'], // [bibbia]
      ['effetto', 'lampo'],
      ['dice', 'didascalia', 'Per un istante non si sente nulla.'], // [bibbia]
      ['attendi', 900],
      ['dice', 'didascalia', 'Poi una donna comincia a piangere.'], // [bibbia]
      ['dice', 'didascalia', 'Un bambino chiama sua madre.'], // [bibbia]
      ['dice', 'didascalia', 'Un uomo ride davvero, sorpreso dalla propria risata.'], // [bibbia]
      ['effetto', 'luce'],
      ['dice', 'didascalia', 'La luce della luna lascia spazio a un cielo azzurro e vivace.'], // [bibbia]
      ['pensa', 'Ferruccio osserva la città finalmente libera.'], // [bibbia]
      ['dice', 'didascalia', 'Poi una guardia entra nel cortile.'], // [bibbia]
      ['dice', 'guardia', 'La Signora! L\'ha ammazzata!'], // [bibbia]
      ['dice', 'guardia', 'Ha ucciso anche il Custode!'], // [bibbia] (la seconda guardia)
      ['dice', 'didascalia', 'Gli abitanti accorrono.'], // [bibbia]
      ['dice', 'cittadino', 'Era lei che dava da mangiare ai nostri figli!'], // [bibbia]
      ['dice', 'cittadino', 'Assassino!'], // [bibbia] (un altro)
      ['dice', 'didascalia', 'Dalla folla emerge Agnese.'], // [bibbia]
      ['se', { flag: { agnese: 'risvegliata' } },
        [['dice', 'agnese', 'Ferruccio... ti prego. Non scappare. Posso ancora aiutarti!']], // [bibbia]
        [
          ['dice', 'didascalia', 'Il Velo si spezza e Agnese recupera ogni ricordo, tutti insieme, adesso.'], // [bibbia, adattata]
          ['dice', 'agnese', 'Sei tu... Sei davvero tu? Perché hai fatto questo?'], // [bibbia]
        ],
      ],
      ['dice', 'didascalia', 'Nessuno di loro è controllato da alcuna magia. Hanno paura, e hanno scelto da che parte stare.'], // [bibbia, adattata]
      ['diario', 'Il Velo è spezzato. Caserta piange, ride, chiama. E mi chiama assassino.'], // [nuovo]
      ['obiettivo', 'Uscire dal Cortile prima che la folla si chiuda.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'fazzoletto', nome: 'Il giglio ricamato', x: 300, y: 236, w: 36, h: 24, sagoma: 'foglio',
      guarda: [
        ['dice', 'didascalia', 'Il giglio ricamato perde la sua luce soprannaturale. Rimane un semplice fazzoletto.'], // [bibbia]
        ['pensa', 'Accanto al corpo di Donna Luciana. Un fazzoletto da bambina, con le cuciture storte.'], // [nuovo]
      ],
      usa: [
        ['pensa', 'Ferruccio si china. Non lo prende. Lo lascia dov\'è, accanto a lei: era di Bianca, non suo.'], // [nuovo]
        ['segna', 'epilogo-bianca-libera'],
      ] },
    { id: 'mantello', nome: 'Il mantello rosso', x: 410, y: 214, w: 60, h: 46, sagoma: 'ombra',
      guarda: [
        ['pensa', 'Il mantello rosso, vuoto, rimasto sull\'armatura del Custode.'], // [bibbia, adattata]
        ['se', { flag: { gregorio: 'dialogo' } },
          [['pensa', 'Gli aveva parlato, prima. Per un momento, dietro l\'elmo, c\'era stato un uomo.']], // [nuovo]
          [['pensa', 'Non gli aveva lasciato il tempo di parlare. Adesso il Custode non parlerà più.']], // [nuovo]
        ],
      ] },
    { id: 'guardia', nome: 'La guardia', x: 470, y: 150, w: 40, h: 100, personaggio: 'guardia',
      guarda: [['pensa', 'Una guardia giovane. Le tremano le mani sull\'alabarda, e non per un incantesimo.']], // [nuovo]
      usa: [['dice', 'guardia', 'Fermo là! Butta la spada! Butta la spada, ho detto!']], // [nuovo]
      con: { '*': [['dice', 'guardia', 'Non mi mostrare niente! Non ti avvicinare!']] } }, // [nuovo]
    { id: 'folla', nome: 'La folla', x: 520, y: 140, w: 110, h: 110, personaggio: 'cittadino',
      guarda: [
        ['pensa', 'Fornai, lavandaie, ragazzi della Villa. Ieri sorridevano tutti allo stesso modo. Oggi ognuno ha la sua faccia, e tutte lo odiano.'], // [nuovo]
      ],
      usa: [
        ['pensa', 'Ferruccio tenta di mostrare la propria sciarpa, la spada e, se lo possiede, il registro.'], // [bibbia]
        ['scelta', [
          { testo: 'Mostra la sciarpa rossa', se: { flag: { sciarpa: 'al-collo' } }, fai: [
            ['dice', 'cittadino', 'Una pezza rossa! E che è, una bandiera? Hai le mani sporche di sangue!'], // [nuovo]
          ] },
          { testo: 'Tocca il collo, dove la sciarpa non c\'è', se: { flag: { sciarpa: 'alla-bottega' } }, fai: [
            ['pensa', 'La sciarpa è rimasta alla bottega. Non ha niente da mostrare che dica chi è.'], // [nuovo]
          ] },
          { testo: 'Mostra la spada di Gaetano', fai: [
            ['dice', 'cittadino', 'La spada! Guardate, la mostra pure! Ancora calda di lei!'], // [nuovo]
          ] },
          { testo: 'Mostra il registro di suo padre', se: { flag: { registro: 'conservato' } }, fai: [
            ['dice', 'cittadino', 'Carte! Ci porta le carte, sopra il corpo della Signora!'], // [nuovo]
          ] },
        ]],
        ['dice', 'didascalia', 'Nessuno è disposto ad ascoltarlo in mezzo al caos.'], // [bibbia]
      ] },
    { id: 'agnese', nome: 'Agnese', x: 220, y: 150, w: 40, h: 100, personaggio: 'agnese',
      guarda: [
        ['se', { flag: { agnese: 'risvegliata' } },
          [['pensa', 'Lo ha riconosciuto subito, tra la folla. Lo guarda come si guarda qualcuno che sta per cadere.']], // [nuovo]
          [['pensa', 'Lo ha riconosciuto adesso, tutto in una volta. Sei anni le sono tornati addosso davanti a un cadavere.']], // [nuovo]
        ],
      ],
      usa: [
        ['se', { flag: { agnese: 'risvegliata', taddeo: 'accusato' } },
          [
            ['dice', 'agnese', 'Hai liberato tutti. Ma chi ti ha dato il diritto di decidere chi deve morire?'], // [bibbia]
            ['pensa', 'Ferruccio non ha niente da risponderle. Abbassa gli occhi e passa oltre.'], // [nuovo]
          ],
          [
            ['dice', 'agnese', 'Fermati! Non voglio perderti un\'altra volta!'], // [bibbia]
            ['pensa', 'Gli afferra il braccio per tenerlo lì, per consegnarlo alle guardie prima che lo prenda la folla. Ferruccio scatta oltre di lei.'], // [bibbia, adattata]
          ],
        ],
        ['segna', 'epilogo-agnese-libera'],
        ['obiettivo', 'Fuggire dal Cortile, verso Piazza Dante.'], // [nuovo]
      ] },
    { id: 'cielo', nome: 'Il cielo', x: 120, y: 20, w: 400, h: 50,
      guarda: [['pensa', 'Azzurro. Non lo vedeva da sei anni. La luna ferma non c\'è più.']] }, // [nuovo]
    { id: 'verso-corso', nome: 'Il cancello verso la città', x: 0, y: 120, w: 50, h: 140, uscita: 'epilogo.libera-corso',
      se: { visto: 'epilogo-agnese-libera' },
      chiuso: [['pensa', 'Fra lui e il cancello c\'è Agnese. Non passerà senza guardarla in faccia.']] }, // [nuovo]
  ],
});

AV.quadro({
  id: 'epilogo.libera-corso', capitolo: 'epilogo', nome: 'Corso Trieste, nella luce',
  fondale: {
    immagine: 'avventura/epilogo-corso-libero',
    disegno: [
      ['cielo', { tono: 'alba' }],
      ['case', { n: 7, alto: 170, finestre: 3 }],
      ['finestra', { x: 470, y: 70, w: 34, h: 44, accesa: true }],
      ['suolo', { tipo: 'selciato', y: 252 }],
      ['statua', { x: 120, y: 252, h: 90 }],
      ['luce', { x: 300, y: 80, r: 220, colore: '#fcd34d' }],
    ],
    luce: { tono: 'alba' },
  },
  musica: 'liberta',
  entrata: [
    ['unaVolta', 'epilogo-libera-corso', [
      ['dice', 'didascalia', 'Comincia una breve fuga nel Corso, verso Piazza Dante. Tutti quelli che incontra gli sono ostili: alcuni cercano di arrestarlo, altri lo colpiscono in preda alla rabbia e al panico.'], // [bibbia, adattata]
      ['effetto', 'scossa'],
      ['dice', 'didascalia', 'In fondo al Corso, una guardia gli sbarra la strada.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'taddeo', nome: 'Taddeo', x: 380, y: 150, w: 44, h: 100, personaggio: 'taddeo',
      guarda: [['pensa', 'Taddeo. L\'uniforme della guardia, la faccia di un amico. Non sa più quale delle due indossare.']], // [nuovo]
      usa: [
        ['dice', 'didascalia', 'Se Violante viene uccisa, anche Taddeo diventa ostile a Ferruccio.'], // [bibbia]
        ['se', { flag: { taddeo: 'perdonato' } },
          [
            ['pensa', 'Gli sbarra la strada con la mano aperta, non con l\'arma.'], // [nuovo, dalla mappa]
            ['dice', 'taddeo', 'Una volta ti ho consegnato per paura. Stavolta vieni con me di tua volontà!'], // [bibbia]
            ['scelta', [
              { testo: 'Stringigli la mano aperta, poi lasciala', fai: [
                ['pensa', 'Un attimo solo. Taddeo capisce che non verrà, e non stringe.'], // [nuovo]
              ] },
              { testo: 'Scarta di lato e scatta oltre', fai: [
                ['pensa', 'Taddeo allunga il braccio e lo manca. Di poco. Forse apposta.'], // [nuovo]
              ] },
            ]],
          ],
          [
            ['dice', 'taddeo', 'È lui! L\'assassino della Signora! Prendetelo, è di qua!'], // [nuovo]
            ['dice', 'didascalia', 'Partecipa apertamente alla caccia, e usa la sua colpa presunta per distogliere l\'attenzione dai propri crimini.'], // [bibbia, adattata]
            ['pensa', 'Ferruccio scatta oltre, prima che gli altri arrivino.'], // [nuovo]
          ],
        ],
        ['segna', 'epilogo-taddeo-libera'],
      ] },
    { id: 'finestra', nome: 'La finestra di Mariella', x: 462, y: 62, w: 50, h: 60, sagoma: 'finestra',
      guarda: [
        ['pensa', 'Alla finestra c\'è la sagoma di Mariella. Al primo grido della folla si ritrae: è tornata la paura.'], // [nuovo, dalla mappa]
        ...MARIELLA_LIBERA,
        ['se', { flag: { taddeo: 'perdonato' } },
          [['pensa', 'Più tardi, Taddeo salirà quelle scale per starle accanto.']], // [nuovo, dalla mappa]
          [['pensa', 'Più tardi, quando Taddeo busserà, quella finestra gli verrà chiusa.']], // [nuovo, dalla mappa]
        ],
      ],
      usa: [['pensa', 'Ferruccio alza gli occhi alla finestra. Non c\'è tempo per salire. Non ce n\'è mai stato.']] }, // [nuovo]
    { id: 'statua', nome: 'La statua', x: 96, y: 160, w: 50, h: 92, sagoma: 'statua',
      guarda: [['pensa', 'Una statua di pietra. Ieri voltava la testa al suo passaggio. Oggi è inerte, come le statue devono essere.']] }, // [nuovo, §XVII]
    { id: 'gatto', nome: 'Un gatto', x: 220, y: 230, w: 34, h: 22, sagoma: 'gatto',
      guarda: [['pensa', 'Un gatto vero, arancione, che scappa per conto suo. Il Velo non può più fare gatti d\'ombra.']] }, // [nuovo, §XVII]
    { id: 'lavandaia', nome: 'Una lavandaia', x: 280, y: 160, w: 36, h: 90, personaggio: 'cittadino',
      guarda: [['pensa', 'Tiene in mano un secchio vuoto, come un\'arma.']], // [nuovo]
      usa: [['dice', 'cittadino', 'Statti luntano! Statti luntano \'a me e d\'\'e criature meje!']] }, // [nuovo]
    { id: 'verso-piazza', nome: 'Verso Piazza Dante', x: 590, y: 120, w: 50, h: 140, uscita: 'epilogo.libera-piazza',
      se: { visto: 'epilogo-taddeo-libera' },
      chiuso: [['pensa', 'Taddeo è in mezzo alla strada. Bisogna passare da lui.']] }, // [nuovo]
  ],
});

AV.quadro({
  id: 'epilogo.libera-piazza', capitolo: 'epilogo', nome: 'Piazza Dante, sotto il cielo azzurro',
  fondale: {
    immagine: 'avventura/epilogo-piazza-libera',
    disegno: [
      ['cielo', { tono: 'alba' }],
      ['palazzo', { x: 60, w: 520, h: 160, archi: 9, finestre: 9 }],
      ['porta', { x: 286, y: 120, w: 52, h: 96, stato: 'chiusa' }],
      ['statua', { x: 320, y: 230, h: 110 }],
      ['banco', { x: 120, y: 248, w: 110 }],
      ['suolo', { tipo: 'selciato', y: 250 }],
      ['luce', { x: 320, y: 40, r: 300, colore: '#fef3c7' }],
    ],
    luce: { tono: 'alba' },
  },
  musica: 'liberta',
  entrata: [
    ['unaVolta', 'epilogo-libera-piazza', [
      ['pensa', 'Piazza Dante. Lo stesso emiciclo della prima notte. Mai stato così bello: le facciate gialle, i panni stesi, il cielo che non finisce.'], // [nuovo, §XX]
      ['pensa', 'E tutte le finestre si chiudono quando passa lui.'], // [nuovo]
      ['obiettivo', 'Attraversare la piazza e lasciare Caserta.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'tonino', nome: 'Tonino', x: 140, y: 150, w: 44, h: 100, personaggio: 'tonino',
      guarda: [['pensa', 'Tonino, al suo banco. Gli occhi rossi.']], // [nuovo]
      usa: [
        ['se', { flag: { tonino_ricordo: 'restituito' } },
          [
            ['dice', 'didascalia', 'Tonino è tornato capace di soffrire e sa che Ferruccio lo ha aiutato. Ma conosce anche le opere di carità di Donna Luciana e non accetta che sia stata uccisa.'], // [bibbia, nome a schermo]
            ['dice', 'tonino', 'Mi hai ridato mia moglie nei ricordi. Ma questo non ti dava diritto di togliere una vita!'], // [bibbia]
            ['effetto', 'scossa'],
            ['pensa', 'Gli scaglia contro un piatto del banco, e tenta di fermarlo. Il piatto si rompe sul selciato.'], // [bibbia, adattata: l'oggetto è un piatto]
          ],
          [
            ['dice', 'didascalia', 'Il Velo scompare e Tonino ricorda improvvisamente Rosa.'], // [bibbia]
            ['pensa', 'Sconvolto dal dolore e dalla notizia, si unisce alla folla.'], // [bibbia, adattata]
            ['dice', 'tonino', 'E tu saresti quello che ci ha salvati?'], // [bibbia]
          ],
        ],
        ['segna', 'epilogo-tonino-libera'],
      ] },
    { id: 'targa', nome: 'La targa del 1839', x: 420, y: 150, w: 50, h: 40, sagoma: 'foglio',
      guarda: [
        ['dice', 'didascalia', '«In memoria degli uomini caduti nell\'adempimento del loro dovere.»'], // [bibbia]
        ['pensa', 'Il nome di Gaetano è assente.'], // [bibbia]
        ['se', { flag: { registro: 'conservato' } },
          [['pensa', 'Ma nel registro, stretto sotto la giacca, quel nome c\'è. La verità adesso può emergere. Non oggi: oggi nessuno ascolta.']], // [nuovo, §Gaetano]
          [['pensa', 'Il registro è cenere, alla Villa. Il nome di suo padre è soltanto in quello che ha visto.']], // [nuovo, §Gaetano]
        ],
      ],
      usa: [['pensa', 'Una volta l\'aveva colpita con la spada. Adesso ci passa la mano sopra, piano, dove manca un nome.']] }, // [nuovo]
    { ...PORTA_BOTTEGA },
    { id: 'bambino', nome: 'Un bambino', x: 240, y: 200, w: 28, h: 50, sagoma: 'bambina',
      guarda: [['pensa', 'Un bambino che chiama sua madre. La madre lo prende in braccio e lo porta via da lui.']] }, // [nuovo]
    { id: 'guardie', nome: 'Le guardie', x: 500, y: 150, w: 60, h: 100, personaggio: 'guardia',
      guarda: [['pensa', 'Arrivano dal Corso. Fra poco la piazza sarà chiusa.']], // [nuovo]
      usa: [['dice', 'guardia', 'In nome della legge! Fermatelo!']] }, // [nuovo]
    { id: 'fuggi', nome: 'Oltre la piazza', x: 580, y: 110, w: 60, h: 150,
      guarda: [['pensa', 'Il vicolo dietro il palazzo porta fuori città. Dopo, non c\'è più Caserta.']], // [nuovo]
      usa: [
        ['se', { visto: 'epilogo-tonino-libera' },
          [
            ['pensa', 'Ferruccio si volta un\'ultima volta verso la piazza. Poi corre.'], // [nuovo]
            ['dice', 'didascalia', 'Ferruccio riesce a fuggire.'], // [bibbia]
            ['segna', 'epilogo-finito'],
            ['finale'],
          ],
          [['pensa', 'Al banco, Tonino lo ha visto. Non può andarsene senza passare da lui.']], // [nuovo]
        ],
      ] },
  ],
});

// ======================================================================================================
// IL MONDO VELATO — Donna Luciana risparmiata (§XVI «Se Ferruccio risparmia Violante», §XVII colonna destra)
// ======================================================================================================

AV.quadro({
  id: 'epilogo.velata', capitolo: 'epilogo', nome: 'Piazza Dante, nella foschia',
  fondale: {
    immagine: 'avventura/epilogo-piazza-velata',
    disegno: [
      ['cielo', { tono: 'velo' }],
      ['palazzo', { x: 60, w: 520, h: 160, archi: 9, finestre: 9 }],
      ['porta', { x: 286, y: 120, w: 52, h: 96, stato: 'chiusa' }],
      ['finestra', { x: 470, y: 70, w: 34, h: 44, accesa: true }],
      ['statua', { x: 320, y: 230, h: 110 }],
      ['banco', { x: 120, y: 248, w: 110 }],
      ['suolo', { tipo: 'selciato', y: 250 }],
      ['fili', { n: 12 }],
      ['nebbia', { alfa: 0.35 }],
    ],
    luce: { tono: 'velo' },
  },
  musica: 'velo',
  entrata: [
    ['unaVolta', 'cap-epilogo', [['capitolo', 'epilogo']]],
    ['effetto', 'velo'],
    ['unaVolta', 'epilogo-velata-inizio', [
      ['dice', 'didascalia', 'I fili tornano a estendersi sulle case di Caserta. Le finestre si illuminano e le persone riprendono a sorridere.'], // [bibbia]
      ['dice', 'didascalia', 'La scena passa a Piazza Dante.'], // [bibbia]
      ['dice', 'didascalia', 'I commercianti sono tornati ai loro banchetti. I bambini giocano senza litigare. Nessuno sembra preoccupato.'], // [bibbia]
      ['pensa', 'Lo stesso emiciclo della prima notte. Ordinato, pulito, sicuro. Nessuno desidera niente di diverso.'], // [nuovo, §XX]
      ['diario', 'Ho abbassato la spada. Caserta sorride di nuovo. Sono l\'unico a ricordare perché.'], // [nuovo]
      ['obiettivo', 'Attraversare la piazza. Qualcuno, sotto il portico, sembra cercare qualcosa.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'tonino', nome: 'Tonino', x: 140, y: 150, w: 44, h: 100, personaggio: 'tonino',
      guarda: [['pensa', 'Tonino, al suo banco. Sorride al cielo coperto.']], // [nuovo]
      usa: [
        ['dice', 'tonino', 'Buongiorno, guagliò! Che bella giornata!'], // [bibbia]
        ['pensa', 'Ferruccio osserva il cielo coperto.'], // [bibbia]
        ['dice', 'tonino', 'Eh, bellissima. Proprio bellissima.'], // [bibbia]
        ['se', { flag: { tonino_ricordo: 'restituito' } },
          [
            ['dice', 'didascalia', 'Il Velo torna a cancellare il suo lutto. Tonino canticchia mentre sistema due piatti sul tavolo.'], // [bibbia]
            ['dice', 'tonino', 'Uno per me e uno per... boh. Sarà l\'abitudine.'], // [bibbia]
          ],
          [
            ['dice', 'didascalia', 'Tonino rimane identico al primo incontro.'], // [bibbia]
            ['dice', 'tonino', 'Sempre una bella giornata! Pure quando piove!'], // [bibbia]
          ],
        ],
        ['segna', 'epilogo-tonino-velata'],
      ] },
    { id: 'taddeo', nome: 'Taddeo, di ronda', x: 470, y: 150, w: 44, h: 100, personaggio: 'taddeo',
      guarda: [['pensa', 'Taddeo in uniforme, a passo di ronda. Come ogni giorno.']], // [nuovo]
      usa: [
        ['dice', 'taddeo', 'Buongiorno, signore. Tutto tranquillo, oggi. Tutto tranquillo.'], // [nuovo]
        ['pensa', 'Passandogli accanto rallenta. Lo fissa un istante, come se ricordasse. Poi il Velo lo riprende, e riparte sorridendo.'], // [nuovo, dalla mappa]
        ['dice', 'didascalia', 'Se Violante viene risparmiata, Taddeo continua a essere una guardia.'], // [bibbia]
        ['se', { flag: { taddeo: 'perdonato' } },
          [['dice', 'didascalia', 'La sua redenzione rimane incompleta: ricorda a tratti di aver tradito qualcuno, ma il Velo gli impedisce di sostenere il peso di quella memoria.']], // [bibbia, adattata]
          [['pensa', 'Non ha mai abbassato lo sguardo davanti a lui. Non comincerà oggi.']], // [nuovo]
        ],
        ['pensa', 'Ferruccio lo guarda allontanarsi senza fermarlo.'], // [nuovo, dalla mappa]
        ['segna', 'epilogo-taddeo-velata'],
      ] },
    { id: 'finestra', nome: 'La finestra di Mariella', x: 462, y: 62, w: 50, h: 60, sagoma: 'finestra',
      guarda: [
        ['pensa', 'Alla finestra, la sagoma di Mariella. Sorride, immobile. Da quanto tempo non si muove?'], // [nuovo, dalla mappa]
        ...MARIELLA_VELATA,
      ],
      usa: [
        ['se', { flag: { lettera_mariella: 'vera' } },
          [['pensa', 'Ferruccio ricorda la lettera di Mariella. «Non devi aggiustarmi.» Adesso qualcuno l\'ha aggiustata lo stesso.']], // [bibbia] la frase · [nuovo] il resto
          [['pensa', 'Ferruccio alza gli occhi alla finestra. Lei saluta con la mano, come si saluta un passante qualunque.']], // [nuovo]
        ],
      ] },
    { id: 'targa', nome: 'La targa del 1839', x: 400, y: 150, w: 50, h: 40, sagoma: 'foglio',
      guarda: [
        ['dice', 'didascalia', '«In memoria degli uomini caduti nell\'adempimento del loro dovere.»'], // [bibbia]
        ['dice', 'didascalia', 'I documenti vengono nuovamente alterati nella memoria collettiva. Il padre rimane il colpevole ufficiale.'], // [bibbia]
        ['se', { flag: { registro: 'conservato' } },
          [['pensa', 'Anche se lui ha conservato il registro. La carta dice il vero; nessuno ricorda di averla letta.']], // [bibbia, adattata]
          [['pensa', 'Il registro è bruciato. Della verità resta una sola copia: la sua memoria.']], // [nuovo]
        ],
      ],
      usa: [['pensa', 'Una volta l\'aveva colpita con la spada. Adesso la guarda, e passa oltre.']] }, // [nuovo, dalla mappa]
    { ...PORTA_BOTTEGA },
    { id: 'gatto', nome: 'Un gatto d\'ombra', x: 230, y: 230, w: 34, h: 22, sagoma: 'gatto',
      guarda: [['pensa', 'Un gatto d\'ombra si stira sotto il banco. Il Velo può ancora farne quanti ne vuole.']] }, // [nuovo, §XVII]
    { id: 'agnese', nome: 'Agnese, sotto il portico', x: 540, y: 150, w: 40, h: 100, personaggio: 'agnese',
      guarda: [['pensa', 'Agnese, sotto il portico. Tiene in mano un gomitolo rosso.']], // [nuovo]
      usa: [
        ['dice', 'didascalia', 'Non lo riconosce.'], // [bibbia]
        ['dice', 'agnese', 'Scusate... cercate qualcuno?'], // [bibbia]
        ['se', { flag: { sciarpa: 'al-collo' } },
          [['pensa', 'Ferruccio stringe la sciarpa e passa oltre.']], // [bibbia]
          [['pensa', 'Ferruccio porta la mano al collo, dove non c\'è niente. Poi passa oltre.']], // [nuovo]
        ],
        ['dice', 'agnese', 'Torno a San Leucio, allora. Ho un lavoro a metà.'], // [nuovo]
        ['segna', 'epilogo-agnese-portico'],
        ['obiettivo', 'Agnese è tornata alla manifattura di San Leucio.'], // [nuovo]
      ] },
    { id: 'verso-leucio', nome: 'Verso San Leucio', x: 590, y: 100, w: 50, h: 40, uscita: 'epilogo.velata-manifattura',
      se: { visto: 'epilogo-agnese-portico' },
      chiuso: [['pensa', 'Sotto il portico qualcuno sembra cercare qualcosa.']] }, // [nuovo]
  ],
});

AV.quadro({
  id: 'epilogo.velata-manifattura', capitolo: 'epilogo', nome: 'La manifattura di San Leucio',
  fondale: {
    immagine: 'avventura/epilogo-manifattura-velata',
    disegno: [
      ['cielo', { tono: 'interno' }],
      ['muro', { x: 0, y: 40, w: 640, h: 212, tono: 'chiaro' }],
      ['finestra', { x: 80, y: 70, w: 60, h: 90, accesa: true }],
      ['finestra', { x: 500, y: 70, w: 60, h: 90, accesa: true }],
      ['telaio', { x: 260, y: 140, w: 140, h: 110 }],
      ['suolo', { tipo: 'assi', y: 252 }],
      ['nebbia', { alfa: 0.25 }],
    ],
    luce: { tono: 'velo' },
  },
  musica: 'velo',
  entrata: [
    ['effetto', 'velo'],
    ['unaVolta', 'epilogo-manifattura', [
      ['pensa', 'I telai battono tutti insieme, allo stesso tempo. Le tessitrici sorridono tutte allo stesso modo.'], // [nuovo]
      ['pensa', 'Agnese è al suo telaio. Sorridente, apparentemente felice.'], // [bibbia, adattata]
    ]],
  ],
  punti: [
    { id: 'agnese', nome: 'Agnese', x: 300, y: 150, w: 44, h: 100, personaggio: 'agnese', posa: 1,
      guarda: [['pensa', 'Tesse una sciarpa lunga, rossa. Non sa per chi.']], // [nuovo]
      usa: [
        ['se', { flag: { agnese: 'risvegliata' } },
          [
            ['dice', 'didascalia', 'Donna Luciana le ha cancellato di nuovo i ricordi, ma alcuni gesti le sono rimasti impressi nel corpo.'], // [bibbia, adattata]
            ['pensa', 'Quando Ferruccio le passa davanti, Agnese si tocca istintivamente il polso, proprio come faceva lui.'], // [bibbia]
          ],
          [['pensa', 'Non aveva mai recuperato i ricordi. Continua semplicemente a tessere.']], // [bibbia, adattata]
        ],
        ['dice', 'agnese', 'Devo finire una sciarpa. Sento che qualcuno verrà a prenderla.'], // [bibbia]
        ['segna', 'epilogo-agnese-manifattura'],
      ] },
    { id: 'telaio', nome: 'Il telaio', x: 400, y: 150, w: 60, h: 100, sagoma: 'telaio',
      guarda: [['pensa', 'Sul telaio vuoto accanto al suo, qualcuno ha lasciato un filo rosso annodato. Nessuno ricorda chi.']] }, // [nuovo]
    { id: 'tessitrici', nome: 'Le tessitrici', x: 60, y: 160, w: 120, h: 90, personaggio: 'cittadino',
      guarda: [['pensa', 'Cantano. La stessa strofa, da quando è entrato.']], // [nuovo, §XVII: frasi ripetitive]
      usa: [['dice', 'cittadino', 'Che bella giornata, eh? Ogni giorno è una bella giornata, qua dentro.']] }, // [nuovo]
    { id: 'statua', nome: 'La statua del cortile', x: 520, y: 170, w: 46, h: 82, sagoma: 'statua',
      guarda: [['pensa', 'Fuori dalla finestra, la statua del cortile gira la testa per seguirlo. È ancora legata all\'incantesimo.']] }, // [nuovo, §XVII]
    { id: 'esci', nome: 'Esci dalla manifattura', x: 580, y: 160, w: 60, h: 100,
      guarda: [['pensa', 'Fuori c\'è Caserta, in pace. Lui solo sa quanto costa.']], // [nuovo]
      usa: [
        ['se', { visto: 'epilogo-agnese-manifattura' },
          [
            ['se', { flag: { sciarpa: 'al-collo' } }, [
              ['scelta', [
                { testo: 'Lascia la sciarpa rossa sul suo telaio', fai: [
                  ['pensa', 'La piega e la posa sul telaio, accanto alla sua. Quando lei alza gli occhi, lui è già sulla porta.'], // [nuovo]
                  ['segna', 'epilogo-sciarpa-lasciata'],
                ] },
                { testo: 'Tienila al collo ed esci', fai: [
                  ['pensa', 'La sciarpa resta al collo. È l\'unica cosa, a Caserta, che si ricorda di loro due.'], // [nuovo]
                ] },
              ]],
            ]],
            ['segna', 'epilogo-finito'],
            ['finale'],
          ],
          [['pensa', 'Agnese è lì, al suo telaio. Non può andarsene senza passarle davanti.']], // [nuovo]
        ],
      ] },
  ],
});

// ======================================================================================================
// LA BOTTEGA DI GAETANO — il finale segreto (production/finali-teatro.md §2, adattato all'avventura)
// ======================================================================================================

const TORNA_IN_PIAZZA = [['se', { flag: { violante: 'uccisa' } }, [['vai', 'epilogo.libera-piazza']], [['vai', 'epilogo.velata']]]];
const FORGIA = [
  ['dice', 'gaetano', 'Hai portato i miei ferri.'], // [nuovo]
  ['pensa', 'Gaetano prende le tenaglie, il punzone, l\'ago. Li mette nel fuoco insieme.'], // [nuovo]
  ['dice', 'gaetano', 'Le tenaglie tengono, il punzone firma, l\'ago cuce. Tre ferri fanno un paio di forbici.'], // [nuovo]
  ['dice', 'gaetano', 'La lamiera si taglia fredda. L\'oro no: l\'oro va tagliato caldo.'], // [nuovo, finali-teatro]
  ['suono', 'martello'],
  ['dice', 'didascalia', 'Le arroventa, le ribatte, le tempra. Tre colpi, una pausa, uno.'], // [nuovo, finali-teatro]
  ['dice', 'gaetano', 'Io resto qui. I ricordi non salgono le scale.'], // [nuovo, finali-teatro]
  ['dice', 'gaetano', 'Non lo fare per me, figlio. Io non te l\'ho mai chiesto.'], // [nuovo, finali-teatro]
  ['segna', 'forbici-temprate'],
  ['diario', 'Mio padre ha fatto dei suoi tre ferri un paio di forbici. In fondo alla bottega c\'è una scala che sale.'], // [nuovo]
];

AV.quadro({
  id: 'epilogo.bottega', capitolo: 'epilogo', nome: 'La bottega di Gaetano',
  fondale: {
    immagine: 'avventura/epilogo-bottega',
    disegno: [
      ['cielo', { tono: 'interno' }],
      ['muro', { x: 0, y: 30, w: 640, h: 222, tono: 'scuro' }],
      ['luce', { x: 220, y: 210, r: 140, colore: '#fb923c' }],
      ['scala', { x: 520, y: 20, w: 50, h: 232 }],
      ['fili', { n: 3 }],
      ['suolo', { tipo: 'tufo', y: 252 }],
    ],
    luce: { tono: 'interno' },
  },
  musica: 'fucina',
  entrata: [
    ['unaVolta', 'epilogo-bottega', [
      ['dice', 'didascalia', 'La brace è accesa. All\'incudine c\'è un uomo di spalle. Batte: tre colpi, una pausa, uno. Poi si ferma.'], // [nuovo, finali-teatro]
      ['dice', 'gaetano', 'Sei tornato.'], // [nuovo]
      ['se', { flag: { violante: 'uccisa' } },
        [['dice', 'gaetano', 'Fuori gridano il tuo nome. Qua dentro no.']], // [nuovo]
        [['dice', 'gaetano', 'Fuori sorridono tutti. Qua dentro il fuoco non sorride.']], // [nuovo]
      ],
    ]],
  ],
  punti: [
    { id: 'gaetano', nome: 'Gaetano', x: 200, y: 150, w: 48, h: 100, personaggio: 'gaetano',
      guarda: [['pensa', 'Le spalle larghe di suo padre. Il grembiule bruciato in tre punti, come lo ricordava.']], // [nuovo]
      usa: [['se', { visto: 'forbici-temprate' },
        [['dice', 'gaetano', 'Vai, se vuoi andare. Il fuoco resta acceso.']], // [nuovo, finali-teatro]
        FORGIA]],
      con: { 'ferro-tenaglie': [['se', { visto: 'forbici-temprate' }, [['dice', 'gaetano', 'Sono già forbici, figlio.']], FORGIA]], // [nuovo]
             'ferro-punzone': [['se', { visto: 'forbici-temprate' }, [['dice', 'gaetano', 'Sono già forbici, figlio.']], FORGIA]],
             'ferro-ago': [['se', { visto: 'forbici-temprate' }, [['dice', 'gaetano', 'Sono già forbici, figlio.']], FORGIA]] } },
    { id: 'incudine', nome: 'L\'incudine', x: 250, y: 214, w: 56, h: 38, sagoma: 'ferro',
      guarda: [['pensa', 'Sei anni di polvere, e sotto la polvere il ferro lucido. Qualcuno ci ha battuto sopra ogni notte.']] }, // [nuovo]
    { id: 'brace', nome: 'La brace', x: 140, y: 200, w: 50, h: 50,
      guarda: [['pensa', 'La fucina era spenta da sei anni. Adesso è accesa, e non c\'è legna.']] }, // [nuovo, finali-teatro]
    { id: 'fili', nome: 'Tre fili d\'oro', x: 330, y: 20, w: 120, h: 120,
      guarda: [['pensa', 'Dal buio sopra la scala scendono fili d\'oro. Non vanno a nessuna casa: salgono e basta. Chi li tiene?']] }, // [nuovo]
    { id: 'scala', nome: 'La scala a pioli', x: 520, y: 30, w: 50, h: 222,
      guarda: [['pensa', 'Una scala a pioli che sale nel buio. Sopra non c\'è il tetto. C\'è qualcosa di più alto.']], // [nuovo, finali-teatro]
      usa: [['se', { visto: 'forbici-temprate' },
        [
          ['dice', 'didascalia', 'La scala sale sopra la ribalta. Dove le Mani reggono i fili. Non si scende com\'eri salito.'], // [nuovo, finali-teatro]
          ['scelta', [
            { testo: 'Sali sopra la ribalta', fai: [
              ['dice', 'gaetano', 'Prima fate uscire i ragazzi.'], // [bibbia, l'unica battuta di Gaetano]
              ['dice', 'didascalia', 'Lo dice piano, stavolta. E guarda la scala.'], // [nuovo, finali-teatro]
              ['segna', 'ribalta-salita'],
              ['finale', 'segreto-sopra-la-ribalta'],
            ] },
            { testo: 'Resta ancora un poco', fai: [
              ['dice', 'gaetano', 'A domani, figlio. Il fuoco resta acceso.'], // [nuovo, finali-teatro]
            ] },
          ]],
        ],
        [['pensa', 'Gaetano non ha finito: aspetta qualcosa da lui. I ferri che porta addosso pesano.']]]] }, // [nuovo]
    { id: 'esci', nome: 'Torna in piazza', x: 0, y: 120, w: 50, h: 132,
      guarda: [['pensa', 'La porta della bottega, aperta sulla piazza.']], // [nuovo]
      usa: TORNA_IN_PIAZZA },
  ],
});

// ======================================================================================================
// I SEDICI FINALI. Ognuno: il percorso (§XIII) per l'esito di Caserta, poi Gregorio, Tonino, la chiusura.
// ======================================================================================================

/** Come esce il registro nei due mondi (§Gaetano, conseguenza sui finali). */
const REGISTRO_LIBERA_C = [['dice', 'didascalia', 'Fugge portando con sé la prova che un giorno potrebbe riabilitare suo padre.']]; // [bibbia, adattata]
const REGISTRO_LIBERA_B = [['dice', 'didascalia', 'Fugge con il solo ricordo di ciò che ha visto.']]; // [bibbia, adattata]
const REGISTRO_VELATA = [['dice', 'didascalia', 'Nel finale del Velo, i documenti vengono nuovamente alterati nella memoria collettiva. Il padre rimane il colpevole ufficiale.']]; // [bibbia]

AV.finale({ id: 'p1-verita-condivisa.uccisa', titolo: 'La verità condivisa', percorso: 1,
  se: { flag: { taddeo: 'perdonato', registro: 'conservato', agnese: 'risvegliata', violante: 'uccisa' } },
  scene: [
    ['dice', 'didascalia', 'La storia del padre ricostruita, l\'amore ritrovato, un amico che cerca di riscattarsi.'], // [bibbia, adattata]
    ['dice', 'didascalia', 'È il percorso più dolorosamente ironico. Ferruccio possiede le prove, ma nessuno vuole ascoltarle.'], // [bibbia]
    ['dice', 'didascalia', 'Taddeo cerca di arrestarlo per proteggerlo dalla folla; Agnese tenta di trattenerlo per salvarlo.'], // [bibbia]
    ['dice', 'didascalia', 'Taddeo confesserà ufficialmente la falsificazione e indicherà gli altri responsabili. Non oggi. Oggi la piazza non ascolta nessuno.'], // [bibbia, adattata] + [nuovo]
    ...REGISTRO_LIBERA_C,
    ['pensa', 'Sulla strada di Capua, all\'alba, apre il registro. Il nome di suo padre è lì, scritto giusto. Tre persone lo sanno. Bastano, per cominciare.'], // [nuovo]
    ...GREGORIO, ...TONINO_FINALE_LIBERA, ...CHIUSA_LIBERA,
  ],
  riassunto: 'Ha le prove, un amico e un amore; Caserta è libera e non vuole ascoltarlo.' });

AV.finale({ id: 'p1-verita-condivisa.risparmiata', titolo: 'La verità condivisa', percorso: 1,
  se: { flag: { taddeo: 'perdonato', registro: 'conservato', agnese: 'risvegliata', violante: 'risparmiata' } },
  scene: [
    ['dice', 'didascalia', 'La storia del padre ricostruita, l\'amore ritrovato, un amico che cerca di riscattarsi.'], // [bibbia, adattata]
    ['dice', 'didascalia', 'Le testimonianze vengono dimenticate, l\'amore di Agnese viene cancellato ancora una volta.'], // [bibbia]
    ['dice', 'didascalia', 'Il registro rimane come unica prova materiale di una verità che nessuno desidera conoscere.'], // [bibbia]
    ...REGISTRO_VELATA,
    ['pensa', 'La sera, nella stanza in affitto, Ferruccio rilegge il registro a lume di candela. Lo sa a memoria. Lo rilegge lo stesso.'], // [nuovo]
    ...GREGORIO, ...TONINO_FINALE_VELATA, ...CHIUSA_VELATA,
  ],
  riassunto: 'Aveva tutto: le prove, l\'amico, l\'amore. Il Velo se li riprende; resta una carta che nessuno vuole leggere.' });

AV.finale({ id: 'p2-sacrificio-sentimento.uccisa', titolo: 'Il sacrificio del sentimento', percorso: 2,
  se: { flag: { taddeo: 'perdonato', registro: 'conservato', agnese: 'sognante', violante: 'uccisa' } },
  scene: [
    ['dice', 'didascalia', 'Ha cercato la verità per suo padre, ma non ha avuto il coraggio di imporne il peso alla donna amata.'], // [bibbia]
    ['dice', 'didascalia', 'Agnese recupera tutto improvvisamente. Il loro primo vero incontro avviene mentre Ferruccio è accusato di omicidio.'], // [bibbia]
    ['dice', 'didascalia', 'Lei cerca di farlo consegnare alle guardie.'], // [bibbia]
    ['dice', 'didascalia', 'Taddeo cerca di arrestarlo per salvarlo: una resa, pensa, può impedirne l\'uccisione.'], // [bibbia, adattata]
    ...REGISTRO_LIBERA_C,
    ['pensa', 'Le aveva lasciato il sogno per risparmiarle il dolore. Il dolore l\'ha trovata lo stesso, tutto in un giorno, davanti a lui con la spada.'], // [nuovo]
    ...GREGORIO, ...TONINO_FINALE_LIBERA, ...CHIUSA_LIBERA,
  ],
  riassunto: 'Le aveva risparmiato la memoria; il Velo spezzato gliela rende tutta insieme, nel giorno peggiore.' });

AV.finale({ id: 'p2-sacrificio-sentimento.risparmiata', titolo: 'Il sacrificio del sentimento', percorso: 2,
  se: { flag: { taddeo: 'perdonato', registro: 'conservato', agnese: 'sognante', violante: 'risparmiata' } },
  scene: [
    ['dice', 'didascalia', 'Ha cercato la verità per suo padre, ma non ha avuto il coraggio di imporne il peso alla donna amata.'], // [bibbia]
    ['dice', 'didascalia', 'Agnese rimane inconsapevole.'], // [bibbia]
    ['dice', 'didascalia', 'Taddeo può comprendere l\'identità di Ferruccio nei momenti in cui il Velo si indebolisce, ma non riesce più a parlarne apertamente.'], // [bibbia]
    ...REGISTRO_VELATA,
    ['pensa', 'A volte, di ronda, Taddeo si ferma sotto la sua finestra. Apre la bocca. Poi sorride, e va avanti.'], // [nuovo]
    ...GREGORIO, ...TONINO_FINALE_VELATA, ...CHIUSA_VELATA,
  ],
  riassunto: 'Agnese resta serena, Taddeo quasi ricorda; la verità sta in un registro sotto il letto.' });

AV.finale({ id: 'p3-parola-contro-potere.uccisa', titolo: 'La parola contro il potere', percorso: 3,
  se: { flag: { taddeo: 'perdonato', registro: 'bruciato', agnese: 'risvegliata', violante: 'uccisa' } },
  scene: [
    ['dice', 'didascalia', 'L\'amore e l\'amicizia sopravvivono, ma la verità non ha più una prova scritta.'], // [bibbia]
    ['dice', 'didascalia', 'Taddeo tenta di testimoniare, ma la folla lo accusa di aver aiutato un assassino.'], // [bibbia]
    ['dice', 'taddeo', 'Ho falsificato io quelle carte! Gaetano non c\'entrava! Sentitemi!'], // [nuovo]
    ['dice', 'didascalia', 'Agnese chiede a Ferruccio di arrendersi prima che qualcuno rimanga ucciso.'], // [bibbia]
    ['dice', 'agnese', 'Arrenditi. Ti prego. Basta morti, oggi.'], // [nuovo]
    ...REGISTRO_LIBERA_B,
    ...GREGORIO, ...TONINO_FINALE_LIBERA, ...CHIUSA_LIBERA,
  ],
  riassunto: 'Restano un amico che testimonia e una donna che lo prega di arrendersi; nessuna carta li sostiene.' });

AV.finale({ id: 'p3-parola-contro-potere.risparmiata', titolo: 'La parola contro il potere', percorso: 3,
  se: { flag: { taddeo: 'perdonato', registro: 'bruciato', agnese: 'risvegliata', violante: 'risparmiata' } },
  scene: [
    ['dice', 'didascalia', 'L\'amore e l\'amicizia sopravvivono, ma la verità non ha più una prova scritta.'], // [bibbia]
    ['dice', 'didascalia', 'La testimonianza di Taddeo viene soffocata dal Velo.'], // [bibbia]
    ['dice', 'didascalia', 'Senza documenti, Ferruccio non possiede più nulla che possa confermare quanto accaduto.'], // [bibbia]
    ...REGISTRO_VELATA,
    ['pensa', 'Taddeo, certe sere, comincia una frase: «Tuo padre...». Non la finisce mai.'], // [nuovo]
    ...GREGORIO, ...TONINO_FINALE_VELATA, ...CHIUSA_VELATA,
  ],
  riassunto: 'Una testimonianza soffocata dal Velo e nessuna carta: della verità resta solo quello che lui ricorda.' });

AV.finale({ id: 'p4-peso-della-pieta.uccisa', titolo: 'Il peso della pietà', percorso: 4,
  se: { flag: { taddeo: 'perdonato', registro: 'bruciato', agnese: 'sognante', violante: 'uccisa' } },
  scene: [
    ['dice', 'didascalia', 'Ha scelto di proteggere le persone a cui vuole bene, evitando di costringerle ad affrontare il passato.'], // [bibbia]
    ['dice', 'didascalia', 'Ma è arrivato alla Reggia sempre più simile, nelle sue scelte, a Donna Luciana.'], // [bibbia, nome a schermo]
    ['dice', 'didascalia', 'Spezza la prigionia di una città alla quale aveva cercato di risparmiare la verità.'], // [bibbia]
    ['dice', 'didascalia', 'Gli altri recuperano improvvisamente ricordi che Ferruccio aveva deciso di nascondere.'], // [bibbia]
    ['dice', 'didascalia', 'Taddeo confessa, ma la sua testimonianza non può essere verificata.'], // [bibbia]
    ...REGISTRO_LIBERA_B,
    ...GREGORIO, ...TONINO_FINALE_LIBERA, ...CHIUSA_LIBERA,
  ],
  riassunto: 'Aveva nascosto il passato per pietà; uccidendo lei lo rovescia addosso a tutti in un colpo solo.' });

AV.finale({ id: 'p4-peso-della-pieta.risparmiata', titolo: 'Il peso della pietà', percorso: 4,
  se: { flag: { taddeo: 'perdonato', registro: 'bruciato', agnese: 'sognante', violante: 'risparmiata' } },
  scene: [
    ['dice', 'didascalia', 'Ha scelto di proteggere le persone a cui vuole bene, evitando di costringerle ad affrontare il passato.'], // [bibbia]
    ['dice', 'didascalia', 'Accetta la propria contraddizione.'], // [bibbia]
    ['dice', 'didascalia', 'La città resta tranquilla, Taddeo rimane una guardia e Agnese continua ad attendere qualcuno che non ricorda.'], // [bibbia]
    ['pensa', 'Sul balcone, Donna Luciana lo ha guardato come si guarda un allievo. Lui non ha abbassato gli occhi. Non li ha nemmeno alzati.'], // [nuovo]
    ...REGISTRO_VELATA,
    ...GREGORIO, ...TONINO_FINALE_VELATA, ...CHIUSA_VELATA,
  ],
  riassunto: 'Ha risparmiato a tutti il dolore, come lei. Ora la capisce, e non sa se è una colpa.' });

AV.finale({ id: 'p5-giustizia-senza-perdono.uccisa', titolo: 'La giustizia senza perdono', percorso: 5,
  se: { flag: { taddeo: 'accusato', registro: 'conservato', agnese: 'risvegliata', violante: 'uccisa' } },
  scene: [
    ['dice', 'didascalia', 'Ha scelto di conoscere tutta la verità, ma non è disposto a perdonare chi ha contribuito a nasconderla.'], // [bibbia]
    ['dice', 'didascalia', 'Taddeo conduce le guardie contro di lui per proteggere la propria posizione.'], // [bibbia]
    ['dice', 'didascalia', 'Agnese riconosce Ferruccio, ma non accetta il suo ricorso alla violenza.'], // [bibbia]
    ['dice', 'didascalia', 'Il registro rimane una prova per il futuro.'], // [bibbia]
    ...REGISTRO_LIBERA_C,
    ['pensa', 'Taddeo tenterà di nascondere la propria complicità. Ferruccio possiede comunque la prova. Basterà aspettare. Aspettare dove, non lo sa.'], // [bibbia, adattata] + [nuovo]
    ...GREGORIO, ...TONINO_FINALE_LIBERA, ...CHIUSA_LIBERA,
  ],
  riassunto: 'Ha la prova e ha avuto ragione; Agnese lo riconosce e non lo perdona, Taddeo guida la caccia.' });

AV.finale({ id: 'p5-giustizia-senza-perdono.risparmiata', titolo: 'La giustizia senza perdono', percorso: 5,
  se: { flag: { taddeo: 'accusato', registro: 'conservato', agnese: 'risvegliata', violante: 'risparmiata' } },
  scene: [
    ['dice', 'didascalia', 'Ha scelto di conoscere tutta la verità, ma non è disposto a perdonare chi ha contribuito a nasconderla.'], // [bibbia]
    ['dice', 'didascalia', 'Agnese viene nuovamente privata dei ricordi, mentre Taddeo nasconde le proprie responsabilità.'], // [bibbia]
    ['dice', 'didascalia', 'Ferruccio comprende che avere ragione non gli è servito a nulla.'], // [bibbia]
    ...REGISTRO_VELATA,
    ...GREGORIO, ...TONINO_FINALE_VELATA, ...CHIUSA_VELATA,
  ],
  riassunto: 'Aveva ragione su tutto; sotto il Velo, avere ragione non serve a niente.' });

AV.finale({ id: 'p6-prova-senza-amore.uccisa', titolo: 'La prova senza amore', percorso: 6,
  se: { flag: { taddeo: 'accusato', registro: 'conservato', agnese: 'sognante', violante: 'uccisa' } },
  scene: [
    ['dice', 'didascalia', 'Ha conservato tutto ciò che può dimostrare un\'ingiustizia, ma ha sacrificato i legami personali per perseguirla.'], // [bibbia]
    ['dice', 'didascalia', 'Fugge con il documento mentre Taddeo lo insegue.'], // [bibbia]
    ['dice', 'didascalia', 'Agnese recupera improvvisamente i propri ricordi e cerca di fermarlo tra la folla.'], // [bibbia]
    ...REGISTRO_LIBERA_C,
    ['pensa', 'Il registro pesa poco. È fatto di carta. Correndo, se lo stringe al petto come si stringe una persona.'], // [nuovo]
    ...GREGORIO, ...TONINO_FINALE_LIBERA, ...CHIUSA_LIBERA,
  ],
  riassunto: 'Corre via col registro stretto al petto; dietro, Taddeo lo insegue e Agnese, appena svegliata, lo chiama.' });

AV.finale({ id: 'p6-prova-senza-amore.risparmiata', titolo: 'La prova senza amore', percorso: 6,
  se: { flag: { taddeo: 'accusato', registro: 'conservato', agnese: 'sognante', violante: 'risparmiata' } },
  scene: [
    ['dice', 'didascalia', 'Ha conservato tutto ciò che può dimostrare un\'ingiustizia, ma ha sacrificato i legami personali per perseguirla.'], // [bibbia]
    ['dice', 'didascalia', 'Mantiene la prova di una verità che nessuno vuole riconoscere.'], // [bibbia]
    ['dice', 'didascalia', 'Agnese vive serenamente e Taddeo continua a negare il passato.'], // [bibbia]
    ...REGISTRO_VELATA,
    ...GREGORIO, ...TONINO_FINALE_VELATA, ...CHIUSA_VELATA,
  ],
  riassunto: 'Tiene la prova di una verità che nessuno vuole; Agnese è serena e Taddeo nega.' });

AV.finale({ id: 'p7-amore-sopra-ogni-cosa.uccisa', titolo: 'L\'amore sopra ogni cosa', percorso: 7,
  se: { flag: { taddeo: 'accusato', registro: 'bruciato', agnese: 'risvegliata', violante: 'uccisa' } },
  scene: [
    ['dice', 'didascalia', 'Non voleva più inseguire i documenti e i colpevoli della tragedia: desiderava soltanto tornare dalla persona amata.'], // [bibbia, adattata]
    ['dice', 'didascalia', 'Ma non è riuscito a rinunciare al rancore contro chi lo ha tradito.'], // [bibbia, adattata]
    ['dice', 'didascalia', 'Agnese gli chiede perché abbia scelto un\'ultima morte proprio quando avrebbero potuto ricominciare.'], // [bibbia]
    ['dice', 'agnese', 'Potevamo ricominciare. Perché proprio adesso, Ferruccio? Perché un\'altra morte?'], // [nuovo]
    ['dice', 'didascalia', 'Taddeo approfitta della situazione per accusarlo.'], // [bibbia]
    ['dice', 'didascalia', 'Taddeo riesce a negare pubblicamente il tradimento. Rimane però tormentato dalla colpa.'], // [bibbia]
    ...REGISTRO_LIBERA_B,
    ...GREGORIO, ...TONINO_FINALE_LIBERA, ...CHIUSA_LIBERA,
  ],
  riassunto: 'Voleva solo tornare da lei; lei gli chiede perché un\'ultima morte, e Taddeo lo accusa per salvarsi.' });

AV.finale({ id: 'p7-amore-sopra-ogni-cosa.risparmiata', titolo: 'L\'amore sopra ogni cosa', percorso: 7,
  se: { flag: { taddeo: 'accusato', registro: 'bruciato', agnese: 'risvegliata', violante: 'risparmiata' } },
  scene: [
    ['dice', 'didascalia', 'Non voleva più inseguire i documenti e i colpevoli della tragedia: desiderava soltanto tornare dalla persona amata.'], // [bibbia, adattata]
    ['dice', 'didascalia', 'Ferruccio sacrifica l\'ultima possibilità di recuperare stabilmente Agnese.'], // [bibbia]
    ['dice', 'didascalia', 'La vede sorridere, sapendo che quel sorriso non gli appartiene più.'], // [bibbia]
    ['dice', 'didascalia', 'Taddeo riesce a negare pubblicamente il tradimento. Rimane però tormentato dalla colpa.'], // [bibbia]
    ...REGISTRO_VELATA,
    ...GREGORIO, ...TONINO_FINALE_VELATA, ...CHIUSA_VELATA,
  ],
  riassunto: 'La vede sorridere e sa che quel sorriso non è più suo.' });

AV.finale({ id: 'p8-cavaliere-senza-nessuno.uccisa', titolo: 'Il cavaliere senza nessuno', percorso: 8,
  se: { flag: { taddeo: 'accusato', registro: 'bruciato', agnese: 'sognante', violante: 'uccisa' } },
  scene: [
    ['dice', 'didascalia', 'È il percorso più solitario. Non ha alleati, non possiede prove materiali e ha rinunciato alla possibilità di ritrovare il proprio amore prima del confronto finale.'], // [bibbia, adattata]
    ['dice', 'didascalia', 'La città torna libera e Ferruccio diventa il nemico pubblico.'], // [bibbia]
    ['dice', 'didascalia', 'Fugge senza poter contare su nessuno.'], // [bibbia]
    ...REGISTRO_LIBERA_B,
    ['pensa', 'Sulla strada, fuori Caserta, si volta. La città è bellissima. Non gli appartiene, e non l\'ha mai chiesto.'], // [nuovo]
    ...GREGORIO, ...TONINO_FINALE_LIBERA, ...CHIUSA_LIBERA,
  ],
  riassunto: 'Nessun alleato, nessuna prova, nessun amore: Caserta è libera e lui è il suo nemico.' });

AV.finale({ id: 'p8-cavaliere-senza-nessuno.risparmiata', titolo: 'Il cavaliere senza nessuno', percorso: 8,
  se: { flag: { taddeo: 'accusato', registro: 'bruciato', agnese: 'sognante', violante: 'risparmiata' } },
  scene: [
    ['dice', 'didascalia', 'È il percorso più solitario. Non ha alleati, non possiede prove materiali e ha rinunciato alla possibilità di ritrovare il proprio amore prima del confronto finale.'], // [bibbia, adattata]
    ['dice', 'didascalia', 'Accetta di vivere come l\'unico testimone cosciente di un mondo costruito sulla menzogna.'], // [bibbia]
    ['dice', 'didascalia', 'Non gli resta altro che la propria memoria.'], // [bibbia]
    ...REGISTRO_VELATA,
    ...GREGORIO, ...TONINO_FINALE_VELATA, ...CHIUSA_VELATA,
  ],
  riassunto: 'L\'unico sveglio in una città che sorride; gli resta soltanto la memoria.' });

// ======================================================================================================
// IL FINALE SEGRETO — «Sopra la Ribalta» (production/finali-teatro.md §2.4-2.5, adattato all'avventura)
// Non sceglie per Caserta: fuori, la città resta come l'ha lasciata la Reggia.
// ======================================================================================================

AV.finale({ id: 'segreto-sopra-la-ribalta', titolo: 'Sopra la Ribalta', percorso: 0,
  se: { flag: { taddeo: '*', registro: '*', agnese: '*', violante: '*' }, ha: TRE_FERRI, visto: ['fucina-visitata', 'ribalta-salita'] },
  scene: [
    ['dice', 'didascalia', 'Sopra la ribalta non c\'è cielo: c\'è la graticcia. Travi, corde, e sotto, piccola, tutta Caserta.'], // [nuovo, finali-teatro]
    ['dice', 'didascalia', 'Da ogni casa sale un filo. Da Tonino, da Taddeo, da Agnese al telaio. Anche dai polsi di Donna Luciana. Anche da lui.'], // [nuovo, finali-teatro adattata]
    ['dice', 'didascalia', 'Al gancio più alto è appesa una maschera nera. È quella che portava in faccia la prima notte.'], // [nuovo]
    ['effetto', 'sipario'],
    ['dice', 'didascalia', 'In cima a tutti i fili ci sono due mani. Guanti bianchi. Nessun volto, sopra. Solo le Mani, e un paio di forbici grandi come un portone.'], // [nuovo, finali-teatro]
    ['dice', 'burattinaio', 'BIS!'], // [nuovo, finali-teatro]
    ['dice', 'burattinaio', 'DA CAPO!'], // [nuovo, finali-teatro]
    ['dice', 'didascalia', 'Non sa dire altro. Non vuole altro: che la commedia non finisca.'], // [nuovo, finali-teatro]
    ['dice', 'didascalia', 'La Signora gli ha dato una città intera da far recitare. Il Velo l\'ha cucito lei. Ma le Mani sono più vecchie di lei, e di Caserta.'], // [nuovo, finali-teatro]
    ['dice', 'didascalia', 'Tutti i fili, salendo, si torcono in uno solo: il filo maestro. Lo tiene con due dita.'], // [nuovo, finali-teatro]
    ['effetto', 'scossa'],
    ['dice', 'didascalia', 'Le forbici colossali si chiudono dove un attimo prima c\'era Ferruccio. Tagliano l\'aria.'], // [nuovo, finali-teatro]
    ['pensa', 'Ferruccio ha in mano le forbici di suo padre. Piccole. Ancora calde di fucina.'], // [nuovo, finali-teatro]
    ['pensa', 'Non lo fa per suo padre. Lo fa lo stesso.'], // [nuovo, finali-teatro]
    ['dice', 'didascalia', 'Un colpo solo. Il filo maestro canta come una corda di violino, e si spezza.'], // [nuovo, finali-teatro]
    ['dice', 'didascalia', 'Le Mani si aprono. Per un momento cercano qualcosa da reggere. Poi restano guanti vuoti.'], // [nuovo, finali-teatro]
    ['effetto', 'anime'],
    ['dice', 'didascalia', 'I fili d\'oro cadono sulla città come pioggia. Giù, nessuno cade. Restano tutti in piedi lo stesso.'], // [nuovo, finali-teatro adattata]
    ['dice', 'didascalia', 'Nessuno gliel\'aveva chiesto. Nemmeno stavolta.'], // [nuovo, finali-teatro]
    ['effetto', 'sipario'],
    ['dice', 'didascalia', 'Il sipario cala. Stavolta nessuno grida bis.'], // [nuovo, finali-teatro]
    ['se', { flag: { violante: 'uccisa' } },
      [['dice', 'didascalia', 'Fuori c\'è Caserta libera, che lo odia. Nessun filo, adesso, li obbliga: lo scelgono.']], // [nuovo, finali-teatro]
      [['dice', 'didascalia', 'Fuori c\'è Caserta che sorride sotto il Velo. Ma la commedia che glielo faceva sembrare giusto è finita.']], // [nuovo, finali-teatro]
    ],
    ['pensa', 'Ferruccio scende la scala a viso scoperto. Nessuno lo tiene in piedi. Sta in piedi da solo.'], // [nuovo, finali-teatro]
    ['effetto', 'buio'],
    ['dice', 'didascalia', 'Sotto la maschera c\'era ancora qualcuno.'], // [nuovo, finali-teatro]
    ...TITOLI,
    ['dice', 'didascalia', 'Il sipario è calato per sempre. Chi vuole può ancora salire sul palco: stavolta per scelta.'], // [nuovo, finali-teatro]
    ...DOMANDA,
  ],
  riassunto: 'Sopra la ribalta, le Mani che reggevano tutti i fili: Ferruccio taglia il filo maestro con le forbici del padre.' });

/*
 * IMMAGINI DA FAR DISEGNARE (gioco/assets/avventura/, 640×360, teatro d'ombre in vista 3/4; la fascia y ≥ 300 resta
 * scura per l'interfaccia):
 *  - epilogo-cortile-libero.png   Il Cortile della Reggia di giorno: cielo azzurro intenso, marmo caldo, sagome della
 *                                  folla sulla destra, un fazzoletto bianco a terra al centro, un mantello rosso vuoto
 *                                  su un'armatura spezzata. Colori vivi: è il quadro più luminoso del gioco (§XX).
 *  - epilogo-corso-libero.png     Corso Trieste nella luce del mattino: facciate gialle, una finestra al primo piano
 *                                  (Mariella), una statua di pietra inerte a sinistra, panni stesi, nessun filo.
 *  - epilogo-piazza-libera.png    Piazza Dante (lo stesso emiciclo del prologo) sotto il cielo azzurro: banco di
 *                                  Tonino a sinistra, porta della bottega al centro con l'insegna del fabbro, la targa
 *                                  a destra, le finestre che si chiudono. Bella e ostile.
 *  - epilogo-piazza-velata.png    La stessa Piazza Dante nella foschia grigio-azzurra: luce uniforme e fredda, verdi
 *                                  pallidi, fili d'oro sottili sopra i tetti, il portico a destra, tutti sorridono.
 *  - epilogo-manifattura-velata.png La manifattura di San Leucio, luce bianca e piatta: file di telai identici, Agnese al
 *                                  centro, una sciarpa rossa a metà sul suo telaio (l'unica macchia di colore).
 *  - epilogo-bottega.png          La bottega di Gaetano: brace arancione, incudine, un uomo di spalle, a destra una
 *                                  scala a pioli che sale nel buio, da cui scendono tre fili d'oro.
 *  - finale-libera.png / finale-velata.png (facoltativi, per la galleria dei finali, 320×180): la strada fuori Caserta
 *                                  all'alba con una figura col registro sotto il braccio; Donna Luciana sul balcone
 *                                  con i fili d'oro che partono dalle dita.
 *  - finale-sopra-la-ribalta.png (facoltativo, 320×180): la graticcia, due grandi mani guantate di bianco, un filo che
 *                                  si spezza, una piccola figura con le forbici.
 */
