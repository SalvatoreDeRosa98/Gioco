/*
 * tools/avventura-campione/storia-campione.js — Storia-campione SOLO per le prove del motore (tools/qa-avventura-motore.js).
 * Non è la storia del gioco e non va in gioco/avventura/storia/. Usa i personaggi di storia/00-base.js.
 * Tutti gli id cominciano con «prova» per non urtare quelli dei capitoli veri.
 */
AV.flag({ id: 'prova_lume', valori: ['acceso', 'spento'], nome: 'Il lume della prova' });
AV.capitolo({ id: 'prova', titolo: 'La prova del motore', ordine: -1, sottotitolo: 'Un quadro di ogni cosa' });
AV.capitolo({ id: 'prova-due', titolo: 'La tavola', ordine: -0.5, sottotitolo: 'Tutti gli elementi' });

AV.oggetto({ id: 'prova-chiave', nome: 'Chiave di ferro', descrizione: 'Una chiave fredda, con un nastro rosso legato all\'anello.',
  icona: { sagoma: 'chiave' }, guarda: [['pensa', 'Sul nastro c\'è un nodo che solo una mano di donna fa così.']],
  combina: { 'prova-lettera': [['pensa', 'Ferruccio infila la chiave nella busta: dentro c\'è una piega che la aspettava.'], ['segna', 'prova-combinati']] } });
AV.oggetto({ id: 'prova-lettera', nome: 'Lettera', descrizione: 'Una lettera senza firma.', icona: { sagoma: 'foglio' } });
AV.oggetto({ id: 'prova-anima', nome: 'Un ricordo', descrizione: 'Una luce piccola che scalda la mano.', icona: { sagoma: 'anima' } });

AV.quadro({
  id: 'prova.piazza', capitolo: 'prova', nome: 'Piazza di prova',
  fondale: { immagine: 'avventura/prova-piazza',
    disegno: [['cielo', { tono: 'notte', luna: true, stelle: true }], ['case', { n: 6, finestre: 3 }], ['suolo', { tipo: 'selciato', y: 250 }],
      ['lampione', { x: 120, y: 250, h: 120, acceso: true }], ['fontana', { x: 330, y: 252, w: 90 }], ['luce', { x: 120, y: 140, r: 90, colore: '#d9a456' }], ['fili', { n: 5 }]],
    luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [['unaVolta', 'prova-inizio', [['capitolo', 'prova'], ['pensa', 'Ferruccio si sveglia sul selciato freddo.'], ['obiettivo', 'Trova la chiave e apri la porta.'], ['diario', 'Mi sono svegliato in una piazza ferma.']]]],
  punti: [
    { id: 'tonino', nome: 'Tonino', x: 200, y: 180, w: 40, h: 70, personaggio: 'tonino',
      guarda: [['pensa', 'Un uomo dietro un banco vuoto. Guarda la sedia accanto.']], usa: [['dialogo', 'prova.tonino']],
      con: { 'prova-lettera': [['dice', 'tonino', 'Chesta è grafia di Rosa... nun me ricordo.'], ['togli', 'prova-lettera'], ['segna', 'prova-lettera-data']] } },
    { id: 'chiave', nome: 'Qualcosa che luccica', x: 400, y: 230, w: 24, h: 20, sagoma: 'chiave', se: { nonHa: 'prova-chiave', nonVisto: 'prova-porta-aperta' },
      guarda: [['pensa', 'Una chiave fra le pietre.']], usa: [['prendi', 'prova-chiave'], ['suono', 'prendi'], ['pensa', 'Ferruccio raccoglie la chiave.'], ['nascondi', 'chiave']] },
    { id: 'porta', nome: 'Porta', x: 500, y: 160, w: 50, h: 90, sagoma: 'porta', posa: 0,
      guarda: [['pensa', 'Una porta chiusa a chiave.']], usa: [['se', { visto: 'prova-porta-aperta' }, [['vai', 'prova.tavola']], [['pensa', 'È chiusa.']]]],
      con: { 'prova-chiave': [['pensa', 'La chiave gira.'], ['effetto', 'lampo'], ['suono', 'porta'], ['togli', 'prova-chiave'], ['segna', 'prova-porta-aperta'], ['posa', 'porta', 1], ['obiettivo', 'Entra dalla porta.']] } },
    { id: 'verso-tavola', nome: 'Verso la tavola', x: 596, y: 140, w: 40, h: 110, uscita: 'prova.tavola', se: { visto: 'prova-porta-aperta' },
      chiuso: [['pensa', 'Di là non si passa ancora: prima la porta.']] },
  ],
});

AV.dialogo({ id: 'prova.tonino', con: 'tonino',
  inizio: [['dice', 'tonino', 'Uè, guagliò. Sei sveglio pure tu?']], saluto: [['dice', 'tonino', 'Ancora tu.']],
  temi: [
    { id: 'sedia', testo: 'Indica la sedia vuota', unaVolta: true, fai: [['dice', 'tonino', 'Là se sedeva qualcuno. Nun saccio chi.'], ['prendi', 'prova-lettera'], ['pensa', 'Tonino ti mette in mano una lettera.']] },
    { id: 'lume', testo: 'Indica il lampione', se: { flag: { prova_lume: '' } }, fai: [['dice', 'tonino', 'O l\'accendi, o lo lasci stare. Decidi tu.'],
      ['scelta', [{ testo: 'Accendi il lume', fai: [['flag', 'prova_lume', 'acceso'], ['effetto', 'luce'], ['dice', 'tonino', 'Mo\' se vede.']] },
        { testo: 'Lascialo spento', fai: [['flag', 'prova_lume', 'spento'], ['effetto', 'velo'], ['dice', 'tonino', 'Comme vuò tu.']] }]]] },
    { id: 'spalle', testo: 'Scuoti la testa', fai: [['dice', 'tonino', 'Va buono.']] },
  ] });

AV.quadro({
  id: 'prova.tavola', capitolo: 'prova-due', nome: 'La tavola degli elementi',
  fondale: { disegno: [['cielo', { tono: 'alba', luna: true }], ['quinte', { colore: '#3a2418' }], ['palazzo', { x: 200, w: 260, h: 150, archi: 4, finestre: 4 }],
    ['suolo', { tipo: 'marmo', y: 240 }], ['arco', { x: 14, y: 150, w: 70, h: 92 }], ['colonna', { x: 100, y: 240, h: 120 }], ['porta', { x: 150, y: 178, w: 34, h: 62, stato: 'socchiusa' }],
    ['finestra', { x: 140, y: 120, w: 30, h: 40, accesa: true }], ['lampione', { x: 190, y: 240, h: 110, acceso: false }], ['albero', { x: 480, y: 240, h: 120, tipo: 'pino' }],
    ['albero', { x: 530, y: 240, h: 100, tipo: 'leccio' }], ['albero', { x: 575, y: 240, h: 110, tipo: 'palma' }], ['albero', { x: 615, y: 240, h: 90, tipo: 'spoglio' }],
    ['siepe', { x: 470, y: 240, w: 160, h: 26 }], ['fontana', { x: 300, y: 282, w: 70 }], ['statua', { x: 230, y: 240, h: 70 }], ['banco', { x: 400, y: 282, w: 60 }],
    ['telaio', { x: 40, y: 250, w: 56, h: 44 }], ['scala', { x: 104, y: 256, w: 60, h: 40 }], ['tenda', { x: 470, y: 40, w: 60, h: 80, colore: '#7a1f2b' }],
    ['muro', { x: 540, y: 250, w: 90, h: 40, tono: 'tufo' }], ['luce', { x: 330, y: 200, r: 70, colore: '#d9a456' }], ['forma', { punti: [[360, 60], [380, 30], [400, 60]], colore: '#20140c', bordo: '#d9a456' }],
    ['immagine', { nome: 'avventura/manca', x: 10, y: 20, w: 40, h: 40 }], ['nebbia', { alfa: 0.15 }], ['fili', { n: 4 }]] },
  musica: 'interno',
  entrata: [['unaVolta', 'prova-tavola', [['capitolo', 'prova-due']]]],
  punti: [
    ...['uomo', 'donna', 'bambina', 'vecchio', 'guardia', 'gatto', 'ombra', 'anima', 'lampione', 'porta'].map((s, i) => ({ id: 's-' + s, nome: s, x: 8 + i * 62, y: 26, w: 40, h: 60, sagoma: s, guarda: [['pensa', 'Sagoma: ' + s]] })),
    ...['finestra', 'foglio', 'libro', 'chiave', 'ferro', 'cassa', 'telaio', 'statua', 'campana', 'fontana'].map((s, i) => ({ id: 's-' + s, nome: s, x: 8 + i * 62, y: 100, w: 40, h: 50, sagoma: s, guarda: [['pensa', 'Sagoma: ' + s]] })),
    { id: 'ferruccio-f', nome: 'Taddeo', x: 250, y: 166, w: 40, h: 70, personaggio: 'taddeo', guarda: [['pensa', 'Il foglio a griglia di Taddeo.']] },
    { id: 'luciana', nome: 'Donna Luciana', x: 300, y: 150, w: 50, h: 86, personaggio: 'violante', guarda: [['pensa', 'Donna Luciana.']] },
    { id: 'gregorio', nome: 'Gregorio', x: 360, y: 158, w: 50, h: 80, personaggio: 'gregorio', guarda: [['pensa', 'Gregorio.']] },
    { id: 'assunta', nome: 'Assunta', x: 420, y: 176, w: 40, h: 62, personaggio: 'assunta', guarda: [['pensa', 'Assunta.']] },
    { id: 'agnese', nome: 'Agnese', x: 150, y: 174, w: 44, h: 64, personaggio: 'agnese', guarda: [['pensa', 'Agnese al telaio.']] },
    { id: 'rosa', nome: 'Rosa', x: 470, y: 180, w: 36, h: 58, personaggio: 'rosa', guarda: [['pensa', 'Rosa, sagoma.']] },
    { id: 'fine', nome: 'Il sipario', x: 560, y: 200, w: 60, h: 80, sagoma: 'campana',
      guarda: [['pensa', 'Di là finisce la prova.']], usa: [['effetto', 'anime'], ['prendi', 'prova-anima'], ['diario', 'Ho visto salire le anime.'], ['finale', 'prova.fine']] },
    { id: 'indietro', nome: 'Torna in piazza', x: 0, y: 240, w: 30, h: 50, uscita: 'prova.piazza' },
  ],
});

AV.finale({ id: 'prova.fine', titolo: 'La prova è finita', percorso: 0, se: { visto: 'prova-tavola' },
  scene: [['effetto', 'sipario'], ['dice', 'didascalia', 'Il sipario si chiude sulla piazza.'], ['se', { flag: { prova_lume: 'acceso' } }, [['pensa', 'Il lume resta acceso.']], [['pensa', 'Il lume resta spento.']]]],
  riassunto: 'Il motore ha recitato tutto, dal risveglio al sipario.' });
