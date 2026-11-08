# Story 024: Catalogo dei 12 doni MVP, pool, piedistallo, cartiglio del dono

> **Epic**: Doni ed economia
> **Status**: Done
> **Layer**: Feature
> **Type**: Integration
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

- [x] GIVEN `contenuti/parametri/doni.json`, WHEN si carica, THEN contiene i 12 doni MVP del GDD con modificatori validi — `doni.test.mjs` S024-1 (validatore, registro, ognuno si raccoglie e cambia una statistica o iscrive un gancio)
- [x] GIVEN la stanza del tesoro, WHEN Ferruccio preme interagisci davanti al piedistallo sotto il cono di luce, THEN raccoglie il dono, il cartiglio mostra nome e una riga, il dono esce dal pool della notte e l'HUD lo elenca — `doni.integrazione.test.mjs` S024-2 (raccolta entro 2 tick in Cammina, cartiglio 3000 ± 100 ms senza pausa, pool, HUD, rientro) e `doni.wire.test.js` (pagina vera, DOM, screenshot)
- [x] GIVEN un ricordo azzurro, WHEN è nel pool, THEN la sua sagoma è il profilo dell'oggetto dentro un'anima azzurra; un dono d'oro è una forma geometrica d'oro — `doni.test.mjs` S024-3 (dati: `sagoma.tipo` profilo/geometrica, forme d'oro mai disco né rombo) e S024-2b (classi `azzurro`/`oro` del cartiglio e dell'HUD; nel wire il piedistallo del ricordo è azzurro). Il disegno vero della sagoma aspetta il renderer approvato dall'autore
- [x] GIVEN `escludi_se_flag`, WHEN il flag è deciso, THEN il ricordo non è estratto — `doni.test.mjs` S024-4 (Medaglione fuori dal canale `boss` con `tonino_ricordo=restituito`; `richiede_flag` apre la Lettera di Agnese; flag fotografati alla generazione del piano)

Criteri del GDD coperti oltre la storia: probabilità 10 % / 7,5 % / 10 % e 12 % dopo il Mantice; P(Broccato) 11 % al piano 5; 1000 estrazioni senza il dono raccolto; due piedistalli dal piano 3 (l'altro inerte); pool vuoto → sostituto; «già al massimo»; ganci `su_colpo/uccisione/parata/affondo/danno_subito/stanza_pulita/raccolta` collegati; scintilla/catena/onda/cura eseguite dagli attori.

---

## Implementation Notes

GDD doni (catalogo, pool, piedistallo), art bible Principio B.

**Com'è fatto (2026-11-08):**
- `motore/oggetti/pool.js`: eleggibilità (regola 7), estrazione a due stadi con `rng` derivato `pool`, `probabilita()` in forma chiusa, rimozione alla raccolta (anche via `doni.aggiunto`), offerti per piano, fotografia dei flag per piano, `fallback()`. I pesi W0_r/d_r e `fallback_monete` restano in `economia.json › banchetto` (già lì dalla storia 025) e sono iniettati da `avvio.js`.
- `motore/oggetti/piedistallo.js`: piedistalli per stanza `tesoro` (1; 2 da `doni.piedistallo.piano_doppio`), punti dai `contenuti` del modello, raccolta con `interagisci` in Fermo/Cammina/Recupero scatto entro `economia.r_interagisci`, anteprima entro `r_anteprima`, inerte/preso, stato conservato al rientro, `alMassimo`.
- `motore/attori/effetti-doni.js`: `collegaGanci` (eventi → `modificatori.ganci.emetti`) e `collegaEffettiDoni` (`doni.scintilla/catena/onda/cura/ricarica_scatto` eseguiti su `bersagli`/`proiettili`/Ferruccio); `creaScintilla` in `bersaglio.js`; parametri del proiettile in `combattimento.json › scintilla`.
- `motore/interfaccia/doni.js` + `stile/interfaccia.css` + `contenuti/interfaccia.json › doni`: HUD dei doni (fila di sagome come testo provvisorio, alone azzurro per i ricordi) e cartiglio (nome, riga, avviso), anteprima tratteggiata; DOM minimale, non grafica definitiva.
- `avvio.js`: composizione, `modificatori.tick(dt)` nel ciclo, piedistalli attivi nella stanza `tesoro`, banchetto sul pool (canale `banchetto`), `__gioco.pool/piedistalli/effettiDoni/cartiglio()/flag`. `resa/debug.js` disegna piedistalli, cono di luce e scintille d'oro.

**Decisioni da confermare:** `su_affondo` = primo `ferruccio.colpo` mentre il combattimento è in `affondo`; la scintilla esclude il bersaglio da cui parte; `su_raccolta` scatta anche per il dono appena raccolto; `combattimento.scintilla.{velocita 420, r 5, gittata 260}` provvisori; i flag del pool vengono da `__gioco.flag` finché lo stato narrativo (storia 026) non è composto in `avvio.js`; lo stato dei piedistalli non è ancora serializzato (storia 032); fili di sinergia nell'HUD e `rilascia()` non sono di questa storia (regola 11, storia 022).

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
**Status**: [x] Created — `gioco/qa/doni.test.mjs` (+7 casi della storia 024: catalogo MVP, sagome, probabilità, rimozione, flag, bus), `gioco/qa/doni.integrazione.test.mjs` (9 casi: piedistallo, cartiglio, HUD, doppio, sostituto, banchetto sul pool, ganci ed effetti, regole del codice), `gioco/qa/doni.wire.test.js` (Playwright: pagina vera con DOM e screenshot)

**Evidenza**: `node gioco/qa/doni.test.mjs` → 27/27 pass; `node gioco/qa/doni.integrazione.test.mjs` → 9/9 pass; `node gioco/qa/doni.wire.test.js` → 1/1 (2026-11-08); `production/qa/evidence/doni-piedistallo.png` (bottega in fil di ferro: piedistallo preso, cartiglio acceso con nome e riga, HUD dei doni con la sagoma). Suite preesistenti verdi: fondazione 28, combattimento 32, condizioni 37, mondo 17, economia 13, nemici 24, parametri 4, pagina 5/5, combattimento.wire 2/2, mondo.wire 2/2.

---

## Dependencies

- Depends on: Story 023, Story 014
- Unlocks: Story 022, Story 028, Story 031
