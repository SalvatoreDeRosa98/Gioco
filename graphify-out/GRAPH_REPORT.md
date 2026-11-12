# Graph Report - Gioco  (2026-11-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1852 nodes · 4774 edges · 78 communities (76 shown, 2 thin omitted)
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 1287 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `13c2ce50`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Ribalta, luci e ombre (b2-ribalta)
- Buca, terna e Camerini (d4-stanze-teatro)
- Partenza segreta (c1-partenza-segreta)
- I 200 oggetti (b5-oggetti)
- Piazza Dante e storia (t4-hub-storia)
- Trasformazioni e sinergie (b4-trasformazioni)
- Registro di Scena e trionfi (d3-registro-scena)
- Boss per piano (b6-boss)
- Disegno della stanza e HUD (60-resa)
- Scontro col Grande Burattinaio (d1-burattinaio)
- Stanze speciali (a3-stanze-speciali)
- Immagini di scena (b9-immagini)
- Riprendi la notte, mira assistita, conto (e6-assistenza)
- Cambio di scena e botole (d5-cambio-scena)
- Finali, Diario di Ferruccio e Voce (b8-finali-diario)
- Ampolle e carte (a2-consumabili)
- Registro delle notti (a7-registro-bilancio)
- Pubblico e sipario (b1-pubblico)
- Acquedotto Carolino (d6-acquedotto)
- Stato della notte (20-stato)
- Economia e salvataggi (t3-economia-salvataggi)
- Combattimento (40-combattimento)
- Bombe, chiavi e forzieri (a1-bombe-chiavi)
- Progressione e sblocchi (a6-progressione)
- Configurazione e tabelle di gioco (00-config)
- Finali, Diario di Ferruccio e Voce · getNumeroNotte() (b8-finali-diario)
- Stili dei personaggi (d2-personaggi)
- Varianti di stanza (b7-stanze)
- Oggetti e Diario degli oggetti (50-oggetti)
- Comandi a tocco (c2-tocco)
- Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)
- Pubblico e sipario · bufferB1() (b1-pubblico)
- Finali, Diario di Ferruccio e Voce · ferruccioB8() (b8-finali-diario)
- Disegno di personaggi e boss (10-sprite)
- Comandi, gamepad e opzioni (b3-comandi-opzioni)
- Rifiniture e Ragno della Seta (d7-rifiniture)
- Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)
- Comandi, gamepad e opzioni · tastieraB3() (b3-comandi-opzioni)
- Pubblico e sipario · limitaB1() (b1-pubblico)
- Varianti di stanza · entraOndataD4() (b7-stanze)
- Pubblico e sipario · telaB1() (b1-pubblico)
- Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)
- Comandi, gamepad e opzioni · aggiornaPadB3() (b3-comandi-opzioni)
- Comandi a tocco · installaC2() (c2-tocco)
- Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)
- Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)
- Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)
- Comandi a tocco · disponiC2() (c2-tocco)
- Rete di sicurezza degli errori (000-errori)
- Pubblico e sipario · tick() (b1-pubblico)
- Comandi a tocco · dopoIlFrameC2() (c2-tocco)
- Varianti di stanza · suonoB7() (b7-stanze)
- Comandi, gamepad e opzioni · salvaOpzioni() (b3-comandi-opzioni)
- Qualità automatica (e4-prestazioni)
- Fogli di sprite (t2-sprite)
- Varianti di stanza · puntaCiarlatanoB7() (b7-stanze)
- Finali, Diario di Ferruccio e Voce · disegnaSopraHubB8() (b8-finali-diario)
- Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)
- Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)
- sim-economia.js (sim-economia)
- Trasformazioni e sinergie · clickDiarioD() (b4-trasformazioni)
- Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)
- Varianti di stanza · disegnaPannelloCiarlatanoB7() (b7-stanze)
- Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)
- Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)
- Varianti di stanza · dopoIlPassoB7() (b7-stanze)
- Varianti di stanza · analizzaVarianteB7() (b7-stanze)
- Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)
- Acquedotto Carolino · usaGrataD6() (d6-acquedotto)
- Varianti di stanza · aggiornaSuoloB7() (b7-stanze)
- Varianti di stanza · disegna() (b7-stanze)
- Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)
- Icone degli oggetti (b5-oggetti-icone)
- Varianti di stanza · disegnaOstacoloB7() (b7-stanze)
- Acquedotto Carolino · posaDonoD6() (d6-acquedotto)
- Acquedotto Carolino · disegnaAriaD6() (d6-acquedotto)
- Varianti di stanza · chiudiClessidraB7() (b7-stanze)
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
- `dopoIngressoBucaD4()` --calls--> `mostraBanner()`  [INFERRED]
  d4-stanze-teatro.js → 20-stato.js
- `minimappaCameriniD4()` --calls--> `maledizioneD()`  [INFERRED]
  d4-stanze-teatro.js → 40-combattimento.js
- `vestiCustodiD4()` --calls--> `rng()`  [INFERRED]
  d4-stanze-teatro.js → 20-stato.js
- `maschereInMoneteD2()` --calls--> `mostraBanner()`  [INFERRED]
  d2-personaggi.js → 20-stato.js
- `azzeraVentoD6()` --calls--> `rng()`  [INFERRED]
  d6-acquedotto.js → 20-stato.js

## Import Cycles
- None detected.

## Communities (78 total, 2 thin omitted)

### Community 0 - "Ribalta, luci e ombre (b2-ribalta)"
Cohesion: 0.05
Nodes (74): agganciaStanza(), aggiungiRiparo(), alMorire(), altezzaDi(), atterra(), audioPronto(), contorna(), creaPezzi() (+66 more)

### Community 1 - "Buca, terna e Camerini (d4-stanze-teatro)"
Cohesion: 0.06
Nodes (73): MUSICA, aggiungiBucaD4(), alBattereD4(), alTempoD4(), applausoD4(), apriTernaD4(), astaD4(), avanzaOrologioD4() (+65 more)

### Community 2 - "Partenza segreta (c1-partenza-segreta)"
Cohesion: 0.07
Nodes (70): eArmaSpeciale(), cellaPannelloB(), perPaginaPannelloB5(), apriArmeriaC1(), apriDialogoC1(), apriDomandaC1(), apriRicordoC1(), armeriaApertaC1() (+62 more)

### Community 3 - "I 200 oggetti (b5-oggetti)"
Cohesion: 0.06
Nodes (61): aggiornaFamigliB5(), aggiornaMoltDannoB5(), aggiornaScieB5(), aggiornaSlotFucinaB5(), aggiungiSciaB5(), aggregaB5(), allaPuliziaB5(), allaUccisioneB5() (+53 more)

### Community 4 - "Piazza Dante e storia (t4-hub-storia)"
Cohesion: 0.08
Nodes (56): aCapo(), aggiornaHub(), aggiornaMorte(), apriDialogo(), apriDialogoC(), avanzaDialogo(), avviaMorte(), avvio() (+48 more)

### Community 5 - "Trasformazioni e sinergie (b4-trasformazioni)"
Cohesion: 0.06
Nodes (55): getSpriteCanvas(), aggiornaSinergieB4(), aloneB4(), aloniB4, ANCORE_B4, applicaEffettiB4(), apriPupazzoB4(), attivaTrasformazioneB4() (+47 more)

### Community 6 - "Registro di Scena e trionfi (d3-registro-scena)"
Cohesion: 0.08
Nodes (50): apertureD3(), apriRegistroScenaD3(), bossSconfittoD3(), cacheSagomeD3, cambiaSezioneD3(), chiudiRegistroScenaD3(), clickLibroD3(), collisioneLeggioD3() (+42 more)

### Community 7 - "Boss per piano (b6-boss)"
Cohesion: 0.08
Nodes (46): accessoriGiostraB6(), accessoriLampionaioB6(), accessoriTessitriceB6(), alaCignoB6(), AZIONI_B6, azzeraMemoria(), b6, bagliorB6() (+38 more)

### Community 8 - "Disegno della stanza e HUD (60-resa)"
Cohesion: 0.09
Nodes (48): getQuartierePiano(), disegnaFerruccioPittorico(), disegnaManoMarionettaPittorica(), drawPillLabel(), drawPixelSprite(), drawTextFit(), getCharCorrente(), numeroStanzeCombattimento() (+40 more)

### Community 9 - "Scontro col Grande Burattinaio (d1-burattinaio)"
Cohesion: 0.09
Nodes (42): registraVoceBossB8(), aTerraManoD1(), audioD1(), avviaAttoD1(), avviaVittoriaD1(), BURATTINAIO_D1, calaMarionettaD1(), capoD1() (+34 more)

### Community 10 - "Stanze speciali (a3-stanze-speciali)"
Cohesion: 0.11
Nodes (44): mostraBanner(), rng(), nomeD(), apriForziereA1(), estraiPesatoA1(), aggiungiStanzeSpecialiA3(), avviaSfidaA3(), avvisaA3() (+36 more)

### Community 11 - "Immagini di scena (b9-immagini)"
Cohesion: 0.11
Nodes (41): bordoDockB1(), invalidaTeleB1(), aloneCaldoB9(), arredoImmagineB9(), avvolgiElementoB1(), cartiglioOpzioniB9(), CONFIG_B9, contaB9() (+33 more)

### Community 12 - "Riprendi la notte, mira assistita, conto (e6-assistenza)"
Cohesion: 0.07
Nodes (37): eseguiAttacco4Direzioni(), aCapoE6(), altroRiquadroE6(), angoloAssistitoE6(), arricchisciVoceE6(), ASSISTENZA_E6, campiPercorsoE6(), cancellaIstantaneaE6() (+29 more)

### Community 13 - "Cambio di scena e botole (d5-cambio-scena)"
Cohesion: 0.09
Nodes (39): ticksDaMs(), paraColpoB5(), puntoValidoB7(), alonaD5(), aperturaBotolaD5(), avviaCambioD5(), BOTOLE_D5, buioCambioD5() (+31 more)

### Community 14 - "Finali, Diario di Ferruccio e Voce (b8-finali-diario)"
Cohesion: 0.08
Nodes (33): b8, bossDelPianoCadutoB8(), bossSconfittoB8(), componiPaginaB8(), CONFIG_B8, DIARIO_B8, disegnaCordoneB8(), disegnaFontanaB8() (+25 more)

### Community 15 - "Ampolle e carte (a2-consumabili)"
Cohesion: 0.12
Nodes (38): aggiornaScalaA2(), applicaAmpollaA2(), applicaCartaA2(), conosciutiA2(), conosciutiMemoriaA2, CONS_A2, CONS_A2_AMPOLLE, CONS_A2_CARTE (+30 more)

### Community 16 - "Registro delle notti (a7-registro-bilancio)"
Cohesion: 0.11
Nodes (32): a7, aCapoA7(), azzera(), bossSconfittoA7(), CONFIG_A7, contaLucchettiA7(), controllaAbbandonoA7(), disegnaPergamenaA7() (+24 more)

### Community 17 - "Pubblico e sipario (b1-pubblico)"
Cohesion: 0.07
Nodes (27): audioB1, bordiSiparioB1, candeleB1, COLORI_B1, datiSagomaB1(), disegnaForziereInVoloB1(), disegnaLumiZonaB1(), disegnaSagomaSpettatoreB1() (+19 more)

### Community 18 - "Acquedotto Carolino (d6-acquedotto)"
Cohesion: 0.06
Nodes (27): ACQUEDOTTO_D6, ARREDI_D6, AZIONI_D6, azzeraVentoD6(), BOSS_D6, d6, DISEGNI_NEMICI_D6, fraD6() (+19 more)

### Community 19 - "Stato della notte (20-stato)"
Cohesion: 0.13
Nodes (31): avviaPartitaConPersonaggio(), incrementaNumeroNotte(), nuovaRun(), player, ricalcolaStatistiche(), ricominciaNotte(), selezionaPersonaggio(), shuffle() (+23 more)

### Community 20 - "Economia e salvataggi (t3-economia-salvataggi)"
Cohesion: 0.10
Nodes (26): testoToccoD7(), aggiornaBottoneAudio(), aggiornaRaggio(), aggiungiScintille(), cancellaSlot(), chiudiCancella(), dataBreve(), direzioneFrecce() (+18 more)

### Community 21 - "Combattimento (40-combattimento)"
Cohesion: 0.16
Nodes (32): apriMuroSegreto(), aggiornaFamigliOrbitaliD(), aggiornaProiettileD(), applicaSpinta(), bloccaProiettiliNemiciD(), congela(), danneggiaNemico(), esplodiD() (+24 more)

### Community 22 - "Bombe, chiavi e forzieri (a1-bombe-chiavi)"
Cohesion: 0.10
Nodes (27): aggiornaBombeA1(), aggiungiBombe(), aggiungiChiavi(), applicaLucchettiA1(), avvisoA1(), BOMBE_CHIAVI_A1, disegnaA1(), disegnaBombaAccesaA1() (+19 more)

### Community 23 - "Progressione e sblocchi (a6-progressione)"
Cohesion: 0.14
Nodes (27): a6, aCapoA6(), alternativaVeraA6(), avvisaBloccatoA6(), azzeraSblocchi(), bossSconfittoA6(), CONFIG_A6, controllaA6() (+19 more)

### Community 24 - "Configurazione e tabelle di gioco (00-config)"
Cohesion: 0.06
Nodes (30): ARENA, BOSS_A, BOSS_FINALE, canvas, CATALOGO_OGGETTI, CATALOGO_PATTO, CATALOGO_SEGRETO, ctx (+22 more)

### Community 25 - "Finali, Diario di Ferruccio e Voce · getNumeroNotte() (b8-finali-diario)"
Cohesion: 0.12
Nodes (31): getNumeroNotte(), accodaDidB8(), aggiornaFinaleB8(), apriPortaB8(), cadutaB8(), daiFerroB8(), dialogoT4B8(), diciB8() (+23 more)

### Community 26 - "Stili dei personaggi (d2-personaggi)"
Cohesion: 0.09
Nodes (22): colpisciMuroSegretoC(), levaToccoC2(), arcoMaglioD2(), colpoMaglioD2(), conSpettraliD2(), d2, inScenaD2(), lampoD2() (+14 more)

### Community 27 - "Varianti di stanza (b7-stanze)"
Cohesion: 0.08
Nodes (28): analisiB7, arredaMappaB7(), CIARLATANO_B7, CLESSIDRA_B7, colpisciFragileB7(), COPPIE_B7, CURVA_B7, disegnaClessidraB7() (+20 more)

### Community 28 - "Oggetti e Diario degli oggetti (50-oggetti)"
Cohesion: 0.14
Nodes (29): effettiNotteC(), popolaStanza(), maledizioneD(), massaNemico(), acquisisciOggettoConLimite5Slot(), ARMI_SPECIALI_INTERCAMBIABILI, conosciutiD(), conosciutiMemoriaD (+21 more)

### Community 29 - "Comandi a tocco (c2-tocco)"
Cohesion: 0.10
Nodes (23): adattaRisoluzione(), scena(), AVVIO_LEGGERO_C2, c2, clickSulPalcoC2(), creaBottoneC2(), creaStratoC2(), ICONE_C2 (+15 more)

### Community 30 - "Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)"
Cohesion: 0.16
Nodes (26): aggiungiPaginaB8(), azzera(), chiaveDiarioB8(), disegnaLinguettaB8(), dopoMorteB8(), dopoRicominciaB8(), entraSopraLaRibaltaB8(), finaleSopraLaRibaltaB8() (+18 more)

### Community 31 - "Pubblico e sipario · bufferB1() (b1-pubblico)"
Cohesion: 0.12
Nodes (22): aggiornaBrusioB1(), azzeraPubblicoB1(), bufferB1(), contestoB1(), creaApplausoB1(), creaFollaB1(), dopoFrameSiparioB1(), generatoreB1() (+14 more)

### Community 32 - "Finali, Diario di Ferruccio e Voce · ferruccioB8() (b8-finali-diario)"
Cohesion: 0.15
Nodes (22): colpoRitmoB8(), daQuandoB8(), disegnaPortaB8(), fabbroB8(), ferruccioB8(), fondaleCieloB8(), fondaleFucinaB8(), fondaleManiB8() (+14 more)

### Community 33 - "Disegno di personaggi e boss (10-sprite)"
Cohesion: 0.12
Nodes (19): caricaSpriteTeatro(), CARTELLE_SPRITE_V2, disegnaBossDaImmagineA(), disegnaBossPittorico(), disegnaGattoSprite(), disegnaMobSprite(), disegnaNemicoPittorico(), getGattoImage() (+11 more)

### Community 34 - "Comandi, gamepad e opzioni (b3-comandi-opzioni)"
Cohesion: 0.10
Nodes (20): b3, BOTTONE_MENU_B3, CANONICO_B3, COMANDI_B3, DIR_B3, MENU_PAUSA_B3, NOME_AZIONE_B3, OPZIONI_B3_PREDEFINITE (+12 more)

### Community 35 - "Rifiniture e Ragno della Seta (d7-rifiniture)"
Cohesion: 0.15
Nodes (18): tastoDiarioD(), aloneProiettileD7(), cambiaStatoRagnoD7(), casoRagnoD7(), disegnaArenaLucianaD7(), disegnaRagnoSetaD7(), disegnaSetaD7(), gamepadCollegatoD7() (+10 more)

### Community 36 - "Finali, Diario di Ferruccio e Voce · concludiFinaleB8() (b8-finali-diario)"
Cohesion: 0.14
Nodes (20): applicaBattutaB8(), apriDiarioB8(), audioB8(), avanzaCartB8(), avanzaFinaleB8(), bussaB8(), clickB8(), clickFinaleB8() (+12 more)

### Community 37 - "Comandi, gamepad e opzioni · tastieraB3() (b3-comandi-opzioni)"
Cohesion: 0.15
Nodes (19): offsetScossa(), rettBottonePausaA7(), aggiornaAdattaB3(), apriDiarioDirettoB3(), attivaVocePausaB3(), bloccaB3(), contestoB3(), coordB3() (+11 more)

### Community 38 - "Pubblico e sipario · limitaB1() (b1-pubblico)"
Cohesion: 0.17
Nodes (19): aggiungiVoceB1(), coroB1(), dopoMonetaB1(), fermaSipario(), impostaGradimentoB1(), lanciaNuoviB1(), lanciaPremioB1(), lanciatoreB1() (+11 more)

### Community 39 - "Varianti di stanza · entraOndataD4() (b7-stanze)"
Cohesion: 0.17
Nodes (17): allontanaNemiciDallePorteC(), ENTRATE_C, PORTE_C, porteVietateC(), puntoLontanoDallePorteC(), applicaDisposizioneB7(), arredaStanzaB7(), creaNemiciB7() (+9 more)

### Community 40 - "Pubblico e sipario · telaB1() (b1-pubblico)"
Cohesion: 0.18
Nodes (17): altezzaLatiB1(), disegnaFondoZonaB1(), disegnaFronteZonaB1(), disegnaSiparioB1(), disegnaTendeB1(), disegnaTestiSiparioB1(), liscioB1(), telaB1() (+9 more)

### Community 41 - "Comandi, gamepad e opzioni · tastoOpzioniB3() (b3-comandi-opzioni)"
Cohesion: 0.28
Nodes (16): attivaRigaB3(), avvisoB3(), cambiaPaginaB3(), cambiaSchermoInteroB3(), chiudiOpzioniB3(), clamp01B3(), clickOpzioniB3(), impostaOpzioneB3() (+8 more)

### Community 42 - "Comandi, gamepad e opzioni · aggiornaPadB3() (b3-comandi-opzioni)"
Cohesion: 0.23
Nodes (13): aggiornaPadB3(), apriOpzioniB3(), direzioneMovimentoB3(), direzioneNavB3(), direzioneSparoB3(), inviaTastoB3(), navRipetiB3(), padLiberoB3() (+5 more)

### Community 43 - "Comandi a tocco · installaC2() (c2-tocco)"
Cohesion: 0.26
Nodes (13): aggiornaClassiC2(), attivaC2(), bottoneGiuC2(), disattivaC2(), installaC2(), lasciaSpegnereC2(), padVeroAttivoC2(), primaDelFrameC2() (+5 more)

### Community 44 - "Pubblico e sipario · disegnaBalconataFronteB1() (b1-pubblico)"
Cohesion: 0.24
Nodes (12): arcoPalcoLatoB1(), candelaB1(), davanzaleB1(), disegnaBalconataFronteB1(), disegnaMantovanaB1(), disegnaPalcoLatoFondoB1(), disegnaPalcoLatoFronteB1(), disegnaTeloSiparioB1() (+4 more)

### Community 45 - "Finali, Diario di Ferruccio e Voce · disegnaDiarioB8() (b8-finali-diario)"
Cohesion: 0.30
Nodes (12): aCapoB8(), boccascenaB8(), disegnaCartiglioB8(), disegnaDiarioB8(), disegnaDidB8(), disegnaFinaleB8(), disegnaSceltaB8(), fondaleNeroB8() (+4 more)

### Community 46 - "Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)"
Cohesion: 0.31
Nodes (11): adattaTestoB3(), altezzaRigaB3(), disegnaAggiuntePausaB3(), disegnaOpzioniB3(), disegnaRigaOpzioniB3(), dopoIlFrameB3(), etichettaTastoB3(), inToccoB3() (+3 more)

### Community 47 - "Comandi a tocco · disponiC2() (c2-tocco)"
Cohesion: 0.24
Nodes (11): disegnaLevaC2(), disponiC2(), firmaDisposizioneC2(), levaGiuC2(), levaMuoviC2(), limitaC2(), mettiC2(), opzioneC2() (+3 more)

### Community 48 - "Rete di sicurezza degli errori (000-errori)"
Cohesion: 0.31
Nodes (9): aggiornaRiquadroErrori(), ERRORI_TEATRO, fusibileScenaTeatro(), RETE_ERRORI, ripulisciContestoTeatro(), segnalaErroreTeatro(), testoErroriTeatro(), iniziaFrame() (+1 more)

### Community 49 - "Pubblico e sipario · tick() (b1-pubblico)"
Cohesion: 0.27
Nodes (10): tick(), colpoSubitoB1(), disegnaAttoreB1(), fonteBuffaB1(), lanciaFioriB1(), reazionePubblicoB1(), spostaGradimentoB1(), stanzaPulitaB1() (+2 more)

### Community 50 - "Comandi a tocco · dopoIlFrameC2() (c2-tocco)"
Cohesion: 0.29
Nodes (10): liberoB3(), aggiornaVistaC2(), dopoIlFrameC2(), rilasciaBottoneC2(), schermoInteroAttivoC2(), schermoInteroC2(), schermoInteroPossibileC2(), statoBottoniC2() (+2 more)

### Community 51 - "Varianti di stanza · suonoB7() (b7-stanze)"
Cohesion: 0.29
Nodes (10): accendiBombaB7(), fineManoB7(), pagaManoB7(), passoCiarlatanoB7(), passoClessidraB7(), passoManoB7(), prossimoScambioB7(), scadeClessidraB7() (+2 more)

### Community 52 - "Comandi, gamepad e opzioni · salvaOpzioni() (b3-comandi-opzioni)"
Cohesion: 0.28
Nodes (9): salvaOpzioni(), assegnaTastoB3(), catturaTastoB3(), ricostruisciTastiB3(), rilasciaTuttoB3(), ripristinaTastiB3(), riservatoB3(), tastiValidiB3() (+1 more)

### Community 53 - "Qualità automatica (e4-prestazioni)"
Cohesion: 0.31
Nodes (7): azzera(), e4, passoQualitaE4(), QUALITA_E4, qualitaAutoAttivaE4(), riaccendiTuttoE4(), RIGA_E4

### Community 54 - "Fogli di sprite (t2-sprite)"
Cohesion: 0.39
Nodes (7): boss(), disegnaFotogramma(), dopoNemici(), nemico(), personaggio(), posaBoss(), posaNemico()

### Community 55 - "Varianti di stanza · puntaCiarlatanoB7() (b7-stanze)"
Cohesion: 0.32
Nodes (8): chiudiCiarlatanoB7(), clickCiarlatanoB7(), nuovaManoB7(), puntaCiarlatanoB7(), rettPostaB7(), scegliCiarlatanoB7(), scegliScatolaB7(), tastoCiarlatanoB7()

### Community 56 - "Finali, Diario di Ferruccio e Voce · disegnaSopraHubB8() (b8-finali-diario)"
Cohesion: 0.25
Nodes (8): aggiornaDidB8(), contestoFinaleB8(), didLiberaB8(), disegnaSopraGiocoB8(), disegnaSopraHubB8(), flagTramaB8(), sopraB8(), vicinoPortaB8()

### Community 57 - "Finali, Diario di Ferruccio e Voce · avviaFinaleB8() (b8-finali-diario)"
Cohesion: 0.36
Nodes (8): avviaFinaleB8(), chiudiDiarioB8(), clickDiarioB8(), condizioneB8(), preparaSceneB8(), rigaFinaleB8(), tastoDiarioB8(), vociFinaliB8()

### Community 58 - "Acquedotto Carolino · disegnaLuogoD6() (d6-acquedotto)"
Cohesion: 0.25
Nodes (8): casoFissoD6(), dipingiFondaleD6(), dipingiQuintaD6(), disegnaCanaleD6(), disegnaDrappoD6(), disegnaFiaccolaD6(), disegnaLuogoD6(), telaPavimentoD6()

### Community 59 - "sim-economia.js (sim-economia)"
Cohesion: 0.25
Nodes (5): n, path, r, radice, { spawnSync }

### Community 60 - "Trasformazioni e sinergie · clickDiarioD() (b4-trasformazioni)"
Cohesion: 0.33
Nodes (7): cellaDiarioD(), clickDiarioD(), corniceDiarioB4(), disegnaDiarioSinergieB4(), disegnaDiarioTrasformazioniB4(), sagomaB4(), vistiB4()

### Community 61 - "Pubblico e sipario · aggiornaPubblicoB1() (b1-pubblico)"
Cohesion: 0.38
Nodes (7): aggiornaPubblicoB1(), aggiornaVoliB1(), allineaStanzaB1(), atterraPremioB1(), atterraTuttoB1(), cambioStanzaB1(), conLancioB1()

### Community 62 - "Varianti di stanza · disegnaPannelloCiarlatanoB7() (b7-stanze)"
Cohesion: 0.29
Nodes (7): descPostaB7(), disegnaContenutoB7(), disegnaPannelloCiarlatanoB7(), disegnaScatolaB7(), pannelloCiarlatanoB7(), posizioniScatoleB7(), postaPossibileB7()

### Community 63 - "Acquedotto Carolino · disegnaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.43
Nodes (7): cerchiAcquaD6(), chinaD6(), disegnaGuardianoD6(), otreD6(), puntoD6(), trattoD6(), tridenteD6()

### Community 64 - "Acquedotto Carolino · dopoIlPassoD6() (d6-acquedotto)"
Cohesion: 0.29
Nodes (7): corrente(), correnteInD6(), dopoIlPassoD6(), fuoriDagliOstacoliD6(), limitaD6(), muoviD6(), volaD6()

### Community 65 - "Varianti di stanza · dopoIlPassoB7() (b7-stanze)"
Cohesion: 0.33
Nodes (6): aggiornaFragiliB7(), corpoSolidoB7(), dopoIlPassoB7(), scivolaB7(), sullaPozzaB7(), urtiNemiciB7()

### Community 66 - "Varianti di stanza · analizzaVarianteB7() (b7-stanze)"
Cohesion: 0.33
Nodes (6): analizzaVarianteB7(), cellaB7(), elementiVarianteB7(), periodoSpuntoniB7(), regioniB7(), verificaDisposizioniB7()

### Community 67 - "Acquedotto Carolino · iaGuardianoD6() (d6-acquedotto)"
Cohesion: 0.33
Nodes (6): entraStatoD6(), iaGuardianoD6(), nuovaAcquaD6(), prossimoStatoD6(), valoreD6(), versoGiocatoreD6()

### Community 68 - "Acquedotto Carolino · usaGrataD6() (d6-acquedotto)"
Cohesion: 0.40
Nodes (6): grata(), grataQuiD6(), prendiAcquedottoD6(), segnaAcquedottoD6(), suonoAcquaD6(), usaGrataD6()

### Community 69 - "Varianti di stanza · aggiornaSuoloB7() (b7-stanze)"
Cohesion: 0.40
Nodes (5): aggiornaOlioB7(), aggiornaSuoloB7(), disegnaSuoloB7(), premiPedanaB7(), statoSpuntoniB7()

### Community 70 - "Varianti di stanza · disegna() (b7-stanze)"
Cohesion: 0.50
Nodes (5): ombraB7(), rettB7(), sagomaB7(), bloccoTufoD6(), disegna()

### Community 71 - "Acquedotto Carolino · aggiornaVentoD6() (d6-acquedotto)"
Cohesion: 0.40
Nodes (5): aggiornaVentoD6(), piegaProiettileD6(), rumoreD6(), soffioD6(), suonoVentoD6()

### Community 73 - "Varianti di stanza · disegnaOstacoloB7() (b7-stanze)"
Cohesion: 0.67
Nodes (4): disegnaOstacoloB7(), timbroB7(), arredoD6(), disegnaArredoD6()

### Community 74 - "Acquedotto Carolino · posaDonoD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): acquedottoAttivoD6(), guardianoSconfittoD6(), intonaD6(), posaDonoD6()

### Community 75 - "Acquedotto Carolino · disegnaAriaD6() (d6-acquedotto)"
Cohesion: 0.50
Nodes (4): disegnaAriaD6(), ombraD6(), pannoD6(), piegaVentoD6()

### Community 76 - "Varianti di stanza · chiudiClessidraB7() (b7-stanze)"
Cohesion: 0.67
Nodes (3): chiudiClessidraB7(), moneteATerraB7(), premiaTemaB7()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `passoLogico()` connect `Combattimento (40-combattimento)` to `Ribalta, luci e ombre (b2-ribalta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Partenza segreta (c1-partenza-segreta)`, `I 200 oggetti (b5-oggetti)`, `Trasformazioni e sinergie (b4-trasformazioni)`, `Registro di Scena e trionfi (d3-registro-scena)`, `Boss per piano (b6-boss)`, `Scontro col Grande Burattinaio (d1-burattinaio)`, `Stanze speciali (a3-stanze-speciali)`, `Riprendi la notte, mira assistita, conto (e6-assistenza)`, `Cambio di scena e botole (d5-cambio-scena)`, `Ampolle e carte (a2-consumabili)`, `Registro delle notti (a7-registro-bilancio)`, `Pubblico e sipario (b1-pubblico)`, `Acquedotto Carolino (d6-acquedotto)`, `Stato della notte (20-stato)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Stili dei personaggi (d2-personaggi)`, `Varianti di stanza (b7-stanze)`, `Rifiniture e Ragno della Seta (d7-rifiniture)`, `Varianti di stanza · entraOndataD4() (b7-stanze)`, `Rete di sicurezza degli errori (000-errori)`?**
  _High betweenness centrality (0.209) - this node is a cross-community bridge._
- **Are the 62 inferred relationships involving `mostraBanner()` (e.g. with `apriMuroSegreto()` and `entraInStanza()`) actually correct?**
  _`mostraBanner()` has 62 INFERRED edges - model-reasoned connections that need verification._
- **Should `Ribalta, luci e ombre (b2-ribalta)` be split into smaller, more focused modules?**
  _Cohesion score 0.05163511187607573 - nodes in this community are weakly interconnected._
- **Why does `drawTextFit()` connect `Disegno della stanza e HUD (60-resa)` to `Buca, terna e Camerini (d4-stanze-teatro)`, `Partenza segreta (c1-partenza-segreta)`, `I 200 oggetti (b5-oggetti)`, `Trasformazioni e sinergie (b4-trasformazioni)`, `Registro di Scena e trionfi (d3-registro-scena)`, `Stanze speciali (a3-stanze-speciali)`, `Immagini di scena (b9-immagini)`, `Riprendi la notte, mira assistita, conto (e6-assistenza)`, `Ampolle e carte (a2-consumabili)`, `Registro delle notti (a7-registro-bilancio)`, `Pubblico e sipario (b1-pubblico)`, `Stato della notte (20-stato)`, `Economia e salvataggi (t3-economia-salvataggi)`, `Progressione e sblocchi (a6-progressione)`, `Finali, Diario di Ferruccio e Voce · statoB8() (b8-finali-diario)`, `Disegno di personaggi e boss (10-sprite)`, `Comandi, gamepad e opzioni (b3-comandi-opzioni)`, `Rifiniture e Ragno della Seta (d7-rifiniture)`, `Comandi, gamepad e opzioni · tastieraB3() (b3-comandi-opzioni)`, `Pubblico e sipario · telaB1() (b1-pubblico)`, `Comandi, gamepad e opzioni · inToccoB3() (b3-comandi-opzioni)`, `Trasformazioni e sinergie · clickDiarioD() (b4-trasformazioni)`, `Varianti di stanza · disegnaPannelloCiarlatanoB7() (b7-stanze)`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 56 inferred relationships involving `drawTextFit()` (e.g. with `disegnaCartiglioD()` and `disegnaDiarioD()`) actually correct?**
  _`drawTextFit()` has 56 INFERRED edges - model-reasoned connections that need verification._
- **Should `Buca, terna e Camerini (d4-stanze-teatro)` be split into smaller, more focused modules?**
  _Cohesion score 0.05649122807017544 - nodes in this community are weakly interconnected._
- **Why does `disegnaStanzaPixelArt()` connect `Disegno della stanza e HUD (60-resa)` to `Ribalta, luci e ombre (b2-ribalta)`, `Buca, terna e Camerini (d4-stanze-teatro)`, `Scontro col Grande Burattinaio (d1-burattinaio)`, `Stanze speciali (a3-stanze-speciali)`, `Immagini di scena (b9-immagini)`, `Cambio di scena e botole (d5-cambio-scena)`, `Finali, Diario di Ferruccio e Voce (b8-finali-diario)`, `Pubblico e sipario (b1-pubblico)`, `Acquedotto Carolino (d6-acquedotto)`, `Stato della notte (20-stato)`, `Bombe, chiavi e forzieri (a1-bombe-chiavi)`, `Varianti di stanza (b7-stanze)`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._