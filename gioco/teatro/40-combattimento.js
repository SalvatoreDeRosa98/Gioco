/*
 * teatro/40-combattimento.js — Attacchi, proiettili, meccaniche D, feel (scossa, hit-stop, spinte), danni, nemici, boss, pulizia stanza e passo logico (IA, collisioni).
 * Script classico (niente moduli ES): le dichiarazioni di primo livello stanno nello scope globale
 * condiviso con gli altri file di teatro/. Ordine di caricamento e regole: teatro/LEGGIMI.md.
 */

function eseguiAttacco4Direzioni(dx, dy) {
  // --- B: inizio ---
  if (player.cooldown > 0 || statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo) return;
  // --- B: fine ---
  player.dirX = dx;
  player.dirY = dy;
  if (dx !== 0) player.flipX = dx < 0;

  if (statoRun.haSpada) {
    player.cooldown = Math.max(9, Math.round(statoRun.cooldownMax * 0.75));
    player.swordAnimTick = 0;
    player.swordAngle = Math.atan2(dy, dx);
    player.swordHitIds = new Set();
    AudioSys.playFendente();
    if (statoRun.triplo || statoRun.tipoProiettile !== 'base' || statoRun.quadDir || statoRun.piercing) {
      sparaProiettiliDirezione(dx, dy, 0.65);
    }
  } else {
    player.cooldown = statoRun.cooldownMax;
    player.shootAnimTimer = 7;
    AudioSys.playSparo();
    sparaProiettiliDirezione(dx, dy, 1.0);
  }
}

function sparaProiettiliDirezione(dx, dy, dmgScale = 1.0) {
  // --- D: inizio --- diagonale, quattroColpi, velocità, ricerca, rimbalzi, orbita, esplosione, prossimità;
  // tetto OGGETTI_D.clamp.proiettiliGiocatore proiettili vivi (performance + leggibilità, §5)
  const D = statoRun.statD || {};
  const baseAng = Math.atan2(dy, dx);
  statoRun.ultimoTiroD = { tick, ang: baseAng };
  let direzioniBase = statoRun.quadDir ? [0, Math.PI / 2, Math.PI, -Math.PI / 2] : [baseAng];
  if (D.diagonale) direzioniBase = direzioniBase.flatMap((a) => [a - OGGETTI_D.diagonaleRad, a + OGGETTI_D.diagonaleRad]);
  const vel = 4.2 * (D.velocitaColpo || 1);
  const OP = OGGETTI_D.orbitaProiettili;

  for (const dirAng of direzioniBase) {
    const angoli = D.quattroColpi ? OGGETTI_D.quattroColpi : statoRun.triplo ? [-0.20, 0, 0.20] : [0];
    const offsets = statoRun.doppia && !statoRun.triplo && !D.quattroColpi ? [-4, 4] : [0];
    for (const da of angoli) {
      for (const off of offsets) {
        if (statoRun.proiettili.length >= OGGETTI_D.clamp.proiettiliGiocatore) return;
        const a = dirAng + da;
        const perpX = -Math.sin(a) * off;
        const perpY = Math.cos(a) * off;
        statoRun.proiettili.push({
          x: player.x + Math.cos(a) * 10 + perpX,
          y: player.y - 6 + Math.sin(a) * 10 + perpY,
          vx: Math.cos(a) * vel,
          vy: Math.sin(a) * vel,
          dist: 0,
          maxDist: statoRun.range * (D.orbitaProiettili ? OP.gittataMult : 1),
          dmg: statoRun.dmg * dmgScale,
          r: 4.5 * statoRun.projScale,
          tipo: statoRun.tipoProiettile,
          piercing: statoRun.piercing,
          overflowPierce: statoRun.overflowPierce,
          hitIds: new Set(),
          oming: D.oming || 0,
          rimbalzi: D.rimbalzi || 0,
          orbitaD: D.orbitaProiettili ? { ang: a, r: 10 } : null,
          esplosiva: D.esplosiva || 0,
          prossimita: Boolean(D.prossimita),
          bloccaProiettili: Boolean(D.bloccaProiettili),
        });
      }
    }
  }
  // --- D: fine ---
}

// --- D: inizio --- funzioni delle meccaniche D (oggetti-teatro.md §2)
/** Nemico vivo (a terra) più vicino a (x, y) entro maxPx, oppure null. */
function nemicoVicinoD(st, x, y, maxPx = Infinity) {
  let best = null, bd = maxPx;
  for (const n of (st && st.nemici) || []) {
    if (n.hp <= 0 || (n.airZ || 0) > 16) continue;
    const d = Math.hypot(n.x - x, n.y - 6 - y);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

/** Prima del passo: orbita attorno al giocatore oppure curva verso il nemico più vicino. */
function aggiornaProiettileD(p, st) {
  if (p.orbitaD) {
    const O = OGGETTI_D.orbitaProiettili;
    p.orbitaD.ang += O.radPerTick;
    p.orbitaD.r = Math.min(O.raggioPx, p.orbitaD.r + 2);
    p.vx = player.x + Math.cos(p.orbitaD.ang) * p.orbitaD.r - p.x;
    p.vy = player.y - 6 + Math.sin(p.orbitaD.ang) * p.orbitaD.r - p.y;
    return;
  }
  if (p.oming > 0) {
    const n = nemicoVicinoD(st, p.x, p.y, OGGETTI_D.oming.raggioPx);
    if (!n) return;
    const v = Math.hypot(p.vx, p.vy);
    const a = Math.atan2(p.vy, p.vx);
    let diff = Math.atan2(n.y - 6 - p.y, n.x - p.x) - a;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const na = a + Math.max(-p.oming, Math.min(p.oming, diff));
    p.vx = Math.cos(na) * v;
    p.vy = Math.sin(na) * v;
  }
}

/** Rimbalzo sul muro: inverte la componente normale. Il timer di gittata (p.dist) NON riparte. */
function rimbalzaD(p) {
  if (p.rimbalzi <= 0) return false;
  let ok = false;
  if (p.x < ARENA.x1 - 8 || p.x > ARENA.x2 + 8) { p.vx = -p.vx; p.x = Math.max(ARENA.x1 - 8, Math.min(ARENA.x2 + 8, p.x)); ok = true; }
  if (p.y < ARENA.y1 - 8 || p.y > ARENA.y2 + 8) { p.vy = -p.vy; p.y = Math.max(ARENA.y1 - 8, Math.min(ARENA.y2 + 8, p.y)); ok = true; }
  if (ok) { p.rimbalzi--; p.hitIds = new Set(); }
  return ok;
}

/** Moltiplicatore della prossimità: ×2.0 al lancio, cala fino a ×0.3 a fine gittata. */
function moltProssimitaD(p) {
  if (!p.prossimita) return 1;
  const P = OGGETTI_D.prossimita;
  const t = Math.max(0, Math.min(1, p.dist / (p.maxDist || 1)));
  return P.multVicino + (P.multLontano - P.multVicino) * t;
}

/** Esplosione all'impatto: tutti i nemici nel raggio a danno pieno; NON ferisce il giocatore (decisione §6.1). */
function esplodiD(p, st) {
  if (!p.esplosiva || p.esploso) return;
  p.esploso = true;
  statoRun.ondeEsplosione.push({ x: p.x, y: p.y, r: 6, maxR: p.esplosiva, color: '#f97316' });
  scuoti(FEEL.scossa.bomba);
  AudioSys.playEsplosione();
  for (const n of (st && st.nemici) || []) {
    if (n.hp <= 0 || p.hitIds.has(n.id)) continue;
    if (Math.hypot(n.x - p.x, n.y - 6 - p.y) <= p.esplosiva + n.r) {
      const a = Math.atan2(n.y - p.y, n.x - p.x);
      danneggiaNemico(n, p.dmg, Math.cos(a), Math.sin(a));
    }
  }
}

/** Il colpo annulla i proiettili nemici che tocca (Ventaglio di Carta). true se il colpo va rimosso. */
function bloccaProiettiliNemiciD(p) {
  if (!p.bloccaProiettili) return false;
  for (let j = statoRun.proiettiliNemici.length - 1; j >= 0; j--) {
    const pr = statoRun.proiettiliNemici[j];
    if (Math.hypot(pr.x - p.x, pr.y - p.y) < p.r + 4) {
      statoRun.effettiSplash.push({ x: pr.x, y: pr.y, tick: 0 });
      statoRun.proiettiliNemici.splice(j, 1);
      if (!p.piercing) return true;
    }
  }
  return false;
}

/** Famigli (tiratore/contatto) e gomitoli orbitanti: un tick di logica nella stanza `st`. */
function aggiornaFamigliOrbitaliD(st) {
  const F = OGGETTI_D.famiglio;
  let capo = { x: player.x, y: player.y };
  for (const f of statoRun.famigliD || []) {
    if (f.cd > 0) f.cd--;
    if (f.tipo === 'contatto') {
      const n = nemicoVicinoD(st, f.x, f.y);
      const tx = n ? n.x : player.x - 22, ty = n ? n.y : player.y + 8;
      const d = Math.hypot(tx - f.x, ty - f.y);
      if (d > 2) { const k = Math.min(d, F.velocitaContatto) / d; f.x += (tx - f.x) * k; f.y += (ty - f.y) * k; }
      if (n && f.cd <= 0 && Math.hypot(n.x - f.x, n.y - f.y) <= n.r + 6) {
        danneggiaNemico(n, f.dmg, 0, 0);
        f.cd = F.contattoOgniTick;
      }
      continue;
    }
    const d = Math.hypot(capo.x - f.x, capo.y - f.y);
    if (d > F.distanzaPx) { const k = ((d - F.distanzaPx) / d) * 0.25; f.x += (capo.x - f.x) * k; f.y += (capo.y - f.y) * k; }
    capo = f;
    if (f.cd > 0) continue;
    let ang = null;
    if (f.auto) {
      const n = nemicoVicinoD(st, f.x, f.y);
      if (n) ang = Math.atan2(n.y - 6 - (f.y - 6), n.x - f.x);
    } else if (statoRun.ultimoTiroD && tick - statoRun.ultimoTiroD.tick <= F.finestraTiroTick) {
      ang = statoRun.ultimoTiroD.ang;
    }
    if (ang === null || statoRun.proiettili.length >= OGGETTI_D.clamp.proiettiliGiocatore) continue;
    statoRun.proiettili.push({
      x: f.x, y: f.y - 6, vx: Math.cos(ang) * F.velocitaColpo, vy: Math.sin(ang) * F.velocitaColpo,
      dist: 0, maxDist: F.gittataPx, dmg: f.dmg, r: F.raggioColpo, tipo: f.oming ? 'viola' : 'base',
      piercing: false, overflowPierce: false, hitIds: new Set(), oming: f.oming ? F.omingForza : 0, rimbalzi: 0, famD: true,
    });
    f.cd = Math.max(F.cadenzaMinTick, Math.round(60 / f.cadenza));
  }
  const O = OGGETTI_D.orbitali;
  const nO = (statoRun.statD && statoRun.statD.orbitali) || 0;
  statoRun.orbitaliPosD = [];
  for (let i = 0; i < nO; i++) {
    const a = tick * O.radPerTick + (i * 2 * Math.PI) / nO;
    const x = player.x + Math.cos(a) * O.raggioPx, y = player.y - 6 + Math.sin(a) * O.raggioPx;
    statoRun.orbitaliPosD.push({ x, y });
    for (let j = statoRun.proiettiliNemici.length - 1; j >= 0; j--) {
      const pr = statoRun.proiettiliNemici[j];
      if (Math.hypot(pr.x - x, pr.y - y) <= O.raggioBlocco) {
        statoRun.effettiSplash.push({ x: pr.x, y: pr.y, tick: 0 });
        statoRun.proiettiliNemici.splice(j, 1);
      }
    }
    if (tick % O.ogniTick === 0) {
      for (const n of st.nemici) {
        if (n.hp > 0 && (n.airZ || 0) <= 16 && Math.hypot(n.x - x, n.y - 6 - y) <= n.r + 6) danneggiaNemico(n, O.danno, 0, 0);
      }
    }
  }
}

/** La maledizione `k` ('mappa' | 'buio' | 'cieco') è attiva in questo piano? Si toglie da sola al piano dopo. */
function maledizioneD(k) {
  return Boolean(statoRun.maledizioniD && statoRun.maledizioniD[k] === statoRun.piano && statoRun.fase === 'in_gioco');
}

function spawnaMonetaATerra(st, x, y, valore = 1) {
  if (!st) return;
  // Con la Cambiale del Sottosuolo (patto_contratto), raddoppia il valore delle monete
  if (statoRun.dropDoppi) valore *= 2;
  // Calibrazione: monete scarse al Piano 1 (~30% di drop per raccogliere 5-8 monete in tutto il piano)
  // --- T3: inizio ---
  if (statoRun.piano === 1 && rng() > (st.tipo === 'segreta' ? ECONOMIA_T3.piano1.probMonetaSegreta : ECONOMIA_T3.piano1.probMonetaAltre)) return;
  // --- T3: fine ---
  st.oggettiATerra.push({
    tipo: 'moneta',
    valore,
    sprite: valore >= 3 ? 'moneta3' : 'moneta1',
    x: Math.max(ARENA.x1 + 20, Math.min(ARENA.x2 - 20, x + (rng() - 0.5) * 22)),
    y: Math.max(ARENA.y1 + 20, Math.min(ARENA.y2 - 20, y + (rng() - 0.5) * 22)),
  });
}

// ===========================================================================
// FEEL (T1): scossa contestuale, hit-stop, spinte inverse alla massa, macchie a terra
// ===========================================================================
/** Scossa della camera: consumata dalla resa a tempo reale, così dura uguale a 60 e a 120 Hz. */
const scossaCam = { px: 0, restoMs: 0, totMs: 0, segno: 1 };

/**
 * Chiede una scossa [px, ms] (una voce di FEEL.scossa). Non si somma: vince l'ampiezza maggiore
 * e la durata residua maggiore.
 * @param {[number, number]} voce
 */

function scuoti(voce) {
  const [px, ms] = voce;
  if (!(px > 0) || !(ms > 0)) return;
  scossaCam.px = Math.max(scossaCam.px, px);
  scossaCam.restoMs = Math.max(scossaCam.restoMs, ms);
  scossaCam.totMs = Math.max(scossaCam.totMs, scossaCam.restoMs);
}

/**
 * Spostamento della camera per il frame (segno alterno, ampiezza che decade a 0). Torna {0,0} a fine corsa.
 * @param {number} dtMs tempo reale trascorso dal frame precedente
 */

function offsetScossa(dtMs) {
  if (scossaCam.restoMs <= 0) {
    scossaCam.px = 0; scossaCam.totMs = 0;
    return { x: 0, y: 0 };
  }
  const a = scossaCam.px * (scossaCam.restoMs / scossaCam.totMs);
  scossaCam.segno = -scossaCam.segno;
  scossaCam.restoMs -= dtMs;
  return { x: Math.round(scossaCam.segno * a), y: Math.round(-scossaCam.segno * a * 0.5) };
}

/** Tick di logica ancora da saltare per l'hit-stop (la resa continua a disegnare). */
let ticksCongelati = 0;

/** Hit-stop: ferma la logica per `ms`; richieste sovrapposte non si sommano (vince la più lunga). */
function congela(ms) {
  ticksCongelati = Math.max(ticksCongelati, ticksDaMs(ms));
}

/** Massa di un nemico per la spinta (FEEL.knockback). */
function massaNemico(nem) {
  if (nem.boss) return FEEL.knockback.massaBoss;
  const m = FEEL.knockback.masse[nem.patternMob || nem.tipo];
  return m === undefined ? FEEL.knockback.massaDefault : m;
}

/**
 * Imprime una spinta che percorre in tutto `distPx` lungo (dirX, dirY), smorzata da FEEL.knockback.attrito.
 * @param {{kbx?: number, kby?: number}} corpo
 */

function spingi(corpo, dirX, dirY, distPx) {
  const l = Math.hypot(dirX, dirY);
  if (!(l > 0) || !(distPx > 0) || !Number.isFinite(distPx)) return;
  const v0 = distPx * (1 - FEEL.knockback.attrito);
  corpo.kbx = (corpo.kbx || 0) + (dirX / l) * v0;
  corpo.kby = (corpo.kby || 0) + (dirY / l) * v0;
}

/** Applica per un tick la spinta residua di `corpo`, tenendolo nell'arena (con `margine`). */
function applicaSpinta(corpo, margine) {
  if (!corpo.kbx && !corpo.kby) return;
  corpo.x = Math.max(ARENA.x1 + margine, Math.min(ARENA.x2 - margine, corpo.x + corpo.kbx));
  corpo.y = Math.max(ARENA.y1 + margine, Math.min(ARENA.y2 - margine, corpo.y + corpo.kby));
  corpo.kbx *= FEEL.knockback.attrito;
  corpo.kby *= FEEL.knockback.attrito;
  if (Math.hypot(corpo.kbx, corpo.kby) < 0.05) { corpo.kbx = 0; corpo.kby = 0; }
}

/** Generatore separato per le macchie: non tocca rng() del gioco, così le regole restano identiche. */
function rngMacchia(seme) {
  let s = seme | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Macchie della stanza corrente: si azzerano a ogni ingresso in una stanza. */
let macchieStanza = [];

/** Lascia a terra la chiazza di china (o le schegge di legno) di un nemico morto. Deterministica. */
function lasciaMacchia(nem) {
  const M = FEEL.macchie;
  const legno = M.tipiLegno.includes(nem.patternMob || nem.tipo);
  let seme = Math.round(nem.x) * 73856093 ^ Math.round(nem.y) * 19349663;
  for (const ch of String(nem.id || '')) seme = Math.imul(seme ^ ch.charCodeAt(0), 16777619);
  const r = rngMacchia(seme);
  const n = legno ? M.schegge : M.goccieChina;
  const gocce = [];
  for (let i = 0; i < n; i++) {
    const ang = r() * TAU;
    const d = Math.sqrt(r()) * M.raggioPx;
    gocce.push({ dx: Math.cos(ang) * d, dy: Math.sin(ang) * d * 0.55, r: M.dimMinPx + r() * (M.dimMaxPx - M.dimMinPx), ang: r() * TAU });
  }
  macchieStanza.push({ x: nem.x, y: nem.y + 4, legno, gocce });
  if (macchieStanza.length > M.maxPerStanza) macchieStanza.splice(0, macchieStanza.length - M.maxPerStanza);
}

// Esplosione per i Bozzi Esplosivi ('bomba_ferma'):
// danneggia i nemici vicini, spara 6 proiettili radiali, può colpire il giocatore e apre il Muro Segreto!
function innescaEsplosioneBomba(st, bx, by) {
  if (!st) return;
  scuoti(FEEL.scossa.bomba);
  congela(FEEL.hitstop.uccisioneMs);
  AudioSys.playEsplosione();
  statoRun.ondeEsplosione.push({ x: bx, y: by, r: 6, maxR: 48, color: '#fb923c' });
  // Macchia da bruciatura e schegge permanenti sul palco
  if (!st.macchie) st.macchie = [];
  for (let k = 0; k < 8; k++) {
    st.macchie.push({
      x: bx + (rng() - 0.5) * 36,
      y: by + (rng() - 0.5) * 26,
      r: 3.5 + rng() * 4.5,
      col: rng() < 0.7 ? '#050302' : '#450a0a',
      tipo: 'bruciatura',
    });
  }
  for (let k = 0; k < 6; k++) {
    const a = (TAU * k) / 6;
    statoRun.proiettiliNemici.push({
      x: bx, y: by - 6,
      vx: Math.cos(a) * 2.15, vy: Math.sin(a) * 2.15,
      dist: 0,
    });
  }
  if (st.muroSegreto && !st.muroSegreto.aperto) {
    const posMuro = { N: [320, ARENA.y1], S: [320, ARENA.y2], W: [ARENA.x1, 188], E: [ARENA.x2, 188] }[st.muroSegreto.lato];
    if (posMuro && Math.hypot(bx - posMuro[0], by - posMuro[1]) < STANZE_C.segreta.raggioEsplosione) { // C
      apriMuroSegreto(st);
    }
  }
  for (const altro of st.nemici) {
    if (altro.hp > 0 && Math.hypot(altro.x - bx, altro.y - by) < 48) {
      altro.hp -= 12;
      altro.flash = 6;
    }
  }
  if (Math.hypot(player.x - bx, player.y - by) < 38 && player.invuln <= 0) {
    subisciColpoGiocatore(2, 'un Bozzo Esplosivo', bx, by);
  }
}

function danneggiaNemico(nem, dmg, knockX, knockY) {
  // Se il Boss Re Gatto è in volo alto (airZ > 25), non può essere colpito finché non atterra!
  if (nem.boss && (nem.airZ || 0) > 25) return;

  // Maschera di Pulcinella: quando è chiusa è corazzata e riduce l'85% del danno!
  if ((nem.patternMob || nem.tipo) === 'maschera' && !nem.maskOpen) {
    nem.flash = 3;
    nem.hp -= dmg * 0.12;
    return;
  }

  // --- A: inizio --- Custode di Marmo: aperto ×1,5, chiuso ×0,6 (BOSS_A.custode)
  if (nem.bossId === 'colosso-statua') dmg *= nem.apertoCM ? BOSS_A.custode.moltAperto : BOSS_A.custode.moltChiuso;
  // --- A: fine ---
  nem.hp -= dmg;
  nem.flash = 6;
  if (statoRun.burn) nem.burnTicks = 120;
  // (T1) Spinta inversamente proporzionale alla massa (FEEL.knockback): la vespa vola via, la guardia
  // arretra di 2 px, statua e boss restano fermi. Solo i colpi con direzione (non bruciature né Forbici)
  // danno hit-stop e scossa.
  const forzaColpo = Math.hypot(knockX, knockY);
  if (forzaColpo > 0) {
    spingi(nem, knockX, knockY, (FEEL.knockback.impulsoPx * forzaColpo) / massaNemico(nem));
    congela(nem.hp <= 0 ? FEEL.hitstop.uccisioneMs : FEEL.hitstop.colpoMs);
    scuoti(FEEL.scossa.colpo);
  }

  if (statoRun.chain && statoRun.stanzaCorrente) {
    for (const altro of statoRun.stanzaCorrente.nemici) {
      if (altro !== nem && altro.hp > 0 && Math.hypot(altro.x - nem.x, altro.y - nem.y) < 72) {
        altro.hp -= dmg * 0.45;
        altro.flash = 4;
        statoRun.scintilleFulmine.push({ x1: nem.x, y1: nem.y - 8, x2: altro.x, y2: altro.y - 8, tick: 6 });
      }
    }
  }

  if (nem.hp <= 0) {
    const st = statoRun.stanzaCorrente;
    if (!nem.macchiaLasciata) { nem.macchiaLasciata = true; lasciaMacchia(nem); }
    // Se muore un Bozzo Esplosivo ('bomba_ferma'), esplode alla morte!
    if ((nem.patternMob || nem.tipo) === 'bomba_ferma' && !nem.exploded) {
      nem.exploded = true;
      innescaEsplosioneBomba(st, nem.x, nem.y);
    }
    // Drop garantiti per Campioni Colorati (Proposta 6), Mob della Stanza Segreta e Boss!
    if (nem.champion === 'cremisi' && st) {
      st.oggettiATerra.push({ tipo: 'cura', valore: 1, sprite: 'mezzaMaschera', x: nem.x, y: nem.y });
    } else if (nem.champion === 'elettrico' && st) {
      if (statoRun.oggettoAttivo) {
        statoRun.caricaAttivo = Math.min(statoRun.oggettoAttivo.maxCarica, statoRun.caricaAttivo + 1);
      }
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        statoRun.proiettiliNemici.push({ x: nem.x, y: nem.y - 6, vx: Math.cos(a) * 2.0, vy: Math.sin(a) * 2.0, dist: 0 });
      }
    }
    if ((nem.mobSoldi || nem.champion === 'dorato') && st) {
      // --- T3: inizio ---
      spawnaMonetaATerra(st, nem.x, nem.y, rng() < ECONOMIA_T3.dorato.prob3 ? 3 : 1);
      if (rng() < ECONOMIA_T3.dorato.probExtra) spawnaMonetaATerra(st, nem.x, nem.y, 1);
    } else if (nem.boss && st) {
      spawnaMonetaATerra(st, nem.x - 16, nem.y, 1);
      spawnaMonetaATerra(st, nem.x + 16, nem.y, rng() < ECONOMIA_T3.boss.prob3 ? 3 : 1);
      // --- T3: fine ---
    }
    statoRun.effettiSplash.push({ x: nem.x, y: nem.y - 8, tick: 0 });
  }
  verificaStanzaPulita();
}

function verificaStanzaPulita() {
  const st = statoRun.stanzaCorrente;
  if (!st || st.pulita) return;
  if (st.nemici.every((n) => n.hp <= 0)) {
    st.pulita = true;
    AudioSys.playCampana();
    // Ricarica di +1 tacca l'Oggetto Attivo [Q] a ogni stanza ripulita (Proposta 5)
    if (statoRun.oggettoAttivo) {
      statoRun.caricaAttivo = Math.min(statoRun.oggettoAttivo.maxCarica, statoRun.caricaAttivo + 1);
    }

    if (st.tipo === 'boss') {
      st.uscitaAperta = true;
      // --- T4: inizio ---
      t4Gancio('bossSconfitto', st);
      // --- T4: fine ---
      // Proposta 2: Apertura della Porta del Patto d'Ombra (100% se non hai subito danni nel boss, 60% altrimenti!)
      if (!statoRun.dannoSubitoNelBoss || rng() < 0.60) {
        st.portaPattoAperta = true;
      }
      const pianoNelCiclo = ((statoRun.piano - 1) % 4) + 1;
      if (pianoNelCiclo === 4) {
        mostraBanner(`★ DONNA LUCIANA SCONFITTA! Entra nella Botola per il LOOP INFINITO (Piano ${statoRun.piano + 1}) o nel Patto 😈!`, 320);
      } else {
        mostraBanner(`Boss sconfitto! ${st.portaPattoAperta ? 'È apparsa la PORTA DEL PATTO D\'OMBRA (😈) a destra + ' : ''}Botola aperta!`, 240);
      }
      return;
    }

    if (st.ricompensaOggetto && !st.oggettoPiedistallo) {
      st.oggettoPiedistallo = {
        ...st.ricompensaOggetto,
        x: 320,
        y: 192,
        preso: false,
      };
    }

    // --- C: dalla notte 5 un grano in più a stanza pulita (NOTTI_C.probMonetaExtra) ---
    if (st.tipo !== 'segreta' && rng() < effettiNotteC().probMonetaExtra) spawnaMonetaATerra(st, 300, 172, 1);
    const rPick = rng();
    // --- T3: inizio ---
    if (st.tipo === 'segreta') {
      spawnaMonetaATerra(st, 320, 165, ECONOMIA_T3.pulizia.valoreSegreta);
    } else if (rPick < ECONOMIA_T3.pulizia.probMoneta) {
      spawnaMonetaATerra(st, 320, 165, 1);
    } else if (rPick < ECONOMIA_T3.pulizia.probCura && statoRun.hpHalf < statoRun.maxHpHalf) {
      // --- T3: fine ---
      st.oggettiATerra.push({ tipo: 'cura', valore: 1, sprite: 'mezzaMaschera', x: 320, y: 165 });
    }

    if (st.oggettoPiedistallo) {
      const tag = st.oggettoPiedistallo.forteGratis ? '★ OGGETTO FORTE GRATIS (1 su 10)!' : '🎁 OGGETTO GRATIS (1 su 3)!';
      mostraBanner(`Stanza pulita! È apparso ${tag} → ${nomeD(st.oggettoPiedistallo)} [Click/E]`, 220); // D
    } else { // --- C: nessun avviso della crepa a stanza pulita ---
      mostraBanner(st.tipo === 'segreta' ? 'Stanza Segreta ripulita! Raccogli tutte le monete a terra!' : 'Stanza ripulita! (+1⚡ Carica Attivo [Q])', 130);
    }
  }
}

function interagisciStanza() {
  // --- B: inizio ---
  if (statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo) return;
  // --- B: fine ---
  const st = statoRun.stanzaCorrente;
  if (!st) return;
  // --- B: inizio ---
  if (st.tipo === 'sviluppatore') { apriPannelloSviluppatoreB(st); return; }
  // --- B: fine ---

  // --- C: E non apre più la Stanza Segreta ---

  if (st.pulita && st.oggettoPiedistallo && !st.oggettoPiedistallo.preso) {
    const o = st.oggettoPiedistallo;
    if (Math.hypot(player.x - o.x, player.y - o.y) < 52) {
      acquisisciOggettoConLimite5Slot({ ...o }, 'piedistallo', o);
      return;
    }
  }

  if (st.tipo === 'patto') {
    for (const sl of st.slotPatto) {
      if (sl.comprato) continue;
      if (Math.hypot(player.x - sl.x, player.y - sl.y) < 44) {
        acquisisciOggettoConLimite5Slot({ ...sl.item }, 'patto', sl);
        return;
      }
    }
    if (Math.hypot(player.x - 320, player.y - 252) < 46) {
      const bossRoom = statoRun.mappa?.stanze.find((x) => x.tipo === 'boss');
      if (bossRoom) entraInStanza(bossRoom, null);
    }
    return;
  }

  if (st.tipo === 'fucina') {
    for (const sl of st.slotFucina) {
      if (sl.comprato) continue;
      if (Math.hypot(player.x - sl.x, player.y - sl.y) < 42) {
        if (statoRun.monete < sl.prezzo) {
          mostraBanner(`Grani insufficienti! Servono ${sl.prezzo}🪙 (hai ${statoRun.monete}🪙 — cerca la Stanza Segreta ? per fare soldi!).`, 160);
          return;
        }
        if (sl.tipo === 'cura') {
          if (statoRun.hpHalf >= statoRun.maxHpHalf) {
            mostraBanner('Hai già tutte le Maschere piene!', 100);
            return;
          }
          statoRun.monete -= sl.prezzo;
          sl.comprato = true;
          statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + sl.curaHalf);
          mostraBanner(`Acquistato ne La Fucina: +${sl.curaHalf === 1 ? '½' : '1'} Maschera rigenerata!`, 130);
        } else {
          acquisisciOggettoConLimite5Slot({ ...sl.item }, 'fucina', sl);
        }
        return;
      }
    }
  } else if (st.tipo === 'boss') {
    if (st.portaPattoAperta && Math.hypot(player.x - 430, player.y - 190) < 42) {
      const stanzaPatto = statoRun.mappa?.stanze.find((x) => x.tipo === 'patto');
      if (stanzaPatto) entraInStanza(stanzaPatto, null);
      return;
    }
    if (st.uscitaAperta) {
      avviaPiano(statoRun.piano + 1, true);
    }
  }
}

/**
 * Il giocatore subisce un colpo: i-frames FEEL.iframes.durataMs e rimbalzo all'indietro, lontano da (daX, daY).
 * @param {number} mezzeMaschereDanno @param {string} fonte @param {number} [daX] @param {number} [daY]
 */

function subisciColpoGiocatore(mezzeMaschereDanno, fonte, daX, daY) {
  if (player.invuln > 0) return;
  if (statoRun.graziaIngressoC > 0) return; // --- C: grazia d'ingresso: nessun danno ---
  if (statoRun.scudoRosaC && statoRun.fase === 'in_gioco') {
    // --- C: Benedizione di Rosa: il primo colpo della stanza non fa danno (solo i-frames e rimbalzo) ---
    statoRun.scudoRosaC = false;
    if (Number.isFinite(daX) && Number.isFinite(daY)) spingi(player, player.x - daX, player.y - daY, FEEL.iframes.rimbalzoPx);
    player.invuln = ticksDaMs(FEEL.iframes.durataMs);
    statoRun.effettiSplash.push({ x: player.x, y: player.y - 10, tick: 0 });
    return;
  }
  // --- D: inizio --- Velo della Madonna (scudoStanza) e Ostia (dannoMaxHalf)
  if (statoRun.fase === 'in_gioco' && statoRun.scudoStanzaD > 0) {
    statoRun.scudoStanzaD--;
    if (Number.isFinite(daX) && Number.isFinite(daY)) spingi(player, player.x - daX, player.y - daY, FEEL.iframes.rimbalzoPx);
    player.invuln = ticksDaMs(FEEL.iframes.durataMs);
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y - 6, r: 6, maxR: 30, color: '#93c5fd' });
    return;
  }
  if (statoRun.statD && statoRun.statD.dannoMaxHalf) mezzeMaschereDanno = Math.min(1, mezzeMaschereDanno);
  // --- D: fine ---
  // (bug autore «quando perdo si freeza») fuori dalla run (sequenza di morte, hub, menu) nessun colpo:
  // un secondo colpo letale nello stesso tick non deve riavviare la run sopra la sequenza di morte.
  if (statoRun.fase !== 'in_gioco') return;
  if (Number.isFinite(daX) && Number.isFinite(daY)) {
    spingi(player, player.x - daX, player.y - daY, FEEL.iframes.rimbalzoPx);
  }
  AudioSys.playDannoGiocatore();
  if (statoRun.stanzaCorrente?.tipo === 'boss') statoRun.dannoSubitoNelBoss = true;
  statoRun.hpHalf = Math.max(0, statoRun.hpHalf - mezzeMaschereDanno);
  player.invuln = ticksDaMs(FEEL.iframes.durataMs);
  scuoti(FEEL.scossa.ferita);
  if (statoRun.hpHalf <= 0) {
    if (statoRun.viteExtra > 0) {
      statoRun.viteExtra--;
      statoRun.hpHalf = statoRun.maxHpHalf;
      player.invuln = 120;
      scuoti(FEEL.scossa.evento);
      statoRun.ondeEsplosione.push({ x: player.x, y: player.y, r: 10, maxR: 140, color: '#22c55e' });
      mostraBanner('✚ SECONDA VITA! La marionetta risorge a piena salute!', 200);
      return;
    }
    const haCollare = statoRun.oggettiEquipaggiati && statoRun.oggettiEquipaggiati.some((it) => it.id === 'patto_collare');
    if (haCollare && rng() < 0.5) {
      statoRun.hpHalf = 1;
      player.invuln = 120;
      scuoti(FEEL.scossa.evento);
      statoRun.ondeEsplosione.push({ x: player.x, y: player.y, r: 10, maxR: 120, color: '#f59e0b' });
      mostraBanner('🐱 COLLARE DEL GATTO: 9 Vite! Ti risvegli con ½ Maschera!', 200);
      return;
    }
    // --- T4: inizio ---
    // Sequenza di morte e risveglio nell'hub: la notte successiva la conta T4 con incrementaNumeroNotte().
    if (t4Gancio('morte', fonte)) return;
    // --- T4: fine ---
    const proxNotte = incrementaNumeroNotte();
    statoRun.numeroNotte = proxNotte;
    mostraBanner(`🌙 NOTTE ${proxNotte} — Maschere spezzate contro ${fonte}... Risveglio!`, 220);
    nuovaRun(false);
  }
}

/** Un tick di logica (1/60 s). Durante l'hit-stop la logica è ferma ma il tempo delle animazioni scorre. */
function passoLogico() {
  tick++;
  if (statoRun.fase === 'menu_selezione') return;
  // --- T4: inizio ---
  if (t4Gancio('logica')) return;
  // --- T4: fine ---

  const st = statoRun.stanzaCorrente;
  // --- B: inizio ---
  const inPausaUI = Boolean(statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo || statoRun.pausa);
  // --- B: fine ---

  // 1. HIT-STOP (FEEL.hitstop): la logica si ferma, la resa continua
  if (ticksCongelati > 0) {
    ticksCongelati--;
  } else if (st && !inPausaUI) {
    applicaSpinta(player, 0);
    for (const nk of st.nemici) if (nk.hp > 0) applicaSpinta(nk, 16);
    let mx = 0, my = 0;
    if (keys.KeyA) mx -= 1;
    if (keys.KeyD) mx += 1;
    if (keys.KeyW) my -= 1;
    if (keys.KeyS) my += 1;
    // --- c2: levetta a tocco analogica (teatro/c2-tocco.js): direzione libera, intensità = lunghezza (al più 1) ---
    const levaC2 = typeof levaToccoC2 === 'function' ? levaToccoC2(mx, my) : null;
    if (levaC2) { mx = levaC2.x; my = levaC2.y; }

    player.moving = false;
    if (mx !== 0 || my !== 0) {
      const l = levaC2 ? Math.max(1, Math.hypot(mx, my)) : Math.hypot(mx, my); // (c2) sotto 1 la levetta va piano
      player.x = Math.max(ARENA.x1, Math.min(ARENA.x2, player.x + (mx / l) * statoRun.speed));
      player.y = Math.max(ARENA.y1, Math.min(ARENA.y2, player.y + (my / l) * statoRun.speed));
      if (mx !== 0) player.flipX = mx < 0;
      player.moving = true;
      if (tick % 18 === 0) AudioSys.playPasso();
    } else if (player.targetX !== null && player.targetY !== null) {
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      const d = Math.hypot(dx, dy);
      if (d > 4) {
        player.x = Math.max(ARENA.x1, Math.min(ARENA.x2, player.x + (dx / d) * statoRun.speed));
        player.y = Math.max(ARENA.y1, Math.min(ARENA.y2, player.y + (dy / d) * statoRun.speed));
        player.flipX = dx < 0;
        player.moving = true;
      } else {
        player.targetX = null;
        player.targetY = null;
      }
    }

    // Collisione con Ostacoli del Palco (Colonne e Fosse)
    if (st.ostacoli && st.ostacoli.length > 0) {
      for (const o of st.ostacoli) {
        if (o.tipo === 'colonna' || o.tipo === 'braciere' || o.tipo === 'fossa') {
          const dist = Math.hypot(player.x - o.x, player.y - o.y);
          const rMin = o.r + 9;
          if (dist < rMin && dist > 0.01) {
            const nx = (player.x - o.x) / dist;
            const ny = (player.y - o.y) / dist;
            player.x = o.x + nx * rMin;
            player.y = o.y + ny * rMin;
          }
        }
      }
    }

    // Aggiornamento Pozzanghere di Fuoco
    if (st.pozzanghereFuoco && st.pozzanghereFuoco.length > 0) {
      for (let fi = st.pozzanghereFuoco.length - 1; fi >= 0; fi--) {
        const fz = st.pozzanghereFuoco[fi];
        fz.tick--;
        if (fz.tick <= 0) {
          st.pozzanghereFuoco.splice(fi, 1);
          continue;
        }
        // Danno a chi ci cammina sopra
        if (Math.hypot(player.x - fz.x, player.y - fz.y) < fz.r && player.invuln <= 0) {
          subisciColpoGiocatore(1, 'le fiamme del braciere', fz.x, fz.y);
        }
        for (const nem of st.nemici) {
          if (Math.hypot(nem.x - fz.x, nem.y - fz.y) < fz.r + nem.r) {
            nem.burnTicks = 90;
            nem.hp -= 0.08;
          }
        }
      }
    }

    if (player.cooldown > 0) player.cooldown--;
    if (player.shootAnimTimer > 0) player.shootAnimTimer--;
    if (player.pickupTimer > 0) player.pickupTimer--;
    if (player.invuln > 0) player.invuln--;
    if (statoRun.graziaIngressoC > 0) statoRun.graziaIngressoC--; // --- C: grazia d'ingresso ---

    if (st.oggettiATerra && st.oggettiATerra.length > 0) {
      for (let i = st.oggettiATerra.length - 1; i >= 0; i--) {
        const pk = st.oggettiATerra[i];
        if (Math.hypot(player.x - pk.x, player.y - pk.y) < 20) {
          if (pk.tipo === 'moneta') {
            statoRun.monete = Math.min(99, statoRun.monete + pk.valore);
            AudioSys.playMoneta();
            st.oggettiATerra.splice(i, 1);
          } else if (pk.tipo === 'cura' && statoRun.hpHalf < statoRun.maxHpHalf) {
            statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + pk.valore);
            st.oggettiATerra.splice(i, 1);
          }
          // --- T4: inizio ---
          else if (pk.tipo === 'ricordo' && t4Gancio('raccogli', pk, st)) st.oggettiATerra.splice(i, 1);
          // --- T4: fine ---
        }
      }
    }

    // --- T3: inizio ---
    window.__teatroT3?.aggiornaRaggio?.(st); // raggio cremisi continuo del patto (blocca i colpi finché è acceso)
    // --- T3: fine ---
    if (keys.ArrowRight || keys.KeyL) eseguiAttacco4Direzioni(1, 0);
    else if (keys.ArrowLeft || keys.KeyJ) eseguiAttacco4Direzioni(-1, 0);
    else if (keys.ArrowUp || keys.KeyI) eseguiAttacco4Direzioni(0, -1);
    else if (keys.ArrowDown || keys.KeyK) eseguiAttacco4Direzioni(0, 1);

    const posMuroSegreto = {
      N: { x: 320, y: ARENA.y1 },
      S: { x: 320, y: ARENA.y2 },
      W: { x: ARENA.x1, y: 188 },
      E: { x: ARENA.x2, y: 188 },
    };

    // Fendente di Spada animato in 6 frame
    if (player.swordAnimTick >= 0) {
      const frameIdx = Math.floor(player.swordAnimTick / 3);
      if (frameIdx >= 1 && frameIdx <= 4) {
        const reach = 38;
        const hx = player.x + Math.cos(player.swordAngle) * 20;
        const hy = (player.y - 6) + Math.sin(player.swordAngle) * 20;
        // Se la spada colpisce un braciere acceso, lo fa esplodere!
        if (st.ostacoli && st.ostacoli.length > 0) {
          for (const o of st.ostacoli) {
            if (o.tipo === 'braciere' && o.acceso && Math.hypot(hx - o.x, hy - o.y) <= reach + o.r) {
              o.acceso = false;
              scuoti(FEEL.scossa.bomba);
              AudioSys.playEsplosione();
              if (!st.pozzanghereFuoco) st.pozzanghereFuoco = [];
              st.pozzanghereFuoco.push({ x: o.x, y: o.y, r: 26, tick: 360 });
              statoRun.ondeEsplosione.push({ x: o.x, y: o.y, r: 6, maxR: 32, color: '#f97316' });
            }
          }
        }

        if (st.muroSegreto && !st.muroSegreto.aperto) {
          const pm = posMuroSegreto[st.muroSegreto.lato];
          if (pm && Math.hypot(hx - pm.x, hy - pm.y) <= reach + 16 && !player.swordHitIds.has('muroC')) {
            player.swordHitIds.add('muroC'); // C: un fendente conta un colpo solo
            colpisciMuroSegretoC(st, pm.x, pm.y);
          }
        }
        for (const nem of st.nemici) {
          if (nem.hp <= 0 || (nem.airZ || 0) > 16 || player.swordHitIds.has(nem.id)) continue;
          if (Math.hypot(nem.x - hx, (nem.y - 6) - hy) <= reach + nem.r) {
            player.swordHitIds.add(nem.id);
            danneggiaNemico(nem, statoRun.dmg, Math.cos(player.swordAngle), Math.sin(player.swordAngle));
          }
        }
        for (let i = statoRun.proiettiliNemici.length - 1; i >= 0; i--) {
          const pr = statoRun.proiettiliNemici[i];
          if (Math.hypot(pr.x - hx, pr.y - hy) <= reach * 0.85) {
            statoRun.effettiSplash.push({ x: pr.x, y: pr.y, tick: 0 });
            statoRun.proiettiliNemici.splice(i, 1);
          }
        }
      }
      player.swordAnimTick++;
      if (player.swordAnimTick >= 18) player.swordAnimTick = -1;
    }

    // Proiettili di Ferruccio
    // --- T3: inizio ---
    const spettraliT3 = window.__teatroT3?.spettrali?.() === true; // colpi che passano colonne e muri
    // --- T3: fine ---
    for (let i = statoRun.proiettili.length - 1; i >= 0; i--) {
      const p = statoRun.proiettili[i];
      if (!p) continue; // la lista può essersi accorciata di più colpi nel giro precedente
      aggiornaProiettileD(p, st); // --- D: orbita / ricerca ---
      p.x += p.vx;
      p.y += p.vy;
      p.dist += Math.hypot(p.vx, p.vy);

      // Collisione con Colonne di Caserta (blocco colpi) e Bracieri (esplosione fiamme)
      if (st.ostacoli && st.ostacoli.length > 0 && !spettraliT3) { // T3: le spettrali passano
        let hitOst = false;
        for (const o of st.ostacoli) {
          if (o.tipo === 'colonna') {
            if (Math.hypot(p.x - o.x, p.y - o.y) < o.r + p.r) {
              hitOst = true;
              statoRun.effettiSplash.push({ x: p.x, y: p.y, tick: 0 });
              AudioSys.playColpo();
              break;
            }
          } else if (o.tipo === 'braciere' && o.acceso) {
            if (Math.hypot(p.x - o.x, p.y - o.y) < o.r + p.r) {
              hitOst = true;
              o.acceso = false;
              scuoti(FEEL.scossa.bomba);
              AudioSys.playEsplosione();
              if (!st.pozzanghereFuoco) st.pozzanghereFuoco = [];
              st.pozzanghereFuoco.push({ x: o.x, y: o.y, r: 26, tick: 360 });
              statoRun.ondeEsplosione.push({ x: o.x, y: o.y, r: 6, maxR: 32, color: '#f97316' });
              break;
            }
          }
        }
        if (hitOst) {
          esplodiD(p, st); // --- D ---
          statoRun.proiettili.splice(i, 1);
          continue;
        }
      }

      if (st.muroSegreto && !st.muroSegreto.aperto) {
        const pm = posMuroSegreto[st.muroSegreto.lato];
        if (pm && Math.hypot(p.x - pm.x, p.y - pm.y) < 26) {
          colpisciMuroSegretoC(st, p.x, p.y); // C: servono 3 colpi
          statoRun.proiettili.splice(i, 1);
          continue;
        }
      }

      let rimuovi = p.dist >= p.maxDist || p.x < ARENA.x1 - 8 || p.x > ARENA.x2 + 8 || p.y < ARENA.y1 - 8 || p.y > ARENA.y2 + 8;
      // --- T3: inizio ---
      if (spettraliT3) rimuovi = p.dist >= p.maxDist || p.x < 0 || p.x > W || p.y < 0 || p.y > H;
      // --- T3: fine ---
      // --- D: inizio --- rimbalzi sui muri (gittata non azzerata) e colpi che annullano i proiettili nemici
      if (rimuovi && p.dist < p.maxDist && p.rimbalzi > 0 && !spettraliT3) rimuovi = !rimbalzaD(p);
      if (!rimuovi && bloccaProiettiliNemiciD(p)) rimuovi = true;
      // --- D: fine ---

      for (const nem of st.nemici) {
        if (nem.hp <= 0 || (nem.airZ || 0) > 16 || p.hitIds.has(nem.id)) continue;
        if (Math.hypot(nem.x - p.x, (nem.y - 6) - p.y) <= nem.r + p.r) {
          p.hitIds.add(nem.id);
          const hpPrima = nem.hp;
          const l = Math.hypot(p.vx, p.vy) || 1;
          danneggiaNemico(nem, p.dmg * moltProssimitaD(p), p.vx / l, p.vy / l); // D: prossimità
          statoRun.effettiSplash.push({ x: p.x, y: p.y, tick: 0 });
          if (p.piercing) {
            // Continua
          } else if (p.overflowPierce && p.dmg > hpPrima) {
            p.dmg -= hpPrima;
          } else {
            rimuovi = true;
            break;
          }
        }
      }
      if (rimuovi) {
        esplodiD(p, st); // --- D: esplosiva ---
        if (p.dist >= p.maxDist) statoRun.effettiSplash.push({ x: p.x, y: p.y, tick: 0 });
        statoRun.proiettili.splice(i, 1);
      }
    }

    // --- D: inizio ---
    aggiornaFamigliOrbitaliD(st);
    // --- D: fine ---
    // Proiettili Nemici
    const dannoBasePiano = statoRun.piano >= 3 ? 2 : 1;
    for (let i = statoRun.proiettiliNemici.length - 1; i >= 0; i--) {
      const pr = statoRun.proiettiliNemici[i];
      // Un effetto scattato nel giro precedente (onda che spegne i colpi, scudo…) può aver tolto più colpi insieme
      if (!pr) continue;
      pr.x += pr.vx;
      pr.y += pr.vy;
      pr.dist += Math.hypot(pr.vx, pr.vy);

      // I proiettili nemici sbattono sulle Colonne di Caserta (riparo tattico per il giocatore!)
      if (st.ostacoli && st.ostacoli.length > 0) {
        let hitCol = false;
        for (const o of st.ostacoli) {
          if (o.tipo === 'colonna' && Math.hypot(pr.x - o.x, pr.y - o.y) < o.r + 4) {
            hitCol = true;
            statoRun.effettiSplash.push({ x: pr.x, y: pr.y, tick: 0 });
            AudioSys.playColpo();
            break;
          }
        }
        if (hitCol) {
          statoRun.proiettiliNemici.splice(i, 1);
          continue;
        }
      }
      if (Math.hypot(player.x - pr.x, (player.y - 6) - pr.y) < 9 * (player.scalaA2 || 1) && player.invuln <= 0) {
        statoRun.effettiSplash.push({ x: pr.x, y: pr.y, tick: 0 });
        statoRun.proiettiliNemici.splice(i, 1);
        // --- D: Maschera di Cuoio: probabilità di parare il proiettile (1 − Π(1−p), max 0.5) ---
        if (statoRun.statD && statoRun.statD.bloccoProb > 0 && Math.random() < statoRun.statD.bloccoProb) { statoRun.bloccatiD = (statoRun.bloccatiD || 0) + 1; continue; }
        subisciColpoGiocatore(pr.bossShot ? 2 : dannoBasePiano, 'un proiettile del Velo', pr.x - pr.vx, pr.y - pr.vy);
        if (statoRun.hpHalf <= 0) break;
        continue;
      }
      if (pr.dist > 250 || pr.x < ARENA.x1 - 8 || pr.x > ARENA.x2 + 8 || pr.y < ARENA.y1 - 8 || pr.y > ARENA.y2 + 8) {
        statoRun.effettiSplash.push({ x: pr.x, y: pr.y, tick: 0 });
        statoRun.proiettiliNemici.splice(i, 1);
      }
    }

    // Passaggio porte aperte
    if (st.pulita) {
      const opp = { N: 'S', S: 'N', W: 'E', E: 'W' };
      if (st.porte.N && player.y <= ARENA.y1 + 5 && Math.abs(player.x - 320) < 26) {
        entraInStanza(statoRun.mappa.perId.get(st.porte.N), opp.N);
      } else if (st.porte.S && player.y >= ARENA.y2 - 5 && Math.abs(player.x - 320) < 26) {
        entraInStanza(statoRun.mappa.perId.get(st.porte.S), opp.S);
      } else if (st.porte.W && player.x <= ARENA.x1 + 5 && Math.abs(player.y - 188) < 26) {
        entraInStanza(statoRun.mappa.perId.get(st.porte.W), opp.W);
      } else if (st.porte.E && player.x >= ARENA.x2 - 5 && Math.abs(player.y - 188) < 26) {
        entraInStanza(statoRun.mappa.perId.get(st.porte.E), opp.E);
      }
    }

    // 6. IA DIFFERENZIATA NEMICI E BOSS
    for (const n of st.nemici) {
      if (n.hp <= 0) continue;
      if (n.flash > 0) n.flash--;
      if (statoRun.graziaIngressoC > 0) continue; // --- C: grazia d'ingresso: niente attacchi né contatto ---
      if (n.burnTicks > 0) {
        n.burnTicks--;
        if (n.burnTicks % 20 === 0) {
          danneggiaNemico(n, 1.2, 0, 0);
          if (n.hp <= 0) continue;
        }
      }
      if (n.stunTicks > 0) {
        n.stunTicks--;
        continue;
      }

      const ang = Math.atan2(player.y - n.y, player.x - n.x);
      const distPlayer = Math.hypot(player.x - n.x, player.y - n.y);

      if (n.boss) {
        n.phaseTick = (n.phaseTick || 0) + 1;
        const enrage = n.hp < n.maxHp * 0.5;

        if (n.bossId === 're-gatto') {
          // RE GATTO: riposo → una mossa fra salto alto (corona lenta all'atterraggio), sputo a
          // ventaglio o saltelli senza colpi. Parametri e ritmo in SALTI_REGATTO.
          const M = SALTI_REGATTO;
          if (!n.mossaRG) { n.mossaRG = 'riposo'; n.timerRG = 40; n.ultimaSparoRG = false; }
          if (n.mossaRG === 'salto') {
            n.timerRG--;
            n.airZ = Math.round(Math.sin((1 - n.timerRG / M.saltoAlto.durataTick) * Math.PI) * M.saltoAlto.quotaPx);
            n.x += (n.jumpTargetX - n.x) * M.saltoAlto.inseguimento;
            n.y += (n.jumpTargetY - n.y) * M.saltoAlto.inseguimento;
            if (n.timerRG <= 0) {
              n.airZ = 0;
              scuoti(FEEL.scossa.atterraggioReGatto);
              statoRun.ondeEsplosione.push({ x: n.x, y: n.y, r: 8, maxR: 48, tick: 0 });
              const fase0 = rng() * TAU;
              for (let k = 0; k < M.saltoAlto.corona; k++) {
                const a = fase0 + (TAU * k) / M.saltoAlto.corona;
                statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 6, vx: Math.cos(a) * M.saltoAlto.velocita, vy: Math.sin(a) * M.saltoAlto.velocita, dist: 0, bossShot: true });
              }
              n.mossaRG = 'riposo'; n.timerRG = enrage ? M.riposoRabbiaTick : M.riposoTick;
            }
          } else if (n.mossaRG === 'sputo') {
            n.timerRG--;
            n.flash = Math.max(n.flash, n.timerRG % 6 < 3 ? 2 : 0); // si gonfia prima di sputare
            if (n.timerRG <= 0) {
              const meta = (M.sputo.colpi - 1) / 2;
              for (let k = 0; k < M.sputo.colpi; k++) {
                const a = ang + (k - meta) * M.sputo.apertura;
                statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 6, vx: Math.cos(a) * M.sputo.velocita, vy: Math.sin(a) * M.sputo.velocita, dist: 0, bossShot: true });
              }
              n.mossaRG = 'riposo'; n.timerRG = enrage ? M.riposoRabbiaTick : M.riposoTick;
            }
          } else if (n.mossaRG === 'saltelli') {
            n.timerRG--;
            const d = M.saltelli.durataTick;
            const fase = (n.timerRG % d) / d;
            n.airZ = Math.round(Math.sin((1 - fase) * Math.PI) * M.saltelli.quotaPx);
            n.x = Math.max(ARENA.x1 + 20, Math.min(ARENA.x2 - 20, n.x + Math.cos(n.dirRG) * (M.saltelli.passoPx / d)));
            n.y = Math.max(ARENA.y1 + 20, Math.min(ARENA.y2 - 20, n.y + Math.sin(n.dirRG) * (M.saltelli.passoPx / d)));
            if (n.timerRG % d === 0) n.dirRG = ang + (rng() - 0.5) * 0.8; // ogni saltello punta di nuovo al giocatore
            if (n.timerRG <= 0) { n.airZ = 0; n.mossaRG = 'riposo'; n.timerRG = enrage ? M.riposoRabbiaTick : M.riposoTick; }
          } else {
            n.airZ = 0;
            n.x = Math.max(ARENA.x1 + 20, Math.min(ARENA.x2 - 20, n.x + Math.cos(ang) * n.speed * M.passoRiposo));
            n.y = Math.max(ARENA.y1 + 20, Math.min(ARENA.y2 - 20, n.y + Math.sin(ang) * n.speed * M.passoRiposo));
            n.timerRG--;
            if (n.timerRG <= 0) {
              const r = rng();
              const mossa = n.ultimaSparoRG ? 'saltelli'
                : r < M.pesoSaltoAlto ? 'salto' : r < M.pesoSaltoAlto + M.pesoSputo ? 'sputo' : 'saltelli';
              n.mossaRG = mossa;
              n.ultimaSparoRG = mossa !== 'saltelli';
              if (mossa === 'salto') {
                n.timerRG = M.saltoAlto.durataTick;
                n.jumpTargetX = Math.max(ARENA.x1 + 28, Math.min(ARENA.x2 - 28, player.x));
                n.jumpTargetY = Math.max(ARENA.y1 + 28, Math.min(ARENA.y2 - 28, player.y));
              } else if (mossa === 'sputo') {
                n.timerRG = M.sputo.caricaTick;
              } else {
                n.timerRG = M.saltelli.numero * M.saltelli.durataTick;
                n.dirRG = ang;
              }
            }
          }
        } else if (n.bossId === 'capitano-guardia') {
          // CAPITANO DI PIOMBO: carica rettilinea ad alta velocità da parete a parete!
          if (n.charging && n.chargeTimer > 0) {
            n.chargeTimer--;
            n.x = Math.max(ARENA.x1 + 18, Math.min(ARENA.x2 - 18, n.x + n.vx));
            n.y = Math.max(ARENA.y1 + 18, Math.min(ARENA.y2 - 18, n.y + n.vy));
            if (n.x <= ARENA.x1 + 19 || n.x >= ARENA.x2 - 19 || n.y <= ARENA.y1 + 19 || n.y >= ARENA.y2 - 19 || n.chargeTimer <= 0) {
              n.charging = false;
              scuoti(FEEL.scossa.schiantoCapitano);
              for (let k = 0; k < 8; k++) {
                const a = (TAU * k) / 8;
                statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 6, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, dist: 0, bossShot: true });
              }
              n.shootCd = enrage ? 38 : 50;
            }
          } else {
            n.x = Math.max(ARENA.x1 + 18, Math.min(ARENA.x2 - 18, n.x + Math.cos(ang) * n.speed * 0.6));
            n.y = Math.max(ARENA.y1 + 18, Math.min(ARENA.y2 - 18, n.y + Math.sin(ang) * n.speed * 0.6));
            n.shootCd--;
            if (n.shootCd <= 0) {
              n.charging = true;
              n.chargeTimer = 38;
              const horiz = Math.abs(player.x - n.x) >= Math.abs(player.y - n.y);
              const cSpd = enrage ? 4.2 : 3.5;
              n.vx = horiz ? Math.sign(player.x - n.x || 1) * cSpd : 0;
              n.vy = horiz ? 0 : Math.sign(player.y - n.y || 1) * cSpd;
            }
          }
        } else if (n.bossId === 'regina-vespa') {
          // REGINA VESPA: rimbalza in diagonale sui muri ed evoca Vespe Cieche che volano addosso senza sparare
          n.x += n.vx || 1.1;
          n.y += n.vy || 0.85;
          if (n.x <= ARENA.x1 + 20 || n.x >= ARENA.x2 - 20) n.vx = -(n.vx || 1.1);
          if (n.y <= ARENA.y1 + 20 || n.y >= ARENA.y2 - 20) n.vy = -(n.vy || 0.85);
          n.x = Math.max(ARENA.x1 + 20, Math.min(ARENA.x2 - 20, n.x));
          n.y = Math.max(ARENA.y1 + 20, Math.min(ARENA.y2 - 20, n.y));
          n.shootCd--;
          if (n.shootCd <= 0) {
            n.shootCd = enrage ? 52 : 68;
            const nVespeVive = st.nemici.filter((m) => !m.boss && m.hp > 0).length;
            if (nVespeVive < 4) {
              st.nemici.push({
                id: `spawn-vespa-${tick}`,
                tipo: 'vespa_cieca',
                nome: 'Vespa Cieca (Attack Fly)',
                comportamento: 'volo_puro',
                x: n.x + (rng() - 0.5) * 26,
                y: n.y + (rng() - 0.5) * 20,
                vx: 0, vy: 0,
                r: 11,
                hp: 8, maxHp: 8,
                speed: 1.55,
                shootCd: 999,
                boss: false,
                flash: 4,
                burnTicks: 0,
                stunTicks: 0,
              });
            }
            for (let k = 0; k < 8; k++) {
              const a = (TAU * k) / 8 + n.phaseTick * 0.25;
              statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 6, vx: Math.cos(a) * 2.0, vy: Math.sin(a) * 2.0, dist: 0, bossShot: true });
            }
          }
        } else if (n.bossId === 'colosso-statua') {
          // --- A: inizio ---
          // IL CUSTODE DI MARMO: immobile; esegue BOSS_A.custode.sequenza separata da pause.
          // Stati: 'pausa' → mossa successiva della sequenza → 'pausa' … ; 'aperto' = vulnerabile (×1,5).
          const C = BOSS_A.custode;
          n.x = C.x;
          n.y = C.y;
          if (!n.statoCM) { n.statoCM = 'pausa'; n.timerCM = C.pausaTick; n.indiceCM = 0; n.apertoCM = false; n.evocaCM = 0; n.parCM = 0; }
          const sparaC = (a, v) => statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 8, vx: Math.cos(a) * v, vy: Math.sin(a) * v, dist: 0, bossShot: true });
          const tCM = n.timerCM--;
          if (n.statoCM === 'croci') {
            const iv = enrage ? C.croci.intervalloRabbiaTick : C.croci.intervalloTick;
            if (tCM % iv === 0) {
              n.parCM = 1 - n.parCM;
              for (let k = 0; k < 4; k++) sparaC(n.parCM * Math.PI / 4 + (k * Math.PI) / 2, C.croci.velocita);
            }
          } else if (n.statoCM === 'spirale') {
            if (tCM % C.spirale.ogniTick === 0) {
              const nb = enrage ? C.spirale.bracciRabbia : C.spirale.bracci;
              for (let k = 0; k < nb; k++) sparaC(n.phaseTick * C.spirale.giro + (TAU * k) / nb, C.spirale.velocita);
            }
          } else if (n.statoCM === 'raffica') {
            if (tCM % C.raffica.intervalloTick === 0) sparaC(Math.atan2(player.y - (n.y - 8), player.x - n.x), C.raffica.velocita);
          } else if (n.statoCM === 'evoca' && tCM === C.evoca.durataTick) {
            const vespe = n.evocaCM++ % 2 === 0;
            const servi = st.nemici.filter((m) => !m.boss && m.hp > 0).length;
            for (let k = 0; k < C.evoca.numero && servi + k < C.evoca.maxServi; k++) {
              const lato = k === 0 ? -1 : 1;
              const hpS = vespe ? C.evoca.hpVespa : C.evoca.hpStatuetta;
              st.nemici.push({
                id: `spawn-custode-${tick}-${k}`,
                tipo: vespe ? 'vespa_cieca' : 'statua',
                nome: vespe ? 'Vespa Cieca (Attack Fly)' : 'Statuetta di Marmo',
                comportamento: vespe ? 'volo_puro' : 'torretta_croce',
                // --- C: inizio --- anche gli spawn del boss stanno lontani dalle porte
                ...puntoLontanoDallePorteC(n.x + lato * 58, n.y + 34, porteVietateC(st).concat([{ x: player.x, y: player.y }])),
                // --- C: fine ---
                vx: 0, vy: 0,
                r: vespe ? 11 : 13,
                hp: hpS, maxHp: hpS,
                speed: vespe ? 1.55 : 0,
                shootCd: vespe ? 999 : 60,
                boss: false, flash: 6, burnTicks: 0, stunTicks: 0,
                state: 'idle', stateTimer: 20, maskOpen: false,
              });
            }
          }
          if (n.timerCM <= 0) {
            if (n.statoCM === 'pausa') {
              n.statoCM = C.sequenza[n.indiceCM++ % C.sequenza.length];
              n.timerCM = n.statoCM === 'croci' ? C.croci.salve * (enrage ? C.croci.intervalloRabbiaTick : C.croci.intervalloTick)
                : n.statoCM === 'spirale' ? C.spirale.durataTick
                : n.statoCM === 'raffica' ? C.raffica.colpi * C.raffica.intervalloTick
                : n.statoCM === 'evoca' ? C.evoca.durataTick
                : C.aperto.durataTick;
              n.apertoCM = n.statoCM === 'aperto';
              if (n.apertoCM) n.flash = 8;
            } else {
              n.statoCM = 'pausa';
              n.apertoCM = false;
              n.timerCM = enrage ? C.pausaRabbiaTick : C.pausaTick;
            }
          }
          // --- A: fine ---
        } else if (n.bossId === 'donna-luciana') {
          // --- A: inizio ---
          // DONNA LUCIANA: lei spara (ventaglio, spirale, raffica mirata) e non fa danno a contatto;
          // le sue DUE Mani mirano, scendono a schiacciare e fanno danno SOLO a contatto (BOSS_A.luciana).
          const L = BOSS_A.luciana;
          const xLim = (v) => Math.max(ARENA.x1 + 20, Math.min(ARENA.x2 - 20, v));
          n.x = Math.max(ARENA.x1 + 32, Math.min(ARENA.x2 - 32, n.x + Math.cos(ang) * n.speed * L.passo));
          n.y = Math.max(ARENA.y1 + 24, Math.min(ARENA.y2 - 24, n.y + Math.sin(ang) * n.speed * L.passo));
          if (!n.maniA) {
            // [0] = Mano sinistra (lato +1), [1] = Mano destra (lato -1)
            n.maniA = [-1, 1].map((s) => ({ lato: -s, x: xLim(n.x + s * L.scartoMani), y: L.quotaRiposoY, y0: 0, ty: 0, fase: 'riposo', t: 0 }));
            n.turnoManoA = 0;
            n.attesaManiA = L.primaAttesaTick;
            n.mossaA = 0;
            n.rafficaA = 0;
            n.rafficaTA = 0;
          }
          n.attesaManiA--;
          if (n.attesaManiA <= 0) {
            const m = n.maniA[n.turnoManoA];
            if (m.fase === 'riposo') { m.fase = 'mira'; m.t = L.miraTick; }
            n.turnoManoA = 1 - n.turnoManoA;
            n.attesaManiA = enrage ? L.pausaRabbiaTick : L.pausaTick;
          }
          for (const m of n.maniA) {
            if (m.fase === 'riposo' || m.fase === 'risalita') {
              m.x += (xLim(n.x - m.lato * L.scartoMani) - m.x) * L.inseguimento;
              m.y += (L.quotaRiposoY - m.y) * (m.fase === 'risalita' ? 0.12 : L.inseguimento);
              if (m.fase === 'risalita' && --m.t <= 0) m.fase = 'riposo';
            } else if (m.fase === 'mira') {
              m.x += (xLim(player.x) - m.x) * L.inseguimentoMira;
              m.y += (L.quotaRiposoY - m.y) * L.inseguimento;
              m.ty = Math.min(ARENA.y2 - 12, player.y - 4 - L.palmoY);
              if (--m.t <= 0) { m.fase = 'discesa'; m.t = L.discesaTick; m.y0 = m.y; }
            } else if (m.fase === 'discesa') {
              m.t--;
              const k = 1 - m.t / L.discesaTick;
              m.y = m.y0 + (m.ty - m.y0) * k * k;
              if (m.t <= 0) {
                m.fase = 'aTerra'; m.t = L.aTerraTick; m.y = m.ty;
                scuoti(FEEL.scossa.schiantoCapitano);
                statoRun.effettiSplash.push({ x: m.x, y: m.y + L.palmoY, tick: 0 });
              }
            } else if (m.fase === 'aTerra') {
              if (--m.t <= 0) { m.fase = 'risalita'; m.t = L.risalitaTick; }
            }
            // Danno SOLO a contatto con la Mano mentre schiaccia
            const schiaccia = m.fase === 'aTerra' || (m.fase === 'discesa' && m.t <= L.discesaTick * 0.35);
            if (schiaccia && player.invuln <= 0 && statoRun.hpHalf > 0 &&
                Math.hypot(player.x - m.x, (player.y - 6) - (m.y + L.palmoY)) < L.raggioSchianto) {
              subisciColpoGiocatore(2, 'una Mano di Donna Luciana', m.x, m.y + L.palmoY);
            }
          }
          // Lei spara: ventaglio, spirale, raffica mirata a turno
          const sparaL = (a, v) => statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v, dist: 0, bossShot: true });
          const angL = Math.atan2(player.y - (n.y - 10), player.x - n.x);
          if (n.rafficaA > 0) {
            if (--n.rafficaTA <= 0) { n.rafficaA--; n.rafficaTA = L.mirato.intervalloTick; sparaL(angL, L.mirato.velocita); }
          } else if (--n.shootCd <= 0) {
            n.shootCd = enrage ? L.cdSparoRabbiaTick : L.cdSparoTick;
            const mossa = L.sequenza[n.mossaA++ % L.sequenza.length];
            if (mossa === 'ventaglio') {
              const V = L.ventaglio;
              for (let k = 0; k < V.colpi; k++) sparaL(angL + (k - (V.colpi - 1) / 2) * V.apertura, V.velocita);
            } else if (mossa === 'spirale') {
              const S = L.spirale;
              const nc = enrage ? S.colpiRabbia : S.colpi;
              for (let k = 0; k < nc; k++) sparaL((TAU * k) / nc + n.phaseTick * S.passo, S.velocita);
            } else {
              n.rafficaA = L.mirato.colpi; n.rafficaTA = 0;
            }
          }
          // --- A: fine ---
        } else if (n.bossId === 'maestro-fucina') {
          // --- A: inizio ---
          // LO SPEZZAFILI D'OTTONE: cammina → mira → carica → stordito, lanciando forbici a boomerang (BOSS_A.spezzafili)
          const P = BOSS_A.spezzafili;
          const FB = P.forbici;
          const fase2 = enrage;
          const mv = fase2 ? P.moltVelFase2 : 1;
          if (!n.statoSF) { n.statoSF = 'cammina'; n.timerSF = P.camminaFase2Tick; n.forbiciA = []; n.cdForbiciA = 40; n.fase2SF = false; }
          const lanciaForbice = (a) => n.forbiciA.push({ x: n.x, y: n.y - 4, vx: Math.cos(a) * FB.velocita * mv, vy: Math.sin(a) * FB.velocita * mv, t: 0, rot: 0, ritorno: false });
          if (fase2 && !n.fase2SF) {
            n.fase2SF = true;
            n.flash = 12;
            scuoti(FEEL.scossa.schiantoCapitano);
            for (let k = 0; k < FB.crocePerFase2; k++) lanciaForbice((TAU * k) / FB.crocePerFase2 + Math.PI / 4);
          }
          if (n.statoSF === 'cammina') {
            const ond = Math.sin(n.phaseTick * 0.05) * P.ondeggio;
            n.x = Math.max(ARENA.x1 + 18, Math.min(ARENA.x2 - 18, n.x + Math.cos(ang + ond) * n.speed * P.passo * mv));
            n.y = Math.max(ARENA.y1 + 18, Math.min(ARENA.y2 - 18, n.y + Math.sin(ang + ond) * n.speed * P.passo * mv));
            if (--n.cdForbiciA <= 0) {
              n.cdForbiciA = fase2 ? P.cdForbiciFase2Tick : P.cdForbiciTick;
              if (fase2) { lanciaForbice(ang - FB.aperturaFase2); lanciaForbice(ang + FB.aperturaFase2); } else lanciaForbice(ang);
            }
            if (--n.timerSF <= 0) { n.statoSF = 'mira'; n.timerSF = P.miraTick; }
          } else if (n.statoSF === 'mira') {
            n.angSF = ang;
            if (n.timerSF % 8 === 0) n.flash = 3;
            if (--n.timerSF <= 0) {
              n.statoSF = 'carica'; n.timerSF = P.caricaTick;
              const v = fase2 ? P.velCaricaFase2 : P.velCarica;
              n.vx = Math.cos(n.angSF) * v; n.vy = Math.sin(n.angSF) * v;
            }
          } else if (n.statoSF === 'carica') {
            n.x = Math.max(ARENA.x1 + 18, Math.min(ARENA.x2 - 18, n.x + n.vx));
            n.y = Math.max(ARENA.y1 + 18, Math.min(ARENA.y2 - 18, n.y + n.vy));
            const muro = n.x <= ARENA.x1 + 19 || n.x >= ARENA.x2 - 19 || n.y <= ARENA.y1 + 19 || n.y >= ARENA.y2 - 19;
            if (--n.timerSF <= 0 || muro) {
              if (muro) scuoti(FEEL.scossa.schiantoCapitano);
              n.statoSF = 'stordito'; n.timerSF = P.storditoTick;
            }
          } else if (--n.timerSF <= 0) {
            n.statoSF = 'cammina'; n.timerSF = fase2 ? P.camminaFase2Tick : P.camminaTick;
          }
          // Forbici rotanti a boomerang: frenano, poi tornano al boss; danno a contatto, non si consumano
          for (let k = n.forbiciA.length - 1; k >= 0; k--) {
            const f = n.forbiciA[k];
            f.t++;
            f.rot += FB.rotazione;
            if (!f.ritorno) {
              f.vx *= FB.frenata; f.vy *= FB.frenata;
              if (f.x + f.vx < ARENA.x1 + 6 || f.x + f.vx > ARENA.x2 - 6) f.vx = -f.vx;
              if (f.y + f.vy < ARENA.y1 + 6 || f.y + f.vy > ARENA.y2 - 6) f.vy = -f.vy;
              if (Math.hypot(f.vx, f.vy) < FB.velMinima || f.t > FB.andataMaxTick) f.ritorno = true;
            } else {
              const ar = Math.atan2(n.y - 4 - f.y, n.x - f.x);
              f.vx += (Math.cos(ar) * FB.velRitorno * mv - f.vx) * FB.accelRitorno;
              f.vy += (Math.sin(ar) * FB.velRitorno * mv - f.vy) * FB.accelRitorno;
            }
            f.x += f.vx; f.y += f.vy;
            if ((f.ritorno && Math.hypot(n.x - f.x, n.y - 4 - f.y) < 14) || f.t > FB.vitaMaxTick) { n.forbiciA.splice(k, 1); continue; }
            if (player.invuln <= 0 && statoRun.hpHalf > 0 && Math.hypot(player.x - f.x, (player.y - 6) - f.y) < FB.raggio + 4) {
              subisciColpoGiocatore(2, 'le Forbici dello Spezzafili', f.x, f.y);
            }
          }
          // --- A: fine ---
        }
      } else {
        // IA DIFFERENZIATA DEI NEMICI COMUNI:
        const comp = n.comportamento || n.tipo;

        if (typeof iaNemicoD6 === 'function' && iaNemicoD6(n, st, ang, distPlayer)) {
          // --- d6: nemici dell'Acquedotto Carolino, IA in teatro/d6-acquedotto.js ---
        } else if (comp === 'volo_puro' || n.tipo === 'vespa_cieca') {
          // 1. VESPA CIECA (Attack Fly): vola dritta contro di te SENZA SPARARE!
          const osc = Math.sin(tick * 0.22 + n.x * 0.05) * 0.3;
          n.x = Math.max(ARENA.x1 + 12, Math.min(ARENA.x2 - 12, n.x + Math.cos(ang + osc) * n.speed));
          n.y = Math.max(ARENA.y1 + 12, Math.min(ARENA.y2 - 12, n.y + Math.sin(ang + osc) * n.speed));
        } else if (n.tipo === 'lucciola') {
          // LUCCIOLA PUNGENTE (Villa Comunale): volo erratico luminoso, scatto da vicino e puntura
          const osc = Math.sin(tick * 0.32 + n.y * 0.07) * 0.45;
          const vicina = distPlayer < 65;
          const spd = vicina ? n.speed * 1.35 : n.speed;
          n.x = Math.max(ARENA.x1 + 12, Math.min(ARENA.x2 - 12, n.x + Math.cos(ang + osc) * spd));
          n.y = Math.max(ARENA.y1 + 12, Math.min(ARENA.y2 - 12, n.y + Math.sin(ang + osc) * spd));
          n.shootCd = (n.shootCd || 68) - 1;
          if (n.shootCd <= 0) {
            n.shootCd = 65 + Math.floor(rng() * 20);
            statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 6, vx: Math.cos(ang) * 2.6, vy: Math.sin(ang) * 2.6, dist: 0 });
          }
        } else if (n.tipo === 'burattino') {
          // BURATTINO SCUCITO (San Leucio): passo sincopato a scatti, telegrafa la mira e stoccata d'ago a corto raggio
          n.shootCd = (n.shootCd || 58) - 1;
          if (n.shootCd > 18) {
            const passo = Math.sin(tick * 0.28) > 0.1 ? n.speed * 1.25 : 0;
            n.x = Math.max(ARENA.x1 + 14, Math.min(ARENA.x2 - 14, n.x + Math.cos(ang) * passo));
            n.y = Math.max(ARENA.y1 + 14, Math.min(ARENA.y2 - 14, n.y + Math.sin(ang) * passo));
          } else if (n.shootCd === 8) {
            // Affondo stoccata d'ago
            statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 6, vx: Math.cos(ang) * 3.5, vy: Math.sin(ang) * 3.5, dist: 0, maxDist: 75 });
          } else if (n.shootCd <= 0) {
            n.shootCd = 56 + Math.floor(rng() * 16);
          }
        } else if (n.tipo === 'predone') {
          // PREDONE D'OMBRA: scatto obliquo rapido e tiro secco
          n.shootCd = (n.shootCd || 64) - 1;
          const diagAng = ang + Math.sin(tick * 0.12) * 0.55;
          n.x = Math.max(ARENA.x1 + 14, Math.min(ARENA.x2 - 14, n.x + Math.cos(diagAng) * n.speed * 0.95));
          n.y = Math.max(ARENA.y1 + 14, Math.min(ARENA.y2 - 14, n.y + Math.sin(diagAng) * n.speed * 0.95));
          if (n.shootCd <= 0) {
            n.shootCd = 58 + Math.floor(rng() * 20);
            statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 6, vx: Math.cos(ang) * 2.8, vy: Math.sin(ang) * 2.8, dist: 0 });
          }
        } else if (comp === 'bomba_ferma' || n.tipo === 'bomba_ferma') {
          // 2. BOZZOLO DI POLVERE: STA FERMO sul posto, pulsa quando ti avvicini ed ESPLODE!
          if (distPlayer < 64 || n.fuseTimer > 0) {
            n.fuseTimer = (n.fuseTimer || 0) + 1;
            if (n.fuseTimer >= 42) {
              n.hp = 0;
              innescaEsplosioneBomba(st, n.x, n.y, n.nome);
              verificaStanzaPulita();
              continue;
            }
          }
        } else if (comp === 'balzo' || n.tipo === 'gatto') {
          // 3. GATTO DEL VELO: NON spara! Si accovaccia (telegraph) e balza rapido verso di te
          if (n.leapTimer > 0) {
            n.leapTimer--;
            n.x = Math.max(ARENA.x1 + 14, Math.min(ARENA.x2 - 14, n.x + n.vx));
            n.y = Math.max(ARENA.y1 + 14, Math.min(ARENA.y2 - 14, n.y + n.vy));
          } else {
            n.shootCd--;
            if (n.shootCd <= 18 && n.shootCd > 0) {
              n.crouchTicks = n.shootCd;
            } else if (n.shootCd <= 0) {
              n.crouchTicks = 0;
              n.leapTimer = 18;
              const lSpd = 3.25;
              n.vx = Math.cos(ang) * lSpd;
              n.vy = Math.sin(ang) * lSpd;
              n.shootCd = 54 + Math.floor(rng() * 20);
            }
          }
        } else if (comp === 'host_scudo' || n.tipo === 'maschera') {
          // 4. MASCHERA CORAZZATA: immobile e corazzata finché chiusa; si apre per sparare un ventaglio di 3 colpi!
          n.shootCd--;
          if (n.shootCd > 30) {
            n.maskOpen = false;
          } else if (n.shootCd === 30) {
            n.maskOpen = true;
            n.flash = 4;
          } else if (n.shootCd === 15) {
            n.maskOpen = true;
            for (const da of [-0.22, 0, 0.22]) {
              statoRun.proiettiliNemici.push({
                x: n.x, y: n.y - 6,
                vx: Math.cos(ang + da) * 2.25, vy: Math.sin(ang + da) * 2.25,
                dist: 0,
              });
            }
          } else if (n.shootCd <= 0) {
            n.maskOpen = false;
            n.shootCd = 92;
          }
        } else if (comp === 'torretta_croce' || n.tipo === 'statua') {
          // 5. BUSTO DI MARMO: completamente FERMO sul posto, spara salve alternate a '+' e '×'
          n.shootCd--;
          if (n.shootCd <= 0) {
            n.shootCd = 76;
            n.salvoParity = ((n.salvoParity || 0) + 1) % 2;
            const baseRot = n.salvoParity === 0 ? 0 : Math.PI / 4;
            for (let k = 0; k < 4; k++) {
              const a = baseRot + (k * Math.PI) / 2;
              statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 6, vx: Math.cos(a) * 2.05, vy: Math.sin(a) * 2.05, dist: 0 });
            }
          }
        } else {
          // 6. SOLDATO DI PIOMBO (Knight / Clotty): pattuglia ed esegue doppi colpi mirati
          n.x = Math.max(ARENA.x1 + 14, Math.min(ARENA.x2 - 14, n.x + Math.cos(ang) * n.speed * 0.72));
          n.y = Math.max(ARENA.y1 + 14, Math.min(ARENA.y2 - 14, n.y + Math.sin(ang) * n.speed * 0.72));
          n.shootCd--;
          if (n.shootCd <= 0) {
            n.shootCd = 68;
            for (const da of [-0.12, 0.12]) {
              statoRun.proiettiliNemici.push({ x: n.x, y: n.y - 6, vx: Math.cos(ang + da) * 2.3, vy: Math.sin(ang + da) * 2.3, dist: 0 });
            }
          }
        }
      }

      // Danno da contatto (solo se il boss non è in volo alto airZ > 20)
      // --- A: inizio --- Donna Luciana non fa danno a contatto (lo fanno solo le sue Mani) --- A: fine ---
      if (n.bossId !== 'donna-luciana' && (n.airZ || 0) < 20 && Math.hypot(player.x - n.x, player.y - n.y) < n.r + 9 * (player.scalaA2 || 1) && player.invuln <= 0) {
        subisciColpoGiocatore(n.boss ? 2 : dannoBasePiano, n.nome, n.x, n.y);
        if (statoRun.hpHalf <= 0) break;
      }
    }
  }

}

/**
 * Disegna un frame (a qualunque refresh). La scossa si consuma a tempo reale.
 * @param {number} dtMs tempo reale dal frame precedente
 */
