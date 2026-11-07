# Nemici e IA

> **Status**: In Design
> **Author**: game-designer (sessione autonoma; `creative-director`, `systems-designer`, `ai-programmer`, `qa-lead`, `art-director` non consultati — Solo mode. Rivedere a mano prima della produzione)
> **Last Updated**: 2026-11-07
> **Last Verified**: 2026-11-07
> **Implements Pillar**: 1 Leggibile al buio · 4 Fatto di ombra e luce (anche 3 Il bottino ha un volto, tramite l'anima che si stacca alla morte)

## Summary

Chi abita le stanze: quattro archetipi dell'MVP (gatto d'ombra, vespa dorata, statua animata,
guardia del Velo), cinque varianti per i piani successivi, il concetto di élite, e le regole comuni
che li rendono leggibili: ogni attacco ha tre tempi (anticipo, lampo, colpo), ogni nemico è fatto di
3-6 pezzi snodati, e nessun nemico richiede fotogrammi. Il GDD fissa vita, velocità, tempi in
millisecondi, comportamento a stati, regole di separazione, scalatura per piano e il budget di
minaccia che la generazione dei piani userà per riempire le stanze.

> **Quick reference** — Layer: `Feature` · Priority: `MVP` (4 archetipi) / `Alpha` (varianti, élite) · Key deps: `Combattimento, Stanze e porte`

## Overview

Ogni nemico è una sagoma nera con un'ellisse d'appoggio a terra che coincide con la sua hitbox.
Ha uno stato che il giocatore può leggere da lontano: pattuglia, insegue, e quando sta per colpire
cambia **area o asse** (anticipo), accende un **buco di luce rossa** (lampo) e poi colpisce (colpo).
Il lampo è il segnale della parata: premere il tasto parata durante il lampo, secondo la finestra di
180 ms del GDD `combattimento.md`, annulla il danno, stordisce il nemico per 600 ms e apre il
controcolpo. Gli attacchi che non si parano (rossi pieni, col segno a terra a graticcio) si evitano
a piedi o con lo scatto. La vita dei nemici è dimensionata sul dps di riferimento del combattimento
(≈ 4,7 vita/s): una vespa muore in una combo, un gatto in due, un pesante in tre,
un élite in quattro o più. Le stanze si riempiono spendendo un **budget di minaccia** per piano,
con un direttore degli attacchi che impedisce a più nemici di colpire insieme (gettoni e distanza
minima tra gli impatti). Alla morte ogni nemico si scioglie in puntini azzurri che salgono e lascia
monete di luce, raramente un cuore.

## Player Fantasy

Leggere il buio. Il giocatore deve sentire che ogni colpo subito era annunciato: la sagoma si
accorcia, la luce rossa si accende, il tratteggio compare a terra, e lui poteva pararlo, scattarlo
o semplicemente non essere lì. Il piacere è quello di una stanza che sembra un caos e invece è una
coreografia a turni: un nemico alla volta, e tu che decidi il tempo. Estetiche: Challenge (1),
Discovery (3, imparare i pattern), Sensation (5, il clang della parata). SDT: Competenza, con
feedback sempre attribuibile a un nemico preciso.

## Detailed Design

### Core Rules

#### 1. Il telegrafo in tre tempi (valido per ogni nemico e ogni boss)

Ogni attacco che può togliere maschere ha, nell'ordine fisso, tre tempi (art bible §3, «Il telegrafo
come forma»):

| Tempo | Sigla | Cosa si vede | Cosa significa |
|---|---|---|---|
| **Anticipo** | `t_ant` | La sagoma cambia area o asse (si accuccia, si alza, il braccio sale a 90°). Il segno a terra dell'imparabile compare già qui | Annuncia. Non c'è parata possibile |
| **Lampo** | `t_lamp` | Un buco di luce rossa nella sagoma (occhi, crepe, bordo della lama) con un anello che si chiude e un nucleo crema | Apre la finestra di parata: la pressione valida cade nella seconda parte del lampo (vedi sotto) |
| **Colpo** | `t_imp` | La sagoma raggiunge l'estensione massima, l'ombra si allunga nella direzione dell'attacco, la hitbox è attiva per `t_imp` | La «finestra di impatto»: durante questi ms l'attacco può ferire; il danno si applica al primo contatto |

Dopo il colpo c'è il **Recupero** `t_rec` (sagoma esposta, punibile) e un **cooldown** `t_cd`
prima del prossimo attacco dello stesso nemico.

**Finestra di parata e istante d'impatto.** Sia `I` l'istante in cui l'attacco colpirebbe
Ferruccio (inizio del colpo per il corpo a corpo; per i proiettili l'istante di arrivo
`I = t_emissione + distanza / velocità`). Dal GDD `combattimento.md` la parata è attiva da
`p + 40 ms` a `p + 220 ms` dopo la pressione `p`: l'attacco è parato se `I ∈ [p+40, p+220]`, cioè
se `p ∈ [I−220, I−40]` (180 ms di larghezza). Con `I` a `t_lamp` dall'inizio del lampo, la
pressione valida cade tra `t_lamp − 220` e `t_lamp − 40` ms dopo l'inizio del lampo. Il lampo non
«contiene» tutta la finestra: la apre per chi reagisce subito e la chiude per chi aspetta troppo.

**Regole del telegrafo** (verificate da un test sui dati, vedi Acceptance Criteria):

| # | Regola | Valore | Perché |
|---|---|---|---|
| R1 | I tre tempi sono sempre nell'ordine anticipo → lampo → colpo, non si saltano e non si accorciano per sorpresa | — | Pilastro 1 |
| R2 | `t_lamp` minimo | 280 ms (parabili), 350 ms (imparabili) | Un tempo di reazione di 240 ms lascia ancora 40 ms di pressione valida; per lo scatto servono 160 ms di i-frame in più |
| R3 | `t_lamp` non scala mai con piano, élite o fase del boss | costante | La lettura non accelera mai: scalano i movimenti, non il lampo |
| R4 | `t_ant` minimo | 300 ms; 250 ms solo per il secondo attacco di una catena il cui primo anticipo era ≥ 480 ms | Il giocatore deve poter vedere il cambio di sagoma |
| R5 | Blocco di direzione: nei parabili la direzione è fissata all'inizio del lampo; negli imparabili all'inizio dell'anticipo | — | Gli imparabili si evitano a piedi: serve più tempo |
| R6 | **Evitabilità a piedi.** Per ogni attacco imparabile: `t_uscita_peggiore ≤ t_ant + t_lamp − t_reazione − margine`, con `t_reazione` = 250 ms e `margine` = 150 ms | vedi Formulas | Lo scatto potrebbe non esserci (vedi Open Questions): nessun attacco deve richiederlo |
| R7 | Un nemico non inizia un attacco mentre è in Anticipo, Lampo, Colpo o Stordito di un altro | — | Un solo attacco per nemico |
| R8 | Le azioni che non fanno danno (evocare, segnale) usano il lampo **crema, senza anello e senza rosso** | — | Il rosso significa solo pericolo (art bible, Principio B) |

**Parabile contro imparabile, su tre canali.** Il colore non basta (pilastro 1: chi gioca in
bianco e nero deve distinguerli):

| Canale | Parabile | Imparabile |
|---|---|---|
| Lampo | rosso con anello che si chiude, lampeggia a 8 Hz, nucleo crema | rosso pieno fisso, senza anello, senza lampeggio |
| Segno a terra (forma) | tratteggio a righe parallele, bordo aperto | graticcio (righe incrociate) con bordo continuo chiuso |
| Segno a terra (tempo) | compare all'inizio del lampo | compare all'inizio dell'anticipo e resta |

La forma del graticcio e del bordo continuo è una proposta di questo GDD: va confermata con
l'art-director (art bible §3 parla solo di «tratteggi di inchiostro»).

#### 2. Danno, contatto e spinta

1. Danno: **1** (comune) o **2** (pesante) maschere, come in `controllo-ferruccio.md`. Sono pesanti
   il colpo a cuneo della statua, il fendente largo del cavaliere di pietra e i colpi dei boss
   segnati «2».
2. **Il contatto passivo non fa danno.** Un nemico toglie maschere solo con la hitbox del Colpo
   (balzo, picchiata, affondo, cuneo, proiettile). In Pattuglia, Insegue, Recupero, Stordito e
   Morto il corpo è solido ma innocuo; in Insegue il nemico si ferma a
   `r_nemico + r_corpo + 6 px` da Ferruccio e non lo tocca camminando. Questa è una decisione di
   questo GDD, più restrittiva della regola 5 di `controllo-ferruccio.md` («un contatto con un
   nemico comune toglie 1 maschera»): da riportare là (vedi Open Questions).
3. Spinta a Ferruccio: quella di `controllo-ferruccio.md` (`v_spinta`) nella direzione opposta al
   nemico, solo se il colpo è andato a segno.
4. Spinta ai nemici: `spinta_effettiva = spinta_f × fattore_peso(peso)`, con `fattore_peso` =
   1,25 (peso 0), 1,0 (peso 1), 0,6 (peso 2), 0 (peso ≥ 3, regola di `combattimento.md`).

#### 3. Panoramica degli archetipi

| Archetipo | Famiglia | Classe | Piani | Costo | Vita base | Pezzi |
|---|---|---|---|---|---|---|
| Gatto d'ombra | ombra libera | comune | 1-5 | 2 | 6 | 5 |
| Vespa dorata | ombra libera | leggero | 1-5 | 2 | 3 | 4 |
| Statua animata | rigido del Velo | pesante | 1-5 (da profondità 3 nel piano 1) | 4 | 9 | 6 |
| Guardia del Velo | rigido del Velo | pesante | 1-5 | 3 | 8 | 5 |
| Gatto grande | ombra libera | pesante | 2-5 | 5 | 12 | 6 |
| Vespa regina minore | ombra libera | pesante | 3-5 | 8 | 12 | 5 |
| Lanterniere | rigido del Velo | comune | 2-5 | 3 | 6 | 4 |
| Cavaliere di pietra | rigido del Velo | pesante | 4-5 | 7 | 14 | 6 |
| Guardia scudata | rigido del Velo | pesante | 3-5 | 4 | 10 | 6 |

Classi: **leggero** = muore in 1 combo, **comune** = 2 combo, **pesante** = 3-4 combo, **élite** = 4 o più.
(`combattimento.md` dice «comune 1-2 combo, élite 3-4»: qui statua e guardia sono pesanti perché
una parata riuscita ne toglie 4 vita in 480 ms; vedi tabella dei tempi nelle Formulas.)
Famiglie: le **ombre libere** hanno forme spezzate e asimmetriche, **i rigidi del Velo** linee
rette, simmetria e rotazioni a scatti di 15° (art bible §3: «la linea storta è umana, la linea
perfetta è del Velo»).

#### 4. Schede degli archetipi dell'MVP

##### 4.1 Gatto d'ombra

| Parametro | Valore |
|---|---|
| Vita base (piani 1-5) | 6 → 6 / 7 / 8 / 10 / 11 (Formulas F1) |
| Raggio hitbox `r` | 16 px · altezza 1,0 U · peso 1 · danno 1 |
| Raggio di allerta `r_aggro` / di perdita `r_lose` | 260 px / 400 px |
| Velocità | Pattuglia 70 px/s · Insegue 150 px/s (con tetto, F2) |
| Attacco | **Balzo**, parabile, danno 1 |
| Condizione d'attacco | distanza ∈ [100, 230] px, percorso libero da ostacoli alti, gettone ottenuto |
| Telegrafo (ms) | anticipo **480** · lampo **320** · colpo `t_imp` **200** |
| Recupero · cooldown | 700 ms · 1500 ms |
| Pressione valida (dopo l'inizio del lampo) | da 100 a 280 ms |
| Distanza del balzo | `d_balzo = clamp(d_lampo + 24, 100, 170)` px, d_lampo = distanza al momento dell'inizio del lampo |
| Hitbox del colpo | capsula larga 32 px (2r) lungo il percorso, attiva per 200 ms |
| Segno a terra | striscia tratteggiata aperta, 32 px × `d_balzo`, fissata all'inizio del lampo; l'ombra del gatto si accorcia nell'anticipo e si allunga nel balzo |
| Parata | Stordito 600 ms |
| Costo · monete · cuore | 2 · 1-2 monete · 2% (4% a maschere non piene, F9) |

**Stanza tutorial** (solo la prima stanza del piano 1, un gatto): anticipo 600, lampo 400, cooldown 2500.
Pressione valida da 180 a 360 ms dopo il lampo: il giocatore può parare reagendo (criterio di feel
di `combattimento.md`: parata riuscita entro i primi tre gatti, solo dal lampo rosso).

**Pezzi snodati (5)**: corpo, testa (con le orecchie), coda a due segmenti, zampe posteriori.

| Pezzo | Riposo / Pattuglia | Anticipo | Colpo | Stordito |
|---|---|---|---|---|
| Corpo | ellisse bassa e lunga, oscilla ±8° | si abbassa del 30% (altezza da 1,0 a 0,7 U), si accorcia | si allunga (scala X 1,25) e ruota nella direzione del balzo | inclinato di 12°, fermo |
| Testa | segue Ferruccio, ±20° | scende di 15°, le orecchie si appiattiscono (scala Y 0,5) | in asse col balzo | penzola a −30° |
| Coda, segmento 1 | ondeggia ±25° a 1,5 Hz | si irrigidisce a 0° (fissa, puntata in alto di 10°) | stesa all'indietro | cade a −35° |
| Coda, segmento 2 | ondeggia ±40° | rigido come il segmento 1 | stesa all'indietro | cade a −50° |
| Zampe posteriori | camminano | si piegano (scala Y da 1,0 a 0,6): il posteriore sale | stese | molli |

**Occhi**: fessure di carta chiara; nel lampo si allargano a occhi rossi con anello.

**Comportamento specifico.**
- *Pattuglia*: percorre 2-3 punti della propria zona di nascita (scelti dal seme della stanza) a
  70 px/s, con pause di 600-1200 ms.
- *Insegue*: gira attorno a Ferruccio sull'**anello d'attesa** (raggio 170 ± 20 px, velocità
  angolare massima 45°/s, verso alternato per gatto) finché non ottiene il gettone; poi entra in
  Anticipo da una distanza utile. Non si avvicina mai a meno di 100 px senza gettone.
- *Il gatto non cambia direzione durante il balzo*: Ferruccio lo evita spostandosi di 30 px di
  lato (16 + 14 px, 136 ms) entro il lampo.

##### 4.2 Vespa dorata

| Parametro | Valore |
|---|---|
| Vita base (piani 1-5) | 3 → 3 / 4 / 4 / 5 / 5 |
| Raggio hitbox `r` | 12 px · altezza 0,8 U in volo · quota 28 px · peso 0 · danno 1 |
| `r_aggro` / `r_lose` | 320 px / 480 px |
| Velocità | Pattuglia 90 px/s · Insegue 170 px/s (tetto 187 px/s al piano 5) |
| Volo | ondeggia: ampiezza 26 px, 0,7 Hz, perpendicolare alla direzione; **sorvola gli ostacoli** (non i muri della stanza) |
| Attacco | **Picchiata**, parabile, danno 1 |
| Condizione d'attacco | distanza ∈ [120, 300] px, gettone ottenuto (non serve linea libera: sorvola) |
| Telegrafo (ms) | anticipo **450** · lampo **300** · colpo `t_imp` **260** |
| Recupero · cooldown | 900 ms (per i primi 500 ms è a terra, quota 0) · 1800 ms |
| Pressione valida | da 80 a 260 ms dopo l'inizio del lampo |
| Distanza della picchiata | 220 px fissi verso il punto fissato all'inizio del lampo |
| Hitbox del colpo | capsula larga 24 px lungo i 220 px, attiva per 260 ms |
| Segno a terra | l'ombra sotto di lei si restringe al 60% nell'anticipo; nel lampo compare il tratteggio aperto largo 24 px lungo 220 px |
| Parata | Stordito 600 ms: precipita (quota 0), ali ripiegate |
| Costo · monete · cuore | 2 · 1-2 monete · 2% (4%) |

**Pezzi snodati (4)**: corpo, addome, ali (2, ciascuna al 45% di opacità).

| Pezzo | Riposo | Anticipo | Colpo | Stordito |
|---|---|---|---|---|
| Corpo | orizzontale, ondeggia | si inclina di 40° con la testa in giù | quasi orizzontale, sul percorso | ruotato di 70° su un lato |
| Addome | pulsa ±15° | si piega di 35° verso il basso: il pungiglione punta | allineato al corpo | molle |
| Ali (2) | vibrano (scala Y 1,0 ↔ 0,2, 20 Hz) | diventano **una riga** (scala Y 0,1, 28 Hz) | riga | ripiegate |

**Lampo**: le due strisce chiare (tagli di carta #f2c278, non oro) lampeggiano rosse con anello.

**Comportamento specifico.** Insegue con ondeggio; non usa l'anello d'attesa ma una **quota di
attesa** a 200-260 px da Ferruccio. Al massimo 2 vespe in Anticipo contemporaneamente (dentro il
limite dei gettoni). Dopo la picchiata atterra: i primi 500 ms del Recupero la vespa è a terra,
con il corpo ben centrato sull'ellisse, ed è il momento di punirla.

##### 4.3 Statua animata

| Parametro | Valore |
|---|---|
| Vita base (piani 1-5) | 9 → 9 / 11 / 13 / 14 / 16 |
| Raggio hitbox `r` | 22 px · altezza 2,6 U · peso 3 (mai spinta) |
| `r_aggro` | 360 px (con linea di vista) |
| Velocità | 0: non si sposta. Ruota il torso e la testa a scatti di 15° a 90°/s |
| Attacchi | **A. Colpo a cuneo** (pesante, imparabile) · **B. Proiettile luminoso** (parabile) |
| Scelta | A se `d ≤ 120 px`; B se `120 < d ≤ 480 px` con linea libera; altrimenti resta in Insegue (ruota) |
| Recupero · cooldown | A 1000 ms · B 800 ms · cooldown 2200 ms |
| Costo · monete · cuore | 4 · 2-3 monete · 4% (8%) |
| Collocazione | massimo 2 per stanza, distanza minima tra due statue 192 px (3 celle) |

| Attacco | Anticipo / Lampo / Colpo (ms) | Danno | Parabile | Geometria |
|---|---|---|---|---|
| A. Colpo a cuneo | **550** / **350** / 160 | 2 | no | settore di 70°, raggio 120 px, direzione fissata all'**inizio dell'anticipo** (R5) |
| B. Proiettile luminoso | **450** / **300** / emissione istantanea | 1 | sì | sfera r 8 px, 280 px/s, gittata 560 px, mira fissata all'inizio del lampo, senza anticipo sul movimento |

**Segno a terra**: per A, il cuneo a graticcio con bordo continuo dall'inizio dell'anticipo (art
bible: «cuneo tratteggiato nella direzione del colpo»); per B, un cuneo stretto (12°, 200 px)
tratteggiato aperto dall'inizio del lampo. **Riflesso**: la sfera parata torna indietro a
380 px/s con danno 2 (`danno_riflesso`); la statua entra in Stordito 600 ms al momento della
parata (come ogni attaccante, `combattimento.md` regola 5). Pressione valida per B: `p ∈ [I−220, I−40]`,
con `I` l'istante di arrivo della sfera, che si vede muovere.

**Evitabilità a piedi di A** (R6): `120 × sin(35°) + 14 (corpo) = 82,8 px`, a 220 px/s sono 376 ms,
contro un massimo di `550 + 350 − 250 − 150 = 500 ms`: uscire di lato basta. Da fermi dentro il
cuneo a 30 px dalla statua, l'uscita laterale è ancora di 17 + 14 = 31 px (141 ms).

**Pezzi snodati (6)**: piedistallo (fisso), torso, testa, braccio sinistro, braccio destro, scettro
(solidale al braccio destro).

| Pezzo | Riposo | Anticipo | Colpo | Stordito |
|---|---|---|---|---|
| Piedistallo | fermo (ellisse d'appoggio) | **trema** ±2 px a 18 Hz | fermo | fermo, crepa di luce |
| Torso | a scatti di 15° verso il bersaglio | trema ±2 px | scatta in avanti di 15° | sfasato di 15° |
| Testa | a scatti di 15° | trema | in asse | piegata di 30° |
| Braccio destro + scettro | lungo il fianco | per A **sale a 90°**; per B lo scettro punta il bersaglio | per A cala di 90° in 160 ms (scatto), l'ombra si allunga; per B la sfera parte dalla punta dello scettro | cade a 40° |
| Braccio sinistro | lungo il fianco | alzato di 20° | abbassato | molle |

**Lampo**: crepe di luce rossa sul torso e sulla testa, con anello.

##### 4.4 Guardia del Velo

| Parametro | Valore |
|---|---|
| Vita base (piani 1-5) | 8 → 8 / 10 / 11 / 13 / 14 |
| Raggio hitbox `r` | 18 px · altezza 2,4 U · peso 2 · danno 1 |
| `r_aggro` / `r_lose` | 340 px / 520 px |
| Velocità | Pattuglia 60 px/s (marcia lungo un percorso) · Insegue 100 px/s (avanza in linea retta) |
| Rotazione | 120°/s a scatti di 15° |
| Attacco | **Affondo lungo**, parabile, danno 1 |
| Condizione d'attacco | distanza ≤ 170 px, allineata entro ±20° a Ferruccio, gettone ottenuto |
| Telegrafo (ms) | anticipo **500** · lampo **300** · colpo `t_imp` **140** |
| Recupero · cooldown | 900 ms (arma tesa nei primi 400 ms, poi si ritrae) · 1600 ms |
| Pressione valida | da 80 a 260 ms dopo l'inizio del lampo |
| Hitbox del colpo | rettangolo 150 px × 24 px dalla punta del corpo, attivo 140 ms |
| Segno a terra | **linea tratteggiata lunga quanto l'affondo (150 px)**, bordo aperto, fissata all'inizio del lampo |
| Parata | Stordito 600 ms: l'arma cade a terra |
| Costo · monete · cuore | 3 · 2-3 monete · 3% (6%) |

**Pezzi snodati (5)**: busto, testa col copricapo, gamba sinistra, gamba destra, arma lunga.

| Pezzo | Riposo | Anticipo | Colpo | Stordito |
|---|---|---|---|---|
| Busto | dritto, simmetrico | si inclina indietro di 10° e si allunga (scala X 1,15) | inclinato in avanti di 12° | inclinato di 20° |
| Testa col copricapo | fissa, a scatti di 15° | invariata | invariata | abbassata |
| Gambe (2) | marciano a scatti | piantate, divaricate | avanzano di 18 px | piegate |
| Arma lunga | in diagonale (45° in alto) | **scende all'orizzontale** (ruota di 45°) | scorre in avanti di 150 px | cade a terra (ruota di 70°) |

**Lampo**: il bordo della lama diventa una linea di luce rossa con anello alla punta.
**Evitabilità**: una linea di 24 px si evita con 26 px di spostamento laterale (118 ms): ampiamente
dentro il lampo.

#### 5. Varianti per i piani successivi

| Parametro | Gatto grande | Vespa regina minore | Lanterniere | Cavaliere di pietra | Guardia scudata |
|---|---|---|---|---|---|
| Piani | 2-5 | 3-5 | 2-5 | 4-5 | 3-5 |
| Famiglia · classe | ombra libera · pesante | ombra libera · pesante | rigido · comune | rigido · pesante | rigido · pesante |
| Vita base | 12 | 12 | 6 | 14 | 10 |
| Vita per piano | 14 / 17 / 19 / 22 (p. 2-5) | 17 / 19 / 22 (p. 3-5) | 7 / 8 / 10 / 11 (p. 2-5) | 22 / 25 (p. 4-5) | 14 / 16 / 18 (p. 3-5) |
| `r` · altezza · peso | 24 px · 1,6 U · 2 | 18 px · 1,1 U · 1 | 16 px · 2,0 U · 1 | 24 px · 3,0 U · 4 | 20 px · 2,4 U · 2 |
| Velocità (patt./insegue) | 90 / 130 | 80 / 110 (mantiene 240-320 px) | 60 / 120 (mantiene 260-340 px) | 0 / 80 | 50 / 90 |
| Attacchi | Doppio balzo | Picchiata regale · Evoca | Lancio di lanterna · Segnale | Fendente largo · Spinta di scudo | Affondo corto |
| Anticipo / Lampo / Colpo (ms) | 1° balzo 520/320/220, 2° 260/280/220 | picchiata 500/300/280; evoca 600/300/— | lancio 500/300/—; segnale 600/300/— | fendente 600/350/160; spinta 450/300/160 | 450/300/140 |
| Recupero · cooldown (ms) | 1000 · 1800 | 1000 · 1800 (evoca 6000) | 800 · 2600 (segnale 8000) | fendente 1100, spinta 800 · 2000 | 800 · 1600 |
| Danno · parabile | 1 per balzo · sì | picchiata 1 sì · evoca no danno | lancio 1 sì · segnale no danno | fendente **2, imparabile** · spinta 1 sì | 1 · sì |
| Costo | 5 | 8 | 3 | 7 | 4 |
| Élite ammessa | sì | no | sì | no | sì |
| Pezzi | 6: corpo, testa, coda ×2, zampe posteriori, zampe anteriori | 5: corpo, addome, ali ×2, corona | 4: busto, testa col cappello, braccio con palo, lanterna | 6: torso, testa con elmo, braccio-spada, braccio-scudo, gamba ×2 | 6: busto, testa, gamba ×2, braccio-scudo, arma corta |

**Gatto grande.** Come il gatto, ma doppio balzo: il secondo parte 150 ms dopo il primo, con il
proprio anticipo (260 ms, ammesso da R4 perché il primo era 520) e il proprio lampo (280 ms). La
direzione del secondo balzo si fissa all'inizio del *suo* lampo. Distanza dei balzi 170 px.
Il colpo del secondo balzo è un attacco a parte: parabile da solo.

**Vespa regina minore.** Tiene le distanze (240-320 px). *Evoca*: anticipo con le ali spalancate,
lampo crema, nasce da 1 a 2 vespe dorate a vita dimezzata (arrotondata per eccesso) con
`tetto_evocate_stanza` = 3 vive; non evoca se il tetto è pieno. Le evocate non lasciano bottino, non
contano nel budget, e si dissolvono quando la regina muore (priorità di bersaglio premiata). La
*picchiata regale* è la picchiata della vespa con 260 px di distanza.

**Lanterniere.** *Lancio di lanterna*: proiettile a 240 px/s, r 10 px, gittata 480 px, parabile,
riflesso con danno 2. *Segnale*: alza la lanterna, lampo crema; per 4000 ms gli alleati (non altri
lanternieri) entro 200 px ottengono **allerta**: cooldown di attacco −30%, velocità +10%, non
cumulabile; gli alleati in allerta mostrano un secondo anello sull'ellisse d'appoggio. Fugge (sotto-stato di Insegue) se
Ferruccio è entro 100 px. Ogni lanterniere è una luce della stanza (limite di 8 luci,
`game-concept.md`): massimo 1 per stanza.

**Cavaliere di pietra.** Una statua che cammina a scatti di 15°. *Fendente largo*: settore di 160°,
raggio 110 px, direzione fissata all'inizio dell'anticipo, segno a graticcio. Evitabilità: uscita
dalla linea radiale di 110 − 30 + 14 = 94 px in 427 ms contro un massimo di
`600 + 350 − 250 − 150 = 550 ms`. *Spinta di scudo* (a distanza ≤ 70 px): rettangolo 60 × 50 px,
danno 1, spinge Ferruccio, parabile. Sceglie la spinta se `d ≤ 70`, il fendente se `d ≤ 110`.

**Guardia scudata.** Scudo frontale su un arco di 120° (±60° dalla direzione in cui guarda): i
fendenti da quell'arco fanno 0 danno e un rimbalzo di 40 px di spinta a Ferruccio (lampo bianco
sullo scudo). L'**affondo caricato** ignora lo scudo (intransitività: scudo batte fendente,
affondo batte scudo, parata batte tutto). Il suo scudo ruota a 90°/s verso Ferruccio, mentre
Ferruccio che gira a 70 px di raggio ha una velocità angolare di ~180°/s: aggirarla è possibile.
Mentre attacca (Anticipo, Lampo, Colpo, Recupero) lo scudo è abbassato e il fendente la colpisce.
*Affondo corto*: 110 px × 24 px, segno a terra lungo 110 px.

#### 6. Élite

1. **Dove**: stanze di tipo «élite» (budget `m_stanza` 1,25, un solo élite per stanza) dal piano
   `elite_piano_min` = 2.
2. **Vita ×2** (sul valore già scalato per piano), **peso +1**, scala della sagoma ×1,15, **un pezzo
   in più** (pennacchio) e un **cartiglio con il nome** sopra la testa. Il nome è
   `epiteto + archetipo`, gli epiteti sono nel data file e li scrive il writer; nell'MVP il
   segnaposto è il solo nome dell'archetipo in maiuscoletto, senza battute.
3. **Un pattern in più** (i tempi del telegrafo non cambiano, R3):

| Archetipo | Pattern aggiunto |
|---|---|
| Gatto d'ombra | Doppio balzo (come il gatto grande) |
| Vespa dorata | Doppia picchiata (la seconda 300/300/260, direzione rifissata nel suo lampo) |
| Statua animata | Proiettile a ventaglio: 3 sfere a 25° una dall'altra (a 200 px sono 87 px di distanza, solo una può colpire) |
| Guardia del Velo | Doppio affondo (secondo 300/300/140) |
| Gatto grande, Lanterniere, Guardia scudata | un secondo attacco dalla propria scheda, ripetuto in catena con anticipo ridotto del 40% (minimo R4) |

4. **Costo** = `round(2,5 × costo base)`. **Bottino**: monete ×2, cuore al 20% fisso (regola F9).
5. L'élite non è immune a spinta o stordimento: la parata funziona (600 ms), il controcolpo vale.

#### 7. Nascita e rimozione

- **Preavviso**: 400 ms prima, sul punto di nascita compare l'ellisse d'appoggio scura.
- **Emersione**: 700 ms (la sagoma sale dall'ellisse, scala Y da 0 a 1). Durante l'emersione il
  nemico non attacca, non subisce danno e non ha hitbox contro Ferruccio.
- **Dove nascono**: sui punti marcati nel modello di stanza, fuori da blocchi solidi (decisione
  dell'autore: il primo gatto nasce fuori dal blocco solido); a ≥ 220 px da Ferruccio e ≥ 64 px
  l'uno dall'altro. I volanti nascono sui punti dei pezzi a terra o su fasce libere.
- **Ondate**: se `B ≥ 10` la stanza ha due ondate (60% e 40% del budget); la seconda nasce quando
  restano ≤ 1 nemici o dopo 12 s dalla prima.
- Le porte si aprono quando i nemici vivi sono 0 (la dissoluzione in corso non conta).

#### 8. Direttore degli attacchi e separazione

Un **direttore** per stanza (e per il boss, GDD `boss.md`) decide chi può iniziare un attacco.

1. **Gettoni di attacco.** Un nemico può entrare in Anticipo solo se ottiene un gettone; lo tiene
   da inizio Anticipo a fine Colpo e lo rilascia all'inizio del Recupero. Gettoni per piano:
   **1** (piano 1), **2** (piani 2-3), **3** (piani 4-5).
2. **Distanza minima tra gli impatti.** Quando un nemico chiede il gettone, il direttore calcola
   il suo `I` (F4) e lo nega se esiste un altro impatto programmato `I_j` con
   `|I − I_j| < 350 ms` (`gap_impatti_min`). Il motivo: una parata riuscita ha 180 ms di
   finestra, due impatti a 200-350 ms non si possono parare entrambi e sarebbero ingiusti. Due
   impatti nello stesso istante ±100 ms sono ammessi solo per lo stesso attacco a più proiettili.
3. **Imparabili contemporanei**: al massimo 1 programmato (piani 1-3), 2 (piani 4-5).
4. **Riprova e invecchiamento**: chi viene negato riprova ogni 100 ms; dopo 3000 ms senza
   gettone passa in testa alla coda.
5. **Separazione fisica (steering).** Ogni nemico a terra ha raggio di separazione
   `r_i + r_j + 12 px`; i corpi si respingono con forza proporzionale alla sovrapposizione; i pesanti
   (peso ≥ 3) non vengono spostati dai leggeri. I volanti si separano solo dagli altri volanti
   (44 px centro-centro) e non collidono con i nemici a terra.
6. **Anello d'attesa.** Chi non ha il gettone si dispone sull'anello (170 ± 20 px) a angoli
   equidistanti, riassegnati ogni 500 ms, velocità angolare massima 45°/s. I rigidi del Velo non
   usano l'anello: avanzano fino alla distanza utile e aspettano.
7. **Percorsi**: griglia a 64 px con campo di flusso verso Ferruccio, aggiornato ogni 250 ms; i volanti
   ignorano gli ostacoli ma non i muri.
8. **Casualità**: ogni scelta casuale (punti di pattuglia, versi dell'anello, monete) usa il seme
   della stanza; a parità di seme e input il nemico fa le stesse cose.

#### 9. Morte, dissoluzione e bottino

1. A `vita ≤ 0` il nemico entra in **Morto**: perde subito la hitbox, il gettone e il posto nel
   conteggio dei vivi; hit-stop `hs_uccisione` (110 ms, `combattimento.md`).
2. **Dissoluzione in anima azzurra** (700 ms): ogni pezzo snodato si stacca, perde i bordi, diventa
   un **puntino azzurro** (4 px) che sale di 48 px dissolvendosi. N pezzi = N puntini (gatto 5,
   vespa 4, statua 6, guardia 5). L'ellisse d'appoggio sparisce per ultima. Non è la goccia azzurra
   con il profilo di un oggetto, che è riservata ai ricordi (`art-bible.md`, Principio B).
3. **Bottino**: a 350 ms dall'inizio della dissoluzione le monete compaiono sul punto di morte,
   lanciate di 40 px in una direzione scelta col seme. Il cuore (raro) compare a 700 ms. I proventi sono
   dati di `economia.md`: qui i valori iniziali.
4. **Monete**: `ceil(costo/2)` o `ceil(costo/2) + 1` (uniforme). Élite ×2.
5. **Cuore**: formula F9.

#### 10. Budget di minaccia della stanza

La generazione dei piani (`generazione-piani.md`) chiede a questo sistema la composizione di una
stanza dati piano `n`, tipo di stanza e seme.

1. Ogni archetipo ha un **costo** intero (F6). Il **budget** della stanza è `B(n, tipo)` (F7).
2. La composizione sceglie a caso, col seme, pescando in base ai **pesi di piano**
   (tabella sotto) tra gli archetipi con `costo ≤ budget residuo`, fino a `budget residuo ≤ 1`.
   Somma dei costi ∈ [B − 1, B].
3. **Vincoli**: (a) almeno 2 archetipi diversi se `B ≥ 6` (eccetto la stanza tutorial); (b) al massimo
   8 nemici vivi, 4 volanti, 2 statue, 1 lanterniere, 1 regina minore, 1 élite; (c) il lanterniere
   solo se c'è almeno un altro nemico; (d) al massimo 2 attacchi imparabili sulla stessa stanza
   (statue e cavalieri); (e) nessun nemico fuori dai suoi piani.

| Archetipo | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| Gatto d'ombra | 5 | 4 | 3 | 2 | 2 |
| Vespa dorata | 3 | 3 | 3 | 3 | 3 |
| Statua animata | 2 | 3 | 3 | 3 | 3 |
| Guardia del Velo | 3 | 3 | 3 | 3 | 3 |
| Gatto grande | 0 | 3 | 3 | 3 | 3 |
| Lanterniere | 0 | 2 | 3 | 3 | 3 |
| Vespa regina minore | 0 | 0 | 2 | 3 | 3 |
| Guardia scudata | 0 | 0 | 3 | 3 | 3 |
| Cavaliere di pietra | 0 | 0 | 0 | 2 | 3 |

Nel piano 1 le prime tre stanze usano un solo archetipo alla volta (gatto, poi guardia o vespa
in incontri separati: decisione dell'autore su Piazza Dante); la statua entra dalla profondità 3.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| Emersione | fine del preavviso | fine di 700 ms | sale dall'ellisse; invulnerabile, innocuo |
| Pattuglia | fine emersione | vedi transizioni | si muove tra i punti (gatto, vespa, guardia) o ruota ferma (statua) |
| Insegue | Ferruccio in `r_aggro`, ferito, o allarme | Anticipo / Pattuglia | avvicina, o gira sull'anello d'attesa, o mantiene la distanza |
| Anticipo (fase A, poi fase L = lampo) | condizioni d'attacco soddisfatte e gettone ottenuto | fine di `t_ant + t_lamp` | cambio di sagoma; poi lampo; impegnato: non si annulla |
| Attacca | fine del lampo | fine di `t_imp` o parata | hitbox attiva; danno al primo contatto |
| Recupero | fine di Attacca | fine di `t_rec` | sagoma esposta; innocuo; il gettone è già rilasciato |
| Stordito | parata riuscita durante Attacca | fine di 600 ms | fermo, innocuo, sagoma sfasata; subisce il controcolpo ×2 |
| Morto | `vita ≤ 0` in qualunque stato | fine della dissoluzione (700 ms) | senza hitbox, senza gettone, dissoluzione in puntini |

| Da | A | Condizione |
|---|---|---|
| Emersione | Pattuglia | fine di 700 ms |
| Pattuglia | Insegue | Ferruccio entro `r_aggro` con linea di vista (le statue: anche senza muoversi) **oppure** nemico ferito **oppure** allarme di stanza (4000 ms dopo la chiusura delle porte: nessuno resta a pattugliare) |
| Insegue | Pattuglia | Ferruccio oltre `r_lose` per 3000 ms e nessun allarme di stanza |
| Insegue | Anticipo | cooldown scaduto ∧ distanza nella banda d'attacco ∧ percorso/linea libera dove richiesto ∧ gettone ∧ nessun impatto entro 350 ms (direttore) |
| Anticipo A | Anticipo L | fine di `t_ant` |
| Anticipo L | Attacca | fine di `t_lamp` |
| Attacca | Recupero | fine di `t_imp` (colpo andato a segno o a vuoto) |
| Attacca | Stordito | parata riuscita (`I` dentro la finestra) |
| Recupero | Insegue | fine di `t_rec` |
| Stordito | Insegue | fine di 600 ms (cooldown ricomincia da 0) |
| qualunque tranne Morto | Morto | `vita ≤ 0` |

L'Anticipo **non si interrompe** quando Ferruccio si sposta, scatta o si fa male: l'attacco è
un impegno dichiarato (leggibilità, pilastro 1). Se Ferruccio muore o la stanza si resetta,
tutti i nemici vanno in stato neutro.

### Interactions with Other Systems

| Sistema | Dati in ingresso | Dati in uscita |
|---|---|---|
| Combattimento | danno, spinta, stato di parata, controcolpo, `t_stordito`, ganci | hitbox (capsula, rettangolo, settore, sfera), flag `imparabile`, `vita`, `peso`, `danno` |
| Controllo di Ferruccio | posizione, raggio, stato (invulnerabile?), `v_base` per i tetti di velocità | danno inflitto, spinta |
| Stanze e porte | punti di nascita, ostacoli, muri | numero di nemici vivi, evento «stanza pulita» |
| Generazione dei piani | piano `n`, tipo di stanza, seme | composizione di stanza (elenco di archetipi, posizioni) |
| Boss | — | scheda degli archetipi, gettoni e direttore riusati; le evocazioni sono nemici di questo GDD (vita scalata) |
| Economia | tabelle di drop dei valori iniziali | monete, cuori, eventi di morte |
| Rendering | pezzi snodati, forme del telegrafo, puntini | sagome, ellisse d'appoggio, segno a terra |
| Doni e modificatori | — | ganci `su_uccisione` all'evento di morte |
| HUD | — | cartiglio dell'élite |

## Formulas

**F1. Vita per piano**

`vita(n) = max(1, round(vita_base × (1 + k_vita × (n − 1))))`

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| vita_base | int | 3–14 | data file | vita al piano 1 (o equivalente) |
| n | int | 1–5 | calculated | piano |
| k_vita | float | 0,10–0,30 | data file | 0,20 |

**Output Range:** 3 to 25 (non élite). **Example:** gatto 6 → n=1: 6; n=2: 7,2→7; n=3: 8,4→8; n=4: 9,6→10; n=5: 10,8→11. Élite: `vita × 2` (gatto élite al piano 2 = 14).

**F2. Velocità per piano, con tetto**

`v(n) = min(v_cap, v_base × (1 + k_vel × (n − 1)))` con `v_cap = 0,85 × v_base_Ferruccio = 187 px/s`

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| v_base | float | 50–180 px/s | data file | velocità di Pattuglia o Insegue |
| k_vel | float | 0–0,08 | data file | 0,04 |
| v_cap | float | 150–200 px/s | calculated | 85% della velocità di Ferruccio (220) |

**Output Range:** 50 to 187 px/s. **Example:** vespa che insegue, piano 5: 170 × 1,16 = 197,2 → tetto 187 px/s. Il tetto vale per
la camminata e il volo di inseguimento, mai per le raffiche degli attacchi (balzo, picchiata, affondo),
che sono telegrafate. Ferruccio (220 px/s) può sempre fuggire.

**F3. Anticipo per piano**

`t_ant(n) = max(t_ant_min, round(t_ant_base × (1 − k_tel × (n − 1))))`, con `t_lamp(n) = t_lamp_base` (R3) e `t_ant_min` = 300

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| t_ant_base | int | 300–650 ms | data file | anticipo al piano 1 |
| k_tel | float | 0–0,08 | data file | 0,04 |

**Output Range:** 300 to 650 ms. **Example:** gatto piano 5: 480 × 0,84 = 403 ms; lampo resta 320.

**F4. Istante d'impatto e pressione valida di parata**

`I_corpo = t_inizio_attacco + t_ant + t_lamp` · `I_proiettile = t_emissione + d / v_proiettile` · `parata_ok = p ∈ [I − 220, I − 40]`

**Output Range:** booleano. **Example:** gatto d'ombra, I = T: p ∈ [T−220, T−40]. Premuta a T−100 → parato; a T−300 → colpito; a T−20 → colpito. In coordinate del lampo, a 320 ms da I: pressione valida da 100 a 280 ms dopo l'inizio del lampo.

**F5. Evitabilità a piedi (R6)**

`t_uscita_peggiore = d_uscita_peggiore / v_base_Ferruccio ≤ t_ant + t_lamp − 250 − 150`

| Attacco | `d_uscita_peggiore` | `t_uscita` | Massimo | Esito |
|---|---|---|---|---|
| Cuneo della statua (R 120, 70°) | 120·sin 35° + 14 = 82,8 px | 376 ms | 500 ms | ok |
| Fendente largo del cavaliere (R 110, 160°) | 110 − 30 + 14 = 94 px | 427 ms | 550 ms | ok |

(Ogni imparabile dei boss è verificato in `boss.md`.)

**F6. Costo di minaccia di un archetipo**

`costo = max(1, round(k_costo × (vita_base / dps_rif) × m_danno × m_mob))`

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| k_costo | float | 1,0–2,0 | data file | 1,5 |
| dps_rif | float | 4,0–5,0 | `combattimento.md` | 4,7 vita/s |
| m_danno | float | 1,0 / 1,5 | data file | 1,5 se ha un attacco da danno 2 o imparabile |
| m_mob | float | 1,0–2,0 | data file | mobilità e portata: gatto 1,0 · vespa 2,0 (volo, sorvola) · statua 1,0 · guardia 1,2 · gatto grande 1,3 · regina 2,0 · lanterniere 1,5 · cavaliere 1,0 · scudata 1,4 |

**Output Range:** 1–13. **Example:** gatto = round(1,5 × 1,277 × 1 × 1,0) = 2; statua = round(1,5 × 1,915 × 1,5 × 1,0) = 4,31 → 4; guardia = round(1,5 × 1,702 × 1 × 1,2) = 3,06 → 3; cavaliere = round(1,5 × 2,979 × 1,5 × 1,0) = 6,7 → 7. Élite: `round(2,5 × costo)`: gatto 5, guardia 8 (7,5 arrotondato per eccesso).

**F7. Budget della stanza**

`B(n, tipo) = round(B_0 × (1 + k_b × (n − 1)) × m_stanza)` con `B_0` = 8, `k_b` = 0,15 (= `k_P`, crescita della potenza attesa), `m_stanza`: normale 1,0 · imboscata 1,25 · élite 1,25 (con un élite) · ingresso e tesoro 0

**Output Range:** 0–16. **Example (stanza normale):** n=1: 8; n=2: 9; n=3: 10; n=4: 12; n=5: 13.
Esempi di composizione: n=1, B=8: gatto + gatto + vespa + vespa (2+2+2+2); n=5, B=13: cavaliere (7) + guardia scudata (4) + vespa (2).

**F8. Tempo per uccidere e tempo stanza**

`T_netto = vita / (dps_rif × P(n))` · `T_reale = T_netto / u_stanza` · `T_stanza = Σ T_reale + t_overhead` · `P(n) = 1 + k_P × (n − 1)` (potenza attesa dei doni, da `doni-modificatori.md`, valore provvisorio) · `u_stanza` = 0,30 (frazione del tempo in cui Ferruccio sta davvero colpendo, tra inseguire, aspettare il lampo e riposizionarsi) · `t_overhead` = 5 s (preavviso, emersione, raccolta)

Tempi di riferimento, piano 1, `P = 1`, dps nominale 4,7 vita/s (con l'arrotondamento per difetto di `danno_colpo`, il terzo fendente base vale 1 e il dps effettivo è ≈ 4,05: vedi Open Questions):

| Nemico | Vita | T_netto (s) | Fendenti da 1 per ucciderlo | Fendenti dopo una parata (4 danni nei primi 480 ms) | T_reale a u=0,30 (s) |
|---|---|---|---|---|---|
| Vespa | 3 | 0,64 | 3 | 0 (muore nello stordimento) | 2,1 |
| Gatto | 6 | 1,28 | 6 | 2 | 4,3 |
| Lanterniere | 6 | 1,28 | 6 | 2 | 4,3 |
| Guardia | 8 | 1,70 | 8 | 4 | 5,7 |
| Statua | 9 | 1,91 | 9 | 5; oppure 1 riflesso (2) + stordimento (4) + 3 | 6,4 |
| Guardia scudata | 10 | 2,13 | 10 | 6 | 7,1 |
| Gatto grande, Vespa regina | 12 | 2,55 | 12 | 8 | 8,5 |
| Cavaliere | 14 | 2,98 | 14 | 10 | 9,9 |
| Élite gatto | 12 | 2,55 | 12 | 8 | 8,5 |
| Élite guardia | 16 | 3,40 | 16 | 12 | 11,3 |

**Output Range stanza:** 15–35 s. **Examples:** piano 1, [gatto, gatto, vespa, vespa]: Σvita 18 → T_netto 3,83 s → 12,8 s + 5 = **17,8 s**.
Piano 5, [cavaliere 25, guardia scudata 18, vespa 5] = 48 vita, P = 1,6: T_netto = 48 / (4,7 × 1,6) = 6,38 s → 21,3 s + 5 = **26,3 s**.
Poiché `k_b = k_P`, il budget e la potenza attesa si compensano: il tempo-stanza cresce soprattutto di `k_vita` (+20% a piano), da 18 a 26 s nell'esempio.

**F9. Cuore**

`p_cuore = clamp(p_0 × costo × m_ferito, 0, 1)` con `p_0` = 0,010 · `m_ferito` = 2 se `maschere < maschere_max`, 0 se `maschere = maschere_max` · **mercy**: dopo 60 uccisioni consecutive senza cuore a maschere non piene la prossima lo lascia con certezza · élite: `p` = 0,20 fisso

**Output Range:** 0–0,20. **Example:** gatto: 0,010 × 2 × 2 = 4% a maschere non piene, 0% a maschere piene; guardia 6%. Tasso atteso: con Σ costi ≈ 100 per piano (10 stanze da B ≈ 10), circa 2 cuori per piano a maschere sempre non piene (0,010 × 2 × 100) e 0 a maschere piene. Un giocatore che perde 2-3 maschere per piano ne recupera quasi tutte.

**F10. Pressione attesa (attacchi al secondo)**

`pressione_max = gettoni / ((t_ant + t_lamp + t_imp)/1000 + gap_impatti_min/1000)` (limitata a `1000/gap_impatti_min` = 2,86/s)

**Example:** piano 1, gatti: 1 / (1,0 + 0,35) = 0,74 attacchi/s (al massimo); piani 4-5 con 3 gettoni: min(3 / 1,35 = 2,2, 2,86) = 2,2 attacchi/s.

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| Due nemici chiedono il gettone nello stesso frame | vince il primo nella coda del direttore; l'altro riprova dopo 100 ms | determinismo col seme |
| Nessun gettone libero per più di 3000 ms | il nemico in attesa passa in testa alla coda | evitare attese infinite |
| Ferruccio scatta attraverso un nemico in Anticipo | il nemico continua l'attacco nella direzione già fissata | l'attacco è un impegno |
| Ferruccio muore durante l'Anticipo | tutti i nemici vanno in stato neutro (nessun colpo ulteriore) | nessun colpo dopo la morte |
| Parata e colpo di un altro nemico nello stesso istante | entrambi parati se `I` cade nella finestra, entrambi storditi | coerente con `combattimento.md` |
| Proiettile riflesso colpisce un altro nemico | gli fa `danno_riflesso` (2), senza stordirlo | la fantasia della parata |
| Proiettile della statua incontra un ostacolo alto | si dissolve contro l'ostacolo | gli ostacoli servono da riparo |
| Vespa sopra a un muro della stanza | non lo supera: si ferma e riprende | solo gli ostacoli, non i muri |
| Statua con Ferruccio a 120 px esatti | rientra nel cuneo (≤ 120): usa A | confini inclusivi |
| Nemico spinto contro un muro | la spinta si annulla al contatto | niente incastri |
| Nemico in Stordito colpito di nuovo | subisce danno, lo Stordito non si prolunga né si resetta | evitare lo stun-lock |
| Parata a un attacco imparabile | nessun effetto: il danno passa | `combattimento.md` |
| Scatto durante il Colpo di un imparabile | nessun danno (i-frame di 160 ms, `I − 160 ≤ p ≤ I`) | lo scatto resta una risposta valida |
| Tutti i nemici di una stanza sono in Stordito | nessun problema: il direttore non rilascia gettoni nuovi | gli stati sono indipendenti |
| La regina minore muore con evocate vive | le evocate si dissolvono (puntini, nessun bottino) | premia il bersaglio prioritario |
| Il budget residuo è 1 (più basso di ogni costo) | la composizione si ferma: somma ∈ [B−1, B] | evitare riempimenti forzati |
| Il solo candidato pescabile è il lanterniere | viene scartato: non c'è nessuno da supportare | vincolo 3c |
| Cuore alla morte con maschere piene | nessun cuore (p = 0) | niente spreco silenzioso |
| Nemico che riceve un colpo nell'emersione | nessun danno | emersione invulnerabile |
| Tetto di velocità e dono che rallenta Ferruccio sotto 187 px/s | i nemici restano al tetto assoluto 187 px/s (non relativo) | le stanze non diventano ingiuste |
| Degenerato: giocatore che aspetta il lampo e para tutto | funziona, ma il direttore dà un gettone ogni ~1,35 s e i nemici in Stordito sono bersagli ×2; il tempo guadagnato è minimo | la parata è la strada maestra, non un trucco |
| Degenerato: stare fermi fuori da `r_aggro` | l'allarme di stanza a 4000 ms li porta in Insegue | nessuno resta a pattugliare |
| Degenerato: aggirare la guardia scudata all'infinito | aggirare è premiato (danno libero), ma lo scudo ruota: in 3 giri l'aggiramento va a segno con il fendente | intransitività |

## Dependencies

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| Combattimento | This depends on Combattimento | parata, controcolpo, `t_stordito`, danno, spinta, hit-stop |
| Controllo di Ferruccio | This depends on Controllo | `v_base`, `v_spinta`, raggio corpo, invulnerabilità |
| Stanze e porte | This depends on Stanze | punti di nascita, ostacoli, chiusura e apertura delle porte |
| Generazione dei piani | Generazione depends on this | `B(n, tipo)`, costi, pesi, composizioni, vincoli |
| Boss | Boss depends on this | direttore, gettoni, schede delle evocazioni, regole del telegrafo |
| Economia | Economia depends on this | tabella di drop dei valori iniziali |
| Rendering a teatro delle ombre | Rendering depends on this | pezzi snodati, segno a terra, puntini, anelli |
| Doni e modificatori | Doni depends on this | `P(n)` provvisorio; ganci `su_uccisione` |
| Finali e mondo dopo | Finali depends on this | i nemici ostili e pacifici del mondo dopo riusano gli archetipi |
| HUD | HUD depends on this | cartiglio dell'élite |
| Audio sintetico | Audio depends on this | eventi di Anticipo, Lampo, Colpo, Stordito, Morto |

## Tuning Knobs

Tutti i valori sono in `gioco/contenuti/parametri/nemici.json`: sezioni `globali`, `scalatura`, `budget`,
`pesi_piano`, `drop` e `archetipi.<id>`. Categorie: **F** = feel, **C** = curve, **G** = gate.

| Parameter | Cat. | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|-----|--------------|------------|-------------------|-------------------|
| `t_lamp` gatto / vespa / guardia | F | 320 / 300 / 300 ms | 280–440 | parata facile | parata da esperti (sotto 280 il vincolo R2 fallisce) |
| `t_lamp` imparabili | F | 350 ms | 350–500 | più tempo per leggere | non evitabile |
| `t_ant` gatto / vespa / statua / guardia | F | 480 / 450 / 550 / 500 ms | 300–700 | più leggibile, più lento | più nervoso |
| `t_imp` gatto / vespa / guardia / cuneo | F | 200 / 260 / 140 / 160 ms | 100–300 | più permissivo alla parata | più preciso |
| `t_rec` gatto / vespa / statua / guardia | F | 700 / 900 / 1000 / 900 ms | 400–1500 | più punibile | più pressione |
| `t_cd` gatto / vespa / statua / guardia | F | 1500 / 1800 / 2200 / 1600 ms | 800–3000 | meno pressione | più pressione |
| `t_stordito` (da `combattimento.md`) | F | 600 ms | 400–1000 | punizione | — |
| `d_balzo`, `d_picchiata`, `L_affondo` | F | 100-170 / 220 / 150 px | ±30% | più portata | meno |
| `R_cuneo`, apertura cuneo | F | 120 px, 70° | R ≤ 130 (vincolo R6) | non evitabile a piedi | più facile |
| `v` per archetipo (patt./insegue) | F | tabelle di scheda | ≤ 187 (tetto) | stanze più dure | noioso |
| `v_cap` | F | 187 px/s (0,85 × 220) | 150–200 | — | — |
| `k_vita` | C | 0,20 | 0,10–0,30 | stanze più lunghe | più brevi |
| `k_vel` | C | 0,04 | 0–0,08 | — | — |
| `k_tel` | C | 0,04 | 0–0,08 | anticipi più corti | — |
| `B_0` | C | 8 | 6–12 | stanze affollate | stanze vuote |
| `k_b` (uguale a `k_P`) | C | 0,15 | 0,10–0,25 | più pressione per piano | — |
| `k_costo`, `m_mob` | C | 1,5; tabella | — | — | — |
| `m_stanza` | C | 1,0 / 1,25 | 0,8–1,5 | — | — |
| `u_stanza` | C | 0,30 | 0,2–0,45 | stime più brevi | più lunghe |
| gettoni per piano | G | 1 / 2 / 2 / 3 / 3 | 1–4 | più pressione | meno |
| `gap_impatti_min` | G | 350 ms | 250–500 | più equo | più caos |
| `elite_piano_min` | G | 2 | 1–3 | — | — |
| `tetto_evocate_stanza` (regina) | G | 3 | 1–4 | — | — |
| `r_aggro`, `r_lose` | G | per scheda | ±30% | — | — |
| allarme di stanza | G | 4000 ms | 2000–8000 | più tempo di pattuglia | meno |
| `p_0` cuore · mercy | C | 0,010 · 60 | 0,005–0,02 · 30–100 | più cuori | meno |
| monete | C | `ceil(costo/2)`..+1 | — | — | — |

## Game Feel

### Feel Reference
La coreografia a turni di *Hades* (un nemico forte alla volta, gli altri aspettano), il tempismo
di *Sekiro* ma più largo, la silhouette di *Don't Starve*. Anti-riferimento: *Dead Cells* con i
nemici che attaccano da tutti i lati senza segnale.

### Input Responsiveness
| Action | Max Input-to-Response Latency (ms) | Frame Budget (at 60fps) | Notes |
|--------|-----------------------------------|------------------------|-------|
| Cambio di sagoma all'inizio dell'Anticipo | 17 | 1 | il primo frame di anticipo mostra il nuovo asse |
| Lampo (rosso + anello) | 17 | 1 | l'anello parte dallo stesso frame di `t_lamp` |

### Animation Feel Targets
| Animation | Anticipo (frame) | Lampo (frame) | Colpo (frame) | Recupero (frame) | Feel Goal |
|-----------|-----------------|--------------|--------------|-----------------|-----------|
| Gatto: balzo | 29 | 19 | 12 | 42 | felino, secco |
| Vespa: picchiata | 27 | 18 | 16 | 54 | nervosa, poi stanca |
| Statua: cuneo | 33 | 21 | 10 | 60 | pesante, scattosa |
| Guardia: affondo | 30 | 18 | 8 | 54 | di marcia, geometrica |

### Impact Moments
| Impact Type | Duration (ms) | Effect Description | Configurable? |
|-------------|--------------|-------------------|---------------|
| Emersione | 700 | la sagoma sale dall'ellisse | Yes |
| Dissoluzione | 700 | pezzi → puntini azzurri che salgono di 48 px | Yes |
| Hit-stop uccisione | 110 | da `combattimento.md` | Yes |
| Rimbalzo dello scudo | 120 | lampo bianco sullo scudo, spinta di 40 px | Yes |
| Stordito | 600 | pezzi sfasati, vibrazione 10 Hz di 2 px | Yes |

### Weight and Responsiveness Profile
- **Peso**: gatto e vespa leggeri (spinti), statua e cavaliere immobili.
- **Leggibilità**: ogni attacco cambia la sagoma di almeno il 15% dell'area o di 20° d'asse
  rispetto al riposo; il segno a terra è sempre inchiostro, mai colore.
- **Fallimento**: ogni danno è attribuito dal tester a un nemico preciso.

### Feel Acceptance Criteria
- [ ] Un tester esegue una parata riuscita sui primi tre gatti senza spiegazione.
- [ ] In una stanza con 4 nemici il tester dice di avere sempre saputo «chi attacca adesso».
- [ ] Un tester in bianco e nero (filtro a scala di grigi) distingue un attacco parabile da uno imparabile in 3 casi su 3.

## Acceptance Criteria

- [ ] **GIVEN** il piano 1, **WHEN** si legge `vita(n)` dal data file per il gatto, **THEN** i valori sono 6, 7, 8, 10, 11 per i piani 1-5; per la vespa 3, 4, 4, 5, 5; per la statua 9, 11, 13, 14, 16; per la guardia 8, 10, 11, 13, 14.
- [ ] **GIVEN** un gatto in Insegue con gettone libero e Ferruccio a 130 px al momento del lampo, **WHEN** inizia l'Anticipo, **THEN** il lampo parte a 480 ± 17 ms, l'impatto a 800 ± 17 ms e il balzo dura 200 ± 17 ms su 154 ± 2 px (`d_balzo` = 130 + 24); con Ferruccio a 200 px il balzo è limitato a 170 px.
- [ ] **GIVEN** un gatto con impatto a T, **WHEN** la parata è premuta a T−100 ms, **THEN** le maschere sono invariate, il gatto è in Stordito per 600 ± 17 ms, una carica di scatto è ripristinata. **WHEN** premuta a T−300 ms oppure a T−20 ms, **THEN** Ferruccio perde 1 maschera.
- [ ] **GIVEN** la statua A (cuneo), **WHEN** Ferruccio sta fermo nel cuneo e para al tempo giusto, **THEN** perde 2 maschere (imparabile). **WHEN** invece cammina di lato a 220 px/s partendo da 100 px dalla statua e reagendo dopo 250 ms, **THEN** esce dal cuneo prima del colpo e non perde maschere (200 prove con il bot, 100%).
- [ ] **GIVEN** una statua a 300 px, **WHEN** emette il proiettile e Ferruccio para all'arrivo, **THEN** il proiettile torna a 380 ± 8 px/s, la statua perde 2 vita e va in Stordito 600 ms.
- [ ] **GIVEN** una guardia che inizia l'affondo, **WHEN** parte il lampo, **THEN** compare un tratteggio aperto di 150 ± 2 px × 24 px, e il colpo percorre 150 ± 2 px in 140 ± 17 ms.
- [ ] **GIVEN** una vespa con un ostacolo alto tra lei e Ferruccio, **WHEN** esegue la picchiata, **THEN** attraversa l'ostacolo senza collisione e si ferma contro un muro della stanza.
- [ ] **GIVEN** il piano 5, **WHEN** si leggono i valori scalati, **THEN** la vespa insegue a 187 px/s (non 197), l'anticipo del gatto è 403 ± 1 ms e il suo lampo è 320 ms.
- [ ] **GIVEN** il data file, **WHEN** un test di validazione lo legge, **THEN** ogni attacco parabile ha `t_lamp ≥ 280`, ogni imparabile `t_lamp ≥ 350`, ogni `t_ant ≥ 300` (250 solo per il secondo di una catena con primo ≥ 480), e per ogni imparabile `t_uscita_peggiore ≤ t_ant + t_lamp − 400`.
- [ ] **GIVEN** il generatore di stanze, **WHEN** compone 1000 stanze normali per piano con semi diversi, **THEN** `B` vale 8, 9, 10, 12, 13, la somma dei costi sta sempre in [B−1, B], non supera mai i limiti di 8 vivi / 4 volanti / 2 statue / 1 lanterniere / 1 regina, e con B ≥ 6 ci sono ≥ 2 archetipi nel 100% dei casi.
- [ ] **GIVEN** il piano 1 con 4 nemici attivi, **WHEN** si simula per 60 s, **THEN** al massimo 1 nemico alla volta è in Anticipo, Lampo o Attacca. **GIVEN** il piano 4, **THEN** al massimo 3.
- [ ] **GIVEN** qualunque coppia di impatti programmati dal direttore, **THEN** `|I − I_j| ≥ 350 ms` in 60 s di simulazione per piano.
- [ ] **GIVEN** 4 gatti sull'anello per 30 s, **THEN** la distanza centro-centro minima tra due nemici a terra non scende mai sotto `r_i + r_j` (32 px per due gatti).
- [ ] **GIVEN** un nemico in Stordito, **WHEN** Ferruccio gli passa accanto o contro, **THEN** non subisce danno; allo scadere dei 600 ms il nemico torna in Insegue con il cooldown che riparte da 0.
- [ ] **GIVEN** un gatto che muore, **WHEN** la sua vita arriva a 0, **THEN** entro 1 frame non ha hitbox né gettone, il contatore dei vivi cala, la dissoluzione dura 700 ± 17 ms, produce 5 puntini azzurri, e le monete (1 o 2) compaiono a 350 ± 17 ms.
- [ ] **GIVEN** 100.000 uccisioni di gatti a maschere non piene, **THEN** il tasso di cuori sta tra 3,8% e 5,0% (mercy compresa); a maschere piene è 0%.
- [ ] **GIVEN** un élite gatto al piano 2, **THEN** la sua vita è 14 (7 × 2), ha un pezzo in più, il cartiglio col nome, un attacco aggiuntivo (doppio balzo), costa 5 nel budget, e non compare mai al piano 1.
- [ ] **GIVEN** una vespa regina minore con 3 evocate vive, **WHEN** il tempo di evocazione scatta di nuovo, **THEN** non ne nasce nessuna; **WHEN** la regina muore, **THEN** le evocate si dissolvono senza bottino.
- [ ] **GIVEN** una guardia scudata che guarda Ferruccio, **WHEN** Ferruccio colpisce con un fendente da dentro l'arco di 120°, **THEN** danno 0. **WHEN** colpisce con un affondo caricato o da fuori dall'arco, **THEN** il danno si applica.
- [ ] **GIVEN** uno screenshot in scala di grigi di ogni archetipo, **WHEN** si confronta riposo e fine Anticipo con Playwright, **THEN** l'area nera della sagoma cambia di ≥ 15% oppure l'asse principale ruota di ≥ 20°; nel Lampo compaiono pixel di tratteggio a terra.
- [ ] **GIVEN** i data file, **THEN** ogni archetipo ha da 3 a 6 pezzi (5 per l'élite: +1), e il repository non contiene sprite sheet né immagini dei nemici.
- [ ] Prestazioni: aggiornamento di 12 nemici con separazione e direttore entro 1,0 ms per frame.
- [ ] Nessun valore di questo documento è nel codice: tutto in `contenuti/parametri/nemici.json`, le battute assenti (nessuna battuta dei nemici nei data file).

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| **Il dps di riferimento è ottimista.** Con `danno` = 1, `floor(1 × 1,5)` = 1: il terzo fendente base non fa 1,5 e la combo vale 3 in ≈ 0,74 s (≈ 4,05 vita/s, non 4,7). Qui si usa 4,7 come da brief; le vite sono dimensionate su combo da 3 | game-designer | prototipo | misurare il dps reale; opzioni: danno interno decimale con arrotondamento solo sulla vita visibile, oppure `molt_f3` = 2,0 (combo 4, ≈ 5,4 vita/s: allora rialzare le vite del 15%) |
| Lo scatto base: la decisione del 10/10 lega lo scatto alla sciarpa (San Leucio). Il primo boss e quelli dei piani 1-4 si affrontano senza. Per questo ogni imparabile è evitabile a piedi (R6) | autore | prima del prototipo | adottata R6 in ogni caso |
| Contatto passivo senza danno (regola 5 di `controllo-ferruccio.md`) | autore | — | risolto: controllo-ferruccio.md regole 5-6 aggiornate il 2026-11-07 |
| Il graticcio con bordo continuo per gli imparabili e il lampo crema senza anello per le azioni non offensive sono proposte, non sono nell'art bible | art-director | prima del prototipo | — |
| Classi «pesanti» (statua 9, guardia 8) a 3 combo contro il «1-2 combo» di `combattimento.md` | game-designer | prototipo | se i pesanti durano troppo scendere a 6-7 vita |
| `P(n)` e `u_stanza` sono stime. `P(n)` appartiene a `doni-modificatori.md` | systems-designer | dopo `doni-modificatori.md` | — |
| Gli epiteti degli élite non sono scritti | writer | alpha | segnaposto: nome dell'archetipo |
| Anima azzurra dei nemici comuni: nessun ritaglio dentro (i ricordi hanno il profilo di un oggetto). Dopo il Gatto dei Quattro Canti si potrebbe aggiungere una scintilla colorata ai puntini (la rivelazione che le ombre custodiscono qualcosa di umano): proposta, non è nei flag | narrative-director | alpha | — |
| Tabelle di drop e `p_0` del cuore | economy-designer | `economia.md` | valori iniziali di questo GDD |
