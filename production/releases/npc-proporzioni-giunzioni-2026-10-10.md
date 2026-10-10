# Ferruccio — proporzioni e giunzioni NPC

Build: `E:/gioco/Test-Ferruccio/Ferruccio-NPC-Proporzioni.exe`.

Correzioni: proporzioni di testa, busto, braccia e gambe; postura neutra più eretta; 23 atlanti con estremità ripulite; perni agganciati alle parti dipinte, compresi gomiti, polsi, ginocchia e caviglie; ritagli delle mani; collo di Violante; figura seduta e sedia di Mariella; ali dello Spettro indipendenti dalle braccia; presa degli accessori. Il cambio verso mantiene la larghezza del personaggio e non attraversa scala zero.

Asset corretti: `src/assets/art/characters/npc_puppets_jointfix/`. Strumento: image_gen integrato. Prompt e immagini sorgente: `tools/art/prompts/npc_joint_repairs.json`. Originali conservati nella cartella `npc_puppets/`.

Riferimenti consultati: [Proko — Measuring Techniques](https://www.proko.com/course-lesson/measuring-techniques), [Andrew Ameral — Drawing the Proportions of the Human Body](https://www.artistsnetwork.com/art-techniques/drawing-proportions-human-body-ameral/).

Verifiche: test di registrazione delle giunzioni, cambio direzione, 32 configurazioni animate, 24 profili di ritaglio, integrazione con IA, introduzione/memoria e spawn élite. Alcuni test di integrazione segnalano risorse ancora in uso alla chiusura, pur con zero asserzioni fallite; i test dedicati a giunzioni e direzione terminano senza questi avvisi. Tavole di tutto il cast nelle pose di riposo, dialogo, corsa e affondo; verifiche ravvicinate e nelle stanze di gioco.
