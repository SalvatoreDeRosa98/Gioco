# Story 013: Sagoma di Ferruccio: pezzi, pose, sciarpa, lama orientabile

> **Epic**: Ferruccio e combattimento
> **Status**: Ready
> **Layer**: Core
> **Type**: Visual/Feel
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

- [ ] GIVEN `contenuti/sagome/ferruccio.json`, WHEN si disegna a 48 px di altezza in bianco e nero, THEN si riconoscono cono del cappello, becco, lama; la sciarpa è l'unico rosso
- [ ] GIVEN la mira a 90°, WHEN si disegna, THEN solo il braccio con la lama ruota, il corpo no; il contorno d'inchiostro è 2 px
- [ ] GIVEN le pose idle, cammina, scatto, fendente 1-3, affondo, parata, colpito, morto, WHEN si passano in rassegna in `qa/vetrina.html`, THEN ciascuna è distinta a colpo d'occhio
- [ ] GIVEN la sagoma a 100%, WHEN la si confronta con il Ferruccio del mockup (`design/mockup/teatro-delle-ombre-dialogo.png`), THEN ha la stessa cura: pieghe del camicione, sciarpa a tre segmenti con frange, coppolone piegato, becco, cintura, scarpette, lama con elsa; sign-off dell'autore obbligatorio
- [ ] Screenshot conservato in `production/qa/evidence/sagoma-ferruccio.png` (tutte le pose)

---

## Implementation Notes

Art bible §3 (Ferruccio 2,2 U, 6 pezzi, testa un terzo). Partire dal cutout del prototipo come riferimento visivo, non come codice.

---

## Out of Scope

Le storie vicine dell'epica (vedi `EPIC.md`) gestiscono il resto; non anticiparle.

---

## QA Test Cases

*N/A — nessuna specifica del qa-lead a questo tier (review mode solo); implementare contro i criteri sopra.*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: screenshot conservati in `production/qa/evidence/` (colore e scala di grigi) + nota di sign-off
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 006
- Unlocks: None
