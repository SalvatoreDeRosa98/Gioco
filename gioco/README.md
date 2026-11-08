# gioco/ — Ferruccio: La Notte Immobile (motore web)

Pagina web statica: HTML, Canvas 2D, CSS, JavaScript a moduli ES, nessun build e nessuna
dipendenza. Architettura in `docs/architecture/architecture.md`; decisioni in ADR-0001/0002/0003.

## Avvio

Serve la cartella con un server statico (i moduli ES e `fetch` non funzionano da `file://`):

```sh
python3 -m http.server 8000 --directory gioco
# poi apri http://127.0.0.1:8000/
# vetrina di QA dei 14 modelli del piano 1 (storia 017): http://127.0.0.1:8000/qa/vetrina-stanze.html?grigi=1
#   (`?grigi=1` applica il filtro in scala di grigi, `?cella=N` cambia il lato in px di una cella; espone `window.__vetrina`)
```

Parametri dell'URL:

| Parametro | Effetto |
|---|---|
| `?debug=1` | espone `window.__gioco` e scrive il numero di tick sul canvas |
| `?seme=1845` | seme della notte (senza, deriva dall'orologio) |
| `?debug=1&p.combattimento.portata=90` | override di un parametro (solo con `debug=1`; fuori range → errore in console e valore riportato nel range) |
| `?debug=1&wire=1` | disegno DIAGNOSTICO in fil di ferro (`resa/debug.js`): pavimento 13×7, mura, Ferruccio, hitbox, fantocci; il ciclo entra subito in `notte` |
| `?debug=1&wire=1&fantoccio=attacca` | come sopra, con il fantoccio in basso che attacca a ciclo (anticipo 500 → lampo 150 → impatto a +252 ms) per provare la parata |
| `?debug=1&wire=1&nemico=gatto` | come `wire=1`, più un nemico VERO dell'archetipo dato (`gatto`, `vespa`, `statua`, `guardia`: storia 019) in alto a sinistra: emersione, pattuglia, inseguimento, telegrafo con hitbox del colpo, stordimento, dissoluzione; il gatto (storia 020) è disegnato come sagoma (ellisse bassa, orecchie, coda, occhi), con l'anello rosso che si chiude nel lampo e la striscia tratteggiata del balzo |
| `?debug=1&wire=1&scena=piazza-dante.tonino-primo-incontro` | storia 027 (strumento di QA): fa partire subito quella scena di `contenuti/storia.json` nel cartiglio dei dialoghi (`ui/cartiglio.js`) o, se `ancoraggi.json` la marca `tableau`, nel tableau (`ui/tableau.js`); il ciclo entra in `pausa` finché il dialogo è aperto; si avanza con `avanza`/`interagisci`/`conferma` o un click (antirimbalzo 160 ms), `indietro` salta una ripetizione; nel piano (`&piano=1`) nella stanza `banchetto` `interagisci` lontano dagli slot parla con Tonino (ancoraggio `banchetto`), mai con nemici vivi |
| `?debug=1&wire=1&hub=1&seme=1845` | storia 029: parte dall'hub di Piazza Dante (`mondo/hub.js`, modello `contenuti/modelli-stanza/hub/piazza-dante.json`), ciclo in `hub`: mura chiuse tranne l'ingresso al piano 1 (soglia d'oro a destra, etichetta `piano 1`), Tonino al banchetto (cerchio d'inchiostro con alone d'oro, pieno quando `interagisci` risponde), la porta della bottega di Gaetano nel muro in alto (pannello pieno = chiusa finché `fucina_aperta` è falso), la finestra accesa di Mariella (quadrato d'oro, mai un personaggio), la luna (disco crema in alto a sinistra) e i fili d'oro tratteggiati; Taddeo compare solo con `taddeo = perdonato`, Agnese sotto il portico solo con `agnese = risvegliata` (`__gioco.imposta`); alla notte 1 partono da sole risveglio, tutorial e targa; vicino a un NPC `interagisci` apre il suo ancoraggio `hub:<npc>` (nessuna pausa del ciclo); camminando nell'ingresso parte la notte: piano 1 generato con il seme derivato dal profilo e dalla notte (`hub.semeNotte()`, diverso da `?seme=`), ciclo in `notte`, `notte` dell'avanzamento invariata; cartellino DOM in basso a sinistra con la notte e i suggerimenti |
| `?debug=1&wire=1&hub=1&seme=1845&continua=1` | storia 030: se nello slot c'è una notte salvata, preme «Continua» da solo all'avvio (strumento di QA). Senza `continua=1`, nell'hub compare il pannello DOM «Continua / Lascia andare» (`interfaccia/ripresa.js`) quando una notte è salvata: «Continua» rigenera il piano dal seme salvato ed entra nella stanza salvata con maschere, doni e monete ripristinati; «Lascia andare» cancella la notte salvata. La notte si salva a ogni `notte.stanza` (`persistenza/notte-salvata.js`, chiave `ferruccio.v3.notte.1`) e si cancella alla morte. Alla morte (`ferruccio.morto`) il ciclo va in `pausa`, il velo DOM (`interfaccia/morte.js`) mostra le quattro fasi di `risveglio.json` (lanterne una a una, fili, maschera, buio; ≤ 5 s) e al `risveglio.fine` si torna nell'hub con `notte + 1`: flag, scintille, `piano_max` e scene viste restano; monete, doni, consumabili e pool della notte spariscono; con `&piano=N` (senza hub) la notte riparte dallo stesso seme |
| `?debug=1&wire=1&piano=1&seme=1845` | storie 014-017: genera il piano 1 dal seme (`mondo/generazione.js`, modelli di `contenuti/modelli-stanza/piazza-dante/`), parte dall'ingresso; porte con stato, ostacoli, soglie, segnalini e fantocci segnaposto (`archetipo`) delle ondate, transizione della camera (250 ms), pianta del piano nell'angolo in alto a destra; dalla storia 019 le ondate sono nemici veri per archetipo (`attori/nemico.js`), con direttore dei gettoni per piano; dalla storia 025 monete e cuori a terra (dischi/quadrati), HUD DOM in alto a destra e, nella stanza `banchetto`, i tre slot sui banchi con la lista dei prezzi (tasto `interagisci`); dalla storia 024, nella stanza `tesoro`, il piedistallo (quadrato d'oro, cono di luce tratteggiato `r_anteprima`, tratteggiato spento se inerte), il cartiglio del dono e l'HUD dei doni in DOM (sotto l'HUD dell'economia), le scintille dei ganci in oro; dalla storia 018 i bracieri (modelli `pd-n-04`, `pd-n-05`, `pd-d-02`) con piede pieno e cerchio tratteggiato solo in `anticipo` (largo) e `attivo` (fitto), etichetta con la fase; ogni pericolo di `__gioco.stanza.pericoli` espone `fase`, `progresso`, `sfasamento` |

`window.__gioco` (solo debug): `stato`, `tick(n)` (forza n tick, ritorna il contatore), `seme`,
`parametri` (`get`, `statistica`, `imposta`, `errori`, `tutti`), `eventi`, `input`, `ciclo`, `rng`,
`motoRidotto`, `imposta(flag, valore)` e `vaiA(stanza)` (ganci che rispondono `false` finché i
moduli dello stato narrativo e delle stanze non si registrano con `estendi(nome, fn)`); dalle storie
007-011 anche `modificatori`, `campo`, `ferruccio`, `combattimento`, `bersagli`, `proiettili`, `wire`,
`tieni(azione)` / `lascia(azione)` e `premi(azione, n)` (giù, n tick forzati, su). Per un percorso
deterministico: `__gioco.ciclo.ferma()` e poi solo `tick`/`premi`. Con `?piano=N` (storie 014-017)
anche `piano` (la pianta), `stanza` (la stanza corrente: `stato`, `porte`, `segnalini`, `puntoArrivo`),
`notte` (`salvataggio()` = {seme, piano, stanza}, `statoDi(id)`), `camera` e `vaiA(id_stanza)` vero.
Dalla storia 025 anche `economia` (`monete`, `scintille`, `aTerra()`, `aggiungiMonete(n)`, `togliMonete(n)`, `lascia(stanza, oggetto)`,
`stato()`), `banchetto` (`slots()`, `compra(i)`, `vicino()`, `attivo`), `profilo` (scintille persistenti) e `salvataggio`.
Dalla storia 024 anche `pool` (`eleggibili`, `probabilita`, `estrai`, `raccolti`, `offertiIn`), `piedistalli` (`elenco`, `vicino`, `anteprima`, `raccogli`, `attivo`),
`effettiDoni` (`scintilleAttive`, `maxScintille`), `cartiglio()` (stato del cartiglio DOM o null) e `flag` (oggetto scrivibile: i flag narrativi
letti dal pool finché lo stato narrativo non è composto in `avvio.js`; `imposta` continua a rispondere `false`).
Dalle storie 026-027 anche `narrativa` (lo stato narrativo: `flag()`, `avanzamento()`, `decidi`, `imposta`, `disponibili(ancoraggio)`,
`segnaVista`, `nuovaNotte`, …; `imposta(flag, valore)` di `__gioco` ora risponde davvero), `incontri` (`interagisci(ancoraggio, {porteChiuse})`,
`automatiche(ancoraggio)`, `mostra(id)` forzato, `abbandona()`, `ripetizione(npc)`, `nuoveMostrate(npc, luogo)`), `dialogo()` (il dialogo
corrente: `id`, `tipo`, `fase`, `cartigli`, `indice`, `scelta`, `esito`, `tableau`, `durataMs`, `avanza()`, `seleziona(i)`, `scegli(i)`, `salta()`),
`cartiglioScena()` e `tableau()` (stato del DOM o null).
Dalla storia 028 anche `ricordi` (`cade(idBoss, {x, y})`, `raccogli(id)`, `inMano()`, `aTerra(stanza?)`, `puoAprire(scena)`, `perdi(motivo)`,
`modello(id)`, `perBoss`, `perFlag`, `stato()`): il boss vero non esiste ancora (storia 022), il drop si prova con
`__gioco.eventi.emit('boss.sconfitto', { id: 'gatto', x, y })` (senza `x, y` cade su Ferruccio); il pool legge i flag dallo stato
narrativo più gli override di `__gioco.flag`.
Dalla storia 029 anche `hub` (con `&hub=1`: `presenze()`, `vicino()`, `semeNotte()`, `notte()`, `ingresso`, `cella`, `attivo`, `partito`, `entra()`, `esci()`),
`cartellinoHub()` (stato del DOM o null) e `notte` come getter (null finché la notte non parte).
Dalla storia 030 anche `risveglio` (`attivo`, `fase`, `indice`, `progresso()`, `progressoFase()`, `lanterneSpente()`, `durataMs()`, `morti`, `stato()`),
`notteSalvata` (`presente`, `fotografa()`, `salva()`, `carica()`, `cancella(motivo)`, `riprendi({avvia})`), `ripresa` (`continua()`, `lascia()`, `stato()`
del pannello DOM) e `veloMorte()` (stato del velo DOM o null); `ferruccio.risveglia()` ed `economia.nuovaNotte()`.
Dalla storia 019 anche `direttore` (gettoni: `occupati`, `statistiche`, `impattiProgrammati()`) e
`creaNemico({archetipo, x, y, id})` (crea un nemico vero e lo aggiunge ai bersagli); ogni nemico espone
`stato`, `scheda`, `hitbox()`, `direzione`, `gettone`, `dissoluzione`, `puntini`, `forzaStato(stato)`; dalla
storia 020 anche `progresso` (0→1 nella fase), `anello` (chiusura dell'anello del lampo), `portataColpo`,
`hitTicks`, `istanteImpatto` (tick dall'inizio del lampo), `segnoATerra()`, `versoOrbita` e, per il gatto, `posa()`.

## Test

```sh
node gioco/qa/fondazione.test.mjs   # unitari, senza browser (node:test)
node gioco/qa/pagina.test.js        # Playwright: avvia un server su porta libera, apre la pagina,
                                    # salva production/qa/evidence/fondazione-pagina.png
node gioco/qa/combattimento.test.mjs      # unitari delle storie 007-011: ciclo simulato a tick fissi,
                                          # un caso per criterio Given-When-Then + prestazioni (20 bersagli)
node gioco/qa/combattimento.wire.test.js  # Playwright: ?debug=1&wire=1, cammina/colpisce/scatta/para,
                                          # salva production/qa/evidence/combattimento-wire.png
node gioco/qa/mondo.test.mjs              # unitari delle storie 014-018: porte, spawn (200 semi), colonna/panca,
                                          # stanza pulita, generazione (determinismo, 200 semi, riserva), camera;
                                          # 018: bracieri (ciclo riposo/anticipo/attivo a seme, danno solo in attivo,
                                          # spinta, scatto, morte) e ricompensa pre-estratta a terra con l'economia
                                          # reale (`drop`), nessuna ricompensa al rientro
node gioco/qa/mondo.wire.test.js          # Playwright: ?debug=1&wire=1&piano=1&seme=1845, attraversa una porta,
                                          # pulisce una stanza; salva mondo-wire.png e mondo-pianta.png
node gioco/qa/vetrina.test.js             # Playwright della storia 017: qa/vetrina-stanze.html?grigi=1, i 14 modelli del piano 1 in
                                          # fil di ferro (conteggi 6/2/1/1/1/1/1/1, tag di difficoltà, zero errori), filtro in scala di
                                          # grigi attivo, centro di ogni ostacolo e pericolo scuro e pavimento chiaro (luminanza dal canvas);
                                          # salva vetrina-stanze-grigi.png e, tolto il filtro dalla casella, vetrina-stanze.png
node gioco/qa/nemici.test.mjs             # unitari delle storie 019 e 020: formule F1-F3 sui dati, R2/R4, fermo a contatto,
                                          # separazione, telegrafo (tempi ed eventi), parata/stordimento (anche boss),
                                          # morte/dissoluzione/bottino, transizioni, direttore, factory nella stanza, prestazioni;
                                          # gatto: posa, anello 150 ms, d_balzo, hitbox dal 45% (impatto costante), anello
                                          # d'attesa, tetto di 2 attaccanti, bot QA a 120 ms su 30 stanze (stampa una riga `# bot:`)
node gioco/qa/economia.test.mjs           # unitari della storia 025: economia.json, formula del prezzo (tabella 1-5, sconto),
                                          # monete_boss/scintille_boss/p_cuore/residuo/costo_sblocco, drop su 10 000 stanze (4,80 ± 0,10),
                                          # pool del banchetto, raccolta passandoci sopra e tetto 99, bonus di stanza e cuore, tre slot
                                          # con acquisto/rifiuto/consumabili/rientro, morte (monete perse, scintille nel profilo in RAM),
                                          # boss (scintille subito, monete a terra), prestazioni, nessun Math.random e nessun numero
node gioco/qa/doni.test.mjs               # unitari delle storie 023-024: ordine e clamp, imposta, ganci (probabilità seminata, ricarica,
                                          # tetto per stanza, profondità 1, budget), sinergie, bonus temporanei; pool: 12 MVP, sagome,
                                          # probabilità 10/7,5/12 % e 11 %, 1000 estrazioni senza il raccolto, escludi_se_flag/richiede_flag
node gioco/qa/doni.integrazione.test.mjs  # integrazione della storia 024 (DOM finto): piedistallo e interagisci (33 ms), cartiglio 3000 ms senza
                                          # pausa, HUD, doppio dal piano 3, sostituto, banchetto sul pool, ganci collegati, scintilla/catena/onda/cura
node gioco/qa/doni.wire.test.js           # Playwright: ?debug=1&wire=1&piano=1&seme=1845, va nella bottega, anteprima, raccoglie, cartiglio e HUD
                                          # nel DOM, rientro, scintilla da un fendente; salva production/qa/evidence/doni-piedistallo.png
node gioco/qa/parametri.test.js           # coerenza catalogo dei doni ↔ parametri ↔ libreria degli effetti (20 doni, 12 MVP, forme uniche)
node gioco/qa/condizioni.test.mjs         # unitari della storia 026: condizioni, stato narrativo, decisioni, salvataggio del profilo
node gioco/qa/incontri.test.mjs           # unitari della storia 027: spezzatura a 120 (140 → due cartigli identici concatenati), ancoraggi di tutto
                                          # piazza-dante, ripetizioni di Tonino per ogni stato, notte 1 hub Tonino → primo incontro poi ripetizione,
                                          # tipi senza attesa, porte chiuse → niente, tableau di Gaetano ≥ 3 s (3180 ms), scelta → decisione → esito,
                                          # abbandono a metà → non vista, cartiglio e tableau in DOM finto (antirimbalzo, nessun avanzamento
                                          # automatico, didascalia senza nome), regole del codice; storia 029 (H01-H05, R02): modello dell'hub valido,
                                          # presenze (Tonino, bottega chiusa/aperta, Mariella finestra, luna, fili), Taddeo/Agnese per stato, entrata
                                          # notte 1 → automatiche, ingresso → hub.partenza una volta con seme derivato e `notte` invariata, Tonino
                                          # vicino → primo incontro e Ferruccio fermo, cartellino DOM finto
node gioco/qa/cartiglio.wire.test.js      # Playwright: ?debug=1&wire=1&scena=…, cartiglio (small-caps, corsivo, pausa), scelta con esito, tableau;
                                          # nel piano 1 Tonino al banchetto a porte aperte/chiuse; salva cartiglio.png, cartiglio-scelta.png, tableau.png
node gioco/qa/ricordi.test.mjs            # integrazione della storia 028 (DOM finto): ricordi.json ↔ doni.json ↔ storia.json, caduta del
                                          # Medaglione a `boss.sconfitto` (gatto), raccolta camminando (+1 danno, goccia azzurra), scelta solo
                                          # con il ricordo in mano (due opzioni, nessuna selezionata, porte chiuse → niente), restituito
                                          # (dono tolto, 12 scintille, profilo, esito), negato (bonus fino a fine notte, esito), morte → perso e
                                          # nuovo drop, flag deciso → nessun drop, regole del codice
node gioco/qa/ricordi.wire.test.js        # Playwright: ?debug=1&wire=1&piano=1&seme=1845, boss.sconfitto dal bus, raccolta, HUD, scelta al
                                          # banchetto, restituito, morte; salva ricordi-medaglione.png e ricordi-scelta.png
node gioco/qa/notte.test.mjs              # storia 030 (node:test, notte finta): sequenza di morte in quattro fasi (lanterne una a una, ≤ 5 s),
                                          # risveglio → notte + 1 e Ferruccio in piedi; flag/scintille/piano_max/scene viste restano, monete/doni/
                                          # consumabili spariscono; risveglio.json; salvataggio a ogni `notte.stanza` e cancellazione alla morte;
                                          # «Continua» con due «pagine» sulla stessa memoria; scena a metà non vista; busta del profilo condivisa;
                                          # velo e pannello in DOM finto; regole del codice
node gioco/qa/notte.wire.test.js          # Playwright della storia 030: ?debug=1&wire=1&hub=1&seme=1845, partenza, cambio di stanza, RELOAD della
                                          # pagina, pannello «Continua» (click DOM), piano rigenerato uguale, morte → velo → hub notte 2;
                                          # salva notte-ripresa.png, notte-morte.png, notte-risveglio.png
node gioco/qa/hub.wire.test.js            # Playwright della storia 029: ?debug=1&wire=1&hub=1&seme=1845, targa automatica, presenze base e con
                                          # taddeo/agnese, Tonino, partenza nella notte con seme derivato; salva hub-wire.png e hub-presenze.png
node gioco/qa/seme.js 200 [--piano P] [--stampa K]   # genera N piani e riporta violatori e distribuzione dei tipi
```

Entrambi escono con codice 1 se un caso fallisce. Il test di pagina usa il Chromium di Playwright
preinstallato; non eseguire `playwright install`.

## Struttura

```
gioco/
├── index.html                  pagina completa: <canvas id="scena"> 1280×720 logici + <div id="interfaccia">
├── stile/
│   ├── token.css               palette dell'art bible come variabili CSS (unico posto con i colori)
│   └── base.css                palco 16:9 senza scroll, canvas e interfaccia sovrapposti
├── motore/
│   ├── avvio.js                radice di composizione: carica i parametri, collega input e ciclo,
│   │                           compone campo + Ferruccio + combattimento + fantocci, renderer
│   │                           SEGNAPOSTO (sostituito dalla storia 005) o debug wire, window.__gioco
│   ├── fondazione/
│   │   ├── tempo.js            passo fisso 16,667 ms, accumulatore, max 5 tick/frame, alpha, ticksDaMs
│   │   ├── ciclo.js            avvia/ferma, sistemi {tick(dt), disegna(alpha)}, stati menu|hub|notte|pausa
│   │   ├── input.js            tastiera, mouse (coordinate di scena), gamepad (zona morta);
│   │   │                       premuto/tenuto/rilasciato per azione, direzione() normalizzata
│   │   ├── rng.js              mulberry32: creaRng(seme), derivato(rng, etichetta), intero, scegli, mescola
│   │   ├── eventi.js           bus sincrono on/off/emit con errori isolati
│   │   └── parametri.js        JSON {base,min,max}, validazione, override da file e da URL (debug)
│   ├── oggetti/
│   │   ├── modificatori.js     ADR-0002 minimo: valore(nome) = clamp((base+Σsomme)×Πmolt); applica()
│   │   │                       (la storia 023 aggiunge doni, flag e ganci)
│   │   ├── economia.js         storia 025: formule pure (prezzo intero, boss, p_cuore, residuo, costo_sblocco, drop) e
│   │   │                       stato della notte (monete con tetto, oggetti a terra per stanza, raccolta, consumabili, morte)
│   │   ├── banchetto.js        storia 025: tre slot dal generatore 'banchetto', compra(i) atomico, interagisci, puntiSlot
│   │   │                       (storia 024: con `pool` lo slot dono esce dal pool della notte, canale 'banchetto')
│   │   ├── catalogo.js         storia 023: validatore del catalogo e delle sinergie
│   │   ├── effetti.js          storia 023: libreria degli effetti dei ganci (emette doni.* sul bus)
│   │   ├── pool.js             storia 024: pool dei doni della notte: eleggibilità (mvp, piano, canale, sblocco, flag fotografati,
│   │   │                       raccolti, offerti nel piano), estrazione a due stadi W_r(p), probabilita(), fallback
│   │   ├── piedistallo.js      storia 024: piedistalli della bottega (1; 2 dal piano 3), interagisci entro r_interagisci,
│   │   │                       anteprima entro r_anteprima, preso/inerte, stato per stanza, puntiPiedistallo
│   │   └── ricordi.js          storia 028: ricordi (dono azzurro + persona, flag, scena_scelta, bonus_tenuto, effetto_ceduto):
│   │                           caduta a `boss.sconfitto`, raccolta a terra, `puoAprire` per la scelta, cessione/tenuta alla
│   │                           decisione, perdita a morte e fine notte
│   ├── storia/
│   │   ├── condizioni.js       storia 026: schema dei flag e valutazione delle condizioni (`quando`, `se`, derivati)
│   │   ├── stato-narrativo.js  storia 026: flag, avanzamento, disponibilità delle scene per ancoraggio, decisioni, profilo
│   │   ├── risveglio.js        storia 030: morte → risveglio: fasi da risveglio.json a `ferruccio.morto`, poi notte + 1, doni/pool/economia
│   │   │                       azzerati, Ferruccio in piedi; eventi morte.avvio/morte.fase/risveglio.fine
│   │   └── incontri.js         storia 027: scena o ripetizione per ancoraggio (una nuova per NPC per notte e luogo), cartigli
│   │                           spezzati a max_caratteri_battuta, scelta → decidi → esito, tableau con durata, scene automatiche
│   ├── ui/
│   │   ├── cartiglio.js        storia 027: cartiglio dei dialoghi in DOM (parlante in maiuscoletto, didascalie in corsivo, una
│   │   │                       battuta alla volta, antirimbalzo, opzioni della scelta, click/tap)
│   │   └── tableau.js          storia 027: velo del tableau in DOM con una sola voce, chiusura a durata o dopo t_min
│   ├── persistenza/
│   │   ├── salvataggio.js      storia 026: profilo e notte in localStorage, buste versionate, memoriaInRam per i test
│   │   ├── migrazioni.js       storia 026: versione del formato e migrazioni
│   │   ├── profilo.js          storia 025: scintille, sblocchi e ricordi restituiti sul salvataggio (accredito immediato)
│   │   └── notte-salvata.js    storia 030: la notte in corso {seme, piano, stanza, notte, maschere, doni, monete} salvata a ogni
│   │                           notte.stanza, cancellata alla morte, ripresa con `riprendi({avvia})`
│   ├── interfaccia/
│   │   ├── banchetto.js        storia 025: HUD e lista DOM minimale del banchetto (testi da contenuti/interfaccia.json)
│   │   └── doni.js             storia 024: HUD dei doni raccolti e cartiglio del dono (nome, riga, avviso, anteprima) in DOM
│   │   ├── hub.js              storia 029: cartellino DOM dell'hub (notte, suggerimento per parlare/partire)
│   │   ├── morte.js            storia 030: velo DOM della sequenza di morte (dissolvenza, lanterne, fili, maschera, didascalie)
│   │   └── ripresa.js          storia 030: pannello DOM «Continua / Lascia andare» della notte salvata (nell'hub)
│   ├── mondo/
│   │   ├── fisica.js           campo a griglia con mura/ostacoli, cerchio contro rettangoli con
│   │   │                       scivolamento, settore e rettangolo spazzato contro cerchi, linea di
│   │   │                       colpo, separazione dei cerchi (funzioni pure)
│   │   ├── modelli.js          legenda dei modelli di stanza, slot delle porte, vestibolo, validatore
│   │   │                       (regola 25), catalogo e caricatore (storie 014, 017)
│   │   ├── porte.js            porta: aperta/chiudendo/chiusa/aprendo, solido dinamico, attesa se occupata
│   │   ├── stanza.js           monta un modello nel campo condiviso; formule n_nemici/ondate/ricompensa;
│   │   │                       segnalini, anello di sicurezza, stati della stanza, eventi (storia 014);
│   │   │                       bracieri a ciclo con danno a Ferruccio, `stanza.pericolo`, ricompensa con
│   │   │                       dispersione e `puntoSicuro` (storia 018)
│   │   ├── generazione.js      generaPiano puro dal seme: cammino, anelli, rami, foglie, doppie, modelli
│   │   │                       pesati, segreta, ricompense, H1-H10, Q, tentativi, riserva (storia 016)
│   │   ├── camera.js           scala min(1, L/larg, (A−hud)/alt), transizione 250 ms, inTransizione (015)
│   │   └── notte.js            piano + stanza corrente + passaggi; input ignorato in transizione; vaiA;
│   │                           salvataggio() = {seme, piano, stanza}
│   │   └── hub.js              storia 029: l'hub come stanza speciale: campo dal modello hub/, presenze risolte sullo stato
│   │                           narrativo (quando/aperta_se), interagisci sugli NPC, ingresso → hub.partenza con seme derivato
│   ├── attori/
│   │   ├── ferruccio.js        corpo: Fermo/Cammina/Scatta/Recupero scatto/Colpito/Morto, cariche,
│   │   │                       maschere, invulnerabilità, spinta (storie 007-008)
│   │   ├── combattimento.js    spada: Pronto/Fendente 1-3/Carica/Affondo/Parata/Controcolpo, buffer,
│   │   │                       combo, cancellazioni, danno decimale, ricevi(attacco) (storie 009-011)
│   │   ├── bersaglio.js        contratto minimo dei bersagli, nemico FANTOCCIO con telegrafo in tre
│   │   │                       tempi (resta per i test del combattimento) e proiettile minimo
│   │   ├── nemico.js           fabbrica generica dei nemici per archetipo (nemici.json): scheda scalata per
│   │   │                       piano (F1-F3), corpo, separazione (§8.5), contratto del combattimento, hitbox
│   │   │                       del Colpo via comeBersaglio, morte → anima (dissoluzione) e bottino (storia 019);
│   │   │                       hitbox da hit_dal, segno a terra, gancio posa (storia 020)
│   │   ├── effetti-doni.js     storia 024: collegaGanci (eventi ferruccio.*/stanza.* → ganci) e collegaEffettiDoni
│   │   │                       (doni.scintilla/catena/onda/cura/ricarica_scatto eseguiti su bersagli, proiettili, Ferruccio)
│   │   ├── gatto.js            gatto d'ombra (storia 020): posaGatto pura dai fattori nemici.archetipi.gatto.posa
│   │   │                       (accucciato, lampo, balzo, stordito) e creaGatto = fabbrica generica + posa
│   │   └── ia/
│   │       ├── base.js         macchina a stati: emersione, pattuglia, insegue (fermo a contatto, d_attesa,
│   │       │                   anello d'attesa omega_attesa), anticipo → lampo (telegrafo.lampo, anello →
│   │       │                   telegrafo.anello) → colpo (portata dinamica, hitbox da hit_dal) → recupero, stordito, morto
│   │       └── direttore.js    gettoni di attacco per piano, gap tra impatti, imparabili contemporanei,
│   │                           tetto attaccanti_max (storia 020)
│   └── resa/
│       └── debug.js            disegno diagnostico in fil di ferro, solo con ?debug=1&wire=1
├── contenuti/parametri/
│   ├── ferruccio.json          statistiche del corpo (GDD controllo-ferruccio.md)
│   ├── combattimento.json      statistiche nominate del combattimento (GDD combattimento.md) + fantoccio + scintilla (storia 024)
│   ├── doni.json               catalogo dei 20 doni, registro delle statistiche, ganci, effetti, tag, limiti, piedistallo (storia 024:
│   │                           piano_doppio, r_anteprima, t_cartiglio, lato_icona_hud, avviso_cap)
│   ├── sinergie.json           le sei sinergie dichiarative
│   ├── stanza.json             griglia della stanza standard (13×7 celle da 64 px)
│   ├── stanze.json             regole della stanza (GDD stanze-porte: porte, spawn, ondate, ricompense, camera)
│   ├── generazione.json        parametri del generatore per piano (GDD generazione-piani)
│   ├── nemici.json             globali, scalatura, direttore, drop e schede dei 4 archetipi MVP (GDD nemici.md)
│   ├── economia.json           economia (GDD economia.md): drop, tetti, prezzi, p_cuore, scintille, Fucina, pesi del banchetto
│   ├── consumabili.json        tabella dei consumabili del banchetto (Olio da fabbro, Pezzuola di lino)
│   ├── incontri.json           storia 027: max_nuove_per_notte, max_caratteri_battuta, tableau.{t_min,t_base,ms_per_carattere},
│   │                           antirimbalzo, r_interazione (GDD incontri-dialoghi.md)
│   ├── ricordi.json            storia 028 (tabella): per ricordo persona, flag, scena_scelta, boss, archetipo_boss, valore_restituzione,
│   │                           effetto_ceduto.scintille; r_raccolta (GDD ricordi-scelta.md)
│   ├── risveglio.json          storia 030: durate delle quattro fasi della sequenza di morte (somma dei massimi = t_max 5000), lanterne
│   ├── input.json              mappa dei tasti per le 12 azioni del contratto
│   └── moto-ridotto.json       sovrascritture applicate con prefers-reduced-motion
├── contenuti/interfaccia.json  testi di HUD, banchetto, doni, cartiglio e hub (unico posto con le stringhe mostrate; storie 024-025, 027 `incontri`, 029 `hub`)
├── contenuti/storia.json       la storia in forma macchina (copia di trama/storia.json; storia 026)
├── contenuti/narrativa.json    regole dello stato narrativo che storia.json non ha (derivati, finale → mondo, tipi obbligatori e senza attesa)
├── contenuti/ancoraggi.json    storia 027: ancoraggio (e `tableau`) per scena: tutto piazza-dante + il ricordo di Gaetano
├── contenuti/ripetizioni.json  storia 027: battute di ripetizione di Tonino per ogni stato di tonino_ricordo (canon Provisional)
├── contenuti/modelli-stanza/piazza-dante/   14 modelli JSON del piano 1 + indice.json (storia 017)
├── contenuti/modelli-stanza/hub/piazza-dante.json   storia 029: modello dell'hub (griglia, arrivo, ingresso, presenze con quando/aperta_se, automatiche)
├── contenuti/piani/piazza-dante-riserva.json piano di riserva disegnato a mano (esempio del GDD, Q = 100)
└── qa/
    ├── mondo.test.mjs / mondo.wire.test.js / seme.js   storie 014-017
    ├── vetrina-stanze.html          storia 017: vetrina di QA dei 14 modelli del piano 1 in fil di ferro (griglia, filtro grigi)
    ├── vetrina.test.js              test Playwright della vetrina (sagome nere, conteggi, screenshot in scala di grigi)
    ├── fondazione.test.mjs          test unitari della fondazione
    ├── pagina.test.js               test Playwright della pagina
    ├── combattimento.test.mjs       test unitari delle storie 007-011
    ├── nemici.test.mjs              test unitari della storia 019
    ├── economia.test.mjs            test unitari della storia 025
    ├── doni.test.mjs                test unitari delle storie 023-024 (modificatori, ganci, sinergie, pool)
    ├── doni.integrazione.test.mjs   integrazione della storia 024 (piedistallo, cartiglio, ganci, effetti; DOM finto)
    ├── doni.wire.test.js            test Playwright della storia 024 (bottega, raccolta, DOM, screenshot)
    ├── parametri.test.js            coerenza catalogo ↔ parametri ↔ effetti
    ├── condizioni.test.mjs          test unitari della storia 026
    ├── incontri.test.mjs            test unitari della storia 027 (incontri, cartiglio e tableau in DOM finto)
    ├── cartiglio.wire.test.js       test Playwright della storia 027 (cartiglio, scelta, tableau, Tonino al banchetto)
    ├── ricordi.test.mjs             test d'integrazione della storia 028 (Medaglione di Rosa; DOM finto)
    ├── ricordi.wire.test.js         test Playwright della storia 028 (drop dal bus, HUD, scelta, restituito, morte)
    ├── hub.wire.test.js             test Playwright della storia 029 (hub, presenze, Tonino, partenza)
    ├── notte.test.mjs               test della storia 030 (morte → risveglio, notte salvata, «Continua», scena a metà)
    ├── notte.wire.test.js           test Playwright della storia 030 (reload, «Continua», morte → hub notte 2)
    └── combattimento.wire.test.js   test Playwright del modo wire
```

## Regole del codice

- Nessun numero di gioco nel motore: tutto in `contenuti/parametri/*.json` come `{base, min, max}`.
  `min`/`max` sono il clamp del valore **effettivo** dopo i doni (ADR-0002); dove il GDD dà un
  intervallo di uscita (es. `v_base` 150–330) si usa quello, altrimenti il Safe Range dei Tuning Knobs.
- Nessun generatore casuale nativo nel motore: solo `rng.js` (il test lo verifica con un grep).
- Nessuna stringa di gioco nel motore.
- Dipendenze solo verso il basso; verso l'alto si usano gli eventi.
- `tick(dt)` riceve `dt` in secondi (un passo fisso); i tempi dei GDD in ms si convertono una volta
  con `tempo.ticksDaMs`.
- L'input è il primo sistema registrato nel ciclo: `inizioTick()` fotografa i fronti prima degli altri.

## Valori provvisori da confermare con il game-designer

- `combattimento.larg_affondo` (32 px) e `combattimento.t_spinta_nemico` (150 ms): citati dal GDD
  senza numero.
- I `min`/`max` delle voci di feel (hit-stop, scossa, scie) e di `inclinazione_scatto_gradi`,
  `lampeggio_hz`, `mod_input_spinta`, `peso_inamovibile`: il GDD dà solo il valore corrente.
- Aggiunte dalle storie 007-011 (segnalate, da confermare): `combattimento.t_startup_affondo` (60),
  `t_recupero_affondo` (260), `lama_affondo` (46) dal prototipo; `t_buffer_parata` (0, manopola
  della storia 011); `v_riflesso` (380, da nemici.md); il gruppo `combattimento.fantoccio.*` (telegrafo
  del manichino: 500/150/252/200/700/1500, vita 6, r 16, peso 1); `stanza.json` (13×7×64).
- `armatura` esiste sia in `ferruccio.json` (0-1) sia in `combattimento.json` (0-2): la formula
  `danno_subito` legge `ferruccio.armatura`; va unificata con il game-designer (storia 023).
- Storia 019, `nemici.json`: `globali.r_pattuglia` (96), `punti_pattuglia_*` (2-3), `tolleranza_attesa`
  (20), `k_separazione` (0,5), `d_separazione_volanti` (44, §8.5) e `statua.r_lose` (2000: la statua non
  perde mai il bersaglio) non hanno un numero nel GDD; `d_attesa` è l'anello d'attesa (170) o la quota
  della vespa (230) usati come «distanza tenuta» dall'IA base (l'orbita vera è della storia 020);
  l'allarme di stanza (4000 ms) è contato dalla fine dell'emersione, non dalla chiusura delle porte.
- Storia 020, `nemici.json` (gatto): `hit_dal` 0,45, `balzo_extra` 24, `balzo_min` 100 e `t_anello` 150 vengono dal
  REPORT del prototipo e dal GDD 4.1; `omega_attesa` 45°/s dal GDD; `attaccanti_max` 2 (manopola, prototipo); il gruppo
  `posa.*` (area 0,75, altezza 0,7, posteriore su 12°, scala X 1,25, stordito 12°) dalla tabella dei pezzi. Da rivedere col
  game-designer: con `hit_dal` 0,45 l'impatto cade a t_lamp + 0,45·t_imp ≈ 400 ms dal lampo e la finestra di pressione
  valida (F4) diventa 190-370 ms, non 100-280 come nel GDD; `d_max` 230 > `portata` 170 + r_corpo: i balzi da oltre 186 px
  vanno a vuoto; «si accorcia» nell'anticipo non sta con area −25% e altezza 0,7 (lunghezza 1,07); il criterio
  «stanza 3-7 s» del bot viene dal prototipo a vita 3 (con vita 6 e 2 gatti: media 6,6 s, singole 3,8-12,2).
- Storia 025, `economia.json`: il drop dei nemici segue economia.md (p 0,40; 1 o 5) e ignora le `monete` del payload calcolate con
  F9 di nemici.md (`ceil(costo/2)+extra`): due GDD, due regole, da riconciliare; `lancio_bonus_stanza` (20 px), `r_interagisci` (56,
  dal GDD regola 5), `deriva_rarita_pct` (−10/+10/+30, da doni-modificatori.md W_r(p)) e `bilancio.*` (n_nem, N_comb, ρ: solo per
  le formule di reddito nei test) non hanno un numero proprio nel GDD economia; i pesi del pool sono provvisoriamente qui finché la
  storia 024 non porta il pool vero (la storia 024 li legge da qui e li inietta nel pool: restano in `economia.json`).
- Storia 024: `combattimento.scintilla.{velocita 420, r 5, gittata 260}` (il GDD non dà numeri per il proiettile della scintilla);
  `su_affondo` è emesso al primo `ferruccio.colpo` mentre il combattimento è in `affondo` (nessun colpo, nessun evento); la scintilla
  esclude il bersaglio da cui parte (altrimenti lo colpirebbe subito); `su_raccolta` scatta anche per il dono appena raccolto; le sagome
  dell'HUD sono il nome della forma come testo (grafica da approvare); i flag letti dal pool vengono da `__gioco.flag` finché lo stato
  narrativo non è composto in `avvio.js`; lo stato dei piedistalli non è serializzato (storia 032).
- Storia 018, `stanze.json`: `r_dispersione_ricompensa` (48 px, regola 24 del GDD stanze). Alla chiusura si sommano il
  `bonus_stanza` di economia.md e gli oggetti pre-estratti di stanze-porte.md (da riconciliare); la scintilla della ricompensa
  va subito al profilo (non esiste a terra); i flag `hazard_*` del GDD sono comportamenti fissi (il validatore non ammette
  booleani); la dispersione usa il generatore `drop` dell'economia, non `rng_ric` della stanza.
- Storia 027, `incontri.json`: i valori sono quelli dei Tuning Knobs del GDD; `tableau.ms_per_carattere` (60) è 0,06 s/carattere. La voce
  di Gaetano ha 28 caratteri (il GDD ne conta 27): durata 3180 ms, non 3100. Decisioni di contenuto in `ancoraggi.json` (Provisional):
  risveglio, tutorial e targa partono da sole a `ingresso-piano:1`; scelta ed esiti di Tonino al `banchetto`; la filastrocca è un tableau.
  Le scene senza battute (bottega-di-gaetano, tutorial, risveglio, boss) a un ancoraggio interattivo sono saltate con errore di contenuto,
  a uno automatico sono segnate viste. La pausa logica è lo stato `pausa` del ciclo (solo da `notte`: nell'hub, storia 029, non serve).
  Dalla storia 028 il pool legge i flag dallo stato narrativo (con `__gioco.flag` come override di debug) e i ricordi restituiti dal profilo.
- Storia 028, `ricordi.json`: `effetto_ceduto.scintille` (12, 8-20) dal GDD; `r_raccolta` (24 px, come la moneta) non ha un numero nel GDD;
  il bonus tenuto è il `+1 danno` (somma) del catalogo, non il «+8 %» dell'esempio del GDD (da riconciliare con il game-designer); lo sconto
  del 30 % al banchetto per la notte citato dai Tuning Knobs NON è implementato (effetto_ceduto = solo scintille). La scelta di un ricordo si
  apre solo con il ricordo in mano (`puoAprire`); senza, Tonino ripete. Il «dono d'oro dal pool» quando il flag è deciso spetta al boss
  (storia 022): qui esce solo `ricordi.nessuno {motivo: 'deciso'}`. Il ricordo tenuto sparisce a `economia.fine_notte` (anche dopo la
  morte: l'economia ascolta `ferruccio.morto` prima, quindi il motivo di `ricordi.perso` può essere `fine_notte`).
- Storia 029, hub (nessun parametro nuovo: geometria dal modello, raggio da `incontri.r_interazione`). Decisioni provvisorie da confermare
  con narrative-director e autore: il modello `hub/piazza-dante.json` fa partire da solo `ingresso-piano:1` entrando nell'hub alla notte 1
  (la Piazza è l'hub E il piano 1 della notte 1: così risveglio, tutorial e targa si vedono prima di parlare con Tonino); Taddeo e Agnese
  hanno gli ancoraggi `hub:taddeo` e `hub:agnese` ma nessuna scena né battuta di ripetizione in `ripetizioni.json` (parlarci dà la
  didascalia generica con errore di contenuto: testi del writer); la bottega resta chiusa nell'MVP (`fucina_aperta`); il seme della notte è
  `derivato(creaRng(seme del profilo), 'notte#N')` con N la notte dell'avanzamento (cambia solo quando `notte` cresce, storia 030); nell'hub
  il banchetto di Tonino è solo dialogo (la vendita resta nei piani, storia 025) e non c'è pausa logica (Ferruccio sta fermo a dialogo aperto).
- Storia 030, `risveglio.json`: le durate delle fasi (1200/600/1200/400 ms, somma dei massimi 5000 = `t_max`) e `lanterne` (3) sono provvisorie:
  l'art bible dice solo «breve» e il GDD dà il tetto di 5 s. Decisioni da confermare: durante la sequenza il ciclo sta in `pausa` (nemici e
  timer fermi); la notte si salva SOLO al cambio di stanza (ADR-0006), quindi doni, maschere e monete cambiati dentro una stanza non ancora
  lasciata si perdono alla chiusura (coerente con i piedistalli non serializzati: storia 032); lo stato delle stanze visitate non è salvato
  (alla ripresa le stanze ripartono non visitate, la stanza corrente si rientra al centro); «Lascia andare» cancella la notte senza contare una
  morte (`notte` non cresce); la busta del profilo è una sola e `stato-narrativo.js` e `profilo.js` ora la scrivono unendo i campi (prima si
  sovrascrivevano a vicenda: flag persi o scintille perse alla riapertura); il velo di morte è una dissolvenza DOM segnaposto (la sequenza
  vera, art bible §2, aspetta il renderer); l'economia e il pool restano al piano 1 anche dopo il risveglio (unico piano dell'MVP).
- Rampa di accelerazione: `v_eff / t_accel` lineare (regola 2). Con 60 ms la diagonale di 1 s da
  fermo dà 215,1 px: dentro i 220 ± 5 del criterio per 0,1 px. Se `t_accel` sale, il criterio salta.
