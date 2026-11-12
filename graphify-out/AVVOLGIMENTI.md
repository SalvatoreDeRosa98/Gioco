# Avvolgimenti del Teatro

Generato da `tools/grafo-teatro.py`: non modificare a mano. Ogni estensione del Teatro sta nel suo file e
«avvolge» le funzioni globali (`const base = f; f = function (...) { ... base(...) ... }`). Qui, per ogni
funzione avvolta, gli strati **nell'ordine in cui l'HTML li carica**: l'ultimo della riga è quello che gira per primo.
Prima di avvolgere una di queste funzioni, o di cambiarne il comportamento, guarda chi c'è già.

| Funzione | Definita in | Strati | Chi la avvolge (in ordine di caricamento) |
|---|---|---|---|
| `passoLogico()` | 40-combattimento.js:661 | 24 | a1-bombe-chiavi:538 → a2-consumabili:477 → a3-stanze-speciali:598 → a7-registro-bilancio:285 → a7-registro-bilancio:626 → b6-boss:769 → b7-stanze:1912 → b4-trasformazioni:612 → b5-oggetti:1538 → b2-ribalta:1733 → b1-pubblico:2003 → c1-partenza-segreta:1082 → d5-cambio-scena:348 → d7-rifiniture:213 → d3-registro-scena:873 → d1-burattinaio:685 → d2-personaggi:363 → d4-stanze-teatro:1709 → d6-acquedotto:1005 → e6-assistenza:598 → h3-gregorio:426 → h2-memorie:683 → h1-agnese-taddeo:640 → h5-sottopalco:923 |
| `disegnaStanzaPixelArt()` | 60-resa.js:793 | 16 | a1-bombe-chiavi:552 → a3-stanze-speciali:788 → b7-stanze:2494 → b8-finali-diario:1885 → b2-ribalta:1695 → b1-pubblico:2062 → b9-immagini:551 → d5-cambio-scena:613 → d1-burattinaio:705 → d4-stanze-teatro:1687 → d6-acquedotto:793 → h3-gregorio:709 → h2-memorie:675 → h4-ritorno-piazza:421 → h1-agnese-taddeo:671 → h5-sottopalco:900 |
| `entraInStanza()` | 30-mappa.js:578 | 15 | a1-bombe-chiavi:499 → a2-consumabili:395 → a3-stanze-speciali:567 → a7-registro-bilancio:272 → b6-boss:367 → b7-stanze:1846 → b8-finali-diario:1855 → b2-ribalta:1740 → d5-cambio-scena:322 → d3-registro-scena:895 → d4-stanze-teatro:1656 → d6-acquedotto:1616 → h3-gregorio:263 → h1-agnese-taddeo:615 → h5-sottopalco:977 |
| `disegnaHUDPixelArt()` | 60-resa.js:1636 | 13 | a2-consumabili:518 → a3-stanze-speciali:817 → b6-boss:1349 → b7-stanze:2506 → b4-trasformazioni:1331 → b1-pubblico:2071 → d5-cambio-scena:604 → d1-burattinaio:783 → d4-stanze-teatro:1699 → d6-acquedotto:807 → h2-memorie:224 → h1-agnese-taddeo:683 → h5-sottopalco:911 |
| `verificaStanzaPulita()` | 40-combattimento.js:463 | 12 | a1-bombe-chiavi:521 → a2-consumabili:404 → a3-stanze-speciali:574 → b6-boss:383 → b7-stanze:1853 → b4-trasformazioni:567 → d5-cambio-scena:301 → d4-stanze-teatro:1668 → d6-acquedotto:373 → h3-gregorio:453 → h2-memorie:210 → h5-sottopalco:871 |
| `interagisciStanza()` | 40-combattimento.js:523 | 11 | a1-bombe-chiavi:530 → a2-consumabili:455 → a3-stanze-speciali:592 → b7-stanze:1870 → b8-finali-diario:1870 → d4-stanze-teatro:1679 → d6-acquedotto:353 → h2-memorie:668 → h4-ritorno-piazza:408 → h1-agnese-taddeo:630 → h5-sottopalco:886 |
| `generaMappaPiano()` | 30-mappa.js:41 | 9 | a1-bombe-chiavi:485 → a3-stanze-speciali:561 → b7-stanze:1129 → d5-cambio-scena:141 → d4-stanze-teatro:1645 → d6-acquedotto:877 → d6-acquedotto:2051 → h3-gregorio:244 → h1-agnese-taddeo:608 |
| `t4Gancio()` | 80-ciclo.js:90 | 8 | a6-progressione:313 → a7-registro-bilancio:350 → b8-finali-diario:1814 → b2-ribalta:1726 → c1-partenza-segreta:1099 → d3-registro-scena:901 → e6-assistenza:321 → h4-ritorno-piazza:364 |
| `avviaPiano()` | 30-mappa.js:553 | 7 | a1-bombe-chiavi:490 → a7-registro-bilancio:264 → b1-pubblico:2077 → d6-acquedotto:1792 → e6-assistenza:309 → h2-memorie:660 → h5-sottopalco:987 |
| `disegnaFrame()` | 60-resa.js:1114 | 7 | a6-progressione:511 → b2-ribalta:1676 → b1-pubblico:2099 → d3-registro-scena:917 → d1-burattinaio:733 → e6-assistenza:451 → e4-prestazioni:95 |
| `nuovaRun()` | 20-stato.js:278 | 7 | a2-consumabili:508 → a6-progressione:333 → a7-registro-bilancio:257 → b8-finali-diario:1845 → c1-partenza-segreta:1092 → d6-acquedotto:1781 → h5-sottopalco:990 |
| `disegnaBossPittorico()` | 10-sprite.js:1664 | 6 | b6-boss:1340 → d7-rifiniture:58 → d1-burattinaio:719 → d6-acquedotto:1768 → h3-gregorio:746 → h5-sottopalco:967 |
| `ricalcolaStatistiche()` | 20-stato.js:120 | 6 | a2-consumabili:373 → b4-trasformazioni:416 → b5-oggetti:739 → d2-personaggi:336 → h4-ritorno-piazza:428 → h1-agnese-taddeo:661 |
| `subisciColpoGiocatore()` | 40-combattimento.js:598 | 6 | a7-registro-bilancio:292 → b4-trasformazioni:552 → b5-oggetti:1071 → b1-pubblico:2052 → d5-cambio-scena:362 → d3-registro-scena:887 |
| `clickDiarioD()` | 50-oggetti.js:356 | 5 | a2-consumabili:596 → b4-trasformazioni:1371 → b5-oggetti:2073 → b8-finali-diario:1933 → d7-rifiniture:400 |
| `componiPaginaB8()` | b8-finali-diario.js:968 | 5 | c1-partenza-segreta:1163 → d6-acquedotto:1833 → h3-gregorio:766 → h2-memorie:253 → h1-agnese-taddeo:692 |
| `danneggiaNemico()` | 40-combattimento.js:392 | 5 | b4-trasformazioni:440 → b5-oggetti:993 → b2-ribalta:1751 → d3-registro-scena:880 → h3-gregorio:551 |
| `disegnaDiarioD()` | 60-resa.js:289 | 5 | a2-consumabili:603 → b4-trasformazioni:1466 → b5-oggetti:2057 → b8-finali-diario:1940 → d7-rifiniture:381 |
| `eseguiAttacco4Direzioni()` | 40-combattimento.js:7 | 5 | t3-economia-salvataggi:263 → b4-trasformazioni:511 → b5-oggetti:888 → d2-personaggi:289 → e6-assistenza:532 |
| `popolaStanza()` | 30-mappa.js:252 | 5 | a2-consumabili:430 → b6-boss:351 → b5-oggetti:1594 → d7-rifiniture:314 → d6-acquedotto:1059 |
| `disegnaNemicoPittorico()` | 10-sprite.js:1056 | 4 | d7-rifiniture:304 → d4-stanze-teatro:1635 → d6-acquedotto:1442 → h5-sottopalco:957 |
| `tastoDiarioD()` | 50-oggetti.js:344 | 4 | a2-consumabili:585 → b4-trasformazioni:1355 → b5-oggetti:2064 → b8-finali-diario:1924 |
| `disegnaFerruccioPittorico()` | 10-sprite.js:105 | 3 | b4-trasformazioni:1197 → b2-ribalta:1783 → d2-personaggi:560 |
| `disegnaMenuPausa()` | 60-resa.js:1984 | 3 | a7-registro-bilancio:561 → b3-comandi-opzioni:568 → b8-finali-diario:1907 |
| `disegnaPergamenaA7()` | a7-registro-bilancio.js:467 | 3 | c1-partenza-segreta:1146 → d6-acquedotto:1815 → e6-assistenza:823 |
| `drawPillLabel()` | 10-sprite.js:37 | 3 | b3-comandi-opzioni:642 → b2-ribalta:1689 → d7-rifiniture:371 |
| `drawTextFit()` | 10-sprite.js:10 | 3 | b3-comandi-opzioni:633 → b9-immagini:1103 → d7-rifiniture:369 |
| `gestisciClickMenuPausa()` | 60-resa.js:1939 | 3 | a7-registro-bilancio:580 → b8-finali-diario:1914 → c2-tocco:902 |
| `righeB3()` | b3-comandi-opzioni.js:329 | 3 | d7-rifiniture:415 → e6-assistenza:632 → e4-prestazioni:120 |
| `sparaProiettiliDirezione()` | 40-combattimento.js:32 | 3 | b5-oggetti:880 → d2-personaggi:312 → e6-assistenza:553 |
| `disegnaAtmosferaQuartiere()` | 60-resa.js:631 | 2 | d1-burattinaio:713 → d6-acquedotto:691 |
| `disegnaFamigliOrbitaliD()` | 60-resa.js:246 | 2 | b5-oggetti:1940 → b2-ribalta:1716 |
| `disegnaMacchie()` | 60-resa.js:329 | 2 | b5-oggetti:1882 → d7-rifiniture:50 |
| `disegnaMenuSelezionePersonaggio()` | 60-resa.js:910 | 2 | a6-progressione:454 → b3-comandi-opzioni:578 |
| `disegnaPannelloSviluppatoreB()` | 60-resa.js:105 | 2 | b5-oggetti:2125 → c1-partenza-segreta:1137 |
| `dopoRaccoltaD()` | 50-oggetti.js:365 | 2 | a7-registro-bilancio:319 → b5-oggetti:1287 |
| `getRaccontoAtto()` | 60-resa.js:194 | 2 | b8-finali-diario:1899 → d6-acquedotto:466 |
| `impostaOpzioneB3()` | b3-comandi-opzioni.js:927 | 2 | e6-assistenza:647 → e4-prestazioni:111 |
| `loop()` | 80-ciclo.js:18 | 2 | b3-comandi-opzioni:1204 → c2-tocco:875 |
| `luceLuogoB2()` | b2-ribalta.js:290 | 2 | d6-acquedotto:2066 → h5-sottopalco:942 |
| `oggettoSbloccatoA6()` | a6-progressione.js:180 | 2 | b5-oggetti:593 → d3-registro-scena:909 |
| `pagaSangueA3()` | a3-stanze-speciali.js:198 | 2 | a7-registro-bilancio:307 → d4-stanze-teatro:1600 |
| `scuoti()` | 40-combattimento.js:254 | 2 | b3-comandi-opzioni:688 → c2-tocco:884 |
| `tastoPannelloB()` | 60-resa.js:68 | 2 | b5-oggetti:2111 → c1-partenza-segreta:1123 |
| `acquisisciOggettoConLimite5Slot()` | 50-oggetti.js:141 | 1 | b5-oggetti:1631 |
| `aggiornaProiettileD()` | 40-combattimento.js:91 | 1 | b5-oggetti:906 |
| `aggiornaVistaC2()` | c2-tocco.js:557 | 1 | d2-personaggi:618 |
| `apriForziereA1()` | a1-bombe-chiavi.js:158 | 1 | b1-pubblico:2035 |
| `apriMuroSegreto()` | 30-mappa.js:15 | 1 | b8-finali-diario:1892 |
| `avviaPartitaConPersonaggio()` | 20-stato.js:255 | 1 | a6-progressione:326 |
| `cambiaSchermoInteroB3()` | b3-comandi-opzioni.js:909 | 1 | c2-tocco:897 |
| `cellaDiarioD()` | 50-oggetti.js:337 | 1 | b5-oggetti:2050 |
| `cellaPannelloB()` | 60-resa.js:83 | 1 | b5-oggetti:2096 |
| `clickPannelloB()` | 60-resa.js:90 | 1 | c1-partenza-segreta:1130 |
| `colpoMaglioD2()` | d2-personaggi.js:224 | 1 | e6-assistenza:565 |
| `condizioneB8()` | b8-finali-diario.js:1439 | 1 | h1-agnese-taddeo:725 |
| `contestoFinaleB8()` | b8-finali-diario.js:1432 | 1 | h1-agnese-taddeo:714 |
| `creaStratoC2()` | c2-tocco.js:379 | 1 | d2-personaggi:588 |
| `disegnaArrediA3()` | a3-stanze-speciali.js:687 | 1 | d4-stanze-teatro:1615 |
| `disegnaCartiglioD()` | 60-resa.js:268 | 1 | b3-comandi-opzioni:653 |
| `disegnaCiarlatanoB7()` | b7-stanze.js:2370 | 1 | b9-immagini:884 |
| `disegnaClessidraB7()` | b7-stanze.js:2309 | 1 | b9-immagini:839 |
| `disegnaDietroB4()` | b4-trasformazioni.js:956 | 1 | b9-immagini:951 |
| `disegnaFiliMarionetta()` | 60-resa.js:357 | 1 | d1-burattinaio:762 |
| `disegnaForziereA1()` | a1-bombe-chiavi.js:399 | 1 | b9-immagini:736 |
| `disegnaLucchettoA1()` | a1-bombe-chiavi.js:372 | 1 | b9-immagini:751 |
| `disegnaManoMarionettaPittorica()` | 10-sprite.js:783 | 1 | d1-burattinaio:754 |
| `disegnaMinimappaA3()` | a3-stanze-speciali.js:799 | 1 | d4-stanze-teatro:1627 |
| `disegnaRoviA3()` | a3-stanze-speciali.js:630 | 1 | d4-stanze-teatro:1607 |
| `disegnaSegniA6()` | a6-progressione.js:372 | 1 | b9-immagini:1068 |
| `disegnaSiparioNarrativo()` | 60-resa.js:1882 | 1 | b1-pubblico:2092 |
| `disponiC2()` | c2-tocco.js:423 | 1 | d2-personaggi:601 |
| `effettoVisibileD()` | 50-oggetti.js:312 | 1 | b5-oggetti:1842 |
| `esplodiD()` | 40-combattimento.js:133 | 1 | b5-oggetti:934 |
| `estraiOggettoPatto()` | 50-oggetti.js:237 | 1 | b5-oggetti:632 |
| `estraiOggettoSegreto()` | 50-oggetti.js:244 | 1 | b5-oggetti:640 |
| `getFloorTileCanvas()` | 60-resa.js:381 | 1 | d6-acquedotto:598 |
| `getQuartierePiano()` | 00-config.js:288 | 1 | d6-acquedotto:459 |
| `iaNemicoD6()` | d6-acquedotto.js:1128 | 1 | h5-sottopalco:948 |
| `inizializzaPoolRunB()` | 50-oggetti.js:27 | 1 | a6-progressione:340 |
| `levaToccoC2()` | c2-tocco.js:308 | 1 | d2-personaggi:174 |
| `maledizioneD()` | 40-combattimento.js:221 | 1 | b5-oggetti:1850 |
| `massaNemico()` | 40-combattimento.js:287 | 1 | d6-acquedotto:1067 |
| `mostraBanner()` | 20-stato.js:237 | 1 | d4-stanze-teatro:1594 |
| `offsetScossa()` | 40-combattimento.js:267 | 1 | b3-comandi-opzioni:662 |
| `parteCoronaB4()` | b4-trasformazioni.js:788 | 1 | b9-immagini:915 |
| `parteMascheraB4()` | b4-trasformazioni.js:859 | 1 | b9-immagini:931 |
| `primiAttoriD3()` | d3-registro-scena.js:235 | 1 | h3-gregorio:786 |
| `reazionePubblicoB1()` | b1-pubblico.js:262 | 1 | b9-immagini:527 |
| `rimbalzaD()` | 40-combattimento.js:115 | 1 | b4-trasformazioni:520 |
| `salvaOpzioni()` | 00-config.js:121 | 1 | e4-prestazioni:102 |
| `selezionaPersonaggio()` | 20-stato.js:246 | 1 | a6-progressione:319 |
| `spawnaMonetaATerra()` | 40-combattimento.js:225 | 1 | b1-pubblico:2043 |
| `spingi()` | 40-combattimento.js:298 | 1 | d2-personaggi:324 |
| `trovaOggettoB()` | 50-oggetti.js:8 | 1 | b5-oggetti:543 |
| `usaConsumabileA2()` | a2-consumabili.js:236 | 1 | a7-registro-bilancio:334 |
| `usaOggettoAttivo()` | 50-oggetti.js:82 | 1 | b5-oggetti:1819 |
| `valutaSblocchiA6()` | a6-progressione.js:244 | 1 | b5-oggetti:598 |

## Agganci facoltativi

Funzioni di un file chiamate da un ALTRO file solo «se esistono» (`typeof f === 'function'`): sono i punti in cui
un file di base lascia entrare un'estensione senza conoscerla. Togliere o rinominare una di queste funzioni non dà
errore: l'aggancio smette di funzionare in silenzio.

| Funzione | Definita in | Chi la chiama se esiste |
|---|---|---|
| `caricaSpriteTeatro()` | 10-sprite.js:894 | t2-sprite:100 |
| `disegnaCellaTeatro()` | 10-sprite.js:933 | d7-rifiniture:276, h3-gregorio:628, h2-memorie:361 |
| `drawPillLabel()` | 10-sprite.js:37 | h2-memorie:641, h5-sottopalco:455 |
| `getSpriteTeatro()` | 10-sprite.js:915 | d1-burattinaio:883, h1-agnese-taddeo:550 |
| `mostraBanner()` | 20-stato.js:237 | d3-registro-scena:399, d2-personaggi:350, h2-memorie:183 |
| `colpisciMuroSegretoC()` | 30-mappa.js:7 | d2-personaggi:269 |
| `puntoLontanoDallePorteC()` | 30-mappa.js:220 | h3-gregorio:319 |
| `maledizioneD()` | 40-combattimento.js:221 | h1-agnese-taddeo:585 |
| `conosciutiD()` | 50-oggetti.js:277 | d3-registro-scena:499 |
| `trovaOggettoB()` | 50-oggetti.js:8 | e6-assistenza:801 |
| `aggiungiBombe()` | a1-bombe-chiavi.js:95 | b5-oggetti:1145, c1-partenza-segreta:1069 |
| `aggiungiChiavi()` | a1-bombe-chiavi.js:101 | b5-oggetti:1146, d6-acquedotto:342, h3-gregorio:507 |
| `disegnaBombaAccesaA1()` | a1-bombe-chiavi.js:438 | c1-partenza-segreta:377, d4-stanze-teatro:622 |
| `disegnaForziereA1()` | a1-bombe-chiavi.js:399 | d4-stanze-teatro:621 |
| `spargiPezzoA1()` | a1-bombe-chiavi.js:126 | b5-oggetti:988 |
| `testoInventarioA1()` | a1-bombe-chiavi.js:107 | 60-resa:1681 |
| `statoA2()` | a2-consumabili.js:140 | e6-assistenza:278 |
| `statoA6()` | a6-progressione.js:145 | b6-boss:291, b5-oggetti:568, h1-agnese-taddeo:280 |
| `tuttoSbloccatoA6()` | a6-progressione.js:136 | d3-registro-scena:372 |
| `leggiRegistroA7()` | a7-registro-bilancio.js:84 | b8-finali-diario:1421 |
| `rettBottonePausaA7()` | a7-registro-bilancio.js:556 | b3-comandi-opzioni:501 |
| `salvaVoceA7()` | a7-registro-bilancio.js:98 | b8-finali-diario:1602, h4-ritorno-piazza:234 |
| `bordoDockB1()` | b1-pubblico.js:368 | b9-immagini:465 |
| `invalidaTeleB1()` | b1-pubblico.js:786 | b9-immagini:264 |
| `reazionePubblicoB1()` | b1-pubblico.js:262 | d5-cambio-scena:270, d4-stanze-teatro:821 |
| `adattaTestoB3()` | b3-comandi-opzioni.js:602 | b9-immagini:1112 |
| `filtroIngressiB3()` | b3-comandi-opzioni.js:415 | 70-input:12 |
| `inToccoB3()` | b3-comandi-opzioni.js:326 | t3-economia-salvataggi:348, d7-rifiniture:385, d2-personaggi:106 |
| `simboloB3()` | b3-comandi-opzioni.js:297 | d2-personaggi:107 |
| `statoB4()` | b4-trasformazioni.js:209 | e6-assistenza:284 |
| `temiDi()` | b4-trasformazioni.js:199 | d3-registro-scena:508 |
| `B5()` | b5-oggetti.js:667 | e6-assistenza:285 |
| `perPaginaPannelloB5()` | b5-oggetti.js:2092 | c1-partenza-segreta:821 |
| `tuttiGliOggettiB5()` | b5-oggetti.js:561 | d3-registro-scena:497 |
| `colpisciFragileB7()` | b7-stanze.js:1187 | d2-personaggi:264 |
| `disegnaOstacoloB7()` | b7-stanze.js:2132 | 60-resa:1170 |
| `gruppoNemiciB7()` | b7-stanze.js:1022 | 30-mappa:457 |
| `quartiereB7()` | b7-stanze.js:947 | d5-cambio-scena:478 |
| `variantiB7()` | b7-stanze.js:752 | d5-cambio-scena:226 |
| `accodaDidB8()` | b8-finali-diario.js:859 | d1-burattinaio:209 |
| `notaDidB8()` | b8-finali-diario.js:891 | h2-memorie:182 |
| `registraVoceBossB8()` | b8-finali-diario.js:893 | d1-burattinaio:1177 |
| `scriviPaginaRunB8()` | b8-finali-diario.js:1054 | h4-ritorno-piazza:238 |
| `sigilliB8()` | b8-finali-diario.js:1079 | h4-ritorno-piazza:110 |
| `statoB8()` | b8-finali-diario.js:715 | d3-registro-scena:344, h2-memorie:89 |
| `suonoFerroB8()` | b8-finali-diario.js:820 | h4-ritorno-piazza:262 |
| `suonoVoceB8()` | b8-finali-diario.js:786 | d1-burattinaio:210 |
| `tornaInPiazzaB8()` | b8-finali-diario.js:1578 | d1-burattinaio:1192 |
| `disegnaCavoB9()` | b9-immagini.js:605 | b2-ribalta:1121 |
| `disegnaLumeB9()` | b9-immagini.js:591 | b2-ribalta:648 |
| `disegnaOstacoloB9()` | b9-immagini.js:676 | 60-resa:1169, d6-acquedotto:2044 |
| `saccoImmagineB9()` | b9-immagini.js:710 | b7-stanze:2291 |
| `spuntoniImmagineB9()` | b9-immagini.js:699 | b7-stanze:2221 |
| `levaToccoC2()` | c2-tocco.js:308 | 40-combattimento:685, t4-hub-storia:873 |
| `tettoScalaC2()` | c2-tocco.js:291 | 60-resa:12 |
| `toccoSulPalcoC2()` | c2-tocco.js:299 | 70-input:218 |
| `verticaleC2()` | c2-tocco.js:351 | d2-personaggi:609 |
| `personaggioD2()` | d2-personaggi.js:95 | e6-assistenza:541 |
| `schedaD2()` | d2-personaggi.js:577 | 60-resa:1046 |
| `smorfiaD4()` | d4-stanze-teatro.js:631 | a3-stanze-speciali:459 |
| `temaMusicaD4()` | d4-stanze-teatro.js:1058 | a8-musica:153 |
| `disegnaBotolaD5()` | d5-cambio-scena.js:410 | h5-sottopalco:353 |
| `listaBotoleD5()` | d5-cambio-scena.js:160 | h5-sottopalco:129 |
| `acquedottoAttivoD6()` | d6-acquedotto.js:259 | h2-memorie:560 |
| `iaNemicoD6()` | d6-acquedotto.js:1128 | 40-combattimento:1339 |
| `aloneProiettileD7()` | d7-rifiniture.js:99 | 60-resa:1573 |
| `lucianaInScenaD7()` | d7-rifiniture.js:33 | 60-resa:1389 |
| `passoRagnoSetaD7()` | d7-rifiniture.js:156 | 40-combattimento:1382 |
| `testoToccoD7()` | d7-rifiniture.js:360 | t3-economia-salvataggi:436 |
| `assuntaInPiazzaH2()` | h2-memorie.js:314 | t4-hub-storia:796 |
| `battuteAssuntaH2()` | h2-memorie.js:324 | t4-hub-storia:755 |
| `disegnaAssuntaH2()` | h2-memorie.js:354 | t4-hub-storia:1309 |
| `rivelazioneRegistroH2()` | h2-memorie.js:236 | d3-registro-scena:750 |

## Cose che la mappa non dice

- Alcuni file tengono il loro stato chiuso dentro una funzione (`(() => { ... })()`, per esempio in
  `t3-economia-salvataggi.js` e `b2-ribalta.js`): da fuori non si avvolge, bisogna toccare il file stesso.
- Le `const` globali (`ctx`, le tabelle `Object.freeze`) non si possono riassegnare né estendere da un altro file:
  si avvolgono le `function`, non le costanti.
