# Story P01: Boss provvisorio e uscita del piano (PROVVISORIA)

> **Epic**: Nemici e Gatto dei Quattro Canti
> **Status**: Done (provvisoria per la build di prova dell'autore; la storia 022 la sostituisce)
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: S
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-08

## Context

**Perché esiste**: la build di prova per l'autore deve poter essere giocata dall'ingresso all'uscita del piano 1, ma il
Gatto dei Quattro Canti vero (storia 022: pattern a ventaglio, Caduta dei Quattro Canti, due fasi, 280 di vita) non c'è.
Questa storia mette nella stanza `boss` un gatto comune scalato e un'uscita che riporta in piazza. **Non è la storia 022**:
`boss_battuti` dello stato narrativo non è toccato, la scheda vera arriverà con la 022 e questa storia sarà sostituita.

**GDD**: `design/gdd/boss.md` (solo §5 come riferimento della vita vera), `design/gdd/stanze.md` regola 24 (arco dell'uscita),
`design/gdd/stato-narrativo.md` regola 8 (cosa resta al risveglio), `design/gdd/economia.md` (bottino del boss).
**ADR Governing Implementation**: ADR-0002 (eventi e stanza), ADR-0006 (notte salvata e risveglio)

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW

**Regole fisse del progetto**: nessun numero di gioco nel codice (`nemici.json › boss_provvisorio`, `stanze.json › uscita`,
`risveglio.json › fine_piano`), nessuna stringa di gioco nel motore (`interfaccia.json › fine_piano.velo`), nessun `Math.random`,
colori dai token CSS (`--oro` per la didascalia del velo di vittoria).

---

## Acceptance Criteria

- [x] GIVEN la stanza di tipo `boss`, WHEN Ferruccio entra, THEN nasce dal contenuto `boss` del modello un solo nemico dell'archetipo
      scritto lì (gatto) con `boss === true` e la scheda di `nemici.json › boss_provvisorio` (vita 60, raggio ×1,6, portata ×1,3);
      le porte si chiudono come in una stanza normale; l'uscita è inattiva
- [x] GIVEN il boss vivo, WHEN muore, THEN parte `boss.sconfitto` {id: 'gatto', x, y} una sola volta (i ricordi fanno cadere il
      Medaglione di Rosa), la stanza passa svuotata → pulita, le porte si riaprono, il direttore concede il gettone come per ogni
      `stanza.pulita`, il bottino del boss lo dà l'economia dal payload `boss` (non duplicato); rivisitata resta pulita
- [x] GIVEN la stanza boss pulita, WHEN Ferruccio resta sull'arco dell'uscita (`stanze.uscita.raggio`) per `t_attesa`, THEN la stanza
      emette `piano.completato` {piano, id, x, y} UNA sola volta; lasciare l'arco prima azzera l'attesa; con il boss vivo non succede nulla
- [x] GIVEN `piano.completato`, WHEN il risveglio lo riceve, THEN `piano_max = max(piano_max, piano + 1)` nello stato narrativo, la
      notte salvata è cancellata (motivo `vittoria`), l'economia chiude la notte, il ciclo va in `pausa`, il velo DOM mostra
      `interfaccia.json › fine_piano.velo` («Il piano 2 non è ancora stato costruito…») per `risveglio.fine_piano.t_velo`, poi lo
      stesso risveglio della morte con `risveglio.fine` {motivo: 'vittoria'}: notte + 1, flag e scintille conservati, `morti` fermo;
      con l'hub si torna in piazza, senza hub (`?piano=N`) la notte riparte dallo stesso seme
- [x] GIVEN il fil di ferro, WHEN si guarda la stanza boss, THEN il boss è il gatto scalato con l'etichetta «boss (provvisorio)» e
      l'uscita è un arco tratteggiato al centro, pieno e d'oro quando è attiva, con il cerchio dell'attesa che si riempie

---

## Implementation Notes

- `mondo/stanza.js`: nella stanza `boss` una sola ondata dal punto del contenuto `boss` (`archetipo` nel modello `pd-b-01`), factory
  chiamata con `boss: true`; `boss.sconfitto` nel passaggio a `svuotata`; `tickUscita` e il getter `uscita` (`{x, y, raggio, attiva,
  progresso, attraversata}`); `combatteBoss` e `boss` esposti.
- `attori/nemico.js`: `schedaBossProvvisorio()` e `applicaSchedaBoss()` (pura); `creaNemico({…, schedaBoss})`.
- `storia/risveglio.js`: `completaPiano(piano)`, fasi `FASI_FINE_PIANO = ['velo']`, `MOTIVI_RISVEGLIO`, eventi `fine_piano.avvio` /
  `fine_piano.fase`, `risveglio.fine` con `motivo` e `piano`; `avvio.js` mette in pausa anche su `fine_piano.avvio` e riusa il
  gestore di `risveglio.fine` della morte.
- `persistenza/notte-salvata.js`: motivo `vittoria`; `oggetti/economia.js`: `fineNotte()` a `piano.completato`.
- `interfaccia/morte.js` + `stile/interfaccia.css`: stesso velo con `data-motivo="vittoria"`, lanterne/fili/maschera nascosti.
- `resa/debug.js`: etichetta del boss e arco dell'uscita.

---

## Decisioni

1. **Vita 60 invece di 280** (`boss_provvisorio.vita`, min 10 max 400): senza i pattern veri un gatto da 280 sarebbe un minuto di
   attesa, non un duello. Da rivedere con la 022.
2. **Attesa sull'uscita** (`uscita.t_attesa` 600 ms): il bottino del boss cade al centro, dove sta l'arco; senza attesa raccoglierlo
   farebbe uscire per sbaglio.
3. **Stesso risveglio della morte** con motivo `vittoria` invece di un flusso a parte: la radice di composizione non distingue i due
   casi, il velo è lo stesso elemento DOM; `morti` non cresce.
4. **`boss_battuti` non toccato**: è della storia 022; qui la vittoria è solo `piano_max` + notte + 1.
5. **Test con fantocci** (`boss-provvisorio.test.mjs`): la stanza è reale (`pd-b-01` dal catalogo), il nemico è un fantoccio con
   `archetipo` e `boss` dal payload della factory, come in `mondo.test.mjs`; la scheda vera del boss è provata a parte
   (`applicaSchedaBoss`) e nel wire (`vita === nemici.boss_provvisorio.vita`).

---

## Out of Scope

Pattern del boss, due fasi, aggiunte, sagoma vera, `boss_battuti`, dono d'oro dal pool quando il ricordo è già deciso, il piano 2.

---

## Test Evidence

**Story Type**: Integration
**Evidenza**:
- `gioco/qa/boss-provvisorio.test.mjs` — 5/5 (node:test)
- `gioco/qa/boss.wire.test.js` — 1/1 (Playwright, zero errori di console)
- `production/qa/evidence/boss-provvisorio.png` — stanza boss in fil di ferro: gatto scalato con etichetta «boss (provvisorio)», arco
  tratteggiato «uscita chiusa» al centro, porta N chiusa
**Status**: [x] Created and passing
