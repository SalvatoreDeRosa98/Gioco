# Ferruccio — passaggio di consegne, 8 ottobre 2026

## Istruzioni dell'utente e priorità
L'utente vuole sviluppo autonomo, test, un eseguibile Windows aggiornato e push su GitHub. Non chiedere conferme di routine. La qualità del personaggio e degli ambienti conta quanto il funzionamento.
ULTIMA CORREZIONE VINCOLANTE: il boss finale DEVE fare danno da contatto, essere molto più veloce e trasformare il Cortile in un'arena all'ingresso. Questo sostituisce la vecchia richiesta di corpo innocuo.
Ferruccio deve recuperare il bellissimo disegno 2D originale anche nella resa 3D. Non trattare il semplice modello procedurale come qualità artistica definitiva.

## Percorsi e strumenti
- Repository: E:/gioco/github-base; progetto Godot: src/.
- GitHub: https://github.com/SalvatoreDeRosa98/Gioco.git
- Branch: claude/optimistic-wozniak-9l570p. Consultare git log e git status per lo stato più recente. Base precedente a questo lavoro: 8afc0b1.
- Git: usare -c core.autocrlf=true. Il push dal PC ha funzionato nelle sessioni recenti.
- Godot: E:/gioco/.tools/godot/Godot_v4.6-stable_win64_console.exe
- Template Windows: E:/gioco/.tools/export-templates/templates/windows_release_x86_64.exe
- Blender/Python: E:/gioco/.tools/ferruccio3d-venv/Scripts/python.exe (Python 3.13, bpy 5.2.2, Pillow).
- Python: usare -X utf8 e read_text/write_text con encoding='utf8'. Il default Windows può corrompere gli accenti!
- Leggere src/CLAUDE.md e docs/engine-reference/ prima di modificare API Godot.

## Ultimo eseguibile verificato
E:/gioco/Test-Ferruccio/Ferruccio-Metroidvania-Sigilli-3D.exe
SHA256: 5B3B450859515A9B125EE27E523F4ACF774DFF3A93024E907F28EE8FC5FBFD45
Dimensione: 210.243.280 byte.
Export riuscito con template ufficiale Godot 4.6, smoke test reale di avvio su Windows eseguito con esito positivo (processo reattivo e stabile). I vecchi eseguibili restano intatti nella stessa cartella.

## Funzioni introdotte
- Mappatura completa Gamepad (Xbox/PlayStation):
  - RT / R2: Catena / Rampino (aggancio agli anelli)
  - B / Cerchio: Martello da calcare (sfondamento pareti incrinate)
  - LT / L2: Cura con le braci (tenuto da fermo)
  - Back / Select: Mappa del mondo completa
  - Start: Menu / Pausa
  - DPad: Movimento direzionale completo e DPad Su per aprire la fucina
  - A / X / RB / LB: Salto, Attacco, Scatto (dash), Parata (parry).
  - Suggerimenti a video dinamici (HUD e mappa) che commutano tra icone gamepad (RT, B, LT, Back, LB) e tastiera (Q, V, R, M, F).
- Correzione posizionamento NPC:
  - Spostata Mariella in Corso Trieste (Stanza 1) a x=1860 (liberata la statua di salvataggio a x=2320).
  - Spostato Taddeo a San Leucio (Stanza 3) a x=1600 (liberato il portale per il Setificio a x=2120).
  - Spostata Agnese a San Leucio a x=1880 (liberata l'uscita a destra).
- Nuovi archetipi nemici con attacchi telegrafati e comportamenti unici:
  - Guardia della Città (`guardia`, HP 6, speed 110, affondo "STOCCATA" rapido con preavviso).
  - Cavaliere di Pietra (`cavaliere`, HP 10, speed 55, alterna "FENDENTE PESANTE" a corto raggio e "URTO SISMICO" con onda d'urto a terra).
  - Spettro del Calcare (`spettro`, HP 5, speed 75, levitazione sinusoidale e "RAFFICA SPETTRALE" a tre proiettili a ventaglio).
  - Popolamento distribuito in tutte le aree (Stanze 0, 1, 2, 3, 7, 8, 9, 10, 11, 12, 13, 14).
- Progressione Metroidvania per il Boss Finale:
  - Per sbloccare il Cortile d'Onore (Stanza 4) è ora obbligatorio esplorare tutte le aree e attivare tutti i 7 sigilli/meccanismi dei quartieri di Caserta:
    1. Mercato: sigillo del registro daziario (`market_seal`)
    2. Caserma: registro d'armi (`barracks_seal`) e sconfitta del capitano
    3. Cisterne: leva della chiusa reale (`sluice`)
    4. Setificio: liberazione fili del telaio (`loom`) e sconfitta della madre
    5. Campanile: suono del carillon delle campane (`bells`)
    6. Cisterne Sepolte: recupero del progetto del maglio (`hammer_plan`)
    7. Galleria Orologi: memoria dell'orologiaio (`clock_memory`)
    + 3 frammenti degli Archivi (`archive_1`, `archive_2`, `archive_3`) e decisione sul registro del padre di Gaetano nella Villa.
  - L'HUD degli Archivi mostra lo stato esatto dei sigilli (es. `Sigilli quartieri 0/7 · Testimonianze 0/3 · Esplora tutti i quartieri per aprire il Cortile`).
  - L'interazione con i sigilli emette toast dedicati a schermo con conteggio aggiornato.
- Revisione 3D di Ferruccio e Resa 3D per Personaggi:
  - Rimodellazione 3D della mesh Blender (`model.py`):
    - Cono del cappello allungato e ricurvo all'indietro con risvolto falda autentico di Pulcinella.
    - Maschera a becco d'aquila ricurva con monocolo di bronzo e lente ciano luminescente.
    - Volumi sovrapposti per maniche e calzoni a sbuffo (eliminati i tagli neri alle articolazioni).
    - Sciarpa volumetrica con nodo frontale e due code animate indipendenti.
    - Stocco affusolato con elsa a croce e lama romboidale a doppio filo.
  - Rifacimento animazioni di scherma (`anims.py`):
    - `slash_a`: caricamento ad arco alto, affondo rapido in avanti (+0.26), fendente discendente ad ampio raggio, mano secondaria di bilanciamento, sventolio sciarpa e recupero.
    - `slash_b`: avvitamento basso, passo avanti, fendente diagonale ascendente.
    - `pogo`: affondo perpendicolare sotto i piedi con gambe raccolte.
  - Nuovi atlanti completi per tutte le 17 animazioni renderizzati in Cycles e importati nel gioco. Nessun frame tagliato (0 clipping).
  - Nuovo shader `canvas_char_volume.gdshader` applicato a tutti gli NPC ed élite: conferisce illuminazione di taglio (rim lighting), profondità volumetrica pseudo-normale, ombreggiature da contatto al suolo e ambient lighting in tinta con l'area.

## Grafica e animazioni: distinguere gli asset
- Originale vincolante: src/assets/art/characters/ferruccio.png.
- Nuovo DISEGNO in stile 3D: src/assets/art/characters/ferruccio_3d_reference.png. È un'immagine generata, NON un modello 3D né il fotogramma esatto in gioco. Non confonderli.
- Modello nativo Blender: tools/art/ferruccio3d/model.py; materiali look.py; pose anims.py; rendering render.py.
- Ultimo rendering completo: E:/gioco/.tools/ferruccio3d-painted (contiene ferruccio.blend, PNG singoli, GIF, atlanti e manifesto).
- Il modello giocabile è ancora stilizzato: cappello ampliato, sciarpa allungata, bordo maschera, stoffe con UV del dipinto originale, gamba lontana visibile, lama più definita. Il riferimento generato è più dettagliato: resta una direzione artistica per ulteriori rifiniture.
- 17 sequenze renderizzate: idle/run/rise/fall/double_jump/skid/dash/slash_a/slash_b/pogo/parry/hurt/death/grapple/wall/heal/hammer.
- sprite_rig.gd carica gli atlanti. Il danno del fendente avviene al 43% della sequenza, una volta. Martello con impatto dopo la preparazione.
- Foot anchor comune, 512x512 per fotogramma. Verificati tutti i PNG: nessun taglio ai bordi.
- Tre nuovi fondali originali: campanile.png, cisterne_sepolte.png, galleria_orologi.png in assets/art/areas/espansione.

## Test e verifiche
Passati con 0 fallimenti: metroidvania_test, expansion_test, expansion_traversal_test, exploration_save_test, progression_shop_test, boss_gate_test, sprite_animation_test. Test dialoghi: 11 passati.
Il test metroidvania esegue realmente tutta la salita del campanile, controlla le uscite verticali e l'arrivo stabile, catena, salto dal muro, pogo, martello, cura, fase attiva del fendente, salvataggio e pausa mappa.
Alcuni test headless mostrano avvisi di risorse/ObjectDB all'uscita già presenti prima: distinguere questi avvisi dalle asserzioni fallite. L'ultimo smoke dell'exe non ha mostrato errori.
Log in E:/gioco/.tools/*-release.log e story-metroid.log. Screenshot delle stanze, mappa e arena in E:/gioco/.tools/metroid-*.png e arena-final.png.

## Comandi utili
Import: Godot --headless --path src --editor --import
Test: Godot --headless --path src -s E:/gioco/github-base/tests/integration/gameplay/metroidvania_test.gd
Render: python -X utf8 tools/art/ferruccio3d/render.py --out E:/gioco/.tools/nuovo-render
Usare --clips death per rigenerare solo una clip conservando il manifesto. Copiare gli atlanti, NON i PNG singoli, e animations.json nel gioco.
Export: sostituire temporaneamente custom_template/release in src/export_presets.cfg con il template locale, esportare Windows Desktop, ripristinare SEMPRE i byte originali del preset con try/finally.
Usare nomi nuovi per gli exe; non sovrascrivere quello aperto dall'utente e non chiudere i suoi processi.
Gli import Godot modificano molti .import tracciati e src/.godot/global_script_class_cache.cfg: ripristinare solo questo rumore generato dopo la verifica; includere invece i nuovi .import e .gd.uid necessari.

## Come proseguire bene
1. Partire dai feedback dell'utente sull'exe e sull'aspetto di Ferruccio; non dire che il modello ha già il dettaglio dell'illustrazione generata.
2. Migliorare anatomia, pieghe, materiali e movimenti partendo dal riferimento originale, mantenendo identità e silhouette.
3. Verificare il bilanciamento del boss veloce con un test umano, oltre ai test automatici di collisione.
4. Le nuove stanze dimostrano il sistema metroidvania; le vecchie aree non sono state tutte ridisegnate. Si può aumentare ancora la varietà dei percorsi.
5. Dopo modifiche: test pertinenti, verifica visiva, export, aggiornamento di questo documento e push. Non introdurre nuovi portali casuali o incudini frequenti.
