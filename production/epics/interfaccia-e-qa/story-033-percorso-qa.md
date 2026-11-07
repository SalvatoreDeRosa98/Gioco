# Story 033: Percorso Playwright: seme fisso, bot, evidenze, 64 stati

> **Epic**: Interfaccia e QA
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07

## Context

**GDD**: `design/ux/hud.md (da scrivere), design/gdd/systems-index.md righe 20, 22, 25`
**Requirement**: NOT ASSESSED (TR registry non generato: vedi le regole e i criteri del GDD citati nelle note)
**ADR Governing Implementation**: ADR-0001, ADR-0003
**ADR Decision Summary**: vedi `docs/architecture/architecture.md` §5
**ADR Version**: 2026-11-07 (Proposed: in attesa della conferma dell'autore)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW (API del browser pre-cutoff; `docs/engine-reference/` non ha una voce Web: NOT SOURCEABLE)
**Engine Notes**: nessuna API post-cutoff; verifica su Chromium (Playwright) e Firefox prima del vertical slice

**Control Manifest Rules (this layer)**: N/A (nessun manifest). Regole fisse del progetto: nessun numero di gioco nel codice (`contenuti/parametri/*.json`), nessun `Math.random` (rng seminato), nessuna stringa di gioco nel motore, dipendenze solo verso il basso (eventi verso l'alto).

---

## Acceptance Criteria

*Dai GDD citati, scoped a questa storia:*

- [ ] GIVEN `node gioco/qa/percorri.js`, WHEN gira, THEN apre il gioco con `?debug=1&seme=1845`, gioca il piano 1 con il bot fino al Gatto, compie la scelta su Rosa in entrambe le varianti e salva gli screenshot in `production/qa/evidence/`
- [ ] GIVEN `node gioco/qa/stati64.js`, WHEN gira, THEN forza i 64 stati e verifica che per ognuno esista almeno una scena `epilogo` disponibile a ogni ordine da 10 a 110 (il test può fallire finché i piani 2-5 non esistono: il risultato è riportato, non nascosto)
- [ ] GIVEN `node gioco/qa/seme.js 200`, WHEN gira, THEN riporta i violatori dei vincoli di generazione (zero attesi)
- [ ] GIVEN un errore in console durante il percorso, WHEN avviene, THEN il percorso fallisce

---

## Implementation Notes

Architettura §1.6 e §7; ADR-0003. Il percorso è la prova che il gioco si può verificare senza umani; il feel resta NOT ASSESSED.

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

- Depends on: Story 016, Story 022, Story 028, Story 030
- Unlocks: None
