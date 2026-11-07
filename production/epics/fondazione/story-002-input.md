# Story 002: Input unificato: tastiera, mouse, gamepad

> **Epic**: Fondazione del motore
> **Status**: Done
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07 (Done)

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

- [ ] GIVEN WASD o frecce premuti insieme in diagonale, WHEN si legge `input.direzione()`, THEN il vettore è normalizzato (lunghezza 1)
- [ ] GIVEN un gamepad connesso, WHEN si muove la levetta sinistra oltre la zona morta (0,2), THEN la direzione segue la levetta e i tasti A/X/B/RB mappano attacco/parata/scatto/interagisci
- [ ] GIVEN un tasto premuto per 1 frame, WHEN si interroga nello stesso tick, THEN `premuto('attacco')` è vero una sola volta e `tenuto` resta vero finché è giù
- [ ] GIVEN la pagina senza focus, WHEN torna il focus, THEN nessun tasto risulta incastrato

---

## Implementation Notes

Eventi del contratto: sinistra/destra/su/giù (vettore), attacco, parata, scatto, interagisci, avanza, conferma, indietro, menu. Mappa dei tasti in `contenuti/parametri/input.json`.

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
**Status**: [x] Created and passing (2026-11-07)
**Evidenza**: `node gioco/qa/fondazione.test.mjs` (input, parte pura: diagonale WASD/frecce di lunghezza 1; `premuto` vero una sola volta e `tenuto` finché è giù; pressione+rilascio tra due tick non persi; `azzera` al blur senza tasti incastrati; levetta oltre zona morta 0,2 e bottoni A/X/B/RB → attacco/parata/scatto/interagisci; mappa reale `input.json` con le 12 azioni) e `node gioco/qa/pagina.test.js` (KeyW+KeyD in Chromium → `direzione()` di lunghezza 1; mouse in coordinate di scena). Il gamepad fisico non è stato provato (nessun dispositivo nella sessione). Esito del 2026-11-07: 28/28 e 5/5.

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 007, Story 027
