# Epic: Ferruccio e combattimento

> **Layer**: Core
> **GDD**: design/gdd/controllo-ferruccio.md, design/gdd/combattimento.md
> **Architecture Module**: motore/attori/ferruccio.js, combattimento.js, motore/resa/effetti.js
> **Status**: Ready
> **Stories**: 7 storie (sotto)

## Overview

Il corpo e la spada: movimento in otto direzioni, scatto invulnerabile, maschere e danno, fendente a settore con combo, affondo caricato, parata con stordimento e controcolpo, e tutto il feedback (hit-stop, scossa, scie). I valori tarati dal prototipo `prototypes/stanza-gatti-concept/REPORT.md` sono il punto di partenza.

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
| 007 | Movimento in otto direzioni, collisioni con le mura, scatto | Logic | Done | ADR-0002 |
| 008 | Maschere, danno subito, invulnerabilità, spinta, morte | Logic | Done | ADR-0002 |
| 009 | Fendente a settore, combo da tre, buffer e cancellazioni | Logic | Done | ADR-0002 |
| 010 | Affondo caricato | Logic | Done | ADR-0002 |
| 011 | Parata, stordimento, controcolpo, riflesso | Logic | Done | ADR-0002 |
| 012 | Hit-stop, scossa, scie, lampi, anima | Visual/Feel | Done tramite P08 (hit-stop, scossa contestuale, lampeggio, macchie; scie/anima restano al renderer del Teatro) | ADR-0002 |
| 013 | Sagoma di Ferruccio: pezzi, pose, sciarpa, lama orientabile | Visual/Feel | Ready | ADR-0002 |
| P08 | Game feel (richieste testuali dell'autore): i-frames ≥ 1000 ms con lampeggio semitrasparente e rimbalzo, hit-stop nel ciclo (`congela`), knockback ∝ 1/peso, scossa contestuale, macchie permanenti per stanza — `resa.json`, `resa/feel.js` | Visual/Feel + Logic | Done (`feel.test.mjs` 7/7, `feel.wire.test.js` 3/3 con `feel-iframes.png` e `feel-macchie.png`; tutte le suite verdi) | ADR-0002, ADR-0003 |
