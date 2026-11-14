/*
 * storia/00-base.js — Le decisioni, i personaggi e le cose comuni a tutti i capitoli dell'avventura.
 * Solo dati (contratto in ../LEGGIMI.md). I nomi dei flag sono quelli di trama/storia.json.
 */

// --- Le sei decisioni della bibbia (§XIX): finestre a due risposte, restano per sempre nel salvataggio ---
AV.flag({ id: 'tonino_ricordo', valori: ['restituito', 'negato'], nome: 'Il ricordo di Rosa', capitolo: 'piazza-dante' });
AV.flag({ id: 'taddeo', valori: ['perdonato', 'accusato'], nome: 'Taddeo', capitolo: 'corso-trieste' });
AV.flag({ id: 'registro', valori: ['conservato', 'bruciato'], nome: 'Il registro di Gaetano', capitolo: 'villa-comunale' });
AV.flag({ id: 'agnese', valori: ['risvegliata', 'sognante'], nome: 'Agnese', capitolo: 'san-leucio' });
AV.flag({ id: 'gregorio', valori: ['dialogo', 'attacco'], nome: 'Gregorio, il Custode', capitolo: 'reggia' });
AV.flag({ id: 'violante', valori: ['uccisa', 'risparmiata'], nome: 'Donna Luciana', capitolo: 'reggia' });

// --- Fatti che seguono dalle decisioni (li scrive il capitolo che prende la decisione) ---
AV.flag({ id: 'lettera_agnese', valori: ['vera', 'falsa'], nome: 'La lettera di Agnese' });   // vera se tonino_ricordo = restituito
AV.flag({ id: 'lettera_mariella', valori: ['vera', 'falsa'], nome: 'La lettera di Mariella' }); // vera se taddeo = perdonato
AV.flag({ id: 'prove', valori: ['vera', 'falsa'], nome: 'Le prove' });                         // vera se registro = conservato o taddeo = perdonato

// --- Fatti dell'avventura (non sono nella bibbia: servono al gioco) ---
AV.flag({ id: 'volto', valori: ['nero', 'umano'], nome: 'Il volto di Ferruccio' });            // umano dopo la Fucina del Ricordo
AV.flag({ id: 'sciarpa', valori: ['al-collo', 'alla-bottega'], nome: 'La sciarpa rossa' });    // al collo se Agnese ricorda

// --- I personaggi. Ferruccio non parla: non ha battute, solo gesti («pensa») ---
AV.personaggio({ id: 'ferruccio', nome: 'Ferruccio', colore: '#f3dfc1', figura: { foglio: 'ferruccio', alt: 62 } });
AV.personaggio({ id: 'tonino', nome: 'Tonino', colore: '#f9cb40', figura: { foglio: 'scena/npc-tonino', celle: 2, alt: 62 } });
AV.personaggio({ id: 'assunta', nome: 'Assunta', colore: '#e9a15b', figura: { foglio: 'assunta', celle: 4, alt: 60 } });
AV.personaggio({ id: 'rosa', nome: 'Rosa', colore: '#f3b6b6', figura: { sagoma: 'donna', alt: 58 } });
AV.personaggio({ id: 'mariella', nome: 'Mariella', colore: '#c4b5fd', figura: { sagoma: 'donna', alt: 58 } });
AV.personaggio({ id: 'taddeo', nome: 'Taddeo', colore: '#f59e0b', figura: { foglio: 'taddeo', alt: 64 } });
AV.personaggio({ id: 'gaetano', nome: 'Gaetano', colore: '#fb923c', figura: { sagoma: 'vecchio', alt: 62 } });
AV.personaggio({ id: 'agnese', nome: 'Agnese', colore: '#f87171', figura: { foglio: 'agnese_telaio', celle: 2, alt: 62 } });
AV.personaggio({ id: 'gregorio', nome: 'Gregorio, il Custode', colore: '#cbd5e1', figura: { foglio: 'gregorio', celle: 7, alt: 78 } });
AV.personaggio({ id: 'violante', nome: 'Donna Luciana', colore: '#d8b4fe', figura: { foglio: 'donna-luciana', alt: 84 } });
AV.personaggio({ id: 'bianca', nome: 'Bianca', colore: '#fde68a', figura: { sagoma: 'bambina', alt: 44 } });
AV.personaggio({ id: 'guardia', nome: 'Guardia della Reggia', colore: '#94a3b8', figura: { sagoma: 'guardia', alt: 66 } });
AV.personaggio({ id: 'cittadino', nome: 'Cittadino di Caserta', colore: '#a8a29e', figura: { sagoma: 'uomo', alt: 60 } });
