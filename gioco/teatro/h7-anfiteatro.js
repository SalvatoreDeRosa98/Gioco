/*
 * teatro/h7-anfiteatro.js — (squadra h7) L'ANFITEATRO CAMPANO di Santa Maria Capua Vetere, «L'Arena dei Dimenticati».
 * Bibbia: trama/ferruccio-bibbia.md, Espansione III (righe 1347-1353) e, per il messaggio del padre, Espansione II
 * (riga 1345).
 *
 *   1. LA SECONDA USCITA. Battuto il Guardiano delle Acque all'Acquedotto (d6, piano 2 del ciclo), accanto alla
 *      botola compare a destra il CONDOTTO ASCIUTTO che scende ai sotterranei dell'arena: [E] Scendi all'Anfiteatro.
 *      Il piano 3 di quella notte è l'Anfiteatro (`statoRun.zonaP3 = 'anfiteatro'`, contratto comune con le altre
 *      zone del piano 3; `statoRun.percorsoH7` lo tiene per piano, e il salvataggio di e6 lo copia da sé). Chi
 *      prende la botola va a San Leucio come sempre.
 *   2. IL QUARTIERE (QUARTIERE_H7): sabbia chiara, arcate di travertino e laterizio, le gradinate con le ombre dei
 *      combattenti di molte epoche, torce sulla sabbia, i sotterranei con gabbie, carrucole e montacarichi.
 *   3. I GIURAMENTI. ...
 *   4. I NEMICI DEL LUOGO. ...
 *   5. IL BOSS: Il Giudice dell'Arena. ...
 *   6. AGNESE SULLE GRADINATE, il premio del luogo, la musica, il messaggio del padre all'Acquedotto.
 *
 * AGGANCI: avvolge solo function di primo livello chiamando sempre la base. Nei file altrui: una riga in
 * h2-memorie.js (niente fazzoletto di Bianca quando il piano 3 è un'altra zona).
 * Script classico caricato dopo teatro/h1-agnese-taddeo.js. Regole: teatro/LEGGIMI.md.
 * QA: tools/qa-teatro-anfiteatro.js. Sonda: window.__teatro.interni.anfiteatroH7.
 */

// ===========================================================================
// TABELLE (numeri e testi). Tick a 60 Hz, distanze in px del palco 640×360, velocità in px/tick.
// ===========================================================================

/** Regole del percorso e del luogo. */
const ANFITEATRO_H7 = Object.freeze({
  zona: 'anfiteatro',     // valore di statoRun.zonaP3 (contratto comune delle zone del piano 3)
  pianoUscita: 2,         // piano del ciclo dopo il cui boss (il Guardiano delle Acque) compare il condotto
  pianoLuogo: 3,          // piano del ciclo che l'Anfiteatro sostituisce (San Leucio)
  /** Il condotto asciutto nella stanza del Guardiano: posizione (in basso a sinistra: lontano da botola, Patto e dono), raggi. */
  condotto: Object.freeze({ x: 166, y: 266, raggio: 46, raggioClick: 34 }),
});

/** Il quartiere: stessi campi delle voci di QUARTIERI_PIANI (00-config.js). TESTI DA APPROVARE DALL'AUTORE. */
const QUARTIERE_H7 = Object.freeze({
  id: 'anfiteatro-campano',
  pianoNelCiclo: 3,
  nome: 'Anfiteatro Campano',
  atmosfera: 'dei Dimenticati',
  titoloCompleto: 'L\'Arena dei Dimenticati',
  meteo: 'sereno',
  coloreTema: '#f2c879',
  bordoPillola: '#9a3412',
  coloreSfondo: '#0a0705',
  coloreMuroEsterno: '#3a2c1f',
  coloreMuroInterno: '#2a1f15',
  coloreBordoMuro: '#120c07',
  coloriPiastrelle: Object.freeze(['#c9b48a', '#bfa97e', '#d2bf96', '#b8a275']),
  coloreFughe: '#9c8761',
  coloreRiflesso: '#e8d8b0',
  coloreMuschio: '#8c7651',
  colorePozzanghera: 'rgba(120, 60, 30, 0.18)',
  nemiciTipici: Object.freeze(['reziario_ombra', 'mirmillone_latta', 'belva_cartapesta', 'suonatore_corno']),
  bossTipico: 'giudice-arena',
  descrizioneSipario: Object.freeze({
    atto: 'ATTO III · ANFITEATRO CAMPANO',
    titolo: '«L\'ARENA DEI DIMENTICATI»',
    testo1: 'Sotto l\'arena di Capua il condotto finisce fra gabbie e carrucole. Sopra, la sabbia aspetta.',
    testo2: 'Sulle gradinate siedono le ombre dei combattenti di molte epoche. Non applaudono: guardano.',
    testo3: 'Certe stanze sono giuramenti: le grate si chiudono e i combattenti salgono dai montacarichi.',
  }),
});

/** Testi per il giocatore (DA APPROVARE DALL'AUTORE). */
const TESTI_H7 = Object.freeze({
  atto: (piano, stanze) => `ATTO III · ANFITEATRO CAMPANO (PIANO ${piano} · ${stanze} STANZE + 1 SEGRETA)`,
  cartiglioLuogo: 'ANFITEATRO CAMPANO',
  cartiglioCondotto: '▼ SCENDI ALL\'ANFITEATRO [E] ▼',
  bannerCondotto: '· In basso a sinistra un CONDOTTO ASCIUTTO scende verso i sotterranei dell\'arena.',
  pergamena: Object.freeze(['Percorso', 'per l\'Anfiteatro Campano']),
  diario: Object.freeze([
    'Dal condotto asciutto sono sceso sotto l\'arena di Capua. Sulle gradinate c\'erano le ombre, e mi guardavano.',
    'Stanotte niente San Leucio: l\'Anfiteatro. La sabbia era chiara, e nessuno applaudiva.',
    'Sono passato per l\'Arena dei Dimenticati. Elmi, scudi, lance: tutti fermi, tutti a guardare me.',
  ]),
});

/** Colori del disegno «a ombre»: china, bordo di lanterna, oro e rosso, più travertino, laterizio e sabbia. */
const TINTE_H7 = Object.freeze({
  china: '#0d0907', china2: '#1d1610', bordo: '#c9a15a', oro: '#f9cb40', rosso: '#b91c1c', lampo: '#fff3d6',
  travertino: '#c8b892', travertinoOmbra: '#8a7a58', laterizio: '#8a4a2c', laterizioOmbra: '#5e2f1b',
  sabbia: '#cdb88c', ferro: '#2a2622', fiamma: '#fbbf24', fiamma2: '#f97316',
});

/** Luce della ribalta di b2 all'Anfiteatro: calda di torce sulla sabbia. */
const LUCE_H7 = Object.freeze({ lume: Object.freeze([255, 186, 120]), luce: 1.0, ombra: 1.02, vignetta: 1.12 });

/** Dove stanno le torce della scena (sul muro di fondo) e i loro aloni sulla sabbia. */
const POSTI_SCENA_H7 = Object.freeze({ torce: Object.freeze([150, 490]), yTorcia: 62, alone: 92 });

// ===========================================================================
// STATO DEL MODULO
// ===========================================================================
const h7 = {
  pavimento: null, pavimentoScala: 0,   // tela del pavimento e della scenografia (statica)
  alone: null, aloneScala: 0,           // tela dell'alone delle torce (statica)
};

const limitaH7 = (v, a, b) => Math.max(a, Math.min(b, v));
const pianoNelCicloH7 = (piano = statoRun.piano) => ((Math.max(1, piano || 1) - 1) % 4) + 1;

/**
 * Il piano è (o sarà) l'Anfiteatro in questa run? Vale solo per il piano 3 del ciclo, e solo se `statoRun.zonaP3`
 * è 'anfiteatro' (il contratto delle zone del piano 3) o il percorso della run lo segna per quel piano.
 * @param {number} [piano] piano assoluto (o nel ciclo); senza argomento, quello in corso
 */
function anfiteatroAttivoH7(piano = statoRun.piano) {
  if (!statoRun || pianoNelCicloH7(piano) !== ANFITEATRO_H7.pianoLuogo) return false;
  const m = statoRun.percorsoH7;
  if (m && m[piano] === ANFITEATRO_H7.zona) return true;
  return statoRun.zonaP3 === ANFITEATRO_H7.zona && pianoNelCicloH7(statoRun.piano) === ANFITEATRO_H7.pianoLuogo;
}

/** Segna il piano come Anfiteatro (o lo toglie) senza andarci. */
function segnaAnfiteatroH7(piano, si = true) {
  const m = Object.assign({}, statoRun.percorsoH7);
  if (si) m[piano] = ANFITEATRO_H7.zona; else delete m[piano];
  statoRun.percorsoH7 = m;
}

/** Scende nel condotto asciutto: il piano successivo è l'Anfiteatro. */
function prendiAnfiteatroH7() {
  const prossimo = statoRun.piano + 1;
  segnaAnfiteatroH7(prossimo, true);
  statoRun.zonaP3 = ANFITEATRO_H7.zona;
  suonoSabbiaH7(0.6);
  avviaPiano(prossimo, true);
}

// ===========================================================================
// SUONI (Web Audio procedurale sul contesto di AudioSys; rispettano il muto)
// ===========================================================================
function rumoreH7(c) {
  if (h7.rumore && h7.rumore.sampleRate === c.sampleRate) return h7.rumore;
  const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = b.getChannelData(0);
  let s = 7451;
  for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = (s / 4294967296) * 2 - 1; }
  h7.rumore = b;
  return b;
}

/** Rumore filtrato con inviluppo: `da`→`a` Hz in `sec` secondi. */
function soffioH7(sec, da, a, vol, q = 1.2) {
  const c = AudioSys.ctx;
  if (!c || !AudioSys.attivo) return;
  try {
    const t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = rumoreH7(c); src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(da, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, a), t + sec);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0008, t);
    g.gain.exponentialRampToValueAtTime(vol, t + sec * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0008, t + sec);
    src.connect(f); f.connect(g); g.connect(AudioSys.uscita || c.destination);
    src.start(t); src.stop(t + sec + 0.05);
  } catch (_) { /* l'audio non deve mai fermare il gioco */ }
}

/** Sabbia che scorre (condotto, montacarichi). */
function suonoSabbiaH7(sec = 0.4) { soffioH7(sec, 900, 260, 0.05, 0.7); }

/** Un tono semplice (corno, grate). */
function tonoH7(freq, sec, vol = 0.06, tipo = 'sawtooth', scendeA = null) {
  const c = AudioSys.ctx;
  if (!c || !AudioSys.attivo) return;
  try {
    const t = c.currentTime;
    const o = c.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(freq, t);
    if (scendeA) o.frequency.exponentialRampToValueAtTime(scendeA, t + sec);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0008, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0008, t + sec);
    o.connect(f); f.connect(g); g.connect(AudioSys.uscita || c.destination);
    o.start(t); o.stop(t + sec + 0.05);
  } catch (_) { /* niente audio */ }
}

// ===========================================================================
// 1. LA SECONDA USCITA: il condotto asciutto nella stanza del Guardiano delle Acque
// ===========================================================================
/** Il condotto della stanza corrente, se c'è. */
function condottoQuiH7() {
  const st = statoRun.stanzaCorrente;
  return st && st.tipo === 'boss' && st.pulita && st.condottoH7 ? st.condottoH7 : null;
}

/**
 * [E] accanto al condotto asciutto: scende all'Anfiteatro. Rende true se ha consumato l'azione.
 * @returns {boolean}
 */
function usaCondottoH7() {
  if (statoRun.fase !== 'in_gioco' || statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo) return false;
  if (!condottoQuiH7()) return false;
  const C = ANFITEATRO_H7.condotto;
  if (Math.hypot(player.x - C.x, player.y - C.y) >= C.raggio) return false;
  prendiAnfiteatroH7();
  return true;
}

/** Il boss della stanza era il Guardiano delle Acque di d6, all'Acquedotto? */
function eraGuardianoH7(st) {
  if (typeof SCHEDA_D6 !== 'object' || typeof acquedottoAttivoD6 !== 'function' || !acquedottoAttivoD6()) return false;
  return pianoNelCicloH7() === ANFITEATRO_H7.pianoUscita && st.nemici.some((n) => n.boss && n.bossId === SCHEDA_D6.id);
}

const interagisciStanzaBaseH7 = interagisciStanza;
/** [E]: prima il condotto asciutto (se ci sei accanto), poi tutto il resto. */
interagisciStanza = function (...args) {
  try { if (usaCondottoH7()) return undefined; } catch (err) { console.error('[h7] condotto', err); }
  return interagisciStanzaBaseH7.apply(this, args);
};

// Click (e tocco breve) sul condotto: come per la grata di d6, ci si porta accanto e si scende.
window.addEventListener('mousedown', (e) => {
  try {
    if (e.target !== canvas || statoRun.pausa || !condottoQuiH7()) return;
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height);
    const C = ANFITEATRO_H7.condotto;
    if (Math.hypot(mx - C.x, my - C.y) >= C.raggioClick) return;
    player.x = C.x; player.y = C.y + 14; player.targetX = null; player.targetY = null;
    if (usaCondottoH7()) e.stopImmediatePropagation();
  } catch (err) { console.error('[h7] click', err); }
}, true);

const verificaStanzaPulitaBaseH7 = verificaStanzaPulita;
/** Guardiano delle Acque caduto: compare il condotto asciutto. */
verificaStanzaPulita = function (...args) {
  const st = statoRun.stanzaCorrente;
  const era = Boolean(st && st.pulita);
  const r = verificaStanzaPulitaBaseH7.apply(this, args);
  try {
    if (st && !era && st.pulita && st.tipo === 'boss' && st.uscitaAperta && !st.condottoH7 && eraGuardianoH7(st)) {
      st.condottoH7 = { t0: tick };
      mostraBanner(`${statoRun.banner || ''} ${TESTI_H7.bannerCondotto}`.trim(), 340);
    }
  } catch (err) { console.error('[h7] stanza pulita', err); }
  return r;
};

/** Disegna il condotto asciutto e il suo cartiglio (dentro la catena di disegnaStanzaPixelArt: sotto le figure). */
function disegnaCondottoH7(c, tk) {
  const C = ANFITEATRO_H7.condotto, x = C.x, y = C.y, T = TINTE_H7;
  const apre = Math.min(1, (tk - (c.t0 || 0)) / 40);
  ctx.save();
  // bocca ad arco in travertino
  ctx.fillStyle = T.travertinoOmbra; ctx.strokeStyle = T.china; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x - 25, y + 20); ctx.lineTo(x - 25, y - 6); ctx.arc(x, y - 6, 25, Math.PI, 0); ctx.lineTo(x + 25, y + 20); ctx.closePath(); ctx.fill(); ctx.stroke();
  // conci dell'arco
  ctx.strokeStyle = T.travertino; ctx.lineWidth = 1;
  for (let k = 0; k <= 6; k++) {
    const a = Math.PI + (k / 6) * Math.PI;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 19, y - 6 + Math.sin(a) * 19); ctx.lineTo(x + Math.cos(a) * 25, y - 6 + Math.sin(a) * 25); ctx.stroke();
  }
  // il buio che scende
  const gr = ctx.createLinearGradient(0, y - 22, 0, y + 18);
  gr.addColorStop(0, '#1a120a'); gr.addColorStop(1, T.china);
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.moveTo(x - 19, y + 18); ctx.lineTo(x - 19, y - 6); ctx.arc(x, y - 6, 19, Math.PI, 0); ctx.lineTo(x + 19, y + 18); ctx.closePath(); ctx.fill();
  // gradini di sabbia che spariscono nel buio
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = apre * (0.9 - i * 0.2);
    ctx.fillStyle = T.sabbia;
    ctx.fillRect(x - 17 + i * 3, y + 14 - i * 6, 34 - i * 6, 2.4);
  }
  ctx.globalAlpha = 1;
  // un filo di sabbia che cade dalla chiave dell'arco
  ctx.fillStyle = T.sabbia;
  for (let i = 0; i < 4; i++) { const k = ((tk * 0.04 + i * 0.25) % 1); ctx.globalAlpha = 0.7 * (1 - k); ctx.fillRect(x - 0.6, y - 28 + k * 30, 1.2, 1.6); }
  ctx.globalAlpha = 1;
  // cartiglio col nome del luogo
  const cw = 124, ch = 25, cx = x - cw / 2, cy = y - 32 - ch - 6;
  ctx.fillStyle = '#e6d2aa'; ctx.strokeStyle = '#5c4024'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.fill();
  ctx.strokeRect(cx + 2, cy + 2, cw - 4, ch - 4);
  ctx.beginPath(); ctx.moveTo(x - 5, cy + ch); ctx.lineTo(x, cy + ch + 5); ctx.lineTo(x + 5, cy + ch); ctx.closePath(); ctx.fill();
  drawTextFit(TESTI_H7.cartiglioLuogo, x, cy + 10, cw - 10, { size: 8, color: '#5c1a0c', shadow: false });
  drawTextFit(TESTI_H7.cartiglioCondotto, x, cy + 20, cw - 10, { size: 7, color: '#14532d', shadow: false });
  ctx.restore();
}

// ===========================================================================
// 2. IL QUARTIERE: voce, sipario, pavimento e scenografia dipinta
// ===========================================================================
const getQuartierePianoBaseH7 = getQuartierePiano;
/** Il quartiere del piano: l'Anfiteatro se il piano 3 di stanotte lo è, altrimenti quello di sempre. */
getQuartierePiano = function (piano, ...resto) {
  try { if (anfiteatroAttivoH7(piano)) return QUARTIERE_H7; } catch (err) { console.error('[h7] quartiere', err); }
  return getQuartierePianoBaseH7.call(this, piano, ...resto);
};

const getRaccontoAttoBaseH7 = getRaccontoAtto;
/** Cartellone d'ingresso del piano: quello dell'Anfiteatro quando ci si entra. */
getRaccontoAtto = function (piano, ciclo, ...resto) {
  const base = getRaccontoAttoBaseH7.call(this, piano, ciclo, ...resto);
  try {
    if (base && anfiteatroAttivoH7(piano)) {
      const D = QUARTIERE_H7.descrizioneSipario;
      return { ...base, atto: TESTI_H7.atto(piano, numeroStanzeCombattimento(piano)), titolo: D.titolo, testo1: D.testo1, testo2: D.testo2, testo3: D.testo3 };
    }
  } catch (err) { console.error('[h7] sipario', err); }
  return base;
};

/** Generatore deterministico per le trame dipinte. */
function casoFissoH7(seme) {
  let s = seme >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 16) / 65536; };
}

/**
 * Un'ombra di combattente seduta sulle gradinate: elmo (di un'epoca o dell'altra), spalle, scudo o lancia.
 * Sagoma ferma che guarda: due punti di lanterna al posto degli occhi.
 */
function ombraCombattenteH7(x, cx, base, alta, r) {
  const elmo = Math.floor(r() * 4), arma = Math.floor(r() * 3);
  x.fillStyle = TINTE_H7.china;
  // spalle e busto
  x.beginPath(); x.moveTo(cx - 3.2 * alta, base); x.quadraticCurveTo(cx - 3 * alta, base - 4 * alta, cx, base - 4.4 * alta);
  x.quadraticCurveTo(cx + 3 * alta, base - 4 * alta, cx + 3.2 * alta, base); x.closePath(); x.fill();
  // testa
  const ty = base - 5.4 * alta;
  x.beginPath(); x.arc(cx, ty, 1.7 * alta, 0, TAU); x.fill();
  if (elmo === 0) { // cresta (elmo antico)
    x.beginPath(); x.moveTo(cx - 2 * alta, ty - 0.8 * alta); x.quadraticCurveTo(cx, ty - 4.6 * alta, cx + 2.4 * alta, ty - 0.4 * alta); x.lineTo(cx + 1.4 * alta, ty - 1.4 * alta); x.closePath(); x.fill();
  } else if (elmo === 1) { // tesa larga (mirmillone)
    x.fillRect(cx - 2.8 * alta, ty - 0.2 * alta, 5.6 * alta, 0.9 * alta);
  } else if (elmo === 2) { // morione a punta (di un'altra epoca)
    x.beginPath(); x.moveTo(cx - 2.6 * alta, ty); x.lineTo(cx, ty - 3.4 * alta); x.lineTo(cx + 2.6 * alta, ty); x.closePath(); x.fill();
  }
  if (arma === 0) { // lancia
    x.fillRect(cx + 3.4 * alta, base - 11 * alta, 0.5 * alta + 0.3, 11 * alta);
    x.beginPath(); x.moveTo(cx + 3.6 * alta, base - 13 * alta); x.lineTo(cx + 3 * alta, base - 10.6 * alta); x.lineTo(cx + 4.3 * alta, base - 10.6 * alta); x.closePath(); x.fill();
  } else if (arma === 1) { // scudo tondo
    x.beginPath(); x.arc(cx - 3 * alta, base - 1.8 * alta, 2.4 * alta, 0, TAU); x.fill();
    x.strokeStyle = TINTE_H7.bordo; x.globalAlpha = 0.35; x.lineWidth = 0.5; x.stroke(); x.globalAlpha = 1;
  }
  // contorno color lanterna sulla spalla, e gli occhi che guardano
  x.strokeStyle = TINTE_H7.bordo; x.globalAlpha = 0.3; x.lineWidth = 0.5;
  x.beginPath(); x.arc(cx, ty, 1.7 * alta, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); x.globalAlpha = 1;
  if (r() < 0.55) { x.fillStyle = '#f2c879'; x.globalAlpha = 0.7; x.fillRect(cx - 0.9 * alta, ty - 0.1, 0.5, 0.5); x.fillRect(cx + 0.5 * alta, ty - 0.1, 0.5, 0.5); x.globalAlpha = 1; }
}

/** FONDALE: cielo, il giro delle arcate di travertino e laterizio, le gradinate con le ombre, sulla fascia alta. */
function dipingiFondaleH7(x, r) {
  const y0 = 52, y1 = 70, T = TINTE_H7;
  const cielo = x.createLinearGradient(0, y0, 0, y1);
  cielo.addColorStop(0, '#0b0f20'); cielo.addColorStop(1, '#2a1e2a');
  x.fillStyle = cielo; x.fillRect(48, y0, 544, y1 - y0);
  for (let i = 0; i < 30; i++) { x.fillStyle = r() < 0.3 ? '#fff3d6' : '#a4a8c8'; x.fillRect(Math.round(50 + r() * 540), Math.round(y0 + 1 + r() * 4), 1, 1); }
  // l'anello esterno: arcate (in curva: più basse ai lati)
  x.fillStyle = T.travertinoOmbra;
  x.beginPath(); x.moveTo(48, y1); x.lineTo(48, 57);
  for (let ax = 48; ax <= 592; ax += 8) x.lineTo(ax, 55 + Math.pow((ax - 320) / 272, 2) * 3);
  x.lineTo(592, y1); x.closePath(); x.fill();
  x.fillStyle = '#140d10';
  for (let ax = 52; ax < 588; ax += 9) {
    const top = 57.5 + Math.pow((ax - 320) / 272, 2) * 3;
    x.beginPath(); x.moveTo(ax, top + 4); x.lineTo(ax, top + 1.6); x.arc(ax + 2.4, top + 1.6, 2.4, Math.PI, 0); x.lineTo(ax + 4.8, top + 4); x.closePath(); x.fill();
  }
  // le gradinate: tre file di gradini di laterizio con le ombre sedute
  for (let f = 0; f < 3; f++) {
    const gy = 62 + f * 2.8;
    x.fillStyle = f % 2 ? T.laterizio : T.laterizioOmbra; x.fillRect(48, gy, 544, 2.8);
    x.fillStyle = T.travertino; x.globalAlpha = 0.6; x.fillRect(48, gy, 544, 0.5); x.globalAlpha = 1;
  }
  for (let f = 0; f < 3; f++) {
    const gy = 62 + f * 2.8 + 2.6, alta = 0.62 + f * 0.1;
    for (let cx = 56 + r() * 10; cx < 586; cx += 9 + r() * 16) {
      if (cx > 296 && cx < 344) continue; // il varco del podio (qui siede il Giudice)
      ombraCombattenteH7(x, cx, gy, alta, r);
    }
  }
  // il podio del Giudice al centro, vuoto finché lui non è in scena
  x.fillStyle = T.travertino; x.fillRect(306, 60, 28, 10);
  x.fillStyle = T.travertinoOmbra; x.fillRect(306, 60, 28, 1.2); x.fillRect(306, 68.4, 28, 1.6);
  x.fillStyle = T.rosso; x.fillRect(312, 62, 16, 6);
  x.fillStyle = T.oro; x.fillRect(312, 62, 16, 0.8);
  // il listello della tela dipinta
  x.fillStyle = T.china; x.fillRect(48, y1 - 0.6, 544, 1.6);
  x.fillStyle = T.bordo; x.globalAlpha = 0.7; x.fillRect(48, y1 + 0.4, 544, 0.6); x.globalAlpha = 1;
}

/** QUINTA dipinta: un pilastro di travertino e laterizio con due ordini di arcate (la porta laterale nel mezzo). */
function dipingiQuintaH7(x, x0, r) {
  const w = 20, T = TINTE_H7;
  x.fillStyle = T.laterizioOmbra; x.fillRect(x0, 70, w, 234);
  // filari di mattoni
  for (let yy = 70; yy < 304; yy += 3) {
    x.fillStyle = r() < 0.5 ? T.laterizio : '#7a3f24';
    x.fillRect(x0, yy, w, 2.4);
    x.fillStyle = '#3a1d10';
    const sf = (Math.floor(yy / 3) % 2) * 3;
    for (let bx = x0 + sf; bx < x0 + w; bx += 6) x.fillRect(bx, yy, 0.6, 2.4);
  }
  // fasce di travertino e archi
  for (const yA of [72, 188]) {
    x.fillStyle = T.travertino; x.fillRect(x0, yA, w, 6);
    x.fillStyle = T.travertinoOmbra; x.fillRect(x0, yA + 5, w, 1);
    const cx = x0 + w / 2, alto = yA + 18, basso = yA + 84;
    x.fillStyle = '#120a08';
    x.beginPath(); x.moveTo(cx - 6, basso); x.lineTo(cx - 6, alto); x.arc(cx, alto, 6, Math.PI, 0); x.lineTo(cx + 6, basso); x.closePath(); x.fill();
    x.strokeStyle = T.travertino; x.lineWidth = 1.6; x.beginPath(); x.arc(cx, alto, 7, Math.PI, 0); x.stroke();
    x.fillStyle = T.oro; x.globalAlpha = 0.6; x.fillRect(cx - 0.5, alto + 6 + r() * 30, 1, 1); x.globalAlpha = 1;
  }
  x.fillStyle = T.china; x.fillRect(x0 === 48 ? x0 + w - 1 : x0, 70, 1.2, 234);
}

/** Tela del pavimento (sabbia rastrellata) e della scenografia dell'Anfiteatro, alla risoluzione del buffer. */
function telaPavimentoH7() {
  if (h7.pavimento && h7.pavimentoScala === scalaBase) return h7.pavimento;
  const q = QUARTIERE_H7, T = TINTE_H7;
  const fc = document.createElement('canvas');
  fc.width = Math.round(W * scalaBase);
  fc.height = Math.round(H * scalaBase);
  const x = fc.getContext('2d');
  x.setTransform(scalaBase, 0, 0, scalaBase, 0, 0);
  x.imageSmoothingEnabled = false;
  const r = casoFissoH7(1845 * 11 + 3);
  x.fillStyle = q.coloreSfondo; x.fillRect(0, 0, W, H);
  x.fillStyle = q.coloreMuroInterno; x.fillRect(48, 52, W - 96, H - 96);

  // la sabbia: un fondo chiaro, chiazze, solchi del rastrello e granelli
  x.save();
  x.beginPath(); x.rect(68, 70, 504, 234); x.clip();
  const g = x.createLinearGradient(0, 70, 0, 304);
  g.addColorStop(0, '#a8936b'); g.addColorStop(0.35, q.coloriPiastrelle[0]); g.addColorStop(1, '#b49d72');
  x.fillStyle = g; x.fillRect(68, 70, 504, 234);
  for (let i = 0; i < 26; i++) {
    x.fillStyle = q.coloriPiastrelle[Math.floor(r() * q.coloriPiastrelle.length)]; x.globalAlpha = 0.55;
    x.beginPath(); x.ellipse(80 + r() * 480, 80 + r() * 214, 18 + r() * 40, 6 + r() * 12, 0, 0, TAU); x.fill();
  }
  x.globalAlpha = 1;
  // solchi ad arco (il rastrello gira attorno al centro dell'arena)
  x.strokeStyle = q.coloreFughe; x.lineWidth = 0.7;
  for (let k = 0; k < 14; k++) {
    const rx = 40 + k * 22, ry = rx * 0.42;
    x.globalAlpha = 0.28 + (k % 2) * 0.12;
    x.beginPath(); x.ellipse(320, 192, rx, ry, 0, 0, TAU); x.stroke();
    x.strokeStyle = q.coloreRiflesso; x.globalAlpha = 0.18;
    x.beginPath(); x.ellipse(320, 191, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
    x.strokeStyle = q.coloreFughe;
  }
  x.globalAlpha = 1;
  for (let i = 0; i < 900; i++) {
    x.fillStyle = r() < 0.5 ? '#e6d6ae' : '#8c7651'; x.globalAlpha = 0.5;
    x.fillRect(68 + r() * 504, 70 + r() * 234, 1, 1);
  }
  x.globalAlpha = 1;
  // l'ombra del muro di fondo sulla sabbia
  const om = x.createLinearGradient(0, 70, 0, 92);
  om.addColorStop(0, 'rgba(20, 12, 6, 0.55)'); om.addColorStop(1, 'rgba(20, 12, 6, 0)');
  x.fillStyle = om; x.fillRect(68, 70, 504, 22);
  x.restore();

  dipingiFondaleH7(x, r);
  dipingiQuintaH7(x, 48, r);
  dipingiQuintaH7(x, 572, r);
  // il podio basso dell'arena (balteo) in travertino, in basso
  x.fillStyle = T.travertinoOmbra; x.fillRect(48, 304, 544, 12);
  for (let bx = 50; bx < 590; bx += 22) { x.fillStyle = r() < 0.5 ? T.travertino : '#b5a57f'; x.fillRect(bx, 306, 20, 8); }
  x.fillStyle = T.bordo; x.globalAlpha = 0.45; x.fillRect(48, 304, 544, 0.7); x.globalAlpha = 1;
  x.strokeStyle = q.coloreBordoMuro; x.lineWidth = 2; x.strokeRect(48, 52, W - 96, H - 96);

  h7.pavimento = fc; h7.pavimentoScala = scalaBase;
  return fc;
}

/** Tela dell'alone caldo di una torcia sulla sabbia (statica: per fotogramma si cambia solo l'alfa). */
function telaAloneH7() {
  if (h7.alone && h7.aloneScala === scalaBase) return h7.alone;
  const R = POSTI_SCENA_H7.alone;
  const c = document.createElement('canvas');
  c.width = c.height = Math.round(R * 2 * scalaBase);
  const g = c.getContext('2d');
  g.setTransform(scalaBase, 0, 0, scalaBase, 0, 0);
  const gr = g.createRadialGradient(R, R, 4, R, R, R);
  gr.addColorStop(0, 'rgba(255, 190, 110, 0.32)'); gr.addColorStop(0.5, 'rgba(255, 160, 80, 0.12)'); gr.addColorStop(1, 'rgba(255, 140, 60, 0)');
  g.fillStyle = gr; g.fillRect(0, 0, R * 2, R * 2);
  h7.alone = c; h7.aloneScala = scalaBase;
  return c;
}

const getFloorTileCanvasBaseH7 = getFloorTileCanvas;
/** Pavimento del piano: la sabbia dell'arena se il piano è l'Anfiteatro. */
getFloorTileCanvas = function (piano, ...resto) {
  try { if (anfiteatroAttivoH7(piano || statoRun.piano)) return telaPavimentoH7(); } catch (err) { console.error('[h7] pavimento', err); }
  return getFloorTileCanvasBaseH7.call(this, piano, ...resto);
};

/** Una torcia sul muro di fondo: asta, braciere, fiamma che guizza. */
function disegnaTorciaH7(x, y, tk) {
  const T = TINTE_H7, f = Math.sin(tk * 0.31 + x) * 0.5 + Math.sin(tk * 0.17 + x * 0.3) * 0.5;
  ctx.fillStyle = T.china; ctx.fillRect(x - 1, y - 2, 2, 10);
  ctx.beginPath(); ctx.moveTo(x - 4, y - 3); ctx.lineTo(x + 4, y - 3); ctx.lineTo(x + 2, y + 1); ctx.lineTo(x - 2, y + 1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = T.bordo; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.fillStyle = T.fiamma2;
  ctx.beginPath(); ctx.moveTo(x - 3.4, y - 3); ctx.quadraticCurveTo(x - 2 + f, y - 9, x + f * 1.4, y - 12 - f); ctx.quadraticCurveTo(x + 2.4, y - 8, x + 3.4, y - 3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = T.fiamma;
  ctx.beginPath(); ctx.moveTo(x - 1.8, y - 3); ctx.quadraticCurveTo(x - 1 + f * 0.6, y - 7, x + f, y - 9 - f * 0.6); ctx.quadraticCurveTo(x + 1.4, y - 6, x + 1.8, y - 3); ctx.closePath(); ctx.fill();
}

const disegnaAtmosferaQuartiereBaseH7 = disegnaAtmosferaQuartiere;
/** Atmosfera del piano: all'Anfiteatro gli aloni delle torce sulla sabbia e le torce, al posto di San Leucio. */
disegnaAtmosferaQuartiere = function (tk, piano, ...resto) {
  if (!anfiteatroAttivoH7(piano)) return disegnaAtmosferaQuartiereBaseH7.call(this, tk, piano, ...resto);
  try { disegnaLuogoH7(tk, statoRun.stanzaCorrente); } catch (err) { console.error('[h7] atmosfera', err); }
  return undefined;
};

/** Ciò che sta a filo del palco o sul muro: aloni delle torce, torce, velo notturno ai bordi. */
function disegnaLuogoH7(tk, st) {
  const P = POSTI_SCENA_H7, R = P.alone;
  const tela = telaPavimentoH7(), k = tela.width / W, alone = telaAloneH7();
  ctx.save();
  for (const fx of P.torce) {
    const guizzo = 0.82 + 0.18 * Math.sin(tk * 0.21 + fx) * Math.sin(tk * 0.13 + fx * 0.7);
    ctx.globalAlpha = guizzo;
    ctx.drawImage(alone, fx - R, 70 - R * 0.35, R * 2, R * 1.3);
    ctx.globalAlpha = 1;
    ctx.drawImage(tela, (fx - 13) * k, 52 * k, 26 * k, 18 * k, fx - 13, 52, 26, 18);
    disegnaTorciaH7(fx, P.yTorcia, tk);
  }
  if (OPZIONI.vignetta !== false) {
    const vg = ctx.createRadialGradient(W / 2, H / 2 + 10, 150, W / 2, H / 2, 330);
    vg.addColorStop(0, 'rgba(14, 8, 4, 0)');
    vg.addColorStop(1, 'rgba(14, 8, 4, 0.4)');
    ctx.fillStyle = vg; ctx.fillRect(48, 52, W - 96, H - 96);
  }
  ctx.restore();
}

const disegnaStanzaPixelArtBaseH7 = disegnaStanzaPixelArt;
/** Dopo la stanza: il condotto asciutto (se c'è), sotto le figure. */
disegnaStanzaPixelArt = function (tk, st, ...resto) {
  const r = disegnaStanzaPixelArtBaseH7.call(this, tk, st, ...resto);
  try {
    if (st && st.tipo === 'boss' && st.pulita && st.condottoH7) disegnaCondottoH7(st.condottoH7, tk);
  } catch (err) { console.error('[h7] stanza', err); }
  return r;
};

const luceLuogoBaseH7 = luceLuogoB2;
/** La luce della ribalta (b2): all'Anfiteatro calda di torce. */
luceLuogoB2 = function (...a) {
  if (statoRun && anfiteatroAttivoH7()) return LUCE_H7;
  return luceLuogoBaseH7.apply(this, a);
};

// ===========================================================================
// AVVIO DELLA RUN E DEL PIANO
// ===========================================================================
const nuovaRunBaseH7 = nuovaRun;
/** Run nuova: nessun percorso scelto, nessuna zona del piano 3. */
nuovaRun = function (...args) {
  statoRun.percorsoH7 = null;
  if (statoRun.zonaP3 === ANFITEATRO_H7.zona) delete statoRun.zonaP3;
  const r = nuovaRunBaseH7.apply(this, args);
  statoRun.percorsoH7 = null;
  if (statoRun.zonaP3 === ANFITEATRO_H7.zona) delete statoRun.zonaP3;
  return r;
};

const avviaPianoBaseH7 = avviaPiano;
/**
 * Avvio di un piano. Contratto delle zone del piano 3: un piano che non è il terzo del ciclo azzera
 * `statoRun.zonaP3`; il terzo la prende dal percorso della run (anche dopo «Riprendi la notte» di e6).
 */
avviaPiano = function (piano, ...resto) {
  try {
    if (pianoNelCicloH7(piano) !== ANFITEATRO_H7.pianoLuogo) delete statoRun.zonaP3;
    else if (statoRun.percorsoH7 && statoRun.percorsoH7[piano] === ANFITEATRO_H7.zona) statoRun.zonaP3 = ANFITEATRO_H7.zona;
    else if (statoRun.zonaP3 === ANFITEATRO_H7.zona) delete statoRun.zonaP3;
  } catch (err) { console.error('[h7] zona', err); }
  const r = avviaPianoBaseH7.call(this, piano, ...resto);
  try { if (anfiteatroAttivoH7(piano)) ricordaPercorsoH7(); } catch (err) { console.error('[h7] piano', err); }
  return r;
};

// ===========================================================================
// LA MEMORIA DEL PERCORSO: conto della notte (e6/a7) e Diario di Ferruccio (b8)
// ===========================================================================
/** La run in corso è passata per l'Anfiteatro: lo si scrive nella sua voce del Registro. */
function ricordaPercorsoH7() {
  try { if (typeof a7 === 'object' && a7 && a7.run) a7.run.zonaP3H7 = ANFITEATRO_H7.zona; } catch (_) { /* a7 assente */ }
}

// Conto della notte di e6 (prende il posto della pergamena di a7): una riga «Percorso» in più.
if (typeof noteVoceE6 === 'function') {
  const noteVoceBaseH7 = noteVoceE6;
  noteVoceE6 = function (v, ...resto) {
    const note = noteVoceBaseH7.call(this, v, ...resto);
    try { if (v && v.zonaP3H7 === ANFITEATRO_H7.zona && Array.isArray(note)) note.push([TESTI_H7.pergamena[0], TESTI_H7.pergamena[1]]); } catch (_) { /* niente */ }
    return note;
  };
}

// Diario di Ferruccio di b8: una riga nella pagina di quella notte, al posto di quella di San Leucio.
if (typeof componiPaginaB8 === 'function') {
  const componiPaginaBaseH7 = componiPaginaB8;
  componiPaginaB8 = function (v, nota, ...resto) {
    const pagina = componiPaginaBaseH7.call(this, v, nota, ...resto);
    try {
      if (v && v.zonaP3H7 === ANFITEATRO_H7.zona && pagina && Array.isArray(pagina.righe)) {
        const riga = TESTI_H7.diario[Math.abs(Math.floor(Number(pagina.notte) || 0)) % TESTI_H7.diario.length];
        if (!pagina.righe.includes(riga)) {
          const diLeucio = (typeof DIARIO_B8 !== 'undefined' && DIARIO_B8.cammino && DIARIO_B8.cammino[ANFITEATRO_H7.pianoLuogo]) || [];
          const i = pagina.righe.findIndex((r) => diLeucio.some((t) => String(t).toLowerCase() === String(r).toLowerCase()));
          if (i >= 0) pagina.righe[i] = riga; else pagina.righe.splice(Math.min(3, pagina.righe.length), 0, riga);
        }
      }
    } catch (err) { console.error('[h7] diario', err); }
    return pagina;
  };
}

// ===========================================================================
// SONDA QA / SVILUPPO
// ===========================================================================
Object.assign(window.__teatro.interni, {
  ANFITEATRO_H7, QUARTIERE_H7, TESTI_H7, LUCE_H7,
  anfiteatroH7: Object.freeze({
    /** Il piano (o quello in corso) è l'Anfiteatro? */
    attivo: (piano) => anfiteatroAttivoH7(piano),
    /** Sviluppo/QA: marca un piano come Anfiteatro (o no) senza andarci. */
    segna: segnaAnfiteatroH7,
    /** Sviluppo/QA: scende subito nel condotto dal piano in corso. */
    prendi: prendiAnfiteatroH7,
    /** Il condotto asciutto della stanza corrente: { x, y } o null. */
    get condotto() { const c = condottoQuiH7(); return c ? { x: ANFITEATRO_H7.condotto.x, y: ANFITEATRO_H7.condotto.y } : null; },
  }),
});

// ===========================================================================
// 3-4. I NEMICI DEL LUOGO E I GIURAMENTI — tabelle
// ===========================================================================
/**
 * NEMICI del luogo. hp = (hpBase + (piano − 1) × hpPiano) × ciclo × campione, come popolaStanza.
 * sostituisce: il tipo di San Leucio di cui prendono il posto (gruppi e disposizioni di b7 restano validi).
 * Tick a coppie [min, max]: durata a caso fra i due. Gli attacchi si leggono dalla posa (nessun segno a terra).
 */
const NEMICI_H7 = Object.freeze({
  // MIRMILLONE DI LATTA: avanza con lo scudo davanti (para i colpi di fronte); ALZA il gladio dietro la testa,
  // poi AFFONDO dritto; dopo resta SCOPERTO, scudo di lato: è il momento di colpirlo.
  mirmillone_latta: Object.freeze({
    nome: 'Mirmillone di Latta', sostituisce: 'burattino', hpBase: 16, hpPiano: 4, vel: 0.72, raggio: 12, massa: 2.2,
    avanzaTick: Object.freeze([70, 120]), portataPx: 150, vicinoPx: 34, giro: 0.06, alzaTick: 34, bloccoTick: 10,
    affondoTick: 14, velAffondo: 3.3, scopertoTick: 48, paraSemiampiezza: 1.15, // ±66° attorno allo scudo
  }),
  // RETIARIO D'OMBRA: gira al largo; ROTEA la rete sopra la testa e la LANCIA (chi ne è preso cammina piano);
  // da vicino tira indietro il tridente (PUNTA) e STOCCA.
  reziario_ombra: Object.freeze({
    nome: 'Reziario d\'Ombra', sostituisce: 'maschera', hpBase: 13, hpPiano: 3.5, vel: 0.95, raggio: 11, massa: 1,
    giraTick: Object.freeze([90, 140]), distanzaPx: 118, giro: 0.75, vicinoPx: 56, roteaTick: 44, bloccoTick: 10,
    recuperaTick: 54, puntaTick: 22, stoccaTick: 10, velStocca: 2.8,
    rete: Object.freeze({ velocita: 2.3, raggio: 10, vitaTick: 96, tick: 120, rallenta: 0.55, massime: 2 }),
  }),
  // BELVA DI CARTAPESTA: aggira; si ACQUATTA (coda alta, muso basso: la direzione si blocca) e CARICA dritta;
  // se sbatte contro il muro resta STORDITA, la carta che si apre.
  belva_cartapesta: Object.freeze({
    nome: 'Belva di Cartapesta', sostituisce: 'guardia', hpBase: 21, hpPiano: 5, vel: 0.8, raggio: 14, massa: 3,
    aggiraTick: Object.freeze([90, 140]), acquattaTick: 44, bloccoTick: 10, caricaTick: 46, velCarica: 4.1,
    frenaTick: 20, storditaTick: 58,
  }),
  // SUONATORE DI CORNO: sta lontano; GONFIA le guance col corno alla bocca e SUONA: chiama un combattente dal
  // montacarichi (al massimo `chiamate` volte), poi solo lo squillo, un anello di note lente.
  suonatore_corno: Object.freeze({
    nome: 'Suonatore di Corno', sostituisce: 'vespa_cieca', hpBase: 11, hpPiano: 3, vel: 0.7, raggio: 10, massa: 1,
    tieneTick: Object.freeze([150, 210]), distanzaPx: 160, gonfiaTick: 52, suonaTick: 26, chiamate: 2, tettoVivi: 6,
    chiama: Object.freeze(['mirmillone_latta', 'reziario_ombra', 'belva_cartapesta']),
    squillo: Object.freeze({ note: 6, velocita: 1.5 }),
  }),
});

/** Tipo di San Leucio → tipo dell'Anfiteatro (costruita da NEMICI_H7). */
const SOSTITUZIONI_H7 = Object.freeze(Object.fromEntries(Object.entries(NEMICI_H7).map(([tipo, T]) => [T.sostituisce, tipo])));

/**
 * I montacarichi dei sotterranei: botole a filo della sabbia. Ogni stanza ne prende `quanti`, i primi posti di
 * questa lista lontani almeno `distanzaOstacoli` px dagli ostacoli della stanza.
 */
const MONTACARICHI_H7 = Object.freeze({
  quanti: 4, distanzaOstacoli: 36,
  posti: Object.freeze([[150, 112], [490, 112], [150, 266], [490, 266], [320, 104], [320, 276], [112, 190], [528, 190],
    [236, 146], [404, 146], [236, 240], [404, 240]].map((p) => Object.freeze(p))),
});

/** Le stanze-giuramento. */
const GIURAMENTI_H7 = Object.freeze({
  prob: 0.36, minimo: 1, massimo: 3,      // per piano, fra le stanze normali con nemici
  ondate: Object.freeze([2, 3]),          // la prima è la squadra della stanza, le altre salgono dopo
  perOndata: Object.freeze([2, 4]),
  pesi: Object.freeze({ mirmillone_latta: 3, reziario_ombra: 3, belva_cartapesta: 2, suonatore_corno: 1 }),
  saleTick: 48,                           // quanto ci mette un montacarichi a portare su un combattente
  pausaTick: 54,                          // fra un'ondata e l'altra
  grataTick: 18,                          // le grate che cadono sulle uscite
  scaglionaTick: 10,                      // i montacarichi di una stessa ondata partono uno dopo l'altro
});

/** Testi dei nemici e dei giuramenti (DA APPROVARE DALL'AUTORE). */
const TESTI_NEMICI_H7 = Object.freeze({
  giuramento: '⚔ GIURAMENTO: le grate cadono sulle uscite. Dai montacarichi salgono i combattenti.',
  ondata: (k, n) => `⚔ Ondata ${k} di ${n}: i montacarichi cigolano.`,
  fatto: '⚔ Giuramento mantenuto: le grate si alzano.',
  favore: '★ IL FAVORE DELLE GRADINATE: nessuna Maschera persa. Le ombre si alzano in piedi e lanciano qualcosa.',
  irretito: 'Preso nella rete! Cammini piano finché non te la scrolli di dosso.',
});

/** I temi rari di b7 del piano 3, col nome del luogo. TESTI DA APPROVARE DALL'AUTORE. */
const TEMI_H7 = Object.freeze({
  teatrino: Object.freeze({ nome: 'La Schiera dei Mirmilloni',
    avviso: '🛡 LA SCHIERA DEI MIRMILLONI: quattro scudi di latta in fila. Chi li prende alle spalle trova qualcosa in più.' }),
  plotone: Object.freeze({ nome: 'Le Belve del Sotterraneo',
    avviso: '🦁 LE BELVE DEL SOTTERRANEO: tre gabbie aperte. Chi le fa sbattere contro il muro trova qualcosa in più.' }),
});

/** Fogli PNG facoltativi (assets/sprite_teatro/<nome>.png, una riga di pose): `presente` quando l'autore li aggiunge. */
const FOGLI_H7 = Object.freeze({
  mirmillone_latta: Object.freeze({ nome: 'mirmillone-latta', presente: false, altezza: 40, piedi: 3, pose: Object.freeze(['avanza', 'alza', 'affondo', 'scoperto']) }),
  reziario_ombra: Object.freeze({ nome: 'reziario-ombra', presente: false, altezza: 40, piedi: 3, pose: Object.freeze(['gira', 'rotea', 'recupera', 'punta', 'stocca']) }),
  belva_cartapesta: Object.freeze({ nome: 'belva-cartapesta', presente: false, altezza: 34, piedi: 3, pose: Object.freeze(['aggira', 'acquatta', 'carica', 'frena', 'stordita']) }),
  suonatore_corno: Object.freeze({ nome: 'suonatore-corno', presente: false, altezza: 38, piedi: 3, pose: Object.freeze(['tiene', 'gonfia', 'suona']) }),
});

// ===========================================================================
// 3-4. I NEMICI DEL LUOGO — vestizione, creazione, IA
// ===========================================================================
const fraH7 = (c) => c[0] + Math.floor(rng() * (c[1] - c[0]));
/** Ruota l'angolo `a` verso `b` di al massimo `max` radianti. */
function ruotaVersoH7(a, b, max) {
  let d = b - a;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return a + limitaH7(d, -max, max);
}
/** Sposta un nemico tenendolo nell'arena; rende true se ha toccato un muro. */
function muoviH7(n, dx, dy, margine = 14) {
  const x = n.x + dx, y = n.y + dy;
  n.x = limitaH7(x, ARENA.x1 + margine, ARENA.x2 - margine);
  n.y = limitaH7(y, ARENA.y1 + margine, ARENA.y2 - margine);
  return n.x !== x || n.y !== y;
}

/** Numeri di scala (gli stessi di popolaStanza, come in d6). */
function scalaH7(piano) {
  const ciclo = Math.floor((piano - 1) / 4) + 1;
  return { ciclo, moltCiclo: Math.pow(1.45, ciclo - 1), moltVel: Math.min(1.55, 1 + (piano - 1) * 0.045) };
}

/** Dà a un nemico il tipo del luogo `tipo`, con vita e passo del piano. */
function vestiNemicoH7(n, tipo, piano) {
  const T = NEMICI_H7[tipo], K = scalaH7(piano);
  const hpC = n.champion === 'cremisi' ? 1.6 : n.champion ? 1.35 : 1;
  n.tipo = tipo; n.patternMob = tipo;
  n.nome = n.champion ? `${T.nome} [Campione ${n.champion}]` : T.nome;
  n.maxHp = Math.round((T.hpBase + (piano - 1) * T.hpPiano) * K.moltCiclo * hpC);
  n.hp = n.maxHp;
  n.speed = T.vel * K.moltVel * (n.champion === 'dorato' ? 1.2 : 1);
  n.r = T.raggio;
  n.statoH7 = null;
}

/**
 * Un combattente nuovo che sale da un montacarichi (giuramenti e corno). Rende il nemico, già nella stanza.
 * @param {object} st stanza @param {string} tipo chiave di NEMICI_H7 @param {number} m indice in MONTACARICHI_H7
 * @param {number} [ritardo] tick prima che il montacarichi parta
 */
function creaCombattenteH7(st, tipo, m, ritardo = 0) {
  const mc = montacarichiH7(st), M = mc[m % mc.length];
  st.contaH7 = (st.contaH7 || 0) + 1;
  const n = { id: `${st.id}-h7-${st.contaH7}`, tipo, patternMob: tipo, nome: '', boss: false, mobSoldi: false, champion: null,
    x: M[0], y: M[1] + 6, hp: 1, maxHp: 1, speed: 0, r: 11, flash: 0, burnTicks: 0, stunTicks: 0, state: 'idle', stateTimer: 20,
    maskOpen: false, shootCd: 60, vx: 0, vy: 0, airZ: 0 };
  vestiNemicoH7(n, tipo, statoRun.piano);
  avviaSalitaH7(n, M, ritardo);
  st.nemici.push(n);
  return n;
}

/** Il nemico sale dal montacarichi M: finché sale non si colpisce e non ferisce (airZ alto, come i boss in volo). */
function avviaSalitaH7(n, M, ritardo = 0) {
  const G = GIURAMENTI_H7;
  n.x = M[0]; n.y = M[1] + 6;
  n.saleH7 = G.saleTick + ritardo; n.saleDurataH7 = G.saleTick; n.mcH7 = M;
  n.airZ = 30;
}

/** Passo della salita: true finché il nemico è ancora sul montacarichi. */
function passoSalitaH7(n) {
  if (!(n.saleH7 > 0)) return false;
  n.saleH7--;
  if (n.saleH7 === n.saleDurataH7 - 1) suonoSabbiaH7(0.5);
  if (n.saleH7 <= 0) { n.airZ = 0; n.saleH7 = 0; return false; }
  n.airZ = 30;
  return true;
}

/** I montacarichi della stanza (scelti una volta, lontani dagli ostacoli). */
function montacarichiH7(st) {
  if (st.mcH7) return st.mcH7;
  const M = MONTACARICHI_H7;
  const liberi = M.posti.filter(([x, y]) => !(st.ostacoli || []).some((o) => Math.hypot(o.x - x, o.y - y) < M.distanzaOstacoli + (o.r || 12)));
  st.mcH7 = (liberi.length >= M.quanti ? liberi : M.posti).slice(0, M.quanti);
  return st.mcH7;
}

/** Vivi (o in salita) nella stanza. */
const viviH7 = (st) => st.nemici.filter((n) => n.hp > 0);

/** IA dei nemici del luogo, per tipo: (n, st, ang, dist, T). Stati in n.statoH7, timer in n.tH7, verso in n.angH7. */
const IA_H7 = {
  mirmillone_latta(n, st, ang, dist, T) {
    if (!n.statoH7) { n.statoH7 = 'avanza'; n.tH7 = fraH7(T.avanzaTick); n.angH7 = ang; }
    const s = n.statoH7;
    if (s === 'avanza') {
      n.angH7 = ruotaVersoH7(n.angH7, ang, T.giro);
      if (dist > T.vicinoPx) muoviH7(n, Math.cos(n.angH7) * n.speed, Math.sin(n.angH7) * n.speed);
      if (--n.tH7 <= 0 && dist < T.portataPx) { n.statoH7 = 'alza'; n.tH7 = T.alzaTick; }
      else if (n.tH7 <= 0) n.tH7 = 20;
    } else if (s === 'alza') {
      if (n.tH7 > T.bloccoTick) n.angH7 = ruotaVersoH7(n.angH7, ang, T.giro * 2);
      if (--n.tH7 <= 0) { n.statoH7 = 'affondo'; n.tH7 = T.affondoTick; n.vx = Math.cos(n.angH7) * T.velAffondo; n.vy = Math.sin(n.angH7) * T.velAffondo; }
    } else if (s === 'affondo') {
      const muro = muoviH7(n, n.vx, n.vy);
      if (--n.tH7 <= 0 || muro) { n.statoH7 = 'scoperto'; n.tH7 = T.scopertoTick; }
    } else if (--n.tH7 <= 0) { n.statoH7 = 'avanza'; n.tH7 = fraH7(T.avanzaTick); }
  },
  reziario_ombra(n, st, ang, dist, T) {
    if (!n.statoH7) { n.statoH7 = 'gira'; n.tH7 = fraH7(T.giraTick); n.giroH7 = rng() < 0.5 ? -1 : 1; n.angH7 = ang; }
    const s = n.statoH7;
    if (s === 'gira' || s === 'recupera') {
      const rad = limitaH7((dist - T.distanzaPx) / 40, -1, 1);
      const dx = Math.cos(ang) * rad + Math.cos(ang + n.giroH7 * Math.PI / 2) * T.giro;
      const dy = Math.sin(ang) * rad + Math.sin(ang + n.giroH7 * Math.PI / 2) * T.giro;
      const l = Math.hypot(dx, dy) || 1, v = n.speed * (s === 'recupera' ? 0.5 : 1);
      if (muoviH7(n, (dx / l) * v, (dy / l) * v) && n.tH7 % 20 === 0) n.giroH7 = -n.giroH7;
      n.angH7 = ang;
      if (--n.tH7 <= 0) {
        if (s === 'recupera') { n.statoH7 = 'gira'; n.tH7 = fraH7(T.giraTick); }
        else if (dist < T.vicinoPx) { n.statoH7 = 'punta'; n.tH7 = T.puntaTick; }
        else if ((st.retiH7 || []).length < T.rete.massime) { n.statoH7 = 'rotea'; n.tH7 = T.roteaTick; }
        else n.tH7 = 30;
      }
    } else if (s === 'rotea') {
      if (n.tH7 > T.bloccoTick) n.angH7 = ang;
      if (--n.tH7 <= 0) {
        const R = T.rete;
        (st.retiH7 = st.retiH7 || []).push({ x: n.x, y: n.y - 18, vx: Math.cos(n.angH7) * R.velocita, vy: Math.sin(n.angH7) * R.velocita, vita: R.vitaTick, t: 0 });
        soffioH7(0.25, 700, 300, 0.04, 1.4);
        n.statoH7 = 'recupera'; n.tH7 = T.recuperaTick;
      }
    } else if (s === 'punta') {
      if (n.tH7 > 8) n.angH7 = ang;
      if (--n.tH7 <= 0) { n.statoH7 = 'stocca'; n.tH7 = T.stoccaTick; n.vx = Math.cos(n.angH7) * T.velStocca; n.vy = Math.sin(n.angH7) * T.velStocca; }
    } else if (s === 'stocca') {
      muoviH7(n, n.vx, n.vy);
      if (--n.tH7 <= 0) { n.statoH7 = 'recupera'; n.tH7 = Math.round(T.recuperaTick / 2); }
    }
  },
  belva_cartapesta(n, st, ang, dist, T) {
    if (!n.statoH7) { n.statoH7 = 'aggira'; n.tH7 = fraH7(T.aggiraTick); n.giroH7 = rng() < 0.5 ? -1 : 1; n.angH7 = ang; }
    const s = n.statoH7;
    if (s === 'aggira') {
      const a = ang + n.giroH7 * 1.1;
      if (muoviH7(n, Math.cos(a) * n.speed, Math.sin(a) * n.speed, 16)) n.giroH7 = -n.giroH7;
      n.angH7 = ruotaVersoH7(n.angH7, ang, 0.1);
      if (--n.tH7 <= 0) { n.statoH7 = 'acquatta'; n.tH7 = T.acquattaTick; }
    } else if (s === 'acquatta') {
      if (n.tH7 > T.bloccoTick) n.angH7 = ang;
      if (--n.tH7 <= 0) { n.statoH7 = 'carica'; n.tH7 = T.caricaTick; n.vx = Math.cos(n.angH7) * T.velCarica; n.vy = Math.sin(n.angH7) * T.velCarica; tonoH7(110, 0.35, 0.05, 'sawtooth', 70); }
    } else if (s === 'carica') {
      const muro = muoviH7(n, n.vx, n.vy, 16);
      if (muro) { n.statoH7 = 'stordita'; n.tH7 = T.storditaTick; scuoti(FEEL.scossa.colpo); }
      else if (--n.tH7 <= 0) { n.statoH7 = 'frena'; n.tH7 = T.frenaTick; }
    } else if (s === 'frena') {
      muoviH7(n, n.vx * 0.15, n.vy * 0.15, 16);
      if (--n.tH7 <= 0) { n.statoH7 = 'aggira'; n.tH7 = fraH7(T.aggiraTick); }
    } else if (--n.tH7 <= 0) { n.statoH7 = 'aggira'; n.tH7 = fraH7(T.aggiraTick); }
  },
  suonatore_corno(n, st, ang, dist, T) {
    if (!n.statoH7) { n.statoH7 = 'tiene'; n.tH7 = fraH7(T.tieneTick); n.angH7 = ang; n.chiamateH7 = 0; }
    const s = n.statoH7;
    n.angH7 = ang;
    if (s === 'tiene') {
      const rad = limitaH7((dist - T.distanzaPx) / 40, -1, 1);
      muoviH7(n, Math.cos(ang) * rad * n.speed, Math.sin(ang) * rad * n.speed);
      if (--n.tH7 <= 0) { n.statoH7 = 'gonfia'; n.tH7 = T.gonfiaTick; }
    } else if (s === 'gonfia') {
      if (--n.tH7 <= 0) {
        n.statoH7 = 'suona'; n.tH7 = T.suonaTick;
        tonoH7(146.8, 0.9, 0.07, 'sawtooth', 138);
        if (n.chiamateH7 < T.chiamate && viviH7(st).length < T.tettoVivi) {
          n.chiamateH7++;
          let m = 0, best = Infinity;
          montacarichiH7(st).forEach((M, i) => { const d = Math.hypot(M[0] - player.x, M[1] - player.y); if (d > 90 && Math.hypot(M[0] - n.x, M[1] - n.y) < best) { best = Math.hypot(M[0] - n.x, M[1] - n.y); m = i; } });
          creaCombattenteH7(st, T.chiama[Math.floor(rng() * T.chiama.length)], m);
        } else {
          const S = T.squillo;
          for (let k = 0; k < S.note; k++) {
            if (statoRun.proiettiliNemici.length >= 40) break;
            const a = ang + (TAU * k) / S.note;
            statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 16, vx: Math.cos(a) * S.velocita, vy: Math.sin(a) * S.velocita, dist: 0, notaH7: true, fonteA7: `lo squillo del ${T.nome}` });
          }
        }
      }
    } else if (--n.tH7 <= 0) { n.statoH7 = 'tiene'; n.tH7 = fraH7(T.tieneTick); }
  },
};

if (typeof iaNemicoD6 === 'function') {
  const iaNemicoBaseH7 = iaNemicoD6;
  /**
   * Aggancio dell'IA dei nemici comuni (40-combattimento.js chiama iaNemicoD6): i nemici dell'Anfiteatro agiscono
   * qui; chi sale ancora dal montacarichi sta fermo. Gli altri passano a d6.
   */
  iaNemicoD6 = function (n, st, ang, dist, ...resto) {
    const ia = IA_H7[n && n.tipo];
    if (!ia) {
      if (n && n.saleH7 > 0) return true; // sale ancora: la salita avanza in passoLogico
      return iaNemicoBaseH7.call(this, n, st, ang, dist, ...resto);
    }
    if (n.paraH7 > 0) n.paraH7--;
    try { if (!(n.saleH7 > 0)) ia(n, st, ang, dist, NEMICI_H7[n.tipo]); } catch (err) { console.error('[h7] ia', n.tipo, err); }
    return true;
  };
}

const danneggiaNemicoBaseH7 = danneggiaNemico;
/** Lo scudo del Mirmillone: i colpi che arrivano di fronte, mentre avanza o alza il gladio, sono parati. */
danneggiaNemico = function (nem, dmg, kx, ky, ...resto) {
  try {
    if (nem && nem.tipo === 'mirmillone_latta' && (nem.statoH7 === 'avanza' || nem.statoH7 === 'alza') && dmg > 0) {
      const l = Math.hypot(kx || 0, ky || 0);
      const da = l > 0.01 ? Math.atan2(-ky, -kx) : Math.atan2(player.y - nem.y, player.x - nem.x); // da dove arriva il colpo
      let d = da - (nem.angH7 || 0);
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      if (Math.abs(d) < NEMICI_H7.mirmillone_latta.paraSemiampiezza) {
        nem.paraH7 = 10; nem.parateH7 = (nem.parateH7 || 0) + 1;
        tonoH7(1250, 0.12, 0.05, 'square', 900);
        return undefined;
      }
    }
  } catch (err) { console.error('[h7] scudo', err); }
  return danneggiaNemicoBaseH7.call(this, nem, dmg, kx, ky, ...resto);
};

const popolaStanzaBaseH7 = popolaStanza;
/** Dopo popolaStanza di base: all'Anfiteatro i nemici di San Leucio diventano quelli del luogo. */
popolaStanza = function (s, piano, ...resto) {
  const r = popolaStanzaBaseH7.call(this, s, piano, ...resto);
  try { if (s && anfiteatroAttivoH7(piano)) vestiStanzaH7(s, piano); } catch (err) { console.error('[h7] popola', err); }
  return r;
};

/** Veste una stanza appena popolata (il boss si veste nella sezione del Giudice). */
function vestiStanzaH7(s, piano) {
  if (s.tipo === 'boss') return;
  for (const n of s.nemici) {
    const nuovo = !n.boss && SOSTITUZIONI_H7[n.tipo];
    if (nuovo) vestiNemicoH7(n, nuovo, piano);
  }
}

const massaNemicoBaseH7 = massaNemico;
/** Massa per le spinte: quella della tabella per i nemici del luogo. */
massaNemico = function (nem, ...resto) {
  const T = nem && !nem.boss ? NEMICI_H7[nem.tipo] : null;
  if (T && T.massa !== undefined) return T.massa;
  return massaNemicoBaseH7.call(this, nem, ...resto);
};

// ===========================================================================
// 3. I GIURAMENTI
// ===========================================================================
/** Sceglie le stanze-giuramento del piano (deterministico col seme della run). */
function scegliGiuramentiH7(m) {
  const G = GIURAMENTI_H7;
  const adatte = m.stanze.filter((s) => s.tipo === 'normale' && s.nemici.length > 0 && !s.temaB7 && !s.pulita);
  const scelte = adatte.filter(() => rng() < G.prob);
  while (scelte.length < Math.min(G.minimo, adatte.length)) { const s = adatte[Math.floor(rng() * adatte.length)]; if (!scelte.includes(s)) scelte.push(s); }
  for (const s of scelte.slice(0, G.massimo)) s.giuramentoH7 = { stato: 'attesa', ondate: fraH7([G.ondate[0], G.ondate[1] + 1]), ondata: 0, persi: 0, pausa: 0, t0: 0 };
}

const generaMappaPianoBaseH7 = generaMappaPiano;
/** Mappa del piano: all'Anfiteatro alcune stanze diventano giuramenti. */
generaMappaPiano = function (piano, ...resto) {
  const m = generaMappaPianoBaseH7.call(this, piano, ...resto);
  try {
    if (m && anfiteatroAttivoH7(piano)) {
      m.anfiteatroH7 = true;
      for (const st of m.stanze) {
        vestiStanzaH7(st, piano); // anche chi è entrato dopo popolaStanza (i temi rari di b7)
        const T = st.temaB7 && TEMI_H7[st.temaB7.id];
        if (T) st.temaB7 = Object.assign({}, st.temaB7, { nome: T.nome, avviso: T.avviso });
      }
      scegliGiuramentiH7(m);
    }
  } catch (err) { console.error('[h7] mappa', err); }
  return m;
};

/** Il giuramento comincia: grate giù, la squadra della stanza sale dai montacarichi. */
function iniziaGiuramentoH7(st) {
  const G = st.giuramentoH7;
  G.stato = 'in_corso'; G.ondata = 1; G.persi = 0; G.t0 = tick; G.pausa = 0; G.hpUltimo = statoRun.hpHalf;
  const mc = montacarichiH7(st);
  viviH7(st).forEach((n, i) => avviaSalitaH7(n, mc[i % mc.length], i * GIURAMENTI_H7.scaglionaTick));
  mostraBanner(`${TESTI_NEMICI_H7.giuramento} ${TESTI_NEMICI_H7.ondata(1, G.ondate)}`, 220);
  tonoH7(98, 0.6, 0.06, 'square', 80);
}

/** Un'ondata nuova dai montacarichi. */
function ondataGiuramentoH7(st) {
  const G = st.giuramentoH7, C = GIURAMENTI_H7;
  G.ondata++;
  const quanti = fraH7([C.perOndata[0], C.perOndata[1] + 1]);
  const pesi = Object.entries(C.pesi), tot = pesi.reduce((a, [, p]) => a + p, 0);
  const lontani = montacarichiH7(st).map((M, i) => ({ i, d: Math.hypot(M[0] - player.x, M[1] - player.y) })).sort((a, b) => b.d - a.d);
  for (let k = 0; k < quanti; k++) {
    let x = rng() * tot, tipo = pesi[0][0];
    for (const [t, p] of pesi) { if ((x -= p) < 0) { tipo = t; break; } }
    creaCombattenteH7(st, tipo, lontani[k % 3].i, k * C.scaglionaTick); // mai dal montacarichi sotto i piedi
  }
  mostraBanner(TESTI_NEMICI_H7.ondata(G.ondata, G.ondate), 160);
  tonoH7(110, 0.5, 0.05, 'square', 90);
}

/** Il giuramento è mantenuto: grate su, e il favore delle gradinate se non si è persa una Maschera. */
function chiudiGiuramentoH7(st) {
  const G = st.giuramentoH7;
  G.stato = 'fatto'; G.t1 = tick;
  G.favore = G.persi === 0;
  if (G.favore) favoreGradinateH7(st);
  mostraBanner(G.favore ? TESTI_NEMICI_H7.favore : TESTI_NEMICI_H7.fatto, 240);
  verificaStanzaPulita();
}

/** Il favore delle gradinate: un premio in più, lanciato dai palchetti (b1) se c'è il pubblico. */
function favoreGradinateH7(st) {
  const piena = statoRun.hpHalf >= (statoRun.maxHpHalf || 6);
  const pk = piena ? { tipo: 'chiave', valore: 1, sprite: 'chiaveA1', x: 320, y: 150 } : { tipo: 'cura', valore: 2, sprite: 'cuore', x: 320, y: 150 };
  st.oggettiATerra = st.oggettiATerra || [];
  st.oggettiATerra.push(pk);
  const prima = st.oggettiATerra.length;
  spawnaMonetaATerra(st, 296, 156, 3);
  const nuovi = [pk].concat(st.oggettiATerra.slice(prima));
  if (typeof lanciaPremioB1 === 'function') nuovi.forEach((x, i) => { try { lanciaPremioB1(st, x, i); } catch (_) { /* resta dov'è */ } });
  st.favoreH7 = true;
  if (typeof AudioSys.playCampana === 'function') AudioSys.playCampana();
}

/** Passo del giuramento della stanza corrente (dopo il passo di base). */
function passoGiuramentoH7(st, hpPrima) {
  const G = st.giuramentoH7;
  if (G && G.stato === 'attesa' && !st.pulita && viviH7(st).length) iniziaGiuramentoH7(st); // se l'ingresso non l'ha fatto partire
  if (!G || G.stato !== 'in_corso') return;
  const prima = Math.max(hpPrima, G.hpUltimo == null ? hpPrima : G.hpUltimo); // anche i colpi presi fuori dal passo
  if (statoRun.hpHalf < prima) G.persi += prima - statoRun.hpHalf;
  G.hpUltimo = statoRun.hpHalf;
  if (viviH7(st).length > 0) return;
  if (G.ondata < G.ondate) {
    if (++G.pausa >= GIURAMENTI_H7.pausaTick) { G.pausa = 0; ondataGiuramentoH7(st); }
    return;
  }
  chiudiGiuramentoH7(st);
}

/** Le reti del Reziario in volo, e chi ne è preso. */
function passoRetiH7(st) {
  const R = NEMICI_H7.reziario_ombra.rete;
  if (statoRun.irretitoH7 > 0) statoRun.irretitoH7--;
  const reti = st.retiH7 || [];
  for (let i = reti.length - 1; i >= 0; i--) {
    const r = reti[i];
    r.x += r.vx; r.y += r.vy; r.t++;
    const fuori = r.x < ARENA.x1 || r.x > ARENA.x2 || r.y < ARENA.y1 - 10 || r.y > ARENA.y2;
    if (Math.hypot(player.x - r.x, player.y - 8 - r.y) < R.raggio + 8 && !(player.invuln > 0) && !player.volo) {
      if (!(statoRun.irretitoH7 > 0)) mostraBanner(TESTI_NEMICI_H7.irretito, 120);
      statoRun.irretitoH7 = R.tick; reti.splice(i, 1); soffioH7(0.2, 500, 200, 0.05);
      continue;
    }
    if (--r.vita <= 0 || fuori) reti.splice(i, 1);
  }
}

const verificaStanzaPulitaGiuramentoH7 = verificaStanzaPulita;
/** Durante un giuramento la stanza non è pulita finché non salgono tutte le ondate. */
verificaStanzaPulita = function (...args) {
  const st = statoRun.stanzaCorrente;
  if (st && st.giuramentoH7 && st.giuramentoH7.stato === 'in_corso') return undefined;
  return verificaStanzaPulitaGiuramentoH7.apply(this, args);
};

const entraInStanzaBaseH7 = entraInStanza;
/** Ingresso in una stanza dell'Anfiteatro: il giuramento parte; le reti in volo si perdono. */
entraInStanza = function (stanza, daLato, ...resto) {
  const r = entraInStanzaBaseH7.call(this, stanza, daLato, ...resto);
  try {
    if (stanza && statoRun.stanzaCorrente === stanza && anfiteatroAttivoH7()) {
      stanza.retiH7 = [];
      statoRun.irretitoH7 = 0;
      const G = stanza.giuramentoH7;
      if (G && G.stato === 'attesa' && !stanza.pulita && viviH7(stanza).length) iniziaGiuramentoH7(stanza);
    }
  } catch (err) { console.error('[h7] ingresso', err); }
  return r;
};

const passoLogicoBaseH7 = passoLogico;
/** Attorno al passo di base: reti, giocatore irretito, giuramenti. */
passoLogico = function (...args) {
  const st = statoRun.stanzaCorrente;
  const attivo = Boolean(st) && statoRun.fase === 'in_gioco' && anfiteatroAttivoH7() && ticksCongelati <= 0
    && !(statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo || statoRun.pausa);
  const hpPrima = statoRun.hpHalf, px = player.x, py = player.y;
  const r = passoLogicoBaseH7.apply(this, args);
  try {
    if (attivo && statoRun.fase === 'in_gioco' && statoRun.stanzaCorrente === st) {
      if (statoRun.irretitoH7 > 0) {
        const k = NEMICI_H7.reziario_ombra.rete.rallenta;
        player.x = px + (player.x - px) * k; player.y = py + (player.y - py) * k;
      }
      for (const n of st.nemici) if (n.saleH7 > 0) passoSalitaH7(n); // i montacarichi salgono anche nella grazia d'ingresso
      passoRetiH7(st);
      passoGiuramentoH7(st, hpPrima);
      dopoIlPassoGiudiceH7(st, hpPrima);
    }
  } catch (err) { console.error('[h7] dopo il passo', err); }
  return r;
};

/** Il passo del boss (sezione del Giudice): qui un segnaposto che la sezione 5 sostituisce. */
function dopoIlPassoGiudiceH7() { /* sezione 5 */ }

// ===========================================================================
// 3-4. DISEGNO «a ombre» di nemici, montacarichi, reti e grate
// ===========================================================================
const BORDO_H7 = 'rgba(240, 180, 90, 0.85)';
/** Le sagome dei nemici sono disegnate a misura 1 e ingrandite di tanto (stessa altezza dei nemici di base). */
const SCALA_FIGURE_H7 = 1.35;
/** Prepara il tratto delle sagome: china piena, contorno di lanterna (bianco se colpito). */
function chinaH7(flash) { ctx.fillStyle = flash ? '#f5e6c8' : TINTE_H7.china; ctx.strokeStyle = flash ? '#fff' : BORDO_H7; ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
function ombraTerraH7(x, y, rx, ry, a = 0.5) { ctx.fillStyle = `rgba(30, 18, 8, ${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }
/** Disegna una cella del foglio PNG del tipo, se c'è; true se l'ha disegnata. */
function cellaH7(tipo, posa, flip, flash) {
  const F = FOGLI_H7[tipo];
  if (!F || !F.presente || typeof disegnaCellaTeatro !== 'function') return false;
  const col = Math.max(0, F.pose.indexOf(posa)), A = F.altezza;
  ctx.save(); ctx.scale(flip, 1);
  const ok = disegnaCellaTeatro(ctx, F.nome, col, F.pose.length, -A * 0.6, -A + F.piedi, A * 1.2, A, flash ? '#fff' : null, flash ? 0.6 : 0);
  ctx.restore();
  return ok;
}

const DISEGNI_NEMICI_H7 = {
  mirmillone_latta(n, t, flash) {
    const s = n.statoH7 || 'avanza', flip = Math.cos(n.angH7 || 0) < 0 ? -1 : 1;
    ombraTerraH7(0, 1, 12, 4);
    if (cellaH7(n.tipo, s, flip, flash)) return;
    ctx.scale(flip, 1);
    const passo = s === 'avanza' ? Math.sin(t * 0.25) * 1.5 : 0, lean = s === 'affondo' ? 4 : s === 'alza' ? -1.5 : 0;
    chinaH7(flash);
    // gambe e schinieri
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-3 + passo, -10); ctx.lineTo(2, -10); ctx.lineTo(4 - passo, 0); ctx.lineTo(1, 0); ctx.lineTo(0, -6); ctx.lineTo(-1.5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    // busto in latta, cintura rossa
    ctx.beginPath(); ctx.moveTo(-6 + lean, -10); ctx.lineTo(-5 + lean, -24); ctx.lineTo(6 + lean, -24); ctx.lineTo(6 + lean, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TINTE_H7.rosso; ctx.fillRect(-6 + lean, -12.5, 12, 2.2);
    // elmo a tesa larga con la cresta a pesce, visiera a grata
    chinaH7(flash);
    ctx.beginPath(); ctx.arc(lean + 0.5, -28, 5, Math.PI, 0); ctx.lineTo(6.5 + lean, -27); ctx.lineTo(-5.5 + lean, -27); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8 + lean, -25.5); ctx.lineTo(9 + lean, -25.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3 + lean, -33); ctx.quadraticCurveTo(lean + 2, -38, 7 + lean, -33); ctx.lineTo(lean + 2, -32); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = TINTE_H7.oro; ctx.lineWidth = 0.6;
    ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(lean + 1 + k * 1.6, -29.5); ctx.lineTo(lean + 1 + k * 1.6, -26.5); } ctx.stroke();
    // il gladio: in alto dietro la testa (alza), avanti (affondo), basso (altrimenti)
    ctx.strokeStyle = flash ? '#fff' : '#e7e2d2'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (s === 'alza') { ctx.moveTo(-3, -26); ctx.lineTo(-11, -38); }
    else if (s === 'affondo') { ctx.moveTo(6 + lean, -18); ctx.lineTo(20 + lean, -18); }
    else { ctx.moveTo(-5, -14); ctx.lineTo(-9, -4); }
    ctx.stroke();
    // lo scudo: davanti (avanza, alza), aperto di lato (affondo, scoperto)
    chinaH7(flash);
    ctx.save();
    if (s === 'scoperto' || s === 'affondo') { ctx.translate(-8 + lean, -16); ctx.rotate(-0.5); } else ctx.translate(8 + lean, -16);
    ctx.beginPath(); ctx.rect(-3, -10, 6, 20); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TINTE_H7.rosso; ctx.fillRect(-2, -8, 4, 16);
    ctx.fillStyle = (n.paraH7 > 0) ? '#fff3d6' : TINTE_H7.oro; ctx.beginPath(); ctx.arc(0, 0, n.paraH7 > 0 ? 2.6 : 1.6, 0, TAU); ctx.fill();
    ctx.restore();
    if (n.paraH7 > 0) { // la scintilla della parata, sullo scudo
      ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 0; k < 5; k++) { const a = k * 1.256 + t * 0.3; ctx.moveTo(12 + lean, -16); ctx.lineTo(12 + lean + Math.cos(a) * 6, -16 + Math.sin(a) * 6); }
      ctx.stroke();
    }
  },
  reziario_ombra(n, t, flash) {
    const s = n.statoH7 || 'gira', flip = Math.cos(n.angH7 || 0) < 0 ? -1 : 1;
    ombraTerraH7(0, 1, 10, 3.5);
    if (cellaH7(n.tipo, s, flip, flash)) return;
    ctx.scale(flip, 1);
    const passo = (s === 'gira' || s === 'recupera') ? Math.sin(t * 0.3) * 2 : 0;
    chinaH7(flash);
    // gambe nude, perizoma, torso snello, testa scoperta coi capelli legati
    ctx.beginPath(); ctx.moveTo(-3.5 + passo, 0); ctx.lineTo(-2, -11); ctx.lineTo(2, -11); ctx.lineTo(3.5 - passo, 0); ctx.lineTo(1.6, 0); ctx.lineTo(0, -7); ctx.lineTo(-1.6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, -11); ctx.lineTo(-4.5, -24); ctx.lineTo(4.5, -24); ctx.lineTo(4, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -28, 3.8, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-3.4, -29, 1.4, 0, TAU); ctx.fill();
    // la manica e il galero (spalla alta) sul braccio della rete
    ctx.fillStyle = flash ? '#fff' : TINTE_H7.travertinoOmbra; ctx.fillRect(-6.5, -25, 3, 5);
    // il tridente
    ctx.strokeStyle = flash ? '#fff' : '#d6c9a6'; ctx.lineWidth = 1.2;
    const tri = s === 'punta' ? [-14, -16, 6, -18] : s === 'stocca' ? [0, -17, 26, -17] : [6, -2, 9, -40];
    ctx.beginPath(); ctx.moveTo(tri[0], tri[1]); ctx.lineTo(tri[2], tri[3]);
    const a = Math.atan2(tri[3] - tri[1], tri[2] - tri[0]);
    for (const d of [-0.35, 0, 0.35]) { ctx.moveTo(tri[2], tri[3]); ctx.lineTo(tri[2] + Math.cos(a + d) * 4.5, tri[3] + Math.sin(a + d) * 4.5); }
    ctx.stroke();
    // la rete: in mano (gira), che rotea sopra la testa (rotea), la corda che torna (recupera)
    ctx.strokeStyle = flash ? '#fff' : TINTE_H7.bordo; ctx.lineWidth = 0.7;
    if (s === 'rotea') {
      const rot = t * 0.45, rx = 11, ry = 4;
      ctx.beginPath(); ctx.ellipse(-2, -38, rx, ry, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); for (let k = 0; k < 6; k++) { const q = rot + (k * Math.PI) / 3; ctx.moveTo(-2, -38); ctx.lineTo(-2 + Math.cos(q) * rx, -38 + Math.sin(q) * ry); } ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-5, -24); ctx.lineTo(-2, -37); ctx.stroke();
    } else if (s === 'recupera') {
      ctx.beginPath(); ctx.moveTo(-5, -20); ctx.quadraticCurveTo(-14, -10, -20, -14); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-6, -20); ctx.quadraticCurveTo(-12, -14, -8, -6); ctx.quadraticCurveTo(-4, -10, -6, -20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, -15); ctx.lineTo(-5, -11); ctx.moveTo(-8, -9); ctx.lineTo(-6, -17); ctx.stroke();
    }
  },
  belva_cartapesta(n, t, flash) {
    const s = n.statoH7 || 'aggira', flip = Math.cos(n.angH7 || 0) < 0 ? -1 : 1;
    ombraTerraH7(0, 1, 16, 4.5);
    if (cellaH7(n.tipo, s, flip, flash)) return;
    ctx.scale(flip, 1);
    const basso = s === 'acquatta' ? 4 : s === 'stordita' ? 3 : 0, lungo = s === 'carica' ? 4 : 0;
    const zampa = (s === 'aggira' || s === 'carica') ? Math.sin(t * (s === 'carica' ? 0.7 : 0.28)) * 3 : 0;
    chinaH7(flash);
    // zampe
    for (const [zx, f] of [[-9, 1], [-5, -1], [7, 1], [10, -1]]) {
      ctx.beginPath(); ctx.moveTo(zx - 1.5, -9 + basso * 0.5); ctx.lineTo(zx + zampa * f, 0); ctx.lineTo(zx + 2 + zampa * f, 0); ctx.lineTo(zx + 1.5, -9 + basso * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // corpo: la groppa alta quando si acquatta (muso giù)
    ctx.beginPath();
    ctx.moveTo(-13 - lungo, -9 - (s === 'acquatta' ? 5 : 0)); ctx.quadraticCurveTo(-2, -20 + basso, 9 + lungo, -15 + basso);
    ctx.lineTo(10 + lungo, -8 + basso * 0.5); ctx.quadraticCurveTo(0, -6, -12 - lungo, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
    // giunture di carta (cuciture chiare), che si aprono quando è stordita
    ctx.strokeStyle = flash ? '#fff' : TINTE_H7.travertino; ctx.lineWidth = 0.6; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(-4, -16 + basso); ctx.lineTo(-3, -7); ctx.moveTo(3, -16 + basso); ctx.lineTo(4, -7); ctx.stroke();
    ctx.globalAlpha = 1;
    if (s === 'stordita') { ctx.fillStyle = TINTE_H7.travertino; ctx.save(); ctx.translate(-2, -16); ctx.rotate(-0.6 + Math.sin(t * 0.2) * 0.2); ctx.fillRect(0, -1, 7, 3); ctx.restore(); }
    // testa con la criniera (raggi di carta), mascella
    chinaH7(flash);
    const hx = 12 + lungo, hy = -15 + basso + (s === 'acquatta' ? 3 : 0) + (s === 'stordita' ? 4 : 0);
    ctx.beginPath(); for (let k = 0; k < 9; k++) { const q = (k / 9) * TAU, rr = k % 2 ? 6 : 8.5; ctx.lineTo(hx + Math.cos(q) * rr, hy + Math.sin(q) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 3, hy - 2); ctx.lineTo(hx + 9, hy); ctx.lineTo(hx + 3, hy + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = s === 'acquatta' || s === 'carica' ? TINTE_H7.rosso : TINTE_H7.oro; ctx.fillRect(hx + 2, hy - 2.5, 1.6, 1.4);
    // coda: alta e tesa quando si acquatta
    ctx.strokeStyle = flash ? '#fff' : BORDO_H7; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-13 - lungo, -10);
    if (s === 'acquatta') ctx.quadraticCurveTo(-20, -18, -17, -27); else ctx.quadraticCurveTo(-20, -10, -21 - lungo, -4);
    ctx.stroke();
    if (s === 'stordita') { ctx.fillStyle = TINTE_H7.oro; for (let k = 0; k < 3; k++) { const q = t * 0.12 + k * 2.1; ctx.fillRect(hx + Math.cos(q) * 7 - 1, hy - 11 + Math.sin(q) * 2 - 1, 2, 2); } }
  },
  suonatore_corno(n, t, flash) {
    const s = n.statoH7 || 'tiene', flip = Math.cos(n.angH7 || 0) < 0 ? -1 : 1;
    ombraTerraH7(0, 1, 10, 3.5);
    if (cellaH7(n.tipo, s, flip, flash)) return;
    ctx.scale(flip, 1);
    const passo = s === 'tiene' ? Math.sin(t * 0.22) * 1.5 : 0;
    chinaH7(flash);
    // tunica lunga, gambe corte
    ctx.beginPath(); ctx.moveTo(-3 + passo, 0); ctx.lineTo(-2, -6); ctx.lineTo(2, -6); ctx.lineTo(3 - passo, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-4, -24); ctx.lineTo(4, -24); ctx.lineTo(6, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
    // testa: le guance gonfie quando soffia
    const gonfio = s === 'gonfia' ? Math.min(1, (NEMICI_H7.suonatore_corno.gonfiaTick - (n.tH7 || 0)) / 30) : s === 'suona' ? 1 : 0;
    ctx.beginPath(); ctx.arc(0.5, -28, 3.8, 0, TAU); ctx.fill(); ctx.stroke();
    if (gonfio > 0) { ctx.beginPath(); ctx.arc(3.6, -27, 1.6 + gonfio * 1.4, 0, TAU); ctx.fill(); ctx.stroke(); }
    // il corno (cornu): grande G attorno al corpo; alzato alla bocca quando gonfia e suona
    ctx.strokeStyle = flash ? '#fff' : TINTE_H7.oro; ctx.lineWidth = 1.6;
    const su = gonfio > 0 ? 1 : 0;
    ctx.beginPath(); ctx.arc(-1, -18 - su * 6, 8, 0.6, Math.PI * 1.75); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5 - su, -23 - su * 4); ctx.lineTo(4, -27); ctx.stroke(); // il bocchino
    // il padiglione in alto, che luccica quando suona
    ctx.fillStyle = s === 'suona' ? '#fff3d6' : TINTE_H7.oro;
    const bx = -1 + Math.cos(Math.PI * 1.75) * 8, by = -18 - su * 6 + Math.sin(Math.PI * 1.75) * 8;
    ctx.beginPath(); ctx.moveTo(bx - 1, by + 1); ctx.lineTo(bx + 4, by - 5); ctx.lineTo(bx + 6, by - 1); ctx.closePath(); ctx.fill();
    if (s === 'suona') { // il suono si vede nell'aria, attorno al padiglione (non a terra)
      ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.7;
      for (let k = 0; k < 3; k++) { const rr = 4 + ((t * 0.5 + k * 4) % 12); ctx.beginPath(); ctx.arc(bx + 5, by - 4, rr, -1.4, 0.2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
  },
};

/** Il montacarichi che sale: piattaforma di assi, funi, e la figura che spunta dal buio sotto la sabbia. */
function disegnaSalitaH7(n, t, disegno, flash) {
  const k = 1 - n.saleH7 / n.saleDurataH7;
  if (k <= 0) return; // aspetta il suo turno: la botola è ancora chiusa
  const M = n.mcH7, alt = 44 * SCALA_FIGURE_H7;
  ctx.save();
  // la botola aperta: buio
  ctx.fillStyle = TINTE_H7.china; ctx.fillRect(M[0] - 13, M[1] - 3, 26, 14);
  // la figura sale (tagliata dal bordo della botola)
  ctx.save();
  ctx.beginPath(); ctx.rect(M[0] - 50, M[1] - 100, 100, 106); ctx.clip();
  ctx.translate(n.x, n.y + (1 - k) * alt); ctx.scale(SCALA_FIGURE_H7, SCALA_FIGURE_H7);
  disegno(n, t, flash);
  ctx.restore();
  // la piattaforma e le funi delle carrucole
  const py = M[1] + 6 + (1 - k) * alt * 0.2;
  ctx.fillStyle = '#5c3d22'; ctx.fillRect(M[0] - 13, Math.min(py, M[1] + 10), 26, 3);
  ctx.strokeStyle = '#8a7650'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(M[0] - 12, M[1] + 8); ctx.lineTo(M[0] - 12, M[1] - 40); ctx.moveTo(M[0] + 12, M[1] + 8); ctx.lineTo(M[0] + 12, M[1] - 40); ctx.stroke();
  // la sabbia che scivola dal bordo
  ctx.fillStyle = TINTE_H7.sabbia;
  for (let i = 0; i < 5; i++) { const q = ((t * 0.08 + i * 0.2) % 1); ctx.globalAlpha = 0.8 * (1 - q); ctx.fillRect(M[0] - 12 + i * 6, M[1] - 3 + q * 10, 1.2, 1.4); }
  ctx.restore();
}

const disegnaNemicoPittoricoBaseH7 = disegnaNemicoPittorico;
/** I nemici del luogo (e chi sale dai montacarichi) si disegnano qui; gli altri restano alla base. */
disegnaNemicoPittorico = function (...args) {
  const a = args[0] && typeof args[0].save === 'function' ? args.slice(1) : args;
  const n = a[0];
  const disegno = n && DISEGNI_NEMICI_H7[n.tipo];
  if (!disegno) return disegnaNemicoPittoricoBaseH7.apply(this, args);
  try {
    const flash = n.flash > 0 && OPZIONI.lampi !== false;
    if (n.saleH7 > 0) { disegnaSalitaH7(n, a[1] || 0, disegno, flash); return undefined; }
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(Math.round(n.x), Math.round(n.y)); ctx.scale(SCALA_FIGURE_H7, SCALA_FIGURE_H7);
    disegno(n, a[1] || 0, flash);
    ctx.restore();
  } catch (err) { console.error('[h7] disegno', n.tipo, err); }
  return undefined;
};

/** Le grate di ferro che chiudono le uscite durante il giuramento (cadono dall'alto). */
function disegnaGrateH7(st, tk) {
  const G = st.giuramentoH7, C = GIURAMENTI_H7;
  const giu = G.stato === 'in_corso' ? Math.min(1, (tk - G.t0) / C.grataTick) : Math.max(0, 1 - (tk - (G.t1 || 0)) / C.grataTick);
  if (giu <= 0) return;
  const P = { N: { x: 320, y: 61, w: 36, h: 18 }, S: { x: 320, y: 313, w: 36, h: 18 }, W: { x: 59, y: 187, w: 18, h: 36 }, E: { x: 581, y: 187, w: 18, h: 36 } };
  ctx.save();
  for (const lato of Object.keys(st.porte || {})) {
    const p = P[lato];
    if (!p) continue;
    const x0 = p.x - p.w / 2, y0 = p.y - p.h / 2, h = p.h * giu;
    ctx.fillStyle = 'rgba(10, 6, 4, 0.35)'; ctx.fillRect(x0, y0, p.w, h);
    ctx.strokeStyle = TINTE_H7.ferro; ctx.lineWidth = 2;
    ctx.beginPath();
    const passo = p.w > p.h ? 6 : 4.5;
    for (let xx = x0 + 2; xx < x0 + p.w; xx += passo) { ctx.moveTo(xx, y0); ctx.lineTo(xx, y0 + h); }
    ctx.moveTo(x0, y0 + h * 0.5); ctx.lineTo(x0 + p.w, y0 + h * 0.5);
    ctx.stroke();
    ctx.strokeStyle = BORDO_H7; ctx.lineWidth = 0.6; ctx.globalAlpha = 0.6;
    ctx.beginPath(); for (let xx = x0 + 2; xx < x0 + p.w; xx += passo) { ctx.moveTo(xx + 0.8, y0); ctx.lineTo(xx + 0.8, y0 + h); } ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = TINTE_H7.ferro; ctx.fillRect(x0, y0 + h - 1.5, p.w, 2.5); // la traversa in fondo
  }
  ctx.restore();
}

/** Le reti in volo e quella addosso a Ferruccio (sopra le figure). */
function disegnaRetiH7(st, tk) {
  ctx.save();
  ctx.strokeStyle = TINTE_H7.bordo; ctx.lineWidth = 0.7;
  for (const r of st.retiH7 || []) {
    const ap = Math.min(1, r.t / 14), R = 4 + ap * NEMICI_H7.reziario_ombra.rete.raggio;
    ombraTerraH7(r.x, r.y + 18, R * 0.8, 2.5, 0.3);
    ctx.beginPath(); ctx.arc(r.x, r.y, R, 0, TAU); ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 4; k++) { const q = r.t * 0.1 + (k * Math.PI) / 4; ctx.moveTo(r.x - Math.cos(q) * R, r.y - Math.sin(q) * R); ctx.lineTo(r.x + Math.cos(q) * R, r.y + Math.sin(q) * R); }
    ctx.stroke();
    ctx.fillStyle = TINTE_H7.ferro; for (let k = 0; k < 6; k++) { const q = (k / 6) * TAU + r.t * 0.1; ctx.fillRect(r.x + Math.cos(q) * R - 0.8, r.y + Math.sin(q) * R - 0.8, 1.6, 1.6); }
  }
  if (statoRun.irretitoH7 > 0) {
    const x = player.x, y = player.y - 12;
    ctx.beginPath();
    for (let k = -2; k <= 2; k++) { ctx.moveTo(x - 9, y + k * 4); ctx.lineTo(x + 9, y + k * 4 + 2); ctx.moveTo(x + k * 4, y - 10); ctx.lineTo(x + k * 4 - 2, y + 9); }
    ctx.stroke();
  }
  ctx.restore();
}

/** Le botole dei montacarichi della stanza, a filo della sabbia (sotto le figure). */
function disegnaBotoleH7(st) {
  ctx.save();
  for (const [bx, by] of montacarichiH7(st)) {
    ctx.fillStyle = 'rgba(60, 40, 22, 0.42)'; ctx.fillRect(bx - 13, by - 3, 26, 14);
    ctx.strokeStyle = 'rgba(40, 26, 14, 0.6)'; ctx.lineWidth = 0.8; ctx.strokeRect(bx - 13, by - 3, 26, 14);
    ctx.beginPath(); for (const k of [1.6, 6.3]) { ctx.moveTo(bx - 13, by + k); ctx.lineTo(bx + 13, by + k); } ctx.stroke();
    ctx.fillStyle = 'rgba(30, 20, 10, 0.7)'; ctx.fillRect(bx - 1, by + 2, 2, 2); // l'anello
  }
  ctx.restore();
}

const disegnaStanzaGrateBaseH7 = disegnaStanzaPixelArt;
/** Dopo la stanza: le grate del giuramento sulle uscite. */
disegnaStanzaPixelArt = function (tk, st, ...resto) {
  const r = disegnaStanzaGrateBaseH7.call(this, tk, st, ...resto);
  try {
    if (st && anfiteatroAttivoH7() && st.tipo !== 'boss') disegnaBotoleH7(st);
    if (st && st.giuramentoH7 && st.giuramentoH7.stato !== 'attesa') disegnaGrateH7(st, tk);
  } catch (err) { console.error('[h7] grate', err); }
  return r;
};

const disegnaHUDPixelArtBaseH7 = disegnaHUDPixelArt;
/** Prima dell'HUD: le reti in volo e quella addosso. */
disegnaHUDPixelArt = function (st, ...resto) {
  try { if (st && anfiteatroAttivoH7() && statoRun.fase === 'in_gioco') disegnaRetiH7(st, tick); } catch (err) { console.error('[h7] reti', err); }
  return disegnaHUDPixelArtBaseH7.call(this, st, ...resto);
};

Object.assign(window.__teatro.interni, {
  NEMICI_H7, SOSTITUZIONI_H7, GIURAMENTI_H7, MONTACARICHI_H7, TESTI_NEMICI_H7,
  giuramentiH7: Object.freeze({
    /** Il giuramento della stanza corrente (copia) o null. */
    get qui() { const st = statoRun.stanzaCorrente; return st && st.giuramentoH7 ? { ...st.giuramentoH7, favoreDato: Boolean(st.favoreH7) } : null; },
    /** Sviluppo/QA: crea un combattente del luogo nella stanza corrente, già salito (o in salita se `sale`). */
    crea(tipo, x, y, sale = false) {
      const st = statoRun.stanzaCorrente; const n = creaCombattenteH7(st, tipo, 0);
      if (!sale) { n.saleH7 = 0; n.airZ = 0; n.x = x; n.y = y; }
      return n.id;
    },
    get irretito() { return statoRun.irretitoH7 || 0; },
    get reti() { const st = statoRun.stanzaCorrente; return ((st && st.retiH7) || []).length; },
  }),
});

// ===========================================================================
// ARREDI DEL LUOGO: niente telai di San Leucio nell'arena (stesse misure e collisioni, cambia il disegno)
// ===========================================================================
/** `varianti`: pelle di b7 → arredo del luogo; `colonne`: le colonne senza pelle, una per posizione. */
const ARREDI_H7 = Object.freeze({
  varianti: Object.freeze({ telaio: 'gabbia', marmo: 'colonnaRotta', statua: 'colonnaRotta' }),
  colonne: Object.freeze(['colonnaRotta', 'argano', 'rastrelliera', 'gabbia']),
});

/** Pelli «a ombre» degli arredi (origine ai piedi, come le pelli di b7; disegnate una volta su timbroB7). */
const PELLI_H7 = Object.freeze({
  gabbia: { l: 50, a: 56, ax: 25, ay: 44, disegna(g) {
    ombraB7(g, 20, 5);
    rettB7(g, -19, -4, 38, 6, '#3b2414');                       // il pianale
    rettB7(g, -19, -40, 38, 5, '#3b2414');                      // il tetto
    g.fillStyle = 'rgba(8, 5, 3, 0.75)'; g.fillRect(-17, -35, 34, 31);
    g.strokeStyle = TINTE_H7.ferro; g.lineWidth = 2;
    g.beginPath(); for (let x = -16; x <= 16; x += 5.3) { g.moveTo(x, -35); g.lineTo(x, -4); } g.stroke();
    g.strokeStyle = TINTE_H7.bordo; g.lineWidth = 0.5; g.globalAlpha = 0.6;
    g.beginPath(); for (let x = -16; x <= 16; x += 5.3) { g.moveTo(x + 0.9, -35); g.lineTo(x + 0.9, -4); } g.stroke(); g.globalAlpha = 1;
    g.fillStyle = TINTE_H7.oro; g.fillRect(8, -22, 3, 4);       // il lucchetto aperto
    g.strokeStyle = '#8a7650'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -40); g.lineTo(0, -52); g.stroke(); // la fune della carrucola
  } },
  colonnaRotta: { l: 36, a: 56, ax: 18, ay: 46, disegna(g) {
    ombraB7(g, 13, 4.5);
    rettB7(g, -12, -6, 24, 7, TINTE_H7.travertinoOmbra);        // la base
    g.fillStyle = TINTE_H7.travertino; g.strokeStyle = '#050302'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-8, -6); g.lineTo(-8, -38); g.lineTo(-3, -42); g.lineTo(1, -36); g.lineTo(5, -40); g.lineTo(8, -34); g.lineTo(8, -6); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = TINTE_H7.travertinoOmbra; g.lineWidth = 0.8;
    g.beginPath(); for (const x of [-4, 0, 4]) { g.moveTo(x, -8); g.lineTo(x, -34); } g.stroke(); // le scanalature
    g.fillStyle = TINTE_H7.travertinoOmbra; g.fillRect(10, -4, 6, 4);   // un rocchio a terra
  } },
  argano: { l: 46, a: 52, ax: 23, ay: 42, disegna(g) {
    ombraB7(g, 17, 4.5);
    g.strokeStyle = '#050302'; g.lineWidth = 1.2; g.fillStyle = '#3b2414';
    for (const x of [-14, 10]) { g.fillRect(x, -30, 4, 30); g.strokeRect(x, -30, 4, 30); }   // i montanti
    g.fillStyle = '#5c3d22'; g.beginPath(); g.arc(0, -22, 9, 0, TAU); g.fill(); g.stroke();   // il tamburo con la fune
    g.strokeStyle = '#a08a5c'; g.lineWidth = 0.7; g.beginPath(); for (let k = -6; k <= 6; k += 2.4) { g.moveTo(-6, -22 + k); g.lineTo(6, -22 + k); } g.stroke();
    g.strokeStyle = TINTE_H7.ferro; g.lineWidth = 1.6; g.beginPath();                       // le stanghe
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; g.moveTo(0, -22); g.lineTo(Math.cos(a) * 15, -22 + Math.sin(a) * 15); } g.stroke();
  } },
  rastrelliera: { l: 40, a: 56, ax: 20, ay: 46, disegna(g) {
    ombraB7(g, 15, 4.5);
    rettB7(g, -14, -4, 28, 5, '#3b2414'); rettB7(g, -14, -26, 28, 3, '#3b2414');
    g.strokeStyle = '#d6c9a6'; g.lineWidth = 1.1; g.beginPath();
    for (const x of [-10, -4, 2, 8]) { g.moveTo(x, -2); g.lineTo(x + 1, -44); } g.stroke();    // le lance
    g.fillStyle = '#d6c9a6'; for (const x of [-10, -4, 2, 8]) { g.beginPath(); g.moveTo(x + 1, -48); g.lineTo(x - 1, -43); g.lineTo(x + 3, -43); g.closePath(); g.fill(); }
    g.fillStyle = TINTE_H7.china; g.strokeStyle = TINTE_H7.bordo; g.lineWidth = 0.6;          // uno scudo appoggiato
    g.beginPath(); g.arc(-12, -12, 7, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = TINTE_H7.rosso; g.beginPath(); g.arc(-12, -12, 2, 0, TAU); g.fill();
  } },
});

/** L'arredo del luogo per un ostacolo, o null se resta quello di base. */
function arredoH7(o) {
  if (o.tipo === 'fossa' || o.tipo === 'braciere') return null;
  if (o.variante) return ARREDI_H7.varianti[o.variante] || null;
  if (o.tipo !== 'colonna') return null;
  const L = ARREDI_H7.colonne;
  return L[Math.abs(Math.round(o.x) * 7 + Math.round(o.y) * 13) % L.length]; // sempre lo stesso nello stesso punto
}

if (typeof disegnaOstacoloB9 === 'function' && typeof timbroB7 === 'function') {
  const disegnaOstacoloBaseH7 = disegnaOstacoloB9;
  /** Ostacoli del palco: all'Anfiteatro gabbie, colonne spezzate, argani e rastrelliere al posto dei telai. */
  disegnaOstacoloB9 = function (o, t, ...resto) {
    try {
      const nome = anfiteatroAttivoH7() && arredoH7(o);
      if (nome) {
        const P = PELLI_H7[nome], c = timbroB7('h7-' + nome, P);
        const dx = o.scossoB7 > 0 ? (o.scossoB7 % 2 ? 1 : -1) : 0;
        ctx.drawImage(c, Math.round(o.x) - P.ax + dx, Math.round(o.y) - P.ay, P.l, P.a);
        return true;
      }
    } catch (err) { console.error('[h7] arredo', err); }
    return disegnaOstacoloBaseH7.call(this, o, t, ...resto);
  };
}
