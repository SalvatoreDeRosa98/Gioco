# Controllo di Ferruccio

> **Status**: Draft
> **Author**: game-designer (sessione autonoma; `creative-director`, `systems-designer`, `qa-lead`, `art-director` non consultati — Solo mode. Rivedere a mano prima della produzione)
> **Last Updated**: 2026-11-07
> **Last Verified**: 2026-11-07
> **Implements Pillar**: 1 Leggibile al buio · 4 Fatto di ombra e luce

## Summary

Come Ferruccio si muove dentro una stanza vista dall'alto: otto direzioni, un balzo laterale (lo
"scatto") che lo rende intoccabile per un istante, e cinque maschere di vita. È la base su cui si
appoggiano il combattimento e tutti i doni che modificano il corpo.

> **Quick reference** — Layer: `Core` · Priority: `MVP` · Key deps: `Input, Fisica e collisioni`

## Overview

Ferruccio è una sagoma bianca in una stanza di 13×7 celle vista dall'alto, come in *The Binding of
Isaac*. Si muove in otto direzioni alla stessa velocità, si ferma quasi all'istante, e con un tasto
compie uno scatto breve che attraversa nemici e proiettili senza subire danno. Ha cinque maschere di
Pulcinella come vita; quando ne perde una lampeggia ed è invulnerabile per meno di un secondo. Non
salta: il gioco non ha mai piattaforme (anti-pilastro). Tutto il resto, il fendente, la parata,
l'affondo, è nel GDD `combattimento.md`; qui c'è solo il corpo.

## Player Fantasy

Essere piccolo, leggero e preciso dentro stanze grandi e scure. Lo scatto è la capriola di un
Pulcinella: deve sembrare una furbizia, non una magia. Il giocatore deve sentire che ogni colpo
subito era evitabile.

## Detailed Design

### Core Rules

1. **Spazio**: la stanza standard è una griglia di 13×7 celle da 64 px (832×448 px di area
   calpestabile) dentro una cornice di mura spesse una cella. Le coordinate del mondo sono in pixel
   di gioco; la camera inquadra la stanza intera (GDD `camera-stanza.md`).
2. **Movimento**: input in otto direzioni (tastiera WASD/frecce, levetta sinistra). La velocità è la
   stessa in diagonale (vettore normalizzato). L'accelerazione è quasi istantanea: da fermo alla
   velocità piena in `t_accel`, da piena a fermo in `t_decel`.
3. **Corpo**: Ferruccio collide con le mura e gli ostacoli come un cerchio di raggio `r_corpo`
   centrato ai piedi della sagoma. L'ombra portata a terra segna il punto esatto di collisione
   (pilastro 1: la sagoma è alta, il corpo è ai piedi).
4. **Scatto**: alla pressione del tasto scatto, se ha almeno una carica, Ferruccio percorre
   `d_scatto` nella direzione di movimento (o verso cui guarda, se fermo) in `t_scatto`, è
   **invulnerabile** per tutta la durata, attraversa nemici e proiettili ma non mura né ostacoli
   (si ferma contro), poi ha `t_recupero_scatto` in cui non può scattare di nuovo né attaccare. Le
   cariche si ricaricano una alla volta ogni `t_ricarica_scatto`. Di base ha 1 carica.
5. **Vita**: `maschere_max` maschere (5 di base). Un contatto con un nemico comune toglie 1
   maschera; attacchi segnati come pesanti ne tolgono 2. Dopo un danno Ferruccio è invulnerabile per
   `t_invuln` e lampeggia; durante l'invulnerabilità non subisce né danno né spinta.
6. **Spinta**: al contatto Ferruccio è spinto via dal nemico con velocità iniziale `v_spinta` che
   decade a zero in `t_spinta`; durante la spinta l'input di movimento è ridotto al 30%.
7. **Morte**: a 0 maschere la notte finisce: la sagoma cade, dissolvenza, risveglio in Piazza Dante
   (GDD `ciclo-di-gioco.md`). Nessuna rianimazione nell'MVP.
8. **Orientamento**: la sagoma guarda nella direzione dell'ultimo input orizzontale (destra o
   sinistra: è un cutout, ha solo due facce). Mirare in verticale non ruota il corpo; il fendente
   decide da solo (GDD `combattimento.md`).
9. **Raccolta**: monete, scintille e cuori (maschere) si raccolgono passandoci sopra; i doni si
   raccolgono con il tasto interagisci davanti al piedistallo (GDD `doni-modificatori.md`).

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| Fermo | nessun input di direzione | input di direzione / scatto / attacco / danno | respiro della sagoma |
| Cammina | input di direzione | input nullo / scatto / attacco / danno | passo a due gambe; velocità `v_base × mod` |
| Scatta | tasto scatto con carica ≥ 1 | fine di `t_scatto` o urto con muro | invulnerabile; attraversa nemici; scia bianca |
| Recupero scatto | fine di Scatta | fine di `t_recupero_scatto` | può camminare; non scatta né attacca |
| Colpito | danno subito e non invulnerabile | fine di `t_invuln` | lampeggia; spinto; può agire dopo `t_spinta` |
| Morto | maschere = 0 | fine dissolvenza | nessun input; passa al risveglio |

Priorità in caso di input simultanei: danno > scatto > attacco > movimento. Lo scatto può
interrompere Cammina, Fermo e il recupero di un fendente (vedi combattimento); non può interrompere
Colpito durante `t_spinta`.

### Interactions with Other Systems

| Sistema | Dati in ingresso | Dati in uscita |
|---|---|---|
| Input | vettore direzione, pressione scatto/interagisci | — |
| Fisica e collisioni | risoluzione contro mura/ostacoli | posizione, raggio del corpo |
| Combattimento | se Ferruccio può attaccare (non in Scatta/Colpito) | stato, orientamento, posizione |
| Doni e modificatori | moltiplicatori su `v_base`, `d_scatto`, `cariche_scatto`, `maschere_max`, `t_invuln` | — |
| HUD | — | maschere correnti e massime, cariche di scatto |
| Nemici e IA | — | posizione e stato (per il bersaglio) |

## Formulas

The `velocita_effettiva` formula is defined as:

`velocita_effettiva = v_base × Π(mod_velocita_i)`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| v_base | float | 180–260 px/s | data file | velocità di base (220) |
| mod_velocita_i | float | 0,7–1,5 ciascuno | calculated (doni) | moltiplicatori dei doni attivi |

**Output Range:** 150 to 330 px/s; sotto 150 e sopra 330 si blocca (clamp) per leggibilità.
**Example:** 220 × 1,15 (Scarpette di Bianca) × 0,9 (Martello di Gaetano) = 227,7 px/s.

The `distanza_scatto` formula is defined as:

`distanza_scatto = d_scatto × Π(mod_scatto_i)` con `invulnerabilita_scatto = t_scatto` (costante, non modificabile dai doni nell'MVP)

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| d_scatto | float | 140–220 px | data file | distanza di base (180) |
| mod_scatto_i | float | 0,8–1,4 | calculated (doni) | moltiplicatori dei doni |
| t_scatto | int | 140–200 ms | data file | durata (160) |

**Output Range:** 112 to 308 px.
**Example:** 180 × 1,25 (Sciarpa rossa) = 225 px in 160 ms, cioè un attraversamento netto di 3,5 celle.

The `danno_subito` formula is defined as:

`danno_subito = invulnerabile ? 0 : min(danno_colpo, maschere)`

con `danno_colpo` 1 (comune) o 2 (pesante), ridotto di 1 (minimo 1) se è attivo un dono di
armatura. Le maschere sono intere: non esistono mezze maschere nell'MVP.

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| Scatto verso un muro a 20 px | Ferruccio si ferma contro il muro; resta invulnerabile fino alla fine di `t_scatto` | la durata dell'invulnerabilità deve essere prevedibile, non dipendere dalla geometria |
| Scatto con 0 cariche | nessun effetto, nessun buffer; un suono secco "a vuoto" | niente input accodati che partono quando non li vuoi |
| Due nemici lo toccano nello stesso istante | un solo danno (il primo risolto), poi invulnerabilità | pilastro 1: un errore, un danno |
| Danno mentre è in Scatta | ignorato | lo scatto è invulnerabile per definizione |
| Danno a 1 maschera da un attacco pesante | muore (min(2,1) = 1) | nessuna sopravvivenza a 0 |
| Input diagonale su muro | scivola lungo il muro alla componente libera | movimento fluido lungo le pareti |
| Spinta contro un muro | la spinta si annulla al contatto, nessun incastro | evitare che la spinta spinga dentro la geometria |
| Raccolta di un cuore a maschere piene | il cuore resta a terra | niente spreco silenzioso |
| Mod velocità che porta sotto 150 px/s | clamp a 150 | sotto quella soglia le stanze diventano ingiuste |
| Morte e scatto premuti nello stesso frame | morte | il danno ha priorità |

## Dependencies

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| Input | This depends on Input | vettore di movimento e pressioni |
| Fisica e collisioni | This depends on Fisica | risoluzione delle collisioni con mura e ostacoli |
| Combattimento | Combattimento depends on this | stato (può attaccare?), orientamento, posizione |
| Doni e modificatori | Doni depends on this | statistiche nominate da modificare |
| Nemici e IA | Nemici depends on this | posizione del bersaglio, contatto |
| HUD | HUD depends on this | maschere, cariche |
| Ciclo di gioco | Ciclo depends on this | evento di morte |

## Tuning Knobs

| Parameter | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|--------------|------------|-------------------|-------------------|
| v_base | 220 px/s | 180–260 | stanze più facili, meno lettura | lento, frustrante |
| t_accel | 60 ms | 0–120 | più "simulazione" | più arcade |
| t_decel | 50 ms | 0–120 | scivola | si pianta |
| r_corpo | 14 px | 10–18 | più colpito | può passare in fessure |
| d_scatto | 180 px | 140–220 | attraversa più stanze | meno utile |
| t_scatto | 160 ms | 140–200 | più invulnerabilità | scatto nervoso |
| t_recupero_scatto | 120 ms | 60–250 | scatto più impegnativo | spam di scatti |
| t_ricarica_scatto | 1200 ms | 800–2000 | scatto prezioso | scatto gratis |
| cariche_scatto | 1 | 1–3 | — | — |
| maschere_max | 5 | 3–8 | run più lunghe | più punitivo |
| t_invuln | 800 ms | 500–1200 | più perdonante | catene di danno |
| v_spinta | 260 px/s | 150–400 | più caos | contatto piatto |
| t_spinta | 150 ms | 80–300 | — | — |

## Game Feel

### Feel Reference
Il movimento di *Isaac* (istantaneo, otto direzioni) con lo scatto di *Hades* (breve, nettissimo,
invulnerabile, con scia). NON deve sentirsi come un twin-stick con inerzia (*Enter the Gungeon* ha
la capriola, non quella: troppo lunga).

### Input Responsiveness
| Action | Max Input-to-Response Latency (ms) | Frame Budget (at 60fps) | Notes |
|--------|-----------------------------------|------------------------|-------|
| Movimento | 33 | 2 | la sagoma parte entro il frame successivo |
| Scatto | 33 | 2 | la scia appare nello stesso frame del movimento |

### Animation Feel Targets
| Animation | Startup Frames | Active Frames | Recovery Frames | Feel Goal | Notes |
|-----------|---------------|--------------|----------------|-----------|-------|
| Scatto | 0 | 10 (160 ms) | 7 (120 ms) | netto, furbo | la sagoma si inclina di 20° nella direzione |
| Colpito | 0 | 9 (150 ms spinta) | — | leggibile, mai confuso | lampeggio 6 Hz per 800 ms |

### Impact Moments
| Impact Type | Duration (ms) | Effect Description | Configurable? |
|-------------|--------------|-------------------|---------------|
| Hit-stop al danno subito | 90 | tutto si ferma, la sagoma si schiaccia | Yes |
| Scossa al danno subito | 160 | 5 px, direzionale, decadente | Yes |
| Scia dello scatto | 160 | tre copie bianche in dissolvenza | Yes |

### Weight and Responsiveness Profile
- **Peso**: leggero; Ferruccio è un ritaglio di carta che corre.
- **Controllo**: alto; si corregge in ogni momento tranne nei 160 ms di scatto.
- **Snap**: binario; parte e si ferma, non scivola.
- **Accelerazione**: arcade, 60 ms di smussatura solo per non far "saltare" la sagoma.
- **Fallimento**: sempre leggibile: il nemico ha telegrafato, lo scatto era disponibile (l'HUD lo mostra).

### Feel Acceptance Criteria
- [ ] Nessun tester usa "scivoloso" o "lento" nelle prime tre sessioni.
- [ ] Lo scatto viene usato per attraversare un nemico entro i primi cinque minuti senza spiegazione.
- [ ] Il danno subito è sempre attribuito dal tester a un nemico preciso.

## Acceptance Criteria

- [ ] **GIVEN** Ferruccio fermo, **WHEN** si tiene la diagonale alto-destra per 1 s, **THEN** si sposta di 220 ± 5 px lungo la diagonale (velocità normalizzata).
- [ ] **GIVEN** una carica di scatto, **WHEN** si preme scatto verso destra in spazio libero, **THEN** la posizione avanza di 180 ± 4 px in 160 ± 16 ms e il contatto con un nemico in quel tratto non toglie maschere.
- [ ] **GIVEN** 0 cariche, **WHEN** si preme scatto, **THEN** la posizione non cambia e non viene accodato alcuno scatto.
- [ ] **GIVEN** 5 maschere, **WHEN** un gatto tocca Ferruccio, **THEN** le maschere diventano 4, Ferruccio è spinto nella direzione opposta al gatto, e per 800 ms un secondo contatto non toglie maschere.
- [ ] **GIVEN** 1 maschera, **WHEN** subisce un attacco pesante, **THEN** le maschere sono 0 e parte la sequenza di morte entro 200 ms.
- [ ] **GIVEN** un dono con mod_velocita 0,5, **WHEN** si muove, **THEN** la velocità è 150 px/s (clamp), non 110.
- [ ] **GIVEN** uno scatto verso un muro a 20 px, **WHEN** urta, **THEN** si ferma al muro e resta invulnerabile fino a 160 ms dall'inizio.
- [ ] Prestazioni: l'aggiornamento del controllo costa meno di 0,2 ms per frame.
- [ ] Nessun valore numerico di questo documento è scritto nel codice: tutto in `contenuti/parametri/ferruccio.json`.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| Lo scatto base esiste senza sciarpa? La decisione dell'autore del 10/10 lega lo scatto alla sciarpa di Agnese (capitolo IV). In un roguelike lo scatto è un verbo di base: proposta = scatto base sempre disponibile, la sciarpa (dono narrativo) aggiunge una carica e allunga la scia | autore | prima del prototipo | — |
| Mezze maschere (come i mezzi cuori di Isaac)? | game-designer | dopo il prototipo | no nell'MVP |
