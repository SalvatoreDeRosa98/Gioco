/*
 * avventura/10-disegno.js — La scena dell'avventura in stile teatro d'ombre: fondali a codice (gli elementi del
 * contratto, LEGGIMI «Elementi del fondale»), sagome, figure dai fogli del Teatro, luci, polvere, fili d'oro, effetti.
 * Il fondale si dipinge UNA volta su una tela fuori schermo (per quadro e per scala); per fotogramma si disegnano
 * solo luci, figure ed effetti. Niente ctx.filter né shadowBlur.
 * Immagini: solo quelle elencate in 05-immagini.js (AV.immagini); il resto si disegna a codice.
 *
 * Misure degli elementi (coordinate logiche 640×360):
 *  - con w e h (porta, finestra, arco, siepe, telaio, scala, tenda, muro, immagine): rettangolo con (x, y) in alto a sinistra;
 *  - con h ma senza w (colonna, lampione, albero, statua): x = centro, y = base (dove poggia);
 *  - fontana e banco {x, y, w}: x = sinistra, y = base; palazzo {x, w, h} e case poggiano sul suolo (y del suolo, 250 se manca);
 *  - luce {x, y, r}: centro e raggio. forma {punti}: coordinate assolute.
 */
(function (AV) {
  'use strict';
  const W = 640, H = 360;
  const C = {
    ombra: '#120b08', ombra2: '#1d130d', ombra3: '#2a1c12', filo: '#d9a456', luna: '#efe2bd', calda: '#ffcf7a',
    filoAlfa: 0.55, polvere: 46, suoloY: 250,
  };
  const D = AV.D = { W, H, C };

  // ------------------------------------------------------------------ immagini (solo quelle che esistono)
  const cache = new Map();
  /** L'immagine pronta di un fondo ('fondi') o di un foglio ('fogli'), o null (mancante o non ancora caricata). */
  D.img = function (genere, nome) {
    const el = AV.immagini && AV.immagini[genere] && AV.immagini[genere][nome];
    if (!el || typeof Image === 'undefined') return null;
    const k = genere + ':' + nome;
    let r = cache.get(k);
    if (!r) {
      r = { img: new Image(), pronta: false, info: el };
      r.img.onload = () => { r.pronta = true; D.sporca(); };
      r.img.onerror = () => AV.errore(`immagine «${el.src}» non si carica`);
      r.img.src = el.src;
      cache.set(k, r);
    }
    return r.pronta ? r : null;
  };

  /**
   * Fogli a griglia del Teatro (più righe di pose). Misure e righe arrivano dall'elenco delle immagini
   * (`griglia` in 05-immagini.js, letta da assets/sprite_teatro/layout.json); qui solo i ritocchi a mano:
   * cx = dove sta l'asse della figura nella cella, guardaDestra = da che parte guarda il disegno.
   */
  D.GRIGLIE = {
    ferruccio: { cx: 0.46, guardaDestra: true },
    taddeo: { cx: 0.60, guardaDestra: true },
    'donna-luciana': { cx: 0.50, guardaDestra: false },
  };
  /** La griglia di un foglio (o null se è a una riga sola): righe = [[nome, fotogrammi], …]. */
  D.griglia = function (nome, foglio) {
    const g = foglio && foglio.info && foglio.info.griglia; if (!g) return null;
    return Object.assign({ cx: 0.5, guardaDestra: true }, g, D.GRIGLIE[nome]);
  };
  /** Fogli a una riga: dove sta la figura nella cella (frazioni; se manca, 0.04 / 0.98) e quante celle ha. */
  D.RIGHE = { agnese_telaio: { top: 0.30, bot: 0.98 }, gb_guanto: { top: 0.02, bot: 0.98, celle: 5 } };

  // ------------------------------------------------------------------ utilità
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function caso(seme) { let s = seme >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  D.caso = caso; D.hash = hash;
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  function riempi(ctx, colore, bordo) {
    ctx.fillStyle = colore || C.ombra; ctx.fill();
    if (bordo !== false) { ctx.strokeStyle = bordo || C.filo; ctx.globalAlpha *= C.filoAlfa; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha /= C.filoAlfa; }
  }
  function rett(ctx, x, y, w, h) { ctx.beginPath(); ctx.rect(x, y, w, h); }
  D.rr = function (ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  /** Un alone caldo pre-dipinto (per colore e raggio), da posare con 'lighter'. */
  const aloni = new Map();
  D.alone = function (colore, r) {
    const k = colore + ':' + Math.round(r);
    let c = aloni.get(k);
    if (!c && typeof document !== 'undefined') {
      c = document.createElement('canvas'); c.width = c.height = Math.max(4, Math.round(r * 2));
      const g = c.getContext('2d'); const gr = g.createRadialGradient(r, r, 0, r, r, r);
      gr.addColorStop(0, colore); gr.addColorStop(0.35, colore + '66'); gr.addColorStop(1, colore + '00');
      g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); aloni.set(k, c);
    }
    return c;
  };

  // ------------------------------------------------------------------ elementi del fondale
  const CIELI = {
    notte: ['#070b1a', '#141a33', '#2a2340'], alba: ['#1a1f3d', '#5a3f5c', '#c98a5a'],
    velo: ['#161c22', '#2b343c', '#46525c'], interno: ['#0d0806', '#1c120c', '#2e1d12'],
  };
  const SUOLI = { selciato: '#2a1f18', scacchi: '#2b2420', assi: '#2e1e12', erba: '#17200f', sabbia: '#3a2c1c', tufo: '#3b301e', marmo: '#3a3632' };
  const MURI = { tufo: '#3b301e', pietra: '#2c2a28', mattoni: '#3a1f16', scuro: '#1a120c', marmo: '#3a3632', calce: '#4a4236', legno: '#2e1e12' };

  const E = {};
  E.cielo = (ctx, o, X) => {
    const t = CIELI[o.tono] || CIELI.notte;
    const g = ctx.createLinearGradient(0, 0, 0, X.suoloY); g.addColorStop(0, t[0]); g.addColorStop(0.6, t[1]); g.addColorStop(1, t[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (o.tono === 'interno') return;
    if (o.stelle !== false) {
      const r = X.caso; ctx.fillStyle = '#f3e6c4';
      for (let i = 0; i < 70; i++) { ctx.globalAlpha = 0.25 + r() * 0.6; const s = r() < 0.1 ? 1.6 : 0.9; ctx.fillRect(r() * W, r() * X.suoloY * 0.7, s, s); }
      ctx.globalAlpha = 1;
    }
    if (o.luna) {
      const lx = num(o.x, 520), ly = num(o.y, 58), lr = num(o.r, 20);
      const g2 = ctx.createRadialGradient(lx, ly, lr * 0.8, lx, ly, lr * 4); g2.addColorStop(0, 'rgba(239,226,189,0.35)'); g2.addColorStop(1, 'rgba(239,226,189,0)');
      ctx.fillStyle = g2; ctx.fillRect(lx - lr * 4, ly - lr * 4, lr * 8, lr * 8);
      ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fillStyle = C.luna; ctx.fill();
      ctx.fillStyle = 'rgba(160,140,110,0.35)';
      for (const [dx, dy, rr] of [[-6, -4, 5], [5, 6, 4], [7, -7, 2.5]]) { ctx.beginPath(); ctx.arc(lx + dx, ly + dy, rr, 0, Math.PI * 2); ctx.fill(); }
    }
  };
  E.quinte = (ctx, o) => {
    const col = o.colore || '#3a1418';
    for (const lato of [0, 1]) {
      ctx.save(); if (lato) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(58, 0);
      for (let y = 0; y <= 300; y += 30) ctx.quadraticCurveTo(46 + (y % 60 ? 8 : -2), y + 15, 42 + (y / 300) * 10, y + 30);
      ctx.lineTo(0, 330); ctx.closePath(); riempi(ctx, col);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      for (const fx of [14, 28, 40]) { ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx - 3, 330); ctx.stroke(); }
      ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 20);
    for (let x = W; x > 0; x -= 40) ctx.quadraticCurveTo(x - 20, 38, x - 40, 20);
    ctx.closePath(); riempi(ctx, col);
  };
  E.suolo = (ctx, o, X) => {
    const y = num(o.y, X.suoloY), tipo = o.tipo || 'selciato', base = SUOLI[tipo] || SUOLI.selciato;
    const g = ctx.createLinearGradient(0, y, 0, H); g.addColorStop(0, base); g.addColorStop(1, '#0a0705');
    ctx.fillStyle = g; ctx.fillRect(0, y, W, H - y);
    ctx.strokeStyle = 'rgba(217,164,86,0.16)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke();
    const r = X.caso;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    if (tipo === 'selciato' || tipo === 'tufo') {
      for (let yy = y + 6, fila = 0; yy < 300; fila++) {
        const passo = 10 + fila * 3; ctx.beginPath();
        for (let x = -((fila * 7) % passo); x < W; x += passo) { ctx.moveTo(x, yy); ctx.arc(x + passo / 2, yy, passo / 2, Math.PI, 0); }
        ctx.stroke(); yy += 5 + fila * 2;
      }
    } else if (tipo === 'scacchi' || tipo === 'marmo') {
      for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 22, y); ctx.lineTo(W / 2 + i * 70, H); ctx.stroke(); }
      for (let k = 0, yy = y; yy < H; k++) { yy += 6 + k * 4; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
      if (tipo === 'scacchi') {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let k = 0, yy = y; yy < H; k++) { const h = 6 + k * 4; for (let i = -14; i < 14; i++) if ((i + k) % 2 === 0) { const xa = W / 2 + i * (22 + k * 6), xb = W / 2 + (i + 1) * (22 + k * 6); ctx.fillRect(xa, yy, xb - xa, h); } yy += h; }
      } else {
        ctx.strokeStyle = 'rgba(217,200,170,0.1)';
        for (let i = 0; i < 14; i++) { ctx.beginPath(); let x = r() * W, yy = y + r() * (H - y); ctx.moveTo(x, yy); for (let j = 0; j < 4; j++) { x += 10 + r() * 20; yy += (r() - 0.5) * 8; ctx.lineTo(x, yy); } ctx.stroke(); }
      }
    } else if (tipo === 'assi') {
      for (let yy = y + 8, k = 0; yy < H; k++) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); for (let x = (k * 53) % 90; x < W; x += 90 + k * 10) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy - 6 - k); ctx.stroke(); } yy += 8 + k * 3; }
    } else if (tipo === 'erba') {
      ctx.strokeStyle = 'rgba(80,110,50,0.35)';
      for (let i = 0; i < 260; i++) { const x = r() * W, yy = y + 4 + r() * (300 - y); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + (r() - 0.5) * 4, yy - 3 - r() * 4); ctx.stroke(); }
    } else if (tipo === 'sabbia') {
      ctx.fillStyle = 'rgba(217,164,86,0.12)';
      for (let i = 0; i < 300; i++) ctx.fillRect(r() * W, y + r() * (H - y), 1, 1);
    }
  };
  E.case = (ctx, o, X) => {
    const n = Math.max(1, num(o.n, 6)), alto = num(o.alto, 110), fin = num(o.finestre, 2), y = X.suoloY, r = X.caso;
    const lw = W / n;
    for (let i = 0; i < n; i++) {
      const x = i * lw - 4 + r() * 6, w = lw + 6, h = alto * (0.75 + r() * 0.45), tetto = r();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h);
      if (tetto < 0.4) { ctx.lineTo(x + w / 2, y - h - 18); ctx.lineTo(x + w, y - h); } else if (tetto < 0.7) { ctx.lineTo(x + w, y - h); } else { ctx.lineTo(x + w * 0.2, y - h); ctx.lineTo(x + w * 0.2, y - h - 6); ctx.lineTo(x + w * 0.8, y - h - 6); ctx.lineTo(x + w * 0.8, y - h); ctx.lineTo(x + w, y - h); }
      ctx.lineTo(x + w, y); ctx.closePath(); riempi(ctx, i % 2 ? C.ombra : C.ombra2);
      if (r() < 0.5) { rett(ctx, x + w * 0.7, y - h - 22, 6, 14); riempi(ctx, C.ombra); }
      const righe = Math.max(1, Math.floor(h / 40));
      for (let rr = 0; rr < righe; rr++) for (let k = 0; k < fin; k++) {
        const fx = x + (w / (fin + 1)) * (k + 1) - 5, fy = y - h + 16 + rr * 36;
        if (fy > y - 26) continue;
        const accesa = r() < 0.28;
        ctx.fillStyle = accesa ? '#c98a3e' : '#0a0604'; ctx.fillRect(fx, fy, 10, 15);
        if (accesa) { X.luci.push({ x: fx + 5, y: fy + 7, r: 16, colore: '#ffb35c', forza: 0.35 }); ctx.fillStyle = C.ombra; ctx.fillRect(fx + 4.5, fy, 1, 15); ctx.fillRect(fx, fy + 6, 10, 1); }
      }
    }
  };
  E.palazzo = (ctx, o, X) => {
    const x = num(o.x, 160), w = num(o.w, 320), h = num(o.h, 150), y = X.suoloY, archi = num(o.archi, 5), fin = num(o.finestre, 5);
    rett(ctx, x, y - h, w, h); riempi(ctx, C.ombra2);
    rett(ctx, x - 6, y - h - 8, w + 12, 8); riempi(ctx, C.ombra);
    rett(ctx, x - 3, y - h * 0.42, w + 6, 4); riempi(ctx, C.ombra);
    for (let i = 0; i < archi; i++) {
      const aw = w / archi, ax = x + i * aw + aw * 0.18, ww = aw * 0.64, ah = Math.min(h * 0.36, ww * 1.5);
      ctx.beginPath(); ctx.moveTo(ax, y); ctx.lineTo(ax, y - ah + ww / 2); ctx.arc(ax + ww / 2, y - ah + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(ax + ww, y); ctx.closePath();
      ctx.fillStyle = '#080503'; ctx.fill();
    }
    for (const fy of [y - h * 0.8, y - h * 0.6]) for (let i = 0; i < fin; i++) {
      const fw = Math.min(14, w / fin * 0.4), fx = x + (w / fin) * (i + 0.5) - fw / 2;
      const accesa = X.caso() < 0.25; ctx.fillStyle = accesa ? '#c98a3e' : '#0a0604'; ctx.fillRect(fx, fy, fw, fw * 1.6);
      if (accesa) X.luci.push({ x: fx + fw / 2, y: fy + fw * 0.8, r: 18, colore: '#ffb35c', forza: 0.3 });
    }
  };
  E.arco = (ctx, o) => {
    const x = num(o.x, 0), y = num(o.y, 140), w = num(o.w, 80), h = num(o.h, 110), sp = Math.max(6, w * 0.16);
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - sp, y + h);
    ctx.lineTo(x + w - sp, y + (w - 2 * sp) / 2 + sp); ctx.arc(x + w / 2, y + (w - 2 * sp) / 2 + sp, (w - 2 * sp) / 2, 0, Math.PI, true);
    ctx.lineTo(x + sp, y + h); ctx.closePath(); riempi(ctx, C.ombra);
  };
  E.colonna = (ctx, o) => {
    const x = num(o.x, 100), y = num(o.y, 250), h = num(o.h, 120), w = Math.max(8, h / 9);
    rett(ctx, x - w / 2, y - h, w, h); riempi(ctx, C.ombra);
    rett(ctx, x - w * 0.8, y - h - 6, w * 1.6, 6); riempi(ctx, C.ombra);
    rett(ctx, x - w * 0.75, y - 6, w * 1.5, 6); riempi(ctx, C.ombra);
    ctx.strokeStyle = 'rgba(217,164,86,0.12)'; for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + (w / 3) * k, y - h + 2); ctx.lineTo(x - w / 2 + (w / 3) * k, y - 8); ctx.stroke(); }
  };
  function porta(ctx, x, y, w, h, stato, X) {
    ctx.beginPath(); ctx.moveTo(x - 3, y + h); ctx.lineTo(x - 3, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2 + 3, Math.PI, 0); ctx.lineTo(x + w + 3, y + h); ctx.closePath(); riempi(ctx, C.ombra);
    if (stato === 'aperta' || stato === 'socchiusa') {
      ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath();
      ctx.fillStyle = '#e0a24e'; ctx.fill();
      if (X) X.luci.push({ x: x + w / 2, y: y + h * 0.6, r: Math.max(w, h) * 0.8, colore: '#ffb35c', forza: stato === 'aperta' ? 0.5 : 0.3 });
      const anta = stato === 'aperta' ? w * 0.2 : w * 0.78;
      rett(ctx, x, y + w / 2, anta, h - w / 2); ctx.fillStyle = C.ombra3; ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(217,164,86,0.25)'; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 4); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
      ctx.fillStyle = C.filo; ctx.fillRect(x + w * 0.62, y + h * 0.58, 2, 2);
    }
  }
  E.porta = (ctx, o, X) => porta(ctx, num(o.x, 300), num(o.y, 180), num(o.w, 36), num(o.h, 64), o.stato, X);
  function finestra(ctx, x, y, w, h, accesa, X) {
    rett(ctx, x - 3, y - 3, w + 6, h + 6); riempi(ctx, C.ombra);
    ctx.fillStyle = accesa ? '#d39142' : '#0a0705'; ctx.fillRect(x, y, w, h);
    if (accesa && X) X.luci.push({ x: x + w / 2, y: y + h / 2, r: Math.max(w, h), colore: '#ffb35c', forza: 0.4 });
    ctx.fillStyle = C.ombra; ctx.fillRect(x + w / 2 - 1, y, 2, h); ctx.fillRect(x, y + h / 2 - 1, w, 2);
    rett(ctx, x - 5, y + h + 2, w + 10, 3); riempi(ctx, C.ombra);
  }
  E.finestra = (ctx, o, X) => finestra(ctx, num(o.x, 300), num(o.y, 120), num(o.w, 24), num(o.h, 34), o.accesa, X);
  function lampione(ctx, x, y, h, acceso, X) {
    rett(ctx, x - 2, y - h, 4, h); riempi(ctx, C.ombra);
    rett(ctx, x - 6, y - 8, 12, 8); riempi(ctx, C.ombra);
    ctx.beginPath(); ctx.moveTo(x, y - h); ctx.quadraticCurveTo(x + 12, y - h - 4, x + 14, y - h + 6); ctx.strokeStyle = C.ombra; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
    const lx = x + 14, ly = y - h + 6;
    ctx.beginPath(); ctx.moveTo(lx - 6, ly + 4); ctx.lineTo(lx + 6, ly + 4); ctx.lineTo(lx + 4, ly + 16); ctx.lineTo(lx - 4, ly + 16); ctx.closePath();
    ctx.fillStyle = acceso ? '#ffcf7a' : '#2a2018'; ctx.fill(); ctx.strokeStyle = C.ombra; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx - 7, ly + 4); ctx.lineTo(lx, ly - 2); ctx.lineTo(lx + 7, ly + 4); ctx.closePath(); riempi(ctx, C.ombra);
    if (acceso && X) X.luci.push({ x: lx, y: ly + 10, r: 70, colore: '#ffb35c', forza: 0.7, vivo: true });
  }
  E.lampione = (ctx, o, X) => lampione(ctx, num(o.x, 300), num(o.y, X.suoloY), num(o.h, 110), o.acceso !== false, X);
  E.albero = (ctx, o, X) => {
    const x = num(o.x, 300), y = num(o.y, X.suoloY), h = num(o.h, 120), tipo = o.tipo || 'leccio', r = caso(hash('albero' + x + y));
    const tronco = (ww, hh, piega) => { ctx.beginPath(); ctx.moveTo(x - ww, y); ctx.quadraticCurveTo(x - ww + piega, y - hh / 2, x - ww * 0.5 + piega, y - hh); ctx.lineTo(x + ww * 0.5 + piega, y - hh); ctx.quadraticCurveTo(x + ww + piega, y - hh / 2, x + ww, y); ctx.closePath(); riempi(ctx, C.ombra); };
    if (tipo === 'pino') {
      tronco(h * 0.035, h * 0.8, h * 0.08);
      ctx.beginPath(); const cx = x + h * 0.08, cy = y - h * 0.82;
      ctx.moveTo(cx - h * 0.42, cy + 6); for (let i = 0; i <= 8; i++) { const a = i / 8; ctx.quadraticCurveTo(cx - h * 0.42 + h * 0.84 * (a - 0.06), cy - h * 0.16 - r() * 10, cx - h * 0.42 + h * 0.84 * a, cy - h * 0.1); }
      ctx.quadraticCurveTo(cx + h * 0.46, cy + 4, cx + h * 0.3, cy + 10); ctx.lineTo(cx - h * 0.3, cy + 10); ctx.closePath(); riempi(ctx, C.ombra);
    } else if (tipo === 'palma') {
      tronco(h * 0.03, h * 0.86, -h * 0.1);
      const cx = x - h * 0.1, cy = y - h * 0.86;
      for (let i = 0; i < 9; i++) { const a = -Math.PI + (i / 8) * Math.PI + (r() - 0.5) * 0.2, L = h * (0.32 + r() * 0.1); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(cx + Math.cos(a) * L * 0.6, cy + Math.sin(a) * L * 0.6 - 10, cx + Math.cos(a) * L, cy + Math.sin(a) * L * 0.5 + 12); ctx.quadraticCurveTo(cx + Math.cos(a) * L * 0.5, cy + Math.sin(a) * L * 0.4 - 2, cx, cy + 3); riempi(ctx, C.ombra); }
    } else if (tipo === 'spoglio') {
      const ramo = (x0, y0, a, L, d) => { if (d > 5 || L < 3) return; const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineWidth = Math.max(0.8, 5 - d); ctx.strokeStyle = C.ombra; ctx.stroke(); ramo(x1, y1, a - 0.35 - r() * 0.3, L * 0.72, d + 1); ramo(x1, y1, a + 0.3 + r() * 0.3, L * 0.68, d + 1); };
      ramo(x, y, -Math.PI / 2, h * 0.34, 0); ctx.lineWidth = 1;
    } else {
      tronco(h * 0.05, h * 0.5, 0);
      ctx.beginPath(); const cy = y - h * 0.62;
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, rr = h * (0.26 + r() * 0.08); ctx.moveTo(x + Math.cos(a) * h * 0.18 + rr, cy + Math.sin(a) * h * 0.14); ctx.arc(x + Math.cos(a) * h * 0.18, cy + Math.sin(a) * h * 0.14, rr, 0, Math.PI * 2); }
      riempi(ctx, C.ombra, false);
    }
  };
  E.siepe = (ctx, o) => {
    const x = num(o.x, 0), y = num(o.y, 220), w = num(o.w, 160), h = num(o.h, 30);
    ctx.beginPath(); ctx.moveTo(x, y + h);
    const n = Math.max(2, Math.round(w / 18)); for (let i = 0; i < n; i++) ctx.quadraticCurveTo(x + (w / n) * (i + 0.5), y - 6 + (i % 2) * 4, x + (w / n) * (i + 1), y + 4);
    ctx.lineTo(x + w, y + h); ctx.closePath(); riempi(ctx, '#0f1409');
  };
  function fontana(ctx, x, y, w) {
    ctx.beginPath(); ctx.ellipse(x + w / 2, y - w * 0.1, w / 2, w * 0.12, 0, 0, Math.PI * 2); riempi(ctx, C.ombra);
    rett(ctx, x, y - w * 0.1, w, w * 0.1); riempi(ctx, C.ombra);
    rett(ctx, x + w * 0.45, y - w * 0.55, w * 0.1, w * 0.45); riempi(ctx, C.ombra);
    ctx.beginPath(); ctx.ellipse(x + w / 2, y - w * 0.55, w * 0.22, w * 0.05, 0, 0, Math.PI * 2); riempi(ctx, C.ombra);
    ctx.strokeStyle = 'rgba(190,210,230,0.45)';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + w / 2, y - w * 0.62); ctx.quadraticCurveTo(x + w / 2 + s * w * 0.3, y - w * 0.75, x + w / 2 + s * w * 0.36, y - w * 0.16); ctx.stroke(); }
  }
  E.fontana = (ctx, o, X) => fontana(ctx, num(o.x, 280), num(o.y, X.suoloY), num(o.w, 80));
  function statua(ctx, x, y, h) {
    const s = h / 70;
    rett(ctx, x - 12 * s, y - 16 * s, 24 * s, 16 * s); riempi(ctx, C.ombra);
    rett(ctx, x - 14 * s, y - 19 * s, 28 * s, 3 * s); riempi(ctx, C.ombra);
    ctx.beginPath(); ctx.moveTo(x - 7 * s, y - 19 * s); ctx.lineTo(x - 5 * s, y - 46 * s); ctx.lineTo(x - 12 * s, y - 40 * s); ctx.lineTo(x - 13 * s, y - 44 * s); ctx.lineTo(x - 4 * s, y - 54 * s);
    ctx.lineTo(x + 4 * s, y - 54 * s); ctx.lineTo(x + 9 * s, y - 64 * s); ctx.lineTo(x + 11 * s, y - 62 * s); ctx.lineTo(x + 6 * s, y - 48 * s); ctx.lineTo(x + 7 * s, y - 19 * s); ctx.closePath(); riempi(ctx, '#2a2622');
    ctx.beginPath(); ctx.arc(x, y - 58 * s, 4.5 * s, 0, Math.PI * 2); riempi(ctx, '#2a2622');
  }
  E.statua = (ctx, o, X) => statua(ctx, num(o.x, 300), num(o.y, X.suoloY), num(o.h, 70));
  E.banco = (ctx, o, X) => {
    const x = num(o.x, 200), y = num(o.y, X.suoloY), w = num(o.w, 70);
    rett(ctx, x, y - 26, w, 4); riempi(ctx, C.ombra); rett(ctx, x + 3, y - 22, 3, 22); riempi(ctx, C.ombra); rett(ctx, x + w - 6, y - 22, 3, 22); riempi(ctx, C.ombra);
    rett(ctx, x + 6, y - 22, w - 12, 12); riempi(ctx, C.ombra2);
    rett(ctx, x + 1, y - 58, 2, 32); riempi(ctx, C.ombra); rett(ctx, x + w - 3, y - 58, 2, 32); riempi(ctx, C.ombra);
    ctx.beginPath(); ctx.moveTo(x - 6, y - 50); ctx.lineTo(x + 4, y - 62); ctx.lineTo(x + w - 4, y - 62); ctx.lineTo(x + w + 6, y - 50);
    for (let i = 0; i < 5; i++) ctx.quadraticCurveTo(x + w + 6 - ((w + 12) / 5) * (i + 0.5), y - 44, x + w + 6 - ((w + 12) / 5) * (i + 1), y - 50);
    ctx.closePath(); riempi(ctx, '#3a1c14');
  };
  function telaio(ctx, x, y, w, h) {
    for (const px of [x, x + w - 4]) { rett(ctx, px, y, 4, h); riempi(ctx, C.ombra); }
    rett(ctx, x - 2, y, w + 4, 4); riempi(ctx, C.ombra); rett(ctx, x, y + h * 0.55, w, 4); riempi(ctx, C.ombra);
    ctx.strokeStyle = 'rgba(217,164,86,0.5)'; ctx.lineWidth = 0.6;
    for (let i = 1; i < w / 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * 4, y + 4); ctx.lineTo(x + i * 4, y + h * 0.55); ctx.stroke(); }
    ctx.lineWidth = 1; ctx.fillStyle = 'rgba(150,40,40,0.6)'; ctx.fillRect(x + 4, y + h * 0.3, w - 8, h * 0.25 - 1);
    rett(ctx, x + w * 0.3, y + h - 3, w * 0.4, 3); riempi(ctx, C.ombra);
  }
  E.telaio = (ctx, o) => telaio(ctx, num(o.x, 300), num(o.y, 180), num(o.w, 60), num(o.h, 60));
  E.scala = (ctx, o) => {
    const x = num(o.x, 300), y = num(o.y, 200), w = num(o.w, 80), h = num(o.h, 50), n = Math.max(3, Math.round(h / 8));
    ctx.beginPath(); ctx.moveTo(x, y + h);
    for (let i = 0; i < n; i++) { ctx.lineTo(x + (w / n) * i, y + h - (h / n) * (i + 1)); ctx.lineTo(x + (w / n) * (i + 1), y + h - (h / n) * (i + 1)); }
    ctx.lineTo(x + w, y + h); ctx.closePath(); riempi(ctx, C.ombra2);
  };
  E.tenda = (ctx, o) => {
    const x = num(o.x, 300), y = num(o.y, 40), w = num(o.w, 60), h = num(o.h, 120), col = o.colore || '#5a1820';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w * 0.85, y + h); ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.8, x + w * 0.15, y + h); ctx.closePath(); riempi(ctx, col);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + (w / 4) * i, y); ctx.quadraticCurveTo(x + (w / 4) * i + 3, y + h / 2, x + w * 0.5 + ((w / 4) * i - w / 2) * 0.6, y + h * 0.9); ctx.stroke(); }
    rett(ctx, x - 4, y - 4, w + 8, 5); riempi(ctx, C.ombra);
  };
  E.muro = (ctx, o) => {
    const x = num(o.x, 0), y = num(o.y, 200), w = num(o.w, 200), h = num(o.h, 50), col = MURI[o.tono] || (typeof o.tono === 'string' && o.tono[0] === '#' ? o.tono : MURI.scuro);
    rett(ctx, x, y, w, h); riempi(ctx, col);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    for (let yy = y + 10, k = 0; yy < y + h; yy += 10, k++) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); for (let xx = x + (k % 2) * 11; xx < x + w; xx += 22) { ctx.beginPath(); ctx.moveTo(xx, yy - 10); ctx.lineTo(xx, yy); ctx.stroke(); } }
  };
  E.luce = (ctx, o, X) => { X.luci.push({ x: num(o.x, 320), y: num(o.y, 150), r: num(o.r, 80), colore: o.colore || '#ffb35c', forza: 0.6, vivo: true }); };
  E.nebbia = (ctx, o, X) => {
    const a = num(o.alfa, 0.2);
    const g = ctx.createLinearGradient(0, X.suoloY - 80, 0, 300); g.addColorStop(0, 'rgba(150,160,175,0)'); g.addColorStop(1, `rgba(150,160,175,${a})`);
    ctx.fillStyle = g; ctx.fillRect(0, X.suoloY - 80, W, 300 - X.suoloY + 80);
    X.nebbia = a;
  };
  E.fili = (ctx, o, X) => { X.fili = Math.max(X.fili, num(o.n, 5)); };
  E.immagine = (ctx, o) => {
    const r = D.img('fondi', o.nome); if (!r) return;
    ctx.drawImage(r.img, num(o.x, 0), num(o.y, 0), num(o.w, r.info.w), num(o.h, r.info.h));
  };
  E.forma = (ctx, o) => {
    const p = Array.isArray(o.punti) ? o.punti : []; if (p.length < 2) return;
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (const q of p.slice(1)) ctx.lineTo(q[0], q[1]); ctx.closePath();
    riempi(ctx, o.colore || C.ombra, o.bordo || C.filo);
  };
  D.ELEMENTI = E;

  // ------------------------------------------------------------------ il fondale su tela fuori schermo
  const fondali = new Map(); let generazione = 0;
  /** Da rifare: un'immagine è arrivata o la scala è cambiata. */
  D.sporca = () => { generazione++; };

  /** Rende { tela, luci, fili, nebbia, suoloY } del quadro alla scala k (pixel per unità logica). */
  D.fondale = function (Q, k) {
    const chiave = Q.id + '@' + k;
    let f = fondali.get(chiave);
    if (f && f.gen === generazione) return f;
    const tela = document.createElement('canvas'); tela.width = Math.round(W * k); tela.height = Math.round(H * k);
    const ctx = tela.getContext('2d'); ctx.setTransform(k, 0, 0, k, 0, 0);
    const fd = Q.fondale || {};
    const disegno = Array.isArray(fd.disegno) ? fd.disegno : [];
    const suolo = disegno.find((e) => Array.isArray(e) && e[0] === 'suolo');
    const X = { suoloY: num(suolo && suolo[1] && suolo[1].y, C.suoloY), luci: [], fili: 0, nebbia: 0, caso: caso(hash(Q.id)) };
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const pittura = fd.immagine ? D.img('fondi', fd.immagine) : null;
    if (pittura) ctx.drawImage(pittura.img, 0, 0, W, H);
    else {
      if (!disegno.some((e) => Array.isArray(e) && e[0] === 'cielo')) E.cielo(ctx, { tono: (fd.luce && fd.luce.tono) || 'notte' }, X);
      for (const el of disegno) {
        if (!Array.isArray(el) || !E[el[0]]) { AV.errore(`quadro ${Q.id}: elemento del fondale «${el && el[0]}» sconosciuto`); continue; }
        try { ctx.save(); E[el[0]](ctx, el[1] || {}, X); } catch (e) { AV.errore(`quadro ${Q.id}: «${el[0]}» non si disegna (${e.message})`); } finally { ctx.restore(); }
      }
      // vignetta: il palcoscenico si chiude ai lati
      const g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.45, W * 0.62);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (fd.luce && fd.luce.tono === 'velo') X.velo = true;
    f = { tela, luci: X.luci, fili: X.fili, nebbia: X.nebbia, suoloY: X.suoloY, gen: generazione };
    fondali.set(chiave, f);
    if (fondali.size > 24) fondali.delete(fondali.keys().next().value);
    return f;
  };

  // ------------------------------------------------------------------ luci, polvere, fili (per fotogramma)
  const polvere = []; { const r = caso(7); for (let i = 0; i < C.polvere; i++) polvere.push({ x: r() * W, y: r() * 300, v: 2 + r() * 5, f: r() * 6.28, s: r() < 0.2 ? 1.4 : 0.8 }); }
  D.atmosfera = function (ctx, f, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const l of f.luci) {
      const tremo = l.vivo ? 0.85 + 0.1 * Math.sin(t * 7.1 + l.x) + 0.05 * Math.sin(t * 13.7 + l.y) : 0.95 + 0.05 * Math.sin(t * 1.3 + l.x);
      const a = D.alone(l.colore.length === 7 ? l.colore : '#ffb35c', l.r);
      if (!a) continue;
      ctx.globalAlpha = Math.min(1, l.forza * tremo); ctx.drawImage(a, l.x - l.r, l.y - l.r);
    }
    ctx.globalAlpha = 1;
    for (const p of polvere) {
      const y = (p.y - t * p.v + 3000) % 300, x = p.x + Math.sin(t * 0.4 + p.f) * 6;
      ctx.fillStyle = `rgba(217,164,86,${0.18 + 0.14 * Math.sin(t + p.f)})`; ctx.fillRect(x, y, p.s, p.s);
    }
    ctx.restore();
    if (f.fili) {
      ctx.save(); ctx.strokeStyle = 'rgba(217,164,86,0.35)'; ctx.lineWidth = 0.7;
      for (let i = 0; i < f.fili; i++) {
        const x0 = 60 + (i * 520) / Math.max(1, f.fili - 1), L = 70 + ((i * 37) % 60), dx = Math.sin(t * 0.6 + i * 1.7) * 4;
        ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo(x0 + dx * 0.5, L / 2, x0 + dx, L); ctx.stroke();
        ctx.fillStyle = 'rgba(255,207,122,0.6)'; ctx.fillRect(x0 + dx - 1, L - 1, 2, 2);
      }
      ctx.restore();
    }
  };

  // ------------------------------------------------------------------ sagome
  // Ognuna: [larghezza naturale, altezza naturale, disegno(ctx, opzioni)] con i piedi a (nw/2, nh).
  const SAG = {};
  const testa = (ctx, x, y, r) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); };
  SAG.uomo = [26, 60, (c, o) => { c.beginPath(); testa(c, 13, 9, 5.5); c.moveTo(6, 6); c.lineTo(20, 6); c.lineTo(17, 2); c.lineTo(9, 2); c.closePath();
    c.moveTo(7, 16); c.lineTo(19, 16); c.lineTo(22, 36); c.lineTo(18, 36); c.lineTo(17, 60); c.lineTo(14, 60); c.lineTo(13, 40); c.lineTo(12, 60); c.lineTo(9, 60); c.lineTo(8, 36); c.lineTo(4, 36); c.closePath(); riempi(c, o.colore); }];
  SAG.donna = [26, 58, (c, o) => { c.beginPath(); testa(c, 13, 9, 5); testa(c, 17, 5, 2.6); c.moveTo(9, 15); c.lineTo(17, 15); c.lineTo(20, 26); c.lineTo(24, 58); c.lineTo(2, 58); c.lineTo(6, 26); c.closePath(); riempi(c, o.colore);
    c.beginPath(); c.moveTo(6, 17); c.lineTo(20, 17); c.lineTo(16, 30); c.lineTo(10, 30); c.closePath(); c.fillStyle = 'rgba(217,164,86,0.18)'; c.fill(); }];
  SAG.bambina = [20, 44, (c, o) => { c.beginPath(); testa(c, 10, 8, 5); c.moveTo(14, 6); c.quadraticCurveTo(19, 12, 16, 20); c.lineTo(15, 12); c.moveTo(7, 14); c.lineTo(13, 14); c.lineTo(18, 32); c.lineTo(2, 32); c.closePath();
    c.rect(6, 32, 3, 12); c.rect(11, 32, 3, 12); riempi(c, o.colore); }];
  SAG.vecchio = [30, 58, (c, o) => { c.beginPath(); testa(c, 17, 12, 5); c.moveTo(10, 18); c.quadraticCurveTo(16, 14, 22, 20); c.lineTo(22, 36); c.lineTo(19, 36); c.lineTo(18, 58); c.lineTo(15, 58); c.lineTo(14, 40); c.lineTo(13, 58); c.lineTo(10, 58); c.lineTo(9, 34); c.closePath();
    c.moveTo(25, 30); c.lineTo(27, 30); c.lineTo(28, 58); c.lineTo(26, 58); c.closePath(); c.moveTo(20, 30); c.lineTo(26, 31); c.lineTo(25, 33); c.lineTo(20, 33); c.closePath(); riempi(c, o.colore); }];
  SAG.guardia = [30, 66, (c, o) => { c.beginPath(); c.rect(10, 0, 10, 10); c.moveTo(8, 10); c.lineTo(22, 10); c.lineTo(22, 12); c.lineTo(8, 12); testa(c, 15, 16, 5); c.moveTo(8, 22); c.lineTo(22, 22); c.lineTo(24, 42); c.lineTo(19, 42); c.lineTo(18, 66); c.lineTo(15, 66); c.lineTo(15, 46); c.lineTo(14, 66); c.lineTo(11, 66); c.lineTo(11, 42); c.lineTo(6, 42); c.closePath();
    c.rect(25, 6, 2, 50); c.moveTo(25, 6); c.lineTo(26, 0); c.lineTo(27, 6); riempi(c, o.colore); c.fillStyle = C.filo; c.fillRect(13, 2, 4, 2); }];
  SAG.gatto = [34, 26, (c, o) => { c.beginPath(); c.moveTo(6, 26); c.quadraticCurveTo(4, 10, 14, 10); c.lineTo(13, 3); c.lineTo(17, 7); c.lineTo(21, 3); c.lineTo(21, 11); c.quadraticCurveTo(26, 16, 22, 26); c.closePath();
    c.moveTo(22, 24); c.quadraticCurveTo(34, 26, 30, 12); c.lineTo(32, 12); c.quadraticCurveTo(36, 28, 22, 26); riempi(c, o.colore); c.fillStyle = '#e8c35a'; c.fillRect(14.5, 10, 1.6, 1.6); c.fillRect(18.5, 10, 1.6, 1.6); }];
  SAG.ombra = [30, 62, (c, o) => { const t = o.t || 0; c.beginPath(); c.moveTo(15, 0); c.quadraticCurveTo(28, 6, 26, 26); c.quadraticCurveTo(30, 44, 28, 62);
    for (let i = 0; i < 5; i++) c.lineTo(28 - i * 6 - 3, 54 + Math.sin(t * 3 + i) * 3), c.lineTo(28 - (i + 1) * 6, 62);
    c.quadraticCurveTo(0, 44, 4, 26); c.quadraticCurveTo(2, 6, 15, 0); c.globalAlpha *= 0.92; riempi(c, '#07040a', '#6a5a8a'); c.globalAlpha /= 0.92;
    c.fillStyle = '#9fd8ff'; c.fillRect(10, 12, 3, 2); c.fillRect(17, 12, 3, 2); }];
  SAG.anima = [24, 34, (c, o) => { const t = o.t || 0, col = o.colore || '#ffd98a'; const y = 12 + Math.sin(t * 2) * 2;
    const g = c.createRadialGradient(12, y, 1, 12, y, 12); g.addColorStop(0, '#fffbe8'); g.addColorStop(0.4, col); g.addColorStop(1, 'rgba(255,217,138,0)');
    c.fillStyle = g; c.beginPath(); c.arc(12, y, 12, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(8, y + 4); c.quadraticCurveTo(12 + Math.sin(t * 3) * 4, y + 16, 12, 34); c.quadraticCurveTo(14, y + 14, 16, y + 4); c.fillStyle = col + '88'; c.fill(); }];
  SAG.lampione = [24, 100, (c, o) => lampione(c, 8, 100, 92, o.posa !== 1, null)];
  SAG.porta = [36, 64, (c, o) => porta(c, 3, 2, 30, 62, o.posa === 1 ? 'aperta' : o.posa === 2 ? 'socchiusa' : 'chiusa', null)];
  SAG.finestra = [30, 40, (c, o) => finestra(c, 4, 4, 22, 30, o.posa === 1, null)];
  SAG.foglio = [24, 30, (c) => { c.beginPath(); c.moveTo(2, 4); c.lineTo(18, 2); c.lineTo(22, 6); c.lineTo(22, 28); c.lineTo(4, 30); c.closePath(); riempi(c, '#d8c7a0', C.ombra);
    c.strokeStyle = 'rgba(40,25,15,0.6)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(6, 9 + i * 4); c.lineTo(18, 8.5 + i * 4); c.stroke(); } }];
  SAG.libro = [30, 24, (c) => { c.beginPath(); c.moveTo(1, 4); c.lineTo(15, 7); c.lineTo(29, 4); c.lineTo(29, 22); c.lineTo(15, 24); c.lineTo(1, 22); c.closePath(); riempi(c, '#5a2a1a');
    c.beginPath(); c.moveTo(15, 7); c.lineTo(15, 24); c.strokeStyle = C.filo; c.stroke(); }];
  SAG.chiave = [30, 14, (c) => { c.beginPath(); c.arc(6, 7, 5.5, 0, Math.PI * 2); c.moveTo(8.5, 7); c.arc(6, 7, 2.5, 0, Math.PI * 2, true); c.rect(11, 6, 17, 3); c.rect(22, 9, 2, 4); c.rect(26, 9, 2, 3); riempi(c, '#8a6a3a', C.ombra); }];
  SAG.ferro = [28, 28, (c) => { c.beginPath(); c.arc(14, 14, 12, Math.PI * 0.85, Math.PI * 2.15); c.lineTo(22, 25); c.arc(14, 14, 7, Math.PI * 2.15, Math.PI * 0.85, true); c.closePath(); riempi(c, '#6a6a70', C.ombra);
    c.fillStyle = C.ombra; for (const a of [1.1, 1.5, 1.9, 2.3]) c.fillRect(14 + Math.cos(Math.PI * a) * 9.5 - 1, 14 + Math.sin(Math.PI * a) * 9.5 - 1, 2, 2); }];
  SAG.cassa = [40, 30, (c) => { c.beginPath(); c.rect(2, 10, 36, 20); c.moveTo(2, 10); c.quadraticCurveTo(20, -2, 38, 10); riempi(c, '#3a2414'); c.fillStyle = C.filo; c.fillRect(18, 14, 4, 5); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(10, 10, 2, 20); c.fillRect(28, 10, 2, 20); }];
  SAG.telaio = [60, 60, (c) => telaio(c, 2, 2, 56, 58)];
  SAG.statua = [40, 70, (c) => statua(c, 20, 70, 70)];
  SAG.campana = [36, 40, (c) => { c.beginPath(); c.rect(16, 0, 4, 5); c.moveTo(18, 4); c.quadraticCurveTo(6, 5, 7, 22); c.quadraticCurveTo(6, 32, 2, 34); c.lineTo(34, 34); c.quadraticCurveTo(30, 32, 29, 22); c.quadraticCurveTo(30, 5, 18, 4); riempi(c, '#5a4320');
    c.beginPath(); c.arc(18, 37, 3, 0, Math.PI * 2); riempi(c, C.ombra); }];
  SAG.fontana = [80, 50, (c) => fontana(c, 0, 50, 80)];
  // solo di ripiego, quando il foglio di Ferruccio non c'è: cappuccio a punta, maschera a becco, sciarpa
  SAG.ferruccio = [28, 62, (c, o) => { c.beginPath(); c.moveTo(10, 14); c.lineTo(15, 0); c.lineTo(20, 14); testa(c, 15, 16, 6); c.moveTo(20, 15); c.lineTo(27, 19); c.lineTo(20, 20);
    c.moveTo(8, 23); c.lineTo(22, 23); c.lineTo(23, 42); c.lineTo(19, 42); c.lineTo(18, 62); c.lineTo(15, 62); c.lineTo(15, 46); c.lineTo(14, 62); c.lineTo(11, 62); c.lineTo(11, 42); c.lineTo(7, 42); c.closePath(); riempi(c, '#e8d8b8', C.ombra);
    c.fillStyle = '#b32020'; c.fillRect(8, 22, 14, 3); c.beginPath(); c.moveTo(8, 23); c.lineTo(1, 28); c.lineTo(3, 24); c.fill(); c.fillStyle = '#6ee7ff'; c.fillRect(15, 15, 2.4, 2.4); }];
  D.SAGOME = SAG;

  /** Una sagoma nel riquadro (x, y, w, h), con i piedi in basso al centro. opz: { posa, colore, t, dir, alfa }. */
  D.sagoma = function (ctx, nome, x, y, w, h, opz) {
    const S = SAG[nome] || SAG.uomo; if (!SAG[nome]) AV.errore(`sagoma «${nome}» sconosciuta`);
    const o = opz || {}; const s = Math.min(w / S[0], h / S[1]);
    ctx.save(); ctx.translate(x + w / 2, y + h); if (o.dir === -1) ctx.scale(-1, 1); ctx.scale(s, s); ctx.translate(-S[0] / 2, -S[1]);
    ctx.lineWidth = 1 / s; if (o.alfa !== undefined) ctx.globalAlpha = o.alfa;
    try { S[2](ctx, o); } catch (e) { AV.errore(`sagoma «${nome}»: ${e.message}`); }
    ctx.restore();
  };

  /** L'ombra a terra sotto una figura. */
  D.ombraTerra = function (ctx, cx, piedi, r) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(cx, piedi, r, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  };

  /**
   * Una figura di personaggio (dal foglio se c'è, altrimenti la sua sagoma) con i piedi in (cx, piedi).
   * opz: { posa (cella o riga), cammina (bool), t (secondi), dir (1 | -1), alt (altezza a schermo), alfa }.
   */
  D.figura = function (ctx, P, cx, piedi, opz) {
    const o = opz || {}; const fig = (P && P.figura) || { sagoma: 'uomo' };
    const alt = o.alt || fig.alt || 60;
    D.ombraTerra(ctx, cx, piedi, alt * 0.22);
    // controluce: un alone tenue del colore del personaggio, perché le figure scure si stacchino dal fondale buio
    if (P && /^#[0-9a-f]{6}$/i.test(P.colore || '') && o.controluce !== false) {
      const n = parseInt(P.colore.slice(1), 16); const rgb = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
      const my = piedi - alt * 0.55; const g = ctx.createRadialGradient(cx, my, 2, cx, my, alt * 0.85);
      g.addColorStop(0, `rgba(${rgb},${0.22 * (o.alfa === undefined ? 1 : o.alfa)})`); g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g; ctx.fillRect(cx - alt, my - alt, alt * 2, alt * 2);
    }
    const foglio = fig.foglio ? D.img('fogli', fig.foglio) : null;
    const G = foglio && D.griglia(fig.foglio, foglio);
    const unaRiga = fig.foglio && D.RIGHE[fig.foglio];
    const celle = fig.celle || (unaRiga && unaRiga.celle) || 0;
    ctx.save(); if (o.alfa !== undefined) ctx.globalAlpha = o.alfa;
    if (foglio && G) {
      // riga: chi cammina usa «cammina» (o «muove»); altrimenti la posa è il numero di riga (0 = la prima, a riposo)
      let riga = Math.abs(Math.floor(o.posa || 0)) % G.righe.length;
      if (o.cammina) { const c = G.righe.findIndex((r) => r[0] === 'cammina' || r[0] === 'muove'); if (c >= 0) riga = c; }
      const [nomeRiga, n] = G.righe[riga];
      // una caduta non ricomincia: resta sull'ultimo fotogramma
      const fot = /^mort/.test(nomeRiga) ? n - 1 : Math.floor((o.t || 0) * (o.cammina ? 8 : 2)) % n;
      const s = alt / (G.ca * (G.bot - G.top));
      const dw = G.cl * s, dh = G.ca * s;
      ctx.translate(cx, piedi); const versoGiusto = (o.dir || 1) === 1 ? G.guardaDestra : !G.guardaDestra; if (!versoGiusto) ctx.scale(-1, 1);
      ctx.drawImage(foglio.img, fot * G.cl, riga * G.ca, G.cl, G.ca, -dw * G.cx, -dh * G.bot, dw, dh);
    } else if (foglio && celle) {
      const cw = foglio.info.w / celle, ch = foglio.info.h, R = unaRiga || { top: 0.04, bot: 0.98 };
      const cella = Math.abs(Math.floor(o.posa || 0)) % celle;
      const s = alt / (ch * (R.bot - R.top)); const dw = cw * s, dh = ch * s;
      const respiro = 1 + 0.012 * Math.sin((o.t || 0) * 2.2 + cx);
      ctx.translate(cx, piedi); if (o.dir === -1) ctx.scale(-1, 1); ctx.scale(1, respiro);
      ctx.drawImage(foglio.img, cella * cw, 0, cw, ch, -dw / 2, -dh * R.bot, dw, dh);
    } else {
      const nome = fig.sagoma || (P && P.id === 'ferruccio' ? 'ferruccio' : 'uomo');
      const S = SAG[nome] || SAG.uomo; const w = (alt * S[0]) / S[1];
      const passo = o.cammina ? Math.abs(Math.sin((o.t || 0) * 9)) * 2 : 0;
      D.sagoma(ctx, nome, cx - w / 2, piedi - alt - passo, w, alt, { dir: o.dir, t: o.t, posa: o.posa });
    }
    ctx.restore();
  };

  /** Un'icona d'oggetto nel riquadro: {sagoma} | {foglio, cella} | {punti} (punti in un riquadro 40×40). */
  D.icona = function (ctx, ic, x, y, w, h, t) {
    const i = ic || { sagoma: 'cassa' };
    if (i.foglio) {
      const f = D.img('fogli', i.foglio);
      if (f) { const cw = f.info.h, n = Math.max(1, Math.floor(f.info.w / cw)), c = (i.cella || 0) % n; const s = Math.min(w / cw, h / f.info.h); ctx.drawImage(f.img, c * cw, 0, cw, f.info.h, x + (w - cw * s) / 2, y + (h - f.info.h * s) / 2, cw * s, f.info.h * s); return; }
    }
    if (Array.isArray(i.punti) && i.punti.length > 2) {
      ctx.save(); ctx.translate(x, y); ctx.scale(w / 40, h / 40); ctx.beginPath(); ctx.moveTo(i.punti[0][0], i.punti[0][1]);
      for (const p of i.punti.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.lineWidth = 40 / w; riempi(ctx, i.colore || '#8a6a3a', C.filo); ctx.restore(); return;
    }
    D.sagoma(ctx, i.sagoma || 'cassa', x + 3, y + 3, w - 6, h - 6, { t, colore: i.sagoma === 'anima' ? i.colore : '#3a2818' });
  };

  // ------------------------------------------------------------------ effetti
  /** Stato degli effetti: lo tiene l'interfaccia e lo passa qui. */
  D.nuoviEffetti = () => ({ buio: 0, buioVerso: 0, velo: 0, veloVerso: 0, lampo: -9, scossa: -9, luce: -9, sipario: -9, anime: [] });
  D.avviaEffetto = function (Fx, nome, t) {
    switch (nome) {
      case 'buio': Fx.buioVerso = 1; break;
      case 'luce': Fx.buioVerso = 0; Fx.veloVerso = 0; Fx.luce = t; break;
      case 'lampo': Fx.lampo = t; break;
      case 'scossa': Fx.scossa = t; break;
      case 'velo': Fx.veloVerso = 1; break;
      case 'sipario': Fx.sipario = t; break;
      case 'anime': { const r = caso(hash('anime' + Math.floor(t * 10))); const colori = ['#ffd98a', '#a5f3fc', '#f9a8d4', '#c4b5fd', '#86efac', '#fdba74'];
        for (let i = 0; i < 14; i++) Fx.anime.push({ x: 120 + r() * 400, y: 300 + r() * 30, v: 30 + r() * 40, t0: t + r() * 1.2, c: colori[i % colori.length], f: r() * 6 }); break; }
      default: AV.errore(`effetto «${nome}» sconosciuto`);
    }
  };
  /** Quanto dura (ms) un effetto prima che la storia vada avanti. */
  D.durataEffetto = (nome) => ({ buio: 500, luce: 300, lampo: 180, scossa: 400, velo: 500, sipario: 1300, anime: 900 }[nome] || 0);
  /** Lo spostamento della scossa al tempo t. */
  D.scossa = (Fx, t) => { const d = t - Fx.scossa; if (d < 0 || d > 0.5) return [0, 0]; const a = (1 - d / 0.5) * 5; return [Math.sin(t * 90) * a, Math.cos(t * 70) * a * 0.6]; };
  /** Disegna gli effetti sopra la scena (prima dell'interfaccia). dt in secondi. */
  D.effetti = function (ctx, Fx, t, dt) {
    const avvicina = (a, b, v) => (a < b ? Math.min(b, a + v * dt) : Math.max(b, a - v * dt));
    Fx.buio = avvicina(Fx.buio, Fx.buioVerso, 2.2); Fx.velo = avvicina(Fx.velo, Fx.veloVerso, 1.6);
    if (Fx.velo > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = Fx.velo * 0.85; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, 300); ctx.restore();
      ctx.save(); ctx.globalAlpha = Fx.velo; ctx.fillStyle = 'rgba(120,145,170,0.22)'; ctx.fillRect(0, 0, W, 300);
      for (let i = 0; i < 4; i++) { const y = 120 + i * 42, x = ((t * (6 + i * 2) + i * 170) % (W + 300)) - 300; const g = ctx.createLinearGradient(0, y - 20, 0, y + 20); g.addColorStop(0, 'rgba(170,190,210,0)'); g.addColorStop(0.5, 'rgba(170,190,210,0.14)'); g.addColorStop(1, 'rgba(170,190,210,0)'); ctx.fillStyle = g; ctx.fillRect(x, y - 20, 420, 40); }
      ctx.restore();
    }
    if (Fx.anime.length) {
      Fx.anime = Fx.anime.filter((a) => t - a.t0 < 4.5);
      for (const a of Fx.anime) { const d = t - a.t0; if (d < 0) continue; const y = a.y - d * a.v, x = a.x + Math.sin(d * 2 + a.f) * 10; D.sagoma(ctx, 'anima', x - 9, y - 26, 18, 26, { t: t + a.f, colore: a.c, alfa: Math.max(0, Math.min(1, d * 2, (4.5 - d) / 1.5)) }); }
    }
    const dl = t - Fx.luce; if (dl >= 0 && dl < 0.8) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - dl / 0.8) * 0.35; ctx.fillStyle = '#ffcf7a'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    const dp = t - Fx.lampo; if (dp >= 0 && dp < 0.45) { ctx.fillStyle = `rgba(255,250,235,${(1 - dp / 0.45) * 0.85})`; ctx.fillRect(0, 0, W, H); }
    if (Fx.buio > 0.01) { ctx.fillStyle = `rgba(0,0,0,${Fx.buio})`; ctx.fillRect(0, 0, W, 300); }
    const ds = t - Fx.sipario;
    if (ds >= 0 && ds < 2.4) {
      const chiuso = ds < 1 ? ds / 1 : ds < 1.3 ? 1 : Math.max(0, 1 - (ds - 1.3) / 1.1);
      const lw = (W / 2) * chiuso;
      for (const lato of [0, 1]) {
        ctx.save(); if (lato) { ctx.translate(W, 0); ctx.scale(-1, 1); }
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lw + 10, 0); ctx.quadraticCurveTo(lw - 6, 150, lw + 4, 300); ctx.lineTo(0, 300); ctx.closePath();
        ctx.fillStyle = '#4a1218'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3;
        for (let x = 12; x < lw; x += 18) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 2, 300); ctx.stroke(); }
        ctx.strokeStyle = C.filo; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lw + 10, 0); ctx.quadraticCurveTo(lw - 6, 150, lw + 4, 300); ctx.stroke();
        ctx.restore();
      }
    }
  };
})(AV);
