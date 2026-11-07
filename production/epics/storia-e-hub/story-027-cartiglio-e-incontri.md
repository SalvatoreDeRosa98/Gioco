# Story 027: Cartiglio, didascalie, tableau, incontri per ancoraggio

> **Epic**: Storia e hub
> **Status**: Ready
> **Layer**: Feature
> **Type**: UI
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07

## Context

**GDD**: `design/gdd/stato-narrativo.md, design/gdd/incontri-dialoghi.md, design/gdd/ricordi-scelta.md`
**Requirement**: NOT ASSESSED (TR registry non generato: vedi le regole e i criteri del GDD citati nelle note)
**ADR Governing Implementation**: ADR-0004, ADR-0006
**ADR Decision Summary**: vedi `docs/architecture/architecture.md` §5
**ADR Version**: 2026-11-07 (Proposed: in attesa della conferma dell'autore)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW (API del browser pre-cutoff; `docs/engine-reference/` non ha una voce Web: NOT SOURCEABLE)
**Engine Notes**: nessuna API post-cutoff; verifica su Chromium (Playwright) e Firefox prima del vertical slice

**Control Manifest Rules (this layer)**: N/A (nessun manifest). Regole fisse del progetto: nessun numero di gioco nel codice (`contenuti/parametri/*.json`), nessun `Math.random` (rng seminato), nessuna stringa di gioco nel motore, dipendenze solo verso il basso (eventi verso l'alto).

---

## Acceptance Criteria

*Dai GDD citati, scoped a questa storia:*

- [ ] GIVEN notte 1 nell'hub, WHEN si interagisce con Tonino, THEN parte `piazza-dante.tonino-primo-incontro` nel cartiglio (nome in maiuscoletto, didascalie in corsivo, una battuta alla volta, pausa logica) e la seconda interazione dà una ripetizione
- [ ] GIVEN una battuta di 140 caratteri, WHEN mostrata, THEN è spezzata in due cartigli dello stesso parlante
- [ ] GIVEN nemici vivi nella stanza, WHEN si interagisce, THEN nessun cartiglio
- [ ] GIVEN `villa-comunale.ricordo-gaetano`, WHEN parte come tableau, THEN resta ≥ 3 s con una sola voce
- [ ] Screenshot conservati: cartiglio, scelta, tableau (`production/qa/evidence/`)

---

## Implementation Notes

GDD incontri regole 1-10; ancoraggi in `contenuti/ancoraggi.json`; etichette in `interfaccia.json`. Il cartiglio è DOM, stile del mockup.

---

## Out of Scope

Le storie vicine dell'epica (vedi `EPIC.md`) gestiscono il resto; non anticiparle.

---

## QA Test Cases

*N/A — nessuna specifica del qa-lead a questo tier (review mode solo); implementare contro i criteri sopra.*

---

## Test Evidence

**Story Type**: UI
**Required evidence**: screenshot di ogni schermata toccata in `production/qa/evidence/`
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 026, Story 002
- Unlocks: Story 028, Story 029
