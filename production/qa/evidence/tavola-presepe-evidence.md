# Evidenza — Story 000: tavola di qualità visiva del presepe d'ombre

**Tipo**: Visual/Feel (gate BLOCKING, sign-off dell'autore)
**Sorgente**: `prototypes/tavola-presepe/index.html` (Canvas 2D, un solo file, `?variante=A|B|C`)
**Catturato**: 2026-11-07, Playwright/Chromium headless, viewport 1280×720, deviceScaleFactor 1, `file://`

## Screenshot conservati

| File | Cosa |
|---|---|
| `production/qa/evidence/tavola-presepe-A.png` | Variante A — calda e teatrale |
| `production/qa/evidence/tavola-presepe-B.png` | Variante B — più scura e contrastata |
| `production/qa/evidence/tavola-presepe-C.png` | Variante C — più fondale e profondità (quinte aperte) |
| `production/qa/evidence/tavola-presepe-A-grigi.png` | Variante A con filtro grayscale (prova di leggibilità: crema di Ferruccio, inchiostro dei gatti, flash bianco e HUD restano distinti; l'anello rosso del lampo sparisce, restano anello crema, posa accucciata e corridoio a terra) |

## Luminanze misurate (relative WCAG, pixel singolo sullo screenshot a dpr 1)

| Variante | Centro pavimento (640,360) | media 5×5 | Pozza lanterna (400,300) | Angolo pavimento BD (1030,560) | Parete nord (640,110) | Camicia Ferruccio | Dorso gatto |
|---|---|---|---|---|---|---|---|
| A | **0,212** | 0,188 | 0,302 | 0,057 | 0,293 | 0,78 | 0,006 |
| B | **0,163** | 0,132 | 0,337 | 0,028 | 0,286 | 0,78 | 0,007 |
| C | **0,192** | 0,168 | 0,275 | 0,049 | 0,293 | 0,78 | 0,005 |

Fascia richiesta dall'art bible §2/§4 per il pavimento: L 0,12–0,30 (obiettivo Piazza Dante
0,16–0,22). Il pixel centrale è dentro in tutte e tre le varianti. Gli angoli scendono sotto
0,12 per scelta di tavola (riflettore + vignetta): deviazione dichiarata, regolabile.

Contrasti al centro: inchiostro su pavimento 5,0:1 (A) · 4,1:1 (B) · 4,6:1 (C);
crema di Ferruccio su pavimento 3,2:1 · 3,9:1 · 3,4:1.

## Tempi di disegno (raster software headless, media di 60 draw, dpr 1)

A 14,0 ms · B 13,3 ms · C 15,6 ms con flush; 1–2 ms di soli comandi. Precalcolo all'avvio:
carta 61–86 ms, fondale 15–21 ms, sfondo 2 ms, grana 3–6 ms, vignetta 2 ms. Dettaglio per
tecnica e piano per il budget di 6 ms in `prototypes/tavola-presepe/README.md`.

## Esito

**Variante approvata: in attesa dell'autore.**
