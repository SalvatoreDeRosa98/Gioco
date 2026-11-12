# Roadmap del Teatro delle Marionette — verso un gioco da vendere

Aggiornata il 2026-11-12. Decisioni dell'autore: Caserta 1845 (come la bibbia), quattro personaggi (nessun quinto),
Agnese resta la tessitrice di San Leucio, nessun nome o riferimento ad altri giochi dentro il gioco.

## Fatto
- Bombe, chiavi, forzieri, lucchetti; consumabili ignoti (ampolle e carte napoletane); stanze speciali (Sfida,
  Ceppo dei Chiodi, Stanza dei Rovi, Bisca); progressione e segni per personaggio; musica generata; Registro
  delle notti e bilancio; codice diviso in file.
- Quartieri della bibbia per i quattro piani; fogli sprite animati di nemici e boss (autore).
- Via ogni nome e riferimento ad altri giochi; opzioni condivise (`OPZIONI`) e uscita comune degli effetti sonori.

## Prima ondata — FATTA (2026-11-10)
1. Pubblico nei palchetti che reagisce, premi lanciati dal pubblico, sipario di velluto.
2. Luci della ribalta con ombre lunghe, scenografia che scende dai cavi, marionette che crollano coi fili
   spezzati, trucioli e scintille, grana e vignettatura.
3. Controller, menu senza mouse, menu Opzioni (volumi, scossa, schermo intero, tasti).
4. Trasformazioni (tre oggetti dello stesso tema) e sinergie a coppie.
5. 200 oggetti.
6. Rosa di 2-3 boss per piano, con boss nuovi.
7. 40 disposizioni di stanza, elementi di scena, Gioco del Ciarlatano, Clessidra della Ribalta.
8. Finale vero, finale segreto della porta della bottega (3 sigilli), diario notte per notte, voce del Burattinaio.

## Seconda ondata — FATTA (2026-11-12)
1. Lo scontro col Grande Burattinaio «Sopra la Ribalta» (mani guantate, forbici colossali), dietro i 3 sigilli.
2. Personaggi con stili di gioco diversi: Agnese (piroette di seta che rimandano i colpi, due Maschere, scatto
   oltre i baratri), Taddeo (pesante, maglio, non respinto, spacca gli ostacoli), l'Ombra Senza Fili (muore con un
   colpo, vola attraverso gli ostacoli, colpi spettrali).
3. Registro di Scena nell'hub (reliquie, nemici, boss, aneddoti) e segni di trionfo che sbloccano oggetti.
4. Buca dell'Orchestra (ondate a tempo di tarantella), terna della Smorfia al Banco del Lotto, Camerini dietro
   le Quinte (la Stanza dei Rovi rivestita).
5. Cambio di scena a metà stanza (al posto delle stanze giganti che scorrono); leve con sacchi di sabbia,
   botole, pozze d'olio e candele.
6. L'Acquedotto Carolino sotterraneo: percorso alternativo dal piano 2 (un quartiere in più).

## Migliorie dopo la seconda ondata — FATTE (2026-11-12)
- Rifiniture: HUD ai lati con la balconata visibile, Donna Luciana leggibile, Ragno della Seta, scritte a tocco.
- Aiuti: riprendi la notte dall'inizio del piano, mira assistita, il conto della notte.
- Sprite: pulizia, piedi fermi, contorno unico e versione «a ombre» per tutte le figure (Ferruccio originale).
- Prestazioni sul telefono (menu e Donna Luciana alleggeriti, qualità automatica); primo ritocco di bilancio;
  revisione degli incroci fra le parti (maglio di Taddeo contro il Burattinaio); prove rese stabili
  (`tools/qa-teatro-tutte.sh`); mappa del codice (`graphify-out/`, `tools/grafo-teatro.py`).

## Terza ondata — trama e zone nuove — FATTA (2026-11-12)
Albero dei percorsi di una notte: P1 Corso Trieste → P2 Villa Comunale **oppure** Acquedotto Carolino → P3 San Leucio
(la botola, sempre) **oppure** Casertavecchia (cancelletto, solo venendo dalla Villa) **oppure** Anfiteatro Campano
(condotto, solo venendo dall'Acquedotto) → P4 Reggia. In una notte non si vede tutto.
- **Agnese e Taddeo** (`h1-agnese-taddeo.js`): il Telaio a San Leucio (battute della bibbia, scelta «Restituiscile i
  ricordi» / «Lasciala sognare»), il confronto con Taddeo alla caduta del Capitano («Perdonalo» / «Accusalo»), le loro
  presenze in piazza, righe nel Diario e nel finale vero.
- **Memorie** (`h2-memorie.js`): i boss si dissolvono in anime e lasciano la loro rivelazione; i quattro indizi di
  Bianca con la pagina del Diario e la chiusura; Assunta al posto della festaiola.
- **Gregorio, il Custode** (`h3-gregorio.js`): il Cortile d'Onore prima di Donna Luciana, «Mostragli le prove» /
  «Attacca il Custode», scontro a due fasi, conseguenze sullo scontro con Donna Luciana.
- **Ritorno in piazza** (`h4-ritorno-piazza.js`): dopo Donna Luciana, se la porta della bottega è pronta, si torna in
  Piazza Dante con la notte viva e le Maschere piene; rastrelliera dei ferri di Gaetano; Grande Burattinaio tarato
  sulla dotazione e sul ciclo.
- **Sottopalco** (`h5-sottopalco.js`): una botola socchiusa a notte, tre stanze al buio, il Macchinista, un oggetto e
  un pezzo di copione.
- **Casertavecchia** (`h6-casertavecchia.js`): i rintocchi, quattro nemici, il Campanaro Senza Volto, Taddeo sul sagrato.
- **Anfiteatro Campano** (`h7-anfiteatro.js`): le stanze-giuramento, quattro nemici, il Giudice dell'Arena, Agnese
  sulle gradinate; il messaggio del padre all'Acquedotto.
- Elenchi per l'autore: `production/testi-da-approvare.md` (598 testi), `production/arte/richieste-gemini-terza-ondata.md`.

## Aperto dentro ciò che è fatto (decisioni dell'autore)
- Terza ondata: Gregorio con le prove evita lo scontro (la bibbia fa combattere comunque: interruttore
  `GREGORIO_H3.dialogoSenzaScontro`); costo dei ferri di Gaetano (passo −10% l'uno); effetti di Taddeo perdonato o
  accusato; premi delle zone nuove (oggi un oggetto forte a Casertavecchia, la Tessera del Gladiatore senza effetto
  all'Anfiteatro); l'ago (il terzo ferro, prima «la lima») resta solo a San Leucio; testo della lettera di Agnese e del messaggio del padre (nuovi);
  le rivelazioni del Campanaro e del Giudice non contano per «la svolta» delle memorie; mancano gli indizi su
  Gregorio ai piani 2-3 e le sue battute nel finale vero. Niente di tutto questo è stato giocato da una persona.
- Testi nuovi da approvare (battute del Burattinaio, trionfi e aneddoti, Don Gennaro, Acquedotto, consigli del conto).
- Bilancio: Raggio Cremisi coi moltiplicatori, tetto al danno, oggetti di vita per l'Ombra, oggetti di cadenza per
  Taddeo, premio della Buca, durata della notte (stima 14-16 minuti contro 25-35): `production/bilancio-teatro.md`.
- Immagini definitive per le parti nuove (oggi disegnate col codice): mani e forbici del Burattinaio, Acquedotto e
  suoi nemici, Camerini, Buca, botole, Ragno della Seta; figure da rigenerare: `production/arte/richieste-sprite-v2.md`.
- Piccole cose note: all'Acquedotto compaiono ancora gli arredi della Villa; col tocco non si può cancellare uno slot;
  il Registro di Scena è pesante sul telefono; nessuna partita giocata da una persona dopo la seconda ondata.

## Per arrivare in negozio
- Tutorial leggero della prima notte; inglese; sfida del giorno.
- Versione impacchettata per Steam e Steam Deck (salvataggi su file, obiettivi), poi app per i portatili Android.
- Prova con 10-20 giocatori e bilanciamento sui loro Registri delle notti.
- Voce del Burattinaio registrata e suoni campionati, quando ci sono un attore e i suoni.

## In fondo alla lista
- **Conversione per console portatili tipo R36S** (obiettivo confermato dall'autore). Quelle console non hanno un
  browser: serve un programma nativo, cioè riscrivere la parte di disegno su un motore che il loro sistema
  supporta. Il gioco ragiona a 640×360 e lo schermo è 640×480: entra in larghezza con due bande nere. I 60
  fotogrammi al secondo vanno misurati sulla console. Si fa a gioco finito e fermo; nel frattempo resta la
  «modalità leggera» nelle opzioni (pubblico, grana, vignettatura e ombre lunghe spegnibili).
