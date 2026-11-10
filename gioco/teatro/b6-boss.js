/*
 * teatro/b6-boss.js — Squadra b6: una ROSA di boss per piano e quattro boss nuovi.
 *
 *   - ROSA: ogni piano del ciclo (1 Corso Trieste, 2 Villa Comunale, 3 San Leucio) ha una rosa di boss del suo
 *     quartiere (ROSA_B6.perPiano). Per ogni piano c'è un «sacchetto» salvato per slot: si pesca senza
 *     rimettere, così in tre visite al boss di un piano si incontrano tutti e tre e mai lo stesso due volte di
 *     fila. Il sacchetto avanza solo quando il boss è stato INCONTRATO (ingresso nella sua stanza). I boss che
 *     portano avanti la storia (ROSA_B6.primaLaStoria) escono per primi finché non sono stati battuti nello slot.
 *     Il piano 4 resta sempre di Donna Luciana (BOSS_FINALE).
 *   - BOSS NUOVI (SCHEDE_B6): L'Accendilumi di Corso Trieste (piano 1), Il Cigno di Latta e La Giostra delle
 *     Lucciole (piano 2), La Tessitrice di Pietra (piano 3, bibbia §XII). Ognuno: IA a stati con tabella
 *     esplicita (STATI_B6), numeri in BOSS_B6, due fasi (sotto BOSS_B6.sogliaFase2 della vita), colpi che si
 *     leggono dalla posa (nessun segno a terra), disegno «a ombre» sul canvas (segnaposto dei fogli dell'autore).
 *   - Fogli futuri: se il foglio di un boss (SCHEDE_B6[id].foglio.nome) compare nel LAYOUT di t2-sprite.js, o il
 *     boss entra in FOGLIO_BOSS / SPRITE_BOSS_A, il gioco usa l'immagine al posto del disegno sul canvas.
 *   - Segni di completamento (a6): un segno per ogni boss nuovo, aggiunto a SEGNI_A6.
 *
 * Nessun gancio nei file di base tranne a6 (SEGNI_A6 estendibile, segni su più righe): qui si avvolgono le
 * function di primo livello popolaStanza, entraInStanza, verificaStanzaPulita, passoLogico,
 * disegnaBossPittorico e disegnaHUDPixelArt, chiamando sempre la base.
 * Script classico caricato dopo teatro/a7-registro-bilancio.js. Regole: teatro/LEGGIMI.md.
 * QA: tools/qa-teatro-boss-nuovi.js. Sonda: window.__teatro.interni.bossB6.
 */

// ===========================================================================
// TABELLE (numeri e testi). Tick a 60 Hz, distanze in px, velocità in px/tick, angoli in radianti.
// ===========================================================================

/**
 * ROSA dei boss per piano del ciclo. `primaLaStoria`: boss che danno un ricordo o uno sblocco (il Gatto lascia
 * il medaglione di Rosa, il Capitano sblocca Taddeo): finché non sono battuti nello slot aprono il sacchetto.
 * `rispettaProvaDeiGatti`: true = con PLAYTEST_GATTI.bossGattoPrimo il piano 1 è sempre del Gatto (la rosa
 * del piano 1 è sospesa); false = vale la rosa anche durante la prova dei gatti.
 */
const ROSA_B6 = Object.freeze({
  perPiano: Object.freeze({
    1: Object.freeze(['re-gatto', 'regina-vespa', 'lampionaio']),
    2: Object.freeze(['colosso-statua', 'cigno-latta', 'giostra-lucciole']),
    3: Object.freeze(['capitano-guardia', 'maestro-fucina', 'tessitrice-pietra']),
  }),
  primaLaStoria: Object.freeze(['re-gatto', 'capitano-guardia']),
  rispettaProvaDeiGatti: false,
  chiave: 'ferruccio.teatro.rosaBoss', // localStorage: <chiave>.<slot> → { piano: { ultimo, sacco: [id…] } }
});

/**
 * SCHEDE dei boss nuovi. hpBase e speed come POOL_BOSS (vita vera = (hpBase + 45 × (piano nel ciclo − 1)) × ciclo).
 * Confronto: piano 1 Gatto 175 / Regina 165; piano 2 Custode 235 (danno ×0,83 medio); piano 3 Capitano 210 /
 * Spezzafili 195. TESTI DA APPROVARE DALL'AUTORE: nome, presentazione, sconfitta, nome del segno.
 * foglio: nome del foglio animato futuro (assets/sprite_teatro/<nome>.png), altezza a schermo, piedi e
 * posa del foglio per ogni stato dell'IA (gli stati non elencati usano «fermo»).
 */
const SCHEDE_B6 = Object.freeze({
  lampionaio: Object.freeze({
    id: 'lampionaio', nome: 'L\'Accendilumi di Corso Trieste', tipo: 'lampionaio', pattern: 'lumi_accendilumi',
    hpBase: 170, speed: 1.0, raggio: 16, ombra: Object.freeze([20, 7]),
    presentazione: '«Un lume per ogni ombra, guagliò.»',
    sconfitta: 'Il lume si spegne. Sul Corso resta solo la pioggia.',
    segno: Object.freeze({ sprite: 'segnoLumeB6', nome: 'Accendilumi di Corso Trieste' }),
    foglio: Object.freeze({ nome: 'accendilumi', altezza: 70, piedi: 8, pose: Object.freeze({
      passeggia: 'muove', alzaPertica: 'anticipo', rialza: 'anticipo', sferza: 'attacco', alzaLume: 'evoca',
      rilancia: 'evoca', lancia: 'evoca', riposo: 'fermo', cambiaFase: 'colpito' }) }),
  }),
  'cigno-latta': Object.freeze({
    id: 'cigno-latta', nome: 'Il Cigno di Latta', tipo: 'cigno', pattern: 'molla_cigno',
    hpBase: 215, speed: 1.0, raggio: 18, ombra: Object.freeze([26, 8]),
    presentazione: '«Tic, tic, tic»: qualcuno gli ha dato la corda.',
    sconfitta: 'La molla si scarica. Il laghetto torna fermo.',
    segno: Object.freeze({ sprite: 'segnoCignoB6', nome: 'Cigno di Latta' }),
    foglio: Object.freeze({ nome: 'cigno-latta', altezza: 60, piedi: 8, pose: Object.freeze({
      scivola: 'muove', inarca: 'anticipo', riarca: 'anticipo', beccata: 'carica', apreAli: 'apre',
      piume: 'attacco', molla: 'fermo', cambiaFase: 'colpito' }) }),
  }),
  'giostra-lucciole': Object.freeze({
    id: 'giostra-lucciole', nome: 'La Giostra delle Lucciole', tipo: 'giostra', pattern: 'giro_giostra',
    hpBase: 225, speed: 0.5, raggio: 18, ombra: Object.freeze([24, 8]),
    presentazione: '«Un altro giro, un altro giro ancora!»',
    sconfitta: 'La giostra si ferma. Le lucciole tornano libere.',
    segno: Object.freeze({ sprite: 'segnoGiostraB6', nome: 'Giostra delle Lucciole' }),
    foglio: Object.freeze({ nome: 'giostra-lucciole', altezza: 72, piedi: 8, pose: Object.freeze({
      gira: 'fermo', prendeGiro: 'anticipo', allarga: 'attacco', accende: 'evoca', rilascia: 'evoca',
      quieta: 'fermo', cambiaFase: 'colpito' }) }),
  }),
  'tessitrice-pietra': Object.freeze({
    id: 'tessitrice-pietra', nome: 'La Tessitrice di Pietra', tipo: 'tessitrice', pattern: 'ordito_tessitrice',
    hpBase: 205, speed: 0.6, raggio: 18, ombra: Object.freeze([24, 8]),
    presentazione: '«Nessuno tocca i telai della Signora.»',
    sconfitta: 'La pietra si crepa: dentro, un filo di seta e un giglio.',
    segno: Object.freeze({ sprite: 'segnoSpolaB6', nome: 'Tessitrice di Pietra' }),
    foglio: Object.freeze({ nome: 'tessitrice-pietra', altezza: 72, piedi: 8, pose: Object.freeze({
      cammina: 'muove', alzaPettine: 'anticipo', ripettina: 'anticipo', ordito: 'attacco', alzaSpole: 'evoca',
      lancia: 'attacco', annoda: 'fermo', cambiaFase: 'colpito' }) }),
  }),
});

/**
 * BOSS_B6 — numeri delle IA. Una chiave <nome>Fase2 sostituisce <nome> sotto la soglia della fase 2.
 * tettoProiettili: oltre questo numero di colpi nemici a schermo il boss non ne aggiunge altri.
 */
const BOSS_B6 = Object.freeze({
  sogliaFase2: 0.5,
  dannoHalf: 2,            // mezze maschere tolte dai colpi propri (lumi, lucciole, spole), come i colpi dei boss
  tettoProiettili: 26,
  raggioGiocatore: 9,
  anime: Object.freeze({ numero: 12, durataTick: 110, salita: 0.45, colori: Object.freeze(['#f9cb40', '#fca5a5', '#fde68a', '#93c5fd', '#e9d5ff']) }),
  bannerTick: 250,

  // L'ACCENDILUMI: gira attorno al giocatore a distanza; SFERZA la pertica (una spazzata di faville, una alla
  // volta, dal lato in cui l'ha alzata), LANCIA un lume a parabola che scoppia in una corona, poi RIPOSA.
  // Fase 2: fiamma rossa, la spazzata torna indietro, due lumi di fila.
  lampionaio: Object.freeze({
    sequenza: Object.freeze(['sferza', 'lume', 'sferza', 'riposo']),
    passo: 0.6, distanzaPx: 118, giro: 0.75, moltVelFase2: 1.3,
    passeggiaTick: 78, passeggiaTickFase2: 56,
    sferza: Object.freeze({ anticipoTick: 34, anticipoTickFase2: 28, colpi: 8, colpiFase2: 9, intervalloTick: 3,
      apertura: 1.9, velocita: 2.0, spazzate: 1, spazzateFase2: 2, pausaRitornoTick: 18 }),
    lume: Object.freeze({ anticipoTick: 30, lancioTick: 14, pausaLancioTick: 18, lanci: 1, lanciFase2: 2,
      voloTick: 50, quotaPx: 44, scoppio: 6, velocita: 1.7, raggio: 10, ombra: true }),
    riposoTick: 84, riposoTickFase2: 60,
    cambioFaseTick: 54,
  }),

  // IL CIGNO DI LATTA: scivola a curve verso il giocatore; INARCA il collo e BECCA con uno scatto dritto;
  // si mette di traverso, APRE LE ALI e lancia salve di PIUME in file parallele dai due fianchi; poi la MOLLA
  // è scarica e resta fermo. Fase 2: due beccate di fila, tre salve che si aprono a ventaglio.
  'cigno-latta': Object.freeze({
    sequenza: Object.freeze(['beccata', 'piume', 'beccata', 'molla']),
    moltVelFase2: 1.3,
    scivola: Object.freeze({ tick: 84, tickFase2: 60, passo: 0.95, curva: 0.03, ondaFreq: 0.05, ondaAmp: 0.7 }),
    beccata: Object.freeze({ anticipoTick: 30, bloccoTick: 9, scattoTick: 20, velocita: 4.4, scatti: 1, scattiFase2: 2, pausaTick: 18 }),
    piume: Object.freeze({ anticipoTick: 34, bloccoTick: 10, salve: 2, salveFase2: 3, intervalloTick: 20, perAla: 4,
      passoPx: 16, ventaglio: 0, ventaglioFase2: 0.08, velocita: 2.1 }),
    mollaTick: 110, mollaTickFase2: 80,
    cambioFaseTick: 56,
  }),

  // LA GIOSTRA DELLE LUCCIOLE: i lumi appesi ai bracci girano attorno al corpo e feriscono a contatto. PRENDE
  // GIRO e ALLARGA i bracci avanzando; ACCENDE i lumi e RILASCIA lucciole che vagano, lampeggiano e scattano
  // una dopo l'altra dove sta il giocatore; poi è QUIETA. Fase 2: un quinto lume, la giostra inverte il giro.
  'giostra-lucciole': Object.freeze({
    sequenza: Object.freeze(['allarga', 'rilascia', 'allarga', 'quieta']),
    bracci: 4, bracciFase2: 5, raggioCorto: 30, raggioLungo: 92, schiaccio: 0.7, quotaLumi: 10, raggioLume: 7,
    inerzia: 0.06, estensione: 0.05,
    gira: Object.freeze({ tick: 72, tickFase2: 52, velAng: 0.022, passo: 0.5 }),
    allarga: Object.freeze({ anticipoTick: 38, tick: 170, velAng: 0.04, velAngFase2: 0.046, passo: 1.1, inverte: false, inverteFase2: true }),
    rilascia: Object.freeze({ anticipoTick: 30, salve: 2, salveFase2: 3, intervalloTick: 26, velUscita: 1.3, attrito: 0.965,
      vagaTick: 34, lampeggiaTick: 16, sfasamentoTick: 6, velScatto: 3.0, oltrePx: 14, raggio: 4.5 }),
    quietaTick: 104, quietaTickFase2: 78, quietaVelAng: 0.008,
    cambioFaseTick: 56,
  }),

  // LA TESSITRICE DI PIETRA: statua lenta. ALZA IL PETTINE del telaio (i denti accesi sono i colpi, il dente
  // che manca è il varco) e lancia l'ORDITO, una fila di aghi paralleli; ALZA LE SPOLE e le lancia: rimbalzano
  // sui muri; poi RIANNODA i fili, ferma. Fase 2: due file con il varco dall'altra parte, tre spole.
  'tessitrice-pietra': Object.freeze({
    sequenza: Object.freeze(['pettine', 'spole', 'pettine', 'annoda']),
    moltVelFase2: 1.25,
    cammina: Object.freeze({ tick: 66, tickFase2: 48, passo: 0.6 }),
    pettine: Object.freeze({ anticipoTick: 44, anticipoTickFase2: 38, bloccoTick: 12, denti: 9, passoPx: 20, varco: 2,
      varchi: Object.freeze([1, 2, 5, 6]), velocita: 2.0, ritiroTick: 20, righe: 1, righeFase2: 2, intervalloRigheTick: 36 }),
    spole: Object.freeze({ anticipoTick: 32, numero: 2, numeroFase2: 3, apertura: 0.55, velocita: 2.3, rimbalzi: 3,
      raggio: 7, vitaMaxTick: 480, ritiroTick: 22 }),
    annodaTick: 104, annodaTickFase2: 78,
    cambioFaseTick: 56,
  }),
});

/**
 * STATI_B6 — tabelle esplicite delle macchine a stati. Per ogni boss:
 *   inizio  stato iniziale;
 *   mosse   mossa della sequenza (BOSS_B6[id].sequenza) → stato d'anticipo con cui comincia;
 *   stati   stato → { durata: chiave di BOSS_B6[id] (null = la calcola l'azione d'ingresso),
 *                     poi: stato successivo ('prossima' = la mossa successiva della sequenza),
 *                     ripeti: stato in cui tornare finché restano ripetizioni (spazzate, scatti, salve…) }.
 * Lo stato 'cambiaFase' interrompe qualunque altro quando la vita scende sotto la soglia della fase 2.
 */
const STATI_B6 = Object.freeze({
  lampionaio: Object.freeze({
    inizio: 'passeggia',
    mosse: Object.freeze({ sferza: 'alzaPertica', lume: 'alzaLume', riposo: 'riposo' }),
    stati: Object.freeze({
      passeggia: Object.freeze({ durata: 'passeggiaTick', poi: 'prossima' }),
      alzaPertica: Object.freeze({ durata: 'sferza.anticipoTick', poi: 'sferza' }),      // anticipo: pertica alzata di lato
      sferza: Object.freeze({ durata: null, poi: 'passeggia', ripeti: 'rialza' }),        // (colpi − 1) × intervalloTick
      rialza: Object.freeze({ durata: 'sferza.pausaRitornoTick', poi: 'sferza' }),        // anticipo della spazzata di ritorno
      alzaLume: Object.freeze({ durata: 'lume.anticipoTick', poi: 'lancia' }),            // anticipo: lume alzato dietro la testa
      lancia: Object.freeze({ durata: 'lume.lancioTick', poi: 'passeggia', ripeti: 'rilancia' }),
      rilancia: Object.freeze({ durata: 'lume.pausaLancioTick', poi: 'lancia' }),
      riposo: Object.freeze({ durata: 'riposoTick', poi: 'passeggia' }),                  // finestra: fermo, nessun colpo
      cambiaFase: Object.freeze({ durata: 'cambioFaseTick', poi: 'passeggia' }),
    }),
  }),
  'cigno-latta': Object.freeze({
    inizio: 'scivola',
    mosse: Object.freeze({ beccata: 'inarca', piume: 'apreAli', molla: 'molla' }),
    stati: Object.freeze({
      scivola: Object.freeze({ durata: 'scivola.tick', poi: 'prossima' }),
      inarca: Object.freeze({ durata: 'beccata.anticipoTick', poi: 'beccata' }),          // anticipo: collo tirato indietro
      beccata: Object.freeze({ durata: 'beccata.scattoTick', poi: 'scivola', ripeti: 'riarca' }),
      riarca: Object.freeze({ durata: 'beccata.pausaTick', poi: 'beccata' }),
      apreAli: Object.freeze({ durata: 'piume.anticipoTick', poi: 'piume' }),             // anticipo: di traverso, ali aperte che tremano
      piume: Object.freeze({ durata: 'piume.intervalloTick', poi: 'scivola', ripeti: 'piume' }),
      molla: Object.freeze({ durata: 'mollaTick', poi: 'scivola' }),                      // finestra: molla scarica
      cambiaFase: Object.freeze({ durata: 'cambioFaseTick', poi: 'scivola' }),
    }),
  }),
  'giostra-lucciole': Object.freeze({
    inizio: 'gira',
    mosse: Object.freeze({ allarga: 'prendeGiro', rilascia: 'accende', quieta: 'quieta' }),
    stati: Object.freeze({
      gira: Object.freeze({ durata: 'gira.tick', poi: 'prossima' }),
      prendeGiro: Object.freeze({ durata: 'allarga.anticipoTick', poi: 'allarga' }),      // anticipo: gira più svelta, il tendone oscilla
      allarga: Object.freeze({ durata: 'allarga.tick', poi: 'gira' }),
      accende: Object.freeze({ durata: 'rilascia.anticipoTick', poi: 'rilascia' }),       // anticipo: i lumi lampeggiano
      rilascia: Object.freeze({ durata: 'rilascia.intervalloTick', poi: 'gira', ripeti: 'rilascia' }),
      quieta: Object.freeze({ durata: 'quietaTick', poi: 'gira' }),                       // finestra: lumi fiochi
      cambiaFase: Object.freeze({ durata: 'cambioFaseTick', poi: 'gira' }),
    }),
  }),
  'tessitrice-pietra': Object.freeze({
    inizio: 'cammina',
    mosse: Object.freeze({ pettine: 'alzaPettine', spole: 'alzaSpole', annoda: 'annoda' }),
    stati: Object.freeze({
      cammina: Object.freeze({ durata: 'cammina.tick', poi: 'prossima' }),
      alzaPettine: Object.freeze({ durata: 'pettine.anticipoTick', poi: 'ordito' }),      // anticipo: pettine alzato, il varco si vede
      ordito: Object.freeze({ durata: 'pettine.ritiroTick', poi: 'cammina', ripeti: 'ripettina' }),
      ripettina: Object.freeze({ durata: 'pettine.intervalloRigheTick', poi: 'ordito' }),
      alzaSpole: Object.freeze({ durata: 'spole.anticipoTick', poi: 'lancia' }),          // anticipo: braccia aperte, una spola per mano
      lancia: Object.freeze({ durata: 'spole.ritiroTick', poi: 'cammina' }),
      annoda: Object.freeze({ durata: 'annodaTick', poi: 'cammina' }),                    // finestra: riannoda i fili
      cambiaFase: Object.freeze({ durata: 'cambioFaseTick', poi: 'cammina' }),
    }),
  }),
});

/** Colori del disegno «a ombre»: china, bordo di lanterna, oro e rosso. */
const TINTE_B6 = Object.freeze({
  china: '#0d0907', china2: '#1d1610', bordo: '#c9a15a', oro: '#f9cb40', rosso: '#e53222', lampo: '#fff3d6',
  rgb: Object.freeze({ oro: '249, 203, 64', rosso: '229, 50, 34', brace: '234, 134, 38' }),
});

// Icone 12×12 dei segni di completamento (stessa palette degli oggetti).
SPRITE_OGGETTI.segnoLumeB6 = ['.....kk.....', '....kyyk....', '....kyyk....', '...kkkkkk...', '..kyyoyyyk..', '..kyoooyyk..',
  '..kyyoyyyk..', '..kyyyyyyk..', '...kkkkkk...', '....kkkk....', '............', '............'];
SPRITE_OGGETTI.segnoCignoB6 = ['............', '......kk....', '.....kwwk...', '.....kwkoo..', '.....kwk....', '.....kwk....',
  '..kkkkwwk...', '.kwwwwwwwk..', '.kwwwwwwwk..', '..kwwwwwk...', '...kkkkk....', '............'];
SPRITE_OGGETTI.segnoGiostraB6 = ['.....yy.....', '.....kk.....', '....krrk....', '...kryyrk...', '..kryyyyrk..', '.kkkkkkkkkk.',
  '..y..kk..y..', '..y..kk..y..', '.....kk.....', '.....kk.....', '...kkkkkk...', '............'];
SPRITE_OGGETTI.segnoSpolaB6 = ['............', '............', '.........kk.', '.......kkyk.', '.....kkyyk..', '....kyrryk..',
  '...kyrryk...', '..kyyykk....', '.kykkk......', '.kkk........', '............', '............'];

// Catalogo e segni: i boss nuovi entrano in POOL_BOSS (il catalogo di tutti i boss) e in SEGNI_A6.
for (const scheda of Object.values(SCHEDE_B6)) {
  if (!POOL_BOSS.some((x) => x.id === scheda.id)) {
    POOL_BOSS.push({ id: scheda.id, nome: scheda.nome, tipo: scheda.tipo, hpBase: scheda.hpBase, speed: scheda.speed, pattern: scheda.pattern });
  }
  if (typeof SEGNI_A6 !== 'undefined' && Array.isArray(SEGNI_A6) && !Object.isFrozen(SEGNI_A6) && !SEGNI_A6.some((s) => s.boss === scheda.id)) {
    SEGNI_A6.push(Object.freeze({ boss: scheda.id, sprite: scheda.segno.sprite, nome: scheda.segno.nome }));
  }
}

// ===========================================================================
// ROSA: sacchetto per piano, salvato per slot
// ===========================================================================
const b6 = {
  forzato: null,   // QA/sviluppo: id del boss imposto ai piani 1-3 (null = rosa)
  anime: [],       // particelle della dissolvenza: { x, y, t0, fase, colore }
  casuale: Math.random, // sorgente del caso del sacchetto (non il seme della mappa: la mappa resta ripetibile)
};

function chiaveRosaB6() {
  const sv = window.__teatroT3 && window.__teatroT3.salvataggi;
  return `${ROSA_B6.chiave}.${sv && sv.slotAttivo != null ? sv.slotAttivo : 0}`;
}

function leggiRosaB6() {
  try { const m = JSON.parse(localStorage.getItem(chiaveRosaB6()) || '{}'); return m && typeof m === 'object' ? m : {}; } catch (_) { return {}; }
}

function scriviRosaB6(m) {
  try { localStorage.setItem(chiaveRosaB6(), JSON.stringify(m)); } catch (_) { /* memoria piena o negata: la rosa vale per la sessione */ }
}

/** Rosa valida del piano del ciclo (solo boss che esistono nel catalogo). */
function rosaDelPianoB6(pianoNelCiclo) {
  return (ROSA_B6.perPiano[pianoNelCiclo] || []).filter((id) => POOL_BOSS.some((x) => x.id === id));
}

/** Boss già battuti nello slot (a6), per la regola «prima la storia». */
function bossBattutiB6() {
  try { return typeof statoA6 === 'function' ? statoA6().boss || [] : []; } catch (_) { return []; }
}

/**
 * Riga del sacchetto del piano, riempita se vuota: rosa mescolata, i boss della storia non ancora battuti in
 * testa, e mai in testa l'ultimo incontrato (se la rosa ha più di un boss).
 */
function saccoDelPianoB6(m, pianoNelCiclo) {
  const rosa = rosaDelPianoB6(pianoNelCiclo);
  const riga = m[pianoNelCiclo] && typeof m[pianoNelCiclo] === 'object' ? m[pianoNelCiclo] : { ultimo: null, sacco: [] };
  riga.sacco = (Array.isArray(riga.sacco) ? riga.sacco : []).filter((id) => rosa.includes(id));
  if (!riga.sacco.length && rosa.length) {
    const nuovo = rosa.slice();
    for (let i = nuovo.length - 1; i > 0; i--) {
      const j = Math.floor(b6.casuale() * (i + 1));
      [nuovo[i], nuovo[j]] = [nuovo[j], nuovo[i]];
    }
    const battuti = bossBattutiB6();
    const storia = (id) => (ROSA_B6.primaLaStoria.includes(id) && !battuti.includes(id) ? 0 : 1);
    nuovo.sort((a, b) => storia(a) - storia(b)); // ordinamento stabile: resta il caso fra pari
    if (nuovo.length > 1 && nuovo[0] === riga.ultimo) [nuovo[0], nuovo[1]] = [nuovo[1], nuovo[0]];
    riga.sacco = nuovo;
  }
  m[pianoNelCiclo] = riga;
  return riga;
}

/**
 * Boss del piano per la run in corso (una scelta per run e per piano, anche se la mappa si rigenera).
 * @param {number} piano piano assoluto (1, 2, 3, 5…); al piano 4 del ciclo rende null (Donna Luciana).
 * @returns {object|null} la voce di POOL_BOSS
 */
function bossDelPianoB6(piano) {
  const pnc = ((Math.max(1, piano || 1) - 1) % 4) + 1;
  if (pnc === 4) return null;
  const perId = (id) => POOL_BOSS.find((x) => x.id === id) || null;
  if (b6.forzato && perId(b6.forzato)) return perId(b6.forzato);
  if (ROSA_B6.rispettaProvaDeiGatti && pnc === 1 && piano === 1 && PLAYTEST_GATTI.attivo && PLAYTEST_GATTI.bossGattoPrimo) return perId('re-gatto');
  if (!statoRun.rosaB6 || statoRun.rosaB6.run !== statoRun.numeroRun) statoRun.rosaB6 = { run: statoRun.numeroRun, scelti: {} };
  const scelti = statoRun.rosaB6.scelti;
  if (!scelti[piano]) {
    const m = leggiRosaB6();
    const riga = saccoDelPianoB6(m, pnc);
    scriviRosaB6(m);
    scelti[piano] = riga.sacco[0] || null;
  }
  return perId(scelti[piano]);
}

/** Il boss è stato incontrato: esce dal sacchetto del suo piano e diventa «l'ultimo». */
function segnaIncontratoB6(pianoNelCiclo, bossId) {
  if (!rosaDelPianoB6(pianoNelCiclo).includes(bossId)) return;
  const m = leggiRosaB6();
  const riga = saccoDelPianoB6(m, pianoNelCiclo);
  const i = riga.sacco.indexOf(bossId);
  if (i >= 0) riga.sacco.splice(i, 1);
  riga.ultimo = bossId;
  scriviRosaB6(m);
}

const popolaStanzaBaseB6 = popolaStanza;
/** La stanza del boss dei piani 1-3 prende il boss della rosa (la base legge statoRun.bossOrdine). */
popolaStanza = function (s, piano, ...resto) {
  let scelto = null;
  try { if (s && s.tipo === 'boss') scelto = bossDelPianoB6(piano); } catch (err) { console.error('[B6] rosa', err); }
  if (!scelto) return popolaStanzaBaseB6.call(this, s, piano, ...resto);
  const ordine = statoRun.bossOrdine;
  statoRun.bossOrdine = [scelto];
  try {
    const r = popolaStanzaBaseB6.call(this, s, piano, ...resto);
    const b = s.nemici.find((n) => n.boss);
    if (b && SCHEDE_B6[b.bossId]) b.r = SCHEDE_B6[b.bossId].raggio;
    return r;
  } finally { statoRun.bossOrdine = ordine; }
};

const entraInStanzaBaseB6 = entraInStanza;
/** Ingresso nella stanza del boss: il sacchetto avanza e i boss nuovi si presentano. */
entraInStanza = function (stanza, daLato, ...resto) {
  const r = entraInStanzaBaseB6.call(this, stanza, daLato, ...resto);
  try {
    if (stanza && stanza.tipo === 'boss' && !stanza.pulita && statoRun.stanzaCorrente === stanza) {
      const b = stanza.nemici.find((n) => n.boss);
      const pnc = ((statoRun.piano - 1) % 4) + 1;
      if (b && pnc !== 4 && !stanza.incontroB6) { stanza.incontroB6 = true; segnaIncontratoB6(pnc, b.bossId); }
      const scheda = b && SCHEDE_B6[b.bossId];
      if (scheda) mostraBanner(`💀 ${b.nome} (${b.hp} HP) — ${scheda.presentazione}`, BOSS_B6.bannerTick);
    }
  } catch (err) { console.error('[B6] ingresso', err); }
  return r;
};

const verificaStanzaPulitaBaseB6 = verificaStanzaPulita;
/** Boss nuovo sconfitto: frase di sconfitta (con le notizie della porta e della botola) e anime che salgono. */
verificaStanzaPulita = function (...args) {
  const st = statoRun.stanzaCorrente;
  const era = Boolean(st && st.pulita);
  const r = verificaStanzaPulitaBaseB6.apply(this, args);
  try {
    if (st && !era && st.pulita && st.tipo === 'boss') {
      const b = st.nemici.find((n) => n.boss && SCHEDE_B6[n.bossId]);
      if (b) {
        const scheda = SCHEDE_B6[b.bossId];
        mostraBanner(`${scheda.sconfitta} ${st.portaPattoAperta ? 'Porta del Patto d\'Ombra (😈) a destra · ' : ''}Botola aperta!`, BOSS_B6.bannerTick);
        const A = BOSS_B6.anime;
        for (let k = 0; k < A.numero; k++) {
          b6.anime.push({ x: b.x + (k - A.numero / 2) * 3.2, y: b.y - 6 - (k % 4) * 9, t0: tick + k * 3, fase: k * 1.7, colore: A.colori[k % A.colori.length] });
        }
      }
    }
  } catch (err) { console.error('[B6] sconfitta', err); }
  return r;
};

// ===========================================================================
// IA: macchina a stati comune e azioni dei quattro boss
// ===========================================================================
/** Numero di BOSS_B6[id] dalla chiave ('a.b'); in fase 2 vince la chiave <chiave>Fase2 se esiste. */
function valoreB6(C, chiave, fase2) {
  const leggi = (k) => k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), C);
  const v2 = fase2 ? leggi(`${chiave}Fase2`) : undefined;
  return v2 !== undefined ? v2 : leggi(chiave);
}

const nomeBossB6 = (n) => String(n.nome || '').replace(/\s*\(.*?\)/g, '');
const angoloGiocatoreB6 = (n, quota = 8) => Math.atan2(player.y - 6 - (n.y - quota), player.x - n.x);

function ruotaVersoB6(da, a, maxRad) {
  let d = a - da;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return da + Math.max(-maxRad, Math.min(maxRad, d));
}

/** Sposta il boss di (dx, dy) tenendolo nell'arena; rende true se ha toccato un muro. */
function muoviB6(n, dx, dy, margine = 22) {
  const x = n.x + dx, y = n.y + dy;
  n.x = Math.max(ARENA.x1 + margine, Math.min(ARENA.x2 - margine, x));
  n.y = Math.max(ARENA.y1 + margine, Math.min(ARENA.y2 - margine, y));
  return n.x !== x || n.y !== y;
}

/** Un colpo del boss (proiettile comune del Teatro), con il tetto e il nome del tiratore per il Registro (a7). */
function sparaB6(n, x, y, ang, vel) {
  if (statoRun.proiettiliNemici.length >= BOSS_B6.tettoProiettili) return false;
  statoRun.proiettiliNemici.push({ x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, dist: 0, bossShot: true, fonteA7: `un colpo di ${nomeBossB6(n)}` });
  return true;
}

/** Contatto di un colpo proprio (lume, lucciola, spola) col giocatore. */
function toccaGiocatoreB6(x, y, raggio) {
  return player.invuln <= 0 && statoRun.hpHalf > 0
    && Math.hypot(player.x - x, (player.y - 6) - y) < raggio + BOSS_B6.raggioGiocatore * (player.scalaA2 || 1);
}

function entraStatoB6(n, stato, st) {
  const C = BOSS_B6[n.bossId];
  const riga = STATI_B6[n.bossId].stati[stato];
  const f2 = Boolean(n.fase2B6);
  n.statoB6 = stato;
  n.tStatoB6 = 0;
  n.timerB6 = riga.durata ? Math.max(1, Math.round(valoreB6(C, riga.durata, f2))) : 1;
  n.durataB6 = n.timerB6;
  const az = AZIONI_B6[n.bossId].entra[stato];
  if (az) az(n, C, f2, st);
  n.durataB6 = Math.max(n.durataB6, n.timerB6);
}

function prossimoStatoB6(n) {
  const T = STATI_B6[n.bossId];
  const riga = T.stati[n.statoB6];
  if (riga.ripeti && n.ripetiB6 > 0) { n.ripetiB6--; return riga.ripeti; }
  if (riga.poi !== 'prossima') return riga.poi;
  const seq = BOSS_B6[n.bossId].sequenza;
  const mossa = seq[(n.indiceB6 || 0) % seq.length];
  n.indiceB6 = (n.indiceB6 || 0) + 1;
  return T.mosse[mossa];
}

/** Un tick dell'IA di un boss nuovo (chiamata solo nei tick in cui la base fa agire i boss). */
function iaBossB6(n, st) {
  const C = BOSS_B6[n.bossId];
  const A = AZIONI_B6[n.bossId];
  if (!n.statoB6) {
    n.fase2B6 = false; n.indiceB6 = 0; n.ripetiB6 = 0;
    if (A.nasce) A.nasce(n, C);
    entraStatoB6(n, STATI_B6[n.bossId].inizio, st);
  }
  if (!n.fase2B6 && n.hp < n.maxHp * BOSS_B6.sogliaFase2) {
    n.fase2B6 = true;
    n.ripetiB6 = 0;
    n.flash = 12;
    scuoti(FEEL.scossa.schiantoCapitano);
    statoRun.ondeEsplosione.push({ x: n.x, y: n.y - 12, r: 8, maxR: 58, tick: 0, color: TINTE_B6.rosso });
    entraStatoB6(n, 'cambiaFase', st);
  }
  const f2 = n.fase2B6;
  const passo = A.passo[n.statoB6];
  if (passo) passo(n, C, f2, st);
  n.tStatoB6++;
  if (--n.timerB6 <= 0) entraStatoB6(n, prossimoStatoB6(n), st);
  if (A.sempre) A.sempre(n, C, f2, st);
}

const AZIONI_B6 = {
  // ------------------------------------------------------------------- L'Accendilumi di Corso Trieste
  lampionaio: {
    nasce(n) { n.lumiB6 = []; n.giroB6 = rng() < 0.5 ? -1 : 1; n.versoB6 = 1; n.angB6 = 0; n.angPerticaB6 = -Math.PI / 2; },
    entra: {
      alzaPertica(n, C, f2) {
        n.versoB6 = rng() < 0.5 ? -1 : 1;
        n.ripetiB6 = (f2 ? C.sferza.spazzateFase2 : C.sferza.spazzate) - 1;
        n.sfasoB6 = 0;
      },
      rialza(n, C) { n.versoB6 = -n.versoB6; n.sfasoB6 = C.sferza.apertura / (2 * (C.sferza.colpiFase2 - 1)); },
      sferza(n, C, f2) {
        n.angB6 = angoloGiocatoreB6(n);
        n.colpoB6 = 0;
        n.timerB6 = ((f2 ? C.sferza.colpiFase2 : C.sferza.colpi) - 1) * C.sferza.intervalloTick + 2;
      },
      alzaLume(n, C, f2) { n.ripetiB6 = (f2 ? C.lume.lanciFase2 : C.lume.lanci) - 1; },
      lancia(n) {
        n.lumiB6.push({ x0: n.x, y0: n.y - 6, t: 0, x: n.x, y: n.y - 6, z: 30,
          tx: Math.max(ARENA.x1 + 12, Math.min(ARENA.x2 - 12, player.x)), ty: Math.max(ARENA.y1 + 12, Math.min(ARENA.y2 - 12, player.y - 6)) });
      },
    },
    passo: {
      passeggia(n, C, f2) {
        const ang = Math.atan2(player.y - n.y, player.x - n.x);
        const dist = Math.hypot(player.x - n.x, player.y - n.y);
        const rad = Math.max(-1, Math.min(1, (dist - C.distanzaPx) / 40));
        const dx = Math.cos(ang) * rad + Math.cos(ang + n.giroB6 * Math.PI / 2) * C.giro;
        const dy = Math.sin(ang) * rad + Math.sin(ang + n.giroB6 * Math.PI / 2) * C.giro;
        const l = Math.hypot(dx, dy) || 1;
        const v = n.speed * C.passo * (f2 ? C.moltVelFase2 : 1);
        if (muoviB6(n, (dx / l) * v, (dy / l) * v) && n.tStatoB6 % 30 === 0) n.giroB6 = -n.giroB6;
      },
      alzaPertica(n, C) {
        n.angB6 = angoloGiocatoreB6(n);
        const k = 1 - n.timerB6 / n.durataB6;
        n.angPerticaB6 = n.angB6 - n.versoB6 * (C.sferza.apertura / 2 + 0.7 * (1 - k));
      },
      rialza(n, C) {
        n.angB6 = angoloGiocatoreB6(n);
        const k = 1 - n.timerB6 / n.durataB6;
        n.angPerticaB6 = n.angB6 - n.versoB6 * (C.sferza.apertura / 2 + 0.5 * (1 - k));
      },
      sferza(n, C, f2) {
        const S = C.sferza;
        const colpi = f2 ? S.colpiFase2 : S.colpi;
        if (n.tStatoB6 % S.intervalloTick === 0 && n.colpoB6 < colpi) {
          const k = n.colpoB6++;
          const a = n.angB6 + n.versoB6 * (k / (colpi - 1) - 0.5) * S.apertura + (n.sfasoB6 || 0);
          n.angPerticaB6 = a;
          sparaB6(n, n.x + Math.cos(a) * 20, n.y - 10 + Math.sin(a) * 20, a, S.velocita);
        }
      },
    },
    sempre(n, C) {
      const L = C.lume;
      for (let i = n.lumiB6.length - 1; i >= 0; i--) {
        const l = n.lumiB6[i];
        l.t++;
        const k = Math.min(1, l.t / L.voloTick);
        l.x = l.x0 + (l.tx - l.x0) * k;
        l.y = l.y0 + (l.ty - l.y0) * k;
        l.z = Math.sin(k * Math.PI) * L.quotaPx + (1 - k) * 30;
        if (k < 1) continue;
        n.lumiB6.splice(i, 1);
        statoRun.effettiSplash.push({ x: l.tx, y: l.ty, tick: 0 });
        statoRun.ondeEsplosione.push({ x: l.tx, y: l.ty, r: 4, maxR: 22, tick: 0, color: TINTE_B6.oro });
        const fase0 = (n.scoppiB6 = (n.scoppiB6 || 0) + 1) % 2 ? 0 : Math.PI / L.scoppio;
        for (let j = 0; j < L.scoppio; j++) sparaB6(n, l.tx, l.ty, fase0 + (TAU * j) / L.scoppio, L.velocita);
        if (toccaGiocatoreB6(l.tx, l.ty, L.raggio)) {
          subisciColpoGiocatore(BOSS_B6.dannoHalf, `il lume de ${nomeBossB6(n)}`, l.tx, l.ty);
          if (statoRun.hpHalf <= 0 || statoRun.fase !== 'in_gioco') return;
        }
      }
    },
  },

  // ------------------------------------------------------------------- Il Cigno di Latta
  'cigno-latta': {
    nasce(n) { n.rotB6 = Math.atan2(player.y - n.y, player.x - n.x); n.angB6 = n.rotB6; n.salvaB6 = 0; },
    entra: {
      scivola(n) { n.vx = 0; n.vy = 0; },
      inarca(n, C, f2) { n.vx = 0; n.vy = 0; n.ripetiB6 = (f2 ? C.beccata.scattiFase2 : C.beccata.scatti) - 1; },
      riarca(n) { n.vx = 0; n.vy = 0; },
      beccata(n, C) { n.vx = Math.cos(n.angB6) * C.beccata.velocita; n.vy = Math.sin(n.angB6) * C.beccata.velocita; n.rotB6 = n.angB6; },
      apreAli(n, C, f2) { n.vx = 0; n.vy = 0; n.salvaB6 = 0; n.ripetiB6 = (f2 ? C.piume.salveFase2 : C.piume.salve) - 1; },
      piume(n, C, f2) {
        const P = C.piume;
        const asse = n.angB6 + Math.PI / 2; // il corpo è di traverso: le ali guardano il giocatore e il lato opposto
        const sfalsa = (n.salvaB6 % 2) * P.passoPx * 0.5;
        const vent = f2 ? P.ventaglioFase2 : P.ventaglio;
        for (const lato of [1, -1]) {
          for (let k = 0; k < P.perAla; k++) {
            const lungo = (k - (P.perAla - 1) / 2) * P.passoPx + sfalsa;
            const dir = n.angB6 + (lato < 0 ? Math.PI : 0) + vent * (k - (P.perAla - 1) / 2) * lato;
            sparaB6(n, n.x + Math.cos(asse) * lungo + Math.cos(dir) * 12, n.y - 8 + Math.sin(asse) * lungo + Math.sin(dir) * 12, dir, P.velocita);
          }
        }
        n.salvaB6++;
      },
      molla(n) { n.vx = 0; n.vy = 0; },
      cambiaFase(n) { n.vx = 0; n.vy = 0; },
    },
    passo: {
      scivola(n, C, f2) {
        const G = C.scivola;
        const des = Math.atan2(player.y - n.y, player.x - n.x) + Math.sin(n.phaseTick * G.ondaFreq) * G.ondaAmp;
        n.rotB6 = ruotaVersoB6(n.rotB6, des, G.curva);
        const v = n.speed * G.passo * (f2 ? C.moltVelFase2 : 1);
        n.vx = Math.cos(n.rotB6) * v; n.vy = Math.sin(n.rotB6) * v;
        muoviB6(n, n.vx, n.vy, 24);
      },
      inarca(n, C) { if (n.timerB6 > C.beccata.bloccoTick) n.angB6 = angoloGiocatoreB6(n, 6); n.rotB6 = n.angB6; },
      riarca(n, C) { if (n.timerB6 > C.beccata.bloccoTick) n.angB6 = angoloGiocatoreB6(n, 6); n.rotB6 = n.angB6; },
      beccata(n) {
        if (muoviB6(n, n.vx, n.vy, 20)) { n.vx = 0; n.vy = 0; n.timerB6 = Math.min(n.timerB6, 2); scuoti(FEEL.scossa.colpo); }
      },
      apreAli(n, C) { if (n.timerB6 > C.piume.bloccoTick) n.angB6 = angoloGiocatoreB6(n); },
    },
  },

  // ------------------------------------------------------------------- La Giostra delle Lucciole
  'giostra-lucciole': {
    nasce(n, C) { n.girB6 = 0; n.velAngB6 = C.gira.velAng; n.raggioB6 = C.raggioCorto; n.sensoB6 = 1; n.luccioleB6 = []; n.metaB6 = 0; },
    entra: {
      prendeGiro(n) { n.sensoB6 = rng() < 0.5 ? -1 : 1; },
      allarga(n) { n.metaB6 = Math.floor(n.timerB6 / 2); },
      accende(n, C, f2) { n.ripetiB6 = (f2 ? C.rilascia.salveFase2 : C.rilascia.salve) - 1; },
      rilascia(n, C, f2) {
        const R = C.rilascia;
        const nb = f2 ? C.bracciFase2 : C.bracci;
        for (let k = 0; k < nb; k++) {
          const a = n.girB6 + (TAU * k) / nb;
          n.luccioleB6.push({ x: n.x + Math.cos(a) * n.raggioB6, y: n.y - C.quotaLumi + Math.sin(a) * n.raggioB6 * C.schiaccio,
            vx: Math.cos(a) * R.velUscita, vy: Math.sin(a) * R.velUscita * C.schiaccio, t: 0, stato: 'vaga',
            attesa: R.vagaTick + k * R.sfasamentoTick, resto: 0 });
        }
      },
    },
    passo: {
      gira(n, C) { giraGiostraB6(n, C, C.gira.velAng * n.sensoB6, C.raggioCorto, C.gira.passo); },
      prendeGiro(n, C, f2) { giraGiostraB6(n, C, valoreB6(C, 'allarga.velAng', f2) * 1.25 * n.sensoB6, C.raggioCorto, 0); },
      allarga(n, C, f2) {
        if (valoreB6(C, 'allarga.inverte', f2) && n.timerB6 === n.metaB6) n.sensoB6 = -n.sensoB6;
        giraGiostraB6(n, C, valoreB6(C, 'allarga.velAng', f2) * n.sensoB6, C.raggioLungo, C.allarga.passo);
      },
      accende(n, C) { giraGiostraB6(n, C, C.gira.velAng * n.sensoB6, C.raggioCorto, 0); },
      rilascia(n, C) { giraGiostraB6(n, C, C.gira.velAng * n.sensoB6, C.raggioCorto, 0); },
      quieta(n, C) { giraGiostraB6(n, C, C.quietaVelAng * n.sensoB6, C.raggioCorto, 0); },
      cambiaFase(n, C) { giraGiostraB6(n, C, 0, C.raggioCorto, 0); },
    },
    sempre(n, C, f2) {
      n.girB6 += n.velAngB6;
      const nb = f2 ? C.bracciFase2 : C.bracci;
      for (let k = 0; k < nb; k++) {
        const a = n.girB6 + (TAU * k) / nb;
        const lx = n.x + Math.cos(a) * n.raggioB6, ly = n.y - C.quotaLumi + Math.sin(a) * n.raggioB6 * C.schiaccio;
        if (toccaGiocatoreB6(lx, ly, C.raggioLume)) {
          subisciColpoGiocatore(BOSS_B6.dannoHalf, `un lume de ${nomeBossB6(n)}`, lx, ly);
          if (statoRun.hpHalf <= 0 || statoRun.fase !== 'in_gioco') return;
        }
      }
      const R = C.rilascia;
      for (let i = n.luccioleB6.length - 1; i >= 0; i--) {
        const l = n.luccioleB6[i];
        l.t++;
        if (l.stato === 'vaga') {
          l.x += l.vx; l.y += l.vy; l.vx *= R.attrito; l.vy *= R.attrito;
          if (l.t >= l.attesa) { l.stato = 'lampeggia'; l.t = 0; }
        } else if (l.stato === 'lampeggia') {
          if (l.t >= R.lampeggiaTick) {
            const dx = player.x - l.x, dy = player.y - 6 - l.y;
            const d = Math.hypot(dx, dy) || 1;
            l.vx = (dx / d) * R.velScatto; l.vy = (dy / d) * R.velScatto;
            l.resto = d + R.oltrePx; l.stato = 'scatta';
          }
        } else {
          l.x += l.vx; l.y += l.vy; l.resto -= R.velScatto;
        }
        const fuori = l.x < ARENA.x1 - 8 || l.x > ARENA.x2 + 8 || l.y < ARENA.y1 - 8 || l.y > ARENA.y2 + 8;
        if (fuori || (l.stato === 'scatta' && l.resto <= 0)) {
          statoRun.effettiSplash.push({ x: l.x, y: l.y, tick: 0 });
          n.luccioleB6.splice(i, 1);
          continue;
        }
        if (toccaGiocatoreB6(l.x, l.y, R.raggio)) {
          n.luccioleB6.splice(i, 1);
          subisciColpoGiocatore(BOSS_B6.dannoHalf, `una lucciola de ${nomeBossB6(n)}`, l.x - l.vx, l.y - l.vy);
          if (statoRun.hpHalf <= 0 || statoRun.fase !== 'in_gioco') return;
        }
      }
    },
  },

  // ------------------------------------------------------------------- La Tessitrice di Pietra
  'tessitrice-pietra': {
    nasce(n) { n.spoleB6 = []; n.angB6 = Math.atan2(player.y - n.y, player.x - n.x); n.varcoB6 = 1; },
    entra: {
      alzaPettine(n, C, f2) {
        const P = C.pettine;
        n.ripetiB6 = (f2 ? P.righeFase2 : P.righe) - 1;
        n.varcoB6 = P.varchi[Math.floor(rng() * P.varchi.length)];
      },
      ripettina(n, C) {
        const P = C.pettine;
        const meta = (P.denti - P.varco) / 2;
        const altri = P.varchi.filter((v) => (v < meta) !== (n.varcoB6 < meta));
        if (altri.length) n.varcoB6 = altri[Math.floor(rng() * altri.length)];
      },
      ordito(n, C) {
        const P = C.pettine;
        const a = n.angB6;
        const px = -Math.sin(a), py = Math.cos(a);
        for (let i = 0; i < P.denti; i++) {
          if (i >= n.varcoB6 && i < n.varcoB6 + P.varco) continue;
          const lat = (i - (P.denti - 1) / 2) * P.passoPx;
          sparaB6(n, n.x + px * lat + Math.cos(a) * 12, n.y - 8 + py * lat + Math.sin(a) * 12, a, P.velocita);
        }
      },
      lancia(n, C, f2) {
        const S = C.spole;
        const num = f2 ? S.numeroFase2 : S.numero;
        for (let k = 0; k < num; k++) {
          const a = n.angB6 + (k - (num - 1) / 2) * S.apertura;
          n.spoleB6.push({ x: n.x + Math.cos(a) * 14, y: n.y - 8 + Math.sin(a) * 14, vx: Math.cos(a) * S.velocita, vy: Math.sin(a) * S.velocita, t: 0, rimbalzi: S.rimbalzi });
        }
      },
    },
    passo: {
      cammina(n, C, f2) {
        const ang = Math.atan2(player.y - n.y, player.x - n.x);
        const v = n.speed * C.cammina.passo * (f2 ? C.moltVelFase2 : 1);
        muoviB6(n, Math.cos(ang) * v, Math.sin(ang) * v, 24);
      },
      alzaPettine(n, C) { if (n.timerB6 > C.pettine.bloccoTick) n.angB6 = angoloGiocatoreB6(n); },
      ripettina(n, C) { if (n.timerB6 > C.pettine.bloccoTick) n.angB6 = angoloGiocatoreB6(n); },
      alzaSpole(n) { n.angB6 = angoloGiocatoreB6(n); },
    },
    sempre(n, C) {
      const S = C.spole;
      for (let i = n.spoleB6.length - 1; i >= 0; i--) {
        const s = n.spoleB6[i];
        s.t++;
        let urto = false;
        if (s.x + s.vx < ARENA.x1 + 6 || s.x + s.vx > ARENA.x2 - 6) { s.vx = -s.vx; urto = true; }
        if (s.y + s.vy < ARENA.y1 + 6 || s.y + s.vy > ARENA.y2 - 6) { s.vy = -s.vy; urto = true; }
        if (urto && s.rimbalzi-- <= 0) { statoRun.effettiSplash.push({ x: s.x, y: s.y, tick: 0 }); n.spoleB6.splice(i, 1); continue; }
        s.x += s.vx; s.y += s.vy;
        if (s.t > S.vitaMaxTick) { n.spoleB6.splice(i, 1); continue; }
        if (toccaGiocatoreB6(s.x, s.y, S.raggio)) {
          subisciColpoGiocatore(BOSS_B6.dannoHalf, `una spola de ${nomeBossB6(n)}`, s.x - s.vx, s.y - s.vy);
          if (statoRun.hpHalf <= 0 || statoRun.fase !== 'in_gioco') return;
        }
      }
    },
  },
};
for (const az of Object.values(AZIONI_B6)) { az.entra = az.entra || {}; az.passo = az.passo || {}; }

/** Giostra: porta velocità di giro e raggio dei bracci verso i valori voluti e avanza verso il giocatore. */
function giraGiostraB6(n, C, velAng, raggio, passo) {
  n.velAngB6 += (velAng - n.velAngB6) * C.inerzia;
  n.raggioB6 += (raggio - n.raggioB6) * C.estensione;
  if (passo > 0) {
    const ang = Math.atan2(player.y - n.y, player.x - n.x);
    muoviB6(n, Math.cos(ang) * n.speed * passo, Math.sin(ang) * n.speed * passo, 26);
  }
}

/** Colpi vivi di un boss nuovo oltre ai proiettili comuni (lumi in volo, lucciole, spole). */
function colpiPropriB6(n) {
  return ((n && n.lumiB6) || []).length + ((n && n.luccioleB6) || []).length + ((n && n.spoleB6) || []).length;
}

const passoLogicoBaseB6 = passoLogico;
/**
 * L'IA dei boss nuovi gira subito dopo la base, solo nei tick in cui la base ha fatto agire il boss
 * (n.phaseTick avanzato: niente hit-stop, pausa, sipario, grazia d'ingresso o stordimento).
 */
passoLogico = function (...args) {
  const st = statoRun.stanzaCorrente;
  let attesi = null;
  if (st && st.tipo === 'boss' && statoRun.fase === 'in_gioco') {
    for (const n of st.nemici) {
      if (n.boss && n.hp > 0 && AZIONI_B6[n.bossId]) (attesi || (attesi = [])).push([n, n.phaseTick || 0]);
    }
  }
  const r = passoLogicoBaseB6.apply(this, args);
  if (attesi) {
    for (const [n, prima] of attesi) {
      if (statoRun.stanzaCorrente !== st || statoRun.fase !== 'in_gioco' || statoRun.hpHalf <= 0) break;
      if (n.hp <= 0 || (n.phaseTick || 0) === prima) continue;
      try { iaBossB6(n, st); } catch (err) { console.error('[B6] ia', n.bossId, err); }
    }
  }
  return r;
};

// ===========================================================================
// DISEGNO «A OMBRE» (segnaposto dei fogli dell'autore)
// ===========================================================================
const BAGLIORI_B6 = {};
/** Alone di luce (tela fuori schermo, una per tinta). */
function bagliorB6(x, y, r, tinta, alfa = 1) {
  let c = BAGLIORI_B6[tinta];
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const rgb = TINTE_B6.rgb[tinta] || TINTE_B6.rgb.oro;
    const gr = g.createRadialGradient(32, 32, 1, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb}, 0.9)`);
    gr.addColorStop(0.4, `rgba(${rgb}, 0.32)`);
    gr.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    BAGLIORI_B6[tinta] = c;
  }
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * Math.max(0, Math.min(1, alfa));
  ctx.drawImage(c, x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = a0;
}

/** Penna della sagoma: riempimento di china, contorno netto color lanterna (bianco nel lampo del colpo). */
function chinaB6(flash) {
  ctx.fillStyle = flash ? TINTE_B6.lampo : TINTE_B6.china;
  ctx.strokeStyle = flash ? '#ffffff' : TINTE_B6.bordo;
  ctx.lineWidth = 1.1;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

/** Un tratto a sagoma (arto, asta, collo): prima il bordo più largo, poi la china. `curva` = funzione che traccia il percorso. */
function trattoB6(spessore, flash, curva) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = flash ? '#ffffff' : TINTE_B6.bordo;
  ctx.lineWidth = spessore + 1.8;
  ctx.beginPath(); curva(); ctx.stroke();
  ctx.strokeStyle = flash ? TINTE_B6.lampo : TINTE_B6.china;
  ctx.lineWidth = spessore;
  ctx.beginPath(); curva(); ctx.stroke();
}

const lineaB6 = (x1, y1, x2, y2) => () => { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); };

function puntoB6(x, y, r, colore) {
  ctx.fillStyle = colore;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

function fiammaB6(x, y, r, rossa, tick) {
  bagliorB6(x, y - r * 0.5, r * 3.4, rossa ? 'rosso' : 'oro', 0.6);
  const tr = Math.sin(tick * 0.5) * r * 0.18;
  ctx.fillStyle = rossa ? TINTE_B6.rosso : TINTE_B6.oro;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.7, y);
  ctx.quadraticCurveTo(x - r * 0.85, y - r, x + tr, y - r * 2.1);
  ctx.quadraticCurveTo(x + r * 0.85, y - r, x + r * 0.7, y);
  ctx.quadraticCurveTo(x, y + r * 0.8, x - r * 0.7, y);
  ctx.fill();
  ctx.fillStyle = rossa ? TINTE_B6.oro : TINTE_B6.lampo;
  ctx.beginPath(); ctx.ellipse(x, y - r * 0.3, r * 0.3, r * 0.55, 0, 0, TAU); ctx.fill();
}

/** Lume a mano dell'Accendilumi (anche in volo). */
function lumeB6(x, y, scala, rosso, alfa = 1) {
  bagliorB6(x, y, 13 * scala, rosso ? 'rosso' : 'oro', 0.75 * alfa);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scala, scala);
  chinaB6(false);
  ctx.beginPath(); ctx.moveTo(-3.4, -4); ctx.lineTo(3.4, -4); ctx.lineTo(4.2, 4); ctx.lineTo(-4.2, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2.4, -4); ctx.lineTo(0, -7); ctx.lineTo(2.4, -4); ctx.stroke();
  ctx.fillStyle = rosso ? TINTE_B6.rosso : TINTE_B6.oro;
  ctx.fillRect(-2.2, -2.4, 4.4, 5);
  ctx.fillStyle = TINTE_B6.lampo;
  ctx.fillRect(-0.8, -1, 1.6, 2.6);
  ctx.restore();
}

function disegnaLampionaioB6(b, tick, flash, flip) {
  const s = b.statoB6 || 'passeggia';
  const f2 = Boolean(b.fase2B6);
  const k = b.durataB6 ? 1 - (b.timerB6 || 0) / b.durataB6 : 0; // avanzamento dello stato 0..1
  const passo = s === 'passeggia' ? Math.sin(tick * 0.22) : 0;
  const china = s === 'riposo' ? 2.5 : 0; // si appoggia alla pertica
  const colLume = s === 'alzaLume' || s === 'rilancia';
  ctx.save();
  ctx.scale(flip, 1);
  // scala a pioli sulla schiena
  ctx.strokeStyle = flash ? '#ffffff' : TINTE_B6.bordo;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-12, -50); ctx.lineTo(-14, -8); ctx.moveTo(-7.5, -50); ctx.lineTo(-9.5, -8);
  for (let y = -44; y <= -12; y += 8) { ctx.moveTo(-12.2 + (y + 50) * -0.045, y); ctx.lineTo(-7.7 + (y + 50) * -0.045, y); }
  ctx.stroke();
  ctx.globalAlpha = 1;
  // gambe lunghe e scarpe
  trattoB6(2.6, flash, lineaB6(-2.5, -20, -4 - passo * 4.5, 6));
  trattoB6(2.6, flash, lineaB6(2.5, -20, 4 + passo * 4.5, 6));
  chinaB6(flash);
  ctx.beginPath(); ctx.ellipse(-2.5 - passo * 4.5, 7, 4, 1.8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(5.5 + passo * 4.5, 7, 4, 1.8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // finanziera a code
  ctx.save();
  ctx.translate(china, 0);
  chinaB6(flash);
  ctx.beginPath();
  ctx.moveTo(-6, -46); ctx.lineTo(6, -46); ctx.lineTo(8, -25); ctx.lineTo(11.5, -12 + passo * 1.5);
  ctx.lineTo(4, -17); ctx.lineTo(0, -13); ctx.lineTo(-4, -17); ctx.lineTo(-11.5, -12 - passo * 1.5); ctx.lineTo(-8, -25);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const y of [-40, -34, -28]) puntoB6(1.6, y, 0.9, TINTE_B6.oro);
  // sciarpa rossa
  ctx.fillStyle = TINTE_B6.rosso;
  ctx.beginPath(); ctx.moveTo(-5, -47); ctx.lineTo(5.5, -47); ctx.lineTo(2, -43.5); ctx.lineTo(-8.5, -39 + Math.sin(tick * 0.15) * 1.2); ctx.closePath(); ctx.fill();
  // testa, tuba e occhio
  chinaB6(flash);
  ctx.beginPath(); ctx.arc(0.5, -52, 5.4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.rect(-5.5, -68, 11, 11.5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = f2 ? TINTE_B6.rosso : TINTE_B6.oro;
  ctx.fillRect(-5.5, -60, 11, 1.8);
  trattoB6(1.6, flash, lineaB6(-9, -56.4, 9, -56.4));
  puntoB6(3, -52.4, 1.3, f2 ? TINTE_B6.rosso : TINTE_B6.oro);
  ctx.restore();
  ctx.restore();

  // braccio e pertica: in coordinate di schermo (l'angolo della pertica è quello vero della spazzata)
  let ang = -Math.PI / 2 + flip * 0.22;
  let fiamma = 2.6;
  if (s === 'alzaPertica' || s === 'rialza') { ang = b.angPerticaB6; fiamma = 3 + 3.6 * k + Math.sin(tick * 0.9) * 0.6; }
  else if (s === 'sferza') { ang = b.angPerticaB6; fiamma = 6.4; }
  else if (s === 'riposo') { ang = -Math.PI / 2 + flip * 0.06; fiamma = 1.2 + (k > 0.7 ? (k - 0.7) * 5 : 0); }
  else if (s === 'cambiaFase') { ang = -Math.PI / 2; fiamma = 4 + 5 * Math.abs(Math.sin(tick * 0.3)); }
  else if (colLume || s === 'lancia') { ang = -Math.PI / 2 + flip * 0.1; }
  const mx = flip * 6 + (s === 'riposo' ? flip * 2.5 : 0), my = -31;
  const lung = 30; // lunghezza della pertica oltre la mano
  const tx = mx + Math.cos(ang) * lung, ty = my + Math.sin(ang) * lung;
  trattoB6(2.2, flash, lineaB6(flip * 4, -43, mx, my));
  trattoB6(1.7, flash, lineaB6(mx - Math.cos(ang) * 9, my - Math.sin(ang) * 9, tx, ty));
  fiammaB6(tx, ty, fiamma, f2, tick);
  // l'altro braccio: lume alla cintura, oppure alzato dietro la testa prima del lancio
  if (colLume) {
    const hx = -flip * 11, hy = -58 - 5 * k;
    trattoB6(2.2, flash, lineaB6(-flip * 4, -43, hx, hy + 6));
    lumeB6(hx, hy, 1 + 0.35 * k + Math.sin(tick * 0.8) * 0.08, f2);
  } else if (s === 'lancia') {
    trattoB6(2.2, flash, lineaB6(-flip * 4, -43, flip * 12, -40));
  } else {
    trattoB6(2.2, flash, lineaB6(-flip * 4, -43, -flip * 8, -27));
    lumeB6(-flip * 8.5, -21, 0.7, f2, 0.6);
  }
}

function accessoriLampionaioB6(b, tick, strato) {
  if (strato !== 'davanti') return;
  const L = BOSS_B6.lampionaio.lume;
  for (const l of b.lumiB6 || []) {
    if (L.ombra) {
      ctx.fillStyle = 'rgba(8, 5, 3, 0.4)';
      ctx.beginPath(); ctx.ellipse(l.x, l.y + 6, 4.5, 1.8, 0, 0, TAU); ctx.fill();
    }
    lumeB6(l.x, l.y - l.z, 1.15, Boolean(b.fase2B6));
  }
}

function disegnaCignoB6(b, tick, flash, flipGiocatore) {
  const s = b.statoB6 || 'scivola';
  const f2 = Boolean(b.fase2B6);
  const k = b.durataB6 ? 1 - (b.timerB6 || 0) / b.durataB6 : 0;
  const versoMoto = s === 'scivola' || s === 'beccata' || s === 'inarca' || s === 'riarca';
  const flip = versoMoto ? (Math.cos(b.rotB6 || 0) < 0 ? -1 : 1) : flipGiocatore;
  const aliAperte = s === 'apreAli' || s === 'piume' || s === 'cambiaFase';
  const trema = s === 'apreAli' ? Math.sin(tick * 1.4) * (0.5 + k) : s === 'inarca' || s === 'riarca' ? Math.sin(tick * 1.1) * 0.5 * k : 0;
  // posa del collo: [testa x, testa y, controllo 1 x, y, controllo 2 x, y, becco (rad)]
  const POSE = {
    scivola: [18, -37, 23, -20, 8, -31, 0.2], inarca: [3, -30, 19, -23, -4, -21, -0.05], riarca: [3, -30, 19, -23, -4, -21, -0.05],
    beccata: [33, -17, 19, -14, 26, -19, 0], apreAli: [13, -42, 21, -22, 5, -33, 0.1], piume: [15, -41, 21, -22, 6, -33, 0.25],
    molla: [23, -6, 21, -23, 28, -16, 1.25], cambiaFase: [11, -45, 20, -24, 3, -34, -0.5],
  };
  const P = POSE[s] || POSE.scivola;
  const D = b.disegnoB6 || (b.disegnoB6 = P.slice());
  for (let i = 0; i < 7; i++) D[i] += (P[i] - D[i]) * (s === 'beccata' ? 0.6 : 0.22);
  ctx.save();
  ctx.scale(flip, 1);
  ctx.translate(trema, s === 'scivola' ? Math.sin(tick * 0.09) * 0.8 : 0);
  // ala lontana (dietro lo scafo)
  if (aliAperte) alaCignoB6(-4, -14, 0.82, -1, tick, flash, s === 'apreAli' ? k : 1);
  // ruote di latta
  for (const wx of [-11, 9]) {
    chinaB6(flash);
    ctx.beginPath(); ctx.arc(wx, 5, 3.4, 0, TAU); ctx.fill(); ctx.stroke();
    puntoB6(wx, 5, 1, TINTE_B6.oro);
  }
  // scafo con la coda all'insù
  chinaB6(flash);
  ctx.beginPath();
  ctx.moveTo(-20, -6); ctx.quadraticCurveTo(-25, -20, -18, -25); ctx.quadraticCurveTo(-13, -14, -4, -15);
  ctx.lineTo(10, -15); ctx.quadraticCurveTo(21, -13, 20, -4); ctx.quadraticCurveTo(14, 4, 0, 4); ctx.lineTo(-12, 4);
  ctx.quadraticCurveTo(-19, 2, -20, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const rx of [-13, -5, 3, 11]) puntoB6(rx, -1, 0.7, flash ? '#ffffff' : TINTE_B6.bordo);
  if (f2) { // la lamiera si è aperta: una crepa rossa
    ctx.strokeStyle = TINTE_B6.rosso; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-2, -14); ctx.lineTo(1, -9); ctx.lineTo(-2, -6); ctx.lineTo(2, -1); ctx.stroke();
  }
  // chiave a farfalla sul dorso: gira (svelta quando sta per ripartire, lenta a molla scarica)
  const velChiave = s === 'molla' ? (k > 0.72 ? 0.55 : 0.04) : f2 ? 0.34 : 0.2;
  b.chiaveB6 = (b.chiaveB6 || 0) + velChiave;
  const lc = Math.abs(Math.cos(b.chiaveB6)) * 4.6 + 0.7;
  ctx.strokeStyle = TINTE_B6.oro; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-7, -16); ctx.lineTo(-7, -24); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-7 - lc, -27.5, lc, 3.6, 0, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-7 + lc, -27.5, lc, 3.6, 0, 0, TAU); ctx.stroke();
  // collo e testa
  trattoB6(4.6, flash, () => { ctx.moveTo(12, -13); ctx.bezierCurveTo(D[2], D[3], D[4], D[5], D[0], D[1]); });
  ctx.save();
  ctx.translate(D[0], D[1]);
  ctx.rotate(D[6]);
  ctx.fillStyle = f2 ? TINTE_B6.rosso : TINTE_B6.oro;
  ctx.beginPath(); ctx.moveTo(3, -2.2); ctx.lineTo(11.5, 0.4); ctx.lineTo(3, 2.4); ctx.closePath(); ctx.fill();
  chinaB6(flash);
  ctx.beginPath(); ctx.ellipse(0, 0, 5, 3.9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  puntoB6(1.4, -0.9, 1.1, f2 ? TINTE_B6.rosso : TINTE_B6.oro);
  ctx.restore();
  // ala vicina
  if (aliAperte) alaCignoB6(-2, -14, 1, 1, tick, flash, s === 'apreAli' ? k : 1);
  else if (s === 'beccata') {
    chinaB6(flash);
    ctx.beginPath(); ctx.moveTo(4, -14); ctx.lineTo(-27, -27); ctx.lineTo(-10, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    chinaB6(flash);
    const giu = s === 'molla' ? 3 : 0;
    ctx.beginPath(); ctx.moveTo(-13, -13 + giu); ctx.quadraticCurveTo(0, -27 + giu * 2, 13, -11 + giu); ctx.quadraticCurveTo(0, -6 + giu, -13, -13 + giu); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7, -13 + giu); ctx.quadraticCurveTo(0, -19 + giu, 8, -11.5 + giu); ctx.stroke();
  }
  ctx.restore();
}

/** Ala aperta a ventaglio del Cigno (lato = 1 vicina, −1 lontana); `apre` 0..1. */
function alaCignoB6(x, y, scala, lato, tick, flash, apre) {
  const penne = 5;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scala, scala);
  chinaB6(flash);
  if (lato < 0) ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  for (let i = 0; i < penne; i++) {
    const a = -2.75 + i * 0.42 * (0.45 + 0.55 * apre) + (lato < 0 ? 0.25 : 0);
    const lung = [26, 33, 35, 31, 24][i] * (0.6 + 0.4 * apre);
    ctx.lineTo(Math.cos(a) * lung, Math.sin(a) * lung);
    const am = a + 0.21 * (0.45 + 0.55 * apre);
    if (i < penne - 1) ctx.lineTo(Math.cos(am) * lung * 0.62, Math.sin(am) * lung * 0.62);
  }
  ctx.lineTo(-6, 2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function disegnaGiostraB6(b, tick, flash) {
  const s = b.statoB6 || 'gira';
  const f2 = Boolean(b.fase2B6);
  const incl = s === 'prendeGiro' ? Math.sin(tick * 0.55) * 0.09 : s === 'allarga' ? Math.sin(b.girB6 || 0) * 0.05 : 0;
  const cala = s === 'quieta' ? 3 : 0;
  const accento = f2 ? TINTE_B6.rosso : TINTE_B6.oro;
  // basamento a tamburo con le lampadine
  chinaB6(flash);
  ctx.beginPath(); ctx.ellipse(0, 5, 18, 5.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.rect(-14, -4, 28, 8); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const acceso = s !== 'quieta' && Math.floor(tick / 10 + i) % 2 === 0;
    puntoB6(-10 + i * 5, 0, 1.1, acceso ? accento : TINTE_B6.bordo);
  }
  // colonna con la maschera
  chinaB6(flash);
  ctx.beginPath(); ctx.rect(-3.2, -42 + cala, 6.4, 39 - cala); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -22, 6.4, 7.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = accento;
  ctx.beginPath(); ctx.ellipse(-2.5, -23, 1.7, s === 'quieta' ? 0.5 : 1.1, 0.25, 0, TAU); ctx.ellipse(2.5, -23, 1.7, s === 'quieta' ? 0.5 : 1.1, -0.25, 0, TAU); ctx.fill();
  ctx.strokeStyle = accento; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.arc(0, -20, 2.6, 0.25, Math.PI - 0.25); ctx.stroke();
  // tendone a spicchi con il pennacchio
  ctx.save();
  ctx.translate(0, -41 + cala);
  ctx.rotate(incl);
  chinaB6(flash);
  ctx.beginPath();
  ctx.moveTo(-25, 0); ctx.lineTo(0, -21); ctx.lineTo(25, 0);
  for (let i = 4; i >= 0; i--) ctx.quadraticCurveTo(-25 + i * 10 + 5, 5.5, -25 + i * 10, 0);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  if (!flash) {
    ctx.fillStyle = TINTE_B6.rosso;
    ctx.globalAlpha = 0.8;
    for (const i of [0, 2, 4]) {
      ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(-25 + i * 10 + 1.5, -0.6); ctx.lineTo(-25 + i * 10 + 8.5, -0.6); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  trattoB6(1.2, flash, lineaB6(0, -21, 0, -29));
  puntoB6(0, -30, 2.3, accento);
  ctx.fillStyle = TINTE_B6.rosso;
  const sv = Math.sin(tick * 0.3) * 1.5;
  ctx.beginPath(); ctx.moveTo(1, -29); ctx.lineTo(10, -27 + sv); ctx.lineTo(1, -24.5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function accessoriGiostraB6(b, tick, strato) {
  const C = BOSS_B6['giostra-lucciole'];
  const s = b.statoB6 || 'gira';
  const f2 = Boolean(b.fase2B6);
  const nb = f2 ? C.bracciFase2 : C.bracci;
  const raggio = b.raggioB6 || C.raggioCorto;
  const gir = b.girB6 || 0;
  const luce = s === 'quieta' ? 0.3 : s === 'accende' ? (Math.floor(tick / 4) % 2 ? 1 : 0.35) : s === 'cambiaFase' ? 0.5 + 0.5 * Math.abs(Math.sin(tick * 0.4)) : 0.85;
  for (let k = 0; k < nb; k++) {
    const a = gir + (TAU * k) / nb;
    const dietro = Math.sin(a) < 0;
    if (dietro !== (strato === 'dietro')) continue;
    const lx = b.x + Math.cos(a) * raggio, ly = b.y - C.quotaLumi + Math.sin(a) * raggio * C.schiaccio;
    ctx.strokeStyle = TINTE_B6.bordo; ctx.lineWidth = 1; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * 22, b.y - 41 + Math.sin(a) * 4); ctx.lineTo(lx, ly - 7); ctx.stroke();
    ctx.globalAlpha = 1;
    const rosso = f2 && k === nb - 1;
    bagliorB6(lx, ly, s === 'accende' ? 16 : 12, rosso ? 'rosso' : f2 ? 'brace' : 'oro', luce);
    chinaB6(false);
    ctx.beginPath(); ctx.rect(lx - 3.6, ly - 5.5, 7.2, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx - 2.6, ly - 5.5); ctx.lineTo(lx, ly - 8); ctx.lineTo(lx + 2.6, ly - 5.5); ctx.stroke();
    ctx.globalAlpha = luce;
    puntoB6(lx, ly - 0.5, 2.2, rosso ? TINTE_B6.rosso : TINTE_B6.oro);
    puntoB6(lx, ly - 0.5, 0.9, TINTE_B6.lampo);
    ctx.globalAlpha = 1;
  }
  if (strato !== 'davanti') return;
  for (const l of b.luccioleB6 || []) {
    const lampeggia = l.stato === 'lampeggia';
    const acceso = !lampeggia || Math.floor(l.t / 3) % 2 === 0;
    if (l.stato === 'scatta') {
      ctx.strokeStyle = TINTE_B6.oro; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(l.x - l.vx * 3, l.y - l.vy * 3); ctx.lineTo(l.x, l.y); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    bagliorB6(l.x, l.y, lampeggia ? (acceso ? 13 : 6) : 8, f2 ? 'brace' : 'oro', acceso ? 1 : 0.5);
    puntoB6(l.x, l.y, lampeggia && acceso ? 2.8 : 2, acceso ? TINTE_B6.lampo : TINTE_B6.oro);
    chinaB6(false);
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(l.x - 2.6, l.y - 2.2, 2.4, 1, -0.5 + Math.sin(tick * 0.9) * 0.4, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(l.x + 2.6, l.y - 2.2, 2.4, 1, 0.5 - Math.sin(tick * 0.9) * 0.4, 0, TAU); ctx.stroke();
  }
}

function disegnaTessitriceB6(b, tick, flash, flip) {
  const s = b.statoB6 || 'cammina';
  const f2 = Boolean(b.fase2B6);
  const k = b.durataB6 ? 1 - (b.timerB6 || 0) / b.durataB6 : 0;
  const pettineSu = s === 'alzaPettine' || s === 'ripettina' || s === 'ordito';
  const spoleSu = s === 'alzaSpole';
  const accento = f2 ? TINTE_B6.rosso : TINTE_B6.oro;
  ctx.save();
  ctx.rotate(s === 'cammina' ? Math.sin(tick * 0.1) * 0.035 : 0);
  // plinto
  chinaB6(flash);
  ctx.beginPath(); ctx.moveTo(-18, 8); ctx.lineTo(18, 8); ctx.lineTo(15, -1); ctx.lineTo(-15, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-16.5, 3.5); ctx.lineTo(16.5, 3.5); ctx.stroke();
  // veste a colonna
  ctx.beginPath();
  ctx.moveTo(-12.5, -1); ctx.lineTo(-9, -30); ctx.quadraticCurveTo(-9.5, -41, -5, -43); ctx.lineTo(5, -43);
  ctx.quadraticCurveTo(9.5, -41, 9, -30); ctx.lineTo(12.5, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  for (const px of [-6, -1.5, 3, 7]) { ctx.moveTo(px * 0.8, -26); ctx.lineTo(px * 1.25, -3); }
  ctx.stroke();
  ctx.globalAlpha = 1;
  // giglio d'oro sul petto
  ctx.fillStyle = accento; ctx.strokeStyle = accento; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, -34, 1.5, 4, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(-3.2, -33, 2.6, -0.3, 2.2); ctx.stroke();
  ctx.beginPath(); ctx.arc(3.2, -33, 2.6, Math.PI - 2.2, Math.PI + 0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3.4, -30); ctx.lineTo(3.4, -30); ctx.stroke();
  // crepe (in fase 2 ardono)
  ctx.strokeStyle = f2 ? TINTE_B6.rosso : TINTE_B6.bordo; ctx.lineWidth = f2 ? 1.3 : 0.8; ctx.globalAlpha = f2 ? 1 : 0.6;
  ctx.beginPath(); ctx.moveTo(6, -27); ctx.lineTo(3.5, -21); ctx.lineTo(7, -16); ctx.lineTo(4.5, -9);
  if (f2) { ctx.moveTo(-7, -24); ctx.lineTo(-4, -18); ctx.lineTo(-8, -11); ctx.moveTo(-2, -47); ctx.lineTo(1, -43); }
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (f2) bagliorB6(5, -18, 12, 'rosso', 0.35 + 0.2 * Math.sin(tick * 0.2));
  // velo e volto
  const capo = s === 'annoda' ? 2.5 : 0;
  chinaB6(flash);
  ctx.beginPath();
  ctx.moveTo(-8.5, -40 + capo); ctx.quadraticCurveTo(-10, -57 + capo, 0, -59 + capo); ctx.quadraticCurveTo(10, -57 + capo, 8.5, -40 + capo);
  ctx.quadraticCurveTo(0, -36 + capo, -8.5, -40 + capo); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash ? '#ffffff' : TINTE_B6.china2;
  ctx.beginPath(); ctx.ellipse(flip * 1.4, -48.5 + capo, 4.3, 5.4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = accento;
  ctx.fillRect(flip * 1.4 - 3, -49.6 + capo, 2.2, s === 'annoda' ? 0.6 : 1.1);
  ctx.fillRect(flip * 1.4 + 0.8, -49.6 + capo, 2.2, s === 'annoda' ? 0.6 : 1.1);
  // braccia di pietra
  if (pettineSu) {
    const su = s === 'ordito' ? 1 - k * 0.6 : Math.min(1, k * 3);
    trattoB6(3, flash, lineaB6(-8, -39, -13, -39 - 17 * su));
    trattoB6(3, flash, lineaB6(8, -39, 13, -39 - 17 * su));
  } else if (spoleSu || s === 'lancia') {
    const ap = s === 'lancia' ? 1 - k : Math.min(1, k * 2.5);
    trattoB6(3, flash, lineaB6(-8, -39, -9 - 9 * ap, -32 - 13 * ap));
    trattoB6(3, flash, lineaB6(8, -39, 9 + 9 * ap, -32 - 13 * ap));
    if (spoleSu) {
      const pul = 1 + Math.sin(tick * 0.7) * 0.12;
      spolaB6(-18, -46, 0.5, pul, f2);
      spolaB6(18, -46, -0.5, pul, f2);
      if (f2) spolaB6(0, -66, 0, pul, f2);
    }
  } else if (s === 'cambiaFase') {
    trattoB6(3, flash, lineaB6(-8, -39, -15, -55));
    trattoB6(3, flash, lineaB6(8, -39, 15, -55));
  } else {
    const giu = s === 'annoda' ? 9 : 0;
    trattoB6(3, flash, lineaB6(-8, -39, -6 - giu * 0.6, -23 + giu));
    trattoB6(3, flash, lineaB6(8, -39, 6 + giu * 0.6, -23 + giu));
    if (s === 'annoda') { // fili lenti da riannodare
      ctx.strokeStyle = TINTE_B6.oro; ctx.lineWidth = 0.9; ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(-11.5, -14); ctx.quadraticCurveTo(-16, 2 + Math.sin(tick * 0.12) * 2, -4, 5);
      ctx.moveTo(11.5, -14); ctx.quadraticCurveTo(17, 0 + Math.cos(tick * 0.1) * 2, 5, 6);
      ctx.moveTo(-11.5, -14); ctx.quadraticCurveTo(0, -4 + Math.sin(tick * 0.16) * 2.5, 11.5, -14);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else { // il pettine tenuto basso
      ctx.strokeStyle = TINTE_B6.oro; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-9, -22); ctx.lineTo(9, -22);
      for (let i = -8; i <= 8; i += 3.2) { ctx.moveTo(i, -22); ctx.lineTo(i, -18.5); }
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Spola della Tessitrice (in mano o in volo): fuso d'oro con il filo rosso. */
function spolaB6(x, y, rot, scala, fase2) {
  bagliorB6(x, y, 11 * scala, fase2 ? 'rosso' : 'oro', 0.6);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scala, scala);
  ctx.fillStyle = TINTE_B6.oro; ctx.strokeStyle = TINTE_B6.china; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(0, -4.4, 8, 0); ctx.quadraticCurveTo(0, 4.4, -8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = TINTE_B6.rosso;
  ctx.fillRect(-2.6, -2, 5.2, 4);
  ctx.restore();
}

function accessoriTessitriceB6(b, tick, strato) {
  if (strato !== 'davanti') return;
  const C = BOSS_B6['tessitrice-pietra'];
  const s = b.statoB6;
  const f2 = Boolean(b.fase2B6);
  // il pettine del telaio sopra la testa, orientato come la fila che partirà: denti accesi = colpi, vuoto = varco
  if (s === 'alzaPettine' || s === 'ripettina') {
    const P = C.pettine;
    const kk = b.durataB6 ? 1 - (b.timerB6 || 0) / b.durataB6 : 0;
    const su = Math.min(1, kk * 3);
    const a = b.angB6 || 0;
    const px = -Math.sin(a), py = Math.cos(a), dx = Math.cos(a), dy = Math.sin(a);
    const cx = b.x, cy = b.y - 50 - 20 * su;
    const passo = 5.4, meta = (P.denti - 1) / 2;
    const fermo = (b.timerB6 || 0) <= P.bloccoTick; // angolo bloccato: i denti brillano
    ctx.save();
    ctx.globalAlpha = su;
    ctx.strokeStyle = TINTE_B6.oro; ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(b.x - 13, b.y - 39 - 17 * su); ctx.lineTo(cx - px * meta * passo, cy - py * meta * passo);
    ctx.moveTo(b.x + 13, b.y - 39 - 17 * su); ctx.lineTo(cx + px * meta * passo, cy + py * meta * passo);
    ctx.stroke();
    trattoB6(2.2, false, lineaB6(cx - px * (meta + 0.7) * passo, cy - py * (meta + 0.7) * passo, cx + px * (meta + 0.7) * passo, cy + py * (meta + 0.7) * passo));
    for (let i = 0; i < P.denti; i++) {
      if (i >= b.varcoB6 && i < b.varcoB6 + P.varco) continue;
      const ox = cx + px * (i - meta) * passo, oy = cy + py * (i - meta) * passo;
      ctx.strokeStyle = fermo ? TINTE_B6.lampo : f2 ? TINTE_B6.rosso : TINTE_B6.oro;
      ctx.lineWidth = fermo ? 2 : 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + dx * (6 + (fermo ? 2 : 0)), oy + dy * (6 + (fermo ? 2 : 0))); ctx.stroke();
      if (fermo) bagliorB6(ox + dx * 7, oy + dy * 7, 5, f2 ? 'rosso' : 'oro', 0.8);
    }
    ctx.restore();
  }
  for (const sp of b.spoleB6 || []) {
    ctx.strokeStyle = TINTE_B6.oro; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(sp.x - sp.vx * 5, sp.y - sp.vy * 5); ctx.lineTo(sp.x, sp.y); ctx.stroke();
    ctx.globalAlpha = 1;
    spolaB6(sp.x, sp.y, Math.atan2(sp.vy, sp.vx) + Math.sin(sp.t * 0.5) * 0.3, 1, f2);
  }
}

const DISEGNI_B6 = Object.freeze({
  lampionaio: Object.freeze({ corpo: disegnaLampionaioB6, accessori: accessoriLampionaioB6 }),
  'cigno-latta': Object.freeze({ corpo: disegnaCignoB6, accessori: null }),
  'giostra-lucciole': Object.freeze({ corpo: disegnaGiostraB6, accessori: accessoriGiostraB6 }),
  'tessitrice-pietra': Object.freeze({ corpo: disegnaTessitriceB6, accessori: accessoriTessitriceB6 }),
});

/**
 * Immagine dell'autore al posto del disegno sul canvas, se c'è: (1) foglio animato del boss nel LAYOUT di
 * t2-sprite.js, con la posa presa dallo stato dell'IA; (2) FOGLIO_BOSS di t2; (3) immagine ferma di SPRITE_BOSS_A.
 * @returns {boolean} true se ha disegnato
 */
function disegnaBossDaFoglioB6(b, tick, flip, flash) {
  const t2 = window.__teatro && window.__teatro.t2;
  const F = SCHEDE_B6[b.bossId].foglio;
  if (t2 && t2.LAYOUT && t2.LAYOUT[F.nome] && typeof t2.disegnaFotogramma === 'function') {
    const posa = F.pose[b.statoB6] || 'fermo';
    ctx.save();
    ctx.scale(flip, 1);
    const ok = t2.disegnaFotogramma(ctx, F.nome, posa, t2.fotogramma(posa, tick), F.piedi, flash ? '#ffffff' : null, flash ? 0.6 : 0, F.altezza);
    ctx.restore();
    if (ok) return true;
  }
  if (t2 && typeof t2.boss === 'function' && t2.boss(ctx, b, tick)) return true;
  const A = typeof SPRITE_BOSS_A !== 'undefined' ? SPRITE_BOSS_A[b.bossId] : null;
  if (A && A.pose && A.pose.fermo) {
    return disegnaMobSprite(ctx, `boss/${A.pose.fermo[0]}`, 0, A.piedi || 8, A.altezza * (A.pose.fermo[1] || 1), A.guardaDestra ? flip : -flip, flash);
  }
  return false;
}

/** Disegna un boss nuovo: ombra del corpo, accessori dietro, corpo (foglio o canvas), accessori davanti. */
function disegnaBossB6(b, tick) {
  const scheda = SCHEDE_B6[b.bossId];
  const D = DISEGNI_B6[b.bossId];
  const flash = b.flash > 0 && OPZIONI.lampi !== false;
  const flip = player.x < b.x ? -1 : 1;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = 'rgba(8, 5, 3, 0.68)';
  ctx.beginPath(); ctx.ellipse(b.x, b.y + 8, scheda.ombra[0], scheda.ombra[1], 0, 0, TAU); ctx.fill();
  if (D.accessori) { ctx.save(); D.accessori(b, tick, 'dietro'); ctx.restore(); }
  ctx.save();
  ctx.translate(b.x, b.y);
  if (!disegnaBossDaFoglioB6(b, tick, flip, flash)) D.corpo(b, tick, flash, flip);
  ctx.restore();
  if (D.accessori) { ctx.save(); D.accessori(b, tick, 'davanti'); ctx.restore(); }
  ctx.restore();
}

const disegnaBossPittoricoBaseB6 = disegnaBossPittorico;
/** I boss nuovi si disegnano qui; gli altri restano alla base. Stessa firma: ([ctx], boss, tick). */
disegnaBossPittorico = function (...args) {
  const a = args[0] && typeof args[0].save === 'function' ? args.slice(1) : args;
  const b = a[0];
  if (!b || !DISEGNI_B6[b.bossId]) return disegnaBossPittoricoBaseB6.apply(this, args);
  try { disegnaBossB6(b, a[1] || 0); } catch (err) { console.error('[B6] disegno', b.bossId, err); }
};

const disegnaHUDPixelArtBaseB6 = disegnaHUDPixelArt;
/** Prima dell'HUD: le anime del boss sconfitto salgono e svaniscono (bibbia §XII: non lasciano cadaveri). */
disegnaHUDPixelArt = function (...args) {
  try {
    const A = BOSS_B6.anime;
    for (let i = b6.anime.length - 1; i >= 0; i--) {
      const p = b6.anime[i];
      const eta = tick - p.t0;
      if (eta < 0) continue;
      if (eta > A.durataTick || statoRun.stanzaCorrente == null || statoRun.stanzaCorrente.tipo !== 'boss') { b6.anime.splice(i, 1); continue; }
      const alfa = 1 - eta / A.durataTick;
      const x = p.x + Math.sin(eta * 0.08 + p.fase) * 6, y = p.y - eta * A.salita;
      ctx.save();
      ctx.globalAlpha = alfa;
      bagliorB6(x, y, 9, 'oro', 0.5);
      puntoB6(x, y, 2.2, p.colore);
      puntoB6(x, y, 0.9, TINTE_B6.lampo);
      ctx.restore();
    }
  } catch (err) { console.error('[B6] anime', err); }
  return disegnaHUDPixelArtBaseB6.apply(this, args);
};

// ===========================================================================
// SONDA QA / SVILUPPO
// ===========================================================================
Object.assign(window.__teatro.interni, {
  ROSA_B6, SCHEDE_B6, BOSS_B6, STATI_B6,
  bossB6: Object.freeze({
    /** Sviluppo/QA: impone un boss (id di POOL_BOSS) ai piani 1-3; null torna alla rosa. */
    forza(id) { b6.forzato = id || null; },
    /** Sviluppo/QA: sorgente del caso del sacchetto (funzione 0..1); senza argomento torna Math.random. */
    caso(f) { b6.casuale = typeof f === 'function' ? f : Math.random; },
    get memoria() { return leggiRosaB6(); },
    azzeraMemoria() { try { localStorage.removeItem(chiaveRosaB6()); } catch (_) { /* idem */ } if (statoRun.rosaB6) statoRun.rosaB6 = null; },
    rosaDelPiano: rosaDelPianoB6,
    bossDelPiano: (piano) => { const x = bossDelPianoB6(piano); return x ? x.id : null; },
    /** Boss nuovo della stanza corrente: stato dell'IA, fase, colpi propri. */
    get stato() {
      const st = statoRun.stanzaCorrente;
      const n = st && st.nemici.find((x) => x.boss);
      if (!n) return null;
      return { bossId: n.bossId, nome: n.nome, nuovo: Boolean(SCHEDE_B6[n.bossId]), stato: n.statoB6 || null, fase2: Boolean(n.fase2B6),
        hp: n.hp, maxHp: n.maxHp, x: n.x, y: n.y, colpiPropri: colpiPropriB6(n), proiettili: statoRun.proiettiliNemici.length };
    },
    get anime() { return b6.anime.length; },
  }),
});
