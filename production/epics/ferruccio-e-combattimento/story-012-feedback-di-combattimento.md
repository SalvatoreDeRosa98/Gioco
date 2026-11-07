# Story 012: Feedback dei colpi «come in Isaac»: hit-stop, flash, schizzi d'inchiostro, squash, scossa, anima

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

- [ ] GIVEN un colpo a segno, WHEN avviene, THEN tutto si ferma 50 ms, il nemico diventa **bianco pieno per 2 frame** poi torna nero, la sua sagoma si **schiaccia** (squash 0,8×1,2 per 80 ms) nella direzione del colpo, arretra visibilmente, e una scia bianca disegna il settore esatto della hitbox per 120 ms
- [ ] GIVEN un colpo a segno, WHEN avviene, THEN partono **schizzi d'inchiostro** (6-10 gocce con il generatore `fx`) che cadono sulla carta e vi restano come **macchie** fino alla fine della stanza (come il sangue in Isaac, ma inchiostro su carta), e un breve soffio di particelle di carta chiara dal punto d'impatto
- [ ] GIVEN il colpo, WHEN la camera reagisce, THEN scossa direzionale di 3 px per 90 ms (6 px e 150 ms per il terzo fendente e l'affondo)
- [ ] GIVEN l'autore che gioca, WHEN colpisce un gatto, THEN giudica il colpo «marcato»: criterio di sign-off obbligatorio, screenshot e breve video (GIF) conservati
- [ ] GIVEN una parata riuscita, WHEN avviene, THEN anello bianco, hit-stop 90 ms, scossa 6 px 150 ms decadente
- [ ] GIVEN un'uccisione, WHEN avviene, THEN hit-stop 110 ms, la sagoma si **spezza in 3-5 frammenti di carta nera** che cadono con l'inchiostro, e un'anima azzurra sale per 2 s
- [ ] GIVEN 6 nemici colpiti dal terzo fendente, WHEN avviene, THEN un solo hit-stop
- [ ] Screenshot conservati: `production/qa/evidence/feedback-colpo.png`, `-parata.png`, `-anima.png`, più `feedback-colpo.gif` (10 frame)

---

## Implementation Notes

ADR-0005: `effetti.js` ascolta gli eventi; i moduli di gioco non conoscono la camera. GDD combattimento regola 8 e sezione Game Feel. **Richiesta esplicita dell'autore dopo il prototipo: il feedback deve essere marcato come in The Binding of Isaac.** Riferimenti: in Isaac il nemico lampeggia, arretra, sanguina sul pavimento, muore in pezzi; qui l'equivalente è flash bianco, squash, schizzi e macchie d'inchiostro sulla carta, frammenti di carta. Suono in una storia successiva (audio).

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

- Depends on: Story 009, Story 011
- Unlocks: None
