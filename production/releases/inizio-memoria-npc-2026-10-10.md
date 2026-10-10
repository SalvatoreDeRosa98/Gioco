# Inizio, memoria e NPC — 10 ottobre 2026

Nuovo eseguibile: E:/gioco/Test-Ferruccio/Ferruccio-Memoria-e-Tutorial.exe.

- Piazza Dante ristrutturata come introduzione progressiva, con un nemico alla volta e nessun salvataggio.
- Rimossi statua interattiva, basamento, tesoro irraggiungibile e ingresso invisibile alla fucina nella Piazza.
- Porta della fucina su Corso Trieste, con indizi di Tonino, Assunta e Mariella e ritorno alla stessa soglia.
- Dialogo con Gaetano: volto umano di Ferruccio e primo accesso ai salvataggi.
- Dono della sciarpa nel ramo della memoria risvegliata di Agnese: aspetto e scatto si sbloccano durante il dialogo.
- 18 configurazioni articolate per tutti i personaggi di dialogo con dipinto visibile.
- Guardie, capitano, cavaliere, Madre, Spettro e duellanti passano allo stesso sistema a ritagli; danni e tempi di combattimento rimangono nelle configurazioni esistenti.
- Suggerimenti di porte, incudini, HUD, mappa e pausa coerenti con tastiera o controller.
- Pausa con ripresa della stessa sessione; ritorno al menu distinto.
- Gatto del Mercato liberato dal blocco iniziale; Spettro del Calcare rimosso dal Mercato.
- Controlli preventivi dei punti di comparsa per gatti, élite e NPC.

Verifica: test dei comandi iniziali con input e fisica reali; percorso narrativo completo fucina/Agnese/salvataggio/caricamento; copertura geometrica di tutti i rig NPC; regressioni di combattimento, parata, animazioni, esplorazione, strumenti, acquisti e apertura del boss; controlli visivi del gioco e della tavola dei personaggi.

Anteprime riproducibili con tools/qa/introduction_visual_preview.gd e tools/qa/painted_characters_preview.gd, usando il rendering Godot normale. Gli output sono in E:/gioco/.tools/.

Per provare tutto il nuovo inizio scegliere **Nuova partita**. I vecchi salvataggi conservano i progressi e vengono adattati ai doni narrativi già ottenuti.

Export Windows verificato: 252.427.720 byte. SHA256: EB55D3371EB2B8ACEC0C35171DEF84AFBBF99F0695522133FCEAFAEFEF4AF8A0. Avvio reale del pacchetto con rendering OpenGL: codice di uscita 0. Il log mostra solo gli avvisi ObjectDB/risorse durante la chiusura già presenti nei test precedenti; nessun errore di script durante il gioco.
