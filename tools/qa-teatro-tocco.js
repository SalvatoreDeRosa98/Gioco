#!/usr/bin/env node
/*
 * tools/qa-teatro-tocco.js — verifica Playwright della squadra c2 (gioco/teatro/c2-tocco.js): comandi a tocco.
 *
 * Emula un telefono Android (contesto con hasTouch + isMobile) in VERTICALE (416×657 a densità 3, cioè lo
 * schermo dell'autore con le barre del browser, e 412×915) e in ORIZZONTALE («Pixel 7 landscape»). Le dita
 * sono tocchi veri mandati col protocollo di Chromium (`Input.dispatchTouchEvent`), mai eventi del mouse.
 * Controlla: su PC lo strato non esiste e il mouse non lo crea; al primo dito compare; levetta di movimento
 * (direzione analogica e intensità), levetta di sparo (direzione dominante, fuoco continuo), due dita insieme,
 * AZIONE/OGGETTO, PAUSA, CONFERMA/INDIETRO/frecce nei menu, dialogo dell'hub chiuso con CONFERMA, tocco breve
 * sul palco senza «cammina fin lì», porta aperta attraversata col dito, tastiera vera che nasconde lo strato,
 * opzioni del tocco salvate, memoria del browser negata (origine content://), tetto di risoluzione e costo del
 * fotogramma con la CPU rallentata ×4.
 *
 * Uso: node tools/qa-teatro-tocco.js <file html> [prefisso screenshot]
 * Screenshot <prefisso>-01-… .png. Esce con 1 se un controllo fallisce. Chromium è preinstallato.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium, devices } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-tocco');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

const UA_ANDROID = devices['Pixel 7'].userAgent;
const TELEFONI = {
  verticale: { viewport: { width: 416, height: 657 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA_ANDROID },
  verticaleAlto: { viewport: { width: 412, height: 915 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA_ANDROID },
  orizzontale: { ...devices['Pixel 7 landscape'] },
};

const esiti = [];
const errori = [];
const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });

/** Apre il gioco in un contesto nuovo; restituisce pagina, dita (tocchi veri via CDP) e sonde. */
async function apri(browser, opzioni, prima) {
  const cx = await browser.newContext(opzioni);
  const p = await cx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  if (prima) await p.addInitScript(prima);
  await p.goto('file://' + file);
  await p.evaluate(() => { try { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); } catch (_) { /* memoria negata */ } });
  await p.reload();
  await p.waitForTimeout(600);
  const cdp = await cx.newCDPSession(p);
  const dita = new Map();
  const invia = (type) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: [...dita].map(([id, q]) => ({ x: Math.round(q.x), y: Math.round(q.y), id, radiusX: 9, radiusY: 9, force: 1 })),
  });
  const T = {
    p, cx, cdp,
    async giu(id, x, y) { dita.set(id, { x, y }); await invia('touchStart'); },
    async muovi(id, x, y, passi = 5, ms = 12) {
      const q = dita.get(id); const x0 = q.x, y0 = q.y;
      for (let i = 1; i <= passi; i++) { q.x = x0 + ((x - x0) * i) / passi; q.y = y0 + ((y - y0) * i) / passi; await invia('touchMove'); await p.waitForTimeout(ms); }
    },
    async su(id) { dita.delete(id); await invia('touchEnd'); },
    async tocca(x, y, ms = 70) { await T.giu(9, x, y); await p.waitForTimeout(ms); await T.su(9); await p.waitForTimeout(110); },
    stato: () => p.evaluate(() => window.__teatro.interni.toccoC2.stato),
    b3: () => p.evaluate(() => window.__teatro.interni.comandiB3.stato),
    rett: (nome) => p.evaluate((n) => window.__teatro.interni.toccoC2.rett(n), nome),
    async bottone(nome, ms = 70) {
      const r = await T.rett(nome);
      if (!r) return false;
      await T.tocca(r.cx, r.cy, ms);
      return true;
    },
    /** Punto dello schermo che corrisponde a (x, y) nelle coordinate 640×360 del gioco. */
    punto: (x, y) => p.evaluate(([x, y]) => { const r = document.getElementById('c').getBoundingClientRect(); return { x: r.left + (x * r.width) / 640, y: r.top + (y * r.height) / 360 }; }, [x, y]),
    async toccaGioco(x, y, ms) { const q = await T.punto(x, y); await T.tocca(q.x, q.y, ms); },
    run: () => p.evaluate(() => {
      const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
      return { fase: R.fase, pausa: Boolean(R.pausa), diario: Boolean(R.diarioD), sipario: Boolean(R.siparioAttivo), x: P.x, y: P.y, dirX: P.dirX, dirY: P.dirY,
        bersaglio: P.targetX, bombe: R.bombe, bombeAccese: (R.bombeA1 || []).length, carica: R.caricaAttivo, stanza: R.stanzaCorrente ? R.stanzaCorrente.id : null };
    }),
    tasto: (k) => p.evaluate((k) => Boolean(window.__teatro.interni.keys[k]), k),
    dialogo: () => p.evaluate(() => window.__teatro.t4qa.dialogo),
    opzioni: () => p.evaluate(() => JSON.parse(JSON.stringify(window.__teatro.interni.OPZIONI))),
    salvate: () => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('ferruccio.teatro.opzioni') || 'null'); } catch (_) { return 'negata'; } }),
    strato: () => p.evaluate(() => { const e = document.getElementById('c2-strato'); return e ? { hidden: e.hidden, figli: e.children.length } : null; }),
    palco: () => p.evaluate(() => { const r = document.getElementById('c').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight }; }),
    /** Mette Ferruccio in una stanza di combattimento con nemici, invulnerabile, al centro. */
    inScena: () => p.evaluate(() => {
      const I = window.__teatro.interni; const R = I.statoRun;
      R.pausa = false; R.fase = 'in_gioco'; I.nuovaRun(false); R.siparioAttivo = null;
      const s = R.mappa.stanze.find((x) => x.tipo === 'normale');
      I.entraInStanza(s, null);
      R.siparioAttivo = null;
      I.player.invuln = 999999; I.player.x = 320; I.player.y = 200; I.player.targetX = null; I.player.targetY = null;
      for (const n of R.stanzaCorrente.nemici) { n.x = 120 + Math.random() * 60; n.y = 100; n.hp = 9999; n.vel = 0; n.speed = 0; }
      return { stanza: s.id, nemici: R.stanzaCorrente.nemici.length };
    }),
    async chiudiDialoghi() {
      for (let i = 0; i < 40; i++) { if (!(await T.dialogo())) return true; if (!(await T.bottone('conferma'))) return false; }
      return false;
    },
  };
  return T;
}

(async () => {
  const browser = await chromium.launch();

  // ================================================================ A. SU PC NON ESISTE
  {
    const T = await apri(browser, { viewport: { width: 1280, height: 720 } });
    const { p } = T;
    let s = await T.stato();
    ok('pc-niente-strato', (await T.strato()) === null && !s.installato && !s.attivo && !s.dispositivo, s);
    ok('pc-pagina-intatta', await p.evaluate(() => !document.documentElement.className && !document.getElementById('c2-stile-base') && !document.getElementById('c2-stile-strato')));
    const palco0 = await T.palco();
    const O = await T.opzioni();
    ok('pc-opzioni-di-sempre', O.grana === true && O.ombre === true && O.toccoGrandezza === undefined && (await T.salvate()) === null, { grana: O.grana, ombre: O.ombre });
    ok('pc-risoluzione-di-sempre', s.buffer[0] === 1280 && s.tetto === null, s.buffer); // Infinity → null nel JSON
    await p.mouse.click(640, 360);
    await p.mouse.move(200, 200); await p.mouse.down(); await p.mouse.move(400, 300); await p.mouse.up();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(300);
    s = await T.stato();
    const palco1 = await T.palco();
    ok('pc-mouse-e-tastiera-non-creano-lo-strato', (await T.strato()) === null && !s.installato && s.dispositivoB3 === 'tastiera', s);
    ok('pc-palco-fermo', palco0.x === palco1.x && palco0.w === palco1.w, { palco0, palco1 });
    await T.cx.close();
  }

  // ================================================================ B. VERTICALE (lo schermo dell'autore)
  {
    const T = await apri(browser, TELEFONI.verticale);
    const { p } = T;
    let s = await T.stato();
    let palco = await T.palco();
    ok('vert-prima-del-dito-niente-strato', (await T.strato()) === null && s.dispositivo && !s.installato && !s.attivo, s);
    ok('vert-palco-in-alto-a-tutta-larghezza', palco.y <= 1 && Math.abs(palco.w - palco.vw) <= 1 && palco.h < palco.vh * 0.45, palco);
    ok('vert-avvio-leggero', s.avvioLeggero && (await T.opzioni()).grana === false && (await T.opzioni()).ombre === false && (await T.salvate()).grana === false, await T.salvate());
    ok('vert-risoluzione-col-tetto', s.buffer[0] <= 1280 && s.tetto === 2, s.buffer);

    // primo dito: un tocco in un punto vuoto del menu
    await T.toccaGioco(320, 20);
    s = await T.stato();
    ok('vert-primo-dito-crea-lo-strato', s.attivo && s.installato && (await T.strato()) && !(await T.strato()).hidden && s.dispositivoB3 === 'tocco', s);
    ok('vert-menu-conferma-e-frecce', s.contesto === 'principale' && s.visibili.includes('conferma') && s.visibili.includes('su') && !s.visibili.includes('azione') && !s.visibili.includes('indietro'), s.visibili);
    const rc = await T.rett('conferma');
    palco = await T.palco();
    ok('vert-comandi-sotto-il-palco', rc && rc.y > palco.y + palco.h && rc.y + rc.h <= palco.vh && rc.w >= 80, { rc, palco });
    await p.waitForTimeout(150);
    await p.screenshot({ path: foto('01-vert-menu') });

    // tocco diretto su un bottone disegnato nel canvas: il bottone OPZIONI del menu principale
    await T.toccaGioco(553, 319);
    s = await T.stato();
    ok('vert-tocco-diretto-apre-le-opzioni', s.contesto === 'opzioni' && s.dispositivoB3 === 'tocco' && s.visibili.includes('indietro'), s);
    await T.bottone('giu');
    ok('vert-freccia-nelle-opzioni', (await T.b3()).opzioni.riga === 'volumeMusica', (await T.b3()).opzioni);
    await T.bottone('indietro');
    ok('vert-indietro-chiude-le-opzioni', (await T.stato()).contesto === 'principale');

    // CONFERMA: inizia la commedia → hub; il dialogo dell'hub si chiude con CONFERMA
    await T.bottone('conferma');
    await p.waitForTimeout(400);
    ok('vert-conferma-avvia-hub', (await T.run()).fase === 'hub', (await T.run()).fase);
    const d0 = await T.dialogo();
    s = await T.stato();
    ok('vert-dialogo-con-conferma', Boolean(d0) && s.contesto === 'dialogo' && s.visibili.includes('conferma') && !s.visibili.includes('azione'), { dialogo: Boolean(d0), vis: s.visibili });
    await p.waitForTimeout(150);
    await p.screenshot({ path: foto('02-vert-dialogo') });
    ok('vert-dialogo-chiuso-con-conferma', await T.chiudiDialoghi());
    s = await T.stato();
    ok('vert-hub-levetta-e-azione', s.contesto === 'hub' && s.visibili.includes('azione') && s.visibili.includes('pausa') && !s.visibili.includes('oggetto') && !s.visibili.includes('conferma'), s.visibili);

    // levetta di movimento nell'hub
    const riposo = await T.rett('movimento');
    let r0 = await T.run();
    await T.giu(1, riposo.cx, riposo.cy);
    await T.muovi(1, riposo.cx + 44, riposo.cy);
    await p.waitForTimeout(450);
    const tenutoD = await T.tasto('KeyD');
    await T.su(1);
    await p.waitForTimeout(120);
    let r1 = await T.run();
    ok('vert-hub-levetta-muove', r1.x > r0.x + 10 && tenutoD && !(await T.tasto('KeyD')), { da: r0.x, a: r1.x, tenutoD });

    // ---------------------------------------------------------- in scena
    await T.inScena();
    await p.waitForTimeout(300);
    s = await T.stato();
    ok('vert-scena-comandi', s.contesto === 'gioco' && ['azione', 'oggetto', 'consuma', 'pausa', 'diario'].every((n) => s.visibili.includes(n)), s);
    const zone = { m: await T.rett('movimento'), f: await T.rett('sparo'), az: await T.rett('azione'), og: await T.rett('oggetto'), co: await T.rett('consuma'), pa: await T.rett('pausa') };
    palco = await T.palco();
    const sotto = (r) => r && r.y >= palco.y + palco.h && r.y + r.h <= palco.vh + 1 && r.x >= -1 && r.x + r.w <= palco.vw + 1;
    ok('vert-niente-sopra-il-palco', Object.values(zone).every(sotto), zone);
    ok('vert-movimento-a-sinistra-sparo-a-destra', zone.m.cx < palco.vw / 2 && zone.f.cx > palco.vw / 2 && zone.az.cx > palco.vw / 2);
    await p.waitForTimeout(200);
    await p.screenshot({ path: foto('03-vert-scena') });

    // levetta di movimento: destra, poi su
    r0 = await T.run();
    await T.giu(1, zone.m.cx, zone.m.cy);
    await T.muovi(1, zone.m.cx + 46, zone.m.cy);
    await p.waitForTimeout(350);
    r1 = await T.run();
    ok('vert-levetta-destra', r1.x > r0.x + 12 && Math.abs(r1.y - r0.y) < 4, { da: [r0.x, r0.y], a: [r1.x, r1.y] });
    await T.muovi(1, zone.m.cx + 2, zone.m.cy - 60, 6);
    await p.waitForTimeout(350);
    const r2 = await T.run();
    ok('vert-levetta-su', r2.y < r1.y - 10, { da: r1.y, a: r2.y });
    await T.su(1);
    await p.waitForTimeout(120);
    const fermo0 = await T.run(); await p.waitForTimeout(200); const fermo1 = await T.run();
    ok('vert-levetta-rilasciata-fermo', fermo0.x === fermo1.x && fermo0.y === fermo1.y && (await T.b3()).tenuti.length === 0, (await T.b3()).tenuti);

    // analogica: a 30° sotto l'orizzontale il burattino va a 30°, non a 0° né a 45°
    await p.evaluate(() => { const P = window.__teatro.interni.player; P.x = 300; P.y = 180; });
    r0 = await T.run();
    await T.giu(1, zone.m.cx, zone.m.cy);
    await T.muovi(1, zone.m.cx + 40, zone.m.cy + 23, 6);
    await p.waitForTimeout(500);
    r1 = await T.run();
    await T.su(1);
    const ang = (Math.atan2(r1.y - r0.y, r1.x - r0.x) * 180) / Math.PI;
    ok('vert-levetta-analogica-30-gradi', ang > 20 && ang < 40 && r1.x > r0.x + 15, { ang, dx: r1.x - r0.x, dy: r1.y - r0.y });
    // intensità: levetta appena spinta = passo più lento
    await p.waitForTimeout(150);
    await p.evaluate(() => { const P = window.__teatro.interni.player; P.x = 200; P.y = 250; });
    const raggio = zone.m.w / 2;
    await T.giu(1, zone.m.cx, zone.m.cy);
    await T.muovi(1, zone.m.cx + raggio * 0.42, zone.m.cy, 4);
    await p.waitForTimeout(100);
    const piano0 = await T.run(); const tA = Date.now(); await p.waitForTimeout(400); const piano1 = await T.run(); const dtA = Date.now() - tA;
    const forzaPiano = (await T.stato()).leve.forza;
    await T.muovi(1, zone.m.cx + raggio * 1.0, zone.m.cy, 4);
    await p.waitForTimeout(100);
    const forte0 = await T.run(); const tB = Date.now(); await p.waitForTimeout(400); const forte1 = await T.run(); const dtB = Date.now() - tB;
    await T.su(1);
    const vPiano = (piano1.x - piano0.x) / dtA, vForte = (forte1.x - forte0.x) / dtB;
    ok('vert-levetta-intensita', forzaPiano > 0.3 && forzaPiano < 0.75 && vPiano > 0 && vPiano < vForte * 0.8, { forzaPiano, vPiano, vForte });

    // levetta di sparo: su, fuoco continuo; poi a destra (direzione dominante)
    await p.evaluate(() => {
      const I = window.__teatro.interni; I.player.x = 320; I.player.y = 220;
      window.__colpi = new Set();
      window.__contaColpi = setInterval(() => { for (const q of I.statoRun.proiettili || []) window.__colpi.add(q); }, 8);
    });
    await T.giu(2, zone.f.cx, zone.f.cy);
    await T.muovi(2, zone.f.cx + 6, zone.f.cy - 44);
    await p.waitForTimeout(250);
    const su1 = { tasto: await T.tasto('ArrowUp'), run: await T.run(), colpi: await p.evaluate(() => window.__colpi.size) };
    await p.waitForTimeout(1300);
    const colpiDopo = await p.evaluate(() => window.__colpi.size);
    ok('vert-sparo-su', su1.tasto && su1.run.dirY === -1 && su1.run.dirX === 0 && su1.colpi >= 1, su1);
    ok('vert-sparo-continua-tenendo-premuto', colpiDopo >= su1.colpi + 2 && (await T.tasto('ArrowUp')), { prima: su1.colpi, dopo: colpiDopo });
    ok('vert-anello-mostra-la-direzione', await p.evaluate(() => document.querySelector('.c2-leva-sparo').dataset.dir === 'su'));
    await T.muovi(2, zone.f.cx + 50, zone.f.cy - 12, 6);
    await p.waitForTimeout(200);
    r1 = await T.run();
    ok('vert-sparo-destra-dominante', (await T.tasto('ArrowRight')) && !(await T.tasto('ArrowUp')) && r1.dirX === 1 && r1.dirY === 0, r1);

    // due dita insieme: l'altra mano muove a sinistra mentre si spara a destra
    r0 = await T.run();
    await T.giu(1, zone.m.cx, zone.m.cy);
    await T.muovi(1, zone.m.cx - 46, zone.m.cy);
    await p.waitForTimeout(400);
    r1 = await T.run();
    const insieme = { a: await T.tasto('KeyA'), freccia: await T.tasto('ArrowRight') };
    ok('vert-due-dita-muovi-e-spara', insieme.a && insieme.freccia && r1.x < r0.x - 12 && r1.dirX === 1, { insieme, da: r0.x, a: r1.x });
    // … più un bottone col terzo dito: AZIONE posa la bomba
    const bombe0 = (await T.run()).bombe;
    await T.giu(3, zone.az.cx, zone.az.cy); await p.waitForTimeout(80); await T.su(3);
    await p.waitForTimeout(200);
    r1 = await T.run();
    ok('vert-terzo-dito-azione-posa-la-bomba', r1.bombe === bombe0 - 1 && r1.bombeAccese >= 1 && (await T.tasto('KeyA')) && (await T.tasto('ArrowRight')), { bombe0, dopo: r1.bombe, accese: r1.bombeAccese });
    await T.su(1); await T.su(2);
    await p.waitForTimeout(150);
    ok('vert-dita-alzate-tutto-fermo', (await T.b3()).tenuti.length === 0 && !(await T.tasto('ArrowRight')), (await T.b3()).tenuti);
    await p.evaluate(() => { clearInterval(window.__contaColpi); window.__teatro.interni.statoRun.bombeA1 = []; });

    // OGGETTO: usa l'attivo carico
    const car0 = await p.evaluate(() => { const R = window.__teatro.interni.statoRun; R.caricaAttivo = R.oggettoAttivo ? (R.oggettoAttivo.maxCarica || 3) : 0; return { c: R.caricaAttivo, nome: R.oggettoAttivo && R.oggettoAttivo.nome }; });
    await p.waitForTimeout(120);
    const pronto = await p.evaluate(() => document.querySelector('#c2-strato .c2-oggetto').classList.contains('c2-pronto'));
    await T.bottone('oggetto');
    r1 = await T.run();
    ok('vert-oggetto-usa-l-attivo', car0.c > 0 && pronto && r1.carica === 0, { car0, dopo: r1.carica, pronto });

    // tocco breve sul palco: niente «cammina fin lì e spara»
    await p.evaluate(() => { const I = window.__teatro.interni; I.player.x = 320; I.player.y = 200; I.player.targetX = null; I.player.targetY = null; window.__colpi = new Set(); for (const q of I.statoRun.proiettili || []) window.__colpi.add(q); window.__colpiPrima = I.statoRun.proiettili.length; });
    r0 = await T.run();
    await T.toccaGioco(180, 250);
    await p.waitForTimeout(250);
    r1 = await T.run();
    ok('vert-tocco-sul-palco-non-cammina', r1.bersaglio === null && Math.abs(r1.x - r0.x) < 1 && Math.abs(r1.y - r0.y) < 1, { r0: [r0.x, r0.y], r1: [r1.x, r1.y], bersaglio: r1.bersaglio });
    // tocco tenuto fermo (levetta nella zona morta): nemmeno
    const q0 = await T.punto(200, 240);
    await T.giu(1, q0.x, q0.y); await p.waitForTimeout(500); await T.su(1); await p.waitForTimeout(150);
    r1 = await T.run();
    ok('vert-dito-fermo-non-cammina', r1.bersaglio === null && Math.abs(r1.x - r0.x) < 1, { x: r1.x, bersaglio: r1.bersaglio });

    // porta aperta: un tocco breve la attraversa ancora
    const porta = await p.evaluate(() => {
      const I = window.__teatro.interni; const st = I.statoRun.stanzaCorrente;
      st.nemici.length = 0; st.pulita = true;
      const dove = { N: [320, 66], S: [320, 310], W: [62, 188], E: [578, 188] };
      const lato = Object.keys(st.porte)[0];
      return { lato, x: dove[lato][0], y: dove[lato][1], da: st.id, verso: st.porte[lato] };
    });
    await T.toccaGioco(porta.x, porta.y);
    await p.waitForTimeout(300);
    r1 = await T.run();
    ok('vert-tocco-sulla-porta-la-attraversa', r1.stanza === porta.verso && r1.stanza !== porta.da, { porta, ora: r1.stanza });
    await p.evaluate(() => { const R = window.__teatro.interni.statoRun; R.siparioAttivo = null; });

    // PAUSA, frecce, INDIETRO, CONFERMA
    await T.inScena();
    await p.waitForTimeout(200);
    await T.bottone('pausa');
    s = await T.stato();
    ok('vert-pausa-apre-il-menu', (await T.run()).pausa && s.contesto === 'pausa' && s.visibili.includes('conferma') && s.visibili.includes('indietro') && s.visibili.includes('giu') && !s.visibili.includes('azione'), s);
    await T.bottone('giu');
    ok('vert-freccia-muove-il-cursore', (await T.b3()).cursorePausa === 1, (await T.b3()).cursorePausa);
    await p.waitForTimeout(150);
    await p.screenshot({ path: foto('04-vert-pausa') });
    await T.bottone('su');
    await T.bottone('conferma'); // «Riprendi»
    ok('vert-conferma-riprende', !(await T.run()).pausa && (await T.stato()).contesto === 'gioco');
    await T.bottone('pausa');
    await T.bottone('indietro');
    ok('vert-indietro-riprende', !(await T.run()).pausa);
    // DIARIO dalla scena, PAGINA e INDIETRO
    await T.bottone('diario');
    s = await T.stato();
    ok('vert-diario-dalla-scena', (await T.run()).diario && s.contesto === 'diario' && s.visibili.includes('pagina'), s);
    await T.bottone('indietro');
    await p.waitForTimeout(120);
    ok('vert-indietro-chiude-il-diario', !(await T.run()).diario && !(await T.run()).pausa, await T.run());

    // ---------------------------------------------------------- OPZIONI DEL TOCCO
    await T.bottone('pausa');
    await T.toccaGioco(320, 305); // «OPZIONI E COMANDI» nel menu di pausa, toccato direttamente
    ok('vert-opzioni-dalla-pausa', (await T.stato()).contesto === 'opzioni', (await T.stato()).contesto);
    for (let i = 0; i < 20 && (await T.b3()).opzioni.riga !== 'vaiTasti'; i++) await T.bottone('giu', 50);
    await T.bottone('conferma');
    let o = (await T.b3()).opzioni;
    ok('vert-pagina-comandi-a-tocco', o.pagina === 'tocco' && o.riga === 'toccoGrandezza', o);
    const az0 = await T.rett('conferma');
    await T.bottone('destra');
    await p.waitForTimeout(150);
    const az1 = await T.rett('conferma');
    ok('vert-grandezza-grandi-salvata', (await T.opzioni()).toccoGrandezza === 'grandi' && (await T.salvate()).toccoGrandezza === 'grandi' && az1.w > az0.w + 6, { prima: az0.w, dopo: az1.w });
    await p.screenshot({ path: foto('05-vert-opzioni-tocco') });
    await T.bottone('sinistra');
    await p.waitForTimeout(120);
    await T.bottone('giu'); // opacità
    await T.bottone('sinistra'); await T.bottone('sinistra');
    await p.waitForTimeout(120);
    const op = await p.evaluate(() => getComputedStyle(document.getElementById('c2-strato')).opacity);
    ok('vert-opacita-salvata', Math.abs((await T.salvate()).toccoOpacita - 0.5) < 1e-6 && Math.abs(Number(op) - 0.5) < 0.01, { op, salvata: (await T.salvate()).toccoOpacita });
    await T.bottone('giu'); // mano
    const cx0 = (await T.rett('conferma')).cx;
    await T.bottone('conferma');
    await p.waitForTimeout(150);
    const cx1 = (await T.rett('conferma')).cx;
    ok('vert-mano-scambiata-e-salvata', (await T.salvate()).toccoMancino === true && cx0 > 208 && cx1 < 208, { cx0, cx1 });
    await T.bottone('conferma');
    await p.waitForTimeout(120);
    await T.bottone('giu'); // vibrazione
    await p.evaluate(() => { window.__vibra = []; navigator.vibrate = (x) => { window.__vibra.push(x); return true; }; });
    await T.bottone('conferma');
    ok('vert-vibrazione-spenta-e-salvata', (await T.salvate()).toccoVibrazione === false, (await T.salvate()).toccoVibrazione);
    await T.bottone('conferma');
    await T.bottone('su'); await T.bottone('giu');
    const vib = await p.evaluate(() => window.__vibra.slice());
    ok('vert-vibrazione-al-tocco', (await T.salvate()).toccoVibrazione === true && vib.length >= 2 && vib[0] === 8, vib);
    // una riga toccata direttamente col dito cambia valore
    const yRiga = 8 + 50 + 15 * 0 + 7;
    await T.toccaGioco(400, yRiga);
    ok('vert-riga-toccata-col-dito', (await T.opzioni()).toccoGrandezza === 'grandi', (await T.opzioni()).toccoGrandezza);
    await p.evaluate(() => { const I = window.__teatro.interni; I.OPZIONI.toccoGrandezza = 'medi'; I.OPZIONI.toccoOpacita = 0.7; I.salvaOpzioni(); });
    await T.bottone('indietro'); await T.bottone('indietro');
    ok('vert-opzioni-chiuse', (await T.stato()).contesto === 'pausa', (await T.stato()).contesto);
    await T.bottone('indietro');

    // le scritte dei comandi nominano i bottoni a schermo
    const scritte = await p.evaluate(() => { const C = window.__teatro.interni.comandiB3; return [C.adattaTesto('[E] Prendi'), C.adattaTesto('[Click/E] Compra'), C.adattaTesto('[Q] Usa'), C.adattaTesto('▷ Spazio / E'), C.simbolo('pausa')]; });
    ok('vert-scritte-dei-bottoni-a-schermo', scritte[0] === '[AZIONE] Prendi' && scritte[1] === '[AZIONE] Compra' && scritte[2] === '[OGGETTO] Usa' && scritte[3] === '▷ CONFERMA' && scritte[4] === 'PAUSA' && !scritte.join(' ').includes('Ⓐ'), scritte);

    // ---------------------------------------------------------- TASTIERA VERA: lo strato si nasconde
    await p.keyboard.press('KeyW');
    await p.waitForTimeout(150);
    s = await T.stato();
    ok('vert-tastiera-vera-nasconde-lo-strato', !s.attivo && (await T.strato()).hidden && s.dispositivoB3 === 'tastiera' && s.motivo === 'tastiera', s);
    r0 = await T.run();
    await p.keyboard.down('KeyD'); await p.waitForTimeout(300); await p.keyboard.up('KeyD');
    r1 = await T.run();
    ok('vert-tastiera-vera-gioca', r1.x > r0.x + 10, { da: r0.x, a: r1.x });
    await T.toccaGioco(320, 200);
    s = await T.stato();
    ok('vert-un-dito-lo-riporta', s.attivo && !(await T.strato()).hidden && s.dispositivoB3 === 'tocco', s);

    // ricarica: le opzioni del tocco restano, le impostazioni leggere non si ripropongono
    await p.evaluate(() => { const I = window.__teatro.interni; I.OPZIONI.grana = true; I.OPZIONI.toccoMancino = true; I.salvaOpzioni(); });
    await p.reload();
    await p.waitForTimeout(600);
    s = await T.stato();
    const Or = await T.opzioni();
    ok('vert-ricarica-rispetta-le-opzioni', !s.avvioLeggero && Or.grana === true && Or.toccoMancino === true && Or.ombre === false, { grana: Or.grana, mancino: Or.toccoMancino, avvioLeggero: s.avvioLeggero });
    await T.cx.close();
  }

  // ================================================================ C. VERTICALE ALTO (412×915): solo disposizione
  {
    const T = await apri(browser, TELEFONI.verticaleAlto);
    const { p } = T;
    await T.toccaGioco(320, 20);
    await T.inScena();
    await p.waitForTimeout(300);
    const palco = await T.palco();
    const nomi = ['movimento', 'sparo', 'azione', 'oggetto', 'consuma', 'pausa', 'diario'];
    const rr = {};
    for (const n of nomi) rr[n] = await T.rett(n);
    ok('alto-comandi-sotto-il-palco-e-a-portata', nomi.every((n) => rr[n] && rr[n].y >= palco.y + palco.h && rr[n].y + rr[n].h <= palco.vh + 1) && rr.azione.cy > palco.vh - 330, { azioneDalFondo: palco.vh - rr.azione.cy, palco });
    await p.screenshot({ path: foto('06-vert-alto-scena') });
    await T.cx.close();
  }

  // ================================================================ D. ORIZZONTALE («Pixel 7 landscape»)
  {
    const T = await apri(browser, TELEFONI.orizzontale);
    const { p } = T;
    let s = await T.stato();
    ok('oriz-tetto-di-risoluzione', s.buffer[0] === 1280 && s.buffer[1] === 720 && s.tetto === 2, s.buffer);
    await T.toccaGioco(320, 20);
    await p.waitForTimeout(150);
    await p.screenshot({ path: foto('07-oriz-menu') });
    s = await T.stato();
    ok('oriz-strato-al-primo-dito', s.attivo && !s.verticale && s.visibili.includes('conferma'), s);
    await T.inScena();
    await p.waitForTimeout(300);
    const palco = await T.palco();
    const nomi = ['azione', 'oggetto', 'consuma', 'pausa', 'diario'];
    const rr = {};
    for (const n of nomi) rr[n] = await T.rett(n);
    const fuori = (r) => r && (r.x + r.w <= palco.x + 1 || r.x >= palco.x + palco.w - 1) && r.y >= 0 && r.y + r.h <= palco.vh + 1;
    ok('oriz-bottoni-nelle-gronde-fuori-dal-palco', nomi.every((n) => fuori(rr[n])), { rr, palco });
    const m = await T.rett('movimento'), f = await T.rett('sparo');
    let r0 = await T.run();
    await T.giu(1, m.cx, m.cy); await T.muovi(1, m.cx + 46, m.cy);
    await T.giu(2, f.cx, f.cy); await T.muovi(2, f.cx, f.cy + 46);
    await p.waitForTimeout(400);
    let r1 = await T.run();
    ok('oriz-due-dita-muovi-e-spara', r1.x > r0.x + 12 && (await T.tasto('ArrowDown')) && r1.dirY === 1, { da: r0.x, a: r1.x, dirY: r1.dirY });
    await p.screenshot({ path: foto('08-oriz-scena') });
    await T.su(1); await T.su(2);
    await T.bottone('pausa');
    await p.waitForTimeout(150);
    ok('oriz-pausa', (await T.run()).pausa && (await T.stato()).visibili.includes('conferma'));
    await p.screenshot({ path: foto('09-oriz-pausa') });
    await T.bottone('indietro');
    ok('oriz-indietro-riprende', !(await T.run()).pausa);

    // ------------------------------------------------------ costo del fotogramma con la CPU rallentata ×4
    await T.cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const misura = (ms = 2500) => p.evaluate((ms) => new Promise((fine) => {
      const base = window.loop; let somma = 0, n = 0; const t0 = performance.now();
      window.loop = function (t) { const a = performance.now(); const r = base(t); somma += performance.now() - a; n++; return r; };
      setTimeout(() => { window.loop = base; fine({ msFotogramma: Math.round((somma / Math.max(1, n)) * 10) / 10, fps: Math.round((n * 1000) / (performance.now() - t0)) }); }, ms);
    }), ms);
    const scena = async (opz, tetto) => {
      await p.evaluate(([opz, tetto]) => { const I = window.__teatro.interni; Object.assign(I.OPZIONI, opz); I.toccoC2.tetto(tetto); }, [opz, tetto]);
      await T.inScena();
      await p.waitForTimeout(700);
      const buffer = (await T.stato()).buffer;
      return { buffer: buffer.join('×'), ...(await misura()) };
    };
    const tutto = { grana: true, ombre: true, vignetta: true, pubblico: true };
    const costi = {
      'senza tetto (1920×1080), tutti gli effetti': await scena(tutto, false),
      'tetto 1280×720, tutti gli effetti': await scena(tutto, true),
      'tetto, grana spenta': await scena({ ...tutto, grana: false }, true),
      'tetto, ombre lunghe spente': await scena({ ...tutto, ombre: false }, true),
      'tetto, grana e ombre spente (avvio leggero)': await scena({ ...tutto, grana: false, ombre: false }, true),
      'tetto, anche pubblico e vignetta spenti': await scena({ grana: false, ombre: false, vignetta: false, pubblico: false }, true),
    };
    await T.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const prima = costi['senza tetto (1920×1080), tutti gli effetti'], dopo = costi['tetto, grana e ombre spente (avvio leggero)'];
    ok('costo-del-fotogramma-scende', dopo.msFotogramma < prima.msFotogramma * 0.9 && costi['tetto 1280×720, tutti gli effetti'].buffer === '1280×720' && prima.buffer === '1920×1080', { prima, dopo });
    console.log('COSTO DEL FOTOGRAMMA (CPU ×4, Pixel 7 orizzontale, stanza con nemici):');
    for (const [nome, c] of Object.entries(costi)) console.log(`  ${nome.padEnd(46)} ${c.buffer.padEnd(10)} ${String(c.msFotogramma).padStart(6)} ms  ${c.fps} fps`);
    await T.cx.close();
  }

  // ================================================================ E. MEMORIA DEL BROWSER NEGATA (content://)
  {
    const T = await apri(browser, TELEFONI.verticale, () => {
      const nega = () => { throw new DOMException('The operation is insecure.', 'SecurityError'); };
      try { Object.defineProperty(window, 'localStorage', { configurable: true, get: nega }); } catch (_) { /* già definita */ }
      // niente schermo intero, niente Wake Lock, niente vibrazione: come nel visualizzatore dei file
      try { Object.defineProperty(navigator, 'wakeLock', { configurable: true, get: () => undefined }); } catch (_) { /* assente */ }
      try { Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined }); } catch (_) { /* assente */ }
      try { Object.defineProperty(Document.prototype, 'fullscreenEnabled', { configurable: true, get: () => false }); } catch (_) { /* assente */ }
    });
    const { p } = T;
    const prima = errori.length;
    await T.toccaGioco(320, 20);
    let s = await T.stato();
    ok('negata-il-gioco-parte-e-lo-strato-compare', s.attivo && s.contesto === 'principale' && s.avvioLeggero && !s.visibili.includes('schermo'), s);
    await T.bottone('conferma');
    await p.waitForTimeout(400);
    await T.chiudiDialoghi();
    await T.inScena();
    await p.waitForTimeout(200);
    const m = await T.rett('movimento');
    const r0 = await T.run();
    await T.giu(1, m.cx, m.cy); await T.muovi(1, m.cx + 46, m.cy); await p.waitForTimeout(350); await T.su(1);
    const r1 = await T.run();
    await T.bottone('azione');
    await T.bottone('pausa');
    ok('negata-si-gioca', r1.x > r0.x + 10 && (await T.run()).pausa, { da: r0.x, a: r1.x });
    ok('negata-nessun-errore', errori.length === prima, errori.slice(prima, prima + 5));
    await T.cx.close();
  }

  ok('nessun-errore-in-console', errori.length === 0, errori.slice(0, 5));
  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ file: path.relative(RADICE, file), controlli: esiti.length, falliti: falliti.length, dettaglio: falliti }, null, 1));
  if (falliti.length) { console.log(JSON.stringify(esiti.filter((e) => e.ok).map((e) => e.caso))); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
