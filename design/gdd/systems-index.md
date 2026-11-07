# Systems Index: Ferruccio — La Notte Immobile

> **Status**: Draft (autonomo: enumerazione, dipendenze e priorità decise e registrate nel decision log; gate TD-SYSTEM-BOUNDARY, PR-SCOPE e CD-SYSTEMS saltati — review mode solo)
> **Created**: 2026-11-07
> **Last Updated**: 2026-11-07 (11 GDD in bozza, passata di coerenza fatta)
> **Source Concept**: design/gdd/game-concept.md

---

## Overview

Un roguelike a stanze alla *Isaac* è fatto di poche cose che devono essere molto solide: un controllo
del personaggio che risponde, un combattimento che si legge, stanze generate che non siano mai noiose
né ingiuste, e oggetti che si sommano in modi che il giocatore scopre da solo. Sopra questa base,
*Ferruccio* aggiunge ciò che lo rende suo: uno **stato narrativo** fatto dei sei flag della bibbia che
sopravvive a ogni morte (pilastro 2), **ricordi** che sono bottino con un volto (pilastro 3), e un
**rendering da teatro delle ombre** che è un vincolo di produzione prima che uno stile (pilastro 4).

I sistemi qui sotto sono raggruppati per categoria. In breve: il **ciclo di gioco** e l'**input**
sono la cornice; il **rendering** è una fondazione perché tutto ciò che è visibile passa da lì;
**fisica**, **controllo di Ferruccio**, **combattimento**, **stanze** e **generazione dei piani**
formano il nucleo giocabile dell'MVP; **nemici**, **boss**, **doni** e **ricordi** sono le feature che
danno varietà; **stato narrativo**, **incontri** e **finali** portano la bibbia dentro le notti;
**economia** e **Fucina** fanno la progressione; **salvataggio**, **HUD**, **mappa**, **menu** e
**audio** completano l'esperienza; **strumenti di QA**, **onboarding** e **accessibilità** sono il
contorno che però decide se il gioco si può verificare e giocare da tutti.

Sistemi dedotti e non citati esplicitamente nel concept sono marcati "(inferred)".

---

## Systems Enumeration

| # | System Name | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|----------|----------|--------|------------|------------|
| 1 | Ciclo di gioco e stati (inferred) | Core | MVP | Not Started | design/gdd/ciclo-di-gioco.md | — |
| 2 | Input (inferred) | Core | MVP | Not Started | design/gdd/input.md | — |
| 3 | Rendering a teatro delle ombre | Core | MVP | Not Started | design/gdd/rendering-ombre.md | — |
| 4 | Fisica e collisioni (inferred) | Core | MVP | Not Started | design/gdd/fisica-collisioni.md | Ciclo di gioco |
| 5 | Controllo di Ferruccio | Gameplay | MVP | In Design | design/gdd/controllo-ferruccio.md | Input, Fisica |
| 6 | Camera e transizioni di stanza (inferred) | Core | MVP | Not Started | design/gdd/camera-stanza.md | Rendering, Stanze e porte |
| 7 | Combattimento | Gameplay | MVP | In Design | design/gdd/combattimento.md | Controllo di Ferruccio, Fisica |
| 8 | Nemici e IA | Gameplay | MVP | In Design | design/gdd/nemici.md | Combattimento, Stanze e porte |
| 9 | Boss | Gameplay | MVP | In Design | design/gdd/boss.md | Nemici e IA, Stato narrativo |
| 10 | Generazione dei piani | Gameplay | MVP | In Design | design/gdd/generazione-piani.md | Stanze e porte, Salvataggio (seme) |
| 11 | Stanze e porte (inferred) | Gameplay | MVP | In Design | design/gdd/stanze-porte.md | Fisica, Ciclo di gioco |
| 12 | Doni e modificatori | Gameplay | MVP | In Design | design/gdd/doni-modificatori.md | Combattimento, Controllo di Ferruccio |
| 13 | Ricordi con scelta | Narrative | MVP | In Design | design/gdd/ricordi-scelta.md | Doni e modificatori, Stato narrativo, Incontri e dialoghi |
| 14 | Economia: monete, scintille, banchetto | Economy | MVP | In Design | design/gdd/economia.md | Doni e modificatori, Stanze e porte |
| 15 | Fucina del Ricordo (meta-progressione) | Progression | Vertical Slice | Not Started | design/gdd/fucina-ricordo.md | Economia, Salvataggio, Stato narrativo |
| 16 | Stato narrativo (sei flag) | Narrative | MVP | In Design | design/gdd/stato-narrativo.md | — |
| 17 | Incontri e dialoghi | Narrative | MVP | In Design | design/gdd/incontri-dialoghi.md | Stato narrativo, Stanze e porte |
| 18 | Finali e mondo dopo | Narrative | Alpha | Not Started | design/gdd/finali-mondo-dopo.md | Stato narrativo, Boss, Rendering, Nemici e IA |
| 19 | Salvataggio e profilo (inferred) | Persistence | MVP | Not Started | design/gdd/salvataggio.md | Stato narrativo |
| 20 | HUD (inferred) | UI | MVP | Not Started | design/ux/hud.md | Combattimento, Doni, Economia |
| 21 | Mappa del piano (inferred) | UI | Vertical Slice | Not Started | design/ux/mappa-piano.md | Generazione dei piani |
| 22 | Menu, slot e opzioni (inferred) | UI | Vertical Slice | Not Started | design/ux/menu.md | Salvataggio, Input |
| 23 | Audio sintetico (inferred) | Audio | Vertical Slice | Not Started | design/gdd/audio.md | Combattimento, Stanze e porte |
| 24 | Onboarding (inferred) | Meta | Full Vision | Not Started | design/gdd/onboarding.md | Generazione dei piani, Incontri e dialoghi |
| 25 | Strumenti di sviluppo e QA (inferred) | Meta | MVP | Not Started | design/gdd/strumenti-qa.md | Ciclo di gioco, Salvataggio (seme) |
| 26 | Accessibilità (inferred) | Meta | Full Vision | Not Started | design/accessibility-requirements.md | Rendering, Input, HUD |

---

## Categories

| Category | Description | Typical Systems |
|----------|-------------|-----------------|
| **Core** | Fondazioni da cui dipende tutto | Ciclo di gioco, input, rendering, fisica, camera |
| **Gameplay** | I sistemi che fanno il divertimento | Controllo, combattimento, nemici, boss, stanze, generazione, doni |
| **Progression** | Come il giocatore cresce tra le notti | Fucina del Ricordo |
| **Economy** | Creazione e consumo di risorse | Monete di luce, scintille, banchetto, tabelle di drop |
| **Persistence** | Continuità | Salvataggio, profilo, seme della run |
| **UI** | Informazione al giocatore | HUD, mappa, menu |
| **Audio** | Suono | SFX, ambienti, musica sintetica |
| **Narrative** | La bibbia dentro il gioco | Stato narrativo, incontri, ricordi con scelta, finali |
| **Meta** | Fuori dal ciclo | QA, onboarding, accessibilità |

---

## Priority Tiers

| Tier | Definition | Target Milestone | Design Urgency |
|------|------------|------------------|----------------|
| **MVP** | Serve al ciclo di base (un piano, quattro nemici, un boss, dodici doni, la scelta di Rosa) | Primo prototipo giocabile | Design FIRST |
| **Vertical Slice** | Serve a un piano completo e rifinito con progressione | Vertical slice | Design SECOND |
| **Alpha** | Tutti i piani, i boss, le scelte e i finali in grezzo | Alpha | Design THIRD |
| **Full Vision** | Rifinitura, accessibilità, onboarding | Beta / Release | Quando serve |

---

## Dependency Map

### Foundation Layer (no dependencies)

1. Ciclo di gioco e stati — la macchina a stati (menu → hub → notte → stanza → morte) in cui tutto il resto vive.
2. Input — tastiera, mouse, gamepad; ogni sistema giocabile legge da qui.
3. Rendering a teatro delle ombre — tutto ciò che si vede passa da qui; è anche il vincolo di produzione.
4. Stato narrativo — i sei flag e le condizioni di `trama/storia.json`; puro dato, zero dipendenze.

### Core Layer (depends on foundation)

1. Fisica e collisioni — depends on: Ciclo di gioco
2. Stanze e porte — depends on: Fisica, Ciclo di gioco
3. Controllo di Ferruccio — depends on: Input, Fisica
4. Salvataggio e profilo — depends on: Stato narrativo
5. Camera e transizioni — depends on: Rendering, Stanze e porte
6. Strumenti di sviluppo e QA — depends on: Ciclo di gioco, Salvataggio (seme)

### Feature Layer (depends on core)

1. Combattimento — depends on: Controllo di Ferruccio, Fisica
2. Generazione dei piani — depends on: Stanze e porte, Salvataggio (seme)
3. Nemici e IA — depends on: Combattimento, Stanze e porte
4. Doni e modificatori — depends on: Combattimento, Controllo di Ferruccio
5. Incontri e dialoghi — depends on: Stato narrativo, Stanze e porte
6. Economia — depends on: Doni, Stanze e porte
7. Boss — depends on: Nemici e IA, Stato narrativo
8. Ricordi con scelta — depends on: Doni, Stato narrativo, Incontri
9. Fucina del Ricordo — depends on: Economia, Salvataggio, Stato narrativo
10. Finali e mondo dopo — depends on: Stato narrativo, Boss, Rendering, Nemici

### Presentation Layer (depends on features)

1. HUD — depends on: Combattimento, Doni, Economia
2. Mappa del piano — depends on: Generazione dei piani
3. Menu, slot e opzioni — depends on: Salvataggio, Input
4. Audio sintetico — depends on: Combattimento, Stanze e porte

### Polish Layer (depends on everything)

1. Onboarding — depends on: Generazione dei piani, Incontri
2. Accessibilità — depends on: Rendering, Input, HUD

**Colli di bottiglia** (molti dipendenti, alto rischio): Stanze e porte (6 dipendenti), Combattimento (5),
Stato narrativo (6), Rendering (4). Vanno progettati per primi e prototipati.

---

## Recommended Design Order

| Order | System | Priority | Layer | Agent(s) | Est. Effort |
|-------|--------|----------|-------|----------|-------------|
| 1 | Controllo di Ferruccio + Combattimento (una coppia: il feel si progetta insieme) | MVP | Core/Feature | game-designer, systems-designer | L |
| 2 | Stanze e porte + Generazione dei piani | MVP | Core/Feature | level-designer, systems-designer | L |
| 3 | Nemici e IA | MVP | Feature | game-designer, ai-programmer | M |
| 4 | Doni e modificatori | MVP | Feature | systems-designer, economy-designer | L |
| 5 | Stato narrativo + Incontri e dialoghi + Ricordi con scelta | MVP | Foundation/Feature | narrative-director, writer | M |
| 6 | Boss | MVP | Feature | game-designer | M |
| 7 | Economia | MVP | Feature | economy-designer | S |
| 8 | Rendering a teatro delle ombre | MVP | Foundation | technical-artist (tecnico: va in architettura + art bible) | M |
| 9 | Ciclo di gioco, Input, Fisica, Camera, Salvataggio, Strumenti QA | MVP | Foundation/Core | lead-programmer (tecnici: architettura) | S ciascuno |
| 10 | HUD | MVP | Presentation | ux-designer | S |
| 11 | Fucina del Ricordo | VS | Feature | systems-designer | M |
| 12 | Mappa, Menu, Audio | VS | Presentation | ux-designer, audio-director | S ciascuno |
| 13 | Finali e mondo dopo | Alpha | Feature | narrative-director | M |
| 14 | Onboarding, Accessibilità | Full | Polish | ux-designer, accessibility-specialist | S |

I sistemi tecnici (1, 2, 4, 6, 19, 25) non hanno regole di gioco proprie: le loro decisioni stanno in
`docs/architecture/architecture.md` e negli ADR, non in un GDD. Restano nell'indice perché hanno
dipendenti e vanno costruiti.

---

## Circular Dependencies

- Nessuna trovata. Nota di confine: Combattimento ↔ Doni si parlano in entrambi i sensi (i doni
  modificano il combattimento, il combattimento legge i modificatori). Si risolve con un contratto:
  il combattimento espone **statistiche nominate** (portata, danno, velocità del fendente, finestra di
  parata, numero di scatti…) e i doni sono **solo** funzioni che trasformano quelle statistiche. Il
  combattimento non conosce i doni per nome.

---

## High-Risk Systems

| System | Risk Type | Risk Description | Mitigation |
|--------|-----------|-----------------|------------|
| Combattimento | Design | Corpo a corpo top-down con parata può risultare molle o illeggibile rispetto allo sparo di Isaac | Prototipo per primo: una stanza, tre gatti, fendente + parata + scatto; verdetto PROCEED/PIVOT prima dei GDD successivi |
| Generazione dei piani | Design/Tecnico | Stanze morte, percorsi senza scelta, posizionamenti ingiusti | Modelli di stanza fatti a mano, vincoli di generazione, seme fisso riproducibile, screenshot automatici di 50 piani |
| Doni e modificatori | Tecnico | Sinergie che esplodono in casi speciali e bug | Modello a modificatori composabili su statistiche nominate; test unitari sul calcolo |
| Rendering a teatro delle ombre | Design/Tecnico | Sagome piatte viste dall'alto possono perdere la leggibilità che hanno di profilo; prestazioni Canvas con luci e ombre | Prova di leggibilità con 12 sagome in una stanza prima del prototipo; budget di 8 luci per stanza |
| Stato narrativo + Incontri | Design | Troppa storia spezza il ritmo della run | Una battuta per NPC per notte; dialoghi solo a porte aperte |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total systems identified | 26 |
| Design docs started | 11 |
| Design docs reviewed | 0 |
| Design docs approved | 0 |
| MVP systems designed | 11/19 (in bozza) |
| Vertical Slice systems designed | 0/4 |

---

## Next Steps

- [x] `/design-system controllo-ferruccio` e `combattimento` (coppia)
- [x] `/prototype` una stanza con tre gatti: fendente, parata, scatto (`prototypes/stanza-gatti-concept/`, NOT ASSESSED finché l'autore non gioca)
- [x] `/design-system stanze-porte`, `generazione-piani`, `nemici`, `boss`, `doni-modificatori`, `economia`, `stato-narrativo`, `incontri-dialoghi`, `ricordi-scelta`
- [x] `/create-architecture` (+ ADR-0001..0006 Proposed)
- [ ] `/review-all-gdds` e `/balance-check` sui numeri (danno, vita dei boss, prezzi)
- [ ] `/create-epics` e `/create-stories` per l'MVP (piano 1)
- [ ] `/gate-check systems-design`
