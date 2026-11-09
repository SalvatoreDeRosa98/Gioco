/*
 * teatro/a8-musica.js — Miglioramento 8: musica procedurale con Web Audio, senza file audio.
 *
 * Un sequencer a pattern in 6/8 (tarantella lenta, barcarola) con lookahead scheduling: un setTimeout ogni
 * MUSICA.periodoMs pianifica sul clock dell'AudioContext (ctx.currentTime) le note dei prossimi
 * MUSICA.anticipoSec secondi. Strumenti sintetizzati: mandolino pizzicato (dente di sega filtrato, inviluppo
 * breve; tremolo sulle note lunghe), organetto (onde quadre filtrate), basso, tamburello (rumore filtrato) e,
 * per lo strato di combattimento, una tammorra (seno con caduta di altezza).
 *
 * Tema scelto da temaCorrente() leggendo lo stato del gioco: hub (anche il menu), un tema per piano del
 * ciclo (Atto I Reggia, II Corso Trieste e le Officine, III Belvedere di San Leucio, IV Trono del Velo: più
 * cupo salendo), boss, «quiete» (tesoro, Fucina, patto, sviluppatore, boss già vinto: variante calma nella
 * tonalità del piano) e morte (cadenza breve, non ripetuta). I cambi di tema sono dissolvenze incrociate.
 * Strato ritmico in più finché nella stanza ci sono nemici vivi.
 *
 * Usa l'AudioContext di AudioSys (getter AudioSys.ctx, gancio in 15-audio.js) e rispetta il muto
 * (AudioSys.attivo, tasto M di t3/70-input): da muto il guadagno principale scende a 0 e non si pianifica
 * nulla. L'AudioContext nasce solo al primo gesto (ascoltatori di AudioSys), quindi la musica parte dopo
 * un tasto o un click. Ogni voce libera i suoi nodi (disconnect su onended); inviluppi a rampa: niente click.
 *
 * Pattern originali composti per questo gioco (forme tradizionali: tarantella, barcarola; scala minore
 * napoletana con il secondo grado abbassato). Nessuna melodia esistente.
 * Script classico: legge statoRun/AudioSys dallo scope globale condiviso (teatro/LEGGIMI.md).
 */

// ===========================================================================
// TABELLA DATI (tutto ciò che si accorda sta qui)
// ===========================================================================
const MUSICA = Object.freeze({
  volume: 0.11,            // guadagno principale della musica (gli effetti di AudioSys arrivano a 0.1-0.3)
  volumePausa: 0.45,       // fattore col menu di pausa aperto
  dissolvenzaSec: 0.8,     // dissolvenza incrociata fra temi
  rampaMutoSec: 0.15,      // durata della rampa del guadagno principale (muto, pausa)
  rampaStratoSec: 0.5,     // entrata/uscita dello strato di combattimento
  anticipoSec: 0.15,       // finestra di lookahead
  periodoMs: 25,           // passo del pianificatore
  ritardoAvvioSec: 0.06,   // margine fra «adesso» e la prima nota pianificata

  strumenti: {
    mandolino: { onda: 'sawtooth', stonatura: 7, filtroDa: 3200, filtroA: 800, attacco: 0.004, decadimento: 0.32, volume: 0.22,
      tremoloPassiMin: 3, tremoloHz: 12.5, tremoloProfondita: 0.45, rilascio: 0.12 },
    organetto: { onda: 'square', filtro: 1100, q: 0.7, attacco: 0.06, rilascio: 0.18, volume: 0.035, colpoFrazione: 0.7 },
    basso: { onda: 'triangle', attacco: 0.008, decadimento: 0.45, volume: 0.26 },
    tamburello: { filtro: 7200, q: 1.2, decadimento: 0.07, volume: 0.10, accento: 1.7 },
    tammorra: { freqDa: 120, freqA: 52, caduta: 0.12, decadimento: 0.28, volume: 0.30, accento: 1.5 },
  },

  /** Strato ritmico di combattimento (passi da 6 per battuta): tammorra e tamburello fitto. */
  strato: { tammorra: 'X..x..', tamburello: 'x.xx.x', volume: 0.9 },

  scale: {
    minore: [0, 2, 3, 5, 7, 8, 10],
    armonica: [0, 2, 3, 5, 7, 8, 11],
    napoletana: [0, 1, 3, 5, 7, 8, 11], // minore napoletana: secondo grado abbassato
  },
  /** Accordi in semitoni dalla tonica. N = sesta napoletana (II abbassato maggiore). */
  accordi: {
    i: [0, 3, 7], iv: [5, 8, 12], v: [7, 10, 14], V: [7, 11, 14], N: [1, 5, 8],
    III: [3, 7, 10], VI: [8, 12, 15], VII: [10, 14, 17],
  },

  /*
   * Temi. bpm = semiminime puntate al minuto (3 crome per tempo, 6 crome per battuta).
   * melodia: una stringa per battuta, 6 passi: grado della scala (0 = tonica, 7 = ottava sopra,
   * negativi sotto), '-' prolunga la nota precedente, '.' pausa. radice: nota MIDI della tonica del mandolino.
   * basso: X tonica, x quinta. organetto: 'tenuto' o pattern di colpi. tamburello: X accento, x colpo.
   */
  temi: {
    hub: { // barcarola notturna di Piazza Dante
      bpm: 52, radice: 62, scala: 'minore', basso: 'X..x..', organetto: 'tenuto', tamburello: null, volume: 0.9,
      accordi: ['i', 'VI', 'III', 'VII', 'i', 'iv', 'v', 'i'],
      melodia: ['4 - - 3 2 3', '2 - - 0 - -', '2 - 4 7 - 6', '6 - - 4 - -', '4 - 5 4 3 2', '3 - - 5 - 3', '4 - 3 1 - -', '0 - - . . .'],
    },
    piano1: { // Atto I, Corso Trieste sotto la pioggia: tarantella lenta
      bpm: 76, radice: 69, scala: 'armonica', basso: 'X..x..', organetto: '.xx.xx', tamburello: 'X..x..', volume: 1,
      accordi: ['i', 'i', 'iv', 'V', 'i', 'VI', 'iv', 'V'],
      melodia: ['4 . 3 2 . 1', '0 - - 2 . 4', '5 . 4 3 - -', '4 - 6 4 . 1', '2 . 1 0 . 4', '5 - 4 5 . 7', '5 . 3 2 . 1', '6 - - 4 . .'],
    },
    piano2: { // Atto II, Villa Comunale con le lucciole: tarantella moderata, più battuta
      bpm: 92, radice: 64, scala: 'napoletana', basso: 'X..x..', organetto: '.xx.xx', tamburello: 'X.xX.x', volume: 1,
      accordi: ['i', 'i', 'iv', 'V', 'i', 'VI', 'N', 'V'],
      melodia: ['4 . 4 4 3 2', '3 2 1 0 . .', '3 . 3 3 5 3', '6 . 4 6 . .', '7 . 6 7 . 4', '5 . 4 5 . 7', '8 . 7 5 . 1', '6 - 4 6 - -'],
    },
    piano3: { // Atto III, San Leucio all'alba: telai fermi, più scuro
      bpm: 70, radice: 60, scala: 'napoletana', basso: 'X.....', organetto: 'tenuto', tamburello: 'x..x..', volume: 1,
      accordi: ['i', 'N', 'V', 'i', 'iv', 'N', 'V', 'i'],
      melodia: ['4 - - 5 4 2', '1 - - 3 - 1', '6 - 4 6 7 6', '7 - - 4 - -', '5 - 3 5 - 7', '8 - 7 5 - 3', '6 - - 4 - -', '0 - - . . .'],
    },
    piano4: { // Atto IV, la Reggia con le torce (Trono del Velo): rado, bordone dell'organetto, tremolo alto
      bpm: 54, radice: 57, scala: 'napoletana', basso: 'X.....', organetto: 'tenuto', tamburello: null, volume: 1,
      accordi: ['i', 'N', 'i', 'V', 'iv', 'N', 'V', 'i'],
      melodia: ['7 - - 6 - -', '8 - - - - -', '7 - - 4 - -', '6 - - - . .', '5 - - 3 - -', '5 - - 8 - -', '6 - - 4 - 6', '7 - - - . .'],
    },
    boss: { // tarantella veloce, strato ritmico sempre acceso
      bpm: 120, radice: 62, scala: 'napoletana', basso: 'X..x..', organetto: '.xx.xx', tamburello: 'XxxXxx', strato: true, volume: 1,
      accordi: ['i', 'i', 'V', 'V', 'i', 'iv', 'N', 'V'],
      melodia: ['7 6 7 4 . 4', '2 3 4 0 . .', '6 4 6 7 . 6', '4 3 2 1 . .', '0 2 4 7 . 7', '8 7 5 3 . 3', '8 . 8 7 5 3', '6 - 4 6 - -'],
    },
    quiete: { // tesoro, Fucina, patto: arpeggi lenti nella tonalità del piano (radice sostituita)
      bpm: 46, radice: 69, scala: 'armonica', basso: 'X.....', organetto: 'tenuto', tamburello: null, volume: 0.75,
      accordi: ['i', 'iv', 'V', 'i', 'VI', 'iv', 'V', 'i'],
      melodia: ['0 2 4 7 4 2', '3 5 7 10 7 5', '4 6 8 11 8 6', '0 2 4 7 - -', '5 7 9 12 9 7', '3 5 7 10 7 5', '4 6 8 11 8 6', '7 - - . . .'],
    },
    morte: { // cadenza breve iv - V - i, non si ripete
      bpm: 34, radice: 57, scala: 'armonica', basso: 'X.....', organetto: 'tenuto', tamburello: null, ciclo: false, volume: 0.9,
      accordi: ['iv', 'V', 'i'],
      melodia: ['5 - - 3 - -', '4 - - 6 - -', '7 - - - - -'],
    },
  },
  /** Tema per piano del ciclo (statoRun.piano 1..4, poi si ripete). */
  temaPerPiano: { 1: 'piano1', 2: 'piano2', 3: 'piano3', 4: 'piano4' },
  /** Stanze con la variante calma. */
  stanzeQuiete: ['tesoro', 'fucina', 'patto', 'sviluppatore'],
});

// ===========================================================================
// MUSICA: scelta del tema (logica pura) + sequencer Web Audio
// ===========================================================================
const Musica = (() => {
  const PASSI = 6; // crome per battuta (6/8)
  const cacheEventi = {};

  /** Melodia in eventi per passo: { grado, passi } o null. Calcolata una volta per tema. */
  function eventiTema(nome) {
    if (cacheEventi[nome]) return cacheEventi[nome];
    const tok = MUSICA.temi[nome].melodia.join(' ').trim().split(/\s+/);
    const ev = tok.map(() => null);
    for (let i = 0; i < tok.length; i++) {
      if (tok[i] === '-' || tok[i] === '.') continue;
      let n = 1;
      while (i + n < tok.length && tok[i + n] === '-') n++;
      ev[i] = { grado: Number(tok[i]), passi: n };
    }
    cacheEventi[nome] = ev;
    return ev;
  }

  function nemiciVivi(st) {
    return Boolean(st && !st.pulita && Array.isArray(st.nemici) && st.nemici.some((n) => n && n.hp > 0));
  }

  /**
   * Tema richiesto dallo stato del gioco (nessun effetto collaterale).
   * @returns {{ id: string, base: string, radice: number, combattimento: boolean }}
   */
  function temaCorrente(sr = statoRun) {
    const pianoNelCiclo = (((sr.piano || 1) - 1) % 4) + 1;
    const nomePiano = MUSICA.temaPerPiano[pianoNelCiclo] || 'piano1';
    const tema = (base, radice, combattimento = false) =>
      ({ id: base === 'quiete' ? `quiete-${nomePiano}` : base, base, radice: radice ?? MUSICA.temi[base].radice, combattimento });
    if (sr.fase === 'morte') return tema('morte');
    if (sr.fase !== 'in_gioco') return tema('hub'); // hub, menu di selezione
    const st = sr.stanzaCorrente;
    const tipo = st ? st.tipo : null;
    const vivi = nemiciVivi(st);
    if (tipo === 'boss' && vivi) return tema('boss', null, true);
    if (MUSICA.stanzeQuiete.includes(tipo) || (tipo === 'boss' && !vivi)) {
      return tema('quiete', MUSICA.temi[nomePiano].radice);
    }
    return tema(nomePiano, null, vivi);
  }

  // --- stato del sequencer ---
  const S = {
    tema: null,          // ultimo tema richiesto (oggetto di temaCorrente)
    cambiTema: 0,
    suona: false,        // true se in questo momento si pianificano note (contesto vivo e non muto)
    obiettivoMaster: 0,  // guadagno a cui tende il master
    obiettivoStrato: 0,
    fineRampaStrato: 0,  // fino a quando lo strato in uscita suona ancora (sfuma invece di tagliarsi)
    noteStrato: 0,
    passo: 0,            // indice del passo nel tema
    prossimaNota: 0,     // tempo AudioContext del prossimo passo
    finito: false,       // tema non ciclico arrivato in fondo
    vociVive: 0,
    notePianificate: 0,
  };
  let ac = null;
  let master = null;
  let busStrato = null;
  let busTema = null;
  let rumore = null;
  let timer = null;

  const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  /** Collega i nodi della voce e li libera alla fine della sorgente principale. */
  function voce(sorgente, nodi) {
    S.vociVive++;
    sorgente.onended = () => {
      S.vociVive--;
      for (const n of nodi) { try { n.disconnect(); } catch (_) { /* già scollegato */ } }
    };
  }

  function creaGrafo(nuovoAc) {
    ac = nuovoAc;
    master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);
    busStrato = ac.createGain();
    busStrato.gain.value = 0;
    busStrato.connect(master);
    // rumore bianco deterministico, 1 s, condiviso da tutti i colpi di tamburello
    rumore = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = rumore.getChannelData(0);
    let x = 12345;
    for (let i = 0; i < d.length; i++) { x = (x * 1103515245 + 12345) >>> 0; d[i] = (x / 4294967296) * 2 - 1; }
    busTema = null;
    S.obiettivoMaster = 0;
    S.obiettivoStrato = 0;
    S.fineRampaStrato = 0;
  }

  /** Rampa lineare dal valore attuale (tenuto anche a metà di una rampa precedente): niente click. */
  function rampa(param, valore, ora, durata) {
    if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(ora);
    else { param.cancelScheduledValues(ora); param.setValueAtTime(param.value, ora); }
    param.linearRampToValueAtTime(valore, ora + durata);
  }

  /** Nuovo bus del tema con dissolvenza in entrata; il vecchio sfuma e viene scollegato. */
  function avviaBusTema() {
    const ora = ac.currentTime;
    const D = MUSICA.dissolvenzaSec;
    if (busTema) {
      const vecchio = busTema;
      rampa(vecchio.gain, 0, ora, D);
      setTimeout(() => { try { vecchio.disconnect(); } catch (_) { /* già scollegato */ } }, (D + 0.6) * 1000);
    }
    busTema = ac.createGain();
    busTema.gain.setValueAtTime(0, ora);
    busTema.gain.linearRampToValueAtTime(MUSICA.temi[S.tema.base].volume, ora + D);
    busTema.connect(master);
    S.passo = 0;
    S.finito = false;
    S.prossimaNota = ora + MUSICA.ritardoAvvioSec;
  }

  // --- strumenti ---
  function mandolino(t, f, durSec, vel, tremolo) {
    const M = MUSICA.strumenti.mandolino;
    const o1 = ac.createOscillator();
    const fl = ac.createBiquadFilter();
    const g = ac.createGain();
    o1.type = M.onda; o1.frequency.setValueAtTime(f, t);
    fl.type = 'lowpass';
    fl.frequency.setValueAtTime(M.filtroDa, t);
    fl.frequency.exponentialRampToValueAtTime(M.filtroA, t + M.decadimento);
    o1.connect(fl);
    const nodi = [o1, fl, g];
    let fine;
    if (tremolo) {
      // nota lunga: tremolo di plettro come modulazione d'ampiezza (5 nodi invece di decine di pizzichi)
      const trem = ac.createGain();
      const lfo = ac.createOscillator();
      const prof = ac.createGain();
      trem.gain.value = 1 - M.tremoloProfondita;
      lfo.type = 'triangle'; lfo.frequency.value = M.tremoloHz;
      prof.gain.value = M.tremoloProfondita;
      lfo.connect(prof); prof.connect(trem.gain);
      fl.connect(trem); trem.connect(g);
      fine = t + durSec + M.rilascio;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(M.volume * vel * 0.8, t + M.attacco);
      g.gain.setValueAtTime(M.volume * vel * 0.8, t + durSec);
      g.gain.exponentialRampToValueAtTime(0.0001, fine);
      lfo.start(t); lfo.stop(fine + 0.02);
      nodi.push(trem, lfo, prof);
    } else {
      const o2 = ac.createOscillator(); // seconda corda della coppia, appena stonata
      o2.type = M.onda; o2.frequency.setValueAtTime(f, t); o2.detune.setValueAtTime(M.stonatura, t);
      o2.connect(fl); fl.connect(g);
      fine = t + Math.min(M.decadimento, durSec + M.rilascio);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(M.volume * vel, t + M.attacco);
      g.gain.exponentialRampToValueAtTime(0.0001, fine);
      o2.start(t); o2.stop(fine + 0.02);
      nodi.push(o2);
    }
    g.connect(busTema);
    o1.start(t); o1.stop(fine + 0.02);
    voce(o1, nodi);
  }

  function organetto(t, midiNote, durSec) {
    const O = MUSICA.strumenti.organetto;
    const fl = ac.createBiquadFilter();
    const g = ac.createGain();
    fl.type = 'lowpass'; fl.frequency.value = O.filtro; fl.Q.value = O.q;
    fl.connect(g); g.connect(busTema);
    const fine = t + durSec + O.rilascio;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(O.volume, t + O.attacco);
    g.gain.setValueAtTime(O.volume, t + Math.max(O.attacco, durSec));
    g.gain.exponentialRampToValueAtTime(0.0001, fine);
    const nodi = [fl, g];
    let prima = null;
    for (const m of midiNote) {
      const o = ac.createOscillator();
      o.type = O.onda; o.frequency.setValueAtTime(freq(m), t);
      o.connect(fl); o.start(t); o.stop(fine + 0.02);
      nodi.push(o);
      if (!prima) prima = o;
    }
    voce(prima, nodi);
  }

  function basso(t, m, durSec) {
    const B = MUSICA.strumenti.basso;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = B.onda; o.frequency.setValueAtTime(freq(m), t);
    const fine = t + Math.min(B.decadimento, durSec);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(B.volume, t + B.attacco);
    g.gain.exponentialRampToValueAtTime(0.0001, fine);
    o.connect(g); g.connect(busTema);
    o.start(t); o.stop(fine + 0.02);
    voce(o, [o, g]);
  }

  function tamburello(t, accento, uscita, scala = 1) {
    const T = MUSICA.strumenti.tamburello;
    const s = ac.createBufferSource();
    const fl = ac.createBiquadFilter();
    const g = ac.createGain();
    s.buffer = rumore;
    fl.type = 'bandpass'; fl.frequency.value = T.filtro; fl.Q.value = T.q;
    const v = T.volume * scala * (accento ? T.accento : 1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + T.decadimento);
    s.connect(fl); fl.connect(g); g.connect(uscita);
    const offs = (S.notePianificate * 0.137) % 0.8; // punto diverso del rumore a ogni colpo
    s.start(t, offs); s.stop(t + T.decadimento + 0.02);
    voce(s, [s, fl, g]);
  }

  function tammorra(t, accento, uscita, scala = 1) {
    const T = MUSICA.strumenti.tammorra;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(T.freqDa, t);
    o.frequency.exponentialRampToValueAtTime(T.freqA, t + T.caduta);
    const v = T.volume * scala * (accento ? T.accento : 1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + T.decadimento);
    o.connect(g); g.connect(uscita);
    o.start(t); o.stop(t + T.decadimento + 0.02);
    voce(o, [o, g]);
  }

  /** Pianifica tutte le note del passo corrente del tema al tempo t. */
  function pianificaPasso(t) {
    const nome = S.tema.base;
    const tema = MUSICA.temi[nome];
    const ev = eventiTema(nome);
    const passoSec = 60 / tema.bpm / 3;
    const iBattuta = Math.floor(S.passo / PASSI) % tema.accordi.length;
    const p = S.passo % PASSI;
    const radice = S.tema.radice;
    const scala = MUSICA.scale[tema.scala];
    const accordo = MUSICA.accordi[tema.accordi[iBattuta]];

    const e = ev[S.passo % ev.length];
    if (e) {
      const k = ((e.grado % 7) + 7) % 7;
      const m = radice + scala[k] + 12 * Math.floor(e.grado / 7);
      const vel = p === 0 || p === 3 ? 1 : 0.8;
      mandolino(t, freq(m), e.passi * passoSec, vel, e.passi >= MUSICA.strumenti.mandolino.tremoloPassiMin);
      S.notePianificate++;
    }
    const cb = tema.basso[p];
    if (cb === 'X' || cb === 'x') basso(t, radice - 24 + (cb === 'X' ? accordo[0] : accordo[2]), 3 * passoSec);
    if (tema.organetto === 'tenuto') {
      if (p === 0) organetto(t, accordo.map((s) => radice - 12 + s), PASSI * passoSec);
    } else if (tema.organetto[p] === 'x') {
      organetto(t, accordo.map((s) => radice - 12 + s), passoSec * MUSICA.strumenti.organetto.colpoFrazione);
    }
    if (tema.tamburello) {
      const c = tema.tamburello[p];
      if (c === 'X' || c === 'x') tamburello(t, c === 'X', busTema);
    }
    // strato ritmico: sempre nel boss (sul bus del tema), altrimenti sul bus dello strato finché serve
    const strato = tema.strato || S.obiettivoStrato > 0 || t < S.fineRampaStrato;
    if (strato) {
      const uscita = tema.strato ? busTema : busStrato;
      const L = MUSICA.strato;
      if (L.tammorra[p] !== '.') tammorra(t, L.tammorra[p] === 'X', uscita, L.volume);
      S.noteStrato++;
      if (L.tamburello[p] !== '.') tamburello(t, L.tamburello[p] === 'X', uscita, L.volume * 0.7);
    }

    S.prossimaNota += passoSec;
    S.passo++;
    if (tema.ciclo === false && S.passo >= tema.accordi.length * PASSI) S.finito = true;
  }

  /** Un giro del pianificatore: segue lo stato, regola i guadagni, pianifica le note in anticipo. */
  function giro() {
    const voluto = temaCorrente();
    const cambiato = !S.tema || S.tema.id !== voluto.id;
    if (cambiato) S.cambiTema++;
    S.tema = voluto;

    const nuovoAc = AudioSys.ctx;
    if (!nuovoAc) { S.suona = false; return; }
    if (nuovoAc !== ac) { creaGrafo(nuovoAc); avviaBusTema(); }
    else if (cambiato) avviaBusTema();
    const ora = ac.currentTime;

    const obMaster = AudioSys.attivo ? MUSICA.volume * (statoRun.pausa ? MUSICA.volumePausa : 1) : 0;
    if (obMaster !== S.obiettivoMaster) { S.obiettivoMaster = obMaster; rampa(master.gain, obMaster, ora, MUSICA.rampaMutoSec); }
    const obStrato = voluto.combattimento && !MUSICA.temi[voluto.base].strato ? 1 : 0;
    if (obStrato !== S.obiettivoStrato) { S.obiettivoStrato = obStrato; S.fineRampaStrato = ora + MUSICA.rampaStratoSec; rampa(busStrato.gain, obStrato, ora, MUSICA.rampaStratoSec); }

    S.suona = AudioSys.attivo && ac.state === 'running' && !S.finito;
    if (!S.suona) { S.prossimaNota = Math.max(S.prossimaNota, ora + MUSICA.ritardoAvvioSec); return; }
    // scheda in background o contesto ripreso: si riparte da adesso invece di recuperare a raffica
    if (S.prossimaNota < ora) S.prossimaNota = ora + MUSICA.ritardoAvvioSec;
    while (S.prossimaNota < ora + MUSICA.anticipoSec && !S.finito) pianificaPasso(S.prossimaNota);
  }

  function ciclo() {
    try { giro(); } catch (err) { console.error('[musica]', err); }
    timer = setTimeout(ciclo, MUSICA.periodoMs);
  }

  return {
    temaCorrente,
    eventiTema,
    avvia() { if (timer === null) ciclo(); },
    /** Istantanea per la QA (sola lettura). */
    get stato() {
      return {
        tema: S.tema ? S.tema.id : null, base: S.tema ? S.tema.base : null, combattimento: S.tema ? S.tema.combattimento : false,
        cambiTema: S.cambiTema, suona: S.suona, finito: S.finito,
        obiettivoMaster: S.obiettivoMaster, obiettivoStrato: S.obiettivoStrato, noteStrato: S.noteStrato,
        guadagnoMaster: master ? master.gain.value : null, guadagnoStrato: busStrato ? busStrato.gain.value : null,
        guadagnoTema: busTema ? busTema.gain.value : null,
        ctx: ac ? ac.state : null, vociVive: S.vociVive, notePianificate: S.notePianificate,
      };
    },
  };
})();

Musica.avvia();
if (window.__teatro && window.__teatro.interni && !Object.isFrozen(window.__teatro)) {
  Object.assign(window.__teatro.interni, { Musica, MUSICA });
}
