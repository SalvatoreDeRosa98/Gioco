/*
 * teatro/t2-sprite.js — Passo T2 della roadmap «Novità nel Teatro»: i fogli sprite dell'autore al posto dei
 * disegni pittorici del Teatro per i 4 personaggi giocabili e i 7 nemici comuni.
 *
 * Script classico (non modulo), caricato dopo lo script principale di teatro_marionette.html (e dopo T3/T4).
 * Il Teatro è una IIFE: i suoi interni arrivano da window.__teatro.interni; questo file registra i ganci in
 * window.__teatro.t2, che il file principale chiama con t2Gancio(nome, ...) nei blocchi «T2: inizio/fine»:
 *   personaggio(ctx, charId, px, py, opts)  dentro disegnaFerruccioPittorico, dopo traslazione e ribaltamento
 *   nemico(ctx, n, tick)                    dentro disegnaNemicoPittorico, dopo traslazione (e scala campione)
 *   dopoNemici(ctx, st, tick)               dopo il ciclo dei nemici: pose di morte di quelli appena abbattuti
 * Un gancio che rende true ha disegnato lo sprite; false (immagine non ancora caricata, tipo non coperto)
 * lascia il disegno pittorico esistente: è il fallback.
 *
 * Fogli: assets/sprite_teatro/<nome>.png, prodotti da tools/ritaglia-sprite.py dai fogli dell'autore
 * (assets/sprite_ombre/). Celle uguali, figura ancorata ai piedi in basso al centro, una riga per posa.
 * La disposizione (LAYOUT) è copiata da assets/sprite_teatro/layout.json: se si rigenerano i fogli, la si
 * riallinea. Nella build in un solo file (tools/teatro-release.js) le immagini arrivano come data: URI in
 * window.__risorseTeatro[percorso], letta prima del percorso relativo.
 *
 * Le costanti visive (altezze a schermo, cadenze, piedi) stanno in CONFIG: sono di resa, non di gioco.
 */
(() => {
  'use strict';
  const T = window.__teatro;
  if (!T || !T.interni) {
    console.error('[T2] window.__teatro.interni mancante: il blocco T4/T2 del file principale non è stato caricato.');
    return;
  }
  const I = T.interni;

  /* T2-LAYOUT: inizio (da assets/sprite_teatro/layout.json; righe = [posa, fotogrammi]) */
  const LAYOUT = {
    "ferruccio": {"cella_l": 305, "cella_a": 136, "altezza_rif": 128, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "agnese": {"cella_l": 212, "cella_a": 138, "altezza_rif": 127, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "taddeo": {"cella_l": 188, "cella_a": 132, "altezza_rif": 123, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "ombra": {"cella_l": 377, "cella_a": 142, "altezza_rif": 130, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "teste-mira": {"cella_l": 60, "cella_a": 74, "altezza_rif": 64, "margine": 4, "righe": [["tutto", 4]]},
    "gatto": {"cella_l": 422, "cella_a": 136, "altezza_rif": 124, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["attacco", 2], ["colpito", 1], ["morte", 4]]},
    "vespa-cieca": {"cella_l": 297, "cella_a": 265, "colonne": 4, "altezza_rif": 257, "margine": 4, "righe": [["vola", 4], ["carica", 2], ["colpito", 1], ["morte", 3]]},
    "maschera": {"cella_l": 272, "cella_a": 211, "colonne": 4, "altezza_rif": 203, "margine": 4, "righe": [["chiusa", 2], ["si-apre", 3], ["aperta-spara", 2], ["colpito", 1], ["morte", 4]]},
    "bomba-ferma": {"cella_l": 251, "cella_a": 277, "colonne": 5, "altezza_rif": 269, "margine": 4, "righe": [["fermo", 2], ["miccia", 4], ["esplode", 5]]},
    "guardia": {"cella_l": 307, "cella_a": 244, "colonne": 4, "altezza_rif": 236, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["attacco", 2], ["colpito", 1], ["morte", 2]]},
    "statua": {"cella_l": 192, "cella_a": 240, "colonne": 4, "altezza_rif": 232, "margine": 4, "righe": [["fermo", 2], ["trema", 3], ["spara", 2], ["colpito", 1], ["morte", 4]]},
    "predone": {"cella_l": 331, "cella_a": 227, "colonne": 4, "altezza_rif": 219, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["attacco", 2], ["colpito", 1], ["morte", 2]]},
    "regina-vespa": {"cella_l": 328, "cella_a": 292, "colonne": 4, "altezza_rif": 284, "margine": 4, "righe": [["vola", 4], ["carica", 2], ["evoca", 2], ["colpito", 1], ["morte", 2]]},
    "capitano": {"cella_l": 372, "cella_a": 244, "colonne": 4, "altezza_rif": 236, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["carica", 4], ["morte", 3]]},
    "donna-luciana": {"cella_l": 418, "cella_a": 258, "colonne": 4, "altezza_rif": 250, "margine": 4, "righe": [["fermo", 4], ["evoca", 4], ["attacco", 2], ["colpito", 1], ["morte", 3]]},
    "custode-marmo": {"cella_l": 392, "cella_a": 240, "colonne": 4, "altezza_rif": 232, "margine": 4, "righe": [["fermo", 2], ["apre", 2], ["spara", 3], ["colpito", 1], ["morte", 4]]},
    "spezzafili": {"cella_l": 403, "cella_a": 246, "colonne": 4, "altezza_rif": 238, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["attacco", 2], ["morte", 3]]},
    "lucciola": {"cella_l": 293, "cella_a": 222, "colonne": 4, "altezza_rif": 214, "margine": 4, "righe": [["vola", 4], ["carica", 2], ["colpito", 1], ["morte", 3]]},
    "burattino": {"cella_l": 308, "cella_a": 267, "colonne": 4, "altezza_rif": 259, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["attacco", 2], ["morte", 3]]}
  };
  /* T2-LAYOUT: fine */

  const CONFIG = Object.freeze({
    cartella: 'assets/sprite_teatro/',
    // Ridimensionamento con interpolazione: gli sprite sono disegnati (non pixel-art), quindi lisci
    // (scelto confrontando gli screenshot production/qa/evidence/teatro-t2-liscio-*.png).
    liscio: true,
    // Altezza a schermo (px del canvas 640x360) della figura «fermo»: la stessa dei disegni pittorici.
    altezza: Object.freeze({
      ferruccio: 58, agnese: 56, taddeo: 56, ombra: 56,
      gatto: 26, 'vespa-cieca': 26, maschera: 30, 'bomba-ferma': 28, guardia: 40, statua: 42, predone: 38,
      lucciola: 26, burattino: 38,
      'regina-vespa': 58, capitano: 68, 'donna-luciana': 76, 'custode-marmo': 72, spezzafili: 68,
    }),
    // Dove cadono i piedi rispetto al punto (x, y) dell'entità (il centro dell'ombra a terra).
    piediPersonaggio: 9,
    piediNemico: 5,
    piediVespa: -3, // la vespa vola: resta sollevata sopra la sua ombra
    // Tick (60 Hz) per fotogramma, per posa.
    cadenza: Object.freeze({ fermo: 22, cammina: 8, muove: 9, vola: 4, spara: 7, colpito: 1, morto: 9,
      morte: 7, anticipo: 9, attacco: 6, carica: 5, evoca: 8, apre: 6, miccia: 6, esplode: 5, chiusa: 24, 'si-apre': 5,
      'aperta-spara': 7, trema: 4 }),
    colpitoTick: 14,   // dopo un colpo subito, per quanti tick il personaggio mostra la posa «colpito»
    tinta: Object.freeze({ cremisi: '#dc2626', dorato: '#eab308', elettrico: '#0284c7' }),
    tintaAlfa: 0.35,
  });

  // tipo del Teatro → foglio
  const FOGLIO_NEMICO = { vespa_cieca: 'vespa-cieca', gatto: 'gatto', maschera: 'maschera',
    bomba_ferma: 'bomba-ferma', guardia: 'guardia', statua: 'statua', predone: 'predone',
    lucciola: 'lucciola', burattino: 'burattino' };
  const PERSONAGGI = { ferruccio: 1, agnese: 1, taddeo: 1, ombra: 1 };

  // ---------------------------------------------------------------------------------------------
  // Caricamento
  // ---------------------------------------------------------------------------------------------
  const immagini = {};
  const risorse = window.__risorseTeatro || {};
  for (const nome of Object.keys(LAYOUT)) {
    const img = new Image();
    const percorso = CONFIG.cartella + nome + '.png';
    img.onerror = () => console.warn('[T2] sprite non caricato, resta il disegno pittorico:', percorso);
    img.src = risorse[percorso] || percorso;
    immagini[nome] = img;
    const L = LAYOUT[nome];
    L.indice = {};
    L.righe.forEach(([posa, n], r) => { L.indice[posa] = { riga: r, n }; });
  }
  const pronta = (nome) => { const im = immagini[nome]; return !!(im && im.complete && im.naturalWidth > 0); };

  // tela di appoggio per tinte e lampi (source-atop sulla sola sagoma)
  const appoggio = document.createElement('canvas');
  const actx = appoggio.getContext('2d');

  /**
   * Disegna un fotogramma con i piedi in (0, piediY) del contesto corrente (già traslato/ribaltato).
   * @returns {boolean} false se il foglio non è pronto o la posa non c'è
   */
  function disegnaFotogramma(ctx, nome, posa, f, piediY, tinta, tintaAlfa, customH) {
    if (!pronta(nome)) return false;
    const L = LAYOUT[nome];
    const p = L.indice[posa] || L.indice[L.righe[0][0]];
    if (!p) return false;
    const col = ((f % p.n) + p.n) % p.n;
    const sx = col * L.cella_l, sy = p.riga * L.cella_a;
    const s = (customH || CONFIG.altezza[nome] || 40) / L.altezza_rif;
    const dw = L.cella_l * s, dh = L.cella_a * s;
    const dx = -dw / 2, dy = piediY - (L.cella_a - L.margine) * s;
    const liscio = window.__t2Liscio !== undefined ? !!window.__t2Liscio : CONFIG.liscio;
    ctx.save();
    ctx.imageSmoothingEnabled = liscio;
    if (liscio) ctx.imageSmoothingQuality = 'high';
    if (tinta) {
      // (T5) la tela di appoggio è alla risoluzione reale del contesto (scala del palco compresa), non a
      // pochi pixel di gioco: il foglio dell'autore resta a piena definizione anche quando è tinto.
      const m = ctx.getTransform();
      const k = Math.max(1, Math.min(8, Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d))));
      const w = Math.max(1, Math.ceil(dw * k)), h = Math.max(1, Math.ceil(dh * k));
      if (appoggio.width < w) appoggio.width = w;
      if (appoggio.height < h) appoggio.height = h;
      actx.clearRect(0, 0, appoggio.width, appoggio.height);
      actx.globalCompositeOperation = 'source-over';
      actx.imageSmoothingEnabled = liscio;
      if (liscio) actx.imageSmoothingQuality = 'high';
      actx.drawImage(immagini[nome], sx, sy, L.cella_l, L.cella_a, 0, 0, dw * k, dh * k);
      actx.globalCompositeOperation = 'source-atop';
      actx.globalAlpha = tintaAlfa;
      actx.fillStyle = tinta;
      actx.fillRect(0, 0, w, h);
      actx.globalAlpha = 1;
      actx.globalCompositeOperation = 'source-over';
      ctx.drawImage(appoggio, 0, 0, w, h, dx, dy, w / k, h / k);
    } else {
      ctx.drawImage(immagini[nome], sx, sy, L.cella_l, L.cella_a, dx, dy, dw, dh);
    }
    ctx.restore();
    return true;
  }

  const fotogramma = (posa, t) => Math.floor(t / (CONFIG.cadenza[posa] || 8));

  // ---------------------------------------------------------------------------------------------
  // Personaggi giocabili
  // ---------------------------------------------------------------------------------------------
  let morteDa = -1;

  function personaggio(ctx, charId, px, py, opts) {
    if (!PERSONAGGI[charId] || !pronta(charId)) return false;
    const { statoRun, player } = I;
    const tick = opts.tick || 0;
    const nRighe = LAYOUT[charId].indice;
    let posa = 'fermo', f = fotogramma('fermo', tick);
    const ePlayer = px === player.x && py === player.y;
    if (statoRun.fase === 'menu_selezione') {
      f = 0; // menu: primo fotogramma «fermo», fermo
    } else if (ePlayer && statoRun.fase === 'morte') {
      if (morteDa < 0) morteDa = tick;
      posa = 'morto';
      f = Math.min(nRighe.morto.n - 1, fotogramma('morto', tick - morteDa));
    } else {
      if (statoRun.fase !== 'morte') morteDa = -1;
      const durataIframes = Math.round(I.FEEL.iframes.durataMs / I.MS_PER_TICK);
      if (ePlayer && player.invuln > durataIframes - CONFIG.colpitoTick) {
        posa = 'colpito'; f = 0;
      } else if (opts.shootAnim || (ePlayer && player.shootAnimTimer > 0) || (opts.swordAnimTick >= 0 && opts.swordAnimTick < 14)) {
        posa = 'spara';
        f = opts.swordAnimTick >= 0 && opts.swordAnimTick < 14 ? (opts.swordAnimTick < 7 ? 0 : 1) : fotogramma('spara', tick);
      } else if (opts.moving) {
        posa = 'cammina'; f = fotogramma('cammina', tick);
      }
    }
    return disegnaFotogramma(ctx, charId, posa, f, CONFIG.piediPersonaggio, opts.flash ? '#ffffff' : null, 0.7);
  }

  // ---------------------------------------------------------------------------------------------
  // Nemici comuni: stato del Teatro → posa del foglio
  // ---------------------------------------------------------------------------------------------
  const visti = new WeakMap(); // nemico → { foglio, morteDa }

  function posaNemico(n, tick) {
    const colpito = n.flash > 0;
    switch (n.tipo) {
      case 'vespa_cieca':
      case 'lucciola': {
        const P = I.player;
        if (colpito) return ['colpito', 0];
        if (Math.hypot(P.x - n.x, P.y - n.y) < 52) return ['carica', fotogramma('carica', tick)];
        return ['vola', fotogramma('vola', tick)];
      }
      case 'burattino':
        if (colpito) return ['colpito', 0];
        if (n.shootCd >= 50 && n.shootCd <= 58) return ['attacco', n.shootCd >= 54 ? 0 : 1];
        if (n.shootCd <= 16) return ['anticipo', n.shootCd > 8 ? 0 : 1];
        return ['muove', fotogramma('muove', tick)];
      case 'gatto':
        if (colpito) return ['colpito', 0];
        if (n.leapTimer > 0) return ['attacco', n.leapTimer > 9 ? 0 : 1];
        if (n.crouchTicks > 0) return ['anticipo', n.crouchTicks > 9 ? 0 : 1];
        if (Math.abs(n.vx || 0) > 0.1 || Math.abs(n.vy || 0) > 0.1) return ['muove', fotogramma('muove', tick)];
        return ['fermo', fotogramma('fermo', tick)];
      case 'bomba_ferma':
        if (n.fuseTimer > 0) return ['miccia', Math.floor(n.fuseTimer / (n.fuseTimer > 28 ? 3 : 6))];
        return ['fermo', fotogramma('fermo', tick)];
      case 'maschera':
        if (n.maskOpen && n.shootCd > 15) return ['si-apre', Math.min(2, Math.floor((30 - n.shootCd) / 5))];
        if (n.maskOpen) return ['aperta-spara', n.shootCd > 8 ? 0 : 1];
        if (colpito) return ['colpito', 0];
        return ['chiusa', fotogramma('chiusa', tick)];
      case 'statua':
        if (colpito) return ['colpito', 0];
        if ((n.shootCd >= 68 && n.shootCd <= 76) || n.shootCd <= 2) return ['spara', n.shootCd >= 72 || n.shootCd <= 2 ? 0 : 1];
        if (n.shootCd <= 24) return ['trema', fotogramma('trema', tick)];
        return ['fermo', fotogramma('fermo', tick)];
      default: // guardia e predone: pattugliano e sparano doppiette (shootCd riparte da 68)
        if (colpito) return ['colpito', 0];
        if (n.shootCd >= 60 && n.shootCd <= 68) return ['attacco', n.shootCd >= 64 ? 0 : 1];
        if (n.shootCd <= 14) return ['anticipo', n.shootCd > 7 ? 0 : 1];
        return ['muove', fotogramma('muove', tick)];
    }
  }

  function nemico(ctx, n, tick) {
    if (n.boss) return false;
    const foglio = FOGLIO_NEMICO[n.tipo];
    if (!foglio || !pronta(foglio)) return false;
    if (!visti.has(n)) visti.set(n, { foglio, morteDa: -1 });
    const flip = I.player.x < n.x ? -1 : 1;
    const [posa, f] = posaNemico(n, tick);
    const vola = n.tipo === 'vespa_cieca' || n.tipo === 'lucciola';
    const piedi = vola ? CONFIG.piediVespa + Math.sin(tick * 0.2 + n.x * 0.05) * 1.5 : CONFIG.piediNemico;
    ctx.save();
    ctx.scale(flip, 1);
    const tinta = n.flash > 0 ? '#ffffff' : (n.champion ? CONFIG.tinta[n.champion] : null);
    const ok = disegnaFotogramma(ctx, foglio, posa, f, piedi, tinta, n.flash > 0 ? 0.55 : CONFIG.tintaAlfa);
    ctx.restore();
    return ok;
  }

  function dopoNemici(ctx, st, tick) {
    if (!st || !st.nemici) return false;
    for (const n of st.nemici) {
      if (n.hp > 0 || n.boss) continue;
      const v = visti.get(n);
      if (!v) continue;
      if (v.morteDa < 0) v.morteDa = tick;
      const posa = v.foglio === 'bomba-ferma' ? 'esplode' : 'morte';
      const p = LAYOUT[v.foglio].indice[posa];
      if (!p) continue;
      const f = fotogramma(posa, tick - v.morteDa);
      if (f >= p.n) continue;
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.globalAlpha = 1 - 0.5 * (f / p.n);
      ctx.scale(I.player.x < n.x ? -1 : 1, 1);
      disegnaFotogramma(ctx, v.foglio, posa, f, n.tipo === 'vespa_cieca' ? CONFIG.piediVespa : CONFIG.piediNemico, null, 0);
      ctx.restore();
    }
    return true;
  }

  // ---------------------------------------------------------------------------------------------
  // Boss animati multi-frame (T2): foglio marionetta coerente con i nemici comuni
  // ---------------------------------------------------------------------------------------------
  const FOGLIO_BOSS = Object.freeze({
    're-gatto': 'gatto',
    'capitano-guardia': 'capitano',
    'colosso-statua': 'custode-marmo',
    'maestro-fucina': 'spezzafili',
    'donna-luciana': 'donna-luciana',
    'regina-vespa': 'regina-vespa',
  });

  function posaBoss(b, tick) {
    const colpito = b.flash > 0;
    const morto = b.hp <= 0;
    if (morto) return ['morte', fotogramma('morte', tick)];

    switch (b.bossId) {
      case 're-gatto': {
        const isAir = ((b.airZ || 0) > 10) || (b.state === 'leap');
        const isCrouch = b.state === 'crouch' || ((b.crouchTicks || 0) > 0);
        const isMoving = Math.abs(b.vx || 0) > 0.1 || Math.abs(b.vy || 0) > 0.1;
        if (colpito) return ['anticipo', 0];
        if (isAir) return ['attacco', (b.airZ || 0) > 30 ? 0 : 1];
        if (isCrouch) return ['anticipo', fotogramma('anticipo', tick)];
        if (isMoving) return ['muove', fotogramma('muove', tick)];
        return ['fermo', fotogramma('fermo', tick)];
      }
      case 'capitano-guardia': {
        const isCharging = b.charging || b.state === 'charge';
        const isWindup = (b.chargeWindup || 0) > 0 || b.state === 'windup';
        const isMoving = Math.hypot(b.vx || 0, b.vy || 0) > 0.1;
        if (colpito) return ['anticipo', 1];
        if (isCharging) return ['carica', fotogramma('carica', tick)];
        if (isWindup) return ['anticipo', fotogramma('anticipo', tick)];
        if (isMoving) return ['muove', fotogramma('muove', tick)];
        return ['fermo', fotogramma('fermo', tick)];
      }
      case 'colosso-statua': {
        const isAperto = b.apertoCM || b.state === 'aperto';
        const isShooting = b.sparaTimer > 0 || (b.shootCd && b.shootCd <= 6);
        if (colpito) return ['colpito', fotogramma('colpito', tick)];
        if (isShooting) return ['spara', fotogramma('spara', tick)];
        if (isAperto) return ['apre', fotogramma('apre', tick)];
        return ['fermo', fotogramma('fermo', tick)];
      }
      case 'maestro-fucina': {
        const isAttacco = b.statoSF === 'carica' || b.fendente || b.state === 'slash';
        const isMira = b.statoSF === 'mira' || (b.windupTimer || 0) > 0;
        const isMoving = Math.hypot(b.vx || 0, b.vy || 0) > 0.1;
        if (colpito) return ['anticipo', 1];
        if (isAttacco) return ['attacco', fotogramma('attacco', tick)];
        if (isMira) return ['anticipo', fotogramma('anticipo', tick)];
        if (isMoving) return ['muove', fotogramma('muove', tick)];
        return ['fermo', fotogramma('fermo', tick)];
      }
      case 'donna-luciana': {
        const isEvoca = b.state === 'summon' || (b.evocaTimer || 0) > 0;
        const isAttacco = b.state === 'attack' || (b.attackTimer || 0) > 0;
        if (colpito) return ['colpito', fotogramma('colpito', tick)];
        if (isEvoca) return ['evoca', fotogramma('evoca', tick)];
        if (isAttacco) return ['attacco', fotogramma('attacco', tick)];
        return ['fermo', fotogramma('fermo', tick)];
      }
      case 'regina-vespa': {
        const isLunge = (b.state === 'lunge') || ((b.chargeTimer || 0) > 0) || Math.hypot(b.vx || 0, b.vy || 0) > 1.8;
        const isSummon = (b.state === 'summon') || ((b.evocaTimer || 0) > 0);
        if (colpito) return ['colpito', fotogramma('colpito', tick)];
        if (isLunge) return ['carica', fotogramma('carica', tick)];
        if (isSummon) return ['evoca', fotogramma('evoca', tick)];
        return ['vola', fotogramma('vola', tick)];
      }
      default:
        return ['fermo', fotogramma('fermo', tick)];
    }
  }

  function boss(ctx, b, tick) {
    const foglio = FOGLIO_BOSS[b.bossId];
    if (!foglio || !pronta(foglio)) return false;
    const [posa, f] = posaBoss(b, tick);
    const flip = I.player.x < b.x ? -1 : 1;
    const vola = b.bossId === 'regina-vespa' || b.bossId === 'donna-luciana';
    const fluttua = vola ? Math.sin(tick * 0.08) * 3 : 0;
    const piedi = (CONFIG.piediNemico || 5) + fluttua;
    const customH = b.bossId === 're-gatto' ? 52 : undefined;

    ctx.save();
    ctx.scale(flip, 1);
    const tinta = b.flash > 0 ? '#ffffff' : null;
    const ok = disegnaFotogramma(ctx, foglio, posa, f, piedi, tinta, b.flash > 0 ? 0.6 : 0, customH);

    // Se Re Gatto, disegna la corona borbonica d'oro e rubini in cima alla testa
    if (ok && b.bossId === 're-gatto') {
      ctx.fillStyle = '#f9cb40';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.2;
      const cx = 8, cy = -44;
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy); ctx.lineTo(cx - 7, cy - 10); ctx.lineTo(cx - 3, cy - 4);
      ctx.lineTo(cx, cy - 12); ctx.lineTo(cx + 3, cy - 4); ctx.lineTo(cx + 7, cy - 10); ctx.lineTo(cx + 9, cy);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(cx, cy - 4, 1.8, 0, TAU); ctx.fill();
    }
    ctx.restore();
    return ok;
  }

  // ---------------------------------------------------------------------------------------------
  // Registrazione (la sonda può essere stata ricopiata da T4; se fosse congelata la si ricopia)
  // ---------------------------------------------------------------------------------------------
  if (Object.isFrozen(window.__teatro)) {
    window.__teatro = Object.defineProperties({}, Object.getOwnPropertyDescriptors(window.__teatro));
  }
  window.__teatro.t2 = {
    personaggio, nemico, dopoNemici, boss, disegnaFotogramma, fotogramma,
    /** Per la QA: quali fogli sono caricati. */
    get caricati() { return Object.keys(immagini).filter(pronta); },
    LAYOUT, CONFIG,
  };
})();
