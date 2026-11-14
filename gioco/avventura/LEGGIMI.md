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
Icone degli oggetti (`icona: { sagoma, colore, posa }`): `tenaglie`, `punzone`, `ago`, `spada`, `rudis`, `martello`, `palanchino`, `rastrello`, `manovella`, `ruota`, `nastro`, `sciarpa`, `guanto`, `berretto`, `mozzarella`, `scheggia`, `scala`, `tessera`, `scatola`, `lanterna`, `lettera`, `fazzoletto`, `seta`.
`colore` tinge `nastro`, `sciarpa`, `lettera` (il sigillo) e `anima`; `posa: 1` accende la `lanterna` e storce la `ruota`.

## File

| File | Cosa contiene |
|---|---|
| `storia/00-base.js` | Flag, personaggi e oggetti comuni a tutti i capitoli. |
| `storia/10-piazza-dante.js` … | Un file per capitolo: quadri, dialoghi, oggetti del capitolo. |
| `storia/90-finali.js` | I finali e gli epiloghi. |

## API del motore (`avventura/01-logica.js`)

Logica pura, senza DOM: nel browser è l'oggetto globale `AV`, in Node `const AV = require('gioco/avventura/01-logica.js')`
(poi i file di storia si caricano con `vm.runInNewContext(testo, { AV, console })`). Lo stato è fatto solo di dati semplici.

| Firma | Rende |
|---|---|
| `AV.dati.flag / personaggio / oggetto / capitolo / quadro / dialogo / finale` | `Map` id → voce registrata |
| `AV.nuovoStato(quadro?)` | `{ quadro, flag, inventario, visti, pose, nascosti, diario, obiettivo, capitoli, temiFatti }` |
| `AV.ripara(statoLetto)` · `AV.copia(stato)` | stato completo · copia profonda (JSON) |
| `AV.quadroIniziale()` · `AV.primoQuadroDel(capitolo)` | id del primo quadro del capitolo con `ordine` più basso · del capitolo dato |
| `AV.valuta(cond, stato)` | `true`/`false` (condizione assente = vera) |
| `AV.corsa(azioni, stato, contesto?)` | `{ prossimo(risposta) }`: ogni `prossimo()` applica le azioni di stato e rende il primo evento per l'interfaccia, poi `null` |
| `AV.esegui(azioni, stato, risposte?)` | esegue tutto senza interfaccia (le scelte prendono `risposte` in ordine, o la prima voce); rende la lista degli eventi |
| `AV.puntiDelQuadro(quadro, stato)` | copie dei punti visibili con `attivo` e `posa` |
| `AV.azioniDelPunto(quadro, punto, verbo, oggettoInMano, stato)` | le azioni da eseguire (`verbo` = `'usa'` \| `'guarda'`, `oggettoInMano` = id o `''`) |
| `AV.azioniDellOggetto(id)` · `AV.azioniCombina(a, b)` | guardare un oggetto · un oggetto su un altro |
| `AV.aperturaDialogo(id, stato)` | `inizio` la prima volta (segna `visti['dialogo:<id>']`), poi `saluto` |
| `AV.temiDelDialogo(id, stato)` · `AV.azioniDelTema(id, tema, stato)` | temi scegliibili ora · azioni del tema (segna `temiFatti['<dialogo>/<tema>']`) |
| `AV.finalePer(stato)` | id del finale la cui `se` vale (se più d'uno, quello con più chiavi), `''` se nessuno |
| `AV.decisioniPrese(stato)` | `[{ id, nome, valore }]` dei flag con `nome` già decisi |
| `AV.errori` · `AV.errore(msg)` | errori dei dati incontrati (riga rossa in console; il gioco va avanti) |

Eventi di `prossimo()`: `{tipo:'dice',chi,testo}` · `{tipo:'pensa',testo}` · `{tipo:'scelta',voci:[{indice,testo}]}` (si riprende
con `prossimo(indice)`; le voci con `se` falso non compaiono) · `{tipo:'vai',quadro,da,nuovoCapitolo}` (lo stato è già nel
quadro nuovo; al `prossimo()` dopo si esegue la sua `entrata`, poi il resto delle azioni) · `{tipo:'dialogo',id}` (l'interfaccia
apre il dialogo: apertura, poi temi finché il giocatore si allontana o i temi finiscono, poi `prossimo()`) · `{tipo:'effetto',nome}` ·
`{tipo:'suono',nome}` · `{tipo:'attendi',ms}` · `{tipo:'capitolo',id}` · `{tipo:'finale',id}` (l'interfaccia recita `scene`).
Chiavi nello stato: `pose` e `nascosti` per `'<quadro>/<punto>'`; `visti` per le chiavi di `segna`/`unaVolta` e `dialogo:<id>`.
Regole del punto: chiuso (`se` falso, con `chiuso`) → `guarda` fa il suo `guarda` se c'è, il resto fa `chiuso`; attivo → con un
oggetto `con[oggetto]` | `con['*']` | riga neutra; `guarda` | riga neutra; `usa` (+ `['vai', uscita]`) | `guarda` | riga neutra.
Nuova partita: `AV.corsa([['vai', AV.quadroIniziale()]], AV.nuovoStato())`. La pagina accetta `?quadro=<id>` per partire da un quadro.

## Strumenti e prove (tutti in `tools/`)

| Comando | Che cosa fa |
|---|---|
| `node tools/avventura-valida.js [--elenco]` | controlla il contratto dei dati: deve dire «nessun errore» prima di ogni commit |
| `node tools/avventura-immagini.js` | riscrive `05-immagini.js` (le immagini che esistono, con misure e griglie dei fogli): dopo ogni PNG nuovo |
| `node tools/avventura-release.js` | il gioco in un solo file: `production/release/avventura.html` (la copia alla radice è `avventura.html`) |
| `node tools/avventura-testi.js` | tutti i testi, quadro per quadro, in `production/avventura-testi.md` ([bibbia] / [nuovo]) |
| `node tools/avventura-richieste-immagini.js` | l'elenco dei fondali da far disegnare: `production/arte/richieste-gemini-avventura.md` |
| `bash tools/qa-avventura-percorsi.sh` | **i percorsi**, sul motore: nessun vicolo cieco, i 17 finali, le combinazioni delle sei decisioni, le strade di fuori da sole e insieme; scrive i cammini in `production/qa/avventura-cammini.json` |
| `node tools/qa-avventura-cammino.js [html]` | rifà coi clic, nell'interfaccia vera, tre cammini interi fino al finale (`--finali a,b` per sceglierli) |
| `node tools/qa-avventura-storia.js [html]` | l'interfaccia con la storia vera: ingressi dei capitoli, clic a caso con seme fisso, salvataggio |
| `node tools/qa-avventura-motore.js` | il motore e l'interfaccia sulla storia-campione di `tools/avventura-campione/` |

Ordine dei capitoli: prologo → Piazza Dante → Corso Trieste → Fucina del Ricordo (dalla porta della bottega, dopo il Corso) →
Villa Comunale (con l'Acquedotto) → San Leucio → `strada.bivio` (Le strade di fuori, facoltative: Casertavecchia e
l'Anfiteatro) → Reggia → epilogo giocabile nei due mondi → 16 finali (8 cammini × Donna Luciana uccisa o risparmiata) più
il finale segreto (i tre ferri di Gaetano).
