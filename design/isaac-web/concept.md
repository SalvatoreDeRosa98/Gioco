# Ferruccio: Una Notte a Caserta — Concept definitivo

Roguelike a stanze, vista dall'alto, nel browser. Dalla stessa Caserta del 1845 di "La Menzogna dei Borbone".

| | |
|---|---|
| Versione | 1.0 — 31 ottobre 2026 |
| Versione 1.1 | 1 novembre 2026 — **tiro di base** (Ferruccio spara una scintilla alla volta, direzione separata dal movimento; l'affondo è il colpo forte a contatto), **bibbia degli oggetti in `oggetti.md`** (statistiche, motore del colpo, catalogo da 154 voci, sinergie, regole delle pool): dove questo documento e `oggetti.md` differiscono sui numeri, vale `oggetti.md` |
| Stato | Documento di riferimento per la PARTE 1 (gioco) e abbozzo della PARTE 2 (hub di servizio) |
| Committente | Salvatore (sviluppatore solo + Claude Code; nessun artista, nessun budget; Gemini/Grok per i dipinti) |
| Repo | `E:/gioco/github-base-qa` (Godot 4.6, GL Compatibility, 1280x720 `canvas_items`) |
| Fonti | `design/isaac-web/oggetti.md` (bibbia degli oggetti), `design/narrative/ferruccio-bibbia.md`, `design/art-bible.md`, `design/art-prompts.md`, `design/model-sheet-prompts.md`, `src/data/tuning.json`, `src/data/expansion.json`, `src/data/audio.json`, `src/game/*.gd` |
| Come è nato | Tre concept in gara, due giudici indipendenti. Vincitore: **"Una Notte a Caserta" (NOTTE)**, 38/50 da entrambi i giudici, contro "Sotto il Velo" (32 e 31/50, Isaac-like completo da 212 collezionabili, bocciato sulla fattibilità a peso doppio). Il terzo concept non è arrivato ai giudici. Questo documento è NOTTE **più i quattro innesti** che entrambi i giudici hanno chiesto di prendere da "Sotto il Velo": (1) il contratto dei dati per la Parte 2 dal giorno 1, (2) il Banco dei Pegni / l'Edicola votiva e i 4 champion, (3) Ratking come boss alternativo dietro il tombino segreto, (4) l'architettura degli oggetti (schema `items.json`, tabella di priorità, 2 sostituti d'arma) senza la loro quantità. |

---

## 0. In una pagina

- **Cosa**: una run di **3 piani in 10-14 minuti** (Piazza Dante → Villa Comunale → Cortile d'Onore della Reggia), stanze rettangolari 13x7 caselle con porte sui 4 lati, 1 boss per piano (Gatto dei Quattro Canti, Madre di Marmo, il Custode) più **Ratking** dietro un tombino segreto. Si ricomincia da capo a ogni morte, in 2 secondi.
- **Come si gioca**: **Ferruccio spara una scintilla alla volta**, come le lacrime di Isaac: direzione separata dal movimento (frecce / levetta destra / mouse / seconda levetta touch), auto-fuoco a 2,73 colpi/s di base (cap 5/s). L'**affondo dello stocco** (portata 65-110 px, 3× il Danno, ogni 0,56 s) è il colpo forte a contatto, secondario e mai sostituito; scatto (640 px/s per 0,16 s) e parata (finestra 0,18 s) che rimanda indietro i proiettili restano. Ogni nemico telegrafa l'attacco e poi resta scoperto: la scuola del platform attuale, portata dall'alto.
- **Cosa cambia a ogni run**: 80 collezionabili all'MVP (154 nella Parte 1; catalogo, pool e sinergie in `oggetti.md` §3-5), 14 flag componibili sul colpo, 3 sostituti d'arma + affondo su 5 forme che rispondono tutte alle stesse flag, 4 multi-colpo, 2 trasformazioni del profilo (Palla di cannone, Otre bucato), 10 casi speciali, Banco dei Pegni dopo il boss, 4 colori di champion, 3 personaggi, 4 Stanze del Bivio narrative con 8 ricompense.
- **Numeri**: Danno decimale con la radice di Isaac (base 3,50; formule in `oggetti.md` §2), 5 maschere di vita, 15 tipi di nemico (9 già codificati; HP riscalati ×3,5), 4 boss (2 già codificati; 400 / 550 / 600 / 750 HP), 36 layout di stanza a mano (144 con i flip), seme a 8 caratteri, 16 sblocchi.
- **Dove**: browser desktop e telefono in orizzontale, **pck sotto i 60 MiB** (oggi 231), motore 40 MiB, nessun thread (preset `web_dlink_nothreads_release`, già funzionante).
- **Quanto**: MVP pubblico alla **settimana 14** (~380 h a 27 h/settimana), alpha privata a 2 piani alla settimana 8, Parte 1 completa (3 capitoli, 6 personaggi, 100 collezionabili, Violante) alla settimana 26.
- **Poi**: hub stile pokeisaac.com (account Supabase, salvataggi cloud, classifiche sul seme giornaliero, missioni, collezione, gacha solo con valuta guadagnata, clan, coop). Il gioco scrive **dal giorno 1** i due file che l'hub leggerà: `runs_log.jsonl` e `meta.json`.

---

## 1. Visione

### 1.1 Pitch

Caserta, una notte del 1845. Ferruccio, fabbro prigioniero di un costume da Pulcinella, attraversa la città addormentata sotto il Velo d'oro dei Borbone: una piazza, un giardino, un cortile reale, una stanza alla volta. Ogni stanza è un duello di lettura: il gatto si accuccia prima di balzare, la statua traccia la linea di mira, la guardia grida "STOCCATA". Chi legge, schiva di lato, spara girandogli attorno e punisce con lo stocco nella pausa; chi non legge, perde una maschera. Dodici minuti dopo, Ferruccio è morto o ha guardato il Custode negli occhi; in entrambi i casi la notte ricomincia, con un seme nuovo, oggetti nuovi e una mano diversa.

È The Binding of Isaac giocato da uno schermidore, dipinto a mano invece che in pixel art, lungo un quarto, dentro una fiaba notturna italiana che nessun altro ha.

### 1.2 Pilastri

1. **Leggi, schiva, punisci.** Nessun attacco senza preavviso (posa + suono + cartellino + luccichio, poi pausa punibile: `enemy.gd`, `elite.gd`). Si spara a distanza con la scintilla, direzione separata dal movimento, mentre si gira attorno al nemico; nella pausa si entra e si punisce con l'affondo (3× il Danno). La distanza è la base, il contatto è il premio.
2. **Una notte in 12 minuti.** 3 piani, 24-30 stanze, 3 boss. Si finisce in pausa pranzo e si ricomincia in 2 s. Leggibile su uno schermo da 6 pollici.
3. **Ogni oggetto cambia la mano.** Non solo numeri: 14 flag che cambiano la forma del colpo (inseguitrice, perforante, spettrale, rimbalzante, divisoria, fili, velenosa, brace, spaventa, esplosiva, orbitante, crescente, a bruciapelo, scudo), 3 armi sostitutive, 4 multi-colpo e 2 trasformazioni del profilo, tutte sulla stessa tabella (`oggetti.md` §2).
4. **Caserta dipinta, mai geometrica.** Art bible intatta: silhouette, luce calda / ombra fredda, Ferruccio sempre il punto più chiaro, griglia invisibile.
5. **Dati che vivranno online.** Id stabili, seme riproducibile, log di ogni run: la Parte 2 legge due file e non tocca il gioco.

### 1.3 Perché nel browser

- **Zero attrito**: un link, nessun download, nessun account per la Parte 1. È il canale di pokeisaac.com e dei roguelike leggeri che circolano su Discord e Reddit.
- **La pipeline esiste già**: l'export web del progetto funziona (`web_dlink_nothreads_release`, 18 s). Il problema è solo il peso (277 MiB), che è un lavoro di importazione, non di motore.
- **Il telefono è gratis**: lo stesso export gira su Chrome Android e Safari iOS in orizzontale; i controlli touch si aggiungono nella settimana 13.
- **È il prerequisito della Parte 2**: hub, account e classifiche hanno senso solo se il gioco è già dove sta il browser.

### 1.4 Differenza da The Binding of Isaac

| | Isaac | Una Notte a Caserta |
|---|---|---|
| Verbo base | lacrime a distanza nelle 4 direzioni | scintilla a distanza con mira separata (8 direzioni da tastiera, 360° con levetta e mouse) + affondo forte a contatto (3×) + scatto + parata che riflette |
| Durata run | 35-45 min, 8-12 piani | 10-14 min, 3 piani |
| Danno | decimale con formula sqrt | la stessa formula sqrt, base 3,50, delta degli oggetti ×1,5 e HP dei nemici riscalati (`oggetti.md` §2.2) |
| Patto col diavolo | stanza del diavolo | Banco dei Pegni della Regina dei Debiti (stessa regola di comparsa) |
| Pillole / carte | sì | Boccetta dello speziale e 12 numeri della Smorfia nella Parte 1 (`oggetti.md` §3.L); no all'MVP |
| Narrazione | ambientale | Stanze del Bivio: scelte binarie della bibbia che danno un oggetto diverso per ramo (4 Bivi, 8 ricompense, `oggetti.md` §5.3) e cambiano il finale |
| Arte | pixel/vettoriale | pupazzi dipinti a pezzi, fondali dipinti |

### 1.5 Differenza da PokeIsaac

PokeIsaac è JS puro su canvas, pixel art, IP Pokémon (non monetizzabile, esposto a un takedown), gacha dal primo giorno, "Capitolo 1, piano 1/3". Una Notte a Caserta prende da PokeIsaac la **struttura a capitoli di 3 piani**, la run breve, il modello gratis + Ko-fi e l'hub di servizio come Parte 2; se ne distingue per IP originale, Godot (pad, export desktop e mobile nativi in futuro), combattimento corpo a corpo, arte dipinta e un gioco che è completo **prima** del gacha.

### 1.6 Vantaggio dell'IP originale

- Nessun rischio legale: si può vendere (Steam, itch, store mobile) o tenere gratis; marchio registrabile.
- Una bibbia di 19 sezioni, 23 NPC dipinti, 5 boss dipinti, 10 musiche, 8 ambienti: il "costume" del roguelike è già cucito. Maschere al posto dei cuori, sigilli dei quartieri al posto delle chiavi, martellate al posto delle bombe, braci come carica dell'oggetto attivo, Anime colorate dei boss come valuta della Parte 2.
- Il metroidvania resta nel repo: stessi asset, stessi autoload, stessa storia. Niente fork.

---

## 2. Il gioco — PARTE 1

### 2.1 Controlli e statistiche

**Controlli** (tastiera / pad / touch; `input_remap.gd` esistente per il remap):

| Azione | Tastiera | Pad | Touch (orizzontale) | Note |
|---|---|---|---|---|
| Movimento 8 direzioni | WASD | levetta sinistra | levetta virtuale a sinistra | 270 px/s di base |
| **Mira e fuoco (scintilla)** | frecce | levetta destra | seconda levetta virtuale a destra | 8 direzioni da tastiera, 360° con levetta e mouse (verso il cursore); auto-fuoco finché si tiene la direzione: primo colpo immediato, poi 1/Fiato (2,73/s di base) |
| Affondo (colpo forte a contatto) | J / clic sinistro | X / RT | pulsante grande a destra | 3× il Danno; nella direzione della mira se attiva, altrimenti nella direzione di marcia |
| Scatto | Spazio / Shift | A / LT | pulsante | 640 px/s x 0,16 s, ricarica 0,55 s, invulnerabile durante |
| Parata | K / clic destro | LB | pulsante | finestra 0,18 s, ricarica 0,6 s, 0,3 s di invulnerabilità al successo |
| Oggetto attivo | E | Y | pulsante | costa braci |
| Martellata | Q | RB | pulsante | piazza una martellata (bomba) ai piedi |
| Consumabile in tasca | R | D-pad giù | tocco sull'icona | |
| Mappa intera | Tab | Back | tocco sulla minimappa | |
| Pausa | Esc | Start | | mostra seme, statistiche, opzioni |

**Statistiche** (decimali, con le formule di Isaac; pannello sempre visibile a sinistra, HUD galleggiante senza riquadri come nell'art bible §7). **I valori definitivi, i clamp, le formule e gli oggetti che li muovono sono in `oggetti.md` §2.1-2.3**; qui il riassunto:

| Stat | Ferruccio base | Intervallo | Da dove viene |
|---|---|---|---|
| Maschere | 5 (10 mezze: la maschera incrinata è la mezza) | 1-12 (rosse + cera + carbone) | `tuning.player.max_hp` |
| Danno | 3,50 | `3,5·k·√(1,2U+1)` + flat, poi moltiplicatori; tetto pratico ≈ 13 | nuovo, decimale (`oggetti.md` §2.2) |
| Fiato (cadenza della scintilla) | 2,73 colpi/s (tear delay 10) | 1,06-5,0/s, poi solo moltiplicatori; cap per arma 15/s, totale 20/s | nuovo (`oggetti.md` §2.3) |
| Misura (gittata della scintilla) | 6,5 caselle = 416 px | 2-13 caselle | nuovo |
| Slancio (velocità della scintilla) | 1,0 = 480 px/s | 0,6-2,0 | nuovo |
| Passo (velocità) | 1,0 = 270 px/s | 0,6-1,6 | `speed` |
| Sorte | 0 | da −3; clamp 0-5 per i drop (+3% per punto da "nulla" a "maschera") | nuovo |
| Tempo dell'affondo | 0,56 s (0,06 startup + 0,26 colpo + 0,24 pausa); danno 3× | fino a 0,33 s | `attack_time`, `attack_cooldown`, `attack_startup` |
| Portata affondo | 65-110 px (arco visibile con le 6 scie di `fx/affondo/`) | +45% max | `player.gd` |
| Scatto | 640 px/s, 0,16 s, ricarica 0,55 s | ricarica min 0,25 s; fino a 2 cariche | `dash_*` |
| Parata (innata solo in Ferruccio) | finestra 0,18 s, ricarica 0,6 s, riflesso a danno x2 verso chi ha sparato | finestra max 0,30 s, riflesso x3; gli altri la ottengono con la Fibbia della guardia o la flag `scudo` | `parry_*`, `parry_success_iframes` |
| Invulnerabilità dopo il colpo | 1,3 s | fissa (1,0 s se il log mostra più di 10 colpi subiti per run) | `hurt_iframes` |
| Braci | 0, max 12 | +2 per stanza liberata, +4 per boss e Caserma, 0 per nemico; pickup Favilla +3 | `ember_max` |
| Martellate | 1 | 0-9 | nuovo |
| Centesimi / Sigilli | 0 / 0 | 0-99 / 0-9 | `tuning.enemies.*.coins`, `DISTRICT_SEALS` |

**Geometria**: casella 64 px (i blockout di `design/levels/ZONA-2.md` usano già 64 px). Stanza giocabile 13x7 = 832x448 px; con la fascia del muro e le porte 15x9 = 960x576 px; finestra 1280x720 con HUD ai lati, su telefono la stanza riempie 960x540 e l'HUD si sovrappone agli angoli.

### 2.2 La run

**Loop di 20 secondi (una stanza)**: entri, le porte si chiudono (`cancello_chiuso.png`), 3-6 nemici. Leggi il telegrafo, spari mentre giri attorno, schivi di lato o pari, affondi nella pausa. Ultimo nemico: porte aperte, 78% di probabilità di un drop, braci +2, minimappa aggiornata. Scegli una porta.

**Loop di 4 minuti (un piano)**: 8-10 stanze. Trovi la Stanza del Ricordo (1 oggetto su un piedistallo), la Fucina di Gaetano (1 oggetto a 15 centesimi, 2 pickup), piazzi una martellata sul muro incrinato e trovi la segreta. Il boss è nel vicolo cieco più lontano: 45-90 secondi. Dopo il boss, se sul piano non hai perso maschere, quasi certamente compare la porta del Banco dei Pegni (o dell'Edicola). Scendi dal tombino.

**Loop di 12 minuti (una run)**: 3 piani, 3 boss, 8-10 oggetti presi, 1 Stanza del Bivio, forse il tombino segreto verso Ratking. Schermata di fine run: seme, personaggio, oggetti, danno inflitto e subito, tempo, Anime guadagnate, sblocchi ottenuti. "Ricomincia" in 2 s con lo stesso personaggio.

**Loop di 10 run (2-3 ore)**: Gaetano e Agnese sbloccati, 8-10 oggetti nuovi nei pool, tombino delle Cisterne trovato, 3 bivi visti con rami diversi, prime 2 skin di sciarpa. Chi conosce Isaac esaurisce i 3 piani in 10-15 run: è il momento in cui arriva il Capitolo 2 (§2.3) e, nella Parte 2, il seme giornaliero e le classifiche.

Numeri della durata: 17 stanze di combattimento x 22 s ≈ 6 min, 3 boss x 70 s ≈ 3,5 min, spostamenti/bottega/bivio ≈ 2 min → **11-12 min**; 14 min con la deviazione delle Cisterne.

### 2.3 Piani casertani e boss

**Capitolo 1 "La Notte" (MVP)** — tre piani, tre boss, un boss segreto. Palette da `themes.gd`, musiche e ambienti da `audio.json`, strati dipinti da `areas.json`.

| Piano | Luogo | Atmosfera | Stanze | Nemici (HP al piano) | Boss | Audio pronto |
|---|---|---|---|---|---|---|
| 1/3 | **Piazza Dante** (`areas/piazza/`) | notte serena, luna, lampioni `#ffc878` su pietra blu `#535a70` | 8 + segreta | gatto 3, vespa 2, sonnambulo 3, pipistrello 1; guardia 6 dalla 4ª stanza | **Gatto dei Quattro Canti** 24 HP | `piazza.ogg`, ambienti `notte`, `citta` |
| 2/3 | **Villa Comunale** (`areas/giardino/`) | lucciole, luce lunare verde `#d8f2a0`, aiuole e statue | 9 + segreta + tombino | statua 7, cavaliere 11, lanterniere 6, spettro 6, mascherone 9, topaia 7 + ratti 1 | **Madre di Marmo** 30 HP | `giardino.ogg`, `boss_cavaliere.ogg` |
| 2-bis | **Cisterne Sepolte** (tileset `slice/tufo_tiles.png`, dipinto `espansione/cisterne*.png`) | acqua e tufo, buio | 3-4 stanze | ratti, topaie, spettri, mascheroni d'acqua | **Ratking** 32 HP (al posto della Madre; premio: Rampino nel pool) | `cisterne_sepolte.ogg`, `boss_ratking.ogg`, `acqua_cisterne` |
| 3/3 | **Cortile d'Onore** (`areas/oro/`) | torce `#ffac4a`, raggi dall'alto, braci | 10 + segreta | guardia 8, duellante 10, cavaliere 12, gatto 5, vespa 4; mini-boss Capitano Ruggiero 14 | **Il Custode** 36 HP → (se sbloccato) scelta su Violante | `oro.ogg`, `boss_cavaliere.ogg`, `torce` |

Il tombino per le Cisterne sta in una stanza normale della Villa (pavimento incrinato, 2 martellate per aprirlo, visibile solo da vicino finché non lo si è trovato una volta: dopo è segnato sulla minimappa). Chi scende salta la Madre e affronta Ratking, già codificato in `ratking.gd` con 2 fasi: è il boss più pronto del repo e il bivio di percorso della run.

Scalatura: gli HP di questa tabella sono in unità "Danno 1" del concept 1.0. Con la scintilla di base (Danno 3,50) valgono **×3,5** per i comuni (gatto 10, guardia 20; +3,5 HP al piano 2, +7 al piano 3) e i boss diventano **400 / 550 / 600 / 750** (tabella completa in `oggetti.md` §5.8). I boss non scalano, i telegrafi non cambiano. Un gatto resta a 3 scintille o 1 affondo, una guardia a 6 scintille o 2 affondi, come nel platform.

**Capitolo 2 "La Pioggia" (settimane 15-20)**: Vicoli del Mercato (`espansione/mercato.png`) → Corso Trieste (pioggia, `canvas_env_reflect`) → Portici della Caserma. Boss: Capitano Ruggiero promosso (fendente a 3 colpi, chiama 2 guardie al 50%) / Il Decano (cavaliere-muro, vulnerabile solo da dietro) / **Regina dei Debiti** (vespa gigante: orbita + picchiata telegrafata 0,7 s, 3 vespe ogni 2 picchiate, anello di 8 monete-scaglie, ogni colpo subito costa anche 1 centesimo). Nemici nuovi: riflesso nella pozzanghera, lanterna vagante, guardia col fucile.

**Capitolo 3 "L'Alba" (settimane 21-26)**: Belvedere di San Leucio → Tessiture → Archivi della Reggia. Boss: Sorelle di Marmo / **Tessitrice di Pietra** (fili d'oro da parete a parete che ruotano, spole che rimbalzano 3 volte, braccia-telaio con telegrafo 0,9 s) / **La Ronda** (Capitano + 4 guardie). Nemici nuovi: tessitore lancia-spole, orologiaio, campanaro minore, cortigiano.

**Notte intera** (modalità della Parte 1 completa): i 3 capitoli in fila, 9 piani, 35-40 min, finale col Custode in fase 2 e la scelta su Violante (*Spezza il Velo* / *Risparmia*), 2 epiloghi con palette diverse (`room.gd` `_epilogue`).

### 2.4 Tipi di stanza e generazione

**Sette tipi + una porta**:

| # | Tipo (nome casertano) | Equivalente Isaac | Quante | Regole |
|---|---|---|---|---|
| 1 | **Normale** | normal | 5-7 per piano | layout da JSON, 3 fasce di difficoltà (facile/media/difficile); il piano 1 pesca facile+media, il 3 media+difficile |
| 2 | **Boss** | boss | 1 per piano | arena 13x7 sgombra, `boss_arena.gd` + `boss_bar.gd`, tombino alla fine, oggetto del pool boss, 1 maschera piena, 3-5 Anime |
| 3 | **Stanza del Ricordo** | tesoro | 1 per piano | statua con una memoria sul piedistallo, 1 oggetto (2 a scelta con la Reggia in miniatura); dal piano 2 costa 1 sigillo |
| 4 | **Fucina di Gaetano** (piani 1-2) / **Banchetto di Tonino** (piano 3) | bottega | 1 per piano | 1 oggetto a 15 cent. (attivi 10; uno slot con tag `ferro` sempre presente), 2 pickup (½ maschera 3, maschera di cera 5, martellata 5, sigillo 5, Mozzarella 5, Favilla 5); dal piano 2 il Banco ricompra un oggetto a 10; cassetta delle offerte (10 cent. → +50% Edicola); `shop.gd` esistente |
| 5 | **Segreta** | secret | 1 per piano | dietro un muro incrinato (3 stati disegnati), nella cella vuota con più vicini pieni; 2-4 pickup o 30% un oggetto del pool segreta |
| 6 | **Caserma dei Cortigiani** | mini-boss | 0-1 per run | 50% al piano 2, altrimenti al 3: Capitano Ruggiero, Cavaliere campione, o 2 guardie + duellante; ricompensa: oggetto del pool boss |
| 7 | **Stanza del Bivio** | (propria) | 1 per run | dialogo binario da `dialogues.json` con un personaggio della storia; 2 oggetti diversi per ramo; imposta `story.vars` (finale e sblocchi) |
| + | **Porta del Banco dei Pegni / Edicola votiva** | diavolo / angelo | dopo il boss | 1% base, +99% se sul piano non hai perso maschere, +35% se il boss non ti ha colpito, x0,5 se vista nel piano precedente. Banco: 2 oggetti del pool pegni a **1 o 2 maschere di massimo** (mai sotto 1 maschera). Edicola al 50% al posto del Banco se non hai mai impegnato: 1 oggetto gratis del pool edicola |

Porte: aperte/chiuse con `cancello_aperto/chiuso.png`; porta chiusa a chiave = grata (`mappa_saracinesca.png`, 1 sigillo); muro incrinato = martellata; porta del boss con bagliore rosso; porta dei Pegni viola, dell'Edicola oro.

**Generatore di piano** (`FloorGen`, deterministico dal seme):

1. Griglia 9x7, partenza al centro. BFS: una cella candidata è accettata se vuota, con al massimo 1 vicino pieno (albero, niente anelli) e con probabilità 0,5. Si ferma a N stanze (8/9/10 per piano; +1 con la curse "Strada perduta" della Parte 1 completa).
2. Vicoli ciechi ordinati per distanza dalla partenza: il più lontano (≥3 passi) = boss; poi Ricordo, Fucina, Bivio/Caserma.
3. Segreta: fra le celle vuote adiacenti ad almeno 2 stanze, peso +3 per ogni vicino oltre il secondo, mai adiacente al boss.
4. Tombino segreto (solo Villa): in una normale a distanza ≥2 dalla partenza.
5. Validazione: boss non adiacente alla partenza, almeno 2 vicoli ciechi, segreta raggiungibile, 1 sigillo garantito prima del primo uso. Fallisce → rigenera (max 20 tentativi, poi piano di riserva fisso).
6. Ogni stanza normale riceve un layout dal pool del tema e della fascia, con flip orizzontale/verticale dal flusso RNG `rooms`.

**Layout** (`data/run/rooms/<tema>/<id>.json`, griglia 13x7 in testo): `.` pavimento, `#` ostacolo (tufo, aiuola, colonna, tavolo), `O` buca (fontana, pozzo: ci cadono i proiettili, la vespa e il pipistrello la ignorano), `e:gatto` spawn, `c` champion possibile, `w` muro incrinato possibile. MVP: 12 layout per tema x 3 temi = 36, con i flip 144 varianti; 12 layout speciali (3 boss, 3 Ricordo, 2 Fucina, 1 Banchetto, 2 segreta, 1 Caserma). Verifica: test headless su 1000 semi (§4.3).

### 2.5 Nemici riusati e pattern

Principio: stati, tempi, numeri e telegrafi della macchina a stati attuale restano; cambia solo la geometria. Tutti passano a `MOTION_MODE_FLOATING` (la vespa lo è già), niente gravità né mensole; ombra ellittica a terra che si stringe in salto (già in `enemy.gd` `_draw`). Il **token d'attacco** di `world.gd` (`request_attack_token`: un attaccante alla volta, scadenza 2,5 s) viene estratto in `attack_tokens.gd` e tenuto: 1 token nelle stanze normali, 2 nelle stanze con 6+ nemici. I cartellini ("FENDENTE", "RAFFICA SPETTRALE") e il luccichio sull'arma restano.

| # | Nemico | Stato | HP · vel · cent. | Pattern dall'alto | Costo di porting |
|---|---|---|---|---|---|
| 1 | **Gatto nero** | `_ai_gatto` (388 righe con `is_on_floor`) | 3 · 75/165 · 2 | vaga; cono 380 px; *nota* 0,6 s (occhi accesi, soffio); *si accuccia* 0,34 s; *balza* sulla tua posizione (220 px, ombra che si stringe, schivabile di lato); atterra scoperto 0,45 s; ricarica 2 s; ogni 2° attacco zampata 90 px | riscrittura del movimento, 3 giorni |
| 2 | **Vespa reale** | `_ai_vespa`, già FLOATING | 2 · 130 · 2 | orbita a 150 px, vibra 0,55 s, picchia in linea a 560 px/s oltrepassando di 90 px, arretra 0,6 s; ogni 2ª volta pungiglione 230 px/s; ignora buche | 1 giorno |
| 3 | **Statua vivente** | `_ai_statua` | 6 · 0 · 4 | torretta: linea di mira 1 s, proiettile 240 px/s ogni 3,2 s; il Registro la ferma 2,2 s | 0,5 giorni |
| 4 | **Guardia della Città** | `elite.gd` `guardia` | 6 · 110 · 6 | a 130 px "STOCCATA" 0,48 s, scatto 250 px/s in linea, pausa 1,5 s; parabile | 1 giorno |
| 5 | **Duellante** | `duelist.gd` | 8 · 95 · 0 | tiene 130 px, alterna proiettile 280 px/s e fendente 110 px, telegrafo 0,55 s | 1 giorno |
| 6 | **Cavaliere di Pietra** | `elite.gd` `cavaliere` | 10 · 55 · 12 | lento; "FENDENTE PESANTE" 115 px; "URTO SISMICO" come anello radiale a terra 370 px/s; armatura davanti, vulnerabile da dietro | 1,5 giorni (serve immagine propria: oggi usa `props/statua_cavaliere.png`) |
| 7 | **Spettro del Calcare** | `elite.gd` `spettro` | 5 · 75 · 8 | attraversa gli ostacoli; "RAFFICA SPETTRALE" 3 proiettili a ±0,28 rad, 170 px/s | 1 giorno (serve immagine propria: oggi usa `regina_debiti.png`) |
| 8 | **Lanterniere del Velo** | `elite.gd` `lanterniere` | 5 · 80 · 8 | "BRACE" lenta 190 px/s che resta a terra 2 s come pozza; "LANTERNA" 110 px; un colpo interrompe la carica | 1 giorno |
| 9 | **Capitano Ruggiero** (mini-boss) | `elite.gd` ramo base | 14 · 65 · 22 | fendente / onda alternati, telegrafo 0,8 s, pausa 1,8 s | 1 giorno |
| 10 | **Ratti** | `rat_swarm.gd` | 1 · 235 · 0 | sciame a contatto, vita 7 s; escono da topaie e crepe | 0,5 giorni |
| 11 | **Sonnambulo** (nuovo) | dai 5 PNG dei cittadini | 3 · 90 · 1 | cammina dritto verso di te; il 50% è "svelto" (140 px/s) | 1 giorno |
| 12 | **Pipistrello** (nuovo) | dalle particelle di `env_flock.gd` | 1 · 160 · 0 | gruppi di 3, traiettoria a seno, contatto; ignora buche e ostacoli | 1 giorno |
| 13 | **Topaia** (nuovo) | statico | 6 · 0 · 3 | 1 ratto ogni 2,5 s, max 4 vivi; priorità per il giocatore | 0,5 giorni |
| 14 | **Mascherone** (nuovo) | faccia di pietra delle fontane, statico | 8 · 0 · 4 | sputa 4 getti cardinali a intervalli 1,5-3 s; invulnerabile mentre sputa (0,6 s) | 1 giorno |
| 15 | **Lanterna vagante** (nuovo) | luce | 2 · 120 · 1 | rimbalza in diagonale sui muri; esplode (1,5 caselle) alla morte: va uccisa da lontano o parata | 1 giorno |

Per piano 5-6 tipi; 15 tipi all'MVP (9 codificati + ratti + 5 nuovi), 24 nella Parte 1 completa.

**Champion** (innesto): 5% dei nemici dalla seconda stanza in poi (0% sul piano 1 alla prima run), 20% in modalità "Notte fonda". Quattro tinte via il parametro di tinta di `canvas_char_mesh.gdshader`, zero immagini nuove, drop garantito alla morte:

| Colore | Effetto | Lascia |
|---|---|---|
| Rosso | HP x2 (arrotondato per eccesso) | maschera |
| Giallo | velocità x1,5 | consumabile |
| Grigio | velocità x0,66, HP x1,5, knockback immune | sigillo |
| Ciano | esplode in 1,5 caselle alla morte (1,2 s di preavviso con lampeggio) | martellata |

**Boss** (uno per piano; versioni ingrandite dei comportamenti della demo, bibbia §XII; nessuno lascia un cadavere: si dissolvono in Anime colorate che salgono):

| Boss | HP | Stato | Pattern dall'alto | Fase 2 (50%) |
|---|---|---|---|---|
| **Gatto dei Quattro Canti** (piano 1) | 24 | solo arte `bosses/gatto_quattro_canti.png` 1024x690 | balza da un angolo all'altro con ombra grande 0,5 s; a ogni atterraggio 6 "ricordi" viola a 360° (200 px/s); zampata a semicerchio a contatto; 3 s di pausa punibile dopo ogni ciclo | evoca 2 gatti d'ombra (3 HP), balza 2 volte di fila, ricordi 8 |
| **Madre di Marmo** (piano 2) | 30 | `elite.gd` `madre` (hp 20, ventaglio 3 poi 5 a ±0,24/±0,18-0,36 rad, 180 px/s, carica 1,1 s, pausa 2,1 s) | al centro, ruota lentamente; ventaglio 3→5; 2 sfere azzurre che orbitano a 140 px (dall'arte); si colpisce da dietro o nella pausa | ventaglio 7, sveglia 2 statue ai lati, sfere a 3 |
| **Ratking** (Cisterne, alternativo) | 32 | **codificato** `ratking.gd` | artigli → carica con linea a terra 360 px → ratti dalle crepe dei bordi; colori di preavviso per attacco | ruggito 1 s, carica 580 px/s, artigli doppi, pattern a 5 |
| **Il Custode** (piano 3) | 36 | **codificato** `_ai_custode` (hp 36, vel 210) | a <180 px fendente (carica 0,46 / colpo 0,24 / recupero 0,62 s); altrimenti 50/50 balzo con ombra e onda **radiale** all'atterraggio, o raffica radiale 6 proiettili a 270 px/s con carica 0,9 s (il giglio sul petto si accende prima: `_update_glows`) | velocità x1,2, raffica 8, balzo doppio |
| **Violante** (dopo il Custode, se sbloccata) | — | arte `violante.png` | nessun combattimento (bibbia §XVI): schermata di scelta *Spezza il Velo* / *Risparmia Violante*; cambia l'epilogo e lo sblocco | — |

Gli HP della tabella sopra sono in unità del concept 1.0: con la scintilla di base valgono **400 / 550 / 600 / 750**. Tempo atteso per boss con la build mediana di fine run (32 DPS, uptime 60%): Gatto dei Quattro Canti ≈ 21 s, Custode ≈ 39 s; con una build debole (20 DPS) 33 s e 62 s; con zero oggetti di danno il Custode cade in 60-75 s (`oggetti.md` §4.3 e §5.8).

### 2.6 Oggetti: architettura, 20 esempi, sinergie

**La bibbia degli oggetti è `oggetti.md`**: statistiche e formule (§2), scintilla base, sostituti d'arma e tabella di priorità (§2.6-2.7), le 23 flag (§2.8), modificatori di numero e trasformazioni (§2.9), trigger e famigli (§2.10-2.11), `Stats.resolve()` (§2.12), i casi speciali (§2.13), il catalogo da 154 voci (§3), le 30 sinergie e le 10 anti-sinergie (§4), le regole delle pool, il pity e le curve (§5), lo schema `items.json` (§6). Qui resta il riassunto che serve a leggere il resto del concept.

**Architettura** (innesto da "Sotto il Velo", esteso al meccanismo completo di Isaac). Tutto in `data/run/items.json` + `weapons.json`, `flags.json`, `fusions.json`, `pools.json`, caricati da `tuning.gd` come oggi `tuning.json`. Ogni oggetto ha: `id` snake_case stabile, nome, lore, icona, pool con peso, qualità 0-4 (nascosta), fase, tag, **una lista ordinata di operazioni tipizzate** (`add`, `flat`, `mul` con gruppo, `flag`, `weapon`, `count`, `familiar`, `orbital`, `active`, `trigger`, `health`, `lives`, `player_flag`, `economy`, `set_tag`) con **al massimo 3 delta di statistica, 2 flag e 1 hook**, costo in braci se attivo. `Stats.resolve()` è una funzione pura a fasi fisse (ADD → SET → CLAMP → ARMA → FLAT → MUL → FLAT-POST → COUNT → FLAGS), indipendente dall'ordine di raccolta. Aggiungere un oggetto costa 10-15 righe di JSON e un'icona.

**La scintilla è la base** (2,73 colpi/s, 480 px/s, 6,5 caselle, danno = Danno); l'**affondo** resta sempre presente a priorità −1 (3× il Danno, 0,56 s) e riceve le flag di stato. **Le 14 flag dell'MVP** (bitset, si sommano con OR; una flag già innata nell'arma o nel personaggio dà +1 U invece di andare sprecata; una ignorata dalla forma +0,5 U):

| Flag | Oggetto | Effetto sul colpo |
|---|---|---|
| `inseguitrice` | Occhio che brilla | curva verso il nemico più vicino entro 3 caselle (l'affondo si aggancia entro 1) |
| `perforante` | Punta di diamante | attraversa i nemici (l'affondo colpisce tutti nei 110 px) |
| `spettrale` | Lembo di Velo | passa ostacoli e buche |
| `rimbalzante` | Spola scheggiata | rimbalza su muri e ostacoli |
| `divisoria` | Schegge di tufo | si divide in 2 a ½ danno |
| `fili` | Fili d'oro / Sciarpa di Agnese | nemico e proiettili al 60% per 1,5 s, filo d'oro visibile (`env_threads.gd`) |
| `velenosa` | Veleno della Regina | 25% + 12,5%·Sorte: 2×Danno in 2 s |
| `brace` | Brace del lanterniere | incendia (2×Danno in 2 s); le pozze del lanterniere durano il doppio |
| `spaventa` | 'A paura | 15% + 5%·Sorte: fugge 2 s |
| `esplosiva` | Petardo | +25 flat, esplode, autodanno ½, cadenza ×1/3 |
| `orbitante` | Giostra della festa | le scintille orbitano attorno a Ferruccio |
| `crescente` | Carbone della forgia | +0,6 di danno per casella percorsa |
| `a_bruciapelo` | Stoccata corta | ×3 a contatto, ×0,5 oltre 4 caselle; affondo ×1,5 fisso |
| `scudo` | Guardia di ferro | la scintilla distrugge un proiettile nemico |

**Le armi** (classe `Weapon`, una strategia per **forma**: proiettile, raggio, lancio, contatto, controllato) e la **tabella di priorità** a interi: Martello del fabbro 100 (Gaetano) > Raggio del Velo 40 > Pistola di Taddeo 30 > Spola d'oro 20 > scintilla 0; affondo −1 sempre. Prendere un sostituto rimpiazza il precedente (che lascia stat e flag innate), tranne le coppie di `fusions.json`: all'MVP **Raggio + Pistola = Raggio di Taddeo (×1,5)**, **Pistola + Spola = Spola perforante**, **Spola + doppio = Due spole a V**. Multi-colpo additivi (Occhi di gatto +1 senza penalità, Tricorno +2 a ×0,51, Eco dei Quattro Canti +3 a probabilità, Nuca dipinta +1 dietro) e 2 trasformazioni del profilo (Palla di cannone (D+4)×2 a ×0,42, Otre bucato ×5,5 di cadenza e ×0,2 di danno).

| Arma (forma) | Base | `inseguitrice` | `perforante` | doppio | `fili` | `brace` |
|---|---|---|---|---|---|---|
| **Affondo** (contatto, tutti) | 65-110 px, 3×Danno ogni 0,56 s | aggancio 1 casella | colpisce tutti nei 110 px | 2 affondi | filo nell'arco | lama ardente |
| **Scintilla** (proiettile) | 480 px/s, 6,5 caselle, Fiato | curva | passa | 2 a V, ×0,8 | filo sulla scia | incendiaria |
| **Pistola di Taddeo** (raggio istantaneo) | gittata infinita, perforante, cadenza = Fiato, nessun knockback | curva | innata: +1 U | 2 canne parallele | filo | fila in fiamme |
| **Spola d'oro** (lancio) | boomerang 5 caselle, colpisce 2 volte, cadenza ×0,45 | curva all'andata | innata con la Pistola: +1 U | 2 spole a V | innata (+1 U) | spola infuocata (anti dichiarata) |
| **Raggio del Velo** (raggio caricato) | 9 tick da 0,6·Danno in 0,6 s, cadenza ×1/3, perforante e spettrale | il raggio curva di 45° | innata: +1 U | 2 raggi paralleli | tutti rallentati | tutti in fiamme |

**Pool** (lista pesata; toccare un oggetto lo toglie da tutti i pool; visto e lasciato = peso ×0,5; pool vuoto → Ricordo → Pane cafone): Ricordo, Boss, Fucina (contiene gli ex Baule), Pegni, Edicola, Segreta, Bivio. Pesi di qualità per pool, regola dei q4 (50/90/98), pity e filtri per personaggio in `oggetti.md` §5.2-5.4. Nessuna pool dell'MVP sotto 4 di peso a profilo nuovo.

**Conteggio MVP: 80 voci** (`oggetti.md` §3.0) = 61 collezionabili (passivi, 3 armi, 8 attivi, 1 famiglio) + 6 ninnoli + 4 consumabili + 1 set + il fallback; 56 pescabili dai piedistalli a profilo nuovo; 154 nella Parte 1. 16 icone di oggetti esistono già in `src/assets/art/items/`, 63 da fare.

**20 esempi concreti** (numeri, pool e interazioni complete in `oggetti.md` §3; qui gli stessi oggetti del concept 1.0 con i valori nuovi)

| # | Oggetto | Tipo · pool · q | Effetto | Icona |
|---|---|---|---|---|
| 1 | **Palla di cannone della Reggia** | trasformazione · Pegni 0,5 / Segreta 0,2 · q4 | Danno (D+4)×2, cadenza ×0,42, la scintilla che uccide prosegue; con un multi-colpo +5 flat (il Polyphemus di Ferruccio: prende il posto della vecchia "Scintilla della lama", ora innata) | da fare |
| 2 | **Occhio che brilla** | passivo · Ricordo · q3 | flag `inseguitrice` | da fare |
| 3 | **Occhi di gatto** | multi-colpo · Boss · q3 | `doppio`: +1 colpo, ×0,8, nessuna penalità di cadenza; sbloccato di base (i 50 gatti sbloccano l'Artiglio dei Quattro Canti) | da fare |
| 4 | **Punzone G.F.** | passivo · Ricordo · q3 | Danno +1,5 U (3,50 → 5,86); +2 fisso sui nemici di pietra (statua, cavaliere, mascherone, Madre) | `pietra_gf.png` |
| 5 | **Sciarpa di Agnese** | passivo · Ricordo · q3 | Passo +0,3; flag `fili`; "contro il malocchio": il primo colpo subito in ogni stanza è annullato | `sciarpa.png` |
| 6 | **Lembo di Velo** | passivo · Segreta · q2 | i nemici ti notano al 70% (`veil_detection_multiplier`); flag `spettrale` | da fare |
| 7 | **Targa degli operai** | passivo · Boss · q3 | +1 maschera; portata dell'affondo +30% | `targa.png` |
| 8 | **Medaglione di Rosa** | passivo · Bivio di Tonino · q2 | +0,04 U di Danno per centesimo in tasca (max +3,96); ogni 15 centesimi raccolti +½ maschera; Sorte +1 | `medaglione_ritratti.png` |
| 9 | **Giglio spezzato** | passivo · Edicola 0,2 · q4 | 1 colpo annullato per stanza (cumulabile con la Sciarpa: 2) | `giglio_spezzato.png` |
| 10 | **Tempra degli stivali** | passivo · Fucina · q1 | ricarica dello scatto 0,55 → 0,40 s; Passo +0,15 | da fare |
| 11 | **Impugnatura rinforzata** | passivo · Fucina · q1 | tempo dell'affondo −15% (0,56 → 0,48 s) | da fare |
| 12 | **Fibbia della guardia** | passivo · Fucina · q2 | finestra di parata 0,18 → 0,22 s; riflesso a danno x3; dà la parata a chi non ce l'ha | da fare |
| 13 | **Disegno della Reggia** | passivo · Fucina · q1 | mappa del piano rivelata | `disegno_reggia.png` |
| 14 | **Reggia in miniatura** | passivo · Ricordo 0,7 · q3 | 2 oggetti a scelta in ogni Stanza del Ricordo (l'altro sparisce) | `reggia_miniatura.png` |
| 15 | **Pistola di Taddeo** | sostituto d'arma · Boss · q3 | raggio istantaneo perforante a gittata infinita, cadenza = Fiato; sblocco: Bivio di Taddeo "accusato" | da fare |
| 16 | **Spola d'oro** | sostituto d'arma · Ricordo · q3 | boomerang che colpisce 2 volte, cadenza ×0,45, `fili` innata | da fare |
| 17 | **Martello del calcare** | attivo 6 braci · Pegni/Ricordo · q4 | colpo ad area 120 px, 10×Danno, stordisce 0,8 s, pietra ×2, carica 0,42 s; rompe muri incrinati e ostacoli senza martellate (`hammer_*` di `tuning.json`) | `icona_martello.png` |
| 18 | **Rampino a catena** | attivo 2 braci · Boss (Ratking) · q2 | tira a te il nemico più vicino entro 420 px (`grapple_range`) e lo stordisce 0,8 s; sui boss tira Ferruccio | `icona_catena.png` |
| 19 | **Registro delle acque** | attivo 6 braci · Bivio del Registro · q3 | ferma tutte le torrette e congela i proiettili in volo per 2,2 s (`statue_interrupt_time`) | `libro.png` |
| 20 | **Scatola musicale di Bianca** | attivo 8 braci · Segreta 0,5 · q4 | addormenta la stanza 3 s; il primo colpo su un dormiente fa danno x2 | da fare |

Altri attivi: Lanterna del lanterniere (3 braci: pozza di fuoco 2 s), Sciarpa annodata (3 braci: parata lunga 1 s, `sciarpa_annodata.png`), Bomba carta (2 braci), **Mantice del fabbro** (attivo di partenza di Ferruccio, ex "Fiato del fabbro": 6 braci → 1 maschera in 0,85 s, l'attuale cura a braci di `player.gd`; prendere un altro attivo lo sostituisce: la prima scelta vera della run). Consumabili e ninnoli dell'MVP: Mozzarella (+1 maschera, `mozzarella.png`), Lettera (mappa), Spago della lettera (bussola: stanze speciali), Lettera sigillata (segreta), Carta reale (apre una porta chiusa), Fazzoletto col giglio (ninnolo: 10% dei drop forzati a maschera), Fazzoletto blu (ninnolo: +1 brace per stanza), Pugnale (ninnolo: Danno ×1,5 ai nemici sotto il 25%), Chiodo del fabbro (ninnolo: 33% di centesimo dagli ostacoli rotti), Biglietto di Mariella (ninnolo del Bivio "perdonato": Sorte +2). Parte 1 completa: Boccetta dello speziale e 12 **numeri della Smorfia** come consumabili (`oggetti.md` §3.L).

**5 sinergie (con il meccanismo; le 30 complete in `oggetti.md` §4.1)**

1. **Occhi di gatto + Occhio che brilla**: 2 scintille a V che curvano entrambe verso bersagli diversi entro 3 caselle; l'affondo doppio resta per il contatto. È la build mediana di Ferruccio (32 DPS a fine run).
2. **Spola d'oro + Punzone G.F.**: la spola colpisce 2 volte e ogni passaggio su un nemico di pietra vale Danno + 2 fisso: la Madre (550 HP) cade in ≈ 30 s.
3. **Pistola di Taddeo + Brace del lanterniere (flag `brace`) + Fili d'oro**: il colpo perforante incendia e rallenta tutta la fila: 2×Danno in 2 s su ogni nemico attraversato, tutti al 60%.
4. **Martello del calcare + Occhio che brilla + Sciarpa di Agnese (fili)**: il cratere scivola verso il bersaglio (`inseguitrice` sul contatto = aggancio) e lascia fili d'oro 2 s: la stanza resta inchiodata per il prossimo colpo.
5. **Scatola musicale di Bianca + Pugnale + Stoccata corta**: i dormienti contano come "sotto il 25%": ×1,5, il primo colpo ×2, l'affondo ×1,5 fisso: 79 danni al primo affondo con Danno 5,86.

Anti-sinergie dichiarate (10, con avviso sull'icona e `fix_for`, `oggetti.md` §4.2): fra le prime, Brace del lanterniere + Spola (la spola infuocata ti torna addosso se stai fermo), Petardo + Otre bucato (esclusi in pool), Artiglio + Raggio del Velo (due penalità di cadenza), Foglia della Villa + Lucciola di Bianca. Lembo di Velo + Pistola e Pistola + Scatola musicale non sono più anti: la prima vale +1 U, la seconda è una sinergia (×2 su tutta la fila).

### 2.7 Personaggi

Ogni personaggio = statistiche iniziali + 1 arma o oggetto di partenza + 1 regola propria. Tutti hanno già immagine e rig (`npc_cutouts.json`, `npc_puppets.json`); per la vista dall'alto servono fronte e retro (§4.4).

| | **Ferruccio** (base) | **Gaetano** (sblocco: battere la Madre) | **Agnese** (sblocco: 2 piani di fila senza perdere maschere, oppure Bivio "risveglia Agnese" + fine run) |
|---|---|---|---|
| Maschere | 5 | 6 | 3 |
| Danno · Passo · Sorte | 3,50 · 1,0 · 0 | 4,20 (×1,2) · 0,85 · 0 | 2,98 (×0,85) · 1,15 · +1 |
| Arma | scintilla (2,73/s, Misura 6,5) + affondo (stocco, 3×) | **Martello del fabbro** (priorità 100, forma `contatto`): area 90 px, carica 0,42 s, 1 colpo ogni 1,2 s × 2,73/Fiato (min 0,6 s), 3× il Danno; non spara mai: ogni flag passa dalla riga `contatto` (`inseguitrice` → cratere che scivola, doppio → colpi laterali, `perforante` → area; le flag di traiettoria valgono +0,5 U); i sostituti d'arma non compaiono nelle sue pool (`char_filter`) | **Spola d'oro** innata (boomerang, colpisce 2 volte, `fili` innata; Misura 5); la Spola non compare nelle sue pool, il Telaio di Agnese le dà +1 U |
| Scatto · Parata | sì · sì (riflesso x2) | no · no (la Fibbia della guardia gliela dà) | scatto a **2 cariche** · no (Fibbia) |
| Regola propria | attivo di partenza **Mantice del fabbro** (6 braci → 1 maschera); vede tutti i Bivi | rompe muri incrinati e ostacoli a contatto **gratis** (0 martellate iniziali); immune al knockback; Fucina -20%; l'Otre bucato sul Martello vale ×0,5 di danno e ricarica ÷2 | i fili d'oro ambientali non la feriscono; parte con 1 sigillo |
| Debolezza voluta | nessuna: è l'"Isaac" | nessuna gittata: soffre statue e Madre, cerca Lembo di Velo e Rampino | fragile: 3 maschere, nessuna parata |
| Arte | `ferruccio_cutout_v2/` 18 pezzi + model sheet a 3 viste | `gaetano_umano.png` + rig | `agnese.png` + pupazzo |

**Dopo l'MVP** (Parte 1 completa, 6 personaggi): **Taddeo** (Pistola innata, 4 maschere, Fiato −0,3, 1 sigillo; sblocco: 55 centesimi in una run), **Tonino** (7 maschere, Fiato −0,5, Passo 0,9, Mozzarella infinita con ricarica 60 s, Fucina −30%; sblocco: 10 acquisti in Fucina in totale), **Bianca** (nessuna maschera rossa e 2 di cera, Fiato +0,35, vola sopra buche e ostacoli, Giglio spezzato innato, Banco dei Pegni gratis; sblocco: morire con il Fazzoletto col giglio dopo aver battuto la Madre). Le **3 varianti di sciarpa** (ciano verità, oro onore, viola dolore, già previste per la co-op) sono skin via `canvas_char_mesh.gdshader`, zero immagini: primo contenuto del gacha della Parte 2. Mariella non va resa giocabile né venduta come oggetto (bibbia §IX): entra solo come Biglietto di Mariella, ricompensa del Bivio "Taddeo perdonato".

### 2.8 Economia intra-run

| Valuta | Nome di Ferruccio | Entrate | Uscite | Icona |
|---|---|---|---|---|
| Cuori | **Maschere** (mezza = maschera incrinata; **di cera** = scudo consumabile dell'Edicola) | drop a fine stanza 20% (60% mezza, 7% cera), boss 1 piena, Fucina ½ a 3 cent., Mozzarella, Medaglione, Mantice del fabbro | i colpi; il Banco dei Pegni (1-2 di massimo, o 3 di cera) | `maschera.png` |
| Monete | **Centesimi** | per nemico la metà di `tuning.enemies.*.coins` (gatto 1, statua 2, guardia 3, cavaliere 6, Capitano 11), 1-10 a stanza liberata (15% dei drop), Ratking 22, Custode 30; attesi **60-90 per run** | Fucina: oggetto 15 (attivo 10), pickup 3-7; cassetta delle offerte 10; il Banco ricompra a 10 | `moneta.png` |
| Chiavi | **Sigilli** | 1 garantito per piano + drop 10% ≈ 4,7 a run, champion grigio | Ricordo dal piano 2 (1), Fucina dal piano 2 (1), grate (0-1): 4-5 usi | i 7 `ui/carta/sigillo_*.png` sono i **sigilli d'oro** rari: aprono anche la grata della Caserma |
| Bombe | **Martellate** (60 danni) | 1 iniziale, drop 15%, 1 garantita per piano, champion ciano; Gaetano infinite a contatto | segreta (1 per piano), tombino (2), ostacoli | `icona_martello.png` |
| Carica attivo | **Braci** (0-12) | **+2 per stanza liberata, +4 per boss e Caserma, 0 per nemico** (≈ 46-50 a run); Favilla +3 (5% dei drop); Fazzoletto blu +1 per stanza | attivi da 1 a 8 braci (Rampino 2, Lanterna 3, Mantice del fabbro 6, Scatola 8) | da fare |
| Meta | **Anime colorate** | 3-5 per boss, 1 per piano liberato, 1 per sblocco | nessuna nella Parte 1 (si accumulano in `meta.json`; sono la valuta del gacha della Parte 2) | da fare |

**Tabella dei drop a fine stanza** (flusso RNG `drops`; la Sorte, tappata 0-5, sposta 3% per punto da "nulla" a "maschera"; `oggetti.md` §5.5): 22% nulla · 8% consumabile / Smorfia / ninnolo · 15% centesimi (1, 5 al 5%, 10 all'1%) · 20% maschera (60% mezza) · 10% sigillo · 15% martellata · 5% baule (3 pickup, 20% un oggetto della Fucina) · 5% Favilla (+3 braci). Con 17 stanze di combattimento: ≈ 13 drop per run, di cui 3-4 maschere, 1-2 sigilli (+ 3 garantiti), 2-3 martellate, 1 Favilla.

**Banco dei Pegni**: con 5 maschere di massimo, pagare 2 maschere per un oggetto q3-q4 è una decisione vera (il giudizio dei concept: "con le maschere da 5 il prezzo pesa davvero"). Chi impegna una volta perde l'Edicola per il resto della run.

### 2.9 Sblocchi e meta

Persistenti in `meta.json` (§3.7), 16 all'MVP:

| # | Sblocco | Condizione |
|---|---|---|
| 1 | Gaetano | battere la Madre di Marmo |
| 2 | Agnese | 2 piani di fila senza perdere maschere, oppure Bivio "risveglia Agnese" + run finita |
| 3 | Tombino delle Cisterne segnato sulla mappa | trovarlo una volta |
| 4 | Rampino a catena nel pool Boss | battere Ratking |
| 5 | Artiglio dei Quattro Canti nel pool Boss (gli Occhi di gatto sono sbloccati di base) | 50 gatti abbattuti |
| 6 | Punzone G.F. nel pool Ricordo | 30 nemici di pietra abbattuti |
| 7 | Registro delle acque | Bivio del Registro: "conservato" |
| 8 | Pugnale | Bivio di Taddeo: "accusato" |
| 9 | Medaglione di Rosa | Bivio di Tonino: "ricordo restituito" |
| 10 | Scatola musicale di Bianca | finire una run senza mai usare l'attivo |
| 11 | Martello del calcare nel pool Pegni | impegnare 3 volte in totale |
| 12 | Sciarpa ciano (skin) | 10 run completate (anche perse) |
| 13 | Sciarpa oro (skin) | prima vittoria sul Custode |
| 14 | Sciarpa viola (skin) | vittoria sul Custode senza Banco dei Pegni |
| 15 | Modalità "Notte fonda" (nemici +2 HP, champion 20%, drop maschere -1/3) | vittoria sul Custode |
| 16 | Scelta su Violante dopo il Custode | aver visto tutti e 3 i Bivi dell'MVP |

Il pannello "Collezione" (icone viste/prese, bestiario con i contatori) nasce già nella Parte 1 dagli stessi `items.json` ed `enemies.json`: nella Parte 2 diventa la pagina dell'hub.

---

## 3. Tecnologia

### 3.1 Stack scelto e motivazione

**Godot 4.6, GDScript, GL Compatibility, stesso progetto `src/`.** Non JS su canvas come PokeIsaac, perché: (a) il codice di combattimento, i rig a pezzi, gli shader, l'audio e i salvataggi esistono già in GDScript e valgono mesi; (b) l'export web funziona (18 s) e in futuro Windows/Android/iOS sono lo stesso progetto; (c) il peso è un problema di importazione delle texture, non del motore (40 MiB di wasm, ~10 MiB in transito se il server comprime). Nessun thread (`nothreads`): niente header COOP/COEP, gira su Safari iOS; la fisica 2D con 12 nemici e 40 proiettili sta comodamente in un frame.

### 3.2 Come nasce il progetto: cartella nella repo, non un nuovo progetto

Decisione: **una cartella `src/run/`** dentro lo stesso `project.godot`, con voce "Una Notte a Caserta" nel `title_screen.gd`, e un **preset di export dedicato "Web Notte"** (oggi `src/export_presets.cfg` ha solo "Windows Desktop": il preset web va salvato lì) che esclude ciò che il roguelike non usa.

Perché non un progetto nuovo: gli autoload (`Tuning`, `Audio`), gli shader `canvas_char_*`, `themes.gd`, `story.gd`, `save_slots.gd`, i rig e i 400 PNG con i loro `.import` sono condivisi; copiarli significa due verità. Perché un preset separato: il peso del pck dipende da cosa entra nell'export, non da cosa c'è nel repo. Il preset usa `export_filter="exclude"` ed `exclude_filter` su `scenes/world*`, `assets/art/areas/espansione/*` (tranne cisterne), `assets/art/characters/ferruccio_frames/*` (tranne i clip usati), `*.md`, `tools/*`. Se nonostante il filtro il pck non scende sotto i 60 MiB alla settimana 13, si estrae il roguelike in `E:/gioco/ferruccio-notte/` con uno script di copia dalla stessa repo (piano B, 1 giornata).

Il metroidvania resta giocabile dal menu, congelato con un tag git; tutto il tempo va al roguelike.

### 3.3 Cosa si copia dal platform e cosa no

**Si riusa così com'è** (0-1 giorno ciascuno): `autoload/audio.gd` + `audio.json` (4 bus, crossfade 1,5 s, 31 effetti mappati), `tuning.gd`, `themes.gd` (palette per area + grading), `story.gd` (6 VARS, `seen`, `check`), `dialogue_box.gd` + `dialogues.json` (23 personaggi, scelte binarie), `shop.gd`, `hud.gd` + `hud_queue.gd` + `boss_bar.gd` + `boss_arena.gd`, `pause_menu.gd`, `options_panel.gd`, `input_remap.gd` + `remap_panel.gd`, `save_slots.gd` (scrittura atomica `.tmp` + rename), `projectile.gd`, `pickup.gd`, `fx.gd`, `rat_swarm.gd`, `env_threads.gd`, `env_flock.gd`, tutti gli shader, `cutout_rig.gd` / `npc_cutout_rig.gd` / `npc_painted_puppet.gd` / `frame_puppet.gd` / `gatto_sprite.gd`, `world_map.gd` (ridotto a minimappa).

**Si riusa con ritocchi di geometria** (giorni): `enemy.gd` vespa/statua (1:1), `elite.gd`, `duelist.gd`, `ratking.gd` (MOTION_MODE_FLOATING, ombra, niente mensole), `_ai_custode` (balzo con ombra e onda radiale).

**Si riscrive** (nuovo, piccolo): il movimento del gatto (stati e tempi invariati), `top_player.gd` (movimento 8 direzioni con `accel_ground`/`decel_ground` di `tuning.json`; mira separata e auto-fuoco della scintilla; affondo, scatto, parata e i-frame copiati da `player.gd`), `run_world.gd` al posto del monolite `world.gd` (1728 righe di metroidvania: sopravvivono il token d'attacco, `enemy_fire`/`enemy_burst`/`enemy_shockwave`, hitstop e scossa da `tuning.feel`).

**Non si tocca**: `room.gd` `ROOMS`, `terrain.gd`, `traversal.gd`, `moving_ledge.gd`, `expedition.gd`, tutto ciò che sa di gravità.

### 3.4 Architettura delle scene e dei dati

```
src/run/
  Run.tscn / run.gd            radice: carica RunState, FloorGen, RoomHost, HUD, Minimap, Transition
  run_state.gd (autoload RunState)  seme, personaggio, piano, stat, inventario (id), contatori, RNG per flusso
  floor_gen.gd                 albero BFS 9x7, stanze speciali, validazione, piano di riserva
  room_loader.gd               legge data/run/rooms/<tema>/<id>.json, piazza ostacoli, spawn, porte
  room/Room.tscn               pavimento dipinto + fascia muro + 4 porte + ostacoli + buche + spawner
  entities/                    top_player.gd, weapon.gd (5 strategie, una per forma), attack_tokens.gd, shadow2d.gd,
                               enemy wrappers (riusano enemy.gd/elite.gd/duelist.gd/ratking.gd), champion.gd
  items/                       item_db.gd (carica items/weapons/flags/fusions/pools.json), item_pickup.gd, pools.gd, stats.gd, trigger_bus.gd, special_cases.gd
  ui/                          character_select.gd, run_summary.gd, pawn_shop.gd, minimap.gd, stat_panel.gd,
                               touch_controls.gd
src/data/run/
  items.json  pools.json  enemies.json  bosses.json  floors.json  champions.json  unlocks.json  drops.json
  rooms/piazza/*.json  rooms/giardino/*.json  rooms/oro/*.json  rooms/cisterne/*.json  rooms/special/*.json
user://notte/
  meta.json  run.json  runs_log.jsonl
```

Flusso di una stanza: `RoomHost` istanzia `Room.tscn` con il layout → `attack_tokens` resetta → porte chiuse → nemici con `champion.gd` applicato al 5% → ultimo nemico morto → `drops.gd` pesca dal flusso `drops` → porte aperte → `RunState.on_room_clear()` (braci +2, hook degli oggetti, log).

**Stats**: `stats.gd` espone `Stats.resolve(personaggio, inventario, effetti_temporanei) → Build`, funzione pura a fasi fisse (ADD → SET → CLAMP → ARMA → FLAT → MUL per gruppo → FLAT-POST → COUNT → FLAGS), con i clamp di `oggetti.md` §2.1 (Passo 0,6-1,6, Slancio 0,6-2,0, Misura 2-13, Fiato cap 5/s poi 15 per arma e 20 totali, Maschere 1-12). Ricalcolo a ogni pickup o trigger, mai per frame; cache su hash dell'inventario; indipendente dall'ordine di raccolta (test di permutazione).

**Ripresa della run**: `run.json` salvato a ogni cambio stanza (seme, piano, indice stanza, stanze visitate/liberate, inventario, stat, stato degli RNG per flusso, tempo). Chiudere il browser e riaprire riporta alla stessa stanza con lo stesso inventario.

### 3.5 Export web e hosting

- Preset "Web Notte": template `web_dlink_nothreads_release` (già verificato), `variant/thread_support=false`, `variant/extensions_support=true`, `html/canvas_resize_policy=2` (adattivo), `html/focus_canvas_on_start=true`, `progressive_web_app=false` all'inizio.
- Comando di verifica, da ripetere a ogni milestone: `godot --headless --path src --export-release "Web Notte" ../build/web/index.html` e poi la dimensione di `index.pck` e `index.wasm` nel log. Criterio: **pck < 60 MiB** (obiettivo 40), wasm 40 MiB.
- Caricamento: schermata di attesa propria (la barra di Godot è brutta), musica del menu subito, primo frame giocabile < 15 s a 20 Mbit.
- Hosting MVP: **itch.io** (HTML5, gratis, limite per file 1 GiB, pagina privata per i playtest poi pubblica, pulsante Ko-fi). Parte 2: hub su Cloudflare Pages o Netlify (gratis) con i file di gioco su Cloudflare R2 o Supabase Storage (Pages ha un limite di 25 MiB per file: il pck non ci sta), stesso dominio, CORS impostato.
- Pck secondari: i capitoli 2 e 3 (Parte 1 completa) come `.pck` separati da 8-10 MiB scaricati con `HTTPRequest` in `user://` e montati con `ProjectSettings.load_resource_pack` alla selezione del capitolo; il pck principale contiene solo il Capitolo 1.

### 3.6 Dieta delle texture

Fatti di partenza: `src/assets/art/` pesa 223 MiB per 401 PNG importati lossless; pck 231 MiB; `bosses/custode_anim.png` 3024x4816 (18,8 MiB) sopra il limite di 4096 px del web; i 9 dipinti di `areas/espansione/` 2,5-2,9 MiB l'uno; 167 fotogrammi di Ferruccio.

| Intervento | Come | Effetto stimato |
|---|---|---|
| Lossy WebP per tutto | script che riscrive i `.import`: `compress/mode=2` (Lossy), `compress/lossy_quality=0.85`, `mipmaps/generate=false`, poi reimport headless | -85/-90% sui dipinti (fondale 1792x1008 da 2,7 MiB a ~300 KiB); differenza invisibile sull'arte dipinta |
| Tetto di risoluzione | `process/size_limit=2048` nei `.import` dei fogli; `custode_anim.png` spezzato in 4 fogli ≤ 2048 con uno script in `tools/art/` | nessun file sopra i limiti del web e dei telefoni |
| Solo ciò che la run usa | `exclude_filter` del preset: via le espansioni non usate, i fotogrammi di Ferruccio non nei clip (167 → ~60), gli interni dipinti del metroidvania | il pck del Capitolo 1 contiene ~140 texture |
| Audio | OGG a 96 kbps (≈0,7 MiB/min): 3 musiche d'area + 2 boss + menu + 4 ambienti ≈ 12 MiB | budget audio fisso |
| Budget VRAM per piano | una WebP lossy decompressa è RGBA8 in VRAM: 2048x2048 = 16 MiB. Al massimo 12 texture grandi residenti per piano (≤ 200 MiB, il limite pratico su un telefono medio); fondali caricati al cambio piano con `ResourceLoader.load` e liberati | niente crash per memoria su Android/iOS |

Stima finale: **pck 35-45 MiB** per il Capitolo 1, misurato nel log di export alla settimana 13 (criterio di accettazione, non impressione).

### 3.7 Dati già pensati per la Parte 2 (innesto, dal giorno 1)

1. **Id stabili** snake_case, mai riciclati, per oggetto, personaggio, nemico, boss, layout (`piazza_n_017`), sblocco, skin. Un intero `content_version` in `floors.json`, incrementato a ogni cambio di contenuto che altera la generazione.
2. **Seme**: 40 bit mostrati come **8 caratteri** su un alfabeto di 32 simboli senza 0/O/1/I (come Isaac); da `hash(seme, nome_flusso)` nasce un `RandomNumberGenerator` per flusso: `floor`, `rooms`, `items`, `drops`, `ai`, `champions`. Lo stato di ogni RNG è salvato in `run.json`. **Lint**: `grep -rn "randf\|randi\|randomize" src/run` deve dare 0 risultati fuori da `run_state.gd`. Stesso seme + stessa `content_version` = stesso piano, stessi oggetti, stessi drop: è ciò che rende possibili seme giornaliero e classifiche.
3. **`runs_log.jsonl`**, una riga per run:
   `run_id` (uuid), `content_version`, `seed`, `character_id`, `started_at` (ISO), `duration_s`, `result` (`won|died|quit`), `floor_reached`, `rooms_cleared`, `killed_by` (enemy_id), `items[]` {id, floor, room_type}, `bosses[]` {id, time_s, damage_taken}, `damage_taken`, `pawn_shop_used`, `story_vars`, `score`, `souls_earned`, `platform`, `build`.
   Punteggio: `score = 1000·piani + 10·stanze + 500·boss − 50·colpi subiti + bonus tempo (max 500, lineare da 15:00 a 8:00)`.
4. **`meta.json`**: `unlocks[]`, `counters` {enemy_id: abbattuti, item_id: presi, boss_id: vittorie}, `collection` {items_seen[], enemies_seen[]}, `souls` (saldo Anime), `skins_owned[]`, `settings`, `device_id`, `updated_at`. Il merge della Parte 2 è "l'ultimo `updated_at` vince per campo, i contatori si sommano".
5. Nessuna rete nella Parte 1: i file restano in `user://` (IndexedDB nel browser). La Parte 2 aggiunge una funzione `sync()` che manda `runs_log.jsonl` e `meta.json` a Supabase, e nient'altro cambia.

---

## 4. Produzione

### 4.1 MVP in numeri (settimana 14)

| Voce | Quantità |
|---|---|
| Piani | 3 + Cisterne Sepolte (3-4 stanze) |
| Temi grafici dall'alto | 3 (piazza, giardino, oro) + cisterne con il tileset esistente |
| Layout di stanza | 36 normali a mano (12 per tema, 4 per fascia) + flip = 144 varianti; 12 speciali |
| Nemici | 15 tipi (9 codificati + ratti + 5 nuovi) x 4 champion |
| Boss | 4 (Gatto dei Quattro Canti, Madre di Marmo, Ratking, Custode) + 1 mini-boss (Capitano) |
| Collezionabili | 80 voci (`oggetti.md` §3.0: 61 collezionabili con 3 sostituti d'arma e 8 attivi, 6 ninnoli, 4 consumabili, 1 set, fallback; 56 pescabili a profilo nuovo); 14 flag; 5 forme d'arma; 4 multi-colpo; 2 trasformazioni; 7 pool; 3 fusioni nominate; 10 casi speciali |
| Personaggi | 3 (Ferruccio, Gaetano, Agnese) |
| Stanze del Bivio | 4 (Registro, Tonino, Taddeo, Agnese) con 8 ricompense |
| Tipi di stanza | 7 + porta Pegni/Edicola |
| Sblocchi | 16 |
| Audio | 10 musiche esistenti + 1 tema boss nuovo (Gatto dei Quattro Canti) + 22 effetti nuovi (porte x2, sigillo, martellata, muro, affondo x4 direzioni, scintilla, raggio del Velo, fusione, attivo, pegno, tombino, champion, drop x3, bivio, fine run, tocco UI) |
| Arte nuova | 3 pavimenti + 3 fasce muro, 16 ostacoli, porte a 4 lati, Ferruccio fronte/retro, 5 nemici nuovi, 2 immagini proprie (Spettro, Cavaliere), **63 icone di oggetti** (16 esistono; `gen_icons.py`, 11 fogli a 6), 14 varianti di sprite della scintilla + 3 sprite d'arma, icona braci, icona Anime, 3 ritratti boss per la boss bar |
| Web | pck < 60 MiB, primo frame < 15 s a 20 Mbit, 60 fps desktop, 30+ fps su Android medio |
| Durata run | 10-14 min; piano 1 in 2-3 min |

### 4.2 Parte 1 completa in numeri (settimana 26)

3 capitoli (9 piani) + Notte intera + epilogo con Violante; 7 temi (+ mercato, strada/caserma, belvedere, tessiture/archivi); 108 layout (36 per capitolo) + 36 speciali; 24 nemici; 9 boss di capitolo/alternativi + 3 mini-boss + Violante; **154 voci** (`oggetti.md`: 126 collezionabili con 10 armi e 13 attivi, 11 ninnoli, 17 consumabili con i 12 della Smorfia, 3 set); 6 personaggi; 6 Stanze del Bivio; 40 sblocchi; 3 curse (Buio del Velo, Strada perduta, Volto ignoto); modalità Notte fonda; seme giornaliero locale; 3 temi boss nuovi; pck principale < 45 MiB + 2 pck di capitolo da 8-10 MiB.

### 4.3 Piano in settimane (1 sviluppatore + Claude Code, 25-30 h/settimana)

Ogni milestone ha un criterio eseguibile. Stima totale MVP ~380 h; il giudice più prudente dava 550 h per NOTTE senza innesti: la settimana 14 è quindi il caso buono, la 18 il caso cattivo, e la lista di taglio è in fondo.

| Sett. | Milestone | Contenuto | Criterio di accettazione |
|---|---|---|---|
| **1-2** | **Una stanza** | `top_player.gd` (8 direzioni, affondo, scatto, parata), 1 stanza 13x7 con 4 porte che si chiudono/aprono, vespa e statua 1:1, gatto riscritto in 2D con balzo e ombra, HUD maschere, Ferruccio di fronte con i pezzi esistenti (§4.4) | build web della stanza < 30 MiB a 60 fps su Chrome e Firefox desktop, ≥ 30 fps su un Android medio; 3-5 persone giocano 5 minuti e rispondono a una sola domanda: "la scintilla più lo stocco ti sembrano Ferruccio?" (porta decisionale sul peso dell'affondo: se la scintilla lo rende inutile, la leva è il 3× → 4× o la portata, non la cadenza; rischio 1) |
| **3-4** | **Primo piano** | `RunState` con seme e flussi RNG, `FloorGen` + minimappa + tombino, sigilli/martellate/muro incrinato/segreta, drop a fine stanza, Ricordo e Fucina (con `shop.gd`), 12 layout di Piazza Dante, sonnambulo e pipistrello, `runs_log.jsonl` e `meta.json` scritti | test headless: 1000 semi → 1000 piani validi; stesso seme = stesso hash del piano; `grep randf src/run` = 0; una run del piano 1 in 2-3 min |
| **5-6** | **Oggetti e armi** | `items.json` con 35 oggetti (14 flag, Spola/Pistola/Raggio del Velo, 4 multi-colpo, Palla di cannone e Otre bucato, 8 stat, 4 attivi), `Stats.resolve()`, `weapon.gd` con le 5 forme, pool e qualità con pity, pannello stat, Banco dei Pegni ed Edicola, champion (`oggetti.md` §5.11) | bot headless su 10 semi: 10 log con sequenze di stanze e oggetti tutte diverse e tutte terminabili; matrice **5 forme x 14 flag x 4 multi-colpo** istanziata headless, 0 crash; snapshot numerico dei **10 casi speciali** uguale a `oggetti.md` §2.13; il Banco compare nel 95-100% dei piani senza danno e in ~1% degli altri |
| **7-8** | **Primo boss, alpha privata** | Gatto dei Quattro Canti (3 pattern + fase 2), stanza boss con `boss_bar.gd`, Villa Comunale con statua/cavaliere/lanterniere/spettro/mascherone/topaia, 24 layout totali, schermata di fine run con seme e statistiche, ripresa della run da `run.json` | run di 2 piani in 6-9 min; il boss viene battuto da un giocatore nuovo entro il 3° tentativo e da chi conosce Isaac al 1°; 0 crash in 50 run del bot; 5 playtester esterni con il link privato |
| **9-10** | **Tre piani, quattro boss** | Madre promossa a boss (30 HP, ventaglio 3→5→7, statue al 50%), tombino → Cisterne Sepolte (4 layout col tileset di tufo) → Ratking, Cortile d'Onore con Custode in 2D, Capitano mini-boss, 36 layout, 1 tema boss nuovo | run di 3 piani in 10-14 min; ogni boss cade in 45-90 s con la build media del bot; Ratking raggiunto nel 30-40% delle run del bot che trovano il tombino |
| **11-12** | **Personaggi e meta** | Gaetano e Agnese con selezione personaggio, le 80 voci dell'MVP con 3 fusioni nominate e `char_filter`, 4 Stanze del Bivio collegate a `story.gd` (8 ricompense), `unlocks.json` con 16 sblocchi, collezione/bestiario, 22 effetti sonori, controlli touch | run completa con ciascuno dei 3 personaggi; ogni pool ≥ 4 di peso a profilo nuovo; sblocchi persistiti tra due sessioni del browser; ripresa dopo chiusura dalla stessa stanza con lo stesso inventario; touch giocabile su un telefono in orizzontale |
| **13** | **Dieta web** | WebP lossy, tetto 2048, Custode spezzato, fotogrammi inutili esclusi, preset "Web Notte" con filtri, OGG 96 kbps, schermata di caricamento, pagina itch.io privata | **pck < 60 MiB** nel log di export; primo frame giocabile < 15 s con Chrome DevTools a 20 Mbit; 60 fps nel piano 3 con 12 nemici e 40 proiettili su un portatile con grafica integrata; 30 fps su Android medio |
| **14** | **Bilanciamento e MVP pubblico** | 20 run del bot per personaggio, 10 playtest umani con modulo, correzioni ai pesi di `pools.json` e ai numeri di `tuning`/`items.json`, pagina itch.io pubblica con Ko-fi, post su r/bindingofisaac e un Discord di roguelike | 100 run registrate nel log in 2 settimane; tasso di vittoria sul Custode fra 10 e 25% fra chi supera 10 run; mediana della run 10-14 min; crash < 1%; nessun oggetto scelto nel Ricordo meno del 3% o più del 40% delle volte; DPS a fine run P10 ≥ 18, P50 26-34; ogni boss in 45-90 s con la build mediana |
| 15-20 | Capitolo 2 | Mercato, Corso Trieste (riflessi), Caserma; Regina dei Debiti, Capitano promosso, Il Decano; riflesso, lanterna vagante, guardia col fucile; Taddeo; +40 voci (Lucciola, Mangiafuoco, Alone, Botto, 5 flag, cloni, 2 set); 36 layout; pck secondario | run del Capitolo 2 in 11-15 min; pck principale invariato, pck del capitolo < 10 MiB; matrice 8 armi x 19 flag headless |
| 21-26 | Capitolo 3 e lancio Parte 1 | Belvedere, Tessiture, Archivi; Tessitrice, Sorelle, La Ronda; Tonino, Bianca; +34 voci fino a 154 (Ago, Cannone, Edicola completa, 12 Smorfia, Boccetta); Notte intera; Violante e 2 epiloghi; 3 curse; seme giornaliero locale; trailer di 60 s | Notte intera in 35-40 min; 50% di chi batte la Madre arriva al Custode entro 20 run; 40 sblocchi persistiti; statistiche già nel formato della Parte 2; matrice 10 x 23 x 6 headless |

**Lista di taglio ordinata** (se la settimana 10 è in ritardo di più di una settimana): champion → Caserma dei Cortigiani → Edicola (si tiene il Banco) → Agnese (si tiene Gaetano) → gli oggetti nell'ordine della lista di taglio di `oggetti.md` §3.0 (Settima vita, volo, Scatola musicale, orbite, Bivi nuovi…) → Cisterne/Ratking (resta il più pronto, si taglia per ultimo).

### 4.4 Pipeline arte

**Decisione: vista a tre quarti dall'alto, come Isaac, non vista zenitale.** La camera è inclinata (~60°): i personaggi si vedono quasi di fronte, il pavimento in prospettiva schiacciata, la fascia del muro in alto. Vantaggi decisivi: (a) i **pupazzi a pezzi** esistenti funzionano senza cambiare il rig; (b) il model sheet di Ferruccio (`assets/art-source/personaggi/ferruccio-model-sheet-02.jpg`) ha già **fronte, profilo e retro**, cioè le 3 viste che servono: verso il basso = fronte, verso l'alto = retro, destra = profilo, sinistra = profilo specchiato; (c) i fondali dipinti esistenti (facciate, portici, Reggia) diventano la fascia del muro in alto, come la parete di fondo delle stanze di Isaac.

Regole di produzione:
- **Personaggi giocabili**: 3 viste (fronte/profilo/retro) a pezzi; lo scheletro è lo stesso `cutout_rig.gd`, la camminata è la molla smorzata del codice. Il primo prototipo (S1-2) usa i pezzi di `ferruccio_cutout_v2/` di fronte con uno schiacciamento verticale dell'8% e l'ombra a terra: **zero arte nuova per iniziare**. Fronte e retro si ritagliano dal model sheet esistente con `tools/art/ferruccio_v2/cutout_v2.py`.
- **Nemici**: una sola vista (profilo a tre quarti) + flip, come in Isaac; solo i nemici con un "davanti" meccanico (cavaliere, mascherone) hanno anche il fronte.
- **Boss**: immagini esistenti a 2-3 pezzi (il Custode lo è già), ombra grande, il balzo è scala + ombra.
- **Pavimenti**: una sola immagine dipinta per tema, 960x576, generata da Gemini e importata con `tools/art/import_art.py`; ostacoli come PNG separati con alfa (4-6 per tema), silhouette scura con un solo bordo di luce (art bible §1); le 4 porte dai 2 cancelli esistenti (alto/basso) più 2 versioni laterali.
- **Animazioni**: la regola di memoria del 15 ottobre resta (i cicli coerenti vengono dai **video** generati con Gemini/Veo o Grok ed estratti con `tools/art/video_cycle.py`, non dai fogli di pose). Per la vista dall'alto si chiede un video solo quando la molla del rig non basta: camminata di fronte e di spalle di Ferruccio, balzo del gatto. Budget: 1 giornata di prova sui due nella settimana 2, decisione il venerdì.
- **Icone**: 27 nuove con `tools/art/gen_icons.py` e i fogli a 6 (stesso formato delle 18 esistenti).

### 4.5 Prompt da chiedere a Gemini

Stile e formato sono quelli di `design/model-sheet-prompts.md` (allegare sempre il model sheet di Ferruccio come immagine 1). Salvare in `assets/art-source/` e aggiungere la voce in `tools/art/manifest.json`.

**A. Ferruccio dall'alto (primo personaggio)** — allegare `ferruccio-model-sheet-02.jpg` come immagine 1 e `ferruccio_cutout_v2` montato (export dal gioco) come immagine 2.

```text
Image 1 is the model sheet of Ferruccio, the hero of my game; image 2 is how he looks in the game. Make a new model sheet of the SAME character in EXACTLY the same style (same painterly brushwork, soft ink outlines, muted palette, warm-light/cool-shadow lighting, flat medium grey background), but seen from a video-game top-down three-quarter camera tilted about 60 degrees, like the camera of The Binding of Isaac: we see the top of the hat and shoulders more than in a side view, the feet are close together under the body. Four views side by side, same scale, feet on the same ground line: facing the camera, facing right (left profile), facing away from the camera, and three-quarter facing down-right. Neutral standing pose, arms slightly away from the body, the rapier held low along the right leg, so that head, torso, each arm, each leg and the rapier can be cut out separately. Keep the black mask with one glowing eye, the white smock, the red scarf, the tall cone hat. No text, no labels, no extra figures, no props on the ground, wide margin around the figures.
```

**B. Gatto nero dall'alto (primo nemico)** — allegare `ferruccio-model-sheet-02.jpg` (immagine 1) e `assets/art-source/nemici/gatto/walk.jpg` (immagine 2).

```text
Image 1 is the model sheet of Ferruccio, the hero of my game, and sets the style; image 2 is the black cat enemy already approved. Keep the design of image 2 (young black cat, amber glowing eyes, slightly ragged fur) and repaint it in the style of image 1, seen from a video-game top-down three-quarter camera tilted about 60 degrees, like The Binding of Isaac. Five poses side by side on one flat medium grey background, same scale, about one third of Ferruccio's height: (1) standing facing right, (2) standing facing the camera, (3) standing facing away, (4) crouched low facing right, ready to pounce, ears back, (5) mid-leap facing right, body stretched, all four legs off the ground. Legs clearly separated from the body, tail away from the body in every pose, so that head, body, each leg and tail can be cut out separately. Strong readable silhouette, the eyes are the only bright detail. No text, no labels, no shadows painted on the ground.
```

**C. Pavimento di Piazza Dante (bonus, primo tema)** — allegare `assets/art-source/riferimenti/stile_piazza.jpg` (immagine 1) e il fondale medio di `areas/piazza/` (immagine 2).

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood. World: a dreamlike alternate Caserta, 1845, Bourbon neoclassical architecture. Image 1 sets the palette and brushwork; image 2 is the facade of Piazza Dante at night in my game. Paint the FLOOR of an empty rectangular game room seen from a top-down three-quarter camera tilted about 60 degrees, like The Binding of Isaac, aspect ratio 5:3 (for example 1600x960): grey basalt cobblestones of the square, slightly uneven, worn, with a faint hand-drawn irregularity (never a perfect grid), darker and cooler towards the bottom corners, two warm pools of gas-lamp light near the top-left and top-right. Along the top edge only, a low strip (about one sixth of the height) of the neoclassical facade from image 2 with two lit gas lamps and dark windows, seen from the same high camera. The other three edges end with a low dark stone kerb. No characters, no objects on the floor, no doors, no text, no watermark. Overall darker than a white character standing on it.
```

---

## 5. PARTE 2 in breve: l'hub di servizio

Da fare dopo l'MVP pubblico, non prima: ogni pezzo legge `runs_log.jsonl` e `meta.json` (§3.7) e non tocca il gioco.

### 5.1 Hub

Una pagina web (stesso dominio, Cloudflare Pages/Netlify) con il gioco incorporato e attorno: profilo, collezione (icone e bestiario dagli stessi JSON), classifiche, missioni, gacha, mercato, clan. Come pokeisaac.com: gratis, Ko-fi in evidenza, nessun acquisto.

### 5.2 Account

**Supabase** (regione UE, Francoforte): accesso con Google e con email a link magico (niente password da custodire). Tabelle: `profiles`, `runs` (una riga per riga di `runs_log.jsonl`, con il JSON originale), `meta` (una per utente, versionata), `unlocks`, `collection`, `currency_ledger` (ogni movimento di Anime, mai un saldo mutabile), `daily_seeds`, `missions`, `mission_progress`, `clans`, `clan_members`, `friendships`. RLS: ogni utente legge e scrive solo le sue righe; le classifiche sono viste pubbliche. Edge Function `submit_run`: convalida la riga (campi, `content_version`, limiti fisici: una run di 3 piani non dura 40 s, il punteggio si ricalcola dal server), applica un limite di frequenza e accredita le Anime. Salvataggio cloud: `meta.json` sale a ogni fine run e scende all'accesso; conflitto risolto per campo con `updated_at`, contatori sommati. Il gioco continua a funzionare offline e senza account.

### 5.3 Gacha a valuta guadagnata, nel rispetto delle regole UE

- **Si tira solo con le Anime**, guadagnate giocando (boss, piani, missioni). Nessun modo di comprare Anime o tiri con denaro, nessuna conversione, nessuna valuta intermedia: così il sistema non è un gioco d'azzardo (l'elemento che le autorità di Belgio e Paesi Bassi contestano è la posta in denaro reale) e non è una loot box a pagamento ai sensi delle linee guida consumatori UE.
- **Solo cosmetici**: sciarpe (le 3 varianti via shader), tinte della maschera, scie dell'affondo, cornici del profilo, ritratti. Niente che cambi i numeri della run.
- **Probabilità pubblicate** nella schermata del gacha (per rarità e per oggetto), **pietà garantita** a 30 tiri, nessun doppione oltre il 3° (si convertono in Anime), nessun timer di scarsità sui contenuti.
- **Tiro lato server** (Edge Function `gacha_pull` con RNG del server e registro nel `currency_ledger`): il client mostra solo il risultato.
- **Donazioni Ko-fi** separate dal gacha: chi dona riceve, senza casualità, una sciarpa "mecenate" e un nome nei titoli. Nessun vantaggio di gioco.
- **GDPR**: informativa privacy, dati minimi (email, id Google, run), esportazione e cancellazione dell'account con un pulsante, nessun tracciamento di terzi, consenso esplicito per le statistiche aggregate. Il gioco è per tutti ma la pagina dichiara "nessun acquisto in-app".

### 5.4 Classifiche, missioni, clan

- **Seme giornaliero** = `hash(data UTC, content_version)`: tutti giocano lo stesso piano, un tentativo valido al giorno, classifica per `score` e per tempo; classifiche globali per personaggio e settimanali.
- **Missioni** derivate dagli eventi del log, senza nuovo codice nel gioco ("abbatti 30 gatti con Agnese", "impegna 2 volte e vinci", "batti Ratking sotto i 2 minuti"): 3 al giorno, premio in Anime.
- **Mercato**: bottega con le Anime (cosmetici fuori gacha a prezzo fisso) e scambio di doppioni 1:1 dentro il clan. Nessun denaro, nessun valore reale: così lo scambio non trasforma il gacha in azzardo.
- **Clan**: 20 membri, missioni di clan sommate, classifica di clan sul seme giornaliero, chat solo con messaggi predefiniti (niente moderazione da fare).

### 5.5 Coop online

Il pezzo più costoso e l'ultimo. 2 giocatori, host autoritativo (già previsto dalla bibbia §XIX: lo stato narrativo lo conferma l'host), `WebRTCMultiplayerPeer` di Godot con segnalazione via Supabase Realtime; export senza thread va bene (la rete è asincrona). Prerequisiti: seme deterministico (c'è), input sincronizzati a 30 Hz, nemici e drop calcolati dall'host, seconda sciarpa colorata via shader (c'è). Prima della coop vera si può offrire una coop asincrona a costo basso: "il fantasma dell'amico" sullo stesso seme (replay dei soli movimenti dal log) e le sfide di clan.

### 5.6 Ordine e dipendenze

| Passo | Settimane (dopo la Parte 1) | Dipende da |
|---|---|---|
| 1. Account + salvataggio cloud | 27-28 | `meta.json` (§3.7) |
| 2. Invio run + classifiche globali | 29-30 | `runs_log.jsonl`, `score`, `content_version` |
| 3. Seme giornaliero | 31 | generazione deterministica, passo 2 |
| 4. Missioni | 32-33 | eventi del log, passo 2 |
| 5. Collezione e bestiario online | 34 | `items.json`, `enemies.json`, passo 1 |
| 6. Gacha cosmetico | 35-36 | `currency_ledger`, skin via shader, passo 5 |
| 7. Mercato e scambio doppioni | 37 | passo 6 |
| 8. Clan | 38-39 | passi 2, 4 |
| 9. Coop asincrona (fantasma) | 40-41 | passo 3 |
| 10. Coop online a 2 | 42-48 | tutto il resto; da decidere allora se farla |

---

## 6. Rischi e domande aperte per Salvatore

| # | Rischio / domanda | Raccomandazione |
|---|---|---|
| 1 | **L'arma.** Un Isaac-like corpo a corpo è più raro e più "Ferruccio", ma chi arriva da Isaac può sentirlo lento. La scintilla è un oggetto o la base? | **Deciso il 1° novembre (versione 1.1): la scintilla è la base** (direzione separata dal movimento, 2,73 colpi/s, tutto il meccanismo di oggetti di Isaac in `oggetti.md`), l'affondo è il colpo forte a contatto (3× il Danno). Resta la porta della settimana 2 con la domanda unica ai tester: se la scintilla rende l'affondo inutile, la leva è il 3× (→ 4×) o la portata, non la cadenza (le penalità ×0,42 / ×0,51 / ×1/3 sono tarate su 2,73). |
| 2 | **Vista a tre quarti o zenitale?** La zenitale vera richiederebbe ridisegnare tutto il cast dall'alto. | Tre quarti come Isaac (§4.4): i pezzi esistenti funzionano, il model sheet ha già le 3 viste. Confermare guardando il prototipo della settimana 1 con Ferruccio di fronte schiacciato dell'8%. |
| 3 | **Pipeline arte: pezzi o video?** La memoria del 15 ottobre dice video per le animazioni; la vista dall'alto cambia le pose. | Pezzi + molla del rig per idle/affondo/scatto (gratis), video solo per camminata fronte/retro e balzo del gatto se il rig non regge. Prova di 1 giornata nella settimana 2; i crediti Gemini/Grok finiscono spesso: preparare i 3 prompt di §4.5 prima. |
| 4 | **Stesso progetto o progetto nuovo?** Il filtro di export potrebbe non bastare a scendere sotto i 60 MiB. | Stessa repo, preset "Web Notte" con `exclude_filter`, misura del pck già alla settimana 2 (stanza singola) e non alla 13. Piano B pronto: script di estrazione in `E:/gioco/ferruccio-notte/`, 1 giornata. |
| 5 | **Ore reali.** 380 h sono il caso buono; il giudice prudente stimava 550 h per NOTTE senza innesti. Quante ore a settimana sono davvero disponibili? | Confermare le 25-30 h. Sotto le 20 h, spostare l'MVP alla settimana 18 e applicare subito la lista di taglio (§4.3) a partire dai champion e dalla Caserma. |
| 6 | **Telefono subito o dopo?** Il touch e la VRAM dei telefoni condizionano arte e layout. | Desktop prima (mouse/tastiera/pad), ma il test di prestazioni su un Android medio parte dalla settimana 2 e il budget VRAM (§3.6) vale dal primo fondale. Touch alla settimana 11-12. |
| 7 | **Metroidvania: congelare o continuare in parallelo?** | Congelare con un tag git e una voce nel menu. Ogni ora sul platform è un'ora tolta al roguelike; i sistemi migliorati nel roguelike (oggetti, token, rig) possono tornare indietro dopo. |
| 8 | **Hosting e nome.** itch.io basta per l'MVP ma non è un hub; "Una Notte a Caserta" è un titolo di lavoro. | itch.io fino alla Parte 2, poi Cloudflare Pages + R2 o Supabase Storage sullo stesso dominio dell'hub. Decidere il titolo definitivo prima del post pubblico della settimana 14 (il nome entra negli id delle skin e nelle classifiche). |

---

## Appendice A — Schema di `items.json` (una voce)

Lo schema completo (lista di operazioni tipizzate, gruppi moltiplicativi, fusioni, anti-sinergie con `fix_for`, filtri per personaggio, file gemelli `weapons.json` / `flags.json` / `fusions.json` / `pools.json`, come il codice lo applica e lo script di coerenza) è in **`oggetti.md` §6**. La voce minima:

```json
{
  "id": "punzone_gf",
  "name": "Punzone G.F.",
  "lore": "Le iniziali di Gaetano battute nel ferro. La pietra le ricorda.",
  "kind": "passive",
  "phase": "mvp",
  "pools": {"ricordo": 1.0, "pegni": 0.5, "boss": 0.5},
  "quality": 3,
  "tags": ["lore", "gaetano", "danno"],
  "effects": [
    {"op": "add", "stat": "damage", "value": 1.5},
    {"op": "trigger", "when": "while", "if": {"target_tag": "pietra"}, "per": "shot",
     "do": [{"op": "flat", "stat": "damage", "value": 2.0, "phase": "post"}]}
  ],
  "unlock": "pietra_30",
  "icon": "res://assets/art/items/pietra_gf.png",
  "added_in": 1
}
```

Un attivo usa `{"op": "active", "charge": 6, "effect": "hammer_area", "params": {...}}`; un sostituto d'arma `{"op": "weapon", "id": "raggio_velo"}` con priorità, forma e flag innate in `weapons.json`; un multi-colpo `{"op": "count", "add": 1, "dmg_mult": 0.8, "cancels_penalty": true}`; ogni `mul` dichiara il suo `group`.

## Appendice B — Una riga di `runs_log.jsonl`

```json
{"run_id":"7f3c...","content_version":3,"seed":"KQ7M2ZVB","character_id":"ferruccio","started_at":"2026-12-02T21:14:05Z","duration_s":712,"result":"died","floor_reached":3,"rooms_cleared":21,"killed_by":"custode","items":[{"id":"lucciole_villa","floor":1,"room_type":"ricordo"},{"id":"occhi_gatto","floor":1,"room_type":"boss"}],"bosses":[{"id":"gatto_quattro_canti","time_s":52,"damage_taken":1},{"id":"madre_marmo","time_s":81,"damage_taken":2}],"damage_taken":9,"pawn_shop_used":true,"story_vars":{"tonino":"restituito"},"score":4760,"souls_earned":9,"platform":"web","build":"0.3.1"}
```

## Appendice C — Un layout di stanza (`rooms/piazza/piazza_n_004.json`)

```json
{
  "id": "piazza_n_004",
  "theme": "piazza",
  "difficulty": "media",
  "weight": 1.0,
  "grid": [
    ".............",
    "..#.......#..",
    "...e:gatto...",
    ".O....c....O.",
    "...e:vespa...",
    "..#...w...#..",
    "............."
  ]
}
```
