# Testi nuovi da approvare — seconda ondata, migliorie e trama (terza ondata)

Generato da `tools/elenco-testi-teatro.js` il 2026-11-12: i testi sono letti dalle tabelle del gioco, quindi sono
quelli che il giocatore vede. Dove compare **N** il gioco mette un numero. Per cambiare un testo basta dirlo
(«nel Burattinaio la battuta dell'atto II diventa …»): si corregge nella tabella indicata e l'elenco si rigenera.
Per approvare tutto com'è basta un «va bene».

Altri testi della prima ondata ancora da approvare stanno nei loro documenti: `production/finali-teatro.md`
(finali, voci segnate [nuovo]), `production/oggetti-200.md` (nomi e descrizioni degli oggetti), i nomi dei boss
e delle trasformazioni in `gioco/teatro/b6-boss.js` e `b4-trasformazioni.js`, le battute di Tonino della
partenza segreta (`TESTI_C1`), le esclamazioni del pubblico (`b1-pubblico.js`) e le scritte a tocco (`TESTI_C2`).

## Scontro col Grande Burattinaio (17)

Dove: `gioco/teatro/d1-burattinaio.js`

- ATTO I — Le Mani del Burattinaio  
  <sub>TESTI_D1.atti[0]</sub>
- ATTO II — I Fili  
  <sub>TESTI_D1.atti[1]</sub>
- ATTO III — Le Forbici  
  <sub>TESTI_D1.atti[2]</sub>
- Ferruccio. Sei salito fin quassù, dove i fili s'annodano. Qua sopra le mani sono le mie.  
  <sub>TESTI_D1.voce.inizio</sub>
- A mani nude? Mi fai quasi tenerezza, guagliò.  
  <sub>TESTI_D1.voce.senzaSigilli</sub>
- I ferri di Gaetano… Te li sei portati appresso. Non ti basteranno.  
  <sub>TESTI_D1.voce.conSigilli</sub>
- Hai sciolto un nodo. Ne tengo mille. Scendete, figli miei.  
  <sub>TESTI_D1.voce.atto2</sub>
- Basta col teatrino. Le forbici le tengo io, e io taglio quando dico io.  
  <sub>TESTI_D1.voce.atto3</sub>
- …Le mani… non rispondono più.  
  <sub>TESTI_D1.voce.vittoria</sub>
- il pugno del Grande Burattinaio  
  <sub>TESTI_D1.fonti.schianto</sub>
- la mano del Grande Burattinaio  
  <sub>TESTI_D1.fonti.spazzata</sub>
- la presa del Grande Burattinaio  
  <sub>TESTI_D1.fonti.presa</sub>
- le forbici del Grande Burattinaio  
  <sub>TESTI_D1.fonti.forbici</sub>
- Mano del Burattinaio  
  <sub>TESTI_D1.nomi.mano</sub>
- Forbici del Burattinaio  
  <sub>TESTI_D1.nomi.forbici</sub>
- Marionetta d'élite  
  <sub>TESTI_D1.nomi.marionetta</sub>
- I fili del teatro cadono. Il Grande Burattinaio non tiene più niente.  
  <sub>TESTI_D1.bannerVittoria</sub>

## Personaggi con stili diversi (12)

Dove: `gioco/teatro/d2-personaggi.js (nome e titolo dell'Ombra in 00-config.js)`

- Colpi nelle quattro direzioni  
  <sub>TESTI_D2.stile.ferruccio</sub>
- Piroetta [N]: devia i colpi e salta i buchi  
  <sub>TESTI_D2.stile.agnese(N)</sub>
- Mena il maglio: tieni premuto per caricare  
  <sub>TESTI_D2.stile.taddeo</sub>
- Un colpo e cade · vola · colpi spettrali  
  <sub>TESTI_D2.stile.ombra</sub>
- 🔨 Maglio della Guardia  
  <sub>TESTI_D2.dono.taddeo</sub>
- ✦ Colpi Spettrali  
  <sub>TESTI_D2.dono.ombra</sub>
- ½ (non si cura)  
  <sub>TESTI_D2.vitaOmbra</sub>
- MOSSA  
  <sub>TESTI_D2.bottone</sub>
- Maschera ridotta in N monete  
  <sub>TESTI_D2.monete(N)</sub>
- L'Ombra Senza Fili  
  <sub>Nome dell'Ombra</sub>
- La Sagoma Fuggita dal Telone  
  <sub>Titolo dell'Ombra</sub>
- Piroetta [Maiusc sx]: devia i colpi e salta i buchi  
  <sub>Scheda di Agnese.stile</sub>

## Registro di Scena e trionfi (72)

Dove: `gioco/teatro/d3-registro-scena.js`

- Registro di Scena  
  <sub>TESTI_D3.titolo</sub>
- Real Teatro delle Marionette · Caserta, 1845  
  <sub>TESTI_D3.sottotitolo</sub>
- [E] Registro di Scena  
  <sub>TESTI_D3.invito</sub>
- Comparse  
  <sub>TESTI_D3.sezioni[0]</sub>
- Primi attori  
  <sub>TESTI_D3.sezioni[1]</sub>
- Attrezzeria  
  <sub>TESTI_D3.sezioni[2]</sub>
- Trionfi  
  <sub>TESTI_D3.sezioni[3]</sub>
- Battuto N volte  
  <sub>TESTI_D3.battuto(N)</sub>
- Mai in scena con te  
  <sub>TESTI_D3.mai</sub>
- Visto in scena, mai battuto  
  <sub>TESTI_D3.visto</sub>
- Batti ancora N volte per leggerne la storia.  
  <sub>TESTI_D3.daSvelare(N)</sub>
- Non ha ancora calcato la tua scena.  
  <sub>TESTI_D3.primoAttoreIgnoto</sub>
- N su N  
  <sub>TESTI_D3.temaTot(N)</sub>
- Attrezzi conosciuti: N su N. Il Diario degli oggetti li racconta uno per uno ([O] dal menu di pausa).  
  <sub>TESTI_D3.attrezzeria(N)</sub>
- In attrezzeria: N  
  <sub>TESTI_D3.trionfoPreso(N)</sub>
- Un attrezzo ancora chiuso nel baule.  
  <sub>TESTI_D3.trionfoMancante</sub>
- Batti undefined.  
  <sub>TESTI_D3.condizione(N)</sub>
- Segni di completamento: un segno per ogni primo attore battuto con ogni burattino.  
  <sub>TESTI_D3.griglia</sub>
- N segni su N.  
  <sub>TESTI_D3.contoSegni(N)</sub>
- Nuovo nell'attrezzeria: N  
  <sub>TESTI_D3.nuovo(N)</sub>
- Le cronache delle notti stanno nel Registro delle notti ([L] dal menu di pausa).  
  <sub>TESTI_D3.calce</sub>
- [←][→] sfoglia · [↑] sezioni · [ESC] chiudi  
  <sub>TESTI_D3.comandi</sub>
- Vespa Cieca  
  <sub>COMPARSE_D3[0].nome</sub>
- Ali di carta velina incollate con la colla di farina: il garzone ne rifà dieci a sera, perché la ribalta le brucia.  
  <sub>COMPARSE_D3[0].aneddoto</sub>
- Lucciola Pungente  
  <sub>COMPARSE_D3[1].nome</sub>
- Dentro c'è un mozzicone di candela di sego. Quando si spegne cade giù: in bottega la chiamano «la poveretta».  
  <sub>COMPARSE_D3[1].aneddoto</sub>
- Bozzo Esplosivo  
  <sub>COMPARSE_D3[2].nome</sub>
- Polvere avanzata dalla festa di Piedigrotta, cucita in un sacchetto di iuta. Il capocomico giura che in prova non è mai scoppiato.  
  <sub>COMPARSE_D3[2].aneddoto</sub>
- Gatto d'Ombra  
  <sub>COMPARSE_D3[3].nome</sub>
- Ritagliato da un vecchio fondale di Vico Lungo: sulla schiena si legge ancora mezza insegna di cantina.  
  <sub>COMPARSE_D3[3].aneddoto</sub>
- Burattino Scucito  
  <sub>COMPARSE_D3[4].nome</sub>
- Un pupo rimasto senza parte. Ha recitato in troppe commedie e non ricorda più quale: per questo se la prende con tutti.  
  <sub>COMPARSE_D3[4].aneddoto</sub>
- Predone d'Ombra  
  <sub>COMPARSE_D3[5].nome</sub>
- Sagoma di cartone nero tirata da due fili soli. I macchinisti dicono che si muove anche a teatro chiuso.  
  <sub>COMPARSE_D3[5].aneddoto</sub>
- Maschera Corazzata  
  <sub>COMPARSE_D3[6].nome</sub>
- Cartapesta su latta, otto mani di vernice. Quando la bocca si apre, dentro c'è solo il buio delle quinte.  
  <sub>COMPARSE_D3[6].aneddoto</sub>
- Guardia di Piombo  
  <sub>COMPARSE_D3[7].nome</sub>
- Fusa coi soldatini rotti della fiera di Caserta. Pesa tanto che a sollevarla ci vogliono due burattinai.  
  <sub>COMPARSE_D3[7].aneddoto</sub>
- Torrione di Marmo  
  <sub>COMPARSE_D3[8].nome</sub>
- Non è marmo: è gesso venato a pennello. Ma quando cade, cade come un macigno.  
  <sub>COMPARSE_D3[8].aneddoto</sub>
- «Ai Quattro Canti si paga il pedaggio, guagliò.»  
  <sub>PRIMI_ATTORI_D3.re-gatto.battuta</sub>
- Il salto si fa con una carrucola nascosta sopra il boccascena: due macchinisti tirano insieme, al tre.  
  <sub>PRIMI_ATTORI_D3.re-gatto.aneddoto</sub>
- «Alt! In nome di Sua Maestà, fermo là!»  
  <sub>PRIMI_ATTORI_D3.capitano-guardia.battuta</sub>
- La corazza è una caldaia battuta a martello. A ogni carica suona come la campana di una chiesa.  
  <sub>PRIMI_ATTORI_D3.capitano-guardia.aneddoto</sub>
- «Sciame mio, ronzate per la Signora!»  
  <sub>PRIMI_ATTORI_D3.regina-vespa.battuta</sub>
- La corona è fatta coi ditali delle sarte. Ne manca uno: in sartoria lo cercano ancora.  
  <sub>PRIMI_ATTORI_D3.regina-vespa.aneddoto</sub>
- (Il marmo non parla. Ascolta.)  
  <sub>PRIMI_ATTORI_D3.colosso-statua.battuta</sub>
- Lo muove una manovella sotto il palco: se senti cigolare, sta per aprirsi.  
  <sub>PRIMI_ATTORI_D3.colosso-statua.aneddoto</sub>
- «Ogni filo ha il suo taglio, burattino.»  
  <sub>PRIMI_ATTORI_D3.maestro-fucina.battuta</sub>
- Le lame erano cesoie da sarto. Il fabbro della bottega le affilava di notte, perché di giorno facevano paura.  
  <sub>PRIMI_ATTORI_D3.maestro-fucina.aneddoto</sub>
- «Tutti i fili tornano alla mia mano.»  
  <sub>PRIMI_ATTORI_D3.donna-luciana.battuta</sub>
- Quando entra lei la ribalta si abbassa di un palmo: anche le lanterne, dicono, s'inchinano.  
  <sub>PRIMI_ATTORI_D3.donna-luciana.aneddoto</sub>
- La pertica è vera: l'ha lasciata un lampionaio di Corso Trieste che veniva alle recite senza pagare.  
  <sub>PRIMI_ATTORI_D3.lampionaio.aneddoto</sub>
- Un giocattolo a molla da tre carlini, ingrandito dal falegname. Per caricarlo ci vogliono quaranta giri di chiave.  
  <sub>PRIMI_ATTORI_D3.cigno-latta.aneddoto</sub>
- Smontata dopo la festa e rimontata in fretta, al contrario: per questo gira all'indietro.  
  <sub>PRIMI_ATTORI_D3.giostra-lucciole.aneddoto</sub>
- Il telaio, dicono, viene da San Leucio. La seta no: è polvere e filo di ragno.  
  <sub>PRIMI_ATTORI_D3.tessitrice-pietra.aneddoto</sub>
- Pedaggio pagato  
  <sub>TRIONFI_D3[0].nome</sub>
- Il piombo s'inchina  
  <sub>TRIONFI_D3[1].nome</sub>
- Sciame spento  
  <sub>TRIONFI_D3[2].nome</sub>
- Marmo crepato  
  <sub>TRIONFI_D3[3].nome</sub>
- Fili salvi  
  <sub>TRIONFI_D3[4].nome</sub>
- L'ultimo lume  
  <sub>TRIONFI_D3[5].nome</sub>
- Molla scarica  
  <sub>TRIONFI_D3[6].nome</sub>
- Giostra ferma  
  <sub>TRIONFI_D3[7].nome</sub>
- Telaio sciolto  
  <sub>TRIONFI_D3[8].nome</sub>
- Ferruccio alla ribalta  
  <sub>TRIONFI_D3[9].nome</sub>
- Agnese alla ribalta  
  <sub>TRIONFI_D3[10].nome</sub>
- Taddeo alla ribalta  
  <sub>TRIONFI_D3[11].nome</sub>
- L'Ombra alla ribalta  
  <sub>TRIONFI_D3[12].nome</sub>
- Il bivio  
  <sub>TRIONFI_D3[13].nome</sub>
- Sopra la ribalta  
  <sub>TRIONFI_D3[14].nome</sub>
- Recita senza graffi  
  <sub>TRIONFI_D3[15].nome</sub>

## Camerini, terna della Smorfia, Buca dell'Orchestra (76)

Dove: `gioco/teatro/d4-stanze-teatro.js`

- 🎭 Il chiodo della porta di servizio ti strappa un filo: -½ ❤️  
  <sub>TESTI_D4.camerini.graffio</sub>
- 🎭 Il chiodo ti spezzerebbe l'ultimo filo: torna quando avrai più Maschere.  
  <sub>TESTI_D4.camerini.rifiuto</sub>
- 🎭 Il chiodo ti risparmia: sei allo stremo.  
  <sub>TESTI_D4.camerini.risparmia</sub>
- 🎭 I CAMERINI DIETRO LE QUINTE: quel che trovi è tuo, ma anche uscire costa ½ ❤️.  
  <sub>TESTI_D4.camerini.ingressoQuieto</sub>
- 🎭 I CAMERINI DIETRO LE QUINTE: fra gli specchi i manichini si animano!  
  <sub>TESTI_D4.camerini.ingressoCustodi</sub>
- 🎭 I manichini tornano di legno: quel che custodivano è tuo!  
  <sub>TESTI_D4.camerini.custodiCaduti</sub>
- il chiodo della porta di servizio  
  <sub>TESTI_D4.camerini.fonte</sub>
- Manichino dei Camerini  
  <sub>TESTI_D4.camerini.custode</sub>
- 🎫 LA TERNA: N🪙 [E]  
  <sub>TESTI_D4.terna.cartello(N)</sub>
- 🎫 TERNA GIOCATA  
  <sub>TESTI_D4.terna.cartelloGiocata</sub>
- LA TERNA DI DON GENNARO · N🪙  
  <sub>TESTI_D4.terna.titolo(N)</sub>
- «Tre nummere, guagliò: ognuno tene 'a storia soja.»  
  <sub>TESTI_D4.terna.invito</sub>
- «Chiste so' 'e tuoje? E allora paga, ca se tira.»  
  <sub>TESTI_D4.terna.pronta</sub>
- «Attenzione... se tira!»  
  <sub>TESTI_D4.terna.siTira</sub>
- 🎫 «Pe' na terna ce vonno N🪙, guagliò.»  
  <sub>TESTI_D4.terna.senzaGrani(N)</sub>
- 🎫 «Na terna pe' sera, guagliò: 'a furtuna nun se sfruculea.»  
  <sub>TESTI_D4.terna.giaGiocata</sub>
- Primo estratto...  
  <sub>TESTI_D4.terna.ordini[0]</sub>
- Secondo estratto...  
  <sub>TESTI_D4.terna.ordini[1]</sub>
- Terzo...  
  <sub>TESTI_D4.terna.ordini[2]</sub>
- Quarto...  
  <sub>TESTI_D4.terna.ordini[3]</sub>
- E l'urdemo...  
  <sub>TESTI_D4.terna.ordini[4]</sub>
- «N N: N!»  
  <sub>TESTI_D4.terna.chiamata(N)</sub>
- — 'o tiene!  
  <sub>TESTI_D4.terna.preso</sub>
- «Niente. 'A smorfia stanotte dorme.»  
  <sub>TESTI_D4.terna.esiti.0</sub>
- «Uno solo: pigliate 'e spicce e statte buono.»  
  <sub>TESTI_D4.terna.esiti.1</sub>
- «AMBO! Don Gennaro pava, e pava buono.»  
  <sub>TESTI_D4.terna.esiti.2</sub>
- «TERNO SICCO! Maronna mia, 'o banco chiagne!»  
  <sub>TESTI_D4.terna.esiti.3</sub>
- NIENTE  
  <sub>TESTI_D4.terna.titoliEsito.0</sub>
- UN NUMERO  
  <sub>TESTI_D4.terna.titoliEsito.1</sub>
- AMBO!  
  <sub>TESTI_D4.terna.titoliEsito.2</sub>
- TERNO!  
  <sub>TESTI_D4.terna.titoliEsito.3</sub>
- 🎫 La terna non esce: Don Gennaro si tiene i grani.  
  <sub>TESTI_D4.terna.banner.0(N)</sub>
- 🎫 Un numero preso: Don Gennaro ti allunga N🪙.  
  <sub>TESTI_D4.terna.banner.1(N)</sub>
- 🎫 AMBO! Don Gennaro paga N🪙.  
  <sub>TESTI_D4.terna.banner.2(N)</sub>
- 🎫 TERNO SECCO! N🪙 e una reliquia: N [Click/E]  
  <sub>TESTI_D4.terna.banner.3(N)</sub>
- I TUOI NUMERI  
  <sub>TESTI_D4.terna.tuoi</sub>
- ESTRATTI  
  <sub>TESTI_D4.terna.estratti</sub>
- GIOCA LA TERNA: N🪙  
  <sub>TESTI_D4.terna.bottone(N)</sub>
- SEGNA ANCORA N NUMERI  
  <sub>TESTI_D4.terna.bottoneMancano(N)</sub>
- ↑↓←→ scegli · [E / Invio] segna o gioca · [ESC] lascia senza pagare  
  <sub>TESTI_D4.terna.aiutoScegli</sub>
- [E / Invio] avanti il prossimo  
  <sub>TESTI_D4.terna.aiutoEstrazione</sub>
- [E / Invio] chiudi  
  <sub>TESTI_D4.terna.aiutoEsito</sub>
- ♪ LA BUCA DELL'ORCHESTRA: N ondate a tempo di musica. Se non ti toccano, premio doppio!  
  <sub>TESTI_D4.buca.ingresso(N)</sub>
- ♪ Ondata N di N!  
  <sub>TESTI_D4.buca.ondata(N)</sub>
- ♪ Ondata N di N: gran finale!  
  <sub>TESTI_D4.buca.ultima(N)</sub>
- ♪ NEMMENO UN GRAFFIO: l'orchestra applaude in piedi! Premio doppio: N🪙.  
  <sub>TESTI_D4.buca.applauso(N)</sub>
- ♪ Il pezzo è finito, l'orchestra posa gli archi. Premio: N🪙.  
  <sub>TESTI_D4.buca.finita(N)</sub>
- ♪ «BIS!» Sul piedistallo compare la seconda reliquia: N [Click/E]  
  <sub>TESTI_D4.buca.bis(N)</sub>
- ♪ «BIS!» La seconda reliquia non trova posto: l'orchestra te la paga N🪙.  
  <sub>TESTI_D4.buca.bisGrani(N)</sub>
- 'a piccerella  
  <sub>SMORFIA_D4.2</sub>
- 'o surdato  
  <sub>SMORFIA_D4.12</sub>
- 'o guaglione  
  <sub>SMORFIA_D4.15</sub>
- 'a resata  
  <sub>SMORFIA_D4.19</sub>
- 'a festa  
  <sub>SMORFIA_D4.20</sub>
- Natale  
  <sub>SMORFIA_D4.25</sub>
- 'o padrone 'e casa  
  <sub>SMORFIA_D4.31</sub>
- 'o capitone  
  <sub>SMORFIA_D4.32</sub>
- l'aucelluzzo  
  <sub>SMORFIA_D4.35</sub>
- 'e castagnelle  
  <sub>SMORFIA_D4.36</sub>
- 'o ccafè  
  <sub>SMORFIA_D4.42</sub>
- 'o vino buono  
  <sub>SMORFIA_D4.45</sub>
- 'e denare  
  <sub>SMORFIA_D4.46</sub>
- 'o ppane  
  <sub>SMORFIA_D4.50</sub>
- 'o ciardino  
  <sub>SMORFIA_D4.51</sub>
- 'a mamma  
  <sub>SMORFIA_D4.52</sub>
- 'o cappiello  
  <sub>SMORFIA_D4.54</sub>
- 'o cacciatore  
  <sub>SMORFIA_D4.61</sub>
- 'a zuppa cotta  
  <sub>SMORFIA_D4.68</sub>
- 'o palazzo  
  <sub>SMORFIA_D4.70</sub>
- 'a maraviglia  
  <sub>SMORFIA_D4.72</sub>
- Pullecenella  
  <sub>SMORFIA_D4.75</sub>
- 'a funtana  
  <sub>SMORFIA_D4.76</sub>
- 'e sciure  
  <sub>SMORFIA_D4.81</sub>
- 'a chiesa  
  <sub>SMORFIA_D4.84</sub>
- 'a puteca  
  <sub>SMORFIA_D4.86</sub>
- 'a vecchia  
  <sub>SMORFIA_D4.89</sub>

## Cambio di scena e botole (4)

Dove: `gioco/teatro/d5-cambio-scena.js`

- QUADRO I
- CAMBIO DI SCENA
- QUADRO II
- Fine del secondo quadro! Il pubblico ringrazia: premio doppio.

## Acquedotto Carolino (32)

Dove: `gioco/teatro/d6-acquedotto.js`

- ATTO II · ACQUEDOTTO CAROLINO (PIANO N · N STANZE + 1 SEGRETA)  
  <sub>TESTI_D6.atto(N)</sub>
- ACQUEDOTTO CAROLINO  
  <sub>TESTI_D6.cartiglioLuogo</sub>
- Un'altra strada · 🗝 N chiave [E]  
  <sub>TESTI_D6.cartiglioChiusa(N)</sub>
- ▼ SCENDI NEL CONDOTTO [E] ▼  
  <sub>TESTI_D6.cartiglioAperta</sub>
- · A sinistra la GRATA DEL CONDOTTO (🗝 N chiave).  
  <sub>TESTI_D6.bannerGrata(N)</sub>
- · A sinistra la GRATA DEL CONDOTTO: il lucchetto è saltato!  
  <sub>TESTI_D6.bannerGrataGratis</sub>
- La grata del condotto è chiusa col lucchetto: serve N chiave 🗝.  
  <sub>TESTI_D6.serveChiave(N)</sub>
- La chiave gira, il lucchetto cade: sotto la grata si sente correre l'acqua. [E] per scendere.  
  <sub>TESTI_D6.grataAperta</sub>
- «Chi beve l'acqua del Re, paga il pedaggio.»  
  <sub>TESTI_D6.presentazione</sub>
- Il Guardiano torna pietra. L'acqua riprende la sua strada verso la Reggia.  
  <sub>TESTI_D6.sconfitta</sub>
- ★ DONO DELL'ACQUEDOTTO  
  <sub>TESTI_D6.dono</sub>
- · In alto a sinistra l'acqua ha lasciato un DONO DELL'ACQUEDOTTO.  
  <sub>TESTI_D6.bannerDono</sub>
- Inzuppato! I panni bagnati pesano: cammini piano finché non ti asciughi.  
  <sub>TESTI_D6.inzuppato</sub>
- Percorso  
  <sub>TESTI_D6.pergamena[0]</sub>
- per l'Acquedotto Carolino  
  <sub>TESTI_D6.pergamena[1]</sub>
- Stanotte ho preso la strada dell'acqua: sotto la grata, lungo il condotto, fin sopra i Ponti della Valle.  
  <sub>TESTI_D6.diario[0]</sub>
- Sono passato per l'Acquedotto. Lassù il vento sposta pure i pensieri, e l'acqua corre senza chiedere permesso a nessuno.  
  <sub>TESTI_D6.diario[1]</sub>
- Niente Villa, stanotte: il condotto del Re. Tre ordini di archi, e io sopra come una formica.  
  <sub>TESTI_D6.diario[2]</sub>
- Acquedotto Carolino  
  <sub>QUARTIERE_D6.nome</sub>
- Nel Vento  
  <sub>QUARTIERE_D6.atmosfera</sub>
- L'Acquedotto Carolino nel Vento  
  <sub>QUARTIERE_D6.titoloCompleto</sub>
- ATTO II · ACQUEDOTTO CAROLINO  
  <sub>QUARTIERE_D6.descrizioneSipario.atto</sub>
- «L'ACQUEDOTTO CAROLINO NEL VENTO»  
  <sub>QUARTIERE_D6.descrizioneSipario.titolo</sub>
- Tre ordini di archi di tufo scavalcano la valle: sopra corre il vento, dentro corre l'acqua del Re.  
  <sub>QUARTIERE_D6.descrizioneSipario.testo1</sub>
- Il condotto porta l'acqua fino alle fontane della Reggia. Stanotte porta anche te.  
  <sub>QUARTIERE_D6.descrizioneSipario.testo2</sub>
- Nell'acqua si cammina piano e la corrente spinge. Quando fiaccole e drappi si piegano, arriva la raffica!  
  <sub>QUARTIERE_D6.descrizioneSipario.testo3</sub>
- Rondone di Latta  
  <sub>NEMICI_D6.rondone_latta.nome</sub>
- Lavandaia di Tufo  
  <sub>NEMICI_D6.lavandaia_tufo.nome</sub>
- Fontaniere  
  <sub>NEMICI_D6.fontaniere.nome</sub>
- Il Guardiano delle Acque  
  <sub>SCHEDA_D6.nome</sub>
- segnoTridenteD6  
  <sub>SCHEDA_D6.segno.sprite</sub>
- Guardiano delle Acque  
  <sub>SCHEDA_D6.segno.nome</sub>

## Rifiniture (Ragno della Seta, scritte a tocco) (17)

Dove: `gioco/teatro/d7-rifiniture.js, b7-stanze.js`

- WASD: Movimento · Frecce/Mouse: Spara/Attacca  
  <sub>TOCCO_D7.frasi[0][0]</sub>
- Levetta sinistra: movimento · levetta destra: sparo  
  <sub>TOCCO_D7.frasi[0][1]</sub>
- [W/S] o click: scegli lo slot · [Canc] cancella · [M] muto  
  <sub>TOCCO_D7.frasi[1][0]</sub>
- Tocca uno slot per sceglierlo, il cestino per cancellarlo  
  <sub>TOCCO_D7.frasi[1][1]</sub>
- Q: Attivo · E: Compra/Patto/Raccogli · ESC: Pausa  
  <sub>TOCCO_D7.frasi[2][0]</sub>
- OGGETTO: attivo · AZIONE: compra/patto/raccogli · ❚❚: pausa  
  <sub>TOCCO_D7.frasi[2][1]</sub>
- [E]  
  <sub>TOCCO_D7.parole[0][1]</sub>
- tocca CONFERMA  
  <sub>TOCCO_D7.parole[2][1]</sub>
- CONFERMA  
  <sub>TOCCO_D7.parole[3][1]</sub>
- Tocca  
  <sub>TOCCO_D7.parole[4][1]</sub>
- INDIETRO  
  <sub>TOCCO_D7.parole[7][1]</sub>
- $1INDIETRO  
  <sub>TOCCO_D7.parole[8][1]</sub>
- TRASFORMAZIONI  
  <sub>TOCCO_D7.linguette.voci[0][1]</sub>
- DIARIO DI FERRUCCIO  
  <sub>TOCCO_D7.linguette.voci[1][1]</sub>
- FINALI  
  <sub>TOCCO_D7.linguette.voci[2][1]</sub>
- Ragno della Seta
- 🕷 Dal vaso di Capodimonte salta fuori un Ragno della Seta, arrabbiato!

## Riprendi la notte, mira assistita, conto della notte (48)

Dove: `gioco/teatro/e6-assistenza.js`

- LA NOTTE È RIMASTA A METÀ  
  <sub>TESTI_E6.titoloRipresa</sub>
- Riprendi la notte (Piano N, N)  
  <sub>TESTI_E6.riprendi(N)</sub>
- Si riparte dall'inizio del piano, con tutto quello che avevi. Il piano si rimonta da capo.  
  <sub>TESTI_E6.sottoRipresa</sub>
- RIPRENDI  
  <sub>TESTI_E6.bottoneRiprendi</sub>
- NUOVA NOTTE  
  <sub>TESTI_E6.bottoneNuova</sub>
- ◂ ▸ scegli · [E] / Invio conferma · [ESC] nuova notte  
  <sub>TESTI_E6.piedeRipresa</sub>
- 🌙 Si riprende dall'inizio del Piano N  
  <sub>TESTI_E6.ripresaBanner(N)</sub>
- ripresa N volte  
  <sub>TESTI_E6.riprese(N)</sub>
- Mira assistita  
  <sub>TESTI_E6.rigaMira</sub>
- Leggera: il colpo si piega un poco verso il nemico. Piena: anche senza direzione spara al più vicino.  
  <sub>TESTI_E6.notaMira</sub>
- SPENTA  
  <sub>TESTI_E6.sceltaMira.spenta</sub>
- LEGGERA  
  <sub>TESTI_E6.sceltaMira.leggera</sub>
- PIENA  
  <sub>TESTI_E6.sceltaMira.piena</sub>
- IL CONTO DELLA NOTTE N  
  <sub>TESTI_E6.contoTitolo(N)</sub>
- NOTTE N: I FILI SONO SPEZZATI  
  <sub>TESTI_E6.contoVittoria(N)</sub>
- Ti ha battuto  
  <sub>TESTI_E6.battuto</sub>
- Donna Luciana è caduta. Il Teatro continua.  
  <sub>TESTI_E6.vittoria</sub>
- Piano  
  <sub>TESTI_E6.voci.piano</sub>
- Tempo  
  <sub>TESTI_E6.voci.tempo</sub>
- Stanze ripulite  
  <sub>TESTI_E6.voci.stanze</sub>
- Nemici battuti  
  <sub>TESTI_E6.voci.nemici</sub>
- Oggetti presi  
  <sub>TESTI_E6.voci.oggetti</sub>
- Trasformazioni  
  <sub>TESTI_E6.voci.trasf</sub>
- Il momento migliore  
  <sub>TESTI_E6.momento</sub>
- N stanze di fila senza un graffio  
  <sub>TESTI_E6.serie(N)</sub>
- Hai abbattuto N  
  <sub>TESTI_E6.boss(N)</sub>
- N nemici giù prima del sipario  
  <sub>TESTI_E6.nemiciMomento(N)</sub>
- Il sipario si è alzato: la prossima volta si va più lontano  
  <sub>TESTI_E6.momentoVuoto</sub>
- Per la prossima notte  
  <sub>TESTI_E6.consiglio</sub>
- Premi [E] o tocca per tornare in piazza  
  <sub>TESTI_E6.chiudi</sub>
- Premi [E] o tocca per proseguire  
  <sub>TESTI_E6.chiudiVittoria</sub>
- Prima del pugno la mano si ferma in alto e si chiude: quando smette di seguirti, fai due passi di lato.  
  <sub>CONSIGLI_E6[0][1]</sub>
- La mano aperta che scende piano cerca di prenderti: tieniti lontano dalla sua ombra e colpiscila quando è a terra.  
  <sub>CONSIGLI_E6[1][1]</sub>
- Le forbici si aprono prima di tagliare: quando le lame si allargano, esci dalla loro linea.  
  <sub>CONSIGLI_E6[2][1]</sub>
- Il Gatto si acquatta prima del balzo e da in alto non si colpisce: spostati quando abbassa la coda, colpisci quando atterra.  
  <sub>CONSIGLI_E6[3][1]</sub>
- Il Custode si chiude e incassa: aspetta che si apra, è lì che i colpi fanno male davvero.  
  <sub>CONSIGLI_E6[4][1]</sub>
- Il Capitano punta il moschetto prima di sparare: quando alza la canna, mettiti di traverso alla sua linea.  
  <sub>CONSIGLI_E6[5][1]</sub>
- Lo Spezzafili carica il colpo all'indietro: quando si piega, allontanati prima che sciolga il braccio.  
  <sub>CONSIGLI_E6[6][1]</sub>
- La Regina si ferma a mezz'aria prima della picchiata: muoviti in quel momento, non dopo.  
  <sub>CONSIGLI_E6[7][1]</sub>
- Donna Luciana tende i fili prima di tirarli: quando li vedi tesi, cambia corsia.  
  <sub>CONSIGLI_E6[8][1]</sub>
- La vespa vibra sul posto prima di lanciarsi: se smette di girarti attorno, scansati di lato.  
  <sub>CONSIGLI_E6[9][1]</sub>
- Il gatto si abbassa sulle zampe prima di saltare: appena lo vedi acquattato, cambia direzione.  
  <sub>CONSIGLI_E6[10][1]</sub>
- La guardia si pianta e alza l'arma prima del colpo: quando si ferma, esci dalla sua linea di tiro.  
  <sub>CONSIGLI_E6[11][1]</sub>
- La maschera chiusa incassa quasi tutto: aspetta che si apra e colpisci allora, tenendoti a distanza.  
  <sub>CONSIGLI_E6[12][1]</sub>
- Il bozzo gonfio sta per scoppiare: non colpirlo da vicino, allontanati e tira da lontano.  
  <sub>CONSIGLI_E6[13][1]</sub>
- Le stanze speciali chiedono Maschere: entraci quando sei pieno, non a mezza Maschera.  
  <sub>CONSIGLI_E6[14][1]</sub>
- I colpi partono dopo una piccola pausa di chi spara: quando un nemico si ferma e ti guarda, muoviti di lato.  
  <sub>CONSIGLI_E6[15][1]</sub>
- Chi ti ha battuto si è fermato un attimo prima di colpire: guarda la sua posa e muoviti in quell'attimo.  
  <sub>CONSIGLI_E6[16][1]</sub>

## Qualità automatica (3)

Dove: `gioco/teatro/e4-prestazioni.js`

- qualitaAuto  
  <sub>RIGA_E4.id</sub>
- Qualità automatica  
  <sub>RIGA_E4.nome</sub>
- Sul telefono, se il teatro rallenta spegne da sé grana, ombre lunghe, pubblico e vignetta, e li riaccende quando torna fluido.  
  <sub>RIGA_E4.nota</sub>

## Ultime correzioni (cestino degli slot, temi dell'Acquedotto) (9)

Dove: `gioco/teatro/t3-economia-salvataggi.js, d6-acquedotto.js, d7-rifiniture.js`

- Cancellare questo salvataggio?
- Il salvataggio si perde per sempre.
- Sì
- No
- Tocca uno slot per sceglierlo, il cestino per cancellarlo
- Lo Stormo dei Rondoni
- 🪶 LO STORMO DEI RONDONI: sotto gli archi si alza tutto il nido di latta. Chi lo abbatte trova qualcosa in più.
- I Fontanieri del Condotto
- 🗡 I FONTANIERI DEL CONDOTTO: tre ombre fra le chiuse. Chi le stana trova qualcosa in più.

## Agnese al telaio e il confronto con Taddeo (1)

Dove: `gioco/teatro/h1-agnese-taddeo.js`

- (tabella non trovata nel gioco)  
  <sub>TESTI_H1</sub>

## Rivelazioni dei boss, Bianca, Assunta (47)

Dove: `gioco/teatro/h2-memorie.js`

- Dal Gatto salgono una culla, un mestolo, una ninna nanna: ricordi di casa rubati alle famiglie. Le creature d'ombra custodiscono qualcosa di umano.  
  <sub>TESTI_H2.rivelazioni.re-gatto</sub>
- Le vespe portavano promesse mai mantenute dei lavori della Reggia. Desideri rubati, trascinati verso il palazzo.  
  <sub>TESTI_H2.rivelazioni.regina-vespa</sub>
- Il marmo custodiva gli operai morti al cantiere. Nel loro ricordo Gaetano non causò l'incidente: tentò di salvare gli altri.  
  <sub>TESTI_H2.rivelazioni.colosso-statua</sub>
- La guardiana dei telai si scioglie in fili di seta. Il Velo nasce dalla seta, e il giglio lega i guardiani a Donna Luciana.  
  <sub>TESTI_H2.rivelazioni.tessitrice-pietra</sub>
- Sotto il piombo c'era una guardia di Palazzo che fece il turno di notte per trent'anni. Il Velo gli ha lasciato solo la ronda.  
  <sub>TESTI_H2.rivelazioni.capitano-guardia</sub>
- L'ottone ricorda un garzone di bottega che affilava forbici in Via San Carlo. Tagliava i fili perché nessuno gli aveva insegnato a cucirli.  
  <sub>TESTI_H2.rivelazioni.maestro-fucina</sub>
- Era l'uomo che accendeva i lumi di Corso Trieste ogni sera. Quando Caserta si è addormentata, ha continuato ad accenderli per nessuno.  
  <sub>TESTI_H2.rivelazioni.lampionaio</sub>
- Il cigno era un giocattolo di latta, regalo di un padre a una bambina della Villa. La bambina è cresciuta; il cigno no.  
  <sub>TESTI_H2.rivelazioni.cigno-latta</sub>
- La giostra girava per i bambini della festa del 1845. Le lucciole sono le risate di quella sera, chiuse dentro.  
  <sub>TESTI_H2.rivelazioni.giostra-lucciole</sub>
- Il Guardiano ha la voce degli scalpellini dell'Acquedotto: tufo e acqua per la Reggia, e i nomi di chi c'è rimasto sotto.  
  <sub>TESTI_H2.rivelazioni.guardiano-acque</sub>
- Ferruccio guarda le anime salire. Non erano mostri. Erano quello che resta di Caserta, e lui li sta lasciando andare.  
  <sub>TESTI_H2.svolta</sub>
- Rivelazione:  
  <sub>TESTI_H2.registroEtichetta</sub>
- Quando N è caduto, ho capito una cosa: n  
  <sub>TESTI_H2.diario(N)</sub>
- Stanotte ho smesso di chiamarli mostri.  
  <sub>TESTI_H2.diarioSvolta</sub>
- Assunta  
  <sub>TESTI_ASSUNTA_H2.nome</sub>
- Tu si' 'o guaglione nuovo d'a piazza? Chella porta llà è 'a bottega 'e Gaetano, 'o fabbro. Da 'a sera d'a festa nun s'è aperta cchiù.  
  <sub>TESTI_ASSUNTA_H2.notte1[0][1]</sub>
- Ha ancora la coccarda della festa appuntata allo scialle. Il cesto è pieno di nastri che nessuno ha comprato.  
  <sub>TESTI_ASSUNTA_H2.notte1[1][1]</sub>
- 'A sera d'a festa, 'o '45, stèvemo tutte a ballà. Po' 'e lanterne se so' fermate, e Caserta s'è addurmuta cu 'o sorriso 'nfaccia.  
  <sub>TESTI_ASSUNTA_H2.notti[0][0][1]</sub>
- Gaetano batteva 'o fierro pure 'e notte. Tonino 'o sape: si 'o martello se sente ancora, vuol dire ca isso nun s'è scurdato.  
  <sub>TESTI_ASSUNTA_H2.notti[1][0][1]</sub>
- Vennevo nastri p' 'a festa. Mo' 'e tengo tutte cca: nisciuno se ricorda cchiù 'e se fa' bello.  
  <sub>TESTI_ASSUNTA_H2.notti[2][0][1]</sub>
- Hê rotto 'nu sigillo d' 'a bottega? Mamma mia... 'o giglio 'ncopp' 'a ceralacca è chillo d' 'a Reggia. Statte accorto, guagliò.  
  <sub>TESTI_ASSUNTA_H2.sigilli12[0][1]</sub>
- Tre sigilli 'nterra. Io 'o sento, 'o martello: tre colpe, 'na pausa, uno. Gaetano te sta aspettanno.  
  <sub>TESTI_ASSUNTA_H2.sigilli3[0][1]</sub>
- Sotto 'a fenesta 'e Mariella ce sta ancora scritta 'na filastrocca p' 'e criature. Nun l'aggio maie capita.  
  <sub>TESTI_BIANCA_H2.piazza[0][1]</sub>
- Vicino a una finestra si trova una vecchia filastrocca dedicata ai bambini.  
  <sub>TESTI_BIANCA_H2.piazza[1][1]</sub>
- «Quando il giglio si addormenta, la luna ascolta e non si lamenta.»  
  <sub>TESTI_BIANCA_H2.piazza[2][1]</sub>
- Non è ancora chiaro cosa significhi.  
  <sub>TESTI_BIANCA_H2.piazza[3][1]</sub>
- Una memoria conservata nel marmo mostra Gregorio mentre insegna a Bianca a fare un inchino. La bambina ride e sbaglia apposta.  
  <sub>TESTI_BIANCA_H2.villa[0]</sub>
- Bianca: «Ancora! Ma stavolta fallo tu!»  
  <sub>TESTI_BIANCA_H2.villa[1]</sub>
- Il ricordo svanisce quando Gregorio cerca di prenderle la mano. A terra resta un foglio: un disegno della Reggia ancora incompleta.  
  <sub>TESTI_BIANCA_H2.villa[2]</sub>
- Accanto ai telai si trova un piccolo fazzoletto ricamato con un giglio incompleto.  
  <sub>TESTI_BIANCA_H2.leucio[0]</sub>
- Agnese spiega che Donna Luciana chiedeva spesso di riprodurre quel disegno. Agnese: «Nessuno riusciva a farlo uguale.»  
  <sub>TESTI_BIANCA_H2.leucio[1]</sub>
- Agnese: «Forse perché era stato fatto da una bambina.»  
  <sub>TESTI_BIANCA_H2.leucio[2]</sub>
- Ferruccio trova una scatola musicale. La melodia è la stessa che si sente, debolmente, durante tutti gli incontri con le statue.  
  <sub>TESTI_BIANCA_H2.reggia[0]</sub>
- Donna Luciana la apre. «Aveva promesso di imparare a suonarla.» «Non ne ha avuto il tempo.»  
  <sub>TESTI_BIANCA_H2.reggia[1]</sub>
- Il Velo non è stato creato per riportare Bianca in vita. È stato creato perché sua madre non potesse più provare il dolore di averla perduta.  
  <sub>TESTI_BIANCA_H2.reggia[2]</sub>
- Il ricordo di Bianca viene liberato. Il giglio ricamato perde la sua luce.  
  <sub>TESTI_BIANCA_H2.chiusura.uccisa[0]</sub>
- Rimane un semplice fazzoletto.  
  <sub>TESTI_BIANCA_H2.chiusura.uccisa[1]</sub>
- Il giglio continua a brillare. La scatola musicale suona da sola.  
  <sub>TESTI_BIANCA_H2.chiusura.risparmiata[0]</sub>
- Donna Luciana ascolta una voce che ripete sempre lo stesso verso: «Quando il giglio si addormenta, la luna ascolta e non si lamenta.»  
  <sub>TESTI_BIANCA_H2.chiusura.risparmiata[1]</sub>
- [E] Guarda  
  <sub>TESTI_BIANCA_H2.prompt</sub>
- Bianca  
  <sub>TESTI_BIANCA_H2.pagina.titolo</sub>
- Una filastrocca sotto la finestra di Mariella: «Quando il giglio si addormenta, la luna ascolta e non si lamenta.»  
  <sub>TESTI_BIANCA_H2.pagina.piazza</sub>
- Un disegno della Reggia ancora incompleta, rimasto dopo il ricordo di Gregorio e della bambina che sbagliava apposta l'inchino.  
  <sub>TESTI_BIANCA_H2.pagina.villa</sub>
- Un piccolo fazzoletto con un giglio incompleto. Nessuno riusciva a farlo uguale.  
  <sub>TESTI_BIANCA_H2.pagina.leucio</sub>
- Una piccola scatola musicale. Aveva promesso di imparare a suonarla.  
  <sub>TESTI_BIANCA_H2.pagina.reggia</sub>
- Il giglio si è spento. È rimasto un fazzoletto.  
  <sub>TESTI_BIANCA_H2.pagina.uccisa</sub>
- Il giglio brilla ancora, e la scatola suona da sola.  
  <sub>TESTI_BIANCA_H2.pagina.risparmiata</sub>

## Gregorio, il Custode (Cortile d'Onore) (56)

Dove: `gioco/teatro/h3-gregorio.js`

- Gregorio, il Custode della Reggia  
  <sub>TESTI_H3.nome</sub>
- CORTILE D'ONORE — Gregorio sbarra la porta della Signora.  
  <sub>TESTI_H3.banner.cortile</sub>
- Il Custode solleva l'alabarda: guardagli le spalle e il giglio.  
  <sub>TESTI_H3.banner.scontro</sub>
- Il giglio sul petto del Custode lampeggia: la mano che lo tiene si fa più dura.  
  <sub>TESTI_H3.banner.fase2</sub>
- Il Cortile è libero: la porta della Signora è aperta.  
  <sub>TESTI_H3.banner.via</sub>
- Il mazzo di chiavi del Custode: +1 chiave. E sai dove colpire Donna Luciana.  
  <sub>TESTI_H3.banner.dono</sub>
- Il Custode è caduto: Donna Luciana combatte con rabbia. Nessuna guardia con lei.  
  <sub>TESTI_H3.banner.lucianaRabbia</sub>
- Donna Luciana sa che arrivi: le guardie ti aspettano. Il giglio sul petto: lì passano i fili.  
  <sub>TESTI_H3.banner.lucianaGuardie</sub>
- Cortile d'Onore · Notte · Poche luci calde  
  <sub>TESTI_H3.ingresso[0][1]</sub>
- Davanti al portone dello scalone un vecchio in armatura sbarra la strada. Mantello rosso, chiavi alla cintura, un giglio d'oro sul petto.  
  <sub>TESTI_H3.ingresso[1][1]</sub>
- Mostragli le prove  
  <sub>TESTI_H3.scelta.dialogo</sub>
- Cerca le prove nella giubba  
  <sub>TESTI_H3.scelta.senzaProve</sub>
- Attacca il Custode  
  <sub>TESTI_H3.scelta.attacco</sub>
- Le mani di Ferruccio cercano nella giubba qualcosa che non c'è. Poi stringono la spada.  
  <sub>TESTI_H3.senzaProve[0][1]</sub>
- Gregorio solleva immediatamente l'alabarda.  
  <sub>TESTI_H3.attacco[0][1]</sub>
- Un altro figlio viene a chiedermi conto dei padri.  
  <sub>TESTI_H3.attacco[1][1]</sub>
- Il combattimento comincia.  
  <sub>TESTI_H3.attacco[2][1]</sub>
- Ferruccio mostra il registro o il messaggio di Taddeo.  
  <sub>TESTI_H3.dialogo[0][1]</sub>
- Gregorio si ferma per un istante.  
  <sub>TESTI_H3.dialogo[1][1]</sub>
- Gaetano...  
  <sub>TESTI_H3.dialogo[2][1]</sub>
- Gli abbiamo fatto un torto terribile.  
  <sub>TESTI_H3.dialogo[3][1]</sub>
- Poi il giglio si illumina.  
  <sub>TESTI_H3.dialogo[4][1]</sub>
- Va' via. Prima che mi faccia ucciderti.  
  <sub>TESTI_H3.dialogo[5][1]</sub>
- Ferruccio non va via. Resta fermo, la spada bassa.  
  <sub>TESTI_H3.dialogoResiste[0][1]</sub>
- Il Custode pianta l'alabarda nel selciato e la tiene giù con tutte e due le mani. Il giglio lampeggia, una volta, due volte.  
  <sub>TESTI_H3.dialogoResiste[1][1]</sub>
- Il giglio che porta lei, sul petto. Lì passano i fili. Colpisci lì, prima che ti veda stanco.  
  <sub>TESTI_H3.dialogoResiste[2][1]</sub>
- Gregorio stacca dalla cintura il mazzo di chiavi e lo lascia cadere ai piedi di Ferruccio.  
  <sub>TESTI_H3.dialogoResiste[3][1]</sub>
- Al termine dello scontro, l'armatura si spezza. Gregorio cade sulle ginocchia.  
  <sub>TESTI_H3.morte[0][1]</sub>
- L'alabarda tocca il pavimento con un rumore metallico.  
  <sub>TESTI_H3.morte[1][1]</sub>
- Il giglio sul suo petto si incrina, poi si spezza.  
  <sub>TESTI_H3.morte[2][1]</sub>
- Dall'armatura esce una piccola luce azzurra.  
  <sub>TESTI_H3.morte[3][1]</sub>
- Per la prima volta, dietro l'elmo, c'è un volto umano.  
  <sub>TESTI_H3.morte[4][1]</sub>
- Non era un ordine del Re...  
  <sub>TESTI_H3.morte[5][1]</sub>
- Era una promessa fatta a mia moglie.  
  <sub>TESTI_H3.morte[6][1]</sub>
- Ho protetto la porta per tutta la vita...  
  <sub>TESTI_H3.morte[8][1]</sub>
- E non ho visto cosa entrava.  
  <sub>TESTI_H3.morte[9][1]</sub>
- Gregorio tende una mano verso il balcone.  
  <sub>TESTI_H3.morte[10][1]</sub>
- Lei... crede ancora di poterla salvare.  
  <sub>TESTI_H3.morte[11][1]</sub>
- Gregorio muore e la sua anima sale lentamente verso il balcone.  
  <sub>TESTI_H3.morte[12][1]</sub>
- Ferruccio solleva lo sguardo.  
  <sub>TESTI_H3.morte[13][1]</sub>
- Donna Luciana è lì.  
  <sub>TESTI_H3.morte[14][1]</sub>
- Gregorio?  
  <sub>TESTI_H3.morte[15][1]</sub>
- Avevi promesso che saremmo rimasti insieme.  
  <sub>TESTI_H3.morte[16][1]</sub>
- Sul selciato resta il mantello rosso, vuoto, sopra l'armatura.  
  <sub>TESTI_H3.morte[17][1]</sub>
- L'armatura si spezza. Gregorio cade sulle ginocchia.  
  <sub>TESTI_H3.senzaScontro[1]</sub>
- Tuo padre era innocente.  
  <sub>TESTI_H3.morteSe.dialogo[1]</sub>
- Anche io avevo paura di perderla.  
  <sub>TESTI_H3.morteSe.attacco[1]</sub>
- Nel Cortile d'Onore ho abbattuto il Custode. Sotto l'elmo c'era un vecchio.  
  <sub>TESTI_H3.diario.attacco</sub>
- Nel Cortile d'Onore il Custode ha abbassato l'alabarda. Mi ha lasciato le sue chiavi.  
  <sub>TESTI_H3.diario.dialogo</sub>
- «Un altro figlio viene a chiedermi conto dei padri.»  
  <sub>TESTI_H3.registro.battuta</sub>
- Custode della Reggia, rispettato dalle famiglie degli operai. Quando volle fermare sua moglie, lei lo legò al giglio d'oro.  
  <sub>TESTI_H3.registro.aneddoto</sub>
- Gregorio cade in ginocchio. Il giglio si spezza.  
  <sub>TESTI_H3.breveAttaccoMorte[0][1]</sub>
- Il Custode muore. Sul selciato resta il mantello rosso, vuoto.  
  <sub>TESTI_H3.breveAttaccoMorte[2][1]</sub>
- Il Custode guarda Ferruccio come chi lo aspettava. Pianta l'alabarda prima ancora di vedere le prove.  
  <sub>TESTI_H3.breveDialogo[0][1]</sub>
- Il giglio, sul petto di lei. Va'.  
  <sub>TESTI_H3.breveDialogo[2][1]</sub>
- Il mazzo di chiavi cade ai piedi di Ferruccio. Il giglio si spezza.  
  <sub>TESTI_H3.breveDialogo[3][1]</sub>

## Ritorno in piazza e ferri di Gaetano (22)

Dove: `gioco/teatro/h4-ritorno-piazza.js`

- TORNA IN PIAZZA [E]  
  <sub>TESTI_H4.uscita</sub>
- la notte non è finita  
  <sub>TESTI_H4.uscitaSotto</sub>
- con tutto: Maschere piene, la porta della bottega aspetta  
  <sub>TESTI_H4.uscitaSotto2</sub>
- ★ DONNA LUCIANA È CADUTA! Botola: NOTTE SENZA FINE (ciclo N) · A sinistra: torna in piazza, la notte non è finita  
  <sub>TESTI_H4.banner(N)</sub>
- In basso a sinistra: torna in piazza, la notte non è finita  
  <sub>TESTI_H4.bannerAggiunta</sub>
- Piazza Dante · la notte è ancora viva · Maschere piene  
  <sub>TESTI_H4.rientro</sub>
- Ancora 'n giro, guagliò? Stanotte 'a porta 'e Gaetano nun s'è chiusa. Vai, ca t'aspetta.  
  <sub>TESTI_H4.tonino</sub>
- LA NOTTE È VIVA · la porta della bottega aspetta  
  <sub>TESTI_H4.piazzaViva</sub>
- a destra: la botola, ciclo seguente  
  <sub>TESTI_H4.piazzaVivaSotto</sub>
- ☾ La notte è ancora viva: «Ricomincia notte» o «Menù personaggi» la chiudono  
  <sub>TESTI_H4.pausa</sub>
- NOTTE SENZA FINE · CICLO N — la notte continua  
  <sub>TESTI_H4.continua(N)</sub>
- I ferri di Gaetano  
  <sub>TESTI_H4.rastrelliera.titolo</sub>
- Prendi quanti ferri vuoi. Aiutano contro le Mani, ma ognuno pesa.  
  <sub>TESTI_H4.rastrelliera.sotto</sub>
- Ogni ferro preso: passo −N% per tutto lo scontro  
  <sub>TESTI_H4.rastrelliera.costo(N)</sub>
- Le Tenaglie — le mani restano a terra più a lungo  
  <sub>TESTI_H4.rastrelliera.ferri.tenaglie</sub>
- Il Punzone — scendono meno marionette  
  <sub>TESTI_H4.rastrelliera.ferri.punzone</sub>
- La Lima — le forbici s'aprono più piano  
  <sub>TESTI_H4.rastrelliera.ferri.lima</sub>
- [preso]  
  <sub>TESTI_H4.rastrelliera.preso</sub>
- [lasciato]  
  <sub>TESTI_H4.rastrelliera.lasciato</sub>
- Sali sopra la ribalta (N ferri)  
  <sub>TESTI_H4.rastrelliera.sali(N)</sub>
- [↑↓] scegli · [E] prendi/lascia · [Esc] resta in piazza  
  <sub>TESTI_H4.rastrelliera.aiuto</sub>
- N ferri di Gaetano · passo −N%  
  <sub>TESTI_H4.scontro(N)</sub>
