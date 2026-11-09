/*
 * teatro/15-audio.js — Audio procedurale con Web Audio API (AudioSys), senza file esterni.
 * Script classico (niente moduli ES): le dichiarazioni di primo livello stanno nello scope globale
 * condiviso con gli altri file di teatro/. Ordine di caricamento e regole: teatro/LEGGIMI.md.
 */

// ===========================================================================
// SISTEMA AUDIO PROCEDURALE CON WEB AUDIO API (SENZA FILE ESTERNI)
// Sintetizzatore sonoro minimale, robusto, a latenza zero.
// Include: passi lignei, fendente stocco, colpo su bersaglio, esplosione sub-bass,
// tintinnio moneta dorata, rintocco di campana e crunch danni.
// Protetto con try-catch totale: anche se il browser blocca l AudioContext,
// il gioco continua a 60 FPS senza alcuna eccezione o freeze!
// ===========================================================================
const AudioSys = (() => {
  let audioCtx = null;
  let abilitato = true;

  function getCtx() {
    if (!abilitato) return null;
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch (_) {}
    return audioCtx;
  }

  if (typeof window !== 'undefined') {
    const sblocca = () => { getCtx(); };
    window.addEventListener('click', sblocca, { passive: true });
    window.addEventListener('keydown', sblocca, { passive: true });
    window.addEventListener('touchstart', sblocca, { passive: true });
  }

  return {
    get attivo() { return abilitato; },
    set attivo(v) { abilitato = Boolean(v); },
    toggle() {
      abilitato = !abilitato;
      if (abilitato) getCtx();
      return abilitato;
    },

    playPasso() {
      try {
        const ac = getCtx();
        if (!ac || ac.state !== 'running') return;
        const t = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = 'triangle';
        const freqBase = 150 + (Math.random() * 30 - 15);
        osc.frequency.setValueAtTime(freqBase, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.04);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(t);
        osc.stop(t + 0.045);
      } catch (_) {}
    },

    playFendente() {
      try {
        const ac = getCtx();
        if (!ac || ac.state !== 'running') return;
        const t = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(280, t + 0.08);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(t);
        osc.stop(t + 0.085);
      } catch (_) {}
    },

    playTearShoot() {
      try {
        const ac = getCtx();
        if (!ac || ac.state !== 'running') return;
        const t = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(240, t + 0.05);

        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(t);
        osc.stop(t + 0.055);
      } catch (_) {}
    },

    playColpo() {
      try {
        const ac = getCtx();
        if (!ac || ac.state !== 'running') return;
        const t = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.06);

        gain.gain.setValueAtTime(0.13, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(t);
        osc.stop(t + 0.065);
      } catch (_) {}
    },

    playEsplosione() {
      try {
        const ac = getCtx();
        if (!ac || ac.state !== 'running') return;
        const t = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(135, t);
        osc.frequency.exponentialRampToValueAtTime(22, t + 0.32);

        gain.gain.setValueAtTime(0.32, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(t);
        osc.stop(t + 0.33);
      } catch (_) {}
    },

    playMoneta() {
      try {
        const ac = getCtx();
        if (!ac || ac.state !== 'running') return;
        const t = ac.currentTime;
        const osc1 = ac.createOscillator();
        const osc2 = ac.createOscillator();
        const gain = ac.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(1320, t);
        osc2.frequency.setValueAtTime(1760, t + 0.04);

        gain.gain.setValueAtTime(0.10, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ac.destination);

        osc1.start(t);
        osc1.stop(t + 0.08);
        osc2.start(t + 0.04);
        osc2.stop(t + 0.20);
      } catch (_) {}
    },

    playCampana() {
      try {
        const ac = getCtx();
        if (!ac || ac.state !== 'running') return;
        const t = ac.currentTime;
        const osc1 = ac.createOscillator();
        const osc2 = ac.createOscillator();
        const gain = ac.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(440, t);
        osc2.frequency.setValueAtTime(880, t);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ac.destination);

        osc1.start(t);
        osc1.stop(t + 0.86);
        osc2.start(t);
        osc2.stop(t + 0.86);
      } catch (_) {}
    },

    playDannoGiocatore() {
      try {
        const ac = getCtx();
        if (!ac || ac.state !== 'running') return;
        const t = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(t);
        osc.stop(t + 0.16);
      } catch (_) {}
    }
  };
})();
