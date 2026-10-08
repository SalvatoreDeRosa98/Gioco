# Esplorazione, parata e salvataggi — 8 ottobre 2026

Le cinque aree ora si possono attraversare senza eliminare tutti i nemici. I percorsi superiori hanno gradini per il doppio salto, un tesoro per area e collegamenti Piazza Dante ↔ Villa Comunale e Corso Trieste ↔ Belvedere. I lampioni sono ai margini dei percorsi; le mensole hanno tiranti e restano fuori dai pilastri laterali.

F/K o LB avvia una parata frontale di 0,18 secondi, con ricarica di un secondo. Solo una parata riuscita annulla il danno e ricarica scatto e fendente. L'HUD mostra la disponibilità.

Sconfiggere una statua accende un altare. W/E vicino all'altare salva stanza, posizione, monete, nemici sconfitti, altari e scelte narrative, ripristinando la vita. La morte torna all'ultimo salvataggio e annulla i progressi successivi. Il menu Continua ripristina il file su disco; Nuova partita comincia da Piazza Dante. Il vecchio file viene sostituito quando si salva la nuova partita.

Salvataggio: `user://ferruccio-save.json`, scritto prima in un file temporaneo. Le prove automatiche usano un file separato.

Verifica su Godot 4.6: importazione e compilazione; test di parata, attivazione altare, scrittura e sostituzione del file, ripristino dopo morte e riapertura; 11 test narrativi; avvio grafico della Villa Comunale e screenshot in `production/qa/evidence/exploration-2026-10-08.png`.

Il ritmo del combattimento e i percorsi richiedono ancora un playtest umano completo; questa modifica non include un nuovo eseguibile Windows.
