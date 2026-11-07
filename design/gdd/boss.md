# Boss

> **Status**: In Design
> **Author**: game-designer (sessione autonoma; `creative-director`, `systems-designer`, `narrative-director`, `level-designer`, `art-director`, `qa-lead` non consultati — Solo mode. Rivedere a mano prima della produzione)
> **Last Updated**: 2026-11-07
> **Last Verified**: 2026-11-07
> **Implements Pillar**: 1 Leggibile al buio · 2 La notte ricomincia, la storia no · 3 Il bottino ha un volto · 4 Fatto di ombra e luce

## Summary

I cinque boss della bibbia come duelli a due fasi in una stanza doppia: Gatto dei Quattro Canti
(Piazza Dante), Regina dei Debiti (Corso Trieste), Madre di Marmo (Villa Comunale), Tessitrice di
Pietra (San Leucio) e il Custode Gregorio (Cortile d'Onore). Ogni boss ha 3-4 pattern con il
telegrafo in tre tempi, una soglia al 50% della vita che cambia il duello, un tetto alle aggiunte,
e una dissoluzione in anime che apre la rivelazione della bibbia (§XII, §VII) e lascia il ricordo
con scelta. Il Custode ha due aperture, secondo il flag `gregorio`.

> **Quick reference** — Layer: `Feature` · Priority: `MVP` (Gatto) / `Alpha` (gli altri quattro) · Key deps: `Nemici e IA, Stato narrativo, Combattimento`

## Overview

Un boss è un nemico del GDD `nemici.md` ingrandito (4,5-7 U, 9-12 pezzi, sagoma perforata) con le
stesse regole: tre tempi del telegrafo, parata con la finestra di 180 ms, imparabili a graticcio.
Cambia la scala: la vita è dimensionata sul dps di riferimento (≈ 4,7 vita/s) per
60-90 secondi di colpi netti; il duello si svolge in una stanza doppia di 18 × 10 celle; a metà vita
il boss si ferma, cambia sagoma e riprende più veloce e con un pattern in più; le evocazioni hanno
un tetto derivato dal budget di minaccia del piano. Nessun boss è malvagio (bibbia §XII): sono
manifestazioni o prigionieri dell'incantesimo. Per questo, vinti, non lasciano cadaveri: si
dissolvono in anime che salgono lentamente, e il giocatore capisce, boss dopo boss, che sta liberando
ciò che resta delle persone. Il flusso narrativo è quello di `storia.json`: nessun boss ha battute
durante il duello (sono scene `boss` senza battute, tranne il Custode con due didascalie).

## Player Fantasy

Il duello di cui si parla il giorno dopo: imparare un ritmo e sentirlo diventare tuo. Il gatto
insegna il telegrafo grande, la regina lo fa leggere in mezzo a uno sciame, la madre punisce chi
resta troppo vicino, la tessitrice riempie la stanza di fili e vuole che si cammini, il Custode è una
macchina perfetta e regolare che a ogni colpo ricevuto abbassa per un attimo l'alabarda. Il piacere
è Challenge (1), con il peso emotivo di Narrative (2): vincere non è distruggere ma liberare,
e il Custode, che esita, deve far dubitare di essere il nemico. SDT: Competenza (un ritmo si
padroneggia), Autonomia (il Custode ha due confronti), Relazione (le anime sono persone).

## Detailed Design

### Core Rules

#### 1. Struttura del duello

1. **Arena**: la stanza del boss è una **stanza doppia** di 18 × 10 celle da 64 px (1152 × 640 px,
   area 1,98 × la stanza standard di 13 × 7). Le mura sono spesse una cella. Ferruccio entra
   dalla porta ovest; il boss nasce a ≥ 420 px da lui.
2. **Ingresso**: le porte si chiudono; la barra di vita del boss si riempie in 1000 ms; il boss non
   attacca per i primi 1500 ms dal controllo di Ferruccio.
3. **Due fasi**: Fase 1 da vita piena a `ceil(vita × 0,5)`; **Transizione**; Fase 2 fino a 0.
4. **Transizione** (soglia 50%): il danno che porterebbe la vita sotto la soglia viene troncato
   alla soglia. Il boss entra in Transizione per **2000 ms**: invulnerabile, senza hitbox, i colpi di
   Ferruccio fanno solo una scintilla bianca a vuoto; i proiettili e le aggiunte vive vengono
   rimossi (600 ms di dissolvenza), lo Stordito in corso viene annullato; un pezzo grande della
   sagoma cambia (si stacca, si apre, si accende) e la scossa è di 8 px. Ferruccio non subisce
   danni durante la transizione. Poi la Fase 2 parte con le nuove regole.
5. **Fase 2**: velocità di movimento ×1,15; anticipo dei pattern **parabili** ×0,90 (minimo 300 ms),
   recupero ×0,85, pausa tra pattern ×0,85; **il lampo e il colpo non cambiano mai** (R3 di `nemici.md`)
   e **l'anticipo degli imparabili non cambia** (così l'evitabilità a piedi resta vera, R6). In più:
   un pattern nuovo o modificato (per boss, sotto) e un tetto di aggiunte più alto.
6. **Nessuna rigenerazione, nessun enrage**: la vita del boss non risale, la cadenza dei pattern
   è indipendente da Ferruccio. Chi non colpisce non rimanda gli attacchi.
7. **Vita e lettura**: la vita si mostra in una barra (cartiglio del proscenio) con una tacca al 50%.
8. **Tutte le regole di `nemici.md` valgono**: tre tempi, R1-R8, imparabili a graticcio con bordo
   continuo, direttore degli attacchi con gettoni e distanza minima di 350 ms tra impatti (qui il boss ha
   priorità e le aggiunte vengono programmate rispetto ai suoi impatti), danno 1 o 2.

#### 2. Regole del boss rispetto ai nemici comuni

| Regola | Valore | Perché |
|---|---|---|
| Peso | 5 o 6: mai spinto; l'affondo di Ferruccio si ferma a contatto | `combattimento.md` regola 7 |
| Stordito per parata (solo attacchi in corpo a corpo) | **900 ms** | 600 ms sarebbero troppo pochi per una vita a 3 cifre |
| Immunità allo Stordito dopo la sua fine | **5000 ms** | evitare il parry-farming; la parata funziona comunque (danno 0, controcolpo, scatto ripristinato) |
| Parata di un proiettile | riflesso con `danno_riflesso_boss` = 3 × 2 = **6**, nessuno Stordito | risolve «La parata riflette anche i proiettili dei boss? Sì salvo gli imparabili» |
| Hit-stop per colpo subito dal boss | **30 ms** (invece di 50) | con centinaia di colpi, l'hit-stop cumulativo deve restare sotto 10 s |
| Hit-stop alla morte | 110 ms (invariato) | — |
| Uccisione e morte nello stesso frame | **vince Ferruccio**: ordine di risoluzione = danni di Ferruccio → rimozione hitbox nemiche → danni subiti | un fallimento a 1 frame dalla vittoria non è leggibile come errore |

**Scelta dei pattern.** Il boss sceglie con un'estrazione pesata col seme tra i pattern la cui
condizione è soddisfatta e il cui cooldown è scaduto; mai lo stesso pattern tre volte di fila;
la pausa base tra due pattern è 900 ms (500 se Ferruccio è entro 150 px). Se Ferruccio resta a
> 600 px per più di 4000 ms, i pattern a distanza ottengono peso ×3. Il **Custode** non estrae: segue
una **sequenza fissa** (vedi sotto).

#### 3. Aggiunte e tetto

Ogni evocazione è un nemico di `nemici.md` con vita scalata per il piano del boss e un fattore di
riduzione. Le aggiunte non lasciano bottino, non contano per i cuori, si dissolvono quando il
boss entra in Transizione o muore. Il **tetto** è dato da B3 (Formulas): al massimo 6 vive in
assoluto. Se il tetto è pieno o non c'è posto per tutte le nuove, il pattern di evocazione non
viene estratto; se ne nascono meno del previsto, ne nascono solo quante ne stanno.

| Boss | Aggiunta | Vita | Fase 1 | Fase 2 |
|---|---|---|---|---|
| Gatto | gatto d'ombra | vita(1) = 6 | 2 | 3 |
| Regina | vespa dorata | vita(2) = 4 → ×0,5 = 2 | 4 | 6 |
| Madre | statua minore (solo proiettile, senza cuneo) | vita(3) = 13 → ×0,6 = 8 | 2 | 3 |
| Tessitrice | guardia del Velo | vita(4) = 13 → ×0,6 = 8 | 1 | 2 |
| Custode | nessuna | — | 0 | 0 |

#### 4. Morte, dissoluzione e ciò che lascia

1. A `vita ≤ 0`: `boss_battuti` riceve l'id del boss **prima** dell'animazione (id: `gatto`, `regina`,
   `madre`, `tessitrice`, `custode`, come in `stato-narrativo.md`); hit-stop 110 ms; tutte le
   hitbox, i proiettili e le aggiunte spariscono.
2. **Dissoluzione** (3000 ms): ogni pezzo si stacca e si scioglie in 3-5 anime che salgono lentamente
   (48 → 160 px) con valori diversi di azzurro e crema. Tra le anime una resta più
   grande e sale più lentamente: è l'**anima del ricordo** (azzurra con il profilo di un oggetto dentro,
   `art-bible.md` Principio B). Per il Custode la sequenza è diversa (vedi scheda).
3. Dopo la dissoluzione parte la scena `dopo-boss:<id>` (`incontri-dialoghi.md`) e le porte si aprono.
4. **Ciò che lascia** (tutti i boss tranne il Custode): **1 cuore** (resta a terra se le maschere sono
   piene), **monete** `10 + 5 × (n − 1)` (10, 15, 20, 25), **scintille** `2 × n` (2, 4, 6, 8); i valori
   sono iniziali di `economia.md`. In più il **ricordo** (dono azzurro) secondo `ricordi-scelta.md`: se
   il flag della scelta è `null` il boss lascia il ricordo; se è già deciso, lascia un dono d'oro dal
   pool. Morire con il ricordo in mano senza aver scelto lo fa ricomparire alla vittoria successiva.
5. Il boss si **riaffronta a ogni notte** con vita piena e senza checkpoint interno (pilastro 2: la
   notte ricomincia). Le scene di storia non si ripetono (`scene_viste`).

#### 5. Scheda: Gatto dei Quattro Canti (Piazza Dante, piano 1)

| Voce | Valore |
|---|---|
| Scene | boss: `piazza-dante.gatto-dei-quattro-canti` (senza battute). Dopo: `piazza-dante.scelta-tonino` (flag `tonino_ricordo`) |
| Origine (bibbia §XII) | Formato dai ricordi domestici sottratti alle famiglie |
| Vita · tempo obiettivo | **280** · 59,6 s di colpi netti (T_obj 60, P = 1,00) |
| Raggio · altezza · peso | 40 px · 4,5 U · 5 |
| Velocità | Ronda 90 px/s tra i quattro pilastri (finché non viene colpito o a ≤ 300 px); Insegue 130 px/s (F2: 150) |
| Pezzi (10) | corpo, testa, orecchio sx, orecchio dx, coda ×3, zampa anteriore sx, zampa anteriore dx, zampe posteriori. Finestre di carta chiara tagliate nel corpo (3-5), a forma di oggetti domestici (da decidere con l'art-director) |
| Arena | 4 pilastri 1 × 1 cella a (3,2), (14,2), (3,7), (14,7) (celle da 0, origine in alto a sinistra); solidi per Ferruccio e le aggiunte, **sorvolati dal boss**. 4 lampioni sui pilastri (4 luci) |
| Aggiunte | gatti d'ombra, tetto 2 / 3 |

| Pattern | Tipo | Anticipo (pezzo e rotazione) | Lampo | Ant / Lampo / Colpo / Rec (ms) | Geometria, danno | Parabile |
|---|---|---|---|---|---|---|
| **Balzo grande** | corpo a corpo | zampe posteriori si piegano di 50°, testa giù di 45°, coda rigida | occhi (2 perforazioni) rossi con anello | 550 / 320 / 260 / 1300 | capsula larga 80 px lunga `d_balzo` = clamp(d_lampo + 40, 160, 300); 1 | sì |
| **Graffio a ventaglio** (se d ≤ 150) | corpo a corpo | zampa anteriore dx sale di 100° | 3 tagli sulle unghie rossi con anello | 450 / 300 / 180 / 1000 | settore 120°, raggio 150 px; 1 | sì |
| **Richiamo dei Canti** (cooldown 12000) | evocazione | busto indietro di 45°, orecchie e coda ritte | occhi lampeggiano **crema**, senza anello | 700 / 300 / — / 800 | fa nascere 2 gatti d'ombra dai pilastri più lontani da Ferruccio; nessun danno | no |
| **Caduta dei Quattro Canti** (solo F2, cooldown 9000) | imparabile | si accuccia e il corpo ruota di 60° verso l'alto | occhi **rosso pieno**, fissi | 600 / 350 / 200 / 1500 | cerchio raggio 100 px centrato su Ferruccio all'inizio dell'anticipo (graticcio dall'inizio); in aria (Lampo) è intoccabile; 2 | no |

**Fase 2** (cosa cambia): Transizione: la coda perde un segmento (da 3 a 2 pezzi visibili, il terzo cade a
terra) e 2 lampioni opposti si spengono (nessun effetto di gioco: la luce non cambia mai i
telegrafi). Il Balzo grande diventa **doppio**: il secondo balzo parte 150 ms dopo il primo con
anticipo 300 (ammesso da R4, il primo è ≥ 480), lampo 300, colpo 260, direzione fissata nel suo
lampo; il recupero scatta dopo il secondo. Arriva la **Caduta**. Tetto aggiunte 3.

**Ciclo e punizione** (stima): Balzo = 900 pausa + 1130 + 1300 = 3330 ms, utili 1300 + 450 = 1750
(u 0,52); Graffio = 500 + 930 + 1000 = 2430, utili 1000 + 250 = 1250 (u 0,51). F1 u ≈ 0,5, F2 ≈ 0,46.

**Dissoluzione e rivelazione**: il corpo si scioglie in anime colorate; resta una grande, l'anima del
**ricordo di Rosa** (`oggetti: anima-ricordo-rosa` in `storia.json`). Rivelazione (bibbia §XII):
Ferruccio comprende che le creature d'ombra custodiscono qualcosa di umano. Scena
`piazza-dante.scelta-tonino`: restituire (`restituito`) o lasciarlo dimenticare (`negato`) a Tonino.
**Lascia**: il Medaglione di Rosa (dono azzurro, `ricordi-scelta.md`: +8% danno finché non lo si
restituisce), se `tonino_ricordo = null`; altrimenti un dono d'oro dal pool; 1 cuore, 10 monete, 2 scintille.

#### 6. Scheda: Regina dei Debiti (Corso Trieste, piano 2)

| Voce | Valore |
|---|---|
| Scene | boss: `corso-trieste.regina-dei-debiti` (senza battute). Dopo: `corso-trieste.passato-taddeo` poi `corso-trieste.scelta-taddeo` (flag `taddeo`) |
| Origine (bibbia §XII) | Nata dalle ambizioni e dalle promesse mai mantenute durante i lavori della Reggia |
| Vita · tempo obiettivo | **350** · 64,8 s (T_obj 65, P = 1,15) |
| Raggio · altezza · peso | 36 px · 5,0 U · 5 |
| Movimento | volante; **sorvola gli ostacoli**; Insegue a 120 px/s mantenendo 220-360 px da Ferruccio (F2: 138) |
| Pezzi (10) | corona (pennacchi), testa, busto, ala sx, ala dx (45% di opacità), gonna a pannelli (pagine di registro), pungiglione, braccio sx, braccio dx, rotolo (scettro) |
| Arena | 4 colonne 1 × 1 a (5,3), (12,3), (5,6), (12,6): fermano Ferruccio e i pungiglioni, non la regina né le vespe. 6 vetrine illuminate sul muro nord (6 luci) |
| Aggiunte | vespe dorate a vita 2, tetto 4 / 6 |

| Pattern | Tipo | Anticipo | Lampo | Ant / Lampo / Colpo / Rec (ms) | Geometria, danno | Parabile |
|---|---|---|---|---|---|---|
| **Picchiata regale** | volo | ali alzate a V (ognuna di 70°), pungiglione in giù | strisce delle ali rosse con anello | 520 / 300 / 300 / 1400 | capsula 72 px × 300 px; l'ombra si stringe; 1 | sì |
| **Nube di vespe** (cd 10000) | evocazione | ali spalancate di 60°, vibrazione stretta | strisce **crema**, senza anello | 650 / 300 / — / 800 | nascono 3 vespe dai lati; nessun danno | no |
| **Pioggia di pungiglioni** | proiettili | addome piegato in avanti di 70° | pungiglione rosso con anello | 500 / 300 / emissione / 1000 | ventaglio di 3 a 22°; 320 px/s, r 8 px, gittata 560 px; 1 ciascuno | sì (riflesso ×3) |
| **Colpo d'ali** (solo F2, cd 8000) | imparabile | ali aperte a 100° | perforazioni in serie sulle ali, **rosso pieno** | 600 / 350 / 200 / 1300 | cono 80°, raggio 160 px, direzione fissata all'inizio dell'anticipo; 2 | no |

**Fase 2**: Transizione: le ali si aprono per intero (il pezzo si allarga del 30%) e due vetrine si
spengono (senza effetto). La Pioggia diventa a **5** proiettili a 16°; la Picchiata è **doppia**
(seconda passata 300 / 300 / 300, direzione rifissata nel suo lampo); arriva il **Colpo d'ali**; tetto
vespe 6.

**Ciclo** (stima): Picchiata = 900 + 1120 + 1400 = 3420, utili 1400 + 450 = 1850 (u 0,54);
Pioggia = 500 + 800 + 1000 = 2300, utili 1000 + 250 = 1250 (u 0,54); con lo sciame u F1 ≈ 0,50, F2 ≈ 0,46.

**Dissoluzione e rivelazione**: le vespe rimaste si sciolgono con lei; le anime salgono verso nord
(la Reggia). Rivelazione (§XII): le vespe trasportano desideri rubati verso il palazzo.
La scena `corso-trieste.passato-taddeo` (un'anima liberata mostra il passato con Taddeo) apre la
scelta `corso-trieste.scelta-taddeo`. **Lascia**: la Spada di legno (dono azzurro, il passato
condiviso di Taddeo; `ricordi-scelta.md`, canon *Provisional*: `storia.json` non assegna oggetti)
se `taddeo = null`; altrimenti un dono d'oro; 1 cuore, 15 monete, 4 scintille.

#### 7. Scheda: Madre di Marmo (Villa Comunale, piano 3)

| Voce | Valore |
|---|---|
| Scene | boss: `villa-comunale.madre-di-marmo` (senza battute). Dopo: `villa-comunale.ricordo-gaetano` poi `villa-comunale.scelta-registro` (flag `registro`) |
| Origine (bibbia §XII) | Statua che custodisce i ricordi degli operai morti |
| Vita · tempo obiettivo | **430** · 70,4 s (T_obj 70, P = 1,30) |
| Raggio · altezza · peso | 48 px · 6,0 U · 6 |
| Movimento | rigido: avanza a 60 px/s con scatti di 15° (F2: 69); ruota a 90°/s |
| Pezzi (9) | piedistallo, gonna, torso, testa, velo, braccio sx, avambraccio sx, braccio dx, avambraccio dx |
| Arena | fontana centrale 3 × 3 celle (8-10, 4-6): fermano Ferruccio, la Madre (aggira) e le sfere. 4 siepi 2 × 1 ai lati. 2 lampioni |
| Aggiunte | statue minori a vita 8, tetto 2 / 3 (solo proiettile, nessun cuneo) |

| Pattern | Tipo | Anticipo | Lampo | Ant / Lampo / Colpo / Rec (ms) | Geometria, danno | Parabile |
|---|---|---|---|---|---|---|
| **Pugno di marmo** (se d ≤ 150) | imparabile | braccio dx sale di 90° | crepe sul braccio, **rosso pieno** | 650 / 350 / 180 / 1500 | cuneo 60°, raggio 150 px, direzione fissata all'inizio dell'anticipo; 2 | no |
| **Sfera della memoria** | proiettile | avambraccio sx ruota di 70°, la mano si apre | perforazioni sul palmo con anello | 450 / 300 / emissione / 900 | sfera 260 px/s, r 12, gittata 640; 1; riflesso ×3 | sì |
| **Pioggia di lastre** | area | entrambe le braccia salgono di 80° | perforazioni in serie nel velo, **rosso pieno** | 500 / 350 / 140 / 1200 | 3 zone, raggio 60 px: la prima su Ferruccio, le altre a 140-240 px dalla prima, ≥ 130 px tra loro; 2 | no |
| **Statue dai ricordi** (cd 15000) | evocazione | busto indietro di 45°, braccia aperte | velo **crema** senza anello | 800 / 300 / — / 900 | nascono statue minori ai bordi | no |
| **Abbraccio** (solo F2, cd 14000, oppure se Ferruccio resta entro 130 px per 2500 ms cumulativi) | imparabile | le due braccia ruotano di 100° in avanti | rosso pieno, anello assente | 700 / 350 / 200 / 1400 | cerchio raggio 120 px centrato sulla Madre; 2 | no |

Il contatore «troppo vicino» sale di 1 s/s quando Ferruccio è entro 130 px dal centro e scende di 1 s/s fuori.
**Fase 2**: Transizione: il velo si spezza (pezzo che cade), le due braccia si staccano dal busto di 15°.
La Sfera diventa **doppia** (la seconda 400 ms dopo, mira rifissata), le lastre diventano **5**,
arriva l'**Abbraccio**, tetto statue 3.

**Ciclo** (stima): Pugno = 800 + 1180 + 1500 = 3480, utili 1500 + 400 = 1900 (u 0,55); Sfera = 500 +
750 + 900 = 2150, utili 900 + 250 = 1150 (u 0,53); Lastre = 500 + 990 + 1200 = 2690, utili
1200 + 250 = 1450 (u 0,54). F1 ≈ 0,50 con le statue, F2 ≈ 0,46.

**Dissoluzione e rivelazione**: le anime salgono lente; tra queste una memoria del padre.
Rivelazione (§XII): Gaetano non causò l'incidente, ma tentò di salvare gli altri. Scena
`villa-comunale.ricordo-gaetano` (obbligatoria, un'immagine immobile); poi `villa-comunale.scelta-registro`:
conservare (`conservato`) o bruciare (`bruciato`) il documento originale. **Lascia**: il Registro del
cantiere (dono azzurro, `ricordi-scelta.md`), se `registro = null`; altrimenti un dono d'oro; 1 cuore,
20 monete, 6 scintille.

#### 8. Scheda: Tessitrice di Pietra (San Leucio, piano 4)

| Voce | Valore |
|---|---|
| Scene | boss: `san-leucio.tessitrice-di-pietra` (senza battute; ordine 10: è la prima scena del capitolo). Dopo: `san-leucio.arrivo-manifattura`; la scelta `san-leucio.scelta-agnese` (flag `agnese`) viene più avanti |
| Origine (bibbia §XII) | Statua utilizzata come guardiana dei telai incantati |
| Vita · tempo obiettivo | **545** · 80,0 s (T_obj 80, P = 1,45) |
| Raggio · altezza · peso | 48 px · 6,0 U · 6 |
| Movimento | **Fase 1: ferma sul telaio centrale** (ruota a scatti di 15°, 90°/s). **Fase 2: si stacca dal telaio e cammina a 70 px/s** (valore fisso, il fattore ×1,15 su 0 non basta) |
| Pezzi (11) | base-telaio (seggio), torso, testa, braccio alto sx, braccio alto dx, braccio basso sx, braccio basso dx, spola (in mano), pettine (in mano), giglio sul petto, velo |
| Arena | telaio centrale 3 × 1 a (8-10, 3) con il seggio; 4 telai 2 × 1 a (3,2), (14,2), (3,7), (14,7): fermano Ferruccio e le spole, e i fili si tendono tra loro. 4 lanterne sui telai |
| Aggiunte | guardie del Velo a vita 8, tetto 1 / 2 |

| Pattern | Tipo | Anticipo | Lampo | Ant / Lampo / Colpo / Rec (ms) | Geometria, danno | Parabile |
|---|---|---|---|---|---|---|
| **Colpo di spola** | proiettile | braccio alto dx indietro di 90° | perforazioni sulla spola con anello | 450 / 300 / emissione / 900 | spola 360 px/s, r 10, gittata 520 px; 1; riflesso ×3 | sì |
| **Pettinata** (se d ≤ 150) | corpo a corpo | braccio basso con il pettine ruota di 90° | denti del pettine rossi con anello | 450 / 300 / 200 / 1100 | semicerchio 180° raggio 150 px davanti; 1 | sì |
| **Fili tesi** (cd 8000) | imparabile | le due braccia alte si tendono in senso opposto (50° ciascuna) | perforazioni lungo le braccia, **rosso pieno** | 600 / 350 / 140 / 1400 | F1: 3 linee parallele larghe 20 px, spaziate di 160 px, orientamento alternato verticale/orizzontale (seme), che uniscono i telai; 2 | no |
| **Richiamo del telaio** (cd 18000) | evocazione | tutte e 4 le braccia in alto di 70° | velo **crema** senza anello | 700 / 300 / — / 800 | nasce 1 guardia del Velo da una porta laterale; nessun danno | no |

**Fase 2**: Transizione: si stacca dal seggio (il pezzo base-telaio resta); il giglio sul petto si
accende e resta visibile. Cammina a 70 px/s. Il Colpo di spola diventa **doppio a V** (due spole a ±10°, la
seconda 300 ms dopo). I Fili tesi diventano una **griglia** di 2 + 2 linee (celle sicure ≥ 140 px). Tetto
guardie 2. Gli altri pattern invariati (i parabili hanno l'anticipo ×0,90, gli imparabili no).

**Evitabilità dei fili**: le linee sono larghe 20 px; Ferruccio in piedi su una linea ne esce con
10 + 14 = 24 px (109 ms), contro un massimo di `600 + 350 − 400 = 550 ms`. Poiché la Tessitrice
compare prima di Agnese, il giocatore può non avere lo scatto: tutto è evitabile a piedi.

**Ciclo** (stima): Spola = 900 pausa + 750 + 900 = 2550, utili 900 + 450 = 1350 (u 0,53); Pettinata =
500 + 950 + 1100 = 2550, utili 1100 + 250 = 1350 (u 0,53); Fili = 900 + 1090 + 1400 = 3390, utili
1400 + 450 = 1850 (u 0,55). Con la tessitrice ferma Ferruccio può colpirla di lato tra un attacco e
l'altro, ma i fili lo costringono a spostarsi e la guardia evocata lo distrae: u F1 ≈ 0,50, F2 ≈ 0,46.

**Dissoluzione e rivelazione**: i fili d'oro tra i telai si sciolgono con lei; il giglio sul petto è
l'ultimo pezzo a spegnersi. Rivelazione (§XII): il Velo nasce dalla seta e il giglio è il simbolo che
lega i guardiani a Violante. **Lascia**: la Sciarpa rossa (dono azzurro, `ricordi-scelta.md`) se
`agnese = null`; altrimenti un dono d'oro; 1 cuore, 25 monete, 8 scintille. **Nota**: `storia.json`
non assegna oggetti a questo boss; la sciarpa come ricordo è un'assegnazione provvisoria di
`ricordi-scelta.md` (canon *Provisional*), e la decisione dell'autore del 10/10 lega lo scatto alla
sciarpa data nel dialogo (`san-leucio.dono-sciarpa`, solo con `agnese = risvegliata`).

#### 9. Scheda: il Custode Gregorio (Reggia, Cortile d'Onore, piano 5)

| Voce | Valore |
|---|---|
| Scene | prima: `reggia.scelta-gregorio` (con `prove = vera`) oppure `reggia.attacco-senza-prove` (con `prove = falsa`, fissa `gregorio = attacco`), poi `reggia.confronto-dialogo` o `reggia.confronto-attacco`. Boss: **`reggia.scontro-custode`** (due didascalie). Dopo: `reggia.morte-del-custode`, poi `reggia.custode-sconfitto` (rivelazione di Violante) |
| Origine (bibbia §VII) | Capitano delle guardie, legato al giglio d'oro, imprigionato nella sua armatura: rimane cosciente, ma ogni movimento è controllato dal Velo. Attacchi «violenti e regolari, come quelli di una macchina che continua a eseguire un ordine» |
| Vita · tempo obiettivo | **675** · 89,8 s (T_obj 90, P = 1,60) |
| Raggio · altezza · peso | 40 px · 6,5 U · 6 |
| Movimento | avanza a 100 px/s (F2: 115), rotazione a scatti di 15° a 120°/s |
| Pezzi (12) | elmo, busto, giglio (sul petto), mantello (blocco di stoffa rigida), braccio sx, avambraccio sx, braccio dx, avambraccio dx, asta dell'alabarda, lama dell'alabarda, gamba sx, gamba dx. Perforazioni nel busto e nell'elmo |
| Arena | Cortile d'Onore **vuoto** (nessun ostacolo): pavimento a scacchi di celle da 64 px, 4 torce ai lati (4 luci, «poche luci calde»). L'arena pulita è parte del carattere: una macchina, non un posto da usare |
| Aggiunte | nessuna: è un duello |

**Il Custode è regolare.** Non c'è casualità nella scelta dei pattern: una **sequenza fissa**, con pausa
costante di 500 ms (F2: 425) tra due pattern. Fase 1: `Fendente → Fendente → Affondo → Raffica →
Scacchiera` e si ripete. Fase 2: `Fendente → Affondo → Raffica (7 colpi) → Scacchiera doppia`. Se la
condizione di distanza del prossimo pattern non è soddisfatta, Gregorio avanza; dopo 4000 ms passa al
primo pattern successivo della sequenza la cui condizione è vera (la Raffica non ha condizione).

| Pattern | Tipo | Anticipo | Lampo | Ant / Lampo / Colpo / Rec (ms) | Geometria, danno | Parabile |
|---|---|---|---|---|---|---|
| **Fendente d'alabarda** (d ≤ 190) | corpo a corpo | asta dell'alabarda ruota di 100° sopra la testa | lama perforata, rossa con anello | 500 / 300 / 160 / 700 | settore 130°, raggio 170 px; 1 | sì |
| **Affondo d'alabarda** (d ≤ 280) | corpo a corpo | busto ruota di 45°, asta in orizzontale | punta della lama rossa con anello | 550 / 300 / 140 / 1100 | linea 260 × 28 px, tratteggio a terra lungo 260 px; **2** | sì |
| **Raffica del giglio** | proiettili | avambraccio sx ruota di 60° verso il petto | **il giglio si accende**: rosso con anello che si chiude | 600 / 350 / 5 colpi a 160 ms (640) / 1200 | colpi da 340 px/s, r 8, ciascuno mirato a Ferruccio nell'istante dell'emissione; 1 ciascuno; riflesso ×3 | sì (ogni colpo) |
| **Scacchiera** | imparabile | asta ruota di 180° e si pianta a terra | giglio e perforazioni sull'asta, **rosso pieno** | 700 / 350 / 200 / 1500 | tutte le caselle di **un colore** entro 320 px dal Custode (graticcio da inizio anticipo); l'altro colore è sicuro; 2 | no |

**Scacchiera** (dettaglio): le caselle sono le celle da 64 px, colore dato da `(cx + cy) mod 2` con
origine in alto a sinistra dell'arena; il primo uso colpisce il colore 0, ogni uso successivo
alterna. **F2 doppia**: due impulsi, il secondo (colore opposto) 1000 ms dopo il primo; entrambi i
graticci sono disegnati dall'inizio dell'anticipo e portano stampato un «1» o un «2» nell'angolo
della casella (tipografia, non solo colore). Evitabilità: da una casella pericolosa alla casella
sicura vicina servono 32 + 14 = 46 px (209 ms), contro 650 ms di margine; tra i due impulsi
restano 800 ms dopo il colpo del primo.

**Il giglio e l'esitazione.**
1. A ogni colpo subito il giglio emette un lampo **bianco** di 80 ms (non rosso: il rosso significa
   solo attacco; durante l'accensione della Raffica è rosso con anello).
2. **Esitazione**: quando il danno accumulato dall'ultima esitazione raggiunge `round(vita × 0,08)` =
   **54** (F2: `round(vita × 0,06)` = **41**), alla prima pausa tra due pattern Gregorio entra in
   **Esita** per 700 ms: l'asta dell'alabarda ruota di 50° verso il basso, il giglio lampeggia due
   volte, non attacca ed è vulnerabile. Alla fine una forza lo costringe: l'asta torna su in 150 ms
   con un lampo del giglio, e la sequenza riprende dal pattern che spettava. Periodo refrattario tra due
   esitazioni 3000 ms. Con 675 vita sono ≈ 6 esitazioni in F1 e ≈ 8 in F2, circa 9,8 s di finestre
   libere già comprese in `u_boss`.
3. L'esitazione non ha parole: è un'animazione (bibbia §VII: «in alcuni momenti il Custode sembra
   voler abbassare l'alabarda, ma una forza lo obbliga a sollevarla»; `reggia.scontro-custode`).

**I due confronti (flag `gregorio`).** Il combattimento è lo stesso, cambia **l'apertura**:

| Flag | Scene | Apertura |
|---|---|---|
| `dialogo` (solo con `prove = vera`) | `reggia.scelta-gregorio` → `reggia.confronto-dialogo` | Ferruccio ha rinunciato al primo colpo e si espone: il controllo passa a Ferruccio a **150 px** con il **Fendente già in Anticipo**; il suo lampo arriva a 800 ms dal controllo |
| `attacco` (scelta, oppure fissato senza prove da `reggia.attacco-senza-prove`) | `reggia.confronto-attacco` | Gregorio «solleva immediatamente l'alabarda»: il controllo passa a **100 px** con Gregorio in **Alzata** per 1500 ms (nessun attacco, vulnerabile): **primo colpo libero** di Ferruccio (≈ 6 vita) |

L'esitazione è identica in entrambi i casi (700 ms), perché la bibbia prevede il costo del dialogo (rinunciare
al primo colpo, esporsi all'alabarda) senza un premio meccanico: il premio è la confessione
anticipata e la frase finale di `reggia.morte-del-custode`. La differenza di durata attesa tra i due
percorsi è < 1% (1,5 s × 4,7 ≈ 6,1 vita su 675). Se `gregorio = null` al momento dello scontro
(non dovrebbe) si tratta come `attacco`. Nelle notti successive il flag resta quello deciso e
l'apertura lo rispetta; le scene di confronto non si ripetono.

**Fase 2** (Transizione): l'armatura si crepa (il busto si apre di 15° e il mantello si strappa), il giglio
resta acceso a luce piena. La Raffica passa a 7 colpi, la Scacchiera diventa doppia, la sequenza
omette il secondo Fendente, la soglia di esitazione scende al 6%, e la pausa tra pattern è 425 ms.
Il Custode non ha aggiunte.

**Ciclo** (stima F1): `F, F, A, R, S`: 2160 + 2160 + 2590 + 3290 + 3250 = 13 450 ms, utili 950 + 950 +
1350 + 1450 + 1750 = 6450 (u 0,48) + esitazioni ⇒ u F1 ≈ 0,50, F2 ≈ 0,46.

**Morte e rivelazione** (non è una dissoluzione generica). A `vita ≤ 0`: hit-stop 110 ms, tutti gli
attacchi si fermano; i pezzi dell'armatura (elmo, busto) si aprono e cadono ruotando fuori, le
gambe si piegano, **Gregorio cade in ginocchio**; il giglio si spezza in due pezzi (2500 ms); parte
`reggia.morte-del-custode` (le sue battute dipendono da `gregorio`: *«Tuo padre era innocente.»* con
`dialogo`, *«Anche io avevo paura di perderla.»* con `attacco`; Gregorio muore in entrambi i casi).
L'anima azzurra sale lentamente verso il balcone e il **mantello rosso, vuoto,** resta sull'armatura
(non si dissolve). Poi `reggia.custode-sconfitto` (rivelazione di Violante, scena indispensabile).
Rivelazione (§VII): il vero nemico non era lui. **Lascia**: nessuna moneta, nessun cuore (non c'è
bottino); il Fazzoletto col giglio (dono azzurro, `ricordi-scelta.md`) se `violante = null`,
altrimenti nulla di nuovo. La scelta successiva è `reggia.scelta-violante`, dopo `reggia.ultima-conversazione`.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| Ingresso | porte chiuse | 1500 ms dal controllo | barra che si riempie; nessun attacco |
| Ronda / Insegue | fine Ingresso, o fine Recupero/Stordito/Esita/pausa | scelta del prossimo pattern | si muove; pausa base 900 ms (500 ms se vicino) |
| Anticipo (A, poi L) | pattern scelto con condizione vera | fine di `t_ant + t_lamp` | cambio di sagoma, poi lampo; impegnato |
| Attacca | fine del lampo | fine di `t_imp` (o dei colpi di una raffica) | hitbox attiva |
| Recupero | fine di Attacca | fine di `t_rec` | sagoma esposta |
| Stordito | parata di un colpo in corpo a corpo, e immunità scaduta | 900 ms, poi 5000 ms di immunità | fermo, sagoma sfasata |
| Esita (solo Custode) | soglia di danno raggiunta ∧ pausa tra pattern ∧ refrattario scaduto | 700 ms | asta giù, giglio lampeggia |
| Alzata (solo Custode, `attacco`) | inizio del duello | 1500 ms | alabarda che sale; vulnerabile |
| Transizione | vita ≤ soglia (50%) | 2000 ms | invulnerabile; sagoma cambia; aggiunte e proiettili rimossi |
| Morto | vita ≤ 0 | fine della dissoluzione (3000 ms) o scena (Custode) | senza hitbox; `boss_battuti` aggiornato |

| Da | A | Condizione |
|---|---|---|
| Ingresso | Ronda/Insegue | 1500 ms dal controllo |
| Ronda/Insegue | Anticipo | pattern estratto (o sequenza fissa), condizione vera, direttore OK |
| Anticipo → Attacca → Recupero | Ronda/Insegue | fine di `t_rec` |
| Attacca | Stordito | parata di un colpo in corpo a corpo, immunità scaduta |
| Stordito | Ronda/Insegue | 900 ms |
| qualunque tranne Morto | Transizione | vita ≤ soglia, **una sola volta** per duello |
| Transizione | Ronda/Insegue | 2000 ms, Fase 2 |
| qualunque | Morto | vita ≤ 0 |

### Interactions with Other Systems

| Sistema | Dati in ingresso | Dati in uscita |
|---|---|---|
| Nemici e IA | direttore, gettoni, schede delle aggiunte, regole del telegrafo | evocazioni di archetipi con vita scalata |
| Combattimento | danno, parata, riflesso, controcolpo, hit-stop | hitbox, flag imparabile, vita, peso |
| Stato narrativo | flag `gregorio`, `boss_battuti` | `boss_battuti += id` a vita 0 |
| Incontri e dialoghi | scena `dopo-boss:<id>` | evento di fine boss |
| Ricordi con scelta | quale ricordo lasciare (flag `null`/deciso) | drop alla dissoluzione |
| Stanze e porte, Generazione dei piani | stanza doppia 18 × 10, porta ovest, `B(n)` | chiusura e apertura delle porte |
| Rendering | pezzi, perforazioni, forme del telegrafo, dissoluzione | — |
| Economia | monete, scintille, cuore iniziali | — |
| HUD | — | barra di vita con tacca al 50% |
| Camera | arena 1152 × 640 px | — |
| Finali e mondo dopo | — | `custode` battuto e Violante in scena |

## Formulas

**B1. Vita del boss**

`vita_boss = round_5(dps_rif × T_obj × P(n))`, con `P(n) = 1 + k_P × (n − 1)`

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| dps_rif | float | 4,0–5,0 | `combattimento.md` | 4,7 vita/s |
| T_obj | int | 60–90 s | data file | tempo obiettivo di colpi netti |
| P(n) | float | 1,0–1,6 | calculated | potenza attesa dei doni al piano `n` (`k_P` = 0,15; provvisoria, di `doni-modificatori.md`) |
| round_5 | — | — | — | arrotonda al multiplo di 5 più vicino |

**Output Range:** 280–675. **Examples:**

| Boss | Piano | T_obj | P | vita = 4,7 × T × P | Arrotondata | T_netto = vita / (4,7 × P) | Senza doni (P = 1): vita / 4,7 |
|---|---|---|---|---|---|---|---|
| Gatto | 1 | 60 | 1,00 | 282,0 | **280** | 59,6 s | 59,6 s |
| Regina | 2 | 65 | 1,15 | 351,3 | **350** | 64,8 s | 74,5 s |
| Madre | 3 | 70 | 1,30 | 427,7 | **430** | 70,4 s | 91,5 s |
| Tessitrice | 4 | 80 | 1,45 | 545,2 | **545** | 80,0 s | 116,0 s |
| Custode | 5 | 90 | 1,60 | 676,8 | **675** | 89,8 s | 143,6 s |

Tutti i T_netto stanno in [60, 90] s. Senza doni i boss dei piani 3-5 durerebbero molto di più (92-144 s netti): il
gioco presuppone la crescita dei doni (vedi Open Questions).

**B2. Fase 2**

`v_F2 = v × (1 + k_f2)` · `t_ant_F2 = max(300, round(t_ant × 0,90))` solo per i parabili · `t_rec_F2 = round(t_rec × 0,85)` · `pausa_F2 = round(pausa × 0,85)` · `t_lamp` e `t_imp` invariati · soglia = `ceil(vita × 0,5)`

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| k_f2 | float | 0,10–0,25 | data file | 0,15 |
| coefficiente anticipo parabili | float | 0,80–1,0 | data file | 0,90 |
| coefficiente recupero e pausa | float | 0,75–1,0 | data file | 0,85 |

**Output Range:** velocità 60–150 px/s. **Example:** Gatto: v 130 → 149,5 → **150** px/s; Balzo grande: anticipo 550 → 495, recupero 1300 → 1105 (lampo 320 e colpo 260 invariati). Madre: 60 → 69 px/s. Custode: 100 → 115; pausa 500 → 425. La Tessitrice in F2 cammina a 70 px/s (fisso). Custode, Fendente: 500 → 450, 700 → 595 (lampo 300 e colpo 160 invariati).

**B3. Tetto delle aggiunte**

`tetto = min(6, floor(f_agg × m_fase × B(n) / costo_agg))` con `m_fase` = 1 (F1), 1,5 (F2) e `B(n)` da `nemici.md` F7 (8, 9, 10, 12, 13)

| Boss | n | B(n) | f_agg | costo_agg | F1: floor(f·B/c) | F2: floor(1,5·f·B/c) |
|---|---|---|---|---|---|---|
| Gatto | 1 | 8 | 0,50 | 2 (gatto) | floor(4/2) = **2** | floor(6/2) = **3** |
| Regina | 2 | 9 | 0,50 | 1 (vespa a vita ×0,5) | floor(4,5/1) = **4** | floor(6,75/1) = 6 → **6** |
| Madre | 3 | 10 | 0,50 | 2 (statua minore) | floor(5/2) = **2** | floor(7,5/2) = **3** |
| Tessitrice | 4 | 12 | 0,25 | 2 (guardia a vita ×0,6) | floor(3/2) = **1** | floor(4,5/2) = **2** |
| Custode | 5 | 13 | 0 | — | **0** | **0** |

(Costo dell'aggiunta = `round(costo base × fattore di vita)` con `m_danno` ricalcolato senza imparabile: statua minore `round(4/1,5 × 0,6)` = 2; guardia `round(3 × 0,6)` = 2; vespa `round(2 × 0,5)` = 1.)

**B4. Evitabilità a piedi degli imparabili (R6 di `nemici.md`)**

`t_uscita_peggiore = (d_uscita + 14) / 220 ≤ t_ant + t_lamp − 250 − 150`

| Attacco | `d_uscita_peggiore` (+14 di corpo) | `t_uscita` | `t_ant + t_lamp − 400` | Esito |
|---|---|---|---|---|
| Caduta dei Quattro Canti (R 100) | 100 + 14 = 114 px | 518 ms | 550 | ok |
| Colpo d'ali (R 160, 80°) | 160 · sin 40° + 14 = 116,8 px | 531 ms | 550 | ok (stretto) |
| Pugno di marmo (R 150, 60°) | 150 · sin 30° + 14 = 89 px | 405 ms | 600 | ok |
| Pioggia di lastre (zone R 60) | 60 + 14 = 74 px | 336 ms | 450 | ok |
| Abbraccio (R 120 dal centro; Ferruccio a ≥ 62 dal centro) | 120 + 14 − 62 = 72 px | 327 ms | 650 | ok |
| Fili tesi (linee larghe 20 px) | 10 + 14 = 24 px | 109 ms | 550 | ok |
| Scacchiera (casella 64 px) | 32 + 14 = 46 px | 209 ms | 650 | ok |
| Scacchiera, secondo impulso (da 200 ms dopo il primo a 1000 ms) | 46 px | 209 ms | 800 − 400 = 400 | ok |

Poiché l'anticipo degli imparabili non scala in Fase 2 (B2), il controllo vale in entrambe le fasi.

**B5. Durata attesa del duello e danni attesi**

`T_reale = (T_netto/2) / u_1 + (T_netto/2) / u_2 + 2 s` con `u_1` = 0,50, `u_2` = 0,46 (frazione del tempo in cui Ferruccio sta colpiendo davvero; stime dai cicli sopra, da verificare col bot)

| Boss | T_netto | T_reale | Minuti |
|---|---|---|---|
| Gatto | 59,6 s | 29,8/0,50 + 29,8/0,46 + 2 = 126 s | 2,1 |
| Regina | 64,8 s | 32,4/0,50 + 32,4/0,46 + 2 = 137 s | 2,3 |
| Madre | 70,4 s | 35,2/0,50 + 35,2/0,46 + 2 = 149 s | 2,5 |
| Tessitrice | 80,0 s | 40,0/0,50 + 40,0/0,46 + 2 = 169 s | 2,8 |
| Custode | 89,8 s | 44,9/0,50 + 44,9/0,46 + 2 = 189 s | 3,2 |

`E[maschere perse] = N_attacchi × p_colpo × danno_medio`, con `N_attacchi = T_reale / T_attacco_medio` (≈ 3,4 s) e `danno_medio` ≈ 1,2: per il Gatto 126 / 3,4 = 37 attacchi × 0,04 × 1,2 = **1,8 maschere**. Obiettivo di playtest per tutti i boss: mediana 1,5-2,5 maschere perse, non più di 4 nel 90° percentile.

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| Un colpo porterebbe la vita da 145 a 135 con soglia 140 | la vita resta a 140 e parte la Transizione | la fase 2 deve sempre esistere |
| Colpo durante la Transizione | scintilla bianca, nessun danno, nessun hit-stop | invulnerabilità |
| Soglia raggiunta durante lo Stordito | la Transizione annulla lo Stordito; immunità per tutta la Transizione | una sola animazione alla volta |
| Parata a un colpo in corpo a corpo durante l'immunità allo Stordito | danno 0, controcolpo e ricarica dello scatto, ma nessuno Stordito | anti parry-farming, la parata resta premiata |
| Parata di un proiettile del boss | riflesso con 6 danni al boss, nessuno Stordito | evita catene di stordimenti |
| Parata di due colpi di una Raffica nella stessa finestra | entrambi riflessi | `combattimento.md` |
| Ferruccio resta a > 600 px per 4000 ms | i pattern a distanza pesano ×3; il Custode salta alla Raffica | chi fugge non rimanda gli attacchi |
| Ferruccio resta entro 130 px dalla Madre per 2500 ms cumulativi | parte l'Abbraccio | il corpo a corpo prolungato ha un prezzo |
| Pattern di zone (lastre) con posizioni fuori dall'arena | le zone si ricampionano fino a 8 volte, poi scivolano dentro | niente zone nei muri |
| Le lastre/Caduta cadono su un ostacolo | l'area si applica comunque: gli ostacoli non proteggono dagli imparabili | leggibilità |
| Evocazione con tetto pieno | pattern non estratto, si sceglie un altro | tetto rigido |
| Boss in Transizione e le aggiunte muoiono | niente bottino, niente cuori | anti-farming |
| Ferruccio e il boss muoiono nello stesso frame | vince Ferruccio | regola di risoluzione |
| Ferruccio muore durante il duello | risveglio in Piazza Dante (GDD ciclo); il boss riparte da vita piena nella prossima notte; nessun checkpoint | pilastro 2 e semplicità |
| Il flag `gregorio` è `null` allo scontro | si tratta come `attacco` | caso difensivo |
| Boss già battuto in una notte precedente | si rifà con vita piena; le scene di storia non si ripetono; il drop è un dono d'oro | roguelike, pilastro 2 |
| Custode e dissoluzione | non c'è anima del ricordo: c'è la scena della morte; il mantello rosso resta | bibbia §VII |
| Spazio ristretto vicino al muro per il Cuneo | il cuneo non attraversa i muri; l'area si ferma al muro | coerenza |
| Doni che aumentano il dps oltre P(n) | il duello si accorcia, la vita non scala sui doni | i doni devono contare |
| Degenerato: camping dietro un pilastro contro i pungiglioni | i pungiglioni si fermano contro i pilastri, ma la regina sorvola e passa al Colpo d'ali (F2) o alla Picchiata | il riparo funziona solo da una linea |
| Degenerato: parry-farming | 5000 ms di immunità allo Stordito e riflesso senza stun | un trucco non vale la partita |
| Degenerato: attaccare solo a distanza | l'affondo del Custode e i pattern ravvicinati sono fissi: un giocatore a distanza prende la Raffica (parabile) | nessuna strategia unica |
| Il boss è fuori dalla camera | l'arena ha dimensioni fisse e la camera la inquadra intera (GDD camera) | pilastro 1 |
| La Tessitrice e Ferruccio senza scatto | ogni imparabile è evitabile a piedi (B4) | il capitolo inizia prima del dono di Agnese |

## Dependencies

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| Nemici e IA | This depends on Nemici | regole del telegrafo, direttore, archetipi evocati, `B(n)` |
| Combattimento | This depends on Combattimento | parata, riflesso, controcolpo, peso, hit-stop |
| Stato narrativo | This depends on Stato | flag `gregorio`, scrive `boss_battuti` |
| Ricordi con scelta | Ricordi depends on this | quale ricordo lasciare, quando |
| Incontri e dialoghi | Incontri depends on this | evento `dopo-boss:<id>` |
| Stanze e porte | This depends on Stanze | stanza doppia 18 × 10, chiusura porte |
| Generazione dei piani | Generazione depends on this | il boss chiude il piano, uscita che si apre alla fine |
| Rendering a teatro delle ombre | Rendering depends on this | pezzi (9-12), perforazioni, dissoluzione, luci (≤ 8) |
| Economia | Economia depends on this | monete, scintille, cuore |
| HUD | HUD depends on this | barra di vita con tacca al 50% |
| Camera | This depends on Camera | inquadrare 1152 × 640 px |
| Finali e mondo dopo | Finali depends on this | `custode` battuto; il Custode e Violante |
| Audio sintetico | Audio depends on this | eventi di pattern e transizione |
| Controllo di Ferruccio | This depends on Controllo | `v_base`, scatto, invulnerabilità |

## Tuning Knobs

Tutti i valori in `gioco/contenuti/parametri/boss.json` (sezioni `globali`, `boss.<id>.fase1`, `boss.<id>.fase2`, `pattern`).
Categorie: **F** = feel, **C** = curve, **G** = gate.

| Parameter | Cat. | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|-----|--------------|------------|-------------------|-------------------|
| `T_obj` per boss | C | 60 / 65 / 70 / 80 / 90 s | 60–90 | duelli più lunghi | più brevi |
| `P(n)`, `k_P` | C | 1 + 0,15(n−1) | 0,10–0,25 | vita boss più alta | — |
| soglia di fase | G | 50% | 40–60% | fase 2 più breve | più lunga |
| durata Transizione | F | 2000 ms | 1500–3000 | più respiro | più teso |
| `k_f2` | F | 0,15 | 0,10–0,25 | fase 2 più veloce | — |
| coefficiente anticipo parabili F2 | F | 0,90 | 0,80–1,0 | — | anticipi più corti (mai sotto 300) |
| coefficiente recupero e pausa F2 | F | 0,85 | 0,75–1,0 | meno pressione | più pressione |
| Stordito boss | F | 900 ms | 600–1200 | parata più forte | — |
| Immunità allo Stordito | G | 5000 ms | 3000–8000 | meno parry-farming | più farming |
| `molt_riflesso_boss` | F | ×3 (danno 6) | ×1–×5 | parata più premiata | — |
| `hs_colpo_boss` | F | 30 ms | 20–50 | più peso | più fluido |
| tetto aggiunte `f_agg` | G | 0,5 / 0,5 / 0,5 / 0,25 / 0 | 0–0,75 | più aggiunte | meno |
| `m_fase` F2 | G | 1,5 | 1,0–2,0 | — | — |
| tetto assoluto aggiunte | G | 6 | 3–8 | più sagome in scena | meno |
| pausa base tra pattern | F | 900 ms (500 se vicino) | 600–1500 | meno pressione | più pressione |
| arena | G | 18 × 10 celle | 16 × 9 – 20 × 11 | più spazio | meno |
| Ingresso | G | 1000 + 1500 ms | 500–2500 | — | — |
| Custode: soglia esitazione | F | 8% (F1), 6% (F2) | 4–12% | più finestre | meno |
| Custode: durata esitazione | F | 700 ms | 400–1000 | più finestre | — |
| Custode: Alzata (`attacco`) | F | 1500 ms | 800–2000 | primo colpo più grande | — |
| Custode: distanza di apertura (`dialogo` / `attacco`) | F | 150 / 100 px | — | — | — |
| Scacchiera: raggio, intervallo F2 | F | 320 px, 1000 ms | 240–400, 800–1200 | — | — |
| pattern: tutti i tempi per scheda | F | tabelle | vincoli R2, R3, R4, R6 | — | — |
| drop del boss | C | cuore 1, monete 10 + 5(n−1), scintille 2n | — | — | — |

## Game Feel

### Feel Reference
Il boss come danza: la lettura di *Hollow Knight* (ogni attacco ha una forma riconoscibile), la
sicurezza di *Sekiro* sulla parata, l'arena pulita di *Hades* (Teseo). Anti-riferimento: boss che
saltano da una fase all'altra senza che il giocatore capisca il perché.

### Input Responsiveness
| Action | Max Input-to-Response Latency (ms) | Frame Budget (at 60fps) | Notes |
|--------|-----------------------------------|------------------------|-------|
| Cambio di sagoma all'anticipo | 17 | 1 | un pezzo ruota di ≥ 40° |
| Lampo (perforazioni rosse + anello) | 17 | 1 | partenza nello stesso frame di `t_lamp` |
| Parata riuscita contro il boss | 33 | 2 | hit-stop 90 ms, anello, scossa 6 px |

### Animation Feel Targets
| Animation | Anticipo (frame) | Lampo (frame) | Colpo (frame) | Recupero (frame) | Feel Goal |
|-----------|-----------------|--------------|--------------|-----------------|-----------|
| Gatto: Balzo grande | 33 | 19 | 16 | 78 | grande, leggero a sorpresa |
| Regina: Picchiata | 31 | 18 | 18 | 84 | aerea, nervosa |
| Madre: Pugno di marmo | 39 | 21 | 11 | 90 | pesante, lenta |
| Tessitrice: Fili tesi | 36 | 21 | 8 | 84 | teso, geometrico |
| Custode: Fendente | 30 | 18 | 10 | 42 | meccanico, regolare |

### Impact Moments
| Impact Type | Duration (ms) | Effect Description | Configurable? |
|-------------|--------------|-------------------|---------------|
| Hit-stop colpo al boss | 30 | lampo bianco sul pezzo colpito | Yes |
| Transizione | 2000 | scossa 8 px, il pezzo grande cambia | Yes |
| Esitazione del Custode | 700 | asta giù, giglio lampeggia due volte | Yes |
| Dissoluzione | 3000 | anime che salgono; una più grande | Yes |
| Caduta del Custode | 2500 | armatura che si apre, giglio spezzato | Yes |

### Weight and Responsiveness Profile
- **Peso**: i boss non si spostano mai; Ferruccio sente il peso dai colpi che si fermano a contatto.
- **Ritmo**: una pausa → un attacco → un recupero: il giocatore impara a contare. Il Custode è
  un metronomo, gli altri hanno la variazione di un'estrazione pesata.
- **Fallimento**: ogni colpo subito è attribuibile a un lampo o a un segno a terra.
- **Leggibilità**: una sola cosa pericolosa per volta in primo piano; le luci della stanza
  (≤ 8) non cambiano mai la leggibilità dei tratteggi.

### Feel Acceptance Criteria
- [ ] Il tester descrive il Gatto come «imparo e miglioro» entro tre tentativi.
- [ ] Nessun tester dice «non ho capito cosa mi ha colpito» per un boss.
- [ ] Alla transizione di fase il tester dice di avere capito che «ora è più veloce» senza leggerlo.
- [ ] Almeno 6 tester su 10 notano che il Custode esita, e nessuno lo descrive come un bug.

## Acceptance Criteria

- [ ] **GIVEN** `boss.json`, **WHEN** un test calcola `vita_boss = round_5(4,7 × T_obj × P(n))`, **THEN** valgono 280, 350, 430, 545, 675 e ogni T_netto = vita / (4,7 × P) sta in [60, 90] s.
- [ ] **GIVEN** il Gatto con vita 280, **WHEN** la sua vita arriva a ≤ 140, **THEN** parte la Transizione di 2000 ± 17 ms con vita bloccata a 140, i colpi non fanno danno, le aggiunte e i proiettili spariscono entro 600 ms, e la Fase 2 carica i valori nuovi. **GIVEN** vita 145 e un colpo da 10, **THEN** la vita è 140, non 135.
- [ ] **GIVEN** qualunque pattern di qualunque boss, **WHEN** si legge il data file, **THEN** `t_lamp ≥ 280` (parabili) o ≥ 350 (imparabili), `t_ant ≥ 300` (250 solo secondi di catena), ogni pattern ha un pezzo con `rotazione_anticipo ≥ 40°`, e i tempi in Fase 2 rispettano B2 (anticipo parabili ×0,90, recupero ×0,85, lampo e colpo invariati, anticipo imparabili invariato).
- [ ] **GIVEN** il Gatto in Fase 2, **WHEN** si leggono i valori scalati, **THEN** velocità 150 ± 1 px/s, Balzo grande anticipo 495 ± 1 ms e recupero 1105 ± 1 ms, Caduta recupero 1275 ± 1 ms, lampo del Balzo 320 ms.
- [ ] **GIVEN** la Regina in 600 s di simulazione, **THEN** le vespe vive non superano 4 in Fase 1 e 6 in Fase 2 e, a tetto pieno, la Nube non viene mai estratta. **GIVEN** B3, **THEN** i tetti calcolati sono 2/3, 4/6, 2/3, 1/2, 0/0.
- [ ] **GIVEN** ogni imparabile (Caduta, Colpo d'ali, Pugno di marmo, Lastre, Abbraccio, Fili tesi, Scacchiera con entrambi gli impulsi), **WHEN** un bot a 220 px/s che reagisce dopo 250 ms parte dalla posizione peggiore, **THEN** esce dall'area senza danno in 200 prove su 200, in Fase 1 e in Fase 2.
- [ ] **GIVEN** il Gatto, **WHEN** Ferruccio para il Graffio a ventaglio, **THEN** il Gatto è in Stordito per 900 ± 17 ms, e **WHEN** para un altro colpo in corpo a corpo entro 5000 ms dalla fine dello Stordito, **THEN** danno 0, controcolpo attivo, scatto ripristinato, nessuno Stordito.
- [ ] **GIVEN** un proiettile della Regina, **WHEN** Ferruccio para, **THEN** il proiettile torna indietro e fa 6 danni alla Regina senza stordirla.
- [ ] **GIVEN** `gregorio = dialogo`, **WHEN** parte `reggia.scontro-custode`, **THEN** il controllo passa con Ferruccio a 150 ± 5 px e il lampo del Fendente a 800 ± 17 ms. **GIVEN** `gregorio = attacco`, **THEN** Ferruccio è a 100 ± 5 px e Gregorio non attacca per 1500 ± 17 ms.
- [ ] **GIVEN** il Custode in Fase 1, **WHEN** Ferruccio gli ha inflitto 54 danni dall'ultima esitazione, **THEN** alla pausa seguente Gregorio entra in Esita per 700 ± 17 ms (asta ruotata di ≥ 40° verso il basso, nessun attacco) e poi riprende la sequenza dal pattern dovuto; in Fase 2 la soglia è 41 danni.
- [ ] **GIVEN** il Custode, **WHEN** si registra la sequenza dei pattern per 10 cicli, **THEN** è identica a ogni ciclo (`F,F,A,R,S` in F1; `F,A,R,S2` in F2) e gli intervalli tra gli inizi dei pattern variano al massimo di 1 frame.
- [ ] **GIVEN** il Custode, **WHEN** subisce un colpo, **THEN** il giglio emette un lampo bianco di 80 ± 17 ms; **WHEN** inizia la Raffica, **THEN** il giglio è rosso con anello per 350 ± 17 ms prima del primo colpo.
- [ ] **GIVEN** `gregorio = dialogo` e `gregorio = attacco`, **WHEN** un bot di riferimento sconfigge il Custode 50 volte per ciascun caso, **THEN** la differenza della durata media è < 3%.
- [ ] **GIVEN** la Scacchiera in Fase 2, **WHEN** parte, **THEN** i due graticci sono visibili dall'inizio dell'anticipo, con «1» e «2» stampati nelle caselle, e il secondo impulso arriva 1000 ± 17 ms dopo il primo.
- [ ] **GIVEN** un boss con vita 0, **WHEN** muore, **THEN** `boss_battuti` contiene il suo id prima che l'animazione sia finita, `scena dopo-boss:<id>` parte dopo la dissoluzione (3000 ± 17 ms; per il Custode dopo la sequenza di 2500 ms), e le porte si aprono.
- [ ] **GIVEN** `tonino_ricordo = null`, **WHEN** il Gatto muore, **THEN** compare l'anima del ricordo di Rosa e il Medaglione; **GIVEN** il flag deciso, **THEN** compare un dono d'oro dal pool. Lo stesso per `taddeo` (Regina), `registro` (Madre), `agnese` (Tessitrice), `violante` (Custode, il Fazzoletto).
- [ ] **GIVEN** Ferruccio che vince e muore nello stesso frame, **THEN** la notte continua con la vittoria.
- [ ] **GIVEN** il Custode morto, **THEN** il mantello rosso resta sulla scena fino alla fine di `reggia.custode-sconfitto` e non si dissolve.
- [ ] **GIVEN** il piano di prova, **WHEN** un bot di riferimento (reazione 250 ms, parata riuscita nel 60% dei casi) sfida ogni boss, **THEN** la durata reale sta in [100, 220] s e la mediana delle maschere perse (20 notti di playtest) è tra 1,5 e 2,5.
- [ ] **GIVEN** ogni arena, **THEN** misura 18 × 10 celle (1152 × 640 px) e usa al massimo 8 luci; spegnendo tutte le luci, ogni segno a terra resta visibile (screenshot in scala di grigi con soglia sui tratteggi).
- [ ] **GIVEN** i data file, **THEN** nessun testo parlato dei boss è nel codice o nei file: le battute vengono solo da `storia.json`.
- [ ] Prestazioni: boss con 6 aggiunte e 20 proiettili entro 1,5 ms per frame.
- [ ] Nessun valore di questo documento è nel codice: tutto in `contenuti/parametri/boss.json`.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| **Senza doni i boss dei piani 3-5 durano 92-144 s netti** (B1): il bilanciamento presuppone `P(n)`. Se i doni arrivano più lentamente, abbassare `T_obj` o la pendenza di `k_P` | systems-designer | `doni-modificatori.md` | provvisorio |
| La durata reale dei duelli (2,1-3,2 min) può essere lunga per un roguelike da 20-40 minuti a notte. `u_1` e `u_2` sono stime da cicli ipotetici | game-designer | prototipo | misurare col bot; se serve, abbassare `T_obj` a 60 per tutti |
| **Lo scatto base** (decisione del 10/10 lo lega alla sciarpa): la Tessitrice e il Custode (se `agnese = sognante`) si affrontano senza. Tutti gli imparabili sono evitabili a piedi (B4) | autore | prima del prototipo | adottata la regola R6 in ogni caso |
| `ricordi-scelta.md` assegna ricordi (Spada di legno, Sciarpa) a boss per i quali `storia.json` non ha `oggetti`; la sciarpa lasciata dalla Tessitrice contrasta con `san-leucio.dono-sciarpa` | narrative-director | alpha | in `ricordi-scelta.md` come *Provisional* |
| «Anime colorate» della bibbia contro la palette dell'art bible (azzurro, oro, rosso, crema) | art-director | prima del prototipo | qui: valori diversi di azzurro e crema |
| Le forme dei pezzi del Gatto (finestre a forma di oggetti domestici), la gonna a pagine della Regina, il giglio sulla Tessitrice sono proposte visive | art-director | prima del prototipo | — |
| `hs_colpo_boss` = 30 ms è una deroga a `combattimento.md` (50 ms) | game-designer | prototipo | proposta: riportare nel combattimento |
| Camera: 1152 × 640 px interi richiedono uno zoom o una scala diversi dalla stanza standard | lead-programmer | `camera-stanza.md` | — |
| I valori di bottino (cuore, monete, scintille) sono provvisori | economy-designer | `economia.md` | — |
| Il costo del dialogo per il Custode è solo narrativo (nessuna deroga meccanica); se la differenza sembra troppo piccola, aumentare la Alzata di `attacco` | game-designer | prototipo | misurare con il bot (< 3%) |
