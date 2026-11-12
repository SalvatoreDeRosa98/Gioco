/*
 * teatro/i2-piazza.js — (squadra i2) IMMAGINI DELLA PIAZZA dell'autore: il portone della bottega di Gaetano
 * (chiuso / socchiuso / aperto), Tonino (due pose) e il suo banchetto. Agnese al telaio sta in h1-agnese-taddeo.js.
 *
 * Le immagini sono voci di IMMAGINI_B9 (b9-immagini.js): si disegnano con timbraB9, che le prepara una volta
 * alla scala del buffer. Se l'immagine non c'è (manca, non è caricata, immagini di scena spente) ogni funzione
 * di qui risponde false e T4 disegna la figura a codice di prima.
 *
 * REGOLE
 *   - Portone: APERTO se la fucina è aperta (p.aperta di T4 o portaAperta di b8); SOCCHIUSO quando la porta è
 *     pronta (tre sigilli rotti e finale vero visto: la stessa domanda di h4 portaProntaH4 e di b8 per «bussa»);
 *     CHIUSO altrimenti, con la spranga di ferro su cui b8 mette i sigilli. Sopra l'immagine b8 disegna come
 *     sempre sigilli, ferri appesi, luce sotto la porta e filo d'oro; col portone aperto il bagliore di fucina
 *     di b8 (pensato per la porta a codice) resta fuori dal vano, che nell'immagine ha già buio e fili d'oro.
 *   - Tonino: posa 1 (la lanterna) quando parla (finestra di T4 aperta vicino a lui), con la notte viva di h4 o
 *     dalla notte CONFIG_I2.tonino.lanternaDaNotte; posa 0 (indica) altrimenti. Le pose di scena di c1 (spento,
 *     risveglio, fagotto) restano a codice: c1 le disegna prima di noi.
 *   - Banchetto: sul rettangolo del banco di T4 (lo stesso dell'ingombro), specchiato perché lo sgabello cada a
 *     sinistra, dove T4 mette la sedia vuota di Rosa. I due piatti del ricordo restituito restano a codice.
 *
 * AGGANCI: t4-hub-storia.js › disegnaPortaBottega (T.portaImmagineI2) e disegnaBanchetto (T.banchettoImmagineI2);
 * avvolge T.disegnaToninoC1 (c1). Sonda QA: window.__teatro.interni.piazzaI2.
 */

/** Numeri della piazza (px del canvas 640×360). */
const CONFIG_I2 = Object.freeze({
  porta: Object.freeze({
    soglia: 10,                     // dalla y della porta (SEGRETO_B8.porta.y = 62) alla soglia: lì poggia il portone
    spranga: Object.freeze({ dx: 15, dy: -8, alt: 3, colore: '#5b6270', luce: '#9ca3af', nero: '#0a0604' }),
    vano: Object.freeze({ dx: 14, su: 34, giu: 10 }), // il vano del portone aperto (fuori dal bagliore di b8)
  }),
  tonino: Object.freeze({
    piedi: 12,                      // dai suoi (x, y) di T4 alla pianta dei piedi (la figura a codice finisce lì)
    lanternaDaNotte: 4,
    raggioParla: 64,                // come b8 distToninoB8: la finestra aperta entro questo raggio è sua
    ombra: Object.freeze({ dy: 10, rx: 12, ry: 4, colore: 'rgba(8, 5, 3, 0.6)' }),
  }),
  banchetto: Object.freeze({
    sotto: 3,                       // il banco poggia appena sotto il bordo basso del rettangolo
    dx: -6,                         // spostato un po' a sinistra: lo sgabello sta dove T4 mette la sedia di Rosa
    ombra: 'rgba(8, 5, 3, 0.55)',
    piatti: Object.freeze([-26, -12]), // dal bordo destro del banco, come T4
  }),
});

const statoI2 = { porta: null, tonino: null, banchetto: false };

/** Stato del portone: 'aperta' | 'socchiusa' | 'chiusa' (vedi REGOLE). */
function statoPortaI2(p) {
  let s = null;
  try { s = typeof statoB8 === 'function' ? statoB8() : null; } catch (_) { s = null; }
  if ((p && p.aperta) || (s && s.portaAperta)) return 'aperta';
  let pronta = false;
  try {
    if (typeof portaProntaH4 === 'function') pronta = portaProntaH4();
    else if (s && typeof sigilliB8 === 'function') pronta = sigilliB8(s) >= 3 && (s.finaleVisto || !SEGRETO_B8.serveFinaleVero);
  } catch (_) { pronta = false; }
  return pronta ? 'socchiusa' : 'chiusa';
}

/**
 * Il portone della bottega con l'immagine dell'autore, poi i segni di b8 sopra. Gancio di T4.
 * @param {{x:number, aperta:boolean}} p presenza «porta» di T4
 * @returns {boolean} false se l'immagine non c'è (T4 disegna la porta a codice)
 */
function portaImmagineI2(p) {
  if (typeof timbraB9 !== 'function') return false;
  const C = CONFIG_I2.porta;
  const y = (typeof SEGRETO_B8 === 'object' && SEGRETO_B8.porta) ? SEGRETO_B8.porta.y : 62;
  const stato = statoPortaI2(p);
  if (!timbraB9(`porta-bottega-${stato}`, 0, 0, p.x, y + C.soglia, OPZ_FILO_B9)) return false;
  statoI2.porta = stato;
  if (stato === 'chiusa') { // la spranga dei sigilli
    const S = C.spranga;
    ctx.fillStyle = S.nero; ctx.fillRect(p.x - S.dx - 1, y + S.dy - 1, S.dx * 2 + 2, S.alt + 2);
    ctx.fillStyle = S.colore; ctx.fillRect(p.x - S.dx, y + S.dy, S.dx * 2, S.alt);
    ctx.fillStyle = S.luce; ctx.fillRect(p.x - S.dx, y + S.dy, S.dx * 2, 1);
  }
  const T = window.__teatro;
  if (T && typeof T.portaBottegaB8 === 'function') {
    if (stato === 'aperta') {
      const V = C.vano;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.rect(p.x - V.dx, y - V.su, V.dx * 2, V.su + V.giu);
      ctx.clip('evenodd');
      T.portaBottegaB8(p);
      ctx.restore();
    } else T.portaBottegaB8(p);
  }
  return true;
}

/** Tonino parla adesso? (finestra di T4 aperta e lui vicino a Ferruccio) */
function toninoParlaI2(x, y) {
  try {
    const q = typeof t4qaB8 === 'function' ? t4qaB8() : null;
    return Boolean(q && q.dialogo) && Math.hypot(player.x - x, player.y - y) < CONFIG_I2.tonino.raggioParla;
  } catch (_) { return false; }
}

/** Posa di Tonino: 1 = con la lanterna, 0 = indica (vedi REGOLE). */
function posaToninoI2(x, y) {
  let viva = false;
  try { viva = typeof notteVivaH4 === 'function' && notteVivaH4(); } catch (_) { viva = false; }
  const notte = typeof getNumeroNotte === 'function' ? getNumeroNotte() : 1;
  return (viva || notte >= CONFIG_I2.tonino.lanternaDaNotte || toninoParlaI2(x, y)) ? 1 : 0;
}

/**
 * Tonino con l'immagine dell'autore. Si chiama dall'avvolgimento di T.disegnaToninoC1.
 * @returns {boolean} false se l'immagine non c'è
 */
function disegnaToninoI2(x, y, t) {
  if (typeof timbraB9 !== 'function' || !scenaB9('npc-tonino')) return false;
  const C = CONFIG_I2.tonino, O = C.ombra;
  const posa = posaToninoI2(x, y);
  ctx.fillStyle = O.colore;
  ctx.beginPath(); ctx.ellipse(x, y + O.dy, O.rx, O.ry, 0, 0, TAU); ctx.fill();
  if (!timbraB9('npc-tonino', 0, posa, x, y + C.piedi, OPZ_FILO_B9)) return false;
  statoI2.tonino = posa;
  void t;
  return true;
}

/**
 * Il banchetto di Tonino sul rettangolo del banco di T4. Gancio di T4 (disegnaBanchetto).
 * @param {{x1:number,x2:number,y1:number,y2:number}} r rettangolo del banco
 * @param {number} t tick
 * @param {boolean} duePiatti ricordo restituito: due piatti, uno resta vuoto
 * @returns {boolean} false se l'immagine non c'è
 */
function banchettoImmagineI2(r, t, duePiatti) {
  if (typeof timbraB9 !== 'function' || !scenaB9('banchetto-tonino')) return false;
  const C = CONFIG_I2.banchetto;
  const cx = (r.x1 + r.x2) / 2 + C.dx, piede = r.y2 + C.sotto;
  ctx.fillStyle = C.ombra; ctx.fillRect(r.x1 + 2, r.y2, r.x2 - r.x1, 5);
  if (!timbraB9('banchetto-tonino', 0, 0, cx, piede, { filo: true, specchio: true })) return false;
  statoI2.banchetto = true;
  if (duePiatti) {
    for (const d of C.piatti) {
      const dx = r.x2 + d;
      ctx.fillStyle = '#0a0604'; ctx.fillRect(dx - 5, r.y1 + 1, 10, 4);
      ctx.fillStyle = '#f3dfc1'; ctx.fillRect(dx - 4, r.y1 + 2, 8, 2);
    }
  }
  void t;
  return true;
}

if (window.__teatro) {
  const T = window.__teatro;
  T.portaImmagineI2 = (p) => { try { return portaImmagineI2(p); } catch (err) { guastoB9('porta i2', err); return false; } };
  T.banchettoImmagineI2 = (r, t, d) => { try { return banchettoImmagineI2(r, t, d); } catch (err) { guastoB9('banchetto i2', err); return false; } };
  const toninoBase = T.disegnaToninoC1;
  T.disegnaToninoC1 = function disegnaToninoI2Avvolto(x, y, t) {
    if (typeof toninoBase === 'function' && toninoBase.call(this, x, y, t)) return true;
    try { return disegnaToninoI2(x, y, t); } catch (err) { guastoB9('tonino i2', err); return false; }
  };
  if (T.interni) T.interni.piazzaI2 = { stato: () => ({ ...statoI2 }), statoPorta: statoPortaI2, posaTonino: posaToninoI2, CONFIG_I2 };
}
