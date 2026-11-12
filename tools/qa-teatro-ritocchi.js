#!/usr/bin/env node
/*
 * tools/qa-teatro-ritocchi.js — verifica Playwright dei ritocchi j1 (gioco/teatro/j1-ritocchi.js):
 * fondi dell'HUD leggeri, riquadro attenuato con Ferruccio sotto e di nuovo pieno dopo, nessun cuore nei testi
 * dell'HUD e del menu dei personaggi, fila di maschere piena/mezza/vuota e mai oltre il massimo, raggio dei
 * proiettili nemici base, danno, portata e arco della Spada di Gaetano, recupero dopo il fendente.
 * Passi di logica contati, niente attese a tempo reale per le prove.
 * Uso: node tools/qa-teatro-ritocchi.js <file html> [prefisso screenshot]. Esce con 1 se un controllo fallisce.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { fermaCiclo } = require('./qa-teatro-comune.js');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const pref = process.argv[3] || path.join(require('os').tmpdir(), 'teatro-j1-qa-');
fs.mkdirSync(path.dirname(pref + 'x'), { recursive: true });
/** Posizioni di prova (coordinate logiche): sotto il riquadro della vita, centro del palco, distanze dalla spada. */
const PROVA = { sottoVita: { x: 90, y: 50 }, centro: { x: 320, y: 200 }, spadaDentro: 34, spadaFuoriOltre: 4 }; // fuori = SPADA_J1.portataArco + raggio del nemico + 4

(async () => {
  const browser = await chromium.launch();
  const esiti = [];
  const ok = (nome, cond, info) => esiti.push({ nome, ok: Boolean(cond), info });
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = []; p.on('pageerror', (e) => errori.push(String(e)));
  await p.goto('file://' + file); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);

  // Menu dei personaggi: niente cuori, maschere disegnate
  const menu = await p.evaluate(() => {
    statoRun.fase = 'menu_selezione';
    const testi = [], mas = []; const f = ctx.fillText, m = disegnaMascheraJ1;
    ctx.fillText = function (t) { testi.push(String(t)); return f.apply(this, arguments); };
    disegnaMascheraJ1 = function (x, y, r) { mas.push(r); return m.apply(this, arguments); };
    try { disegnaFrame(); } finally { ctx.fillText = f; disegnaMascheraJ1 = m; }
    return { cuori: testi.filter((t) => /[❤♥🖤]/u.test(t)), maschere: mas.length };
  });
  ok('menu personaggi: nessun cuore nei testi', menu.cuori.length === 0, JSON.stringify(menu.cuori));
  ok('menu personaggi: maschere disegnate', menu.maschere > 0, menu.maschere);
  await p.screenshot({ path: `${pref}menu-personaggi.png` });

  await p.evaluate(() => { statoRun.fase = 'in_gioco'; nuovaRun(false); statoRun.siparioAttivo = false; statoRun.bannerTimer = 0; });
  await p.waitForTimeout(300);
  await fermaCiclo(p, true);
  // stanza normale con nemici fermi (senza quadri e botole di d5)
  const prepara = () => p.evaluate(() => {
    const s = statoRun.mappa.stanze.find((x) => x.tipo === 'normale' && x.id !== statoRun.stanzaCorrente.id);
    delete s.quadriD5; delete s.botoleD5; entraInStanza(s, 'S');
    statoRun.bannerTimer = 0; statoRun.siparioAttivo = false;
    statoRun.stanzaCorrente.ostacoli = []; // colonne e bracieri fermerebbero i colpi di prova
    for (const n of statoRun.stanzaCorrente.nemici) { n.x = 60; n.y = 300; n.cooldown = 1e6; n.hp = 1e6; n.maxHp = 1e6; }
  });
  await prepara();

  // 1. HUD
  const hud = await p.evaluate((P) => {
    const st = statoRun.stanzaCorrente; const J = window.__teatro.interni.ritocchiJ1;
    player.x = P.centro.x; player.y = P.centro.y; statoRun.proiettiliNemici.length = 0;
    J.hudJ1.ultimo = {};
    const out = []; const f = ctx.fillRect;
    ctx.fillRect = function (x, y, w, h) { const m = /rgba\([^)]*,\s*([\d.]+)\)/.exec(String(ctx.fillStyle)); if (w * h >= 4000) out.push(m ? +m[1] : 1); return f.apply(this, arguments); };
    try { disegnaHUDPixelArt(st); } finally { ctx.fillRect = f; }
    const libero = J.hudJ1.alfa['6,5'];
    player.x = P.sottoVita.x; player.y = P.sottoVita.y; disegnaHUDPixelArt(st);
    const sotto = J.hudJ1.alfa['6,5'];
    player.x = P.centro.x; player.y = P.centro.y; disegnaHUDPixelArt(st);
    const subito = J.hudJ1.alfa['6,5'];
    tick += HUD_J1.tenuta + HUD_J1.rampa + 1; disegnaHUDPixelArt(st);
    const dopo = J.hudJ1.alfa['6,5'];
    return { fondi: out, libero, sotto, subito, dopo, zone: J.hudJ1.zone.length };
  }, PROVA);
  ok('HUD: fondi grandi a alfa 0,35..0,45', hud.fondi.length >= 2 && hud.fondi.every((a) => a >= 0.35 && a <= 0.45), JSON.stringify(hud.fondi));
  ok('HUD: riquadro della vita pieno senza nulla sotto', hud.libero === 1, hud.libero);
  ok('HUD: con Ferruccio sotto si attenua a ~0,3', Math.abs(hud.sotto - HUD_J1_ALFA) < 0.01, hud.sotto);
  ok('HUD: resta attenuato un attimo, poi torna pieno', hud.subito < 0.5 && hud.dopo === 1, `${hud.subito} → ${hud.dopo}`);
  const nem = await p.evaluate(() => {
    const st = statoRun.stanzaCorrente; const J = window.__teatro.interni.ritocchiJ1; J.hudJ1.ultimo = {};
    player.x = 320; player.y = 200; const n = st.nemici[0]; const x = n.x, y = n.y; n.x = W - 60; n.y = 40;
    disegnaHUDPixelArt(st); disegnaHUDPixelArt(st);
    const a = Object.entries(J.hudJ1.alfa).filter(([k]) => +k.split(',')[0] > W / 2).map(([, v]) => v);
    n.x = x; n.y = y; statoRun.proiettiliNemici.push({ x: 60, y: 30, vx: 0, vy: 0, dist: 0 }); J.hudJ1.ultimo = {};
    disegnaHUDPixelArt(st);
    const b = J.hudJ1.alfa['6,5']; statoRun.proiettiliNemici.length = 0;
    return { a, b };
  });
  ok('HUD: un nemico sotto la minimappa la attenua', nem.a.some((v) => v < 0.5), JSON.stringify(nem.a));
  ok('HUD: un proiettile nemico sotto la vita la attenua', nem.b < 0.5, nem.b);

  // 2. Maschere
  const mas = await p.evaluate(() => {
    const rec = (hp, max) => { const v = []; const m = disegnaMascheraJ1; disegnaMascheraJ1 = function (x, y, r) { v.push(r); return m.apply(this, arguments); };
      try { disegnaFilaMaschereJ1(10, 10, hp, max); } finally { disegnaMascheraJ1 = m; } return v; };
    const testi = []; const f = ctx.fillText; ctx.fillText = function (t) { testi.push(String(t)); return f.apply(this, arguments); };
    statoRun.hpHalf = 5; statoRun.maxHpHalf = 8;
    try { disegnaHUDPixelArt(statoRun.stanzaCorrente); } finally { ctx.fillText = f; }
    const J = window.__teatro.interni.ritocchiJ1;
    return { fila: rec(5, 8), oltre: rec(10, 8), cuori: testi.filter((t) => /[❤♥🖤]/u.test(t)),
      filtro: [J.senzaCuoriJ1('-½ ❤️'), J.senzaCuoriJ1('Rigenera +1 ❤️ Maschera intera!'), J.senzaCuoriJ1('❤ Lente: +1')] };
  });
  ok('maschere: 2,5 su 4 → piena, piena, mezza, vuota', JSON.stringify(mas.fila) === '[1,1,0.5,0]', JSON.stringify(mas.fila));
  ok('maschere: mai oltre il massimo (10 mezze su 8)', JSON.stringify(mas.oltre) === '[1,1,1,1]', JSON.stringify(mas.oltre));
  ok('HUD: nessun cuore nei testi', mas.cuori.length === 0, JSON.stringify(mas.cuori));
  ok('filtro dei testi: cuori → Maschera', mas.filtro[0] === '-½ Maschera' && mas.filtro[1] === 'Rigenera +1 Maschera intera!' && !/❤/u.test(mas.filtro[2]), JSON.stringify(mas.filtro));
  await p.evaluate(() => { player.x = 320; player.y = 200; window.__teatro.interni.ritocchiJ1.hudJ1.ultimo = {}; disegnaFrame(); });
  await p.screenshot({ path: `${pref}maschere.png`, clip: { x: 0, y: 0, width: 400, height: 130 } });
  await p.evaluate(() => { player.x = 90; player.y = 50; const st = statoRun.stanzaCorrente; st.nemici[0].x = W - 70; st.nemici[0].y = 70; disegnaFrame(); disegnaFrame(); });
  await p.screenshot({ path: `${pref}hud-attenuato.png` });

  // 3. Proiettili nemici
  const pr = await p.evaluate(() => {
    const prova = (d, boss) => {
      player.x = 320; player.y = 200; player.invuln = 0; statoRun.hpHalf = 6; statoRun.maxHpHalf = 6;
      statoRun.proiettiliNemici.length = 0; statoRun.proiettiliNemici.push({ x: 320 + d, y: 194, vx: 0, vy: 0, dist: 0, bossShot: boss });
      const b = subisciColpoGiocatore; let colpi = 0; subisciColpoGiocatore = function () { colpi++; }; // conta il colpo, non il danno
      try { passoLogico(); } finally { subisciColpoGiocatore = b; } return colpi > 0;
    };
    return { T: PROIETTILE_NEMICO_J1, dentro: prova(5, false), fuori: prova(7.5, false), bossFuori: prova(8, true) };
  });
  ok('proiettili base: scala 1,05 (prima 1,55), raggio 6 (prima 9)', pr.T.scalaBase === 1.05 && pr.T.raggioBase === 6, JSON.stringify(pr.T));
  ok('proiettili base: colpisce a 5, non a 7,5', pr.dentro && !pr.fuori, JSON.stringify(pr));
  ok('proiettili dei boss: raggio di prima (9)', pr.bossFuori, pr.bossFuori);
  await p.evaluate(() => {
    player.x = 200; player.y = 120; player.invuln = 1e6; statoRun.proiettiliNemici.length = 0;
    for (let k = 0; k < 4; k++) statoRun.proiettiliNemici.push({ x: 290 + k * 18, y: 200, vx: 0, vy: 0, dist: 0 });
    for (let k = 0; k < 2; k++) statoRun.proiettiliNemici.push({ x: 370 + k * 22, y: 200, vx: 0, vy: 0, dist: 0, bossShot: true });
    disegnaFrame();
  });
  await p.screenshot({ path: `${pref}proiettili.png`, clip: { x: 540, y: 350, width: 340, height: 100 } });

  // 4. Spada
  const sp = await p.evaluate((P) => {
    const ogg = CATALOGO_OGGETTI.find((o) => o.id === 'spada');
    const st = statoRun.stanzaCorrente; const n = st.nemici[0];
    const fendente = (dx, dy, ex, ey) => {
      statoRun.haSpada = true; player.x = 320; player.y = 200; player.invuln = 1e6; player.cooldown = 0; statoRun.proiettiliNemici.length = 0;
      for (const m of st.nemici) { m.x = 60; m.y = 300; }
      eseguiAttacco4Direzioni(dx, dy); const cd = player.cooldown; const hp0 = n.hp;
      for (let k = 0; k < SPADA_J1.durata; k++) { n.x = 320 + ex; n.y = 194 + ey + 6; passoLogico(); }
      return { colpito: n.hp < hp0, cd };
    };
    return {
      mod: ogg.mod, desc: ogg.statsDesc,
      dentro: fendente(1, 0, P.spadaDentro, 0), fuori: fendente(1, 0, SPADA_J1.portataArco + n.r + P.spadaFuoriOltre, 0), fuoriD: SPADA_J1.portataArco + n.r + P.spadaFuoriOltre,
      dietro: fendente(1, 0, -P.spadaDentro, 0), su: fendente(0, -1, 0, -P.spadaDentro), giuFuori: fendente(0, 1, 0, -P.spadaDentro),
      cdBase: Math.max(SPADA_J1.cooldownMin, Math.round(statoRun.cooldownMax * SPADA_J1.cooldownFrazione)),
    };
  }, PROVA);
  ok('spada: danno ×1,2 e niente danno fisso', sp.mod.dmgMult === 1.2 && !sp.mod.flatDmg, JSON.stringify(sp.mod));
  ok('spada: descrizione nuova', !/6 frame|1\.45/.test(sp.desc), sp.desc);
  ok(`spada: colpisce a ${PROVA.spadaDentro} davanti, non a ${sp.fuoriD} (portata 43 + raggio)`, sp.dentro.colpito && !sp.fuori.colpito, JSON.stringify([sp.dentro, sp.fuori]));
  ok('spada: arco orientato (dietro e dal lato opposto non colpisce, in su sì)', !sp.dietro.colpito && sp.su.colpito && !sp.giuFuori.colpito, JSON.stringify([sp.dietro, sp.su, sp.giuFuori]));
  ok('spada: recupero dopo il fendente', sp.dentro.cd === sp.cdBase + SPADA_J1_RECUPERO, `${sp.dentro.cd} vs ${sp.cdBase}+${SPADA_J1_RECUPERO}`);
  for (const [nome, dx, dy] of [['destra', 1, 0], ['sinistra', -1, 0], ['su', 0, -1], ['giu', 0, 1]]) {
    for (const t of [2, 6, 12]) {
      await p.evaluate(([dx, dy, t]) => {
        statoRun.haSpada = true; player.x = 320; player.y = 200; player.cooldown = 0; statoRun.proiettiliNemici.length = 0;
        for (const m of statoRun.stanzaCorrente.nemici) { m.x = 60; m.y = 300; }
        eseguiAttacco4Direzioni(dx, dy); player.swordAnimTick = t; disegnaFrame();
      }, [dx, dy, t]);
      await p.screenshot({ path: `${pref}spada-${nome}-${t}.png`, clip: { x: 560, y: 300, width: 160, height: 160 } });
    }
  }

  const err = await p.evaluate(() => (window.ERRORI_TEATRO || []).length);
  ok('nessun errore', errori.length === 0 && err === 0, errori.join(' | ') + ` ERRORI_TEATRO=${err}`);
  await browser.close();
  for (const e of esiti) console.log(`${e.ok ? 'OK  ' : 'FAIL'} ${e.nome}${e.ok ? '' : ' — ' + e.info}`);
  const ko = esiti.filter((e) => !e.ok).length;
  console.log(ko ? `${ko} controlli falliti` : `tutti i ${esiti.length} controlli passati`);
  process.exit(ko ? 1 : 0);
})();
/** Valori attesi letti dalle tabelle di 00-config.js (copiati qui per i messaggi; confronto con quelli del gioco). */
var HUD_J1_ALFA = 0.3, SPADA_J1_RECUPERO = 6; // eslint-disable-line no-var
