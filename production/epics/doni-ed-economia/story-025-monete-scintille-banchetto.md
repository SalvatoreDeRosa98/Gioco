# Story 025: Monete di luce, drop, scintille, banchetto di Tonino

> **Epic**: Doni ed economia
> **Status**: Done
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-08

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

- [x] GIVEN un nemico morto, WHEN cade il drop, THEN le monete seguono la tabella di `economia.json` con il generatore `drop`; si raccolgono passandoci sopra; tetto 99
- [x] GIVEN il banchetto, WHEN si entra, THEN tre slot (un dono, un cuore, un consumabile) con prezzo = base × rarità × (1 + 0,15 × piano) in aritmetica intera; a monete insufficienti il prezzo è barrato e l'acquisto rifiutato
- [x] GIVEN la morte, WHEN avviene, THEN le monete della notte si perdono e le scintille restano nel profilo
- [x] GIVEN un boss battuto, WHEN si dissolve, THEN cadono le scintille del piano (3 al piano 1)

---

## Implementation Notes

GDD economia (rubinetti e scarichi, prezzi, scintille).

**Implementato (2026-11-08, gameplay-programmer, sessione autonoma):**

- `gioco/contenuti/parametri/economia.json` (statistiche {base,min,max}: drop, tetti, raggi, prezzi, p_cuore, scintille, Fucina,
  pesi di rarità del banchetto, segnaposto di bilancio), `contenuti/parametri/consumabili.json` (tabella: Olio da fabbro, Pezzuola
  di lino), `contenuti/interfaccia.json` (testi di HUD e banchetto).
- `motore/oggetti/economia.js`: formule pure (`prezzo` intero, `moneteBoss`, `scintilleBoss`, `pCuore`, `residuoNotte`,
  `costoSblocco`, `moneteAtteseStanza`, `redditoPiano`, `estraiMoneta`, `pesiRarita`, `estraiDono`) e `creaEconomia` (monete con
  tetto, oggetti a terra per stanza, raccolta passandoci sopra, consumabili, morte, fine notte). Ascolta `nemico.bottino`
  (drop dalla tabella con il generatore derivato `drop`; `boss: true` → monete e scintille del boss), `stanza.ricompensa`,
  `stanza.pulita`, `notte.stanza`, `ferruccio.morto`.
- `motore/oggetti/banchetto.js`: tre slot generati dal generatore derivato `banchetto`, conservati al rientro, `compra(i)`
  atomico con motivi di rifiuto, `interagisci` entro `r_interagisci`, `puntiSlot` sulle celle `banco` del modello.
- `motore/persistenza/profilo.js`: scintille/sblocchi/ricordi su `salvataggio.js`, accredito immediato.
- `motore/interfaccia/banchetto.js` + `stile/interfaccia.css`: HUD e lista DOM minimale con prezzi (barrati se non accessibili).
- `motore/avvio.js` compone tutto ed espone `__gioco.economia`, `banchetto`, `profilo`, `salvataggio`; `resa/debug.js` disegna
  monete, cuori e slot; `attori/nemico.js` aggiunge `boss` ai payload di `nemico.morto`/`nemico.bottino`.

**Decisioni da confermare (game-designer / story 024):**

- Il drop dei nemici segue la tabella di `economia.json` (p 0,40; 1 o 5) e **ignora** `monete` calcolate da `nemici.json` F9
  (`ceil(costo/2)+extra`): due GDD danno due regole; qui vince economia.md come chiede la storia.
- I pesi di rarità e le derive del pool (60/30/10, −10/+10/+30 % per piano) stanno provvisoriamente in `economia.banchetto.*`:
  la storia 024 (pool e piedistallo) li sposterà nel suo modulo e `estraiDono` passerà al pool vero.
- Il boss è riconosciuto dal flag `boss` del payload: la storia del boss (archetipo con `boss: true`) non è ancora implementata,
  il criterio 4 è provato con un bottino sintetico.
- Fallback a pool vuoto: lo slot dono diventa un cuore al prezzo di un comune (il GDD dice «cuore o 10 monete»).
- Stanza segreta (`monete_segreta`), stanza-ricordo (`scintille.ricordo`) e la Fucina (solo `costoSblocco`) hanno i parametri ma non
  il gancio di gioco: sono delle storie vicine.

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
**Status**: [x] Created — `gioco/qa/economia.test.mjs` (13 casi: contenuti, regole del codice, tabella dei prezzi, formule,
drop su 10 000 stanze, pool, un caso per criterio 1-4, prestazioni), tutti verdi; le suite esistenti restano verdi.

**Evidenza**: `node gioco/qa/economia.test.mjs` → 13/13 pass (2026-11-08); `production/qa/evidence/economia-banchetto.png`
(banchetto del piano 1 in fil di ferro con `?debug=1&wire=1&piano=1&seme=1845`: slot sui banchi, HUD, lista DOM con prezzo
barrato, consumabile venduto; zero errori in console).

---

## Dependencies

- Depends on: Story 023, Story 026
- Unlocks: Story 018, Story 031
