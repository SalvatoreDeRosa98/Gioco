'use strict';
/*
 * lanciatore/acceleratore.js — quello che il finto browser fa IN PIÙ di un browser per stare su una console
 * lenta e con poca memoria. Tutto avviene avvolgendo i metodi del contesto 2D (Skia su CPU): il gioco chiama
 * le stesse funzioni di sempre e non sa niente.
 *
 *  1. FONT DEI SIMBOLI in coda a ogni ctx.font (emoji e simboli che il font del testo non ha).
 *  2. ctx.filter = 'brightness(0)' SENZA filtro: si dipinge col nero a pari trasparenza (il menu dei burattini
 *     chiusi costava 120 ms a fotogramma: ogni riempimento sotto filtro apre uno strato grande come la tela).
 *  3. IMMAGINI RIDOTTE IN MEMORIA: il gioco carica all'avvio tutti i fogli sprite (decine, da 1-3 megapixel:
 *     ~140 MB decodificati) ma a schermo un burattino è alto poche decine di pixel. Qui ogni immagine si
 *     decodifica, se ne tiene una copia ridotta alla misura che serve (un quarto o metà per lato, come Image:
 *     da una tela Skia disegna più piano) e la decodifica piena si butta. Se un disegno chiede più definizione, la copia si rifà più grande da sola.
 *     Il gioco vede l'immagine «caricata» (onload) solo quando la copia è pronta: niente disegni a vuoto.
 *  4. SCRITTE IN MEMORIA (spenta di partenza, vedi sotto): la stessa scritta (testo, font, colore, allineamento, scala) disegnata per due
 *     fotogrammi di fila diventa un'immaginetta riusata; impaginare il testo è caro, copiarla no.
 *     measureText ricorda le larghezze.
 *  5. IL VELO DELLA NOTTE (sfumatura radiale su tutto il palco a ogni fotogramma) si calcola una volta e si
 *     ricopia, oppure si salta del tutto se il taglio «velo» è acceso.
 */

const zlib = require('zlib');

const FIRMA_PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function pezzoPng(tipo, dati) {
  const b = Buffer.allocUnsafe(12 + dati.length);
  b.writeUInt32BE(dati.length, 0); b.write(tipo, 4, 'latin1'); dati.copy(b, 8);
  b.writeUInt32BE(zlib.crc32(b.subarray(4, 8 + dati.length)) >>> 0, 8 + dati.length);
  return b;
}
/**
 * PNG «svelto» da pixel RGBA con alfa non premoltiplicata (quelli di getImageData): nessun filtro di riga e
 * compressione leggera fatta fuori dal filo principale. Serve a trasformare una tela in una Image: Skia
 * disegna da una Image più in fretta che da una tela (ne ricorda le copie ridotte), e la Image è immutabile.
 */
function pngSvelto(rgba, w, h, fatto) {
  const riga = w * 4; const grezzo = Buffer.allocUnsafe((riga + 1) * h);
  const src = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  for (let y = 0; y < h; y++) { grezzo[y * (riga + 1)] = 0; src.copy(grezzo, y * (riga + 1) + 1, y * riga, (y + 1) * riga); }
  const ihdr = Buffer.allocUnsafe(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  zlib.deflate(grezzo, { level: 1 }, (err, z) => fatto(err, err ? null : Buffer.concat([FIRMA_PNG, pezzoPng('IHDR', ihdr), pezzoPng('IDAT', z), pezzoPng('IEND', Buffer.alloc(0))])));
}

const PNG_MINIMO = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGD4DwABBAEAwS2OUAAAAABJRU5ErkJggg==', 'base64');

/**
 * @param {object} p
 * @param {object} p.canvasLib   @napi-rs/canvas
 * @param {object} p.canvas      la tela del palco
 * @param {object} p.stato       stato condiviso col finto browser (scala, simboli, contatori)
 * @param {object} p.log         { riga }
 * @param {object} p.opz         filtroNero, memoriaTesto, memoriaScritte, immaginiRidotte, memoriaVelo (false = spento)
 * @param {function} p.leggiSorgente  (src) → Buffer coi byte dell'immagine (lancia se non c'è)
 * @param {function} p.suErrore  (err) per gli errori dentro onload/onerror del gioco
 */
function installaAcceleratore(p) {
  const { canvasLib, canvas, stato, log, opz } = p;
  const proto = Object.getPrototypeOf(canvas.getContext('2d'));
  const N = {};
  for (const k of ['save', 'restore', 'fill', 'stroke', 'fillRect', 'strokeRect', 'fillText', 'strokeText', 'drawImage', 'measureText', 'getTransform', 'createRadialGradient', 'createLinearGradient', 'createConicGradient']) N[k] = proto[k];
  const D = (nome) => Object.getOwnPropertyDescriptor(proto, nome) || {};
  const dFiltro = D('filter'), dPieno = D('fillStyle'), dTratto = D('strokeStyle'), dFont = D('font'), dAll = D('textAlign'), dBase = D('textBaseline');
  const completo = Boolean(dFiltro.set && dPieno.set && dTratto.set && dFont.set && dFont.get && dAll.get && dBase.get);
  if (!completo) log.riga('avviso: il contesto 2D non lascia agganciare le sue proprietà: niente acceleratore (lento)');
  const ST = Symbol('stato'); const PILA = Symbol('pila'); // bit 1 = brightness(0) finto, bit 2 = un altro filtro vero
  const S = { fotogramma: 0, cottureTesto: 0, scritteUsate: 0, scritteVere: 0, veloUsato: 0 };
  stato.acceleratore = S;

  // --- 1. font dei simboli ---------------------------------------------------------------------------------
  const coda = stato.simboli.length ? ', ' + stato.simboli.join(', ') : '';
  if (completo && coda) {
    Object.defineProperty(proto, 'font', { configurable: true, enumerable: dFont.enumerable, get: dFont.get, set(v) { dFont.set.call(this, typeof v === 'string' && !v.endsWith(coda) ? v + coda : v); } });
    log.riga(`font dei simboli in coda ai testi: ${stato.simboli.length}`);
  }

  // --- stato del filtro, che segue save/restore ------------------------------------------------------------
  const eNero = (v) => typeof v === 'string' && /^\s*brightness\(\s*0(\.0+)?%?\s*\)\s*$/.test(v);
  const neroFinto = completo && opz.filtroNero !== false;
  if (completo) {
    Object.defineProperty(proto, 'filter', {
      configurable: true, enumerable: dFiltro.enumerable,
      get() { return (this[ST] & 1) ? 'brightness(0)' : dFiltro.get.call(this); },
      set(v) {
        if (neroFinto && eNero(v)) { this[ST] = 1; dFiltro.set.call(this, 'none'); } else { this[ST] = (v && v !== 'none') ? 2 : 0; dFiltro.set.call(this, v); }
      },
    });
    proto.save = function () { (this[PILA] || (this[PILA] = [])).push(this[ST] | 0); return N.save.call(this); };
    proto.restore = function () { const q = this[PILA]; if (q && q.length) this[ST] = q.pop(); return N.restore.call(this); };
    stato.filtroNero = neroFinto;
  }

  // --- sfumature: si ricorda come sono fatte (per rifarle nere) ----------------------------------------------
  const tappe = new WeakMap(); let aggiungi = null;
  if (completo) {
    for (const nome of ['createRadialGradient', 'createLinearGradient', 'createConicGradient']) {
      const f = N[nome]; if (typeof f !== 'function') continue;
      proto[nome] = function () {
        const g = f.apply(this, arguments);
        if (!aggiungi) {
          const gp = Object.getPrototypeOf(g); aggiungi = gp.addColorStop;
          gp.addColorStop = function (o, c) { const t = tappe.get(this); if (t) t.stop.push(o, c); return aggiungi.call(this, o, c); };
        }
        tappe.set(g, { nome, arg: Array.prototype.slice.call(arguments), stop: [], nera: null, n: -1 });
        return g;
      };
    }
  }
  const cacheNero = new Map();
  const neroCome = (colore) => {
    let n = cacheNero.get(colore); if (n !== undefined) return n;
    const s = String(colore).trim().toLowerCase(); let a = 1; let m;
    if (s === 'transparent') a = 0;
    else if ((m = /^(?:rgb|hsl)a?\(([^)]+)\)$/.exec(s))) { const q = m[1].split(/[\s,/]+/).filter(Boolean); if (q.length >= 4) a = q[3].endsWith('%') ? parseFloat(q[3]) / 100 : parseFloat(q[3]); }
    else if (/^#[0-9a-f]{8}$/.test(s)) a = parseInt(s.slice(7), 16) / 255;
    else if (/^#[0-9a-f]{4}$/.test(s)) a = parseInt(s[4] + s[4], 16) / 255;
    if (!(a >= 0 && a <= 1)) a = 1;
    n = `rgba(0,0,0,${a})`; if (cacheNero.size < 4000) cacheNero.set(colore, n);
    return n;
  };
  const stileNero = (cx, stile) => {
    if (typeof stile === 'string') return neroCome(stile);
    const t = stile && tappe.get(stile);
    if (!t) { if (!stato.sfumatureIgnote++) log.riga('avviso: sotto brightness(0) uno stile non riconosciuto è stato dipinto nero pieno'); return '#000'; }
    if (!t.nera || t.n !== t.stop.length) {
      t.nera = N[t.nome].apply(cx, t.arg);
      for (let i = 0; i < t.stop.length; i += 2) aggiungi.call(t.nera, t.stop[i], neroCome(t.stop[i + 1]));
      t.n = t.stop.length;
    }
    return t.nera;
  };
  /** Disegna con `f` dipingendo di nero (stessa alfa) al posto dello stile corrente. */
  function inNero(cx, f, args, d) {
    const s = d.get.call(cx);
    d.set.call(cx, stileNero(cx, s));
    try { return f.apply(cx, args); } finally { d.set.call(cx, s); }
  }

  // --- 3. immagini ridotte in memoria ------------------------------------------------------------------------
  const R = { voci: [], coda: [], inCorso: 0, decodifiche: 0, decodificheAlloSvuoto: 0, svuotamenti: 0, pxPieni: 0, ridotte: opz.immaginiRidotte !== false };
  stato.immaginiRegistro = R;
  const kDiBase = () => (R.ridotte ? (stato.scala <= 0.8 ? 0.25 : 0.5) : 1);
  function libera(im) { try { im.onload = null; im.onerror = null; im.src = PNG_MINIMO; } catch (_) { /* resta al raccoglitore */ } }
  /** La decodifica piena `im` diventa la copia tenuta (ridotta, salvo k = 1); `fatto(err)` quando è disegnabile. */
  function riduci(v, im, fatto) {
    const l = im.width, a = im.height;
    if (!(l > 0 && a > 0)) { fatto(new Error('immagine vuota')); return; }
    if (!v.l) R.pxPieni += l * a;
    v.l = l; v.a = a;
    const k = Math.min(1, v.kVoluto);
    const metti = (sorgente, w, h) => { const vecchia = v.tela; v.tela = sorgente; v.kx = w / l; v.ky = h / a; v.k = k; v.px = w * h; if (vecchia && vecchia !== sorgente) libera(vecchia); };
    if (k >= 1 || l * a < 4096) { metti(im, l, a); fatto(null); return; }
    const w = Math.max(1, Math.round(l * k)), h = Math.max(1, Math.round(a * k));
    const tela = canvasLib.createCanvas(w, h); const g = tela.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    N.drawImage.call(g, im, 0, 0, w, h);
    const dati = g.getImageData(0, 0, w, h).data; // forza la resa (è differita): da qui la decodifica piena non serve più
    libera(im);
    pngSvelto(dati, w, h, (err, png) => {
      if (err) { fatto(err); return; }
      const ridotta = new canvasLib.Image();
      ridotta.onload = () => { metti(ridotta, w, h); fatto(null); };
      ridotta.onerror = (e) => fatto(e || new Error('copia ridotta non leggibile'));
      ridotta.src = png;
    });
  }
  /**
   * Skia tiene in una sua memoria le decodifiche e le copie ridotte («mipmap») delle immagini che ha disegnato,
   * anche dopo che l'immagine è stata buttata: finita una infornata di riduzioni la si svuota, altrimenti la
   * memoria risparmiata resta occupata lo stesso.
   */
  let svuotaPrenotato = false;
  function svuotaMemoriaSkia() {
    if (svuotaPrenotato || typeof canvasLib.clearAllCache !== 'function') return;
    svuotaPrenotato = true;
    setTimeout(() => { svuotaPrenotato = false; if (R.inCorso === 0 && R.coda.length === 0) { try { canvasLib.clearAllCache(); R.svuotamenti++; } catch (_) { /* non c'è in questa versione */ } } else svuotaMemoriaSkia(); }, 120);
  }
  function avanza() {
    if (R.ridotte && R.inCorso === 0 && R.coda.length === 0 && R.decodifiche > R.decodificheAlloSvuoto) { R.decodificheAlloSvuoto = R.decodifiche; svuotaMemoriaSkia(); }
    while (R.inCorso < 2 && R.coda.length) {
      const v = R.coda.shift(); R.inCorso++; R.decodifiche++;
      const im = new canvasLib.Image();
      let chiuso = false;
      const fine = () => { if (!chiuso) { chiuso = true; R.inCorso--; avanza(); } };
      const esito = (err) => {
        v.inCorso = false;
        const io = v.io; const prima = io.complete;
        if (err) { stato.immaginiFallite++; chiama(io, 'onerror', err); return; }
        io.naturalWidth = v.l; io.naturalHeight = v.a; io.width = v.l; io.height = v.a; io.complete = true;
        if (!prima) chiama(io, 'onload', { type: 'load', target: io });
      };
      im.onload = () => { try { riduci(v, im, esito); } catch (e) { esito(e); } fine(); };
      im.onerror = (e) => { fine(); esito(e || new Error('immagine non leggibile')); };
      try { im.src = v.bytes; } catch (e) { fine(); esito(e); }
    }
  }
  function chiama(io, nome, arg) { try { if (typeof io[nome] === 'function') io[nome](arg); } catch (e) { p.suErrore(e); } }
  /** L'Image che vede il gioco: un oggetto normale; i pixel stanno nella voce del registro. */
  class Immagine {
    constructor() { this.onload = null; this.onerror = null; this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; this.width = 0; this.height = 0; this.voce = null; this.srcDichiarata = ''; this.alt = ''; }
    get src() { return this.srcDichiarata; }
    set src(valore) {
      this.srcDichiarata = String(valore);
      this.complete = false; this.voce = null;
      stato.immagini++;
      let bytes;
      try { bytes = Buffer.isBuffer(valore) ? valore : p.leggiSorgente(String(valore)); } catch (err) {
        stato.immaginiFallite++;
        setImmediate(() => chiama(this, 'onerror', err));
        return;
      }
      const v = { io: this, bytes, l: 0, a: 0, tela: null, kx: 1, ky: 1, k: 0, kVoluto: kDiBase(), richiesto: 0, px: 0, inCorso: true };
      this.voce = v; R.voci.push(v); R.coda.push(v);
      setImmediate(avanza);
    }
    decode() { return this.complete ? Promise.resolve() : new Promise((ok) => { const prima = this.onload; this.onload = (e) => { if (prima) prima.call(this, e); ok(); }; }); }
  }
  /** Ogni tanto: le immagini a cui un disegno ha chiesto più definizione della copia tenuta si rifanno più grandi. */
  function manutenzioneImmagini() {
    for (const v of R.voci) {
      if (!v.tela || v.inCorso || v.k >= 1 || v.richiesto * 1.1 <= v.k) continue;
      let k = v.k; while (k < 1 && v.richiesto * 1.1 > k) k *= 2;
      v.kVoluto = Math.min(1, k); v.inCorso = true; R.coda.push(v);
    }
    avanza();
  }

  // --- 4. scritte in memoria -----------------------------------------------------------------------------------
  let misure = new Map();
  function misura(cx, font, testo) {
    const k = font + '\n' + testo;
    let m = misure.get(k);
    if (m === undefined) { m = N.measureText.call(cx, testo); if (misure.size > 6000) misure = new Map(); misure.set(k, m); }
    return m;
  }
  if (completo && opz.memoriaTesto !== false) proto.measureText = function (testo) { return misura(this, dFont.get.call(this), testo); };
  // Spenta di partenza: sul PC non rende (riconoscere la scritta costa quanto impaginarla). Si accende con memoriaScritte: true.
  const memScritte = completo && opz.memoriaScritte === true;
  const scritte = new Map(); let viste = new Map();
  let gMisura = null;
  function cuociScritta(font, stile, all, base, s, testo) {
    if (!gMisura) gMisura = canvasLib.createCanvas(4, 4).getContext('2d');
    dFont.set.call(gMisura, font); gMisura.textAlign = all; gMisura.textBaseline = base;
    const m = N.measureText.call(gMisura, testo);
    const L = m.actualBoundingBoxLeft, Rr = m.actualBoundingBoxRight, A = m.actualBoundingBoxAscent, De = m.actualBoundingBoxDescent;
    if (!(Number.isFinite(L) && Number.isFinite(Rr) && Number.isFinite(A) && Number.isFinite(De))) return null;
    const x0 = Math.floor(-L * s) - 2, x1 = Math.ceil(Rr * s) + 2, y0 = Math.floor(-A * s) - 2, y1 = Math.ceil(De * s) + 2;
    const w = x1 - x0, h = y1 - y0;
    if (w <= 0 || h <= 0 || w > 1400 || h > 320 || w * h > 140000) return null;
    const tela = canvasLib.createCanvas(w, h); const g = tela.getContext('2d');
    dFont.set.call(g, font); dPieno.set.call(g, stile); g.textAlign = all; g.textBaseline = base;
    g.setTransform(s, 0, 0, s, -x0, -y0);
    N.fillText.call(g, testo, 0, 0);
    return { tela, x0, y0, w, h, uso: S.fotogramma };
  }
  function sfoltisci() { const soglia = S.fotogramma - 900; for (const [k, e] of scritte) if (!e || e.uso < soglia) scritte.delete(k); if (scritte.size > 900) scritte.clear(); }

  // --- 5. il velo della notte -----------------------------------------------------------------------------------
  const veli = new Map();
  function disegnaVelo(cx, x, y, w, h) {
    const stile = dPieno.get.call(cx);
    const t = typeof stile === 'string' ? null : tappe.get(stile);
    if (!t) return false; // non è una sfumatura: si disegna normalmente
    if (stato.tagliVelo) return true; // tagliato: fatto (niente)
    if (opz.memoriaVelo === false || (cx[ST] | 0)) return false;
    const m = N.getTransform.call(cx);
    if (m.b !== 0 || m.c !== 0 || m.a <= 0 || m.d <= 0) return false;
    const k = `${t.nome}|${t.arg.join(',')}|${t.stop.join(',')}|${x},${y},${w},${h}|${m.a.toFixed(4)},${m.d.toFixed(4)}`;
    let e = veli.get(k);
    if (!e) {
      const dw = Math.ceil(w * m.a), dh = Math.ceil(h * m.d);
      if (dw <= 0 || dh <= 0 || dw * dh > 1200000) return false;
      const tela = canvasLib.createCanvas(dw, dh); const g = tela.getContext('2d');
      g.setTransform(m.a, 0, 0, m.d, -x * m.a, -y * m.d);
      const s2 = N[t.nome].apply(g, t.arg);
      for (let i = 0; i < t.stop.length; i += 2) aggiungi.call(s2, t.stop[i], t.stop[i + 1]);
      dPieno.set.call(g, s2);
      N.fillRect.call(g, x, y, w, h);
      tela.data();
      if (veli.size > 12) veli.clear();
      e = { tela, dw, dh }; veli.set(k, e);
    }
    const X = Math.round(m.a * x + m.e), Y = Math.round(m.d * y + m.f);
    N.drawImage.call(cx, e.tela, (X - m.e) / m.a, (Y - m.f) / m.d, e.dw / m.a, e.dh / m.d);
    S.veloUsato++;
    return true;
  }

  // --- i metodi di disegno avvolti (un solo strato ciascuno) ----------------------------------------------------
  if (completo) {
    proto.fill = function () { return (this[ST] & 1) ? inNero(this, N.fill, arguments, dPieno) : N.fill.apply(this, arguments); };
    proto.stroke = function () { return (this[ST] & 1) ? inNero(this, N.stroke, arguments, dTratto) : N.stroke.apply(this, arguments); };
    proto.strokeRect = function () { return (this[ST] & 1) ? inNero(this, N.strokeRect, arguments, dTratto) : N.strokeRect.apply(this, arguments); };
    proto.strokeText = function () { return (this[ST] & 1) ? inNero(this, N.strokeText, arguments, dTratto) : N.strokeText.apply(this, arguments); };
    proto.fillRect = function (x, y, w, h) {
      if (stato.dentroAtmosfera && disegnaVelo(this, x, y, w, h)) return undefined;
      return (this[ST] & 1) ? inNero(this, N.fillRect, arguments, dPieno) : N.fillRect.apply(this, arguments);
    };
    proto.drawImage = function (img) {
      const v = img ? img.voce : undefined;
      const nero = this[ST] & 1;
      if (nero) dFiltro.set.call(this, 'brightness(0)');
      try {
        if (v === undefined) return N.drawImage.apply(this, arguments);
        if (!v || !v.tela) return undefined; // immagine non ancora pronta
        const n = arguments.length; let r;
        if (n >= 9) {
          const sw = arguments[3], sh = arguments[4], dw = arguments[7], dh = arguments[8];
          r = Math.max(Math.abs(dw / sw), Math.abs(dh / sh)) * stato.scala; if (r > v.richiesto) v.richiesto = r;
          return N.drawImage.call(this, v.tela, arguments[1] * v.kx, arguments[2] * v.ky, sw * v.kx, sh * v.ky, arguments[5], arguments[6], dw, dh);
        }
        if (n >= 5) {
          r = Math.max(Math.abs(arguments[3] / v.l), Math.abs(arguments[4] / v.a)) * stato.scala; if (r > v.richiesto) v.richiesto = r;
          return N.drawImage.call(this, v.tela, arguments[1], arguments[2], arguments[3], arguments[4]);
        }
        if (stato.scala > v.richiesto) v.richiesto = stato.scala;
        return N.drawImage.call(this, v.tela, arguments[1], arguments[2], v.l, v.a);
      } finally { if (nero) dFiltro.set.call(this, 'none'); }
    };
    proto.fillText = function (testo, x, y, maxW) {
      const st = this[ST] | 0;
      if (st & 1) return inNero(this, N.fillText, arguments, dPieno);
      if (st || !memScritte || typeof testo !== 'string' || testo.length === 0 || testo.length > 96) return N.fillText.apply(this, arguments);
      const stile = dPieno.get.call(this);
      if (typeof stile !== 'string') return N.fillText.apply(this, arguments);
      const m = N.getTransform.call(this);
      if (m.b !== 0 || m.c !== 0 || m.a <= 0 || Math.abs(m.a - m.d) > 1e-6) return N.fillText.apply(this, arguments);
      const font = dFont.get.call(this);
      if (maxW !== undefined && misura(this, font, testo).width > maxW) return N.fillText.apply(this, arguments); // il gioco la stringe: non è la stessa immagine
      const all = dAll.get.call(this), base = dBase.get.call(this);
      const k = font + '\u0001' + stile + '\u0001' + all + '\u0001' + base + '\u0001' + m.a.toFixed(4) + '\u0001' + testo;
      let e = scritte.get(k);
      if (e === undefined) {
        const visto = viste.get(k);
        if (visto === undefined || visto === S.fotogramma || S.cottureTesto >= 10) {
          if (visto === undefined) { if (viste.size > 4000) viste = new Map(); viste.set(k, S.fotogramma); }
          S.scritteVere++;
          return N.fillText.apply(this, arguments);
        }
        e = cuociScritta(font, stile, all, base, m.a, testo); S.cottureTesto++;
        scritte.set(k, e); viste.delete(k);
        if (scritte.size > 800) sfoltisci();
      }
      if (e === null) { S.scritteVere++; return N.fillText.apply(this, arguments); }
      e.uso = S.fotogramma; S.scritteUsate++;
      const X = Math.round(m.a * x + m.e) + e.x0, Y = Math.round(m.d * y + m.f) + e.y0;
      return N.drawImage.call(this, e.tela, (X - m.e) / m.a, (Y - m.f) / m.d, e.w / m.a, e.h / m.d);
    };
  }

  return {
    Immagine,
    /** Da chiamare a inizio fotogramma. */
    fotogramma() { S.fotogramma++; S.cottureTesto = 0; if (S.fotogramma % 30 === 0) manutenzioneImmagini(); },
    /** Quante immagini mancano ancora (decodifica e riduzione sono in sottofondo). */
    inAttesa() { let n = 0; for (const v of R.voci) if (v.inCorso) n++; return n; },
    /** Memoria tenuta per le immagini (MB a 4 byte per pixel) e quanta ne servirebbe a tenerle intere. */
    memoriaImmagini() {
      let px = 0, pronte = 0; for (const v of R.voci) { if (v.tela) { px += v.px; pronte++; } }
      return { immagini: R.voci.length, pronte, tenuteMB: px * 4 / 1048576, intereMB: R.pxPieni * 4 / 1048576, decodifiche: R.decodifiche };
    },
    statistiche() { return { scritteInMemoria: scritte.size, scritteUsate: S.scritteUsate, scritteVere: S.scritteVere, veli: veli.size, veloUsato: S.veloUsato }; },
  };
}

module.exports = { installaAcceleratore };
