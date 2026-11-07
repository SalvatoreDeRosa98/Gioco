# Incontri e dialoghi

> **Status**: Draft
> **Author**: narrative-director + writer (sessione autonoma; `creative-director`, `ux-designer`, `qa-lead` non consultati — Solo mode. Rivedere a mano prima della produzione)
> **Last Updated**: 2026-11-07
> **Last Verified**: 2026-11-07
> **Implements Pillar**: 2 La notte ricomincia, la storia no · 3 Il bottino ha un volto

## Summary

Come le 81 scene di `trama/storia.json` entrano in un roguelike senza fermarlo: ancoraggi (hub,
banchetto, stanza-ricordo, dopo il boss), una battuta per persona per notte, il cartiglio, le
didascalie per un protagonista muto, e la regola che nessun dialogo si apre a porte chiuse.

> **Quick reference** — Layer: `Feature` · Priority: `MVP` · Key deps: `Stato narrativo, Stanze e porte`

## Overview

Ferruccio non parla. Gli altri parlano poco e quando serve. Ogni scena della bibbia ha un posto
fisico dove può accadere: l'hub di Piazza Dante tra le notti, il banchetto di Tonino dentro i piani,
le stanze-ricordo (una per piano, con un oggetto della bibbia), e il momento dopo un boss, quando
l'anima sale. Il giocatore si avvicina, preme interagisci, legge due o tre battute in un cartiglio e
torna a giocare. Le scelte della bibbia sono scene con due pulsanti (GDD `ricordi-scelta.md`). Le
battute cambiano con lo stato narrativo e con l'avanzamento: Tonino alla decima notte non dice
quello che diceva alla prima.

## Player Fantasy

Il ritorno a casa di *Hades*: morire e scoprire che qualcuno ha qualcosa di nuovo da dirti. E la
malinconia della bibbia: capire da un gesto, non da una spiegazione.

## Detailed Design

### Core Rules

1. **Ancoraggi**. Ogni scena ha un ancoraggio (campo `ancoraggio` aggiunto a storia.json dal
   contenuto di gioco, non dalla bibbia): `hub:<npc>` (nell'hub, parlando con un NPC), `banchetto`
   (al banchetto di Tonino dentro un piano), `ricordo:<oggetto>` (stanza-ricordo con quell'oggetto),
   `dopo-boss:<id>` (subito dopo la dissoluzione del boss), `ingresso-piano:<n>` (all'arrivo nel
   piano, didascalia automatica), `fucina` (nella Fucina del Ricordo), `epilogo` (sequenza del finale).
2. **Attivazione**. Le scene `ingresso-piano`, `dopo-boss` ed `epilogo` partono da sole. Tutte le
   altre richiedono il tasto interagisci davanti all'ancoraggio evidenziato. **Nessuna scena parte
   a porte chiuse** (nemici vivi nella stanza).
3. **Una per persona per notte**. Per ogni NPC, in ogni notte, si mostra al massimo **una** scena
   nuova nell'hub e una nel piano; le altre disponibili aspettano la notte successiva. Eccezione: le
   obbligatorie e le scelte, che si mostrano appena disponibili. Dopo la scena nuova, l'NPC ripete
   una **battuta di ripetizione** (campo `ripetibile`) scelta tra quelle vere per lo stato.
4. **Il cartiglio**. Una battuta alla volta; nome del parlante in maiuscoletto; le didascalie
   (`chi: didascalia`) in corsivo senza nome; avanzamento con interagisci/click/tap; nessun
   avanzamento automatico; nessuna battuta oltre 120 caratteri (regola di `.claude/rules/narrative.md`:
   le battute della bibbia più lunghe vengono spezzate in due battute dello stesso parlante, mai
   riscritte). Durante il cartiglio il gioco è in pausa logica (nemici fermi, timer fermi).
5. **Ferruccio muto**. Le sue reazioni sono didascalie brevi («*Ferruccio abbassa la spada.*») e
   pose del burattino (inchino, spada alzata, mano al polso) dichiarate nella battuta con il campo
   `posa`. Mai una riga di dialogo di Ferruccio.
6. **Ricordi (tableau)**. Le scene di tipo `indizio` con `ricordo: true` si mostrano come immagine
   immobile a schermo intero (carta più chiara, sagome ferme, una sola voce) per 3-6 secondi, poi
   dissolvono. È il formato della bibbia («il giocatore vede soltanto una breve immagine immobile»).
7. **Hub**. Nell'hub stanno sempre: Tonino al banchetto, la porta della bottega di Gaetano (chiusa
   finché `fucina_aperta` è falso), l'ingresso al piano 1. Compaiono per stato: Taddeo (dopo
   `corso-trieste.scelta-taddeo`, se perdonato), Agnese (dopo `san-leucio.scelta-agnese`, se
   risvegliata: sotto il portico), la finestra illuminata di Mariella (sempre, mai un personaggio).
   Il Principio C dell'art bible vale: ogni decisione lascia un segno fisico nell'hub.
8. **Piani**. Dentro un piano gli NPC sono solo Tonino (banchetto) e, nelle stanze-ricordo, le voci
   dei ricordi. Taddeo appare una volta su Corso Trieste nella stanza-ricordo della vetrina
   (`corso-trieste.scelta-taddeo`), Agnese nella stanza della manifattura a San Leucio.
9. **Salto**. Un dialogo già visto si può saltare con `indietro` (chiude il cartiglio). Una scena di
   scelta non si salta.
10. **Lingua**. Tutto il testo viene da storia.json; il motore non contiene stringhe di gioco.
    Le etichette dell'interfaccia (CONTINUA, SCEGLI) stanno in `contenuti/interfaccia.json`.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| Nessun dialogo | — | interagisci su ancoraggio / scena automatica | gioco normale |
| Cartiglio | scena avviata | ultima battuta avanzata / indietro (se saltabile) | pausa logica; battute in sequenza |
| Scelta | ultima battuta di una scena con `scelta` | opzione confermata | due pulsanti; frecce + conferma; nessun timer |
| Tableau | scena `ricordo: true` | fine durata o avanzamento | immagine immobile, una voce |
| Esito | scelta confermata | battute di esito finite | battute della scena condizionale a ordine successivo con `quando` vero, nello stesso cartiglio |

### Interactions with Other Systems

| Sistema | In ingresso | In uscita |
|---|---|---|
| Stato narrativo | scene disponibili per ancoraggio; `scene_viste` | — |
| Ricordi con scelta | — | avvio della scena di scelta e consegna del valore scelto |
| Stanze e porte | porte aperte/chiuse; ancoraggi presenti nella stanza | pausa logica |
| Generazione dei piani | — | richiesta di ancoraggi obbligatori per piano |
| HUD | — | nascondere l'HUD di combattimento durante il cartiglio |
| Input | interagisci, avanza, su/giù, conferma, indietro | — |
| Rendering | — | cartiglio, tableau, pose del burattino |

## Formulas

The `scena_da_mostrare` formula is defined as:

`scena(a, npc) = primo( ordina_per_ordine( {s : disponibile(s) ∧ s.ancoraggio = a} ) ) se nuove_mostrate(npc, notte) < 1 ∨ s.tipo ∈ {obbligatoria, scelta, boss}; altrimenti ripetizione(npc)`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| disponibile(s) | bool | — | calculated (GDD stato-narrativo) | condizioni, viste, ordine |
| nuove_mostrate | int | 0–1 | calculated | scene nuove già mostrate da quell'NPC in questa notte e in quel luogo |
| max_nuove_per_notte | int | 1–2 | data file | tetto (1) |

**Output Range:** una scena o una battuta di ripetizione; mai nulla (ogni NPC ha almeno una ripetizione vera per ogni stato: vincolo di contenuto verificato dallo strumento QA).
**Example:** notte 3, Tonino nell'hub, `tonino_ricordo = restituito`, scena `piazza-dante.ricordo-restituito` già vista → ripetizione «*Tonino sistema due piatti sul banco.*» (didascalia di ripetizione dal contenuto di gioco).

The `durata_tableau` formula is defined as:

`durata = max(t_min, t_base + 0,06 s × caratteri_voce)`

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| t_min | float | 2–4 s | data file | durata minima (3) |
| t_base | float | 1–2 s | data file | tempo di lettura dell'immagine (1,5) |
| caratteri_voce | int | 0–120 | calculated | lunghezza della voce |

**Output Range:** 3 a 8,7 s. **Example:** «Prima fate uscire i ragazzi!» (27 car.) → max(3, 1,5 + 1,62) = 3,1 s.

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| Interagisci su Tonino con nemici vivi nella stanza del banchetto | nessun dialogo; Tonino ha una didascalia di «aspetta» senza cartiglio (un'icona sopra la testa) | regola 2 |
| Scena di scelta disponibile ma l'NPC ha già parlato stanotte | la scelta si mostra lo stesso (eccezione della regola 3) | le scelte non aspettano |
| Il giocatore chiude il gioco durante un cartiglio | la scena non è segnata come vista; alla ripresa riparte dall'inizio | nessuna scena «persa» |
| Battuta della bibbia di 140 caratteri | spezzata in due alla punteggiatura più vicina alla metà, stesso parlante; se non c'è punteggiatura, alla parola più vicina | regola 4; testo mai riscritto |
| Due NPC adiacenti con ancoraggi sovrapposti | vince il più vicino al centro del corpo di Ferruccio; l'evidenziazione mostra uno solo | nessuna ambiguità |
| Nessuna battuta di ripetizione vera per uno stato | errore di contenuto loggato; si mostra la didascalia generica dell'NPC da `contenuti/interfaccia.json` | mai silenzio muto |
| Tableau durante una scossa di camera | la scossa si interrompe; il tableau è immobile per definizione | — |

## Dependencies

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| Stato narrativo | This depends on Stato | disponibilità, ordine, viste |
| Stanze e porte | This depends on Stanze | porte aperte, ancoraggi nella stanza |
| Generazione dei piani | Reciproca | gli ancoraggi obbligatori vanno garantiti; il piano li chiede qui |
| Ricordi con scelta | Ricordi depends on this | cartiglio della scelta |
| Boss | Boss depends on this | scena `dopo-boss` |
| HUD / Rendering | depend on this | cartiglio, tableau |

## Tuning Knobs

| Parameter | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|--------------|------------|-------------------|-------------------|
| max_nuove_per_notte | 1 | 1–2 | più storia per notte, ritmo più lento | storia diluita |
| max_caratteri_battuta | 120 | 90–140 | — | più spezzature |
| t_min / t_base tableau | 3 / 1,5 s | 2–4 / 1–2 | — | — |
| antirimbalzo cartiglio | 160 ms | 100–250 | niente salti accidentali | — |
| raggio di interazione | 56 px | 40–80 | — | — |

## Acceptance Criteria

- [ ] **GIVEN** notte 1, hub, Tonino, **WHEN** interagisci, **THEN** parte `piazza-dante.tonino-primo-incontro` con le sue battute nell'ordine del file e il gioco è in pausa logica.
- [ ] **GIVEN** la stessa notte, dopo quella scena, **WHEN** interagisci di nuovo con Tonino, **THEN** si mostra una battuta di ripetizione, non una scena nuova.
- [ ] **GIVEN** un nemico vivo nella stanza del banchetto, **WHEN** interagisci con Tonino, **THEN** nessun cartiglio.
- [ ] **GIVEN** una battuta di 140 caratteri nel file, **WHEN** mostrata, **THEN** appare in due cartigli consecutivi dello stesso parlante con il testo identico concatenato.
- [ ] **GIVEN** `villa-comunale.ricordo-gaetano` (tableau), **WHEN** parte, **THEN** l'immagine resta ≥ 3 s e la voce è «Prima fate uscire i ragazzi!».
- [ ] **GIVEN** `taddeo = perdonato` e `san-leucio.scelta-agnese` vista con `risvegliata`, **WHEN** si torna all'hub, **THEN** Taddeo e Agnese sono presenti nell'hub nei punti dichiarati e Mariella è solo una finestra accesa.
- [ ] **GIVEN** chiusura del gioco a metà di una scena, **WHEN** si riprende, **THEN** la scena non è in `scene_viste`.
- [ ] Nessuna stringa di gioco nel codice: grep di virgolette « » nel motore restituisce zero.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| La Fucina del Ricordo si apre dopo la prima volta che si raggiunge il piano 2 (decisione dell'autore: «dopo aver percorso Piazza e Corso») o dopo la prima morte? | autore | prima del VS | proposta: prima volta al piano 2 |
| Le battute di ripetizione e le didascalie dell'hub non sono nella bibbia: vanno scritte dal writer e marcate `canon: Provisional` | writer | alpha | — |
