# Story 028: Il Medaglione di Rosa: ricordo con scelta ed esiti

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

- [x] GIVEN `tonino_ricordo = null`, WHEN il Gatto dei Quattro Canti si dissolve, THEN lascia il Medaglione (+1 danno finché tenuto, goccia azzurra nell'HUD)
- [x] GIVEN il Medaglione in mano e il banchetto a porte aperte, WHEN si interagisce con Tonino, THEN parte `piazza-dante.scelta-tonino` con due pulsanti, le etichette del file e la riga `cosa_sacrifica`, nessuna selezione predefinita
- [x] GIVEN «restituito» confermato, WHEN avviene, THEN flag deciso, Medaglione sparito, 12 scintille, parte `piazza-dante.ricordo-restituito`; con «negato» il bonus resta fino a fine notte e parte `ricordo-negato`
- [x] GIVEN morte con il Medaglione in mano, WHEN si ribatte il Gatto, THEN lo lascia di nuovo

---

## Implementation Notes

GDD ricordi-scelta regole 1-7; valori di equilibrio provvisori (tolleranza ±20%).

**Implementazione (2026-11-08, gameplay-programmer, sessione autonoma):**
- `gioco/motore/oggetti/ricordi.js` (nuovo): modello del ricordo = dono del catalogo (`doni.json`, categoria `ricordi`, sagoma `profilo` → azzurro
  nell'HUD) + `contenuti/parametri/ricordi.json` (nuovo: `persona`, `flag`, `scena_scelta`, `boss`, `archetipo_boss`, `valore_restituzione`,
  `effetto_ceduto.scintille` 12 {8-20}, `r_raccolta`); `validaRicordi` controlla la coerenza con doni.json e storia.json. Caduta a `boss.sconfitto`
  {id, x?, y?} se il flag è `null`, non è in mano/a terra e il profilo non lo ha restituito (altrimenti `ricordi.nessuno {motivo}`); raccolta
  passandoci sopra (`modificatori.aggiungiDono`); `puoAprire(scena)` nega la scena di scelta senza il ricordo in mano; a `narrativa.decisione`
  cede (dono tolto, `profilo.restituisci`, scintille via `economia.aggiungiScintille`) o tiene; `ferruccio.morto` / `economia.fine_notte` → perso
  senza toccare i flag. Eventi: `ricordi.caduto|raccolto|ceduto|tenuto|perso|nessuno`.
- `storia/incontri.js`: opzione `puoAprire` (default sempre vero) in `candidata` e `automatiche`; `mostra` (QA) non la consulta.
- `persistenza/profilo.js`: `restituisci(id)` (ricordi_restituiti, evento `profilo.ricordo`).
- `avvio.js`: carica `ricordi`, compone `creaRicordi`, `ricordi.tick()` in `notte`, `puoAprire` negli incontri, pool con i flag dello stato
  narrativo (+ `__gioco.flag`) e i restituiti del profilo, `__gioco.ricordi`; `resa/debug.js`: goccia azzurra per i ricordi a terra.
- Il boss non esiste (storia 022): l'evento `boss.sconfitto` lo emette il wire/QA; il boss vero dovrà emetterlo con `id` (storia.json o archetipo)
  e la posizione. Il «dono d'oro dal pool a flag deciso» (regola 7) è del boss: qui `ricordi.nessuno {motivo: 'deciso'}`.
- Non fatto: sconto 30 % al banchetto per la notte (Tuning Knobs del GDD), alone azzurro sull'ancoraggio di Tonino (grafica: aspetta il
  renderer), `registraBoss` (storia 022). Il bonus è il `+1 danno` del catalogo, non il +8 % dell'esempio del GDD (da riconciliare).

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
**Evidenza**: `node gioco/qa/ricordi.test.mjs` (9/9: S028-0 dati, S028-1/1b caduta e raccolta, S028-2 scelta, S028-3a/3b/3c esiti, S028-4 morte,
S028-5 regole del codice) · `node gioco/qa/ricordi.wire.test.js` (2/2, Playwright) → `production/qa/evidence/ricordi-medaglione.png` (Medaglione
raccolto: goccia azzurra nell'HUD e cartiglio azzurro) e `production/qa/evidence/ricordi-scelta.png` (scelta al banchetto: due pulsanti con
etichetta e `cosa_sacrifica`, nessuno selezionato) · suite esistenti verdi (fondazione 28, combattimento 32, condizioni 37, doni 27, mondo 21,
incontri 17, economia 13, nemici 24, doni.integrazione 9, parametri 4; pagina 5/5, combattimento.wire 2/2, mondo.wire 2/2, cartiglio.wire 2/2,
doni.wire 1/1).

---

## Dependencies

- Depends on: Story 026, Story 027, Story 024
- Unlocks: Story 022, Story 033
