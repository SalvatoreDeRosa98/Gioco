/*
 * teatro/h3-gregorio.js — Squadra h3: Gregorio, il Custode della Reggia, e il Cortile d'Onore (bibbia §VII, §XVI sc. 1).
 *
 *   - IL CORTILE D'ONORE: al piano 4 di ogni ciclo (la Reggia con le torce) la stanza della catena principale
 *     subito prima del boss diventa il Cortile (resta tipo 'normale' per il generatore: st.cortileH3). Notte,
 *     poche luci calde, colonnato e balcone dipinti; Gregorio sbarra la porta della Signora.
 *   - IL CONFRONTO: la prima volta nello slot, cartiglio di T4 con la scelta a due risposte che decide il flag
 *     `gregorio` ('dialogo' | 'attacco', storia.json reggia.scelta-gregorio). Senza prove (prove≠vera: registro
 *     bruciato e Taddeo accusato) la prima risposta è «cerca le prove nella giubba»: non trova niente e vale
 *     'attacco' (storia.json reggia.attacco-senza-prove). Le notti dopo: niente scelta, la conseguenza in breve.
 *   - ATTACCO: mezzo-boss «Gregorio, il Custode» con barra e nome, due fasi, IA a stati con tabella esplicita
 *     (STATI_H3): spazzata d'alabarda, carica di spalla, mazzo di chiavi che chiama le Guardie di Piombo,
 *     in fase 2 l'esitazione (abbassa l'alabarda, una forza la rialza). Poi la morte del Custode.
 *   - DIALOGO: niente scontro (GREGORIO_H3.dialogoSenzaScontro; false = come la bibbia, si combatte lo stesso):
 *     il Custode tiene giù l'alabarda contro il giglio, confessa, lascia il mazzo di chiavi (una chiave) e
 *     il punto debole della Signora; poi muore.
 *   - CONSEGUENZE su Donna Luciana: 'attacco' → più rabbia (spara e muove le Mani più spesso), niente guardie;
 *     'dialogo' → le guardie ci sono (lei sa che arrivi), ma la prima fase prende più danno (il giglio).
 *
 * Agganci altrui: t4-hub-storia.js (T.dialogoH3 = apriDialogo e voce). Il resto avvolge function globali:
 * generaMappaPiano, entraInStanza, verificaStanzaPulita, passoLogico, danneggiaNemico, disegnaStanzaPixelArt,
 * disegnaBossPittorico. Foglio facoltativo: assets/sprite_teatro/gregorio.png (7 celle in una riga, vedi FOGLIO_H3).
 * QA: tools/qa-teatro-gregorio.js. Sonda: window.__teatro.interni.gregorioH3.
 */

// ===========================================================================
// TABELLE (numeri). Tick a 60 Hz, distanze in px, velocità in px/tick.
// ===========================================================================
/** Valori di gioco del Cortile e del Custode. */
const GREGORIO_H3 = Object.freeze({
  pianoNelCiclo: 4,
  bossId: 'gregorio-custode',
  dialogoSenzaScontro: true, // decisione aperta per l'autore: la bibbia fa combattere anche dopo le prove
  hpBase: 300, // vita = hpBase × 1,45^(ciclo−1) (come i boss: 30-mappa.js popolaStanza)
  speed: 0.55,
  raggio: 17,
  distanzaPorta: 46, // Gregorio sta a tanti px dalla porta della Signora
  sogliaFase2: 0.5,
  spazzata: Object.freeze({ portata: 70, apertura: 1.25, larghezzaLama: 0.34, durata: 16, durataFase2: 13 }),
  carica: Object.freeze({ velocita: 4.1, velocitaFase2: 4.8, maxTick: 60 }),
  chiavi: Object.freeze({ guardie: 2, guardieFase2: 2, maxGuardie: 3, hpGuardia: 26 }),
  durate: Object.freeze({
    avanza: 64, avanzaFase2: 44, alza: 34, alzaFase2: 26, riposo: 34, riposoFase2: 24,
    abbassa: 40, abbassaFase2: 30, stordito: 54, storditoFase2: 40, chiavi: 46, esita: 56, cambiaFase: 60,
  }),
  sequenza: Object.freeze(['spazzata', 'carica', 'spazzata', 'chiavi']),
  sequenzaFase2: Object.freeze(['carica', 'spazzata', 'esita', 'spazzata', 'carica', 'chiavi']),
  anime: Object.freeze({ numero: 14, durataTick: 150, salita: 0.9 }),
  bannerTick: 230,
});

/**
 * PROVE_H3 — le pagine del registro di Gaetano (bibbia §VII: «Ferruccio mostra il registro o il messaggio di
 * Taddeo»). Una pagina per piano nei piani `piani` del ciclo, in una stanza `normale` scelta alla prima occhiata
 * alla mappa (mai il Cortile, mai una stanza con i campi di altre squadre in `campiVietati`). Il conto sta in
 * statoRun.percorsoProveH3 (il prefisso «percorso» lo fa copiare all'istantanea di «Riprendi la notte», e6).
 */
const PROVE_H3 = Object.freeze({
  servono: 3,
  piani: Object.freeze([1, 2, 3]), // piani del ciclo con una pagina
  taddeo: 1, // prove che vale la testimonianza di Taddeo (flag taddeo = perdonato)
  raggioPresa: 16,
  campiVietati: /^(quadriD5|botoleD5|ternaD4|bucaD4|cortileH3|telaioH1|confrontoH1|capitanoH1|biancaH2|botolaH5|sagratoH6|premioH6|cancelloH6|campaneH6|condottoH7|mcH7|ritornoH4)$/,
  posti: Object.freeze([[320, 188], [250, 160], [390, 220], [200, 230], [440, 150]]),
});

/** Conseguenze sullo scontro con Donna Luciana. */
const LUCIANA_H3 = Object.freeze({
  bossId: 'donna-luciana',
  rabbiaOgniTick: 3, // 'attacco': ogni N tick un tick in più ai suoi tempi di sparo e delle Mani (+33%)
  guardieIngresso: 2, // 'dialogo': guardie all'ingresso
  guardieMeta: 2, // 'dialogo': altre guardie quando scende sotto metà vita
  puntoDebole: 1.4, // 'dialogo': danno × in prima fase
  sogliaPuntoDebole: 0.5,
  hpGuardia: 30,
});

/** Tabella esplicita degli stati del Custode: durata (chiave di GREGORIO_H3.durate), posa, stato seguente. */
const STATI_H3 = Object.freeze({
  inizio: 'avanza',
  stati: Object.freeze({
    avanza: Object.freeze({ durata: 'avanza', posa: 'cammina', poi: 'prossima' }),
    alza: Object.freeze({ durata: 'alza', posa: 'anticipo', poi: 'spazzata' }),
    spazzata: Object.freeze({ durata: null, posa: 'attacco', poi: 'riposo', ripeti: 'alza' }),
    abbassa: Object.freeze({ durata: 'abbassa', posa: 'anticipo', poi: 'carica' }),
    carica: Object.freeze({ durata: null, posa: 'attacco', poi: 'stordito' }),
    stordito: Object.freeze({ durata: 'stordito', posa: 'colpito', poi: 'riposo' }),
    chiavi: Object.freeze({ durata: 'chiavi', posa: 'anticipo', poi: 'riposo' }),
    esita: Object.freeze({ durata: 'esita', posa: 'ginocchio', poi: 'alza' }),
    riposo: Object.freeze({ durata: 'riposo', posa: 'fermo', poi: 'avanza' }),
    cambiaFase: Object.freeze({ durata: 'cambiaFase', posa: 'colpito', poi: 'chiavi' }),
  }),
  mosse: Object.freeze({ spazzata: 'alza', carica: 'abbassa', chiavi: 'chiavi', esita: 'esita' }),
});

/** Foglio PNG facoltativo: una riga di 7 celle uguali, nell'ordine delle pose. */
const FOGLIO_H3 = Object.freeze({
  nome: 'gregorio', presente: true, // il foglio dell'autore c'è dal 2026-11-12 (false: si disegna sul canvas, senza richieste a vuoto)
  altezza: 82, piedi: 1, // piedi: quanto sta sopra il fondo della cella la suola (nel foglio dell'autore quasi niente)
  pose: Object.freeze(['fermo', 'cammina', 'anticipo', 'attacco', 'colpito', 'aTerra', 'ginocchio']),
});

/** Colori «a ombre». */
const TINTE_H3 = Object.freeze({
  ombra: '#120b08', ombra2: '#1f140e', lanterna: '#f0b45a', oro: '#e8b84a', oroVivo: '#fff1b8',
  rosso: '#9e1b1b', rossoScuro: '#5c0f0f', azzurro: '#9fd8ff', notte: 'rgba(8, 10, 26, 0.38)',
});

/**
 * TESTI A SCHERMO. [bibbia] = parola per parola da trama/ferruccio-bibbia.md (Violante → Donna Luciana);
 * [storia] = da trama/storia.json; [nuovo] = da approvare dall'autore.
 */
const TESTI_H3 = Object.freeze({
  nome: 'Gregorio, il Custode della Reggia', // [nuovo] barra del mezzo-boss
  banner: Object.freeze({
    cortile: 'CORTILE D\'ONORE — Gregorio sbarra la porta della Signora.', // [nuovo]
    scontro: 'Il Custode solleva l\'alabarda: guardagli le spalle e il giglio.', // [nuovo]
    fase2: 'Il giglio sul petto del Custode lampeggia: la mano che lo tiene si fa più dura.', // [nuovo]
    via: 'Il Cortile è libero: la porta della Signora è aperta.', // [nuovo]
    dono: 'Il mazzo di chiavi del Custode: +1 chiave. E sai dove colpire Donna Luciana.', // [nuovo]
    lucianaRabbia: 'Il Custode è caduto: Donna Luciana combatte con rabbia. Nessuna guardia con lei.', // [nuovo]
    lucianaGuardie: 'Donna Luciana sa che arrivi: le guardie ti aspettano. Il giglio sul petto: lì passano i fili.', // [nuovo]
  }),
  ingresso: Object.freeze([
    ['didascalia', 'Cortile d\'Onore · Notte · Poche luci calde'], // [bibbia]
    ['didascalia', 'Davanti al portone dello scalone un vecchio in armatura sbarra la strada. Mantello rosso, chiavi alla cintura, un giglio d\'oro sul petto.'], // [nuovo]
  ]),
  scelta: Object.freeze({
    dialogo: 'Mostragli le prove', // [storia]
    senzaProve: 'Cerca le prove nella giubba', // [nuovo] (non più usata: vedi nonBastano)
    nonBastano: (n, k) => `Le prove non bastano (${n} su ${k})`, // [nuovo]
    attacco: 'Attacca il Custode', // [storia]
  }),
  senzaProve: Object.freeze([
    ['didascalia', 'Le mani di Ferruccio cercano nella giubba qualcosa che non c\'è. Poi stringono la spada.'], // [storia, sommario]
  ]),
  attacco: Object.freeze([
    ['didascalia', 'Gregorio solleva immediatamente l\'alabarda.'], // [bibbia]
    ['gregorio', 'Un altro figlio viene a chiedermi conto dei padri.'], // [bibbia]
    ['didascalia', 'Il combattimento comincia.'], // [bibbia]
  ]),
  dialogo: Object.freeze([
    ['didascalia', 'Ferruccio mostra il registro o il messaggio di Taddeo.'], // [bibbia]
    ['didascalia', 'Gregorio si ferma per un istante.'], // [bibbia]
    ['gregorio', 'Gaetano...'], // [bibbia]
    ['gregorio', 'Gli abbiamo fatto un torto terribile.'], // [bibbia]
    ['didascalia', 'Poi il giglio si illumina.'], // [bibbia]
    ['gregorio', 'Va\' via. Prima che mi faccia ucciderti.'], // [bibbia]
  ]),
  dialogoCombatte: Object.freeze([['didascalia', 'Il combattimento comincia.']]), // [bibbia]
  dialogoResiste: Object.freeze([
    ['didascalia', 'Ferruccio non va via. Resta fermo, la spada bassa.'], // [nuovo]
    ['didascalia', 'Il Custode pianta l\'alabarda nel selciato e la tiene giù con tutte e due le mani. Il giglio lampeggia, una volta, due volte.'], // [nuovo]
    ['gregorio', 'Il giglio che porta lei, sul petto. Lì passano i fili. Colpisci lì, prima che ti veda stanco.'], // [nuovo] il dono: l'informazione
    ['didascalia', 'Gregorio stacca dalla cintura il mazzo di chiavi e lo lascia cadere ai piedi di Ferruccio.'], // [nuovo] il dono: la chiave
  ]),
  morte: Object.freeze([
    ['didascalia', 'Al termine dello scontro, l\'armatura si spezza. Gregorio cade sulle ginocchia.'], // [bibbia]
    ['didascalia', 'L\'alabarda tocca il pavimento con un rumore metallico.'], // [bibbia]
    ['didascalia', 'Il giglio sul suo petto si incrina, poi si spezza.'], // [bibbia]
    ['didascalia', 'Dall\'armatura esce una piccola luce azzurra.'], // [bibbia]
    ['didascalia', 'Per la prima volta, dietro l\'elmo, c\'è un volto umano.'], // [bibbia, adattata: «il giocatore vede…»]
    ['gregorio', 'Non era un ordine del Re...'], // [bibbia]
    ['gregorio', 'Era una promessa fatta a mia moglie.'], // [bibbia]
    ['?', ''], // segnaposto: la riga che dipende dal flag (TESTI_H3.morteSe)
    ['gregorio', 'Ho protetto la porta per tutta la vita...'], // [bibbia]
    ['gregorio', 'E non ho visto cosa entrava.'], // [bibbia]
    ['didascalia', 'Gregorio tende una mano verso il balcone.'], // [bibbia]
    ['gregorio', 'Lei... crede ancora di poterla salvare.'], // [bibbia]
    ['didascalia', 'Gregorio muore e la sua anima sale lentamente verso il balcone.'], // [bibbia]
    ['didascalia', 'Ferruccio solleva lo sguardo.'], // [bibbia]
    ['didascalia', 'Donna Luciana è lì.'], // [bibbia]
    ['luciana', 'Gregorio?'], // [bibbia]
    ['luciana', 'Avevi promesso che saremmo rimasti insieme.'], // [bibbia]
    ['didascalia', 'Sul selciato resta il mantello rosso, vuoto, sopra l\'armatura.'], // [bibbia, adattata]
  ]),
  senzaScontro: ['didascalia', 'L\'armatura si spezza. Gregorio cade sulle ginocchia.'], // [bibbia, ridotta]
  morteSe: Object.freeze({
    dialogo: ['gregorio', 'Tuo padre era innocente.'], // [bibbia]
    attacco: ['gregorio', 'Anche io avevo paura di perderla.'], // [bibbia]
  }),
  // Le notti dopo la scelta: la conseguenza in breve.
  prove: Object.freeze({
    presa: (n, k) => `Pagina del registro di Gaetano (${n} di ${k})`, // [nuovo] banner
    contatore: (n, k) => `Prove ${n}/${k}`, // [nuovo] HUD
    taddeo: ' · Taddeo', // [nuovo] HUD: la testimonianza conta
    tutte: 'Il registro è completo: hai qualcosa da mostrare al Custode.', // [nuovo] banner alla terza
    conto: 'Prove del registro', // [nuovo] conto della notte (e6)
  }),
  diario: Object.freeze({ // [nuovo] una riga nel Diario di Ferruccio, la notte in cui ha incontrato il Custode
    attacco: 'Nel Cortile d\'Onore ho abbattuto il Custode. Sotto l\'elmo c\'era un vecchio.',
    dialogo: 'Nel Cortile d\'Onore il Custode ha abbassato l\'alabarda. Mi ha lasciato le sue chiavi.',
  }),
  registro: Object.freeze({ // [nuovo] scheda dei Primi attori (d3)
    battuta: '«Un altro figlio viene a chiedermi conto dei padri.»', // [bibbia]
    aneddoto: 'Custode della Reggia, rispettato dalle famiglie degli operai. Quando volle fermare sua moglie, lei lo legò al giglio d\'oro.', // [nuovo, dalla bibbia §VII]
  }),
  breveAttacco: Object.freeze([
    ['gregorio', 'Un altro figlio viene a chiedermi conto dei padri.'], // [bibbia]
  ]),
  breveAttaccoMorte: Object.freeze([
    ['didascalia', 'Gregorio cade in ginocchio. Il giglio si spezza.'], // [bibbia, ridotta]
    ['gregorio', 'Anche io avevo paura di perderla.'], // [bibbia]
    ['didascalia', 'Il Custode muore. Sul selciato resta il mantello rosso, vuoto.'], // [bibbia, ridotta]
  ]),
  breveDialogo: Object.freeze([
    ['didascalia', 'Ferruccio mostra le pagine del registro. Il Custode le riconosce prima ancora di leggerle, e pianta l\'alabarda.'], // [nuovo]
    ['gregorio', 'Gaetano...'], // [bibbia]
    ['gregorio', 'Il giglio, sul petto di lei. Va\'.'], // [nuovo]
    ['didascalia', 'Il mazzo di chiavi cade ai piedi di Ferruccio. Il giglio si spezza.'], // [nuovo]
    ['gregorio', 'Tuo padre era innocente.'], // [bibbia]
    ['didascalia', 'Il Custode muore. Sul selciato resta il mantello rosso, vuoto.'], // [bibbia, ridotta]
  ]),
});

// ===========================================================================
// STATO
// ===========================================================================
const h3 = { anime: [], tela: null, telaW: 0 };

const flagH3 = () => { try { return (window.__teatro && window.__teatro.t4qa && window.__teatro.t4qa.flag) || {}; } catch (_) { return {}; } };
function impostaFlagH3(parz) { try { const q = window.__teatro && window.__teatro.t4qa; if (q) q.impostaFlag(parz); } catch (err) { console.warn('[h3] flag', err); } }
const pncH3 = (piano) => ((Math.max(1, piano || 1) - 1) % 4) + 1;

/** true se Ferruccio ha qualcosa da mostrare al Custode (storia.json: prove = vera, o le sue due fonti). */
function haProveH3() { return proveH3() >= PROVE_H3.servono; }

/** Stato delle prove della notte in corso (si azzera a ogni notte e a ogni ciclo). */
function statoProveH3() {
  const ciclo = Math.floor((Math.max(1, statoRun.piano || 1) - 1) / 4) + 1;
  let P = statoRun.percorsoProveH3;
  if (!P || P.run !== statoRun.numeroRun || P.ciclo !== ciclo) {
    P = statoRun.percorsoProveH3 = { run: statoRun.numeroRun, ciclo, prese: [] };
  }
  return P;
}

/** Prove della notte: pagine prese in questo ciclo + Taddeo perdonato; al massimo PROVE_H3.servono. */
function proveH3() {
  const P = statoProveH3();
  const t = flagH3().taddeo === 'perdonato' ? PROVE_H3.taddeo : 0;
  return Math.min(PROVE_H3.servono, P.prese.length + t);
}

/** Sceglie la stanza della pagina in una mappa del piano (una volta per mappa). */
function scegliPaginaH3(m, piano) {
  if (!m || m.paginaH3 !== undefined) return;
  m.paginaH3 = null;
  if (!PROVE_H3.piani.includes(pncH3(piano)) || !m.stanze.some((s) => s.tipo === 'boss')) return; // niente Sottopalco
  const ok = m.stanze.filter((s) => s.tipo === 'normale' && !Object.keys(s).some((k) => PROVE_H3.campiVietati.test(k)));
  if (!ok.length) return;
  const st = ok[Math.floor(rng() * ok.length)];
  const libero = ([x, y]) => !(st.ostacoli || []).some((o) => o && o.x != null && Math.hypot((o.x + (o.w || 0) / 2) - x, (o.y + (o.h || 0) / 2) - y) < 30);
  const [x, y] = PROVE_H3.posti.find(libero) || PROVE_H3.posti[0];
  st.paginaH3 = { x, y, piano };
  m.paginaH3 = st.id;
}

/** Ogni tick: la pagina si sceglie, compare a stanza pulita e si raccoglie passandoci sopra. */
function passoPagineH3(st) {
  const m = statoRun.mappa;
  scegliPaginaH3(m, statoRun.piano);
  const pg = st && st.paginaH3;
  if (!pg || !st.pulita) return;
  const P = statoProveH3();
  if (P.prese.includes(pg.piano)) return;
  if (Math.hypot(player.x - pg.x, player.y - pg.y) > PROVE_H3.raggioPresa) return;
  P.prese.push(pg.piano);
  const n = proveH3();
  try { AudioSys.playMoneta(); } catch (_) { /* audio facoltativo */ }
  mostraBanner(n >= PROVE_H3.servono ? `${TESTI_H3.prove.presa(P.prese.length, PROVE_H3.piani.length)} — ${TESTI_H3.prove.tutte}` : TESTI_H3.prove.presa(P.prese.length, PROVE_H3.piani.length), GREGORIO_H3.bannerTick);
}

/** Esito del Custode che vale per lo scontro con Donna Luciana: quello di questa run, altrimenti il flag. */
function esitoGregorioH3() {
  const r = statoRun.gregorioH3;
  if (r && r.run === statoRun.numeroRun && r.esito) return r.esito;
  return null;
}

function apriH3(righe, opz = {}) {
  const T = window.__teatro && window.__teatro.dialogoH3;
  if (!T) return false;
  T.apri(righe.map(([chi, testo]) => T.voce(chi, testo)), opz);
  return true;
}

// ===========================================================================
// 1. LA MAPPA: il Cortile sulla catena, subito prima del boss del piano 4
// ===========================================================================
/** Marca come Cortile la stanza che dà sul boss (piano 4 del ciclo). @returns {object|null} la stanza */
function marcaCortileH3(m, piano) {
  if (!m || pncH3(piano) !== GREGORIO_H3.pianoNelCiclo) return null;
  const boss = m.stanze.find((s) => s.tipo === 'boss');
  if (!boss) return null;
  const [lato, idPrec] = Object.entries(boss.porte)[0] || [];
  const prec = idPrec && m.stanze.find((s) => s.id === idPrec);
  if (!prec || prec.tipo !== 'normale') return null;
  const opp = { N: 'S', S: 'N', E: 'W', W: 'E' };
  prec.cortileH3 = { verso: opp[lato], fase: 'attesa', risolto: false, daAprire: true };
  prec.nemici = [];
  prec.ostacoli = [];
  prec.temaB7 = null;
  prec.muroSegreto = null;
  delete prec.canaliD6;
  delete prec.quadriD5; // niente cambio di scena né botole: il Cortile ha la sua scena
  delete prec.botoleD5;
  return prec;
}

const generaMappaPianoBaseH3 = generaMappaPiano;
generaMappaPiano = function (piano, ...resto) {
  const m = generaMappaPianoBaseH3.call(this, piano, ...resto);
  try { marcaCortileH3(m, piano); } catch (err) { console.error('[h3] mappa', err); }
  return m;
};

/** Punto davanti alla porta della Signora. */
function postoGregorioH3(C) {
  const d = GREGORIO_H3.distanzaPorta;
  if (C.verso === 'N') return { x: 320, y: ARENA.y1 + d };
  if (C.verso === 'S') return { x: 320, y: ARENA.y2 - d };
  if (C.verso === 'W') return { x: ARENA.x1 + d, y: 188 };
  return { x: ARENA.x2 - d, y: 188 };
}

// ===========================================================================
// 2. IL CONFRONTO
// ===========================================================================
const entraInStanzaBaseH3 = entraInStanza;
entraInStanza = function (stanza, daLato, ...resto) {
  const r = entraInStanzaBaseH3.call(this, stanza, daLato, ...resto);
  try {
    if (stanza && statoRun.stanzaCorrente === stanza) {
      if (stanza.cortileH3) {
        const C = stanza.cortileH3;
        if (!C.figura) C.figura = { ...postoGregorioH3(C), posa: 'fermo' };
        if (!C.risolto) mostraBanner(TESTI_H3.banner.cortile, GREGORIO_H3.bannerTick);
      } else if (stanza.tipo === 'boss' && !stanza.pulita) preparaLucianaH3(stanza);
    }
  } catch (err) { console.error('[h3] ingresso', err); }
  return r;
};

/** Apre la scena del Cortile (prima volta: scelta; notti dopo: la conseguenza in breve). */
function apriConfrontoH3(st) {
  const C = st.cortileH3;
  C.daAprire = false;
  const f = flagH3();
  C.breve = f.gregorio === 'attacco' || f.gregorio === 'dialogo'; // la scena intera solo la prima volta nello slot
  const n = proveH3(), k = PROVE_H3.servono;
  const opzioni = [
    n >= k ? { valore: 'dialogo', etichetta: TESTI_H3.scelta.dialogo } : { valore: 'senzaProve', etichetta: TESTI_H3.scelta.nonBastano(n, k) },
    { valore: 'attacco', etichetta: TESTI_H3.scelta.attacco },
  ];
  apriH3(C.breve ? [] : TESTI_H3.ingresso, { scelta: { ancoraggio: 'h3:cortile', ordine: 0,
    scelta: { flag: null, opzioni, alScegliere: (v) => sceltaH3(st, v) } } });
}

/** La scelta del Cortile, ogni notte. Il flag `gregorio` dello slot si scrive solo alla prima risoluzione. */
function sceltaH3(st, valore) {
  const C = st.cortileH3;
  const esito = valore === 'dialogo' ? 'dialogo' : 'attacco';
  if (!C.breve) impostaFlagH3({ gregorio: esito });
  C.esito = esito;
  if (esito === 'dialogo') {
    if (C.breve) {
      if (GREGORIO_H3.dialogoSenzaScontro) apriH3(TESTI_H3.breveDialogo, { poi: () => doniH3(st, 'dialogo') });
      else apriH3(TESTI_H3.breveAttacco, { poi: () => avviaScontroH3(st) });
    } else if (GREGORIO_H3.dialogoSenzaScontro) apriH3(TESTI_H3.dialogo.concat(TESTI_H3.dialogoResiste), { poi: () => avviaMorteH3(st) });
    else apriH3(TESTI_H3.dialogo.concat(TESTI_H3.dialogoCombatte), { poi: () => avviaScontroH3(st) });
    return;
  }
  const attacco = C.breve ? TESTI_H3.breveAttacco : TESTI_H3.attacco;
  const righe = valore === 'senzaProve' ? TESTI_H3.senzaProve.concat(attacco) : attacco;
  apriH3(righe, { poi: () => avviaScontroH3(st) });
}

// ===========================================================================
// 3. LO SCONTRO (mezzo-boss, due fasi)
// ===========================================================================
function nuovaGuardiaH3(st, x, y, hp, idx) {
  const p = typeof puntoLontanoDallePorteC === 'function'
    ? puntoLontanoDallePorteC(x, y, porteVietateC(st).concat([{ x: player.x, y: player.y }])) : { x, y };
  return { id: `h3-guardia-${tick}-${idx}`, tipo: 'guardia', patternMob: 'guardia', nome: 'Guardia di Piombo', ...p,
    vx: 0, vy: 0, r: 11, hp, maxHp: hp, speed: 0.98, shootCd: 50 + idx * 17, boss: false, flash: 6, burnTicks: 0,
    stunTicks: 0, state: 'idle', stateTimer: 20, maskOpen: false, guardiaH3: true };
}

/** Gregorio entra in scena come nemico (barra del boss, IA di questo file). */
function avviaScontroH3(st) {
  const C = st.cortileH3;
  const ciclo = Math.floor((statoRun.piano - 1) / 4) + 1;
  const hp = Math.round(GREGORIO_H3.hpBase * Math.pow(1.45, ciclo - 1));
  const p = C.figura || postoGregorioH3(C);
  C.fase = 'scontro';
  st.nemici.push({ id: `${st.id}-gregorio`, bossId: GREGORIO_H3.bossId, nome: ciclo > 1 ? `${TESTI_H3.nome} (Ciclo ${ciclo})` : TESTI_H3.nome,
    tipo: 'guardia', pattern: 'alabarda_custode', boss: true, mezzoBossH3: true, x: p.x, y: p.y, vx: 0, vy: 0, airZ: 0,
    hp, maxHp: hp, speed: GREGORIO_H3.speed, r: GREGORIO_H3.raggio, flash: 0, burnTicks: 0, stunTicks: 0, shootCd: 999,
    phaseTick: 0, state: 'idle', stateTimer: 0 });
  C.figura = null;
  mostraBanner(TESTI_H3.banner.scontro, GREGORIO_H3.bannerTick);
}

const valoreH3 = (chiave, f2) => {
  const D = GREGORIO_H3.durate;
  return f2 && D[chiave + 'Fase2'] != null ? D[chiave + 'Fase2'] : D[chiave];
};
const angoloAH3 = (n) => Math.atan2((player.y - 6) - (n.y - 6), player.x - n.x);
const diffAngH3 = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };

function entraStatoH3(n, stato, st) {
  const riga = STATI_H3.stati[stato];
  const f2 = Boolean(n.fase2H3);
  n.statoH3 = stato; n.tH3 = 0;
  n.timerH3 = riga.durata ? valoreH3(riga.durata, f2) : 1;
  const S = GREGORIO_H3.spazzata, K = GREGORIO_H3.carica;
  if (stato === 'alza') { n.angH3 = angoloAH3(n); if (n.ripetiH3 == null || n.ripetiH3 < 0) n.ripetiH3 = f2 ? 1 : 0; }
  else if (stato === 'spazzata') { n.versoH3 = (n.versoH3 || 1) * -1; n.timerH3 = f2 ? S.durataFase2 : S.durata; n.colpitoH3 = false; }
  else if (stato === 'abbassa') n.angH3 = angoloAH3(n);
  else if (stato === 'carica') { n.angH3 = angoloAH3(n); n.timerH3 = K.maxTick; }
  else if (stato === 'cambiaFase') { n.flash = 14; scuoti(FEEL.scossa.schiantoCapitano); statoRun.ondeEsplosione.push({ x: n.x, y: n.y - 12, r: 8, maxR: 60, tick: 0 }); }
  if (stato === 'riposo') n.ripetiH3 = -1;
  if (!st) return;
}

function prossimoStatoH3(n) {
  const riga = STATI_H3.stati[n.statoH3];
  if (riga.ripeti && n.ripetiH3 > 0) { n.ripetiH3--; return riga.ripeti; }
  if (riga.poi !== 'prossima') return riga.poi;
  const seq = n.fase2H3 ? GREGORIO_H3.sequenzaFase2 : GREGORIO_H3.sequenza;
  const mossa = seq[(n.indiceH3 || 0) % seq.length];
  n.indiceH3 = (n.indiceH3 || 0) + 1;
  return STATI_H3.mosse[mossa];
}

function chiamaGuardieH3(n, st) {
  const K = GREGORIO_H3.chiavi;
  const vive = st.nemici.filter((m) => !m.boss && m.hp > 0).length;
  const quante = Math.min(n.fase2H3 ? K.guardieFase2 : K.guardie, K.maxGuardie - vive);
  const ciclo = Math.floor((statoRun.piano - 1) / 4) + 1;
  for (let k = 0; k < quante; k++) {
    st.nemici.push(nuovaGuardiaH3(st, n.x + (k === 0 ? -64 : 64), n.y + 30, Math.round(K.hpGuardia * Math.pow(1.45, ciclo - 1)), k));
  }
  try { AudioSys.playCampana(); } catch (_) { /* audio facoltativo */ }
}

/** Un tick dell'IA del Custode (solo nei tick in cui la base ha fatto agire il boss). */
function iaGregorioH3(n, st) {
  if (!n.statoH3) { n.indiceH3 = 0; n.versoH3 = 1; entraStatoH3(n, STATI_H3.inizio, st); }
  if (!n.fase2H3 && n.hp < n.maxHp * GREGORIO_H3.sogliaFase2) {
    n.fase2H3 = true; n.ripetiH3 = -1;
    mostraBanner(TESTI_H3.banner.fase2, GREGORIO_H3.bannerTick);
    entraStatoH3(n, 'cambiaFase', st);
  }
  const f2 = n.fase2H3;
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const s = n.statoH3;
  if (s === 'avanza') {
    const a = Math.atan2(player.y - n.y, player.x - n.x);
    const v = n.speed * (f2 ? 1.3 : 1);
    n.x = lim(n.x + Math.cos(a) * v, ARENA.x1 + 20, ARENA.x2 - 20);
    n.y = lim(n.y + Math.sin(a) * v, ARENA.y1 + 20, ARENA.y2 - 20);
    // da vicino non aspetta: alza subito l'alabarda
    if (Math.hypot(player.x - n.x, player.y - n.y) < GREGORIO_H3.spazzata.portata * 0.8 && n.tH3 > 18) n.timerH3 = Math.min(n.timerH3, 1);
  } else if (s === 'alza' || s === 'abbassa') {
    n.angH3 += diffAngH3(angoloAH3(n), n.angH3) * 0.08; // segue il giocatore con lo sguardo, lento
  } else if (s === 'spazzata') {
    const S = GREGORIO_H3.spazzata;
    const durata = f2 ? S.durataFase2 : S.durata;
    const k = n.tH3 / Math.max(1, durata - 1);
    n.lamaH3 = n.angH3 - n.versoH3 * S.apertura + n.versoH3 * 2 * S.apertura * k;
    const ap = angoloAH3(n), d = Math.hypot(player.x - n.x, (player.y - 6) - (n.y - 6));
    if (!n.colpitoH3 && d < S.portata && Math.abs(diffAngH3(ap, n.lamaH3)) < S.larghezzaLama && player.invuln <= 0 && statoRun.hpHalf > 0) {
      n.colpitoH3 = true;
      subisciColpoGiocatore(2, 'l\'alabarda del Custode', n.x, n.y);
    }
  } else if (s === 'carica') {
    const K = GREGORIO_H3.carica;
    const v = f2 ? K.velocitaFase2 : K.velocita;
    n.x = lim(n.x + Math.cos(n.angH3) * v, ARENA.x1 + 18, ARENA.x2 - 18);
    n.y = lim(n.y + Math.sin(n.angH3) * v, ARENA.y1 + 18, ARENA.y2 - 18);
    const muro = n.x <= ARENA.x1 + 19 || n.x >= ARENA.x2 - 19 || n.y <= ARENA.y1 + 19 || n.y >= ARENA.y2 - 19;
    if (muro) { scuoti(FEEL.scossa.schiantoCapitano); n.timerH3 = 0; }
  } else if (s === 'chiavi' && n.tH3 === valoreH3('chiavi', f2) - 8) chiamaGuardieH3(n, st);
  n.tH3++;
  if (--n.timerH3 <= 0) entraStatoH3(n, prossimoStatoH3(n), st);
}

const passoLogicoBaseH3 = passoLogico;
passoLogico = function (...args) {
  const st = statoRun.stanzaCorrente;
  let attesa = null;
  const inGioco = Boolean(st) && statoRun.fase === 'in_gioco';
  try {
    if (inGioco && st.cortileH3) {
      const C = st.cortileH3;
      if (C.daAprire && !statoRun.siparioAttivo && !statoRun.pausa && !(window.__teatro.t4qa && window.__teatro.t4qa.dialogo)) apriConfrontoH3(st);
      const n = st.nemici.find((x) => x.bossId === GREGORIO_H3.bossId && x.hp > 0);
      if (n) attesa = [n, n.phaseTick || 0];
    } else if (inGioco && st.tipo === 'boss') rabbiaLucianaH3(st);
    if (inGioco) passoPagineH3(st);
  } catch (err) { console.error('[h3] passo', err); }
  const r = passoLogicoBaseH3.apply(this, args);
  if (attesa) {
    const [n, prima] = attesa;
    if (statoRun.stanzaCorrente === st && statoRun.fase === 'in_gioco' && statoRun.hpHalf > 0 && n.hp > 0 && (n.phaseTick || 0) !== prima) {
      try { iaGregorioH3(n, st); } catch (err) { console.error('[h3] ia', err); }
    }
  }
  try { if (inGioco && st.tipo === 'boss') guardieMetaLucianaH3(st); } catch (err) { console.error('[h3] guardie', err); }
  return r;
};

// ===========================================================================
// 4. LA MORTE DEL CUSTODE E IL DONO
// ===========================================================================
const verificaStanzaPulitaBaseH3 = verificaStanzaPulita;
verificaStanzaPulita = function (...args) {
  const st = statoRun.stanzaCorrente;
  try {
    if (st && st.cortileH3 && !st.cortileH3.risolto) {
      const C = st.cortileH3;
      if (C.fase === 'scontro' && !st.nemici.some((n) => n.bossId === GREGORIO_H3.bossId && n.hp > 0)) avviaMorteH3(st);
      return undefined; // finché la scena non è chiusa, le porte restano chiuse
    }
  } catch (err) { console.error('[h3] verifica', err); }
  return verificaStanzaPulitaBaseH3.apply(this, args);
};

/** Il Custode cade: la scena della morte (lunga la prima volta, breve dopo). */
function avviaMorteH3(st) {
  const C = st.cortileH3;
  if (C.fase === 'morte' || C.risolto) return;
  const g = st.nemici.find((n) => n.bossId === GREGORIO_H3.bossId);
  const pos = g ? { x: g.x, y: g.y } : (C.figura || postoGregorioH3(C));
  for (const n of st.nemici) n.hp = 0; // le guardie si fermano con lui
  statoRun.proiettiliNemici = [];
  C.fase = 'morte';
  C.figura = { x: pos.x, y: pos.y, posa: 'ginocchio' };
  const esito = C.esito || flagH3().gregorio || 'attacco';
  C.esito = esito;
  let righe;
  if (C.breve) righe = TESTI_H3.breveAttaccoMorte;
  else {
    righe = TESTI_H3.morte.map((r) => (r[0] === '?' ? TESTI_H3.morteSe[esito] || TESTI_H3.morteSe.attacco : r));
    if (!g) righe = [TESTI_H3.senzaScontro].concat(righe.slice(1)); // dialogo senza scontro: niente «al termine dello scontro»
  }
  apriH3(righe, { poi: () => chiudiCortileH3(st) });
}

/** Il dono del ramo «dialogo» (breve: la scena e il dono insieme). */
function doniH3(st, esito) {
  const C = st.cortileH3;
  C.esito = esito;
  C.figura = { ...(C.figura || postoGregorioH3(C)), posa: 'ginocchio' };
  chiudiCortileH3(st);
}

function chiudiCortileH3(st) {
  const C = st.cortileH3;
  if (C.risolto) return;
  C.risolto = true;
  C.fase = 'fine';
  const p = C.figura || postoGregorioH3(C);
  C.figura = { x: p.x, y: p.y, posa: 'aTerra' };
  const esito = C.esito || flagH3().gregorio || 'attacco';
  statoRun.gregorioH3 = { run: statoRun.numeroRun, esito, piano: statoRun.piano, notte: statoRun.numeroNotte || 1 };
  const A = GREGORIO_H3.anime;
  for (let k = 0; k < A.numero; k++) h3.anime.push({ x: p.x + (k - A.numero / 2) * 2.5, y: p.y - 10 - (k % 4) * 8, t0: tick + k * 4, fase: k * 1.3 });
  if (esito === 'dialogo') {
    try { if (typeof aggiungiChiavi === 'function') aggiungiChiavi(1); } catch (err) { console.warn('[h3] chiave', err); }
    mostraBanner(TESTI_H3.banner.dono, GREGORIO_H3.bannerTick);
  } else mostraBanner(TESTI_H3.banner.via, GREGORIO_H3.bannerTick);
  verificaStanzaPulitaBaseH3();
  if (!st.pulita && st.nemici.every((n) => n.hp <= 0)) st.pulita = true; // un altro strato aspettava i suoi nemici
}

// ===========================================================================
// 5. CONSEGUENZE SU DONNA LUCIANA
// ===========================================================================
function preparaLucianaH3(st) {
  if (pncH3(statoRun.piano) !== 4) return;
  const L = st.nemici.find((n) => n.bossId === LUCIANA_H3.bossId && n.hp > 0);
  const esito = esitoGregorioH3();
  if (!L || !esito || L.esitoH3) return;
  L.esitoH3 = esito;
  const ciclo = Math.floor((statoRun.piano - 1) / 4) + 1;
  if (esito === 'attacco') { L.rabbiaH3 = true; mostraBanner(TESTI_H3.banner.lucianaRabbia, GREGORIO_H3.bannerTick); }
  else {
    L.puntoDeboleH3 = true;
    const hp = Math.round(LUCIANA_H3.hpGuardia * Math.pow(1.45, ciclo - 1));
    for (let k = 0; k < LUCIANA_H3.guardieIngresso; k++) st.nemici.push(nuovaGuardiaH3(st, k === 0 ? 170 : 470, 240, hp, k));
    mostraBanner(TESTI_H3.banner.lucianaGuardie, GREGORIO_H3.bannerTick);
  }
}

function rabbiaLucianaH3(st) {
  if (statoRun.pausa || statoRun.siparioAttivo || ticksCongelati > 0) return;
  for (const n of st.nemici) {
    if (!n.rabbiaH3 || n.hp <= 0 || tick % LUCIANA_H3.rabbiaOgniTick !== 0) continue;
    if (n.shootCd > 1) n.shootCd--;
    if (n.attesaManiA > 1) n.attesaManiA--;
  }
}

function guardieMetaLucianaH3(st) {
  const L = st.nemici.find((n) => n.puntoDeboleH3 && n.hp > 0);
  if (!L || L.guardieMetaH3 || L.hp >= L.maxHp * 0.5) return;
  L.guardieMetaH3 = true;
  const ciclo = Math.floor((statoRun.piano - 1) / 4) + 1;
  const hp = Math.round(LUCIANA_H3.hpGuardia * Math.pow(1.45, ciclo - 1));
  for (let k = 0; k < LUCIANA_H3.guardieMeta; k++) st.nemici.push(nuovaGuardiaH3(st, k === 0 ? 130 : 510, 150, hp, k + 2));
}

const danneggiaNemicoBaseH3 = danneggiaNemico;
danneggiaNemico = function (nem, dmg, ...resto) {
  try {
    if (nem && nem.puntoDeboleH3 && nem.hp > nem.maxHp * LUCIANA_H3.sogliaPuntoDebole) dmg *= LUCIANA_H3.puntoDebole;
  } catch (_) { /* idem */ }
  return danneggiaNemicoBaseH3.call(this, nem, dmg, ...resto);
};

// ===========================================================================
// 6. DISEGNO «A OMBRE»
// ===========================================================================
/** Tela fissa del Cortile: colonnato, balcone, scalone (si ridisegna solo se cambia la dimensione). */
function telaCortileH3() {
  if (h3.tela) return h3.tela;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  // notte sul selciato
  g.fillStyle = TINTE_H3.notte; g.fillRect(ARENA.x1, ARENA.y1, ARENA.x2 - ARENA.x1, ARENA.y2 - ARENA.y1);
  // colonnato sulla parete di fondo
  g.fillStyle = TINTE_H3.ombra;
  for (let i = 0; i < 9; i++) {
    const x = 96 + i * 56;
    if (Math.abs(x - 320) < 40) continue;
    g.fillRect(x - 5, 26, 10, 50);
    g.fillRect(x - 8, 24, 16, 4); g.fillRect(x - 8, 72, 16, 4);
    g.beginPath(); g.arc(x + 28, 30, 24, Math.PI, 0); g.lineTo(x + 52, 24); g.lineTo(x + 4, 24); g.fill();
  }
  g.strokeStyle = 'rgba(240, 180, 90, 0.35)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(80, 23.5); g.lineTo(560, 23.5); g.stroke();
  // balcone sopra la porta della Signora
  g.fillStyle = TINTE_H3.ombra2; g.fillRect(270, 14, 100, 14);
  g.fillStyle = TINTE_H3.ombra;
  for (let k = 0; k < 9; k++) g.fillRect(274 + k * 11, 28, 3, 10);
  g.fillRect(266, 38, 108, 3);
  g.strokeStyle = 'rgba(232, 184, 74, 0.55)'; g.strokeRect(266.5, 14.5, 107, 26);
  h3.tela = c;
  return c;
}

/** Due bracieri, poca luce calda che respira (gradienti radiali, niente filtri). */
function luciCortileH3(t) {
  for (const [x, y] of [[ARENA.x1 + 26, ARENA.y1 + 18], [ARENA.x2 - 26, ARENA.y1 + 18]]) {
    const r = 70 + Math.sin(t * 0.07 + x) * 4;
    const gr = ctx.createRadialGradient(x, y, 2, x, y, r);
    gr.addColorStop(0, 'rgba(255, 190, 100, 0.30)'); gr.addColorStop(1, 'rgba(255, 150, 60, 0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = TINTE_H3.ombra; ctx.fillRect(x - 7, y, 14, 4); ctx.fillRect(x - 2, y + 4, 4, 12);
    ctx.fillStyle = TINTE_H3.lanterna;
    ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.quadraticCurveTo(x, y - 14 - Math.sin(t * 0.2 + x) * 3, x + 6, y); ctx.fill();
  }
}

/** Giglio d'oro sul petto (lampeggia quando il Custode è colpito: bibbia §VII). */
function giglioH3(x, y, s, acceso) {
  ctx.fillStyle = acceso ? TINTE_H3.oroVivo : TINTE_H3.oro;
  ctx.beginPath();
  ctx.moveTo(x, y - 5 * s); ctx.quadraticCurveTo(x + 2 * s, y - 1 * s, x, y + 2 * s); ctx.quadraticCurveTo(x - 2 * s, y - 1 * s, x, y - 5 * s);
  ctx.moveTo(x - 1 * s, y); ctx.quadraticCurveTo(x - 5 * s, y - 3 * s, x - 4 * s, y + 1 * s); ctx.lineTo(x - 1 * s, y + 1 * s);
  ctx.moveTo(x + 1 * s, y); ctx.quadraticCurveTo(x + 5 * s, y - 3 * s, x + 4 * s, y + 1 * s); ctx.lineTo(x + 1 * s, y + 1 * s);
  ctx.fill();
  ctx.fillRect(x - 3 * s, y + 2 * s, 6 * s, 1.2 * s);
  if (acceso) {
    const gr = ctx.createRadialGradient(x, y, 1, x, y, 14 * s);
    gr.addColorStop(0, 'rgba(255, 240, 180, 0.7)'); gr.addColorStop(1, 'rgba(255, 220, 120, 0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 14 * s, 0, TAU); ctx.fill();
  }
}

/**
 * Disegna Gregorio a sagoma d'ombra. (0,0) = piedi. Pose: fermo, cammina, anticipo, attacco, colpito, aTerra, ginocchio.
 * @param {string} posa @param {number} t tick @param {boolean} flash colpito ora @param {number} flip 1 o −1
 * @param {number} angLama angolo dell'alabarda in attacco (radianti, nel sistema del palco)
 */
function disegnaGregorioH3(posa, t, flash, flip, angLama) {
  const col = FOGLIO_H3.pose.indexOf(posa);
  const A = FOGLIO_H3.altezza;
  if (FOGLIO_H3.presente && typeof disegnaCellaTeatro === 'function' && col >= 0) {
    ctx.save(); ctx.scale(flip, 1);
    const L = A * ((typeof rapportoCellaTeatro === 'function' && rapportoCellaTeatro(FOGLIO_H3.nome, FOGLIO_H3.pose.length)) || 1.2);
    const ok = disegnaCellaTeatro(ctx, FOGLIO_H3.nome, col, FOGLIO_H3.pose.length, -L / 2, -A + FOGLIO_H3.piedi, L, A, flash ? '#fff' : null, flash ? 0.6 : 0);
    ctx.restore();
    if (ok) return;
  }
  const O = TINTE_H3.ombra, bordo = 'rgba(240, 180, 90, 0.85)';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (posa === 'aTerra') {
    // armatura vuota col mantello rosso sopra (l'ultima immagine della sottotrama)
    ctx.fillStyle = TINTE_H3.rossoScuro;
    ctx.beginPath(); ctx.ellipse(0, -4, 26, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = O;
    ctx.beginPath(); ctx.ellipse(-6, -6, 12, 6, -0.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(14, -8, 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = bordo; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = O; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-30, -1); ctx.lineTo(30, -3); ctx.stroke();
    return;
  }
  const passo = posa === 'cammina' ? Math.sin(t * 0.18) : 0;
  const giu = posa === 'ginocchio' ? 16 : posa === 'anticipo' ? 3 : posa === 'colpito' ? 2 : 0;
  ctx.save(); ctx.scale(flip, 1);
  // mantello (dietro)
  ctx.fillStyle = TINTE_H3.rossoScuro;
  ctx.beginPath(); ctx.moveTo(-9, -54 + giu); ctx.quadraticCurveTo(-20, -24 + giu, -16 - passo * 2, -2); ctx.lineTo(4, -4); ctx.lineTo(6, -52 + giu); ctx.fill();
  ctx.fillStyle = O; ctx.strokeStyle = bordo; ctx.lineWidth = 1.1;
  // gambe
  if (posa === 'ginocchio') {
    ctx.beginPath(); ctx.moveTo(-8, -20); ctx.lineTo(-12, -2); ctx.lineTo(-2, -2); ctx.lineTo(0, -16); ctx.lineTo(14, -14); ctx.lineTo(14, -2); ctx.lineTo(20, -2); ctx.lineTo(20, -18); ctx.lineTo(6, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-9, -26); ctx.lineTo(-10 + passo * 4, 0); ctx.lineTo(-3 + passo * 4, 0); ctx.lineTo(-1, -22); ctx.lineTo(2, -22); ctx.lineTo(4 - passo * 4, 0); ctx.lineTo(11 - passo * 4, 0); ctx.lineTo(9, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // busto pesante, un po' curvo (anziano)
  const curvo = posa === 'anticipo' ? 5 : posa === 'colpito' ? -3 : 2;
  ctx.beginPath();
  ctx.moveTo(-12, -26 + giu); ctx.lineTo(-14 + curvo, -50 + giu); ctx.quadraticCurveTo(curvo, -58 + giu, 13 + curvo, -50 + giu); ctx.lineTo(12, -26 + giu); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // cintura e mazzo di chiavi
  ctx.strokeStyle = TINTE_H3.oro; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-12, -28 + giu); ctx.lineTo(12, -28 + giu); ctx.stroke();
  const tin = posa === 'cammina' || posa === 'attacco' ? Math.sin(t * 0.4) * 1.5 : 0;
  ctx.strokeStyle = TINTE_H3.oro; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(-7, -24 + giu, 3, 0, TAU); ctx.stroke();
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-8 + k * 1.5, -21 + giu); ctx.lineTo(-9 + k * 2 + tin, -15 + giu); ctx.stroke(); }
  // testa con elmo a cresta
  ctx.fillStyle = O; ctx.strokeStyle = bordo; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.arc(3 + curvo, -62 + giu, 7.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3 + curvo, -68 + giu); ctx.quadraticCurveTo(4 + curvo, -78 + giu, 11 + curvo, -66 + giu); ctx.lineTo(9 + curvo, -64 + giu); ctx.fill();
  ctx.fillStyle = TINTE_H3.rosso; ctx.fillRect(1 + curvo, -79 + giu, 3, 6); // pennacchio
  // barba bianca (anziano)
  ctx.fillStyle = 'rgba(226, 214, 196, 0.85)';
  ctx.beginPath(); ctx.moveTo(4 + curvo, -58 + giu); ctx.lineTo(10 + curvo, -57 + giu); ctx.lineTo(7 + curvo, -51 + giu); ctx.fill();
  giglioH3(1 + curvo / 2, -42 + giu, 1, flash);
  ctx.restore();
  // alabarda: posa per posa (in attacco segue la lama)
  let a;
  if (posa === 'attacco' && angLama != null) a = angLama;
  else if (posa === 'anticipo') a = flip > 0 ? -2.5 : -0.64; // alzata dietro la spalla
  else if (posa === 'ginocchio') a = flip > 0 ? 0.25 : Math.PI - 0.25; // abbassata, punta a terra
  else if (posa === 'colpito') a = flip > 0 ? -0.9 : -2.24;
  else a = -Math.PI / 2 + 0.12 * flip; // dritta
  const mx = 10 * flip, my = -40 + giu;
  const L = posa === 'attacco' ? 58 : 50;
  const cx = mx + Math.cos(a) * L, cy = my + Math.sin(a) * L;
  ctx.strokeStyle = O; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(mx - Math.cos(a) * 16, my - Math.sin(a) * 16); ctx.lineTo(cx, cy); ctx.stroke();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
  ctx.fillStyle = O; ctx.strokeStyle = bordo; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-2, -3); ctx.quadraticCurveTo(-6, -14, -14, -12); ctx.lineTo(-8, 0); ctx.lineTo(-14, 5); ctx.lineTo(-2, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  if (posa === 'attacco' && angLama != null) {
    ctx.strokeStyle = 'rgba(255, 230, 170, 0.35)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(mx, my, L, angLama - 0.5 * flip, angLama, flip < 0); ctx.stroke();
  }
}

/** Posa del Custode dallo stato dell'IA. */
function posaGregorioH3(n) {
  const riga = n.statoH3 && STATI_H3.stati[n.statoH3];
  return riga ? riga.posa : 'fermo';
}

const disegnaStanzaPixelArtBaseH3 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function (t, st, ...resto) {
  const r = disegnaStanzaPixelArtBaseH3.call(this, t, st, ...resto);
  try {
    if (st && st.cortileH3) {
      ctx.save();
      ctx.drawImage(telaCortileH3(), 0, 0);
      luciCortileH3(t || tick);
      const F = st.cortileH3.figura;
      if (F) {
        ctx.fillStyle = 'rgba(8, 5, 3, 0.6)'; ctx.beginPath(); ctx.ellipse(F.x, F.y + 4, 20, 6, 0, 0, TAU); ctx.fill();
        ctx.translate(F.x, F.y + 4);
        disegnaGregorioH3(F.posa, t || tick, false, player.x < F.x ? -1 : 1, null);
      }
      ctx.restore();
    }
    disegnaAnimeH3();
    disegnaPaginaH3(st, t || tick);
  } catch (err) { console.error('[h3] resa', err); }
  return r;
};

function disegnaAnimeH3() {
  const A = GREGORIO_H3.anime;
  for (let i = h3.anime.length - 1; i >= 0; i--) {
    const p = h3.anime[i];
    const eta = tick - p.t0;
    if (eta < 0) continue;
    if (eta > A.durataTick || !statoRun.stanzaCorrente || !statoRun.stanzaCorrente.cortileH3) { h3.anime.splice(i, 1); continue; }
    const k = eta / A.durataTick;
    const x = p.x + (320 - p.x) * k * k + Math.sin(eta * 0.08 + p.fase) * 5, y = p.y - eta * A.salita;
    ctx.save(); ctx.globalAlpha = 1 - k;
    ctx.fillStyle = TINTE_H3.azzurro; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 0.9, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

const disegnaBossPittoricoBaseH3 = disegnaBossPittorico;
disegnaBossPittorico = function (...args) {
  const a = args[0] && typeof args[0].save === 'function' ? args.slice(1) : args;
  const b = a[0];
  if (!b || b.bossId !== GREGORIO_H3.bossId) return disegnaBossPittoricoBaseH3.apply(this, args);
  try {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 5, 3, 0.68)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 8, 22, 7, 0, 0, TAU); ctx.fill();
    ctx.translate(b.x, b.y + 8);
    const flip = player.x < b.x ? -1 : 1;
    disegnaGregorioH3(posaGregorioH3(b), a[1] || tick, b.flash > 0 && OPZIONI.lampi !== false, flip, b.statoH3 === 'spazzata' ? b.lamaH3 : null);
    ctx.restore();
  } catch (err) { console.error('[h3] disegno', err); }
  return undefined;
};

/** La pagina del registro a terra: un foglio chiaro con un luccichio (solo a stanza pulita, se non presa). */
function disegnaPaginaH3(st, t) {
  const pg = st && st.paginaH3;
  if (!pg || !st.pulita || statoProveH3().prese.includes(pg.piano)) return;
  const k = 0.5 + 0.5 * Math.sin(t * 0.09);
  ctx.save();
  ctx.translate(pg.x, pg.y + Math.sin(t * 0.05) * 1.2);
  const gr = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
  gr.addColorStop(0, `rgba(255, 236, 170, ${(0.35 + 0.3 * k).toFixed(3)})`); gr.addColorStop(1, 'rgba(255, 220, 120, 0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill();
  ctx.rotate(-0.18);
  ctx.fillStyle = '#efe2c2'; ctx.strokeStyle = TINTE_H3.ombra; ctx.lineWidth = 1;
  ctx.fillRect(-6, -8, 12, 15); ctx.strokeRect(-6, -8, 12, 15);
  ctx.strokeStyle = 'rgba(60, 40, 25, 0.75)';
  for (let r = 0; r < 4; r++) { ctx.beginPath(); ctx.moveTo(-4, -5 + r * 3); ctx.lineTo(4 - (r % 2) * 2, -5 + r * 3); ctx.stroke(); }
  ctx.fillStyle = TINTE_H3.rosso; ctx.beginPath(); ctx.arc(3, 4, 1.6, 0, TAU); ctx.fill(); // sigillo
  ctx.rotate(0.18);
  ctx.fillStyle = `rgba(255, 250, 220, ${k.toFixed(3)})`; // luccichio a croce
  ctx.fillRect(7, -12, 1, 6); ctx.fillRect(4.5, -9.5, 6, 1);
  ctx.restore();
}

/** Prove sul palco: visibili dal piano 1 del ciclo fino al Cortile risolto. */
function proveVisibiliH3() {
  if (statoRun.fase !== 'in_gioco') return false;
  const pnc = pncH3(statoRun.piano);
  if (pnc === 4) {
    const r = statoRun.gregorioH3;
    return !(r && r.run === statoRun.numeroRun && r.piano === statoRun.piano);
  }
  return PROVE_H3.piani.includes(pnc);
}

const disegnaHUDPixelArtBaseH3 = disegnaHUDPixelArt;
disegnaHUDPixelArt = function (st, ...resto) {
  const r = disegnaHUDPixelArtBaseH3.call(this, st, ...resto);
  try {
    if (proveVisibiliH3()) {
      const n = proveH3(), k = PROVE_H3.servono;
      const testo = TESTI_H3.prove.contatore(n, k) + (flagH3().taddeo === 'perdonato' ? TESTI_H3.prove.taddeo : '');
      // sotto il riquadro della minimappa (x da W−124, fondo a y 100)
      ctx.save();
      ctx.fillStyle = 'rgba(10, 6, 4, 0.62)'; ctx.fillRect(W - 124, 102, 114, 12);
      ctx.strokeStyle = n >= k ? TINTE_H3.oro : 'rgba(240, 180, 90, 0.45)'; ctx.lineWidth = 1; ctx.strokeRect(W - 123.5, 102.5, 113, 11);
      drawTextFit(testo, W - 67, 110.5, 108, { size: 6.5, color: n >= k ? '#f9cb40' : '#e6d2aa' });
      ctx.restore();
    }
    // la stanza vista con la pagina ancora a terra: un segno piccolo sulla minimappa
    const m = statoRun.mappa;
    const s = m && m.paginaH3 && m.perId && m.perId.get(m.paginaH3);
    if (s && s.visitata && s.paginaH3 && !statoProveH3().prese.includes(s.paginaH3.piano) && statoRun.fase === 'in_gioco' && !maledizioneD('mappa')) {
      const cell = 12, px = W - 118 + (s.cx - 1) * cell, py = 24 + (s.cy - 1) * cell;
      ctx.save(); ctx.fillStyle = '#efe2c2'; ctx.fillRect(px + 7, py + 1, 3, 4); ctx.fillStyle = TINTE_H3.rosso; ctx.fillRect(px + 8, py + 4, 1, 1); ctx.restore();
    }
  } catch (err) { console.error('[h3] hud', err); }
  return r;
};

if (typeof noteVoceE6 === 'function') {
  const noteVoceBaseH3 = noteVoceE6;
  /** Conto della notte di e6: una riga con le prove raccolte (solo per la notte in corso). */
  noteVoceE6 = function (v, ...resto) {
    const note = noteVoceBaseH3.call(this, v, ...resto);
    try {
      const P = statoRun.percorsoProveH3;
      if (Array.isArray(note) && P && P.run === statoRun.numeroRun) note.push([TESTI_H3.prove.conto, `${proveH3()} di ${PROVE_H3.servono}`]);
    } catch (_) { /* idem */ }
    return note;
  };
}

// ===========================================================================
// 7. DIARIO (b8) E REGISTRO DI SCENA (d3)
// ===========================================================================
if (typeof componiPaginaB8 === 'function') {
  const componiPaginaBaseH3 = componiPaginaB8;
  /** La pagina della notte in cui Ferruccio ha incontrato il Custode prende una riga sul Cortile. */
  componiPaginaB8 = function (v, nota, ...resto) {
    const pagina = componiPaginaBaseH3.call(this, v, nota, ...resto);
    try {
      const r = statoRun.gregorioH3;
      const notte = Number(v && v.notte);
      if (r && r.esito && pagina && Array.isArray(pagina.righe) && Number.isFinite(notte) && notte === Number(r.notte)) {
        const riga = TESTI_H3.diario[r.esito];
        if (riga && !pagina.righe.includes(riga)) pagina.righe.splice(Math.max(0, pagina.righe.length - 1), 0, riga);
      }
    } catch (err) { console.error('[h3] diario', err); }
    return pagina;
  };
}

/** Scheda del Custode per i Primi attori del Registro di Scena (d3 legge id, nome, tipo, presentazione). */
const SCHEDA_REGISTRO_H3 = Object.freeze({ id: GREGORIO_H3.bossId, nome: TESTI_H3.nome, tipo: 'guardia',
  presentazione: TESTI_H3.registro.battuta, aneddoto: TESTI_H3.registro.aneddoto });
if (typeof primiAttoriD3 === 'function') {
  const primiAttoriBaseH3 = primiAttoriD3;
  primiAttoriD3 = function (...a) {
    const out = primiAttoriBaseH3.apply(this, a);
    try { if (Array.isArray(out) && !out.some((b) => b.id === SCHEDA_REGISTRO_H3.id)) out.push(SCHEDA_REGISTRO_H3); } catch (_) { /* idem */ }
    return out;
  };
}

// ===========================================================================
// SONDA QA / SVILUPPO
// ===========================================================================
Object.assign(window.__teatro.interni, {
  GREGORIO_H3, LUCIANA_H3, STATI_H3, TESTI_H3, FOGLIO_H3,
  gregorioH3: Object.freeze({
    marcaCortile: marcaCortileH3,
    haProve: haProveH3,
    get prove() { return { n: proveH3(), ...JSON.parse(JSON.stringify(statoProveH3())), pagina: statoRun.mappa ? statoRun.mappa.paginaH3 : undefined }; },
    scegliPagina: scegliPaginaH3,
    /** Cortile della stanza corrente: fase, esito, Custode (stato IA, fase 2, vita). */
    get stato() {
      const st = statoRun.stanzaCorrente;
      if (!st) return null;
      const n = st.nemici.find((x) => x.bossId === GREGORIO_H3.bossId);
      const C = st.cortileH3;
      return { cortile: Boolean(C), fase: C ? C.fase : null, esito: C ? C.esito || null : null, risolto: C ? C.risolto : null,
        breve: C ? Boolean(C.breve) : null, pulita: st.pulita, figura: C && C.figura ? C.figura.posa : null,
        custode: n ? { stato: n.statoH3 || null, fase2: Boolean(n.fase2H3), hp: n.hp, maxHp: n.maxHp, x: n.x, y: n.y } : null,
        guardie: st.nemici.filter((x) => x.guardiaH3 && x.hp > 0).length };
    },
    get run() { return statoRun.gregorioH3 || null; },
    get luciana() {
      const st = statoRun.stanzaCorrente;
      const L = st && st.nemici.find((n) => n.bossId === LUCIANA_H3.bossId);
      return L ? { esito: L.esitoH3 || null, rabbia: Boolean(L.rabbiaH3), puntoDebole: Boolean(L.puntoDeboleH3), hp: L.hp, maxHp: L.maxHp,
        guardie: st.nemici.filter((x) => x.guardiaH3 && x.hp > 0).length } : null;
    },
  }),
});

// Il foglio di Gregorio si carica all'avvio: al Cortile è già pronto e non si vede lo scambio col disegno a codice.
try { if (FOGLIO_H3.presente && typeof getSpriteTeatro === 'function') getSpriteTeatro(FOGLIO_H3.nome); } catch (_) { /* si disegna sul canvas */ }
