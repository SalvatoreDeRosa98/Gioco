#!/usr/bin/env node
/*
 * tools/qa-teatro-acquedotto.js — verifica Playwright della squadra d6 (gioco/teatro/d6-acquedotto.js):
 * l'Acquedotto Carolino, percorso alternativo al piano 2.
 *   A. LA SCELTA: prima del boss niente grata; boss del piano 1 battuto perdendo più di una Maschera → grata
 *      chiusa col lucchetto (senza chiave [E] non passa, con la chiave si apre e poi si scende); boss battuto
 *      senza danni → grata già aperta; ai piani 2 e 3 nessuna grata; click sulla grata.
 *   B. IL LUOGO: il piano 2 è l'Acquedotto (quartiere, cartellone, nemici del luogo, canali, boss).
 *   C. L'ACQUA: nel canale il passo si accorcia e la corrente spinge giocatore, nemici a terra e raccoglibili;
 *      chi vola la ignora.
 *   D. LA RAFFICA: calma → annuncio (fiaccole e drappi) → raffica; piega i proiettili del giocatore e dei
 *      nemici, e solo durante la raffica.
 *   E. I NEMICI del luogo: ogni tipo visita tutti i suoi stati e fa ciò che promette.
 *   F. IL BOSS: Il Guardiano delle Acque (presentazione, tutti gli stati, l'acqua sale e cala, tetto dei colpi,
 *      fase 2, sconfitta, segno, dono).
 *   G. DOPO: il piano 3 è San Leucio normale. H. LA BOTOLA NORMALE: il piano 2 è la Villa Comunale di sempre.
 *   I. GENERATORE: 50 piani dell'Acquedotto validi (stanze collegate, nemici e canali in regola).
 *   L. Nessun errore in ERRORI_TEATRO né in console.
 *
 * Uso: node tools/qa-teatro-acquedotto.js <file html> [prefisso screenshot]
 * Screenshot <prefisso>-grata-chiusa.png, -grata-aperta.png, -stanza.png, -canale.png, -raffica.png,
 * -nemico-<tipo>.png, -boss-anticipo.png, -boss-piena.png, -boss-emerge.png, -boss-fase2.png, -dono.png.
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-acquedotto');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });
  const scatta = (nome) => p.locator('#c').screenshot({ path: foto(nome) });
  /** Primo piano: ritaglio di l×a px di gioco attorno al punto (gx, gy). */
  const primoPiano = async (nome, gx, gy, l = 200, a = 140) => {
    const r = await p.evaluate(() => { const c = document.getElementById('c').getBoundingClientRect(); return { x: c.x, y: c.y, k: c.width / 640 }; });
    const x0 = Math.max(0, Math.min(640 - l, gx - l / 2)), y0 = Math.max(0, Math.min(360 - a, gy - a * 0.6));
    await p.screenshot({ path: foto(nome), clip: { x: r.x + x0 * r.k, y: r.y + y0 * r.k, width: l * r.k, height: a * r.k } });
  };
  const chiudiDialoghi = async () => {
    for (let i = 0; i < 40; i++) {
      const d = await p.evaluate(() => window.__teatro.t4qa.dialogo);
      if (!d) return;
      await p.keyboard.press(d.scelta ? 'Digit1' : 'Space');
      await p.waitForTimeout(50);
    }
  };
  const entraNelTeatro = async () => {
    await chiudiDialoghi();
    const ing = await p.evaluate(() => window.__teatro.t4qa.ingresso);
    await p.evaluate((g) => { const P = window.__teatro.interni.player; P.x = g.x - 40; P.y = g.y; }, ing);
    await p.keyboard.down('KeyD'); await p.waitForTimeout(900); await p.keyboard.up('KeyD');
    await p.keyboard.press('Space');
    await p.waitForTimeout(150);
  };
  /** Run nuova, dentro la stanza del boss del piano dato; `colpi` = colpi da 1 Maschera presi prima di batterlo. */
  const battiIlBoss = (piano, colpi, chiavi) => p.evaluate(({ piano, colpi, chiavi }) => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    nuovaRun(false);
    if (piano > 1) avviaPiano(piano, false);
    R.siparioAttivo = null; R.cartiglioD = null;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
    entraInStanza(st, 'S');
    const b = st.nemici.find((n) => n.boss);
    b.stunTicks = 99999;
    P.x = 320; P.y = 270;
    const prima = I.acquedottoD6.grata;
    const hp0 = R.hpHalf;
    for (let i = 0; i < colpi; i++) {
      R.graziaIngressoC = 0; R.scudoRosaC = false; R.scudoStanzaD = 0; P.invuln = 0;
      R.proiettiliNemici.push({ x: P.x, y: P.y - 6, vx: 0, vy: 0, dist: 0, bossShot: true });
      for (let k = 0; k < 12 && R.proiettiliNemici.length; k++) passoLogico();
    }
    const persi = hp0 - R.hpHalf;
    if (chiavi !== undefined) R.chiavi = chiavi;
    P.invuln = 1e9;
    b.hp = 1;
    danneggiaNemico(b, 9999, 0, 0);
    if (!st.pulita) { st.nemici.forEach((n) => { n.hp = 0; }); verificaStanzaPulita(); } // boss corazzati o con la scorta
    P.x = 320; P.y = 270;
    return { piano: R.piano, boss: b.bossId, prima, persi, pulita: st.pulita, grata: I.acquedottoD6.grata, chiavi: R.chiavi, banner: R.banner, fase: R.fase };
  }, { piano, colpi, chiavi });
  const accantoAllaGrata = () => p.evaluate(() => {
    const I = window.__teatro.interni; const G = I.ACQUEDOTTO_D6.grata;
    I.player.x = G.x; I.player.y = G.y + 16; I.player.targetX = null; I.player.targetY = null;
  });
  const dove = () => p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    return { piano: R.piano, attivo: I.acquedottoD6.attivo(), quartiere: getQuartierePiano(R.piano).id, nome: getQuartierePiano(R.piano).nome,
      sipario: R.siparioAttivo ? R.siparioAttivo.titolo : null, atto: R.siparioAttivo ? R.siparioAttivo.atto : null,
      grata: I.acquedottoD6.grata, chiavi: R.chiavi, banner: R.banner, fase: R.fase };
  });

  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await p.waitForTimeout(500);
  await p.keyboard.press('Space'); // menu → hub
  await p.waitForTimeout(300);
  await entraNelTeatro();
  ok('in-gioco', (await p.evaluate(() => window.__teatro.fase)) === 'in_gioco');
  const T = await p.evaluate(() => {
    const I = window.__teatro.interni;
    return { A: I.ACQUEDOTTO_D6, nemici: I.NEMICI_D6, sost: I.SOSTITUZIONI_D6, scheda: I.SCHEDA_D6, boss: I.BOSS_D6, stati: I.STATI_D6, arena: I.ARENA,
      quartiere: I.QUARTIERE_D6, segni: I.SEGNI_A6.map((s) => s.boss), testi: { diario: I.TESTI_D6.diario, pergamena: I.TESTI_D6.pergamena,
        villa: (typeof DIARIO_B8 !== 'undefined' && DIARIO_B8.cammino && DIARIO_B8.cammino[I.ACQUEDOTTO_D6.pianoLuogo]) || [] } };
  });
  const campiQuartiere = await p.evaluate(() => {
    const I = window.__teatro.interni; const base = getQuartierePiano(2);
    return Object.keys(base).filter((k) => !(k in I.QUARTIERE_D6));
  });
  ok('quartiere:stessi-campi', campiQuartiere.length === 0 || campiQuartiere.every((k) => k === 'coloreMuschio'), campiQuartiere);

  // ------------------------------------------------------------------ A. LA SCELTA
  // A1. più di una Maschera persa: grata chiusa; senza chiave non si passa
  let r = await battiIlBoss(1, 2, 0);
  ok('grata:niente-prima-del-boss', r.prima === null, r.prima);
  ok('grata:compare-dopo-il-boss-del-piano-1', r.pulita && r.grata !== null && r.piano === 1, r);
  ok('grata:chiusa-se-persa-piu-di-una-maschera', r.grata && r.grata.aperta === false && r.persi > T.A.grata.mezzeGratis, { persi: r.persi, grata: r.grata });
  ok('grata:banner-la-annuncia', /GRATA DEL CONDOTTO/.test(r.banner || ''), r.banner);
  await accantoAllaGrata();
  await p.waitForTimeout(250);
  await scatta('grata-chiusa');
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(150);
  let d = await dove();
  ok('grata:senza-chiave-non-si-passa', d.piano === 1 && d.grata && d.grata.aperta === false && /chiave/.test(d.banner || ''), d);
  // A2. con la chiave: si apre (e la chiave si spende), poi si scende
  await p.evaluate(() => { window.__teatro.interni.statoRun.chiavi = 1; });
  await accantoAllaGrata();
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(700);
  d = await dove();
  ok('grata:con-la-chiave-si-apre', d.piano === 1 && d.grata && d.grata.aperta === true && d.chiavi === 0, d);
  await scatta('grata-aperta');
  await accantoAllaGrata();
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(150);
  d = await dove();
  ok('scelta:E-sulla-grata-porta-all-acquedotto', d.piano === 2 && d.attivo && d.quartiere === 'acquedotto-carolino', d);
  ok('scelta:cartellone-del-luogo', /ACQUEDOTTO CAROLINO/.test(d.sipario || '') && /ACQUEDOTTO CAROLINO/.test(d.atto || ''), { sipario: d.sipario, atto: d.atto });
  await p.waitForTimeout(400);
  await scatta('cartellone');

  // A3. boss battuto senza danni: grata già aperta, la chiave resta
  r = await battiIlBoss(1, 0, 1);
  ok('grata:gratis-senza-danni', r.grata && r.grata.aperta === true && r.grata.gratis === true && r.chiavi === 1, r);
  // A4. click sulla grata aperta: si scende
  const pt = await p.evaluate(() => {
    const c = document.getElementById('c').getBoundingClientRect(); const G = window.__teatro.interni.ACQUEDOTTO_D6.grata;
    return { x: c.x + (G.x / 640) * c.width, y: c.y + (G.y / 360) * c.height };
  });
  await p.mouse.click(pt.x, pt.y);
  await p.waitForTimeout(150);
  d = await dove();
  ok('scelta:click-sulla-grata', d.piano === 2 && d.attivo, d);
  // A5. una Maschera persa (un colpo): ancora gratis
  r = await battiIlBoss(1, 1, 0);
  ok('grata:gratis-con-una-maschera-persa', r.persi === 2 && r.grata && r.grata.aperta === true, { persi: r.persi, grata: r.grata });
  // A6. agli altri piani nessuna grata
  for (const piano of [2, 3]) {
    r = await battiIlBoss(piano, 0, 1);
    ok(`grata:non-al-piano-${piano}`, r.pulita && r.grata === null, { piano: r.piano, grata: r.grata });
  }

  // ------------------------------------------------------------------ B. IL LUOGO
  r = await battiIlBoss(1, 0, 1);
  await accantoAllaGrata();
  const luogo = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    interagisciStanza();
    R.siparioAttivo = null; R.cartiglioD = null;
    const m = R.mappa;
    const boss = m.stanze.find((s) => s.tipo === 'boss').nemici.find((n) => n.boss);
    const tipi = {};
    for (const s of m.stanze) if (s.tipo === 'normale') for (const n of s.nemici) tipi[n.tipo] = (tipi[n.tipo] || 0) + 1;
    return { piano: R.piano, q: getQuartierePiano(R.piano), tipi, conCanali: m.stanze.filter((s) => s.canaliD6 && s.tipo === 'normale').length,
      normali: m.stanze.filter((s) => s.tipo === 'normale').length, boss: boss.bossId, bossHp: boss.hp, bossNome: boss.nome,
      tema: I.Musica ? I.Musica.temaCorrente().id : null, pavimentoSuo: getFloorTileCanvas(R.piano) !== getFloorTileCanvas(3),
      registro: I.runInCorsoA7 && I.runInCorsoA7() ? I.runInCorsoA7().percorso : null };
  });
  ok('luogo:piano-2-acquedotto', luogo.piano === 2 && luogo.q.id === 'acquedotto-carolino' && luogo.q.meteo === 'vento', { piano: luogo.piano, id: luogo.q.id });
  ok('luogo:nessun-nemico-della-villa-sostituibile', Object.keys(T.sost).every((t) => !luogo.tipi[t]), luogo.tipi);
  ok('luogo:nemici-del-luogo', Object.keys(T.nemici).some((t) => luogo.tipi[t] > 0), luogo.tipi);
  ok('luogo:boss-guardiano', luogo.boss === 'guardiano-acque' && luogo.bossHp === T.scheda.hpBase + 45, { boss: luogo.boss, hp: luogo.bossHp });
  ok('luogo:pavimento-suo', luogo.pavimentoSuo);
  ok('luogo:registro-in-corso', luogo.registro === 'acquedotto', luogo.registro);
  ok('musica:tema-del-luogo', luogo.tema === 'acquedotto' || luogo.tema === 'quiete-acquedotto', luogo.tema);

  /** Entra in una stanza di combattimento del piano con un canale (orizzontale se c'è), nemici storditi negli angoli. */
  const stanzaConCanale = () => p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const A = I.ARENA;
    const st = R.mappa.stanze.find((s) => s.tipo === 'normale' && s.canaliD6 && s.canaliD6[0].dx !== 0 && s.canaliD6.length === 1)
      || R.mappa.stanze.find((s) => s.tipo === 'normale' && s.canaliD6);
    if (!st) return null;
    entraInStanza(st, 'S');
    R.graziaIngressoC = 0; I.player.invuln = 1e9;
    st.nemici.forEach((n, i) => { n.stunTicks = 99999; n.x = i % 2 ? A.x2 - 30 : A.x1 + 30; n.y = A.y2 - 20 - Math.floor(i / 2) * 26; });
    I.acquedottoD6.forzaVento('calma', 1);
    return { id: st.id, canali: I.acquedottoD6.canali, nemici: st.nemici.map((n) => n.tipo), ostacoli: (st.ostacoli || []).length };
  });
  let sc = await stanzaConCanale();
  for (let giro = 0; giro < 12 && !sc; giro++) { // mappa senza canali (raro): un'altra run
    await battiIlBoss(1, 0, 1); await accantoAllaGrata();
    await p.evaluate(() => { interagisciStanza(); window.__teatro.interni.statoRun.siparioAttivo = null; });
    sc = await stanzaConCanale();
  }
  ok('luogo:una-stanza-col-canale', Boolean(sc), sc);
  await p.waitForTimeout(500);
  await scatta('stanza');

  // ------------------------------------------------------------------ C. L'ACQUA
  const acqua = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player; const A = I.ARENA; const K = I.keys;
    const st = R.stanzaCorrente; const c = st.canaliD6[0]; const C = I.ACQUEDOTTO_D6.canali;
    st.ostacoli = []; st.suoloB7 = []; // misura pulita: niente arredi fra i piedi
    const oriz = c.dx !== 0;
    const tasto = oriz ? 'KeyD' : 'KeyS';
    const asse = (o) => (oriz ? o.x : o.y);
    const fermi = () => { for (const k of Object.keys(K)) K[k] = false; P.targetX = null; P.targetY = null; P.kbx = 0; P.kby = 0; };
    const cammina = (x, y, n, premi) => {
      fermi(); P.x = x; P.y = y; P.invuln = 1e9; R.graziaIngressoC = 0;
      ticksCongelati = 0; // nessun fermo-colpo rimasto da prima: si misurano tick pieni
      if (premi) K[tasto] = true;
      const a0 = asse(P);
      for (let i = 0; i < n; i++) passoLogico();
      fermi();
      return (asse(P) - a0) / n;
    };
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    const asciuttoX = oriz ? 200 : (c.x > 320 ? 200 : 440), asciuttoY = oriz ? 188 : 120;
    const inX = oriz ? 200 : cx, inY = oriz ? cy : 120;
    const verso = oriz ? c.dx : c.dy;
    const out = { oriz, verso, vel: R.speed };
    out.passoAsciutto = cammina(asciuttoX, asciuttoY, 12, true);
    out.passoInAcqua = cammina(inX, inY, 12, true);
    out.derivaFermo = cammina(inX, inY, 20, false);
    out.inAcqua = I.acquedottoD6.inAcqua;
    out.derivaAsciutto = cammina(asciuttoX, asciuttoY, 20, false);
    out.inAcquaFuori = I.acquedottoD6.inAcqua;
    P.volo = true; R.volo = true;
    out.passoInVolo = cammina(inX, inY, 12, true);
    out.derivaInVolo = cammina(inX, inY, 20, false);
    P.volo = false; R.volo = false;
    // nemici: uno a terra e uno che vola, storditi dentro il canale
    const modello = st.nemici[0];
    const terra = { ...modello, id: 'qa-terra', tipo: 'gatto', patternMob: 'gatto', champion: null, x: oriz ? 300 : cx, y: oriz ? cy : 200, hp: 50, maxHp: 50, stunTicks: 99999, r: 12 };
    const volo = { ...modello, id: 'qa-volo', tipo: 'vespa_cieca', patternMob: 'vespa_cieca', champion: null, x: oriz ? 380 : cx, y: oriz ? cy : 240, hp: 50, maxHp: 50, stunTicks: 99999, r: 10 };
    st.nemici.push(terra, volo);
    const moneta = { tipo: 'moneta', valore: 1, sprite: 'moneta1', x: oriz ? 440 : cx, y: oriz ? cy : 160 };
    const fuori = { tipo: 'moneta', valore: 1, sprite: 'moneta1', x: asciuttoX + 60, y: asciuttoY + (oriz ? 0 : 60) };
    st.oggettiATerra.push(moneta, fuori);
    const t0 = asse(terra), v0 = asse(volo), m0 = asse(moneta), f0 = asse(fuori);
    fermi(); P.x = asciuttoX; P.y = asciuttoY;
    for (let i = 0; i < 30; i++) passoLogico();
    out.derivaNemicoTerra = (asse(terra) - t0) / 30;
    out.derivaNemicoVolo = (asse(volo) - v0) / 30;
    out.derivaMoneta = (asse(moneta) - m0) / 30;
    out.derivaMonetaFuori = (asse(fuori) - f0) / 30;
    // la moneta si ferma al muro, dentro l'arena
    for (let i = 0; i < 2400; i++) passoLogico();
    out.monetaAlMuro = { x: moneta.x, y: moneta.y, dentro: moneta.x >= A.x1 && moneta.x <= A.x2 && moneta.y >= A.y1 && moneta.y <= A.y2 };
    st.nemici = st.nemici.filter((n) => n !== terra && n !== volo);
    st.oggettiATerra = st.oggettiATerra.filter((o) => o !== moneta && o !== fuori);
    out.C = { rallenta: C.rallenta, spinta: C.spinta, spintaNemici: C.spintaNemici, spintaOggetti: C.spintaOggetti };
    return out;
  });
  const circa = (a, b, tol = 0.03) => Math.abs(a - b) <= tol;
  ok('acqua:rallenta', acqua.passoAsciutto > 0.5 && circa(acqua.passoInAcqua, acqua.passoAsciutto * acqua.C.rallenta + acqua.verso * acqua.C.spinta, 0.05),
    { asciutto: acqua.passoAsciutto, inAcqua: acqua.passoInAcqua, atteso: acqua.passoAsciutto * acqua.C.rallenta + acqua.verso * acqua.C.spinta });
  ok('acqua:spinge-chi-sta-fermo', acqua.inAcqua && circa(acqua.derivaFermo, acqua.verso * acqua.C.spinta), acqua.derivaFermo);
  ok('acqua:fuori-dal-canale-niente', !acqua.inAcquaFuori && acqua.derivaAsciutto === 0, acqua.derivaAsciutto);
  ok('acqua:chi-vola-la-ignora', circa(acqua.passoInVolo, acqua.passoAsciutto, 0.01) && acqua.derivaInVolo === 0, { passo: acqua.passoInVolo, deriva: acqua.derivaInVolo });
  ok('acqua:spinge-i-nemici-a-terra', circa(acqua.derivaNemicoTerra, acqua.verso * acqua.C.spintaNemici), acqua.derivaNemicoTerra);
  ok('acqua:non-i-nemici-che-volano', acqua.derivaNemicoVolo === 0, acqua.derivaNemicoVolo);
  ok('acqua:porta-via-i-raccoglibili', circa(acqua.derivaMoneta, acqua.verso * acqua.C.spintaOggetti) && acqua.derivaMonetaFuori === 0, { nel: acqua.derivaMoneta, fuori: acqua.derivaMonetaFuori });
  ok('acqua:i-raccoglibili-restano-nell-arena', acqua.monetaAlMuro.dentro, acqua.monetaAlMuro);
  // foto del canale col giocatore dentro
  await p.evaluate(() => {
    const I = window.__teatro.interni; const c = I.statoRun.stanzaCorrente.canaliD6[0];
    I.player.x = c.dx !== 0 ? 300 : c.x + c.w / 2; I.player.y = c.dx !== 0 ? c.y + c.h / 2 + 4 : 180;
    ticksCongelati = 1e6;
  });
  await p.waitForTimeout(120);
  const pc = await p.evaluate(() => ({ x: window.__teatro.interni.player.x, y: window.__teatro.interni.player.y }));
  await primoPiano('canale', pc.x, pc.y, 260, 150);
  await p.evaluate(() => { ticksCongelati = 0; });

  // ------------------------------------------------------------------ D. LA RAFFICA
  const vento = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player; const V = I.ACQUEDOTTO_D6.vento;
    const st = R.stanzaCorrente;
    const tiro = (fase, dir) => {
      R.proiettili.length = 0; R.proiettiliNemici.length = 0;
      P.x = 320; P.y = 285; P.cooldown = 0; P.invuln = 1e9;
      I.acquedottoD6.forzaVento(fase, dir);
      sparaProiettiliDirezione(0, -1);
      const mio = R.proiettili[R.proiettili.length - 1];
      const suo = { x: 200, y: 100, vx: 0, vy: 1.5, dist: 0 };
      R.proiettiliNemici.push(suo);
      const x0 = mio ? mio.x : 0;
      for (let i = 0; i < 22; i++) passoLogico();
      return { mio: mio ? mio.x - x0 : null, suo: suo.x - 200, vxMio: mio ? mio.vx : null, vxSuo: suo.vx };
    };
    const out = { calma: tiro('calma', 1), destra: tiro('raffica', 1), sinistra: tiro('raffica', -1), annuncio: tiro('annuncio', 1) };
    // il ciclo naturale: calma → annuncio → raffica → calma, con le durate della tabella
    R.proiettili.length = 0; R.proiettiliNemici.length = 0;
    I.acquedottoD6.forzaVento('calma', 1, 4);
    const fasi = []; const conta = { calma: 0, annuncio: 0, raffica: 0 };
    let forzaAnnuncio = 0, forzaRaffica = 0;
    for (let i = 0; i < V.annuncioTick + V.rafficaTick + 60; i++) {
      passoLogico();
      const v = I.acquedottoD6.vento;
      if (fasi[fasi.length - 1] !== v.fase) fasi.push(v.fase);
      conta[v.fase]++;
      if (v.fase === 'annuncio') forzaAnnuncio = Math.max(forzaAnnuncio, v.forza);
      if (v.fase === 'raffica') forzaRaffica = Math.max(forzaRaffica, v.forza);
    }
    out.ciclo = { fasi, conta, forzaAnnuncio, forzaRaffica, attesa: I.acquedottoD6.vento.t, V: { a: V.annuncioTick, r: V.rafficaTick, min: V.attesaMinTick, max: V.attesaMaxTick, tetto: V.tetto } };
    // stanza ripulita: niente raffiche
    const vivi = st.nemici.map((n) => n.hp);
    st.nemici.forEach((n) => { n.hp = 0; }); st.pulita = true;
    I.acquedottoD6.forzaVento('calma', 1, 2);
    let fasePulita = 'calma';
    for (let i = 0; i < 120; i++) { passoLogico(); if (I.acquedottoD6.vento.fase !== 'calma') fasePulita = I.acquedottoD6.vento.fase; }
    st.nemici.forEach((n, i) => { n.hp = vivi[i]; }); st.pulita = false;
    out.pulita = fasePulita;
    return out;
  });
  ok('vento:in-calma-i-colpi-vanno-dritti', vento.calma.mio === 0 && vento.calma.suo === 0, vento.calma);
  ok('vento:piega-il-proiettile-del-giocatore', vento.destra.mio > 5 && vento.sinistra.mio < -5, { destra: vento.destra.mio, sinistra: vento.sinistra.mio });
  ok('vento:piega-il-proiettile-nemico', vento.destra.suo > 5 && vento.sinistra.suo < -5, { destra: vento.destra.suo, sinistra: vento.sinistra.suo });
  ok('vento:col-tetto', Math.abs(vento.destra.vxSuo) <= vento.ciclo.V.tetto + 0.05, vento.destra.vxSuo);
  ok('vento:l-annuncio-non-piega', vento.annuncio.mio === 0 && vento.annuncio.suo === 0, vento.annuncio);
  ok('vento:ciclo-calma-annuncio-raffica-calma', vento.ciclo.fasi.join('>') === 'calma>annuncio>raffica>calma'
    && vento.ciclo.conta.annuncio === vento.ciclo.V.a && vento.ciclo.conta.raffica === vento.ciclo.V.r, vento.ciclo);
  ok('vento:annuncio-visibile', vento.ciclo.forzaAnnuncio >= 0.4 && vento.ciclo.forzaRaffica >= 0.95, { annuncio: vento.ciclo.forzaAnnuncio, raffica: vento.ciclo.forzaRaffica });
  ok('vento:attesa-fra-le-raffiche', vento.ciclo.attesa >= vento.ciclo.V.min - 70 && vento.ciclo.attesa <= vento.ciclo.V.max, vento.ciclo.attesa);
  ok('vento:non-a-stanza-pulita', vento.pulita === 'calma', vento.pulita);
  // foto della raffica: drappi e fiaccole piegati, colpi che curvano
  await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    R.proiettili.length = 0; R.proiettiliNemici.length = 0;
    P.x = 300; P.y = 250; P.invuln = 1e9;
    I.acquedottoD6.forzaVento('raffica', 1);
    for (let k = 0; k < 5; k++) { P.cooldown = 0; sparaProiettiliDirezione(0, -1); for (let i = 0; i < 5; i++) passoLogico(); }
    for (let k = 0; k < 6; k++) R.proiettiliNemici.push({ x: 150 + k * 60, y: 110 + (k % 2) * 30, vx: 0.4 * (k + 1), vy: 1.2, dist: 0 });
    I.acquedottoD6.forzaVento('raffica', 1);
  });
  await p.waitForTimeout(260);
  await scatta('raffica');

  // ------------------------------------------------------------------ E. I NEMICI DEL LUOGO
  for (const tipo of Object.keys(T.nemici)) {
    const e = await p.evaluate((tipo) => {
      const I = window.__teatro.interni; const R = I.statoRun; const P = I.player; const A = I.ARENA;
      const st = R.stanzaCorrente;
      R.proiettili.length = 0; R.proiettiliNemici.length = 0; st.panniD6 = [];
      I.acquedottoD6.forzaVento('calma', 1);
      // un solo nemico del tipo, vestito dal gioco (popolaStanza), in mezzo alla stanza
      let n = null;
      for (let giro = 0; giro < 400 && !n; giro++) {
        const finta = { id: `qa${giro}`, tipo: 'normale', porte: {}, muroSegreto: null, nemici: [], ostacoli: [], oggettiATerra: [] };
        popolaStanza(finta, R.piano);
        n = finta.nemici.find((x) => x.tipo === tipo && !x.champion) || null;
      }
      if (!n) return { trovato: false };
      n.id = `qa-${tipo}`; n.x = 400; n.y = 150; n.stunTicks = 0;
      st.nemici = [n]; st.pulita = false;
      P.x = 250; P.y = 240; P.invuln = 1e9; R.graziaIngressoC = 0; R.inzuppatoD6 = 0;
      const stati = {}; let fuori = 0, maxProiettili = 0, maxPanni = 0, inversioni = 0, colpi = 0;
      const versi = () => (st.canaliD6 || []).map((c) => `${c.dx},${c.dy}`).join('|');
      let v0 = versi(); let nProiettili = 0;
      for (let i = 0; i < 1500; i++) {
        P.invuln = 1e9;
        passoLogico();
        stati[n.statoD6 || '?'] = (stati[n.statoD6 || '?'] || 0) + 1;
        if (n.x < A.x1 || n.x > A.x2 || n.y < A.y1 || n.y > A.y2) fuori++;
        maxProiettili = Math.max(maxProiettili, R.proiettiliNemici.length);
        maxPanni = Math.max(maxPanni, (st.panniD6 || []).length);
        if (R.proiettiliNemici.length > nProiettili) colpi += R.proiettiliNemici.length - nProiettili;
        nProiettili = R.proiettiliNemici.length;
        const v1 = versi(); if (v1 !== v0) { inversioni++; v0 = v1; }
      }
      return { trovato: true, nome: n.nome, hp: n.maxHp, raggio: n.r, stati, fuori, maxProiettili, maxPanni, inversioni, colpi, x: n.x, y: n.y };
    }, tipo);
    ok(`nemico:${tipo}:esiste`, e.trovato && e.hp > 0 && e.raggio > 0, e);
    if (!e.trovato) continue;
    ok(`nemico:${tipo}:resta-nell-arena`, e.fuori === 0, e.fuori);
    const attesi = { rondone_latta: ['plana', 'punta', 'picchiata', 'risale'], lavandaia_tufo: ['lava', 'alza', 'lancia'], fontaniere: ['cammina', 'gira', 'apre'] }[tipo] || [];
    ok(`nemico:${tipo}:tutti-gli-stati`, attesi.every((s) => e.stati[s] > 0), e.stati);
    if (tipo === 'lavandaia_tufo') ok('nemico:lavandaia_tufo:lancia-panni', e.maxPanni > 0, e.maxPanni);
    if (tipo === 'fontaniere') ok('nemico:fontaniere:gira-la-corrente-e-spruzza', e.inversioni > 0 && e.colpi > 0, { inversioni: e.inversioni, colpi: e.colpi });
    // foto: il nemico nella posa d'anticipo
    const posa = { rondone_latta: 'punta', lavandaia_tufo: 'alza', fontaniere: 'gira' }[tipo];
    const pos = await p.evaluate((posa) => {
      const I = window.__teatro.interni; const R = I.statoRun; const st = R.stanzaCorrente; const n = st.nemici[0];
      for (let i = 0; i < 900 && n.statoD6 !== posa; i++) { I.player.invuln = 1e9; passoLogico(); }
      for (let i = 0; i < 12; i++) passoLogico();
      ticksCongelati = 1e6; // fermo immagine: la logica si ferma, la resa no
      return { x: n.x, y: n.y, stato: n.statoD6 };
    }, posa);
    await p.waitForTimeout(160);
    await primoPiano(`nemico-${tipo}`, pos.x, pos.y, 200, 140);
    await p.evaluate(() => { ticksCongelati = 0; });
    // cade sotto i colpi veri (danneggiaNemico: macchie, crollo in pezzi di b2, premi del pubblico) senza errori
    const morte = await p.evaluate(() => {
      const I = window.__teatro.interni; const R = I.statoRun; const st = R.stanzaCorrente; const n = st.nemici[0];
      const spinta = { x: n.x, y: n.y };
      danneggiaNemico(n, 1, 1, 0);
      for (let i = 0; i < 6; i++) { ticksCongelati = 0; passoLogico(); }
      spinta.dopo = n.x - spinta.x;
      danneggiaNemico(n, n.hp + 20, 1, 0);
      for (let i = 0; i < 40; i++) { ticksCongelati = 0; passoLogico(); }
      const out = { hp: n.hp, pulita: st.pulita, spinta: spinta.dopo, registro: I.runInCorsoA7 && I.runInCorsoA7() ? I.runInCorsoA7().nemiciUccisi : null };
      st.pulita = false; // la stanza serve ancora alle prove che seguono
      return out;
    });
    await p.waitForTimeout(350);
    ok(`nemico:${tipo}:cade-senza-errori`, morte.hp <= 0 && morte.pulita && errori.length === 0, morte);
    if (tipo === 'lavandaia_tufo') ok('nemico:lavandaia_tufo:statua-che-non-si-sposta', morte.spinta === 0, morte.spinta);
  }
  if (T.nemici.lavandaia_tufo) {
    const z = await p.evaluate(() => {
      const I = window.__teatro.interni; const R = I.statoRun; const P = I.player; const K = I.keys; const st = R.stanzaCorrente;
      st.nemici.forEach((n) => { n.stunTicks = 99999; n.x = 500; n.y = 110; });
      st.ostacoli = []; st.suoloB7 = [];
      const passo = () => { ticksCongelati = 0; P.x = 200; P.y = 200; K.KeyD = true; for (let i = 0; i < 10; i++) passoLogico(); K.KeyD = false; return (P.x - 200) / 10; };
      R.proiettiliNemici.length = 0; st.panniD6 = []; R.inzuppatoD6 = 0; P.invuln = 1e9;
      const asciutto = passo();
      // un panno addosso
      P.x = 200; P.y = 200; P.invuln = 0; R.graziaIngressoC = 0; R.scudoRosaC = false; R.scudoStanzaD = 0;
      const hp0 = R.hpHalf = R.maxHpHalf;
      st.panniD6.push({ x: 200, y: 194, vx: 0, vy: 0, t: 0, rot: 0 });
      passoLogico();
      const out = { asciutto, persi: hp0 - R.hpHalf, inzuppato: R.inzuppatoD6, panni: st.panniD6.length };
      P.invuln = 1e9;
      out.bagnato = passo();
      for (let i = 0; i < I.ACQUEDOTTO_D6.inzuppato.tick + 5; i++) passoLogico();
      out.dopo = R.inzuppatoD6;
      out.asciugato = passo();
      out.rallenta = I.ACQUEDOTTO_D6.inzuppato.rallenta;
      R.hpHalf = R.maxHpHalf;
      return out;
    });
    ok('nemico:lavandaia_tufo:il-panno-colpisce-e-inzuppa', z.persi > 0 && z.inzuppato > 0 && z.panni === 0, z);
    ok('nemico:lavandaia_tufo:inzuppato-va-piano-poi-si-asciuga', circa(z.bagnato, z.asciutto * z.rallenta, 0.05) && z.dopo === 0 && circa(z.asciugato, z.asciutto, 0.01), z);
  }

  // ------------------------------------------------------------------ F. IL BOSS
  const ingressoBoss = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    ticksCongelati = 0; R.hpHalf = R.maxHpHalf; R.inzuppatoD6 = 0;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
    entraInStanza(st, 'S');
    R.graziaIngressoC = 0; P.invuln = 1e9; P.x = 150; P.y = 262;
    const b = st.nemici.find((n) => n.boss);
    return { bossId: b.bossId, nome: b.nome, hp: b.hp, raggio: b.r, banner: R.banner, canali: I.acquedottoD6.canali.length, acqua: Boolean(st.acquaD6),
      tema: I.Musica ? I.Musica.temaCorrente().base : null };
  });
  ok('boss:guardiano-nella-stanza', ingressoBoss.bossId === 'guardiano-acque' && ingressoBoss.nome === T.scheda.nome && ingressoBoss.raggio === T.scheda.raggio, ingressoBoss);
  ok('boss:presentazione', (ingressoBoss.banner || '').includes(T.scheda.presentazione), ingressoBoss.banner);
  ok('boss:tema-del-boss', ingressoBoss.tema === 'boss', ingressoBoss.tema);
  ok('boss:condotti-e-acqua', ingressoBoss.canali === 2 && ingressoBoss.acqua, ingressoBoss);
  /** Fa vivere il Guardiano `n` tick (giocatore invulnerabile al centro-basso) contando stati, colpi e acqua. */
  const vivi = (n, fino) => p.evaluate(({ quanti, fino }) => {
    const I = window.__teatro.interni; const R = I.statoRun; const A = I.ARENA; const P = I.player;
    const st = R.stanzaCorrente; const b = st.nemici.find((x) => x.boss);
    const stati = {}; const fonti = {};
    let maxProiettili = 0, fuori = 0, livMax = 0, livMin = 1, sottoIntoccabile = true, correnteAllagata = false, correnteAsciutta = true, salite = 0, prec = 0, fatti = 0;
    for (let i = 0; i < quanti; i++) {
      P.invuln = 1e9; R.graziaIngressoC = 0; P.x = 320; P.y = 250;
      passoLogico(); fatti++;
      const s = I.acquedottoD6.stato;
      stati[s.stato] = (stati[s.stato] || 0) + 1;
      maxProiettili = Math.max(maxProiettili, s.proiettili);
      for (const pr of R.proiettiliNemici) fonti[pr.fonteA7 || '?'] = 1;
      if (b.x < A.x1 || b.x > A.x2 || b.y < A.y1 || b.y > A.y2) fuori++;
      livMax = Math.max(livMax, s.livello); livMin = Math.min(livMin, s.livello);
      if (s.livello >= 0.999 && prec < 0.999) salite++;
      prec = s.livello;
      if (s.sotto && (b.airZ || 0) < 20) sottoIntoccabile = false;
      const c = I.acquedottoD6.corrente(320, 188);
      if (s.livello >= I.BOSS_D6.piena.soglia && c) correnteAllagata = true;
      if (s.livello < I.BOSS_D6.piena.soglia && c) correnteAsciutta = false;
      if (fino && s.stato === fino && (stati[fino] || 0) >= 14) break;
    }
    return { stati, fonti: Object.keys(fonti), maxProiettili, fuori, livMax, livMin, salite, sottoIntoccabile, correnteAllagata, correnteAsciutta, fatti,
      hp: b.hp, maxHp: b.maxHp, fase2: Boolean(b.fase2D6), fase: R.fase, stato: I.acquedottoD6.stato };
  }, { quanti: n, fino: fino || null });
  const fotoBoss = async (nome, stato) => {
    const v = await vivi(1500, stato);
    await p.evaluate(() => { ticksCongelati = 1e6; }); // fermo immagine
    await p.waitForTimeout(160);
    await scatta(nome);
    await primoPiano(`${nome}-zoom`, v.stato.x, v.stato.y, 240, 170);
    await p.evaluate(() => { ticksCongelati = 0; });
    return v;
  };
  await fotoBoss('boss-anticipo', 'gonfia');
  await fotoBoss('boss-piena', 'emerge');
  const f1 = await vivi(1500);
  const statiF1 = Object.keys(T.stati.stati).filter((s) => s !== 'cambiaFase' && s !== 'rigonfia');
  ok('boss:fase1-tutti-gli-stati', statiF1.every((s) => f1.stati[s] > 0) && !f1.stati.rigonfia, f1.stati);
  ok('boss:l-acqua-sale-e-cala', f1.livMax >= 0.999 && f1.livMin <= 0.001 && f1.salite >= 2, { max: f1.livMax, min: f1.livMin, salite: f1.salite });
  ok('boss:la-piena-fa-corrente-su-tutta-l-arena', f1.correnteAllagata && f1.correnteAsciutta, { allagata: f1.correnteAllagata, asciutta: f1.correnteAsciutta });
  ok('boss:sott-acqua-non-si-tocca', f1.sottoIntoccabile);
  ok('boss:tetto-dei-colpi', f1.maxProiettili > 0 && f1.maxProiettili <= T.boss.tettoProiettili, f1.maxProiettili);
  ok('boss:resta-nell-arena', f1.fuori === 0, f1.fuori);
  ok('boss:colpi-col-suo-nome', f1.fonti.length === 1 && /Guardiano delle Acque/.test(f1.fonti[0]), f1.fonti);
  ok('boss:fase1-senza-fase2', !f1.fase2 && f1.hp === f1.maxHp, { hp: f1.hp, fase2: f1.fase2 });
  // fase 2
  await p.evaluate(() => { const st = window.__teatro.interni.statoRun.stanzaCorrente; const b = st.nemici.find((x) => x.boss); b.hp = Math.floor(b.maxHp * 0.45); });
  await fotoBoss('boss-fase2', 'rigonfia');
  const f2 = await vivi(1500);
  ok('boss:fase2', f2.fase2 && f2.stati.rigonfia > 0 && f2.stati.getto > 0 && f2.stati.emerge > 0, f2.stati);
  ok('boss:fase2-tetto-e-arena', f2.maxProiettili <= T.boss.tettoProiettili && f2.fuori === 0, { max: f2.maxProiettili, fuori: f2.fuori });
  // sconfitta
  const fine = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    const st = R.stanzaCorrente; const b = st.nemici.find((x) => x.boss);
    b.sottoD6 = false; b.airZ = 0;
    P.invuln = 1e9; P.x = 320; P.y = 262;
    danneggiaNemico(b, b.hp + 50, 0, 0);
    const subito = { pulita: st.pulita, uscita: st.uscitaAperta, banner: R.banner, anime: I.acquedottoD6.anime, grata: I.acquedottoD6.grata };
    for (let i = 0; i < 140; i++) passoLogico();
    const prog = I.progressione && I.progressione.stato;
    const o = st.oggettoPiedistallo;
    return { ...subito, livello: st.acquaD6.livello, segniSlot: prog ? prog.boss || [] : null, segniFerruccio: prog && prog.segni ? prog.segni.ferruccio || [] : null,
      dono: o ? { nome: o.nome, tier: o.tier, forte: Boolean(o.forteGratis), x: o.x, y: o.y, preso: o.preso } : null, donoD6: Boolean(st.donoD6),
      registro: I.runInCorsoA7 ? I.runInCorsoA7() : null, oggetti: R.oggettiEquipaggiati.length };
  });
  ok('boss:sconfitto-stanza-aperta', fine.pulita && fine.uscita, fine);
  ok('boss:frase-di-sconfitta', (fine.banner || '').includes(T.scheda.sconfitta.slice(0, 24)), fine.banner);
  ok('boss:anime', fine.anime > 0, fine.anime);
  ok('boss:l-acqua-cala-dopo', fine.livello <= 0.001, fine.livello);
  ok('boss:nessuna-grata-qui', fine.grata === null, fine.grata);
  ok('boss:segno-in-tabella', T.segni.includes('guardiano-acque'), T.segni);
  ok('boss:segno-registrato', (fine.segniSlot || []).includes('guardiano-acque') || (fine.segniFerruccio || []).includes('guardiano-acque'), { slot: fine.segniSlot, ferruccio: fine.segniFerruccio });
  ok('dono:oggetto-forte-garantito', fine.donoD6 && fine.dono && fine.dono.forte && !fine.dono.preso && fine.dono.nome, fine.dono);
  ok('dono:lontano-da-botola-e-patto', fine.dono && Math.hypot(fine.dono.x - 320, fine.dono.y - 190) > 100 && Math.hypot(fine.dono.x - 446, fine.dono.y - 188) > 100, fine.dono);
  ok('dono:annunciato', /DONO DELL'ACQUEDOTTO/.test(fine.banner || ''), fine.banner);
  await p.evaluate(() => { const I = window.__teatro.interni; const D = I.ACQUEDOTTO_D6.dono; I.player.x = D.x + 26; I.player.y = D.y + 30; });
  await p.waitForTimeout(500);
  await scatta('dono');
  const preso = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const D = I.ACQUEDOTTO_D6.dono;
    const prima = R.oggettiEquipaggiati.length, piano = R.piano;
    I.player.x = D.x; I.player.y = D.y + 14;
    interagisciStanza();
    const st = R.stanzaCorrente;
    return { prima, dopo: R.oggettiEquipaggiati.length, piano, pianoDopo: R.piano, preso: st.oggettoPiedistallo && st.oggettoPiedistallo.preso, scambio: Boolean(R.scambioPendente) };
  });
  ok('dono:si-prende-con-E', preso.pianoDopo === preso.piano && (preso.dopo === preso.prima + 1 || preso.preso || preso.scambio), preso);

  // ------------------------------------------------------------------ G. DOPO: il piano 3 è San Leucio di sempre
  const dopo = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    P.x = 320; P.y = 262;
    interagisciStanza(); // lontano dal dono e dal Patto: la botola
    R.siparioAttivo = null;
    const m = R.mappa; const tipi = {};
    for (const s of m.stanze) if (s.tipo === 'normale') for (const n of s.nemici) tipi[n.tipo] = 1;
    const boss = m.stanze.find((s) => s.tipo === 'boss').nemici.find((n) => n.boss);
    return { piano: R.piano, attivo: I.acquedottoD6.attivo(), q: getQuartierePiano(R.piano).id, tipi: Object.keys(tipi), boss: boss.bossId, rosa3: I.ROSA_B6 ? I.ROSA_B6.perPiano[3] : null,
      canali: m.stanze.filter((s) => s.canaliD6 || s.acquaD6).length, vento: I.acquedottoD6.vento.forza, tema: I.Musica ? I.Musica.temaCorrente().id : null,
      atto: getRaccontoAtto(3, 1).atto };
  });
  const nemiciLuogo = Object.keys(T.nemici);
  ok('dopo:piano-3-san-leucio', dopo.piano === 3 && !dopo.attivo && dopo.q === 'san-leucio' && /SAN LEUCIO/.test(dopo.atto), dopo);
  ok('dopo:niente-acqua-ne-nemici-del-luogo', dopo.canali === 0 && dopo.tipi.every((t) => !nemiciLuogo.includes(t)), dopo);
  ok('dopo:boss-di-san-leucio', dopo.boss !== 'guardiano-acque' && (!dopo.rosa3 || dopo.rosa3.includes(dopo.boss)), dopo.boss);
  ok('musica:dopo-torna-san-leucio', dopo.tema === 'piano3' || dopo.tema === 'quiete-piano3', dopo.tema);

  // ------------------------------------------------------------------ H. LA BOTOLA NORMALE: tutto come prima
  r = await battiIlBoss(1, 0, 1);
  const villa = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    P.x = 320; P.y = 262;
    interagisciStanza(); // la botola: lontano dalla grata
    const sip = R.siparioAttivo ? R.siparioAttivo.titolo : null;
    R.siparioAttivo = null;
    const m = R.mappa; const tipi = {};
    for (const s of m.stanze) if (s.tipo === 'normale') for (const n of s.nemici) tipi[n.tipo] = 1;
    const boss = m.stanze.find((s) => s.tipo === 'boss').nemici.find((n) => n.boss);
    const st = m.stanze.find((s) => s.tipo === 'normale');
    entraInStanza(st, 'S');
    P.invuln = 1e9;
    const x0 = (P.x = 300), y0 = (P.y = 127);
    for (let i = 0; i < 30; i++) passoLogico();
    return { piano: R.piano, attivo: I.acquedottoD6.attivo(), q: getQuartierePiano(R.piano).id, sipario: sip, tipi: Object.keys(tipi), boss: boss.bossId,
      rosa2: I.ROSA_B6 ? I.ROSA_B6.perPiano[2] : null, canali: m.stanze.filter((s) => s.canaliD6 || s.acquaD6).length, chiavi: R.chiavi,
      deriva: Math.hypot(P.x - x0, P.y - y0), vento: I.acquedottoD6.vento.fase, tema: I.Musica ? I.Musica.temaCorrente().id : null,
      pavimento: getFloorTileCanvas(2) === getFloorTileCanvas(R.piano) };
  });
  ok('villa:piano-2-villa-comunale', villa.piano === 2 && !villa.attivo && villa.q === 'villa-comunale' && /VILLA COMUNALE/.test(villa.sipario || ''), villa);
  ok('villa:nemici-e-boss-di-sempre', villa.tipi.every((t) => !nemiciLuogo.includes(t)) && villa.boss !== 'guardiano-acque' && (!villa.rosa2 || villa.rosa2.includes(villa.boss)), { tipi: villa.tipi, boss: villa.boss });
  ok('villa:niente-acqua-ne-vento', villa.canali === 0 && villa.deriva === 0 && villa.vento === 'calma', { canali: villa.canali, deriva: villa.deriva, vento: villa.vento });
  ok('villa:la-chiave-resta', villa.chiavi === 1, villa.chiavi);
  ok('musica:alla-villa-il-tema-di-sempre', villa.tema === 'piano2' || villa.tema === 'quiete-piano2', villa.tema);

  // ------------------------------------------------------------------ I. GENERATORE: 50 piani dell'Acquedotto
  const gen = await p.evaluate(() => {
    const I = window.__teatro.interni; const A = I.ARENA; const R = I.statoRun;
    const C = I.ACQUEDOTTO_D6; const sost = Object.keys(I.SOSTITUZIONI_D6);
    const violazioni = []; const conta = { piani: 0, conCanale: 0, stanze: 0, canali: 0, tipi: {}, forme: {} };
    const ingressi = [[320, A.y1 + 18], [320, A.y2 - 18], [A.x1 + 22, 188], [A.x2 - 22, 188]];
    I.acquedottoD6.segna(2, true); I.acquedottoD6.segna(6, true);
    for (let seme = 1; seme <= 50; seme++) {
      const piano = seme % 10 === 0 ? 6 : 2; // qualcuno al secondo ciclo
      const m = I.mappaConSeme(piano, seme * 7919);
      const dove = `seme ${seme}`;
      if (!m) { violazioni.push(`${dove}: mappa nulla`); continue; }
      conta.piani++;
      const perTipo = (t) => m.stanze.filter((s) => s.tipo === t);
      for (const t of ['ingresso', 'boss', 'tesoro', 'fucina']) if (perTipo(t).length !== 1) violazioni.push(`${dove}: ${perTipo(t).length} stanze ${t}`);
      // tutte le stanze collegate (porte e muro segreto)
      const visti = new Set(); const coda = [perTipo('ingresso')[0]];
      while (coda.length) {
        const s = coda.pop(); if (!s || visti.has(s.id)) continue; visti.add(s.id);
        for (const id of Object.values(s.porte || {})) coda.push(m.perId.get(id));
        if (s.muroSegreto && s.muroSegreto.dest) coda.push(m.perId.get(s.muroSegreto.dest));
      }
      const fuoriMano = m.stanze.filter((s) => !visti.has(s.id) && s.tipo !== 'patto' && s.tipo !== 'segreta');
      if (fuoriMano.length) violazioni.push(`${dove}: stanze non collegate ${fuoriMano.map((s) => s.tipo)}`);
      const boss = perTipo('boss')[0] && perTipo('boss')[0].nemici.find((n) => n.boss);
      if (!boss || boss.bossId !== 'guardiano-acque') violazioni.push(`${dove}: boss ${boss && boss.bossId}`);
      else if (!(boss.hp > 0) || boss.hp !== boss.maxHp || !Number.isFinite(boss.speed)) violazioni.push(`${dove}: boss senza numeri`);
      if (perTipo('boss')[0] && !perTipo('boss')[0].acquaD6) violazioni.push(`${dove}: stanza del boss senza acqua`);
      let conCanale = false;
      for (const s of m.stanze) {
        conta.stanze++;
        for (const n of s.nemici || []) {
          if (!n.boss) conta.tipi[n.tipo] = (conta.tipi[n.tipo] || 0) + 1;
          if (s.tipo === 'normale' && sost.includes(n.tipo)) violazioni.push(`${dove}: ${n.tipo} della Villa in ${s.id}`);
          if (!(n.hp > 0) || n.hp !== n.maxHp || !Number.isFinite(n.hp) || !Number.isFinite(n.speed) || !(n.r > 0)) violazioni.push(`${dove}: ${n.tipo} senza numeri in ${s.id}`);
          if (n.x < A.x1 || n.x > A.x2 || n.y < A.y1 || n.y > A.y2) violazioni.push(`${dove}: ${n.tipo} fuori arena in ${s.id}`);
          if (!n.nome || /undefined|NaN/.test(n.nome)) violazioni.push(`${dove}: nome ${n.nome}`);
        }
        if (s.canaliD6 && s.tipo !== 'normale' && s.tipo !== 'boss') violazioni.push(`${dove}: canale in stanza ${s.tipo}`);
        for (const c of s.canaliD6 || []) {
          conta.canali++; if (s.tipo === 'normale') conCanale = true;
          conta.forme[c.forma] = (conta.forme[c.forma] || 0) + 1;
          if (c.x < A.x1 || c.y < A.y1 || c.x + c.w > A.x2 || c.y + c.h > A.y2 || !(c.w > 0) || !(c.h > 0)) violazioni.push(`${dove}: canale fuori arena in ${s.id}`);
          if (Math.abs(c.dx) + Math.abs(c.dy) !== 1) violazioni.push(`${dove}: corrente ${c.dx},${c.dy}`);
          if ((c.dx !== 0) !== (c.w > c.h)) violazioni.push(`${dove}: la corrente non corre lungo il canale in ${s.id}`);
          for (const [ix, iy] of ingressi) if (ix >= c.x && ix <= c.x + c.w && iy >= c.y && iy <= c.y + c.h) violazioni.push(`${dove}: canale sul punto d'ingresso in ${s.id}`);
          if (320 >= c.x - 20 && 320 <= c.x + c.w + 20 && 192 >= c.y - 20 && 192 <= c.y + c.h + 20) violazioni.push(`${dove}: canale sul piedistallo in ${s.id}`);
          for (const o of s.suoloB7 || []) {
            if (o.tipo === 'spuntoni' && o.x >= c.x && o.x <= c.x + c.w && o.y >= c.y && o.y <= c.y + c.h) violazioni.push(`${dove}: chiodi sott'acqua in ${s.id}`);
          }
        }
      }
      if (conCanale) conta.conCanale++;
      // (lo stesso seme non dà sempre la stessa mappa nemmeno alla Villa: gruppi e temi di b7/a3 non dipendono
      // solo dal seme. Qui non lo si pretende.)
    }
    I.acquedottoD6.segna(2, false); I.acquedottoD6.segna(6, false);
    const villa = I.mappaConSeme(2, 4242);
    return { violazioni: violazioni.slice(0, 20), nViolazioni: violazioni.length, conta,
      villaPulita: villa.stanze.every((s) => !s.canaliD6 && !s.acquaD6) && !villa.acquedottoD6, pianoRun: R.piano };
  });
  ok('generatore:50-piani-validi', gen.conta.piani === 50 && gen.nViolazioni === 0, { violazioni: gen.violazioni, conta: gen.conta });
  ok('generatore:canali-nella-maggior-parte-dei-piani', gen.conta.conCanale >= 45, gen.conta.conCanale);
  ok('generatore:tutti-i-nemici-del-luogo-compaiono', nemiciLuogo.every((t) => gen.conta.tipi[t] > 0), gen.conta.tipi);
  ok('generatore:senza-percorso-resta-la-villa', gen.villaPulita);

  // ------------------------------------------------------------------ M. LA MEMORIA: pergamena, Registro, Diario
  const faseOra = () => p.evaluate(() => window.__teatro.fase);
  const muori = async () => {
    for (let i = 0; i < 40 && (await faseOra()) === 'in_gioco'; i++) {
      await p.evaluate(() => {
        const I = window.__teatro.interni, R = I.statoRun;
        ticksCongelati = 0;
        R.siparioAttivo = null; R.graziaIngressoC = 0; I.player.invuln = 0; R.hpHalf = 1; R.scudoRosaC = false; R.scudoStanzaD = 0; R.viteExtra = 0;
        R.proiettiliNemici.push({ x: I.player.x, y: I.player.y - 6, vx: 0.01, vy: 0, dist: 0 });
      });
      await p.waitForTimeout(200);
    }
    for (let i = 0; i < 150 && (await faseOra()) !== 'hub'; i++) await p.waitForTimeout(100);
    await p.waitForTimeout(700);
  };
  const libera = async () => {
    for (let i = 0; i < 60; i++) {
      const s = await p.evaluate(() => ({ perg: typeof a7 === 'object' && Boolean(a7.pergamena), d: window.__teatro.t4qa.dialogo, cart: typeof b8 === 'object' && Boolean(b8.cart) }));
      if (!s.perg && !s.d && !s.cart) { await p.waitForTimeout(120); if (!(await p.evaluate(() => window.__teatro.t4qa.dialogo))) return; }
      await p.keyboard.press(s.d && s.d.scelta ? 'Digit1' : 'Space');
      await p.waitForTimeout(90);
    }
  };
  const ultimaPagina = () => p.evaluate(() => {
    const I = window.__teatro.interni;
    const pagine = I.finaliB8 && I.finaliB8.pagine ? I.finaliB8.pagine() : [];
    const reg = I.registroRun ? I.registroRun() : [];
    return { pagina: pagine.length ? pagine[pagine.length - 1] : null, nPagine: pagine.length, ultima: reg.length ? reg[reg.length - 1] : null,
      conPercorso: reg.filter((v) => v.percorso === 'acquedotto').length, senza: reg.filter((v) => v.percorso !== 'acquedotto').length };
  });
  // una notte finita all'Acquedotto
  await battiIlBoss(1, 0, 1);
  await accantoAllaGrata();
  await p.evaluate(() => { interagisciStanza(); window.__teatro.interni.statoRun.siparioAttivo = null; });
  await muori();
  const perg = await p.evaluate(() => (typeof a7 === 'object' && a7.pergamena ? { tipo: a7.pergamena.tipo, percorso: a7.pergamena.voce.percorso, piano: a7.pergamena.voce.piano } : null));
  ok('memoria:pergamena-col-percorso', perg && perg.percorso === 'acquedotto' && perg.piano === 2, perg);
  await p.waitForTimeout(300);
  await scatta('pergamena');
  await libera();
  let mem = await ultimaPagina();
  const rigaD6 = (pg) => Boolean(pg && pg.righe.some((r) => T.testi.diario.includes(r)));
  // la riga «sono arrivato alla Villa» del cammino di b8, non una riga qualsiasi che nomina la Villa
  // (le rivelazioni dei boss di h2 la nominano: «…una bambina della Villa…»)
  const rigaVilla = (pg) => Boolean(pg && pg.righe.some((r) => (T.testi.villa.length
    ? T.testi.villa.some((t) => String(t).toLowerCase() === String(r).toLowerCase())
    : /Villa/.test(r) && !/è caduto/.test(r))));
  ok('memoria:registro-delle-notti', mem.ultima && mem.ultima.percorso === 'acquedotto' && mem.senza > 0, { ultima: mem.ultima && mem.ultima.percorso, con: mem.conPercorso, senza: mem.senza });
  ok('memoria:diario-di-ferruccio', rigaD6(mem.pagina) && !rigaVilla(mem.pagina), mem.pagina);
  // una notte finita alla Villa: nessuna riga dell'Acquedotto
  await battiIlBoss(1, 0, 1);
  await p.evaluate(() => { const I = window.__teatro.interni; I.player.x = 320; I.player.y = 262; interagisciStanza(); I.statoRun.siparioAttivo = null; });
  await muori();
  const perg2 = await p.evaluate(() => (typeof a7 === 'object' && a7.pergamena ? { percorso: a7.pergamena.voce.percorso || null, piano: a7.pergamena.voce.piano } : null));
  await libera();
  mem = await ultimaPagina();
  ok('memoria:alla-villa-niente-riga', perg2 && perg2.percorso === null && perg2.piano === 2 && !rigaD6(mem.pagina), { perg2, pagina: mem.pagina });

  // ------------------------------------------------------------------ L. ERRORI
  const erroriTeatro = await p.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO.map((e) => `${e.dove}: ${e.testo}`) : []));
  ok('nessun-errore-in-ERRORI_TEATRO', erroriTeatro.length === 0, erroriTeatro);

  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ file: path.relative(RADICE, file), controlli: esiti.length, falliti, erroriConsole: errori }, null, 1));
  console.log(falliti.length || errori.length ? `FALLITI: ${falliti.map((e) => e.caso).join(', ')}${errori.length ? ' + errori console' : ''}` : `TUTTO OK (${esiti.length} controlli)`);
  process.exitCode = falliti.length || errori.length ? 1 : 0;
})();
