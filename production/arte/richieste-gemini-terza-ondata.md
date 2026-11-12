# Immagini da far disegnare — terza ondata (trama e zone nuove)

Documento per l'autore, 2026-11-12. Sono le figure delle parti nuove che oggi sono **disegnate col codice** in stile
a ombre: Gregorio, Assunta, il telaio di Agnese, il Sottopalco, Casertavecchia, l'Anfiteatro. Il gioco funziona
anche senza: ogni immagine che arriva prende il posto del disegno provvisorio.

**Cosa deve fare chi disegna:** solo aggiungere i PNG in `gioco/assets/sprite_teatro/`, col nome esatto. Niente
modifiche ai file `.js` e `.html`: ogni figura ha nel codice un interruttore spento apposta (così un file che manca
non dà errori), e lo accendo io quando il PNG arriva.

**Prompt di contesto e frase di stile:** gli stessi di `production/arte/richieste-gemini-seconda-ondata.md`
(allegando `gioco/assets/sprite_teatro/ferruccio.png`). Fogli a più pose: **una riga**, pose da sinistra a destra
nell'ordine scritto, celle tutte uguali, senza bordi fra le celle, sfondo trasparente, piedi alla stessa quota.

**Ordine consigliato:** H (i tre boss nuovi e Gregorio sono le figure più viste), poi I (personaggi della trama),
poi J, K, L (nemici delle zone); M è facoltativa.

## H. I boss e il Custode

| # | File | Foglio | Descrizione |
|---|---|---|---|
| H1 | `gregorio.png` | 1 riga × 7 pose, celle 384×320 | Gregorio, il Custode della Reggia: guardia reale anziana e pesante, a sagoma d'ombra. Elmo a cresta con pennacchio rosso, barba bianca, mantello rosso, giglio d'oro sul petto, mazzo di chiavi alla cintura, alabarda. Pose: fermo; cammina; anticipo (alabarda alzata dietro la spalla); attacco (spazzata); colpito; a terra (armatura vuota col mantello rosso sopra); in ginocchio (alabarda abbassata). |
| H2 | `h6_campanaro.png` | 1 riga × 7 pose, celle 512×640 | Il Campanaro Senza Volto: figura di pietra incappucciata e larga, cappuccio a punta con dentro solo il buio, corda di canapa con la nappa rossa fra le mani. Pose: cammina; alza la corda a due mani; suona (corda tirata in basso); avvolge la corda sopra la testa; sferza (corda tesa in avanti); prega in ginocchio; cambio di fase (braccia aperte). |
| H3 | `giudice-arena.png` | 1 riga × 10 pose, celle 512×640 | Il Giudice dell'Arena: figura togata a sagoma d'ombra, laticlavio rosso, corona d'alloro d'oro, braccio teso. Pose: sentenzia (braccio teso); pollice in su; pollice verso; scende dal podio; mira col gladio; fendente; affanno (piegato, è il momento in cui è scoperto); indica col dito; sentenza (braccio alto); cambio di fase. |
| H4 | `macchinista_h5.png` | 1 riga × 4 pose, celle 320×384 | Il Macchinista del Sottopalco: vecchio uomo di fatica, curvo, berretto, barba bianca, fazzoletto rosso al collo, maniche arrotolate, a sagoma d'ombra. Pose: cammina; tira la leva; tira la corda; gira la ruota. |

## I. Personaggi della trama

| # | File | Foglio | Descrizione |
|---|---|---|---|
| I1 | `assunta.png` | 1 riga × 4 pose, celle 192×256 | Assunta, popolana casertana del 1845, a sagoma d'ombra: fazzoletto annodato dietro la nuca, scialle con la frangia, gonna a pieghe, cesto di nastri al braccio, coccarda rossa e oro sul petto (unico colore acceso). Pose: ferma; si sistema lo scialle; si sventola; porge il cesto. |
| I2 | `telaio_agnese.png` | immagine singola, 800×600 | Il telaio reale di San Leucio a ombre: montanti di legno, ordito chiaro, pettine, ruota laterale, gigli d'oro sulla trave. **Senza la sciarpa**: la sciarpa rossa la disegna il gioco, lunga quanto la parte già tessuta. |
| I3 | `agnese_telaio.png` (facoltativa) | 1 riga × 2 pose, celle 256×320 | Agnese al telaio: oggi il gioco usa la figura giocabile di Agnese. Pose: tesse (seduta, mani sull'ordito); porge (in piedi, un filo rosso fra le dita). |
| I4 | `h4_uscita_piazza.png` | immagine singola, 384×512 | L'uscita verso Piazza Dante dopo Donna Luciana: un arco di quinta aperto con una lanterna appesa, sagoma scura col contorno color lanterna. |
| I5 | `h4_rastrelliera.png` | 1 riga × 3 celle, celle 512×256 | I ferri di Gaetano appesi a una rastrelliera di bottega, uno per cella: tenaglie; punzone; ago (un grosso ago da burattinaio con la cruna d'oro e un filo rosso). Ferro scuro, manici di legno, un filo d'oro sul bordo. |

## J. Il Sottopalco

| # | File | Foglio | Descrizione |
|---|---|---|---|
| J1 | `marionetta_h5.png` | 1 riga × 2 pose, celle 256×256 | Marionetta di legno scartata, senza fili: ganci vuoti sulle spalle, un brandello rosso del costume, sagoma scura col contorno color lanterna. Pose: striscia a terra; si rialza. |
| J2 | `topo_h5.png` | 1 riga × 3 pose, celle 192×128 | Topo di cartapesta fatto di pagine incollate, coda di spago, un occhio rosso. Pose: corsa 1; corsa 2; fermo in ascolto. |
| J3 | `sacco_h5.png` | immagine singola, 192×256 | Sacco di sabbia da contrappeso, legato in cima con la corda. |

## K. Casertavecchia

| # | File | Foglio | Descrizione |
|---|---|---|---|
| K1 | `h6_penitente.png` | 1 riga × 2 pose, celle 240×272 | Penitente di Pietra. Pose: di pietra (inginocchiato, saio grigio, mani giunte, volto in ombra); sveglio (in piedi, occhi di brace, crepe d'oro nel saio). |
| K2 | `h6_battaglio.png` | 1 riga × 2 pose, celle 208×176 | Battaglio di campana in ferro, con l'anello in cima. Pose: fermo sdraiato; mentre rotola. |
| K3 | `h6_sagrestano.png` | 1 riga × 2 pose, celle 240×304 | Sagrestano col turibolo: veste nera, cotta bianca corta, testa calva china, turibolo d'ottone alla catena. Pose: cammina; dondola il turibolo in alto con le braci accese. |
| K4 | `h6_corvo.png` | 1 riga × 3 pose, celle 240×192 | Corvo del campanile, sagoma nera con l'occhio chiaro. Pose: posato; ali alte; in volo radente. |

## L. L'Anfiteatro Campano

| # | File | Foglio | Descrizione |
|---|---|---|---|
| L1 | `mirmillone-latta.png` | 1 riga × 4 pose, celle 320×320 | Mirmillone di latta: elmo a cresta, grande scudo rettangolare rosso con borchia d'oro, gladio corto. Pose: avanza dietro lo scudo; alza il gladio; affondo; scoperto (scudo abbassato). |
| L2 | `reziario-ombra.png` | 1 riga × 5 pose, celle 320×320 | Reziario d'ombra: senza elmo, spallaccio, rete e tridente. Pose: gira la rete; la fa roteare; recupera la rete; punta il tridente; stocca. |
| L3 | `belva-cartapesta.png` | 1 riga × 5 pose, celle 320×272 | Belva di cartapesta (un leone da scena, criniera di carta strappata, cuciture a vista). Pose: gira intorno; si acquatta; carica; frena; stordita (seduta, testa storta). |
| L4 | `suonatore-corno.png` | 1 riga × 3 pose, celle 320×304 | Suonatore di corno dell'arena, tunica corta, grande corno ricurvo d'ottone. Pose: tiene il corno; gonfia il petto; suona. |

## M. Scenografie (facoltative: oggi dipinte col codice e leggibili)

Non sono ancora collegate: se arrivano le collego io. Opache, 1920×1080.

| # | File | Descrizione |
|---|---|---|
| M1 | `scena/casertavecchia_fondale.png` | Il borgo di Casertavecchia di notte sul crinale: la torre, il campanile del duomo, la luna, tufo grigio e pietra lavica. |
| M2 | `scena/anfiteatro_fondale.png` | L'Anfiteatro Campano di notte: arcate di travertino e laterizio, gradinate con ombre sedute di combattenti di molte epoche, torce. |
| M3 | `scena/sottopalco_fondale.png` | Il rovescio del palco visto da sotto: travi, puntelli, argani, contrappesi, quinte smontate, lame di luce dalle fessure del tavolato. |
