# Story 011: Parata, stordimento, controcolpo, riflesso

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

- [x] GIVEN un gatto che balza con impatto a T, WHEN parata premuta a T−100 ms, THEN maschere invariate, gatto Stordito 600 ms, una carica di scatto ripristinata, il fendente entro 500 ms fa 2
- [x] GIVEN parata premuta a T−300 ms, WHEN il gatto impatta, THEN Ferruccio subisce 1 danno
- [x] GIVEN un attacco imparabile, WHEN si para nel tempo giusto, THEN il danno passa
- [x] GIVEN un proiettile parato, WHEN riflesso, THEN torna da dove è venuto con danno 2
- [x] GIVEN parata e attacco nello stesso frame, WHEN si risolve, THEN vince la parata

---

## Implementation Notes

GDD combattimento regola 5; tempi 40/180/220 ms. Il prototipo ha misurato la finestra utile 40-210 ms dopo il lampo: esporre `t_lampo` e `t_finestra_p` come manopole e provare 250/240 se il tester la trova stretta. Buffer di parata: aggiungere `t_buffer_parata` (80 ms) come manopola, default 0.

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
**Evidenza**: `gioco/qa/combattimento.test.mjs` casi «011: …» (T−100: maschere 5, stordito 600, carica ripristinata, fendente ×2 poi ×1; T−300: 1 danno; imparabile passa; proiettile riflesso danno 2 a 380 px/s colpisce la statua; parata > attacco; due nemici parati) + wire test (alone della finestra)

---

## Dependencies

- Depends on: Story 009
- Unlocks: Story 012, Story 019
