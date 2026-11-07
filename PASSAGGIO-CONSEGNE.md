# Ferruccio — La Notte Immobile · passaggio di consegne (v3, roguelike)

Aggiornato: 2026-11-07 · Branch: `claude/brave-cannon-ed3d3d` · Modello di lavoro: autonomo, review mode solo.

## Dove siamo

Il progetto è ripartito da zero due volte nella stessa giornata per decisione dell'autore: prima come
avventura narrativa a teatro delle ombre (archiviata), poi come **roguelike d'azione a stanze alla
The Binding of Isaac** («vorrei farlo come Isaac»), sempre con la grafica a **teatro delle ombre** in
vista 3/4 («presepe d'ombre») e la **trama della bibbia** come fondamento. Stadio: **Concept →
Systems Design** (tier `standard`).

## Cosa esiste (in ordine di lettura)

1. `trama/` — bibbia, decisioni dell'autore, `storia.json` (81 scene, 259 battute verbatim, 6 flag), `mappa-scene.md`, archivio v1/v2.
2. `design/gdd/game-concept.md` — pitch, pilastri, MDA, core loop, MVP (un piano), scale, rischi.
3. `design/art/art-bible.md` — sezioni 1-4 (regola sovrana, mood, forme e telegrafi, colore). 5-9 non scritte (non richieste al tier).
4. `design/gdd/systems-index.md` — 26 sistemi, dipendenze, priorità, ordine di design, rischi.
5. GDD (tutti Draft, autore "Solo mode: rivedere prima della produzione"): `controllo-ferruccio`, `combattimento`, `stanze-porte`, `generazione-piani`, `nemici`, `boss`, `doni-modificatori`, `economia`, `stato-narrativo`, `incontri-dialoghi`, `ricordi-scelta`.
6. `docs/architecture/architecture.md` + `adr-0001..0006` (Proposed): web senza build, Canvas 2D, parametri JSON, determinismo, stato narrativo, renderer, salvataggio.
7. `prototypes/stanza-gatti-concept/` — prototipo giocabile del nucleo (tre gatti, fendente, parata, scatto); pubblicato: https://claude.ai/artifact/PsSXdSgrt9dg8jZ9JPTXTF. Verdetto di feel NOT ASSESSED finché l'autore non gioca.
8. Mockup visivo approvato (vista laterale, v2): `design/mockup/`.

Non esiste ancora codice di produzione in `gioco/`.

## Decisioni prese in autonomia (registrate in `production/session-logs/decision-log.md`)

- Motore web (Canvas 2D, moduli ES, nessun build), Godot abbandonato; `engine.name: Web` aggiunto allo schema del framework.
- `modes.rigor: standard` perché le skill producano indice e GDD.
- Il contatto passivo con i nemici non ferisce: solo i Colpi telegrafati (pilastro 1).
- Danno decimale senza arrotondamento (`danno_min` 0,5).
- Camera: stanze doppie e arene dei boss si inquadrano riducendo la scala, mai con lo scorrimento.
- Stanza-ricordo del piano 2 = `corso-trieste.finestra-mariella`; Taddeo si incontra dopo la Regina.

## Domande aperte per l'autore (non bloccanti, ma da decidere prima del vertical slice)

1. **Violante o Donna Luciana?** La bibbia dice Violante; la v1 l'aveva rinominata. Qui si usa Violante.
2. **Scatto**: sempre disponibile dall'inizio, con la sciarpa di Agnese come miglioria? La decisione del 10/10 lo legava alla sciarpa. I GDD assumono scatto base sempre disponibile.
3. **Fucina del Ricordo**: si apre la prima volta che si raggiunge il piano 2?
4. La Spada di legno come ricordo di Taddeo e il "Filo dei ricordi" di Agnese sono proposte (canon Provisional).

## Prossimi passi

1. L'autore gioca il prototipo e risponde alle domande del `REPORT.md`; verdetto PROCEED/PIVOT.
2. `/review-all-gdds` + `/balance-check`: danno e vita dei boss (durate 92-144 s senza doni sono lunghe), prezzi, ritmo degli sblocchi.
3. `/create-epics` → `/create-stories` per l'MVP (piano 1: 8 stanze, 4 nemici, 12 doni, Gatto, scelta di Rosa, hub con Tonino).
4. `/dev-story`: fondazione (ciclo, input, rng, parametri, renderer), poi controllo e combattimento, portando i valori tarati dal prototipo.

## Note operative

- Sessione cloud: Playwright preinstallato; i sotto-agenti possono fermarsi per limite di utilizzo del modello: lavorare a lotti piccoli.
- Commit in Conventional Commits con riga `Design:`; push su `claude/brave-cannon-ed3d3d`.
- Il framework CCGS non conosce "Web": le skill con passi specifici di motore dichiarano NOT SOURCEABLE.
