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
E:/gioco/Test-Ferruccio/Ferruccio-Metroidvania-Arena.exe
SHA256: E9579202193521853111045AD7FB2C976979CDEF538F9D8F45541701FD0FB5AB
Export riuscito, avvio reale dell'exe riuscito, screenshot dell'arena acquisito. I vecchi eseguibili restano nella stessa cartella e NON contengono le ultime modifiche.

## Funzioni introdotte
- 15 aree totali. Nuove: 12 Campanile delle Voci (1280x2400), 13 Cisterne Sepolte (1280x2100), 14 Galleria degli Orologi (3520x1080).
- Aperture fisiche sopra/sotto, pavimenti e soffitti interrotti coerentemente; telecamera verticale già operativa.
- Collegamenti: Belvedere 3 sopra -> Campanile 12 sotto; Campanile sopra -> Galleria 14 sotto; Galleria destra -> Archivi 11; Archivi sopra -> Galleria; Cisterne 9 sotto -> Cisterne Sepolte 13 sopra. Ritorni verticali reciproci dove configurati.
- Configurazione in src/data/expansion.json: vertical, extra_ledges, rings, cracks, spikes, landmarks. Le aperture con need richiedono un attrezzo.
- M apre/chiude la mappa e ferma il gioco. Visite memorizzate in story.seen (visited_ID), salvate alle incudini.
- Fucina B: catena gratuita; guanti gratuiti dopo la chiusa (sluice); martello gratuito dopo il progetto nelle Cisterne Sepolte (hammer_plan). Non occupano spazi accessori.
- Q aggancia gli anelli visibili entro portata. Presa al muro premendo verso la parete, Spazio per staccarsi. V usa il martello; muri rotti persistono nel salvataggio. S+attacco rimbalza anche sugli spuntoni.
- Colpire nemici guadagna braci, massimo 12. R tenuto da fermo per 0,85 s consuma 4 braci e cura una maschera.
- Due varianti di attacco per gatto, vespa, statua, duellante e incontri intermedi; fase aggiuntiva del Custode a metà vita.
- Boss: velocità 210 (prima 85), 252 in seconda fase; balzo 370, proiettili 270; preparazione/recupero accorciati, HP ancora 36. Contatto causa danno.
- boss_arena.gd: oltre x=290, chiusura, nuovi blocchi e 3 piattaforme da arena, illuminazione e camera fissa più larga; breve pausa iniziale prima dell'assalto.
- Il boss resta chiuso finché non sono raccolti 3 frammenti e deciso il destino del registro del padre.
- Conservate fucina segreta e incudini rare. Doppio salto sullo scalino invisibile sopra Piazza, poi W. Nessun portale visibile aggiunto al segreto.
- Modalità sviluppatore: Ctrl+Shift+F12, invulnerabilità, non salvata.

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
