# I finali del Teatro, la porta della bottega, il Diario di Ferruccio e la Voce

> Proposta della squadra b8 (file `gioco/teatro/b8-finali-diario.js`). Tutti i testi segnati **[nuovo]**
> sono scritti da noi e sono **da approvare dall'autore**; quelli segnati **[bibbia]** sono presi alla
> lettera da `trama/ferruccio-bibbia.md` / `trama/storia.json` (cambia solo il nome della Signora, vedi §0).
> Niente di `trama/` è stato modificato.

## 0. Da dove discende tutto (letto prima di scrivere)

| Fatto | Fonte | Come lo usiamo |
|---|---|---|
| La Voce narrante è Donna Luciana; si rivela all'ingresso del suo boss; **sconfitta lei, la voce scompare per sempre** e restano solo indicazioni nude fra parentesi quadre: «[Il copione è strappato. Nessuno detta più le tue parole.]» | `trama/decisione-narratrice-donna-luciana.md` | La «Voce del Burattinaio» chiesta dal compito è **lei** (la Burattinaia). Finché non è caduta commenta boss, atti, notti. Dopo la sua prima sconfitta le stesse didascalie diventano «senza regia»: fra quadre, senza nome, senza suono. |
| «Spezzandola si scopre che anche ai suoi polsi sono legati fili d'oro che salgono più in alto nel buio del Teatro: "BIS! DA CAPO!"» | `storia.json › boss › donna-luciana › rivelazione` | È il ponte fra il finale vero e la «Notte senza fine», ed è la domanda a cui risponde il finale segreto: chi c'è in cima a quei fili? |
| Le due conclusioni della bibbia (Spezza il Velo / Risparmia), le quattro scene conclusive di Tonino, le frasi sul nero, la frase dei titoli di coda | bibbia §X, §XVI, §XX | Il finale vero **è** il bivio della bibbia, messo in scena sul palco delle marionette. Battute alla lettera. |
| «Questo rende i due finali inevitabilmente opposti, **senza introdurre una soluzione perfetta nascosta**.» | bibbia §VIII | Il finale segreto **non** sceglie per Caserta: chiude il Teatro (la notte che si replica), non il bivio. Lo diciamo a schermo: fuori c'è la città «come l'hai lasciata sul palco». |
| La porta in alto al centro dell'hub è la **bottega di Gaetano**: `presenze › id "bottega" › etichetta "bottega di Gaetano" › aperta_se { fucina_aperta: "vera" }` | `t4-hub-storia.js › DATI.modelloHub` | È «la porta della prima stanza». Il flag `fucina_aperta` esiste già e non lo imposta nessuno: lo impostiamo noi quando il segreto è risolto. |
| «Tonino e Assunta introducono la bottega di Gaetano; Mariella aggiunge l'indizio del **ferro che risuona dietro una porta** su Corso Trieste. […] la porta della bottega apre la **Fucina del Ricordo**. […] All'interno, parlare con Gaetano **restituisce a Ferruccio il nome e il volto umano**.» | `trama/inizio-memoria-e-doni.md` (decisione dell'autore, 10 ottobre) | **Questo è il significato preciso della porta.** Dietro c'è la Fucina del Ricordo; lì Gaetano restituisce il volto. Gli indizi sono quelli scritti dall'autore: Tonino introduce la bottega, Mariella dice del ferro che risuona. |
| **Nota dell'autore arrivata durante il lavoro**: dietro tutto c'è «Il Grande Burattinaio», le gigantesche mani guantate di bianco che dall'alto reggono i fili (le due Mani che il gioco disegna già), con forbici colossali per strappare i fili di Ferruccio; si arriva «Sopra la Ribalta» da una porta chiusa da **3 sigilli**; il finale più vero: Ferruccio taglia l'ultimo filo maestro, libera il teatro e cala per sempre il sipario. | autore, via coordinatore | **Usata tutta**, vedi §2: la porta della bottega è la porta dei 3 sigilli (uno per quartiere), dietro c'è la Fucina del Ricordo e dalla fucina una scala sale Sopra la Ribalta. Come l'abbiamo resa coerente con la bibbia: §2.4. |
| Gaetano «non deve trasformarsi in un fantasma che accompagna e spiega tutto»; una sola battuta canonica: «Prima fate uscire i ragazzi!» | bibbia §VI | Nella Fucina Gaetano dice sette battute brevi, da capomastro. Non spiega il Velo: fa il suo mestiere (tempra le forbici). La sua battuta canonica torna come congedo. |
| «La sua spada, forgiata con **gli ultimi strumenti del padre**» · Taddeo: «Quella l'abbiamo forgiata insieme.» · il punzone **G. F.** «accanto alla fontana della Villa Comunale» · Agnese: «Siete venuto ad aggiustarlo o a finirlo?» … «Almeno quelle non le rompete.» · il giglio «è il simbolo che lega i guardiani a Violante» | bibbia §III, §IV, §V, §VI, §XII | Ogni sigillo (ceralacca col giglio) si rompe con uno dei **ferri di Gaetano**, uno per quartiere. |
| L'oggetto attivo con cui Ferruccio comincia ogni notte si chiama **«Forbici di Gaetano»** | `00-config.js › OGGETTI_ATTIVI.forbici` | Contro le forbici colossali del Burattinaio, il filo maestro lo tagliano le forbici del padre. |
| «La magia utilizzata da Violante non nasceva a Caserta, ma era stata tramandata da secoli.» | bibbia, Espansione III | È lo spazio che la bibbia lascia al Grande Burattinaio: le Mani sono più vecchie della Signora. |
| Sequenza di morte: «I fili d'oro si spezzano. La maschera si stacca in pezzi che salgono.» Poi il lampione si riaccende. | `t4-hub-storia.js › morte` | Sopra la Ribalta si scopre cos'era: le forbici colossali che strappano i fili, le maschere che salgono ai ganci, qualcuno che ogni notte rimette insieme il burattino. |
| «Ogni sentimento lascia un filo invisibile nel mondo, e i fili più forti non scompaiono nemmeno dopo la morte.» · Violante: «Bianca non vuole più niente.» · Mariella: «Non devi aggiustarmi.» · «Se nessuno vuole essere liberato, hai comunque il diritto di farlo?» | bibbia §I, §VIII, §IX, chiusa | Il padre non chiede vendetta («Io non te l'ho mai chiesto»); il taglio del filo maestro non è un lieto fine: «Nessuno gliel'aveva chiesto. Nemmeno stavolta.» |
| Tonino, prima battuta del gioco: «Mangia. Magari sotto 'sta maschera ce sta ancora qualcuno.» | bibbia §X | La frase sul nero del finale più vero la chiude: «Sotto la maschera c'era ancora qualcuno.» |
| Notti che cambiano: dalla notte 2 la luna si sposta e Mariella è alla finestra; notte 3 Tonino: «quanno 'a luna cammina, quaccheduno se ricorda» | `00-config.js › NOTTI_C`, `t4 › TESTI_NOTTI_C` | Gli indizi del segreto seguono lo stesso calendario (notte 2, 3, 4…). |

**Luogo e anno.** Nella nota l'autore scrive «Napoli del 1839». Il gioco e la bibbia dicono **Caserta, 1845**
(il 1839 è l'anno del crollo del cantiere, sei anni prima). Abbiamo seguito la bibbia: tutti i testi dicono
Caserta e «sei anni». **Da segnalare all'autore.**

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
due fili d'oro ai polsi che salgono oltre il boccascena verso due Mani guantate di bianco; sul fondale, piccola,
**una porta con l'insegna del fabbro e tre sigilli**.

| Chi | Testo | |
|---|---|---|
| didascalia | Il sipario dovrebbe calare. Non cala. | [nuovo] |
| didascalia | Ai polsi di Donna Luciana ci sono fili d'oro. Salgono più in alto, nel buio sopra il palco. | [storia.json] |
| didascalia | Le grandi Mani, che credevi sue, si richiudono da sole. Portano guanti bianchi. | [nuovo — il Grande Burattinaio dell'autore] |
| Una voce dall'alto | BIS! DA CAPO! | [storia.json] |
| didascalia | I fili tirano. La Burattinaia si rialza come si rialza una marionetta. Non parla più. | [nuovo] |
| didascalia | La luna torna al suo posto. In Piazza Dante un lampione si riaccende. | [nuovo] |
| didascalia | Sul fondale, dove i fili piegano, c'è dipinta una porta. Ha l'insegna di un fabbro e tre sigilli. | [nuovo — indizio del segreto] |

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

## 2. Il finale segreto — la porta dei tre sigilli, la Fucina del Ricordo, Sopra la Ribalta

### 2.1 Che porta è

L'autore ha chiesto: «deve c'entrare la porta della prima stanza», e poi: «si arriva Sopra la Ribalta da una porta
chiusa da 3 sigilli». La prima stanza è l'hub di Piazza Dante e la porta di legno chiusa in alto al centro è, nei
dati del gioco, la **bottega di Gaetano** — la porta che per la decisione del 10 ottobre «apre la Fucina del
Ricordo», dove «parlare con Gaetano restituisce a Ferruccio il nome e il volto umano». Le due idee dell'autore sono
la stessa porta: **sulla spranga della bottega ci sono tre sigilli di ceralacca col giglio; dietro c'è la Fucina
del Ricordo; in fondo alla fucina una scala a pioli sale Sopra la Ribalta**, dove le Mani reggono i fili.
(Nella versione a piattaforme la porta stava «dopo aver percorso Piazza e Corso»; nel Teatro è sul fondale di
Piazza Dante, e l'indizio di Mariella sul Corso diventa il primo sigillo.)

### 2.2 La chiave: tre sigilli, tre ferri di Gaetano

La ceralacca col giglio non si rompe con le mani: ci vogliono «gli ultimi strumenti del padre». Un ferro per
sigillo, un sigillo per quartiere. Restano per sempre nello slot; nell'hub **si vede il sigillo spaccato e il ferro
appeso a un chiodo accanto alla porta**. Lo stato è `sigilli` (0..3).

| # | Sigillo / ferro | Quartiere | Come si ottiene | Perché (leggibile a posteriori) |
|---|---|---|---|---|
| 1 | **Le Tenaglie** | Corso Trieste (piano 1) | Sono a terra nella **stanza segreta** del piano 1. | Indizio canonico di Mariella: il ferro risuona «dietro una porta» sul Corso — una porta che non c'è: il muro segreto. Con le tenaglie Ferruccio e Taddeo tennero il ferro della spada («Quella l'abbiamo forgiata insieme»). |
| 2 | **Il Punzone G. F.** | Villa Comunale (piano 2) | Nella stanza d'ingresso del piano c'è una **fontana muta**. Battuto il boss del piano, invece di scendere nella botola si **torna all'ingresso**: l'acqua scorre e il punzone è sul fondo. | Bibbia §VI: il punzone è «accanto alla fontana della Villa Comunale»; il marmo «custodisce i ricordi degli operai morti» e li libera quando cade. |
| 3 | **La Lima** | San Leucio (piano 3) | Cade quando si batte il boss del piano 3 **senza perdere nemmeno una maschera nella sua stanza**. | Agnese, primo incontro: «Siete venuto ad aggiustarlo o a finirlo?» … «Almeno quelle non le rompete.» A San Leucio non si rompe niente. (Stesso criterio che il gioco già usa per la Porta del Patto sicura.) |

**Il quarto passo è la Reggia.** Rotti i tre sigilli, un filo d'oro teso dall'alto tiene ancora chiusa la porta:
si allenta solo dopo che Donna Luciana è caduta e si è visto l'epilogo «Bis» del finale vero (è lì che si scopre
che i fili salgono oltre lei).

**Ultimo passo — bussare.** La porta non si apre da sola. Bisogna bussare [E] **come batte lui: tre colpi, una
pausa, uno**. È il ritmo con cui la luce sotto la porta pulsa fin dalla notte 2 e che il Diario annota quella
stessa notte. Bussare prima non è inutile: se il ritmo è giusto la porta risponde, e dice cosa manca.

Costanti in `SEGRETO_B8.bussata`: tre colpi a non più di 0,6 s l'uno dall'altro, una pausa fra 0,75 e 3 s, un
colpo, poi 0,8 s di silenzio.

### 2.3 Gli indizi, notte dopo notte

| Quando | Dove | Indizio | |
|---|---|---|---|
| Notte 1 | — | Niente. Una porta sprangata con tre sigilli. | |
| Dalla notte 2 | La porta | Una lama di luce sotto la porta pulsa col ritmo del martello (tre, pausa, uno); avvicinandosi, qualche scintilla e il «tin» del ferro. | particolare che cambia |
| Dalla notte 2, vicino alla porta | La Voce | «Quella porta è dipinta sul fondale, Ferruccio. Non perdere tempo con la scenografia.» — la narratrice mente. Caduta lei: «[Una porta sul fondale. Dietro, un ferro batte: tre colpi, una pausa, uno.]» | [nuovo] |
| Dalla notte 2 | Diario | «Passando davanti alla bottega chiusa ho sentito battere. Tre colpi, una pausa, uno.» | [nuovo] |
| Dalla notte 3 | Tonino | «Chella porta? È 'a puteca 'e Gaetano 'o ferraro.» / «'A sigillajeno doppo 'o fatto d''o cantiere. Tre sigille. E chi s''o ricorda cchiù pecché.» / «Ma 'a notte, si staje zitto, siente 'o martiello.» | [nuovo; canone: Tonino introduce la bottega] |
| Dalla notte 4 (senza tenaglie) | Tonino | «'A piccerella d''a fenesta nun parla maje. Stanotte ha ditto 'na cosa sola.» / «"'O fierro sona areto a 'na porta ca nun ce sta, 'ncopp''o Corso."» | [nuovo; canone: l'indizio di Mariella] |
| Sempre | La porta, [E] | Bussare/esaminare la porta dice a che punto sei e qual è il prossimo ferro (testi sotto). | |
| A ogni ferro | La porta | Un sigillo spaccato, il ferro appeso al chiodo, la luce sotto la porta più forte. | particolare che cambia |
| A ogni ferro | Diario | La pagina della notte lo racconta, e il «seme» in fondo alla pagina indica il successivo. | |
| Finale vero, epilogo | Fondale | «…c'è dipinta una porta. Ha l'insegna di un fabbro e tre sigilli.» + le Mani coi guanti bianchi. | |

**La porta, bussando** (didascalie neutre, [nuovo]):

- Notte 1: «Una porta di legno, sprangata. Sopra, l'insegna di un fabbro. Sulla spranga, tre sigilli di ceralacca col giglio.»
- Dalla notte 2, nessun sigillo rotto: «Dietro la porta un ferro batte. Tre colpi, una pausa, uno. Poi daccapo.» / «La ceralacca non si rompe con le mani: ci vogliono i ferri di chi abitava qui.»
- Un sigillo: «Il primo sigillo è in briciole. Le tenaglie sono appese al chiodo.» / «Mio padre firmava ogni ferro: G. F. Il punzone lo perse alla Villa, vicino all'acqua. L'acqua tace finché il suo guardiano è in piedi.»
- Due: «Due sigilli rotti. Dentro, il martello ha saltato un colpo.» / «A San Leucio una ragazza rideva: "Almeno quelle non le rompete." Lì il ferro si arrende solo a chi non rompe niente. Nemmeno una maschera.»
- Tre, Donna Luciana ancora in piedi: «I tre sigilli sono a terra. Ma un filo d'oro scende dall'alto e tiene chiusa la porta.» / «Finché la Burattinaia regge la scena, non cede.»
- Tre, dopo il finale vero: «I tre sigilli sono a terra e il filo d'oro si è allentato. La porta non cede lo stesso.» / «Bisogna bussare come batte lui.»
- Bussata sbagliata: «La porta non risponde.»
- Ritmo giusto, mancano sigilli: «La porta risponde: tre colpi, una pausa, uno. Ma i sigilli tengono.»
- Ritmo giusto, manca il finale: «La porta risponde. Ma il filo d'oro la tiene.»
- Si apre: «La spranga cade. La porta della bottega è aperta.»

### 2.4 Chi tiene davvero i fili: il Grande Burattinaio, reso coerente con la bibbia

L'idea dell'autore **combacia con il canone già scritto**: `storia.json` dice che ai polsi di Donna Luciana ci sono
fili «che salgono più in alto nel buio del Teatro» e che una voce grida «BIS! DA CAPO!». In cima a quei fili ci
sono le due Mani guantate di bianco — **le stesse che il giocatore ha sempre creduto della Burattinaia** (sul
sipario, nello scontro con lei). Il rovesciamento è questo: la Burattinaia era una marionetta; le Mani non erano sue.

Tre scelte per tenerlo dentro la bibbia:

1. **Il Grande Burattinaio è il padrone del Teatro, non l'autore del Velo.** La bibbia è netta: il Velo l'ha
   fatto la Signora, per non sentire più il dolore di Bianca, e resta colpa sua. Le Mani non la assolvono:
   «La Signora gli ha dato una città intera da far recitare. Ma le Mani sono più vecchie di lei, e di Caserta»
   — è l'aggancio dell'Espansione III («la magia… era stata tramandata da secoli»). Lui vuole una cosa sola: che
   la commedia non finisca. Per questo il suo intero vocabolario è «BIS!» e «DA CAPO!».
2. **Spiega quello che il gioco già mostra.** A ogni morte «i fili d'oro si spezzano» e i pezzi della maschera
   «salgono»: erano le forbici colossali che strappavano i fili di Ferruccio, e le maschere finivano ai ganci
   della graticcia — **una per ogni notte giocata** — dove qualcuno le ricuciva per rimetterlo in scena. Il
   «Burattino Senza Filo» due fili li aveva: sottili come capelli.
3. **Non è la «soluzione perfetta nascosta» che la bibbia esclude.** Tagliare il filo maestro libera il Teatro
   e cala per sempre il sipario: finisce la notte che si replica. **Non sceglie per Caserta**: fuori dal Teatro la
   città è come il giocatore l'ha lasciata sul palco (libera e ostile, o in pace sotto il Velo). E resta la
   domanda della bibbia, perché Ferruccio decide un'altra volta per tutti: «Nessuno gliel'aveva chiesto. Nemmeno
   stavolta.» L'ultima riga dei titoli è la domanda dell'autore: «Se nessuno vuole essere liberato, hai comunque
   il diritto di farlo?»

Il padre resta quello della bibbia: non chiede vendetta («Non lo fare per me, figlio. Io non te l'ho mai chiesto»
— come Mariella: «Non devi aggiustarmi»), non spiega, non sale: tempra le forbici e resta nella fucina.

### 2.5 Le scene (testi completi; tutti [nuovo] salvo dove indicato)

**A. «La Fucina del Ricordo»** (interno: brace, incudine, un uomo di spalle, in fondo una scala a pioli)

| Chi | Testo |
|---|---|
| didascalia | Dietro la porta non c'è una strada. C'è una bottega, e in fondo una scala a pioli che sale nel buio. |
| didascalia | La fucina era spenta da sei anni. Quando Ferruccio entra, la brace si riaccende da sola. |
| didascalia | All'incudine c'è un uomo di spalle. Batte: tre colpi, una pausa, uno. Poi si ferma. |
| Gaetano | Ferruccio. |
| didascalia | È la prima volta, in tutta la notte, che il tuo nome non suona come un ordine. |
| Gaetano | Fatti guardare. |
| didascalia | Ti toglie la maschera nera come si toglie un ferro dal fuoco: senza fretta. |
| didascalia | Sotto c'è una faccia. È la tua. Te l'eri scordata. |
| Gaetano | Eccoti. |
| didascalia | Poi tende la mano. Vuole le forbici: quelle che porti dalla prima notte. |
| Gaetano | Queste le ho fatte io. Tagliano la lamiera. L'oro no: l'oro va tagliato caldo. |
| didascalia | Le arroventa, le ribatte, le tempra. Tre colpi, una pausa, uno. |
| Gaetano | Io resto qui. I ricordi non salgono le scale. |
| Gaetano | Non lo fare per me, figlio. Io non te l'ho mai chiesto. |

**Scelta** — titolo «La scala sale sopra la ribalta.»

1. **Sali sopra la ribalta** — «Dove le Mani reggono i fili. Non si scende com'eri salito.» → Gaetano: «Prima fate uscire i ragazzi.» **[bibbia, sua unica battuta]** · didascalia: «Lo dice piano, stavolta. E guarda la scala.» → `entraSopraLaRibalta()`
2. **Resta ancora un poco** — «La porta resta aperta. Il fuoco resta acceso.» → Gaetano: «A domani, figlio. Il fuoco resta acceso.» Si torna in piazza; la porta resta aperta e si rientra quando si vuole.

Alla fine di questa scena (qualunque scelta) Ferruccio ha di nuovo il volto: ricompensa «Il Volto Ritrovato» (§2.7).

**B. «Sopra la Ribalta»** — oggi una scena narrata; **qui, domani, lo scontro** (§2.6)

| Chi | Testo |
|---|---|
| didascalia | Sopra la ribalta non c'è cielo: c'è la graticcia. Travi, corde, e sotto, piccolo, tutto il Teatro. |
| didascalia | Ai ganci sono appese le tue maschere: una per ogni notte. Ne conti {n}. Ognuna ricucita con un punto d'oro. |
| didascalia | È così che ogni sera tornavi in scena. Qualcuno ti rimetteva insieme. |
| didascalia | Da ogni burattino di Caserta sale un filo. Anche dai polsi della Burattinaia. Anche da te. |
| didascalia | Il Burattino Senza Filo ne aveva due, sottili come capelli. Non li aveva mai visti. |
| didascalia | In cima a tutti i fili ci sono due mani. Guanti bianchi. Sono le Mani che credevi di Donna Luciana. |
| didascalia | Non c'è un volto, sopra. Solo le Mani, e un paio di forbici grandi come un portone. |
| didascalia | Con quelle, ogni volta che cadevi, ti strappava i fili. Poi li riannodava, e la notte ricominciava. |
| Il Grande Burattinaio | BIS! |
| Il Grande Burattinaio | DA CAPO! |
| didascalia | Non sa dire altro. Non vuole altro: che la commedia non finisca. |
| didascalia | La Signora gli ha dato una città intera da far recitare. Ma le Mani sono più vecchie di lei, e di Caserta. |
| didascalia | Tutti i fili, salendo, si torcono in uno solo: il filo maestro. Lo tiene con due dita. |

**C. «Il filo maestro»**

| Chi | Testo |
|---|---|
| didascalia | Le forbici colossali si chiudono dove un attimo prima c'era Ferruccio. Tagliano l'aria. |
| didascalia | Ferruccio ha in mano le forbici di suo padre. Piccole. Ancora calde di fucina. |
| didascalia | Non lo fa per suo padre. Lo fa lo stesso. |
| didascalia | Un colpo solo. Il filo maestro canta come una corda di violino, e si spezza. |
| didascalia | Le Mani si aprono. Per un momento cercano qualcosa da reggere. Poi restano guanti vuoti. |
| didascalia | I fili d'oro cadono sul palco come pioggia. Giù, i burattini restano in piedi lo stesso. |
| didascalia | Nessuno gliel'aveva chiesto. Nemmeno stavolta. |

**D. «Cala il sipario»** (la platea: il sipario scende, le ombre si alzano)

| Chi | Testo |
|---|---|
| didascalia | Il sipario cala. Stavolta nessuno grida bis. |
| didascalia | In platea le ombre si alzano, una a una. Hanno facce. Si guardano intorno come chi si sveglia in chiesa. |
| *se sul palco hai spezzato il Velo* — didascalia | Fuori dal Teatro c'è Caserta libera, che lo odia. Nessun filo, adesso, li obbliga: lo scelgono. |
| *se l'hai ricucito* — didascalia | Fuori dal Teatro c'è Caserta che sorride sotto il Velo. Ma la commedia che glielo faceva sembrare giusto è finita. |
| didascalia | Ferruccio scende la scala a viso scoperto. Nessuno lo tiene in piedi. Sta in piedi da solo. |
| **sul nero** | «Sotto la maschera c'era ancora qualcuno.» |

**Titoli del finale più vero**: la frase della bibbia · «IL FINALE PIÙ VERO — SOPRA LA RIBALTA» · «Il sipario è
calato per sempre. Chi vuole può ancora salire sul palco: stavolta per scelta.» · la ricompensa · e per ultima la
domanda della bibbia: «Se nessuno vuole essere liberato, hai comunque il diritto di farlo?»

Dopo: Tonino ha una battuta nuova, una volta: «'O vvi'? T''o dicevo io: sotto 'sta maschera ce steva ancora qualcuno.» [nuovo]

### 2.6 L'aggancio per lo scontro col Grande Burattinaio (lo fa un'altra squadra)

In `window.__teatro.interni`:

- `sigilli` — numero 0..3 (sola lettura), i sigilli rotti nello slot attivo.
- `entraSopraLaRibalta()` — **il gancio**. Lo chiama la Fucina quando il giocatore sceglie «Sali sopra la ribalta».
  Oggi fa partire subito la scena narrata B-C-D. Se un'altra squadra assegna una funzione a
  `interni.scontroSopraLaRibalta`, il gancio chiama quella (`scontroSopraLaRibalta({ fine, annulla })`) e rende
  `'scontro'`: lo scontro parte **prima** della scena, e a vittoria chiama `fine()`.
- `finaleSopraLaRibalta()` — fa partire la scena narrata (quello che `fine()` chiama).
- `annulla()` (sconfitta nello scontro) riporta in Piazza Dante senza chiudere il finale: la porta resta aperta.

### 2.7 La ricompensa permanente: «Il Volto Ritrovato»

Registrata nella progressione di a6 (`statoA6().sbloccati['b8-volto-ritrovato']`, cartiglio «SBLOCCATO»), data
dalla Fucina del Ricordo. **Una volta per notte, quando l'ultima maschera si spezza, sotto c'è un volto: chi è in
scena resta in piedi con ½ Maschera.** (Le «maschere» sono la vita: finite le maschere, prima c'era solo il buio;
adesso c'è una faccia.) Vale per tutti i burattini giocabili. Testo del cartiglio: «Il Volto Ritrovato. Una volta
per notte, sotto l'ultima maschera c'è ancora qualcuno.» [nuovo]
Il finale più vero registra anche `sbloccati['b8-sipario-calato']` (segno nel Diario, sezione Finali).

---

## 3. Il Diario di Ferruccio (notte per notte)

Una pagina per notte, scritta alla fine della run (morte, abbandono, finale). In prima persona: Ferruccio è muto,
quindi scrive («Non ho voce: scrivo.»). Frasi corte, parole da fabbro. La pagina si compone una volta sola e si
salva già scritta (non cambia più): ultime 60 notti per slot, chiave `ferruccio.teatro.diario.<slot>`.

**Si apre** dal menu di pausa (linguetta «DIARIO DI FERRUCCIO [N]» accanto al Diario degli oggetti; il menu di
pausa c'è anche nell'hub), con [N] direttamente dall'hub, e con [N] dentro il Diario degli oggetti (terza sezione
accanto a Oggetti e Consumabili [C]). ← → sfogliano le notti, [F] passa a «Finali» (rivedi finale vero, Fucina,
Sopra la Ribalta; primato della Notte senza fine; sigilli), Esc chiude.

**Da cosa è composta** (dal Registro di a7 + osservazioni nostre): apertura · fin dove è arrivato (piano,
quartiere, stanze, nemici) · boss battuti · oggetti presi, patti, oggetti mai visti · stanze speciali · scelte
(Tonino) · trasformazioni (`interni.statoTrasformazioni`, se c'è) · come è morto · ferri e sigilli · un «seme»
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
  sentito battere. Tre colpi, una pausa, uno.» · «Sulla spranga della bottega ci sono tre sigilli col giglio.
  Qualcuno non vuole che quella porta faccia parte della scena.» · «La Voce dice che quella porta è dipinta. Le
  porte dipinte non fanno rumore.» · «Mio padre firmava ogni ferro: G. F. Il punzone lo perse alla Villa, vicino
  all'acqua.» · «A San Leucio il ferro si arrende solo a chi non rompe niente. Nemmeno una maschera.» · «Tre
  sigilli rotti, e la porta non cede: un filo d'oro la tiene dall'alto. Bisogna far cadere chi regge la scena.» ·
  «Tre colpi, una pausa, uno. L'ho scritto la seconda notte e non l'avevo capito.»
- **Chiusa** — «Poi le lanterne si sono spente, una a una.» · «Domani — cioè stanotte — ricomincio.» · «Il legno
  ricorda ogni ferita. Io pure.» · «Chiudo il quaderno. Il lampione si riaccenderà da solo.»

---

## 4. La Voce (didascalie che non fermano il gioco)

**Chi parla.** Donna Luciana in incognito («La Voce» finché non si è rivelata, poi col suo nome). Tono della
decisione dell'autore: calma, materna, poetica, manipolatoria. Le «venature napoletane d'epoca» chieste dal compito
le abbiamo messe nel **lessico del teatro** (signori miei, platea, tela, replica, bis, compagnia) e non nella
grammatica: `storia.json` dà alla Signora «nessun dialetto, lessico elevato ma semplice». **Da confermare.**
Il Grande Burattinaio non usa questa voce: di suo si sente solo «BIS! DA CAPO!».

**Come si vede.** Una didascalia in basso (in gioco in basso a destra, sotto il muro della stanza e fuori
dall'HUD; nell'hub e alla morte in basso al centro), fondo scuro velato, filetto d'oro, corsivo avorio, il nome in
piccolo. Entra in 250 ms, resta 1,9 s + 38 ms a carattere, esce in 450 ms. Non ferma niente, non prende tasti;
aspetta se c'è un sipario, un cartiglio o il cartiglio di un oggetto; la presentazione di un boss e la buonanotte
passano davanti alle altre in coda. Suono: un mormorio grave di mezzo secondo
(due oscillatori, filtro vocale che si muove), collegato a `AudioSys.uscita`; tace se l'audio è muto o se
`OPZIONI.voceSuono === false`; le didascalie non si disegnano se `OPZIONI.voce === false`.

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

## 5. Cosa serve alla QA (in `window.__teatro.interni`)

`sigilli` · `entraSopraLaRibalta()` · `finaleSopraLaRibalta()` · `scontroSopraLaRibalta` (gancio, §2.6) e in
`interni.finaliB8`: `stato()` · `azzera()` · `avviaFinale('vero' | 'fucina' | 'ribalta', { rivisto })` ·
`scena()` (id, battuta, scelta) · `avanza()` · `scegli(i)` · `saltaFinale()` · `daiFerro(id)` /
`impostaSigilli(n)` · `bussa()` / `bussaRitmo()` · `apriPorta()` · `indiziHub()` · `scriviPagina(voce, nota)` /
`pagine()` · `apriDiario(sezione)` · `voce(evento, dati)` / `didascalia()` · `registraVoceBoss(id, righe)`.
Suite: `tools/qa-teatro-finali.js`.

## 6. Decisioni aperte per l'autore

1. Il nome: Donna Luciana o Violante (una costante).
2. Donna Luciana che parla ancora nel finale, dopo che «la voce scompare per sempre».
3. Le sette battute di Gaetano (la bibbia lo voleva muto; la decisione del 10 ottobre lo fa parlare).
4. Il Grande Burattinaio come padrone del Teatro e non del Velo (§2.4): è la lettura che lo tiene coerente con
   «Violante è l'ultimo nodo vivente dell'incantesimo» e con «nessuna soluzione perfetta nascosta». Se l'autore
   vuole che tagliare il filo maestro liberi anche Caserta, va cambiata la bibbia §VIII, non solo questi testi.
5. «Napoli del 1839» nella nota dell'autore contro «Caserta 1845» di gioco e bibbia: abbiamo seguito la bibbia.
6. La scelta sul palco si può rifare a ogni «Cala il sipario» (la commedia si replica): vale l'ultima. In
   alternativa la si blocca alla prima.
7. Il terzo sigillo («senza perdere una maschera dal boss di San Leucio») è il passo difficile. Se è troppo, si
   può allargare a «senza perdere una maschera intera».
8. La porta chiede anche il finale vero (Donna Luciana caduta) prima di aprirsi: il finale più vero viene dopo
   quello vero. Se l'autore vuole solo i 3 sigilli, è una costante (`SEGRETO_B8.serveFinaleVero`).
9. Venature napoletane della Voce solo nel lessico teatrale.

## Agnese e Taddeo nel finale vero (h1, `gioco/teatro/h1-agnese-taddeo.js`)

Righe aggiunte ai due rami senza riscrivere le scene (bibbia §IV «Il destino di Agnese», §V «Il destino finale di Taddeo»);
testi in `TESTI_H1.finale`, condizioni `h1:*` in `condizioneB8` secondo i flag `agnese` e `taddeo`.

| Ramo | Condizione | Riga |
|---|---|---|
| Spezza il Velo (scena «folla», prima di «Ferruccio riesce a fuggire.») | agnese risvegliata | Agnese riconosce immediatamente Ferruccio tra la folla… [bibbia] |
| | agnese sognante / non decisa | Il Velo si spezza e Agnese recupera ogni ricordo. Lo riconosce soltanto adesso… [adattato] |
| | Taddeo non accusato | Agnese tenta di fermarlo… · Agnese: «Fermati! Non voglio perderti un'altra volta!» [bibbia] |
| | Taddeo accusato | Agnese: «Hai liberato tutti. Ma chi ti ha dato il diritto di decidere chi deve morire?» [bibbia] |
| | Taddeo perdonato | Taddeo: «Una volta ti ho consegnato per paura. Stavolta vieni con me di tua volontà!» [bibbia] |
| | Taddeo accusato | Taddeo partecipa apertamente alla caccia… [adattato] |
| Risparmia (scena «piazza-grigia», in coda) | agnese risvegliata | …Agnese si tocca istintivamente il polso, proprio come faceva lui. [bibbia] |
| | altrimenti | A San Leucio, Agnese continua semplicemente a tessere. [bibbia] |
| | sempre (non giocando Agnese) | Agnese: «Devo finire una sciarpa. Sento che qualcuno verrà a prenderla.» [bibbia] |
| | Taddeo perdonato | Taddeo continua a essere una guardia. Ricorda a tratti di aver tradito qualcuno… [bibbia] |
| | Taddeo accusato | Taddeo continua a essere una guardia. Quando incrocia Ferruccio, abbassa lo sguardo. [nuovo] |
