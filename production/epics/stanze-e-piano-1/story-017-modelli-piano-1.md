# Story 017: Quattordici modelli di stanza del piano 1

> **Epic**: Stanze e piano 1
> **Status**: Ready
> **Layer**: Core
> **Type**: Config/Data
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07 (dati, validatore e smoke check fatti; resta la vetrina `qa/vetrina-stanze.html` con screenshot in scala di grigi, gameplay-programmer)

## Context

**GDD**: `design/gdd/stanze-porte.md, design/gdd/generazione-piani.md`
**Requirement**: NOT ASSESSED (TR registry non generato: vedi le regole e i criteri del GDD citati nelle note)
**ADR Governing Implementation**: ADR-0003, ADR-0005, ADR-0006
**ADR Decision Summary**: vedi `docs/architecture/architecture.md` §5
**ADR Version**: 2026-11-07 (Proposed: in attesa della conferma dell'autore)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW (API del browser pre-cutoff; `docs/engine-reference/` non ha una voce Web: NOT SOURCEABLE)
**Engine Notes**: nessuna API post-cutoff; verifica su Chromium (Playwright) e Firefox prima del vertical slice

**Control Manifest Rules (this layer)**: N/A (nessun manifest). Regole fisse del progetto: nessun numero di gioco nel codice (`contenuti/parametri/*.json`), nessun `Math.random` (rng seminato), nessuna stringa di gioco nel motore, dipendenze solo verso il basso (eventi verso l'alto).

---

## Acceptance Criteria

*Dai GDD citati, scoped a questa storia:*

- [x] GIVEN `contenuti/modelli-stanza/piazza-dante/`, WHEN si validano, THEN ci sono 6 normali 1×1, 2 doppie 2×1, ingresso, ricordo, boss, tesoro, banchetto, segreta, tutti con tag di difficoltà e spawn fuori dall'anello di sicurezza
- [ ] GIVEN ogni modello, WHEN si disegna in `qa/vetrina-stanze.html`, THEN ogni ostacolo e pericolo si legge in sagoma nera (screenshot in scala di grigi conservato)
- [x] Smoke check: ogni modello si carica senza errori di contenuto

---

## Implementation Notes

GDD stanze-porte (esempio JSON) e generazione (tabella dei tipi). Pericoli di Piazza Dante: bracieri. Solo dati, nessun codice.

---

## Out of Scope

Le storie vicine dell'epica (vedi `EPIC.md`) gestiscono il resto; non anticiparle.

---

## QA Test Cases

*N/A — nessuna specifica del qa-lead a questo tier (review mode solo); implementare contro i criteri sopra.*

---

## Test Evidence

**Story Type**: Config/Data
**Required evidence**: smoke check (caricamento senza errori di contenuto) in `production/qa/smoke-<data>.md`
**Status**: [x] Creato e superato (2026-11-07)
**Evidenza**: `gioco/qa/mondo.test.mjs` caso «017: …» (smoke: i 14 modelli di `contenuti/modelli-stanza/piazza-dante/` si caricano senza errori di contenuto; conteggi 6/2/1/1/1/1/1/1; tag di difficoltà; spawn a ≥ 128 px da ogni slot e fuori da vestiboli e ostacoli; il validatore rifiuta colonna nel vestibolo, spawn su ostacolo, porta irraggiungibile, simbolo ignoto). Il criterio «vetrina-stanze.html con screenshot in scala di grigi» NON è fatto: i modelli si vedono solo nel fil di ferro (`mondo-wire.png`).

---

## Dependencies

- Depends on: Story 014
- Unlocks: None
