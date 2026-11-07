# Epic: Fondazione del motore

> **Layer**: Foundation
> **GDD**: design/gdd/controllo-ferruccio.md (regola 1), docs/architecture/architecture.md §1-4
> **Architecture Module**: motore/fondazione, motore/resa
> **Status**: Ready
> **Stories**: 7 storie (sotto)

## Overview

La cornice su cui tutto gira: pagina, ciclo a passo fisso, input, rng seminato, parametri JSON, bus eventi, strumenti di debug, e il renderer del presepe d'ombre (stanza 13×7, luci, cutout a pezzi, ellissi d'appoggio, ombre). Nessuna regola di gioco: solo ciò che i sistemi usano.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001 | vedi `docs/architecture/adr-0001.md` | LOW |
| ADR-0002 | vedi `docs/architecture/adr-0002.md` | LOW |
| ADR-0003 | vedi `docs/architecture/adr-0003.md` | LOW |
| ADR-0005 | vedi `docs/architecture/adr-0005.md` | LOW |

## GDD Requirements

*(Il TR registry non è stato ancora generato da `/architecture-review`: i requisiti sono citati per sezione del GDD. NOT ASSESSED finché la review non assegna i TR-ID.)*

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| NOT ASSESSED | I requisiti sono le regole numerate e i criteri Given-When-Then dei GDD citati sopra | ADR-0001, ADR-0002, ADR-0003, ADR-0005 (Proposed) |

## Definition of Done

- Tutte le storie implementate, riviste e chiuse con `/story-done`
- Tutti i criteri di accettazione dei GDD citati verificati
- Le storie Logic e Integration hanno test in `gioco/qa/` che passano
- Le storie Visual/Feel e UI hanno screenshot conservati in `production/qa/evidence/`

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 000 | Tavola di qualità visiva del presepe d'ombre (da approvare prima del motore) | Visual/Feel | Ready | ADR-0005 |
| 001 | Pagina, ciclo a passo fisso e tempo | Logic | Ready | ADR-0001 |
| 002 | Input unificato: tastiera, mouse, gamepad | Logic | Ready | ADR-0001 |
| 003 | RNG seminato e parametri JSON con override da URL | Logic | Ready | ADR-0001 |
| 004 | Bus eventi e superficie di debug | Logic | Ready | ADR-0001 |
| 005 | Renderer: stanza 13×7, pavimento, mura, luci, passate | Visual/Feel | Ready | ADR-0001 |
| 006 | Cutout a pezzi da JSON: pose, ellisse d'appoggio, ombra portata | Visual/Feel | Ready | ADR-0001 |
