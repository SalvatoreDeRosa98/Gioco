# Story P04 (doni ed economia): Oggetti attivi (Q), cinque slot con sostituzione, Patto d'Ombra, Crepa Dorata, Fucina = banchetto, oggetti gratis

> **Epic**: Doni ed economia
> **Status**: Done (con riserve dichiarate sotto)
> **Layer**: Feature
> **Type**: Integration + UI
> **Estimate**: L
> **Manifest Version**: N/A (nessun control manifest)
> **Last Updated**: 2026-11-09

## Context

**Fonte delle regole**: `gioco/teatro_marionette.html` (il Teatro dell'autore): OGGETTI_ATTIVI ~2381, CATALOGO_PATTO ~2397,
usaOggettoAttivo ~2760, acquisisciOggettoConLimite5Slot ~2788, confermaSostituzioneSlot ~2822, tiraOggettoGratisStanza ~3078,
apriMuroSegreto ~3089, popolaStanzaIsaac ~3229, verificaStanzaPulita ~3682, disegnaModalSostituzione5Slot ~5297.
**Architettura**: `docs/architecture/architecture.md` (dipendenze verso il basso, eventi verso l'alto, numeri nei JSON, rng seminato).
**Squadra**: oggetti/attivi/patto/segreta/banchetto (passo 2). Blocchi in `avvio.js` e `renderer.js` delimitati da
`// --- squadra oggetti: inizio/fine ---`.

---

## Acceptance Criteria (Given-When-Then)

- [x] GIVEN il personaggio scelto, WHEN la run parte, THEN l'oggetto attivo iniziale di `personaggi.json` è equipaggiato e CARICO; WHEN si preme Q a carica piena, THEN l'effetto parte (`attivo.usato`), la carica torna a 0 e l'HUD mostra le tacche vuote; a carica non piena Q non fa nulla (`attivo.scarico`) — `attivi.test.mjs` A1, `oggetti.wire.test.js` (screenshot `attivo-q.png`).
- [x] GIVEN una stanza ripulita combattendo, WHEN `stanza.pulita`, THEN +`carica_per_stanza` tacche fino a `maxCarica`; una stanza senza combattimento non ricarica — A2.
- [x] GIVEN le Forbici, WHEN usate, THEN tutti i nemici vivi sono storditi per `stordisce_ms` e feriti di max(`danno`, DMG × 1,4) — A3. GIVEN il Tamburello, THEN i proiettili nemici spariscono, i nemici entro `raggio` subiscono DMG × 0,9 e sono respinti; fuori raggio no — A4. GIVEN l'Ampolla, THEN +1 maschera intera con il tetto del massimo — A5.
- [x] GIVEN 5 doni addosso (`doni.limiti.max_slot_doni`), WHEN si acquisisce il sesto (piedistallo, banchetto, oggetto gratis), THEN nessun dono cambia e compare il modale DOM (1-5 sceglie lo slot, Esc/Q rinuncia); WHEN si conferma lo slot i, THEN il nuovo sostituisce il vecchio, le statistiche alla Isaac si ricalcolano e il vecchio TORNA sul piedistallo (origine piedistallo/gratis) o si perde (banchetto, dove si paga solo alla conferma) — `oggetti.test.mjs` S1, S2; `oggetti.wire.test.js` (`slot-sostituzione.png`).
- [x] GIVEN il boss battuto, WHEN Ferruccio non ha perso maschere nel boss, THEN l'altare del Patto compare sempre (`p_altare_senza_danno`), altrimenti al 60 % (`p_altare_con_danno`), con `reliquie_per_altare` reliquie distinte mai strette nella run; WHEN `interagisci` vicino a una reliquia, THEN il pannello di conferma mostra nome, effetti, lore e «−1 Maschera massima per sempre»; WHEN `conferma`, THEN `statistiche.stringiPatto`: −1 maschera massima permanente (sopravvive a stanza e piano), DMG ≥ ×2, flag applicati; a maschere insufficienti rifiutato; `indietro` rifiuta — `patto.test.mjs` P1, P2; `oggetti.wire.test.js` (`patto.png`).
- [x] GIVEN la stanza confinante con la segreta (finestra del generatore), WHEN è pulita, THEN la Crepa Dorata è visibile sul muro (`segreta.crepa()`, renderer); WHEN un proiettile di Ferruccio (o il settore del fendente) la tocca, THEN diventa porta su entrambi i record, la stanza è rimontata senza muovere Ferruccio (`segreta.aperta`) e si entra nella segreta; prima della pulizia il colpo non apre — `oggetti.test.mjs` Z1; `oggetti.wire.test.js` (`segreta-crepa.png`).
- [x] GIVEN la segreta, WHEN è ripulita la prima volta, THEN lascia `monete_segreta` monete a terra una volta sola — Z1.
- [x] GIVEN una stanza normale ripulita, WHEN si tira dal `seme_stanza` (`derivato(creaRng(seme), 'gratis')`), THEN con `p_forte` (0,10) compare un oggetto forte gratis, con `p_base` (1/3) uno base, dal catalogo per `teatro.tier` senza ripetizione nella run; stesso seme → stessi oggetti; `interagisci` vicino lo raccoglie attraverso i cinque slot — `oggetti.test.mjs` G1, G2.
- [x] GIVEN il banchetto di Tonino, WHEN si leggono i prezzi, THEN valgono quelli dell'autore (cuore 3, base 5, forte 7, consumabile 2: storia P09) e l'estrazione dei doni resta quella del pool della notte senza ripetizione (storia 024); il titolo del pannello è già «La Fucina» in `interfaccia.json › banchetto` (il Teatro chiama così il negozio) e il personaggio resta Tonino con i suoi dialoghi.
- [ ] GIVEN la stanza segreta, WHEN si entra, THEN ci sono mob dorati da battere — NON FATTO: la segreta non combatte (`TIPI_COMBATTIMENTO` di `stanza.js`, perimetro della squadra nemici); qui lascia le monete del Teatro alla pulizia.
- [ ] GIVEN il piano, WHEN si genera, THEN esiste una stanza di tipo `patto` (modello pd-p-01) — NON FATTO: scelta documentata sotto (altare nella stanza del boss, come la «porta del Patto» del Teatro dopo il boss); nessuna modifica al generatore.

## Evidenza

- `production/qa/evidence/attivo-q.png` — HUD dell'attivo (Forbici, tacche 0/3) dopo Q.
- `production/qa/evidence/slot-sostituzione.png` — modale «I cinque slot sono pieni» con i 5 doni e il nuovo.
- `production/qa/evidence/segreta-crepa.png` — stanza pulita con la Crepa Dorata sul muro verso la segreta.
- `production/qa/evidence/patto.png` — stanza del boss cupa (luce rossa) con il pannello del Patto.
- `production/qa/evidence/patto-raggio.png` — Raggio Cremisi Continuo sulla linea; HUD «Maschere 2/2» dopo il −1 permanente (correnti allineate al tetto).
- Suite verdi: `attivi.test.mjs` (7), `patto.test.mjs` (14 con la fixture condivisa), `oggetti.test.mjs` (13), `economia.test.mjs` (14), `statistiche.test.mjs` (11), `oggetti.wire.test.js`, `patto.wire.test.js`, più tutte le suite precedenti.

## Decisioni

1. **Altare nella stanza del boss, non stanza `patto`**: il Teatro apre la «porta del Patto» dopo il boss (100 % senza danni, 60 % con danni); nel motore l'altare compare nella stessa stanza del boss a `boss.sconfitto`, con la stanza resa più cupa dal renderer (velo rosso, nessuna lanterna aggiunta). Evita di toccare `generazione.js`/H1-H10 mentre altre squadre lavorano; la stanza `patto` dedicata resta un'estensione possibile.
2. **I patti non occupano i 5 slot**: nel Teatro entrano tra gli oggetti; qui passano da `statistiche.stringiPatto` (già presente dalla storia P04 dell'interfaccia) perché le maschere massime vivono nelle statistiche, non nel catalogo dei doni.
3. **Dono sostituito**: torna sul piedistallo/oggetto gratis (`restituisci`), si perde se comprato al banchetto (il Teatro fa lo stesso: solo il piedistallo riceve il vecchio).
4. **Proiettili e mura**: prima i proiettili di Ferruccio ignoravano gli ostacoli; ora i solidi con `ferma_colpi` li fermano (`ferruccio.colpo_muro`), necessario per la Crepa Dorata e per dare senso alle Lacrime Spettrali.
5. **Attivo e tastiera**: Q è l'azione `attivo` di `input.json`; il modale legge 1-5/Esc/Q dal DOM in cattura come il menu; il pannello del Patto usa le azioni `conferma`/`indietro`.
6. **«La Fucina»**: il titolo del pannello del banchetto era già «La Fucina» (`interfaccia.json`); resta, con Tonino come personaggio.
7. **Verifica indipendente (2026-11-09)**: in `window.__gioco` i cinque slot dei doni si chiamano `slotDoni`, perché `slot` è lo slot del salvataggio letto da `pagina.test.js` e dal menu (lo spread `...debugOggetti` lo sovrascriveva: caso 1 di `pagina.test.js` rosso, ora 5/5; `oggetti.wire.test.js` controlla che `__gioco.slot` resti una stringa). Le maschere correnti non restano sopra il massimo quando il massimo scende fuori da `patto.conferma` (es. `statistiche.stringiPatto` diretto): Ferruccio le allinea al tetto al tick successivo, come il Teatro (~2729); test P2b e `patto-raggio.png` («Maschere 2/2», prima «3/2»). I wire della squadra chiudono con «N/N casi superati» come gli altri.
