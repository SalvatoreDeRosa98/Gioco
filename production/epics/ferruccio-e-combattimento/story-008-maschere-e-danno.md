# Story 008: Maschere, danno subito, invulnerabilità, spinta, morte

> **Epic**: Ferruccio e combattimento
> **Status**: Done
> **Layer**: Core
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07 (Done: implementazione e test, gameplay-programmer)

## Context

**GDD**: `design/gdd/controllo-ferruccio.md, design/gdd/combattimento.md`
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

- [x] GIVEN 5 maschere, WHEN il Colpo di un nemico raggiunge Ferruccio, THEN le maschere diventano 4, è spinto a 260 px/s decadenti in 150 ms e per 800 ms un secondo Colpo non toglie maschere
- [x] GIVEN un gatto in pattuglia che lo tocca, WHEN avviene, THEN le maschere restano 5 e i corpi si separano
- [x] GIVEN 1 maschera, WHEN subisce un attacco pesante, THEN le maschere sono 0 e l'evento `ferruccio.morto` è emesso entro 200 ms
- [x] GIVEN armatura 1, WHEN subisce un attacco pesante, THEN perde 1 maschera (minimo 1)

---

## Implementation Notes

GDD controllo regole 5, 6, 8 e formula `danno_subito`. L'evento di morte è ascoltato dal ciclo (storia 030).

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
**Status**: [x] Creato e superato (2026-11-07)
**Evidenza**: `gioco/qa/combattimento.test.mjs` casi «008: …» (Colpo → 4 maschere, spinta 260 px/s in 150 ms, 800 ms i-frames; contatto passivo innocuo; pesante a 1 maschera → `ferruccio.morto` nello stesso tick; armatura 1; due Colpi → un danno) + wire test (il fantoccio automatico toglie una maschera)

---

## Dependencies

- Depends on: Story 007
- Unlocks: Story 019, Story 030, Story 031
