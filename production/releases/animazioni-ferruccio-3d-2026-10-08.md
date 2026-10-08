# Animazioni di Ferruccio dal modello 3D

Modello e materiali ricevuti nel passaggio consegne ripresi in `tools/art/ferruccio3d/`. Ambiente dedicato Python 3.13 con bpy 5.2.2 e Pillow. Luce più laterale, suddivisione della sagoma e spada abbassata a riposo.

118 fotogrammi trasparenti organizzati in tredici sequenze: riposo, corsa, salita, discesa, doppio salto, frenata, scatto, due fendenti, colpo in basso, parata, ferito e morte. Atlanti in `src/assets/art/characters/ferruccio_frames/`; GIF in `production/qa/evidence/ferruccio3d/`.

Il giocatore usa AnimatedSprite2D attraverso `sprite_rig.gd`. Attacchi e capriola seguono i tempi di gameplay; orientamento e scie copiano il fotogramma corrente. Tinta ambientale applicata senza sommare nuovamente le luci alla tunica già illuminata dal render. Nessuna modifica a movimento, hitbox o portali.

Verifica: nessun fotogramma tagliato ai bordi, test dei tredici stati caricati, sincronizzazione del fendente, parata, scia specchiata, morte non ciclica e test di esplorazione. Controllo visivo del Mercato e dell'eseguibile.
