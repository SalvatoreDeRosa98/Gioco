# Mappa delle scene — Ferruccio

Derivata da ferruccio-bibbia.md e inizio-memoria-e-doni.md; la fonte di verità resta la bibbia. storia.json è la versione macchina.

## Come leggere

- **Ordine**: passi di 10 dentro il capitolo. Scene con lo stesso ordine ma condizione diversa sono rami alternativi (una sola si vede).
- **Tipo**: obbligatoria (sempre, scheletro XV), condizionale (dipende dai flag), scelta (imposta un flag), boss, indizio (memoria/oggetto facoltativo), epilogo.
- **Condizione**: `flag=valore`; più condizioni sono in AND; `decisa` = qualunque valore. Le battute dentro una scena possono avere varianti `se` (vedi storia.json).
- **Flag**: `tonino_ricordo` (restituito / negato, piazza-dante), `taddeo` (perdonato / accusato, corso-trieste), `registro` (conservato / bruciato, villa-comunale), `agnese` (risvegliata / sognante, san-leucio), `gregorio` (dialogo / attacco, reggia), `violante` (uccisa / risparmiata, reggia), `lettera_agnese` (vera / falsa, derivato), `lettera_mariella` (vera / falsa, derivato), `prove` (vera / falsa, derivato).

## 1. Piazza Dante — Risveglio di Ferruccio

*Piazza Dante, Caserta.* Notte di festa congelata sotto una luna immobile dopo il completamento della Reggia (1845); lanterne, banchetti, finestre illuminate, città addormentata sotto il Velo. Introduzione sicura: movimento, salto, doppio salto, dialogo; poi gatto, guardia e vespa in incontri separati. Rabbia muta davanti alla targa.

| Ord. | Id | Tipo | Condizione | Sommario |
|---:|---|---|---|---|
| 10 | `piazza-dante.risveglio` | obbligatoria (senza battute) | — | Violante ha attivato il Velo durante i festeggiamenti; Caserta si addormenta sotto una luna immobile. Ferruccio si risveglia in Piazza Dante con il volto nero, senza sciarpa e senza scatto; non sa perché è vivo, sa solo… |
| 20 | `piazza-dante.tutorial` | obbligatoria (senza battute) | — | Introduzione sicura: movimento, salto, doppio salto, discesa dalle mensole, dialogo; poi gatto, guardia e vespa in incontri separati. |
| 30 | `piazza-dante.targa-commemorativa` | obbligatoria (1 batt.) | — | Ferruccio trova la targa commemorativa dedicata agli operai morti nel 1839. Legge l'iscrizione: il nome di Gaetano è assente. Colpisce la targa con la spada forgiata con gli ultimi strumenti del padre. |
| 40 | `piazza-dante.tonino-primo-incontro` | obbligatoria (5 batt.) | — | Scena indispensabile del capitolo (XV). Ferruccio, appena risvegliato, trova Tonino dietro un banchetto illuminato da una lanterna. |
| 50 | `piazza-dante.bottega-di-gaetano` | indizio (senza battute) | — | Tonino e Assunta introducono la bottega di Gaetano; Mariella aggiunge l'indizio del ferro che risuona dietro una porta su Corso Trieste (la porta della Fucina del Ricordo). |
| 60 | `piazza-dante.filastrocca` | indizio (1 batt.) | — | Vicino a una finestra Ferruccio trova una vecchia filastrocca dedicata ai bambini. Si ferma a leggerla; non è ancora chiaro cosa significhi. Primo indizio dell'arco di Bianca. |
| 70 | `piazza-dante.gatto-dei-quattro-canti` | boss (senza battute) | — | Boss formato dai ricordi domestici sottratti alle famiglie. Sconfitto, non lascia cadavere: si dissolve in anime colorate che salgono lentamente. |
| 80 | `piazza-dante.scelta-tonino` | scelta (2 batt.) | — | Dopo la sconfitta del Gatto dei Quattro Canti, Ferruccio raccoglie un'anima colorata che contiene il ricordo della moglie di Tonino, Rosa. |
| 90 | `piazza-dante.ricordo-negato` | condizionale (3 batt.) | tonino_ricordo=negato | Ferruccio tiene per sé l'anima. Tonino continua a sorridere, scherza sulla moglie che non ricorda, ride da solo e poi torna a fissare una sedia vuota accanto al banchetto. Ferruccio non ottiene la lettera di Agnese. |
| 90 | `piazza-dante.ricordo-restituito` | condizionale (8 batt.) | tonino_ricordo=restituito | Tonino riconosce un vecchio medaglione di Rosa e pronuncia il suo nome dopo anni. Piange; Ferruccio si avvicina in silenzio. Tonino lo rassicura: gli mancava anche il dolore. |

**Scelte**

- `piazza-dante.scelta-tonino` imposta **tonino_ricordo**:
  - **Restituisci il ricordo di Rosa** → `tonino_ricordo=restituito`. Cosa si perde: Tonino perde la serenità del Velo: torna a piangere la moglie. Il giocatore sceglie il lutto di Tonino al posto della sua pace (principio 1: tra il ricordo e la serenità di Tonino). In cambio Tonino ricorda la lettera di Agnese.
  - **Lascialo dimenticare** → `tonino_ricordo=negato`. Cosa si perde: Tonino resta sorridente ma continua a fissare una sedia vuota senza sapere perché. Ferruccio non ottiene la lettera di Agnese (il rapporto con lei andrà ricostruito solo tramite gli altri eventi). Scegliere al posto suo è il gesto che Taddeo, più avanti, paragonerà a quello di Violante.

**Boss**

- **Gatto dei Quattro Canti** — Formato dai ricordi domestici sottratti alle famiglie. Rivelazione: Ferruccio comprende che le creature d'ombra custodiscono qualcosa di umano.

## 2. Corso Trieste — Rivelazione del tradimento

*Corso Trieste: vetrine, portoni, una finestra illuminata (Mariella), la porta della bottega di Gaetano (Fucina del Ricordo).* Via commerciale; ambizioni e promesse mai mantenute dei lavori della Reggia (Regina dei Debiti); le vespe trasportano desideri rubati verso il palazzo. Dopo lo scontro, il silenzio della strada è rotto da un amico che riconosce una spada; dietro una porta il ferro che risuona.

| Ord. | Id | Tipo | Condizione | Sommario |
|---:|---|---|---|---|
| 10 | `corso-trieste.finestra-mariella` | obbligatoria (1 batt.) | — | Lungo il Corso, una finestra illuminata: Mariella siede e sorride, immobile. Ferruccio si ferma sotto la finestra, alza lo sguardo, poi prosegue. E la prima immagine della felicita come prigione. |
| 20 | `corso-trieste.regina-dei-debiti` | boss (senza battute) | — | Boss nato dalle ambizioni e dalle promesse mai mantenute durante i lavori della Reggia. Sconfitta, si dissolve in anime colorate. Rivelazione: le vespe trasportano desideri rubati verso il palazzo. |
| 30 | `corso-trieste.passato-taddeo` | indizio (9 batt.) | — | Dopo la Regina dei Debiti (nata dalle promesse mai mantenute) un'anima liberata mostra a Ferruccio il passato condiviso con Taddeo e il patto con Violante. |
| 40 | `corso-trieste.scelta-taddeo` | scelta (5 batt.) | — | Scena indispensabile (XV): rivelazione del tradimento. Ferruccio trova Taddeo accanto a una vetrina. Taddeo riconosce la spada forgiata insieme e lo supplica di ascoltarlo. |
| 50 | `corso-trieste.taddeo-accusato` | condizionale (6 batt.) | taddeo=accusato | Ferruccio punta la spada alla gola di Taddeo, che arretra contro la vetrina e grida che uccidendolo Mariella restera comunque nel Velo. |
| 50 | `corso-trieste.taddeo-perdonato` | condizionale (5 batt.) | taddeo=perdonato | Taddeo confessa di aver denunciato Ferruccio per salvare Mariella. Ferruccio rinfodera la spada, resta un istante immobile, poi gli posa la mano sulla spalla. |
| 60 | `corso-trieste.lettera-mariella` | condizionale (6 batt.) | taddeo=perdonato | Dopo la confessione, sotto la finestra illuminata di Mariella, Ferruccio puo leggere la lettera che lei scrisse al fratello prima dell'incantesimo. |
| 70 | `corso-trieste.fucina-del-ricordo` | obbligatoria (senza battute) | — | Dopo aver percorso Piazza e Corso, la porta della bottega di Gaetano (introdotta da Tonino e Assunta, con l'indizio di Mariella del ferro che risuona dietro una porta) apre la Fucina del Ricordo. |

**Scelte**

- `corso-trieste.scelta-taddeo` imposta **taddeo**:
  - **Rinfodera la spada e ascoltalo** → `taddeo=perdonato`. Cosa si perde: Rinunci a punire l'uomo che ti ha consegnato a Violante: la tua rabbia non avra un colpevole su cui scaricarsi. In cambio Taddeo confessa, resta al tuo fianco lasciando messaggi e testimonianze, puo parlare ad Agnese e ti apre la lettera di Mariella. La sua testimonianza e una prova per il confronto con Gregorio.
  - **Puntagli la spada alla gola** → `taddeo=accusato`. Cosa si perde: Perdi l'unico testimone vivo del tradimento e del patto con Violante: niente confessione, niente lettera di Mariella, nessuno che racconti ad Agnese chi sei. Taddeo fugge e cerca i documenti che lo incriminano: diventa un antagonista che lavora contro le tue prove. Il registro restera la tua sola prova, se lo conserverai.

**Boss**

- **Regina dei Debiti** — Nata dalle ambizioni e dalle promesse mai mantenute durante i lavori della Reggia. Rivelazione: Le vespe trasportano desideri rubati verso il palazzo.

## 3. Villa Comunale — Verità sulla morte di Gaetano

*Villa Comunale di Caserta: fontana, statue, registri.* Giardino notturno sotto la luna immobile; marmo che custodisce i ricordi degli operai morti; memoria storica e mistero familiare. La melodia della scatola musicale si sente debolmente.

| Ord. | Id | Tipo | Condizione | Sommario |
|---:|---|---|---|---|
| 10 | `villa-comunale.punzone` | indizio (1 batt.) | — | Accanto alla fontana della Villa Comunale Ferruccio trova il vecchio punzone da fabbro del padre. Lo raccoglie e lo rigira: sul manico sono incise due lettere. Lo stringe, poi lo infila alla cintura. |
| 20 | `villa-comunale.messaggio-taddeo` | condizionale (1 batt.) | taddeo=perdonato | Lungo il percorso obbligatorio Ferruccio trova un messaggio lasciato da Taddeo: una testimonianza scritta del patto con Violante. Ferruccio lo raccoglie e lo ripone accanto alla sciarpa. |
| 30 | `villa-comunale.inchino-bianca` | indizio (1 batt.) | — | Una memoria conservata nel marmo mostra Gregorio mentre insegna a Bianca a fare un inchino. La bambina ride e sbaglia apposta. Il ricordo svanisce quando Gregorio cerca di prenderle la mano. |
| 40 | `villa-comunale.statua-cavaliere` | indizio (3 batt.) | — | Tra le statue della Villa Comunale Ferruccio trova un cavaliere di marmo inginocchiato davanti a un giglio. Si china sulla base e legge l'incisione; resta un istante a fissare il giglio, poi si tocca il petto dove il… |
| 50 | `villa-comunale.registri-pubblici` | obbligatoria (senza battute) | — | Tra i registri pubblici della Villa Comunale Gaetano compare come responsabile dell'incidente. Ferruccio sfoglia le pagine, si ferma sul nome del padre e serra il pugno sull'elsa. |
| 60 | `villa-comunale.madre-di-marmo` | boss (senza battute) | — | Ferruccio affronta la Madre di Marmo, statua che custodisce i ricordi degli operai morti. Sconfitta, non lascia un cadavere: si dissolve in anime colorate che salgono lentamente. Tra queste una memoria del padre. |
| 70 | `villa-comunale.ricordo-gaetano` | obbligatoria (1 batt.) | — | Sconfiggendo la Madre di Marmo, Ferruccio libera una memoria del padre. Il giocatore vede soltanto una breve immagine immobile: Gaetano sorregge una trave mentre alcuni operai si mettono in salvo. Si sente la sua voce. |
| 80 | `villa-comunale.scelta-registro` | scelta (senza battute) | — | Ferruccio trova il documento originale: contiene le cancellature e le correzioni che dimostrano la falsificazione. Suo padre non era responsabile del crollo. |
| 90 | `villa-comunale.registro-bruciato` | condizionale (senza battute) | registro=bruciato | Scena condizionale (XV): il registro brucia sulla fiamma della lanterna; resta solo ciò che Ferruccio ha visto. Senza la testimonianza di Taddeo (taddeo=accusato) non ci sarà dialogo con Gregorio. |
| 90 | `villa-comunale.registro-conservato` | condizionale (senza battute) | registro=conservato | Scena condizionale (XV): Ferruccio ripone il registro originale; prove=vera. Se ha conservato il registro, nel finale della liberazione fugge portando con sé la prova che un giorno potrebbe riabilitare suo padre. |
| 100 | `villa-comunale.risoluzione-taddeo` | condizionale (4 batt.) | registro decisa | Chiusa la scelta sul registro, l'arco di Taddeo si risolve in una delle quattro combinazioni. Mostrata, non spiegata: un foglio firmato sotto la porta, oppure Taddeo che evita lo sguardo di Ferruccio da lontano. |

**Scelte**

- `villa-comunale.scelta-registro` imposta **registro**:
  - **Conserva il registro** → `registro=conservato`. Cosa si perde: Accettare che la verità sul padre debba essere mostrata agli altri, anche se richiederà anni. Il nome di Gaetano resta per ora scritto accanto all'incidente; la prova vale solo se qualcuno vorrà leggerla.
  - **Brucia il registro** → `registro=bruciato`. Cosa si perde: Rifiutare che il nome di Gaetano continui a essere associato all'incidente, ma distruggere anche la prova della sua innocenza. L'atto è emotivamente comprensibile, ma non risolve l'ingiustizia: resta solo ciò che Ferruccio ha visto.

**Boss**

- **Madre di Marmo** — Statua che custodisce i ricordi degli operai morti. Rivelazione: Gaetano non causò l'incidente, ma tentò di salvare gli altri.

## 4. San Leucio — Incontro con Agnese e scoperta del Velo

*Manifattura della seta di San Leucio: telai, Belvedere.* Telai che si muovono da soli, fili che assorbono emozioni, il giglio sulle stoffe. Qui è nato il Velo. Romance malinconico: la stessa sciarpa rossa che non finisce mai.

| Ord. | Id | Tipo | Condizione | Sommario |
|---:|---|---|---|---|
| 10 | `san-leucio.tessitrice-di-pietra` | boss (senza battute) | — | Boss: statua guardiana dei telai incantati. Sconfitta, si dissolve in anime colorate. Rivelazione: il Velo nasce dalla seta e il giglio è il simbolo che lega i guardiani a Violante. |
| 20 | `san-leucio.arrivo-manifattura` | obbligatoria (2 batt.) | — | Scena indispensabile (XV): incontro con Agnese e scoperta del Velo. Ferruccio entra nella manifattura. Alcuni fili destinati alla Reggia si muovono anche se nessuno aziona i telai. |
| 30 | `san-leucio.giglio-sulle-stoffe` | indizio (1 batt.) | — | Accanto ai telai, Ferruccio scopre che la stessa forma floreale del cavaliere di marmo compare sulle stoffe commissionate da Violante. |
| 40 | `san-leucio.fazzoletto-giglio` | indizio (2 batt.) | — | Accanto ai telai Ferruccio trova un piccolo fazzoletto ricamato con un giglio incompleto e lo mostra ad Agnese. Lei spiega che Violante chiedeva spesso di riprodurre quel disegno. |
| 50 | `san-leucio.flashback-telaio` | indizio (5 batt.) | — | Flashback: il primo incontro, prima della maledizione. Ferruccio, mandato a riparare i componenti metallici dei telai, è impacciato e rompe accidentalmente una piccola ruota del telaio. |
| 60 | `san-leucio.flashback-sciarpa` | indizio (4 batt.) | — | Flashback: Agnese regala a Ferruccio una lunga sciarpa rossa. Ferruccio la riceve, se la avvolge al collo e, con un gesto delle mani, le promette che quando avrà abbastanza denaro apriranno insieme una bottega: una… |
| 70 | `san-leucio.lettera-belvedere` | condizionale (2 batt.) | tonino_ricordo=restituito | Al Belvedere di San Leucio Ferruccio tira fuori la lettera d'amore che Agnese aveva scritto prima della maledizione, custodita da Tonino e consegnata in Piazza Dante. |
| 80 | `san-leucio.scelta-agnese` | scelta (senza battute) | — | Davanti al telaio Ferruccio ha in mano ciò che può restituire ad Agnese i ricordi di lui. Sa quanto dolore contengono. Può farle ricordare o lasciarla sognare. |
| 90 | `san-leucio.amore-dimenticato` | condizionale (4 batt.) | agnese=sognante AND taddeo=perdonato | Percorso C — L'amore dimenticato. Ferruccio non ha restituito i ricordi ad Agnese perché sa quanto dolore contengono. Taddeo lo raggiunge e cerca di convincerlo a cambiare idea. Ferruccio abbassa lo sguardo. |
| 90 | `san-leucio.amore-ritrovato` | condizionale (6 batt.) | agnese=risvegliata AND taddeo=perdonato | Percorso A — L'amore ritrovato. Taddeo è arrivato prima: ha confessato ad Agnese di aver consegnato Ferruccio a Violante e l'ha aiutata a ricostruire gli ultimi giorni trascorsi insieme. |
| 90 | `san-leucio.amore-senza-fiducia` | condizionale (4 batt.) | agnese=risvegliata AND taddeo=accusato | Percorso B — L'amore senza fiducia. Agnese recupera i ricordi, ma scopre che Ferruccio ha scelto la vendetta contro il suo vecchio amico. |
| 90 | `san-leucio.ultima-sciarpa` | condizionale (6 batt.) | agnese=sognante AND taddeo=accusato | Percorso D — L'ultima sciarpa. Ferruccio è arrivato a San Leucio senza nessuno disposto ad aiutarlo. Agnese non lo riconosce e gli offre soltanto la sciarpa appena terminata. |
| 100 | `san-leucio.dono-sciarpa` | condizionale (1 batt.) | agnese=risvegliata | Il dono: alla fine del dialogo di risveglio la sciarpa rossa compare sul rig di Ferruccio e abilita lo scatto (C oppure RB/R1). Ferruccio se la stringe al collo e guarda Agnese. |
| 110 | `san-leucio.rinuncia-vendetta` | condizionale (senza battute) | agnese=risvegliata | Agnese chiede a Ferruccio di rinunciare alla vendetta. Non gli chiede di dimenticare ciò che è accaduto, ma di non lasciare che la morte del padre determini ogni sua decisione. |

**Scelte**

- `san-leucio.scelta-agnese` imposta **agnese**:
  - **Falle ricordare** → `agnese=risvegliata`. Cosa si perde: La serenità di Agnese: con il nome di Ferruccio tornano anche gli anni di attesa, la notte dell'incantesimo e il dolore che quei ricordi contengono. Lei tornerà a essere una persona con una storia, ma non è garantito che quella storia finisca bene.
  - **Lasciala sognare** → `agnese=sognante`. Cosa si perde: La libertà di Agnese di scegliere: Ferruccio decide al posto suo, come ha fatto Violante. Il loro amore resta una sensazione senza storia; lei continua a tessere per qualcuno che non ricorda, e la sciarpa (con lo scatto) resta alla bottega.

**Boss**

- **Tessitrice di Pietra** — Statua utilizzata come guardiana dei telai incantati. Rivelazione: Il Velo nasce dalla seta e il giglio è il simbolo che lega i guardiani a Violante.

## 5. Reggia di Caserta — Il Custode e Violante

*Reggia di Caserta, Cortile d'Onore, balcone.* Cortile d'Onore · Notte · Poche luci calde. Torce che si spengono una dopo l'altra mentre Violante scende la scala laterale; fili dorati dal balcone alle strade.

| Ord. | Id | Tipo | Condizione | Sommario |
|---:|---|---|---|---|
| 10 | `reggia.memoria-funerale-bianca` | indizio (3 batt.) | — | Memoria del passato di Violante, prima della tragedia: la donna amata da Caserta resta immobile davanti alla piccola bara di Bianca. Gregorio tenta di prenderle la mano. |
| 20 | `reggia.memoria-tradimento-marito` | indizio (6 batt.) | — | Memoria del passato: Gregorio, scoperto il progetto, chiede a Violante di fermarsi; lei rifiuta. Quando lui tenta di distruggere il primo nucleo del Velo, Violante lo lega al giglio d'oro che gli aveva donato: l'amore… |
| 30 | `reggia.progressione-del-velo` | indizio (senza battute) | — | Ferruccio ricostruisce, attraverso frammenti di seta e appunti nella Reggia, i quattro passi della progressione morale di Violante: 1 Alleviare il dolore (piccoli frammenti di seta per riposare durante il lutto, effetti… |
| 40 | `reggia.attacco-senza-prove` | condizionale (senza battute) | prove=falsa | Ferruccio arriva al Custode senza registro e senza la testimonianza di Taddeo (registro bruciato E Taddeo accusato): non ha nulla da mostrargli. L'unica via è l'attacco e il flag gregorio viene fissato su 'attacco'. |
| 40 | `reggia.scelta-gregorio` | scelta (senza battute) | prove=vera | Nel Cortile d'Onore il Custode avanza con l'alabarda. Ferruccio possiede prove o testimonianze (il registro conservato e/o il messaggio di Taddeo): può estrarle e tendergliele, oppure sguainare la spada e attaccare… |
| 50 | `reggia.confronto-attacco` | condizionale (3 batt.) | gregorio=attacco | Ferruccio si lancia contro il Custode senza tentare il dialogo. Gregorio solleva immediatamente l'alabarda e pronuncia una sola frase. |
| 50 | `reggia.confronto-dialogo` | condizionale (7 batt.) | gregorio=dialogo | Ferruccio tende al Custode il registro o il messaggio di Taddeo. Gregorio si ferma per un istante e pronuncia il nome di Gaetano; poi il giglio sul petto si illumina e la volontà di Violante lo riprende. |
| 60 | `reggia.scontro-custode` | boss (2 batt.) | — | Scontro con il Custode nel Cortile d'Onore. I suoi attacchi sono violenti e regolari, come quelli di una macchina che continua a eseguire un ordine. |
| 70 | `reggia.morte-del-custode` | obbligatoria (10 batt.) | — | L'armatura si spezza, Gregorio cade sulle ginocchia e per la prima volta si vede un volto umano dietro l'elmo. Confessa che non era un ordine del Re ma una promessa fatta alla moglie; se Ferruccio aveva mostrato le… |
| 80 | `reggia.custode-sconfitto` | obbligatoria (26 batt.) | — | Scena indispensabile (XV): rivelazione di Violante. Versione cinematografica (XVI) della morte di Gregorio: cade in ginocchio, il giglio sul petto si spezza e una luce azzurra esce dall'armatura; il Custode muore… |
| 90 | `reggia.nucleo-del-velo` | obbligatoria (senza battute) | — | Rivelazione inevitabile (principio 3): il tessuto custodito a San Leucio è soltanto il mezzo attraverso cui la magia è stata diffusa; il vero nucleo del Velo è legato alla vita di Violante. |
| 100 | `reggia.scatola-musicale` | indizio (2 batt.) | — | Poco prima della scelta finale, nel Cortile d'Onore, Ferruccio trova una scatola musicale. La melodia è la stessa che si sente, debolmente, durante tutti gli incontri con le statue. Violante la apre. |
| 110 | `reggia.ultima-conversazione` | obbligatoria (9 batt.) | — | Violante, scesa nel cortile, parla a Ferruccio che tiene la spada alzata. Lui non risponde: guarda la città oltre il cortile. |
| 120 | `reggia.scelta-violante` | scelta (2 batt.) | — | Atto IV — La scelta. Scoperto che Violante è la vera responsabile del Velo, Ferruccio affronta una contraddizione: la donna che ha tolto agli abitanti la libertà è anche una persona che ha perso una figlia e ha… |
| 130 | `reggia.velo-ricucito` | condizionale (10 batt.) | violante=risparmiata | Ferruccio abbassa la spada. Violante non si pente: raccoglie il giglio d'oro dal mantello del marito e ricuce il Velo; i fili tornano sulle case, le finestre si illuminano e le persone riprendono a sorridere. |
| 130 | `reggia.velo-spezzato` | condizionale (11 batt.) | violante=uccisa | Ferruccio avanza e affonda la spada in Violante, che non si difende e muore convinta di essere stata tradita dall'umanità che voleva proteggere. |

**Scelte**

- `reggia.attacco-senza-prove` imposta **gregorio** — solo se prove=falsa:
  - **Attacca il Custode** → `gregorio=attacco`. Cosa si perde: Senza prove non c'è dialogo possibile: il giocatore deve capire che aver bruciato il registro e accusato Taddeo gli ha tolto la parola davanti al Custode. La verità su Gregorio arriverà solo dopo lo scontro.
- `reggia.scelta-gregorio` imposta **gregorio** — solo se prove=vera:
  - **Mostragli le prove** → `gregorio=dialogo`. Cosa si perde: Rinuncia al primo colpo e si espone all'alabarda: il Custode non può fermarsi comunque, il combattimento comincerà lo stesso. In cambio Gregorio riconoscerà il torto fatto a Gaetano prima dello scontro e, morendo, confesserà l'innocenza del padre.
  - **Attacca il Custode** → `gregorio=attacco`. Cosa si perde: Affronta Gregorio come un nemico da abbattere, senza sapere quanto sia ancora cosciente: perde la confessione anticipata della sua complicità e la frase Tuo padre era innocente. Scoprirà la verità sul Custode solo dopo averlo ucciso.
- `reggia.scelta-violante` imposta **violante**:
  - **Spezza il Velo** → `violante=uccisa`. Cosa si perde: La città sarà libera. Tornerà anche il dolore. Torneranno la fame, l'odio e la paura; Tonino ricorderà Rosa, Mariella la sua paura, Agnese tutto. E nessuno ringrazierà chi ha scelto per loro: Ferruccio diventa il liberatore odiato di Caserta, cacciato da cittadini, guardie, Taddeo e Agnese stessa.
  - **Risparmia Violante** → `violante=risparmiata`. Cosa si perde: La città resterà in pace. Nessuno potrà più scegliere. Violante ricuce i fili: Agnese torna a non riconoscerlo, le testimonianze e il registro perdono valore, il padre resta il colpevole ufficiale. Ferruccio vive in pace come unico testimone cosciente di una menzogna, e dimostra a Violante che può ottenere obbedienza persino da chi conosce la verità.

**Boss**

- **Il Custode (Gregorio Valente)** — Capitano delle guardie legato magicamente al giglio d'oro donatogli da Violante e imprigionato nella sua stessa armatura quando tentò di distruggere il primo nucleo del Velo. Rimane cosciente, ma ogni suo movimento è controllato dal Velo. Rivelazione: Non era un ordine del Re, ma una promessa fatta alla moglie. Con gregorio=dialogo confessa anche Tuo padre era innocente (complicità e innocenza di Gaetano rivelate); con gregorio=attacco ammette Anche io avevo paura di perderla. In entrambi i casi muore e la sua anima sale verso il balcone dove appare Violante: il vero nemico non era lui.

## 6. Epilogo — Lo stato del mondo dopo i finali

*Cortile d'Onore, poi una porzione di Piazza Dante riutilizzata (XVII, §10); San Leucio per Agnese (IV).* Due stati del mondo opposti. Violante uccisa: cielo azzurro intenso, verdi saturi, colori caldi, tutti gli NPC ostili — il mondo più bello e luminoso del gioco. Violante risparmiata: grigio-azzurro, foschia, luce fredda, NPC pacifici che ripetono frasi artificialmente felici, fili d'oro sulle case.

| Ord. | Id | Tipo | Condizione | Sommario |
|---:|---|---|---|---|
| 10 | `epilogo.caserta-controllata` | epilogo (senza battute) | violante=risparmiata | Stato del mondo con il Velo ripristinato: cielo grigio-azzurro con foschia, verdi pallidi e desaturati, luce uniforme e fredda, NPC tutti pacifici e sorridenti con frasi ripetitive e felicità artificiale, melodia lenta… |
| 10 | `epilogo.caserta-libera` | epilogo (senza battute) | violante=uccisa | Stato del mondo dopo la liberazione: cielo azzurro intenso e luminoso, verdi saturi e fiori vivaci, contrasti naturali e colori caldi, tutti gli NPC ostili (accuse, paura, rabbia, richieste d'arresto), melodia dinamica… |
| 20 | `epilogo.bianca-liberazione` | epilogo (senza battute) | violante=uccisa | Il ricordo di Bianca viene liberato. Il giocatore vede il giglio ricamato perdere la sua luce soprannaturale. Rimane un semplice fazzoletto, accanto al corpo di Violante e al mantello vuoto di Gregorio. |
| 20 | `epilogo.piazza-grigia` | epilogo (11 batt.) | violante=risparmiata | La scena passa a Piazza Dante: commercianti ai banchetti, bambini che giocano senza litigare, palette sempre più grigia. |
| 30 | `epilogo.accusa-folla` | epilogo (8 batt.) | violante=uccisa | Due guardie entrano nel cortile e vedono Violante e Gregorio a terra; gli abitanti accorrono e lo accusano. Ferruccio tenta di mostrare la sciarpa, la spada e, se lo possiede, il registro: nessuno lo ascolta. |
| 30 | `epilogo.agnese-manifattura` | epilogo (5 batt.) | violante=risparmiata | Il Velo è ripristinato. Agnese è nella manifattura, sorridente e apparentemente felice. Se aveva recuperato i ricordi, Violante li ha cancellati di nuovo, ma alcuni gesti sono rimasti impressi nel suo corpo: quando… |
| 40 | `epilogo.agnese-folla` | epilogo (9 batt.) | violante=uccisa | Il Velo si spezza e Agnese recupera ogni ricordo, indipendentemente dalla scelta di San Leucio. Dalla folla emerge Agnese: se era stata risvegliata riconosce immediatamente Ferruccio e gli chiede di non scappare; se era… |
| 40 | `epilogo.taddeo-guardia` | epilogo (2 batt.) | violante=risparmiata | Nella Piazza Dante grigia, Taddeo e di nuovo una guardia in pattuglia. Passando accanto a Ferruccio rallenta, lo fissa un istante come se ricordasse, poi il Velo lo riprende e riparte sorridendo. |
| 50 | `epilogo.agnese-accusa` | epilogo (2 batt.) | violante=uccisa AND agnese=risvegliata AND taddeo=accusato | Il rapporto era ormai compromesso (percorsi 5 e 7: Agnese risvegliata, Taddeo accusato): Agnese lo accusa direttamente davanti alla folla. |
| 50 | `epilogo.agnese-fermati` | epilogo (2 batt.) | violante=uccisa AND [(agnese=sognante) OR (agnese=risvegliata AND taddeo=perdonato)] | Agnese lo ama ancora (percorsi 1, 2, 3, 4, 6, 8): tenta di fermarlo per costringerlo a consegnarsi alle guardie, convinta che sia l'unico modo per salvarlo dal linciaggio. |
| 50 | `epilogo.tonino-negato-risparmiata` | epilogo (2 batt.) | tonino_ricordo=negato AND violante=risparmiata | Tonino è identico al primo incontro: sorridente al banchetto, ripete una frase di felicità artificiale sotto il cielo coperto. Ferruccio passa oltre. |
| 50 | `epilogo.tonino-restituito-risparmiata` | epilogo (2 batt.) | tonino_ricordo=restituito AND violante=risparmiata | Il Velo ricucito cancella di nuovo il lutto di Tonino. Canticchia mentre sistema due piatti sul tavolo, senza sapere per chi sia il secondo. Ferruccio osserva senza poter dire nulla. |
| 60 | `epilogo.gaetano-velo` | epilogo (senza battute) | violante=risparmiata | I documenti vengono nuovamente alterati nella memoria collettiva. Il padre rimane il colpevole ufficiale, anche se Ferruccio ha conservato il registro. |
| 60 | `epilogo.taddeo-caccia` | epilogo (4 batt.) | violante=uccisa | Nella fuga dal Cortile verso Piazza Dante, Taddeo e tra gli NPC ostili. Se perdonato, sbarra la strada con la mano aperta, non con l'arma, e chiede a Ferruccio di consegnarsi per salvarsi dal linciaggio; Ferruccio lo… |
| 70 | `epilogo.tonino-negato-uccisa` | epilogo (3 batt.) | tonino_ricordo=negato AND violante=uccisa | Il Velo scompare e Tonino ricorda improvvisamente Rosa. Sconvolto dal dolore e dalla notizia dell'uccisione di Violante, si unisce alla folla ostile contro Ferruccio. |
| 70 | `epilogo.tonino-restituito-uccisa` | epilogo (3 batt.) | tonino_ricordo=restituito AND violante=uccisa | Caserta libera. Tonino è tornato capace di soffrire e sa che Ferruccio lo ha aiutato, ma conosce le opere di carità di Violante e non accetta la sua morte. |
| 80 | `epilogo.mariella-sagoma` | epilogo (4 batt.) | violante decisa | Breve sagoma di Mariella alla finestra durante il finale. Se il Velo e spezzato, la sagoma si ritrae dalla finestra (torna la paura) e Taddeo, se perdonato, sale le scale per starle accanto; se accusato, la finestra gli… |
| 90 | `epilogo.bianca-velo` | epilogo (senza battute) | violante=risparmiata | Il giglio continua a brillare. La scatola musicale suona da sola e Violante, sul balcone della Reggia, ascolta una voce che ripete sempre lo stesso verso della filastrocca. |
| 90 | `epilogo.fuga` | epilogo (5 batt.) | violante=uccisa | Breve fuga giocabile dal Cortile verso Piazza Dante: tutti gli NPC sono ostili, alcuni cercano di arrestare Ferruccio, altri lo colpiscono per rabbia e panico, senza alcuna magia. |
| 100 | `epilogo.ultima-inquadratura` | epilogo (4 batt.) | violante=risparmiata | L'ultima inquadratura mostra Violante sul balcone della Reggia, con fili d'oro che partono dalle sue dita e attraversano tutta la città. Sul nero compare la frase finale. |
| 110 | `epilogo.titoli-di-coda` | epilogo (1 batt.) | — | Titoli di coda, identici per entrambe le conclusioni, accompagnati dalla stessa frase. |
| 120 | `epilogo.dopo-i-titoli` | epilogo (1 batt.) | violante decisa | Breve sequenza giocabile dopo i titoli di coda che riutilizza una porzione di Piazza Dante: stesso scenario, colori e comportamento degli NPC differenti secondo il flag violante. |

## Tabelle degli esiti

Testo delle celle copiato dalla bibbia (virgolette rimosse). Le condizioni usano i nomi dei flag di storia.json.

### Taddeo: quattro risoluzioni

| taddeo | registro | Esito |
|---|---|---|
| perdonato | conservato | Taddeo confessa ufficialmente la falsificazione e indica gli altri responsabili. |
| perdonato | bruciato | Taddeo confessa, ma la sua testimonianza non può essere verificata. |
| accusato | conservato | Taddeo tenta di nascondere la propria complicità; Ferruccio possiede comunque la prova. |
| accusato | bruciato | Taddeo riesce a negare pubblicamente il tradimento. Rimane però tormentato dalla colpa. |

### Mariella: i possibili esiti

| taddeo | violante | Esito |
|---|---|---|
| perdonato | uccisa | Mariella riacquista la capacità di provare paura. Taddeo comprende che può accompagnarla, ma non cancellare ciò che ha vissuto. |
| accusato | uccisa | Mariella torna a provare emozioni, ma scopre che suo fratello ha tradito un amico per lei. Lo respinge. |
| perdonato | risparmiata | Mariella continua a sorridere. Taddeo conserva a tratti il ricordo della lettera, senza trovare il coraggio di opporsi. |
| accusato | risparmiata | Mariella rimane serena e Taddeo si convince che il tradimento sia stato necessario. |

### Tonino: le quattro scene conclusive

| tonino_ricordo | violante | Esito |
|---|---|---|
| restituito | uccisa | Tonino è tornato capace di soffrire e sa che Ferruccio lo ha aiutato. Ma conosce anche le opere di carità di Violante e non accetta che sia stata uccisa. Tonino: «Mi hai ridato mia moglie nei ricordi. Ma questo non ti dava diritto di togliere una vita!» Gli scaglia contro un oggetto e tenta di fermarlo. |
| negato | uccisa | Il Velo scompare e Tonino ricorda improvvisamente Rosa. Sconvolto dal dolore e dalla notizia dell'uccisione di Violante, si unisce alla folla. Tonino: «E tu saresti quello che ci ha salvati?» |
| restituito | risparmiata | Il Velo torna a cancellare il suo lutto. Tonino canticchia mentre sistema due piatti sul tavolo. Tonino: «Uno per me e uno per... boh. Sarà l'abitudine.» |
| negato | risparmiata | Tonino rimane identico al primo incontro. Tonino: «Sempre una bella giornata! Pure quando piove!» |

### Agnese: quattro sviluppi del romance (San Leucio)

| agnese | taddeo | Esito |
|---|---|---|
| risvegliata | perdonato | Percorso A — L'amore ritrovato. Taddeo confessa e aiuta Agnese a ricostruire gli ultimi giorni insieme; Agnese riconosce Ferruccio: Torna da me. Anche se non puoi più essere quello di prima. |
| risvegliata | accusato | Percorso B — L'amore senza fiducia. Agnese ricorda ma teme che sia tornata soltanto la rabbia di Ferruccio; gli stringe la mano, non gli promette di aspettarlo. |
| sognante | perdonato | Percorso C — L'amore dimenticato. Taddeo: Stai facendo esattamente quello che ha fatto Violante. Stai scegliendo al posto suo. Ferruccio abbassa lo sguardo. |
| sognante | accusato | Percorso D — L'ultima sciarpa. Agnese non lo riconosce e gli offre la sciarpa appena terminata; dopo la sua partenza piange senza conoscerne il motivo. |

### Agnese: destino nei due finali

| violante | agnese | taddeo | Esito |
|---|---|---|---|
| uccisa | risvegliata | perdonato | Riconosce subito Ferruccio tra la folla. Lo ama ancora: tenta di fermarlo per farlo consegnare alle guardie (Fermati! Non voglio perderti un'altra volta!). NPC ostile per amore. |
| uccisa | risvegliata | accusato | Riconosce subito Ferruccio. Rapporto compromesso: lo accusa direttamente (Hai liberato tutti. Ma chi ti ha dato il diritto di decidere chi deve morire?). |
| uccisa | sognante | decisa | Recupera tutto improvvisamente alla morte di Violante; il primo vero incontro avviene mentre Ferruccio è accusato di omicidio. Tenta di fermarlo tra la folla per farlo consegnare. |
| risparmiata | risvegliata | decisa | Violante le cancella di nuovo i ricordi; quando Ferruccio le passa davanti si tocca istintivamente il polso. Resta nella manifattura: Devo finire una sciarpa. Sento che qualcuno verrà a prenderla. |
| risparmiata | sognante | decisa | Continua semplicemente a tessere, sorridente e apparentemente felice: Devo finire una sciarpa. Sento che qualcuno verrà a prenderla. |

### XIII: otto percorsi × due finali (64 combinazioni con Tonino×Gregorio)

Legenda: P = Taddeo perdonato · A = Taddeo accusato · C = registro conservato · B = registro bruciato · R = Agnese risvegliata · S = Agnese lasciata nel sogno.

| # | Sigla | Titolo | Premessa | Violante uccisa | Violante risparmiata |
|---:|---|---|---|---|---|
| 1 | P · C · R | La verità condivisa | Ferruccio perdona Taddeo, conserva il registro e restituisce la memoria ad Agnese. Arriva al finale con la storia del padre ricostruita, l'amore ritrovato e un amico che cerca di riscattarsi. | è il percorso più dolorosamente ironico. Ferruccio possiede le prove, ma nessuno vuole ascoltarle. Taddeo cerca di arrestarlo per proteggerlo dalla folla; Agnese tenta di trattenerlo per salvarlo. | le testimonianze vengono dimenticate, l'amore di Agnese viene cancellato ancora una volta e il registro rimane come unica prova materiale di una verità che nessuno desidera conoscere. |
| 2 | P · C · S | Il sacrificio del sentimento | Ferruccio perdona Taddeo e conserva il registro, ma sceglie di non risvegliare Agnese. Ha cercato la verità per suo padre, ma non ha avuto il coraggio di imporne il peso alla donna amata. | Agnese recupera tutto improvvisamente. Il loro primo vero incontro avviene mentre Ferruccio è accusato di omicidio. Lei cerca di farlo consegnare alle guardie. | Agnese rimane inconsapevole. Taddeo può comprendere l'identità di Ferruccio nei momenti in cui il Velo si indebolisce, ma non riesce più a parlarne apertamente. |
| 3 | P · B · R | La parola contro il potere | Ferruccio perdona Taddeo e risveglia Agnese, ma brucia il documento che avrebbe potuto riabilitare suo padre. L'amore e l'amicizia sopravvivono, ma la verità non ha più una prova scritta. | Taddeo tenta di testimoniare, ma la folla lo accusa di aver aiutato un assassino. Agnese chiede a Ferruccio di arrendersi prima che qualcuno rimanga ucciso. | la testimonianza di Taddeo viene soffocata dal Velo. Senza documenti, Ferruccio non possiede più nulla che possa confermare quanto accaduto. |
| 4 | P · B · S | Il peso della pietà | Ferruccio perdona Taddeo, distrugge il registro e lascia Agnese nella sua serenità. Ha scelto di proteggere le persone a cui vuole bene, evitando di costringerle ad affrontare il passato. Ma arriva alla Reggia sempre più simile, nelle sue scelte, a Violante. | spezza la prigionia di una città alla quale aveva cercato di risparmiare la verità. Gli altri recuperano improvvisamente ricordi che Ferruccio aveva deciso di nascondere. | accetta la propria contraddizione. La città resta tranquilla, Taddeo rimane una guardia e Agnese continua ad attendere qualcuno che non ricorda. |
| 5 | A · C · R | La giustizia senza perdono | Ferruccio accusa Taddeo, conserva le prove e risveglia Agnese. Ha scelto di conoscere tutta la verità, ma non è disposto a perdonare chi ha contribuito a nasconderla. | Taddeo conduce le guardie contro di lui per proteggere la propria posizione. Agnese riconosce Ferruccio, ma non accetta il suo ricorso alla violenza. Il registro rimane una prova per il futuro. | Agnese viene nuovamente privata dei ricordi, mentre Taddeo nasconde le proprie responsabilità. Ferruccio comprende che avere ragione non gli è servito a nulla. |
| 6 | A · C · S | La prova senza amore | Ferruccio accusa Taddeo, conserva il registro e lascia Agnese nel Velo. Ha conservato tutto ciò che può dimostrare un'ingiustizia, ma ha sacrificato i legami personali per perseguirla. | fugge con il documento mentre Taddeo lo insegue. Agnese recupera improvvisamente i propri ricordi e cerca di fermarlo tra la folla. | mantiene la prova di una verità che nessuno vuole riconoscere. Agnese vive serenamente e Taddeo continua a negare il passato. |
| 7 | A · B · R | L'amore sopra ogni cosa | Ferruccio accusa Taddeo, brucia il registro e risveglia Agnese. Non vuole più inseguire i documenti e i colpevoli della tragedia: desidera soltanto tornare dalla persona amata. Ma non riesce a rinunciare al rancore contro chi lo ha tradito. | Agnese gli chiede perché abbia scelto un'ultima morte proprio quando avrebbero potuto ricominciare. Taddeo approfitta della situazione per accusarlo. | Ferruccio sacrifica l'ultima possibilità di recuperare stabilmente Agnese. La vede sorridere, sapendo che quel sorriso non gli appartiene più. |
| 8 | A · B · S | Il cavaliere senza nessuno | Ferruccio accusa Taddeo, distrugge il registro e non risveglia Agnese. È il percorso più solitario. Non ha alleati, non possiede prove materiali e ha rinunciato alla possibilità di ritrovare il proprio amore prima del confronto finale. | la città torna libera e Ferruccio diventa il nemico pubblico. Fugge senza poter contare su nessuno. | accetta di vivere come l'unico testimone cosciente di un mondo costruito sulla menzogna. Non gli resta altro che la propria memoria. |

### Tonino × Gregorio: le varianti che completano le 64 combinazioni (XIII)

| tonino_ricordo | gregorio | Esito |
|---|---|---|
| restituito | dialogo | Ferruccio conosce anche la storia di Rosa, possiede la lettera di Agnese e tenta una soluzione non violenta con Gregorio. |
| restituito | attacco | Ferruccio dimostra compassione per Tonino, ma sceglie la violenza contro il Custode. |
| negato | dialogo | Ferruccio protegge Tonino dalla sofferenza, ma tenta di comprendere Gregorio. |
| negato | attacco | Ferruccio evita il dolore personale degli altri, ma affronta il Custode come un nemico da abbattere. |

### Gregorio: ultime parole

| gregorio | Esito |
|---|---|
| dialogo | Tuo padre era innocente. |
| attacco | Anche io avevo paura di perderla. |

### Violante: esito dell'ultima conversazione (VIII)

| violante | Esito |
|---|---|
| uccisa | Violante muore convinta di essere stata tradita dall'umanità che voleva proteggere. |
| risparmiata | Non si pente: continua a governare la città attraverso il Velo. Il giocatore le ha dimostrato che può ottenere obbedienza persino da chi conosce la verità. |

### Gaetano: conseguenza sui finali

| violante | registro | Esito |
|---|---|---|
| uccisa | conservato | Se ha conservato il registro, fugge portando con sé la prova che un giorno potrebbe riabilitare suo padre. |
| uccisa | bruciato | Se lo ha bruciato, fugge con il solo ricordo di ciò che ha visto. |
| risparmiata | conservato | Il padre rimane il colpevole ufficiale, anche se Ferruccio ha conservato il registro. |
| risparmiata | bruciato | Nel finale del Velo, i documenti vengono nuovamente alterati nella memoria collettiva. |

### Bianca: chiusura dell'arco

| violante | Esito |
|---|---|
| uccisa | Il ricordo di Bianca viene liberato. Il giocatore vede il giglio ricamato perdere la sua luce soprannaturale. Rimane un semplice fazzoletto. |
| risparmiata | Il giglio continua a brillare. La scatola musicale suona da sola e Violante ascolta una voce che ripete sempre lo stesso verso della filastrocca. |

### XVII: Lo stato del mondo dopo i finali

| Elemento | Violante uccisa | Violante risparmiata |
|---|---|---|
| Cielo | Azzurro intenso e luminoso | Grigio-azzurro, foschia |
| Vegetazione | Verdi saturi e fiori vivaci | Verdi pallidi e desaturati |
| Illuminazione | Contrasti naturali e colori caldi | Luce uniforme, fredda |
| NPC | Tutti ostili a Ferruccio | Tutti pacifici, sorridenti |
| Dialoghi | Accuse, paura, rabbia, richieste d'arresto | Frasi ripetitive e felicità artificiale |
| Musica | Melodia dinamica, con note malinconiche | Melodia lenta, ripetitiva |
| Gatti d'ombra e vespe | Il Velo non può più generarli | Possono continuare a manifestarsi |
| Statue | Tornano inerti | Rimangono legate all'incantesimo |

### XVIII: Conseguenze per i capitoli successivi (archi irrisolti)

| Arco | Violante uccisa | Violante risparmiata |
|---|---|---|
| Ferruccio | Ricercato per l'uccisione di Violante | Unico testimone cosciente del Velo |
| Agnese | Può cercarlo o denunciarlo, secondo il rapporto | Continua a vivere nel sogno, con residui di memoria |
| Taddeo | È coinvolto nella caccia a Ferruccio | Rimane nella guardia, protetto o tormentato dal Velo |
| Gaetano | La sua innocenza può ancora essere dimostrata | La versione falsa rimane nella memoria collettiva |
| Mariella | Deve imparare a convivere con il trauma | Vive senza paura, ma anche senza piena volontà |
| Gregorio | La sua complicità può essere indagata | È ricordato come un fedele difensore della pace |
| Violante | Il suo culto popolare sopravvive alla morte | Governa ancora segretamente |
| Bianca | Rimane un ricordo familiare | Il suo ricordo alimenta l'ossessione della madre |

## Personaggi (voce e canon)

| Id | Nome | Canon | Voce |
|---|---|---|---|
| `ferruccio` | Ferruccio | Established | Muto. Nessuna battuta: si esprime solo con gesti resi in didascalia (colpisce la targa con la spada, indica la maschera, rinfodera o punta la spada, abbassa lo sguardo, piega la sciarpa, fa un inchino, si tocca il polso, stringe la sciarpa). |
| `tonino` | Tonino | Established | Dialetto campano caldo e ironico (uagliò/guagliò, Maronna mia, 'sta, ce sta, nun fa niente). Battute brevi, scherzose, auto-ironiche; ride da solo. Dopo il ricordo restituito mantiene l'ironia ma le battute diventano più consapevoli. Sotto il Velo ripete frasi di felicità artificiale (Sempre una bella giornata! Pure quando piove!). |
| `rosa` | Rosa | Established | Nessuna battuta nella bibbia. |
| `taddeo` | Taddeo | Established | Italiano standard, nessun dialetto. Registro supplichevole e spezzato nella confessione (frasi brevi, puntini di sospensione, invocazione religiosa: Che Dio mi perdoni). Difensivo e urlato quando minacciato. Nel finale ostile parla da guardia che chiede una resa volontaria, mai con odio. |
| `mariella` | Mariella | Established | Parla solo per iscritto, nella lettera: frasi brevissime, tono affettuoso e fermo, seconda persona verso il fratello. Frase centrale dell'arco: Non devi aggiustarmi. Nel presente non parla: sorride alla finestra. |
| `agnese` | Agnese | Established | Ironica e vivace, battute brevi e pungenti. Prima della maledizione dà del voi con cortesia beffarda (Siete venuto ad aggiustarlo o a finirlo?) e passa al tu con l'intimità. Sotto il Velo è gentile, sorridente, parla di sensazioni senza storia (Non so perché, ma credo che...). Risvegliata è diretta e malinconica, parla di attesa e di paura. Tic fisico: tessere sempre la stessa sciarpa rossa; dopo il Velo ripristinato si tocca il polso come faceva Ferruccio. |
| `gaetano` | Gaetano | Established | Non appare come personaggio: solo oggetti (punzone G. F., strumenti con cui è stata forgiata la spada), documenti e un'unica memoria liberata. Una sola battuta, un ordine gridato da capomastro, diretto e protettivo. Non deve diventare un fantasma che accompagna e spiega. |
| `gregorio` | Gregorio Valente, il Custode | Established | Militare, italiano formale senza dialetto. Frasi brevi e spezzate, spesso lasciate in sospeso (puntini). Parla di dovere, ordini, padri e figli; si rivolge a Ferruccio come a un figlio che chiede conto. Mai supplica: anche l'avvertimento (Va' via) è un ordine. Nelle ultime parole affiora la lucidità e la colpa. |
| `violante` | Violante Valente | Established | Aristocratica, calma, materna e assoluta. Non alza la voce, non si giustifica: constata. Usa coppie simmetriche (Se mi uccidi... / Se mi risparmi...) e domande retoriche rivolte direttamente a Ferruccio per nome. Parla del dolore come di una malattia da estirpare. Nessun dialetto, lessico elevato ma semplice. Nella scena della scatola musicale parla di Bianca al passato, senza enfasi. |
| `bianca` | Bianca Valente | Established | Bambina che ride e sbaglia apposta. Un'unica battuta, giocosa e imperativa. Nel finale del Velo una voce ripete un verso della filastrocca: non si deve stabilire se sia davvero la sua. |
| `guardia` | Guardia della Reggia | Established | Grida brevi, esclamative, in italiano popolare («L'ha ammazzata!»). Chiama Violante «La Signora». Nessuna magia: agisce per fedeltà e panico. |
| `cittadino` | Cittadini di Caserta | Established | Accuse gridate, prima persona plurale («ai nostri figli»), rabbia e paura. Non controllati dal Velo: la loro ostilità è frutto delle loro scelte. Sotto il Velo: frasi ripetitive di felicità artificiale. |
| `assunta` | Assunta | Provisional | Non definita. |

## Note aperte

Dubbi, ambiguità e cose che la bibbia non decide. I prefissi raggruppano: CONFLITTO (bibbia vs inizio-memoria-e-doni), DOPPIA VERSIONE (due testi della bibbia per lo stesso momento), COLLOCAZIONE (scena senza posizione fissata), DUBBIO (regia/UX), CONVENZIONE e PRODUZIONE (regole del file e vincoli), BACKSTORY (risposte vere ai misteri, da non mostrare al giocatore).

- CONFLITTO Gaetano come NPC: la bibbia (VI) dice che il padre compare SOLO attraverso oggetti, documenti e anime liberate e non deve diventare un fantasma che parla; inizio-memoria-e-doni.md (10 ottobre 2026) lo rende un personaggio parlabile nella Fucina del Ricordo che restituisce nome e volto a Ferruccio. Il documento dell'utente è più recente e aggiorna la bibbia, ma non contiene battute: corso-trieste.fucina-del-ricordo è senza dialogo e va scritta ex novo con approvazione. Da decidere anche come conciliare il 'volto umano' restituito presto con la 'maschera' che Tonino e Agnese citano nei capitoli successivi.
- CONFLITTO identità iniziale: la sezione I dice che al risveglio Ferruccio 'sa di aver perso suo padre, la propria voce e la donna che amava'; inizio-memoria-e-doni.md dice che il nome gli viene restituito solo da Gaetano nella Fucina. Il livello di memoria con cui parte Ferruccio non è coerente tra i due documenti.
- CONFLITTO sciarpa: la bibbia (III, IV Percorso B, XVI) presuppone che Ferruccio abbia la sciarpa fin dall'inizio ('le mostra la sciarpa consumata', 'tenta di mostrare la propria sciarpa' alla folla, 'stringe la sciarpa' nell'epilogo del Velo); con inizio-memoria-e-doni.md la sciarpa compare sul rig solo se agnese=risvegliata. Nelle scene che citano la sciarpa serve una variante per agnese=sognante (Ferruccio senza sciarpa, mostra solo la spada). Eccezione interna alla bibbia: IV Percorso D (sognante+accusato) fa consegnare ad Agnese 'la sciarpa appena terminata' anche senza risveglio: o è un oggetto narrativo che non abilita lo scatto, o il percorso D va cambiato.
- CONFLITTO scatto nel finale: IV dice 'Ferruccio deve scattare oltre di lei' (Agnese) durante la fuga, ma per inizio-memoria-e-doni.md lo scatto esiste solo con la sciarpa (agnese=risvegliata). Nei percorsi sognante+uccisa (2, 4, 6, 8) la fuga giocabile (epilogo.fuga) non può richiedere lo scatto: progettare il blocco di Agnese superabile senza dash (salto/doppio salto), oppure sbloccare lo scatto al momento del Velo spezzato.
- CONFLITTO Mariella in Piazza Dante: la bibbia (IX) la vuole quasi assente (può non avere modello 3D: finestra illuminata, lettera, sagoma); inizio-memoria-e-doni.md la fa parlare in Piazza Dante per dare l'indizio del ferro. Perché è in Piazza e non alla finestra su Corso Trieste? piazza-dante.bottega-di-gaetano è senza battute (nessun testo verbatim esiste): va scritta ex novo e approvata; canon Provisional per quella sola apparizione. Assunta compare solo lì (Provisional, nessuna voce né oggetto).
- COLLOCAZIONE Fucina del Ricordo: inizio-memoria-e-doni.md dice 'dopo aver percorso Piazza e Corso'; qui è l'ultima scena di corso-trieste (ordine 70), dopo il confronto con Taddeo, ma potrebbe essere un'area a sé tra Corso Trieste e Villa Comunale. Non è chiaro se arriva prima o dopo Taddeo.
- DOPPIA VERSIONE della morte del Custode: VII 'La morte del Custode' dà le battute Non era un ordine del Re... / Era una promessa fatta a mia moglie + Tuo padre era innocente / Anche io avevo paura di perderla (secondo gregorio), con l'anima che sale verso il balcone dove Violante è già; XVI Scena 1 ne dà altre (Ho protetto la porta per tutta la vita... / E non ho visto cosa entrava / Lei... crede ancora di poterla salvare) e fa apparire Violante solo dopo la morte, chiamata dal suo Gregorio?. Qui sono due scene consecutive (reggia.morte-del-custode 70 → reggia.custode-sconfitto 80): la proposta è concatenarle, con la variante per flag gregorio come unica differenza; in alternativa una sostituisce l'altra. Da decidere.
- DOPPIA VERSIONE dell'ultima conversazione: VIII (Guardati. Hai attraversato un'intera città... / Chi di noi due è davvero un mostro?) e XVI Scena 1 (Pensavo di averti tolto abbastanza ricordi... / Ed è per questo che non posso lasciarla andare) descrivono lo stesso momento con parole diverse. Ordine proposto: XVI Scena 1 (80) → nucleo del Velo (90) → scatola musicale XI (100) → VIII ultima conversazione (110) → XVI Scena 2 bivio (120). Quattro estrazioni descrivevano la stessa scelta su Violante: unificate in reggia.scelta-violante.
- DOPPIA VERSIONE delle battute di Agnese nel finale della liberazione: IV dà Fermati! Non voglio perderti un'altra volta! (lo amava ancora) e Hai liberato tutti. Ma chi ti ha dato il diritto di decidere chi deve morire? (rapporto compromesso, criterio legato a taddeo); XVI dà per lo stesso momento Ferruccio... ti prego. Non scappare. Posso ancora aiutarti! (risvegliata) e Sei tu... Sei davvero tu? Perché hai fatto questo? (sognante), con criterio diverso. Qui XVI è in epilogo.agnese-folla (40) e IV in epilogo.agnese-fermati / agnese-accusa (50): da riconciliare (concatenare o scegliere un set). 'Compromesso' = risvegliata + accusato (percorsi 5 e 7, da XIII); in tutti gli altri casi Agnese tenta di fermarlo per salvarlo.
- DOPPIA VERSIONE dell'epilogo del Velo per Agnese e Tonino: IV lascia Agnese nella manifattura di San Leucio (Devo finire una sciarpa. Sento che qualcuno verrà a prenderla.), XVI la fa comparire sotto un portico in Piazza Dante (Scusate... cercate qualcuno?); X dà a Tonino Uno per me e uno per... boh. Sarà l'abitudine. / Sempre una bella giornata! Pure quando piove! secondo tonino_ricordo, XVI gli dà Buongiorno, guagliò! Che bella giornata! / Eh, bellissima. Proprio bellissima. indipendentemente dal flag. L'epilogo giocabile riusa Piazza Dante, quindi XVI è più realizzabile; le battute di IV e X possono essere spostate lì come varianti. Decidere quale set usare o concatenarli (epilogo.piazza-grigia 20, agnese-manifattura 30, tonino-*-risparmiata 50).
- COLLOCAZIONE provvisoria delle memorie di Violante e Gregorio (funerale di Bianca, tradimento del marito, progressione morale in 4 passi): la bibbia (VIII) le descrive come retroscena senza collocazione in gioco. Qui sono all'inizio del capitolo Reggia (ordini 10-30) come memorie/indizi. Alternativa coerente con i boss intermedi: agganciare la memoria del tradimento del marito all'anima di Gregorio che sale verso il balcone, tra reggia.morte-del-custode e reggia.nucleo-del-velo. L'oggetto frammenti-di-seta è un'invenzione di comodo (Provisional), da confermare o eliminare.
- COLLOCAZIONE provvisoria del passato di Taddeo (corso-trieste.passato-taddeo): la bibbia (V) non indica come il giocatore lo veda. Qui è una memoria liberata dopo la Regina dei Debiti (coerente con la sua origine 'promesse mai mantenute'); le due battute di Violante sono le uniche righe parlate.
- COLLOCAZIONE provvisoria della lettera di Mariella: la bibbia non dice DOVE Ferruccio la legge. Qui su Corso Trieste subito dopo la confessione, sotto la finestra illuminata di Mariella (unico luogo dell'arco citato). Alternativa: consegnata da Taddeo a San Leucio o trovata tra i suoi messaggi alla Villa Comunale.
- COLLOCAZIONE provvisoria del messaggio di Taddeo (villa-comunale.messaggio-taddeo, ordine 20): la 'testimonianza di Taddeo' usata nel confronto con Gregorio (VII: 'il registro o il messaggio di Taddeo') non ha un oggetto definito nella bibbia; l'oggetto messaggio-taddeo è creato qui. A runtime mostrare il registro se registro=conservato, il messaggio se taddeo=perdonato; se entrambi, la bibbia non dice quale.
- COLLOCAZIONE dei flashback di Agnese (Prima della maledizione): la bibbia non dice quando o come vengono mostrati. Ipotesi: memorie liberate a San Leucio (dopo la Tessitrice di Pietra o toccando il telaio). Qui ordini 50-60, prima della scelta.
- COLLOCAZIONE del disegno della Reggia incompleta: elencato tra i tre oggetti di Bianca (XI) ma non collocato in nessuna scena ('dove' vuoto). Candidato naturale: Villa Comunale (accanto alla memoria dell'inchino) o la Reggia prima della scatola musicale.
- COLLOCAZIONE del fazzoletto: compare a San Leucio 'ricamato con un giglio incompleto' accanto ai telai e nelle mani di Violante nel Cortile d'Onore (XVI) e nella chiusura dell'arco. La bibbia non chiarisce se quello di San Leucio sia l'originale di Bianca o una riproduzione delle tessitrici; qui un unico oggetto fazzoletto-bianca (se è l'originale, va spiegato come passa da San Leucio a Violante).
- COLLOCAZIONE di Atto II e Villa Comunale: la bibbia dice che Ferruccio scopre l'innocenza del padre 'attraverso i registri', mentre VI distingue i registri pubblici (Gaetano colpevole) dal documento originale con le cancellature: qui separati (registri-pubblici 50, registro originale nella scelta 80). La scoperta che Gregorio era presente e tentò di salvare Bianca non ha una fonte in-game specificata: attribuita al documento originale, ma potrebbe venire dalla memoria nel marmo. L'ordine boss → ricordo di Gaetano → scelta non è fissato dalla bibbia.
- COLLOCAZIONE di Atto III (san-leucio.rinuncia-vendetta): 'Agnese può chiedere a Ferruccio di rinunciare alla vendetta' non ha battute nella bibbia e nessuna condizione; 'se Ferruccio sceglie di ascoltarla' è di fatto assorbito dal flag gregorio (dialogo/attacco), deciso però solo alla Reggia e solo con prove. Condizionata qui ad agnese=risvegliata perché un'Agnese nel Velo non conosce la storia del padre, ma la bibbia non lo dice esplicitamente.
- DUBBIO Gregorio senza prove: la bibbia non dice se con prove=falsa il giocatore vede comunque una finestra di scelta con 'dialogo' disabilitato (principio 2: deve capire cosa ha perso) o se lo scontro inizia direttamente. Qui reggia.attacco-senza-prove è una scena condizionale con la sola opzione 'attacco', così il flag viene comunque fissato. Da decidere in UX.
- DUBBIO lettera di Agnese: la bibbia non ne scrive il testo e non dice se Tonino la CONSEGNA nella scena del ricordo restituito o se la ricorda soltanto; qui è consegnata subito (oggetto in piazza-dante.ricordo-restituito) e letta al Belvedere (san-leucio.lettera-belvedere). Non è detto se Ferruccio la mostra ad Agnese o se influisce sulle battute dei percorsi A-D ('rende le scene del Belvedere più personali'). Da scrivere.
- DUBBIO segreto di Agnese (tessuto del Velo, tentativo di avvertire Ferruccio, ricordi sottratti la notte dell'incantesimo): è backstory senza battute; può emergere solo tramite Taddeo (percorso A), la lettera o la rivelazione della Tessitrice di Pietra (XII). Non deciso.
- DUBBIO Percorso C: 'Taddeo cerca di convincerlo a cambiare idea' — la bibbia non dice se la scelta su Agnese può essere rifatta dopo l'intervento di Taddeo. Qui irreversibile (Ferruccio abbassa lo sguardo e basta).
- DUBBIO Tonino nei capitoli intermedi: dopo il ricordo restituito 'le sue battute diventano più consapevoli', ma la bibbia non scrive battute aggiuntive per Corso Trieste–Reggia. Se Tonino ricompare prima dell'epilogo, quelle righe vanno scritte ex novo rispettando la voce. Il medaglione di Rosa: non è chiaro se sia l'anima stessa a materializzarsi o se fosse già al banchetto (regia aperta).
- DUBBIO Taddeo accusato nel finale della liberazione: la bibbia non gli dà battute (solo 'partecipa apertamente alla caccia'); reso con didascalia e comportamento ostile, nessuna riga inventata.
- DUBBIO voce nel finale del Velo: 'una voce ripete sempre lo stesso verso della filastrocca' (XI) — la bibbia non dice quale dei due versi; non inserito per non scegliere al posto dell'autore. Il dubbio sull'identità della voce (Bianca o ricordo catturato) deve restare irrisolto per scelta autoriale.
- DUBBIO frasi a schermo: la frase finale «Se nessuno vuole essere liberato, hai comunque il diritto di farlo?» (§10) è 'la domanda che il giocatore deve portarsi dietro': non è detto se appare a schermo (qui didascalia in epilogo.dopo-i-titoli, rimovibile). L'epigrafe del preambolo «Un uomo può sopportare una vita di dolore. Ma quanto dolore è disposto a infliggere agli altri per non soffrire più?» è utilizzabile come cartello d'apertura; la bibbia non specifica dove appare.
- DUBBIO nemici nell'epilogo del Velo: XVII dice che con Violante risparmiata gatti d'ombra e vespe 'possono continuare a manifestarsi': non è detto se nella sequenza post-titoli compaiono davvero nemici o solo NPC.
- DUBBIO villa-comunale.risoluzione-taddeo: le 'quattro risoluzioni' di Taddeo (V) sono solo una tabella nella bibbia, non una scena; qui una scena con didascalie condizionate a doppio flag (mostrare, non spiegare). Può essere tagliata e lasciata solo come tabella_esiti.
- CONVENZIONE didascalie: le didascalie usano il testo della bibbia dove esiste e alcune conservano la clausola condizionale ('Se Violante viene uccisa, ...') per restare verbatim; la condizione è già codificata in quando/se e la clausola può essere rimossa in redazione finale. Didascalie prese da tabelle o paragrafi di esito superano talvolta i 120 caratteri: sono testo di regia, non dialogo in box; se vanno a schermo andranno spezzate senza alterare il senso. Tutte le battute parlate rispettano il limite di 120 caratteri (narrative.md). I gesti di Ferruccio nei sommari sono proposte di regia, non testo della bibbia.
- CONVENZIONE 'guardia' e 'cittadino': 'Seconda guardia' e 'Un altro' (cittadino) sono mappati sugli id guardia e cittadino; in gioco sono attori distinti. Nessuna combinazione di flag è 'giusta' (XIV): non implementare un contatore di moralità; le scelte alimentano solo i sei flag, memorizzati dopo ogni scelta e non persi alla morte (XIX). In cooperativa il gruppo condivide un unico stato narrativo e la conferma spetta all'host.
- CONVENZIONE scelte (§10): semplici finestre con due risposte, senza modificare movimento o combattimento; le conseguenze vengono memorizzate e richiamate nei dialoghi successivi. Il campo cosa_sacrifica deriva dal principio 2 (XIV): il giocatore deve comprendere cosa sta sacrificando prima di decidere.
- PRINCIPI XIV (verbatim): 1. La scelta riguarda sempre una persona concreta. Non si sceglie astrattamente tra bene e male, ma tra il ricordo e la serenità di Tonino, tra la fiducia e la rabbia verso Taddeo, tra la libertà e la sicurezza di Agnese. 2. Il giocatore deve comprendere cosa sta sacrificando. Prima di prendere una decisione, riceve indizi sufficienti sulle sue conseguenze immediate. 3. Le rivelazioni fondamentali sono inevitabili. Nessuna scelta deve impedire di comprendere chi controlla il Velo, perché lo ha creato e quale prezzo comporta distruggerlo. 4. Le conseguenze devono essere mostrate, non spiegate. Un personaggio che non riconosce una sciarpa, una guardia che abbassa lo sguardo e una lettera mai consegnata raccontano più di una lunga schermata di testo.
- CONTEGGIO XIII: 5 scelte prima del finale, 32 percorsi prima della Reggia, 64 combinazioni con i due finali = 8 percorsi principali (P/A · C/B · R/S) × 4 varianti Tonino/Gregorio × 2 finali. Non sono 64 finali indipendenti ma varianti coerenti di due esiti per Caserta; il bivio e i due finali sono identici per tutti gli 8 percorsi, le differenze vanno rese con le battute condizionate degli archi.
- PRODUZIONE §10/XII: usare i cinque livelli esistenti; i quattro boss intermedi sono versioni ingrandite e modificate dei tre archetipi della demo (pattugliamento e balzi del gatto, inseguimento delle vespe, proiettili luminosi delle statue); nessun boss lascia cadaveri, si dissolvono in anime colorate. Il Custode conserva il combattimento originale; il lampo del giglio e l'abbozzo di abbassare l'alabarda sono feedback VFX/animazione, non dialogo. Nel Mercato il gatto iniziale nasce fuori dal blocco solido; lo Spettro del Calcare è rimosso dal Mercato ma resta nelle altre aree (inizio-memoria-e-doni.md).
- ESPANSIONI XVIII (Provisional): Casertavecchia 'Le Campane del Perdono' (Campanaro Senza Volto; Taddeo ricompare), Acquedotto Carolino 'Le Acque della Memoria' (Guardiano delle Sorgenti; messaggio del padre), Santa Maria Capua Vetere 'L'Arena dei Dimenticati' (Giudice dell'Arena; Agnese può tornare). Stessi livelli e boss in entrambi gli stati del mondo ma motivazioni diverse: nel percorso della libertà Ferruccio cerca prove per difendersi, nel percorso del Velo cerca l'origine dell'incantesimo.
- BACKSTORY 1839 / evento: cedimento di una struttura provvisoria nel cantiere della Reggia (sei anni prima del gioco). / vittime: diversi operai, Bianca (11 anni, figlia di Gregorio e Violante Valente), Gaetano (padre di Ferruccio, fabbro, muore tentando di salvare lavoratori intrappolati). / causa vera: un appaltatore ha usato materiali scadenti per risparmiare, nonostante gli avvertimenti delle maestranze. / indizi in gioco: targa in Piazza Dante senza il nome di Gaetano; registri pubblici che lo indicano come responsabile; memoria della Madre di Marmo (Villa Comunale); memoria di Gregorio che insegna l'inchino a Bianca.
- BACKSTORY 1839 / evento: Gregorio, capitano delle guardie, scopre la verità ma riceve l'ordine di firmare un rapporto che attribuisce l'incidente a un errore di Gaetano. Firma per paura che una nuova indagine travolga la famiglia già distrutta dalla morte di Bianca. / effetto: la morte del fabbro diventa un disonore per la famiglia di Ferruccio. / colpa: PRIMA colpa di Gregorio. / indizi in gioco: registro originale con cancellature e correzioni (Villa Comunale); 'Non tutte le catene fanno rumore' sulla statua del cavaliere inginocchiato.
- BACKSTORY 1840-1844 / evento: Violante non accetta la morte della figlia; trova tra gli effetti di Bianca un fazzoletto di seta con un giglio ricamato e scopre che stringendolo sente per pochi istanti la voce della bambina. / leggenda (inventata per il gioco): ogni sentimento lascia un filo invisibile nel mondo, i fili più forti non scompaiono nemmeno dopo la morte. / indizi in gioco: fazzoletto con giglio incompleto accanto ai telai (San Leucio); filastrocca in Piazza Dante; scatola musicale (Reggia).
- BACKSTORY 1840-1844 / evento: Violante finanzia in segreto esperimenti nei laboratori di seta di San Leucio. Progressione: 1) allevia temporaneamente il dolore; 2) impara a separare i ricordi dalle emozioni; 3) scopre che eliminando dolore E capacità di opporsi una persona può essere resa permanentemente felice. / risultato: nasce il Velo della Concordia. / indizi in gioco: motivi floreali (giglio) sulle stoffe commissionate alle tessitrici; fili che si muovono senza che nessuno azioni i telai.
- BACKSTORY 1840-1844 / evento: Gregorio conosce gli esperimenti ma li crede un modo innocuo per superare il lutto; quando comprende la vera natura del Velo è troppo tardi. Violante lega magicamente la sua volontà al giglio d'oro che gli aveva donato e lo trasforma nel Custode. / colpa: SECONDA colpa di Gregorio (aver taciuto troppo a lungo). / indizi in gioco: il giglio sul petto del Custode lampeggia a ogni colpo; il Custode sembra voler abbassare l'alabarda ma una forza lo obbliga a sollevarla.
- BACKSTORY 1845 / evento: Ferruccio è fabbro come il padre, lavora a piccoli incarichi per la Reggia e ama Agnese, tessitrice di San Leucio. Agnese, inconsapevolmente, gli mostra che alcuni fili destinati alla Reggia si muovono anche quando nessuno aziona i telai; Ferruccio indaga e scopre il progetto di Violante. / indizi in gioco: sciarpa rossa sul telaio; lettera d'amore di Agnese custodita da Tonino.
- BACKSTORY 1845 / evento: Ferruccio chiede aiuto a Taddeo, amico d'infanzia diventato guardia. Violante ha promesso a Taddeo di liberare la sorella Mariella dal dolore e dai traumi del 1839; Taddeo consegna Ferruccio alle guardie. / indizi in gioco: Taddeo riconosce la spada forgiata insieme; lettera di Mariella 'Non devi aggiustarmi'; finestra illuminata di Mariella.
- BACKSTORY 1845 / evento: Violante potrebbe uccidere Ferruccio ma, poiché conosce troppo del Velo, gli cancella la memoria e imprigiona la sua coscienza in un costume da Pulcinella preparato per i festeggiamenti. Il sortilegio fallisce parzialmente: perde voce e aspetto umano ma conserva la volontà di opporsi. / indizi in gioco: la maschera che Ferruccio indica a Tonino; il volto nero iniziale (inizio-memoria-e-doni).
- BACKSTORY 1845 — La notte dell'inizio / evento: il completamento della Reggia (storicamente nel 1845 furono completati i lavori della Sala del Trono) diventa l'occasione di una grande festa cittadina; Violante attiva il Velo durante i festeggiamenti; Caserta si addormenta sotto una luna immobile; Ferruccio si risveglia in Piazza Dante. Non sa perché è vivo; sa solo di aver perso il padre, la voce e la donna che amava; crede responsabile Gregorio, il Custode della Reggia.

## Conteggi

- Scene: 81 (piazza-dante 10, corso-trieste 8, villa-comunale 11, san-leucio 14, reggia 16, epilogo 22).
- Battute: 259 (87 parlate, 172 didascalie). Scelte: 7 finestre per 6 flag + 3 derivati.
- Boss: 8 (3 di espansione, Provisional). Oggetti: 24. Tabelle: 13. Note: 45.
