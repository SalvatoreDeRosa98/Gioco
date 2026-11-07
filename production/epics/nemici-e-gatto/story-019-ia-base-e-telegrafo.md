# Story 019: IA a stati, separazione, telegrafo in tre tempi, stordimento, anima

> **Epic**: Nemici e Gatto dei Quattro Canti
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
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

- [ ] GIVEN un nemico in Insegue, WHEN arriva a `r_nemico + r_corpo + 6` px, THEN si ferma e non tocca Ferruccio camminando
- [ ] GIVEN due nemici sovrapposti, WHEN passa 1 tick, THEN si separano (nessuna compenetrazione oltre 2 px dopo 10 tick)
- [ ] GIVEN un attacco, WHEN parte, THEN segue Anticipo → Lampo → Colpo con i tempi del nemico in `parametri/nemici.json`; il Lampo emette l'evento `telegrafo.lampo`
- [ ] GIVEN una parata riuscita, WHEN avviene, THEN il nemico è Stordito 600 ms (boss: 900 ms con immunità 5 s)
- [ ] GIVEN vita ≤ 0, WHEN avviene, THEN l'evento `nemico.morto` e la sagoma si dissolve in un'anima azzurra; cadono monete

---

## Implementation Notes

GDD nemici sezioni stati e transizioni, regola 2 (contatto passivo innocuo), armatura del telegrafo (prototipo). 

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

- Depends on: Story 008, Story 009, Story 011
- Unlocks: Story 020, Story 021
