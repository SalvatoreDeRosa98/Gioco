/*
 * d5-cambio-scena.js — (squadra d5) IL CAMBIO DI SCENA A METÀ STANZA e LE BOTOLE DI SCENA.
 *
 * 1. Stanze «in due quadri» (QUADRI_D5): alcune stanze normali (mai l'ingresso, mai boss o speciali, al massimo
 *    `massimoPerPiano` per piano, probabilità crescente col piano) hanno due compagnie. Quando cade l'ultimo nemico
 *    del primo quadro le porte NON si aprono: grancassa, luci giù, il fondale sale e ne cala un altro, gli arredi
 *    scendono nelle botole e salgono quelli del secondo quadro (un'altra disposizione di b7), poi la seconda
 *    compagnia sale dalle botole. Solo dopo il secondo quadro la stanza è pulita (si chiama la base) e arriva un
 *    premio più ricco. Durante il cambio Ferruccio è al sicuro (niente danni, i proiettili svaniscono) e, prima che
 *    salgano gli arredi nuovi, viene spostato fuori dalle loro sagome.
 *    Macchina a stati esplicita: TRANSIZIONI_D5 (primo → cambio → secondo → finito). Vale SOLO per le stanze
 *    marcate qui con `st.quadriD5`.
 * 2. Botole (BOTOLE_D5): sportelli nel tavolato. In poche stanze normali (`st.botoleD5`) 2-3 nemici del quadro
 *    entrano salendo: lo sportello TREMA (la posa che avvisa), si apre, il nemico sale. DURANTE L'ASCESA IL NEMICO
 *    NON COLPISCE E NON È COLPIBILE (non è ancora in `st.nemici`: lo disegna questo file). Una botola aperta è un
 *    buco: chi cammina non ci passa, chi vola (`player.volo`) sì. Le stesse botole servono al cambio di scena.
 *
 * Solo agganci per avvolgimento (chiamando sempre la base): generaMappaPiano, entraInStanza, verificaStanzaPulita,
 * passoLogico, subisciColpoGiocatore, disegnaStanzaPixelArt. Interni per la QA: window.__teatro.interni.d5.
 */

/** Stanze in due quadri: tutti i valori del cambio di scena. Indici dei vettori = piano nel ciclo (1..4) - 1. */
const QUADRI_D5 = Object.freeze({
  probPerPiano: Object.freeze([0.3, 0.45, 0.6, 0.75]),
  probSecondaStanza: Object.freeze([0, 0.15, 0.3, 0.45]),
  massimoPerPiano: 2,
  profonditaMin: 2,            // stanze ad almeno 2 porte dall'ingresso
  nemiciMin: 2,
  pausaPrimaMs: 450,           // dall'ultimo nemico caduto al colpo di grancassa
  cambioMs: 1700,              // durata del cambio dei macchinisti
  // frazioni del cambio: luci giù e arredi che scendono (buio → scesi), scambio a telo calato (giu),
  // arredi nuovi che salgono mentre il telo risale (salita → su)
  fasi: Object.freeze({ buio: 0.08, scesi: 0.33, giu: 0.42, salita: 0.62, su: 0.88 }),
  telo: Object.freeze({ calaFine: 0.36, risaleInizio: 0.6, risaleFine: 0.95, margine: 22 }),
  buioMax: 0.72,
  margineGiocatore: 14,        // distanza minima di Ferruccio da un arredo che sale
  ascesaSfasaMs: 170,          // la seconda compagnia sale a una botola per volta
  profonditaGruppo2: 1,        // la seconda compagnia è scelta come se la stanza fosse un passo più in là
  premioExtra: Object.freeze({ monete: 2, probMezzaMaschera: 0.5 }),
  cartelloMs: 2400,
  altezzaFondale: 64,
});

/** Botole di scena: probabilità, misure e tempi (ms). */
const BOTOLE_D5 = Object.freeze({
  probStanza: Object.freeze([0.12, 0.18, 0.24, 0.3]),
  massimoPerPiano: 2,
  quanteMin: 2, quanteMax: 3,
  w: 34, h: 20, raggioBuco: 14,
  ritardoMs: 500, intervalloMs: 550,
  tremaMs: 650, apreMs: 220, ascesaMs: 750, apertaDopoMs: 2000, chiudeMs: 260,
  profonditaAscesa: 44,
  colori: Object.freeze({ legno: '#2b1b0f', assi: '#120a05', contorno: '#c99a4a', cerniera: '#e2b85c', buio: '#050302', luce: '#ffb04a' }),
});

/** Transizioni ammesse della stanza in due quadri. */
const TRANSIZIONI_D5 = Object.freeze({ primo: 'cambio', cambio: 'secondo', secondo: 'finito', finito: null });
/** Stati di una botola: durata (chiave di BOTOLE_D5) e stato seguente. 'attesa' usa il proprio conto alla rovescia. */
const STATI_BOTOLA_D5 = Object.freeze({
  chiusa: null,
  attesa: Object.freeze({ poi: 'trema' }),
  trema: Object.freeze({ ms: 'tremaMs', poi: 'apre' }),
  apre: Object.freeze({ ms: 'apreMs', poi: 'ascesa' }),
  ascesa: Object.freeze({ ms: 'ascesaMs', poi: 'aperta' }),
  aperta: Object.freeze({ ms: 'apertaDopoMs', poi: 'chiude' }),
  chiude: Object.freeze({ ms: 'chiudeMs', poi: 'chiusa' }),
});

const variantiD5 = new WeakMap(); // stanza → variante b7 del secondo quadro (fuori dal JSON del salvataggio)

function cicloD5(piano) { return ((((piano || 1) - 1) % 4) + 4) % 4; }
function passaD5(st, nuova) {
  const q = st.quadriD5;
  if (!q || TRANSIZIONI_D5[q.fase] !== nuova) return false;
  q.fase = nuova; q.t = 0;
  return true;
}
function eBossD5(n) { return Boolean(n && (n.boss || n.isBoss || n.tipo === 'boss')); }
/** Una stanza già marcata da un'altra squadra (campi xxxD1..D9 diversi dai miei) resta fuori. */
function marcataAltroveD5(s) {
  return Object.keys(s).some((k) => /D[0-9]$/.test(k) && k !== 'quadriD5' && k !== 'botoleD5');
}
function candidataD5(s) {
  return Boolean(s && s.tipo === 'normale' && !s.pulita && Array.isArray(s.nemici) && s.disposizioneB7
    && s.nemici.length >= QUADRI_D5.nemiciMin && !s.quadriD5 && !s.botoleD5
    && (s.profonditaB7 || 1) >= QUADRI_D5.profonditaMin && !s.nemici.some(eBossD5) && !marcataAltroveD5(s));
}

// ===========================================================================
// PREPARAZIONE (alla generazione del piano)
// ===========================================================================

/**
 * Marca una stanza come «in due quadri»: sceglie la disposizione b7 e il gruppo del secondo quadro.
 * @param {object} s stanza @param {number} piano @returns {boolean} vero se marcata
 */
function preparaQuadriD5(s, piano) {
  if (typeof scegliVarianteB7 !== 'function') return false;
  let v2 = null;
  for (let i = 0; i < 8 && !v2; i++) {
    const v = scegliVarianteB7(piano);
    if (v && (!s.disposizioneB7 || v.disp.id !== s.disposizioneB7.id)) v2 = v;
  }
  if (!v2) return false;
  const scelta = scegliGruppoB7(piano, (s.profonditaB7 || 1) + QUADRI_D5.profonditaGruppo2, { tema: true });
  s.quadriD5 = { fase: 'primo', t: 0, piano, disp2: { id: v2.disp.id, variante: v2.id, nome: v2.disp.nome }, tipi2: scelta.tipi.slice(), gruppo2: scelta.id, cartello: 0 };
  variantiD5.set(s, v2);
  return true;
}

/**
 * Mette 2-3 botole nel tavolato di una stanza, lontane dalle porte e dagli arredi.
 * @param {object} s stanza @returns {boolean}
 */
function preparaBotoleD5(s) {
  const B = BOTOLE_D5, vietati = porteVietateC(s), lista = [];
  const quante = B.quanteMin + Math.floor(rng() * (B.quanteMax - B.quanteMin + 1));
  for (let i = 0; i < quante * 3 && lista.length < quante; i++) {
    const x = ARENA.x1 + 60 + rng() * (ARENA.x2 - ARENA.x1 - 120), y = ARENA.y1 + 40 + rng() * (ARENA.y2 - ARENA.y1 - 80);
    const p = puntoValidoB7(s, x, y, vietati, lista);
    if (p && lista.every((b) => Math.hypot(b.x - p.x, b.y - p.y) >= 70)) lista.push({ x: p.x, y: p.y, w: B.w, h: B.h, stato: 'chiusa', t: 0, nemico: null });
  }
  if (lista.length < B.quanteMin) return false;
  s.botoleD5 = { lista, usate: false };
  return true;
}

/** Passata sulla mappa appena generata (dopo b7): stanze in due quadri e stanze con le botole. */
function preparaMappaD5(m, piano) {
  const c = cicloD5(piano), Q = QUADRI_D5, B = BOTOLE_D5;
  const cand = shuffle(m.stanze.filter(candidataD5));
  let quadri = 0, botole = 0;
  for (const s of cand) {
    const prob = quadri === 0 ? Q.probPerPiano[c] : Q.probSecondaStanza[c];
    if (quadri < Q.massimoPerPiano && rng() < prob && preparaQuadriD5(s, piano)) { quadri++; continue; }
    if (botole < B.massimoPerPiano && rng() < B.probStanza[c] && preparaBotoleD5(s)) botole++;
  }
  return m;
}

const generaMappaPianoBaseD5 = generaMappaPiano;
generaMappaPiano = function generaMappaPianoD5(piano, ...resto) {
  const m = generaMappaPianoBaseD5.call(this, piano, ...resto);
  if (m && Array.isArray(m.stanze)) { try { preparaMappaD5(m, piano); } catch (err) { console.error('[d5] mappa', err); } }
  return m;
};

// ===========================================================================
// BOTOLE: logica
// ===========================================================================

/** Apertura 0..1 dello sportello. */
function aperturaBotolaD5(b) {
  const B = BOTOLE_D5;
  if (b.stato === 'apre') return Math.min(1, b.t / Math.max(1, ticksDaMs(B.apreMs)));
  if (b.stato === 'ascesa' || b.stato === 'aperta') return 1;
  if (b.stato === 'chiude') return Math.max(0, 1 - b.t / Math.max(1, ticksDaMs(B.chiudeMs)));
  return 0;
}
function listaBotoleD5(st) { return (st && st.botoleD5 && st.botoleD5.lista) || []; }
/** Vero se qualche nemico deve ancora salire da una botola (la stanza non è pulita). */
function inAttesaBotoleD5(st) {
  return listaBotoleD5(st).some((b) => b.nemico && b.stato !== 'aperta' && b.stato !== 'chiude' && b.stato !== 'chiusa');
}
/** Fa salire i nemici dalle botole date (una per nemico), sfasati di `sfasaMs`. Toglie i nemici da st.nemici. */
function faiSalireD5(st, coppie, ritardoMs, sfasaMs) {
  if (!st.botoleD5) st.botoleD5 = { lista: [], usate: true };
  coppie.forEach(({ b, n }, i) => {
    n.x = b.x; n.y = b.y;
    b.nemico = n; b.stato = 'attesa'; b.t = ticksDaMs(ritardoMs + i * sfasaMs);
    const k = st.nemici.indexOf(n);
    if (k >= 0) st.nemici.splice(k, 1);
    if (st.botoleD5.lista.indexOf(b) < 0) st.botoleD5.lista.push(b);
  });
}
/** Un passo della macchina a stati di ogni botola; libera il nemico a fine ascesa; il buco respinge chi cammina. */
function passoBotoleD5(st) {
  const lista = listaBotoleD5(st);
  for (let i = lista.length - 1; i >= 0; i--) {
    const b = lista[i], S = STATI_BOTOLA_D5[b.stato];
    if (!S) continue;
    if (b.stato === 'attesa') { if (--b.t <= 0) { b.stato = 'trema'; b.t = 0; } continue; }
    b.t++;
    if (b.t < ticksDaMs(BOTOLE_D5[S.ms])) continue;
    b.stato = S.poi; b.t = 0;
    if (b.stato === 'apre') suonoD5('sportello');
    if (b.stato === 'aperta' && b.nemico) { st.nemici.push(b.nemico); b.nemico = null; }
    if (b.stato === 'chiusa' && b.temporanea) lista.splice(i, 1);
  }
  if (player.volo) return;
  const R = BOTOLE_D5.raggioBuco + 9;
  for (const b of lista) {
    if (aperturaBotolaD5(b) < 0.3) continue;
    const d = Math.hypot(player.x - b.x, player.y - b.y);
    if (d < R) {
      const nx = d > 0.01 ? (player.x - b.x) / d : 0, ny = d > 0.01 ? (player.y - b.y) / d : 1;
      player.x = b.x + nx * R; player.y = b.y + ny * R;
    }
  }
}

// ===========================================================================
// CAMBIO DI SCENA: logica
// ===========================================================================

/** Vero mentre i macchinisti cambiano la scena nella stanza corrente (Ferruccio al sicuro). */
function cambioInCorsoD5() {
  const st = statoRun.stanzaCorrente;
  return Boolean(st && st.quadriD5 && st.quadriD5.fase === 'cambio');
}
function avviaCambioD5(st) {
  if (!passaD5(st, 'cambio')) return;
  const q = st.quadriD5;
  q.pausa = ticksDaMs(QUADRI_D5.pausaPrimaMs);
  q.durata = Math.max(1, ticksDaMs(QUADRI_D5.cambioMs));
  q.colpo = q.giu = q.su = q.montato = q.salitaSuono = false;
  statoRun.proiettili = []; statoRun.proiettiliNemici = [];
}
/**
 * Variante b7 del secondo quadro: quella scelta alla generazione (in memoria o, dopo un caricamento, ritrovata
 * dagli id salvati in `st.quadriD5.disp2`); solo se manca del tutto se ne estrae una nuova e la si salva.
 */
function varianteSecondoQuadroD5(st, piano) {
  const q = st.quadriD5;
  let v = variantiD5.get(st);
  if (!v && q.disp2 && typeof variantiB7 === 'function') {
    v = variantiB7().find((x) => x.id === q.disp2.variante && x.disp.id === q.disp2.id) || null;
  }
  if (!v) v = scegliVarianteB7(piano);
  if (v) { variantiD5.set(st, v); q.disp2 = { id: v.disp.id, variante: v.id, nome: v.disp.nome }; }
  return v;
}
function fuoriDagliArrediD5(o, x, y, margine) { return Math.hypot(x - o.x, y - o.y) >= (o.r || 0) + margine; }
/** Prepara il secondo quadro su una stanza d'appoggio: arredi, suolo, comparse, alcova; sposta Ferruccio e gli oggetti. */
function montaSecondoQuadroD5(st) {
  const q = st.quadriD5, piano = q.piano || statoRun.piano;
  const v2 = varianteSecondoQuadroD5(st, piano);
  const temp = { id: st.id, tipo: 'normale', porte: st.porte, muroSegreto: st.muroSegreto, nemici: [], ostacoli: [], oggettiATerra: [] };
  if (v2) applicaDisposizioneB7(temp, v2, piano);
  q.nuovi = temp.ostacoli || [];
  q.suolo2 = temp.suoloB7 || []; q.comparse2 = temp.comparseB7 || []; q.fragili2 = temp.fragiliB7 || []; q.premi2 = temp.premiB7 || [];
  const M = QUADRI_D5.margineGiocatore;
  if (!q.nuovi.every((o) => fuoriDagliArrediD5(o, player.x, player.y, M + 9))) {
    const p = puntoValidoB7(temp, player.x, player.y, [], []);
    if (p) { player.x = p.x; player.y = p.y; player.targetX = null; player.targetY = null; }
  }
  for (const it of st.oggettiATerra || []) {
    if (q.nuovi.every((o) => fuoriDagliArrediD5(o, it.x, it.y, 6))) continue;
    const p = puntoValidoB7(temp, it.x, it.y, [], []);
    if (p) { it.x = p.x; it.y = p.y; }
  }
  for (const it of temp.oggettiATerra) st.oggettiATerra.push(it); // alcova del secondo quadro: due stanze in una
  q.montato = true;
}
function entraSecondaCompagniaD5(st) {
  const q = st.quadriD5, piano = q.piano || statoRun.piano;
  const nuovi = creaNemiciB7(st, piano, q.tipi2 || []);
  st.nemici = nuovi;
  piazzaNemiciB7(st);
  allontanaNemiciDallePorteC(st, [{ x: player.x, y: player.y }]);
  const coppie = st.nemici.filter((n) => n.hp > 0).map((n) => ({ n, b: { x: n.x, y: n.y, w: BOTOLE_D5.w, h: BOTOLE_D5.h, stato: 'chiusa', t: 0, nemico: null, temporanea: true } }));
  faiSalireD5(st, coppie, 0, QUADRI_D5.ascesaSfasaMs);
}
/** Un passo del cambio: grancassa, arredi giù, arredi su, seconda compagnia. */
function passoCambioD5(st) {
  const q = st.quadriD5, F = QUADRI_D5.fasi;
  q.t++;
  statoRun.proiettiliNemici = [];
  const u = (q.t - q.pausa) / q.durata;
  if (u >= 0 && !q.colpo) { q.colpo = true; suonoD5('grancassa'); if (typeof reazionePubblicoB1 === 'function') { try { reazionePubblicoB1('cortesia'); } catch (_) { /* il pubblico non ferma la scena */ } } }
  if (u >= F.buio && !q.giu) {
    q.giu = true; q.vecchi = (st.ostacoli || []).slice();
    st.ostacoli = []; st.suoloB7 = []; st.fragiliB7 = []; st.premiB7 = [];
    suonoD5('argano');
  }
  if (u >= F.giu && !q.montato) montaSecondoQuadroD5(st); // a telo calato: nessuno vede lo scambio
  if (u >= F.salita && !q.salitaSuono) { q.salitaSuono = true; suonoD5('argano'); }
  if (u >= F.su && !q.su) {
    q.su = true;
    st.ostacoli = q.nuovi; st.suoloB7 = q.suolo2; st.comparseB7 = q.comparse2; st.fragiliB7 = q.fragili2; st.premiB7 = q.premi2;
    st.disposizioneB7 = q.disp2;
  }
  if (u >= 1 && passaD5(st, 'secondo')) {
    q.vecchi = []; q.cartello = ticksDaMs(QUADRI_D5.cartelloMs);
    entraSecondaCompagniaD5(st);
  }
}

function premioExtraD5(st) {
  const P = QUADRI_D5.premioExtra;
  for (let i = 0; i < P.monete; i++) spawnaMonetaATerra(st, 290 + i * 26, 200, 1);
  if (rng() < P.probMezzaMaschera) st.oggettiATerra.push({ tipo: 'cura', valore: 1, sprite: 'mezzaMaschera', x: 350, y: 200 });
  mostraBanner('Fine del secondo quadro! Il pubblico ringrazia: premio doppio.', 170);
  if (typeof reazionePubblicoB1 === 'function') { try { reazionePubblicoB1('applausoPieno'); } catch (_) { /* niente */ } }
}

// ===========================================================================
// AGGANCI
// ===========================================================================

const verificaStanzaPulitaBaseD5 = verificaStanzaPulita;
verificaStanzaPulita = function verificaStanzaPulitaD5(...a) {
  const st = statoRun.stanzaCorrente;
  try {
    if (st && !st.pulita) {
      if (inAttesaBotoleD5(st)) return undefined;
      const q = st.quadriD5;
      if (q && (q.fase === 'primo' || q.fase === 'cambio')) {
        if (q.fase === 'primo' && st.nemici.every((n) => n.hp <= 0)) avviaCambioD5(st);
        return undefined;
      }
      if (q && q.fase === 'secondo' && st.nemici.every((n) => n.hp <= 0)) {
        const r = verificaStanzaPulitaBaseD5.apply(this, a);
        if (st.pulita) { passaD5(st, 'finito'); premioExtraD5(st); }
        return r;
      }
    }
  } catch (err) { console.error('[d5] pulizia', err); }
  return verificaStanzaPulitaBaseD5.apply(this, a);
};

const entraInStanzaBaseD5 = entraInStanza;
entraInStanza = function entraInStanzaD5(stanza, ...resto) {
  const r = entraInStanzaBaseD5.call(this, stanza, ...resto);
  try {
    const st = statoRun.stanzaCorrente;
    if (st) {
      for (const b of listaBotoleD5(st)) { // rientro: niente di sospeso
        if (b.nemico) { st.nemici.push(b.nemico); b.nemico = null; }
        b.stato = 'chiusa'; b.t = 0;
      }
      if (st.botoleD5) st.botoleD5.lista = st.botoleD5.lista.filter((b) => !b.temporanea);
      if (st.quadriD5 && !st.pulita && st.quadriD5.fase === 'primo') st.quadriD5.cartello = ticksDaMs(QUADRI_D5.cartelloMs);
      if (st.botoleD5 && !st.botoleD5.usate && !st.pulita) {
        st.botoleD5.usate = true;
        const vivi = shuffle(st.nemici.filter((n) => n.hp > 0 && !eBossD5(n)));
        const coppie = st.botoleD5.lista.slice(0, vivi.length).map((b, i) => ({ b, n: vivi[i] }));
        faiSalireD5(st, coppie, BOTOLE_D5.ritardoMs, BOTOLE_D5.intervalloMs);
      }
    }
  } catch (err) { console.error('[d5] ingresso', err); }
  return r;
};

function fermoD5() {
  return statoRun.fase !== 'in_gioco' || Boolean(statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo || statoRun.pausa);
}
const passoLogicoBaseD5 = passoLogico;
passoLogico = function passoLogicoD5(...a) {
  const r = passoLogicoBaseD5.apply(this, a);
  try {
    const st = statoRun.stanzaCorrente;
    if (st && !fermoD5()) {
      if (st.quadriD5 && st.quadriD5.fase === 'cambio') passoCambioD5(st);
      if (st.quadriD5 && st.quadriD5.cartello > 0) st.quadriD5.cartello--;
      if (st.botoleD5) passoBotoleD5(st);
    }
  } catch (err) { console.error('[d5] passo', err); }
  return r;
};

const subisciColpoGiocatoreBaseD5 = subisciColpoGiocatore;
subisciColpoGiocatore = function subisciColpoGiocatoreD5(...a) {
  if (cambioInCorsoD5()) return false; // i macchinisti lavorano: nessuno si fa male
  return subisciColpoGiocatoreBaseD5.apply(this, a);
};

// ===========================================================================
// SUONI (Web Audio procedurale)
// ===========================================================================

/** Grancassa, argano dei macchinisti, sportello: brevi suoni procedurali; rispettano AudioSys.attivo. */
function suonoD5(nome) {
  const c = AudioSys.ctx;
  if (!c || !AudioSys.attivo) return;
  try {
    const t = c.currentTime, out = AudioSys.uscita || c.destination;
    const o = c.createOscillator(), g = c.createGain();
    if (nome === 'grancassa') {
      o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.5);
      g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    } else if (nome === 'argano') {
      o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.linearRampToValueAtTime(95, t + 0.55);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.035, t + 0.08); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    } else {
      o.type = 'square'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
      g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    }
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 1);
  } catch (_) { /* l'audio non deve mai fermare il gioco */ }
}

// ===========================================================================
// DISEGNO (a ombre)
// ===========================================================================

let luceSottopalcoD5 = null;
/** Alone caldo che sale dal sottopalco, disegnato una volta sola su una tela fuori schermo. */
function alonaD5() {
  if (luceSottopalcoD5) return luceSottopalcoD5;
  const tela = document.createElement('canvas'); tela.width = 64; tela.height = 64;
  const c = tela.getContext('2d'), g = c.createRadialGradient(32, 40, 2, 32, 36, 32);
  g.addColorStop(0, 'rgba(255,190,90,0.9)'); g.addColorStop(0.45, 'rgba(255,140,50,0.35)'); g.addColorStop(1, 'rgba(255,120,40,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  luceSottopalcoD5 = tela;
  return tela;
}

/** Disegna uno sportello di botola: `a` apertura 0..1, `scossa` tremito in px, `tk` per la polvere. */
function disegnaBotolaD5(x, y, w, h, a, scossa, tk) {
  const C = BOTOLE_D5.colori, x0 = Math.round(x - w / 2), y0 = Math.round(y - h / 2);
  ctx.save();
  if (a > 0) { // il buco: buio, e la luce calda che sale
    ctx.fillStyle = C.buio; ctx.fillRect(x0, y0, w, h);
    ctx.globalAlpha = 0.85 * a; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(alonaD5(), x - w * 0.8, y - h * 2.2, w * 1.6, h * 3);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  const dx = scossa ? Math.sin(tk * 2.1) * scossa : 0, dy = scossa ? Math.cos(tk * 2.7) * scossa * 0.6 : 0;
  const meta = (w / 2) * (1 - a);
  for (const lato of [-1, 1]) { // due ante incernierate sui fianchi
    if (meta < 1) continue;
    const xa = lato < 0 ? x0 + dx : x0 + w - meta + dx;
    ctx.fillStyle = C.legno; ctx.fillRect(xa, y0 + dy, meta, h);
    ctx.strokeStyle = C.assi; ctx.lineWidth = 1;
    for (let k = 4; k < h; k += 5) { ctx.beginPath(); ctx.moveTo(xa + 1, y0 + dy + k); ctx.lineTo(xa + meta - 1, y0 + dy + k); ctx.stroke(); }
    ctx.fillStyle = C.cerniera;
    const xc = lato < 0 ? x0 + dx : x0 + w - 3 + dx;
    ctx.fillRect(xc, y0 + dy + 3, 3, 3); ctx.fillRect(xc, y0 + dy + h - 6, 3, 3);
  }
  ctx.strokeStyle = C.contorno; ctx.globalAlpha = 0.75; ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  if (scossa) { // polvere che sbuffa dalle fessure
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#d8c39a';
    for (let i = 0; i < 5; i++) {
      const f = ((tk * 0.9 + i * 13) % 20) / 20;
      ctx.fillRect(x0 + ((i * 7 + 3) % w), y0 - f * 10, 1.5, 1.5);
    }
  }
  ctx.restore();
}

/** Sagoma d'ombra di un arredo che scende o sale (dy > 0 = più in basso, tagliata al tavolato). */
function sagomaArredoD5(o, dy) {
  if (o.tipo === 'fossa') return;
  const w = o.w || 24, h = (o.h || 24) + 18, base = o.y + (o.h || 24) / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(o.x - w, 0, w * 2, base + 1); ctx.clip();
  ctx.translate(0, dy);
  ctx.fillStyle = '#1a110a'; ctx.strokeStyle = BOTOLE_D5.colori.contorno; ctx.lineWidth = 1.6;
  if (o.tipo === 'braciere') {
    ctx.beginPath(); ctx.moveTo(o.x - w / 2, base - h * 0.55); ctx.lineTo(o.x + w / 2, base - h * 0.55);
    ctx.lineTo(o.x + w * 0.2, base - h * 0.25); ctx.lineTo(o.x + w * 0.12, base); ctx.lineTo(o.x - w * 0.12, base);
    ctx.lineTo(o.x - w * 0.2, base - h * 0.25); ctx.closePath();
  } else {
    ctx.beginPath(); ctx.rect(o.x - w / 2, base - h, w, h);
    ctx.rect(o.x - w / 2 - 3, base - h - 4, w + 6, 5);
  }
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function buioCambioD5(u) {
  const F = QUADRI_D5.fasi, M = QUADRI_D5.buioMax;
  if (u < 0) return 0;
  if (u < F.buio) return M * (u / F.buio);
  if (u < F.su) return M;
  return M * Math.max(0, 1 - (u - F.su) / (1 - F.su));
}

/**
 * Telo dipinto che cala dall'alto su tutta l'area di gioco, appeso a due corde, con la stanga in fondo e il motivo
 * del quartiere a ombre. `yb` = quota (coordinate 640x360) del bordo basso del telo.
 */
function disegnaTeloD5(yb, tk) {
  if (yb <= 0) return;
  const M = QUADRI_D5.telo.margine, x1 = ARENA.x1 - M, x2 = ARENA.x2 + M, w = x2 - x1, C = BOTOLE_D5.colori;
  const quart = typeof quartiereB7 === 'function' ? quartiereB7(statoRun.piano) : 1;
  const ondeggia = Math.sin(tk * 0.09) * 1.5;
  ctx.save();
  ctx.fillStyle = '#e2b85c'; // le due corde
  ctx.fillRect(x1 + 26, 0, 1, yb); ctx.fillRect(x2 - 27, 0, 1, yb);
  ctx.fillStyle = '#1d130b'; ctx.fillRect(x1, 0, w, yb);
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; // pieghe della tela
  for (let x = x1 + 18; x < x2; x += 38) ctx.fillRect(x + ondeggia, 0, 9, yb);
  ctx.beginPath(); ctx.rect(x1, 0, w, yb); ctx.clip();
  const cy = yb - 70, cx = (x1 + x2) / 2; // il dipinto viaggia col telo
  ctx.fillStyle = '#080504'; ctx.strokeStyle = C.contorno; ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (quart === 1) { // il Vesuvio col pennacchio, sopra il golfo
    ctx.moveTo(x1 + 20, cy + 50); ctx.lineTo(cx - 34, cy - 40); ctx.lineTo(cx - 8, cy - 32); ctx.lineTo(cx + 22, cy - 44); ctx.lineTo(x2 - 20, cy + 50); ctx.closePath();
  } else if (quart === 2) { // gli alberi della Villa
    for (let x = x1 + 40; x < x2 - 30; x += 70) { ctx.moveTo(x + 18, cy + 50); ctx.arc(x + 18, cy - 4, 26, 0, Math.PI * 2); ctx.rect(x + 14, cy + 10, 8, 40); }
  } else if (quart === 3) { // cupole e campanili
    for (let x = x1 + 30; x < x2 - 40; x += 90) { ctx.moveTo(x + 60, cy + 50); ctx.arc(x + 30, cy + 10, 30, Math.PI, 0); ctx.rect(x, cy + 10, 60, 40); ctx.rect(x + 70, cy - 30, 12, 80); }
  } else { // il colonnato della Reggia
    ctx.rect(x1 + 20, cy - 34, w - 40, 10);
    for (let x = x1 + 30; x < x2 - 30; x += 34) ctx.rect(x, cy - 24, 10, 74);
  }
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(226,184,92,0.5)'; ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('~ cambio di scena ~', cx, yb - 12);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = C.contorno; ctx.lineWidth = 1; ctx.strokeRect(x1 + 0.5, -1, w - 1, yb + 1);
  ctx.fillStyle = '#4a2e14'; ctx.fillRect(x1 - 6, yb - 2, w + 12, 6); // la stanga
  ctx.fillStyle = '#e2b85c'; ctx.fillRect(x1 - 6, yb - 2, 4, 6); ctx.fillRect(x2 + 2, yb - 2, 4, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x1, yb + 4, w, 6); // ombra sul palco
  ctx.restore();
}

/** Quota del bordo basso del telo al tempo `u` del cambio. */
function quotaTeloD5(u) {
  const T = QUADRI_D5.telo, giu = ARENA.y2 + 16;
  const liscio = (x) => x * x * (3 - 2 * x);
  if (u <= 0) return 0;
  if (u < T.calaFine) return giu * liscio(u / T.calaFine);
  if (u < T.risaleInizio) return giu;
  if (u < T.risaleFine) return giu * (1 - liscio((u - T.risaleInizio) / (T.risaleFine - T.risaleInizio)));
  return 0;
}

/** Due fondali arrotolati sotto il cielo del palco: il segno onesto di una stanza in due quadri. */
function disegnaRotoliD5() {
  ctx.save();
  for (const [x, w] of [[ARENA.x1 + 40, 150], [ARENA.x2 - 190, 150]]) {
    ctx.fillStyle = '#24160c'; ctx.fillRect(x, ARENA.y1 - 16, w, 8);
    ctx.strokeStyle = BOTOLE_D5.colori.contorno; ctx.globalAlpha = 0.7; ctx.strokeRect(x + 0.5, ARENA.y1 - 15.5, w - 1, 7);
    ctx.globalAlpha = 1; ctx.fillStyle = '#e2b85c';
    ctx.fillRect(x + 6, ARENA.y1 - 30, 1, 14); ctx.fillRect(x + w - 7, ARENA.y1 - 30, 1, 14);
  }
  ctx.restore();
}

/** Cartello del quadro, appeso in alto a sinistra (grande appena entrati / al cambio, poi piccolo). */
function disegnaCartelloD5(testo, grande) {
  const s = grande ? 1.6 : 1, w = 74 * s, h = 18 * s, x = ARENA.x1 + 8, y = ARENA.y1 + 6;
  ctx.save();
  ctx.fillStyle = '#e2b85c'; ctx.fillRect(x + 8, y - 10, 1, 10); ctx.fillRect(x + w - 9, y - 10, 1, 10);
  ctx.fillStyle = '#1b110a'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#c99a4a'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#f1d9a0'; ctx.font = `bold ${Math.round(10 * s)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(testo, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function disegnaScenaD5(tk, st) {
  const q = st.quadriD5;
  for (const b of listaBotoleD5(st)) {
    const a = aperturaBotolaD5(b);
    disegnaBotolaD5(b.x, b.y, b.w, b.h, a, b.stato === 'trema' ? 1.2 : 0, tk);
    if (b.stato === 'ascesa' && b.nemico) {
      const u = b.t / Math.max(1, ticksDaMs(BOTOLE_D5.ascesaMs));
      ctx.save();
      ctx.beginPath(); ctx.rect(b.x - 60, 0, 120, b.y + b.h / 2); ctx.clip();
      ctx.translate(0, (1 - u) * BOTOLE_D5.profonditaAscesa);
      try { disegnaNemicoPittorico(ctx, b.nemico, tk); } catch (_) { /* il disegno non ferma la scena */ }
      ctx.restore();
    }
  }
  if (!q) return;
  if (q.fase === 'primo') disegnaRotoliD5();
  if (q.fase === 'cambio') return; // il cambio lo disegna disegnaCambioD5, sopra tutta la scena
  if (q.fase === 'primo') disegnaCartelloD5('QUADRO I', q.cartello > 0);
  else if (q.fase === 'secondo' || q.fase === 'finito') disegnaCartelloD5('QUADRO II', q.cartello > 0);
}

/**
 * Il cambio di scena: buio, botole e sagome degli arredi, telo che cala e risale, Ferruccio davanti nel suo occhio
 * di bue. Disegnato appena prima dell'HUD: sopra pavimento, arredi e nemici, sotto HUD e banner.
 */
function disegnaCambioD5(tk, st) {
  const q = st.quadriD5, F = QUADRI_D5.fasi, u = (q.t - (q.pausa || 0)) / (q.durata || 1);
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${buioCambioD5(u).toFixed(3)})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  if (u >= F.buio && u < F.giu) {
    const s = Math.min(1, (u - F.buio) / (F.scesi - F.buio));
    for (const o of q.vecchi || []) {
      disegnaBotolaD5(o.x, o.y + (o.h || 20) * 0.3, (o.w || 24) + 10, 14, Math.min(1, s * 3), 0, tk);
      if (s < 1) sagomaArredoD5(o, s * ((o.h || 24) + 34));
    }
  } else if (u >= F.salita && u < 1) {
    const s = Math.min(1, (u - F.salita) / (F.su - F.salita));
    const chiusura = u < F.su ? 1 : Math.max(0, 1 - (u - F.su) / (1 - F.su));
    for (const o of q.nuovi || []) {
      disegnaBotolaD5(o.x, o.y + (o.h || 20) * 0.3, (o.w || 24) + 10, 14, chiusura, 0, tk);
      if (u < F.su) sagomaArredoD5(o, (1 - s) * ((o.h || 24) + 34));
    }
  }
  disegnaTeloD5(quotaTeloD5(u), tk);
  const P = player, lu = buioCambioD5(u) / QUADRI_D5.buioMax;
  ctx.save();
  ctx.globalAlpha = 0.6 * lu; ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(alonaD5(), P.x - 44, P.y - 60, 88, 88);
  ctx.restore();
  try { // Ferruccio resta davanti al telo
    disegnaFerruccioPittorico(ctx, P.x, P.y, { scale: 1.0, scalaA2: P.scalaA2, flipX: P.flipX, tick: tk, moving: P.moving, shootAnim: false, pickup: false, flash: false });
  } catch (_) { /* il disegno non ferma la scena */ }
  disegnaCartelloD5('CAMBIO DI SCENA', false);
}

const disegnaHUDPixelArtBaseD5 = disegnaHUDPixelArt;
disegnaHUDPixelArt = function disegnaHUDPixelArtD5(st, ...resto) {
  try {
    const sc = statoRun.stanzaCorrente;
    if (sc && sc.quadriD5 && sc.quadriD5.fase === 'cambio' && statoRun.fase === 'in_gioco') disegnaCambioD5(tick, sc);
  } catch (err) { console.error('[d5] cambio', err); }
  return disegnaHUDPixelArtBaseD5.call(this, st, ...resto);
};

const disegnaStanzaPixelArtBaseD5 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function disegnaStanzaPixelArtD5(tk, st, ...resto) {
  const r = disegnaStanzaPixelArtBaseD5.call(this, tk, st, ...resto);
  try { if (st && (st.quadriD5 || st.botoleD5)) disegnaScenaD5(tk, st); } catch (err) { console.error('[d5] disegno', err); }
  return r;
};

// ===========================================================================
// SONDA QA
// ===========================================================================

Object.assign(window.__teatro.interni, {
  QUADRI_D5, BOTOLE_D5, TRANSIZIONI_D5, STATI_BOTOLA_D5,
  d5: {
    /** Marca la stanza data (o la corrente) come stanza in due quadri, a prescindere dalla probabilità. */
    forzaQuadri(st) { const s = st || statoRun.stanzaCorrente; delete s.quadriD5; return preparaQuadriD5(s, statoRun.piano); },
    /** Mette le botole nella stanza data (o la corrente). */
    forzaBotole(st) { const s = st || statoRun.stanzaCorrente; delete s.botoleD5; return preparaBotoleD5(s); },
    cambioInCorso: cambioInCorsoD5,
    inAttesaBotole: inAttesaBotoleD5,
    aperturaBotola: aperturaBotolaD5,
  },
});
