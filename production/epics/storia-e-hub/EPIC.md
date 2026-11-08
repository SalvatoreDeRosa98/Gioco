# Epic: Storia e hub

> **Layer**: Feature
> **GDD**: design/gdd/stato-narrativo.md, design/gdd/incontri-dialoghi.md, design/gdd/ricordi-scelta.md
> **Architecture Module**: motore/storia, motore/persistenza
> **Status**: Ready
> **Stories**: 5 storie (sotto)

## Overview

I sei flag e le condizioni di `trama/storia.json`, il cartiglio e i tableau, gli ancoraggi, il Medaglione di Rosa come primo ricordo con scelta, l'hub di Piazza Dante tra le notti con Tonino, e il ciclo morte → risveglio con salvataggio del profilo.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0004 | vedi `docs/architecture/adr-0004.md` | LOW |
| ADR-0006 | vedi `docs/architecture/adr-0006.md` | LOW |

## GDD Requirements

*(Il TR registry non è stato ancora generato da `/architecture-review`: i requisiti sono citati per sezione del GDD. NOT ASSESSED finché la review non assegna i TR-ID.)*

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| NOT ASSESSED | I requisiti sono le regole numerate e i criteri Given-When-Then dei GDD citati sopra | ADR-0004, ADR-0006 (Proposed) |

## Definition of Done

- Tutte le storie implementate, riviste e chiuse con `/story-done`
- Tutti i criteri di accettazione dei GDD citati verificati
- Le storie Logic e Integration hanno test in `gioco/qa/` che passano
- Le storie Visual/Feel e UI hanno screenshot conservati in `production/qa/evidence/`

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 026 | Stato narrativo: condizioni, decidi, derivati, profilo | Logic | Done | ADR-0004, ADR-0006 |
| 027 | Cartiglio, didascalie, tableau, incontri per ancoraggio | UI | Done | ADR-0004 |
| 028 | Il Medaglione di Rosa: ricordo con scelta ed esiti | Integration | Done | ADR-0004 |
| 029 | Hub di Piazza Dante tra le notti | Integration | Done | ADR-0004 |
| 030 | Morte → risveglio, notte + 1, salvataggio della notte | Integration | Done | ADR-0004, ADR-0006 |
