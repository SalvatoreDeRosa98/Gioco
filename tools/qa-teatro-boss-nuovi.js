#!/usr/bin/env node
/*
 * tools/qa-teatro-boss-nuovi.js — verifica Playwright della squadra b6 (gioco/teatro/b6-boss.js):
 * per ogni boss nuovo (Accendilumi, Cigno di Latta, Giostra delle Lucciole, Tessitrice di Pietra):
 *   ingresso nella stanza (nome, vita, frase di presentazione, tema musicale del boss), 20 s di vita in fase 1
 *   e 20 s in fase 2 col giocatore invulnerabile contando i colpi a schermo tick per tick, tutti gli stati
 *   della tabella visitati, passaggio di fase, uccisione (stanza aperta, frase di sconfitta, segno di a6,
 *   boss nel Registro a7), morte del giocatore (causa giusta nel Registro).
 * Poi la rosa: su 200 run ogni piano tira fuori tutti i boss della sua rosa, mai lo stesso due volte di fila,
 * il sacchetto avanza solo se il boss è stato incontrato, prima i boss della storia, piano 4 = Donna Luciana.
 *
 * Uso: node tools/qa-teatro-boss-nuovi.js <file html> [prefisso screenshot]
 * Screenshot <prefisso>-<boss>-1-anticipo.png, -2-attacco.png, -3-fase2.png (ognuno anche -zoom: primo piano del
 * boss), -4-sconfitta.png, -menu-segni.png.
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-boss-nuovi');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

const TICK_VITA = 1200;      // 20 s a 60 Hz
const TETTO_TOTALE = 32;     // proiettili comuni + colpi propri (lumi, lucciole, spole) mai sopra questo numero
// anticipo/attacco: stati da fotografare; soloFase2: stati di ripetizione che esistono solo sotto metà vita
const NUOVI = [
  { id: 'lampionaio', piano: 1, anticipo: 'alzaPertica', attacco: 'sferza', fase2: 'rialza', soloFase2: ['rialza', 'rilancia'] },
  { id: 'cigno-latta', piano: 2, anticipo: 'apreAli', attacco: 'beccata', fase2: 'piume', soloFase2: ['riarca'] },
  { id: 'giostra-lucciole', piano: 2, anticipo: 'accende', attacco: 'allarga', fase2: 'allarga', soloFase2: [] },
  { id: 'tessitrice-pietra', piano: 3, anticipo: 'alzaPettine', attacco: 'alzaSpole', fase2: 'ripettina', soloFase2: ['ripettina'] },
];

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });
  const fase = () => p.evaluate(() => window.__teatro.fase);
  const scatta = (nome) => p.locator('#c').screenshot({ path: foto(nome) });
  /** Primo piano del boss: ritaglio di 240×170 px di gioco attorno a lui (per giudicare il disegno). */
  const primoPiano = async (nome) => {
    const r = await p.evaluate(() => {
      const c = document.getElementById('c').getBoundingClientRect();
      const s = window.__teatro.interni.bossB6.stato;
      return { x: c.x, y: c.y, k: c.width / 640, bx: s ? s.x : 320, by: s ? s.y : 180 };
    });
    const gx = Math.max(0, Math.min(640 - 240, r.bx - 120)), gy = Math.max(0, Math.min(360 - 170, r.by - 115));
    await p.screenshot({ path: foto(nome), clip: { x: r.x + gx * r.k, y: r.y + gy * r.k, width: 240 * r.k, height: 170 * r.k } });
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
  /** Run nuova col boss imposto, fino dentro la sua stanza. */
  const versoIlBoss = (c, opz = {}) => p.evaluate(({ id, piano, invulnerabile }) => {
    const I = window.__teatro.interni; const R = I.statoRun;
    I.bossB6.forza(id);
    nuovaRun(false);
    if (piano > 1) avviaPiano(piano, false);
    R.siparioAttivo = null; R.cartiglioD = null;
    const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
    entraInStanza(st, 'S');
    R.graziaIngressoC = 0;
    I.player.invuln = invulnerabile ? 1e9 : 0;
    if (invulnerabile) { I.player.x = 150; I.player.y = 262; }
    const b = st.nemici.find((n) => n.boss);
    return { bossId: b.bossId, nome: b.nome, hp: b.hp, raggio: b.r, banner: R.banner, stanza: R.stanzaCorrente.tipo,
      tema: I.Musica ? I.Musica.temaCorrente().base : null, personaggio: R.personaggioId };
  }, { ...c, invulnerabile: opz.invulnerabile !== false });
  // Gli stati del boss si registrano NELLA PAGINA a ogni passo di logica (passoLogico avvolto), con l'indice
  // del registro. Leggerli da Node ogni 16 ms perdeva uno stato breve: a macchina carica il ciclo fa più tick
  // per fotogramma e fra due letture un «attacco» di pochi tick era già finito. `aspettaStato` accetta lo stato
  // se è comparso dopo l'ultimo stato trovato (segno), anche se intanto è già passato.
  let segnoStati = 0;
  const aspettaStato = async (stato, ms = 15000) => {
    const nuovo = await p.evaluate(() => {
      if (window.__qaStatiB6) return false;
      window.__qaStatiB6 = [];
      const base = passoLogico;
      passoLogico = function passoLogicoQaStati(...a) {
        const r = base.apply(this, a);
        const x = window.__teatro.interni.bossB6.stato; const st = x && x.stato; const L = window.__qaStatiB6;
        if (st && L[L.length - 1] !== st) L.push(st);
        return r;
      };
      return true;
    });
    if (nuovo) segnoStati = 0; // pagina nuova (ricaricata): registro vuoto
    const trova = (q) => window.__qaStatiB6.indexOf(q[0], q[1]);
    const ok = await p.waitForFunction((q) => window.__qaStatiB6.indexOf(q[0], q[1]) >= 0, [stato, segnoStati], { timeout: ms, polling: 16 }).then(() => true, () => false);
    if (ok) segnoStati = await p.evaluate(trova, [stato, segnoStati]);
    else segnoStati = await p.evaluate(() => window.__qaStatiB6.length);
    return ok;
  };
  /** Per le foto: il giocatore (invulnerabile) si mette lontano dal boss, nell'angolo opposto. */
  const allontana = () => p.evaluate(() => {
    const I = window.__teatro.interni; const s = I.bossB6.stato;
    if (!s) return;
    I.player.x = s.x < 320 ? 470 : 170;
    I.player.y = s.y < 188 ? 262 : 120;
    I.player.invuln = 1e9;
  });
  /** Fa vivere il boss `n` tick di logica contando colpi e stati (giocatore invulnerabile, fermo). */
  const vivi = (n) => p.evaluate((quanti) => {
    const I = window.__teatro.interni; const R = I.statoRun; const A = I.ARENA;
    const st = R.stanzaCorrente; const b = st.nemici.find((x) => x.boss);
    let maxProiettili = 0, maxTotale = 0, fuori = 0;
    const stati = {}; const fonti = {};
    for (let i = 0; i < quanti; i++) {
      I.player.invuln = 1e9; R.graziaIngressoC = 0;
      passoLogico();
      const s = I.bossB6.stato;
      maxProiettili = Math.max(maxProiettili, s.proiettili);
      maxTotale = Math.max(maxTotale, s.proiettili + s.colpiPropri);
      stati[s.stato] = (stati[s.stato] || 0) + 1;
      for (const pr of R.proiettiliNemici) fonti[pr.fonteA7 || '?'] = 1;
      if (b.x < A.x1 || b.x > A.x2 || b.y < A.y1 || b.y > A.y2) fuori++;
    }
    return { maxProiettili, maxTotale, stati, fonti: Object.keys(fonti), fuori, hp: b.hp, maxHp: b.maxHp, fase2: Boolean(b.fase2B6), fase: R.fase };
  }, n);

  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await p.waitForTimeout(500);
  await p.keyboard.press('Space'); // menu → hub
  await p.waitForTimeout(300);
  await entraNelTeatro();
  ok('in-gioco', (await fase()) === 'in_gioco', await fase());
  const tabelle = await p.evaluate(() => {
    const I = window.__teatro.interni;
    return { schede: I.SCHEDE_B6, stati: I.STATI_B6, tetto: I.BOSS_B6.tettoProiettili, rosa: I.ROSA_B6.perPiano, segni: I.SEGNI_A6.map((s) => s.boss) };
  });
  ok('almeno-tre-boss-nuovi', Object.keys(tabelle.schede).length >= 3, Object.keys(tabelle.schede));

  for (const c of NUOVI) {
    const S = tabelle.schede[c.id];
    const T = tabelle.stati[c.id];
    // 1. Ingresso nella stanza
    const ing = await versoIlBoss(c);
    ok(`${c.id}:ingresso`, ing.stanza === 'boss' && ing.bossId === c.id && ing.nome === S.nome, ing);
    ok(`${c.id}:vita`, ing.hp === S.hpBase + 45 * (c.piano - 1) && ing.raggio === S.raggio, { hp: ing.hp, atteso: S.hpBase + 45 * (c.piano - 1) });
    ok(`${c.id}:presentazione`, ing.banner.includes(S.presentazione) && ing.banner.includes(S.nome), ing.banner);
    ok(`${c.id}:tema-boss`, ing.tema === 'boss', ing.tema);
    ok(`${c.id}:segno-in-tabella`, tabelle.segni.includes(c.id));
    // 2. Fase 1 in tempo reale: screenshot dell'anticipo e dell'attacco
    await allontana();
    ok(`${c.id}:anticipo-visto`, await aspettaStato(c.anticipo), c.anticipo);
    await allontana();
    await p.waitForTimeout(c.id === 'giostra-lucciole' ? 250 : 380);
    await primoPiano(`${c.id}-1-anticipo-zoom`);
    await scatta(`${c.id}-1-anticipo`);
    await allontana();
    ok(`${c.id}:attacco-visto`, await aspettaStato(c.attacco), c.attacco);
    await p.waitForTimeout(c.id === 'giostra-lucciole' ? 1500 : 200);
    await scatta(`${c.id}-2-attacco`);
    await primoPiano(`${c.id}-2-attacco-zoom`);
    // 3. 20 s di vita in fase 1
    const v1 = await vivi(TICK_VITA);
    const attesi1 = Object.keys(T.stati).filter((s) => s !== 'cambiaFase' && !c.soloFase2.includes(s));
    ok(`${c.id}:f1-stati-visitati`, attesi1.every((s) => v1.stati[s] > 0), { mancano: attesi1.filter((s) => !v1.stati[s]), stati: v1.stati });
    ok(`${c.id}:f1-niente-stati-di-fase2`, !v1.stati.cambiaFase && c.soloFase2.every((s) => !v1.stati[s]) && !v1.fase2, v1.stati);
    ok(`${c.id}:f1-tetto-colpi`, v1.maxProiettili <= tabelle.tetto && v1.maxTotale <= TETTO_TOTALE, { maxProiettili: v1.maxProiettili, maxTotale: v1.maxTotale });
    ok(`${c.id}:f1-in-arena-e-illeso`, v1.fuori === 0 && v1.hp === v1.maxHp && v1.fase === 'in_gioco', { fuori: v1.fuori, hp: v1.hp });
    ok(`${c.id}:f1-fonte-dei-colpi`, v1.fonti.every((f) => f === `un colpo di ${S.nome}`), v1.fonti);
    // 4. Passaggio di fase sotto metà vita
    const cambio = await p.evaluate(() => {
      const I = window.__teatro.interni; const R = I.statoRun;
      const b = R.stanzaCorrente.nemici.find((x) => x.boss);
      b.hp = b.maxHp * 0.49;
      I.player.invuln = 1e9;
      passoLogico(); passoLogico();
      return { stato: b.statoB6, fase2: Boolean(b.fase2B6) };
    });
    ok(`${c.id}:cambio-fase`, cambio.fase2 && cambio.stato === 'cambiaFase', cambio);
    await allontana();
    ok(`${c.id}:fase2-attacco-visto`, await aspettaStato(c.fase2), c.fase2);
    await p.waitForTimeout(c.id === 'giostra-lucciole' ? 1700 : c.id === 'cigno-latta' ? 420 : 300);
    await primoPiano(`${c.id}-3-fase2-zoom`);
    await scatta(`${c.id}-3-fase2`);
    const v2 = await vivi(TICK_VITA);
    const attesi2 = Object.keys(T.stati).filter((s) => s !== 'cambiaFase');
    ok(`${c.id}:f2-stati-visitati`, attesi2.every((s) => v2.stati[s] > 0) && v2.fase2, { mancano: attesi2.filter((s) => !v2.stati[s]), stati: v2.stati });
    ok(`${c.id}:f2-tetto-colpi`, v2.maxProiettili <= tabelle.tetto && v2.maxTotale <= TETTO_TOTALE, { maxProiettili: v2.maxProiettili, maxTotale: v2.maxTotale });
    ok(`${c.id}:f2-in-arena`, v2.fuori === 0 && v2.fase === 'in_gioco', v2.fuori);
    // 5. Uccisione: la stanza si apre, frase di sconfitta, segno di a6, boss nel Registro
    const morte = await p.evaluate(() => {
      const I = window.__teatro.interni; const R = I.statoRun;
      const st = R.stanzaCorrente; const b = st.nemici.find((x) => x.boss);
      danneggiaNemico(b, 1e6, 0, 0);
      const pr = I.progressione.stato;
      return { pulita: st.pulita, uscita: st.uscitaAperta === true, banner: R.banner, segni: pr.segni[R.personaggioId] || [], battuti: pr.boss,
        registro: I.runInCorsoA7().boss.map((x) => x.nome), anime: I.bossB6.anime, tema: I.Musica ? I.Musica.temaCorrente().base : null };
    });
    ok(`${c.id}:stanza-aperta`, morte.pulita && morte.uscita, morte);
    ok(`${c.id}:frase-sconfitta`, morte.banner.includes(S.sconfitta) && /Botola aperta/.test(morte.banner), morte.banner);
    ok(`${c.id}:segno-a6`, morte.segni.includes(c.id) && morte.battuti.includes(c.id), { segni: morte.segni, battuti: morte.battuti });
    ok(`${c.id}:registro-boss-battuto`, morte.registro.includes(S.nome), morte.registro);
    ok(`${c.id}:anime-e-quiete`, morte.anime > 0 && morte.tema === 'quiete', { anime: morte.anime, tema: morte.tema });
    await p.waitForTimeout(450);
    await scatta(`${c.id}-4-sconfitta`);
    // 6. Il boss uccide il giocatore: il Registro riporta il suo nome
    await versoIlBoss(c, { invulnerabile: false });
    await p.evaluate(() => {
      const I = window.__teatro.interni; const R = I.statoRun;
      const b = R.stanzaCorrente.nemici.find((x) => x.boss);
      R.hpHalf = 1; R.viteExtra = 0; R.scudoRosaC = false; R.scudoStanzaD = 0; R.graziaIngressoC = 0;
      I.player.invuln = 0; I.player.x = b.x; I.player.y = b.y;
    });
    let vistoMorte = false;
    for (let i = 0; i < 140; i++) {
      const f = await fase();
      if (f === 'morte') vistoMorte = true;
      if (f === 'hub') break;
      await p.waitForTimeout(100);
    }
    await p.waitForTimeout(300);
    const perg = await p.evaluate(() => {
      const I = window.__teatro.interni; const reg = I.registroRun();
      return { pergamena: I.registroA7.pergamena, ultima: reg.length ? { esito: reg[reg.length - 1].esito, causa: reg[reg.length - 1].causa, stanza: reg[reg.length - 1].stanza } : null };
    });
    ok(`${c.id}:uccide-il-giocatore`, vistoMorte && (await fase()) === 'hub', await fase());
    ok(`${c.id}:causa-nel-registro`, perg.pergamena && perg.pergamena.causa === S.nome && perg.ultima && perg.ultima.causa === S.nome
      && perg.ultima.stanza && perg.ultima.stanza.boss === S.nome, perg);
    await p.keyboard.press('KeyK'); // chiude la pergamena
    await p.waitForTimeout(150);
    await entraNelTeatro();
    ok(`${c.id}:di-nuovo-in-gioco`, (await fase()) === 'in_gioco', await fase());
  }

  // 7. La rosa: 200 run, ogni piano tira fuori tutti i boss della sua rosa
  const rosa = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const B = I.bossB6;
    const bossDi = () => { const st = R.mappa.stanze.find((s) => s.tipo === 'boss'); return { st, id: st.nemici.find((n) => n.boss).bossId }; };
    B.forza(null);
    B.azzeraMemoria();
    // senza entrare nella stanza del boss il sacchetto non avanza: due run di fila danno lo stesso boss
    nuovaRun(false); const a = bossDi().id;
    nuovaRun(false); const b = bossDi().id;
    const conta = { 1: {}, 2: {}, 3: {} }; const ultimo = {}; const primi = {};
    let diFila = 0;
    for (let r = 0; r < 200; r++) {
      nuovaRun(false);
      for (let piano = 1; piano <= 3; piano++) {
        if (piano > 1) avviaPiano(piano, false);
        const x = bossDi();
        if (r === 0) primi[piano] = x.id;
        conta[piano][x.id] = (conta[piano][x.id] || 0) + 1;
        if (ultimo[piano] === x.id) diFila++;
        ultimo[piano] = x.id;
        entraInStanza(x.st, null); // incontrato: il sacchetto avanza
      }
    }
    avviaPiano(4, false);
    const finale = bossDi().id;
    avviaPiano(5, false); // secondo ciclo: di nuovo la rosa del piano 1
    const ciclo2 = bossDi().id;
    R.siparioAttivo = null;
    return { a, b, conta, diFila, primi, finale, ciclo2, battuti: I.progressione.stato.boss };
  });
  ok('rosa:senza-incontro-resta', rosa.a === rosa.b, { a: rosa.a, b: rosa.b });
  for (const piano of [1, 2, 3]) {
    const attesa = tabelle.rosa[piano];
    const usciti = Object.keys(rosa.conta[piano]);
    ok(`rosa:piano-${piano}-tutti`, attesa.length >= 2 && attesa.every((id) => rosa.conta[piano][id] > 0) && usciti.every((id) => attesa.includes(id)), rosa.conta[piano]);
    ok(`rosa:piano-${piano}-equa`, attesa.every((id) => rosa.conta[piano][id] >= Math.floor(200 / attesa.length) - 1), rosa.conta[piano]);
  }
  ok('rosa:mai-due-di-fila', rosa.diFila === 0, rosa.diFila);
  ok('rosa:prima-la-storia', rosa.primi[1] === 're-gatto' && rosa.primi[3] === 'capitano-guardia', { primi: rosa.primi, battuti: rosa.battuti });
  ok('rosa:capitano-al-piano-3', rosa.conta[3]['capitano-guardia'] > 0 && tabelle.rosa[3].includes('capitano-guardia'));
  ok('rosa:piano-4-donna-luciana', rosa.finale === 'donna-luciana', rosa.finale);
  ok('rosa:ciclo-2-rosa-del-piano-1', tabelle.rosa[1].includes(rosa.ciclo2), rosa.ciclo2);

  // 8. I segni restano dopo la ricarica e si vedono nel menu
  await p.reload();
  await p.waitForTimeout(600);
  await scatta('menu-segni');
  const segni = await p.evaluate(() => window.__teatro.interni.progressione.stato.segni);
  ok('segni-persistenti', NUOVI.every((c) => (segni.ferruccio || []).includes(c.id)), segni);

  await browser.close();
  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ file: path.relative(RADICE, file), esiti, erroriConsole: errori }, null, 1));
  console.log(falliti.length || errori.length ? `FALLITI: ${falliti.map((e) => e.caso).join(', ')}${errori.length ? ' + errori console' : ''}` : 'TUTTO OK');
  process.exitCode = falliti.length || errori.length ? 1 : 0;
})();
