#!/usr/bin/env node
/*
 * tools/qa-teatro-pubblico.js — verifica Playwright del «palcoscenico vivo, parte 1» (gioco/teatro/b1-pubblico.js):
 * sipario di velluto (chiusura animata, testi sul cartiglio senza la cucitura in mezzo, apertura con un tasto e
 * da codice con gestoSiparioB1), pubblico nei palchetti (gradimento, sussulto a ½ Maschera, mormorio e fischi,
 * applauso, ovazione, interiezioni mai sovrapposte, platea che lascia libero il dock), premi lanciati (monete,
 * bombe, chiavi e forzieri di A1, consumabili di A2, cura del campione cremisi, uccisioni col raggio del patto:
 * in volo non si raccolgono, a terra sì), economia del piano 1 nel bersaglio 5-8, suoni e costo del disegno.
 * Uso: node tools/qa-teatro-pubblico.js <file html> [cartella/prefisso screenshot]
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const pref = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-pubblico-');
const foto = (n) => (pref.endsWith('/') ? path.join(pref, `pubblico-${n}.png`) : `${pref}${n}.png`);
if (pref.endsWith('/')) fs.mkdirSync(pref, { recursive: true });

/** Limiti dei controlli (i valori di gioco stanno nelle tabelle di b1-pubblico.js). */
const LIMITI = Object.freeze({
  aperturaMaxMs: 1250,           // «entro 1,2 s» più un frame di tolleranza
  chiusuraMs: Object.freeze([250, 1100]),
  costoFermoMs: 2,               // costo in più per frame col pubblico acceso, a pubblico calmo
  costoReazioneMs: 3,            // idem durante un'ovazione (tutti in movimento)
  moneteP1: Object.freeze([5, 8]),
  pianiEconomia: 200,
  giriVoci: 40,
});

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (nome, cond, info) => esiti.push({ nome, ok: Boolean(cond), info });
  const stato = () => p.evaluate(() => { const S = window.__teatro.interni.pubblicoB1.sipario; return { stato: S.stato, k: S.k, attivo: !!statoRun.siparioAttivo }; });
  const aspettaSipario = (quale) => p.waitForFunction((q) => window.__teatro.interni.pubblicoB1.sipario.stato === q, quale, { timeout: 4000 });
  const aspettaAtterraggio = () => p.waitForFunction(() => window.__teatro.interni.pubblicoB1.stato.voli.length === 0, null, { timeout: 5000 });

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  // (b9) il controllo della cucitura legge i pixel del canvas: da file:// le immagini di scena dell'autore lo
  // «sporcherebbero» (come i fogli sprite), quindi fino a quel controllo si disegna tutto a codice.
  const immaginiDiScena = (accese) => p.evaluate((si) => { const B = window.__teatro.interni.immaginiB9; if (B) B.senzaRisorse(!si); }, accese);
  await immaginiDiScena(false);

  // -------------------------------------------------------------------------
  // SIPARIO
  // -------------------------------------------------------------------------
  // chiusura animata all'avvio del piano: k scende da 1 a 0 senza salti all'indietro
  const chiusura = await p.evaluate(() => new Promise((fine) => {
    const I = window.__teatro.interni; const S = I.pubblicoB1.sipario;
    I.statoRun.fase = 'in_gioco'; nuovaRun(false);
    const t0 = performance.now(); const camp = [];
    const giro = () => {
      camp.push([Math.round(performance.now() - t0), +S.k.toFixed(3), S.stato]);
      if ((S.stato === 'chiuso' && camp.length > 2) || performance.now() - t0 > 3000) fine({ camp, attivo: !!statoRun.siparioAttivo });
      else requestAnimationFrame(giro);
    };
    requestAnimationFrame(giro);
  }));
  {
    const c = chiusura.camp, ks = c.map((x) => x[1]);
    const monotona = ks.every((k, i) => i === 0 || k <= ks[i - 1] + 1e-9);
    const aMeta = ks.filter((k) => k > 0.1 && k < 0.9).length;
    const durata = c[c.length - 1][0];
    ok('chiusura animata: il telo scende da aperto a chiuso senza salti', chiusura.attivo && c[0][2] === 'chiusura' && monotona && aMeta >= 3
      && c[c.length - 1][2] === 'chiuso' && durata >= LIMITI.chiusuraMs[0] && durata <= LIMITI.chiusuraMs[1],
    { durata, campioni: c.length, aMeta, primo: c[0], ultimo: c[c.length - 1] });
  }
  const chiuso = await stato();
  await p.screenshot({ path: foto('sipario-chiuso') });
  ok('sipario chiuso col cartellone attivo', chiuso.stato === 'chiuso' && chiuso.k === 0 && chiuso.attivo, chiuso);

  // la cucitura d'oro al centro c'è sopra e sotto il riquadro dei testi, non dentro (righe scelte fra le righe di testo)
  const cucitura = await p.evaluate(() => {
    const c = document.getElementById('c'); const s = c.width / 640;
    const R = (window.__teatro.interni.SIPARIO_B1 || {}).riquadro || { x: 78, y: 62, w: 484, h: 104 };
    let g;
    try { g = c.getContext('2d'); g.getImageData(0, 0, 1, 1); } catch (e) { return { leggibile: false, errore: String(e) }; }
    // luce massima (rosso + verde) in una striscia larga 3 px logici centrata su lx
    const luce = (lx, ly) => {
      const d = g.getImageData(Math.round((lx - 1.5) * s), Math.round(ly * s), Math.max(1, Math.round(3 * s)), 1).data;
      let m = 0;
      for (let i = 0; i < d.length; i += 4) m = Math.max(m, d[i] + d[i + 1]);
      return m;
    };
    // la cucitura si vede se sulle sue due colonne c'è molta più luce che subito ai lati
    const stacco = (ly) => Math.max(luce(316.6, ly), luce(323.4, ly)) - Math.max(luce(306, ly), luce(334, ly));
    const dentro = [R.y + 5, R.y + 25, R.y + 46, R.y + 82, R.y + R.h - 6].map(stacco);
    const fuori = [R.y - 14, R.y + R.h + 16, 302].map(stacco);
    return { leggibile: true, dentro, fuori, soglia: 60 };
  });
  ok('la cucitura d\'oro non attraversa il riquadro dei testi (e resta sopra e sotto)',
    cucitura.leggibile && cucitura.dentro.every((x) => x < cucitura.soglia) && cucitura.fuori.filter((x) => x > cucitura.soglia).length >= 2, cucitura);
  await immaginiDiScena(true); // (b9) da qui in poi il teatro è quello vero, con le immagini dell'autore

  // un tasto chiude il cartellone e il sipario si apre
  const t0 = Date.now();
  await p.keyboard.press('Space');
  await p.waitForTimeout(380);
  const meta = await stato();
  ok('un tasto chiude il cartellone e il sipario si apre', meta.stato === 'apertura' && !meta.attivo && meta.k > 0.1 && meta.k < 0.95, meta);
  await aspettaSipario('aperto');
  const durataApertura = Date.now() - t0;
  ok('apertura entro 1,2 s', durataApertura <= LIMITI.aperturaMaxMs, { durataApertura });

  // da codice (gamepad): chi chiude il cartellone chiama prima gestoSiparioB1(); senza gesto il sipario sparisce subito
  await p.evaluate(() => { avviaPiano(1, true); });
  await aspettaSipario('chiuso');
  await p.evaluate(() => { statoRun.siparioAttivo = null; });
  await p.waitForTimeout(120);
  const senzaGesto = await stato();
  await p.evaluate(() => { avviaPiano(1, true); });
  await p.evaluate(() => { window.__teatro.interni.pubblicoB1.fermaSipario(0.5, true); });
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('sipario-chiusura') }); // a metà chiusura, con la scena di prima dietro
  await p.evaluate(() => { window.__teatro.interni.pubblicoB1.fermaSipario(null); });
  await aspettaSipario('chiuso');
  await p.evaluate(() => { window.__teatro.interni.gestoSiparioB1(); statoRun.siparioAttivo = null; });
  await p.waitForTimeout(250);
  const conGesto = await stato();
  await p.evaluate(() => { window.__teatro.interni.pubblicoB1.fermaSipario(0.5); });
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('sipario-apertura') });
  await p.evaluate(() => { window.__teatro.interni.pubblicoB1.fermaSipario(null); });
  await aspettaSipario('aperto');
  ok('gestoSiparioB1() da codice anima l\'apertura; senza gesto il sipario sparisce subito',
    senzaGesto.stato === 'aperto' && senzaGesto.k === 1 && conGesto.stato === 'apertura' && conGesto.k > 0.05 && conGesto.k < 0.95, { senzaGesto, conGesto });

  // -------------------------------------------------------------------------
  // STANZA CON PUBBLICO E PREMI LANCIATI
  // -------------------------------------------------------------------------
  /** Piano nuovo, una stanza normale coi nemici fermi, Ferruccio intoccabile, gradimento fisso a 0,5. */
  const stanzaNuova = (piano) => p.evaluate((piano) => {
    const I = window.__teatro.interni; const R = I.statoRun;
    I.pubblicoB1.imposta(0.5, true);
    avviaPiano(piano, false); R.siparioAttivo = null;
    const s = R.mappa.stanze.find((x) => x.tipo === 'normale' && x.nemici.length >= 2) || R.mappa.stanze.find((x) => x.tipo === 'normale' && x.nemici.length);
    entraInStanza(s, null); R.graziaIngressoC = 0; I.player.invuln = 1e9; R.scudoRosaC = false; R.scudoStanzaD = 0;
    for (const n of s.nemici) { n.stunTicks = 1e9; n.speed = 0; n.shootCd = 1e9; n.airZ = 0; n.maskOpen = true; }
    s.oggettiATerra.length = 0; R.proiettiliNemici = []; R.hpHalf = 6; R.maxHpHalf = 6;
    I.player.x = 120; I.player.y = 280;
    const P = I.pubblicoB1.stato; P.colpi.length = 0; P.colpiStanza = 0; P.umore.t = 0; P.umore.priorita = 0;
    return { n: s.nemici.length, ost: s.ostacoli.length };
  }, piano);
  /** Abbatte tutti i nemici vivi della stanza (con rng() fisso se dato: decide quale drop esce alla pulizia). */
  const abbattiTutti = (rngFisso) => p.evaluate((rngFisso) => {
    const s = statoRun.stanzaCorrente; const vero = rng;
    if (rngFisso != null) rng = () => rngFisso;
    try { for (const n of s.nemici.slice()) if (n.hp > 0) { n.airZ = 0; n.maskOpen = true; danneggiaNemico(n, 1e9, 0, 0); } } finally { rng = vero; }
    return s.pulita;
  }, rngFisso == null ? null : rngFisso);

  await stanzaNuova(2);
  await p.waitForTimeout(400);
  await p.screenshot({ path: foto('stanza') });

  // lancio di monete: nemico coi soldi abbattuto; in volo non si raccolgono
  const lancio = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const s = R.stanzaCorrente;
    R.monete = 0; I.player.x = 200; I.player.y = 250;
    const vittima = s.nemici[0]; vittima.mobSoldi = true; vittima.x = 330; vittima.y = 200;
    danneggiaNemico(vittima, 9999, 0, 0);
    for (let k = 0; k < 5; k++) spawnaMonetaATerra(s, 260 + k * 30, 170 + (k % 2) * 40, k === 2 ? 3 : 1);
    s.oggettiATerra.push({ tipo: 'cura', valore: 1, sprite: 'mezzaMaschera', x: 400, y: 230 });
    I.lanciaPremioB1(s, s.oggettiATerra[s.oggettiATerra.length - 1], 2);
    const v = s.oggettiATerra.filter((o) => o.voloB1);
    if (v[0]) { I.player.x = v[0].voloB1.tx; I.player.y = v[0].voloB1.ty; }
    return { aTerra: s.oggettiATerra.length, inVolo: v.length, parcheggiati: v.every((o) => o.x === I.pubblicoB1.PARCHEGGIO) };
  });
  await p.waitForTimeout(220);
  const inVolo = await p.evaluate(() => ({ monete: statoRun.monete, voli: window.__teatro.interni.pubblicoB1.stato.voli.length }));
  await p.screenshot({ path: foto('lancio') });
  await aspettaAtterraggio();
  await p.waitForTimeout(250);
  const dopo = await p.evaluate(() => {
    const I = window.__teatro.interni; const s = I.statoRun.stanzaCorrente; const A = I.ARENA;
    return { monete: I.statoRun.monete, voli: I.pubblicoB1.stato.voli.length,
      fuori: s.oggettiATerra.filter((o) => o.x < A.x1 || o.x > A.x2 || o.y < A.y1 || o.y > A.y2 || I.pubblicoB1.occupato(s, o.x, o.y)).length };
  });
  ok('i drop partono in volo e restano nella lista', lancio.inVolo >= 6 && lancio.parcheggiati, lancio);
  ok('in volo non si raccolgono, a terra sì', inVolo.monete === 0 && inVolo.voli > 0 && dopo.monete > 0 && dopo.voli === 0, { inVolo, dopo });
  ok('atterrati dentro l\'arena e fuori da buchi e ostacoli', dopo.fuori === 0, dopo);
  const posti = await p.evaluate(() => {
    const I = window.__teatro.interni; const A = I.ARENA; const s = I.statoRun.stanzaCorrente; let male = 0;
    s.ostacoli.push({ tipo: 'fossa', x: 320, y: 165, r: 16, w: 34, h: 22 }, { tipo: 'colonna', x: 360, y: 214, r: 14, w: 26, h: 26 });
    for (let k = 0; k < 600; k++) {
      const q = I.postoLiberoB1(s, k % 7 === 0 ? 320 : -50 + ((k * 97) % 740), k % 5 === 0 ? 165 : -20 + ((k * 53) % 400));
      if (q.x < A.x1 + 20 || q.x > A.x2 - 20 || q.y < A.y1 + 20 || q.y > A.y2 - 20 || I.pubblicoB1.occupato(s, q.x, q.y)) male++;
    }
    s.ostacoli.length -= 2;
    return { male };
  });
  ok('postoLibero: 600 punti, mai fuori arena né dentro un ostacolo', posti.male === 0, posti);

  // mezza Maschera: sussulto e pubblico sporto
  const mezza = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.pubblicoB1;
    P.imposta(0.5, false); P.stato.colpi.length = 0; P.stato.umore.t = 0; P.stato.umore.priorita = 0; P.stato.ultimoSussulto = -1e9;
    const c0 = P.stato.conti.sussulto || 0;
    R.hpHalf = 2; R.maxHpHalf = 6; I.player.invuln = 0; R.graziaIngressoC = 0; R.scudoRosaC = false; R.scudoStanzaD = 0;
    I.player.x = 320; I.player.y = 230;
    subisciColpoGiocatore(1, 'un Gatto d\'Ombra', 300, 230);
    I.player.invuln = 1e9;
    return { hp: R.hpHalf, sussulto: (P.stato.conti.sussulto || 0) - c0, g: P.stato.gradimento };
  });
  await p.waitForTimeout(900);
  const tens = await p.evaluate(() => window.__teatro.interni.pubblicoB1.stato.tensione);
  await p.screenshot({ path: foto('mezza-maschera') });
  ok('a ½ Maschera: sussulto, tensione alta, gradimento giù', mezza.hp === 1 && mezza.sussulto === 1 && tens > 0.8 && mezza.g < 0.5, { mezza, tens });

  // colpi ripetuti: mormorio poi fischi (gradimento FISSO sopra la soglia dei fischi facili, colpi recenti azzerati)
  const colpi = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.pubblicoB1;
    R.hpHalf = 6; R.maxHpHalf = 6; R.graziaIngressoC = 0; R.scudoRosaC = false; R.scudoStanzaD = 0;
    P.imposta(0.6, true); P.stato.colpi.length = 0; P.stato.ultimaRisata = -1e9;
    const c0 = { ...P.stato.conti }; const umori = [];
    for (let k = 0; k < 3; k++) {
      P.stato.umore.t = 0; P.stato.umore.priorita = 0; P.stato.umore.nome = 'calmo';
      I.player.invuln = 0; subisciColpoGiocatore(1, 'un Gatto d\'Ombra', 300, 230);
      umori.push(P.stato.umore.nome);
    }
    I.player.invuln = 1e9; R.hpHalf = 6; P.stato.colpi.length = 0;
    const r = { umori, mormorio: (P.stato.conti.mormorio || 0) - (c0.mormorio || 0), fischi: (P.stato.conti.fischi || 0) - (c0.fischi || 0), g: P.stato.gradimento };
    P.imposta(0.5, true);
    return r;
  });
  ok('colpi ripetuti: mormorio al secondo, fischi al terzo',
    colpi.mormorio === 1 && colpi.fischi === 1 && colpi.umori.join() === 'calmo,mormorio,fischi' && colpi.g === 0.6, colpi);

  // stanza ripulita senza danni: applauso pieno e fiori
  const pulita = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.pubblicoB1; const s = R.stanzaCorrente;
    P.imposta(0.5, false);
    P.stato.colpiStanza = 0; P.stato.umore.t = 0; P.stato.umore.priorita = 0; const g0 = P.stato.gradimento; const c0 = P.stato.conti.applausoPieno || 0;
    for (const n of s.nemici.slice()) if (n.hp > 0) danneggiaNemico(n, 1e9, 0, 0);
    return { pulita: s.pulita, applausoPieno: (P.stato.conti.applausoPieno || 0) - c0, fiori: P.stato.fiori.length, su: P.stato.gradimento > g0 };
  });
  await p.waitForTimeout(700);
  await p.screenshot({ path: foto('applauso') });
  ok('stanza senza danni: applauso pieno, fiori, gradimento su', pulita.pulita && pulita.applausoPieno === 1 && pulita.fiori > 0 && pulita.su, pulita);

  // boss abbattuto: ovazione
  const boss = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    const s = R.mappa.stanze.find((x) => x.tipo === 'boss');
    entraInStanza(s, null); R.graziaIngressoC = 0; I.player.invuln = 1e9; I.player.x = 250; I.player.y = 250;
    return { n: s.nemici.length, ovazione: I.pubblicoB1.stato.conti.ovazione || 0 };
  });
  await p.waitForTimeout(200);
  await p.evaluate(() => { const s = statoRun.stanzaCorrente; for (const n of s.nemici.slice()) { n.airZ = 0; danneggiaNemico(n, 1e9, 0, 0); } });
  await p.waitForTimeout(650);
  const ovaz = await p.evaluate(() => { const P = window.__teatro.interni.pubblicoB1.stato; return { ovazione: P.conti.ovazione || 0, umore: P.umore.nome, voli: P.voli.length, fiori: P.fiori.length }; });
  await p.screenshot({ path: foto('boss') });
  ok('boss abbattuto: ovazione', boss.n >= 1 && ovaz.ovazione - boss.ovazione === 1 && ovaz.umore === 'ovazione', ovaz);

  // interiezioni: mai due sovrapposte, mai sopra il dock
  const voci = await p.evaluate((giri) => {
    const I = window.__teatro.interni; const B = I.pubblicoB1; const P = B.stato;
    if (typeof B.riquadroVoce !== 'function' || typeof B.bordoDock !== 'function') return { manca: true };
    for (const s of B.posti) { s.presenza = 1; s.dentro = true; }
    let sovrapposte = 0, sulDock = 0, tot = 0, massimo = 0; const bordo = B.bordoDock();
    for (let g = 0; g < giri; g++) {
      P.voci.length = 0;
      for (const nome of ['ovazione', 'fischi', 'risata', 'sussulto']) { P.umore.t = 0; P.umore.priorita = 0; I.reazionePubblicoB1(nome); }
      const q = P.voci.map((v) => B.riquadroVoce(v));
      tot += q.length; massimo = Math.max(massimo, q.length);
      for (let a = 0; a < q.length; a++) {
        if (q[a].y1 > 300 && q[a].x0 < bordo) sulDock++;
        for (let b = a + 1; b < q.length; b++) if (q[a].x0 < q[b].x1 && q[b].x0 < q[a].x1 && q[a].y0 < q[b].y1 && q[b].y0 < q[a].y1) sovrapposte++;
      }
    }
    P.voci.length = 0; P.fiori.length = 0; P.umore.t = 0; P.umore.priorita = 0; P.umore.tipo = 'calmo'; P.umore.nome = 'calmo';
    return { giri, tot, massimo, sovrapposte, sulDock, bordo };
  }, LIMITI.giriVoci);
  ok('interiezioni: mai due sovrapposte né sopra il dock', !voci.manca && voci.tot >= LIMITI.giriVoci * 2 && voci.sovrapposte === 0 && voci.sulDock === 0, voci);

  // -------------------------------------------------------------------------
  // DROP DELLE ALTRE SQUADRE: A1 (bombe, chiavi, forzieri), A2 (consumabili), campione cremisi, raggio del patto
  // -------------------------------------------------------------------------
  // A1: chiave garantita + bomba alla pulizia
  await stanzaNuova(2);
  const a1 = await p.evaluate(() => { const R = statoRun; R.bombe = 1; R.chiavi = 1; R.stanzaCorrente.chiaveGarantitaA1 = true; return true; });
  await abbattiTutti(0.01); // r < drop.bomba
  const a1Volo = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const s = R.stanzaCorrente;
    const pezzi = s.oggettiATerra.filter((o) => o.tipo === 'bomba' || o.tipo === 'chiave');
    const bomba = pezzi.find((o) => o.tipo === 'bomba');
    if (bomba && bomba.voloB1) { I.player.x = bomba.voloB1.tx; I.player.y = bomba.voloB1.ty; }
    return { pulita: s.pulita, tipi: pezzi.map((o) => o.tipo).sort(), inVolo: pezzi.filter((o) => o.voloB1).length,
      parcheggiati: pezzi.every((o) => o.x === I.pubblicoB1.PARCHEGGIO) };
  });
  await p.waitForTimeout(200);
  const a1Aria = await p.evaluate(() => ({ bombe: statoRun.bombe, chiavi: statoRun.chiavi, voli: window.__teatro.interni.pubblicoB1.stato.voli.length }));
  await p.screenshot({ path: foto('a1-in-volo') });
  await aspettaAtterraggio();
  await p.waitForTimeout(200);
  const a1Bomba = await p.evaluate(() => {
    const I = window.__teatro.interni; const s = statoRun.stanzaCorrente; const r = { bombe: statoRun.bombe };
    const chiave = s.oggettiATerra.find((o) => o.tipo === 'chiave');
    if (chiave) { I.player.x = chiave.x; I.player.y = chiave.y; }
    return r;
  });
  await p.waitForTimeout(200);
  const a1Chiave = await p.evaluate(() => ({ chiavi: statoRun.chiavi }));
  ok('A1: bomba e chiave della pulizia arrivano in volo e si raccolgono solo dopo l\'atterraggio',
    a1 && a1Volo.pulita && a1Volo.tipi.join() === 'bomba,chiave' && a1Volo.inVolo === 2 && a1Volo.parcheggiati
    && a1Aria.bombe === 1 && a1Aria.chiavi === 1 && a1Aria.voli > 0 && a1Bomba.bombe === 2 && a1Chiave.chiavi === 2,
  { a1Volo, a1Aria, a1Bomba, a1Chiave });

  // A1: forziere comune alla pulizia
  await stanzaNuova(2);
  const sogliaForziere = await p.evaluate(() => { const D = BOMBE_CHIAVI_A1.drop; return D.bomba + D.chiave + D.forziereComune / 2; });
  await abbattiTutti(sogliaForziere);
  const fzVolo = await p.evaluate(() => {
    const I = window.__teatro.interni; const s = statoRun.stanzaCorrente; const f = (s.forzieriA1 || [])[0];
    if (!f) return { c: false };
    window.__qaForziere = f;
    if (f.voloB1) { I.player.x = f.voloB1.tx; I.player.y = f.voloB1.ty; }
    return { c: true, tipo: f.tipo, inVolo: Boolean(f.voloB1), parcheggiato: f.x === I.pubblicoB1.PARCHEGGIO, aperto: f.aperto };
  });
  await p.waitForTimeout(250);
  const fzAria = await p.evaluate(() => ({ aperto: window.__qaForziere ? window.__qaForziere.aperto : null, voli: window.__teatro.interni.pubblicoB1.stato.voli.length }));
  await p.screenshot({ path: foto('forziere-in-volo') });
  await aspettaAtterraggio();
  await p.waitForTimeout(250);
  const fzTerra = await p.evaluate(() => {
    const I = window.__teatro.interni; const s = statoRun.stanzaCorrente; const f = window.__qaForziere; const A = I.ARENA;
    if (!f) return {};
    const vicini = s.oggettiATerra.filter((o) => Math.hypot(o.x - f.x, o.y - f.y) < 60 && (o.tipo === 'bomba' || o.tipo === 'chiave' || o.tipo === 'moneta' || o.tipo === 'cura'));
    return { aperto: f.aperto, dentro: f.x >= A.x1 && f.x <= A.x2 && f.y >= A.y1 && f.y <= A.y2, pezzi: vicini.length, piedistallo: Boolean(f.oggetto),
      pezziInVolo: s.oggettiATerra.filter((o) => o.voloB1).length };
  });
  ok('A1: il forziere della pulizia arriva in volo, si apre solo a terra e il contenuto esce dal forziere',
    fzVolo.c && fzVolo.tipo === 'comune' && fzVolo.inVolo && fzVolo.parcheggiato && fzAria.aperto === false && fzAria.voli > 0
    && fzTerra.aperto && fzTerra.dentro && (fzTerra.pezzi > 0 || fzTerra.piedistallo) && fzTerra.pezziInVolo === 0, { fzVolo, fzAria, fzTerra });

  // A2: consumabile alla pulizia
  await stanzaNuova(2);
  await p.evaluate(() => { const S = window.__teatro.interni.statoA2(); S.slot = null; window.__qaRnd = S.rnd; S.rnd = () => 0; });
  await abbattiTutti(0.99); // nessun drop di A1 né moneta di base
  const a2Volo = await p.evaluate(() => {
    const I = window.__teatro.interni; const s = statoRun.stanzaCorrente; const S = I.statoA2(); S.rnd = window.__qaRnd;
    const pk = s.oggettiATerra.find((o) => o.tipo === 'consumabileA2');
    if (pk && pk.voloB1) { I.player.x = pk.voloB1.tx; I.player.y = pk.voloB1.ty; }
    return { c: Boolean(pk), inVolo: Boolean(pk && pk.voloB1), parcheggiato: Boolean(pk && pk.x === I.pubblicoB1.PARCHEGGIO) };
  });
  await p.waitForTimeout(200);
  const a2Aria = await p.evaluate(() => ({ slot: Boolean(window.__teatro.interni.statoA2().slot), voli: window.__teatro.interni.pubblicoB1.stato.voli.length }));
  await aspettaAtterraggio();
  await p.waitForTimeout(250);
  const a2Terra = await p.evaluate(() => ({ slot: Boolean(window.__teatro.interni.statoA2().slot), aTerra: statoRun.stanzaCorrente.oggettiATerra.filter((o) => o.tipo === 'consumabileA2').length }));
  ok('A2: il consumabile della pulizia arriva in volo e si raccoglie solo dopo l\'atterraggio',
    a2Volo.c && a2Volo.inVolo && a2Volo.parcheggiato && !a2Aria.slot && a2Aria.voli > 0 && a2Terra.slot && a2Terra.aTerra === 0, { a2Volo, a2Aria, a2Terra });

  // campione cremisi: la mezza Maschera arriva in volo
  await stanzaNuova(2);
  const crVolo = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const s = R.stanzaCorrente; const n = s.nemici[0];
    n.champion = 'cremisi'; n.mobSoldi = false; n.x = 300; n.y = 200; R.hpHalf = 2; R.maxHpHalf = 6;
    danneggiaNemico(n, 1e9, 0, 0);
    const pk = s.oggettiATerra.find((o) => o.tipo === 'cura');
    if (pk && pk.voloB1) { I.player.x = pk.voloB1.tx; I.player.y = pk.voloB1.ty; }
    return { c: Boolean(pk), inVolo: Boolean(pk && pk.voloB1), vivi: s.nemici.filter((x) => x.hp > 0).length, hp: R.hpHalf };
  });
  await p.waitForTimeout(200);
  const crAria = await p.evaluate(() => ({ hp: statoRun.hpHalf, voli: window.__teatro.interni.pubblicoB1.stato.voli.length }));
  await aspettaAtterraggio();
  await p.waitForTimeout(250);
  const crTerra = await p.evaluate(() => ({ hp: statoRun.hpHalf, cure: statoRun.stanzaCorrente.oggettiATerra.filter((o) => o.tipo === 'cura').length }));
  ok('campione cremisi: la cura arriva in volo e cura solo dopo l\'atterraggio',
    crVolo.c && crVolo.inVolo && crAria.hp === 2 && crAria.voli > 0 && crTerra.hp === 3 && crTerra.cure === 0, { crVolo, crAria, crTerra });

  // raggio del patto (T3 chiama danneggiaNemico da window.__teatroInterno): le uccisioni lanciano i premi
  await stanzaNuova(2);
  const raggioPrima = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const s = R.stanzaCorrente; const T = window.__teatroInterno;
    R.oggettiEquipaggiati.push({ ...T.CATALOGO_PATTO.find((x) => x.id === 'patto_raggio') });
    I.player.x = 150; I.player.y = 200;
    s.nemici.forEach((n, i) => { n.x = 220 + i * 40; n.y = i === 0 ? 200 : 110; });
    const n = s.nemici[0]; n.hp = 0.05; n.champion = 'cremisi'; n.mobSoldi = true; n.airZ = 0;
    window.__qaNemico = n;
    return { lanciati: I.pubblicoB1.stato.conti.lanciati, vivi: s.nemici.filter((x) => x.hp > 0).length };
  });
  await p.keyboard.down('ArrowRight');
  await p.waitForFunction(() => window.__qaNemico.hp <= 0, null, { timeout: 4000 }).catch(() => {});
  const raggioDopo = await p.evaluate(() => {
    const I = window.__teatro.interni; const s = statoRun.stanzaCorrente;
    return { morto: window.__qaNemico.hp <= 0, raggio: Boolean(window.__teatroT3 && window.__teatroT3.raggioAttivo),
      lanciati: I.pubblicoB1.stato.conti.lanciati, inVolo: s.oggettiATerra.filter((o) => o.voloB1).map((o) => o.tipo).sort() };
  });
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('raggio') });
  await p.keyboard.up('ArrowRight');
  await p.evaluate(() => { const R = statoRun; R.oggettiEquipaggiati = R.oggettiEquipaggiati.filter((x) => x.id !== 'patto_raggio'); });
  ok('raggio del patto (T3): le uccisioni lanciano i premi (cura e monete in volo)',
    raggioDopo.morto && raggioDopo.raggio && raggioDopo.inVolo.includes('cura') && raggioDopo.inVolo.includes('moneta')
    && raggioDopo.lanciati - raggioPrima.lanciati >= 2, { raggioPrima, raggioDopo });
  await aspettaAtterraggio();

  // -------------------------------------------------------------------------
  // PLATEA E DOCK
  // -------------------------------------------------------------------------
  const dock = async () => p.evaluate(() => {
    const I = window.__teatro.interni; const B = I.pubblicoB1;
    if (typeof B.bordoDock !== 'function') return { manca: true };
    const bordo = B.bordoDock(); const M = I.PUBBLICO_B1.dock;
    const platea = B.posti.filter((s) => s.zona === 'platea');
    const sotto = platea.filter((s) => s.x - M.mezzaTesta < bordo + M.margine);
    return { bordo, sotto: sotto.length, visibiliSotto: sotto.filter((s) => s.presenza > 0.05).length,
      liberi: platea.filter((s) => s.x - M.mezzaTesta >= bordo + M.margine && s.presenza > 0.9).length };
  });
  await p.evaluate(() => { window.__teatro.interni.pubblicoB1.imposta(1, true); });
  await p.waitForTimeout(2200);
  const dock0 = await dock();
  await p.evaluate(() => { const R = statoRun; const I = window.__teatro.interni; for (let k = 0; k < 14; k++) R.oggettiEquipaggiati.push({ ...I.CATALOGO_OGGETTI[k % I.CATALOGO_OGGETTI.length], qaB1: true }); });
  await p.waitForTimeout(2200);
  const dock14 = await dock();
  await p.screenshot({ path: foto('platea-dock') });
  await p.evaluate(() => { const R = statoRun; R.oggettiEquipaggiati = R.oggettiEquipaggiati.filter((x) => !x.qaB1); window.__teatro.interni.pubblicoB1.imposta(0.5, true); });
  ok('platea: nessuna testa sotto il dock, nemmeno quando il dock cresce',
    !dock0.manca && dock0.sotto > 0 && dock0.visibiliSotto === 0 && dock0.liberi >= 6 && dock14.bordo > dock0.bordo && dock14.visibiliSotto === 0 && dock14.liberi >= 4,
    { dock0, dock14 });

  // -------------------------------------------------------------------------
  // ECONOMIA
  // -------------------------------------------------------------------------
  // il gradimento sposta poco le monete
  const eco = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.pubblicoB1; const s = R.stanzaCorrente; const out = {};
    for (const g of [0, 0.5, 1]) { P.imposta(g, true); s.oggettiATerra.length = 0; for (let k = 0; k < 2000; k++) spawnaMonetaATerra(s, 300, 200, 1); out[g] = s.oggettiATerra.length; }
    s.oggettiATerra.length = 0; P.imposta(0.5, true);
    return out;
  });
  ok('monete: 0 a gradimento neutro, circa ±15% agli estremi', eco[0.5] === 2000 && eco[0] > 1620 && eco[0] < 1780 && eco[1] > 2220 && eco[1] < 2380, eco);

  // piano 1 su 200 mappe vere (stessi semi e stesso metodo di tools/sim-bilancio-teatro.js): neutro, pubblico freddo, pubblico in delirio
  const piano1 = await p.evaluate((nPiani) => {
    const I = window.__teatro.interni; const R = statoRun; const P = I.pubblicoB1;
    const salva = { st: R.stanzaCorrente, mappa: R.mappa, piano: R.piano, chiavi: R.chiavi, bombe: R.bombe, seme: runSeed, hp: R.hpHalf, max: R.maxHpHalf, run: R.numeroRun };
    const bannerVero = mostraBanner; mostraBanner = () => {};
    const giro = (g, conDanni) => {
      P.imposta(g, true);
      const parti = { normale: 0, boss: 0, segreta: 0, forzieri: 0 }; const c0 = { ...P.stato.conti };
      for (let k = 0; k < nPiani; k++) {
        const seme = (k * 7919 + 104729 + 12345) >>> 0;
        R.piano = 1; R.chiavi = BOMBE_CHIAVI_A1.inizio.chiavi; R.bombe = BOMBE_CHIAVI_A1.inizio.bombe;
        const m = I.mappaConSeme(1, seme); R.mappa = m; runSeed = (seme ^ 0x5bd1e995) >>> 0;
        garantisciChiaveA1(m);
        let chiavi = BOMBE_CHIAVI_A1.inizio.chiavi; const chiusi = [];
        const conta = (s, dove) => { for (const o of s.oggettiATerra) { if (o.contatoQa) continue; o.contatoQa = true; if (o.tipo === 'moneta') parti[dove] += o.valore || 1; else if (o.tipo === 'chiave') chiavi += o.valore || 1; } };
        const ordine = m.stanze.filter((s) => s.tipo === 'normale').concat(m.stanze.filter((s) => s.tipo === 'segreta' || s.tipo === 'boss'));
        for (const s of ordine) {
          R.stanzaCorrente = s; I.player.invuln = 1e9; R.maxHpHalf = 6; R.hpHalf = 5; s.pulita = false;
          P.stato.stanza = s; P.stato.colpiStanza = conDanni ? 1 : 0; // il pubblico «è già» in questa stanza: i colpi contati restano
          for (let v = 0; v < 6 && s.nemici.some((n) => n.hp > 0); v++) for (const n of s.nemici.slice()) if (n.hp > 0) { n.airZ = 0; n.maskOpen = true; danneggiaNemico(n, 1e9, 0, 0); }
          verificaStanzaPulita(); R.proiettiliNemici = [];
          conta(s, s.tipo);
          for (const f of s.forzieriA1 || []) { if (f.tipo === 'comune') { apriForziereA1(s, f); conta(s, 'forzieri'); } else chiusi.push([s, f]); }
        }
        for (const [s, f] of chiusi) { if (chiavi <= 0) break; chiavi--; apriForziereA1(s, f); conta(s, 'forzieri'); }
      }
      const C = P.stato.conti; const r2 = (x) => +(x / nPiani).toFixed(2);
      return { media: r2(parti.normale + parti.boss + parti.segreta + parti.forzieri), normale: r2(parti.normale), boss: r2(parti.boss), segreta: r2(parti.segreta), forzieri: r2(parti.forzieri),
        lanciati: C.lanciati - c0.lanciati, regalate: C.regalate - c0.regalate, trattenute: C.trattenute - c0.trattenute, bonus: C.bonus - c0.bonus };
    };
    const out = { neutro: giro(0.5, true), freddo: giro(0, true), delirio: giro(1, false) };
    mostraBanner = bannerVero;
    R.stanzaCorrente = salva.st; R.mappa = salva.mappa; R.piano = salva.piano; R.chiavi = salva.chiavi; R.bombe = salva.bombe; runSeed = salva.seme;
    R.hpHalf = salva.hp; R.maxHpHalf = salva.max; R.numeroRun = salva.run; R.proiettiliNemici = [];
    P.imposta(0.5, true); P.stato.colpiStanza = 0; P.stato.umore.t = 0; P.stato.umore.priorita = 0; P.stato.fiori.length = 0; P.stato.voci.length = 0;
    return out;
  }, LIMITI.pianiEconomia);
  {
    const [lo, hi] = LIMITI.moneteP1; const dentro = (x) => x.media >= lo && x.media <= hi;
    ok(`economia del piano 1 su ${LIMITI.pianiEconomia} piani: ${lo}-${hi} monete a ogni gradimento; a gradimento neutro il pubblico non ne aggiunge né toglie`,
      dentro(piano1.neutro) && dentro(piano1.freddo) && dentro(piano1.delirio) && piano1.neutro.lanciati > 0
      && piano1.neutro.regalate === 0 && piano1.neutro.trattenute === 0 && piano1.neutro.bonus === 0
      && piano1.freddo.media <= piano1.neutro.media && piano1.delirio.media >= piano1.neutro.media, piano1);
  }

  // premi delle stanze speciali: non lanciati; pubblico spento: non si disegna
  await stanzaNuova(2);
  const altri = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.pubblicoB1; const s = R.stanzaCorrente;
    const tipo = s.tipo; s.tipo = 'bisca'; s.oggettiATerra.length = 0; spawnaMonetaATerra(s, 300, 200, 1);
    const speciale = s.oggettiATerra.some((o) => o.voloB1); s.tipo = tipo; s.oggettiATerra.length = 0;
    OPZIONI.pubblico = false; const d0 = P.stato.conti.disegni; disegnaFrame(16); const spento = P.stato.conti.disegni === d0;
    OPZIONI.pubblico = true; disegnaFrame(16);
    return { speciale, spento, acceso: P.stato.conti.disegni > d0 };
  });
  ok('stanze speciali non lanciate; OPZIONI.pubblico spento non disegna', !altri.speciale && altri.spento && altri.acceso, altri);

  // -------------------------------------------------------------------------
  // SUONI E COSTO DEL DISEGNO
  // -------------------------------------------------------------------------
  const suoni = await p.evaluate(() => window.__teatro.interni.pubblicoB1.provaSuoni());
  ok('suoni: tutti udibili, finiti, senza saturare', Object.values(suoni).length >= 9 && Object.values(suoni).every((s) => s.finito && s.picco > 0.004 && s.picco < 0.95), suoni);

  // Un tick di logica e un frame per giro, come nel ciclo vero; mediana di 7 confronti acceso/spento. Il canvas
  // registra i comandi e li disegna dopo: copiarne un pixel su un'altra tela lo obbliga a disegnare subito,
  // così il tempo misurato comprende davvero il disegno (in tutti e due i casi).
  const tempi = await p.evaluate(() => {
    const I = window.__teatro.interni; const P = I.pubblicoB1;
    const c = document.getElementById('c'); const spia = document.createElement('canvas'); spia.width = spia.height = 1; const sx = spia.getContext('2d');
    const mis = (acceso, n, reazione) => {
      OPZIONI.pubblico = acceso; let tot = 0;
      for (let k = 0; k < n; k++) {
        if (reazione && P.stato.umore.t < 100) { P.stato.umore.t = 0; P.stato.umore.priorita = 0; I.reazionePubblicoB1('ovazione'); P.stato.voci.length = 0; }
        passoLogico();
        const t = performance.now(); disegnaFrame(1000 / 60); sx.drawImage(c, 0, 0, 1, 1, 0, 0, 1, 1); tot += performance.now() - t;
      }
      return tot / n;
    };
    const mediana = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    const confronto = (reazione) => {
      const con = [], senza = [], diff = [];
      mis(true, 40, reazione); mis(false, 40, false);
      for (let g = 0; g < 7; g++) { const a = mis(true, 90, reazione), b = mis(false, 90, false); con.push(a); senza.push(b); diff.push(a - b); }
      return { conPubblicoMs: +mediana(con).toFixed(3), senzaMs: +mediana(senza).toFixed(3), inPiuMs: +mediana(diff).toFixed(3) };
    };
    P.imposta(0.5, true); P.stato.umore.t = 0; P.stato.umore.priorita = 0;
    for (let k = 0; k < 150; k++) passoLogico(); // la tensione e i posti si assestano
    const fermo = confronto(false);
    // quante zone si ricompongono per frame a pubblico calmo (1 = una a turno) e in ovazione
    const zone = (reazione) => { const r0 = P.stato.conti.ridisegni || 0; mis(true, 120, reazione); return +(((P.stato.conti.ridisegni || 0) - r0) / 120).toFixed(2); };
    const zoneFermo = zone(false);
    const reazione = confronto(true);
    const zoneReazione = zone(true);
    OPZIONI.pubblico = true; P.stato.umore.t = 0; P.stato.umore.priorita = 0; P.stato.fiori.length = 0; P.stato.voci.length = 0;
    return { fermo, reazione, zoneFermo, zoneReazione, buffer: `${c.width}x${c.height}` };
  });
  ok(`costo del disegno: pubblico calmo ≤ ${LIMITI.costoFermoMs} ms in più per frame (una zona ricomposta per frame), in ovazione ≤ ${LIMITI.costoReazioneMs} ms`,
    tempi.fermo.inPiuMs <= LIMITI.costoFermoMs && tempi.reazione.inPiuMs <= LIMITI.costoReazioneMs && tempi.zoneFermo > 0 && tempi.zoneFermo <= 1.5, tempi);

  ok('nessun errore di console', errori.length === 0, errori.slice(0, 6));
  console.log(JSON.stringify(esiti, null, 1));
  console.log('tempi di disegno (headless, software)', JSON.stringify(tempi));
  const falliti = esiti.filter((e) => !e.ok).map((e) => e.nome);
  console.log(falliti.length ? `FALLITI ${falliti.length}/${esiti.length}: ${falliti.join(' | ')}` : `TUTTI VERDI (${esiti.length})`);
  await browser.close();
  process.exit(falliti.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
