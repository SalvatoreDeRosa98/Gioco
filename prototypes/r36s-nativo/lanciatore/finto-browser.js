'use strict';
/*
 * lanciatore/finto-browser.js — lo strato che «finge il browser» quanto basta al Teatro delle Marionette.
 *
 * Il gioco è fatto di script classici che condividono lo scope globale (gioco/teatro/LEGGIMI.md): qui si
 * preparano nel contesto globale di Node le cose che quegli script si aspettano da una pagina web, poi si
 * eseguono gli script nell'ordine dell'HTML con vm.runInThisContext (un solo contesto: `const`/`let` di
 * primo livello restano condivisi fra i file, come nel browser).
 *
 * Cosa c'è: window (= globalThis), document (getElementById di «c» e «wrap», createElement, body, eventi),
 * canvas 2D nativo (@napi-rs/canvas, Skia), Image (da percorso relativo all'HTML e da data: URI),
 * requestAnimationFrame a comando (lo chiama chi possiede il ciclo), localStorage su file JSON,
 * navigator.getGamepads (layout «standard» riempito da fuori), eventi di tastiera e mouse con cattura e
 * risalita, KeyboardEvent/MouseEvent costruibili. AudioContext NON c'è (il gioco resta muto senza errori)
 * salvo che chi chiama lo fornisca (opz.audio).
 *
 * I file del gioco non si toccano: ogni adattamento sta qui.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const canvasLib = require('@napi-rs/canvas');

const ASC = Symbol('ascoltatori');
const GEN = Symbol('genitore');

/** Dimensioni logiche del palco: le stesse dell'attributo width/height del canvas nell'HTML. */
const PALCO = Object.freeze({ l: 640, a: 360 });

// ---------------------------------------------------------------------------------------------------
// Eventi: un albero piccolo (canvas → wrap → body → document → window) con cattura e risalita.
// ---------------------------------------------------------------------------------------------------
class Evento {
  constructor(tipo, init) {
    const i = init || {};
    this.type = String(tipo);
    this.bubbles = Boolean(i.bubbles);
    this.cancelable = Boolean(i.cancelable);
    this.defaultPrevented = false;
    this.isTrusted = false;
    this.timeStamp = globalThis.performance ? globalThis.performance.now() : 0;
    this.target = null;
    this.currentTarget = null;
    this.fermo = false;
    this.fermoSubito = false;
  }
  preventDefault() { if (this.cancelable) this.defaultPrevented = true; }
  stopPropagation() { this.fermo = true; }
  stopImmediatePropagation() { this.fermo = true; this.fermoSubito = true; }
}
class EventoTastiera extends Evento {
  constructor(tipo, init) {
    super(tipo, init);
    const i = init || {};
    this.code = i.code || '';
    this.key = i.key || '';
    this.repeat = Boolean(i.repeat);
    this.ctrlKey = Boolean(i.ctrlKey); this.shiftKey = Boolean(i.shiftKey);
    this.altKey = Boolean(i.altKey); this.metaKey = Boolean(i.metaKey);
  }
}
class EventoMouse extends Evento {
  constructor(tipo, init) {
    super(tipo, init);
    const i = init || {};
    this.button = i.button || 0;
    this.buttons = i.buttons || 0;
    this.clientX = i.clientX || 0; this.clientY = i.clientY || 0;
    this.offsetX = i.offsetX === undefined ? this.clientX : i.offsetX;
    this.offsetY = i.offsetY === undefined ? this.clientY : i.offsetY;
    this.pageX = this.clientX; this.pageY = this.clientY;
  }
}

function aggiungiAscoltatore(nodo, tipo, fn, opz) {
  if (typeof fn !== 'function') return;
  const cattura = opz === true || Boolean(opz && opz.capture);
  const unaVolta = Boolean(opz && typeof opz === 'object' && opz.once);
  let m = nodo[ASC]; if (!m) { m = new Map(); nodo[ASC] = m; }
  let l = m.get(tipo); if (!l) { l = []; m.set(tipo, l); }
  if (l.some((v) => v.fn === fn && v.cattura === cattura)) return;
  l.push({ fn, cattura, unaVolta });
}
function togliAscoltatore(nodo, tipo, fn, opz) {
  const cattura = opz === true || Boolean(opz && opz.capture);
  const l = nodo[ASC] && nodo[ASC].get(tipo);
  if (!l) return;
  const i = l.findIndex((v) => v.fn === fn && v.cattura === cattura);
  if (i >= 0) l.splice(i, 1);
}

/** Rende `nodo` un bersaglio di eventi figlio di `genitore` (null = radice). */
function rendiBersaglio(nodo, genitore, suErrore) {
  nodo[ASC] = new Map();
  nodo[GEN] = genitore || null;
  nodo.addEventListener = (tipo, fn, opz) => aggiungiAscoltatore(nodo, tipo, fn, opz);
  nodo.removeEventListener = (tipo, fn, opz) => togliAscoltatore(nodo, tipo, fn, opz);
  nodo.dispatchEvent = (ev) => propaga(nodo, ev, suErrore);
  return nodo;
}

function chiama(nodo, ev, cattura, suErrore) {
  const l = nodo[ASC] && nodo[ASC].get(ev.type);
  if (!l || !l.length) return;
  ev.currentTarget = nodo;
  for (const v of l.slice()) {
    if (v.cattura !== cattura) continue;
    if (v.unaVolta) togliAscoltatore(nodo, ev.type, v.fn, v.cattura);
    try { v.fn.call(nodo, ev); } catch (err) { if (suErrore) suErrore(err); }
    if (ev.fermoSubito) return;
  }
}
function propaga(bersaglio, ev, suErrore) {
  ev.target = bersaglio;
  const catena = [];
  for (let n = bersaglio; n; n = n[GEN]) catena.push(n);
  for (let i = catena.length - 1; i >= 1 && !ev.fermo; i--) chiama(catena[i], ev, true, suErrore);
  if (!ev.fermo) { chiama(catena[0], ev, true, suErrore); if (!ev.fermoSubito) chiama(catena[0], ev, false, suErrore); }
  if (ev.bubbles) for (let i = 1; i < catena.length && !ev.fermo; i++) chiama(catena[i], ev, false, suErrore);
  ev.currentTarget = null;
  return !ev.defaultPrevented;
}

// ---------------------------------------------------------------------------------------------------
// localStorage su file: un JSON solo, scritto con ritardo (la scheda SD non ama le scritture a raffica).
// ---------------------------------------------------------------------------------------------------
function creaMemoria(file, log) {
  let dati = Object.create(null);
  try { const letti = JSON.parse(fs.readFileSync(file, 'utf8')); for (const k of Object.keys(letti)) dati[k] = String(letti[k]); } catch (_) { /* primo avvio o file rovinato: si parte vuoti */ }
  let timer = null; let sporco = false;
  function scarica() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!sporco) return;
    sporco = false;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file + '.tmp', JSON.stringify(dati));
      fs.renameSync(file + '.tmp', file);
    } catch (err) { if (log) log.riga('ERRORE salvataggio su file: ' + err.message); }
  }
  function segna() { sporco = true; if (!timer) { timer = setTimeout(scarica, 800); if (timer.unref) timer.unref(); } }
  const metodi = {
    getItem(k) { k = String(k); return k in dati ? dati[k] : null; },
    setItem(k, v) { dati[String(k)] = String(v); segna(); },
    removeItem(k) { delete dati[String(k)]; segna(); },
    clear() { dati = Object.create(null); segna(); },
    key(i) { const ks = Object.keys(dati); return i < ks.length ? ks[i] : null; },
  };
  const memoria = new Proxy({}, {
    get(_, k) { if (k === 'length') return Object.keys(dati).length; if (k in metodi) return metodi[k]; return typeof k === 'string' && k in dati ? dati[k] : undefined; },
    set(_, k, v) { metodi.setItem(k, v); return true; },
    deleteProperty(_, k) { metodi.removeItem(k); return true; },
    has(_, k) { return k in metodi || k in dati; },
    ownKeys() { return Object.keys(dati); },
    getOwnPropertyDescriptor(_, k) { return k in dati ? { value: dati[k], enumerable: true, configurable: true, writable: true } : undefined; },
  });
  return { memoria, scarica };
}

// ---------------------------------------------------------------------------------------------------
// Il finto browser
// ---------------------------------------------------------------------------------------------------
/**
 * Prepara il contesto globale e restituisce i comandi per chi possiede il ciclo.
 * @param {object} opz
 * @param {string} opz.fileHtml      HTML del gioco (gioco/teatro_marionette.html oppure la release a file unico)
 * @param {string} opz.fileMemoria   file JSON che fa da localStorage
 * @param {string} [opz.dirFont]     cartella coi DejaVu*.ttf (font uguali su ogni macchina)
 * @param {{t:number}} [opz.orologio] orologio virtuale in ms (prove e misure): sostituisce performance.now()
 * @param {object} [opz.log]         { riga(testo) }
 * @param {object} [opz.audio]       { AudioContext, OfflineAudioContext } da esporre al gioco (assente = muto)
 * @param {object} [opz.opzioniIniziali] valori di «ferruccio.teatro.opzioni» da scrivere SOLO se non ci sono già
 */
function creaFintoBrowser(opz) {
  const G = globalThis;
  const log = opz.log || { riga() {} };
  const dirHtml = path.dirname(path.resolve(opz.fileHtml));
  const stato = { errori: 0, ultimiErrori: [], caricato: false, immagini: 0, immaginiFallite: 0, pixelImmagini: 0, tele: [], simboli: [] };

  function annotaErrore(dove, err) {
    stato.errori++;
    const testo = `[${dove}] ${err && err.stack ? err.stack : String(err)}`;
    if (stato.ultimiErrori.length < 40) stato.ultimiErrori.push(testo);
    // lo stesso errore a ogni fotogramma non deve riempire il log: i primi 30, poi uno ogni 600
    if (stato.errori <= 30 || stato.errori % 600 === 0) log.riga(`ERRORE n.${stato.errori} ${testo}`);
  }
  /** Errore sfuggito a un gestore o a un fotogramma: come il browser, evento «error» sulla finestra. */
  let dentroErrore = false;
  function erroreNonGestito(err) {
    annotaErrore('non gestito', err);
    if (dentroErrore) return;
    dentroErrore = true;
    try {
      const ev = new Evento('error', { cancelable: true });
      ev.error = err; ev.message = String(err && err.message ? err.message : err); ev.filename = ''; ev.lineno = 0; ev.colno = 0;
      propaga(G, ev, null);
    } catch (_) { /* il gestore degli errori del gioco non deve far cadere il lanciatore */ } finally { dentroErrore = false; }
  }

  // --- font: gli stessi su ogni macchina (la console non ha i font di un PC) ---------------------------
  if (opz.dirFont && fs.existsSync(opz.dirFont)) {
    const F = canvasLib.GlobalFonts;
    const reg = (file, alias) => { const p = path.join(opz.dirFont, file); if (fs.existsSync(p)) F.registerFromPath(p, alias); };
    for (const alias of ['ui-monospace', 'monospace', 'Cascadia Mono']) { reg('DejaVuSansMono.ttf', alias); reg('DejaVuSansMono-Bold.ttf', alias); }
    for (const alias of ['Georgia', 'serif']) { reg('DejaVuSerif.ttf', alias); reg('DejaVuSerif-Bold.ttf', alias); }
    reg('DejaVuSans.ttf', 'sans-serif'); reg('DejaVuSans-Bold.ttf', 'sans-serif');
    // simboli ed emoji (monete, bombe, chiavi, i tasti Ⓐ Ⓑ…): nel browser li mette il sistema, qui no.
    // Ogni file «simboli-*» diventa una famiglia di ripiego messa in coda a ogni ctx.font (più sotto).
    for (const f of fs.readdirSync(opz.dirFont).filter((n) => /^simboli-.*\.(ttf|otf|woff2?)$/i.test(n)).sort()) {
      const alias = 'Ferruccio ' + path.parse(f).name.slice(0, 30);
      try { if (F.registerFromPath(path.join(opz.dirFont, f), alias)) stato.simboli.push(`"${alias}"`); } catch (_) { /* formato non letto: resta il quadratino */ }
    }
  } else {
    log.riga('avviso: cartella dei font non trovata, si usano quelli di sistema');
  }

  // --- tele ---------------------------------------------------------------------------------------------
  function nuovaTela(l, a) {
    const c = canvasLib.createCanvas(l || 300, a || 150);
    const originale = c.getContext;
    let cx = null;
    c.getContext = function (tipo, attr) { if (tipo !== '2d') return null; if (!cx) cx = originale.call(c, '2d', attr); return cx; };
    c.style = {};
    c.tagName = 'CANVAS';
    stato.tele.push(new WeakRef(c));
    return c;
  }

  function creaElemento(tag, genitore) {
    const el = {
      tagName: String(tag).toUpperCase(), id: '', className: '', textContent: '', innerHTML: '', title: '', hidden: false,
      style: {}, dataset: {}, children: [], parentNode: null,
      classList: { add() {}, remove() {}, toggle() { return false; }, contains() { return false; } },
      appendChild(f) { this.children.push(f); if (f && typeof f === 'object') { try { f.parentNode = this; } catch (_) { /* oggetto nativo */ } } return f; },
      removeChild(f) { const i = this.children.indexOf(f); if (i >= 0) this.children.splice(i, 1); return f; },
      remove() { if (this.parentNode && this.parentNode.removeChild) this.parentNode.removeChild(this); },
      setAttribute(k, v) { this[k] = String(v); }, getAttribute(k) { return k in this ? this[k] : null; }, removeAttribute(k) { delete this[k]; },
      focus() {}, blur() {}, click() {}, select() {}, scrollIntoView() {}, contains(f) { return this.children.includes(f); },
      querySelector() { return null; }, querySelectorAll() { return []; },
      getBoundingClientRect() { return { left: 0, top: 0, x: 0, y: 0, width: PALCO.l, height: PALCO.a, right: PALCO.l, bottom: PALCO.a }; },
      clientWidth: PALCO.l, clientHeight: PALCO.a, offsetWidth: PALCO.l, offsetHeight: PALCO.a,
    };
    return rendiBersaglio(el, genitore, erroreNonGestito);
  }

  // window è la radice dell'albero degli eventi
  rendiBersaglio(G, null, erroreNonGestito);
  const documento = creaElemento('#document', G);
  const radice = creaElemento('html', documento);
  const corpo = creaElemento('body', documento);
  const wrap = creaElemento('div', corpo); wrap.id = 'wrap';
  const canvas = nuovaTela(PALCO.l, PALCO.a);
  rendiBersaglio(canvas, wrap, erroreNonGestito);
  canvas.id = 'c';
  canvas.clientWidth = PALCO.l; canvas.clientHeight = PALCO.a; // adattaRisoluzione() → buffer 640×360, scala 1
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, x: 0, y: 0, width: PALCO.l, height: PALCO.a, right: PALCO.l, bottom: PALCO.a });
  canvas.focus = () => {}; canvas.parentNode = wrap;

  // In coda a ogni font chiesto dal gioco si aggiungono le famiglie dei simboli: il gioco non cambia,
  // i glifi che il font del testo non ha (🪙 💣 🗝 Ⓐ…) si pescano da lì.
  if (stato.simboli.length) {
    const proto = Object.getPrototypeOf(canvas.getContext('2d'));
    const d = Object.getOwnPropertyDescriptor(proto, 'font');
    if (d && d.set && d.get) {
      const coda = ', ' + stato.simboli.join(', ');
      Object.defineProperty(proto, 'font', { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { d.set.call(this, typeof v === 'string' && !v.endsWith(coda) ? v + coda : v); } });
      log.riga(`font dei simboli in coda ai testi: ${stato.simboli.length}`);
    } else log.riga('avviso: il contesto 2D non lascia agganciare «font»: emoji e simboli restano quadratini');
  }

  Object.assign(documento, {
    body: corpo, documentElement: radice, head: creaElemento('head', documento), hidden: false, visibilityState: 'visible',
    readyState: 'complete', fullscreenElement: null, webkitFullscreenElement: null, activeElement: corpo, title: 'Ferruccio',
    getElementById(id) { return id === 'c' ? canvas : id === 'wrap' ? wrap : null; },
    createElement(tag) { return String(tag).toLowerCase() === 'canvas' ? nuovaTela() : creaElemento(tag, null); },
    querySelector(sel) { return sel === 'canvas' ? canvas : null; },
    querySelectorAll() { return []; },
    hasFocus() { return true; },
    exitFullscreen() { return Promise.resolve(); },
  });

  // --- immagini: percorso relativo all'HTML oppure data: URI ----------------------------------------------
  class Immagine extends canvasLib.Image {
    set src(v) {
      let dato = v;
      if (typeof v === 'string') {
        this.srcDichiarata = v;
        stato.immagini++;
        try {
          if (v.startsWith('data:')) {
            const i = v.indexOf(',');
            dato = /;base64/i.test(v.slice(0, i)) ? Buffer.from(v.slice(i + 1), 'base64') : Buffer.from(decodeURIComponent(v.slice(i + 1)), 'utf8');
          } else {
            let p = v.replace(/^file:\/\//, '').split(/[?#]/)[0];
            try { p = decodeURIComponent(p); } catch (_) { /* percorso già in chiaro */ }
            if (!path.isAbsolute(p)) p = path.join(dirHtml, p);
            dato = fs.readFileSync(p);
          }
        } catch (err) {
          stato.immaginiFallite++;
          const io = this;
          setImmediate(() => { try { if (typeof io.onerror === 'function') io.onerror(err); } catch (e) { erroreNonGestito(e); } });
          return;
        }
      }
      super.src = dato;
      stato.pixelImmagini += (this.width || 0) * (this.height || 0);
    }
    get src() { return this.srcDichiarata || ''; }
  }

  // --- requestAnimationFrame a comando --------------------------------------------------------------------
  let codaRaf = []; let contaRaf = 0;
  G.requestAnimationFrame = (fn) => { codaRaf.push([++contaRaf, fn]); return contaRaf; };
  G.cancelAnimationFrame = (id) => { codaRaf = codaRaf.filter((c) => c[0] !== id); };

  if (opz.orologio) {
    const o = opz.orologio;
    Object.defineProperty(G, 'performance', { value: { now: () => o.t, timeOrigin: Date.now(), mark() {}, measure() {} }, configurable: true, writable: true });
  }

  // --- memoria, navigator, il resto della finestra ----------------------------------------------------------
  const { memoria, scarica } = creaMemoria(opz.fileMemoria, log);
  if (opz.opzioniIniziali && memoria.getItem('ferruccio.teatro.opzioni') === null) {
    memoria.setItem('ferruccio.teatro.opzioni', JSON.stringify(opz.opzioniIniziali));
    log.riga('primo avvio: opzioni di partenza ' + JSON.stringify(opz.opzioniIniziali));
  }

  /** Stato del gamepad, riempito da chi legge il joystick (uscita-sdl.js): layout «standard» del W3C. */
  const pad = { connesso: false, nome: '', assi: [0, 0, 0, 0], bottoni: new Array(17).fill(0) };
  const padStd = {
    id: 'Ferruccio nativo (standard)', index: 0, connected: true, mapping: 'standard', timestamp: 0, vibrationActuator: null,
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
  };
  const listaPad = [null, null, null, null];
  const navigatore = {
    userAgent: `FerruccioNativo/0.1 (Node ${process.version}; ${process.platform} ${process.arch}; @napi-rs/canvas)`,
    language: 'it-IT', languages: ['it-IT', 'it'], platform: `${process.platform} ${process.arch}`, maxTouchPoints: 0,
    hardwareConcurrency: require('os').cpus().length, onLine: false,
    getGamepads() {
      if (!pad.connesso) { listaPad[0] = null; return listaPad; }
      padStd.id = pad.nome || padStd.id;
      padStd.timestamp = G.performance.now();
      for (let i = 0; i < 4; i++) padStd.axes[i] = pad.assi[i] || 0;
      for (let i = 0; i < 17; i++) { const v = pad.bottoni[i] || 0; const b = padStd.buttons[i]; b.value = v; b.pressed = v > 0.5; b.touched = v > 0; }
      listaPad[0] = padStd;
      return listaPad;
    },
  };
  const def = (nome, valore) => Object.defineProperty(G, nome, { value: valore, configurable: true, writable: true, enumerable: false });
  def('window', G); def('self', G);
  def('document', documento);
  def('navigator', navigatore);
  def('localStorage', memoria);
  def('Image', Immagine); def('HTMLImageElement', Immagine);
  def('HTMLCanvasElement', canvasLib.CanvasElement || canvasLib.Canvas);
  def('ImageData', canvasLib.ImageData); def('Path2D', canvasLib.Path2D); def('DOMMatrix', canvasLib.DOMMatrix);
  def('Event', Evento); def('KeyboardEvent', EventoTastiera); def('MouseEvent', EventoMouse);
  def('devicePixelRatio', 1); def('innerWidth', PALCO.l); def('innerHeight', PALCO.a);
  def('focus', () => {}); def('blur', () => {}); def('scrollTo', () => {});
  def('getComputedStyle', () => ({ getPropertyValue() { return ''; } }));
  def('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  def('location', { href: 'file://' + path.resolve(opz.fileHtml), protocol: 'file:', search: '', hash: '', pathname: path.resolve(opz.fileHtml), reload() {} });
  if (opz.audio && opz.audio.AudioContext) {
    def('AudioContext', opz.audio.AudioContext);
    if (opz.audio.OfflineAudioContext) def('OfflineAudioContext', opz.audio.OfflineAudioContext);
  }

  // --- caricamento degli script nell'ordine dell'HTML -------------------------------------------------------
  function estraiScript() {
    const html = fs.readFileSync(opz.fileHtml, 'utf8');
    const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    const lista = []; let m;
    while ((m = re.exec(html))) {
      const tipo = /\btype\s*=\s*["']([^"']+)["']/i.exec(m[1]);
      if (tipo && !/javascript|^module$/i.test(tipo[1])) continue; // blocchi di dati, non codice
      const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(m[1]);
      if (src) lista.push({ nome: path.join(dirHtml, src[1]), codice: fs.readFileSync(path.join(dirHtml, src[1]), 'utf8') });
      else if (m[2].trim()) lista.push({ nome: `${path.basename(opz.fileHtml)}#script${lista.length + 1}`, codice: m[2] });
    }
    return lista;
  }

  function carica() {
    const lista = estraiScript();
    const t0 = process.hrtime.bigint();
    for (const s of lista) vm.runInThisContext(s.codice, { filename: s.nome });
    // Gli errori che il gioco raccoglie da sé (riquadro a schermo di 000-errori.js) finiscono anche nel log.
    if (typeof G.segnalaErroreTeatro === 'function') {
      const originale = G.segnalaErroreTeatro;
      G.segnalaErroreTeatro = function (dove, err) { annotaErrore('gioco:' + dove, err); return originale.apply(this, arguments); };
    }
    stato.caricato = true;
    log.riga(`caricati ${lista.length} script in ${(Number(process.hrtime.bigint() - t0) / 1e6).toFixed(0)} ms da ${path.basename(opz.fileHtml)}`);
    return lista.length;
  }

  /** Esegue un fotogramma: chiama le funzioni prenotate con requestAnimationFrame. */
  function fotogramma(oraMs) {
    const q = codaRaf; codaRaf = [];
    for (let i = 0; i < q.length; i++) { try { q[i][1](oraMs); } catch (err) { erroreNonGestito(err); } }
  }

  const CHIAVI = { Space: ' ', Enter: 'Enter', Escape: 'Escape', Tab: 'Tab', Backspace: 'Backspace', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight' };
  function chiaveDa(code) {
    if (CHIAVI[code]) return CHIAVI[code];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
    if (/^Digit\d$/.test(code)) return code.slice(5);
    return code;
  }
  /** Tasto vero (tastiera fisica o prova automatica): evento fidato che parte dal body e risale alla finestra. */
  function tasto(code, giu, ripetuto) {
    const ev = new EventoTastiera(giu ? 'keydown' : 'keyup', { code, key: chiaveDa(code), bubbles: true, cancelable: true, repeat: Boolean(ripetuto) });
    ev.isTrusted = true;
    propaga(corpo, ev, erroreNonGestito);
  }
  /** Mouse in coordinate logiche 640×360 (il canvas finto occupa tutta la «pagina»). */
  function mouse(tipo, x, y, bottone) {
    const ev = new EventoMouse(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: bottone || 0, buttons: tipo === 'mouseup' ? 0 : 1 });
    ev.isTrusted = true;
    propaga(canvas, ev, erroreNonGestito);
  }
  /** Valore di un nome dello scope globale lessicale del gioco (const/let di primo livello), o undefined. */
  function leggi(espressione) { try { return vm.runInThisContext(espressione); } catch (_) { return undefined; } }

  return {
    PALCO, canvas, stato, pad, memoria, carica, fotogramma, tasto, mouse, leggi, erroreNonGestito,
    /** I pixel del palco (RGBA, 640×360×4) pronti per lo schermo. */
    pixel() { return canvas.data(); },
    /** Salva il palco in un PNG. */
    foto(file) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, canvas.toBuffer('image/png')); return file; },
    /** Quanta memoria grafica tiene il gioco: immagini decodificate e tele fuori schermo ancora vive (MB, 4 byte a pixel). */
    memoriaGrafica() {
      let n = 0, px = 0;
      for (const r of stato.tele) { const c = r.deref(); if (c) { n++; px += c.width * c.height; } }
      return { immagini: stato.immagini, immaginiMB: stato.pixelImmagini * 4 / 1048576, tele: n, teleMB: px * 4 / 1048576 };
    },
    /** Scrive subito i salvataggi su file (da chiamare all'uscita). */
    salva: scarica,
  };
}

module.exports = { creaFintoBrowser, PALCO };
