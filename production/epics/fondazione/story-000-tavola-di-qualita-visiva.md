# Story 000: Tavola di qualità visiva del presepe d'ombre (da approvare prima del motore)

> **Epic**: Fondazione del motore
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Visual/Feel
> **Estimate**: L
> **Manifest Version**: N/A
> **Last Updated**: 2026-11-07

## Context

**Perché esiste**: l'autore, giocato il prototipo, ha detto che «la grafica non si può guardare così» e che è il punto dove si deve perdere più tempo. Il mockup in vista laterale (`design/mockup/teatro-delle-ombre-dialogo.png`) era stato approvato; il passaggio alla vista 3/4 del prototipo ha perso quella qualità. Prima di scrivere il motore si fissa **un fotogramma di riferimento** della stanza vista dall'alto alla qualità del mockup, costruito con le stesse tecniche che il renderer dovrà poi riprodurre (gradienti, grana procedurale, fibre, aloni, vignetta, sagome a curve). È un «style frame» da approvare, non codice del gioco.

**GDD**: `design/art/art-bible.md` §1-4 · **ADR**: ADR-0005 (renderer)
**Engine**: Web (Canvas 2D) | **Risk**: LOW

---

## Acceptance Criteria

- [ ] GIVEN `prototypes/tavola-presepe/index.html` (Canvas 2D o SVG, un solo file), WHEN si apre, THEN mostra UN fotogramma immobile di una stanza di Piazza Dante in vista 3/4 con Ferruccio, due gatti (uno accucciato con il lampo), una lanterna, una porta aperta con soglia d'oro, monete a terra, schizzi d'inchiostro di un colpo appena dato, l'HUD
- [ ] GIVEN il fotogramma, WHEN lo si affianca al mockup laterale, THEN regge il confronto: carta retroilluminata con fibre e grana, fondale con palazzi e finestre accese e fili d'oro oltre le mura, aloni morbidi delle luci, pozze a terra, ombre portate, vignetta, pulviscolo; sagome a curve con bordo di carta e buchi di luce; nessun poligono piatto
- [ ] GIVEN tre varianti (A più calda e teatrale, B più scura e contrastata, C con più fondale), WHEN l'autore le guarda, THEN ne approva una o indica cosa cambiare; la variante approvata diventa il riferimento vincolante delle storie 005, 006, 012, 013, 020
- [ ] GIVEN la variante approvata, WHEN si misura il costo di resa delle sue tecniche in Canvas 2D (aloni, grana, ombre) a 60 fps, THEN si documenta quali vanno precalcolate (texture della carta, grana) e quali sono per frame, dentro il budget di 6 ms

---

## Implementation Notes

Tecniche da usare e poi riportare nel renderer: texture di carta generata una volta (rumore a più ottave + fibre direzionali), gradienti radiali additivi per le luci, ombre portate come sagoma proiettata e sfocata, vignetta, grana per frame leggera, bordo di carta chiara di 1-2 px sulle sagome in controluce, path con curve di Bézier e jitter con seme per le sagome. Fondale oltre le mura come strati sfocati (palazzi, finestre, fili). Palette e valori di luminanza dall'art bible §4.

## Out of Scope

Animazione, input, regole di gioco: è un fotogramma. Le sagome definitive in JSON sono la storia 006/013/020.

## QA Test Cases

N/A (sign-off dell'autore).

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: le tre tavole in `production/qa/evidence/tavola-presepe-A.png`, `-B.png`, `-C.png` e il nome della variante approvata in `production/qa/evidence/tavola-presepe-evidence.md`
**Status**: [ ] Not yet created

## Dependencies

- Depends on: None
- Unlocks: Story 005, Story 006, Story 012, Story 013, Story 020
