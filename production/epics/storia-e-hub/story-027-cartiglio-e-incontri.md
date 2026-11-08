# Story 027: Cartiglio, didascalie, tableau, incontri per ancoraggio

> **Epic**: Storia e hub
> **Status**: Done
> **Layer**: Feature
> **Type**: UI
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-08 (Done)

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

- [x] GIVEN notte 1 nell'hub, WHEN si interagisce con Tonino, THEN parte `piazza-dante.tonino-primo-incontro` nel cartiglio (nome in maiuscoletto, didascalie in corsivo, una battuta alla volta, pausa logica) e la seconda interazione dà una ripetizione
- [x] GIVEN una battuta di 140 caratteri, WHEN mostrata, THEN è spezzata in due cartigli dello stesso parlante
- [x] GIVEN nemici vivi nella stanza, WHEN si interagisce, THEN nessun cartiglio
- [x] GIVEN `villa-comunale.ricordo-gaetano`, WHEN parte come tableau, THEN resta ≥ 3 s con una sola voce
- [x] Screenshot conservati: cartiglio, scelta, tableau (`production/qa/evidence/`)

---

## Implementation Notes

GDD incontri regole 1-10; ancoraggi in `contenuti/ancoraggi.json`; etichette in `interfaccia.json`. Il cartiglio è DOM, stile del mockup.

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
**Status**: [x] Creato
**Evidenza**: `node gioco/qa/incontri.test.mjs` → 17/17 pass (S01-S03 spezzatura e formule; K01-K02 ancoraggi di tutto piazza-dante e ripetizioni di Tonino per i tre stati; A01-A08 criteri: notte 1 hub Tonino → primo incontro nell'ordine del file poi ripetizione, tipi senza attesa, porte chiuse → nessun cartiglio + `incontri.rifiutato`, tableau di Gaetano 3180 ms ≥ 3 s con la sola voce «Prima fate uscire i ragazzi!», scelta → `decidi` → esito nello stesso cartiglio, abbandono a metà → non in `scene_viste`; U01-U03 cartiglio DOM: antirimbalzo 160 ms, nessun avanzamento automatico, didascalia senza nome, 140 caratteri → due cartigli dello stesso parlante; R01 regole del codice). `node gioco/qa/cartiglio.wire.test.js` → 2/2 pass: cartiglio con `font-variant: small-caps` calcolato su TONINO, didascalia con `font-style: italic`, ciclo in `pausa` (Ferruccio non cammina), poi `notte`; scelta con due opzioni nessuna selezionata, `giu` + `conferma` → `tonino_ricordo = restituito` salvato, esito; tableau ≥ 3 s, spento dopo la durata; nel piano 1 Tonino al banchetto a porte aperte e nessun cartiglio con un nemico vivo. Screenshot conservati: `production/qa/evidence/cartiglio.png`, `cartiglio-scelta.png`, `tableau.png`. Suite esistenti verdi: fondazione 28, combattimento 32, condizioni 37, doni 27, mondo 21, parametri 4, pagina 5/5, combattimento.wire 2/2, mondo.wire 2/2, doni.wire 1/1.
File: `gioco/motore/storia/incontri.js`, `gioco/motore/ui/{cartiglio,tableau}.js`, `gioco/stile/cartiglio.css`, `gioco/contenuti/{ancoraggi,ripetizioni}.json`, `gioco/contenuti/parametri/incontri.json`, `gioco/contenuti/{interfaccia,narrativa}.json` (aggiunte `incontri`, `tipi_senza_attesa`), `gioco/motore/avvio.js`, `gioco/index.html`, `gioco/qa/{incontri.test.mjs,cartiglio.wire.test.js}`, `gioco/README.md`.
Decisioni e deviazioni (da confermare con l'autore/game-designer): l'hub non esiste ancora (storia 029), quindi il criterio 1 è verificato sull'ancoraggio `hub:tonino` nel test di logica e, in pagina, con lo strumento di QA `?scena=<id>`; `risveglio`, `tutorial` e `targa-commemorativa` hanno ancoraggio `ingresso-piano:1` (partono da sole; le due senza battute sono segnate viste subito, così `tonino-primo-incontro` si sblocca); `scelta-tonino` e i due esiti stanno al `banchetto` (il GDD ricordi dice «banchetto o hub»; una scena ha un solo ancoraggio); `filastrocca` è un tableau in `ricordo:filastrocca`; `bottega-di-gaetano` (senza battute) è saltata con errore di contenuto loggato; la voce di Gaetano ha 28 caratteri (il GDD ne conta 27: 3180 ms, non 3100); `tipi_senza_attesa` (obbligatoria, boss, scelta) aggiunto a `narrativa.json`; la scelta è già funzionante nel cartiglio (opzioni, conferma, `decidi`, esito) ma senza il ricordo in inventario, che è della storia 028; il tableau è un velo di carta chiara con la voce, senza sagome (renderer vero in attesa dell'approvazione); pose del burattino (`posa`) passate ma non disegnate; il pool dei doni legge ancora i flag da `__gioco.flag`; l'icona di «aspetta» a porte chiuse è solo l'evento `incontri.rifiutato` (testo `incontri.aspetta` in interfaccia.json, non ancora mostrato).

---

## Dependencies

- Depends on: Story 026, Story 002
- Unlocks: Story 028, Story 029
