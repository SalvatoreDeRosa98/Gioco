/*
 * avventura/30-audio.js — Audio procedurale minimo (Web Audio, nessun file): un fondo sommesso per il tono della scena
 * (`musica` del quadro), i tic dell'interfaccia e i suoni brevi delle azioni `['suono', nome]`.
 * I nomi sono liberi: quelli che non conosce hanno un ripiego (un fondo o un rintocco scelto dal nome).
 * Se il contesto audio non parte (browser senza Web Audio, nessun gesto del giocatore), resta muto senza errori.
 */
(function (AV) {
  'use strict';
  /** Fondi: frequenze delle voci (Hz), taglio del filtro, respiro (Hz). */
  const FONDI = {
    notte: { f: [55, 82.4], taglio: 320, respiro: 0.07 },
    piazza: { f: [61.7, 92.5], taglio: 380, respiro: 0.09 },
    festa: { f: [65.4, 98, 130.8], taglio: 700, respiro: 0.5 },
    interno: { f: [49, 73.4], taglio: 300, respiro: 0.06 },
    targa: { f: [58.3, 87.3], taglio: 340, respiro: 0.08 },
    ombra: { f: [46.2, 65.4], taglio: 260, respiro: 0.05 },
    velo: { f: [46.2, 69.3], taglio: 240, respiro: 0.04 },
    fucina: { f: [41.2, 61.7, 82.4], taglio: 420, respiro: 0.3 },
    alba: { f: [73.4, 110], taglio: 520, respiro: 0.1 },
    finale: { f: [55, 82.4, 110], taglio: 600, respiro: 0.12 },
  };
  /** Suoni: [tipo, frequenza, durata, glissando (rapporto)]; tipo 'r' = rintocco, 'n' = rumore, 's' = salita. */
  const SUONI = {
    tic: ['r', 1320, 0.05, 1], fuoco: ['r', 990, 0.03, 1], voce: ['r', 520, 0.04, 1], scelta: ['r', 660, 0.35, 1.5],
    prendi: ['s', 660, 0.35, 2], porta: ['n', 140, 0.5, 0.5], colpo: ['n', 90, 0.3, 0.4], lampo: ['n', 2000, 0.4, 0.2],
    scossa: ['n', 60, 0.6, 0.5], incudine: ['r', 1760, 0.9, 1], campana: ['r', 392, 1.6, 1], anime: ['s', 440, 1.4, 3],
    anima: ['s', 523, 1.0, 2], sipario: ['n', 400, 1.2, 0.3], passi: ['n', 200, 0.12, 0.8], vento: ['n', 300, 1.5, 1.2],
  };
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

  let ctx = null, master = null, fondo = null, vol = 0.7, nomeFondo = '', muto = false;
  function contesto() {
    if (ctx || muto) return ctx;
    try {
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) { muto = true; return null; }
      ctx = new AC(); master = ctx.createGain(); master.gain.value = vol * 0.6; master.connect(ctx.destination);
    } catch (e) { muto = true; ctx = null; }
    return ctx;
  }
  function fermaFondo(t) {
    if (!fondo) return; const f = fondo; fondo = null;
    try { f.g.gain.setTargetAtTime(0, t, 0.6); setTimeout(() => f.nodi.forEach((n) => { try { n.stop(); } catch (e) { /* già fermo */ } }), 3000); } catch (e) { /* niente */ }
  }
  function avviaFondo(nome) {
    const c = contesto(); if (!c || c.state !== 'running') return;
    const chiavi = Object.keys(FONDI);
    const F = FONDI[nome] || FONDI[chiavi[hash(String(nome)) % chiavi.length]];
    const t = c.currentTime; fermaFondo(t);
    try {
      const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.16, t, 1.2);
      const filtro = c.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.value = F.taglio; filtro.connect(g); g.connect(master);
      const nodi = [];
      F.f.forEach((fr, i) => { const o = c.createOscillator(); o.type = i ? 'triangle' : 'sine'; o.frequency.value = fr; o.detune.value = (i % 2 ? 6 : -4); const og = c.createGain(); og.gain.value = 0.5 / F.f.length + 0.15; o.connect(og); og.connect(filtro); o.start(t); nodi.push(o); });
      const lfo = c.createOscillator(); lfo.frequency.value = F.respiro; const lg = c.createGain(); lg.gain.value = F.taglio * 0.35; lfo.connect(lg); lg.connect(filtro.frequency); lfo.start(t); nodi.push(lfo);
      fondo = { g, nodi };
    } catch (e) { /* audio non disponibile */ }
  }
  function rumore(c, durata) {
    const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * durata)), c.sampleRate); const d = b.getChannelData(0);
    let s = 12345; for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x3fffffff - 1) * (1 - i / d.length); }
    const n = c.createBufferSource(); n.buffer = b; return n;
  }

  AV.audio = {
    /** Da chiamare a un gesto del giocatore: fa partire il contesto (i browser lo vietano prima). */
    sblocca() {
      const c = contesto(); if (!c) return;
      if (c.state === 'suspended') c.resume().then(() => { if (nomeFondo && !fondo) avviaFondo(nomeFondo); }).catch(() => {});
      else if (nomeFondo && !fondo) avviaFondo(nomeFondo);
    },
    /** Il fondo per il tono di scena (nome libero). */
    musica(nome) { if (nome === nomeFondo && fondo) return; nomeFondo = nome || 'notte'; avviaFondo(nomeFondo); },
    /** Un suono breve (nome libero). */
    suono(nome) {
      const c = contesto(); if (!c || c.state !== 'running' || vol <= 0) return;
      const S = SUONI[nome] || ['r', 330 + (hash(String(nome)) % 8) * 55, 0.5, 1];
      const [tipo, fr, dur, gl] = S; const t = c.currentTime;
      try {
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(tipo === 'n' ? 0.35 : 0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); g.connect(master);
        if (tipo === 'n') {
          const n = rumore(c, dur); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(fr, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, fr * gl), t + dur); f.Q.value = 0.8;
          n.connect(f); f.connect(g); n.start(t); n.stop(t + dur);
        } else {
          const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(fr, t); if (gl !== 1) o.frequency.exponentialRampToValueAtTime(fr * gl, t + dur);
          o.connect(g); o.start(t); o.stop(t + dur + 0.05);
          if (tipo === 'r') { const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = fr * 2.76; const g2 = c.createGain(); g2.gain.value = 0.3; o2.connect(g2); g2.connect(g); o2.start(t); o2.stop(t + dur); }
        }
      } catch (e) { /* niente */ }
    },
    /** Volume 0..1. */
    volume(v) { vol = Math.max(0, Math.min(1, Number(v) || 0)); if (master) master.gain.value = vol * 0.6; },
    get muto() { return muto || !ctx || ctx.state !== 'running'; },
  };
})(AV);
