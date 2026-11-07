# Combattimento

> **Status**: Draft
> **Author**: game-designer (sessione autonoma; `creative-director`, `systems-designer`, `ai-programmer`, `qa-lead`, `art-director` non consultati — Solo mode. Rivedere a mano prima della produzione)
> **Last Updated**: 2026-11-07
> **Last Verified**: 2026-11-07
> **Implements Pillar**: 1 Leggibile al buio · 3 Il bottino ha un volto (tramite le statistiche che i doni modificano)

## Summary

Come Ferruccio colpisce e si difende: un fendente ad arco in tre tempi, un affondo caricato, una
parata a finestra stretta che punisce chi attacca. Il combattimento espone statistiche nominate che
i doni modificano; non conosce i doni. È il sistema a più alto rischio del progetto: si prototipa
per primo.

> **Quick reference** — Layer: `Feature` · Priority: `MVP` · Key deps: `Controllo di Ferruccio, Fisica e collisioni`

## Overview

A differenza di *Isaac*, Ferruccio non spara: ha la spada forgiata con gli strumenti del padre. Il
fendente colpisce in un arco davanti a lui, tre fendenti di fila formano una combo con un terzo colpo
più ampio. Tenendo il tasto si carica un affondo che attraversa in linea retta. Con il tasto parata si
apre una finestra breve: se un attacco nemico arriva dentro quella finestra, il danno è annullato,
l'attaccante resta stordito e il prossimo fendente fa doppio danno. Ogni nemico telegrafa prima di
colpire (GDD `nemici.md`): il combattimento è un gioco di lettura e tempi, non di schivata continua.

## Player Fantasy

La soddisfazione di un *parry* letto bene: il lampo rosso, il clang, il nemico che barcolla, il
colpo di risposta. E il piacere del terzo fendente che spazza mezza stanza. Riferimento: la parata
di *Sekiro* ridotta a un gioco dall'alto, l'affondo di *Hades* (Stygius) per la lama.

## Detailed Design

### Core Rules

1. **Fendente**. Premendo attacco, se Ferruccio può attaccare (non in Scatta, Colpito, Parata
   attiva, Affondo): startup `t_startup_f`, poi hitbox attiva per `t_attivo_f`, poi recupero
   `t_recupero_f`. La hitbox è un settore circolare di raggio `portata` e ampiezza `arco_f` centrato
   sulla **direzione di mira**: la direzione dell'input di movimento se presente, altrimenti
   l'orientamento della sagoma. Ogni nemico nell'arco subisce `danno` una sola volta per fendente.
2. **Combo**. Se un nuovo attacco è premuto entro `t_finestra_combo` dalla fine dell'attivo del
   fendente precedente, parte il fendente successivo (1 → 2 → 3) con startup ridotto a
   `t_startup_combo`. Il terzo fendente ha arco `arco_f3` e moltiplicatore `molt_f3`, e recupero
   `t_recupero_f3` più lungo. Dopo il terzo la combo si azzera. Un input premuto durante startup o
   attivo è bufferizzato per `t_buffer` ms.
3. **Cancellazione**. Il recupero di qualsiasi fendente può essere interrotto dallo scatto (GDD
   `controllo-ferruccio.md`) e dalla parata. Lo startup non si cancella.
4. **Affondo caricato**. Tenendo attacco per almeno `t_carica`, al rilascio Ferruccio avanza di
   `d_affondo` in `t_affondo` con una hitbox rettangolare di larghezza `larg_affondo` lungo il
   percorso, danno `danno × molt_affondo`, spinta `spinta_affondo` sui nemici colpiti. Durante la
   carica cammina al 50%. Rilasciare prima di `t_carica` esegue un fendente normale. La carica
   completa è segnalata dalla lama che si accende.
5. **Parata**. Premendo parata: startup `t_startup_p`, finestra attiva `t_finestra_p`, recupero
   `t_recupero_p` (solo se la finestra è andata a vuoto). Un attacco nemico in corpo a corpo o un
   proiettile che colpirebbe Ferruccio durante la finestra viene **parato**: danno 0, nessuna spinta
   a Ferruccio, l'attaccante entra in **Stordito** per `t_stordito` (GDD `nemici.md`), il proiettile
   è riflesso nella direzione da cui è venuto con danno `danno_riflesso`. Una parata riuscita
   **ricarica una carica di scatto** e apre la finestra di **controcolpo**: per `t_controcolpo` il
   prossimo fendente ha moltiplicatore `molt_controcolpo`. Gli attacchi segnati come **imparabili**
   (rossi pieni, non lampeggianti) non si parano: vanno scattati.
6. **Danno e vita dei nemici**. Ogni nemico ha `vita` intera. Il danno è intero dopo arrotondamento
   per difetto, minimo 1. A 0 il nemico muore (dissoluzione in anima, GDD `nemici.md`).
7. **Spinta sui nemici**. Ogni colpo spinge il nemico lontano da Ferruccio di `spinta_f` (o
   `spinta_affondo`) decadente in `t_spinta_nemico`; i nemici con `peso ≥ 3` non sono spinti.
8. **Feedback obbligatorio**. Ogni colpo a segno: hit-stop `hs_colpo`, lampo bianco sulla sagoma
   colpita; ogni uccisione: hit-stop `hs_uccisione`; ogni parata: hit-stop `hs_parata`, lampo
   bianco ad anello, scossa.
9. **Statistiche nominate** (il contratto con i doni, GDD `doni-modificatori.md`): `danno`,
   `portata`, `arco_f`, `t_startup_f`, `t_recupero_f`, `molt_f3`, `t_finestra_p`, `molt_controcolpo`,
   `molt_affondo`, `d_affondo`, `t_carica`, `danno_riflesso`, `spinta_f`. I doni possono solo
   moltiplicare o sommare queste; non introducono rami di codice. Effetti "a evento" (es. "ogni
   parata lancia una scintilla") passano per **ganci** nominati: `su_colpo`, `su_uccisione`,
   `su_parata`, `su_affondo`, `su_danno_subito`.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| Pronto | nessuna azione in corso | attacco / parata / carica | può muoversi |
| Fendente 1/2/3 (startup → attivo → recupero) | attacco | fine recupero / scatto / parata / input combo entro finestra | hitbox a settore; movimento al 60% durante il recupero |
| Carica | attacco tenuto ≥ `t_carica` | rilascio | cammina al 50%; lama accesa |
| Affondo (startup → attivo → recupero) | rilascio dopo Carica | fine recupero | avanza; hitbox rettangolare; non si cancella |
| Parata (startup → finestra → recupero) | parata | parata riuscita (→ Controcolpo) / fine recupero | fermo; la finestra è visibile come alone bianco |
| Controcolpo | parata riuscita | fine di `t_controcolpo` o un fendente | prossimo fendente ×`molt_controcolpo` |

Priorità degli input nello stesso frame: parata > attacco. Il danno subito (GDD controllo)
interrompe tutto tranne l'attivo dell'affondo.

### Interactions with Other Systems

| Sistema | In ingresso | In uscita |
|---|---|---|
| Controllo di Ferruccio | stato, orientamento, posizione, direzione di mira | richiesta di ricarica scatto (parata) |
| Nemici e IA | hitbox nemiche, flag imparabile, `vita`, `peso` | danno, stordimento, spinta, morte |
| Doni e modificatori | moltiplicatori/somme sulle statistiche nominate; iscrizioni ai ganci | eventi dei ganci |
| Fisica | risoluzione delle hitbox (settore, rettangolo, cerchio) | — |
| HUD | — | carica dell'affondo, finestra di controcolpo |
| Rendering | — | eventi di feedback (hit-stop, lampi, scossa, scia della lama) |

## Formulas

The `danno_colpo` formula is defined as:

`danno_colpo = max(1, floor(danno × molt_combo × molt_affondo × molt_controcolpo × Π(mod_danno_i)))`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| danno | int | 1–3 | data file | danno base della spada (1) |
| molt_combo | float | 1,0 / 1,0 / 1,5 | data file | per fendente 1, 2, 3 |
| molt_affondo | float | 2,0–3,0 | data file | solo nell'affondo (2,5); altrimenti 1 |
| molt_controcolpo | float | 1,5–3,0 | data file | solo nella finestra di controcolpo (2,0); altrimenti 1 |
| mod_danno_i | float | 0,8–2,0 ciascuno | calculated (doni) | moltiplicatori dei doni |

**Output Range:** 1 to 15 nell'MVP. **Example:** terzo fendente in controcolpo con un dono +50%: floor(1 × 1,5 × 1 × 2,0 × 1,5) = 4.

The `area_fendente` formula is defined as:

`colpito(nemico) = dist(centro, nemico) ≤ portata + r_nemico ∧ |angolo(nemico) − angolo_mira| ≤ arco/2`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| portata | float | 56–96 px | data file | raggio del settore (70) |
| arco | float | 90–160° | data file | 110° per i fendenti 1-2, `arco_f3` 150° per il terzo |
| r_nemico | float | 10–40 px | data file (nemici) | raggio del nemico |

**Output Range:** booleano. **Example:** gatto (r 16) a 80 px e 40° fuori asse con il fendente 1: 80 ≤ 86 e 40 ≤ 55 → colpito.

The `finestra_parata` formula is defined as:

`parata_riuscita = (t_impatto ∈ [t_inizio_p + t_startup_p, t_inizio_p + t_startup_p + t_finestra_p]) ∧ ¬imparabile`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| t_startup_p | int | 30–60 ms | data file | ritardo di apertura (40) |
| t_finestra_p | int | 140–240 ms | data file | finestra (180) + somme dei doni, massimo 300 |

**Output Range:** booleano. **Example:** gatto che balza con impatto 400 ms dopo il telegrafo; parata premuta a 350 ms → finestra 390–570 → riuscita.

The `dps_riferimento` formula (per il bilanciamento, non per il codice) is defined as:

`dps = (danno × (1 + 1 + 1,5)) / (3 × (t_startup_combo + t_attivo_f) + t_recupero_f3) ≈ 3,5 / 0,74 s ≈ 4,7 vita/s`

Serve a dimensionare la vita dei nemici (GDD `nemici.md`): un nemico comune muore in 1–2 combo, un
élite in 3–4, un boss in 60–90 s di colpi netti.

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| Attacco premuto durante lo scatto | bufferizzato: parte alla fine del recupero dello scatto se entro `t_buffer` | fluidità senza spam |
| Parata e attacco nello stesso frame | parata | la difesa è la scelta più deliberata |
| Parata su attacco imparabile | nessun effetto, recupero normale: Ferruccio subisce danno | i rossi pieni si scattano, regola leggibile |
| Due nemici attaccano nella stessa finestra di parata | entrambi parati, entrambi storditi | premia la lettura, non punisce il gruppo |
| Proiettile riflesso colpisce chi lo ha lanciato | danno `danno_riflesso` | fantasia della parata |
| Affondo contro un muro | si ferma al muro, la hitbox resta attiva sul tratto percorso | niente attraversamenti |
| Affondo su nemico con peso ≥ 3 | danno sì, spinta no, Ferruccio si ferma a contatto | boss non si spostano |
| Terzo fendente colpisce 6 nemici | tutti i 6 subiscono danno, hit-stop una sola volta (`hs_colpo`) | evitare freeze cumulativi |
| Combo interrotta da danno | combo azzerata, buffer svuotato | punizione chiara |
| Controcolpo attivo e si usa l'affondo | il moltiplicatore si applica all'affondo e si consuma | ricompensa anche la scelta pesante |
| Dono porta `t_finestra_p` oltre 300 ms | clamp a 300 | sopra diventa parata automatica |

## Dependencies

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| Controllo di Ferruccio | This depends on Controllo | stato, orientamento, posizione, ricarica scatto |
| Fisica e collisioni | This depends on Fisica | test settore/rettangolo contro cerchi |
| Nemici e IA | Reciproca per contratto | nemici espongono hitbox, `vita`, `peso`, imparabile; il combattimento restituisce danno e stordimento |
| Doni e modificatori | Doni depends on this | statistiche nominate e ganci |
| Boss | Boss depends on this | stesse regole, `peso` alto, attacchi imparabili |
| HUD | HUD depends on this | carica, controcolpo |
| Rendering a teatro delle ombre | Rendering depends on this | eventi di feedback |

## Tuning Knobs

| Parameter | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|--------------|------------|-------------------|-------------------|
| danno | 1 | 1–3 | nemici muoiono prima | run più lunghe |
| portata | 70 px | 56–96 | più sicuro | più rischio |
| arco_f | 110° | 90–140 | copre più lati | mira precisa |
| arco_f3 | 150° | 120–180 | il terzo spazza | — |
| molt_f3 | 1,5 | 1,2–2,0 | premia la combo | — |
| t_startup_f | 80 ms | 50–120 | pesante | nervoso |
| t_attivo_f | 100 ms | 60–140 | più perdonante | preciso |
| t_recupero_f | 160 ms | 100–260 | più commit | spam |
| t_recupero_f3 | 260 ms | 180–360 | — | — |
| t_startup_combo | 50 ms | 30–80 | — | — |
| t_finestra_combo | 250 ms | 150–400 | combo facile | combo da ritmo |
| t_buffer | 150 ms | 80–250 | — | — |
| t_carica | 400 ms | 300–700 | affondo raro | affondo facile |
| d_affondo | 120 px | 90–180 | — | — |
| t_affondo | 140 ms | 100–200 | — | — |
| molt_affondo | 2,5 | 2,0–3,0 | — | — |
| t_startup_p | 40 ms | 30–60 | parata anticipata | reattiva |
| t_finestra_p | 180 ms | 140–240 | generosa | da esperti |
| t_recupero_p | 220 ms | 150–350 | parata rischiosa | spam di parate |
| t_stordito | 600 ms | 400–1000 | punizione | — |
| t_controcolpo | 500 ms | 300–800 | — | — |
| molt_controcolpo | 2,0 | 1,5–3,0 | — | — |
| danno_riflesso | 2 | 1–4 | — | — |
| spinta_f / spinta_affondo | 160 / 320 px/s | 100–400 | stanze più caotiche | nemici addosso |
| hs_colpo / hs_uccisione / hs_parata | 50 / 110 / 90 ms | 30–150 | più peso | più fluidità |

## Game Feel

### Feel Reference
Fendente: *Hades* con Stygius (tre colpi, il terzo ampio), più leggero. Parata: *Sekiro*, ma con una
finestra più larga e un solo tipo di risposta. Anti-riferimento: *Dead Cells* con la parata a
scudo che blocca tutto senza tempi.

### Input Responsiveness
| Action | Max Input-to-Response Latency (ms) | Frame Budget (at 60fps) | Notes |
|--------|-----------------------------------|------------------------|-------|
| Fendente | 33 | 2 | la lama parte nello startup, visibile dal primo frame |
| Parata | 33 | 2 | l'alone appare subito, la finestra si apre dopo 40 ms |

### Animation Feel Targets
| Animation | Startup Frames | Active Frames | Recovery Frames | Feel Goal | Notes |
|-----------|---------------|--------------|----------------|-----------|-------|
| Fendente 1-2 | 5 | 6 | 10 | secco | la spada è l'unico pezzo rigido che ruota al polso |
| Fendente 3 | 3 | 6 | 16 | ampio, pesante | busto che ruota di 30° |
| Affondo | 4 | 8 | 16 | lancia | sagoma inclinata di 25° in avanti |
| Parata | 2 | 11 | 13 | immobile e sicuro | spada verticale davanti al volto |

### Impact Moments
| Impact Type | Duration (ms) | Effect Description | Configurable? |
|-------------|--------------|-------------------|---------------|
| Hit-stop colpo | 50 | entrambe le sagome ferme, lampo bianco sul nemico | Yes |
| Hit-stop uccisione | 110 | + l'anima si stacca | Yes |
| Hit-stop parata | 90 | + anello bianco, scossa 6 px | Yes |
| Scia della lama | 120 | arco bianco in dissolvenza che disegna l'area esatta della hitbox | Yes |

### Weight and Responsiveness Profile
- **Peso**: medio-leggero; i fendenti 1-2 sono veloci, il terzo e l'affondo hanno impegno.
- **Controllo**: alto fuori dall'affondo; l'affondo è un impegno dichiarato dalla lama accesa.
- **Snap**: binario per i fendenti; la carica è l'unico analogico.
- **Fallimento**: una parata mancata si vede (recupero con la spada bassa), e si capisce perché (il lampo era rosso pieno, oppure si è premuto tardi).

### Feel Acceptance Criteria
- [ ] Un tester esegue una parata riuscita entro i primi tre gatti senza che gli venga spiegata la finestra, solo dal lampo rosso.
- [ ] Nessun tester definisce il fendente "molle" o "lento".
- [ ] La scia della lama viene usata dai tester per giudicare la portata (la citano o la usano per posizionarsi).

## Acceptance Criteria

- [ ] **GIVEN** un gatto (r 16) fermo a 80 px davanti a Ferruccio, **WHEN** si preme attacco, **THEN** il gatto subisce 1 danno tra 80 e 180 ms dalla pressione.
- [ ] **GIVEN** lo stesso gatto a 95 px, **WHEN** si preme attacco, **THEN** non subisce danno (fuori portata 70+16).
- [ ] **GIVEN** tre pressioni di attacco distanziate di 200 ms, **WHEN** si colpisce un nemico con vita 6, **THEN** la vita scende a 6−1−1−1 = 3 e il terzo fendente mostra l'arco a 150°.
- [ ] **GIVEN** attacco tenuto 450 ms poi rilasciato, **WHEN** un nemico è sul percorso a 60 px, **THEN** subisce floor(1×2,5)=2 danni ed è spinto a 320 px/s.
- [ ] **GIVEN** un gatto che balza con impatto a T, **WHEN** parata premuta a T−100 ms, **THEN** maschere invariate, gatto in Stordito per 600 ms, una carica di scatto ripristinata, e il fendente successivo entro 500 ms fa floor(1×2,0)=2.
- [ ] **GIVEN** parata premuta a T−300 ms, **WHEN** il gatto impatta a T, **THEN** la finestra (T−260…T−80) è chiusa: Ferruccio subisce 1 danno.
- [ ] **GIVEN** un attacco imparabile, **WHEN** si para nel tempo giusto, **THEN** il danno passa comunque.
- [ ] **GIVEN** un dono con mod_danno 1,5, **WHEN** terzo fendente in controcolpo, **THEN** danno 4.
- [ ] **GIVEN** un dono che porta t_finestra_p a 320, **WHEN** si legge il parametro effettivo, **THEN** vale 300.
- [ ] Prestazioni: risoluzione delle hitbox con 20 nemici entro 0,5 ms per frame.
- [ ] Nessun valore di questo documento è nel codice: tutto in `contenuti/parametri/combattimento.json`.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| Mira verso il mouse come alternativa alla direzione di movimento? | game-designer | prototipo | provare entrambe nel prototipo |
| La parata riflette anche i proiettili dei boss? | game-designer | GDD boss | sì salvo quelli imparabili |
