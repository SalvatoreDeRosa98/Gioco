# Story 018: Pericoli ambientali e ricompense a stanza pulita

> **Epic**: Stanze e piano 1
> **Status**: Done
> **Layer**: Core
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-08

## Context

**GDD**: `design/gdd/stanze-porte.md, design/gdd/generazione-piani.md`
**Requirement**: NOT ASSESSED (TR registry non generato: vedi le regole e i criteri del GDD citati nelle note)
**ADR Governing Implementation**: ADR-0003, ADR-0005, ADR-0006
**ADR Decision Summary**: vedi `docs/architecture/architecture.md` §5
**ADR Version**: 2026-11-07 (Proposed: in attesa della conferma dell'autore)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW (API del browser pre-cutoff; `docs/engine-reference/` non ha una voce Web: NOT SOURCEABLE)
**Engine Notes**: nessuna API post-cutoff; verifica su Chromium (Playwright) e Firefox prima del vertical slice

**Control Manifest Rules (this layer)**: N/A (nessun manifest). Regole fisse del progetto: nessun numero di gioco nel codice (`contenuti/parametri/*.json`), nessun `Math.random` (rng seminato), nessuna stringa di gioco nel motore, dipendenze solo verso il basso (eventi verso l'alto).

---

## Acceptance Criteria

*Dai GDD citati, scoped a questa storia:*

- [x] GIVEN un braciere, WHEN Ferruccio lo tocca senza invulnerabilità, THEN perde 1 maschera ed è spinto; il braciere si legge in sagoma (tratteggio a terra)
- [x] GIVEN una stanza normale pulita, WHEN le porte si riaprono, THEN cadono monete secondo la formula di ricompensa del GDD stanze con il generatore `drop` derivato dal seme
- [x] GIVEN una stanza già pulita, WHEN si rientra, THEN nessuna nuova ricompensa

---

## Implementation Notes

GDD stanze-porte (pericoli, ricompense), economia (drop).

Implementato (2026-11-08):
- `gioco/motore/mondo/stanza.js`: ciclo del braciere `riposo → anticipo → attivo` (`stanze.braciere.*`, fase iniziale
  dal generatore derivato `pericoli` del `seme_stanza`: stesso seme → stesse fasi, i due bracieri di una stanza non vanno
  all'unisono); in ogni stato della stanza, anche `pulita` (`hazard_in_pulita`), solo in `attivo` e solo se il disco
  `r_fiamma` tocca il corpo, `ferruccio.subisciDanno({danno: stanze.danno_pericolo, x, y})`: invulnerabilità, scatto e
  spinta radiale dal piede li decide Ferruccio (regole 5-8 di controllo-ferruccio); può uccidere (`hazard_letale`); i
  nemici non sono toccati. Evento `stanza.pericolo` {id, pericolo, x, y, danno}. Funzioni pure `fasePericolo` e
  `puntoSicuro`; ogni pericolo espone `fase`, `progresso`, `sfasamento`.
- `stanza.ricompensa` porta ora anche `dispersione` (`stanze.r_dispersione_ricompensa`, 48 px della regola 24) e il
  gancio `puntoSicuro(x, y)` (cella libera più vicina se il punto cade su ostacolo `ferma_passo` o su un disco di pericolo).
- `gioco/motore/oggetti/economia.js`: alla ricompensa, dopo il bonus di stanza di economia.md, lascia a terra gli oggetti
  pre-estratti della stanza (`ricompensa.oggetti`, formula `valore_ricompensa` del generatore) sparsi con il generatore
  `drop`: monete e cuori a terra, scintille accreditate subito al profilo (come quelle del boss). `ricompensa_data` resta
  vero nello stato salvato della notte: al rientro (anche rimontando la stanza) nessuna nuova ricompensa.
- `gioco/motore/resa/debug.js` (wire): piede pieno; cerchio tratteggiato largo in `anticipo`, fitto e spesso in `attivo`,
  assente in `riposo`; etichetta con la fase.

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
**Status**: [x] Creato e superato (2026-11-08)
**Evidenza**: `gioco/qa/mondo.test.mjs`, casi «018 formule» (fasePericolo periodico, puntoSicuro), «018: GIVEN un braciere…»
(pd-n-04: nessun danno in riposo/anticipo; anticipo = t_anticipo = 42 tick ≥ 700 ms; 1 maschera al primo tick attivo,
Colpito, spinta radiale +x e spostamento, evento `stanza.pericolo`; una sola maschera per fase attiva; lo scatto attraversa
la fiamma attiva senza danno; con 1 maschera muore; stesse fasi iniziali con lo stesso seme), «018: GIVEN una stanza normale
pulita…» (economia reale con `drop` derivato dal seme: a terra `bonus_stanza` + le monete pre-estratte, i cuori
pre-estratti, le scintille nel profilo; ogni oggetto entro 48 px dal centro o al centro di una cella sicura, mai su ostacolo
o pericolo; stesso seme → stesse posizioni) e «018: GIVEN una stanza già pulita…» (rientro dalla notte e rimontaggio dallo
stato salvato: un solo `stanza.ricompensa`, oggetti fermi, monete raccolte non ricompaiono). Suite: 21/21.
Osservazione nel browser (non è un test): `production/qa/evidence/pericoli-ricompensa-wire.png` (seme 1846, stanza `pd-n-05`
ripulita, braciere `attivo` che colpisce Ferruccio — maschere 5 → 4, corpo tratteggiato = invulnerabile — moneta della
ricompensa a terra, zero errori in console).

---

## Dependencies

- Depends on: Story 014, Story 025
- Unlocks: None

## Note di implementazione (da rivedere con il game-designer)

- Due regole si sommano alla chiusura: il `bonus_stanza` (2 monete al centro, economia.md regola 2) E la ricompensa
  pre-estratta di stanze-porte.md (regola 23). Il GDD economia non dice se il bonus È la ricompensa in unità o si aggiunge;
  qui si aggiungono entrambe (le prove della storia 025 restano verdi). Da riconciliare.
- La scintilla della ricompensa (3 unità) va subito al profilo, come quelle del boss: non esiste un oggetto «scintilla a
  terra» (TIPI_OGGETTO = moneta, cuore). Se il designer vuole la scintilla raccoglibile, va aggiunto il tipo all'economia e al wire.
- `hazard_letale` / `hazard_in_pulita` / `hazard_danneggia_nemici` sono flag booleani del GDD: `parametri.js` accetta solo
  statistiche numeriche, quindi sono comportamenti fissi nel codice (sì / sì / no), non manopole.
- «Tocca» = il cerchio del corpo (`r_corpo`) tocca il disco `r_fiamma` (non il solo centro di Ferruccio).
- La dispersione della ricompensa usa il generatore `drop` dell'economia (storia), non `rng_ric` della stanza (GDD regola 24):
  il valore e i tipi restano pre-estratti e deterministici dal seme del piano; cambiano solo i punti di caduta.
- Non fatti: `siepe_spinosa` e `rigagnolo` (nessun modello del piano 1 li usa); la grafica definitiva del braciere (fiamma a
  tre punte) aspetta il renderer approvato.
