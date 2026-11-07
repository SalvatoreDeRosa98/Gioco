# Game Concept: Ferruccio — La Notte Immobile

*Creato: 2026-11-07*
*Stato: Approvato dall'autore nella direzione («vorrei farlo come Isaac»); dettagli in bozza*
*Fonte narrativa: `trama/ferruccio-bibbia.md`, `trama/inizio-memoria-e-doni.md`, `trama/storia.json`*

---

## Elevator Pitch

> È un roguelike d'azione a stanze, alla *The Binding of Isaac*, in cui Ferruccio, fabbro muto
> imprigionato in un costume da Pulcinella, attraversa i quartieri di una Caserta del 1845 addormentata
> da un incantesimo per arrivare alla Reggia e decidere se spezzare il Velo. Ogni morte lo riporta al
> risveglio in Piazza Dante: la luna è immobile, la notte ricomincia, ma lui ricorda.

---

## Core Identity

| Aspetto | Dettaglio |
| ---- | ---- |
| **Genere** | Roguelike d'azione a stanze (top-down 3/4), con storia a scelte che avanza tra una notte e l'altra |
| **Piattaforma** | Browser (PC) come piattaforma di sviluppo e di gioco; eseguibile Windows impacchettando la stessa pagina |
| **Pubblico** | Vedi Profilo del giocatore |
| **Giocatori** | Singolo |
| **Durata sessione** | Una notte (run) 20-40 minuti; sessione tipica 1-2 notti |
| **Monetizzazione** | Nessuna decisa (premium se mai pubblicato) |
| **Scala stimata** | Media (7-9 mesi, un autore + agenti) |
| **Titoli comparabili** | The Binding of Isaac (struttura), Hades (storia tra le run), Don't Starve (sagome di carta in 3/4) |

---

## Core Fantasy

Essere l'unico sveglio in una città che sorride. Ferruccio non parla: colpisce, para, scatta, e raccoglie
quello che il Velo ha rubato agli altri. Ogni notte la sua spada, forgiata con gli strumenti del padre,
diventa qualcosa di diverso secondo i ricordi e i doni che trova. E ogni notte capisce un pezzo in più
di chi ha ucciso suo padre, finché non deve decidere se il dolore degli altri vale la loro libertà.

---

## Unique Hook

È come *Isaac*, **e inoltre** una parte degli oggetti sono ricordi rubati agli abitanti: ti rendono più
forte finché li tieni, e la storia ti chiede se restituirli. Le sei scelte della bibbia (il ricordo di
Rosa, Taddeo, il registro, Agnese, Gregorio, Violante) non sono finestre di dialogo appiccicate: emergono
dal bottino, dai boss e dagli incontri nelle stanze, e restano decise per tutte le notti successive.
Il mondo dopo il finale cambia davvero (bibbia §XVII) e si continua a giocare dentro quella Caserta.

---

## Player Experience Analysis (MDA)

### Estetiche obiettivo

| Estetica | Priorità | Come la consegniamo |
| ---- | ---- | ---- |
| **Challenge** | 1 | Combattimento corpo a corpo con parata e scatto; stanze che si imparano; boss telegrafati |
| **Narrative** | 2 | Nove archi della bibbia distribuiti su più notti; scelte persistenti; due finali e un dopo |
| **Discovery** | 3 | Sinergie tra doni; stanze segrete dietro le finestre accese; indizi su Gaetano e Bianca |
| **Fantasy** | 4 | Pulcinella con la spada in una Caserta reale; il Velo come fili d'oro visibili |
| **Sensation** | 5 | Teatro delle ombre: carta retroilluminata, lanterne, una sola nota di rosso |
| **Expression** | 6 | Costruire la propria spada notte dopo notte scegliendo quali doni tenere |
| **Submission** | N/A | — |
| **Fellowship** | N/A | — |

### Dinamiche attese
- Il giocatore impara le stanze e i pattern dei nemici e torna "ancora una notte" per arrivare un piano più in là.
- Prova combinazioni di doni per scoprire sinergie (catena + scintille, sciarpa + parata).
- Esita davanti alle scelte perché ha capito cosa sacrifica (principio 2 della bibbia), e rigioca per vedere l'altro ramo.
- Parla con Tonino, Taddeo, Agnese a ogni notte perché le battute cambiano con i flag e con i progressi.

### Meccaniche di base
1. **Combattimento in tempo reale top-down**: fendente, affondo caricato, parata a tempo, scatto con la sciarpa, invulnerabilità breve dopo il colpo.
2. **Piani procedurali da stanze fatte a mano**: 5 piani (un quartiere ciascuno) di 8-14 stanze su griglia, con stanza del tesoro (bottega), banchetto di Tonino, stanza del boss, stanze segrete.
3. **Doni e ricordi**: oggetti passivi che modificano la spada e il corpo, si sommano e fanno sinergia; i ricordi sono doni con una scelta morale legata.
4. **Storia tra le notti**: hub in Piazza Dante e Fucina del Ricordo; flag della bibbia; incontri condizionati; finale e mondo dopo.
5. **Progressione permanente alla Fucina**: scintille raccolte sbloccano doni nel pool e migliorie di Gaetano (nome e volto, incudini, sciarpa).

---

## Profilo di motivazione

| Bisogno | Come lo soddisfa | Forza |
| ---- | ---- | ---- |
| **Autonomia** | Quali doni tenere, quali ricordi restituire, quale ramo narrativo aprire | Core |
| **Competenza** | Parata e scatto da padroneggiare; un piano in più per notte | Core |
| **Relazione** | Tonino, Agnese, Taddeo che ricordano cosa hai fatto | Supporting |

### Tipi di giocatore (Bartle)
- [x] **Achievers**: sbloccare tutti i doni, finire con ogni percorso, le 64 combinazioni.
- [x] **Explorers**: sinergie, stanze segrete, i quattro indizi di Bianca, la verità su Gaetano.
- [ ] **Socializers**: no (singolo).
- [ ] **Killers**: no.

### Flow
- **Prime dieci minuti**: Piazza Dante a corridoi, un gatto d'ombra alla volta, Tonino che spiega poco; la parata si insegna con un nemico che telegrafa a lungo.
- **Scalata**: piani più fitti, nemici che combinano pattern, boss con due fasi; i doni crescono il potere ma le stanze crescono più in fretta.
- **Chiarezza del feedback**: hit-stop, scossa, anime che salgono; contatore di stanze e di piani; battute nuove nell'hub.
- **Ripresa dal fallimento**: la morte è il risveglio; 5 secondi e si è di nuovo in piazza; si tengono scintille, flag e sblocchi.

---

## Core Loop

### 30 secondi
Entri in una stanza, le porte si chiudono. Leggi le sagome: un gatto che si accuccia prima del balzo, una vespa che vibra prima della picchiata, una statua che trema prima del colpo. Colpisci, pari sul lampo rosso, scatti con la sciarpa, raccogli monete di luce. Le porte si riaprono.

### 5-15 minuti
Un piano: scegli un percorso sulla mappa del quartiere, trovi la bottega (un dono), passi dal banchetto di Tonino (compri o parli), apri una finestra segreta, affronti il boss. Il boss si dissolve in un'anima: a volte contiene un ricordo e una scelta.

### Sessione (30-120 minuti)
Una o due notti. Una notte buona arriva al terzo o quarto piano; una notte che finisce alla Reggia è l'evento. Tra una notte e l'altra: Fucina, Gaetano, Tonino, battute nuove.

### Lungo periodo
Sbloccare il pool di doni, ricostruire la verità su Gaetano, decidere su Taddeo e Agnese, arrivare a Gregorio con o senza prove, scegliere su Violante, poi giocare nel mondo dopo (azzurro e ostile, o grigio e sorridente) e vedere le altre combinazioni.

### Ganci di ritorno
- **Curiosità**: la prossima battuta di Agnese, il quartiere mai raggiunto, cosa c'è nella scatola musicale.
- **Investimento**: scintille e sblocchi; i flag presi.
- **Padronanza**: il Custode con due fasi; una notte senza perdere maschere.

---

## Pilastri

### Pilastro 1: Leggibile al buio
Ogni cosa pericolosa si legge in sagoma prima di colpire. *Test*: tra un nemico bello e uno il cui telegrafo si vede in nero puro, si sceglie il secondo.

### Pilastro 2: La notte ricomincia, la storia no
La morte azzera la run, mai le decisioni e mai i rapporti. *Test*: tra una meccanica che richiede di rigiocare una scena già scelta e una che la ricorda, si sceglie la seconda.

### Pilastro 3: Il bottino ha un volto
I ricordi sono persone. *Test*: tra un oggetto "+20% danno" e un oggetto "il medaglione di Rosa: +danno finché non lo restituisci a Tonino", si sceglie il secondo.

### Pilastro 4: Fatto di ombra e luce
Niente che richieda un disegnatore: sagome, luce, carta, tipografia. *Test*: tra un nemico che ha bisogno di dieci fotogrammi e uno fatto di tre pezzi snodati, si sceglie il secondo.

### Anti-pilastri
- **NON un platform**: la v1 è morta lì. Niente salti di precisione, niente mensole.
- **NON un sistema di moralità**: nessun punteggio buono/cattivo (bibbia §XIV).
- **NON un gioco di dialoghi lunghi**: battute brevi, da una a tre per incontro, il resto si mostra.
- **NON cooperativa online**: citata nella bibbia, fuori da ogni scala di questa versione.

---

## Ispirazioni

| Riferimento | Cosa prendiamo | Cosa facciamo di diverso | Perché conta |
| ---- | ---- | ---- | ---- |
| The Binding of Isaac | Griglia di stanze, porte che si chiudono, tesoro/negozio/boss, oggetti passivi che si sommano | Corpo a corpo con parata invece di lacrime; i ricordi hanno una scelta | Dimostra che stanze semplici + oggetti profondi reggono centinaia di ore |
| Hades | Storia che avanza tra le run, NPC che ricordano | Scelte binarie persistenti invece di favori; mondo che cambia dopo il finale | Dimostra che un roguelike regge una trama a archi |
| Don't Starve | Sagome di carta in piedi in un mondo 3/4, inchiostro | Nero su carta retroilluminata, luce colorata solo dalle lanterne | Dimostra la leggibilità del cutout in vista dall'alto senza animazione a fotogrammi |

**Fuori dai giochi**: le guarattelle napoletane e il teatro d'ombre; il presepe (figure piatte in un diorama visto dall'alto); la Reggia di Caserta e San Leucio reali; il 1845 borbonico.

---

## Profilo del giocatore

| Attributo | Dettaglio |
| ---- | ---- |
| **Età** | 18-40 |
| **Esperienza** | Mid-core |
| **Tempo** | 30-60 minuti la sera |
| **Piattaforma** | PC, nel browser o con un eseguibile |
| **Gioca a** | Isaac, Hades, Dead Cells |
| **Cerca** | Un roguelike con una storia che pesa e un'identità visiva che non ha mai visto |
| **Lo allontana** | Feel del combattimento molle; stanze illeggibili; dialoghi che bloccano la run |

---

## Considerazioni tecniche

| Voce | Valutazione |
| ---- | ---- |
| **Motore** | Web (Canvas 2D + JavaScript a moduli, senza build). Decisione registrata: nessun disegnatore, verifica continua con Playwright nella sessione di sviluppo, gioco da link; Godot v1 abbandonato. Fuori dal set Godot/Unity/Unreal del framework: le skill con passi specifici di motore li dichiarano saltati. |
| **Sfide** | Feel del corpo a corpo top-down; qualità delle stanze generate; leggibilità top-down delle sagome; pool di oggetti con sinergie senza bug; prestazioni Canvas con molti nemici e luci |
| **Stile** | 2D, cutout in 3/4, teatro delle ombre |
| **Pipeline artistica** | Bassa: forme vettoriali e luci procedurali, nessuna immagine disegnata |
| **Audio** | Moderato: sintesi WebAudio (già fatta in v1), poi eventuale musica originale |
| **Rete** | Nessuna |
| **Contenuti** | 5 piani, ~60 modelli di stanza, ~15 nemici, 5 boss, ~60 doni, 9 archi, 2 finali |
| **Procedurale** | Griglia del piano e scelta delle stanze da modelli fatti a mano; posizionamento nemici con seme |

---

## Rischi e domande aperte

### Design
- Il corpo a corpo top-down con parata può essere meno leggibile dello sparo a distanza di Isaac: da provare per primo.
- Troppa storia tra le notti rallenta il ritmo roguelike: una battuta per NPC per notte, mai di più.
- Le scelte della bibbia sono sei e irripetibili: le notti dopo l'ultima scelta devono restare interessanti (mondo dopo, sfide).

### Tecnici
- Generazione delle stanze senza "stanze morte"; sagome che si sovrappongono e diventano illeggibili.
- Sinergie tra doni: serve un modello dati a modificatori composabili, non casi speciali.

### Mercato
- Genere affollato; l'identità (Caserta 1845, teatro delle ombre, Pulcinella) è l'unica differenza visibile.

### Scala
- 60 doni e 15 nemici sono molto per un autore solo: il pool parte da 20 e 6.

### Domande aperte (e come rispondere)
- Il fendente + parata è divertente da solo? → prototipo di una stanza con tre gatti.
- Quanto deve pesare un ricordo per rendere dolorosa la restituzione? → prova con il medaglione di Rosa nel prototipo.
- Violante va chiamata Violante o Donna Luciana (v1)? → decide l'autore.

---

## MVP

**Ipotesi**: «Il combattimento di una stanza (fendente, parata sul lampo rosso, scatto) contro i gatti d'ombra è abbastanza divertente da volere un'altra stanza, e la scelta sul ricordo di Rosa dopo il Gatto dei Quattro Canti lascia il segno».

**Richiesto**:
1. Un piano (Piazza Dante) di 8 stanze generate da modelli, con tesoro, banchetto e boss.
2. Ferruccio: movimento, fendente, parata, scatto, 5 maschere di vita.
3. Quattro nemici: gatto d'ombra, vespa dorata, statua animata, guardia.
4. Dodici doni con modificatori composabili, di cui uno è un ricordo con scelta (medaglione di Rosa).
5. Boss: Gatto dei Quattro Canti, due fasi, dissoluzione in anima.
6. Morte → risveglio in Piazza Dante hub, Tonino con battute per flag, salvataggio dei flag e delle scintille.

**Non nell'MVP**: piani 2-5, Fucina del Ricordo, mappa del piano, audio, altri boss, finali.

### Scale

| Tier | Contenuto | Funzioni | Tempo |
| ---- | ---- | ---- | ---- |
| **MVP** | Piano 1, 8 stanze, 4 nemici, 12 doni, 1 boss | Combattimento, generazione, doni, hub minimo | 3-4 settimane |
| **Vertical Slice** | Piano 1 completo + Fucina + hub con Gaetano | + progressione permanente, mappa, audio base | 7-8 settimane |
| **Alpha** | 5 piani, 5 boss, 6 scelte, 2 finali in grezzo | Tutto, non bilanciato | 4-5 mesi |
| **Full Vision** | Tutto + mondo dopo, 60 doni, 15 nemici, musica | Rifinito | 7-9 mesi |

---

## Prossimi passi

- [x] Direzione approvata dall'autore (Isaac)
- [x] `/art-bible` — sezioni 1-4 (`design/art/art-bible.md`)
- [x] `/map-systems` — `design/gdd/systems-index.md`
- [x] `/design-system` — 11 GDD in `design/gdd/`
- [x] `/create-architecture` — `docs/architecture/architecture.md` + ADR
- [x] `/prototype` — `prototypes/stanza-gatti-concept/` (da giocare)
- [ ] `/create-epics`, `/create-stories`, `/dev-story` — il codice del piano 1
