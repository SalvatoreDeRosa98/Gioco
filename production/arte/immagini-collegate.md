# Immagini di scena dell'autore: quali sono collegate al gioco, quali no, e perché

Documento per l'autore, 2026-11-10. Riguarda i 52 PNG consegnati in `gioco/assets/sprite_teatro/scena/`
(richieste: `production/arte/richieste-gemini-palcoscenico.md`).

Regola seguita, tua: **«usa la mia immagine dove migliora il gioco, tieni il disegno a codice dove è più bello,
e mostrami ogni scelta con una foto prima e dopo»**. Ogni immagine è stata guardata da sola e poi dentro il
gioco, alla misura vera (canvas 640×360), accanto al disegno a codice che sostituirebbe.

- **Collegate: 28.** **Lasciate a codice: 24** (di cui 7 non hanno un posto nel gioco: le 4 carte e le 3 porte).
- La scelta sta in UNA tabella, `IMMAGINI_B9` in cima a `gioco/teatro/b9-immagini.js`: una voce per immagine con
  `usa: true/false` e il motivo. **Per riaccendere un'immagine rigenerata basta rimettere `usa: true`**: il
  collegamento c'è già per tutte (tranne carte e porte) e la release incorpora da sola solo quelle usate.
- Se un'immagine manca o non si carica, il gioco disegna il vecchio disegno a codice: mai un buco, mai un errore.

## Foto prima / dopo

In `production/qa/evidence/`. Ogni foglio ha tre colonne: **PRIMA** (tutto a codice), **DOPO** (la scelta fatta),
**PROVA** (tutte le immagini accese, anche le scartate: così vedi come sarebbero state).

| Gruppo | Foto |
|---|---|
| Palchetti, platea, lanci, sipario | `teatro-immagini-palchetti-platea-prima-dopo.png` |
| Ribalta (lumi, cavi) | `teatro-immagini-ribalta-prima-dopo.png` |
| Ostacoli · Corso Trieste | `teatro-immagini-ostacoli-corso-trieste-prima-dopo.png` |
| Ostacoli · Villa Comunale | `teatro-immagini-ostacoli-villa-comunale-prima-dopo.png` |
| Ostacoli · San Leucio | `teatro-immagini-ostacoli-san-leucio-prima-dopo.png` |
| Ostacoli · Reggia | `teatro-immagini-ostacoli-reggia-prima-dopo.png` |
| Forzieri e lucchetto | `teatro-immagini-forzieri-lucchetto-prima-dopo.png` |
| Stanze speciali (Bisca, Sacrificio, Clessidra) | `teatro-immagini-stanze-speciali-prima-dopo.png` |
| Trasformazioni | `teatro-immagini-trasformazioni-prima-dopo.png` |
| Interfaccia | `teatro-immagini-interfaccia-prima-dopo.png` |
| Immagini senza un posto nel gioco (carte, porte) | `teatro-immagini-non-collegate.png` |

## Una riga per immagine

### A. Il teatro attorno al palco

| Immagine | Usata | Dove | Perché · cosa cambiare se la rifai |
|---|---|---|---|
| `palchetto.png` | **sì** | palchi di proscenio ai lati e balconata in alto (b1) | È la più bella del lotto. Gli spettatori stanno fra due strati presi dalla stessa immagine: dietro festone, drappi e interno coi lumi; davanti il parapetto dorato e il festone. Ai lati si vede la parte centrale del palchetto alla scala giusta per farci stare due spettatori; in alto la balconata è composta coi suoi pezzi (cornice, festone, colonnine, parapetto). |
| `spettatori.png` | no | — | Sei sagome quasi uguali (un ovale con una testa) e quattro fotogrammi che non si distinguono; quelle a codice hanno cilindri, piume, ventagli, binocoli e si muovono. **Per usarla:** busti veri e diversi fra loro, copricapi grandi, mani ben visibili nei due fotogrammi dell'applauso, un filo di luce calda sul contorno. |
| `platea.png` | **sì** | fila di fondo della platea, dietro le sagome animate (b1) | Riempie la platea: sembra un teatro pieno. Le teste sono nere su fondo nero, quindi il gioco ci passa sopra un filo di luce dorata; non va mai sotto i riquadri dell'HUD in basso a sinistra. |
| `sipario-telo.png` | no | — | Strisce piatte senza pieghe né ombre: il velluto a codice ha volume, gallone e frangia. **Per usarla:** pieghe profonde sfumate (luce e ombra morbide), bordo dorato e frangia veri. |
| `sipario-mantovana.png` | no | — | Festoni a tre fasce di rosso piatto: accanto al velluto a pieghe del telo stonano; la mantovana a codice ha pieghe, ombre, frangia e nappe. **Per usarla:** lo stesso velluto sfumato del telo; l'ovale al centro vuoto. |
| `lancio-fiore.png` | **sì** | fiori lanciati dal pubblico agli applausi (b1) | Si legge molto meglio del puntino a codice. |
| `lancio-mazzo.png` | **sì** | idem, un lancio su due | Idem. |
| `lancio-ortaggio.png` | **sì** | pomodori dopo i fischi (nuovo, solo scena) | Come i fiori non volano mai con nemici vivi in stanza: se i fischi arrivano in piena lotta, i pomodori partono appena la stanza è ripulita. |
| `lume-ribalta.png` | **sì** | gli otto lumi della ribalta (b2) | Conchiglia d'ottone e fiamma a 4 fotogrammi: si capisce che sono lumi di ribalta. Il bagliore lo aggiunge il gioco. Nota: è visto dal lato del palco (fiamma davanti al riflettore); dal pubblico si vedrebbe il dorso. |
| `cavo-gancio.png` | **sì** | gancio in fondo ai cavi dei pezzi ancora a codice (b2) | La corda resta il tratto del gioco (si piega quando il cavo è lasco). Le quinte con la tua immagine hanno già l'anello: lì arriva un cavo solo, dritto sull'anello. |

### B. Scenografia appesa ai cavi (ostacoli)

Le collisioni non cambiano: ogni immagine è ridotta sull'ingombro dell'ostacolo. Tutte prendono un filo di luce
calda sul contorno (come le sagome «a ombre»), altrimenti quelle scure sparivano sui pavimenti scuri.

| Immagine | Usata | Dove | Perché · cosa cambiare se la rifai |
|---|---|---|---|
| `ostacolo-lampione.png` | **sì** | lampioni di Corso Trieste | Pulito, la lanterna è più bella di quella a codice. |
| `ostacolo-carretto.png` | **sì** | colonne di base a Corso Trieste (una su due) | Al posto del pilastro grigio uguale in tutti i quartieri. |
| `ostacolo-fontanella.png` | **sì** | colonne di base a Corso Trieste (una su due) | È stretta e alta: non entra nell'ingombro largo della fontana tonda della Villa (che resta a codice), quindi fa da quinta al Corso. |
| `ostacolo-albero.png` | **sì** | colonne di base alla Villa Comunale (una su due) | Con le lucciole sta benissimo sul prato. |
| `ostacolo-aiuola.png` | **sì** | aiuole della Villa Comunale | A sinistra il disegno tocca il bordo dell'immagine (manca il margine): a schermo non si nota. |
| `ostacolo-panchina.png` | **sì** | colonne di base alla Villa Comunale (una su due) | — |
| `ostacolo-telaio.png` | **sì** | telai di San Leucio e colonne di base a San Leucio | Pulito; la pezza rossa si vede bene. |
| `ostacolo-balla-seta.png` | no | — | Un ovale bianco col bollo rosso: a schermo sembra un uovo o uno scudo. **Per usarla:** balla bassa e larga di tela grezza legata con corde, con un lembo di seta colorata che esce. |
| `ostacolo-arcolaio.png` | no | — | Figura filiforme e scura: non si legge come un ostacolo pieno (blocca passi e colpi) e sul pavimento rosso scuro quasi sparisce. **Per usarla:** più massiccio (ruota piena, matassa grossa, base larga), legno più chiaro. |
| `ostacolo-colonna.png` | **sì** | colonne di marmo e colonne di base alla Reggia | Molto meglio del cilindro grigio. |
| `ostacolo-statua.png` | **sì** | statue della Reggia | Il gioco la vela di grigio-azzurro (gesso in ombra): così resta ben diversa dal nemico Torrione di Marmo, che è un busto alato di marmo bianco. |
| `ostacolo-candelabro.png` | **sì** | candele accese (bruciano se le tocchi) | Solo da acceso: spento resta il disegno a codice. In alto tocca il bordo dell'immagine. |
| `ostacolo-braciere.png` | **sì** | bracieri di base, spento e acceso | La fiamma alta dice molto meglio «brucia». |
| `ostacolo-cassa-polvere.png` | **sì** | casse di polvere | La miccia accesa lampeggia come prima (è un avviso di gioco). Nell'immagine c'è una scritta minuscola «POLVERE»: a schermo è larga 3 px e non si legge; se la rifai, toglila. |
| `ostacolo-botte.png` | **sì** | botti fragili di Corso Trieste | — |
| `ostacolo-sacco.png` | **sì** | sacco di sabbia appeso (trappola con la leva) | L'anello in cima è perfetto per la corda. |
| `trappola-chiodi.png` | no | — | Chiodi grigio scuro e sottili sulle assi brune: a schermo i tre stati non si distinguono, e una trappola deve dire subito quando è fuori. **Per usarla:** chiodi di ferro chiaro, grossi; nel terzo fotogramma lunghi il doppio e con la punta accesa; assi più scure. |

### C. Eventi e botteghe

| Immagine | Usata | Dove | Perché · cosa cambiare se la rifai |
|---|---|---|---|
| `carta-dorso.png`, `carta-asso-denari.png`, `carta-re-coppe.png`, `carta-cavallo-spade.png` | no | — | Non servono più: il ciarlatano gioca con tre scatole, non con le carte. |
| `npc-ciarlatano.png` | no | — | Figura minuta e sottile dentro la cella, col tavolino a crociera che si confonde con le tre scatole del gioco; sul tavolo ha le carte. **Per usarla:** figura più piena che riempie la cella (mantellina ampia, tuba grande), tavolino col piano ben visibile e VUOTO. |
| `npc-don-gennaro.png` | **sì** | banco del lotto (a3): fermo, e «estrae» quando giochi | Il banco adesso ha il suo banchiere. Il cartello sul banco aveva una scritta: il gioco lo imbianca e ci scrive sopra l'ultimo numero uscito. |
| `npc-cartomante.png` | **sì** | Cartomante della Bisca (a3) | Solo la riga «ferma»: nella riga «legge» la carta ha dei contorni ripetuti attorno (un difetto del generatore). |
| `banco-lotto.png` | no | — | Doppione: il foglio di Don Gennaro ha già il suo banco. In più porta la scritta «IL LOTTO». |
| `ceppo-chiodi.png` | no | — | Quasi nero a tinta piatta: sul pavimento scuro della stanza sparisce e restano solo i chiodi. **Per usarla:** legno bruno più chiaro, faccia superiore ben leggibile, chiodi grossi e chiari; deve riempire la cella. |
| `forzieri.png` | **sì** | forzieri comuni e ferrati, chiusi e aperti (a1) | Il gioco li schiarisce un po' (erano scuri sui pavimenti) e nel forziere aperto oscura l'oro: nel gioco «aperto» vuol dire vuoto, il bottino è già a terra. |
| `lucchetto-porta.png` | **sì** | porte chiuse a chiave (a1) | Le due catene incrociate restano disegnate dal gioco (nell'immagine non ci sono). |
| `clessidra.png` | **sì** | Clessidra della Ribalta (b7) | Telaio tuo, sabbia del gioco (è il tempo vero della sfida). |

### D. Trasformazioni di Ferruccio

Provati su tutti e quattro i personaggi, fermi e in movimento, da tutte e due le parti. Nessuno dei quattro
accessori migliora il costume a codice: **restano tutti a codice.**

| Immagine | Usata | Perché · cosa cambiare se la rifai |
|---|---|---|
| `trasf-re-denari-corona.png` | no | Corona d'ebano scura: su Taddeo e su Pulcinella d'Ombra si vedono solo i puntini d'oro. **Per usarla:** contorno d'oro attorno a tutta la corona, punte più alte. |
| `trasf-re-denari-mantello.png` | no | È visto di spalle e simmetrico: dietro un burattino di tre quarti spunta solo come uno straccio rosso fra le gambe. **Per usarlo:** di tre quarti (burattino rivolto a destra), aperto a ventaglio dietro le spalle, più largo del corpo. |
| `trasf-pulcinella-maschera.png` | no | Macchia nera senza bordo né occhi: sul viso non si distingue. **Per usarla:** cuoio bruno con bordo chiaro e fori degli occhi, di tre quarti rivolta a destra. |
| `trasf-ombra-velo.png` | no | Un alone grigio con una spirale di tratti rossi e neri: dietro il burattino quasi non si vede e non si legge come un velo. **Per usarlo:** un velo pieno, nero-viola semitrasparente, più largo del burattino, coi lembi strappati che fluttuano; niente tratti a spirale. |

### E. Porta della bottega

| Immagine | Usata | Perché · cosa cambiare se la rifai |
|---|---|---|
| `porta-bottega-chiusa.png`, `-socchiusa.png`, `-aperta.png` | no | Portano la scritta «LA BOTTEGA» sull'insegna e sono abbozzi a tinte piatte. L'hub è di un'altra squadra: non l'ho toccato. **Per usarle:** insegna senza scritta, legno dipinto con venature e ferramenta (alla maniera del palchetto). |

### G. Interfaccia

| Immagine | Usata | Dove | Perché · cosa cambiare se la rifai |
|---|---|---|---|
| `ui-cartiglio-opzioni.png` | **sì** | cornice delle Opzioni (b3) | I due rotoli stanno fuori dal riquadro dei testi, i fregi sopra il titolo e sotto il piede; il rosso dei rotoli è scurito verso il cremisi del gioco. |
| `ui-cursore-mano.png` | **sì** | cursore del menu di pausa e delle Opzioni (b3) | La mano di marionetta al posto dei triangolini: ha carattere e si vede. |
| `ui-pad-simboli.png` | no | — | Alla misura delle scritte (7-9 px) sono dischetti scuri con la lettera illeggibile: i caratteri Ⓐ Ⓑ Ⓧ Ⓨ si leggono meglio. **Per usarli:** simboli chiari (oro pieno o avorio) con la lettera grossa che riempie il cerchio: devono leggersi a 10 px. |
| `ui-tasto-pergamena.png` | no | — | Alto 12 px, i due estremi decorati stringono la lettera fra due macchie. **Per usarlo:** estremi sottili (solo un bordino arrotolato), niente punti né staffe. |
| `ui-interruttore-lanterna.png` | no | — | In una riga alta 13 px la lanterna è una macchiolina. **Per usarlo:** forma larga e bassa (circa 3 a 1) che si legga a 28×10 px, per esempio una targhetta con la lanterna da un lato che si accende. |
| `segni-boss.png` | no | — | Sono quattro medaglioni su dieci segni: nella stessa riga stanno accanto a sei icone a pixel senza medaglione, e la riga si spezza in due stili. **Per usarli:** tutti e dieci nello stesso stile (anche gatto, chiave, ago, campana, forbici, maschera di Donna Luciana). |

## Come sono collegate (per chi tocca il codice)

- Tutto sta in `gioco/teatro/b9-immagini.js` (caricato per ultimo). `immagineScena(nome)` è il caricatore unico;
  ogni cella è ridotta UNA volta su una tela fuori schermo alla scala del buffer e poi solo copiata.
- Agganci nei file delle altre squadre (una o due righe l'uno): `60-resa.js` (ciclo degli ostacoli), `b2-ribalta.js`
  (lume, cavo), `b7-stanze.js` (chiodi, sacco), `a3-stanze-speciali.js` (ceppo, banco, cartomante),
  `b3-comandi-opzioni.js` (cartiglio, interruttore, tasto, cursori). Il resto avvolge funzioni che c'erano già.
- Verifica: `node tools/qa-teatro-immagini.js gioco/teatro_marionette.html <prefisso> --release <cartella>`
  rifà tutte le foto, controlla che ogni immagine usata sia caricata e disegnata nel suo contesto, che senza
  risorse il gioco ripieghi sul codice senza errori, e che la release incorpori esattamente le immagini usate.
