# Ferruccio: Una Notte a Caserta — Bibbia degli oggetti

Statistiche, colpo, catalogo, sinergie e regole del sistema oggetti, ora che Ferruccio spara di base.

| | |
|---|---|
| Versione | 1.0 — 1 novembre 2026 |
| Stato | Documento di riferimento per il sistema oggetti della PARTE 1; sostituisce §2.1 (statistiche) e §2.6 del concept 1.0 e va letto con `concept.md` 1.1 |
| Decisione che lo origina | Ferruccio **spara una scintilla alla volta** come le lacrime di Isaac (mira separata dal movimento, auto-fuoco a cadenza); l'affondo dello stocco resta come **colpo forte a contatto**, secondario; la parata resta innata in Ferruccio e diventa oggetto (Fibbia della guardia) o flag (`scudo`) per gli altri |
| Fonti | `design/isaac-web/concept.md` (§0, 2.1, 2.4, 2.6-2.9, 4.1, App. A), `design/narrative/ferruccio-bibbia.md` (§IV, VII, IX, X, XII, XVI), `src/data/tuning.json`, `src/assets/art/items/` (18 icone), wiki ufficiale di The Binding of Isaac: Repentance (bindingofisaacrebirth.wiki.gg, pagine citate in fondo a ogni sezione), IsaacDocs (`TearFlags`, `WeaponType`) |
| Notazione | virgola decimale (3,50); i numeri di Isaac sono della versione **Repentance / Repentance+**; `U` = somma dei delta di Danno dentro la radice, `T` = somma dei delta di Fiato, `n` = numero di colpi per raffica |
| Fasi | **[MVP]** = settimana 14 (Capitolo 1), **[P1]** = Parte 1 completa (settimane 15-26, Capitoli 2-3) |
| Sezioni | 1 Isaac · 2 Il motore di Ferruccio · 3 Catalogo (154 voci) · 4 Sinergie, anti-sinergie, build · 5 Regole e curve · 6 Appendice: `items.json` e codice |

---

## Che cosa cambia rispetto al concept 1.0

1. **Verbo base**: scintilla a 2,73 colpi/s (cap 5/s), direzione separata dal movimento (frecce / levetta destra / mouse / seconda levetta touch). L'affondo (J) fa **3×Danno a contatto ogni 0,56 s**, riceve le flag di stato, non viene mai sostituito. La "flag `scintilla`" del concept non esiste più.
2. **Statistiche**: Danno decimale con la radice di Isaac (`3,5·k·√(1,2U+1)`), base **3,50**; Fiato (cadenza), Misura (gittata), Slancio (velocità del colpo), Passo, Sorte, Maschere; più sette stat secondarie (affondo, scatto, parata, rilevamento, volo). Gli HP dei nemici si riscalano (comuni ×3,5, boss 400/550/600/750).
3. **Modello del colpo**: arma base + 10 sostituti a priorità intera + 23 flag in bitset (14 all'MVP) + 10 modificatori di numero + 2 trasformazioni del profilo + trigger + 4 classi di famigli; `fusions.json` per le coppie dichiarate; `Stats.resolve()` pura a fasi fisse.
4. **Catalogo**: 154 voci (80 [MVP] + 74 [P1]) al posto dei 45 del concept; ogni pool dell'MVP ha almeno 6 voci di peso a profilo nuovo; ogni flag, arma e caso speciale citato ha una riga.
5. **Economia delle braci**: +2 per stanza liberata, +4 per boss/Caserma, nessuna brace per nemico; attivi da 1 a 8 braci.

## Revisione applicata

Il revisore ha trovato 5 problemi gravi, 19 medi e 6 lievi. Tutti i gravi e i medi sono applicati; dei lievi ne restano fuori due, dichiarati qui.

| # | Problema del revisore | Esito | Dove |
|---|---|---|---|
| G1 | `palla_cannone` citato 9 volte e inesistente | applicato: voce [MVP] q4, Pegni 0,5 · Segreta 0,2, flag `persistente` innata, `excl_pool` con l'Otre bucato | §3.A, §4 #19-20 |
| G2 | braci: 6,5 a stanza, Mantice = 1 maschera a stanza | applicato **con variante**: +2 per stanza, +4 per boss, 0 per nemico (≈48 braci a run); Mantice del fabbro a **6 braci** (non 4: con 4 la cura attesa a run sale a 13-16 maschere, con 6 resta a 11-12); Campana 8 braci; Brace della vendetta +1 ogni 5 uccisioni; Fazzoletto blu +1 = +50% | §3.J, §5.6 |
| G3 | pool MVP vuote a profilo nuovo | applicato: Boss 8,5 di peso (Pastiera, Soffio della forgia, Fiasco, Furia, Occhi di gatto sbloccati di base), Edicola 6,2 (Candele, Mantello, Tarallo, Aureola), Segreta 5,4 (Otre, Sprone, Piastra), Pegni 8,5 (Anello, Ultima maschera, Settima vita); Baule fuso nella Fucina; regola "nessuna pool MVP sotto 4 di peso / 6 voci". **Non applicato**: Sguardo della Madre nel Boss MVP (sarebbe una 15ª flag; il Boss arriva a 8,5 senza) | §3, §5.3 |
| G4 | tre definizioni di MVP | applicato: un solo manifesto (14 flag, 3 sostituti + affondo + scintilla, 4 multishot, 2 trasformazioni, 10 casi speciali); sinergie e build ri-taggate; criterio S5-6 riscritto | §3.0, §4, §5.11 |
| G5 | Foglia della Villa = invulnerabilità da fermo | applicato: solo invisibilità, si rompe sparando/guidando, famigli e orbitali dormono; anti dichiarata con la Lucciola | §3.I, §4.2 |
| M1 | clausole "seconda copia" | applicato: cancellate; +1 U solo per flag innate (Spola+fili, Pistola+perforante, Agnese+Spola); il cap di Fiato si tocca con Lucciole + Soffio della forgia (T 1,7 → 4,8/s) | §2.3, §3 |
| M2 | Raggio+Pistola ×1,5 cumulabile o no | applicato come Isaac: gruppo `x1.5_arma`, cumulabile col Dente del Gatto; ogni op `mul` dichiara `group` | §2.4, §2.13, §6 |
| M3 | due tetti di cadenza (12 e 20) | applicato: un solo set di cap: 15 colpi/s per arma, 20 totali (Fiato·n), 60 proiettili vivi; `S` (Bottone del gendarme) dichiarato "colpi/s fuori cap", deviazione voluta da Isaac | §2.3 |
| M4 | stat e op che il motore non ha | applicato: 7 stat secondarie (`lunge_range`, `dash_cd`, `dash_charges`, `parry_window`, `parry_reflect`, `detection`, `fly`), op `orbital`, `lives`, `player_flag`, `economy`, `set_tag`; Impugnatura rinforzata [MVP] ed Elsa bilanciata [P1] per `lunge_cd`; 4 classi di famigli | §2.1, §2.11, §6 |
| M5 | 17 oggetti e 7 flag orfani | applicato: 16 righe nuove + la Palla (Botto, Alone, Cannone, Serenata, Vino, Calcare, Mascherone di cartapesta, Spillo, Calamita, Pedale della forgia, Fuoco d'artificio, Sguardo storto, Raffica del duellante, Reggia in miniatura, Disegno della Reggia, Impugnatura); regola di coerenza e script di verifica | §3, §5.9, §6.5 |
| M6 | Raggio del Velo al 165% di Brimstone | applicato: tick = **0,6·Danno** (5,4·Danno per raggio, 4,9·Danno/s = 1,8× la scintilla come Brimstone); build 2 e 10, sinergie 1-8 ricalcolate | §2.7, §4 |
| M7 | set Gatto irraggiungibile | applicato: set a scalini: 2 pezzi = richiamo [MVP] (occhi gialli, scatto a 2 cariche), 3 pezzi = trasformazione [P1]; Scarpe silenziose col tag `gatto`; Occhi di gatto sbloccati di base | §3.N |
| M8 | nomi che collidono (5 Mantice, 3 Martello, 3 Lanterna, 3 Maschera) | applicato: Soffio della forgia, Otre bucato, Incudine di Gaetano, Lampione di Piazza Dante, Lampioncino di carta, 'A paura, Nuca dipinta, Sguardo storto, Mascherone di cartapesta; regola "nessun sostantivo comune in più di 2 nomi" | §3, §5.7 |
| M9 | Ombra di Mariella venduta al Banco | applicato: la meccanica (clone 0,75) passa al **Riflesso nella pozzanghera**; Mariella entra come Biglietto di Mariella (ninnolo del Bivio "Taddeo perdonato", bibbia §IX) | §3.E, §3.K |
| M10 | Edicola senza danno | applicato: Aureola della festa [MVP], Giglio d'oro della Madonnina e Luce della Madonnina [P1]; Fiocco del Velo a peso 0,5 | §3.O |
| M11 | Boss pool al 27% di cure | applicato: Pane cafone solo fallback; Fiasco, Soffio, Polvere, Lente nel Boss; 3 cure pure su 19 a P1 | §3.G, §5.3 |
| M12 | Martello del calcare = affondo caro | applicato: 6 braci, 10×Danno in 120 px, stordisce 0,8 s, pietra ×2, rompe muri | §3.J |
| M13 | Lampioncino a 52 DPS | applicato: 6 danni × 4/s = 24 DPS; regola "orbitali ≤ 2,5× la scintilla base"; Sfere e Coccarda a 24 | §3.F, §5.7 |
| M14 | Otre+brace, Otre+Gaetano, Ferro+brace | applicato: esplosione della brace mai sopra il 25% e mai più di un autodanno ogni 2 s; raggi e pistola non la innescano; riga `contatto` dell'Otre (Danno ×0,5, ricarica ÷2); tre anti dichiarate | §2.8, §2.14, §4.2 |
| M15 | 9 oggetti di stat a pick zero | applicato: delta sprecato (oltre il clamp o ignorato dall'arma) = +0,5 U; Sprone del cocchiere da SET a +0,5 Passo e ricarica dello scatto −50% (non 0: lo scatto ha i-frame); Misura sul Raggio = lunghezza del raggio | §2.4, §3.A |
| M16 | 31 oggetti effettivi all'MVP | applicato: 80 voci [MVP], 55 pescabili a profilo nuovo (17% del catalogo a run); clone e set completo a P1 | §3.0 |
| M17 | 8 oggetti MVP del concept spariti | applicato: Disegno, Reggia in miniatura, Lettera con spago, Lettera sigillata, Sciarpa annodata, Impugnatura, Scatola musicale tornano [MVP] | §3 |
| M18 | un solo ramo per Bivio premiato | applicato: Biglietto di Mariella, Medaglione muto, Cenere del registro, Telaio di Agnese | §3, §5.3 |
| M19 | 20% di sigilli senza serrature | applicato: tabella dei drop 22 / 8 / 15 / 20 / 10 / 15 / 5 / 5 con il pickup **Favilla** (+3 braci); sigilli attesi 4,7 contro 4-5 usi | §5.5 |
| L1 | sviste numeriche (7) | applicato (Eco 5,2/s a Fiato base, Stoccata 62,7, ciclo del Raggio 1,1 s, jackpot 284 DPS, Fucina 1 oggetto per piano, champion rosso HP ×2, Sorte sui drop +3%/punto a maschera). **Parziale**: le tabelle restano scritte a mano; lo script unico (`tools/items_calc.py`) nasce con `items.json` (§5.9) | §4, §5 |
| L2 | nove vite → sette | applicato: Settima vita del Gatto | §3.G |
| L3 | lore 1845 (tricorno, pistola d'ordinanza, due carrozze, micro-lore non marcata) | applicato per pistola da viaggio, Carrozza di Violante / Sprone del cocchiere; **non applicato** il Bicorno: resta il Tricorno (tre punte = tre colpi) con la lore corretta "fuori ordinanza da mezzo secolo"; la colonna `canon` diventa l'elenco delle 9 micro-lore Provisional in §3.0 (le tabelle hanno già 8 colonne) | §3 |
| L4 | due sorgenti di brace, trio dei 40 danni, Giostra q0 | applicato: la Lanterna del lanterniere fa solo la pozza; Giostra q2; il trio resta dopo la riforma delle braci | §3 |
| L5 | Carbone e Stoccata sul Raggio | applicato: Carbone sul raggio cap +120%, Stoccata sul raggio ×4 | §2.8 |
| L6 | pool Baule | applicato: fusa nella Fucina | §5.3 |
| — | "manca da Isaac" (16 voci) | applicate: 12 Smorfia, Cambiale di sangue, Polvere della Santabarbara, Edicola offensiva, 4 classi di famigli. In backlog (§5.10): secondo slot ninnolo, Pianta del Vanvitelli, randomizzatori di stat, copia del consumabile, armatura a pezzi (4° set), rimedio alle curse, Anti-Gravity, creep | §5.10 |

---

## 1. Come funziona in Isaac (Repentance)

Riassunto di ciò che serve a Ferruccio. Fonte: wiki ufficiale `bindingofisaacrebirth.wiki.gg`, colonna Repentance; dove il numero non è sulla wiki lo dico.

### 1.1 Le sette statistiche

| Stat | Base (Isaac) | Min | Max / cap | Passo tipico di un oggetto | Formula / nota |
|---|---|---|---|---|---|
| Danno | 3,50 (× moltiplicatore del personaggio: Eve 0,75, Cain 1,2, Judas 1,35, Azazel 1,5) | nessuno (Soy Milk: 0,70) | nessuno (Money = Power si ferma a +3,96) | +0,3 / +0,5 / +1 / +1,5 dentro la radice; flat +1 (Sacred Heart), +2 (Curved Horn), +4 (Polyphemus); ×1,5 / ×2 / ×2,3 / ×0,8 / ×0,2 | `Danno = (3,5·k·√(1,2·U+1) + F) × M`; U = somma degli "up", F = flat fuori radice, M = prodotto dei moltiplicatori. Rendimento decrescente: il primo +1 vale +1,69, il terzo +1,06 |
| Lacrime (cadenza) | T = 0 → tear delay 10 → **2,73 colpi/s** | T = −1,9 (Keeper) → 1,06/s | **delay 5 a T = 1,816 → 5,0/s**; oltre solo i moltiplicatori diretti (Soy Milk ×5,5 = 15/s) | +0,35 (pillola), +0,5, **+0,7** (Sad Onion); ×0,42 / ×0,51 / ×1/3 / ×5,5 | `delay = 16 − 6·√(1,3·T+1)` per 0 ≤ T ≤ 1,816; `colpi/s = (30/(delay+1) + S) × P` |
| Gittata | 6,5 caselle (Cain/Azazel 4,5, Esau 8) | 1,0 | nessuno | **+2,5** (Mom's Underwear), +3,75 (Mom's Lipstick) | distanza pura dal 2021 (prima era tempo di volo) |
| Velocità del colpo | 1,0 = **7,5 caselle/s** (1 casella ogni 4 tick) | 0,6 | nessuno | +0,16 / +0,2; −0,15 … −0,3 | lineare; più alta = più knockback |
| Velocità | 1,0 (Magdalene 0,85, Cain 1,3) | 0,1 | **2,0** | **+0,3** (The Belt), +0,2, +0,15, +0,1; −0,2 / −0,3; Pony SET 1,5 | nessun moltiplicatore esiste |
| Fortuna | 0 (Keeper −2, Jacob +1) | nessuno | nessuno; **clamp 0-10 per i drop** | **+1** (Lucky Foot), +2 (Evil Charm), +10 (Perfection) | le proc degli oggetti sono `1/(N − k·L)`: Tough Love 10% → 100% a L 9, Common Cold 25% → 100% a 12, Mom's Eye 50% → 100% a 5 |
| Altezza del colpo | 23,75 | 5,0 | nessuno | +8, ×2, −18 | secondaria: non tocca più la gittata; non la implementiamo |

Esempi: Isaac + 1 Pentagram = 3,5·√2,2 = 5,19; + Cricket's Head (+0,5 e ×1,5) = 3,5·√1,6·1,5 = 6,64; + Polyphemus = (3,5+4)·2 = 15,0. Cadenza: Sad Onion → 3,44/s; due Sad Onion → 4,33/s; al cap 5,0/s.
Fonti: https://bindingofisaacrebirth.wiki.gg/wiki/Damage · /wiki/Fire_rate · /wiki/Range · /wiki/Shot_Speed · /wiki/Speed · /wiki/Luck · /wiki/Tear_Height · /wiki/Attributes

### 1.2 Personaggi

Isaac è il medio (3 cuori, 3,50, 2,73/s, 6,5, 1,0, 1,0, 0, The D6). Gli altri si differenziano con **un** numero forte più un oggetto di partenza: Cain velocità 1,3 e gittata 4,5; Judas 1 cuore e Danno ×1,35; Magdalene 4 cuori e velocità 0,85; Azazel Danno ×1,5 e Brimstone corto; The Lost zero vita e Holy Mantle; Keeper 2 cuori-moneta, T −1,9 e tripla lacrima. È lo schema di Ferruccio / Gaetano / Agnese del concept e regge.
Fonte: https://bindingofisaacrebirth.wiki.gg/wiki/Characters

### 1.3 Come si sommano gli oggetti

- Ogni oggetto porta **delta additivi** per stat; i **moltiplicatori** sono una classe separata applicata dopo la somma; infine i **clamp**. Il ricalcolo avviene a ogni cambio d'inventario, non per frame.
- **Gruppi che non si cumulano**: {Cricket's Head, Magic Mushroom, Belial+Martyr} valgono un solo ×1,5; {Hallowed Ground, Immaculate Heart, Star of Bethlehem} un solo ×1,2. Fuori dai gruppi i moltiplicatori si moltiplicano (Sacred Heart ×2,3 × Mascara ×2).
- **Ordine del Danno** (17 passi sulla wiki, 6 che contano): radice sugli up → Polyphemus (+4 e ×2) → flat → moltiplicatori "buoni" (×1,5, ×2,3) → moltiplicatori "di trasformazione" (20/20 ×0,8, Soy Milk ×0,2, Mascara ×2) → combo d'arma.
- **Tre eccezioni che il pubblico riconosce**: **Soy Milk** (cadenza ×5,5, Danno ×0,2: non "aumenta" ma cambia il profilo; Lump of Coal, che è flat post, ignora il ×0,2); **Polyphemus** ((Danno+4)×2, cadenza ×0,42, la lacrima che uccide prosegue col danno residuo; con un multishot il ×2 sparisce e il +4 diventa +5 flat, e la penalità di cadenza non si somma); **Cricket's Head** (+0,5 dentro la radice e ×1,5 non cumulabile con Magic Mushroom).
- **Multishot**: 20/20 = 2 lacrime, ×0,8, nessuna penalità di cadenza; Inner Eye = 3 lacrime, cadenza ×0,51; Mutant Spider = 4, ×0,42. Insieme: le lacrime si sommano (Inner Eye + Spider = 5), la penalità vale **una sola volta** e 20/20 la cancella; tetto 16 per raffica.
Fonti: /wiki/Damage · /wiki/Soy_Milk · /wiki/Polyphemus · /wiki/Cricket%27s_Head · /wiki/20/20 · /wiki/The_Inner_Eye · /wiki/Mutant_Spider

### 1.4 Il colpo: armi, flag, numero

- **Armi**: l'entità lacrima ha due campi distinti, `WeaponType` (15 tipi) e `TearFlags` (128 bit). I sostituti d'arma seguono una gerarchia quasi totale — Spirit Sword ≳ Epic Fetus > C Section > Dr. Fetus > Mom's Knife > Tech X > Ludovico > Brimstone > Technology > Monstro's Lung > lacrime — ma con ~40 coppie scritte a mano come **fusioni** invece che override (Brimstone + Technology ×1,5 cumulabile con Cricket's Head; Knife + Brimstone; Ludovico + Brimstone; Tech X + Brimstone). Ogni pagina della wiki ha tre sezioni fisse: *overrides*, *overridden by*, *stat effects only*.
- **Numeri delle armi**: Brimstone = raggio caricato, tick ogni 4 frame, 9 tick in 0,63 s, danno per tick = `Danno × cadenza ÷ 5` (a 2,73/s ≈ 0,55·Danno, cioè ≈ 1,8× il DPS delle lacrime), cadenza ÷3; Technology = laser istantaneo perforante, cadenza piena; Mom's Knife 2× in mano e 6× lanciato; Dr. Fetus bombe 10× a cadenza ×0,4; Epic Fetus 20× dall'alto; Monstro's Lung 14 lacrime per carica a cadenza ÷4,3; Tech X anello 25% → 100% con la carica; Ludovico una lacrima guidata.
- **Flag**: un bitset di 128 bit; tutte si sommano liberamente (OR) con pochissime esclusioni: Ipecac spegne il perforante (esplode al contatto), Rubber Cement vince sullo spettrale, Loki's Horns sostituisce il proc di Mom's Eye, i boss sono immuni a un secondo status per 8 s. Le proc scalano con la Fortuna.
- **Penalità di cadenza delle armi**: una catena di priorità, non un prodotto: Dr. Fetus + Lung ×1/4,3 > Dr. Fetus ×0,4 > Brimstone ×1/3; Lung e Ipecac si sommano solo senza Brimstone/Dr. Fetus; Soy Milk ×5,5 per ultimo.
- **Famigli**: due classi: cloni che copiano arma+flag+stat in scala (Incubus 75%, Twisted Pair 2 × 37,5%) e famigli a danno fisso (Brother Bobby 3,5 a 1,9/s).
Fonti: /wiki/Brimstone · /wiki/Technology · /wiki/Mom%27s_Knife · /wiki/Dr._Fetus · /wiki/Epic_Fetus · /wiki/Monstro%27s_Lung · /wiki/Tech_X · /wiki/Ludovico_Technique · /wiki/Spirit_Sword · /wiki/Ipecac · /wiki/Tear_Effects · /wiki/Status_Effects · /wiki/Incubus · https://wofsauge.github.io/IsaacDocs/rep/enums/TearFlags.html

### 1.5 Salute

Unità = mezzo cuore; un colpo = **½ cuore nei capitoli 1-3, 1 cuore dal 4°** (Womb). Tetto **12 cuori** (rossi + anima + neri). Rossi = contenitori ricaricabili; **anima** (blu) in coda, consumati prima dei rossi, non ricaricabili, perderli non conta come danno per la porta del diavolo; **neri** come l'anima ma all'ultimo mezzo fanno 40 danni alla stanza; **eterni** (mezzi: due nello stesso piano = +1 contenitore); ossa, dorati, marci, spezzati sono rifiniture. Patto col diavolo: 1-2 contenitori (3 cuori d'anima se non ne hai); porta: 1% + 99% piano senza danno rosso + 35% boss senza danno, ×0,5 se vista nel piano prima; Angelo al 50% se non hai mai pagato. Invulnerabilità dopo il colpo ≈ 1 s (non quotata dalla wiki).
Fonti: /wiki/Health · /wiki/Hearts · /wiki/Soul_Heart · /wiki/Devil_Room · /wiki/Angel_Room

### 1.6 Economia e cariche

- **Tiro a fine stanza**: `r = rand(); r += rand() × clamp(L,0,10) × 0,1` → < 0,22 nulla · 0,22-0,30 carta/pillola/ninnolo · 0,30-0,45 moneta · 0,45-0,60 cuore · 0,60-0,80 **chiave (20%)** · 0,80-0,95 bomba · > 0,95 baule. La fortuna spinge verso i bauli, non verso i cuori.
- **Prezzi**: oggetto 15 monete (alcuni attivi 10), cuore rosso 3, anima/bomba/chiave/pillola/carta/batteria 5; tetto 99 monete; bomba = 100 danni; chiave: tesoro gratis solo al primo piano della run.
- **Cariche**: +1 per stanza con nemici (2 nelle stanze doppie), barre da 1-2-3-4-6-12 stanze (Yum Heart 4, Necronomicon 6, D6 6); Lil' Battery +6, Micro +2; The Battery = 1 uso extra.
Fonti: /wiki/Room_Clear_Awards · /wiki/Coins · /wiki/Keys · /wiki/Bombs · /wiki/Batteries · /wiki/Active_item · /wiki/Shop

### 1.7 Pool, qualità, oggetti speciali

- Repentance: **719 collezionabili** (547 passivi, 171 attivi), 188 ninnoli, 66 carte + 28 rune, 50 pillole, 15 trasformazioni. Rebirth partiva da 341.
- **24 pool** di dimensione diversa: Tesoro ≈ 410, Diavolo 96, Bottega 96, Angelo 66, Boss 65 (tutti passivi), Segreta 67, Planetarium 11. Regole: **toccato = tolto da tutte le pool**; visto e lasciato = peso ridotto; pool vuota → Tesoro → Breakfast.
- **Qualità 0-4** nascosta, ≈ 10 / 30 / 31 / 24 / 5 %, **non pesa** le pool normali: serve ai reroll speciali (Sacred Orb, Tainted Lost, Bag of Crafting).
- **Special items** (q4 e simili): dopo averne visto uno nella run il successivo è rerollato al 50%, poi 90%, poi 98%.
- Consumo: 15-20 oggetti per run su 341-719 (4,4% del catalogo a run).
Fonti: /wiki/Items · /wiki/Item_Pool · /wiki/quality · /wiki/Special_item · /wiki/Transformations

### 1.8 Sinergie: che cosa funziona e perché

- McMillen (postmortem 2012, interviste 2014-2021): **circa il 70% degli oggetti si somma** con tutto senza codice dedicato; mistero alla Zelda (nessuna descrizione la prima volta); la fortuna è un convertitore di probabilità in certezza; premio al gioco pulito (porta del diavolo).
- Le sinergie amate sono di quattro tipi: **un'arma riceve una flag che non aveva** (Brimstone + homing), **due armi si fondono invece di escludersi** (Knife + Brimstone), **una penalità viene cancellata** (20/20 + Polyphemus), **un flat aggira un moltiplicatore** (Lump of Coal + Soy Milk).
- Le anti-sinergie sono gestite con quattro strumenti: lasciar moltiplicare (i numeri puniscono, la wiki avverte), caso speciale (Soy Milk + Brimstone divenne un raggio continuo in Repentance), override con stat salve, protezione alla sorgente (special items, qualità, Black Candle come cura di Cursed Eye).
- Confronto: Gungeon ha 350-500 sinergie **esplicite** con freccia azzurra, nome e Synergy Chest; Hades ha i duo con prerequisito da entrambi gli dei, uno slot per capacità, non potenziabili, e la Pool of Purging per sbarazzarsi di un dono; Nuclear Throne offre 1 mutazione su 4 a ogni livello, tetto 9.
Fonti: https://www.gamedeveloper.com/business/postmortem-mcmillen-and-himsl-s-i-the-binding-of-isaac-i- · https://enterthegungeon.wiki.gg/wiki/Synergies · https://www.supergiantgames.com/blog/hades-the-blood-price-update-patch-notes · https://www.gamedeveloper.com/design/roguelike-item-orthogonality · /wiki/Cursed_Eye

### 1.9 Che cosa serve davvero a Ferruccio (e che cosa no)

Essenziale: mira separata e auto-fuoco con cadenza a rendimento decrescente e cap visibile; Danno decimale con la radice; moltiplicatori separati dai delta con gruppi di non-cumulo e 2-3 trasformazioni del profilo; flag componibili con la regola del multishot a penalità unica; gittata e velocità del colpo come stat vere; vita a mezze unità in due colori; tiro a fine stanza con 4 valute e carica dell'attivo per stanza; pannello delle stat sempre visibile.
Rinviabile: altezza del colpo; fortuna esponenziale (basta la lineare in 12 minuti); 12 tipi di cuore oltre rossi/cera; sovraccarica e attivi a tempo; raffiche a 16; tacche del menu; i 17 passi dell'ordine del danno; monete speciali; livelli della bottega.

---
## 2. Il motore di Ferruccio

Scelta di fondo: le **formule di Isaac restano identiche** (così ogni numero della ricerca resta valido e chi arriva da Isaac legge il pannello al volo); la curva di una run da 12 minuti si fa più ripida alzando i delta degli oggetti di ×1,5, togliendo quasi tutta la qualità 0-1 dalle pool e rendendo il cap di Fiato raggiungibile con 2-3 oggetti. Gli HP dei nemici si riscalano di conseguenza (§5.8).

### 2.1 Le statistiche

Nomi dalla scherma e dalla forgia. Id interni in inglese per `runs_log.jsonl`. Il pannello mostra le prime sette; le secondarie compaiono solo quando un oggetto le tocca.

| Stat (HUD) | id | Significato | Base Ferruccio | Min | Max / cap | Passo tipico (già ×1,5 rispetto a Isaac) | Unità nel motore |
|---|---|---|---|---|---|---|---|
| **Danno** | `damage` | danno di una scintilla; l'affondo fa 3× | **3,50** | nessuno (Otre bucato: 0,70) | nessuno (tetto pratico ≈ 13 a U = 10) | +1,5 U (q2), +2,0 U con malus (q3), +0,5 U e ×1,5 (q4); flat +2 pre / +2 post | float, 2 decimali |
| **Fiato** | `tears` | cadenza delle scintille (il mantice della forgia) | T = 0 → delay 10 → **2,73 colpi/s** | T = −1,9 → 1,06/s | **T = 1,816 → 5,0/s**; poi solo moltiplicatori; **cap per arma 15/s, totale 20/s** | +0,7 T (q2), +1,0 T (q3), ±0,35 (boccette); ×0,42 / ×0,51 / ×1/3 / ×5,5 | T sommato; l'HUD mostra colpi/s e "MAX" al cap |
| **Misura** | `range` | gittata della scintilla; lunghezza del Raggio del Velo | 6,5 caselle = 416 px | 2,0 | 13,0 (larghezza della stanza) | +2,5 (q2), +3,75 (q3); −1,5 come malus | caselle da 64 px; vita del colpo = Misura/(7,5·Slancio) s = 0,87 s base |
| **Slancio** | `shot_speed` | velocità della scintilla | 1,0 = 7,5 caselle/s = **480 px/s** | 0,6 | 2,0 | +0,16 / +0,2 / +0,3; −0,25 / −0,3 | float |
| **Passo** | `speed` | velocità di Ferruccio | 1,0 = 270 px/s | 0,6 | 1,6 (432 px/s; il 2,0 di Isaac è ingiocabile in 13×7) | +0,3 (q2), +0,15, +0,1; −0,1 / −0,2 | nessun moltiplicatore, come Isaac |
| **Sorte** | `luck` | fortuna | 0 (Agnese +1) | −3 | nessuno; **clamp 0-5 per i drop** | +1 (Medaglione di Rosa), +2 (Corno rosso), +10 condizionato (Ferro di cavallo) | int; le proc usano max(Sorte, 0); Sorte negativa dimezza la base della proc |
| **Maschere** | `hp` | vita | 5 contenitori (10 mezze) | 1 contenitore | **12** (rosse + cera + carbone) | +1 contenitore (q2-q3), +2 raro | mezze maschere |
| Tempo dell'affondo | `lunge_cd` | ciclo dello stocco | 0,56 s (0,06 startup + 0,26 colpo + 0,24 pausa) | 0,33 s | 0,56 s | −15% (Impugnatura rinforzata), −25% (Elsa bilanciata) | s |
| Portata dell'affondo | `lunge_range` | arco dello stocco | 65-110 px | — | +45% | +30% (Targa degli operai), +15% (Elsa) | px |
| Ricarica dello scatto | `dash_cd` | | 0,55 s | 0,25 s | — | 0,40 (Tempra degli stivali), −50% (Sprone del cocchiere) | s |
| Cariche di scatto | `dash_charges` | | 1 (Agnese 2) | 1 | 2 | +1 (richiamo del Gatto) | int |
| Finestra di parata | `parry_window` | | 0,18 s (Ferruccio); 0 = nessuna parata | 0 | 0,30 s | 0,22 (Fibbia della guardia: dà la parata a chi non ce l'ha) | s |
| Riflesso di parata | `parry_reflect` | danno del proiettile rimandato | ×2 | ×2 | ×3 | ×3 (Fibbia) | mult |
| Rilevamento | `detection` | con quale probabilità i nemici ti notano | 100% | 35% | 100% | 70% (Lembo di Velo), 50% (Maschera di Pulcinella), 0% da fermo (Foglia della Villa) | % |
| Volo | `fly` | passi sopra buche e ostacoli (non i muri) | no (Bianca sì) | — | — | Mantello del Munaciello, set Gatto a 3 pezzi | bool |
| Altezza del colpo | — | **non implementata** | — | — | — | — | — |

**Basi dei personaggi** (schema Isaac: un numero forte + un oggetto di partenza; §1.2):

| | Maschere | Danno (k) | Fiato | Misura | Slancio | Passo | Sorte | Arma / regola |
|---|---|---|---|---|---|---|---|---|
| **Ferruccio** | 5 | 3,50 (×1,00) | 0 | 6,5 | 1,0 | 1,0 | 0 | scintilla + affondo + scatto + **parata innata** (0,18 s, ×2); attivo di partenza **Mantice del fabbro** (6 braci → 1 maschera); vede tutti i Bivi |
| **Gaetano** | 6 | 4,20 (×1,20) | 0 | — | — | 0,85 | 0 | **Martello del fabbro** (priorità 100, contatto: 3×Danno = 12,6 in area 90 px, 1 colpo ogni 1,2 s × 2,73/Fiato, min 0,6 s); rompe muri e ostacoli gratis; immune al knockback; no scatto, no parata; Fucina −20% |
| **Agnese** | 3 | 2,98 (×0,85) | 0 | 5,0 | 1,0 | 1,15 | +1 | **Spola d'oro innata** (2 colpi per lancio, `fili` innata); scatto a 2 cariche; no parata; 1 sigillo; i fili ambientali non la feriscono |
| Taddeo [P1] | 4 | 3,50 | −0,3 | ∞ | — | 1,0 | 0 | Pistola di Taddeo innata; 1 sigillo |
| Tonino [P1] | 7 | 3,50 | −0,5 | 6,5 | 1,0 | 0,9 | 0 | Mozzarella infinita (ricarica 60 s); Fucina −30% |
| Bianca [P1] | 0 rosse + 2 cera | 3,50 | +0,35 | 6,5 | 1,0 | 1,1 | 0 | vola; Giglio spezzato innato; Banco gratis |

### 2.2 Il Danno (radice di Isaac, base 3,5)

```
U   = somma dei delta "add" di damage (dentro la radice)          Punzone G.F. +1,5
Fp  = flat "pre" (fuori radice, PRIMA dei moltiplicatori)          Spina di ferro +2
M   = prodotto dei moltiplicatori, UNO per gruppo                  x1.5: Dente del Gatto | Anello dei Borbone (vale uno)
                                                                   x1.5_arma: Raggio+Pistola (cumulabile con x1.5, come Isaac)
                                                                   x2_sacro: Giglio d'oro · x2_cond: Fiocco del Velo
                                                                   trasformazione: Otre bucato ×0,2 · multishot: Occhi di gatto ×0,8
Fx  = flat "post" che IGNORANO i moltiplicatori                    Petardo +25, Carbone +0,6/casella, Corno di bue +2, Punzone +2 su pietra
D_base = 3,5 · k · √(max(0, 1,2·U + 1))
D      = ((D_base + Fp) [Palla di cannone: +4 poi ×2, oppure +5 senza ×2 se n > 1]) · M + Fx
```

Tabella di U → Danno (Ferruccio): 0 → **3,50** · 0,5 → 4,43 · 1 → 5,19 · 1,5 → **5,86** · 2 → 6,45 · 2,5 → 7,00 · 3 → 7,51 · 4 → 8,43 · 4,5 → 8,85 · 5 → 9,26 · 6 → 10,02 · 9 → 12,02. Il primo +1,5 U vale +67%, il terzo +16%: è il rendimento decrescente che rende buone sia le run lunghe sia quelle corte.

Perché base 3,5 e non 1,0: con base 1,0 e gatto da 3 HP il primo +1 (→ 1,48) lascia il gatto a 3 colpi; con base 3,5 e gatto da 10 passa da 3 a 2 colpi al primo oggetto. Quindi **HP dei comuni ×3,5** rispetto al concept 1.0, **boss 400 / 550 / 600 / 750** (§5.8).

### 2.3 Il Fiato (tear delay di Isaac, con cap)

```
T = somma dei delta "add" di tears (clamp ≥ −1,9)
delay(T) = 5                                  se T ≥ 1,816
         = 16 − 6·√(1,3·T + 1)                se 0 ≤ T < 1,816
         = 16 − 6·√(1,3·T + 1) − 6·T          se −0,77 < T < 0
         = 16 − 6·T                           se T ≤ −0,77
Fiato (colpi/s) = ( 30 / (delay + 1) + S ) · P
  S = colpi/s aggiunti FUORI dal cap di T (Bottone del gendarme +1,0)          ← deviazione dichiarata da Isaac, dove S sta nel denominatore
  P = prodotto dei moltiplicatori, con due esclusioni:
      (a) catena d'arma: conta solo il moltiplicatore dell'arma che vince la forma
          (Botto ×0,4 > Raggio del Velo ×1/3 > Spola ×0,45 > Mangiafuoco ÷4,3), salvo `keep_rate` in fusions.json
      (b) multishot: fra Tricorno ×0,51, Artiglio ×0,42, Palla di cannone ×0,42 conta UNO solo (il più severo);
          gli Occhi di gatto (doppio) lo cancellano del tutto
      i trasformatori (Otre bucato ×5,5) si moltiplicano DOPO (a) e (b)
Cap: per arma 15 colpi/s · totali Fiato·n ≤ 20 (si riduce il Fiato, mai il numero) · proiettili vivi ≤ 60
```

Valori: T −0,5 → 1,82/s · 0 → **2,73** · +0,35 → 3,07 · +0,7 → 3,45 · +1,0 → 3,80 · +1,4 → 4,33 · +1,7 → 4,80 · +1,816 → **5,0**. Il cap si tocca con Lucciole della Villa (+0,7) + Soffio della forgia (+1,0) + una boccetta: raro ma possibile in 12 minuti. Oltre il cap contano solo Bottone (S) e Otre (×5,5: 15,0/s a T = 0, il cap per arma).

### 2.4 Ordine di applicazione (fasi fisse, indipendente dall'ordine di raccolta)

1. **Base del personaggio** (k e basi della tabella).
2. **ADD**: somma dei delta per stat (U, T, Misura, Slancio, Passo, Sorte, contenitori, secondarie), compresi i +1 U delle flag duplicate/innate e i +0,5 U delle flag ignorate dalla forma.
3. **SET**: valori fissi (nessuno all'MVP; riservato) sovrascrivono la somma della loro stat.
4. **CLAMP-1**: Passo 0,6-1,6; Slancio 0,6-2,0; Misura 2-13; T ≥ −1,9; contenitori 1-12. **Ogni oggetto il cui delta viene tagliato dal clamp riceve +0,5 U** (pick mai a zero: due +0,3 di Passo saturano, il terzo vale +0,5 U).
5. **ARMA**: forma vincente (priorità + fusioni); moltiplicatori d'arma di danno e cadenza (catena esclusiva); **ogni oggetto di Misura/Slancio ignorato dall'arma vincente (Pistola) riceve +0,5 U**.
6. **FLAT-PRE** → **Palla di cannone** (+4/×2 o +5) → **MUL** (un valore per gruppo) → **FLAT-POST**.
7. **COUNT**: n = min(16, 1 + Σ count_add); Danno ×0,8 se c'è un doppio; una sola penalità di cadenza.
8. **FLAGS**: OR dei bit degli oggetti ∪ innate dell'arma − `ignores` della forma; le proc per Sorte si tirano per colpo, non qui.
9. **TRIGGER**: gli effetti temporanei attivi sono altre liste di op che rientrano nelle fasi 2-7 e provocano un nuovo `resolve()`.
10. **Per colpo** (nel codice dell'arma): carica, modulazione in volo (Stoccata corta, Carbone), impatto (status con immunità dei boss, divisione, esplosioni), famigli cloni = Build × k.

### 2.5 Salute: maschere in quattro materiali

| Tipo | Equivalente Isaac | Regola | Da dove |
|---|---|---|---|
| **Maschere** (rosse; la metà è la "maschera incrinata") | cuori rossi | contenitori 1-12, si ricaricano con i pickup (½ e 1), si guadagnano con oggetti (+1), si perdono al Banco (−1/−2 di massimo, mai sotto 1) | drop 20%, boss 1 piena, Fucina 3 cent la mezza, Mozzarella |
| **Maschere di cera** (blu, dalle candele dell'Edicola) | cuori d'anima | in coda, consumate PRIMA delle rosse, non ricaricabili; perderle non conta come danno per la porta del Banco/Edicola; moneta del Banco quando non hai contenitori (3 di cera = 1 oggetto) | Edicola, 7% dei drop maschera, Fucina 5 cent, Smorfia 8 e 85 |
| **Maschere di carbone** (nere) [P1] | cuori neri | come la cera; quando l'ultima mezza si consuma: **40 danni** a tutta la stanza | Banco, set Ratking |
| **Maschera d'oro** (mezza) [P1] | cuore eterno | sempre mezza; 2 nello stesso piano o 1 portata al piano dopo = +1 contenitore; brucia al primo danno rosso | Edicola, 1,8% dei drop maschera |
| Colpo subito | | **½ maschera** per qualunque colpo nel Capitolo 1; 1 intera dal piano 7 (Notte intera), come il Womb | https://bindingofisaacrebirth.wiki.gg/wiki/Health |
| Invulnerabilità | | 1,3 s (`hurt_iframes`); da misurare nel log: obiettivo 6-10 colpi subiti per run completa; se di più, 1,0 s | |
| Tetto | | rosse + cera + carbone ≤ 12 contenitori; l'oro non conta | |

### 2.6 La scintilla base e l'affondo

- **Scintilla**: proiettile tondo luminoso (ambra `#ffc878`, nucleo bianco), 24 px visivi, hitbox r = 10 px; scala visiva `1 + 0,06·(Danno − 3,5)` fino a ×2; scia di 3 particelle; 480 px/s × Slancio in linea retta; vive `Misura/(7,5·Slancio)` s e cade a 6,5 caselle; passa sopra le buche, si spegne su ostacoli (salvo `spettrale`) e muri. Mira separata dal movimento: tastiera frecce (8 direzioni), pad levetta destra 360°, mouse 360°, touch seconda levetta. Auto-fuoco: primo colpo immediato, poi 1/Fiato. Impatto: danno = Danno, knockback `K = 1,7 · massa_colpo / massa_nemico` (cavaliere e champion grigio immuni), un bersaglio per scintilla salvo `perforante`.
- **Affondo** (J / X / pulsante grande): 65-110 px, 0,06 s di startup + 0,26 s di colpo + 0,24 s di pausa = 0,56 s; danno **3×Danno** (10,5 a base: un gatto in un affondo, una guardia in due), knockback ×2; riceve tutte le flag di **stato** (fili, brace, veleno, paura, incanto, pietra, confusione) e `perforante` (colpisce tutti nei 110 px); ignora le flag di traiettoria (+0,5 U ciascuna); `inseguitrice` = aggancio di 1 casella; `a_bruciapelo` = ×1,5 fisso. È la "swing" della Spirit Sword: **priorità −1, mai sostituito**, convive con qualunque arma.
- **Scatto e parata**: invariati dal concept (640 px/s × 0,16 s, ricarica 0,55 s, invulnerabile; parata 0,18 s, ricarica 0,6 s, riflesso ×2, 0,3 s di i-frame). La parata è innata **solo in Ferruccio**: per gli altri arriva con la Fibbia della guardia o con la flag `scudo` (parata a distanza).

### 2.7 Sostituti d'arma: 5 forme, 11 armi, priorità intera

Ogni arma dichiara una **forma**; le flag si traducono per forma (23 × 5 = 115 celle), non per arma, e l'arma può sovrascrivere singole celle. Forme: `proiettile` (scintilla, Mangiafuoco, Botto), `raggio` (Pistola, Raggio del Velo, Alone), `lancio` (Spola, Ago), `contatto` (affondo, Martello), `controllato` (Lucciola).

| id | Nome | Modello Isaac | Prio | Forma | Danno | Cadenza | Flag innate | Ignora (→ +0,5 U) | Geometria del numero | Fase |
|---|---|---|---|---|---|---|---|---|---|---|
| `affondo` | Affondo dello stocco | swing della Spirit Sword | **−1** (sempre) | contatto | 3×Danno, 65-110 px | fissa 0,56 s (`lunge_cd`) | — | traiettoria | ogni +1 colpo = secondo affondo a −0,1 s (cap 3) | MVP |
| `scintilla` | Scintilla | lacrima | 0 | proiettile | Danno | Fiato | — | — | ventaglio ±8° per colpo extra | MVP |
| `mangiafuoco` | Mangiafuoco di Piazza Dante | Monstro's Lung | 10 | proiettile caricato | 100% × 14 scintille | Fiato ÷4,3, rilascio a carica piena | — | — | 14 + ⌊2,4·(n−1)⌋, cap 50 | P1 |
| `spola_oro` | Spola d'oro | boomerang | 20 | lancio | Danno, **2 colpi** (andata e ritorno), 5 caselle | Fiato ×0,45 (1,23/s a base) | boomerang, fili | rimbalzante, orbitante | spole a V ±15° | MVP |
| `pistola_taddeo` | Pistola di Taddeo | Technology | 30 | raggio istantaneo | Danno, gittata infinita, knockback 0 | Fiato ×1,0 | perforante | rimbalzante (1 solo rimbalzo), orbitante; Misura e Slancio (+0,5 U) | canne parallele a 12 px | MVP |
| `lucciola_bianca` | Lucciola di Bianca | Ludovico | 35 | controllato | Danno per tick, tick/s = Fiato (cap 10) | n/a | perforante, spettrale | boomerang, divisoria, rimbalzante | +1 lucciola orbitante per colpo extra (cap 4) | P1 |
| `raggio_velo` | Raggio del Velo | Brimstone | 40 | raggio caricato | **tick = 0,6·Danno, 9 tick in 0,6 s** (18,9 per raggio a base = 5,4·Danno) | Fiato ×1/3 (0,91 cariche/s a base: ciclo 1,1 s = 0,37 carica + 0,6 raggio + 0,13 recupero); a Fiato ≥ 8 continuo | perforante, spettrale | rimbalzante (a metà danno), divisoria → 2 raggi perpendicolari | raggi paralleli, cap 16; lunghezza = Misura | MVP |
| `alone_lanterna` | Alone della lanterna | Tech X | 45 | raggio ad anello | 25% → 100% del Danno con la carica, 15 tick/s sulla circonferenza | Fiato normale; a Fiato ≥ 10 niente carica | perforante, spettrale | orbitante, boomerang | anelli concentrici | P1 |
| `ago_tessitrice` | Ago della Tessitrice | Mom's Knife | 50 | lancio tenuto | 2× in mano a 20 tick/s; lanciato **6×** a 1/3 di carica | istantaneo | perforante, spettrale, boomerang | rimbalzante, orbitante | aghi a ventaglio | P1 |
| `botto_festa` | Botto della Festa | Dr. Fetus | 60 | proiettile esplosivo | 10×Danno in 1,5 caselle dopo 1 s; autodanno ½ | Fiato ×0,4 | esplosiva | perforante, spettrale, rimbalzante, orbitante | lanci in sequenza | P1 |
| `cannone_reggia` | Cannone della Reggia | Epic Fetus | 70 | mirino | 20×Danno dall'alto dopo 1,5 s | il delay regola l'intervallo | esplosiva | tutto tranne gli status | mirini multipli | P1 |
| `martello_fabbro` | Martello del fabbro | The Forgotten | 100 | contatto | 3×Danno in area 90 px | 1,2 s × (2,73/Fiato), min 0,6 s | perforante (area), acida | tutta la traiettoria | colpi laterali | MVP (solo Gaetano) |

**Regola di cadenza esclusiva** (copia della catena di Isaac, https://bindingofisaacrebirth.wiki.gg/wiki/Tears): `se Botto ⇒ ×0,4; altrimenti se Raggio ⇒ ×1/3; altrimenti se Spola ⇒ ×0,45; Mangiafuoco ÷4,3 solo se vince la forma`. Chi perde la forma lascia le sue stat e le sue flag innate, che diventano flag normali del colpo (la Pistola persa sotto il Raggio regala `perforante` già innato → +1 U); un'arma perdente senza stat né flag utili vale comunque **+1 U**.

**Tabella di priorità** (due tabelle distinte, come in Isaac):

| Forma vince | Cadenza che si applica | Cosa lascia il perdente |
|---|---|---|
| Martello 100 > Cannone 70 > Botto 60 > Ago 50 > Alone 45 > Raggio 40 > Lucciola 35 > Pistola 30 > Spola 20 > Mangiafuoco 10 > scintilla 0 (affondo −1 sempre presente, fuori gara) | Botto ×0,4 > Raggio ×1/3 > Spola ×0,45 > Mangiafuoco ÷4,3; Pistola, Alone, Lucciola, Ago: nessuna | stat, flag innate (→ flag normali o +1 U), e per le coppie in `fusions.json` la forma nuova |

### 2.8 Le 23 flag (14 all'MVP in grassetto)

Bitset a 32 bit (tetto 32 flag; oggi 23), OR libero, eccezioni scritte a mano. Proc: `p = min(cap, a + b·max(Sorte,0))`, lineare perché in 12 minuti la Sorte arriva a 2-4; 100% a Sorte 6 per gli status "leggeri", cap 50% per quelli che tolgono il controllo.

| id | Oggetto | Isaac | Tipo | Proc | Effetto | Esclusioni | Traduzione: raggio · lancio · contatto · controllato |
|---|---|---|---|---|---|---|---|
| **inseguitrice** | Occhio che brilla | Homing | traiettoria | 100% | curva verso il nemico più vicino entro 3 caselle | — | raggio curva fino a 45° · spola curva all'andata · aggancio 1 casella · la lucciola si incolla (malus dichiarato) |
| **perforante** | Punta di diamante | Piercing | traiettoria | 100% | attraversa i nemici (1 colpo ciascuno), knockback 0 | il Petardo la spegne (→ +1 U) | innata (+1 U) · innata (+1 U) · colpisce tutti nei 110 px · innata |
| **spettrale** | Lembo di Velo | Spectral | traiettoria | 100% | passa ostacoli e buche, non i muri | rimbalzante vince | innata · passa · ignora (+0,5 U) · innata |
| **rimbalzante** | Spola scheggiata | Rubber Cement | traiettoria | 100% | rimbalza su muri e ostacoli; sui nemici direzione casuale; ricolpisce lo stesso solo dopo un altro contatto | vince su spettrale; ignorata da lancio/contatto/controllato | 1 rimbalzo a ½ danno · ignora · ignora · ignora |
| **divisoria** | Schegge di tufo | The Parasite | impatto | 100% | su ostacolo/nemico si divide in 2 a ½ Danno e ½ Misura, ricorsiva finché Danno > 1,0 | — | 2 raggi perpendicolari a danno pieno · 2 spole perpendicolari a fine corsa · ignora · ignora |
| **fili** | Fili d'oro / Sciarpa di Agnese | Slow + Ball of Tar | status | 100% | nemico e suoi proiettili al 60% per 1,5 s; filo d'oro visibile (`env_threads.gd`) | unico status che passa l'immunità dei boss | tutte |
| **velenosa** | Veleno della Regina | Common Cold | status | 25% + 12,5%·Sorte (100% a 6) | 2 tick × 1,0·Danno in 2 s, si rinfresca, non si cumula | gruppo `status_boss` | tutte |
| **brace** | Brace del lanterniere | Fire Mind | status | brace 100%; esplosione 10% + 5%·Sorte, **cap 25%** | 4 tick × 0,5·Danno in 2 s; le pozze del Lanterniere durano ×2; esplosione 1 casella per 10 + Danno con autodanno ½, **mai più di un autodanno ogni 2 s** | gruppo `status_boss`; **raggi, Pistola, Ago e Otre non innescano l'esplosione** (Isaac: "the beam will not cause explosions") | tutte; il raggio incendia ogni nemico toccato |
| **spaventa** | 'A paura (Smorfia 90) | Fear | status | 15% + 5%·Sorte | fugge 2 s senza attaccare | gruppo | tutte |
| incanta | Serenata di Agnese | Charm | status | 10% + 5%·Sorte, cap 50% | combatte per te 3 s; danno da contatto 25% dei suoi HP | gruppo | tutte |
| pietrificante | Sguardo della Madre | Mom's Contacts | status | 15% + 5%·Sorte, cap 50% | fermo 2 s (il contatto ferisce ancora) | gruppo | tutte |
| confonde | Vino della festa | Iron Bar | status | 10% + 5%·Sorte | vaga 3 s; i non-boss non attaccano | gruppo | tutte |
| **esplosiva** | Petardo | Ipecac | impatto | 100% | +25 flat post, esplosione 1,5 caselle, autodanno ½ (**max ½ per lancio** qualunque sia n); Fiato ×1/3, Misura ×0,8, Slancio ×0,8; spegne `perforante` | con arma raggio/lancio/controllato: +2 flat e il raggio esplode ogni 2 tick per (10 + 2·Danno); su boomerang esplode solo all'inversione | vedi fusioni |
| **orbitante** | Giostra della festa | Tiny Planet | traiettoria | 100% | orbita a 1,5-3 caselle finché vive; Misura +6,5; spettrale; cambiare mira ridirige tutto | ignorata da lancio/contatto/controllato; vince su boomerang (+1 U); il Cannone la sovrascrive | il raggio gira una volta poi va dritto · ignora · ignora · ignora |
| boomerang | Specchio di Violante | My Reflection | traiettoria | 100% | torna indietro; Misura ×2 + 1,5; +1,5 U; Slancio ×1,6; Sorte −1 | — | anello davanti + raggio dietro · innata (+1 U) · ignora · ignora |
| acida | Calcare delle Cisterne | Sulfuric Acid | impatto | **25% fisso** | rompe ostacoli e muri incrinati, apre porte chiuse non a sigillo; +0,3 U | — | tutte; il Martello ce l'ha innata (+1 U) |
| gigante | Mascherone di cartapesta | (inversa di Proptosis) | volo | — | size ×1,75, knockback ×1,5, +0,5 U, Slancio −0,2 | — | raggio più largo · spola grande · ignora · lucciola grande |
| piccola_veloce | Spillo di Agnese | Number One | volo | — | size ×0,5, S +1,0, Slancio +0,3, Misura ×0,6, −0,3 U | — | tutte (il raggio diventa un filo) |
| **crescente** | Carbone della forgia | A Lump of Coal | volo | — | **+0,6 Danno flat post per casella** percorsa (cap +6), non toccato dai moltiplicatori; raggio +20%/casella **cap +120%** | — | raggio · cresce all'andata e resta al ritorno · ignora (+0,5 U) · ignora |
| **a_bruciapelo** | Stoccata corta | Proptosis | volo | — | ×3 a 0 caselle → ×1 a 2 → ×0,5 oltre 4; size ×2; +0,5 U | — | raggio **×4** a contatto, −13%/casella · Ago ×3 fisso · **affondo ×1,5 fisso** · lucciola ×1 |
| **scudo** | Guardia di ferro | Lost Contact | difesa | 100% | la scintilla distrugge un proiettile nemico e muore (2 se perforante): la parata a distanza | — | il raggio blocca sul tick · la spola blocca all'andata · la parata c'è già (+0,5 U) · la lucciola blocca |
| persistente | Palla di cannone (innata) | Polyphemus | volo | — | la scintilla che uccide prosegue col danno residuo | — | tutte le forme proiettile |
| magnete | Calamita del fabbro | Lodestone | traiettoria | 100% | attira pickup e nemici leggeri (< 15 HP) verso il colpo | — | tutte |

**Regola degli status** (https://bindingofisaacrebirth.wiki.gg/wiki/Status_Effects): boss, mini-boss e champion accettano uno status alla volta; dopo il primo sono **immuni agli altri per 8 s** (tranne `fili`); lo stesso status si rinfresca e non si cumula; le schegge ereditano lo status della madre.

### 2.9 Modificatori di numero (10) e trasformazioni del profilo (2)

Additivi, tetto 16 per raffica, Fiato·n ≤ 20.

| id | Oggetto | Isaac | Colpi | Danno | Cadenza | Regola | Fase |
|---|---|---|---|---|---|---|---|
| **doppio** | Occhi di gatto | 20/20 | +1 (V ±8°) | ×0,8 | nessuna | **cancella la penalità** di triplo/quadruplo/Palla di cannone | MVP |
| **triplo** | Tricorno del gendarme | The Inner Eye | +2 a ventaglio ±15° | — | ×0,51 | | MVP |
| quadruplo | Artiglio dei Quattro Canti | Mutant Spider | +3 a ventaglio ±20° | — | ×0,42 | + Tricorno = 5 colpi, una sola penalità | P1 |
| ventaglio | Mangiafuoco | Monstro's Lung | 14 a carica | 100% | ÷4,3 | è un'arma (prio 10) | P1 |
| **cerchio** | Eco dei Quattro Canti | Loki's Horns | +3 cardinali | 100% | — | **25% + 5%·Sorte per colpo**; il multishot non si moltiplica sulle 3 extra; sostituisce il proc della Nuca dipinta; con la Giostra = orbite in più | MVP |
| **alternato (dietro)** | Nuca dipinta | Mom's Eye | +1 all'indietro | 100% | — | 50% + 10%·Sorte per colpo (100% a 5); non copiato dai cloni | MVP |
| alternato (diagonali) | Sguardo storto | The Wiz | 2 diagonali spettrali | 100% | — | il multishot si ripartisce per diagonale; i fendenti restano frontali | P1 |
| raffica | Raffica del duellante | (nuovo, Lead Pencil) | ogni 8° colpo una raffica di 6 in 0,25 s | 100% | — | la raffica conta nel tetto dei 20/s | P1 |
| carica | Pedale della forgia | Chocolate Milk | 1 | 0,1× → 4× tenendo premuto 1,5 s | | sovrascrive l'auto-fuoco; col Raggio: tirabile a qualunque carica | P1 |
| grappolo | Fuoco d'artificio | Haemolacria | 1 → 6-11 schegge al 66% | +1 U, ×1,5 | delay ×2 + 11 tick | ha priorità sulle armi raggio: la scintilla scoppia in 4-7 raggi corti | P1 |
| **Palla di cannone** | trasformazione | Polyphemus | 1 | (D+4)×2; **+5 flat senza ×2 se n > 1** | ×0,42 (cancellata dal doppio) | size ×2, flag `persistente`; coesiste con l'Otre (+4/×2 prima, ×0,2 dopo) | MVP |
| **Otre bucato** | trasformazione | Soy Milk | 1 | ×0,2 (gruppo `trasformazione`) | ×5,5 (15/s a T = 0) | size ×0,7, knockback 0; **riga `contatto`** (Gaetano): Danno ×0,5 e ricarica ÷2 (6,3 ogni 0,47 s = 13 DPS, uno scambio vero) | MVP |

### 2.10 Condizionali (trigger: liste di op con una condizione e una durata)

| id | Oggetti | Condizione | Effetto (op temporanee) | Fase |
|---|---|---|---|---|
| `once_per_room` | Sciarpa di Agnese, Giglio spezzato | primo colpo subito in ogni stanza | annullato; si resetta all'ingresso; cumulabili (2); vale anche per l'autodanno | MVP |
| `coins` | Medaglione di Rosa | per centesimo posseduto | +0,04 U per centesimo (max +3,96); ogni 15 raccolti +½ maschera | MVP |
| `low_hp` | Ultima maschera | maschere rosse piene ≤ 1 | +1,5 U, Passo +0,2, scintille rosse | MVP |
| `on_hit_taken` | Furia di Pulcinella, Incudine di Gaetano, Salvadanaio | per 5 s dopo un colpo subito / per piano / subito | Fiato T +1,0 per 5 s · +0,5 U fino a +3 per piano · 1-2 centesimi | MVP / P1 / P1 |
| `room_clean_streak` | Applauso della piazza | stanza con nemici dopo N stanze pulite senza danno | +0,5 U per stanza, max +3; si azzera se colpito | MVP |
| `full_hp` | Fiocco del Velo d'oro | nessun contenitore rosso vuoto | Danno ×2 (gruppo `x2_cond`), Slancio −0,3 | P1 |
| `enemy_low` | Pugnale | bersaglio sotto il 25% (i dormienti contano) | Danno ×1,5 per quel colpo (`per: shot`) | MVP |
| `on_kill` | Brace della vendetta | ogni 15 uccisioni / ogni 5 uccisioni | +1 maschera di cera / +1 brace | P1 |
| `on_room_clear` | Fazzoletto blu | stanza liberata | +1 brace | MVP |
| `still` | Foglia della Villa | fermo da 1,0 s senza sparare né guidare | `detection` 0% finché non ti muovi; famigli e orbitali dormono; primo colpo dopo ×1,5 | P1 |

### 2.11 Famigli (4 classi) e orbitali

| Classe | Op | Oggetti | Regola |
|---|---|---|---|
| **Spara-fisso** | `familiar{dmg,rate}` | Gatto d'ombra (3,5 a 1,9/s nella direzione della mira), Vespa senza Regina (2,5 a 2/s, autonoma) | non legge stat né flag; raddoppiato dalla Compagnia di maschere |
| **Clone** | `familiar{clone:k}` | Riflesso nella pozzanghera (0,75), Due maschere (2 × 0,375) | `clone.colpo = resolve(giocatore) × k`: stessa arma, flag e numero; esclude le op `per: shot` (Eco, Nuca dipinta); col Raggio carica insieme a te; Compagnia ×1,5 |
| **Orbita-blocca** | `familiar{orbit}` | Pipistrello amico (2 danni × 3/s, blocca 1 proiettile per passaggio) | orbita a 1 casella |
| **Morde / raccoglie** | `familiar{chase}` | Ratto ammaestrato (1,5 ogni 0,3 s a contatto), Scugnizzo di Piazza Dante (raccoglie centesimi, li converte) | insegue il nemico più vicino / il pickup più vicino |
| Orbitali (non famigli) | `orbital{radius,dmg,rate,blocks}` | Lampioncino di carta (6 × 4/s a 1,5 caselle), Sfere della Madre (2 × 3 × 4/s a 2 caselle), Coccarda borbonica (8 × 3/s a 3 caselle) | **DPS ≤ 24 = 2,5× la scintilla base**; bloccano i proiettili; due orbitali sullo stesso raggio si distanziano |

Tetto: 8 famigli grandi + 32 piccoli; i cloni contano nel budget dei 60 proiettili vivi.

### 2.12 Tabella di risoluzione: `resolve(inventario, personaggio, effetti_temporanei) → Build`

```
1. stats = clamp( base[personaggio] + Σ add → SET → CLAMP-1 )          (+0,5 U per ogni delta tagliato)
2. arma  = argmax(priority) fra {scintilla(0)} ∪ sostituti posseduti
   per ogni coppia (a, b) di armi possedute, in ordine di priorità decrescente:
       se (a, b) ∈ fusions.json → arma = fusione; applica keep_rate / dmg_mult / axis
   armi perdenti: stats + flag innate (ora flag normali) + nulla della cadenza (salvo keep_rate); senza nulla di utile → +1 U
   affondo sempre presente a priorità −1 (non partecipa)
3. danno = D_base(U) → flat_pre → Palla di cannone (+4,×2 | +5 se n>1) → Π mult (uno per gruppo) → flat_post → × arma.dmg_mult
4. n     = min(16, 1 + Σ count_add); se "doppio": danno ×0,8 e penalità_multishot = 1
          altrimenti penalità_multishot = min(penalità dei multishot posseduti)
5. fiato = (30/(delay(T)+1) + S) × catena_arma × penalità_multishot × Π trasformazioni;  min(fiato, 15);  fiato·n ≤ 20
6. flags = OR(item.flags) ∪ arma.innate − forma.ignores (+0,5 U ciascuna);  flag già presente o innata → +1 U (pre-calcolato in ADD)
7. famigli = [clone(k) → copia della Build × k senza le op per:"shot"] + fissi + orbitali
8. per colpo (runtime): proc per Sorte, carica, modulazione in volo, impatto, status con immunità dei boss, spawn
```

Ordine effettivo del danno (dai 17 passi di Isaac ai 6 che contano): radice sugli up → flat pre → Palla → moltiplicatore del personaggio (già nella base) → gruppi (`x1.5`, `x1.5_arma`, `x1.2`, `x2_sacro`, `x2_cond`, `trasformazione`, `multishot`) → flat post → arma. `resolve()` è pura, senza nodi, testabile headless, indipendente dall'ordine di raccolta; ricalcolata a ogni pickup/trigger, mai per frame; cache LRU su hash dell'inventario (< 0,2 ms con 12 oggetti).

### 2.13 I dieci casi speciali dell'MVP (`fusions.json` e `special_cases.gd`)

| # | Coppia | Cosa succede | Modello |
|---|---|---|---|
| 1 | **Raggio del Velo + inseguitrice** (Occhio che brilla) | il raggio curva fino a 45° verso il bersaglio più vicino entro 3 caselle e lo segue | Brimstone + Spoon Bender |
| 2 | **Raggio del Velo + Pistola di Taddeo** (fusione "Raggio di Taddeo") | la linea bianca si avvolge al raggio: Danno **×1,5** (gruppo `x1.5_arma`, cumulabile col Dente del Gatto), knockback 0, cadenza del Raggio; icona, nome e suono nuovi | Brimstone + Technology |
| 3 | **Pistola di Taddeo + Spola d'oro** (fusione "Spola perforante") | spola che attraversa la fila e torna, cadenza della Spola (`keep_rate: spola_oro`), knockback 0; ogni nemico 2 volte | concept §2.6 |
| 4 | **Spola d'oro + doppio** (Occhi di gatto) | 2 spole a V ±15°, ×0,8 ciascuna (asse `count`: coesiste con la #3) | 20/20 + Mom's Knife |
| 5 | **Palla di cannone + doppio / triplo / quadruplo** | il ×2 sparisce e il +4 diventa **+5 flat**; una sola penalità di cadenza; con gli Occhi di gatto nessuna: (5,86+5)×0,8 × 2 colpi × 2,73/s = **47,4 DPS** | Polyphemus + 20/20 |
| 6 | **Otre bucato + Carbone della forgia** | il +0,6/casella è flat post e ignora il ×0,2: 15 scintille/s che a 4 caselle fanno 3,7 ciascuna (55,9 DPS) | Soy Milk + Lump of Coal |
| 7 | **Raggio del Velo + Otre bucato** | carica 0,2 s → raggio **continuo e orientabile** finché tieni premuto: tick = 0,21·Danno a 15 tick/s (3,15·Danno/s: 11 DPS a base, 18,5 a Danno 5,86, uptime 100%) al posto del picco a scatti | Brimstone + Soy Milk (Repentance) |
| 8 | **Petardo + Raggio del Velo / Pistola di Taddeo** | il +25 diventa **+2 flat**; il raggio esplode ogni 2 tick lungo la linea per (10 + 2·Danno) in 1 casella; autodanno ½ solo se Ferruccio è entro 1 casella dal punto | Ipecac + Brimstone / Technology |
| 9 | **Giostra della festa + Eco dei Quattro Canti** (+ Carbone) | ogni proc dell'Eco aggiunge 3 scintille all'orbita (tetto 12): uno scudo rotante che col Carbone cresce fino a +6 per scintilla | Tiny Planet + Loki's Horns + Lump of Coal |
| 10 | **Stoccata corta + affondo** | l'affondo è sempre a bruciapelo: ×1,5 fisso (15,75 a base) senza decadimento | Proptosis + Mom's Knife |

**Casi speciali della Parte 1** (7): 11 Lucciola di Bianca + Raggio del Velo (anello permanente del Velo di 1,5 caselle attorno alla lucciola, 15 tick/s a 0,3·Danno = 4,5·Danno/s in area, senza carica; Ludovico + Brimstone) · 12 Fuoco d'artificio + Raggio (la scintilla scoppia in 4-7 raggi corti da 1,5 caselle e 3 tick; Haemolacria + Brimstone) · 13 Mangiafuoco + Pistola (12 linee a ventaglio di 30°, cap 24; Monstro's Lung + Technology) · 14 Alone della lanterna + inseguitrice (l'anello si deforma verso i nemici dentro; Tech X + homing) · 15 Botto della Festa + Petardo (immune ai propri botti, +2 flat, nube di veleno; Dr. Fetus + Ipecac) · 16 Ago della Tessitrice + Raggio (raffica di 2-10 aghi al lancio; Knife + Brimstone) · 17 Cannone della Reggia + Raggio (10 raggi all'impatto; Epic Fetus + Brimstone).

### 2.14 Esclusioni (tutte, in `flags.json → excl` e `special_cases.gd`)

1. `rimbalzante` vince su `spettrale` (sugli ostacoli; sui nemici agiscono entrambe).
2. `esplosiva` spegne `perforante` (+1 U).
3. Status sui boss/mini-boss/champion: uno alla volta, immunità 8 s al secondo; `fili` esente; lo stesso status si rinfresca.
4. L'Eco dei Quattro Canti sostituisce il tiro della Nuca dipinta (un solo dado per colpo: prima l'Eco); stesso gruppo `alternato`: il secondo vale +1 U e ha peso ×0,25 in pool quando possiedi il primo.
5. Penalità di cadenza dei multishot: solo la più severa; il `doppio` la azzera; la penalità d'arma segue la catena.
6. Palla di cannone e Otre bucato coesistono (+4/×2 prima, ×0,2 dopo: (5,86+4)×2×0,2 = 3,94 × 6,3/s = 24,8 DPS, sopra entrambi da soli: si lascia fare); Petardo + Otre **esclusi in pool** (peso 0).
7. Flag di traiettoria sulle forme `contatto` e `controllato`: rimosse con +0,5 U.
8. `orbitante` vince su `boomerang` (+1 U allo Specchio); il Cannone sovrascrive Giostra, rimbalzante, Specchio, divisoria (solo stat).
9. L'esplosione della brace: cap 25%, un autodanno ogni 2 s, mai innescata da raggi/Pistola/Ago/Otre.
10. Autodanno del Petardo: max ½ maschera per lancio qualunque sia n; con boomerang esplode solo all'inversione, mai sul ritorno.
11. Una seconda copia di qualunque unico non esiste nella run (toccato = via da tutte le pool); la regola +1 U serve alle flag **innate** nell'arma o nel personaggio (Agnese + Fili d'oro, Pistola + Punta di diamante, Raggio + Lembo di Velo).
12. Anti-sinergie dichiarate con avviso sull'icona: solo le dieci di §4.2.

### 2.15 Budget tecnico del colpo

Fiato per arma ≤ 15/s; Fiato·n ≤ 20 colpi/s; proiettili vivi ≤ 60 (pool pre-allocato di `projectile.gd`); 12 scintille in orbita; raggi come `Line2D` + `RayCast2D`, max 16, tick a 15 Hz su timer; proc per Sorte dal flusso RNG `ai`; 8 + 32 famigli. Caso peggiore MVP: Otre (15/s) + Tricorno (3) = 45/s → ridotto a 20/s con n = 3 (il cap riduce il Fiato, mai il numero). Da misurare sul portatile con grafica integrata e sull'Android medio alla settimana 6; se non regge, Otre ×4 (Almond Milk) invece di ×5,5.

### 2.16 Cinque esempi verificati (Ferruccio salvo indicazione; 3 oggetti)

| # | Build | Danno | Fiato | Altre stat | DPS scintilla | Note |
|---|---|---|---|---|---|---|
| 1 | Punzone G.F. (+1,5 U) + Lucciole della Villa (T +0,7) + Sciarpa di Agnese (Passo +0,3, `fili`) | 3,5·√2,8 = **5,86** | T 0,7 → delay 7,71 → **3,45/s** | Passo 1,3 = 351 px/s; fili al 100% | **20,2** (affondo 17,6) | gatto (10 HP) in 2 scintille o 1 affondo; guardia (20) in 4; Gatto dei Quattro Canti (400) in ≈ 33 s al 60% di uptime |
| 2a | Punzone + **Palla di cannone** + Lembo di Velo | (5,86+4)×2 = **19,71** | 2,73×0,42 = **1,15/s** | spettrale, persistente | **22,6** | la scintilla che uccide un gatto prosegue con 9,7 di danno residuo |
| 2b | come 2a + **Occhi di gatto** al posto del Lembo | (5,86+5)×0,8 = **8,69** × 2 colpi | **2,73/s** (penalità cancellata) | | **47,4** | il caso "20/20 + Polyphemus": ×2,1 di DPS rispetto a 2a |
| 3 | **Otre bucato** + Carbone della forgia (+0,6 flat/casella) + Dente del Gatto (+0,5 U, ×1,5) | 3,5·√1,6·1,5·0,2 = **1,33** a contatto, **3,73** a 4 caselle | 2,73×5,5 = **15,0/s** (13 scintille vive) | size ×0,7, knockback 0 | 19,9 a contatto, **55,9** a 4 caselle | il flat del Carbone ignora il ×0,2 |
| 4 | **Raggio del Velo** + Occhio che brilla + Tricorno del gendarme | tick 0,6×3,5 = **2,10** × 9 = 18,9 per raggio | cariche/s = 2,73 × 1/3 × 0,51 = **0,464**, 3 raggi | i 3 raggi curvano verso bersagli entro 3 caselle | **26,3** su un boss che li prende tutti (17,2 col solo Raggio; 8,8 per raggio singolo) | q4 del Banco: la Madre (550) cade in ≈ 42 s; diventa "da rompere" solo con Dente + Lucciole (§4.3 build 2) |
| 5 | **Agnese** (k 0,85; Spola innata con `fili`) + Fili d'oro (innata → +1 U) + Corno rosso (Sorte +2) + Veleno della Regina | 2,98·√2,2 = **4,41** per colpo, 8,83 per lancio | 2,73×0,45 = **1,23 lanci/s** | Sorte 3 → veleno 62,5% per colpo | **10,8** + ≈ 3,9 di veleno | la flag innata non va sprecata: +1 U = +48% invece di +0% |

---
## 3. Catalogo completo (154 voci: 80 [MVP] + 74 [P1])

### 3.0 Convenzioni e manifesto dell'MVP

**Colonne**: `id` snake_case stabile (mai riciclato) · Nome mostrato · Effetto con i numeri · Pool con peso (1,0 salvo indicazione; 0,1-0,5 per i q4 da tenere rari) · Q = qualità nascosta 0-4 (mai usata per pesare; "—" per consumabili e set) · Lore (una riga, stile Smorfia/fiaba, ≤ 120 caratteri nel gioco) · Interazioni per id · Fase.
**Pool**: Ricordo (tesoro), Boss (anche Caserma), Fucina (bottega; contiene gli ex Baule a peso 0,5), Pegni (diavolo), Edicola (angelo), Segreta, Bivio (ricompensa narrativa, non pesata), Drop (solo ninnoli e consumabili), innato, fallback.
**Regole trasversali**: +1 U per una flag già innata nell'arma o nel personaggio; +0,5 U per una flag ignorata dalla forma o per un delta di stat tagliato dal clamp o ignorato dall'arma; toccato = tolto da tutte le pool; nessuna "seconda copia" esiste nella run.

**Manifesto dell'MVP (80 voci)** — è l'unica definizione: sinergie, build, concept §4.1 e criterio S5-6 la citano.

| Che cosa | Quante | Quali |
|---|---|---|
| Flag nel bitset | **14** | inseguitrice, perforante, spettrale, rimbalzante, divisoria, fili, velenosa, brace, spaventa, esplosiva, orbitante, crescente, a_bruciapelo, scudo (+ `persistente` innata della Palla, `boomerang` innata della Spola) |
| Sostituti d'arma in pool | **3** + affondo + scintilla | Spola d'oro, Pistola di Taddeo, Raggio del Velo (+ Martello innato di Gaetano, Spola innata di Agnese) |
| Modificatori di numero | **4** | doppio, triplo, cerchio, alternato-dietro |
| Trasformazioni del profilo | **2** | Palla di cannone, Otre bucato |
| Fusioni nominate (icona + nome + suono) | **3** | Raggio di Taddeo (#2), Spola perforante (#3), Due spole (#4) |
| Casi speciali | **10** | §2.13 |
| Trigger | **6** | once_per_room, coins, low_hp, on_hit_taken, room_clean_streak, enemy_low (+ on_room_clear del Fazzoletto blu) |
| Famigli / orbitali | 1 / 1 | Gatto d'ombra, Lampioncino di carta |
| Attivi | 8 | 4 pescabili a profilo nuovo (Mantice del fabbro, Lanterna, Sciarpa annodata, Bomba carta) + 4 dietro sblocco o Bivio |
| Ninnoli / consumabili | 6 / 4 | |
| Set | 1 (richiamo a 2 pezzi) | Gatto dei Quattro Canti |
| Pescabili dai piedistalli a profilo nuovo | **56** | 80 − 4 consumabili − 6 ninnoli − 1 set − 1 fallback (Pane cafone) − 5 ricompense dei Bivi − 1 innato (Mantice del fabbro) − 6 dietro sblocco (Punzone, Dente del Gatto, Pistola, Martello del calcare, Rampino, Scatola musicale); con 9-10 presi a run = 17% del catalogo a run, novità per 8-10 run |
| Icone | 79 (16 esistono) | 63 nuove con `gen_icons.py`, 11 fogli a 6 |

**Lista di taglio dell'MVP** (se la settimana 10 è in ritardo, nell'ordine): Settima vita → Mantello del Munaciello (volo) → Scatola musicale → Giostra + Eco (orbite) → 4 ricompense dei Bivi nuove → Tarallo e Aureola → Spola scheggiata e Schegge di tufo (2 flag) → Otre bucato (si tiene la Palla). Mai tagliare: le 8 flag del concept, le 3 armi, Occhi di gatto, Tricorno, Palla di cannone, Medaglione di Rosa, Sciarpa di Agnese.

**Micro-lore nuova, da marcare Provisional nella bibbia** (9): l'orologiaio della Reggia che fermò le pendole (Lente); il cocchiere di Violante e la carrozza senza cocchiere (Sprone, Carrozza di Violante); il Munaciello a Caserta (Mantello); la Madonnina di Corso Trieste (Candele, Edicola, Giglio d'oro, Luce); le campane di Casertavecchia (Campana); i cannoni di parata del Cortile d'Onore (Palla di cannone); il Belvedere di San Leucio come punto d'osservazione (Cannocchiale); il saltimbanco sputafuoco della festa (Mangiafuoco); lo speziale di Via San Carlo (Boccetta). Tutto il resto viene dalla bibbia (sciarpa rossa §IV, fili d'oro §XVI, Mariella e la sua lettera §IX, Gregorio §VII, boss §XII, Smorfia §X).

### 3.A Statistiche pure e trasformazioni del profilo (24: 17 MVP, 7 P1)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| punzone_gf | Punzone G.F. | Danno +1,5 U (3,50 → 5,86); +2 flat post sui nemici di pietra (statua, cavaliere, mascherone, Madre, Tessitrice) | Ricordo 1,0 · Pegni 0,5 · Boss 0,5 | 3 | Il punzone di Gaetano ritrovato accanto alla fontana della Villa: le iniziali del padre battute nel ferro | spola_oro (2 passaggi = +4 sulla pietra), raggio_velo (+2 per tick × 9), sblocco "30 nemici di pietra" | MVP |
| spina_ferro | Spina di ferro | Danno +2,0 flat pre (prima dei moltiplicatori); Fiato T −0,3 | Fucina (tag `ferro`) | 2 | Un chiodo da carpentiere strappato all'impalcatura del cantiere del 1839 | dente_gatto / anello_borbone (il flat pre entra nel ×1,5), otre_bucato (il ×0,2 lo riduce a 0,4: pick tiepido, nessun avviso) | MVP |
| fiasco_asprinio | Fiasco d'Asprinio | Danno +2,0 U (→ 6,45); Passo −0,1 | Boss 1,0 · Ricordo 0,5 | 3 | Vino aspro di Aversa servito alla festa della Reggia: scalda il braccio e appesantisce il piede | sprone_cocchiere (compensa il malus) | MVP |
| pietra_focaia | Pietra focaia | Danno +1,5 U; Sorte −1 | Pegni 1,0 · Fucina 0,5 | 2 | Scheggia di selce dal focolare di un sonnambulo: fa scintille, ma porta sfortuna | zampa_coniglio (compensa), veleno_regina (proc −12,5%) | P1 |
| dente_gatto | Dente del Gatto | Danno +0,5 U e **×1,5** (gruppo `x1.5`: non si somma con anello_borbone né tarallo_reale; si somma con la fusione Raggio+Pistola, gruppo `x1.5_arma`); tag `gatto` | Boss 0,5 · Pegni 0,5 | 4 | Zanna caduta al Gatto dei Quattro Canti: dentro c'è il ricordo di una casa | palla_cannone ((D+4)×2 poi ×1,5), raggio_velo + pistola_taddeo (×2,25 in tutto), set Gatto (pezzo), sblocco: prima vittoria sul Gatto | MVP |
| anello_borbone | Anello dei Borbone | Danno ×1,5 (gruppo `x1.5`); Maschere −1 contenitore di massimo (mai sotto 1) | Pegni | 3 | Sigillo d'oro col giglio: chi lo porta comanda, e perde un pezzo di sé | dente_gatto (stesso gruppo: il secondo vale +1 U), ultima_maschera (più facile restare a 1), settima_vita (nessun contenitore da togliere: solo il ×1,5) | MVP |
| lucciole_villa | Lucciole della Villa | Fiato T +0,7 (2,73 → 3,45/s) | Ricordo 1,0 · Fucina 0,5 · Boss 0,5 | 2 | Un barattolo di lucciole raccolte fra le aiuole della Villa Comunale | tricorno_gendarme (3 colpi a 1,76/s), raggio_velo (carica più breve), soffio_forgia (T 1,7 → 4,80/s: a un passo dal cap) | MVP |
| soffio_forgia | Soffio della forgia | Fiato T +1,0 (→ 3,80/s); Misura −1,5 | Boss 1,0 · Ricordo 0,5 | 3 | Il soffietto nuovo della forgia dei Ferraro, cuoio chiaro e chiodi d'ottone: Gaetano non fece in tempo a usarlo | lucciole_villa (4,80/s), cannocchiale_belvedere (ripaga la Misura), otre_bucato (3,80 × 5,5 → cap 15) | MVP |
| soffietto_tascabile | Soffietto tascabile | Fiato T +0,35 (→ 3,07/s); Slancio +0,16 | Fucina | 1 | Un mantice da camino, di quelli che i cortigiani usano per i bracieri | lucciole_villa, soffio_forgia (somma lineare in T) | P1 |
| bottone_gendarme | Bottone del gendarme | Fiato **S +1,0** (colpi/s aggiunti fuori dal cap di T) | Fucina | 2 | Bottone d'ottone col giglio, strappato alla giubba di una Guardia della Città | otre_bucato ((2,73+1) × 5,5 = 20,5 → tagliato al cap per arma 15), al cap di T è l'unico +Fiato che conta | P1 |
| cannocchiale_belvedere | Cannocchiale del Belvedere | Misura +3,75 (→ 10,25 caselle); Slancio +0,2 | Ricordo | 2 | Ottone e lenti dal Belvedere di San Leucio: da lassù si vede la Reggia intera | carbone_forgia (più caselle = più danno, fino a +6), raggio_velo (raggio lungo 10 caselle), pistola_taddeo (Misura ignorata: +0,5 U), stoccata_corta (anti lieve: la Misura non serve) | P1 |
| lampione_piazza_dante | Lampione di Piazza Dante | Misura +2,5 (→ 9 caselle) | Fucina | 1 | Un lampione della piazza in miniatura, luce ambra: la notte è meno buia di un passo | carbone_forgia, schegge_tufo (le schegge ereditano ½ Misura), raggio_velo, pistola_taddeo (+0,5 U) | MVP |
| polvere_sparo | Polvere da sparo | Slancio +0,3 (→ 1,3 = 624 px/s); Danno +0,5 U | Boss 1,0 · Fucina 0,5 | 2 | Un cartoccio dalla Santabarbara della Caserma: brucia in fretta | pistola_taddeo (raggio istantaneo: Slancio ignorato, +0,5 U), specchio_violante (×1,6 → 2,0 clamp) | P1 |
| lente_orologiaio | Lente dell'orologiaio | Slancio +0,25; Misura +1,5 | Boss 1,0 · Ricordo 0,5 | 2 | Il monocolo dell'orologiaio della Reggia, che fermò tutte le pendole la notte del Velo | botto_festa (anti lieve: esplosione più lontana), lucciola_bianca (la lucciola corre di più) | P1 |
| scarpe_silenziose | Scarpe silenziose | Passo +0,3 (→ 1,3 = 351 px/s); tag `gatto` | Ricordo | 2 | Scarpe di feltro nero del costume della festa: Pulcinella non cammina, scivola come un gatto sui tetti | stivali_tempra (Passo 1,45), set Gatto (pezzo), un terzo +0,3 oltre il clamp 1,6 vale +0,5 U | MVP |
| stivali_tempra | Tempra degli stivali | Passo +0,15; ricarica dello scatto 0,55 → 0,40 s | Fucina | 1 | Suole ribattute sull'incudine di Gaetano: ferro sotto il cuoio | scarpe_silenziose, richiamo del Gatto (2 cariche a 0,40 s) | MVP |
| sprone_cocchiere | Sprone del cocchiere | Passo +0,5; ricarica dello scatto −50%; Misura −1,0 | Segreta | 2 | Lo sprone del cocchiere di Violante: la notte della festa i cavalli non si sono più fermati | fiasco_asprinio / lardo_mercato (annulla i malus di Passo), foglia_villa (anti lieve: in corsa non sei mai fermo), oltre il clamp 1,6 l'eccesso vale +0,5 U | MVP |
| corno_rosso | Corno rosso | Sorte +2 | Fucina 1,0 · Ricordo 0,5 | 2 | 'O curniciello di corallo appeso al banchetto di Tonino contro il malocchio | veleno_regina (25% → 50%), eco_quattro_canti (25% → 35%), drop (+6% di maschere) | MVP |
| otre_bucato | Otre bucato | Fiato **×5,5** (15,0/s a T = 0: il cap per arma); Danno **×0,2** (gruppo `trasformazione`); size ×0,7; knockback 0; su Gaetano: Martello ×0,5 e ricarica ÷2 | Segreta | 3 | L'otre di cuoio che soffiava sulla forgia, bucato dai ratti delle Cisterne: soffia sempre, ma piano | carbone_forgia (#6: 55,9 DPS a 4 caselle), raggio_velo (#7: raggio continuo), guardia_ferro (muro di scintille), fili_oro / veleno_regina (15 dadi al secondo), petardo (**excl_pool**), brace_lanterniere (anti dichiarata), bottone_gendarme, spina_ferro | MVP |
| tarallo_reale | Tarallo reale | +1 contenitore; Danno +0,5 U e ×1,5 (gruppo `x1.5`); Misura +2,5; Passo +0,3; cura completa | Edicola 1,0 · Ricordo 0,3 | 4 | Tarallo 'nzogna e pepe dal banchetto della Reggia: una cena intera in un boccone | dente_gatto / anello_borbone (stesso gruppo: il secondo vale +1 U), palla_cannone | MVP |
| palla_cannone | Palla di cannone della Reggia | Danno **(D+4)×2** (gruppo `trasformazione`); con un multishot **+5 flat senza ×2**; Fiato ×0,42 (cancellato dal doppio); size ×2; flag `persistente` innata (la scintilla che uccide prosegue col danno residuo) | Pegni 0,5 · Segreta 0,2 | 4 | Una palla dei cannoni di parata del Cortile d'Onore: nessuno l'aveva mai sparata, finché non l'ha presa in mano un fabbro | occhi_gatto (#5: 47,4 DPS), stoccata_corta (62,7 a contatto, il residuo passa dietro), schegge_tufo (19,7 → 9,9 → 4,9 → 2,5 → 1,2), otre_bucato (coesistono: 24,8 DPS), dente_gatto, mangiafuoco_dante (14 palle per carica), tricorno_gendarme (+5 flat, una sola penalità) | MVP |
| impugnatura_rinforzata | Impugnatura rinforzata | Tempo dell'affondo −15% (0,56 → 0,48 s) | Fucina | 1 | Cuoio nuovo avvolto stretto sull'elsa dello stocco: la mano non scivola più | stoccata_corta (l'affondo ×1,5 arriva più spesso), targa_operai, elsa_bilanciata (−40% insieme = 0,34 s, pavimento 0,33) | MVP |
| elsa_bilanciata | Elsa bilanciata | Tempo dell'affondo −25%; portata dell'affondo +15% | Ricordo | 2 | Un contrappeso di piombo nel pomo: lo stocco torna in guardia da solo | impugnatura_rinforzata, punta_diamante (più nemici nei 127 px), targa_operai (+45% in tutto, il massimo) | P1 |
| cenere_registro | Cenere del registro | Danno +1,5 U; Fiato T +0,35; Sorte −1 | Bivio del Registro ("distrutto") | 3 | Quel che resta del registro del 1839, bruciato: la verità scalda ancora, ma non si legge più | registro_acque (ramo opposto, mai insieme), corno_rosso (compensa la Sorte) | MVP |

### 3.B Flag del colpo (22, una per flag: 14 MVP, 8 P1)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| occhio_brilla | Occhio che brilla | flag `inseguitrice`: il colpo curva verso il nemico più vicino entro 3 caselle; l'affondo si aggancia entro 1 casella | Ricordo 1,0 · Edicola 0,5 | 3 | L'occhio acceso della maschera di Ferruccio: vede nel buio chi si nasconde | raggio_velo (#1: il raggio curva di 45°), occhi_gatto (2 scintille su 2 bersagli), lucciola_bianca (anti: si incolla al primo nemico), alone_lanterna (#14) | MVP |
| punta_diamante | Punta di diamante | flag `perforante`: attraversa i nemici (1 colpo ciascuno), knockback 0; l'affondo colpisce tutti nei 110 px | Ricordo 1,0 · Fucina 0,5 | 2 | Punta da incisore tolta al bulino di un orafo di Corso Trieste | pistola_taddeo / lucciola_bianca / raggio_velo (già innata: +1 U), petardo (la spegne: +1 U), brace_lanterniere (incendia la fila), guardia_ferro (2 proiettili per scintilla) | MVP |
| lembo_velo | Lembo di Velo | flag `spettrale`: passa ostacoli e buche (non i muri); `detection` 70% | Segreta | 2 | Un brandello della seta di San Leucio: chi lo tiene è mezzo dentro il sogno | spola_scheggiata (rimbalzante vince sugli ostacoli), raggio_velo / pistola_taddeo (già innata: +1 U), palla_cannone, mantello_munaciello (tu e il colpo passate tutto) | MVP |
| spola_scheggiata | Spola scheggiata | flag `rimbalzante`: rimbalza su muri e ostacoli, sui nemici direzione casuale; ricolpisce lo stesso solo dopo un altro contatto | Ricordo | 3 | Spola di legno rotta da Ferruccio al primo incontro con Agnese: rimbalza ancora dal telaio | lembo_velo (vince), spola_oro / lucciola_bianca (ignorata: +0,5 U), raggio_velo (1 rimbalzo a ½ danno), schegge_tufo (le schegge rimbalzano), set Tessitrice (pezzo) | MVP |
| schegge_tufo | Schegge di tufo | flag `divisoria`: su ostacolo o nemico si divide in 2 colpi a ½ Danno e ½ Misura, ricorsiva finché Danno > 1,0 | Ricordo | 3 | Tufo giallo delle Cisterne Sepolte: si sbriciola e taglia | raggio_velo (2 raggi perpendicolari a danno pieno: "croce del Velo"), palla_cannone (schegge da 9,9 → 4,9 → 2,5 → 1,2), veleno_regina (le schegge ereditano lo status), botto_festa (4 mini-botti), set Ratking (pezzo) | MVP |
| fili_oro | Fili d'oro | flag `fili`: nemico e suoi proiettili al 60% per 1,5 s; filo d'oro visibile; unico status che passa l'immunità dei boss | Ricordo 1,0 · Fucina 0,5 | 2 | I fili della Tessitrice che attraversano Caserta: chi li tocca rallenta come in un sogno | spola_oro / sciarpa_agnese (già innata: +1 U), martello_calcare, otre_bucato (stanza al 60%), set Tessitrice (pezzo) | MVP |
| veleno_regina | Veleno della Regina | flag `velenosa`: 25% + 12,5%·Sorte (100% a Sorte 6): 2 tick × 1,0·Danno in 2 s, si rinfresca, non si cumula | Ricordo 1,0 · Pegni 1,0 · Fucina 0,5 | 2 | Pungiglione della Regina dei Debiti: ogni puntura è una promessa non mantenuta | corno_rosso (50%), zanna_ratto (+10%), spola_oro (2 dadi per lancio), raggio_velo (un dado per tick: quasi certo), otre_bucato (3,75 proc/s) | MVP |
| brace_lanterniere | Brace del lanterniere | flag `brace`: incendia al 100% (4 tick × 0,5·Danno in 2 s); esplosione 10% + 5%·Sorte (**cap 25%**) per 10 + Danno in 1 casella, autodanno ½ **al massimo una volta ogni 2 s**; le pozze del Lanterniere durano ×2; raggi, Pistola, Ago e Otre non innescano l'esplosione | Ricordo | 2 | Il tizzone che il Lanterniere del Velo porta in giro per accendere i lampioni di una città che dorme | pistola_taddeo (incendia tutta la fila, senza esplosioni), raggio_velo (#4), spola_oro (**anti dichiarata**: la spola infuocata ti torna addosso se stai fermo), otre_bucato (anti dichiarata: solo brace, niente esplosione), ferro_cavallo (esplosione al cap 25%, non al 60%) | MVP |
| a_paura | 'A paura | flag `spaventa`: 15% + 5%·Sorte: il nemico fugge 2 s senza attaccare (boss: uno status alla volta, immunità 8 s) | Ricordo | 1 | Il 90 della Smorfia, la maschera nera che Violante fece preparare per la festa: la portò Ferruccio, ora la portano i suoi colpi | sguardo_madre (gruppo `status_boss`: si escludono sui boss), eco_quattro_canti (paura da quattro lati), otre_bucato (2,25 fughe/s) | MVP |
| sguardo_madre | Sguardo della Madre | flag `pietrificante`: 15% + 5%·Sorte (cap 50%): fermo 2 s, il contatto ferisce ancora | Boss (sblocco: battere la Madre) | 3 | Gli occhi di marmo della Madre: chi li incrocia resta nella posa dell'ultimo ricordo | pugnale (i pietrificati non sono "sotto il 25%"), a_paura (esclusione sui boss), ratto_ammaestrato (morde i fermi), lucciola_bianca (#17) | P1 |
| petardo | Petardo | flag `esplosiva`: +25 flat post, esplosione 1,5 caselle, autodanno ½ (max ½ per lancio); Fiato ×1/3, Misura ×0,8, Slancio ×0,8; spegne `perforante` | Ricordo 0,5 · Pegni 0,5 | 3 | Botto della festa di Piazza Dante, miccia corta e carta rossa | raggio_velo / pistola_taddeo (#8: +2 flat, esplosioni lungo la linea), spola_oro / specchio_violante (esplode solo all'inversione), otre_bucato (**excl_pool**), occhi_gatto (autodanno comunque ½ per lancio), sciarpa_agnese (annulla il primo autodanno) | MVP |
| giostra_festa | Giostra della festa | flag `orbitante`: le scintille orbitano a 1,5-3 caselle finché vivono; Misura +6,5; spettrale; cambiare mira ridirige tutto | Segreta | 2 | Il carosello di legno montato in Piazza Dante per la festa: gira anche senza bambini | eco_quattro_canti (#9: +3 scintille in orbita a proc, tetto 12), carbone_forgia (crescono girando), guardia_ferro (l'anello mangia i proiettili), spola_oro / lucciola_bianca (ignorata: +0,5 U), specchio_violante (vince: +1 U), cannone_reggia (sovrascritta) | MVP |
| specchio_violante | Specchio di Violante | flag `boomerang`: il colpo torna indietro; Misura ×2 + 1,5; Danno +1,5 U; Slancio ×1,6; Sorte −1 | Ricordo | 2 | Lo specchio da toeletta della Reggia: Violante ci vedeva ancora Bianca | spola_oro / ago_tessitrice (già innata: +1 U), punta_diamante (ogni nemico 2 volte), carbone_forgia (torna più forte), raggio_velo (anello davanti + raggio dietro), giostra_festa (perde: +1 U) | P1 |
| carbone_forgia | Carbone della forgia | flag `crescente`: +0,6 Danno flat post per casella percorsa (cap +6), non toccato dai moltiplicatori; sul raggio +20%/casella (cap +120%) | Pegni 1,0 · Ricordo 0,5 | 3 | Un pezzo di carbone dalla forgia dei Ferraro: più va lontano, più scotta | otre_bucato (#6), cannocchiale_belvedere / lampione_piazza_dante, giostra_festa (#9), spola_oro (cresce all'andata, resta al ritorno), raggio_velo (×2,2 a fondo stanza) | MVP |
| stoccata_corta | Stoccata corta | flag `a_bruciapelo`: ×3 a 0 caselle → ×1 a 2 → ×0,5 oltre 4; size ×2; Danno +0,5 U; **affondo ×1,5 fisso** | Ricordo 1,0 · Pegni 0,5 | 3 | La prima lezione di scherma: "la misura corta è la più onesta" | affondo (#10: 15,75 a base), palla_cannone (62,7 a contatto), rampino_catena (tira il bersaglio a bruciapelo), raggio_velo (×4 a contatto, −13%/casella), cannocchiale_belvedere (anti lieve) | MVP |
| guardia_ferro | Guardia di ferro | flag `scudo`: la scintilla distrugge un proiettile nemico e muore (2 se perforante): la parata a distanza | Fucina | 2 | La coccia dello stocco di Ferruccio, forgiata da suo padre | punta_diamante (2 proiettili per scintilla), otre_bucato (il ventaglio della Madre sparisce in 0,5 s), giostra_festa (anello che mangia i proiettili), lucciola_bianca (blocca di continuo), affondo (la parata c'è già: +0,5 U) | MVP |
| serenata_agnese | Serenata di Agnese | flag `incanta`: 10% + 5%·Sorte (cap 50%): il nemico combatte per te 3 s; danno da contatto 25% dei suoi HP | Ricordo | 2 | La canzone che Agnese cantava al telaio: chi la sente si volta dalla parte giusta | otre_bucato (1,5 incanti/s), ratto_ammaestrato (ratti incantati + ratti amici), sguardo_madre (gruppo `status_boss`) | P1 |
| vino_festa | Vino della festa | flag `confonde`: 10% + 5%·Sorte: vaga 3 s; i non-boss non attaccano | Fucina | 1 | Il vino dei brindisi della Reggia, servito a tutti quella notte: la città dorme anche per questo | a_paura (stesso gruppo), otre_bucato, Smorfia 22 (stesso effetto a tutti) | P1 |
| calcare_cisterne | Calcare delle Cisterne | flag `acida`: 25% fisso: il colpo rompe ostacoli e muri incrinati, apre porte chiuse non a sigillo; Danno +0,3 U | Segreta | 2 | Incrostazioni delle Cisterne Sepolte: mangiano la pietra in silenzio | martello_fabbro (già innata: +1 U), chiodo_fabbro (centesimi dagli ostacoli), set Ratking (pezzo) | P1 |
| mascherone_cartapesta | Mascherone di cartapesta | flag `gigante`: size ×1,75, knockback ×1,5, Danno +0,5 U, Slancio −0,2 | Ricordo | 2 | Una testa di cartapesta del carro della festa: grossa, lenta, fa più male di quanto sembri | giostra_festa (anello largo), raggio_velo (raggio più largo), spillo_agnese (si annullano: +1 U), guardia_ferro | P1 |
| spillo_agnese | Spillo di Agnese | flag `piccola_veloce`: size ×0,5, Fiato S +1,0, Slancio +0,3, Misura ×0,6, Danno −0,3 U | Ricordo | 2 | Uno spillo da tessitrice, lungo quanto il mignolo: punge prima che tu lo veda | otre_bucato (anti morbida: 16/s → cap 15), bottone_gendarme (S +2), mascherone_cartapesta (si annullano) | P1 |
| calamita_fabbro | Calamita del fabbro | flag `magnete`: attira pickup e nemici leggeri (< 15 HP) verso il colpo | Fucina | 2 | La calamita con cui Gaetano raccoglieva i chiodi da terra: ora raccoglie altro | scugnizzo_piazza (raccoglie quello che attiri), giostra_festa (pickup in orbita verso di te), punta_diamante (fila che si compatta) | P1 |

### 3.C Sostituti d'arma (10: 4 MVP, 6 P1; l'affondo resta sempre a priorità −1)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| spola_oro | Spola d'oro | arma prio 20, forma `lancio`: boomerang 5 caselle, colpisce 2 volte (andata e ritorno) a Danno pieno; Fiato ×0,45 (1,23 lanci/s a base); innate `boomerang`, `fili`; ignora rimbalzante/orbitante (+0,5 U) | Ricordo | 3 | La spola del telaio di Agnese a San Leucio, filata d'oro dal Velo: torna sempre a chi l'ha lanciata | pistola_taddeo (#3: spola perforante), occhi_gatto (#4: 2 spole a V), punzone_gf, carbone_forgia, veleno_regina (2 dadi), brace_lanterniere (anti dichiarata), fili_oro (+1 U), petardo (esplode all'inversione) | MVP |
| pistola_taddeo | Pistola di Taddeo | arma prio 30, forma `raggio` istantaneo: Danno, gittata infinita, knockback 0, cadenza = Fiato; innata `perforante`; 1 solo rimbalzo; Misura e Slancio ignorati (+0,5 U ciascuno) | Boss (sblocco: Bivio di Taddeo "accusato") | 3 | La pistola da viaggio con cui Taddeo, quella sera, non sparò: la consegnò alle guardie insieme al nome dell'amico | raggio_velo (#2: Raggio di Taddeo ×1,5), spola_oro (#3), punta_diamante (+1 U), brace_lanterniere (fila in fiamme), tricorno_gendarme (3 canne parallele), mangiafuoco_dante (#13), scatola_musicale (il primo colpo ×2 su tutta la fila, poi li sveglia), lembo_velo (+1 U) | MVP |
| raggio_velo | Raggio del Velo | arma prio 40, forma `raggio` caricato: **tick 0,6·Danno, 9 tick in 0,6 s** (18,9 per raggio a base, 17,2 DPS = 1,8× la scintilla); Fiato ×1/3 (0,91 cariche/s a base, ciclo 1,1 s); a Fiato ≥ 8 continuo; innate `perforante`, `spettrale`; lunghezza = Misura; divisoria → 2 raggi perpendicolari | Pegni 0,5 · Segreta 0,2 | 4 | Un filo del Velo d'oro teso come una corda d'arco: la luce che addormentò Caserta | occhio_brilla (#1), pistola_taddeo (#2), otre_bucato (#7), tricorno_gendarme (3 raggi paralleli), schegge_tufo (croce), brace_lanterniere, petardo (#8), lucciola_bianca (#11), riflesso_pozzanghera (carica insieme a te), carbone_forgia (cap +120%), stoccata_corta (×4 a contatto) | MVP |
| telaio_agnese | Telaio di Agnese | ricompensa: **Spola d'oro** garantita; se già posseduta o innata (Agnese): Danno +1 U e Fiato T +0,35 | Bivio di Agnese ("risvegliata") | 3 | Il telaio di San Leucio rimesso in moto dalle mani di Agnese sveglia: la spola parte da sola | spola_oro (è lei), fili_oro (+1 U), set Tessitrice (pezzo) | MVP |
| lucciola_bianca | Lucciola di Bianca | arma prio 35, forma `controllato`: una sola scintilla guidata, Danno per tick a tick/s = Fiato (cap 10); innate `perforante`, `spettrale`; ignora boomerang/divisoria/rimbalzante (+0,5 U) | Edicola 1,0 · Segreta 0,5 | 3 | La luce che Bianca inseguiva nella Villa prima del 1839: ora segue Ferruccio | raggio_velo (#11: anello permanente), occhio_brilla (anti: si incolla), occhi_gatto (+1 lucciola orbitante, cap 4), guardia_ferro, foglia_villa (anti dichiarata), brace_lanterniere + fili_oro (rinfresca gli status sul boss) | P1 |
| mangiafuoco_dante | Mangiafuoco di Piazza Dante | arma prio 10, forma `proiettile` caricato: 14 scintille a carica piena al 100% del Danno; Fiato ÷4,3; +⌊2,4·(n−1)⌋ scintille per colpo extra, cap 50 | Ricordo | 3 | Il saltimbanco che sputava fuoco alla festa: ha dimenticato tutto tranne il trucco | pistola_taddeo (#13: 12 linee a ventaglio), tricorno_gendarme (18 scintille), palla_cannone (14 palle: 276 per carica), veleno_regina (14 dadi), foglia_villa (carica protetta) | P1 |
| ago_tessitrice | Ago della Tessitrice | arma prio 50, forma `lancio` tenuto: ×2 Danno in mano a 20 tick/s; lanciato sul filo d'oro ×6 a 1/3 di carica, torna a ×2; innate `perforante`, `spettrale`, `boomerang`; ignora rimbalzante/orbitante | Pegni 0,2 · Boss 0,5 (dopo la Tessitrice) | 4 | L'ago di pietra con cui la Tessitrice cuce il Velo sui telai di San Leucio | raggio_velo (#16: raffica di aghi), stoccata_corta (×3 fisso a contatto), brace_lanterniere (brace senza esplosione), specchio_violante (+1 U), set Tessitrice (pezzo) | P1 |
| botto_festa | Botto della Festa | arma prio 60, forma `proiettile` esplosivo: 10×Danno in 1,5 caselle dopo 1 s; autodanno ½; Fiato ×0,4; innata `esplosiva`; ignora perforante/spettrale/rimbalzante/orbitante (+0,5 U) | Pegni 0,3 · Segreta 0,3 | 4 | Il botto grande della festa, quello che si accende per ultimo e fa tremare i vetri della Reggia | petardo (#15: immune ai propri botti, +2 flat, nube di veleno), schegge_tufo (4 mini-botti a ½), sciarpa_agnese / giglio_spezzato (il primo autodanno è annullato), velo_seta, lente_orologiaio (anti lieve) | P1 |
| alone_lanterna | Alone della lanterna | arma prio 45, forma `raggio` ad anello: 25% → 100% del Danno con la carica, 15 tick/s sulla circonferenza; a Fiato ≥ 10 niente carica; innate `perforante`, `spettrale`; ignora orbitante/boomerang | Segreta 0,3 | 4 | L'alone che la lanterna del Lanterniere lascia nell'aria umida: un cerchio di luce che taglia | occhio_brilla (#14: l'anello si piega verso chi sta dentro: 88 DPS a Danno 5,86), occhi_gatto (2 anelli ×0,8), fuoco_artificio, foglia_villa | P1 |
| cannone_reggia | Cannone della Reggia | arma prio 70, forma `mirino`: 20×Danno dall'alto dopo 1,5 s; il delay regola l'intervallo; innata `esplosiva`; sovrascrive Giostra, rimbalzante, Specchio, divisoria (solo stat) | Segreta 0,1 | 4 | Il cannone di parata del Cortile d'Onore che spara una sola volta l'anno: questa | raggio_velo (#17: 10 raggi all'impatto), occhi_gatto (2 mirini), sciarpa_agnese | P1 |
### 3.D Multi-colpo (9: 4 MVP, 5 P1; additivi, tetto 16 per raffica, Fiato·n ≤ 20)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| occhi_gatto | Occhi di gatto | `doppio`: +1 colpo (2 a V ±8°), Danno ×0,8, **nessuna penalità di cadenza**; cancella la penalità di triplo/quadruplo/Palla di cannone; tag `gatto` | Boss (sbloccato di base) | 3 | Due occhi gialli strappati alla notte di Piazza Dante: vedono doppio | palla_cannone (#5: 47,4 DPS), spola_oro (#4), tricorno_gendarme (4 colpi senza penalità), occhio_brilla (2 bersagli), raggio_velo (4 raggi), set Gatto (pezzo) | MVP |
| tricorno_gendarme | Tricorno del gendarme | `triplo`: +2 colpi a ventaglio ±15°; Fiato ×0,51 | Ricordo 1,0 · Boss 0,5 | 3 | Il tricorno di un vecchio gendarme di re Ferdinando, fuori ordinanza da mezzo secolo: tre punte, tre colpi | occhi_gatto (penalità cancellata, ×0,8), artiglio_quattro_canti (5 colpi, una sola penalità ×0,42), raggio_velo (3 raggi paralleli), pistola_taddeo (3 canne a 12 px), mangiafuoco_dante (18), palla_cannone (+5 flat) | MVP |
| eco_quattro_canti | Eco dei Quattro Canti | `cerchio`: 25% + 5%·Sorte per colpo: +3 scintille cardinali al 100% del Danno; il multishot non si moltiplica sulle 3 extra; non copiata dai cloni (`per: shot`) | Ricordo 1,0 · Segreta 0,5 | 2 | L'eco del balzo del Gatto fra i quattro cantoni della piazza: un colpo torna da quattro lati | giostra_festa (#9), nuca_dipinta (un solo dado per colpo: prima l'Eco; peso ×0,25 in pool), corno_rosso (35%), a_paura (paura da quattro lati) | MVP |
| nuca_dipinta | Nuca dipinta | `alternato`: 50% + 10%·Sorte per colpo (100% a Sorte 5): +1 scintilla all'indietro al 100%; non copiata dai cloni | Ricordo | 2 | Il secondo occhio della maschera, dipinto dietro: Pulcinella guarda sempre due volte | eco_quattro_canti (l'Eco sostituisce il tiro: +1 U, peso ×0,25), specchio_violante (il colpo dietro torna davanti), sonnambuli (arrivano alle spalle) | MVP |
| artiglio_quattro_canti | Artiglio dei Quattro Canti | `quadruplo`: +3 colpi a ventaglio ±20°; Fiato ×0,42; tag `gatto` | Boss (sblocco: 50 gatti abbattuti) | 3 | L'artiglio nero della zampata a semicerchio del Gatto dei Quattro Canti | tricorno_gendarme (5 colpi, penalità ×0,42 sola), occhi_gatto (nessuna penalità: 5 colpi a 2,73/s), raggio_velo (anti dichiarata: 4 raggi ogni 2,6 s), set Gatto (pezzo) | P1 |
| sguardo_storto | Sguardo storto | `alternato (diagonali)`: 2 colpi diagonali spettrali al posto del frontale; il multishot si ripartisce per diagonale; l'affondo resta frontale | Segreta | 2 | Una maschera dipinta con gli occhi storti: guarda a destra e a sinistra, mai davanti | tricorno_gendarme (3 per diagonale), occhio_brilla (le diagonali curvano: la build "non miro più"), raggio_velo (2 raggi diagonali) | P1 |
| raffica_duellante | Raffica del duellante | `raffica`: ogni 8° colpo una raffica di 6 in 0,25 s al 100% (conta nel tetto dei 20/s) | Fucina | 2 | La sequenza del duellante della Reggia: sette finte e una stoccata vera | otre_bucato (una raffica ogni 0,5 s → cap 20), occhi_gatto (raffica doppia), palla_cannone (6 palle di fila) | P1 |
| pedale_forgia | Pedale della forgia | `carica`: sovrascrive l'auto-fuoco: tenendo premuto 1,5 s il colpo va da 0,1× a 4×; col Raggio del Velo: raggio tirabile a qualunque carica, danno proporzionale | Ricordo | 3 | Il pedale che azionava il mantice grande: più lo spingi, più la fiamma sale | raggio_velo (caso rovesciato: controllo del tempo), stoccata_corta (4× a bruciapelo = 12×), mangiafuoco_dante (anti lieve: due cariche; vince il Mangiafuoco, +1 U) | P1 |
| fuoco_artificio | Fuoco d'artificio | `grappolo`: la scintilla vola ad arco e scoppia in 6-11 schegge al 66%; Danno +1 U e ×1,5; delay ×2 + 11 tick | Ricordo 0,5 | 4 | Il razzo della festa della Reggia che non partì: Ferruccio lo accende adesso | raggio_velo (#12: 4-7 raggi corti), alone_lanterna, palla_cannone (schegge da 13), veleno_regina (6-11 dadi) | P1 |

### 3.E Famigli (8: 1 MVP, 7 P1; quattro classi, §2.11)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| gatto_ombra | Gatto d'ombra | famiglio **spara-fisso**: 3,5 danni a 1,9/s nella direzione della tua mira; non legge stat né flag; segue a 1 casella; tag `gatto` | Ricordo 0,5 · Fucina 0,5 | 1 | Uno dei gatti evocati dal Gatto dei Quattro Canti, rimasto a seguire Ferruccio come un ricordo di casa | compagnia_maschere (×2 = 7), set Gatto (pezzo), scatola_musicale (i suoi colpi svegliano), foglia_villa (dorme con te) | MVP |
| riflesso_pozzanghera | Riflesso nella pozzanghera | famiglio **clone**: `colpo = resolve(giocatore) × 0,75`, stessa arma, flag e numero (esclude le op `per: shot`); segue a 1 casella, spara quando spari; col Raggio carica con te | Pegni 0,5 | 4 | Il riflesso che Ferruccio vide in una pozzanghera di Corso Trieste, sotto la pioggia: ripete ogni gesto, mezzo secondo dopo | raggio_velo (secondo raggio al 75%), palla_cannone (14,8 per colpo), compagnia_maschere (×1,5 → 1,125), eco_quattro_canti / nuca_dipinta (non li copia), due_maschere (3 cloni: budget dei 60 proiettili) | P1 |
| due_maschere | Due maschere | 2 cloni a 0,375× ciascuno (= 0,75 totale), ai due lati di Ferruccio | Pegni | 3 | Le due maschere bianche dei cortigiani della Reggia: ridono quando ridi | riflesso_pozzanghera, compagnia_maschere (×1,5 ciascuno) | P1 |
| pipistrello_amico | Pipistrello amico | famiglio **orbita-blocca**: orbita a 1 casella, 2 danni a contatto 3 volte/s (6/s), blocca 1 proiettile per passaggio | Ricordo | 1 | Un pipistrello della Villa che ha scambiato il cappello a cono per un campanile | compagnia_maschere (4 danni), lampioncino_carta (due orbite che non si toccano), guardia_ferro | P1 |
| ratto_ammaestrato | Ratto ammaestrato | famiglio **morde**: insegue il nemico più vicino, 1,5 danni ogni 0,3 s a contatto (5/s); non tocca i boss se c'è un comune | Boss (sblocco: battere Ratking) | 2 | Un ratto delle Cisterne Sepolte addomesticato con una crosta di pane cafone | sguardo_madre (morde i fermi), compagnia_maschere (3 danni), serenata_agnese, set Ratking (pezzo), zanna_ratto | P1 |
| scugnizzo_piazza | Scugnizzo di Piazza Dante | famiglio **raccoglie**: raccoglie i centesimi che tocca; ogni 3 centesimi dati restituisce un pickup casuale (½ maschera 40%, sigillo 25%, martellata 25%, consumabile 10%) | Fucina | 1 | Un monello della piazza che non dorme mai: scambia tutto con tutti | borsellino_tonino (25 centesimi = 8 pickup), calamita_fabbro, medaglione_rosa (anti lieve: i centesimi che prende lui non contano) | P1 |
| vespa_sciolta | Vespa senza Regina | famiglio **spara-fisso** autonomo: punge chi entra nel raggio di 3 caselle, 2,5 danni a 2/s, ignora le buche; non segue la mira | Pegni 1,0 · Ricordo 0,5 | 2 | Una vespa reale che ha perso la Regina dei Debiti e il suo debito con lei | compagnia_maschere (5 danni), ultima_maschera (copre la fuga), foglia_villa (dorme con te) | P1 |
| compagnia_maschere | Compagnia di maschere | famigli fissi ×2, cloni ×1,5 (Riflesso 0,75 → 1,125; Due maschere 0,56 ciascuno) | Ricordo | 3 | Il cartellone della compagnia di Pulcinella che recitò alla festa: tutti insieme, nessuno da solo | tutti i famigli (gatto_ombra 7, ratto 10/s, vespa 10/s); non tocca gli orbitali | P1 |

### 3.F Orbitali (3: 1 MVP, 2 P1; DPS ≤ 24 = 2,5× la scintilla base)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| lampioncino_carta | Lampioncino di carta | 1 orbita a 1,5 caselle, **6 danni per tocco 4 volte/s (24/s)**, blocca i proiettili nemici | Pegni 1,0 · Ricordo 0,5 | 3 | Una lanterna di carta della festa, appesa a un filo che gira da solo | pipistrello_amico (seconda orbita), giostra_festa (due anelli), set Tessitrice (il filo lascia fili) | MVP |
| sfere_madre | Sfere della Madre | 2 sfere azzurre a 2 caselle, 3 danni per tocco 4 volte/s ciascuna (24/s in tutto), bloccano i proiettili | Boss (sblocco: battere la Madre) | 2 | Le due sfere che orbitavano attorno alla Madre di Marmo: ricordi degli operai che non vogliono cadere | lampioncino_carta (3 orbite su 2 raggi), punzone_gf (no: il flat vale solo per il colpo) | P1 |
| coccarda_borbonica | Coccarda borbonica | 1 orbita larga a 3 caselle, 8 danni per tocco 3 volte/s (24/s), blocca; ogni 10 proiettili bloccati +½ maschera di cera | Edicola | 2 | Coccarda rossa e oro dalle giubbe della festa: gira larga come una ronda | candele_edicola, guardia_ferro (più proiettili bloccati = più cera), mascheroni (4 getti = cera gratis) | P1 |

### 3.G Salute e contenitori (9: 7 MVP, 2 P1; tetto 12 contenitori)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| targa_operai | Targa degli operai | +1 contenitore (cura 1); portata dell'affondo +30% (110 → 143 px) | Boss 1,0 · Edicola 0,5 | 3 | La targa commemorativa di Piazza Dante senza il nome di Gaetano: Ferruccio la colpì con la spada | stoccata_corta (affondo lungo e ×1,5), punta_diamante (tutti nei 143 px), elsa_bilanciata (+45%, il massimo), anello_borbone (si compensano) | MVP |
| zeppola_giuseppe | Zeppola di San Giuseppe | +1 contenitore, cura 1 | Boss | 1 | Dolce di marzo venduto da Tonino anche a ottobre: "la festa è quando capita" | — (è la cura semplice del Boss pool) | MVP |
| pane_cafone | Pane cafone | +1 contenitore (nessuna cura) | fallback (nessuna pool) | 0 | Una pagnotta dura del forno di Via San Carlo: quando non c'è più niente, c'è il pane | **fallback assoluto**: pool vuota → Ricordo → pane_cafone (il Breakfast di Isaac) | MVP |
| pastiera_rosa | Pastiera di Rosa | +2 contenitori, cura completa | Boss | 2 | La pastiera che Rosa faceva a Pasqua: Tonino ne ricorda il profumo prima del nome | medaglione_rosa (stesso filo, nessuna regola), anello_borbone (+1 netto) | MVP |
| sanguinaccio | Sanguinaccio | +1 contenitore, cura 2,5 maschere, Passo +0,3 | Fucina | 2 | Crema di sangue e cioccolato di Carnevale: fa bene al cuore e alle gambe | scarpe_silenziose (Passo 1,6 = clamp), stivali_tempra | P1 |
| lardo_mercato | Lardo del Mercato | +2 contenitori (nessuna cura), Passo −0,2 | Fucina | 1 | Un pezzo di lardo dai Vicoli del Mercato: pesa quanto protegge | sprone_cocchiere (annulla il malus), sanguinaccio (Passo in pari) | P1 |
| candele_edicola | Candele dell'Edicola | +3 maschere di cera (si consumano prima delle rosse; non contano come danno per la porta del Banco/Edicola); Fiato T +0,35 | Edicola | 2 | Tre candele votive accese sotto la Madonnina di Corso Trieste | coccarda_borbonica (ricarica la cera), Banco (3 cera = 1 oggetto senza perdere contenitori), fiocco_velo_oro (la cera prende i colpi: resti "pieno"), ultima_maschera | MVP |
| settima_vita | Settima vita del Gatto | i contenitori rossi scendono a **1**; **7 vite**: alla morte rinasci nella stessa stanza con 1 maschera, −1 vita; le maschere di cera restano; tag `gatto` | Pegni 0,5 | 3 | 'O gatto tene sette vite: il Gatto dei Quattro Canti ne presta sei a chi lo batte | ultima_maschera (sempre attiva: +1,5 U e Passo +0,2 fissi), candele_edicola (la cera è la vera vita), anello_borbone (nessun contenitore da togliere), set Gatto (pezzo), mantice_fabbro (quasi inutile: pick da lasciare) | MVP |
| medaglione_muto | Medaglione muto | +2 contenitori (nessuna cura); Sorte −1 | Bivio di Tonino ("ricordo non restituito") | 2 | Il medaglione con il ritratto di Rosa che Ferruccio ha tenuto per sé: Tonino sorride e non sa perché | medaglione_rosa (ramo opposto, mai insieme), anello_borbone, corno_rosso | MVP |

### 3.H Economia, Sorte e utilità (9: 4 MVP, 5 P1)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| borsellino_tonino | Borsellino di Tonino | +25 centesimi subito | Fucina | 0 | La borsa di tela del banchetto: Tonino la regala a chi "tiene la faccia giusta" | medaglione_rosa (+1,0 U e una maschera e mezza), scugnizzo_piazza (8 pickup), cassetta delle offerte (+50% Edicola) | MVP |
| piastra_argento | Piastra d'argento | centesimi a 99 | Segreta 0,5 | 3 | Una piastra da 120 grana coniata per la festa: nessuno a Caserta ha il resto | medaglione_rosa (+3,96 U: Danno 3,50 → 8,43), Fucina (l'oggetto di ogni piano più tutti i pickup), chiave_cassetta | MVP |
| chiave_cassetta | Chiave della cassetta | Fucina e Banchetto −50% | Fucina | 2 | La chiave della cassetta delle offerte di Gaetano: lui la usava per il resto, non per sé | borsellino_tonino (25 centesimi = 3 oggetti in 3 piani), Tonino (−30% sommato: −80%) | P1 |
| salvadanaio_terracotta | Salvadanaio di terracotta | ogni colpo subito: 1-2 centesimi | Fucina | 1 | Il porcellino di creta di Bianca, incrinato ma pieno | medaglione_rosa (i colpi ti rendono più forte), incudine_gaetano, soldo_bucato (3 centesimi a colpo) | P1 |
| zampa_coniglio | Zampa di coniglio | Sorte +1; le Boccette dello speziale negative diventano positive | Fucina | 2 | Zampa di coniglio di Tonino, "benedetta a Montevergine": sfortuna non ne passa | boccetta_speziale (mai un malus), pietra_focaia (in pari), corno_rosso (Sorte 3: veleno 62,5%) | P1 |
| cambiale_regina | Cambiale della Regina | ricompensa di fine stanza raddoppiata, ma 33% di nulla; i prezzi del Banco salgono di 1 maschera di cera | Pegni | 3 | Una cambiale firmata alla Regina dei Debiti: il doppio oggi, il conto domani | fazzoletto_giglio (10% maschera: doppia), scugnizzo_piazza, ultima_maschera | P1 |
| reggia_miniatura | Reggia in miniatura | **2 oggetti a scelta** in ogni Stanza del Ricordo (l'altro sparisce e torna in pool a peso ×0,5) | Ricordo 0,7 · Edicola 0,5 | 3 | Il modellino della Reggia di Vanvitelli con le stanze che si aprono: scegli da quale entrare | tombola_ricordo (2 oggetti rerollati), pity di danno (già 2 scelte: diventa 3) | MVP |
| disegno_reggia | Disegno della Reggia | mappa di ogni piano rivelata all'ingresso (stanze, non il tipo) | Fucina | 1 | Una pianta del palazzo disegnata da Bianca a sette anni: le stanze ci sono tutte, le porte no | spago_lettera (anche i tipi), lettera (ridondante: +0,5 U), carrozza_violante | MVP |
| polvere_santabarbara | Polvere della Santabarbara | martellate: raggio ×1,5, danno 60 → 90; la Bomba carta 25 → 40 | Fucina | 1 | Polvere nera della Caserma, asciutta e fine: la martellata diventa un botto | bomba_carta, chiodo_fabbro (più ostacoli rotti per martellata), velo_seta (autodanno ½) | P1 |

### 3.I Difensivi e volo (5: 3 MVP, 2 P1)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| giglio_spezzato | Giglio spezzato | il primo colpo subito in ogni stanza è annullato (reset all'ingresso); cumulabile con sciarpa_agnese (2); vale anche per l'autodanno | Edicola 0,2 · Ricordo 0,1 | 4 | Il giglio d'oro del Custode, incrinato: la volontà di Gregorio che protegge ancora qualcuno | sciarpa_agnese (2 colpi), fiocco_velo_oro (resti "a vita piena"), applauso_piazza (il colpo annullato non spezza la striscia), porta del Banco (nessun danno rosso = 99%), Bianca (innato) | MVP |
| fibbia_guardia | Fibbia della guardia | parata: finestra 0,18 → 0,22 s, riflesso ×2 → ×3; per i personaggi senza parata (Gaetano, Agnese, Taddeo) **dà la parata** base | Fucina | 2 | La fibbia del cinturone di Gregorio da capitano, prima del giglio | guardia_ferro (parata a distanza + a contatto), sciarpa_annodata (riflesso ×3 per 1 s), Gaetano (la sua prima difesa) | MVP |
| velo_seta | Velo di seta | ogni colpo che toglierebbe più di ½ maschera ne toglie ½ (dal piano 7 della Notte intera, dai champion rossi e dalle esplosioni) | Edicola 0,2 | 4 | Un metro della seta di San Leucio che Violante usava per far riposare chi era in lutto | petardo / botto_festa (autodanno ½), lanterna vagante (esplosione ½), fiocco_velo_oro | P1 |
| mantello_munaciello | Mantello del Munaciello | **volo**: passi sopra buche e ostacoli (non i muri); Passo +0,1 | Edicola 1,0 · Segreta 0,5 | 3 | Il mantello rosso del Munaciello, lo spiritello di casa che entra dove vuole | lembo_velo (tu e il colpo passate tutto), spola_scheggiata, giostra_festa, set Gatto a 3 pezzi (già vola: +1 U) | MVP |
| foglia_villa | Foglia della Villa | fermo da 1,0 s **senza sparare né guidare la lucciola**: `detection` 0% (i nemici perdono il bersaglio) finché non ti muovi; **nessuna invulnerabilità** ai proiettili già in volo e al contatto; famigli e orbitali dormono; il primo colpo dopo l'immobilità ×1,5 | Ricordo | 1 | Una foglia di magnolia della Villa Comunale: chi sta fermo sotto l'albero non viene visto | raggio_velo (la carica da fermo non spara: resti nascosto), mangiafuoco_dante (idem), lucciola_bianca (**anti dichiarata**: guidarla ti scopre), sprone_cocchiere (anti lieve) | P1 |

### 3.J Attivi a braci (13: 8 MVP, 5 P1; braci max 12: +2 per stanza liberata, +4 per boss/Caserma, 0 per nemico; un solo attivo in mano)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| mantice_fabbro | Mantice del fabbro | **6 braci** → cura 1 maschera in 0,85 s (attivo di partenza di Ferruccio; ogni 3 stanze; prenderne un altro lo sostituisce) | innato · Fucina 0,5 | 1 | Il mantice piccolo con cui Gaetano riaccendeva la forgia la mattina: Ferruccio ci soffia dentro per respirare | fazzoletto_blu (ogni 2 stanze), ultima_maschera (anti lieve: curarsi spegne il bonus), settima_vita (quasi inutile) | MVP |
| martello_calcare | Martello del calcare | **6 braci** → colpo ad area 120 px: **10×Danno**, stordisce 0,8 s, nemici di pietra ×2; rompe muri incrinati e ostacoli senza martellate; carica 0,42 s | Pegni 0,5 · Ricordo 0,5 (sblocco: impegnare 3 volte) | 4 | Il martello da fabbro di Gaetano, incrostato di calcare delle Cisterne: la prova che tentò di salvare gli altri | occhio_brilla (il cratere scivola), fili_oro (fili 2 s), Madre di Marmo (700 con Danno 3,5 su pietra: più di un ottavo dei suoi HP), rampino_catena (peso ×0,5 se già in mano), set Ratking (pezzo) | MVP |
| rampino_catena | Rampino a catena | **2 braci** → tira a te il nemico più vicino entro 420 px e lo stordisce 0,8 s; sui boss tira Ferruccio | Boss (sblocco: battere Ratking) | 2 | La catena arrugginita con cui Ratking teneva legati i suoi ratti nelle Cisterne | stoccata_corta (tira e ×3 a bruciapelo), affondo (stordito = 2 affondi), palla_cannone (62,7 a contatto), set Ratking (pezzo), martello_calcare (×0,5 in pool) | MVP |
| registro_acque | Registro delle acque | **6 braci** → ferma torrette, statue e mascheroni e congela i proiettili in volo per 2,2 s | Bivio del Registro ("conservato") | 3 | Il registro del cantiere del 1839 che prova l'innocenza di Gaetano: la verità ferma anche le statue | sguardo_madre (i fermi restano fermi), Madre di Marmo (2,2 s di schiena scoperta), lanterna vagante (congelata a distanza), cenere_registro (ramo opposto) | MVP |
| lanterna_lanterniere | Lanterna del lanterniere | **3 braci** → pozza di fuoco di 1,5 caselle per 2 s (4 tick × 0,5·Danno a chi ci passa); **non dà la flag `brace`** | Ricordo | 2 | La lanterna del Lanterniere del Velo, che accende i lampioni di una città che dorme | brace_lanterniere (pozze ×2 = 4 s), fili_oro (nemici fermi nella pozza), rampino_catena (tira nel fuoco) | MVP |
| scatola_musicale | Scatola musicale di Bianca | **8 braci** → addormenta la stanza 3 s; il primo colpo su un dormiente ×2; i dormienti contano "sotto il 25%" per il Pugnale | Segreta 0,5 (sblocco: una run senza usare l'attivo) | 4 | La scatola musicale che Bianca promise di imparare a suonare: la melodia delle statue | pugnale + stoccata_corta (#29: affondo da 79), pistola_taddeo (×2 su tutta la fila, poi sveglia), gatto_ombra (i suoi colpi svegliano) | MVP |
| sciarpa_annodata | Sciarpa annodata | **3 braci** → parata lunga 1,0 s (riflesso ×2 su tutto ciò che arriva); dà la parata anche a chi non ce l'ha, per quel secondo | Fucina | 1 | La sciarpa rossa di Ferruccio annodata al polso: così la teneva Agnese quando lo medicava | fibbia_guardia (riflesso ×3 per 1 s), Madre di Marmo (ventaglio a 7 rimandato: 7 × 2·Danno), guardia_ferro; sblocco alternativo del #10 del concept | MVP |
| tombola_ricordo | Tombola del Ricordo | **6 braci** → **rerolla** gli oggetti sui piedistalli della stanza pescando dalla pool della stanza (l'oggetto vecchio torna in pool) | Fucina 0,5 · Segreta 1,0 | 3 | Il sacchetto dei numeri della tombola di Natale di Tonino: "si cambia, si cambia!" | reggia_miniatura (2 oggetti rerollati), Banco (rerolla anche i pegni, prezzo invariato), fazzoletto_blu (una tombola ogni 2 stanze) | P1 |
| bomba_carta | Bomba carta | **2 braci** → piazza una martellata speciale ai piedi: 25 danni in 1,5 caselle dopo 1,5 s, rompe muri incrinati; non consuma martellate | Fucina | 1 | Carta di giornale, spago e polvere nera: il botto dei ragazzi di Via Mazzini | velo_seta (autodanno ½), polvere_santabarbara (40 danni), Gaetano (anti lieve: rompe già tutto) | MVP |
| carrozza_violante | Carrozza di Violante | **2 braci** → **teletrasporto** in una stanza casuale del piano non ancora visitata (se nessuna: casuale) | Segreta | 1 | La carrozza senza cocchiere che gira per Corso Trieste da quando la città dorme | lettera / disegno_reggia (sai dove finisci), lettera_sigillata (può portare nella segreta), Custode (anti: dalla stanza del boss non si scappa) | P1 |
| campana_casertavecchia | Campana di Casertavecchia | **8 braci** → **40 danni a tutti i nemici nella stanza** (ignora l'immunità agli status; i boss ne prendono 40) | Pegni 1,0 · Ricordo 0,5 | 3 | Un battaglio delle campane di Casertavecchia, che custodiscono le parole mai dette | pagina_strappata (5% gratis quando colpito), brace_vendetta, Gatto dei Quattro Canti (400 HP: 10% a rintocco, uno ogni 4 stanze) | P1 |
| maschera_pulcinella | Maschera di Pulcinella | **3 braci** → per la stanza: Danno +2,0 U, Passo +0,2; **trasformazione temporanea**: Ferruccio diventa tutto nero, `detection` 50%; +12,5% porta del Banco al piano | Pegni | 2 | La maschera nera intera, quella vera della festa: chi la indossa non ha più faccia da perdere | ultima_maschera (somma: +3,5 U), lembo_velo (35% di notarti), fiocco_velo_oro | P1 |
| cambiale_sangue | Cambiale di sangue | **1 brace** → paghi ½ maschera rossa: Danno +1 U per la stanza (cumulabile 3 volte); non si può usare sotto 1 maschera | Pegni | 2 | Una cambiale della Regina dei Debiti firmata col sangue: scade a fine stanza | ultima_maschera (ti porta a 1 e ti premia), candele_edicola (la cera non paga: serve rosso), salvadanaio_terracotta (no: non è un colpo subito) | P1 |

### 3.K Ninnoli (11: 6 MVP, 5 P1; uno in tasca; il 2% è dorato con effetto ×2)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| fazzoletto_giglio | Fazzoletto col giglio | 10% dei drop di fine stanza forzati a maschera (½ al 60%) | Drop · Fucina 0,5 | 1 | Il fazzoletto di seta ricamato da Bianca: Violante ci sentiva la voce della figlia | cambiale_regina (doppio), sblocco di Bianca (morire con questo dopo la Madre), mantice_fabbro | MVP |
| fazzoletto_blu | Fazzoletto blu | +1 brace a ogni stanza liberata (3 invece di 2: +50%) | Drop · Fucina | 1 | Il fazzoletto azzurro che Agnese lasciò sul telaio il giorno del primo incontro | mantice_fabbro (una cura ogni 2 stanze), rampino_catena (una stanza = una tirata e mezza), scatola_musicale (ogni 3 stanze) | MVP |
| pugnale | Pugnale | sui bersagli sotto il 25% degli HP (e sui dormienti): Danno ×1,5 per quel colpo | Bivio di Taddeo ("accusato") | 2 | Il pugnale che Taddeo portava sotto la giubba il giorno del tradimento | scatola_musicale (#29), raggio_velo (gli ultimi tick ×1,5), palla_cannone (il residuo del colpo ×1,5), sguardo_madre (nessun bonus sui pietrificati) | MVP |
| chiodo_fabbro | Chiodo del fabbro | 33% di 1 centesimo da ogni ostacolo rotto | Drop · Fucina | 0 | Un chiodo forgiato da Gaetano, ritrovato nella Villa | Gaetano (rompe tutto gratis), martello_calcare, calcare_cisterne, polvere_santabarbara | MVP |
| corno_bue | Corno di bue | Danno +2,0 flat post (ignora i moltiplicatori) | Drop | 2 | Il corno da richiamo del bufalaro di Capua: suona basso e picchia forte | otre_bucato (2,7 per scintilla a 15/s = 40 DPS), palla_cannone (dopo il ×2) | P1 |
| zanna_ratto | Zanna di ratto | 10% `velenosa` fisso (si somma: 35% + 12,5%·Sorte) | Drop · Boss 0,5 (Ratking) | 1 | Un dente di Ratking, giallo e lungo un dito | veleno_regina, ratto_ammaestrato, set Ratking (pezzo) | P1 |
| pagina_strappata | Pagina strappata | 5% a ogni colpo subito: l'effetto della Campana (40 a tutti) | Drop · Segreta 0,5 | 1 | Una pagina del registro del 1839 strappata da Taddeo | campana_casertavecchia, incudine_gaetano, salvadanaio_terracotta | P1 |
| soldo_bucato | Soldo bucato | 1 centesimo a ogni colpo subito | Drop | 0 | Un tornese bucato portato al collo contro la iettatura: non ha funzionato | salvadanaio_terracotta (3 a colpo), medaglione_rosa | P1 |
| ferro_cavallo | Ferro di cavallo | Sorte +10 finché non vieni colpito nel piano (poi 0 fino al piano dopo) | Drop · Fucina 0,5 | 2 | Un ferro perso dai cavalli della carrozza di Violante, trovato con la punta verso l'alto | veleno_regina (100%), eco_quattro_canti (75%), brace_lanterniere (esplosione al cap 25%, non si spegne da sola), giglio_spezzato (il colpo annullato non lo spegne), applauso_piazza (stessa condizione) | P1 |
| spago_lettera | Spago della lettera | 25% a ogni piano: minimappa con le stanze speciali segnate (bussola) | Drop · Fucina 0,5 | 1 | Lo spago che chiudeva la lettera di Agnese custodita da Tonino | lettera / disegno_reggia (mappa + bussola), carrozza_violante, Bivio di Tonino "restituito" (100%) | MVP |
| biglietto_mariella | Biglietto di Mariella | Sorte +2; i sonnambuli ti notano al 50% | Bivio di Taddeo ("perdonato") | 2 | Le righe che Mariella scrisse prima del Velo, quando aveva ancora paura e voleva viaggiare (bibbia §IX) | pugnale (ramo opposto, mai insieme), corno_rosso (Sorte 4), veleno_regina (50%) | MVP |

### 3.L Consumabili (17: 4 MVP, 13 P1; i numeri della Smorfia sono le carte: 12, ciascuno 1/12 dell'8% di drop "carta")

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| mozzarella | Mozzarella | cura 1 maschera (si raccoglie subito; in tasca se a vita piena) | Drop · Fucina 5 cent | — | La mozzarella di Tonino: "magari sotto 'sta maschera ce sta ancora qualcuno" | Tonino (infinita, ricarica 60 s), fiocco_velo_oro (torna a vita piena) | MVP |
| lettera | Lettera | rivela la mappa del piano (stanze, non il tipo) | Drop · Fucina 5 cent | — | Una lettera senza indirizzo lasciata sotto un lampione di Piazza Dante | spago_lettera (anche i tipi), disegno_reggia (rende la Lettera inutile), carrozza_violante | MVP |
| lettera_sigillata | Lettera sigillata | rivela la stanza segreta del piano e la segna sulla minimappa | Drop · Fucina 0,5 | — | Sigillo di ceralacca con il giglio: dentro c'è una pianta della Reggia | tombino delle Cisterne (lo segna se sul piano), carrozza_violante | MVP |
| carta_reale | Carta reale | apre una porta chiusa (grata) senza sigillo; vale anche per la Caserma | Drop · Fucina 5 cent | — | Un lasciapassare col timbro dei Borbone: a Caserta apre tutto tranne la Reggia | Ricordo dal piano 2 (al posto del sigillo), Caserma dei Cortigiani | MVP |
| smorfia_1 | Smorfia 1 — L'Italia | ti riporta alla stanza di partenza del piano | Drop | — | 'A Talia: il numero di chi torna a casa | carrozza_violante (andata e ritorno), Fucina (torni a comprare) | P1 |
| smorfia_8 | Smorfia 8 — 'A Maronna | +2 maschere di cera | Drop · Edicola 0,5 | — | La Madonna: otto come le candele dell'Edicola di Corso Trieste | candele_edicola, Banco (3 cera = 1 oggetto), coccarda_borbonica | P1 |
| smorfia_13 | Smorfia 13 — Sant'Antonio | Sorte +3 fino alla fine del piano | Drop | — | Sant'Antonio, il numero che si gioca per ritrovare quel che si è perso | veleno_regina (62,5%), drop (+9% maschere), ferro_cavallo | P1 |
| smorfia_22 | Smorfia 22 — 'O pazzo | tutti i nemici nella stanza confusi 4 s | Drop | — | Il pazzo: per un momento non sanno più dov'è la porta | vino_festa (stesso effetto a colpi), scatola_musicale | P1 |
| smorfia_33 | Smorfia 33 — Ll'anne 'e Cristo | cura completa + 100 danni a tutti i nemici nella stanza + mappa del piano | Drop · Segreta 0,5 | — | Gli anni di Cristo: il numero della grazia ricevuta | ultima_maschera (anti: ti cura), Gatto dei Quattro Canti (400 HP: un quarto) | P1 |
| smorfia_42 | Smorfia 42 — 'O ccafè | Fiato T +1,0 per la stanza | Drop | — | Il caffè: per una stanza le mani non stanno ferme | lucciole_villa (T 1,7 → 4,8/s), otre_bucato (cap 15: +0,5 U) | P1 |
| smorfia_47 | Smorfia 47 — 'O muorto | 40 danni a tutti i nemici nella stanza | Drop | — | Il morto: il numero più giocato a Caserta la notte del Velo | campana_casertavecchia (stesso effetto in tasca), pagina_strappata | P1 |
| smorfia_48 | Smorfia 48 — 'O muorto che parla | rivela la segreta e il tombino delle Cisterne e li segna sulla minimappa | Drop | — | Il morto che parla: dice dove ha nascosto la roba | lettera_sigillata (ridondante), carrozza_violante | P1 |
| smorfia_62 | Smorfia 62 — 'O muorto acciso | uccide tutti i nemici comuni sotto il 50% degli HP nella stanza | Drop | — | Il morto ammazzato: chi era già mezzo andato se ne va del tutto | pugnale (i superstiti sono sopra il 50%), veleno_regina (porta tanti sotto la soglia) | P1 |
| smorfia_75 | Smorfia 75 — Pullecenella | 6 s di invulnerabilità al contatto e ai proiettili (non alle buche) | Drop | — | Pulcinella: il numero di chi ride mentre le prende | stoccata_corta (6 s a bruciapelo senza rischio), raggio_velo (carica libera), Custode (fendente ignorato) | P1 |
| smorfia_77 | Smorfia 77 — 'E diavule | la porta del Banco dei Pegni compare di sicuro dopo il prossimo boss (anche con danno subito) | Drop · Pegni 0,5 | — | I diavoli: quando li chiami, vengono | Edicola (persa per la run se impegni), maschera_pulcinella (+12,5%: inutile) | P1 |
| smorfia_85 | Smorfia 85 — Ll'aneme d'o Priatorio | +3 maschere di cera | Drop · Edicola 0,5 | — | Le anime del Purgatorio: chiedono una candela e ne lasciano tre | candele_edicola (6 di cera: 2 oggetti al Banco senza contenitori), fiocco_velo_oro | P1 |
| boccetta_speziale | Boccetta dello speziale | pillola non identificata (13 colori a run): Fiato ±0,35 · Danno ±0,5 U · Misura ±1,5 · Passo ±0,15 · Sorte ±1 · cura completa · +1 contenitore · −1 contenitore · teletrasporto · 8 braci · 2 cera · sonnambulo per 3 s · "tutto sfocato" 10 s; 24 positive / 14 neutre / 12 negative | Drop · Fucina 5 cent | — | Boccette senza etichetta dalla spezieria di Via San Carlo: lo speziale dorme, chi beve indovina | zampa_coniglio (mai negative), set Smorfia (3 numeri o boccette ingoiati → +1 contenitore), tombola_ricordo | P1 |

### 3.M Condizionali (8: 5 MVP, 3 P1; trigger di §2.10)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| sciarpa_agnese | Sciarpa di Agnese | `once_per_room`: il primo colpo subito in ogni stanza è annullato; Passo +0,3; flag `fili` | Ricordo 1,0 · Edicola 0,5 | 3 | La sciarpa rossa che Agnese tesseva per Ferruccio: "contro il malocchio", diceva | giglio_spezzato (2 colpi a stanza), spola_oro / telaio_agnese (fili già innata: +1 U), fili_oro (+1 U), petardo / botto_festa (annulla il primo autodanno), set Tessitrice (pezzo) | MVP |
| medaglione_rosa | Medaglione di Rosa | `coins`: +0,04 U per centesimo posseduto (max +3,96 a 99: Danno 3,50 → 8,43); ogni 15 centesimi raccolti +½ maschera; Sorte +1 | Bivio di Tonino ("ricordo restituito") | 2 | Il medaglione con il ritratto di Rosa che Tonino non riconosceva più | piastra_argento (subito al massimo), borsellino_tonino, chiave_cassetta (spendi meno, resti forte), Fucina (anti lieve: ogni acquisto costa Danno), medaglione_muto (ramo opposto) | MVP |
| ultima_maschera | Ultima maschera | `low_hp`: mentre le maschere rosse piene sono ≤ 1: Danno +1,5 U, Passo +0,2, scintille rosse | Pegni | 3 | L'ultima maschera di Pulcinella rimasta sul banco della festa: chi non ha più niente combatte meglio | settima_vita (sempre attiva), candele_edicola (la cera davanti: la rossa resta a 1), cambiale_sangue, mantice_fabbro / smorfia_33 (anti lieve), maschera_pulcinella (+3,5 U) | MVP |
| furia_pulcinella | Furia di Pulcinella | `on_hit_taken`: per 5 s dopo ogni colpo subito, Fiato T +1,0 | Boss | 2 | Il bastone di Pulcinella: le prende e le rende più in fretta | salvadanaio_terracotta, incudine_gaetano (colpo subito = Danno e Fiato), lucciole_villa (T 1,7 → 4,8/s per 5 s) | MVP |
| applauso_piazza | Applauso della piazza | `room_clean_streak`: entrando in una stanza con nemici +0,5 U per ogni stanza del piano pulita senza danno (max +3 U); si azzera se colpito | Ricordo | 2 | L'applauso dei cittadini addormentati che Ferruccio sente in sogno quando non sbaglia | ferro_cavallo (stessa condizione), giglio_spezzato (il colpo annullato non azzera), sciarpa_agnese | MVP |
| fiocco_velo_oro | Fiocco del Velo d'oro | `full_hp`: a vita rossa piena Danno ×2 (gruppo `x2_cond`); Slancio −0,3; +1 maschera d'oro (mezza) | Edicola 0,5 | 4 | Un fiocco del Velo della Concordia: brilla solo su chi non soffre | giglio_spezzato / sciarpa_agnese (restare pieni), candele_edicola (la cera prende i colpi), velo_seta, mozzarella (torna pieno), ultima_maschera (opposti: mai insieme) | P1 |
| incudine_gaetano | Incudine di Gaetano | `on_hit_taken`: ogni colpo subito +0,5 U fino a +3 U per piano (si azzera al piano dopo) | Ricordo | 2 | L'incudine della forgia dei Ferraro: ogni botta che prendi, lei la ricorda | furia_pulcinella, salvadanaio_terracotta, soldo_bucato, settima_vita (7 vite di botte), pagina_strappata | P1 |
| brace_vendetta | Brace della vendetta | `on_kill`: ogni 15 uccisioni +1 maschera di cera; ogni 5 uccisioni +1 brace | Pegni | 2 | Un tizzone della forgia che non si spegne finché Ferruccio non ha trovato il colpevole | mantice_fabbro (si ricarica in 2 stanze), campana_casertavecchia, topaie e ratti (uccisioni facili: 1 cera a topaia) | P1 |

### 3.N Trasformazioni a set (3: 1 MVP, 2 P1; `set_tag` contato da `resolve()`)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Pezzi | Fase |
|---|---|---|---|---|---|---|---|
| set_gatto_quattro_canti | Gatto dei Quattro Canti | **2 pezzi `gatto` = richiamo** [MVP]: occhi gialli, scatto a 2 cariche; **3 pezzi = trasformazione** [P1]: volo sopra buche e ostacoli, 66% a ogni colpo a segno di evocare un gatto d'ombra temporaneo (3,5 a contatto, 5 s, max 6), coda e orecchie | — (set) | — | Chi raccoglie i ricordi domestici che il Gatto custodiva diventa lui stesso il Gatto dei Quattro Canti | MVP: occhi_gatto, dente_gatto, gatto_ombra, scarpe_silenziose (4); P1: + artiglio_quattro_canti, settima_vita (6); mantello_munaciello (volo doppio: +1 U), stivali_tempra (scatti a 0,40 s) | MVP / P1 |
| set_ratking | Ratking | con 3 pezzi "ratto/Cisterne": i ratti nemici diventano **amici** (mordono 1,5/0,3 s), le topaie generano ratti tuoi; +1 maschera di carbone; corona di code | — (set) | — | Il re dei ratti delle Cisterne Sepolte riconosce chi porta la sua catena, la sua zanna e il suo tufo | ratto_ammaestrato, zanna_ratto, rampino_catena, schegge_tufo, martello_calcare, otre_bucato, calcare_cisterne (7); topaie (6 HP = fabbriche di alleati) | P1 |
| set_tessitrice | Tessitrice | con 3 pezzi "filo/seta": ogni colpo lascia un filo d'oro a terra per 2 s (nemici al 60%), flag `fili` innata (+1 U se già posseduta), Misura +1,5; fili d'oro ai polsi | — (set) | — | La Tessitrice di Pietra riconosce la sua seta: chi la porta tesse il Velo a rovescio | fili_oro, spola_oro, telaio_agnese, ago_tessitrice, sciarpa_agnese, lembo_velo, velo_seta, fiocco_velo_oro, spola_scheggiata, lampioncino_carta (10); martello_calcare (fili 2 s + cratere) | P1 |

Variante a costo zero (non conta): **set Smorfia** = 3 numeri della Smorfia o Boccette ingoiati nella run → +1 contenitore ("'A furtuna"), come l'Adult di Isaac.

### 3.O Reliquie dell'Edicola (3: 1 MVP, 2 P1; la pool angelo deve poter dare danno)

| id | Nome | Effetto (numeri) | Pool | Q | Lore | Interazioni note | Fase |
|---|---|---|---|---|---|---|---|
| aureola_festa | Aureola della festa | Danno +1,5 U; Fiato T +0,35; Misura +2,5 | Edicola | 2 | Il cerchio dorato di cartone del costume da angelo della processione: pesa niente, brilla molto | giglio_spezzato (l'Edicola non è più solo difesa), carbone_forgia (Misura 9) | MVP |
| giglio_oro_madonnina | Giglio d'oro della Madonnina | flag `inseguitrice`; Danno **×2** (gruppo `x2_sacro`); Slancio −0,25; +1 maschera d'oro (mezza) | Edicola 0,3 | 4 | Il giglio d'oro appeso al collo della Madonnina di Corso Trieste: il contrario del giglio del Custode | occhio_brilla (già presente: +1 U), raggio_velo (#1 e ×2: la build dell'Edicola), dente_gatto (×3 in tutto), fiocco_velo_oro (×4 a vita piena: la build "santa") | P1 |
| luce_madonnina | Luce della Madonnina | 10% + 5%·Sorte per colpo a segno: un raggio di luce dall'alto fa 3×Danno in 1 casella | Edicola | 3 | La luce che scende sull'edicola votiva quando passa la processione: chi è sotto, lo sa | otre_bucato (1,5 raggi/s), corno_rosso (20%), punta_diamante (un dado per nemico attraversato), raggio_velo (un dado per tick) | P1 |

### 3.P Totali

| | Voci | MVP | P1 |
|---|---|---|---|
| A Statistiche pure e trasformazioni | 24 | 17 | 7 |
| B Flag del colpo | 22 | 14 | 8 |
| C Sostituti d'arma | 10 | 4 | 6 |
| D Multi-colpo | 9 | 4 | 5 |
| E Famigli | 8 | 1 | 7 |
| F Orbitali | 3 | 1 | 2 |
| G Salute e contenitori | 9 | 7 | 2 |
| H Economia, Sorte e utilità | 9 | 4 | 5 |
| I Difensivi e volo | 5 | 3 | 2 |
| J Attivi a braci | 13 | 8 | 5 |
| K Ninnoli | 11 | 6 | 5 |
| L Consumabili | 17 | 4 | 13 |
| M Condizionali | 8 | 5 | 3 |
| N Trasformazioni a set | 3 | 1 | 2 |
| O Reliquie dell'Edicola | 3 | 1 | 2 |
| **Totale** | **154** | **80** | **74** |

- **Per tipo** (`kind`): passive 100 (A, B, D, F, G, H, I, M, O e i 3 set), weapon 10, active 13, familiar 8, trinket 11, consumable 17 (12 Smorfia + 5), transformation 3 (contate fra i passivi). Collezionabili in senso Isaac (passivi + attivi + armi + famigli) = **126**, sotto il tetto di 150 di §5.1.
- **Oggetti che toccano la forma del colpo** (B + C + D + trasformazioni + cloni + orbitali): 22 + 10 + 9 + 2 + 2 + 3 = 48 su 154 (31%); all'MVP 14 + 4 + 4 + 2 + 0 + 1 = **25 su 80 (31%)**, sopra il terzo chiesto dalla ricerca se si contano anche i condizionali che cambiano il colpo (Pugnale, Stoccata).
- **Qualità** (134 voci con qualità; i 17 consumabili e i 3 set non ne hanno): q0 4 · q1 24 · q2 53 · q3 37 · q4 16 (3% / 18% / 40% / 28% / 12%); all'MVP (75 con qualità): q0 3 · q1 13 · q2 26 · q3 26 · q4 7. Più ripida di Isaac (10/30/31/24/5) come chiede il motore. I 16 q4 hanno tutti peso 0,2-0,5 o stanno solo in Pegni/Edicola/Boss dietro sblocco; con la regola 50/90/98 ne compaiono 0,8-1,2 a run. Conteggi verificati dallo script di §6.5.
- **Pool primarie** (prima pool elencata): Ricordo 35 · Drop 26 (ninnoli e consumabili) · Fucina 24 · Pegni 19 · Boss 16 · Segreta 11 · Edicola 11 · Bivio 7 · innato 1 · fallback 1 · set 3 · Baule 0 (fusa nella Fucina). All'MVP: Ricordo 22 · Fucina 11 · Boss 10 · Pegni 8 · Drop 8 · Bivio 7 · Segreta 6 · Edicola 5 · innato 1 · fallback 1 · set 1 (i pesi effettivi a profilo nuovo sono in §5.3).
- **Attivi per costo**: 1 brace 1 (Cambiale di sangue) · 2 braci 3 (Rampino, Bomba carta, Carrozza) · 3 braci 3 (Lanterna, Sciarpa annodata, Maschera di Pulcinella) · 6 braci 4 (Mantice, Martello del calcare, Registro, Tombola) · 8 braci 2 (Scatola, Campana).
- **Bivi**: 4 Bivi × 2 rami = 8 ricompense: Registro "conservato" → Registro delle acque / "distrutto" → Cenere del registro; Taddeo "accusato" → Pugnale (+ Pistola nel Boss pool) / "perdonato" → Biglietto di Mariella; Tonino "restituito" → Medaglione di Rosa / "non restituito" → Medaglione muto; Agnese "risvegliata" → Telaio di Agnese / "lasciata dormire" → (nessun oggetto: sblocca Agnese a fine run, concept §2.9 #2).

---
## 4. Sinergie, anti-sinergie e build

**Numeri di riferimento** (salvo indicazione): Ferruccio con un Punzone G.F. (U = 1,5) → **Danno 5,86**, **Fiato 2,73/s**, DPS scintilla 16,0, affondo 17,6 ogni 0,56 s. Raggio del Velo: tick 0,6·Danno = 3,52, 9 tick = 31,6 per carica, 0,91 cariche/s → **28,8 DPS**. Colonna **Codice**: **G** = nasce dalle regole generali (OR del bitset, geometria del numero per forma, ordine delle fasi, trigger, clone×k); **C** = una cella della matrice forma×flag scritta a mano senza logica nuova; **S#n** = caso speciale n di §2.13. Fase = la più alta fra gli oggetti coinvolti.

### 4.1 Le 30 sinergie

| # | Oggetti | Cosa succede (forma · numero · danno · visivo) | Perché resta in testa | Codice | Fase |
|---|---|---|---|---|---|
| 1 | **Raggio del Velo + Occhio che brilla** | il raggio (31,6 per carica, 28,8 DPS) si **piega fino a 45°** verso il bersaglio più vicino entro 3 caselle e lo segue; un filo d'oro che si incurva come teso da una mano | un colpo largo come la stanza che non richiede mira: il giocatore smette di posizionarsi e inizia a danzare | S#1 | MVP |
| 2 | **Raggio del Velo + Pistola di Taddeo** ("Raggio di Taddeo") | la linea bianca si avvolge a spirale al raggio: Danno **×1,5** (gruppo `x1.5_arma`, cumulabile col Dente) → tick 5,27, 47,5 per carica → **43,2 DPS**; knockback 0 | due sostituti d'arma che **si fondono invece di scavalcarsi**: la pistola dell'amico dentro la luce della Reggia; icona e nome nuovi in HUD | S#2 | MVP |
| 3 | **Raggio + Tricorno + Occhi di gatto** | **4 raggi paralleli** ×0,8 → tick 2,81, 25,3 per raggio, 101 per carica; la penalità ×0,51 del Tricorno è **cancellata** → 0,91 cariche/s: **92 DPS** su un boss che li prende tutti, 23 su un gatto; senza Occhi: 3 raggi da 31,6 a 0,464/s → 44 | forma × numero: il raggio era enorme, ora è un muro; il terzo pezzo non aggiunge danno, **toglie un malus** | G | MVP |
| 4 | **Raggio + Brace del lanterniere** | ogni nemico toccato brucia: 4 tick × 2,93 = 11,7 in 2 s; sei in fila = +70 gratis per carica; nessuna esplosione (il raggio non la innesca) | un raggio che lascia una traccia nel mondo: il fuoco resta quando il raggio è finito | G | MVP |
| 5 | **Raggio + Otre bucato** | carica 0,2 s, poi **raggio continuo e sterzabile**: 1,23/tick × 15 = **18,5 DPS a uptime 100%** contro 28,8 a scatti (ciclo 1,1 s) | scambia il picco col controllo: da cannone a torcia; in Isaac era un'anti-sinergia prima di Repentance | S#7 | MVP |
| 6 | **Lucciola di Bianca + Raggio del Velo** | anello permanente del Velo di 1,5 caselle attorno alla lucciola: 15 tick/s × 1,76 = **26,4 DPS in area** + 16 dei tick della lucciola = **42 DPS senza carica**, parcheggiabile sul boss | un'arma che non si spara: si guida; due posizioni da gestire, e la tua può essere lontana dal pericolo | S#11 | P1 |
| 7 | **Raggio + Schegge di tufo** ("croce del Velo") | al primo nemico colpito nascono **2 raggi perpendicolari** a danno pieno: 3 × 31,6 = **94,9 per carica** se tutti colpiscono | la divisione non è "frammenti piccoli" ma la stessa forma raddoppiata: si impara a sparare al nemico al centro del gruppo | C | MVP |
| 8 | **Fuoco d'artificio + Raggio** | la scintilla vola ad arco e **scoppia in 4-7 raggi corti** (1,5 caselle, 3 tick da 6,3 con Danno 10,5): 76-132 per scoppio a 0,94/s → 71-124 DPS | il Raggio diventa una mina a tempo: forma nuova per un'arma che ha già una forma | S#12 | P1 |
| 9 | **Pistola di Taddeo + Spola d'oro** ("Spola perforante") | la spola attraversa la fila, 2 colpi per nemico, cadenza della Spola (1,23 lanci/s), knockback 0: **14,4 DPS per ogni nemico in fila** (4 in fila = 58) | arma di Agnese + arma di Taddeo: lore e meccanica coincidono | S#3 | MVP |
| 10 | **Pistola + Brace + Fili d'oro** | il raggio istantaneo perforante **incendia e rallenta tutta la fila**: 16 + 5,9 = 22 DPS per nemico in linea, tutti al 60% per 1,5 s | controllo della folla con un'arma da bersaglio singolo | G | MVP |
| 11 | **Pistola + Tricorno (+ Occhi di gatto)** | **3 canne parallele a 12 px** (colpiscono tutte qualunque cosa più larga di 36 px) ×0,51 → 24,5 DPS perforanti; con gli Occhi **4 canne** ×0,8 a cadenza piena → **51 DPS** su tutta la fila | il plotone: la geometria `raggio` del multishot non sparpaglia, concentra | G | MVP |
| 12 | **Pistola + Mangiafuoco** | **12 linee a ventaglio di 30°** per carica (cap 24): 12 × 5,86 = 70 per carica, 0,63 cariche/s → 44 DPS a cono, ogni linea perforante | un ventaglio di laser da fuochi d'artificio | S#13 | P1 |
| 13 | **Spola d'oro + Occhi di gatto** ("Due spole") | 2 spole a V ±15° ×0,8: a bruciapelo 4 colpi × 4,69 = 18,8 per lancio × 1,23 = **23 DPS**; a 3 caselle le V si separano e prendono 2 bersagli | da vicino concentra, da lontano copre | S#4 | MVP |
| 14 | **Spola + Veleno della Regina + Punzone** (Agnese) | ogni lancio tira **2 dadi** di veleno (Agnese Sorte 1 → 37,5% a dado → 61% per lancio); sulla Madre il Punzone aggiunge +2 per colpo su pietra → +4 per lancio | il "colpisce 2 volte" della Spola moltiplica ogni on_hit: la Spola è l'arma delle flag a probabilità | G | MVP |
| 15 | **Spola + Carbone della forgia** | cresce all'andata e conserva al ritorno: a 5 caselle +3,0 al punto d'inversione; andata (media) 7,36, ritorno 8,86 → **16,2 per lancio** contro 11,7 (+38%); la spola torna bianca di calore | un oggetto numerico che su quest'arma ha una lettura fisica: più lontano la lanci, più forte torna | C | MVP |
| 16 | **Lucciola + Brace + Fili** | la lucciola parcheggiata sul boss rinfresca brace e fili ogni 0,37 s: 16 + 5,9 = **22 DPS senza mirare** e il boss resta al 60% (`fili` passa l'immunità) | il Custode rallentato è un Custode leggibile: agisce sul pilastro "leggi, schiva, punisci" | G | P1 |
| 17 | **Lucciola + Occhi di gatto + Sguardo della Madre** | +1 lucciola che orbita a 0,75 caselle (cap 4); 15% per tick × 5,5 tick/s → un comune è **pietrificato** entro ≈ 1 s e resta tale (cap 50%; boss immuni 8 s dopo il primo) | due lucciole che inchiodano le guardie come statue | G | P1 |
| 18 | **Alone della lanterna + Occhio che brilla (+ Occhi di gatto)** | l'anello si **deforma** verso i nemici dentro: a carica piena 15 tick × 5,86 = **88 DPS** su chi è nell'anello; con gli Occhi 2 anelli ×0,8 | l'area utile di un anello che si piega è enorme: lo sanno tutti i giocatori di Isaac | S#14 | P1 |
| 19 | **Palla di cannone + Occhi di gatto** | il ×2 sparisce e il +4 diventa **+5 flat**: (5,86+5) × 0,8 = 8,69 × 2 colpi × 2,73/s = **47,4 DPS** contro 22,6 con la sola Palla; scintille ×2, **persistenti** | numero × trasformazione: la trasformazione da sola è lenta e grossa, il doppio la riporta a cadenza piena | S#5 | MVP |
| 20 | **Palla di cannone + Stoccata corta (+ Rampino)** | U 2,0 → 6,45; (6,45+4)×2 = 20,9; **×3 a 0 caselle = 62,7 per scintilla** a 1,15/s → 72 DPS a contatto; una guardia (20) muore e la scintilla **prosegue con 42,7** nel nemico dietro; il Rampino (2 braci) porta il bersaglio a bruciapelo | "massive damage", ma con un attivo che porta il bersaglio nel punto giusto: la build del fabbro che tira a sé | G | MVP |
| 21 | **Otre bucato + Carbone della forgia** | 15 scintille/s; il +0,6/casella è flat post e ignora il ×0,2: 1,17 a contatto → 5,07 a 6,5 caselle → **17,6 → 76 DPS** secondo la distanza; la scia si fa bianca e grossa mentre vola | la combo che nessuno si aspetta: l'oggetto che toglie il danno e quello che lo aggiunge per casella si parlano attraverso l'ordine delle fasi | S#6 | MVP |
| 22 | **Otre bucato + Guardia di ferro** | 15 scintille/s, ognuna **distrugge un proiettile nemico** e muore: il ventaglio da 7 della Madre sparisce in 0,5 s | la parata a distanza automatica: il verbo d'identità di Ferruccio riletto come muro di scintille | G | MVP |
| 23 | **Otre + Fili d'oro + Veleno della Regina (+ 'A paura)** | 15 dadi al secondo: veleno 25% → 3,75 proc/s = sempre avvelenato; fili al 100% → tutta la stanza al 60%; con 'A paura 2,25 fughe/s: i comuni non attaccano mai | l'Otre non è una build di danno: è una build di controllo, e lo si scopre solo con le flag a probabilità | G | MVP |
| 24 | **Giostra della festa + Eco dei Quattro Canti + Carbone** | ogni proc dell'Eco (30% a Sorte 1) aggiunge **3 scintille all'orbita** (tetto 12): a Fiato 2,73 → 2,73 × 1,9 = **5,2 scintille/s**, ≈ 9 in orbita, danno medio 12,4 (cap +6 dopo 10 caselle) → **64 DPS** su chi entra nell'anello (81 con le Lucciole: §4.3 build 9) | Pulcinella con una gonna di scintille: si smette di mirare e si cammina addosso ai nemici | S#9 | MVP |
| 25 | **Giostra + Guardia di ferro (+ Mascherone di cartapesta)** | anello di scintille (×1,75 col Mascherone) che **mangia i proiettili**: la raffica radiale del Custode (6-8 colpi) non arriva; si gira attorno al boss mentre l'anello lo tocca | lo scudo che è anche l'arma | G | MVP (Mascherone P1) |
| 26 | **Botto della Festa + Petardo** ("Botto di San Gennaro") | **immune ai propri botti**, +2 flat (non +25), nube di veleno 1,5 caselle per 2 s; niente malus di cadenza del Petardo (il Botto ha già ×0,4): 10 × (5,86+2) = 78,6 per botto a 1,09/s → 86 DPS teorici, senza più paura | la leggenda "Dr. Fetus + Ipecac ti ammazza" è in realtà una sinergia: la paura che si scioglie è memorabile quanto il danno | S#15 | P1 |
| 27 | **Botto della Festa + Sciarpa di Agnese / Giglio spezzato** | l'hook `once_per_room` non distingue la fonte del danno: il **primo autodanno** della stanza è annullato (con entrambi: 2) | "il rosso protegge dal malocchio", anche dal tuo botto: la lore spiega la meccanica | G | P1 |
| 28 | **Riflesso nella pozzanghera + Raggio + Compagnia di maschere** | il clone copia arma, flag e numero a 0,75; con la Compagnia **1,125**: due raggi che caricano insieme, 28,8 + 32,4 = **61 DPS** | un secondo Ferruccio: il famiglio che non è una torretta ma uno specchio della build | G | P1 |
| 29 | **Scatola musicale + Pugnale + Stoccata corta** | i dormienti contano "sotto il 25%": Pugnale ×1,5; primo colpo su un dormiente ×2; a bruciapelo ×3 → scintilla 5,86 × 9 = **52,7**; affondo 17,6 × 1,5 (fisso) × 1,5 × 2 = **79**: un Cavaliere (35) o il Capitano (49) in un affondo | l'esecuzione silenziosa: 8 braci per una stanza che dorme e muore in un colpo ciascuno | G | MVP |
| 30 | **"La Smorfia": Corno rosso (+2) + Medaglione di Rosa (+1) + Agnese (+1) → Sorte 4**, con Veleno, Brace, 'A paura, Eco | veleno **75%**, esplosione della brace al cap 25%, paura 35%, Eco 45% per colpo; drop di stanza: maschera dal 20% al **32%**; a Sorte 6 veleno e Eco verso il 100% | la Fortuna come convertitore di probabilità in certezza (Isaac: Tough Love 100% a 9, Mom's Eye a 5) | G | MVP |

**Conteggio**: 15 G, 2 C, 13 S; 22 [MVP], 8 [P1]. Delle 30, 24 sono "forma × numero" o "forma × flag", 4 "controllo", 2 economia/fortuna: la stessa proporzione delle 30 famose di Isaac. Sette in lista d'attesa (già previste): Stoccata + affondo (S#10), Martello del calcare + Occhio + Sciarpa (cella `contatto × inseguitrice`), Ultima maschera + Banco (scendere a 1 contenitore = +1,5 U permanenti), Applauso + Giglio spezzato, Specchio di Violante + Carbone + Punta, Ago + Raggio (S#16), Cannone + Raggio (S#17).

### 4.2 Le dieci anti-sinergie dichiarate e il loro trattamento

Tre strumenti, nell'ordine in cui Isaac li usa: **lasciar fare** (`let`: i numeri puniscono, l'icona avverte), **speciale** (`special`: una riga che trasforma o disinnesca), **vietare nella pool** (`excl_pool`: con A in mano il peso di B va a 0 o ×0,25; mai un rifiuto al pickup). Budget: ≤ 5% delle coppie rilevanti (≤ 12 su 100 oggetti); oggi 10 su ≈ 300 (3,3%). Ogni anti dichiarata ha un `fix_for`.

| # | Coppia | Cosa andrebbe storto | Trattamento | Dettaglio | `fix_for` |
|---|---|---|---|---|---|
| 1 | **Brace del lanterniere + Spola d'oro** | la spola infuocata torna in faccia | `let` + avviso | brucia Ferruccio solo se la prende **da fermo** (½ maschera); in movimento passa accanto | Sciarpa di Agnese, Giglio spezzato |
| 2 | **Petardo + Otre bucato** | 15 esplosioni/s con +25 flat che ignora il ×0,2 (390 DPS teorici) e autodanno continuo | `excl_pool` | con uno in mano l'altro ha peso 0 (entrambi rari: costo zero) | — |
| 3 | **Otre bucato + Fiato alto** (Spillo, Lucciole + Soffio) | 4,8 × 5,5 = 26 scintille/s: sopra il budget | `let` (cap) | cap per arma 15/s; l'HUD mostra "Fiato 15/s MAX" così un altro +Fiato si sa sprecato (+0,5 U per la regola del delta tagliato) | — |
| 4 | **Artiglio dei Quattro Canti + Raggio del Velo** | ×0,42 × ×1/3: 4 raggi ogni 2,6 s; 48 DPS su boss ma ritmo da sbadiglio | `let` + avviso | è "Brimstone + Anti-Gravity": si avverte, non si vieta | Occhi di gatto (cancella la penalità), Lucciole della Villa |
| 5 | **Eco dei Quattro Canti + Nuca dipinta** | un solo dado per colpo: il secondo è morto | `excl_pool` morbido | stesso gruppo `alternato`: il secondo vale +1 U; con il primo in mano il peso dell'altro è ×0,25 | — |
| 6 | **Gaetano / Agnese / Taddeo + arma innata o scavalcata** | il Martello (100) vince su tutto: il Raggio (q4, 2 maschere) varrebbe +1,5 U; per Agnese la Spola è innata; per Taddeo la Pistola | `char_filter` | i sostituti con priorità < 100 escono dalle pool di Gaetano (il peso va alle flag con riga `contatto`); Spola d'oro fuori dalle pool di Agnese (il Telaio le dà +1 U); Pistola fuori da quelle di Taddeo | — |
| 7 | **Otre bucato + Brace del lanterniere** | 15 dadi/s di esplosione addosso a chi spara da vicino (la trappola Soy Milk + Fire Mind) | `special` + avviso | l'Otre non innesca l'esplosione: resta solo la brace (tutta la stanza in fiamme, 4 tick × 0,5·0,2·Danno… poco: è un pick di controllo) | Corno rosso (no: non serve), Sciarpa |
| 8 | **Otre bucato + Gaetano** | il Martello a 2,5 danni ogni 0,6 s = 4,2 DPS contro 10,5 | `special` | riga `contatto` dell'Otre: Danno ×0,5 e ricarica ÷2 (6,3 ogni 0,47 s = 13 DPS: uno scambio vero, non una punizione) | — |
| 9 | **Ferro di cavallo + Brace del lanterniere** | Sorte +10 → esplosione al 60% → il primo autodanno azzera la Sorte: oggetto che si spegne da solo | `special` | l'esplosione ha cap 25% qualunque sia la Sorte e un solo autodanno ogni 2 s; il Ferro resta acceso finché schivi | Giglio spezzato (il colpo annullato non lo spegne) |
| 10 | **Foglia della Villa + Lucciola di Bianca / famigli / orbitali** | invisibile da fermo mentre la lucciola o i famigli vincono la stanza | `special` + avviso | guidare la lucciola o sparare rompe l'immobilità; famigli e orbitali dormono finché sei "sotto la foglia"; nessuna invulnerabilità ai proiettili già in volo | — |

**Cinque coppie rovesciate o disinnescate** (non contano come anti): Petardo + Spola / Specchio (esplode solo all'inversione, mai sul ritorno: Ipecac + My Reflection risolta); Petardo + Occhi di gatto / Tricorno (autodanno massimo ½ per lancio); Giostra + Specchio di Violante (orbitante vince: +1 U); Raggio + Pedale della forgia (raggio tirabile a qualunque carica: Chocolate Milk + Brimstone di Repentance); Pistola + Scatola musicale (il primo colpo perforante vale ×2 su ogni dormiente della fila e li sveglia tutti: un'esecuzione di gruppo). **Due declassate**: Lembo di Velo + Pistola (+1 U: pick tiepido, nessun avviso); Otre + Palla di cannone (24,8 DPS, sopra entrambi da soli: si lascia fare e si legge il pick-rate).

### 4.3 Dieci build esemplari (8-10 oggetti, conti con le formule di §2)

Riferimenti: scintilla base 9,55 DPS, affondo base 10,5 ogni 0,56 s = 18,75 DPS a contatto; mediana attesa a fine run **26-34 DPS**. HP: gatto 10, guardia 20, cavaliere 35, Capitano 49; **Gatto dei Quattro Canti 400, Madre di Marmo 550, Ratking 600, Custode 750**. Tempo sul boss = HP / (DPS × uptime), con uptime 0,6 per i proiettili, 0,5 per le armi a carica/area, 0,4 per il contatto. Tabella rapida: U 0 → 3,50 · 0,5 → 4,43 · 1 → 5,19 · 1,5 → 5,86 · 2 → 6,45 · 2,5 → 7,00 · 3 → 7,51 · 4 → 8,43 · 5 → 9,26; Fiato: T 0 → 2,73 · 0,35 → 3,07 · 0,7 → 3,45 · 1,0 → 3,80 · 1,4 → 4,33 · 1,816 → 5,0. Medaglione di Rosa: +0,04 U per centesimo (nei conti 35 centesimi → +1,4 U).

| # | Build | Personaggio | Fase | DPS principale | Custode (750) | Percentile stimato |
|---|---|---|---|---|---|---|
| 1 | Lo schermidore di Piazza Dante | Ferruccio | MVP | 32 | ≈ 39 s | P50 (la mediana) |
| 2 | Il Velo in fiamme | Ferruccio | MVP | 85 su boss / 28 su singolo | ≈ 17,6 s | P97 (jackpot a 284) |
| 3 | La mola che non si ferma | Ferruccio | MVP | 35 → 94 per distanza | ≈ 17 s | P80 |
| 4 | La spola che attraversa | Agnese | MVP | 35 + 5 di veleno | ≈ 31 s | P60 |
| 5 | Il Martello che tira a sé | Gaetano | MVP | 72 (81 su pietra) | ≈ 26 s | P85 |
| 6 | Il Botto di San Gennaro | Ferruccio | P1 (C2) | 95 reali (191 teorici) | ≈ 13 s | P95 |
| 7 | Il plotone di Taddeo | Ferruccio | MVP | 82 su tutta la fila | ≈ 15 s | P90 |
| 8 | La run povera, salvata dal pity | Ferruccio | MVP | 21 → 31 | ≈ 40 s | P20 |
| 9 | La giostra di Pulcinella | Ferruccio | MVP | 81 sull'anello | ≈ 19 s | P85 |
| 10 | La lucciola che brucia | Ferruccio | P1 | 88 in area | ≈ 17 s | P97 |

**Build 1 — Lo schermidore di Piazza Dante** (P50). Oggetti (9): Punzone G.F. (Ricordo 1), Lucciole della Villa (Fucina 1), Occhi di gatto (boss 1), Occhio che brilla (Ricordo 2), Sciarpa di Agnese (Ricordo 3, scelta fra 2 con la Reggia in miniatura), Reggia in miniatura (boss 2), Targa degli operai (Caserma), Tempra degli stivali (Fucina 2), Fazzoletto blu (ninnolo). Conti: U 1,5 → 5,86; doppio ×0,8 → **4,69 × 2 scintille** a V, entrambe inseguitrici; T 0,7 → **3,45/s**, nessuna penalità; DPS 4,69 × 2 × 3,45 = **32,3**; affondo 14,1 × 2 (il doppio dà il secondo a −0,1 s) = 28 per pressione. Stat: Passo 1,45 (391 px/s), Maschere 6, scatto 0,40 s, 1 colpo annullato per stanza, fili al 100%. Boss: Gatto 400/(32,3×0,6) ≈ 21 s, Madre ≈ 28 s, Custode ≈ **39 s**. Sensazione: è Isaac con lo stocco in tasca; niente sembra rotto, tutto sembra tuo. È la run su cui si tarano i boss (45-90 s).

**Build 2 — Il Velo in fiamme** (P97). Oggetti (9): Punzone (Ricordo 1), Lucciole (Fucina 1), **Raggio del Velo** (Banco dopo il boss 1: −2 maschere di massimo), Occhio che brilla (Ricordo 2), Tricorno (boss 2), Brace del lanterniere (Ricordo 3), Lembo di Velo (Segreta 2: spettrale già innata → +1 U), Spina di ferro (Fucina 2), Targa (Caserma). Conti: U 2,5 → 7,00; +2 flat pre = 9,00; tick 0,6 × 9,00 = **5,40**, **48,6 per raggio**; 3 raggi che curvano di 45°; cariche/s = 3,45 × 1/3 × 0,51 = **0,586** (un ciclo ogni 1,7 s). DPS su un boss che prende i 3 raggi = 48,6 × 3 × 0,586 = **85**; su un comune 28; brace 4 × 4,5 = 18 su ogni nemico toccato. Stat: Maschere **4** (5 − 2 + 1), Passo 1,0, ti notano al 70%. Boss: Gatto ≈ 9,4 s, Madre ≈ 13 s, Custode ≈ **17,6 s**. **Variante jackpot** (se arrivano anche Occhi di gatto e Dente del Gatto): U 3,0 → 7,51; (7,51+2) × 1,5 × 0,8 = 11,41 → tick 6,85, 61,6 per raggio, **4 raggi**, penalità cancellata → 1,15 cariche/s → **284 DPS** su boss (Custode in 5,3 s). Probabilità: Raggio (≈ 8% delle run che vedono il Banco) × Tricorno (≈ 15%) × Occhi (≈ 22%) × Dente (≈ 12%) ≈ 1 run su 3000. Sensazione: il Banco ti ha tolto due maschere e in cambio ti ha dato la stanza; si gioca a 4 maschere, quindi la paura resta. La regola q4 50/90/98 la tiene a frequenza da leggenda.

**Build 3 — La mola che non si ferma** (P80). Oggetti (9): Punzone (Ricordo 1), Medaglione di Rosa (Bivio di Tonino; Sorte +1), **Otre bucato** (Segreta 1), Occhio che brilla (Ricordo 2), Dente del Gatto (boss 1), Carbone della forgia (Banco, −1 maschera), Guardia di ferro (Fucina 2), Fili d'oro (Ricordo 3), Veleno della Regina (boss 2). Conti: U 1,5 + 0,5 + 1,4 = 3,4 → 7,89; ×1,5 = 11,8; ×0,2 = **2,37 a contatto**; Carbone (flat post, ignora il ×0,2) +0,6/casella → **4,77 a 4 caselle, 6,27 a 6,5**; Fiato 2,73 × 5,5 = **15,0/s** (≈ 13 scintille vive), size ×0,7, knockback 0, tutte inseguitrici. DPS **35** a contatto, **71** a 4 caselle, **94** a fine gittata; veleno 37,5% × 15 = 5,6 proc/s (sempre attivo), fili al 100%, ogni scintilla distrugge un proiettile. Stat: Sorte 1, Maschere 4 (+½ ogni 15 centesimi). Boss (a 3-4 caselle): Custode ≈ **17 s**, Gatto ≈ 9 s, Madre (ferma, tu a 5 caselle) ≈ 11 s. Sensazione: una mola che sputa scintille bianche; col l'Otre la distanza è danno, e lo vedi dalla scia.

**Build 4 — La spola che attraversa** (Agnese, P60). Oggetti (8 + Spola innata): Fili d'oro (Ricordo 1: innata → +1 U), Punzone (boss 1), Lucciole (Fucina 1), Occhi di gatto (boss 2; S#4: 2 spole a V), **Pistola di Taddeo** (Caserma; S#3: spola perforante che torna, cadenza della Spola), Veleno della Regina (Ricordo 2), Medaglione di Rosa (Bivio; Sorte → 2), Targa (Ricordo 3). Conti: k 0,85; U 1 + 1,5 + 1,4 = 3,9 → 2,975 · √5,68 = 7,09; ×0,8 = **5,67 per colpo**; ogni spola colpisce 2 volte e attraversa la fila: 11,3 per nemico per spola; 2 spole a V: **22,7 per lancio** a bruciapelo; T 0,7 → 3,45 × 0,45 = **1,55 lanci/s**. DPS con entrambe le spole sul bersaglio **35,2**; su una fila di 3, 35 ciascuno. Veleno 50% per colpo, 4 colpi per lancio → P(almeno uno) = **94%**: +5,7 DPS. Stat: Misura 5, Passo 1,15, Sorte 2, Maschere 4, scatto a 2 cariche, nessuna parata. Boss: Madre ≈ 22 s, Custode ≈ **31 s**, Ratking ≈ 24 s. Sensazione: una lama d'oro che va e torna attraverso la fila; la spola rallentante è la parata di Agnese. Nota lore: la pistola dell'uomo che ha tradito Ferruccio nelle mani della donna che lo aspetta.

**Build 5 — Il Martello che tira a sé** (Gaetano, P85). Oggetti (9): Stoccata corta (Ricordo 1: `a_bruciapelo` sul contatto = ×1,5 fisso; +0,5 U), Punta di diamante (Fucina 1: perforante già innata → +1 U), Punzone (boss 1), Lucciole (Ricordo 2: il Fiato accorcia la ricarica), Fili d'oro (Fucina 2), Brace del lanterniere (Ricordo 3), Lembo di Velo (Segreta: spettrale ignorata dal contatto → +0,5 U), Dente del Gatto (boss 2), Rampino a catena (Caserma; sblocco Ratking). Conti: k 1,2; U 0,5 + 1 + 1,5 + 0,5 + 0,5 = 4,0 → 4,2 · √5,8 = 10,1; ×1,5 = **15,17**; martellata 15,17 × 3 × 1,5 = **68,3 in area 90 px**; su pietra (Punzone +2 post prima dell'arma) (15,17+2) × 4,5 = **77,3**; ricarica 1,2 × 2,73/3,45 = **0,95 s** → **72 DPS** (81 su pietra); brace 30 su ogni colpito; fili al 100%. Rampino (2 braci, ogni stanza): tira e stordisce 0,8 s = una martellata garantita. Stat: Passo 0,85, Maschere 6, immune al knockback, rompe muri gratis, niente scatto né parata. Boss: Madre (pietra, ferma) ≈ 17 s, Custode ≈ **26 s**, Gatto (salta via) ≈ 30 s reali. Sensazione: un gatto muore in una martellata, un cavaliere (35) in una, il Capitano in una. Gaetano non schiva: arriva.

**Build 6 — Il Botto di San Gennaro** (P1, C2, P95). Oggetti (9): Punzone, Lucciole, **Botto della Festa** (Segreta 2), **Petardo** (S#15: immune ai propri botti, +2 flat, nube di veleno), Sciarpa di Agnese, Schegge di tufo (ogni botto si divide in 4 mini-botti a ½), Dente del Gatto, Medaglione, Targa. Conti: U 3,4 → 7,89 × 1,5 = 11,83; +2 = **13,83**; botto 10 × 13,83 = **138 in 1,5 caselle** dopo 1 s; 4 mini-botti da 69; Fiato 3,45 × 0,4 = **1,38 lanci/s**. DPS su bersaglio fermo 191 teorici; su un boss mobile (miccia di 1 s) ≈ 50% → **95 reali**. Stat: Passo 1,3, Sorte 1, Maschere 6, primo autodanno annullato per stanza. Boss: Custode ≈ 8 s fermo, **13 s** coi balzi; la Regina dei Debiti (orbita) ≈ 20 s. Sensazione: ogni lancio è una festa di piazza; la paura dell'autodanno viene tolta da Petardo e Sciarpa al primo botto che ti scoppia addosso senza farti niente.

**Build 7 — Il plotone di Taddeo** (P90). Oggetti (9): Punzone (Ricordo 1), **Pistola di Taddeo** (boss 1; sblocco Bivio "accusato"), Spina di ferro (Fucina 1), Tricorno (Ricordo 2), Occhi di gatto (boss 2: cancella la penalità), Brace (Ricordo 3), Fili d'oro (Fucina 2), Medaglione (Bivio), Reggia in miniatura (Segreta). Conti: U 2,9 → 7,41; +2 pre = 9,41; ×0,8 = **7,53 per canna**; n = 1 + 2 + 1 = **4 canne parallele a 12 px**, perforanti, knockback 0; Fiato **2,73/s** (Pistola ×1,0; penalità cancellata). DPS 7,53 × 4 × 2,73 = **82 su ogni nemico in linea**; brace 15 su ciascuno; fili al 100%. Boss: Custode ≈ **15 s**, Gatto ≈ 8 s; la Madre e le 2 statue in fila: tutte insieme. Sensazione: quattro linee bianche che passano attraverso tutto; nessun knockback, quindi i nemici continuano a venirti addosso mentre muoiono: premia chi tiene la linea.

**Build 8 — La run povera, salvata dal pity** (P20). Oggetti (10): Sciarpa di Agnese (Ricordo 1, q3 ma senza forma), Tempra degli stivali (Fucina 1), Targa (boss 1), Medaglione (Bivio), Guardia di ferro (Ricordo 2, q2: **seconda offerta scarsa, pity attivo**), Giglio spezzato (Edicola dopo il boss 2), Reggia in miniatura (boss 2), Lettera, Mozzarella, **Tricorno** (Ricordo 3: il pity forza q3 con tag `forma`; con la Reggia c'è anche la seconda scelta). Conti: U 1,6 (40 centesimi) → **5,98**; Fiato 2,73 → la Fucina ha sempre un "ferro": Lucciole comprate al piano 2 → **3,45/s**; piani 1-2 DPS 5,98 × 3,45 = **20,6**; affondo 17,9 ogni 0,56 s = 32 DPS a contatto (è qui che si vince: il 3× non ha bisogno di oggetti); piano 3 col Tricorno 5,98 × 3 × 1,76 = **31,5** (× 0,6 = 18,9 reali). Stat: Passo 1,45, Sorte 1, Maschere 6 + ½ ogni 15 centesimi, 2 colpi annullati per stanza, scudo. Boss: Gatto ≈ 32 s, Madre ≈ 44 s, Custode ≈ **40 s**: tutti nella banda 45-90 s del concept (o sotto). Sensazione: il duello lungo; non si vince per potenza ma perché si incassa poco. Il Tricorno al piano 3 arriva come un sollievo visibile: è il pity che fa il suo lavoro senza dirlo.

**Build 9 — La giostra di Pulcinella** (P85). Oggetti (9): Punzone (Ricordo 1), Lucciole (Fucina 1), **Giostra della festa** (Segreta 1), Eco dei Quattro Canti (Ricordo 2), Spina di ferro (Fucina 2), Carbone (Banco, −1 maschera), Guardia di ferro (Ricordo 3), Medaglione (Bivio), Targa (boss 2). Conti: U 2,9 → 7,41 + 2 = **9,41** al lancio; Giostra: Misura 13 (clamp) → ogni scintilla vive 1,73 s in orbita a 1,5-3 caselle; Carbone: 13 caselle percorse → cap **+6** dopo 10 → **15,4 a fine orbita**, media 12,4; Eco 30% (Sorte 1), ogni proc +3 scintille in orbita: 3,45 × 1,9 = **6,5 scintille/s**, ≈ 11 in orbita (tetto 12). DPS su chi entra nell'anello 6,5 × 12,4 = **81**; ogni scintilla in orbita distrugge un proiettile. Boss: Custode ≈ **19 s** standogli addosso; la Madre (ferma) perfetta; il Gatto che salta via ≈ 30 s. Sensazione: non si mira più; cambia il verbo, da "spara" ad "avvicinati".

**Build 10 — La lucciola che brucia** (P1, P97). Oggetti (9): Punzone (Ricordo 1), **Lucciola di Bianca** (Edicola 1), Lucciole (Fucina 1), Brace (boss 1), **Raggio del Velo** (Banco, −2 maschere; S#11: anello permanente attorno alla lucciola), Dente del Gatto (boss 2), Occhi di gatto (Caserma: +1 lucciola orbitante), Fili d'oro (Ricordo 2), Veleno (Ricordo 3). Conti: U 2,0 → 6,45 × 1,5 × 0,8 = **7,74 per tick**; lucciola principale 3,45 tick/s → **26,7 DPS** sul nemico su cui sta; anello del Velo 15 tick/s × 0,3 × 7,74 = **34,8 DPS in area**; seconda lucciola altri 26,7; totale su un boss dentro l'anello **88 DPS**; brace e fili rinfrescati ogni 0,29 s (boss al 60%); veleno sempre attivo. Stat: Maschere **3** (5 − 2; l'Edicola del piano 1 è venuta prima del pegno del piano 2, quindi è lecita). Boss: Custode ≈ **17 s**, Madre ferma (uptime 100%) ≈ 6 s. Sensazione: parcheggi una lanterna sul boss e lui brucia, rallenta, si avvelena, mentre tu schivi in un angolo; la build più controllabile e la più fragile.

### 4.4 Che cosa dicono le dieci build insieme

1. **La distribuzione che vogliamo**: P10 ≥ 18 DPS (la base con l'affondo regge: 9,55 + 18,75), **P50 26-34**, P80 ≈ 70, P90 ≈ 80-90, P97 ≈ 85-95 all'MVP; sopra 140 solo nella Parte 1 (Botto) o col jackpot a 1/3000. Le build 2, 7, 9 richiedono un q4 (Raggio, Dente) o una coppia Boss + Boss: la regola 50/90/98 e il prezzo in maschere del Banco le tengono nel 10% delle run.
2. **Il costo in maschere è parte della build**: 4 delle 10 passano dal Banco; la build 10 vince a 3 maschere.
3. **Il Medaglione di Rosa compare in 7 build su 10**: +1,4 U per 35 centesimi è il "Danno per chi non trova Danno"; da tenere d'occhio nel pick-rate (banda 3-40%): è una ricompensa di Bivio, quindi lo prende chi sceglie quel ramo.
4. **Ogni build ha una lettura visiva in un secondo**: due scintille a V, tre raggi d'oro che curvano, scia bianca che si allarga, spola che torna attraverso la fila, martellata ad area, botto + 4 botti, quattro linee, una gonna di scintille, una lanterna con l'anello. Nessuna si riconosce solo dal pannello.
5. **Gaetano e Agnese non sono varianti di Ferruccio**: il Martello spinge verso brace/fili/bruciapelo + Rampino; la Spola verso le flag a probabilità. I `char_filter` servono a farglieli trovare.
6. **Il pity si vede**: nella build 8 il Tricorno al piano 3 porta il DPS da 21 a 31 e il Custode da 60 s a 40 s. Senza pity la stessa run sarebbe ancora vincibile ma il colpo non avrebbe mai cambiato forma in 12 minuti.
7. **Il Raggio a 0,6·Danno resta la build dei sogni** (85-92 DPS con due pezzi in più) senza chiudere la Madre in 8 s al primo Banco: a base fa 17,2 DPS, 1,8× la scintilla, come Brimstone.

---
## 5. Regole del catalogo e curve della run

Per `data/run/items.json`, `pools.json`, `flags.json`, `fusions.json`, `weapons.json` e per il piano S5-6 / S11-12 / S15+. Numeri tarati su 3 piani, 10-14 minuti, 9-10 oggetti per run.

### 5.1 Dimensioni e quote

| Cosa | MVP (S14) | +40 (S15-20, C2) | Parte 1 (S26) | Tetto | Perché |
|---|---|---|---|---|---|
| Voci del catalogo (collezionabili in senso Isaac) | **80 (61)** | 120 (95) | 154 (126) | 190 (150) | oltre 150 collezionabili la diluizione batte la varietà |
| Flag nel bitset | **14** | 19 | 23 | **32** (un `int` a 32 bit) | ogni flag = 5 celle (una per forma) + 1 variante di sprite |
| Sostituti d'arma in pool | **3** (+ Martello del fabbro di Gaetano e Spola d'oro di Agnese, innati) | 7 (+ Lucciola, Mangiafuoco, Alone, Botto) | 9 (+ Ago, Cannone) | **12** | ogni arma = 23 celle + ≥ 2 fusioni + 1 sprite del colpo |
| Modificatori di numero | **4** | 8 | 9 | 12 | |
| Trasformazioni del profilo | **2** | 2 | 2 | 4 | coesistono a coppie: oltre 4 i casi esplodono |
| Fusioni nominate (icona + nome + suono) | **3** | 8 | 13 | 20 | Gungeon: la sinergia si vede e si chiama |
| Casi speciali in `special_cases.gd` | **10** | 14 | 17 | 20 | ogni riga è un test di snapshot |
| Famigli / orbitali | 1 / 1 | 5 / 3 | 8 / 3 | 10 / 4 | 8 grandi + 32 piccoli vivi |
| Attivi a braci | 8 | 11 | 13 | 20 | |
| Ninnoli / consumabili | 6 / 4 | 9 / 10 | 11 / 17 | 30 | |
| Set lore (trasformazioni) | 1 (richiamo) | 2 | 3 (+ Smorfia) | 4 | Repentance non ne aggiunge: "too advantageous to get from luck" |
| **Quota "forma"** (flag, armi, numero, trasformazioni, cloni, orbitali) | **25/80 = 31%** (36/61 fra i collezionabili = 59%) | ≥ 50% dei collezionabili | ≥ 50% | | le 30 sinergie famose di Isaac sono tutte forma × numero |
| Quota "solo numeri" | ≤ 35% dei collezionabili e solo q0-q2 o Fucina/Boss | idem | idem | | gli stat stick non si ricordano |

### 5.2 Pool, pesi target e oggetti attesi

**Pesi target per qualità** (verificati da `tools/items_check.py` sulla somma dei pesi; tolleranza ±5 punti):

| Pool | q0-q1 | q2 | q3 | q4 | Oggetti attesi per run | Nota |
|---|---|---|---|---|---|---|
| Ricordo | 5% | 45% | 40% | 10% | 3,0 (1 per piano; dal piano 2 costa 1 sigillo) | **quota forma ≥ 65%** |
| Boss (+ Caserma) | 5% | 25% | 55% | 15% | 2,0 + 0,5 | **solo forma o +U ≥ 1,5 / +T ≥ 0,7 / +1 contenitore**: mai sola utilità dopo un boss; cure pure ≤ 3 voci |
| Fucina (con gli ex Baule a 0,5) | 40% | 60% | 0 | 0 | 1,3 (15 cent) | slot 1 **sempre** un oggetto con tag `ferro` (Spina, Lucciole, Punta, Fili d'oro) |
| Pegni | 0 | 10% | 50% | 40% | 0,4 (1-2 maschere di massimo; 3 di cera senza contenitori) | |
| Edicola | 0 | 30% | 40% | 30% | 0,2 (gratis; preclusa dopo un pegno) | almeno 1 offensivo in ogni offerta |
| Segreta | 0 | 50% | 35% | 15% | 0,6 (30% delle segrete ha un oggetto) | |
| Bivio | fisso per ramo | | | | 1,0 | 2 oggetti diversi per ramo, non pesati |
| Baule (5% dei drop) | → pesca dalla Fucina | | | | 0,2 | |
| **Totale** | | | | | **≈ 9,2** (+1 con la Reggia in miniatura) | Isaac: 15-20 su 341-719 in 35-45 min |

### 5.3 Composizione delle pool all'MVP, a profilo nuovo (regola: nessuna pool sotto **4 di peso e 6 voci**)

| Pool | Voci (peso) | Peso totale sbloccato | Dietro sblocco |
|---|---|---|---|
| **Ricordo** | Lucciole, Scarpe silenziose, Occhio che brilla, Punta di diamante, Spola scheggiata, Schegge di tufo, Fili d'oro, Veleno, Brace, 'A paura, Stoccata corta, Spola d'oro, Tricorno, Eco, Nuca dipinta, Sciarpa di Agnese, Lanterna del lanterniere, Applauso (1,0 ciascuno); Reggia in miniatura 0,7; Petardo, Carbone, Gatto d'ombra, Fiasco, Soffio, Corno rosso, Lampioncino 0,5; Tarallo 0,3; Giglio 0,1 | **21,6** (27 voci) | Punzone 1,0 (30 nemici di pietra), Martello del calcare 0,5 |
| **Boss** | Targa, Zeppola, Pastiera, Fiasco, Soffio della forgia, Furia di Pulcinella, Occhi di gatto (1,0); Dente del Gatto, Tricorno, Lucciole 0,5 | **8,5** (10 voci; 3 cure pure) | Pistola (Bivio Taddeo), Rampino (Ratking), Punzone 0,5, Dente (prima vittoria sul Gatto: sostituito dalla Zeppola finché chiuso) |
| **Fucina** | Spina di ferro, Lampione, Tempra, Corno rosso, Impugnatura, Fibbia, Guardia di ferro, Borsellino, Disegno, Sciarpa annodata, Bomba carta (1,0); Mantice del fabbro, Lucciole, Punta, Fili, Veleno, Gatto d'ombra 0,5 | **14,0** (17 voci) | — (più i pickup: Mozzarella, Lettera, Lettera sigillata, Carta reale, Chiodo, Fazzoletti, Spago) |
| **Pegni** | Veleno, Lampioncino, Anello dei Borbone, Ultima maschera, Carbone (1,0); Raggio del Velo, Palla di cannone, Settima vita, Stoccata, Petardo, Dente 0,5 | **8,0** (11 voci) | Punzone 0,5, Martello del calcare 0,5 (3 pegni) |
| **Edicola** | Candele, Mantello del Munaciello, Tarallo, Aureola (1,0); Sciarpa di Agnese, Occhio che brilla, Targa, Reggia 0,5; Giglio spezzato 0,2 | **6,2** (9 voci) | — |
| **Segreta** | Lembo di Velo, Otre bucato, Sprone, Giostra (1,0); Piastra, Eco, Mantello 0,5; Raggio, Palla 0,2 | **5,9** (9 voci) | Scatola musicale 0,5 (run senza attivo) |

**Ricompense dei Bivi** (8, non pesate): Registro "conservato" → Registro delle acque / "distrutto" → Cenere del registro · Taddeo "accusato" → Pugnale (+ Pistola nel Boss pool) / "perdonato" → Biglietto di Mariella · Tonino "restituito" → Medaglione di Rosa / "non restituito" → Medaglione muto · Agnese "risvegliata" → Telaio di Agnese / "lasciata dormire" → nessun oggetto (sblocca Agnese a fine run). Ogni ramo premia; nessun ramo è "quello con l'oggetto".

**Filtri per personaggio** (`char_filter`): Gaetano non vede i sostituti con priorità < 100 (Spola, Pistola, Raggio, Telaio → dà +1 U e Fiato) e il peso liberato va alle flag con riga `contatto` (brace, fili, veleno, a_bruciapelo, perforante: ×1,5); Agnese non vede la Spola d'oro; Taddeo [P1] non vede la Pistola; Bianca [P1] non vede il Giglio spezzato. Nessun altro filtro: la Pistola per Agnese è voluta (fusione).

### 5.4 Regole di estrazione, pity e garanzie (RNG di flusso `items`, deterministico dal seme)

1. **Toccato → via da tutte le pool**; **visto e lasciato → peso ×0,5** in quella pool; pool vuota → Ricordo; Ricordo vuoto → Pane cafone.
2. **Regola dei q4**: dopo aver **visto** un q4 nella run, il successivo è rerollato al **50%**, poi **90%**, poi **98%**. Atteso 0,8-1,2 q4 per run. Il Banco non è esente.
3. **Nessun duplicato**: un oggetto preso non riappare; la regola +1 U riguarda solo le flag innate. La Tombola pesca escludendo i posseduti.
4. **Piano 1**: nel Ricordo gli oggetti q2-q3 con tag `forma` hanno peso ×2 (il primo oggetto deve cambiare il colpo); Petardo e Otre peso ×0,5 al piano 1 (troppo punitivi prima di aver capito il gioco).
5. **Esclusioni in pool** (`excl_pool`, tetto 6 coppie): Petardo ↔ Otre bucato (0); Eco ↔ Nuca dipinta (×0,25); Martello del calcare ↔ Rampino (×0,5: due attivi "porta il bersaglio" sono ridondanti). Mai un rifiuto al pickup.
6. **Fusioni**: non stanno in pool. Una fusione compare come terza scelta nel Ricordo o come slot della Fucina dal piano 2 con probabilità **25% per piano**, solo se possiedi uno dei due pezzi (Hades: duo con un dono di ciascun dio; Gungeon: Synergy Chest). Non si potenziano oltre.
7. **Banco che compra**: dal piano 2 il Banco dei Pegni ritira un oggetto indesiderato per 10 centesimi (Pool of Purging di Hades): il modo pulito di uscire da un'anti dichiarata.

```
RunState.pity = {scarsi: 0, forma_offerte: 0}
on_offer(item, room ∈ {ricordo, boss, caserma}):            # conta le OFFERTE, non i pickup
    if item.quality <= 2 and "forma" not in item.tags: pity.scarsi += 1
    else: pity.scarsi = 0
    if "forma" in item.tags: pity.forma_offerte += 1
roll_ricordo(floor):
    if pity.scarsi >= 2:                                      # PITY DI QUALITÀ
        pool = ricordo.filter(q >= 3 and "forma" in tags)
    elif floor == 2 and pity.forma_offerte == 0:              # GARANZIA DI FORMA
        pool = ricordo.filter("forma" in tags)
    else: pool = ricordo
on_floor_start(3):                                            # PITY DI DANNO
    if stats.damage < 5.0 and not (has_weapon or has_multishot):
        ricordo3.choices = 2; almeno una con add damage >= 1,5 o tears >= 0,7
```
- **Pity di qualità**: 2 offerte consecutive scarse → la prossima Stanza del Ricordo pesca solo q3-q4 con tag `forma`; scatta nel ≈ 25% delle run, quasi sempre al piano 2 o 3 (build 8).
- **Garanzia di forma**: entro la fine del piano 2 almeno 2 oggetti `forma` offerti (il Boss pool ne contiene ≥ 70%).
- **Pity di danno**: Danno < 5,0 (U < 0,85) all'inizio del piano 3 senza arma né multishot → il Ricordo 3 mostra 2 scelte. Costo: zero codice nuovo (è la Reggia in miniatura).
- **Ferro garantito**: la Fucina ha sempre uno slot `ferro` a 15 centesimi (60-90 centesimi attesi per run: 1-2 acquisti).
- **Scelta 1 su 2 garantita**: una per run (Bivio) + Reggia + pity di danno. Il pity non si applica a Pegni, Edicola, Segreta e non guarda alle stat del giocatore se non nel pity di danno: resta leggibile e testabile.

### 5.5 Drop a fine stanza e Sorte

`r = rand()` → **< 0,22 nulla (22%)** · 0,22-0,30 **consumabile / Smorfia / ninnolo (8%)** · 0,30-0,45 **centesimi (15%)**: 1 (94%), 5 (5%), 10 (1%) · 0,45-0,65 **maschera (20%)**: ½ al 60%, cera 7%, oro 1,8% [P1] · 0,65-0,75 **sigillo (10%)** · 0,75-0,90 **martellata (15%)** · 0,90-0,95 **baule (5%)**: 3 pickup, 20% un oggetto della Fucina · 0,95-1,00 **Favilla (5%)**: pickup nuovo, **+3 braci**.
**Sorte** (clamp 0-5 per i drop): **+3% per punto da "nulla" a "maschera"** (a Sorte 5: nulla 7%, maschera 35%); il Fazzoletto col giglio forza il 10% a maschera; la Cambiale della Regina raddoppia la ricompensa ma porta il nulla al 33%; Notte fonda: ⅓ delle maschere diventa nulla.
Su 17 stanze: 3,7 nulla, 1,4 consumabili, 2,6 centesimi, 3,4 maschere, 1,7 sigilli, 2,6 martellate, 0,85 bauli, 0,85 Faville. **Sigilli attesi 1,7 + 3 garantiti (1 per piano) = 4,7** contro 4-5 usi (Ricordo p2-p3, Fucina p2-p3, grata 0-1): niente più spazzatura al 20%.
Differenza dichiarata da Isaac: la Sorte di Isaac spinge verso i forzieri (`r += rand × L × 0,1`); qui spinge verso le maschere perché in 12 minuti un forziere in più non si sente. Fonte della tabella base: https://bindingofisaacrebirth.wiki.gg/wiki/Room_Clear_Awards

### 5.6 Economia e braci

| Valuta | Entrate per run | Uscite / prezzi |
|---|---|---|
| Centesimi | 60-90 (nemici ½ dei `coins` del tuning, 2,6 drop, boss 22-30, Chiodo del fabbro) | Fucina: oggetto 15, attivo 10, ½ maschera 3, maschera di cera 5, martellata 5, sigillo 5, Favilla 5, Smorfia 5, ninnolo 7; cassetta delle offerte 10; il Banco compra a 10 |
| Sigilli | 1,7 drop + 3 garantiti ≈ 4,7 | Ricordo p2-p3 (2), Fucina p2-p3 (2), grate 0-1, Caserma (Carta reale) |
| Martellate | 1 iniziale + 2,6 drop + 1 garantita/piano | segreta 1/piano, tombino 2, ostacoli; 60 danni (90 con la Polvere della Santabarbara) |
| **Braci** (carica degli attivi, max 12) | **+2 per stanza liberata, +4 per boss e Caserma, 0 per nemico**; Favilla +3 (5% dei drop); Fazzoletto blu +1 per stanza; Brace della vendetta +1 ogni 5 uccisioni ≈ **46-50 per run** | attivi da **1, 2, 3, 6, 8** braci: Rampino 2 (ogni stanza), Lanterna / Sciarpa annodata / Maschera di Pulcinella 3, Mantice del fabbro / Martello / Registro / Tombola 6 (ogni 3 stanze), Scatola / Campana 8 (ogni 4 stanze) |
| Maschere | 3,4 drop (≈ 2,4 piene) + 1 per boss (3) + Mantice ≈ 6 (8 usi massimi, non tutti spesi) + Fucina + Medaglione | ≈ **11-12 cure attese per run** su 5 contenitori: metà dei colpi subiti (6-10) si recupera. Con il Mantice a 4 braci sarebbero 13-16: è il motivo dei 6 |
| Porta del Banco / Edicola | 1% + 99% piano senza danno rosso + 35% boss senza danno, ×0,5 se vista nel piano prima; Edicola al 50% se non hai mai impegnato (https://bindingofisaacrebirth.wiki.gg/wiki/Devil_Room) | Banco: q3 = 1 maschera di massimo, q4 = 2; 3 di cera senza contenitori; mai sotto 1 |

### 5.7 Composizione di un oggetto, nomi, cap

- **≤ 3 delta di stat + ≤ 2 flag + ≤ 1 hook** per oggetto (App. A del concept).
- **Passi standard** (già ×1,5 rispetto a Isaac): Danno +1,5 U (q2) / +2 U con malus (q3) / +0,5 U e ×1,5 (q4); flat +2 pre o +2 post (ninnolo) o +25 post (Petardo); Fiato +0,7 (q2) / +1,0 (q3); Misura +2,5 / +3,75; Slancio ±0,16-0,3; Passo +0,15 / +0,3 / +0,5; Sorte +1 / +2; maschere +1.
- **Gruppi moltiplicativi** (uno vale per gruppo, dichiarati nel campo `group` di ogni op `mul`): `x1.5` (Dente, Anello, Tarallo), `x1.5_arma` (Raggio+Pistola: cumulabile con `x1.5` come in Isaac), `x2_sacro` (Giglio d'oro), `x2_cond` (Fiocco), `trasformazione` (Otre ×0,2), `multishot` (×0,8). I flat post (Petardo, Carbone, Corno di bue, Punzone su pietra) ignorano i moltiplicatori **e lo dichiarano nel pannello** ("+2 fisso").
- **Penalità di cadenza**: una sola per famiglia (catena d'arma; multishot: la più severa; il doppio la cancella). Pavimento 1,06/s (T −1,9). I bonus si sommano fino a 5/s, poi solo moltiplicatori e S; cap per arma 15/s, totale `Fiato·n ≤ 20`, proiettili vivi 60, 12 in orbita, 16 raggi, 8 + 32 famigli.
- **Orbitali**: DPS ≤ 24 (2,5× la scintilla base) perché non scalano col Danno; famigli fissi ≤ 7 DPS; cloni ≤ 0,75 della build.
- **Nomi**: nessun **sostantivo comune** in più di 2 nomi del catalogo e mai con effetti di segno opposto (oggi: Mantice 1 + Soffietto 1, Martello 2, Lanterna 1 + Lampione 1 + Lampioncino 1, Maschera 2, Spola 2, Sciarpa 2, Fazzoletto 2, Medaglione 2, Giglio 2, Lettera 2); i nomi propri dei set e della lore (Gatto, Quattro Canti, Velo, Agnese, Madonnina, Smorfia) sono esenti perché sono il filo che lega i pezzi. In un popup di 1 s su telefono il nome è l'unica informazione.
- **Ordine fisso a fasi** (§2.4); `resolve()` pura; test di permutazione → stesso hash.
- **Proc per Sorte**: `p = min(cap, a + b·max(Sorte,0))`; status leggeri (veleno) 100% a Sorte 6; status di controllo cap 50%; Eco 25% + 5%; Nuca 50% + 10%; esplosione della brace cap 25%. Sorte negativa dimezza la base. I drop usano la Sorte tappata 0-5.
- **Status sui boss**: uno alla volta, 8 s di immunità, `fili` esente.
- **Priorità delle armi**: interi distanziati di 10; niente cicli: ogni coppia o è in `fusions.json` o ha priorità diversa; le fusioni si compongono per asse (`axis: weapon | count`): una arma×arma + una arma×numero sì, due arma×arma no.
- **Anti-sinergie** ≤ 5% delle coppie rilevanti, ciascuna con `mode: let | special | excl_pool`, `warn`, `fix_for`; mai un rifiuto al pickup.

### 5.8 Curve della run

**Oggetti attesi per run e qualità pescata**

| Fonte | Piano 1 | Piano 2 | Piano 3 | Run | Qualità pescata |
|---|---|---|---|---|---|
| Stanza del Ricordo | 1,0 | 1,0 | 1,0 | **3,0** | p1: q1 35% / q2 45% / q3 20%; p2: q1 20 / q2 40 / q3 30 / q4 10; p3: q1 10 / q2 35 / q3 40 / q4 15 |
| Boss | 1,0 | 1,0 | 0 (il Custode chiude la run; lascia l'oggetto in Notte intera) | **2,0** | q1-q4 del Boss pool |
| Fucina | 0,4 | 0,5 | 0,4 | **1,3** | q0-q2 |
| Banco / Edicola | 0,3 | 0,3 | 0 | **0,6** | q3-q4 |
| Segreta | 0,2 | 0,2 | 0,2 | **0,6** | q2-q4 "strani" |
| Caserma | 0 | 0,25 | 0,25 | **0,5** | Boss pool |
| Bivio | 0,33 | 0,33 | 0,33 | **1,0** | fisso per ramo |
| Bauli | 0,05 | 0,07 | 0,07 | **0,2** | Fucina |
| **Totale** | **2,3** | **3,7** | **2,3** | **9,2** (8-12) | + 1 ninnolo, 2-4 consumabili, 2-3 maschere di cera |

**Curva delle stat** (mediana e run fortunata, delta ×1,5):

| Momento | Oggetti | U | T | Danno | Fiato | DPS scintilla | Con un multishot (35% delle run) |
|---|---|---|---|---|---|---|---|
| Inizio | 0 | 0 | 0 | 3,50 | 2,73 | 9,6 | — |
| Fine piano 1 | 2-3 | 1,5 | 0,35 | 5,86 | 3,07 | 18,0 | 28,8 (doppio) |
| Fine piano 2 | 5-6 | 3,0 | 0,70 | 7,51 | 3,45 | 25,9 | 41 / 40 (doppio / triplo) |
| Fine piano 3 (Custode) | 8-9 | 4,5 | 1,05 | 8,85 | 3,86 | 34,2 | 55 |
| Run fortunata (Raggio al p1 + Dente + 2 Fiato) | 9 | 2,0 | 1,4 | 6,45 × 1,5 = 9,68 → tick 5,81, 52,3 per raggio | 4,33/3 = 1,44 cariche/s | 75 | — |
Affondo a fine run: 3 × 8,85 = 26,6 per colpo (un cavaliere di piano 3 da 49 HP in 2 affondi).

**Riscalatura degli HP** (conseguenza della base 3,5 e dell'auto-fuoco; sostituisce i numeri "riferiti a Danno 1" del concept §2.3 e §2.5; i telegrafi non cambiano):

| Nemico | Concept 1.0 (Danno 1) | p1 | p2 (+3,5) | p3 (+7) | Colpi a base / a fine piano |
|---|---|---|---|---|---|
| Pipistrello | 1 | 4 | 7 | 11 | 2 / 1 |
| Vespa | 2 | 7 | 11 | 14 | 2 / 2 |
| Gatto, Sonnambulo | 3 | 10 | 14 | 17 | 3 / 2 (1 affondo) |
| Spettro, Lanterniere | 5 | — | 21 | 25 | — / 3 |
| Guardia, Statua, Topaia | 6 | 20 | 25 | 28 | 6 / 4 (2 affondi) |
| Duellante, Mascherone | 8 | — | 32 | 35 | — / 5 |
| Cavaliere | 10-12 | — | 42 | 49 | — / 6 (2 affondi a fine run) |
| Capitano Ruggiero (mini-boss) | 14 | — | 140 | 140 | — / 19 s al 60% |
| **Gatto dei Quattro Canti** | 24 | **400** | | | 33 s con la build di fine p1 (46 s a base) |
| **Madre di Marmo** | 30 | | **550** | | 30 s con la build di fine p2 (63 s a base) |
| **Ratking** | 32 | | **600** | | 33 s / 69 s |
| **Il Custode** | 36 | | | **750** | 32 s con la build mediana, 50 s con una debole (DPS 20), 66 s a DPS 14 |
Formula del tempo: `HP / (DPS × 0,6 di uptime + 3 di affondi)`. Obiettivo del concept (45-90 s per boss) rispettato dalle build deboli, battuto dalle buone: è il premio di Isaac. Martellata = 60 danni flat, Maschera di carbone = 40, Martello del calcare = 10×Danno in area (35 a base, 70 su pietra). I danni subiti non cambiano: ½ maschera.

**Una run senza oggetti di danno non deve essere noiosa: otto leve**
1. **La base da sola è completa**: scintilla 2,73/s (9,55 DPS), affondo 3× (18,75 DPS a contatto), parata ×2, scatto. Zero oggetti di danno battono il Custode in **60-75 s**: dentro la banda. La noia non è un problema di numeri ma di **forma**: per questo il pity forza il tag `forma`, non il Danno.
2. **Nessun pick a zero**: flag innata = +1 U; flag ignorata o delta tagliato = +0,5 U; arma perdente senza nulla = +1 U; moltiplicatore dello stesso gruppo = +1 U.
3. **Danno condizionale da fonti non-Danno**: Medaglione di Rosa, Applauso della piazza, Ultima maschera, Pugnale, Cambiale di sangue.
4. **Il Boss pool è solo forma, Danno/Fiato o contenitori**: 2 boss per run = 2 oggetti che cambiano il colpo o aggiungono ≥ +1,5 U / +0,7 T / +1 maschera.
5. **HP scalati con moderazione**: comuni +3,5 per piano, boss fissi. Con Danno 3,5 un gatto resta a 3-5 scintille o 1-2 affondi in tutti e tre i piani.
6. **L'affondo come valvola**: 3×Danno, mai sostituito, riceve le flag di stato; la Targa (+30%), l'Impugnatura (−15%) e la Fibbia lo ricordano.
7. **Consumabili di emergenza**: Smorfia 47 (40 a tutti), Mozzarella, Carta reale (il sigillo risparmiato è un Ricordo in più).
8. **Telemetria che lo verifica** (§5.9): P10 ≥ 18 DPS, P50 26-34, TTK boss mediano 45-90 s, nessuna run vinta sotto 15 DPS con più di 120 s su un boss. Fuori banda si ritoccano i pesi, non le formule.

### 5.9 Test, telemetria, regola di coerenza

- **Headless**: all'MVP matrice **5 forme × 14 flag × 4 multishot** (+ 2 trasformazioni) istanziata per 1 s, 0 crash, `fiato·n ≤ 20`, vivi ≤ 60; alla Parte 1 10 armi × 23 flag × 6 multishot = 1380; permutazioni dell'inventario → stesso hash; 1000 semi → 1000 piani validi con pity e garanzie rispettate (asserzioni sulle offerte); snapshot numerico dei casi speciali (danno per colpo, cadenza, n) uguale alle tabelle di §2.13 e §4.
- **Bot su 20 run per personaggio** prima di ogni milestone: ogni boss cade in 45-90 s con la build mediana; nessun oggetto con pick-rate < 3% o > 40% nel Ricordo; win-rate con l'oggetto entro ±15 punti dalla media; DPS a fine run P10 ≥ 18, P50 26-34, P90 ≥ 70; colpi subiti per run completa 6-10.
- **Un oggetto entra in `items.json` solo con**: le 5 celle per forma compilate (o `ignores`), lo sprite del colpo, la riga lore, il test headless passato, e **2 settimane di log** prima di toccare peso o qualità. Fuori banda: si ripesa (prima), si riscrive (poi), si taglia (ultimo). Mai bloccare coppie al pickup.
- **Regola di coerenza** (verificata da `tools/items_check.py`, bozza in §6.5, ogni volta che si tocca un JSON o questo documento): ogni flag del bitset ha almeno 1 oggetto; ogni arma di `weapons.json` ha una riga nel catalogo; ogni id citato nelle Interazioni, nelle fusioni, nei `fix_for` e negli `excl_pool` esiste; ogni pool dell'MVP ha ≥ 4 di peso e ≥ 6 voci a profilo nuovo; nessun sostantivo comune in più di 2 nomi; i totali di §3.P coincidono con il conteggio delle righe. Su questo documento lo script dà: 154 righe, 154 id unici, 80 MVP / 74 P1, 0 riferimenti orfani.
- **Tabelle delle build**: con `items.json` nasce `tools/items_calc.py` che rigenera §2.16 e §4.3 dalle formule, così i numeri non si scrivono più a mano.

### 5.10 Backlog "manca da Isaac" (non nell'MVP né nella Parte 1 salvo decisione)

Secondo slot ninnolo e fusione dei ninnoli (Mom's Purse, Smelter) · "Pianta del Vanvitelli" (+1 Stanza del Ricordo sul piano: More Options sul piano) · randomizzatori e scambi di stat (Experimental Treatment, Glass Cannon come attivo "tutto o niente") · copia del consumabile e reroll dei pickup (Blank Card, D20) e restock della Fucina · armatura di Pulcinella a 3-4 pezzi che ferisce a contatto (4° set naturale) · rimedio alle curse della Parte 1 (Black Candle: le toglie o le converte in Sorte) · Anti-Gravity (colpi sospesi che partono al rilascio) · colpi che lasciano creep, bolle lente, mini-esplosioni a chance, famigli dai colpi · famigli che generano pickup a stanza (Sack of Pennies) · "Mazzo del Custode" (sigilli infiniti per il piano) se la tabella dei drop tornasse al 20% di sigilli. Già dentro: 12 Smorfia, Cambiale di sangue (paga vita per potere), Polvere della Santabarbara (modificatore delle martellate), Edicola offensiva, 4 classi di famigli.

### 5.11 Calendario (sostituisce le righe S5-6 / S11-12 / S14 / S15-26 del concept §4.3 per la parte oggetti)

| Settimana | Cosa entra | Criterio di accettazione |
|---|---|---|
| 5-6 | `items.json` con **35 oggetti** (14 flag, 3 armi, 4 multishot, 2 trasformazioni, 8 stat, 4 attivi), `Stats.resolve()`, `weapon.gd` con 5 forme, pool e qualità, pannello stat, Banco ed Edicola, pity | matrice **5 forme × 14 flag × 4 multishot** headless, 0 crash; snapshot dei **10 casi speciali**; bot su 10 semi con offerte che rispettano pity e garanzie; il Banco compare nel 95-100% dei piani senza danno e in ≈ 1% degli altri; "la scintilla + l'affondo ti sembrano Ferruccio?" ai 5 tester della settimana 2 già risposto |
| 11-12 | gli **80**, 3 fusioni nominate, Collezione, `char_filter`, 6 trigger, Settima vita, volo, richiamo del Gatto | run completa con 3 personaggi; snapshot dei 10 casi; pool a profilo nuovo ≥ 4 di peso ciascuna; 63 icone |
| 14 | pesi definitivi da 100 run di log | pick-rate 3-40%, P50 DPS 26-34, boss 45-90 s, colpi subiti 6-10 |
| 15-20 | +40 (120), 8 fusioni, 14 speciali, Lucciola / Mangiafuoco / Alone / Botto, 5 flag, cloni, 2 set, Smorfia | pck del capitolo < 10 MiB; stesse bande; matrice 8 armi × 19 flag |
| 21-26 | 154, 13 fusioni, 17 speciali, Ago e Cannone, 3 set + Smorfia, Edicola completa | Notte intera 35-40 min; 40 sblocchi; matrice 10 × 23 × 6 = 1380 |

---
## 6. Appendice — Schema di `items.json` e come il codice lo applica

Sostituisce l'Appendice A del concept 1.0. Cinque file in `src/data/run/`: `items.json`, `weapons.json`, `flags.json`, `fusions.json`, `pools.json` (+ `unlocks.json`). Nessuna logica negli oggetti: sono dati; il risolutore li smista per fase.

### 6.1 Una voce di `items.json`

```jsonc
{
  "id": "snake_case_stabile",           // mai riciclato (contratto della Parte 2)
  "name": "Nome mostrato",
  "lore": "una riga in stile Smorfia/fiaba, ≤ 120 caratteri (mostrata dalla seconda volta che lo vedi)",
  "kind": "passive | active | weapon | trinket | consumable | familiar | transformation",
  "pools": {"ricordo": 1.0, "pegni": 0.5},   // pool → peso (quasi tutto 1.0; 0.1-0.5 per i q4 da tenere rari)
  "quality": 0,                          // 0-4 nascosta: mai usata per pesare; serve a pity, regola 50/90/98, filtri per piano
  "phase": "mvp | p1",
  "tags": ["forma", "ferro", "gatto", "lore"],   // quota forma, slot Fucina, set lore, pity
  "effects": [                           // LISTA ORDINATA di operazioni tipizzate
    {"op": "add",   "stat": "damage|tears|range|shot_speed|speed|luck|lunge_cd|lunge_range|dash_cd|dash_charges|parry_window|parry_reflect|detection", "value": 1.5},
    {"op": "flat",  "stat": "damage", "value": 2.0, "phase": "pre|post"},            // post = ignora i moltiplicatori
    {"op": "mul",   "stat": "damage|tears|range|shot_speed", "value": 1.5, "group": "x1.5|x1.5_arma|x1.2|x2_sacro|x2_cond|trasformazione|multishot"},
    {"op": "set",   "stat": "speed", "value": 1.5},                                  // riservato (nessuno all'MVP)
    {"op": "health","kind": "container|red|cera|carbone|oro", "value": 1},           // mezze maschere per red/cera/carbone/oro
    {"op": "lives", "value": 7, "containers": 1},                                     // Settima vita
    {"op": "player_flag", "id": "fly|parry|dash_extra"},                              // volo, parata per chi non ce l'ha
    {"op": "flag",  "id": "inseguitrice", "proc": {"a": 1.0, "b": 0.0, "cap": 1.0}, "per": "tear|shot"},
    {"op": "weapon","id": "raggio_velo"},                                             // priorità/forma/innate da weapons.json
    {"op": "count", "add": 1, "dmg_mult": 0.8, "rate_penalty": 1.0, "cancels_penalty": true, "geometry": "v|fan|parallel|cardinal|back|diagonal"},
    {"op": "familiar", "id": "gatto_ombra", "class": "fixed|clone|orbit|chase", "clone": 0.75, "dmg": 3.5, "rate": 1.9},
    {"op": "orbital", "radius_tiles": 1.5, "dmg": 6, "rate": 4, "blocks": true},
    {"op": "active", "charge": 6, "effect": "heal|hammer_area|grapple|freeze|fire_pool|sleep|parry_long|reroll|bomb|teleport|room_damage|mask|blood_pact", "params": {"radius_px": 120, "dmg_mult": 10, "stun_s": 0.8, "stone_mult": 2}},
    {"op": "pickup", "kind": "coins|seals|hammers|embers|cera", "value": 25},
    {"op": "economy", "shop_mult": 0.5, "drop_mult": 2.0, "drop_nothing": 0.33, "pawn_price_cera": 1},
    {"op": "set_tag", "tag": "gatto"},                                                // contato da resolve() per i set
    {"op": "trigger",
       "when": "on_hit_taken|on_room_clear|on_room_enter|on_kill|on_boss_kill|on_pickup_coin|while|still",
       "if":   {"hp_le": 1, "coins_ge": 15, "target_hp_frac_le": 0.25, "clean_rooms_ge": 1, "full_hp": true, "target_tag": "pietra"},
       "do":   [ /* altre op add/flat/mul/flag/health/pickup */ ],
       "for_s": 5.0, "until": "next_hit|room_exit|floor_exit", "stack_max": 3, "per": "shot"}
  ],
  "innate_bonus": "u_plus_1",            // cosa fa una flag già posseduta/innata: u_plus_1 (default) | nothing
  "fusion": {"with": "pistola_taddeo", "name": "Raggio di Taddeo", "icon": "...", "sfx": "fusione_01", "axis": "weapon|count", "keep_rate": "raggio_velo", "dmg_mult": 1.5, "group": "x1.5_arma"},
  "synergies": ["occhio_brilla"],        // solo informativo per la Collezione
  "anti": [{"with": "spola_oro", "mode": "let|special|excl_pool", "weight": 0.0, "warn": true}],
  "fix_for": ["brace_lanterniere+spola_oro"],
  "excl_pool": {"otre_bucato": 0.0, "nuca_dipinta": 0.25},
  "char_filter": {"exclude": ["gaetano"]},
  "floor_weight": {"1": 2.0, "2": 1.0, "3": 1.0},
  "unlock": "gatti_50",                  // id in unlocks.json o null
  "visual": {"proj": "scintilla_fili", "tint": "#ffd27a", "part": "sciarpa"},
  "icon": "res://assets/art/items/occhi_gatto.png",
  "added_in": 1                          // content_version in cui è nato
}
```

**File gemelli**: `weapons.json` (id, priority, form, innate[], ignores[], dmg_mult, rate_mult, rate_chain_rank, count_geometry, charge, overrides{flag: variante}); `flags.json` (id, kind, default proc, excl[], translate{form: "curva|ignora|innata|..."}); `fusions.json` (pair[2], result, keep_rate_of, dmg_mult, group, axis, name, icon, sfx); `pools.json` (pool → lista di id con peso; `quality_targets` per pool; `q4_reroll: [0.5, 0.9, 0.98]`; `seen_left_mult: 0.5`; `fucina_forced_tag: "ferro"`; `fusion_offer_chance: 0.25`; `min_pool_weight_new_profile: 4`; `floor1_forma_mult: 2.0`); `unlocks.json`.

### 6.2 Cinque voci complete

```json
{
  "id": "punzone_gf", "name": "Punzone G.F.",
  "lore": "Le iniziali di Gaetano battute nel ferro. La pietra le ricorda.",
  "kind": "passive", "phase": "mvp",
  "pools": {"ricordo": 1.0, "pegni": 0.5, "boss": 0.5}, "quality": 3,
  "tags": ["lore", "gaetano", "danno"],
  "effects": [
    {"op": "add", "stat": "damage", "value": 1.5},
    {"op": "trigger", "when": "while", "if": {"target_tag": "pietra"}, "per": "shot",
     "do": [{"op": "flat", "stat": "damage", "value": 2.0, "phase": "post"}]}
  ],
  "synergies": ["spola_oro", "raggio_velo"], "anti": [],
  "unlock": "pietra_30", "icon": "res://assets/art/items/pietra_gf.png", "added_in": 1
}
```
```json
{
  "id": "raggio_velo", "name": "Raggio del Velo",
  "lore": "Un filo del Velo d'oro, teso come una corda d'arco. Brucia chi lo tiene e chi lo guarda.",
  "kind": "weapon", "phase": "mvp",
  "pools": {"pegni": 0.5, "segreta": 0.2}, "quality": 4,
  "tags": ["forma", "velo", "arma"],
  "effects": [{"op": "weapon", "id": "raggio_velo"}],
  "innate_bonus": "u_plus_1",
  "fusion": {"with": "pistola_taddeo", "name": "Raggio di Taddeo", "icon": "res://assets/art/items/fusione_raggio_taddeo.png", "sfx": "fusione_01", "axis": "weapon", "keep_rate": "raggio_velo", "dmg_mult": 1.5, "group": "x1.5_arma"},
  "synergies": ["occhio_brilla", "pistola_taddeo", "otre_bucato", "tricorno_gendarme", "schegge_tufo", "petardo", "lucciola_bianca"],
  "anti": [{"with": "artiglio_quattro_canti", "mode": "let", "warn": true}],
  "unlock": null, "icon": "res://assets/art/items/raggio_velo.png", "added_in": 1
}
```
e in `weapons.json`: `{"id":"raggio_velo","priority":40,"form":"raggio","charge_s":"1/fiato","ticks":9,"tick_window_s":0.6,"tick_dmg_mult":0.6,"dmg_mult":1.0,"rate_mult":0.3333,"rate_chain_rank":2,"length":"range","innate":["perforante","spettrale"],"ignores":[],"overrides":{"rimbalzante":"rimbalzo_mezzo_danno","divisoria":"due_raggi_perpendicolari","orbitante":"giro_singolo","crescente":"cap_1.2","a_bruciapelo":"x4_contatto","brace":"no_explosion"},"count_geometry":"parallel","continuous_at_fiato":8}`.
```json
{
  "id": "sciarpa_agnese", "name": "Sciarpa di Agnese",
  "lore": "Rossa, tessuta a San Leucio. Contro il malocchio, diceva lei.",
  "kind": "passive", "phase": "mvp",
  "pools": {"ricordo": 1.0, "edicola": 0.5}, "quality": 3,
  "tags": ["forma", "agnese", "lore", "difesa", "filo"],
  "effects": [
    {"op": "add", "stat": "speed", "value": 0.3},
    {"op": "flag", "id": "fili", "proc": {"a": 1.0, "b": 0.0, "cap": 1.0}, "per": "tear"},
    {"op": "trigger", "when": "on_room_enter", "do": [{"op": "shield", "value": 1}], "until": "room_exit", "stack_max": 2}
  ],
  "fix_for": ["brace_lanterniere+spola_oro", "petardo+occhi_gatto"],
  "synergies": ["giglio_spezzato", "martello_calcare"], "anti": [],
  "unlock": null, "visual": {"proj": "scintilla_fili", "tint": "#ffd27a", "part": "sciarpa"},
  "icon": "res://assets/art/items/sciarpa.png", "added_in": 1
}
```
```json
{
  "id": "palla_cannone", "name": "Palla di cannone della Reggia",
  "lore": "Nessuno l'aveva mai sparata, finché non l'ha presa in mano un fabbro.",
  "kind": "transformation", "phase": "mvp",
  "pools": {"pegni": 0.5, "segreta": 0.2}, "quality": 4,
  "tags": ["forma", "trasformazione"],
  "effects": [
    {"op": "flat", "stat": "damage", "value": 4.0, "phase": "pre", "if_count_gt_1": {"value": 5.0, "skip_mul": true}},
    {"op": "mul",  "stat": "damage", "value": 2.0, "group": "trasformazione_palla", "skip_if_count_gt_1": true},
    {"op": "mul",  "stat": "tears",  "value": 0.42, "group": "multishot", "cancelled_by": "doppio"},
    {"op": "mul",  "stat": "size",   "value": 2.0},
    {"op": "flag", "id": "persistente", "per": "tear"}
  ],
  "synergies": ["occhi_gatto", "stoccata_corta", "schegge_tufo"], "anti": [],
  "unlock": null, "icon": "res://assets/art/items/palla_cannone.png", "added_in": 1
}
```
Voci compatte: `{"id":"occhi_gatto","kind":"passive","phase":"mvp","pools":{"boss":1.0},"quality":3,"tags":["forma","gatto"],"effects":[{"op":"count","add":1,"dmg_mult":0.8,"rate_penalty":1.0,"cancels_penalty":true,"geometry":"v"},{"op":"set_tag","tag":"gatto"}],"unlock":null}` · `{"id":"martello_calcare","kind":"active","phase":"mvp","pools":{"pegni":0.5,"ricordo":0.5},"quality":4,"effects":[{"op":"active","charge":6,"effect":"hammer_area","params":{"radius_px":120,"dmg_mult":10,"stun_s":0.8,"stone_mult":2,"windup_s":0.42,"breaks_walls":true}}],"excl_pool":{"rampino_catena":0.5},"unlock":"pegni_3"}` · `{"id":"settima_vita","kind":"passive","phase":"mvp","pools":{"pegni":0.5},"quality":3,"tags":["gatto"],"effects":[{"op":"lives","value":7,"containers":1},{"op":"set_tag","tag":"gatto"}]}` · `{"id":"lampioncino_carta","kind":"passive","phase":"mvp","pools":{"pegni":1.0,"ricordo":0.5},"quality":3,"tags":["forma","filo"],"effects":[{"op":"orbital","radius_tiles":1.5,"dmg":6,"rate":4,"blocks":true}]}` · `{"id":"mantice_fabbro","kind":"active","phase":"mvp","pools":{"fucina":0.5},"quality":1,"starting_for":["ferruccio"],"effects":[{"op":"active","charge":6,"effect":"heal","params":{"masks":1,"cast_s":0.85}}]}`.

### 6.3 Come il codice le applica

- **Caricamento** (`item_db.gd`, autoload leggero dentro `Tuning`): legge i 5 JSON una volta, valida lo schema (op note, stat note, gruppi noti, id di flag/armi/pool esistenti, `phase` nota, tutti gli id citati in `fusion`/`anti`/`fix_for`/`excl_pool`/`synergies` esistenti; un test headless fallisce al primo errore), costruisce i bitset delle flag e un indice `id → ItemDef`. Gli oggetti sono dati.
- **Inventario** (`run_state.gd`): `inventory: Array[{id, pickup_index, floor, room_type}]`, `temp_effects: Array[{source_id, ops, expires_at|until, stacks}]`, `character_id`, `lives`, `set_counts`. Il `pickup_index` serve solo al log e alla Collezione.
- **Risoluzione** (`stats.gd`, classe statica, nessun nodo): `static func resolve(char: CharDef, items: Array[ItemDef], temp: Array[TempEffect]) -> Build`. Raccoglie tutte le op (oggetti + innate del personaggio + trigger attivi) in **bucket per fase** (ADD, SET, CLAMP, WEAPON, FLAT_PRE, PALLA, MUL per gruppo, FLAT_POST, COUNT, FLAGS, FAMILIARS, SETS) e li applica nell'ordine di §2.4; dentro una fase l'ordine è per `pickup_index` ma ininfluente perché le op di una fase commutano (somme, max per gruppo, OR). Restituisce `Build` = `{stats: Dictionary, weapon: WeaponDef, fusion: String, count: int, dmg_per_shot: float, shots_per_s: float, flags: int (32 bit), per_shot_rolls: Array, familiars: Array[Build], orbitals: Array, player_flags: int, wasted_u: float, hash: int}`.
- **Quando si ricalcola**: `on_pickup`, `on_drop/reroll/pawn_sell`, `on_temp_effect_start/end`, `on_room_enter` (trigger `while` e `still`), `on_hp_changed` solo se qualche oggetto dichiara `if.hp_le`/`full_hp` (flag `needs_hp` calcolata al caricamento), `on_coins_changed` solo se `needs_coins`. **Mai per frame**: le armi leggono `RunState.build` e il segnale `build_changed` aggiorna HUD, pannello stat, famigli e orbitali.
- **Cache**: chiave = `hash(sorted(item_ids) + sorted(temp_effect_keys) + hp_bucket + coins_bucket + clean_streak)`; LRU di 32 Build. Il bot headless misura: `resolve()` di 12 oggetti < 0,2 ms.
- **Per colpo** (`weapon.gd` → una strategia per forma: `proiettile`, `raggio`, `lancio`, `contatto`, `controllato`): legge `build.dmg_per_shot`, `build.flags`, `build.count`; tira le proc `per: tear` per ogni proiettile e `per: shot` una volta per raffica (Eco, Nuca dipinta) dal flusso RNG `ai`; applica carica/volo/impatto. Gli `overrides` dell'arma e le traduzioni della forma vengono da `flags.json`/`weapons.json`, non da `match` nel codice: aggiungere una flag = una riga per forma.
- **Trigger** (`trigger_bus.gd`): i nodi di gioco emettono `hit_taken`, `room_cleared`, `enemy_killed`, `room_entered`, `coins_changed`, `player_still`; il bus confronta con le `when` degli oggetti posseduti, crea/aggiorna un `TempEffect` (con `stack_max`, `for_s` via un solo `Timer` condiviso o `until` evento) e chiama `RunState.rebuild()`. `per: "shot"` non crea TempEffect: è una condizione valutata dall'arma al momento del colpo (Pugnale, Punzone sulla pietra).
- **Pool** (`pools.gd`): pesca pesata dal flusso `items` con: rimozione al tocco, ×0,5 al visto, `floor_weight`, `char_filter`, `excl_pool`, `q4_reroll`, pity (§5.4), slot `ferro` della Fucina, offerta di fusione al 25% per piano. Registra ogni offerta in `runs_log.jsonl` (`offers[] {id, room_type, floor, taken}`) per il pick-rate.
- **Determinismo e log**: il pickup scrive `{id, floor, room_type}` come oggi; a fine run uno snapshot `build_final` (stats, arma, fusione, n, flag, DPS calcolato) per le classifiche della Parte 2 e per le bande di §5.9. Il reroll (Tombola) pesca sempre dal flusso `items`.
- **Costo di un oggetto nuovo**: 10-15 righe di JSON + icona; un'arma nuova = 1 strategia per forma se la forma esiste (1 giorno; forma nuova 2-3 giorni) + una riga in `weapons.json` + le celle di `translate` che differiscono dalla forma; una flag nuova = 5 celle + 1 sprite.

### 6.4 Test headless che il motore deve passare (si generano dai JSON)

- Ogni coppia di armi o è in `fusions.json` o ha priorità diverse (niente cicli).
- `resolve()` è indipendente dall'ordine di raccolta (permutazioni → stesso hash).
- Matrice forme × flag × multishot istanziata per 1 s senza crash e con `fiato ≤ 15`, `fiato·n ≤ 20`, vivi ≤ 60.
- Per i casi speciali: snapshot numerico (danno per colpo, cadenza, n) uguale alle tabelle di §2.13 e §4.
- Pool a profilo nuovo: ogni pool dell'MVP ≥ 4 di peso e ≥ 6 voci; 1000 semi → offerte che rispettano pity, garanzia di forma, q4 50/90/98, `char_filter`, `excl_pool`.
- Nessun pick a zero: per ogni oggetto e per ogni Build di un corpus di 200 inventari casuali, `Δ(dmg_per_shot × shots_per_s × n) > 0` oppure `wasted_u > 0`.

### 6.5 Script di coerenza (`tools/items_check.py`, bozza che gira già su questo documento)

```python
import re, sys, collections, io
text = "\n".join(io.open(p, encoding="utf-8").read() for p in sys.argv[1:])
cat = text[text.find("### 3.A"):text.find("### 3.P")]
rows, cur = [], None
for line in cat.splitlines():
    m = re.match(r"^### 3\.([A-O]) ", line)
    if m: cur = m.group(1); continue
    if not line.startswith("| "): continue
    c = [x.strip() for x in line.strip().strip("|").split("|")]
    if len(c) < 8 or c[0] == "id" or set(c[0]) <= set("-"): continue
    rows.append(dict(cat=cur, id=c[0], pool=c[3], q=c[4], inter=c[6], fase=c[7]))
ids = [r["id"] for r in rows]
assert len(ids) == len(set(ids)), "id duplicati"
per_cat = collections.Counter((r["cat"], r["fase"][:3]) for r in rows)
quality = collections.Counter(r["q"] for r in rows)
primary = collections.Counter(re.sub(r"[\s\d,()].*$", "", r["pool"].split("·")[0].strip()) for r in rows)
orphans = collections.Counter(t for r in rows for t in re.findall(r"\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b", r["inter"])
                              if t not in set(ids) and not t.startswith(("set_", "x1", "x2", "on_", "once_", "room_", "low_", "full_", "enemy_", "status_", "excl_", "keep_", "a_bruciapelo", "piccola_", "martello_fabbro")))
print(len(rows), "voci;", sum(1 for r in rows if r["fase"].startswith("MVP")), "MVP;", dict(quality), dict(primary), "orfani:", dict(orphans))
```
Quando esiste `items.json`, lo stesso script legge i JSON al posto delle tabelle e in più verifica: ogni flag di `flags.json` ha ≥ 1 oggetto; ogni arma di `weapons.json` ha una voce; ogni id in `fusion`/`anti`/`fix_for`/`excl_pool`/`synergies` esiste; pesi di pool a profilo nuovo; sostantivi comuni ripetuti nei nomi (lista in `pools.json → name_stopwords`).

---

## Fonti

- Concept e bibbia: `E:/gioco/github-base-qa/design/isaac-web/concept.md` (§0, 1.2, 1.4, 2.1, 2.3-2.9, 4.1, 4.3, App. A), `E:/gioco/github-base-qa/design/narrative/ferruccio-bibbia.md` (§IV sciarpa, §VII Gregorio, §IX Mariella e la lettera, §X Smorfia, §XII boss, §XVI fili e Velo), `E:/gioco/github-base-qa/src/data/tuning.json`, `E:/gioco/github-base-qa/src/assets/art/items/`.
- Wiki di The Binding of Isaac: Repentance (`https://bindingofisaacrebirth.wiki.gg/wiki/` + pagina): Damage, Fire_rate, Tears, Range, Shot_Speed, Speed, Luck, Tear_Height, Attributes, Characters, Health, Hearts, Soul_Heart, Devil_Room, Angel_Room, Room_Clear_Awards, Coins, Keys, Bombs, Batteries, Active_item, Shop, Treasure_Room, Items, Item_Pool, quality, Special_item, Transformations, Soy_Milk, Polyphemus, Cricket%27s_Head, 20/20, The_Inner_Eye, Mutant_Spider, Brimstone, Technology, Mom%27s_Knife, Dr._Fetus, Epic_Fetus, Monstro%27s_Lung, Tech_X, Ludovico_Technique, Spirit_Sword, Ipecac, Tiny_Planet, Loki%27s_Horns, Mom%27s_Eye, The_Wiz, Haemolacria, Proptosis, Incubus, Twisted_Pair, Tear_Effects, Status_Effects, Tough_Love, The_Common_Cold, Fire_Mind, Mom%27s_Eyeshadow, Cursed_Eye, Dead_Cat, Blind_Rage.
- IsaacDocs: https://wofsauge.github.io/IsaacDocs/rep/enums/TearFlags.html · https://wofsauge.github.io/IsaacDocs/rep/enums/WeaponType.html
- Design: McMillen & Himsl, postmortem (https://www.gamedeveloper.com/business/postmortem-mcmillen-and-himsl-s-i-the-binding-of-isaac-i-); Casey, ortogonalità (https://www.gamedeveloper.com/design/roguelike-item-orthogonality); Gungeon Synergies e Synergy Chest (https://enterthegungeon.wiki.gg/wiki/Synergies · https://enterthegungeon.wiki.gg/wiki/Synergy_Chest); Hades duo e Pool of Purging (https://www.supergiantgames.com/blog/hades-superstar-update-patch-notes/ · https://www.supergiantgames.com/blog/hades-the-blood-price-update-patch-notes); Nuclear Throne (https://en.wikipedia.org/wiki/Nuclear_Throne); descrizioni dalla seconda volta (https://www.vice.com/en/article/exit-stage-left-trying-to-escape-the-shadow-of-the-binding-of-isaac/).
