# Story 019: IA a stati, separazione, telegrafo in tre tempi, stordimento, anima

> **Epic**: Nemici e Gatto dei Quattro Canti
> **Status**: Done
> **Layer**: Feature
> **Type**: Logic
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

- [x] GIVEN un nemico in Insegue, WHEN arriva a `r_nemico + r_corpo + 6` px, THEN si ferma e non tocca Ferruccio camminando — `nemici.test.mjs` «019 c1» (+ «c1 bis»: senza gettone tiene `d_attesa`)
- [x] GIVEN due nemici sovrapposti, WHEN passa 1 tick, THEN si separano (nessuna compenetrazione oltre 2 px dopo 10 tick) — «019 c2» (anche pesante vs leggero, 4 gatti per 2 s)
- [x] GIVEN un attacco, WHEN parte, THEN segue Anticipo → Lampo → Colpo con i tempi del nemico in `parametri/nemici.json`; il Lampo emette l'evento `telegrafo.lampo` — «019 c3» (+ «c3 bis»: armatura del telegrafo, R5 imparabile)
- [x] GIVEN una parata riuscita, WHEN avviene, THEN il nemico è Stordito 600 ms (boss: 900 ms con immunità 5 s) — «019 c4» e «019 c4 boss» (il boss è il flag `boss` della factory: l'archetipo del boss arriva con la 022)
- [x] GIVEN vita ≤ 0, WHEN avviene, THEN l'evento `nemico.morto` e la sagoma si dissolve in un'anima azzurra; cadono monete — «019 c5» (+ «c5 bis»); l'anima è lo stato `morto` con `dissoluzione` 0→1 in 700 ms e `puntini` = pezzi: la resa vera dei puntini aspetta il renderer approvato (in `wire` il cerchio sfuma tratteggiato)

---

## Implementation Notes

GDD nemici sezioni stati e transizioni, regola 2 (contatto passivo innocuo), armatura del telegrafo (prototipo).

**Implementazione (2026-11-07, gameplay-programmer, sessione autonoma):**
- `gioco/contenuti/parametri/nemici.json`: `globali`, `scalatura` (F1-F3), `direttore` (gettoni e imparabili per piano, gap 350), `drop` (F9, monete), `archetipi.{gatto,vespa,statua,guardia}` con `attacco.*` (tre tempi, recupero, cooldown, banda, geometria, flag 0/1).
- `gioco/motore/attori/nemico.js`: `creaNemico({archetipo, piano, boss, elite, ferito, direttore, altri, rng, …})`, formule pure `scalaVita/scalaVelocita/scalaAnticipo`, `monetePerMorte`, `probabilitaCuore`, `schedaArchetipo`, `validaSchede` (R2, R4, pezzi). Contratto del combattimento invariato; il Colpo ferisce solo via `comeBersaglio.colpisci(attacco)`; hitbox rettangolo spazzato (origine all'inizio del Colpo, F4) o settore.
- `gioco/motore/attori/ia/base.js`: macchina a stati con `STATI_NEMICO`/`TRANSIZIONI_NEMICO`; `ia/direttore.js`: gettoni per stanza (si azzera a `stanza.entrata`).
- `avvio.js`: la factory delle ondate crea nemici veri (la stanza non cambia: riceve `creaNemico` iniettato); `creaFantoccio` resta per la scena wire e i test del combattimento; `notte.js` toglie dai bersagli i nemici dissolti; `resa/debug.js` disegna hitbox del colpo, freccia della direzione e dissoluzione; `?debug=1&wire=1&nemico=<archetipo>`.
- Eventi nuovi (verso l'alto): `telegrafo.anticipo`, `telegrafo.lampo`, `telegrafo.colpo`, `nemico.colpo`, `nemico.stordito`, `nemico.stato`, `nemico.morto` (con `monete`, `cuore`, `pezzi`), `nemico.bottino`.

**Decisioni da confermare / rimandate alle storie 020-022:** anello d'attesa orbitante, `d_balzo` e `balzo_hit_dal`, atterraggio della vespa, proiettile della statua, rotazione a scatti, campo di flusso (qui linea retta con scivolamento), coda con invecchiamento del direttore (§8.4), mercy del cuore (F9), élite (flag presente, pattern extra assente). Il nemico troppo vicino per attaccare (`d < d_min`) arretra fino alla banda (decisione dell'implementazione: senza, i gatti dopo il balzo restavano addosso a Ferruccio e non attaccavano più). Vedi anche «Valori provvisori» in `gioco/README.md`.

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
**Status**: [x] `gioco/qa/nemici.test.mjs` — 19 casi, tutti verdi (`node gioco/qa/nemici.test.mjs`)

**Evidenza**: `node gioco/qa/nemici.test.mjs` → `# tests 19 / # pass 19 / # fail 0` (2026-11-07); suite esistenti verdi: fondazione 28/28, combattimento 32/32, condizioni 37/37, doni 20/20, mondo 17/17, parametri 4/4, pagina 5/5, combattimento.wire 2/2, mondo.wire 2/2 (`production/qa/evidence/mondo-wire.png` rigenerato con i nemici veri).

---

## Dependencies

- Depends on: Story 008, Story 009, Story 011
- Unlocks: Story 020, Story 021
