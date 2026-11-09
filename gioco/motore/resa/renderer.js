/**
 * motore/resa/renderer.js — Renderer del Teatro delle Marionette d'Ombra (Variante C + Donna Luciana).
 *
 * Implementa:
 *  - Tavola approvata Variante C (quinte drappeggiate aperte, fondale di Piazza Dante e Reggia di Caserta,
 *    luna crema, fili d'oro del Velo, pavimento in basolato retroilluminato con pozze di lanterna);
 *  - Sopra a tutto: le Grandi Mani di Marionetta con bilancini in legno e fili d'oro tesi verso i
 *    personaggi e i nemici nella stanza;
 *  - Nella stanza Boss: le Mani scendono nel palco e diventano Donna Luciana (la Marionettista del Velo);
 *  - Disegni rifiniti per Ferruccio (burattino articolato in crema con coppolone, maschera col becco,
 *    sciarpa rossa a due code, stocco), Gatto d'ombra, Vespa, Statua, Guardia, NPC dell'Hub (Tonino col
 *    banchetto delle mozzarelle, Taddeo, Agnese) e feedback dei colpi marcato alla Isaac (flash bianco,
 *    squash direzionale, onda d'urto, schizzi d'inchiostro rimasti a terra, scossa).
 *
 * Rispetta le regole del motore: nessun generatore casuale nativo.
 */

import {
  disegnaGrigliaPixel,
  SPRITE_FERRUCCIO,
  SPRITE_SPADA_FRAMES,
  SPRITE_PROIETTILI,
  SPRITE_MANO_MARIONETTA,
  SPRITE_NEMICI,
  SPRITE_BOSS,
} from './pixel-sprites.js';

const TAU = Math.PI * 2;

function rngDet(seme) {
  let t = (seme >>> 0) || 1;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function creaRenderer({
  canvas, campo, ferruccio, combattimento, bersagli, proiettili = () => [],
  token, scena, contaTick = () => 0, notte = null, camera = null,
  economia = null, banchetto = null, piedistalli = null, ricordi = null,
  hub = null, ciclo = null, eventi = null, motoRidotto = false, foglioGiocatore = () => null,
  feel = null, // --- squadra feel (P08): scossa contestuale, macchie a terra, lampeggio ---
  squadraOggetti = null, // --- squadra oggetti (storie P04/P09): getter di segreta, gratis, patto ---
}) {
  const ctx = canvas.getContext('2d');
  const W = scena.larghezza;
  const H = scena.altezza;

  const P = {
    ink: '#0b0704', inkMid: '#180d06', bruno: '#5a2a0e',
    carta: '#c98a3c', luce: '#f2c278', pav: '#9a6428',
    crema: '#f4e3bd', bianco: '#fff8e8', oro: '#f3c14b',
    oroDim: '#b88b32', rosso: '#c8301b', rossoDeep: '#8f1d14',
    azzurro: '#7fd3ff', legno: '#241207',
  };

  // Stato visivo per il feedback dei colpi alla Isaac (flash, schizzi, onde d'urto, scossa)
  const schizziStanza = [];
  const ondeUrto = [];
  const flashBersagli = new Map();
  let scossa = 0;
  let ultimaStanzaId = null;
  let ultimoAlphaSagoma = 1; // squadra feel: alpha usato nell'ultimo frame per la sagoma di Ferruccio (QA)

  if (eventi) {
    eventi.on('ferruccio.colpo', (ev) => {
      const b = ev?.bersaglio;
      const bx = b?.x ?? ferruccio.x;
      const by = b?.y ?? ferruccio.y;
      if (b?.id) flashBersagli.set(b.id, contaTick() + 7);
      ondeUrto.push({ x: bx, y: by, tick0: contaTick(), durata: 14 });
      const r = rngDet((contaTick() * 2654435761) ^ Math.round(bx * 31 + by * 17));
      const angBase = Math.atan2(by - ferruccio.y, bx - ferruccio.x);
      for (let i = 0; i < 12; i++) {
        const a = angBase + (r() - 0.5) * 1.6;
        const d = 10 + r() * 56;
        schizziStanza.push({
          x: bx + Math.cos(a) * d,
          y: by + Math.sin(a) * d * 0.65,
          r: 2 + r() * 4.5,
          ang: a,
          oro: i % 4 === 0,
        });
      }
      if (schizziStanza.length > 90) schizziStanza.splice(0, schizziStanza.length - 90);
      // --- squadra feel: inizio --- la scossa contestuale la decide feel.js dai parametri (resa.json)
      if (!feel && !motoRidotto) scossa = Math.min(9, scossa + (ev?.critico ? 7 : 4.5));
      // --- squadra feel: fine ---
    });
    eventi.on('ferruccio.parata', () => {
      ondeUrto.push({ x: ferruccio.x, y: ferruccio.y, tick0: contaTick(), durata: 18, parata: true });
      if (!feel && !motoRidotto) scossa = Math.min(10, scossa + 6); // squadra feel: con feel.js la scossa è sua
    });
    eventi.on('notte.stanza', ({ id, a }) => {
      const nuova = a ?? id; // squadra feel: il payload di notte.js è {da, a, lato, tipo}
      if (nuova !== ultimaStanzaId) {
        ultimaStanzaId = nuova;
        schizziStanza.length = 0;
        ondeUrto.length = 0;
      }
    });
  }

  // Precalcolo del fondale di Piazza Dante e Reggia (Variante C)
  let cacheFondale = null;
  function ottieniFondale() {
    if (cacheFondale) return cacheFondale;
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = 320;
    const x = c.getContext('2d');
    const yG = 165;

    const sky = x.createLinearGradient(0, 0, 0, yG);
    sky.addColorStop(0, '#120703');
    sky.addColorStop(0.3, '#2d1307');
    sky.addColorStop(0.65, '#6e3412');
    sky.addColorStop(1, '#d8963e');
    x.fillStyle = sky;
    x.fillRect(0, 0, W, yG);

    // Bagliore dietro la Reggia
    const hot = x.createRadialGradient(640, yG - 40, 10, 640, yG - 40, 380);
    hot.addColorStop(0, 'rgba(255,232,175,0.72)');
    hot.addColorStop(0.5, 'rgba(243,193,75,0.25)');
    hot.addColorStop(1, 'rgba(243,193,75,0)');
    x.fillStyle = hot;
    x.fillRect(0, 0, W, yG);

    // Luna crema in alto a sinistra
    const mx = 310, my = 52, mr = 24;
    const halo = x.createRadialGradient(mx, my, 2, mx, my, mr * 3.5);
    halo.addColorStop(0, 'rgba(255,246,220,0.85)');
    halo.addColorStop(1, 'rgba(255,230,175,0)');
    x.fillStyle = halo;
    x.beginPath(); x.arc(mx, my, mr * 3.5, 0, TAU); x.fill();
    x.fillStyle = '#fff5d8';
    x.beginPath(); x.arc(mx, my, mr, 0, TAU); x.fill();

    // Reggia di Caserta all'orizzonte
    x.fillStyle = '#240f05';
    x.fillRect(500, yG - 64, 280, 64);
    x.fillRect(606, yG - 80, 68, 16);
    x.beginPath();
    x.moveTo(600, yG - 80); x.lineTo(640, yG - 98); x.lineTo(680, yG - 80);
    x.closePath();
    x.fill();
    x.fillStyle = 'rgba(255,214,128,0.75)';
    for (let wx = 514; wx <= 766; wx += 14) {
      if (Math.abs(wx - 640) < 12) continue;
      x.fillRect(wx, yG - 54, 4, 7);
      x.fillRect(wx, yG - 38, 4, 7);
    }

    // Palazzi laterali con finestre accese e fili d'oro
    for (const [x0, x1] of [[40, 430], [850, 1240]]) {
      x.fillStyle = '#150a04';
      x.fillRect(x0, yG - 135, x1 - x0, 140);
      for (let wx = x0 + 36; wx < x1 - 30; wx += 84) {
        const wy = yG - 104;
        x.fillStyle = '#f3b952';
        x.beginPath();
        x.arc(wx, wy + 10, 10, Math.PI, 0);
        x.lineTo(wx + 10, wy + 32);
        x.lineTo(wx - 10, wy + 32);
        x.closePath();
        x.fill();
        // Sagoma dormiente
        x.fillStyle = P.ink;
        x.beginPath(); x.arc(wx, wy + 15, 4.2, 0, TAU); x.fill();
        x.fillRect(wx - 7, wy + 20, 14, 12);
        // Filo d'oro verso la Reggia
        x.strokeStyle = 'rgba(255,228,150,0.68)';
        x.lineWidth = 1.1;
        x.beginPath();
        x.moveTo(wx, wy + 12);
        x.quadraticCurveTo((wx + 640) * 0.5, yG - 32, 640, yG - 62);
        x.stroke();
      }
    }
    cacheFondale = c;
    return c;
  }

  function ellisseAppoggio(px, py, rx, ry, alpha = 0.48) {
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, rx);
    g.addColorStop(0, `rgba(11,7,4,${alpha})`);
    g.addColorStop(0.7, `rgba(11,7,4,${alpha * 0.8})`);
    g.addColorStop(1, 'rgba(11,7,4,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(242,194,120,0.26)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, 1, rx * 0.88, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.restore();
  }

  function disegnaManoMarionettista(cx, cy, lato, scala, tAnim, bersagliFili) {
    const swayX = Math.sin(tAnim * 1.5 + lato) * 7;
    const swayY = Math.cos(tAnim * 1.9 + lato * 0.5) * 3.5;
    const mx = cx + swayX;
    const my = cy + swayY;

    ctx.save();
    if (bersagliFili && bersagliFili.length) {
      const attacchi = [
        [mx - 42 * scala * lato, my + 24 * scala],
        [mx - 12 * scala * lato, my + 26 * scala],
        [mx + 14 * scala * lato, my + 26 * scala],
        [mx + 42 * scala * lato, my + 24 * scala],
      ];
      for (let i = 0; i < bersagliFili.length; i++) {
        const [tx, ty] = bersagliFili[i];
        const [ax, ay] = attacchi[i % attacchi.length];
        ctx.strokeStyle = 'rgba(247,200,68,0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.round(ax), Math.round(ay));
        ctx.lineTo(Math.round(tx), Math.round(ty));
        ctx.stroke();
      }
    }
    ctx.restore();

    const frameIdx = Math.floor(contaTick() / 16) % SPRITE_MANO_MARIONETTA.length;
    disegnaGrigliaPixel(ctx, SPRITE_MANO_MARIONETTA[frameIdx], mx, my, Math.max(3, Math.round(4 * scala)), lato < 0, false);
  }

  function disegnaDonnaLucianaBoss(cx, cy, tAnim, bersagliFili) {
    const floatY = Math.sin(tAnim * 2.2) * 4;
    disegnaGrigliaPixel(ctx, SPRITE_BOSS['donna-luciana'], cx, cy - 32 + floatY, 4.5, false, false);
    disegnaManoMarionettista(cx - 135, cy - 75, 1, 0.88, tAnim, bersagliFili.slice(0, 2));
    disegnaManoMarionettista(cx + 135, cy - 75, -1, 0.88, tAnim, bersagliFili.slice(2, 4));
  }

  function disegnaCampoEMura(tAnim) {
    const { x: fx, y: fy, larghezza: fw, altezza: fh, cella } = campo;
    const fr = fx + fw, fb = fy + fh;

    // Pavimento caldo con gradiente, basolato e rosone centrale
    const pg = ctx.createRadialGradient(fx + fw * 0.5, fy + fh * 0.45, 20, fx + fw * 0.5, fy + fh * 0.5, fw * 0.65);
    pg.addColorStop(0, '#b57835');
    pg.addColorStop(0.55, '#9a6428');
    pg.addColorStop(1, '#6b3e16');
    ctx.fillStyle = pg;
    ctx.fillRect(fx, fy, fw, fh);

    // Griglia prospettica leggera del basolato
    ctx.strokeStyle = 'rgba(42,18,6,0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= campo.colonne; i++) {
      ctx.beginPath();
      ctx.moveTo(fx + i * cella, fy);
      ctx.lineTo(fx + i * cella, fb);
      ctx.stroke();
    }
    for (let j = 0; j <= campo.righe; j++) {
      ctx.beginPath();
      ctx.moveTo(fx, fy + j * cella);
      ctx.lineTo(fr, fy + j * cella);
      ctx.stroke();
    }

    // Rosone barocco al centro della stanza
    ctx.save();
    ctx.translate(fx + fw * 0.5, fy + fh * 0.5);
    ctx.scale(1, 0.6);
    ctx.strokeStyle = 'rgba(242,194,120,0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 120, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 112, 0, TAU); ctx.stroke();
    ctx.restore();

    // Pozze di luce delle lanterne
    for (const lx of [fx + fw * 0.25, fx + fw * 0.75]) {
      const lg = ctx.createRadialGradient(lx, fy + fh * 0.42, 4, lx, fy + fh * 0.42, 180);
      lg.addColorStop(0, 'rgba(255,204,112,0.34)');
      lg.addColorStop(1, 'rgba(255,204,112,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(lx, fy + fh * 0.42, 180, 0, TAU); ctx.fill();
    }

    // Muro nord con archi ciechi e bordo di carta chiara
    const wallH = 38;
    const wg = ctx.createLinearGradient(0, fy - wallH, 0, fy);
    wg.addColorStop(0, '#0d0603');
    wg.addColorStop(1, '#3b1c0a');
    ctx.fillStyle = wg;
    ctx.fillRect(fx - 24, fy - wallH, fw + 48, wallH);
    ctx.strokeStyle = 'rgba(242,194,120,0.65)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(fx, fy, fw, fh);

    // Schizzi d'inchiostro rimasti sul pavimento dai colpi alla Isaac
    for (const sp of schizziStanza) {
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(sp.ang);
      ctx.fillStyle = sp.oro ? P.oro : 'rgba(11,7,4,0.82)';
      ctx.beginPath();
      ctx.ellipse(0, 0, sp.r * 1.6, sp.r * 0.75, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // --- squadra feel: inizio --- macchie permanenti dei nemici morti (china o schegge), per stanza
    feel?.disegnaMacchie(ctx);
    // --- squadra feel: fine ---

    // Solidi: porte, finestre, colonne, panche
    for (const s of campo.solidi) {
      if (s.id === 'muro' || s.id === 'ingresso') continue;
      if (s.id === 'porta') {
        const porta = notte?.()?.stanza?.portaIn(s.slot);
        const stato = porta?.stato ?? 'aperta';
        const chiusa = stato === 'chiusa' || stato === 'chiudendo';
        ctx.fillStyle = chiusa ? P.ink : P.oro;
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = P.oro;
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x, s.y, s.w, s.h);
        continue;
      }
      if (s.id === 'finestra') {
        ctx.fillStyle = P.oro;
        ctx.fillRect(s.x + 4, s.y + 4, s.w - 8, s.h - 8);
        continue;
      }
      // Ostacoli interni (colonne barocche, panche, telai)
      ctx.fillStyle = P.ink;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = 'rgba(242,194,120,0.55)';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
    }
  }

  function disegnaHubScena(tAnim) {
    const h = hub?.();
    if (!h || !h.attivo) return [];
    const puntiFili = [];
    const vicino = h.vicino();

    for (const p of h.presenze()) {
      if (!p.presente) continue;
      if (p.tipo === 'finestra') {
        ctx.fillStyle = p.accesa ? P.oro : '#241207';
        ctx.strokeStyle = P.oro;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 6, 14, Math.PI, 0);
        ctx.lineTo(p.x + 14, p.y + 18);
        ctx.lineTo(p.x - 14, p.y + 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (p.tipo === 'porta') {
        ctx.fillStyle = p.stato === 'chiusa' ? P.ink : P.oro;
        ctx.strokeStyle = P.oro;
        ctx.lineWidth = 2;
        ctx.fillRect(p.x - 22, p.y - 26, 44, 52);
        ctx.strokeRect(p.x - 22, p.y - 26, 44, 52);
      } else if (p.tipo === 'npc') {
        puntiFili.push([p.x, p.y - 42]);
        ellisseAppoggio(p.x, p.y + 10, 22, 8, 0.5);
        // Alone d'oro attorno all'NPC
        const ag = ctx.createRadialGradient(p.x, p.y - 12, 2, p.x, p.y - 12, 42);
        ag.addColorStop(0, vicino?.id === p.id ? 'rgba(243,193,75,0.55)' : 'rgba(243,193,75,0.25)');
        ag.addColorStop(1, 'rgba(243,193,75,0)');
        ctx.fillStyle = ag;
        ctx.beginPath(); ctx.arc(p.x, p.y - 12, 42, 0, TAU); ctx.fill();

        // Banchetto di Tonino o silhouette NPC
        if (p.id.includes('tonino')) {
          ctx.fillStyle = '#2a1408';
          ctx.strokeStyle = P.oro;
          ctx.lineWidth = 1.4;
          ctx.fillRect(p.x - 42, p.y - 4, 84, 22);
          ctx.strokeRect(p.x - 42, p.y - 4, 84, 22);
          ctx.fillStyle = P.crema;
          ctx.font = '8px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('MOZZARELLE', p.x, p.y + 10);
        }
        // Sagoma burattino NPC
        ctx.fillStyle = P.ink;
        ctx.strokeStyle = 'rgba(242,194,120,0.5)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(p.x - 14, p.y + 6);
        ctx.quadraticCurveTo(p.x - 12, p.y - 24, p.x, p.y - 26);
        ctx.quadraticCurveTo(p.x + 12, p.y - 24, p.x + 14, p.y + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y - 34, 9, 0, TAU);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = P.crema;
        ctx.font = '11px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.personaggio ?? p.id, p.x, p.y + 26);
      }
    }

    const i = h.ingresso;
    if (i) {
      const ig = ctx.createRadialGradient(i.x + i.w / 2, i.y + i.h / 2, 4, i.x + i.w / 2, i.y + i.h / 2, 54);
      ig.addColorStop(0, 'rgba(243,193,75,0.65)');
      ig.addColorStop(1, 'rgba(243,193,75,0)');
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.arc(i.x + i.w / 2, i.y + i.h / 2, 54, 0, TAU); ctx.fill();
      ctx.fillStyle = P.oro;
      ctx.fillRect(i.x, i.y, i.w, i.h);
      ctx.fillStyle = P.crema;
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`PIANO ${h.piano} →`, i.x - 28, i.y + i.h / 2 + 4);
    }
    return puntiFili;
  }

  /** Fotogramma del foglio di gioco per lo stato del corpo: posa e indice (animazione a cadenza fissa di resa). */
  function fotogrammaGiocatore(foglio, stato, tick) {
    const pose = foglio.layout?.pose ?? [];
    const trova = (nome) => pose.find((q) => q.posa === nome) ?? null;
    let posa = null;
    let cadenza = 20;
    if (stato === 'cammina' || stato === 'scatta') { posa = trova('cammina'); cadenza = 8; }
    else if (stato === 'colpito') { posa = trova('colpito'); cadenza = 1; }
    else if (stato === 'morto') { posa = trova('morto'); cadenza = 12; }
    if (!posa) posa = trova('fermo') ?? pose[0] ?? { riga: 0, da: 0, fotogrammi: 1 };
    const n = Math.max(1, posa.fotogrammi ?? 1);
    let i = Math.floor(tick / cadenza) % n;
    if (stato === 'morto') i = Math.min(n - 1, Math.floor(tick / cadenza) % (n * 4)); // la posa di morte si ferma sull'ultimo
    return { colonna: (posa.da ?? 0) + i, riga: posa.riga ?? 0 };
  }

  function disegnaFerruccioAttore(tAnim) {
    const px = ferruccio.x;
    const py = ferruccio.y;
    const mira = ferruccio.direzioneMira();
    const verso = mira.x < -0.05 ? -1 : 1;
    const cammina = ferruccio.stato === 'cammina';
    const tick = contaTick();
    const flash = ferruccio.invulnerabile() && (tick % 4 < 2);

    ellisseAppoggio(px, py + 12, 20, 8, 0.5);

    // Sprite DI GIOCO del personaggio scelto (manifesto degli sprite consegnato dall'autore): se il foglio è
    // caricato si disegna il fotogramma della posa, ancorato ai piedi, ribaltato verso sinistra se serve;
    // altrimenti resta il disegno procedurale di Ferruccio qui sotto.
    const foglio = foglioGiocatore();
    if (foglio && foglio.img && foglio.img.complete && foglio.img.naturalWidth > 0) {
      const { colonna, riga } = fotogrammaGiocatore(foglio, ferruccio.stato, tick);
      const fw = foglio.larghezza;
      const fh = foglio.altezza;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (flash) ctx.globalAlpha = 0.4; // invulnerabile: lampeggio semitrasparente (la squadra feel lo porta a parametro)
      ctx.translate(px, py + 12);
      if (verso < 0) ctx.scale(-1, 1);
      ctx.drawImage(foglio.img, colonna * fw, riga * fh, fw, fh, -fw / 2, -fh, fw, fh);
      ctx.restore();
      return;
    }

    // Ferruccio NON ha il filo: è l'unico burattino che ha spezzato i propri fili;
    // solo tutti gli altri personaggi e nemici hanno i fili collegati alle Mani in alto.

    // Disegno pittorico dark-fairytale di Ferruccio fedele all'immagine di riferimento:
    // cappuccio conico in stoffa crema, cavità ovale nera col volto e due occhi bianchi luminosi,
    // sciarpa rossa a due code svolazzanti, mantello a campana crema, gambe sottili scure e stocco.
    const conSpada = typeof combattimento?.haSpada === 'function' ? combattimento.haSpada() : false;
    const inFendente = combattimento.stato === 'fendente';
    const angMira = Math.atan2(mira.y, mira.x);

    ctx.save();
    ctx.translate(px, py);
    if (verso < 0) ctx.scale(-1, 1);
    const sc = 1.65;
    ctx.scale(sc, sc);

    const walkCycle = cammina ? Math.sin(tick * 0.34) : 0;
    const bobY = cammina ? -Math.abs(Math.sin(tick * 0.34)) * 2.2 : Math.sin(tick * 0.08) * 0.7;

    // 1. Gambe sottili scure e scarpette a punta
    const legL = walkCycle * 3.5;
    const legR = -walkCycle * 3.5;
    ctx.strokeStyle = flash ? '#ffffff' : '#090706';
    ctx.fillStyle = flash ? '#ffffff' : '#18120e';
    ctx.lineWidth = 1.2;
    for (const [lx, off] of [[-2.6, legL], [2.2, legR]]) {
      ctx.beginPath();
      ctx.moveTo(lx - 1.1, -1);
      ctx.lineTo(lx - 0.9 + off * 0.35, 8.5);
      ctx.lineTo(lx + 1.0 + off * 0.35, 8.5);
      ctx.lineTo(lx + 1.1, -1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(lx + 1.2 + off * 0.4, 9.2, 2.7, 1.25, 0.08, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }

    ctx.translate(0, bobY);

    // 2. Code della sciarpa rossa che svolazzano all'indietro
    const w1 = Math.sin(tick * 0.16) * 2.4;
    const w2 = Math.cos(tick * 0.14 + 0.9) * 2.8;
    const gScarf = ctx.createLinearGradient(-24, -14, -2, -10);
    gScarf.addColorStop(0, flash ? '#ffffff' : '#78120a');
    gScarf.addColorStop(0.55, flash ? '#ffffff' : '#c92818');
    gScarf.addColorStop(1, flash ? '#ffffff' : '#e63e2b');
    ctx.fillStyle = gScarf;
    ctx.strokeStyle = '#140806';
    ctx.lineWidth = 1.05;

    ctx.beginPath();
    ctx.moveTo(-3.5, -13.5);
    ctx.bezierCurveTo(-10, -16.5 + w1 * 0.5, -17, -12.5 - w1 * 0.4, -23.5, -15.2 + w1);
    ctx.bezierCurveTo(-18.5, -10.2 + w1 * 0.6, -11, -10.8, -3.5, -10.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-4, -11.2);
    ctx.bezierCurveTo(-9.5, -9.2 + w2 * 0.4, -15.5, -3.5 - w2 * 0.3, -21.5, -4.8 + w2);
    ctx.bezierCurveTo(-15.5, -1.0 + w2 * 0.5, -9.5, -5.8, -3, -8.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Mantello a campana in stoffa crema con pieghe pittoriche
    const gCloak = ctx.createLinearGradient(-8, -13, 8, 2);
    gCloak.addColorStop(0, flash ? '#ffffff' : '#fbf3e4');
    gCloak.addColorStop(0.55, flash ? '#ffffff' : '#dfd1b8');
    gCloak.addColorStop(1, flash ? '#ffffff' : '#9c8b70');
    ctx.fillStyle = gCloak;
    ctx.strokeStyle = '#16110c';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(-4.8, -12.8);
    ctx.bezierCurveTo(-8.2, -7.5, -10.4, -2.0, -11.2, 0.8);
    ctx.quadraticCurveTo(-7.2, 2.2, -3.6, 1.1);
    ctx.quadraticCurveTo(0, 2.5, 3.8, 1.2);
    ctx.quadraticCurveTo(7.5, 2.3, 10.6, 0.6);
    ctx.bezierCurveTo(8.8, -4.0, 6.8, -8.8, 4.5, -12.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!flash) {
      ctx.strokeStyle = 'rgba(56, 42, 28, 0.42)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-3.2, -10.5); ctx.quadraticCurveTo(-5.2, -4.5, -6.2, 1.0);
      ctx.moveTo(0.4, -10.8);  ctx.quadraticCurveTo(0.8, -4.2, 1.2, 1.5);
      ctx.moveTo(3.2, -10.2);  ctx.quadraticCurveTo(5.0, -4.5, 6.0, 1.0);
      ctx.stroke();
    }

    // 4. Manica anteriore, guantino nero e Stocco sottile a riposo
    ctx.fillStyle = flash ? '#ffffff' : '#ede0c9';
    ctx.strokeStyle = '#16110c';
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(-0.8, -9.8);
    ctx.quadraticCurveTo(2.6, -6.5, 2.2, -1.5);
    ctx.quadraticCurveTo(-0.5, -1.0, -2.2, -2.2);
    ctx.quadraticCurveTo(-2.4, -6.2, -0.8, -9.8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = flash ? '#ffffff' : '#0f0c0a';
    ctx.beginPath();
    ctx.arc(0.9, -0.7, 1.7, 0, TAU);
    ctx.fill();

    if (conSpada && !inFendente) {
      ctx.save();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(1.2, -0.5);
      ctx.lineTo(13.8, 9.8);
      ctx.stroke();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(1.5, -0.3);
      ctx.lineTo(13.5, 9.5);
      ctx.stroke();
      ctx.strokeStyle = '#d4a338';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-0.5, 1.0);
      ctx.lineTo(3.0, -2.0);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Girocollo della sciarpa rossa
    ctx.fillStyle = flash ? '#ffffff' : '#d62f1f';
    ctx.strokeStyle = '#160906';
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.ellipse(0, -12.6, 5.6, 2.1, 0.05, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // 6. Cappuccio conico arrotondato in stoffa crema + cavità ovale nera + 2 occhi bianchi luminosi
    const gHood = ctx.createRadialGradient(-1, -21, 1.5, 0, -20, 14);
    gHood.addColorStop(0, flash ? '#ffffff' : '#fdf6e9');
    gHood.addColorStop(0.58, flash ? '#ffffff' : '#dfd0b5');
    gHood.addColorStop(1, flash ? '#ffffff' : '#948266');
    ctx.fillStyle = gHood;
    ctx.strokeStyle = '#16110c';
    ctx.lineWidth = 1.25;

    ctx.beginPath();
    ctx.moveTo(-6.2, -13.6);
    ctx.bezierCurveTo(-9.5, -15.8, -9.8, -21.5, -6.6, -24.8);
    ctx.bezierCurveTo(-5.8, -28.8, -6.5, -33.2, -5.2, -37.2);
    ctx.bezierCurveTo(-2.4, -33.2, 0.4, -29.2, 2.8, -25.8);
    ctx.bezierCurveTo(7.4, -24.2, 8.8, -19.5, 6.8, -15.2);
    ctx.bezierCurveTo(4.5, -13.0, -2.8, -12.8, -6.2, -13.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!flash) {
      ctx.strokeStyle = 'rgba(62, 46, 30, 0.42)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(-5.4, -25.2);
      ctx.quadraticCurveTo(-1.5, -24.0, 2.0, -25.4);
      ctx.stroke();
    }

    ctx.fillStyle = '#06070a';
    ctx.strokeStyle = '#382a1e';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(2.8, -19.2, 4.3, 4.9, 0.06, 0, TAU);
    ctx.fill();
    ctx.stroke();

    const eyeGlow = 0.85 + 0.15 * Math.sin(tick * 0.15);
    for (const [ex, ey, er] of [[1.4, -19.0, 1.15], [4.7, -19.1, 1.05]]) {
      const gEye = ctx.createRadialGradient(ex, ey, 0.1, ex, ey, er * 2.3);
      gEye.addColorStop(0, '#ffffff');
      gEye.addColorStop(0.45, `rgba(255, 246, 210, ${eyeGlow})`);
      gEye.addColorStop(1, 'rgba(255, 210, 120, 0)');
      ctx.fillStyle = gEye;
      ctx.beginPath();
      ctx.arc(ex, ey, er * 2.3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, ey, er * 0.78, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // Fendente luminoso a mezzaluna (quando attacca con lo stocco)
    if (conSpada && inFendente) {
      const idxFrame = typeof combattimento.frameSpada === 'function' ? combattimento.frameSpada() : 0;
      const sx = px + Math.cos(angMira) * 26;
      const sy = (py - 14) + Math.sin(angMira) * 26;
      disegnaGrigliaPixel(ctx, SPRITE_SPADA_FRAMES[idxFrame] || SPRITE_SPADA_FRAMES[0], sx, sy, 3, false, false, angMira);
    }

    // Proiettili 4 direzioni di Ferruccio + animazione frame-by-frame dell'impatto (splash)
    const proiettiliF = typeof combattimento?.proiettiliFerruccio === 'function' ? combattimento.proiettiliFerruccio() : [];
    for (const p of proiettiliF) {
      ellisseAppoggio(p.x, p.y + 14, 8, 3.5, 0.35);
      const sp = SPRITE_PROIETTILI[p.tipo] || SPRITE_PROIETTILI.base;
      const scalaP = p.r > 9 ? 3.2 : 2.5;
      disegnaGrigliaPixel(ctx, sp, p.x, p.y, scalaP, false, false);
    }
    const esplosioniF = typeof combattimento?.esplosioniProiettili === 'function' ? combattimento.esplosioniProiettili() : [];
    for (const e of esplosioniF) {
      const f = e.tick < 4 ? 'splash0' : e.tick < 8 ? 'splash1' : 'splash2';
      disegnaGrigliaPixel(ctx, SPRITE_PROIETTILI[f], e.x, e.y, 2.8, false, false);
    }
    // Storia P04: fulmini a catena (Catena della Chiusa) tra il colpito e i vicini
    const fulmini = typeof combattimento?.scintilleFulmine === 'function' ? combattimento.scintilleFulmine() : [];
    for (const f of fulmini) {
      ctx.save();
      ctx.strokeStyle = P.azzurro;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1 - f.tick / f.maxTick;
      ctx.beginPath();
      ctx.moveTo(f.x1, f.y1 - 8);
      ctx.lineTo((f.x1 + f.x2) / 2 + 6, (f.y1 + f.y2) / 2 - 14);
      ctx.lineTo(f.x2, f.y2 - 8);
      ctx.stroke();
      ctx.restore();
    }
  }

  function disegnaBersaglioMarionetta(b, tAnim) {
    const morto = b.stato === 'morto';
    const inFlash = (flashBersagli.get(b.id) ?? 0) > contaTick();
    const dir = (b.direzione?.x ?? -1) < 0 ? -1 : 1;

    ellisseAppoggio(b.x, b.y + b.r * 0.45, b.r * 1.35, b.r * 0.48, 0.45);

    // Regola dell'autore (2026-11-08): nessun segno a terra, corridoio o anello che anticipi il colpo.
    // Il nemico si legge solo dal corpo: postura di anticipo (si accuccia) e occhi rossi nel lampo.
    const inAnticipo = b.stato === 'anticipo';
    const inLampo = b.stato === 'lampo' || b.lampoAcceso === true;

    ctx.save();
    if (inAnticipo) {
      ctx.translate(b.x, b.y);
      ctx.scale(1.08, 0.9);
      ctx.translate(-b.x, -b.y);
    }
    ctx.globalAlpha = morto && typeof b.dissoluzione === 'number' ? Math.max(0.15, 1 - b.dissoluzione) : 1;

    // Filo d'oro di controllo
    ctx.strokeStyle = 'rgba(247,200,68,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - b.r);
    ctx.lineTo(b.x, b.y - b.r - 45);
    ctx.stroke();

    const frame = Math.floor(contaTick() / 8) % 2;
    if (b.boss && b.bossId && SPRITE_BOSS[b.bossId]) {
      if (b.bossId !== 'donna-luciana') {
        disegnaGrigliaPixel(ctx, SPRITE_BOSS[b.bossId], b.x, b.y - 12, 4, dir < 0, inFlash);
      }
    } else {
      const arch = b.archetipo && SPRITE_NEMICI[b.archetipo] ? b.archetipo : 'gatto';
      const frames = SPRITE_NEMICI[arch];
      disegnaGrigliaPixel(ctx, frames[frame % frames.length], b.x, b.y - 10, b.boss ? 4 : 3, dir < 0, inFlash);
    }
    ctx.restore();

    // Occhi rossi sulla sagoma nel lampo (come in Isaac): il segnale sta sul corpo, mai a terra
    if (inLampo && !morto) {
      const occhio = Math.max(2, b.r * 0.16);
      const yOcchi = b.y - b.r * (b.boss ? 1.4 : 1.1);
      ctx.save();
      ctx.fillStyle = P.rosso;
      ctx.fillRect(b.x - b.r * 0.34 - occhio / 2, yOcchi, occhio, occhio);
      ctx.fillRect(b.x + b.r * 0.34 - occhio / 2, yOcchi, occhio, occhio);
      ctx.restore();
    }
  }

  function disegnaOndeUrto() {
    const tick = contaTick();
    for (let i = ondeUrto.length - 1; i >= 0; i--) {
      const o = ondeUrto[i];
      const dt = tick - o.tick0;
      if (dt > o.durata) {
        ondeUrto.splice(i, 1);
        continue;
      }
      const t = dt / o.durata;
      const r = 14 + t * (o.parata ? 78 : 54);
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.scale(1, 0.65);
      ctx.strokeStyle = o.parata ? `rgba(127,211,255,${1 - t})` : `rgba(255,248,232,${1 - t})`;
      ctx.lineWidth = 3 * (1 - t * 0.6);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  }

  // --- squadra oggetti (storie P04/P09): Crepa Dorata (finestra verso la segreta a stanza pulita), piedistallo dell'oggetto
  // gratis, altare del Patto con la luce rossa fioca della stanza, raggio cremisi continuo. Regola dell'autore 2026-11-08: nessun
  // segno a terra che anticipi un attacco nemico (qui si disegnano solo oggetti e il colpo di Ferruccio). Palette P, come il resto. ---
  function disegnaSquadraOggetti() {
    if (!squadraOggetti) return;
    const t = contaTick();
    const c = squadraOggetti.segreta?.()?.crepa?.();
    if (c && !c.aperta && c.visibile && c.rett) {
      const { x, y, w, h } = c.rett;
      ctx.save();
      // la cella della finestra è già chiara: la crepa è un'incrinatura d'inchiostro con un alone d'oro che pulsa
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.15);
      ctx.strokeStyle = P.carta;
      ctx.lineWidth = 6;
      ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5, y);
      ctx.lineTo(x + w * 0.35, y + h * 0.3);
      ctx.lineTo(x + w * 0.6, y + h * 0.55);
      ctx.lineTo(x + w * 0.45, y + h);
      ctx.moveTo(x + w * 0.6, y + h * 0.55);
      ctx.lineTo(x + w * 0.8, y + h * 0.7);
      ctx.stroke();
      ctx.restore();
    }
    const g = squadraOggetti.gratis?.()?.corrente?.();
    if (g && g.stato === 'offerto') {
      ctx.save();
      ctx.fillStyle = P.oroDim;
      ctx.fillRect(g.x - 18, g.y - 6, 36, 14);
      ctx.fillStyle = P.oro;
      ctx.fillRect(g.x - 14, g.y - 10, 28, 6);
      ctx.fillStyle = g.tier === 'forte' ? P.rosso : P.crema;
      ctx.beginPath(); ctx.arc(g.x, g.y - 22 + Math.sin(t * 0.1) * 3, 9, 0, TAU); ctx.fill();
      ctx.restore();
    }
    const pt = squadraOggetti.patto?.();
    if (pt?.inStanzaAltare?.()) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = P.rossoDeep;
      ctx.fillRect(campo.x - 8, campo.y - 8, campo.larghezza + 16, campo.altezza + 16);
      ctx.restore();
      for (const r of pt.altare?.reliquie ?? []) {
        if (r.stretto) continue;
        ctx.save();
        ctx.fillStyle = P.ink;
        ctx.fillRect(r.x - 20, r.y - 8, 40, 16);
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.12);
        ctx.strokeStyle = P.rosso;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(r.x, r.y - 22, 11, 0, TAU); ctx.stroke();
        ctx.fillStyle = P.rosso;
        ctx.beginPath(); ctx.arc(r.x, r.y - 22, 5, 0, TAU); ctx.fill();
        ctx.restore();
      }
    }
    const rg = typeof combattimento?.raggio === 'function' ? combattimento.raggio() : null;
    if (rg && (rg.attivo || rg.carica > 0) && (rg.dx || rg.dy)) {
      const x0 = rg.x;
      const y0 = rg.y - 14;
      const x1 = x0 + rg.dx * rg.lunghezza;
      const y1 = y0 + rg.dy * rg.lunghezza;
      ctx.save();
      ctx.lineCap = 'round';
      if (rg.attivo) {
        for (const [colore, larg, alpha] of [[P.rossoDeep, rg.larghezza, 0.75], [P.rosso, rg.larghezza * 0.5, 1], [P.bianco, Math.max(2, rg.larghezza * 0.15), 1]]) {
          ctx.strokeStyle = colore; ctx.lineWidth = larg; ctx.globalAlpha = alpha;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
      } else {
        ctx.fillStyle = P.rosso;
        ctx.globalAlpha = 0.5 + 0.5 * rg.carica;
        ctx.beginPath(); ctx.arc(x0 + rg.dx * 22, y0 + rg.dy * 22, 4 + 8 * rg.carica, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }
  // --- squadra oggetti: fine ---

  function disegnaOggettiEInteragibili() {
    const st = notte?.()?.stanza;
    if (st) {
      // Bracieri
      for (const p of st.pericoli) {
        // Regola dell'autore (2026-11-08): il braciere è un oggetto visibile, senza anelli tratteggiati di anticipo:
        // in `attivo` la fiamma piena (è il pericolo stesso), in `anticipo` solo le braci che si ravvivano.
        const attivo = p.fase === 'attivo';
        const anticipo = p.fase === 'anticipo';
        if (attivo) {
          ctx.save();
          const fiamma = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.rFiamma);
          fiamma.addColorStop(0, P.luce);
          fiamma.addColorStop(0.55, P.rosso);
          fiamma.addColorStop(1, 'rgba(200,48,27,0)');
          ctx.fillStyle = fiamma;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.rFiamma, 0, TAU); ctx.fill();
          ctx.restore();
        } else if (anticipo) {
          ctx.save();
          ctx.fillStyle = P.rosso;
          ctx.globalAlpha = 0.7;
          ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, TAU); ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = P.ink;
        ctx.strokeStyle = P.oro;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, TAU); ctx.fill(); ctx.stroke();
      }
      // Botola / Uscita del piano nella stanza boss (si apre dopo aver battuto il boss)
      const u = st.uscita;
      if (u) {
        ctx.save();
        if (u.attiva) {
          const glow = ctx.createRadialGradient(u.x, u.y, 4, u.x, u.y, u.raggio * 1.45);
          glow.addColorStop(0, 'rgba(243,193,75,0.65)');
          glow.addColorStop(1, 'rgba(243,193,75,0)');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(u.x, u.y, u.raggio * 1.45, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = u.attiva ? '#060302' : '#1b1109';
        ctx.strokeStyle = u.attiva ? P.oro : 'rgba(242,194,120,0.4)';
        ctx.lineWidth = u.attiva ? 3.5 : 2;
        ctx.beginPath(); ctx.arc(u.x, u.y, u.raggio, 0, TAU); ctx.fill(); ctx.stroke();
        if (u.attiva) {
          // Gradini che scendono al piano inferiore
          ctx.strokeStyle = 'rgba(243,193,75,0.75)';
          ctx.lineWidth = 2;
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(u.x - 18, u.y + i * 9);
            ctx.lineTo(u.x + 18, u.y + i * 9);
            ctx.stroke();
          }
          ctx.fillStyle = P.oro;
          ctx.font = 'bold 12px Georgia, serif';
          ctx.textAlign = 'center';
          const nPiano = notte?.()?.piano ?? 1;
          ctx.fillText(nPiano < 4 ? `▼ SCENDI AL PIANO ${nPiano + 1} ▼` : '★ VITTORIA FINALE ★', u.x, u.y - u.raggio - 10);
        } else {
          // Grata sigillata finché il boss è vivo
          ctx.strokeStyle = 'rgba(200,48,27,0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(u.x - u.raggio * 0.7, u.y - u.raggio * 0.7);
          ctx.lineTo(u.x + u.raggio * 0.7, u.y + u.raggio * 0.7);
          ctx.moveTo(u.x + u.raggio * 0.7, u.y - u.raggio * 0.7);
          ctx.lineTo(u.x - u.raggio * 0.7, u.y + u.raggio * 0.7);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Monete e cuori a terra
    const eco = economia?.();
    if (eco) {
      for (const o of eco.aTerra()) {
        ctx.save();
        ctx.translate(o.x, o.y);
        if (o.tipo === 'moneta') {
          ctx.fillStyle = P.oro;
          ctx.strokeStyle = P.ink;
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(0, 0, o.grande ? 9 : 6.5, 0, TAU); ctx.fill(); ctx.stroke();
        } else {
          ctx.fillStyle = P.crema;
          ctx.strokeStyle = P.ink;
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Ricordi (goccia azzurra)
    const ric = ricordi?.();
    if (ric) {
      for (const o of ric.aTerra(ric.stanzaCorrente)) {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.fillStyle = P.azzurro;
        ctx.strokeStyle = P.bianco;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }

    // Piedistalli dei doni (Stanza Oggetto: regala 1 oggetto randomico)
    const pd = piedistalli?.();
    if (pd?.attivo) {
      for (const p of pd.elenco()) {
        const offerto = p.stato === 'offerto';
        ctx.save();
        if (offerto) {
          const cg = ctx.createRadialGradient(p.x, p.y - 12, 2, p.x, p.y - 12, 58);
          cg.addColorStop(0, 'rgba(243,193,75,0.65)');
          cg.addColorStop(1, 'rgba(243,193,75,0)');
          ctx.fillStyle = cg;
          ctx.beginPath(); ctx.arc(p.x, p.y - 12, 58, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = P.ink;
        ctx.strokeStyle = offerto ? P.oro : P.bruno;
        ctx.lineWidth = 2.2;
        ctx.fillRect(p.x - 18, p.y - 8, 36, 22);
        ctx.strokeRect(p.x - 18, p.y - 8, 36, 22);
        if (offerto) {
          ctx.fillStyle = P.oro;
          ctx.strokeStyle = P.bianco;
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(p.x, p.y - 24, 11, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.fillStyle = P.crema;
          ctx.font = 'bold 12px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText(p.dono?.nome ?? 'Oggetto Misterioso', p.x, p.y - 42);
          ctx.fillStyle = P.oro;
          ctx.font = '11px Georgia, serif';
          ctx.fillText('[Premi E per raccogliere GRATIS]', p.x, p.y + 28);
        }
        ctx.restore();
      }
    }

    // Slot de La Fucina (Shop con oggetti randomici)
    const b = banchetto?.();
    if (b?.attivo) {
      // Incudine e insegna della Fucina
      const cxFucina = campo.x + campo.larghezza * 0.5;
      const cyFucina = campo.y + 52;
      ctx.save();
      ctx.fillStyle = 'rgba(243,193,75,0.92)';
      ctx.font = 'bold 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚒ LA FUCINA — BOTTEGA DEGLI OGGETTI ⚒', cxFucina, cyFucina);
      ctx.restore();

      for (const sl of b.slots()) {
        if (!sl.posizione || sl.comprato) continue;
        ctx.save();
        const g = ctx.createRadialGradient(sl.posizione.x, sl.posizione.y, 2, sl.posizione.x, sl.posizione.y, 34);
        g.addColorStop(0, 'rgba(255,156,66,0.45)');
        g.addColorStop(1, 'rgba(255,156,66,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(sl.posizione.x, sl.posizione.y, 34, 0, TAU); ctx.fill();

        ctx.fillStyle = '#2a1408';
        ctx.strokeStyle = sl.accessibile ? P.oro : P.rosso;
        ctx.lineWidth = 2;
        ctx.fillRect(sl.posizione.x - 16, sl.posizione.y - 16, 32, 32);
        ctx.strokeRect(sl.posizione.x - 16, sl.posizione.y - 16, 32, 32);

        ctx.fillStyle = sl.tipo === 'cuore' ? P.rosso : P.oro;
        ctx.beginPath(); ctx.arc(sl.posizione.x, sl.posizione.y, 8, 0, TAU); ctx.fill();

        ctx.fillStyle = sl.accessibile ? P.oro : '#ff7b6b';
        ctx.font = 'bold 12px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${sl.prezzo} monete`, sl.posizione.x, sl.posizione.y + 30);
        ctx.restore();
      }
    }
  }

  function disegnaProscenioEMinimappa() {
    // Quinte laterali drappeggiate
    for (const side of [-1, 1]) {
      ctx.save();
      if (side === 1) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      const cg = ctx.createLinearGradient(0, 0, 120, 0);
      cg.addColorStop(0, '#100403');
      cg.addColorStop(0.7, '#290806');
      cg.addColorStop(1, '#120403');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(118, 0);
      ctx.bezierCurveTo(92, 160, 82, 310, 104, 430);
      ctx.bezierCurveTo(74, 520, 68, 640, 88, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = P.oro;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Mantovana superiore del teatro
    ctx.fillStyle = '#1f0705';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 28);
    for (let x = W; x > 0; x -= 160) {
      ctx.quadraticCurveTo(x - 80, 48, x - 160, 28);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(243,193,75,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Minimappa stile Isaac (in alto a destra) con indicazione piano, numero stanze e icone (★ Oggetto, ⚒ Fucina, 💀 Boss)
    const n = notte?.();
    if (n?.pianta) {
      const lato = 20;
      const x0 = W - n.pianta.griglia.w * lato - 24;
      const y0 = 52;
      ctx.save();
      ctx.fillStyle = 'rgba(11,7,4,0.9)';
      ctx.strokeStyle = 'rgba(243,193,75,0.7)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(x0 - 8, y0 - 24, n.pianta.griglia.w * lato + 16, n.pianta.griglia.h * lato + 32);
      ctx.strokeRect(x0 - 8, y0 - 24, n.pianta.griglia.w * lato + 16, n.pianta.griglia.h * lato + 32);

      ctx.fillStyle = P.oro;
      ctx.font = 'bold 11px Georgia, serif';
      ctx.textAlign = 'center';
      const totStanze = n.pianta.stanze.filter((s) => s.tipo !== 'segreta').length;
      const wMappa = n.pianta.griglia.w * lato;
      ctx.fillText(
        `PIANO ${n.piano}/4 · ${totStanze} STANZE`,
        x0 + wMappa / 2,
        y0 - 8,
        wMappa + 8,
      );

      for (const s of n.pianta.stanze) {
        const corrente = n.stanza?.id === s.id;
        const stato = n.statoDi(s.id)?.stato;
        const visitata = corrente || (stato && stato !== 'non_visitata');
        if (!visitata) continue;
        for (const c of s.celle) {
          const px = x0 + c[0] * lato;
          const py = y0 + c[1] * lato;
          ctx.fillStyle = corrente
            ? P.oro
            : s.tipo === 'boss'
              ? '#5a1410'
              : s.tipo === 'tesoro'
                ? '#4c3810'
                : s.tipo === 'banchetto'
                  ? '#3e220e'
                  : s.tipo === 'segreta'
                    ? '#2d243b'
                    : stato === 'pulita'
                      ? '#8a5a24'
                      : '#24140a';
          ctx.fillRect(px + 1, py + 1, lato - 2, lato - 2);
          ctx.strokeStyle = corrente ? '#ffffff' : 'rgba(243,193,75,0.35)';
          ctx.lineWidth = corrente ? 1.5 : 0.8;
          ctx.strokeRect(px + 1, py + 1, lato - 2, lato - 2);

          // Icona stanza speciale
          if (s.tipo === 'tesoro' || s.tipo === 'banchetto' || s.tipo === 'boss' || s.tipo === 'ingresso' || s.tipo === 'segreta') {
            ctx.fillStyle = corrente ? '#120905' : P.crema;
            ctx.font = 'bold 11px Georgia, serif';
            ctx.textAlign = 'center';
            const icona = s.tipo === 'tesoro' ? '★' : s.tipo === 'banchetto' ? '⚒' : s.tipo === 'segreta' ? '?' : s.tipo === 'boss' ? (n.piano >= 4 ? '♛' : '💀') : '•';
            ctx.fillText(icona, px + lato / 2, py + lato - 5);
          }
        }
      }
      ctx.restore();
    }
  }

  function disegnaBarraVitaBoss(boss, piano) {
    if (!boss || boss.stato === 'morto') return;
    const bw = 420;
    const bh = 16;
    const bx = (W - bw) / 2;
    const by = 46;
    const ratio = Math.max(0, Math.min(1, boss.vita / Math.max(1, boss.vitaMax)));
    ctx.save();
    ctx.fillStyle = 'rgba(12,6,4,0.88)';
    ctx.strokeStyle = P.oro;
    ctx.lineWidth = 2;
    ctx.fillRect(bx - 6, by - 24, bw + 12, bh + 32);
    ctx.strokeRect(bx - 6, by - 24, bw + 12, bh + 32);

    ctx.fillStyle = P.oro;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    const titolo = boss.nomeBoss
      ? `PIANO ${piano}/4 — ${boss.nomeBoss.toUpperCase()}`
      : `BOSS DEL PIANO ${piano}`;
    ctx.fillText(titolo, W / 2, by - 8, bw);

    ctx.fillStyle = '#260b08';
    ctx.fillRect(bx, by, bw, bh);
    const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
    grad.addColorStop(0, '#9e1912');
    grad.addColorStop(0.5, '#d93822');
    grad.addColorStop(1, '#f3c14b');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * ratio, bh);
    ctx.strokeStyle = 'rgba(243,193,75,0.75)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();
  }

  return {
    /** Alpha della sagoma di Ferruccio nell'ultimo frame disegnato (squadra feel, lettura di QA). */
    ultimoAlphaSagoma: () => ultimoAlphaSagoma,
    disegna() {
      const tAnim = contaTick() / 60;
      if (scossa > 0.1) scossa *= 0.82;
      else scossa = 0;
      // --- squadra feel: inizio --- scossa contestuale per frame (0 a riposo; moto ridotto → px 0 dai parametri)
      const offScossa = feel ? feel.offsetScossa() : null;
      const sx = offScossa ? offScossa.x : (scossa > 0 ? Math.sin(contaTick() * 2.7) * scossa : 0);
      const sy = offScossa ? offScossa.y : (scossa > 0 ? Math.cos(contaTick() * 3.3) * scossa : 0);
      // --- squadra feel: fine ---

      ctx.fillStyle = '#070402';
      ctx.fillRect(0, 0, W, H);

      const fondale = ottieniFondale();
      if (fondale) ctx.drawImage(fondale, 0, 0, W, 320);

      ctx.save();
      ctx.translate(sx, sy);
      if (camera) camera.applica(ctx);

      disegnaCampoEMura(tAnim);
      const filiHub = disegnaHubScena(tAnim);
      disegnaOggettiEInteragibili();
      disegnaSquadraOggetti(); // --- squadra oggetti (storie P04/P09) ---
      disegnaOndeUrto();

      // Raccogliamo i punti dei nemici vivi per collegarvi i fili delle Mani di Marionetta
      const listaBersagli = bersagli() || [];
      const filiNemici = [];
      let bossPresente = null;
      for (const b of listaBersagli) {
        if (!b) continue;
        if (b.boss && b.stato !== 'morto') bossPresente = b;
        if (b.stato !== 'morto') filiNemici.push([b.x, b.y - b.r]);
        disegnaBersaglioMarionetta(b, tAnim);
      }

      // Proiettili
      for (const pr of proiettili()) {
        if (!pr?.vivo) continue;
        ctx.fillStyle = pr.scintilla ? P.oro : pr.riflesso ? P.azzurro : P.rosso;
        ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r + 2, 0, TAU); ctx.fill();
      }

      // --- squadra feel: inizio --- i-frames: sagoma semitrasparente (resa.lampeggio.alpha) a semionde
      const alphaSagoma = feel ? feel.alphaSagoma(ferruccio, contaTick()) : 1;
      ultimoAlphaSagoma = alphaSagoma;
      ctx.save();
      ctx.globalAlpha = alphaSagoma;
      disegnaFerruccioAttore(tAnim);
      ctx.restore();
      // --- squadra feel: fine ---

      // Al 4° Piano (Boss Finale), nella stanza Boss le Mani di Marionetta scendono nel palco e diventano Donna Luciana!
      const nCorrente = notte?.();
      const pianoAttuale = nCorrente?.piano ?? 1;
      const inBossFinale = Boolean(
        (nCorrente?.stanza?.tipo === 'boss' && pianoAttuale >= 4)
        || bossPresente?.bossId === 'donna-luciana',
      );
      if (inBossFinale) {
        const bx = bossPresente ? bossPresente.x : campo.x + campo.larghezza * 0.5;
        const by = bossPresente ? bossPresente.y - 10 : campo.y + campo.altezza * 0.42;
        disegnaDonnaLucianaBoss(bx, by, tAnim, filiNemici);
      }
      ctx.restore();

      // Sopra a tutto (nelle stanze normali, Fucina, Stanza Oggetto e nei Boss dei Piani 1-3):
      // le Grandi Mani di Marionetta incombono in alto sul proscenio tirando i fili d'oro
      // SOLO verso i nemici e gli NPC (mai verso Ferruccio!).
      if (!inBossFinale) {
        const tuttiFili = filiNemici.length ? filiNemici : filiHub;
        const filiSx = tuttiFili.filter((p) => p[0] <= W * 0.5);
        const filiDx = tuttiFili.filter((p) => p[0] > W * 0.5);
        disegnaManoMarionettista(410, 44, 1, 0.85, tAnim, filiSx.slice(0, 4));
        disegnaManoMarionettista(870, 44, -1, 0.85, tAnim, filiDx.slice(0, 4));
      }

      disegnaProscenioEMinimappa();
      if (bossPresente) disegnaBarraVitaBoss(bossPresente, pianoAttuale);
    },
  };
}
