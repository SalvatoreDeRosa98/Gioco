# Stanze e porte

> **Status**: Draft
> **Author**: level-designer (sessione autonoma; `game-designer`, `creative-director`, `systems-designer`, `art-director`, `qa-lead` non consultati — Solo mode. Rivedere a mano prima della produzione. Nessun valore è stato provato in gioco né simulato: sono punti di partenza da tarare nel prototipo)
> **Last Updated**: 2026-11-07
> **Last Verified**: 2026-11-07
> **Implements Pillar**: 1 Leggibile al buio · 2 La notte ricomincia, la storia no · 4 Fatto di ombra e luce

## Summary

La singola stanza: una griglia di 13×7 celle con quattro porte, che si chiudono quando nascono i
nemici e si riaprono quando la stanza è libera. Definisce i sette tipi di stanza, cosa blocca il
passo e cosa blocca i colpi, i pericoli che si leggono in sagoma, dove nascono i nemici (mai
addosso a Ferruccio), la ricompensa alla chiusura e la regola per cui una stanza pulita resta
pulita. Il piano intero, cioè quali stanze esistono e dove, sta in `generazione-piani.md`.

> **Quick reference** — Layer: `Core/Gameplay` · Priority: `MVP` · Key deps: `Fisica e collisioni, Ciclo di gioco, Controllo di Ferruccio, Combattimento`

## Overview

Come in *The Binding of Isaac*, la partita è una sequenza di stanze a schermo intero. Ogni stanza è
13×7 celle da 64 px (832×448 px calpestabili, regola 1 di `controllo-ferruccio.md`) dentro mura
spesse una cella, con una porta al centro di ciascuno dei quattro lati. Le porte esistono solo verso
le stanze confinanti collegate dal piano; le altre sono muro. Entrando in una stanza con nemici le
porte si chiudono; quando l'ultimo nemico si dissolve in anima, compare la ricompensa e le porte si
riaprono. Una stanza può anche essere doppia (2×1, 26×7 celle) e, a seconda del tipo, ospita
combattimento, un dono su un piedistallo, il banchetto di Tonino, un boss, una stanza segreta dietro
una finestra accesa, un reperto della bibbia o il punto d'arrivo del piano. Ogni ostacolo e ogni
pericolo si legge in sagoma prima di toccarlo (pilastro 1) e tutto sta su un solo piano: niente
buche, dislivelli, mensole o salti (anti-pilastro).

## Player Fantasy

Entrare in un diorama e capirlo subito: dove sono le porte, cosa è muro e cosa è pericolo, da dove
sta per uscire qualcosa. Il giocatore deve sentire che la stanza è un piccolo teatro che si stringe
quando le porte diventano inchiostro e si apre di nuovo, con la soglia d'oro, quando ha vinto. Ogni
danno subito dall'ambiente era leggibile e ogni stanza già pulita è un posto sicuro in cui tornare
senza ripetere nulla.

## Detailed Design

### Core Rules

**A. Geometria**

1. **Dimensioni**. Stanza semplice (`1x1`): 13×7 celle da 64 px, cioè 832×448 px calpestabili. Stanza
   doppia (`2x1`, solo orizzontale): 26×7 celle, cioè 1664×448 px, senza muro tra le due metà. Il
   muro perimetrale è spesso una cella (64 px) ed è sempre pieno. Le celle hanno coordinate
   `(c, r)` con `c` da 0 a 12 (o 25) e `r` da 0 a 6, origine in alto a sinistra.
2. **Un solo piano**. Ogni cella è allo stesso livello. Nessuna cella ha quota, nessuna buca,
   nessuna mensola: `pozza` e `rigagnolo` sono decalcomanie di pavimento, `grata` è una barriera in
   piedi (regola 13). L'unica cosa che si attraversa a "salto" è lo scatto di
   `controllo-ferruccio.md`, che è un movimento a terra.
3. **Slot delle porte**. Il passaggio è largo una cella. Centri: `N` e `S` alla colonna 6, `W` e `E` alla
   riga 3. La stanza doppia ha `N0`/`S0` alla colonna 6, `N1`/`S1` alla colonna 19, `W` alla riga 3 della
   metà sinistra, `E` alla riga 3 della metà destra. Uno slot è una porta solo se il piano collega
   quella stanza alla vicina (GDD `generazione-piani.md`); altrimenti è muro.
4. **Vestibolo**. Le due celle interne davanti a ogni slot di porta (`vestibolo_celle` = 2) sono
   sempre libere: niente ostacoli, niente pericoli, niente punti di nascita. Vale per tutti e quattro
   gli slot anche se la porta non c'è, così qualunque combinazione di porte funziona con qualunque
   modello.

**B. Porte**

5. **Stati**: `aperta`, `chiudendo`, `chiusa`, `aprendo` (tabella in States). Una porta `chiusa` è un
   muro: blocca Ferruccio, i nemici e i proiettili.
6. **Chiusura**. In una stanza con nemici da nascere, le porte iniziano a chiudersi
   `t_chiusura_porte` dopo l'arrivo di Ferruccio, mentre i segnalini di nascita sono ancora visibili
   (regola 22). La chiusura dura `t_anim_porta`. Se Ferruccio occupa la cella di una porta (anche in
   parte) quando dovrebbe chiudersi, la chiusura aspetta che l'abbia lasciata. Se esce dalla stanza
   prima della chiusura, la stanza torna `non_visitata` e i segnalini si dissolvono (può sbirciare).
7. **Riapertura**. Quando l'ultimo nemico è morto e non restano nascite in coda, dopo
   `t_ritardo_apertura` le porte passano ad `aprendo` e poi ad `aperta`. Prima della riapertura i
   proiettili ancora in volo sono rimossi.
8. **Lettura delle porte** (pilastro 1, art bible §2 e §3). Porta aperta: arco a tutto sesto con
   soglia d'oro, la sola cosa più luminosa del pavimento dopo le lanterne. Porta chiusa: pannello di
   inchiostro pieno; durante il combattimento le lanterne laterali calano del 30% e resta il cerchio
   di luce al centro. La cornice dell'arco rivela il tipo della stanza di destinazione
   (`porta_rivela_tipo` = sì): lanterna sull'arco per tesoro, tenda a strisce per banchetto, arco
   doppio e più alto per boss, soglia azzurra per stanza-ricordo (l'azzurro significa ricordo).
   Le sagome definitive sono una proposta da confermare con l'`art-director`.

**C. Tipi di stanza**

9. I tipi sono sette. Ogni piano ne contiene esattamente uno di ingresso, tesoro, banchetto,
   ricordo e boss; le normali sono le altre, la segreta è facoltativa (probabilità e quantità in
   `generazione-piani.md`).

| Tipo | Dimensioni | Nemici | Porte | Contenuto | Mood (art bible §2) |
|------|-----------|--------|-------|-----------|--------------------|
| `ingresso` | 1×1 | nessuno | sempre aperte | punto d'arrivo di Ferruccio al centro `(6,3)`, soglia del quartiere come scenografia | esplorazione, energia 2 |
| `normale` | 1×1 o 2×1 | sì, a ondate | si chiudono | combattimento, ricompensa alla chiusura | esplorazione → combattimento, energia 2 → 4 |
| `tesoro` | 1×1 | nessuno | sempre aperte | un piedistallo al centro `(6,3)` con un dono sotto un cono di luce | bottega, energia 1 |
| `banchetto` | 1×1 | nessuno | sempre aperte | banco di Tonino in alto, Tonino su basetta, lanterna | banchetto di Tonino, energia 2 |
| `boss` | 1×1 | il boss | una sola, si chiude | arena quasi vuota, boss opposto alla porta, uscita del piano a fine scontro | boss, energia 5 |
| `segreta` | 1×1 | nessuno | solo la finestra aperta | una ricompensa fissa (regola 11) | bottega, energia 1 |
| `ricordo` | 1×1 | nessuno | sempre aperte | un reperto al centro legato a una scena di `storia.json` (regola 10) | stanza di raccoglimento, energia 1 |

10. **Stanza-ricordo**. Al centro `(6,3)` c'è un **reperto** (un oggetto in sagoma legato al luogo: la
    targa, la vetrina, la lastra di marmo, la sciarpa sul telaio, il catafalco; la sagoma è una
    proposta per l'`art-director`). Il piano assegna alla stanza un `scena_id` (tabella in
    `generazione-piani.md`). Con il tasto interagisci (regola 9 di `controllo-ferruccio.md`) davanti al
    reperto, `incontri-dialoghi.md` esegue la scena `scena_id`. Le battute stanno in `trama/storia.json`:
    questo GDD non ne contiene. Poiché la stanza non ha nemici, il dialogo avviene a porte aperte.
    **Pilastro 2**: se la scena è già nel profilo come vista (`stato-narrativo.md`), non si ripete; il
    reperto compare nello stato `rivisto` (sagoma con alone azzurro spento) e l'interazione non fa
    nulla. La stanza resta generata comunque, così il piano non dipende dal profilo (GDD
    `generazione-piani.md`, regola sul determinismo).
11. **Stanza segreta**. Si raggiunge solo colpendo una **finestra accesa** nel muro della stanza
    vicina, nello slot di porta rivolto verso la segreta. La finestra è un rettangolo d'oro sul
    muro senza sagoma dentro (le finestre con sagoma sono persone ricordate, art bible §2). Ha
    `vita_finestra` punti e subisce `danno_colpo` (formula di `combattimento.md`) a ogni colpo di
    Ferruccio: con il danno base servono tre fendenti o due affondi (floor(2,5) = 2 ciascuno). Non
    risponde ai colpi mentre la stanza ha nemici. Aperta, diventa un arco con soglia d'oro (porta
    `aperta` permanente). Contenuto, scelto con `rng_ric` della stanza: `scrigno` (scintille e
    monete), `rifugio` (cuori) o `reperto` (un indizio facoltativo, attivo solo se
    `narrative-director` consegna un elenco di scene, vedi Open Questions). Pesi in Tuning Knobs.
12. **Banchetto**. Tonino è dietro il banco. L'interazione apre il banco (acquisti secondo
    `economia.md`) o la sua battuta (una per notte, secondo `incontri-dialoghi.md`). Questo GDD non
    definisce prezzi né offerte. **Tesoro**: il dono lo sceglie il pool di `doni-modificatori.md` con il
    seme della stanza; l'eventuale prezzo è di `economia.md`.

**D. Ostacoli e pericoli**

13. **Ostacoli**. Tre proprietà, tutte per cella: `ferma_passo` (blocca Ferruccio, nemici a terra e
    scatto; lo scatto si ferma contro, regola 4 di `controllo-ferruccio.md`), `ferma_volo` (blocca i
    nemici volanti, come la vespa), `ferma_colpi` (blocca i proiettili e le hitbox lineari, e nega la
    **linea di colpo**, regola 14). `vita` è il danno che l'ostacolo sopporta prima di sparire; i
    nemici non lo danneggiano.

| Id | `ferma_passo` | `ferma_volo` | `ferma_colpi` | `vita` | Note e lettura in sagoma | Quartieri |
|----|:---:|:---:|:---:|:---:|---|---|
| `colonna` | sì | sì | sì | — (indistruttibile) | fusto a fasce, capitello e base; diventa trasparente al 35% sopra gli attori dietro di lei | tutti |
| `colonna_crepata` | sì | sì | sì | 4 | come `colonna` con una crepa di luce chiara; scompare lasciando il pavimento libero | 1, 3, 5 |
| `panca` | sì | no | no | — | bassa, 1–3 celle; i colpi e i voli la superano | 1, 3 |
| `cassa` | sì | no | sì | 2 | squadrata a mano con listelli tagliati chiari; alla distruzione lascia una moneta con probabilità `p_drop_cassa` | 1, 2, 4 |
| `grata` | sì | no | no | — | inferriata a giorno: si vede e si colpisce attraverso, non si cammina | 2, 4 |
| `siepe` | sì | sì | sì | 1 | massa tonda a bordo smerlato di foglie puntinate; basta un colpo per tagliarla | 3 |
| `telaio` | sì | sì | sì | — | 2×2 celle, ordito in fili d'oro; scenografia | 4 |
| `banco` | sì | no | sì | — | solo stanza `banchetto` | 1 |
| `statua_dormiente` | sì | sì | sì | — | blocchi a 90°, linee perfette (è del Velo); a un'ondata prefissata si sveglia e diventa il nemico `statua` (regola 21) | 3, 4, 5 |

    Regola di lettura (pilastro 1, gerarchia delle forme dell'art bible): gli ostacoli inerti sono
    scenografia, a valore medio con bordo di carta chiaro; **mai inchiostro pieno**, che è riservato a
    nemici e pericoli. Così un nero sul pavimento significa sempre "fa male". Le linee perfette
    (statue, colonne del Cortile d'Onore) sono del Velo; il resto è storto a mano con il seme della
    stanza.

14. **Linea di colpo**. Un fendente (settore, `area_fendente` di `combattimento.md`) colpisce un
    nemico solo se il segmento tra il centro di Ferruccio e il centro del nemico non attraversa una
    cella con `ferma_colpi`. L'affondo e lo scatto si fermano contro ogni `ferma_passo` (edge case
    dell'affondo contro un muro). Un ostacolo con `vita` riceve `danno_colpo` una sola volta per
    colpo e mostra solo lampo bianco e scossa, senza hit-stop.
15. **Terreno**. `pozza`: ellisse irregolare a bordo ondulato con il riflesso della sola lanterna;
    nessun blocco; moltiplica per `mod_pozza` la velocità di chi cammina (Ferruccio e nemici a
    terra), mai lo scatto. Si applica **dopo** il clamp di `velocita_effettiva` e il risultato non
    scende sotto `v_min_terreno`.
16. **Pericoli ambientali**. Nessuno è parabile, nessuno ha il lampo rosso (il rosso resta del
    telegrafo dei nemici), tutti sono inchiostro pieno con ellisse d'appoggio e **zona tratteggiata**
    sul pavimento (art bible §3). Lo scatto li attraversa senza danno. Danno 1 maschera, soggetto a
    `t_invuln` di `controllo-ferruccio.md`; **possono uccidere** (`hazard_letale`). Funzionano
    anche nelle stanze pulite (`hazard_in_pulita`) e non danneggiano i nemici
    (`hazard_danneggia_nemici` = no).

| Id | Cosa fa | Come si legge | Ciclo e valori |
|----|---------|---------------|----------------|
| `braciere` | disco di fiamma attorno al piede (`r_fiamma`); il piede blocca il passo, non i colpi né il volo | piede di inchiostro con tre punte di fiamma; nel riposo la fiamma è bassa e spenta di valore; **anticipo**: la fiamma sale e il cerchio a terra compare tratteggiato; **attivo**: tratteggio fitto e fiamma alta; mai rosso | `t_riposo` → `t_anticipo` → `t_attivo`, fase iniziale a seme; danno 1 solo in attivo; spinta radiale `v_spinta` |
| `rigagnolo` (acqua del Corso) | corrente che trascina chi cammina nella direzione delle frecce, `v_corrente`; nessun danno diretto: spinge dentro nemici e altri pericoli | fascia di 1–2 celle con chevron di carta chiara che scorrono nella direzione; riflessi solo delle luci | non agisce durante lo scatto; agisce durante Colpito; non agisce sui volanti |
| `siepe_spinosa` | danno al contatto, cella attraversabile | triangoli a zigzag (la grammatica delle ombre libere), diversa dalla `siepe` tonda | danno 1 ogni `t_invuln` finché ci si sta sopra; spinta piccola |

    Ogni modello rispetta la regola di **percorribilità sicura** (regola 25): le porte restano
    collegate tra loro senza toccare zone di pericolo.

**E. Ondate e nascita dei nemici**

17. **Numero di nemici**: formula `n_nemici` (sezione Formulas) in funzione di piano, profondità e
    modello. Un élite conta `conto_elite` nemici.
18. **Ondate**: da 1 a 3 secondo `n_nemici` (formula `ondate`). La successiva comincia quando i vivi
    sono ≤ `soglia_ondata` e sono passati almeno `t_pausa_ondata`, oppure quando sono passati
    `t_ondata_max` dall'inizio dell'ondata corrente (anti-stallo, 0 = spento). Mai più di
    `n_max_vivi` nemici vivi insieme: le nascite eccedenti aspettano.
19. **Composizione**. Il modello ha una `tavolozza` (tipo, peso, minimo, massimo). Con `rng_comp` si
    estraggono prima i minimi, poi per pesi fino a `n_nemici`. I tipi ammessi sono quelli di
    `nemici.md` per quel piano; nell'MVP: `gatto`, `vespa`, `statua`, `guardia`.
20. **Dove nascono**. Il modello elenca `spawn`, celle libere con un tipo: `T` (a terra) o `V` (a terra
    o a mezz'aria sopra ostacoli bassi, per i volanti). Un punto è **valido** (formula
    `punto_valido`) solo se: sta fuori dall'**anello di sicurezza** `r_sicurezza` attorno a Ferruccio;
    sta a `d_porta_min` almeno da ogni porta; non è nel vestibolo, in un ostacolo o in una zona di
    pericolo; sta a `d_min_spawn` da un'altra nascita nella stessa ondata. I punti validi si scelgono
    nell'ordine di una permutazione ottenuta con `rng_spawn`: il primo valido vince.
21. **Sequenza di nascita**. Per ogni nemico: **segnalino** per `t_marker` (cerchio tratteggiato con
    la sagoma d'ombra che si alza dal pavimento, mai rosso); comparsa; **inerzia** per `t_inerte`
    (può essere colpito, non attacca e non fa danno da contatto). Alla comparsa il punto è
    ricontrollato con `r_sicurezza_apparizione`: se Ferruccio è entrato nell'anello, la comparsa
    aspetta fino a `t_ritardo_max_spawn` e poi passa al prossimo punto valido; se non ne esistono,
    nasce nel punto più lontano, mai a meno di `r_min_assoluto`. La `statua_dormiente` si sveglia
    all'ondata indicata dal modello (`risvegli`), con un'animazione di `t_risveglio_statua`
    senza danno da contatto, e conta come uno dei `n_nemici`.
22. **Tempi della stanza**: arrivo, segnalini visibili subito; a `t_chiusura_porte` le porte iniziano
    a chiudersi; a `t_marker` compaiono i nemici. Le porte sono quindi già chiuse prima che il
    primo nemico sia in campo.

**F. Ricompense alla chiusura**

23. **Valore e tipo**. La ricompensa di ogni stanza è decisa (pre-estratta) alla creazione del piano
    con `rng_ric` della stanza, non alla chiusura: così non dipende da come si combatte e il
    generatore può verificare il vincolo sulle stanze consecutive senza ricompensa. Formula
    `valore_ricompensa` (Formulas). Il valore, in **unità**, è convertito in oggetti: moneta di luce
    = 1 unità, scintilla = 3, cuore (maschera) = 4; si estrae finché restano unità, tra i tipi
    il cui costo sta nel residuo, con i pesi `peso_oggetto`. Il significato di una unità (quanti
    soldi, quanta cura) è di `economia.md`.
24. **Consegna**. Alla morte dell'ultimo nemico: dopo `t_ricompensa` gli oggetti compaiono attorno a
    `(6,3)` (al centro della stanza doppia, `(12,3)`), sparsi con `rng_ric` entro 48 px, spostati
    alla cella sicura più vicina se il punto cade su ostacolo o pericolo. Gli oggetti **restano a
    terra** finché non sono raccolti (regola 26). Un cuore a maschere piene resta a terra (regola 9
    di `controllo-ferruccio.md`). Nei tipi non di combattimento: tesoro = il dono; banchetto = il
    banco; segreta = contenuto della regola 11; ricordo = il reperto (`unita_ricordo` = 0, nessuna
    ricompensa in unità, perché la ricompensa è la scena); boss = anima (scena di `storia.json`,
    vedi tabella nel GDD `generazione-piani.md`), `valore_ricompensa` con moltiplicatore boss e
    **uscita del piano**: un arco al centro, attivo quando `boss.md` dichiara chiusa la scena.
    Che il boss lasci anche un dono è una domanda aperta.

**G. Stanze pulite e stato salvato nella run**

25. **Percorribilità**. Il caricamento di un modello fallisce (errore, non avviso) se: una cella dei
    vestiboli non è libera; una porta non è raggiungibile da un'altra porta passando solo per celle
    libere da ostacoli `ferma_passo` e da zone di pericolo; una cella di `spawn` non è libera o non
    è raggiungibile dalle porte; ci sono meno di `spawn_min_1x1` (o `spawn_min_2x1`) punti di
    nascita; una griglia non è 13×7 (26×7); un simbolo è sconosciuto; una cella ha più di uno
    strato.
26. **Stanze pulite restano pulite**. Una stanza `pulita` è un invariante:
    - non nasce mai più un nemico (nessun ritorno, `p_ritorno` = 0);
    - le porte sono sempre `aperte` (la sola eccezione è la stanza `boss` fino al termine della scena);
    - gli ostacoli distrutti restano distrutti, la finestra aperta resta aperta;
    - gli oggetti non raccolti restano dove sono, fino a `max_oggetti_persistiti` (24);
    - i dialoghi consumati (reperto, banchetto) restano consumati;
    - i pericoli ambientali continuano a funzionare (regola 16).
    Alla nuova notte tutto si azzera, perché il piano è nuovo; non si azzera mai ciò che sta nel
    profilo narrativo (pilastro 2).
27. **Stato della stanza nella run**. Ogni stanza ha un `StatoStanza` serializzabile, indicizzato
    dall'id della stanza del piano:

```json
{
  "id": "r3",
  "stato": "pulita",
  "visitata": true,
  "ondata": 2,
  "ostacoli_distrutti": [4, 9],
  "finestre_aperte": ["E"],
  "oggetti": [{"tipo": "moneta", "x": 410, "y": 224, "valore": 1}],
  "ricompensa_data": true,
  "consumata": false
}
```

    `stato` è `non_visitata`, `in_corso` o `pulita`. I semi della stanza non si salvano: si ricavano
    dal piano (`generazione-piani.md`). **Punto di salvataggio**: ingresso in una stanza (prima
    della chiusura delle porte) e stanza pulita; non si salva a metà combattimento. Riprendere una
    notte salvata in una stanza `in_corso` riporta Ferruccio sull'arco da cui era entrato, con la
    stanza `non_visitata` e gli stessi semi, quindi la stessa composizione e gli stessi punti di
    nascita; il contratto con `salvataggio.md` è il tipo qui sopra.

**H. Modelli di stanza**

28. Un modello è un file JSON in `contenuti/stanze/` (nessun modello è nel codice):

```json
{
  "id": "pd-n-03",
  "tipo": "normale",
  "dim": "1x1",
  "piani": [1, 2],
  "difficolta": 2,
  "tag": ["colonne", "centro_libero"],
  "peso_base": 1.0,
  "griglia": [
    ".............",
    "..C.......C..",
    ".............",
    "......P......",
    ".............",
    "..C.......C..",
    "............."
  ],
  "spawn": [
    {"c": 3, "r": 1, "tipo": "T"}, {"c": 9, "r": 1, "tipo": "T"},
    {"c": 4, "r": 2, "tipo": "T"}, {"c": 8, "r": 2, "tipo": "T"},
    {"c": 2, "r": 3, "tipo": "T"}, {"c": 10, "r": 3, "tipo": "T"},
    {"c": 4, "r": 4, "tipo": "V"}, {"c": 8, "r": 4, "tipo": "V"},
    {"c": 3, "r": 5, "tipo": "T"}, {"c": 9, "r": 5, "tipo": "T"}
  ],
  "tavolozza": [{"tipo": "gatto", "peso": 1.0, "min": 1, "max": 4}]
}
```

    Legenda della griglia (un carattere per cella): `.` pavimento, `C` colonna, `K` colonna crepata,
    `P` panca, `X` cassa, `G` grata, `H` siepe, `L` telaio (2×2: il carattere nelle quattro
    celle), `B` banco, `S` statua dormiente, `W` pozza, `R` rigagnolo (con `corrente`: `"N"`, `"E"`,
    `"S"` o `"W"` nel campo `correnti`), `F` braciere, `h` siepe spinosa. Campi opzionali:
    `porte_ammesse` (elenco di combinazioni di slot ammesse, default tutte), `risvegli`,
    `molt_ricompensa`, `elite` (tag). Il modello `pd-n-03` qui sopra rispetta le regole 4 e 25.

### States and Transitions

Stato della stanza:

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| `non_visitata` | piano creato | Ferruccio entra | porte aperte, nemici non creati, niente segnalini |
| `annuncio` | Ferruccio entra in una stanza con ondate | `t_marker` | segnalini visibili; a `t_chiusura_porte` le porte iniziano a chiudersi; Ferruccio può ancora uscire prima della chiusura (regola 6) |
| `ondata_k` | comparsa dei nemici dell'ondata k | vivi ≤ `soglia_ondata` e `t_pausa_ondata`, o `t_ondata_max` | porte `chiuse`; nemici attivi dopo `t_inerte` |
| `intervallo` | l'ondata k è sotto soglia e k < ondate | segnalini dell'ondata k+1 | porte `chiuse`; pausa breve |
| `svuotata` | ultimo nemico morto, nessuna nascita in coda | `t_ritardo_apertura` | proiettili rimossi; ricompensa a `t_ricompensa` |
| `pulita` | fine di `svuotata`, oppure prima visita di una stanza senza nemici | nuova notte | porte `aperte`; invariante della regola 26 |

Stato della porta:

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| `aperta` | stanza non in combattimento | stanza `annuncio` e cella libera | arco con soglia d'oro, passaggio libero |
| `chiudendo` | `t_chiusura_porte` scaduto, cella libera | fine di `t_anim_porta` | il pannello d'inchiostro scende; già solida a metà corsa |
| `chiusa` | fine di `chiudendo` | stanza `svuotata` + `t_ritardo_apertura` | muro; blocca anche i proiettili |
| `aprendo` | riapertura | fine di `t_anim_porta` | il pannello sale; la soglia d'oro si accende |

Priorità: la morte di Ferruccio interrompe tutto (nessuna ricompensa). Una stanza non può
passare a `pulita` finché esistono nemici vivi o nascite in coda.

### Interactions with Other Systems

| Sistema | Dati in ingresso | Dati in uscita |
|---|---|---|
| Generazione dei piani | piano: tipo, modello, `seme_stanza`, `profondita`, `d_boss`, `scena_id`, porte, ricompensa pre-estratta | `valore_ricompensa` (formula), validazione del modello, vincoli sui modelli |
| Controllo di Ferruccio | posizione, stato (Scatta, Colpito), tasto interagisci | punto d'arrivo, terreno (`mod_pozza`, `v_corrente`), danno ambientale |
| Combattimento | `danno_colpo` e linea di colpo sugli ostacoli e sulla finestra | `ferma_colpi`, `vita` degli ostacoli |
| Nemici e IA | composizione (`tipo`, ondata, punto), anello di sicurezza | richieste di nascita; segnali di morte; percorsi attorno a ostacoli e pericoli |
| Boss | arena, porta unica, punto del boss | fine scena (attiva l'uscita) |
| Fisica e collisioni | celle di ostacolo con `ferma_passo`/`ferma_volo`/`ferma_colpi` | zone di danno e di corrente |
| Camera e transizioni | stanza semplice o doppia, porta attraversata | stanza attiva, cella d'arrivo |
| Ciclo di gioco | — | eventi `stanza_entrata`, `stanza_chiusa`, `ondata_inizia`, `stanza_pulita`, `porte_aperte` (anche per audio e HUD) |
| Incontri e dialoghi | — | richiesta di esecuzione di `scena_id` (reperto) e del banco di Tonino |
| Doni e modificatori / Economia | seme per il dono, unità | richiesta del dono (tesoro), unità di ricompensa |
| Salvataggio | — | `StatoStanza` (regola 27) |
| Rendering | — | porte, segnalini, tratteggi, finestre, trasparenza delle colonne; semi dello jitter per stanza |
| HUD / Mappa del piano | — | stato visitata/pulita, tipo di stanza |
| Audio sintetico | — | eventi di stanza e di porta |

## Formulas

La formula `n_nemici` è definita come:

`n_nemici = clamp(round((n_base[p] + k_prof × prof + k_diff × (diff_mod − 3)) × molt_dim) + var, 1, n_cap)`, e per `d ≤ 1`: `n_nemici = min(n_nemici, n_cap_ingresso[p])`

con `prof = min(1, d / d_boss)`, `molt_dim = 1` per `1x1` e `molt_doppia` per `2x1`, `var ∈ {−1, 0, +1}` estratta con `rng_comp` a pesi `peso_var`, `n_cap` = `n_cap_1x1` o `n_cap_2x1`.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| p | int | 1–5 | calculated (piano) | piano corrente |
| n_base[p] | float | 1,5–5,0 | data file | valore base per piano: 2,0 · 2,5 · 3,0 · 3,5 · 4,0 |
| k_prof | float | 1,0–4,0 | data file | crescita con la profondità (2,5) |
| d | int | 0–13 | calculated (piano) | distanza in stanze dall'ingresso lungo il grafo |
| d_boss | int | 4–10 | calculated (piano) | lunghezza del cammino critico di questo piano |
| prof | float | 0–1 | calculated | profondità normalizzata |
| diff_mod | int | 1–5 | data file (modello) | difficoltà del modello (3 = standard) |
| k_diff | float | 0–1,0 | data file | peso della difficoltà del modello (0,5) |
| molt_doppia | float | 1,3–2,0 | data file | moltiplicatore per stanza doppia (1,6) |
| var | int | −1…+1 | rng (`rng_comp`) | variazione, pesi 0,25 / 0,5 / 0,25 |
| n_cap_1x1, n_cap_2x1 | int | 8–16 · 12–20 | data file | tetto per stanza (10 · 16) |
| n_cap_ingresso[p] | int | 1–6 | data file | tetto per stanze a `d ≤ 1`: 2 · 3 · 4 · 4 · 5 |

**Output Range:** 1 to 16. **Example:** piano 3, `d = 3`, `d_boss = 6`, modello `1x1` con `diff_mod = 3`, `var = 0`: `prof = 0,5`, `(3,0 + 1,25 + 0) × 1 = 4,25`, arrotondato 4. **Example (piano 1, stanza vicino all'ingresso):** `d = 1`, `d_boss = 4`, `diff_mod = 1`, `var = +1`: `(2,0 + 0,625 − 1,0) × 1 = 1,625 → 2`, più 1 = 3, ridotto dal tetto `n_cap_ingresso[1] = 2` a 2: un gatto o due, come chiede il concept ("un gatto d'ombra alla volta").

La formula `ondate` è definita come:

`ondate = min(ondate_max[p], 1 se n_nemici ≤ 3; 2 se 4 ≤ n_nemici ≤ 7; 3 se n_nemici ≥ 8)`, con quota dell'ondata i: `n_i = round(n_nemici × frazione[ondate][i])`, il resto all'ondata 1.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| ondate_max[p] | int | 1–3 | data file | 2 · 2 · 3 · 3 · 3 |
| frazione | float[] | 0–1 | data file | `1 → [1]`, `2 → [0,55; 0,45]`, `3 → [0,40; 0,35; 0,25]` |

**Output Range:** 1 to 3 ondate. **Example:** 6 nemici in piano 3 → 2 ondate di 3 e 3 (0,55 × 6 = 3,3 → 3; 0,45 × 6 = 2,7 → 3).

La formula `punto_valido` è definita come:

`valido(c) = dist(c, F) ≥ r ∧ min_i dist(c, porta_i) ≥ d_porta_min ∧ c ∉ vestibolo ∪ ostacoli ∪ zone_pericolo ∧ min_j dist(c, s_j) ≥ d_min_spawn`

con `r = r_sicurezza` alla creazione dei segnalini e `r = r_sicurezza_apparizione` alla comparsa.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| F | vec2 | dentro la stanza | calculated | posizione di Ferruccio (piedi) |
| r_sicurezza | float | 112–224 px | data file | anello alla creazione (160) |
| r_sicurezza_apparizione | float | 80–160 px | data file | anello alla comparsa (112) |
| d_porta_min | float | 64–192 px | data file | distanza minima dalle porte (128) |
| d_min_spawn | float | 32–96 px | data file | distanza minima tra due nascite (48) |
| s_j | vec2 | dentro la stanza | calculated | nascite già scelte nell'ondata |

**Output Range:** booleano. **Rationale dei numeri:** 160 px superano `portata` (70) più il raggio massimo di un nemico (40) più il corpo di Ferruccio (14), quindi nessun nemico nasce a portata di fendente né a contatto; con `v_base` 220 px/s sono 0,73 s di margine, meno di `t_marker` + `t_inerte` (1,3 s). **Example:** Ferruccio a `(200, 224)`; il punto `(9,1)`, centro `(608, 96)`, è a circa 430 px: valido; il punto `(4,2)`, centro `(288, 160)`, è a circa 110 px: scartato alla creazione, valutato dopo nell'ordine della permutazione.

La formula `seme_stanza` è definita come:

`seme_stanza = derive(seme_piano, 1000 + 16 × cy + cx)` (cella sinistra se doppia); `rng_comp = mulberry32(derive(seme_stanza, 1))`, `rng_spawn` con sale 2, `rng_ric` con sale 3, `rng_deco` con sale 4 (jitter di ±1,5% dei vertici, art bible §3)

dove `derive` e `mulberry32` sono definite in `generazione-piani.md`. I flussi sono separati: consumare numeri in uno non sposta gli altri.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| seme_piano | uint32 | 0–4294967295 | calculated (generazione) | seme del piano |
| (cx, cy) | int | 0–8, 0–7 | calculated (generazione) | cella della stanza sul piano |

**Output Range:** uint32 per flusso. **Example:** la stessa stanza con lo stesso seme del piano produce sempre la stessa composizione e lo stesso ordine dei punti di nascita.

La formula `valore_ricompensa` è definita come:

`p_ricompensa = clamp(p_base + k_pd × (diff_mod − 3), p_min, p_max)`; se `rng_ric() < p_ricompensa`: `valore = floor(v_base[p] × (1 + k_vr × prof) × molt_stanza)`, altrimenti `valore = 0`

con `molt_stanza` il maggiore dei moltiplicatori applicabili: `normale` 1,0, `doppia` 1,5, `elite` 1,5, `boss` 3,0, `segreta` 2,0.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| p_base | float | 0,3–0,9 | data file | probabilità di base di una ricompensa (0,6) |
| k_pd | float | 0–0,2 | data file | sensibilità alla difficoltà (0,1) |
| p_min, p_max | float | 0,2–0,5 · 0,8–1,0 | data file | limiti (0,3 · 0,95) |
| v_base[p] | float | 1–6 | data file | unità base per piano: 2 · 2 · 3 · 3 · 4 |
| k_vr | float | 0–1,0 | data file | crescita con la profondità (0,5) |
| molt_stanza | float | 1,0–3,0 | data file | per categoria (vedi sopra) |
| costo_oggetto | int | — | data file | moneta 1, scintilla 3, cuore 4 |
| peso_oggetto | float | 0–1 | data file | moneta 0,60, scintilla 0,25, cuore 0,15 |

**Output Range:** 0 to 12 unità. **Example:** piano 3, stanza doppia, `prof = 0,5`, `diff_mod = 4`: `p = 0,7`; se la stanza è premiata, `floor(3 × 1,25 × 1,5) = floor(5,625) = 5` unità, per esempio una scintilla e due monete. Piano 1 con `prof = 0,25`: `floor(2 × 1,125 × 1) = 2` unità, solo monete (la scintilla costa 3).

La formula `danno_a_ostacolo` è definita come:

`vita_residua = vita − Σ danno_colpo`

con `danno_colpo` quello di `combattimento.md`; l'ostacolo sparisce a `vita_residua ≤ 0`. **Example:** `cassa` (vita 2): due fendenti base, oppure un affondo (floor(1 × 2,5) = 2). Finestra della stanza segreta (`vita_finestra` = 3): tre fendenti, oppure due affondi (2 + 2 ≥ 3). I valori delle vite sono nei Tuning Knobs.

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| Ferruccio sulla cella di una porta quando deve chiudersi | la porta aspetta che sia fuori dalla cella, poi si chiude | nessuno schiacciamento |
| Ferruccio esce prima di `t_chiusura_porte` | stanza `non_visitata`, segnalini dissolti, stessa composizione al rientro | il seme è fisso, sbirciare non cambia nulla |
| Tutti i punti validi sono dentro l'anello | la comparsa aspetta fino a `t_ritardo_max_spawn`, poi nasce nel punto più lontano, mai a meno di `r_min_assoluto` | nessun nemico addosso, nessuna stanza bloccata |
| Un nemico è inchiodato dove non può muoversi (o fuori dalla stanza dopo una spinta) | dopo `t_antistallo` viene spostato sul punto di nascita valido più vicino; al secondo caso muore | niente softlock con le porte chiuse |
| Colonna crepata distrutta con un nemico dietro | il nemico torna colpibile e raggiungibile; nessuna ricompensa extra | la distruzione è uno strumento tattico |
| Fendente su un nemico oltre una colonna, dentro il settore | nessun danno (linea di colpo bloccata) | leggibilità: se non lo vedo non lo colpisco |
| Fendente su un nemico oltre una grata o una panca | danno normale | non fermano i colpi |
| Finestra della segreta colpita a stanza ancora in combattimento | nessun danno alla finestra, lampo di rifiuto | niente aperture involontarie durante gli scontri |
| Nemico che attacca una cassa o la finestra | nessun effetto | i nemici non danneggiano gli ostacoli |
| Ricompensa che cade su ostacolo, pericolo o fuori stanza | si sposta alla cella sicura più vicina | mai oggetti irraggiungibili |
| Più di `max_oggetti_persistiti` oggetti a terra | i più vecchi non raccolti si dissolvono con un lampo | tetto di prestazioni, caso raro |
| Scatto attraverso un braciere in attivo | nessun danno | lo scatto è invulnerabile (`controllo-ferruccio.md`) |
| Parata premuta contro un pericolo ambientale | nessun effetto; recupero normale | i pericoli non sono parabili: si leggono e si evitano |
| Pericolo ambientale a 1 maschera | muore | `hazard_letale`: i pericoli sono tutti telegrafati |
| `rigagnolo` spinge Ferruccio contro un muro | scivola lungo il muro; nessun danno | come la spinta di `controllo-ferruccio.md` |
| Due nemici nascono sulla stessa cella | impossibile: `d_min_spawn` | — |
| Ultimo nemico muore mentre c'è un proiettile in volo | il proiettile è rimosso a `svuotata` | nessun danno dopo la vittoria |
| Ferruccio muore nello stesso frame dell'ultimo nemico | morte; nessuna ricompensa | la morte ha priorità |
| Cuore a terra e maschere piene | resta a terra e si salva nello stato | regola 9 di `controllo-ferruccio.md` |
| Stanza-ricordo con scena già nel profilo | reperto `rivisto`, nessuna ripetizione | pilastro 2 |
| Stanza doppia: Ferruccio in una metà, nemico nell'altra | le porte di entrambe le metà si chiudono; i punti valgono per tutta la stanza | la doppia è una stanza sola |
| Resume in una stanza `in_corso` | rientra dall'arco, stanza `non_visitata`, stesso seme | niente stato di combattimento da salvare |
| Un modello ha una cella `spawn` su un ostacolo | il caricamento fallisce con l'id del modello e la cella | le regole 25 sono errori, non avvisi |
| `statua_dormiente` accanto a Ferruccio quando si sveglia | `t_risveglio_statua` senza danno, poi telegrafa come ogni statua | nessun colpo senza segnale |
| Corrente e pozza sulla stessa cella | gli effetti si moltiplicano (la pozza rallenta la corrente) | semplice e leggibile |

## Dependencies

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| Fisica e collisioni | This depends on Fisica | livelli di collisione (`ferma_passo`, `ferma_volo`, `ferma_colpi`), zone di danno e di corrente |
| Ciclo di gioco | This depends on Ciclo | eventi di stanza, morte, pausa |
| Controllo di Ferruccio | Reciproca per contratto | questo GDD usa: griglia 13×7 da 64 px (regola 1), scatto che si ferma contro gli ostacoli (regola 4), `t_invuln`, interagisci (regola 9), `velocita_effettiva` (il terreno si applica dopo il clamp); `controllo-ferruccio.md` va aggiornato con il terreno |
| Combattimento | Reciproca per contratto | questo GDD usa `danno_colpo`, `area_fendente`, affondo e parata (pericoli non parabili); `combattimento.md` dovrebbe citare la linea di colpo |
| Generazione dei piani | Generazione depends on this | tipi, modelli, formule di ricompensa, validazione; questo GDD riceve il piano |
| Nemici e IA | Reciproca | nascite, inerzia, tipi ammessi, `peso`, élite; IA con ostacoli e pericoli |
| Boss | Boss depends on this | arena, porta unica, uscita |
| Camera e transizioni | Camera depends on this | stanze doppie (la camera deve scorrere o allargarsi) |
| Incontri e dialoghi | Reciproca | esecuzione di `scena_id`, banco di Tonino |
| Doni e modificatori, Economia | Reciproca | dono del tesoro, unità di ricompensa, prezzi |
| Salvataggio | Salvataggio depends on this | `StatoStanza`, punto di salvataggio |
| HUD, Mappa del piano, Audio | These depend on this | stato e tipo di stanza, eventi |
| Rendering a teatro delle ombre | Rendering depends on this | porte, segnalini, tratteggi, finestre, jitter per stanza |

## Tuning Knobs

Tutti in `contenuti/parametri/stanze.json`.

| Parameter | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|--------------|------------|-------------------|-------------------|
| t_chiusura_porte | 500 ms | 200–1000 | più tempo per sbirciare | trappola secca |
| t_anim_porta | 300 ms | 150–500 | — | porta nervosa |
| t_ritardo_apertura | 600 ms | 300–1200 | vittoria più lunga | stanza che si riapre di scatto |
| t_ricompensa | 300 ms | 150–600 | — | — |
| t_marker | 800 ms | 500–1200 | nascite più leggibili, ritmo lento | rischio di nemici percepiti come "comparsi" |
| t_inerte | 500 ms | 300–800 | più giusto | nemico subito pericoloso |
| r_sicurezza | 160 px | 112–224 | stanze più facili, meno punti validi | nemici vicini |
| r_sicurezza_apparizione | 112 px | 80–160 | idem | idem |
| t_ritardo_max_spawn | 600 ms | 0–1200 | nascite più rinviate | nascite forzate |
| r_min_assoluto | 96 px | 64–128 | — | — |
| d_porta_min | 128 px | 64–192 | niente nemici all'uscita | nemici sulla soglia |
| d_min_spawn | 48 px | 32–96 | gruppo più sparso | gruppo compatto |
| vestibolo_celle | 2 | 1–3 | porte più libere | modelli più densi |
| t_pausa_ondata | 1200 ms | 600–2500 | respiro | stanze senza pause |
| soglia_ondata | 1 | 0–2 | ondate sovrapposte | ondate separate |
| t_ondata_max | 30000 ms | 15000–60000 (0 = spento) | meno pressione | più pressione |
| t_antistallo | 60000 ms | 30000–120000 | — | — |
| n_base[p] | 2,0 · 2,5 · 3,0 · 3,5 · 4,0 | 1,5–5,0 | più nemici | meno |
| k_prof | 2,5 | 1,0–4,0 | più rampa dentro il piano | piano piatto |
| k_diff | 0,5 | 0–1,0 | i modelli difficili pesano di più | — |
| molt_doppia | 1,6 | 1,3–2,0 | — | — |
| n_cap_1x1 / n_cap_2x1 | 10 / 16 | 8–16 / 12–20 | — | — |
| n_max_vivi | 16 | 8–20 | più caos (limite di prestazioni: 20 nemici, `combattimento.md`) | — |
| n_cap_ingresso[p] | 2 · 3 · 4 · 4 · 5 | 1–6 | prime stanze dure | prime stanze morbide |
| ondate_max[p] | 2 · 2 · 3 · 3 · 3 | 1–3 | — | — |
| conto_elite | 2 | 1–3 | — | — |
| p_base / k_pd / p_min / p_max | 0,6 / 0,1 / 0,3 / 0,95 | vedi Formulas | più ricompense | — |
| v_base[p] | 2 · 2 · 3 · 3 · 4 | 1–6 | più bottino | — |
| k_vr | 0,5 | 0–1,0 | — | — |
| molt_stanza | 1,0 / 1,5 / 1,5 / 3,0 / 2,0 | 1,0–3,0 | — | — |
| costo_oggetto (moneta/scintilla/cuore) | 1 / 3 / 4 | 1–6 | — | — |
| peso_oggetto | 0,60 / 0,25 / 0,15 | — | — | — |
| unita_ricordo | 0 | 0–3 | — | — |
| pesi contenuto segreta (scrigno / rifugio / reperto) | 0,6 / 0,4 / 0 | — | — | reperto attivo solo con elenco di scene |
| vita: colonna_crepata / cassa / siepe / finestra | 4 / 2 / 1 / 3 | 1–6 | ostacoli duri | ostacoli fragili |
| p_drop_cassa | 0,25 | 0–0,5 | — | — |
| mod_pozza | 0,8 | 0,6–0,95 | pozza innocua | pozza punitiva |
| v_corrente | 70 px/s | 30–120 | corrente forte | decorativa |
| v_min_terreno | 120 px/s | 100–150 | — | — |
| braciere: t_riposo / t_anticipo / t_attivo / r_fiamma | 1800 / 700 / 1000 ms / 56 px | 1000–3000 / 500–1000 / 600–1500 / 40–72 | — | anticipo sotto 500 ms: illeggibile |
| danno pericoli | 1 | 1–2 | — | — |
| hazard_letale / hazard_in_pulita / hazard_danneggia_nemici | sì / sì / no | — | — | — |
| p_ritorno | 0 | 0 | — | — |
| max_oggetti_persistiti | 24 | 12–48 | — | — |
| spawn_min_1x1 / spawn_min_2x1 | 8 / 14 | 6–12 / 10–20 | — | — |
| t_risveglio_statua | 700 ms | 500–1000 | — | — |
| t_intro_boss | 2000 ms | 1000–3500 | — | — |
| porta_rivela_tipo | sì | sì/no | — | — |

## Acceptance Criteria

- [ ] **GIVEN** una stanza `normale` con 3 nemici e Ferruccio appena entrato, **WHEN** passano 500 ± 33 ms, **THEN** le porte iniziano a chiudersi e a 800 ± 33 ms dall'arrivo i nemici compaiono già a porte chiuse.
- [ ] **GIVEN** Ferruccio che occupa la cella di una porta a 500 ms, **WHEN** esce dalla cella, **THEN** la porta si chiude entro `t_anim_porta` e non prima.
- [ ] **GIVEN** un nemico appena comparso, **WHEN** Ferruccio lo tocca entro 500 ms, **THEN** Ferruccio non perde maschere e il nemico non attacca.
- [ ] **GIVEN** 10.000 ondate simulate su tutti i modelli del pool con Ferruccio in posizioni casuali, **WHEN** i nemici nascono, **THEN** nessuno nasce a meno di 112 px da Ferruccio e nessuno a meno di 128 px da una porta (test automatico).
- [ ] **GIVEN** l'ultimo nemico che muore, **WHEN** passano 300 ± 33 ms, **THEN** compaiono gli oggetti della ricompensa pre-estratta, e a 600 ± 33 ms le porte sono `aperte`.
- [ ] **GIVEN** una stanza pulita con una `cassa` distrutta e una moneta non raccolta, **WHEN** Ferruccio esce, salva, ricarica e rientra, **THEN** nessun segnalino, porte aperte, cassa assente, moneta nello stesso punto.
- [ ] **GIVEN** piano 3, `d = 3`, `d_boss = 6`, `diff_mod = 3`, `var = 0`, **WHEN** si calcola `n_nemici`, **THEN** vale 4; **GIVEN** piano 1, `d = 1`, **THEN** non supera mai 2.
- [ ] **GIVEN** piano 3, stanza doppia, `prof = 0,5`, `diff_mod = 4`, stanza premiata, **WHEN** si calcola `valore_ricompensa`, **THEN** vale 5.
- [ ] **GIVEN** lo stesso `seme_stanza` e lo stesso modello in due esecuzioni, **WHEN** si crea la stanza, **THEN** composizione, ordine dei punti di nascita e oggetti di ricompensa sono identici.
- [ ] **GIVEN** un modello con una colonna nel vestibolo, **WHEN** si carica, **THEN** il caricamento fallisce con id e cella; lo stesso per una porta non raggiungibile da un'altra o per una cella di nascita su un ostacolo.
- [ ] **GIVEN** un nemico a 60 px dietro una `colonna` dentro il settore del fendente, **WHEN** si attacca, **THEN** non subisce danno; con una `grata` o una `panca` nel mezzo subisce danno.
- [ ] **GIVEN** una `cassa`, **WHEN** si colpisce due volte con il danno base, **THEN** sparisce; su 1000 casse distrutte, la frazione che lascia una moneta è 0,25 ± 0,04.
- [ ] **GIVEN** una finestra della segreta in una stanza pulita, **WHEN** si danno due fendenti, **THEN** resta chiusa; al terzo si apre e la stanza segreta è raggiungibile; **GIVEN** la stessa stanza in combattimento, **THEN** la finestra non subisce danno.
- [ ] **GIVEN** un braciere, **WHEN** Ferruccio sta nel raggio, **THEN** perde 1 maschera solo in fase attiva, mai durante lo scatto, e il tratteggio è visibile almeno 700 ms prima; lo stesso con 1 maschera muore.
- [ ] **GIVEN** Ferruccio fermo su un `rigagnolo` con corrente verso est, **WHEN** passa 1 s, **THEN** si sposta di 70 ± 5 px; su una `pozza` con `v_base` 220 la velocità è 176 ± 5 px/s.
- [ ] **GIVEN** una stanza-ricordo e la scena non vista, **WHEN** si preme interagisci davanti al reperto, **THEN** parte `scena_id`; **GIVEN** la scena già vista, **THEN** il reperto è `rivisto` e non succede nulla.
- [ ] Nessun modello ha celle di quota, buche, mensole o simboli di salto (validatore del caricamento).
- [ ] Prestazioni: creare una stanza (modello, composizione, nascite, ricompensa) costa meno di 5 ms.
- [ ] Evidenza visiva: una schermata conservata in `production/qa/evidence/` per ciascun tipo di stanza, per ciascuno stato delle porte e per ciascun pericolo.
- [ ] Nessun valore numerico di questo documento è scritto nel codice: tutto in `contenuti/parametri/stanze.json` e `contenuti/stanze/`.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| `trama/mappa-scene.md` (scena `piazza-dante.tutorial`) parla ancora di salto, doppio salto e mensole, residui della v1 e in conflitto con l'anti-pilastro. Va riletta come "prime stanze del piano 1 con un gatto alla volta" | narrative-director | prima del prototipo | questo GDD non prevede salti |
| La stanza segreta può ospitare un `reperto` con un indizio su Gaetano o su Bianca? Serve un elenco di scene facoltative | narrative-director | GDD incontri | peso 0 finché manca |
| Il boss lascia anche un dono, oltre all'anima? | game-designer | GDD boss | non deciso |
| Stanze doppie e camera: scorrimento orizzontale o ingrandimento? | technical-artist | GDD camera | non deciso |
| Il tesoro è gratuito o ha un prezzo? | economy-designer | GDD economia | non deciso |
| Il terreno rallenta Ferruccio: `controllo-ferruccio.md` deve citare `mod_pozza` e il suo ordine rispetto al clamp | game-designer | prima del prototipo | proposta: dopo il clamp, minimo `v_min_terreno` |
| I pericoli possono uccidere (`hazard_letale`): troppo duro per il piano 1? | game-designer | prototipo | provare con e senza |
| Stanze a L o 2×2 | level-designer | dopo il prototipo | fuori dall'MVP |
| I valori di questa tabella non sono stati simulati né giocati | level-designer | prototipo | da tarare sulla prima stanza giocabile |
