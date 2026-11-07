# Story 004: Bus eventi e superficie di debug

> **Epic**: Fondazione del motore
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
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

- [ ] GIVEN un ascoltatore su `nemico.morto`, WHEN l'evento è emesso con `{id, x, y}`, THEN l'ascoltatore riceve il payload nello stesso tick e un ascoltatore rimosso non lo riceve più
- [ ] GIVEN `?debug=1`, WHEN si legge `window.__gioco`, THEN espone `stato`, `tick(n)`, `imposta(flag,valore)`, `vaiA(stanza)`, `seme`; senza debug `window.__gioco` è assente
- [ ] GIVEN un errore in un ascoltatore, WHEN l'evento è emesso, THEN gli altri ascoltatori ricevono comunque e l'errore è loggato una volta

---

## Implementation Notes

Architettura §2: le dipendenze dall'alto verso il basso passano per eventi. Nessun modulo di gioco importa `ui/`.

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

- Depends on: Story 001
- Unlocks: Story 026
