# Immagini da far disegnare — l'avventura grafica

Documento per l'autore, generato da `tools/avventura-richieste-immagini.js` (non modificare a mano: rilanciare).

L'avventura oggi disegna ogni luogo **col codice**, in stile teatro d'ombre. Ogni fondale che arriva prende il posto
del disegno provvisorio, senza toccare i file `.js` e `.html`: basta aggiungere il PNG col nome esatto in
`gioco/assets/avventura/` e rilanciare `node tools/avventura-immagini.js` (lo faccio io).

**Misura:** 1280×720 (16:9), opaco. **La fascia in basso (un sesto dell'altezza, sotto i 600 px) resta scura e vuota:**
lì il gioco mette gli oggetti raccolti e i pulsanti. **Senza personaggi dentro** (Ferruccio, Tonino, Agnese… li mette il
gioco) e senza scritte. Il pavimento dove si cammina sta fra i 470 e i 600 px di altezza.

**Stile:** lo stesso del Teatro (`design/art/art-bible.md`): sagome scure, luce calda di lanterna, luna ferma, fili d'oro
che scendono dall'alto dove la scena è sotto il Velo. Prompt di contesto e frase di stile: quelli di
`production/arte/richieste-gemini-seconda-ondata.md`.

## Prologo

| | File (in `gioco/assets/avventura/`) | Luogo | Che cosa si vede |
|---|---|---|---|
| ⬜ | `prologo-festa.png` | Caserta, la notte della festa | Caserta in festa vista dall'alto della piazza: la Reggia appena finita sullo sfondo, file di lanterne di carta, un fuoco d'artificio aperto e fermo nel cielo, ballerini e banda immobili, un velo di seta pallida che scende dalla luna piena. |
| ⬜ | `prologo-risveglio.png` | Il risveglio | Il selciato di Piazza Dante a terra, in primo piano una pozzanghera col riflesso della luna; una spada corta sulle pietre; un uomo in abito da festa che dorme in piedi contro un banco. |

## Piazza Dante

| | File (in `gioco/assets/avventura/`) | Luogo | Che cosa si vede |
|---|---|---|---|
| ⬜ | `piazza-centro.png` | Piazza Dante | Piazza Dante: case basse, il banco di Tonino con conca di mozzarelle e lanterna accesa, una sedia di paglia vuota accanto, una donna col cesto addormentata, la porta sprangata in fondo, una finestra accesa al primo piano. |
| ⬜ | `piazza-nastri.png` | I banchetti della festa | I banchetti della festa: il banco di Assunta sotto una tenda rossa, nastri appesi a un filo (un chiodo vuoto), il banco dei dolci con una vespa ferma in aria, un bambino addormentato col torrone. |
| ⬜ | `piazza-bottega.png` | La bottega sprangata | Facciata di tufo con la porta di quercia sbarrata da due assi in croce e sigilli rossi; insegna di ferro battuto annerita «GAETANO — FABBRO»; finestrella con grata a riccioli e un giglio; un nastro azzurro impigliato nelle assi. |
| ⬜ | `piazza-finestra.png` | La finestra di Mariella | Palazzetto con una finestra accesa: Mariella affacciata col mento sulle mani, gerani secchi, una filastrocca scritta col gesso sotto il davanzale, gradini con la campana di gesso, una guardia che dorme seduta sul gradino. |
| ⬜ | `piazza-targa.png` | La targa del 1839 | Una lapide di marmo bianco su un muro, illuminata da un solo lampione; fiori secchi ai piedi; un notabile col cilindro fermo davanti; a destra un arco nero verso i Quattro Canti. |
| ⬜ | `piazza-quattro-canti.png` | I Quattro Canti | Incrocio stretto fra quattro case alte, due archi, un'edicola votiva spenta; al centro un buio denso dove si intravedono due occhi verdi e la sagoma di un gatto enorme su un mucchio di oggetti di casa (cucchiai, culla, ritratto, medaglione). |

## Corso Trieste

| | File (in `gioco/assets/avventura/`) | Luogo | Che cosa si vede |
|---|---|---|---|
| ⬜ | `corso-inizio.png` | Corso Trieste | Corso Trieste di notte in 3/4: a sinistra la vetrina dell'orefice, al centro un portone col giglio, a destra un portico con la garitta e l'imbocco di un vicolo; vespe a file nel cielo verso la sagoma lontana della Reggia; lampioni spenti, selciato lucido. |
| ⬜ | `corso-finestra.png` | La finestra di Mariella | una casa stretta con una sola finestra accesa (calda, unica luce della strada), gerani secchi, un portone con le tacche dei bambini; a sinistra l'arco di un vicolo, a destra una merceria buia. |
| ⬜ | `corso-vicolo.png` | Il vicolo dietro la casa | vicolo cieco di tufo giallo; al centro l'arco di una porta murata con pietre più chiare; chiodi con gabbie vuote, un gatto fermo a metà passo; luce che viene dall'angolo. |
| ⬜ | `corso-guardia.png` | Il posto di guardia | porticato con quattro archi; garitta a strisce, lanterna al chiodo, leggio col registro, rastrelliera con due lance e un palanchino, un avviso col giglio. |
| ⬜ | `corso-bottega.png` | Il banco dei pegni | insegna «BANCO DI PEGNI E PRESTITI», vetrina con culla, violino e fede; porta socchiusa con luce gialla; nuvola di vespe davanti; a destra un lampione col gancio. (Variante senza sciame, con la lanterna appesa e la corona di vespe: corso-bottega-libera.png.) |
| ⬜ | `corso-nido.png` | Il nido della Regina | interno del banco: pareti a favo con cambiali nelle celle, bancone, bilancia da prestatore, cassa ferrata; luce di cera. La Regina è la figura (foglio regina-vespa), non il fondale. |
| ⬜ | `corso-fondo.png` | In fondo al Corso | fine del Corso: panchina di pietra, cancello della Villa con le lance a giglio, lecci e pini, nebbia; anime colorate che salgono sopra i tetti. |

## La Fucina del Ricordo

| | File (in `gioco/assets/avventura/`) | Luogo | Che cosa si vede |
|---|---|---|---|
| ⬜ | `fucina-bottega.png` | La bottega di Gaetano | Interno di bottega di fabbro abbandonata: muro con tenaglie e ago appesi e l'impronta pulita di un punzone mancante, banco con morsa e un disegno di ponteggio, forgia spenta col mantice, porta bassa in fondo col chiavistello. |
| ⬜ | `fucina-cuore.png` | La Fucina del Ricordo | La Fucina del Ricordo: stanza senza pareti visibili, un'incudine al centro sotto una luce d'oro, scintille che salgono invece di cadere (in ognuna un piccolo oggetto di ferro), fili d'oro dall'alto; posto per la sagoma di Gaetano all'incudine. |

## Villa Comunale

| | File (in `gioco/assets/avventura/`) | Luogo | Che cosa si vede |
|---|---|---|---|
| ⬜ | `villa-cancello.png` | Il cancello della Villa | Cancello di ferro battuto socchiuso fra due pilastri, siepi, un leccio a sinistra e una palma a destra, lampione acceso, garitta vuota; luna ferma. |
| ⬜ | `villa-viale.png` | Il viale delle statue | Viale di lecci in prospettiva verso la fontana; a sinistra il cavaliere di marmo in ginocchio davanti a un giglio, a destra l'uomo in divisa e la bambina di marmo; panchina al centro; a destra la casina con la finestra accesa. |
| ⬜ | `villa-casina.png` | La casina dei registri | Interno dell'archivio: scaffali di registri fino al soffitto, leggio, tavolo con lanterna accesa, armadio di noce con serratura di ferro, attrezzi da giardiniere nell'angolo. |
| ⬜ | `villa-serra.png` | La serra dei limoni | Serra di ferro e vetri appannati, limoni secchi in vasi di terracotta, il limone grande al centro con un guanto nero appeso in alto; foschia fredda del Velo. |
| ⬜ | `villa-fontana.png` | La fontana muta | Fontana a vasca larga, acqua ferma come vetro, nomi incisi sull'orlo; lecci ai lati; al centro lo spazio vuoto per la Madre di Marmo (figura a parte, foglio custode-marmo). |
| ⬜ | `villa-cantiere.png` | Le pietre del cantiere | Fondo della Villa: pietre squadrate ammucchiate, centina di legno spezzata, carriola rovesciata, lapide storta su un muro di tufo; a destra un varco fra i rovi. |
| ⬜ | `acquedotto-archi.png` | Gli archi dell'Acquedotto | Gli archi dell'Acquedotto Carolino su tre ordini, canale d'acqua in basso con piccole luci colorate che scorrono; a destra un condotto che entra nel buio. |
| ⬜ | `acquedotto-nicchia.png` | La nicchia della grata | Volta di tufo sotto un arco basso, nicchia chiusa da una grata a riccioli con le lettere G. F., acqua che passa sotto, tacche di gesso sul muro. |

## San Leucio

| | File (in `gioco/assets/avventura/`) | Luogo | Che cosa si vede |
|---|---|---|---|
| ⬜ | `leucio-arrivo.png` | San Leucio, il borgo della seta | Il borgo della seta: case a schiera dei tessitori, fontanella col getto fermo, lampione acceso, sullo sfondo la manifattura del Belvedere con fili d'oro che escono dal tetto verso sud. |
| ⬜ | `leucio-belvedere.png` | Il cortile del Belvedere | Il cortile: facciata a arcate della manifattura, portone socchiuso con lo stemma, gelso, panca di pietra verso la valle; a destra lontanissima la Reggia illuminata, dove vanno i fili. |
| ⬜ | `leucio-manifattura.png` | La manifattura della seta | Sala lunga coi telai che battono da soli (navette a mezz'aria, pedali abbassati), fili d'oro che salgono al soffitto, banco del capotelaio col libro aperto, porticina annerita a sinistra, porta bassa del magazzino in primo piano (due stati: avvolta nei fili / libera). |
| ⬜ | `leucio-forgetta.png` | La forgetta degli aggiustatori | Forgetta degli aggiustatori: incudine piccola col corno stretto (segno G. F.), forgia spenta, attrezzi appesi in fila, fila di ruotine su un chiodo, finestrella con luna. |
| ⬜ | `leucio-telaio.png` | La sala del telaio grande | La sala del telaio grande: un solo telaio con la lunga sciarpa rossa sull'ordito, lanterna, finestra sulla valle coi fili d'oro, cesto di matasse rosse, cestino col fazzoletto. |
| ⬜ | `leucio-magazzino.png` | Il magazzino delle stoffe | Tre pile di stoffe (rose bianche, foglie verdi, drappi a fiori col giglio d'oro), filo d'oro che scende dalla botola ed entra nella pila col giglio; scala di legno; mucchio di scarti con un lembo rosso; cartellini delle spedizioni. |
| ⬜ | `leucio-filatoio.png` | Il filatoio | Grande ruota di legno e ferro col perno forgiato, rocchetti luminosi, foschia fredda del Velo, fili d'oro che escono da una finestra; spazio a sinistra per la Tessitrice di Pietra (foglio sprite_teatro/tessitrice-pietra, pose: 0 fila, 1 si ferma col fazzoletto, 2 si scioglie). Figure: Agnese posa 0 tesse, posa 1 si volta (agnese_telaio, 2 celle). Nunzia: sagoma «donna» (manca un foglio). |

## Le strade di fuori

| | File (in `gioco/assets/avventura/`) | Luogo | Che cosa si vede |
|---|---|---|---|
| ⬜ | `strada-bivio.png` | La strada di notte, al bivio | Bivio notturno fra San Leucio e la Reggia: una pietra miliare borbonica col giglio, tre sentieri (il viale dei platani al centro, la mulattiera a sinistra, la via Appia a destra), il colle a sinistra, il fascio dei fili d'oro sopra il viale. |
| ⬜ | `casertavecchia-salita.png` | La mulattiera di Casertavecchia | La mulattiera fra gli ulivi, un arco di tufo, un'edicola coi lumini, il campanile in alto contro la luna. |
| ⬜ | `casertavecchia-borgo.png` | I vicoli del borgo vecchio | Un vicolo ad archi del borgo vecchio, la fontana con la lapide, una porta murata con una croce di gesso, una scala a pioli appoggiata al muro. |
| ⬜ | `casertavecchia-sagrato.png` | Il sagrato del duomo | La facciata a fasce del duomo, il campanile, la porticina e la finestrella della sagrestia, il parapetto sul vuoto. |
| ⬜ | `casertavecchia-sagrestia.png` | La sagrestia del duomo | Un leggio col registro, un cero, l'armadio dei paramenti, la scala di legno che sale, le corde delle campane che scendono dal soffitto. |
| ⬜ | `casertavecchia-campanile.png` | La cella delle campane | La cella con tre campane sulla graticcia, gli archi aperti sulla luna, lo spazio al centro libero (ci sta il Campanaro). |
| ⬜ | `anfiteatro-arcate.png` | L'Anfiteatro Campano, le arcate | Due ordini di arcate di travertino e laterizio, il fornice centrale buio, una colonna spezzata a terra. |
| ⬜ | `anfiteatro-arena.png` | L'Arena dei Dimenticati | La sabbia chiara, le gradinate a fasce con le ombre sedute, il podio in alto al centro, le torce, la scala dei sotterranei a destra. |
| ⬜ | `anfiteatro-sotterranei.png` | I sotterranei dell'arena | Corridoi di mattone sotto l'arena, gabbie, l'argano e il pozzo del montacarichi. |
| ⬜ | `anfiteatro-gabbie.png` | Le gabbie dell'ipogeo | Gabbie in fila, una aperta e una socchiusa, il pianale del montacarichi a sinistra, un muro più antico con spirali incise. |

## La Reggia di Caserta

| | File (in `gioco/assets/avventura/`) | Luogo | Che cosa si vede |
|---|---|---|---|
| ⬜ | `reggia-cancello.png` | Il viale della Reggia | il viale dritto fra due file di lecci, il cancello coi gigli e la porticina, la garitta a destra con un lampione, la statua del cavaliere inginocchiato davanti al giglio a sinistra; in fondo la facciata con mille finestre buie e una sola accesa al piano nobile; i fili d'oro della città che vi convergono. |
| ⬜ | `reggia-scalone.png` | Lo Scalone reale | lo Scalone reale che sale nel buio, i due leoni (uno ruggisce, uno dorme), lo stemma col giglio d'oro vero, il ritratto di famiglia a sinistra in alto, tre porte (sinistra, destra, in cima, quella in cima bassa e bianca), il portone del Cortile in basso al centro; fili d'oro che scendono come radici. |
| ⬜ | `reggia-fili.png` | Le stanze dei fili | stanza di telai senza tessitrici, navette che vanno da sole, un telaio grande a destra con una tela col giglio, un telaio vecchio annerito e spaccato a sinistra, un banco con quattro ritagli di seta, una finestra da cui escono i fili verso i tetti. |
| ⬜ | `reggia-bianca.png` | La stanza di Bianca | cameretta bianca, lettino rimboccato a sinistra, tavolino con quaderno e scatola musicale (bambina di legno col giglio sul coperchio), disegno a carboncino sul muro (padre col mantello rosso, madre, bambina per mano), finestra con tenda che dà sul Cortile. |
| ⬜ | `reggia-cappella.png` | La Cappella Palatina | cappella palatina, colonne, arco sull'altare coperto di gigli secchi, inginocchiatoio di velluto consumato, banchi, una piccola lapide col giglio, lampada votiva rossa. |
| ⬜ | `reggia-cortile.png` | Il Cortile d'Onore | il Cortile d'Onore di notte, colonnato e archi, poche torce, il balcone del piano nobile con la finestra accesa, luna ferma; spazio al centro per il Custode (figura `gregorio`). |
| ⬜ | `reggia-ultima.png` | Il Cortile d'Onore, dopo | lo stesso Cortile, torce spente e fumanti, la scala laterale a destra, l'armatura a terra col mantello rosso vuoto e il giglio spezzato, una finestra accesa dietro il colonnato, fili dorati che si irradiano dal centro (dove sta Donna Luciana) verso la città oltre il colonnato. |

## Epilogo

| | File (in `gioco/assets/avventura/`) | Luogo | Che cosa si vede |
|---|---|---|---|
| ⬜ | `epilogo-cortile-libero.png` | Il Cortile della Reggia, dopo | Il Cortile della Reggia di giorno: cielo azzurro intenso, marmo caldo, sagome della folla sulla destra, un fazzoletto bianco a terra al centro, un mantello rosso vuoto su un'armatura spezzata. Colori vivi: è il quadro più luminoso del gioco (§XX). |
| ⬜ | `epilogo-corso-libero.png` | Corso Trieste, nella luce | Corso Trieste nella luce del mattino: facciate gialle, una finestra al primo piano (Mariella), una statua di pietra inerte a sinistra, panni stesi, nessun filo. |
| ⬜ | `epilogo-piazza-libera.png` | Piazza Dante, sotto il cielo azzurro | Piazza Dante (lo stesso emiciclo del prologo) sotto il cielo azzurro: banco di Tonino a sinistra, porta della bottega al centro con l'insegna del fabbro, la targa a destra, le finestre che si chiudono. Bella e ostile. |
| ⬜ | `epilogo-piazza-velata.png` | Piazza Dante, nella foschia | La stessa Piazza Dante nella foschia grigio-azzurra: luce uniforme e fredda, verdi pallidi, fili d'oro sottili sopra i tetti, il portico a destra, tutti sorridono. |
| ⬜ | `epilogo-manifattura-velata.png` | La manifattura di San Leucio | La manifattura di San Leucio, luce bianca e piatta: file di telai identici, Agnese al centro, una sciarpa rossa a metà sul suo telaio (l'unica macchia di colore). |
| ⬜ | `epilogo-bottega.png` | La bottega di Gaetano | La bottega di Gaetano: brace arancione, incudine, un uomo di spalle, a destra una scala a pioli che sale nel buio, da cui scendono tre fili d'oro. |

## Figure che oggi sono sagome a codice

| File (in `gioco/assets/sprite_teatro/`) | Foglio | Descrizione |
|---|---|---|
| `avv_rosa.png` | 1 riga × 2 pose (fermo; parla o gesto), celle 256×320 | Rosa: oggi è la sagoma «donna». |
| `avv_mariella.png` | 1 riga × 2 pose (fermo; parla o gesto), celle 256×320 | Mariella: oggi è la sagoma «donna». |
| `avv_gaetano.png` | 1 riga × 2 pose (fermo; parla o gesto), celle 256×320 | Gaetano: oggi è la sagoma «vecchio». |
| `avv_bianca.png` | 1 riga × 2 pose (fermo; parla o gesto), celle 256×320 | Bianca: oggi è la sagoma «bambina». |
| `avv_guardia.png` | 1 riga × 2 pose (fermo; parla o gesto), celle 256×320 | Guardia della Reggia: oggi è la sagoma «guardia». |
| `avv_cittadino.png` | 1 riga × 2 pose (fermo; parla o gesto), celle 256×320 | Cittadino di Caserta: oggi è la sagoma «uomo». |
| `avv_gatto-canti.png` | 1 riga × 2 pose (fermo; parla o gesto), celle 256×320 | Il Gatto dei Quattro Canti: oggi è la sagoma «gatto». |
| `avv_peppe.png` | 1 riga × 2 pose (fermo; parla o gesto), celle 256×320 | Peppe, il giardiniere: oggi è la sagoma «uomo». |
| `avv_nunzia.png` | 1 riga × 2 pose (fermo; parla o gesto), celle 256×320 | Nunzia, tessitrice: oggi è la sagoma «donna». |

Fondali: 0 disegnati su 55.
