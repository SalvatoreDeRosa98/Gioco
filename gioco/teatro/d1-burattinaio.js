'use strict';
/*
 * d1-burattinaio.js — Squadra d1: lo scontro vero col Grande Burattinaio, «Sopra la Ribalta».
 *
 * Aggancio: b8-finali-diario.js chiama interni.scontroSopraLaRibalta({ fine, annulla, sigilli }) quando si sale la
 * scala della Fucina del Ricordo. Qui quella funzione apre una notte nuova (nuovaRun) e la sostituisce con una sola
 * stanza di tipo 'boss': la graticcia sopra la ribalta, fra travi, corde e contrappesi, col palco piccolo e lontano
 * sotto. Si combatte col ciclo, i proiettili, le collisioni e il flusso di morte di sempre.
 *
 * Il Burattinaio non si vede intero. Le parti sono nemici della stanza (boss: true, così la base non le muove e
 * non le fa toccare: l'IA è tutta qui):
 *   - 'grande-burattinaio': il capo invisibile, fuori scena, porta solo la barra della vita (somma delle parti);
 *   - 'gb-mano' ×2: guanti bianchi enormi (schianto, spazzata, presa che trascina); colpibili solo a terra;
 *   - 'gb-forbici': forbici d'ottone che tagliano il palco in diagonale (atto III), colpibili quando piantate;
 *   - marionette d'élite: nemici normali rinforzati (burattino, guardia, predone) calati appesi ai fili.
 * Tre atti: I Le Mani · II I Fili (mani + presa + marionette) · III Le Forbici (forbici + una mano).
 * Sigilli (ferri di Gaetano): tenaglie = le mani restano a terra di più; punzone = meno marionette;
 * lima = le forbici si inceppano (piantate più a lungo, niente doppio taglio, apertura più lenta).
 * Niente segni a terra: gli attacchi si leggono dalla posa (la mano si alza, si chiude a pugno, si gira di
 * taglio), dal suono e dal tremito delle corde.
 *
 * Avvolge (chiamando sempre la base): passoLogico, disegnaStanzaPixelArt, disegnaAtmosferaQuartiere,
 * disegnaBossPittorico, disegnaHUDPixelArt. Sonda QA: interni.provaBurattinaioD1(sigilli), interni.burattinaioD1.
 */

// ===========================================================================
// 1. TABELLE DI GIOCO (tutti i numeri sono in tick da 1/60 s e pixel dell'arena)
// ===========================================================================
const BURATTINAIO_D1 = Object.freeze({
  idCapo: 'grande-burattinaio',
  nome: 'Il Grande Burattinaio',
  pianoFinto: 4,                       // la Reggia: tema e danni di contatto del piano più alto
  /** Vita delle parti per atto (0 sigilli: le stesse; i sigilli cambiano i tempi, non la vita). */
  vita: Object.freeze({ mano1: 110, mano2: 85, mano3: 70, forbici: 190 }),
  intermezzoTick: 110,                 // pausa fra un atto e l'altro (nessun attacco)
  inizioTick: 120,                     // le mani calano prima del primo colpo
  pausaFraColpiTick: Object.freeze([26, 18, 34]),
  mano: Object.freeze({
    raggio: 28,                        // raggio colpibile a terra
    scala: 1.95,
    quotaAlta: 92,                     // altezza della mano «in riposo» sopra il palco
    seguiVel: 2.1,                     // quanto insegue il giocatore mentre si prepara (px/tick)
    schianto: Object.freeze({ alza: 34, pugno: 30, cala: 7, terra: 70, risale: 24, raggio: 34, danno: 2 }),
    spazzata: Object.freeze({ scende: 32, gira: 30, corsa: 52, terra: 50, risale: 24, mezzaAltezza: 22, danno: 1 }),
    presa: Object.freeze({ segui: 46, chiude: 16, durata: 96, terra: 60, risale: 24, raggio: 28, liberati: 22, danno: 1, trascina: 1.1 }),
    moltTenaglie: 1.7,                 // sigillo delle tenaglie: tempo a terra ×
  }),
  forbici: Object.freeze({
    raggio: 28, lunghezza: 128,
    posa: 44, apre: 46, apreLima: 80, taglio: 24, piantate: 80, moltLima: 1.9, stacca: 22,
    larghezzaTaglio: 15, danno: 2, cicatriciMax: 6,
  }),
  marionette: Object.freeze({
    tipi: Object.freeze(['burattino', 'guardia', 'predone']),
    vita: Object.freeze({ burattino: 34, guardia: 44, predone: 38 }),
    velocita: Object.freeze({ burattino: 1.2, guardia: 1.0, predone: 1.4 }),
    ondataTick: 380, primaOndataTick: 140, calataTick: 44,
    perOndata: Object.freeze([0, 2, 1]),         // per atto (I, II, III)
    perOndataPunzone: Object.freeze([0, 1, 0]),
    massimoVive: 3, massimoVivePunzone: 2,
    curaOgni: 2,                                 // ogni N marionette cadute, mezza maschera a terra
  }),
  vittoriaTick: 230,
  battitoBpm: Object.freeze([52, 68, 90]),       // il timpano sotto la tarantella del boss, per atto
});

/** Testi per il giocatore (da approvare dall'autore). */
const TESTI_D1 = Object.freeze({
  atti: Object.freeze([
    'ATTO I — Le Mani del Burattinaio',
    'ATTO II — I Fili',
    'ATTO III — Le Forbici',
  ]),
  voce: Object.freeze({
    inizio: 'Ferruccio. Sei salito fin quassù, dove i fili s\'annodano. Qua sopra le mani sono le mie.',
    senzaSigilli: 'A mani nude? Mi fai quasi tenerezza, guagliò.',
    conSigilli: 'I ferri di Gaetano… Te li sei portati appresso. Non ti basteranno.',
    atto2: 'Hai sciolto un nodo. Ne tengo mille. Scendete, figli miei.',
    atto3: 'Basta col teatrino. Le forbici le tengo io, e io taglio quando dico io.',
    vittoria: '…Le mani… non rispondono più.',
  }),
  fonti: Object.freeze({
    schianto: 'il pugno del Grande Burattinaio',
    spazzata: 'la mano del Grande Burattinaio',
    presa: 'la presa del Grande Burattinaio',
    forbici: 'le forbici del Grande Burattinaio',
  }),
  nomi: Object.freeze({ mano: 'Mano del Burattinaio', forbici: 'Forbici del Burattinaio', marionetta: 'Marionetta d\'élite' }),
  bannerVittoria: 'I fili del teatro cadono. Il Grande Burattinaio non tiene più niente.',
});

/** Colori «a ombre»: i guanti sono l'unico bianco pieno della scena. */
const TINTE_D1 = Object.freeze({
  notte: '#07060a', vuoto: '#0d0b12', trave: '#1c130d', traveLuce: '#4a3220', lanterna: '#f2c06b',
  corda: '#8a6a3c', china: '#120c08', guanto: '#f7f3ea', guantoOmbra: '#cdc5b4', guantoFlash: '#ffd27a',
  manica: '#0b0910', oro: '#d4a017', ottone: '#c9a13a', ottoneLuce: '#f7dc8a', ottoneOmbra: '#6b4e14',
  rosso: '#b3261e', palco: '#e8b050',
});

// ===========================================================================
// 2. STATO
// ===========================================================================
const d1 = {
  attivo: false, stanza: null, opz: null, atto: 0, t: 0, intermezzo: 0, pausaColpo: 0,
  turnoMano: 0, ondata: 0, cadute: 0, tremito: 0, prossimoBattito: 0, sigilli: { tenaglie: false, punzone: false, lima: false },
  effetti: [], cicatrici: [], vittoria: null, presa: null, esito: null, voceDetta: {},
};

const capoD1 = () => d1.stanza && d1.stanza.nemici.find((n) => n.bossId === BURATTINAIO_D1.idCapo);
const partiD1 = (id) => (d1.stanza ? d1.stanza.nemici.filter((n) => n.bossId === id && n.hp > 0) : []);

/** Quali ferri contano: quelli veri dello slot (se b8 li espone), altrimenti i primi `n` nell'ordine della bibbia. */
function sigilliDaNumeroD1(n, veri) {
  const ordine = ['tenaglie', 'punzone', 'lima'];
  const s = { tenaglie: false, punzone: false, lima: false };
  if (veri && typeof veri === 'object' && ordine.some((k) => veri[k])) { for (const k of ordine) s[k] = Boolean(veri[k]); return s; }
  const k = Math.max(0, Math.min(3, Math.floor(Number(n) || 0)));
  for (let i = 0; i < k; i++) s[ordine[i]] = true;
  return s;
}

// ===========================================================================
// 3. SUONI (Web Audio procedurale)
// ===========================================================================
function audioD1() {
  try {
    if (typeof AudioSys !== 'object' || !AudioSys || !AudioSys.attivo || !AudioSys.ctx || !AudioSys.uscita) return null;
    return { ac: AudioSys.ctx, out: AudioSys.uscita };
  } catch (_) { return null; }
}

/** Un colpo di suono: tipo 'scricchio' (corde), 'tonfo' (schianto), 'lama' (forbici), 'timpano', 'squillo'. */
function suonoD1(tipo, forza = 1) {
  const a = audioD1();
  if (!a) return;
  try {
    const { ac, out } = a;
    const t0 = ac.currentTime + 0.005;
    const g = ac.createGain();
    g.connect(out);
    if (tipo === 'scricchio' || tipo === 'tonfo') {
      const dur = tipo === 'tonfo' ? 0.45 : 0.32;
      const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ac.createBufferSource(); src.buffer = buf;
      const f = ac.createBiquadFilter();
      f.type = tipo === 'tonfo' ? 'lowpass' : 'bandpass';
      f.frequency.value = tipo === 'tonfo' ? 260 : 900; f.Q.value = tipo === 'tonfo' ? 0.8 : 9;
      src.connect(f); f.connect(g);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.32 * forza, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.start(t0); src.stop(t0 + dur);
      if (tipo === 'tonfo') {
        const o = ac.createOscillator(); const go = ac.createGain();
        o.frequency.setValueAtTime(110, t0); o.frequency.exponentialRampToValueAtTime(38, t0 + 0.35);
        go.gain.setValueAtTime(0.4 * forza, t0); go.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
        o.connect(go); go.connect(out); o.start(t0); o.stop(t0 + 0.42);
      }
      return;
    }
    const o = ac.createOscillator();
    o.connect(g);
    if (tipo === 'lama') {
      o.type = 'triangle';
      o.frequency.setValueAtTime(1800, t0); o.frequency.exponentialRampToValueAtTime(5200, t0 + 0.18);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.12 * forza, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.start(t0); o.stop(t0 + 0.24);
    } else if (tipo === 'timpano') {
      o.type = 'sine';
      o.frequency.setValueAtTime(74, t0); o.frequency.exponentialRampToValueAtTime(52, t0 + 0.3);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.22 * forza, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
      o.start(t0); o.stop(t0 + 0.36);
    } else { // squillo: cambio d'atto
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(196, t0); o.frequency.setValueAtTime(147, t0 + 0.25);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.09 * forza, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
      o.start(t0); o.stop(t0 + 0.92);
    }
  } catch (err) { console.warn('[D1] suono', err); }
}

/** La Voce del Burattinaio (didascalie di b8). Una volta per chiave a scontro. */
function voceD1(chiave) {
  if (d1.voceDetta[chiave]) return;
  d1.voceDetta[chiave] = true;
  const testo = TESTI_D1.voce[chiave];
  try {
    if (typeof OPZIONI === 'object' && OPZIONI && OPZIONI.voce === false) return;
    if (typeof accodaDidB8 === 'function') accodaDidB8({ tipo: 'voce', testo, evento: 'burattinaioD1' });
    if (typeof suonoVoceB8 === 'function') suonoVoceB8();
  } catch (err) { console.warn('[D1] voce', err); }
}

// ===========================================================================
// 4. INGRESSO E USCITA
// ===========================================================================
function nuovaParteD1(id, extra) {
  return Object.assign({
    id: `d1-${id}-${Math.random().toString(36).slice(2, 7)}`, bossId: id, boss: true, tipo: 'boss', pattern: 'nessuno',
    x: 320, y: 190, vx: 0, vy: 0, airZ: 40, handSlamY: 0, state: 'idle', stateTimer: 999,
    hp: 1, maxHp: 1, speed: 0, r: 20, flash: 0, burnTicks: 0, stunTicks: 0, shootCd: 9999, phaseTick: 0,
  }, extra);
}

function nuovaManoD1(lato, vita) {
  const M = BURATTINAIO_D1.mano;
  return nuovaParteD1('gb-mano', {
    nome: TESTI_D1.nomi.mano, lato, hp: vita, maxHp: vita, r: M.raggio,
    x: 320 + lato * 120, y: 200, h: M.quotaAlta + 80, posa: 'aperta', faseD1: 'riposo', tD1: 0, dannoPresa: 0,
  });
}

/** Costruisce la stanza della graticcia (una sola stanza 'boss', senza porte). */
function creaStanzaD1() {
  const V = BURATTINAIO_D1.vita;
  const capo = nuovaParteD1(BURATTINAIO_D1.idCapo, {
    nome: BURATTINAIO_D1.nome, x: 320, y: -600, airZ: 999, r: 1,
    hp: V.mano1 * 2 + V.mano2 * 2 + V.forbici + V.mano3, maxHp: V.mano1 * 2 + V.mano2 * 2 + V.forbici + V.mano3,
  });
  return {
    id: 'd1-ribalta', tipo: 'boss', cx: 0, cy: 0, porte: {}, muroSegreto: null, pulita: false, visitata: true,
    nemici: [capo], ostacoli: [], oggettiATerra: [], oggettoPiedistallo: null, arenaD1: true, incontroB6: true,
  };
}

/**
 * Lo scontro Sopra la Ribalta (assegnato a interni.scontroSopraLaRibalta, lo chiama b8).
 * @param {{fine: Function, annulla: Function, sigilli: number}} opz fine() a vittoria; annulla() se non si può.
 */
function scontroSopraLaRibaltaD1(opz = {}) {
  try {
    let veri = null;
    try { const s8 = window.__teatro.interni.finaliB8 && window.__teatro.interni.finaliB8.stato(); veri = s8 && s8.ferri; } catch (_) { veri = null; }
    if (opz.soloNumero) veri = null;
    nuovaRun(false);
    statoRun.fase = 'in_gioco';
    statoRun.pausa = false;
    statoRun.siparioAttivo = null;
    statoRun.piano = BURATTINAIO_D1.pianoFinto;
    statoRun.ciclo = 1;
    const st = creaStanzaD1();
    statoRun.mappa = Object.assign({}, statoRun.mappa || {}, { stanze: [st] });
    Object.assign(d1, {
      attivo: true, stanza: st, opz, atto: 0, t: 0, intermezzo: BURATTINAIO_D1.inizioTick, pausaColpo: 0, turnoMano: 0,
      ondata: BURATTINAIO_D1.marionette.primaOndataTick, cadute: 0, tremito: 1, prossimoBattito: 0,
      sigilli: sigilliDaNumeroD1(opz.sigilli, veri), effetti: [], cicatrici: [], vittoria: null, presa: null, esito: null, voceDetta: {},
    });
    entraInStanza(st, 'S');
    avviaAttoD1(1);
    voceD1('inizio');
    return true;
  } catch (err) {
    console.error('[D1] avvio dello scontro', err);
    d1.attivo = false;
    try { if (typeof opz.annulla === 'function') opz.annulla(); } catch (e2) { console.error('[D1] annulla', e2); }
    return false;
  }
}

function avviaAttoD1(n) {
  const st = d1.stanza;
  const V = BURATTINAIO_D1.vita;
  d1.atto = n;
  d1.turnoMano = 0;
  if (n === 1) st.nemici.push(nuovaManoD1(-1, V.mano1), nuovaManoD1(1, V.mano1));
  else if (n === 2) st.nemici.push(nuovaManoD1(-1, V.mano2), nuovaManoD1(1, V.mano2));
  else {
    st.nemici.push(nuovaManoD1(1, V.mano3));
    st.nemici.push(nuovaParteD1('gb-forbici', {
      nome: TESTI_D1.nomi.forbici, hp: V.forbici, maxHp: V.forbici, r: BURATTINAIO_D1.forbici.raggio,
      x: 320, y: 120, h: 120, ang: Math.PI / 4, apertura: 0.1, faseD1: 'posa', tD1: 0, da: null, a: null, tagli: 0,
    }));
  }
  if (n > 1) d1.intermezzo = BURATTINAIO_D1.intermezzoTick;
  mostraBanner(TESTI_D1.atti[n - 1], 170);
  suonoD1('squillo');
  d1.tremito = 1;
  if (n === 2) voceD1('atto2');
  if (n === 3) voceD1('atto3');
}

/** Fine dello scontro (vittoria, morte o uscita): rilascia la presa e spegne la logica. */
function terminaD1() {
  d1.attivo = false;
  d1.presa = null;
}

// ===========================================================================
// 5. IA DELLE MANI
// ===========================================================================
function toccaD1(x, y, r) { return Math.hypot(player.x - x, player.y - y) < r + 8 * (player.scalaA2 || 1); }

function colpisciGiocatoreD1(danno, fonte, x, y) {
  if (player.invuln > 0 || d1.vittoria) return;
  subisciColpoGiocatore(danno, fonte, x, y);
}

/** La mano sceglie il prossimo colpo (il repertorio cresce con l'atto). */
function scegliColpoManoD1(m) {
  const rep = d1.atto === 1 ? ['schianto', 'spazzata', 'schianto'] : d1.atto === 2 ? ['schianto', 'presa', 'spazzata', 'presa'] : ['schianto', 'schianto', 'spazzata'];
  m.colpo = rep[(m.colpiFatti = (m.colpiFatti || 0) + 1) % rep.length];
  m.tD1 = 0;
  if (m.colpo === 'schianto') { m.faseD1 = 'alza'; m.posa = 'aperta'; }
  else if (m.colpo === 'spazzata') {
    m.faseD1 = 'scende'; m.posa = 'piatta';
    m.verso = player.x < 320 ? -1 : 1;         // parte dal lato del giocatore e spazza verso l'altro
    m.x0 = m.verso < 0 ? ARENA.x1 - 10 : ARENA.x2 + 10; m.dirSpazza = -m.verso;
    m.y = Math.max(ARENA.y1 + 24, Math.min(ARENA.y2 - 24, player.y));
  } else { m.faseD1 = 'segui'; m.posa = 'aperta'; }
  d1.tremito = Math.max(d1.tremito, 0.6);
  suonoD1('scricchio', 0.8);
}

function aTerraManoD1(m, tick) {
  m.faseD1 = 'terra'; m.tD1 = 0; m.durTerra = Math.round(tick * (d1.sigilli.tenaglie ? BURATTINAIO_D1.mano.moltTenaglie : 1));
}

function iaManoD1(m, puoAttaccare) {
  const M = BURATTINAIO_D1.mano;
  m.tD1++;
  const verso = (x, y, v) => { const dx = x - m.x, dy = y - m.y, l = Math.hypot(dx, dy); if (l > 0.5) { m.x += (dx / l) * Math.min(v, l); m.y += (dy / l) * Math.min(v, l); } };
  const clampY = (y) => Math.max(ARENA.y1 + 20, Math.min(ARENA.y2 - 16, y));
  m.airZ = 40;
  switch (m.faseD1) {
    case 'riposo': {
      m.h += (M.quotaAlta - m.h) * 0.06;
      verso(320 + m.lato * 130, 170, 1.2);
      m.posa = 'aperta';
      if (puoAttaccare) scegliColpoManoD1(m);
      break;
    }
    case 'alza': { // schianto: la mano insegue dall'alto e sale
      const S = M.schianto;
      verso(player.x, clampY(player.y), M.seguiVel);
      m.h += (M.quotaAlta + 30 - m.h) * 0.1;
      if (m.tD1 >= S.alza) { m.faseD1 = 'pugno'; m.tD1 = 0; m.posa = 'pugno'; suonoD1('scricchio', 1); d1.tremito = 1; }
      break;
    }
    case 'pugno': { // si chiude a pugno, ferma: questo è l'avviso
      if (m.tD1 < 8) verso(player.x, clampY(player.y), M.seguiVel * 0.5);
      if (m.tD1 >= M.schianto.pugno) { m.faseD1 = 'cala'; m.tD1 = 0; m.h0 = m.h; }
      break;
    }
    case 'cala': {
      const S = M.schianto;
      m.h = m.h0 * (1 - m.tD1 / S.cala);
      if (m.tD1 >= S.cala) {
        m.h = 0;
        suonoD1('tonfo', 1); scuoti(FEEL.scossa.evento); d1.tremito = 1;
        statoRun.ondeEsplosione.push({ x: m.x, y: m.y, r: 8, maxR: S.raggio + 14, color: '#f2c06b', tick: 0 });
        if (toccaD1(m.x, m.y, S.raggio)) colpisciGiocatoreD1(S.danno, TESTI_D1.fonti.schianto, m.x, m.y);
        aTerraManoD1(m, S.terra);
      }
      break;
    }
    case 'scende': { // spazzata: cala di taglio sul bordo, all'altezza del giocatore
      const S = M.spazzata;
      m.x += (m.x0 - m.x) * 0.12;
      m.h += (6 - m.h) * 0.12;
      if (m.tD1 >= S.scende) { m.faseD1 = 'gira'; m.tD1 = 0; suonoD1('scricchio', 1); d1.tremito = 1; }
      break;
    }
    case 'gira': { // il palmo si gira di taglio (avviso), poi parte
      if (m.tD1 >= M.spazzata.gira) { m.faseD1 = 'spazza'; m.tD1 = 0; }
      break;
    }
    case 'spazza': {
      const S = M.spazzata;
      const corsa = (ARENA.x2 - ARENA.x1 + 40) / S.corsa;
      m.x += m.dirSpazza * corsa;
      m.h = 4;
      if (Math.abs(player.x - m.x) < 26 && Math.abs(player.y - m.y) < S.mezzaAltezza + 6) colpisciGiocatoreD1(S.danno, TESTI_D1.fonti.spazzata, m.x, m.y);
      if (m.tD1 % 6 === 0) scuoti(FEEL.scossa.colpo);
      if (m.tD1 >= S.corsa) { m.h = 0; m.x = Math.max(ARENA.x1 + 24, Math.min(ARENA.x2 - 24, m.x)); m.posa = 'aperta'; aTerraManoD1(m, S.terra); }
      break;
    }
    case 'segui': { // presa: aperta sopra il giocatore, lo segue da vicino
      const P = M.presa;
      verso(player.x, clampY(player.y), M.seguiVel * 1.1);
      m.h += (60 - m.h) * 0.1;
      if (m.tD1 >= P.segui) { m.faseD1 = 'chiude'; m.tD1 = 0; m.posa = 'presa'; suonoD1('scricchio', 1); d1.tremito = 1; }
      break;
    }
    case 'chiude': {
      const P = M.presa;
      m.h = 60 * (1 - m.tD1 / P.chiude);
      if (m.tD1 >= P.chiude) {
        m.h = 0;
        if (!d1.presa && player.invuln <= 0 && toccaD1(m.x, m.y, P.raggio)) {
          d1.presa = { mano: m, t: 0, hp0: m.hp, verso: player.x < 320 ? -1 : 1 };
          m.faseD1 = 'tiene'; m.tD1 = 0; m.posa = 'pugno';
          mostraBanner('Ti ha preso! Colpisci la mano per liberarti!', 90);
        } else { m.posa = 'aperta'; aTerraManoD1(m, P.terra); }
      }
      break;
    }
    case 'tiene': { // trascina il giocatore verso il bordo della graticcia
      const P = M.presa;
      const pr = d1.presa;
      m.airZ = 22;
      const mx = pr ? (pr.verso < 0 ? ARENA.x1 + 26 : ARENA.x2 - 26) : m.x;
      verso(mx, m.y, P.trascina);
      const liberato = pr && pr.hp0 - m.hp >= P.liberati;
      if (!pr || liberato || m.tD1 >= P.durata) {
        if (pr && !liberato) colpisciGiocatoreD1(P.danno, TESTI_D1.fonti.presa, m.x, m.y);
        else if (pr) player.invuln = Math.max(player.invuln, 40);
        d1.presa = null; m.posa = 'aperta'; aTerraManoD1(m, P.terra);
      } else {
        player.x = m.x; player.y = m.y + 2; player.targetX = null; player.targetY = null;
      }
      break;
    }
    case 'terra': { // a terra: colpibile
      m.h = 0; m.airZ = 22;
      if (m.tD1 >= m.durTerra) { m.faseD1 = 'risale'; m.tD1 = 0; }
      break;
    }
    case 'risale': {
      m.h += (M.quotaAlta - m.h) * 0.08;
      m.posa = 'aperta';
      if (m.tD1 >= M.schianto.risale) { m.faseD1 = 'riposo'; m.tD1 = 0; }
      break;
    }
    default: m.faseD1 = 'riposo';
  }
}

// ===========================================================================
// 6. IA DELLE FORBICI (atto III)
// ===========================================================================
function iaForbiciD1(f, puoAttaccare) {
  const F = BURATTINAIO_D1.forbici;
  const lima = d1.sigilli.lima;
  f.tD1++;
  f.airZ = 40;
  switch (f.faseD1) {
    case 'posa': { // si porta a un angolo, alta
      if (!f.da) {
        const sx = player.x < 320 ? 1 : -1, sy = player.y < 188 ? 1 : -1; // dall'angolo opposto al giocatore
        f.da = { x: sx > 0 ? ARENA.x2 - 44 : ARENA.x1 + 44, y: sy > 0 ? ARENA.y2 - 14 : ARENA.y1 + 48 }; // dentro la vista (non sotto la mappa)
      }
      f.x += (f.da.x - f.x) * 0.08; f.y += (f.da.y - f.y) * 0.08; f.h += (14 - f.h) * 0.08;
      f.apertura += (0.12 - f.apertura) * 0.2;
      if (f.tD1 >= F.posa && puoAttaccare) {
        f.faseD1 = 'apre'; f.tD1 = 0;
        f.a = { x: player.x, y: player.y };
        f.ang = Math.atan2(f.a.y - f.da.y, f.a.x - f.da.x);
        suonoD1('lama', 1); d1.tremito = 1;
      }
      break;
    }
    case 'apre': { // le lame si aprono piano verso il bersaglio: l'avviso è la posa
      const dur = lima ? F.apreLima : F.apre;
      f.apertura = 0.12 + 0.75 * Math.min(1, f.tD1 / dur);
      if (f.tD1 < dur * 0.6) { f.a = { x: player.x, y: player.y }; f.ang = Math.atan2(f.a.y - f.y, f.a.x - f.x); }
      if (f.tD1 >= dur) {
        // il taglio attraversa tutta l'arena lungo la diagonale scelta
        const L = Math.hypot(ARENA.x2 - ARENA.x1, ARENA.y2 - ARENA.y1);
        f.fine = {
          x: Math.max(ARENA.x1 + 16, Math.min(ARENA.x2 - 16, f.x + Math.cos(f.ang) * L)),
          y: Math.max(ARENA.y1 + 12, Math.min(ARENA.y2 - 12, f.y + Math.sin(f.ang) * L)),
        };
        f.inizio = { x: f.x, y: f.y };
        f.faseD1 = 'taglio'; f.tD1 = 0; suonoD1('lama', 1.4);
      }
      break;
    }
    case 'taglio': {
      const k = Math.min(1, f.tD1 / F.taglio);
      const px = f.x, py = f.y;
      f.x = f.inizio.x + (f.fine.x - f.inizio.x) * k; f.y = f.inizio.y + (f.fine.y - f.inizio.y) * k; f.h = 4;
      f.apertura = 0.87 * (1 - k);
      // segmento percorso in questo tick: tocca se il giocatore è vicino alla lama
      const dx = f.x - px, dy = f.y - py, l2 = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((player.x - px) * dx + (player.y - py) * dy) / l2));
      if (Math.hypot(player.x - (px + dx * u), player.y - (py + dy * u)) < F.larghezzaTaglio + 6) colpisciGiocatoreD1(F.danno, TESTI_D1.fonti.forbici, f.x, f.y);
      if (k >= 1) {
        d1.cicatrici.push({ x1: f.inizio.x, y1: f.inizio.y, x2: f.fine.x, y2: f.fine.y, t: 0 });
        if (d1.cicatrici.length > F.cicatriciMax) d1.cicatrici.shift();
        scuoti(FEEL.scossa.evento); suonoD1('tonfo', 0.7); d1.tremito = 1;
        f.tagli++;
        if (!lima && f.tagli % 2 === 1) { // senza lima: secondo taglio subito, dal punto d'arrivo
          f.da = { x: f.x, y: f.y }; f.faseD1 = 'apre'; f.tD1 = Math.round(F.apre * 0.35);
        } else {
          f.faseD1 = 'piantate'; f.tD1 = 0; f.durTerra = Math.round(F.piantate * (lima ? F.moltLima : 1));
        }
      }
      break;
    }
    case 'piantate': { // conficcate nelle tavole: colpibili (con la lima scricchiolano, inceppate)
      f.h = 0; f.airZ = 22; f.apertura = lima ? 0.05 + Math.abs(Math.sin(f.tD1 * 0.5)) * 0.04 : 0.02;
      if (lima && f.tD1 % 40 === 0) suonoD1('scricchio', 0.5);
      if (f.tD1 >= f.durTerra) { f.faseD1 = 'stacca'; f.tD1 = 0; }
      break;
    }
    case 'stacca': {
      f.h += (30 - f.h) * 0.15;
      if (f.tD1 >= F.stacca) { f.faseD1 = 'posa'; f.tD1 = 0; f.da = null; }
      break;
    }
    default: f.faseD1 = 'posa';
  }
}

// ===========================================================================
// 7. MARIONETTE D'ÉLITE
// ===========================================================================
function calaMarionettaD1(i) {
  const MA = BURATTINAIO_D1.marionette;
  const tipo = MA.tipi[(d1.cadute + i + d1.atto) % MA.tipi.length];
  const x = ARENA.x1 + 60 + ((i * 157 + d1.t * 7) % (ARENA.x2 - ARENA.x1 - 120));
  const yFin = ARENA.y1 + 40 + ((i * 53 + d1.t) % 80);
  d1.stanza.nemici.push({
    id: `d1-mar-${d1.t}-${i}`, tipo, patternMob: tipo, nome: TESTI_D1.nomi.marionetta, boss: false, mobSoldi: false, champion: null,
    x, y: ARENA.y1 - 60, hp: MA.vita[tipo], maxHp: MA.vita[tipo], speed: MA.velocita[tipo], r: 11, flash: 0, burnTicks: 0,
    stunTicks: MA.calataTick + 4, state: 'idle', stateTimer: 30, maskOpen: false, shootCd: 50 + i * 20,
    eliteD1: true, calataD1: { y0: ARENA.y1 - 60, y1: yFin, t: 0 },
  });
  d1.tremito = Math.max(d1.tremito, 0.7);
  suonoD1('scricchio', 0.6);
}

function iaMarionetteD1() {
  const MA = BURATTINAIO_D1.marionette;
  const st = d1.stanza;
  let vive = 0;
  for (const n of st.nemici) {
    if (!n.eliteD1) continue;
    if (n.calataD1 && n.hp > 0) {
      const c = n.calataD1;
      c.t++;
      n.y = c.y0 + (c.y1 - c.y0) * Math.min(1, c.t / MA.calataTick);
      if (c.t >= MA.calataTick) n.calataD1 = null;
    }
    if (n.hp > 0) vive++;
    else if (!n.cadutaD1) { // filo tagliato: cade nel vuoto sotto la graticcia
      n.cadutaD1 = true;
      d1.cadute++;
      d1.effetti.push({ tipo: 'caduta', x: n.x, y: n.y, t: 0 });
      if (d1.cadute % MA.curaOgni === 0) st.oggettiATerra.push({ tipo: 'cura', valore: 1, sprite: 'mezzaMaschera', x: n.x, y: n.y });
    }
  }
  const per = (d1.sigilli.punzone ? MA.perOndataPunzone : MA.perOndata)[d1.atto - 1] || 0;
  const max = d1.sigilli.punzone ? MA.massimoVivePunzone : MA.massimoVive;
  if (per > 0 && --d1.ondata <= 0) {
    d1.ondata = MA.ondataTick;
    for (let i = 0; i < per && vive < max; i++, vive++) calaMarionettaD1(i);
  }
}

// ===========================================================================
// 8. REGIA: atti, vita del capo, vittoria
// ===========================================================================
function vitaRestanteD1() {
  const V = BURATTINAIO_D1.vita;
  let somma = 0;
  for (const n of d1.stanza.nemici) if (n.bossId === 'gb-mano' || n.bossId === 'gb-forbici') somma += Math.max(0, n.hp);
  if (d1.atto <= 1) somma += V.mano2 * 2 + V.forbici + V.mano3;
  else if (d1.atto === 2) somma += V.forbici + V.mano3;
  return somma;
}

function passoD1() {
  const st = d1.stanza;
  const capo = capoD1();
  d1.t++;
  d1.tremito = Math.max(0, d1.tremito - 0.02);
  for (const e of d1.effetti) e.t++;
  for (let i = d1.effetti.length - 1; i >= 0; i--) if (d1.effetti[i].t > 90) d1.effetti.splice(i, 1);
  if (d1.vittoria) { passoVittoriaD1(); return; }

  // il timpano sotto la musica: il ritmo cresce con l'atto
  const bpm = BURATTINAIO_D1.battitoBpm[d1.atto - 1] || 60;
  if (--d1.prossimoBattito <= 0) { d1.prossimoBattito = Math.round(3600 / bpm); suonoD1('timpano', d1.atto === 3 ? 1.2 : 0.9); }

  // parti morte: effetto di caduta (mano che si affloscia e risale nel buio)
  for (const n of st.nemici) {
    if ((n.bossId === 'gb-mano' || n.bossId === 'gb-forbici') && n.hp <= 0 && !n.cadutaD1) {
      n.cadutaD1 = true;
      if (d1.presa && d1.presa.mano === n) d1.presa = null;
      d1.effetti.push({ tipo: n.bossId === 'gb-mano' ? 'mano' : 'forbici', x: n.x, y: n.y, lato: n.lato || 1, t: 0 });
      suonoD1('tonfo', 0.8); d1.tremito = 1;
    }
  }

  const mani = partiD1('gb-mano');
  const forbici = partiD1('gb-forbici');
  if (d1.intermezzo > 0) d1.intermezzo--;
  const libero = d1.intermezzo <= 0;

  // chi attacca: una mano alla volta (atto II: la seconda parte quando la prima è a terra)
  if (libero && d1.pausaColpo > 0) d1.pausaColpo--;
  const occupata = (m) => m.faseD1 !== 'riposo' && m.faseD1 !== 'terra' && m.faseD1 !== 'risale';
  const inAzione = mani.filter(occupata).length;
  for (const m of mani) {
    let puo = false;
    if (libero && m.faseD1 === 'riposo' && d1.pausaColpo <= 0 && inAzione === 0) {
      const turno = mani[d1.turnoMano % mani.length];
      puo = turno === m;
    }
    if (libero && d1.atto === 2 && m.faseD1 === 'riposo' && inAzione === 0 && mani.some((o) => o !== m && o.faseD1 === 'terra') && d1.pausaColpo <= 0) puo = true;
    const prima = m.faseD1;
    iaManoD1(m, puo);
    if (prima === 'riposo' && m.faseD1 !== 'riposo') { d1.turnoMano++; d1.pausaColpo = BURATTINAIO_D1.pausaFraColpiTick[d1.atto - 1]; }
  }
  for (const f of forbici) iaForbiciD1(f, libero);
  iaMarionetteD1();

  // fine dell'atto
  if (d1.atto < 3 && mani.length === 0) {
    if (d1.atto === 2) for (const n of st.nemici) if (n.eliteD1 && n.hp > 0) n.hp = 0;
    avviaAttoD1(d1.atto + 1);
  } else if (d1.atto === 3 && forbici.length === 0) {
    for (const n of st.nemici) if (n.hp > 0 && n.bossId !== BURATTINAIO_D1.idCapo) n.hp = 0;
    avviaVittoriaD1();
  }
  if (capo) capo.hp = d1.vittoria ? 0 : Math.max(1, vitaRestanteD1());
  if (capo) { capo.x = 320; capo.y = -600; capo.airZ = 999; capo.kbx = 0; capo.kby = 0; }
}

function avviaVittoriaD1() {
  const st = d1.stanza;
  d1.presa = null;
  d1.vittoria = { t: 0, fili: [] };
  for (let i = 0; i < 26; i++) d1.vittoria.fili.push({ x: 40 + ((i * 97) % 560), y: -20 - ((i * 37) % 80), vy: 0.6 + (i % 5) * 0.25, len: 60 + ((i * 53) % 140), ondula: i * 0.7 });
  for (const n of st.nemici) n.hp = 0;
  st.pulita = true;
  statoRun.proiettiliNemici = [];
  player.invuln = Math.max(player.invuln, BURATTINAIO_D1.vittoriaTick + 30);
  mostraBanner(TESTI_D1.bannerVittoria, BURATTINAIO_D1.vittoriaTick);
  voceD1('vittoria');
  suonoD1('squillo', 1.2);
  d1.tremito = 1;
}

function passoVittoriaD1() {
  const v = d1.vittoria;
  v.t++;
  for (const f of v.fili) { f.vy += 0.05; f.y += f.vy; }
  if (v.t % 50 === 0) suonoD1('scricchio', 0.5);
  if (v.t >= BURATTINAIO_D1.vittoriaTick && !d1.esito) {
    d1.esito = 'vittoria';
    const fine = d1.opz && d1.opz.fine;
    terminaD1();
    try { if (typeof fine === 'function') fine(); } catch (err) { console.error('[D1] fine', err); }
  }
}

// ===========================================================================
// 9. AGGANCI AL CICLO
// ===========================================================================
const passoLogicoBaseD1 = passoLogico;
/** Dopo la base: l'IA del Burattinaio gira solo se la base ha fatto agire il capo (niente pausa, hit-stop, grazia). */
passoLogico = function (...args) {
  const capo = d1.attivo ? capoD1() : null;
  const prima = capo ? capo.phaseTick || 0 : 0;
  const r = passoLogicoBaseD1.apply(this, args);
  try {
    if (d1.attivo) {
      if (statoRun.stanzaCorrente !== d1.stanza || (statoRun.fase !== 'in_gioco' && !d1.vittoria)) { terminaD1(); d1.esito = d1.esito || statoRun.fase; }
      else if (statoRun.fase === 'in_gioco' && capo && ((capo.phaseTick || 0) !== prima || d1.vittoria) && !statoRun.pausa) {
        if (statoRun.hpHalf > 0) passoD1();
      }
    }
  } catch (err) { console.error('[D1] passo', err); }
  return r;
};

/** Argomenti di una funzione di disegno che può ricevere ctx come primo argomento. */
const argsD1 = (args) => (args[0] && typeof args[0].save === 'function' ? args.slice(1) : args);

const disegnaStanzaPixelArtBaseD1 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function (...args) {
  const a = argsD1(args);
  const st = a[1];
  if (st && st.arenaD1) { try { disegnaArenaD1(a[0] || 0); return; } catch (err) { console.error('[D1] arena', err); } }
  return disegnaStanzaPixelArtBaseD1.apply(this, args);
};

const disegnaAtmosferaQuartiereBaseD1 = disegnaAtmosferaQuartiere;
disegnaAtmosferaQuartiere = function (...args) {
  if (statoRun.stanzaCorrente && statoRun.stanzaCorrente.arenaD1) return undefined;
  return disegnaAtmosferaQuartiereBaseD1.apply(this, args);
};

const disegnaBossPittoricoBaseD1 = disegnaBossPittorico;
disegnaBossPittorico = function (...args) {
  const a = argsD1(args);
  const b = a[0];
  if (b && (b.bossId === BURATTINAIO_D1.idCapo || b.bossId === 'gb-mano' || b.bossId === 'gb-forbici')) {
    try {
      if (b.bossId === 'gb-mano') disegnaManoD1(b);
      else if (b.bossId === 'gb-forbici') disegnaForbiciD1(b);
    } catch (err) { console.error('[D1] disegno', b.bossId, err); }
    return undefined;
  }
  return disegnaBossPittoricoBaseD1.apply(this, args);
};

const disegnaFrameBaseD1 = disegnaFrame;
/**
 * Durante il disegno l'arena non si presenta come «stanza del boss» alla resa di base: niente botola al centro,
 * niente Mani di Donna Luciana del boss finale. La logica (barra, musica, danni) la vede sempre come 'boss'.
 */
disegnaFrame = function (...args) {
  const st = statoRun.stanzaCorrente;
  if (!st || !st.arenaD1 || st.tipo !== 'boss') return disegnaFrameBaseD1.apply(this, args);
  // le parti del Burattinaio le disegna d1 (prima dell'HUD): la base non vi tira i suoi fili di marionetta
  const tutti = st.nemici;
  partiDaDisegnareD1 = tutti.filter((n) => n.hp > 0 && (n.bossId === 'gb-mano' || n.bossId === 'gb-forbici'));
  st.tipo = 'ribaltaD1';
  st.nemici = tutti.filter((n) => n.bossId !== 'gb-mano' && n.bossId !== 'gb-forbici');
  try { return disegnaFrameBaseD1.apply(this, args); } finally { st.tipo = 'boss'; st.nemici = tutti; partiDaDisegnareD1 = null; }
};
let partiDaDisegnareD1 = null;

const disegnaHUDPixelArtBaseD1 = disegnaHUDPixelArt;
/** Prima dell'HUD: effetti di caduta, fili che cadono a vittoria. */
disegnaHUDPixelArt = function (...args) {
  try {
    if (statoRun.stanzaCorrente && statoRun.stanzaCorrente.arenaD1) {
      // forbici sotto, mani sopra (calano dall'alto); per y crescente fra le mani
      const parti = (partiDaDisegnareD1 || []).slice().sort((a, b) => (a.bossId === 'gb-forbici' ? -1 : 0) - (b.bossId === 'gb-forbici' ? -1 : 0) || a.y - b.y);
      for (const n of parti) { if (n.bossId === 'gb-mano') disegnaManoD1(n); else disegnaForbiciD1(n); }
      disegnaEffettiD1();
    }
  } catch (err) { console.error('[D1] effetti', err); }
  return disegnaHUDPixelArtBaseD1.apply(this, args);
};

// ===========================================================================
// 10. DISEGNO «A OMBRE»
// ===========================================================================
let telaFondoD1 = null, telaTraviD1 = null;

function nuovaTelaD1() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }

/** Il vuoto, il palco lontano laggiù e la graticcia di tavole (fermo: tela fuori schermo). */
function preparaFondoD1() {
  const c = nuovaTelaD1(); const g = c.getContext('2d');
  g.fillStyle = TINTE_D1.notte; g.fillRect(0, 0, W, H);
  // il pozzo di buio sotto la graticcia, con la luce calda del palco che sale dal basso
  const gr = g.createRadialGradient(320, 205, 10, 320, 205, 260);
  gr.addColorStop(0, 'rgba(232,176,80,0.22)'); gr.addColorStop(0.35, 'rgba(120,60,30,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // il palco piccolo e lontano: boccascena, sipario rosso, ribalta di lumini, figurine
  g.save(); g.translate(320, 206); g.scale(0.62, 0.62); g.globalAlpha = 0.75;
  g.fillStyle = 'rgba(30,18,10,0.9)'; g.fillRect(-64, -30, 128, 58);
  g.fillStyle = 'rgba(232,176,80,0.55)'; g.fillRect(-52, -22, 104, 40);
  g.fillStyle = TINTE_D1.rosso; g.fillRect(-56, -26, 14, 46); g.fillRect(42, -26, 14, 46); g.fillRect(-56, -28, 112, 8);
  g.fillStyle = '#1a100a';
  for (const [x, h] of [[-26, 16], [-8, 19], [12, 15], [28, 17]]) {
    g.fillRect(x - 2, 14 - h, 4, h); g.beginPath(); g.arc(x, 12 - h, 3, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(242,192,107,0.5)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, 9 - h); g.lineTo(x, -22); g.stroke();
  }
  g.fillStyle = '#ffe2a0'; for (let x = -48; x <= 48; x += 8) { g.beginPath(); g.arc(x, 20, 1.2, 0, TAU); g.fill(); }
  g.restore();
  // la graticcia: travetti lunghi (orizzontali) e traversi, coi vuoti fra le tavole
  const x1 = ARENA.x1 - 30, x2 = ARENA.x2 + 30, y1 = ARENA.y1 - 14, y2 = ARENA.y2 + 18;
  for (let y = y1; y < y2; y += 22) {
    const sopraPalco = y > 150 && y < 250; // sopra il palco lontano le tavole sono rade: si vede giù
    g.fillStyle = TINTE_D1.trave;
    if (sopraPalco) { g.fillRect(x1, y, 200 - x1, 13); g.fillRect(440, y, x2 - 440, 13); g.globalAlpha = 0.42; g.fillRect(200, y, 240, 7); g.globalAlpha = 1; }
    else g.fillRect(x1, y, x2 - x1, 13);
    g.fillStyle = 'rgba(242,192,107,0.16)'; g.fillRect(x1, y, x2 - x1, 1);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x1, y + 12, x2 - x1, 1);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1;
    for (let x = x1 + ((y * 7) % 60); x < x2; x += 61) { g.beginPath(); g.moveTo(x, y + 1); g.lineTo(x, y + 12); g.stroke(); }
  }
  for (let x = x1; x <= x2; x += 98) {
    g.fillStyle = '#140d08'; g.fillRect(x - 5, y1 - 4, 10, y2 - y1 + 8);
    g.fillStyle = 'rgba(242,192,107,0.14)'; g.fillRect(x - 5, y1 - 4, 1, y2 - y1 + 8);
  }
  // bordo della graticcia verso la ribalta (davanti): il vuoto sotto
  const gb = g.createLinearGradient(0, y2, 0, H);
  gb.addColorStop(0, 'rgba(232,176,80,0.18)'); gb.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gb; g.fillRect(0, y2, W, H - y2);
  g.strokeStyle = TINTE_D1.lanterna; g.globalAlpha = 0.55; g.lineWidth = 1.2; g.strokeRect(x1, y1, x2 - x1, y2 - y1); g.globalAlpha = 1;
  return c;
}

/** Le travi del soffitto, le carrucole e i contrappesi fissi (davanti al capo, dietro alle mani). */
function preparaTraviD1() {
  const c = nuovaTelaD1(); const g = c.getContext('2d');
  const trave = (y, h) => {
    g.fillStyle = TINTE_D1.trave; g.fillRect(0, y, W, h);
    g.fillStyle = TINTE_D1.traveLuce; g.fillRect(0, y + h - 2, W, 2);
    g.fillStyle = 'rgba(242,192,107,0.35)'; for (let x = 18; x < W; x += 52) { g.beginPath(); g.arc(x, y + h / 2, 1.6, 0, TAU); g.fill(); }
  };
  trave(0, 16); trave(38, 10);
  // carrucole
  for (const x of [40, 96, 544, 600]) {
    g.fillStyle = '#0e0906'; g.beginPath(); g.arc(x, 26, 8, 0, TAU); g.fill();
    g.strokeStyle = TINTE_D1.lanterna; g.lineWidth = 1; g.globalAlpha = 0.6; g.beginPath(); g.arc(x, 26, 8, 0, TAU); g.stroke(); g.globalAlpha = 1;
  }
  // montanti ai lati
  g.fillStyle = '#100a07'; g.fillRect(0, 0, 22, H); g.fillRect(W - 22, 0, 22, H);
  g.fillStyle = 'rgba(242,192,107,0.2)'; g.fillRect(21, 0, 1, H); g.fillRect(W - 22, 0, 1, H);
  return c;
}

/** Il capo: un'ombra enorme dietro le travi, solo spalle e due bagliori d'occhi. Non si vede mai intero. */
function disegnaCapoD1() {
  const fiato = Math.sin(tick * 0.02) * 2;
  const via = d1.vittoria ? Math.min(1, d1.vittoria.t / 120) : 0;
  ctx.save();
  ctx.globalAlpha = 0.92 * (1 - via * 0.7);
  ctx.fillStyle = '#030205';
  ctx.beginPath();
  ctx.moveTo(60, 0); ctx.quadraticCurveTo(140, 56 + fiato, 250, 44 + fiato); ctx.quadraticCurveTo(320, 10 + fiato, 390, 44 + fiato);
  ctx.quadraticCurveTo(500, 56 + fiato, 580, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(242,192,107,0.25)'; ctx.lineWidth = 1; ctx.stroke();
  if (!d1.vittoria) {
    const occhi = 0.5 + 0.5 * Math.sin(tick * 0.05);
    ctx.fillStyle = `rgba(249,203,64,${0.35 + 0.4 * occhi})`;
    ctx.beginPath(); ctx.ellipse(300, 24 + fiato, 4, 1.5, 0, 0, TAU); ctx.ellipse(340, 24 + fiato, 4, 1.5, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/** Corde e contrappesi che tremano quando il Burattinaio prepara un colpo (l'unico «avviso» della scena). */
function disegnaCordeD1() {
  const am = d1.tremito * 3.2;
  ctx.save();
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 8; i++) {
    const x = i < 4 ? 30 + i * 12 : W - 30 - (i - 4) * 12;
    const lung = 120 + ((i * 47) % 150);
    const sw = Math.sin(tick * 0.6 + i * 1.3) * am + Math.sin(tick * 0.03 + i) * 1.2;
    ctx.strokeStyle = TINTE_D1.corda;
    ctx.beginPath(); ctx.moveTo(x, 18); ctx.quadraticCurveTo(x + sw, 18 + lung / 2, x + sw * 0.6, 18 + lung); ctx.stroke();
    // contrappeso (sacchetto di sabbia)
    const cy = 18 + lung + Math.sin(tick * 0.05 + i) * 1.5;
    ctx.fillStyle = '#1b130c';
    ctx.beginPath(); ctx.ellipse(x + sw * 0.6, cy + 8, 6, 9, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(242,192,107,0.45)'; ctx.lineWidth = 0.8; ctx.stroke(); ctx.lineWidth = 1.4;
  }
  ctx.restore();
}

/** Arena completa: fondo fermo, cicatrici dei tagli, ombra del capo, travi, corde. */
function disegnaArenaD1() {
  if (!telaFondoD1) telaFondoD1 = preparaFondoD1();
  if (!telaTraviD1) telaTraviD1 = preparaTraviD1();
  ctx.drawImage(telaFondoD1, 0, 0);
  // i tagli delle forbici restano sulle tavole (dopo il colpo, mai prima)
  ctx.save();
  for (const c of d1.cicatrici) {
    ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(c.x1, c.y1); ctx.lineTo(c.x2, c.y2); ctx.stroke();
    ctx.strokeStyle = 'rgba(232,176,80,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(c.x1, c.y1 + 2); ctx.lineTo(c.x2, c.y2 + 2); ctx.stroke();
  }
  ctx.restore();
  disegnaCapoD1();
  ctx.drawImage(telaTraviD1, 0, 0);
  disegnaCordeD1();
}

/** Guanto bianco. (x, y) = punto dove tocca le tavole; h = altezza da terra. */
function disegnaGuantoD1(x, y, h, lato, posa, flash, alfa = 1, rot = 0) {
  const s = BURATTINAIO_D1.mano.scala;
  const tremo = posa === 'pugno' || posa === 'presa' ? Math.sin(tick * 1.7) * 0.8 : 0;
  ctx.save();
  ctx.globalAlpha *= alfa;
  // ombra morbida sotto (solo volume, mai un bersaglio: piccola, sempre centrata sulla mano e svanisce con l'altezza)
  ctx.fillStyle = `rgba(0,0,0,${0.32 * Math.max(0, 1 - h / 90)})`;
  ctx.beginPath(); ctx.ellipse(x, y + 2, 20 * s * 0.8, 5, 0, 0, TAU); ctx.fill();
  ctx.translate(x + tremo, y - h - 26 * s);
  ctx.rotate(rot);
  ctx.scale(s * (lato < 0 ? -1 : 1), s);
  const bianco = flash ? TINTE_D1.guantoFlash : TINTE_D1.guanto;
  // manica nera che sale nel buio (il braccio non finisce mai)
  ctx.fillStyle = TINTE_D1.manica;
  ctx.beginPath(); ctx.moveTo(-15, -14); ctx.lineTo(-24, -420); ctx.lineTo(24, -420); ctx.lineTo(15, -14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(242,192,107,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.lineJoin = 'round';
  const contorno = () => { ctx.strokeStyle = TINTE_D1.china; ctx.lineWidth = 1.6; ctx.stroke(); };
  // polsino con l'impuntura d'oro
  ctx.fillStyle = bianco; ctx.beginPath(); ctx.roundRect(-16, -22, 32, 10, 3); ctx.fill(); contorno();
  ctx.strokeStyle = TINTE_D1.oro; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-13, -17); ctx.lineTo(13, -17); ctx.stroke();
  if (posa === 'pugno') {
    ctx.fillStyle = bianco; ctx.beginPath(); ctx.roundRect(-17, -13, 34, 26, 8); ctx.fill(); contorno();
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-12 + i * 8, 13, 4.6, 0, TAU); ctx.fillStyle = bianco; ctx.fill(); contorno(); }
    ctx.fillStyle = TINTE_D1.guantoOmbra; ctx.beginPath(); ctx.roundRect(-6, -2, 20, 7, 3); ctx.fill(); contorno(); // pollice di traverso
  } else {
    const presa = posa === 'presa';
    const floscia = posa === 'floscia';
    ctx.fillStyle = bianco; ctx.beginPath(); ctx.roundRect(-17, -13, 34, 24, 7); ctx.fill(); contorno();
    for (let i = 0; i < 4; i++) {
      const fx = -12.5 + i * 8.3;
      const ventaglio = (i - 1.5) * (floscia ? 0.05 : 0.12);
      ctx.save(); ctx.translate(fx, 9); ctx.rotate(ventaglio + (floscia ? 0.15 : 0));
      ctx.fillStyle = bianco; ctx.beginPath();
      if (presa) { ctx.moveTo(-3.6, 0); ctx.quadraticCurveTo(-4, 14, 3, 15); ctx.lineTo(3.6, 9); ctx.quadraticCurveTo(1, 8, 3.6, 0); ctx.closePath(); }
      else ctx.roundRect(-3.6, -1, 7.2, floscia ? 22 : 20 - Math.abs(i - 1.5) * 2, 3.6);
      ctx.fill(); contorno(); ctx.restore();
    }
    ctx.save(); ctx.translate(16, -4); ctx.rotate(presa ? 0.2 : -0.6);
    ctx.fillStyle = bianco; ctx.beginPath(); ctx.roundRect(-3.5, 0, 7, 15, 3.5); ctx.fill(); contorno(); ctx.restore();
    // le tre cuciture sul dorso
    ctx.strokeStyle = TINTE_D1.guantoOmbra; ctx.lineWidth = 1;
    for (const k of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(k, -9); ctx.lineTo(k, 4); ctx.stroke(); }
  }
  // luce di lanterna sul bordo alto
  ctx.strokeStyle = 'rgba(242,192,107,0.6)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-14, -12); ctx.lineTo(14, -12); ctx.stroke();
  ctx.restore();
}

function disegnaManoD1(m) {
  const rot = m.posa === 'piatta' ? (m.dirSpazza || 1) * -1.25 : 0;
  disegnaGuantoD1(m.x, m.y, m.h || 0, m.lato, m.posa === 'piatta' ? 'aperta' : m.posa, m.flash > 0, 1, rot);
}

/** Forbici colossali d'ottone (centro sul perno). */
function disegnaForbiciSagomaD1(x, y, ang, apertura, h, flash, alfa = 1) {
  const L = BURATTINAIO_D1.forbici.lunghezza;
  ctx.save();
  ctx.globalAlpha *= alfa;
  ctx.fillStyle = `rgba(0,0,0,${0.3 * Math.max(0, 1 - h / 60)})`;
  ctx.beginPath(); ctx.ellipse(x, y + 2, 26, 5, 0, 0, TAU); ctx.fill();
  ctx.translate(x, y - h - 6);
  ctx.rotate(ang);
  const lama = (segno) => {
    ctx.save(); ctx.rotate(segno * apertura * 0.5);
    const gr = ctx.createLinearGradient(0, -6, 0, 6);
    gr.addColorStop(0, TINTE_D1.ottoneLuce); gr.addColorStop(0.5, flash ? '#fff1c0' : TINTE_D1.ottone); gr.addColorStop(1, TINTE_D1.ottoneOmbra);
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(-6, -segno * 1); ctx.lineTo(L * 0.62, -segno * 6.5); ctx.lineTo(L * 0.62, segno * 0.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = TINTE_D1.china; ctx.lineWidth = 1.3; ctx.stroke();
    // anello del manico
    ctx.beginPath(); ctx.ellipse(-L * 0.28, segno * 5, 12, 7, segno * 0.3, 0, TAU);
    ctx.strokeStyle = TINTE_D1.ottone; ctx.lineWidth = 4.5; ctx.stroke();
    ctx.strokeStyle = TINTE_D1.china; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, segno * 1); ctx.lineTo(-L * 0.18, segno * 4); ctx.strokeStyle = TINTE_D1.ottone; ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
  };
  lama(1); lama(-1);
  ctx.fillStyle = '#2a1a06'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
  ctx.strokeStyle = TINTE_D1.ottoneLuce; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

function disegnaForbiciD1(f) {
  disegnaForbiciSagomaD1(f.x, f.y, f.ang || 0, f.apertura || 0, f.h || 0, f.flash > 0);
  if (f.faseD1 === 'apre' && f.tD1 % 12 < 3) { // bagliore sulla lama aperta (sulla forbice, non a terra)
    ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = '#fff6d0';
    ctx.beginPath(); ctx.arc(f.x + Math.cos(f.ang) * 30, f.y - (f.h || 0) - 6 + Math.sin(f.ang) * 30, 2.4, 0, TAU); ctx.fill(); ctx.restore();
  }
}

/** Effetti di caduta (marionette col filo tagliato, mani che si afflosciano) e i fili che cadono a vittoria. */
function disegnaEffettiD1() {
  for (const e of d1.effetti) {
    const k = e.t / 90;
    if (e.tipo === 'caduta') {
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.translate(e.x, e.y + e.t * e.t * 0.04);
      ctx.rotate(e.t * 0.08);
      ctx.fillStyle = '#100a07';
      ctx.fillRect(-3, -14, 6, 14); ctx.beginPath(); ctx.arc(0, -17, 4, 0, TAU); ctx.fill();
      ctx.fillRect(-7, -12, 14, 2.5); ctx.fillRect(-3, 0, 2, 8); ctx.fillRect(1, 0, 2, 8);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = TINTE_D1.oro; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(e.x, e.y - 30 - e.t * 3); ctx.lineTo(e.x + Math.sin(e.t * 0.3) * 4, e.y - 70 - e.t * 4); ctx.stroke(); ctx.restore();
    } else if (e.tipo === 'mano') {
      disegnaGuantoD1(e.x, e.y, e.t * e.t * 0.05, e.lato, 'floscia', false, 1 - k, 0.2 * e.lato);
    } else if (e.tipo === 'forbici') {
      disegnaForbiciSagomaD1(e.x, e.y + e.t * e.t * 0.03, e.t * 0.05, 0.3, 0, false, 1 - k);
    }
  }
  const v = d1.vittoria;
  if (v && statoRun.stanzaCorrente === d1.stanza) {
    ctx.save();
    ctx.strokeStyle = TINTE_D1.oro; ctx.lineWidth = 0.9;
    for (const f of v.fili) {
      ctx.globalAlpha = Math.max(0, 1 - v.t / BURATTINAIO_D1.vittoriaTick) * 0.9;
      ctx.beginPath(); ctx.moveTo(f.x, f.y);
      ctx.quadraticCurveTo(f.x + Math.sin(v.t * 0.1 + f.ondula) * 10, f.y + f.len / 2, f.x + Math.sin(v.t * 0.07 + f.ondula) * 4, f.y + f.len);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ===========================================================================
// 11. SONDA QA E AGGANCI
// ===========================================================================
try { if (typeof registraVoceBossB8 === 'function') registraVoceBossB8(BURATTINAIO_D1.idCapo, [TESTI_D1.voce.inizio]); } catch (_) { /* b8 assente */ }

Object.assign(window.__teatro.interni, {
  BURATTINAIO_D1, TESTI_D1,
  /** Lo scontro vero Sopra la Ribalta (b8 lo chiama da entraSopraLaRibalta). */
  scontroSopraLaRibalta: scontroSopraLaRibaltaD1,
  /**
   * QA: parte lo scontro con `sigilli` (0..3, i primi n ferri) senza giocare la run. fine() = finale narrato di b8.
   * @param {number} sigilli
   */
  provaBurattinaioD1(sigilli = 0) {
    const I = window.__teatro.interni;
    return scontroSopraLaRibaltaD1({
      sigilli, soloNumero: true,
      fine: () => { if (typeof I.finaleSopraLaRibalta === 'function') I.finaleSopraLaRibalta(); },
      annulla: () => { if (typeof tornaInPiazzaB8 === 'function' && statoRun.fase !== 'hub') tornaInPiazzaB8(false); },
    });
  },
  burattinaioD1: Object.freeze({
    stato: () => ({
      attivo: d1.attivo, atto: d1.atto, esito: d1.esito, vittoria: Boolean(d1.vittoria), sigilli: { ...d1.sigilli },
      presa: Boolean(d1.presa), intermezzo: d1.intermezzo,
      capo: (() => { const c = capoD1(); return c ? { hp: c.hp, maxHp: c.maxHp, nome: c.nome } : null; })(),
      parti: d1.stanza ? d1.stanza.nemici.filter((n) => n.hp > 0 && n.bossId !== BURATTINAIO_D1.idCapo).map((n) => ({
        id: n.bossId || n.tipo, hp: n.hp, fase: n.faseD1 || null, elite: Boolean(n.eliteD1), x: Math.round(n.x), y: Math.round(n.y),
      })) : [],
    }),
    /** QA: danno a tutte le parti vive del Burattinaio (anche in aria). */
    danneggia(q) {
      if (!d1.stanza) return;
      for (const n of d1.stanza.nemici) {
        if (n.hp > 0 && (n.bossId === 'gb-mano' || n.bossId === 'gb-forbici')) n.hp -= q;
      }
    },
    /** QA: porta avanti la scena (salta intermezzi). */
    saltaIntermezzo() { d1.intermezzo = 0; },
  }),
});
