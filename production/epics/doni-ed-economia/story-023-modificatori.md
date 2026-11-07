# Story 023: Modificatori: statistiche nominate, ordine, clamp, ganci, sinergie

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

- [ ] GIVEN `danno` base 1 e due doni (+1 somma, ×1,5), WHEN si calcola, THEN 3 (prima le somme, poi i moltiplicatori), e con un terzo dono che porterebbe a 6 il valore è 5 (clamp)
- [ ] GIVEN un dono che imposta `parata_riflette = true`, WHEN si calcola, THEN `imposta` vince su somme e moltiplicatori
- [ ] GIVEN un dono iscritto a `su_parata` con effetto `lancia_scintilla`, WHEN una parata riesce, THEN l'effetto di libreria è invocato con i suoi parametri
- [ ] GIVEN due doni con tag `scintilla` e `catena`, WHEN entrambi attivi, THEN la sinergia di `sinergie.json` si applica una sola volta
- [ ] GIVEN `qa/parametri.test.js`, WHEN gira, THEN ogni statistica citata dal catalogo esiste e ha min/max

---

## Implementation Notes

ADR-0002, GDD doni regole su ordine e clamp, GDD combattimento regola 9. Funzione pura testabile senza DOM.

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

- Depends on: Story 003
- Unlocks: Story 024, Story 025
