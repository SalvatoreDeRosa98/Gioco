/**
 * h1-agnese-taddeo.js — La linea di Agnese e il tradimento di Taddeo (bibbia §IV, §V, §XIV).
 *
 * 1. IL TELAIO DI AGNESE (San Leucio, piano 3): una stanza di scena, sempre presente quando il piano 3 è
 *    San Leucio (pianoÈSanLeucioH1). Niente nemici: il telaio reale, la seta, Agnese che tesse la stessa
 *    sciarpa rossa senza sapere per chi. Primo incontro (bibbia §IV, adattato: lei non lo riconosce), poi uno
 *    scambio diverso ogni notte con un dono (una cura o un filo di seta che fa da scudo per una stanza), e una
 *    volta per slot la scelta «Restituiscile i ricordi» / «Lasciala sognare» → flag T4 `agnese`.
 *    Condizione della scelta: aver battuto almeno una volta il guardiano di San Leucio (flag `h1_leucio`):
 *    è lì che Ferruccio capisce che il Velo nasce dalla seta.
 *    Le scene A-D della bibbia dipendono dal flag `taddeo`; senza il confronto c'è una variante neutra e la
 *    scena A-D arriva dopo (al telaio o sotto il portico).
 * 2. IL CONFRONTO CON TADDEO: alla prima caduta del Capitano di Piombo, prima di scendere, «Perdonalo» /
 *    «Accusalo» → flag T4 `taddeo`. Effetto di gioco simmetrico (EFFETTI_H1.taddeo).
 * 3. PIAZZA: le presenze `agnese` (solo se risvegliata) e `taddeo` (perdonato o accusato, in due posti) di
 *    DATI.modelloHub vivono con le battute di TESTI_H1. Chi è giocato non compare in piazza.
 * 4. DIARIO e FINALI: la lettera di Agnese (lettera_agnese = 'vera') per intero nel Diario, una riga per la
 *    scelta su Taddeo e su Agnese; nel finale vero la riga del destino di Agnese e di Taddeo nei due rami.
 *
 * Agganci nei file altrui (una riga ciascuno): t4-hub-storia.js espone `window.__teatro.h1api` (apriDialogo,
 * voce, presenze del modello) e chiama `window.__teatro.npcParlaH1(npc)` prima delle ripetizioni.
 * Avvolge (chiamando sempre la base): generaMappaPiano, entraInStanza, interagisciStanza, passoLogico,
 * ricalcolaStatistiche, disegnaStanzaPixelArt, disegnaHUDPixelArt, componiPaginaB8, contestoFinaleB8,
 * condizioneB8. Stato per stanza nei campi `st.telaioH1`, `st.capitanoH1`, `st.confrontoH1`, `n.guardiaH1`.
 */

// ===========================================================================
// 1. VALORI DI GIOCO
// ===========================================================================
const CONFIG_H1 = Object.freeze({
  quartiere: 'san-leucio',              // id di QUARTIERI_PIANI dove esiste il telaio
  tipoStanza: 'telaio',
  bossCapitano: 'capitano-guardia',
  bossLeucio: Object.freeze(['capitano-guardia', 'tessitrice-pietra']), // per la condizione della scelta (a6)
  genitori: Object.freeze(['normale']),
  maiAccantoA: Object.freeze(['boss', 'segreta', 'patto']),
  telaio: Object.freeze({ x: 320, y: 150, raggioParla: 78 }),
  agnese: Object.freeze({ x: 372, y: 172 }),
  dono: Object.freeze({ curaHalf: 2, filoScudi: 1 }),   // cura = una maschera intera; filo = 1 colpo parato
  // posizione di Taddeo in piazza (celle del modello dell'hub) secondo la scelta
  piazzaTaddeo: Object.freeze({ perdonato: { c: 8, r: 4 }, accusato: { c: 1, r: 5 } }),
});

/** Effetti simmetrici della scelta su Taddeo: nessuna dà solo vantaggi (bibbia §XIV). */
const EFFETTI_H1 = Object.freeze({
  taddeo: Object.freeze({
    perdonato: Object.freeze({ moltDanno: 0.93, bossSegnato: true, moltVitaGuardie: 1 }),
    accusato: Object.freeze({ moltDanno: 1.07, bossSegnato: false, moltVitaGuardie: 1.2 }),
  }),
});

/** Nomi dei PNG che sostituiscono il disegno a canvas (null = non ancora disegnato: si usa il canvas). */
const SPRITE_H1 = { telaio: null };

// ===========================================================================
// 2. TESTI (bibbia alla lettera dove c'è; «nuovo» = scritto qui, da approvare)
// ===========================================================================
const TESTI_H1 = Object.freeze({
  segno: '≡',
  avvicinati: '[E] Avvicinati al telaio',
  agneseGiocata: '[E] Guarda il telaio',
  scelta: Object.freeze({ risveglia: 'Restituiscile i ricordi', sogna: 'Lasciala sognare',
    perdona: 'Perdonalo', accusa: 'Accusalo' }),
  telaio: Object.freeze({
    primo: Object.freeze([ // bibbia §IV, adattato: lei non lo riconosce
      ['didascalia', 'Ferruccio urta il telaio. Una piccola ruota salta via e rotola sulle assi.'],
      ['agnese', 'Siete venuto ad aggiustarlo o a finirlo?'],
      ['didascalia', 'Ferruccio cerca di spiegarsi.'],
      ['agnese', 'Ah, siete pure un uomo di poche parole. Almeno quelle non le rompete.'],
      ['didascalia', 'Sul telaio c\'è una lunga sciarpa rossa, quasi finita. Agnese non sa per chi la sta tessendo.'], // nuovo
    ]),
    lettera: ['didascalia', 'In tasca Ferruccio ha la lettera che lei gli scrisse prima della maledizione. È la stessa calligrafia dei cartellini appesi al telaio.'], // nuovo
    sciarpa: Object.freeze([ // nuovo: la Sciarpa che Ferruccio porta al collo è sua
      ['agnese', 'Quella sciarpa che portate al collo... il punto è il mio. Lo riconoscerei fra mille.'],
      ['agnese', 'Strano. Non ricordo di averla mai venduta.'],
    ]),
    notti: Object.freeze([ // nuovo: una al giro, nel tono ironico e vivace di Agnese
      ['agnese', 'Ancora voi? Il telaio sta bene, grazie. Sono le mie dita che non si fermano.'],
      ['agnese', 'Se cercate la ruota che avete rotto, l\'ho rimessa. Gira meglio di prima. Non montatevi la testa.'],
      ['agnese', 'Ogni mattina la finisco, ogni sera la ricomincio. Non chiedetemi perché: non lo so nemmeno io.'],
      ['agnese', 'Avete una faccia che... no, niente. All\'alba le maschere si somigliano tutte.'],
      ['agnese', 'Dicono che a San Leucio la seta non dorme mai. Nemmeno noi, a quanto pare.'],
    ]),
    donoCura: ['didascalia', 'Agnese gli fascia la mano con un ritaglio di seta, senza chiedere. Una maschera torna al suo posto.'], // nuovo
    donoFilo: ['didascalia', 'Agnese gli annoda al polso un filo rosso. «Per la prossima stanza. Poi me lo riportate.»'], // nuovo
    // prima della scelta: Ferruccio deve capire cosa sacrifica (bibbia §XIV, principio 2)
    primaScelta: Object.freeze([
      ['agnese', 'Questa seta... certe notti, quando la tocco, mi pare di ricordare una faccia. Poi passa.'], // nuovo
      ['didascalia', 'Ora Ferruccio sa che il Velo nasce da questa seta. Tirando il filo giusto, ad Agnese tornerebbero i ricordi: anche quello della notte in cui glieli hanno tolti.'], // nuovo
    ]),
    sognanteNotti: Object.freeze([ // nuovo: dopo «Lasciala sognare», ogni notte la sciarpa è appena finita
      ['didascalia', 'Agnese taglia l\'ultimo filo. La sciarpa rossa è appena finita, come ogni notte.'],
      ['agnese', 'Guardate: finita. Domani la ricomincio, non so perché. Sento che qualcuno verrà a prenderla.'],
    ]),
    risvegliataVuoto: Object.freeze([ // nuovo
      ['didascalia', 'Il telaio è fermo. Sulla trama c\'è un biglietto: «Sono sotto il portico di Piazza Dante. Non farmi aspettare un\'altra volta.»'],
    ]),
    giocataAgnese: Object.freeze([ // nuovo: giocando CON Agnese
      ['didascalia', 'Il telaio è vuoto. Sulla trama c\'è una sciarpa rossa lasciata a metà.'],
      ['didascalia', 'Agnese passa le dita dove il filo si interrompe. Non ricorda di averlo lasciato lì.'],
    ]),
  }),
  esiti: Object.freeze({
    neutroRisvegliata: Object.freeze([ // nuovo: il confronto con Taddeo non c'è ancora stato
      ['didascalia', 'Ferruccio tira il filo. Agnese lo guarda a lungo, come si guarda una parola sulla punta della lingua.'],
      ['agnese', 'C\'è qualcosa che devo ricordare. Datemi tempo. Aspettatemi sotto il portico di Piazza Dante.'],
    ]),
    neutroSognante: Object.freeze([ // nuovo
      ['didascalia', 'Ferruccio lascia il filo dove sta. Agnese torna a tessere, canticchiando.'],
    ]),
    A: Object.freeze([ // bibbia §IV, Percorso A
      ['didascalia', 'Taddeo ha raccontato ad Agnese gli ultimi giorni trascorsi insieme. Lei riconosce Ferruccio e gli si avvicina.'],
      ['agnese', 'Non sapevo più il tuo nome.'],
      ['agnese', 'Ma ricordavo come mi guardavi.'],
      ['didascalia', 'Gli toglie delicatamente la polvere dalla maschera.'],
      ['agnese', 'Torna da me. Anche se non puoi più essere quello di prima.'],
    ]),
    B: Object.freeze([ // bibbia §IV, Percorso B
      ['didascalia', 'Agnese recupera i ricordi, ma scopre che Ferruccio ha scelto la vendetta contro il suo vecchio amico.'],
      ['agnese', 'Ho aspettato un uomo per anni.'],
      ['agnese', 'Adesso ho paura che sia tornata soltanto la sua rabbia.'],
      ['didascalia', 'Ferruccio le mostra la sciarpa consumata e tenta di prenderle la mano.'],
      ['didascalia', 'Lei gliela stringe, ma non gli promette di aspettarlo.'],
    ]),
    C: Object.freeze([ // bibbia §IV, Percorso C (Violante → Donna Luciana)
      ['didascalia', 'Ferruccio decide di non restituirle i ricordi: sa quanto dolore contengono. Taddeo cerca di convincerlo a cambiare idea.'],
      ['taddeo', 'Stai facendo esattamente quello che ha fatto Donna Luciana.'],
      ['taddeo', 'Stai scegliendo al posto suo.'],
      ['didascalia', 'Ferruccio abbassa lo sguardo.'],
    ]),
    D: Object.freeze([ // bibbia §IV, Percorso D
      ['didascalia', 'Nessuno è venuto con lui. Agnese non lo riconosce e gli offre soltanto la sciarpa appena terminata.'],
      ['agnese', 'Prendila. Non so perché, ma credo che debba averla tu.'],
      ['didascalia', 'Ferruccio prende la sciarpa, la piega accuratamente e le fa un inchino.'],
      ['didascalia', 'Agnese sorride.'],
      ['agnese', 'Che tipo buffo.'],
      ['didascalia', 'Dopo la sua partenza, si accorge di stare piangendo senza conoscerne il motivo.'],
    ]),
  }),
  portico: Object.freeze({
    sciarpa: Object.freeze([ // bibbia §IV, «Prima della maledizione»
      ['didascalia', 'Agnese tocca la sciarpa rossa al collo di Ferruccio.'],
      ['agnese', 'Dicono che il rosso protegga dal malocchio.'],
      ['agnese', 'Io non ci credo. Però con te non si sa mai.'],
    ]),
    A: Object.freeze([ // nuovo
      ['agnese', 'Stanotte ho sognato la bottega. C\'era la tua insegna, storta. L\'avevi montata tu.'],
      ['agnese', 'Vai. Il posto sotto il portico te lo tengo io.'],
      ['agnese', 'Mi tocco il polso come facevi tu. Me n\'ero dimenticata, e invece le mani no.'],
    ]),
    B: Object.freeze([ // nuovo
      ['agnese', 'Sono qui. Non ti prometto altro.'],
      ['agnese', 'La rabbia ti tiene in piedi, lo so. Ma poi, quando è finita, chi resta?'],
      ['agnese', 'Quando avrai finito con Taddeo, torna a dirmi chi sei diventato.'],
    ]),
    neutro: Object.freeze([ // nuovo
      ['agnese', 'Ogni tanto mi torna un pezzo di te. Come una spola che rientra nel filo.'],
    ]),
    dono: ['didascalia', 'Agnese gli annoda al polso un filo rosso: nella prima stanza della notte farà da scudo.'], // nuovo
  }),
  confronto: Object.freeze({
    apertura: Object.freeze([ // bibbia §V, «Il confronto»
      ['didascalia', 'Fra i pezzi d\'armatura del Capitano, una guardia si toglie l\'elmo. È Taddeo.'], // nuovo
      ['didascalia', 'Il giovane riconosce la spada.'],
      ['taddeo', 'No... Quella l\'abbiamo forgiata insieme.'],
      ['taddeo', 'Ti prego, lascia che ti spieghi.'],
    ]),
    perdonato: Object.freeze([ // bibbia §V, «Se lo perdona»
      ['didascalia', 'Taddeo confessa di aver denunciato Ferruccio per salvare Mariella.'],
      ['taddeo', 'Mi aveva promesso che mia sorella sarebbe stata bene.'],
      ['taddeo', 'E io le ho creduto. Che Dio mi perdoni.'],
      ['didascalia', 'Ferruccio rinfodera la spada.'],
      ['didascalia', 'D\'ora in poi Taddeo gli segna sulla mappa la stanza del guardiano di ogni piano; ma la spada rinfoderata colpisce un poco più piano.'], // nuovo (effetto)
    ]),
    accusato: Object.freeze([ // bibbia §V, «Se lo accusa»
      ['didascalia', 'Ferruccio gli punta la spada alla gola.'],
      ['didascalia', 'Taddeo arretra.'],
      ['taddeo', 'Se mi uccidi, lei resterà comunque là dentro!'],
      ['didascalia', 'Ferruccio non lo uccide, ma rifiuta di ascoltarlo. Taddeo fugge a cercare i documenti che potrebbero incriminarlo.'],
      ['didascalia', 'D\'ora in poi la rabbia fa colpire più forte; ma le guardie, avvisate da Taddeo, resistono di più.'], // nuovo (effetto)
    ]),
  }),
  piazzaTaddeo: Object.freeze({
    perdonato: Object.freeze([ // nuovo
      ['taddeo', 'Ti ho lasciato un biglietto sotto la porta della bottega. Leggilo e brucialo.'],
      ['taddeo', 'Mariella stanotte ha dormito. Non so se ringraziare te o lei.'],
      ['taddeo', 'Ho trovato le carte della guardia. Dove sta il prossimo guardiano, te lo segno io.'],
    ]),
    accusato: Object.freeze([ // nuovo
      ['didascalia', 'Taddeo vede Ferruccio e abbassa lo sguardo. Si allontana senza una parola.'],
      ['taddeo', 'Non ti avvicinare. Ho da fare.'],
      ['didascalia', 'Taddeo fruga fra le carte della guardia. Quando Ferruccio passa, le nasconde sotto il mantello.'],
    ]),
  }),
  diario: Object.freeze({
    lettera: Object.freeze([ // nuovo: la lettera di Agnese (la bibbia la nomina, non ne dà il testo)
      'Tonino mi ha ridato una lettera. È di Agnese, scritta prima della notte immobile. La copio qui per non perderla:',
      '«Ferruccio, ti scrivo perché a voce ridi e non mi lasci finire.',
      'Alla manifattura tessiamo una seta strana, per Donna Luciana. I fili si scaldano quando penso a te. Non ridere.',
      'Se una notte non mi riconosci, o io non riconosco te, cercami al telaio. Avrò in mano la stessa sciarpa.',
      'Il rosso protegge dal malocchio. Io non ci credo. Però con te non si sa mai. — A.»',
    ]),
    taddeo: Object.freeze({ // nuovo
      perdonato: 'Ho rinfoderato la spada davanti a Taddeo. Non so se l\'ho perdonato o se ero soltanto stanco.',
      accusato: 'Ho puntato la spada alla gola di Taddeo. Non l\'ho ucciso. Non so se sia peggio.',
    }),
    agnese: Object.freeze({ // nuovo
      risvegliata: 'Agnese ricorda. Insieme al mio nome le è tornato anche tutto il resto.',
      sognante: 'Ho lasciato Agnese al suo telaio. Sorrideva. Io no.',
    }),
  }),
  // finale vero (bibbia §IV «Il destino di Agnese», §V «Il destino finale di Taddeo»)
  finale: Object.freeze({
    uccisa: Object.freeze({
      agneseRisvegliata: 'Agnese riconosce immediatamente Ferruccio tra la folla. Vederlo con la spada davanti al corpo della benefattrice la sconvolge.',
      agneseSognante: 'Il Velo si spezza e Agnese recupera ogni ricordo. Lo riconosce soltanto adesso, con la spada davanti al corpo della benefattrice.', // adattato
      agneseAma: 'Fermati! Non voglio perderti un\'altra volta!',
      agneseAmaDid: 'Agnese tenta di fermarlo per costringerlo a consegnarsi alle guardie. Ferruccio deve scattare oltre di lei.',
      agneseAccusa: 'Hai liberato tutti. Ma chi ti ha dato il diritto di decidere chi deve morire?',
      taddeoPerdonato: 'Una volta ti ho consegnato per paura. Stavolta vieni con me di tua volontà!',
      taddeoAccusato: 'Taddeo partecipa apertamente alla caccia, usando la colpa di Ferruccio per distogliere l\'attenzione dalla propria.', // adattato
    }),
    risparmiata: Object.freeze({
      agneseRisvegliata: 'A San Leucio, quando Ferruccio le passa davanti, Agnese si tocca istintivamente il polso, proprio come faceva lui.',
      agneseSognante: 'A San Leucio, Agnese continua semplicemente a tessere.',
      agneseUltima: 'Devo finire una sciarpa. Sento che qualcuno verrà a prenderla.',
      taddeoPerdonato: 'Taddeo continua a essere una guardia. Ricorda a tratti di aver tradito qualcuno, ma il Velo gli impedisce di sostenerne il peso.',
      taddeoAccusato: 'Taddeo continua a essere una guardia. Quando incrocia Ferruccio, abbassa lo sguardo.', // nuovo (§XIV, principio 4)
    }),
  }),
});

// ===========================================================================
// 3. STATO E ACCESSO A T4
// ===========================================================================
const h1 = { filoPendente: 0, ripeti: {}, ultimoPianoHub: null };

const apiH1 = () => (window.__teatro && window.__teatro.h1api) || null;
const qaT4H1 = () => (window.__teatro && window.__teatro.t4qa) || null;
/** Flag di trama dello slot (copia). */
function flagH1() { const q = qaT4H1(); return q ? q.flag : {}; }
/** Scrive flag di trama nello slot (T4 li salva). */
function impostaFlagH1(parz) { const q = qaT4H1(); if (q) q.impostaFlag(parz); }
function dialogoApertoH1() { const a = apiH1(); return Boolean(a && a.aperto()); }
function notteH1() { try { return getNumeroNotte(); } catch (_) { return statoRun.numeroNotte || 1; } }

/**
 * Apre un cartiglio di T4 con righe [chi, testo]. `scelta` = { opzioni: [{valore, etichetta}], alScegliere }.
 * @returns {boolean} false se T4 manca
 */
function apriH1(righe, { scelta = null, poi = null } = {}) {
  const a = apiH1();
  if (!a) return false;
  const voci = righe.map(([chi, testo]) => a.voce(chi, testo));
  const sc = scelta ? { ancoraggio: 'h1', ordine: 0, scelta: { flag: null, opzioni: scelta.opzioni, alScegliere: scelta.alScegliere } } : null;
  a.apri(voci, { scelta: sc, poi });
  return true;
}

/** true se il piano dato (o quello corrente) è San Leucio: solo lì esiste il telaio. */
function pianoÈSanLeucioH1(piano) {
  try { return getQuartierePiano(piano || statoRun.piano).id === CONFIG_H1.quartiere; } catch (_) { return false; }
}

const giocaH1 = (id) => statoRun.personaggioId === id;

/** Lettera A-D del percorso di Agnese, o null se manca una delle due scelte. */
function percorsoH1(f = flagH1()) {
  if (!f.agnese || !f.taddeo) return null;
  if (f.agnese === 'risvegliata') return f.taddeo === 'perdonato' ? 'A' : 'B';
  return f.taddeo === 'perdonato' ? 'C' : 'D';
}

/** Condizione della scelta su Agnese: aver battuto il guardiano di San Leucio almeno una volta. */
function sceltaAgneseDisponibileH1(f = flagH1()) {
  if (f.agnese) return false;
  if (f.h1_leucio) return true;
  try {
    if (typeof statoA6 === 'function') return statoA6().boss.some((b) => CONFIG_H1.bossLeucio.includes(b && b.id ? b.id : b));
  } catch (_) { /* a6 assente */ }
  return false;
}

// ===========================================================================
// 4. GENERAZIONE: il Telaio è una foglia attaccata a una stanza normale
// ===========================================================================
/**
 * Appende alla mappa del piano la stanza del telaio (deterministica: nessuna estrazione dal seme).
 * Prima prova un vicolo cieco, poi una cella che tocca solo stanze ammesse.
 * @returns {object|null} la stanza aggiunta
 */
function aggiungiTelaioH1(m, piano) {
  if (!m || !pianoÈSanLeucioH1(piano) || m.stanze.some((s) => s.tipo === CONFIG_H1.tipoStanza)) return null;
  const G = MAPPA_PIANO;
  const key = (x, y) => `${x},${y}`;
  const griglia = new Map(m.stanze.filter((s) => s.cx >= 1 && s.cy >= 1).map((s) => [key(s.cx, s.cy), s]));
  const dentro = (x, y) => x >= 1 && x <= G.larghezza && y >= 1 && y <= G.altezza;
  for (const soloCieco of [true, false]) {
    for (const g of m.stanze.filter((s) => CONFIG_H1.genitori.includes(s.tipo))) {
      for (const d of DIREZIONI_A3) {
        const nx = g.cx + d.dx, ny = g.cy + d.dy;
        if (!dentro(nx, ny) || griglia.has(key(nx, ny))) continue;
        if (g.porte[d.lato] || (g.muroSegreto && g.muroSegreto.lato === d.lato)) continue;
        const vicini = DIREZIONI_A3.map((d2) => griglia.get(key(nx + d2.dx, ny + d2.dy))).filter(Boolean);
        if (vicini.some((v) => CONFIG_H1.maiAccantoA.includes(v.tipo))) continue;
        if (soloCieco && vicini.length !== 1) continue;
        const s = creaStanzaA3(`r${m.stanze.length}`, CONFIG_H1.tipoStanza, nx, ny);
        g.porte[d.lato] = s.id;
        s.porte[d.opposto] = g.id;
        s.telaioH1 = { visto: false };
        m.stanze.push(s);
        m.perId.set(s.id, s);
        return s;
      }
    }
  }
  return null;
}

// ===========================================================================
// 5. LE SCENE DEL TELAIO
// ===========================================================================
function righeLetteraH1(f) { return f.lettera_agnese === 'vera' ? [TESTI_H1.telaio.lettera] : []; }

/** Il dono della notte (una volta per notte): a notti alterne una cura o un filo di seta. */
function donoH1(f, conRiga = true) {
  const n = notteH1();
  if (f.h1_dono_notte === n) return [];
  impostaFlagH1({ h1_dono_notte: n });
  if (n % 2 === 0) {
    statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + CONFIG_H1.dono.curaHalf);
    return conRiga ? [TESTI_H1.telaio.donoCura] : [];
  }
  h1.filoPendente += CONFIG_H1.dono.filoScudi;
  return conRiga ? [TESTI_H1.telaio.donoFilo] : [];
}

/** Righe della scena A-D (o neutra) dopo la scelta su Agnese; segna la scena A-D vista. */
function esitoAgneseH1(f) {
  const p = percorsoH1(f);
  if (p) { impostaFlagH1({ h1_esito: p }); return TESTI_H1.esiti[p].slice(); }
  return (f.agnese === 'risvegliata' ? TESTI_H1.esiti.neutroRisvegliata : TESTI_H1.esiti.neutroSognante).slice();
}

/** La scelta su Agnese (flag `agnese`). */
function apriSceltaAgneseH1(righe) {
  return apriH1(righe, { scelta: {
    opzioni: [{ valore: 'risvegliata', etichetta: TESTI_H1.scelta.risveglia }, { valore: 'sognante', etichetta: TESTI_H1.scelta.sogna }],
    alScegliere: (v) => {
      impostaFlagH1({ agnese: v, h1_agnese_notte: notteH1() });
      apriH1(esitoAgneseH1(flagH1()));
    },
  } });
}

/** Parla con Agnese al telaio (o guarda il telaio vuoto, giocando con lei). */
function parlaTelaioH1(st) {
  const f = flagH1();
  if (giocaH1('agnese')) return apriH1(TESTI_H1.telaio.giocataAgnese.slice());
  if (f.agnese === 'risvegliata') {
    if (!f.h1_esito && percorsoH1(f)) return apriH1(esitoAgneseH1(f)); // A/B arriva qui se si torna al telaio
    return apriH1(TESTI_H1.telaio.risvegliataVuoto.slice());
  }
  if (!f.h1_incontro) {
    impostaFlagH1({ h1_incontro: notteH1() });
    return apriH1(TESTI_H1.telaio.primo.concat(righeLetteraH1(f)));
  }
  if (sceltaAgneseDisponibileH1(f)) return apriSceltaAgneseH1(TESTI_H1.telaio.primaScelta.slice());
  if (f.agnese === 'sognante') {
    if (!f.h1_esito && percorsoH1(f)) return apriH1(esitoAgneseH1(f)); // C/D: il confronto è venuto dopo
    return apriH1(TESTI_H1.telaio.sognanteNotti.concat(donoH1(f)));
  }
  // notti prima della scelta: la sciarpa al collo, poi una variante a notte, e il dono
  if (!f.h1_sciarpa && f.h1_incontro !== notteH1()) {
    impostaFlagH1({ h1_sciarpa: true });
    return apriH1(TESTI_H1.telaio.sciarpa.concat(donoH1(f)));
  }
  if (st.telaioH1 && st.telaioH1.parlato) return apriH1([TESTI_H1.telaio.notti[notteH1() % TESTI_H1.telaio.notti.length]]);
  if (st.telaioH1) st.telaioH1.parlato = true;
  const L = TESTI_H1.telaio.notti;
  return apriH1([L[notteH1() % L.length]].concat(righeLetteraH1(f), donoH1(f)));
}

function vicinoTelaioH1() {
  return Math.hypot(player.x - CONFIG_H1.telaio.x, player.y - CONFIG_H1.telaio.y - 20) < CONFIG_H1.telaio.raggioParla;
}

/** Agnese è al telaio in questa notte? (non se giocata, non se risvegliata: allora è in piazza) */
function agneseAlTelaioH1(f = flagH1()) { return !giocaH1('agnese') && f.agnese !== 'risvegliata'; }

// ===========================================================================
// 6. IL CONFRONTO CON TADDEO
// ===========================================================================
/** Apre il confronto (una sola volta per slot: poi il flag `taddeo` è deciso). */
function apriConfrontoH1() {
  return apriH1(TESTI_H1.confronto.apertura.slice(), { scelta: {
    opzioni: [{ valore: 'perdonato', etichetta: TESTI_H1.scelta.perdona }, { valore: 'accusato', etichetta: TESTI_H1.scelta.accusa }],
    alScegliere: (v) => {
      impostaFlagH1({ taddeo: v, h1_taddeo_notte: notteH1() });
      try { ricalcolaStatistiche(); } catch (_) { /* fuori dalla run */ }
      apriH1(TESTI_H1.confronto[v].slice());
    },
  } });
}

function controllaConfrontoH1(st) {
  if (!st || st.tipo !== 'boss' || statoRun.fase !== 'in_gioco') return;
  if (!st.capitanoH1 && st.nemici.some((n) => n.bossId === CONFIG_H1.bossCapitano)) st.capitanoH1 = true;
  if (!st.pulita) return;
  const f = flagH1();
  if (pianoÈSanLeucioH1() && !f.h1_leucio) impostaFlagH1({ h1_leucio: true });
  if (!st.capitanoH1 || st.confrontoH1 || f.taddeo || giocaH1('taddeo')) return;
  if (statoRun.siparioAttivo || statoRun.pausa || dialogoApertoH1()) return;
  st.confrontoH1 = true;
  apriConfrontoH1();
}

// ===========================================================================
// 7. PIAZZA DANTE: Agnese sotto il portico, Taddeo
// ===========================================================================
/** Aggiorna le condizioni delle presenze del modello dell'hub (chi è giocato non c'è). */
function aggiornaPresenzeH1() {
  const a = apiH1();
  if (!a) return;
  const f = flagH1();
  for (const p of a.presenze) {
    if (p.id === 'agnese') p.quando = giocaH1('agnese') ? { agnese: '__mai__' } : { agnese: 'risvegliata' };
    if (p.id === 'taddeo') {
      p.quando = giocaH1('taddeo') ? { taddeo: '__mai__' } : { taddeo: '*' };
      const pos = CONFIG_H1.piazzaTaddeo[f.taddeo];
      if (pos) { p.c = pos.c; p.r = pos.r; }
    }
  }
}

function rigaAGiroH1(chiave, lista) {
  const i = (h1.ripeti[chiave] || 0) % lista.length;
  h1.ripeti[chiave] = i + 1;
  return lista[i];
}

/**
 * Gancio di T4 (interagisciNpc): quello che dicono Agnese e Taddeo in piazza.
 * @param {string} npc personaggio della presenza @returns {boolean} true se ha parlato
 */
function npcParlaH1(npc) {
  const f = flagH1();
  if (npc === 'agnese' && f.agnese === 'risvegliata') {
    if (!f.h1_esito && percorsoH1(f)) return apriH1(esitoAgneseH1(f));
    if (!f.h1_sciarpa_portico) { impostaFlagH1({ h1_sciarpa_portico: true }); return apriH1(TESTI_H1.portico.sciarpa.slice()); }
    const p = percorsoH1(f);
    const riga = rigaAGiroH1(`agnese:${p}`, p ? TESTI_H1.portico[p] : TESTI_H1.portico.neutro);
    const dono = donoPorticoH1(f);
    return apriH1([riga].concat(dono));
  }
  if (npc === 'taddeo' && (f.taddeo === 'perdonato' || f.taddeo === 'accusato')) {
    return apriH1([rigaAGiroH1(`taddeo:${f.taddeo}`, TESTI_H1.piazzaTaddeo[f.taddeo])]);
  }
  return false;
}

/** Sotto il portico il dono è sempre il filo (scudo nella prima stanza della notte), una volta per notte. */
function donoPorticoH1(f) {
  const n = notteH1();
  if (f.h1_dono_notte === n) return [];
  impostaFlagH1({ h1_dono_notte: n });
  h1.filoPendente += CONFIG_H1.dono.filoScudi;
  return [TESTI_H1.portico.dono];
}

// ===========================================================================
// 8. DISEGNO (a ombre; tele fuori schermo per ciò che non cambia)
// ===========================================================================
let telaTelaioH1 = null;
function telaioCanvasH1() {
  if (telaTelaioH1) return telaTelaioH1;
  const c = document.createElement('canvas');
  c.width = 200; c.height = 150;
  const g = c.getContext('2d');
  const scuro = '#120a08', lanterna = '#f9cb40', legno = '#2a1a10';
  g.lineJoin = 'round';
  // basamento e montanti
  g.fillStyle = scuro; g.strokeStyle = lanterna; g.lineWidth = 2;
  const rett = (x, y, w, h) => { g.fillRect(x, y, w, h); g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); };
  rett(18, 18, 12, 120); rett(170, 18, 12, 120);   // montanti
  rett(10, 10, 180, 12);                            // trave alta
  rett(24, 118, 152, 10);                           // subbio basso
  rett(8, 134, 184, 10);                            // basamento
  // ordito: fili di seta chiari
  g.strokeStyle = 'rgba(254, 240, 200, 0.55)'; g.lineWidth = 1;
  for (let x = 38; x <= 162; x += 5) { g.beginPath(); g.moveTo(x, 22); g.lineTo(x, 118); g.stroke(); }
  // pettine (licci)
  g.fillStyle = legno; g.strokeStyle = lanterna; g.lineWidth = 1.5;
  g.fillRect(32, 58, 136, 6); g.strokeRect(32.5, 58.5, 135, 5);
  // ruota laterale (quella che Ferruccio urta)
  g.strokeStyle = lanterna; g.lineWidth = 2; g.fillStyle = scuro;
  g.beginPath(); g.arc(188, 92, 11, 0, Math.PI * 2); g.fill(); g.stroke();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    g.beginPath(); g.moveTo(188, 92); g.lineTo(188 + Math.cos(a) * 10, 92 + Math.sin(a) * 10); g.stroke();
  }
  // gigli d'oro sulla trave (la seta è della Signora)
  g.fillStyle = '#d4a017';
  for (const x of [60, 100, 140]) { g.beginPath(); g.moveTo(x, 12); g.lineTo(x - 3, 19); g.lineTo(x, 17); g.lineTo(x + 3, 19); g.closePath(); g.fill(); }
  telaTelaioH1 = c;
  return c;
}

/** La sciarpa rossa sulla trama: `quota` = parte tessuta (0..1). */
function disegnaSciarpaH1(x, y, quota, t) {
  const h = 92 * Math.max(0.1, Math.min(1, quota));
  ctx.fillStyle = '#8b1a12';
  ctx.fillRect(x - 22, y + 118 - 20 - h, 44, h);
  ctx.fillStyle = '#b91c1c';
  for (let yy = y + 118 - 20 - h + 3; yy < y + 98; yy += 6) ctx.fillRect(x - 22, yy, 44, 2);
  if (quota < 1) { // il filo che va e viene
    const fx = x - 22 + ((Math.sin(t * 0.05) + 1) / 2) * 44;
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx, y + 98 - h); ctx.lineTo(fx, y + 98 - h - 18); ctx.stroke();
  }
}

/** La stanza del telaio: telaio, sciarpa, Agnese (o il telaio vuoto). */
function disegnaTelaioH1(st, t) {
  const T = CONFIG_H1.telaio;
  const f = flagH1();
  const img = SPRITE_H1.telaio && typeof getSpriteTeatro === 'function' ? getSpriteTeatro(SPRITE_H1.telaio) : null;
  // pavimento di seta: un tappeto scuro con bordo rosso
  ctx.fillStyle = 'rgba(40, 10, 8, 0.45)'; ctx.fillRect(T.x - 120, T.y + 50, 240, 70);
  ctx.strokeStyle = 'rgba(185, 28, 28, 0.6)'; ctx.lineWidth = 2; ctx.strokeRect(T.x - 116, T.y + 54, 232, 62);
  if (img) ctx.drawImage(img, T.x - 100, T.y - 75, 200, 150);
  else ctx.drawImage(telaioCanvasH1(), T.x - 100, T.y - 75);
  const quota = giocaH1('agnese') ? 0.5 : f.agnese === 'sognante' ? 1 : f.agnese === 'risvegliata' ? 0.85 : 0.82 + 0.06 * Math.sin(t * 0.01);
  disegnaSciarpaH1(T.x, T.y - 75, quota, t);
  if (agneseAlTelaioH1(f) && PERSONAGGI_GIOCABILI.agnese) {
    const A = CONFIG_H1.agnese;
    try {
      disegnaFerruccioPittorico(ctx, A.x, A.y, { scale: 0.9, tick: t, charInfo: PERSONAGGI_GIOCABILI.agnese, flipX: true, sinergie: {} });
    } catch (err) { console.error('[h1] Agnese', err); }
  }
  if (statoRun.fase === 'in_gioco' && !dialogoApertoH1() && vicinoTelaioH1()) {
    drawPillLabel(giocaH1('agnese') ? TESTI_H1.agneseGiocata : TESTI_H1.avvicinati, T.x, T.y - 92, 220, { size: 8, color: '#ffffff', border: '#f9cb40' });
  }
}

/** Cornice di filo rosso sulla porta che porta al telaio. */
function disegnaPorteTelaioH1(st) {
  if (!statoRun.mappa || typeof PORTE_A3 === 'undefined') return;
  for (const [lato, id] of Object.entries(st.porte || {})) {
    const dest = statoRun.mappa.perId.get(id);
    const p = PORTE_A3[lato];
    if (!p || !dest || dest.tipo !== CONFIG_H1.tipoStanza) continue;
    ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 2;
    ctx.strokeRect(p.x - p.w / 2 - 2, p.y - p.h / 2 - 2, p.w + 4, p.h + 4);
    if (st.pulita) drawTextFit(TESTI_H1.segno, p.x, p.y + 4, p.w - 4, { size: 11, color: '#fecaca' });
  }
}

/** Minimappa: la cella del telaio; con Taddeo perdonato, la stanza del guardiano segnata in anticipo. */
function minimappaH1(st) {
  const m = statoRun.mappa;
  if (!m || !st || (typeof maledizioneD === 'function' && maledizioneD('mappa'))) return;
  const cell = 12, x0 = W - 118, y0 = 24, mw = 114, mh = 92;
  const eff = EFFETTI_H1.taddeo[flagH1().taddeo];
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - 5, y0 - 15, mw - 2, mh - 2); ctx.clip();
  for (const s of m.stanze) {
    const px = x0 + (s.cx - 1) * cell, py = y0 + (s.cy - 1) * cell;
    if (s.tipo === CONFIG_H1.tipoStanza && s.visitata) {
      const corr = st.id === s.id;
      ctx.fillStyle = corr ? '#f9cb40' : '#7f1d1d';
      ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
      drawTextFit(TESTI_H1.segno, px + cell / 2, py + cell - 2.5, cell - 2, { size: 8, color: corr ? '#0a0604' : '#fecaca', shadow: false });
    } else if (s.tipo === 'boss' && !s.visitata && eff && eff.bossSegnato && statoRun.fase === 'in_gioco') {
      ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 1.5, py + 1.5, cell - 3, cell - 3);
    }
  }
  ctx.restore();
}

// ===========================================================================
// 9. AVVOLGIMENTI (chiamano sempre la base)
// ===========================================================================
const generaMappaPianoBaseH1 = generaMappaPiano;
generaMappaPiano = function generaMappaPianoH1(piano, ...resto) {
  const m = generaMappaPianoBaseH1.call(this, piano, ...resto);
  try { if (m) aggiungiTelaioH1(m, piano); } catch (err) { console.error('[h1] generazione', err); }
  return m;
};

const entraInStanzaBaseH1 = entraInStanza;
entraInStanza = function entraInStanzaH1(stanza, ...resto) {
  const r = entraInStanzaBaseH1.call(this, stanza, ...resto);
  try {
    if (stanza && statoRun.stanzaCorrente === stanza) {
      if (stanza.tipo === CONFIG_H1.tipoStanza) { stanza.nemici.length = 0; stanza.pulita = true; }
      else if (h1.filoPendente > 0 && !stanza.pulita) { // il filo di Agnese para un colpo in questa stanza
        statoRun.scudoStanzaD = (statoRun.scudoStanzaD || 0) + h1.filoPendente;
        h1.filoPendente = 0;
      }
    }
  } catch (err) { console.error('[h1] ingresso', err); }
  return r;
};

const interagisciStanzaBaseH1 = interagisciStanza;
interagisciStanza = function interagisciStanzaH1(...args) {
  try {
    const st = statoRun.stanzaCorrente;
    if (st && st.tipo === CONFIG_H1.tipoStanza && !statoRun.scambioPendente && !statoRun.pannelloB && !statoRun.siparioAttivo
      && !dialogoApertoH1() && vicinoTelaioH1()) { parlaTelaioH1(st); return undefined; }
  } catch (err) { console.error('[h1] telaio', err); }
  return interagisciStanzaBaseH1.apply(this, args);
};

const passoLogicoBaseH1 = passoLogico;
passoLogico = function passoLogicoH1(...args) {
  try {
    if (statoRun.fase === 'hub') aggiornaPresenzeH1();
    else if (statoRun.fase === 'in_gioco') {
      const st = statoRun.stanzaCorrente;
      controllaConfrontoH1(st);
      const eff = EFFETTI_H1.taddeo[flagH1().taddeo];
      if (st && eff && eff.moltVitaGuardie !== 1) {
        for (const n of st.nemici) {
          if (n.guardiaH1 || n.boss || n.tipo !== 'guardia' || !(n.hp > 0)) continue;
          n.guardiaH1 = true;
          n.hp = Math.round(n.hp * eff.moltVitaGuardie);
          if (n.maxHp) n.maxHp = Math.round(n.maxHp * eff.moltVitaGuardie);
        }
      }
    }
  } catch (err) { console.error('[h1] logica', err); }
  return passoLogicoBaseH1.apply(this, args);
};

const ricalcolaStatisticheBaseH1 = ricalcolaStatistiche;
ricalcolaStatistiche = function ricalcolaStatisticheH1(...args) {
  const r = ricalcolaStatisticheBaseH1.apply(this, args);
  try {
    const eff = EFFETTI_H1.taddeo[flagH1().taddeo];
    if (eff && !giocaH1('taddeo')) statoRun.dmg = Math.max(1, statoRun.dmg * eff.moltDanno);
  } catch (err) { console.error('[h1] statistiche', err); }
  return r;
};

const disegnaStanzaPixelArtBaseH1 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function disegnaStanzaPixelArtH1(t, st, ...resto) {
  const r = disegnaStanzaPixelArtBaseH1.call(this, t, st, ...resto);
  if (!st) return r;
  try {
    if (st.tipo === CONFIG_H1.tipoStanza) disegnaTelaioH1(st, t);
    disegnaPorteTelaioH1(st);
  } catch (err) { console.error('[h1] resa', err); }
  return r;
};

const disegnaHUDPixelArtBaseH1 = disegnaHUDPixelArt;
disegnaHUDPixelArt = function disegnaHUDPixelArtH1(st, ...resto) {
  const r = disegnaHUDPixelArtBaseH1.call(this, st, ...resto);
  try { minimappaH1(st); } catch (err) { console.error('[h1] minimappa', err); }
  return r;
};

// --- Diario (b8): la lettera per intero, una riga per ciascuna scelta, una volta sola ---
if (typeof componiPaginaB8 === 'function') {
  const componiPaginaB8BaseH1 = componiPaginaB8;
  componiPaginaB8 = function componiPaginaH1(...args) {
    const p = componiPaginaB8BaseH1.apply(this, args);
    try {
      if (!p || !Array.isArray(p.righe)) return p;
      const f = flagH1();
      const extra = [];
      const nuovi = {};
      if (f.lettera_agnese === 'vera' && !f.h1_diario_lettera) { extra.push(...TESTI_H1.diario.lettera); nuovi.h1_diario_lettera = true; }
      if (f.taddeo && TESTI_H1.diario.taddeo[f.taddeo] && !f.h1_diario_taddeo) { extra.push(TESTI_H1.diario.taddeo[f.taddeo]); nuovi.h1_diario_taddeo = true; }
      if (f.agnese && TESTI_H1.diario.agnese[f.agnese] && !f.h1_diario_agnese) { extra.push(TESTI_H1.diario.agnese[f.agnese]); nuovi.h1_diario_agnese = true; }
      if (extra.length) {
        p.righe.splice(Math.max(0, p.righe.length - 1), 0, ...extra); // prima della chiusa
        impostaFlagH1(nuovi);
      }
    } catch (err) { console.error('[h1] diario', err); }
    return p;
  };
}

// --- Finale vero (b8): il destino di Agnese e di Taddeo nei due rami ---
if (typeof contestoFinaleB8 === 'function' && typeof condizioneB8 === 'function' && typeof FINALE_B8 === 'object') {
  const contestoFinaleB8BaseH1 = contestoFinaleB8;
  contestoFinaleB8 = function contestoFinaleH1(...args) {
    const cx = contestoFinaleB8BaseH1.apply(this, args);
    try {
      const f = flagH1();
      cx.agneseH1 = f.agnese || null;
      cx.taddeoH1 = giocaH1('taddeo') ? null : (f.taddeo || null);
      cx.agneseGiocataH1 = giocaH1('agnese');
    } catch (_) { /* T4 assente */ }
    return cx;
  };
  const condizioneB8BaseH1 = condizioneB8;
  condizioneB8 = function condizioneH1(se, cx, ...resto) {
    if (typeof se === 'string' && se.startsWith('h1:')) {
      const agnOk = !cx.agneseGiocataH1;
      switch (se) {
        case 'h1:agneseRisvegliata': return agnOk && cx.agneseH1 === 'risvegliata';
        case 'h1:agneseNonRisvegliata': return agnOk && cx.agneseH1 !== 'risvegliata';
        case 'h1:agneseAma': return agnOk && cx.taddeoH1 !== 'accusato';      // decisione aperta: «compromesso» = Taddeo accusato
        case 'h1:agneseAccusa': return agnOk && cx.taddeoH1 === 'accusato';
        case 'h1:taddeoPerdonato': return cx.taddeoH1 === 'perdonato';
        case 'h1:taddeoAccusato': return cx.taddeoH1 === 'accusato';
        case 'h1:agnese': return agnOk;
        default: return false;
      }
    }
    return condizioneB8BaseH1.call(this, se, cx, ...resto);
  };
  try {
    const R = FINALE_B8.vero.rami;
    const U = TESTI_H1.finale.uccisa, P = TESTI_H1.finale.risparmiata;
    const did = (testo, se) => Object.freeze({ chi: 'didascalia', testo, se });
    const bat = (chi, testo, se) => Object.freeze({ chi, testo, se });
    const folla = R.uccisa.find((s) => s.id === 'folla');
    if (folla && !Object.isFrozen(folla.battute)) {
      const i = folla.battute.findIndex((b) => b.set && b.set.fuga);
      folla.battute.splice(i < 0 ? folla.battute.length : i, 0,
        did(U.agneseRisvegliata, 'h1:agneseRisvegliata'), did(U.agneseSognante, 'h1:agneseNonRisvegliata'),
        did(U.agneseAmaDid, 'h1:agneseAma'), bat('Agnese', U.agneseAma, 'h1:agneseAma'),
        bat('Agnese', U.agneseAccusa, 'h1:agneseAccusa'),
        bat('Taddeo', U.taddeoPerdonato, 'h1:taddeoPerdonato'), did(U.taddeoAccusato, 'h1:taddeoAccusato'));
    }
    const grigia = R.risparmiata.find((s) => s.id === 'piazza-grigia');
    if (grigia && !Object.isFrozen(grigia.battute)) {
      grigia.battute.push(
        did(P.agneseRisvegliata, 'h1:agneseRisvegliata'), did(P.agneseSognante, 'h1:agneseNonRisvegliata'),
        bat('Agnese', P.agneseUltima, 'h1:agnese'),
        did(P.taddeoPerdonato, 'h1:taddeoPerdonato'), did(P.taddeoAccusato, 'h1:taddeoAccusato'));
    }
  } catch (err) { console.error('[h1] finali', err); }
}

Object.assign(window.__teatro ||= {}, { npcParlaH1 });

// --- sonda QA (tools/qa-teatro-agnese-taddeo.js) ---
window.__teatro.h1qa = {
  get filoPendente() { return h1.filoPendente; },
  percorso: () => percorsoH1(),
  sceltaDisponibile: () => sceltaAgneseDisponibileH1(),
  sanLeucio: (p) => pianoÈSanLeucioH1(p),
  telaio: () => (statoRun.mappa ? statoRun.mappa.stanze.find((s) => s.tipo === CONFIG_H1.tipoStanza) || null : null),
  vaiAlTelaio() { const s = this.telaio(); if (!s) return false; entraInStanza(s, null); player.x = CONFIG_H1.telaio.x; player.y = CONFIG_H1.telaio.y + 40; return true; },
  parla() { interagisciStanza(); return dialogoApertoH1(); },
  testi: TESTI_H1,
};
