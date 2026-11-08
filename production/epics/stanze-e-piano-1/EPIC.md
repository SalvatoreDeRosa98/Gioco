# Epic: Stanze e piano 1

> **Layer**: Core
> **GDD**: design/gdd/stanze-porte.md, design/gdd/generazione-piani.md
> **Architecture Module**: motore/mondo
> **Status**: Ready
> **Stories**: 5 storie (sotto)

## Overview

La singola stanza (porte che si chiudono, ostacoli, pericoli in sagoma, ondate, ricompense) e il piano 1 di Piazza Dante generato dal seme con cammino critico, tesoro, banchetto, stanza-ricordo della targa, stanza del boss e segreta, da quattordici modelli fatti a mano.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0003 | vedi `docs/architecture/adr-0003.md` | LOW |
| ADR-0005 | vedi `docs/architecture/adr-0005.md` | LOW |
| ADR-0006 | vedi `docs/architecture/adr-0006.md` | LOW |

## GDD Requirements

*(Il TR registry non è stato ancora generato da `/architecture-review`: i requisiti sono citati per sezione del GDD. NOT ASSESSED finché la review non assegna i TR-ID.)*

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| NOT ASSESSED | I requisiti sono le regole numerate e i criteri Given-When-Then dei GDD citati sopra | ADR-0003, ADR-0005, ADR-0006 (Proposed) |

## Definition of Done

- Tutte le storie implementate, riviste e chiuse con `/story-done`
- Tutti i criteri di accettazione dei GDD citati verificati
- Le storie Logic e Integration hanno test in `gioco/qa/` che passano
- Le storie Visual/Feel e UI hanno screenshot conservati in `production/qa/evidence/`

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 014 | Stanza da modello JSON: porte, ostacoli, ondate | Logic | Done | ADR-0003 |
| 015 | Transizioni di stanza e camera | Integration | Done | ADR-0003 |
| 016 | Generazione del piano 1 dal seme con vincoli e validatore | Logic | Done | ADR-0003 |
| 017 | Quattordici modelli di stanza del piano 1 | Config/Data | Done (3 criteri su 3: vetrina `qa/vetrina-stanze.html` e screenshot in scala di grigi) | ADR-0003 |
| 018 | Pericoli ambientali e ricompense a stanza pulita | Logic | Done | ADR-0003 |
