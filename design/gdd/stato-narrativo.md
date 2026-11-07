# Stato narrativo

> **Status**: Draft
> **Author**: narrative-director (sessione autonoma; `creative-director`, `systems-designer`, `qa-lead` non consultati — Solo mode. Rivedere a mano prima della produzione)
> **Last Updated**: 2026-11-07
> **Last Verified**: 2026-11-07
> **Implements Pillar**: 2 La notte ricomincia, la storia no

## Summary

La memoria del gioco: i sei flag della bibbia (§XIX), i flag di avanzamento che dicono fin dove
Ferruccio è arrivato nelle notti precedenti, e le regole con cui `trama/storia.json` viene letto per
decidere quali scene e quali battute esistono adesso. È puro dato: nessun giocatore lo vede, tutti
lo sentono.

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `None (dati); Salvataggio lo persiste`

## Overview

In un roguelike la run si azzera; qui la storia no. Lo stato narrativo è l'insieme di valori che
sopravvive a ogni morte: le sei decisioni binarie della bibbia, il punto massimo raggiunto, i boss
battuti, le scene già viste, le notti giocate. Ogni scena di `trama/storia.json` dichiara con
`quando` in quali stati esiste; ogni battuta con `se` in quali stati si dice. Il sistema risponde a
una sola domanda, sempre la stessa: «dato questo stato, questa scena (o questa battuta) c'è?».

## Player Fantasy

Indiretta: il giocatore non vede i flag, vede Tonino che smette di ridere e Agnese che si tocca il
polso. La fantasia è «il mondo ricorda cosa ho fatto».

## Detailed Design

### Core Rules

1. **Le sei decisioni** (nomi e valori esatti di `trama/storia.json`): `tonino_ricordo`
   (restituito | negato), `taddeo` (perdonato | accusato), `registro` (conservato | bruciato),
   `agnese` (risvegliata | sognante), `gregorio` (dialogo | attacco), `violante` (uccisa | risparmiata).
   Partono a `null` (non decise). Una volta decise **non tornano mai `null`** e non cambiano, salvo
   la regola 8.
2. **Derivati**, calcolati e mai salvati: `lettera_agnese` = (tonino_ricordo = restituito);
   `lettera_mariella` = (taddeo = perdonato); `prove` = (registro = conservato ∨ taddeo = perdonato).
   Nelle condizioni valgono `"vera"`/`"falsa"`.
3. **Avanzamento** (non è nella bibbia, serve al roguelike): `notte` (contatore, parte da 1),
   `piano_max` (0–5: piano più profondo raggiunto in qualunque notte), `boss_battuti` (insieme di
   id: gatto, regina, madre, tessitrice, custode), `scene_viste` (insieme di id di scena),
   `fucina_aperta` (bool), `identita` (bool: Gaetano ha restituito nome e volto), `finale_visto`
   (null | uccisa | risparmiata), `mondo` (null | A | B: lo stato del mondo dopo il finale, bibbia §XVII).
4. **Condizioni**: un oggetto `{flag: valore}` è vero se **tutte** le coppie sono vere. Valore `"*"`
   = flag deciso (qualunque valore); `""` = non deciso; `"!x"` = diverso da x (anche non deciso);
   altrimenti uguaglianza. `quando_or`: lista di oggetti, basta che uno sia vero. I flag di
   avanzamento accettano anche confronti numerici con prefisso: `">=2"`, `"<5"` (solo per `notte`
   e `piano_max`) e appartenenza per gli insiemi: `boss_battuti: "gatto"` è vero se l'insieme lo contiene.
5. **Scene e capitoli → piani**: il capitolo di una scena è il piano in cui può avvenire
   (piazza-dante = 1, corso-trieste = 2, villa-comunale = 3, san-leucio = 4, reggia = 5, epilogo =
   dopo il finale). Una scena è **disponibile** se: il suo `quando` è vero, non è in `scene_viste`
   (salvo `ripetibile: true`), e il suo ancoraggio (GDD `incontri-dialoghi.md`) è presente nel piano.
6. **Scene obbligatorie** (tipo `obbligatoria` e `boss`) sono quelle che la bibbia §XV non permette
   di saltare: la generazione del piano (GDD `generazione-piani.md`) deve garantire che il loro
   ancoraggio esista nel piano finché non sono viste. Le `indizio` e `condizionali` sono opportunità:
   possono mancare in una notte e tornare nella successiva.
7. **Ordine**: tra scene disponibili nello stesso ancoraggio vince quella con `ordine` più basso;
   una scena con `ordine` maggiore di una obbligatoria non vista dello stesso capitolo **non è
   disponibile** (si rispetta la sequenza della bibbia).
8. **Decisioni e morte**: una decisione presa durante una notte resta anche se Ferruccio muore
   subito dopo (bibbia §XIX: «non devono andare perdute quando il giocatore muore»). Il ricordo
   fisico (dono azzurro) invece si perde con la run (GDD `ricordi-scelta.md`).
9. **Dopo il finale**: quando `violante` viene deciso, `finale_visto` e `mondo` si impostano; le
   notti successive si giocano nel mondo A o B (GDD `finali-mondo-dopo.md`). Le altre cinque
   decisioni restano. **Nuova partita** azzera tutto (nuovo slot).
10. **Integrità**: un flag con valore fuori dall'elenco, o una scena che cita un flag ignoto, è un
    errore di contenuto che il gioco segnala in console e **tratta come condizione falsa**, mai come
    vera (la scena non appare; non si inventa).

### States and Transitions

Lo stato non ha fasi proprie; ogni flag decisionale ha tre valori: `null` → `a` oppure `null` → `b`, senza ritorno.

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| Notte in corso | avvio di una notte dall'hub | morte o finale | `notte` fisso; `piano_max` può crescere; `scene_viste` cresce |
| Hub | morte, finale, avvio | avvio di una notte | si leggono le scene di capitolo `piazza-dante` con ancoraggio `hub` |
| Mondo dopo | `violante` deciso | nuova partita | tutte le letture usano anche `mondo` |

### Interactions with Other Systems

| Sistema | In ingresso | In uscita |
|---|---|---|
| Incontri e dialoghi | richiesta «scene disponibili per ancoraggio X» | lista ordinata di scene; marcatura `scene_viste` |
| Ricordi con scelta | `decidi(flag, valore)` | conferma, derivati aggiornati |
| Boss | id boss battuto | `boss_battuti` |
| Generazione dei piani | — | insieme delle scene obbligatorie non viste per piano (ancoraggi da garantire) |
| Finali e mondo dopo | — | `mondo`, `finale_visto` |
| Salvataggio | serializza/deserializza | lo stato intero |
| Strumenti QA | `imposta(flag, valore)` in modalità debug | — |

## Formulas

The `disponibile` formula is defined as:

`disponibile(s) = cond(s.quando) ∧ (s.quando_or = ∅ ∨ ∃c ∈ s.quando_or: cond(c)) ∧ (s.id ∉ scene_viste ∨ s.ripetibile) ∧ ¬∃o: (o.capitolo = s.capitolo ∧ o.tipo ∈ {obbligatoria, boss} ∧ o.ordine < s.ordine ∧ o.id ∉ scene_viste)`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| s.quando | oggetto | — | data file (storia.json) | condizioni in AND |
| s.quando_or | lista | — | data file | alternative in OR |
| scene_viste | insieme | 0–81 id | calculated (salvato) | scene già mostrate |
| s.ordine | int | 10–130 | data file | posizione nel capitolo |

**Output Range:** booleano. **Example:** `san-leucio.amore-ritrovato` con agnese=risvegliata, taddeo=perdonato, `san-leucio.arrivo-manifattura` vista → vera; con `arrivo-manifattura` non vista → falsa.

The `numero_percorsi` formula (verifica di copertura, non di gioco) is defined as:

`percorsi = 2^5 × 2 = 64` prima/dopo il finale, come la bibbia §XIII: lo strumento di QA deve poter forzare ciascuno dei 64 stati e verificare che ogni scena `epilogo` con `quando` vero sia raggiungibile.

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| `gregorio` si prova a decidere `dialogo` con `prove = falsa` | rifiutato; la scena `reggia.attacco-senza-prove` imposta `attacco` | la bibbia lega il dialogo alle prove |
| Due scene disponibili nello stesso ancoraggio con lo stesso `ordine` (es. le due a 90 di piazza-dante) | sono mutuamente esclusive per `quando`; se entrambe vere è un errore di contenuto: si mostra la prima nel file e si logga | mai due scene insieme |
| Morte durante una scena di scelta, prima della conferma | la scelta non è presa; la scena torna disponibile | nessuna decisione implicita |
| `scene_viste` contiene un id che non esiste più in storia.json | ignorato | contenuti aggiornati tra versioni |
| Flag di avanzamento `piano_max` cala (nuova versione con meno piani) | clamp al massimo disponibile | — |
| Il giocatore raggiunge il piano 5 senza aver visto obbligatorie dei piani 2-4 (percorso fortunato) | impossibile per regola 6: la generazione garantisce gli ancoraggi; se per bug manca, la scena si recupera nell'hub come «memoria» (bibbia §XV: le informazioni perse si recuperano in forma essenziale) | nessuno arriva a Violante senza sapere |
| Violante decisa, poi nuova notte | `mondo` A/B attivo; le scene `epilogo` con ancoraggio `hub` diventano le scene dell'hub | il dopo è giocabile |

## Dependencies

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| Salvataggio e profilo | This depends on Salvataggio | persistenza dello stato intero |
| Incontri e dialoghi | Incontri depends on this | disponibilità e ordine delle scene |
| Ricordi con scelta | Ricordi depends on this | `decidi()` |
| Boss | Boss depends on this | `boss_battuti`, flag `gregorio` |
| Generazione dei piani | Generazione depends on this | ancoraggi obbligatori da garantire |
| Finali e mondo dopo | Finali depends on this | `violante`, `mondo` |
| Strumenti QA | QA depends on this | forzatura dei 64 stati |

## Tuning Knobs

Nessun valore numerico di bilanciamento: i soli parametri sono i dati di `trama/storia.json`
(scene, ordini, condizioni). Il file è la manopola.

## Acceptance Criteria

- [ ] **GIVEN** stato iniziale (tutti `null`), **WHEN** si chiede `prove`, **THEN** vale `falsa`; **WHEN** si decide `taddeo = perdonato`, **THEN** `prove` vale `vera` e `lettera_mariella` vale `vera`.
- [ ] **GIVEN** `taddeo = perdonato`, **WHEN** si tenta `decidi(taddeo, accusato)`, **THEN** è rifiutato e lo stato non cambia.
- [ ] **GIVEN** `prove = falsa`, **WHEN** si tenta `decidi(gregorio, dialogo)`, **THEN** è rifiutato.
- [ ] **GIVEN** `violante = uccisa`, `agnese = risvegliata`, `taddeo = accusato`, **WHEN** si chiedono le scene `epilogo` a ordine 50, **THEN** `epilogo.agnese-accusa` e `epilogo.agnese-fermati` sono entrambe candidate e il sistema logga il conflitto scegliendo la più specifica (più coppie in `quando`).
- [ ] **GIVEN** `piazza-dante.tonino-primo-incontro` non vista, **WHEN** si chiede `piazza-dante.filastrocca` (ordine 60), **THEN** non è disponibile.
- [ ] **GIVEN** una condizione `{"flag_inesistente": "x"}`, **WHEN** valutata, **THEN** è falsa e viene loggato un errore di contenuto.
- [ ] **GIVEN** lo strumento QA, **WHEN** forza ciascuno dei 64 stati, **THEN** per ognuno esiste almeno una scena `epilogo` disponibile a ogni ordine da 10 a 110.
- [ ] Nessun nome di flag o di scena è scritto nel codice del motore.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| Alla seconda partita (nuovo slot) si può scegliere di partire con il mondo A o B? | autore | alpha | — |
| Le due scene a ordine 50 di `epilogo` per Agnese (`agnese-accusa` vs `agnese-fermati`) vanno rese esclusive in storia.json aggiungendo a `fermati` la condizione «non (risvegliata ∧ accusato)» | narrative-director | prima dell'implementazione | correggere storia.json |
