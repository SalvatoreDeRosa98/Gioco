# Economia: monete, scintille, banchetto

> **Status**: Draft
> **Author**: systems-designer (sessione autonoma; `game-designer`, `economy-designer`, `creative-director`, `qa-lead` non consultati — Solo mode. Rivedere a mano prima della produzione)
> **Last Updated**: 2026-11-07
> **Last Verified**: 2026-11-07
> **Implements Pillar**: 2 La notte ricomincia, la storia no (due valute: una che muore con la notte, una che resta) · 3 Il bottino ha un volto (il banchetto è di Tonino, la Fucina è di Gaetano)

## Summary

Tre risorse. Le **monete di luce** sono la valuta della notte: cadono dai nemici e dalle stanze, si spendono al
banchetto di Tonino, si perdono alla morte. Le **scintille** sono la valuta permanente: cadono dai boss e
dalle stanze-ricordo, si spendono alla Fucina del Ricordo per sbloccare doni e migliorie, non si perdono mai. I
**cuori** (maschere) sono la vita che si recupera: cadono dalle stanze e si comprano. Il documento fissa
rubinetti e scarichi, la curva di reddito per piano, i prezzi, i costi della Fucina e il ritmo obiettivo degli
sblocchi.

> **Quick reference** — Layer: `Feature` · Priority: `MVP` · Key deps: `Doni e modificatori, Stanze e porte`

## Overview

Ogni notte comincia a zero monete e a zero doni. Ripulendo le stanze Ferruccio raccoglie monete passandoci
sopra (nessun tasto); al banchetto di Tonino (uno per piano) ci sono tre slot a prezzo fisso: un dono, un
cuore, un consumabile. I prezzi salgono con il piano (+15% per piano) e con la rarità (×1,8 il raro, ×3 il
prezioso), mentre il reddito sale più piano: il giocatore non può comprare tutto, e sceglie. Alla morte le
monete non spese si perdono; le scintille, accreditate nel profilo appena raccolte, no. Le scintille comprano
progresso permanente alla Fucina, con costi crescenti calibrati perché all'inizio ci sia uno sblocco ogni
una o due notti. Nessuna risorsa dell'economia scrive un flag della trama: la storia non si compra.

## Player Fantasy

Una notte è un piccolo bilancio da amministrare con la luce che resta: «prendo il dono raro o il cuore?
Spendo tutto adesso o aspetto il banchetto del piano dopo?». Perdere le monete alla morte fa male senza essere
punitivo, perché il giocatore le ha quasi sempre già trasformate in potere. Le scintille sono il contrario: la
sensazione di non aver sprecato la notte, qualunque cosa sia successa. Ogni boss e ogni ricordo lasciano
qualcosa che resta, come la memoria di un'anima.

## Detailed Design

### Core Rules

1. **Tre risorse e i cuori.**

   | Risorsa | Natura | Si perde alla morte? | Dove vive | HUD (art bible) |
   |---|---|---|---|---|
   | Monete di luce | valuta della notte | **sì**, tutte | stato della notte | disco con giglio, oro `#f3c14b` |
   | Scintille | valuta permanente | **mai** | profilo | rombo, carta chiara `#f2c278`, gruppo separato dalle monete |
   | Cuori (maschere) | vita recuperabile | sì (la vita si azzera con la notte) | stato della notte | maschere di vita, crema |

   Le tre risorse hanno forme diverse (disco, rombo, maschera) come chiede la tabella daltonica dell'art bible.

2. **Monete di luce: rubinetti.**
   - **Nemici**: alla morte di ogni nemico comune, con probabilità `p_drop_moneta` (0,40) cade una moneta;
     nel 90% dei casi è **piccola** (valore 1), nel 10% **grande** (valore 5, disco 1,5 volte più largo).
     Il valore medio per moneta è `v_medio` = 1,4; atteso per nemico: 0,56.
   - **Stanza ripulita**: alla chiusura della stanza di combattimento (porte che si aprono) cadono
     `bonus_stanza` (2) monete piccole al centro. Le stanze senza combattimento non danno il bonus.
   - **Stanza segreta** (finestra accesa): una cache di `monete_segreta` (10) monete, con probabilità
     `p_segreta` (0,5) per piano.
   - **Boss**: `monete_boss(p) = 6 + 2 × p`, cadono con l'anima, dopo la fine del combattimento.
   - Il **piedistallo della bottega non costa nulla**; la bottega non è un rubinetto né uno scarico.
   - Le monete si raccolgono passandoci sopra entro `r_raccolta_moneta` (24 px dal centro del corpo, il
     corpo ha raggio 14 px); restano a terra nella stanza finché non sono prese, anche dopo l'uscita.
   - **Tetto**: `tetto_monete` = 99. A 99 le monete **restano a terra** (come il cuore a maschere piene,
     `controllo-ferruccio.md` Edge Cases): niente spreco silenzioso, si può tornare dopo aver speso.

3. **Cuori.**
   - Un cuore ripristina 1 maschera (non aumenta `maschere_max`, che si cambia con doni e migliorie). A
     maschere piene il cuore resta a terra (GDD controllo).
   - **Rubinetto stanze**: alla chiusura di una stanza di combattimento, con `m = maschere_max − maschere`
     (maschere mancanti): se `m = 0` non cade nulla; altrimenti cade un cuore con probabilità
     `min(0,40, 0,08 × m)`. È una retroazione negativa voluta: più si è messi male, più si è aiutati,
     senza mai garantire.
   - **Boss**: lascia 1 cuore con l'anima se `m ≥ 1`.
   - **Banchetto**: slot «cuore», prezzo base 10 (formula in Formulas). Non si può comprare a maschere piene.
   - Non esistono mezze maschere (`controllo-ferruccio.md` Open Questions).

4. **Scintille: rubinetti.** Le scintille si accreditano nel profilo **nel momento in cui sono raccolte**
   (non a fine notte), quindi sopravvivono alla morte nella stanza successiva.
   - **Boss**: `scintille_boss(p) = 3 + 2 × (p − 1)`: 3, 5, 7, 9, 11 per i piani 1-5.
   - **Stanza-ricordo**: `scintille_ricordo` (2) scintille; compare con probabilità `p_ricordo` (0,5) a
     partire dal piano 2 (0 al piano 1, dove l'anima è quella del boss). Quando c'è, contiene anche il ricordo
     eleggibile con `piano_fisso` uguale al piano (GDD `doni-modificatori.md`), se esiste.
   - **Residuo di notte** (rubinetto aggiunto da questo GDD, spento con `stanze_per_scintilla` = 0):
     alla fine di ogni notte, vinta o persa, `floor(stanze_di_combattimento_ripulite / stanze_per_scintilla)`
     scintille con `stanze_per_scintilla` = 4. Serve perché le prime notti, che finiscono quasi sempre prima del
     boss, non siano a zero (vedi la curva del tempo-per-sblocco).
   - Tetto tecnico `tetto_scintille` = 99 999; mai raggiunto, solo contro l'overflow.

5. **Banchetto di Tonino.** Uno per piano, nella stanza apposita. Il banchetto mostra **tre slot** a prezzo
   fisso, generati con il seed della notte alla generazione del piano e **conservati** se si esce e si rientra:
   1. **Dono**: un dono d'oro estratto dal pool con le regole di `doni-modificatori.md` (rarità pesata,
      distinto dai doni già offerti nel piano). Prezzo secondo la rarità.
   2. **Cuore**: prezzo `base` 10.
   3. **Consumabile**: uno tra due, scelto con probabilità uguale. Sono doni temporanei che si applicano
      all'acquisto e non occupano inventario né tasti nuovi. Base 8 monete.

      | Consumabile | Effetto | Durata |
      |---|---|---|
      | Olio da fabbro | `danno` somma +1 | 2 stanze di combattimento ripulite |
      | Pezzuola di lino | `t_invuln` somma +300 ms | 3 stanze di combattimento ripulite |

      Stesso consumabile acquistato due volte: la durata si rinnova, non si somma.
   - **Acquisto**: tasto interagisci davanti allo slot (`r_interagisci` 56 px). Se le monete ≥ prezzo:
     si scalano, l'oggetto è applicato nello stesso frame, lo slot si svuota (ombra d'inchiostro). Altrimenti:
     suono «a vuoto» e il prezzo lampeggia; nessun accodamento (come lo scatto a 0 cariche).
   - **Parlare con Tonino** è un altro punto di interazione al centro del banchetto, di `incontri-dialoghi.md`;
     questo documento non scrive battute.
   - **Chiavi: non introdotte.** Il progetto non ha porte serrate e il vincolo non è nel GDD stanze. Se
     `stanze-porte.md` introdurrà stanze chiuse, la chiave entra come quarto slot con base 6; fino ad allora è
     fuori da questo documento.
   - **Rimescolare lo slot dono: non introdotto.** Evita un tasto in più e uno scarico che premia lo
     spam.

6. **Fucina del Ricordo: interfaccia.** Il sistema `fucina-ricordo.md` (Vertical Slice) possiede l'elenco degli
   sblocchi; questo documento ne possiede il **costo** e il **ritmo**. Gli sblocchi sono ordinati in sequenza: il
   `k`-esimo acquisto (da 0) costa `costo_sblocco(k)` scintille, **qualunque cosa si compri**. Il giocatore
   sceglie l'ordine, non il prezzo; così un acquisto non può essere «il conveniente». Proposta di elenco (12
   sblocchi iniziali, a cura della Fucina):

   | Gruppo | Sblocchi | Effetto |
   |---|---|---|
   | Doni (4) | Filo spezzato, Rete di fili, Nastro di seta, Broccato | entrano nel pool dal loro `piano_min` |
   | Migliorie (8) | Scorta iniziale I e II | +10 monete a inizio notte, ciascuna |
   | | Sconto al banchetto I e II | −10% ciascuno, totale massimo `sconto_max` 30% |
   | | Maschera di riserva | `maschere_max` +1 |
   | | Scintilla in più | +1 scintilla da ogni boss |
   | | Finestre accese | `p_segreta` +0,15 |
   | | Piedistallo doppio anticipato | `piano_piedistallo_doppio` da 3 a 2 |

   Gli sblocchi **narrativi** della Fucina (nome e volto di Ferruccio, incudini, sciarpa) non costano scintille
   e non sono in questa tabella.

7. **Tabella faucet/sink.**

   | Risorsa | Rubinetto | Quantità attesa (formule 1-2) | Scarico | Quantità |
   |---|---|---|---|---|
   | Monete | nemici | 0,56 per nemico | dono al banchetto | 17-79 (tabella prezzi) |
   | | stanza ripulita | 2 | cuore al banchetto | 12-18 |
   | | stanza segreta | 0,5 × 10 = 5 per piano | consumabile al banchetto | 9-14 |
   | | boss | 8, 10, 12, 14, 16 | **morte**: tutte le monete in tasca | ~6-12% del reddito di una notte regolare (stima, da simulare) |
   | Scintille | boss | 3, 5, 7, 9, 11 | sblocchi alla Fucina | 4, 5, 6, 8, 10, 12, 15, 19, 24, 30, 37, 47 |
   | | stanza-ricordo | 2 × 0,5 = 1 per piano da 2 | | |
   | | residuo di notte | `floor(stanze / 4)` | | |
   | Cuori | stanze | `min(0,40; 0,08 m)` per stanza | danno subito | 1-2 maschere per colpo |
   | | boss | 1 se `m ≥ 1` | | |
   | | banchetto | prezzo 12-18 | | |

   **Anelli di retroazione.** *Positivo (monete)*: monete → doni → più potere → stanze più veloci → più monete;
   smorzato da prezzi che crescono del 15% per piano più in fretta del reddito, dal peso crescente dei preziosi
   (W prezioso +0,30 per piano) e dal tetto 99. *Positivo lento (scintille)*: scintille → sblocchi → più potere →
   più boss → più scintille; smorzato dalla curva dei costi `1,25^k`. *Negativo (cuori)*: meno maschere, più cuori
   in caduta. *Negativo (morte)*: il tributo della morte sulle monete evita che un'abbondanza si porti fuori
   dalla notte.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| Notte (monete) | inizio della notte, monete = `monete_iniziali` (0 + migliorie) | morte o fine | le monete salgono e scendono |
| Banchetto aperto | entro la stanza del banchetto | uscita dalla stanza | 3 slot visibili con prezzo |
| Slot acquistato | acquisto riuscito | fine del piano | ombra d'inchiostro, non interagibile |
| Fine notte | morte o vittoria | risveglio in Piazza Dante | monete = 0; scintille di residuo accreditate; scintille raccolte già nel profilo |
| Fucina | il giocatore compra uno sblocco | — | scintille −= `costo_sblocco(k)`, k += 1; atomico |

### Interactions with Other Systems

| Sistema | In ingresso | In uscita |
|---|---|---|
| Doni e modificatori | estrazione degli slot, prezzi per rarità | acquisto → dono attivo; `fallback_pool_vuoto` |
| Stanze e porte | numero e tipo di stanze, evento «stanza ripulita» | — |
| Generazione dei piani | seed, numero di banchetti (1 per piano), probabilità di stanza segreta e stanza-ricordo | — |
| Nemici e IA | morte di un nemico (evento), n. di nemici per stanza | drop di monete e cuori |
| Boss | evento «boss sconfitto», piano | monete, scintille, cuore, anima |
| Controllo di Ferruccio | maschere correnti e massime; raccolta passando sopra | cuore ripristina 1 maschera |
| Fucina del Ricordo | elenco sblocchi | `costo_sblocco(k)`, saldo scintille |
| Salvataggio e profilo | — | scintille, sblocchi acquistati, `ricordi_restituiti` (da doni) |
| Ricordi con scelta | — | stanza-ricordo e boss come canali delle scintille |
| HUD | — | monete (2 cifre, tetto 99), scintille, maschere, prezzi sotto gli slot |
| Stato narrativo | — | nessuno: l'economia non scrive né legge flag |

## Formulas

The `monete_attese_stanza` formula is defined as:

`E_stanza(p) = n_nem(p) × p_drop × v_medio + bonus_stanza`  con `v_medio = Σ q_k × v_k` e `n_nem(p) = 4 + p`

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| p | int | 1–5 | piano |
| n_nem(p) | float | 5–9 | nemici medi per stanza di combattimento (provvisorio, fino a `nemici.md` e `generazione-piani.md`) |
| p_drop | float | 0,2–0,6 | probabilità che un nemico lasci una moneta (0,40) |
| q_k, v_k | float, int | q: 0,9 e 0,1; v: 1 e 5 | quota e valore di moneta piccola e grande |
| v_medio | float | 1,0–2,0 | valore medio di una moneta caduta (1,4) |
| bonus_stanza | int | 0–4 | monete garantite alla chiusura della stanza (2) |
| E_stanza | float | 4,80–7,04 | monete attese per stanza di combattimento |

**Output Range:** da 4,80 (piano 1) a 7,04 (piano 5) con i valori di default. Il minimo reale di una stanza è
2 (nessun drop) e il massimo teorico `n_nem × 5 + 2` = 47 al piano 5 (ogni nemico lascia una moneta
grande), con probabilità trascurabile.
**Example:** piano 1: 5 × 0,40 × 1,4 + 2 = 2,80 + 2 = **4,80**; piano 3: 7 × 0,56 + 2 = **5,92**.

The `reddito_piano` formula is defined as:

`T(p) = ρ × N_comb × E_stanza(p) + p_segreta × monete_segreta + monete_boss(p)`  con `monete_boss(p) = 6 + 2p`

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| ρ | float | 0,6–1,0 | frazione delle stanze di combattimento effettivamente ripulite (0,85) |
| N_comb | int | 4–8 | stanze di combattimento per piano (6; 4 nell'MVP, piano di 8 stanze) |
| E_stanza(p) | float | 4,80–7,04 | formula precedente |
| p_segreta | float | 0–1 | probabilità di stanza segreta (0,5; 0 nell'MVP) |
| monete_segreta | int | 5–20 | cache della segreta (10) |
| monete_boss(p) | int | 8–16 | monete del boss |
| T(p) | float | 24–57 | reddito atteso del piano |

**Output Range:** T da 37,5 (piano 1) a 56,9 (piano 5) con N_comb 6; MVP (N_comb 4, ρ 1,0, p_segreta 0) =
4 × 4,80 + 8 = **27,2**, di cui 19,2 spendibili al banchetto (il boss cade dopo).
**Example:** piano 3: 0,85 × 6 × 5,92 + 0,5 × 10 + 12 = 30,19 + 5 + 12 = **47,19**. Tabella: T = 37,48 · 42,34 · 47,19 · 52,05 · 56,90.

The `prezzo` formula is defined as:

`prezzo = floor( (base × rar_pct × (100 + inc_pct × piano) × (100 − sconto_pct) + 500000) / 1000000 )`

(aritmetica intera; equivale a `base × rarità × (1 + 0,15 × piano) × (1 − sconto)` arrotondato a mezzo in su.)

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| base | int | 15 (dono) · 10 (cuore) · 8 (consumabile) | prezzo base |
| rar_pct | int | 100 · 180 · 300 | comune · raro · prezioso; cuore e consumabile 100 |
| inc_pct | int | 15 | incremento per piano |
| piano | int | 1–5 (fino a 8 con le espansioni) | piano corrente |
| sconto_pct | int | 0–30 | sconto delle migliorie (tetto `sconto_max`) |
| prezzo | int | 9–79 senza sconto | monete di luce |

**Output Range:** dono da 17 a 79; cuore da 12 a 18; consumabile da 9 a 14; con sconto 30% il minimo scende a 6
(consumabile piano 1). Sempre ≥ 1 e ≤ 79 < `tetto_monete`.
**Example:** tabella completa (senza sconto):

| Piano | Dono comune | Dono raro | Dono prezioso | Cuore | Consumabile |
|---|---|---|---|---|---|
| 1 | 17 | 31 | 52 | 12 | 9 |
| 2 | 20 | 35 | 59 | 13 | 10 |
| 3 | 22 | 39 | 65 | 15 | 12 |
| 4 | 24 | 43 | 72 | 16 | 13 |
| 5 | 26 | 47 | 79 | 18 | 14 |

Con sconto 10%: dono comune piano 1 = 15 × 100 × 115 × 90 = 15 525 000; + 500 000 = 16 025 000; / 1 000 000 → floor = **16**.

The `rapporto_reddito_carrello` formula (strumento di bilanciamento, non di codice) is defined as:

`R(p) = T(p) / K(p)`  con `K(p) = M(p) × 15 × (1 + 0,15 p) + 10 × (1 + 0,15 p) + 8 × (1 + 0,15 p)`  e  `M(p) = Σ W_r(p) × rar_r / Σ W_r(p)`

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| T(p) | float | 37,5–56,9 | reddito del piano |
| K(p) | float | 45,5–78,1 | costo atteso del carrello pieno (un dono pesato, un cuore, un consumabile), prezzi non arrotondati |
| M(p) | float | 1,44–1,776 | moltiplicatore medio di rarità al piano p (pesi `W_r(p)` di `doni-modificatori.md`) |
| R(p) | float | 0,70–0,85 (obiettivo) | quanta parte del carrello pieno il reddito di un piano compra |

**Output Range:** 0,823 · 0,797 · 0,773 · 0,750 · 0,728 per i piani 1-5, tutti dentro l'obiettivo
[0,70; 0,85]. Sotto 0,70 i banchetti sono quasi inutili; sopra 1,0 il giocatore compra tutto e la scelta sparisce.
R scende col piano per costruzione (preziosi più frequenti, prezzi +15%).
**Example:** piano 1: M = 1,44; K = 1,44 × 15 × 1,15 + 10 × 1,15 + 8 × 1,15 = 24,84 + 11,5 + 9,2 = 45,54; R = 37,48 / 45,54 = **0,823**.

The `p_cuore_stanza` formula is defined as:

`p_cuore = (m = 0) ? 0 : min(0,40; 0,08 × m)`  con `m = maschere_max − maschere`

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| m | int | 0–5 (fino a 8 − 1) | maschere mancanti |
| p_cuore | float | 0–0,40 | probabilità che alla chiusura di una stanza di combattimento cada un cuore |

**Output Range:** 0 (maschere piene) a 0,40 (5 mancanti o più).
**Example:** 5 maschere su 5: 0; 4 su 5 (m = 1): **0,08**; 2 su 5 (m = 3): **0,24**; 0 su 5 (m = 5): 0,40.

The `scintille_boss` and `scintille_notte` formulas are defined as:

`scintille_boss(p) = S0 + dS × (p − 1) + bonus_scintilla`  ·
`S_notte = Σ_{p: boss p sconfitto} scintille_boss(p) + n_ricordo × scintille_ricordo + floor(stanze_ripulite / stanze_per_scintilla)`

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| S0, dS | int | 3 e 2 | scintille del primo boss e incremento per piano |
| bonus_scintilla | int | 0–1 | miglioria «Scintilla in più» |
| n_ricordo | int | 0–4 | stanze-ricordo trovate in notte |
| scintille_ricordo | int | 1–4 | scintille per stanza-ricordo (2) |
| stanze_ripulite | int | 0–40 | stanze di combattimento ripulite nella notte |
| stanze_per_scintilla | int | 0 (spento), 2–8 | quante stanze valgono una scintilla (4) |
| scintille_boss | int | 3–12 | scintille di un boss |
| S_notte | int | 0–~60 | scintille di una notte |

**Output Range:** `scintille_boss` da 3 a 11 (12 con la miglioria). `S_notte` da 0 a ~50 in una notte che
supera i quattro piani con tutto (24 + 4 + 6 = 34 per una notte da 4 boss; 35 + 8 + 7 = 50 per i cinque boss).
**Example:** notte regolare (piani 1 e 2 con boss, piano 3 raggiunto, 3 stanze-ricordo attese 2, 12,75 stanze
ripulite): 3 + 5 + 2 × 1 + floor(12,75 / 4) = 8 + 2 + 3 = **13**.

The `costo_sblocco` formula is defined as:

`costo(k) = min(costo_max, floor(c0 × g^k + 0,5))`

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| k | int | 0–∞ | numero di sblocchi già acquistati nel profilo |
| c0 | int | 3–6 | costo del primo sblocco (4) |
| g | float | 1,15–1,35 | crescita per sblocco (1,25) |
| costo_max | int | 40–100 | tetto del costo (60) |
| costo(k) | int | c0–costo_max | scintille richieste |

**Output Range:** da 4 (k = 0) a 47 (k = 11); sopra k = 13 il tetto 60 si applica (`4 × 1,25^13` = 72). Costo
cumulato dei primi 12 sblocchi: **217**.
**Example:** k = 0…11 → 4, 5, 6, 8, 10, 12, 15, 19, 24, 30, 37, 47 (cumulato 4, 9, 15, 23, 33, 45, 60, 79, 103, 133, 170, 217).

The `notti_per_sblocco` formula (obiettivo di bilanciamento) is defined as:

`N(k) = (Σ_{j ≤ k} costo(j) − S_accumulate_prima) / E[S_notte | profilo]`

**Variables:**
| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| costo(j) | int | 4–47 | costo dello sblocco j |
| S_accumulate_prima | float | 0–… | scintille già accumulate dal profilo |
| E[S_notte \| profilo] | float | 2,05 (novizio) · 13 (regolare) · 34 (esperto) | scintille attese per notte per profilo |
| N(k) | float | 0,3–5 | notti attese per arrivare al k-esimo sblocco |

**Output Range:** obiettivo: sblocchi 0-5 a una media di 1-2 notti ciascuno, sblocchi 6-11 a 1,5-3 notti ciascuno.
**Example (calendario):** Profili: notti 1-4 novizio (boss 1 battuto 35% × 3 = 1,05; 4 stanze ripulite → 1; totale 2,05); notti 5-12
regolare (13); dalla 13 mix 50/50 regolare ed esperto (23,5). Scintille cumulate: notte 2 → 4,1; notte 4 → 8,2;
5 → 21,2; 6 → 34,2; 7 → 47,2; 8 → 60,2; 10 → 86,2; 12 → 112,2; 13 → 135,7; 15 → 182,7; 17 → 229,7.

| Sblocco k | Costo | Cumulato | Notte in cui è acquistabile | Notti dal precedente |
|---|---|---|---|---|
| 0 | 4 | 4 | 2 | 2 |
| 1 | 5 | 9 | 5 | 3 |
| 2 | 6 | 15 | 5 | 0 |
| 3 | 8 | 23 | 6 | 1 |
| 4 | 10 | 33 | 6 | 0 |
| 5 | 12 | 45 | 7 | 1 |
| 6 | 15 | 60 | 8 | 1 |
| 7 | 19 | 79 | 10 | 2 |
| 8 | 24 | 103 | 12 | 2 |
| 9 | 30 | 133 | 13 | 1 |
| 10 | 37 | 170 | 15 | 2 |
| 11 | 47 | 217 | 17 | 2 |

Sei sblocchi in sette notti all'inizio (media 1,2), i dodici in 17 notti (media 1,4). Con 20-40 minuti per notte sono
5-11 ore. Sensibilità: un giocatore che resta **novizio** (2,05 scintille a notte) ottiene i primi due sblocchi in 5 notti ma il
terzo in 8 e il quarto in 12: è il rischio principale; la leva è `stanze_per_scintilla` (2 invece di 4 porta il
residuo del novizio da 1 a 2 e le sue scintille per notte da 2,05 a 3,05).

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| Moneta raccolta a 99 monete | la moneta resta a terra; si può riprenderla dopo aver speso | niente spreco silenzioso (stessa regola del cuore a maschere piene) |
| Acquisto con monete = prezzo esatto | riuscito, monete a 0 | la soglia è `≥` |
| Acquisto con monete < prezzo | suono «a vuoto», il prezzo lampeggia, nessun buffer | coerente con lo scatto a 0 cariche |
| Acquisto del cuore a maschere piene | negato come a vuoto, monete invariate | non si paga uno spreco |
| Morte con monete in tasca | monete a 0 al risveglio; scintille e sblocchi invariati | pilastro 2 |
| Morte nella stanza subito dopo aver raccolto scintille | le scintille sono già nel profilo | credito immediato |
| Notte che finisce con 0 stanze ripulite | residuo 0, nessun errore | `floor(0/4)` |
| Boss sconfitto due volte nella stessa notte | impossibile: ogni piano ha un boss | un solo pagamento per piano |
| Monete del boss con il banchetto già visitato | spendibili solo al banchetto del piano successivo | l'anima cade a fine piano |
| Rientro nel banchetto | slot conservati: acquistati vuoti, gli altri uguali | niente rigenerazione per rimescolare |
| Due sconti di Fucina e sconto massimo | applicato fino a `sconto_max` 30%; oltre, ignorato | evita prezzi vicini a zero |
| Prezzo con sconto che darebbe 0 | il minimo è 1 | non si regala |
| Piano > 5 (espansioni, fino a 8) | le formule continuano; il prezzo prezioso a piano 8 = 15 × 300 × 220 = 99 → vale 99 | resta ≤ `tetto_monete` |
| Scintille del residuo con `stanze_per_scintilla` = 0 | rubinetto spento, nessuna divisione per zero | il knob può essere spento |
| Acquisto alla Fucina con scintille < costo | rifiutato, nessun debito | atomico |
| Doppio acquisto in due frame | ogni acquisto incrementa `k` prima del successivo | il costo cresce subito |
| Sblocco già acquistato | non ricomprabile; `k` conta solo gli acquistati | il profilo è l'unica verità |
| Slot del banchetto con pool dei doni vuoto | `fallback_pool_vuoto` (cuore o 10 monete) con prezzo di un comune | lo slot non è mai vuoto |
| Cuore dal boss a maschere piene | non cade (se `m = 0`) | come i cuori delle stanze |
| Consumabile durante la morte | scade con la notte | nessuna persistenza |
| Consumabile dello stesso tipo riacquistato | la durata si rinnova, non si somma | nessun accumulo |
| Monete a terra in una stanza dopo la morte | scompaiono con la notte | si ricostruisce da zero il caso |
| `ρ` > 1 o `N_comb` = 0 nei dati | rifiutato dal validatore | dati sani |
| Salto di un piano (se `generazione-piani.md` lo permetterà) | le monete del boss non pagate non sono pagate | un solo boss per piano pagato |

## Dependencies

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| Doni e modificatori | This depends on Doni | pool, rarità, slot del banchetto, consumabili; stessa formula di prezzo |
| Stanze e porte | This depends on Stanze | evento «stanza ripulita», tipo di stanza (combattimento, bottega, banchetto, segreta, ricordo, boss) |
| Generazione dei piani | This depends on Generazione | seed, numero di stanze per piano, `N_comb`, `p_segreta`, `p_ricordo` |
| Nemici e IA | This depends on Nemici | evento di morte, `n_nem(p)` provvisorio |
| Boss | This depends on Boss | evento di sconfitta, anima |
| Controllo di Ferruccio | This depends on Controllo | raccolta passando sopra, cuore come maschera, tasto interagisci |
| Fucina del Ricordo | Fucina depends on this | costo e ritmo degli sblocchi; saldo scintille |
| Salvataggio e profilo | Salvataggio depends on this | scintille e sblocchi persistenti |
| HUD | HUD depends on this | monete, scintille, maschere, prezzi |
| Ricordi con scelta | Ricordi depends on this | stanze-ricordo come rubinetto di scintille |
| Stato narrativo | nessuna | l'economia non legge né scrive flag |

## Tuning Knobs

Tutti i valori stanno in `contenuti/parametri/economia.json`; nessuno nel codice.

| Parameter | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|--------------|------------|-------------------|-------------------|
| `p_drop_moneta` | 0,40 | 0,25–0,55 | più monete, R più alto | banchetti vuoti |
| `v_medio` (quota moneta grande) | 1,4 (10% da 5) | 1,2–1,8 | più reddito, più varianza | meno varianza |
| `bonus_stanza` | 2 | 1–4 | reddito stabile | più dipendenza dai drop |
| `ρ` (stanze ripulite) | 0,85 | 0,6–1,0 | più reddito | notti più povere |
| `N_comb` | 6 (4 MVP) | 4–8 | più reddito | meno reddito |
| `monete_segreta` / `p_segreta` | 10 / 0,5 | 5–20 / 0,3–0,7 | premia l'esplorazione | meno incentivo |
| `monete_boss` (6 + 2p) | 8-16 | 4+1p … 8+3p | pagamento di fine piano | — |
| `tetto_monete` | 99 | 50–199 | risparmio | spesa forzata |
| `r_raccolta_moneta` | 24 px | 18–40 | più comodo | più pignolo |
| Prezzi base dono / cuore / consumabile | 15 / 10 / 8 | 10–25 / 6–15 / 5–12 | R scende | R sale |
| `rar_pct` raro / prezioso | 180 / 300 | 150–220 / 250–400 | rarità più costose | meno differenza |
| `inc_pct` per piano | 15 | 10–25 | R scende col piano | R più costante |
| `sconto_max` | 30% | 10–40 | prezzi più bassi | — |
| `p_cuore` (0,08 × m, tetto 0,40) | 0,08 / 0,40 | 0,04–0,12 / 0,25–0,50 | notti più lunghe | più punitivo |
| `scintille_boss` (S0, dS) | 3, 2 | S0 2–5, dS 1–3 | sblocchi più rapidi | più lenti |
| `scintille_ricordo`, `p_ricordo` | 2, 0,5 | 1–4, 0,3–1,0 | più scintille dai ricordi | meno |
| `stanze_per_scintilla` | 4 | 0 (spento), 2–8 | meno scintille di consolazione | più (ma 0 = spento) |
| `c0`, `g`, `costo_max` | 4, 1,25, 60 | 3–6, 1,15–1,35, 40–100 | sblocchi più lenti | più rapidi |
| Prezzo e effetti dei consumabili | tabella regola 5 | base 5–12; durata 1–4 stanze | più forti | più deboli |

## Acceptance Criteria

- [ ] **GIVEN** 10 000 stanze simulate al piano 1 con 5 nemici, `p_drop` 0,40, 10% di monete grandi e bonus 2, **WHEN** si calcola la media delle monete per stanza, **THEN** vale 4,80 ± 0,10.
- [ ] **GIVEN** il piano 3 con N_comb 6, ρ 0,85, p_segreta 0,5, **WHEN** si calcola `T(3)`, **THEN** vale 47,19 ± 0,05.
- [ ] **GIVEN** i prezzi senza sconto, **WHEN** si calcolano, **THEN** il dono comune costa 17/20/22/24/26, il raro 31/35/39/43/47, il prezioso 52/59/65/72/79, il cuore 12/13/15/16/18, il consumabile 9/10/12/13/14 ai piani 1-5.
- [ ] **GIVEN** uno sconto del 10%, **WHEN** si calcola un dono comune al piano 1, **THEN** costa 16.
- [ ] **GIVEN** 17 monete e un dono comune a 17 al piano 1, **WHEN** si preme interagisci sullo slot, **THEN** le monete diventano 0 e il dono è attivo nello stesso frame; con 16 monete non succede nulla tranne il suono «a vuoto».
- [ ] **GIVEN** 99 monete e una moneta a terra, **WHEN** Ferruccio ci passa sopra, **THEN** le monete restano 99 e la moneta resta a terra.
- [ ] **GIVEN** 5/5 maschere, **WHEN** si prova a comprare il cuore o a raccoglierne uno, **THEN** le monete e la vita restano invariate.
- [ ] **GIVEN** 34 monete e 3 scintille raccolte nel profilo, **WHEN** Ferruccio muore, **THEN** al risveglio le monete sono 0 e le scintille sono ancora 3.
- [ ] **GIVEN** il boss del piano 3, **WHEN** è sconfitto, **THEN** il profilo guadagna 7 scintille e le monete salgono di 12; con la miglioria «Scintilla in più» le scintille sono 8.
- [ ] **GIVEN** una notte con 11 stanze di combattimento ripulite, **WHEN** finisce, **THEN** il residuo è floor(11 / 4) = 2 scintille; con `stanze_per_scintilla` = 0 il residuo è 0 senza errore.
- [ ] **GIVEN** 4 maschere su 5 (m = 1) e 2 su 5 (m = 3), **WHEN** si calcola `p_cuore`, **THEN** vale 0,08 e 0,24; a 5/5 vale 0. Su 10 000 stanze con m = 3, i cuori caduti sono 2400 ± 130.
- [ ] **GIVEN** `k` = 0, 1, 2, 11, **WHEN** si calcola `costo_sblocco`, **THEN** vale 4, 5, 6, 47; con 4 scintille il primo acquisto riesce, con 3 no; subito dopo `k` vale 1 e il successivo costa 5.
- [ ] **GIVEN** `k` = 20, **WHEN** si calcola `costo_sblocco`, **THEN** vale 60 (tetto).
- [ ] **GIVEN** il calendario di profili (notti 1-4 novizio 2,05, notti 5-12 regolare 13, poi mix 23,5), **WHEN** si simulano 10 000 profili, **THEN** la mediana del primo sblocco è la notte 2 (± 1), la mediana del sesto sblocco è la notte 7 (± 1), e la media di notti tra gli sblocchi 0-5 è compresa tra 1 e 2.
- [ ] **GIVEN** i piani 1-5 e i prezzi correnti, **WHEN** si calcola `R(p)`, **THEN** è 0,82 · 0,80 · 0,77 · 0,75 · 0,73 (± 0,01) e sempre compreso tra 0,70 e 0,85.
- [ ] **GIVEN** 10 000 notti simulate per profilo regolare, **WHEN** si misura la quota di monete perse alla morte sul reddito totale, **THEN** la mediana è compresa tra 5% e 25% (la stima a mano è 6-12%).
- [ ] **GIVEN** il banchetto del piano 2, **WHEN** si esce dalla stanza dopo aver comprato il dono e si rientra, **THEN** lo slot dono è vuoto e il cuore e il consumabile sono uguali a prima.
- [ ] Prestazioni: il calcolo dei drop e dei prezzi costa meno di 0,05 ms per evento; nessun calcolo avviene per frame.
- [ ] Nessun valore numerico di questo documento è nel codice: tutto in `contenuti/parametri/economia.json`.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| Il **residuo di notte** (scintille per stanze ripulite) è un terzo rubinetto non previsto dalla richiesta («boss e stanze-ricordo»): è necessario perché le prime notti, che finiscono prima del boss, non siano a zero. Spegnibile con `stanze_per_scintilla` = 0; ma allora il ritmo di sblocco dei novizi sale a 1 per ~6 notti | game-designer | prima del prototipo | — |
| `n_nem(p)` = 4 + p, `N_comb` = 6 e `ρ` = 0,85 sono segnaposto finché non esistono `nemici.md` e `generazione-piani.md`; il reddito va rifatto con i loro numeri. Nell'MVP (piano di 8 stanze, 4 di combattimento, nessuna segreta) il banchetto del piano 1 compra al massimo un comune da 17 | game-designer / level-designer | GDD nemici e generazione | — |
| Elenco, nomi e ordine degli sblocchi della Fucina: qui solo costo e ritmo, con 12 sblocchi proposti | systems-designer / game-designer | `fucina-ricordo.md` | — |
| Il banchetto e Tonino: se Tonino è sotto il Velo o no nelle notti dopo `tonino_ricordo`, e se i prezzi cambiano con i flag, lo decide `incontri-dialoghi.md`; qui il prezzo non dipende dai flag | narrative-director | GDD incontri | — |
| Chiavi e stanze chiuse: non introdotte | level-designer | `stanze-porte.md` | — |
| I consumabili (Olio da fabbro, Pezzuola di lino) sono placeholder di sistema, non oggetti della trama; nomi e numeri da validare in prova | game-designer | prototipo | — |
| La quota di monete perse alla morte (6-12% a mano) è sotto l'intenzione di «fa male senza punire» solo se la notte finisce subito dopo un acquisto: va misurata con la simulazione, non con la stima | qa-lead | simulazione | — |
