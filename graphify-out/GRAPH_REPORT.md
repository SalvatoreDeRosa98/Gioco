# Graph Report - Gioco  (2026-11-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2013 nodes · 5188 edges · 79 communities (77 shown, 2 thin omitted)
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 1399 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ee4f7d4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Ribalta, luci e ombre (b2-ribalta)
- Partenza segreta (c1-partenza-segreta)
- Buca, terna e Camerini (d4-stanze-teatro)
- Varianti di stanza (b7-stanze)
- Registro delle notti (a7-registro-bilancio)
- Piazza Dante e storia (t4-hub-storia)
- Comandi, gamepad e opzioni (b3-comandi-opzioni)
- Comandi a tocco (c2-tocco)
- Immagini di scena (b9-immagini)
- Trasformazioni e sinergie (b4-trasformazioni)
- Registro di Scena e trionfi (d3-registro-scena)
- Cambio di scena e botole (d5-cambio-scena)
- Boss per piano (b6-boss)
- Stanze speciali (a3-stanze-speciali)
- h2-memorie.js (h2-memorie)
- h3-gregorio.js (h3-gregorio)
- Finali, Diario di Ferruccio e Voce (b8-finali-diario)
- I 200 oggetti (b5-oggetti)
- h1-agnese-taddeo.js (h1-agnese-taddeo)
- Ampolle e carte (a2-consumabili)
- Disegno della stanza e HUD (60-resa)
- Acquedotto Carolino (d6-acquedotto)
- Economia e salvataggi (t3-economia-salvataggi)
- Oggetti e Diario degli oggetti (50-oggetti)
- Combattimento (40-combattimento)
- Riprendi la notte, mira assistita, conto (e6-assistenza)
- Configurazione e tabelle di gioco (00-config)
- Progressione e sblocchi (a6-progressione)
- Pubblico e sipario (b1-pubblico)
- Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)
- Bombe, chiavi e forzieri (a1-bombe-chiavi)
- Scontro col Grande Burattinaio (d1-burattinaio)
- Stili dei personaggi (d2-personaggi)
- Generatore della mappa (30-mappa)
- Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)
- Finali, Diario di Ferruccio e Voce · ferruccioB8() (b8-finali-diario)
- Rifiniture e Ragno della Seta (d7-rifiniture)
- Stato della notte (20-stato)
- Pubblico e sipario · telaB1() (b1-pubblico)
- I 200 oggetti · tickB5() (b5-oggetti)
- Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)
- Finali, Diario di Ferruccio e Voce · logicaHubB8() (b8-finali-diario)
- Pubblico e sipario · limitaB1() (b1-pubblico)
- Disegno di personaggi e boss (10-sprite)
- Pubblico e sipario · disegnaSiparioB1() (b1-pubblico)
- Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)
- Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)
- Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)
- Scontro col Grande Burattinaio · getSpriteTeatro() (d1-burattinaio)
- Pubblico e sipario · bufferB1() (b1-pubblico)
- Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)
- Riprendi la notte, mira assistita, conto · istantaneaE6() (e6-assistenza)
- Rete di sicurezza degli errori (000-errori)
- Pubblico e sipario · reazionePubblicoB1() (b1-pubblico)
- Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)
- Scontro col Grande Burattinaio · avviaAttoD1() (d1-burattinaio)
- Qualità automatica (e4-prestazioni)
- Fogli di sprite (t2-sprite)
- Stili dei personaggi · tick() (d2-personaggi)
- Finali, Diario di Ferruccio e Voce · leggiDiarioB8() (b8-finali-diario)
- Scontro col Grande Burattinaio · disegnaArenaD1() (d1-burattinaio)
- Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)
- sim-economia.js (sim-economia)
- Acquedotto Carolino · usaGrataD6() (d6-acquedotto)
- Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)
- Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)
- Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)
- Finali, Diario di Ferruccio e Voce · fineVeroB8() (b8-finali-diario)
- I 200 oggetti · allaPuliziaB5() (b5-oggetti)
- Varianti di stanza · disegna() (b7-stanze)
- Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)
- Icone degli oggetti (b5-oggetti-icone)
- Varianti di stanza · disegnaOstacoloB7() (b7-stanze)
- Acquedotto Carolino · posaDonoD6() (d6-acquedotto)
- Acquedotto Carolino · disegnaAriaD6() (d6-acquedotto)
- Audio (15-audio)
- h4-ritorno-piazza.js (h4-ritorno-piazza)
- Varianti di stanza · piazzaNemiciB7() (b7-stanze)
- Disegno della stanza e HUD · entraInStanza() (60-resa)

## God Nodes (most connected - your core abstractions)
1. `mostraBanner()` - 73 edges
2. `drawTextFit()` - 61 edges
3. `rng()` - 53 edges
4. `passoLogico()` - 46 edges
5. `disegnaFrame()` - 42 edges
6. `statoB8()` - 34 edges
7. `danneggiaNemico()` - 33 edges
8. `scuoti()` - 33 edges
9. `entraInStanza()` - 33 edges
10. `drawPixelSprite()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `maschereInMoneteD2()` --calls--> `mostraBanner()`  [INFERRED]
  d2-personaggi.js → 20-stato.js
- `dopoIngressoBucaD4()` --calls--> `mostraBanner()`  [INFERRED]
  d4-stanze-teatro.js → 20-stato.js
- `vestiCustodiD4()` --calls--> `rng()`  [INFERRED]
  d4-stanze-teatro.js → 20-stato.js
- `azzeraVentoD6()` --calls--> `rng()`  [INFERRED]
  d6-acquedotto.js → 20-stato.js
- `fraD6()` --calls--> `rng()`  [INFERRED]
  d6-acquedotto.js → 20-stato.js

## Import Cycles
- None detected.

## Communities (79 total, 2 thin omitted)

### Community 0 - "Ribalta, luci e ombre (b2-ribalta)"
Cohesion: 0.05
Nodes (74): agganciaStanza(), aggiungiRiparo(), alMorire(), altezzaDi(), atterra(), audioPronto(), contorna(), creaPezzi() (+66 more)

### Community 1 - "Partenza segreta (c1-partenza-segreta)"
Cohesion: 0.07
Nodes (72): eArmaSpeciale(), perPaginaPannelloB5(), apriArmeriaC1(), apriDialogoC1(), apriDomandaC1(), apriRicordoC1(), armeriaApertaC1(), avanzaScenaC1() (+64 more)

### Community 2 - "Buca, terna e Camerini (d4-stanze-teatro)"
Cohesion: 0.06
Nodes (71): MUSICA, aggiungiBucaD4(), alBattereD4(), alTempoD4(), applausoD4(), apriTernaD4(), astaD4(), avanzaOrologioD4() (+63 more)

### Community 3 - "Varianti di stanza (b7-stanze)"
Cohesion: 0.05
Nodes (62): accendiBombaB7(), aggiornaFragiliB7(), aggiornaOlioB7(), aggiornaSuoloB7(), analisiB7, arredaMappaB7(), chiudiCiarlatanoB7(), CIARLATANO_B7 (+54 more)

### Community 4 - "Registro delle notti (a7-registro-bilancio)"
Cohesion: 0.10
Nodes (34): a7, aCapoA7(), azzera(), bossSconfittoA7(), CONFIG_A7, contaLucchettiA7(), controllaAbbandonoA7(), disegnaPergamenaA7() (+26 more)

### Community 5 - "Piazza Dante e storia (t4-hub-storia)"
Cohesion: 0.08
Nodes (56): aCapo(), aggiornaHub(), aggiornaMorte(), apriDialogo(), apriDialogoC(), avanzaDialogo(), avviaMorte(), avvio() (+48 more)

### Community 6 - "Comandi, gamepad e opzioni (b3-comandi-opzioni)"
Cohesion: 0.07
Nodes (59): offsetScossa(), rettBottonePausaA7(), aggiornaAdattaB3(), aggiornaPadB3(), apriDiarioDirettoB3(), apriOpzioniB3(), assegnaTastoB3(), attivaVocePausaB3() (+51 more)

### Community 7 - "Comandi a tocco (c2-tocco)"
Cohesion: 0.08
Nodes (57): adattaRisoluzione(), liberoB3(), scena(), aggiornaClassiC2(), aggiornaVistaC2(), attivaC2(), AVVIO_LEGGERO_C2, bottoneGiuC2() (+49 more)

### Community 8 - "Immagini di scena (b9-immagini)"
Cohesion: 0.10
Nodes (42): invalidaTeleB1(), disegnaRigaOpzioniB3(), disegnaClessidraB7(), aloneCaldoB9(), arredoImmagineB9(), cartiglioOpzioniB9(), CONFIG_B9, contaB9() (+34 more)

### Community 9 - "Trasformazioni e sinergie (b4-trasformazioni)"
Cohesion: 0.06
Nodes (58): getSpriteCanvas(), aggiornaSinergieB4(), aloneB4(), aloniB4, ANCORE_B4, applicaEffettiB4(), apriPupazzoB4(), attivaTrasformazioneB4() (+50 more)

### Community 10 - "Registro di Scena e trionfi (d3-registro-scena)"
Cohesion: 0.08
Nodes (53): annunciaTrionfoD3(), apertureD3(), apriRegistroScenaD3(), attrezzeriaD3(), bossSconfittoD3(), cacheSagomeD3, cambiaSezioneD3(), chiudiRegistroScenaD3() (+45 more)

### Community 11 - "Cambio di scena e botole (d5-cambio-scena)"
Cohesion: 0.10
Nodes (37): ticksDaMs(), paraColpoB5(), alonaD5(), aperturaBotolaD5(), avviaCambioD5(), BOTOLE_D5, buioCambioD5(), candidataD5() (+29 more)

### Community 12 - "Boss per piano (b6-boss)"
Cohesion: 0.07
Nodes (48): disegnaMobSprite(), accessoriGiostraB6(), accessoriLampionaioB6(), accessoriTessitriceB6(), alaCignoB6(), AZIONI_B6, azzeraMemoria(), b6 (+40 more)

### Community 13 - "Stanze speciali (a3-stanze-speciali)"
Cohesion: 0.11
Nodes (47): mostraBanner(), rng(), nomeD(), aggiungiStanzeSpecialiA3(), avviaSfidaA3(), avvisaA3(), chiudiSfidaA3(), creaStanzaA3() (+39 more)

### Community 14 - "h2-memorie.js (h2-memorie)"
Cohesion: 0.09
Nodes (39): aggiornaPaginaBiancaH2(), aggiuntaDiarioH2(), ANIME_H2, ASSUNTA_H2, assuntaH2, assuntaInPiazzaH2(), azzera(), battuteAssuntaH2() (+31 more)

### Community 15 - "h3-gregorio.js (h3-gregorio)"
Cohesion: 0.08
Nodes (34): angoloAH3(), apriConfrontoH3(), apriH3(), avviaMorteH3(), avviaScontroH3(), chiamaGuardieH3(), chiudiCortileH3(), diffAngH3() (+26 more)

### Community 16 - "Finali, Diario di Ferruccio e Voce (b8-finali-diario)"
Cohesion: 0.08
Nodes (35): b8, bossDelPianoCadutoB8(), bossSconfittoB8(), componiPaginaB8(), condizioneB8(), CONFIG_B8, DIARIO_B8, disegnaCordoneB8() (+27 more)

### Community 17 - "I 200 oggetti (b5-oggetti)"
Cohesion: 0.07
Nodes (35): aggiornaFamigliB5(), aggiornaSlotFucinaB5(), aggregaB5(), ATTIVI_B5, calcolaStatB5(), cambiaPaginaDiarioB5(), cellaDiarioB5(), CHIAVI_B5 (+27 more)

### Community 18 - "h1-agnese-taddeo.js (h1-agnese-taddeo)"
Cohesion: 0.13
Nodes (36): aggiornaPresenzeH1(), aggiungiTelaioH1(), agneseAlTelaioH1(), apiH1(), apriConfrontoH1(), apriH1(), apriSceltaAgneseH1(), CONFIG_H1 (+28 more)

### Community 19 - "Ampolle e carte (a2-consumabili)"
Cohesion: 0.12
Nodes (38): aggiornaScalaA2(), applicaAmpollaA2(), applicaCartaA2(), conosciutiA2(), conosciutiMemoriaA2, CONS_A2, CONS_A2_AMPOLLE, CONS_A2_CARTE (+30 more)

### Community 20 - "Disegno della stanza e HUD (60-resa)"
Cohesion: 0.12
Nodes (35): disegnaFerruccioPittorico(), disegnaManoMarionettaPittorica(), disegnaNemicoPittorico(), drawPixelSprite(), drawTextFit(), getCharCorrente(), maledizioneD(), cellaDiarioD() (+27 more)

### Community 21 - "Acquedotto Carolino (d6-acquedotto)"
Cohesion: 0.06
Nodes (27): ACQUEDOTTO_D6, ARREDI_D6, AZIONI_D6, azzeraVentoD6(), BOSS_D6, d6, DISEGNI_NEMICI_D6, fraD6() (+19 more)

### Community 22 - "Economia e salvataggi (t3-economia-salvataggi)"
Cohesion: 0.10
Nodes (25): testoToccoD7(), aggiornaBottoneAudio(), aggiornaRaggio(), aggiungiScintille(), cancellaSlot(), chiudiCancella(), dataBreve(), direzioneFrecce() (+17 more)

### Community 23 - "Oggetti e Diario degli oggetti (50-oggetti)"
Cohesion: 0.15
Nodes (27): effettiNotteC(), popolaStanza(), acquisisciOggettoConLimite5Slot(), ARMI_SPECIALI_INTERCAMBIABILI, conosciutiD(), conosciutiMemoriaD, conosciutoD(), creaCuoreB() (+19 more)

### Community 24 - "Combattimento (40-combattimento)"
Cohesion: 0.16
Nodes (33): apriMuroSegreto(), aggiornaFamigliOrbitaliD(), aggiornaProiettileD(), applicaSpinta(), bloccaProiettiliNemiciD(), congela(), danneggiaNemico(), esplodiD() (+25 more)

### Community 25 - "Riprendi la notte, mira assistita, conto (e6-assistenza)"
Cohesion: 0.08
Nodes (27): eseguiAttacco4Direzioni(), aCapoE6(), angoloAssistitoE6(), arricchisciVoceE6(), ASSISTENZA_E6, colpibileE6(), confermaCartelloE6(), CONSIGLI_E6 (+19 more)

### Community 26 - "Configurazione e tabelle di gioco (00-config)"
Cohesion: 0.06
Nodes (30): ARENA, BOSS_A, BOSS_FINALE, canvas, CATALOGO_OGGETTI, CATALOGO_PATTO, CATALOGO_SEGRETO, ctx (+22 more)

### Community 27 - "Progressione e sblocchi (a6-progressione)"
Cohesion: 0.14
Nodes (26): a6, aCapoA6(), alternativaVeraA6(), avvisaBloccatoA6(), azzeraSblocchi(), bossSconfittoA6(), CONFIG_A6, controllaA6() (+18 more)

### Community 28 - "Pubblico e sipario (b1-pubblico)"
Cohesion: 0.07
Nodes (20): audioB1, bordiSiparioB1, candeleB1, COLORI_B1, datiSagomaB1(), disegnaForziereInVoloB1(), disegnaSagomaSpettatoreB1(), disegnaVoliB1() (+12 more)

### Community 29 - "Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)"
Cohesion: 0.17
Nodes (28): getNumeroNotte(), accodaDidB8(), aggiungiPaginaB8(), apriPortaB8(), cadutaB8(), daiFerroB8(), diciB8(), esitoBussataB8() (+20 more)

### Community 30 - "Bombe, chiavi e forzieri (a1-bombe-chiavi)"
Cohesion: 0.09
Nodes (29): aggiornaBombeA1(), aggiungiBombe(), aggiungiChiavi(), applicaLucchettiA1(), apriForziereA1(), avvisoA1(), BOMBE_CHIAVI_A1, disegnaA1() (+21 more)

### Community 31 - "Scontro col Grande Burattinaio (d1-burattinaio)"
Cohesion: 0.14
Nodes (21): aTerraManoD1(), audioD1(), avviaVittoriaD1(), BURATTINAIO_D1, calaMarionettaD1(), capoD1(), colpisciGiocatoreD1(), d1 (+13 more)

### Community 32 - "Stili dei personaggi (d2-personaggi)"
Cohesion: 0.11
Nodes (15): levaToccoC2(), conSpettraliD2(), d2, inScenaD2(), limitaOmbraD2(), maschereInMoneteD2(), mossaD2(), personaggioD2() (+7 more)

### Community 33 - "Generatore della mappa (30-mappa)"
Cohesion: 0.31
Nodes (8): allontanaNemiciDallePorteC(), colpisciMuroSegretoC(), ENTRATE_C, PORTE_C, porteVietateC(), puntoLontanoDallePorteC(), entraOndataD4(), preparaOrchestraleD4()

### Community 34 - "Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)"
Cohesion: 0.13
Nodes (22): aggiornaFinaleB8(), applicaBattutaB8(), apriDiarioB8(), audioB8(), avanzaCartB8(), avanzaFinaleB8(), bussaB8(), clickB8() (+14 more)

### Community 35 - "Finali, Diario di Ferruccio e Voce · ferruccioB8() (b8-finali-diario)"
Cohesion: 0.15
Nodes (22): colpoRitmoB8(), daQuandoB8(), disegnaPortaB8(), fabbroB8(), ferruccioB8(), fondaleCieloB8(), fondaleFucinaB8(), fondaleManiB8() (+14 more)

### Community 36 - "Rifiniture e Ragno della Seta (d7-rifiniture)"
Cohesion: 0.18
Nodes (15): disegnaMacchie(), aloneProiettileD7(), cambiaStatoRagnoD7(), casoRagnoD7(), disegnaArenaLucianaD7(), disegnaSetaD7(), hashD7(), lasciaSetaD7() (+7 more)

### Community 37 - "Stato della notte (20-stato)"
Cohesion: 0.16
Nodes (23): avviaPartitaConPersonaggio(), incrementaNumeroNotte(), nuovaRun(), player, ricalcolaStatistiche(), ricominciaNotte(), selezionaPersonaggio(), shuffle() (+15 more)

### Community 38 - "Pubblico e sipario · telaB1() (b1-pubblico)"
Cohesion: 0.16
Nodes (19): altezzaLatiB1(), disegnaFondoZonaB1(), disegnaFronteZonaB1(), disegnaLumiZonaB1(), disegnaSpettatoreB1(), disegnaTeatroB1(), disegnaTestiSiparioB1(), ridisegnaZonaB1() (+11 more)

### Community 39 - "I 200 oggetti · tickB5() (b5-oggetti)"
Cohesion: 0.13
Nodes (19): aggiornaMoltDannoB5(), aggiornaScieB5(), aggiungiSciaB5(), attiraB5(), B5(), bannerDopoB5(), copiaColpoB5(), dopoSparoB5() (+11 more)

### Community 40 - "Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)"
Cohesion: 0.24
Nodes (18): salvaOpzioni(), attivaRigaB3(), avvisoB3(), cambiaPaginaB3(), cambiaSchermoInteroB3(), chiudiOpzioniB3(), clamp01B3(), clickOpzioniB3() (+10 more)

### Community 41 - "Finali, Diario di Ferruccio e Voce · logicaHubB8() (b8-finali-diario)"
Cohesion: 0.15
Nodes (17): aggiornaDidB8(), contestoFinaleB8(), dialogoT4B8(), didLiberaB8(), disegnaSopraGiocoB8(), disegnaSopraHubB8(), distToninoB8(), flagTramaB8() (+9 more)

### Community 42 - "Pubblico e sipario · limitaB1() (b1-pubblico)"
Cohesion: 0.20
Nodes (16): coroB1(), dopoMonetaB1(), fermaSipario(), impostaGradimentoB1(), lanciaNuoviB1(), lanciaPremioB1(), lanciatoreB1(), limitaB1() (+8 more)

### Community 43 - "Disegno di personaggi e boss (10-sprite)"
Cohesion: 0.15
Nodes (13): caricaSpriteTeatro(), CARTELLE_SPRITE_V2, disegnaBossDaImmagineA(), disegnaBossPittorico(), disegnaGattoSprite(), getGattoImage(), SPRITE_BOSS_A, SPRITE_OGGETTI (+5 more)

### Community 44 - "Pubblico e sipario · disegnaSiparioB1() (b1-pubblico)"
Cohesion: 0.17
Nodes (15): disegnaAttoreB1(), disegnaSiparioB1(), disegnaTendeB1(), dopoFrameSiparioB1(), liscioB1(), rumoreB1(), siparioChiusoB1(), suonaB1() (+7 more)

### Community 45 - "Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)"
Cohesion: 0.23
Nodes (13): arcoPalcoLatoB1(), candelaB1(), davanzaleB1(), disegnaBalconataFronteB1(), disegnaMantovanaB1(), disegnaPalcoLatoFondoB1(), disegnaPalcoLatoFronteB1(), disegnaTeloSiparioB1() (+5 more)

### Community 46 - "Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)"
Cohesion: 0.19
Nodes (13): adattaTestoB3(), altezzaRigaB3(), disegnaOpzioniB3(), dopoIlFrameB3(), etichettaTastoB3(), inToccoB3(), simboloB3(), mettiC2() (+5 more)

### Community 47 - "Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)"
Cohesion: 0.27
Nodes (13): aCapoB8(), boccascenaB8(), disegnaCartiglioB8(), disegnaDiarioB8(), disegnaDidB8(), disegnaFinaleB8(), disegnaSceltaB8(), fondaleNeroB8() (+5 more)

### Community 48 - "Scontro col Grande Burattinaio · getSpriteTeatro() (d1-burattinaio)"
Cohesion: 0.27
Nodes (11): disegnaCellaTeatro(), getSpriteTeatro(), registraVoceBossB8(), disegnaEffettiD1(), disegnaForbiciD1(), disegnaForbiciFoglioD1(), disegnaForbiciSagomaD1(), disegnaGuantoD1() (+3 more)

### Community 49 - "Pubblico e sipario · bufferB1() (b1-pubblico)"
Cohesion: 0.22
Nodes (11): aggiornaBrusioB1(), bufferB1(), contestoB1(), creaApplausoB1(), creaFollaB1(), generatoreB1(), normalizzaB1(), SUONATORI_B1 (+3 more)

### Community 50 - "Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)"
Cohesion: 0.24
Nodes (11): aggiornaPubblicoB1(), aggiornaVoliB1(), allineaStanzaB1(), atterraPremioB1(), atterraTuttoB1(), azzeraPubblicoB1(), bordoDockB1(), cambioStanzaB1() (+3 more)

### Community 51 - "Riprendi la notte, mira assistita, conto · istantaneaE6() (e6-assistenza)"
Cohesion: 0.22
Nodes (11): altroRiquadroE6(), campiPercorsoE6(), cancellaIstantaneaE6(), chiaveRipresaE6(), copiaE6(), idsE6(), istantaneaE6(), leggiIstantaneaE6() (+3 more)

### Community 52 - "Rete di sicurezza degli errori (000-errori)"
Cohesion: 0.31
Nodes (9): aggiornaRiquadroErrori(), ERRORI_TEATRO, fusibileScenaTeatro(), RETE_ERRORI, ripulisciContestoTeatro(), segnalaErroreTeatro(), testoErroriTeatro(), iniziaFrame() (+1 more)

### Community 53 - "Pubblico e sipario · reazionePubblicoB1() (b1-pubblico)"
Cohesion: 0.27
Nodes (10): aggiungiVoceB1(), colpoSubitoB1(), fonteBuffaB1(), lanciaFioriB1(), reazionePubblicoB1(), riquadroVoceB1(), spostaGradimentoB1(), stanzaPulitaB1() (+2 more)

### Community 54 - "Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)"
Cohesion: 0.31
Nodes (9): avviaFinaleB8(), chiudiDiarioB8(), clickDiarioB8(), entraSopraLaRibaltaB8(), finaleSopraLaRibaltaB8(), rigaFinaleB8(), tastoDiarioB8(), tornaInPiazzaB8() (+1 more)

### Community 55 - "Scontro col Grande Burattinaio · avviaAttoD1() (d1-burattinaio)"
Cohesion: 0.31
Nodes (9): avviaAttoD1(), creaStanzaD1(), nuovaManoD1(), nuovaParteD1(), provaBurattinaioD1(), scontroSopraLaRibaltaD1(), sigilliDaNumeroD1(), vitaD1() (+1 more)

### Community 56 - "Qualità automatica (e4-prestazioni)"
Cohesion: 0.31
Nodes (7): azzera(), e4, passoQualitaE4(), QUALITA_E4, qualitaAutoAttivaE4(), riaccendiTuttoE4(), RIGA_E4

### Community 57 - "Fogli di sprite (t2-sprite)"
Cohesion: 0.39
Nodes (7): boss(), disegnaFotogramma(), dopoNemici(), nemico(), personaggio(), posaBoss(), posaNemico()

### Community 58 - "Stili dei personaggi · tick() (d2-personaggi)"
Cohesion: 0.32
Nodes (8): tick(), arcoMaglioD2(), colpoMaglioD2(), lampoD2(), passoCaricaD2(), passoPiroettaD2(), suonoD2(), liberaAnimeH2()

### Community 59 - "Finali, Diario di Ferruccio e Voce · leggiDiarioB8() (b8-finali-diario)"
Cohesion: 0.32
Nodes (8): azzera(), chiaveDiarioB8(), disegnaLinguettaB8(), leggiDiarioB8(), normalizzaB8(), scriviDiarioB8(), slotB8(), vuotoB8()

### Community 60 - "Scontro col Grande Burattinaio · disegnaArenaD1() (d1-burattinaio)"
Cohesion: 0.29
Nodes (8): disegnaArenaD1(), disegnaCapoD1(), disegnaCordeD1(), disegnaOmbraCapoFoglioD1(), disegnaSquarcioD1(), nuovaTelaD1(), preparaFondoD1(), preparaTraviD1()

### Community 61 - "Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)"
Cohesion: 0.25
Nodes (8): casoFissoD6(), dipingiFondaleD6(), dipingiQuintaD6(), disegnaCanaleD6(), disegnaDrappoD6(), disegnaFiaccolaD6(), disegnaLuogoD6(), telaPavimentoD6()

### Community 62 - "sim-economia.js (sim-economia)"
Cohesion: 0.25
Nodes (5): n, path, r, radice, { spawnSync }

### Community 63 - "Acquedotto Carolino · usaGrataD6() (d6-acquedotto)"
Cohesion: 0.33
Nodes (7): aggiornaPanniD6(), grata(), grataQuiD6(), prendiAcquedottoD6(), segnaAcquedottoD6(), suonoAcquaD6(), usaGrataD6()

### Community 64 - "Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.43
Nodes (7): cerchiAcquaD6(), chinaD6(), disegnaGuardianoD6(), otreD6(), puntoD6(), trattoD6(), tridenteD6()

### Community 65 - "Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)"
Cohesion: 0.29
Nodes (7): corrente(), correnteInD6(), dopoIlPassoD6(), fuoriDagliOstacoliD6(), limitaD6(), muoviD6(), volaD6()

### Community 66 - "Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.29
Nodes (7): entraStatoD6(), iaGuardianoD6(), nuovaAcquaD6(), prossimoStatoD6(), valoreD6(), versoGiocatoreD6(), leggi()

### Community 67 - "Finali, Diario di Ferruccio e Voce · fineVeroB8() (b8-finali-diario)"
Cohesion: 0.67
Nodes (6): dopoMorteB8(), dopoRicominciaB8(), fineVeroB8(), nuovaNotaB8(), scriviPaginaRunB8(), voceDaStatoB8()

### Community 68 - "I 200 oggetti · allaPuliziaB5() (b5-oggetti)"
Cohesion: 0.60
Nodes (5): allaPuliziaB5(), allaUccisioneB5(), curaB5(), lasciaDonoB5(), monetaB5()

### Community 69 - "Varianti di stanza · disegna() (b7-stanze)"
Cohesion: 0.50
Nodes (5): ombraB7(), rettB7(), sagomaB7(), bloccoTufoD6(), disegna()

### Community 70 - "Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)"
Cohesion: 0.40
Nodes (5): aggiornaVentoD6(), piegaProiettileD6(), rumoreD6(), soffioD6(), suonoVentoD6()

### Community 72 - "Varianti di stanza · disegnaOstacoloB7() (b7-stanze)"
Cohesion: 0.67
Nodes (4): disegnaOstacoloB7(), timbroB7(), arredoD6(), disegnaArredoD6()

### Community 73 - "Acquedotto Carolino · posaDonoD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): acquedottoAttivoD6(), guardianoSconfittoD6(), intonaD6(), posaDonoD6()

### Community 74 - "Acquedotto Carolino · disegnaAriaD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): disegnaAriaD6(), ombraD6(), pannoD6(), piegaVentoD6()

### Community 76 - "h4-ritorno-piazza.js (h4-ritorno-piazza)"
Cohesion: 0.09
Nodes (26): drawPillLabel(), disegnaBottoneBloccatoA6(), disegnaCiarlatanoB7(), disegnaSacchiB7(), disegnaTempoClessidraB7(), bB8(), bloccaD3(), disegnaPiazzaVivaH4() (+18 more)

### Community 77 - "Varianti di stanza · piazzaNemiciB7() (b7-stanze)"
Cohesion: 0.13
Nodes (21): analizzaVarianteB7(), applicaDisposizioneB7(), arredaStanzaB7(), cellaB7(), creaNemiciB7(), dopoIngressoB7(), elementiVarianteB7(), estraiPesatoB7() (+13 more)

### Community 78 - "Disegno della stanza e HUD · entraInStanza() (60-resa)"
Cohesion: 0.17
Nodes (19): getQuartierePiano(), entraInStanza(), interagisciStanza(), apriPannelloSviluppatoreB(), cellaPannelloB(), clickPannelloB(), disegnaAltareSviluppatoreB(), disegnaAtmosferaQuartiere() (+11 more)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `passoLogico()` connect `Combattimento (40-combattimento)` to `Ribalta, luci e ombre (b2-ribalta)`, `Partenza segreta (c1-partenza-segreta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Varianti di stanza (b7-stanze)`, `Registro delle notti (a7-registro-bilancio)`, `Trasformazioni e sinergie (b4-trasformazioni)`, `Registro di Scena e trionfi (d3-registro-scena)`, `Cambio di scena e botole (d5-cambio-scena)`, `Boss per piano (b6-boss)`, `Stanze speciali (a3-stanze-speciali)`, `h2-memorie.js (h2-memorie)`, `h3-gregorio.js (h3-gregorio)`, `I 200 oggetti (b5-oggetti)`, `h1-agnese-taddeo.js (h1-agnese-taddeo)`, `Ampolle e carte (a2-consumabili)`, `Acquedotto Carolino (d6-acquedotto)`, `Riprendi la notte, mira assistita, conto (e6-assistenza)`, `Pubblico e sipario (b1-pubblico)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Scontro col Grande Burattinaio (d1-burattinaio)`, `Stili dei personaggi (d2-personaggi)`, `Generatore della mappa (30-mappa)`, `Rifiniture e Ragno della Seta (d7-rifiniture)`, `Stato della notte (20-stato)`, `Rete di sicurezza degli errori (000-errori)`, `Disegno della stanza e HUD · entraInStanza() (60-resa)`?**
  _High betweenness centrality (0.216) - this node is a cross-community bridge._
- **Are the 71 inferred relationships involving `mostraBanner()` (e.g. with `apriMuroSegreto()` and `entraInStanza()`) actually correct?**
  _`mostraBanner()` has 71 INFERRED edges - model-reasoned connections that need verification._
- **Should `Ribalta, luci e ombre (b2-ribalta)` be split into smaller, more focused modules?**
  _Cohesion score 0.05163511187607573 - nodes in this community are weakly interconnected._
- **Why does `disegnaStanzaPixelArt()` connect `Disegno della stanza e HUD · entraInStanza() (60-resa)` to `Ribalta, luci e ombre (b2-ribalta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Varianti di stanza (b7-stanze)`, `Immagini di scena (b9-immagini)`, `Cambio di scena e botole (d5-cambio-scena)`, `h4-ritorno-piazza.js (h4-ritorno-piazza)`, `Stanze speciali (a3-stanze-speciali)`, `h2-memorie.js (h2-memorie)`, `h3-gregorio.js (h3-gregorio)`, `Finali, Diario di Ferruccio e Voce (b8-finali-diario)`, `h1-agnese-taddeo.js (h1-agnese-taddeo)`, `Disegno della stanza e HUD (60-resa)`, `Acquedotto Carolino (d6-acquedotto)`, `Pubblico e sipario (b1-pubblico)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Scontro col Grande Burattinaio (d1-burattinaio)`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Are the 59 inferred relationships involving `drawTextFit()` (e.g. with `disegnaCartiglioD()` and `disegnaDiarioD()`) actually correct?**
  _`drawTextFit()` has 59 INFERRED edges - model-reasoned connections that need verification._
- **Should `Partenza segreta (c1-partenza-segreta)` be split into smaller, more focused modules?**
  _Cohesion score 0.06738245094409478 - nodes in this community are weakly interconnected._
- **Why does `entraInStanza()` connect `Disegno della stanza e HUD · entraInStanza() (60-resa)` to `Ribalta, luci e ombre (b2-ribalta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Varianti di stanza (b7-stanze)`, `Registro delle notti (a7-registro-bilancio)`, `Registro di Scena e trionfi (d3-registro-scena)`, `Cambio di scena e botole (d5-cambio-scena)`, `Boss per piano (b6-boss)`, `Stanze speciali (a3-stanze-speciali)`, `h3-gregorio.js (h3-gregorio)`, `Finali, Diario di Ferruccio e Voce (b8-finali-diario)`, `h1-agnese-taddeo.js (h1-agnese-taddeo)`, `Ampolle e carte (a2-consumabili)`, `Disegno della stanza e HUD (60-resa)`, `Acquedotto Carolino (d6-acquedotto)`, `Oggetti e Diario degli oggetti (50-oggetti)`, `Combattimento (40-combattimento)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Generatore della mappa (30-mappa)`, `Stato della notte (20-stato)`, `Scontro col Grande Burattinaio · avviaAttoD1() (d1-burattinaio)`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._