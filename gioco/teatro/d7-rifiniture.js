/*
 * teatro/d7-rifiniture.js — (squadra d7) rifiniture rimaste indietro. Solo ciò che è nuovo:
 *  - stacco di Donna Luciana dal pavimento a scacchi della Reggia (occhio di bue, contorno color lanterna,
 *    pavimento dell'arena smorzato, alone dei suoi proiettili): solo resa, il comportamento non cambia;
 *  - il Ragno della Seta (nemico nuovo dei Vasi di Capodimonte, raro a San Leucio).
 * Le correzioni piccole stanno nei file che le contenevano (HUD in 60-resa.js, scritte in b3/c2...).
 * Script classico, caricato dopo teatro/c2-tocco.js. QA: tools/qa-teatro-rifiniture.js.
 */
'use strict';

// ===========================================================================
// DONNA LUCIANA SUGLI SCACCHI (solo resa)
// ===========================================================================
/** Numeri della resa dell'arena di Donna Luciana. */
const LUCIANA_D7 = Object.freeze({
  bossId: 'donna-luciana',
  pavimento: Object.freeze({ x: 68, y: 70, w: 504, h: 234, velo: 'rgba(12, 7, 5, 0.46)' }), // scacchi smorzati
  occhioDiBue: Object.freeze({ rx: 46, ry: 17, dy: 8, centro: 'rgba(255, 214, 140, 0.55)', bordo: 'rgba(255, 190, 90, 0)' }),
  contorno: Object.freeze({ colore: 'rgba(255, 196, 92, 0.9)', raggio: 1.2 }),
  proiettile: Object.freeze({ r: 5.5, fondo: 'rgba(10, 5, 3, 0.85)', anello: '#ffcf6b', spessore: 1.4 }),
});

/** La stanza in cui si gioca (oggetto), o null. */
function stanzaAttualeD7() {
  const s = statoRun.stanzaCorrente;
  if (s && typeof s === 'object') return s;
  return statoRun.mappa?.stanze?.find((x) => x.id === s) || null;
}

/** Donna Luciana viva nella stanza attuale, o null. */
function lucianaInScenaD7() {
  if (statoRun.fase !== 'in_gioco') return null;
  const st = stanzaAttualeD7();
  return st?.nemici?.find((n) => n.boss && n.hp > 0 && n.bossId === LUCIANA_D7.bossId) || null;
}

/** Disegna il velo scuro sugli scacchi dell'arena di Donna Luciana (dopo le macchie, prima delle figure). */
function disegnaArenaLucianaD7() {
  const b = lucianaInScenaD7();
  if (!b) return;
  const P = LUCIANA_D7.pavimento;
  ctx.save();
  ctx.fillStyle = P.velo;
  ctx.fillRect(P.x, P.y, P.w, P.h);
  ctx.restore();
}

const disegnaMacchieBaseD7 = disegnaMacchie;
disegnaMacchie = function disegnaMacchieD7(...a) {
  const r = disegnaMacchieBaseD7.apply(this, a);
  try { disegnaArenaLucianaD7(); } catch (err) { console.error('[d7] arena', err); }
  return r;
};

let disegniLucianaD7 = 0; // sonda QA: quante volte il contorno è stato applicato
const disegnaBossPittoricoBaseD7 = disegnaBossPittorico;
disegnaBossPittorico = function disegnaBossPittoricoD7(...a) {
  const b = a[0] && typeof a[0].save === 'function' ? a[1] : a[0];
  if (!b || b.bossId !== LUCIANA_D7.bossId) return disegnaBossPittoricoBaseD7.apply(this, a);
  const O = LUCIANA_D7.occhioDiBue, C = LUCIANA_D7.contorno;
  try { // occhio di bue ai suoi piedi (sopra tappeto e arredi, sotto la sagoma)
    ctx.save();
    const yb = b.y + O.dy;
    const g = ctx.createRadialGradient(b.x, yb, 2, b.x, yb, O.rx);
    g.addColorStop(0, O.centro);
    g.addColorStop(1, O.bordo);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(b.x, yb, O.rx, O.ry, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  } catch (err) { console.error('[d7] occhio di bue', err); }
  ctx.save();
  ctx.filter = `drop-shadow(0 0 ${C.raggio}px ${C.colore}) drop-shadow(0 0 ${C.raggio}px ${C.colore})`; // contorno di lanterna
  disegniLucianaD7++;
  try { return disegnaBossPittoricoBaseD7.apply(this, a); } finally { ctx.restore(); }
};

/**
 * Alone scuro con anello di lanterna sotto un proiettile nemico, solo nell'arena di Donna Luciana
 * (aggancio di una riga nel ciclo dei proiettili di 60-resa.js).
 * @param {{x:number,y:number}} pr proiettile
 */
function aloneProiettileD7(pr) {
  if (!lucianaInScenaD7()) return;
  const A = LUCIANA_D7.proiettile;
  ctx.save();
  ctx.fillStyle = A.fondo;
  ctx.strokeStyle = A.anello;
  ctx.lineWidth = A.spessore;
  ctx.beginPath();
  ctx.arc(pr.x, pr.y, A.r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

Object.assign(window.__teatro.interni, { rifinitureD7: { LUCIANA_D7, lucianaInScenaD7, disegniLuciana: () => disegniLucianaD7 } });
