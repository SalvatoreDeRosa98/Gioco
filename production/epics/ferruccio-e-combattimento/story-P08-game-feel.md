# Story P08: Game feel — i-frames con lampeggio e rimbalzo, hit-stop, knockback ∝ 1/peso, scossa contestuale, macchie permanenti

> **Epic**: Ferruccio e combattimento (chiude la 012 «Hit-stop, scossa, scie, lampi, anima»)
> **Status**: Done
> **Layer**: fondazione (`fondazione/ciclo.js › congela`), attori (`attori/combattimento.js › spintaPerPeso`), resa (`resa/feel.js`,
> `resa/renderer.js` in blocchi `// --- squadra feel ---`), composizione (`avvio.js`), contenuti (`resa.json`, `combattimento.json › feel`,
> `ferruccio.json › t_invuln`, `moto-ridotto.json`)
> **Type**: Visual/Feel + Logic
> **Estimate**: M
> **Manifest Version**: N/A
> **Last Updated**: 2026-11-09

## Context

**Fonte delle regole**: richieste testuali dell'autore (passo F1 del porting del Teatro), da rispettare nei numeri:
(a) almeno 1000 ms di invulnerabilità con lampeggio semitrasparente ad alpha 0,4 e un piccolo rimbalzo all'indietro;
(b) hit-stop di 2-3 frame (30-45 ms, base 40) sui colpi a segno, uno solo per fendente, 60 per uccisione e 90 per parata;
(c) knockback inversamente proporzionale al peso (vespa vola via, guardia arretra di poco, statua e boss inamovibili);
(d) scossa della camera contestuale: 1-2 px per 2 frame sui colpi, 5-6 px sulla Bomba Ferma, 10-12 px su atterraggio del Re-Gatto e schianto
delle Mani di Donna Luciana, nessuna scossa costante, moto ridotto → 0;
(e) macchie permanenti d'inchiostro di china (schegge di legno per statua/guardia/bomba) alla morte dei nemici, per stanza.
**ADR**: ADR-0002 (tutti i numeri in `{base,min,max}`), ADR-0003 (rng seminato: `derivato(rng, 'fx')`; `__gioco` solo in debug).
**Regola dell'autore**: nessun segno a terra che anticipi un attacco nemico — le macchie sono postume, mai un telegrafo.

---

## Acceptance Criteria

- [x] GIVEN Ferruccio colpito (contatto, proiettile, pericolo), WHEN il colpo si applica, THEN è invulnerabile per `ferruccio.t_invuln`
  (≥ 1000 ms, JSON `{1000, 1000, 1400}`), arretra rispetto alla fonte (`v_spinta`/`t_spinta`) e nel frame successivo la sagoma è disegnata
  con `globalAlpha` = `resa.lampeggio.alpha` (0,4), a semionde di `resa.lampeggio.semiperiodo_ms` (`feel.test.mjs` (a); `feel.wire.test.js`
  caso 1 misura il pixel più chiaro della sagoma: più scuro del frame pieno; `feel-iframes.png`)
- [x] GIVEN un colpo di Ferruccio a segno, WHEN `ferruccio.colpo` è emesso, THEN `ciclo.congela(hit_stop_ms)` ferma la simulazione per
  2-3 tick mentre il disegno continua; più bersagli nello stesso fendente → un solo congelamento (non si somma); uccisione 60 ms, parata
  90 ms (`feel.test.mjs` (b); `feel.wire.test.js` caso 2 su un nemico vero: `frame()` restituisce 0 tick mentre `contaFrame()` avanza)
- [x] GIVEN un nemico colpito, WHEN riceve la spinta, THEN il modulo è `clamp(spinta / max(peso, peso_min_spinta), spinta_min,
  spinta_max)` e 0 da `peso_inamovibile` in su, per fendente, affondo e proiettili (`feel.test.mjs` (c): vespa 0 > gatto 1 > guardia 2 > 0,
  statua 0, anche in gioco con tre fantocci)
- [x] GIVEN gli eventi `ferruccio.colpo`, `ferruccio.parata`, `bomba.esplosione`, `boss.atterraggio`, `boss.mani_schianto`, WHEN arrivano,
  THEN la camera si scuote dei px e per i frame di `resa.scossa` (e `combattimento.feel.scossa_parata_px`), a segno alterno e decadente; a
  riposo l'offset è {0, 0}; con `moto-ridotto.json` i px sono 0 (`feel.test.mjs` (d))
- [x] GIVEN `nemico.morto`, WHEN avviene, THEN una macchia (china, o legno per statua/guardia/bomba) con gocce seminate da `derivato(rng,
  'fx')` resta a terra finché si è nella stanza e sparisce a `notte.stanza` (`feel.test.mjs` (e), deterministica; `feel.wire.test.js` caso
  3: pixel scuri sul pavimento dopo la dissoluzione e dopo 120 frame; `feel-macchie.png`)
- [x] Tutte le suite verdi (15 suite node:test, `parametri.test.js`, `pagina.test.js`, 10 suite Playwright, `vetrina`, `pacchetto`,
  `stati64`, `seme 200`), `grep Math.random gioco/motore` vuoto

---

## Implementation Notes

- `fondazione/ciclo.js`: `congela(ms)`, `congelato()`, `contaFrame()`; `frame()` salta i tick congelati e restituisce i tick eseguiti; i tick
  forzati (`tick(n)`) ignorano il congelamento (strumento di debug: i test wire esistenti che contano tick non cambiano).
- `attori/combattimento.js`: `spintaPerPeso` (pura, esportata) e `vettoreSpinta` usati da fendente, affondo e `feriscuBersaglio` (proiettili).
- `resa/feel.js`: scossa, lampeggio, macchie; il renderer lo riceve come `feel` e lo usa in quattro blocchi delimitati. Con `feel`
  presente la vecchia scossa decadente del renderer (numeri nel codice) non si attiva più.
- `avvio.js`: blocco `// --- squadra feel ---` dopo `creaCiclo`; `resa` aggiunto a `FILE_STATISTICHE`; `__gioco.feel` e `__gioco.resa`.
- Test riallineati ai JSON (mai disabilitati): `combattimento.test.mjs` legge `t_invuln` invece di 800; `fondazione.test.mjs` valida anche
  `resa.json` per gli override di `moto-ridotto.json`.
- Contratto per le altre squadre: emettere `bomba.esplosione`, `boss.atterraggio`, `boss.mani_schianto` sul bus (payload libero).

---

## Out of Scope

Scie della lama, frammenti di carta e anima azzurra della 012 (restano al renderer del Teatro); audio; suono dell'hit-stop.

---

## Test Evidence

- `node gioco/qa/feel.test.mjs` → 7/7
- `node gioco/qa/feel.wire.test.js` → 3/3, zero errori in console
- `production/qa/evidence/feel-iframes.png` (sagoma semitrasparente dopo il colpo), `production/qa/evidence/feel-macchie.png` (macchia di china
  dove è morto il gatto; guardati)
