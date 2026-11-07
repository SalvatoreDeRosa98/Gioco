# Ricordi con scelta

> **Status**: Draft
> **Author**: narrative-director + systems-designer (sessione autonoma; `creative-director`, `economy-designer`, `qa-lead` non consultati — Solo mode. Rivedere a mano prima della produzione)
> **Last Updated**: 2026-11-07
> **Last Verified**: 2026-11-07
> **Implements Pillar**: 3 Il bottino ha un volto · 2 La notte ricomincia, la storia no

## Summary

Il punto in cui bottino e trama coincidono: un ricordo è un dono azzurro con il profilo dell'oggetto
di una persona dentro l'anima. Finché lo tieni ti rende più forte; portarlo alla persona giusta apre
la scelta della bibbia. Le sei decisioni passano tutte di qui, ciascuna con il suo oggetto, il suo
luogo e il suo prezzo.

> **Quick reference** — Layer: `Feature` · Priority: `MVP` · Key deps: `Doni e modificatori, Stato narrativo, Incontri e dialoghi`

## Overview

In *Isaac* un oggetto è un numero. Qui alcuni oggetti sono persone. Quando un boss si dissolve, la
sua anima può lasciare un **ricordo**: il medaglione di Rosa, la lettera di Mariella, il registro
del cantiere, la sciarpa di Agnese, il giglio d'oro di Gregorio, il fazzoletto di Bianca. Il ricordo
è un dono a tutti gli effetti (modifica le statistiche nominate), ma ha un volto: quando Ferruccio lo
porta davanti alla persona a cui appartiene, la scena di scelta della bibbia si apre con due
risposte. Una delle due lo restituisce (perdi il bonus, la storia prende una strada); l'altra lo
tiene (conservi il bonus per la notte, la storia prende l'altra). Nessuna delle due è "giusta"
(bibbia §XIV). Le decisioni restano per sempre; il ricordo come oggetto sparisce con la run.

## Player Fantasy

Esitare con un oggetto in mano. Sapere che tenere il medaglione significa che Tonino continuerà a
ridere e a fissare una sedia vuota. Il piacere amaro delle conseguenze della bibbia, dentro il ritmo
del bottino.

## Detailed Design

### Core Rules

1. **Tabella dei sei ricordi** (ancorati alla bibbia; le battute sono quelle di `trama/storia.json`):

| Flag | Ricordo (dono azzurro) | Cade da | Dove si apre la scelta | Scena di scelta | Opzione A (restituisce / cede) | Opzione B (tiene) |
|---|---|---|---|---|---|---|
| `tonino_ricordo` | Medaglione di Rosa | Gatto dei Quattro Canti (piano 1) | banchetto di Tonino (piano 1 o 2) o hub | `piazza-dante.scelta-tonino` | restituito: bonus perso; Tonino piange; `lettera_agnese` | negato: bonus per la notte; Tonino ride |
| `taddeo` | Spada di legno (il passato condiviso) | Regina dei Debiti (piano 2) | stanza-ricordo della vetrina, Corso Trieste | `corso-trieste.scelta-taddeo` | perdonato: Taddeo aiuta (messaggi nei piani, `lettera_mariella`) | accusato: Taddeo fugge, antagonista secondario |
| `registro` | Registro del cantiere | Madre di Marmo (piano 3) | davanti ai registri pubblici della Villa | `villa-comunale.scelta-registro` | conservato: `prove`; il registro resta un ricordo tenuto (peso) | bruciato: scintille una tantum; nessuna prova |
| `agnese` | Sciarpa rossa | Tessitrice di Pietra (piano 4) | manifattura, davanti ad Agnese | `san-leucio.scelta-agnese` | risvegliata: Agnese ricorda; la sciarpa diventa dono permanente (sbloccata alla Fucina) | sognante: la sciarpa resta sul telaio; Agnese sorride |
| `gregorio` | Giglio d'oro (dal confronto) | — (si apre prima dello scontro) | Cortile d'Onore, davanti al Custode | `reggia.scelta-gregorio` (solo `prove = vera`) | dialogo: Gregorio esita; confessione anticipata | attacco: scontro immediato |
| `violante` | Fazzoletto col giglio | il Custode | il bivio finale | `reggia.scelta-violante` | uccisa: Velo spezzato, mondo A | risparmiata: Velo ricucito, mondo B |

   Le colonne «cade da» e «dove si apre» sono contenuto di gioco (non bibbia) e sono marcate
   `canon: Provisional` in storia.json; le scene e le battute sono della bibbia.
2. **Il ricordo come dono**. Ha i campi di un dono (GDD `doni-modificatori.md`) più: `persona`,
   `flag`, `scena_scelta`, `bonus_tenuto` (modificatori attivi finché è nell'inventario della
   notte), `effetto_ceduto` (cosa succede quando si sceglie A: può essere una ricompensa
   diversa, mai un bonus di combattimento maggiore di B). Si mostra nell'HUD come goccia azzurra
   con il profilo dell'oggetto.
3. **La scelta**. Si apre solo con il ricordo nell'inventario, davanti all'ancoraggio, a porte
   aperte. Il cartiglio mostra prima le battute della scena di scelta, poi due pulsanti con le
   `etichetta` di storia.json e, sotto ciascuno, la riga `cosa_sacrifica` (bibbia §XIV, principio 2:
   «il giocatore deve comprendere cosa sta sacrificando»). Nessun timer, nessuna opzione evidenziata
   per default, nessun punteggio. Confermata, la decisione è immediata e definitiva (GDD
   `stato-narrativo.md` regola 8) e parte la scena condizionale di esito.
4. **Se il ricordo si perde**. Morire con il ricordo in mano senza aver scelto: il flag resta
   `null`, il ricordo torna nel Velo e il boss lo lascia di nuovo alla prossima vittoria. Non c'è
   fretta: la bibbia non punisce l'indecisione, la bibbia punisce la decisione.
5. **Equilibrio delle opzioni**. Regola di design, verificata dal GDD `doni-modificatori.md` e dal
   `balance-check`: il valore atteso in potere di B (tenere) e il valore atteso di A (cedere, con
   `effetto_ceduto` e le conseguenze narrative che sbloccano contenuto) devono stare entro ±20%
   l'uno dall'altro sulla notte. La scelta morale non deve mai essere la scelta ottima né quella
   stupida.
6. **Ricordi senza scelta**. Le anime dei nemici comuni lasciano monete; solo i boss lasciano
   ricordi. I quattro indizi di Bianca (filastrocca, inchino, fazzoletto, scatola) **non** sono
   doni: sono tableau (GDD `incontri-dialoghi.md`), perché Bianca non si può salvare né usare.
7. **Dopo la scelta**. Il ricordo ceduto sparisce dall'inventario; il ricordo tenuto resta fino
   alla fine della notte con `bonus_tenuto`; nelle notti successive il boss non lo lascia più (il
   flag è deciso) e lascia invece un dono d'oro normale dal pool.
8. **Gregorio e Violante** non hanno un oggetto da portare: le loro scelte si aprono in scena
   (`reggia.scelta-gregorio` solo se `prove = vera`, altrimenti `reggia.attacco-senza-prove` imposta
   `attacco` senza chiedere; `reggia.scelta-violante` dopo `reggia.ultima-conversazione`). Il
   giglio e il fazzoletto sono gli oggetti della scena, non doni.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| Nel Velo | flag `null`, ricordo non in inventario | boss sconfitto | il boss lo lascerà |
| In mano | raccolto dall'anima del boss | scelta confermata / morte | `bonus_tenuto` attivo; HUD lo mostra; ancoraggio evidenziato con alone azzurro |
| Ceduto | opzione A | — | flag = A; `effetto_ceduto`; scena di esito |
| Tenuto | opzione B | fine della notte | flag = B; bonus fino a fine notte; scena di esito |
| Deciso | flag ≠ null | nuova partita | il boss lascia doni normali |

### Interactions with Other Systems

| Sistema | In ingresso | In uscita |
|---|---|---|
| Doni e modificatori | modello del dono, applicazione dei modificatori | `bonus_tenuto` come lista di modificatori |
| Stato narrativo | `decidi(flag, valore)` | — |
| Incontri e dialoghi | scena di scelta e di esito | ancoraggio evidenziato se il ricordo è in mano |
| Boss | drop alla dissoluzione | quale ricordo (per flag `null`) |
| Economia | `effetto_ceduto` (es. scintille) | — |
| HUD | — | goccia azzurra con profilo; etichette e `cosa_sacrifica` |
| Fucina del Ricordo | sblocchi narrativi (sciarpa permanente se `agnese = risvegliata`) | — |

## Formulas

The `valore_opzione` formula (per il bilanciamento) is defined as:

`V_B = Σ(valore_mod_i di bonus_tenuto) × stanze_rimaste_attese`
`V_A = valore(effetto_ceduto) + valore(contenuto_sbloccato)`
`vincolo: |V_A − V_B| / max(V_A, V_B) ≤ tolleranza`

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| valore_mod_i | float | 0,5–3 | data file (doni) | valore di bilanciamento di un modificatore (es. +10% danno = 1) |
| stanze_rimaste_attese | int | 4–40 | calculated | stanze attese tra la scelta e la fine della notte |
| valore(effetto_ceduto) | float | 0–20 | data file | es. 15 scintille = 3 |
| valore(contenuto_sbloccato) | float | 0–10 | data file | es. lettera di Agnese = 2 |
| tolleranza | float | 0,1–0,3 | data file | 0,2 |

**Output Range:** booleano di verifica. **Example:** Medaglione di Rosa tenuto: +15% danno (1,5) × 20 stanze = 30 → troppo; si tara a +8% (0,8 × 20 = 16) contro restituito: 12 scintille (2,4) + lettera di Agnese (2) + sconto al banchetto per la notte (10) = 14,4 → |14,4−16|/16 = 10% ✓.

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| Ferruccio arriva al banchetto con il Medaglione a porte chiuse | nessuna scelta finché la stanza non è pulita | GDD incontri regola 2 |
| Muore durante la scena di esito (impossibile: pausa logica) | — | la pausa logica lo impedisce |
| Ha il Medaglione ma non incontra Tonino per tutta la notte | tiene il bonus; flag resta `null`; il Medaglione sparisce a fine notte e il Gatto lo lascia di nuovo | nessuna decisione implicita |
| `registro = conservato` e poi il giocatore vorrebbe «bruciarlo» per le scintille | impossibile: il flag è definitivo; il registro resta un ricordo tenuto con `bonus_tenuto` (peso: −5% velocità, +1 finestra parata) | la bibbia non torna indietro |
| Due ricordi in mano (Medaglione dal piano 1 e Spada di legno dal piano 2) | entrambi attivi, entrambe le scelte disponibili nei rispettivi ancoraggi | — |
| Dono d'oro e ricordo con lo stesso tag di sinergia | la sinergia vale (è un dono a tutti gli effetti) | coerenza del modello |
| Mondo A/B già deciso e il boss del piano 1 viene battuto | lascia un dono d'oro dal pool, mai un ricordo | tutti i flag sono decisi |

## Dependencies

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| Doni e modificatori | This depends on Doni | modello del dono, modificatori |
| Stato narrativo | This depends on Stato | `decidi()`, derivati |
| Incontri e dialoghi | This depends on Incontri | cartiglio della scelta e dell'esito |
| Boss | Boss depends on this | quale ricordo lasciare |
| Economia | This depends on Economia | `effetto_ceduto` |
| Fucina del Ricordo | Fucina depends on this | sblocchi narrativi |
| HUD | HUD depends on this | goccia azzurra, etichette |

## Tuning Knobs

| Parameter | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|--------------|------------|-------------------|-------------------|
| tolleranza di equilibrio | 0,20 | 0,10–0,30 | opzioni più sbilanciate ammesse | tuning più rigido |
| bonus_tenuto Medaglione | +8% danno | +5–12% | tenere conviene | — |
| effetto_ceduto Medaglione | 12 scintille + sconto 30% al banchetto per la notte | 8–20 / 20–40% | cedere conviene | — |
| bonus_tenuto Spada di legno | +1 carica scatto | fisso | — | — |
| bonus_tenuto Registro (conservato) | +40 ms finestra parata, −5% velocità | — | — | — |
| effetto_ceduto Registro (bruciato) | 25 scintille | 15–40 | — | — |
| bonus_tenuto Sciarpa (sognante, resta sul telaio: nessun bonus) / (risvegliata: sciarpa permanente alla Fucina) | — | — | — | — |

## Acceptance Criteria

- [ ] **GIVEN** `tonino_ricordo = null`, **WHEN** il Gatto dei Quattro Canti si dissolve, **THEN** lascia il Medaglione di Rosa (dono azzurro) e raccolto dà +8% danno.
- [ ] **GIVEN** Medaglione in mano e banchetto a porte aperte, **WHEN** interagisci con Tonino, **THEN** parte `piazza-dante.scelta-tonino`, seguita da due pulsanti con le etichette del file e una riga `cosa_sacrifica` ciascuno, senza selezione predefinita.
- [ ] **GIVEN** la scelta «restituito», **WHEN** confermata, **THEN** `tonino_ricordo = restituito`, il Medaglione sparisce, il danno torna al valore base, si ricevono 12 scintille e parte `piazza-dante.ricordo-restituito`.
- [ ] **GIVEN** la scelta «negato», **WHEN** confermata, **THEN** `tonino_ricordo = negato`, il bonus resta fino alla fine della notte e parte `piazza-dante.ricordo-negato`.
- [ ] **GIVEN** Medaglione in mano e nessuna scelta, **WHEN** Ferruccio muore, **THEN** `tonino_ricordo = null` e alla successiva vittoria sul Gatto il Medaglione cade di nuovo.
- [ ] **GIVEN** `tonino_ricordo` deciso, **WHEN** il Gatto si dissolve, **THEN** lascia un dono d'oro dal pool.
- [ ] **GIVEN** `prove = falsa`, **WHEN** si entra nella stanza del Custode, **THEN** parte `reggia.attacco-senza-prove` senza pulsanti e `gregorio = attacco`.
- [ ] **GIVEN** lo strumento di bilanciamento, **WHEN** calcola V_A e V_B per ciascun ricordo con i valori correnti, **THEN** la differenza è ≤ 20% per tutti e sei.
- [ ] Nessuna etichetta, battuta o valore di bonus nel codice.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| La sciarpa: la decisione dell'autore (10/10) la lega ad `agnese = risvegliata`; il GDD controllo propone lo scatto base sempre disponibile e la sciarpa come miglioria. Da confermare | autore | prima del VS | — |
| La Spada di legno come oggetto del passato condiviso di Taddeo è una proposta (canon Provisional) | autore | alpha | — |
| Violante o Donna Luciana? | autore | prima dei testi dell'hub | — |
