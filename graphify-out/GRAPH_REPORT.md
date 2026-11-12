# Graph Report - Gioco  (2026-11-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1973 nodes · 5067 edges · 79 communities (77 shown, 2 thin omitted)
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 1373 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b226ddba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Ribalta, luci e ombre (b2-ribalta)
- Buca, terna e Camerini (d4-stanze-teatro)
- Partenza segreta (c1-partenza-segreta)
- Piazza Dante e storia (t4-hub-storia)
- Trasformazioni e sinergie (b4-trasformazioni)
- I 200 oggetti (b5-oggetti)
- Registro di Scena e trionfi (d3-registro-scena)
- Boss per piano (b6-boss)
- Immagini di scena (b9-immagini)
- Stanze speciali (a3-stanze-speciali)
- Varianti di stanza (b7-stanze)
- Riprendi la notte, mira assistita, conto (e6-assistenza)
- h2-memorie.js (h2-memorie)
- Disegno della stanza e HUD (60-resa)
- h3-gregorio.js (h3-gregorio)
- Cambio di scena e botole (d5-cambio-scena)
- Finali, Diario di Ferruccio e Voce (b8-finali-diario)
- Ampolle e carte (a2-consumabili)
- Registro delle notti (a7-registro-bilancio)
- Acquedotto Carolino (d6-acquedotto)
- Pubblico e sipario (b1-pubblico)
- Combattimento (40-combattimento)
- Economia e salvataggi (t3-economia-salvataggi)
- Bombe, chiavi e forzieri (a1-bombe-chiavi)
- Progressione e sblocchi (a6-progressione)
- Configurazione e tabelle di gioco (00-config)
- Stili dei personaggi (d2-personaggi)
- Comandi a tocco (c2-tocco)
- Oggetti e Diario degli oggetti (50-oggetti)
- Scontro col Grande Burattinaio (d1-burattinaio)
- Comandi, gamepad e opzioni (b3-comandi-opzioni)
- Finali, Diario di Ferruccio e Voce · diciB8() (b8-finali-diario)
- h4-ritorno-piazza.js (h4-ritorno-piazza)
- Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)
- Pubblico e sipario · suonaB1() (b1-pubblico)
- Finali, Diario di Ferruccio e Voce · ferruccioB8() (b8-finali-diario)
- Generatore della mappa (30-mappa)
- Rifiniture e Ragno della Seta (d7-rifiniture)
- Pubblico e sipario · limitaB1() (b1-pubblico)
- Varianti di stanza · drawTextFit() (b7-stanze)
- Comandi a tocco · installaC2() (c2-tocco)
- Pubblico e sipario · telaB1() (b1-pubblico)
- Varianti di stanza · suonoB7() (b7-stanze)
- Varianti di stanza · piazzaNemiciB7() (b7-stanze)
- Disegno di personaggi e boss (10-sprite)
- Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)
- Stato della notte (20-stato)
- Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)
- Comandi, gamepad e opzioni · tastieraB3() (b3-comandi-opzioni)
- Comandi, gamepad e opzioni · aggiornaPadB3() (b3-comandi-opzioni)
- Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)
- Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)
- Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)
- Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)
- Scontro col Grande Burattinaio · getSpriteTeatro() (d1-burattinaio)
- Varianti di stanza · puntaCiarlatanoB7() (b7-stanze)
- Rete di sicurezza degli errori (000-errori)
- Finali, Diario di Ferruccio e Voce · leggiDiarioB8() (b8-finali-diario)
- Comandi a tocco · dopoIlFrameC2() (c2-tocco)
- Scontro col Grande Burattinaio · avviaAttoD1() (d1-burattinaio)
- Qualità automatica (e4-prestazioni)
- Fogli di sprite (t2-sprite)
- Comandi, gamepad e opzioni · salvaOpzioni() (b3-comandi-opzioni)
- Scontro col Grande Burattinaio · disegnaArenaD1() (d1-burattinaio)
- Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)
- sim-economia.js (sim-economia)
- Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)
- Acquedotto Carolino · usaGrataD6() (d6-acquedotto)
- Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)
- Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)
- Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)
- Varianti di stanza · montaSecondoQuadroD5() (b7-stanze)
- Varianti di stanza · disegna() (b7-stanze)
- Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)
- Icone degli oggetti (b5-oggetti-icone)
- Varianti di stanza · disegnaOstacoloB7() (b7-stanze)
- Acquedotto Carolino · disegnaAriaD6() (d6-acquedotto)
- Audio (15-audio)
- Acquedotto Carolino · posaDonoD6() (d6-acquedotto)

## God Nodes (most connected - your core abstractions)
1. `mostraBanner()` - 73 edges
2. `drawTextFit()` - 59 edges
3. `rng()` - 53 edges
4. `passoLogico()` - 45 edges
5. `disegnaFrame()` - 42 edges
6. `statoB8()` - 34 edges
7. `danneggiaNemico()` - 33 edges
8. `scuoti()` - 33 edges
9. `drawPixelSprite()` - 32 edges
10. `entraInStanza()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `dopoIngressoBucaD4()` --calls--> `mostraBanner()`  [INFERRED]
  d4-stanze-teatro.js → 20-stato.js
- `minimappaCameriniD4()` --calls--> `maledizioneD()`  [INFERRED]
  d4-stanze-teatro.js → 40-combattimento.js
- `vestiCustodiD4()` --calls--> `rng()`  [INFERRED]
  d4-stanze-teatro.js → 20-stato.js
- `popolaStanza()` --calls--> `gruppoNemiciB7()`  [INFERRED]
  30-mappa.js → b7-stanze.js
- `disegnaRiflessiE6()` --calls--> `salvaOpzioni()`  [INFERRED]
  e6-assistenza.js → 00-config.js

## Import Cycles
- None detected.

## Communities (79 total, 2 thin omitted)

### Community 0 - "Ribalta, luci e ombre (b2-ribalta)"
Cohesion: 0.05
Nodes (71): agganciaStanza(), aggiungiRiparo(), alMorire(), altezzaDi(), atterra(), audioPronto(), contorna(), creaPezzi() (+63 more)

### Community 1 - "Buca, terna e Camerini (d4-stanze-teatro)"
Cohesion: 0.06
Nodes (71): MUSICA, aggiungiBucaD4(), alBattereD4(), alTempoD4(), applausoD4(), apriTernaD4(), astaD4(), avanzaOrologioD4() (+63 more)

### Community 2 - "Partenza segreta (c1-partenza-segreta)"
Cohesion: 0.07
Nodes (71): eArmaSpeciale(), apriArmeriaC1(), apriDialogoC1(), apriDomandaC1(), apriRicordoC1(), armeriaApertaC1(), avanzaScenaC1(), avviaScenaC1() (+63 more)

### Community 3 - "Piazza Dante e storia (t4-hub-storia)"
Cohesion: 0.08
Nodes (56): aCapo(), aggiornaHub(), aggiornaMorte(), apriDialogo(), apriDialogoC(), avanzaDialogo(), avviaMorte(), avvio() (+48 more)

### Community 4 - "Trasformazioni e sinergie (b4-trasformazioni)"
Cohesion: 0.06
Nodes (59): getSpriteCanvas(), aggiornaSinergieB4(), aloneB4(), aloniB4, ANCORE_B4, applicaEffettiB4(), apriPupazzoB4(), attivaTrasformazioneB4() (+51 more)

### Community 5 - "I 200 oggetti (b5-oggetti)"
Cohesion: 0.05
Nodes (62): usaOggettoAttivo(), aggiornaFamigliB5(), aggiornaMoltDannoB5(), aggiornaScieB5(), aggiornaSlotFucinaB5(), aggiungiSciaB5(), aggregaB5(), allaPuliziaB5() (+54 more)

### Community 6 - "Registro di Scena e trionfi (d3-registro-scena)"
Cohesion: 0.08
Nodes (52): annunciaTrionfoD3(), apertureD3(), apriRegistroScenaD3(), bossSconfittoD3(), cacheSagomeD3, cambiaSezioneD3(), chiudiRegistroScenaD3(), clickLibroD3() (+44 more)

### Community 7 - "Boss per piano (b6-boss)"
Cohesion: 0.07
Nodes (48): disegnaMobSprite(), accessoriGiostraB6(), accessoriLampionaioB6(), accessoriTessitriceB6(), alaCignoB6(), AZIONI_B6, azzeraMemoria(), b6 (+40 more)

### Community 8 - "Immagini di scena (b9-immagini)"
Cohesion: 0.09
Nodes (48): disegnaA1(), disegnaBombaAccesaA1(), disegnaForziereA1(), disegnaLucchettoA1(), bordoDockB1(), invalidaTeleB1(), aloneCaldoB9(), arredoImmagineB9() (+40 more)

### Community 9 - "Stanze speciali (a3-stanze-speciali)"
Cohesion: 0.11
Nodes (47): mostraBanner(), rng(), nomeD(), apriForziereA1(), estraiPesatoA1(), aggiungiStanzeSpecialiA3(), avviaSfidaA3(), avvisaA3() (+39 more)

### Community 10 - "Varianti di stanza (b7-stanze)"
Cohesion: 0.06
Nodes (42): analisiB7, arredaMappaB7(), CIARLATANO_B7, CLESSIDRA_B7, colpisciFragileB7(), COPPIE_B7, corpoSolidoB7(), CURVA_B7 (+34 more)

### Community 11 - "Riprendi la notte, mira assistita, conto (e6-assistenza)"
Cohesion: 0.07
Nodes (39): eseguiAttacco4Direzioni(), aCapoE6(), altroRiquadroE6(), angoloAssistitoE6(), arricchisciVoceE6(), ASSISTENZA_E6, campiPercorsoE6(), cancellaIstantaneaE6() (+31 more)

### Community 12 - "h2-memorie.js (h2-memorie)"
Cohesion: 0.09
Nodes (39): aggiornaPaginaBiancaH2(), aggiuntaDiarioH2(), ANIME_H2, ASSUNTA_H2, assuntaH2, assuntaInPiazzaH2(), azzera(), battuteAssuntaH2() (+31 more)

### Community 13 - "Disegno della stanza e HUD (60-resa)"
Cohesion: 0.10
Nodes (40): getQuartierePiano(), disegnaFerruccioPittorico(), disegnaManoMarionettaPittorica(), disegnaNemicoPittorico(), drawPixelSprite(), getCharCorrente(), sparaProiettiliDirezione(), descD() (+32 more)

### Community 14 - "h3-gregorio.js (h3-gregorio)"
Cohesion: 0.08
Nodes (34): angoloAH3(), apriConfrontoH3(), apriH3(), avviaMorteH3(), avviaScontroH3(), chiamaGuardieH3(), chiudiCortileH3(), diffAngH3() (+26 more)

### Community 15 - "Cambio di scena e botole (d5-cambio-scena)"
Cohesion: 0.10
Nodes (35): ticksDaMs(), paraColpoB5(), alonaD5(), aperturaBotolaD5(), avviaCambioD5(), BOTOLE_D5, buioCambioD5(), candidataD5() (+27 more)

### Community 16 - "Finali, Diario di Ferruccio e Voce (b8-finali-diario)"
Cohesion: 0.07
Nodes (38): b8, bossDelPianoCadutoB8(), bossSconfittoB8(), componiPaginaB8(), condizioneB8(), CONFIG_B8, DIARIO_B8, disegnaCordoneB8() (+30 more)

### Community 17 - "Ampolle e carte (a2-consumabili)"
Cohesion: 0.12
Nodes (38): aggiornaScalaA2(), applicaAmpollaA2(), applicaCartaA2(), conosciutiA2(), conosciutiMemoriaA2, CONS_A2, CONS_A2_AMPOLLE, CONS_A2_CARTE (+30 more)

### Community 18 - "Registro delle notti (a7-registro-bilancio)"
Cohesion: 0.10
Nodes (35): a7, aCapoA7(), azzera(), bossSconfittoA7(), CONFIG_A7, contaLucchettiA7(), controllaAbbandonoA7(), disegnaPergamenaA7() (+27 more)

### Community 19 - "Acquedotto Carolino (d6-acquedotto)"
Cohesion: 0.06
Nodes (27): ACQUEDOTTO_D6, ARREDI_D6, AZIONI_D6, azzeraVentoD6(), BOSS_D6, d6, DISEGNI_NEMICI_D6, fraD6() (+19 more)

### Community 20 - "Pubblico e sipario (b1-pubblico)"
Cohesion: 0.07
Nodes (20): audioB1, bordiSiparioB1, candeleB1, COLORI_B1, datiSagomaB1(), disegnaSagomaSpettatoreB1(), disegnaTeatroB1(), ELEMENTI_B1 (+12 more)

### Community 21 - "Combattimento (40-combattimento)"
Cohesion: 0.13
Nodes (38): apriMuroSegreto(), aggiornaFamigliOrbitaliD(), aggiornaProiettileD(), applicaSpinta(), bloccaProiettiliNemiciD(), congela(), danneggiaNemico(), esplodiD() (+30 more)

### Community 22 - "Economia e salvataggi (t3-economia-salvataggi)"
Cohesion: 0.10
Nodes (25): testoToccoD7(), aggiornaBottoneAudio(), aggiornaRaggio(), aggiungiScintille(), cancellaSlot(), chiudiCancella(), dataBreve(), direzioneFrecce() (+17 more)

### Community 23 - "Bombe, chiavi e forzieri (a1-bombe-chiavi)"
Cohesion: 0.12
Nodes (21): aggiornaBombeA1(), aggiungiBombe(), aggiungiChiavi(), applicaLucchettiA1(), avvisoA1(), BOMBE_CHIAVI_A1, dropPuliziaA1(), generaForziere() (+13 more)

### Community 24 - "Progressione e sblocchi (a6-progressione)"
Cohesion: 0.14
Nodes (27): a6, aCapoA6(), alternativaVeraA6(), avvisaBloccatoA6(), azzeraSblocchi(), bossSconfittoA6(), CONFIG_A6, controllaA6() (+19 more)

### Community 25 - "Configurazione e tabelle di gioco (00-config)"
Cohesion: 0.06
Nodes (30): ARENA, BOSS_A, BOSS_FINALE, canvas, CATALOGO_OGGETTI, CATALOGO_PATTO, CATALOGO_SEGRETO, ctx (+22 more)

### Community 26 - "Stili dei personaggi (d2-personaggi)"
Cohesion: 0.10
Nodes (21): colpisciMuroSegretoC(), levaToccoC2(), arcoMaglioD2(), colpoMaglioD2(), conSpettraliD2(), d2, inScenaD2(), lampoD2() (+13 more)

### Community 27 - "Comandi a tocco (c2-tocco)"
Cohesion: 0.10
Nodes (27): adattaRisoluzione(), AVVIO_LEGGERO_C2, c2, clickSulPalcoC2(), creaBottoneC2(), creaStratoC2(), disegnaLevaC2(), ICONE_C2 (+19 more)

### Community 28 - "Oggetti e Diario degli oggetti (50-oggetti)"
Cohesion: 0.14
Nodes (30): effettiNotteC(), popolaStanza(), maledizioneD(), acquisisciOggettoConLimite5Slot(), ARMI_SPECIALI_INTERCAMBIABILI, cellaDiarioD(), clickDiarioD(), conosciutiD() (+22 more)

### Community 29 - "Scontro col Grande Burattinaio (d1-burattinaio)"
Cohesion: 0.14
Nodes (21): aTerraManoD1(), audioD1(), avviaVittoriaD1(), BURATTINAIO_D1, calaMarionettaD1(), capoD1(), colpisciGiocatoreD1(), d1 (+13 more)

### Community 30 - "Comandi, gamepad e opzioni (b3-comandi-opzioni)"
Cohesion: 0.09
Nodes (25): offsetScossa(), b3, BOTTONE_MENU_B3, CANONICO_B3, COMANDI_B3, DIR_B3, disegnaAggiuntePausaB3(), MENU_PAUSA_B3 (+17 more)

### Community 31 - "Finali, Diario di Ferruccio e Voce · diciB8() (b8-finali-diario)"
Cohesion: 0.14
Nodes (21): accodaDidB8(), aggiornaDidB8(), cadutaB8(), contestoFinaleB8(), dialogoT4B8(), diciB8(), didLiberaB8(), disegnaSopraGiocoB8() (+13 more)

### Community 32 - "h4-ritorno-piazza.js (h4-ritorno-piazza)"
Cohesion: 0.13
Nodes (19): bB8(), disegnaRastrellieraH4(), disegnaUscitaH4(), dopoLucianaH4(), ferriPresiH4(), forzaH4(), h4, logicaH4() (+11 more)

### Community 33 - "Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)"
Cohesion: 0.18
Nodes (29): getNumeroNotte(), aggiungiPaginaB8(), apriPortaB8(), daiFerroB8(), disegnaPortaB8(), dopoMorteB8(), dopoRicominciaB8(), esitoBussataB8() (+21 more)

### Community 34 - "Pubblico e sipario · suonaB1() (b1-pubblico)"
Cohesion: 0.18
Nodes (14): contestoB1(), dopoFrameSiparioB1(), rumoreB1(), siparioChiusoB1(), suonaB1(), SUONATORI_B1, suonoApplausoB1(), suonoMovimentoSiparioB1() (+6 more)

### Community 35 - "Finali, Diario di Ferruccio e Voce · ferruccioB8() (b8-finali-diario)"
Cohesion: 0.16
Nodes (21): colpoRitmoB8(), daQuandoB8(), fabbroB8(), ferruccioB8(), fondaleCieloB8(), fondaleFucinaB8(), fondaleManiB8(), fondalePalcoB8() (+13 more)

### Community 36 - "Generatore della mappa (30-mappa)"
Cohesion: 0.15
Nodes (21): shuffle(), allontanaNemiciDallePorteC(), avviaPiano(), entraInStanza(), ENTRATE_C, generaMappaPiano(), numeroStanzeCombattimento(), PORTE_C (+13 more)

### Community 37 - "Rifiniture e Ragno della Seta (d7-rifiniture)"
Cohesion: 0.16
Nodes (17): tastoDiarioD(), disegnaMacchie(), aloneProiettileD7(), cambiaStatoRagnoD7(), casoRagnoD7(), disegnaArenaLucianaD7(), disegnaSetaD7(), hashD7() (+9 more)

### Community 38 - "Pubblico e sipario · limitaB1() (b1-pubblico)"
Cohesion: 0.12
Nodes (28): aggiungiVoceB1(), colpoSubitoB1(), coroB1(), disegnaForziereInVoloB1(), disegnaVoliB1(), dopoMonetaB1(), fermaSipario(), fonteBuffaB1() (+20 more)

### Community 39 - "Varianti di stanza · drawTextFit() (b7-stanze)"
Cohesion: 0.16
Nodes (14): drawPillLabel(), drawTextFit(), spriteD(), disegnaArrediA3(), disegnaBottoneBloccatoA6(), perPaginaPannelloB5(), disegnaCiarlatanoB7(), disegnaSacchiB7() (+6 more)

### Community 40 - "Comandi a tocco · installaC2() (c2-tocco)"
Cohesion: 0.19
Nodes (19): aggiornaClassiC2(), attivaC2(), bottoneGiuC2(), disattivaC2(), disponiC2(), firmaDisposizioneC2(), installaC2(), lasciaSpegnereC2() (+11 more)

### Community 41 - "Pubblico e sipario · telaB1() (b1-pubblico)"
Cohesion: 0.14
Nodes (22): altezzaLatiB1(), disegnaFondoZonaB1(), disegnaFronteZonaB1(), disegnaLumiZonaB1(), disegnaSiparioB1(), disegnaSpettatoreB1(), disegnaTendeB1(), disegnaTestiSiparioB1() (+14 more)

### Community 42 - "Varianti di stanza · suonoB7() (b7-stanze)"
Cohesion: 0.33
Nodes (9): accendiBombaB7(), aggiornaOlioB7(), fineManoB7(), pagaManoB7(), passoCiarlatanoB7(), passoClessidraB7(), scadeClessidraB7(), suonoB7() (+1 more)

### Community 43 - "Varianti di stanza · piazzaNemiciB7() (b7-stanze)"
Cohesion: 0.16
Nodes (18): analizzaVarianteB7(), applicaDisposizioneB7(), arredaStanzaB7(), cellaB7(), creaNemiciB7(), elementiVarianteB7(), estraiPesatoB7(), liberaRagnoB7() (+10 more)

### Community 44 - "Disegno di personaggi e boss (10-sprite)"
Cohesion: 0.15
Nodes (13): caricaSpriteTeatro(), CARTELLE_SPRITE_V2, disegnaBossDaImmagineA(), disegnaBossPittorico(), disegnaGattoSprite(), getGattoImage(), SPRITE_BOSS_A, SPRITE_OGGETTI (+5 more)

### Community 45 - "Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)"
Cohesion: 0.30
Nodes (15): attivaRigaB3(), avvisoB3(), cambiaPaginaB3(), cambiaSchermoInteroB3(), chiudiOpzioniB3(), clamp01B3(), clickOpzioniB3(), impostaOpzioneB3() (+7 more)

### Community 46 - "Stato della notte (20-stato)"
Cohesion: 0.22
Nodes (16): avviaPartitaConPersonaggio(), incrementaNumeroNotte(), nuovaRun(), player, ricalcolaStatistiche(), ricominciaNotte(), selezionaPersonaggio(), statoRun (+8 more)

### Community 47 - "Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)"
Cohesion: 0.12
Nodes (24): stanza(), aggiornaFinaleB8(), applicaBattutaB8(), apriDiarioB8(), audioB8(), avanzaCartB8(), avanzaFinaleB8(), bussaB8() (+16 more)

### Community 48 - "Comandi, gamepad e opzioni · tastieraB3() (b3-comandi-opzioni)"
Cohesion: 0.20
Nodes (14): aggiornaAdattaB3(), apriDiarioDirettoB3(), bloccaB3(), contestoB3(), coordB3(), dentroB3(), filtroIngressiB3(), liberoB3() (+6 more)

### Community 49 - "Comandi, gamepad e opzioni · aggiornaPadB3() (b3-comandi-opzioni)"
Cohesion: 0.21
Nodes (14): aggiornaPadB3(), apriOpzioniB3(), attivaVocePausaB3(), direzioneMovimentoB3(), direzioneNavB3(), direzioneSparoB3(), inviaTastoB3(), navRipetiB3() (+6 more)

### Community 50 - "Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)"
Cohesion: 0.36
Nodes (8): avviaFinaleB8(), chiudiDiarioB8(), clickDiarioB8(), entraSopraLaRibaltaB8(), finaleSopraLaRibaltaB8(), rigaFinaleB8(), tastoDiarioB8(), vociFinaliB8()

### Community 51 - "Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)"
Cohesion: 0.24
Nodes (12): arcoPalcoLatoB1(), candelaB1(), davanzaleB1(), disegnaBalconataFronteB1(), disegnaMantovanaB1(), disegnaPalcoLatoFondoB1(), disegnaPalcoLatoFronteB1(), disegnaTeloSiparioB1() (+4 more)

### Community 52 - "Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)"
Cohesion: 0.24
Nodes (12): adattaTestoB3(), altezzaRigaB3(), disegnaOpzioniB3(), disegnaRigaOpzioniB3(), dopoIlFrameB3(), etichettaTastoB3(), inToccoB3(), simboloB3() (+4 more)

### Community 53 - "Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)"
Cohesion: 0.30
Nodes (12): aCapoB8(), boccascenaB8(), disegnaCartiglioB8(), disegnaDiarioB8(), disegnaDidB8(), disegnaFinaleB8(), disegnaSceltaB8(), fondaleNeroB8() (+4 more)

### Community 54 - "Scontro col Grande Burattinaio · getSpriteTeatro() (d1-burattinaio)"
Cohesion: 0.27
Nodes (11): disegnaCellaTeatro(), getSpriteTeatro(), registraVoceBossB8(), disegnaEffettiD1(), disegnaForbiciD1(), disegnaForbiciFoglioD1(), disegnaForbiciSagomaD1(), disegnaGuantoD1() (+3 more)

### Community 55 - "Varianti di stanza · puntaCiarlatanoB7() (b7-stanze)"
Cohesion: 0.32
Nodes (8): chiudiCiarlatanoB7(), clickCiarlatanoB7(), nuovaManoB7(), puntaCiarlatanoB7(), rettPostaB7(), scegliCiarlatanoB7(), scegliScatolaB7(), tastoCiarlatanoB7()

### Community 56 - "Rete di sicurezza degli errori (000-errori)"
Cohesion: 0.31
Nodes (9): aggiornaRiquadroErrori(), ERRORI_TEATRO, fusibileScenaTeatro(), RETE_ERRORI, ripulisciContestoTeatro(), segnalaErroreTeatro(), testoErroriTeatro(), iniziaFrame() (+1 more)

### Community 57 - "Finali, Diario di Ferruccio e Voce · leggiDiarioB8() (b8-finali-diario)"
Cohesion: 0.32
Nodes (8): azzera(), chiaveDiarioB8(), disegnaLinguettaB8(), leggiDiarioB8(), normalizzaB8(), scriviDiarioB8(), slotB8(), vuotoB8()

### Community 58 - "Comandi a tocco · dopoIlFrameC2() (c2-tocco)"
Cohesion: 0.31
Nodes (9): aggiornaVistaC2(), dopoIlFrameC2(), rilasciaBottoneC2(), schermoInteroAttivoC2(), schermoInteroC2(), schermoInteroPossibileC2(), statoBottoniC2(), vistaC2() (+1 more)

### Community 59 - "Scontro col Grande Burattinaio · avviaAttoD1() (d1-burattinaio)"
Cohesion: 0.31
Nodes (9): avviaAttoD1(), creaStanzaD1(), nuovaManoD1(), nuovaParteD1(), provaBurattinaioD1(), scontroSopraLaRibaltaD1(), sigilliDaNumeroD1(), vitaD1() (+1 more)

### Community 60 - "Qualità automatica (e4-prestazioni)"
Cohesion: 0.31
Nodes (7): azzera(), e4, passoQualitaE4(), QUALITA_E4, qualitaAutoAttivaE4(), riaccendiTuttoE4(), RIGA_E4

### Community 61 - "Fogli di sprite (t2-sprite)"
Cohesion: 0.39
Nodes (7): boss(), disegnaFotogramma(), dopoNemici(), nemico(), personaggio(), posaBoss(), posaNemico()

### Community 62 - "Comandi, gamepad e opzioni · salvaOpzioni() (b3-comandi-opzioni)"
Cohesion: 0.32
Nodes (8): salvaOpzioni(), assegnaTastoB3(), catturaTastoB3(), ricostruisciTastiB3(), rilasciaTuttoB3(), ripristinaTastiB3(), riservatoB3(), tastiValidiB3()

### Community 63 - "Scontro col Grande Burattinaio · disegnaArenaD1() (d1-burattinaio)"
Cohesion: 0.29
Nodes (8): disegnaArenaD1(), disegnaCapoD1(), disegnaCordeD1(), disegnaOmbraCapoFoglioD1(), disegnaSquarcioD1(), nuovaTelaD1(), preparaFondoD1(), preparaTraviD1()

### Community 64 - "Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)"
Cohesion: 0.25
Nodes (8): casoFissoD6(), dipingiFondaleD6(), dipingiQuintaD6(), disegnaCanaleD6(), disegnaDrappoD6(), disegnaFiaccolaD6(), disegnaLuogoD6(), telaPavimentoD6()

### Community 65 - "sim-economia.js (sim-economia)"
Cohesion: 0.25
Nodes (5): n, path, r, radice, { spawnSync }

### Community 66 - "Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)"
Cohesion: 0.17
Nodes (16): aggiornaBrusioB1(), aggiornaPubblicoB1(), aggiornaVoliB1(), allineaStanzaB1(), atterraPremioB1(), atterraTuttoB1(), azzeraPubblicoB1(), bufferB1() (+8 more)

### Community 67 - "Acquedotto Carolino · usaGrataD6() (d6-acquedotto)"
Cohesion: 0.40
Nodes (6): grata(), grataQuiD6(), prendiAcquedottoD6(), segnaAcquedottoD6(), suonoAcquaD6(), usaGrataD6()

### Community 68 - "Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.43
Nodes (7): cerchiAcquaD6(), chinaD6(), disegnaGuardianoD6(), otreD6(), puntoD6(), trattoD6(), tridenteD6()

### Community 69 - "Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)"
Cohesion: 0.29
Nodes (7): corrente(), correnteInD6(), dopoIlPassoD6(), fuoriDagliOstacoliD6(), limitaD6(), muoviD6(), volaD6()

### Community 70 - "Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.29
Nodes (7): entraStatoD6(), iaGuardianoD6(), nuovaAcquaD6(), prossimoStatoD6(), valoreD6(), versoGiocatoreD6(), leggi()

### Community 71 - "Varianti di stanza · montaSecondoQuadroD5() (b7-stanze)"
Cohesion: 0.40
Nodes (5): dopoIngressoB7(), puntoValidoB7(), sistemaNemiciB7(), fuoriDagliArrediD5(), montaSecondoQuadroD5()

### Community 72 - "Varianti di stanza · disegna() (b7-stanze)"
Cohesion: 0.50
Nodes (5): ombraB7(), rettB7(), sagomaB7(), bloccoTufoD6(), disegna()

### Community 73 - "Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)"
Cohesion: 0.40
Nodes (5): aggiornaVentoD6(), piegaProiettileD6(), rumoreD6(), soffioD6(), suonoVentoD6()

### Community 75 - "Varianti di stanza · disegnaOstacoloB7() (b7-stanze)"
Cohesion: 0.67
Nodes (4): disegnaOstacoloB7(), timbroB7(), arredoD6(), disegnaArredoD6()

### Community 76 - "Acquedotto Carolino · disegnaAriaD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): disegnaAriaD6(), ombraD6(), pannoD6(), piegaVentoD6()

### Community 78 - "Acquedotto Carolino · posaDonoD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): acquedottoAttivoD6(), guardianoSconfittoD6(), intonaD6(), posaDonoD6()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `passoLogico()` connect `Combattimento (40-combattimento)` to `Ribalta, luci e ombre (b2-ribalta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Partenza segreta (c1-partenza-segreta)`, `Trasformazioni e sinergie (b4-trasformazioni)`, `I 200 oggetti (b5-oggetti)`, `Registro di Scena e trionfi (d3-registro-scena)`, `Boss per piano (b6-boss)`, `Stanze speciali (a3-stanze-speciali)`, `Varianti di stanza (b7-stanze)`, `Riprendi la notte, mira assistita, conto (e6-assistenza)`, `h2-memorie.js (h2-memorie)`, `h3-gregorio.js (h3-gregorio)`, `Cambio di scena e botole (d5-cambio-scena)`, `Ampolle e carte (a2-consumabili)`, `Registro delle notti (a7-registro-bilancio)`, `Acquedotto Carolino (d6-acquedotto)`, `Pubblico e sipario (b1-pubblico)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Stili dei personaggi (d2-personaggi)`, `Scontro col Grande Burattinaio (d1-burattinaio)`, `Generatore della mappa (30-mappa)`, `Rifiniture e Ragno della Seta (d7-rifiniture)`, `Stato della notte (20-stato)`, `Rete di sicurezza degli errori (000-errori)`?**
  _High betweenness centrality (0.227) - this node is a cross-community bridge._
- **Are the 71 inferred relationships involving `mostraBanner()` (e.g. with `apriMuroSegreto()` and `entraInStanza()`) actually correct?**
  _`mostraBanner()` has 71 INFERRED edges - model-reasoned connections that need verification._
- **Should `Ribalta, luci e ombre (b2-ribalta)` be split into smaller, more focused modules?**
  _Cohesion score 0.05339506172839506 - nodes in this community are weakly interconnected._
- **Why does `disegnaStanzaPixelArt()` connect `Disegno della stanza e HUD (60-resa)` to `Ribalta, luci e ombre (b2-ribalta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `h4-ritorno-piazza.js (h4-ritorno-piazza)`, `Generatore della mappa (30-mappa)`, `Immagini di scena (b9-immagini)`, `Stanze speciali (a3-stanze-speciali)`, `Varianti di stanza (b7-stanze)`, `h2-memorie.js (h2-memorie)`, `h3-gregorio.js (h3-gregorio)`, `Cambio di scena e botole (d5-cambio-scena)`, `Finali, Diario di Ferruccio e Voce (b8-finali-diario)`, `Acquedotto Carolino (d6-acquedotto)`, `Pubblico e sipario (b1-pubblico)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Scontro col Grande Burattinaio (d1-burattinaio)`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Are the 57 inferred relationships involving `drawTextFit()` (e.g. with `disegnaCartiglioD()` and `disegnaDiarioD()`) actually correct?**
  _`drawTextFit()` has 57 INFERRED edges - model-reasoned connections that need verification._
- **Should `Buca, terna e Camerini (d4-stanze-teatro)` be split into smaller, more focused modules?**
  _Cohesion score 0.058126619770455384 - nodes in this community are weakly interconnected._
- **Why does `entraInStanza()` connect `Generatore della mappa (30-mappa)` to `Ribalta, luci e ombre (b2-ribalta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Registro di Scena e trionfi (d3-registro-scena)`, `Boss per piano (b6-boss)`, `Stanze speciali (a3-stanze-speciali)`, `Varianti di stanza (b7-stanze)`, `Disegno della stanza e HUD (60-resa)`, `Stato della notte (20-stato)`, `Cambio di scena e botole (d5-cambio-scena)`, `Finali, Diario di Ferruccio e Voce (b8-finali-diario)`, `Ampolle e carte (a2-consumabili)`, `Registro delle notti (a7-registro-bilancio)`, `Acquedotto Carolino (d6-acquedotto)`, `h3-gregorio.js (h3-gregorio)`, `Combattimento (40-combattimento)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Scontro col Grande Burattinaio · avviaAttoD1() (d1-burattinaio)`, `Oggetti e Diario degli oggetti (50-oggetti)`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._