# Story 001: Pagina, ciclo a passo fisso e tempo

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

- [ ] GIVEN la pagina `gioco/index.html` servita da un server statico, WHEN si apre, THEN il canvas 1280×720 logici si scala al contenitore senza scroll e la console non ha errori
- [ ] GIVEN il ciclo avviato, WHEN passano 1000 ms di orologio, THEN `tempo.tick` è stato chiamato 60 ± 1 volte e il rendering interpola la frazione residua
- [ ] GIVEN un frame lungo 200 ms, WHEN si recupera, THEN si eseguono al massimo 5 tick e il resto si scarta (nessuna spirale della morte)
- [ ] GIVEN `prefers-reduced-motion`, WHEN la pagina si apre, THEN la scossa e le scie sono disattivate dai parametri

---

## Implementation Notes

ADR-0001 §Decision; ADR-0003 (`tempo.js`: tick fisso 16,667 ms, accumulatore, max 5 tick). Moduli ES nativi, nessuna dipendenza. `index.html` è una pagina completa con doctype.

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

- Depends on: None
- Unlocks: Story 002, Story 003, Story 004, Story 005
