# Oggetti del Teatro — catalogo a 200 (squadra b5)

> Codice: `gioco/teatro/b5-oggetti.js` (tabelle `OGGETTI_B5`, `CHIAVI_B5`, `SBLOCCHI_B5`, `TESTI_B5`) e
> `gioco/teatro/b5-oggetti-icone.js` (`ICONE_B5`). Verifica: `node tools/qa-teatro-oggetti200.js`.
> Questo elenco è generato dall'elenco che la QA legge dal gioco: se cambia il catalogo, si rigenera.
> ✦ = oggetto nuovo di questo lavoro · 🔒 = dietro uno sblocco · «— (b4)» = i temi dei vecchi li assegna la squadra b4.
> **Nomi, effetti, lore, condizioni di sblocco e banner sono testi da approvare dall'autore.**

## 1. Conti

| Catalogo | Prima | Nuovi | Ora |
|---|---|---|---|
| Passivi (`CATALOGO_OGGETTI`) | 62 | 94 | 156 |
| Attivi [Q] (`OGGETTI_ATTIVI`) | 3 | 15 | 18 |
| Patti d'Ombra (`CATALOGO_PATTO`) | 8 | 6 | 14 |
| Segreti (`CATALOGO_SEGRETO`) | 7 | 5 | 12 |
| **Totale** | **80** | **120** | **200** |

Dei 120 nuovi: **15 «solo numeri»** (13%, tetto richiesto un terzo),
**15 attivi** (richiesti ≥ 12), **12 negativi + 9 misti** (richiesti ≥ 15),
**23 dietro uno sblocco**.

Oggetti nuovi per tema (fra parentesi i soli passivi, quelli che si accumulano in una run):
**denari** 25 (18) · **ombra** 27 (17) · **maschera** 23 (18) · **fili** 16 (12) · **sacro** 23 (18) · **fuoco** 23 (18) · **bestia** 18 (16) · **cibo** 19 (17).
Ogni tema ha almeno 12 passivi nuovi: le trasformazioni di b4 sono raggiungibili anche senza contare i vecchi.

## 2. Dove compaiono (regole esistenti, non cambiate)

| Dove | Regola | Cosa cambia con b5 |
|---|---|---|
| Pool della run | 20 oggetti diversi: 3 negativi + 17 positivi/misti (`OGGETTI_B.dimensionePool`, `OGGETTI_D.pool.pesoNegativi`) | più scelta: 22 negativi e 134 positivi/misti fra cui pescare; i bloccati non entrano (a6 li sostituisce) |
| Stanza del tesoro | un oggetto del pool (o un negativo sconosciuto come dono ingannevole) | 20% delle volte è un **oggetto attivo** (`attiviPool.probTesoro`); il passivo torna nel pool |
| Fucina | base `5`, forte `7`, negativo `2` (`ECONOMIA_T3.prezzi`) | fino al 30% delle volte il banco «base» vende un attivo (5 o 7 secondo il tier; mai al posto di un negativo); sconti e rincari degli oggetti nuovi |
| Patto d'Ombra | 2 patti a scelta, −1 o −2 maschere massime | 6 patti nuovi; i 2 bloccati non escono finché non sono sbloccati |
| Stanza Segreta | 1 volta su 3 un oggetto segreto | 5 segreti nuovi; i 2 bloccati non escono |
| Stanza dello Sviluppatore | tutto il catalogo dei passivi | ora a pagine da 54 (PagSu/PagGiù) |
| Diario (menu ESC) | griglia unica dei passivi | tutti i 200 in 4 sezioni e 7 pagine (Q/E), con temi e condizione di sblocco |

**Oggetti attivi in gioco (novità).** Prima l'attivo era solo quello di partenza del personaggio. Ora si trovano:
prendendone uno dal piedistallo quello che avevi **resta lì** con la sua carica (puoi ripensarci); in Fucina lo
tiene Mastro Peppe. Un attivo mai avuto arriva carico. Lo «conosci» nel Diario quando lo prendi o lo usi.

## 3. Meccaniche nuove (chiavi di `mod`, tutte con un tetto in `CHIAVI_B5` / `OGGETTI_B5.tetti`)

| Famiglia | Chiavi | Regola | Tetto |
|---|---|---|---|
| Colpi che si dividono | `divisione` | a fine corsa N schegge all'indietro (50% danno, 80 px, non colpiscono il bersaglio già colpito, non si ridividono) | 3 schegge; colpi totali ≤ 48 + 12 |
| Colpi che tornano | `ritorno` | trapassano, a fine gittata tornano al giocatore al 60% del danno | vita ≤ 2,4 gittate |
| Scie | `scia`, `sciaPassi` | pozze a terra ogni 20 px (fuoco: danno + bruciatura; china: rallenta; santa: danno) ogni 12 tick | 36 pozze |
| Crescita | `crescita` | danno ×(1 + k·distanza/gittata) | k ≤ 1,5 |
| Colpo caricato | `caricato` | 1,5 s senza sparare → prossimo colpo ×N, grande, perforante | ×4 |
| Raffiche | `ogniN`, `retro`, `laterali`, `rosa`, `eco`, `onda` | ogni N colpi ventaglio/anello/colpo d'oro; colpo alle spalle; due ai lati; rosa di pallettoni; eco dell'ombra; colpi a serpentina | 3 regole `ogniN`, rosa 5, 4 eco in attesa |
| Caso | `critico`, `cilecca`, `dispersione`, `inceppo` | colpo d'oro ×3; colpi persi; mira che barcolla; arma che s'inceppa | 40%, 30%, 0,45 rad |
| Sui nemici | `rallenta`, `gelo`, `primoColpo`, `finisci`, `dannoBoss` | rallentati al 50% (boss 80%); storditi; primo colpo ×2; esecuzione sotto soglia (mai i boss); bonus sui boss | 3 s, 25%, ×2,5, 25%, ×1,5 |
| Uccisioni | `uccisioneEsplode`, `rubaVita`, `uccisioneMoneta` | scoppio sui vicini; ½ maschera ogni N; moneta a caso | raggio 48, N ≥ 6, 15% |
| Danno dinamico | `dannoFermo`, `pocaVita`, `vitaPienaDanno`, `colpoFuria`, pubblico | un moltiplicatore unico per tick | ×3,0 in tutto |
| Cadenza dinamica | `cadenzaMoto`, `vitaPienaCadenza`, caffè, pubblico | accorcia il tempo fra due colpi | ×2,2; mai sotto 5 tick |
| Scudi | `scudoTempo`, `salvaPiano`, `oboloMorte`, `invulnExtra` | para un colpo e si ricarica; salva dal colpo mortale 1 volta a piano; il colpo mortale costa 5 monete; i-frames ± | ricarica ≥ 15 s; i-frames ≥ 20 tick |
| Colpo subito | `spine`, `colpoStordisci`, `colpoOnda`, `colpoPerdeMonete`, `colpoTarlo`, `dannoDoppio` | reazioni e prezzi quando perdi vita | stordimento 2 s (boss 40%); tarlo −0,8 |
| Famigli B5 | `famB5`: raccoglitore, scudiero, torretta, lume, bombarolo, seguace; `pastori` | raccolgono monete, parano (1 colpo ogni 0,5 s), sparano da fermi, scottano e scacciano il buio, lanciano petardi | 4 famigli B5 + 3 pastori + 3 cardellini a tempo (oltre ai 4 di D) |
| Ingresso in stanza | `ingressoStordisci`, `ingressoBrucia`, `ingressoFulmine`, `ingressoIella`, `fiutoSegreto` | una volta per stanza di combattimento | — |
| Stanza ripulita | `puliziaDanno`, `illesoDanno`, `puliziaCarica`, `puliziaMoneta`, `puliziaCura`, `puliziaIllesoCura`, `puliziaDono` | bonus che crescono, cariche, monete, cure | +1,5 e +1,6 danno fisso |
| Raccolta | `magnete`, `monetaCura`, `monetaScintille`, `chiaveMoneta`, `bombaDoppia`, `immuneBombe`, `pianoBombe`, `pianoChiavi` | si confrontano monete/chiavi/bombe col tick prima | 5 «raccolte» per tick |
| Pubblico | `gradimentoDanno`, `gradimentoCadenza`, `fischiDanno` | leggono `window.__teatro.interni.gradimentoPubblico` (numero 0..1 o 0..100, funzione o oggetto con `valore`); **se non c'è sono ignorati** e l'oggetto vale i suoi soli numeri | +50%, +40% |
| Notte | `lunario`, `notteDanno` | notti pari/dispari; danno fisso per notte vissuta | +4,0 in tutto |
| Bottega e stanze | `sconto`, `scontoFisso`, `acquistoSangue`, `pattoGratis`, `tesoroBis`, `segretaVista`, `rivelaEffetti` | sconti (mai sotto 1 moneta), un Patto gratis, secondo oggetto nel tesoro, Segreta sulla mappa, effetti visibili prima di raccogliere | sconto ≤ 60% |

## 4. Nota di bilancio

Metro: Ferruccio base fa 3,5 × 2,73 = **9,55 danno/s** (come in `production/arte/oggetti-teatro.md` §5).

**I più forti (da tenere d'occhio nei playtest)**

| Oggetto | Perché | Freno |
|---|---|---|
| Tromboncino del Brigante | a bruciapelo 5 pallettoni = ~20,7 danno/s (+117%) | −70 gittata, rosa larga, cadenza ×0,7: da lontano ne arrivano 1-2 (4-8 danno/s) |
| Rocchetto di Seta Reale | trapassa e ricolpisce al ritorno: fino a ×1,6 su un bersaglio in linea | il ritorno punta dove sei tu: muovendoti manca; è un forte, dietro lo sblocco di Agnese |
| Ombra Gemella (patto) | +60% di colpi | costa 2 maschere massime; dietro Donna Luciana |
| Luna Nera (patto) / Luna nel Pozzo | +0,2 / +0,1 danno fisso per notte: a notte 15-20 valgono +3,0 / +2,0 | crescono solo con le notti vissute; tetto comune +4,0; dietro le notti 6 e 5 |
| Archetto di Violino | un colpo ×3,5 perforante ogni 1,5 s di silenzio | bisogna smettere di sparare: 8,2 danno/s se si usa solo quello |
| Fuoco di Sant'Elmo / Zolfo | all'ingresso 14 danno al più forte / ~11 di bruciatura a tutti: al piano 1 svuotano mezza stanza | danno piatto: dal piano 3 in poi è un aiuto, non una soluzione; sui boss meno del 10% della vita |
| Ex Voto + Obolo + Ombrello + Velo della Madonna + Ostia | quasi immortali | cinque oggetti diversi: ≈ 0,003% che stiano tutti nel pool di una run (17 positivi su 134); l'Obolo consuma le monete |
| Corona di Latta + Polizza + Bilancia | Fucina al 40% del prezzo | tetto dello sconto 60%, prezzo minimo 1; la Bilancia toglie ½ maschera ad acquisto (mai l'ultima) |
| Specchio del Camerino (attivo) | contro un boss rimanda fino a 24 proiettili (≈ 67 danno a base) | 3 stanze di ricarica; contro Donna Luciana (615 PV al piano 4) è ~11% della vita |

**Economia.** Borsellino (+~2 monete a piano), Cassetta (+~2), Salvadanaio (3 ogni 6 stanze), Calza, Topolino: ognuno
vale circa un terzo delle 5-8 monete del piano 1. Trenta Denari dà 15 monete ma ne toglie 3 a colpo subito.
Nessuno di questi tocca i drop di base (`ECONOMIA_T3` non è cambiata).

**Niente blocca la run.** Gittata minima 50 px (clamp di D), mai meno di 5 tick fra due colpi, cilecca ≤ 30%,
inceppo 0,6 s ogni 8 colpi, Cilicio e Bilancia non tolgono mai l'ultima mezza maschera, l'esecuzione non vale sui boss,
i negativi nuovi non toccano mappa né porte. Gli stordimenti sui boss durano il 40%.

**Prestazioni** (misura di `tools/qa-teatro-oggetti200.js`, 900 tick). Con **tutti** i passivi senza arma speciale né
maledizione, più i patti e i segreti nuovi addosso (162 oggetti), 8 nemici, fino a 60 colpi, 36 pozze e 11 famigli:
logica **0,23 ms per tick** (0,06 senza oggetti); disegno di un frame 9,7 ms nel browser di prova
senza scheda grafica (5,3 ms senza oggetti): la somma resta sotto i 16,7 ms di un frame a 60 fps.
Tutti gli elenchi (colpi, pozze, famigli, eco) hanno un tetto in tabella; ogni oggetto del catalogo è stato dato al
giocatore e giocato 3 secondi in una stanza con nemici senza errori (200 su 200).

## 5. Elenco completo

### 5a. Passivi (156)

| # | id | Nome | Tier | Temi | Effetto |
|---|---|---|---|---|---|
| 1 | `spada` | Spada di Gaetano | forte | — (b4) | [★ FORTE] Equipa Spada (6 frame) · Danno x1.45 · +1.0 Danno fisso |
| 2 | `piombo` | Pallino di Piombo | forte | — (b4) | [★ FORTE] +3.8 Danno fisso · Danno x1.9 · Cadenza x0.48 (Colpi Giganti) |
| 3 | `anello` | Anello Cremisi | forte | — (b4) | [★ FORTE] +0.8 Danno · Danno x1.5 · Proiettili Perforanti |
| 4 | `triplo` | Triplo Occhio | forte | — (b4) | [★ FORTE] Triplo Colpo a ventaglio · +0.4 Danno · Cadenza x0.58 |
| 5 | `catena` | Catena della Chiusa | forte | — (b4) | [★ FORTE] +0.6 Cadenza · Fulmini a catena tra tutti i nemici |
| 6 | `venti` | Maschera dei 4 Venti | forte | — (b4) | [★ FORTE] Spara contemporaneamente nelle 4 direzioni · +0.5 Danno |
| 7 | `chiodo` | Chiodo della Fucina | base | — (b4) | [BASE] +0.65 Danno · +20 Gittata |
| 8 | `fuoco` | Tizzone di Bragia | base | — (b4) | [BASE] +0.6 Danno · Proiettili Infuocati (Bruciatura DoT) |
| 9 | `doppia` | Lente di San Leucio | base | — (b4) | [BASE] Doppio Colpo parallelo · Danno x0.80 |
| 10 | `mercurio` | Goccia di Mercurio | base | — (b4) | [BASE] +0.85 Cadenza (Raffica) · +0.10 Velocità |
| 11 | `cuore` | Medaglione di Rosa | base | — (b4) | [BASE] +1 Maschera Massima · Rigenera +1 Maschera · +0.2 Danno |
| 12 | `stivali` | Sciarpa Rossa di Agnese | base | — (b4) | [BASE] +0.25 Velocità · +0.4 Danno · +35 Gittata |
| 13 | `mantice` | Mantice del Fabbro | base | — (b4) | [BASE] +0.55 Danno · +0.45 Cadenza |
| 14 | `corno` | Corno di Corallo | forte | — (b4) | [★ FORTE] +1 Maschera Massima · +0.6 Danno · Danno x1.25 · +0.15 Velocità · +20 Gittata |
| 15 | `campana` | Campana di San Lorenzo | forte | — (b4) | [★ FORTE] +1.0 Danno · +0.5 Danno fisso |
| 16 | `fiaccola` | Fiaccola del Vesuvio | forte | — (b4) | [★ FORTE] Proiettili Infuocati e Perforanti · +0.4 Danno |
| 17 | `lanterna` | Lanterna Magica | forte | — (b4) | [★ FORTE] Doppio Colpo parallelo · +0.5 Cadenza · +0.3 Danno |
| 18 | `sole` | Sole d'Ottone | forte | — (b4) | [★ FORTE] Colpi più grandi · +1.5 Danno fisso · +0.3 Cadenza |
| 19 | `nastro` | Nastro del Sipario | base | — (b4) | [BASE] +0.20 Velocità · +0.4 Cadenza |
| 20 | `ago` | Ago di Agnese | base | — (b4) | [BASE] +40 Gittata · +0.35 Danno |
| 21 | `castagna` | Castagna del Ciuccio | base | — (b4) | [BASE] +1 Maschera Massima · Rigenera +1 Maschera |
| 22 | `cornetto` | Cornetto Portafortuna | base | — (b4) | [BASE] +0.5 Danno · +0.10 Velocità |
| 23 | `bottone` | Bottone di Madreperla | base | — (b4) | [BASE] +0.7 Cadenza |
| 24 | `pettine` | Pettine di Tartaruga | base | — (b4) | [BASE] +0.35 Cadenza · +25 Gittata · +0.10 Velocità |
| 25 | `pipa` | Pipa di Pulcinella | base | — (b4) | [BASE] +0.45 Danno · +30 Gittata |
| 26 | `pagnotta` | Pagnotta di Port'Alba | base | — (b4) | [BASE] +1 Maschera Massima · Rigenera +1 Maschera · +0.05 Velocità |
| 27 | `chiave` | Chiave del Camerino | base | — (b4) | [BASE] +0.3 Danno · +0.3 Cadenza · +0.10 Velocità · +15 Gittata |
| 28 | `dado` | Dado della Bisca | base | — (b4) | [BASE] +0.8 Danno fisso |
| 29 | `trottola` | Trottola di Piazza Mercato | base | — (b4) | [BASE] +0.3 Velocità · +0.2 Cadenza |
| 30 | `sfogliatella` | Sfogliatella Riccia | base | — (b4) | [BASE] +1 Maschera Massima (vuota) |
| 31 | `pastiera` | Fetta di Pastiera | forte | — (b4) | [★ FORTE] +1 Maschera Massima · Rigenera 2 Maschere · +0.3 Danno |
| 32 | `cucchiaio` | Cucchiaio del Re | base | — (b4) | [BASE] Colpi a ricerca (curvano verso i nemici) |
| 33 | `astrolabio` | Astrolabio della Specola | forte | — (b4) | [★ FORTE] I colpi ti orbitano attorno · +40 Gittata · +0.4 Danno |
| 34 | `gomma` | Gomma del Burattinaio | base | — (b4) | [BASE] I colpi rimbalzano 2 volte sui muri |
| 35 | `piedigrotta` | Razzo di Piedigrotta | forte | — (b4) | [★ FORTE] Colpi esplosivi · Danno x1.6 · Cadenza x0.55 |
| 36 | `ragno` | Ragno della Seta di San Leucio | forte | — (b4) | [★ FORTE] 4 colpi a ventaglio · Cadenza x0.42 |
| 37 | `velo-madonna` | Velo della Madonna dell'Arco | forte | — (b4) | [★ FORTE] Para il primo colpo di ogni stanza |
| 38 | `cuoio` | Maschera di Cuoio | base | — (b4) | [BASE] 25% di parare i proiettili nemici |
| 39 | `gomitolo` | Gomitolo di Fili d'Oro | base | — (b4) | [BASE] Un gomitolo ti orbita attorno: para i colpi e ferisce |
| 40 | `ostia` | Ostia della Cappella Palatina | forte | — (b4) | [★ FORTE] Ogni colpo toglie al massimo ½ Maschera |
| 41 | `pupo_tonino` | Burattino di Tonino | base | — (b4) | [BASE] Famiglio: un burattino che spara con te (3.0 Danno) |
| 42 | `pupa_agnese` | Pupattola di Agnese | base | — (b4) | [BASE] Famiglio: una bambola che spara con te (4.5 Danno) |
| 43 | `gatto` | Gatto di Vico Lungo | forte | — (b4) | [★ FORTE] Famiglio: un gatto che graffia i nemici (3.0 Danno) |
| 44 | `diavoletto` | Diavoletto del Presepe | forte | — (b4) | [★ FORTE] Famiglio: spara da solo al nemico più vicino (3.5 Danno) |
| 45 | `pulcinellino` | Pulcinellino | forte | — (b4) | [★ FORTE] Famiglio: colpi a ricerca (3.0 Danno) |
| 46 | `campanello` | Campanello del Portiere | base | — (b4) | [BASE] +0.5 Cadenza · +20 Gittata |
| 47 | `tarallo` | Tarallo Sugna e Pepe | base | — (b4) | [BASE] +0.4 Danno · +1 Maschera Massima |
| 48 | `carta-ventaglio` | Ventaglio di Carta | base | — (b4) | [BASE] I tuoi colpi annullano i proiettili nemici · +0.2 Danno |
| 49 | `cuore-sacro` | Cuore Sacro di Santa Chiara | forte · misto | — (b4) | [◐ MISTO] ★ Danno x2.3 · +1 Maschera · Colpi a ricerca · Cadenza x0.6 |
| 50 | `bombarda` | Bombarda di Gaeta | forte · misto | — (b4) | [◐ MISTO] ★ Danno x2.6 · Colpi enormi e lenti · Cadenza x0.3 |
| 51 | `occhio-vetro` | Occhio di Vetro del Ciarlatano | forte · misto | — (b4) | [◐ MISTO] ★ Danno x2 da vicino, cala con la distanza · -60 Gittata · +0.5 Danno |
| 52 | `cappello-mago` | Cappello del Mago di Corte | base · misto | — (b4) | [◐ MISTO] I colpi partono in due diagonali · +0.3 Cadenza |
| 53 | `sugna` | Sugna del Macellaio | base · negativo | — (b4) | [◐ MISTO] +2 Maschere Massime · Rigenera 2 Maschere · -0.25 Velocità |
| 54 | `ranocchio` | Ranocchio della Fontana | base · negativo | — (b4) | [◐ MISTO] +1.4 Cadenza · -110 Gittata |
| 55 | `latte` | Latte di Mandorla | negativo · negativo | — (b4) | [✗ NEGATIVO] Danno x0.2 · Cadenza x5.5 (pioggerella) |
| 56 | `corda` | Corda del Campanaro | negativo · negativo | — (b4) | [✗ NEGATIVO] -0.6 Cadenza |
| 57 | `zoccoli` | Zoccoli di Legno | negativo · negativo | — (b4) | [✗ NEGATIVO] -0.25 Velocità |
| 58 | `spillo` | Spillo Spuntato | negativo · negativo | — (b4) | [✗ NEGATIVO] -50 Gittata · +0.1 Danno |
| 59 | `salasso` | Ventosa del Barbiere | negativo · negativo | — (b4) | [✗ NEGATIVO] -1 Maschera Massima |
| 60 | `nebbia` | Nebbia del Volturno | negativo · negativo | — (b4) | [✗ NEGATIVO] Maledizione: la mappa sparisce fino a fine piano |
| 61 | `lume` | Lume Spento | negativo · negativo | — (b4) | [✗ NEGATIVO] Maledizione: buio attorno a te fino a fine piano |
| 62 | `benda` | Benda del Cieco | negativo · negativo | — (b4) | [✗ NEGATIVO] Maledizione: gli oggetti tornano «???» fino a fine piano |
| 63 | `melagrana` | Melagrana di Capodanno ✦ | base | cibo, sacro | [BASE] All'impatto ogni colpo si divide in 2 schegge |
| 64 | `rocchetto` | Rocchetto di Seta Reale ✦ | forte | fili | [★ FORTE] I colpi trapassano i nemici e tornano indietro lungo il filo (al ritorno 60% del Danno) · +20 Gittata · 🔒 Sblocca Agnese |
| 65 | `olio-lucerna` | Olio di Lucerna ✦ | base | fuoco | [BASE] I colpi lasciano a terra una scia di fuoco |
| 66 | `china-copista` | China del Copista ✦ | base | ombra | [BASE] I colpi lasciano macchie di china che rallentano i nemici |
| 67 | `acqua-montevergine` | Acqua Santa di Montevergine ✦ | forte | sacro | [★ FORTE] Camminando lasci una scia benedetta che ferisce i nemici |
| 68 | `struffolo` | Struffolo Rotolante ✦ | base | cibo | [BASE] I colpi crescono con la distanza: fino a Danno x2 a fine Gittata |
| 69 | `archetto` | Archetto di Violino ✦ | forte | fili, maschera | [★ FORTE] Se non spari per 1,5 s il prossimo colpo è caricato: Danno x3.5, enorme e perforante |
| 70 | `matita-censore` | Matita del Censore ✦ | base | ombra, denari | [BASE] Ogni 12 colpi una raffica di 7 a ventaglio |
| 71 | `cartella-tombola` | Cartella della Tombola ✦ | base | denari | [BASE] Ogni 5° colpo è d'oro: Danno x2.5 |
| 72 | `girandola` | Girandola di Piedigrotta ✦ | forte | fuoco | [★ FORTE] Ogni 8 colpi un anello di 8 scintille infuocate attorno a te · 🔒 Arriva al Piano 2 |
| 73 | `nastro-tarantella` | Nastro della Tarantella ✦ | base | fili, maschera | [BASE] I colpi serpeggiano come un nastro · +0.4 Cadenza |
| 74 | `erma-giano` | Erma di Giano ✦ | base | maschera | [BASE] Ogni colpo ne lancia un altro alle tue spalle |
| 75 | `candelabro` | Candelabro a Tre Bracci ✦ | forte | sacro, fuoco | [★ FORTE] Ogni colpo ne aggiunge due ai lati (a metà Danno) · +0.3 Danno |
| 76 | `quaterna` | Quaterna Secca ✦ | base | denari | [BASE] 15% dei colpi è un colpo d'oro: Danno x3 |
| 77 | `sorbetto` | Sorbetto al Limone ✦ | base | cibo | [BASE] I colpi rallentano i nemici per 2 s · 8% di gelarli sul posto |
| 78 | `guanto-sfida` | Guanto di Sfida ✦ | base | maschera | [BASE] Il primo colpo su un nemico illeso fa Danno x2 · 🔒 Sblocca Taddeo |
| 79 | `mannaia` | Mannaia di Piazza Mercato ✦ | forte | ombra | [★ FORTE] I nemici comuni sotto il 18% di vita cadono subito · +0.3 Danno |
| 80 | `lancia-michele` | Lancia di San Michele ✦ | forte | sacro | [★ FORTE] Danno x1.5 contro i boss · +0.3 Danno · 🔒 Sconfiggi Donna Luciana |
| 81 | `castagnola` | Castagnola ✦ | base | fuoco | [BASE] I nemici sconfitti scoppiano e feriscono quelli vicini |
| 82 | `sanguinaccio` | Sanguinaccio di Carnevale ✦ | forte | cibo, ombra | [★ FORTE] Ogni 14 nemici sconfitti rigeneri ½ Maschera |
| 83 | `borsellino` | Borsellino del Gabelliere ✦ | base | denari | [BASE] 10% che un nemico sconfitto lasci una moneta |
| 84 | `piedistallo-mimo` | Piedistallo del Mimo ✦ | base | maschera | [BASE] Da fermo: Danno x1.4 |
| 85 | `scarpette` | Scarpette da Ballo ✦ | base | fili | [BASE] In movimento: Cadenza x1.25 · +0.10 Velocità |
| 86 | `ombrello` | Ombrello di Corso Trieste ✦ | forte | maschera | [★ FORTE] Scudo a tempo: para un colpo, poi si riapre dopo 25 s |
| 87 | `mantellina` | Mantellina di San Gennaro ✦ | base | sacro | [BASE] Dopo un colpo subito resti intoccabile 0,8 s in più |
| 88 | `riccio` | Riccio di Castagna ✦ | base | bestia, cibo | [BASE] Quando vieni colpito, i nemici vicini si pungono (Danno 8) |
| 89 | `campanaccio` | Campanaccio del Pastore ✦ | base | bestia | [BASE] Quando vieni colpito tutti i nemici restano storditi 1,5 s |
| 90 | `peperoncini` | Mazzetto di Peperoncini ✦ | base | cibo, fuoco | [BASE] Dopo un colpo subito: Danno x1.6 per 5 s |
| 91 | `ex-voto` | Ex Voto d'Argento ✦ | forte | sacro | [★ FORTE] Una volta per piano il colpo mortale ti lascia con ½ Maschera · 🔒 Sconfiggi il Custode di Marmo |
| 92 | `angelo-cartapesta` | Angelo di Cartapesta ✦ | forte | sacro, maschera | [★ FORTE] Quando vieni colpito un'onda spazza i proiettili e respinge i nemici (ogni 8 s) |
| 93 | `obolo` | Obolo del Barcaiolo ✦ | forte | denari, ombra | [★ FORTE] Con almeno 5 monete, il colpo mortale ti costa 5 monete invece della vita |
| 94 | `gazza` | Gazza Ladra ✦ | base | bestia, denari | [BASE] Famiglio: una gazza che raccoglie le monete per te |
| 95 | `pupo-paladino` | Pupo Paladino ✦ | forte | fili, maschera | [★ FORTE] Famiglio: un paladino con lo scudo che para i proiettili davanti a te · 🔒 Sconfiggi il Capitano di Piombo |
| 96 | `zampognaro` | Zampognaro del Presepe ✦ | base | sacro, fili | [BASE] Famiglio: si pianta dove entri e spara al nemico più vicino (2.5 Danno) |
| 97 | `civetta` | Civetta della Reggia ✦ | forte | bestia, ombra | [★ FORTE] Famiglio: mira da sola al nemico più vicino (2.6 Danno, rapida) · 🔒 Arriva alla Notte 4 |
| 98 | `topolino` | Topolino del Suggeritore ✦ | base | bestia, maschera | [BASE] Famiglio: a stanza ripulita ogni tanto ti porta una moneta, una bomba o una chiave |
| 99 | `lucciola-barattolo` | Lucciola in Barattolo ✦ | base | bestia, fuoco | [BASE] Famiglio: scaccia il buio del Lume Spento e scotta i nemici vicini |
| 100 | `cane-pastore` | Cane del Pastore ✦ | forte | bestia | [★ FORTE] Famiglio: un cane che azzanna i nemici (4.5 Danno) · 🔒 Sconfiggi il Gatto dei Quattro Canti |
| 101 | `ciuccio` | Ciuccio del Presepe ✦ | base | bestia, sacro | [BASE] Famiglio da soma: +1 bomba e +1 chiave subito e a ogni piano |
| 102 | `fuochista` | Fuochista di Piedigrotta ✦ | forte | fuoco, fili | [★ FORTE] Famiglio: ogni 4 s lancia un petardo sul nemico più vicino · 🔒 Sconfiggi lo Spezzafili d'Ottone |
| 103 | `grancassa` | Grancassa della Banda ✦ | base | maschera | [BASE] Entrando in una stanza un colpo di grancassa stordisce i nemici per 1,2 s |
| 104 | `zolfo` | Zolfo della Solfatara ✦ | forte | fuoco | [★ FORTE] Entrando in una stanza tutti i nemici prendono fuoco |
| 105 | `fuoco-elmo` | Fuoco di Sant'Elmo ✦ | forte | sacro, fuoco | [★ FORTE] Entrando in una stanza una saetta colpisce il nemico più forte (Danno x4) |
| 106 | `naso-tartufaio` | Naso del Tartufaio ✦ | base | bestia, cibo | [BASE] Fiuti i passaggi murati quando entri in una stanza · +15 Gittata |
| 107 | `cilindro-attore` | Cilindro del Primo Attore ✦ | base | maschera | [BASE] A ogni stanza ripulita un inchino: +0.05 Danno fisso (fino a +1.5) |
| 108 | `biglietto-bis` | Biglietto del Bis ✦ | base | maschera, denari | [BASE] Ogni stanza ripulita ricarica una tacca in più dell'oggetto attivo [Q] |
| 109 | `cassetta-elemosine` | Cassetta delle Elemosine ✦ | base | sacro, denari | [BASE] 30% di una moneta in più a ogni stanza ripulita |
| 110 | `baba` | Babà al Rum ✦ | forte | cibo | [★ FORTE] Ogni 2 stanze ripulite senza subire colpi rigeneri ½ Maschera |
| 111 | `cera-vergine` | Cera Vergine ✦ | base | sacro | [BASE] Ogni 4 stanze ripulite rigeneri ½ Maschera |
| 112 | `grani-incenso` | Grani d'Incenso ✦ | base | sacro | [BASE] Stanza ripulita senza subire colpi: +0.08 Danno fisso (fino a +1.6) · un colpo subito dimezza il bonus |
| 113 | `ferro-calamitato` | Ferro di Cavallo Calamitato ✦ | base | fuoco, bestia | [BASE] Monete, cuori, bombe e chiavi a terra volano verso di te |
| 114 | `porcellino` | Porcellino di Terracotta ✦ | base | denari, bestia | [BASE] Ogni 6 monete raccolte rigeneri ½ Maschera |
| 115 | `zecchino` | Zecchino Scintillante ✦ | forte | denari, fuoco | [★ FORTE] Ogni moneta raccolta sprigiona 6 scintille d'oro tutt'intorno · 🔒 Scopri 30 oggetti nel Diario |
| 116 | `mazzo-portinaio` | Mazzo del Portinaio ✦ | base | denari | [BASE] +1 chiave subito e a ogni piano · ogni chiave raccolta porta anche una moneta |
| 117 | `fiasca-polvere` | Fiasca di Polvere Nera ✦ | base | fuoco | [BASE] +2 bombe subito · ogni bomba raccolta vale doppio |
| 118 | `santa-barbara` | Santino di Santa Barbara ✦ | forte | sacro, fuoco | [★ FORTE] Le tue bombe non ti feriscono · +1 bomba subito e a ogni piano |
| 119 | `rosa-loggione` | Rosa dal Loggione ✦ | base | maschera | [BASE] +0.3 Danno · col favore del pubblico fino a Danno x1.35 |
| 120 | `binocolo` | Binocolo da Teatro ✦ | base | maschera, denari | [BASE] +0.3 Cadenza · col favore del pubblico fino a Cadenza x1.3 |
| 121 | `pomodoro-marcio` | Pomodoro Marcio ✦ | base · misto | cibo, maschera | [◐ MISTO] +0.4 Danno · se il pubblico fischia Danno x1.5, se applaude Danno x0.9 |
| 122 | `lunario` | Lunario del Barbanera ✦ | base | ombra | [BASE] Nelle notti pari +0.8 Cadenza, nelle notti dispari +0.8 Danno · 🔒 Arriva alla Notte 2 |
| 123 | `luna-pozzo` | Luna nel Pozzo ✦ | forte | ombra | [★ FORTE] +0.1 Danno fisso per ogni notte vissuta (fino a +2.0) · 🔒 Arriva alla Notte 5 |
| 124 | `polizza-monte` | Polizza del Monte di Pietà ✦ | base | denari | [BASE] Tutto nella Fucina costa il 25% in meno |
| 125 | `bilancia-truccata` | Bilancia Truccata ✦ | base · misto | denari, ombra | [◐ MISTO] La Fucina costa il 50% in meno, ma ogni acquisto ti toglie ½ Maschera |
| 126 | `indulgenza` | Indulgenza Plenaria ✦ | forte | sacro, ombra | [★ FORTE] Il prossimo Patto d'Ombra non ti costa Maschere (una volta sola) · 🔒 Arriva al Piano 4 |
| 127 | `doppio-fondo` | Baule a Doppio Fondo ✦ | forte | denari, ombra | [★ FORTE] 40% che la stanza del tesoro nasconda un secondo oggetto · 🔒 Arriva al Piano 3 |
| 128 | `campana-vetro` | Campana di Vetro ✦ | forte · misto | sacro | [◐ MISTO] ★ Danno x1.7 · ma ogni colpo subito ti toglie il doppio |
| 129 | `moccolo` | Moccolo dell'Ultima Replica ✦ | base · misto | fuoco, ombra | [◐ MISTO] Con 1 Maschera o meno: Danno x1.9 · altrimenti -0.2 Danno |
| 130 | `maschera-porcellana` | Maschera di Porcellana ✦ | forte · misto | maschera | [◐ MISTO] ★ A Maschere piene: Danno x1.5 e Cadenza x1.2 · ferito, non dà nulla · 🔒 Sblocca Pulcinella d'Ombra |
| 131 | `fiasco-gragnano` | Fiasco di Gragnano ✦ | base · misto | cibo | [◐ MISTO] +0.9 Danno · +0.5 Cadenza · ma la mira barcolla |
| 132 | `tromboncino` | Tromboncino del Brigante ✦ | forte · misto | fuoco, ombra | [◐ MISTO] ★ Ogni sparo è una rosa di 5 pallettoni · -70 Gittata · Cadenza x0.7 |
| 133 | `tasca-bucata` | Tasca Bucata ✦ | negativo · negativo | denari | [✗ NEGATIVO] Ogni colpo subito ti fa perdere 2 monete |
| 134 | `occhiali-appannati` | Occhiali Appannati ✦ | negativo · negativo | maschera | [✗ NEGATIVO] La mira barcolla |
| 135 | `gatto-nero` | Gatto Nero ✦ | negativo · negativo | bestia, ombra | [✗ NEGATIVO] 15% dei colpi fa cilecca |
| 136 | `specchio-rotto` | Specchio Rotto ✦ | negativo · negativo | maschera, ombra | [✗ NEGATIVO] Dopo un colpo subito resti intoccabile per meno tempo (-0,4 s) |
| 137 | `miele-rappreso` | Miele Rappreso ✦ | negativo · negativo | cibo, bestia | [✗ NEGATIVO] I tuoi colpi volano lenti e appiccicosi |
| 138 | `iettatore` | Monocolo dello Iettatore ✦ | negativo · negativo | ombra | [✗ NEGATIVO] In ogni stanza, una volta su tre, un nemico comune ha il 60% di vita in più |
| 139 | `tarlo` | Tarlo del Legno ✦ | negativo · negativo | bestia, fili | [✗ NEGATIVO] Ogni colpo subito: -0.08 Danno fisso (fino a -0.8) |
| 140 | `carlino-falso` | Carlino Falso ✦ | negativo · negativo | denari | [✗ NEGATIVO] Nella Fucina tutto costa 1 moneta in più |
| 141 | `filo-ingarbugliato` | Filo Ingarbugliato ✦ | negativo · negativo | fili | [✗ NEGATIVO] Ogni 8 colpi i fili s'ingarbugliano: 0,6 s senza sparare |
| 142 | `ceppi-galeotto` | Ceppi del Galeotto ✦ | negativo · negativo | fili | [✗ NEGATIVO] -0.2 Velocità · -0.3 Cadenza |
| 143 | `ruggine` | Ruggine della Chiusa ✦ | negativo · negativo | fuoco | [✗ NEGATIVO] -0.6 Danno fisso |
| 144 | `pane-raffermo` | Pane Raffermo ✦ | negativo · negativo | cibo | [✗ NEGATIVO] +1 Maschera Massima (vuota) · -0.4 Danno |
| 145 | `zeppola` | Zeppola di San Giuseppe ✦ | base | cibo, sacro | [BASE] +1 Maschera Massima · Rigenera +1 Maschera · +0.2 Cadenza |
| 146 | `friarielli` | Friarielli e Salsiccia ✦ | base | cibo | [BASE] +0.5 Danno · +0.25 Cadenza |
| 147 | `treccia-bufala` | Treccia di Bufala ✦ | base | cibo, bestia | [BASE] +1 Maschera Massima · Rigenera +1 Maschera · +0.10 Velocità |
| 148 | `limone-sorrento` | Limone di Sorrento ✦ | base | cibo | [BASE] +0.6 Cadenza · +15 Gittata |
| 149 | `ragu` | Ragù della Domenica ✦ | forte | cibo | [★ FORTE] +1 Maschera Massima · Rigenera 3 Maschere · +0.5 Danno |
| 150 | `rosario-corallo` | Rosario di Corallo ✦ | base | sacro | [BASE] +0.4 Danno · +0.3 Cadenza · +15 Gittata |
| 151 | `sigillo-borbone` | Sigillo dei Borbone ✦ | forte | denari | [★ FORTE] +0.7 Danno · +0.4 Cadenza · +20 Gittata |
| 152 | `filo-ferro` | Filo di Ferro ✦ | base | fili, fuoco | [BASE] +0.5 Danno · +25 Gittata |
| 153 | `croce-comando` | Croce di Comando ✦ | forte | fili | [★ FORTE] Danno x1.2 · +0.5 Cadenza · +0.2 Velocità |
| 154 | `dente-lupo` | Dente di Lupo del Matese ✦ | base | bestia | [BASE] +0.7 Danno |
| 155 | `tenaglie` | Tenaglie di Gaetano ✦ | forte | fuoco | [★ FORTE] +1.2 Danno fisso · Danno x1.2 |
| 156 | `ombra-lunga` | Ombra Lunga ✦ | base | ombra | [BASE] +45 Gittata · +0.3 Danno |

### 5b. Oggetti attivi — tasto Q (18)

| # | id | Nome | Tier | Temi | Effetto |
|---|---|---|---|---|---|
| 1 | `forbici` | Forbici di Gaetano | attivo · 3 cariche · base | — (b4) | [Q · 3 cariche] Spezza i fili d'oro: immobilizza tutti i nemici per 4s e infligge danno! |
| 2 | `tamburello` | Tamburello di Piazza Dante | attivo · 2 cariche · base | — (b4) | [Q · 2 cariche] Onda d'urto sonora: distrugge tutti i proiettili nemici e respinge i mostri! |
| 3 | `ampolla` | Ampolla di San Gennaro | attivo · 4 cariche · base | — (b4) | [Q · 4 cariche] Miracolo cremisi: rigenera subito +1 ❤️ Maschera intera! |
| 4 | `bussolotto` | Bussolotto della Bisca ✦ | attivo · 3 cariche · base | denari | [Q · 3 cariche] Rimescola gli oggetti della stanza: piedistallo e banchi cambiano |
| 5 | `cordone-sipario` | Cordone del Sipario ✦ | attivo · 3 cariche · base | maschera, fili | [Q · 3 cariche] Cala il sipario: via tutti i proiettili e 3 s senza poter essere colpito |
| 6 | `clessidra` | Clessidra della Specola ✦ | attivo · 3 cariche · forte | ombra | [Q · 3 cariche] Per 5 s nemici e proiettili si muovono a metà velocità · 🔒 Arriva alla Notte 3 |
| 7 | `tric-trac` | Tric-Trac di Capodanno ✦ | attivo · 2 cariche · base | fuoco | [Q · 2 cariche] Dodici petardi esplosivi partono in cerchio attorno a te |
| 8 | `acquasantiera` | Acquasantiera ✦ | attivo · 3 cariche · base | sacro | [Q · 3 cariche] Versa una pozza d'acqua santa: per 8 s ferisce i nemici che la toccano |
| 9 | `specchio-camerino` | Specchio del Camerino ✦ | attivo · 3 cariche · forte | maschera | [Q · 3 cariche] I proiettili nemici in volo diventano tuoi e tornano al mittente · 🔒 Arriva al Piano 3 |
| 10 | `salvadanaio` | Salvadanaio di Creta ✦ | attivo · 6 cariche · base | denari | [Q · 6 cariche] Rompilo: 3 monete rotolano a terra |
| 11 | `tazzulella` | Tazzulella 'e Cafè ✦ | attivo · 2 cariche · base | cibo | [Q · 2 cariche] Per 6 s: Cadenza x1.8 e Velocità più alta |
| 12 | `bacchetta-rabdomante` | Bacchetta del Rabdomante ✦ | attivo · 3 cariche · base | ombra, denari | [Q · 3 cariche] Apre il passaggio murato della stanza, se c'è; se non c'è, la carica resta |
| 13 | `cilicio` | Cilicio del Penitente ✦ | attivo · 2 cariche · forte | sacro, ombra | [Q · 2 cariche] Paghi ½ Maschera: Danno x1.7 finché resti in questa stanza · 🔒 Arriva al Piano 5 (secondo giro) |
| 14 | `gabbia-cardellini` | Gabbia dei Cardellini ✦ | attivo · 3 cariche · base | bestia | [Q · 3 cariche] Liberi 3 cardellini che beccano i nemici per 12 s · 🔒 Sconfiggi il Gatto dei Quattro Canti |
| 15 | `trampoli` | Trampoli del Saltimbanco ✦ | attivo · 2 cariche · base | maschera, fili | [Q · 2 cariche] Un balzo dove guardi: attraversi nemici e proiettili senza danni |
| 16 | `turibolo` | Turibolo d'Ottone ✦ | attivo · 3 cariche · base | sacro, fuoco | [Q · 3 cariche] Una nuvola d'incenso ardente: i nemici prendono fuoco e restano storditi 1 s |
| 17 | `calamita` | Calamita del Fabbro ✦ | attivo · 2 cariche · base | fuoco | [Q · 2 cariche] Trascina i nemici comuni al centro della stanza e li stordisce 1,5 s |
| 18 | `calza-befana` | Calza della Befana ✦ | attivo · 5 cariche · base | cibo, denari | [Q · 5 cariche] Ne esce una sorpresa: una moneta, mezza Maschera, una bomba o una chiave |

### 5c. Patti d'Ombra (14)

| # | id | Nome | Tier | Temi | Effetto |
|---|---|---|---|---|---|
| 1 | `patto_raggio` | Raggio Cremisi del Velo | patto · −2 masch. | — (b4) | [😈 PATTO] Raggio Cremisi continuo: tieni la freccia, danno su tutta la linea · Danno x2.1 |
| 2 | `patto_coltello` | Lama della Burattinaia | patto · −2 masch. | — (b4) | [😈 PATTO] Fendente da Mischia Perforante · Danno x2.0 |
| 3 | `patto_patto` | Giuramento di Sangue | patto · −2 masch. | — (b4) | [😈 PATTO] +0.5 Danno · +0.7 Cadenza · +2 Maschere di Cera |
| 4 | `patto_marchio` | Sigillo dell'Ombra | patto · −1 masch. | — (b4) | [😈 PATTO] +1.0 Danno · +0.2 Velocità · +1 Maschera di Cera |
| 5 | `patto_abisso` | Manto dell'Abisso | patto · −2 masch. | — (b4) | [😈 PATTO] Rimuove Maschere Massime · +1.5 Danno · +0.2 Velocità · +6 Maschere di Cera |
| 6 | `patto_collare` | Collare del Gatto Randagio | patto · −1 masch. | — (b4) | [😈 PATTO] 50% di Risorgere con ½ Maschera alla Morte |
| 7 | `patto_tunica` | Mozzetta Nera del Confratello | patto · −1 masch. | — (b4) | [😈 PATTO] +1.0 Danno · +3 Maschere di Cera |
| 8 | `patto_contratto` | Cambiale del Sottosuolo | patto · −1 masch. | — (b4) | [😈 PATTO] Raddoppia le Ricompense di Fine Stanza |
| 9 | `patto_eco` | Ombra Gemella ✦ | patto · −2 masch. | ombra, maschera | [😈 PATTO] Un'ombra ripete ogni tuo colpo dopo un istante (60% del Danno) · 🔒 Sconfiggi Donna Luciana |
| 10 | `patto_fame` | Fame del Velo ✦ | patto · −1 masch. | ombra, bestia | [😈 PATTO] Ogni 9 nemici sconfitti rigeneri ½ Maschera · +0.4 Danno |
| 11 | `patto_trenta` | Trenta Denari ✦ | patto · −1 masch. · misto | ombra, denari | [😈 PATTO] +15 monete subito · ogni colpo subito ti fa perdere 3 monete |
| 12 | `patto_luna_nera` | Luna Nera ✦ | patto · −1 masch. | ombra | [😈 PATTO] +0.2 Danno fisso per ogni notte vissuta (fino a +3.0) · 🔒 Arriva alla Notte 6 |
| 13 | `patto_nodo` | Nodo Scorsoio ✦ | patto · −1 masch. | ombra, fili | [😈 PATTO] I colpi rallentano i nemici · i nemici comuni sotto il 25% di vita cadono subito |
| 14 | `patto_candela` | Candela Nera ✦ | patto · −1 masch. · misto | ombra, fuoco | [😈 PATTO] Con 1 Maschera o meno: Danno x2.2 · +2 Maschere di Cera |

### 5d. Oggetti segreti (12)

| # | id | Nome | Tier | Temi | Effetto |
|---|---|---|---|---|---|
| 1 | `trascendenza` | Ali di Cartapesta | segreto | — (b4) | [👁 SEGRETO] Volo Spettrale (Sorvola baratri, trappole e ostacoli) |
| 2 | `fungo_1up` | Corno della Seconda Vita | segreto | — (b4) | [👁 SEGRETO] +1 Vita Extra · Risorgi con la salute completamente ripristinata! |
| 3 | `fegato_crudo` | Zuppa di Soffritto | segreto | — (b4) | [👁 SEGRETO] +2 Maschere Massime (+4 mezze) · Ripristino Completo Salute |
| 4 | `chiave_scheletro` | Chiave del Munaciello | segreto | — (b4) | [👁 SEGRETO] 99 Chiavi (Apre ogni cassa e porta senza esaurirsi) |
| 5 | `barile_polvere` | Cassa di Zecchini Borbonici | segreto | — (b4) | [👁 SEGRETO] 99 Monete Dorate d'Epoca |
| 6 | `loto_nero` | Giglio Nero del Belvedere | segreto | — (b4) | [👁 SEGRETO] +1 Maschera Massima · +2 Maschere di Cera Protettive |
| 7 | `soldi_potere` | Borsa dell'Usuraio | segreto | — (b4) | [👁 SEGRETO] +0.04 Danno per ogni moneta d'oro posseduta! |
| 8 | `lanterna_munaciello` | Lanterna del Munaciello ✦ | segreto | ombra, fuoco | [👁 SEGRETO] La Stanza Segreta di ogni piano è già segnata sulla mappa |
| 9 | `tombola_piena` | Tombola Piena ✦ | segreto | denari | [👁 SEGRETO] +7 monete · +3 bombe · +3 chiavi · salute ripristinata |
| 10 | `corona_latta` | Corona di Latta ✦ | segreto | denari, maschera | [👁 SEGRETO] Nella Fucina tutto costa la metà · +0.5 Danno |
| 11 | `presepe_intero` | Presepe Intero ✦ | segreto | sacro, fili | [👁 SEGRETO] Tre pastorelli ti seguono e sparano da soli (1.6 Danno ciascuno) · 🔒 Scopri 100 oggetti nel Diario |
| 12 | `occhio_lucia` | Occhi di Santa Lucia ✦ | segreto | sacro | [👁 SEGRETO] Vedi l'effetto di ogni oggetto prima di prenderlo · +30 Gittata · 🔒 Scopri 60 oggetti nel Diario |

## 6. Lore dei nuovi (da approvare)

| Nome | Lore |
|---|---|
| Melagrana di Capodanno | Si spacca a mezzanotte sulla soglia: ogni chicco, un colpo di fortuna. |
| Rocchetto di Seta Reale | Seta di San Leucio avvolta stretta: quello che lanci, ritorna. |
| Olio di Lucerna | Gocciola dal lume e accende il selciato dei vicoli. |
| China del Copista | Il copista di corte la versava sui nomi da dimenticare. |
| Acqua Santa di Montevergine | Portata a piedi dal santuario: benedice la strada di chi cammina. |
| Struffolo Rotolante | Rotola nel miele e s'ingrossa a ogni giro. |
| Archetto di Violino | Il primo violino aspetta la battuta giusta, poi entra. |
| Matita del Censore | Cancella le righe scomode dei copioni. |
| Cartella della Tombola | Cinquina! Il quinto numero è sempre quello buono. |
| Girandola di Piedigrotta | Gira, fischia e sputa fuoco sopra le teste della festa. |
| Nastro della Tarantella | Chi lo tiene in mano non riesce a stare fermo. |
| Erma di Giano | Due facce di marmo nel parco della Reggia: una guarda avanti, una indietro. |
| Candelabro a Tre Bracci | Tre fiamme sull'altare: una per chi parte, due per chi resta. |
| Quaterna Secca | Quattro numeri giocati sulla ruota di Napoli. Ogni tanto escono. |
| Sorbetto al Limone | Neve del Matese e limoni: ferma il respiro, e pure i nemici. |
| Guanto di Sfida | Si getta a terra davanti all'avversario: il primo affondo è il tuo. |
| Mannaia di Piazza Mercato | Il banco del macellaio e il palco del boia stavano nella stessa piazza. |
| Lancia di San Michele | L'arcangelo la tiene puntata sul drago da mille anni senza stancarsi. |
| Castagnola | Il botto piccolo dei bambini a Capodanno: uno tira l'altro. |
| Sanguinaccio di Carnevale | Cioccolato scuro e un segreto che a Carnevale non si chiede. |
| Borsellino del Gabelliere | Il gabelliere contava tutto, tranne quello che gli cadeva. |
| Piedistallo del Mimo | Chi ci sale diventa statua. E le statue non sbagliano. |
| Scarpette da Ballo | Consumate sulla punta: ballano anche senza la ballerina. |
| Ombrello di Corso Trieste | Sotto la pioggia del Corso ripara da tutto, una goccia alla volta. |
| Mantellina di San Gennaro | Il santo la stende su Napoli quando la montagna brontola. |
| Riccio di Castagna | Verde, tondo e pieno di spine: nessuno lo raccoglie due volte. |
| Campanaccio del Pastore | Un colpo solo e il gregge intero si ferma a guardare. |
| Mazzetto di Peperoncini | Appeso alla porta contro l'invidia. Morso, fa vedere rosso. |
| Ex Voto d'Argento | Una gamba d'argento appesa in chiesa: per grazia ricevuta. |
| Angelo di Cartapesta | Scende dal soffitto del teatro appeso a un filo, nell'ultimo atto. |
| Obolo del Barcaiolo | Il barcaiolo del Volturno passa tutti. Basta pagare. |
| Gazza Ladra | Ruba tutto quello che luccica, ma a te lo riporta. |
| Pupo Paladino | Armatura di latta, cuore di legno: si mette sempre in mezzo. |
| Zampognaro del Presepe | Scende dai monti a Natale e suona fermo sulla porta. |
| Civetta della Reggia | Dal cornicione della Reggia vede tutto quello che si muove di notte. |
| Topolino del Suggeritore | Abita nella buca del suggeritore e sa dove cade ogni cosa. |
| Lucciola in Barattolo | Presa alla Villa Comunale in una sera d'estate che non finisce. |
| Cane del Pastore | Bianco come le pecore che guarda, e molto meno paziente. |
| Ciuccio del Presepe | Porta la soma senza lamentarsi. Quasi. |
| Fuochista di Piedigrotta | Ha perso due dita e nessuna voglia di smettere. |
| Grancassa della Banda | Quando entra la banda, pure i gatti si fermano. |
| Zolfo della Solfatara | Giallo e puzzolente, raccolto dove la terra fuma. |
| Fuoco di Sant'Elmo | La fiamma azzurra sugli alberi delle navi, la notte prima della tempesta. |
| Naso del Tartufaio | Naso finto di cartone, fiuto vero: sente quello che i muri nascondono. |
| Cilindro del Primo Attore | Se lo toglie a ogni applauso. Ne vuole sempre un altro. |
| Biglietto del Bis | Strappato a metà: vale per la replica. |
| Cassetta delle Elemosine | Chi dà ai poveri presta a Dio. Tu sei il povero. |
| Babà al Rum | «Si' nu babbà»: il complimento più grande che c'è. |
| Cera Vergine | Cera d'api per le candele buone: rattoppa anche le maschere. |
| Grani d'Incenso | Brucia piano finché nessuno disturba la funzione. |
| Ferro di Cavallo Calamitato | Mastro Peppe giura che porta fortuna. Di sicuro porta spiccioli. |
| Porcellino di Terracotta | Si ingrassa di spiccioli e ti vuole bene. |
| Zecchino Scintillante | Appena coniato: scotta ancora. |
| Mazzo del Portinaio | Apre tutti i portoni del Corso. Il portinaio non lo sa che manca. |
| Fiasca di Polvere Nera | Asciutta nonostante la pioggia: le guardie la tenevano sotto il mantello. |
| Santino di Santa Barbara | Protettrice di chi maneggia la polvere. E di chi le sta vicino. |
| Rosa dal Loggione | Lanciata dall'ultima fila: è lì che siedono quelli che capiscono. |
| Binocolo da Teatro | Dal palco reale non si perde una mossa. |
| Pomodoro Marcio | Il giudizio del loggione, quando la serata va storta. |
| Lunario del Barbanera | Dice quando seminare, quando tagliarsi i capelli e quando menare. |
| Luna nel Pozzo | Più notti passi a guardarla, più ti sembra di poterla prendere. |
| Polizza del Monte di Pietà | Un pegno riscattato: Mastro Peppe ti guarda con altri occhi. |
| Bilancia Truccata | Pesa sempre a favore di qualcuno. Stavolta, quasi di te. |
| Indulgenza Plenaria | Firmata, timbrata e pagata: il peccato di domani è già perdonato. |
| Baule a Doppio Fondo | Il baule del trovarobe: sotto i costumi c'è sempre dell'altro. |
| Campana di Vetro | Protegge il santo dalla polvere. Dai sassi, no. |
| Moccolo dell'Ultima Replica | Brucia meglio quando sta per finire. |
| Maschera di Porcellana | Bellissima finché non la tocchi. |
| Fiasco di Gragnano | Rosso, frizzante e traditore. |
| Tromboncino del Brigante | Caricato a chiodi e bestemmie sulle strade del Matese. |
| Tasca Bucata | Ci infili la mano e trovi solo il buco. |
| Occhiali Appannati | Li aveva dimenticati il suggeritore. Ora si capisce perché sbagliava le battute. |
| Gatto Nero | Ti attraversa la strada ogni volta che stai per colpire. |
| Specchio Rotto | Sette anni di guai, dicono. Qui la notte non finisce mai. |
| Miele Rappreso | Dolce, denso e pieno di vespe addormentate. |
| Monocolo dello Iettatore | Basta che ti guardi una volta. Meglio fare le corna. |
| Tarlo del Legno | Scava piano dentro la marionetta. Lo senti solo la notte. |
| Carlino Falso | Suona male sull'incudine. Mastro Peppe se n'è accorto. |
| Filo Ingarbugliato | Più tiri, più si annoda. |
| Ceppi del Galeotto | Ferro ai polsi e alle caviglie: la marionetta peggio legata del regno. |
| Ruggine della Chiusa | Mangia il ferro buono, un inverno alla volta. |
| Pane Raffermo | Riempie la pancia e spegne la voglia. |
| Zeppola di San Giuseppe | Fritta il diciannove di marzo, con la crema e l'amarena in cima. |
| Friarielli e Salsiccia | Amari al punto giusto: rimettono in piedi un morto. |
| Treccia di Bufala | Dalle bufale del Volturno: ancora tiepida di siero. |
| Limone di Sorrento | Grosso come un pugno, aspro come la verità. |
| Ragù della Domenica | Deve pippiare dall'alba. La pazienza è l'ingrediente. |
| Rosario di Corallo | Grani rossi di Torre del Greco, consumati dal pollice. |
| Sigillo dei Borbone | Tre gigli in ceralacca: apre porte che le chiavi non aprono. |
| Filo di Ferro | Trafilato alla fucina: tiene su le marionette pesanti. |
| Croce di Comando | Il legno a croce da cui pendono i fili. In mano tua, per una volta. |
| Dente di Lupo del Matese | Legato al collo dei pastori: il lupo riconosce i suoi. |
| Tenaglie di Gaetano | Hanno ancora il segno delle sue mani sui manici. |
| Ombra Lunga | Al tramonto arriva prima di te in fondo alla strada. |
| Bussolotto della Bisca | Tre dadi, un bicchiere di cuoio e la faccia tosta di ritirare. |
| Cordone del Sipario | Un colpo secco e la scena sparisce. Anche per chi ti stava sparando. |
| Clessidra della Specola | La sabbia scende piano. In questa notte, quasi per niente. |
| Tric-Trac di Capodanno | Chi spara a mezzanotte scaccia il male dell'anno vecchio. |
| Acquasantiera | Presa in prestito da San Sebastiano. Si restituisce, prima o poi. |
| Specchio del Camerino | Circondato di lumini: rimanda indietro tutto quello che riceve. |
| Salvadanaio di Creta | Per aprirlo c'è un modo solo. |
| Tazzulella 'e Cafè | Amaro, bollente, in tre sorsi. Poi il mondo corre. |
| Bacchetta del Rabdomante | Un ramo di nocciolo a forcella: trema dove il muro è finto. |
| Cilicio del Penitente | Chi soffre in silenzio colpisce più forte. Così dicevano. |
| Gabbia dei Cardellini | La portava il venditore di numeri: l'uccellino sceglieva il biglietto. |
| Trampoli del Saltimbanco | Due passi dei suoi valgono dieci dei tuoi. |
| Turibolo d'Ottone | Dondola tre volte. Alla terza, la navata è piena di fumo. |
| Calamita del Fabbro | Gaetano ci raccoglieva i chiodi caduti. Tu, qualcos'altro. |
| Calza della Befana | Carbone per i cattivi. Tu speri di essere stato buono. |
| Ombra Gemella | La tua ombra si stacca dal muro e impara a fare quello che fai tu. |
| Fame del Velo | Il Velo mangia i ricordi. Tu impari a mangiare con lui. |
| Trenta Denari | Contali pure: sono giusti. È il resto che non torna. |
| Luna Nera | La notte immobile ha una luna che nessuno guarda. Lei guarda te. |
| Nodo Scorsoio | Un filo d'oro annodato a cappio: stringe da solo. |
| Candela Nera | Si accende per chiedere il male di qualcuno. Stanotte, del Velo. |
| Lanterna del Munaciello | Il piccolo monaco la lascia accesa nei cunicoli per chi gli sta simpatico. |
| Tombola Piena | Tutti e quindici i numeri: il panariello è tuo. |
| Corona di Latta | La corona del re di scena. Mastro Peppe s'inchina lo stesso. |
| Presepe Intero | Tutte le statuine di San Gregorio Armeno, in fila dietro di te. |
| Occhi di Santa Lucia | Due occhi su un piattino d'argento: vedono quello che tu non sai ancora. |

## 7. Icone da far generare

Le 120 icone nuove sono segnaposto 12×12 a pochi colori in `ICONE_B5` (chiave = id). Per sostituirle basta
un'immagine quadrata per oggetto, sagoma scura dal contorno netto con pochi accenti caldi (oro/rosso), fondo trasparente:

`oggetto-melagrana.png` · `oggetto-rocchetto.png` · `oggetto-olio-lucerna.png` · `oggetto-china-copista.png` · `oggetto-acqua-montevergine.png` · `oggetto-struffolo.png` · `oggetto-archetto.png` · `oggetto-matita-censore.png` · `oggetto-cartella-tombola.png` · `oggetto-girandola.png` · `oggetto-nastro-tarantella.png` · `oggetto-erma-giano.png` · `oggetto-candelabro.png` · `oggetto-quaterna.png` · `oggetto-sorbetto.png` · `oggetto-guanto-sfida.png` · `oggetto-mannaia.png` · `oggetto-lancia-michele.png` · `oggetto-castagnola.png` · `oggetto-sanguinaccio.png` · `oggetto-borsellino.png` · `oggetto-piedistallo-mimo.png` · `oggetto-scarpette.png` · `oggetto-ombrello.png` · `oggetto-mantellina.png` · `oggetto-riccio.png` · `oggetto-campanaccio.png` · `oggetto-peperoncini.png` · `oggetto-ex-voto.png` · `oggetto-angelo-cartapesta.png` · `oggetto-obolo.png` · `oggetto-gazza.png` · `oggetto-pupo-paladino.png` · `oggetto-zampognaro.png` · `oggetto-civetta.png` · `oggetto-topolino.png` · `oggetto-lucciola-barattolo.png` · `oggetto-cane-pastore.png` · `oggetto-ciuccio.png` · `oggetto-fuochista.png` · `oggetto-grancassa.png` · `oggetto-zolfo.png` · `oggetto-fuoco-elmo.png` · `oggetto-naso-tartufaio.png` · `oggetto-cilindro-attore.png` · `oggetto-biglietto-bis.png` · `oggetto-cassetta-elemosine.png` · `oggetto-baba.png` · `oggetto-cera-vergine.png` · `oggetto-grani-incenso.png` · `oggetto-ferro-calamitato.png` · `oggetto-porcellino.png` · `oggetto-zecchino.png` · `oggetto-mazzo-portinaio.png` · `oggetto-fiasca-polvere.png` · `oggetto-santa-barbara.png` · `oggetto-rosa-loggione.png` · `oggetto-binocolo.png` · `oggetto-pomodoro-marcio.png` · `oggetto-lunario.png` · `oggetto-luna-pozzo.png` · `oggetto-polizza-monte.png` · `oggetto-bilancia-truccata.png` · `oggetto-indulgenza.png` · `oggetto-doppio-fondo.png` · `oggetto-campana-vetro.png` · `oggetto-moccolo.png` · `oggetto-maschera-porcellana.png` · `oggetto-fiasco-gragnano.png` · `oggetto-tromboncino.png` · `oggetto-tasca-bucata.png` · `oggetto-occhiali-appannati.png` · `oggetto-gatto-nero.png` · `oggetto-specchio-rotto.png` · `oggetto-miele-rappreso.png` · `oggetto-iettatore.png` · `oggetto-tarlo.png` · `oggetto-carlino-falso.png` · `oggetto-filo-ingarbugliato.png` · `oggetto-ceppi-galeotto.png` · `oggetto-ruggine.png` · `oggetto-pane-raffermo.png` · `oggetto-zeppola.png` · `oggetto-friarielli.png` · `oggetto-treccia-bufala.png` · `oggetto-limone-sorrento.png` · `oggetto-ragu.png` · `oggetto-rosario-corallo.png` · `oggetto-sigillo-borbone.png` · `oggetto-filo-ferro.png` · `oggetto-croce-comando.png` · `oggetto-dente-lupo.png` · `oggetto-tenaglie.png` · `oggetto-ombra-lunga.png` · `oggetto-bussolotto.png` · `oggetto-cordone-sipario.png` · `oggetto-clessidra.png` · `oggetto-tric-trac.png` · `oggetto-acquasantiera.png` · `oggetto-specchio-camerino.png` · `oggetto-salvadanaio.png` · `oggetto-tazzulella.png` · `oggetto-bacchetta-rabdomante.png` · `oggetto-cilicio.png` · `oggetto-gabbia-cardellini.png` · `oggetto-trampoli.png` · `oggetto-turibolo.png` · `oggetto-calamita.png` · `oggetto-calza-befana.png` · `oggetto-patto_eco.png` · `oggetto-patto_fame.png` · `oggetto-patto_trenta.png` · `oggetto-patto_luna_nera.png` · `oggetto-patto_nodo.png` · `oggetto-patto_candela.png` · `oggetto-lanterna_munaciello.png` · `oggetto-tombola_piena.png` · `oggetto-corona_latta.png` · `oggetto-presepe_intero.png` · `oggetto-occhio_lucia.png`

Per i famigli a tempo e i pastorelli (8×8): `famiglio-cardellino.png`, `famiglio-pastorello.png`.
Colpi: `colpo-oro.png` (critici, caricati, quinto colpo), `colpo-ombra.png` (eco dell'Ombra Gemella).
Tavola delle icone attuali: `production/qa/evidence/teatro-oggetti200-icone-nuove.png`.
