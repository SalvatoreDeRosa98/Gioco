# Bilancio del Teatro — miglioramento 7 (2026-11-09)

Questa è una simulazione, non un bot che gioca. `tools/sim-bilancio-teatro.js` apre il gioco in Playwright. Per ogni piano genera la mappa vera, cioè `generaMappaPiano` con i lucchetti (A1), le stanze speciali (A3) e la Fucina (A2). Poi abbatte d'ufficio i nemici delle stanze di combattimento, del boss e della segreta con `danneggiaNemico` e conta quello che cade. I drop vengono dal codice vero: T3, A1, A2 e il filtro del piano 1 in `spawnaMonetaATerra`. Anche i forzieri comuni li apre `apriForziereA1`.

Le stanze speciali (ceppo, rovi, bisca) si valutano in valore atteso dalle loro tabelle. Per avere un'unità comune si usano i prezzi della Fucina: ½ Maschera = 1,5 🪙 (cuore 3) e un oggetto = 5 🪙 (prezzo base).

Le chiavi passano da un piano al successivo. A ogni piano si aprono prima i lucchetti (tesoro e Fucina) e poi, con le chiavi avanzate, i forzieri chiusi. Il giocatore della simulazione raccoglie tutto e trova la segreta.

Comandi:
- `node tools/sim-bilancio-teatro.js gioco/teatro_marionette.html 400 4`
- `node gioco/teatro/sim-economia.js`: controllo del piano 1, esce con 1 se la media è fuori da 5-8. Ora delega allo script sopra (vedi «Strumenti»).

## Risultati prima e dopo

Prima: 200 run × 4 piani, tabelle del merge `ae97d86`. Dopo: 400 run × 4 piani.

| Misura | Prima | Dopo | Obiettivo |
|---|---|---|---|
| Monete al piano 1, media (p10-mediana-p90) | 5,30 (1-5-9) | 6,13 (2-6-11) | 5-8 |
| di cui stanze normali / boss / segreta / forzieri | 0,7 / 0,9 / 3,0 / 0,7 | 1,0 / 1,2 / 3,3 / 0,7 | — |
| Monete ai piani 2 / 3 / 4 | 13,4 / 14,0 / 14,4 | 13,3 / 14,3 / 14,9 | (nessuno: vedi decisioni aperte) |
| Chiavi trovate ai piani 1 / 2 / 3 / 4 | 0,65 / 1,01 / 1,52 / 1,83 | 1,14 / 1,40 / 1,96 / 2,19 | — |
| Lucchetti per piano (dal piano 2) | 2,00 | 2,00 | — |
| Piani con lucchetti e **nessuna** chiave | 0 % | 0 % | 0 % |
| Piani con un lucchetto rimasto chiuso (piani 2 / 3 / 4) | 21 / 31 / 28 % | 8 / 13 / 11 % | ≈ 10 % |
| Run con almeno un lucchetto rimasto chiuso (4 piani) | 62,5 % | 28,7 % | — |
| Bombe per piano | 0,95-1,40 | 0,97-1,33 | — |
| Forzieri comuni / chiusi per piano | 0,5-0,7 / 0,2-0,4 | uguale | — |
| Consumabili a terra per piano | 0,95-1,45 | uguale | — |
| Bisca: valore di una giocata da 1 🪙 | 1,42 🪙 (netto +0,42) | 1,15 🪙 (netto +0,15) | poco sopra la parità |
| Bisca: 8 giocate, monete rese | 6,0 🪙 | 5,6 🪙 | — |
| Cartomante: costo atteso → valore | 3,73 → 3,80 🪙 | invariato | parità |
| Ceppo, 6 sacrifici | −6½, rende 2,1½ + 3,7 🪙 + 1,25 oggetti ≈ 13 🪙 | invariato | rischio pagato |
| Rovi (entrata + uscita) | −2½ (≈ 3 🪙), rende 2,1 🪙 + 0,35 oggetti ≈ 3,9 🪙 | invariato | parità |

Quanto spesso compaiono le stanze speciali nel piano: Sfida 27-42 %, Sacrificio 19-25 %, Rovi 13-32 %, Bisca 22-25 % (dal piano 2). Sono valori più bassi delle probabilità in tabella perché non sempre c'è posto in mappa.

I prezzi della Fucina (cuore 3, consumabile 2, base 5, forte 7) erano già quelli dell'autore e non sono cambiati. Con 6 monete al piano 1 si compra un Cuore (3) o un oggetto base (5); per l'oggetto forte (7) bisogna risparmiare per il piano 2.

## Correzioni (nella tabella del file che possiede il valore, con commento)

| Tabella | Valore | Prima → Dopo | Motivo |
|---|---|---|---|
| `ECONOMIA_T3.piano1.probMonetaAltre` (00-config.js) | probabilità che una moneta compaia al piano 1, fuori dalla segreta | 0,35 → 0,5 | Con 6 stanze di combattimento la media era 5,3, al bordo basso di 5-8, e un piano su 10 dava 1 moneta sola. Ora siamo a 6,1, più i rovi e le carte (≈ +0,4): circa 6,5, al centro dell'intervallo. |
| `BOMBE_CHIAVI_A1.drop.chiave` (a1-bombe-chiavi.js) | chiave alla pulizia di una stanza di combattimento | 0,09 → 0,16 | Dal piano 2 ci sono sempre 2 lucchetti per piano (tesoro e Fucina sono sempre vicoli ciechi). La chiave garantita ne copre uno solo, così il 21-31 % dei piani teneva chiusa una delle due porte. Ora è l'8-13 %, e le chiavi a inizio piano restano tra 1 e 2: non diventano abbondanti. |
| `STANZE_SPECIALI_A3.bisca.premi` (a3-stanze-speciali.js) | pesi dei premi del lotto | niente 0,45 / monete 0,3 / ½ 0,12 / cuore 0,08 / oggetto 0,05 → 0,54 / 0,28 / 0,1 / 0,05 / 0,03 | Il banco convertiva le monete in +42 % di valore: con 8 🪙 rendeva circa 11 🪙 di valore, quindi l'economia diventava abbondante. Ora rende +15 %: ha ancora il gusto della scommessa, ma non è più una miniera. |

Cosa non è cambiato e perché:
- **Ceppo dei Chiodi**: rende molto, circa 13 🪙 per 3 Maschere date, ma lo paga la salute. Le monete che porta sono poche (3,7) e non gonfiano l'economia.
- **Rovi e Cartomante**: sono già in parità.
- **Sfida**: dà un oggetto gratis, ma chiede la salute piena e regge le ondate.

## Strumenti

`gioco/teatro/sim-economia.js` era rotto. Cercava `ECONOMIA_T3` nell'HTML, mentre dalla divisione in file sta in `00-config.js`. Il suo modello era anche superato: contava 4 Predoni d'Oro nella segreta, che oggi non ha nemici ma 3-5 monete o un oggetto, e per questo stimava 9 monete dove il gioco ne dà 5,3. Ora delega a `tools/sim-bilancio-teatro.js`, così resta una sola fonte per i numeri.

## Cosa misurare nelle partite vere (Registro delle notti → X: esporta JSON)

Ogni run del registro ha `perPiano[n]` con questi campi: `monete`, `moneteSpese`, `bombe`, `chiavi`, `chiaviSpese`, `lucchetti`, `lucchettiAperti`, `dannoHalf`, `stanze`, `tempoMs`. Ha poi `danni` (fonte, mezze Maschere, piano, stanza), `sangueHalf`, `stanzeSpeciali`, `oggetti` e `consumabili`.

1. **Monete al piano 1** (`perPiano[1].monete`, nelle statistiche come `moneteMediePiano1`): da confrontare con 6,1. Se è molto più basso, l'autore non trova la segreta: la segreta da sola vale 3,3 monete.
2. **Lucchetti** (`perPiano[n].lucchettiAperti < lucchetti`): da confrontare con l'8-13 %. I forzieri chiusi aperti prima delle porte consumano chiavi (`chiaviSpese` contro `lucchettiAperti`).
3. **Monete spese per piano** (`moneteSpese`) contro quelle prese. Se dal piano 2 avanzano sempre più di 7 monete, l'economia dei piani 2-4 (13-15 a piano) è abbondante (vedi decisioni aperte).
4. **Stanze speciali**: `sangueHalf` per run e, nelle cause di morte, «il ceppo dei chiodi» o «i rovi della porta». Indicano se le stanze di sangue portano a morire, cosa che con `letale: false` non dovrebbe succedere.
5. **Cause di morte** (statistiche `causeMorte`): quali nemici o boss uccidono di più e a che piano, utile per la difficoltà.
6. **Tempo per piano** (`tempoMs`), per capire la durata di una notte.

## Decisioni aperte (per l'autore e il game-designer)

- **Piani 2-4 con 13-15 monete.** Il filtro di rarità vale solo al piano 1, e da sola la segreta dà 6,5 monete a piano. La Fucina costa in tutto circa 17 monete, quindi dal piano 2 si compra quasi tutto a ogni piano. Per ridurre servirebbe un campo nuovo in `ECONOMIA_T3`, per esempio un filtro per piano: è una modifica di codice, non di tabella, e non l'ho fatta.
- **Lucchetti.** Un'alternativa alla chiave più frequente è chiudere a chiave solo il tesoro (`BOMBE_CHIAVI_A1.lucchetti.tipi = ['tesoro']`), lasciando la Fucina sempre aperta come in molti roguelike a stanze. È una scelta di design e non l'ho fatta.
- **Effetti di notte non inclusi.** La simulazione usa la notte 1. Dalla notte 5, `NOTTI_C.probMonetaExtra` (0,3) aggiunge circa 0,3 monete per stanza ripulita: al piano 1 vale circa +0,9.
