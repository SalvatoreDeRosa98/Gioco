# Ferruccio — La Notte Immobile · passaggio di consegne (v3, roguelike)

Aggiornato: 2026-11-08 · Branch: `claude/brave-cannon-ed3d3d` · Modello di lavoro: autonomo, review mode solo.

## Dove siamo

Il progetto è ripartito da zero due volte nella stessa giornata per decisione dell'autore: prima come
avventura narrativa a teatro delle ombre (archiviata), poi come **roguelike d'azione a stanze alla
The Binding of Isaac** («vorrei farlo come Isaac»), sempre con la grafica a **teatro delle ombre** in
vista 3/4 («presepe d'ombre») e la **trama della bibbia** come fondamento. Stadio: **Pre-produzione, logica MVP
completa in fil di ferro, grafica definitiva in attesa dell'autore** (tier `standard`; `project.stage`
dice ancora `Concept` perché nessun `/gate-check` l'ha avanzato).

## Cosa esiste (in ordine di lettura)

1. `trama/` — bibbia, decisioni dell'autore, `storia.json` (81 scene, 259 battute verbatim, 6 flag), `mappa-scene.md`, archivio v1/v2.
2. `design/gdd/game-concept.md` — pitch, pilastri, MDA, core loop, MVP (un piano), scale, rischi.
3. `design/art/art-bible.md` — sezioni 1-4 (regola sovrana, mood, forme e telegrafi, colore). 5-9 non scritte (non richieste al tier).
4. `design/gdd/systems-index.md` — 26 sistemi, dipendenze, priorità, ordine di design, rischi.
5. GDD (tutti Draft, autore "Solo mode: rivedere prima della produzione"): `controllo-ferruccio`, `combattimento`, `stanze-porte`, `generazione-piani`, `nemici`, `boss`, `doni-modificatori`, `economia`, `stato-narrativo`, `incontri-dialoghi`, `ricordi-scelta`.
6. `docs/architecture/architecture.md` + `adr-0001..0006` (Proposed): web senza build, Canvas 2D, parametri JSON, determinismo, stato narrativo, renderer, salvataggio.
7. `prototypes/stanza-gatti-concept/` — prototipo giocabile del nucleo (tre gatti, fendente, parata, scatto); pubblicato: https://claude.ai/artifact/PsSXdSgrt9dg8jZ9JPTXTF. Verdetto di feel NOT ASSESSED finché l'autore non gioca.
8. Mockup visivo approvato (vista laterale, v2): `design/mockup/`.
9. `production/epics/` — 7 epiche, 34 storie (000-033), `index.md`. Storia 000 = tavola della qualità visiva.
10. `prototypes/tavola-presepe/` — tavola di stile in vista 3/4, varianti A/B/C via `?variante=`; evidenze
    `production/qa/evidence/tavola-presepe-*.png`. **L'autore deve scegliere A, B o C** (consigliata C).
11. `gioco/` — il motore vero (HTML + Canvas 2D + DOM, moduli ES, nessun build). Leggere `gioco/README.md`:
    struttura, parametri URL (`?debug=1`, `&wire=1`, `&piano=1&seme=N`, `&nemico=gatto`), superficie
    `window.__gioco`, comandi di test.

### Stato delle storie (2026-11-08)

Chiuse o verdi in fil di ferro: 001-004 (fondazione), 007-011 (controllo, combattimento), 014-016 (stanze,
porte, camera, generazione), 017-020 (modelli, pericoli, IA nemici, gatto d'ombra), 023-026 (modificatori,
pool e piedistallo, economia e banchetto, stato narrativo), 027-030 (cartiglio e incontri, Medaglione di
Rosa, hub, morte e risveglio). Ogni storia è stata verificata da un agente indipendente che ha rilanciato
tutte le suite. Commit `48adbd4`.

Aperte, tutte visive e bloccate dalla scelta A/B/C: 000 (tavola), 005-006 (renderer e sprite d'ombra),
012 (feedback del colpo alla Isaac: lampo bianco, squash, schizzi d'inchiostro, hit-stop, shake, con
sign-off dell'autore), 013, 020-visiva (sagoma vera del gatto), 021-022 (Gatto boss), 031 HUD, 032 menu,
033 QA del percorso completo.

Suite: 12 unitarie (`node gioco/qa/*.test.mjs`, `parametri.test.js`), 9 Playwright (`pagina.test.js`,
`*.wire.test.js`, `vetrina.test.js`), `stati64.js` (64/64), `seme.js` (200 piani, 0 violatori). Tutte verdi.

## Decisioni prese in autonomia (registrate in `production/session-logs/decision-log.md`)

- Motore web (Canvas 2D, moduli ES, nessun build), Godot abbandonato; `engine.name: Web` aggiunto allo schema del framework.
- `modes.rigor: standard` perché le skill producano indice e GDD.
- Il contatto passivo con i nemici non ferisce: solo i Colpi telegrafati (pilastro 1).
- Danno decimale senza arrotondamento (`danno_min` 0,5).
- Camera: stanze doppie e arene dei boss si inquadrano riducendo la scala, mai con lo scorrimento.
- Stanza-ricordo del piano 2 = `corso-trieste.finestra-mariella`; Taddeo si incontra dopo la Regina.
- Dalle storie 019-030 (elencate in ciascuna storia e in `gioco/README.md`, «Valori provvisori»): finestra
  di parata del gatto 190-370 ms dal lampo (il GDD dice 100-280: o si aggiorna il GDD o `hit_dal` torna a 0);
  un nemico sotto `d_min` arretra fino alla banda d'attesa; `d_max` 230 supera la portata del balzo (170);
  stanza QA a 2 gatti; allarme di stanza contato dalla fine dell'emersione; mondo uccisa→A, risparmiata→B.

## Domande aperte per l'autore (non bloccanti, ma da decidere prima del vertical slice)

1. **Violante o Donna Luciana?** La bibbia dice Violante; la v1 l'aveva rinominata. Qui si usa Violante.
2. **Scatto**: sempre disponibile dall'inizio, con la sciarpa di Agnese come miglioria? La decisione del 10/10 lo legava alla sciarpa. I GDD assumono scatto base sempre disponibile.
3. **Fucina del Ricordo**: si apre la prima volta che si raggiunge il piano 2?
4. La Spada di legno come ricordo di Taddeo e il "Filo dei ricordi" di Agnese sono proposte (canon Provisional).

## Prossimi passi

1. **L'autore sceglie la tavola A, B o C** (`prototypes/tavola-presepe/`, evidenze in `production/qa/evidence/`).
   Feedback dell'autore sul prototipo: «la grafica non si può guardare così» e il colpo «deve essere marcato
   come in Isaac». È qui che va speso il tempo.
2. Con la tavola scelta: storie 005, 006, 012 (feedback del colpo, con GIF e sign-off), 013, 020-visiva,
   021-022 (Gatto boss), 031, 032, 033. Ogni storia visiva chiude con screenshot conservati e sign-off.
3. `/review-all-gdds` + `/balance-check`: durate dei boss (92-144 s), prezzi, `armatura` duplicata in due
   JSON, `p_doppia` che produce solo 3/600 stanze doppie, finestra di parata del gatto.
4. `/gate-check` per avanzare `project.stage`.

## Note operative

- Sessione cloud: Playwright preinstallato; i sotto-agenti possono fermarsi per limite di utilizzo del modello: lavorare a lotti piccoli.
- Commit in Conventional Commits con riga `Design:`; push su `claude/brave-cannon-ed3d3d`.
- Il framework CCGS non conosce "Web": le skill con passi specifici di motore dichiarano NOT SOURCEABLE.
