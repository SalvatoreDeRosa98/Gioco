/*
 * teatro/10-sprite.js — Testo auto-fit, cache e disegno degli sprite a griglia pixel, disegno pittorico di Ferruccio, nemici e boss, tabelle SPRITE_*.
 * Script classico (niente moduli ES): le dichiarazioni di primo livello stanno nello scope globale
 * condiviso con gli altri file di teatro/. Ordine di caricamento e regole: teatro/LEGGIMI.md.
 */

// ===========================================================================
// MOTORE DI TESTO ANTI-OVERFLOW (AUTO-FIT E WORD-WRAP DENTRO I RIQUADRI)
// ===========================================================================
function drawTextFit(text, x, y, maxW, {
  size = 8.5,
  weight = 'bold',
  style = '',
  color = '#ffffff',
  align = 'center',
  shadow = true,
} = {}) {
  if (!text) return;
  ctx.save();
  ctx.textAlign = align;
  let curSize = size;
  const prefix = `${style ? style + ' ' : ''}${weight ? weight + ' ' : ''}`;
  ctx.font = `${prefix}${curSize}px ui-monospace, monospace`;
  while (curSize > 5.5 && ctx.measureText(text).width > maxW) {
    curSize -= 0.5;
    ctx.font = `${prefix}${curSize}px ui-monospace, monospace`;
  }
  if (shadow) {
    ctx.fillStyle = '#070403';
    ctx.fillText(text, Math.round(x) + 1, Math.round(y) + 1, maxW);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, Math.round(x), Math.round(y), maxW);
  ctx.restore();
}

function drawPillLabel(text, cx, cy, maxW, {
  size = 8,
  color = '#f9cb40',
  bg = 'rgba(10, 6, 4, 0.92)',
  border = '#8a5a2b',
} = {}) {
  ctx.save();
  ctx.font = `bold ${size}px ui-monospace, monospace`;
  const measured = Math.min(maxW, Math.ceil(ctx.measureText(text).width) + 10);
  const pw = Math.max(28, measured);
  const ph = size + 6;
  const rx = Math.max(8, Math.min(W - pw - 8, Math.round(cx - pw / 2)));
  const ry = Math.max(4, Math.min(H - ph - 4, Math.round(cy - ph + 3)));
  ctx.fillStyle = bg;
  ctx.fillRect(rx, ry, pw, ph);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.strokeRect(rx, ry, pw, ph);
  drawTextFit(text, rx + pw / 2, ry + ph - 4, pw - 6, { size, color, align: 'center', shadow: false });
  ctx.restore();
}

const spriteCache = new Map();

function getSpriteCanvas(griglia, flash = false) {
  const key = griglia.join('|') + (flash ? '_F' : '');
  let c = spriteCache.get(key);
  if (!c) {
    const h = griglia.length;
    const w = griglia[0].length;
    c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    for (let py = 0; py < h; py++) {
      const row = griglia[py];
      for (let px = 0; px < w; px++) {
        const ch = row[px];
        const col = PALETTE[ch];
        if (!col) continue;
        x.fillStyle = flash ? (ch === 'k' ? '#3a110a' : '#ffffff') : col;
        x.fillRect(px, py, 1, 1);
      }
    }
    spriteCache.set(key, c);
  }
  return c;
}

function drawPixelSprite(griglia, x, y, scala = 2, flipX = false, flash = false, rot = 0) {
  if (!griglia) return;
  const off = getSpriteCanvas(griglia, flash);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  if (rot !== 0) ctx.rotate(rot);
  if (flipX) ctx.scale(-1, 1);
  const dw = Math.round(off.width * scala);
  const dh = Math.round(off.height * scala);
  ctx.drawImage(off, -Math.round(dw / 2), -Math.round(dh / 2), dw, dh);
  ctx.restore();
}

// ===========================================================================
// RENDERING PITTORICO / ILLUSTRATO AD ALTA DEFINIZIONE ( ISPIRATO 1:1 ALL'IMMAGINE DI RIFERIMENTO:
// CAPPUCCIO CONICO IN LINO CREMA, VOLTO INCAVATO NERO COI 2 OCCHI TONDI LUMINOSI,
// SCIARPA ROSSA A DUE CODE ONDULATE, MANTELLO A CAMPANA, GAMBE SOTTILI SCURE E STOCCO )
// ===========================================================================
function disegnaFerruccioPittorico() {
  let px, py, opts;
  const a0 = arguments[0];
  if (a0 && typeof a0.save === 'function') {
    px = arguments[1];
    py = arguments[2];
    opts = arguments[3] || {};
  } else {
    px = arguments[0];
    py = arguments[1];
    opts = arguments[2] || {};
  }

  const {
    charId = (opts.charInfo?.id || statoRun.personaggioId || 'ferruccio'),
    flipX = false,
    moving = false,
    shootTimer = 0,
    pickupTimer = 0,
    flash = false,
    tick = 0,
    haSpada = false,
    swordAnimTick = -1,
    swordAngle = 0,
    sinergie = {},
  } = opts;

  ctx.save();
  ctx.imageSmoothingEnabled = true;

  const bob = moving ? Math.sin(tick * 0.34) * 1.8 : Math.sin(tick * 0.09) * 1.1;
  const wave = Math.sin(tick * 0.16) * 3.8;
  const wave2 = Math.cos(tick * 0.13) * 3.2;

  // Ombra morbida sul pavimento
  const shRadius = charId === 'taddeo' ? 18 : 15;
  const sh = ctx.createRadialGradient(px, py + 9, 1, px, py + 9, shRadius);
  sh.addColorStop(0, 'rgba(8, 5, 3, 0.72)');
  sh.addColorStop(1, 'rgba(8, 5, 3, 0)');
  ctx.fillStyle = sh;
  ctx.save();
  ctx.translate(px, py + 9);
  ctx.scale(1, 0.42);
  ctx.beginPath();
  ctx.arc(0, 0, shRadius, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.translate(px, py + bob);
  if (opts.scalaA2 && opts.scalaA2 !== 1) ctx.scale(opts.scalaA2, opts.scalaA2); // A2: consumabili (a2-consumabili.js)
  if (flipX) ctx.scale(-1, 1);
  // Sprite procedurale originale coerente (nessuno sparo disegnato sul corpo, solo proiettili dinamici)
  // if (t2Gancio('personaggio', ctx, charId, px, py, opts)) { ctx.restore(); return; }

  // =========================================================================
  // CASO 1: AGNESE — LA TESSITRICE DI SAN LEUCIO (Fedele all\'artwork agnese.jpg)
  // =========================================================================
  if (charId === 'agnese') {
    const colLuceA = flash ? '#ffffff' : '#fdf8ef';
    const colMediaA = flash ? '#ffffff' : '#e6dac3';
    const colOmbraA = flash ? '#f43f5e' : '#9c8b73';
    const colRibbon1 = flash ? '#ffffff' : '#be123c';
    const colRibbon2 = flash ? '#fda4af' : '#881337';
    const colThread = flash ? '#ffffff' : '#ff2a44';

    // 1. Nastri di seta bordeaux svolazzanti a sinistra
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = colRibbon1;
    ctx.strokeStyle = '#120a07';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-3, -15);
    ctx.bezierCurveTo(-12, -20 - wave * 0.4, -22, -14 + wave * 0.7, -32, -18 + wave);
    ctx.bezierCurveTo(-26, -11 + wave * 0.6, -14, -13, -3, -11);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = colRibbon2;
    ctx.beginPath();
    ctx.moveTo(-2, -12);
    ctx.bezierCurveTo(-11, -11 + wave2 * 0.3, -20, -4 - wave2 * 0.6, -29, -3 - wave2);
    ctx.bezierCurveTo(-24, 3 - wave2 * 0.8, -13, -4, -2, -8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // 2. Gambette e scarpette delicate di seta/legno
    const walkSwing = moving ? Math.sin(tick * 0.34) * 3.2 : 0;
    ctx.strokeStyle = '#110d0a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-2.5, 0); ctx.lineTo(-3 - walkSwing * 0.5, 7.5); ctx.stroke();
    ctx.moveTo(2.2, 0);  ctx.lineTo(2.5 + walkSwing * 0.5, 8.0); ctx.stroke();

    ctx.fillStyle = '#1e1014';
    ctx.beginPath();
    ctx.ellipse(-2 - walkSwing * 0.5, 8.2, 2.8, 1.3, 0.1, 0, TAU);
    ctx.ellipse(3.6 + walkSwing * 0.5, 8.5, 3.0, 1.4, 0.12, 0, TAU);
    ctx.fill();

    // 3. Gonna e Grembiule da tessitrice di San Leucio a campana
    const skirtGrad = ctx.createLinearGradient(-12, -15, 12, 3);
    skirtGrad.addColorStop(0, colOmbraA);
    skirtGrad.addColorStop(0.5, colMediaA);
    skirtGrad.addColorStop(1, colLuceA);
    ctx.fillStyle = skirtGrad;
    ctx.strokeStyle = '#120c08';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(-5.5, -14.5);
    ctx.bezierCurveTo(-8.5, -9, -12.5, -3, -14.0, 1.2);
    ctx.quadraticCurveTo(-9.0, 3.2, -5.0, 1.5);
    ctx.quadraticCurveTo(-1.0, 3.6, 3.8, 1.8);
    ctx.quadraticCurveTo(8.0, 3.2, 12.0, 0.8);
    ctx.bezierCurveTo(10.0, -5, 7.2, -10, 4.8, -14.5);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Pieghettature del grembiule di canapa e seta
    ctx.strokeStyle = 'rgba(78, 58, 42, 0.35)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-4.5, -11); ctx.quadraticCurveTo(-6.2, -4, -8.0, 1.5);
    ctx.moveTo(-0.5, -11); ctx.quadraticCurveTo(-1.0, -4, -1.5, 2.2);
    ctx.moveTo(3.5, -10);  ctx.quadraticCurveTo(5.0, -4, 6.8, 1.8);
    ctx.stroke();

    // Manica aggraziata e Spola da Telaio di San Leucio
    ctx.fillStyle = colMediaA;
    ctx.strokeStyle = '#120c08';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-1.0, -10.5);
    ctx.quadraticCurveTo(-3.0, -5.5, -2.5, -1.8);
    ctx.quadraticCurveTo(1.0, -0.8, 3.5, -2.2);
    ctx.quadraticCurveTo(2.8, -6.5, 1.5, -10.5);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Manine in legno scuro che stringono la Spola di San Leucio
    ctx.fillStyle = '#100c0a';
    ctx.beginPath(); ctx.arc(1.2, -1.2, 2.0, 0, TAU); ctx.fill();

    // Spola da telaio (navetta affusolata in legno di pero con anima di seta rossa)
    ctx.save();
    ctx.translate(2.5, -1.0);
    ctx.rotate(-0.35);
    ctx.fillStyle = '#6d4c41';
    ctx.strokeStyle = '#271c19';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-7, 0); ctx.quadraticCurveTo(0, -2.4, 7, 0); ctx.quadraticCurveTo(0, 2.4, -7, 0);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(-2.5, -1.2, 5, 2.4);
    ctx.restore();

    // Filo di seta rosso vivo che fluisce a spirale nell\'aria dalla spola!
    const threadWave = Math.sin(tick * 0.22) * 4;
    ctx.strokeStyle = colThread;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(7, -1.5);
    ctx.bezierCurveTo(12, -4 + threadWave * 0.6, 15, 2 - threadWave * 0.5, 20, -1 + threadWave);
    ctx.stroke();
    const sparkG = ctx.createRadialGradient(20, -1 + threadWave, 0.5, 20, -1 + threadWave, 3.5);
    sparkG.addColorStop(0, '#ffffff');
    sparkG.addColorStop(0.5, 'rgba(244,63,94,0.7)');
    sparkG.addColorStop(1, 'rgba(244,63,94,0)');
    ctx.fillStyle = sparkG;
    ctx.beginPath(); ctx.arc(20, -1 + threadWave, 3.5, 0, TAU); ctx.fill();

    // 4. Collare in seta bordeaux al collo
    ctx.fillStyle = colRibbon1;
    ctx.strokeStyle = '#120a07';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-6.2, -15.2);
    ctx.quadraticCurveTo(0, -17.0, 6.0, -14.8);
    ctx.quadraticCurveTo(6.5, -12.0, 0, -11.8);
    ctx.quadraticCurveTo(-6.5, -12.2, -6.2, -15.2);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // 5. Cappuccio conico in lino grezzo chiaro con fiocchetto di seta
    const headGradA = ctx.createRadialGradient(2, -21, 2, -2, -23, 18);
    headGradA.addColorStop(0, colLuceA);
    headGradA.addColorStop(0.58, colMediaA);
    headGradA.addColorStop(1, colOmbraA);
    ctx.fillStyle = headGradA;
    ctx.strokeStyle = '#120c08';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-6.2, -15.0);
    ctx.bezierCurveTo(-10.5, -17.5, -10.8, -23.5, -7.8, -27.8);
    ctx.bezierCurveTo(-7.5, -31.5, -8.8, -36.5, -9.5, -40.5);
    ctx.bezierCurveTo(-6.2, -37.2, -2.5, -32.8, 1.2, -29.5);
    ctx.bezierCurveTo(6.8, -28.0, 9.8, -24.2, 9.2, -19.5);
    ctx.bezierCurveTo(8.5, -16.0, 4.5, -14.5, -6.2, -15.0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Nastro di seta e fiocco sul cappuccio di Agnese
    ctx.fillStyle = colRibbon1;
    ctx.strokeStyle = '#120a07';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(-6.0, -27.0, 3.6, 1.9, -0.4, 0, TAU);
    ctx.ellipse(-2.2, -28.2, 3.4, 1.7, 0.35, 0, TAU);
    ctx.fill(); ctx.stroke();

    // 6. Maschera/Viso in legno bruno con occhi tondi chiari e dolci
    ctx.strokeStyle = 'rgba(85, 66, 46, 0.65)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(3.6, -21.2, 4.8, 5.3, -0.06, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = '#0a0809';
    ctx.beginPath();
    ctx.ellipse(3.8, -21.2, 4.4, 4.9, -0.06, 0, TAU);
    ctx.fill();

    // Occhi luminosi rosei/bianchi di Agnese
    const eyeRA = shootTimer > 0 ? 1.55 : 1.30;
    for (const [ex, ey] of [[2.2, -21.0], [6.1, -21.2]]) {
      const eg = ctx.createRadialGradient(ex, ey, 0.2, ex, ey, eyeRA * 2.5);
      eg.addColorStop(0, '#ffffff');
      eg.addColorStop(0.5, 'rgba(254, 205, 211, 0.6)');
      eg.addColorStop(1, 'rgba(254, 205, 211, 0)');
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.arc(ex, ey, eyeRA * 2.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ex, ey, eyeRA, 0, TAU); ctx.fill();
    }

    ctx.restore();
    return;
  }

  // =========================================================================
  // CASO 2: TADDEO — LA GUARDIA BORBONICA (Fedele all\'artwork taddeo.jpg)
  // =========================================================================
  if (charId === 'taddeo') {
    const colIron1 = flash ? '#ffffff' : '#475569';
    const colIron2 = flash ? '#fca5a5' : '#1e293b';
    const colBrass = flash ? '#ffffff' : '#d97706';
    const colBrassDark = flash ? '#fef08a' : '#78350f';
    const colTunic = flash ? '#f87171' : '#1c1917';

    // 1. Gambe robuste e cosciali di cuoio/ferro
    const walkSwingT = moving ? Math.sin(tick * 0.34) * 3.0 : 0;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(-3.5, 0); ctx.lineTo(-4.0 - walkSwingT * 0.5, 8.0); ctx.stroke();
    ctx.moveTo(3.2, 0);  ctx.lineTo(3.5 + walkSwingT * 0.5, 8.5); ctx.stroke();

    // Stivaletti borbonici con fibbia d\'ottone
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(-3.5 - walkSwingT * 0.5, 8.8, 3.8, 1.8, 0.1, 0, TAU);
    ctx.ellipse(4.2 + walkSwingT * 0.5, 9.2, 4.0, 1.9, 0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = colBrass;
    ctx.fillRect(-4.5 - walkSwingT * 0.5, 8.0, 2.2, 1.6);
    ctx.fillRect(3.2 + walkSwingT * 0.5, 8.4, 2.2, 1.6);

    // 2. Corazza toracica in ferro battuto con spallacci e tunica scura
    ctx.fillStyle = colTunic;
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-7.5, -14); ctx.lineTo(-11.5, 1.5); ctx.lineTo(11.5, 1.5); ctx.lineTo(7.5, -14);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Pettorale sagomato in ferro con rivetti
    const ironGrad = ctx.createLinearGradient(-8, -14, 8, 0);
    ironGrad.addColorStop(0, colIron2);
    ironGrad.addColorStop(0.5, colIron1);
    ironGrad.addColorStop(1, colIron2);
    ctx.fillStyle = ironGrad;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(-8.5, -4);
    ctx.quadraticCurveTo(0, 3, 8.5, -4);
    ctx.lineTo(6, -14);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Cinghia a tracolla in cuoio con borchie dorate
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-7, -13); ctx.lineTo(6, 0); ctx.stroke();
    ctx.fillStyle = colBrass;
    ctx.beginPath();
    ctx.arc(0, -6.5, 1.5, 0, TAU);
    ctx.arc(-4, -10.5, 1.2, 0, TAU);
    ctx.arc(4, -2.5, 1.2, 0, TAU);
    ctx.fill();

    // Spallacci corazzati d\'ottone e ferro
    ctx.fillStyle = colBrassDark;
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.ellipse(-7.5, -13.5, 3.8, 2.4, -0.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(7.5, -13.5, 3.8, 2.4, 0.2, 0, TAU); ctx.fill(); ctx.stroke();

    // 3. Braccia robuste e Pesante Martello da Fabbro / Spadone di Taddeo
    ctx.fillStyle = '#292524';
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(8.5, -3.5, 2.5, 0, TAU); ctx.fill(); ctx.stroke();

    // Martellone da forgia borbonico in ferro battuto
    ctx.save();
    ctx.translate(9.5, -2.5);
    ctx.rotate(0.35 + (moving ? Math.sin(tick * 0.34) * 0.15 : 0));
    // Manico di frassino
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#271c19';
    ctx.lineWidth = 0.9;
    ctx.fillRect(-1.5, -16, 3.0, 26);
    ctx.strokeRect(-1.5, -16, 3.0, 26);
    // Testa del martello in acciaio brunito
    const hammerG = ctx.createLinearGradient(-6, -18, 6, -12);
    hammerG.addColorStop(0, '#64748b');
    hammerG.addColorStop(0.5, '#1e293b');
    hammerG.addColorStop(1, '#0f172a');
    ctx.fillStyle = hammerG;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-6.5, -20, 13.0, 8.0);
    ctx.strokeRect(-6.5, -20, 13.0, 8.0);
    // Fascia di rinforzo in ottone
    ctx.fillStyle = colBrass;
    ctx.fillRect(-2, -20, 4, 8);
    ctx.restore();

    // 4. Morione Borbonico d\'Ottone e Ferro con Cresta Alta
    const morioneG = ctx.createLinearGradient(-10, -36, 10, -20);
    morioneG.addColorStop(0, colBrass);
    morioneG.addColorStop(0.4, colBrassDark);
    morioneG.addColorStop(1, '#271c19');
    ctx.fillStyle = morioneG;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    // Tesa curva a becco anteriore e posteriore
    ctx.moveTo(-11.5, -22);
    ctx.quadraticCurveTo(-1, -25, 12.5, -22);
    ctx.quadraticCurveTo(8, -26, 4, -28);
    // Cresta alta arcuata del morione
    ctx.bezierCurveTo(7, -35, 3, -42, -1, -43);
    ctx.bezierCurveTo(-5, -42, -9, -35, -8, -28);
    ctx.quadraticCurveTo(-10, -26, -11.5, -22);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Cordone di rivetti d\'acciaio lungo la calotta dell\'elmo
    ctx.fillStyle = colIron1;
    for (const [rx, ry] of [[-6, -26], [-3, -29], [0, -31], [3, -29], [6, -26]]) {
      ctx.beginPath(); ctx.arc(rx, ry, 1.1, 0, TAU); ctx.fill();
    }

    // Cresta centrale dorata sagomata
    ctx.strokeStyle = colBrass;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-1, -43);
    ctx.bezierCurveTo(3, -37, 4, -30, 2, -26);
    ctx.stroke();

    // 5. Visiera d\'ombra e Occhi Ambrati/Dorati ardenti di Taddeo
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.ellipse(1.5, -19.5, 7.5, 4.2, 0, 0, TAU);
    ctx.fill();

    // Due fari ambrati severi e decisi
    const eyeRT = shootTimer > 0 ? 1.6 : 1.35;
    for (const [ex, ey] of [[-1.2, -19.5], [4.5, -19.5]]) {
      const eg = ctx.createRadialGradient(ex, ey, 0.2, ex, ey, eyeRT * 2.6);
      eg.addColorStop(0, '#fef08a');
      eg.addColorStop(0.5, 'rgba(245, 158, 11, 0.65)');
      eg.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.arc(ex, ey, eyeRT * 2.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ex, ey, eyeRT, 0, TAU); ctx.fill();
    }

    ctx.restore();
    return;
  }

  // =========================================================================
  // CASO 3 & 4: FERRUCCIO (Default) & PULCINELLA D\'OMBRA
  // =========================================================================
  const isOmbra = charId === 'ombra';
  const colLuce = flash ? '#ffffff' : isOmbra ? '#3e3552' : '#fcf5e6';
  const colMedia = flash ? '#ffffff' : isOmbra ? '#241e30' : '#dfd1b6';
  const colOmbra = flash ? '#f87171' : isOmbra ? '#110d18' : '#96856b';
  const colScarf1 = flash ? '#ffffff' : '#df3624';
  const colScarf2 = flash ? '#fca5a5' : '#85160c';
  const colOcchi = sinergie.patto_raggio ? '#ff3b30' : isOmbra ? '#fbbf24' : '#fffdf5';

  // Sinergia Visiva: Aura Sacra / Cuore Sacro o Catena Elettrica
  if (sinergie.patto_sacro) {
    const ag = ctx.createRadialGradient(0, -14, 2, 0, -14, 24);
    ag.addColorStop(0, 'rgba(250, 204, 21, 0.35)');
    ag.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.arc(0, -14, 24, 0, TAU); ctx.fill();
  }

  // 1. CODE ONDULATE DELLA SCIARPA ROSSA (2 lunghi nastri mossi dal vento a sinistra, come nel dipinto!)
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = colScarf1;
  ctx.strokeStyle = '#120a07';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-4, -15);
  ctx.bezierCurveTo(-13, -18 - wave * 0.4, -22, -12 + wave * 0.7, -30, -15 + wave);
  ctx.bezierCurveTo(-24, -9 + wave * 0.6, -14, -12, -4, -11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colScarf2;
  ctx.beginPath();
  ctx.moveTo(-3, -12);
  ctx.bezierCurveTo(-12, -10 + wave2 * 0.3, -19, -3 - wave2 * 0.6, -27, -1 - wave2);
  ctx.bezierCurveTo(-24, 4 - wave2 * 0.8, -15, -3, -3, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sinergia Visiva: Tizzone di Bragia (fiamme vive sulle code della sciarpa)
  if (sinergie.fuoco) {
    for (let i = 0; i < 3; i++) {
      const fx = -14 - i * 5 + Math.sin(tick * 0.3 + i) * 2;
      const fy = -10 + i * 2 + Math.cos(tick * 0.25 + i) * 2;
      ctx.fillStyle = i % 2 === 0 ? '#fb923c' : '#fde047';
      ctx.beginPath(); ctx.arc(fx, fy, 2.2 - i * 0.3, 0, TAU); ctx.fill();
    }
  }

  // 2. GAMBETTE SOTTILI SCURE E SCARPETTE NERE
  const walkSwing = moving ? Math.sin(tick * 0.34) * 3.2 : 0;
  ctx.strokeStyle = '#110d0a';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-2.5, -1);
  ctx.lineTo(-3 - walkSwing * 0.5, 7.5);
  ctx.stroke();

  ctx.fillStyle = '#0d0907';
  ctx.beginPath();
  ctx.ellipse(-2 - walkSwing * 0.5, 8.2, 3.0, 1.4, 0.1, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = '#18120e';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(2.2, -1);
  ctx.lineTo(2.5 + walkSwing * 0.5, 8.0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(180, 148, 112, 0.35)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(2.8, 0);
  ctx.lineTo(3.0 + walkSwing * 0.5, 7.5);
  ctx.stroke();

  ctx.fillStyle = '#120d0a';
  ctx.beginPath();
  ctx.ellipse(3.6 + walkSwing * 0.5, 8.5, 3.3, 1.5, 0.12, 0, TAU);
  ctx.fill();

  // 3. MANTELLO / CAMICIONE A CAMPANA IN STOFFA CREMA CON PIEGHE PITTORICHE
  const cloakGrad = ctx.createLinearGradient(-11, -15, 11, 2);
  cloakGrad.addColorStop(0, colOmbra);
  cloakGrad.addColorStop(0.52, colMedia);
  cloakGrad.addColorStop(1, colLuce);

  ctx.fillStyle = cloakGrad;
  ctx.strokeStyle = '#120c08';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(-5.5, -14.5);
  ctx.bezierCurveTo(-8.5, -9, -11.5, -3.5, -13.0, 0.8);
  ctx.quadraticCurveTo(-8.5, 2.5, -5.0, 1.2);
  ctx.quadraticCurveTo(-1.0, 3.0, 3.5, 1.5);
  ctx.quadraticCurveTo(7.5, 2.8, 11.2, 0.5);
  ctx.bezierCurveTo(9.5, -5, 7.0, -10, 4.8, -14.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = isOmbra ? 'rgba(0,0,0,0.55)' : 'rgba(62, 46, 30, 0.38)';
  ctx.lineWidth = 0.95;
  ctx.beginPath();
  ctx.moveTo(-4.5, -11); ctx.quadraticCurveTo(-6.5, -5, -8.2, 1.0);
  ctx.moveTo(-1.0, -11); ctx.quadraticCurveTo(-1.5, -4, -2.0, 1.8);
  ctx.moveTo(3.2, -10);  ctx.quadraticCurveTo(4.8, -4, 6.2, 1.4);
  ctx.stroke();

  ctx.fillStyle = colMedia;
  ctx.strokeStyle = '#120c08';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-1.5, -10.5);
  ctx.quadraticCurveTo(-3.5, -5.5, -3.2, -1.8);
  ctx.quadraticCurveTo(0.5, -0.8, 3.2, -2.2);
  ctx.quadraticCurveTo(2.5, -6.5, 1.2, -10.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0e0b09';
  ctx.beginPath();
  ctx.arc(1.2, -1.0, 2.0, 0, TAU);
  ctx.fill();

  // Sinergia Visiva: Cuore Sacro / Medaglione sul petto
  if (sinergie.patto_sacro || sinergie.cuore) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(3.5, -7.5, 2.1, 0, TAU); ctx.fill();
  }

  // 4. COLLARE DELLA SCIARPA ROSSA AVVOLTO AL COLLO
  const scarfGrad = ctx.createLinearGradient(-7, -16, 7, -12);
  scarfGrad.addColorStop(0, colScarf2);
  scarfGrad.addColorStop(0.6, colScarf1);
  scarfGrad.addColorStop(1, '#ff644c');
  ctx.fillStyle = scarfGrad;
  ctx.strokeStyle = '#120a07';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-6.5, -15.2);
  ctx.quadraticCurveTo(0, -17.0, 6.2, -14.8);
  ctx.quadraticCurveTo(6.8, -12.0, 0, -11.8);
  ctx.quadraticCurveTo(-6.8, -12.2, -6.5, -15.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5. CAPPUCCIO CONICO CONTINUO IN LINO CREMA + TESTA TONDA
  const headGrad = ctx.createRadialGradient(2, -21, 2, -2, -23, 18);
  headGrad.addColorStop(0, colLuce);
  headGrad.addColorStop(0.58, colMedia);
  headGrad.addColorStop(1, colOmbra);

  ctx.fillStyle = headGrad;
  ctx.strokeStyle = '#120c08';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-6.2, -15.0);
  ctx.bezierCurveTo(-10.5, -17.5, -10.8, -23.5, -7.8, -27.8);
  ctx.bezierCurveTo(-7.5, -31.5, -8.8, -36.5, -9.5, -40.5);
  ctx.bezierCurveTo(-6.2, -37.2, -2.5, -32.8, 1.2, -29.5);
  ctx.bezierCurveTo(6.8, -28.0, 9.8, -24.2, 9.2, -19.5);
  ctx.bezierCurveTo(8.5, -16.0, 4.5, -14.5, -6.2, -15.0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = isOmbra ? 'rgba(0,0,0,0.5)' : 'rgba(72, 55, 38, 0.35)';
  ctx.lineWidth = 0.85;
  ctx.beginPath();
  ctx.moveTo(-7.2, -27.5);
  ctx.quadraticCurveTo(-2.8, -26.8, 0.8, -28.8);
  ctx.moveTo(-7.8, -31.2);
  ctx.quadraticCurveTo(-4.5, -30.5, -2.0, -32.2);
  ctx.stroke();

  // 6. VOLTO OVALE INCAVATO NERO CORVINO CON I DUE OCCHI TONDI BIANCHI LUMINOSI
  ctx.strokeStyle = isOmbra ? '#4c1d95' : 'rgba(85, 66, 46, 0.65)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(3.6, -21.2, 4.9, 5.4, -0.06, 0, TAU);
  ctx.stroke();

  ctx.fillStyle = sinergie.piombo ? '#1e293b' : '#06070a';
  ctx.beginPath();
  ctx.ellipse(3.8, -21.2, 4.5, 5.0, -0.06, 0, TAU);
  ctx.fill();

  const eyeR = (shootTimer > 0 ? 1.55 : 1.30) * (sinergie.piombo ? 1.25 : 1.0);
  for (const [ex, ey] of [[2.2, -21.0], [6.1, -21.2]]) {
    const eg = ctx.createRadialGradient(ex, ey, 0.2, ex, ey, eyeR * 2.4);
    eg.addColorStop(0, colOcchi);
    eg.addColorStop(0.5, sinergie.patto_raggio ? 'rgba(239,68,68,0.55)' : 'rgba(255, 243, 200, 0.48)');
    eg.addColorStop(1, 'rgba(255, 243, 200, 0)');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(ex, ey, eyeR * 2.4, 0, TAU); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex, ey, eyeR, 0, TAU); ctx.fill();
  }

  // Sinergie Visive
  if (sinergie.triplo) {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.arc(4.1, -24.0, 1.25, 0, TAU); ctx.fill();
  }
  if (sinergie.doppia) {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.arc(2.2, -21.0, 1.9, 0, TAU);
    ctx.arc(6.1, -21.2, 1.9, 0, TAU);
    ctx.stroke();
  }
  if (sinergie.anello) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-2, -42.5, 6.5, 2.0, -0.1, 0, TAU);
    ctx.stroke();
  }

  // 7. LO STOCCO DI FERRUCCIO
  if (haSpada) {
    ctx.save();
    let ang = 0.78;
    let ox = 2.5, oy = -1.0;
    if (swordAnimTick >= 0 && swordAnimTick < 14) {
      ang = swordAngle + Math.sin(swordAnimTick * 0.28) * 0.6;
      ox = 4.0; oy = -2.0;
    }
    ctx.translate(ox, oy);
    ctx.rotate(ang);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, 2.4, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-0.8, -4.5, 1.6, 4.5);
    ctx.fillStyle = '#d4af37';
    ctx.beginPath(); ctx.arc(0, -4.8, 1.2, 0, TAU); ctx.fill();

    const bladeGrad = ctx.createLinearGradient(-0.9, 0, 0.9, 19);
    bladeGrad.addColorStop(0, '#f8fafc');
    bladeGrad.addColorStop(0.5, '#cbd5e1');
    bladeGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = bladeGrad;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-1.1, 0);
    ctx.lineTo(0, 19.5);
    ctx.lineTo(1.1, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 18.5);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

function disegnaManoMarionettaPittorica() {
  let args = Array.from(arguments);
  if (args[0] && typeof args[0].save === 'function') args.shift();
  const cx = args[0] || 0;
  const cy = args[1] || 0;
  // --- A: inizio ---
  // Ordine unico: (x, y, lato, scala, tick, flash); lato +1 = Mano sinistra, -1 = Mano destra.
  // Prima alcune chiamate passavano (x, y, scala, flipBool, ...) e scala=false dava ctx.scale(0, 0).
  const latoGrezzo = typeof args[2] === 'boolean' ? (args[2] ? -1 : 1) : (args[2] ?? 1);
  const lato = latoGrezzo < 0 ? -1 : 1;
  const scala = typeof args[3] === 'number' && args[3] > 0 ? args[3] : 1;
  // --- A: fine ---
  let tick = 0, flash = false;
  for (let i = 4; i < args.length; i++) {
    if (typeof args[i] === 'boolean') flash = args[i];
    else if (typeof args[i] === 'number') tick = args[i];
  }
  const swayX = Math.sin(tick * 0.04 + lato) * 4;
  const swayY = Math.cos(tick * 0.05 + lato) * 2;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(cx + swayX, cy + swayY);
  ctx.scale(lato * scala, scala);

  // Polsino con merletto barocco
  ctx.fillStyle = flash ? '#ffffff' : '#160d08';
  ctx.strokeStyle = '#f9cb40';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-18, -22);
  ctx.lineTo(-13, -7);
  ctx.quadraticCurveTo(0, -3, 13, -7);
  ctx.lineTo(18, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mano scolpita in porcellana/legno d'ombra con dita articolate
  const hg = ctx.createLinearGradient(-14, -6, 14, 16);
  hg.addColorStop(0, flash ? '#ffffff' : '#f5e4c3');
  hg.addColorStop(1, flash ? '#fca5a5' : '#b89466');
  ctx.fillStyle = hg;
  ctx.strokeStyle = '#0d0704';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-12, -6);
  ctx.lineTo(-19, 5);
  ctx.quadraticCurveTo(-15, 9, -10, 3);
  ctx.lineTo(-11, 15);
  ctx.quadraticCurveTo(-8, 18, -5, 6);
  ctx.lineTo(-1, 17);
  ctx.quadraticCurveTo(2, 19, 3, 6);
  ctx.lineTo(9, 15);
  ctx.quadraticCurveTo(12, 17, 11, 5);
  ctx.lineTo(17, 11);
  ctx.quadraticCurveTo(19, 8, 12, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bilancino di legno (croce da burattinaio)
  ctx.fillStyle = '#3b1d0b';
  ctx.strokeStyle = '#f9cb40';
  ctx.lineWidth = 1.0;
  ctx.fillRect(-22, 13, 44, 4);
  ctx.strokeRect(-22, 13, 44, 4);
  ctx.fillStyle = '#f9cb40';
  for (const kx of [-20, 0, 20]) {
    ctx.beginPath(); ctx.arc(kx, 15, 1.8, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ===========================================================================
// SISTEMA SPRITE TEATRALI 2D (MODEL SHEET APPROVATI)
// ===========================================================================
const SPRITE_TEATRO_CACHE = {};
function getSpriteTeatro(nome) {
  if (!SPRITE_TEATRO_CACHE[nome]) {
    const im = new Image();
    const uri = (window.__risorseTeatro && window.__risorseTeatro[`assets/sprite_teatro/${nome}.png`])
      || `assets/sprite_teatro/${nome}.png`;
    im.src = uri;
    SPRITE_TEATRO_CACHE[nome] = im;
  }
  const img = SPRITE_TEATRO_CACHE[nome];
  return (img && img.complete && img.naturalWidth > 0) ? img : null;
}

function getGattoImage(posa) {
  return getSpriteTeatro(`gatto_${posa}`);
}

function disegnaMobSprite(ctx, nome, x, y, scaleH, flip = 1, flash = false) {
  const img = getSpriteTeatro(nome);
  if (!img) return false;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip, 1);
  const targetH = scaleH;
  const targetW = targetH * (img.naturalWidth / img.naturalHeight);
  const drawX = -targetW / 2;
  const drawY = -targetH;
  if (flash) ctx.filter = 'brightness(3) contrast(1.5)';
  ctx.drawImage(img, drawX, drawY, targetW, targetH);
  ctx.restore();
  return true;
}

function disegnaGattoSprite(ctx, posa, x, y, scaleH, flip, flash, isBoss = false) {
  const img = getGattoImage(posa);
  if (!img) return false;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip, 1);
  const targetH = scaleH;
  const targetW = targetH * (img.naturalWidth / img.naturalHeight);
  // Ancorato ai piedi in basso al centro
  const drawX = -targetW / 2;
  const drawY = -targetH;
  if (flash) ctx.filter = 'brightness(3) contrast(1.5)';
  ctx.drawImage(img, drawX, drawY, targetW, targetH);
  if (isBoss) {
    // Corona borbonica sulla testa del Re Gatto
    ctx.fillStyle = '#f9cb40';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.0;
    const cx = targetW * 0.22, cy = drawY + targetH * 0.16;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy); ctx.lineTo(cx - 5, cy - 8); ctx.lineTo(cx, cy - 3); ctx.lineTo(cx + 5, cy - 8); ctx.lineTo(cx + 7, cy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(cx, cy - 3, 1.6, 0, TAU); ctx.fill();
  }
  ctx.restore();
  return true;
}

// Disegno pittorico differenziato per ogni archetipo di Nemico stile The Binding of Isaac!
function disegnaNemicoPittorico() {
  const args = Array.from(arguments);
  if (args[0] && typeof args[0].save === 'function') args.shift();
  const n = args[0];
  const tick = args[1] || 0;
  if (!n) return;
  const { x, y, tipo, flash, champion, state, stateTimer, maskOpen } = n;
  const isFlash = flash > 0;
  const flip = player.x < x ? -1 : 1;

  ctx.save();
  ctx.imageSmoothingEnabled = true;

  // --- A: inizio --- tolto il terzo filo verticale: bastano i due di disegnaFiliMarionetta --- A: fine ---

  // 2. Ombra a terra morbida ellittica
  const shadowR = n.r ? Math.max(9, n.r * 0.9) : 12;
  const nsh = ctx.createRadialGradient(x, y + 4, 1, x, y + 4, shadowR);
  nsh.addColorStop(0, 'rgba(8, 5, 3, 0.68)');
  nsh.addColorStop(1, 'rgba(8, 5, 3, 0)');
  ctx.fillStyle = nsh;
  ctx.save();
  ctx.translate(x, y + 4);
  ctx.scale(1, 0.36);
  ctx.beginPath();
  ctx.arc(0, 0, shadowR, 0, TAU);
  ctx.fill();
  ctx.restore();

  // 3. Aura da Campione Colorato (Proposta 6: 🔴 Cremisi, 🟡 Dorato, 🔵 Elettrico)
  if (champion) {
    const colChamp = champion === 'cremisi' ? 'rgba(239,68,68,0.45)' : champion === 'dorato' ? 'rgba(250,204,21,0.48)' : 'rgba(56,189,248,0.48)';
    const cg = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, n.r + 12);
    cg.addColorStop(0, colChamp);
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(x, y - 6, n.r + 12, 0, TAU); ctx.fill();
  }

  // Se è immobilizzato dalle Forbici di Gaetano (Attivo [Q]), mostra i fili tagliati e stordimento
  if (n.stunTicks > 0) {
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(x, y - 20, 7, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#67e8f9';
    ctx.font = '8px monospace';
    ctx.fillText('✂', x - 4, y - 24);
  }

  // (T1) Nessun segno a terra degli attacchi nemici: il balzo del Gatto si legge dalla posa accucciata.

  ctx.translate(x, y);
  if (champion) ctx.scale(1.18, 1.18);
  // Sprite procedurali originali amati (Gatto, Vespa, Bomba, Statua, Guardia, Maschera, Predone)
  // if (t2Gancio('nemico', ctx, n, tick)) { ctx.restore(); return; }

  const tint = isFlash
    ? '#ffffff'
    : champion === 'cremisi'
      ? '#dc2626'
      : champion === 'dorato'
        ? '#eab308'
        : champion === 'elettrico'
          ? '#0284c7'
          : null;

  // =========================================================================
  // 1. VESPA CIECA / VESPA D'OMBRA (Isaac Attack Fly / Pooter)
  // =========================================================================
  if (tipo === 'vespa_cieca' || tipo === 'vespa') {
    const hoverY = Math.sin(tick * 0.16) * 3.5 - 6;
    if (disegnaMobSprite(ctx, 'vespa_cieca', 0, hoverY, 26, flip, isFlash)) {
      ctx.restore();
      return;
    }
    const wingWave = Math.sin(tick * 0.95) * 5.5;
    ctx.scale(flip, 1);

    // Doppia coppia di ali diafane con nervature chine
    ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.lineWidth = 0.85;
    // Ala anteriore superiore
    ctx.beginPath();
    ctx.ellipse(-4, -14 + wingWave * 0.45, 9, 4.2, -0.4, 0, TAU);
    ctx.fill(); ctx.stroke();
    // Nervature
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.beginPath();
    ctx.moveTo(-4, -14 + wingWave * 0.45); ctx.lineTo(-10, -16 + wingWave * 0.5);
    ctx.stroke();
    // Ala posteriore
    ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
    ctx.beginPath();
    ctx.ellipse(3, -15 - wingWave * 0.35, 7.5, 3.6, 0.35, 0, TAU);
    ctx.fill(); ctx.stroke();

    // Carapace in 3 segmenti (testa, torace, addome a strisce)
    const chitinG = ctx.createLinearGradient(-6, -12, 6, 0);
    chitinG.addColorStop(0, tint || (tipo === 'vespa_cieca' ? '#2e1065' : '#78350f'));
    chitinG.addColorStop(0.5, tint || (tipo === 'vespa_cieca' ? '#1e1b24' : '#b45309'));
    chitinG.addColorStop(1, '#090604');
    ctx.fillStyle = chitinG;
    ctx.strokeStyle = '#050302';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, -6, 8.5, 6.0, 0, 0, TAU);
    ctx.fill(); ctx.stroke();

    // Anelli chitinici dell'addome
    ctx.strokeStyle = tipo === 'vespa_cieca' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-5, -6); ctx.lineTo(5, -6);
    ctx.moveTo(-4, -3); ctx.lineTo(4, -3);
    ctx.stroke();

    // Zampette in fil di ferro curvato
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-3, -2); ctx.lineTo(-5, 3);
    ctx.moveTo(1, -2); ctx.lineTo(1, 4);
    ctx.moveTo(4, -2); ctx.lineTo(6, 3);
    ctx.stroke();

    // Aculeo ricurvo
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(-7, -5); ctx.lineTo(-11, -3); ctx.lineTo(-6, -7);
    ctx.closePath(); ctx.fill();

    // Occhi sfaccettati ardenti (rosso cremisi per vespa cieca, ambra per vespa)
    const colVespaEye = tipo === 'vespa_cieca' ? '#ef4444' : '#facc15';
    const eyeVg = ctx.createRadialGradient(4.5, -7.5, 0.2, 4.5, -7.5, 3.5);
    eyeVg.addColorStop(0, '#ffffff');
    eyeVg.addColorStop(0.5, colVespaEye);
    eyeVg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eyeVg;
    ctx.beginPath(); ctx.arc(4.5, -7.5, 3.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(4.5, -7.5, 1.3, 0, TAU); ctx.fill();

  // =========================================================================
  // 2. BOMBA FERMA / BOZZO DI BRACE (Isaac Boil / Mulliboom)
  // =========================================================================
  } else if (tipo === 'bomba_ferma') {
    const isPrimed = state === 'primed';
    const sprBomba = isPrimed ? 'bomba_ferma_accesa' : 'bomba_ferma_ferma';
    const targetH = isPrimed ? 32 : 28;
    if (disegnaMobSprite(ctx, sprBomba, 0, 4, targetH, flip, isFlash)) {
      ctx.restore();
      return;
    }
    const pulse = 1 + Math.sin(tick * (isPrimed ? 0.75 : 0.22)) * (isPrimed ? 0.22 : 0.08);
    ctx.scale(pulse, 1 / (0.6 + pulse * 0.4));

    // Aura d'esplosione imminente se primed
    if (isPrimed) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, -7, 28 + (tick % 6) * 1.5, 0, TAU); ctx.stroke();
    }

    // Corpo bulboso a toppe di tela grezza e braci ardenti
    const bg = ctx.createRadialGradient(-3, -10, 1, 0, -7, 13);
    bg.addColorStop(0, isFlash ? '#ffffff' : isPrimed ? '#fef08a' : '#fb923c');
    bg.addColorStop(0.45, tint || (isPrimed ? '#ef4444' : '#b91c1c'));
    bg.addColorStop(0.85, '#450a0a');
    bg.addColorStop(1, '#160404');
    ctx.fillStyle = bg;
    ctx.strokeStyle = '#0a0504';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -7, 11.5, 0, TAU);
    ctx.fill(); ctx.stroke();

    // Cuciture a croce (toppe di juta da marionetta)
    ctx.strokeStyle = '#271c19';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    // Toppa 1
    ctx.moveTo(-6, -11); ctx.lineTo(-2, -5);
    ctx.moveTo(-5, -6); ctx.lineTo(-7, -4);
    ctx.moveTo(-2, -9); ctx.lineTo(-4, -7);
    // Toppa 2
    ctx.moveTo(3, -11); ctx.lineTo(7, -6);
    ctx.moveTo(4, -7); ctx.lineTo(6, -5);
    ctx.stroke();

    // Collare metallico e miccia fumante con faville
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#1c1917';
    ctx.fillRect(-2.5, -17, 5, 2.5);
    ctx.strokeRect(-2.5, -17, 5, 2.5);

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -17); ctx.quadraticCurveTo(4, -22, 6, -21);
    ctx.stroke();

    // Faville ardenti vive dalla miccia
    const sparkCol = (tick % 2 === 0) ? '#fef08a' : '#f97316';
    ctx.fillStyle = sparkCol;
    ctx.beginPath();
    ctx.arc(6.5, -21.5, 2.4, 0, TAU);
    ctx.arc(4 + Math.sin(tick * 0.4) * 3, -25 - (tick % 5), 1.2, 0, TAU);
    ctx.fill();

    // Occhi fessurati che piangono braci incandescenti
    ctx.fillStyle = isPrimed ? '#ffffff' : '#fef08a';
    ctx.beginPath();
    ctx.ellipse(-3.5, -7.5, 2.0, 1.2, -0.2, 0, TAU);
    ctx.ellipse(3.5, -7.5, 2.0, 1.2, 0.2, 0, TAU);
    ctx.fill();

  // =========================================================================
  // 3. GATTO D'OMBRA / GATTO GRANDE (Isaac Hopper / Trite — Il Gatto dei Quattro Canti)
  // =========================================================================
  } else if (tipo === 'gatto') {
    const isCrouch = (n.crouchTicks > 0) || state === 'crouch';
    const isLeap = (n.leapTimer > 0) || state === 'leap';
    const isMoving = Math.abs(n.vx || 0) > 0.1 || Math.abs(n.vy || 0) > 0.1;
    const posa = isCrouch ? 'accucciato' : isLeap ? 'salto' : isMoving ? 'cammina' : 'fermo';
    const targetH = isCrouch ? 22 : isLeap ? 25 : isMoving ? 24 : 32;

    if (!disegnaGattoSprite(ctx, posa, 0, 4, targetH, flip, isFlash, false)) {
    const walkAnim = isMoving && !isCrouch && !isLeap ? Math.sin(tick * 0.32) : 0;

    // Scala Gatto Grande: maestoso, slanciato, fedele al model sheet Ferruccio
    ctx.scale(flip * 1.35, 1.35);

    // Traslazione posa
    if (isCrouch) {
      ctx.translate(2, 3);
      ctx.scale(1.12, 0.68);
    } else if (isLeap) {
      ctx.translate(6, -2);
      ctx.scale(1.28, 0.82);
    }

    // Palette ebano e legno intagliato (fedele al model sheet)
    const cMain = tint || '#181513';
    const cDeep = tint || '#0c0a09';
    const cRim = tint ? '#ffffff' : '#332d28';
    const cFar = tint || '#100e0c';
    const cRivetRim = '#44403c';
    const cRivetPin = '#d97706';
    const cEyeCol = (isCrouch || isLeap) ? '#ef4444' : '#f59e0b';

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Zampe del lato opposto (in ombra/secondo piano)
    ctx.fillStyle = cFar;
    ctx.strokeStyle = '#050403';
    ctx.lineWidth = 1.0;
    // Zampa posteriore lontana
    ctx.beginPath();
    ctx.moveTo(-10 + walkAnim * 3, -13);
    ctx.lineTo(-14 + walkAnim * 4, -4);
    ctx.lineTo(-12 + walkAnim * 4, 1);
    ctx.lineTo(-8 + walkAnim * 4, 1);
    ctx.lineTo(-7 + walkAnim * 3, -8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Zampa anteriore lontana
    ctx.beginPath();
    ctx.moveTo(9 - walkAnim * 3, -12);
    ctx.lineTo(11 - walkAnim * 4, -3);
    ctx.lineTo(13 - walkAnim * 4, 1);
    ctx.lineTo(9 - walkAnim * 4, 1);
    ctx.lineTo(7 - walkAnim * 3, -7);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // 2. Coda marionetta segmentata a molla inarcata verso l'alto
    const tailWave = Math.sin(tick * 0.22) * 3.5;
    ctx.strokeStyle = cDeep;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-13, -12);
    ctx.bezierCurveTo(-19, -18, -22, -26 + tailWave, -15, -30 + tailWave);
    ctx.bezierCurveTo(-11, -32 + tailWave, -10, -26 + tailWave, -14, -23 + tailWave);
    ctx.stroke();
    // Perno anello punta coda
    ctx.fillStyle = cRivetPin;
    ctx.beginPath(); ctx.arc(-13.5, -28 + tailWave, 1.1, 0, TAU); ctx.fill();

    // 3. Torso e groppa intagliata
    const bodyG = ctx.createLinearGradient(-14, -22, 12, 2);
    bodyG.addColorStop(0, cRim);
    bodyG.addColorStop(0.35, cMain);
    bodyG.addColorStop(1, cDeep);
    ctx.fillStyle = bodyG;
    ctx.strokeStyle = '#050403';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-14, -13); // attaccatura coda
    ctx.bezierCurveTo(-11, -21, -2, -22, 5, -17); // arco groppa
    ctx.bezierCurveTo(8, -19, 11, -16, 12, -11); // collo
    ctx.bezierCurveTo(12, -5, 6, -3, 0, -4); // petto e ventre
    ctx.bezierCurveTo(-6, -4, -12, -7, -14, -13);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // 4. Giunto e zampa posteriore primo piano (grande snodo a rivetto)
    // Coscia posteriore
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(-9, -12, 6.2, 5.0, -0.2, 0, TAU);
    ctx.fill(); ctx.stroke();
    // Rivetto anca posteriore
    ctx.fillStyle = cRivetRim;
    ctx.beginPath(); ctx.arc(-9, -12, 2.6, 0, TAU); ctx.fill();
    ctx.fillStyle = cRivetPin;
    ctx.beginPath(); ctx.arc(-9, -12, 1.2, 0, TAU); ctx.fill();
    // Gamba posteriore e zampa
    ctx.beginPath();
    ctx.moveTo(-9, -8);
    ctx.lineTo(-13 - walkAnim * 3, -1);
    ctx.lineTo(-10 - walkAnim * 3, 2);
    ctx.lineTo(-6 - walkAnim * 3, 2);
    ctx.lineTo(-5, -6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // 5. Giunto e zampa anteriore primo piano
    // Spalla anteriore
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(7, -11, 4.8, 4.2, 0.3, 0, TAU);
    ctx.fill(); ctx.stroke();
    // Rivetto spalla
    ctx.fillStyle = cRivetRim;
    ctx.beginPath(); ctx.arc(7, -11, 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = cRivetPin;
    ctx.beginPath(); ctx.arc(7, -11, 1.0, 0, TAU); ctx.fill();
    // Avambraccio e zampa anteriore
    ctx.beginPath();
    ctx.moveTo(7, -7);
    ctx.lineTo(9 + walkAnim * 3, -1);
    ctx.lineTo(12 + walkAnim * 3, 2);
    ctx.lineTo(7 + walkAnim * 3, 2);
    ctx.lineTo(5, -6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Artigli estratti se in salto
    if (isLeap) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(13, 1); ctx.lineTo(18, -1);
      ctx.moveTo(13, 3); ctx.lineTo(19, 3);
      ctx.stroke();
    }

    // 6. Testa felina scolpita in legno d'ebano (STESSO COLORE DEL CORPO, NO GIALLO!)
    const headG = ctx.createLinearGradient(7, -24, 18, -8);
    headG.addColorStop(0, cRim);
    headG.addColorStop(0.4, cMain);
    headG.addColorStop(1, cDeep);
    ctx.fillStyle = headG;
    ctx.strokeStyle = '#050403';
    ctx.lineWidth = 1.2;

    // Cranio e muso felino affusolato
    ctx.beginPath();
    ctx.moveTo(8, -14); // gola
    ctx.lineTo(15, -11); // mandibola
    ctx.lineTo(18, -13); // mento
    ctx.lineTo(19, -15); // tartufo/naso
    ctx.lineTo(14, -18); // fronte
    ctx.lineTo(12, -24); // orecchio anteriore punta
    ctx.lineTo(9, -19); // base orecchio
    ctx.lineTo(7, -23); // orecchio posteriore punta
    ctx.lineTo(5, -18); // nuca
    ctx.bezierCurveTo(6, -15, 7, -14, 8, -14);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Interno orecchio in velluto scuro bordeaux
    ctx.fillStyle = '#4c0519';
    ctx.beginPath();
    ctx.moveTo(10.5, -18.5); ctx.lineTo(12, -22.5); ctx.lineTo(13.5, -18);
    ctx.closePath();
    ctx.fill();

    // Baffi sottili in filo d'ottone dorato
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(16, -13.5); ctx.lineTo(22, -15.5);
    ctx.moveTo(16, -12.5); ctx.lineTo(22, -12);
    ctx.stroke();

    // 7. Grande occhio a brace ardente (ovale felino espressivo come nel model sheet)
    const eyeX = 14.2, eyeY = -15.5;
    const eyeG = ctx.createRadialGradient(eyeX, eyeY, 0.3, eyeX, eyeY, 3.2);
    eyeG.addColorStop(0, '#ffffff');
    eyeG.addColorStop(0.4, cEyeCol);
    eyeG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eyeG;
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 3.0, 2.0, 0.15, 0, TAU);
    ctx.fill();
    // Pupilla verticale affilata nera
    ctx.fillStyle = '#050403';
    ctx.fillRect(eyeX - 0.4, eyeY - 1.8, 0.8, 3.6);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(10.2, -11.0, 0.8, 3.0);
    }

  // =========================================================================
  // 4. MASCHERA D'OSSO / PULCINELLA D'ASSALTO (Isaac Host)
  // =========================================================================
  } else if (tipo === 'maschera') {
    const sprMask = maskOpen ? 'maschera_aperta' : 'maschera_chiusa';
    if (disegnaMobSprite(ctx, sprMask, 0, 4, 32, flip, isFlash)) {
      ctx.restore();
      return;
    }
    const openY = maskOpen ? -7 : 0;

    // Bavero / collare di velluto scarlatto e oro
    ctx.fillStyle = maskOpen ? '#991b1b' : '#1e293b';
    ctx.strokeStyle = '#090604';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -5, 9.5, 0, TAU);
    ctx.fill(); ctx.stroke();

    // Frangia dorata del bavero
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, -5, 9.5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Se la maschera è aperta, rivela il cuore d'ombra pulsante con occhio cremisi!
    if (maskOpen) {
      const corePulse = 1 + Math.sin(tick * 0.4) * 0.15;
      const cg = ctx.createRadialGradient(0, -5, 1, 0, -5, 6 * corePulse);
      cg.addColorStop(0, '#fef08a');
      cg.addColorStop(0.5, '#dc2626');
      cg.addColorStop(1, '#1e0505');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(0, -5, 6 * corePulse, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, -5, 1.8, 0, TAU); ctx.fill();
    }

    // Maschera di porcellana/osso intagliata (la calotta protettiva)
    ctx.save();
    ctx.translate(0, openY);
    const maskG = ctx.createLinearGradient(-8, -16, 8, -2);
    maskG.addColorStop(0, tint || (maskOpen ? '#f8fafc' : '#f1f5f9'));
    maskG.addColorStop(0.6, tint || (maskOpen ? '#e2e8f0' : '#cbd5e1'));
    maskG.addColorStop(1, '#94a3b8');
    ctx.fillStyle = maskG;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    // Sagoma a becco / calotta teatrale napoletana
    ctx.moveTo(-9.5, -8);
    ctx.bezierCurveTo(-11, -16, -6, -20, 0, -20);
    ctx.bezierCurveTo(6, -20, 11, -16, 9.5, -8);
    ctx.bezierCurveTo(7, -1, 3, 1, 0, 1);
    ctx.bezierCurveTo(-3, 1, -7, -1, -9.5, -8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Crepe sulla porcellana
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-2, -18); ctx.lineTo(1, -14); ctx.lineTo(-1, -11);
    ctx.stroke();

    // Cavità oculari della maschera
    ctx.fillStyle = maskOpen ? '#ef4444' : '#09070a';
    ctx.beginPath();
    ctx.ellipse(-3.5, -8, 2.2, 3.2, -0.15, 0, TAU);
    ctx.ellipse(3.5, -8, 2.2, 3.2, 0.15, 0, TAU);
    ctx.fill();
    ctx.restore();

  // =========================================================================
  // 5. STATUA SENTINELLA / CHERUBINO DI MARMO (Isaac Grimace)
  // =========================================================================
  } else if (tipo === 'statua') {
    if (disegnaMobSprite(ctx, 'statua', 0, 5, 36, flip, isFlash)) {
      ctx.restore();
      return;
    }
    const isCharging = (n.shootCd || 0) < 22;

    // Piedistallo barocco a gradoni in pietra e marmo di Caserta
    const stoneG = ctx.createLinearGradient(-12, -22, 12, 0);
    stoneG.addColorStop(0, tint || '#64748b');
    stoneG.addColorStop(0.5, tint || '#475569');
    stoneG.addColorStop(1, '#1e293b');

    ctx.fillStyle = stoneG;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.3;
    // Zoccolo inferiore
    ctx.fillRect(-12, -4, 24, 4);
    ctx.strokeRect(-12, -4, 24, 4);
    // Fusto centrale sagomato
    ctx.fillRect(-9, -16, 18, 12);
    ctx.strokeRect(-9, -16, 18, 12);
    // Capitello superiore
    ctx.fillRect(-11, -19, 22, 3);
    ctx.strokeRect(-11, -19, 22, 3);

    // Busto / volto di cherubino in marmo scolpito
    const marbleG = ctx.createRadialGradient(0, -25, 2, 0, -25, 10);
    marbleG.addColorStop(0, '#e2e8f0');
    marbleG.addColorStop(0.6, '#94a3b8');
    marbleG.addColorStop(1, '#475569');
    ctx.fillStyle = marbleG;
    ctx.beginPath();
    ctx.arc(0, -25, 8.5, 0, TAU);
    ctx.fill(); ctx.stroke();

    // Crepe runiche luminose quando carica il colpo a croce!
    if (isCharging) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5, -28); ctx.lineTo(-2, -24); ctx.lineTo(-4, -20);
      ctx.moveTo(3, -29); ctx.lineTo(1, -25); ctx.lineTo(4, -21);
      ctx.stroke();
    }

    // Occhi di pietra cieca che si accendono di rosso/oro
    const eyeStatCol = isCharging ? '#ef4444' : '#facc15';
    const eyeSg = ctx.createRadialGradient(-2.8, -25, 0.2, -2.8, -25, 2.5);
    eyeSg.addColorStop(0, '#ffffff');
    eyeSg.addColorStop(0.6, eyeStatCol);
    eyeSg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eyeSg;
    ctx.beginPath();
    ctx.arc(-2.8, -25, 2.5, 0, TAU);
    ctx.arc(2.8, -25, 2.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-2.8, -25, 1.0, 0, TAU);
    ctx.arc(2.8, -25, 1.0, 0, TAU);
    ctx.fill();

  // =========================================================================
  // 6. GUARDIA D'ACCIAIO / PREDONE DEI BORBONI (Isaac Knight / Greed Mob)
  // =========================================================================
  } else {
    const isMoving = Math.abs(n.vx || 0) > 0.1 || Math.abs(n.vy || 0) > 0.1;
    const sprGuardia = tipo === 'predone' ? 'predone' : isMoving ? 'guardia_carica' : 'guardia_ferma';
    if (disegnaMobSprite(ctx, sprGuardia, 0, 4, 38, flip, isFlash)) {
      ctx.restore();
      return;
    }
    ctx.scale(flip, 1);

    // Gambette articolate e stivali borbonici
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-3, 0); ctx.lineTo(-3, 6);
    ctx.moveTo(3, 0); ctx.lineTo(3, 6);
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(-3, 6.5, 3.0, 1.4, 0, 0, TAU);
    ctx.ellipse(3, 6.5, 3.0, 1.4, 0, 0, TAU);
    ctx.fill();

    // Giubba borbonica scarlatta o dorata (Predone) con bottoni
    const colCoat = tint || (tipo === 'predone' ? '#ca8a04' : '#991b1b');
    ctx.fillStyle = colCoat;
    ctx.strokeStyle = '#090604';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-7.5, 0); ctx.lineTo(-6.5, -13); ctx.lineTo(6.5, -13); ctx.lineTo(7.5, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Corazza di piombo/ottone sul petto con giglio borbonico
    ctx.fillStyle = tipo === 'predone' ? '#fef08a' : '#475569';
    ctx.beginPath();
    ctx.moveTo(-5, -13); ctx.lineTo(-6, -4); ctx.quadraticCurveTo(0, 1, 6, -4); ctx.lineTo(5, -13);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Morione / Elmo piumato con cresta
    const colHelm = tipo === 'predone' ? '#d97706' : '#64748b';
    ctx.fillStyle = colHelm;
    ctx.beginPath();
    ctx.arc(0, -18, 6.5, 0, TAU);
    ctx.fill(); ctx.stroke();
    // Tesa dell'elmo e piumetto
    ctx.fillRect(-7.5, -18.5, 15, 2.2);
    ctx.fillStyle = tipo === 'predone' ? '#ef4444' : '#f9cb40';
    ctx.beginPath();
    ctx.moveTo(-2, -24); ctx.quadraticCurveTo(3, -28, 6, -24); ctx.lineTo(1, -21);
    ctx.closePath(); ctx.fill();

    // Fessura d'ombra e sguardo gelido
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-3, -17.5, 6, 2.0);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(2.0, -16.5, 1.1, 0, TAU); ctx.fill();

    // Fucile a baionetta in pugno puntato in avanti
    ctx.fillStyle = '#78350f';
    ctx.fillRect(1, -8, 10, 2.4);
    // Lama della baionetta lucida
    const bayoG = ctx.createLinearGradient(11, -8, 19, -8);
    bayoG.addColorStop(0, '#f8fafc');
    bayoG.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bayoG;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(11, -9.5); ctx.lineTo(19, -7.5); ctx.lineTo(11, -5.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  ctx.restore();
}

function disegnaBossPittorico() {
  const args = Array.from(arguments);
  if (args[0] && typeof args[0].save === 'function') args.shift();
  const b = args[0];
  const tick = args[1] || 0;
  if (!b) return;
  const { x, y, bossId, flash, airZ = 0 } = b;
  const isFlash = flash > 0;
  const flip = player.x < x ? -1 : 1;

  ctx.save();
  ctx.imageSmoothingEnabled = true;

  // Ombra a terra (fondamentale quando Re Gatto / Monstro salta in alto fuori campo!)
  const shadowScale = Math.max(0.35, 1 - airZ / 180);
  ctx.fillStyle = airZ > 10 ? 'rgba(220, 38, 38, 0.55)' : 'rgba(8, 5, 3, 0.68)';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 26 * shadowScale, 9.5 * shadowScale, 0, 0, TAU);
  ctx.fill();
  if (airZ > 10) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 28 * shadowScale, 10.5 * shadowScale, 0, 0, TAU);
    ctx.stroke();
  }

  ctx.translate(x, y - airZ);

  // =========================================================================
  // BOSS 5: DONNA LUCIANA — LA BURATTINAIA DEL VELO (Isaac Mom)
  // =========================================================================
  if (bossId === 'donna-luciana') {
    const floatY = Math.sin(tick * 0.08) * 3.5;
    ctx.translate(0, floatY);

    // --- A: inizio --- tolti i tre fili propri: restano i due di disegnaFiliMarionetta --- A: fine ---
    const isCasting = (b.castTimer > 0) || (b.state === 'cast') || (b.fase === 2);
    const sprLuciana = isCasting ? 'donna_luciana_evoca' : 'donna_luciana_ferma';
    if (disegnaMobSprite(ctx, sprLuciana, 0, 10, 68, flip, isFlash)) {
      ctx.restore();
      return;
    }

    // Ampia gonna a crinolina barocca nera e scarlatta con trame dorate
    const dg = ctx.createLinearGradient(0, -28, 0, 10);
    dg.addColorStop(0, isFlash ? '#ffffff' : '#581c87');
    dg.addColorStop(0.4, isFlash ? '#fca5a5' : '#450a0a');
    dg.addColorStop(1, isFlash ? '#ef4444' : '#0f0504');
    ctx.fillStyle = dg;
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-12, -22);
    ctx.bezierCurveTo(-26, -10, -34, 4, -36, 10);
    ctx.quadraticCurveTo(0, 15, 36, 10);
    ctx.bezierCurveTo(34, 4, 26, -10, 12, -22);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Merletto e balze dorate della gonna
    ctx.strokeStyle = 'rgba(249, 203, 64, 0.65)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-32, 4); ctx.quadraticCurveTo(0, 8, 32, 4);
    ctx.stroke();

    // Busto e corpetto con Giglio d'oro borbonico
    ctx.fillStyle = isFlash ? '#ffffff' : '#2e1065';
    ctx.fillRect(-8, -26, 16, 7);
    ctx.fillStyle = '#f9cb40';
    ctx.beginPath(); ctx.arc(0, -23, 2.0, 0, TAU); ctx.fill();

    // Volto di porcellana diafana e velo funebre
    ctx.fillStyle = isFlash ? '#ffffff' : '#fef2f2';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(0, -30, 9.5, 0, TAU); ctx.fill(); ctx.stroke();

    // Occhi di sangue cremisi da burattinaia
    const eyeLg = ctx.createRadialGradient(-3.2, -30, 0.2, -3.2, -30, 3.5);
    eyeLg.addColorStop(0, '#ffffff');
    eyeLg.addColorStop(0.5, '#ef4444');
    eyeLg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eyeLg;
    ctx.beginPath();
    ctx.arc(-3.2, -30, 3.5, 0, TAU);
    ctx.arc(3.2, -30, 3.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3.2, -30, 1.4, 0, TAU);
    ctx.arc(3.2, -30, 1.4, 0, TAU);
    ctx.fill();

    // Corona d'oro traforata a punte
    ctx.fillStyle = '#f9cb40';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-9, -37); ctx.lineTo(-7, -46); ctx.lineTo(-2, -40);
    ctx.lineTo(0, -48);  ctx.lineTo(2, -40);  ctx.lineTo(7, -46); ctx.lineTo(9, -37);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.restore();

    // --- A: inizio --- le sue due Mani (mobili) si disegnano a parte, da n.maniA --- A: fine ---
    return;
  }

  ctx.scale(flip, 1);

  // =========================================================================
  // BOSS 1: RE GATTO DEI QUATTRO CANTI (Isaac Monstro)
  // =========================================================================
  if (bossId === 're-gatto') {
    const isAir = (airZ > 10) || (b.state === 'leap');
    const isCrouch = b.state === 'crouch' || (b.crouchTicks > 0);
    const isMoving = Math.abs(b.vx || 0) > 0.1 || Math.abs(b.vy || 0) > 0.1;
    const posa = isAir ? 'salto' : isCrouch ? 'accucciato' : isMoving ? 'cammina' : 'fermo';
    const targetH = isAir ? 68 : isCrouch ? 56 : isMoving ? 62 : 78;

    if (!disegnaGattoSprite(ctx, posa, 0, 8, targetH, flip, isFlash, true)) {
    // Corpo massiccio scolpito in ebano scuro
    const catG = ctx.createRadialGradient(0, -12, 2, 0, -12, 24);
    catG.addColorStop(0, isFlash ? '#ffffff' : '#3c2415');
    catG.addColorStop(0.6, isFlash ? '#fca5a5' : '#1c120d');
    catG.addColorStop(1, '#090503');
    ctx.fillStyle = catG;
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, -12, 23, 16, 0, 0, TAU);
    ctx.fill(); ctx.stroke();

    // Fauci ruggenti spalancate con zanne d'avorio e bava cremisi
    ctx.fillStyle = '#090503';
    ctx.beginPath();
    ctx.ellipse(6, -8, 12, 8, 0, 0, TAU);
    ctx.fill();
    // Zanne affilate
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(2, -9); ctx.lineTo(4, -14);
    ctx.moveTo(8, -14); ctx.lineTo(10, -9); ctx.lineTo(12, -14);
    ctx.moveTo(2, -3); ctx.lineTo(4, -7); ctx.lineTo(6, -3);
    ctx.fill();

    // Orecchie feroci e mantella reale d'ermellino
    ctx.fillStyle = '#1c120d';
    ctx.beginPath();
    ctx.moveTo(-16, -20); ctx.lineTo(-21, -34); ctx.lineTo(-8, -24);
    ctx.moveTo(8, -24);   ctx.lineTo(21, -34);  ctx.lineTo(16, -20);
    ctx.fill(); ctx.stroke();

    // Corona borbonica ammaccata con rubini
    ctx.fillStyle = '#f9cb40';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-7, -25); ctx.lineTo(-5, -34); ctx.lineTo(0, -28); ctx.lineTo(5, -34); ctx.lineTo(7, -25);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(0, -29, 1.8, 0, TAU); ctx.fill();

    // Occhi rossi incandescenti da sovrano d'ombra
    const eyeRg = ctx.createRadialGradient(6, -14, 0.2, 6, -14, 4.0);
    eyeRg.addColorStop(0, '#ffffff');
    eyeRg.addColorStop(0.5, '#ef4444');
    eyeRg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eyeRg;
    ctx.beginPath();
    ctx.arc(6, -14, 4.0, 0, TAU);
    ctx.arc(14, -13, 3.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, -14, 1.5, 0, TAU);
    ctx.arc(14, -13, 1.4, 0, TAU);
    ctx.fill();
    }

  // =========================================================================
  // BOSS 3: LA REGINA DELLE VESPE (Isaac Duke of Flies)
  // =========================================================================
  } else if (bossId === 'regina-vespa') {
    const isLunge = (b.state === 'lunge') || (b.chargeTimer > 0) || Math.hypot(b.vx || 0, b.vy || 0) > 1.8;
    const sprRegina = isLunge ? 'regina_vespa_attacco' : (Math.sin(tick * 0.2) > 0.3 ? 'regina_vespa_volo' : 'regina_vespa_ferma');
    const hoverY = Math.sin(tick * 0.12) * 5 - 4;
    if (disegnaMobSprite(ctx, sprRegina, 0, hoverY, 60, 1, isFlash)) {
      ctx.restore();
      return;
    }
    const wy = Math.sin(tick * 0.6) * 6;

    // 4 Ali gigantesche di pizzo e garza diafana
    ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(-10, -24 + wy * 0.45, 18, 8.5, -0.35, 0, TAU);
    ctx.ellipse(10, -24 - wy * 0.45, 18, 8.5, 0.35, 0, TAU);
    ctx.fill(); ctx.stroke();

    // Addome rigonfio regale striato d'oro e velluto scuro
    const queenG = ctx.createRadialGradient(0, -13, 2, 0, -13, 22);
    queenG.addColorStop(0, isFlash ? '#ffffff' : '#facc15');
    queenG.addColorStop(0.55, isFlash ? '#fef08a' : '#ca8a04');
    queenG.addColorStop(1, '#1c1917');
    ctx.fillStyle = queenG;
    ctx.strokeStyle = '#090604';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, -13, 22, 16, 0, 0, TAU);
    ctx.fill(); ctx.stroke();

    // Balze di pizzo e tiara d'avorio della regina
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -13, 18, 0.3, Math.PI - 0.3);
    ctx.stroke();

    // Occhi composti scarlatti
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(7, -15, 3.5, 0, TAU);
    ctx.arc(15, -14, 3.2, 0, TAU);
    ctx.fill();

  // =========================================================================
  // BOSS 4: IL COLOSSO DI CASERTA (Isaac Gurdy)
  // =========================================================================
  } else if (bossId === 'colosso-statua') {
    const isOpen = b.apertoCM || b.state === 'open' || (b.timerSparo && b.timerSparo < 30);
    const sprColosso = isOpen ? 'colosso_statua_aperto' : 'colosso_statua_fermo';
    if (disegnaMobSprite(ctx, sprColosso, 0, 10, 68, 1, isFlash)) {
      ctx.restore();
      return;
    }
    // Busto titanico di pietra e marmo emergente dalla pedana
    const colG = ctx.createLinearGradient(-24, -38, 24, 6);
    colG.addColorStop(0, isFlash ? '#ffffff' : '#94a3b8');
    colG.addColorStop(0.55, isFlash ? '#cbd5e1' : '#475569');
    colG.addColorStop(1, '#0f172a');
    ctx.fillStyle = colG;
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-26, 6);
    ctx.lineTo(-21, -30);
    ctx.lineTo(0, -40);
    ctx.lineTo(21, -30);
    ctx.lineTo(26, 6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Barba e chioma scolpita nella pietra con muschio
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-16, -18); ctx.lineTo(0, -2); ctx.lineTo(16, -18);
    ctx.closePath(); ctx.fill();

    // Occhi titani cavi di fuoco rosso
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-7, -20, 3.8, 0, TAU);
    ctx.arc(7, -20, 3.8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-7, -20, 1.4, 0, TAU);
    ctx.arc(7, -20, 1.4, 0, TAU);
    ctx.fill();

  // =========================================================================
  // BOSS 6: LO SPEZZAFILI D'OTTONE (Isaac Peep)
  // =========================================================================
  } else if (bossId === 'maestro-fucina') {
    const isAttack = (b.scissorTimer > 0) || (b.state === 'attack') || Math.hypot(b.vx || 0, b.vy || 0) > 1.2;
    const sprFucina = isAttack ? 'maestro_fucina_attacco' : 'maestro_fucina_fermo';
    if (disegnaMobSprite(ctx, sprFucina, 0, 8, 64, 1, isFlash)) {
      ctx.restore();
      return;
    }
    // Procedurale per Lo Spezzafili
    const ironG = ctx.createLinearGradient(-18, -28, 18, 4);
    ironG.addColorStop(0, isFlash ? '#ffffff' : '#d97706');
    ironG.addColorStop(0.5, isFlash ? '#fef08a' : '#b45309');
    ironG.addColorStop(1, '#451a03');
    ctx.fillStyle = ironG;
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-18, -28, 36, 32, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-8, -20, 24, 7);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(6, -16.5, 3.2, 0, TAU);
    ctx.arc(13, -16.5, 3.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(8, -8); ctx.lineTo(32, -8); ctx.stroke();

  // =========================================================================
  // BOSS 2: CAPITANO GREGORIO / ARIETE DI PIOMBO (Isaac Chub)
  // =========================================================================
  } else {
    const isCharge = (b.chargeTimer > 0) || (b.state === 'charge') || Math.hypot(b.vx || 0, b.vy || 0) > 1.4;
    const sprCap = isCharge ? 'capitano_guardia_carica' : 'capitano_guardia_fermo';
    if (disegnaMobSprite(ctx, sprCap, 0, 8, 64, 1, isFlash)) {
      ctx.restore();
      return;
    }
    // Juggernaut d'acciaio e ottone in carica
    const ironG = ctx.createLinearGradient(-18, -28, 18, 4);
    ironG.addColorStop(0, isFlash ? '#ffffff' : '#b91c1c');
    ironG.addColorStop(0.5, isFlash ? '#fca5a5' : '#7f1d1d');
    ironG.addColorStop(1, '#1e293b');
    ctx.fillStyle = ironG;
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-18, -28, 36, 32, 8);
    ctx.fill(); ctx.stroke();

    // Grata da visiera con occhi fiammeggianti
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-8, -20, 24, 7);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(6, -16.5, 3.2, 0, TAU);
    ctx.arc(13, -16.5, 3.2, 0, TAU);
    ctx.fill();

    // Grande lancia/ariete frontale con sperone d'oro
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(8, -8);
    ctx.lineTo(32, -8);
    ctx.stroke();
  }

  ctx.restore();
}

const SPRITE_PROIETTILI = {
  base: [
    '..kkkk..',
    '.kwwwwk.',
    'kwwccwwk',
    'kwccccsk',
    'kwccccsk',
    'kssccssk',
    '.kssssk.',
    '..kkkk..',
  ],
  fuoco: [
    '...kk...',
    '..kook..',
    '.kooyyk.',
    'koywwwyk',
    'koyyyyyk',
    'kroooork',
    '.krrrrk.',
    '..kkkk..',
  ],
  elettrico: [
    '..kkkk..',
    '.kaaaak.',
    'kawwwwak',
    'kawaaawk',
    'kawwwwak',
    'kAAaaAAk',
    '.kAAAAk.',
    '..kkkk..',
  ],
  cremisi: [
    '..kkkk..',
    '.krrrrk.',
    'krwwwwrk',
    'krwrrrrk',
    'krrrrrRk',
    'kRRrrRRk',
    '.kRRRRk.',
    '..kkkk..',
  ],
  piombo: [
    '..kkkk..',
    '.kggggk.',
    'kgwwwwgk',
    'kggggGGk',
    'kGGGDDGk',
    'kDDDDDDk',
    '.kDDDDk.',
    '..kkkk..',
  ],
  nemico: [
    '..kkkk..',
    '.kppppk.',
    'kpwwwwpk',
    'kpwppprk',
    'kprrrrRk',
    'kPPrrPPk',
    '.kPPPPk.',
    '..kkkk..',
  ],
  splash: [
    [
      '..k..k..',
      '.kwkkwk.',
      'kwwwwwwk',
      '.kwwwwk.',
      'kwwwwwwk',
      '.kwkkwk.',
      '..k..k..',
      '........',
    ],
    [
      'k..kk..k',
      '.kw..wk.',
      'kw....wk',
      'k......k',
      'kw....wk',
      '.kw..wk.',
      'k..kk..k',
      '........',
    ],
    [
      'k......k',
      '.kw..wk.',
      '........',
      '..k..k..',
      '........',
      '.kw..wk.',
      'k......k',
      '........',
    ],
    [
      'k......k',
      '........',
      '........',
      '........',
      '........',
      '........',
      'k......k',
      '........',
    ],
  ],
};

const SPRITE_OGGETTI = {
  forbici: [
    '..kk....kk..',
    '.kyyk..kyyk.',
    'ky..k..k..yk',
    '.kyyk..kyyk.',
    '..kkk..kkk..',
    '....kyyk....',
    '...kggggk...',
    '..kgg..ggk..',
    '.kgg....ggk.',
    '.kwk....kwk.',
    '............',
    '............',
  ],
  tamburello: [
    '...kkkkkk...',
    '.kkyyyyyykk.',
    'kyyccccccyyk',
    'kyccccccccyk',
    'kyccrrrrccyk',
    'kyccccccccyk',
    'kyyccccccyyk',
    '.kkyyyyyykk.',
    '...kkkkkk...',
    '............',
    '............',
    '............',
  ],
  ampolla: [
    '....kkkk....',
    '....kyyk....',
    '....kkkk....',
    '...kwwwwk...',
    '..kwrrrrwk..',
    '.kwrrrrrrwk.',
    '.kwrrrrrrwk.',
    '..kRRRRRRk..',
    '...kkkkkk...',
    '............',
    '............',
    '............',
  ],
  patto_raggio: [
    '.kk......kk.',
    'krrk....krrk',
    'kRRkkkkkkRRk',
    '.krrrrrrrrk.',
    '..krrwwrrk..',
    '.krrrwwrrrk.',
    'krrk.kk.krrk',
    'kRk..kk..kRk',
    '....krrk....',
    '....kkkk....',
    '............',
    '............',
  ],
  patto_sacro: [
    '....kyyk....',
    '..kkywwykk..',
    '....kyyk....',
    '.kkkk..kkkk.',
    'krrrrkkrrrrk',
    'krwyywwyyrwk',
    'krrrwwwwrrrk',
    '.krrrrrrrrk.',
    '..krrrrrrk..',
    '...kRRRRk...',
    '....kkkk....',
    '............',
  ],
  patto_coltello: [
    '.........kkk',
    '........kwwk',
    '.......kwwgk',
    '......kwwggk',
    '.....kwwggk.',
    '....krrggk..',
    '...kyyyyk...',
    '..kRRRRk....',
    '.kRRRRk.....',
    'kkkkkk......',
    '............',
    '............',
  ],
  spada: [
    '.........kkk',
    '........kwwk',
    '.......kggk.',
    '......kggk..',
    '.....kggk...',
    '..kkkygk....',
    '.kyyyyk.....',
    '..kMyyk.....',
    '.kMMk.k.....',
    'kMMk........',
    'kkk.........',
    '............',
  ],
  triplo: [
    '....kkkk....',
    '..kkwwwwkk..',
    '.kwwrrrrwwk.',
    '.kwrrrrrrwk.',
    'kwwrwwwwrwwk',
    'kwwrwkkrwwwk',
    'kwwrwwwwrwwk',
    '.kwrrrrrrwk.',
    '.kwwrrrrwwk.',
    '..kkwwwwkk..',
    '....kkkk....',
    '............',
  ],
  fuoco: [
    '.....kk.....',
    '....kook....',
    '...kooyyk...',
    '..koyywwyk..',
    '.koyywwwwyk.',
    '.koryyyyyrok',
    'korrrooorrrk',
    'krrrrrrrrrrk',
    '.kRRRRRRRRk.',
    '..kkkkkkkk..',
    '............',
    '............',
  ],
  piombo: [
    '...kkkkkk...',
    '..kggggggk..',
    '.kggwwwwggk.',
    'kggwwggggGGk',
    'kggggggggGGk',
    'kggggGGGGGGk',
    'kGGGGDDDDGGk',
    '.kDDDDDDDDk.',
    '..kDDDDDDk..',
    '...kkkkkk...',
    '............',
    '............',
  ],
  catena: [
    '....kkkk....',
    '...kaaaak...',
    '..kawwwwak..',
    '..kawaaawk..',
    '...kaaaak...',
    '....kyyk....',
    '...kaaaak...',
    '..kawwwwak..',
    '..kawaaawk..',
    '...kaaaak...',
    '....kkkk....',
    '............',
  ],
  anello: [
    '....kkkk....',
    '..krrrrrrk..',
    '.krrwwwwrrk.',
    '.krrrrrrrrk.',
    '..kyyyyyyk..',
    '.kyykkkkyyk.',
    'kyyk....kyyk',
    'kyyk....kyyk',
    '.kyykkkkyyk.',
    '..kyyyyyyk..',
    '....kkkk....',
    '............',
  ],
  doppia: [
    '.kkkk..kkkk.',
    'kwwwwkkwwwwk',
    'kwaawwkwaawk',
    'kwaawwkwaawk',
    'kwwwwkkwwwwk',
    '.kkkk..kkkk.',
    '............',
    '....kkkk....',
    '...kyyyyk...',
    '....kkkk....',
    '............',
    '............',
  ],
  mercurio: [
    '.....kk.....',
    '....kggk....',
    '...kgwwgk...',
    '..kggwwggk..',
    '.kgggwwgggk.',
    'kggggggggggk',
    'kggggggggGGk',
    'kGGGGGGGGGGk',
    '.kGGGGGGGGk.',
    '..kkkkkkkk..',
    '............',
    '............',
  ],
  venti: [
    '....kkkk....',
    '..kcccccck..',
    '.kccwwwwcck.',
    'kcckkcckkcck',
    'kccccccccssk',
    'kccsskksscck',
    '.kcckddkcck.',
    '..kcccccck..',
    '....kkkk....',
    '............',
    '............',
    '............',
  ],
  cuore: [
    '.kkkk..kkkk.',
    'krrrrkkrrrrk',
    'krwwrrrrrrrk',
    'krwrrrrrrrrk',
    'krrrrrrrrrRk',
    '.krrrrrrrRk.',
    '..krrrrrRk..',
    '...krrrRk...',
    '....kRRk....',
    '.....kk.....',
    '............',
    '............',
  ],
  stivali: [
    '....kkkkkk..',
    '...kyyyyyyk.',
    '...kyrrrrryk',
    '...kyrrrrryk',
    '...kyyyyyyk.',
    '.kkkyyyyyk..',
    'kyyyyyyyyk..',
    'kMMMMMMMMk..',
    'kkkkkkkkkk..',
    '............',
    '............',
    '............',
  ],
  mantice: [
    '...kkkkkk...',
    '..kMMMMMMk..',
    '.kMMyyyyyMk.',
    'kMMywwwwyyMk',
    'kMMyyyyyyyMk',
    '.kMMMMMMMok.',
    '..kkkkkkook.',
    '........kggk',
    '.........kkk',
    '............',
    '............',
    '............',
  ],
  chiodo: [
    '....kkkkkk..',
    '...kggggggk.',
    '...kggwwggk.',
    '....kkggkk..',
    '.....kggk...',
    '.....kGGk...',
    '.....kggk...',
    '.....kGGk...',
    '.....kDDk...',
    '......kk....',
    '............',
    '............',
  ],
  mezzaMaschera: [
    '..kkkk......',
    '.krrrrk.....',
    'krwwrrk.....',
    'krrrrrRk....',
    '.krrrrRk....',
    '..krrrRk....',
    '...krrRk....',
    '....krRk....',
    '.....kkk....',
    '............',
  ],
  moneta1: [
    '...kkkk...',
    '..kyyyyk..',
    '.kywwwwyk.',
    '.kywyyoyk.',
    '.kyyooyyk.',
    '.kyyyyyyk.',
    '..koooOk..',
    '...kkkk...',
  ],
  moneta3: [
    '...kkkk...',
    '..kaaaak..',
    '.kawwwwak.',
    '.kawaAAak.',
    '.kaaAAAak.',
    '.kaaaaaak.',
    '..kAAAAk..',
    '...kkkk...',
  ],
};

const SPRITE_SCENA = {
  piedistallo: [
    '..kkkkkkkkkkkk..',
    '.kyyyyyyyyyyyyk.',
    '.kggggggggggggk.',
    '..kGGGGGGGGGGk..',
    '...kggggggggk...',
    '...kGGGGGGGGk...',
    '..kggggggggggk..',
    '.kGGGGGGGGGGGGk.',
    '.kkkkkkkkkkkkkk.',
  ],
  piedistalloOro: [
    '..kkkkkkkkkkkk..',
    '.kwwwwwwwwwwwwk.',
    '.kyyyyyyyyyyyyk.',
    '..koooooooooOk..',
    '...kyyyyyyyyk...',
    '...koooooooOk...',
    '..kyyyyyyyyyyk..',
    '.koooooooooooOk.',
    '.kkkkkkkkkkkkkk.',
  ],
  incudine: [
    '..kkkkkkkkkkkk..',
    'kggggggggggggggk',
    'kggGGGGGGGGGGggk',
    '.kkkkGGGGGGkkkk.',
    '....kGGGGGGk....',
    '...kGGGGGGGGk...',
    '..kGGGGGGGGGGk..',
    '.kkkkkkkkkkkkkk.',
  ],
  mercante: [
    '.....kkkkkkkkkk.....',
    '....kMMMMMMMMMMk....',
    '...kMyyaaMMyyaaMk...',
    '...kMyyaaMMyyaaMk...',
    '...kkkkkkkkkkkkkk...',
    '....kccccsssscck....',
    '...kcckkwccwkkcck...',
    '...kcccggggggccck...',
    '..kggggwwwwwwggggk..',
    '.krrMMMwwwwwwMMMrrk.',
    '.krkMMMyyyyyyMMMkggk',
    '.keekMMMMMMMMMMkeGGk',
    '...kMMMooooooMMMk.k.',
    '...kMMMMMMMMMMMMk...',
    '....kkkkkkkkkkkk....',
  ],
  mercante1: [
    '.....kkkkkkkkkk.....',
    '....kMMMMMMMMMMk....',
    '...kMyyaaMMyyaaMk...',
    '...kMyyaaMMyyaaMk...',
    '...kkkkkkkkkkkkkk...',
    '....kccccsssscck....',
    '...kcckkwccwkkcck...',
    '...kcccggggggccck...',
    '..kggggwwwwwwggggk..',
    '.krrMMMwwwwwwMMMrrk.',
    '.krkMMMyyyyyyMMMkrk.',
    '.keekMMMMMMMMMMkeggk',
    '...kMMMooooooMMMkeGk',
    '...kMMMMMMMMMMMMk...',
    '....kkkkkkkkkkkk....',
  ],
  braciere0: [
    '.....kk.....',
    '....kook....',
    '...kooyyk...',
    '..koywwwyk..',
    '.krrrrrrrrk.',
    'kGGGGGGGGGGk',
    '.kGGGGGGGGk.',
    '..kddkkddk..',
    '..kkkkkkkk..',
  ],
  braciere1: [
    '....kk......',
    '...kyyk.....',
    '..kooyyk....',
    '..koywwyk...',
    '.krrrrrrrrk.',
    'kGGGGGGGGGGk',
    '.kGGGGGGGGk.',
    '..kddkkddk..',
    '..kkkkkkkk..',
  ],
  urna: [
    '...kkkkkk...',
    '..kMMMMMMk..',
    '...kmmmmk...',
    '..kmmwwmmk..',
    '.kmmmyyyymk.',
    '.kmmmmmmmmk.',
    '..kMMMMMMk..',
    '...kkkkkk...',
  ],
  colonna: [
    '..kkkkkkkk..',
    '.kggggggggk.',
    '.kggGGGGggk.',
    '..kgGGGGgk..',
    '..kgGGGGgk..',
    '..kgGGGGgk..',
    '.kggGGGGggk.',
    '.kDDDDDDDDk.',
    '..kkkkkkkk..',
  ],
};

Object.assign(SPRITE_OGGETTI, {
  corno: ['.........kk.', '........krk.', '.......krrk.', '......krrRk.', '.....krrRk..', '....krrrRk..',
    '...krrrRk...', '..krrrRk....', '.krrrRk.....', '.kyyyk......', 'kyyyk.......', '.kkk........'],
  campana: ['.....kk.....', '....kyyk....', '...kyyyyk...', '..kyywyyyk..', '..kyywyyyk..', '..kyyyyyyk..',
    '.kyyyyyyyyk.', 'kyyyyyyyyyyk', 'kOOOOOOOOOOk', '.kkkkkkkkkk.', '.....kOk....', '......k.....'],
  fiaccola: ['.....ro.....', '....roor....', '....oyyo....', '...royyor...', '....oyyo....', '....kmmk....',
    '....kmMk....', '....kmMk....', '....kmMk....', '....kmMk....', '....kMMk....', '.....kk.....'],
  lanterna: ['.....kk.....', '....k..k....', '...kkkkkk...', '..kGaaaaGk..', '..kGawwaGk..', '..kGaaaaGk..',
    '..kGaaaaGk..', '..kGaaaaGk..', '...kkkkkk...', '....kGGk....', '.....kk.....', '............'],
  sole: ['.....yy.....', '..y..yy..y..', '...yyyyyy...', '..yyoooooy..', 'yyyoyyyyoyyy', 'yyyoywwyoyyy',
    '..yoyyyyoy..', '..yyoooooy..', '...yyyyyy...', '..y..yy..y..', '.....yy.....', '............'],
  nastro: ['............', '.kk......kk.', 'krrk....krrk', 'krrrk..krrrk', '.krrrkkrrrk.', '..krrRRrrk..',
    '..krrRRrrk..', '.krrrkkrrrk.', 'krrk.kk.krrk', 'kRk..kk..kRk', '.k........k.', '............'],
  ago: ['..........kk', '.........kwk', '........kgk.', '.......kgk..', '......kgk...', '.....kgk....',
    '....kgk.....', '...kgk..rr..', '..kgk..r..r.', '.kgk..r.....', 'kGk..r......', '.k...r......'],
  castagna: ['.....kk.....', '....kwwk....', '...kmmmmk...', '..kmmmmmmk..', '.kmmMmmmmmk.', '.kmMmmmmmmk.',
    '.kmmmmmmmmk.', '.kmmmmmmmMk.', '..kmmmmmMk..', '...kccccck..', '....kkkkk...', '............'],
  cornetto: ['............', '..kk........', '.kyyk.......', '.kyyk.......', '..krrk......', '..krrrk.....',
    '...krrrk....', '....krrrk...', '.....krrRk..', '......krRk..', '.......kRk..', '........k...'],
  bottone: ['............', '....kkkk....', '..kkcccckk..', '.kccwccccck.', '.kcwcccccck.', '.kcckcckcck.',
    '.kcccccccck.', '.kcckcckcck.', '.kcccccccck.', '..kkcccckk..', '....kkkk....', '............'],
  pettine: ['............', '............', 'kkkkkkkkkkkk', 'kmmmmmmmmmmk', 'kmMmMmMmMmMk', 'kkkkkkkkkkkk',
    'kmkmkmkmkmk.', 'kmkmkmkmkmk.', 'kmkmkmkmkmk.', 'k.k.k.k.k.k.', '............', '............'],
  pipa: ['..........w.', '.........w..', '..........w.', '.kkkk.......', 'kmmmmk......', 'kmMMmk......',
    'kmMMmkkkkkk.', 'kmmmmmmmmmmk', '.kmmmkkkkkk.', '..kkk.......', '............', '............'],
  pagnotta: ['............', '............', '...kkkkkk...', '..kooooook..', '.koooooooook', 'kocooocoooOk',
    'kooooooooOOk', 'koooooooOOOk', '.kOOOOOOOOk.', '..kkkkkkkk..', '............', '............'],
  chiave: ['............', '..kkkk......', '.kyyyyk.....', 'kyykkyyk....', 'kyk..kyk....', 'kyykkyyk....',
    '.kyyyykkkkk.', '..kkkkyyyyyk', '......kykyk.', '......kykyk.', '.......k.k..', '............'],
  dado: ['............', '.kkkkkkkkkk.', '.kwwwwwwwwk.', '.kwkwwwwkwk.', '.kwwwwwwwwk.', '.kwwwkkwwwk.',
    '.kwwwkkwwwk.', '.kwwwwwwwwk.', '.kwkwwwwkwk.', '.kwwwwwwwwk.', '.kkkkkkkkkk.', '............'],
});

// Sprite 12×12 dei nuovi, stessa palette e stile di OGGETTI_NUOVI_B.
Object.assign(SPRITE_OGGETTI, {
  'trottola': ['.....kk.....', '.....km.....', '...kkkkkk...', '..krrwwrrk..', '.kwwrrrrwwk.', '.krrwwwwrrk.', '..kwwrrwwk..', '...krrrrk...', '....kwwk....', '.....kk.....', '.....k......', '............'],
  'sfogliatella': ['............', '.....kk.....', '....kcsk....', '...kcscsk...', '..kscscsck..', '.kcscscscsk.', '.kscscscsck.', 'kcscscscscsk', 'kssssssssssk', '.kessssssek.', '..kkkkkkkk..', '............'],
  'pastiera': ['............', 'k...........', 'kkk.........', 'kymkk.......', 'kyyymkk.....', 'kmyymyymkk..', 'kyymyymyyykk', 'kymyymyymyyk', 'kyyyyyyyyyyk', 'kOOOOOOOOOOk', 'kkkkkkkkkkkk', '............'],
  'cucchiaio': ['.......kkk..', '......kgggk.', '......kgwgk.', '......kgggk.', '.......kgk..', '.......kgk..', '......kgk...', '.....kgk....', '....kgk.....', '...kGk......', '..kGk.......', '..kk........'],
  'astrolabio': ['....kkkk....', '..kkyyyykk..', '.kyk....kyk.', '.ky..kk..yk.', 'ky..kbbk..yk', 'ky.kbabbk.yk', 'ky.kbbbBk.yk', 'ky..kBBk..yk', '.ky..kk..yk.', '.kyk....kyk.', '..kkyyyykk..', '....kkkk....'],
  'gomma': ['.....ww.....', '....wccw....', '....wccw....', '.....ww.....', '...kkkkkk...', '..kMMMMMMk..', '..kcccccck..', '..kcsscsck..', '..kcccccck..', '..kcccccck..', '..kkkkkkkk..', '............'],
  'piedigrotta': ['..........y.', '.........yo.', '........k...', '.....kkk....', '....krrrk...', '...krwrrk...', '..krrrrk....', '.krrrrk.....', '.kRrrk......', 'kooRk.......', 'koyk........', '.kk.........'],
  'ragno': ['............', '.w........w.', '..w......w..', '...w.kk.w...', '....kddk....', '...kdrrdk...', '..wkddddkw..', '.w.kddddk.w.', 'w...kddk...w', '.....kk.....', '............', '............'],
  'velo-madonna': ['...yyyyyy...', '..y......y..', '...yyyyyy...', '....kkkk....', '...kaaaak...', '..kaabbaak..', '..kabbbbak..', '.kabbbbbbak.', '.kbbBbbBbbk.', 'kbbBbbbbBbbk', 'kBBBBBBBBBBk', '.kkkkkkkkkk.'],
  'cuoio': ['............', '............', '.kkkkkkkkkk.', 'kddddddddddk', 'kdkkddddkkdk', 'kdk.kddk.kdk', 'kddkkddkkddk', '.kddddddddk.', '..kkddddkk..', '....kddk....', '.....kk.....', '............'],
  'gomitolo': ['............', '....kkkk....', '..kkyyoykk..', '.kyoyyyoyyk.', '.kyyoyyyoyk.', 'kyoyyoyyyoyk', 'kyyoyyoyyyyk', '.kyyyoyyoyk.', '.kyoyyyoyyk.', '..kkyyyykky.', '....kkkk...y', '...........y'],
  'ostia': ['............', '....kkkk....', '..kkwwwwkk..', '.kwwwwgwwwk.', '.kwwwwgwwwk.', 'kwwggggggwwk', 'kwwwwwgwwwwk', '.kwwwwgwwwk.', '.kwwwwgwwwk.', '..kkwwwwkk..', '....kkkk....', '............'],
  'bobby': ['....kkkk....', '...kBBBBk...', '..kBBBBBBk..', '...kssssk...', '...kskksk...', '...kssssk...', '....kssk....', '..kmmmmmmk..', '.kskmmmmksk.', '...kmmmmk...', '...km..mk...', '...kk..kk...'],
  'maggy': ['..r......r..', '..rrk..krr..', '...kkcckk...', '...kcccck...', '...kckkck...', '...kcccck...', '....kcck....', '..kpppppk...', '.kcpppppck..', '...kppppk...', '...kc..ck...', '...kk..kk...'],
  'gatto': ['..k.....k...', '..kk...kk...', '..kdkkkdk...', '..kdydydk...', '..kdddddk...', '...kdddk....', '..kdddddk...', '.kdddddddk..', '.kdddddddk..', '.kdddddddk.k', '..kdkdkdk.k.', '...kkkkkkk..'],
  'diavoletto': ['.k......y.y.', '.kk..kk.yyy.', '..krrrrk.y..', '..krwrwk.y..', '..krrrrk.y..', '...kRRk..y..', '..krrrrkky..', '.krrrrrrk...', '..krrrrk.y..', '..kr..rk.y..', '..kk..kk....', '............'],
  'pulcinellino': ['.....kk.....', '.....kwk....', '....kwwk....', '....kwwwk...', '...kwwwwk...', '...kkkkkk...', '...kddddk...', '...kdwdwk...', '....kcck....', '..kwwwwwwk..', '..kwwwwwwk..', '...kk..kk...'],
  'campanello': ['............', '.....kk.....', '....kyyk....', '.....kk.....', '...kkkkkk...', '..kyywyyyk..', '.kyywyyyyyk.', '.kyyyyyyyyk.', 'kOOOOOOOOOOk', '.kkkkkkkkkk.', '............', '............'],
  'tarallo': ['............', '...kkkkkk...', '..kssksssk..', '.ksskkkkssk.', '.kskk..kksk.', '.ksk....ksk.', '.ksk....ksk.', '.kskk..kksk.', '.ksskkkkksk.', '..kssskssk..', '...kkkkkk...', '............'],
  'carta-ventaglio': ['............', '.kkkkkkkkkk.', 'kcscscscscsk', '.kcscscscsk.', '.kscscscsck.', '..kcscscsk..', '..kscscsck..', '...kcscsk...', '....kscsk...', '.....kmk....', '.....kmk....', '......k.....'],
  'cuore-sacro': ['.....oy.....', '....oyyo....', '.....yo.....', '..kkk..kkk..', '.kgggkkgggk.', 'kgwgggggggGk', 'kggggggggggk', '.kgggggggGk.', '..kgggggGk..', '...kgggGk...', '....kggk....', '.....kk.....'],
  'bombarda': ['.........y..', '........yo..', '.......k....', '....kkkk....', '..kkddddkk..', '.kddwdddddk.', '.kdwddddddk.', 'kdddddddddDk', '.kddddddDDk.', '.kddddDDDDk.', '..kkDDDDkk..', '....kkkk....'],
  'occhio-vetro': ['............', '....kkkk....', '..kkwwwwkk..', '.kwwwvvwwwk.', '.kwwvVVvwwk.', 'kwwvVkkVvwwk', 'kwwvVkkVvwwk', '.kwwvVVvwwk.', '.kwwwvvwwwk.', '..kkwwwwkk..', '....kkkk....', '............'],
  'cappello-mago': ['.....kk.....', '.....kbk....', '....kbbk....', '....kbybk...', '...kbbbbk...', '...kbbbybk..', '..kbybbbbk..', '..kbbbbbbbk.', '.kbbbbybbbk.', 'kkkkkkkkkkkk', 'kBBBBBBBBBBk', '.kkkkkkkkkk.'],
  'sugna': ['...kkkkkk...', '..k......k..', '.kkkkkkkkkk.', '.kwwwcwwwwk.', '.kwcwwwwcwk.', '.kGGGGGGGGk.', '.kgggggggGk.', '..kgggggGk..', '..kgggggGk..', '..kGGGGGGk..', '...kkkkkk...', '............'],
  'ranocchio': ['............', '.kk...kk....', 'kwdkkkwdk...', 'kvvvvvvvk...', 'kvvvvvvvvkaa', '.kvVVVVvk.a.', '.kvvvvvvk..a', 'kvVvvvvVvk..', 'kvvkvvkvvk..', 'kVk.kk.kVk..', 'kk......kk..', '............'],
  'latte': ['............', '..kkkkkkkk..', '..kggggggk..', '..kwwwwwwk..', '..kwwwwwwk..', '..kwwwwwgk..', '...kwwwwk...', '...kwwwgk...', '...kwwwwk...', '...kwwwgk...', '...kkkkkk...', '............'],
  'corda': ['............', '...kkkkkk...', '..ksesesek..', '.kek....kek.', '.ks..kk..sk.', '.ke.kesk.ek.', '.ks.kske.sk.', '.ke..kk..ek.', '.kek....kek.', '..ksesesek.s', '...kkkkkk.e.', '..........s.'],
  'zoccoli': ['............', '.....kkkk...', '..kkkmmmmk..', '.kmmmmmmmk..', '.kMMMMMMMk..', '..kk...kk...', '......kkkk..', '...kkkmmmmk.', '..kmmmmmmmk.', '..kMMMMMMMk.', '...kk...kk..', '............'],
  'spillo': ['............', '...kk.......', '..krrk......', '..krRk......', '...kkk......', '....kgk.....', '.....kgk....', '......kgk...', '......kgk...', '.....kgk....', '....kgk.....', '....kk......'],
  'salasso': ['.....kk.....', '....kggk....', '...kgaagk...', '..kgaaaagk..', '..kaaaaaak..', '..kaaaaaak..', '..kgaaaagk..', '..kkkkkkkk..', '.....rr.....', '....rrrr....', '....rRRr....', '.....rr.....'],
  'nebbia': ['............', '............', '....kkk.....', '...kgggk.kk.', '..kgggggkggk', '.kggwggggggk', 'kggggggggGGk', 'kgGggggGgggk', '.kGGGGGGGGk.', '..kkkkkkkk..', '............', '............'],
  'lume': ['...g........', '....g.......', '...g........', '....k.......', '...kOk......', '..kyyyk.kk..', '.kyyyyykyyk.', 'kyywyyyyyk..', 'kyyyyyyyk...', '.kOOOOOk....', '..kkkkk.....', '............'],
  'benda': ['............', '............', '............', 'kkkkkkkkkk..', 'kdddddddddk.', 'kdDddddDddkk', 'kdddddddddkd', 'kkkkkkkkkkdk', '.........kdk', '..........kd', '...........k', '............'],
});

SPRITE_PROIETTILI.viola = ['..kkkk..', '.kppppk.', 'kpwppPPk', 'kppppPPk', 'kpppPPPk', 'kPPPPPPk', '.kPPPPk.', '..kkkk..']; // colpi a ricerca del Cucchiaio
// --- D: fine ---
