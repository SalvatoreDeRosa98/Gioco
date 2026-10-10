# NPC dipinti a ritaglio

I personaggi di dialogo e gli avversari umanoidi usano parti rigide ridipinte e perni gerarchici Node2D, seguendo il CutoutRig di Ferruccio. Il nuovo renderer `npc_painted_puppet.gd` usa atlanti trasparenti di parti complete, comprese le superfici nascoste nelle giunture. Non deforma una figura unica. Il precedente renderer a contorni resta disponibile per gli asset storici, ma tutti i 24 profili attivi di NPC, élite e duellante puntano ai nuovi atlanti.

Ci sono 23 atlanti originali nuovi e 32 configurazioni, incluse le varianti condivise. Nunziatina ora ha un intero pupazzo autonomo accanto ad Assunta. Mariella mantiene la posa seduta e la sedia immobile. Gregorio mantiene la posa inginocchiata. Custode e statua usano direttamente il nuovo renderer; gatti e vespe conservano i loro rig dipinti preesistenti.

`tools/art/npc_puppets.py` individua i rettangoli delle parti mediante l'alfa e scrive `src/data/npc_puppets.json`, senza modificare le immagini generate. `tools/art/npc_puppet_poses.py` produce anatomia e clip dedicate in `src/data/npc_puppet_anatomy.json`. Tutte le parti mantengono una scala uniforme: le rotazioni avvengono a spalle, gomiti, polsi, anche, ginocchia e caviglie. Gli abiti lunghi limitano l'ampiezza delle gambe. Un correttore appoggia i piedi al terreno, senza annullare i salti del Custode.

Le clip di corsa, guardia, colpo, salto e reazione sono campionate da `ferruccio_anim.json`; riposo, conversazione, posture sedute e inginocchiate, ali e lancio sono pose dedicate. Il ritmo segue i dati delle clip: 12 pose al secondo per la maggior parte delle azioni, 24 per i colpi del protagonista. Le fasi di anticipazione e colpo ricevono il progresso effettivo delle IA, senza cambiare danni, collisioni o durata degli attacchi. La lama del Custode viene orientata con lo stesso angolo del fendente fisico.

I test verificano che tutti i profili attivi usino gli atlanti nuovi, che le pose siano distinte, le ginocchia si muovano, i piedi si appoggino e le fasi seguano le IA. Le tavole e i fotogrammi delle stanze si producono con `tools/qa/npc_puppets_preview.gd` e `npc_puppets_gameplay_preview.gd`.

## Revisione proporzioni e giunzioni — 10 ottobre 2026

Gli atlanti corretti sono in `src/assets/art/characters/npc_puppets_jointfix/` (23 immagini). Gli originali restano conservati. Le modifiche sono state eseguite con lo strumento integrato image_gen: eliminano dischi piatti, cavità e sezioni artificiali alle estremità, conservando i materiali dipinti. Prompt e provenienza: `tools/art/prompts/npc_joint_repairs.json`.

Le proporzioni adulte usano testa più piccola, busto eretto e gambe più lunghe, con misure dedicate per copricapi, bambina e posture sedute. Riferimenti di disegno: [Proko, Measuring Techniques](https://www.proko.com/course-lesson/measuring-techniques) e [Andrew Ameral, Drawing the Proportions of the Human Body](https://www.artistsnetwork.com/art-techniques/drawing-proportions-human-body-ameral/). Il riferimento delle 7½ teste è una guida artistica, non una misura universale né una misura comprensiva dei cappelli.

I perni sono registrati sull'alfa opaca delle estremità dipinte. Il renderer allinea l'asse di ogni pezzo alla lunghezza del segmento scheletrico usando scala uniforme e rotazione; applica la stessa trasformazione alla posizione del perno. I punti del collo e delle spalle appartengono alla geometria del busto. Il velo di Violante ha un perno dedicato al collo. Le mani che includevano una seconda manica usano rettangoli limitati al polso reale. Gli oggetti seguono il centro della presa, anche quando cambia l'angolo della spada. Ali e braccia dello Spettro hanno genitori indipendenti.

Il cambio di direzione dell'NPC aspetta `turn_time` e scambia discretamente la posa speculare: `_face` rimane sempre -1 o +1, senza interpolare la larghezza attraverso zero. Un attraversamento troppo breve non innesca il cambio.

`npc_joint_registration_test.gd` verifica punti opachi e coincidenza degli estremi durante 12 campioni di attacco in entrambe le direzioni su tutte le 32 configurazioni, con eccezioni geometriche esplicite per pannelli delle gonne, testa e ali dell'insetto. `npc_facing_test.gd` verifica attraversamenti ripetuti e oscillazioni brevi. La revisione visiva comprende tutto il cast a riposo, in dialogo, in corsa e in affondo, più pose ingrandite e scene di gioco.
