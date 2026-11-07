# Story 020: Gatto d'ombra

> **Epic**: Nemici e Gatto dei Quattro Canti
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07

## Context

**GDD**: `design/gdd/nemici.md, design/gdd/boss.md`
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

- [ ] GIVEN un gatto, WHEN entra in Anticipo, THEN si accuccia (area −25%, posteriore su), poi lampo rosso negli occhi con anello 150 ms, poi balzo di 180 px in 220 ms con hitbox attiva dal 45% del balzo (impatto costante a +252 ms dal lampo)
- [ ] GIVEN tre gatti, WHEN attaccano, THEN al massimo 2 contemporaneamente (manopola)
- [ ] GIVEN il bot a 120 ms del percorso QA, WHEN gioca 30 stanze con seme fisso, THEN para ≥ 90% dei balzi e la stanza dura 3-7 s
- [ ] GIVEN il gatto a 100%, WHEN lo si guarda, THEN è una sagoma di gatto credibile (schiena ad arco, pelo irregolare sul dorso, orecchie, coda a S fluida, zampe), non un insieme di ellissi; occhi come fessure di carta chiara; sign-off dell'autore
- [ ] Screenshot conservati: anticipo, lampo, balzo, stordito, in colore e in grigi

---

## Implementation Notes

GDD nemici (gatto) + valori misurati nel REPORT del prototipo (`balzo_hit_dal` 0,45, armatura del telegrafo). Sagoma in `contenuti/sagome/gatto.json`.

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

- Depends on: Story 019, Story 006
- Unlocks: Story 022
