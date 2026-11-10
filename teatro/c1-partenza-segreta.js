/*
 * teatro/c1-partenza-segreta.js — (c1) LA PARTENZA SEGRETA di Piazza Dante. Richiesta dell'autore (2026-11-10):
 * «uno start segreto nella prima stanza da cui Tonino recupera la memoria, mi fa armare e mi fa scegliere 10
 * potenziamenti, ma deve essere impossibile da sapere».
 *
 * Come funziona (tutto nell'hub di teatro/t4-hub-storia.js, una volta per notte):
 *  1. LA BOMBA AL LAMPIONE. E accanto al lampione (e solo lì, senza nessuno con cui parlare) posa la bomba con
 *     cui si comincia la notte: miccia di a1, scoppio, vetro rotto, la luce si spegne e la piazza si fa più buia.
 *     La run di quella notte parte con una bomba in meno. Altrove nell'hub E continua a non fare niente.
 *  2. TONINO CHIEDE. Col lampione spento, al posto delle battute solite: «sei stato tu?» e una scelta a due.
 *     La verità non sblocca niente. La BUGIA sveglia Tonino: i suoi due fili d'oro compaiono, si tendono e si
 *     spezzano, lui barcolla, guarda le Mani e ricorda.
 *  3. IL FAGOTTO. Da sotto il banchetto: un'arma e PARTENZA_C1.armeria.doni potenziamenti a scelta, nel
 *     pannello della Stanza dello Sviluppatore (statoRun.pannelloB, stessa griglia a pagine di b5) in un modo
 *     nuovo «c1»: contatore, togli e rimetti, conferma esplicita; mouse, tastiera, gamepad (contesto «pannello»
 *     di b3). Il fagotto si consegna davvero all'inizio della run (acquisisciOggettoConLimite5Slot: effetti,
 *     Diario degli oggetti, trasformazioni di b4, Registro di a7).
 *  4. DOPO. Per quella notte Tonino resta sveglio; la notte dopo non ricorda e il lampione è di nuovo acceso.
 *
 * NIENTE INDIZI: nessuna etichetta, nessun testo, nessuna voce di menu finché non succede. Lo stato «scoperto»
 * sta nel flag T3 `partenzaSegretaC1` dello slot e non si mostra da nessuna parte.
 *
 * Script classico caricato dopo teatro/b1-pubblico.js. Agganci in t4-hub-storia.js (una riga l'uno, tutti
 * `typeof … === 'function'`): T.hubSenzaNessunoC1, T.toninoParlaC1, T.disegnaToninoC1, T.lampioneSpentoC1,
 * T.coseHubC1, T.hubFermoC1 e la scelta con `alScegliere`. Avvolge (chiamando sempre la base): passoLogico,
 * nuovaRun, t4Gancio, tastoPannelloB, clickPannelloB, disegnaPannelloSviluppatoreB, disegnaPergamenaA7,
 * componiPaginaB8. QA: tools/qa-teatro-partenza-segreta.js, sonda interni.partenzaSegretaC1.
 */

// ===========================================================================
// 1. TABELLE (data-driven: si tara da qui)
// ===========================================================================
const PARTENZA_C1 = Object.freeze({
  chiaveFlag: 'partenzaSegretaC1',                     // flag dello slot T3: { scoperto, volte, armato, primaNotte, ultimaNotte }
  chiaveLocale: 'ferruccio.teatro.partenzaSegretaC1',  // ripiego se T3 non c'è
  lampione: Object.freeze({
    raggio: 36,          // px dal piede del lampione entro cui E posa la bomba (dall'arrivo in piazza sono 53: non capita per caso)
    piedeDy: 10,         // il piede sta 10 px sotto il centro della cella (come la collisione di T4)
    lanternaDy: -34,     // la lanterna di vetro in cima al palo
  }),
  bomba: Object.freeze({ perNotte: 1, dy: 4 }),         // miccia e disegno: quelli di a1 (BOMBE_CHIAVI_A1.bomba.miccaMs)
  scoppio: Object.freeze({ durataTick: 22, raggio: 56, colore: '251, 146, 60', scossaPx: 4, scossaTick: 16, lampoTick: 7, lampoAlfa: 0.3 }),
  buio: Object.freeze({ velo: 0.12, alone: 0.3, raggio: 150, sfumaTick: 40, colore: '4, 6, 16' }), // la piazza resta leggibile
  vetro: Object.freeze({ cocci: 9, fumoTick: 280 }),
  scena: Object.freeze({
    filiAlfa: 0.9,       // i due fili di Tonino quando si vedono
    maniAlfa: 0.6,       // le Mani sopra la piazza, per il tempo della scena
    maniPasso: 0.02,     // di quanto sfumano a ogni tick
    spallaDx: 5, spallaDy: -21, // attacco dei fili sulle spalle di Tonino
    secondoStrappoTick: 14,     // il secondo filo cede poco dopo il primo
    frustaTick: 28, frustaPx: 6, rottura: 0.86, monconePx: 9,
    scossaStrappoPx: 2, scossaStrappoTick: 8,
  }),
  armeria: Object.freeze({
    doni: 10,              // quanti potenziamenti si scelgono (né uno di più, né uno di meno)
    mostraIgnoti: true,    // Tonino «vede la realtà per quella che è»: nome ed effetto anche degli oggetti mai raccolti
    armaL: 88, armaA: 58, armaY: 60, armaLMax: 560,                 // celle del primo passo (le armi)
    dettaglioY: 262,                                                 // nome, effetto, lore dell'oggetto sotto il cursore
    barra: Object.freeze({ y: 293, lato: 20, passo: 22, armaX: 40, doniX: 68 }), // il fagotto: arma + 10 posti
    pagine: Object.freeze({ x: 344, y: 307, l: 16 }),   // ‹ pagina i/n ›
    conferma: Object.freeze({ x: 444, y: 292, w: 152, h: 22 }),
    aiutoY: 332, avvisoTick: 150,
    colori: Object.freeze({ velo: 'rgba(5, 3, 2, 0.9)', fondo: '#140c08', oro: '#f9cb40', bordo: '#5c3a1e', cella: '#17100b',
      cursore: '#3b2a1a', scelto: '#4a3410', negativo: '#b91c1c', comune: '#57534e', nome: '#4ade80', effetto: '#67e8f9',
      lore: '#e6d2aa', aiuto: '#c9a679', rosso: '#7a1c12', spento: '#241811', avviso: '#fca5a5' }),
  }),
  suoni: Object.freeze({ vetro: 0.16, sibilo: 0.1, schiocco: 0.22, tensione: 0.07 }), // volumi (poi OPZIONI.volumeEffetti)
});

/**
 * La scena dei fili: macchina a stati esplicita. fase → { tick: durata, poi: fase successiva o null }.
 * `null` chiude la scena: dopo «barcolla» si apre il cartiglio del ricordo, dopo «fagotto» il fagotto.
 */
const SCENA_C1 = Object.freeze({
  fermo: Object.freeze({ tick: 36, poi: 'fili' }),          // Tonino si ferma: silenzio
  fili: Object.freeze({ tick: 54, poi: 'tensione' }),       // i due fili e le Mani diventano visibili
  tensione: Object.freeze({ tick: 48, poi: 'strappo' }),    // i fili si tendono, lo tirano su
  strappo: Object.freeze({ tick: 44, poi: 'barcolla' }),    // si spezzano, uno dopo l'altro
  barcolla: Object.freeze({ tick: 64, poi: null }),         // barcolla, poi alza la testa verso le Mani
  fagotto: Object.freeze({ tick: 46, poi: null }),          // si china e tira fuori il fagotto
});

/** Stati della notte e passaggi ammessi (ogni notte nuova riparte da «acceso»). */
const STATI_C1 = Object.freeze({
  acceso: Object.freeze(['miccia']),
  miccia: Object.freeze(['spento']),
  spento: Object.freeze(['verita', 'risveglio']),
  verita: Object.freeze([]),
  risveglio: Object.freeze(['fagotto']),
  fagotto: Object.freeze(['sveglio']),
  sveglio: Object.freeze([]),
});

/** Testi per il giocatore. TUTTI DA APPROVARE DALL'AUTORE (voce di Tonino: napoletano leggero, come in storia.json). */
const TESTI_C1 = Object.freeze({
  domanda: Object.freeze([
    ['didascalia', 'Tonino smette di lustrare la lanterna. Guarda il lampione spento.'],
    ['tonino', "Uagliò... 'o lampione. Stava acceso da che mi ricordo, e mo' è scuro."],
    ['tonino', "Dimmi 'a verità: sei stato tu?"],
  ]),
  risposte: Object.freeze([
    Object.freeze({ valore: 'si', etichetta: 'Sì, sono stato io' }),
    Object.freeze({ valore: 'no', etichetta: 'No' }),
  ]),
  verita: Object.freeze([
    ['tonino', "Eh. E che ci vuoi fare. Una luce di meno: tanto 'a luna nun se move."],
    ['didascalia', 'Alza le spalle e torna a lustrare la lanterna del banchetto.'],
  ]),
  bugia: Object.freeze([
    ['tonino', 'No?'],
    ['didascalia', 'Tonino non ride. Guarda il vetro a terra, poi le mani di Ferruccio.'],
    ['tonino', "Uagliò, io t'ho visto. E tu m'hai detto 'na buscìa."],
    ['tonino', "E se questa è 'na buscìa... che altro è finto, ccà 'ncoppa?"],
  ]),
  ricordo: Object.freeze([
    ['tonino', 'Rosa.'],
    ['tonino', "Maronna mia. 'A sedia vuota era 'a soja. E io 'a guardavo ogni notte senza sapé pecché."],
    ['tonino', "'O banchetto, 'a luna ferma, 'sta notte che ricomincia sempre da capo... Nun è 'na piazza, guagliò. È 'nu teatro."],
    ['didascalia', 'Alza la testa. Sopra la piazza due Mani reggono i fili di tutti. In fondo, nel buio, qualcuno guarda.'],
    ['tonino', "Ce stanno 'e fili. Ce sta 'a gente che guarda. E noi recitiamo 'a parte nostra ogni notte, comme 'e pupi."],
    ['tonino', "Domani nun me ricordo cchiù niente, 'o saccio. Ma stanotte sto sveglio. E stanotte t'armo io."],
  ]),
  fagotto: Object.freeze([
    ['didascalia', 'Da sotto il banchetto tira fuori un fagotto legato con lo spago.'],
    ['tonino', "Robba che 'a gente ha lasciato qua, notte dopo notte. Scegli 'o ferro tuo. E poi dieci cose: dieci, nun una 'e cchiù."],
  ]),
  fagottoAncora: Object.freeze([
    ['tonino', "'O fagotto sta ancora qua. Scegli, ché 'a notte nun aspetta."],
  ]),
  congedo: Object.freeze([
    ['tonino', "Mo' va'. E quanno torni e io te dico «che bella giornata»... nun me credere."],
  ]),
  sveglio: Object.freeze([
    ['tonino', "Sto ancora sveglio, guagliò. Fa male, ma è 'nu male mio. Va', prima che Loro se ne accorgono."],
    ['tonino', "Rosa rideva sempre quanno 'o lampione tremava. Stanotte me lo ricordo. Solo stanotte."],
    ['tonino', "Mo' che ci vedo... 'a porta 'e Gaetano è l'unica cosa, ccà, che nun è dipinta."],
  ]),
  armeria: Object.freeze({
    titoloArma: "✦ IL FAGOTTO DI TONINO ✦  Primo: 'o ferro tuo",
    titoloDoni: (n, tot) => `✦ IL FAGOTTO DI TONINO ✦  Dieci cose, non una di più — scelte ${n}/${tot}`,
    freccette: 'Le freccette di sempre',
    freccetteEffetto: "Niente di nuovo: tieni l'arma con cui sali in scena.",
    freccetteLore: 'Le hai sempre avute in tasca. Tonino non le tocca nemmeno.',
    diSempre: (nome) => `${nome} (la tua di sempre)`,
    senzaPatto: 'Dal fagotto di Tonino non costa nessuna Maschera.',
    citazione: "«Scegli 'o ferro tuo, guagliò.»",
    conferma: '✦ CONFERMA E CHIUDI IL FAGOTTO ✦',
    mancano: (n) => (n === 1 ? 'Ne manca ancora una' : `Ne mancano ancora ${n}`),
    pieno: 'Il fagotto è pieno: per cambiare, prima togline una.',
    nonAncora: (n) => (n === 1 ? 'Tonino scuote la testa: «Dieci, guagliò. Ne manca una.»' : `Tonino scuote la testa: «Dieci, guagliò. Ne mancano ${n}.»`),
    pagina: (i, n) => `pagina ${i}/${n}`,
    negativo: 'Porta male: Tonino te lo sconsiglia.',
    aiutoArma: "←→ scorri · Invio / E: prendi quest'arma · Esc: richiudi il fagotto (resta da Tonino)",
    aiutoArmaPad: "✥ scorri · Ⓐ prendi quest'arma · Ⓑ richiudi il fagotto (resta da Tonino)",
    aiutoDoni: "Frecce: scorri · Invio / E: metti o togli · ↓ in fondo: conferma · PagSu/PagGiù: pagina · Esc: torna all'arma",
    aiutoDoniPad: "✥ scorri · Ⓐ metti o togli · ✥ giù in fondo: conferma · Ⓑ torna all'arma",
  }),
  banner: (arma, n) => `✦ Il fagotto di Tonino: ${arma} e ${n} doni. Stanotte sei armato.`,
  pergamena: Object.freeze(['Partenza', 'Tonino era sveglio: un\'arma e dieci doni dal suo fagotto']),
  diario: Object.freeze([
    'Ho spento il lampione e a Tonino ho detto di no. Per una notte ha visto i fili. Mi ha armato lui.',
    'Una bugia sola, e Tonino si è svegliato. Ha detto il nome di Rosa. Poi mi ha riempito le tasche.',
  ]),
});

// Icona delle freccette di sempre (12×12, palette di 00-config.js)
Object.assign(SPRITE_OGGETTI, {
  freccetteC1: [
    '............', '.........kk.', '........kyyk', '.......kyyk.', '......kwyk..', '.....kwwk...',
    '..k.kwwk....', '.kokwwk.....', '.kookk......', '..kook......', '...kk.......', '............'],
});

// ===========================================================================
// 2. STATO (di una notte e di uno slot: tutto in memoria tranne il flag «scoperto»)
// ===========================================================================
const c1 = {
  notte: null, slot: null,   // a quale notte e a quale slot appartiene lo stato qui sotto
  stato: 'acceso',           // vedi STATI_C1
  bomba: null,               // { x, y, miccia, tot } accesa accanto al lampione
  scoppio: null,             // { x, y, t } anello e lampo
  scossaT: 0, scossaTot: 1, scossaPx: 0,
  tSpento: 0,                // tick dallo spegnimento (dissolvenza del buio, fumo)
  scena: null,               // { fase, t } scena dei fili in corso (SCENA_C1)
  risveglio: null,           // 'bugia' | 'scena' | 'ricordo': a che punto è il risveglio (per riprenderlo)
  fili: null,                // [{ lato, rotto, t }] i due fili di Tonino
  filiAlfa: 0, tensione: 0, maniAlfa: 0,
  tonino: { x: 207, y: 157 },
  lampione: null,            // { x, y } visto dall'ultimo disegno
  armeria: null,             // scelte in corso nel fagotto
  fagotto: null,             // { arma, armaNome, doni: [id], consegnato } confermato
  ripeti: 0,                 // quale battuta da sveglio tocca
  runSegreta: null,          // numeroRun della run partita col fagotto
  api: null,                 // { apri, voce } del cartiglio di T4 (arrivano dal gancio)
  fermaQA: false,            // QA: la scena non avanza (per fotografarla)
};

/** Posa di Tonino del fotogramma (un solo oggetto, niente allocazioni per frame). */
const POSA_C1 = { ox: 0, oy: 0, rot: 0, testa: 0, occhi: 0, aperti: false, bocca: false, braccia: '' };

const salvataggiC1 = () => (window.__teatroT3 && window.__teatroT3.salvataggi) || null;
const slotC1 = () => { const sv = salvataggiC1(); return sv ? sv.slotAttivo : 0; };
const limitaC1 = (v, a, b) => Math.max(a, Math.min(b, v));
const dialogoApertoC1 = () => { try { return Boolean(window.__teatro.t4qa && window.__teatro.t4qa.dialogo); } catch (_) { return false; } };

/** Riporta lo stato a «lampione acceso, Tonino addormentato» per la notte `n` dello slot `s`. */
function azzeraNotteC1(n, s) {
  c1.notte = n; c1.slot = s; c1.stato = 'acceso';
  c1.bomba = null; c1.scoppio = null; c1.scossaT = 0; c1.tSpento = 0;
  c1.scena = null; c1.risveglio = null; c1.fili = null; c1.filiAlfa = 0; c1.tensione = 0; c1.maniAlfa = 0;
  c1.armeria = null; c1.fagotto = null; c1.ripeti = 0;
  if (statoRun.pannelloB && statoRun.pannelloB.c1) statoRun.pannelloB = null;
}

/** Stato della notte corrente: se la notte (o lo slot) è cambiata, si riparte da capo. La notte si ripete. */
function notteC1() {
  const n = getNumeroNotte(), s = slotC1();
  if (c1.notte !== n || c1.slot !== s) azzeraNotteC1(n, s);
  return c1;
}

/** Passaggio di stato secondo STATI_C1. @returns {boolean} true se ammesso. */
function passaC1(nuovo) {
  if (!(STATI_C1[c1.stato] || []).includes(nuovo)) { console.warn(`[c1] passaggio non ammesso: ${c1.stato} → ${nuovo}`); return false; }
  c1.stato = nuovo;
  return true;
}

const lampioneSpentoC1 = () => c1.stato !== 'acceso' && c1.stato !== 'miccia';
const armeriaApertaC1 = () => Boolean(statoRun.pannelloB && statoRun.pannelloB.c1);

/** Flag «scoperto» dello slot attivo (non si mostra mai). */
function leggiScopertaC1() {
  let d = null;
  try {
    const sv = salvataggiC1();
    d = sv ? sv.leggiFlag(PARTENZA_C1.chiaveFlag) : JSON.parse(localStorage.getItem(PARTENZA_C1.chiaveLocale) || 'null');
  } catch (_) { d = null; }
  const o = d && typeof d === 'object' ? d : {};
  return { scoperto: Boolean(o.scoperto), volte: Math.max(0, Math.floor(Number(o.volte) || 0)), armato: Math.max(0, Math.floor(Number(o.armato) || 0)),
    primaNotte: Number(o.primaNotte) || null, ultimaNotte: Number(o.ultimaNotte) || null };
}

function registraScopertaC1(armato) {
  const d = leggiScopertaC1();
  const n = getNumeroNotte();
  d.scoperto = true;
  if (armato) d.armato += 1; else d.volte += 1;
  if (!d.primaNotte) d.primaNotte = n;
  d.ultimaNotte = n;
  try {
    const sv = salvataggiC1();
    if (sv) sv.impostaFlag(PARTENZA_C1.chiaveFlag, d);
    else localStorage.setItem(PARTENZA_C1.chiaveLocale, JSON.stringify(d));
  } catch (err) { console.warn('[c1] flag non salvato', err); }
}

// ===========================================================================
// 3. SUONI (Web Audio procedurale su AudioSys.ctx → AudioSys.uscita; muti se AudioSys.attivo è spento)
// ===========================================================================
let rumoreBufferC1 = null;

function suonaC1(fn) {
  try {
    const ac = AudioSys.ctx;
    if (!ac || !AudioSys.attivo) return;
    const out = AudioSys.uscita;
    if (!out) return;
    if (!rumoreBufferC1 || rumoreBufferC1.sampleRate !== ac.sampleRate) {
      rumoreBufferC1 = ac.createBuffer(1, Math.floor(ac.sampleRate * 1.2), ac.sampleRate);
      const d = rumoreBufferC1.getChannelData(0);
      let s = 0x2f6e2b1;
      for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = (s / 0xffffffff) * 2 - 1; } // rumore fisso: mai rng()
    }
    fn(ac, out, ac.currentTime);
  } catch (_) { /* audio facoltativo */ }
}

function rumoreC1(ac, out, t0, durata, tipo, freq, q, vol, freqFine) {
  const src = ac.createBufferSource();
  src.buffer = rumoreBufferC1;
  const f = ac.createBiquadFilter();
  f.type = tipo; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (freqFine) f.frequency.exponentialRampToValueAtTime(freqFine, t0 + durata);
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + durata);
  src.connect(f); f.connect(g); g.connect(out);
  src.start(t0); src.stop(t0 + durata + 0.02);
}

/** Il vetro della lanterna che va in pezzi: uno scroscio e qualche tintinnio. */
function suonoVetroC1() {
  suonaC1((ac, out, t0) => {
    const V = PARTENZA_C1.suoni.vetro;
    rumoreC1(ac, out, t0, 0.22, 'highpass', 3800, 0.7, V);
    [5200, 3900, 6400, 4600, 7100].forEach((hz, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      const t = t0 + 0.03 + i * 0.055;
      o.type = 'triangle'; o.frequency.setValueAtTime(hz, t);
      g.gain.setValueAtTime(V * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.16);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.18);
    });
  });
}

/** Il sibilo della fiamma che muore. */
function suonoSibiloC1() {
  suonaC1((ac, out, t0) => rumoreC1(ac, out, t0 + 0.12, 1.1, 'bandpass', 5200, 3, PARTENZA_C1.suoni.sibilo, 1400));
}

/** Lo schiocco di un filo che cede. */
function suonoSchioccoC1(ritardo, tono) {
  suonaC1((ac, out, t0) => {
    const t = t0 + ritardo, V = PARTENZA_C1.suoni.schiocco;
    rumoreC1(ac, out, t, 0.05, 'highpass', 2400, 0.8, V);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(1300 * tono, t); o.frequency.exponentialRampToValueAtTime(160 * tono, t + 0.12);
    g.gain.setValueAtTime(V * 0.7, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.16);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.18);
  });
}

/** I fili che si tendono: una nota che sale e trema. */
function suonoTensioneC1(durata) {
  suonaC1((ac, out, t0) => {
    const o = ac.createOscillator(), g = ac.createGain(), trem = ac.createOscillator(), tg = ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(190, t0); o.frequency.exponentialRampToValueAtTime(560, t0 + durata);
    trem.frequency.value = 17; tg.gain.value = 9; trem.connect(tg); tg.connect(o.frequency);
    g.gain.setValueAtTime(0.0008, t0); g.gain.exponentialRampToValueAtTime(PARTENZA_C1.suoni.tensione, t0 + durata * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + durata);
    o.connect(g); g.connect(out); o.start(t0); trem.start(t0); o.stop(t0 + durata + 0.02); trem.stop(t0 + durata + 0.02);
  });
}

function suonoGiocoC1(nome) { try { if (typeof AudioSys[nome] === 'function') AudioSys[nome](); } catch (_) { /* audio facoltativo */ } }

// ===========================================================================
// 4. LA BOMBA AL LAMPIONE
// ===========================================================================
/** Bombe con cui si comincia la notte (tabella di a1); 0 se a1 non c'è. */
function bombeInizioC1() {
  return typeof BOMBE_CHIAVI_A1 === 'object' && BOMBE_CHIAVI_A1 ? BOMBE_CHIAVI_A1.inizio.bombe : 0;
}

/**
 * Gancio di T4: tasto premuto nell'hub senza nessuno con cui parlare. Solo E (il tasto delle bombe), solo
 * accanto al lampione acceso, una volta per notte. Altrimenti non fa e non dice niente.
 * @param {string} code tasto @param {{x:number,y:number}} lamp centro della cella del lampione
 * @returns {boolean} true se ha posato la bomba
 */
function hubSenzaNessunoC1(code, lamp) {
  if (code !== 'KeyE' || !lamp || statoRun.fase !== 'hub') return false;
  notteC1();
  if (c1.stato !== 'acceso' || bombeInizioC1() < PARTENZA_C1.bomba.perNotte) return false;
  const L = PARTENZA_C1.lampione;
  if (Math.hypot(player.x - lamp.x, player.y - (lamp.y + L.piedeDy)) > L.raggio) return false;
  const tot = ticksDaMs(BOMBE_CHIAVI_A1.bomba.miccaMs);
  c1.lampione = { x: lamp.x, y: lamp.y };
  c1.bomba = { x: player.x, y: player.y + PARTENZA_C1.bomba.dy, miccia: tot, tot };
  passaC1('miccia');
  suonoGiocoC1('playPasso'); // come posare una bomba in scena
  return true;
}

function scoppiaC1(b) {
  const S = PARTENZA_C1.scoppio;
  c1.scoppio = { x: b.x, y: b.y, t: 0 };
  c1.scossaT = S.scossaTick; c1.scossaTot = S.scossaTick; c1.scossaPx = S.scossaPx;
  c1.tSpento = 0;
  passaC1('spento');
  suonoGiocoC1('playEsplosione');
  suonoVetroC1();
  suonoSibiloC1();
}

function disegnaBombaC1(b, t) {
  if (typeof disegnaBombaAccesaA1 === 'function') { disegnaBombaAccesaA1(b, t); return; }
  ctx.save();
  ctx.fillStyle = '#0a0604';
  ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = t % 4 < 2 ? '#fef08a' : '#f97316';
  ctx.beginPath(); ctx.arc(b.x + 4, b.y - 9, 2, 0, TAU); ctx.fill();
  ctx.restore();
}

/** Lanterna rotta: vetro in pezzi, un filo di fumo finché dura, cocci ai piedi del palo. */
function disegnaLampioneRottoC1(lamp, t) {
  const L = PARTENZA_C1.lampione, V = PARTENZA_C1.vetro;
  const x = Math.round(lamp.x), y = Math.round(lamp.y + L.lanternaDy);
  ctx.save();
  ctx.fillStyle = '#050302';               // il vetro non c'è più
  ctx.fillRect(x - 3, y - 6, 6, 10);
  ctx.fillStyle = '#64748b';               // schegge rimaste nel telaio
  ctx.fillRect(x - 3, y - 6, 2, 3); ctx.fillRect(x + 2, y - 6, 1, 5); ctx.fillRect(x - 3, y + 2, 1, 2); ctx.fillRect(x + 1, y + 3, 2, 1);
  ctx.fillStyle = '#0a0604';               // lo sportello piegato
  ctx.fillRect(x + 5, y - 9, 2, 6); ctx.fillRect(x + 6, y - 4, 2, 2);
  if (c1.tSpento < V.fumoTick) {           // il fumo della fiamma morta
    const a = 0.38 * (1 - c1.tSpento / V.fumoTick);
    ctx.fillStyle = `rgba(203, 213, 225, ${a.toFixed(3)})`;
    for (let k = 0; k < 5; k++) ctx.fillRect(x - 1 + Math.round(Math.sin(t * 0.07 + k * 1.3) * (1.5 + k * 0.6)), y - 14 - k * 6 - ((t >> 2) % 6), 2, 4);
  }
  const py = lamp.y + L.piedeDy;            // cocci a terra (posizioni fisse)
  for (let k = 0; k < V.cocci; k++) {
    const a = k * 2.399, r = 7 + ((k * 7) % 13);
    const cx = Math.round(lamp.x + Math.cos(a) * r * 1.25), cy = Math.round(py + 2 + Math.sin(a) * r * 0.45);
    const luccica = ((t + k * 37) % 170) < 6;
    ctx.fillStyle = luccica ? '#f3dfc1' : (k % 3 ? '#94a3b8' : '#cbd5e1');
    ctx.globalAlpha = luccica ? 1 : 0.75;
    ctx.fillRect(cx, cy, k % 2 ? 2 : 1, 1);
    if (k % 4 === 0) ctx.fillRect(cx, cy - 1, 1, 1);
  }
  ctx.restore();
}

/** La piazza più buia attorno al lampione spento (un velo leggero dappertutto, più fitto dov'era la luce). */
function disegnaBuioC1(lamp) {
  const B = PARTENZA_C1.buio;
  const k = Math.min(1, c1.tSpento / B.sfumaTick);
  if (k <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(${B.colore}, ${(B.velo * k).toFixed(3)})`;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, B.raggio);
  g.addColorStop(0, `rgba(${B.colore}, ${(B.alone * k).toFixed(3)})`);
  g.addColorStop(1, `rgba(${B.colore}, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(lamp.x, lamp.y, B.raggio, 0, TAU); ctx.fill();
  ctx.restore();
}

function disegnaScoppioC1() {
  const s = c1.scoppio;
  if (!s) return;
  const S = PARTENZA_C1.scoppio;
  const u = s.t / S.durataTick;
  ctx.save();
  if (OPZIONI.lampi !== false && s.t < S.lampoTick) {
    ctx.fillStyle = `rgba(254, 240, 138, ${(S.lampoAlfa * (1 - s.t / S.lampoTick)).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }
  const r = 6 + (S.raggio - 6) * (1 - (1 - u) * (1 - u));
  ctx.strokeStyle = `rgba(${S.colore}, ${(1 - u).toFixed(3)})`;
  ctx.lineWidth = 4 * (1 - u) + 1;
  ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TAU); ctx.stroke();
  ctx.fillStyle = `rgba(254, 240, 138, ${(0.5 * (1 - u)).toFixed(3)})`;
  ctx.beginPath(); ctx.arc(s.x, s.y, r * 0.55, 0, TAU); ctx.fill();
  ctx.restore();
}

// ===========================================================================
// 5. TONINO: la domanda, la verità, la bugia, il risveglio
// ===========================================================================
/** Apre un cartiglio di T4 con le righe [chi, testo] di TESTI_C1. */
function apriDialogoC1(righe, opz) {
  if (!c1.api) return false;
  c1.api.apri(righe.map(([chi, testo]) => c1.api.voce(chi, testo)), opz || {});
  return true;
}

function apriDomandaC1() {
  apriDialogoC1(TESTI_C1.domanda, { scelta: {
    ancoraggio: 'c1:lampione', ordine: 0,
    scelta: { flag: null, opzioni: TESTI_C1.risposte.map((r) => ({ valore: r.valore, etichetta: r.etichetta })), alScegliere: rispostaC1 },
  } });
}

/** La risposta alla domanda di Tonino: 'si' (la verità) o 'no' (la bugia che lo sveglia). */
function rispostaC1(valore) {
  if (c1.stato !== 'spento') return;
  if (valore !== 'no') {
    passaC1('verita');
    apriDialogoC1(TESTI_C1.verita);
    return;
  }
  passaC1('risveglio');
  c1.risveglio = 'bugia';
  registraScopertaC1(false);
  // Stanotte Tonino è sveglio: l'indizio che b8 gli fa dire dopo una chiacchierata aspetta un'altra notte.
  try { if (typeof b8 === 'object' && b8) b8.indizioNotte = getNumeroNotte(); } catch (_) { /* b8 assente */ }
  apriDialogoC1(TESTI_C1.bugia, { poi: avviaScenaC1 });
}

function avviaScenaC1() {
  if (c1.stato !== 'risveglio') return;
  c1.risveglio = 'scena';
  c1.fili = [{ lato: -1, rotto: false, t: 0 }, { lato: 1, rotto: false, t: 0 }];
  c1.filiAlfa = 0; c1.tensione = 0;
  c1.scena = { fase: 'fermo', t: 0 };
}

function apriRicordoC1() {
  c1.risveglio = 'ricordo';
  suonoGiocoC1('playCampana');
  apriDialogoC1(TESTI_C1.ricordo.concat(TESTI_C1.fagotto), { poi: () => {
    if (c1.stato !== 'risveglio') return;
    passaC1('fagotto');
    c1.risveglio = null;
    c1.scena = { fase: 'fagotto', t: 0 };
  } });
}

function spezzaFiloC1(i) {
  const f = c1.fili && c1.fili[i];
  if (!f || f.rotto) return;
  f.rotto = true; f.t = 0;
  const P = PARTENZA_C1.scena;
  c1.scossaT = P.scossaStrappoTick; c1.scossaTot = P.scossaStrappoTick; c1.scossaPx = P.scossaStrappoPx;
  suonoSchioccoC1(0, i ? 1.15 : 0.9);
}

/** Un tick della scena dei fili (SCENA_C1). */
function avanzaScenaC1() {
  const s = c1.scena;
  const F = SCENA_C1[s.fase];
  const P = PARTENZA_C1.scena;
  if (s.t === 0 && s.fase === 'tensione') suonoTensioneC1((F.tick * MS_PER_TICK) / 1000);
  const u = s.t / F.tick;
  if (s.fase === 'fili') c1.filiAlfa = P.filiAlfa * u;
  else if (s.fase === 'tensione') { c1.filiAlfa = P.filiAlfa; c1.tensione = u; }
  else if (s.fase === 'strappo') {
    if (s.t === 0) spezzaFiloC1(0);
    if (s.t === P.secondoStrappoTick) spezzaFiloC1(1);
  }
  s.t++;
  if (s.t < F.tick) return;
  if (F.poi) { c1.scena = { fase: F.poi, t: 0 }; return; }
  c1.scena = null;
  if (s.fase === 'barcolla') apriRicordoC1();
  else if (s.fase === 'fagotto') apriArmeriaC1();
}

/**
 * Gancio di T4: quello che Tonino dice AL POSTO delle battute solite. Le scene della storia non ancora viste
 * (primo incontro, scelta del Medaglione e il suo esito) vengono prima: T4 chiama questo gancio solo dopo.
 * @param {Function} apri apriDialogo di T4 @param {Function} voce costruttore delle battute di T4
 * @returns {boolean} true se ha parlato (o se la scena è in corso): T4 non dice altro
 */
function toninoParlaC1(apri, voce) {
  c1.api = { apri, voce };
  if (statoRun.fase !== 'hub') return false;
  notteC1();
  switch (c1.stato) {
    case 'spento':
      apriDomandaC1();
      return true;
    case 'risveglio': // di norma qui la piazza è ferma; se un cartiglio è stato interrotto, si riprende da lì
      if (!c1.scena) { if (c1.risveglio === 'ricordo') apriRicordoC1(); else apriDialogoC1(TESTI_C1.bugia, { poi: avviaScenaC1 }); }
      return true;
    case 'fagotto':
      if (!c1.scena) apriDialogoC1(TESTI_C1.fagottoAncora, { poi: apriArmeriaC1 });
      return true;
    case 'sveglio': {
      const riga = TESTI_C1.sveglio[c1.ripeti % TESTI_C1.sveglio.length];
      c1.ripeti++;
      apriDialogoC1([riga]);
      return true;
    }
    default: // acceso, miccia, verita: le battute di sempre
      return false;
  }
}

/** Posa di Tonino secondo lo stato e la fase della scena (scrive in POSA_C1). */
function posaToninoC1(t) {
  const p = POSA_C1;
  p.ox = 0; p.oy = 0; p.rot = 0; p.testa = 0; p.occhi = 0; p.aperti = false; p.bocca = false; p.braccia = '';
  const versoFerruccio = player.x >= c1.tonino.x ? 1 : -1;
  if (c1.stato === 'spento') { p.occhi = 1; return p; } // guarda il lampione
  p.aperti = true; p.occhi = versoFerruccio;
  const s = c1.scena;
  if (c1.stato === 'risveglio') {
    if (!s) { if (c1.risveglio === 'ricordo') { p.testa = 1; p.occhi = 0; p.bocca = true; } return p; }
    const u = s.t / SCENA_C1[s.fase].tick;
    if (s.fase === 'fili') p.occhi = 0;
    else if (s.fase === 'tensione') { p.occhi = 0; p.oy = -Math.round(2 * u); p.ox = Math.sin(t * 1.3) * 0.7 * u; p.braccia = 'larghe'; }
    else if (s.fase === 'strappo') {
      const dopo = s.t >= PARTENZA_C1.scena.secondoStrappoTick;
      p.occhi = 0; p.bocca = true; p.braccia = 'larghe';
      p.ox = dopo ? -1 : 3; p.oy = dopo ? 1 : -1; p.rot = dopo ? -0.05 : 0.1;
    } else if (s.fase === 'barcolla') {
      const smorza = 1 - u;
      p.ox = Math.sin(u * 10) * 5 * smorza; p.rot = Math.sin(u * 10 + 1) * 0.14 * smorza;
      p.testa = limitaC1((u - 0.5) / 0.35, 0, 1); p.occhi = 0; p.bocca = u < 0.5; p.braccia = u < 0.6 ? 'larghe' : '';
    }
    return p;
  }
  if (s && s.fase === 'fagotto') { // si china sotto il banchetto e si rialza
    const u = s.t / SCENA_C1.fagotto.tick;
    const giu = Math.sin(Math.min(1, u / 0.7) * Math.PI);
    p.testa = Math.max(0, 1 - u * 3); p.oy = Math.round(giu * 4); p.ox = -giu * 3; p.occhi = -1; p.braccia = u > 0.55 ? 'porge' : '';
    return p;
  }
  p.oy = Math.sin(t * 0.04) * 0.6; // sveglio: respira piano, non lustra più niente
  if (c1.stato === 'fagotto') p.braccia = 'porge';
  return p;
}

/**
 * Gancio di T4: disegna Tonino quando non è quello di sempre (guarda il lampione, la scena dei fili, sveglio).
 * @returns {boolean} true se l'ha disegnato (T4 non lo ridisegna)
 */
function disegnaToninoC1(x, y, t) {
  c1.tonino.x = x; c1.tonino.y = y;
  if (statoRun.fase !== 'hub') return false;
  notteC1();
  if (c1.stato === 'acceso' || c1.stato === 'miccia' || c1.stato === 'verita') return false;
  const p = posaToninoC1(t);
  ctx.save();
  ctx.fillStyle = 'rgba(8, 5, 3, 0.6)';
  ctx.beginPath(); ctx.ellipse(x, y + 10, 12, 4, 0, 0, TAU); ctx.fill();
  ctx.translate(Math.round(x + p.ox), Math.round(y + p.oy));
  if (p.rot) { ctx.translate(0, 12); ctx.rotate(p.rot); ctx.translate(0, -12); }
  const su = Math.round(p.testa * 2);
  ctx.fillStyle = '#0a0604';
  ctx.fillRect(-9, -20, 18, 28);                 // corpo
  ctx.fillRect(-6, 8, 4, 4); ctx.fillRect(2, 8, 4, 4);
  ctx.fillRect(-7, -32 - su, 14, 13 + su);       // testa (si alza)
  ctx.fillRect(-9, -35 - su, 18, 5);             // berretto
  if (p.braccia === 'larghe') { ctx.fillRect(-15, -16, 6, 4); ctx.fillRect(9, -16, 6, 4); }
  else if (p.braccia === 'porge') ctx.fillRect(9, -10, 6, 4);
  ctx.fillStyle = '#1f1510';
  ctx.fillRect(-7, -18, 14, 24);
  ctx.fillStyle = '#f3dfc1';
  ctx.fillRect(-6, -10, 12, 16);                 // grembiule
  ctx.fillStyle = '#c9a679';
  ctx.fillRect(-5, -29 - su, 10, 8);             // volto
  ctx.fillStyle = '#0a0604';
  const oy = -27 - su - Math.round(p.testa);     // gli occhi salgono nel volto: guarda in alto
  const oh = p.aperti ? 3 : 2;
  ctx.fillRect(-3 + p.occhi, oy, 2, oh); ctx.fillRect(2 + p.occhi, oy, 2, oh);
  ctx.fillRect(-3, -23 - su, 6, 1);              // baffi
  if (p.bocca) ctx.fillRect(-1, -22 - su, 2, 1);
  ctx.fillStyle = '#9c4c12';
  ctx.fillRect(-8, -34 - su, 16, 3);
  ctx.restore();
  return true;
}

/** I due fili d'oro di Tonino: interi (si tendono), poi il capo che frusta verso la Mano e il moncone sulla spalla. */
function disegnaFiliToninoC1(t) {
  const F = c1.fili;
  if (!F) return;
  const P = PARTENZA_C1.scena, G = FEEL.fili;
  ctx.save();
  ctx.strokeStyle = G.colore; ctx.lineCap = 'round';
  for (const f of F) {
    const mano = f.lato < 0 ? G.manoSinistra : G.manoDestra;
    const ax = mano[0], ay = mano[1];
    const bx = c1.tonino.x + POSA_C1.ox + f.lato * P.spallaDx, by = c1.tonino.y + POSA_C1.oy + P.spallaDy;
    if (!f.rotto) {
      if (c1.filiAlfa <= 0) continue;
      const trema = c1.tensione > 0.4 ? Math.sin(t * 1.7 + f.lato) * 0.8 * c1.tensione : 0;
      ctx.globalAlpha = c1.filiAlfa; ctx.lineWidth = 1 + c1.tensione * 0.6;
      ctx.beginPath(); ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo((ax + bx) / 2 + trema, (ay + by) / 2 + G.curvaPx * (1 - c1.tensione), bx, by);
      ctx.stroke();
      continue;
    }
    const u = Math.min(1, f.t / P.frustaTick), e = 1 - (1 - u) * (1 - u);
    const cx = (ax + bx) / 2, cy = (ay + by) / 2;
    if (u < 1) { // il capo di sopra frusta indietro verso la Mano
      const fine = P.rottura * (1 - 0.8 * e), passi = 12;
      ctx.globalAlpha = P.filiAlfa * Math.pow(1 - u, 0.7); ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i <= passi; i++) {
        const q = (fine * i) / passi, r = 1 - q;
        let x = r * r * ax + 2 * r * q * cx + q * q * bx, y = r * r * ay + 2 * r * q * cy + q * q * by;
        const onda = Math.sin(i * 1.5 - f.t * 1.1) * P.frustaPx * (i / passi) * (1 - e);
        x += onda * f.lato; y -= Math.abs(onda) * 0.35;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    if (f.t < 5) { // la scintilla dello strappo
      const q = P.rottura, r = 1 - q;
      const x = r * r * ax + 2 * r * q * cx + q * q * bx, y = r * r * ay + 2 * r * q * cy + q * q * by;
      ctx.globalAlpha = 1 - f.t / 5; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke();
    }
    // il moncone resta sulla spalla per tutta la notte
    const dond = Math.sin(t * 0.07 + f.lato) * (f.t < 60 ? 2.4 - f.t * 0.02 : 1.2);
    ctx.globalAlpha = 0.9; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + f.lato * 4 + dond, by + P.monconePx * 0.3, bx + f.lato * 5 + dond * 1.4, by + P.monconePx);
    ctx.stroke();
  }
  ctx.restore();
}

/** Le Mani sopra la piazza, visibili solo per il tempo della scena (quello che Tonino vede). */
function disegnaManiC1(t) {
  if (c1.maniAlfa <= 0.01 || typeof disegnaManoMarionettaPittorica !== 'function') return;
  ctx.save();
  ctx.globalAlpha = c1.maniAlfa;
  disegnaManoMarionettaPittorica(216, 25, 1, 0.95, t, false);
  disegnaManoMarionettaPittorica(424, 25, -1, 0.95, t + 12, false);
  ctx.restore();
}

/** Il fagotto ai piedi di Tonino: legato finché non si sceglie, aperto dopo. */
function disegnaFagottoC1(x, y, aperto, t) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 5, 3, 0.5)';
  ctx.beginPath(); ctx.ellipse(x, y + 4, 10, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0a0604';
  if (!aperto) {
    ctx.fillRect(x - 7, y - 6, 14, 10); ctx.fillRect(x - 2, y - 10, 4, 4);
    ctx.fillStyle = '#7a4a22'; ctx.fillRect(x - 6, y - 5, 12, 8);
    ctx.fillStyle = '#5c3a1e'; ctx.fillRect(x - 6, y, 12, 3);
    ctx.fillStyle = '#c9a679'; ctx.fillRect(x - 6, y - 2, 12, 1); ctx.fillRect(x - 1, y - 9, 2, 3);
  } else {
    ctx.fillRect(x - 11, y - 3, 22, 7);
    ctx.fillStyle = '#7a4a22'; ctx.fillRect(x - 10, y - 2, 20, 5);
    ctx.fillStyle = '#5c3a1e'; ctx.fillRect(x - 10, y + 1, 20, 2);
    ctx.fillStyle = '#c9a679'; ctx.fillRect(x - 12, y - 4, 4, 1); ctx.fillRect(x + 8, y - 4, 4, 1);
    if (!c1.fagotto) { // qualcosa luccica ancora dentro
      ctx.fillStyle = '#f9cb40';
      for (let k = 0; k < 3; k++) if (((t >> 3) + k * 2) % 5 < 3) ctx.fillRect(x - 6 + k * 5, y - 3 + (k % 2), 2, 2);
    }
  }
  ctx.restore();
}

/**
 * Gancio di T4: cose in più sulla piazza, nella lista ordinata per profondità di disegnaHub ({ y, d }).
 * @param {Array<{y:number,d:Function}>} cose @param {number} t tick @param {{x:number,y:number}} lamp lampione
 */
function coseHubC1(cose, t, lamp) {
  notteC1();
  c1.lampione = lamp;
  if (c1.bomba) { const b = c1.bomba; cose.push({ y: b.y + 9, d: () => disegnaBombaC1(b, t) }); }
  if (lampioneSpentoC1()) {
    cose.push({ y: lamp.y + 10.5, d: () => disegnaLampioneRottoC1(lamp, t) });
    cose.push({ y: 1e6, d: () => disegnaBuioC1(lamp) });
  }
  const fagottoInVista = c1.stato === 'sveglio' || (c1.stato === 'fagotto' && (!c1.scena || c1.scena.t > SCENA_C1.fagotto.tick * 0.6));
  if (fagottoInVista) cose.push({ y: c1.tonino.y + 14.5, d: () => disegnaFagottoC1(c1.tonino.x + 15, c1.tonino.y + 8, c1.stato === 'sveglio' || armeriaApertaC1(), t) });
  if (c1.fili || c1.maniAlfa > 0.01) cose.push({ y: 2e6, d: () => { disegnaManiC1(t); disegnaFiliToninoC1(t); } });
  if (c1.scoppio) cose.push({ y: 3e6, d: disegnaScoppioC1 });
}

/** Gancio di T4: la piazza è ferma (scena dei fili o fagotto aperto)? */
function hubFermoC1() {
  return statoRun.fase === 'hub' && (Boolean(c1.scena) || armeriaApertaC1());
}

/** Un tick di logica nell'hub (non in pausa): miccia, scoppio, scena, sfumature. */
function passoHubC1() {
  notteC1();
  const b = c1.bomba;
  if (b && --b.miccia <= 0) { c1.bomba = null; scoppiaC1(b); }
  if (c1.scoppio && ++c1.scoppio.t > PARTENZA_C1.scoppio.durataTick) c1.scoppio = null;
  if (c1.scossaT > 0) c1.scossaT--;
  if (lampioneSpentoC1()) c1.tSpento++;
  if (c1.fermaQA) return;
  if (c1.fili) for (const f of c1.fili) if (f.rotto) f.t++;
  if (c1.scena && !dialogoApertoC1()) avanzaScenaC1();
  const maniSu = c1.stato === 'risveglio' && (c1.risveglio === 'ricordo' || (c1.scena && c1.scena.fase !== 'fermo'));
  const P = PARTENZA_C1.scena;
  c1.maniAlfa = limitaC1(c1.maniAlfa + (maniSu ? P.maniPasso : -P.maniPasso), 0, P.maniAlfa);
  const A = c1.armeria;
  if (A && A.avviso && tick > A.avviso.fino) A.avviso = null;
}

// ===========================================================================
// 6. IL FAGOTTO DI TONINO (il pannello della Stanza dello Sviluppatore, modo «c1»)
// ===========================================================================
const nomeCortoC1 = (s) => String(s || '').replace(/\s*\(.*?\)/g, '');
const eNegativoC1 = (o) => o.polarita === 'negativo' || o.tier === 'negativo';

/** Oggetto di qualunque catalogo per id. */
function trovaC1(id) {
  if (!id) return null;
  return CATALOGO_OGGETTI.find((o) => o.id === id) || CATALOGO_PATTO.find((o) => o.id === id) || CATALOGO_SEGRETO.find((o) => o.id === id) || null;
}

/**
 * Le armi fra cui scegliere: per prima quella «di sempre» (le freccette, o l'arma con cui il personaggio sale in
 * scena), poi tutte le armi speciali intercambiabili che il gioco ha davvero (eArmaSpeciale, 50-oggetti.js).
 * @returns {Array<object>} voci { id (null = di sempre), nome, statsDesc, lore, sprite, tier }
 */
function listaArmiC1() {
  const T = TESTI_C1.armeria;
  const pInfo = getCharCorrente();
  const sua = pInfo && pInfo.passivoIniziale ? trovaC1(pInfo.passivoIniziale) : null;
  const diSempre = sua && eArmaSpeciale(sua) ? sua : null;
  const voci = [{
    id: null, tier: 'base', sprite: diSempre ? diSempre.sprite : 'freccetteC1',
    nome: diSempre ? T.diSempre(nomeCortoC1(diSempre.nome)) : T.freccette, statsDesc: T.freccetteEffetto, lore: diSempre ? (diSempre.lore || '') : T.freccetteLore,
  }];
  for (const o of CATALOGO_OGGETTI.concat(CATALOGO_PATTO, CATALOGO_SEGRETO)) {
    if (eArmaSpeciale(o) && !(diSempre && o.id === diSempre.id)) voci.push(o);
  }
  return voci;
}

/** I potenziamenti fra cui scegliere: tutti i passivi di CATALOGO_OGGETTI tranne le armi; i negativi in fondo. */
function listaDoniC1() {
  const passivi = CATALOGO_OGGETTI.filter((o) => !eArmaSpeciale(o));
  return passivi.filter((o) => !eNegativoC1(o)).concat(passivi.filter(eNegativoC1));
}

/** Apre il fagotto (o lo riapre com'era). Usa statoRun.pannelloB: per il resto del gioco è «un pannello aperto». */
function apriArmeriaC1() {
  if (c1.stato !== 'fagotto' || statoRun.fase !== 'hub') return false;
  if (!c1.armeria) c1.armeria = { passo: 'arma', armi: listaArmiC1(), doni: listaDoniC1(), arma: null, scelti: [], selArma: 0, selDoni: 0, barra: false, avviso: null };
  const A = c1.armeria;
  A.barra = false;
  statoRun.pannelloB = { sel: A.passo === 'arma' ? A.selArma : A.selDoni, c1: A };
  for (const k in keys) keys[k] = false; // nessun tasto resta «premuto» sotto il pannello
  suonoGiocoC1('playPasso');
  return true;
}

function avvisoArmeriaC1(A, testo) {
  A.avviso = { testo, fino: tick + PARTENZA_C1.armeria.avvisoTick };
  suonoGiocoC1('playColpo');
}

function perPaginaC1() {
  return typeof perPaginaPannelloB5 === 'function' ? perPaginaPannelloB5() : OGGETTI_B.sviluppatore.colonne * 6;
}

/** Cella `i` del primo passo (le armi): una fila sola, al centro. */
function cellaArmaC1(i, n) {
  const G = PARTENZA_C1.armeria;
  const L = Math.min(G.armaL, Math.floor(G.armaLMax / Math.max(1, n)));
  const x0 = Math.round((W - n * L) / 2);
  return { x: x0 + i * L, y: G.armaY, w: L - 6, h: G.armaA };
}

/** Riquadro del posto `k` del fagotto nella barra in basso (k = -1: l'arma). */
function postoC1(k) {
  const B = PARTENZA_C1.armeria.barra;
  return { x: k < 0 ? B.armaX : B.doniX + k * B.passo, y: B.y, w: B.lato, h: B.lato };
}

const dentroC1 = (mx, my, r) => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;

function scegliArmaC1(p, i) {
  const A = p.c1;
  if (!A.armi[i]) return;
  A.arma = i; A.selArma = i;
  A.passo = 'doni'; A.barra = false;
  p.sel = A.selDoni;
  suonoGiocoC1('playMoneta');
}

function cambiaDonoC1(A, i) {
  const o = A.doni[i];
  if (!o) return;
  const k = A.scelti.indexOf(o.id);
  if (k >= 0) { A.scelti.splice(k, 1); suonoGiocoC1('playPasso'); return; }
  if (A.scelti.length >= PARTENZA_C1.armeria.doni) { avvisoArmeriaC1(A, TESTI_C1.armeria.pieno); return; }
  A.scelti.push(o.id);
  suonoGiocoC1('playMoneta');
}

function cambiaPaginaC1(p, passo) {
  const A = p.c1, perPag = perPaginaC1();
  const pagine = Math.max(1, Math.ceil(A.doni.length / perPag));
  const pag = (Math.floor(p.sel / perPag) + passo + pagine) % pagine;
  p.sel = Math.min(A.doni.length - 1, pag * perPag + (p.sel % perPag));
  A.selDoni = p.sel;
  suonoGiocoC1('playPasso');
}

/** Conferma esplicita: solo con tutti i posti pieni. Chiude il fagotto e lo tiene pronto per l'inizio della run. */
function confermaArmeriaC1(p) {
  const A = p.c1, G = PARTENZA_C1.armeria;
  const manca = G.doni - A.scelti.length;
  if (A.arma === null || manca > 0) { avvisoArmeriaC1(A, TESTI_C1.armeria.nonAncora(Math.max(1, manca))); return false; }
  const arma = A.armi[A.arma];
  c1.fagotto = { arma: arma.id || null, armaNome: nomeCortoC1(arma.nome), doni: A.scelti.slice(0, G.doni), consegnato: false };
  statoRun.pannelloB = null;
  passaC1('sveglio');
  registraScopertaC1(true);
  suonoGiocoC1('playCampana');
  apriDialogoC1(TESTI_C1.congedo);
  return true;
}

/** Tasti del fagotto: frecce/WASD, Invio/E/Spazio, PagSu/PagGiù, Esc (indietro). */
function tastoArmeriaC1(p, code, ripetuto) {
  const A = p.c1;
  const sx = code === 'ArrowLeft' || code === 'KeyA', dx = code === 'ArrowRight' || code === 'KeyD';
  const su = code === 'ArrowUp' || code === 'KeyW', giu = code === 'ArrowDown' || code === 'KeyS';
  const ok = code === 'Enter' || code === 'NumpadEnter' || code === 'KeyE' || code === 'Space';
  if ((ok || code === 'Escape') && ripetuto) return;
  if (A.passo === 'arma') {
    const n = A.armi.length;
    if (sx) p.sel = (p.sel - 1 + n) % n;
    else if (dx) p.sel = (p.sel + 1) % n;
    else if (ok) { scegliArmaC1(p, p.sel); return; }
    else if (code === 'Escape') { statoRun.pannelloB = null; return; } // il fagotto resta da Tonino
    A.selArma = p.sel;
    return;
  }
  const n = A.doni.length, C = OGGETTI_B.sviluppatore.colonne, perPag = perPaginaC1();
  if (code === 'Escape') { A.passo = 'arma'; A.barra = false; A.selDoni = p.sel; p.sel = A.selArma; return; }
  if (code === 'PageDown') { cambiaPaginaC1(p, 1); return; }
  if (code === 'PageUp') { cambiaPaginaC1(p, -1); return; }
  if (A.barra) {
    if (su) A.barra = false;
    else if (sx) cambiaPaginaC1(p, -1);
    else if (dx) cambiaPaginaC1(p, 1);
    else if (ok) confermaArmeriaC1(p);
    return;
  }
  if (sx) p.sel = (p.sel - 1 + n) % n;
  else if (dx) p.sel = (p.sel + 1) % n;
  else if (su) { if (p.sel - C >= 0 && Math.floor((p.sel - C) / perPag) === Math.floor(p.sel / perPag)) p.sel -= C; }
  else if (giu) {
    if (p.sel + C < n && Math.floor((p.sel + C) / perPag) === Math.floor(p.sel / perPag)) p.sel += C;
    else A.barra = true; // sotto l'ultima fila c'è la conferma
  } else if (ok) cambiaDonoC1(A, p.sel);
  A.selDoni = p.sel;
}

/** Click nel fagotto: una cella si seleziona, un secondo click la mette o la toglie (come nel pannello di base). */
function clickArmeriaC1(p, mx, my) {
  const A = p.c1, G = PARTENZA_C1.armeria;
  if (A.passo === 'arma') {
    for (let i = 0; i < A.armi.length; i++) {
      if (!dentroC1(mx, my, cellaArmaC1(i, A.armi.length))) continue;
      if (p.sel === i) scegliArmaC1(p, i); else { p.sel = i; A.selArma = i; }
      return;
    }
    return;
  }
  for (let i = 0; i < A.doni.length; i++) {
    if (!dentroC1(mx, my, cellaPannelloB(i))) continue;
    if (p.sel === i && !A.barra) cambiaDonoC1(A, i); else { p.sel = i; A.selDoni = i; A.barra = false; }
    return;
  }
  if (dentroC1(mx, my, G.conferma)) { A.barra = true; confermaArmeriaC1(p); return; }
  if (dentroC1(mx, my, postoC1(-1))) { tastoArmeriaC1(p, 'Escape', false); return; } // l'arma: si torna a sceglierla
  for (let k = 0; k < A.scelti.length; k++) {
    if (dentroC1(mx, my, postoC1(k))) { A.scelti.splice(k, 1); suonoGiocoC1('playPasso'); return; } // un posto pieno: si svuota
  }
  const P = G.pagine;
  if (my >= P.y - 12 && my <= P.y + 6) {
    if (mx >= P.x - 4 && mx <= P.x + P.l) cambiaPaginaC1(p, -1);
    else if (mx >= P.x + 76 && mx <= P.x + 80 + P.l) cambiaPaginaC1(p, 1);
  }
}

function iconaC1(o, x, y, scala) {
  drawPixelSprite(SPRITE_OGGETTI[o.sprite] || SPRITE_OGGETTI.spada, x, y, scala);
}

/** Nome ed effetto come li mostra il fagotto (Tonino vede le cose come sono, se la tabella lo dice). */
function visibileC1(o) {
  return PARTENZA_C1.armeria.mostraIgnoti || !o.id || conosciutoD(o.id);
}

function disegnaDettaglioC1(o, y, larghezza) {
  const K = PARTENZA_C1.armeria.colori, T = TESTI_C1.armeria;
  if (!o) return;
  const noto = visibileC1(o);
  const effetto = noto ? String(o.statsDesc || '').replace(/^\[[^\]]*PATTO\]\s*/, '') : 'Effetto: ???';
  drawTextFit(noto ? o.nome : '???', W / 2, y, larghezza, { size: 9, color: K.nome });
  drawTextFit(effetto, W / 2, y + 12, larghezza, { size: 8, color: K.effetto });
  const nota = o.tier === 'patto' ? T.senzaPatto : eNegativoC1(o) ? T.negativo : (noto ? (o.lore || '') : '');
  drawTextFit(nota, W / 2, y + 23, larghezza, { size: 7.5, color: o.tier === 'patto' || eNegativoC1(o) ? K.avviso : K.lore, weight: '', style: 'italic' });
}

/** Disegna il fagotto: primo passo le armi, secondo la griglia a pagine dei potenziamenti con la barra in basso. */
function disegnaArmeriaC1(p) {
  const A = p.c1, G = PARTENZA_C1.armeria, K = G.colori, T = TESTI_C1.armeria;
  const pad = typeof b3 === 'object' && b3 && b3.dispositivo === 'pad';
  ctx.save();
  ctx.fillStyle = K.velo;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = K.fondo; ctx.strokeStyle = K.oro; ctx.lineWidth = 2;
  ctx.fillRect(28, 22, W - 56, H - 40);
  ctx.strokeRect(28, 22, W - 56, H - 40);
  ctx.strokeStyle = K.bordo; ctx.lineWidth = 1;
  ctx.strokeRect(32, 26, W - 64, H - 48);
  if (A.passo === 'arma') {
    drawTextFit(T.titoloArma, W / 2, 40, W - 80, { size: 10, color: K.oro });
    const n = A.armi.length;
    for (let i = 0; i < n; i++) {
      const o = A.armi[i], c = cellaArmaC1(i, n), sel = i === p.sel, presa = A.arma === i;
      ctx.fillStyle = sel ? K.cursore : presa ? K.scelto : K.cella;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = sel ? '#ffffff' : presa ? K.oro : K.comune;
      ctx.lineWidth = sel ? 2 : 1;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      iconaC1(o, c.x + c.w / 2, c.y + 22, 2.4);
      drawTextFit(visibileC1(o) ? nomeCortoC1(o.nome) : '???', c.x + c.w / 2, c.y + c.h - 6, c.w - 6, { size: 6.5, color: sel ? '#ffffff' : K.lore, shadow: false });
      if (presa) drawTextFit('✓', c.x + c.w - 8, c.y + 11, 12, { size: 9, color: K.oro });
    }
    const o = A.armi[p.sel];
    if (o) { iconaC1(o, W / 2, 168, 5); disegnaDettaglioC1(o, 222, W - 100); }
    drawTextFit(T.citazione, W / 2, 284, W - 120, { size: 9, color: K.aiuto, weight: '', style: 'italic' });
  } else {
    const n = A.doni.length, perPag = perPaginaC1();
    drawTextFit(T.titoloDoni(A.scelti.length, G.doni), W / 2, 40, W - 80, { size: 10, color: K.oro });
    const pag = Math.floor(p.sel / perPag);
    for (let i = pag * perPag; i < Math.min(n, (pag + 1) * perPag); i++) {
      const o = A.doni[i], c = cellaPannelloB(i), sel = i === p.sel && !A.barra, scelto = A.scelti.includes(o.id), neg = eNegativoC1(o);
      ctx.fillStyle = sel ? K.cursore : scelto ? K.scelto : K.cella;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = sel ? '#ffffff' : scelto ? K.oro : neg ? K.negativo : o.tier === 'forte' ? '#8a6a2a' : K.comune;
      ctx.lineWidth = sel || scelto ? 2 : 1;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      iconaC1(o, c.x + c.w / 2, c.y + 13, 1.4);
      drawTextFit(visibileC1(o) ? nomeCortoC1(o.nome) : '???', c.x + c.w / 2, c.y + c.h - 4, c.w - 4, { size: 6.5, color: sel || scelto ? '#ffffff' : neg ? '#fca5a5' : K.lore, shadow: false });
      if (scelto) {
        ctx.fillStyle = K.oro; ctx.fillRect(c.x + c.w - 11, c.y + 2, 9, 9);
        drawTextFit('✓', c.x + c.w - 6.5, c.y + 9.5, 9, { size: 7.5, color: '#140c08', shadow: false });
      }
    }
    disegnaDettaglioC1(A.barra ? null : A.doni[p.sel], G.dettaglioY, W - 80);
    if (A.barra) drawTextFit(A.scelti.length >= G.doni ? T.conferma : T.mancano(G.doni - A.scelti.length), W / 2, G.dettaglioY + 12, W - 80, { size: 8.5, color: K.oro });
    // la barra del fagotto: l'arma, i dieci posti, le pagine, la conferma
    const arma = A.armi[A.arma];
    const ra = postoC1(-1);
    ctx.fillStyle = K.scelto; ctx.fillRect(ra.x, ra.y, ra.w, ra.h);
    ctx.strokeStyle = K.oro; ctx.lineWidth = 1; ctx.strokeRect(ra.x, ra.y, ra.w, ra.h);
    if (arma) iconaC1(arma, ra.x + ra.w / 2, ra.y + ra.h / 2, 1.2);
    for (let k = 0; k < G.doni; k++) {
      const r = postoC1(k), o = trovaC1(A.scelti[k]);
      ctx.fillStyle = o ? K.scelto : K.cella; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = o ? K.oro : K.bordo; ctx.strokeRect(r.x, r.y, r.w, r.h);
      if (o) iconaC1(o, r.x + r.w / 2, r.y + r.h / 2, 1.2);
    }
    drawTextFit(`${A.scelti.length}/${G.doni}`, G.barra.doniX + G.doni * G.barra.passo + 22, G.barra.y + 14, 44, { size: 10, color: A.scelti.length >= G.doni ? K.nome : K.oro });
    const pagine = Math.max(1, Math.ceil(n / perPag)), P = G.pagine;
    drawTextFit('‹', P.x + 4, P.y, P.l, { size: 11, color: K.oro });
    drawTextFit(T.pagina(pag + 1, pagine), P.x + 44, P.y - 1, 60, { size: 7.5, color: K.aiuto });
    drawTextFit('›', P.x + 84, P.y, P.l, { size: 11, color: K.oro });
    const B = G.conferma, pronto = A.scelti.length >= G.doni;
    ctx.fillStyle = pronto ? K.rosso : K.spento;
    ctx.fillRect(B.x, B.y, B.w, B.h);
    ctx.strokeStyle = A.barra ? '#ffffff' : pronto ? K.oro : K.bordo;
    ctx.lineWidth = A.barra ? 2 : 1;
    if (pronto && !A.barra) ctx.globalAlpha = 0.75 + 0.25 * Math.sin(performance.now() / 180);
    ctx.strokeRect(B.x, B.y, B.w, B.h);
    ctx.globalAlpha = 1;
    drawTextFit(pronto ? 'CONFERMA' : T.mancano(G.doni - A.scelti.length), B.x + B.w / 2, B.y + 15, B.w - 10, { size: 9, color: pronto ? '#ffffff' : K.aiuto });
  }
  if (A.avviso) drawTextFit(A.avviso.testo, W / 2, G.aiutoY, W - 80, { size: 8.5, color: K.avviso });
  else drawTextFit(A.passo === 'arma' ? (pad ? T.aiutoArmaPad : T.aiutoArma) : (pad ? T.aiutoDoniPad : T.aiutoDoni), W / 2, G.aiutoY, W - 76, { size: 7.5, color: K.aiuto, weight: '' });
  ctx.restore();
}

// ===========================================================================
// 7. LA CONSEGNA (inizio della run), IL REGISTRO E IL DIARIO
// ===========================================================================
/** Dà davvero al giocatore l'arma e i potenziamenti scelti: stessi passi di un oggetto raccolto in scena. */
function consegnaFagottoC1(f) {
  const P = statoRun.poolRunB;
  const dai = (id) => {
    const o = trovaC1(id);
    if (!o) return;
    if (P && P.rimasti.includes(id)) P.rimasti.splice(P.rimasti.indexOf(id), 1); // non riesce dal pool della notte
    acquisisciOggettoConLimite5Slot({ ...o }, 'tonino', null);
  };
  if (f.arma) dai(f.arma);
  for (const id of f.doni) dai(id);
  f.consegnato = true;
}

/** Dopo `nuovaRun`: la bomba usata al lampione manca, e il fagotto confermato si consegna (una volta sola). */
function dopoNuovaRunC1() {
  if (c1.notte !== getNumeroNotte() || c1.slot !== slotC1()) return; // un'altra notte: niente da portare
  if (c1.stato !== 'acceso' && typeof aggiungiBombe === 'function') aggiungiBombe(-PARTENZA_C1.bomba.perNotte);
  if (statoRun.pannelloB && statoRun.pannelloB.c1) statoRun.pannelloB = null;
  const f = c1.fagotto;
  if (!f || f.consegnato) return;
  consegnaFagottoC1(f);
  c1.runSegreta = statoRun.numeroRun;
  try { if (typeof a7 === 'object' && a7 && a7.run) a7.run.partenzaSegreta = true; } catch (_) { /* a7 assente */ }
  mostraBanner(TESTI_C1.banner(f.armaNome, f.doni.length), 260);
}

// ===========================================================================
// 8. AVVOLGIMENTI (chiamano sempre la base)
// ===========================================================================
const passoLogicoBaseC1 = passoLogico;
passoLogico = function passoLogicoC1(...args) {
  const r = passoLogicoBaseC1.apply(this, args);
  try {
    if (statoRun.fase === 'hub') { if (!statoRun.pausa) passoHubC1(); }
    else if (statoRun.pannelloB && statoRun.pannelloB.c1) statoRun.pannelloB = null; // il fagotto vive solo in piazza
  } catch (err) { console.error('[c1] passo', err); }
  return r;
};

const nuovaRunBaseC1 = nuovaRun;
nuovaRun = function nuovaRunC1(...args) {
  const r = nuovaRunBaseC1.apply(this, args);
  try { dopoNuovaRunC1(); } catch (err) { console.error('[c1] nuova run', err); }
  return r;
};

const t4GancioBaseC1 = t4Gancio;
t4Gancio = function t4GancioC1(nome, ...args) {
  const inPiazza = statoRun.fase === 'hub';
  try {
    if (inPiazza && armeriaApertaC1() && !statoRun.pausa) { // il nostro riquadro è aperto: prende tasti e click
      if (nome === 'tasto') { tastoPannelloB(args[0].code, Boolean(args[0].repeat)); return true; }
      if (nome === 'click') { clickPannelloB(args[0], args[1]); return true; }
    }
    // la scena dei fili non si interrompe: tasti e click aspettano (Esc apre comunque il menu di pausa)
    if (inPiazza && c1.scena && !statoRun.pausa && !dialogoApertoC1()
      && ((nome === 'tasto' && args[0].code !== 'Escape') || nome === 'click')) return true;
  } catch (err) { console.error('[c1]', nome, err); }
  const scossa = nome === 'disegna' && inPiazza && c1.scossaT > 0 && OPZIONI.scossa > 0;
  if (scossa) { // la piazza trema un attimo (scoppio, fili che cedono)
    const k = (c1.scossaT / c1.scossaTot) * c1.scossaPx * limitaC1(Number(OPZIONI.scossa) || 0, 0, 1);
    ctx.save();
    ctx.translate(Math.round(Math.sin(tick * 2.3) * k), Math.round(Math.cos(tick * 3.1) * k));
  }
  let r;
  try { r = t4GancioBaseC1(nome, ...args); } finally { if (scossa) ctx.restore(); }
  try { if (nome === 'sopra' && statoRun.fase === 'hub' && armeriaApertaC1()) disegnaPannelloSviluppatoreB(); } catch (err) { console.error('[c1] fagotto', err); }
  return r;
};

const tastoPannelloBBaseC1 = tastoPannelloB;
tastoPannelloB = function tastoPannelloC1(code, ...resto) {
  const p = statoRun.pannelloB;
  if (p && p.c1) { try { tastoArmeriaC1(p, code, Boolean(resto[0])); } catch (err) { console.error('[c1] tasti', err); } return true; }
  return tastoPannelloBBaseC1.call(this, code, ...resto);
};

const clickPannelloBBaseC1 = clickPannelloB;
clickPannelloB = function clickPannelloC1(mx, my, ...resto) {
  const p = statoRun.pannelloB;
  if (p && p.c1) { try { clickArmeriaC1(p, mx, my); } catch (err) { console.error('[c1] click', err); } return true; }
  return clickPannelloBBaseC1.call(this, mx, my, ...resto);
};

const disegnaPannelloBBaseC1 = disegnaPannelloSviluppatoreB;
disegnaPannelloSviluppatoreB = function disegnaPannelloC1(...args) {
  const p = statoRun.pannelloB;
  if (p && p.c1) { disegnaArmeriaC1(p); return undefined; }
  return disegnaPannelloBBaseC1.apply(this, args);
};

// Registro di a7: una riga in più nella pergamena di fine run
if (typeof disegnaPergamenaA7 === 'function') {
  const disegnaPergamenaBaseC1 = disegnaPergamenaA7;
  disegnaPergamenaA7 = function disegnaPergamenaC1(...args) {
    const r = disegnaPergamenaBaseC1.apply(this, args);
    try {
      const v = a7.pergamena && a7.pergamena.voce;
      if (v && v.partenzaSegreta) {
        const P = CONFIG_A7.pergamena, y = P.y + 70 + 10 * 17, x = P.x + 26; // sotto le dieci righe della colonna sinistra
        drawTextFit(`${TESTI_C1.pergamena[0]}:`, x, y, 120, { size: 7.5, color: '#6b4423', shadow: false, align: 'left' });
        drawTextFit(TESTI_C1.pergamena[1], x, y + 13, P.w / 2 - 36, { size: 8, color: '#7f1d1d', shadow: false, align: 'left' });
      }
    } catch (err) { console.error('[c1] pergamena', err); }
    return r;
  };
}

// Diario di Ferruccio di b8: una riga nella pagina di quella notte (dopo l'apertura)
if (typeof componiPaginaB8 === 'function') {
  const componiPaginaBaseC1 = componiPaginaB8;
  componiPaginaB8 = function componiPaginaC1(v, nota, ...resto) {
    const pagina = componiPaginaBaseC1.call(this, v, nota, ...resto);
    try {
      const segreta = Boolean(v && v.partenzaSegreta) || Boolean(nota && c1.runSegreta !== null && nota.run === c1.runSegreta);
      if (segreta && pagina && Array.isArray(pagina.righe) && v.esito !== 'piazza') {
        const riga = TESTI_C1.diario[Math.abs(Math.floor(Number(pagina.notte) || 0)) % TESTI_C1.diario.length];
        if (!pagina.righe.includes(riga)) pagina.righe.splice(Math.min(1, pagina.righe.length), 0, riga);
      }
    } catch (err) { console.error('[c1] diario', err); }
    return pagina;
  };
}

// ===========================================================================
// 9. GANCI DI T4 ED ESPOSIZIONE (QA)
// ===========================================================================
if (window.__teatro && !Object.isFrozen(window.__teatro)) {
  Object.assign(window.__teatro, {
    hubSenzaNessunoC1, toninoParlaC1, disegnaToninoC1, coseHubC1, hubFermoC1,
    /** Gancio di T4: il lampione della piazza è spento stanotte? */
    lampioneSpentoC1: () => { if (statoRun.fase === 'hub') notteC1(); return lampioneSpentoC1(); },
  });
  Object.assign(window.__teatro.interni, {
    nuovaRun, // T4 parte con interni.nuovaRun: deve essere la versione avvolta
    PARTENZA_C1, SCENA_C1, STATI_C1, TESTI_C1,
    partenzaSegretaC1: Object.freeze({
      /** Stato della notte (copia leggibile). */
      get stato() {
        const A = c1.armeria;
        return {
          notte: c1.notte, slot: c1.slot, stato: c1.stato, lampione: c1.lampione ? { ...c1.lampione } : null, tonino: { ...c1.tonino }, bomba: c1.bomba ? { ...c1.bomba } : null, lampioneSpento: lampioneSpentoC1(),
          scena: c1.scena ? { ...c1.scena } : null, risveglio: c1.risveglio, fili: c1.fili ? c1.fili.map((f) => ({ ...f })) : null,
          maniAlfa: c1.maniAlfa, fermo: hubFermoC1(), aperta: armeriaApertaC1(), runSegreta: c1.runSegreta,
          armeria: A ? { passo: A.passo, arma: A.arma === null ? null : (A.armi[A.arma].id || 'di-sempre'), scelti: A.scelti.slice(), barra: A.barra,
            sel: statoRun.pannelloB ? statoRun.pannelloB.sel : null, avviso: A.avviso ? A.avviso.testo : null, armi: A.armi.map((o) => o.id || 'di-sempre'), doni: A.doni.length } : null,
          fagotto: c1.fagotto ? { ...c1.fagotto, doni: c1.fagotto.doni.slice() } : null,
        };
      },
      /** Flag dello slot: { scoperto, volte, armato, primaNotte, ultimaNotte }. */
      scoperta: leggiScopertaC1,
      listaArmi: () => listaArmiC1().map((o) => ({ id: o.id, nome: o.nome })),
      listaDoni: () => listaDoniC1().map((o) => ({ id: o.id, nome: o.nome, negativo: eNegativoC1(o) })),
      /** Geometria per la QA col mouse: cella `i` del passo corrente, posti, conferma. */
      cella: (i) => { const A = c1.armeria; return A && A.passo === 'arma' ? cellaArmaC1(i, A.armi.length) : cellaPannelloB(i); },
      posto: postoC1,
      conferma: () => PARTENZA_C1.armeria.conferma,
      /** QA: ferma (true) o fa ripartire (false) la scena dei fili, per fotografarla. */
      ferma(si) { c1.fermaQA = Boolean(si); return c1.fermaQA; },
    }),
  });
}
