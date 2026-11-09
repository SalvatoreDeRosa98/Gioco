# Richieste di immagini per il generatore (Gemini)

Documento per l'autore (2026-11-09). Le immagini servono al **nuovo motore** del gioco «Ferruccio — La Notte Immobile», repository GitHub `SalvatoreDeRosa98/Gioco`, branch `claude/brave-cannon-ed3d3d`, cartella `gioco/`. Il motore carica da solo ogni file `gioco/assets/sprite/<nome>.png` elencato in `gioco/contenuti/sprite.json`: finché il file manca usa uno sprite provvisorio. Basta salvare i PNG con il nome esatto.

## Prompt di contesto da dare a Gemini prima di ogni richiesta

```
Sei l'illustratore di «Ferruccio — La Notte Immobile», un roguelike d'azione a stanze nello stile di The Binding of Isaac, ambientato a Caserta nel 1845 sotto i Borbone, dentro un teatro di marionette: ogni personaggio è un burattino di legno o d'ombra mosso da fili d'oro. Il gioco è su GitHub (SalvatoreDeRosa98/Gioco, branch claude/brave-cannon-ed3d3d, cartella gioco/) ed è un motore web in Canvas 2D: le immagini che produci vengono caricate direttamente dal gioco come sprite, quindi devi rispettare alla lettera nome del file, dimensione in pixel, numero di fotogrammi, vista e sfondo.

Stile: pixel-art curata a 16 bit con palette dark-fairytale (bruni caldi, avorio, oro, nero d'ombra, rosso cremisi, azzurro dei ricordi), luce calda da lanterna, contorno scuro di 1 px, ombreggiatura a due livelli. Riferimenti di stile e di personaggio (dipinti): https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/ferruccio.jpg , .../assets/agnese.jpg , .../assets/taddeo.jpg , .../assets/nemici_concept.jpg . Traduci quei dipinti in sprite, mantenendo riconoscibili costumi, colori e oggetti.

Regole fisse per ogni immagine:
- vista 3/4 dall'alto come in The Binding of Isaac (si vede il tetto della testa e la facciata del corpo), personaggio rivolto a DESTRA (il sinistro lo ribalta il gioco);
- sfondo TRASPARENTE (PNG con alfa), nessuna ombra a terra dipinta (la disegna il gioco), nessun testo, nessuna cornice;
- la dimensione indicata è quella del SINGOLO fotogramma; se sono richiesti più fotogrammi, consegnali in un unico foglio: una riga per posa, i fotogrammi di quella posa da sinistra a destra, celle tutte uguali, senza spaziatura;
- i piedi del personaggio poggiano sul bordo inferiore della cella, centrati («ancora piedi-centro»); per gli oggetti e le icone il soggetto è centrato;
- i nemici devono farsi leggere SOLO dal corpo: nella posa di anticipo cambiano postura (si accucciano, si gonfiano, alzano l'arma) e nel fotogramma di attacco hanno gli occhi o un dettaglio rosso acceso; NON disegnare mai frecce, cerchi o zone tratteggiate a terra;
- il giocatore è l'unica figura chiara (avorio) con contorno netto; i nemici comuni sono scuri, le statue e le guardie borboniche hanno linee dritte e simmetriche, gli esseri d'ombra linee storte e spezzate;
- una sola immagine per richiesta, con il nome del file esatto nel titolo.
```

## Elenco delle immagini (una richiesta ciascuna)

Per ogni riga chiedi a Gemini: «Genera `<file>`: <descrizione>. Dimensione del fotogramma <L>×<A> px, fotogrammi: <fotogrammi>, ancora: <ancora>.» aggiungendo il riferimento quando c'è.

| # | File | Fotogramma (px) | Fotogrammi / pose | Ancora | Descrizione | Riferimento |
|---|---|---|---|---|---|---|
| 1 | `assets/sprite/ferruccio.png` | 64×80 | fermo×2, cammina×4, spara×2, colpito×1, morto×3 (una riga per posa, fotogrammi da sinistra a destra) | piedi-centro | Ferruccio, burattino di Pulcinella: coppolone bianco piegato in punta, maschera nera col becco, camicione bianco, cintura, sciarpa rossa a due code, stocco; occhio luminoso azzurro nella maschera | [dipinto](https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/ferruccio.jpg) |
| 2 | `assets/sprite/agnese.png` | 64×80 | fermo×2, cammina×4, spara×2, colpito×1, morto×3 (una riga per posa, fotogrammi da sinistra a destra) | piedi-centro | Agnese, la tessitrice di San Leucio: cuffia bianca a punta, viso nero con due occhi bianchi tondi, vestito avorio a balze, nastro rosa al collo, spola con filo rosso in mano | [dipinto](https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/agnese.jpg) |
| 3 | `assets/sprite/taddeo.png` | 64×80 | fermo×2, cammina×4, spara×2, colpito×1, morto×3 (una riga per posa, fotogrammi da sinistra a destra) | piedi-centro | Taddeo, la guardia pentita: elmo di cuoio, giubba rossa borbonica consunta, spada di legno da bambino, postura stanca | [dipinto](https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/taddeo.jpg) |
| 4 | `assets/sprite/ombra.png` | 64×80 | fermo×2, cammina×4, spara×2, colpito×1, morto×3 (una riga per posa, fotogrammi da sinistra a destra) | piedi-centro | Pulcinella d'Ombra, lo spettro del Velo: stessa sagoma di Ferruccio ma tutta d'ombra nera con bordi che sfumano, aureola rossa spezzata, occhi rossi, sciarpa nera |  |
| 5 | `assets/sprite/teste-mira.png` | 32×32 | 4 fotogrammi: su, giù, sinistra, destra (per ciascuno dei 4 personaggi: file teste-mira-<nome>.png) | centro | Solo la testa del personaggio girata nelle quattro direzioni di sparo (come in Isaac): serve per far guardare il burattino dove spara mentre il corpo cammina |  |
| 6 | `assets/sprite/gatto.png` | 48×48 | fermo×2, muove×4, anticipo×2, attacco×2, colpito×1, morte×4 | piedi-centro | Gatto d'ombra: gatto nero di legno snodato con fili d'oro, occhi arancio; nell'anticipo si accuccia, nell'attacco balza allungato | [dipinto](https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/nemici_concept.jpg) |
| 7 | `assets/sprite/vespa-cieca.png` | 48×48 | vola×4, carica×2, colpito×1, morte×3 | piedi-centro | Vespa cieca: insetto meccanico con ali di carta velina strappata, occhi rossi, zampe di filo di ferro; vola dritta contro il giocatore | [dipinto](https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/nemici_concept.jpg) |
| 8 | `assets/sprite/maschera.png` | 64×64 | chiusa×2, si-apre×3, aperta-spara×2, colpito×1, morte×4 | piedi-centro | Maschera d'osso: maschera teatrale color avorio con lacrime di sangue; chiusa è corazzata, si apre a metà mostrando un cuore nero con due occhi rossi che spara tre colpi | [dipinto](https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/nemici_concept.jpg) |
| 9 | `assets/sprite/bomba-ferma.png` | 64×64 | fermo×2, miccia×4, esplode×5 | piedi-centro | Bomba ferma: pupazzo di sacco cucito, pancia che brilla di brace, miccia accesa sulla testa; immobile, esplode in un anello di fuoco | [dipinto](https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/nemici_concept.jpg) |
| 10 | `assets/sprite/guardia.png` | 64×96 | fermo×2, muove×4, anticipo×2, attacco×2, colpito×1, morte×4 | piedi-centro | Guardia borbonica: elmo e corazza d'acciaio, giubba rossa, moschetto con baionetta; pattuglia e spara doppiette | [dipinto](https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/nemici_concept.jpg) |
| 11 | `assets/sprite/statua.png` | 64×96 | fermo×2, trema×3, spara×2, colpito×1, morte×4 | piedi-centro | Statua torretta di marmo: busto classico incrinato su piedistallo, crepe che si accendono di luce quando spara croci rotanti; linee perfette, mai storte |  |
| 12 | `assets/sprite/predone.png` | 64×80 | fermo×2, muove×4, anticipo×2, attacco×2, colpito×1, morte×4 | piedi-centro | Predone d'ombra: ladro con mantello nero e lanterna, sagoma umana d'ombra; veloce, ruba e scappa |  |
| 13 | `assets/sprite/mob-dorato.png` | 48×48 | muove×4, colpito×1, morte×4 | piedi-centro | Mob dorato della stanza segreta: piccolo spirito di luce d'oro a forma di moneta con occhi, lascia monete quando muore |  |
| 14 | `assets/sprite/proiettile-nemico.png` | 16×16 | volo×2, impatto×3 | centro | Proiettile dei nemici: goccia d'ombra con bordo rosso |  |
| 15 | `assets/sprite/re-gatto.png` | 160×160 | fermo×2, anticipo×3, balzo×3, atterra×2, colpito×1, morte×6 | piedi-centro | Il Gatto dei Quattro Canti: gatto nero gigante di legno, occhi d'oro, fili d'oro al dorso; balza come Monstro di Isaac |  |
| 16 | `assets/sprite/capitano-guardia.png` | 160×160 | fermo×2, carica×4, colpito×1, morte×6 | piedi-centro | Il Capitano di Piombo: guardia borbonica enorme con corazza, pennacchio, spadone; carica in linea retta |  |
| 17 | `assets/sprite/regina-vespa.png` | 160×160 | vola×4, evoca×3, colpito×1, morte×6 | piedi-centro | La Regina delle Vespe: vespa gigante con corona di carta e ali strappate, sciame attorno |  |
| 18 | `assets/sprite/colosso-statua.png` | 160×160 | fermo×2, trema×3, spara×2, colpito×1, morte×6 | piedi-centro | Il Custode di Marmo: colosso di marmo incrinato con crepe di luce, torretta immobile |  |
| 19 | `assets/sprite/maestro-fucina.png` | 160×160 | fermo×2, lancia×3, colpito×1, morte×6 | piedi-centro | Lo Spezzafili d'Ottone: automa d'ottone con due lame a forbice, lancia lame rotanti |  |
| 20 | `assets/sprite/donna-luciana.png` | 224×224 | fermo×2, comanda×4, colpito×1, morte×8 | piedi-centro | Donna Luciana, la Burattinaia del Velo: nobildonna d'ombra con abito nero borbonico, viso di porcellana crepata, dita lunghissime da cui scendono fili d'oro; boss finale |  |
| 21 | `assets/sprite/mano-marionetta.png` | 96×96 | scende×3, schianta×2, risale×2 | centro | Una delle Grandi Mani di legno della Burattinaia, con bilancino e fili d'oro; scende dall'alto e si schianta sul palco |  |
| 22 | `assets/sprite/oggetto-spada.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Spada di Gaetano: spada da fabbro con elsa di ferro |  |
| 23 | `assets/sprite/oggetto-piombo.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Lacrima di Piombo: goccia grigia pesante |  |
| 24 | `assets/sprite/oggetto-anello.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Anello Cremisi: anello con rubino |  |
| 25 | `assets/sprite/oggetto-triplo.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Triplo Occhio: tre pupille di vetro |  |
| 26 | `assets/sprite/oggetto-catena.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Catena della Chiusa: catena spezzata azzurrina |  |
| 27 | `assets/sprite/oggetto-venti.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Maschera dei 4 Venti: quattro volti di Pulcinella |  |
| 28 | `assets/sprite/oggetto-chiodo.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Chiodo della Fucina: chiodo battuto a mano |  |
| 29 | `assets/sprite/oggetto-fuoco.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Tizzone di Bragia: carbone ardente |  |
| 30 | `assets/sprite/oggetto-doppia.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Lente di San Leucio: lente da tessitrice |  |
| 31 | `assets/sprite/oggetto-mercurio.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Goccia di Mercurio: goccia d'argento vivo |  |
| 32 | `assets/sprite/oggetto-cuore.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Medaglione di Rosa: medaglione d'oro aperto con un ritratto |  |
| 33 | `assets/sprite/oggetto-stivali.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Sciarpa Rossa di Agnese: sciarpa rossa ripiegata |  |
| 34 | `assets/sprite/oggetto-mantice.png` | 32×32 | 1 (più 1 variante 'a terra' con ombra: file oggetto-<nome>-terra.png) | centro | Mantice del Fabbro: mantice di cuoio |  |
| 35 | `assets/sprite/attivo-forbici.png` | 32×32 | 1 | centro | Forbici di Gaetano: forbici da sarto d'acciaio |  |
| 36 | `assets/sprite/attivo-tamburello.png` | 32×32 | 1 | centro | Tamburello di Piazza Dante con nastri |  |
| 37 | `assets/sprite/attivo-ampolla.png` | 32×32 | 1 | centro | Ampolla di San Gennaro: ampolla di vetro con liquido cremisi |  |
| 38 | `assets/sprite/patto-raggio.png` | 32×32 | 1 | centro | Raggio Cremisi del Velo: occhio rosso in un cerchio di fili |  |
| 39 | `assets/sprite/patto-sacro.png` | 32×32 | 1 | centro | Cuore Sacro di San Leucio: cuore luminoso con corona di spine d'oro |  |
| 40 | `assets/sprite/patto-coltello.png` | 32×32 | 1 | centro | Lama della Burattinaia: coltello nero con manico d'osso |  |
| 41 | `assets/sprite/raccoglibile-cuore-pieno.png` | 24×24 | 1 (moneta: brillio×4) | centro | Cuore raccoglibile: maschera di Pulcinella a goccia, avorio |  |
| 42 | `assets/sprite/raccoglibile-moneta.png` | 24×24 | 1 (moneta: brillio×4) | centro | Moneta di luce d'oro con il giglio borbonico |  |
| 43 | `assets/sprite/raccoglibile-olio-da-fabbro.png` | 24×24 | 1 (moneta: brillio×4) | centro | Boccetta d'olio da fabbro |  |
| 44 | `assets/sprite/raccoglibile-pezzuola-di-lino.png` | 24×24 | 1 (moneta: brillio×4) | centro | Pezzuola di lino piegata |  |
| 45 | `assets/sprite/proiettile-base.png` | 16×16 | volo×2, impatto×3 | centro | Proiettile del giocatore: lacrima d'avorio |  |
| 46 | `assets/sprite/proiettile-fuoco.png` | 16×16 | volo×2, impatto×3 | centro | Proiettile del giocatore: goccia infuocata arancione |  |
| 47 | `assets/sprite/proiettile-elettrico.png` | 16×16 | volo×2, impatto×3 | centro | Proiettile del giocatore: scintilla azzurra |  |
| 48 | `assets/sprite/proiettile-cremisi.png` | 16×16 | volo×2, impatto×3 | centro | Proiettile del giocatore: goccia rosso sangue più grande |  |
| 49 | `assets/sprite/proiettile-piombo.png` | 16×16 | volo×2, impatto×3 | centro | Proiettile del giocatore: sfera di piombo grigia |  |
| 50 | `assets/sprite/proiettile-raggio-cremisi.png` | 16×16 | volo×2, impatto×3 | centro | Proiettile del giocatore: segmento di raggio laser rosso ripetibile (tile 16×16) più testa del raggio |  |
| 51 | `assets/sprite/scena-piedistallo.png` | 64×64 | vedi descrizione | piedi-centro | Piedistallo di pietra della bottega con cono di luce |  |
| 52 | `assets/sprite/scena-altare-patto.png` | 96×96 | vedi descrizione | piedi-centro | Altare del Patto d'Ombra: tavolo di pietra nera con candele spente e fili d'oro, atmosfera cupa |  |
| 53 | `assets/sprite/scena-crepa-dorata.png` | 64×64 | vedi descrizione | piedi-centro | Crepa dorata luminosa sul muro (la stanza segreta): file crepa-dorata-<lato>.png per n/s/e/o |  |
| 54 | `assets/sprite/scena-braciere.png` | 64×64 | vedi descrizione | piedi-centro | Braciere di ferro con brace: fotogrammi riposo×2, acceso×4 |  |
| 55 | `assets/sprite/scena-colonna.png` | 64×96 | vedi descrizione | piedi-centro | Colonna di pietra della piazza |  |
| 56 | `assets/sprite/scena-panca.png` | 96×48 | vedi descrizione | centro | Panca di legno |  |
| 57 | `assets/sprite/scena-banco-tonino.png` | 192×96 | vedi descrizione | centro | Banco del banchetto di Tonino: tenda, lanterna, vassoio di mozzarelle, cartiglio «MOZZARELLE» |  |
| 58 | `assets/sprite/scena-porta-aperta.png` | 96×96 | vedi descrizione | piedi-centro | Porta ad arco aperta con soglia d'oro (file per lato n/s/e/o) |  |
| 59 | `assets/sprite/scena-porta-chiusa.png` | 96×96 | vedi descrizione | piedi-centro | Porta ad arco chiusa, pannello di legno scuro con cornice (file per lato) |  |
| 60 | `assets/sprite/scena-botola-uscita.png` | 96×96 | vedi descrizione | piedi-centro | Botola di legno con anello di ferro: chiusa×1, aperta×1 (l'uscita verso il piano sotto) |  |
| 61 | `assets/sprite/scena-lanterna.png` | 32×64 | vedi descrizione | piedi-centro | Lanterna appesa accesa: fiamma×4 |  |
| 62 | `assets/sprite/scena-pavimento-tile.png` | 64×64 | vedi descrizione | piedi-centro | Tassello di pavimento di basolato caldo, ripetibile senza cuciture; varianti: piazza-dante, segreta, boss, patto |  |
| 63 | `assets/sprite/scena-muro-tile.png` | 64×64 | vedi descrizione | piedi-centro | Tassello di muro: faccia nord con cornicione e varianti laterali, ripetibile |  |
| 64 | `assets/sprite/hub-tonino.png` | 96×96 | fermo×2 salvo indicazione | piedi-centro | Tonino il mozzarellaro: omone d'ombra col grembiule e il vassoio, lanterna accanto |  |
| 65 | `assets/sprite/hub-gaetano-porta.png` | 96×96 | fermo×2 salvo indicazione | piedi-centro | Porta della bottega di Gaetano con insegna del fabbro: chiusa×1, aperta×1 |  |
| 66 | `assets/sprite/hub-mariella-finestra.png` | 96×96 | fermo×2 salvo indicazione | piedi-centro | Finestra accesa di Mariella con una sagoma dentro (mai un personaggio a terra) |  |
| 67 | `assets/sprite/hub-luna.png` | 96×96 | fermo×2 salvo indicazione | piedi-centro | Luna crema con alone, immobile |  |
| 68 | `assets/sprite/hub-agnese-npc.png` | 96×96 | fermo×2 salvo indicazione | piedi-centro | Agnese seduta sotto il portico che tesse (versione NPC, fermo×2) |  |
| 69 | `assets/sprite/hub-taddeo-npc.png` | 96×96 | fermo×2 salvo indicazione | piedi-centro | Taddeo in piedi con la spada di legno (versione NPC, fermo×2) |  |
| 70 | `assets/sprite/hud-cuore-pieno.png` | 24×24 | 1 | centro | Maschera di Pulcinella a goccia piena, avorio |  |
| 71 | `assets/sprite/hud-cuore-mezzo.png` | 24×24 | 1 | centro | Maschera a metà |  |
| 72 | `assets/sprite/hud-cuore-vuoto.png` | 24×24 | 1 | centro | Contorno della maschera, vuoto |  |
| 73 | `assets/sprite/hud-icona-moneta.png` | 20×20 | 1 | centro | Moneta col giglio |  |
| 74 | `assets/sprite/hud-icona-scintilla.png` | 20×20 | 1 | centro | Rombo a quattro punte dorato |  |
| 75 | `assets/sprite/hud-icona-dmg.png` | 20×20 | 1 | centro | Lama |  |
| 76 | `assets/sprite/hud-icona-spd.png` | 20×20 | 1 | centro | Scarpetta con ali |  |
| 77 | `assets/sprite/hud-icona-tears.png` | 20×20 | 1 | centro | Lacrima |  |
| 78 | `assets/sprite/hud-icona-range.png` | 20×20 | 1 | centro | Freccia lunga |  |
| 79 | `assets/sprite/hud-slot-vuoto.png` | 40×40 | 1 | centro | Cornice di slot vuoto, legno scuro con bordo oro |  |
| 80 | `assets/sprite/hud-slot-attivo.png` | 48×48 | 1 | centro | Cornice dello slot dell'attivo con 4 tacche di carica |  |
| 81 | `assets/sprite/hud-cornice-cartiglio.png` | 96×48 | 1 | centro | Cornice 9-slice dei pannelli: legno scuro, bordo oro, rombi agli angoli |  |
| 82 | `assets/sprite/hud-barra-boss.png` | 256×24 | 1 | centro | Barra della vita del boss: cornice d'oro, riempimento rosso→oro |  |
| 83 | `assets/sprite/ritratto-ferruccio.png` | 240×360 | 1 | centro | Ritratto di Ferruccio per la carta del menu | [dipinto](https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/ferruccio.jpg) |
| 84 | `assets/sprite/ritratto-agnese.png` | 240×360 | 1 | centro | Ritratto di Agnese | [dipinto](https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/agnese.jpg) |
| 85 | `assets/sprite/ritratto-taddeo.png` | 240×360 | 1 | centro | Ritratto di Taddeo | [dipinto](https://raw.githubusercontent.com/SalvatoreDeRosa98/Gioco/claude/brave-cannon-ed3d3d/assets/taddeo.jpg) |
| 86 | `assets/sprite/ritratto-ombra.png` | 240×360 | 1 | centro | Ritratto di Pulcinella d'Ombra |  |
| 87 | `assets/sprite/sipario-menu.png` | 1280×720 | 1 | angolo | Fondale del menu: sipario rosso di velluto con cornice d'oro e le Grandi Mani di legno in alto; teatro dei burattini, atmosfera dark-fairytale |  |
| 88 | `assets/sprite/sipario-piazza-dante.png` | 1280×720 | 1 | angolo | Illustrazione per il sipario narrativo tra i piani: Piazza Dante di notte, portici, statua di Dante, lampioni, fili d'oro verso la Reggia |  |
| 89 | `assets/sprite/sipario-corso-trieste.png` | 1280×720 | 1 | angolo | Illustrazione per il sipario narrativo tra i piani: Corso Trieste sotto la pioggia, vetrine accese |  |
| 90 | `assets/sprite/sipario-villa-comunale.png` | 1280×720 | 1 | angolo | Illustrazione per il sipario narrativo tra i piani: Villa Comunale con luna verde e lucciole |  |
| 91 | `assets/sprite/sipario-reggia.png` | 1280×720 | 1 | angolo | Illustrazione per il sipario narrativo tra i piani: Cortile d'Onore della Reggia di Caserta, torce dorate |  |

## Ordine consigliato

1. Personaggi (4) e teste di mira. 2. Nemici (10). 3. HUD (13). 4. Oggetti, attivi, patto, raccoglibili. 5. Proiettili. 6. Scena e hub. 7. Boss. 8. Ritratti e sipari.

## Come consegnare

Salva i PNG in `gioco/assets/sprite/` con il nome esatto della colonna File, fai commit e push sul branch: il gioco li usa al prossimo caricamento. In `gioco/contenuti/sprite.json` ogni voce ha `stato: provvisorio`: quando un file arriva, chi fa il commit può segnarlo `definitivo` (non è obbligatorio: il renderer controlla l'esistenza del file).
