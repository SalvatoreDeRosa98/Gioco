# Story 003: RNG seminato e parametri JSON con override da URL

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

- [ ] GIVEN `creaRng(1845)`, WHEN si estraggono 1000 numeri due volte, THEN le sequenze sono identiche e `derivato(rng,'spawn')` non cambia la sequenza di `derivato(rng,'drop')`
- [ ] GIVEN `contenuti/parametri/*.json`, WHEN si carica `parametri.carica()`, THEN ogni statistica ha `{base,min,max}` e un valore fuori range è segnalato in console come errore di contenuto
- [ ] GIVEN l'URL `?debug=1&p.combattimento.portata=90`, WHEN si legge `parametri.get('combattimento.portata')`, THEN vale 90; senza `debug=1` l'override è ignorato
- [ ] GIVEN il motore, WHEN si cerca `Math.random` in `gioco/motore/`, THEN zero occorrenze

---

## Implementation Notes

ADR-0003 (mulberry32, generatori derivati per etichetta), ADR-0002 (parametri in sola lettura, override solo in debug).

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
- Unlocks: Story 005, Story 007, Story 014, Story 016, Story 023, Story 026
