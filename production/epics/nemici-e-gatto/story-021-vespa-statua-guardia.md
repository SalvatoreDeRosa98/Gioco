# Story 021: Vespa dorata, statua animata, guardia del Velo

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

- [ ] GIVEN una vespa, WHEN vola, THEN passa sopra gli ostacoli, la quota si legge dalla distanza corpo-ombra, vibra e picchia con i tempi del GDD
- [ ] GIVEN una statua, WHEN attacca, THEN trema, le crepe si accendono, e il colpo a cuneo è imparabile (rosso pieno, cuneo tratteggiato a terra); il proiettile luminoso è parabile e riflesso fa 2
- [ ] GIVEN una guardia, WHEN affonda, THEN la linea tratteggiata a terra è lunga quanto l'affondo e il lampo è sul bordo della lama
- [ ] GIVEN il budget di minaccia della stanza, WHEN si piazzano, THEN il costo totale rispetta `parametri/nemici.json`
- [ ] Screenshot conservati per ciascuno (anticipo e lampo), in colore e in grigi

---

## Implementation Notes

GDD nemici (archetipi), art bible §3 tabella dei telegrafi.

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

- Depends on: Story 019
- Unlocks: None
