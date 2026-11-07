# Story 009: Fendente a settore, combo da tre, buffer e cancellazioni

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

- [ ] GIVEN un gatto (r 16) a 80 px davanti, WHEN si preme attacco, THEN subisce 1 danno tra 80 e 180 ms; a 95 px non subisce danno
- [ ] GIVEN tre pressioni a 200 ms, WHEN colpiscono un nemico con vita 6 avanzando, THEN la vita scende a 2,5 e il terzo fendente ha arco 150°
- [ ] GIVEN attacco premuto durante lo scatto, WHEN lo scatto finisce entro 150 ms, THEN il fendente parte; oltre, no
- [ ] GIVEN un nemico dietro una colonna che blocca i colpi, WHEN il fendente lo coprirebbe, THEN non subisce danno
- [ ] GIVEN 20 nemici, WHEN si risolvono le hitbox, THEN costa ≤ 0,5 ms per tick

---

## Implementation Notes

GDD combattimento regole 1-3, 6; formule `danno_colpo` (decimale, `danno_min` 0,5) e `area_fendente`. Il fendente parte alla pressione (prototipo); la carica si entra tenendo ≥ 400 ms (storia 010).

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

- Depends on: Story 007
- Unlocks: Story 010, Story 011, Story 012, Story 019
