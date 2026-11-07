# Story 016: Generazione del piano 1 dal seme con vincoli e validatore

> **Epic**: Stanze e piano 1
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07

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

- [ ] GIVEN il seme 1845, WHEN si genera il piano 1 due volte, THEN le due piante sono identiche
- [ ] GIVEN 200 semi, WHEN si generano, THEN ogni piano ha esattamente 1 ingresso, 1 boss, 1 tesoro, 1 banchetto, 1 ricordo (grado 1), il boss non è adiacente all'ingresso, la stanza-ricordo è a distanza 1 dall'ingresso, nessuna stanza vuota; i violatori sono zero
- [ ] GIVEN un piano sotto `soglia_Q`, WHEN si rigenera, THEN al massimo `max_tentativi` volte e poi il piano di riserva
- [ ] GIVEN la pianta, WHEN si salva la notte, THEN contiene solo il seme, il piano e la stanza corrente (non la pianta)

---

## Implementation Notes

GDD generazione-piani regole 1-23 e formule; ADR-0003. Strumento `qa/seme.js` che genera e riporta.

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

- Depends on: Story 014, Story 003
- Unlocks: Story 033
