# Story P09: Economia e Patto — scarsità del piano 1, prezzi dell'autore, reliquie potentissime (raggio continuo, lacrime spettrali)

> **Epic**: Doni ed economia
> **Status**: Done
> **Layer**: Feature
> **Type**: Logic + Visual
> **Estimate**: M
> **Manifest Version**: N/A
> **Last Updated**: 2026-11-09

## Context

Richieste testuali dell'autore (2026-11-08): (a) **scarsità**: al piano 1 si raccolgono in media 5-8 monete in tutto; prezzi alla
Fucina/banchetto Cuore 3, Oggetto forte 7, base 5, consumabile 2 (sostituiscono i 10/15-18 del Teatro: il dilemma «compro la vita o
risparmio per l'oggetto»); (b) **il Patto deve far paura**: scambiare un contenitore di maschera permanente è angosciante, quindi le
reliquie devono essere potentissime: Raggio Cremisi Continuo (laser tenuto alla Brimstone), Lacrime Spettrali (attraversano muri e
ostacoli), moltiplicatori ≥ ×2, stanza del patto più cupa, pannello che dice chiaramente «−1 Maschera massima per sempre».

---

## Acceptance Criteria (Given-When-Then)

- [x] GIVEN `economia.json`, WHEN si simulano 1000 piani 1 completi (ogni stanza normale pulita con i suoi nemici e i drop, ricompense pre-estratte dalla pianta, segreta, boss), THEN la media delle monete sta in [5, 8] — `economia.test.mjs` P09: **media 7,16** (817 piani su 1000 con la segreta). Taratura: `p_drop_moneta` 0,12 (invariato), `monete_segreta` 7 → 2, `monete_boss.s0` 1 → 0 (1 moneta al piano 1), `bonus_stanza` 0.
- [x] GIVEN i prezzi, WHEN si leggono dal JSON con la formula intera, THEN cuore 3, dono base (comune) 5, dono forte (raro/prezioso, `rar_pct` 140 %) 7, consumabile 2, costanti sui piani — `economia.test.mjs` contenuti e prezzo (letti dal JSON, non costanti).
- [x] GIVEN il Raggio Cremisi Continuo, WHEN la freccia è tenuta, THEN per `carica_ms` nessun proiettile, poi il raggio è acceso: ogni `tick_ms` DMG × `frazione_danno_tick` a TUTTI i bersagli sulla linea (larghezza `larghezza`, lunghezza range × `molt_portata`) e a nessuno fuori linea o dietro; rilasciando si spegne; dopo `durata_ms` si spegne e si ricarica — `patto.test.mjs` P3; `patto.wire.test.js` (`patto-raggio.png`: raggio acceso attraverso due gatti, il terzo fuori linea intatto).
- [x] GIVEN le Lacrime Spettrali, WHEN il proiettile incontra un ostacolo, THEN lo attraversa e ferisce chi sta dietro, morendo al bordo del campo o alla portata; un proiettile normale si ferma sull'ostacolo (`ferruccio.colpo_muro`) — P4.
- [x] GIVEN un patto stretto, WHEN si cambia stanza e piano, THEN la maschera massima in meno resta (−1 permanente nella run); nuova run → patti sciolti — P2.
- [x] GIVEN i patti, THEN tutti hanno `dmgMult` ≥ 2, superiore al miglior dono del catalogo — `patto.test.mjs` contenuti, `statistiche.test.mjs`.
- [x] GIVEN la stanza dell'altare, THEN il renderer la vela di rosso cupo e il pannello di conferma mostra «−1 Maschera massima per sempre» — `patto-conferma.png`, `patto.png`.

## Evidenza

- `production/qa/evidence/patto-raggio.png`, `production/qa/evidence/patto-conferma.png`.
- `economia.test.mjs` stampa `# scarsità piano 1: media 7.16 monete su 1000 piani`.

## Decisioni

1. **Boss a 1 moneta al piano 1** (`monete_boss.s0` 0, min 0): le ricompense pre-estratte delle stanze (`stanze.json`, perimetro mondo) pesano ~4 monete al piano 1; per restare in [5, 8] senza toccare il generatore si è tolto al boss e alla segreta (2 monete). Il test di `moneteBoss` legge ora s0 + k dal JSON.
2. **Prezzi via `rar_pct`**: il banchetto usa le rarità del pool (comune/raro/prezioso); «forte» = raro e prezioso a 140 % di 5 = 7. La tabella `teatro.prezzo` in `doni.json` (10/15-18) resta come dato storico del Teatro e NON è letta dal banchetto.
3. **Raggio**: numeri provvisori da confermare con il game-designer (`patto.json › regole.raggio`: carica 250 ms, durata 1200 ms, tick 100 ms, 35 % del DMG per tick ≈ 3,5 × DMG al secondo, larghezza 28 px, portata ×1,6). Il raggio non usa `lineaLibera`: attraversa gli ostacoli come Brimstone.
4. **Spettrale**: i proiettili non «rientrano dal bordo opposto»: muoiono al bordo del campo (richiesta dell'autore).
