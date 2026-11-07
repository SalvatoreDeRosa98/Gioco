# Story 028: Il Medaglione di Rosa: ricordo con scelta ed esiti

> **Epic**: Storia e hub
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
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

- [ ] GIVEN `tonino_ricordo = null`, WHEN il Gatto dei Quattro Canti si dissolve, THEN lascia il Medaglione (+1 danno finché tenuto, goccia azzurra nell'HUD)
- [ ] GIVEN il Medaglione in mano e il banchetto a porte aperte, WHEN si interagisce con Tonino, THEN parte `piazza-dante.scelta-tonino` con due pulsanti, le etichette del file e la riga `cosa_sacrifica`, nessuna selezione predefinita
- [ ] GIVEN «restituito» confermato, WHEN avviene, THEN flag deciso, Medaglione sparito, 12 scintille, parte `piazza-dante.ricordo-restituito`; con «negato» il bonus resta fino a fine notte e parte `ricordo-negato`
- [ ] GIVEN morte con il Medaglione in mano, WHEN si ribatte il Gatto, THEN lo lascia di nuovo

---

## Implementation Notes

GDD ricordi-scelta regole 1-7; valori di equilibrio provvisori (tolleranza ±20%).

---

## Out of Scope

Le storie vicine dell'epica (vedi `EPIC.md`) gestiscono il resto; non anticiparle.

---

## QA Test Cases

*N/A — nessuna specifica del qa-lead a questo tier (review mode solo); implementare contro i criteri sopra.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: test Playwright in `gioco/qa/` o scena riproducibile da seme + screenshot
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 026, Story 027, Story 024
- Unlocks: Story 022, Story 033
