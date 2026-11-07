# Generazione dei piani

> **Status**: Draft
> **Author**: level-designer (sessione autonoma; `game-designer`, `systems-designer`, `creative-director`, `narrative-director`, `qa-lead` non consultati — Solo mode. Rivedere a mano prima della produzione. Il generatore non è stato implementato né simulato: soglie e pesi sono punti di partenza, non risultati)
> **Last Updated**: 2026-11-07
> **Last Verified**: 2026-11-07
> **Implements Pillar**: 1 Leggibile al buio · 2 La notte ricomincia, la storia no

## Summary

Costruisce ogni piano di una notte: posa da 8 a 14 stanze su una griglia di celle 9×8 con un cammino
dall'ingresso al boss di lunghezza minima crescente, aggiunge bivi e vicoli ciechi, mette tesoro,
banchetto e stanza-ricordo in posizioni vincolate, a volte una stanza segreta, sceglie i modelli di
stanza fatti a mano e pre-estrae le ricompense. Tutto discende da un solo seme (mulberry32): lo
stesso seme dà sempre lo stesso piano, e il piano non dipende mai da ciò che il giocatore ha fatto
né da ciò che sa. Le regole di una singola stanza stanno in `stanze-porte.md`.

> **Quick reference** — Layer: `Feature` · Priority: `MVP` · Key deps: `Stanze e porte, Salvataggio (seme)`

## Overview

La notte ha cinque piani, uno per quartiere: Piazza Dante, Corso Trieste, Villa Comunale, San Leucio,
Reggia. Ogni piano è una piccola mappa di stanze come in *The Binding of Isaac*, ma meno caotica:
un cammino principale che cresce di piano in piano, qualche bivio, vicoli ciechi per le stanze
speciali, e un boss sempre in fondo, mai accanto all'ingresso. Le stanze non sono generate: sono
modelli disegnati a mano, scelti da un pool per tipo, piano, difficoltà e dimensione (anche doppie
2×1). Il generatore pesa la scelta per evitare ripetizioni nella stessa notte, misura la qualità del
risultato con un punteggio e, sotto soglia, rigenera con un tentativo successivo dello stesso seme,
fino a un massimo. Il seme della notte e il piano si salvano, così una notte si riprende identica.

## Player Fantasy

Ogni notte è una Caserta nuova ma sempre giusta: il giocatore deve avere una scelta di strada
(il bivio verso un vicolo cieco o verso il boss), sapere di certo che ci sarà una bottega con un dono
e il banchetto di Tonino prima del boss, e il sospetto che da qualche parte dietro una finestra accesa
ci sia qualcosa. Non deve mai trovare una stanza vuota, una serie di stanze senza premio o un boss
troppo vicino da sembrare un errore. Riprendere una notte deve sembrare riaprire lo stesso libro.

## Detailed Design

### Core Rules

**A. Griglia e tipi**

1. **Griglia**. Il piano è una griglia di `griglia_w × griglia_h` = 9×8 celle, indice `(cx, cy)` con
   `cx` 0–8 e `cy` 0–7, origine in alto a sinistra. Ogni stanza occupa una cella (`1x1`) o due celle
   orizzontali contigue (`2x1`). La cella d'ingresso è sempre `(4, 3)` (`cella_ingresso`).
2. **Adiacenza e porte**. Due stanze confinanti hanno una porta tra loro **solo se il piano le collega
   con un arco**; confinare non basta. Una connessione occupa uno slot di porta per parte
   (`N`, `E`, `S`, `W`, e `N0/N1/S0/S1` nelle doppie; slot in `stanze-porte.md` regola 3).
3. **Quantità per piano** (tutte contano come una stanza, le doppie sono una stanza su due celle;
   la segreta non conta in `n_stanze`):

| Tipo | Quantità | Vincoli di posizione |
|------|----------|---------------------|
| `ingresso` | 1 | cella `(4, 3)`; grado minimo `grado_ingresso_min` |
| `boss` | 1 | foglia (grado 1) in fondo al cammino critico; **mai confinante con l'ingresso**, né con la segreta |
| `tesoro` | 1 | foglia a distanza `d ≥ d_tesoro_min` dall'ingresso; il genitore non è anche il genitore del banchetto |
| `banchetto` | 1 | foglia il cui genitore sta sul cammino critico nella seconda metà (regola 9) |
| `ricordo` | 1 | foglia; al piano 1 a distanza `d ≤ d_ricordo_max[1]` = 1 dall'ingresso |
| `segreta` | 0 o 1 | cella libera confinante con almeno 2 stanze idonee (regola 12) |
| `normale` | il resto | 1×1 o 2×1; un sottoinsieme è `elite` |

4. **Foglie speciali**. Boss, tesoro, banchetto e ricordo hanno **grado 1** (una sola porta) e nessuna
   delle loro celle confina con un'altra stanza oltre al genitore. La stanza segreta non ha porte
   normali.

**B. Algoritmo** (ogni passo usa solo il generatore seedato, regola 15)

5. **Dimensioni del piano** (flusso `rng_dim`, uguale per tutti i tentativi):
   `n_stanze` e `L` secondo le formule. `L` è il numero di archi del cammino critico.
   `n_extra = n_stanze − (L + 1) − 3`: stanze oltre cammino e tre foglie speciali; è ≥ 0 per costruzione.
6. **Cammino critico**. Passeggiata auto-evitante da `(4, 3)` di `L` passi: a ogni passo si scelgono
   le direzioni libere; peso 1 per le curve, `k_dritto` per proseguire dritto; non si prosegue dritto
   oltre `max_rettilineo_walk` passi. Una cella è vietata se confina con una cella del cammino che non
   sia l'ultima. L'ultima cella è il boss. Se non c'è nessuna cella valida, il tentativo fallisce
   (regola 18). Le stanze del cammino sono `normale`; l'indice `i` va da 0 (ingresso) a `L` (boss).
7. **Anelli**. Per ogni svolta del cammino, la cella d'angolo interna (confinante con le stanze `i` e
   `i+2`) può ospitare una stanza `normale` collegata a entrambe, se non confina con altre stanze oltre a quelle due, con probabilità `p_anello[p]`, fino
   a `anelli_max[p]` e a `n_extra`. Chiude un quadrato di quattro stanze e offre due strade di pari
   lunghezza; **non accorcia mai** il cammino critico. È vietata una cella d'angolo che confini con il
   boss.
8. **Rami e vicoli ciechi**. Le `n_extra` rimaste (meno gli anelli) sono stanze `normale` appese a un
   genitore: scelto tra ingresso e stanze `normale` con una cella libera, con peso `1 / (1 + grado)`,
   mai il boss; la nuova cella non confina con altre stanze oltre al genitore né con il boss; la
   profondità del ramo non supera `lung_vicolo_max` (2). Un **vicolo cieco** è ogni foglia diversa dal
   boss: le tre foglie speciali e i rami extra.
9. **Foglie speciali**, in quest'ordine, ognuna su una cella libera che confina solo con il
   genitore, mai con il boss:
   - `banchetto`: genitore sul cammino critico con indice `i` in `[floor(f_banchetto × L), L − 1]`
     (`f_banchetto` = 0,5), cioè nella seconda metà, come tappa prima del boss; se non esiste, un
     genitore `normale` qualunque a `d ≥ 2`;
   - `tesoro`: genitore `normale` a `d(genitore) + 1 ≥ d_tesoro_min` (2), diverso dal genitore del
     banchetto;
   - `ricordo`: genitore `normale` o ingresso; al piano 1 il genitore deve essere l'ingresso, così il
     reperto è la prima cosa vicina (nella storia la targa viene prima di Tonino).
   Se una foglia non trova posto, il tentativo fallisce.
10. **Doppie**. Ogni stanza `normale` (non `elite`) può diventare `2x1` con probabilità
    `p_doppia[p]` (massimo `max_doppie[p]` per piano) assorbendo una cella libera a est o a ovest,
    che non confini con altre stanze oltre alla stanza stessa né con il boss. Le connessioni restano
    sugli stessi lati; lo slot si deduce dalla metà. Se non esiste un modello `2x1` compatibile, la
    stanza torna `1x1` e libera la cella.
11. **Modelli**: regole 19–22. Si scelgono prima delle ricompense e prima della segreta.
12. **Stanza segreta**. Con probabilità `p_segreta[p]` si cerca una cella libera, dentro la griglia,
    che confini con **almeno due stanze idonee** (tipi `normale`, `ricordo`, `tesoro`, `banchetto` e
    `ingresso`), e **mai** con il boss. Le celle d'angolo interne delle svolte, non occupate da un
    anello, sono i candidati più comuni. Tra i candidati si estrae con peso uniforme. In ogni stanza
    idonea confinante, lo slot di porta rivolto verso la segreta diventa una **finestra accesa**
    (`p_finestra_visibile` = 1: la finestra compare in tutte, per leggibilità). Se la probabilità
    scatta ma non ci sono candidati, il piano non ha la segreta (non è un errore).
13. **Ricompense**. Per ogni stanza, valore e oggetti con la formula `valore_ricompensa` di
    `stanze-porte.md` (flusso `rng_ric` della stanza), poi **riparazione**: per ogni percorso dalla
    radice a una foglia, se più di `N_max_senza_ricompensa` (2) stanze di combattimento consecutive
    hanno valore 0, si forza `valore ≥ 1` nella terza della serie. Le stanze speciali azzerano la serie.
14. **Valutazione**: formula `Q` (Formulas). Se i vincoli rigidi (regola 16) sono rispettati e
    `Q ≥ soglia_Q[p]` il piano è accettato.

**C. Determinismo, vincoli e fallimento**

15. **Generatore e flussi**. Tutta la generazione usa `mulberry32` e `derive`; mai `Math.random`,
    mai l'orologio, mai il profilo. La funzione è pura: `generaPiano(seme_notte, p, usi_modelli,
    parametri, modelli) → { piano, usi_modelli }`, senza I/O, quindi testabile con un test unitario.

```js
// mulberry32: 32 bit di stato, restituisce float in [0, 1)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// derive: seme figlio indipendente, per sale intero
const derive = (seme, sale) =>
  Math.floor(mulberry32((seme ^ Math.imul(sale, 0x9E3779B1)) >>> 0)() * 4294967296) >>> 0;
```

    `seme_piano = derive(seme_notte, p)`. Flussi: `rng_dim = mulberry32(derive(seme_piano, 1))`;
    tentativo `k`: `rng_layout = mulberry32(derive(seme_piano, 100 + k))` (cammino, rami, speciali,
    doppie, segreta, modelli); stanza: `seme_stanza = derive(seme_piano, 1000 + 16 × cy + cx)`
    (formula in `stanze-porte.md`); sale 7 riservato al caso di gioco (`rng_gioco`). `rng_int(a, b) =
    a + floor(u × (b − a + 1))`. La stessa notte generata da due macchine dà lo stesso piano.
16. **Vincoli rigidi** (verificati dopo ogni tentativo, non pesati):
    - H1 `n_stanze` nell'intervallo del piano;
    - H2 distanza ingresso→boss nel grafo `d_boss ≥ L_min[p]`;
    - H3 il boss non confina con l'ingresso (4-vicinato sulla griglia);
    - H4 esattamente 1 ingresso, 1 boss, 1 tesoro, 1 banchetto, 1 ricordo;
    - H5 boss, tesoro, banchetto e ricordo hanno grado 1;
    - H6 se la segreta esiste: confina con ≥ 2 stanze idonee e con nessun boss;
    - H7 ogni stanza ha un modello compatibile per tipo, dimensione e piano;
    - H8 **nessuna stanza vuota**: ogni stanza di combattimento ha `n_nemici ≥ 1` e un modello con
      `spawn` e `tavolozza`; ogni stanza speciale ha il suo contenuto assegnato (dono, banco, reperto
      con `scena_id`, ricompensa della segreta, boss);
    - H9 nessun percorso con più di `N_max_senza_ricompensa` stanze consecutive senza ricompensa;
    - H10 `grado(ingresso) ≥ grado_ingresso_min` (2) e ogni connessione corrisponde a due slot
      presenti e liberi (nelle doppie, uno slot per metà).
17. **Cammino critico minimo** per piano: formula `L_min`. È un limite sulla lunghezza del cammino più
    breve ingresso→boss, non sulla camminata: gli anelli non lo accorciano (regola 7).
18. **Tentativi**. `k` va da 0 a `max_tentativi − 1` (12). Un tentativo fallisce se un passo non trova
    posto o un vincolo rigido è violato (nessun punteggio). Si accetta il primo tentativo valido con
    `Q ≥ soglia_Q[p]`. Se nessuno la raggiunge, si prende il tentativo valido con `Q` massimo; se nessun
    tentativo è valido, si usa il **piano di riserva** `piano_riserva[p]`, disegnato a mano in
    `contenuti/piani/`, e si scrive un errore per gli strumenti di QA. Il tentativo accettato si
    salva (`tentativo` nel piano).

**D. Modelli di stanza**

19. **Pool**. I modelli (formato in `stanze-porte.md` regola 28) si filtrano per tipo, dimensione e
    `piani` (il piano corrente nell'elenco). Pool minimo previsto (concept: circa 60 modelli):

| Tipo | Dim | Per piano | Totale | MVP (piano 1) |
|------|-----|-----------|--------|---------------|
| `ingresso` | 1×1 | 1 | 5 | 1 |
| `normale` | 1×1 | 6 (di cui 2 `elite` dal piano 2) | 30 | 6 |
| `normale` | 2×1 | 2 | 10 | 2 |
| `ricordo` | 1×1 | 1 | 5 | 1 |
| `boss` | 1×1 | 1 | 5 | 1 |
| `tesoro` | 1×1 | 2, con "pelle" per quartiere | 2 | 1 |
| `banchetto` | 1×1 | 1, con "pelle" per quartiere | 1 | 1 |
| `segreta` | 1×1 | 2 | 2 | 1 |

    Il campo `piani` di un modello può elencare più piani, quindi il pool effettivo è più largo.
20. **Difficoltà**. Ogni modello ha `difficolta` da 1 a 5 (1 = quasi innocuo, 3 = standard, 5 =
    picco). Per una stanza di combattimento a profondità `prof` si cerca `diff_target`
    (formula `diff_target`), con `diff_base[p]` crescente.
21. **Pesatura** (formula `peso_modello`): il peso cala con gli usi del modello nella notte
    (`k_rip` per ogni uso, contando anche i piani precedenti tramite `usi_modelli`), cala se un vicino
    nel grafo lo usa già (`k_adj`), e segue una gaussiana attorno a `diff_target` per le stanze di
    combattimento. Mai a zero: il peso minimo è `f_min × peso_base`, così il pool non si esaurisce.
    Ordine di assegnazione: stanze in ampiezza dall'ingresso (così i vicini sono noti). I tipi
    speciali scelgono tra i modelli del tipo con la sola pesatura per usi.
22. **Svuotamento del pool**. Se dopo i filtri non resta nulla, si rilassa in ordine: prima si
    ammettono i modelli dei piani adiacenti (±1), poi si ignora la difficoltà, poi si ammette la
    ripetizione (già coperta da `f_min`). Un pool vuoto per tipo e dimensione è un errore di
    contenuto, trovato dal validatore al caricamento, non a runtime.

**E. Stanza-ricordo: scene per piano**

23. Ogni piano ha una stanza-ricordo con un `scena_id` di `trama/storia.json` (qui solo gli id). Per
    ogni piano è indicata anche la scena del boss; i boss sono consumati da `boss.md`.

| Piano | Quartiere | `scena_id` principale | Alternativa | Tipo in `storia.json` | Reperto (proposta per l'art-director) | Scena del boss |
|-------|-----------|----------------------|-------------|----------------------|--------------------------------------|----------------|
| 1 | Piazza Dante | `piazza-dante.targa-commemorativa` | `piazza-dante.filastrocca` (primo indizio di Bianca) | obbligatoria / indizio | la targa degli operai del 1839 | `piazza-dante.gatto-dei-quattro-canti` |
| 2 | Corso Trieste | `corso-trieste.finestra-mariella` (obbligatoria, ordine 10: viene prima del boss) | — (`passato-taddeo` e `scelta-taddeo` vengono **dopo** la Regina: ancoraggio `dopo-boss` e vetrina nella stanza del boss, GDD `incontri-dialoghi.md`) | obbligatoria | la finestra illuminata di Mariella e il ferro che risuona dietro una porta | `corso-trieste.regina-dei-debiti` |
| 3 | Villa Comunale | `villa-comunale.inchino-bianca` (secondo indizio di Bianca, memoria nel marmo) | `villa-comunale.statua-cavaliere` | indizio | la lastra di marmo | `villa-comunale.madre-di-marmo` |
| 4 | San Leucio | `san-leucio.flashback-sciarpa` | `san-leucio.fazzoletto-giglio` | indizio | la sciarpa sul telaio | `san-leucio.tessitrice-di-pietra` |
| 5 | Reggia | `reggia.memoria-funerale-bianca` (collocazione provvisoria nella Reggia, dice `storia.json`) | `reggia.memoria-tradimento-marito` | indizio | il catafalco piccolo | `reggia.scontro-custode` |

    Il piano porta `scena_id` nella stanza; la scena condizionata ai flag la decide
    `incontri-dialoghi.md`. **Garanzia delle obbligatorie** (GDD `stato-narrativo.md` regola 6): se la
    scena della stanza-ricordo è `obbligatoria` e non è in `scene_viste`, la stanza-ricordo è
    sempre generata (è già così: è una foglia obbligatoria H4) e sta sul cammino critico o a
    distanza 1 da esso; una volta vista, può essere una foglia qualunque. La scelta della scena principale è una proposta: i vincoli di ordine
    (la targa è obbligatoria; `passato-taddeo` è dopo la Regina dei Debiti) sono in Open Questions.

**F. Parametri per piano** (tutti in `contenuti/parametri/generazione.json`)

| Parametro | P1 Piazza Dante | P2 Corso Trieste | P3 Villa Comunale | P4 San Leucio | P5 Reggia |
|-----------|:---:|:---:|:---:|:---:|:---:|
| `n_min` | 8 | 9 | 10 | 12 | 13 |
| `n_var` | 0 | 1 | 1 | 1 | 1 |
| `L_min` | 4 | 5 | 6 | 7 | 8 |
| `L_var` | 0 | 1 | 1 | 1 | 1 |
| `p_segreta` | 0,5 | 0,6 | 0,7 | 0,7 | 0,8 |
| `p_doppia` | 0,15 | 0,20 | 0,25 | 0,25 | 0,30 |
| `max_doppie` | 1 | 2 | 2 | 3 | 3 |
| `p_elite` | 0 | 0,10 | 0,15 | 0,20 | 0,25 |
| `max_elite` | 0 | 1 | 2 | 2 | 3 |
| `p_anello` | 0 | 0,15 | 0,20 | 0,25 | 0,30 |
| `anelli_max` | 0 | 1 | 1 | 2 | 2 |
| `diff_base` | 1 | 2 | 2 | 3 | 4 |
| `bivi_target` | 1 | 2 | 2 | 3 | 3 |
| `soglia_Q` | 55 | 60 | 60 | 65 | 65 |

    `p_elite` è la probabilità che una stanza `normale` (non doppia) sia di tipo `elite`
    (nemici di `nemici.md`; conta `conto_elite`). `p_doppia` è per stanza `normale` idonea.

### States and Transitions

Fasi del generatore (per tentativo):

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| Dimensioni | piano richiesto | `n_stanze`, `L` calcolati | usa `rng_dim` |
| Cammino | dimensioni pronte | boss posato, oppure nessuna cella (→ Fallito) | regola 6 |
| Anelli e rami | cammino pronto | tutte le `n_extra` posate (→ Speciali) o nessun posto (→ Fallito) | regole 7–8 |
| Speciali | rami pronti | tre foglie posate o nessun posto (→ Fallito) | regola 9 |
| Doppie | speciali pronti | doppie decise | regola 10 |
| Modelli | doppie decise | ogni stanza ha un modello (o doppie annullate) | regole 19–22 |
| Segreta | modelli pronti | segreta posata o assente | regola 12 |
| Ricompense | segreta decisa | ricompense e riparazione | regola 13 |
| Valutazione | ricompense pronte | Accettato / Respinto / Fallito | regola 16 e formula `Q` |
| Accettato | vincoli ok e `Q ≥ soglia` | — | piano consegnato |
| Respinto | vincoli ok e `Q < soglia` | nuovo tentativo | tiene il migliore |
| Fallito | passo impossibile o vincolo violato | nuovo tentativo | nessun punteggio |
| Riserva | `max_tentativi` esauriti senza piano valido | — | `piano_riserva[p]` + errore QA |

Ciclo di vita del seme della notte: creato all'inizio della notte (risveglio in Piazza Dante),
salvato subito, immutabile fino alla morte o al finale; una nuova notte ha un nuovo seme. Il piano
`p` si genera alla prima entrata in `p`.

### Seme, salvataggio e ripresa

- **Creazione**. `seme_notte` è un uint32 estratto con `crypto.getRandomValues` (con ripiego su un
  hash di data e ora) e **scritto subito** nel salvataggio. Gli strumenti di QA lo forzano con il
  parametro `?seme=<uint32 o codice>`; il codice è lo stesso numero in base 36, 7 caratteri
  maiuscoli, quello che si mostra nei menu di sviluppo.
- **Cosa si salva** (contratto con `salvataggio.md`):

```json
{
  "versione_generatore": "g1",
  "seme_notte": 305419896,
  "piano_corrente": 2,
  "usi_modelli": {"pd-n-03": 1, "pd-d-01": 1},
  "piani": [
    {
      "p": 2, "tentativo": 0, "Q": 71.4, "n_stanze": 10, "L": 5,
      "stanze": [
        {"id": "r0", "cella": [4, 3], "dim": "1x1", "tipo": "ingresso",
         "modello": "ct-i-01", "seme_stanza": 2718281828, "profondita": 0,
         "porte": {"E": "r1", "W": "r5"}, "ricompensa": {"valore": 0}}
      ],
      "segreta": {"cella": [6, 3], "modello": "se-01", "finestre": [["r1", "W"], ["r3", "S"]]}
    }
  ],
  "stanze_stato": []
}
```

  `stanze_stato` è la lista dei `StatoStanza` (`stanze-porte.md` regola 27).
- **Ripresa**. Si usa il piano salvato come fonte di verità, non lo si rigenera: se i contenuti
  (modelli, parametri) sono cambiati tra due sessioni, il piano salvato continua a funzionare perché
  nomina i modelli per id; un id scomparso invalida solo quella notte, con un messaggio. Il piano è
  comunque **ricavabile dal seme** con la stessa versione del generatore (`versione_generatore`): serve
  agli strumenti di QA e al controllo di determinismo.
- **Il profilo non entra**. Il piano non dipende da scene viste, flag, scintille o doni sbloccati,
  così lo stesso seme dà sempre lo stesso piano. L'effetto del profilo (per esempio la stanza-ricordo
  `rivista`) vive nella stanza, non nella generazione.

### Esempio: piano 1 (8 stanze, `L = 4`)

```
     0   1   2   3   4   5   6   7   8
y0   .   .   .   .   .   .   .   .   .
y1   .   .   .   .   .   .  [B]  .   .
                             |
y2   .   .   .   .   .  [N]-[N]-[Q]  .
                         |   ~
y3   .   .   .  [M]-[I]-[N]~[S]  .   .
                         |
y4   .   .   .   .   .  [T]  .   .   .
y5   .   .   .   .   .   .   .   .   .
```

Legenda: `I` ingresso (4,3) · `N` normale · `Q` banchetto · `T` tesoro · `M` ricordo · `B` boss ·
`S` segreta · `-` e `|` porta · `~` finestra accesa. Cammino critico: `I(4,3) → N(5,3) → N(5,2) →
N(6,2) → B(6,1)`, quattro archi. Le tre stanze di combattimento sono `N`. Bivi: `N(5,3)` (verso il
tesoro) e `N(6,2)` (verso il banchetto). La segreta `S(6,3)` confina con `N(5,3)` a ovest e con
`N(6,2)` a nord, quindi con due stanze idonee e non con il boss. Il boss `(6,1)` non confina con
l'ingresso `(4,3)`. Il ricordo `(3,3)` è a distanza 1 (regola 9). `p_anello = 0` e `n_extra = 0`: nessun
anello né ramo.

| Stanza | Distanza `d` | `prof` | `diff_target` (piano 1, `diff_base` 1) |
|--------|:---:|:---:|:---:|
| `N(5,3)` | 1 | 0,25 | 1 |
| `N(5,2)` | 2 | 0,50 | 2 |
| `N(6,2)` | 3 | 0,75 | 2 |
| `B(6,1)` | 4 | 1,00 | — (boss) |

Tempo stimato di questo piano: circa 5 minuti (formula `t_piano`), nell'intervallo di 5–15 minuti
per piano del concept.

### Interactions with Other Systems

| Sistema | Dati in ingresso | Dati in uscita |
|---|---|---|
| Stanze e porte | formula `valore_ricompensa`, formato e validatore dei modelli, `StatoStanza`, `n_nemici` | piano: tipo, modello, `seme_stanza`, `profondita`, `d_boss`, porte e finestre, `scena_id`, ricompensa pre-estratta |
| Salvataggio e profilo | — | `seme_notte`, piano, `usi_modelli` (JSON qui sopra) |
| Nemici e IA | elenco dei tipi ammessi per piano | — (le composizioni nascono nella stanza) |
| Boss | scena del boss per piano | stanza `boss` e id del piano |
| Incontri e dialoghi | — | `scena_id` del reperto per piano |
| Doni e modificatori | pool dei doni | `seme_stanza` per il tesoro |
| Mappa del piano | — | grafo, tipi, celle, stanze doppie, finestre (la segreta non si mostra finché non è aperta) |
| Strumenti di sviluppo e QA | `?seme=`, `?piano=` | generatore puro; strumento che stampa e fotografa 50 piani per seme |
| Ciclo di gioco | evento di inizio notte e cambio piano | piano corrente |

## Formulas

La formula `n_stanze` è definita come:

`n_stanze = clamp(n_min[p] + floor(u × (n_var[p] + 1)), 8, 14)`, con `u = rng_dim()`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| p | int | 1–5 | calculated | piano |
| n_min[p] | int | 8–13 | data file | 8 · 9 · 10 · 12 · 13 |
| n_var[p] | int | 0–2 | data file | ampiezza della variazione: 0 · 1 · 1 · 1 · 1 |
| u | float | 0–1 | rng (`rng_dim`) | estrazione uniforme |

**Output Range:** 8 to 14; per piano 8 · 9–10 · 10–11 · 12–13 · 13–14. **Example:** piano 3, `u = 0,62`: `10 + floor(0,62 × 2) = 11`.

La formula `L_min` è definita come:

`L_min(p) = L0 + floor((p − 1) × k_L)` con la lunghezza effettiva `L = min(L_min[p] + floor(u2 × (L_var[p] + 1)), n_stanze − 4)`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| L0 | int | 3–5 | data file | cammino minimo al piano 1 (4) |
| k_L | float | 0,5–1,5 | data file | crescita per piano (1,0) |
| L_var[p] | int | 0–2 | data file | variazione sopra il minimo: 0 · 1 · 1 · 1 · 1 |
| u2 | float | 0–1 | rng (`rng_dim`) | seconda estrazione |
| n_stanze − 4 | int | 4–10 | calculated | spazio per il cammino (`L + 1` stanze) più 3 foglie |

**Output Range:** `L_min` = 4, 5, 6, 7, 8; `L` da 4 a 9. **Invariante** (verificato al caricamento dei parametri): `L_min[p] ≤ n_min[p] − 4` per ogni `p`, altrimenti `L ≥ L_min` non è garantito. **Example:** piano 3, `n_stanze = 11`, `u2 = 0,3`: `L = min(6 + 0, 7) = 6`; `n_extra = 11 − 7 − 3 = 1`.

La formula `Q` (punteggio di qualità di un piano) è definita come:

`Q = 100 × (w_b × s_bivi + w_t × s_tq + w_r × s_rett + w_v × s_var + w_c × s_curva + w_f × s_forma)`

con:
- `s_bivi = min(1, bivi / bivi_target[p])`, `bivi` = stanze con grado ≥ 3;
- `s_tq = min(1, d_TQ / d_tq_ideale)`, `d_TQ` = distanza nel grafo tra tesoro e banchetto;
- `s_rett = 1 − min(1, Σ max(0, run − run_ideale) / run_norm)`, `run` = lunghezze dei tratti dritti del cammino;
- `s_var = modelli_distinti / stanze_di_combattimento`;
- `s_curva = 1 − min(1, inversioni_gravi / passi_cammino)`, `inversione grave` = calo di `difficolta` ≥ 2 tra due stanze consecutive del cammino;
- `s_forma = min(1, celle_occupate / (bbox_w × bbox_h) / occ_target)`.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| w_b, w_t, w_r, w_v, w_c, w_f | float | 0–1, somma 1 | data file | pesi: 0,20 · 0,15 · 0,15 · 0,20 · 0,15 · 0,15 |
| bivi_target[p] | int | 1–4 | data file | 1 · 2 · 2 · 3 · 3 |
| d_tq_ideale | int | 2–5 | data file | distanza ideale tesoro–banchetto (3) |
| run_ideale, run_norm | int | 1–3 · 2–5 | data file | tratto dritto ideale e normalizzazione (2 · 3) |
| occ_target | float | 0,25–0,6 | data file | densità ideale del rettangolo occupato (0,35) |
| soglia_Q[p] | float | 40–80 | data file | 55 · 60 · 60 · 65 · 65 |

**Output Range:** 0 to 100. **Example:** piano 3, bivi 1 (`s = 0,5`), `d_TQ = 2` (0,667), un tratto dritto di 3 (`s_rett = 0,667`), 5 modelli su 6 stanze di combattimento (0,833), una inversione su 6 passi (0,833), densità 0,30 (0,857): `Q = 100 × (0,10 + 0,10 + 0,10 + 0,167 + 0,125 + 0,129) = 72,0`, sopra la soglia 60: accettato. Il piano di esempio del piano 1 totalizza 100.

La formula `rigenerazione` è definita come:

`P(riserva) = (1 − p_acc)^max_tentativi`

dove `p_acc` è la frazione di tentativi che producono un piano valido con `Q ≥ soglia`. **Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| max_tentativi | int | 6–20 | data file | tentativi per piano (12) |
| p_acc | float | 0–1 | calculated (QA, misurata su 10.000 semi) | probabilità di accettazione per tentativo |

**Output Range:** 0 to 1. **Example:** con `p_acc = 0,5` la probabilità di arrivare al piano di riserva è 0,5^12 ≈ 0,024%; con `p_acc = 0,3` è 1,4%, troppo alta: si alzano i tentativi o si abbassa la soglia. Il valore reale di `p_acc` non è noto (nessuna simulazione).

La formula `diff_target` è definita come:

`diff_target = clamp(diff_base[p] + floor(k_dt × prof), 1, 5)` con `prof = min(1, d / d_boss)`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| diff_base[p] | int | 1–4 | data file | 1 · 2 · 2 · 3 · 4 |
| k_dt | float | 0–3 | data file | crescita con la profondità (2) |
| prof | float | 0–1 | calculated | profondità normalizzata (anche in `stanze-porte.md`) |

**Output Range:** 1 to 5. **Example:** piano 4, `prof = 0,5`: `3 + floor(1,0) = 4`; piano 1, `prof = 0,25`: `1 + floor(0,5) = 1`.

La formula `peso_modello` (pesatura per evitare ripetizioni) è definita come:

`peso(m) = max(f_min, k_rip^usi(m) × k_adj^[m ∈ vicini] × g(m)) × peso_base(m)`, con `g(m) = exp(−(diff_m − diff_target)² / (2σ²))` per le stanze di combattimento e `g = 1` per le altre

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| peso_base(m) | float | 0,1–3 | data file (modello) | 1,0 salvo scelta dell'autore |
| usi(m) | int | 0–n | calculated | volte che m è già stato assegnato in questa notte (piani precedenti inclusi) |
| k_rip | float | 0,1–0,6 | data file | penalità per uso (0,25) |
| [m ∈ vicini] | 0/1 | 0 o 1 | calculated | 1 se un vicino nel grafo usa già m |
| k_adj | float | 0,01–0,5 | data file | penalità di vicinato (0,1) |
| diff_m | int | 1–5 | data file (modello) | difficoltà del modello |
| σ | float | 0,5–1,5 | data file | larghezza della gaussiana (0,8) |
| f_min | float | 0,005–0,05 | data file | peso minimo, evita il pool vuoto (0,02) |

**Output Range:** `f_min × peso_base` to `peso_base`. **Example:** modello mai usato, `diff_m` = `diff_target`: peso 1,0. Usato una volta, differenza di difficoltà 1, nessun vicino: `0,25 × exp(−1 / 1,28) = 0,25 × 0,458 = 0,114`. Con un vicino che lo usa: `0,114 × 0,1 = 0,0114`, sotto `f_min`, quindi 0,02.

La formula `t_piano` (riferimento di bilanciamento, non per il codice) è definita come:

`t_piano ≈ n_comb × t_comb + n_spec × t_spec + t_boss`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| n_comb | int | 3–9 | calculated | stanze di combattimento percorse |
| n_spec | int | 3–5 | calculated | stanze speciali visitate |
| t_comb | s | 30–70 | data file (stima) | tempo medio per stanza di combattimento (45) |
| t_spec | s | 10–40 | data file (stima) | tempo medio per stanza speciale (20) |
| t_boss | s | 60–150 | data file (stima) | boss (90 nei primi piani, 120 oltre) |

**Output Range:** 3 to 12 minuti. **Example:** piano 1: `3 × 45 + 3 × 20 + 90 = 285 s ≈ 4,75 min`; piano 5 con 9 combattimenti e 4 speciali: `9 × 45 + 4 × 20 + 120 = 605 s ≈ 10 min`. Cinque piani completi: circa 35 minuti, dentro i 20–40 minuti per notte del concept (sono stime non verificate).

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| La passeggiata del cammino non trova cella libera | il tentativo fallisce e passa al successivo | nessun piano parziale |
| Nessuna foglia speciale trova posto | il tentativo fallisce | tesoro, banchetto e ricordo sono obbligatori |
| Tutti i tentativi falliscono o non sono validi | `piano_riserva[p]`, errore scritto per il QA | la notte non si blocca mai |
| Nessun tentativo valido supera `soglia_Q` | si usa il valido con `Q` più alto | meglio un piano mediocre che nessuno |
| La probabilità della segreta scatta, ma non ci sono celle con 2 vicini idonei | il piano non ha la segreta | la segreta è facoltativa |
| La cella segreta confinerebbe con il boss | cella scartata | il boss resta sigillato |
| Una doppia non trova un modello `2x1` | la stanza torna `1x1`, la cella è liberata | niente stanze senza modello |
| Il pool per tipo e piano è vuoto | rilassamento a ±1 piano, poi senza difficoltà; se ancora vuoto, errore del validatore al caricamento | il contenuto mancante si trova prima di giocare |
| Una serie di 3 stanze di combattimento senza ricompensa | si forza `valore ≥ 1` nella terza | vincolo H9 |
| Più stanze `elite` di `max_elite` | le eccedenti tornano `normale` | tetto di durezza per piano |
| Seme 0 o uint32 massimo | accettati | ogni uint32 è valido |
| Ripresa con contenuti cambiati | si usa il piano salvato; un id di modello scomparso invalida la notte con un messaggio | mai rigenerare sotto i piedi del giocatore |
| Scena della stanza-ricordo già vista | il piano è identico; cambia solo lo stato della stanza | determinismo indipendente dal profilo |
| Piano 1 senza celle libere accanto all'ingresso per il ricordo | impossibile: l'ingresso ha 4 vicini e il cammino ne usa 1; il validatore dei parametri lo verifica | — |
| Boss che confina con la cella d'angolo di un anello | cella d'angolo vietata | il boss ha un solo ingresso |
| Parametri incoerenti (`L_min > n_min − 4`) | errore di caricamento dei parametri | altrimenti `L ≥ L_min` non è garantito |
| Avvio di sviluppo con `?piano=3` | si genera il piano 3 con `usi_modelli` vuoti e seme dato | prova rapida dei piani alti |
| Doppia con porta a nord su entrambe le metà | due slot (`N0`, `N1`) con connessioni diverse | slot per metà |
| Due piani generati con lo stesso `seme_piano` per errore | non può succedere: `derive(seme_notte, p)` | seme per piano |

## Dependencies

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| Stanze e porte | This depends on Stanze e porte | tipi, formato e validatore dei modelli, formula `valore_ricompensa`, `n_nemici`, `StatoStanza`; consegna a `stanze-porte.md` il piano con `seme_stanza`, `profondita`, `d_boss` |
| Salvataggio e profilo | This depends on Salvataggio | persistenza di `seme_notte`, piano, `usi_modelli` (contratto qui sopra) |
| Controllo di Ferruccio | Indiretta | le celle da 64 px e `v_base` danno il senso delle distanze; nessun dato scambiato |
| Combattimento | Indiretta, tramite le stanze | la difficoltà dei modelli si calibra su `combattimento.md` (`dps_riferimento`); nessun dato scambiato |
| Nemici e IA | Reciproca | tipi ammessi per piano, élite |
| Boss | Boss depends on this | id del piano, scena del boss, stanza `boss` come foglia |
| Incontri e dialoghi | Reciproca | `scena_id` della stanza-ricordo, banchetto di Tonino |
| Mappa del piano | Mappa depends on this | grafo, celle, tipi, stanze doppie |
| Strumenti di sviluppo e QA | QA depends on this | generatore puro, seme forzabile, fotografie di 50 piani |
| Ciclo di gioco | Ciclo depends on this | inizio notte, cambio piano |
| Camera e transizioni | Camera depends on this | stanze doppie e porte per metà |
| Doni e modificatori / Economia | Reciproca | seme per il dono del tesoro, unità di ricompensa |

## Tuning Knobs

Tutti in `contenuti/parametri/generazione.json`. I valori per piano sono nella tabella del punto F.

| Parameter | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|--------------|------------|-------------------|-------------------|
| griglia_w × griglia_h | 9 × 8 | 7×7 – 11×10 | più spazio, più anelli possibili | piani compressi, più fallimenti |
| cella_ingresso | (4, 3) | centro ± 1 | — | — |
| n_min / n_var | per piano | 8–14 totale | piani più lunghi | piani più corti |
| L0 / k_L | 4 / 1,0 | 3–5 / 0,5–1,5 | cammino più lungo | boss più vicino |
| L_var | per piano | 0–2 | — | — |
| max_rettilineo_walk | 4 | 3–6 | corridoi lunghi | piani più contorti |
| k_dritto | 0,5 | 0,1–1,0 | cammini rettilinei | cammini a zigzag |
| lung_vicolo_max | 2 | 1–3 | rami lunghi | rami corti |
| f_banchetto | 0,5 | 0,3–0,8 | banchetto più vicino al boss | più vicino all'ingresso |
| d_tesoro_min | 2 | 1–3 | tesoro più lontano | più vicino |
| d_ricordo_max[1] | 1 | 1–3 | — | — |
| grado_ingresso_min | 2 | 1–3 | più strade subito | corridoio d'ingresso |
| p_segreta, p_doppia, p_elite, p_anello | per piano | 0–1 | più varietà | meno |
| max_doppie, max_elite, anelli_max | per piano | 0–4 | — | — |
| p_finestra_visibile | 1,0 | 0,3–1,0 | segreta più facile | segreta da cercare |
| N_max_senza_ricompensa | 2 | 1–4 | più avarizia | più generosità |
| max_tentativi | 12 | 6–20 | meno ricorsi alla riserva | più tempo di generazione |
| soglia_Q[p] | 55 · 60 · 60 · 65 · 65 | 40–80 | piani migliori, più tentativi | piani più casuali |
| pesi Q (w_b, w_t, w_r, w_v, w_c, w_f) | 0,20 · 0,15 · 0,15 · 0,20 · 0,15 · 0,15 | somma 1 | — | — |
| bivi_target, d_tq_ideale, run_ideale, run_norm, occ_target | vedi Formulas | — | — | — |
| diff_base[p] / k_dt | 1 · 2 · 2 · 3 · 4 / 2 | 1–4 / 0–3 | rampa dentro il piano più ripida | piano più piatto |
| k_rip / k_adj / σ / f_min | 0,25 / 0,1 / 0,8 / 0,02 | vedi Formulas | meno ripetizioni | più ripetizioni |
| usi massimi consigliati per un modello in una notte | 3 | 2–5 | — | — |

## Acceptance Criteria

- [ ] **GIVEN** un `seme_notte` e un piano `p`, **WHEN** si chiama `generaPiano` due volte (anche su due macchine), **THEN** i due piani sono identici byte per byte (hash del JSON) per tutti e cinque i piani.
- [ ] **GIVEN** 10.000 semi per ciascun piano, **WHEN** si genera, **THEN** il 100% dei piani consegnati rispetta H1–H10; la frazione che ricorre a `piano_riserva` è inferiore allo 0,1%.
- [ ] **GIVEN** il piano `p`, **WHEN** si generano 10.000 piani, **THEN** `n_stanze` sta nell'intervallo (8 · 9–10 · 10–11 · 12–13 · 13–14) e `d_boss ≥ L_min[p]` sempre.
- [ ] **GIVEN** qualunque piano, **WHEN** si guarda la griglia, **THEN** il boss non confina con l'ingresso, ha una sola porta, e nessuna stanza segreta lo confina.
- [ ] **GIVEN** un piano con la segreta, **WHEN** si contano le stanze idonee confinanti, **THEN** sono almeno 2 e ciascuna ha una finestra nello slot rivolto verso la segreta.
- [ ] **GIVEN** 10.000 piani, **WHEN** si cerca la serie più lunga di stanze di combattimento consecutive senza ricompensa su ogni percorso, **THEN** non supera mai `N_max_senza_ricompensa` (2).
- [ ] **GIVEN** piano 3, `u = 0,62` e `u2 = 0,3`, **WHEN** si calcolano le dimensioni, **THEN** `n_stanze = 11` e `L = 6`.
- [ ] **GIVEN** il layout di esempio del piano 1 con tutti i modelli distinti, **WHEN** si calcola `Q`, **THEN** vale 100; **GIVEN** il caso numerico di esempio del piano 3, **THEN** vale 72,0 ± 0,1.
- [ ] **GIVEN** un modello usato una volta, differenza di difficoltà 1 e nessun vicino che lo usa, **WHEN** si calcola il peso, **THEN** vale 0,114 ± 0,001; con un vicino che lo usa vale 0,02.
- [ ] **GIVEN** 1.000 notti complete di cinque piani, **WHEN** si contano gli usi, **THEN** nessun modello è usato più di 3 volte in una notte nel 95% dei casi, e due stanze collegate condividono il modello in meno del 2% dei casi.
- [ ] **GIVEN** il piano 1 di qualunque seme, **WHEN** lo si guarda, **THEN** ha una stanza-ricordo a distanza 1 dall'ingresso con `scena_id` `piazza-dante.targa-commemorativa`; per i piani 2–5 il `scena_id` corrisponde alla tabella della regola 23.
- [ ] **GIVEN** una notte salvata al piano 2 e ricaricata con un profilo diverso (altre scene viste), **WHEN** si riprende, **THEN** il piano, i semi delle stanze e `usi_modelli` sono identici.
- [ ] **GIVEN** una notte salvata e un file di modelli con un nuovo modello aggiunto, **WHEN** si riprende, **THEN** il piano salvato non cambia.
- [ ] **GIVEN** `L_min[p] > n_min[p] − 4` nei parametri, **WHEN** si caricano, **THEN** il caricamento fallisce con il nome del parametro.
- [ ] **GIVEN** il piano di riserva di ciascun piano, **WHEN** lo si valida, **THEN** rispetta H1–H10 e non usa un seme.
- [ ] Evidenza visiva: una fotografia automatica di 50 piani (seme e piano nel nome del file) in `production/qa/evidence/`, con le doppie, le finestre e le porte per slot controllate a occhio.
- [ ] Prestazioni: generare un piano (fino a 12 tentativi) costa meno di 100 ms; un tentativo meno di 10 ms.
- [ ] Nessun valore numerico di questo documento è scritto nel codice: tutto in `contenuti/parametri/generazione.json`; i modelli in `contenuti/stanze/`; il piano di riserva in `contenuti/piani/`.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| La targa commemorativa è una scena **obbligatoria**: la stanza-ricordo del piano 1 è una foglia obbligatoria a distanza 1 dall'ingresso finché la scena non è vista | narrative-director | — | risolto (regola 23, garanzia delle obbligatorie) |
| `corso-trieste.passato-taddeo` viene dopo la Regina: la stanza-ricordo del piano 2 usa `finestra-mariella`; Taddeo si incontra nella stanza del boss a porte aperte | narrative-director | — | risolto (regola 23) |
| Piano 5: la collocazione di `reggia.memoria-funerale-bianca` è provvisoria anche in `storia.json` | narrative-director | Alpha | — |
| Tonino compare in tutti i piani, o il banchetto degli altri quartieri è di altri venditori? | narrative-director | prima del piano 2 | non deciso |
| Le soglie `soglia_Q`, i pesi di `Q` e `max_tentativi` non sono stati tarati: servono 10.000 semi e la misura di `p_acc` per piano. Con pochi extra (`n_extra` vale 0–2 ai piani 2–5), i piani rischiano di somigliarsi molto | systems-designer, qa-lead | prima della vertical slice | da simulare |
| La griglia 9×8 e la regola "una sola stanza confinante" possono produrre molti tentativi falliti ai piani 4–5 (14 stanze più 3 doppie, 17 celle su 72) | level-designer | prototipo | da misurare |
| Il boss del piano 5 (Cortile d'Onore) potrebbe volere un'arena 2×1 | game-designer | GDD boss | non previsto; i modelli boss sono 1×1 |
| Gli anelli sono solo quadrati di 4 stanze negli angoli del cammino. Servono anelli più lunghi? | level-designer | dopo il prototipo | no nell'MVP |
| La distanza conta le doppie come 1 passo anche se sono lunghe il doppio | level-designer | prototipo | provare un peso 1,5 |
| Stanze L, stanze 2×2, piani con più di un boss intermedio | level-designer | dopo l'MVP | fuori scala |
| Il piano di riserva e il pool da 60 modelli vanno disegnati a mano; nulla di tutto ciò esiste ancora | level-designer | prima del prototipo | un piano 1 con 14 modelli (6 normali 1×1, 2 doppie, ingresso, ricordo, boss, tesoro, banchetto, segreta) è il minimo per l'MVP |
