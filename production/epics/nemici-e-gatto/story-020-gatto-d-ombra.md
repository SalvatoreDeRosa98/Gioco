# Story 020: Gatto d'ombra

> **Epic**: Nemici e Gatto dei Quattro Canti
> **Status**: Ready (logica e fil di ferro fatti; mancano la sagoma vera con sign-off, gli screenshot e la durata-stanza per singola stanza)
> **Layer**: Feature
> **Type**: Integration
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

- [x] GIVEN un gatto, WHEN entra in Anticipo, THEN si accuccia (area −25%, posteriore su), poi lampo rosso negli occhi con anello 150 ms, poi balzo di 180 px in 220 ms con hitbox attiva dal 45% del balzo (impatto costante a +252 ms dal lampo) — *soddisfatto nella logica con i numeri del GDD, non con quelli letterali del prototipo*: anticipo 480 → posa accucciata (area 0,75, posteriore su 12°), lampo 320 (R2 vieta un lampo di 150 ms: 150 ms è la chiusura dell'**anello**, `t_anello`, con evento `telegrafo.anello`), balzo `d_balzo = clamp(d_lampo + 24, 100, 170)` in 200 ms, hitbox dal 45% (`hit_dal`): impatto costante a `t_lamp + 0,45·t_imp` = 24 tick ≈ 400 ms dal lampo per 100/150/180 px (coi tempi del prototipo la stessa formula dà il +252). Test `020 c1`, `020 c1 bis`, `020 c1 ter` (anello d'attesa 170 ± 20 px, ≤ 45°/s, verso dal seme).
- [x] GIVEN tre gatti, WHEN attaccano, THEN al massimo 2 contemporaneamente (manopola) — `nemici.direttore.attaccanti_max` (2): gettoni effettivi = min(gettoni del piano, tetto); test `020 c2` (con 1 → uno solo).
- [ ] GIVEN il bot a 120 ms del percorso QA, WHEN gioca 30 stanze con seme fisso, THEN para ≥ 90% dei balzi e la stanza dura 3-7 s — *parzialmente*: bot che preme 120 ms dopo la chiusura dell'anello, seme 1845, 30 stanze da **2 gatti**: 60/60 balzi parati (100%), 0 maschere perse, durata media 6,58 s ma singole stanze 3,75-12,2 s (fuori dai 3-7 s in circa un terzo dei casi). Con 3 gatti a vita 6 (il prototipo aveva vita 3) la stanza dura ~10 s. Il test `020 c3` fissa parate ≥ 90%, media in 3-7 s e singole ≤ 14 s.
- [ ] GIVEN il gatto a 100%, WHEN lo si guarda, THEN è una sagoma di gatto credibile (schiena ad arco, pelo irregolare sul dorso, orecchie, coda a S fluida, zampe), non un insieme di ellissi; occhi come fessure di carta chiara; sign-off dell'autore
- [ ] Screenshot conservati: anticipo, lampo, balzo, stordito, in colore e in grigi

---

## Implementation Notes

GDD nemici (gatto) + valori misurati nel REPORT del prototipo (`balzo_hit_dal` 0,45, armatura del telegrafo). Sagoma in `contenuti/sagome/gatto.json`.

**Fatto (2026-11-07, gameplay-programmer)**: `attori/ia/base.js` (anello d'attesa `omega_attesa`, portata dinamica `balzo_extra`/`balzo_min`, hitbox da `hit_dal`, anello `t_anello` + evento `telegrafo.anello`, `progresso`/`istanteImpatto`), `attori/nemico.js` (chiavi facoltative, hitbox dal 45%, `segnoATerra()`, gancio `posa`), `attori/gatto.js` (nuovo: `posaGatto` pura dai fattori `nemici.archetipi.gatto.posa`, `creaGatto`), `ia/direttore.js` (`attaccantiMax`), `resa/debug.js` (sagoma wire del gatto, anello, segno a terra), `avvio.js` (fabbrica del gatto, tetto), `contenuti/parametri/nemici.json`.

**Da segnalare al game-designer**: (1) con `hit_dal` 0,45 la finestra di pressione valida (F4) diventa 190-370 ms dopo il lampo, non 100-280 come scritto nel GDD 4.1 — o si aggiorna il GDD o si porta `hit_dal` a 0; (2) `d_max` 230 > `portata` 170 + r: i balzi iniziati da più di 186 px vanno a vuoto; (3) «si accuccia del 30% e si accorcia» con «area −25%» non stanno insieme (altezza 0,7 × area 0,75 → lunghezza 1,07); (4) il criterio «stanza 3-7 s» viene dal prototipo a vita 3: con vita 6 e 3 gatti la stanza dura ~10 s; (5) il bot reagisce alla chiusura dell'anello (150 ms): reagendo all'inizio del lampo a 120 ms la pressione cadrebbe prima della finestra.

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
**Status**: [x] Test unitari creati (`gioco/qa/nemici.test.mjs`, casi `020 c1`-`c3`, 24/24 verdi); [ ] screenshot non ancora conservati

**Evidenza**: `node gioco/qa/nemici.test.mjs` → 24 pass / 0 fail (2026-11-07); riga del bot: «balzi arrivati 60, parati 60 (100.0%), maschere perse 0; durata media 6.58 s, min 3.75, max 12.22». Fil di ferro a mano: `?debug=1&wire=1&nemico=gatto` (sagoma a ellisse con orecchie/coda/occhi, anello del lampo, segno a terra tratteggiato). Nessuno screenshot conservato ancora (criterio 5).

---

## Dependencies

- Depends on: Story 019, Story 006
- Unlocks: Story 022
