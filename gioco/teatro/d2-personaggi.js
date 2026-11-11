/*
 * teatro/d2-personaggi.js — (squadra d2) QUATTRO PERSONAGGI CHE SI GIOCANO IN MODO DIVERSO.
 * Script classico, caricato dopo teatro/c2-tocco.js. Avvolge funzioni di primo livello e chiama sempre la base.
 *
 *  - Ferruccio: invariato (il riferimento).
 *  - Agnese, la Tessitrice: PIROETTA DI SETA sull'azione «mossa» (Maiusc / RT / bottone MOSSA a tocco): un giro
 *    breve che rimanda indietro i proiettili nemici vicini (diventano colpi suoi), la fa scattare in avanti e
 *    passare sopra le fosse; invulnerabile solo durante il giro; ricarica breve.
 *  - Taddeo, la Guardia Pentita: niente colpi, MENA IL MAGLIO (arco ravvicinato nella direzione di sparo).
 *    Tenendo premuto lo sparo carica (più danno, più portata); non subisce contraccolpo; rompe i fragili di b7
 *    (botti, vasi, balle, bauli, Capodimonte, casse di polvere) con un colpo.
 *    REGOLA DEGLI OGGETTI col maglio: la cadenza accelera il maglio; i «colpi in più» (doppia, triplo, quattro
 *    colpi, diagonale) allargano l'arco, i quattro lati lo fanno girare tutto intorno; la gittata e la grandezza
 *    dei colpi allungano la portata; il danno vale pieno; gli oggetti che cambiano il colpo (tipo, perforanti,
 *    raggio, esplosivi…) fanno partire anche un'onda a metà danno nella stessa direzione (come la spada).
 *  - L'Ombra Senza Fili: mezza Maschera e basta (muore al primo colpo; vite extra e Collare valgono ancora); le
 *    Maschere raccolte a terra diventano monete; vola sopra fosse, colonne e arredi; colpi spettrali che passano
 *    ostacoli e nemici. Nessuna mossa.
 * Agganci altrui (una riga): b3 (azione «mossa», RT, simbolo), c2 (bottone MOSSA), 60-resa (scheda), 00-config.
 */

/** Numeri dei personaggi. I tick sono a 60 al secondo. */
const STILI_D2 = Object.freeze({
  ferruccio: Object.freeze({ mossa: null }),
  agnese: Object.freeze({
    mossa: 'piroetta',
    piroetta: Object.freeze({
      durataTick: 16,        // durata del giro (e dell'invulnerabilità)
      ricaricaTick: 72,      // dalla partenza di un giro alla prossima (1,2 s)
      scattoPx: 66,          // quanto la porta avanti il giro (abbastanza per superare una fossa)
      raggioDevia: 28,       // proiettili nemici entro questo raggio vengono rimandati
      velRimando: 1.5,       // velocità del colpo rimandato rispetto a quella del proiettile nemico (min 3.2)
      dannoRimando: 1.0,     // × danno di Agnese
      gittataRimando: 220,
    }),
  }),
  taddeo: Object.freeze({
    mossa: null,
    nienteContraccolpo: true,
    maglio: Object.freeze({
      cadenzaMult: 1.7,      // cooldown del maglio = cooldownMax × questo
      dannoMult: 1.6,        // × danno di Taddeo per colpo
      portataPx: 40,
      arcoRad: 1.9,          // ~110°
      arcoExtra: Object.freeze({ doppia: 0.35, triplo: 0.6, quattroColpi: 0.8, diagonale: 0.5 }),
      arcoMax: Math.PI * 2,
      sogliaCaricaTick: 8,   // un tocco breve è un colpo semplice
      caricaMaxTick: 40,     // tenendo premuto: a pieno carico parte da solo
      caricaDannoMult: 2.2,  // a pieno carico
      caricaPortataMult: 1.3,
      ondaScala: 0.5,
      animTick: 12,
    }),
  }),
  ombra: Object.freeze({
    mossa: null,
    maxHpHalf: 1,
    monetePerMezza: 2,       // una Maschera a terra (2 mezze) vale 4 monete
    vola: true,
    spettrali: true,
    scia: Object.freeze({ punti: 6, ogniTick: 3 }),
  }),
});

/** Testi per il giocatore (da approvare dall'autore). */
const TESTI_D2 = Object.freeze({
  stile: Object.freeze({
    ferruccio: 'Colpi nelle quattro direzioni',
    agnese: (t) => `Piroetta [${t}]: devia i colpi e salta i buchi`,
    taddeo: 'Mena il maglio: tieni premuto per caricare',
    ombra: 'Un colpo e cade · vola · colpi spettrali',
  }),
  dono: Object.freeze({ taddeo: '🔨 Maglio della Guardia', ombra: '🩸 Anello Cremisi' }),
  vitaOmbra: '½ (non si cura)',
  bottone: 'MOSSA',
  monete: (n) => `Maschera ridotta in ${n} monete`,
});

const d2 = {
  giro: 0, ricarica: 0, dirX: 1, dirY: 0, deviati: 0,
  carica: null,          // { dx, dy, tick0, ultimo } finché Taddeo tiene premuto
  arco: null,            // { ang, mezzo, r, t0, pieno } ultimo colpo di maglio (per il disegno)
  rotti: 0, colpiMaglio: 0, nelMaglio: false,
  rec: { tick: -1, x: 0, y: 0, mx: 0, my: 0, leva: false },
  scia: [], sciaI: 0, sorvoli: 0,
};

/** Id del personaggio della run. */
function personaggioD2() { return (statoRun && statoRun.personaggioId) || 'ferruccio'; }
/** Tabella dello stile del personaggio della run. */
function stileD2() { return STILI_D2[personaggioD2()] || STILI_D2.ferruccio; }

function inScenaD2() {
  return statoRun.fase === 'in_gioco' && statoRun.stanzaCorrente && !statoRun.pausa && !statoRun.scambioPendente
    && !statoRun.pannelloB && !statoRun.siparioAttivo && !statoRun.diarioD;
}

/** Simbolo del comando della mossa per il dispositivo in uso. */
function tastoMossaD2() {
  try { if (typeof inToccoB3 === 'function' && inToccoB3()) return TESTI_D2.bottone; } catch (_) { /* niente */ }
  try { if (typeof simboloB3 === 'function') return simboloB3('mossa') || 'Maiusc'; } catch (_) { /* niente */ }
  return 'Maiusc';
}

function suonoD2(f0, f1, ms, tipo, vol) {
  try {
    const A = typeof AudioSys !== 'undefined' ? AudioSys : null;
    if (!A || !A.ctx || A.attivo === false) return;
    const c = A.ctx, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + ms / 1000);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + ms / 1000);
    o.connect(g); g.connect(A.uscita || c.destination); o.start(t); o.stop(t + ms / 1000 + 0.02);
  } catch (_) { /* il suono non deve mai fermare il gioco */ }
}

/**
 * Azione «mossa» (Maiusc, RT, bottone MOSSA). Agnese: piroetta. Gli altri: niente.
 * @returns {boolean} true se la mossa è partita
 */
function mossaD2() {
  const S = stileD2();
  if (S.mossa !== 'piroetta' || !inScenaD2() || d2.ricarica > 0) return false;
  const P = S.piroetta;
  let mx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), my = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
  try { const l = typeof levaToccoC2 === 'function' ? levaToccoC2(mx, my) : null; if (l) { mx = l.x; my = l.y; } } catch (_) { /* niente */ }
  if (mx === 0 && my === 0) { mx = player.dirX || (player.flipX ? -1 : 1); my = player.dirY || 0; }
  const l = Math.hypot(mx, my) || 1;
  d2.dirX = mx / l; d2.dirY = my / l;
  d2.giro = P.durataTick;
  d2.ricarica = P.ricaricaTick;
  player.invuln = Math.max(player.invuln || 0, P.durataTick);
  suonoD2(900, 260, 260, 'triangle', 0.05);
  return true;
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'ShiftLeft' && !e.repeat) mossaD2();
});

/** Un passo della piroetta: scatto, deviazione dei proiettili nemici. */
function passoPiroettaD2() {
  const P = STILI_D2.agnese.piroetta;
  const passo = P.scattoPx / P.durataTick;
  player.x = Math.max(ARENA.x1, Math.min(ARENA.x2, player.x + d2.dirX * passo));
  player.y = Math.max(ARENA.y1, Math.min(ARENA.y2, player.y + d2.dirY * passo));
  const L = statoRun.proiettiliNemici;
  for (let i = L.length - 1; i >= 0; i--) {
    const pr = L[i];
    if (!pr || Math.hypot(pr.x - player.x, pr.y - (player.y - 6)) > P.raggioDevia) continue;
    L.splice(i, 1);
    const v = Math.max(3.2, Math.hypot(pr.vx, pr.vy) * P.velRimando);
    const a = Math.atan2(-pr.vy, -pr.vx);
    statoRun.proiettili.push({
      x: pr.x, y: pr.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, dist: 0, maxDist: P.gittataRimando,
      dmg: statoRun.dmg * P.dannoRimando, r: 4.5, tipo: 'base', piercing: false, overflowPierce: false, hitIds: new Set(),
      oming: 0, rimbalzi: 0, orbitaD: null, esplosiva: 0, prossimita: false, bloccaProiettili: false, deviatoD2: true,
    });
    statoRun.effettiSplash.push({ x: pr.x, y: pr.y, tick: 0 });
    d2.deviati++;
    suonoD2(1700, 900, 90, 'square', 0.03);
  }
  d2.giro--;
}

// --- Volo (Ombra) e salto delle fosse (Agnese in piroetta): si annulla lo spostamento fatto dagli ostacoli ---
const levaToccoBaseD2 = levaToccoC2;
levaToccoC2 = function levaToccoD2(mx, my) {
  const r = levaToccoBaseD2.apply(this, arguments);
  if (statoRun.fase === 'in_gioco') {
    const R = d2.rec;
    R.tick = tick; R.x = player.x; R.y = player.y; R.mx = r ? r.x : mx; R.my = r ? r.y : my; R.leva = Boolean(r);
  }
  return r;
};

/** Quali ostacoli si sorvolano adesso: null (nessuno), oppure un insieme di tipi. */
function sorvolaD2() {
  const S = stileD2();
  if (S.vola) return TIPI_VOLO_D2;
  if (S.mossa === 'piroetta' && d2.giro > 0) return TIPI_SALTO_D2;
  return null;
}
const TIPI_VOLO_D2 = new Set(['colonna', 'braciere', 'fossa']);
const TIPI_SALTO_D2 = new Set(['fossa']);

function correggiSorvoloD2(st, tipi) {
  const R = d2.rec;
  if (R.tick !== tick || !st.ostacoli || !st.ostacoli.length) return;
  const l = R.leva ? Math.max(1, Math.hypot(R.mx, R.my)) : Math.hypot(R.mx, R.my);
  const x1 = l > 0 ? Math.max(ARENA.x1, Math.min(ARENA.x2, R.x + (R.mx / l) * statoRun.speed)) : R.x;
  const y1 = l > 0 ? Math.max(ARENA.y1, Math.min(ARENA.y2, R.y + (R.my / l) * statoRun.speed)) : R.y;
  if (Math.hypot(player.x - x1, player.y - y1) < 0.3) return;
  let dentro = false, sulBordo = false;
  for (const o of st.ostacoli) {
    if (!tipi.has(o.tipo)) continue;
    const rMin = o.r + 9;
    if (Math.hypot(x1 - o.x, y1 - o.y) < rMin) dentro = true;
    if (Math.abs(Math.hypot(player.x - o.x, player.y - o.y) - rMin) < 0.6) sulBordo = true;
  }
  if (dentro && sulBordo) { player.x = x1; player.y = y1; d2.sorvoli++; }
}

// --- Taddeo: il maglio ---
function arcoMaglioD2() {
  const M = STILI_D2.taddeo.maglio, D = statoRun.statD || {};
  if (statoRun.quadDir) return M.arcoMax;
  let a = M.arcoRad;
  if (statoRun.doppia) a += M.arcoExtra.doppia;
  if (statoRun.triplo) a += M.arcoExtra.triplo;
  if (D.quattroColpi) a += M.arcoExtra.quattroColpi;
  if (D.diagonale) a += M.arcoExtra.diagonale;
  return Math.min(M.arcoMax, a);
}

/** Colpo di maglio verso (dx, dy); frac 0..1 = quanto è carico. */
function colpoMaglioD2(dx, dy, frac) {
  const M = STILI_D2.taddeo.maglio;
  const st = statoRun.stanzaCorrente;
  if (!st) return;
  const ang = Math.atan2(dy, dx);
  const mezzo = arcoMaglioD2() / 2;
  const scalaR = Math.max(0.85, Math.min(1.4, (statoRun.range || 170) / 170)) * Math.max(0.8, Math.min(1.5, statoRun.projScale || 1));
  const R = M.portataPx * scalaR * (1 + (M.caricaPortataMult - 1) * frac);
  const dmg = statoRun.dmg * M.dannoMult * (1 + (M.caricaDannoMult - 1) * frac);
  const hx = player.x, hy = player.y - 6;
  const nelArco = (x, y, extra) => {
    const ddx = x - hx, ddy = y - hy, d = Math.hypot(ddx, ddy);
    if (d > R + extra) return false;
    if (d < extra + 8) return true;
    let da = Math.atan2(ddy, ddx) - ang;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    return Math.abs(da) <= mezzo;
  };
  // la catena di eseguiAttacco4Direzioni (oggetti, trasformazioni…) vede l'attacco, ma senza proiettili
  const spadaPrima = statoRun.haSpada, sparoPrima = AudioSys.playSparo;
  d2.nelMaglio = true;
  try {
    statoRun.haSpada = false;
    AudioSys.playSparo = function () {};
    attaccoBaseD2(dx, dy);
  } finally {
    d2.nelMaglio = false; statoRun.haSpada = spadaPrima; AudioSys.playSparo = sparoPrima;
  }
  player.cooldown = Math.max(9, Math.round(statoRun.cooldownMax * M.cadenzaMult));
  player.shootAnimTimer = 7;
  let colpiti = 0;
  for (const nem of st.nemici) {
    if (nem.hp <= 0 || (nem.airZ || 0) > 16) continue;
    if (nelArco(nem.x, nem.y - 6, nem.r || 8)) { danneggiaNemico(nem, dmg, Math.cos(ang), Math.sin(ang)); colpiti++; }
  }
  if (st.ostacoli) {
    for (const o of st.ostacoli.slice()) {
      if (!nelArco(o.x, o.y, o.r || 10)) continue;
      if (o.fragileB7 && typeof colpisciFragileB7 === 'function') {
        if (!o.rottoB7 && !o.finitoB7) { o.fragileB7.colpi = Math.min(o.fragileB7.colpi, 1); colpisciFragileB7(st, o); d2.rotti++; }
      }
    }
  }
  if (st.muroSegreto && !st.muroSegreto.aperto && typeof posMuroSegreto !== 'undefined' && typeof colpisciMuroSegretoC === 'function') {
    const pm = posMuroSegreto[st.muroSegreto.lato];
    if (pm && Math.hypot(hx - pm.x, hy - pm.y) <= R + 16) colpisciMuroSegretoC(st, pm.x, pm.y);
  }
  for (let i = statoRun.proiettiliNemici.length - 1; i >= 0; i--) {
    const pr = statoRun.proiettiliNemici[i];
    if (pr && nelArco(pr.x, pr.y, 2)) { statoRun.effettiSplash.push({ x: pr.x, y: pr.y, tick: 0 }); statoRun.proiettiliNemici.splice(i, 1); }
  }
  const D = statoRun.statD || {};
  if (statoRun.tipoProiettile !== 'base' || statoRun.piercing || statoRun.laser || D.esplosiva || D.rimbalzi || D.oming) {
    sparaBaseD2(dx, dy, M.ondaScala);
  }
  d2.arco = { ang, mezzo, r: R, t0: tick, pieno: frac >= 0.99 };
  d2.colpiMaglio++;
  if (colpiti > 0 || frac > 0.5) scuoti(FEEL.scossa.bomba);
  try { AudioSys.playFendente(); } catch (_) { /* niente */ }
  suonoD2(160 + 60 * frac, 50, 160, 'sawtooth', 0.05);
}

const attaccoBaseD2 = eseguiAttacco4Direzioni;
eseguiAttacco4Direzioni = function eseguiAttaccoD2(dx, dy) {
  if (personaggioD2() !== 'taddeo' || d2.nelMaglio) return attaccoBaseD2.apply(this, arguments);
  if (player.cooldown > 0 || statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo) return;
  player.dirX = dx; player.dirY = dy;
  if (dx !== 0) player.flipX = dx < 0;
  if (!d2.carica) d2.carica = { dx, dy, tick0: tick, ultimo: tick };
  else { d2.carica.dx = dx; d2.carica.dy = dy; d2.carica.ultimo = tick; }
};

/** A fine passo: il maglio parte quando si lascia lo sparo o a pieno carico. */
function passoCaricaD2() {
  const C = d2.carica;
  if (!C) return;
  const M = STILI_D2.taddeo.maglio;
  const durata = tick - C.tick0;
  const tenuto = C.ultimo === tick;
  if (tenuto && durata < M.caricaMaxTick) return;
  const frac = Math.max(0, Math.min(1, (durata - M.sogliaCaricaTick) / (M.caricaMaxTick - M.sogliaCaricaTick)));
  d2.carica = null;
  colpoMaglioD2(C.dx, C.dy, frac);
}

const sparaBaseD2 = sparaProiettiliDirezione;
sparaProiettiliDirezione = function sparaD2(dx, dy, scala) {
  if (d2.nelMaglio) return undefined; // il maglio non tira colpi (l'onda la tira colpoMaglioD2)
  const n0 = statoRun.proiettili.length;
  const r = sparaBaseD2.apply(this, arguments);
  if (stileD2().spettrali) {
    for (let i = n0; i < statoRun.proiettili.length; i++) { const p = statoRun.proiettili[i]; p.piercing = true; p.spettraleD2 = true; }
  }
  return r;
};

// --- Taddeo: niente contraccolpo ---
const spingiBaseD2 = spingi;
spingi = function spingiD2(corpo) {
  if (corpo === player && stileD2().nienteContraccolpo) return undefined;
  return spingiBaseD2.apply(this, arguments);
};

// --- Ombra: mezza Maschera fissa ---
function limitaOmbraD2() {
  if (!stileD2().maxHpHalf) return;
  statoRun.maxHpHalf = STILI_D2.ombra.maxHpHalf;
  if (statoRun.hpHalf > statoRun.maxHpHalf) statoRun.hpHalf = statoRun.maxHpHalf;
}
const ricalcolaBaseD2 = ricalcolaStatistiche;
ricalcolaStatistiche = function ricalcolaD2() {
  const r = ricalcolaBaseD2.apply(this, arguments);
  limitaOmbraD2();
  return r;
};

/** L'Ombra: le Maschere a terra che tocca diventano monete. */
function maschereInMoneteD2(st) {
  if (!st.oggettiATerra) return;
  for (const pk of st.oggettiATerra) {
    if (pk.tipo !== 'cura' || Math.hypot(player.x - pk.x, player.y - pk.y) >= 20) continue;
    pk.tipo = 'moneta';
    pk.valore = Math.max(1, Math.round((pk.valore || 1) * STILI_D2.ombra.monetePerMezza));
    if (typeof mostraBanner === 'function') mostraBanner(TESTI_D2.monete(pk.valore), 80);
  }
}

/** Colpi spettrali dell'Ombra: durante il passo il controllo di T3 «colpi spettrali» risponde sì. */
function conSpettraliD2(fn) {
  const L = statoRun.oggettiEquipaggiati;
  if (!Array.isArray(L) || !stileD2().spettrali) return fn();
  const finto = { id: '', mod: { spettrali: true } };
  Object.defineProperty(L, 'some', { configurable: true, writable: true, value(f, t) { return Array.prototype.some.call(this, f, t) || Boolean(f.call(t, finto, -1, this) && f.toString().includes('spettrali')); } });
  try { return fn(); } finally { delete L.some; }
}

const passoBaseD2 = passoLogico;
passoLogico = function passoLogicoD2() {
  const st = statoRun.stanzaCorrente;
  const vivo = st && inScenaD2() && ticksCongelati <= 0;
  if (vivo) {
    if (d2.ricarica > 0) d2.ricarica--;
    if (d2.giro > 0 && personaggioD2() === 'agnese') passoPiroettaD2();
    if (personaggioD2() === 'ombra') maschereInMoneteD2(st);
  }
  if (statoRun.fase !== 'in_gioco') { d2.giro = 0; d2.carica = null; }
  const r = conSpettraliD2(() => passoBaseD2.apply(this, arguments));
  const st2 = statoRun.stanzaCorrente;
  if (vivo && st2 === st && statoRun.fase === 'in_gioco') {
    const tipi = sorvolaD2();
    if (tipi) correggiSorvoloD2(st, tipi);
    if (personaggioD2() === 'taddeo') passoCaricaD2(); else d2.carica = null;
    if (personaggioD2() === 'ombra') {
      limitaOmbraD2();
      const S = STILI_D2.ombra.scia;
      if (tick % S.ogniTick === 0) { d2.scia[d2.sciaI % S.punti] = { x: player.x, y: player.y, t: tick }; d2.sciaI++; }
    }
  } else if (st2 !== st) { d2.carica = null; d2.giro = 0; d2.scia.length = 0; }
  return r;
};

// --- Disegni «a ombre»: nastro di seta, arco del maglio, scia spettrale ---
function disegnaNastroD2(g, x, y) {
  const P = STILI_D2.agnese.piroetta;
  const k = 1 - d2.giro / P.durataTick;
  const giro = k * Math.PI * 4;
  g.save();
  g.lineCap = 'round';
  for (let s = 0; s < 3; s++) {
    const r = 13 + s * 4;
    const a0 = giro - s * 0.9;
    g.beginPath();
    g.ellipse(x, y - 12, r, r * 0.55, 0, a0, a0 + 2.4);
    g.strokeStyle = 'rgba(12,6,4,0.85)'; g.lineWidth = 4.5 - s; g.stroke();
    g.strokeStyle = s === 1 ? 'rgba(200,40,40,0.8)' : 'rgba(249,203,64,0.85)'; g.lineWidth = 1.1; g.stroke();
  }
  g.restore();
}

function disegnaArcoD2(g, x, y) {
  const A = d2.arco, M = STILI_D2.taddeo.maglio;
  const k = (tick - A.t0) / M.animTick;
  if (k < 0 || k > 1) return;
  g.save();
  g.globalAlpha = 1 - k * 0.8;
  const cx = x, cy = y - 6, r0 = Math.max(6, A.r * 0.45), r1 = A.r * (0.85 + 0.15 * k);
  const a0 = A.ang - A.mezzo, a1 = A.ang + A.mezzo;
  g.beginPath();
  g.ellipse(cx, cy, r1, r1 * 0.8, 0, a0, a1);
  g.ellipse(cx, cy, r0, r0 * 0.8, 0, a1, a0, true);
  g.closePath();
  g.fillStyle = 'rgba(14,8,5,0.72)'; g.fill();
  g.beginPath(); g.ellipse(cx, cy, r1, r1 * 0.8, 0, a0, a1);
  g.strokeStyle = A.pieno ? 'rgba(239,68,68,0.95)' : 'rgba(249,203,64,0.9)'; g.lineWidth = 1.6; g.stroke();
  g.restore();
}

function disegnaCaricaD2(g, x, y) {
  const C = d2.carica, M = STILI_D2.taddeo.maglio;
  if (!C) return;
  const frac = Math.max(0, Math.min(1, (tick - C.tick0 - M.sogliaCaricaTick) / (M.caricaMaxTick - M.sogliaCaricaTick)));
  if (frac <= 0) return;
  g.save();
  g.beginPath(); g.arc(x, y - 30, 4, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  g.strokeStyle = 'rgba(12,6,4,0.9)'; g.lineWidth = 3; g.stroke();
  g.strokeStyle = frac >= 1 ? '#ef4444' : '#f9cb40'; g.lineWidth = 1.2; g.stroke();
  g.restore();
}

function disegnaSciaD2(g) {
  const S = STILI_D2.ombra.scia;
  g.save();
  for (const q of d2.scia) {
    if (!q) continue;
    const eta = (tick - q.t) / (S.punti * S.ogniTick);
    if (eta < 0 || eta >= 1 || Math.hypot(q.x - player.x, q.y - player.y) < 3) continue;
    g.globalAlpha = 0.35 * (1 - eta);
    g.beginPath(); g.ellipse(q.x, q.y - 12, 6, 13, 0, 0, Math.PI * 2);
    g.fillStyle = '#0b0710'; g.fill();
    g.strokeStyle = 'rgba(196,181,253,0.7)'; g.lineWidth = 0.8; g.stroke();
  }
  g.restore();
}

function disegnaRicaricaD2(g, x, y) {
  const P = STILI_D2.agnese.piroetta;
  if (d2.ricarica <= 0 || d2.giro > 0) return;
  const k = 1 - d2.ricarica / P.ricaricaTick;
  g.save();
  g.beginPath(); g.ellipse(x, y + 2, 10, 3.5, 0, Math.PI, Math.PI + k * Math.PI);
  g.strokeStyle = 'rgba(249,203,64,0.55)'; g.lineWidth = 1; g.stroke();
  g.restore();
}

const disegnaFerruccioBaseD2 = disegnaFerruccioPittorico;
disegnaFerruccioPittorico = function disegnaFerruccioD2(g, px, py) {
  const inScena = g && typeof g.save === 'function' && statoRun.fase === 'in_gioco' && px === player.x && py === player.y;
  const pid = personaggioD2();
  if (inScena && pid === 'ombra') { try { disegnaSciaD2(g); } catch (_) { /* niente */ } }
  const r = disegnaFerruccioBaseD2.apply(this, arguments);
  if (inScena) {
    try {
      if (pid === 'agnese') { if (d2.giro > 0) disegnaNastroD2(g, px, py); else disegnaRicaricaD2(g, px, py); }
      if (pid === 'taddeo') { if (d2.arco) disegnaArcoD2(g, px, py); disegnaCaricaD2(g, px, py); }
    } catch (_) { /* il disegno non deve fermare il gioco */ }
  }
  return r;
};

/** Scheda del menu di scelta (60-resa.js): vita, dono, riga «come si gioca». */
function schedaD2(pId) {
  const s = TESTI_D2.stile[pId];
  return {
    vita: pId === 'ombra' ? TESTI_D2.vitaOmbra : null,
    dono: TESTI_D2.dono[pId] || null,
    stile: typeof s === 'function' ? s(tastoMossaD2()) : (s || ''),
  };
}

// --- Tocco (c2): bottone MOSSA solo per chi ha la mossa ---
const ICONA_MOSSA_D2 = '<path d="M12 4a8 8 0 1 1-7.4 5M12 8a4 4 0 1 1-3.7 2.5M4 4l.6 5 5-.6"/>';
const creaStratoBaseD2 = creaStratoC2;
creaStratoC2 = function creaStratoD2() {
  const r = creaStratoBaseD2.apply(this, arguments);
  try {
    const b = creaBottoneC2('mossa', ICONA_MOSSA_D2, { scritta: false });
    b.dataset.b = '7'; // RT del gamepad virtuale: b3 lo legge come azione «mossa»
    b.setAttribute('aria-label', TESTI_D2.bottone);
    b.classList.remove('c2-solo');
    b.insertAdjacentHTML('beforeend', `<b>${TESTI_D2.bottone}</b>`);
    b.hidden = true;
  } catch (_) { /* niente */ }
  return r;
};
const disponiBaseD2 = disponiC2;
disponiC2 = function disponiD2() {
  const r = disponiBaseD2.apply(this, arguments);
  try {
    const E = c2.el;
    if (E.mossa && E.consuma) {
      const d = parseFloat(E.consuma.style.getPropertyValue('--d')) || 54;
      const x = parseFloat(E.consuma.style.left) || 0, y = parseFloat(E.consuma.style.top) || 0;
      const vert = typeof verticaleC2 === 'function' && verticaleC2();
      mettiC2(E.mossa, vert ? x : x, vert ? y - d * 1.2 : y - d * 1.15, d);
    }
  } catch (_) { /* niente */ }
  return r;
};
const vistaBaseD2 = aggiornaVistaC2;
aggiornaVistaC2 = function aggiornaVistaD2(c) {
  const r = vistaBaseD2.apply(this, arguments);
  try {
    const E = c2.el.mossa;
    if (E) {
      E.hidden = !(c === 'gioco' && stileD2().mossa);
      E.classList.toggle('c2-spento', d2.ricarica > 0);
      E.classList.toggle('c2-pronto', d2.ricarica <= 0);
      for (const [id, el] of c2.puntatori) if (el.hidden) rilasciaBottoneC2(id);
    }
  } catch (_) { /* niente */ }
  return r;
};

Object.assign(window.__teatro.interni, {
  personaggiD2: { STILI_D2, d2, mossa: mossaD2, stile: stileD2, scheda: schedaD2, arco: arcoMaglioD2 },
});
