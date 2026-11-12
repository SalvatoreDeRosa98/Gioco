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
  // le botole dei montacarichi (chiuse, a filo della sabbia): assi scure appena visibili
  for (const [bx, by] of [[150, 112], [490, 112], [150, 266], [490, 266]]) {
    x.fillStyle = 'rgba(60, 40, 22, 0.35)'; x.fillRect(bx - 13, by - 9, 26, 18);
    x.strokeStyle = 'rgba(40, 26, 14, 0.5)'; x.lineWidth = 0.8; x.strokeRect(bx - 13, by - 9, 26, 18);
    for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(bx - 13, by + k * 6); x.lineTo(bx + 13, by + k * 6); x.stroke(); }
  }
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
