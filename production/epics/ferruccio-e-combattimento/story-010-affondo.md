# Story 010: Affondo caricato

> **Epic**: Ferruccio e combattimento
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07

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

- [ ] GIVEN attacco tenuto 450 ms poi rilasciato, WHEN un nemico è sul percorso a 60 px, THEN subisce 2,5 danni ed è spinto a 320 px/s
- [ ] GIVEN attacco rilasciato a 300 ms, WHEN si rilascia, THEN non parte alcun affondo (il fendente è già partito alla pressione)
- [ ] GIVEN un affondo verso un muro, WHEN urta, THEN si ferma al muro e la hitbox copre solo il tratto percorso
- [ ] GIVEN un nemico con peso ≥ 3, WHEN l'affondo lo colpisce, THEN danno sì, spinta no, Ferruccio si ferma a contatto

---

## Implementation Notes

GDD combattimento regola 4; valori del prototipo: startup 60 ms, recupero 260 ms, larghezza 40 px, lama 46 px (da registrare in `parametri/combattimento.json`).

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

- Depends on: Story 009
- Unlocks: None
