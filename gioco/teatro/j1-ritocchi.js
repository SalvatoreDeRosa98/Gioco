/*
 * teatro/j1-ritocchi.js — ritocchi dopo la prova di un amico dell'autore (squadra j1):
 *  1. HUD leggero: i riquadri (vita, minimappa, prove, dock...) si attenuano quando sotto c'è Ferruccio, un nemico
 *     vivo o un proiettile nemico, e tornano pieni dopo un attimo (HUD_J1 in 00-config.js; fondi in 60-resa.js);
 *  2. la vita sono le Maschere: fila di maschere di cartapesta (piene, mezze, vuote) al posto dei cuori, e un filtro
 *     sui testi a schermo che toglie i cuori rimasti nei file degli altri («❤️» → «Maschera»);
 *  4. il fendente della Spada di Gaetano: anticipo, arco con scia a mezzaluna che sfuma, recupero (SPADA_J1).
 * Script classico, caricato dopo teatro/i2-piazza.js. Avvolge disegnaHUDPixelArt chiamando sempre la base.
 * Immagini sostituibili: `maschera-vita` (3 celle: piena, mezza, vuota) e `spada-lama` (1 cella, lama in verticale,
 * punta in basso) via disegnaCellaTeatro, con ripiego sul canvas. Verifica: tools/qa-teatro-ritocchi.js.
 */

/** Testi a schermo di j1 (raccolti da tools/elenco-testi-teatro.js). */
const TESTI_J1 = Object.freeze({
  vita: 'Vita:', // [nuovo] menu dei personaggi, davanti alla fila di maschere
  maschera: 'Maschera', // [nuovo] al posto del cuore nei testi
  decoro: '🎭', // [nuovo] al posto di un cuore usato come decoro in testa a un avviso
  pattoMax: '-1 Maschera max', // [nuovo] Stanza del Patto
});

/** Colori delle figure di j1 (stile a ombre: sagoma, contorno lanterna, pochi accenti). */
const TINTE_J1 = Object.freeze({
  cartapesta: '#efe2c4', ombraMaschera: '#2a1a12', lanterna: '#f9cb40', lanternaTenue: 'rgba(249, 203, 64, 0.45)',
  scuro: '#0a0604', rosso: '#b91c1c', lama: '#e8e4d8', filo: '#ffcf6b', elsa: '#1c1917', scia: '255, 214, 120',
});

// ===========================================================================
// 2. MASCHERE DELLA VITA
// ===========================================================================

/**
 * Disegna una maschera di cartapesta della vita centrata in (x, y).
 * @param {number} x @param {number} y
 * @param {number} riemp 1 piena, 0.5 mezza, 0 vuota
 * @param {number} [s=1] scala (1 = 10 px logici)
 */
function disegnaMascheraJ1(x, y, riemp, s = 1) {
  const cella = riemp >= 1 ? 0 : riemp > 0 ? 1 : 2;
  if (typeof disegnaCellaTeatro === 'function' && disegnaCellaTeatro(ctx, 'maschera-vita', cella, 3, x - 5 * s, y - 5 * s, 10 * s, 10 * s)) return;
  const T = TINTE_J1;
  const sagoma = () => {
    ctx.beginPath();
    ctx.moveTo(0, -4.6);
    ctx.bezierCurveTo(3.4, -4.6, 4.8, -3, 4.6, -0.6);
    ctx.bezierCurveTo(4.4, 2.2, 2.2, 4.6, 0, 5);
    ctx.bezierCurveTo(-2.2, 4.6, -4.4, 2.2, -4.6, -0.6);
    ctx.bezierCurveTo(-4.8, -3, -3.4, -4.6, 0, -4.6);
    ctx.closePath();
  };
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  sagoma(); ctx.lineWidth = 2.2; ctx.strokeStyle = T.scuro; ctx.stroke(); // contorno scuro: si legge sul palco
  ctx.fillStyle = T.ombraMaschera; ctx.fill();
  if (riemp > 0) {
    ctx.save();
    if (riemp < 1) { ctx.beginPath(); ctx.rect(-6, -6, 6, 12); ctx.clip(); }
    sagoma(); ctx.fillStyle = T.cartapesta; ctx.fill();
    ctx.fillStyle = T.rosso; // guance di belletto
    ctx.beginPath(); ctx.arc(-2.6, 1.6, 0.9, 0, TAU); ctx.arc(2.6, 1.6, 0.9, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = T.scuro; // occhi a mandorla
  ctx.beginPath(); ctx.ellipse(-1.9, -1, 1.3, 0.8, 0.25, 0, TAU); ctx.ellipse(1.9, -1, 1.3, 0.8, -0.25, 0, TAU); ctx.fill();
  if (riemp > 0) { ctx.strokeStyle = T.scuro; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-1, 3); ctx.quadraticCurveTo(0, 3.6, 1, 3); ctx.stroke(); }
  sagoma(); ctx.lineWidth = 0.8; ctx.strokeStyle = riemp > 0 ? T.lanterna : T.lanternaTenue; ctx.stroke();
  ctx.restore();
}

/**
 * Fila di maschere: tante quante le Maschere massime (2 mezze = 1), mai oltre il massimo. Oltre HUD_J1.maschere.max
 * diventa barra + una maschera + numero.
 * @param {number} x sinistra (o centro con o.centro) @param {number} y centro verticale
 * @param {number} hpHalf @param {number} maxHalf
 * @param {{centro?: boolean, scala?: number}} [o]
 * @returns {number} larghezza occupata
 */
function disegnaFilaMaschereJ1(x, y, hpHalf, maxHalf, o = {}) {
  const M = HUD_J1.maschere, s = o.scala || M.scala, passo = M.passo * s;
  const max = Math.max(1, Math.ceil(maxHalf / 2));
  const hp = Math.max(0, Math.min(hpHalf, max * 2)); // mai oltre il massimo
  if (max <= M.max) {
    const w = max * passo;
    const x0 = o.centro ? x - w / 2 : x;
    for (let i = 0; i < max; i++) {
      const r = hp >= (i + 1) * 2 ? 1 : hp > i * 2 ? 0.5 : 0;
      disegnaMascheraJ1(x0 + passo * i + passo / 2, y, r, s);
    }
    return w;
  }
  const bw = 70 * s, w = bw + passo + 34 * s;
  const x0 = o.centro ? x - w / 2 : x;
  disegnaMascheraJ1(x0 + passo / 2, y, 1, s);
  ctx.fillStyle = '#2d1210'; ctx.fillRect(x0 + passo, y - 3, bw, 6);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(x0 + passo, y - 3, Math.round(bw * hp / (max * 2)), 6);
  drawTextFit(`${(hp / 2).toFixed(1)}/${max}`, x0 + passo + bw + 3, y + 3, 34 * s, { size: 7.5, color: '#ffffff', align: 'left' });
  return w;
}

// Filtro dei testi: i cuori rimasti nei testi a schermo (file degli altri, avvisi, descrizioni) diventano Maschere.
/** Sostituisce i cuori in un testo a schermo. @param {*} t @returns {*} */
function senzaCuoriJ1(t) {
  if (typeof t !== 'string' || !/[❤♥🖤]/u.test(t)) return t;
  const M = TESTI_J1.maschera;
  return t
    .replace(/^\s*[❤♥🖤]️?\s+/u, TESTI_J1.decoro + ' ')
    .replace(/[❤♥🖤]️?\s*(?=Maschera)/gu, '')
    .replace(/[❤♥🖤]️?(\s*[❤♥🖤]️?)*/gu, M)
    .replace(/Maschera\s+Maschera/g, M);
}
for (const nome of ['fillText', 'strokeText', 'measureText']) {
  const base = ctx[nome];
  ctx[nome] = function (t, ...resto) { return base.call(this, senzaCuoriJ1(t), ...resto); };
}

// ===========================================================================
// 1. HUD CHE SI ATTENUA SOPRA I PERICOLI
// ===========================================================================

/** Stile dei riquadri dell'HUD secondo l'opzione «HUD leggero». @returns {{fondo:number,bordo:string,spessore:number}} */
function stileHudJ1() {
  const L = typeof OPZIONI === 'undefined' || OPZIONI.hudLeggero !== false;
  return L ? { fondo: HUD_J1.fondoLeggero, bordo: HUD_J1.bordoLeggero, spessore: HUD_J1.spessoreLeggero }
    : { fondo: HUD_J1.fondoPieno, bordo: HUD_J1.bordoPieno, spessore: HUD_J1.spessorePieno };
}

const hudJ1 = { zone: [], ultimo: {}, tela: null, alfa: {}, fondoMinimappa: 100 };

/** Cose che non devono restare nascoste: Ferruccio, nemici vivi, proiettili nemici. @returns {number[][]} [x, y, r] */
function pericoliJ1(st) {
  const out = [[player.x, player.y - 10, 12]];
  for (const n of (st && st.nemici) || []) if (n.hp > 0) out.push([n.x, n.y - 6, (n.r || 8) + 2]);
  for (const pr of statoRun.proiettiliNemici || []) out.push([pr.x, pr.y, 4]);
  return out;
}

/** Unisce i rettangoli che si toccano in riquadri. */
function unisciZoneJ1(rr) {
  const z = rr.map((r) => ({ ...r }));
  let cambiato = true;
  while (cambiato) {
    cambiato = false;
    for (let i = 0; i < z.length && !cambiato; i++) {
      for (let j = i + 1; j < z.length; j++) {
        const a = z[i], b = z[j];
        if (a.x <= b.x + b.w + 2 && b.x <= a.x + a.w + 2 && a.y <= b.y + b.h + 2 && b.y <= a.y + a.h + 2) {
          const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
          z[i] = { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
          z.splice(j, 1); cambiato = true; break;
        }
      }
    }
  }
  return z;
}

/**
 * Alfa del riquadro (1 pieno, HUD_J1.alfaSotto con qualcosa sotto, poi torna pieno in HUD_J1.rampa tick).
 * @param {{x:number,y:number,w:number,h:number}} z @param {number[][]} per pericoli @returns {number}
 */
function alfaZonaJ1(z, per) {
  const k = `${Math.round(z.x)},${Math.round(z.y)}`, m = HUD_J1.margine;
  const sotto = per.some(([x, y, r]) => x + r > z.x - m && x - r < z.x + z.w + m && y + r > z.y - m && y - r < z.y + z.h + m);
  if (sotto) hudJ1.ultimo[k] = tick;
  const u = hudJ1.ultimo[k];
  if (u === undefined) return 1;
  const dt = tick - u - HUD_J1.tenuta;
  if (dt <= 0) return HUD_J1.alfaSotto;
  if (dt >= HUD_J1.rampa) { delete hudJ1.ultimo[k]; return 1; }
  return HUD_J1.alfaSotto + (1 - HUD_J1.alfaSotto) * dt / HUD_J1.rampa;
}

const disegnaHUDPixelArtBaseJ1 = disegnaHUDPixelArt;
/** Dopo tutti gli altri: registra i riquadri disegnati e li attenua dove sotto c'è un pericolo. */
disegnaHUDPixelArt = function (st, ...resto) {
  const m = ctx.getTransform();
  const per = statoRun.fase === 'in_gioco' ? pericoliJ1(st) : [];
  const deboli = [];
  hudJ1.alfa = {};
  try {
    for (const z of hudJ1.zone) {
      const a = alfaZonaJ1(z, per);
      hudJ1.alfa[`${Math.round(z.x)},${Math.round(z.y)}`] = a;
      if (a < 0.999) deboli.push({ z, a });
    }
    if (deboli.length) {
      if (!hudJ1.tela) hudJ1.tela = document.createElement('canvas');
      const T = hudJ1.tela;
      if (T.width !== canvas.width || T.height !== canvas.height) { T.width = canvas.width; T.height = canvas.height; }
      const g = T.getContext('2d');
      for (const d of deboli) {
        d.r = [Math.floor(m.a * d.z.x + m.e), Math.floor(m.d * d.z.y + m.f), Math.ceil(m.a * d.z.w) + 2, Math.ceil(m.d * d.z.h) + 2];
        g.clearRect(...d.r); g.drawImage(canvas, ...d.r, ...d.r); // la scena prima dell'HUD
      }
    }
  } catch (err) { console.error('[J1] hud prima', err); deboli.length = 0; }
  const rett = [], f = ctx.fillRect;
  ctx.fillRect = function (x, y, w, h) { if (w * h >= 300 && w * h < W * H * 0.25) rett.push({ x, y, w, h }); return f.apply(this, arguments); };
  let r;
  try { r = disegnaHUDPixelArtBaseJ1.call(this, st, ...resto); } finally { ctx.fillRect = f; }
  try {
    hudJ1.zone = unisciZoneJ1(rett);
    if (deboli.length) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (const d of deboli) { ctx.globalAlpha = 1 - d.a; ctx.drawImage(hudJ1.tela, ...d.r, ...d.r); }
      ctx.restore();
    }
  } catch (err) { console.error('[J1] hud dopo', err); }
  return r;
};

// ===========================================================================
// 4. FENDENTE DELLA SPADA DI GAETANO
// ===========================================================================

/** Il fendente sta disegnando la sua lama (la figura non disegna la propria). @returns {boolean} */
function fendenteVisibileJ1() {
  return Boolean(statoRun.haSpada) && player.swordAnimTick >= 0 && player.swordAnimTick < SPADA_J1.durata;
}

/** Verso del fendente: destra e su girano in senso orario, sinistra e giù al contrario (sempre dall'alto/da fuori). */
function versoFendenteJ1(ang) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  return (dx < -0.5 || dy > 0.5) ? -1 : 1;
}

/**
 * Angolo della lama al tick t: anticipo (indietro oltre l'arco), fendente (curva rapida), recupero (torna piano).
 * @param {number} t @returns {{a:number, partenza:number}}
 */
function angoloLamaJ1(t) {
  const S = SPADA_J1, base = player.swordAngle, v = versoFendenteJ1(base);
  const partenza = base - v * S.arcoMezzo, arrivo = base + v * S.arcoMezzo;
  if (t < S.anticipo) return { a: partenza - v * 0.45 * (t + 1) / S.anticipo, partenza };
  if (t < S.fineFendente) {
    const k = (t - S.anticipo + 1) / (S.fineFendente - S.anticipo), e = 1 - (1 - k) * (1 - k);
    const da = partenza - v * 0.45;
    return { a: da + (arrivo - da) * e, partenza };
  }
  const k = (t - S.fineFendente + 1) / (S.durata - S.fineFendente);
  return { a: arrivo - v * 0.5 * S.arcoMezzo * k, partenza };
}

/** Lama nella mano a un angolo (sagoma chiara, filo color lanterna, elsa scura con guardia d'oro). */
function disegnaLamaJ1(cx, cy, a) {
  const S = SPADA_J1, T = TINTE_J1;
  ctx.save();
  ctx.translate(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5);
  ctx.rotate(a - Math.PI / 2); // la lama scende lungo +y
  if (!(typeof disegnaCellaTeatro === 'function' && disegnaCellaTeatro(ctx, 'spada-lama', 0, 1, -3, -5, 6, S.lama + 6))) {
    ctx.fillStyle = T.elsa; ctx.fillRect(-0.9, -4.5, 1.8, 4.5);
    ctx.fillStyle = T.lanterna; ctx.fillRect(-3, -0.6, 6, 1.4); // guardia
    ctx.beginPath(); ctx.arc(0, -4.8, 1.1, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-1.8, 0.8); ctx.lineTo(0, S.lama); ctx.lineTo(1.8, 0.8); ctx.closePath();
    ctx.fillStyle = T.lama; ctx.fill();
    ctx.lineWidth = 0.9; ctx.strokeStyle = T.scuro; ctx.stroke();
    ctx.strokeStyle = T.filo; ctx.lineWidth = 0.6; // filo color lanterna
    ctx.beginPath(); ctx.moveTo(1.1, 1); ctx.lineTo(0, S.lama - 0.5); ctx.stroke();
  }
  ctx.restore();
}

/** Scia a mezzaluna fra due angoli: sottile alle punte, piena al centro, tre fette che sfumano verso la coda. */
function disegnaSciaJ1(cx, cy, a0, a1, alfa) {
  const S = SPADA_J1, R = S.raggioScia, n = 14, fette = [0.28, 0.5, 0.85];
  for (let f = 0; f < fette.length; f++) {
    const k0 = f / fette.length, k1 = (f + 1) / fette.length;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const k = k0 + (k1 - k0) * i / n, a = a0 + (a1 - a0) * k;
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    }
    for (let i = n; i >= 0; i--) {
      const k = k0 + (k1 - k0) * i / n, a = a0 + (a1 - a0) * k;
      const sp = S.spessoreScia * Math.pow(Math.sin(Math.PI * Math.min(1, k)), 0.7);
      ctx.lineTo(cx + Math.cos(a) * (R - sp), cy + Math.sin(a) * (R - sp));
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(${TINTE_J1.scia}, ${(fette[f] * alfa).toFixed(3)})`;
    ctx.fill();
  }
  ctx.beginPath(); // filo esterno della mezzaluna
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); }
  ctx.strokeStyle = `rgba(255, 240, 200, ${(0.7 * alfa).toFixed(3)})`; ctx.lineWidth = 0.8; ctx.stroke();
}

/** Disegna il fendente in corso (chiamata da 60-resa.js subito dopo la figura di Ferruccio). */
function disegnaFendenteJ1() {
  if (!fendenteVisibileJ1()) return;
  const S = SPADA_J1, t = player.swordAnimTick, cx = player.x, cy = player.y - 6;
  const { a, partenza } = angoloLamaJ1(t);
  ctx.save();
  if (t >= S.anticipo) {
    const fine = t < S.fineFendente ? a : angoloLamaJ1(S.fineFendente - 1).a;
    const alfa = t < S.fineFendente ? 1 : Math.max(0, 1 - (t - S.fineFendente + 1) / (S.durata - S.fineFendente - 2));
    if (alfa > 0) disegnaSciaJ1(cx, cy, partenza, fine, alfa);
  }
  disegnaLamaJ1(cx, cy, a);
  ctx.restore();
}

if (typeof window !== 'undefined') {
  window.__teatro = window.__teatro || {};
  window.__teatro.interni = window.__teatro.interni || {};
  window.__teatro.interni.ritocchiJ1 = { hudJ1, senzaCuoriJ1, alfaZonaJ1, fendenteVisibileJ1, angoloLamaJ1, stileHudJ1 };
}
