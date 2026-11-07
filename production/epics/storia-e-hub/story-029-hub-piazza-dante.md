# Story 029: Hub di Piazza Dante tra le notti

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

- [ ] GIVEN l'avvio dopo il menu, WHEN si entra nell'hub, THEN Piazza Dante di notte con luna immobile, fili d'oro, Tonino al banchetto, la porta della bottega chiusa, l'ingresso al piano 1 segnato
- [ ] GIVEN `taddeo = perdonato`, WHEN si torna nell'hub, THEN Taddeo è presente; con `agnese = risvegliata`, Agnese sotto il portico; Mariella è solo una finestra accesa
- [ ] GIVEN l'ingresso al piano, WHEN si attraversa, THEN parte la notte con un nuovo seme e `notte` non cambia finché non si muore
- [ ] Screenshot conservato dell'hub

---

## Implementation Notes

GDD incontri regola 7, art bible §2 (hub). La Fucina resta chiusa nell'MVP (si apre al piano 2, decisione provvisoria).

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

- Depends on: Story 027, Story 014
- Unlocks: Story 030
