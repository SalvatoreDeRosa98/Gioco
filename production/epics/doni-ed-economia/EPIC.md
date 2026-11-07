# Epic: Doni ed economia

> **Layer**: Feature
> **GDD**: design/gdd/doni-modificatori.md, design/gdd/economia.md
> **Architecture Module**: motore/oggetti
> **Status**: Ready
> **Stories**: 3 storie (sotto)

## Overview

Il contratto dei modificatori su statistiche nominate con ordine e clamp, i ganci, il catalogo dei dodici doni dell'MVP con pool e piedistallo, le monete di luce, i drop, le scintille e il banchetto di Tonino a tre slot.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0002 | vedi `docs/architecture/adr-0002.md` | LOW |

## GDD Requirements

*(Il TR registry non è stato ancora generato da `/architecture-review`: i requisiti sono citati per sezione del GDD. NOT ASSESSED finché la review non assegna i TR-ID.)*

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| NOT ASSESSED | I requisiti sono le regole numerate e i criteri Given-When-Then dei GDD citati sopra | ADR-0002 (Proposed) |

## Definition of Done

- Tutte le storie implementate, riviste e chiuse con `/story-done`
- Tutti i criteri di accettazione dei GDD citati verificati
- Le storie Logic e Integration hanno test in `gioco/qa/` che passano
- Le storie Visual/Feel e UI hanno screenshot conservati in `production/qa/evidence/`

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 023 | Modificatori: statistiche nominate, ordine, clamp, ganci, sinergie | Logic | Ready | ADR-0002 |
| 024 | Catalogo dei 12 doni MVP, pool, piedistallo, cartiglio del dono | Integration | Ready | ADR-0002 |
| 025 | Monete di luce, drop, scintille, banchetto di Tonino | Logic | Ready | ADR-0002 |
