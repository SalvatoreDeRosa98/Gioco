# Story 029: Hub di Piazza Dante tra le notti

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

- [x] GIVEN l'avvio dopo il menu, WHEN si entra nell'hub, THEN Piazza Dante di notte con luna immobile, fili d'oro, Tonino al banchetto, la porta della bottega chiusa, l'ingresso al piano 1 segnato — in fil di ferro (`?debug=1&wire=1&hub=1`: il menu non esiste ancora, il ciclo entra in `hub` all'avvio); test H01 e `hub.wire.test.js`
- [x] GIVEN `taddeo = perdonato`, WHEN si torna nell'hub, THEN Taddeo è presente; con `agnese = risvegliata`, Agnese sotto il portico; Mariella è solo una finestra accesa — presenze risolte sullo stato narrativo a ogni lettura (`quando` del modello); test H02 e `hub.wire.test.js`
- [x] GIVEN l'ingresso al piano, WHEN si attraversa, THEN parte la notte con un nuovo seme e `notte` non cambia finché non si muore — `hub.partenza` {piano, seme} con `seme = derivato(profilo, 'notte#N')`, piano 1 generato e ciclo in `notte`, avanzamento `notte` invariato; test H03 e `hub.wire.test.js`
- [x] Screenshot conservato dell'hub — `production/qa/evidence/hub-wire.png` (base) e `hub-presenze.png` (con Taddeo e Agnese)

---

## Implementation Notes

GDD incontri regola 7, art bible §2 (hub). La Fucina resta chiusa nell'MVP (si apre al piano 2, decisione provvisoria).

**Implementazione (2026-11-08, gameplay-programmer):**
- `gioco/motore/mondo/hub.js`: l'hub come stanza speciale. Monta il modello `gioco/contenuti/modelli-stanza/hub/piazza-dante.json` nel campo condiviso (legenda dei modelli del piano: `B` banco, `C` colonne del portico), mura chiuse tranne lo slot dell'`ingresso` (porta speciale, passabile). `presenze()` risolve a ogni lettura le presenze del modello sullo stato narrativo (`quando` con la sintassi delle scene; `aperta_se` per la porta della bottega → `chiusa`/`aperta`); `vicino()` l'NPC presente entro `incontri.r_interazione`; `tick` fa camminare Ferruccio (fermo a dialogo aperto: nell'hub non c'è la pausa logica del ciclo), `interagisci` apre l'ancoraggio `hub:<npc>`, il contatto con la cella dell'ingresso emette UNA volta `hub.partenza` {piano, seme, notte}. `semeNotte(semeProfilo, notte)` = `derivato(creaRng(semeProfilo), 'notte#N')`. `entra()` posiziona sull'`arrivo`, emette `hub.entrata` e fa partire le `automatiche` del modello con `quando` vero. `validaModelloHub` controlla il modello (errori di contenuto).
- `gioco/motore/avvio.js`: `?debug=1&wire=1&hub=1` compone l'hub, il ciclo resta in `hub`; la notte è ora avviabile dopo (`avviaNotte({seme, piano})` riusata dal `?piano=N`), `notte` è letta in modo pigro ovunque; a `hub.partenza` → piano generato con il seme derivato, `ciclo.vaiA('notte')`, `incontri.automatiche('ingresso-piano:N')`. I fantocci della scena di prova non entrano nell'hub.
- `gioco/motore/interfaccia/hub.js` + `interfaccia.json › hub` + `stile/interfaccia.css`: cartellino DOM minimale (notte, suggerimento per parlare/partire).
- `gioco/motore/resa/debug.js`: fil di ferro dell'hub (luna, fili d'oro, finestre, porta della bottega, NPC presenti con alone, ingresso con soglia d'oro) e riga di stato (`ciclo`, `hub … notte N seme notte …`).
- Decisioni provvisorie (da confermare): le scene `ingresso-piano:1` partono da sole entrando nell'hub alla notte 1 (la Piazza è hub e piano 1); Taddeo e Agnese hanno ancoraggi `hub:taddeo`/`hub:agnese` ma nessuna scena né battuta di ripetizione (testi del writer); nell'hub Tonino è solo dialogo (nessuna vendita); il menu non esiste: il criterio 1 è verificato dall'ingresso diretto nello stato `hub`.

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
**Status**: [x] Created and passing
**Evidenza**: `node gioco/qa/incontri.test.mjs` (H01-H05, R02: 23/23 verdi), `node gioco/qa/hub.wire.test.js` (1/1 verde, zero errori in console); screenshot conservati `production/qa/evidence/hub-wire.png` e `production/qa/evidence/hub-presenze.png`; suite esistenti verdi (fondazione 28, combattimento 32, condizioni 37, doni 27, mondo 21, nemici 24, economia 13, ricordi 9, doni.integrazione 9, parametri 4; Playwright pagina 5/5, combattimento.wire 2/2, mondo.wire 2/2, cartiglio.wire 2/2, doni.wire 1/1, ricordi.wire 2/2).

---

## Dependencies

- Depends on: Story 027, Story 014
- Unlocks: Story 030
