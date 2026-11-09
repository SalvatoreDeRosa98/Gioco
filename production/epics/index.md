# Epics Index

Last Updated: 2026-11-09
Engine: Web (browser): Canvas 2D, ES modules, renderer pixel-art del Teatro

Il 2026-11-08 l'autore ha consegnato il **Teatro** (`gioco/teatro_marionette.html`), prototipo completo del design nuovo e fonte
delle regole; il porting sul motore è raccontato dalle storie **P01-P12** sotto, aggiunte alle epiche originali. Le storie numerate
000-033 sono della bozza precedente (presepe d'ombre): dove il porting le ha chiuse o superate è segnato nella seconda tabella.

| Epic | Layer | GDD | Status | Stories |
|------|-------|-----|--------|---------|
| [Fondazione del motore](fondazione/EPIC.md) | Foundation | design/gdd/controllo-ferruccio.md (regola 1) | Ready | 9 (000-006, P02, P12) |
| [Ferruccio e combattimento](ferruccio-e-combattimento/EPIC.md) | Core | design/gdd/controllo-ferruccio.md | Ready | 9 (007-013, P08, P11) |
| [Stanze e piano 1](stanze-e-piano-1/EPIC.md) | Core | design/gdd/stanze-porte.md | Ready | 5 (014-018) |
| [Nemici e Gatto dei Quattro Canti](nemici-e-gatto/EPIC.md) | Feature | design/gdd/nemici.md | Ready | 7 (019-022, P01, P05, P06) |
| [Doni ed economia](doni-ed-economia/EPIC.md) | Feature | design/gdd/doni-modificatori.md | Ready | 5 (023-025, P04, P09) |
| [Storia e hub](storia-e-hub/EPIC.md) | Feature | design/gdd/stato-narrativo.md | Ready | 5 (026-030) |
| [Interfaccia e QA](interfaccia-e-qa/EPIC.md) | Presentation | design/ux/hud.md (da scrivere) | Ready | 7 (031-033, P03, P04, P05, P10) |

## Storie del porting del Teatro (P01-P12)

| # | Epica | Storia | Status |
|---|---|---|---|
| P01 | nemici-e-gatto | Boss provvisorio e uscita del piano (provvisoria per la build di prova) | Done, sostituita dalla P06 (l'uscita e la discesa restano) |
| P02 | fondazione | Pagina di prova `prova.html` e parametri di avvio dalla pagina; niente touch | Done (provvisoria) |
| P03 | interfaccia-e-qa | Riallineo delle suite al Teatro: i test leggono i valori dai JSON | Done |
| P04 | interfaccia-e-qa | Menu di selezione, statistiche alla Isaac, sparo con le frecce, tabelle del Teatro in JSON | **In Progress**: manca l'HUD pixel-art del Teatro nel canvas (nome · piano, mezze maschere, danno, slot) |
| P04 | doni-ed-economia | Oggetti attivi (Q), cinque slot con sostituzione, Patto d'Ombra, Crepa Dorata, oggetti gratis, Fucina = banchetto | Done (riserve: mob dorati solo come predone, niente stanza `patto` dedicata) |
| P05 | interfaccia-e-qa | Verifica di pagina del menu, degli slot e delle frecce; `suite-completa.sh` | Done |
| P05 | nemici-e-gatto | Nemici alla Isaac del Teatro e proiettili nemici; telegrafo solo sul corpo | Done |
| P06 | nemici-e-gatto | Boss del pool, Donna Luciana, stato della run, sipario narrativo, ciclo infinito | Done (playtest dei duelli lasciato all'autore) |
| P08 | ferruccio-e-combattimento | Game feel: i-frames 1 s con lampeggio e rimbalzo, hit-stop, knockback ∝ 1/peso, scossa, macchie | Done |
| P09 | doni-ed-economia | Economia: scarsità del piano 1, prezzi dell'autore 3/5/7/2, Patto potentissimo | Done |
| P10 | interfaccia-e-qa | Audio dinamico minimale con Web Audio API, nessun file | Done |
| P11 | ferruccio-e-combattimento | I due fili del Velo: uno per Mano, meno visibili | Done |
| P12 | fondazione | Audit di architettura «lo stato non disegna, la resa non muta», passo fisso a 120 Hz | Done |

Nota sulla numerazione: **P04** e **P05** esistono in due epiche ciascuna (squadre parallele del porting); P07 non è stato assegnato.
Si distinguono dall'epica; non vanno rinumerate per non rompere i riferimenti nelle storie e nel README.

## Storie numerate riviste dal porting

| # | Epica | Stato al 2026-11-09 |
|---|---|---|
| 012 | ferruccio-e-combattimento | Done tramite P08 (hit-stop, scossa contestuale, lampeggio, macchie; scie e anima restano al renderer del Teatro) |
| 021 | nemici-e-gatto | Done tramite P05 (statua e guardia del Teatro come tiratori; la vespa resta quella della 019) |
| 022 | nemici-e-gatto | Superata da P06 (il Gatto è il `re-gatto` del pool con il pattern `monstro_jump`) |
| 031 | interfaccia-e-qa | **Ready, ancora aperta**: l'HUD pixel-art del Teatro nel canvas (con le mezze maschere) non è portato; oggi HUD in DOM più barra del boss nel canvas |
| 032 | interfaccia-e-qa | Done tramite P03/P04/P05 (menu del Teatro con 5 slot e «Cancella»; «Continua» è il pannello della 030; le opzioni — volume, moto ridotto, rimappatura — restano fuori) |
| 000, 005, 006, 013 | fondazione, ferruccio | Storie visive del presepe d'ombre: superate dalla direzione pixel-art dell'autore (2026-11-08); non riprenderle così, la grafica che manca è negli sprite PNG (vedi `PASSAGGIO-CONSEGNE.md`) |

Ordine consigliato per ciò che resta: HUD pixel-art (chiude P04 interfaccia e 031) → `resa/sprite.js` per i 91 PNG → palette nei token →
033 (QA del percorso completo). Le storie si implementano con `/dev-story production/epics/<epica>/story-NNN-*.md`.
