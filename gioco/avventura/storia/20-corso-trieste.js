/*
 * storia/20-corso-trieste.js — Capitolo 2: CORSO TRIESTE («Il tradimento»). Solo dati (contratto in ../LEGGIMI.md).
 * Fonti: trama/ferruccio-bibbia.md §V (Taddeo, righe 319-407), §IX (Mariella, 656-702), §III (117-144),
 * §XII (la Regina dei Debiti, 849-867); trama/storia.json, capitolo corso-trieste; trama/inizio-memoria-e-doni.md
 * (Mariella dà l'indizio del ferro che risuona dietro una porta; dopo Piazza e Corso si apre la Fucina).
 * Battute: // [bibbia] = parola per parola dalla bibbia; // [nuovo] = scritte per l'avventura.
 *
 * MAPPA DEL CAPITOLO
 *
 *   (piazza.centro) ◄── corso.inizio ──────────► corso.finestra ──────────► corso.fondo ──► (villa.cancello)
 *                       vetrine, portoni,        la finestra di Mariella    fine del Corso     [dopo la scelta]
 *                       Taddeo alla vetrina      │                          segna corso-percorso
 *                       [dopo la Regina]         ▼
 *                        │        │             corso.vicolo
 *                        ▼        ▼             il muro che suona vuoto → ferro-tenaglie (facoltative)
 *              corso.guardia   corso.bottega ──► corso.nido
 *              lanterna,       il banco dei     la Regina dei Debiti
 *              palanchino      pegni, le vespe  (bilancia, libro mastro)
 *
 * ATTRAVERSAMENTO
 *   1. corso.finestra: Mariella alla finestra, felice e vuota (scena obbligatoria corso-trieste.finestra-mariella).
 *      Parlando con lei: l'indizio del ferro che risuona nel vicolo (segna indizio-ferro).
 *   2. Enigma della luce: la lanterna spenta della garitta (corso.guardia) → Mariella l'accende alla sua lampada
 *      (con il cestino) → appesa al gancio del lampione davanti al banco dei pegni, attira lo sciame: la porta è libera.
 *   3. Confronto con la Regina dei Debiti (corso.nido, scena boss): (a) guardarla/avvicinarla: è fatta di promesse mai
 *      mantenute e pesa i desideri; (b) dal libro mastro la ricevuta di Gaetano, l'unica promessa mantenuta;
 *      (c) la ricevuta sul piatto vuoto della bilancia → la Regina si sfoglia in anime; resta il ricordo delle spade
 *      di legno (scena corso-trieste.passato-taddeo).
 *   4. corso.inizio: Taddeo accanto a una vetrina riconosce la spada (scena indispensabile corso-trieste.scelta-taddeo):
 *      SECONDA DECISIONE taddeo = perdonato | accusato. Poi corso-trieste.taddeo-perdonato (testimonianza scritta,
 *      lettera di Mariella sotto la finestra: corso-trieste.lettera-mariella) oppure corso-trieste.taddeo-accusato.
 *   5. Facoltativo: il muro che suona vuoto (corso.vicolo): bussare finché una pietra suona vuota, poi il palanchino
 *      della guardia → le tenaglie di Gaetano.
 *   6. corso.fondo: segna corso-percorso (la Fucina del Ricordo in piazza si apre: corso-trieste.fucina-del-ricordo è
 *      del capitolo della piazza) e l'uscita verso la Villa (segna corso-finito, USCITA → villa.cancello).
 *
 * ESCONO DAL CAPITOLO: flag taddeo, lettera_mariella, prove (solo se perdona); chiavi corso-percorso, corso-finito,
 *   regina-sciolta, tenaglie-prese; oggetti ferro-tenaglie (facoltativo), testimonianza-taddeo (se perdona),
 *   ricordo-spade-di-legno.
 */

AV.capitolo({ id: 'corso-trieste', titolo: 'Corso Trieste', ordine: 2, sottotitolo: 'Il tradimento' });

// --- La creatura del Corso (§XII). Non parla: ronza, e nel ronzio ci sono le promesse ---
AV.personaggio({ id: 'regina-debiti', nome: 'La Regina dei Debiti', colore: '#facc15', figura: { foglio: 'regina-vespa', alt: 96 } });

// --- Oggetti del capitolo ---
AV.oggetto({ id: 'lanterna-spenta', nome: 'Una lanterna spenta', descrizione: "La lanterna della ronda. Il vetro è pulito, lo stoppino nuovo: nessuno l'ha mai accesa, da quando la notte si è fermata.", // [nuovo]
  icona: { sagoma: 'lampione' },
  guarda: [['pensa', "Tutti i lampioni del Corso sono spenti. C'è una sola luce accesa, in tutta la strada: una finestra."]] }); // [nuovo]
AV.oggetto({ id: 'lanterna-accesa', nome: 'La lanterna accesa', descrizione: "Accesa alla lampada di Mariella. La fiamma è piccola e non trema: neanche il fuoco, qui, ha più fretta.", // [nuovo]
  icona: { sagoma: 'lampione' },
  guarda: [['pensa', "Le vespe che passano sopra la testa piegano verso la fiamma, poi riprendono la strada della Reggia. Le luci le chiamano."]] }); // [nuovo]
AV.oggetto({ id: 'palanchino', nome: 'Un palanchino', descrizione: 'Una sbarra di ferro col becco, di quelle che la guardia usa per le barricate. Pesa giusto.', // [nuovo]
  icona: { sagoma: 'ferro' },
  guarda: [['pensa', "Ferro dolce, battuto male. Mio padre l'avrebbe rifatto."]] }); // [nuovo]
AV.oggetto({ id: 'ricevuta-gaetano', nome: 'La ricevuta di Gaetano', descrizione: "Una pagina del libro mastro: «Gaetano F., fabbro. Ferri della cancellata grande: consegnati il giorno promesso.» Sotto, la firma di mio padre.", // [nuovo]
  icona: { sagoma: 'foglio' },
  guarda: [['pensa', "Tutte le altre pagine dicono «a lavori finiti», «il mese venturo», «avrete». Questa sola dice «consegnati». Mio padre ha tenuto la parola."]] }); // [nuovo]
AV.oggetto({ id: 'ricordo-spade-di-legno', nome: 'Il ricordo delle spade di legno', descrizione: "Un'anima della Regina si è fermata nella mia mano. Dentro ci sono due bambini con due spade di legno.", // [nuovo]
  icona: { sagoma: 'anima' },
  guarda: [
    ['dice', 'didascalia', 'Da bambini, Taddeo e Ferruccio giocavano tra le strade di Caserta, fingendo di essere cavalieri.'], // [bibbia]
    ['dice', 'didascalia', 'Ferruccio costruiva spade di legno. Taddeo voleva sempre essere il comandante.'], // [bibbia]
    ['dice', 'didascalia', 'Quando Gaetano muore, Taddeo promette di proteggere Ferruccio come un fratello.'], // [bibbia]
    ['pensa', 'Poi il ricordo si oscura: una guardia, una voce di donna, un nome detto piano. Il mio.'], // [nuovo]
  ] });
AV.oggetto({ id: 'testimonianza-taddeo', nome: 'La testimonianza di Taddeo', descrizione: "Scritta da Taddeo sul retro di un foglio di turno, firmata, col bollo della guardia. Il nome che ha dato, il giorno, a chi.", // [nuovo]
  icona: { sagoma: 'foglio' },
  guarda: [
    ['dice', 'taddeo', "«Io, Taddeo, guardia degli edifici reali, ho dato a Donna Luciana il nome di Ferruccio, figlio di Gaetano il fabbro, perché indagava sul crollo. In cambio lei mi promise la pace di mia sorella. Lo scrivo perché resti, anche se io non resto.»"], // [nuovo]
    ['pensa', 'La calligrafia trema solo sul mio nome.'], // [nuovo]
  ] });
AV.oggetto({ id: 'lettera-mariella', nome: 'La lettera di Mariella', descrizione: "Un foglio piegato in quattro, con l'inchiostro sbiadito. Mariella l'ha scritto prima del Velo.", // [nuovo]
  icona: { sagoma: 'foglio' },
  guarda: [
    ['dice', 'didascalia', "Se Taddeo viene perdonato, Ferruccio può leggere una lettera che Mariella aveva scritto prima dell'incantesimo."], // [bibbia]
    ['dice', 'mariella', 'Caro Taddeo,'], // [bibbia]
    ['dice', 'mariella', 'non devi aggiustarmi.'], // [bibbia]
    ['dice', 'mariella', 'Voglio soltanto che, quando ho paura, tu rimanga con me.'], // [bibbia]
    ['dice', 'mariella', 'Tua sorella.'], // [bibbia]
    ['segna', 'lettera-letta'],
    ['pensa', "Non è mia. Va restituita a chi l'ha avuta."], // [nuovo]
  ] });

// =====================================================================================================================
// 1. IL CORSO DI NOTTE — vetrine e portoni; dopo la Regina, Taddeo accanto a una vetrina (la seconda decisione)
// =====================================================================================================================
AV.quadro({
  id: 'corso.inizio', capitolo: 'corso-trieste', nome: 'Corso Trieste',
  fondale: { immagine: 'avventura/corso-inizio',
    disegno: [
      ['cielo', { tono: 'notte', luna: true, stelle: true }],
      ['case', { n: 7, alto: 170, finestre: 2 }],
      ['finestra', { x: 60, y: 150, w: 80, h: 80, accesa: false }],
      ['porta', { x: 300, y: 140, w: 60, h: 110, stato: 'chiusa' }],
      ['arco', { x: 420, y: 150, w: 50, h: 100 }],
      ['lampione', { x: 520, y: 110, h: 140, acceso: false }],
      ['forma', { punti: [[380, 70], [420, 50], [470, 60], [500, 45], [470, 80], [420, 85]], colore: '#1c1917', bordo: '#facc15' }],
      ['suolo', { tipo: 'selciato', y: 250 }],
      ['nebbia', { alfa: 0.15 }],
    ],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'cap-corso-trieste', [['capitolo', 'corso-trieste']]],
    ['unaVolta', 'corso-arrivo', [
      ['pensa', 'Il Corso è la strada dei negozi. Le vetrine sono accese di niente; i portoni chiusi come bocche.'], // [nuovo]
      ['pensa', 'In alto passano vespe, a file, tutte nella stessa direzione: verso la Reggia.'], // [nuovo]
      ['diario', 'Corso Trieste: le vetrine ferme, i lampioni spenti. Le vespe volano tutte verso la Reggia.'], // [nuovo]
      ['obiettivo', 'Scopri da dove vengono le vespe. C\'è una sola finestra accesa, più avanti.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'vetrina', nome: "La vetrina dell'orefice", x: 50, y: 140, w: 90, h: 100,
      guarda: [['pensa', 'Anelli, catenine, un piatto d\'argento. Nel vetro si specchia la mia faccia: nera, liscia, senza niente. Non mi riconoscerebbe nessuno.']], // [nuovo]
      usa: [['pensa', "La porta dell'orefice è chiusa. Dentro, il padrone lucida lo stesso anello da sei anni."]] }, // [nuovo]
    { id: 'taddeo', nome: 'Una guardia giovane', x: 145, y: 165, w: 44, h: 85, personaggio: 'taddeo', posa: 0,
      se: { visto: 'regina-sciolta', flag: { taddeo: '' } },
      guarda: [['pensa', 'Una guardia, la divisa slacciata, la mano sul vetro della vetrina. Ha la faccia di un ragazzo che giocava al comandante.']], // [nuovo]
      con: { '*': [['pensa', 'Prima deve vedermi. Mi avvicino.']] }, // [nuovo]
      usa: [
        ['dice', 'didascalia', 'Dopo aver sconfitto la Regina dei Debiti, Ferruccio trova Taddeo accanto a una vetrina.'], // [bibbia]
        ['se', { flag: { volto: 'umano' } },
          [['pensa', 'Mi guarda in faccia, ma non è la faccia che lo ferma.']], // [nuovo]
          [['pensa', 'Il mio volto è nero: non può riconoscermi. Ma i suoi occhi scendono al mio fianco.']]], // [nuovo]
        ['dice', 'didascalia', 'Il giovane riconosce la spada.'], // [bibbia]
        ['dice', 'taddeo', "No... Quella l'abbiamo forgiata insieme."], // [bibbia]
        ['dice', 'taddeo', 'Ti prego, lascia che ti spieghi.'], // [bibbia]
        ['pensa', "L'anima della Regina me l'ha mostrato: due bambini con le spade di legno. E una guardia che dà un nome a Donna Luciana. Il mio."], // [nuovo]
        ['dice', 'didascalia', 'Ferruccio può scegliere come reagire.'], // [bibbia]
        ['pensa', "Se rinfodero la spada lo ascolto: saprò tutto e lui resterà dalla mia parte, con la sua parola scritta. Ma chi mi ha venduto non pagherà niente."], // [nuovo]
        ['pensa', "Se gliela punto alla gola non saprà mai che cosa mi è costato. Ma perdo l'unico testimone di quel patto, e lui scapperà a nascondere le prove."], // [nuovo]
        ['scelta', [
          { testo: 'Rinfodera la spada e ascoltalo', fai: [
            ['flag', 'taddeo', 'perdonato'], ['flag', 'lettera_mariella', 'vera'], ['flag', 'prove', 'vera'],
            ['dice', 'didascalia', 'Taddeo confessa di aver denunciato Ferruccio per salvare Mariella.'], // [bibbia]
            ['dice', 'taddeo', 'Mi aveva promesso che mia sorella sarebbe stata bene.'], // [bibbia]
            ['dice', 'taddeo', 'E io le ho creduto. Che Dio mi perdoni.'], // [bibbia]
            ['dice', 'didascalia', 'Ferruccio rinfodera la spada.'], // [bibbia]
            ['pensa', 'Resto fermo un momento. Poi gli metto una mano sulla spalla. Trema come quando perdeva a cavalieri.'], // [nuovo]
            ['dice', 'taddeo', 'Ho scritto tutto, ieri notte. Il nome, il giorno, a chi. Tienilo tu: io non sono buono a tenere niente.'], // [nuovo]
            ['prendi', 'testimonianza-taddeo'],
            ['dice', 'didascalia', 'Taddeo decide di aiutarlo. Non diventa un secondo protagonista: lascia messaggi, documenti e testimonianze lungo il percorso obbligatorio.'], // [bibbia]
            ['dice', 'taddeo', "Vieni sotto la finestra di mia sorella. C'è una cosa che lei mi ha scritto, prima. Non ho mai avuto il coraggio di leggerla fino in fondo."], // [nuovo]
            ['diario', 'Ho perdonato Taddeo. Mi ha consegnato a Donna Luciana per la pace di sua sorella. Adesso la sua testimonianza è mia.'], // [nuovo]
            ['obiettivo', 'Raggiungi Taddeo sotto la finestra di Mariella.'], // [nuovo]
          ] },
          { testo: 'Puntagli la spada alla gola', fai: [
            ['flag', 'taddeo', 'accusato'], ['flag', 'lettera_mariella', 'falsa'],
            ['dice', 'didascalia', 'Ferruccio gli punta la spada alla gola.'], // [bibbia]
            ['dice', 'didascalia', 'Taddeo arretra.'], // [bibbia]
            ['effetto', 'scossa'],
            ['dice', 'taddeo', 'Se mi uccidi, lei resterà comunque là dentro!'], // [bibbia]
            ['dice', 'didascalia', 'Ferruccio non lo uccide, ma rifiuta di ascoltarlo.'], // [bibbia]
            ['pensa', "Abbasso la lama. Gli volto le spalle e mi copro un orecchio con la mano. Non voglio le sue ragioni."], // [nuovo]
            ['dice', 'didascalia', 'Taddeo fugge e decide di cercare i documenti che potrebbero incriminarlo.'], // [bibbia]
            ['effetto', 'buio'],
            ['pensa', 'I suoi stivali corrono sul selciato, verso il fondo del Corso. Poi più niente.'], // [nuovo]
            ['diario', 'Ho accusato Taddeo. Mi ha venduto a Donna Luciana e adesso corre a far sparire le carte che lo inchiodano.'], // [nuovo]
            ['obiettivo', 'Il Corso continua oltre la finestra di Mariella, verso la Villa Comunale.'], // [nuovo]
          ] },
        ]],
        ['segna', 'taddeo-scelto'],
      ] },
    { id: 'cittadino', nome: 'Un uomo con un foglio', x: 230, y: 172, w: 40, h: 78, personaggio: 'cittadino', posa: 0,
      guarda: [['se', { visto: 'regina-sciolta' },
        [['pensa', 'Ha abbassato il foglio. Lo guarda come si guarda una lettera di un morto.']], // [nuovo]
        [['pensa', 'Tiene davanti a sé un foglio con un bollo reale, come uno stendardo. Sorride al portone.']]]], // [nuovo]
      usa: [['se', { visto: 'regina-sciolta' },
        [['dice', 'cittadino', "Una casa, a lavori finiti. Me l'avevano scritta. E io che aspettavo qua fuori... Da quanto aspetto?"]], // [nuovo]
        [['dice', 'cittadino', "Una casa, a lavori finiti. Ce l'hanno promessa a tutti, a noi della Reggia. Aspetto qua. Sto bene, sto."]]]] }, // [nuovo]
    { id: 'portone', nome: 'Un portone', x: 300, y: 140, w: 60, h: 110, sagoma: 'porta',
      guarda: [['pensa', 'Batacchio a forma di mano. Sopra, inciso, un giglio. Ce ne sono su tutti i portoni del Corso.']], // [nuovo]
      usa: [['pensa', 'Busso. Dietro, qualcuno ride piano, contento, e non viene ad aprire.']] }, // [nuovo]
    { id: 'vespe', nome: 'Le vespe', x: 380, y: 40, w: 130, h: 60,
      guarda: [['se', { visto: 'regina-sciolta' },
        [['pensa', 'Non ne passano più. Il cielo sopra il Corso è vuoto, e la luna sembra più grande.']], // [nuovo]
        [['pensa', 'Ogni vespa porta un filo di luce tra le zampe, sottile come un capello. Escono dal banco dei pegni e vanno alla Reggia.']]]] }, // [nuovo]
    { id: 'verso-piazza', nome: 'Verso Piazza Dante', x: 0, y: 120, w: 30, h: 150,
      guarda: [['pensa', 'Di là c\'è la piazza, e la bottega di mio padre.']], // [nuovo]
      uscita: 'piazza.centro', usa: [['segna', 'corso-verso-piazza']] },
    { id: 'verso-guardia', nome: 'Il posto di guardia', x: 420, y: 150, w: 50, h: 100, uscita: 'corso.guardia',
      guarda: [['pensa', 'Sotto il portico, una garitta di legno e una lanterna appesa al chiodo.']] }, // [nuovo]
    { id: 'verso-bottega', nome: 'Il banco dei pegni', x: 480, y: 130, w: 30, h: 120, uscita: 'corso.bottega',
      guarda: [['pensa', 'Un vicolo corto, e in fondo un\'insegna: BANCO DI PEGNI E PRESTITI. Le vespe escono da lì.']] }, // [nuovo]
    { id: 'verso-finestra', nome: 'Più avanti, la finestra accesa', x: 560, y: 120, w: 70, h: 140, uscita: 'corso.finestra',
      guarda: [['pensa', 'Una sola finestra accesa, in tutta la strada.']] }, // [nuovo]
  ],
});

// =====================================================================================================================
// 2. LA FINESTRA DI MARIELLA — felice e vuota; l'indizio del ferro; dopo il perdono, la lettera
// =====================================================================================================================
AV.quadro({
  id: 'corso.finestra', capitolo: 'corso-trieste', nome: 'La finestra di Mariella',
  fondale: { immagine: 'avventura/corso-finestra',
    disegno: [
      ['cielo', { tono: 'notte', luna: true }],
      ['case', { n: 4, alto: 200, finestre: 1 }],
      ['finestra', { x: 250, y: 60, w: 80, h: 70, accesa: true }],
      ['luce', { x: 290, y: 95, r: 120, colore: '#fde68a' }],
      ['porta', { x: 262, y: 160, w: 56, h: 90, stato: 'chiusa' }],
      ['arco', { x: 30, y: 140, w: 60, h: 110 }],
      ['suolo', { tipo: 'selciato', y: 250 }],
    ],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'finestra-mariella', [
      ['pensa', 'Sopra il portone, una finestra accesa. Una ragazza seduta, le mani in grembo.'], // [nuovo]
      ['dice', 'didascalia', 'Adesso trascorre intere giornate seduta accanto alla finestra, sorridendo.'], // [bibbia]
      ['pensa', 'Mi fermo sotto la finestra e alzo gli occhi. Lei sorride a me come sorride alla strada vuota.'], // [nuovo]
      ['diario', 'Una ragazza alla finestra, l\'unica luce del Corso. Sorride sempre. Non ha paura di niente.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'mariella', nome: 'La ragazza alla finestra', x: 250, y: 60, w: 80, h: 70, personaggio: 'mariella', posa: 0,
      guarda: [['pensa', 'Ha il viso di chi ha dormito bene per sei anni. Gli occhi sono fermi come quelli delle statue della Villa.']], // [nuovo]
      usa: [['dialogo', 'mariella.finestra']],
      con: {
        'lanterna-spenta': [
          ['pensa', 'Alzo la lanterna spenta verso di lei.'], // [nuovo]
          ['dice', 'mariella', "Ah, vi serve la luce? Aspettate."], // [nuovo]
          ['pensa', 'Cala un cestino legato a una corda. Ci metto la lanterna; il cestino risale, e ridiscende con la fiamma accesa.'], // [nuovo]
          ['dice', 'mariella', "Tenete. Prima il buio mi faceva paura, sapete? Dormivo con tre candele. Adesso ne basta una, e nemmeno."], // [nuovo]
          ['togli', 'lanterna-spenta'], ['prendi', 'lanterna-accesa'],
          ['diario', 'Mariella mi ha acceso la lanterna. Le vespe vanno dietro alle luci.'], // [nuovo]
          ['obiettivo', 'Le vespe escono dal banco dei pegni. Con la lanterna puoi portarle lontano dalla porta.'], // [nuovo]
        ],
        'lettera-mariella': [['pensa', 'Lei non la riconoscerebbe. È a Taddeo che va restituita.']], // [nuovo]
        'testimonianza-taddeo': [['pensa', 'No. Non è a lei che si mostra questo.']], // [nuovo]
        '*': [['dice', 'mariella', 'Che bello. Tutto è bello, stanotte.']], // [nuovo]
      } },
    { id: 'portone-mariella', nome: 'Il portone di casa', x: 262, y: 160, w: 56, h: 90, sagoma: 'porta',
      guarda: [['pensa', 'Sullo stipite, una tacca per ogni anno, all\'altezza di due bambini. Poi le tacche smettono.']], // [nuovo]
      usa: [['pensa', 'È sprangato da dentro.']] }, // [nuovo]
    { id: 'gerani', nome: 'I gerani', x: 340, y: 110, w: 50, h: 24,
      guarda: [['pensa', 'Sul davanzale, un vaso di gerani secchi. Lei li innaffia lo stesso, sorridendo, e l\'acqua cade sul selciato.']] }, // [nuovo]
    { id: 'taddeo', nome: 'Taddeo', x: 380, y: 165, w: 44, h: 85, personaggio: 'taddeo', posa: 0,
      se: { flag: { taddeo: 'perdonato' } },
      guarda: [['pensa', 'Guarda la finestra della sorella e non osa chiamarla.']], // [nuovo]
      usa: [['dialogo', 'taddeo.finestra']],
      con: {
        'lettera-mariella': [['se', { visto: 'lettera-letta' },
          [
            ['pensa', 'Ripiego la lettera lungo le sue pieghe e gliela porgo con tutte e due le mani.'], // [nuovo]
            ['dice', 'didascalia', 'Taddeo comprende di aver tradito Ferruccio per ottenere qualcosa che Mariella non gli aveva mai chiesto.'], // [bibbia]
            ['dice', 'taddeo', "«Non devi aggiustarmi.» E io sono andato a cercare chi l'aggiustasse. Per non sentirla piangere io."], // [nuovo]
            ['togli', 'lettera-mariella'], ['segna', 'lettera-restituita'],
            ['diario', 'La lettera di Mariella: «Non devi aggiustarmi.» Taddeo l\'ha tradita due volte, me e lei, per una cosa che lei non aveva chiesto.'], // [nuovo]
            ['obiettivo', 'Il Corso continua verso la Villa Comunale. In fondo al Corso c\'è la strada.'], // [nuovo]
          ],
          [['pensa', 'Prima voglio sapere che cosa c\'è scritto.']]]], // [nuovo]
        'ricordo-spade-di-legno': [
          ['pensa', 'Apro la mano. Dentro la luce, due bambini con le spade di legno.'], // [nuovo]
          ['dice', 'taddeo', 'Io volevo sempre fare il comandante. E tu me lo lasciavi fare. Che comandante sono stato.'], // [nuovo]
        ],
        'testimonianza-taddeo': [['dice', 'taddeo', 'Tienila. Se un giorno ti serve, io dirò che è vera. Davanti a chiunque.']], // [nuovo]
        '*': [['pensa', 'Taddeo guarda solo la finestra.']], // [nuovo]
      } },
    { id: 'vetrina-buia', nome: 'Una vetrina buia', x: 450, y: 150, w: 80, h: 90,
      guarda: [['se', { flag: { taddeo: 'accusato' } },
        [['pensa', 'Sul vetro, l\'impronta di una mano, all\'altezza di un uomo che è scappato. La sua.']], // [nuovo]
        [['pensa', 'Una merceria. Rocchetti di filo di tutti i colori, e nessuno che cuce.']]]] }, // [nuovo]
    { id: 'verso-vicolo', nome: 'Il vicolo dietro la casa', x: 30, y: 140, w: 60, h: 110, uscita: 'corso.vicolo',
      guarda: [['pensa', 'Un vicolo stretto gira dietro la casa di Mariella.']] }, // [nuovo]
    { id: 'verso-inizio', nome: 'Indietro, verso le vetrine', x: 100, y: 200, w: 60, h: 60, uscita: 'corso.inizio',
      guarda: [['pensa', 'Le vetrine, il posto di guardia, il banco dei pegni.']] }, // [nuovo]
    { id: 'verso-fondo', nome: 'In fondo al Corso', x: 580, y: 120, w: 50, h: 150, uscita: 'corso.fondo',
      se: { visto: 'taddeo-scelto' },
      chiuso: [['pensa', 'Il Corso continua, ma il fondo è pieno di vespe che vanno e vengono. Prima voglio capire da dove escono.']], // [nuovo]
      guarda: [['pensa', 'Laggiù il Corso finisce e comincia la strada per la Villa Comunale.']] }, // [nuovo]
  ],
});

AV.dialogo({ id: 'mariella.finestra', con: 'mariella',
  inizio: [
    ['dice', 'mariella', 'Buonasera! Che bella notte, vero? È sempre la stessa, ed è sempre bella.'], // [nuovo]
  ],
  saluto: [['dice', 'mariella', 'Siete ancora qua? Che bello.']], // [nuovo]
  temi: [
    { id: 'buio', testo: 'Indica la strada buia', unaVolta: true, fai: [
      ['dice', 'mariella', "Il buio? Prima mi faceva paura. Pure le porte chiuse, pure i rumori. Adesso niente. Niente mi fa niente."], // [nuovo]
      ['pensa', 'Lo dice ridendo, come una cosa bella.'], // [nuovo]
    ] },
    { id: 'famiglia', testo: 'Indica la casa, poi posa la mano sul cuore', unaVolta: true, fai: [
      ['dice', 'mariella', "Ci sta mio fratello, Taddeo. Fa la guardia, agli edifici del re. Torna tardi."], // [nuovo]
      ['dice', 'mariella', "Prima mi sentiva piangere, la notte. Si sedeva fuori dalla porta. Adesso non piango più, e lui non si siede più."], // [nuovo]
      ['diario', 'La ragazza si chiama Mariella. Suo fratello è Taddeo, guardia degli edifici reali. Taddeo.'], // [nuovo]
    ] },
    { id: 'ferro', testo: "Porta la mano all'orecchio", unaVolta: true, fai: [
      ['dice', 'mariella', "Sentite? No, adesso no. Ma certe notti, nel vicolo dietro casa, il ferro risuona dietro una porta murata. Tin. Tin."], // [nuovo]
      ['dice', 'mariella', "Prima mi svegliava e mi metteva paura. Adesso lo conto, come le pecore."], // [nuovo]
      ['segna', 'indizio-ferro'],
      ['diario', 'Mariella: nel vicolo dietro casa sua il ferro risuona dietro una porta murata.'], // [nuovo]
    ] },
    { id: 'velo', testo: 'Indica la Reggia, poi le vespe', unaVolta: true, fai: [
      ['dice', 'mariella', "Una signora bellissima, mi ha detto Taddeo. Ci ha tolto la paura a tutti. Io non l'ho mai vista. Ma le voglio bene."], // [nuovo]
    ] },
    { id: 'dopo-accusa', testo: 'Indica la strada dove è corso Taddeo', se: { flag: { taddeo: 'accusato' } }, unaVolta: true, fai: [
      ['dice', 'mariella', 'Taddeo è passato di corsa. Non mi ha salutata. Fa niente: tornerà.'], // [nuovo]
    ] },
    { id: 'dopo-perdono', testo: 'Indica Taddeo, sotto la finestra', se: { flag: { taddeo: 'perdonato' } }, unaVolta: true, fai: [
      ['dice', 'mariella', 'Mio fratello mi guarda e piange. Che strano. Io no.'], // [nuovo]
    ] },
  ] });

AV.dialogo({ id: 'taddeo.finestra', con: 'taddeo',
  inizio: [
    ['dice', 'taddeo', "Lei non si ricorda niente di prima. Io sì, è questo il guaio."], // [nuovo]
    ['dice', 'taddeo', "L'ha scritta prima. Prima della Signora. Leggila tu: io arrivo sempre alla seconda riga e mi fermo."], // [nuovo]
    ['prendi', 'lettera-mariella'],
    ['obiettivo', 'Leggi la lettera di Mariella, poi restituiscila a Taddeo.'], // [nuovo]
  ],
  saluto: [['dice', 'taddeo', 'Non ti seguo, Ferruccio. Ma dove passerai tu, io sarò passato prima.']], // [nuovo]
  temi: [
    { id: 'perche', testo: 'Indica la finestra, poi te stesso', unaVolta: true, fai: [
      ['dice', 'taddeo', "Piangeva tutte le notti, dal crollo. Le porte chiuse, i rumori. Una notte quella donna mi ha fermato al cancello e mi ha detto che Mariella non meritava ciò che aveva vissuto."], // [nuovo]
      ['dice', 'taddeo', 'Aveva ragione. Non lo meritava. Ma neanche tu.'], // [nuovo]
    ] },
    { id: 'aiuto', testo: 'Indica la fine del Corso', unaVolta: true, fai: [
      ['dice', 'taddeo', "Alla Villa ci sono le carte del crollo. Io non posso venire, mi conoscono tutti. Lascerò quello che trovo dove lo trovi tu."], // [nuovo]
    ] },
  ] });

// =====================================================================================================================
// 3. IL VICOLO — il muro che suona vuoto (facoltativo): le tenaglie di Gaetano
// =====================================================================================================================
AV.quadro({
  id: 'corso.vicolo', capitolo: 'corso-trieste', nome: 'Il vicolo dietro la casa',
  fondale: { immagine: 'avventura/corso-vicolo',
    disegno: [
      ['cielo', { tono: 'notte', luna: true }],
      ['muro', { x: 0, y: 60, w: 640, h: 190, tono: 'tufo' }],
      ['forma', { punti: [[300, 120], [380, 120], [380, 250], [300, 250]], colore: '#a8a29e', bordo: '#57534e' }],
      ['luce', { x: 580, y: 40, r: 80, colore: '#fde68a' }],
      ['suolo', { tipo: 'tufo', y: 250 }],
    ],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'vicolo-arrivo', [
      ['se', { visto: 'indizio-ferro' },
        [['pensa', 'Il vicolo dietro casa di Mariella. Una porta murata, dice lei. Il muro è tutto uguale, tufo su tufo.']], // [nuovo]
        [['pensa', 'Un vicolo cieco. Il muro è tufo vecchio; in un punto c\'è stata una porta, poi qualcuno l\'ha chiusa.']]], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'pietra-alta', nome: 'Il tufo vecchio, a sinistra', x: 150, y: 110, w: 90, h: 120,
      guarda: [['pensa', 'Tufo giallo, mangiato dal tempo, con le righe dei carri.']], // [nuovo]
      usa: [['pensa', 'Busso con le nocche. Pieno. Tufo su tufo fino alla casa di là.']], // [nuovo]
      con: { 'palanchino': [['pensa', 'Qui è pieno. Spaccherei il muro di una casa.']] } }, // [nuovo]
    { id: 'porta-murata', nome: 'La porta murata', x: 300, y: 120, w: 80, h: 130,
      se: { nonVisto: 'muro-aperto' },
      guarda: [['pensa', 'Il segno di un arco nel muro. Le pietre dentro sono più chiare, la calce è fresca: qualcuno ha murato questa porta da poco, al tempo del crollo.']], // [nuovo]
      usa: [
        ['pensa', 'Busso dove la calce è chiara.'], // [nuovo]
        ['suono', 'colpo'],
        ['pensa', 'Tum. Vuoto. E dietro, piano, un tintinnio di ferro che risponde. Tin. Tin.'], // [nuovo]
        ['segna', 'muro-vuoto'],
        ['unaVolta', 'diario-muro', [
          ['diario', 'Nel vicolo, una porta murata suona vuota: dietro c\'è del ferro. Con le mani non la apro.'], // [nuovo]
          ['obiettivo', 'Serve qualcosa per fare leva fra le pietre della porta murata.'], // [nuovo]
        ]],
      ],
      con: {
        'palanchino': [['se', { visto: 'muro-vuoto' },
          [
            ['pensa', 'Infilo il becco del palanchino nella calce fresca. Una pietra cede, poi un\'altra.'], // [nuovo]
            ['effetto', 'scossa'], ['suono', 'crollo'],
            ['pensa', 'Dietro, una nicchia. E qualcosa avvolto in un grembiule di cuoio.'], // [nuovo]
            ['togli', 'palanchino'], ['segna', 'muro-aperto'],
          ],
          [['pensa', 'Il muro è lungo. Prima voglio sapere dove suona vuoto.']]]], // [nuovo]
        '*': [['pensa', 'Non è con questo che si apre un muro.']], // [nuovo]
      } },
    { id: 'nicchia', nome: 'La nicchia', x: 300, y: 120, w: 80, h: 130, sagoma: 'ferro',
      se: { visto: 'muro-aperto', nonVisto: 'tenaglie-prese' },
      guarda: [['pensa', 'Un grembiule di cuoio da fabbro, bruciato in tre punti. Lo conosco.']], // [nuovo]
      usa: [
        ['pensa', 'Svolgo il grembiule. Dentro, un paio di tenaglie lunghe, col manico consumato a forma di due mani.'], // [nuovo]
        ['prendi', 'ferro-tenaglie'], ['segna', 'tenaglie-prese'],
        ['pensa', 'Le tenaglie di mio padre. Con queste io e Taddeo tenemmo il ferro della spada: lui da un lato, io dall\'altro, e mio padre che batteva.'], // [nuovo]
        ['pensa', 'Qualcuno le ha murate qui, perché non si trovassero. O perché si trovassero un giorno.'], // [nuovo]
        ['diario', 'Le tenaglie di mio padre erano murate nel vicolo dietro casa di Taddeo. È il primo dei suoi ferri.'], // [nuovo]
      ] },
    { id: 'muro-vuoto-aperto', nome: 'La nicchia vuota', x: 300, y: 120, w: 80, h: 130,
      se: { visto: 'tenaglie-prese' },
      guarda: [['pensa', 'Nella nicchia resta l\'impronta delle tenaglie nella polvere.']] }, // [nuovo]
    { id: 'pietra-bassa', nome: 'Il tufo, a destra', x: 420, y: 140, w: 90, h: 100,
      guarda: [['pensa', 'Una fila di chiodi nel muro, per appendere le gabbie degli uccelli. Le gabbie sono vuote.']], // [nuovo]
      usa: [['pensa', 'Busso. Pieno. Risponde solo il mio polso.']], // [nuovo]
      con: { 'palanchino': [['pensa', 'Qui il muro è pieno: non c\'è niente dietro.']] } }, // [nuovo]
    { id: 'gatto', nome: 'Un gatto', x: 540, y: 220, w: 40, h: 28, sagoma: 'gatto',
      guarda: [['pensa', 'Un gatto con una zampa alzata, fermo a metà di un passo. La coda è dritta verso la porta murata.']], // [nuovo]
      usa: [['pensa', 'Gli sfioro la testa. È tiepido, e non si muove.']] }, // [nuovo]
    { id: 'verso-finestra', nome: 'Torna alla finestra di Mariella', x: 0, y: 140, w: 40, h: 120, uscita: 'corso.finestra',
      guarda: [['pensa', 'Dietro l\'angolo, la luce della finestra.']] }, // [nuovo]
  ],
});

// =====================================================================================================================
// 4. IL POSTO DI GUARDIA — la lanterna spenta, il palanchino, il nome di Taddeo
// =====================================================================================================================
AV.quadro({
  id: 'corso.guardia', capitolo: 'corso-trieste', nome: 'Il posto di guardia',
  fondale: { immagine: 'avventura/corso-guardia',
    disegno: [
      ['cielo', { tono: 'notte', luna: true }],
      ['palazzo', { x: 0, w: 640, h: 220, archi: 4, finestre: 0 }],
      ['forma', { punti: [[100, 110], [190, 110], [190, 250], [100, 250]], colore: '#3f2a1d', bordo: '#78350f' }],
      ['muro', { x: 430, y: 120, w: 120, h: 40, tono: 'legno' }],
      ['suolo', { tipo: 'selciato', y: 250 }],
    ],
    luce: { tono: 'notte' } },
  musica: 'notte',
  punti: [
    { id: 'garitta', nome: 'La garitta', x: 100, y: 110, w: 90, h: 140,
      guarda: [['pensa', 'Una garitta di legno a strisce, coi colori del re. Dentro ci sta una persona sola, in piedi.']], // [nuovo]
      usa: [['pensa', 'Dentro, sul ripiano: un tozzo di pane duro, un rosario, un fischietto. Niente che serva a me.']] }, // [nuovo]
    { id: 'lanterna', nome: 'La lanterna', x: 200, y: 90, w: 24, h: 40, sagoma: 'lampione',
      se: { nonVisto: 'lanterna-presa' },
      guarda: [['pensa', 'Appesa al chiodo, la lanterna della ronda. Spenta.']], // [nuovo]
      usa: [
        ['prendi', 'lanterna-spenta'], ['segna', 'lanterna-presa'],
        ['pensa', 'La stacco dal chiodo. Non ho niente per accenderla.'], // [nuovo]
        ['obiettivo', 'Accendi la lanterna. Sul Corso c\'è una sola luce.'], // [nuovo]
      ] },
    { id: 'guardia', nome: 'La guardia di turno', x: 250, y: 160, w: 44, h: 90, personaggio: 'guardia', posa: 0,
      guarda: [['pensa', 'Una guardia anziana, sull\'attenti da sei anni. Le hanno attaccato una mosca al naso e non se n\'è accorta.']], // [nuovo]
      usa: [['dice', 'guardia', 'Tutto in ordine. Tutto fermo. Così vuole Donna Luciana. Circolate, circolate.']], // [nuovo]
      con: {
        'lanterna-spenta': [['dice', 'guardia', 'La lanterna? E che ce ne facciamo? Non c\'è niente da vedere.']], // [nuovo]
        'lanterna-accesa': [['dice', 'guardia', 'Spegnetela, che dà fastidio alle vespe della Signora.']], // [nuovo]
        '*': [['dice', 'guardia', 'Circolate.']], // [nuovo]
      } },
    { id: 'registro-turni', nome: 'Il registro dei turni', x: 320, y: 180, w: 60, h: 40, sagoma: 'libro',
      guarda: [['pensa', 'Il registro dei turni, aperto sul leggio.']], // [nuovo]
      usa: [
        ['pensa', '«Sorveglianza degli edifici reali, turno di notte: Taddeo.» Il nome è scritto con la stessa mano per sei anni.'], // [nuovo]
        ['pensa', 'A margine, un\'altra calligrafia: «Esonerato dalla ronda del Corso, per ordine superiore. Ha reso un servizio.»'], // [nuovo]
        ['unaVolta', 'diario-turni', [['diario', 'Al posto di guardia: Taddeo è stato esonerato «per un servizio reso». Quale servizio?']]], // [nuovo]
      ] },
    { id: 'avviso', nome: 'Un avviso', x: 400, y: 70, w: 50, h: 40, sagoma: 'foglio',
      guarda: [['pensa', '«Chiunque faccia domande sul crollo del 1839 sia riferito al corpo di guardia. Per la quiete di tutti.» Sotto, un giglio a stampa.']] }, // [nuovo]
    { id: 'rastrelliera', nome: 'La rastrelliera', x: 430, y: 120, w: 120, h: 40,
      guarda: [['se', { visto: 'palanchino-preso' },
        [['pensa', 'Due lance spuntate e un posto vuoto, dove c\'era il palanchino.']], // [nuovo]
        [['pensa', 'Due lance spuntate e un palanchino per le barricate. Nessuno ha fatto barricate, da sei anni.']]]], // [nuovo]
      usa: [['unaVolta', 'palanchino-preso', [
        ['prendi', 'palanchino'],
        ['pensa', 'Le lance no: sono della guardia. Il palanchino lo prendo. Nessuno lo cercherà.'], // [nuovo]
      ], [['pensa', 'Le lance restano dove sono.']]]] }, // [nuovo]
    { id: 'verso-corso', nome: 'Torna sul Corso', x: 560, y: 150, w: 70, h: 110, uscita: 'corso.inizio',
      guarda: [['pensa', 'Il Corso, le vetrine.']] }, // [nuovo]
  ],
});

// =====================================================================================================================
// 5. FUORI DAL BANCO DEI PEGNI — lo sciame davanti alla porta; la lanterna appesa lo porta via
// =====================================================================================================================
AV.quadro({
  id: 'corso.bottega', capitolo: 'corso-trieste', nome: 'Il banco dei pegni',
  fondale: { immagine: 'avventura/corso-bottega',
    disegno: [
      ['cielo', { tono: 'notte', luna: true }],
      ['case', { n: 3, alto: 210, finestre: 1 }],
      ['finestra', { x: 90, y: 140, w: 100, h: 80, accesa: false }],
      ['porta', { x: 280, y: 140, w: 70, h: 110, stato: 'chiusa' }],
      ['lampione', { x: 470, y: 100, h: 150, acceso: false }],
      ['forma', { punti: [[260, 120], [300, 90], [350, 100], [380, 130], [340, 160], [280, 150]], colore: '#1c1917', bordo: '#facc15' }],
      ['suolo', { tipo: 'selciato', y: 250 }],
    ],
    luce: { tono: 'notte' } },
  musica: 'pericolo',
  entrata: [
    ['unaVolta', 'bottega-arrivo', [
      ['pensa', 'Il ronzio si sente nei denti. Davanti alla porta del banco, una nuvola di vespe si apre e si chiude come un polmone.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'insegna', nome: "L'insegna", x: 260, y: 40, w: 120, h: 34,
      guarda: [['pensa', '«BANCO DI PEGNI E PRESTITI — SI ANTICIPA SUI LAVORI DELLA REGGIA.» Qualcuno, sotto, ha grattato col coltello: «e non si paga mai».']] }, // [nuovo]
    { id: 'vetrina-pegni', nome: 'La vetrina dei pegni', x: 90, y: 140, w: 100, h: 80,
      guarda: [['pensa', 'Una culla. Un violino senza corde. Una fede nuziale col suo cartellino: «Pegno di Cozzolino, muratore. Riscatto a lavori finiti.»']] }, // [nuovo]
    { id: 'sciame', nome: 'Lo sciame', x: 250, y: 90, w: 140, h: 70,
      se: { nonVisto: 'vespe-attirate' },
      guarda: [['pensa', 'Centinaia di vespe, ognuna col suo filo di luce. Escono dalla porta, girano, rientrano. Seguono la luce come le falene.']], // [nuovo]
      usa: [['effetto', 'scossa'], ['pensa', 'Faccio un passo: lo sciame mi si stringe addosso, e mi ritrovo indietro senza averlo deciso.']], // [nuovo]
      con: { 'lanterna-accesa': [['pensa', 'Le vespe piegano verso la fiamma, ma in mano mia la luce va dove vado io: davanti alla porta. Bisogna appenderla lontano.']] } }, // [nuovo]
    { id: 'porta-banco', nome: 'La porta del banco', x: 280, y: 160, w: 70, h: 90,
      guarda: [['pensa', 'La porta è socchiusa. Dentro, una luce gialla come la cera.']], // [nuovo]
      usa: [['se', { visto: 'vespe-attirate' },
        [['vai', 'corso.nido']],
        [['pensa', 'Lo sciame mi chiude il passo. Devo portarlo via di qui.'], ['obiettivo', 'Lo sciame blocca la porta del banco dei pegni. Le vespe vanno dietro alle luci: al posto di guardia c\'è una lanterna.']]]] }, // [nuovo]
    { id: 'lampione', nome: 'Il lampione', x: 460, y: 100, w: 30, h: 150, sagoma: 'lampione',
      guarda: [['se', { visto: 'vespe-attirate' },
        [['pensa', 'La lanterna pende dal gancio, e intorno le vespe fanno una corona d\'oro.']], // [nuovo]
        [['pensa', 'Un lampione spento, lontano dalla porta, con un gancio da lanterna sotto il braccio.']]]], // [nuovo]
      usa: [['pensa', 'Il gancio è vuoto.']], // [nuovo]
      con: {
        'lanterna-accesa': [
          ['pensa', 'Appendo la lanterna al gancio del lampione.'], // [nuovo]
          ['togli', 'lanterna-accesa'], ['segna', 'vespe-attirate'], ['nascondi', 'sciame'],
          ['pensa', 'Una vespa, poi dieci, poi tutte: lasciano la porta e girano intorno alla fiamma, contente. La porta è libera.'], // [nuovo]
          ['diario', 'Le vespe sono andate alla lanterna. La porta del banco dei pegni è libera.'], // [nuovo]
          ['obiettivo', 'Entra nel banco dei pegni.'], // [nuovo]
        ],
        'lanterna-spenta': [['pensa', 'Spenta non la guarda nessuno. Prima va accesa.']], // [nuovo]
        '*': [['pensa', 'Al gancio va appesa una lanterna.']], // [nuovo]
      } },
    { id: 'verso-corso', nome: 'Torna sul Corso', x: 0, y: 140, w: 40, h: 120, uscita: 'corso.inizio',
      guarda: [['pensa', 'Il vicolo torna sul Corso.']] }, // [nuovo]
  ],
});

// =====================================================================================================================
// 6. DENTRO IL BANCO — la Regina dei Debiti (confronto in tre passi: capirla, la ricevuta, la bilancia)
// =====================================================================================================================
AV.quadro({
  id: 'corso.nido', capitolo: 'corso-trieste', nome: 'Il nido della Regina',
  fondale: { immagine: 'avventura/corso-nido',
    disegno: [
      ['cielo', { tono: 'interno' }],
      ['quinte', { colore: '#2a1d0f' }],
      ['forma', { punti: [[0, 40], [120, 20], [120, 250], [0, 250]], colore: '#a16207', bordo: '#facc15' }],
      ['forma', { punti: [[520, 20], [640, 40], [640, 250], [520, 250]], colore: '#a16207', bordo: '#facc15' }],
      ['banco', { x: 220, y: 210, w: 200 }],
      ['luce', { x: 320, y: 140, r: 160, colore: '#facc15' }],
      ['suolo', { tipo: 'assi', y: 250 }],
    ],
    luce: { tono: 'interno' } },
  musica: 'pericolo',
  entrata: [
    ['unaVolta', 'nido-arrivo', [
      ['effetto', 'velo'],
      ['pensa', 'Le pareti del banco sono favi: cellette di cera, e in ogni celletta una cambiale arrotolata.'], // [nuovo]
      ['pensa', 'Sul bancone, dove stava il prestatore, c\'è lei.'], // [nuovo]
      ['diario', 'Nel banco dei pegni vive la Regina dei Debiti. Le vespe le portano i fili di luce della città.'], // [nuovo]
      ['obiettivo', 'Capisci che cosa custodisce la Regina dei Debiti.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'regina', nome: 'La Regina dei Debiti', x: 250, y: 60, w: 140, h: 150, personaggio: 'regina-debiti', posa: 0,
      se: { nonVisto: 'regina-sciolta' },
      guarda: [
        ['pensa', 'Una vespa grande come una donna. Il corpo è fatto di cambiali arrotolate, le ali di ricevute mai firmate. Al collo, un giglio di cera.'], // [nuovo]
        ['pensa', 'Le vespe le portano i fili di luce, e lei li avvolge, li pesa, li mette nelle celle. Desideri. Ce n\'è uno per ogni casa del Corso.'], // [nuovo]
      ],
      usa: [
        ['effetto', 'scossa'], ['suono', 'ronzio'],
        ['pensa', 'Mi avvicino. Lei apre le ali e ronza, e nel ronzio ci sono voci di uomini.'], // [nuovo]
        ['dice', 'didascalia', '«A lavori finiti.» «Il mese venturo.» «Avrete la casa.» «Sul mio onore.» «Dopo la Reggia, dopo la Reggia, dopo la Reggia.»'], // [nuovo]
        ['pensa', 'È fatta delle promesse dei lavori della Reggia. Tutte quelle che nessuno ha mantenuto. E si mangia i desideri di chi ci ha creduto.'], // [nuovo]
        ['segna', 'regina-capita'],
        ['unaVolta', 'diario-regina', [
          ['diario', 'La Regina dei Debiti è fatta delle promesse mai mantenute dei lavori della Reggia. Vive di desideri pesati e mai pagati.'], // [nuovo]
          ['obiettivo', 'La Regina pesa promesse mancate. Cerca una promessa che qualcuno abbia mantenuto.'], // [nuovo]
        ]],
      ],
      con: {
        'ricevuta-gaetano': [['pensa', 'Le ali tremano, ma lei non legge: lei pesa. La parola di mio padre va messa sulla bilancia.']], // [nuovo]
        'testimonianza-taddeo': [['pensa', 'Non è una promessa. È una confessione.']], // [nuovo]
        '*': [['pensa', 'La Regina lo guarda con mille occhi e non lo vuole: non è una promessa.']], // [nuovo]
      } },
    { id: 'bilancia', nome: 'La bilancia', x: 430, y: 130, w: 80, h: 80,
      guarda: [['se', { visto: 'regina-sciolta' },
        [['pensa', 'La bilancia è ferma, in pari. Su un piatto, la ricevuta di mio padre.']], // [nuovo]
        [['pensa', 'Una bilancia da prestatore. Su un piatto, un mucchio di cambiali che lo tiene a terra. L\'altro piatto è vuoto e sta in alto. Sulla trave: «DARE · AVERE».']]]], // [nuovo]
      usa: [['pensa', 'Provo a spingere il piatto vuoto con la mano. Torna su. Non è la mia mano che pesa.']], // [nuovo]
      con: {
        'ricevuta-gaetano': [['se', { visto: 'regina-capita' },
          [
            ['togli', 'ricevuta-gaetano'],
            ['pensa', 'Poso la ricevuta di mio padre sul piatto vuoto. Un foglio solo, contro cento cambiali.'], // [nuovo]
            ['attendi', 600],
            ['pensa', 'La trave cigola. Il piatto delle promesse mancate si alza, piano, finché i due piatti stanno pari.'], // [nuovo]
            ['effetto', 'lampo'],
            ['pensa', 'La Regina si sfoglia: le cambiali si srotolano una a una, e da ognuna esce una luce.'], // [nuovo]
            ['nascondi', 'regina'],
            ['effetto', 'anime'], ['suono', 'anime'],
            ['segna', 'regina-sciolta'],
            ['pensa', 'Non c\'è un corpo. Ci sono anime di tutti i colori che salgono dal banco e passano dal soffitto come se non ci fosse.'], // [nuovo]
            ['dice', 'didascalia', 'Le vespe trasportano desideri rubati verso il palazzo.'], // [bibbia]
            ['diario', 'La Regina dei Debiti si è sciolta in anime. Le vespe portavano i desideri rubati alla Reggia: qualcuno, lì, li raccoglie.'], // [nuovo]
            ['pensa', 'Un\'anima non sale. Si ferma davanti a me, piccola, e dentro ci sono due bambini.'], // [nuovo]
            ['dice', 'didascalia', 'Da bambini, Taddeo e Ferruccio giocavano tra le strade di Caserta, fingendo di essere cavalieri.'], // [bibbia]
            ['dice', 'didascalia', 'Ferruccio costruiva spade di legno. Taddeo voleva sempre essere il comandante.'], // [bibbia]
            ['dice', 'didascalia', 'Quando Gaetano muore, Taddeo promette di proteggere Ferruccio come un fratello.'], // [bibbia]
            ['dice', 'didascalia', 'Anni dopo entra nella guardia e viene assegnato alla sorveglianza degli edifici reali.'], // [bibbia]
            ['dice', 'didascalia', 'Sua sorella Mariella, sopravvissuta al crollo del 1839, continua però a soffrire di incubi e terribili crisi di paura.'], // [bibbia]
            ['dice', 'didascalia', 'Donna Luciana lo avvicina.'], // [bibbia] «Violante lo avvicina.»: a schermo la Signora si chiama Donna Luciana
            ['dice', 'violante', 'Tua sorella non merita ciò che ha vissuto.'], // [bibbia]
            ['dice', 'violante', 'Dammi il nome di chi sta indagando. Io le restituirò la pace.'], // [bibbia]
            ['dice', 'didascalia', 'Taddeo consegna il nome di Ferruccio.'], // [bibbia]
            ['pensa', 'Stringo l\'elsa della spada finché il cuoio scricchiola. Era la promessa più grande di tutte, quella di Taddeo. E qui dentro l\'hanno pesata.'], // [nuovo]
            ['prendi', 'ricordo-spade-di-legno'],
            ['obiettivo', 'Taddeo è sul Corso. Torna alle vetrine.'], // [nuovo]
          ],
          [['pensa', 'Prima voglio capire che cosa pesa, questa bilancia. E chi la tiene.']]]], // [nuovo]
        '*': [['pensa', 'Sul piatto vuoto ci va una promessa. Questo non lo è.']], // [nuovo]
      } },
    { id: 'libro-mastro', nome: 'Il libro mastro', x: 220, y: 210, w: 70, h: 40, sagoma: 'libro',
      guarda: [['pensa', 'Il libro mastro del banco, grosso come una pietra, con le pagine incollate dalla cera.']], // [nuovo]
      usa: [['unaVolta', 'ricevuta-presa', [
        ['pensa', 'Sfoglio. «Al muratore Cozzolino: la casa, a lavori finiti.» «Alle filatrici di San Leucio: il doppio, l\'anno venturo.» «Agli scalpellini: la pensione per le vedove.»'], // [nuovo]
        ['pensa', 'Una pagina sola è scritta al contrario: non è una promessa fatta a un operaio, è una promessa fatta da un operaio.'], // [nuovo]
        ['pensa', '«Gaetano F., fabbro. Ferri della cancellata grande: consegnati il giorno promesso.» Sotto, la firma di mio padre, grossa come un martello.'], // [nuovo]
        ['prendi', 'ricevuta-gaetano'],
        ['diario', 'Nel libro mastro, l\'unica promessa mantenuta: i ferri di mio padre, consegnati il giorno promesso.'], // [nuovo]
      ], [['pensa', 'Le altre pagine dicono tutte la stessa cosa: «a lavori finiti».']]]] }, // [nuovo]
    { id: 'favi', nome: 'I favi', x: 10, y: 40, w: 100, h: 200,
      guarda: [['se', { visto: 'regina-sciolta' },
        [['pensa', 'Le cellette sono vuote. Solo cera, e un odore di miele vecchio.']], // [nuovo]
        [['pensa', 'In ogni celletta una cambiale, e su ogni cambiale un nome. Alcuni li conosco: gente della piazza, gente del Corso.']]]], // [nuovo]
      usa: [['pensa', 'Ne sfioro una. È calda, come una cosa viva.']] }, // [nuovo]
    { id: 'cassa', nome: 'La cassa dei pegni', x: 530, y: 190, w: 80, h: 55, sagoma: 'cassa',
      guarda: [['pensa', 'Una cassa ferrata. La serratura l\'ha fatta mio padre: riconosco il ricciolo.']], // [nuovo]
      usa: [['pensa', 'È chiusa. Dentro ci sono i pegni della gente. Non sono miei.']] }, // [nuovo]
    { id: 'verso-fuori', nome: 'Esci sul vicolo', x: 130, y: 150, w: 50, h: 100, uscita: 'corso.bottega',
      guarda: [['pensa', 'La porta, e fuori la lanterna con le vespe intorno.']] }, // [nuovo]
  ],
});

// =====================================================================================================================
// 7. IN FONDO AL CORSO — la Fucina si apre in piazza; la strada per la Villa
// =====================================================================================================================
AV.quadro({
  id: 'corso.fondo', capitolo: 'corso-trieste', nome: 'In fondo al Corso',
  fondale: { immagine: 'avventura/corso-fondo',
    disegno: [
      ['cielo', { tono: 'notte', luna: true, stelle: true }],
      ['case', { n: 3, alto: 150, finestre: 1 }],
      ['albero', { x: 470, y: 250, h: 160, tipo: 'leccio' }],
      ['albero', { x: 560, y: 250, h: 180, tipo: 'pino' }],
      ['forma', { punti: [[420, 250], [440, 150], [600, 150], [620, 250]], colore: '#111827', bordo: '#4b5563' }],
      ['suolo', { tipo: 'selciato', y: 250 }],
      ['nebbia', { alfa: 0.25 }],
    ],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [
    ['unaVolta', 'corso-fondo-arrivo', [
      ['segna', 'corso-percorso'],
      ['pensa', 'Il Corso finisce. Davanti, gli alberi della Villa Comunale; dietro, la strada che ho fatto.'], // [nuovo]
      ['pensa', 'E da qualche parte alle mie spalle, in piazza, una porta che finora non rispondeva ha fatto un rumore di chiave.'], // [nuovo]
      ['diario', 'Ho percorso la piazza e il Corso. La porta della bottega di mio padre, in Piazza Dante, adesso si apre.'], // [nuovo]
      ['obiettivo', 'Torna in Piazza Dante: la bottega di tuo padre ti aspetta. Poi la Villa Comunale.'], // [nuovo]
    ]],
  ],
  punti: [
    { id: 'cancello-villa', nome: 'Il cancello della Villa', x: 440, y: 150, w: 160, h: 100,
      guarda: [['pensa', 'Il cancello della Villa Comunale. Lance di ferro con la punta a giglio: le ha battute mio padre, una per una.']], // [nuovo]
      usa: [
        ['pensa', 'Spingo il cancello. Cede.'], // [nuovo]
        ['segna', 'corso-finito'], // USCITA → villa.cancello
      ] },
    { id: 'messaggio-taddeo', nome: 'Un foglio nella grata', x: 300, y: 190, w: 40, h: 30, sagoma: 'foglio',
      se: { flag: { taddeo: 'perdonato' } },
      guarda: [['pensa', 'Un foglio piegato infilato nella grata di una cantina, all\'altezza di un uomo chinato.']], // [nuovo]
      usa: [['pensa', '«Alla Villa, cerca dove l\'acqua è ferma. Là si nascondono le cose del crollo. Ti precedo. — T.»']] }, // [nuovo]
    { id: 'impronte', nome: 'Impronte di stivali', x: 300, y: 240, w: 90, h: 30,
      se: { flag: { taddeo: 'accusato' } },
      guarda: [['pensa', 'Impronte di stivali di guardia, lunghe, di corsa. Vanno verso la Villa. Taddeo è arrivato prima di me, e cerca le stesse carte.']] }, // [nuovo]
    { id: 'anime', nome: 'Le anime nel cielo', x: 60, y: 20, w: 300, h: 70, sagoma: 'anima',
      guarda: [['pensa', 'Le anime della Regina salgono ancora, lente, sopra i tetti. Qualcuno, dietro una finestra, alza gli occhi per la prima volta da sei anni.']] }, // [nuovo]
    { id: 'panchina', nome: 'Una panchina', x: 180, y: 215, w: 90, h: 35,
      guarda: [['pensa', 'Una panchina di pietra. Due bambini ci incisero sopra due spade incrociate. Si vedono ancora, se si sa dove guardare.']], // [nuovo]
      usa: [['pensa', 'Passo il dito sulle spade incise. Una è più grande dell\'altra: quella del comandante.']] }, // [nuovo]
    { id: 'verso-piazza', nome: 'Torna verso Piazza Dante', x: 0, y: 140, w: 40, h: 120,
      guarda: [['pensa', 'La strada del ritorno: il Corso, poi la piazza e la bottega.']], // [nuovo]
      uscita: 'piazza.centro', usa: [['segna', 'corso-verso-piazza']] },
    { id: 'verso-finestra', nome: 'Indietro, alla finestra di Mariella', x: 50, y: 200, w: 60, h: 60, uscita: 'corso.finestra',
      guarda: [['pensa', 'La luce di Mariella, laggiù.']] }, // [nuovo]
  ],
});

/*
 * IMMAGINI DA FAR DISEGNARE (gioco/assets/avventura/*.png, 640×360, la fascia sotto y 300 resta scura per l'interfaccia;
 * stile presepe d'ombre: sagome nere, luce calda di lanterna, luna ferma)
 *   corso-inizio.png   — Corso Trieste di notte in 3/4: a sinistra la vetrina dell'orefice, al centro un portone col
 *                        giglio, a destra un portico con la garitta e l'imbocco di un vicolo; vespe a file nel cielo verso
 *                        la sagoma lontana della Reggia; lampioni spenti, selciato lucido.
 *   corso-finestra.png — una casa stretta con una sola finestra accesa (calda, unica luce della strada), gerani secchi,
 *                        un portone con le tacche dei bambini; a sinistra l'arco di un vicolo, a destra una merceria buia.
 *   corso-vicolo.png   — vicolo cieco di tufo giallo; al centro l'arco di una porta murata con pietre più chiare;
 *                        chiodi con gabbie vuote, un gatto fermo a metà passo; luce che viene dall'angolo.
 *   corso-guardia.png  — porticato con quattro archi; garitta a strisce, lanterna al chiodo, leggio col registro,
 *                        rastrelliera con due lance e un palanchino, un avviso col giglio.
 *   corso-bottega.png  — insegna «BANCO DI PEGNI E PRESTITI», vetrina con culla, violino e fede; porta socchiusa con luce
 *                        gialla; nuvola di vespe davanti; a destra un lampione col gancio. (Variante senza sciame, con la
 *                        lanterna appesa e la corona di vespe: corso-bottega-libera.png.)
 *   corso-nido.png     — interno del banco: pareti a favo con cambiali nelle celle, bancone, bilancia da prestatore,
 *                        cassa ferrata; luce di cera. La Regina è la figura (foglio regina-vespa), non il fondale.
 *   corso-fondo.png    — fine del Corso: panchina di pietra, cancello della Villa con le lance a giglio, lecci e pini,
 *                        nebbia; anime colorate che salgono sopra i tetti.
 */
