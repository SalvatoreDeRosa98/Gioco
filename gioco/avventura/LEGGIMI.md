# Ferruccio — La Notte Immobile · Avventura grafica

Avventura grafica della storia di Ferruccio (bibbia: `trama/ferruccio-bibbia.md`, `trama/inizio-memoria-e-doni.md`;
mappa delle scene: `trama/storia.json`). Web statico, script classici, niente build: `gioco/avventura.html` carica
`gioco/avventura/*.js` e poi `gioco/avventura/storia/*.js`. È un programma separato dal Teatro (`gioco/teatro/`),
di cui riusa le immagini (`gioco/assets/sprite_teatro/`).

**Il motore non conosce la storia e la storia non contiene codice**: i capitoli sono DATI registrati con le funzioni
qui sotto. `tools/avventura-valida.js` controlla che i dati rispettino questo contratto; `tools/avventura-esplora.js`
percorre tutti i rami (nessun vicolo cieco, ogni finale raggiungibile).

## Come si gioca (regole di progetto)

- Logica a 640×360. La scena occupa lo schermo; la fascia bassa (y ≥ 300) è dell'interfaccia (oggetti, testo):
  i punti sensibili stanno fra y 16 e y 292.
- Mouse/tocco: un clic su un punto = azione principale (`usa`); clic destro o pressione lunga = `guarda`;
  con un oggetto in mano il clic lo usa/lo mostra a quel punto (`con`). Tastiera/gamepad: frecce o levetta passano
  da un punto all'altro, conferma = `usa`, secondo tasto = `guarda`, un tasto mostra tutti i punti.
- **Ferruccio non parla** (ha perso la voce): gli altri parlano, lui risponde con gesti e con gli oggetti. Le
  risposte nelle scelte sono gesti («Annuisci», «Mostragli il registro», «Volta le spalle»).
- Non si muore, non ci sono vicoli ciechi, niente prove di riflessi, niente caccia al pixel. Il Diario dice sempre
  che cosa Ferruccio sa e che cosa gli manca.
- Le sei decisioni della bibbia (§XIX) sono finestre a DUE risposte, restano per sempre nel salvataggio e nessuna è
  «giusta» (§XIV). La Signora a schermo si chiama **Donna Luciana** (la bibbia: Violante).

## Il contratto dei dati

Tutte le funzioni stanno sull'oggetto globale `AV`. Ogni `id` è unico nel suo genere, minuscolo, con trattini e punti.

```js
AV.flag({ id: 'taddeo', valori: ['perdonato', 'accusato'], nome: 'Taddeo' });       // una decisione o un fatto
AV.personaggio({ id: 'tonino', nome: 'Tonino', colore: '#f9cb40',
  figura: { foglio: 'scena/npc-tonino', celle: 2, alt: 62 } });                      // oppure { sagoma: 'uomo', alt: 62 }
AV.oggetto({ id: 'ricordo-rosa', nome: 'Il ricordo di Rosa', descrizione: '…',
  icona: { sagoma: 'anima' },                                                        // o { foglio, cella } o { punti: [...] }
  guarda: [ /* azioni */ ], combina: { 'altro-oggetto': [ /* azioni */ ] } });
AV.capitolo({ id: 'piazza-dante', titolo: 'Piazza Dante', ordine: 1, sottotitolo: 'Il risveglio' });

AV.quadro({
  id: 'piazza.centro', capitolo: 'piazza-dante', nome: 'Piazza Dante',
  fondale: { immagine: 'avventura/piazza-centro',        // PNG facoltativo (gioco/assets/avventura/…): se manca, il disegno
             disegno: [ ['cielo', { tono: 'notte', luna: true }], ['case', { n: 6, finestre: 3 }], ['suolo', { tipo: 'selciato', y: 250 }] ],
             luce: { tono: 'notte' } },
  musica: 'notte',
  entrata: [ /* azioni eseguite ogni volta che si entra */ ],
  punti: [
    { id: 'tonino', nome: 'Tonino', x: 190, y: 170, w: 44, h: 80, personaggio: 'tonino', posa: 0,
      se: { /* condizione */ }, guarda: [ /* azioni */ ], usa: [ /* azioni */ ],
      con: { 'ricordo-rosa': [ /* azioni */ ], '*': [ /* azioni per ogni altro oggetto */ ] } },
    { id: 'verso-corso', nome: 'Verso Corso Trieste', x: 590, y: 150, w: 40, h: 120, uscita: 'corso.inizio',
      se: { visto: 'tonino-incontrato' }, chiuso: [ /* azioni se la condizione non vale e il punto si vede lo stesso */ ] },
    { id: 'lampione', nome: 'Lampione', x: 300, y: 120, w: 20, h: 130, sagoma: 'lampione', guarda: [ ['pensa', '…'] ] },
  ],
});

AV.dialogo({ id: 'tonino.banco', con: 'tonino',
  inizio: [ /* azioni la prima volta */ ], saluto: [ /* azioni le volte dopo */ ],
  temi: [ { id: 'rosa', testo: 'Indica la sedia vuota', se: { /* */ }, unaVolta: true, fai: [ /* azioni */ ] } ] });

AV.finale({ id: 'verita-condivisa.uccisa', titolo: 'La verità condivisa', percorso: 1,
  se: { flag: { taddeo: 'perdonato', registro: 'conservato', agnese: 'risvegliata', luciana: 'uccisa' } },
  scene: [ /* azioni: le scene del finale */ ], riassunto: 'Una riga per la galleria dei finali.' });
```

### Azioni (ogni azione è un array)

| Azione | Cosa fa |
|---|---|
| `['dice', chi, testo]` | Una battuta. `chi` = id di un personaggio, oppure `'didascalia'`, `'voce'` (la Voce del Burattinaio). |
| `['pensa', testo]` | Didascalia in corsivo: quello che Ferruccio vede, sente, fa (lui non parla). |
| `['flag', id, valore]` | Scrive una decisione o un fatto (deve essere un valore dichiarato con `AV.flag`). |
| `['segna', chiave]` | Ricorda che una cosa è successa (per `visto` / `nonVisto`). |
| `['prendi', oggetto]` · `['togli', oggetto]` | Inventario. |
| `['vai', quadro]` | Cambia quadro. |
| `['scelta', [ { testo, se?, fai: [azioni] }, … ]]` | Finestra di scelta (per le sei decisioni: esattamente due voci). |
| `['se', condizione, [azioni], [altrimenti]]` | Ramo. |
| `['unaVolta', chiave, [azioni], [altrimenti]]` | Le azioni solo la prima volta (poi `altrimenti`, facoltativo). |
| `['dialogo', id]` | Apre un dialogo a temi. |
| `['diario', testo]` | Aggiunge una riga al Diario di Ferruccio. `['obiettivo', testo]` dice cosa manca. |
| `['posa', puntoId, n]` · `['mostra', puntoId]` · `['nascondi', puntoId]` | Cambia posa o visibilità di un punto del quadro corrente. |
| `['effetto', nome]` | `'buio'`, `'luce'`, `'lampo'`, `'scossa'`, `'velo'` (foschia fredda), `'anime'` (anime che salgono), `'sipario'`. |
| `['suono', nome]` · `['attendi', ms]` | Suono breve; pausa. |
| `['capitolo', id]` | Cartello d'inizio capitolo. |
| `['finale']` | Sceglie il finale la cui condizione vale e lo recita. `['finale', id]` ne recita uno preciso. |

### Condizioni (oggetti; le chiavi presenti devono valere tutte)

`{ flag: { taddeo: 'perdonato', registro: ['conservato', 'bruciato'], agnese: '' /* non ancora decisa */, tonino_ricordo: '*' /* decisa */ },
   ha: 'oggetto' | ['a', 'b'], nonHa: 'oggetto' | […], visto: 'chiave' | […], nonVisto: 'chiave' | […],
   tutti: [cond, …], uno: [cond, …], non: cond }`

### Elementi del fondale a codice (`fondale.disegno`, dal fondo verso il davanti)

`cielo {tono: notte|alba|velo|interno, luna, stelle}` · `quinte {colore}` · `suolo {tipo: selciato|scacchi|assi|erba|sabbia|tufo|marmo, y}` ·
`case {n, alto, finestre}` · `palazzo {x, w, h, archi, finestre}` · `arco {x, y, w, h}` · `colonna {x, y, h}` ·
`porta {x, y, w, h, stato: chiusa|socchiusa|aperta}` · `finestra {x, y, w, h, accesa}` · `lampione {x, y, h, acceso}` ·
`albero {x, y, h, tipo: pino|leccio|palma|spoglio}` · `siepe {x, y, w, h}` · `fontana {x, y, w}` · `statua {x, y, h}` ·
`banco {x, y, w}` · `telaio {x, y, w, h}` · `scala {x, y, w, h}` · `tenda {x, y, w, h, colore}` · `muro {x, y, w, h, tono}` ·
`luce {x, y, r, colore}` · `nebbia {alfa}` · `fili {n}` (fili d'oro dall'alto) · `immagine {nome, x, y, w, h}` (un PNG di `assets/`) ·
`forma {punti: [[x,y],…], colore, bordo}` (una sagoma libera, per tutto ciò che manca).

Sagome dei punti e delle figure senza foglio: `uomo`, `donna`, `bambina`, `vecchio`, `guardia`, `gatto`, `ombra`, `anima`,
`lampione`, `porta`, `finestra`, `foglio`, `libro`, `chiave`, `ferro`, `cassa`, `telaio`, `statua`, `campana`, `fontana`.

## File

| File | Cosa contiene |
|---|---|
| `storia/00-base.js` | Flag, personaggi e oggetti comuni a tutti i capitoli. |
| `storia/10-piazza-dante.js` … | Un file per capitolo: quadri, dialoghi, oggetti del capitolo. |
| `storia/90-finali.js` | I finali e gli epiloghi. |
