# Story 024: Catalogo dei 12 doni MVP, pool, piedistallo, cartiglio del dono

> **Epic**: Doni ed economia
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07

## Context

**GDD**: `design/gdd/doni-modificatori.md, design/gdd/economia.md`
**Requirement**: NOT ASSESSED (TR registry non generato: vedi le regole e i criteri del GDD citati nelle note)
**ADR Governing Implementation**: ADR-0002
**ADR Decision Summary**: vedi `docs/architecture/architecture.md` §5
**ADR Version**: 2026-11-07 (Proposed: in attesa della conferma dell'autore)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW (API del browser pre-cutoff; `docs/engine-reference/` non ha una voce Web: NOT SOURCEABLE)
**Engine Notes**: nessuna API post-cutoff; verifica su Chromium (Playwright) e Firefox prima del vertical slice

**Control Manifest Rules (this layer)**: N/A (nessun manifest). Regole fisse del progetto: nessun numero di gioco nel codice (`contenuti/parametri/*.json`), nessun `Math.random` (rng seminato), nessuna stringa di gioco nel motore, dipendenze solo verso il basso (eventi verso l'alto).

---

## Acceptance Criteria

*Dai GDD citati, scoped a questa storia:*

- [ ] GIVEN `contenuti/parametri/doni.json`, WHEN si carica, THEN contiene i 12 doni MVP del GDD con modificatori validi
- [ ] GIVEN la stanza del tesoro, WHEN Ferruccio preme interagisci davanti al piedistallo sotto il cono di luce, THEN raccoglie il dono, il cartiglio mostra nome e una riga, il dono esce dal pool della notte e l'HUD lo elenca
- [ ] GIVEN un ricordo azzurro, WHEN è nel pool, THEN la sua sagoma è il profilo dell'oggetto dentro un'anima azzurra; un dono d'oro è una forma geometrica d'oro
- [ ] GIVEN `escludi_se_flag`, WHEN il flag è deciso, THEN il ricordo non è estratto

---

## Implementation Notes

GDD doni (catalogo, pool, piedistallo), art bible Principio B.

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
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 023, Story 014
- Unlocks: Story 022, Story 028, Story 031
