# Istruzioni per Gemini — i disegni che mancano all'avventura di Ferruccio

Generato da `tools/avventura-richieste-immagini.js` (non modificare a mano: si rigenera). Mancano
**55 fondali** su 55, **7 figure**, **42 oggetti** su 42.

## 0. Il tuo compito, e i suoi confini

Sei l'illustratore di «Ferruccio — La Notte Immobile», un'avventura grafica ambientata a Caserta nel 1845, la notte in
cui un Velo magico ha fermato la città. Devi disegnare **solo** le immagini elencate qui sotto.

- **Aggiungi soltanto file PNG**, nelle cartelle indicate, col **nome esatto**. Non modificare, rinominare o cancellare
  nessun altro file: niente `.js`, `.html`, `.md`, `.json`, e nessuno dei disegni che esistono già.
- **Un'immagine per file.** Se un'immagine non ti convince, rifalla: non consegnarne due versioni.
- Al gioco le collega Claude: tu non devi far altro che metterle al loro posto.

## 1. Lo stile: deve sembrare la stessa mano

Prima di disegnare **apri e guarda** questi disegni dell'autore: sono il modello, e ogni immagine nuova deve poter stare
accanto a loro senza che si noti la differenza.

| File (in `gioco/assets/sprite_teatro/`) | Che cosa prenderne |
|---|---|
| `ferruccio.png` | **il riferimento principale**: lo spessore del contorno, le ombre, l'avorio caldo, il rosso della sciarpa |
| `scena/ostacolo-lampione.png`, `scena/ostacolo-albero.png`, `scena/ostacolo-statua.png` | come sono fatti gli oggetti di scena: forme semplici, colori pieni |
| `scena/porta-bottega-chiusa.png`, `scena/banchetto-tonino.png` | il legno, il ferro battuto, la luce di lanterna sulle cose |
| `scena/npc-tonino.png`, `guardia_ferma.png`, `colosso_statua_fermo.png` | le persone e le statue: proporzioni, visi, panneggi |

**Scheda di stile (vale per ogni immagine):**

- **Contorno:** una linea a inchiostro bruno-nera (`#1c120e`), netta, di spessore quasi uniforme, attorno a ogni forma
  e sui dettagli principali. Niente contorni colorati, niente bordi sfumati, niente alone chiaro intorno alle figure.
- **Colore:** tinte piene e calde con **due toni di ombra** (luce e ombra, stacco morbido), qualche tratteggio a inchiostro
  nelle ombre. Niente sfumature fotografiche, niente texture realistiche.
- **Tavolozza** (presa dai disegni dell'autore): inchiostro `#1c120e` · legni `#422918` `#68452b` `#9a693d` ·
  avorio `#f7f0c2` `#e1d2a1` `#cdb388` · rosso `#652f24` e rosso acceso `#a8322a` · ferro `#2d3034` `#8b8f98` ·
  oro di lanterna `#f0b33b` `#fbde85` · verde scuro `#1e3f26` `#315d39` · marmo `#d4d1cc` `#96928d` ·
  notte `#1b1a33` `#2c2e4a` · tufo e intonaci di Caserta `#8a6d3c` `#b08f62` `#7d7468`.
- **Luce:** è notte, la luna è piena e non si muove; la luce vera viene da lanterne, finestre e braci, calda e dorata, e
  si posa sui muri vicini. I colori si vedono: **niente sagome nere**, niente scene quasi tutte al buio.
- **Materiali:** tufo, intonaco, legno intagliato, ferro battuto, ottone, seta, velluto. È un mondo da teatro di
  marionette: tutto è un po' costruito, un po' dipinto.
- **Non fare:** fotorealismo, rendering 3D, stile manga o cartone moderno, pixel art, acquerello sbiadito, scritte,
  firme, cornici, loghi, filigrane, lo sfondo «a scacchi» disegnato.

## 2. Come restare in linea dall'inizio alla fine

1. **Fai per primo `piazza-centro.png`** (sezione 3) e fermati: è il campione. L'autore lo approva o lo fa correggere.
2. Da lì in poi, per ogni fondale usa come riferimenti: `ferruccio.png`, **il campione approvato**, il **primo fondale
   già fatto dello stesso capitolo** (stesso luogo = stessi muri, stessi colori, stessa luce) e la **guida** del quadro.
3. Prima di consegnare un'immagine controlla: contorno a inchiostro su tutto? tavolozza della scheda? luce calda da un
   punto preciso? nessuna scritta e nessun personaggio? misure giuste? le cose stanno dove dice l'elenco?

## 3. I fondali (55 da fare)

**Cartella:** `gioco/assets/avventura/` · **formato:** PNG opaco, **16:9**, 1920×1080 (minimo 1280×720).

**Regole comuni a tutti i fondali:**

- **La guida.** Per ogni fondale c'è uno schema in `production/arte/guide-avventura/<stesso nome>.jpg`: è il luogo
  com'è abbozzato oggi dal gioco. **Serve solo a dire DOVE stanno le cose e quanto sono grandi: ridisegna la stessa
  composizione**, con le cose nelle stesse posizioni, ma nello stile della sezione 1 (la guida è scura e a sagome: il
  tuo disegno no).
- **Le posizioni contano.** Il giocatore clicca sulle cose: ogni cosa elencata sotto «Da dipingere» deve stare nel
  rettangolo indicato (percentuali della larghezza e dell'altezza, dall'angolo in alto a sinistra).
- **La fascia in basso** (l'ultimo sesto dell'altezza, sotto l'83%) resta **scura e vuota**: il gioco ci mette gli
  oggetti raccolti e i pulsanti. Niente di importante lì.
- **La terra.** Le figure camminano su una striscia fra la «linea di terra» indicata per ogni quadro e l'83%
  dell'altezza: lì ci vuole pavimento libero (selciato, assi, erba), senza ostacoli.
- **Le misure.** Ferruccio è alto circa il 18% dell'immagine, un adulto il 20%: una porta è alta circa il 28%, un
  lampione il 35%. Vista di tre quarti dall'alto della platea, come un palcoscenico.
- **Niente personaggi e niente scritte.** Le persone e le cose che cambiano le mette il gioco: sono elencate sotto
  «Da NON dipingere» e il loro posto deve restare libero (muro o pavimento che continua).
- **Gli oggetti di scena dell'autore.** Dove un quadro li nomina, lampioni, alberi, statue, telai, colonne e aiuole
  vanno rifatti **uguali** ai file di `gioco/assets/sprite_teatro/scena/` (senza l'anello in cima, che serve solo
  al teatro).

### Prologo

#### ⬜ `prologo-festa.png` — Caserta, la notte della festa

- **Guida:** `production/arte/guide-avventura/prologo-festa.jpg`
- **Che cosa si vede:** Caserta in festa vista dall'alto della piazza: la Reggia appena finita sullo sfondo, file di lanterne di carta, un fuoco d'artificio aperto e fermo nel cielo, ballerini e banda immobili, un velo di seta pallida che scende dalla luna piena.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde; dall'alto scendono sottili fili d'oro. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-lampione.png`
- **Da dipingere, in queste posizioni:**
  - «La luna» in alto a destra (da 67% a 77% della larghezza, da 7% a 22% dell'altezza)
  - «I fuochi fermi» in alto al centro (da 28% a 47% della larghezza, da 8% a 25% dell'altezza)
  - «I ballerini» in basso al centro (da 39% a 50% della larghezza, da 53% a 72% dell'altezza)
  - «La banda» in basso a destra (da 69% a 83% della larghezza, da 53% a 72% dell'altezza)
  - **passaggio** «Una figura a terra» in basso a sinistra (da 9% a 23% della larghezza, da 67% a 79% dell'altezza)

#### ⬜ `prologo-risveglio.png` — Il risveglio

- **Guida:** `production/arte/guide-avventura/prologo-risveglio.jpg`
- **Che cosa si vede:** Il selciato di Piazza Dante a terra, in primo piano una pozzanghera col riflesso della luna; una spada corta sulle pietre; un uomo in abito da festa che dorme in piedi contro un banco.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 67% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «La pozzanghera» in basso a sinistra (da 22% a 39% della larghezza, da 69% a 78% dell'altezza)
  - «La tua gola» a mezza altezza al centro (da 42% a 50% della larghezza, da 42% a 56% dell'altezza)
  - «Le lanterne della festa» in alto a destra (da 63% a 94% della larghezza, da 11% a 25% dell'altezza)
  - **passaggio** «Alzati: la piazza» a mezza altezza a destra (da 94% a 99% della larghezza, da 33% a 78% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «Una spada» (compare o cambia) in basso al centro (da 52% a 63% della larghezza, da 69% a 77% dell'altezza)
  - Cittadino di Caserta (personaggio) a mezza altezza a destra (da 81% a 88% della larghezza, da 47% a 69% dell'altezza)

### Piazza Dante

#### ⬜ `piazza-centro.png` — Piazza Dante

- **Guida:** `production/arte/guide-avventura/piazza-centro.jpg`
- **Che cosa si vede:** Piazza Dante: case basse, il banco di Tonino con conca di mozzarelle e lanterna accesa, una sedia di paglia vuota accanto, una donna col cesto addormentata, la porta sprangata in fondo, una finestra accesa al primo piano.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-lampione.png`, `scena/banchetto-tonino.png`
- **Da dipingere, in queste posizioni:**
  - «La sedia vuota» in basso al centro (da 38% a 43% della larghezza, da 57% a 69% dell'altezza)
  - «Il banco delle mozzarelle» in basso a sinistra (da 23% a 29% della larghezza, da 62% a 70% dell'altezza)
  - **passaggio** «I banchetti della festa» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 39% a 78% dell'altezza)
  - **passaggio** «La finestra illuminata» a mezza altezza a destra (da 71% a 80% della larghezza, da 31% a 47% dell'altezza)
  - **passaggio** «La porta sprangata» a mezza altezza al centro (da 59% a 66% della larghezza, da 51% a 70% dell'altezza)
  - **passaggio** «Verso la targa» a mezza altezza a destra (da 94% a 100% della larghezza, da 36% a 78% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Tonino (personaggio) a mezza altezza a sinistra (da 30% a 37% della larghezza, da 47% a 69% dell'altezza)
  - Cittadino di Caserta (personaggio) a mezza altezza al centro (da 50% a 56% della larghezza, da 48% a 69% dell'altezza)

#### ⬜ `piazza-nastri.png` — I banchetti della festa

- **Guida:** `production/arte/guide-avventura/piazza-nastri.jpg`
- **Che cosa si vede:** I banchetti della festa: il banco di Assunta sotto una tenda rossa, nastri appesi a un filo (un chiodo vuoto), il banco dei dolci con una vespa ferma in aria, un bambino addormentato col torrone.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde; dall'alto scendono sottili fili d'oro. **Linea di terra:** 70% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-lampione.png`
- **Da dipingere, in queste posizioni:**
  - «I nastri appesi» a mezza altezza al centro (da 45% a 70% della larghezza, da 33% a 46% dell'altezza)
  - «Il banco dei dolci» in basso a sinistra (da 11% a 30% della larghezza, da 59% a 70% dell'altezza)
  - «Un bambino addormentato» in basso al centro (da 33% a 38% della larghezza, da 58% a 70% dell'altezza)
  - «Il lampione spento» a mezza altezza a destra (da 77% a 81% della larghezza, da 42% a 70% dell'altezza)
  - **passaggio** «Torna al centro della piazza» a mezza altezza a destra (da 94% a 100% della larghezza, da 39% a 78% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Assunta (personaggio) a mezza altezza al centro (da 53% a 60% della larghezza, da 48% a 70% dell'altezza)

#### ⬜ `piazza-bottega.png` — La bottega sprangata

- **Guida:** `production/arte/guide-avventura/piazza-bottega.jpg`
- **Che cosa si vede:** Facciata di tufo con la porta di quercia sbarrata da due assi in croce e sigilli rossi; insegna di ferro battuto annerita «GAETANO — FABBRO»; finestrella con grata a riccioli e un giglio; un nastro azzurro impigliato nelle assi.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 70% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/porta-bottega-chiusa.png`
- **Da dipingere, in queste posizioni:**
  - **passaggio** «La porta della bottega» a mezza altezza al centro (da 44% a 56% della larghezza, da 39% a 70% dell'altezza)
  - «I sigilli» a mezza altezza al centro (da 47% a 53% della larghezza, da 49% a 56% dell'altezza)
  - «L'insegna» in alto al centro (da 42% a 58% della larghezza, da 19% a 31% dell'altezza)
  - «La finestrella con la grata» a mezza altezza a destra (da 66% a 74% della larghezza, da 32% a 47% dell'altezza)
  - **passaggio** «Torna al centro della piazza» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 39% a 78% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «Un nastro azzurro» (compare o cambia) a mezza altezza al centro (da 53% a 58% della larghezza, da 42% a 47% dell'altezza)

#### ⬜ `piazza-finestra.png` — La finestra di Mariella

- **Guida:** `production/arte/guide-avventura/piazza-finestra.jpg`
- **Che cosa si vede:** Palazzetto con una finestra accesa: Mariella affacciata col mento sulle mani, gerani secchi, una filastrocca scritta col gesso sotto il davanzale, gradini con la campana di gesso, una guardia che dorme seduta sul gradino.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 71% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «Una filastrocca» a mezza altezza al centro (da 45% a 55% della larghezza, da 46% a 53% dell'altezza)
  - «I gerani» a mezza altezza al centro (da 55% a 61% della larghezza, da 42% a 48% dell'altezza)
  - «Una guardia addormentata» a mezza altezza a destra (da 67% a 73% della larghezza, da 50% a 71% dell'altezza)
  - «I gradini» in basso al centro (da 41% a 59% della larghezza, da 64% a 71% dell'altezza)
  - **passaggio** «Torna al centro della piazza» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 39% a 78% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Mariella (personaggio) in alto al centro (da 46% a 54% della larghezza, da 26% a 44% dell'altezza)

#### ⬜ `piazza-targa.png` — La targa del 1839

- **Guida:** `production/arte/guide-avventura/piazza-targa.jpg`
- **Che cosa si vede:** Una lapide di marmo bianco su un muro, illuminata da un solo lampione; fiori secchi ai piedi; un notabile col cilindro fermo davanti; a destra un arco nero verso i Quattro Canti.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 71% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-lampione.png`
- **Da dipingere, in queste posizioni:**
  - «La targa» a mezza altezza al centro (da 38% a 63% della larghezza, da 31% a 56% dell'altezza)
  - «I fiori secchi» in basso al centro (da 42% a 58% della larghezza, da 62% a 70% dell'altezza)
  - «Il lampione» a mezza altezza a destra (da 72% a 75% della larghezza, da 39% a 71% dell'altezza)
  - **passaggio** «I Quattro Canti» a mezza altezza a destra (da 88% a 99% della larghezza, da 34% a 71% dell'altezza)
  - **passaggio** «Torna al centro della piazza» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 39% a 78% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Cittadino di Caserta (personaggio) a mezza altezza a sinistra (da 23% a 30% della larghezza, da 49% a 71% dell'altezza)

#### ⬜ `piazza-quattro-canti.png` — I Quattro Canti

- **Guida:** `production/arte/guide-avventura/piazza-quattro-canti.jpg`
- **Che cosa si vede:** Incrocio stretto fra quattro case alte, due archi, un'edicola votiva spenta; al centro un buio denso dove si intravedono due occhi verdi e la sagoma di un gatto enorme su un mucchio di oggetti di casa (cucchiai, culla, ritratto, medaglione).
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 71% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «L'edicola votiva» in alto a sinistra (da 22% a 28% della larghezza, da 27% a 41% dell'altezza)
  - «Verso Corso Trieste» a mezza altezza a destra (da 81% a 93% della larghezza, da 33% a 71% dell'altezza)
  - **passaggio** «Torna alla targa» a mezza altezza a sinistra (da 7% a 19% della larghezza, da 33% a 71% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «Il buio» (compare o cambia) a mezza altezza al centro (da 31% a 69% della larghezza, da 31% a 71% dell'altezza)
  - Il Gatto dei Quattro Canti (personaggio) a mezza altezza al centro (da 36% a 59% della larghezza, da 33% a 67% dell'altezza)
  - «Il mucchio di cose» (compare o cambia) in basso a destra (da 61% a 75% della larghezza, da 56% a 71% dell'altezza)
  - «L'anima color di rosa» (compare o cambia) a mezza altezza al centro (da 47% a 53% della larghezza, da 42% a 56% dell'altezza)

### Corso Trieste

#### ⬜ `corso-inizio.png` — Corso Trieste

- **Guida:** `production/arte/guide-avventura/corso-inizio.jpg`
- **Che cosa si vede:** Corso Trieste di notte in 3/4: a sinistra la vetrina dell'orefice, al centro un portone col giglio, a destra un portico con la garitta e l'imbocco di un vicolo; vespe a file nel cielo verso la sagoma lontana della Reggia; lampioni spenti, selciato lucido.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-lampione.png`
- **Da dipingere, in queste posizioni:**
  - «La vetrina dell'orefice» a mezza altezza a sinistra (da 8% a 22% della larghezza, da 39% a 67% dell'altezza)
  - «Un portone» a mezza altezza al centro (da 47% a 56% della larghezza, da 39% a 69% dell'altezza)
  - «Le vespe» in alto a destra (da 59% a 80% della larghezza, da 11% a 28% dell'altezza)
  - **passaggio** «Verso Piazza Dante» a mezza altezza a sinistra (da 0% a 5% della larghezza, da 33% a 75% dell'altezza)
  - **passaggio** «Il posto di guardia» a mezza altezza a destra (da 66% a 73% della larghezza, da 42% a 69% dell'altezza)
  - **passaggio** «Il banco dei pegni» a mezza altezza a destra (da 75% a 80% della larghezza, da 36% a 69% dell'altezza)
  - **passaggio** «Più avanti, la finestra accesa» a mezza altezza a destra (da 88% a 98% della larghezza, da 33% a 72% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Taddeo (personaggio) a mezza altezza a sinistra (da 23% a 30% della larghezza, da 46% a 69% dell'altezza)
  - Cittadino di Caserta (personaggio) a mezza altezza al centro (da 36% a 42% della larghezza, da 48% a 69% dell'altezza)

#### ⬜ `corso-finestra.png` — La finestra di Mariella

- **Guida:** `production/arte/guide-avventura/corso-finestra.jpg`
- **Che cosa si vede:** una casa stretta con una sola finestra accesa (calda, unica luce della strada), gerani secchi, un portone con le tacche dei bambini; a sinistra l'arco di un vicolo, a destra una merceria buia.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «Il portone di casa» a mezza altezza al centro (da 41% a 50% della larghezza, da 44% a 69% dell'altezza)
  - «I gerani» in alto al centro (da 53% a 61% della larghezza, da 31% a 37% dell'altezza)
  - «Una vetrina buia» a mezza altezza a destra (da 70% a 83% della larghezza, da 42% a 67% dell'altezza)
  - **passaggio** «Il vicolo dietro la casa» a mezza altezza a sinistra (da 5% a 14% della larghezza, da 39% a 69% dell'altezza)
  - **passaggio** «Indietro, verso le vetrine» in basso a sinistra (da 16% a 25% della larghezza, da 56% a 72% dell'altezza)
  - **passaggio** «In fondo al Corso» a mezza altezza a destra (da 91% a 98% della larghezza, da 33% a 75% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Mariella (personaggio) in alto al centro (da 39% a 52% della larghezza, da 17% a 36% dell'altezza)
  - Taddeo (personaggio) a mezza altezza al centro (da 59% a 66% della larghezza, da 46% a 69% dell'altezza)

#### ⬜ `corso-vicolo.png` — Il vicolo dietro la casa

- **Guida:** `production/arte/guide-avventura/corso-vicolo.jpg`
- **Che cosa si vede:** vicolo cieco di tufo giallo; al centro l'arco di una porta murata con pietre più chiare; chiodi con gabbie vuote, un gatto fermo a metà passo; luce che viene dall'angolo.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «Il tufo vecchio, a sinistra» a mezza altezza a sinistra (da 23% a 38% della larghezza, da 31% a 64% dell'altezza)
  - «Il tufo, a destra» a mezza altezza a destra (da 66% a 80% della larghezza, da 39% a 67% dell'altezza)
  - «Un gatto» in basso a destra (da 84% a 91% della larghezza, da 61% a 69% dell'altezza)
  - **passaggio** «Torna alla finestra di Mariella» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 39% a 72% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «La porta murata» (compare o cambia) a mezza altezza al centro (da 47% a 59% della larghezza, da 33% a 69% dell'altezza)
  - «La nicchia» (compare o cambia) a mezza altezza al centro (da 47% a 59% della larghezza, da 33% a 69% dell'altezza)
  - «La nicchia vuota» (compare o cambia) a mezza altezza al centro (da 47% a 59% della larghezza, da 33% a 69% dell'altezza)

#### ⬜ `corso-guardia.png` — Il posto di guardia

- **Guida:** `production/arte/guide-avventura/corso-guardia.jpg`
- **Che cosa si vede:** porticato con quattro archi; garitta a strisce, lanterna al chiodo, leggio col registro, rastrelliera con due lance e un palanchino, un avviso col giglio.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «La garitta» a mezza altezza a sinistra (da 16% a 30% della larghezza, da 31% a 69% dell'altezza)
  - «La lanterna» in alto a sinistra (da 31% a 35% della larghezza, da 25% a 36% dell'altezza)
  - «Il registro dei turni» a mezza altezza al centro (da 50% a 59% della larghezza, da 50% a 61% dell'altezza)
  - «Un avviso» in alto al centro (da 63% a 70% della larghezza, da 19% a 31% dell'altezza)
  - «La rastrelliera» a mezza altezza a destra (da 67% a 86% della larghezza, da 33% a 44% dell'altezza)
  - **passaggio** «Torna sul Corso» a mezza altezza a destra (da 88% a 98% della larghezza, da 42% a 72% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Guardia della Reggia (personaggio) a mezza altezza al centro (da 39% a 46% della larghezza, da 44% a 69% dell'altezza)

#### ⬜ `corso-bottega.png` — Il banco dei pegni

- **Guida:** `production/arte/guide-avventura/corso-bottega.jpg`
- **Che cosa si vede:** insegna «BANCO DI PEGNI E PRESTITI», vetrina con culla, violino e fede; porta socchiusa con luce gialla; nuvola di vespe davanti; a destra un lampione col gancio. (Variante senza sciame, con la lanterna appesa e la corona di vespe: corso-bottega-libera.png.)
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-lampione.png`
- **Da dipingere, in queste posizioni:**
  - «L'insegna» in alto al centro (da 41% a 59% della larghezza, da 11% a 21% dell'altezza)
  - «La vetrina dei pegni» a mezza altezza a sinistra (da 14% a 30% della larghezza, da 39% a 61% dell'altezza)
  - «La porta del banco» a mezza altezza al centro (da 44% a 55% della larghezza, da 44% a 69% dell'altezza)
  - «Il lampione» a mezza altezza a destra (da 72% a 77% della larghezza, da 28% a 69% dell'altezza)
  - **passaggio** «Torna sul Corso» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 39% a 72% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «Lo sciame» (compare o cambia) in alto al centro (da 39% a 61% della larghezza, da 25% a 44% dell'altezza)

#### ⬜ `corso-nido.png` — Il nido della Regina

- **Guida:** `production/arte/guide-avventura/corso-nido.jpg`
- **Che cosa si vede:** interno del banco: pareti a favo con cambiali nelle celle, bancone, bilancia da prestatore, cassa ferrata; luce di cera. La Regina è la figura (foglio regina-vespa), non il fondale.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «La bilancia» a mezza altezza a destra (da 67% a 80% della larghezza, da 36% a 58% dell'altezza)
  - «Il libro mastro» in basso al centro (da 34% a 45% della larghezza, da 58% a 69% dell'altezza)
  - «I favi» a mezza altezza a sinistra (da 2% a 17% della larghezza, da 11% a 67% dell'altezza)
  - «La cassa dei pegni» a mezza altezza a destra (da 83% a 95% della larghezza, da 53% a 68% dell'altezza)
  - **passaggio** «Esci sul vicolo» a mezza altezza a sinistra (da 20% a 28% della larghezza, da 42% a 69% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - La Regina dei Debiti (personaggio) a mezza altezza al centro (da 39% a 61% della larghezza, da 17% a 58% dell'altezza)

#### ⬜ `corso-fondo.png` — In fondo al Corso

- **Guida:** `production/arte/guide-avventura/corso-fondo.jpg`
- **Che cosa si vede:** fine del Corso: panchina di pietra, cancello della Villa con le lance a giglio, lecci e pini, nebbia; anime colorate che salgono sopra i tetti.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-albero.png`
- **Da dipingere, in queste posizioni:**
  - **passaggio** «Il cancello della Villa» a mezza altezza a destra (da 69% a 94% della larghezza, da 42% a 69% dell'altezza)
  - «Le anime nel cielo» in alto a sinistra (da 9% a 56% della larghezza, da 6% a 25% dell'altezza)
  - «Una panchina» in basso al centro (da 28% a 42% della larghezza, da 60% a 69% dell'altezza)
  - **passaggio** «Torna verso Piazza Dante» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 39% a 72% dell'altezza)
  - **passaggio** «Indietro, alla finestra di Mariella» in basso a sinistra (da 8% a 17% della larghezza, da 56% a 72% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «Un foglio nella grata» (compare o cambia) a mezza altezza al centro (da 47% a 53% della larghezza, da 53% a 61% dell'altezza)
  - «Impronte di stivali» (compare o cambia) in basso al centro (da 47% a 61% della larghezza, da 67% a 75% dell'altezza)

### La Fucina del Ricordo

#### ⬜ `fucina-bottega.png` — La bottega di Gaetano

- **Guida:** `production/arte/guide-avventura/fucina-bottega.jpg`
- **Che cosa si vede:** Interno di bottega di fabbro abbandonata: muro con tenaglie e ago appesi e l'impronta pulita di un punzone mancante, banco con morsa e un disegno di ponteggio, forgia spenta col mantice, porta bassa in fondo col chiavistello.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo. **Linea di terra:** 71% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «Il chiodo delle tenaglie» in alto a sinistra (da 14% a 22% della larghezza, da 19% a 31% dell'altezza)
  - «Il banco da lavoro» in basso a sinistra (da 13% a 36% della larghezza, da 58% a 71% dell'altezza)
  - «Il mantice» in basso al centro (da 52% a 61% della larghezza, da 56% a 71% dell'altezza)
  - «La porta in fondo» a mezza altezza a destra (da 88% a 97% della larghezza, da 42% a 71% dell'altezza)
  - **passaggio** «Torna in Piazza Dante» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 39% a 71% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «L'impronta del punzone» (compare o cambia) in alto a sinistra (da 23% a 30% della larghezza, da 19% a 31% dell'altezza)
  - «L'ago da tracciare» (compare o cambia) in alto al centro (da 31% a 38% della larghezza, da 19% a 31% dell'altezza)

#### ⬜ `fucina-cuore.png` — La Fucina del Ricordo

- **Guida:** `production/arte/guide-avventura/fucina-cuore.jpg`
- **Che cosa si vede:** La Fucina del Ricordo: stanza senza pareti visibili, un'incudine al centro sotto una luce d'oro, scintille che salgono invece di cadere (in ognuna un piccolo oggetto di ferro), fili d'oro dall'alto; posto per la sagoma di Gaetano all'incudine.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo; dall'alto scendono sottili fili d'oro. **Linea di terra:** 71% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «L'incudine» in basso al centro (da 45% a 56% della larghezza, da 62% a 71% dell'altezza)
  - «Le scintille» in alto al centro (da 31% a 69% della larghezza, da 8% a 33% dell'altezza)
  - **passaggio** «Torna nella bottega» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 39% a 71% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Gaetano (personaggio) a mezza altezza al centro (da 39% a 47% della larghezza, da 44% a 71% dell'altezza)
  - «Il martello» (compare o cambia) a mezza altezza al centro (da 56% a 63% della larghezza, da 56% a 67% dell'altezza)

### Villa Comunale

#### ⬜ `villa-cancello.png` — Il cancello della Villa

- **Guida:** `production/arte/guide-avventura/villa-cancello.jpg`
- **Che cosa si vede:** Cancello di ferro battuto socchiuso fra due pilastri, siepi, un leccio a sinistra e una palma a destra, lampione acceso, garitta vuota; luna ferma.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-albero.png`, `scena/ostacolo-colonna.png`, `scena/ostacolo-aiuola.png`, `scena/ostacolo-lampione.png`
- **Da dipingere, in queste posizioni:**
  - «Il cancello» a mezza altezza al centro (da 39% a 63% della larghezza, da 33% a 69% dell'altezza)
  - **passaggio** «Dentro la Villa» a mezza altezza al centro (da 47% a 55% della larghezza, da 47% a 69% dell'altezza)
  - «Il lampione» a mezza altezza a destra (da 72% a 75% della larghezza, da 39% a 69% dell'altezza)
  - «La garitta del custode» a mezza altezza a sinistra (da 20% a 31% della larghezza, da 42% a 67% dell'altezza)
  - «Verso Corso Trieste» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 42% a 69% dell'altezza)
  - «La strada di San Leucio» a mezza altezza a destra (da 94% a 100% della larghezza, da 42% a 69% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «Un foglio fra le sbarre» (compare o cambia) a mezza altezza al centro (da 63% a 67% della larghezza, da 47% a 56% dell'altezza)

#### ⬜ `villa-viale.png` — Il viale delle statue

- **Guida:** `production/arte/guide-avventura/villa-viale.jpg`
- **Che cosa si vede:** Viale di lecci in prospettiva verso la fontana; a sinistra il cavaliere di marmo in ginocchio davanti a un giglio, a destra l'uomo in divisa e la bambina di marmo; panchina al centro; a destra la casina con la finestra accesa.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 68% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-albero.png`, `scena/ostacolo-statua.png`
- **Da dipingere, in queste posizioni:**
  - «Il cavaliere col giglio» a mezza altezza a sinistra (da 19% a 28% della larghezza, da 36% a 68% dell'altezza)
  - «L'uomo e la bambina di marmo» a mezza altezza a destra (da 73% a 83% della larghezza, da 39% a 68% dell'altezza)
  - «Il leccio vecchio» a mezza altezza a sinistra (da 30% a 38% della larghezza, da 17% a 67% dell'altezza)
  - **passaggio** «La casina dei registri» a mezza altezza a destra (da 88% a 97% della larghezza, da 42% a 68% dell'altezza)
  - **passaggio** «La serra» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 39% a 68% dell'altezza)
  - **passaggio** «Verso la fontana» a mezza altezza al centro (da 60% a 68% della larghezza, da 39% a 67% dell'altezza)
  - **passaggio** «Al cancello» in basso al centro (da 39% a 61% della larghezza, da 71% a 81% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Peppe, il giardiniere (personaggio) a mezza altezza al centro (da 47% a 54% della larghezza, da 49% a 69% dell'altezza)

#### ⬜ `villa-casina.png` — La casina dei registri

- **Guida:** `production/arte/guide-avventura/villa-casina.jpg`
- **Che cosa si vede:** Interno dell'archivio: scaffali di registri fino al soffitto, leggio, tavolo con lanterna accesa, armadio di noce con serratura di ferro, attrezzi da giardiniere nell'angolo.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «Il registro pubblico» a mezza altezza al centro (da 36% a 50% della larghezza, da 44% a 64% dell'altezza)
  - «La lanterna sul tavolo» a mezza altezza al centro (da 53% a 58% della larghezza, da 42% a 56% dell'altezza)
  - «Gli attrezzi dei giardinieri» a mezza altezza a sinistra (da 23% a 33% della larghezza, da 47% a 69% dell'altezza)
  - «Gli scaffali» a mezza altezza a destra (da 81% a 95% della larghezza, da 17% a 67% dell'altezza)
  - «La finestra» in alto a sinistra (da 9% a 20% della larghezza, da 22% a 47% dell'altezza)
  - **passaggio** «Torna al viale» in basso a sinistra (da 0% a 19% della larghezza, da 71% a 81% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «L'armadio chiuso» (compare o cambia) a mezza altezza a destra (da 66% a 78% della larghezza, da 25% a 67% dell'altezza)

#### ⬜ `villa-serra.png` — La serra dei limoni

- **Guida:** `production/arte/guide-avventura/villa-serra.jpg`
- **Che cosa si vede:** Serra di ferro e vetri appannati, limoni secchi in vasi di terracotta, il limone grande al centro con un guanto nero appeso in alto; foschia fredda del Velo.
- **Luce:** sotto il Velo: gli stessi colori ma spenti e grigio-azzurri, foschia bassa, fili d'oro che scendono dall'alto. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-albero.png`
- **Da dipingere, in queste posizioni:**
  - «Il limone secco» a mezza altezza al centro (da 44% a 56% della larghezza, da 17% a 69% dell'altezza)
  - «I vetri appannati» in alto a sinistra (da 11% a 34% della larghezza, da 14% a 47% dell'altezza)
  - «I vasi» in basso a destra (da 69% a 86% della larghezza, da 56% a 69% dell'altezza)
  - «Una luce fra le foglie secche» a mezza altezza a sinistra (da 23% a 28% della larghezza, da 42% a 50% dell'altezza)
  - **passaggio** «Torna al viale» a mezza altezza a destra (da 88% a 98% della larghezza, da 36% a 69% dell'altezza)
  - **passaggio** «Il passaggio verso il fondo» a mezza altezza a sinistra (da 0% a 8% della larghezza, da 36% a 69% dell'altezza)

#### ⬜ `villa-fontana.png` — La fontana muta

- **Guida:** `production/arte/guide-avventura/villa-fontana.jpg`
- **Che cosa si vede:** Fontana a vasca larga, acqua ferma come vetro, nomi incisi sull'orlo; lecci ai lati; al centro lo spazio vuoto per la Madre di Marmo (figura a parte, foglio custode-marmo).
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-albero.png`, `scena/ostacolo-fontanella.png`, `scena/ostacolo-lampione.png`
- **Da dipingere, in queste posizioni:**
  - «I nomi sull'orlo» in basso al centro (da 31% a 69% della larghezza, da 60% a 69% dell'altezza)
  - «La vasca» a mezza altezza a destra (da 63% a 80% della larghezza, da 56% a 68% dell'altezza)
  - «Il lampione» a mezza altezza a sinistra (da 18% a 22% della larghezza, da 39% a 69% dell'altezza)
  - **passaggio** «Il fondo della Villa» a mezza altezza a destra (da 91% a 100% della larghezza, da 33% a 68% dell'altezza)
  - **passaggio** «Torna al viale» in basso a sinistra (da 0% a 22% della larghezza, da 71% a 81% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - La Madre di Marmo (personaggio) in alto al centro (da 41% a 59% della larghezza, da 8% a 58% dell'altezza)
  - «Un ferro sul fondo» (compare o cambia) in basso a destra (da 67% a 73% della larghezza, da 63% a 69% dell'altezza)

#### ⬜ `villa-cantiere.png` — Le pietre del cantiere

- **Guida:** `production/arte/guide-avventura/villa-cantiere.jpg`
- **Che cosa si vede:** Fondo della Villa: pietre squadrate ammucchiate, centina di legno spezzata, carriola rovesciata, lapide storta su un muro di tufo; a destra un varco fra i rovi.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «La lapide del crollo» a mezza altezza a destra (da 63% a 77% della larghezza, da 44% a 67% dell'altezza)
  - «La centina spezzata» a mezza altezza a sinistra (da 19% a 33% della larghezza, da 33% a 69% dell'altezza)
  - «Le pietre squadrate» in basso al centro (da 36% a 54% della larghezza, da 56% a 69% dell'altezza)
  - «La carriola» in basso a sinistra (da 6% a 16% della larghezza, da 58% a 69% dell'altezza)
  - **passaggio** «Il sentiero verso gli archi» a mezza altezza a destra (da 88% a 98% della larghezza, da 25% a 69% dell'altezza)
  - **passaggio** «Torna alla fontana» in basso a sinistra (da 0% a 22% della larghezza, da 71% a 81% dell'altezza)
  - **passaggio** «La porticina della serra» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 33% a 57% dell'altezza)

#### ⬜ `acquedotto-archi.png` — Gli archi dell'Acquedotto

- **Guida:** `production/arte/guide-avventura/acquedotto-archi.jpg`
- **Che cosa si vede:** Gli archi dell'Acquedotto Carolino su tre ordini, canale d'acqua in basso con piccole luci colorate che scorrono; a destra un condotto che entra nel buio.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «Gli archi» in alto a sinistra (da 9% a 56% della larghezza, da 11% a 53% dell'altezza)
  - «Il canale» in basso al centro (da 19% a 81% della larghezza, da 63% a 71% dell'altezza)
  - «Il condotto buio» a mezza altezza a destra (da 81% a 91% della larghezza, da 42% a 64% dell'altezza)
  - **passaggio** «La nicchia sotto l'arco» a mezza altezza a destra (da 63% a 73% della larghezza, da 28% a 58% dell'altezza)
  - **passaggio** «Torna alla Villa» in basso a sinistra (da 0% a 22% della larghezza, da 71% a 81% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «Una luce impigliata» (compare o cambia) a mezza altezza al centro (da 47% a 52% della larghezza, da 56% a 64% dell'altezza)

#### ⬜ `acquedotto-nicchia.png` — La nicchia della grata

- **Guida:** `production/arte/guide-avventura/acquedotto-nicchia.jpg`
- **Che cosa si vede:** Volta di tufo sotto un arco basso, nicchia chiusa da una grata a riccioli con le lettere G. F., acqua che passa sotto, tacche di gesso sul muro.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «La grata» in alto al centro (da 36% a 64% della larghezza, da 19% a 36% dell'altezza)
  - «L'acqua» in basso al centro (da 6% a 94% della larghezza, da 67% a 75% dell'altezza)
  - «I segni sul muro» a mezza altezza a destra (da 73% a 86% della larghezza, da 25% a 47% dell'altezza)
  - **passaggio** «Torna agli archi» a mezza altezza a sinistra (da 0% a 8% della larghezza, da 28% a 67% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «La scatola di latta» (compare o cambia) a mezza altezza al centro (da 45% a 55% della larghezza, da 42% a 56% dell'altezza)
  - «La nicchia» (compare o cambia) a mezza altezza al centro (da 45% a 55% della larghezza, da 42% a 56% dell'altezza)

### San Leucio

#### ⬜ `leucio-arrivo.png` — San Leucio, il borgo della seta

- **Guida:** `production/arte/guide-avventura/leucio-arrivo.jpg`
- **Che cosa si vede:** Il borgo della seta: case a schiera dei tessitori, fontanella col getto fermo, lampione acceso, sullo sfondo la manifattura del Belvedere con fili d'oro che escono dal tetto verso sud.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde; dall'alto scendono sottili fili d'oro. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-fontanella.png`, `scena/ostacolo-lampione.png`
- **Da dipingere, in queste posizioni:**
  - «Le case dei tessitori» a mezza altezza a sinistra (da 3% a 22% della larghezza, da 33% a 67% dell'altezza)
  - «La fontanella» in basso al centro (da 39% a 50% della larghezza, da 61% a 72% dell'altezza)
  - «I fili d'oro nel cielo» in alto al centro (da 39% a 64% della larghezza, da 7% a 26% dell'altezza)
  - «Il lampione» a mezza altezza a sinistra (da 18% a 21% della larghezza, da 44% a 69% dell'altezza)
  - **passaggio** «La strada per Caserta, verso la Villa» in basso a sinistra (da 0% a 6% della larghezza, da 56% a 81% dell'altezza)
  - **passaggio** «La salita al Belvedere» a mezza altezza a destra (da 73% a 84% della larghezza, da 47% a 75% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Nunzia, tessitrice (personaggio) a mezza altezza a sinistra (da 25% a 31% della larghezza, da 49% a 69% dell'altezza)

#### ⬜ `leucio-belvedere.png` — Il cortile del Belvedere

- **Guida:** `production/arte/guide-avventura/leucio-belvedere.jpg`
- **Che cosa si vede:** Il cortile: facciata a arcate della manifattura, portone socchiuso con lo stemma, gelso, panca di pietra verso la valle; a destra lontanissima la Reggia illuminata, dove vanno i fili.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde; dall'alto scendono sottili fili d'oro. **Linea di terra:** 68% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-albero.png`
- **Da dipingere, in queste posizioni:**
  - **passaggio** «Il portone della manifattura» a mezza altezza al centro (da 45% a 55% della larghezza, da 48% a 68% dell'altezza)
  - «La vista su Caserta» in alto a destra (da 81% a 98% della larghezza, da 11% a 33% dell'altezza)
  - «Il gelso del cortile» a mezza altezza a sinistra (da 6% a 17% della larghezza, da 36% a 68% dell'altezza)
  - «Lo stemma sul portone» a mezza altezza al centro (da 47% a 53% della larghezza, da 36% a 46% dell'altezza)
  - «La panca di pietra» in basso a destra (da 73% a 87% della larghezza, da 62% a 70% dell'altezza)
  - **passaggio** «Giù, al borgo» in basso a sinistra (da 0% a 6% della larghezza, da 66% a 81% dell'altezza)
  - «La strada per la Reggia» a mezza altezza a destra (da 92% a 100% della larghezza, da 42% a 75% dell'altezza)

#### ⬜ `leucio-manifattura.png` — La manifattura della seta

- **Guida:** `production/arte/guide-avventura/leucio-manifattura.jpg`
- **Che cosa si vede:** Sala lunga coi telai che battono da soli (navette a mezz'aria, pedali abbassati), fili d'oro che salgono al soffitto, banco del capotelaio col libro aperto, porticina annerita a sinistra, porta bassa del magazzino in primo piano (due stati: avvolta nei fili / libera).
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo; dall'alto scendono sottili fili d'oro. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-telaio.png`
- **Da dipingere, in queste posizioni:**
  - «I telai che vanno da soli» a mezza altezza al centro (da 23% a 75% della larghezza, da 42% a 69% dell'altezza)
  - «I fili d'oro» in alto al centro (da 39% a 64% della larghezza, da 6% a 36% dell'altezza)
  - «La cassa dei pezzi» in basso a sinistra (da 6% a 17% della larghezza, da 57% a 69% dell'altezza)
  - «Il banco del capotelaio» a mezza altezza a destra (da 78% a 89% della larghezza, da 54% a 69% dell'altezza)
  - **passaggio** «La forgetta degli aggiustatori» a mezza altezza a sinistra (da 0% a 5% della larghezza, da 33% a 56% dell'altezza)
  - **passaggio** «La sala del telaio grande» a mezza altezza a destra (da 92% a 100% della larghezza, da 42% a 69% dell'altezza)
  - **passaggio** «Il portone, verso il Belvedere» in basso al centro (da 45% a 55% della larghezza, da 71% a 81% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «La porta bassa del magazzino» (compare o cambia) in basso a sinistra (da 19% a 30% della larghezza, da 71% a 81% dell'altezza)
  - «Una porta bassa, impigliata nei fili» (compare o cambia) in basso a sinistra (da 19% a 30% della larghezza, da 71% a 81% dell'altezza)

#### ⬜ `leucio-forgetta.png` — La forgetta degli aggiustatori

- **Guida:** `production/arte/guide-avventura/leucio-forgetta.jpg`
- **Che cosa si vede:** Forgetta degli aggiustatori: incudine piccola col corno stretto (segno G. F.), forgia spenta, attrezzi appesi in fila, fila di ruotine su un chiodo, finestrella con luna.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «L'incudine» in basso al centro (da 40% a 57% della larghezza, da 57% a 70% dell'altezza)
  - «Gli attrezzi appesi» in alto a destra (da 69% a 83% della larghezza, da 11% a 31% dell'altezza)
  - «La forgia spenta» a mezza altezza a destra (da 69% a 81% della larghezza, da 33% a 58% dell'altezza)
  - «Una fila di ruotine appese» in alto a sinistra (da 25% a 36% della larghezza, da 17% a 31% dell'altezza)
  - «La finestrella» in alto a sinistra (da 15% a 23% della larghezza, da 18% a 34% dell'altezza)
  - **passaggio** «Torna alla manifattura» a mezza altezza a destra (da 92% a 100% della larghezza, da 39% a 69% dell'altezza)

#### ⬜ `leucio-telaio.png` — La sala del telaio grande

- **Guida:** `production/arte/guide-avventura/leucio-telaio.jpg`
- **Che cosa si vede:** La sala del telaio grande: un solo telaio con la lunga sciarpa rossa sull'ordito, lanterna, finestra sulla valle coi fili d'oro, cesto di matasse rosse, cestino col fazzoletto.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo; dall'alto scendono sottili fili d'oro. **Linea di terra:** 70% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-telaio.png`
- **Da dipingere, in queste posizioni:**
  - «Il telaio di Agnese» a mezza altezza al centro (da 36% a 51% della larghezza, da 33% a 70% dell'altezza)
  - «Il cesto dei filati» in basso a destra (da 71% a 78% della larghezza, da 61% a 70% dell'altezza)
  - «La finestra sulla valle» in alto a destra (da 75% a 86% della larghezza, da 14% a 42% dell'altezza)
  - **passaggio** «Torna alla manifattura» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 39% a 70% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Agnese (personaggio) a mezza altezza al centro (da 52% a 59% della larghezza, da 49% a 70% dell'altezza)
  - «Un ago di ferro fra i licci» (compare o cambia) in alto al centro (da 37% a 42% della larghezza, da 27% a 33% dell'altezza)
  - «Un fazzoletto accanto al telaio» (compare o cambia) in basso al centro (da 64% a 69% della larghezza, da 63% a 69% dell'altezza)
  - Taddeo (personaggio) a mezza altezza a sinistra (da 16% a 23% della larghezza, da 47% a 70% dell'altezza)

#### ⬜ `leucio-magazzino.png` — Il magazzino delle stoffe

- **Guida:** `production/arte/guide-avventura/leucio-magazzino.jpg`
- **Che cosa si vede:** Tre pile di stoffe (rose bianche, foglie verdi, drappi a fiori col giglio d'oro), filo d'oro che scende dalla botola ed entra nella pila col giglio; scala di legno; mucchio di scarti con un lembo rosso; cartellini delle spedizioni.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo; dall'alto scendono sottili fili d'oro. **Linea di terra:** 70% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «La pila delle rose» a mezza altezza a sinistra (da 22% a 38% della larghezza, da 42% a 69% dell'altezza)
  - «La pila delle foglie» a mezza altezza al centro (da 42% a 58% della larghezza, da 39% a 69% dell'altezza)
  - «La pila col giglio» a mezza altezza a destra (da 63% a 80% della larghezza, da 36% a 69% dell'altezza)
  - «Il mucchio degli scarti» in basso a destra (da 83% a 94% della larghezza, da 58% a 70% dell'altezza)
  - «I cartellini delle spedizioni» in alto a destra (da 66% a 78% della larghezza, da 17% a 28% dell'altezza)
  - «La botola nel soffitto» in alto al centro (da 31% a 45% della larghezza, da 7% a 15% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «La scala di legno» (compare o cambia) a mezza altezza a sinistra (da 5% a 14% della larghezza, da 33% a 70% dell'altezza)

#### ⬜ `leucio-filatoio.png` — Il filatoio

- **Guida:** `production/arte/guide-avventura/leucio-filatoio.jpg`
- **Che cosa si vede:** Grande ruota di legno e ferro col perno forgiato, rocchetti luminosi, foschia fredda del Velo, fili d'oro che escono da una finestra; spazio a sinistra per la Tessitrice di Pietra (foglio sprite_teatro/tessitrice-pietra, pose: 0 fila, 1 si ferma col fazzoletto, 2 si scioglie). Figure: Agnese posa 0 tesse, posa 1 si volta (agnese_telaio, 2 celle). Nunzia: sagoma «donna» (manca un foglio).
- **Luce:** sotto il Velo: gli stessi colori ma spenti e grigio-azzurri, foschia bassa, fili d'oro che scendono dall'alto. **Linea di terra:** 70% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «La grande ruota» a mezza altezza al centro (da 52% a 73% della larghezza, da 17% a 56% dell'altezza)
  - «I rocchetti luminosi» a mezza altezza a destra (da 77% a 94% della larghezza, da 53% a 69% dell'altezza)
  - «La finestra dei fili» in alto a destra (da 81% a 94% della larghezza, da 11% a 36% dell'altezza)
  - «Un giglio inciso nel muro» in alto a sinistra (da 9% a 17% della larghezza, da 17% a 31% dell'altezza)
  - **passaggio** «Torna al magazzino» a mezza altezza a sinistra (da 0% a 6% della larghezza, da 42% a 70% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - La Tessitrice di Pietra (personaggio) a mezza altezza al centro (da 28% a 47% della larghezza, da 17% a 70% dell'altezza)

### Le strade di fuori

#### ⬜ `strada-bivio.png` — La strada di notte, al bivio

- **Guida:** `production/arte/guide-avventura/strada-bivio.jpg`
- **Che cosa si vede:** Bivio notturno fra San Leucio e la Reggia: una pietra miliare borbonica col giglio, tre sentieri (il viale dei platani al centro, la mulattiera a sinistra, la via Appia a destra), il colle a sinistra, il fascio dei fili d'oro sopra il viale.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde; dall'alto scendono sottili fili d'oro. **Linea di terra:** 66% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-albero.png`, `scena/ostacolo-statua.png`
- **Da dipingere, in queste posizioni:**
  - «La pietra miliare» in basso al centro (da 48% a 52% della larghezza, da 57% a 71% dell'altezza)
  - **passaggio** «Il viale verso la Reggia» in basso al centro (da 40% a 60% della larghezza, da 66% a 81% dell'altezza)
  - **passaggio** «La mulattiera di Casertavecchia» a mezza altezza a sinistra (da 20% a 39% della larghezza, da 50% a 64% dell'altezza)
  - **passaggio** «La via Appia, verso Santa Maria» a mezza altezza a destra (da 59% a 83% della larghezza, da 56% a 68% dell'altezza)
  - **passaggio** «La strada per San Leucio» in basso a sinistra (da 0% a 8% della larghezza, da 61% a 81% dell'altezza)
  - «I fili d'oro» in alto a destra (da 56% a 88% della larghezza, da 7% a 23% dell'altezza)
  - «Il colle» in alto a sinistra (da 9% a 38% della larghezza, da 27% a 43% dell'altezza)

#### ⬜ `casertavecchia-salita.png` — La mulattiera di Casertavecchia

- **Guida:** `production/arte/guide-avventura/casertavecchia-salita.jpg`
- **Che cosa si vede:** La mulattiera fra gli ulivi, un arco di tufo, un'edicola coi lumini, il campanile in alto contro la luna.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 68% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-albero.png`
- **Da dipingere, in queste posizioni:**
  - **passaggio** «Giù per la mulattiera» in basso a sinistra (da 0% a 9% della larghezza, da 64% a 81% dell'altezza)
  - **passaggio** «La porta del borgo» a mezza altezza a destra (da 73% a 86% della larghezza, da 36% a 69% dell'altezza)
  - «L'edicola dei lumini» a mezza altezza al centro (da 41% a 50% della larghezza, da 47% a 69% dell'altezza)
  - «L'ex voto» a mezza altezza al centro (da 44% a 47% della larghezza, da 52% a 59% dell'altezza)
  - «Gli ulivi» a mezza altezza a sinistra (da 9% a 36% della larghezza, da 44% a 67% dell'altezza)
  - «La valle» in alto a sinistra (da 16% a 50% della larghezza, da 11% a 33% dell'altezza)
  - «Il campanile» in alto a destra (da 87% a 95% della larghezza, da 7% a 26% dell'altezza)

#### ⬜ `casertavecchia-borgo.png` — I vicoli del borgo vecchio

- **Guida:** `production/arte/guide-avventura/casertavecchia-borgo.jpg`
- **Che cosa si vede:** Un vicolo ad archi del borgo vecchio, la fontana con la lapide, una porta murata con una croce di gesso, una scala a pioli appoggiata al muro.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-fontanella.png`, `scena/ostacolo-lampione.png`
- **Da dipingere, in queste posizioni:**
  - **passaggio** «Verso la porta del borgo» in basso a sinistra (da 0% a 8% della larghezza, da 61% a 81% dell'altezza)
  - **passaggio** «Il vicolo del duomo» a mezza altezza al centro (da 41% a 56% della larghezza, da 33% a 69% dell'altezza)
  - «La fontana con la lapide» in basso a sinistra (da 16% a 31% della larghezza, da 56% a 71% dell'altezza)
  - «La porta murata» a mezza altezza a destra (da 67% a 75% della larghezza, da 44% a 69% dell'altezza)
  - «Un gatto» in basso al centro (da 59% a 64% della larghezza, da 64% a 69% dell'altezza)
  - «Il lampione» a mezza altezza al centro (da 33% a 36% della larghezza, da 44% a 69% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «Una scala a pioli» (compare o cambia) a mezza altezza a destra (da 78% a 83% della larghezza, da 50% a 69% dell'altezza)

#### ⬜ `casertavecchia-sagrato.png` — Il sagrato del duomo

- **Guida:** `production/arte/guide-avventura/casertavecchia-sagrato.jpg`
- **Che cosa si vede:** La facciata a fasce del duomo, il campanile, la porticina e la finestrella della sagrestia, il parapetto sul vuoto.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «La facciata del duomo» in alto al centro (da 25% a 69% della larghezza, da 19% a 46% dell'altezza)
  - «Il portale» a mezza altezza al centro (da 42% a 52% della larghezza, da 47% a 69% dell'altezza)
  - «Il campanile» in alto a destra (da 73% a 92% della larghezza, da 6% a 44% dell'altezza)
  - «Il parapetto» in basso a sinistra (da 0% a 11% della larghezza, da 61% a 72% dell'altezza)
  - **passaggio** «Il vicolo, giù al borgo» in basso a sinistra (da 20% a 30% della larghezza, da 66% a 81% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Taddeo (personaggio) a mezza altezza a sinistra (da 13% a 19% della larghezza, da 48% a 69% dell'altezza)
  - «La porta della sagrestia» (compare o cambia) a mezza altezza a destra (da 77% a 83% della larghezza, da 53% a 69% dell'altezza)
  - «La sagrestia» (compare o cambia) a mezza altezza a destra (da 77% a 83% della larghezza, da 53% a 69% dell'altezza)
  - «La finestrella della sagrestia» (compare o cambia) a mezza altezza a destra (da 84% a 89% della larghezza, da 43% a 53% dell'altezza)
  - «La scala sotto la finestrella» (compare o cambia) a mezza altezza a destra (da 84% a 89% della larghezza, da 43% a 69% dell'altezza)

#### ⬜ `casertavecchia-sagrestia.png` — La sagrestia del duomo

- **Guida:** `production/arte/guide-avventura/casertavecchia-sagrestia.jpg`
- **Che cosa si vede:** Un leggio col registro, un cero, l'armadio dei paramenti, la scala di legno che sale, le corde delle campane che scendono dal soffitto.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «Il registro del sagrestano» a mezza altezza a sinistra (da 22% a 38% della larghezza, da 54% a 66% dell'altezza)
  - «Il cero» a mezza altezza a sinistra (da 27% a 30% della larghezza, da 42% a 54% dell'altezza)
  - «Le corde» a mezza altezza a destra (da 78% a 83% della larghezza, da 11% a 67% dell'altezza)
  - **passaggio** «La scala del campanile» a mezza altezza a destra (da 84% a 95% della larghezza, da 17% a 69% dell'altezza)
  - «La porta sul sagrato» a mezza altezza a sinistra (da 3% a 13% della larghezza, da 42% a 69% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «L'armadio dei paramenti» (compare o cambia) a mezza altezza a destra (da 59% a 77% della larghezza, da 31% a 69% dell'altezza)

#### ⬜ `casertavecchia-campanile.png` — La cella delle campane

- **Guida:** `production/arte/guide-avventura/casertavecchia-campanile.jpg`
- **Che cosa si vede:** La cella con tre campane sulla graticcia, gli archi aperti sulla luna, lo spazio al centro libero (ci sta il Campanaro).
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 71% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «La campana piccola» in alto a sinistra (da 14% a 25% della larghezza, da 17% a 36% dell'altezza)
  - «La campana mezzana» in alto a destra (da 75% a 88% della larghezza, da 17% a 39% dell'altezza)
  - «La campana grande» in alto al centro (da 36% a 64% della larghezza, da 14% a 39% dell'altezza)
  - «La luna» a mezza altezza a destra (da 73% a 89% della larghezza, da 42% a 64% dell'altezza)
  - **passaggio** «La scala, giù in sagrestia» in basso a sinistra (da 3% a 16% della larghezza, da 67% a 81% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Il Campanaro Senza Volto (personaggio) a mezza altezza al centro (da 45% a 55% della larghezza, da 42% a 69% dell'altezza)

#### ⬜ `anfiteatro-arcate.png` — L'Anfiteatro Campano, le arcate

- **Guida:** `production/arte/guide-avventura/anfiteatro-arcate.jpg`
- **Che cosa si vede:** Due ordini di arcate di travertino e laterizio, il fornice centrale buio, una colonna spezzata a terra.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-colonna.png`
- **Da dipingere, in queste posizioni:**
  - **passaggio** «La via Appia, verso il bivio» in basso a sinistra (da 0% a 9% della larghezza, da 66% a 81% dell'altezza)
  - **passaggio** «L'ingresso dell'arena» a mezza altezza al centro (da 44% a 56% della larghezza, da 36% a 69% dell'altezza)
  - «Le teste sulle arcate» in alto a sinistra (da 16% a 41% della larghezza, da 17% a 28% dell'altezza)
  - «Il travertino» a mezza altezza a destra (da 63% a 88% della larghezza, da 28% a 67% dell'altezza)
  - «Una colonna spezzata» a mezza altezza a sinistra (da 4% a 8% della larghezza, da 44% a 69% dell'altezza)
  - «Il rumore della folla» in alto al centro (da 34% a 66% della larghezza, da 8% a 25% dell'altezza)

#### ⬜ `anfiteatro-arena.png` — L'Arena dei Dimenticati

- **Guida:** `production/arte/guide-avventura/anfiteatro-arena.jpg`
- **Che cosa si vede:** La sabbia chiara, le gradinate a fasce con le ombre sedute, il podio in alto al centro, le torce, la scala dei sotterranei a destra.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 58% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «Le ombre sulle gradinate» in alto a sinistra (da 22% a 44% della larghezza, da 19% a 50% dell'altezza)
  - **passaggio** «La scala dei sotterranei» a mezza altezza a destra (da 75% a 89% della larghezza, da 42% a 58% dell'altezza)
  - «La sabbia» in basso al centro (da 25% a 56% della larghezza, da 61% a 78% dell'altezza)
  - **passaggio** «Il fornice, verso le arcate» in basso a sinistra (da 0% a 8% della larghezza, da 61% a 81% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Il Giudice dell'Arena (personaggio) in alto al centro (da 46% a 55% della larghezza, da 8% a 36% dell'altezza)
  - Agnese (personaggio) in alto a sinistra (da 9% a 17% della larghezza, da 17% a 36% dell'altezza)
  - Agnese (personaggio) in alto a sinistra (da 9% a 17% della larghezza, da 17% a 36% dell'altezza)
  - «Un ferro nella sabbia» (compare o cambia) in basso al centro (da 63% a 67% della larghezza, da 64% a 71% dell'altezza)

#### ⬜ `anfiteatro-sotterranei.png` — I sotterranei dell'arena

- **Guida:** `production/arte/guide-avventura/anfiteatro-sotterranei.jpg`
- **Che cosa si vede:** Corridoi di mattone sotto l'arena, gabbie, l'argano e il pozzo del montacarichi.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - **passaggio** «La scala, su nell'arena» in basso a sinistra (da 0% a 6% della larghezza, da 56% a 81% dell'altezza)
  - «Un'incisione latina» a mezza altezza a sinistra (da 8% a 19% della larghezza, da 31% a 47% dell'altezza)
  - «Un'incisione con la croce» a mezza altezza al centro (da 30% a 41% della larghezza, da 31% a 47% dell'altezza)
  - «Una gabbia» a mezza altezza al centro (da 52% a 63% della larghezza, da 33% a 69% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «L'argano del montacarichi» (compare o cambia) a mezza altezza a destra (da 73% a 80% della larghezza, da 50% a 67% dell'altezza)
  - «Il montacarichi» (compare o cambia) a mezza altezza a destra (da 77% a 89% della larghezza, da 19% a 67% dell'altezza)
  - «Il pozzo del montacarichi» (compare o cambia) a mezza altezza a destra (da 77% a 89% della larghezza, da 19% a 67% dell'altezza)

#### ⬜ `anfiteatro-gabbie.png` — Le gabbie dell'ipogeo

- **Guida:** `production/arte/guide-avventura/anfiteatro-gabbie.jpg`
- **Che cosa si vede:** Gabbie in fila, una aperta e una socchiusa, il pianale del montacarichi a sinistra, un muro più antico con spirali incise.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo. **Linea di terra:** 71% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - **passaggio** «Il montacarichi, su» a mezza altezza a sinistra (da 3% a 14% della larghezza, da 8% a 69% dell'altezza)
  - «Un'incisione con l'alloro» in alto a sinistra (da 19% a 31% della larghezza, da 28% a 42% dell'altezza)
  - «La scritta antica» a mezza altezza a destra (da 67% a 86% della larghezza, da 31% a 53% dell'altezza)
  - «Le gabbie in fila» a mezza altezza al centro (da 53% a 64% della larghezza, da 42% a 69% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «Una spada di legno» (compare o cambia) a mezza altezza a sinistra (da 23% a 28% della larghezza, da 47% a 64% dell'altezza)
  - «Qualcosa di bianco» (compare o cambia) in basso al centro (da 44% a 48% della larghezza, da 61% a 67% dell'altezza)

### La Reggia di Caserta

#### ⬜ `reggia-cancello.png` — Il viale della Reggia

- **Guida:** `production/arte/guide-avventura/reggia-cancello.jpg`
- **Che cosa si vede:** il viale dritto fra due file di lecci, il cancello coi gigli e la porticina, la garitta a destra con un lampione, la statua del cavaliere inginocchiato davanti al giglio a sinistra; in fondo la facciata con mille finestre buie e una sola accesa al piano nobile; i fili d'oro della città che vi convergono.
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-albero.png`, `scena/ostacolo-statua.png`, `scena/ostacolo-lampione.png`
- **Da dipingere, in queste posizioni:**
  - «Il cancello» a mezza altezza al centro (da 42% a 58% della larghezza, da 42% a 69% dell'altezza)
  - «La garitta» a mezza altezza a destra (da 73% a 83% della larghezza, da 50% a 69% dell'altezza)
  - «Il cavaliere inginocchiato» a mezza altezza a sinistra (da 14% a 21% della larghezza, da 50% a 69% dell'altezza)
  - «La facciata» in alto al centro (da 25% a 75% della larghezza, da 19% a 39% dell'altezza)
  - **passaggio** «Il viale verso San Leucio» a mezza altezza a sinistra (da 0% a 5% della larghezza, da 33% a 69% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Guardia della Reggia (personaggio) a mezza altezza al centro (da 59% a 65% della larghezza, da 47% a 69% dell'altezza)
  - «Il mazzo di chiavi» (compare o cambia) a mezza altezza a destra (da 78% a 81% della larghezza, da 54% a 61% dell'altezza)

#### ⬜ `reggia-scalone.png` — Lo Scalone reale

- **Guida:** `production/arte/guide-avventura/reggia-scalone.jpg`
- **Che cosa si vede:** lo Scalone reale che sale nel buio, i due leoni (uno ruggisce, uno dorme), lo stemma col giglio d'oro vero, il ritratto di famiglia a sinistra in alto, tre porte (sinistra, destra, in cima, quella in cima bassa e bianca), il portone del Cortile in basso al centro; fili d'oro che scendono come radici.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo; dall'alto scendono sottili fili d'oro. **Linea di terra:** 71% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-colonna.png`, `scena/ostacolo-statua.png`
- **Da dipingere, in queste posizioni:**
  - «I leoni di marmo» in basso a sinistra (da 28% a 35% della larghezza, da 56% a 71% dell'altezza)
  - «Lo stemma reale» a mezza altezza al centro (da 45% a 55% della larghezza, da 32% a 43% dell'altezza)
  - «Il ritratto di famiglia» in alto a sinistra (da 16% a 27% della larghezza, da 17% a 39% dell'altezza)
  - **passaggio** «Le stanze dei fili» a mezza altezza a sinistra (da 5% a 14% della larghezza, da 44% a 71% dell'altezza)
  - **passaggio** «La Cappella Palatina» a mezza altezza a destra (da 86% a 95% della larghezza, da 44% a 71% dell'altezza)
  - **passaggio** «In cima allo Scalone» in alto al centro (da 44% a 56% della larghezza, da 11% a 31% dell'altezza)
  - «Il portone del Cortile d'Onore» in basso al centro (da 44% a 56% della larghezza, da 56% a 71% dell'altezza)
  - **passaggio** «Il viale» in basso a destra (da 94% a 100% della larghezza, da 72% a 81% dell'altezza)

#### ⬜ `reggia-fili.png` — Le stanze dei fili

- **Guida:** `production/arte/guide-avventura/reggia-fili.jpg`
- **Che cosa si vede:** stanza di telai senza tessitrici, navette che vanno da sole, un telaio grande a destra con una tela col giglio, un telaio vecchio annerito e spaccato a sinistra, un banco con quattro ritagli di seta, una finestra da cui escono i fili verso i tetti.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo; dall'alto scendono sottili fili d'oro. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-telaio.png`
- **Da dipingere, in queste posizioni:**
  - «Il telaio grande» a mezza altezza a destra (da 69% a 91% della larghezza, da 33% a 69% dell'altezza)
  - «Il telaio bruciato» a mezza altezza a sinistra (da 6% a 20% della larghezza, da 42% a 69% dell'altezza)
  - «Le navette» in alto a destra (da 70% a 89% della larghezza, da 17% a 31% dell'altezza)
  - «La finestra» in alto al centro (da 44% a 53% della larghezza, da 17% a 39% dell'altezza)
  - **passaggio** «Lo Scalone» in basso a destra (da 92% a 100% della larghezza, da 56% a 81% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «Il frammento terzo» (compare o cambia) a mezza altezza a sinistra (da 23% a 30% della larghezza, da 56% a 64% dell'altezza)
  - «Il frammento primo» (compare o cambia) a mezza altezza al centro (da 34% a 41% della larghezza, da 56% a 64% dell'altezza)
  - «Il frammento quarto» (compare o cambia) a mezza altezza al centro (da 45% a 52% della larghezza, da 56% a 64% dell'altezza)
  - «Il frammento secondo» (compare o cambia) a mezza altezza al centro (da 56% a 63% della larghezza, da 56% a 64% dell'altezza)

#### ⬜ `reggia-bianca.png` — La stanza di Bianca

- **Guida:** `production/arte/guide-avventura/reggia-bianca.jpg`
- **Che cosa si vede:** cameretta bianca, lettino rimboccato a sinistra, tavolino con quaderno e scatola musicale (bambina di legno col giglio sul coperchio), disegno a carboncino sul muro (padre col mantello rosso, madre, bambina per mano), finestra con tenda che dà sul Cortile.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo. **Linea di terra:** 69% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «Il lettino» a mezza altezza a sinistra (da 13% a 36% della larghezza, da 54% a 69% dell'altezza)
  - «Il quaderno» in basso al centro (da 47% a 51% della larghezza, da 62% a 67% dell'altezza)
  - «Il disegno sul muro» in alto a sinistra (da 23% a 36% della larghezza, da 19% a 36% dell'altezza)
  - «La finestra» in alto a destra (da 73% a 86% della larghezza, da 19% a 47% dell'altezza)
  - **passaggio** «Lo Scalone» in basso a sinistra (da 0% a 8% della larghezza, da 56% a 81% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «La scatola musicale» (compare o cambia) in basso al centro (da 52% a 58% della larghezza, da 59% a 67% dell'altezza)

#### ⬜ `reggia-cappella.png` — La Cappella Palatina

- **Guida:** `production/arte/guide-avventura/reggia-cappella.jpg`
- **Che cosa si vede:** cappella palatina, colonne, arco sull'altare coperto di gigli secchi, inginocchiatoio di velluto consumato, banchi, una piccola lapide col giglio, lampada votiva rossa.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-colonna.png`
- **Da dipingere, in queste posizioni:**
  - «L'altare» a mezza altezza al centro (da 41% a 59% della larghezza, da 53% a 65% dell'altezza)
  - «L'inginocchiatoio» in basso al centro (da 45% a 55% della larghezza, da 67% a 75% dell'altezza)
  - «I banchi» in basso a sinistra (da 19% a 41% della larghezza, da 66% a 74% dell'altezza)
  - «La lapide piccola» a mezza altezza a destra (da 69% a 77% della larghezza, da 42% a 53% dell'altezza)
  - «La lampada votiva» in alto al centro (da 47% a 53% della larghezza, da 19% a 36% dell'altezza)
  - **passaggio** «Lo Scalone» in basso a sinistra (da 0% a 8% della larghezza, da 56% a 81% dell'altezza)

#### ⬜ `reggia-cortile.png` — Il Cortile d'Onore

- **Guida:** `production/arte/guide-avventura/reggia-cortile.jpg`
- **Che cosa si vede:** il Cortile d'Onore di notte, colonnato e archi, poche torce, il balcone del piano nobile con la finestra accesa, luna ferma; spazio al centro per il Custode (figura `gregorio`).
- **Luce:** notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde; dall'alto scendono sottili fili d'oro. **Linea di terra:** 68% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-colonna.png`, `scena/ostacolo-lampione.png`
- **Da dipingere, in queste posizioni:**
  - «Il giglio sul petto» a mezza altezza al centro (da 48% a 52% della larghezza, da 47% a 54% dell'altezza)
  - «L'alabarda» a mezza altezza al centro (da 55% a 59% della larghezza, da 25% a 67% dell'altezza)
  - «Le chiavi alla cintura» a mezza altezza al centro (da 46% a 51% della larghezza, da 57% a 63% dell'altezza)
  - «Il balcone» in alto al centro (da 39% a 61% della larghezza, da 17% a 28% dell'altezza)
  - «Le torce» a mezza altezza a sinistra (da 16% a 22% della larghezza, da 42% a 53% dell'altezza)
  - «Il portone» a mezza altezza a destra (da 92% a 100% della larghezza, da 47% a 69% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Gregorio, il Custode (personaggio) a mezza altezza al centro (da 45% a 55% della larghezza, da 42% a 69% dell'altezza)

#### ⬜ `reggia-ultima.png` — Il Cortile d'Onore, dopo

- **Guida:** `production/arte/guide-avventura/reggia-ultima.jpg`
- **Che cosa si vede:** lo stesso Cortile, torce spente e fumanti, la scala laterale a destra, l'armatura a terra col mantello rosso vuoto e il giglio spezzato, una finestra accesa dietro il colonnato, fili dorati che si irradiano dal centro (dove sta Donna Luciana) verso la città oltre il colonnato.
- **Luce:** sotto il Velo: gli stessi colori ma spenti e grigio-azzurri, foschia bassa, fili d'oro che scendono dall'alto. **Linea di terra:** 68% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-colonna.png`
- **Da dipingere, in queste posizioni:**
  - «Il mantello rosso» in basso al centro (da 28% a 42% della larghezza, da 57% a 68% dell'altezza)
  - «I fili dorati» in alto a destra (da 56% a 88% della larghezza, da 6% a 28% dell'altezza)
  - «La città oltre il cortile» in alto a sinistra (da 3% a 27% della larghezza, da 11% a 39% dell'altezza)
  - «Le torce spente» a mezza altezza a sinistra (da 16% a 22% della larghezza, da 42% a 53% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Donna Luciana (personaggio) a mezza altezza al centro (da 47% a 55% della larghezza, da 36% a 69% dell'altezza)
  - «La scala laterale» (compare o cambia) a mezza altezza a destra (da 63% a 75% della larghezza, da 28% a 68% dell'altezza)

### Epilogo

#### ⬜ `epilogo-cortile-libero.png` — Il Cortile della Reggia, dopo

- **Guida:** `production/arte/guide-avventura/epilogo-cortile-libero.jpg`
- **Che cosa si vede:** Il Cortile della Reggia di giorno: cielo azzurro intenso, marmo caldo, sagome della folla sulla destra, un fazzoletto bianco a terra al centro, un mantello rosso vuoto su un'armatura spezzata. Colori vivi: è il quadro più luminoso del gioco (§XX).
- **Luce:** giorno appena nato: cielo azzurro chiaro, luce calda e piena, colori vivi (sono i soli quadri di giorno). **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-albero.png`
- **Da dipingere, in queste posizioni:**
  - «Il mantello rosso» in basso a destra (da 64% a 73% della larghezza, da 59% a 72% dell'altezza)
  - «Il cielo» in alto al centro (da 19% a 81% della larghezza, da 6% a 19% dell'altezza)
  - **passaggio** «Il cancello verso la città» a mezza altezza a sinistra (da 0% a 8% della larghezza, da 33% a 72% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - «Il giglio ricamato» (compare o cambia) in basso al centro (da 47% a 53% della larghezza, da 66% a 72% dell'altezza)
  - Guardia della Reggia (personaggio) a mezza altezza a destra (da 73% a 80% della larghezza, da 42% a 69% dell'altezza)
  - Cittadino di Caserta (personaggio) a mezza altezza a destra (da 81% a 98% della larghezza, da 39% a 69% dell'altezza)
  - Agnese (personaggio) a mezza altezza al centro (da 34% a 41% della larghezza, da 42% a 69% dell'altezza)

#### ⬜ `epilogo-corso-libero.png` — Corso Trieste, nella luce

- **Guida:** `production/arte/guide-avventura/epilogo-corso-libero.jpg`
- **Che cosa si vede:** Corso Trieste nella luce del mattino: facciate gialle, una finestra al primo piano (Mariella), una statua di pietra inerte a sinistra, panni stesi, nessun filo.
- **Luce:** giorno appena nato: cielo azzurro chiaro, luce calda e piena, colori vivi (sono i soli quadri di giorno). **Linea di terra:** 70% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-statua.png`
- **Da dipingere, in queste posizioni:**
  - «La finestra di Mariella» in alto a destra (da 72% a 80% della larghezza, da 17% a 34% dell'altezza)
  - «La statua» a mezza altezza a sinistra (da 15% a 23% della larghezza, da 44% a 70% dell'altezza)
  - «Un gatto» in basso al centro (da 34% a 40% della larghezza, da 64% a 70% dell'altezza)
  - **passaggio** «Verso Piazza Dante» a mezza altezza a destra (da 92% a 100% della larghezza, da 33% a 72% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Taddeo (personaggio) a mezza altezza al centro (da 59% a 66% della larghezza, da 42% a 69% dell'altezza)
  - Cittadino di Caserta (personaggio) a mezza altezza al centro (da 44% a 49% della larghezza, da 44% a 69% dell'altezza)

#### ⬜ `epilogo-piazza-libera.png` — Piazza Dante, sotto il cielo azzurro

- **Guida:** `production/arte/guide-avventura/epilogo-piazza-libera.jpg`
- **Che cosa si vede:** Piazza Dante (lo stesso emiciclo del prologo) sotto il cielo azzurro: banco di Tonino a sinistra, porta della bottega al centro con l'insegna del fabbro, la targa a destra, le finestre che si chiudono. Bella e ostile.
- **Luce:** giorno appena nato: cielo azzurro chiaro, luce calda e piena, colori vivi (sono i soli quadri di giorno). **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-statua.png`, `scena/banchetto-tonino.png`
- **Da dipingere, in queste posizioni:**
  - «La targa del 1839» a mezza altezza a destra (da 66% a 73% della larghezza, da 42% a 53% dell'altezza)
  - «La porta della bottega» a mezza altezza al centro (da 45% a 53% della larghezza, da 33% a 60% dell'altezza)
  - «Un bambino» in basso al centro (da 38% a 42% della larghezza, da 56% a 69% dell'altezza)
  - «Oltre la piazza» a mezza altezza a destra (da 91% a 100% della larghezza, da 31% a 72% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Tonino (personaggio) a mezza altezza a sinistra (da 22% a 29% della larghezza, da 42% a 69% dell'altezza)
  - Guardia della Reggia (personaggio) a mezza altezza a destra (da 78% a 88% della larghezza, da 42% a 69% dell'altezza)

#### ⬜ `epilogo-piazza-velata.png` — Piazza Dante, nella foschia

- **Guida:** `production/arte/guide-avventura/epilogo-piazza-velata.jpg`
- **Che cosa si vede:** La stessa Piazza Dante nella foschia grigio-azzurra: luce uniforme e fredda, verdi pallidi, fili d'oro sottili sopra i tetti, il portico a destra, tutti sorridono.
- **Luce:** sotto il Velo: gli stessi colori ma spenti e grigio-azzurri, foschia bassa, fili d'oro che scendono dall'alto. **Linea di terra:** 69% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-statua.png`, `scena/banchetto-tonino.png`
- **Da dipingere, in queste posizioni:**
  - «La finestra di Mariella» in alto a destra (da 72% a 80% della larghezza, da 17% a 34% dell'altezza)
  - «La targa del 1839» a mezza altezza al centro (da 63% a 70% della larghezza, da 42% a 53% dell'altezza)
  - «La porta della bottega» a mezza altezza al centro (da 45% a 53% della larghezza, da 33% a 60% dell'altezza)
  - «Un gatto d'ombra» in basso al centro (da 36% a 41% della larghezza, da 64% a 70% dell'altezza)
  - **passaggio** «Verso San Leucio» in alto a destra (da 92% a 100% della larghezza, da 28% a 39% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Tonino (personaggio) a mezza altezza a sinistra (da 22% a 29% della larghezza, da 42% a 69% dell'altezza)
  - Taddeo (personaggio) a mezza altezza a destra (da 73% a 80% della larghezza, da 42% a 69% dell'altezza)
  - Agnese (personaggio) a mezza altezza a destra (da 84% a 91% della larghezza, da 42% a 69% dell'altezza)

#### ⬜ `epilogo-manifattura-velata.png` — La manifattura di San Leucio

- **Guida:** `production/arte/guide-avventura/epilogo-manifattura-velata.jpg`
- **Che cosa si vede:** La manifattura di San Leucio, luce bianca e piatta: file di telai identici, Agnese al centro, una sciarpa rossa a metà sul suo telaio (l'unica macchia di colore).
- **Luce:** sotto il Velo: gli stessi colori ma spenti e grigio-azzurri, foschia bassa, fili d'oro che scendono dall'alto. **Linea di terra:** 70% dell'altezza.
- **Oggetti di scena dell'autore da rifare uguali:** `scena/ostacolo-telaio.png`
- **Da dipingere, in queste posizioni:**
  - «Il telaio» a mezza altezza a destra (da 63% a 72% della larghezza, da 42% a 69% dell'altezza)
  - «La statua del cortile» a mezza altezza a destra (da 81% a 88% della larghezza, da 47% a 70% dell'altezza)
  - «Esci dalla manifattura» a mezza altezza a destra (da 91% a 100% della larghezza, da 44% a 72% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Agnese (personaggio) a mezza altezza al centro (da 47% a 54% della larghezza, da 42% a 69% dell'altezza)
  - Cittadino di Caserta (personaggio) a mezza altezza a sinistra (da 9% a 28% della larghezza, da 44% a 69% dell'altezza)

#### ⬜ `epilogo-bottega.png` — La bottega di Gaetano

- **Guida:** `production/arte/guide-avventura/epilogo-bottega.jpg`
- **Che cosa si vede:** La bottega di Gaetano: brace arancione, incudine, un uomo di spalle, a destra una scala a pioli che sale nel buio, da cui scendono tre fili d'oro.
- **Luce:** interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo; dall'alto scendono sottili fili d'oro. **Linea di terra:** 70% dell'altezza.
- **Da dipingere, in queste posizioni:**
  - «L'incudine» in basso al centro (da 39% a 48% della larghezza, da 59% a 70% dell'altezza)
  - «La brace» in basso a sinistra (da 22% a 30% della larghezza, da 56% a 69% dell'altezza)
  - «Tre fili d'oro» in alto al centro (da 52% a 70% della larghezza, da 6% a 39% dell'altezza)
  - «Torna in piazza» a mezza altezza a sinistra (da 0% a 8% della larghezza, da 33% a 70% dell'altezza)
- **Da NON dipingere (li mette il gioco: lascia libero il posto):**
  - Gaetano (personaggio) a mezza altezza al centro (da 31% a 39% della larghezza, da 42% a 69% dell'altezza)
  - «La scala a pioli» (compare o cambia) a mezza altezza a destra (da 81% a 89% della larghezza, da 8% a 70% dell'altezza)

## 4. Le figure (7 da fare)

**Cartella:** `gioco/assets/sprite_teatro/` · **formato:** PNG con **sfondo trasparente vero**; se non ti è possibile,
sfondo **bianco pieno e uniforme** (lo toglie Claude): mai la scacchiera disegnata, mai un alone chiaro.

Ogni figura è un foglio di **una riga con 2 pose, due celle uguali di 256×320** (immagine 512×320), senza righe fra le
celle. Nelle due celle la figura è **la stessa, alla stessa altezza, coi piedi alla stessa quota** (a 8 px dal bordo
basso) e al centro della cella: cambia solo il gesto. Posa 1: ferma. Posa 2: parla, o fa il suo gesto. Figura intera,
di tre quarti, rivolta a sinistra (verso Ferruccio, che arriva da sinistra). Proporzioni e tratto come
`scena/npc-tonino.png` e `guardia_ferma.png`; nessuna ombra a terra dipinta.

| | File | Chi è |
|---|---|---|
| ⬜ | `avv_rosa.png` | Rosa, la moglie di Tonino: popolana sui trent'anni, capelli raccolti, scialle chiaro, grembiule. È un ricordo: un po' luminosa. |
| ⬜ | `avv_mariella.png` | Mariella, alla finestra: giovane donna, scialle lilla, capelli sciolti, un sorriso assente (è sotto il Velo). |
| ⬜ | `avv_gaetano.png` | Gaetano, il fabbro, padre di Ferruccio: anziano e robusto, grembiule di cuoio, maniche arrotolate, baffi grigi, martello in mano. |
| ⬜ | `avv_bianca.png` | Bianca, la bambina di Donna Luciana, otto anni: camicia da notte bianca con un giglio ricamato, capelli chiari, scalza. |
| ⬜ | `avv_cittadino.png` | Un cittadino di Caserta in abito da festa del 1845: giacca corta, panciotto, cappello in mano; dorme in piedi sorridendo. |
| ⬜ | `avv_peppe.png` | Peppe, il giardiniere della Villa: vecchio magro, cappello di paglia, gilè verde, rastrello. |
| ⬜ | `avv_nunzia.png` | Nunzia, tessitrice di San Leucio: mezza età, fazzoletto in testa, grembiule, la spola in mano. |
| ⬜ | `avv_agnese_dorme.png` (una posa sola, 256×320) | Agnese addormentata seduta, la testa sulla spalla, le mani in grembo: la stessa Agnese di `agnese_telaio.png` (cuffia bianca, abito scuro, grembiule di pizzo). |

## 5. Gli oggetti (42 da fare)

**Cartella:** `gioco/assets/avventura/oggetti/` · **formato:** PNG **256×256** con sfondo trasparente vero (o bianco pieno
uniforme), **un file per oggetto** col nome qui sotto.

L'oggetto da solo, intero, che riempie il riquadro con un piccolo margine, visto di tre quarti; stesso contorno e
stessa tavolozza della sezione 1, leggibile anche piccolo (nel gioco è grande come un francobollo). I «ricordi» sono
piccole fiammelle d'anima, ognuna del suo colore, con dentro appena accennata la cosa che ricordano.

| | File | Oggetto | Com'è |
|---|---|---|---|
| ⬜ | `ferro-tenaglie.png` | Le tenaglie di Gaetano | Le tenaglie di mio padre. Con queste io e Taddeo tenemmo il ferro della spada. |
| ⬜ | `ferro-punzone.png` | Il punzone G. F. | Mio padre firmava ogni ferro: G. F. L'acqua lo ha tenuto per sei anni. |
| ⬜ | `ferro-ago.png` | L'ago di Gaetano | L'ago di mio padre, infilato nel telaio. «Almeno quelle non le rompete.» |
| ⬜ | `spada-di-gaetano.png` | La spada | Una lama corta, battuta a mano. Pesa giusta, come se l'avessero fatta per il tuo braccio. |
| ⬜ | `mozzarella.png` | La mozzarella di Tonino | Avvolta in una foglia, ancora tiepida. In tutta la piazza è l'unica cosa che sa di qualcosa. |
| ⬜ | `nastro-azzurro.png` | Il nastro azzurro | Un nastro di seta azzurra, sfilacciato da un capo. Il vento della festa l'ha portato lontano. |
| ⬜ | `lanterna-di-assunta.png` | La lanterna di Assunta | Una lanterna di latta con un mozzicone di candela. La luce trema, ed è l'unica cosa che si muove. |
| ⬜ | `ricordo-rosa.png` | Il ricordo di Rosa | Un'anima color di rosa, posata dentro un vecchio medaglione. È calda come una mano. |
| ⬜ | `lettera-agnese.png` | La lettera di Agnese | Una lettera piegata in quattro, chiusa con un filo di seta rossa. Tonino l'ha custodita per qualcuno. |
| ⬜ | `lanterna-spenta.png` | La lanterna spenta | La lanterna di Assunta. Il vento del Corso l'ha spenta; il mozzicone di candela è ancora buono. |
| ⬜ | `lanterna-accesa.png` | La lanterna accesa | Accesa alla lampada di Mariella. La fiamma è piccola e non trema: neanche il fuoco, qui, ha più fretta. |
| ⬜ | `palanchino.png` | Un palanchino | Una sbarra di ferro col becco, di quelle che la guardia usa per le barricate. Pesa giusto. |
| ⬜ | `ricevuta-gaetano.png` | La ricevuta di Gaetano | Una pagina del libro mastro: «Gaetano F., fabbro. Ferri della cancellata grande: consegnati il giorno promesso.» Sotto, la firma di mio padre. |
| ⬜ | `ricordo-spade-di-legno.png` | Il ricordo delle spade di legno | Un'anima della Regina si è fermata nella mia mano. Dentro ci sono due bambini con due spade di legno. |
| ⬜ | `testimonianza-taddeo.png` | La testimonianza di Taddeo | Scritta da Taddeo sul retro di un foglio di turno, firmata, col bollo della guardia. Il nome che ha dato, il giorno, a chi. |
| ⬜ | `lettera-mariella.png` | La lettera di Mariella | Un foglio piegato in quattro, con l'inchiostro sbiadito. Mariella l'ha scritto prima del Velo. |
| ⬜ | `ricordo-centina.png` | Una scheggia della centina | Legno marcio dentro, verniciato fuori. Porta un ricordo del crollo. |
| ⬜ | `ricordo-mani.png` | Un guanto da fabbro bruciato | Cuoio annerito, consumato sul palmo. Porta un ricordo del crollo. |
| ⬜ | `ricordo-ragazzi.png` | Un berretto da ragazzo | Piccolo, di panno, con la visiera rotta. Porta un ricordo del crollo. |
| ⬜ | `rastrello.png` | Il rastrello di Peppe | Manico lungo, denti di ferro. Arriva dove le mani non arrivano. |
| ⬜ | `chiave-armadio.png` | La chiave della Madre | Una chiavetta di ferro rimasta nella conca di marmo. È calda, come se qualcuno l'avesse stretta per sei anni. |
| ⬜ | `registro-gaetano.png` | Il registro di Gaetano | Il registro originale dei lavori del 1839. Le cancellature dimostrano la falsificazione. |
| ⬜ | `ruota-storta.png` | Una ruota dentata storta | Una ruotina di ricambio per i telai. Un dente piegato, il mozzo ovale. Così non gira. |
| ⬜ | `martello.png` | Il martelletto della forgetta | Un martello piccolo da aggiustatore di telai. Il manico è lucido di mani. |
| ⬜ | `ruota-dentata.png` | La ruota dentata raddrizzata | Gira tonda, ogni dente al suo posto. È fatta per il telaio di Agnese. |
| ⬜ | `ruotina-spezzata.png` | La ruotina spezzata | Una piccola ruota di telaio rotta in due. Agnese la teneva nel cesto «da sempre». |
| ⬜ | `sciarpa-consumata.png` | La sciarpa consumata | Lunga, rossa, lisa ai bordi. È quella che lei mi regalò. Stava fra gli scarti della Reggia. |
| ⬜ | `fazzoletto-bianca.png` | Il fazzoletto col giglio | Un fazzolettino di lino. Un giglio ricamato a punti incerti, lasciato a metà. |
| ⬜ | `anima-promessa.png` | Il ricordo della promessa | Una luce rossa, calda, salita dalla Tessitrice di Pietra. Dentro c'è una bottega che non esiste ancora. |
| ⬜ | `ricordo-noi.png` | Il ricordo di noi due | Una striscia di trama rossa e oro, tessuta sul telaio di Agnese: il primo giorno, la sciarpa, la promessa. |
| ⬜ | `sciarpa-rossa.png` | La sciarpa rossa | La sciarpa che Agnese ha finito stanotte. Ora la porto al collo. |
| ⬜ | `chiave-giglio.png` | La chiave col giglio | Una chiave della garitta, con un giglio sull'impugnatura. Apre la porticina del cancello. E forse altro. |
| ⬜ | `frammenti-di-seta.png` | I quattro frammenti di seta | Quattro ritagli di seta di San Leucio, con quattro cartellini scritti dalla stessa mano. |
| ⬜ | `chiavetta-scatola.png` | La chiavetta d'ottone | Una chiavetta da carica, piccola come un dito di bambina. Era in mezzo ai gigli secchi dell'altare. |
| ⬜ | `scatola-musicale.png` | La scatola musicale di Bianca | Una scatola di legno chiaro. Sul coperchio, una bambina intagliata regge un giglio. |
| ⬜ | `chiave-sagrestia.png` | La chiave della sagrestia | Una chiave lunga, di ferro nero, con l'anello consumato. Taddeo l'ha presa dalla sagrestia del duomo. |
| ⬜ | `scala-pioli.png` | La scala a pioli | Una scala corta di castagno, di quelle per cogliere le olive. Sta in spalla. |
| ⬜ | `ricordo-campane.png` | Il ricordo delle campane | Una luce grigia e tiepida, salita dal campanile del duomo. Dentro, un rintocco solo, che non fa male. |
| ⬜ | `manovella.png` | La manovella dell'argano | Un manico di ferro piegato a gomito, con il foro quadro. Era sepolto nella sabbia dell'arena. |
| ⬜ | `rudis.png` | La rudis | Una spada di legno, liscia di mani. Ai gladiatori la davano quando erano liberi. |
| ⬜ | `tessera-gladiatore.png` | La tessera del gladiatore | Una tessera d'osso, con un nome inciso: «FELIX · SPECTATVS». |
| ⬜ | `ricordo-arena.png` | Il ricordo dell'arena | Una luce color sabbia, salita dalla toga del Giudice. Dentro, mille pollici alzati. |

## 6. Consegna

- I fondali in `gioco/assets/avventura/`, le figure in `gioco/assets/sprite_teatro/`, gli oggetti in
  `gioco/assets/avventura/oggetti/`. Solo PNG, nomi esatti, tutto minuscolo coi trattini come scritto.
- Ordine consigliato: il campione `piazza-centro.png` → gli altri fondali di Piazza Dante → i capitoli in ordine →
  le figure → gli oggetti.
- Se un'immagine esiste già (segno ✅ in questo file), non rifarla a meno che l'autore non lo chieda.

Fondali fatti: 0 su 55. Figure da fare: 7. Oggetti fatti: 0 su 42.
