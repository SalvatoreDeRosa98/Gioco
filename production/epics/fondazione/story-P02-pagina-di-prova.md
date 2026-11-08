# Story P02: Pagina di prova e parametri di avvio dalla pagina (PROVVISORIA)

> **Epic**: Fondazione
> **Status**: Done (provvisoria per la build di prova dell'autore)
> **Layer**: Foundation
> **Type**: UI
> **Estimate**: XS
> **Manifest Version**: N/A (nessun control manifest)
> **Last Updated**: 2026-11-08

## Context

**Perché esiste**: l'autore vuole provare il gioco sul PC da una pagina pubblicata, dove non si possono passare parametri
nell'URL. La build giocabile partiva solo con `?debug=1&wire=1&hub=1`. Questa storia fa dichiarare alla pagina i parametri di
avvio di default e mostra all'avvio un pannello con i tasti.

**Decisione dell'autore (2026-11-08)**: «il gioco non deve essere giocato tramite touch né pensato per farlo». I controlli
touch che erano stati abbozzati in questa storia sono stati rimossi: il gioco è da tastiera (e gamepad, già previsto
dalla storia 002). Nessun modulo, parametro o testo touch resta nel codice.

**Regole fisse del progetto**: testi solo in `contenuti/interfaccia.json › prova`; colori dai token CSS; nessun numero di gioco.

---

## Acceptance Criteria

- [x] **GIVEN** `prova.html` con `<meta name="gioco-avvio" content="debug=1&wire=1&hub=1">`, **WHEN** si apre senza parametri,
      **THEN** il ciclo entra in `hub` in fil di ferro come con `?debug=1&wire=1&hub=1` (`gioco/qa/prova.wire.test.js`).
- [x] **GIVEN** la stessa pagina con `?seme=1845`, **THEN** il seme è 1845 e gli altri default valgono (l'URL vince; `fondiDefault`
      in `gioco/qa/prova.test.mjs`).
- [x] **GIVEN** la pagina aperta, **THEN** il pannello dei tasti è a schermo (`__gioco.pannelloProva() === true`) e sparisce al primo
      tasto o click senza mettere in pausa il ciclo.
- [x] **GIVEN** `index.html`, **THEN** nessun pannello e `pannelloProva()` è `null`; `pagina.test.js` resta verde.
- [x] **GIVEN** il motore, **THEN** nessun controllo touch (`'tocco' in __gioco === false`).

## Implementation Notes

- `motore/fondazione/avvio-url.js`: `fondiDefault(search, contenutoMeta)` e `leggiMetaAvvio(documento)`, puri.
- `motore/avvio.js`: fusione dei default prima di `leggiOverrideUrl`; pannello solo se la meta esiste.
- `motore/interfaccia/prova.js` + `stile/prova.css`: pannello DOM, ascoltatori `keydown`/`pointerdown` in cattura, una volta.
- Pubblicazione: `node tools/impacchetta.js --entrata gioco/prova.html --frammento` produce il file unico (`tools/README-impacchetta.md`).

## Evidence

- `node gioco/qa/prova.test.mjs` → 3/3; `node gioco/qa/prova.wire.test.js` → 2/2; `production/qa/evidence/prova-pagina.png`.
- Tutte le altre suite rilanciate dopo la rimozione del touch: verdi (2026-11-08).
