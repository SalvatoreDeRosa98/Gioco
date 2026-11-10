# Prototipo: Ferruccio «nativo» per R36S

**Ipotesi da provare.** Il Teatro delle Marionette (`gioco/teatro_marionette.html`, script classici e
Canvas 2D) può girare senza browser su una console R36S (ArkOS, aarch64, 1 GB, niente browser) usando
Node.js + un Canvas 2D nativo (Skia, `@napi-rs/canvas`) + SDL2 (`@kmamal/sdl`), senza toccare i file del
gioco, a una velocità giocabile (30 fotogrammi al secondo).

**Stato.** In corso. Su questa macchina (x86-64) il gioco vero parte, arriva al menu, all'hub e alle
stanze del piano 1 senza errori; le misure e la stima per la console stanno in `RAPPORTO.md`.
Sulla console non è stato provato niente: può farlo solo l'autore, col pacchetto.

## Come si usa (su un PC Linux con Node 22)

```sh
cd prototypes/r36s-nativo
npm install                         # canvas nativo, SDL, font DejaVu
node lanciatore/prova.js            # prova automatica: menu → hub → piano 1 → stanza; PNG in uscita/
node lanciatore/prova.js --misura --sdl   # tempi per fotogramma, effetti accesi/spenti, stanza pesante
node lanciatore/avvia.js            # gioca in una finestra SDL (tastiera o gamepad)
./prepara-pacchetto.sh              # scarica node e i moduli per linux-arm64 e monta il pacchetto PortMaster
```

## File

| File | Cosa fa |
|---|---|
| `lanciatore/finto-browser.js` | lo strato che finge il browser: `window`, `document`, `Image`, `localStorage` su file, gamepad «standard», eventi; carica gli script del gioco nell'ordine dell'HTML in un solo contesto |
| `lanciatore/avvia.js` | ciclo in tempo reale, log con errori e fotogrammi al secondo |
| `lanciatore/uscita-sdl.js` | schermo (640×480 con bande nere), controller, tastiera; Start+Select per uscire |
| `lanciatore/prova.js` | prova automatica con foto e misura dei tempi |
| `modello-pacchetto/` | script di lancio PortMaster, impostazioni «leggere», istruzioni |
| `prepara-pacchetto.sh` | monta `pacchetto/` (fuori da git) e lo zip da consegnare |
| `RAPPORTO.md` | ricerca, misure, stima, limiti, raccomandazione |

## Risultati

Vedi `RAPPORTO.md`. Regola dei prototipi: questo codice non entra nel gioco; se l'idea regge, si
riscrive con gli standard di produzione.
