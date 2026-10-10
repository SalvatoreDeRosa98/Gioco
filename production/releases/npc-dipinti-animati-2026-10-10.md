# NPC ridipinti e animati

Nuovi atlanti trasparenti per tutti i personaggi di dialogo, guardie, élite, duellante, Custode e statue nemiche. I disegni sono stati generati con lo strumento integrato imagegen usando Ferruccio come riferimento di pennellata e il dipinto originale di ogni personaggio per identità e abiti. Gli originali sono conservati.

23 atlanti in `src/assets/art/characters/npc_puppets/`; 32 configurazioni comprese le varianti; 24 profili di dialogo/élite/duellante attivi, oltre ai pupazzi autonomi di Nunziatina, Custode e statua. Gatti e vespe mantengono i loro rig dipinti già articolati.

Le nuove figure usano articolazioni complete, camminata, respiro e gesti, più le azioni appropriate al proprio ruolo. Le guardie anticipano e sferrano il colpo con le clip del protagonista; i lanciatori gesticolano; il Custode anima anche salto, mantello e lama. Mariella resta seduta. Gli NPC civili non acquistano attacchi o salti nel gameplay.

Prompt di base: `tools/art/prompts/npc_puppet_atlas.txt`. Manifest con riferimenti e output selezionati: `tools/art/prompts/npc_puppet_manifest.json`. Metadati e anatomia si rigenerano con `npc_puppets.py` e `npc_puppet_poses.py`; le immagini non vengono elaborate o ritagliate su disco.

Verificati i test dei 24 profili attivi, le 32 configurazioni delle animazioni, collegamento alla IA, spawn, progressione memoria/tutorial, espansione e cancello del boss. Verifica visuale nel renderer Godot della tavola completa, delle pose e delle stanze iniziali e del Custode. Restano i preesistenti avvisi di risorse in uso alla chiusura di alcuni test, senza errori durante il gameplay.

Build di prova: `E:/gioco/Test-Ferruccio/Ferruccio-NPC-Animati.exe`. Il precedente eseguibile Memoria-e-Tutorial rimane disponibile.
