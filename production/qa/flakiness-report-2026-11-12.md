# Rapporto prove instabili — Teatro (skill test-flakiness), 2026-11-12

Suite Playwright `tools/qa-teatro-*.js`, eseguite una alla volta a carico 1-18 (più squadre in parallelo).
Cause: **a** attesa a tempo reale · **b** soglia di prestazione assoluta · **c** dipendenza dal caso · **d** guasto vero del gioco.
**Guasti veri del gioco trovati: nessuno.** Tocco e pubblico, che non si erano più visti verdi, sono verdi
sul codice attuale (tocco 88/88 per tre volte sulla release, verificato dal coordinatore).

| Suite | Caso | Causa | Cosa è cambiato | Stato |
|---|---|---|---|---|
| errori | «il gioco va avanti» (tick in 600 ms), fusibile, gestore | a | si aspetta la condizione (21 tick, ombre spente, errore registrato) con un tetto largo | stabile |
| tocco | sparo-destra-dominante, sparo-continua, due dita, bomba | a | `waitForFunction` sulla condizione (direzione cambiata, +2 colpi…) | stabile |
| tocco | conferma/indietro-riprende, opacità/mano/vibrazione | a | i bottoni tenuti 70 ms superavano a carico i 340 ms della ripetizione dei menu (contavano due volte): dito alzato subito, il gioco li tiene comunque per un fotogramma (`lampo` di c2); attese dopo l'azione anche in fotogrammi | stabile |
| tocco | levetta-intensita | a | velocità in pixel per tick di gioco, non per ms reale | stabile |
| tocco | nemici di prova | c | posizioni fisse al posto di `Math.random` | — |
| oggetti200 | tick + frame < 16 ms | b | mediana di 900 campioni (la media la gonfiano i fotogrammi sospesi: 1,9 → 11 ms); media con `QA_TEMPI=stretti` | stabile |
| ribalta | errore `reading 'hp'` (9d) | c | dopo il crollo del boss la stanza poteva non avere nemici vivi: si aggiunge un bersaglio di prova (mai Bozzo né maschera) | stabile |
| immagini (release) | 6 `ERR_FILE_NOT_FOUND` | prova | sono le immagini SCARTATE accese apposta dalla fase PROVA; la release giustamente non le incorpora. Il controllo toglie solo quelle e stampa l'indirizzo di ogni altra richiesta fallita | stabile |
| personaggi | bersaglio da 900 PF a 0 dopo un colpo | c | il filtro guardava `patternMob ‖ tipo`, il gioco `comportamento ‖ tipo`: un nemico col comportamento del Bozzo passava e scoppiava; ora esclusi tutti e tre + seme fisso della stanza | stabile |
| trasformazioni | lampo acceso all'annuncio | a | il lampo dura 18 tick: controllo a ciclo fermo (`fermaCiclo`) e passi contati | stabile |
| trasformazioni | costo disegno b4 < 1,5 ms | b | mediana di 20 blocchi (media con `QA_TEMPI=stretti`) | stabile |
| morte | cartiglio-chiuso, doppio-colpo, bomba, watchdog | a | durata in tick di gioco (< 360 = 6 s); watchdog riconosciuto dal suo avviso di ritorno forzato; ms reali con `QA_TEMPI=stretti` | stabile |
| pubblico | costo del pubblico ≤ 2/3 ms | b | relativo al frame senza pubblico nella stessa pagina (≤ 20% / 30%); ms con `QA_TEMPI=stretti` | stabile |
| pubblico | apertura del sipario ≤ 1,2 s, «a metà apertura» | a | durata misurata nella pagina (da `inizioMs`), si aspetta che l'apertura sia partita | stabile |
| boss-nuovi | `*:attacco-visto` | a | stati del boss registrati a ogni passo di logica nella pagina (non letti da Node ogni 16 ms) | stabile |
| burattinaio | marionette-cadute | a | cambio d'atto a ciclo fermo e passi contati, controllo nello stesso tick | stabile |
| comandi | pad-levetta-ripetizione | c | corretta dal coordinatore (righe lette dal gioco) | stabile |

## Restano da guardare (non toccate)
- **stanze-teatro** (ondate della Buca ai tick attesi), **registro-scena** (`gamepad`), **avvio** (`dopo-morte`):
  non riprodotte rosse da sole in questo giro; probabilmente causa **a** (attese reali). Da rifare con
  `aspettaCondizione`/`passi`/`fermaCiclo` se tornano rosse.
- Restano molte `waitForTimeout` dopo le azioni (tocco ne usa `aspetta`, le altre no): sono attese «per la
  foto», non controlli; si convertono quando un caso vicino fallisce.
- La sequenza di morte e l'apertura del sipario sono a tempo reale **per progetto** (`performance.now`):
  le soglie in ms reali restano con `QA_TEMPI=stretti`.

## Attrezzi
- `tools/qa-teatro-comune.js`: `aspettaCondizione`, `aspetta` (ms reali + fotogrammi), `aspettaFotogrammi`,
  `fermaCiclo`, `passi`, `leggiTick`, `mediana`, `TEMPI_STRETTI`.
- `tools/qa-teatro-tutte.sh [html] [cartella]`: tutte le suite una alla volta, una riga per suite, esce 1 se una
  è rossa; `QA_SUITE`, `QA_TETTO`, `QA_TEMPI=stretti`; rimette a posto le foto tracciate di `c` e `d`.
- Non c'è un `tests/regression-suite.md` con quarantena: nessuna suite messa in quarantena.
