# Prototipo: Ferruccio «nativo» per R36S

**Ipotesi da provare.** Il Teatro delle Marionette (`gioco/teatro_marionette.html`, script classici e
Canvas 2D) può girare senza browser su una console R36S (ArkOS, aarch64, 1 GB, niente browser) usando
Node.js + un Canvas 2D nativo (Skia, `@napi-rs/canvas`) + SDL2 (`@kmamal/sdl`), senza toccare i file del
gioco, a una velocità giocabile (30 fotogrammi al secondo).

**Stato.** In corso (secondo giro). Sulla console vera il pacchetto v1 parte ma fa circa 5 fotogrammi
al secondo; il v2 (tre livelli di qualità, misura automatica) è da provare sulla console.

**Risultati finora.** Fattibile senza toccare il gioco; troppo lento a risoluzione piena su un Cortex-A35
(fattore vero ×30-40 rispetto al PC di prova, non ×8 come stimato). Dettagli, misure e attese in `RAPPORTO.md`.

## Come si usa (su un PC Linux con Node 22)

```sh
cd prototypes/r36s-nativo
npm install                         # canvas nativo, SDL, font DejaVu
node lanciatore/prova.js            # prova automatica: menu → hub → piano 1 → stanza; PNG in uscita/
node lanciatore/prova.js --misura --sdl   # tempi per fotogramma, effetti accesi/spenti, stanza pesante
node lanciatore/prova.js --livelli        # i tre livelli a confronto, con foto ingrandite in uscita/
node lanciatore/prova.js --misura --ablazione   # quanto costa ogni tipo di disegno (saltandolo)
node lanciatore/avvia.js --livello=medio  # gioca a un livello (bello, medio, veloce)
node lanciatore/avvia.js            # gioca in una finestra SDL (tastiera o gamepad)
./prepara-font.sh                   # copia in lanciatore/font i font dei testi e dei simboli
./prepara-pacchetto.sh              # scarica node e i moduli per linux-arm64 e monta pacchetto/ e lo zip
```

## File

| File | Cosa fa |
|---|---|
| `lanciatore/finto-browser.js` | lo strato che finge il browser: `window`, `document`, `Image`, `localStorage` su file, gamepad «standard», eventi; carica gli script del gioco nell'ordine dell'HTML in un solo contesto |
| `lanciatore/avvia.js` | ciclo in tempo reale, log con errori e fotogrammi al secondo |
| `lanciatore/uscita-sdl.js` | schermo (640×480 con bande nere), controller, tastiera; Start+Select per uscire |
| `lanciatore/prova.js` | prova automatica con foto, misura dei tempi, ablazione, confronto dei livelli; `--console` è la misura che gira sulla console |
| `lanciatore/livelli.js` | i tre livelli: scala interna, fotogrammi voluti, tagli di scena |
| `lanciatore/macchina.js` | CPU, regolatore di frequenza e memoria, per i log |
| `modello-pacchetto/` | script di lancio PortMaster, impostazioni «leggere», istruzioni |
| `prepara-pacchetto.sh` | monta `pacchetto/` (fuori da git) e lo zip da consegnare |
| `RAPPORTO.md` | ricerca, misure, stima, limiti, raccomandazione |

## Risultati

Vedi `RAPPORTO.md`. Regola dei prototipi: questo codice non entra nel gioco; se l'idea regge, si
riscrive con gli standard di produzione.
