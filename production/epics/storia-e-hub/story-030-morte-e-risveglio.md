# Story 030: Morte → risveglio, notte + 1, salvataggio della notte

> **Epic**: Storia e hub
> **Status**: Done
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-08

## Context

**GDD**: `design/gdd/stato-narrativo.md, design/gdd/incontri-dialoghi.md, design/gdd/ricordi-scelta.md`
**Requirement**: NOT ASSESSED (TR registry non generato: vedi le regole e i criteri del GDD citati nelle note)
**ADR Governing Implementation**: ADR-0004, ADR-0006
**ADR Decision Summary**: vedi `docs/architecture/architecture.md` §5
**ADR Version**: 2026-11-07 (Proposed: in attesa della conferma dell'autore)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW (API del browser pre-cutoff; `docs/engine-reference/` non ha una voce Web: NOT SOURCEABLE)
**Engine Notes**: nessuna API post-cutoff; verifica su Chromium (Playwright) e Firefox prima del vertical slice

**Control Manifest Rules (this layer)**: N/A (nessun manifest). Regole fisse del progetto: nessun numero di gioco nel codice (`contenuti/parametri/*.json`), nessun `Math.random` (rng seminato), nessuna stringa di gioco nel motore, dipendenze solo verso il basso (eventi verso l'alto).

---

## Acceptance Criteria

*Dai GDD citati, scoped a questa storia:*

- [x] GIVEN maschere a 0, WHEN parte la sequenza, THEN le lanterne si spengono una a una, i fili si spezzano, la maschera si stacca in pezzi azzurri, e dopo ≤ 5 s si è nell'hub con `notte + 1` — `storia/risveglio.js` (fasi di `risveglio.json`, somma dei massimi = 5000 ms), velo DOM segnaposto `interfaccia/morte.js`; `notte.test.mjs` M01/M03/D01, `notte.wire.test.js`
- [x] GIVEN la morte, WHEN avviene, THEN flag, scintille, sblocchi e `piano_max` restano; monete e doni della notte spariscono — `notte.test.mjs` M02/S04 (busta del profilo condivisa tra stato narrativo e profilo), `notte.wire.test.js`
- [x] GIVEN una notte in corso, WHEN si chiude la pagina e si riapre, THEN «Continua» rigenera lo stesso piano dal seme e ripristina stanza corrente, maschere, doni e monete — `persistenza/notte-salvata.js` (salvataggio a ogni `notte.stanza`), `interfaccia/ripresa.js`; `notte.test.mjs` S01/S02, `notte.wire.test.js` (reload vero, click DOM, pianta identica)
- [x] GIVEN una scena in corso alla chiusura, WHEN si riprende, THEN la scena non è in `scene_viste` — gli incontri segnano vista solo alla chiusura; `notte.test.mjs` S03, `notte.wire.test.js` (scena a metà prima del reload)

---

## Implementation Notes

ADR-0006, GDD stato-narrativo regola 8, art bible §2 (morte/risveglio).

Implementato (2026-11-08, gameplay-programmer):
- `gioco/contenuti/parametri/risveglio.json` (fasi lanterne/fili/maschera/buio, `lanterne`, `t_max`); testi in `contenuti/interfaccia.json › morte, ripresa`.
- `motore/storia/risveglio.js`: a `ferruccio.morto` la sequenza a fasi; al termine `narrativa.nuovaNotte()`, `modificatori.azzera()`, `pool.azzera()`, `economia.nuovaNotte()`, `ferruccio.risveglia()`; eventi `morte.avvio`, `morte.fase`, `risveglio.fine`.
- `motore/persistenza/notte-salvata.js`: `{seme, piano, stanza, notte, maschere, doni, monete}` a ogni `notte.stanza`, cancellata alla morte, `riprendi({avvia})`.
- `motore/interfaccia/morte.js` (velo, dissolvenza) e `motore/interfaccia/ripresa.js` (pannello «Continua / Lascia andare»); stile in `stile/interfaccia.css`.
- `avvio.js`: ciclo in `pausa` durante la sequenza, poi `hub.entra()` e ciclo `hub` (senza hub la notte riparte dallo stesso seme); `avviaNotte` accetta `stanza`; `&continua=1`; `__gioco.risveglio/notteSalvata/ripresa/veloMorte`.
- `ferruccio.risveglia()`, `economia.nuovaNotte()`; `stato-narrativo.js` e `profilo.js` uniscono i campi della stessa busta del profilo (bug pre-esistente: si sovrascrivevano).
- Decisioni provvisorie (vedi `gioco/README.md › Valori provvisori`): durate e numero di lanterne; salvataggio solo al cambio di stanza (stato delle stanze e dei piedistalli non serializzato: storia 032); «Lascia andare» non conta come morte; velo DOM segnaposto in attesa del renderer.

---

## Out of Scope

Le storie vicine dell'epica (vedi `EPIC.md`) gestiscono il resto; non anticiparle.

---

## QA Test Cases

*N/A — nessuna specifica del qa-lead a questo tier (review mode solo); implementare contro i criteri sopra.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: test Playwright in `gioco/qa/` o scena riproducibile da seme + screenshot
**Status**: [x] Created
**Evidenza**: `gioco/qa/notte.test.mjs` (9 casi), `gioco/qa/notte.wire.test.js` (1 caso con reload, 3 screenshot); `production/qa/evidence/notte-ripresa.png`, `notte-morte.png`, `notte-risveglio.png` (2026-11-08)

---

## Dependencies

- Depends on: Story 008, Story 026, Story 029
- Unlocks: Story 033
