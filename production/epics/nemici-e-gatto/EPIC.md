# Epic: Nemici e Gatto dei Quattro Canti

> **Layer**: Feature
> **GDD**: design/gdd/nemici.md, design/gdd/boss.md
> **Architecture Module**: motore/attori/nemico.js, ia/, boss/
> **Status**: Ready
> **Stories**: 4 storie (sotto)

## Overview

L'IA a stati con il telegrafo in tre tempi (anticipo, lampo, colpo), la separazione, lo stordimento e la dissoluzione in anima; i quattro archetipi dell'MVP e il primo boss a due fasi.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0002 | vedi `docs/architecture/adr-0002.md` | LOW |
| ADR-0003 | vedi `docs/architecture/adr-0003.md` | LOW |
| ADR-0005 | vedi `docs/architecture/adr-0005.md` | LOW |

## GDD Requirements

*(Il TR registry non è stato ancora generato da `/architecture-review`: i requisiti sono citati per sezione del GDD. NOT ASSESSED finché la review non assegna i TR-ID.)*

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| NOT ASSESSED | I requisiti sono le regole numerate e i criteri Given-When-Then dei GDD citati sopra | ADR-0002, ADR-0003, ADR-0005 (Proposed) |

## Definition of Done

- Tutte le storie implementate, riviste e chiuse con `/story-done`
- Tutti i criteri di accettazione dei GDD citati verificati
- Le storie Logic e Integration hanno test in `gioco/qa/` che passano
- Le storie Visual/Feel e UI hanno screenshot conservati in `production/qa/evidence/`

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 019 | IA a stati, separazione, telegrafo in tre tempi, stordimento, anima | Logic | Done (`gioco/qa/nemici.test.mjs`, 19/19) | ADR-0002 |
| 020 | Gatto d'ombra | Integration | Ready — logica e wire fatti (`gioco/qa/nemici.test.mjs`, 24/24; bot 100% parate, stanza media 6,6 s ma 3,8-12,2 per stanza); mancano sagoma vera + sign-off e screenshot | ADR-0002 |
| 021 | Vespa dorata, statua animata, guardia del Velo | Integration | Done tramite P05 (la statua e la guardia del Teatro sono tiratori; la vespa resta quella della 019; `gioco/qa/nemici.test.mjs` 32/32) | ADR-0002 |
| P05 | Nemici alla Isaac del Teatro e proiettili nemici — maschera, bomba, predone, statua a croci, guardia a doppietta, `attori/proiettili-nemici.js`, telegrafo solo sul corpo | Integration | Done (`gioco/qa/nemici.test.mjs` 32/32, `gioco/qa/nemici.wire.test.js` 7/7, `production/qa/evidence/nemici-<archetipo>.png`) | ADR-0002, ADR-0003 |
| 022 | Boss: il Gatto dei Quattro Canti | Integration | Superata da P06 (il Gatto è il `re-gatto` del pool con il pattern `monstro_jump` del Teatro) | ADR-0002 |
| P01 | Boss provvisorio e uscita del piano — provvisoria per la build di prova; sostituita dalla P06 | Integration | Done (`gioco/qa/boss-provvisorio.test.mjs` 5/5; l'uscita e la discesa restano) | ADR-0002, ADR-0006 |
| P06 | Boss del pool (monstro_jump, chub_charge, duke_flies, gurdy_turret, scissor_blades), Donna Luciana (marionette_queen), stato della run (`mondo/run.js`), sipario narrativo, ciclo infinito, `boss.sconfitto` con l'id vero, boss_battuti e profilo | Integration | Done (`gioco/qa/boss.test.mjs` 19/19, `gioco/qa/boss.wire.test.js` 8/8, `production/qa/evidence/boss-<id>.png`, `sipario.png`) | ADR-0002, ADR-0003, ADR-0006 |
| P15 | Cuciture fra squadre: la segreta combatte (predoni dorati, bottino ×2), l'esplosione apre la Crepa Dorata, un solo evento `nemico.esplosione`, Tamburello con `cancellaInRaggio`, eventi dei boss per il feel, `aperta`/`riflesso` per il renderer, zero numeri in `sparaProiettili` | Logic | Done (`gioco/qa/mondo.test.mjs` 24/24, `nemici.test.mjs` 35/35, `attivi.test.mjs` 8/8, `combattimento.test.mjs` 39/39, `feel.test.mjs`, `audio.test.mjs`; nessuna novità visibile: niente screenshot nuovo) | ADR-0002, ADR-0003 |
