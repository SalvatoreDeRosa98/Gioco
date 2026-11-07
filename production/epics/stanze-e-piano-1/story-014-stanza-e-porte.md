# Story 014: Stanza da modello JSON: porte, ostacoli, ondate

> **Epic**: Stanze e piano 1
> **Status**: Done
> **Layer**: Core
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07 (Done: implementazione e test, gameplay-programmer)

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

- [x] GIVEN un modello con 3 nemici, WHEN Ferruccio entra, THEN le porte si chiudono (pannello nero) entro 1 tick e si riaprono (soglia d'oro) quando l'ultimo muore
- [x] GIVEN uno spawn, WHEN avviene, THEN nessun nemico nasce entro l'anello di sicurezza (GDD stanze) attorno a Ferruccio
- [x] GIVEN una colonna che blocca il movimento e i colpi, WHEN Ferruccio e un fendente la incontrano, THEN il corpo si ferma e il colpo non passa; una panca blocca il movimento e non i colpi
- [x] GIVEN una stanza pulita, WHEN si rientra, THEN resta pulita e senza nemici (stato salvato nella notte)

---

## Implementation Notes

GDD stanze-porte regole su tipi, porte, ostacoli, spawn, stato. Formato del modello in `contenuti/modelli-stanza/`.

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
**Evidenza**: `gioco/qa/mondo.test.mjs` casi «014: …» (porte chiudendo a `t_chiusura_porte` e chiuse quando i nemici compaiono a `t_marker`, riaperte dopo `t_ritardo_apertura` dall'ultimo morto; 200 semi di stanza con Ferruccio su ogni soglia e tutte le ondate: zero nascite entro `r_sicurezza`; colonna ferma passo e colpo, panca solo il passo; stanza pulita che resta pulita al rientro) + `gioco/qa/mondo.wire.test.js` → `production/qa/evidence/mondo-wire.png`. Nota: il criterio «entro 1 tick» è letto come «entro 1 tick dall'istante `t_chiusura_porte` del GDD (500 ms, regola 6: si può sbirciare)», non dall'ingresso.

---

## Dependencies

- Depends on: Story 005, Story 006, Story 003
- Unlocks: Story 015, Story 016, Story 017, Story 018, Story 024, Story 029
