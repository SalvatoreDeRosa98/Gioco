# Ferruccio: modello 3D e fotogrammi 2D

Python 3.13, dipendenze in `requirements.txt`. Il gioco non richiede Blender.

Eseguire `python render.py --out <directory>` da questa cartella. Il modello viene costruito da `model.py`, i materiali e la camera da `look.py`, le pose da `anims.py`. `--clips death` rigenera una singola sequenza conservando il manifesto.

Output: modello `.blend`, fotogrammi PNG 512×512 trasparenti, atlanti a quattro colonne, GIF su fondo neutro e `animations.json`. Copiare soltanto gli atlanti e il manifesto in `src/assets/art/characters/ferruccio_frames/`.

Diciassette sequenze: riposo, corsa, salita, discesa, doppio salto, frenata, scatto, due fendenti, colpo in basso, parata, ferito, morte, catena, presa al muro, cura e martello. La camera e l'ancora dei piedi sono identiche in tutti i fotogrammi. Rotazioni nel piano laterale; gonna e sciarpa seguono lo scheletro. Le hitbox e il movimento vengono gestiti da Godot. Il danno del fendente arriva al 43% della sequenza, dopo la preparazione. I materiali dei vestiti usano porzioni UV del dipinto originale ferruccio.png; il cappello, la sciarpa lunga e la cornice della maschera sono geometria 3D. ferruccio_3d_reference.png è un riferimento artistico generato, non una mesh.

`sprite_rig.gd` carica gli atlanti in AnimatedSprite2D. Gli attacchi e la capriola seguono il tempo dello stato del giocatore; le altre sequenze usano il frame rate del manifesto. Il vecchio CharRig resta disponibile nel sorgente come riferimento, ma non viene istanziato dal giocatore.
