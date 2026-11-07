# Story 006: Cutout a pezzi da JSON: pose, ellisse d'appoggio, ombra portata

> **Epic**: Fondazione del motore
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Visual/Feel
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07

## Context

**GDD**: `design/gdd/controllo-ferruccio.md (regola 1), docs/architecture/architecture.md §1-4`
**Requirement**: NOT ASSESSED (TR registry non generato: vedi le regole e i criteri del GDD citati nelle note)
**ADR Governing Implementation**: ADR-0001, ADR-0002, ADR-0003, ADR-0005
**ADR Decision Summary**: vedi `docs/architecture/architecture.md` §5
**ADR Version**: 2026-11-07 (Proposed: in attesa della conferma dell'autore)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW (API del browser pre-cutoff; `docs/engine-reference/` non ha una voce Web: NOT SOURCEABLE)
**Engine Notes**: nessuna API post-cutoff; verifica su Chromium (Playwright) e Firefox prima del vertical slice

**Control Manifest Rules (this layer)**: N/A (nessun manifest). Regole fisse del progetto: nessun numero di gioco nel codice (`contenuti/parametri/*.json`), nessun `Math.random` (rng seminato), nessuna stringa di gioco nel motore, dipendenze solo verso il basso (eventi verso l'alto).

---

## Acceptance Criteria

*Dai GDD citati, scoped a questa storia:*

- [ ] GIVEN `contenuti/sagome/prova.json` con 3 pezzi e 2 pose, WHEN si interpola da `idle` a `anticipo` in 500 ms, THEN le rotazioni dei pezzi variano linearmente e l'area della sagoma in `anticipo` differisce di ≥ 25% (art bible Principio A)
- [ ] GIVEN una sagoma a (x,y), WHEN si disegna, THEN c'è un'ellisse d'appoggio (inchiostro 45%, rapporto 0,6) centrata ai piedi e un'ombra portata dalla lanterna più vicina, schiacciata e scurita
- [ ] GIVEN due sagome, WHEN quella con y dei piedi minore è disegnata, THEN sta dietro l'altra
- [ ] GIVEN il cambio di verso, WHEN avviene, THEN la sagoma si ribalta in 80 ms passando per larghezza zero
- [ ] GIVEN una sagoma, WHEN si disegna, THEN è fatta di curve (path con Bézier) con bordo lievemente irregolare (jitter con seme, art bible §3), buchi di luce per gli occhi, spessore di carta sul bordo, e non di rettangoli ed ellissi nudi; vista a 100% non si distingue da un ritaglio di carta nera
- [ ] Screenshot conservato in `production/qa/evidence/cutout.png`

---

## Implementation Notes

ADR-0005 (`cutout.js`: albero di pezzi con perno e figli, pose in JSON), art bible §3 (ancoraggio, inclinazioni, ribaltamento).

---

## Out of Scope

Le storie vicine dell'epica (vedi `EPIC.md`) gestiscono il resto; non anticiparle.

---

## QA Test Cases

*N/A — nessuna specifica del qa-lead a questo tier (review mode solo); implementare contro i criteri sopra.*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: screenshot conservati in `production/qa/evidence/` (colore e scala di grigi) + nota di sign-off
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 005
- Unlocks: Story 007, Story 013, Story 014, Story 020
