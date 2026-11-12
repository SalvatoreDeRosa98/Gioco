# Testi nuovi da approvare — seconda ondata e migliorie

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
