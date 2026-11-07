# Epic: Interfaccia e QA

> **Layer**: Presentation
> **GDD**: design/ux/hud.md (da scrivere), design/gdd/systems-index.md righe 20, 22, 25
> **Architecture Module**: motore/ui, gioco/qa
> **Status**: Ready
> **Stories**: 3 storie (sotto)

## Overview

HUD a proscenio (maschere, scatto, monete, doni, nome della stanza), menu con tre slot e Continua, e il percorso Playwright che gioca con seme fisso, cattura le evidenze e forza i 64 stati narrativi.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001 | vedi `docs/architecture/adr-0001.md` | LOW |
| ADR-0003 | vedi `docs/architecture/adr-0003.md` | LOW |

## GDD Requirements

*(Il TR registry non è stato ancora generato da `/architecture-review`: i requisiti sono citati per sezione del GDD. NOT ASSESSED finché la review non assegna i TR-ID.)*

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| NOT ASSESSED | I requisiti sono le regole numerate e i criteri Given-When-Then dei GDD citati sopra | ADR-0001, ADR-0003 (Proposed) |

## Definition of Done

- Tutte le storie implementate, riviste e chiuse con `/story-done`
- Tutti i criteri di accettazione dei GDD citati verificati
- Le storie Logic e Integration hanno test in `gioco/qa/` che passano
- Le storie Visual/Feel e UI hanno screenshot conservati in `production/qa/evidence/`

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 031 | HUD a proscenio | UI | Ready | ADR-0001 |
| 032 | Menu, tre slot, Continua, opzioni minime | UI | Ready | ADR-0001 |
| 033 | Percorso Playwright: seme fisso, bot, evidenze, 64 stati | Logic | Ready | ADR-0001 |
