# I finali del Teatro, la porta della bottega, il Diario di Ferruccio e la Voce

> Proposta della squadra b8 (file `gioco/teatro/b8-finali-diario.js`). Tutti i testi segnati **[nuovo]**
> sono scritti da noi e sono **da approvare dall'autore**; quelli segnati **[bibbia]** sono presi alla
> lettera da `trama/ferruccio-bibbia.md` / `trama/storia.json` (cambia solo il nome della Signora, vedi §0).
> Niente di `trama/` è stato modificato.

## 0. Da dove discende tutto (letto prima di scrivere)

| Fatto | Fonte | Come lo usiamo |
|---|---|---|
| La Voce narrante è Donna Luciana; si rivela all'ingresso del suo boss; **sconfitta lei, la voce scompare per sempre** e restano solo indicazioni nude fra parentesi quadre: «[Il copione è strappato. Nessuno detta più le tue parole.]» | `trama/decisione-narratrice-donna-luciana.md` | La «Voce del Burattinaio» chiesta dal compito è **lei** (la Burattinaia). Finché non è caduta commenta boss, atti, notti. Dopo la sua prima sconfitta le stesse didascalie diventano «senza regia»: fra quadre, senza nome, senza suono. |
| «Spezzandola si scopre che anche ai suoi polsi sono legati fili d'oro che salgono più in alto nel buio del Teatro: "BIS! DA CAPO!"» | `storia.json › boss › donna-luciana › rivelazione` | È il ponte fra il finale vero e la «Notte senza fine», ed è la domanda a cui risponde il finale segreto: dove vanno quei fili? |
| Le due conclusioni della bibbia (Spezza il Velo / Risparmia), le quattro scene conclusive di Tonino, le frasi sul nero, la frase dei titoli di coda | bibbia §X, §XVI, §XX | Il finale vero **è** il bivio della bibbia, messo in scena sul palco delle marionette. Battute alla lettera. |
| «Questo rende i due finali inevitabilmente opposti, **senza introdurre una soluzione perfetta nascosta**.» | bibbia §VIII | Il finale segreto **non** salva Caserta e non è un terzo esito per la città: riguarda solo Ferruccio. Lo diciamo a schermo: «quello che hai scelto sul palco resta scelto». |
| La porta in alto al centro dell'hub è la **bottega di Gaetano**: `presenze › id "bottega" › etichetta "bottega di Gaetano" › aperta_se { fucina_aperta: "vera" }` | `t4-hub-storia.js › DATI.modelloHub` | È «la porta della prima stanza». Il flag `fucina_aperta` esiste già e non lo imposta nessuno: lo impostiamo noi quando il segreto è risolto. |
| «Tonino e Assunta introducono la bottega di Gaetano; Mariella aggiunge l'indizio del **ferro che risuona dietro una porta** su Corso Trieste. […] la porta della bottega apre la **Fucina del Ricordo**. […] All'interno, parlare con Gaetano **restituisce a Ferruccio il nome e il volto umano**.» | `trama/inizio-memoria-e-doni.md` (decisione dell'autore, 10 ottobre) | **Questo è il significato preciso della porta.** Dietro c'è la Fucina del Ricordo; il finale segreto è l'incontro con Gaetano che restituisce il volto. Gli indizi sono proprio quelli scritti dall'autore: Tonino introduce la bottega, Mariella dice del ferro che risuona. |
| Gaetano «non deve trasformarsi in un fantasma che accompagna e spiega tutto»; una sola battuta canonica: «Prima fate uscire i ragazzi!» | bibbia §VI | Nella Fucina Gaetano dice sei battute brevi, da capomastro. Non spiega il Velo. La sua battuta canonica torna come congedo. |
| «La sua spada, forgiata con **gli ultimi strumenti del padre**, rappresenta inizialmente la vendetta.» · Taddeo: «Quella l'abbiamo forgiata insieme.» · il punzone **G. F.** «accanto alla fontana della Villa Comunale» · Agnese: «Siete venuto ad aggiustarlo o a finirlo?» … «Almeno quelle non le rompete.» · Gaetano muore nel cantiere della Reggia | bibbia §III, §IV, §V, §VI | La chiave della porta sono **i quattro ferri di Gaetano**, uno per quartiere. |
| «Ogni sentimento lascia un filo invisibile nel mondo, e i fili più forti non scompaiono nemmeno dopo la morte.» · Violante: «Bianca non vuole più niente.» · Mariella: «Non devi aggiustarmi.» · Agnese chiede di «non lasciare che la morte del padre determini ogni sua decisione» | bibbia §I, §III, §VIII, §IX | È la regola con cui il segreto rovescia la storia (vedi §2.4). |
| Tonino, prima battuta del gioco: «Mangia. Magari sotto 'sta maschera ce sta ancora qualcuno.» | bibbia §X | La frase sul nero del finale segreto la chiude: «Sotto la maschera c'era ancora qualcuno.» |
| Notti che cambiano: dalla notte 2 la luna si sposta e Mariella è alla finestra; notte 3 Tonino: «quanno 'a luna cammina, quaccheduno se ricorda» | `00-config.js › NOTTI_C`, `t4 › TESTI_NOTTI_C` | Gli indizi del segreto seguono lo stesso calendario (notte 2, 3, 4…). |

**Violante o Donna Luciana?** La bibbia dice Violante; il Teatro (boss, sipari, decisione sulla Voce del 9 novembre)
dice Donna Luciana. Non decidiamo noi: nel codice il nome è una sola costante (`TESTI_B8.nomeSignora`), le battute
della bibbia che contenevano «Violante» usano quella costante. **Decisione aperta per l'autore.**

**«La voce scompare per sempre» e il finale.** Nel finale vero Donna Luciana, in ginocchio, dice ancora le sue
ultime battute (quelle della bibbia): è una donna che parla, non più la narratrice. Da lì in poi nessuna voce.
**Da confermare con l'autore.**

---

## 1. Il finale vero — «Ultimo atto: il bivio»

**Quando parte.** La prima volta che Donna Luciana cade in uno slot: chiusa la pergamena del registro (a7), il
palco si ferma e comincia il finale (fase `finale`). Niente botola, niente Patto: la notte finisce qui.

**Forma.** Scene a schermo intero disegnate col canvas nello stile a ombre: boccascena di velluto, fondale,
sagome nere con pochi accenti oro/rosso, cartiglio in basso. Spazio / E / Invio / click avanzano; la scelta si fa
con ↑↓ o 1-2. Nessun filmato. La prima volta non si salta; rivisto dal Diario, Esc chiude.

### 1.1 Scena «Le Mani ferme» (palco della Reggia, torce)

| Chi | Testo | |
|---|---|---|
| didascalia | Le grandi Mani restano appese, aperte. Nessun filo le tira più. | [nuovo] |
| didascalia | La Voce che raccontava la notte adesso è soltanto una donna in ginocchio sulle assi. | [nuovo] |
| Donna Luciana | Guardati. Hai attraversato un'intera città per uccidere qualcuno. | [bibbia] |
| didascalia | Ferruccio tiene la spada alzata. | [bibbia] |
| Donna Luciana | Io ho fatto tutto questo affinché nessuno dovesse farlo mai più. | [bibbia] |
| *se ha addosso reliquie del Patto* — didascalia | Le reliquie del Patto, addosso a Ferruccio, sono tiepide come seta appena tessuta. | [nuovo] |
| *idem* — Donna Luciana | E porti addosso i miei doni. Non dirmi che non ti hanno fatto comodo. | [nuovo] |
| *se non ha nessun patto* — Donna Luciana | Nemmeno un dono hai voluto da me. Testardo come il ferro. | [nuovo] |
| *Tonino: ricordo restituito* — Donna Luciana | A quel venditore hai ridato una moglie morta. E lo chiami un regalo? | [nuovo] |
| *Tonino: ricordo negato* — Donna Luciana | Al venditore hai lasciato il suo sorriso. Hai scelto al posto suo: proprio come me. | [nuovo, eco di Taddeo §IV «Stai scegliendo al posto suo»] |
| *Medaglione ancora in mano* — didascalia | In tasca Ferruccio ha ancora il Medaglione di Rosa. Per Tonino non ha deciso nessuno. | [nuovo] |
| Donna Luciana | Se mi uccidi, torneranno la fame, l'odio e la paura. | [bibbia] |
| Donna Luciana | Se mi risparmi, continueranno a sorridere. | [bibbia] |
| Donna Luciana | Dimmi, Ferruccio. Chi di noi due è davvero un mostro? | [bibbia] |
| didascalia | La risposta appartiene a te. | [bibbia, «al giocatore»] |

**Scelta** — titolo «Quanto vale la felicità?», sottotitolo «Donna Luciana attende la tua decisione.» [bibbia]

1. **Spezza il Velo** — «La città sarà libera. Tornerà anche il dolore.» [bibbia] → flag `violante = uccisa`
2. **Risparmia Donna Luciana** — «La città resterà in pace. Nessuno potrà più scegliere.» [bibbia] → `violante = risparmiata`

### 1.2 Ramo A — «Il Velo spezzato»

Palco, poi **Caserta sotto un cielo azzurro** (la scena più luminosa del gioco, come chiede la bibbia §XX), poi
Piazza Dante di giorno con la folla.

| Chi | Testo | |
|---|---|---|
| didascalia | Ferruccio avanza. Lei non tenta di difendersi. | [bibbia] |
| Donna Luciana | Allora non hai imparato niente. | [bibbia] |
| didascalia | Il giglio ricamato si spegne e i fili che attraversano la città si spezzano. | [bibbia] |
| didascalia | Per un istante non si sente nulla. | [bibbia] |
| didascalia | Poi una donna comincia a piangere. Un bambino chiama sua madre. | [bibbia] |
| didascalia | Un uomo ride davvero, sorpreso dalla propria risata. | [bibbia] |
| didascalia | La luce della luna lascia spazio a un cielo azzurro e vivace. | [bibbia] |
| *patto* — didascalia | Le reliquie del Patto gli si sfanno in cenere tra le dita. | [nuovo] |
| Guardia | La Signora! L'ha ammazzata! | [bibbia] |
| Un cittadino | Era lei che dava da mangiare ai nostri figli! | [bibbia] |
| Un altro | Assassino! | [bibbia] |
| *Tonino restituito* — didascalia | Tonino è tornato capace di soffrire e sa che Ferruccio lo ha aiutato. | [bibbia] |
| *idem* — Tonino | Mi hai ridato mia moglie nei ricordi. Ma questo non ti dava diritto di togliere una vita! | [bibbia] |
| *idem* — didascalia | Gli scaglia contro un oggetto e tenta di fermarlo. | [bibbia] |
| *Tonino negato / mai deciso* — didascalia | Il Velo scompare e Tonino ricorda improvvisamente Rosa. | [bibbia] |
| *idem* — Tonino | E tu saresti quello che ci ha salvati? | [bibbia] |
| didascalia | Ferruccio riesce a fuggire. | [bibbia] |
| **sul nero** | «Il primo dono della libertà fu il diritto di odiarlo.» | [bibbia] |

### 1.3 Ramo B — «Il Velo ricucito»

Palco, poi **Piazza Dante grigia** con i fili d'oro tesi sulle case.

| Chi | Testo | |
|---|---|---|
| didascalia | Ferruccio abbassa la spada. | [bibbia] |
| Donna Luciana | Lo sapevo. | [bibbia] |
| Donna Luciana | In fondo, anche tu desideri soltanto che il dolore finisca. | [bibbia] |
| didascalia | Ricuce il Velo. I fili tornano a estendersi sulle case di Caserta. | [bibbia] |
| didascalia | Le finestre si illuminano e le persone riprendono a sorridere. | [bibbia] |
| *patto* — didascalia | Le reliquie del Patto, addosso a Ferruccio, tornano a scaldarsi. | [nuovo] |
| Donna Luciana | Non sarai ricordato come un eroe. | [bibbia] |
| Donna Luciana | Ma potrai vivere in pace. | [bibbia] |
| didascalia | Piazza Dante. I commercianti sono tornati ai loro banchetti. Nessuno sembra preoccupato. | [bibbia] |
| Tonino | Buongiorno, guagliò! Che bella giornata! | [bibbia] |
| didascalia | Ferruccio osserva il cielo coperto. | [bibbia] |
| Tonino | Eh, bellissima. Proprio bellissima. | [bibbia] |
| *Tonino restituito* — didascalia | Il Velo torna a cancellare il suo lutto. Tonino canticchia mentre sistema due piatti sul tavolo. | [bibbia] |
| *idem* — Tonino | Uno per me e uno per... boh. Sarà l'abitudine. | [bibbia] |
| *Tonino negato / mai deciso* — didascalia | Tonino rimane identico al primo incontro. | [bibbia] |
| *idem* — Tonino | Sempre una bella giornata! Pure quando piove! | [bibbia] |
| **sul nero** | «Nessuno aveva più bisogno di essere salvato. Nessuno poteva più chiedere aiuto.» | [bibbia] |

### 1.4 Epilogo comune — «Bis»

Il palco visto dalla platea: le teste del pubblico d'ombre in basso, il sipario a metà, Donna Luciana a terra con
due fili d'oro ai polsi che salgono oltre il boccascena; sul fondale, piccola, **una porta con l'insegna del fabbro**.

| Chi | Testo | |
|---|---|---|
| didascalia | Il sipario dovrebbe calare. Non cala. | [nuovo] |
| didascalia | Ai polsi di Donna Luciana ci sono fili d'oro. Salgono più in alto, nel buio sopra il palco. | [storia.json] |
| didascalia | Dalla platea delle ombre arriva una voce che non è la sua. | [nuovo] |
| Una voce dal buio | BIS! DA CAPO! | [storia.json] |
| didascalia | I fili tirano. La Burattinaia si rialza come si rialza una marionetta. Non parla più. | [nuovo] |
| didascalia | La luna torna al suo posto. In Piazza Dante un lampione si riaccende. | [nuovo] |
| didascalia | Sul fondale, dove i fili piegano, c'è dipinta una porta. Ha l'insegna di un fabbro. | [nuovo — indizio del segreto] |

### 1.5 Titoli di coda (brevi)

- «La libertà non promette la felicità. Promette soltanto che sarà tua la scelta.» [bibbia §XX]
- FERRUCCIO — LA NOTTE IMMOBILE · Caserta, 1845 [titolo]
- «Una storia di marionette per un pubblico di ombre.» [nuovo]
- Righe dei crediti: tabella `TESTI_B8.crediti` (oggi: «Storia, personaggi e mondo: l'autore» — **i nomi veri li mette l'autore**).
- «NOTTE SENZA FINE — sbloccata. Dopo Donna Luciana la botola porta al ciclo: il Teatro replica, più feroce.» [nuovo]
- «[Il copione è strappato. Nessuno detta più le tue parole.]» [decisione sulla Voce]

Poi il risveglio in Piazza Dante (una notte in più), con il cartiglio «SBLOCCATO: Notte senza fine».

### 1.6 Notte senza fine e seconda uscita

- Il ciclo infinito resta quello di prima (botola dopo Donna Luciana), ma ora ha un nome e si dichiara:
  la pillola della botola dice «NOTTE SENZA FINE · CICLO n», il sipario del ciclo dice «NOTTE SENZA FINE»,
  il Diario ne tiene il primato (ciclo massimo).
- Nelle notti successive, caduta Donna Luciana compare a sinistra il **cordone del sipario**: [E] «Cala il sipario»
  rimette in scena l'ultimo atto (con la scelta: la commedia si replica, stanotte si può scegliere altrimenti),
  i titoli e riporta in Piazza Dante. La botola non è più l'unica uscita.
- Il finale visto (ultima scelta fatta) si rivede dal Diario di Ferruccio, sezione «Finali».

**Varianti reali del finale**: 2 rami (scelta) × 3 stati di Tonino (restituito / negato / mai deciso, più la riga
del Medaglione in mano) × patto sì/no. La QA ne prova quattro.

---

## 2. Il finale segreto — «La porta della bottega»

### 2.1 Che porta è

L'autore ha chiesto: «deve c'entrare la porta della prima stanza». La prima stanza è l'hub di Piazza Dante e la
porta di legno chiusa in alto al centro è, nei dati del gioco, la **bottega di Gaetano** — la porta che per la
decisione del 10 ottobre «apre la Fucina del Ricordo», dove «parlare con Gaetano restituisce a Ferruccio il nome
e il volto umano». Non abbiamo inventato un significato: abbiamo usato quello dell'autore, che nel Teatro non era
ancora stato messo in scena. (Nella versione a piattaforme la porta stava «dopo aver percorso Piazza e Corso»; nel
Teatro è sul fondale di Piazza Dante, e l'indizio di Mariella sul Corso diventa il primo passo.)

### 2.2 La chiave: i quattro ferri di Gaetano

«Gli ultimi strumenti del padre», quelli con cui è stata forgiata la spada. Una bottega senza ferri non apre.
Uno per quartiere; restano per sempre nello slot e **si vedono appesi accanto alla porta** nell'hub.

| # | Ferro | Quartiere | Come si ottiene | Perché (leggibile a posteriori) |
|---|---|---|---|---|
| 1 | **Le Tenaglie** | Corso Trieste (piano 1) | Sono a terra nella **stanza segreta** del piano 1. | Indizio canonico di Mariella: il ferro risuona «dietro una porta» sul Corso — una porta che non c'è: il muro segreto. Con le tenaglie Ferruccio e Taddeo tennero il ferro della spada («Quella l'abbiamo forgiata insieme»). |
| 2 | **Il Punzone G. F.** | Villa Comunale (piano 2) | Nella stanza d'ingresso del piano c'è una **fontana muta**. Battuto il boss del piano, invece di scendere nella botola si **torna all'ingresso**: l'acqua scorre e il punzone è sul fondo. | Bibbia §VI: il punzone è «accanto alla fontana della Villa Comunale»; il marmo «custodisce i ricordi degli operai morti» e li libera quando cade. |
| 3 | **La Lima** | San Leucio (piano 3) | Cade quando si batte il boss del piano 3 **senza perdere nemmeno una maschera nella sua stanza**. | Agnese, primo incontro: «Siete venuto ad aggiustarlo o a finirlo?» … «Almeno quelle non le rompete.» A San Leucio non si rompe niente. (Stesso criterio che il gioco già usa per la Porta del Patto sicura.) |
| 4 | **Il Martello** | La Reggia (piano 4) | Cade dall'alto quando cade Donna Luciana, **solo se gli altri tre sono già alla porta** (o presi nella stessa notte). | Gaetano muore nel cantiere della Reggia; il martello è rimasto «in alto», dove salgono i fili della Burattinaia. È l'ultimo ricordo, e arriva solo quando ci sono gli altri. |

**Ultimo passo — bussare.** Con i quattro ferri alla porta la spranga penzola ma la porta non si apre da sola.
Bisogna bussare [E] **come batte lui: tre colpi, una pausa, uno**. È il ritmo con cui la luce sotto la porta
pulsa fin dalla notte 2 e che il Diario annota quella stessa notte («Tre colpi, una pausa, uno.»). Bussare prima
di avere i ferri non è inutile: se il ritmo è giusto la porta risponde, ma «mancano i ferri».

Costanti in `SEGRETO_B8`: 3 colpi entro 150 tick l'uno dall'altro, pausa di 40-200 tick, 1 colpo, poi 60 tick di silenzio.

### 2.3 Gli indizi, notte dopo notte

| Quando | Dove | Indizio | |
|---|---|---|---|
| Notte 1 | — | Niente. La porta è una porta chiusa. | |
| Dalla notte 2 | La porta | Una lama di luce sotto la porta pulsa col ritmo del martello (tre, pausa, uno); avvicinandosi, qualche scintilla e il «tin» del ferro. | particolare che cambia |
| Dalla notte 2, vicino alla porta | La Voce | «Quella porta è dipinta sul fondale, Ferruccio. Non perdere tempo con la scenografia.» — la narratrice mente. Caduta lei: «[Una porta sul fondale. Dietro, un ferro batte: tre colpi, una pausa, uno.]» | [nuovo] |
| Dalla notte 2 | Diario | «Passando davanti alla bottega chiusa ho sentito battere. Tre colpi, una pausa, uno.» | [nuovo] |
| Dalla notte 3 | Tonino | «Chella porta? È 'a puteca 'e Gaetano 'o ferraro.» / «Sta sprangata 'a quanno... boh. E chi s''o ricorda. Ma 'a notte, si staje zitto, siente 'o martiello.» | [nuovo; canone: Tonino introduce la bottega] |
| Dalla notte 4 (senza tenaglie) | Tonino | «'A piccerella d''a fenesta nun parla maje. Stanotte ha ditto 'na cosa sola.» / «"'O fierro sona areto a 'na porta ca nun ce sta, 'ncopp''o Corso."» | [nuovo; canone: l'indizio di Mariella] |
| Sempre | La porta, [E] | Esaminare la porta dice a che punto sei e qual è il prossimo ricordo (testi sotto). | |
| A ogni ferro | La porta | Il ferro compare appeso a un chiodo accanto allo stipite; la luce sotto la porta cresce. | particolare che cambia |
| A ogni ferro | Diario | La pagina della notte lo racconta, e il «seme» in fondo alla pagina indica il successivo. | |
| Finale vero, epilogo | Fondale | «Sul fondale, dove i fili piegano, c'è dipinta una porta. Ha l'insegna di un fabbro.» | |

**Esame della porta [E]** (didascalie, [nuovo]):

- Notte 1: «Una porta di legno, sprangata. Sopra, l'insegna di un fabbro: martello e incudine.»
- Dalla notte 2, nessun ferro: «Dietro la porta un ferro batte. Tre colpi, una pausa, uno. Poi daccapo.» / «Accanto allo stipite ci sono quattro chiodi vuoti, da rastrelliera.»
- Tenaglie: «Le tenaglie sono appese al primo chiodo.» / «Mio padre firmava ogni ferro: G. F. Il punzone lo perse alla Villa, vicino all'acqua. L'acqua tace finché il suo guardiano è in piedi.»
- Punzone: «Due ferri. Dentro, il martello ha saltato un colpo.» / «A San Leucio una ragazza rideva: "Almeno quelle non le rompete." Lì il ferro si arrende solo a chi non rompe niente. Nemmeno una maschera.»
- Lima: «Tre ferri. Manca il martello.» / «Lo lasciò sul ponteggio della Reggia, la mattina del crollo. Sta in alto, dove salgono i fili: bisogna far cadere chi li regge.»
- Tutti e quattro: «I quattro ferri sono alla porta. La spranga penzola, ma la porta non cede.» / «Bisogna bussare come bussa lui.»
- Bussata sbagliata: «La porta non risponde.»
- Ritmo giusto senza ferri: «La porta risponde: tre colpi, una pausa, uno. Ma la spranga non si muove. Mancano i ferri.»

### 2.4 Cosa c'è dietro: il rovesciamento

**Chi tiene davvero i fili? Nessuno.** Dietro la bottega non c'è Corso Trieste: c'è il **retro del Teatro**.
I fili d'oro che salgono dai polsi di Donna Luciana non arrivano alla mano di un burattinaio più grande:
ridiscendono qui, nella fucina del padre, e sono **annodati all'incudine — e alla spada di Ferruccio**.

- Alla parete ci sono le maschere di Pulcinella, **una per ogni notte giocata**: ogni maschera che il giocatore ha
  spezzato morendo è stata ribattuta qui, con una cucitura d'oro. È per questo che Ferruccio, solo lui, ogni notte si
  rialza e ricorda.
- La Burattinaia non ha mai legato Ferruccio: **ha tirato il filo con cui era arrivato**, la vendetta per il padre
  («Ogni parola che udivi nel buio... era solo il mio filo che ti muoveva i passi»). Il «Burattino Senza Filo» un
  filo l'aveva: di ferro.
- E lei pende dal suo, uguale: «Sale verso qualcuno che non vuole più niente» (eco di «Bianca non vuole più
  niente»; Bianca non si vede e non si nomina: il dubbio resta, come vuole la bibbia §XI).
- È la leggenda del Velo presa alla lettera: i fili più forti non scompaiono nemmeno dopo la morte. I morti non
  tirano: sono i vivi che non li lasciano. Ferruccio e la sua nemica sono la stessa marionetta («Chi di noi due è
  davvero un mostro?»).
- Gaetano non l'ha mai chiesto: «Ma io non te l'ho mai chiesto, figlio.» — la stessa cosa che Mariella scrive a
  Taddeo («Non devi aggiustarmi»).

Niente di questo cambia il Velo, Violante/Luciana o il destino della città: è il perché **la notte di Ferruccio**
si ripete. Per questo non è la «soluzione perfetta nascosta» che la bibbia esclude.

### 2.5 Le scene della Fucina del Ricordo (testi completi, tutti [nuovo] salvo dove indicato)

**«La Fucina del Ricordo»** (interno: brace, incudine, un uomo di spalle, la parete delle maschere, i fili che scendono)

| Chi | Testo |
|---|---|
| didascalia | La porta non dà su una strada. Dà sul retro del Teatro. |
| didascalia | Una fucina. Il fuoco è acceso. Alla parete, in fila, maschere di Pulcinella: una per ogni notte. Ne conti {n}. |
| didascalia | Ognuna è stata spezzata. Ognuna è stata ribattuta, con una cucitura d'oro. |
| didascalia | Dal buio del soffitto scendono i fili d'oro: gli stessi dei polsi della Burattinaia. |
| didascalia | Non salgono verso nessuna mano. Scendono qui, e sono annodati al corno dell'incudine. |
| didascalia | All'incudine c'è un uomo di spalle. Batte: tre colpi, una pausa, uno. Poi si ferma. |
| Gaetano | Ferruccio. |
| didascalia | È la prima volta, in tutta la notte, che il tuo nome non suona come un ordine. |
| Gaetano | Ogni notte mi porti una maschera rotta. Ogni notte te la ribatto. È il mio mestiere. |
| Gaetano | Ma io non te l'ho mai chiesto, figlio. |
| didascalia | Guarda i fili sull'incudine. Poi guarda la tua spada: è lì che finisce il nodo. |
| didascalia | La Burattinaia non ti ha mai legato. Le è bastato tirare il filo con cui eri arrivato. |
| didascalia | E ai suoi polsi ce n'è uno uguale. Sale verso qualcuno che non vuole più niente. |
| Gaetano | Fatti guardare. |
| didascalia | Ti toglie la maschera nera come si toglie un ferro dal fuoco: senza fretta. |
| didascalia | Sotto c'è una faccia. È la tua. Te l'eri scordata. |
| Gaetano | Eccoti. |

**Scelta** — titolo «La spada è sull'incudine o nella tua mano?»

1. **Posa la spada sull'incudine** — «Il nodo si scioglie. Nessuno ribatterà più le tue maschere.» → finale segreto
2. **Tienila ancora** — «Tornerai qui ogni notte. La porta resta aperta.» → Gaetano: «Allora a domani, figlio. Il fuoco resta acceso.» Si torna in piazza; la porta resta aperta e ci si può rientrare quando si vuole.

**«Il nodo»** (solo con la scelta 1)

| Chi | Testo |
|---|---|
| didascalia | Ferruccio posa la spada sull'incudine. Il ferro è ancora caldo delle mani di suo padre. |
| didascalia | Il nodo si allenta. I fili d'oro risalgono nel buio, leggeri, senza tirare più niente. |
| Gaetano | Prima fate uscire i ragazzi. **[bibbia, sua unica battuta — qui detta piano]** |
| didascalia | Lo dice piano, stavolta. E indica la porta. |
| didascalia | Il martello non batte più. Alla parete non c'è posto per un'altra maschera. |

**«Piazza Dante, più tardi»** (la piazza con la luna bassa e un primo grigio)

| Chi | Testo |
|---|---|
| didascalia | Fuori, in Piazza Dante, la luna si è mossa. Nessuno ha gridato bis. |
| didascalia | Caserta dorme ancora, o è sveglia e lo odia: quello che hai scelto sul palco resta scelto. |
| didascalia | Ma stanotte nessun filo lo tiene in piedi. Sta in piedi da solo. |
| **sul nero** | «Sotto la maschera c'era ancora qualcuno.» |

Titoli: la frase della bibbia, «FINALE SEGRETO — LA FUCINA DEL RICORDO», la ricompensa.

Dopo: Tonino ha una battuta nuova, una volta: «'O vvi'? T''o dicevo io: sotto 'sta maschera ce steva ancora qualcuno.» [nuovo]

### 2.6 La ricompensa permanente: «Il Volto Ritrovato»

Registrata nella progressione di a6 (`statoA6().sbloccati['b8-volto-ritrovato']`, cartiglio «SBLOCCATO»).
**Una volta per notte, quando l'ultima maschera si spezza, sotto c'è un volto: chi è in scena resta in piedi con
½ Maschera.** (Le «maschere» sono la vita: finite le maschere, prima c'era solo il buio; adesso c'è una faccia.)
Vale per tutti i burattini giocabili. Testo del cartiglio: «Il Volto Ritrovato. Una volta per notte, sotto l'ultima
maschera c'è ancora qualcuno.» [nuovo]

---

## 3. Il Diario di Ferruccio (notte per notte)

Una pagina per notte, scritta alla fine della run (morte, abbandono, finale). In prima persona: Ferruccio è muto,
quindi scrive («Non ho voce: scrivo.»). Frasi corte, parole da fabbro. La pagina si compone una volta sola e si
salva già scritta (non cambia più): ultime 60 notti per slot, chiave `ferruccio.teatro.diario.<slot>`.

**Si apre** dal menu di pausa (linguetta «DIARIO DI FERRUCCIO [N]» accanto al Diario degli oggetti; il menu di
pausa c'è anche nell'hub), con [N] direttamente dall'hub, e con [N] dentro il Diario degli oggetti (terza sezione
accanto a Oggetti e Consumabili [C]). ← → sfogliano le notti, [F] passa a «Finali» (rivedi finale vero, finale
segreto, primato della Notte senza fine, ferri trovati), Esc chiude.

**Da cosa è composta** (dal Registro di a7 + osservazioni nostre): apertura · fin dove è arrivato (piano,
quartiere, stanze, nemici) · boss battuti · oggetti presi, patti, oggetti mai visti · stanze speciali · scelte
(Tonino) · trasformazioni (`interni.statoTrasformazioni`, se c'è) · come è morto · ferri del segreto · un «seme»
del segreto secondo lo stadio · chiusa. Ogni gruppo ha 2-4 varianti; non si ripete la variante della pagina prima.

Tutte le frasi sono nella tabella `DIARIO_B8` in cima al file e **sono tutte [nuovo], da approvare**. Le principali:

- **Apertura** — notte 1: «Mi sono svegliato in Piazza Dante. La luna non si muove. Non ho voce: scrivo.» · poi:
  «Notte {n}. Stesso lampione, stessa luna. Io no: io me le ricordo tutte.» · «Notte {n}. Il lampione si è riacceso
  da solo, come sempre. Mi sono alzato.» · «Notte {n}. Ho contato le lanterne prima di partire. Poi ho smesso di
  contare.» · «Notte {n}. Tonino mi ha salutato come se fosse la prima volta.» · altro burattino: «Notte {n}.
  Stanotte in scena c'era {personaggio}. Io guardavo da dietro le quinte, e scrivo lo stesso.»
- **Cammino** — «Non sono uscito da Corso Trieste. La pioggia sa di ruggine.» · «Sono arrivato alla Villa
  Comunale. Le lucciole fanno più luce delle finestre.» · «Sono arrivato a San Leucio. I telai battono anche senza
  nessuno.» · «Ho visto la Reggia con le torce accese. Il marmo a scacchi è freddo anche col fuoco.» · «Oltre la
  Reggia il Teatro ricomincia da capo, più feroce. Ciclo {ciclo}.» · «Ho ripulito {stanze} stanze. {nemici} ombre in
  meno, per stanotte.»
- **Boss** — Gatto: «Ho battuto il Gatto dei Quattro Canti. Dentro non c'era un mostro: c'era la roba di casa di
  qualcuno.» · Regina: «Le sue vespe portavano qualcosa verso la Reggia: desideri, credo. Non loro.» · Custode di
  Marmo: «Per un momento ho sentito una voce: "Prima fate uscire i ragazzi!"» · Capitano: «Sotto il piombo ho
  riconosciuto un passo che conoscevo da bambino.» · Spezzafili: «Le sue forbici somigliavano a quelle di mio padre.
  Non mi è piaciuto.» · Luciana: «Ho fermato le Mani di Donna Luciana. La voce che mi raccontava la notte era la
  sua.» · boss nuovi: «Ho battuto {boss}. Non ha lasciato un corpo: solo luci che salivano.»
- **Morte** — gatto, vespa, guardia, statua, maschera d'osso, bomba, sangue, Mani di Luciana, generica («Sono
  caduto contro {fonte}. La maschera si è spezzata.»), abbandono («Ho lasciato la notte a metà. Si può fare: tanto
  ricomincia.»).
- **Oggetti / patto / scelte / trasformazioni / stanze speciali / finali / ferri** — vedi tabella nel file.
- **Semi del segreto** (ultima riga della pagina, secondo lo stadio) — «Passando davanti alla bottega chiusa ho
  sentito battere. Tre colpi, una pausa, uno.» · «La Voce dice che quella porta è dipinta. Le porte dipinte non
  fanno rumore.» · «Mio padre firmava ogni ferro: G. F. Il punzone lo perse alla Villa, vicino all'acqua.» · «A San
  Leucio il ferro si arrende solo a chi non rompe niente. Nemmeno una maschera.» · «Il martello sta in alto, dove
  salgono i fili. Bisogna far cadere chi li regge.» · «Tre colpi, una pausa, uno. L'ho scritto la seconda notte e
  non l'avevo capito.»
- **Chiusa** — «Poi le lanterne si sono spente, una a una.» · «Domani — cioè stanotte — ricomincio.» · «Il legno
  ricorda ogni ferita. Io pure.» · «Chiudo il quaderno. Il lampione si riaccenderà da solo.»

---

## 4. La Voce (didascalie che non fermano il gioco)

**Chi parla.** Donna Luciana in incognito («La Voce» finché non si è rivelata, poi col suo nome). Tono della
decisione dell'autore: calma, materna, poetica, manipolatoria. Le «venature napoletane d'epoca» chieste dal compito
le abbiamo messe nel **lessico del teatro** (signori miei, platea, tela, replica, bis, compagnia) e non nella
grammatica: `storia.json` dà alla Signora «nessun dialetto, lessico elevato ma semplice». **Da confermare.**

**Come si vede.** Una didascalia in basso (sopra la porta sud), fondo scuro velato, filetto d'oro, corsivo
avorio, il nome in piccolo. Entra in 250 ms, resta 2,4 s + 45 ms a carattere, esce in 500 ms. Non ferma niente,
non prende tasti; aspetta se c'è un sipario, un cartiglio o il cartiglio di un oggetto. Suono: un mormorio
grave di mezzo secondo (due oscillatori, filtro vocale che si muove), collegato a `AudioSys.uscita`; tace se
l'audio è muto o se `OPZIONI.voceSuono === false`; le didascalie non si disegnano se `OPZIONI.voce === false`.

**Dopo la caduta di Donna Luciana** (flag `luciana_sconfitta`): stessa posizione, ma fra parentesi quadre, grigio,
senza nome e senza suono — «indicazioni nude di una scena abbandonata».

Tabelle `VOCE_B8` (prima) e `SILENZIO_B8` (dopo). Tutte [nuovo] salvo la riga dell'atto II, data dall'autore.

| Evento | La Voce (varianti) | Senza regia |
|---|---|---|
| Boss: Gatto dei Quattro Canti | «Signori, il Gatto dei Quattro Canti: fatto di tutto ciò che le case hanno dimenticato.» · «Ecco chi fa le fusa sulle vostre soglie vuote. Inchinati, Ferruccio: è il padrone di casa.» · «Un gatto, una piazza, quattro cantoni. Indovina in quale si nasconde la tua fine.» | «[Entra {boss}. Nessuno lo annuncia.]» · «[{boss}. Il copione, qui, è strappato.]» |
| Boss: Capitano di Piombo | «Avanti il Capitano di Piombo: non pensa, non dubita, non manca mai il passo.» · «Un soldato obbedisce, Ferruccio. È tanto più riposante che scegliere.» · «Piombo nelle vene e un ordine nel petto. Fagli il saluto, prima che lo faccia lui.» | idem |
| Boss: Regina delle Vespe | «S'inchini la platea alla Regina delle Vespe: ogni suo ago è un desiderio che non era vostro.» · «Senti come ronza la voglia degli altri? Lei la porta a casa mia, una goccia alla volta.» · «La Regina non punge per cattiveria. Riscuote.» | idem |
| Boss: Custode di Marmo | «Il Custode di Marmo: sta in piedi da sei anni e non ha ancora perdonato nessuno.» · «Piano, Ferruccio. Il marmo custodisce i morti, e i morti hanno il sonno leggero.» · «Guarda come veglia. Anche lui aveva promesso qualcosa a qualcuno.» | idem |
| Boss: Spezzafili d'Ottone | «Lo Spezzafili d'Ottone! Taglia tutto ciò che pende. Tu, per fortuna, non pendi da niente. Vero?» · «Forbici d'ottone, mano di fabbro. Ti ricorda qualcuno, piccolo mio?» · «Zac. Zac. Sentilo come accorda le lame: è la sua ouverture.» | idem |
| Boss: Donna Luciana (dopo la rivelazione) | «Su la tela sull'ultima scena. Recita bene, Ferruccio: il pubblico ricorda soltanto il finale.» · «Le mie Mani non applaudono. Schiacciano.» | «[Entra Donna Luciana. Non dice una parola.]» |
| Boss non in tabella (id nuovi) | «Entra in scena {boss}. Non era nel copione: l'ho aggiunto per te.» · «Signori, {boss}. Trattatelo bene: è nuovo della compagnia.» · «{boss}. Ogni teatro ha le sue sorprese, Ferruccio. Questa morde.» | idem |
| Fine atto I | «Cala la tela sul primo atto. Hai vinto una scena, Ferruccio: la commedia è lunga.» · «Bravo. Il pubblico non applaude, ma non se n'è andato.» | «[Fine dell'atto. Nessun applauso, nessuna voce.]» · «[Il sipario cala da solo.]» |
| Fine atto II | «Il sipario cala sul secondo atto… ma il legno ricorda ogni ferita.» **[autore]** · «Secondo atto. Hai ancora tutte le dita? Contale: nel terzo servono.» | idem |
| Fine atto III | «Terzo atto, fine. Resta la Reggia, e resto io.» · «Il sipario cala sul terzo atto. Riposa, piccolo mio: l'ultima scena la scrivo io.» | idem |
| Boss battuto senza un graffio | «Nemmeno un graffio. Reciti quasi troppo bene: così il pubblico smette di crederti.» | «[Nemmeno un graffio. Nessuno lo ha visto.]» |
| Fine della notte (morte) | «Buonanotte, Ferruccio. Domani si replica.» · «Le maschere si spezzano, il legno no. Per questo ti rialzo ogni sera.» · «Cala la tela. Non temere: conosco a memoria la tua parte.» · «Dormi. Chi dorme non soffre: lo ripeto da sei anni, a tutti.» | «[Le lanterne si spengono. Nessuno augura la buonanotte.]» |
| Trasformazione | «Guardati: {nome}. Ogni cosa che raccogli ti riscrive un poco.» · «{nome}! Che bel costume. Te l'ho forse cucito io?» · «Ecco: adesso sei {nome}. Il burattino cambia abito, non padrone.» | «[{nome}. Nessuno commenta.]» |
| Stanza segreta aperta | «Quel muro non era nel copione. Rimettilo dov'era, per favore.» · «Curioso come un gatto. Ricorda com'è finito, il gatto.» | «[Un muro si apre. Non era scritto da nessuna parte.]» |
| Patto d'Ombra stretto | «Una firma col sangue. Vedi che ci intendiamo, tu ed io?» · «Prendi, prendi pure. I miei doni non hanno mai fatto male a nessuno che li ricordi.» | «[Un patto. Nessuno ringrazia.]» |
| Ultima mezza maschera | «Mezza maschera. Così poco legno fra te e il silenzio.» · «Trema, il burattino. Lo vedo anche da quassù.» | «[Mezza maschera. Solo il cigolio delle assi.]» |
| Medaglione di Rosa raccolto | «Lascialo dormire, quel ricordo. A Tonino ho tolto un peso, non una moglie.» | — |
| Vicino alla porta della bottega | «Quella porta è dipinta sul fondale, Ferruccio. Non perdere tempo con la scenografia.» · «Ancora lì? Dietro non c'è niente. L'ho fatta dipingere io.» | «[Una porta sul fondale. Dietro, un ferro batte: tre colpi, una pausa, uno.]» |
| Un ferro di Gaetano trovato | «Lascia quel ferro vecchio. Non è di scena.» · «Ferraglia. Buttala: ti appesantisce il passo.» | «[Un ferro vecchio. Pesa come pesano le cose vere.]» |
| Bussata alla porta | «Non si bussa a una porta dipinta. Fai ridere il pubblico.» | — |
| Ingresso nella Notte senza fine | — (la Voce è già caduta) | «[Notte senza fine, ciclo {ciclo}. Il Teatro replica da solo.]» |

Per i boss nuovi delle altre squadre: `window.__teatro.interni.finaliB8.registraVoceBoss(id, [righe])`.

---

## 5. Cosa serve alla QA (in `window.__teatro.interni.finaliB8`)

`stato()` · `azzera()` · `avviaFinale('vero' | 'segreto', { rivisto })` · `scena()` (id, battuta, scelta) ·
`avanza()` · `scegli(i)` · `saltaFinale()` · `daiFerro(id)` / `impostaFerri([ids])` · `bussa()` · `apriPorta()` ·
`indiziHub()` · `scriviPagina(voce)` / `pagine()` · `apriDiario(sezione)` · `voce(evento, dati)` / `didascalia()` ·
`registraVoceBoss(id, righe)`. Suite: `tools/qa-teatro-finali.js`.

## 6. Decisioni aperte per l'autore

1. Il nome: Donna Luciana o Violante (una costante).
2. Donna Luciana che parla ancora nel finale, dopo che «la voce scompare per sempre».
3. Le sei battute di Gaetano (la bibbia lo voleva muto; la decisione del 10 ottobre lo fa parlare).
4. Il rovesciamento (§2.4): i fili della Burattinaia annodati alla spada di Ferruccio.
5. La scelta si può rifare a ogni «Cala il sipario» (la commedia si replica): vale l'ultima. In alternativa la si
   blocca alla prima.
6. La Lima «senza perdere una maschera dal boss di San Leucio»: è il passo difficile. Se è troppo, si può
   allargare a «senza perdere una maschera intera».
7. Venature napoletane della Voce solo nel lessico teatrale.
