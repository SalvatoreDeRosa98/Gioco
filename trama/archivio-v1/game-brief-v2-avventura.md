# Ferruccio — La Menzogna dei Borbone · Brief di gioco (v2, teatro delle ombre)

Data: 2026-11-07 · Stato: approvato dall'autore («sviluppiamolo tutto così seguendo la trama e le varie possibilità»)
Fonte di verità narrativa: `design/narrative/ferruccio-bibbia.md` (+ `inizio-memoria-e-doni.md` per le decisioni dell'autore).
Mappa macchina delle scene: `design/narrative/storia.json` · mappa leggibile: `design/narrative/mappa-scene.md`.
Mockup approvato: https://claude.ai/artifact/2N52QY85wH6Zuajn2KoHjc

## 1. Concetto in una frase

Un'avventura narrativa a scelte in forma di **teatro delle ombre**: Caserta 1845, una città addormentata
sotto un Velo che la rende felice, e un fabbro muto imprigionato in un costume da Pulcinella, l'unico
sveglio, che attraversa cinque luoghi reali per scoprire chi ha ucciso suo padre e decidere se la libertà
vale il dolore.

## 2. Perché il teatro delle ombre

Il progetto non ha disegnatori. Il primo tentativo (platform d'azione) è fallito proprio sulla grafica:
ogni personaggio chiedeva decine di fotogrammi coerenti. Il teatro delle ombre rovescia il vincolo:

- **Tutto è sagoma, luce e tipografia.** Forme vettoriali, gradienti, grana, nessuna immagine disegnata.
- **Il nero cancella l'incoerenza.** Una foto della Reggia, una forma generata e un path a mano diventano
  la stessa cosa dopo lo stesso trattamento.
- **I personaggi sono burattini a 5-7 pezzi**, mossi da poche animazioni (respiro, passo, sciarpa).
  Nessun fotogramma da disegnare.
- **È tematico.** Ferruccio è un Pulcinella: la baracca delle guarattelle è la sua prigione. Le bacchette
  che salgono dal basso dicono «sei mosso da qualcun altro» prima di ogni parola.

Regola d'oro ereditata dall'art bible v1: *silhouette prima dei dettagli*. Ogni personaggio deve essere
riconoscibile in nero puro da profilo, postura e un oggetto: la sciarpa (Ferruccio), la coppola e la
mozzarella (Tonino), la divisa e l'alabarda (Taddeo), la spola (Agnese), l'armatura col giglio (Gregorio),
il mantello e il fazzoletto (Violante).

## 3. Pilastri

1. **Le conseguenze si mostrano, non si spiegano** (bibbia §XIV). Una sciarpa non riconosciuta, un
   polso che si tocca, due piatti apparecchiati.
2. **Ogni scelta riguarda una persona concreta.** Sei decisioni binarie, nessun punteggio morale.
3. **La città è vera.** Piazza Dante, Corso Trieste, Villa Comunale, Belvedere di San Leucio, Cortile
   d'Onore della Reggia: architetture riconoscibili in silhouette.
4. **Ferruccio è muto.** Comunica con la postura del burattino e con le didascalie in corsivo.

## 4. Il ciclo di gioco

Per ogni capitolo (un luogo), in quest'ordine, con variazioni:

1. **Attraversare** il quadro: Ferruccio cammina a destra e a sinistra in 2-4 schermate in parallasse.
2. **Toccare** i punti caldi: oggetti (targa, punzone, registro, fazzoletto), finestre, statue. Una
   didascalia o un breve ricordo (tableau immobile + una voce).
3. **Parlare** con chi è sveglio a metà: dialoghi a cartiglio, battute della bibbia, varianti per flag.
4. **Duellare** con il boss del capitolo: *duello d'ombre*, un minigioco di tempismo (parata sul lampo
   rosso, affondo sull'apertura d'oro) che non chiede fotogrammi. Il boss si dissolve in un'anima.
5. **Scegliere**: la decisione del capitolo in una finestra con due risposte, con l'indizio di cosa si
   sacrifica (principio 2 della bibbia).
6. **Passare oltre**: titolo del capitolo successivo.

## 5. Struttura

| # | Capitolo | Luogo | Boss | Scelta (flag) |
|---|---|---|---|---|
| I | Il risveglio | Piazza Dante, notte serena | Gatto dei Quattro Canti | `tonino_ricordo` |
| II | Il tradimento | Corso Trieste, pioggia | Regina dei Debiti | `taddeo` |
| III | La verità sotto la pietra | Villa Comunale, lucciole | Madre di Marmo | `registro` |
| IV | La sciarpa | Belvedere di San Leucio, alba | Tessitrice di Pietra | `agnese` |
| V | La menzogna | Cortile d'Onore, torce | Il Custode (Gregorio) | `gregorio`, poi `violante` |
| — | Epilogo | Piazza Dante riusata | — | stato del mondo secondo `violante` |

Sei flag (bibbia §XIX): `tonino_ricordo`, `taddeo`, `registro`, `agnese`, `gregorio`, `violante`.
Otto percorsi fondamentali × due finali, più le varianti Tonino×Gregorio: tutte le 64 combinazioni sono
coperte riusando le scene (bibbia §XIII). Le scene obbligatorie di §XV non possono essere saltate.

## 6. Grammatica visiva

- **Fondale**: carta retroilluminata, ambra e bruno, con fibre e grana; cielo scuro in alto, luce
  all'orizzonte. Ogni capitolo ha la sua ora e il suo colore (notte serena, pioggia e vetrine, luna verde
  e lucciole, alba rosata, torce dorate); dopo il finale la palette cambia (bibbia §XVII).
- **Piani**: lontano sfocato e chiaro → medio → piano di gioco nero → primo piano nero pieno.
- **Luce**: finestre, lampioni, lanterne, torce, anime. La saturazione vive solo nelle luci.
- **Colore**: una sola nota calda (sciarpa rossa), l'oro dei fili del Velo, l'azzurro delle anime.
- **Cornice**: boccascena di legno scuro sottile con giglio d'oro. Niente tende ingombranti.
- **Tipografia**: Cinzel (titoli, HUD), Cormorant Garamond (dialoghi). Cartiglio scuro bordato d'oro.
- **HUD**: cinque maschere di Pulcinella (vita nei duelli), monete di luce, nome del capitolo.

## 7. Cosa è dentro e cosa è fuori (v1)

Dentro: i cinque capitoli, i cinque boss come duelli d'ombre, tutte le scelte e tutte le varianti della
bibbia, i due finali con epilogo giocabile in Piazza Dante, salvataggio automatico, tastiera + mouse +
touch, musica e ambienti sintetizzati (WebAudio) in un secondo momento.
Fuori: platform, metroidvania, abilità, inventario, cooperativa online, le tre espansioni (Casertavecchia,
Acquedotto Carolino, Santa Maria Capua Vetere), doppiaggio.

## 8. Tecnologia e verifica

Gioco web statico (HTML, SVG, CSS, JavaScript senza framework né build), cartella `gioco/`. Si gioca
nel browser da un link; l'eseguibile Windows si ottiene impacchettando la stessa cartella.
Ogni modifica visibile viene verificata con screenshot Playwright conservati in `qa/evidenze/`.
Architettura: `docs/architecture/motore-web.md`.
