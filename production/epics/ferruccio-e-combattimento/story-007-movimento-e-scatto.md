# Story 007: Movimento in otto direzioni, collisioni con le mura, scatto

> **Epic**: Ferruccio e combattimento
> **Status**: Done
> **Layer**: Core
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07 (Done: implementazione e test, gameplay-programmer)

## Context

**GDD**: `design/gdd/controllo-ferruccio.md, design/gdd/combattimento.md`
**Requirement**: NOT ASSESSED (TR registry non generato: vedi le regole e i criteri del GDD citati nelle note)
**ADR Governing Implementation**: ADR-0002, ADR-0003, ADR-0005
**ADR Decision Summary**: vedi `docs/architecture/architecture.md` §5
**ADR Version**: 2026-11-07 (Proposed: in attesa della conferma dell'autore)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW (API del browser pre-cutoff; `docs/engine-reference/` non ha una voce Web: NOT SOURCEABLE)
**Engine Notes**: nessuna API post-cutoff; verifica su Chromium (Playwright) e Firefox prima del vertical slice

**Control Manifest Rules (this layer)**: N/A (nessun manifest). Regole fisse del progetto: nessun numero di gioco nel codice (`contenuti/parametri/*.json`), nessun `Math.random` (rng seminato), nessuna stringa di gioco nel motore, dipendenze solo verso il basso (eventi verso l'alto).

---

## Acceptance Criteria

*Dai GDD citati, scoped a questa storia:*

- [x] GIVEN Ferruccio fermo, WHEN si tiene la diagonale alto-destra per 1 s, THEN si sposta di 220 ± 5 px lungo la diagonale
- [x] GIVEN una carica di scatto, WHEN si preme scatto verso destra, THEN avanza di 180 ± 4 px in 160 ± 16 ms ed è invulnerabile per tutta la durata
- [x] GIVEN 0 cariche, WHEN si preme scatto, THEN nulla accade e nulla è accodato; la carica torna dopo 1200 ms
- [x] GIVEN uno scatto verso un muro a 20 px, WHEN urta, THEN si ferma al muro e resta invulnerabile fino a 160 ms
- [x] GIVEN un mod_velocita 0,5, WHEN si muove, THEN la velocità è 150 px/s (clamp)

---

## Implementation Notes

GDD controllo regole 1-4, 7; valori in `parametri/ferruccio.json`. Statistiche nominate lette da `modificatori.valore()` (storia 023) con fallback al base.

---

## Out of Scope

Le storie vicine dell'epica (vedi `EPIC.md`) gestiscono il resto; non anticiparle.

---

## QA Test Cases

*N/A — nessuna specifica del qa-lead a questo tier (review mode solo); implementare contro i criteri sopra.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: test in `gioco/qa/` (node o Playwright) che esercita i criteri
**Status**: [x] Creato e superato (2026-11-07)
**Evidenza**: `gioco/qa/combattimento.test.mjs` casi «007: …» (5 criteri: diagonale 220±5, scatto 180±4 px in 160±16 ms invulnerabile, 0 cariche + ricarica 1200 ms, muro a 20 px, clamp 150) + `gioco/qa/combattimento.wire.test.js` (cammina, scatta) → `production/qa/evidence/combattimento-wire.png`

---

## Dependencies

- Depends on: Story 002, Story 003, Story 006
- Unlocks: Story 008, Story 009
