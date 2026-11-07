# Story 026: Stato narrativo: condizioni, decidi, derivati, profilo

> **Epic**: Storia e hub
> **Status**: Done
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07 (Done)

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

- [x] GIVEN lo stato iniziale, WHEN si decide `taddeo = perdonato`, THEN `prove` e `lettera_mariella` valgono `vera`; ridecidere è rifiutato
- [x] GIVEN `prove = falsa`, WHEN si tenta `gregorio = dialogo`, THEN è rifiutato
- [x] GIVEN i 30 casi di `qa/condizioni.test.js` (realizzato come `qa/condizioni.test.mjs`, 37 casi) ("*", "", "!x", derivati, `>=2`, appartenenza), WHEN girano, THEN passano tutti
- [x] GIVEN una decisione, WHEN avviene, THEN il profilo è salvato in `ferruccio.v3.profilo.<slot>` e ricaricato identico dopo un reload
- [x] GIVEN un flag ignoto in una condizione, WHEN valutata, THEN è falsa e viene loggato un errore di contenuto

---

## Implementation Notes

ADR-0004, ADR-0006, GDD stato-narrativo regole 1-10 e formula `disponibile`.

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
**Status**: [x] Creato
**Evidenza**: `node gioco/qa/condizioni.test.mjs` → 37/37 pass (operatori, derivati, errori di contenuto, ordine/obbligatorie con scene reali, rifiuti di `decidi`, finale → mondo, round-trip del salvataggio in RAM, migrazioni, esporta/importa). `node gioco/qa/stati64.js` → 0/64 stati completi, exit 2: BUCHI DI CONTENUTO in storia.json, non del motore: ordine 70 manca per tutti i 32 stati `violante=risparmiata` (esistono solo le due scene di Tonino «uccisa»); ordine 100 manca per tutti i 32 stati `violante=uccisa` (`ultima-inquadratura` è solo «risparmiata»). Conflitti allo stesso ordine: 0 (le due scene a 50 di Agnese sono già esclusive). File: `gioco/motore/storia/{condizioni,stato-narrativo}.js`, `gioco/motore/persistenza/{salvataggio,migrazioni}.js`, `gioco/contenuti/{storia,ancoraggi,narrativa}.json`. Deviazione: `contenuti/narrativa.json` (derivati, booleani, finale→mondo A/B, tipi obbligatori, schema avanzamento) aggiunto perché storia.json non li ha in forma macchina e il motore non può contenere nomi di flag; mondo A=uccisa/B=risparmiata è una convenzione da confermare con l'autore.

---

## Dependencies

- Depends on: Story 003, Story 004
- Unlocks: Story 025, Story 027, Story 028, Story 030, Story 032
