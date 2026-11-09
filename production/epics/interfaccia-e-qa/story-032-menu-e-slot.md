# Story 032: Menu, tre slot, Continua, opzioni minime

> **Epic**: Interfaccia e QA
> **Status**: Done tramite P03/P04/P05 (2026-11-09)
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-09


> **Chiusura (2026-11-09, porting del Teatro).** Questa storia è assorbita dalle storie P03 (riallineo delle suite), P04 (menu
> di selezione del personaggio e dello slot, `interfaccia/menu.js`, `stile/menu.css`) e P05 (`menu.wire.test.js`, screenshot
> `menu-selezione.png` e `menu-slot.png`). Il design è cambiato con il Teatro: non «Nuova notte / Continua / Opzioni» ma il
> sipario rosso con le quattro carte e i **cinque** slot del salvataggio (non tre), con «Cancella» e conferma in pagina;
> «Continua» è il pannello della storia 030 nell'hub, che compare quando nello slot c'è una notte salvata. I criteri sotto
> restano quelli del GDD vecchio e sono spuntati solo dove il Teatro li conferma; le opzioni (volume, moto ridotto,
> rimappatura) NON sono fatte e passano a una storia futura.

## Context

**GDD**: `design/ux/hud.md (da scrivere), design/gdd/systems-index.md righe 20, 22, 25`
**Requirement**: NOT ASSESSED (TR registry non generato: vedi le regole e i criteri del GDD citati nelle note)
**ADR Governing Implementation**: ADR-0001, ADR-0003
**ADR Decision Summary**: vedi `docs/architecture/architecture.md` §5
**ADR Version**: 2026-11-07 (Proposed: in attesa della conferma dell'autore)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW (API del browser pre-cutoff; `docs/engine-reference/` non ha una voce Web: NOT SOURCEABLE)
**Engine Notes**: nessuna API post-cutoff; verifica su Chromium (Playwright) e Firefox prima del vertical slice

**Control Manifest Rules (this layer)**: N/A (nessun manifest). Regole fisse del progetto: nessun numero di gioco nel codice (`contenuti/parametri/*.json`), nessun `Math.random` (rng seminato), nessuna stringa di gioco nel motore, dipendenze solo verso il basso (eventi verso l'alto).

---

## Acceptance Criteria

*Dai GDD citati, scoped a questa storia:*

- [x] GIVEN l'apertura, WHEN si mostra il menu, THEN sipario di carta nera con bordo oro, Ferruccio piccolo e fermo, titolo in Cinzel; voci Nuova notte / Continua / Opzioni — *sostituito dal Teatro*: sipario rosso, quattro carte con sprite, slot, «Inizia» (`menu.wire.test.js`, `pagina.test.js`)
- [x] GIVEN tre slot, WHEN uno ha una notte in corso, THEN «Continua» è attivo e mostra notte e piano; gli altri «Nuova partita» — *cinque* slot con personaggio, notte, scintille e piano massimo o «vuoto»; «Continua» nell'hub (storia 030)
- [ ] GIVEN Opzioni, WHEN si apre, THEN volume (segnaposto), riduzione del movimento, rimappatura dei tasti
- [x] Screenshot conservati del menu e degli slot (`production/qa/evidence/menu-selezione.png`, `menu-slot.png`)

---

## Implementation Notes

ADR-0006 (slot), art bible §2 (menu).

---

## Out of Scope

Le storie vicine dell'epica (vedi `EPIC.md`) gestiscono il resto; non anticiparle.

---

## QA Test Cases

*N/A — nessuna specifica del qa-lead a questo tier (review mode solo); implementare contro i criteri sopra.*

---

## Test Evidence

**Story Type**: UI
**Required evidence**: screenshot di ogni schermata toccata in `production/qa/evidence/`
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 026
- Unlocks: None
