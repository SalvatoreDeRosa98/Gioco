# Immagini da far disegnare a Gemini — primo lotto («Il palcoscenico vivo»)

Documento per l'autore, 2026-11-10. Gioco: «Ferruccio — La Notte Immobile», Teatro delle Marionette
(repository `SalvatoreDeRosa98/Gioco`, branch `claude/brave-cannon-ed3d3d`).

**Dove metterle:** tutte in `gioco/assets/sprite_teatro/scena/` con il nome esatto della tabella.
**Cosa deve fare Gemini:** solo aggiungere i PNG in quella cartella. Niente modifiche ai file `.js` e `.html`:
al gioco le collego io (ogni elemento ha già un disegno provvisorio, che viene sostituito dall'immagine quando c'è).

Questo è il **primo lotto**: sono le cose che non dipendono dal lavoro ancora in corso. Il **secondo lotto**
(boss nuovi, altre trasformazioni, scene dei finali, icone degli oggetti nuovi) arriva quando le squadre
consegnano, perché le pose e i nomi devono combaciare col codice.

## Prompt di contesto da dare a Gemini prima di ogni richiesta

```
Sei l'illustratore di «Ferruccio — La Notte Immobile», un gioco d'azione a stanze ambientato a Caserta nel 1845,
sotto i Borbone, dentro un teatro di marionette: tutto ciò che si vede è un PALCOSCENICO, i personaggi sono
marionette di legno appese a fili d'oro, il pubblico è fatto di ombre.

Stile: lo stesso del foglio di Ferruccio che ti allego (gioco/assets/sprite_teatro/ferruccio.png): fiaba scura,
sagome nette con contorno scuro, pochi colori caldi (nero d'ombra, bruni, avorio, oro, rosso cremisi), luce calda
di lanterna, materiali da teatro (legno intagliato, cartapesta dipinta, velluto, ottone). Niente fotorealismo,
niente stile fumetto moderno.

Regole fisse per ogni immagine:
- sfondo TRASPARENTE (PNG con alfa); nessun testo, nessuna scritta, nessuna cornice, nessuna firma;
- nessuna ombra a terra dipinta (la disegna il gioco);
- il soggetto riempie l'immagine con un piccolo margine vuoto tutto intorno (almeno il 4%): niente parti tagliate
  dal bordo;
- la dimensione indicata è il minimo: più grande va bene, purché con le stesse proporzioni;
- quando chiedo più fotogrammi, consegnali in un unico foglio: una riga per posa, i fotogrammi da sinistra a
  destra, celle tutte uguali, senza righe o bordi fra le celle, soggetto alla stessa altezza in ogni cella;
- una sola immagine per richiesta, con il nome del file esatto.
```

Per ogni riga chiedi: «Genera `<file>`: <descrizione>. Dimensione minima <L>×<A> px.»

## A. Il teatro attorno al palco (priorità 1)

| # | File | Dimensione minima | Descrizione |
|---|---|---|---|
| 1 | `palchetto.png` | 480×360 | Un singolo palchetto di teatro all'italiana (tipo San Carlo) visto di fronte dal palco: parapetto curvo di stucco dorato, drappo di velluto rosso scuro a festone con nappe, interno buio, VUOTO (senza spettatori). Trasparente tutto intorno e dentro il vano, sopra il parapetto. |
| 2 | `spettatori.png` | foglio, celle 160×160: 6 righe × 4 fotogrammi | Sei spettatori d'ombra a mezzo busto, uno per riga: un signore col cilindro, una dama col ventaglio, un ufficiale borbonico, un bambino, una vecchia col binocolo da teatro, una figura in maschera. Sagome nere con pochi accenti oro/rosso e occhi come due puntini di luce. Per ognuno 4 fotogrammi: fermo, applaude (mani aperte), applaude (mani chiuse), si sporge in avanti col fiato sospeso. |
| 3 | `platea.png` | 1920×160 | Fila di teste e spalle del pubblico in platea viste DA DIETRO (cilindri, cuffie, acconciature, un ventaglio alzato), sagome nere, che si possa ripetere in orizzontale senza giunta (il bordo sinistro combacia col destro). Trasparente sopra le teste. |
| 4 | `sipario-telo.png` | 960×1080 | La META SINISTRA di un sipario di velluto rosso scuro, chiusa: pieghe verticali profonde, frangia e bordo dorato sul lato destro (dove si incontra con l'altra metà) e in basso. Il gioco la specchia per fare la metà destra. |
| 5 | `sipario-mantovana.png` | 1920×220 | La mantovana in alto del sipario: velluto rosso a festoni con frangia d'oro e nappe, un cartiglio dorato vuoto al centro. Trasparente sotto i festoni. |
| 6 | `lume-ribalta.png` | foglio, celle 96×128: 1 riga × 4 fotogrammi | Un lume a olio della ribalta visto da dietro/di lato: conchiglia d'ottone che fa da riflettore, piccola fiamma. 4 fotogrammi della fiamma che tremola (forme diverse). |
| 7 | `lancio-fiore.png` | 96×96 | Una rosa rossa col gambo, lanciata dal pubblico. |
| 8 | `lancio-mazzo.png` | 96×96 | Un mazzolino di fiori legato con un nastro. |
| 9 | `lancio-ortaggio.png` | 96×96 | Un pomodoro maturo (lo tira il pubblico quando fischia). |
| 10 | `cavo-gancio.png` | 64×128 | Un gancio di ferro con un tratto di corda di canapa che sale verso l'alto: serve ad appendere la scenografia. La corda deve arrivare dritta fino al bordo superiore dell'immagine. |

## B. Scenografia appesa ai cavi: gli ostacoli delle stanze (priorità 2)

Tutti come **quinte di teatro**: sagome di legno e cartapesta dipinta, viste di tre quarti dall'alto come i
personaggi, con un anello di ferro in cima (dove si aggancia il cavo). Dimensione minima 240×320, salvo dove indicato.

| # | File | Quartiere | Descrizione |
|---|---|---|---|
| 11 | `ostacolo-lampione.png` | Corso Trieste | Lampione a olio di ghisa, bagnato di pioggia, luce calda. |
| 12 | `ostacolo-carretto.png` | Corso Trieste | Carretto da ambulante coperto da una tela cerata. |
| 13 | `ostacolo-fontanella.png` | Corso Trieste | Fontanella di pietra con mascherone. |
| 14 | `ostacolo-albero.png` | Villa Comunale | Albero di cartapesta dalla chioma tonda, con qualche lucciola. |
| 15 | `ostacolo-aiuola.png` | Villa Comunale | Aiuola bassa di bosso con fiori, bordo di ferro battuto (320×200). |
| 16 | `ostacolo-panchina.png` | Villa Comunale | Panchina di ferro e legno (320×200). |
| 17 | `ostacolo-telaio.png` | San Leucio | Telaio da seta di legno, con l'ordito teso e una pezza rossa a metà. |
| 18 | `ostacolo-balla-seta.png` | San Leucio | Balla di seta grezza legata con corde. |
| 19 | `ostacolo-arcolaio.png` | San Leucio | Arcolaio di legno con una matassa dorata. |
| 20 | `ostacolo-colonna.png` | Reggia | Colonna di finto marmo dipinto, con capitello dorato. |
| 21 | `ostacolo-statua.png` | Reggia | Statua di gesso di una figura classica su piedistallo. |
| 22 | `ostacolo-candelabro.png` | Reggia | Grande candelabro da terra d'ottone con le candele accese. |
| 23 | `ostacolo-braciere.png` | tutti | Braciere di ferro su tre piedi. Foglio di 2 fotogrammi (celle 240×320): brace bassa, fiamma alta. |
| 24 | `ostacolo-cassa-polvere.png` | tutti | Cassa di legno di polvere da sparo, con una miccia e un segno rosso dipinto (240×240). |
| 25 | `ostacolo-botte.png` | tutti | Botte di legno cerchiata di ferro (240×240). |
| 26 | `ostacolo-sacco.png` | tutti | Sacco di iuta pieno, legato (240×240). |
| 27 | `trappola-chiodi.png` | tutti | Assi del palco con chiodi lunghi che spuntano. Foglio di 3 fotogrammi (celle 240×160): chiodi dentro (solo le punte), a metà, tutti fuori. |

## C. Eventi e botteghe (priorità 3)

| # | File | Dimensione minima | Descrizione |
|---|---|---|---|
| 28 | `carta-dorso.png` | 180×288 | Il dorso di una carta napoletana: trama a losanghe rosso scuro e oro. |
| 29 | `carta-asso-denari.png` | 180×288 | Asso di denari delle carte napoletane (l'aquila con il grande denaro d'oro). |
| 30 | `carta-re-coppe.png` | 180×288 | Re di coppe delle carte napoletane. |
| 31 | `carta-cavallo-spade.png` | 180×288 | Cavallo di spade delle carte napoletane. |
| 32 | `npc-ciarlatano.png` | foglio, celle 240×288: 2 righe (fermo×2, mescola×4) | Il Ciarlatano d'ombra del Gioco delle Tre Carte: marionetta allampanata con tuba storta, mantellina a toppe, mani lunghe e veloci, un tavolino pieghevole davanti. Ghigno gentile, occhi come due monete. |
| 33 | `npc-don-gennaro.png` | foglio, celle 240×288: 2 righe (fermo×2, estrae×2) | Don Gennaro del Banco del Lotto: marionetta di un ometto panciuto con gilet, visiera verde e baffoni; nella posa «estrae» pesca una pallina numerata da un'urna. |
| 34 | `npc-cartomante.png` | foglio, celle 240×288: 2 righe (ferma×2, legge×2) | La Cartomante: marionetta di una vecchia con scialle scuro frangiato, orecchini d'oro, carte in mano; nella posa «legge» ne alza una. |
| 35 | `banco-lotto.png` | 360×288 | Il banco del lotto: tavolo di legno con l'urna girevole delle palline e il cartello dei novanta numeri. |
| 36 | `ceppo-chiodi.png` | 240×240 | Il Ceppo dei Chiodi: un ceppo di legno annerito irto di chiodi antichi, macchiato di rosso scuro. |
| 37 | `forzieri.png` | foglio, celle 192×192: 2 righe × 2 fotogrammi | Riga 1: forziere di legno comune, chiuso e aperto (dentro luccica). Riga 2: forziere ferrato con lucchetto, chiuso e aperto. |
| 38 | `lucchetto-porta.png` | 128×128 | Un grosso lucchetto di ferro con due giri di catena, da mettere sopra una porta chiusa. |
| 39 | `clessidra.png` | 240×384 | Una grande clessidra da teatro: telaio di legno tornito e ottone, due bulbi di vetro VUOTI e trasparenti (la sabbia la disegna il gioco). |

## D. Trasformazioni di Ferruccio: accessori (priorità 3)

Accessori disegnati da soli, da sovrapporre a qualunque personaggio (vista di tre quarti come Ferruccio,
rivolti a destra).

| # | File | Dimensione minima | Descrizione |
|---|---|---|---|
| 40 | `trasf-re-denari-corona.png` | 200×140 | Corona d'ebano con denari d'oro incastonati (trasformazione «Re di Denari»). |
| 41 | `trasf-re-denari-mantello.png` | 300×300 | Mantello regale corto, rosso scuro foderato d'ermellino, aperto, visto da dietro/tre quarti: va dietro le spalle del burattino. |
| 42 | `trasf-pulcinella-maschera.png` | 160×120 | Mezza maschera nera di Pulcinella col naso adunco (trasformazione «Pulcinella Traditore»). |
| 43 | `trasf-ombra-velo.png` | 300×300 | Un velo nero strappato che fluttua, quasi fumo (trasformazione «L'Ombra del Velo»): va dietro al burattino. |

## E. La porta della bottega, in Piazza Dante (priorità 2)

La porta di legno ad arco in alto nell'hub: serve per il finale segreto. Tre immagini con la stessa identica
inquadratura e la stessa dimensione (minimo 320×400), vista di fronte.

| # | File | Descrizione |
|---|---|---|
| 44 | `porta-bottega-chiusa.png` | Porta ad arco di legno scuro con borchie e una fascia di ferro, insegna dorata sopra, chiusa, la serratura ben visibile. |
| 45 | `porta-bottega-socchiusa.png` | La stessa porta appena socchiusa: una lama di luce calda esce dalla fessura. |
| 46 | `porta-bottega-aperta.png` | La stessa porta spalancata: dentro buio, con molti fili d'oro che pendono dall'alto e si perdono nell'ombra. |

## Facoltativo: Donna Luciana più leggibile

Nel foglio `donna-luciana.png` la figura è grigia e un po' trasparente e sul pavimento a scacchi della Reggia si
confonde. Se vuoi, rigenerala con lo stesso disegno ma più piena: abito nero con ricami oro ben visibili, viso di
porcellana chiaro, un contorno chiaro sottile. Stesso formato del foglio attuale (4 colonne; righe: fermo×4,
evoca×4, attacco×2, colpito×1, morte×3).
