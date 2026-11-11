# Bilancio del Teatro — controllo e3 (2026-11-11)

**Esito: CONCERNS.** Nessuna strategia che domina tutte le altre dopo le correzioni, ma restano fuori scala
da decidere (raggio cremisi, economia dei piani 2-4, durata della notte, trasformazioni rare).

Comando (prova ripetibile): `node tools/sim-bilancio-teatro.js gioco/teatro_marionette.html 200 4 --controllo`
(esce con 1 se un valore esce dalle `FASCE` in cima alla parte «combattimento» dello script).
Solo economia: `--solo-economia`. Numeri completi: `--json <file>`.

## Fonti lette
`00-config.js` (PERSONAGGI_GIOCABILI, POOL_BOSS, BOSS_FINALE, catalogo, STANZE_COMBATTIMENTO_PER_PIANO),
`20-stato.js` (ricalcolaStatistiche), `d2-personaggi.js` (STILI_D2), `b5-oggetti.js` (OGGETTI_B5.tetti),
`b4-trasformazioni.js` (TRASFORMAZIONI_B4, SINERGIE_B4), `b6-boss.js` (ROSA_B6, SCHEDE_B6, BOSS_B6),
`d1-burattinaio.js` (BURATTINAIO_D1), `t3-economia-salvataggi.js` (CONFIG.raggio), `d4-stanze-teatro.js`
(Buca, terna), `a1`/`a3` (tramite il simulatore dell'economia). Nessun GDD dà fasce numeriche al combattimento:
le fasce sono quelle della ricerca sul genere indicate dall'autore (boss 15 s - 2 min, notte 25-35 min) e
quelle fissate qui in `FASCE` (vanno confermate dall'autore).

## Come misura
Il combattimento non è una formula a mano: nel browser si parte una run vera per ogni personaggio, si svuota
una stanza, si mette un bersaglio fermo da 1e6 di vita (60 px; Taddeo 30 px, portata del maglio), si
equipaggiano gli oggetti col catalogo vero (`ricalcolaStatistiche` con gli involucri B4, B5, D2) e si tiene
premuta la freccia per 8 s di logica (Taddeo: anche a tocchi, vince il migliore). Oggetti «tipici»: estratti
a caso (seme fisso) fra i passivi base/forte non negativi. Il Raggio Cremisi si stima da `statoRun.dmg`
(12 impulsi/s × 0,18). Tempo per un boss = vita / (DPS × 0,55), con la dotazione di fine piano (2·piano − 1
oggetti). Notte = stanze × (vita nemici / (DPS × 0,45) + 9 s) + 5 stanze quiete × 14 s + boss + 15 s.
Il bersaglio fermo e le frazioni di tempo sono ipotesi dichiarate: la durata della notte è una stima.

## Numeri chiave (dopo le correzioni)

| Personaggio | DPS 0 ogg | 3 ogg p50/p90 | 6 ogg p50/p90 | DPS a inizio piano 1 / 2 / 3 / 4 | colpi di boss retti 0 / 6 ogg | notte stimata |
|---|---|---|---|---|---|---|
| Ferruccio | 9,6 | 14,6 / 17,9 | 21,7 / 42,6 | 9,6 / 12,9 / 17,0 / 21,7 | 3 / 4 | 16 min |
| Agnese | 12,3 | 18,7 / 23,0 | 23,3 / 64,1 | 12,3 / 16,6 / 20,2 / 23,3 | 2 / 3 | 15 min |
| Taddeo | 10,8 | 19,5 / 23,7 | 23,2 / 41,8 | 10,8 / 16,6 / 20,7 / 23,2 | 4 / 5 | 15 min |
| Ombra | 14,0 | 21,3 / 26,1 | 32,7 / 70,8 | 14,0 / 18,9 / 25,1 / 32,7 | 0 / 0 (muore al primo) | 14 min |

Tempo per abbattere i boss (s; Ferruccio / Agnese / Taddeo / Ombra): piano 1 (165-175 di vita) 27-28 / 21-22 /
22-23 / 18-19; piano 2 (260-280) 32-35 / 25-27 / 24-26 / 22-24; piano 3 (285-300) 27-28 / 24-25 / 24-25 / 18-19;
Donna Luciana (615) 47 / 45 / 46 / 31; Grande Burattinaio (455 delle parti + ~232 di marionette, intermezzi)
82 / 80 / 81 / 64. **Tutti nella fascia 15-120 s.** La vita dei boss sale meno del danno fra piano 2 e 3 (il
piano 3 dura meno del 2).

Monete (200 run): piano 1 media 7,3 (era 6,1: altre squadre hanno aggiunto fonti; resta in 5-8), piani
2 / 3 / 4: 15,4 / 16,5 / 17,4 (di cui la segreta 6,7-7,2). Prezzi Fucina: cuore 3, consumabile 2, base 5,
forte 7. Bisca: una giocata da 1 rende 1,15 (+15 %). Terna (3 🪙): valore atteso ≈ 2,9 🪙, appena sotto il
costo, come da tabella.

## Fuori scala trovati

| Cosa | Atteso | Misurato | Problema |
|---|---|---|---|
| Piombo + Bombarda + Cuore Sacro | ≤ ~5× la partenza | 7,5× (Taddeo 12,5×, Agnese 8,5×) | il pavimento della cadenza (0,85 colpi/s) annullava i malus: i moltiplicatori di danno (senza tetto) si sommavano gratis. **Corretto.** |
| Bombarda di Gaeta da sola | > 1× | 0,83× | toglieva danno a un bersaglio solo. **Corretto.** |
| Raggio Cremisi + moltiplicatori (Piombo + Anello, Bombarda + Cuore Sacro) | ≤ ~5× | 7-8,3× (Ferruccio, Taddeo, Ombra) | il raggio ignora la cadenza ma prende tutto `statoRun.dmg`: i malus di cadenza di Piombo e Bombarda non lo toccano, e trapassa. Valore del raggio scelto dall'autore il 2026-11-09: **proposta, non toccato.** |
| `dmgMult` statico | tetto | nessun tetto | il tetto `moltDanno 3,0` di B5 vale solo per i moltiplicatori dinamici. Un tetto statico è logica nuova: proposta. |
| Durata della notte | 25-35 min | ~14-16 min (stima) | la stima è più corta della fascia; da confrontare col Registro (`tempoMs`). Proposta. |
| Ombra | — | DPS 1,46× Ferruccio, 0 colpi retti | gli oggetti di vita (`bonusMaxHp`, cure) per lei non valgono nulla; le Maschere a terra diventano 2 🪙 a mezza: +4-8 🪙 a piano (cure a terra 2,2-3,8 mezze). Proposta sotto. |
| Taddeo con oggetti che cambiano i colpi | ≥ 1× | Triplo + Ragno + Venti 0,7×; Latte + Ranocchio 0,5× | i ventagli allargano solo l'arco del maglio e la cadenza è ×1,7: per lui gli oggetti di cadenza e ventaglio sono perdenti. Proposta. |
| Cappello del Mago | > 1× | 0× su bersaglio dritto | due diagonali e nessun colpo dritto: utile solo di traverso (misura del bersaglio fermo; non inutile in stanza). |
| Moccolo, Razzo di Piedigrotta, Ragno | ≥ 1× | 0,87-0,91× | su un bersaglio solo tolgono danno; valgono contro i gruppi (scoppi, ventaglio). Da guardare, non toccati. |
| Trasformazioni | ~25-40 % in una notte | 6-18 % con 8 oggetti a caso | Ombra (17 oggetti) 6 %, Bestia 7 %, Fili 9 %: rare; nessuna troppo facile. Proposta. |
| Economia piani 2-4 | ~Fucina (17 🪙) | 15-17 🪙 + Bisca, Buca, terna | si compra quasi tutto a ogni piano (già segnalato nel rapporto 7). |
| Buca dell'Orchestra senza danni | — | 6 🪙 + 2 reliquie (≈ 16 🪙) | per una stanza di 40-55 s vale un piano di monete; con la piroetta (invulnerabile) di Agnese è più facile. Non simulato (serve la probabilità di finire illesi): proposta. |

Strategie degeneri: nessuna «resta fermo nell'angolo» misurabile senza un bot che schivi (non verificato).
«Compra sempre la stessa cosa»: la Fucina ha prezzi piatti, il cuore a 3 è la scelta sicura per tutti tranne
l'Ombra (per lei il cuore è inutile).

## Correzioni fatte (numeri, nessuna logica nuova)

| Dove | Prima → dopo | Perché |
|---|---|---|
| `20-stato.js` `ricalcolaStatistiche`, pavimento di `cadenzaEff` (e lo stesso in `b4-trasformazioni.js` dopo le sinergie) | 0,85 → 0,5 colpi/s | Piombo + Bombarda + Cuore Sacro: 7,5× → 4,3× (Taddeo 12,5× → 8,3×, Agnese 8,5× → 4,9×). Gli oggetti presi da soli non cambiano (stanno sopra 0,85). |
| `00-config.js` Bombarda di Gaeta `cadenzaMult` (e testo) | ×0,3 → ×0,36 | da sola dava 0,83× il danno di partenza; ora 0,95×, più colpi enormi ed esplosivi: non più «mai conveniente». |

## Proposte per l'autore (decisioni sue)
1. **Raggio Cremisi**: farlo pagare dalla cadenza (es. danno per impulso × min(1, colpi/s ÷ 2,73)) oppure non
   fargli prendere i `dmgMult` dei colpi giganti. Oggi con Piombo + Anello fa 8× la partenza.
2. **Tetto statico del danno** (es. `dmgMult` complessivo ≤ 4): chiude tutte le pile di moltiplicatori.
3. **Ombra**: gli oggetti di vita le danno al loro posto +0,3 danno per mezza Maschera o una «grazia» per
   stanza (il primo colpo la ferma ma non la uccide), così prenderli non è una carta bruciata.
4. **Taddeo**: gli oggetti di cadenza gli riducono il `cadenzaMult` 1,7 del maglio (es. metà dell'effetto), i
   ventagli aggiungono danno all'arco oltre all'ampiezza.
5. **Durata della notte**: se il Registro conferma ~15 min, alzare la vita dei boss dei piani 3-4 o le stanze
   per piano (6-9), non la vita dei nemici normali.
6. **Buca senza danni**: raddoppiare solo le reliquie, non le monete (`premio.monete` 3 → 2 se si vuole
   restare sulla tabella).
7. **Trasformazioni**: soglia 3 per i temi grandi, 2 + 1 «jolly» per Ombra/Bestia/Fili, o più oggetti per tema.
8. **Fasce del `--controllo`**: confermare le `FASCE` (soprattutto `comboMaxSuPartenza` 9 e la notte).

## Non verificato
Bersaglio fermo (nessuna schivata, nessun boss che si sposta o diventa intoccabile); il Raggio è stimato e non
misurato; i famigli che seguono e le orbite contano solo se colpiscono il bersaglio fermo; la probabilità di
finire la Buca illesi; la notte oltre la prima (`NOTTI_C`); oggetti attivi e consumabili.

---

## Storico: rapporto del miglioramento 7 (2026-11-09, economia)


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
