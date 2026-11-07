# Story 022: Boss: il Gatto dei Quattro Canti

> **Epic**: Nemici e Gatto dei Quattro Canti
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07

## Context

**GDD**: `design/gdd/nemici.md, design/gdd/boss.md`
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

- [ ] GIVEN la stanza del boss, WHEN si entra, THEN controluce dietro il boss, ombra che copre un terzo dell'arena, barra della vita, porte chiuse
- [ ] GIVEN la fase 1, WHEN la vita scende al 50%, THEN la fase 2 cambia l'asse della luce e aggiunge il pattern previsto, senza accorciare il lampo
- [ ] GIVEN la vittoria, WHEN avviene, THEN il boss si dissolve in anima, `boss_battuti` include `gatto`, cade il Medaglione di Rosa se `tonino_ricordo` è null, altrimenti un dono d'oro
- [ ] GIVEN il dps di riferimento, WHEN il bot colpisce senza errori, THEN il duello dura 60-90 s

---

## Implementation Notes

GDD boss (Gatto dei Quattro Canti), ricordi-scelta regola 1 e 7.

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

- Depends on: Story 020, Story 024, Story 028
- Unlocks: Story 033
