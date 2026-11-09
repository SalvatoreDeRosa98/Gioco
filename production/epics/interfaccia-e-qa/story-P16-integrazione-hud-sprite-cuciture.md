# Story P16: Integrazione delle squadre HUD, sprite e cuciture (fusione dei rami P13, P14, P15)

> **Epic**: Interfaccia e QA
> **Status**: Done
> **Layer**: composizione (`avvio.js`), resa (`renderer.js`), contenuti (`resa.json`), QA (`pacchetto.test.js`, `resa.wire.test.js`,
> `oggetti.wire.test.js`), documentazione (`gioco/README.md`)
> **Type**: Integration
> **Estimate**: S
> **Manifest Version**: N/A
> **Last Updated**: 2026-11-09
> **Fonde**: P13 (ramo `worktree-wf_4ffb60f7-7d7-1`), P14 (`worktree-wf_4ffb60f7-7d7-2`), P15 (`worktree-wf_4ffb60f7-7d7-3`)

## Context

**Requirement**: passo di integrazione del porting del Teatro. Tre squadre hanno lavorato in parallelo su worktree separati, ognuna con
un commit sul proprio ramo, partendo dallo stesso commit `35b0a88`: H-hud (HUD DOM completo del Teatro), S-sprite (fogli PNG dell'autore
ovunque), C-cuciture (segreta che combatte con i predoni dorati, esplosione della Bomba Ferma che apre la Crepa, Tamburello con
`cancellaInRaggio`, un solo evento `nemico.esplosione`). Il risultato deve tenere tutto di tutte e tre senza perdere nulla, con tutte le
suite verdi, le evidenze rigenerate e guardate, e i due pacchetti a file unico prodotti e verificati.
**Vincoli**: nessun numero di gioco nel codice, nessun `Math.random`, il renderer legge e non muta, nessun segno a terra, meta
`gioco-avvio` = `debug=1` (l'hub di Piazza Dante non si salta).

## Acceptance Criteria

- [x] **Given** i tre rami, **When** si fondono in ordine H → S → C con `git merge --no-ff`, **Then** nessun blocco di nessuna squadra
  va perso: `avvio.js` passa al renderer sia `barraBossNelRenderer: false` sia `sprite`/`catalogo`; `renderer.js` accetta entrambi i
  parametri; `resa.json` ha sia `hud` sia `sprite`; il README unisce le voci di tutte e tre.
- [x] **Given** la P15 (un solo evento `nemico.esplosione`), **When** si fonde con il blocco dei fondali della P14 nello stesso punto di
  `avvio.js`, **Then** il ponte `nemico.esplosione → bomba.esplosione` sparisce e i fondali restano (`grep bomba.esplosione gioco/motore`
  trova solo il commento che lo dice).
- [x] **Given** il codice fuso, **When** si lanciano tutte le suite, **Then** sono tutte verdi: 25 suite node:test (`architettura` 6,
  `attivi` 8, `audio` 13, `boss-provvisorio` 5, `boss` 19, `combattimento` 39, `condizioni` 37, `doni.integrazione` 9, `doni` 27,
  `economia` 14, `feel` 7, `fili` 4, `fondazione` 29, `hud` 8, `impatti` 6, `incontri` 23, `mondo` 24, `nemici` 35, `notte` 9, `oggetti` 14,
  `patto` 15, `prova` 3, `ricordi` 9, `sprite` 5, `statistiche` 11), `parametri.test.js`, `pagina.test.js`, 17 suite `*.wire.test.js`,
  `vetrina.test.js`, `pacchetto.test.js` 9/9, `stati64` (0 conflitti), `seme 200` (0 violatori), `grep Math.random` vuoto.
- [x] **Given** il pacchetto prodotto da `tools/impacchetta.js`, **When** si apre senza parametri, **Then** compare il menu di selezione
  con l'HUD nascosto e zero errori (`pacchetto-menu.png`); **When** si apre con `?personaggio=agnese&slot=1&piano=1`, **Then** la stanza
  mostra i fogli PNG (pavimento dal foglio, nessun foglio in errore) e l'HUD DOM del Teatro con il nome di Agnese e le sue immagini
  caricate, zero errori (`pacchetto-agnese.png`).
- [x] **Given** l'hub di Piazza Dante, **When** lo fotografa `resa.wire.test.js`, **Then** si vede disegnato dal renderer pixel-art con i
  fogli `hub-*` (Tonino al banco, porta di Gaetano, colonne, lanterne, ingresso al piano 1) e non è coperto dal pannello dei tasti
  (`resa-hub.png`).
- [x] **Given** la segreta della P15, **When** la fotografa `oggetti.wire.test.js`, **Then** l'HUD dice «Stanza segreta» e i predoni
  dorati sono a schermo senza il pannello dei tasti davanti (`segreta-predoni.png`).
- [x] **Given** l'albero fuso, **When** si guardano `index.html` e `prova.html`, **Then** la meta `gioco-avvio` è solo `debug=1`.
- [x] **Given** la fusione, **When** finisce, **Then** i worktree sono rimossi e i rami cancellati.

## Evidenza

- `production/qa/evidence/pacchetto-menu.png`, `pacchetto-agnese.png` (casi nuovi di `pacchetto.test.js`, guardati).
- `production/qa/evidence/resa-hub.png` (hub pixel-art senza pannello), `hud-slot-pieno.png` (scheda, dock con l'icona PNG del dono,
  minimappa, fogli dei muri), `segreta-predoni.png` (guardati).
- Tutte le altre evidenze rigenerate dalla corsa completa delle suite sul codice fuso e committate con questa storia (regola della P15:
  i PNG di Chromium non sono deterministici al byte).

## Decisioni

1. **Ordine di fusione H → S → C**, come indicato; i PNG di evidenza in conflitto sono stati presi dal ramo in arrivo e poi comunque
   rigenerati dalle suite sul codice fuso.
2. **`avvio.js`**: nel blocco di `creaRenderer` entrambe le opzioni (`barraBossNelRenderer: false` della P13; `sprite`, `catalogo` della
   P14). Nel punto dei fondali: fondali della P14 conservati, ponte `bomba.esplosione` tolto come chiede la P15 (feel, audio e segreta
   ascoltano già `nemico.esplosione`).
3. **`resa.json`**: descrizione unita e chiavi `hud` + `sprite` entrambe presenti (JSON valido, `parametri.test.js` verde).
4. **README**: riga della P04/P09 nella versione della P15 (più completa) più la riga della P13; voci di `hud.test.mjs` e
   `hud.wire.test.js` insieme al commento della P15 su `suite-completa.sh`; `renderer.js`/`sprite.js`/`pixel-sprites.js` nella struttura.
5. **Pannello dei tasti in `index.html`** (P13): le suite che fotografano la scena lo chiudono con un `pointerdown` sulla finestra (lo
   stesso gesto del giocatore; non raggiunge il cartiglio), così l'evidenza mostra il gioco e non il pannello. Non si tocca `prova.js`.
6. **Verifica del pacchetto** come test (`pacchetto.test.js`, due casi nuovi) e non come script a perdere.
7. Nessuna modifica al motore oltre alla fusione: non c'era niente da correggere, tutte le suite erano verdi al primo colpo dopo i merge.
