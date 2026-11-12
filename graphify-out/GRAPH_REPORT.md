# Graph Report - Gioco  (2026-11-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2070 nodes · 5319 edges · 80 communities (78 shown, 2 thin omitted)
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 1441 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7bdf135a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Ribalta, luci e ombre (b2-ribalta)
- Ampolle e carte (a2-consumabili)
- Buca, terna e Camerini (d4-stanze-teatro)
- Partenza segreta (c1-partenza-segreta)
- I 200 oggetti (b5-oggetti)
- Piazza Dante e storia (t4-hub-storia)
- Trasformazioni e sinergie (b4-trasformazioni)
- Comandi a tocco (c2-tocco)
- Registro di Scena e trionfi (d3-registro-scena)
- h5-sottopalco.js (h5-sottopalco)
- Boss per piano (b6-boss)
- Comandi, gamepad e opzioni (b3-comandi-opzioni)
- Immagini di scena (b9-immagini)
- Disegno della stanza e HUD (60-resa)
- Varianti di stanza (b7-stanze)
- h2-memorie.js (h2-memorie)
- Stanze speciali (a3-stanze-speciali)
- h3-gregorio.js (h3-gregorio)
- Finali, Diario di Ferruccio e Voce (b8-finali-diario)
- h1-agnese-taddeo.js (h1-agnese-taddeo)
- Acquedotto Carolino (d6-acquedotto)
- Cambio di scena e botole (d5-cambio-scena)
- Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)
- Economia e salvataggi (t3-economia-salvataggi)
- Oggetti e Diario degli oggetti (50-oggetti)
- Combattimento (40-combattimento)
- Progressione e sblocchi (a6-progressione)
- Configurazione e tabelle di gioco (00-config)
- Pubblico e sipario (b1-pubblico)
- Riprendi la notte, mira assistita, conto (e6-assistenza)
- Scontro col Grande Burattinaio (d1-burattinaio)
- Bombe, chiavi e forzieri (a1-bombe-chiavi)
- Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)
- h4-ritorno-piazza.js (h4-ritorno-piazza)
- Stili dei personaggi (d2-personaggi)
- Stato della notte (20-stato)
- Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)
- Generatore della mappa (30-mappa)
- Rifiniture e Ragno della Seta (d7-rifiniture)
- Pubblico e sipario · telaB1() (b1-pubblico)
- Pubblico e sipario · limitaB1() (b1-pubblico)
- Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)
- Disegno di personaggi e boss (10-sprite)
- Varianti di stanza · suonoB7() (b7-stanze)
- Finali, Diario di Ferruccio e Voce · diciB8() (b8-finali-diario)
- Pubblico e sipario · disegnaSiparioB1() (b1-pubblico)
- Varianti di stanza · allestisciB7() (b7-stanze)
- Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)
- Finali, Diario di Ferruccio e Voce · componiPaginaB8() (b8-finali-diario)
- Scontro col Grande Burattinaio · getSpriteTeatro() (d1-burattinaio)
- Oggetti e Diario degli oggetti · drawTextFit() (50-oggetti)
- Pubblico e sipario · bufferB1() (b1-pubblico)
- Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)
- Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)
- Varianti di stanza · analizzaVarianteB7() (b7-stanze)
- Rete di sicurezza degli errori (000-errori)
- Pubblico e sipario · tick() (b1-pubblico)
- Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)
- Scontro col Grande Burattinaio · avviaAttoD1() (d1-burattinaio)
- Qualità automatica (e4-prestazioni)
- Fogli di sprite (t2-sprite)
- Finali, Diario di Ferruccio e Voce · leggiDiarioB8() (b8-finali-diario)
- Finali, Diario di Ferruccio e Voce · bossSconfittoB8() (b8-finali-diario)
- Scontro col Grande Burattinaio · disegnaArenaD1() (d1-burattinaio)
- Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)
- sim-economia.js (sim-economia)
- Acquedotto Carolino · usaGrataD6() (d6-acquedotto)
- Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)
- Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)
- Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)
- Riprendi la notte, mira assistita, conto · chiaveRipresaE6() (e6-assistenza)
- Varianti di stanza · disegna() (b7-stanze)
- Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)
- Riprendi la notte, mira assistita, conto · istantaneaE6() (e6-assistenza)
- Icone degli oggetti (b5-oggetti-icone)
- Varianti di stanza · disegnaOstacoloB7() (b7-stanze)
- Acquedotto Carolino · posaDonoD6() (d6-acquedotto)
- Acquedotto Carolino · disegnaAriaD6() (d6-acquedotto)
- Audio (15-audio)
- Riprendi la notte, mira assistita, conto · riprendiNotteE6() (e6-assistenza)

## God Nodes (most connected - your core abstractions)
1. `mostraBanner()` - 76 edges
2. `drawTextFit()` - 63 edges
3. `rng()` - 59 edges
4. `passoLogico()` - 47 edges
5. `disegnaFrame()` - 42 edges
6. `entraInStanza()` - 36 edges
7. `statoB8()` - 34 edges
8. `danneggiaNemico()` - 33 edges
9. `scuoti()` - 33 edges
10. `drawPixelSprite()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `ricalcolaStatistiche()` --calls--> `medaglioneC()`  [INFERRED]
  20-stato.js → 00-config.js
- `azzeraTrasformazioniQA()` --calls--> `ricalcolaStatistiche()`  [INFERRED]
  b4-trasformazioni.js → 20-stato.js
- `popolaStanza()` --calls--> `gruppoNemiciB7()`  [INFERRED]
  30-mappa.js → b7-stanze.js
- `presenze()` --calls--> `assuntaInPiazzaH2()`  [INFERRED]
  t4-hub-storia.js → h2-memorie.js
- `maschereInMoneteD2()` --calls--> `mostraBanner()`  [INFERRED]
  d2-personaggi.js → 20-stato.js

## Import Cycles
- None detected.

## Communities (80 total, 2 thin omitted)

### Community 0 - "Ribalta, luci e ombre (b2-ribalta)"
Cohesion: 0.05
Nodes (74): agganciaStanza(), aggiungiRiparo(), alMorire(), altezzaDi(), atterra(), audioPronto(), contorna(), creaPezzi() (+66 more)

### Community 1 - "Ampolle e carte (a2-consumabili)"
Cohesion: 0.06
Nodes (71): ricalcolaStatistiche(), aggiornaScalaA2(), applicaAmpollaA2(), applicaCartaA2(), conosciutiA2(), conosciutiMemoriaA2, CONS_A2, CONS_A2_AMPOLLE (+63 more)

### Community 2 - "Buca, terna e Camerini (d4-stanze-teatro)"
Cohesion: 0.06
Nodes (70): MUSICA, aggiungiBucaD4(), alBattereD4(), alTempoD4(), applausoD4(), apriTernaD4(), astaD4(), avanzaOrologioD4() (+62 more)

### Community 3 - "Partenza segreta (c1-partenza-segreta)"
Cohesion: 0.07
Nodes (70): eArmaSpeciale(), apriArmeriaC1(), apriDialogoC1(), apriDomandaC1(), apriRicordoC1(), armeriaApertaC1(), avanzaScenaC1(), avviaScenaC1() (+62 more)

### Community 4 - "I 200 oggetti (b5-oggetti)"
Cohesion: 0.06
Nodes (61): aggiornaFamigliB5(), aggiornaMoltDannoB5(), aggiornaScieB5(), aggiornaSlotFucinaB5(), aggiungiSciaB5(), aggregaB5(), allaPuliziaB5(), allaUccisioneB5() (+53 more)

### Community 5 - "Piazza Dante e storia (t4-hub-storia)"
Cohesion: 0.08
Nodes (57): scena(), aCapo(), aggiornaHub(), aggiornaMorte(), apriDialogo(), apriDialogoC(), avanzaDialogo(), avviaMorte() (+49 more)

### Community 6 - "Trasformazioni e sinergie (b4-trasformazioni)"
Cohesion: 0.05
Nodes (61): getSpriteCanvas(), sparaProiettiliDirezione(), aggiornaSinergieB4(), aloneB4(), aloniB4, ANCORE_B4, applicaEffettiB4(), apriPupazzoB4() (+53 more)

### Community 7 - "Comandi a tocco (c2-tocco)"
Cohesion: 0.08
Nodes (56): adattaRisoluzione(), contestoB3(), segnaDispositivoB3(), aggiornaClassiC2(), aggiornaVistaC2(), attivaC2(), AVVIO_LEGGERO_C2, bottoneGiuC2() (+48 more)

### Community 8 - "Registro di Scena e trionfi (d3-registro-scena)"
Cohesion: 0.08
Nodes (52): annunciaTrionfoD3(), apertureD3(), apriRegistroScenaD3(), bossSconfittoD3(), cacheSagomeD3, cambiaSezioneD3(), chiudiRegistroScenaD3(), clickLibroD3() (+44 more)

### Community 9 - "h5-sottopalco.js (h5-sottopalco)"
Cohesion: 0.06
Nodes (53): iaNemicoD6(), aloneH5(), apriCassaH5(), caduteH5(), calaSaccoH5(), cassaProntaH5(), chiaveNotteH5(), creaSottopalcoH5() (+45 more)

### Community 10 - "Boss per piano (b6-boss)"
Cohesion: 0.07
Nodes (48): disegnaMobSprite(), accessoriGiostraB6(), accessoriLampionaioB6(), accessoriTessitriceB6(), alaCignoB6(), AZIONI_B6, azzeraMemoria(), b6 (+40 more)

### Community 11 - "Comandi, gamepad e opzioni (b3-comandi-opzioni)"
Cohesion: 0.07
Nodes (58): offsetScossa(), rettBottonePausaA7(), aggiornaAdattaB3(), aggiornaPadB3(), apriDiarioDirettoB3(), apriOpzioniB3(), assegnaTastoB3(), attivaVocePausaB3() (+50 more)

### Community 12 - "Immagini di scena (b9-immagini)"
Cohesion: 0.11
Nodes (39): invalidaTeleB1(), disegnaClessidraB7(), aloneCaldoB9(), arredoImmagineB9(), cartiglioOpzioniB9(), CONFIG_B9, contaB9(), disegnaCavoB9() (+31 more)

### Community 13 - "Disegno della stanza e HUD (60-resa)"
Cohesion: 0.12
Nodes (33): getQuartierePiano(), disegnaFerruccioPittorico(), disegnaManoMarionettaPittorica(), disegnaNemicoPittorico(), drawPixelSprite(), getCharCorrente(), cellaPannelloB(), clickPannelloB() (+25 more)

### Community 14 - "Varianti di stanza (b7-stanze)"
Cohesion: 0.06
Nodes (44): analisiB7, arredaMappaB7(), chiudiCiarlatanoB7(), CIARLATANO_B7, CLESSIDRA_B7, clickCiarlatanoB7(), colpisciFragileB7(), COPPIE_B7 (+36 more)

### Community 15 - "h2-memorie.js (h2-memorie)"
Cohesion: 0.09
Nodes (40): aggiornaPaginaBiancaH2(), aggiuntaDiarioH2(), ANIME_H2, ASSUNTA_H2, assuntaH2, assuntaInPiazzaH2(), azzera(), battuteAssuntaH2() (+32 more)

### Community 16 - "Stanze speciali (a3-stanze-speciali)"
Cohesion: 0.10
Nodes (50): mostraBanner(), rng(), verificaStanzaPulita(), nomeD(), apriForziereA1(), estraiPesatoA1(), aggiungiStanzeSpecialiA3(), avviaSfidaA3() (+42 more)

### Community 17 - "h3-gregorio.js (h3-gregorio)"
Cohesion: 0.08
Nodes (34): angoloAH3(), apriConfrontoH3(), apriH3(), avviaMorteH3(), avviaScontroH3(), chiamaGuardieH3(), chiudiCortileH3(), diffAngH3() (+26 more)

### Community 18 - "Finali, Diario di Ferruccio e Voce (b8-finali-diario)"
Cohesion: 0.09
Nodes (34): b8, CONFIG_B8, daQuandoB8(), DIARIO_B8, fabbroB8(), ferruccioB8(), FINALE_B8, fondaleCieloB8() (+26 more)

### Community 19 - "h1-agnese-taddeo.js (h1-agnese-taddeo)"
Cohesion: 0.13
Nodes (37): rett(), aggiornaPresenzeH1(), aggiungiTelaioH1(), agneseAlTelaioH1(), apiH1(), apriConfrontoH1(), apriH1(), apriSceltaAgneseH1() (+29 more)

### Community 20 - "Acquedotto Carolino (d6-acquedotto)"
Cohesion: 0.06
Nodes (27): ACQUEDOTTO_D6, ARREDI_D6, AZIONI_D6, azzeraVentoD6(), BOSS_D6, d6, DISEGNI_NEMICI_D6, fraD6() (+19 more)

### Community 21 - "Cambio di scena e botole (d5-cambio-scena)"
Cohesion: 0.10
Nodes (36): ticksDaMs(), paraColpoB5(), alonaD5(), aperturaBotolaD5(), avviaCambioD5(), BOTOLE_D5, buioCambioD5(), candidataD5() (+28 more)

### Community 22 - "Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)"
Cohesion: 0.14
Nodes (36): getNumeroNotte(), incrementaNumeroNotte(), leggiRegistroA7(), salvaVoceA7(), aggiungiPaginaB8(), apriPortaB8(), colpoRitmoB8(), daiFerroB8() (+28 more)

### Community 23 - "Economia e salvataggi (t3-economia-salvataggi)"
Cohesion: 0.10
Nodes (26): testoToccoD7(), aggiornaBottoneAudio(), aggiornaRaggio(), aggiungiScintille(), cancellaSlot(), chiudiCancella(), dataBreve(), direzioneFrecce() (+18 more)

### Community 24 - "Oggetti e Diario degli oggetti (50-oggetti)"
Cohesion: 0.15
Nodes (27): effettiNotteC(), popolaStanza(), acquisisciOggettoConLimite5Slot(), ARMI_SPECIALI_INTERCAMBIABILI, cellaDiarioD(), clickDiarioD(), conosciutiD(), conosciutiMemoriaD (+19 more)

### Community 25 - "Combattimento (40-combattimento)"
Cohesion: 0.17
Nodes (30): apriMuroSegreto(), aggiornaFamigliOrbitaliD(), aggiornaProiettileD(), applicaSpinta(), bloccaProiettiliNemiciD(), congela(), danneggiaNemico(), esplodiD() (+22 more)

### Community 26 - "Progressione e sblocchi (a6-progressione)"
Cohesion: 0.14
Nodes (26): a6, aCapoA6(), alternativaVeraA6(), avvisaBloccatoA6(), azzeraSblocchi(), bossSconfittoA6(), CONFIG_A6, controllaA6() (+18 more)

### Community 27 - "Configurazione e tabelle di gioco (00-config)"
Cohesion: 0.06
Nodes (30): ARENA, BOSS_A, BOSS_FINALE, canvas, CATALOGO_OGGETTI, CATALOGO_PATTO, CATALOGO_SEGRETO, ctx (+22 more)

### Community 28 - "Pubblico e sipario (b1-pubblico)"
Cohesion: 0.07
Nodes (20): audioB1, bordiSiparioB1, candeleB1, COLORI_B1, datiSagomaB1(), disegnaForziereInVoloB1(), disegnaSagomaSpettatoreB1(), disegnaVoliB1() (+12 more)

### Community 29 - "Riprendi la notte, mira assistita, conto (e6-assistenza)"
Cohesion: 0.09
Nodes (24): eseguiAttacco4Direzioni(), aCapoE6(), angoloAssistitoE6(), arricchisciVoceE6(), ASSISTENZA_E6, colpibileE6(), CONSIGLI_E6, consiglioE6() (+16 more)

### Community 30 - "Scontro col Grande Burattinaio (d1-burattinaio)"
Cohesion: 0.14
Nodes (21): aTerraManoD1(), audioD1(), avviaVittoriaD1(), BURATTINAIO_D1, calaMarionettaD1(), capoD1(), colpisciGiocatoreD1(), d1 (+13 more)

### Community 31 - "Bombe, chiavi e forzieri (a1-bombe-chiavi)"
Cohesion: 0.10
Nodes (27): aggiornaBombeA1(), aggiungiBombe(), aggiungiChiavi(), applicaLucchettiA1(), avvisoA1(), BOMBE_CHIAVI_A1, disegnaA1(), disegnaBombaAccesaA1() (+19 more)

### Community 32 - "Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)"
Cohesion: 0.22
Nodes (19): salvaOpzioni(), attivaRigaB3(), avvisoB3(), cambiaPaginaB3(), cambiaSchermoInteroB3(), chiudiOpzioniB3(), clamp01B3(), clickOpzioniB3() (+11 more)

### Community 33 - "h4-ritorno-piazza.js (h4-ritorno-piazza)"
Cohesion: 0.11
Nodes (21): bB8(), continuaNotteH4(), disegnaPiazzaVivaH4(), disegnaRastrellieraH4(), disegnaUscitaH4(), dopoLucianaH4(), ferriPresiH4(), forzaH4() (+13 more)

### Community 34 - "Stili dei personaggi (d2-personaggi)"
Cohesion: 0.09
Nodes (23): colpisciMuroSegretoC(), levaToccoC2(), arcoMaglioD2(), bottoneMossaD2(), colpoMaglioD2(), conSpettraliD2(), d2, inScenaD2() (+15 more)

### Community 35 - "Stato della notte (20-stato)"
Cohesion: 0.16
Nodes (24): avviaPartitaConPersonaggio(), nuovaRun(), player, ricominciaNotte(), selezionaPersonaggio(), shuffle(), statoRun, avviaPiano() (+16 more)

### Community 36 - "Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)"
Cohesion: 0.12
Nodes (23): aggiornaFinaleB8(), applicaBattutaB8(), apriDiarioB8(), audioB8(), avanzaCartB8(), avanzaFinaleB8(), bussaB8(), clickB8() (+15 more)

### Community 37 - "Generatore della mappa (30-mappa)"
Cohesion: 0.36
Nodes (7): allontanaNemiciDallePorteC(), ENTRATE_C, PORTE_C, porteVietateC(), puntoLontanoDallePorteC(), entraOndataD4(), preparaOrchestraleD4()

### Community 38 - "Rifiniture e Ragno della Seta (d7-rifiniture)"
Cohesion: 0.16
Nodes (17): tastoDiarioD(), aloneProiettileD7(), cambiaStatoRagnoD7(), casoRagnoD7(), disegnaArenaLucianaD7(), disegnaSetaD7(), gamepadCollegatoD7(), hashD7() (+9 more)

### Community 39 - "Pubblico e sipario · telaB1() (b1-pubblico)"
Cohesion: 0.16
Nodes (19): altezzaLatiB1(), disegnaFondoZonaB1(), disegnaFronteZonaB1(), disegnaLumiZonaB1(), disegnaSpettatoreB1(), disegnaTeatroB1(), disegnaTestiSiparioB1(), ridisegnaZonaB1() (+11 more)

### Community 40 - "Pubblico e sipario · limitaB1() (b1-pubblico)"
Cohesion: 0.16
Nodes (19): conLancioB1(), coroB1(), dopoMonetaB1(), fermaSipario(), impostaGradimentoB1(), lanciaFioriB1(), lanciaNuoviB1(), lanciaPremioB1() (+11 more)

### Community 41 - "Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)"
Cohesion: 0.18
Nodes (18): aCapoB8(), aggiornaDidB8(), boccascenaB8(), didLiberaB8(), disegnaCartiglioB8(), disegnaDiarioB8(), disegnaDidB8(), disegnaFinaleB8() (+10 more)

### Community 42 - "Disegno di personaggi e boss (10-sprite)"
Cohesion: 0.15
Nodes (13): caricaSpriteTeatro(), CARTELLE_SPRITE_V2, disegnaBossDaImmagineA(), disegnaBossPittorico(), disegnaGattoSprite(), getGattoImage(), SPRITE_BOSS_A, SPRITE_OGGETTI (+5 more)

### Community 43 - "Varianti di stanza · suonoB7() (b7-stanze)"
Cohesion: 0.19
Nodes (16): accendiBombaB7(), aggiornaFragiliB7(), aggiornaOlioB7(), aggiornaSuoloB7(), corpoSolidoB7(), dopoIlPassoB7(), fineManoB7(), pagaManoB7() (+8 more)

### Community 44 - "Finali, Diario di Ferruccio e Voce · diciB8() (b8-finali-diario)"
Cohesion: 0.19
Nodes (15): accodaDidB8(), cadutaB8(), dialogoT4B8(), diciB8(), distToninoB8(), logicaB8(), logicaGiocoB8(), logicaHubB8() (+7 more)

### Community 45 - "Pubblico e sipario · disegnaSiparioB1() (b1-pubblico)"
Cohesion: 0.14
Nodes (18): disegnaSiparioB1(), disegnaTendeB1(), dopoFrameSiparioB1(), liscioB1(), rumoreB1(), siparioChiusoB1(), suonaB1(), SUONATORI_B1 (+10 more)

### Community 46 - "Varianti di stanza · allestisciB7() (b7-stanze)"
Cohesion: 0.16
Nodes (19): allestisciB7(), applicaDisposizioneB7(), arredaStanzaB7(), creaNemiciB7(), dopoIngressoB7(), estraiPesatoB7(), liberaRagnoB7(), piazzaNemiciB7() (+11 more)

### Community 47 - "Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)"
Cohesion: 0.24
Nodes (12): arcoPalcoLatoB1(), candelaB1(), davanzaleB1(), disegnaBalconataFronteB1(), disegnaMantovanaB1(), disegnaPalcoLatoFondoB1(), disegnaPalcoLatoFronteB1(), disegnaTeloSiparioB1() (+4 more)

### Community 48 - "Finali, Diario di Ferruccio e Voce · componiPaginaB8() (b8-finali-diario)"
Cohesion: 0.18
Nodes (13): componiPaginaB8(), condizioneB8(), elencoB8(), hashB8(), maiuscolaB8(), nomeInFraseB8(), nomiBossB8(), preparaSceneB8() (+5 more)

### Community 49 - "Scontro col Grande Burattinaio · getSpriteTeatro() (d1-burattinaio)"
Cohesion: 0.27
Nodes (11): disegnaCellaTeatro(), getSpriteTeatro(), registraVoceBossB8(), disegnaEffettiD1(), disegnaForbiciD1(), disegnaForbiciFoglioD1(), disegnaForbiciSagomaD1(), disegnaGuantoD1() (+3 more)

### Community 50 - "Oggetti e Diario degli oggetti · drawTextFit() (50-oggetti)"
Cohesion: 0.13
Nodes (20): drawPillLabel(), drawTextFit(), maledizioneD(), descD(), effettoVisibileD(), loreD(), spriteD(), disegnaPannelloSviluppatoreB() (+12 more)

### Community 51 - "Pubblico e sipario · bufferB1() (b1-pubblico)"
Cohesion: 0.32
Nodes (8): aggiornaBrusioB1(), bufferB1(), contestoB1(), creaApplausoB1(), creaFollaB1(), generatoreB1(), normalizzaB1(), suonoMormorioB1()

### Community 52 - "Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)"
Cohesion: 0.21
Nodes (13): aggiornaPubblicoB1(), aggiornaVoliB1(), aggiungiVoceB1(), allineaStanzaB1(), atterraPremioB1(), atterraTuttoB1(), azzeraPubblicoB1(), bordoDockB1() (+5 more)

### Community 53 - "Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)"
Cohesion: 0.31
Nodes (11): adattaTestoB3(), altezzaRigaB3(), disegnaAggiuntePausaB3(), disegnaOpzioniB3(), disegnaRigaOpzioniB3(), dopoIlFrameB3(), etichettaTastoB3(), inToccoB3() (+3 more)

### Community 54 - "Varianti di stanza · analizzaVarianteB7() (b7-stanze)"
Cohesion: 0.25
Nodes (8): analizzaVarianteB7(), cellaB7(), disegnaSuoloB7(), elementiVarianteB7(), periodoSpuntoniB7(), regioniB7(), statoSpuntoniB7(), verificaDisposizioniB7()

### Community 55 - "Rete di sicurezza degli errori (000-errori)"
Cohesion: 0.31
Nodes (9): aggiornaRiquadroErrori(), ERRORI_TEATRO, fusibileScenaTeatro(), RETE_ERRORI, ripulisciContestoTeatro(), segnalaErroreTeatro(), testoErroriTeatro(), iniziaFrame() (+1 more)

### Community 56 - "Pubblico e sipario · tick() (b1-pubblico)"
Cohesion: 0.43
Nodes (7): tick(), colpoSubitoB1(), fonteBuffaB1(), reazionePubblicoB1(), spostaGradimentoB1(), stanzaPulitaB1(), uccisioniB1()

### Community 57 - "Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)"
Cohesion: 0.31
Nodes (9): avviaFinaleB8(), chiudiDiarioB8(), clickDiarioB8(), contestoFinaleB8(), finaleSopraLaRibaltaB8(), flagTramaB8(), rigaFinaleB8(), tastoDiarioB8() (+1 more)

### Community 58 - "Scontro col Grande Burattinaio · avviaAttoD1() (d1-burattinaio)"
Cohesion: 0.31
Nodes (9): avviaAttoD1(), creaStanzaD1(), nuovaManoD1(), nuovaParteD1(), provaBurattinaioD1(), scontroSopraLaRibaltaD1(), sigilliDaNumeroD1(), vitaD1() (+1 more)

### Community 59 - "Qualità automatica (e4-prestazioni)"
Cohesion: 0.31
Nodes (7): azzera(), e4, passoQualitaE4(), QUALITA_E4, qualitaAutoAttivaE4(), riaccendiTuttoE4(), RIGA_E4

### Community 60 - "Fogli di sprite (t2-sprite)"
Cohesion: 0.39
Nodes (7): boss(), disegnaFotogramma(), dopoNemici(), nemico(), personaggio(), posaBoss(), posaNemico()

### Community 61 - "Finali, Diario di Ferruccio e Voce · leggiDiarioB8() (b8-finali-diario)"
Cohesion: 0.32
Nodes (8): azzera(), chiaveDiarioB8(), disegnaLinguettaB8(), leggiDiarioB8(), normalizzaB8(), scriviDiarioB8(), slotB8(), vuotoB8()

### Community 62 - "Finali, Diario di Ferruccio e Voce · bossSconfittoB8() (b8-finali-diario)"
Cohesion: 0.32
Nodes (8): bossDelPianoCadutoB8(), bossSconfittoB8(), disegnaCordoneB8(), disegnaFontanaB8(), disegnaInStanzaB8(), pianoNelCicloB8(), posaFerroB8(), preparaStanzaB8()

### Community 63 - "Scontro col Grande Burattinaio · disegnaArenaD1() (d1-burattinaio)"
Cohesion: 0.29
Nodes (8): disegnaArenaD1(), disegnaCapoD1(), disegnaCordeD1(), disegnaOmbraCapoFoglioD1(), disegnaSquarcioD1(), nuovaTelaD1(), preparaFondoD1(), preparaTraviD1()

### Community 64 - "Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)"
Cohesion: 0.25
Nodes (8): casoFissoD6(), dipingiFondaleD6(), dipingiQuintaD6(), disegnaCanaleD6(), disegnaDrappoD6(), disegnaFiaccolaD6(), disegnaLuogoD6(), telaPavimentoD6()

### Community 65 - "sim-economia.js (sim-economia)"
Cohesion: 0.25
Nodes (5): n, path, r, radice, { spawnSync }

### Community 66 - "Acquedotto Carolino · usaGrataD6() (d6-acquedotto)"
Cohesion: 0.33
Nodes (7): aggiornaPanniD6(), grata(), grataQuiD6(), prendiAcquedottoD6(), segnaAcquedottoD6(), suonoAcquaD6(), usaGrataD6()

### Community 67 - "Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.43
Nodes (7): cerchiAcquaD6(), chinaD6(), disegnaGuardianoD6(), otreD6(), puntoD6(), trattoD6(), tridenteD6()

### Community 68 - "Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)"
Cohesion: 0.29
Nodes (7): corrente(), correnteInD6(), dopoIlPassoD6(), fuoriDagliOstacoliD6(), limitaD6(), muoviD6(), volaD6()

### Community 69 - "Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.29
Nodes (7): entraStatoD6(), iaGuardianoD6(), nuovaAcquaD6(), prossimoStatoD6(), valoreD6(), versoGiocatoreD6(), leggi()

### Community 70 - "Riprendi la notte, mira assistita, conto · chiaveRipresaE6() (e6-assistenza)"
Cohesion: 0.40
Nodes (6): altroRiquadroE6(), cancellaIstantaneaE6(), chiaveRipresaE6(), leggiIstantaneaE6(), osservaFaseE6(), scriviIstantaneaE6()

### Community 71 - "Varianti di stanza · disegna() (b7-stanze)"
Cohesion: 0.50
Nodes (5): ombraB7(), rettB7(), sagomaB7(), bloccoTufoD6(), disegna()

### Community 72 - "Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)"
Cohesion: 0.40
Nodes (5): aggiornaVentoD6(), piegaProiettileD6(), rumoreD6(), soffioD6(), suonoVentoD6()

### Community 73 - "Riprendi la notte, mira assistita, conto · istantaneaE6() (e6-assistenza)"
Cohesion: 0.50
Nodes (5): campiPercorsoE6(), copiaE6(), idsE6(), istantaneaE6(), slotE6()

### Community 75 - "Varianti di stanza · disegnaOstacoloB7() (b7-stanze)"
Cohesion: 0.67
Nodes (4): disegnaOstacoloB7(), timbroB7(), arredoD6(), disegnaArredoD6()

### Community 76 - "Acquedotto Carolino · posaDonoD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): acquedottoAttivoD6(), guardianoSconfittoD6(), intonaD6(), posaDonoD6()

### Community 77 - "Acquedotto Carolino · disegnaAriaD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): disegnaAriaD6(), ombraD6(), pannoD6(), piegaVentoD6()

### Community 79 - "Riprendi la notte, mira assistita, conto · riprendiNotteE6() (e6-assistenza)"
Cohesion: 0.50
Nodes (4): confermaCartelloE6(), listaDaIdE6(), oggettoDaIdE6(), riprendiNotteE6()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `passoLogico()` connect `Combattimento (40-combattimento)` to `Ribalta, luci e ombre (b2-ribalta)`, `Ampolle e carte (a2-consumabili)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Partenza segreta (c1-partenza-segreta)`, `I 200 oggetti (b5-oggetti)`, `Trasformazioni e sinergie (b4-trasformazioni)`, `Registro di Scena e trionfi (d3-registro-scena)`, `h5-sottopalco.js (h5-sottopalco)`, `Boss per piano (b6-boss)`, `Varianti di stanza (b7-stanze)`, `h2-memorie.js (h2-memorie)`, `Stanze speciali (a3-stanze-speciali)`, `h3-gregorio.js (h3-gregorio)`, `h1-agnese-taddeo.js (h1-agnese-taddeo)`, `Acquedotto Carolino (d6-acquedotto)`, `Cambio di scena e botole (d5-cambio-scena)`, `Pubblico e sipario (b1-pubblico)`, `Riprendi la notte, mira assistita, conto (e6-assistenza)`, `Scontro col Grande Burattinaio (d1-burattinaio)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Stili dei personaggi (d2-personaggi)`, `Stato della notte (20-stato)`, `Generatore della mappa (30-mappa)`, `Rifiniture e Ragno della Seta (d7-rifiniture)`, `Varianti di stanza · allestisciB7() (b7-stanze)`, `Rete di sicurezza degli errori (000-errori)`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **Are the 74 inferred relationships involving `mostraBanner()` (e.g. with `apriMuroSegreto()` and `entraInStanza()`) actually correct?**
  _`mostraBanner()` has 74 INFERRED edges - model-reasoned connections that need verification._
- **Should `Ribalta, luci e ombre (b2-ribalta)` be split into smaller, more focused modules?**
  _Cohesion score 0.05163511187607573 - nodes in this community are weakly interconnected._
- **Why does `disegnaStanzaPixelArt()` connect `Disegno della stanza e HUD (60-resa)` to `Ribalta, luci e ombre (b2-ribalta)`, `h4-ritorno-piazza.js (h4-ritorno-piazza)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `h5-sottopalco.js (h5-sottopalco)`, `Immagini di scena (b9-immagini)`, `Varianti di stanza (b7-stanze)`, `Varianti di stanza · allestisciB7() (b7-stanze)`, `Stanze speciali (a3-stanze-speciali)`, `h2-memorie.js (h2-memorie)`, `Finali, Diario di Ferruccio e Voce (b8-finali-diario)`, `h1-agnese-taddeo.js (h1-agnese-taddeo)`, `Acquedotto Carolino (d6-acquedotto)`, `Cambio di scena e botole (d5-cambio-scena)`, `h3-gregorio.js (h3-gregorio)`, `Pubblico e sipario (b1-pubblico)`, `Scontro col Grande Burattinaio (d1-burattinaio)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `drawTextFit()` (e.g. with `disegnaCartiglioD()` and `disegnaDiarioD()`) actually correct?**
  _`drawTextFit()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Should `Ampolle e carte (a2-consumabili)` be split into smaller, more focused modules?**
  _Cohesion score 0.056943056943056944 - nodes in this community are weakly interconnected._
- **Why does `entraInStanza()` connect `Stato della notte (20-stato)` to `Ribalta, luci e ombre (b2-ribalta)`, `Ampolle e carte (a2-consumabili)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Registro di Scena e trionfi (d3-registro-scena)`, `h5-sottopalco.js (h5-sottopalco)`, `Boss per piano (b6-boss)`, `Disegno della stanza e HUD (60-resa)`, `Varianti di stanza (b7-stanze)`, `Stanze speciali (a3-stanze-speciali)`, `h3-gregorio.js (h3-gregorio)`, `Finali, Diario di Ferruccio e Voce (b8-finali-diario)`, `h1-agnese-taddeo.js (h1-agnese-taddeo)`, `Acquedotto Carolino (d6-acquedotto)`, `Cambio di scena e botole (d5-cambio-scena)`, `Oggetti e Diario degli oggetti (50-oggetti)`, `Combattimento (40-combattimento)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Generatore della mappa (30-mappa)`, `Varianti di stanza · allestisciB7() (b7-stanze)`, `Oggetti e Diario degli oggetti · drawTextFit() (50-oggetti)`, `Scontro col Grande Burattinaio · avviaAttoD1() (d1-burattinaio)`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._