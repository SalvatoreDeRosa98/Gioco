# Prototipo: stanza con tre gatti (concept)

**Ipotesi**: se il giocatore affronta tre gatti d'ombra con fendente, parata sul lampo rosso e scatto,
il combattimento sarà leggibile e soddisfacente. Lo sapremo se esegue una parata riuscita entro i
primi tre gatti senza spiegazioni, e se vuole rigiocare la stanza almeno una volta.
Rischio più grande testato: il corpo a corpo top-down con parata è meno leggibile dello sparo di *Isaac*.

**Come si gioca**: aprire `index.html` in un browser (nessun server necessario) oppure la pagina
pubblicata https://claude.ai/artifact/PsSXdSgrt9dg8jZ9JPTXTF. Tastiera: WASD/frecce muovi · J o Z
fendente (tieni per l'affondo) · K o X parata · Spazio o Maiusc scatto · R ricomincia.
Tutti i numeri stanno nell'oggetto `PARAMETRI` in testa al file e si cambiano da URL
(`index.html?t_finestra_p=240&gatto_vita=2`). `?auto=1` fa giocare un bot per gli screenshot.

**Fonti dei numeri**: `design/gdd/controllo-ferruccio.md`, `design/gdd/combattimento.md`; i gatti
usano i valori della richiesta (il GDD `nemici.md` è arrivato dopo). Le voci `[PROTO]` non sono nei GDD.

**Stato**: in corso. Costruito e verificato con screenshot automatici (`evidenze/`), **non ancora
giocato da un umano**: il verdetto di feel è NOT ASSESSED finché l'autore non lo prova.

**Risultati**: vedi `REPORT.md` (misure del bot, domande per l'autore, valori da riportare nei GDD).

Codice usa-e-getta: non va riusato in `gioco/`.
