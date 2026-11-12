# Graph Report - Gioco  (2026-11-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1839 nodes · 4742 edges · 75 communities (73 shown, 2 thin omitted)
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 1277 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `37ec8d9b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Ribalta, luci e ombre (b2-ribalta)
- Registro delle notti (a7-registro-bilancio)
- Buca, terna e Camerini (d4-stanze-teatro)
- Partenza segreta (c1-partenza-segreta)
- Piazza Dante e storia (t4-hub-storia)
- Trasformazioni e sinergie (b4-trasformazioni)
- Registro di Scena e trionfi (d3-registro-scena)
- Boss per piano (b6-boss)
- Varianti di stanza (b7-stanze)
- Riprendi la notte, mira assistita, conto (e6-assistenza)
- Scontro col Grande Burattinaio (d1-burattinaio)
- Immagini di scena (b9-immagini)
- I 200 oggetti (b5-oggetti)
- Cambio di scena e botole (d5-cambio-scena)
- Finali, Diario di Ferruccio e Voce (b8-finali-diario)
- Bombe, chiavi e forzieri (a1-bombe-chiavi)
- Stanze speciali (a3-stanze-speciali)
- Acquedotto Carolino (d6-acquedotto)
- Progressione e sblocchi (a6-progressione)
- Economia e salvataggi (t3-economia-salvataggi)
- Disegno della stanza e HUD (60-resa)
- Configurazione e tabelle di gioco (00-config)
- Finali, Diario di Ferruccio e Voce · getNumeroNotte() (b8-finali-diario)
- Pubblico e sipario (b1-pubblico)
- Stili dei personaggi (d2-personaggi)
- Combattimento (40-combattimento)
- Comandi, gamepad e opzioni (b3-comandi-opzioni)
- Comandi a tocco (c2-tocco)
- Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)
- Trasformazioni e sinergie · drawTextFit() (b4-trasformazioni)
- Varianti di stanza · allestisciB7() (b7-stanze)
- Stato della notte (20-stato)
- Finali, Diario di Ferruccio e Voce · ferruccioB8() (b8-finali-diario)
- Oggetti e Diario degli oggetti (50-oggetti)
- Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)
- Rifiniture e Ragno della Seta (d7-rifiniture)
- Pubblico e sipario · telaB1() (b1-pubblico)
- I 200 oggetti · tickB5() (b5-oggetti)
- Pubblico e sipario · limitaB1() (b1-pubblico)
- Disegno di personaggi e boss (10-sprite)
- Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)
- Varianti di stanza · suonoB7() (b7-stanze)
- Generatore della mappa (30-mappa)
- Oggetti e Diario degli oggetti · disegnaDiarioD() (50-oggetti)
- Comandi, gamepad e opzioni · aggiornaPadB3() (b3-comandi-opzioni)
- Pubblico e sipario · disegnaSiparioB1() (b1-pubblico)
- Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)
- Comandi a tocco · installaC2() (c2-tocco)
- Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)
- Pubblico e sipario · bufferB1() (b1-pubblico)
- Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)
- Rete di sicurezza degli errori (000-errori)
- Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)
- Pubblico e sipario · reazionePubblicoB1() (b1-pubblico)
- Comandi, gamepad e opzioni · tastieraB3() (b3-comandi-opzioni)
- Comandi a tocco · dopoIlFrameC2() (c2-tocco)
- Qualità automatica (e4-prestazioni)
- Fogli di sprite (t2-sprite)
- Finali, Diario di Ferruccio e Voce · disegnaSopraHubB8() (b8-finali-diario)
- Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)
- Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)
- sim-economia.js (sim-economia)
- Comandi, gamepad e opzioni · salvaOpzioni() (b3-comandi-opzioni)
- Comandi a tocco · disponiC2() (c2-tocco)
- Acquedotto Carolino · usaGrataD6() (d6-acquedotto)
- Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)
- Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)
- Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)
- I 200 oggetti · trovaOggettoB() (b5-oggetti)
- Comandi a tocco · contestoB3() (c2-tocco)
- Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)
- Icone degli oggetti (b5-oggetti-icone)
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
8. `scuoti()` - 31 edges
9. `statoB8()` - 31 edges
10. `entraInStanza()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `disegnaSopraB5()` --calls--> `drawPixelSprite()`  [INFERRED]
  b5-oggetti.js → 10-sprite.js
- `voceVirtualeB5()` --calls--> `getNumeroNotte()`  [INFERRED]
  b5-oggetti.js → 20-stato.js
- `disegnaHUDPixelArt()` --calls--> `testoInventarioA1()`  [INFERRED]
  60-resa.js → a1-bombe-chiavi.js
- `maschereInMoneteD2()` --calls--> `mostraBanner()`  [INFERRED]
  d2-personaggi.js → 20-stato.js
- `dopoIngressoBucaD4()` --calls--> `mostraBanner()`  [INFERRED]
  d4-stanze-teatro.js → 20-stato.js

## Import Cycles
- None detected.

## Communities (75 total, 2 thin omitted)

### Community 0 - "Ribalta, luci e ombre (b2-ribalta)"
Cohesion: 0.05
Nodes (70): agganciaStanza(), aggiungiRiparo(), alMorire(), altezzaDi(), atterra(), audioPronto(), contorna(), creaPezzi() (+62 more)

### Community 1 - "Registro delle notti (a7-registro-bilancio)"
Cohesion: 0.06
Nodes (71): aggiornaScalaA2(), applicaAmpollaA2(), applicaCartaA2(), conosciutiA2(), conosciutiMemoriaA2, CONS_A2, CONS_A2_AMPOLLE, CONS_A2_CARTE (+63 more)

### Community 2 - "Buca, terna e Camerini (d4-stanze-teatro)"
Cohesion: 0.06
Nodes (74): puntoLontanoDallePorteC(), MUSICA, aggiungiBucaD4(), alBattereD4(), alTempoD4(), applausoD4(), apriTernaD4(), astaD4() (+66 more)

### Community 3 - "Partenza segreta (c1-partenza-segreta)"
Cohesion: 0.07
Nodes (73): eArmaSpeciale(), cellaPannelloB(), clickPannelloB(), apriArmeriaC1(), apriDialogoC1(), apriDomandaC1(), apriRicordoC1(), armeriaApertaC1() (+65 more)

### Community 4 - "Piazza Dante e storia (t4-hub-storia)"
Cohesion: 0.08
Nodes (56): aCapo(), aggiornaHub(), aggiornaMorte(), apriDialogo(), apriDialogoC(), avanzaDialogo(), avviaMorte(), avvio() (+48 more)

### Community 5 - "Trasformazioni e sinergie (b4-trasformazioni)"
Cohesion: 0.06
Nodes (56): getSpriteCanvas(), aggiornaSinergieB4(), aloneB4(), aloniB4, ANCORE_B4, applicaEffettiB4(), apriPupazzoB4(), attivaTrasformazioneB4() (+48 more)

### Community 6 - "Registro di Scena e trionfi (d3-registro-scena)"
Cohesion: 0.08
Nodes (50): annunciaTrionfoD3(), apertureD3(), apriRegistroScenaD3(), attrezzeriaD3(), bossSconfittoD3(), cambiaSezioneD3(), chiudiRegistroScenaD3(), clickLibroD3() (+42 more)

### Community 7 - "Boss per piano (b6-boss)"
Cohesion: 0.07
Nodes (48): disegnaMobSprite(), accessoriGiostraB6(), accessoriLampionaioB6(), accessoriTessitriceB6(), alaCignoB6(), AZIONI_B6, azzeraMemoria(), b6 (+40 more)

### Community 8 - "Varianti di stanza (b7-stanze)"
Cohesion: 0.06
Nodes (48): analisiB7, arredaMappaB7(), chiudiCiarlatanoB7(), CIARLATANO_B7, CLESSIDRA_B7, clickCiarlatanoB7(), colpisciFragileB7(), COPPIE_B7 (+40 more)

### Community 9 - "Riprendi la notte, mira assistita, conto (e6-assistenza)"
Cohesion: 0.07
Nodes (41): eseguiAttacco4Direzioni(), sparaProiettiliDirezione(), aCapoE6(), altroRiquadroE6(), angoloAssistitoE6(), arricchisciVoceE6(), ASSISTENZA_E6, campiPercorsoE6() (+33 more)

### Community 10 - "Scontro col Grande Burattinaio (d1-burattinaio)"
Cohesion: 0.09
Nodes (42): registraVoceBossB8(), aTerraManoD1(), audioD1(), avviaAttoD1(), avviaVittoriaD1(), BURATTINAIO_D1, calaMarionettaD1(), capoD1() (+34 more)

### Community 11 - "Immagini di scena (b9-immagini)"
Cohesion: 0.11
Nodes (41): invalidaTeleB1(), disegnaRigaOpzioniB3(), disegnaClessidraB7(), aloneCaldoB9(), arredoImmagineB9(), cartiglioOpzioniB9(), CONFIG_B9, contaB9() (+33 more)

### Community 12 - "I 200 oggetti (b5-oggetti)"
Cohesion: 0.07
Nodes (38): aggiornaFamigliB5(), aggiornaScieB5(), aggiornaSlotFucinaB5(), ATTIVI_B5, cambiaPaginaDiarioB5(), cellaDiarioB5(), CHIAVI_B5, coloreBordoB5() (+30 more)

### Community 13 - "Cambio di scena e botole (d5-cambio-scena)"
Cohesion: 0.09
Nodes (38): ticksDaMs(), allontanaNemiciDallePorteC(), porteVietateC(), paraColpoB5(), piazzaNemiciB7(), alonaD5(), aperturaBotolaD5(), avviaCambioD5() (+30 more)

### Community 14 - "Finali, Diario di Ferruccio e Voce (b8-finali-diario)"
Cohesion: 0.08
Nodes (33): b8, bossDelPianoCadutoB8(), bossSconfittoB8(), componiPaginaB8(), CONFIG_B8, DIARIO_B8, disegnaCordoneB8(), disegnaFontanaB8() (+25 more)

### Community 15 - "Bombe, chiavi e forzieri (a1-bombe-chiavi)"
Cohesion: 0.08
Nodes (32): aggiornaBombeA1(), aggiungiBombe(), aggiungiChiavi(), applicaLucchettiA1(), apriForziereA1(), avvisoA1(), BOMBE_CHIAVI_A1, disegnaA1() (+24 more)

### Community 16 - "Stanze speciali (a3-stanze-speciali)"
Cohesion: 0.14
Nodes (34): mostraBanner(), nomeD(), avviaSfidaA3(), avvisaA3(), chiudiSfidaA3(), daiCuraA3(), daiForziereA3(), daiMoneteA3() (+26 more)

### Community 17 - "Acquedotto Carolino (d6-acquedotto)"
Cohesion: 0.06
Nodes (24): ACQUEDOTTO_D6, AZIONI_D6, azzeraVentoD6(), BOSS_D6, d6, DISEGNI_NEMICI_D6, fraD6(), IA_D6 (+16 more)

### Community 18 - "Progressione e sblocchi (a6-progressione)"
Cohesion: 0.13
Nodes (28): a6, aCapoA6(), alternativaVeraA6(), avvisaBloccatoA6(), azzeraSblocchi(), bossSconfittoA6(), CONFIG_A6, controllaA6() (+20 more)

### Community 19 - "Economia e salvataggi (t3-economia-salvataggi)"
Cohesion: 0.11
Nodes (22): testoToccoD7(), aggiornaBottoneAudio(), aggiornaRaggio(), aggiungiScintille(), dataBreve(), direzioneFrecce(), disegnaAvviso(), disegnaBottone() (+14 more)

### Community 20 - "Disegno della stanza e HUD (60-resa)"
Cohesion: 0.13
Nodes (31): getQuartierePiano(), disegnaFerruccioPittorico(), disegnaManoMarionettaPittorica(), disegnaNemicoPittorico(), getCharCorrente(), descD(), effettoVisibileD(), loreD() (+23 more)

### Community 21 - "Configurazione e tabelle di gioco (00-config)"
Cohesion: 0.06
Nodes (30): ARENA, BOSS_A, BOSS_FINALE, canvas, CATALOGO_OGGETTI, CATALOGO_PATTO, CATALOGO_SEGRETO, ctx (+22 more)

### Community 22 - "Finali, Diario di Ferruccio e Voce · getNumeroNotte() (b8-finali-diario)"
Cohesion: 0.12
Nodes (31): getNumeroNotte(), accodaDidB8(), aggiornaFinaleB8(), apriPortaB8(), cadutaB8(), daiFerroB8(), dialogoT4B8(), diciB8() (+23 more)

### Community 23 - "Pubblico e sipario (b1-pubblico)"
Cohesion: 0.07
Nodes (20): audioB1, bordiSiparioB1, candeleB1, COLORI_B1, datiSagomaB1(), disegnaForziereInVoloB1(), disegnaSagomaSpettatoreB1(), disegnaVoliB1() (+12 more)

### Community 24 - "Stili dei personaggi (d2-personaggi)"
Cohesion: 0.10
Nodes (22): levaToccoC2(), arcoMaglioD2(), bottoneMossaD2(), colpoMaglioD2(), conSpettraliD2(), d2, inScenaD2(), lampoD2() (+14 more)

### Community 25 - "Combattimento (40-combattimento)"
Cohesion: 0.17
Nodes (29): apriMuroSegreto(), aggiornaFamigliOrbitaliD(), aggiornaProiettileD(), applicaSpinta(), bloccaProiettiliNemiciD(), congela(), danneggiaNemico(), esplodiD() (+21 more)

### Community 26 - "Comandi, gamepad e opzioni (b3-comandi-opzioni)"
Cohesion: 0.09
Nodes (28): offsetScossa(), rettBottonePausaA7(), apriDiarioDirettoB3(), attivaVocePausaB3(), b3, BOTTONE_MENU_B3, CANONICO_B3, COMANDI_B3 (+20 more)

### Community 27 - "Comandi a tocco (c2-tocco)"
Cohesion: 0.10
Nodes (24): scena(), AVVIO_LEGGERO_C2, c2, clickSulPalcoC2(), creaBottoneC2(), creaStratoC2(), disegnaLevaC2(), ICONE_C2 (+16 more)

### Community 28 - "Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)"
Cohesion: 0.16
Nodes (26): aggiungiPaginaB8(), azzera(), chiaveDiarioB8(), disegnaLinguettaB8(), dopoMorteB8(), dopoRicominciaB8(), entraSopraLaRibaltaB8(), finaleSopraLaRibaltaB8() (+18 more)

### Community 29 - "Trasformazioni e sinergie · drawTextFit() (b4-trasformazioni)"
Cohesion: 0.14
Nodes (24): drawPillLabel(), drawPixelSprite(), drawTextFit(), maledizioneD(), disegnaHUDPixelArt(), disegnaIconeOggettiB(), disegnaMappaRivelataA2(), disegnaArrediA3() (+16 more)

### Community 30 - "Varianti di stanza · allestisciB7() (b7-stanze)"
Cohesion: 0.12
Nodes (24): aggiornaFragiliB7(), allestisciB7(), analizzaVarianteB7(), applicaDisposizioneB7(), arredaStanzaB7(), cellaB7(), creaNemiciB7(), dopoIngressoB7() (+16 more)

### Community 31 - "Stato della notte (20-stato)"
Cohesion: 0.20
Nodes (17): avviaPartitaConPersonaggio(), incrementaNumeroNotte(), nuovaRun(), player, ricalcolaStatistiche(), ricominciaNotte(), selezionaPersonaggio(), statoRun (+9 more)

### Community 32 - "Finali, Diario di Ferruccio e Voce · ferruccioB8() (b8-finali-diario)"
Cohesion: 0.15
Nodes (22): colpoRitmoB8(), daQuandoB8(), disegnaPortaB8(), fabbroB8(), ferruccioB8(), fondaleCieloB8(), fondaleFucinaB8(), fondaleManiB8() (+14 more)

### Community 33 - "Oggetti e Diario degli oggetti (50-oggetti)"
Cohesion: 0.18
Nodes (21): effettiNotteC(), rng(), popolaStanza(), spawnaMonetaATerra(), verificaStanzaPulita(), estraiNegativoD(), estraiOggettoBase(), estraiOggettoForte() (+13 more)

### Community 34 - "Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)"
Cohesion: 0.14
Nodes (20): applicaBattutaB8(), apriDiarioB8(), audioB8(), avanzaCartB8(), avanzaFinaleB8(), bussaB8(), clickB8(), clickFinaleB8() (+12 more)

### Community 35 - "Rifiniture e Ragno della Seta (d7-rifiniture)"
Cohesion: 0.16
Nodes (17): tastoDiarioD(), aloneProiettileD7(), cambiaStatoRagnoD7(), casoRagnoD7(), disegnaArenaLucianaD7(), disegnaRagnoSetaD7(), disegnaSetaD7(), hashD7() (+9 more)

### Community 36 - "Pubblico e sipario · telaB1() (b1-pubblico)"
Cohesion: 0.16
Nodes (19): altezzaLatiB1(), disegnaFondoZonaB1(), disegnaFronteZonaB1(), disegnaLumiZonaB1(), disegnaSpettatoreB1(), disegnaTeatroB1(), disegnaTestiSiparioB1(), ridisegnaZonaB1() (+11 more)

### Community 37 - "I 200 oggetti · tickB5() (b5-oggetti)"
Cohesion: 0.15
Nodes (19): aggiornaMoltDannoB5(), aggiungiSciaB5(), allaPuliziaB5(), allaUccisioneB5(), attiraB5(), B5(), bannerDopoB5(), copiaColpoB5() (+11 more)

### Community 38 - "Pubblico e sipario · limitaB1() (b1-pubblico)"
Cohesion: 0.18
Nodes (18): coroB1(), dopoMonetaB1(), fermaSipario(), impostaGradimentoB1(), lanciaFioriB1(), lanciaNuoviB1(), lanciaPremioB1(), lanciatoreB1() (+10 more)

### Community 39 - "Disegno di personaggi e boss (10-sprite)"
Cohesion: 0.16
Nodes (14): caricaSpriteTeatro(), CARTELLE_SPRITE_V2, disegnaBossDaImmagineA(), disegnaBossPittorico(), disegnaGattoSprite(), getGattoImage(), getSpriteTeatro(), SPRITE_BOSS_A (+6 more)

### Community 40 - "Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)"
Cohesion: 0.28
Nodes (16): attivaRigaB3(), avvisoB3(), cambiaPaginaB3(), cambiaSchermoInteroB3(), chiudiOpzioniB3(), clamp01B3(), clickOpzioniB3(), impostaOpzioneB3() (+8 more)

### Community 41 - "Varianti di stanza · suonoB7() (b7-stanze)"
Cohesion: 0.18
Nodes (16): accendiBombaB7(), aggiornaOlioB7(), aggiornaSuoloB7(), chiudiClessidraB7(), corpoSolidoB7(), dopoIlPassoB7(), fineManoB7(), moneteATerraB7() (+8 more)

### Community 42 - "Generatore della mappa (30-mappa)"
Cohesion: 0.21
Nodes (14): shuffle(), avviaPiano(), colpisciMuroSegretoC(), entraInStanza(), ENTRATE_C, generaMappaPiano(), numeroStanzeCombattimento(), PORTE_C (+6 more)

### Community 43 - "Oggetti e Diario degli oggetti · disegnaDiarioD() (50-oggetti)"
Cohesion: 0.21
Nodes (14): ARMI_SPECIALI_INTERCAMBIABILI, cellaDiarioD(), clickDiarioD(), conosciutiD(), conosciutiMemoriaD, conosciutoD(), creaCuoreB(), dopoRaccoltaD() (+6 more)

### Community 44 - "Comandi, gamepad e opzioni · aggiornaPadB3() (b3-comandi-opzioni)"
Cohesion: 0.19
Nodes (15): aggiornaPadB3(), apriOpzioniB3(), direzioneMovimentoB3(), direzioneNavB3(), direzioneSparoB3(), inviaTastoB3(), navRipetiB3(), padCorrenteB3() (+7 more)

### Community 45 - "Pubblico e sipario · disegnaSiparioB1() (b1-pubblico)"
Cohesion: 0.19
Nodes (14): disegnaSiparioB1(), disegnaTendeB1(), dopoFrameSiparioB1(), liscioB1(), rumoreB1(), siparioChiusoB1(), suonaB1(), suonoMovimentoSiparioB1() (+6 more)

### Community 46 - "Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)"
Cohesion: 0.23
Nodes (13): arcoPalcoLatoB1(), candelaB1(), davanzaleB1(), disegnaBalconataFronteB1(), disegnaMantovanaB1(), disegnaPalcoLatoFondoB1(), disegnaPalcoLatoFronteB1(), disegnaTeloSiparioB1() (+5 more)

### Community 47 - "Comandi a tocco · installaC2() (c2-tocco)"
Cohesion: 0.26
Nodes (13): aggiornaClassiC2(), attivaC2(), bottoneGiuC2(), disattivaC2(), installaC2(), lasciaSpegnereC2(), padVeroAttivoC2(), primaDelFrameC2() (+5 more)

### Community 48 - "Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)"
Cohesion: 0.30
Nodes (12): aCapoB8(), boccascenaB8(), disegnaCartiglioB8(), disegnaDiarioB8(), disegnaDidB8(), disegnaFinaleB8(), disegnaSceltaB8(), fondaleNeroB8() (+4 more)

### Community 49 - "Pubblico e sipario · bufferB1() (b1-pubblico)"
Cohesion: 0.22
Nodes (11): aggiornaBrusioB1(), bufferB1(), contestoB1(), creaApplausoB1(), creaFollaB1(), generatoreB1(), normalizzaB1(), SUONATORI_B1 (+3 more)

### Community 50 - "Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)"
Cohesion: 0.24
Nodes (11): aggiornaPubblicoB1(), aggiornaVoliB1(), allineaStanzaB1(), atterraPremioB1(), atterraTuttoB1(), azzeraPubblicoB1(), bordoDockB1(), cambioStanzaB1() (+3 more)

### Community 51 - "Rete di sicurezza degli errori (000-errori)"
Cohesion: 0.31
Nodes (9): aggiornaRiquadroErrori(), ERRORI_TEATRO, fusibileScenaTeatro(), RETE_ERRORI, ripulisciContestoTeatro(), segnalaErroreTeatro(), testoErroriTeatro(), iniziaFrame() (+1 more)

### Community 52 - "Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)"
Cohesion: 0.27
Nodes (10): adattaTestoB3(), altezzaRigaB3(), catturaTastoB3(), disegnaOpzioniB3(), dopoIlFrameB3(), etichettaTastoB3(), inToccoB3(), simboloB3() (+2 more)

### Community 53 - "Pubblico e sipario · reazionePubblicoB1() (b1-pubblico)"
Cohesion: 0.31
Nodes (9): aggiungiVoceB1(), colpoSubitoB1(), fonteBuffaB1(), reazionePubblicoB1(), riquadroVoceB1(), spostaGradimentoB1(), stanzaPulitaB1(), uccisioniB1() (+1 more)

### Community 54 - "Comandi, gamepad e opzioni · tastieraB3() (b3-comandi-opzioni)"
Cohesion: 0.28
Nodes (9): aggiornaAdattaB3(), bloccaB3(), coordB3(), dentroB3(), filtroIngressiB3(), mouseB3(), segnaDispositivoB3(), tastieraB3() (+1 more)

### Community 55 - "Comandi a tocco · dopoIlFrameC2() (c2-tocco)"
Cohesion: 0.33
Nodes (9): liberoB3(), aggiornaVistaC2(), dopoIlFrameC2(), rilasciaBottoneC2(), schermoInteroAttivoC2(), schermoInteroC2(), schermoInteroPossibileC2(), statoBottoniC2() (+1 more)

### Community 56 - "Qualità automatica (e4-prestazioni)"
Cohesion: 0.31
Nodes (7): azzera(), e4, passoQualitaE4(), QUALITA_E4, qualitaAutoAttivaE4(), riaccendiTuttoE4(), RIGA_E4

### Community 57 - "Fogli di sprite (t2-sprite)"
Cohesion: 0.39
Nodes (7): boss(), disegnaFotogramma(), dopoNemici(), nemico(), personaggio(), posaBoss(), posaNemico()

### Community 58 - "Finali, Diario di Ferruccio e Voce · disegnaSopraHubB8() (b8-finali-diario)"
Cohesion: 0.25
Nodes (8): aggiornaDidB8(), contestoFinaleB8(), didLiberaB8(), disegnaSopraGiocoB8(), disegnaSopraHubB8(), flagTramaB8(), sopraB8(), vicinoPortaB8()

### Community 59 - "Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)"
Cohesion: 0.36
Nodes (8): avviaFinaleB8(), chiudiDiarioB8(), clickDiarioB8(), condizioneB8(), preparaSceneB8(), rigaFinaleB8(), tastoDiarioB8(), vociFinaliB8()

### Community 60 - "Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)"
Cohesion: 0.25
Nodes (8): casoFissoD6(), dipingiFondaleD6(), dipingiQuintaD6(), disegnaCanaleD6(), disegnaDrappoD6(), disegnaFiaccolaD6(), disegnaLuogoD6(), telaPavimentoD6()

### Community 61 - "sim-economia.js (sim-economia)"
Cohesion: 0.25
Nodes (5): n, path, r, radice, { spawnSync }

### Community 62 - "Comandi, gamepad e opzioni · salvaOpzioni() (b3-comandi-opzioni)"
Cohesion: 0.33
Nodes (7): salvaOpzioni(), assegnaTastoB3(), ricostruisciTastiB3(), rilasciaTuttoB3(), ripristinaTastiB3(), riservatoB3(), tastiValidiB3()

### Community 63 - "Comandi a tocco · disponiC2() (c2-tocco)"
Cohesion: 0.38
Nodes (7): disponiC2(), firmaDisposizioneC2(), limitaC2(), mettiC2(), opzioneC2(), verticaleC2(), schedaD2()

### Community 64 - "Acquedotto Carolino · usaGrataD6() (d6-acquedotto)"
Cohesion: 0.33
Nodes (7): aggiornaPanniD6(), grata(), grataQuiD6(), prendiAcquedottoD6(), segnaAcquedottoD6(), suonoAcquaD6(), usaGrataD6()

### Community 65 - "Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.43
Nodes (7): cerchiAcquaD6(), chinaD6(), disegnaGuardianoD6(), otreD6(), puntoD6(), trattoD6(), tridenteD6()

### Community 66 - "Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)"
Cohesion: 0.29
Nodes (7): corrente(), correnteInD6(), dopoIlPassoD6(), fuoriDagliOstacoliD6(), limitaD6(), muoviD6(), volaD6()

### Community 67 - "Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.29
Nodes (7): entraStatoD6(), iaGuardianoD6(), nuovaAcquaD6(), prossimoStatoD6(), valoreD6(), versoGiocatoreD6(), leggi()

### Community 68 - "I 200 oggetti · trovaOggettoB() (b5-oggetti)"
Cohesion: 0.40
Nodes (5): trovaOggettoB(), aggregaB5(), calcolaStatB5(), daiOggettoB5(), smaltisciNotificheB5()

### Community 69 - "Comandi a tocco · contestoB3() (c2-tocco)"
Cohesion: 0.40
Nodes (5): adattaRisoluzione(), contestoB3(), stato(), tetto(), tettoScalaC2()

### Community 70 - "Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)"
Cohesion: 0.40
Nodes (5): aggiornaVentoD6(), piegaProiettileD6(), rumoreD6(), soffioD6(), suonoVentoD6()

### Community 72 - "Acquedotto Carolino · posaDonoD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): acquedottoAttivoD6(), guardianoSconfittoD6(), intonaD6(), posaDonoD6()

### Community 73 - "Acquedotto Carolino · disegnaAriaD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): disegnaAriaD6(), ombraD6(), pannoD6(), piegaVentoD6()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `passoLogico()` connect `Combattimento (40-combattimento)` to `Ribalta, luci e ombre (b2-ribalta)`, `Registro delle notti (a7-registro-bilancio)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Partenza segreta (c1-partenza-segreta)`, `Trasformazioni e sinergie (b4-trasformazioni)`, `Registro di Scena e trionfi (d3-registro-scena)`, `Boss per piano (b6-boss)`, `Varianti di stanza (b7-stanze)`, `Riprendi la notte, mira assistita, conto (e6-assistenza)`, `Scontro col Grande Burattinaio (d1-burattinaio)`, `I 200 oggetti (b5-oggetti)`, `Cambio di scena e botole (d5-cambio-scena)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Stanze speciali (a3-stanze-speciali)`, `Acquedotto Carolino (d6-acquedotto)`, `Pubblico e sipario (b1-pubblico)`, `Stili dei personaggi (d2-personaggi)`, `Varianti di stanza · allestisciB7() (b7-stanze)`, `Stato della notte (20-stato)`, `Oggetti e Diario degli oggetti (50-oggetti)`, `Rifiniture e Ragno della Seta (d7-rifiniture)`, `Generatore della mappa (30-mappa)`, `Rete di sicurezza degli errori (000-errori)`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **Are the 62 inferred relationships involving `mostraBanner()` (e.g. with `apriMuroSegreto()` and `entraInStanza()`) actually correct?**
  _`mostraBanner()` has 62 INFERRED edges - model-reasoned connections that need verification._
- **Should `Ribalta, luci e ombre (b2-ribalta)` be split into smaller, more focused modules?**
  _Cohesion score 0.05411392405063291 - nodes in this community are weakly interconnected._
- **Why does `disegnaStanzaPixelArt()` connect `Disegno della stanza e HUD (60-resa)` to `Ribalta, luci e ombre (b2-ribalta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Varianti di stanza (b7-stanze)`, `Generatore della mappa (30-mappa)`, `Immagini di scena (b9-immagini)`, `Scontro col Grande Burattinaio (d1-burattinaio)`, `Cambio di scena e botole (d5-cambio-scena)`, `Finali, Diario di Ferruccio e Voce (b8-finali-diario)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Stanze speciali (a3-stanze-speciali)`, `Acquedotto Carolino (d6-acquedotto)`, `Pubblico e sipario (b1-pubblico)`, `Trasformazioni e sinergie · drawTextFit() (b4-trasformazioni)`, `Varianti di stanza · allestisciB7() (b7-stanze)`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Are the 56 inferred relationships involving `drawTextFit()` (e.g. with `disegnaCartiglioD()` and `disegnaDiarioD()`) actually correct?**
  _`drawTextFit()` has 56 INFERRED edges - model-reasoned connections that need verification._
- **Should `Registro delle notti (a7-registro-bilancio)` be split into smaller, more focused modules?**
  _Cohesion score 0.05760905760905761 - nodes in this community are weakly interconnected._
- **Why does `drawTextFit()` connect `Trasformazioni e sinergie · drawTextFit() (b4-trasformazioni)` to `Registro delle notti (a7-registro-bilancio)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Partenza segreta (c1-partenza-segreta)`, `Trasformazioni e sinergie (b4-trasformazioni)`, `Registro di Scena e trionfi (d3-registro-scena)`, `Varianti di stanza (b7-stanze)`, `Riprendi la notte, mira assistita, conto (e6-assistenza)`, `Immagini di scena (b9-immagini)`, `I 200 oggetti (b5-oggetti)`, `Stanze speciali (a3-stanze-speciali)`, `Progressione e sblocchi (a6-progressione)`, `Economia e salvataggi (t3-economia-salvataggi)`, `Disegno della stanza e HUD (60-resa)`, `Pubblico e sipario (b1-pubblico)`, `Comandi, gamepad e opzioni (b3-comandi-opzioni)`, `Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)`, `Stato della notte (20-stato)`, `Rifiniture e Ragno della Seta (d7-rifiniture)`, `Pubblico e sipario · telaB1() (b1-pubblico)`, `Disegno di personaggi e boss (10-sprite)`, `Generatore della mappa (30-mappa)`, `Oggetti e Diario degli oggetti · disegnaDiarioD() (50-oggetti)`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._