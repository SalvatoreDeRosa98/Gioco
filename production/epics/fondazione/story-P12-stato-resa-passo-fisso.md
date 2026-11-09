# Story P12: Audit di architettura — «lo stato non disegna, la resa non muta», passo fisso e tetto verificati a 120 Hz

> **Epic**: Fondazione (passo F4 del porting del Teatro, richiesta dell'autore)
> **Status**: Done
> **Layer**: stato (`attori/combattimento.js`, `mondo/camera.js`, `attori/ia/base.js`, `attori/boss/*`), resa (`resa/impatti.js` e `resa/trasformazioni.js` nuovi, `resa/renderer.js`, `resa/debug.js`), contenuti (`resa.json › impatti`), QA (`architettura.test.mjs`, `impatti.test.mjs`, `fondazione.test.mjs`, `pagina.test.js`)
> **Type**: Logic (+ verifica visiva del passo fisso)
> **Estimate**: S
> **Manifest Version**: N/A
> **Last Updated**: 2026-11-09

## Context

**Richiesta dell'autore (passo F4)**: (a) separazione netta fra **stato** e **resa**: i file di stato manipolano solo numeri ed
eventi; tutto ciò che è visivo (Canvas, gradienti, Bézier, sprite, colori, fotogrammi) sta in `motore/resa/`; (b) il motore gira a
**passo fisso** con **tetto di tick per frame**, che è la soluzione corretta al problema dei monitor a 120 Hz: verificarlo con un
test a 120 Hz simulati.

**Audit (grep su `getContext`, `fillStyle`, `Path2D`, `ctx.`, colori `#…`, `frameSpada`, `esplosioni`, DOM) — cosa era finito nello
stato durante il porting del prototipo:**

| Dove | Cosa | Destinazione |
|---|---|---|
| `attori/combattimento.js › frameSpada()` | indice 0..5 del fotogramma dello stocco dalle soglie `2/2/3` scritte nel codice | `resa/impatti.js › frameSpada(combattimento)`; lo stato espone il numero `faseTicks`; soglie in `resa.json › impatti.spada_*` |
| `attori/combattimento.js › esplosioniProiettili` | lista di splash `{x, y, tick, maxTick: 12, tipo}` fatta avanzare nel tick dello stato | evento `ferruccio.proiettile_spento` {x, y, tipo, causa: muro\|bersaglio\|portata}; registro e fotogrammi in `resa/impatti.js` (`splash_frame_ticks` × 3 sprite = 12 tick) |
| `attori/combattimento.js › scintilleFulmine` | segmenti dei fulmini a catena `{x1, y1, x2, y2, tick, maxTick: 6}` | evento `ferruccio.fulmine` {x1, y1, x2, y2}; alpha = 1 − età/`fulmine_ticks` in `resa/impatti.js` |
| `mondo/camera.js › applica(ctx)` | `ctx.translate`/`ctx.scale` dentro un modulo di `mondo/` | `resa/trasformazioni.js › applicaCamera(ctx, camera, scena)` (renderer e debug); la camera espone solo `scala` e `scorrimento()` |
| `attori/ia/base.js`, `attori/boss/*.js`, `mondo/generazione.js`, `oggetti/catalogo.js` | parametro `ctx` (contesto dell'IA / delle opzioni, non un contesto Canvas) che confondeva il grep | rinominato `contesto` |

Niente altro: `oggetti/*`, `storia/*`, `persistenza/*`, `mondo/stanza.js`, `attori/ferruccio.js`, `attori/nemico.js` erano già puri
(nessun DOM, nessun colore, nessuno sprite). Il comportamento a schermo non cambia: i fotogrammi e le durate sono gli stessi
(l'orologio della resa è `contaTick`, che avanza dopo il tick come faceva il contatore di prima). `__gioco.combattimento` perde
`frameSpada`, `esplosioniProiettili` e `scintilleFulmine` (nessun test li usava) e guadagna `faseTicks`; `__gioco.resa.impatti()`
conta gli effetti nel registro della resa.

**Passo fisso (b)**: `fondazione/tempo.js` ha `PASSO_MS` = 1000/60 e `MAX_TICK_PER_FRAME` = 5 (dt reale limitato a 83 ms, il resto
scartato); `ciclo.js` esegue i tick dovuti e disegna una volta per frame con `alpha`. Il renderer non interpola ma non dipende dal
refresh: il suo tempo è `contaTick()`; le sole durate «per frame disegnato» sono le scosse di `resa.scossa` (storia P08, scelta
dell'autore). Le regole sono ora nel README (`Regole del codice › «Lo stato non disegna, la resa non muta»` e `Passo fisso e tetto
dei tick`) con l'elenco dei moduli dei due lati.

---

## Acceptance Criteria

- [x] **GIVEN** i file di `attori/`, `mondo/`, `oggetti/`, `storia/`, `persistenza/` senza commenti, **THEN** nessun `getContext`,
      `fillStyle`, `strokeStyle`, `Path2D`, `ctx.`, `drawImage`, `globalAlpha`, gradiente, `fillRect`, `beginPath`, curva di Bézier,
      colore esadecimale, `document.`/`window.`/`requestAnimationFrame`, `frameSpada`, `splashN`, `SPRITE_` (`architettura.test.mjs`).
- [x] **GIVEN** i file di `resa/`, **THEN** nessun import da `attori|mondo|oggetti|storia|persistenza`, nessun `.tick(`, nessuna
      assegnazione a campi di `ferruccio|combattimento|camera|notte|campo`, nessun `performance.now`/`Date.now`.
- [x] **GIVEN** tutto `motore/`, **THEN** zero `Math.random` (test + `grep -rn "Math.random" gioco/motore` vuoto).
- [x] **GIVEN** `creaImpatti` con bus e tick finti, **WHEN** arriva `ferruccio.proiettile_spento`, **THEN** lo splash mostra i fotogrammi
      0, 1, 2 per `splash_frame_ticks` tick ciascuno e sparisce a 3 × `splash_frame_ticks` (= 12, come la lista di prima); `ferruccio.fulmine`
      sfuma con alpha 1 − età/`fulmine_ticks` e sparisce a `fulmine_ticks` (= 6); `frameSpada` dà gli stessi 0..5 della funzione di prima
      per ogni combinazione di stato/fase/faseTicks (`impatti.test.mjs`).
- [x] **GIVEN** una camera con `scala` 0,5 e scorrimento (10, −4) su una scena 1280×720, **THEN** `applicaCamera` fa
      `translate(650, 356)`, `scale(0.5, 0.5)`, `translate(−640, −360)`; senza camera non tocca il contesto.
- [x] **GIVEN** il ciclo con orologio finto (`fondazione.test.mjs`), **WHEN** 1 s passa in 60 frame da 16,67 ms, 120 da 8,33 ms o 144,
      **THEN** i tick sono 60 (±1 a 144) e la x di un corpo che integra `v·dt` è identica a 60 e 120 Hz; 121 frame disegnati a 120 Hz;
      un frame di 1000 ms esegue 5 tick e il resto non si recupera.
- [x] **GIVEN** la pagina vera `?debug=1&piano=1&seme=1845` con `requestAnimationFrame` finto installato prima degli script
      (`pagina.test.js`), **WHEN** si tiene `destra` e si simulano 120 frame da 8,33 ms oppure 60 da 16,67 ms, **THEN** 60 tick in
      entrambi i casi e la stessa x/y di Ferruccio (855,11; 360); screenshot `production/qa/evidence/fondazione-passo-fisso.png`.
- [x] **GIVEN** il combattimento alla Isaac (`combattimento.test.mjs`), **WHEN** un proiettile uccide un fantoccio, **THEN** arriva
      `ferruccio.proiettile_spento` con `causa: 'bersaglio'` e numeri finiti; `faseTicks` è un numero; `frameSpada`,
      `esplosioniProiettili`, `scintilleFulmine` non sono nella superficie dello stato.
- [x] Tutte le suite verdi dopo lo spostamento (Evidence).

## Implementation Notes

- `resa/impatti.js`: `creaImpatti({ parametri, eventi, contaTick, nSplash })` → `splash()`, `fulmini()`, `frameSpada(c)`, `conteggio()`.
  Il renderer lo crea accanto a `fili` e gli passa `SPLASH.length` (gli sprite `splash0..2` di `pixel-sprites.js`).
- `resa/trasformazioni.js`: `applicaCamera(ctx, camera, scena)`; `renderer.js` e `debug.js` la chiamano al posto di `camera.applica`.
- `resa.json › impatti`: `splash_frame_ticks` 4, `fulmine_ticks` 6, `spada_startup_ticks` 2, `spada_attivo_ticks` 2, `spada_recupero_ticks` 3
  (tutti {base, min, max}; i test li leggono dal JSON).
- Rinomina meccanica `ctx` → `contesto` (`\bctx\b`) in `attori/ia/base.js`, `attori/boss/*.js`, `attori/nemico.js` (commento),
  `mondo/generazione.js`, `oggetti/catalogo.js`.
- Fuori dall'ambito (annotato, non toccato): la palette `P` del renderer è ancora esadecimale nel codice (va portata ai token CSS); i
  fallback numerici `?? 3.9` ecc. in `combattimento.js › spara` sono numeri di gioco nel codice da togliere quando `personaggi.json`
  coprirà tutti i personaggi; `tAnim = contaTick() / 60` nel renderer usa la frequenza dei tick come costante.

## Evidence

- `node gioco/qa/architettura.test.mjs` → 6/6; `node gioco/qa/impatti.test.mjs` → 6/6; `node gioco/qa/fondazione.test.mjs` → 29/29;
  `node gioco/qa/combattimento.test.mjs` → 38/38; `node gioco/qa/pagina.test.js` → 6/6 (60 Hz e 120 Hz: tick 60, x 855,11, y 360).
- `production/qa/evidence/fondazione-passo-fisso.png` (pagina a 120 Hz simulati dopo 1 s con `destra` tenuta, guardato).
- `bash gioco/qa/suite-completa.sh` (tutte le suite, stati64, seme 200, grep Math.random) → vedi il commit della storia.
