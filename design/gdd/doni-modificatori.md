# Doni e modificatori

> **Status**: Draft
> **Author**: systems-designer (sessione autonoma; `game-designer`, `creative-director`, `economy-designer`, `qa-lead`, `art-director` non consultati — Solo mode. Rivedere a mano prima della produzione)
> **Last Updated**: 2026-11-07
> **Last Verified**: 2026-11-07
> **Implements Pillar**: 3 Il bottino ha un volto · 4 Fatto di ombra e luce (tramite Principio B dell'art bible: oro = dono generico, azzurro = ricordo con volto) · 1 Leggibile al buio (ogni dono si legge in una riga e in una sagoma)

## Summary

I doni sono gli oggetti passivi della notte: una lista di modificatori su statistiche nominate, più
eventuali iscrizioni ai ganci del combattimento, più dei tag che li fanno comporre tra loro. Un dono non
contiene mai codice: è una riga di dati. Quindici doni sono d'oro (strumenti del fabbro, fili del Velo,
seta di San Leucio); cinque sono ricordi azzurri, legati a una persona della trama. Questo documento
definisce il modello dati, l'ordine di calcolo, le sinergie dichiarative, il pool, il piedistallo e il
catalogo iniziale di 20 doni (12 nell'MVP).

> **Quick reference** — Layer: `Feature` · Priority: `MVP` · Key deps: `Combattimento, Controllo di Ferruccio`

## Overview

Ferruccio parte nudo: nessun dono, le statistiche base di `controllo-ferruccio.md` e
`combattimento.md`. Lungo la notte raccoglie doni da tre canali: il **piedistallo** nella bottega (stanza
del tesoro), il **banchetto di Tonino** (si comprano con le monete di luce, vedi `economia.md`) e le
**anime** dei boss e delle stanze-ricordo (i ricordi). Ogni dono raccolto entra in una lista; a ogni
cambiamento della lista il motore ricalcola le statistiche nominate con una sola funzione (somme, poi
moltiplicatori, poi clamp) e rivaluta le sinergie, che sono righe di una tabella. Il combattimento e il
controllo leggono il valore già calcolato e non sanno quali doni lo hanno prodotto: il contratto della
regola 9 di `combattimento.md` (statistiche nominate e cinque ganci) è l'unica porta. I ricordi sono doni
con una faccia: tenuti, danno un bonus; restituiti (decisione del sistema `ricordi-scelta`), spariscono
e fissano un flag della trama.

## Player Fantasy

Costruire la propria spada notte dopo notte (pilastro Expression del concept) senza leggere un manuale: ogni
dono si capisce da una sagoma e da una riga sul cartiglio, e la scoperta è l'incastro tra due doni che
nessuno ha spiegato (scintilla + catena). I doni d'oro sono arnesi, fili e seta: oggetti utili, senza volto.
I ricordi azzurri sono diversi per costruzione: portano il nome di qualcuno, danno forza finché li
tieni, e il giocatore sa che esiste un modo di perderli. Test del pilastro 3: tra un «+20% danno» e «il
medaglione di Rosa: +1 danno finché non lo restituisci a Tonino» si sceglie il secondo; per questo il
medaglione dà più di un dono d'oro di pari rarità.

## Detailed Design

### Core Rules

1. **Un dono è dati.** Un dono è una riga di `contenuti/doni/catalogo.json`. Il motore ha un solo
   calcolatore di statistiche, un solo dispatcher di ganci, un solo valutatore di sinergie. Non esiste
   un ramo di codice per un dono specifico; se un effetto non si esprime con i campi sotto, si estende il
   vocabolario (regola 5) e lo si estende per tutti, non per uno.

2. **Modello dati di un dono.**

   | Campo | Tipo | Valori | Significato |
   |---|---|---|---|
   | `id` | stringa | slug unico | identificatore stabile (salvataggi, test) |
   | `nome` | stringa | ≤ 28 caratteri | titolo sul cartiglio |
   | `categoria` | enum | `strumenti` · `fili` · `seta` · `ricordi` | famiglia; `ricordi` implica alone azzurro |
   | `rarita` | enum | `comune` · `raro` · `prezioso` · `unico` | peso di estrazione e moltiplicatore di prezzo; `unico` = ricordo, non pesato e non in vendita |
   | `mvp` | bool | — | incluso nella build MVP |
   | `modificatori` | lista | `{statistica, operazione, valore}` | vedi regola 4 |
   | `ganci` | lista | `{evento, probabilita, ricarica_ms, max_per_stanza, effetto, parametri}` | vedi regola 5; può essere vuota |
   | `tag` | lista di stringhe | dal vocabolario dei tag (regola 6) | per le sinergie |
   | `sagoma` | oggetto | `{tipo, forma}` | `tipo` = `geometrica` (oro) o `profilo` (azzurro) |
   | `cartiglio` | stringa | ≤ 52 caratteri | l'unica riga sotto il nome |
   | `piano_min` | int | 1–5 | piano più basso in cui può comparire nei canali pesati |
   | `piano_fisso` | int o null | 1–5 | solo ricordi: il piano in cui compare (stanza-ricordo o boss) |
   | `canale` | lista di enum | `piedistallo` · `banchetto` · `boss` · `stanza-ricordo` · `narrativo` | da dove può arrivare |
   | `sblocco` | stringa o null | id di uno sblocco della Fucina | null = nel pool dall'inizio |
   | `richiede_flag` | `{flag, valore}` o null | uno dei sei flag di `trama/README.md` | il dono compare solo se il flag ha quel valore |
   | `escludi_se_flag` | `{flag, valore}` o null | idem | il dono scompare dal pool se il flag ha quel valore |
   | `peso` | float | 0,5–2,0 (default 1,0) | bias interno alla rarità |
   | `scelta` | oggetto o null | vedi regola 12 | solo ricordi: interfaccia con `ricordi-scelta` |
   | `fonte` | stringa | id di `storia.json › oggetti`, oppure `generico` | ancoraggio al mondo (vedi tabella canon) |

   Esempio di riga (valori in notazione JSON, con punto decimale):

   ```json
   { "id": "acciarino", "nome": "Acciarino", "categoria": "strumenti", "rarita": "raro", "mvp": true,
     "modificatori": [],
     "ganci": [ { "evento": "su_colpo", "probabilita": 0.20, "ricarica_ms": 400, "max_per_stanza": null,
                  "effetto": "scintilla", "parametri": { "n": 1, "danno": 1 } } ],
     "tag": ["scintilla", "fuoco"], "sagoma": { "tipo": "geometrica", "forma": "triangolo" },
     "cartiglio": "A volte un colpo fa scintille.", "piano_min": 1, "piano_fisso": null,
     "canale": ["piedistallo", "banchetto"], "sblocco": null, "richiede_flag": null,
     "escludi_se_flag": null, "peso": 1.0, "scelta": null, "fonte": "generico" }
   ```

3. **Registro delle statistiche nominate.** I doni toccano solo statistiche di questa tabella. I valori
   base vengono dai due GDD di riferimento; «Clamp» è il limite del valore effettivo finale; «Π cap» è il
   limite del prodotto cumulato dei moltiplicatori; «Per dono» è l'intervallo ammesso per un singolo
   moltiplicatore (il validatore dei dati rifiuta un dono fuori intervallo). Dove i due GDD danno solo un
   Safe Range e nessun clamp esplicito, il Safe Range è usato come clamp (da confermare: Open Questions).

   | Statistica | Base | Clamp min–max | Operazioni ammesse | Per dono (moltiplica) | Π cap | Fonte del limite |
   |---|---|---|---|---|---|---|
   | `danno` | 1 | 1–5 | somma, moltiplica | 0,8–2,0 | 0,8–2,0 | combattimento (mod 0,8–2,0); clamp 5 definito qui (vedi Formulas) |
   | `portata` (px) | 70 | 56–96 | somma, moltiplica | 0,8–1,3 | 0,8–1,3 | Safe Range combattimento |
   | `arco_f` (°) | 110 | 90–140 | somma | — | — | Safe Range combattimento |
   | `t_startup_f` (ms) | 80 | 50–120 | somma, moltiplica | 0,7–1,3 | 0,7–1,4 | Safe Range combattimento |
   | `t_recupero_f` (ms) | 160 | 100–260 | somma, moltiplica | 0,7–1,3 | 0,65–1,5 | Safe Range combattimento |
   | `molt_f3` | 1,5 | 1,2–2,0 | somma | — | — | Safe Range combattimento |
   | `t_finestra_p` (ms) | 180 | 140–300 | somma | — | — | combattimento: «somme dei doni, massimo 300» |
   | `molt_controcolpo` | 2,0 | 1,5–3,0 | somma | — | — | Safe Range combattimento |
   | `molt_affondo` | 2,5 | 2,0–3,0 | somma | — | — | Safe Range combattimento |
   | `d_affondo` (px) | 120 | 90–180 | somma | — | — | Safe Range combattimento |
   | `t_carica` (ms) | 400 | 300–700 | somma | — | — | Safe Range combattimento |
   | `danno_riflesso` | 2 | 1–4 | somma | — | — | Safe Range combattimento |
   | `spinta_f` (px/s) | 160 | 100–400 | somma | — | — | Safe Range combattimento |
   | `v_base` (px/s) | 220 | 150–330 | moltiplica | 0,7–1,5 | 0,6–1,4 | controllo: clamp 150–330, mod 0,7–1,5 |
   | `d_scatto` (px) | 180 | 112–308 | moltiplica | 0,8–1,4 | 0,7–1,5 | controllo: output 112–308, mod 0,8–1,4 |
   | `cariche_scatto` | 1 | 1–3 | somma | — | — | Safe Range controllo |
   | `maschere_max` | 5 | 3–8 | somma | — | — | Safe Range controllo |
   | `t_invuln` (ms) | 800 | 500–1200 | somma, moltiplica | 0,8–1,5 | 0,8–1,5 | Safe Range controllo |
   | `armatura` | 0 | 0–1 | imposta, somma | — | — | definita qui (vedi sotto) |

   Due statistiche non sono nel contratto di `combattimento.md` regola 9 e vanno ratificate dai due GDD
   (Open Questions): `armatura` (0 o 1; con 1 il `danno_colpo` subito è ridotto di 1, minimo 1, come già
   scritto in `controllo-ferruccio.md` Formulas) e l'operazione `imposta` (usata solo per `armatura`).
   `t_scatto` (durata e invulnerabilità dello scatto) non è modificabile, per decisione di `controllo`.

4. **Operazioni e ordine di applicazione.** Per ogni statistica `s`, in quest'ordine:
   1. **imposta**: se esiste almeno un `imposta` su `s`, il suo valore sostituisce la base. Se ce ne sono
      più d'uno vince quello del dono raccolto per ultimo (a parità di istante, quello con `id` minore
      in ordine alfabetico). Gli `imposta` non si sommano.
   2. **somma**: si aggiungono alla base (o al valore imposto) tutte le somme, nell'unità della
      statistica (ms, px, punti).
   3. **moltiplica**: si calcola il prodotto di tutti i moltiplicatori, lo si blocca nel Π cap della
      statistica, e lo si applica al risultato del passo 2. Quindi `(base + Σsomme) × Π`, mai
      `base × Π + somme`.
   4. **clamp**: il risultato è bloccato nel Clamp della statistica.
   5. **arrotondamento**: le statistiche in ms e le statistiche intere si arrotondano a intero (mezzo in
      su); `px`, `px/s` e i moltiplicatori restano float. `danno` resta float: il `floor` lo applica
      solo `danno_colpo` in `combattimento.md`.

   I modificatori che arrivano da un dono, da una sinergia (regola 6) o da un bonus temporaneo (regola 5)
   entrano **nella stessa lista**: sono soggetti agli stessi cap e clamp. Somme e prodotti sono
   commutativi: l'ordine di raccolta cambia il risultato solo per `imposta`.

5. **Ganci.** Un dono si iscrive a un evento con un effetto parametrico. Gli eventi sono i cinque di
   `combattimento.md`: `su_colpo` (una volta per nemico colpito), `su_uccisione` (una per nemico
   ucciso), `su_parata` (una per attaccante parato), `su_affondo` (una per affondo rilasciato, al
   primo nemico colpito; se nessuno è colpito, nessun evento), `su_danno_subito` (solo se il danno
   effettivo è > 0; non scatta su danno parato o ignorato in Scatta). Il vocabolario degli effetti è
   chiuso, scritto una volta nel motore:

   | Effetto | Parametri | Cosa fa |
   |---|---|---|
   | `scintilla` | `n`, `danno`, `rimbalzi` (0), `raggio_rimbalzo_px` (120), `ventaglio_gradi` (60 se n > 1) | lancia `n` piccoli proiettili dal bersaglio (o da Ferruccio se il bersaglio è lui) |
   | `catena` | `n_bersagli`, `raggio_px`, `danno` | danno ai `n_bersagli` nemici più vicini al bersaglio, entro il raggio |
   | `onda` | `raggio_px`, `danno`, `stordisce_ms` | area circolare centrata sul bersaglio |
   | `bonus_temporaneo` | `statistica`, `operazione`, `valore`, `durata_ms` | aggiunge un modificatore alla lista per la durata; stesso (dono, statistica): si rinnova la durata, non si somma |
   | `cura` | `maschere` | ripristina maschere correnti, fino a `maschere_max` |
   | `ricarica_scatto` | `cariche` | ripristina cariche di scatto, fino a `cariche_scatto` |

   Regole di attivazione: a ogni evento, per ogni iscrizione, si tira `probabilita` con il generatore
   `rng_doni` (seed della notte, deterministico); l'effetto parte solo se sono passati `ricarica_ms` dall'ultima
   volta e `max_per_stanza` (se non null) non è esaurito. **Il danno degli effetti dei ganci è il numero
   scritto nei parametri: non è scalato da `danno`** (evita che i doni di danno rendano ovunque
   esplosive le scintille). **Profondità 1**: un effetto prodotto da un gancio non genera eventi di
   gancio (una scintilla che uccide un nemico non fa scattare `su_uccisione`). Budget:
   `max_proiettili_attivi` = 24, `max_effetti_gancio_frame` = 6; oltre, gli effetti sono scartati
   in ordine di iscrizione inversa (ultimo iscritto, primo scartato).

6. **Tag e sinergie dichiarative.** Il vocabolario dei tag è chiuso: `scintilla`, `fuoco`, `catena`,
   `ferro`, `filo`, `seta`, `scatto`, `parata`, `ricordo`. Una sinergia è una riga di
   `contenuti/doni/sinergie.json`: due tag diversi e un effetto. È attiva se il giocatore tiene **due doni
   distinti**, uno con il primo tag e uno con il secondo (un solo dono con entrambi i tag non basta).
   L'effetto può essere, in combinazione: **modificatori** (entrano nella lista della regola 4),
   **param_extra** (cambiano un parametro di tutti gli effetti di un certo tipo posseduti), **ganci_extra**
   (iscrizioni aggiuntive a un evento). Una sinergia è attiva **una volta sola**, qualunque sia il numero
   di doni che portano i tag. Si rivalutano tutte a ogni cambio della lista dei doni; lo stato attivo
   non è salvato. Il validatore rifiuta sinergie a più di due tag.

   | Id | Nome | Tag A | Tag B | Effetto |
   |---|---|---|---|---|
   | `S1` | Scintille a catena | `scintilla` | `catena` | param_extra: ogni effetto `scintilla` posseduto ha `rimbalzi` +2 |
   | `S2` | Ferro rovente | `fuoco` | `ferro` | modificatore: `molt_f3` somma +0,2 |
   | `S3` | Trama fitta | `filo` | `seta` | modificatore: `t_invuln` somma +100 |
   | `S4` | Scintille calde | `scintilla` | `fuoco` | param_extra: ogni effetto `scintilla` posseduto ha `danno` +1 |
   | `S5` | Passo di seta | `scatto` | `seta` | modificatore: `d_scatto` moltiplica ×1,10 |
   | `S6` | Parata scintillante | `parata` | `scintilla` | ganci_extra: `su_parata` → `scintilla` {n 1, danno 1}, probabilità 1,0 |

7. **Pool, canali e sblocchi.** Il pool di un piano `p` è l'insieme dei doni **eleggibili**: `mvp` o
   build piena; `piano_min ≤ p`; `sblocco` null oppure acquistato alla Fucina (profilo); `richiede_flag`
   soddisfatto e `escludi_se_flag` non soddisfatto (flag letti dallo stato narrativo **alla generazione
   del piano**, non dopo); non già raccolto in questa notte; non già offerto in questo piano; non nella
   lista `ricordi_restituiti` del profilo (regola 12). I doni `unico` non sono nel pool pesato: arrivano
   solo dal loro `piano_fisso` (boss o stanza-ricordo) o dal canale `narrativo`.
   - **Estrazione a due stadi** (formule in Formulas): si sceglie la classe di rarità tra quelle non
     vuote, con peso `W_r(p)`; poi si sceglie un dono nella classe in modo uniforme (pesato da `peso`).
     La rarità è così una leva indipendente dalla taglia del catalogo: aggiungere 40 doni comuni non
     rende più rari i preziosi.
   - **Rimozione dopo la raccolta**: un dono raccolto esce dal pool per il resto della notte. Un dono
     offerto e non preso (il secondo piedistallo, uno slot del banchetto non comprato) **resta nel pool**
     per i piani successivi, ma non può ricomparire nello stesso piano.
   - **Pool esaurito**: se una classe è vuota, si rinormalizzano le altre; se il pool è vuoto, il
     piedistallo o lo slot dà il **sostituto** `fallback_pool_vuoto` (dati: un cuore se maschere < max,
     altrimenti 10 monete).
   - **Sblocchi dalla Fucina**: i doni con `sblocco` non null entrano nel pool dal piano `piano_min`
     dopo l'acquisto alla Fucina del Ricordo (costi e ordine in `economia.md`). Nell'MVP non esiste la Fucina
     e i 12 doni dell'MVP sono tutti con `sblocco` null.

8. **Piedistallo nella bottega.** La stanza del tesoro (bottega) ha un piedistallo con un dono; **dal
   piano 3 ne ha due** (`piano_piedistallo_doppio` = 3), estratti distinti e senza reinserimento. Prendere
   uno rende l'altro inerte (la sagoma si spegne in inchiostro, non è più interagibile). Il dono sul
   piedistallo è gratuito. Avvicinandosi a meno di `r_anteprima` (96 px) compare il cartiglio in anteprima
   (nome e riga) di quel dono, così si può confrontare senza prenderlo. Un dono del piedistallo non è
   mai un `unico`.

9. **Banchetto.** Lo slot «dono» del banchetto estrae con le stesse regole del piedistallo (distinto dai
   doni già offerti nel piano) e ha un prezzo in monete (formula in Formulas; tabella e slot cuore e
   consumabile in `economia.md`). I consumabili usano lo stesso modello dati di un dono con in più
   `durata_stanze`; si applicano all'acquisto e scadono dopo quel numero di stanze di combattimento ripulite.

10. **Raccolta e cartiglio.** Un dono sul piedistallo si raccoglie con il tasto **interagisci** (GDD
    `controllo-ferruccio.md` regola 9) a distanza ≤ `r_interagisci` (56 px) dal centro, negli stati Fermo,
    Cammina e Recupero scatto. Alla pressione: il dono entra nella lista nello stesso frame, le
    statistiche sono ricalcolate, compare il **cartiglio**: fondo inchiostro all'85%, bordo oro al 60% più
    bruno (azzurro per i ricordi), nome in crema, una riga in carta `#c98a3c` (palette HUD dell'art bible).
    Il cartiglio dura `t_cartiglio` (3000 ms), **non mette in pausa il gioco** e non blocca l'input
    (anti-pilastro: niente finestre che fermano la run). Un secondo cartiglio sostituisce il primo.
    Se tutte le statistiche toccate dal dono sono già al clamp, il cartiglio aggiunge sotto una seconda
    riga «Già al massimo.» (knob `avviso_cap`).

11. **HUD dei doni raccolti.** I contenuti richiesti a `design/ux/hud.md` (che decide posizione e misure):
    una fila di sagome, una per dono, in ordine di raccolta, `lato_icona_hud` 28 px, fino a 10 per
    riga, righe aggiuntive sotto. I ricordi hanno l'alone azzurro e sono i soli dell'HUD con un
    contorno luminoso. Ogni sinergia attiva si mostra con un filo d'oro sottile e a bassa opacità tra le
    due sagome che la attivano (grammatica dei fili dell'art bible: più sottile e meno opaco di una
    moneta). In pausa, l'elenco dei doni mostra nome e riga, e sotto l'elenco delle sinergie attive con il
    loro effetto. I consumabili attivi sono piccole sagome con il numero di stanze rimaste.

12. **Interfaccia con `ricordi-scelta` (non progettata qui).** Un ricordo ha il campo `scelta`:
    `{ "sistema": "ricordi-scelta", "id_scena": <id di scena di storia.json>, "flag": <flag>,
    "valore_restituzione": <valore> }`, oppure `null` per un ricordo **senza scelta** (azzurro per il
    volto, ma non restituibile). Contratto:
    - Il ricordo **tenuto** ha i suoi modificatori e ganci attivi come ogni altro dono.
    - Quando `ricordi-scelta` decide che il giocatore lo **restituisce**, chiama
      `rilascia(id_dono, "restituito")`. Il motore dei doni: toglie il dono dalla lista, ricalcola, cancella i
      `bonus_temporaneo` nati da quel dono, aggiunge l'id a `ricordi_restituiti` nel profilo (non
      compare mai più nei pool). **Il flag lo scrive `ricordi-scelta` tramite `stato-narrativo`**, mai i
      doni. Il motore dei doni non decide quando e come si apre la finestra di scelta.
    - La morte fa perdere il dono come ogni dono della notte, senza scrivere nulla: il ricordo non
      restituito può riapparire alla notte successiva dal suo boss o dalla sua stanza-ricordo.
    - `escludi_se_flag` rimuove dal pool un ricordo la cui scelta è già decisa (esempio: Medaglione di
      Rosa con `tonino_ricordo=restituito`). Cosa succede se la scelta è `negato` è una domanda aperta.

### Catalogo iniziale (20 doni)

Convenzioni: modificatori scritti `statistica operazione valore` (somma in unità della statistica,
moltiplica come fattore). «Sagoma» segue il Principio B: oro = forma geometrica senza volto;
azzurro = profilo dell'oggetto dentro l'anima. Per la leggibilità daltonica (art bible sezione 4) le forme
d'oro **evitano il disco** (moneta) e il **rombo** (scintilla) e non ripetono mai una forma. Le righe del
cartiglio descrivono solo l'effetto o ciò che `storia.json` dice dell'oggetto.

**A. Quindici doni d'oro** (MVP = ✔). Canali: `piedistallo`, `banchetto`; tutti `piano_min` 1 salvo indicato.

| # | Id | Nome | Cat. | Rar. | MVP | Modificatori | Ganci | Tag | Sagoma | Riga del cartiglio |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `mantice` | Mantice | strumenti | comune | ✔ | `t_recupero_f` moltiplica 0,88 | — | fuoco | trapezio | «Il fuoco soffia: il fendente si riprende prima.» |
| 2 | `lima` | Lima | strumenti | comune | ✔ | `portata` somma +6; `arco_f` somma +4 | — | ferro | rettangolo stretto | «Lama più lunga e più aperta.» |
| 3 | `acciarino` | Acciarino | strumenti | raro | ✔ | — | `su_colpo` p 0,20, ricarica 400 ms → `scintilla` {n 1, danno 1} | scintilla, fuoco | triangolo | «A volte un colpo fa scintille.» |
| 4 | `catena-della-chiusa` | Catena della chiusa | strumenti | raro | ✔ | `spinta_f` somma +40 | `su_uccisione` p 1,0 → `catena` {n_bersagli 1, raggio 120 px, danno 1} | catena, ferro | esagono | «Chi cade strattona il vicino.» |
| 5 | `grembiule-di-cuoio` | Grembiule di cuoio | strumenti | raro | ✔ | `armatura` imposta 1; `v_base` moltiplica 0,95 | — | ferro | pentagono | «Un colpo pesante toglie una maschera sola.» |
| 6 | `martello-da-fabbro` | Martello da fabbro | strumenti | prezioso | ✔ | `danno` somma +1; `v_base` moltiplica 0,90; `t_recupero_f` moltiplica 1,10 | — | ferro | T (due rettangoli) | «Colpisce il doppio, ma pesa.» |
| 7 | `filo-teso` | Filo teso | fili | comune | ✔ | `d_scatto` moltiplica 1,15 | — | filo, scatto | barra con due tacche | «Lo scatto arriva più lontano.» |
| 8 | `matassa-d-oro` | Matassa d'oro | fili | raro | ✔ | — | `su_uccisione` p 1,0 → `bonus_temporaneo` {`v_base`, moltiplica, 1,20, 2000 ms} | filo | spirale | «Ogni nemico abbattuto ti dà fiato: più veloce per 2 s.» |
| 9 | `filo-spezzato` | Filo spezzato | fili | comune | | — | `su_parata` p 1,0 → `scintilla` {n 3, danno 1, ventaglio 60°} | filo, scintilla, parata | barra spezzata | «Una parata sparge tre scintille.» |
| 10 | `rete-di-fili` | Rete di fili | fili | raro | | — | `su_affondo` p 1,0 → `onda` {raggio 80 px, danno 1, stordisce 400 ms} | filo | reticolo 3×3 | «L'affondo stordisce intorno al bersaglio.» |
| 11 | `spola-del-telaio` | Spola del telaio | seta | comune | ✔ | `t_finestra_p` somma +25 | — | seta, parata | navetta (lente appuntita) | «La parata resta aperta un soffio in più.» |
| 12 | `pantofole-di-seta` | Pantofole di seta | seta | comune | ✔ | `v_base` moltiplica 1,12 | — | seta | semicerchio | «Passo più leggero.» |
| 13 | `seta-grezza` | Seta grezza | seta | comune | ✔ | `t_invuln` somma +150 | — | seta | onda (sinusoide) | «Dopo un colpo, l'invulnerabilità dura di più.» |
| 14 | `nastro-di-seta` | Nastro di seta | seta | raro | | `cariche_scatto` somma +1; `d_scatto` moltiplica 0,90 | — | seta, scatto | arco aperto (270°) | «Una carica di scatto in più; scatto un po' più corto.» |
| 15 | `broccato` | Broccato | seta | prezioso | | `maschere_max` somma +1 | — | seta | rosone a sei petali | «Una maschera in più.» |

Doni non MVP dell'elenco A: #9 (`piano_min` 2), #10 (`piano_min` 2), #14 (`piano_min` 3), #15 (`piano_min` 4);
tutti e quattro con `sblocco` alla Fucina. Conteggi: 7 comuni (6 nell'MVP), 6 rari (4 nell'MVP), 2 preziosi (1
nell'MVP).

**B. Cinque ricordi azzurri.** Rarità `unico`, sagoma `profilo` con alone azzurro. Tutti con tag `ricordo`.

| # | Id | Nome | MVP | Fonte (`storia.json › oggetti`) | Modificatori | Ganci | Tag extra | Sagoma (profilo) | Canale e piano | Condizione | `scelta` | Riga del cartiglio |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 16 | `medaglione-di-rosa` | Medaglione di Rosa | ✔ | `medaglione-di-rosa` (Rosa) | `danno` somma +1 | — | — | medaglione ovale con anello e catenella | `boss`, piano fisso 1 (Gatto dei Quattro Canti; anima `anima-ricordo-rosa`) | `escludi_se_flag` `tonino_ricordo=restituito` | `{ id_scena: piazza-dante.scelta-tonino, flag: tonino_ricordo, valore_restituzione: restituito }` | «Il medaglione di Rosa. Colpisci più forte finché lo tieni.» |
| 17 | `punzone-gf` | Punzone G. F. | | `punzone` (Gaetano) | `molt_affondo` somma +0,3; `d_affondo` somma +20 | — | ferro | asta di punzone con testa piatta | `stanza-ricordo`, piano fisso 3 (Villa Comunale) | — | `null` | «Due lettere sul manico: G. F. L'affondo pesa di più.» |
| 18 | `fazzoletto-col-giglio` | Fazzoletto col giglio | | `fazzoletto-bianca` (Bianca) | `t_invuln` somma +200 | — | seta | quadrato con un angolo piegato e il giglio incompleto | `stanza-ricordo`, piano fisso 4 (San Leucio) | — | `null` | «Un giglio ricamato, incompleto.» |
| 19 | `lettera-di-agnese` | Lettera di Agnese | | `lettera-agnese` (Agnese) | `t_finestra_p` somma +20 | — | — | busta con sigillo tondo | `narrativo` (consegnata da `ricordi-scelta` / incontri), mai pesata | `richiede_flag` `tonino_ricordo=restituito` | `null` | «Scritta prima della maledizione.» |
| 20 | `lettera-di-mariella` | Lettera di Mariella | | `lettera-mariella` (Mariella) | `t_invuln` somma +100 | — | — | foglio piegato in tre | `stanza-ricordo`, piano fisso 2 (Corso Trieste) | `richiede_flag` `taddeo=perdonato` | `null` | «Scritta da Mariella a Taddeo, prima dell'incantesimo.» |

Nell'MVP c'è un solo ricordo con scelta: il Medaglione di Rosa (ipotesi del concept). I quattro
ricordi senza scelta sono azzurri perché hanno un volto (Principio B); non sono restituibili finché
`ricordi-scelta` non decide diversamente.

**Verifica di ancoraggio al mondo.** Gli oggetti con un nome di persona esistono in `trama/storia.json ›
oggetti` (la tabella degli oggetti: `trama/mappa-scene.md` ne dà solo il conteggio, 24) e sono ricordi
azzurri. I quindici doni d'oro non portano nomi di persona e non affermano fatti nuovi: gli arnesi
sono arnesi di fabbro generici, i fili e la seta richiamano i fili d'oro del Velo e la manifattura di
San Leucio (che esistono nella trama).

| Nome proposto dall'incarico | Esito | Motivo |
|---|---|---|
| Punzone G.F. | tenuto, ricordo #17 | esiste (`punzone`); ha le iniziali di Gaetano, quindi è azzurro, non d'oro |
| Fazzoletto col giglio | tenuto, ricordo #18 | esiste (`fazzoletto-bianca`) |
| Mantice, Lima, Catena della chiusa | tenuti, d'oro, `fonte: generico` | nessun nome di persona; «chiusa» è un nome generico, non un luogo della trama |
| Spola di Agnese | **rinominato** Spola del telaio (#11) | un oggetto «di Agnese» non esiste in `storia.json`; i telai sì |
| Scarpette di Bianca | **rinominato** Pantofole di seta (#12) | non esiste; i tre oggetti di Bianca sono fazzoletto, disegno, scatola musicale |
| Lanterna di Tonino | **non inclusa** | la lanterna compare solo nel testo di una scena, non nella tabella oggetti; sarebbe un ricordo azzurro di una persona viva e presente |
| Martello di Gaetano (esempio in `controllo-ferruccio.md`) | **rinominato** Martello da fabbro (#6) | non esiste; l'esempio di controllo va aggiornato (Open Questions) |

**Altri oggetti di `storia.json` valutati e non inclusi.** `sciarpa-rossa` (dono narrativo, abilita lo
scatto: gestita da `ricordi-scelta`; i numeri proposti da `controllo-ferruccio.md` sono `d_scatto`
×1,25 e una carica in più, canale `narrativo`, `richiede_flag` `agnese=risvegliata`);
`registro` e `giglio-oro` (oggetti di scelta o di boss, non bottino); `messaggio-taddeo` (prova
narrativa, non un bonus); `disegno` (non collocato dalla trama); `scatola-musicale` (Reggia, finale).
Restano candidati per i ricordi dei piani 3-5 quando si arriverà ai ~60 doni.

**Estremi del catalogo** (tutti i doni tenuti, sinergie incluse, nessun consumabile, nessun cap
raggiunto salvo dove indicato). Serve a verificare che i clamp siano una rete di sicurezza e non un
tetto che il catalogo sfonda a caso.

| Statistica | Minimo raggiungibile | Massimo raggiungibile | Clamp | Nota |
|---|---|---|---|---|
| `danno` | 1,0 | 3,0 (Medaglione +1, Martello +1) | 1–5 | il 5 lascia spazio a ~40 doni futuri |
| `v_base` | 188,1 px/s (0,90 × 0,95) | 295,7 px/s (Pantofole 1,12 × Matassa 1,20 = 1,344) | 150–330 | Π cap 1,4 non raggiunto |
| `d_scatto` | 162,0 px (0,90) | 227,7 px (1,15 × S5 1,10 = 1,265) | 112–308 | |
| `t_invuln` | 800 ms | **1350 → 1200 ms** (Seta grezza +150, Fazzoletto +200, Lettera di Mariella +100, S3 +100) | 500–1200 | unico clamp raggiunto dal catalogo |
| `t_finestra_p` | 180 ms | 225 ms (Spola +25, Lettera di Agnese +20) | 140–300 | |
| `t_recupero_f` | 140,8 ms (Mantice) | 176 ms (Martello); 154,9 con entrambi | 100–260 | |
| `cariche_scatto` | 1 | 2 | 1–3 | |
| `maschere_max` | 5 | 6 (Broccato; 7 con la miglioria della Fucina) | 3–8 | |
| `molt_affondo` | 2,5 | 2,8 (Punzone) | 2,0–3,0 | |

### States and Transitions

Stati di un dono (per notte):

| Stato | Condizione di ingresso | Condizione di uscita | Comportamento |
|---|---|---|---|
| Nel pool | eleggibile alla generazione del piano | estratto | invisibile |
| Offerto | estratto per un piedistallo o uno slot | raccolto/comprato, oppure fine del piano | sagoma visibile, anteprima in prossimità |
| Inerte | l'altro piedistallo è stato preso | — | sagoma d'inchiostro, non interagibile |
| Attivo | raccolto o comprato | restituito, scaduto (consumabile), fine della notte | modificatori, ganci e tag contribuiscono |
| Rilasciato | `rilascia(id, "restituito")` | — | tolto dalla lista; id in `ricordi_restituiti` |

Alla morte tutti gli Attivi sono azzerati con la notte; nel profilo restano gli sblocchi della Fucina e
`ricordi_restituiti`.

### Interactions with Other Systems

| Sistema | Dati in ingresso | Dati in uscita |
|---|---|---|
| Combattimento | eventi dei cinque ganci, richieste di `danno_colpo` | valori effettivi delle statistiche nominate; effetti dei ganci (proiettili, danno ad area, stordimento) |
| Controllo di Ferruccio | tasto interagisci, stato (Fermo/Cammina/Recupero) | valori effettivi di `v_base`, `d_scatto`, `cariche_scatto`, `maschere_max`, `t_invuln`, `armatura` |
| Economia | prezzo, stato del banchetto, fallback del pool | doni per gli slot del banchetto, eventi di acquisto |
| Ricordi con scelta | `rilascia(id, esito)` | ricordo tenuto, id di scena e flag da fissare |
| Stato narrativo | valori dei sei flag (lettura, alla generazione del piano) | — (non scrive mai flag) |
| Generazione dei piani | numero di piedistalli per piano, seed della notte | richiesta di estrazione per piedistallo e slot |
| Fucina del Ricordo | sblocchi acquistati | `piano_min` e `sblocco` dei doni in catalogo |
| Salvataggio e profilo | sblocchi e `ricordi_restituiti` | — |
| Boss | piano e anima del boss | il ricordo con `piano_fisso` = piano e canale `boss` |
| HUD | — | lista dei doni, sinergie attive, cartiglio, consumabili |
| Rendering | — | sagome d'oro e azzurre, alone, filo di sinergia |

## Formulas

The `valore_effettivo` formula is defined as:

`s = (imposta_s ≠ ∅ ? imposta_s : base_s) + Σ somma_i` ·
`Π = clamp(Π molt_i, Π_min_s, Π_max_s)` ·
`valore_s = round_s(clamp(s × Π, min_s, max_s))`

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| base_s | float | per statistica (tabella regola 3) | valore base dal data file di controllo o combattimento |
| imposta_s | float o ∅ | nel clamp della statistica | valore imposto dal dono raccolto per ultimo |
| somma_i | float | −400…+400 (ms), −100…+100 (px), −2…+2 (int) | somma di un modificatore (di un dono, sinergia o bonus temporaneo) |
| molt_i | float | per dono: 0,7–1,5 (0,8–2,0 per `danno`); mai ≤ 0 | moltiplicatore di un modificatore |
| Π_min_s, Π_max_s | float | per statistica (tabella regola 3) | limiti del prodotto cumulato |
| min_s, max_s | float | per statistica | clamp finale |
| round_s | funzione | mezzo in su (ms e int); identità (px, px/s, moltiplicatori) | arrotondamento di tipo |
| valore_s | float o int | min_s–max_s | valore effettivo consegnato a combattimento/controllo |

**Output Range:** sempre compreso tra `min_s` e `max_s` della statistica; mai fuori dal clamp,
qualunque sia il numero di doni. Minimo: tutti moltiplicatori al loro minimo e nessuna somma (o somme
negative); massimo: somme e moltiplicatori al massimo. Esempi di estremi estesi: `danno` va da 1 a 5;
`t_invuln` da 500 a 1200; `v_base` da 150 a 330. Nessun valore di output è inutilizzabile, perché
ogni limite è scelto dentro il Safe Range del sistema che lo consuma. **Attenzione, doppio conteggio:**
`combattimento.md` scrive `danno × … × Π(mod_danno_i)`; con questa formula il fattore `Π(mod_danno_i)`
**è già dentro** `valore_danno`. Il combattimento deve leggere `valore_danno` e **non** riapplicare i
moltiplicatori dei doni.
**Example:** `t_invuln`: Seta grezza +150, Fazzoletto col giglio +200, Lettera di Mariella +100,
sinergia S3 +100 → `s` = 800 + 550 = 1350; Π = 1; clamp 500–1200 → **1200 ms**.
Con moltiplicatori: `v_base` = 220 × (1,12 × 0,90 × 0,95) = 220 × 0,9576 = **210,7 px/s**.
Con somma e moltiplicatore insieme: `danno` con Medaglione (+1) e un dono di prova ×1,5 → (1 + 1) × 1,5 =
**3,0**; terzo fendente in controcolpo: floor(3,0 × 1,5 × 2,0) = **9**.

The `moltiplicatore_cumulato` formula is defined as:

`Π = clamp(Π molt_i, Π_min_s, Π_max_s)`

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| molt_i | float | 0,7–1,5 (0,8–2,0 `danno`) | moltiplicatori da doni, sinergie, bonus temporanei attivi |
| Π_min_s / Π_max_s | float | tabella regola 3 | limite di cumulo della statistica |
| Π | float | Π_min_s–Π_max_s | prodotto effettivamente applicato |

**Output Range:** da `Π_min_s` a `Π_max_s`; per `danno` da 0,8 (già con un solo dono ×0,8) a 2,0 (già con un
solo dono ×2,0 o con due ×1,5 = 2,25 → 2,0). Il cap esiste perché i prodotti crescono in fretta: tre doni ×1,3
darebbero 2,197.
**Example:** `v_base` con tre doni di prova ×1,3: prodotto 2,197 → cap 1,4 → 220 × 1,4 = **308 px/s**
(sotto il clamp di 330).

The `prezzo_banchetto` formula (stessa del contratto di `economia.md`, che è la fonte) is defined as:

`prezzo = floor( (base × rar_pct × (100 + inc_pct × piano) × (100 − sconto_pct) + 500000) / 1000000 )`

(aritmetica intera: evita gli errori dei float; equivale a `base × rarità × (1 + 0,15 × piano) × (1 − sconto)` arrotondato
a mezzo in su.)

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| base | int | 15 (dono) · 10 (cuore) · 8 (consumabile) | prezzo base in monete di luce |
| rar_pct | int | 100 comune · 180 raro · 300 prezioso | moltiplicatore di rarità in centesimi; cuore e consumabile usano 100 |
| inc_pct | int | 15 | incremento per piano in centesimi (0,15) |
| piano | int | 1–5 (fino a 8 con le espansioni) | piano corrente |
| sconto_pct | int | 0–30 | sconto del banchetto (migliorie della Fucina) |
| prezzo | int | 17–79 per i doni senza sconto | monete di luce |

**Output Range:** per un dono, da 17 (comune, piano 1) a 79 (prezioso, piano 5) senza sconto; con
sconto 30%, da 12 a 55. Mai ≤ 0 e mai sopra il tetto di monete (99).
**Example:** Rarità prezioso, piano 5: 15 × 300 × 175 × 100 = 78 750 000 + 500 000 = 79 250 000 / 1 000 000 →
floor = **79**. Comune, piano 1: 15 × 100 × 115 × 100 = 17 250 000 + 500 000 = 17 750 000 → **17**.

The `probabilita_estrazione` formula is defined as:

`W_r(p) = max(0, W0_r × (1 + d_r × (p − 1)))` ·
`P(classe r) = W_r(p) / Σ_{r' non vuota} W_r'(p)` ·
`P(i) = P(classe r_i) × (peso_i / Σ_{j ∈ classe r_i} peso_j)`

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| W0_r | float | comune 60 · raro 30 · prezioso 10 | peso base della classe al piano 1 |
| d_r | float | comune −0,10 · raro +0,10 · prezioso +0,30 | deriva del peso per piano oltre il primo |
| p | int | 1–5 | piano |
| peso_i | float | 0,5–2,0 (default 1,0) | bias del dono dentro la sua classe |
| P(i) | float | 0–1 | probabilità che il dono i sia estratto da una singola estrazione |

**Output Range:** `P(i)` va da 0 (dono non eleggibile) a 1 (unico dono eleggibile). Con le tre classi
piene e i valori di default, `Σ W_r(p)` vale sempre 100 (−6 + 3 + 3 = 0: le derive si compensano per
costruzione). Per una singola estrazione: comune da 36% a 60% di classe, raro da 30% a 42%, prezioso da 10% a 22%.
**Example:** pool MVP al piano 1 (6 comuni, 4 rari, 1 prezioso): P(classe) = 60%, 30%, 10%; ogni comune
60/6 = **10,0%**, ogni raro 30/4 = **7,5%**, il Martello **10,0%**. Dopo aver preso il Mantice: i comuni
sono 5, ciascuno 60/5 = **12,0%**. Pool completo al piano 5 (7/6/2): comune 36/7 = 5,14%, raro 42/6 = 7,0%,
prezioso 22/2 = **11,0%**.

The `sinergia_attiva` formula is defined as:

`attiva(S) = ∃ d1, d2 ∈ doni_tenuti : d1 ≠ d2 ∧ tagA(S) ∈ tag(d1) ∧ tagB(S) ∈ tag(d2)` (tagA ≠ tagB)

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| doni_tenuti | insieme | 0–20 doni (più i consumabili, che non hanno tag) | doni attivi |
| tagA(S), tagB(S) | stringhe | vocabolario dei 9 tag | tag richiesti dalla sinergia S |
| attiva(S) | bool | {0, 1} | la sinergia vale una volta, non una per coppia |

**Output Range:** booleano per sinergia; al massimo 6 sinergie attive nel catalogo iniziale.
**Example:** Acciarino (scintilla, fuoco) + Catena della chiusa (catena, ferro): S1 attiva
(scintilla da Acciarino, catena da Catena). S4 e S2 no: Acciarino da solo ha scintilla e fuoco ma serve un
secondo dono. Con in più il Mantice (fuoco): S4 attiva (scintilla da Acciarino, fuoco da Mantice) e S2
attiva (fuoco da Mantice, ferro da Catena).

The `attivazione_gancio` formula is defined as:

`parte = (rng_doni() < probabilita) ∧ (t − t_ultimo ≥ ricarica_ms) ∧ (max_per_stanza = null ∨ n_stanza < max_per_stanza) ∧ (origine_evento ≠ gancio)`

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| probabilita | float | 0–1 | probabilità per evento |
| ricarica_ms | int | 0–5000 | tempo minimo tra due attivazioni della stessa iscrizione |
| max_per_stanza | int o null | 1–20 | tetto per stanza |
| origine_evento | enum | `combattimento` · `gancio` | un evento nato da un effetto di gancio non attiva ganci (profondità 1) |
| parte | bool | {0, 1} | l'effetto viene eseguito |

**Output Range:** booleano; la frequenza media di un gancio non supera `1000 / ricarica_ms` attivazioni al secondo.
**Example:** Acciarino (p 0,20, ricarica 400 ms): terzo fendente su 6 nemici, 6 eventi `su_colpo` nello stesso
frame → al più **1** scintilla (la ricarica blocca le altre cinque); su 10 000 eventi distanziati più di 400 ms
si attende 2000 ± 130 scintille.

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| Il valore supera il clamp (`t_invuln` 1350) | il valore consegnato è 1200; il dono resta raccolto; l'eccedenza non si accumula (togliere il Fazzoletto riporta a 1150, non a 1000) | il clamp è sul risultato, non sulla lista; la lista resta la verità |
| Il prodotto supera il cap (tre ×1,3 su `v_base`) | Π = 1,4, poi il clamp finale; nessun errore | il cap rende il cumulo prevedibile |
| Dono che toglie più di quanto serve (moltiplicatore 0,5) | rifiutato dal validatore dei dati (fuori dall'intervallo per dono); come fixture di test: Π = max(0,5; Π_min) e poi clamp: `v_base` 0,5 → Π 0,6 → 132 → clamp **150** | rispetta il criterio di `controllo-ferruccio.md` (150, non 110) |
| `t_finestra_p` 320 | clamp a 300 | criterio di `combattimento.md` |
| Due `imposta` sulla stessa statistica | vince il dono raccolto per ultimo; il precedente non si somma | determinismo |
| `imposta` e somma sulla stessa statistica | prima imposta, poi la somma (armatura imposta 1 + somma +1 → 2 → clamp 1) | ordine fissato dalla regola 4 |
| Sinergia doppia: due doni con lo stesso tag (Acciarino e Filo spezzato, entrambi `scintilla`) + Catena della chiusa | S1 attiva **una** volta: `rimbalzi` +2, non +4 | la sinergia è dichiarativa e vale una volta |
| Un solo dono con entrambi i tag di una sinergia (Acciarino: scintilla + fuoco) | S4 non attiva | servono due doni distinti |
| Due sinergie diverse modificano la stessa statistica o lo stesso parametro | si sommano i modificatori nella lista comune e restano soggetti a cap e clamp; i `param_extra` dello stesso parametro si sommano | un solo calcolatore |
| Sinergia con `ganci_extra` su un evento che il dono già ascolta (Filo spezzato `su_parata` + S6) | due iscrizioni indipendenti, ognuna tira per sé; non si fondono | semplicità; il budget dei proiettili le limita |
| Si perde un dono (ricordo restituito) e una sinergia dipendeva da lui | la sinergia si rivaluta in quel frame e si spegne; i suoi modificatori escono dalla lista; i `bonus_temporaneo` del dono sono cancellati | stato derivato, mai salvato |
| `maschere_max` sale | stesso numero di maschere correnti in più (Broccato: 5/5 → 6/6) | un dono che dà una maschera la dà piena |
| `maschere_max` scende sotto le maschere correnti | le correnti si tagliano al nuovo massimo, minimo 1; mai una morte da dono | la perdita di un dono non uccide |
| `cariche_scatto` sale | ricarica subito una carica (Nastro di seta) | il dono si sente alla raccolta |
| Effetto di un gancio uccide un nemico | nessun `su_uccisione` (profondità 1); i punti e le monete però sì | evita catene infinite |
| Terzo fendente colpisce sei nemici | sei eventi `su_colpo` nello stesso frame; i ganci con ricarica scattano al più una volta | evita raffiche non leggibili |
| `su_affondo` senza bersagli | nessun evento, Rete di fili non scatta | la `onda` è centrata sul bersaglio |
| Superati 24 proiettili o 6 effetti per frame | gli ultimi iscritti sono scartati | prestazioni Canvas (rischio nel concept) |
| Pool esaurito per una classe | la classe vuota è saltata e le altre rinormalizzate | rarità indipendente dalla taglia |
| Pool completamente vuoto | `fallback_pool_vuoto`: cuore se maschere < max, altrimenti 10 monete | un piedistallo non resta mai vuoto |
| Un solo dono eleggibile per un piedistallo doppio | il piano 3 ha un solo dono sul piedistallo (non uno inerte) | non esiste una scelta finta |
| Il giocatore lascia la bottega senza prendere nulla | i doni offerti restano nel pool per i piani seguenti (non nello stesso) | solo la raccolta rimuove |
| Rientro in una bottega già visitata | lo stato si conserva: dono preso = piedistallo vuoto; l'altro è inerte | niente doppia raccolta |
| Un flag cambia a metà notte (si decide `taddeo`) | i pool già generati non cambiano; il piano successivo li rivaluta | determinismo del seed e leggibilità |
| Ricordo restituito | sparisce dalla lista, id in `ricordi_restituiti`, mai più nel pool; i ricordi che richiedono quel valore del flag (Lettera di Agnese) diventano eleggibili dalla generazione successiva | pilastro 2 |
| Morte con un ricordo in mano | si perde con la notte; nessun flag scritto; il ricordo può riapparire | la morte azzera la run, non le decisioni |
| Raccolta con interagisci durante Scatta o Colpito | ignorata, nessun buffer | coerente con lo scatto a 0 cariche in `controllo-ferruccio.md` |
| Due piedistalli entro `r_interagisci` | interagisce con il più vicino; a pari distanza, quello di sinistra | determinismo |
| Cartiglio mentre ne è già visibile un altro | sostituisce il precedente e riparte il timer | un solo cartiglio sullo schermo |
| Consumabile acquistato mentre ne è attivo uno uguale | la durata si rinnova, nessun cumulo | stesso comportamento di `bonus_temporaneo` |
| Valore `probabilita` > 1 o ricarica negativa nei dati | rifiutato dal validatore | dati sani |
| Dono d'oro con `scelta` non null | rifiutato dal validatore | solo i ricordi hanno scelta |

## Dependencies

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| Combattimento | This depends on Combattimento | statistiche nominate, `danno_colpo`, cinque ganci; per la regola 9 il combattimento non conosce i doni |
| Controllo di Ferruccio | This depends on Controllo | `v_base`, `d_scatto`, `cariche_scatto`, `maschere_max`, `t_invuln`; tasto interagisci; clamp |
| Economia | Economia depends on this | prezzo, slot del banchetto, fallback |
| Ricordi con scelta | Ricordi depends on this | `scelta`, `rilascia()`, `ricordi_restituiti` |
| Fucina del Ricordo | Fucina depends on this | `sblocco` dei doni |
| Stato narrativo | This depends on Stato | lettura dei flag per `richiede_flag` ed `escludi_se_flag` |
| Generazione dei piani | Generazione depends on this | numero di piedistalli, estrazioni con seed |
| Stanze e porte | Stanze depends on this | la bottega con il piedistallo |
| Boss | Boss depends on this | l'anima che contiene il ricordo di `piano_fisso` |
| Salvataggio e profilo | Salvataggio depends on this | sblocchi, `ricordi_restituiti` |
| HUD | HUD depends on this | lista dei doni, sinergie, cartiglio |
| Rendering a teatro delle ombre | Rendering depends on this | sagome d'oro e azzurre, alone |

## Tuning Knobs

Tutti i valori stanno in `contenuti/doni/catalogo.json`, `contenuti/doni/sinergie.json`,
`contenuti/doni/statistiche.json` e `contenuti/parametri/doni.json`; nessuno nel codice.

| Parameter | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|--------------|------------|-------------------|-------------------|
| `W0` comune / raro / prezioso | 60 / 30 / 10 | 40–70 / 20–40 / 3–20 | più preziosi, power creep | notti più piatte |
| `d_r` comune / raro / prezioso | −0,10 / +0,10 / +0,30 | −0,2…0 / 0…+0,2 / 0…+0,5 | i piani alti pagano di più | poca differenza tra piani |
| Clamp e Π cap per statistica | tabella regola 3 | dentro il Safe Range del GDD che la consuma | più potenza stackabile | stat bloccate presto |
| `peso` per dono | 1,0 | 0,5–2,0 | dono più frequente nella sua classe | più raro |
| `piano_piedistallo_doppio` | 3 | 2–4 | scelta anticipata | scelta ritardata |
| `r_interagisci` | 56 px | 40–80 | più facile prendere | rischio di raccogliere per errore |
| `r_anteprima` | 96 px | 64–140 | confronto più facile | decisioni al buio |
| `t_cartiglio` | 3000 ms | 1500–5000 | più lettura | più nascosto |
| `avviso_cap` | acceso | acceso/spento | feedback onesto | sorprese |
| `lato_icona_hud` | 28 px | 24–40 | più leggibile | più spazio per i doni |
| `max_proiettili_attivi` | 24 | 12–48 | più scintille | meno caos |
| `max_effetti_gancio_frame` | 6 | 3–12 | più reattività | costo ridotto |
| Probabilità e ricarica dei ganci | per dono | p 0,05–1,0; ricarica 0–2000 ms | effetti frequenti | rari |
| Valori dei modificatori per dono | catalogo | dentro l'intervallo «per dono» | doni più forti | più deboli |
| Valori delle sinergie | tabella regola 6 | stessi intervalli | scoperta premiata | scoperta ignorabile |
| `fallback_pool_vuoto` | cuore o 10 monete | 5–20 monete | — | — |

## Game Feel

### Impact Moments
| Impact Type | Duration (ms) | Effect Description | Configurable? |
|-------------|--------------|-------------------|---------------|
| Raccolta di un dono | 200 | brillio d'oro (o azzurro per i ricordi) sulla sagoma, la sagoma sale e si dissolve nell'HUD | Yes |
| Cartiglio | 3000 | compare dal basso, nome crema e riga carta; non ferma il gioco | Yes |
| Sinergia che si accende | 400 | il filo d'oro tra le due sagome dell'HUD si tende e si assesta | Yes |
| Restituzione di un ricordo | decisa da `ricordi-scelta` | la sagoma azzurra si stacca dall'HUD e sale | No |

### Feel Acceptance Criteria
- [ ] Un tester legge nome e riga di un dono nuovo senza fermarsi né aprire la pausa.
- [ ] Un tester riconosce un ricordo azzurro da un dono d'oro senza leggere il cartiglio.
- [ ] Nessun tester confonde la sagoma di un dono con una moneta o con una scintilla (nessun disco, nessun rombo).

## Acceptance Criteria

- [ ] **GIVEN** Ferruccio senza doni, **WHEN** si leggono `danno`, `v_base`, `t_finestra_p`, **THEN** valgono 1,0, 220 px/s e 180 ms.
- [ ] **GIVEN** il Medaglione di Rosa (somma +1) e un dono di prova con `danno` moltiplica 1,5, **WHEN** si legge `danno`, **THEN** vale (1 + 1) × 1,5 = 3,0 (non 1 × 1,5 + 1 = 2,5) e il terzo fendente in controcolpo fa floor(3,0 × 1,5 × 2,0) = 9.
- [ ] **GIVEN** il Grembiule di cuoio, **WHEN** un attacco pesante (danno 2) colpisce Ferruccio, **THEN** toglie 1 maschera; con attacco comune toglie 1; `armatura` vale 1.
- [ ] **GIVEN** Seta grezza, Fazzoletto col giglio, Lettera di Mariella e la sinergia S3 attiva, **WHEN** si legge `t_invuln`, **THEN** vale 1200 ms (non 1350).
- [ ] **GIVEN** due doni di prova che sommano `t_finestra_p` +70 ciascuno, **WHEN** si legge il parametro, **THEN** vale 300 (non 320).
- [ ] **GIVEN** un dono di prova `v_base` ×0,5, **WHEN** si legge `v_base`, **THEN** vale 150 px/s (non 110).
- [ ] **GIVEN** tre doni di prova `v_base` ×1,3, **WHEN** si legge `v_base`, **THEN** vale 308 px/s (Π bloccato a 1,4).
- [ ] **GIVEN** Pantofole di seta, Martello da fabbro e Grembiule di cuoio, **WHEN** si legge `v_base`, **THEN** vale 210,7 ± 0,1 px/s.
- [ ] **GIVEN** il pool MVP al piano 1, **WHEN** si calcolano le probabilità di una estrazione, **THEN** ogni comune ha 10,0%, ogni raro 7,5%, il Martello 10,0%, e la somma è 100%; dopo aver raccolto il Mantice ogni comune rimasto ha 12,0%.
- [ ] **GIVEN** il pool completo al piano 5, **WHEN** si calcola P(Broccato), **THEN** vale 11,0% e le tre classi sommano a W = 100.
- [ ] **GIVEN** un dono raccolto in una notte, **WHEN** si fanno 1000 estrazioni con seed diversi nella stessa notte, **THEN** quel dono non compare mai.
- [ ] **GIVEN** il piano 3, **WHEN** si entra nella bottega, **THEN** ci sono due piedistalli con due doni distinti, e dopo averne preso uno l'altro non è interagibile.
- [ ] **GIVEN** un dono a 50 px dal centro, **WHEN** si preme interagisci in stato Cammina, **THEN** entro 33 ms il dono è nella lista e il cartiglio mostra nome e una riga per 3000 ± 100 ms senza mettere in pausa il gioco.
- [ ] **GIVEN** Acciarino e Catena della chiusa tenuti, **WHEN** si valutano le sinergie, **THEN** S1 è attiva (rimbalzi +2); con in più il Filo spezzato la S1 resta attiva una sola volta (rimbalzi +2, non +4).
- [ ] **GIVEN** il solo Acciarino, **WHEN** si valutano le sinergie, **THEN** S4 non è attiva.
- [ ] **GIVEN** Acciarino (p 0,20, ricarica 400 ms) e 10 000 eventi `su_colpo` distanziati di 500 ms con seed fisso, **WHEN** si contano le scintille, **THEN** sono 2000 ± 130 e l'esito è identico a ogni esecuzione con lo stesso seed.
- [ ] **GIVEN** il terzo fendente su 6 nemici nello stesso frame con l'Acciarino, **WHEN** si contano le scintille, **THEN** è al più 1.
- [ ] **GIVEN** la Catena della chiusa e una catena che uccide un secondo nemico, **WHEN** il secondo nemico muore, **THEN** non parte una seconda catena.
- [ ] **GIVEN** il Medaglione di Rosa tenuto, **WHEN** `ricordi-scelta` chiama `rilascia("medaglione-di-rosa", "restituito")`, **THEN** `danno` torna a 1,0 nello stesso frame, l'id è in `ricordi_restituiti`, e il Medaglione non compare in nessuna notte successiva.
- [ ] **GIVEN** il Broccato raccolto con 5/5 maschere, **WHEN** si legge la vita, **THEN** è 6/6.
- [ ] **GIVEN** un prezzo di prezioso al piano 5, **WHEN** si calcola, **THEN** vale 79; un comune al piano 1 vale 17; con sconto 10% un comune al piano 1 vale 16.
- [ ] **GIVEN** il catalogo iniziale, **WHEN** lo si valida, **THEN** i doni sono 20 (15 d'oro, 5 ricordi), 12 hanno `mvp` vero, nessun dono d'oro ha un nome di persona né una `scelta`, ogni ricordo ha `fonte` presente in `storia.json › oggetti`, ogni forma d'oro è diversa dalle altre e nessuna è un disco o un rombo.
- [ ] Prestazioni: il ricalcolo di tutte le statistiche costa meno di 0,05 ms e avviene solo quando la lista cambia (mai a ogni frame); il dispatcher dei ganci con 20 nemici costa meno di 0,2 ms per frame.
- [ ] Nessun valore numerico di questo documento è nel codice: tutto nei file `contenuti/doni/` e `contenuti/parametri/doni.json`.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| **Granularità del danno.** Con `danno` base 1 e `floor` finale, un bonus frazionario (+0,5, ×1,25) non cambia il fendente 1 e 2: i bonus devono essere interi, e +1 raddoppia il danno. Due doni (Medaglione e Martello) bastano a triplicarlo. O si accetta, o `combattimento.md` porta il danno base a 2 e la vita dei nemici a ×2 | game-designer | prima del prototipo | — |
| **Output Range di `danno_colpo`.** `combattimento.md` dichiara 1–15; con il clamp di `danno` a 5 il massimo è 15 solo per i fendenti di combo (5 × 1,5 × 2,0); affondo in controcolpo può arrivare a 5 × 2,5 × 2,0 = 25 | game-designer | GDD combattimento | — |
| Ratificare `armatura` e l'operazione `imposta` nei GDD di controllo e combattimento; `danno` e `Π(mod_danno_i)` non vanno applicati due volte | game-designer | prima del prototipo | — |
| Gli esempi di `controllo-ferruccio.md` (Scarpette di Bianca, Martello di Gaetano) non esistono in `storia.json`: aggiornarli a Pantofole di seta e Martello da fabbro | game-designer | aggiornamento di controllo | — |
| Il Safe Range usato come clamp dove il GDD non ne dà uno (arco, portata, t_startup, ecc.) va confermato | game-designer | prototipo | — |
| Cosa vale il Medaglione di Rosa dopo `tonino_ricordo=negato`: resta nel pool come dono senza scelta, oppure sparisce? Proposta: resta tenibile senza finestra | ricordi-scelta | GDD ricordi-scelta | — |
| La Lettera di Agnese ha canale `narrativo`: chi la consegna, e quando (a ogni inizio di notte con `tonino_ricordo=restituito`, o al piano 4)? Il testo di `storia.json` dice «consegnata subito» | ricordi-scelta / narrative-director | GDD ricordi-scelta | — |
| I quattro ricordi senza scelta: possono avere una scelta propria in `ricordi-scelta`? Qui `scelta: null` | ricordi-scelta | GDD ricordi-scelta | — |
| `sciarpa-rossa`: dono narrativo, non nel catalogo di 20; i numeri di `controllo-ferruccio.md` (×1,25, +1 carica) sono provvisori e dipendono dalla domanda sullo scatto base | autore | prima del prototipo | — |
| Le righe del cartiglio sono testo di interfaccia, non battute della trama; l'autore ne approva il tono | narrative-director / autore | prima della produzione | — |
