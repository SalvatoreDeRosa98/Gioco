'use strict';
/*
 * lanciatore/uscita-sdl.js — schermo e comandi con SDL2 (@kmamal/sdl).
 *
 * Schermo: il palco 640×360 si copia in una texture e si mostra centrato con bande nere (sull'R36S,
 * 640×480: 60 px sopra e sotto, pixel 1:1). Comandi: il controller SDL (croce, due levette, ABXY,
 * L1/L2/R1/R2, Start/Select) riempie il gamepad «standard» che il gioco legge con navigator.getGamepads();
 * la tastiera, se c'è, manda gli stessi eventi del browser. Start+Select tenuti per un secondo: uscita.
 */

/** Scancode SDL (nome) → KeyboardEvent.code del browser. */
function codiceDaScancode(nome) {
  if (/^[A-Z]$/.test(nome)) return 'Key' + nome;
  if (/^[0-9]$/.test(nome)) return 'Digit' + nome;
  const T = {
    SPACE: 'Space', RETURN: 'Enter', ESCAPE: 'Escape', TAB: 'Tab', BACKSPACE: 'Backspace',
    UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight',
    LSHIFT: 'ShiftLeft', RSHIFT: 'ShiftRight', LCTRL: 'ControlLeft', RCTRL: 'ControlRight', LALT: 'AltLeft', RALT: 'AltRight',
    MINUS: 'Minus', EQUALS: 'Equal', COMMA: 'Comma', PERIOD: 'Period', SLASH: 'Slash',
  };
  return T[nome] || null;
}

/**
 * Apre finestra e comandi.
 * @param {object} p
 * @param {object} p.browser  il finto browser (tasto, mouse, pad, PALCO)
 * @param {object} p.imp      impostazioni del lanciatore (impostazioni.json)
 * @param {object} p.log      { riga(testo) }
 * @param {function} p.esci   chiamata quando il giocatore chiede di uscire
 */
function apriSdl(p) {
  const { browser, imp, log } = p;
  const sdl = require('@kmamal/sdl');
  const L = browser.PALCO.l, A = browser.PALCO.a;
  const info = sdl.info;
  log.riga(`SDL ${info.version.runtime.major}.${info.version.runtime.minor}.${info.version.runtime.patch} · video «${info.drivers.video.current}» (disponibili: ${info.drivers.video.all.join(', ')}) · audio «${info.drivers.audio.current}»`);
  // Il modulo è compilato per SDL 2.32; con la SDL2 della console le funzioni si legano alla prima chiamata.
  // Quelle che questo lanciatore usa esistono dalla 2.26 (SDL_GetWindowSizeInPixels è la più recente).
  const vr = info.version.runtime;
  if (vr.major === 2 && vr.minor < 26) log.riga(`ATTENZIONE: la SDL2 in uso è la ${vr.major}.${vr.minor}.${vr.patch}, serve la 2.26 o più nuova. Se il log si ferma qui sotto con «symbol lookup error», il motivo è questo.`);
  const schermi = sdl.video.displays || [];
  schermi.forEach((d, i) => log.riga(`schermo ${i}: ${d.geometry.width}×${d.geometry.height} @${d.frequency} Hz «${d.name || ''}»`));
  const sch = imp.schermo || {};
  const base = schermi[0] ? schermi[0].geometry : { width: 640, height: 480 };
  const finestra = sdl.video.createWindow({
    title: 'Ferruccio — La Notte Immobile',
    width: sch.larghezza || base.width, height: sch.altezza || base.height,
    fullscreen: sch.intero !== false, accelerated: sch.accelerato !== false, vsync: sch.vsync !== false,
  });
  log.riga(`finestra ${finestra.pixelWidth}×${finestra.pixelHeight} · accelerata ${finestra.accelerated} · vsync ${finestra.vsync}`);

  let rett = null;
  function rettangolo() {
    const pw = finestra.pixelWidth, ph = finestra.pixelHeight;
    let s = Math.min(pw / L, ph / A);
    if (s >= 1 && sch.scalaIntera !== false) s = Math.floor(s);
    const w = Math.round(L * s), h = Math.round(A * s);
    rett = { x: Math.floor((pw - w) / 2), y: Math.floor((ph - h) / 2), width: w, height: h, scala: s };
    log.riga(`palco ${L}×${A} mostrato a ${w}×${h} in (${rett.x}, ${rett.y}): bande nere ${rett.y} px sopra e sotto, ${rett.x} px ai lati`);
  }
  rettangolo();
  finestra.on('resize', rettangolo);
  finestra.on('close', () => p.esci('finestra chiusa'));

  // --- tastiera e mouse (sul PC; sulla console non ci sono) ---------------------------------------------
  const nomi = {};
  for (const [nome, num] of Object.entries(sdl.keyboard.SCANCODE || {})) nomi[num] = nome;
  finestra.on('keyDown', (e) => { const c = codiceDaScancode(nomi[e.scancode] || ''); if (c) browser.tasto(c, true, e.repeat); });
  finestra.on('keyUp', (e) => { const c = codiceDaScancode(nomi[e.scancode] || ''); if (c) browser.tasto(c, false, false); });
  const logico = (e) => [(e.x - rett.x) / rett.scala, (e.y - rett.y) / rett.scala];
  finestra.on('mouseButtonDown', (e) => { const q = logico(e); browser.mouse('mousedown', q[0], q[1], e.button === 1 ? 0 : e.button === 3 ? 2 : 1); });
  finestra.on('mouseButtonUp', (e) => { const q = logico(e); browser.mouse('mouseup', q[0], q[1], e.button === 1 ? 0 : e.button === 3 ? 2 : 1); });
  finestra.on('mouseMove', (e) => { const q = logico(e); browser.mouse('mousemove', q[0], q[1], 0); });

  // --- controller ---------------------------------------------------------------------------------------
  let controller = null; let joystick = null;
  const visti = new Set(); // tasti grezzi già annotati nel log (per mappare da lontano una console sconosciuta)
  function apriController(dev) {
    if (controller) return;
    try { controller = sdl.controller.openDevice(dev); log.riga(`controller aperto: «${dev.name}» (mappa SDL: ${dev.mapping ? 'sì' : 'no'})`); controller.on('close', () => { controller = null; log.riga('controller scollegato'); }); } catch (err) { log.riga('ERRORE apertura controller: ' + err.message); }
  }
  function apriJoystick(dev) {
    if (joystick || controller) return;
    try { joystick = sdl.joystick.openDevice(dev); log.riga(`joystick grezzo aperto (nessuna mappa SDL): «${dev.name}» · ${joystick.buttons.length} tasti, ${joystick.axes.length} assi, ${joystick.hats.length} croci`); joystick.on('close', () => { joystick = null; }); } catch (err) { log.riga('ERRORE apertura joystick: ' + err.message); }
  }
  // "comandi": "joystick" (console) = solo il joystick «grezzo» con la mappa di impostazioni.json: non serve
  // nessuna mappa SDL né PortMaster, e i tasti valgono per POSIZIONE. Altrimenti (PC): il controller SDL se
  // SDL lo conosce, sennò il joystick grezzo.
  const soloJoystick = imp.comandi === 'joystick';
  function cercaDispositivi() {
    const cs = sdl.controller.devices; const js = sdl.joystick.devices;
    if (!soloJoystick && !controller && cs.length) apriController(cs[0]);
    if (!controller && !joystick && js.length) apriJoystick(js[0]);
  }
  log.riga(`dispositivi: ${sdl.controller.devices.length} controller, ${sdl.joystick.devices.length} joystick · comandi «${imp.comandi || 'auto'}»`);
  sdl.joystick.devices.forEach((d, i) => log.riga(`joystick ${i}: «${d.name}» guid ${d.guid || '?'} percorso ${d.path || '?'}`));
  cercaDispositivi();
  sdl.controller.on('deviceAdd', (e) => { if (soloJoystick) return; log.riga(`controller collegato: «${e.device.name}»`); apriController(e.device); });
  sdl.joystick.on('deviceAdd', () => setTimeout(cercaDispositivi, 200));

  const pad = browser.pad; const B = pad.bottoni;
  const n = (v) => (v ? 1 : 0);
  // Mappa del joystick grezzo: numero del tasto per POSIZIONE (il gioco spara giù/destra/sinistra/su coi
  // quattro tasti secondo dove stanno). Valori predefiniti: l'ordine del joypad delle console RK3326 tipo
  // Odroid Go / R36S (0 = tasto in basso, 1 = a destra, 2 = in alto, 3 = a sinistra, 4-7 dorsali, 8-11
  // croce, 12 Select, 13 Start). Si cambia in impostazioni.json → "joystick"; il log scrive ogni tasto premuto.
  const J = Object.assign({ tastoSotto: 0, tastoDestra: 1, tastoSopra: 2, tastoSinistra: 3, L1: 4, R1: 5, L2: 6, R2: 7, croceSu: 8, croceGiu: 9, croceSinistra: 10, croceDestra: 11, select: 12, start: 13, assi: [0, 1, 2, 3] }, imp.joystick || {});
  let insiemeDa = 0; let uscitaChiesta = false; let tantiDa = 0;

  /** Legge il controller e aggiorna il gamepad «standard» del finto browser. Da chiamare a ogni fotogramma. */
  function ingressi(oraMs) {
    if (controller) {
      const b = controller.buttons, a = controller.axes;
      B[0] = n(b.a); B[1] = n(b.b); B[2] = n(b.x); B[3] = n(b.y);
      B[4] = n(b.leftShoulder); B[5] = n(b.rightShoulder);
      B[6] = Math.max(0, a.leftTrigger || 0); B[7] = Math.max(0, a.rightTrigger || 0);
      B[8] = n(b.back); B[9] = n(b.start); B[10] = n(b.leftStick); B[11] = n(b.rightStick);
      B[12] = n(b.dpadUp); B[13] = n(b.dpadDown); B[14] = n(b.dpadLeft); B[15] = n(b.dpadRight); B[16] = n(b.guide);
      pad.assi[0] = a.leftStickX || 0; pad.assi[1] = a.leftStickY || 0; pad.assi[2] = a.rightStickX || 0; pad.assi[3] = a.rightStickY || 0;
      pad.connesso = true; pad.nome = (controller.device && controller.device.name) || 'controller SDL';
    } else if (joystick) {
      const jb = joystick.buttons, ja = joystick.axes, cr = (joystick.hats && joystick.hats[0]) || '';
      for (let i = 0; i < jb.length; i++) if (jb[i] && !visti.has(i)) { visti.add(i); log.riga(`joystick grezzo: premuto il tasto n.${i}`); }
      // layout «standard»: 0 = tasto in basso, 1 = a destra, 2 = a sinistra, 3 = in alto
      B[0] = n(jb[J.tastoSotto]); B[1] = n(jb[J.tastoDestra]); B[2] = n(jb[J.tastoSinistra]); B[3] = n(jb[J.tastoSopra]);
      B[4] = n(jb[J.L1]); B[5] = n(jb[J.R1]); B[6] = n(jb[J.L2]); B[7] = n(jb[J.R2]);
      B[8] = n(jb[J.select]); B[9] = n(jb[J.start]);
      B[12] = n(jb[J.croceSu] || /up/.test(cr)); B[13] = n(jb[J.croceGiu] || /down/.test(cr)); B[14] = n(jb[J.croceSinistra] || /left/.test(cr)); B[15] = n(jb[J.croceDestra] || /right/.test(cr));
      for (let i = 0; i < 4; i++) pad.assi[i] = ja[J.assi[i]] || 0;
      pad.connesso = true; pad.nome = (joystick.device && joystick.device.name) || 'joystick SDL';
      // uscita di sicurezza che non dipende dalla mappa: sei o più tasti qualsiasi tenuti insieme per due secondi
      let premuti = 0; for (let i = 0; i < jb.length; i++) if (jb[i]) premuti++;
      if (premuti >= 6) { if (!tantiDa) tantiDa = oraMs; else if (!uscitaChiesta && oraMs - tantiDa > 2000) { uscitaChiesta = true; p.esci('sei tasti insieme'); } } else tantiDa = 0;
    } else {
      pad.connesso = false;
    }
    if (imp.scambiaAB) { const t = B[0]; B[0] = B[1]; B[1] = t; }
    if (imp.scambiaXY) { const t = B[2]; B[2] = B[3]; B[3] = t; }
    // Start + Select tenuti insieme: si esce (sulla console non c'è altro modo di chiudere)
    if (B[8] && B[9]) { if (!insiemeDa) insiemeDa = oraMs; else if (!uscitaChiesta && oraMs - insiemeDa > (imp.uscitaMs || 1000)) { uscitaChiesta = true; p.esci('Start + Select'); } } else insiemeDa = 0;
  }

  /** Copia a schermo i pixel del palco (RGBA 640×360). */
  function mostra(pixel) {
    if (finestra.destroyed) return;
    finestra.render(L, A, L * 4, 'rgba32', pixel, { scaling: sch.liscio ? 'linear' : 'nearest', dstRect: rett });
  }

  function chiudi() { try { if (!finestra.destroyed) finestra.destroy(); } catch (_) { /* già chiusa */ } }

  return { ingressi, mostra, chiudi, finestra, sdl };
}

module.exports = { apriSdl, codiceDaScancode };
