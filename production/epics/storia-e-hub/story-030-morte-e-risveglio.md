# Story 030: Morte → risveglio, notte + 1, salvataggio della notte

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

- [ ] GIVEN maschere a 0, WHEN parte la sequenza, THEN le lanterne si spengono una a una, i fili si spezzano, la maschera si stacca in pezzi azzurri, e dopo ≤ 5 s si è nell'hub con `notte + 1`
- [ ] GIVEN la morte, WHEN avviene, THEN flag, scintille, sblocchi e `piano_max` restano; monete e doni della notte spariscono
- [ ] GIVEN una notte in corso, WHEN si chiude la pagina e si riapre, THEN «Continua» rigenera lo stesso piano dal seme e ripristina stanza corrente, maschere, doni e monete
- [ ] GIVEN una scena in corso alla chiusura, WHEN si riprende, THEN la scena non è in `scene_viste`

---

## Implementation Notes

ADR-0006, GDD stato-narrativo regola 8, art bible §2 (morte/risveglio).

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

- Depends on: Story 008, Story 026, Story 029
- Unlocks: Story 033
