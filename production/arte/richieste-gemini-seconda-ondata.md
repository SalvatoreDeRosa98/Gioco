# Immagini da far disegnare — seconda ondata

Documento per l'autore, 2026-11-12. Sono le parti nuove del gioco che oggi sono **disegnate col codice** (sagome
provvisorie): Grande Burattinaio, Acquedotto Carolino, Camerini, Banco del Lotto, Buca dell'Orchestra, botole,
Ragno della Seta. Il gioco funziona anche senza: ogni immagine che arriva prende il posto del disegno provvisorio.

**Cosa deve fare chi disegna:** solo aggiungere i PNG nella cartella indicata, col nome esatto. Niente modifiche ai
file `.js` e `.html`: al gioco le collego io (pose e griglie qui sotto sono quelle che il codice si aspetta).

**Prompt di contesto:** quello di `production/arte/richieste-gemini-palcoscenico.md` (sezione «Prompt di contesto»),
allegando `gioco/assets/sprite_teatro/ferruccio.png`. In coda a ogni richiesta aggiungi la **frase di stile**:

```
Stile identico al foglio di Ferruccio allegato: sagoma pulita con un contorno scuro netto e di spessore uniforme,
pochi colori piatti con ombre morbide, corpo in toni scuri e poco saturi (nero d'ombra, bruni, viola notte),
accenti piccoli e accesi solo su occhi, fiamme, oro e rosso. Nessun alone chiaro attorno alla figura, nessuna
scritta, nessun pezzo di altre figure. Sfondo trasparente. In ogni cella la figura intera è alla stessa altezza,
con i piedi (o il centro del corpo, se vola) alla stessa quota e sullo stesso asse: cambiano solo le parti che
si muovono.
```

Per ogni riga chiedi: «Genera `<file>`: <descrizione>. Dimensione minima <L>×<A> px.» I fogli a più fotogrammi:
una riga per posa, fotogrammi da sinistra a destra, celle tutte uguali, senza bordi fra le celle.

Dopo la consegna le figure passano da `tools/migliora-sprite-teatro.py` (pulizia, piedi fermi, contorno unico,
versione «a ombre»), come le altre.

**Ordine consigliato:** A (il finale è la scena più vista nei filmati), poi B, poi C; D, E, F e G sono piccole.

## A. Il Grande Burattinaio (scontro finale) — `gioco/assets/sprite_teatro/`

| # | File | Dimensione minima | Descrizione |
|---|---|---|---|
| A1 | `gb_guanto.png` | foglio, celle 384×384: 1 riga × 5 pose | Guanto bianco enorme con polsino e impuntura d'oro, attaccato a una manica nera che sale verso l'alto. Cinque pose: mano aperta; pugno chiuso; presa (dita a uncino); di taglio (per la spazzata); floscia (sconfitta). È l'UNICO bianco pieno della scena. |
| A2 | `gb_forbici.png` | foglio, celle 640×256: 1 riga × 3 pose | Forbici d'ottone colossali: lame lunghe, perno a vite ben visibile, grandi anelli dei manici. Tre pose: chiuse; aperte; piantate nelle assi del palco. |
| A3 | `gb_ombra_capo.png` | 640×240 | Spalle e testa del Burattinaio in ombra, viste dal basso dietro le travi: solo due bagliori al posto degli occhi. Non si deve mai vedere intero. |
| A4 | `ribalta_graticcia.png` | 1920×1080 (opaca) | Sfondo: la graticcia sopra il palco vista dall'alto, tavole di legno con fessure, travi e carrucole, corde coi contrappesi ai lati; fra le assi, piccolo e illuminato laggiù, il palco. |

## B. L'Acquedotto Carolino (percorso alternativo al piano 2)

Scenografia in `gioco/assets/sprite_teatro/scena/`, figure in `gioco/assets/sprite_teatro/`.

| # | File | Dimensione minima | Descrizione |
|---|---|---|---|
| B1 | `scena/fondale-acquedotto.png` | 1920×64 (opaca) | Striscia di fondale dipinto: cielo notturno con stelle e luna calante, due spalle di monti scure, in mezzo i Ponti della Valle (tre ordini di archi di tufo chiaro, il più alto il più lungo). |
| B2 | `scena/quinta-acquedotto.png` | 160×1872 | Quinta verticale: pilone di tufo con tre archi sovrapposti aperti sul cielo notturno, cornicione fra gli ordini. Il gioco la specchia per l'altro lato. |
| B3 | `scena/pavimento-acquedotto.png` | 1512×702 (opaca) | Lastre di tufo giallo-bruno a corsi sfalsati viste dall'alto, muschio nelle fughe, chiazze d'umido; scura e poco contrastata. |
| B4 | `scena/grata-condotto.png` | foglio, celle 200×160: 1 riga × 2 | Bocca di tufo nel pavimento con grata di ferro: chiusa col lucchetto d'oro; aperta (grata girata sul cardine, gradini e acqua scura). |
| B5 | `scena/fiaccola-acquedotto.png` | foglio, celle 96×128: 1 riga × 4 | Fiaccola di ferro a muro: fiamma dritta (2 forme), piegata a metà, stesa di traverso dal vento. |
| B6 | `scena/drappo-acquedotto.png` | foglio, celle 96×128: 1 riga × 4 | Drappo rosso a coda di rondine con riga d'oro, appeso a un'asta: fermo, ondeggia, piegato, steso di traverso. |
| B7 | `rondone-latta.png` | foglio, celle 293×222: plana 4, punta 2, picchiata 2, colpito 1, morte 3 | Rondone di latta a molla: ali a falce, coda a forbice, ribattini e becco d'oro. «Punta» = ali chiuse all'indietro, occhio rosso. |
| B8 | `lavandaia-tufo.png` | foglio, celle 293×293: lava 4, alza 2, lancia 2, colpito 1, morte 3 | Statua di tufo di lavandaia inginocchiata al lavatoio di pietra, fazzoletto rosso annodato. «Alza» = panno bagnato teso sopra la testa, gocciola. |
| B9 | `scena/panno-bagnato.png` | foglio, celle 96×96: 1 riga × 4 | Panno bianco-azzurro fradicio che sbatte in volo. |
| B10 | `fontaniere.png` | foglio, celle 293×293: cammina 4, gira 4, apre 2, colpito 1, morte 3 | Marionetta di fontaniere borbonico: grembiule di cuoio, berretto a visiera, chiave a T di ferro alta quanto lui. «Gira» = chiave piantata a terra, due mani sulla maniglia. |
| B11 | `guardiano-acque.png` | foglio, celle 384×384: 8 righe × 4 (fermo, muove, anticipo, attacco, evoca, immerge, emerge, colpito) | Marionetta-statua di tritone che esce dall'acqua: barba a punta, corona di canne, coda di pesce, tridente d'oro, otre sotto il braccio. «Anticipo» = inarcato con l'otre in spalla; «evoca» = tridente alzato a due mani. |

## C. Camerini, Banco del Lotto, Buca dell'Orchestra — `gioco/assets/sprite_teatro/scena/`

| # | File | Dimensione minima | Descrizione |
|---|---|---|---|
| C1 | `camerini-specchiera.png` | foglio, celle 160×200: 1 riga × 4 | Specchiera da camerino con cornice a centina di legno scuro e filo d'oro, vetro brunito con un riflesso, mensola del trucco (barattolo, piumino da cipria rosso), due candele ai lati. 4 fotogrammi delle fiammelle che tremolano. |
| C2 | `camerini-stand.png` | 320×320 | Stand di legno con quattro costumi di scena appesi (cremisi, blu notte, nero, oro vecchio), di tre quarti. |
| C3 | `camerini-parrucche.png` | 280×240 | Tavolino con tre teste di legno portaparrucche: due parrucche incipriate bianche, una rossa. |
| C4 | `camerini-baule.png` | 320×280 | Baule dei costumi col coperchio alzato, borchie d'ottone, stoffe cremisi e oro che traboccano. |
| C5 | `manichino-sarta.png` | foglio, celle 192×256: 5 righe × 4 | Manichino da sarta animato: busto a clessidra su asta e treppiede, pomello d'ottone al posto della testa, metro rosso a tracolla, un braccio snodato con un lungo ago. Righe: fermo (di legno); saltella sul treppiede; anticipo (si inarca, ago ALZATO che luccica); affondo (ago teso in avanti); colpito. |
| C6 | `porta-servizio.png` | foglio, celle 192×192: 2 righe × 3 | Porta di servizio di teatro: stipite di legno grezzo, tenda bordeaux consunta con toppa e strappo, chiodo che sporge dallo stipite con la punta rossa. Riga 1 di fronte (porte nord/sud), riga 2 di lato (est/ovest); 3 fotogrammi della tenda che ondeggia. |
| C7 | `lotto-cartellone.png` | 256×320 | Cartellone della smorfia su cavalletto: tabella di caselle numerate avorio e rosse SENZA cifre leggibili, fascia d'oro in alto; ai piedi un panariello di vimini con le palline. |
| C8 | `buca-leggio.png` | 128×192 | Leggio d'orchestra di ferro battuto con un foglio di musica (note come macchie, nessun testo). |
| C9 | `buca-timpani.png` | 360×260 | Due timpani di rame sulle gambe, pelle avorio, le mazze appoggiate. |
| C10 | `buca-contrabbasso.png` | 200×420 | Contrabbasso appoggiato in piedi, legno scuro rossiccio, effe e corde chiare. |
| C11 | `buca-direttore.png` | foglio, celle 192×256: 3 righe × 4 | Direttore d'orchestra d'ombra in marsina su un piccolo podio, visto da dietro di tre quarti. Riga 1: bacchetta dal basso (sul tempo) all'alto in 4 fotogrammi; riga 2: gesto ampio del battere; riga 3: inchino. |
| C12 | `buca-metronomo.png` | foglio, celle 96×160: 1 riga × 5 | Metronomo a piramide di legno con l'asta da tutta sinistra a tutta destra. |
| C13 | `buca-orchestrali.png` | foglio, celle 128×160: 2 righe × 3 | Orchestrale d'ombra a mezzo busto dietro il leggio. Riga 1: seduto che suona; riga 2: in piedi che applaude (mani aperte, chiuse, aperte). |

## D. Cambio di scena e botole — `gioco/assets/sprite_teatro/scena/`

| # | File | Dimensione minima | Descrizione |
|---|---|---|---|
| D1 | `botola.png` | foglio, celle 192×160: 1 riga × 4 | Sportello a due ante nel tavolato del palco, con cerniere di ferro, vista di tre quarti dall'alto: chiusa; che trema (ante appena sollevate); socchiusa; aperta con luce calda che sale dal sottopalco. |
| D2 | `fondali-arrotolati.png` | 480×96 | Due rulli di tela dipinta arrotolata, appesi a due corde, visti di fronte. |
| D3 | `fondale-telo.png` | foglio, celle 960×540: 1 riga × 3 (opache) | Tre teli di fondale dipinti a ombre, uno per quartiere: il Vesuvio dietro i tetti; alberi tondi di giardino con lucciole; archi e cupole. Con una stanga di legno lungo il bordo basso. |

## E. Registro di Scena — `gioco/assets/sprite_teatro/scena/` (facoltative)

| # | File | Dimensione minima | Descrizione |
|---|---|---|---|
| E1 | `leggio_registro.png` | 192×256 | Leggio a tre zampe col librone aperto e un segnalibro rosso, a ombre col contorno color lanterna; il piede in basso al centro. |
| E2 | `registro_carta.png` | 1136×648 (opaca) | Fondo di pagina doppia di registro ottocentesco: carta invecchiata con la piega al centro, bordi appena bruniti, nessuna scritta. |

## F. Il Ragno della Seta — `gioco/assets/sprite_teatro/`

| # | File | Dimensione minima | Descrizione |
|---|---|---|---|
| F1 | `ragno_seta.png` | foglio, celle 192×160: 1 riga × 4 | Ragno piccolo a otto zampe snodate, sagoma d'ombra con contorno color lanterna e due occhi rossi. Pose: scatto (2 fotogrammi, zampe alterne); pausa accucciata; salto (zampe raccolte in avanti). |

## G. Effetti e sagome (facoltative: oggi disegnati col codice e leggibili)

| # | File | Dimensione minima | Descrizione |
|---|---|---|---|
| G1 | `effetti/nastro_piroetta.png` | foglio, celle 256×256: 1 riga × 4 | Il giro di seta di Agnese: tre spire di nastro chiaro col bordo rosso che girano attorno a un centro vuoto. |
| G2 | `effetti/maglio_arco.png` | foglio, celle 256×256: 1 riga × 3 | La mezzaluna d'ottone del maglio di Taddeo: normale; carica (più larga e luminosa); impatto con polvere. |
| G3 | `effetti/colpo_spettrale.png` | foglio, celle 96×96: 1 riga × 2 | Il colpo dell'Ombra: piccola fiamma lilla con una coda che sfuma. |
| G4 | `scena/sagome-conto.png` | foglio, celle 128×128: 1 riga × 6 | Sagome per il riquadro «Ti ha battuto» del conto della notte: gatto, vespa, guardia, maschera, mano del Burattinaio, boss (figura alta con corona). Nere col contorno color lanterna. |

## Figure esistenti da rifare

Le sette figure che l'elaborazione non riesce ad aggiustare (lucciola, regina delle vespe, capitano, vespa cieca,
accendilumi, cigno di latta, giostra delle lucciole) sono in `production/arte/richieste-sprite-v2.md`, con la griglia
esatta di ciascuna.
