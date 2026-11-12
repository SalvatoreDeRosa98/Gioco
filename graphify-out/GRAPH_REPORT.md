# Graph Report - Gioco  (2026-11-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1858 nodes · 4793 edges · 79 communities (77 shown, 2 thin omitted)
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 1295 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9bc3810d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Ribalta, luci e ombre (b2-ribalta)
- Registro delle notti (a7-registro-bilancio)
- Partenza segreta (c1-partenza-segreta)
- Buca, terna e Camerini (d4-stanze-teatro)
- Varianti di stanza (b7-stanze)
- Piazza Dante e storia (t4-hub-storia)
- Registro di Scena e trionfi (d3-registro-scena)
- Trasformazioni e sinergie (b4-trasformazioni)
- Boss per piano (b6-boss)
- Stanze speciali (a3-stanze-speciali)
- Scontro col Grande Burattinaio (d1-burattinaio)
- Riprendi la notte, mira assistita, conto (e6-assistenza)
- Immagini di scena (b9-immagini)
- I 200 oggetti (b5-oggetti)
- Finali, Diario di Ferruccio e Voce (b8-finali-diario)
- Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)
- Acquedotto Carolino (d6-acquedotto)
- Economia e salvataggi (t3-economia-salvataggi)
- Combattimento (40-combattimento)
- Progressione e sblocchi (a6-progressione)
- Configurazione e tabelle di gioco (00-config)
- Disegno della stanza e HUD (60-resa)
- Pubblico e sipario (b1-pubblico)
- Stili dei personaggi (d2-personaggi)
- Comandi, gamepad e opzioni (b3-comandi-opzioni)
- Bombe, chiavi e forzieri (a1-bombe-chiavi)
- Stato della notte (20-stato)
- Oggetti e Diario degli oggetti (50-oggetti)
- Comandi a tocco (c2-tocco)
- I 200 oggetti · tickB5() (b5-oggetti)
- Finali, Diario di Ferruccio e Voce · ferruccioB8() (b8-finali-diario)
- Trasformazioni e sinergie · drawTextFit() (b4-trasformazioni)
- Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)
- Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)
- Rifiniture e Ragno della Seta (d7-rifiniture)
- Disegno di personaggi e boss (10-sprite)
- Pubblico e sipario · telaB1() (b1-pubblico)
- Cambio di scena e botole (d5-cambio-scena)
- Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)
- Comandi, gamepad e opzioni · aggiornaPadB3() (b3-comandi-opzioni)
- Varianti di stanza · suonoB7() (b7-stanze)
- Pubblico e sipario · reazionePubblicoB1() (b1-pubblico)
- Comandi a tocco · installaC2() (c2-tocco)
- Oggetti e Diario degli oggetti · acquisisciOggettoConLimite5Slot() (50-oggetti)
- Pubblico e sipario · disegnaSiparioB1() (b1-pubblico)
- Cambio di scena e botole · ticksDaMs() (d5-cambio-scena)
- Pubblico e sipario · bufferB1() (b1-pubblico)
- Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)
- Comandi a tocco · disponiC2() (c2-tocco)
- Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)
- Pubblico e sipario · limitaB1() (b1-pubblico)
- Varianti di stanza · scegliVarianteB7() (b7-stanze)
- Rete di sicurezza degli errori (000-errori)
- Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)
- Comandi, gamepad e opzioni · tastieraB3() (b3-comandi-opzioni)
- Finali, Diario di Ferruccio e Voce · logicaHubB8() (b8-finali-diario)
- Qualità automatica (e4-prestazioni)
- Generatore della mappa (30-mappa)
- Comandi, gamepad e opzioni · salvaOpzioni() (b3-comandi-opzioni)
- Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)
- Finali, Diario di Ferruccio e Voce · leggiDiarioB8() (b8-finali-diario)
- Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)
- sim-economia.js (sim-economia)
- Comandi a tocco · dopoIlFrameC2() (c2-tocco)
- Finali, Diario di Ferruccio e Voce · suonoFerroB8() (b8-finali-diario)
- Acquedotto Carolino · usaGrataD6() (d6-acquedotto)
- Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)
- Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)
- Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)
- Varianti di stanza · drawPillLabel() (b7-stanze)
- I 200 oggetti · trovaOggettoB() (b5-oggetti)
- I 200 oggetti · allaPuliziaB5() (b5-oggetti)
- Varianti di stanza · disegna() (b7-stanze)
- Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)
- Icone degli oggetti (b5-oggetti-icone)
- Varianti di stanza · disegnaOstacoloB7() (b7-stanze)
- Acquedotto Carolino · posaDonoD6() (d6-acquedotto)
- Acquedotto Carolino · disegnaAriaD6() (d6-acquedotto)
- Audio (15-audio)

## God Nodes (most connected - your core abstractions)
1. `mostraBanner()` - 64 edges
2. `drawTextFit()` - 58 edges
3. `rng()` - 53 edges
4. `passoLogico()` - 43 edges
5. `disegnaFrame()` - 42 edges
6. `danneggiaNemico()` - 32 edges
7. `drawPixelSprite()` - 32 edges
8. `statoB8()` - 31 edges
9. `scuoti()` - 31 edges
10. `entraInStanza()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `ricalcolaStatistiche()` --calls--> `medaglioneC()`  [INFERRED]
  20-stato.js → 00-config.js
- `azzeraTrasformazioniQA()` --calls--> `ricalcolaStatistiche()`  [INFERRED]
  b4-trasformazioni.js → 20-stato.js
- `disegnaRiflessiE6()` --calls--> `salvaOpzioni()`  [INFERRED]
  e6-assistenza.js → 00-config.js
- `disegnaSopraB5()` --calls--> `drawPixelSprite()`  [INFERRED]
  b5-oggetti.js → 10-sprite.js
- `voceVirtualeB5()` --calls--> `getNumeroNotte()`  [INFERRED]
  b5-oggetti.js → 20-stato.js

## Import Cycles
- None detected.

## Communities (79 total, 2 thin omitted)

### Community 0 - "Ribalta, luci e ombre (b2-ribalta)"
Cohesion: 0.05
Nodes (71): agganciaStanza(), aggiungiRiparo(), alMorire(), altezzaDi(), atterra(), audioPronto(), contorna(), creaPezzi() (+63 more)

### Community 1 - "Registro delle notti (a7-registro-bilancio)"
Cohesion: 0.06
Nodes (73): ricalcolaStatistiche(), aggiornaScalaA2(), applicaAmpollaA2(), applicaCartaA2(), conosciutiA2(), conosciutiMemoriaA2, CONS_A2, CONS_A2_AMPOLLE (+65 more)

### Community 2 - "Partenza segreta (c1-partenza-segreta)"
Cohesion: 0.07
Nodes (75): cellaPannelloB(), clickPannelloB(), scegliOggettoSviluppatoreB(), tastoPannelloB(), apriArmeriaC1(), apriDialogoC1(), apriDomandaC1(), apriRicordoC1() (+67 more)

### Community 3 - "Buca, terna e Camerini (d4-stanze-teatro)"
Cohesion: 0.06
Nodes (73): MUSICA, aggiungiBucaD4(), alBattereD4(), alTempoD4(), applausoD4(), apriTernaD4(), astaD4(), avanzaOrologioD4() (+65 more)

### Community 4 - "Varianti di stanza (b7-stanze)"
Cohesion: 0.06
Nodes (46): analisiB7, arredaMappaB7(), chiudiCiarlatanoB7(), CIARLATANO_B7, CLESSIDRA_B7, clickCiarlatanoB7(), colpisciFragileB7(), COPPIE_B7 (+38 more)

### Community 5 - "Piazza Dante e storia (t4-hub-storia)"
Cohesion: 0.08
Nodes (56): aCapo(), aggiornaHub(), aggiornaMorte(), apriDialogo(), apriDialogoC(), avanzaDialogo(), avviaMorte(), avvio() (+48 more)

### Community 6 - "Registro di Scena e trionfi (d3-registro-scena)"
Cohesion: 0.08
Nodes (53): annunciaTrionfoD3(), apertureD3(), apriRegistroScenaD3(), attrezzeriaD3(), bossSconfittoD3(), cacheSagomeD3, cambiaSezioneD3(), chiudiRegistroScenaD3() (+45 more)

### Community 7 - "Trasformazioni e sinergie (b4-trasformazioni)"
Cohesion: 0.06
Nodes (51): getSpriteCanvas(), aggiornaSinergieB4(), aloneB4(), aloniB4, ANCORE_B4, applicaEffettiB4(), apriPupazzoB4(), attivaTrasformazioneB4() (+43 more)

### Community 8 - "Boss per piano (b6-boss)"
Cohesion: 0.07
Nodes (48): disegnaMobSprite(), accessoriGiostraB6(), accessoriLampionaioB6(), accessoriTessitriceB6(), alaCignoB6(), AZIONI_B6, azzeraMemoria(), b6 (+40 more)

### Community 9 - "Stanze speciali (a3-stanze-speciali)"
Cohesion: 0.11
Nodes (44): mostraBanner(), nomeD(), aggiungiStanzeSpecialiA3(), avviaSfidaA3(), avvisaA3(), chiudiSfidaA3(), creaStanzaA3(), daiCuraA3() (+36 more)

### Community 10 - "Scontro col Grande Burattinaio (d1-burattinaio)"
Cohesion: 0.06
Nodes (55): caricaSpriteTeatro(), disegnaCellaTeatro(), getSpriteTeatro(), registraVoceBossB8(), aTerraManoD1(), audioD1(), avviaAttoD1(), avviaVittoriaD1() (+47 more)

### Community 11 - "Riprendi la notte, mira assistita, conto (e6-assistenza)"
Cohesion: 0.07
Nodes (41): eseguiAttacco4Direzioni(), sparaProiettiliDirezione(), aCapoE6(), altroRiquadroE6(), angoloAssistitoE6(), arricchisciVoceE6(), ASSISTENZA_E6, campiPercorsoE6() (+33 more)

### Community 12 - "Immagini di scena (b9-immagini)"
Cohesion: 0.09
Nodes (49): disegnaA1(), disegnaBombaAccesaA1(), disegnaForziereA1(), disegnaLucchettoA1(), bordoDockB1(), disegnaForziereInVoloB1(), invalidaTeleB1(), disegnaRigaOpzioniB3() (+41 more)

### Community 13 - "I 200 oggetti (b5-oggetti)"
Cohesion: 0.07
Nodes (37): aggiornaFamigliB5(), aggiornaScieB5(), aggiornaSlotFucinaB5(), ATTIVI_B5, cambiaPaginaDiarioB5(), cellaDiarioB5(), CHIAVI_B5, coloreBordoB5() (+29 more)

### Community 14 - "Finali, Diario di Ferruccio e Voce (b8-finali-diario)"
Cohesion: 0.07
Nodes (35): b8, bossDelPianoCadutoB8(), bossSconfittoB8(), componiPaginaB8(), condizioneB8(), CONFIG_B8, DIARIO_B8, disegnaCordoneB8() (+27 more)

### Community 15 - "Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)"
Cohesion: 0.14
Nodes (36): getNumeroNotte(), aggiungiPaginaB8(), apriPortaB8(), cadutaB8(), daiFerroB8(), diciB8(), dopoMorteB8(), dopoRicominciaB8() (+28 more)

### Community 16 - "Acquedotto Carolino (d6-acquedotto)"
Cohesion: 0.06
Nodes (26): ACQUEDOTTO_D6, ARREDI_D6, AZIONI_D6, BOSS_D6, d6, DISEGNI_NEMICI_D6, IA_D6, iaNemicoD6() (+18 more)

### Community 17 - "Economia e salvataggi (t3-economia-salvataggi)"
Cohesion: 0.10
Nodes (25): testoToccoD7(), aggiornaBottoneAudio(), aggiornaRaggio(), aggiungiScintille(), cancellaSlot(), chiudiCancella(), dataBreve(), direzioneFrecce() (+17 more)

### Community 18 - "Combattimento (40-combattimento)"
Cohesion: 0.14
Nodes (34): incrementaNumeroNotte(), nuovaRun(), aggiornaFamigliOrbitaliD(), aggiornaProiettileD(), applicaSpinta(), bloccaProiettiliNemiciD(), congela(), danneggiaNemico() (+26 more)

### Community 19 - "Progressione e sblocchi (a6-progressione)"
Cohesion: 0.14
Nodes (27): a6, aCapoA6(), alternativaVeraA6(), avvisaBloccatoA6(), azzeraSblocchi(), bossSconfittoA6(), CONFIG_A6, controllaA6() (+19 more)

### Community 20 - "Configurazione e tabelle di gioco (00-config)"
Cohesion: 0.06
Nodes (30): ARENA, BOSS_A, BOSS_FINALE, canvas, CATALOGO_OGGETTI, CATALOGO_PATTO, CATALOGO_SEGRETO, ctx (+22 more)

### Community 21 - "Disegno della stanza e HUD (60-resa)"
Cohesion: 0.14
Nodes (27): getQuartierePiano(), disegnaFerruccioPittorico(), disegnaManoMarionettaPittorica(), disegnaNemicoPittorico(), getCharCorrente(), disegnaAltareSviluppatoreB(), disegnaAtmosferaQuartiere(), disegnaBuioD() (+19 more)

### Community 22 - "Pubblico e sipario (b1-pubblico)"
Cohesion: 0.07
Nodes (20): audioB1, bordiSiparioB1, candeleB1, COLORI_B1, datiSagomaB1(), disegnaSagomaSpettatoreB1(), disegnaTeatroB1(), ELEMENTI_B1 (+12 more)

### Community 23 - "Stili dei personaggi (d2-personaggi)"
Cohesion: 0.10
Nodes (22): levaToccoC2(), arcoMaglioD2(), bottoneMossaD2(), colpoMaglioD2(), conSpettraliD2(), d2, inScenaD2(), lampoD2() (+14 more)

### Community 24 - "Comandi, gamepad e opzioni (b3-comandi-opzioni)"
Cohesion: 0.09
Nodes (28): offsetScossa(), rettBottonePausaA7(), apriDiarioDirettoB3(), attivaVocePausaB3(), b3, BOTTONE_MENU_B3, CANONICO_B3, COMANDI_B3 (+20 more)

### Community 25 - "Bombe, chiavi e forzieri (a1-bombe-chiavi)"
Cohesion: 0.14
Nodes (15): aggiungiChiavi(), applicaLucchettiA1(), avvisoA1(), BOMBE_CHIAVI_A1, dropPuliziaA1(), generaForziere(), interazioniVicineA1, limitaArenaA1() (+7 more)

### Community 26 - "Stato della notte (20-stato)"
Cohesion: 0.19
Nodes (18): avviaPartitaConPersonaggio(), player, ricominciaNotte(), selezionaPersonaggio(), statoRun, avviaPiano(), entraInStanza(), interagisciStanza() (+10 more)

### Community 27 - "Oggetti e Diario degli oggetti (50-oggetti)"
Cohesion: 0.15
Nodes (23): effettiNotteC(), rng(), shuffle(), popolaStanza(), massaNemico(), creaCuoreB(), estraiDaPoolRunB(), estraiNegativoD() (+15 more)

### Community 28 - "Comandi a tocco (c2-tocco)"
Cohesion: 0.10
Nodes (27): scena(), AVVIO_LEGGERO_C2, c2, clickSulPalcoC2(), creaBottoneC2(), creaStratoC2(), disegnaLevaC2(), ICONE_C2 (+19 more)

### Community 29 - "I 200 oggetti · tickB5() (b5-oggetti)"
Cohesion: 0.13
Nodes (22): aggiungiBombe(), aggiornaMoltDannoB5(), aggiungiSciaB5(), allaRaccoltaB5(), allIngressoB5(), alPianoB5(), applicaScontiB5(), attiraB5() (+14 more)

### Community 30 - "Finali, Diario di Ferruccio e Voce · ferruccioB8() (b8-finali-diario)"
Cohesion: 0.15
Nodes (22): colpoRitmoB8(), daQuandoB8(), disegnaPortaB8(), fabbroB8(), ferruccioB8(), fondaleCieloB8(), fondaleFucinaB8(), fondaleManiB8() (+14 more)

### Community 31 - "Trasformazioni e sinergie · drawTextFit() (b4-trasformazioni)"
Cohesion: 0.20
Nodes (20): drawPixelSprite(), drawTextFit(), maledizioneD(), cellaDiarioD(), spriteD(), disegnaDiarioD(), disegnaIconeOggettiB(), disegnaArrediA3() (+12 more)

### Community 32 - "Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)"
Cohesion: 0.18
Nodes (18): aCapoB8(), aggiornaDidB8(), boccascenaB8(), didLiberaB8(), disegnaCartiglioB8(), disegnaDiarioB8(), disegnaDidB8(), disegnaFinaleB8() (+10 more)

### Community 33 - "Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)"
Cohesion: 0.16
Nodes (18): applicaBattutaB8(), apriDiarioB8(), avanzaCartB8(), avanzaFinaleB8(), bussaB8(), clickB8(), clickFinaleB8(), concludiFinaleB8() (+10 more)

### Community 34 - "Rifiniture e Ragno della Seta (d7-rifiniture)"
Cohesion: 0.16
Nodes (17): clickDiarioD(), tastoDiarioD(), aloneProiettileD7(), cambiaStatoRagnoD7(), casoRagnoD7(), disegnaArenaLucianaD7(), disegnaSetaD7(), hashD7() (+9 more)

### Community 35 - "Disegno di personaggi e boss (10-sprite)"
Cohesion: 0.16
Nodes (12): CARTELLE_SPRITE_V2, disegnaBossDaImmagineA(), disegnaBossPittorico(), disegnaGattoSprite(), getGattoImage(), SPRITE_BOSS_A, SPRITE_OGGETTI, SPRITE_PROIETTILI (+4 more)

### Community 36 - "Pubblico e sipario · telaB1() (b1-pubblico)"
Cohesion: 0.18
Nodes (17): altezzaLatiB1(), disegnaFondoZonaB1(), disegnaFronteZonaB1(), disegnaLumiZonaB1(), disegnaSpettatoreB1(), disegnaTestiSiparioB1(), ridisegnaZonaB1(), telaAloneB1() (+9 more)

### Community 37 - "Cambio di scena e botole (d5-cambio-scena)"
Cohesion: 0.12
Nodes (25): alonaD5(), BOTOLE_D5, buioCambioD5(), candidataD5(), cicloD5(), disegnaBotolaD5(), disegnaCambioD5(), disegnaCartelloD5() (+17 more)

### Community 38 - "Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)"
Cohesion: 0.28
Nodes (16): attivaRigaB3(), avvisoB3(), cambiaPaginaB3(), cambiaSchermoInteroB3(), chiudiOpzioniB3(), clamp01B3(), clickOpzioniB3(), impostaOpzioneB3() (+8 more)

### Community 39 - "Comandi, gamepad e opzioni · aggiornaPadB3() (b3-comandi-opzioni)"
Cohesion: 0.19
Nodes (15): aggiornaPadB3(), apriOpzioniB3(), direzioneMovimentoB3(), direzioneNavB3(), direzioneSparoB3(), inviaTastoB3(), navRipetiB3(), padCorrenteB3() (+7 more)

### Community 40 - "Varianti di stanza · suonoB7() (b7-stanze)"
Cohesion: 0.20
Nodes (15): accendiBombaB7(), aggiornaFragiliB7(), aggiornaOlioB7(), aggiornaSuoloB7(), corpoSolidoB7(), dopoIlPassoB7(), fineManoB7(), pagaManoB7() (+7 more)

### Community 41 - "Pubblico e sipario · reazionePubblicoB1() (b1-pubblico)"
Cohesion: 0.20
Nodes (14): aggiungiVoceB1(), colpoSubitoB1(), coroB1(), fonteBuffaB1(), lanciaFioriB1(), reazionePubblicoB1(), riquadroVoceB1(), rndB1 (+6 more)

### Community 42 - "Comandi a tocco · installaC2() (c2-tocco)"
Cohesion: 0.18
Nodes (17): adattaRisoluzione(), mappaConSeme(), contestoB3(), attivaC2(), bottoneGiuC2(), disattivaC2(), installaC2(), lasciaSpegnereC2() (+9 more)

### Community 43 - "Oggetti e Diario degli oggetti · acquisisciOggettoConLimite5Slot() (50-oggetti)"
Cohesion: 0.22
Nodes (15): acquisisciOggettoConLimite5Slot(), ARMI_SPECIALI_INTERCAMBIABILI, conosciutiD(), conosciutiMemoriaD, conosciutoD(), descD(), dopoRaccoltaD(), eArmaSpeciale() (+7 more)

### Community 44 - "Pubblico e sipario · disegnaSiparioB1() (b1-pubblico)"
Cohesion: 0.19
Nodes (13): contestoB1(), disegnaSiparioB1(), disegnaTendeB1(), dopoFrameSiparioB1(), liscioB1(), siparioChiusoB1(), suonaB1(), suonoMovimentoSiparioB1() (+5 more)

### Community 45 - "Cambio di scena e botole · ticksDaMs() (d5-cambio-scena)"
Cohesion: 0.21
Nodes (13): ticksDaMs(), paraColpoB5(), creaNemiciB7(), liberaRagnoB7(), aperturaBotolaD5(), avviaCambioD5(), entraSecondaCompagniaD5(), faiSalireD5() (+5 more)

### Community 46 - "Pubblico e sipario · bufferB1() (b1-pubblico)"
Cohesion: 0.21
Nodes (12): aggiornaBrusioB1(), bufferB1(), creaApplausoB1(), creaFollaB1(), generatoreB1(), normalizzaB1(), rumoreB1(), SUONATORI_B1 (+4 more)

### Community 47 - "Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)"
Cohesion: 0.24
Nodes (12): arcoPalcoLatoB1(), candelaB1(), davanzaleB1(), disegnaBalconataFronteB1(), disegnaMantovanaB1(), disegnaPalcoLatoFondoB1(), disegnaPalcoLatoFronteB1(), disegnaTeloSiparioB1() (+4 more)

### Community 48 - "Comandi a tocco · disponiC2() (c2-tocco)"
Cohesion: 0.36
Nodes (8): aggiornaClassiC2(), disponiC2(), firmaDisposizioneC2(), limitaC2(), mettiC2(), opzioneC2(), verticaleC2(), schedaD2()

### Community 49 - "Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)"
Cohesion: 0.22
Nodes (11): aggiornaPubblicoB1(), aggiornaVoliB1(), allineaStanzaB1(), atterraPremioB1(), atterraTuttoB1(), azzeraPubblicoB1(), cambioStanzaB1(), conLancioB1() (+3 more)

### Community 50 - "Pubblico e sipario · limitaB1() (b1-pubblico)"
Cohesion: 0.29
Nodes (11): dopoMonetaB1(), fermaSipario(), impostaGradimentoB1(), lanciaNuoviB1(), lanciaPremioB1(), lanciatoreB1(), limitaB1(), postoLiberoB1() (+3 more)

### Community 51 - "Varianti di stanza · scegliVarianteB7() (b7-stanze)"
Cohesion: 0.19
Nodes (16): analizzaVarianteB7(), applicaDisposizioneB7(), arredaStanzaB7(), cellaB7(), elementiVarianteB7(), estraiPesatoB7(), quartiereB7(), regioniB7() (+8 more)

### Community 52 - "Rete di sicurezza degli errori (000-errori)"
Cohesion: 0.31
Nodes (9): aggiornaRiquadroErrori(), ERRORI_TEATRO, fusibileScenaTeatro(), RETE_ERRORI, ripulisciContestoTeatro(), segnalaErroreTeatro(), testoErroriTeatro(), iniziaFrame() (+1 more)

### Community 53 - "Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)"
Cohesion: 0.27
Nodes (10): adattaTestoB3(), altezzaRigaB3(), disegnaOpzioniB3(), dopoIlFrameB3(), etichettaTastoB3(), inToccoB3(), simboloB3(), tastoMossaD2() (+2 more)

### Community 54 - "Comandi, gamepad e opzioni · tastieraB3() (b3-comandi-opzioni)"
Cohesion: 0.28
Nodes (9): aggiornaAdattaB3(), bloccaB3(), coordB3(), dentroB3(), filtroIngressiB3(), mouseB3(), segnaDispositivoB3(), tastieraB3() (+1 more)

### Community 55 - "Finali, Diario di Ferruccio e Voce · logicaHubB8() (b8-finali-diario)"
Cohesion: 0.31
Nodes (9): dialogoT4B8(), distToninoB8(), logicaB8(), logicaGiocoB8(), logicaHubB8(), osservaDialogoT4B8(), ritmoGiustoB8(), t4qaB8() (+1 more)

### Community 56 - "Qualità automatica (e4-prestazioni)"
Cohesion: 0.31
Nodes (7): azzera(), e4, passoQualitaE4(), QUALITA_E4, qualitaAutoAttivaE4(), riaccendiTuttoE4(), RIGA_E4

### Community 57 - "Generatore della mappa (30-mappa)"
Cohesion: 0.18
Nodes (14): allontanaNemiciDallePorteC(), apriMuroSegreto(), colpisciMuroSegretoC(), ENTRATE_C, generaMappaPiano(), numeroStanzeCombattimento(), PORTE_C, porteVietateC() (+6 more)

### Community 58 - "Comandi, gamepad e opzioni · salvaOpzioni() (b3-comandi-opzioni)"
Cohesion: 0.32
Nodes (8): salvaOpzioni(), assegnaTastoB3(), catturaTastoB3(), ricostruisciTastiB3(), rilasciaTuttoB3(), ripristinaTastiB3(), riservatoB3(), tastiValidiB3()

### Community 59 - "Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)"
Cohesion: 0.36
Nodes (8): avviaFinaleB8(), chiudiDiarioB8(), clickDiarioB8(), contestoFinaleB8(), flagTramaB8(), rigaFinaleB8(), tastoDiarioB8(), vociFinaliB8()

### Community 60 - "Finali, Diario di Ferruccio e Voce · leggiDiarioB8() (b8-finali-diario)"
Cohesion: 0.32
Nodes (8): azzera(), chiaveDiarioB8(), disegnaLinguettaB8(), leggiDiarioB8(), normalizzaB8(), scriviDiarioB8(), slotB8(), vuotoB8()

### Community 61 - "Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)"
Cohesion: 0.25
Nodes (8): casoFissoD6(), dipingiFondaleD6(), dipingiQuintaD6(), disegnaCanaleD6(), disegnaDrappoD6(), disegnaFiaccolaD6(), disegnaLuogoD6(), telaPavimentoD6()

### Community 62 - "sim-economia.js (sim-economia)"
Cohesion: 0.25
Nodes (5): n, path, r, radice, { spawnSync }

### Community 63 - "Comandi a tocco · dopoIlFrameC2() (c2-tocco)"
Cohesion: 0.43
Nodes (7): liberoB3(), aggiornaVistaC2(), dopoIlFrameC2(), schermoInteroAttivoC2(), schermoInteroPossibileC2(), statoBottoniC2(), vistaC2()

### Community 64 - "Finali, Diario di Ferruccio e Voce · suonoFerroB8() (b8-finali-diario)"
Cohesion: 0.29
Nodes (7): accodaDidB8(), aggiornaFinaleB8(), audioB8(), suonoFerroB8(), suonoVoceB8(), voltoSalvaB8(), voceD1()

### Community 65 - "Acquedotto Carolino · usaGrataD6() (d6-acquedotto)"
Cohesion: 0.33
Nodes (7): aggiornaPanniD6(), grata(), grataQuiD6(), prendiAcquedottoD6(), segnaAcquedottoD6(), suonoAcquaD6(), usaGrataD6()

### Community 66 - "Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.43
Nodes (7): cerchiAcquaD6(), chinaD6(), disegnaGuardianoD6(), otreD6(), puntoD6(), trattoD6(), tridenteD6()

### Community 67 - "Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)"
Cohesion: 0.29
Nodes (7): corrente(), correnteInD6(), dopoIlPassoD6(), fuoriDagliOstacoliD6(), limitaD6(), muoviD6(), volaD6()

### Community 68 - "Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.29
Nodes (7): entraStatoD6(), iaGuardianoD6(), nuovaAcquaD6(), prossimoStatoD6(), valoreD6(), versoGiocatoreD6(), leggi()

### Community 69 - "Varianti di stanza · drawPillLabel() (b7-stanze)"
Cohesion: 0.33
Nodes (6): drawPillLabel(), disegnaBottoneBloccatoA6(), disegnaCiarlatanoB7(), disegnaSacchiB7(), disegnaTempoClessidraB7(), bloccaD3()

### Community 71 - "I 200 oggetti · trovaOggettoB() (b5-oggetti)"
Cohesion: 0.40
Nodes (5): trovaOggettoB(), aggregaB5(), calcolaStatB5(), daiOggettoB5(), smaltisciNotificheB5()

### Community 72 - "I 200 oggetti · allaPuliziaB5() (b5-oggetti)"
Cohesion: 0.60
Nodes (5): allaPuliziaB5(), allaUccisioneB5(), curaB5(), lasciaDonoB5(), monetaB5()

### Community 73 - "Varianti di stanza · disegna() (b7-stanze)"
Cohesion: 0.50
Nodes (5): ombraB7(), rettB7(), sagomaB7(), bloccoTufoD6(), disegna()

### Community 74 - "Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)"
Cohesion: 0.40
Nodes (5): aggiornaVentoD6(), piegaProiettileD6(), rumoreD6(), soffioD6(), suonoVentoD6()

### Community 76 - "Varianti di stanza · disegnaOstacoloB7() (b7-stanze)"
Cohesion: 0.67
Nodes (4): disegnaOstacoloB7(), timbroB7(), arredoD6(), disegnaArredoD6()

### Community 77 - "Acquedotto Carolino · posaDonoD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): acquedottoAttivoD6(), guardianoSconfittoD6(), intonaD6(), posaDonoD6()

### Community 78 - "Acquedotto Carolino · disegnaAriaD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): disegnaAriaD6(), ombraD6(), pannoD6(), piegaVentoD6()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `passoLogico()` connect `Combattimento (40-combattimento)` to `Ribalta, luci e ombre (b2-ribalta)`, `Registro delle notti (a7-registro-bilancio)`, `Partenza segreta (c1-partenza-segreta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Varianti di stanza (b7-stanze)`, `Registro di Scena e trionfi (d3-registro-scena)`, `Trasformazioni e sinergie (b4-trasformazioni)`, `Boss per piano (b6-boss)`, `Stanze speciali (a3-stanze-speciali)`, `Scontro col Grande Burattinaio (d1-burattinaio)`, `Riprendi la notte, mira assistita, conto (e6-assistenza)`, `I 200 oggetti (b5-oggetti)`, `Acquedotto Carolino (d6-acquedotto)`, `Pubblico e sipario (b1-pubblico)`, `Stili dei personaggi (d2-personaggi)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Stato della notte (20-stato)`, `Oggetti e Diario degli oggetti (50-oggetti)`, `Rifiniture e Ragno della Seta (d7-rifiniture)`, `Cambio di scena e botole (d5-cambio-scena)`, `Rete di sicurezza degli errori (000-errori)`, `Generatore della mappa (30-mappa)`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **Are the 62 inferred relationships involving `mostraBanner()` (e.g. with `apriMuroSegreto()` and `entraInStanza()`) actually correct?**
  _`mostraBanner()` has 62 INFERRED edges - model-reasoned connections that need verification._
- **Should `Ribalta, luci e ombre (b2-ribalta)` be split into smaller, more focused modules?**
  _Cohesion score 0.05339506172839506 - nodes in this community are weakly interconnected._
- **Why does `disegnaStanzaPixelArt()` connect `Disegno della stanza e HUD (60-resa)` to `Ribalta, luci e ombre (b2-ribalta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Varianti di stanza (b7-stanze)`, `Cambio di scena e botole (d5-cambio-scena)`, `Stanze speciali (a3-stanze-speciali)`, `Scontro col Grande Burattinaio (d1-burattinaio)`, `Immagini di scena (b9-immagini)`, `Finali, Diario di Ferruccio e Voce (b8-finali-diario)`, `Acquedotto Carolino (d6-acquedotto)`, `Pubblico e sipario (b1-pubblico)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Stato della notte (20-stato)`, `Trasformazioni e sinergie · drawTextFit() (b4-trasformazioni)`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Are the 56 inferred relationships involving `drawTextFit()` (e.g. with `disegnaCartiglioD()` and `disegnaDiarioD()`) actually correct?**
  _`drawTextFit()` has 56 INFERRED edges - model-reasoned connections that need verification._
- **Should `Registro delle notti (a7-registro-bilancio)` be split into smaller, more focused modules?**
  _Cohesion score 0.05664556962025316 - nodes in this community are weakly interconnected._
- **Why does `entraInStanza()` connect `Stato della notte (20-stato)` to `Ribalta, luci e ombre (b2-ribalta)`, `Registro delle notti (a7-registro-bilancio)`, `Partenza segreta (c1-partenza-segreta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Varianti di stanza (b7-stanze)`, `Registro di Scena e trionfi (d3-registro-scena)`, `Boss per piano (b6-boss)`, `Stanze speciali (a3-stanze-speciali)`, `Scontro col Grande Burattinaio (d1-burattinaio)`, `Finali, Diario di Ferruccio e Voce (b8-finali-diario)`, `Acquedotto Carolino (d6-acquedotto)`, `Combattimento (40-combattimento)`, `Disegno della stanza e HUD (60-resa)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Trasformazioni e sinergie · drawTextFit() (b4-trasformazioni)`, `Cambio di scena e botole (d5-cambio-scena)`, `Oggetti e Diario degli oggetti · acquisisciOggettoConLimite5Slot() (50-oggetti)`, `Cambio di scena e botole · ticksDaMs() (d5-cambio-scena)`, `Generatore della mappa (30-mappa)`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._