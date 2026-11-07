# Concept Prototype Report: Stanza dei gatti

> **Date**: 2026-11-07
> **Prototype Path**: HTML (Canvas 2D, un solo file, tempo simulato a passo fisso di 4 ms)
> **Concept File**: design/gdd/game-concept.md · regole da design/gdd/controllo-ferruccio.md e design/gdd/combattimento.md
> **Pagina giocabile**: https://claude.ai/artifact/PsSXdSgrt9dg8jZ9JPTXTF · misure grezze: `evidenze/misure.json`

---

## Hypothesis

«Se il giocatore affronta tre gatti d'ombra con fendente, parata sul lampo rosso e scatto, il
combattimento sarà leggibile e soddisfacente: lo sapremo se esegue una parata riuscita entro i primi
tre gatti senza spiegazioni, e se vuole rigiocare la stanza almeno una volta.»

## Riskiest Assumption Tested

Il corpo a corpo top-down con parata è meno leggibile dello sparo di *Isaac*. **Non verificata**:
nessun umano ha giocato. Il prototipo ha misurato solo cose oggettive: le regole dei GDD sono
eseguibili, la finestra di parata lascia poco margine a una reazione umana, il bot si comporta come
descritto sotto.

## Approach

- **Costruito**: stanza 13×7 in vista 3/4, fendente a settore, combo da tre, affondo caricato, parata,
  scatto; tre gatti con pattuglia, inseguimento, anticipo, lampo, balzo, recupero, stordimento.
- **Parametri** in `PARAMETRI` in testa al file, modificabili da URL (`?t_finestra_p=240&t_lampo=250`);
  `?mira=dir|auto|mouse`, `?semente=N`, `?auto=1` (bot che para), `?auto=2` (bot che non para).
- **Telemetria**: `window.__proto` (stato, metriche, log, `premi()`, `scarica()`); banco di prova
  interno (`simula`, `provaParata`, `provaFendente`, `provaCombo`, `provaAffondo`, `provaScatto`).
- **Scorciatoie volute**: niente audio, niente menu, una stanza, grafica fatta a mano sul canvas.
- **Limite del percorso HTML**: il browser aggiunge 50-133 ms di variazione nella resa; le misure non
  ne dipendono perché il tempo è simulato, il feel sì.

## Result (tutto misurato: script Playwright eseguito una volta, semi 1..30 per il bot, 1..20 per gli sweep)

**Bot con reazione 120 ms (`?auto=1`, 30 stanze)**

| Misura | Valore |
|---|---|
| Stanze pulite / morti | 30 / 0 |
| Tempo medio per stanza | 4,67 s |
| Tempo medio per uccidere un gatto dal primo inseguimento | 1340 ms |
| Balzi / parate riuscite / premute / mancate | 93 / 89 / 90 / 1 |
| Balzi parati | 95,7% |
| Maschere perse per stanza | 0,07 |

**La parata non è necessaria per vincere** (`?auto=2`, 30 stanze)

| Misura | Con parata | Senza parata |
|---|---|---|
| Tempo medio per stanza | 4,67 s | 3,97 s |
| Maschere perse per stanza | 0,07 | 0,23 |
| Balzi subiti | 93 | 8 |

Chi picchia e basta pulisce 0,7 s prima e perde 0,16 maschere in più: con vita 3 e danno 1 la combo
uccide il gatto in circa 480 ms e la parata è un'opzione, non una necessità.

**Reazione del bot e balzi parati (20 stanze per valore)**

| ms dal lampo | 40 | 80 | 120 | 160 | 200 | 220 | 240 | 300 |
|---|---|---|---|---|---|---|---|---|
| Balzi parati | 78,4% | 96,8% | 100% | 100% | 100% | **0%** | 0% | 0% |

L'impatto arriva a 252 ms dall'inizio del lampo; la parata riesce solo se premuta tra circa 40 e
210 ms dopo l'inizio del lampo. Una reazione umana tipica (200-250 ms) sta sul bordo. L'anticipo di
500 ms può fare da metronomo: da vedere dal vivo.

**Criteri dei GDD verificati**

| Criterio | Esito |
|---|---|
| Parata 300 ms prima dell'impatto | fallisce: maschere 5→4 |
| Parata 100 ms prima | riesce: maschere invariate, gatto stordito 600 ms, scatto ricaricato, fendente seguente fa 2 |
| Sweep ogni 10 ms | riesce da 40 a 210 ms prima dell'impatto; 30 e 220 falliscono |
| Fendente a 80 px | colpito a 84 ms dalla pressione |
| Fendente a 95 px | non colpito (70 + 16 = 86) |
| Archi della combo | 110°, 110°, 150° |
| Combo da tre su vita 6 | da fermo 2 colpi su 3 (la spinta di 16 px porta il gatto oltre 86 px); avanzando 6→3 come da GDD |
| Affondo con carica 450 ms | danno 2, spinta 320 px/s |
| Scatto durante l'anticipo | nessun danno, il gatto balza a vuoto |

**Mitigazione introdotta e misurata.** Con la hitbox del balzo attiva per tutto il balzo, in mischia
l'impatto arrivava 152 ms dopo l'inizio del lampo: bot a 120 ms, 4,6% di parate e 3,1 maschere perse
per stanza. Con la hitbox spenta nel primo 45% del balzo (segmento spazzato) l'impatto cade sempre a
+252 ms e il bot para il 95,7-100%.

**Screenshot** (`evidenze/`): dopo l'ultima rigenerazione sono stati ricontrollati a occhio solo
`03-lampo-rosso` e `08-grigi` dall'agente, e `01`, `03`, `05`, `08` dall'orchestratore. Il lampo con
anello si legge; il corridoio tratteggiato del balzo si legge anche in grigi; l'anticipo si legge come
sagoma più bassa ma è meno evidente del rosso; l'anello copre in parte la testa del gatto (gatti ≈ 70 px).

## Metrics

| Metric | Value |
|---|---|
| Path used | HTML |
| Iterations to playable | N/A |
| Prototype duration | una sessione, non cronometrata |
| Playtesters | 0 interni / 0 esterni |
| Feel assessment | NOT ASSESSED; oggettivo: finestra utile 40-210 ms dopo il lampo; bot a 120 ms para il 95,7% |
| Hypothesis verdict | NOT ASSESSED |

## Feedback dell'autore (2026-11-07, dopo aver giocato)

- «Sì e no, ha tutto senso come bozza.» Le regole reggono come bozza.
- «La cosa da migliorare è il feedback quando colpisci il nemico: deve essere marcato come in Isaac.»
- «La cosa più grande da migliorare, dove si deve perdere più tempo, è la grafica: non si può guardare così.»

**Verdetto aggiornato**: regole e struttura **PROCEED come bozza**; resa visiva e feedback dei colpi
**PIVOT**: il prototipo è troppo sotto il mockup approvato (`design/mockup/`). Conseguenze nel piano:
una tavola di qualità visiva da approvare prima del motore (storia 000) e una storia dedicata al
feedback dei colpi con criteri alla Isaac (storia 012).

## Recommendation (del bot): NOT ASSESSED — built but nobody has played it

Le regole dei GDD sono eseguibili con i loro numeri e il bot pulisce tutte le stanze. Restano due dubbi
che solo un giocatore scioglie: (1) la finestra di parata sta sul bordo del tempo di reazione umano
(100% fino a 200 ms, 0% da 220); (2) la parata non serve per vincere, quindi il criterio «una parata
entro i primi tre gatti» può fallire per bilanciamento, non per leggibilità. Nessun verdetto
PROCEED/PIVOT/KILL sulla base di un bot.

**Domande all'autore** (tre tentativi senza spiegazioni, poi):
1. Hai capito quando parare dal solo movimento del gatto, senza guardare il rosso? Da cosa: accucciarsi, corridoio tratteggiato, anello?
2. Alla prima parata il gatto era accucciato, nel lampo o già in aria?
3. La parata ti è sembrata troppo tardi, troppo presto o giusta? Prova `?t_lampo=250` e `?t_finestra_p=240`.
4. Hai preferito picchiare i gatti prima che balzassero? Con vita 3 e danno 1 la parata ha un motivo per esistere?
5. Il lampo rosso sembra nei buchi della sagoma o un cerchio sopra? Si confonde con la sciarpa?
6. Il fendente è molle o lento? L'arco bianco ti ha aiutato a posizionarti?
7. Hai voluto rigiocare dopo il cartiglio? Quante volte?
8. Mirare con la direzione di movimento ti ha dato problemi con un gatto sopra o sotto da fermo? Prova `?mira=auto` e `?mira=mouse`.

## If Proceeding

- **Valori scoperti**: hitbox del balzo dal 45% (impatto a +252 ms, indipendente dalla distanza); finestra di pressione utile 40-210 ms dopo il lampo.
- **Confermato**: i criteri di parata del GDD funzionano come scritti.
- **Smentito**: «un lampo di 150 ms basta a una reazione umana» è dubbio; «hitbox attiva per tutto il balzo» è incompatibile con la parata in mischia.
- **Emergente**: la mischia ravvicinata accorcia il tempo utile; l'anticipo di 500 ms può fare da metronomo.
- **Prossimi passi**: far giocare l'autore; se la parata è al limite, allungare lampo e finestra; portare i valori misurati in `nemici.md`.

## If Pivoting / If Killing

Non applicabili finché nessuno ha giocato. Se i giocatori non usano la parata: vita dei gatti 5-6 con danno 1, oppure armatura anche nel recupero.

## Valori da riportare nei GDD

| Valore | GDD / incarico | Prototipo | Perché |
|---|---|---|---|
| Hitbox del balzo | attiva per tutto il balzo | spenta fino al 45% (`balzo_hit_dal` 0,45), segmento spazzato | misurato: +152 ms contro +252 ms; parate del bot 4,6% contro 95,7-100%; il 45% non è tarato da umani |
| Armatura del telegrafo del gatto | non specificata | un colpo non interrompe anticipo, lampo, balzo | senza, la combo (≈380 ms) uccide il gatto durante l'anticipo |
| Attaccanti contemporanei | non specificato | massimo 2 | evita tre telegrafi sovrapposti; nessun effetto sul bot, da riprovare con un umano |
| Affondo: startup / recupero / larghezza / lama | solo frame | 60 ms / 260 ms / 40 px / 46 px | servivano per costruirlo |
| Spinta sui nemici: durata | «decadente» | 200 ms | il GDD non dà la durata; 16 px a colpo |
| Fendente alla pressione | «rilasciare prima di t_carica esegue un fendente» | fendente alla pressione; tenere ≥ 400 ms entra in carica | eseguirlo al rilascio violerebbe i 33 ms di latenza |
| Buffer di parata e scatto | solo l'attacco ha buffer | 0 | una parata premuta durante startup o attivo si perde: probabile problema umano |
| Pattuglia | non specificata | 70 px/s, waypoint entro 140×100 px | scelta del prototipo |

Messi in discussione dalle misure (non cambiati): il ×1,5 del terzo fendente con danno intero (già
risolto nei GDD con il danno decimale); la spinta di 160 px/s che porta il gatto fuori portata al
terzo fendente da fermi; la finestra di pressione che finisce 210 ms dopo l'inizio del lampo; il GDD
nemici deve dire se «impatto a 400 ms dal telegrafo» conta dall'anticipo o dal lampo; la parata non
necessaria con vita 3 e danno 1.

## Lessons Learned

- **Assunzioni smentite**: «hitbox attiva durante il balzo» e «impatto a metà balzo» coincidono solo a 120 px; in mischia l'impatto arriva quasi subito. La parata senza buffer perde le pressioni durante gli startup.
- **Sorprese**: la scogliera netta a 220 ms di reazione; il bot che non para è quasi bravo quanto quello che para.
- **Da fare diversamente**: far giocare un umano prima di tarare il bot; almeno 5 tentativi di 2-3 persone.

> *Prototype code location: `prototypes/stanza-gatti-concept/`. Codice usa-e-getta, mai da trasformare in produzione.*
