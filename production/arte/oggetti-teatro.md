# Oggetti del Teatro delle Marionette — catalogo alla Isaac (feedback autore D)

> Fonte: richiesta dell'autore 2026-11-09 («il pool di oggetti copialo da Isaac, ci sono anche oggetti
> negativi e gli effetti li sai dopo»). Codice: `gioco/teatro_marionette.html` (`CATALOGO_OGGETTI`,
> `OGGETTI_NUOVI_B`, blocchi `// --- D ---`), prezzi in `ECONOMIA_T3.prezzi`.
> **Proprietà intellettuale:** i nomi di Isaac compaiono SOLO nella colonna «Rif. Isaac» e nei commenti
> interni del codice; il giocatore vede solo nome e lore del mondo (Caserta 1845). Gli oggetti esistenti
> che hanno ancora il nome Isaac tra parentesi nel campo `nome` (es. «Lacrima di Piombo (Polyphemus)»)
> vanno ripuliti: il riferimento passa nel commento.

## 1. Regole del catalogo

| Voce | Valore | Motivo |
|---|---|---|
| Oggetti totali | 66 (28 esistenti + 38 nuovi); 62 giocabili subito senza i 4 «fase 2» | richiesta autore ≈ 60, verifica ≥ 55 |
| Polarità | `positivo` 50 · `misto` 6 · `negativo` 10 (8 puri + `sugna` + `ranocchio`) | ≥ 8 negativi richiesti |
| Pool per run | 20 = 17 da positivi+misti, 3 da negativi (`pesoNegativi: 0.15`, `round(20 × 0.15) = 3`) | «peso dei negativi circa 15% dei 20» |
| Prezzo Fucina | base **5**, forte **7**, negativo **2** (già in `ECONOMIA_T3.prezzi`, aggiungere `negativo: 2`) | richiesta autore; 2 = consumabile |
| Doni ingannevoli | un negativo ancora **sconosciuto** può comparire come oggetto gratis (piedistallo di stanza) con probabilità `probDonoIngannevole: 0.5`; se conosciuto, non esce gratis ma solo in Fucina a 2 | «compaiono anche come doni gratis ingannevoli»; una volta scoperto il trucco non ripunisce |
| Maledizioni (N8–N10) | durano fino al cambio di piano, poi si tolgono da sole; non si accumulano (doppione = rinnovo) | come le Curse di Isaac, legate al piano e non alla run |
| Effetti nascosti | descrizione (`statsDesc`) visibile solo se l'id è in `conosciuti` dello slot; altrimenti nome + sprite + «Effetto: ???» | «gli effetti li sai dopo» |

Polarità «misto»: grande vantaggio con un prezzo evidente (Sacred Heart, Proptosis, The Wiz…). Si
prezza per tier (5/7), entra nella quota positiva del pool.

## 2. Meccaniche nuove (chiavi `mod`, gestite in `ricalcolaStatisticheIsaac`)

| Chiave | Tipo | Regola | Clamp / sommabile |
|---|---|---|---|
| `omingForza` | numero | ogni frame la velocità del proiettile ruota verso il nemico vivo più vicino entro 160 px di `omingForza` rad (0.06 base) | max dei valori; non sommabile |
| `rimbalzi` | intero | al contatto col muro il proiettile inverte la componente normale invece di morire; `rimbalzi` volte | somma, max 3 |
| `orbitaleProiettili` | bool | i proiettili orbitano attorno al giocatore (raggio 46 px, 0.09 rad/frame) finché dura la gittata ×1.6 | on/off |
| `orbitali` | intero | N fili/gomitoli orbitanti (raggio 34 px): bloccano proiettili nemici, 2.0 danno a contatto ogni 10 frame | somma, max 3 |
| `esplosiva` | numero (raggio px) | all'impatto esplosione di raggio `esplosiva` che colpisce tutti i nemici a danno pieno; NON ferisce il giocatore (decisione aperta, §6) | max |
| `prossimita` | bool | danno ×2.0 al lancio, cala linearmente fino a ×0.3 a fine gittata | on/off |
| `diagonale` | bool | ogni colpo parte in due direzioni diagonali (±45° dalla mira) invece che dritto | on/off |
| `quattroColpi` | bool | 4 colpi a ventaglio (sostituisce `triplo`) | on/off, vince su `triplo` |
| `scudoStanza` | intero | assorbe i primi N colpi di ogni stanza (si ricarica all'ingresso in una stanza nuova) | max, max 1 |
| `bloccoProb` | 0..1 | probabilità di annullare un colpo da proiettile nemico | `1 − Π(1−p)`, max 0.5 |
| `dannoMaxHalf` | bool | ogni colpo toglie al massimo ½ maschera (annulla la regola «1 maschera intera» dei piani alti) | on/off |
| `famiglio` | `'tiratore'` \| `'contatto'` | tiratore: segue a 28 px, spara verso la mira del giocatore (o al nemico più vicino se `mira:'auto'`), danno fisso `famDmg`, cadenza `famTears`/s. Contatto: insegue il nemico più vicino, `famDmg` ogni 12 frame a contatto | un famiglio per oggetto; doppione = secondo famiglio; max 4 famigli |
| `raggio` | bool | riusa il raggio del patto (`__teatroT3.aggiornaRaggio`): tenere premuto 0.5 s carica, rilascio = raggio che attraversa la stanza, danno = dmg × 3 diviso su 10 tick | on/off |
| `maledizione` | `'mappa'` \| `'buio'` \| `'cieco'` | mappa: minimappa nascosta; buio: vignetta di raggio 150 px attorno al giocatore; cieco: tutti i piedistalli mostrano sagoma scura e «???» anche se conosciuti | fino a fine piano |
| `rangeUp` < 0, `speedUp` < 0, `tearsUp` < 0, `bonusMaxHp` < 0 | — | ammessi; range minimo 50 px (aggiungere `Math.max(50, …)`), gli altri clamp esistono già | sommabili (anche i negativi raddoppiano) |

Minimo richiesto dall'orchestrazione (5 provate): `scudoStanza`, `omingForza`, `rimbalzi`, `orbitali`,
`famiglio:'tiratore'`. Le altre sono in ordine di priorità; `raggio`, `matita` e `malocchio` possono
restare `fase 2` (oggetto fuori dal pool finché `implementato: false`).

## 3. Tabella degli oggetti

Legenda tier: B = base (5🪙), F = forte (7🪙), N = negativo (2🪙 o dono ingannevole). «Esist.» = già
nel codice (solo pulizia del nome).

### 3a. Esistenti (28)

| # | id | Nome | Tier | Polarità | Effetto | Rif. Isaac | Sprite 12×12 (per la generazione) |
|---|---|---|---|---|---|---|---|
| 1 | spada | Spada di Gaetano | F | positivo | Spada a 6 frame · DMG ×1.45 · +1.0 Flat | Mom's Knife (melee: Spirit Sword) | spada corta di ferro battuto, elsa nera, filo chiaro in diagonale |
| 2 | piombo | Lacrima di Piombo | F | positivo | +3.8 Flat · DMG ×1.9 · Tears ×0.48 · colpi giganti | Polyphemus | goccia grigio piombo con riflesso bianco |
| 3 | anello | Anello Cremisi | F | positivo | +0.8 DMG · DMG ×1.5 · perforanti | Cricket's Head + Cupid's Arrow | anello d'oro con pietra rossa |
| 4 | triplo | Triplo Occhio | F | positivo | Triplo a ventaglio · +0.4 DMG · Tears ×0.58 | The Inner Eye | tre occhi di vetro in fila |
| 5 | catena | Catena della Chiusa | F | positivo | +0.6 Tears · fulmini a catena | Jacob's Ladder | anello di catena spezzato con scintilla azzurra |
| 6 | venti | Maschera dei 4 Venti | F | positivo | 4 direzioni · +0.5 DMG | Loki's Horns | maschera di Pulcinella con quattro guance gonfie |
| 7 | chiodo | Chiodo della Fucina | B | positivo | +0.65 DMG · +20 Range | Blood Clot | chiodo da maniscalco storto |
| 8 | fuoco | Tizzone di Bragia | B | positivo | +0.6 DMG · bruciatura | Fire Mind | carbone ardente con fiammella |
| 9 | doppia | Lente di San Leucio | B | positivo | Doppio colpo · DMG ×0.8 | 20/20 | lente rotonda con montatura d'ottone |
| 10 | mercurio | Goccia di Mercurio | B | positivo | +0.85 Tears · +0.1 Speed | The Sad Onion | goccia argentata a specchio |
| 11 | cuore | Medaglione di Rosa | B | positivo | +1 maschera · cura 1 · +0.2 DMG | <3 (Heart) | medaglione ovale con rosa incisa |
| 12 | stivali | Sciarpa Rossa di Agnese | B | positivo | +0.25 Speed · +0.4 DMG · +35 Range | Speed Ball + Blood Clot | sciarpa rossa annodata |
| 13 | mantice | Mantice del Fabbro | B | positivo | +0.55 DMG · +0.45 Tears | Stigmata (variante) | mantice di cuoio con bocchetta |
| 14 | corno | Corno di Corallo | F | positivo | +1 maschera · +0.6 DMG · ×1.25 · +0.15 Speed · +20 Range | Magic Mushroom | cornicello rosso di corallo |
| 15 | campana | Campana di San Lorenzo | F | positivo | +1.0 DMG · +0.5 Flat | Pentagram | campanella di bronzo |
| 16 | fiaccola | Fiaccola del Vesuvio | F | positivo | Infuocati e perforanti · +0.4 DMG | Fire Mind + Cupid's Arrow | torcia con fiamma arancio-viola |
| 17 | lanterna | Lanterna Magica | F | positivo | Doppio colpo · +0.5 Tears · +0.3 DMG | 20/20 | lanterna magica con due fasci |
| 18 | sole | Sole d'Ottone | F | positivo | Colpi grandi · +1.5 Flat · +0.3 Tears | Cricket's Body | sole di scena raggiato, ottone |
| 19 | nastro | Nastro del Sipario | B | positivo | +0.2 Speed · +0.4 Tears | Speed Ball | nastro rosso a fiocco |
| 20 | ago | Ago di Agnese | B | positivo | +40 Range · +0.35 DMG | Range up generico (pillola Range Up) | ago lungo con filo d'oro |
| 21 | castagna | Castagna del Ciuccio | B | positivo | +1 maschera · cura 1 | Breakfast | castagna arrosto spaccata |
| 22 | cornetto | Cornetto Portafortuna | B | positivo | +0.5 DMG · +0.1 Speed | Lucky Foot (variante) | cornetto d'argento |
| 23 | bottone | Bottone di Madreperla | B | positivo | +0.7 Tears | The Sad Onion | bottone bianco iridescente a 4 fori |
| 24 | pettine | Pettine di Tartaruga | B | positivo | +0.35 Tears · +25 Range · +0.1 Speed | Wooden Spoon (variante) | pettine marrone maculato |
| 25 | pipa | Pipa di Pulcinella | B | positivo | +0.45 DMG · +30 Range | Blood of the Martyr (variante) | pipa di terracotta con fumo |
| 26 | pagnotta | Pagnotta di Port'Alba | B | positivo | +1 maschera · cura 1 · +0.05 Speed | Dinner | pagnotta dorata |
| 27 | chiave | Chiave del Camerino | B | positivo | +0.3 DMG · +0.3 Tears · +0.1 Speed · +15 Range | tutte le statistiche, piccolo (Mom's Underwear/Stats up generico) | chiave di ferro a ingegno |
| 28 | dado | Dado della Bisca | B | positivo | +0.8 Flat | Cricket's Body lite (flat) | dado d'osso con punti neri |

### 3b. Nuovi positivi (22)

| # | id | Nome | Tier | Polarità | Effetto (`mod`) | Rif. Isaac | Lore | Sprite 12×12 |
|---|---|---|---|---|---|---|---|---|
| 29 | trottola | Trottola di Piazza Mercato | B | positivo | `speedUp 0.3, tearsUp 0.2` | Speed Ball | Gira da sola da quando il Velo è sceso. | trottola di legno a strisce rosse |
| 30 | sfogliatella | Sfogliatella Riccia | B | positivo | `bonusMaxHp 2` (senza cura) | Lunch | Croccante anche dopo sei anni di incantesimo. | conchiglia di sfoglia a strati |
| 31 | pastiera | Fetta di Pastiera | F | positivo | `bonusMaxHp 2, healOnEquip 4, dmgUp 0.3` | Supper/Dessert + Stigmata | La faceva Rosa a Pasqua: il profumo riporta la memoria. | fetta gialla con griglia di pasta |
| 32 | cucchiaio | Cucchiaio del Re | B | positivo | `omingForza 0.06, tipoProiettile 'viola'` | Spoon Bender | Rubato dalla credenza della Reggia: si piega verso i nemici. | cucchiaio d'argento piegato |
| 33 | astrolabio | Astrolabio della Specola | F | positivo | `orbitaleProiettili, rangeUp 40, dmgUp 0.4` | Tiny Planet | Misurava le stelle sopra la Reggia; ora i tuoi colpi gli girano attorno. | anello d'ottone con globo al centro |
| 34 | gomma | Gomma del Burattinaio | B | positivo | `rimbalzi 2` | Rubber Cement | La colla dei fili: tutto ci rimbalza. | barattolo di colla con goccia |
| 35 | piedigrotta | Razzo di Piedigrotta | F | positivo | `esplosiva 42, dmgMult 1.6, tearsMult 0.55, tipoProiettile 'fuoco'` | Ipecac | Fuoco d'artificio della festa di settembre. | razzo rosso con miccia accesa |
| 36 | ragno | Ragno della Seta di San Leucio | F | positivo | `quattroColpi, tearsMult 0.42` | Mutant Spider | Tesse quattro fili per volta. | ragno nero con quattro zampe bianche visibili |
| 37 | elmo | Fiamma di Sant'Elmo | F | positivo | `raggio` (fase 2 se il raggio del patto non è riusabile) | Brimstone | Il fuoco blu sugli alberi delle navi al porto. | fiammella blu su punta d'albero |
| 38 | pupara | Coltello della Pupara | F | positivo | `lama` lanciata e richiamata (fase 2; fino ad allora: `spada, piercing, rangeUp 30`) | Mom's Knife | Taglia i fili di chi non va in scena. | coltellino a serramanico |
| 39 | velo-madonna | Velo della Madonna dell'Arco | F | positivo | `scudoStanza 1` | Holy Mantle | Benedetto in processione: para il primo colpo di ogni stanza. | velo azzurro piegato con aureola |
| 40 | cuoio | Maschera di Cuoio | B | positivo | `bloccoProb 0.25` | Infamy | La maschera da scena vera di Pulcinella, dura come uno scudo. | mezza maschera nera di cuoio |
| 41 | gomitolo | Gomitolo di Fili d'Oro | B | positivo | `orbitali 1` | Cube of Meat (liv. 1) | Fili che non si possono tagliare, avvolti stretti. | gomitolo dorato con capo libero |
| 42 | ostia | Ostia della Cappella Palatina | F | positivo | `dannoMaxHalf` | The Wafer | Leggera: ti fa sentire leggero anche il dolore. | disco bianco con croce incisa |
| 43 | bobby | Burattino di Tonino | B | positivo | `famiglio 'tiratore', famDmg 3.0, famTears 0.9` | Brother Bobby | Un pupazzetto che Tonino intagliò per un figlio mai nato. | burattino di legno con berretto |
| 44 | maggy | Pupattola di Agnese | B | positivo | `famiglio 'tiratore', famDmg 4.5, famTears 0.7` | Sister Maggy | Bambola di pezza cucita sul telaio reale. | bambola di pezza con fiocco rosso |
| 45 | gatto | Gatto di Vico Lungo | F | positivo | `famiglio 'contatto', famDmg 3.0` | Guppy's Hairball (orbit/contact) | Il gatto randagio del vicolo: graffia chi ti tocca. | gatto nero seduto, occhi gialli |
| 46 | diavoletto | Diavoletto del Presepe | F | positivo | `famiglio 'tiratore', mira 'auto', famDmg 3.5, famTears 0.8` | Demon Baby | Statuina rossa del presepe di San Gregorio Armeno. | diavoletto rosso con forcone |
| 47 | pulcinellino | Pulcinellino | F | positivo | `famiglio 'tiratore', famDmg 3.0, famTears 1.0, famOming` | Little Steven | Un Pulcinella piccolo così: non sbaglia un colpo. | mini Pulcinella bianco con cappello a cono |
| 48 | campanello | Campanello del Portiere | B | positivo | `tearsUp 0.5, rangeUp 20` | Wire Coat Hanger | Suona e la porta si apre. | campanello di ottone a pomo |
| 49 | tarallo | Tarallo Sugna e Pepe | B | positivo | `dmgUp 0.4, bonusMaxHp 2` | Steven/Raw Liver (variante) | Duro come la vita del popolo. | anello di pasta con puntini neri |
| 50 | carta-ventaglio | Ventaglio di Carta | B | positivo | `bloccaProiettili` (le tue lacrime annullano i proiettili nemici) · `dmgUp 0.2` | Lost Contact | Ventaglio della dama del palco reale. | ventaglio semiaperto beige |

### 3c. Misti — vantaggio forte con un prezzo (8)

| # | id | Nome | Tier | Effetto | Rif. Isaac | Lore | Sprite 12×12 |
|---|---|---|---|---|---|---|---|
| 51 | cuore-sacro | Cuore Sacro di Santa Chiara | F | `dmgMult 2.3, bonusMaxHp 2, healOnEquip 2, omingForza 0.05, tearsMult 0.6` | Sacred Heart | Ex voto d'argento: ti rende lento ma inesorabile. | cuore d'argento con fiamma in cima |
| 52 | bombarda | Bombarda di Gaeta | F | `dmgMult 2.6, size 1.8, tearsMult 0.3, velocitaColpo 0.6` | Mega Blast (versione lenta, come chiesto) | Il cannone della fortezza: un colpo ogni tanto, e la stanza trema. | palla di cannone nera con miccia |
| 53 | occhio-vetro | Occhio di Vetro del Ciarlatano | F | `prossimita, rangeUp -60, dmgUp 0.5` | Proptosis | Lo vendeva un ciarlatano a Piazza Mercato: vede bene solo da vicino. | occhio di vetro a palla, iride verde |
| 54 | cappello-mago | Cappello del Mago di Corte | B | `diagonale, tearsUp 0.3` | The Wiz | Il mago della Reggia non tirava mai dritto. | cappello a cono blu con stelle |
| 55 | matita | Matita del Censore | B | ogni 15 colpi una raffica di 8 colpi a ventaglio · `tearsMult 0.85` (fase 2) | Lead Pencil | Cancella le righe scomode dei copioni. | matita grigia spuntata |
| 56 | malocchio | Occhio del Malocchio | B | colpi caricati a raffica di 3; colpito durante la carica = rimandato all'ingresso del piano (fase 2) | Cursed Eye | Lo regalano per invidia. | occhio azzurro di vetro (nazar) incrinato |
| 57 | sugna | Sugna del Macellaio | B | `bonusMaxHp 4, healOnEquip 4, speedUp -0.25` | Bucket of Lard | Ti sazia per una settimana, ma ti appesantisce. | secchiello con grasso bianco |
| 58 | ranocchio | Ranocchio della Fontana | B | `tearsUp 1.4, rangeUp -110` | Number One | Sputa acqua dalla fontana della Reggia: tanto, e corto. | rana verde seduta che sputa |

> I misti 57–58 sono «negativi per prezzo» nel senso dell'autore: Isaac li classifica come oggetti
> con un malus netto. Nel pool contano tra i **negativi** (vedi §3d riepilogo) perché nell'uso tipico
> peggiorano la run; restano prezzati 2🪙.

### 3d. Negativi puri e maledizioni (8 + 2 misti contati = 10 negativi)

| # | id | Nome (come lo vede il giocatore) | Tier | Effetto | Rif. Isaac | Lore | Sprite 12×12 |
|---|---|---|---|---|---|---|---|
| 59 | latte | Latte di Mandorla | N | `dmgMult 0.2, tearsMult 5.5` (DPS netto −21%, §5) | Soy Milk | Dolce e leggero: i colpi diventano una pioggerella. | bicchiere di latte bianco |
| 60 | corda | Corda del Campanaro | N | `tearsUp -0.6` | pillola Tears Down | Sembra un dono; ti lega le mani. | corda di canapa arrotolata |
| 61 | zoccoli | Zoccoli di Legno | N | `speedUp -0.25` | pillola Speed Down | Rumorosi e pesanti sul selciato. | coppia di zoccoli marroni |
| 62 | spillo | Spillo Spuntato | N | `rangeUp -50, dmgUp 0.1` | pillola Range Down | Punge, ma non arriva. | spillo con capocchia rossa piegato |
| 63 | salasso | Ventosa del Barbiere | N | `bonusMaxHp -2` (minimo 1 maschera) | pillola Health Down / Blood Bag rovesciato | Il barbiere salassatore di Via Mazzini «cura» tutti. | ventosa di vetro con goccia rossa |
| 64 | nebbia | Nebbia del Volturno | N | `maledizione 'mappa'` fino a fine piano | Curse of the Lost | La nebbia sale dal fiume e cancella le strade. | nuvoletta grigia |
| 65 | lume | Lume Spento | N | `maledizione 'buio'` fino a fine piano | Curse of Darkness | Il lume a olio di San Leucio, ormai senza stoppino. | lucerna d'ottone senza fiamma, fumo |
| 66 | benda | Benda del Cieco | N | `maledizione 'cieco'` fino a fine piano | Curse of the Blind | Il cieco del sagrato ti presta la sua benda. | benda nera annodata |

Riepilogo: 66 righe numerate perché 59–66 seguono i misti; il catalogo effettivo è
**28 + 22 + 8 + 8 = 66 oggetti**, di cui **negativi = 8 puri + sugna + ranocchio = 10**.
Se l'autore vuole stare a ~60, togliere i fase 2 dal pool (`elmo`, `pupara` versione piena, `matita`,
`malocchio`): restano 62 oggetti giocabili subito, ≥ 55 come richiesto.

## 4. Effetti nascosti, conosciuti, Diario

- Stato persistente: `__teatroT3.salvataggi.impostaFlag('oggettiConosciuti', [...ids])`, letto con
  `leggiFlag('oggettiConosciuti') || []`. Una chiave flag, nessuna migrazione dello slot.
- Un id diventa conosciuto **alla raccolta** (piedistallo, Fucina, gratis, Sviluppatore, dono iniziale
  del personaggio compreso: il giocatore lo vede subito equipaggiato). Al primo raccolto: cartiglio
  con nome + `statsDesc` + lore, 180 frame.
- Prima della raccolta, ovunque (piedistallo, Fucina, Sviluppatore): sprite + nome + «Effetto: ???».
  Il prezzo resta visibile (in Isaac anche: il prezzo è parte della scommessa).
- Stanza dello Sviluppatore: conosciuti con descrizione; sconosciuti con sprite in sagoma scura e
  nome «???» (scelta più severa dell'autore per questa stanza).
- `maledizione 'cieco'`: sovrascrive tutto per il piano — anche i conosciuti tornano «???».
- Diario degli oggetti (menu ESC): griglia 8 colonne; conosciuto = sprite a colori + nome + effetto al
  passaggio/selezione; sconosciuto = sagoma nera. Contatore «Conosciuti N / 66».

## 5. Balance check (skill `/balance-check`, dominio Loot + Economia)

### Fonti
`gioco/teatro_marionette.html` righe 2698–2891 (catalogo), 3145–3154 (`ECONOMIA_T3`), 3351–3423
(`ricalcolaStatisticheIsaac`), 4387 (calibrazione monete piano 1: 5–8 monete). Nessun GDD con
intervalli per oggetto (`design/registry/entities.yaml` non consultato come fonte di target per il
Teatro): i giudizi qui sotto usano come metro la DPS di base del gioco e la scala Isaac.

### Metro DPS
DPS = dmg × tears. Base Ferruccio: 3.5 × 2.73 = **9.55**.
- `bottone` (+0.7 Tears): 3.5 × 3.40 = 11.9 → **+25%** (riferimento base).
- `campana` (+1.0 DMG, +0.5 Flat): (3.5·√2.2 + 0.5) × 2.73 = 15.6 → **+63%** (riferimento forte).
- `bobby` famiglio 3.0 × 0.9 = 2.7 aggiunti → **+28%**: in linea con base.
- `maggy` 4.5 × 0.7 = 3.15 → +33%: limite alto del base, accettabile (Maggy > Bobby anche in Isaac).
- `diavoletto` 3.5 × 0.8 = 2.8 + mira automatica → +29% ma senza mirare: forte per la comodità, ok.
- `latte` (Soy Milk): dmg max(1.0, 0.7) = 1.0, tears min(7.5, 15.0) = 7.5 → **7.5 (−21%)**: negativo
  vero per via del tetto 7.5. Con `piombo` diventa 2.77 × 7.2 = 19.9 contro 18.2 del solo piombo: la
  sinergia «da Isaac» esiste ma non rompe.
- `piedigrotta`: 3.5 × 1.6 × 1.50 = 8.4 singolo (−12%) ma AoE r 42: con 3+ nemici vicini > +150%.
  Forte giusto.
- `bombarda`: 9.1 × 0.82 = 7.5 singolo (−22%), colpi ×1.8: misto corretto, migliora molto con Flat.
- `cuore-sacro`: 8.05 × 1.64 = 13.2 (+38%) + oming + 1 maschera: forte, misto solo di nome — ok.

### Outliers / attenzione
| Voce | Atteso | Attuale | Problema |
|---|---|---|---|
| `range` minimo | ≥ 50 px | nessun clamp inferiore (`Math.min(320, 170+rangeUp)`) | `ranocchio`+`spillo`+`occhio-vetro` = 170−220 → negativo: colpi che nascono morti. **Aggiungere `Math.max(50, …)`** |
| tetto `tearsPerSec` 7.5 | — | 7.5 | rende `latte` netto negativo (voluto); `ranocchio`+`mercurio`+`bottone` arrivano al tetto presto: ok |
| `bloccoProb` impilato | ≤ 0.5 | somma libera se non clampata | doppione di `cuoio` → 0.44; con clamp 0.5 nessuno stato invulnerabile |
| `scudoStanza` + `dannoMaxHalf` + `orbitali 3` | non immortale | — | stanza con un solo nemico che spara piano diventa quasi senza rischio; accettabile perché sono 3 forti/base su 20 e i boss sparano raffiche |
| `rimbalzi` + `piercing` | durata finita | — | il proiettile vive comunque quanto la gittata: nessun loop infinito purché il timer di gittata non si resetti al rimbalzo |
| `orbitaleProiettili` + `quadDir`/`quattroColpi` | ≤ ~40 proiettili vivi | fino a 4 × cadenza × durata ×1.6 | tetto `maxProiettiliGiocatore 48` consigliato (performance + leggibilità) |
| famigli | ≤ 4 | doppioni = altro famiglio | tetto 4 |

### Economia
- Faucet piano 1 ≈ 5–8 monete → **un forte (7) o un base + un consumabile** per piano: il prezzo 5/7
  mantiene la Fucina scelta vera, non spesa automatica. Sano.
- Negativo a 2: un giocatore che lo conosce non lo compra mai → sink morto; utile solo come trappola
  per chi non lo conosce. È l'intento dell'autore (gli effetti li sai dopo). Suggerimento: in Fucina
  i negativi **conosciuti** non vengono più proposti (si ripesca), così lo slot non è sprecato.
- Doni ingannevoli: costo atteso per il giocatore nuovo = 3 negativi nel pool × 0.5 = 1.5 trappole per
  run alle prime partite, 0 dopo averli scoperti. Curva di conoscenza: reward per gli Explorer
  (Bartle) e competenza crescente (SDT) senza punire i veterani.

### Strategie degeneri
- Nessuna dominante trovata. Il rischio principale è **difensivo**: `velo-madonna` + `ostia` + `cuoio`
  rendono i piani alti molto più facili; restano forti/base separati e il pool di 20 su 66 li rende
  improbabili insieme (P ≈ (20/66)³ ≈ 2.8%). Accettabile per un roguelike (le run «rotte» sono parte
  del fascino Isaac).
- Maledizione `cieco` + effetti nascosti: doppio strato di ignoranza; dura un solo piano, ok.

### Health summary: **CONCERNS** (tuning, nessun critico)
Priorità: (1) clamp inferiore della gittata a 50 px; (2) tetti `bloccoProb ≤ 0.5`, famigli ≤ 4,
proiettili ≤ 48; (3) Fucina che non ripropone negativi conosciuti.

## 6. Decisioni aperte per l'autore
1. `esplosiva` ferisce anche Ferruccio (Isaac: sì)? Proposto **no**.
2. Maledizioni: fino a fine piano (proposto) o fino a fine run?
3. Catalogo a 66 o tagliare a 60 (via i 4 «fase 2» + 2 positivi doppioni di archetipo)?
4. Il dono iniziale del personaggio conta come «conosciuto» subito? Proposto **sì**.
