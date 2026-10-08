# Ingresso nella fucina e modalità sviluppatore

Corretto il doppio utilizzo della stessa pressione W: entrando nella fucina dal gradino invisibile veniva attivata subito anche l'uscita. Ora l'uscita viene controllata soltanto se l'interazione non ha appena cambiato stanza.

Il test di esplorazione ora esegue l'intero aggiornamento del mondo: falliva con la versione precedente e passa con la correzione. Verifica anche la permanenza nella fucina, l'uscita con una nuova pressione W e l'uscita camminando.

Ctrl + Shift + F12 attiva/disattiva una modalità sviluppatore nascosta durante la partita. Attivandola ripristina la vita; danni diretti, proiettili e attacchi non tolgono vita né respingono il giocatore. La protezione continua cambiando stanza e non viene salvata su disco. Un'etichetta è visibile soltanto mentre è attiva. Nessun accesso agli obiettivi viene sbloccato automaticamente.

Il test del Custode verifica il comando, i danni annullati, il cambio stanza, la ripetizione del tasto ignorata e il ritorno ai danni normali dopo la disattivazione.

La proposta dettagliata dei dieci ambienti, dei due snodi e dei percorsi alternativi è in `design/levels/espansione-caserta.md`. Le cinque nuove aree proposte non sono ancora implementate.
