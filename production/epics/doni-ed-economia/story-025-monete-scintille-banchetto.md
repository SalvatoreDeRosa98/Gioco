# Story 025: Monete di luce, drop, scintille, banchetto di Tonino

> **Epic**: Doni ed economia
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07

## Context

**GDD**: `design/gdd/doni-modificatori.md, design/gdd/economia.md`
**Requirement**: NOT ASSESSED (TR registry non generato: vedi le regole e i criteri del GDD citati nelle note)
**ADR Governing Implementation**: ADR-0002
**ADR Decision Summary**: vedi `docs/architecture/architecture.md` §5
**ADR Version**: 2026-11-07 (Proposed: in attesa della conferma dell'autore)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW (API del browser pre-cutoff; `docs/engine-reference/` non ha una voce Web: NOT SOURCEABLE)
**Engine Notes**: nessuna API post-cutoff; verifica su Chromium (Playwright) e Firefox prima del vertical slice

**Control Manifest Rules (this layer)**: N/A (nessun manifest). Regole fisse del progetto: nessun numero di gioco nel codice (`contenuti/parametri/*.json`), nessun `Math.random` (rng seminato), nessuna stringa di gioco nel motore, dipendenze solo verso il basso (eventi verso l'alto).

---

## Acceptance Criteria

*Dai GDD citati, scoped a questa storia:*

- [ ] GIVEN un nemico morto, WHEN cade il drop, THEN le monete seguono la tabella di `economia.json` con il generatore `drop`; si raccolgono passandoci sopra; tetto 99
- [ ] GIVEN il banchetto, WHEN si entra, THEN tre slot (un dono, un cuore, un consumabile) con prezzo = base × rarità × (1 + 0,15 × piano) in aritmetica intera; a monete insufficienti il prezzo è barrato e l'acquisto rifiutato
- [ ] GIVEN la morte, WHEN avviene, THEN le monete della notte si perdono e le scintille restano nel profilo
- [ ] GIVEN un boss battuto, WHEN si dissolve, THEN cadono le scintille del piano (3 al piano 1)

---

## Implementation Notes

GDD economia (rubinetti e scarichi, prezzi, scintille).

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
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 023, Story 026
- Unlocks: Story 018, Story 031
