# Story 005: Renderer: stanza 13×7, pavimento, mura, luci, passate

> **Epic**: Fondazione del motore
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Visual/Feel
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-07

## Context

**GDD**: `design/gdd/controllo-ferruccio.md (regola 1), docs/architecture/architecture.md §1-4`
**Requirement**: NOT ASSESSED (TR registry non generato: vedi le regole e i criteri del GDD citati nelle note)
**ADR Governing Implementation**: ADR-0001, ADR-0002, ADR-0003, ADR-0005
**ADR Decision Summary**: vedi `docs/architecture/architecture.md` §5
**ADR Version**: 2026-11-07 (Proposed: in attesa della conferma dell'autore)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW (API del browser pre-cutoff; `docs/engine-reference/` non ha una voce Web: NOT SOURCEABLE)
**Engine Notes**: nessuna API post-cutoff; verifica su Chromium (Playwright) e Firefox prima del vertical slice

**Control Manifest Rules (this layer)**: N/A (nessun manifest). Regole fisse del progetto: nessun numero di gioco nel codice (`contenuti/parametri/*.json`), nessun `Math.random` (rng seminato), nessuna stringa di gioco nel motore, dipendenze solo verso il basso (eventi verso l'alto).

---

## Acceptance Criteria

*Dai GDD citati, scoped a questa storia:*

- [ ] GIVEN una stanza vuota di Piazza Dante, WHEN si disegna, THEN il pavimento sta tra L 0,12 e 0,30 (misurato sul pixel centrale), le mura sono inchiostro con bordo di carta chiara, due lanterne d'oro con pozza, quattro porte ad arco
- [ ] GIVEN lo screenshot della stanza, WHEN lo si confronta con `design/mockup/teatro-delle-ombre-dialogo.png` e con la tavola approvata della storia 000, THEN ha la stessa qualità: carta con fibre e grana (non un colore piatto), luce calda a gradienti morbidi con aloni, vignetta, almeno tre piani di profondità (fondale con palazzi e finestre accese oltre le mura, mura, pavimento), fili d'oro, pulviscolo; **nessun poligono piatto a tinta unita visibile**
- [ ] GIVEN l'autore, WHEN guarda lo screenshot, THEN lo approva come «si può guardare»: sign-off obbligatorio prima di chiudere la storia
- [ ] GIVEN 8 luci, WHEN si disegna a 1280×720, THEN il frame costa ≤ 6 ms su Chromium headless (media di 300 frame)
- [ ] GIVEN la palette del quartiere in `parametri/palette.json`, WHEN si cambia il gel, THEN il fondo cambia e oro, azzurro, rosso, crema restano invariati
- [ ] Screenshot conservato in `production/qa/evidence/renderer-stanza.png` e versione in scala di grigi

---

## Implementation Notes

ADR-0005 passate (1) e (5): pavimento con gel e pozze additive, vignetta e grana procedurale calcolata una volta per stanza. Art bible §2 (modello di luce), §4 (palette).

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

- Depends on: Story 001, Story 003
- Unlocks: Story 006, Story 014
