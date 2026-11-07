# Story 026: Stato narrativo: condizioni, decidi, derivati, profilo

> **Epic**: Storia e hub
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07

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

- [ ] GIVEN lo stato iniziale, WHEN si decide `taddeo = perdonato`, THEN `prove` e `lettera_mariella` valgono `vera`; ridecidere è rifiutato
- [ ] GIVEN `prove = falsa`, WHEN si tenta `gregorio = dialogo`, THEN è rifiutato
- [ ] GIVEN i 30 casi di `qa/condizioni.test.js` ("*", "", "!x", derivati, `>=2`, appartenenza), WHEN girano, THEN passano tutti
- [ ] GIVEN una decisione, WHEN avviene, THEN il profilo è salvato in `ferruccio.v3.profilo.<slot>` e ricaricato identico dopo un reload
- [ ] GIVEN un flag ignoto in una condizione, WHEN valutata, THEN è falsa e viene loggato un errore di contenuto

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
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003, Story 004
- Unlocks: Story 025, Story 027, Story 028, Story 030, Story 032
