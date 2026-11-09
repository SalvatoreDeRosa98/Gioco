# gioco/ — Ferruccio: La Notte Immobile (motore web)

Pagina web statica: HTML, Canvas 2D, CSS, JavaScript a moduli ES, nessun build e nessuna
dipendenza. Architettura in `docs/architecture/architecture.md`; decisioni in ADR-0001/0002/0003.

## Due programmi

In questa cartella convivono **due programmi** con ruoli distinti (decisione dell'autore, 2026-11-08):

- **`gioco/teatro_marionette.html`** è il **prototipo dell'autore**, scritto da lui in un unico file (5423 righe: tabelle ~2349-2535,
  stato della run e statistiche ~2601-2745, input ~2853, generazione ~3101-3424, attacco ~3525-3680, nemici in `loop()` ~4248-5052,
  HUD ~5056, disegni ~268-2349 e 3881-4244). È la **fonte delle regole e dei numeri**: nel dubbio su una regola vince il Teatro.
  **Non si modifica.** Il file `teatro_marionette.html` alla radice del repository è una **copia identica** (verificata con `cmp`)
  e nemmeno quello si tocca.
- **`gioco/motore/`** (con `index.html`, `prova.html`, `contenuti/`, `stile/`, `qa/`) è la **versione modulare di produzione**: moduli
  ES, nessun build, rng seminato, numeri nei JSON di `contenuti/parametri/`, stringhe in `contenuti/interfaccia.json`. Nel dubbio su
  dove mettere una cosa vince la sua architettura (`docs/architecture/architecture.md`, ADR-0001..0006). Conserva ciò che il Teatro
  non ha: hub di Piazza Dante, dialoghi con cartiglio, stato narrativo e flag, Medaglione, notte salvata, profilo. Il porting del
  Teatro è raccontato nelle storie `production/epics/*/story-P*.md`; ciò che manca ancora (palette nei token) è in `PASSAGGIO-CONSEGNE.md`; l'HUD
  del Teatro con le mezze maschere è la storia P13 (`interfaccia/hud.js`).

## Avvio

Serve la cartella con un server statico (i moduli ES e `fetch` non funzionano da `file://`):

```sh
python3 -m http.server 8000 --directory gioco
# poi apri http://127.0.0.1:8000/
# vetrina di QA dei 21 modelli dei piani 1-4 (storia 017, Teatro): http://127.0.0.1:8000/qa/vetrina-stanze.html?grigi=1
#   (`?grigi=1` applica il filtro in scala di grigi, `?cella=N` cambia il lato in px di una cella; espone `window.__vetrina`)
```

Parametri dell'URL:

| Parametro | Effetto |
|---|---|
| *(nessun parametro)* | **`index.html` e `prova.html` dichiarano `<meta name="gioco-avvio" content="debug=1">`** (storia P04, Teatro, 2026-11-09): senza parametri la pagina parte nel **menu di selezione del personaggio e dello slot** (`interfaccia/menu.js`, stile `stile/menu.css`, testi `interfaccia.json › menu`, personaggi da `personaggi.json`) con `__gioco` esposto; dal menu (Invio/Spazio o click) si entra nell'hub di Piazza Dante con il personaggio scelto; nell'hub `Esc` (azione `menu`, a dialogo chiuso) torna al menu. Provato in `menu.wire.test.js` (storia P05). La meta riempie solo le chiavi assenti dall'URL (`fondazione/avvio-url.js`), quindi un valore esplicito la annulla: `?debug=0` spegne `__gioco`. **Saltano il menu** (strumenti di QA): `&piano=N`, `&hub=1`, `&scena=`, `&slot=N`, `&personaggio=id` |
| `?debug=1&slot=2&personaggio=agnese` | storia P04: slot del salvataggio (`1`-`5`, chiavi del profilo, dello stato narrativo e della notte salvata) e personaggio di `personaggi.json` (`ferruccio`, `agnese`, `taddeo`, `ombra`) scelti dall'URL: il menu è saltato e si parte nell'hub con le statistiche alla Isaac di quel personaggio (`attori/statistiche.js`: maschere da `hpHalf`, DMG, SPD, cadenza, oggetto attivo iniziale, dono iniziale). Cambiare slot dal menu ricarica la pagina con questi due parametri |
| `?debug=1` | espone `window.__gioco` e scrive il numero di tick sul canvas |
| `?seme=1845` | seme della notte (senza, deriva dall'orologio) |
| `?debug=1&p.combattimento.portata=90` | override di un parametro (solo con `debug=1`; fuori range → errore in console e valore riportato nel range) |
| `?debug=1&wire=1` | disegno DIAGNOSTICO in fil di ferro (`resa/debug.js`): pavimento 13×7, mura, Ferruccio, hitbox, fantocci; il ciclo entra subito in `notte` |
| `?debug=1&wire=1&fantoccio=attacca` | come sopra, con il fantoccio in basso che attacca a ciclo (anticipo 500 → lampo 150 → impatto a +252 ms) per provare la parata |
| `?debug=1&wire=1&nemico=gatto` | come `wire=1`, più un nemico VERO dell'archetipo dato (`gatto`, `vespa`, `statua`, `guardia`: storia 019) in alto a sinistra: emersione, pattuglia, inseguimento, telegrafo con hitbox del colpo, stordimento, dissoluzione; il gatto (storia 020) è disegnato come sagoma (ellisse bassa, orecchie, coda, occhi), con l'anello rosso che si chiude nel lampo e la striscia tratteggiata del balzo |
| `?debug=1&wire=1&scena=piazza-dante.tonino-primo-incontro` | storia 027 (strumento di QA): fa partire subito quella scena di `contenuti/storia.json` nel cartiglio dei dialoghi (`ui/cartiglio.js`) o, se `ancoraggi.json` la marca `tableau`, nel tableau (`ui/tableau.js`); il ciclo entra in `pausa` finché il dialogo è aperto; si avanza con `avanza`/`interagisci`/`conferma` o un click (antirimbalzo 160 ms), `indietro` salta una ripetizione; nel piano (`&piano=1`) nella stanza `banchetto` `interagisci` lontano dagli slot parla con Tonino (ancoraggio `banchetto`), mai con nemici vivi |
| `?debug=1&wire=1&hub=1&piano=0&seme=1845` | storia 029: parte dall'hub di Piazza Dante (`mondo/hub.js`, modello `contenuti/modelli-stanza/hub/piazza-dante.json`), ciclo in `hub`: mura chiuse tranne l'ingresso al piano 1 (soglia d'oro a destra, etichetta `piano 1`), Tonino al banchetto (cerchio d'inchiostro con alone d'oro, pieno quando `interagisci` risponde), la porta della bottega di Gaetano nel muro in alto (pannello pieno = chiusa finché `fucina_aperta` è falso), la finestra accesa di Mariella (quadrato d'oro, mai un personaggio), la luna (disco crema in alto a sinistra) e i fili d'oro tratteggiati; Taddeo compare solo con `taddeo = perdonato`, Agnese sotto il portico solo con `agnese = risvegliata` (`__gioco.imposta`); alla notte 1 partono da sole risveglio, tutorial e targa; vicino a un NPC `interagisci` apre il suo ancoraggio `hub:<npc>` (nessuna pausa del ciclo); camminando nell'ingresso parte la notte: piano 1 generato con il seme derivato dal profilo e dalla notte (`hub.semeNotte()`, diverso da `?seme=`), ciclo in `notte`, `notte` dell'avanzamento invariata; cartellino DOM in basso a sinistra con la notte e i suggerimenti |
| `?debug=1&piano=1&seme=1845&nemico=<archetipo>` | storia P05 (nemici alla Isaac del Teatro, renderer pixel-art): oltre al piano, un nemico vero dell'archetipo dato (`gatto`, `vespa`, `statua`, `guardia`, `maschera`, `bomba`, `predone`: le schede di `nemici.json`) nasce nella stanza d'ingresso con id `nemico-prova`. Comportamenti del Teatro trascritti nel JSON: la **statua** è una torretta ferma che spara croci di 4 colpi alternando `+` e `×` (senza gettone), la **guardia** avanza a passo lento e spara doppiette mirate tenendo `d_attesa`, la **maschera** (Host) è immobile e corazzata finché chiusa (12% del danno, nessuna spinta), si apre nell'anticipo, spara un ventaglio di 3 e si richiude dopo il recupero, la **bomba** (Bozzo Esplosivo) è ferma e, con Ferruccio entro `d_max`, accende la miccia (anticipo + lampo) ed esplode: danno pesante entro `r_giocatore`, `danno_nemici` ai nemici entro `r_nemici`, 6 schegge, evento `nemico.esplosione` (anche se uccisa prima); il **predone** è la guardia dorata della segreta (monete ×2); il gatto ha il cooldown del Teatro. I **proiettili nemici** (`attori/proiettili-nemici.js`) feriscono di `proiettili_nemici.danno.p<piano>` maschere (1 ai piani 1-2, 2 dal 3; boss 2), sono parabili (riflessi contro i nemici), cancellati dal fendente attivo, spenti su muri/ostacoli e a fine gittata. **Telegrafo solo sul corpo** (regola dell'autore 2026-11-08): postura d'anticipo e occhi rossi nel lampo; nessun segno a terra nel renderer (`segnoATerra()` resta solo come dato per il fil di ferro diagnostico) |
| `?debug=1&piano=1&seme=1845&boss=<id>` | **storia P06 (boss del pool, Donna Luciana, sipario, ciclo)**: forza il boss di ogni piano (`re-gatto`, `capitano-guardia`, `regina-vespa`, `colosso-statua`, `maestro-fucina`, `donna-luciana`: id di `boss.json`); senza, il boss del piano è quello estratto dalla run (`mondo/run.js`, generatore `boss-run` dal seme) e Donna Luciana sta sul 4° piano di ogni ciclo. `&sipario=0` salta il sipario narrativo fra i piani (`interfaccia/sipario.js`). Provato in `boss.wire.test.js` |
| `?debug=1&wire=1&hub=1&seme=1845&continua=1` | storia 030: se nello slot c'è una notte salvata, preme «Continua» da solo all'avvio (strumento di QA). Senza `continua=1`, nell'hub compare il pannello DOM «Continua / Lascia andare» (`interfaccia/ripresa.js`) quando una notte è salvata: «Continua» rigenera il piano dal seme salvato ed entra nella stanza salvata con maschere, doni e monete ripristinati; «Lascia andare» cancella la notte salvata. La notte si salva a ogni `notte.stanza` (`persistenza/notte-salvata.js`, chiave `ferruccio.v3.notte.1`) e si cancella alla morte. Alla morte (`ferruccio.morto`) il ciclo va in `pausa`, il velo DOM (`interfaccia/morte.js`) mostra le quattro fasi di `risveglio.json` (lanterne una a una, fili, maschera, buio; ≤ 5 s) e al `risveglio.fine` si torna nell'hub con `notte + 1`: flag, scintille, `piano_max` e scene viste restano; monete, doni, consumabili e pool della notte spariscono; con `&piano=N` (senza hub) la notte riparte dallo stesso seme |
| `prova.html?seme=1845` (storia P02, provvisoria) | **build di prova per l'autore**: la pagina dichiara `<meta name="gioco-avvio" content="debug=1&wire=1&hub=1">` e `fondazione/avvio-url.js` fonde quei valori come default della query (l'URL vince sempre: `?seme=` resta tuo); all'avvio compare il pannello dei tasti (`interfaccia/prova.js`, testi in `interfaccia.json › prova`, stile `stile/prova.css`) che sparisce al primo tasto o click. Il gioco è da tastiera (e gamepad): nessun controllo touch, per scelta dell'autore. `__gioco.pannelloProva()` = `true/false` (a schermo o chiuso) o `null` senza la meta. Il file unico pubblicabile si produce con `node tools/impacchetta.js --entrata gioco/prova.html --frammento` (vedi `tools/README-impacchetta.md`) |
| `?debug=1&piano=1&seme=1845&personaggio=ferruccio` | **storie P04/P09 (squadra oggetti)**: oggetto ATTIVO del personaggio (`oggetti/attivi.js`, Q = azione `attivo`, carico all'inizio, +1 tacca a stanza pulita, HUD DOM in basso a sinistra con le tacche); cinque slot dei doni (`oggetti/slot.js`, `doni.limiti.max_slot_doni`): al sesto compare il modale DOM di sostituzione (1-5 sostituisce, Esc/Q rinuncia; il vecchio torna sul piedistallo o si perde se comprato); dopo il boss l'altare del **Patto d'Ombra** (`oggetti/patto.js`, `patto.json`: 100 % senza danni nel boss, 60 % con danni, 2 reliquie) con la stanza velata di rosso: `interagisci` vicino a una reliquia apre il pannello «−1 Maschera massima per sempre», `conferma`/`indietro`; la **Crepa Dorata** (`mondo/segreta.js`): a stanza pulita la finestra verso la segreta è una crepa che un proiettile o un fendente apre (porta sui record, stanza rimontata, `segreta.aperta`), la segreta pulita lascia `monete_segreta` monete; **oggetti gratis** (`oggetti/gratis.js`, `economia.json › gratis`): a stanza normale pulita 1 su 10 forte, 1 su 3 base, dal `seme_stanza`, al centro, `interagisci` raccoglie; prezzi dell'autore (cuore 3, base 5, forte 7, consumabile 2) nel banchetto («La Fucina» nel titolo, Tonino resta); reliquie **Raggio Cremisi Continuo** (freccia tenuta: carica, poi laser con danno a tick sulla linea, `combattimento.raggio()`) e **Lacrime Spettrali** (i proiettili attraversano mura e ostacoli; gli altri ora si fermano sui solidi `ferma_colpi` con `ferruccio.colpo_muro`) |
| `?debug=1&piano=1&seme=1845&personaggio=agnese&slot=1` | **storia P13 (HUD completo del Teatro in DOM, `interfaccia/hud.js` + `stile/hud.css`; Teatro `disegnaHUDPixelArt` ~5056)**: in alto a sinistra la scheda con nome e titolo del personaggio (`personaggi.json`), «Piano N» (· «Ciclo ∞C» dal ciclo 2, da `mondo/run.js`), il tipo della stanza in piccolo (`interfaccia.json › hud.stanze`), la vita a mezze maschere con i PNG `hud-cuore-pieno/mezzo/vuoto` del manifesto (le massime vuote visibili), DMG/TRS/SPD/RNG con le icone PNG e i valori di `statistiche.correnti()` (cifre da `resa.json › hud`), monete e scintille; in alto al centro la barra della vita del boss (`hud-barra-boss`, titolo da `boss_hud`, HP numerici: l'unica, il renderer riceve `barraBossNelRenderer: false`); in basso al centro il dock: slot dell'attivo (`hud-slot-attivo`, icona `attivo-<id>`, tacche, lettera del tasto), i cinque slot dei doni (`hud-slot-vuoto`, icona `oggetto-<id_teatro>`, nome nel `title` e nella didascalia al passaggio del puntatore, ricordi `azzurro`), le reliquie del Patto (`patto-<id>`); la minimappa resta quella del renderer. Si nasconde nel menu, col sipario e a dialogo aperto; nell'hub mostra «Piazza Dante». Gli HUD precedenti (`.hud` dell'economia, `.hud-doni`, `.attivo-hud`) non esistono più. `prova.css` è ora anche in `index.html` (pannello centrato con sfondo pieno, via al primo tasto). Provato in `hud.test.mjs` e `hud.wire.test.js` |
| `?debug=1&wire=1&piano=1&seme=1845` | storie 014-017: genera il piano 1 dal seme (`mondo/generazione.js`, modelli di `contenuti/modelli-stanza/piazza-dante/`), parte dall'ingresso; porte con stato, ostacoli, soglie, segnalini e fantocci segnaposto (`archetipo`) delle ondate, transizione della camera (250 ms), pianta del piano nell'angolo in alto a destra; dalla storia 019 le ondate sono nemici veri per archetipo (`attori/nemico.js`), con direttore dei gettoni per piano; dalla storia 025 monete e cuori a terra (dischi/quadrati), HUD DOM in alto a destra e, nella stanza `banchetto`, i tre slot sui banchi con la lista dei prezzi (tasto `interagisci`); dalla storia 024, nella stanza `tesoro`, il piedistallo (quadrato d'oro, cono di luce tratteggiato `r_anteprima`, tratteggiato spento se inerte), il cartiglio del dono e l'HUD dei doni in DOM (sotto l'HUD dell'economia), le scintille dei ganci in oro; dalla storia 018 i bracieri (modelli `pd-n-04`, `pd-n-05`, `pd-d-02`) con piede pieno e cerchio tratteggiato solo in `anticipo` (largo) e `attivo` (fitto), etichetta con la fase; ogni pericolo di `__gioco.stanza.pericoli` espone `fase`, `progresso`, `sfasamento`; storia P01 (PROVVISORIA, build di prova; la 022 la sostituisce): nella stanza `boss` nasce dal contenuto `boss` di `pd-b-01` un solo gatto con `boss: true` e la taglia di `nemici.json › boss_provvisorio` (vita 60, raggio ×1,6, etichetta «boss (provvisorio)»), porte chiuse come in una stanza normale; alla sua morte `boss.sconfitto` {id: 'gatto', x, y} (cade il Medaglione), stanza svuotata → pulita, bottino del boss dall'economia; l'arco dell'uscita al centro (`stanze.json › uscita`) è tratteggiato finché la stanza non è pulita, poi pieno d'oro: restandoci `t_attesa` parte `piano.completato` {piano} una sola volta → ciclo in `pausa`, velo DOM con `interfaccia.json › fine_piano.velo`, poi lo stesso risveglio della morte con motivo `vittoria` (notte + 1, `piano_max` 2, notte salvata cancellata); senza hub la notte riparte dallo stesso seme |

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
Storia P01 (provvisoria): `stanza.combatteBoss`, `stanza.boss` (il boss vivo o null), `stanza.uscita` (`{x, y, raggio, attiva, progresso, attraversata}` o null), `risveglio.motivo` (`morte` | `vittoria` | null), `risveglio.pianoProssimo`, `risveglio.completaPiano(piano)`, `risveglio.durataMs(motivo?)`; `veloMorte()` porta anche `motivo`; `creaNemico({…, boss: true})` applica la taglia del boss provvisorio.
Storia P06: `run` (lo stato della run: `seme`, `piano`, `ciclo`, `pianiPerCiclo`, `bossEstratti`, `forzato`, `pianoNelCiclo(p)`, `cicloDi(p)`, `moltCiclo(p)`, `moltVelocita(p)`, `bossDelPiano(p)`, `vitaBoss(p)`, `forzaBoss(id)`, `idStoriaDi(id)`, `nuova(seme)`), `sipario` (`stato()` = {aperto, piano, ciclo, pianoNelCiclo, atto, titolo, righe, mostrati, visibile}, `chiudi()`, `racconto(info)`, `aperto`); ogni bersaglio boss espone `bossId`, `pattern`, `quota` (altezza in volo), `salve`, `faseBoss`, `nomeBoss`; eventi `run.nuova`, `run.piano`, `boss.anticipo`, `boss.atterraggio`, `boss.mani_schianto`, `boss.finale_sconfitto`, `profilo.vittoria`, `narrativa.boss`.
Dalla storia 030 anche `risveglio` (`attivo`, `fase`, `indice`, `progresso()`, `progressoFase()`, `lanterneSpente()`, `durataMs()`, `morti`, `stato()`),
`notteSalvata` (`presente`, `fotografa()`, `salva()`, `carica()`, `cancella(motivo)`, `riprendi({avvia})`), `ripresa` (`continua()`, `lascia()`, `stato()`
del pannello DOM) e `veloMorte()` (stato del velo DOM o null); `ferruccio.risveglia()` ed `economia.nuovaNotte()`.
Dalla storia 019 anche `direttore` (gettoni: `occupati`, `statistiche`, `impattiProgrammati()`) e
`creaNemico({archetipo, x, y, id})` (crea un nemico vero e lo aggiunge ai bersagli); ogni nemico espone
`stato`, `scheda`, `hitbox()`, `direzione`, `gettone`, `dissoluzione`, `puntini`, `forzaStato(stato)`; dalla
storia 020 anche `progresso` (0→1 nella fase), `anello` (chiusura dell'anello del lampo), `portataColpo`,
`hitTicks`, `istanteImpatto` (tick dall'inizio del lampo), `segnoATerra()` (solo dato per i test: il renderer non lo
disegna più, regola dell'autore 2026-11-08), `versoOrbita` e, per il gatto, `posa()`.
Dalla storia P05 (nemici alla Isaac) ogni nemico espone anche `tiratore`, `esplosivo`, `corazzato`, `aperta` (maschera aperta:
anticipo → recupero), `esplosa`, `dorato`, `sparati`; i proiettili nemici stanno nella stessa lista `proiettili` con `nemico: true`,
`stato` (`in_volo` | `riflesso` | `spento`), `motivo` dello spegnimento (`gittata`, `ostacolo`, `bersaglio`, `nemico`, `spada`, `cancellato`),
`percorso`, `rifletti()`, `cancella()`; eventi `nemico.sparo` {n, croce, direzioni}, `nemico.esplosione` {rGiocatore, rNemici, schegge},
`proiettile.spento` {motivo}.
Dalla storia P04 anche `statistiche` (`correnti()`, `scegli(id)`, `stringiPatto`, `id`), `slot` (lo slot in uso), `menu()` (stato del
menu DOM: `{personaggio, slot, daCancellare, slots[]}` o `null` se chiuso), `apriMenu()` e `scegli(personaggio, slot?)` (applica subito la
scelta: chiude il menu, entra nell'hub; con uno slot diverso ricarica la pagina); `combattimento` espone anche `bruciature()`,
`miraForzata`, `cooldownSparo`, `statistiche()` e `faseTicks` (storia P12: `frameSpada`, `esplosioniProiettili` e `scintilleFulmine` non
stanno più nello stato: `__gioco.resa.impatti()` conta gli splash e i fulmini nel registro della resa).
Dalle storie P04/P09 (squadra oggetti) anche `attivi` (`stato()`, `usa()`, `equipaggia(id)`, `carica`, `carico`, `nuovaRun()`), `slotDoni` (i cinque slot dei doni: `acquisisci(id, {origine, restituisci, suConferma})`,
`conferma(i)`, `annulla()`, `pendente`, `stato()`), `patto` (`altare`, `pendente`, `stretti`, `proponi(i)`, `conferma()`, `annulla()`, `posaAltare(stanza)`, `reliquia(id)`,
`inStanzaAltare()`, `nuovaRun()`), `gratis` (`corrente()`, `vicino()`, `raccogli()`, `stati()`), `segreta` (`crepa()`, `apri()`, `aperte`) e `interfacciaOggetti()` (stato DOM di HUD
dell'attivo, modale di sostituzione e pannello del patto); `combattimento.raggio()` e `combattimento.impostaRaggio(cfg)`.
Dalla storia P13 anche `hud()` (fotografia dell'HUD del Teatro nel DOM: `visibile`, `nome`, `titolo`, `piano`, `ciclo`, `pianoTesto`, `stanza`, `stanzaTesto`,
`maschere` {correnti, max, piene, mezza, vuote}, `statistiche` {dmg, tears, spd, range} o null, `monete`, `scintille`, `attivo` {id, nome, tacche, piene, carico, icona, tasto} o null,
`slot[]` ({indice, id, nome, azzurro, icona, sagoma} o null per ogni slot), `patti[]`, `boss` {nome, titolo, vita, max, quota} o null); `interfacciaOggetti()` tiene solo `sostituzione` e `patto`.

## Test

```sh
node gioco/qa/fondazione.test.mjs   # unitari, senza browser (node:test); storia P12: ciclo con orologio finto a 60, 120 e 144 Hz per 1 s →
                                    # stessi 60 tick e stessa posizione, un frame di 1000 ms = 5 tick
node gioco/qa/architettura.test.mjs # storia P12: audit «lo stato non disegna, la resa non muta» (grep programmatico senza commenti: niente
                                    # Canvas/colori/DOM/sprite in attori|mondo|oggetti|storia|persistenza; resa/ senza import dello stato,
                                    # tick( o orologio reale; zero Math.random; PASSO_MS e tetto di 5 tick)
node gioco/qa/impatti.test.mjs      # storia P12: resa/impatti.js (frameSpada, splash, fulmini dagli eventi con i tick del ciclo) e
                                    # resa/trasformazioni.js (applicaCamera) su contesto e bus finti, valori da resa.json › impatti
node gioco/qa/pagina.test.js        # Playwright: avvia un server su porta libera, apre la pagina (parte nel menu, storia P04: lo chiude con
                                    # storia P12: rAF finto (`__orologio.avanza`) → 1 s a 120 Hz = 1 s a 60 Hz (tick e posizione di Ferruccio
                                    # identici), screenshot fondazione-passo-fisso.png;
                                    # `__gioco.scegli` prima di provare la tastiera; senza debug: menu nel DOM con i personaggi di personaggi.json,
                                    # fondo del canvas dal token, Invio fa partire); salva production/qa/evidence/fondazione-pagina.png (hub)
                                    # e menu-selezione.png (menu)
node gioco/qa/combattimento.test.mjs      # unitari delle storie 007-011: ciclo simulato a tick fissi,
                                          # un caso per criterio Given-When-Then + prestazioni (20 bersagli)
node gioco/qa/feel.test.mjs               # storia P08 (game feel): t_invuln ≥ 1000 e alpha del lampeggio dal JSON, rimbalzo di Ferruccio
                                          # (contatto e proiettile), hit-stop del ciclo (2-3 tick, uno solo per fendente), spinta ∝ 1/peso
                                          # con tre pesi di nemici.json, macchie per stanza deterministiche, scossa per contesto e moto ridotto
node gioco/qa/feel.wire.test.js           # Playwright della storia P08: ?debug=1&piano=1&seme=1845 sul renderer pixel-art; colpo subito →
                                          # alpha < 1 misurato sul pixel più chiaro della sagoma e corpo arretrato; fendente su un nemico vero →
                                          # tick fermi per hit_stop_ms mentre contaFrame() avanza; nemico morto → macchia e pixel scuri che
                                          # restano, azzerati al cambio di stanza; screenshot feel-iframes.png e feel-macchie.png
node gioco/qa/fili.test.mjs               # storia P11 (fili del Velo): resa.json › fili nella richiesta dell'autore (1 px, oro al 25-35 %,
                                          # spalle a ~3/4 dell'altezza), resa/fili.js: due punti d'attacco simmetrici, due curve quadratiche
                                          # che pendono, senza tratteggio né alone, spessore/alpha/colore dai parametri (ctx finto)
node gioco/qa/fili.wire.test.js           # Playwright della storia P11: hub (?debug=1&hub=1&piano=0) e piano 1 con un nemico (&nemico=gatto):
                                          # __gioco.resa.fili() conta fili = 2 × marionette (Tonino, nemici; mai Ferruccio), spessore 1,
                                          # alpha nel 25-35 %; salva fili-hub.png e fili-marionette.png
node gioco/qa/combattimento.wire.test.js  # Playwright: ?debug=1&wire=1, cammina/colpisce/scatta/para,
                                          # salva production/qa/evidence/combattimento-wire.png
node gioco/qa/mondo.test.mjs              # unitari delle storie 014-018: porte, spawn (200 semi), colonna/panca,
                                          # stanza pulita, generazione (determinismo, 200 semi, riserva), camera;
                                          # 018: bracieri (ciclo riposo/anticipo/attivo a seme, danno solo in attivo,
                                          # spinta, scatto, morte) e ricompensa pre-estratta a terra con l'economia
                                          # reale (`drop`), nessuna ricompensa al rientro
node gioco/qa/mondo.wire.test.js          # Playwright: ?debug=1&wire=1&piano=1&seme=1845, attraversa una porta,
                                          # pulisce una stanza; salva mondo-wire.png e mondo-pianta.png
node gioco/qa/vetrina.test.js             # Playwright della storia 017: qa/vetrina-stanze.html?grigi=1, i 21 modelli dei piani 1-4 in
                                          # fil di ferro (conteggi 10/2/1/1/4/1/1/1, tag di difficoltà, zero errori), filtro in scala di
                                          # grigi attivo, centro di ogni ostacolo e pericolo scuro e pavimento chiaro (luminanza dal canvas);
                                          # salva vetrina-stanze-grigi.png e, tolto il filtro dalla casella, vetrina-stanze.png
node gioco/qa/nemici.test.mjs             # unitari delle storie 019 e 020: formule F1-F3 sui dati, R2/R4, fermo a contatto,
                                          # separazione, telegrafo (tempi ed eventi), parata/stordimento (anche boss),
                                          # morte/dissoluzione/bottino, transizioni, direttore, factory nella stanza, prestazioni;
                                          # gatto: posa, anello 150 ms, d_balzo, hitbox dal 45% (impatto costante), anello
                                          # d'attesa, tetto di 2 attaccanti, bot QA a 120 ms su 30 stanze (stampa una riga `# bot:`; la finestra
                                          # 3-7 s del GDD scala con la vita del gatto di nemici.json: con vita 8 il tetto è 9,33 s, media misurata 7,11 s)
                                          # storia P05: sette schede e regole, maschera (corazza, apertura, ventaglio), guardia (doppietta,
                                          # parata → riflesso che ferisce la guardia), statua (croci + e ×, senza gettone, spente dagli ostacoli),
                                          # bomba (miccia, esplosione, schegge, esplode anche alla morte), predone dorato, fendente che
                                          # cancella i proiettili, Tamburello; bot QA su 30 stanze miste (riga `# bot misto:`, soglia 1 maschera/stanza)
node gioco/qa/nemici.wire.test.js         # Playwright della storia P05: ?debug=1&piano=1&seme=1845&nemico=<archetipo> per ognuna delle sette
                                          # schede, telegrafo sul corpo nel lampo (screenshot production/qa/evidence/nemici-<archetipo>.png),
                                          # salva/esplosione/hitbox, morte, proiettili spenti, zero errori
node gioco/qa/economia.test.mjs           # unitari della storia 025: economia.json con i prezzi del Teatro (cuore 3, consumabile 5, dono 10/15/20,
                                          # costanti sui piani), formula del prezzo (sconto, minimo, tetto), monete_boss = s0 + k × p (2 al piano 1),
                                          # scintille_boss/p_cuore/residuo/costo_sblocco, drop su 10 000 stanze (E = 5 × p_drop × v_medio ± 0,05),
                                          # pool del banchetto, raccolta passandoci sopra e tetto 99, bonus di stanza e cuore, tre slot
                                          # con acquisto/rifiuto/consumabili/rientro, morte (monete perse, scintille nel profilo in RAM),
                                          # boss (scintille subito, monete a terra), prestazioni, nessun Math.random e nessun numero
node gioco/qa/doni.test.mjs               # unitari delle storie 023-024: ordine e clamp, imposta, ganci (probabilità seminata, ricarica,
                                          # tetto per stanza, profondità 1, budget nei 5 slot), sinergie, bonus temporanei; pool del Teatro: 21 MVP
                                          # (20 doni d'oro + Medaglione), sagome, probabilità W_r(p)/ΣW × peso/Σpeso calcolate dai JSON, 1000 estrazioni
                                          # senza il raccolto, escludi_se_flag/richiede_flag. I valori attesi sono letti da doni.json, ferruccio.json,
                                          # combattimento.json e sinergie.json: cambiare un dono non rompe il test, cambiare la formula sì
node gioco/qa/doni.integrazione.test.mjs  # integrazione della storia 024 (DOM finto): piedistallo e interagisci (33 ms), cartiglio 3000 ms senza
                                          # pausa, HUD, doppio dal piano `piedistallo.piano_doppio` (4), sostituto, banchetto sul pool, ganci collegati,
                                          # scintilla a ventaglio (n del gancio)/catena (2 bersagli nel raggio)/onda/cura
node gioco/qa/doni.wire.test.js           # Playwright: ?debug=1&wire=1&piano=1&seme=1845, va nella bottega, anteprima, raccoglie, cartiglio e HUD
                                          # nel DOM, rientro, scintilla da un fendente; salva production/qa/evidence/doni-piedistallo.png
node gioco/qa/parametri.test.js           # coerenza catalogo dei doni ↔ parametri ↔ libreria degli effetti (Teatro: 25 doni, 20 d'oro + 5 ricordi,
                                          # 21 MVP, forme d'oro uniche; i 5 doni nuovi usano gli effetti cura/onda/scintilla già in libreria)
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
                                          # salva notte-ripresa.png, notte-morte.png, notte-risveglio.png (con `&piano=0` per annullare la meta)
node gioco/qa/boss-provvisorio.test.mjs   # storia P01 (node:test, provvisoria): stanza boss reale (pd-b-01) con fantocci: un solo nemico boss === true,
                                          # boss.sconfitto alla morte, svuotata → pulita (rivisitata pulita), uscita inattiva → attiva, piano.completato
                                          # una sola volta, velo di una fase `discesa` e `piano.discesa` {daPiano, aPiano} SENZA risveglio (Teatro: la run
                                          # continua al piano 2 con doni, flag, scintille e pool addosso; notte invariata; piano_max 2; notte salvata
                                          # cancellata; il residuo dell'economia è accreditato una volta); contenuti e scheda boss; regole del codice
node gioco/qa/boss.test.mjs               # storia P06 (node:test): formule della run dal Teatro (piano nel ciclo, ciclo, moltCiclo 1,45^(c−1), moltVel,
                                          # vita del boss per piano/ciclo, Donna Luciana ai piani 4 e 8, estrazione senza ripetizione e deterministica,
                                          # forzaBoss, idStoria); per ogni pattern fasi anticipo → lampo → colpo (mai segnoATerra), proiettili danno_boss;
                                          # balzo e immunità in volo del Re Gatto, carica rettilinea del Capitano, rimbalzo ed evocazioni della Regina,
                                          # Custode immobile con bombe, forbici del Maestro, Mani e schianto di Donna Luciana; contatto del corpo
                                          # (pesante, parabile → stordito + immune), furia (cooldown _furia), racconto del sipario (atti, BIS, ciclo), regole
node gioco/qa/boss.wire.test.js           # Playwright della storia P06 (pixel-art): per ogni boss ?debug=1&piano=1&seme=1845&boss=<id> → nasce con vita
                                          # della formula, agisce (fasi, proiettili/moto), barra della vita nell'HUD, salva boss-<id>.png; flusso con
                                          # re-gatto: boss.sconfitto {id re-gatto, archetipo gatto}, boss_battuti, Medaglione, uscita → velo di discesa →
                                          # SIPARIO dell'atto II (sipario.png) → chiudi → piano 2 (7 stanze) della stessa run; Donna Luciana con
                                          # &sipario=0: boss.finale_sconfitto, profilo.vittorie, boss_battuti, discesa al piano 2 (il ciclo continua)
node gioco/qa/prova.test.mjs              # storia P02: fondiDefault/leggiMetaAvvio (la meta riempie solo le chiavi assenti, l'URL vince)
node gioco/qa/prova.wire.test.js          # Playwright della storia P02: prova.html?debug=1&seme=1845 parte nel piano 1 (stanza d'ingresso) dalla meta,
                                          # pannello dei tasti visibile che sparisce al primo tasto, nessun controllo touch; index.html servita SENZA la
                                          # meta (tolta al volo con page.route) → nessun pannello e menu; com'è → pannello e piano 1;
                                          # salva production/qa/evidence/prova-pagina.png
node gioco/qa/hub.wire.test.js            # Playwright della storia 029: ?debug=1&wire=1&hub=1&piano=0&seme=1845, targa automatica, presenze base e con
                                          # taddeo/agnese, Tonino, partenza nella notte con seme derivato; salva hub-wire.png e hub-presenze.png
node gioco/qa/seme.js 200 [--piano P] [--stampa K]   # genera N piani e riporta violatori e distribuzione dei tipi
node gioco/qa/pacchetto.test.js           # impacchettatore: pacchetto via http e file://, frammento con CSP, determinismo; con la meta di index.html
                                          # il pacchetto parte nel piano 1 (stato notte, stanza d'ingresso)
node gioco/qa/stati64.js                  # forza i 64 stati narrativi: nessun buco, nessun conflitto
node gioco/qa/attivi.test.mjs             # storie P04/P09 (node:test): oggetto attivo: iniziale dal personaggio e carico, Q a carica piena / scarico, +1 per
                                          # stanza pulita combattuta con tetto, forbici (stordisci + danno), tamburello (proiettili via, danno e spinta nel raggio), ampolla;
                                          # esporta la fixture `creaMondoAttivi` usata da patto.test.mjs e oggetti.test.mjs
node gioco/qa/patto.test.mjs              # storie P04/P09: patto.json (5 reliquie, costo 2, dmgMult ≥ 2 e ≥ del miglior dono), altare dopo il boss (100 %/60 %),
                                          # proposta/rifiuto/conferma con −1 maschera massima permanente (stanza e piano), maschere insufficienti, nuova run;
                                          # raggio continuo (carica, danno a tick sulla linea, nessuno fuori/dietro, rilascio, durata), spettrale vs ostacolo
                                          # P2b: se il massimo scende fuori da patto.conferma (stringiPatto diretto) Ferruccio allinea le correnti al tick (Teatro ~2729)
node gioco/qa/oggetti.test.mjs            # storie P04/P09: cinque slot (pendente, conferma, annulla, restituisci), piedistallo via acquisisci, tiraTier e oggetti gratis su
                                          # una notte vera (determinismo, tier, centro, raccolta), Crepa Dorata (visibile solo a stanza pulita, apertura con proiettile,
                                          # porte sui record, Ferruccio fermo, monete della segreta una volta), regole del codice
node gioco/qa/oggetti.wire.test.js        # Playwright: ?debug=1&piano=1&seme=1845&personaggio=ferruccio, Q con carica, 6 doni → modale → sostituzione, crepa aperta con un
                                          # proiettile, boss → altare → patto pagato; salva attivo-q.png, slot-sostituzione.png, segreta-crepa.png, patto.png
node gioco/qa/patto.wire.test.js          # Playwright: boss → pannello del Patto (patto-conferma.png), raggio continuo acceso sulla linea (patto-raggio.png)
node gioco/qa/statistiche.test.mjs        # storia P04 (node:test): ricalcolaStatisticheIsaac del Teatro (attori/statistiche.js) per i 4 personaggi
                                          # di personaggi.json e tre combinazioni di doni (blocco `teatro` di doni.json) e patti (patto.json), contro
                                          # valori calcolati a mano; applicazione ai modificatori
node gioco/qa/menu.wire.test.js           # storia P05 (Playwright): index.html senza parametri → menu (.menu-teatro, carte nell'ordine di
                                          # personaggi.json, 5 slot), Digit2 = Agnese, ArrowDown = slot 2, Invio → ricarica con ?slot=2&personaggio=agnese
                                          # → hub con HUD maschere 2/2; scene automatiche chiuse, Esc (azione `menu`) → menu; con ?piano=1 la freccia
                                          # destra tenuta spara proiettili (vx > 0) senza muovere Ferruccio; salva menu-selezione.png e menu-slot.png
bash gioco/qa/suite-completa.sh           # storia P05: esegue tutte le suite qui sopra una dopo l'altra (node:test, Playwright, stati64, seme 200,
                                          # grep Math.random) e riassume l'esito; esce con 1 se una è rossa
node gioco/qa/hud.test.mjs                # storia P13 (node:test, DOM finto): HUD del Teatro: scheda (nome/titolo da personaggi.json, piano e ciclo, tipo della
                                          # stanza, maschere piene/mezze/vuote, statistiche con le cifre di resa.json, monete), barra del boss (titolo da boss_hud,
                                          # quota, da morto sparisce, una sola), dock (attivo con tacche e tasto, cinque slot con icona PNG o sagoma, ricordo azzurro,
                                          # didascalia al passaggio, patti), nascosto nel menu e a dialogo aperto, manifesto completo, regole del codice
node gioco/qa/hud.wire.test.js            # Playwright della storia P13 (deviceScaleFactor 1): ?debug=1&piano=1&seme=1845&personaggio=agnese&slot=1 → scheda, dock,
                                          # PNG caricati, impaginazione del Teatro (hud.png); dono via __gioco.slotDoni.acquisisci → icona nello slot (hud-slot-pieno.png);
                                          # stanza boss → barra DOM, una sola (hud-boss.png); dialogo → HUD nascosto; 400 px senza scroll (hud-400.png); il Teatro
                                          # dell'autore in gioco (teatro-hud-riferimento.png); menu → HUD nascosto
node gioco/qa/audio.test.mjs              # storia P10 (node:test, AudioContext FINTO che registra i nodi): audio.json valido e mappa completa; senza
                                          # AudioContext nessun errore; ogni evento → grafo di nodi atteso con i numeri del JSON (campana 3 seni
                                          # inarmonici, toc triangolo + rumore passa-basso, sibilo passa-banda, tonfo passa-basso + convolver, toni);
                                          # gap_min_ms, muto, contesto sospeso, passi dalla distanza (attori/passi.js), interruttore DOM finto, regole
node gioco/qa/audio.wire.test.js          # Playwright della storia P10: AudioContext monkey-patchato con page.addInitScript (conta contesti e create*);
                                          # menu: nessun contesto prima di un gesto, dopo un tasto running|suspended senza eccezioni, eventi del bus →
                                          # nodi, M → muto con l'interruttore «Audio: spento (M)», click → acceso; piano 1: camminando partono gli
                                          # attore.passo; salva production/qa/evidence/menu-audio.png
```

> **Storia P03 (2026-11-08, riallineo delle suite al Teatro).** I test non fissano più i valori del GDD vecchio: prezzi,
> drop, vite, catalogo, stanze per piano e probabilità del pool sono letti dai JSON di `contenuti/parametri/` o
> restano scritti nel nome del caso come regola del Teatro (5/7/8/9 stanze, 25 doni, 21 modelli, discesa tra i piani).

Entrambi escono con codice 1 se un caso fallisce. Il test di pagina usa il Chromium di Playwright
preinstallato; non eseguire `playwright install`.

## Struttura

```
gioco/
├── index.html                  pagina completa: <canvas id="scena"> 1280×720 logici + <div id="interfaccia">
├── prova.html                  storia P02 (provvisoria): come index.html più <meta name="gioco-avvio"> (parte in hub, fil di ferro) e pannello dei tasti
├── stile/
│   ├── token.css               palette dell'art bible come variabili CSS (unico posto con i colori)
│   ├── base.css                palco 16:9 senza scroll, canvas e interfaccia sovrapposti
│   ├── prova.css               storia P02: pannello delle istruzioni iniziali di prova.html
│   ├── menu.css                storia P04: menu di selezione (sipario, quattro carte, slot, conferma di cancellazione)
│   ├── audio.css               storia P10: interruttore del muto nell'angolo del palco (visibile nel menu)
│   └── hud.css                 storia P13: l'HUD del Teatro (scheda, barra del boss, dock) in pixel logici del palco (`--u` = 1/1280 di #interfaccia)
├── motore/
│   ├── audio/                  storia P10: audio dinamico minimale (Web Audio API, nessun file audio). Lo stato di gioco non lo conosce: solo eventi
│   │   ├── sintesi.js          ricette di suoni (oscillatori e rumore seminato con inviluppi, convolver sintetico) con i numeri di audio.json;
│   │   │                       AudioContext creato/ripreso al primo gesto (`collega`), master gain, muto, fabbrica iniettabile; senza Web Audio
│   │   │                       degrada in silenzio
│   │   └── eventi-audio.js     MAPPA_EVENTI: attore.passo → toc, ferruccio.fendente/affondo/sparo → sibilo, esplosione/bomba.esplosione/colpo di
│   │                           un boss → tonfo, stanza.entrata → campana, ferruccio.colpo, ferruccio.danno, economia.monete (+), stanza.chiusa,
│   │                           attivo.usato; anti-affollamento `gap_min_ms`
│   ├── avvio.js                radice di composizione: carica i parametri, collega input e ciclo,
│   │                           compone campo + Ferruccio + combattimento + fantocci, renderer
│   │                           SEGNAPOSTO (sostituito dalla storia 005) o debug wire, window.__gioco
│   ├── fondazione/
│   │   ├── avvio-url.js        storia P02: parametri di avvio di default dalla meta gioco-avvio (l'URL vince)
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
│   │   ├── attivi.js           storie P04/P09: oggetto attivo a ricarica per stanza (forbici, tamburello, ampolla; oggetti-attivi.json)
│   │   ├── slot.js             storie P04/P09: cinque slot dei doni con acquisizione pendente e sostituzione (Teatro ~2788)
│   │   ├── patto.js            storie P04/P09: altare del Patto d'Ombra dopo il boss, reliquie di patto.json, −1 maschera massima permanente
│   │   ├── gratis.js           storie P04/P09: oggetto gratis a stanza pulita (1/10 forte, 1/3 base) dal seme_stanza
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
│   │   ├── banchetto.js        storia 025: lista DOM minimale del banchetto (testi da contenuti/interfaccia.json); dalla P13 niente HUD qui
│   │   ├── doni.js             storia 024: cartiglio del dono (nome, riga, avviso, anteprima) in DOM; dalla P13 la fila dei doni è negli slot dell'HUD
│   │   ├── hud.js              storia P13: l'HUD completo del Teatro (disegnaHUDPixelArt ~5056) in DOM: scheda (nome, titolo, piano/ciclo, stanza,
│   │   │                       mezze maschere PNG, statistiche con icone, monete, scintille), barra del boss (hud-barra-boss, una sola), dock (attivo
│   │   │                       con tacche, cinque slot con le icone oggetto-<id_teatro>, patti); immagini dal manifesto, testi da interfaccia.json › hud
│   │   ├── hub.js              storia 029: cartellino DOM dell'hub (notte, suggerimento per parlare/partire)
│   │   ├── morte.js            storia 030: velo DOM della sequenza di morte (dissolvenza, lanterne, fili, maschera, didascalie)
│   │   ├── sipario.js          storia P06: il sipario narrativo degli atti fra i piani (DOM; Teatro getRaccontoAtto ~2535): atto,
│   │   │                       titolo, tre righe e «Alza il sipario» da interfaccia.json › sipario; BIS al piano 1 dei cicli ≥ 2;
│   │   │                       si alza con conferma/scatto, click o chiudi(); tiene il ciclo in `pausa`
│   │   ├── ripresa.js          storia 030: pannello DOM «Continua / Lascia andare» della notte salvata (nell'hub)
│   │   ├── prova.js            storia P02: pannello DOM dei tasti di prova.html (sparisce al primo tasto o click)
│   │   ├── menu.js             storia P04: menu DOM di selezione del personaggio e dello slot (Teatro ~4042): `apri()` → Promise
│   │   │                       {personaggio, slot}; non conosce il ciclo, avvio.js applica la scelta
│   │   ├── audio.js            storia P10: interruttore DOM del muto «Audio: acceso/spento (M)» (testi `interfaccia.json › audio`), visibile nel menu
│   │   └── oggetti.js          storie P04/P09: modale di sostituzione dei cinque slot e pannello del Patto (stile/oggetti.css); l'attivo è nell'HUD (P13)
│   ├── mondo/
│   │   ├── run.js              storia P06: lo stato della run (seme, piano, ciclo, boss estratti senza ripetizione da boss.json con il
│   │   │                       generatore `boss-run`, usi dei modelli) e le formule del Teatro: pianoNelCiclo, cicloDi, moltCiclo,
│   │   │                       moltVelocita, vitaBoss, bossDelPiano (Donna Luciana sul piano finale del ciclo), forzaBoss (QA)
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
│   │   ├── camera.js           scala min(1, L/larg, (A−hud)/alt), transizione 250 ms, inTransizione (015); solo numeri:
│   │   │                       la trasformazione Canvas la applica resa/trasformazioni.js (P12)
│   │   └── notte.js            piano + stanza corrente + passaggi; input ignorato in transizione; vaiA;
│   │                           salvataggio() = {seme, piano, stanza}
│   │   ├── segreta.js          storie P04/P09: la Crepa Dorata (finestra verso la segreta → porta a colpo) e le monete della segreta
│   │   └── hub.js              storia 029: l'hub come stanza speciale: campo dal modello hub/, presenze risolte sullo stato
│   │                           narrativo (quando/aperta_se), interagisci sugli NPC, ingresso → hub.partenza con seme derivato
│   ├── attori/
│   │   ├── statistiche.js      storia P04: statistiche alla Isaac (ricalcolaStatisticheIsaac del Teatro) dal personaggio, dai doni con blocco
│   │   │                       `teatro` e dai patti; `creaStatistiche` le applica ai modificatori e al combattimento
│   │   ├── ferruccio.js        corpo: Fermo/Cammina/Scatta/Recupero scatto/Colpito/Morto, cariche,
│   │   │                       maschere, invulnerabilità, spinta (storie 007-008)
│   │   ├── combattimento.js    spada: Pronto/Fendente 1-3/Carica/Affondo/Parata/Controcolpo, buffer,
│   │   │                       combo, cancellazioni, danno decimale, ricevi(attacco) (storie 009-011); P12: niente
│   │   │                       fotogrammi: eventi ferruccio.proiettile_spento {x,y,tipo,causa} e ferruccio.fulmine, faseTicks
│   │   ├── bersaglio.js        contratto minimo dei bersagli, nemico FANTOCCIO con telegrafo in tre
│   │   │                       tempi (resta per i test del combattimento) e proiettile minimo
│   │   ├── nemico.js           fabbrica generica dei nemici per archetipo (nemici.json): scheda scalata per
│   │   ├── boss/               storia P06: i pattern dei boss sopra la fabbrica dei nemici (opzione `pattern`; numeri in nemici.json › boss)
│   │   │   ├── base.js         macchina a fasi insegue → anticipo → lampo → colpo → recupero (telegrafo solo sul corpo), insegui,
│   │   │   │                   anello, ventaglio, cooldown di furia, `esponiPattern`
│   │   │   ├── re-gatto.js     monstro_jump: balzo in aria (quota, immune in volo) con schianto e rosa caotica; ventaglio di 7
│   │   │   ├── capitano-guardia.js chub_charge: carica rettilinea fino al muro, anello di 8
│   │   │   ├── regina-vespa.js duke_flies: rimbalza in diagonale, evoca vespe (max 4 comuni vivi), anello ruotato
│   │   │   ├── colosso-statua.js gurdy_turret: immobile, spirale, genera bombe (max 2) ogni 3 salve
│   │   │   ├── maestro-fucina.js scissor_blades: forbici (due ventagli specchiati), anello in furia
│   │   │   ├── donna-luciana.js marionette_queen: le due Mani sparano ventagli, schianto delle Mani con anello di 10
│   │   │   └── indice.js       nome del pattern → factory (`patternPerNome`)
│   │   │                       piano (F1-F3), corpo, separazione (§8.5), contratto del combattimento, hitbox
│   │   │                       del Colpo via comeBersaglio, morte → anima (dissoluzione) e bottino (storia 019);
│   │   │                       hitbox da hit_dal, segno a terra, gancio posa (storia 020)
│   │   ├── passi.js            storia P10: passi delle marionette: un `attore.passo` {id, tipo, x, y} ogni `audio.passi.lunghezza_px`
│   │   │                       percorsi da Ferruccio (e `lunghezza_nemico_px` dai bersagli): la cadenza segue la velocità; niente da
│   │   │                       fermo, da morto o dopo un salto di posizione
│   │   ├── effetti-doni.js     storia 024: collegaGanci (eventi ferruccio.*/stanza.* → ganci) e collegaEffettiDoni
│   │   │                       (doni.scintilla/catena/onda/cura/ricarica_scatto eseguiti su bersagli, proiettili, Ferruccio)
│   │   ├── gatto.js            gatto d'ombra (storia 020): posaGatto pura dai fattori nemici.archetipi.gatto.posa
│   │   │                       (accucciato, lampo, balzo, stordito) e creaGatto = fabbrica generica + posa
│   │   └── ia/
│   │       ├── base.js         macchina a stati: emersione, pattuglia, insegue (fermo a contatto, d_attesa,
│   │       │                   anello d'attesa omega_attesa), anticipo → lampo (telegrafo.lampo, anello →
│   │       │                   telegrafo.anello) → colpo (portata dinamica, hitbox da hit_dal) → recupero, stordito, morto
│   │       ├── direttore.js    gettoni di attacco per piano, gap tra impatti, imparabili contemporanei,
│   │       │                   tetto attaccanti_max (storia 020)
│   │       └── sparo.js        storia P05: geometria pura delle salve (ventaglio mirato, croce + / × a parità alternata, radiali)
│   │   ├── proiettili-nemici.js storia P05: proiettile nemico (ferisce via comeBersaglio, parabile → riflesso che ferisce il primo
│   │   │                       nemico, cancellato dal fendente attivo, si spegne su solidi e a fine gittata), cancellaInRaggio
│   │   │                       (Tamburello), potaSpenti (lista condivisa)
│   └── resa/
│       ├── renderer.js         renderer pixel-art del Teatro (Mani, palco, hub, minimappa); `fili()` espone i fili dell'ultimo frame alla QA; la barra del
│       │                       boss è dell'HUD DOM (P13: `barraBossNelRenderer: false`)
│       ├── pixel-sprites.js    sprite provvisori in griglia di pixel
│       ├── feel.js             storia P08: lampeggio, scossa contestuale, macchie
│       ├── fili.js             storia P11: i due fili d'oro di ogni marionetta del Velo (uno per Mano, spalle, curva, 1 px) da resa.fili
│       ├── impatti.js          storia P12: splash dei proiettili, fulmini a catena e fotogramma dello stocco derivati dagli eventi e dai
│       │                       numeri dello stato con l'orologio dei tick (resa.json › impatti)
│       ├── trasformazioni.js   storia P12: applicaCamera(ctx, camera, scena): i numeri della camera diventano translate/scale
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
│   ├── nemici.json             globali, scalatura, direttore, drop e schede dei 4 archetipi MVP (GDD nemici.md); storia P05 (Teatro):
│   │                           `proiettili_nemici` (velocità, gittata, r, danno per piano e dei boss), schede `maschera`, `bomba`,
│   │                           `predone` e i blocchi facoltativi `sparo` / `esplosione` / `corazza`, flag `dorato`, `attacco.senza_gettone`
│   ├── economia.json           economia (GDD economia.md): drop, tetti, prezzi, p_cuore, scintille, Fucina, pesi del banchetto
│   ├── consumabili.json        tabella dei consumabili del banchetto (Olio da fabbro, Pezzuola di lino)
│   ├── incontri.json           storia 027: max_nuove_per_notte, max_caratteri_battuta, tableau.{t_min,t_base,ms_per_carattere},
│   │                           antirimbalzo, r_interazione (GDD incontri-dialoghi.md)
│   ├── ricordi.json            storia 028 (tabella): per ricordo persona, flag, scena_scelta, boss, archetipo_boss, valore_restituzione,
│   │                           effetto_ceduto.scintille; r_raccolta (GDD ricordi-scelta.md)
│   ├── risveglio.json          storia 030: durate delle quattro fasi della sequenza di morte (somma dei massimi = t_max 5000), lanterne
│   ├── input.json              mappa dei tasti per le azioni del contratto (storia P04: frecce = `spara_su/giu/sinistra/destra`, Q = `attivo`,
│   │                           Esc = `menu`; WASD muove)
│   ├── personaggi.json         storia P04 (Teatro PERSONAGGI_GIOCABILI ~2360): i 4 personaggi (`ordine`, `predefinito`, hpHalf, baseDmg,
│   │                           baseSpd, attivo e dono iniziali, testi) e le costanti `isaac` di ricalcolaStatisticheIsaac {base,min,max}
│   ├── oggetti-attivi.json     storia P04 (Teatro OGGETTI_ATTIVI ~2381): Forbici, Tamburello, Ampolla: maxCarica ed effetti {base,min,max}
│   ├── patto.json              storia P04 (Teatro CATALOGO_PATTO ~2397): le reliquie del Patto d'Ombra, costo in mezze maschere e `mod`
│   ├── boss.json               storie P04/P06 (Teatro POOL_BOSS/BOSS_FINALE ~2515, formule ~3231/~3395): pool dei boss con pattern e idStoria, Donna Luciana, piani per ciclo, molt_ciclo, molt_vel, vita_per_piano_ciclo; pool dei boss dei piani 1-3 e Donna Luciana al piano 4
│   ├── audio.json              storia P10: master.volume, rumore (seme, buffer, decadimento del riverbero), passi (lunghezza_px), e per ogni suono
│   │                           (passo, passo_nemico, sibilo, tonfo, campana, colpo_a_segno, colpo_subito, moneta, porta_chiusa, attivo) frequenze,
│   │                           durate, inviluppi, filtri, volume e gap_min_ms, tutti {base,min,max}
│   ├── resa.json               game feel della resa (storia P08): alpha e semiperiodo del lampeggio, scosse per contesto (px, frame), macchie; `hud` (P13): cifre decimali
│   └── moto-ridotto.json       sovrascritture applicate con prefers-reduced-motion (anche resa.scossa.*_px → 0); `fili` (storia P11): alpha, spessore, ancoraggio_y, scarto_x, curva_px
├── contenuti/interfaccia.json  testi di HUD, banchetto, doni, cartiglio, hub e menu (unico posto con le stringhe mostrate; storie 024-025, 027 `incontri`, 029 `hub`, P04 `menu`, P13 `hud`)
├── contenuti/storia.json       la storia in forma macchina (copia di trama/storia.json; storia 026)
├── contenuti/narrativa.json    regole dello stato narrativo che storia.json non ha (derivati, finale → mondo, tipi obbligatori e senza attesa)
├── contenuti/ancoraggi.json    storia 027: ancoraggio (e `tableau`) per scena: tutto piazza-dante + il ricordo di Gaetano
├── contenuti/ripetizioni.json  storia 027: battute di ripetizione di Tonino per ogni stato di tonino_ricordo (canon Provisional)
├── contenuti/modelli-stanza/piazza-dante/   21 modelli JSON dei piani 1-4 + indice.json (storia 017, Teatro: pd-b-02..04, pd-n-07..10)
├── contenuti/modelli-stanza/hub/piazza-dante.json   storia 029: modello dell'hub (griglia, arrivo, ingresso, presenze con quando/aperta_se, automatiche)
├── contenuti/piani/piazza-dante-riserva.json piano di riserva disegnato a mano (esempio del GDD, Q = 100)
└── qa/
    ├── mondo.test.mjs / mondo.wire.test.js / seme.js   storie 014-017
    ├── vetrina-stanze.html          storia 017: vetrina di QA dei 14 modelli del piano 1 in fil di ferro (griglia, filtro grigi)
    ├── vetrina.test.js              test Playwright della vetrina (sagome nere, conteggi, screenshot in scala di grigi)
    ├── fondazione.test.mjs          test unitari della fondazione (P12: 60/120/144 Hz simulati → stessi tick e posizione)
    ├── architettura.test.mjs        storia P12: audit programmatico stato/resa, Math.random, passo fisso
    ├── impatti.test.mjs             storia P12: resa/impatti.js e resa/trasformazioni.js su finti
    ├── pagina.test.js               test Playwright della pagina (P12: 120 Hz con rAF finto, fondazione-passo-fisso.png)
    ├── combattimento.test.mjs       test unitari delle storie 007-011
    ├── nemici.test.mjs              test unitari delle storie 019, 020 e P05 (nemici alla Isaac, proiettili nemici, bot misto)
    ├── nemici.wire.test.js          test Playwright della storia P05 (un nemico per archetipo nel piano 1, screenshot nel lampo)
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
    ├── boss-provvisorio.test.mjs    test della storia P01 (provvisoria: boss provvisorio, uscita, piano.completato → notte + 1)
    ├── boss.wire.test.js            test Playwright della storia P01 (stanza boss, Medaglione, uscita, velo di vittoria, screenshot)
    ├── prova.test.mjs               test della storia P02 (parametri di avvio dalla meta)
    ├── prova.wire.test.js           test Playwright della storia P02 (prova.html, pannello dei tasti, screenshot)
    ├── audio.test.mjs               test della storia P10 (AudioContext finto: mappa evento → nodi con i numeri di audio.json, muto, passi, interruttore)
    ├── audio.wire.test.js           test Playwright della storia P10 (AudioContext monkey-patchato: contesto dopo un gesto, nodi per evento, M, screenshot)
    ├── feel.test.mjs                game feel della storia P08 (node:test)
    ├── feel.wire.test.js            Playwright della storia P08 (i-frames, hit-stop, macchie; screenshot feel-*.png)
    ├── fili.test.mjs                storia P11 (node:test): resa.fili e resa/fili.js su un contesto finto
    ├── fili.wire.test.js            Playwright della storia P11 (fili = 2 × marionette nell'hub e nel piano 1; fili-hub.png, fili-marionette.png)
    ├── hud.test.mjs                 storia P13 (node:test): l'HUD del Teatro su un DOM finto
    ├── hud.wire.test.js             Playwright della storia P13 (hud.png, hud-slot-pieno.png, hud-boss.png, hud-400.png, teatro-hud-riferimento.png)
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

### «Lo stato non disegna, la resa non muta» (storia P12, audit del passo F4)

Due lati, un contratto. Il **lato dello stato** manipola solo numeri ed eventi (x, y, vx, vy, vita, tick, fasi) e non sa che
esiste un canvas: `attori/` (`ferruccio.js`, `combattimento.js`, `nemico.js`, `ia/*`, `boss/*`, `gatto.js`, `bersaglio.js`,
`proiettili-nemici.js`, `passi.js`, `statistiche.js`, `effetti-doni.js`), `mondo/` (`fisica.js`, `stanza.js`, `porte.js`,
`generazione.js`, `modelli.js`, `camera.js`, `notte.js`, `hub.js`, `run.js`, `segreta.js`), `oggetti/*`, `storia/*`,
`persistenza/*`. Il **lato della resa** legge quei numeri e li traduce in pixel, senza mai assegnare un campo dello stato né
chiamare un `tick(`: `resa/` (`renderer.js`, `pixel-sprites.js`, `feel.js`, `fili.js`, `impatti.js`, `trasformazioni.js`,
`debug.js`), con accanto `ui/` e `interfaccia/` (DOM) e `audio/` (suoni dagli eventi). `fondazione/` e `avvio.js` sono la
cornice neutra. Conseguenze pratiche:

- ciò che è **solo visivo** (fotogrammi, durate di uno splash, curve, colori, sprite) nasce nella resa da un evento o da un
  numero dello stato: il fendente espone `stato`/`fase`/`faseTicks` e `resa/impatti.js › frameSpada` sceglie il fotogramma; il
  proiettile spento emette `ferruccio.proiettile_spento` {x, y, tipo, causa: muro|bersaglio|portata} e la resa anima lo splash;
  la Catena della Chiusa emette `ferruccio.fulmine` {x1, y1, x2, y2}; la camera espone `scala` e `scorrimento()` e
  `resa/trasformazioni.js › applicaCamera` fa `translate`/`scale`;
- l'**orologio della resa è il contatore dei tick** (`contaTick`), mai `performance.now`/`Date.now`: le animazioni seguono la
  simulazione (hit-stop compreso) e non il refresh dello schermo; le sole grandezze «per frame disegnato» sono le scosse di
  `resa.scossa` (storia P08), volute così dall'autore;
- `gioco/qa/architettura.test.mjs` fa rispettare il contratto con un grep programmatico (commenti esclusi): un `getContext`,
  `fillStyle`, `Path2D`, `ctx.`, un colore esadecimale o un `document.` in un file di stato è rosso; un import dello stato, un
  `.tick(` o un `performance.now` in `resa/` è rosso. Il contesto dell'IA dei nemici e dei boss si chiama `contesto`, non `ctx`.

### Passo fisso e tetto dei tick (verifica del passo F4)

`fondazione/tempo.js`: `PASSO_MS` = 1000/60, accumulatore, **`MAX_TICK_PER_FRAME` = 5** (un frame di 1000 ms esegue 5 tick e
scarta il resto: niente spirale della morte, dt reale limitato a 83 ms). `fondazione/ciclo.js` versa il timestamp del
`requestAnimationFrame` nell'accumulatore, esegue i tick dovuti e disegna **una volta per frame** con `alpha` in [0, 1). Il
renderer non interpola (disegna lo stato dell'ultimo tick) ma non dipende dal refresh: a 120 Hz metà dei frame non ha tick e
ridisegna la stessa scena. Prova: `fondazione.test.mjs` (orologio finto a 60, 120 e 144 Hz: 60 tick e stessa posizione dopo 1 s)
e `pagina.test.js` (rAF finto nella pagina vera: 120 frame da 8,33 ms e 60 da 16,67 ms danno gli stessi tick e la stessa x/y di
Ferruccio con `destra` tenuta).

### Game feel (storia P08, richieste testuali dell'autore)

- **I-frames**: `ferruccio.t_invuln` ≥ 1000 ms (`{1000, 1000, 1400}`); la sagoma lampeggia **semitrasparente** ad alpha
  `resa.lampeggio.alpha` (0,4) con semiperiodo `resa.lampeggio.semiperiodo_ms`, a partire dal tick del colpo (`resa/feel.js ›
  alphaSagoma`, applicato dal renderer con `globalAlpha`; `__gioco.resa.ultimoAlphaSagoma()` lo espone alla QA). Il **rimbalzo**
  all'indietro (`v_spinta`/`t_spinta`) vale per ogni fonte che chiama `subisciDanno({x, y})`: Colpo di contatto, proiettile nemico, pericolo.
- **Hit-stop**: `ciclo.congela(ms)` salta i tick di simulazione dovuti ai frame ma continua a disegnare (`contaFrame()` avanza,
  `congelato()` dice quanti tick restano); **non si somma** (vince la durata più lunga), quindi un fendente su più bersagli è un solo
  hit-stop. `avvio.js` collega `ferruccio.colpo` → `combattimento.feel.hit_stop_ms` (40 = 2 tick), `ferruccio.uccisione` →
  `hit_stop_uccisione_ms` (60), `ferruccio.parata` → `hit_stop_parata_ms` (90). I tick forzati di debug (`__gioco.tick(n)`) lo ignorano.
- **Knockback ∝ 1/peso**: `combattimento.js › spintaPerPeso` = `clamp(spinta / max(peso, feel.peso_min_spinta), feel.spinta_min,
  feel.spinta_max)`, 0 da `peso_inamovibile` in su; vale per fendente, affondo e proiettili di Ferruccio (vespa peso 0 → `spinta_max`,
  gatto 1 → `spinta_f`, guardia 2 → metà, statua/boss fermi).
- **Scossa contestuale** (`resa/feel.js`, dati `resa.scossa`): `ferruccio.colpo` 1,5 px × 2 frame, `ferruccio.parata`
  (`combattimento.feel.scossa_parata_px` × `parata_frame`), `bomba.esplosione` 5,5 px, `boss.atterraggio` (Re-Gatto) e
  `boss.mani_schianto` (Mani di Donna Luciana) 11 px × 10 frame. **Questi tre nomi di evento sono il contratto per le squadre oggetti e
  nemici**: basta emetterli sul bus. Nessuna scossa a riposo; con moto ridotto i px sono 0 (`moto-ridotto.json`).
- **Macchie permanenti**: a `nemico.morto` resta a terra una chiazza d'inchiostro di china (schegge di legno per `statua`, `guardia`,
  `bomba`), seminata con `derivato(rng, 'fx')`, per stanza (azzerata a `notte.stanza`); `__gioco.feel.macchie()` la espone. Il disegno
  sta in `resa/feel.js › disegnaMacchie`, chiamato dal renderer dopo gli schizzi dei colpi.

## Fili del Velo (storia P11, regola dell'autore 2026-11-09)

Ogni marionetta mossa dal Velo — tutti i nemici, i boss dei piani, gli NPC dell'hub — ha **sempre due fili d'oro**: uno che
scende dalla Mano sinistra e uno dalla Mano destra delle Grandi Mani (in alto a sinistra e a destra del proscenio; nella
stanza di Donna Luciana le Mani scese nel palco), attaccati alle due spalle (quota `resa.fili.ancoraggio_y` dell'altezza del
corpo dai piedi, scostate di `resa.fili.scarto_x` della mezza larghezza). Mai su Ferruccio e i personaggi giocabili, che hanno
spezzato i fili; Donna Luciana è la Marionettista e non pende. Il filo è una linea di `resa.fili.spessore` px (1), oro al
`resa.fili.alpha` (0,30), curva quadratica che pende di `resa.fili.curva_px`: niente alone, niente tratteggio, niente moncone
sul nemico. `resa/fili.js` calcola e disegna; il renderer raccoglie i corpi (`disegnaFiliMarionette`), porta le dita delle Mani
dal proscenio al palco (inverso di scossa + camera) e li tira prima di disegnare Ferruccio. `__gioco.resa.fili()` espone
`{marionette, fili, alpha, spessore, ancoraggio_y, scarto_x, curva_px}` dell'ultimo frame alla QA.

## Boss del pool, Donna Luciana, sipario e ciclo (storia P06, Teatro)

- **La run** (`mondo/run.js`): seme, piano, ciclo e i boss estratti senza ripetizione da `boss.json › pool` con il generatore derivato
  `boss-run` (stesso seme → stessi boss). Formule del Teatro: `pianoNelCiclo = ((p−1) mod 4)+1`, `ciclo = ⌊(p−1)/4⌋+1`,
  `moltCiclo = 1,45^(ciclo−1)`, `moltVelocita = min(1,55, 1+(p−1)×0,045)`, `vitaBoss = max(20, round((hpBaseTeatro + (pianoNelCiclo−1)×45) × moltCiclo))`
  (175/210/165/235/195, Donna Luciana 480: il danno di Ferruccio è quello del Teatro). Il boss del piano è `estratti[(p−1) mod 5]`,
  Donna Luciana sul 4° piano di ogni ciclo; **dopo di lei il ciclo continua** (piano 5 = ciclo 2, sipario del «BIS»), come nel Teatro.
- **I pattern** (`attori/boss/<id>.js`, numeri in `nemici.json › boss`): girano al posto dell'IA base dentro la fabbrica dei nemici
  (`pattern`), che resta padrona di vita, colpi, parata → stordimento (`t_stordito_boss`, poi `t_immunita_boss`), morte e bottino.
  Telegrafo SOLO sul corpo (regola dell'autore 2026-11-08): ogni attacco passa per `anticipo` (postura) e `lampo` (occhi rossi) dai
  tempi di `boss.comuni`, mai un segno a terra. Il corpo del boss ferisce al contatto (Teatro ~4705: `contatto_pesante`, parabile),
  non in volo; in volo oltre `quota_immune` i colpi gli passano sotto (Teatro ~3623). Furia sotto il 50 % di vita: cooldown `_furia`.
  Lo Spezzafili d'Ottone non ha un ramo nel `loop()` del Teatro (resterebbe fermo): il pattern è scritto dal nome (forbici).
- **Fine del boss**: `boss.sconfitto` {id: id di boss.json, archetipo, pattern, x, y}; il Medaglione di Rosa cade per l'archetipo
  `gatto` con `tonino_ricordo` null (regola del motore conservata); `boss_battuti` riceve l'`idStoria` (storia.json: Donna Luciana vi è
  stata aggiunta fra i boss, copia identica in `trama/storia.json`); la vittoria su Donna Luciana va nel profilo (`vittorie`, `ciclo_max`,
  evento `boss.finale_sconfitto`); `piano_max` lo registra il risveglio a `piano.completato`.
- **Il sipario** (`interfaccia/sipario.js`, testi `interfaccia.json › sipario`): a ogni `piano.discesa`, dopo il velo e la generazione del
  piano nuovo, con il ciclo in `pausa`; atto per piano nel ciclo (I-IV), «BIS» al piano 1 dei cicli successivi con il bonus del ciclo,
  titolo dell'atto IV dal ciclo 2; si alza con `conferma`/`scatto`, click o `__gioco.sipario.chiudi()`. Al piano 1 di una run non si
  alza: l'hub e le scene automatiche dell'ingresso fanno da atto I (decisione da confermare con l'autore).
- **HUD**: barra della vita del boss in alto al centro nell'HUD DOM del Teatro (`interfaccia/hud.js`, storia P13; titolo da `interfaccia.json › boss_hud` con
  piano e ciclo, cornice `hud-barra-boss`); `renderer.js › disegnaBarraVitaBoss` resta dietro l'opzione `barraBossNelRenderer` (false da `avvio.js`).

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
- Storie P04/P09 (squadra oggetti), decisioni e valori da confermare: `economia.json` tarato per la scarsità dell'autore (media 7,16 monete al piano 1 su 1000 piani
  simulati: `monete_segreta` 2, `monete_boss.s0` 0 → 1 moneta al piano 1, drop 0,12 invariato; le ricompense pre-estratte di `stanze.json` pesano ~4 e sono della squadra
  mondo); prezzi dell'autore 3/5/7/2 via `rar_pct` 140 % (la tabella `teatro.prezzo` di doni.json è storica, non letta); `patto.json › regole.raggio` (250/1200/100 ms, 35 % DMG
  per tick, 28 px, portata ×1,6) e `regole` dell'altare (100 %/60 %, 2 reliquie) dal Teatro; l'altare del Patto sta nella stanza del boss (nessuna stanza `patto` nel
  generatore); i patti non occupano i 5 slot; i proiettili di Ferruccio ora si fermano sui solidi `ferma_colpi` (prima li ignoravano); la segreta non combatte ancora (i
  mob dorati spettano alla squadra nemici) e lascia le monete alla pulizia.
- Rampa di accelerazione: `v_eff / t_accel` lineare (regola 2). Con 60 ms la diagonale di 1 s da
  fermo dà 215,1 px: dentro i 220 ± 5 del criterio per 0,1 px. Se `t_accel` sale, il criterio salta.
