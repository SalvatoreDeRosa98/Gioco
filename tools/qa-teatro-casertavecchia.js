#!/usr/bin/env node
/*
 * tools/qa-teatro-casertavecchia.js — verifica Playwright della squadra h6 (gioco/teatro/h6-casertavecchia.js):
 * Casertavecchia, «Le Campane del Perdono», zona del piano 3.
 *   A. LA SCELTA: il cancelletto solo dopo il boss della Villa (non dopo l'Acquedotto, non agli altri piani);
 *      [E] porta a Casertavecchia (zonaP3, quartiere, cartellone, luce, pavimento, musica).
 *   B. LA BOTOLA: il piano 3 è San Leucio intatto (telaio di h1, indizio di Bianca possibile, Capitano).
 *   C. IN ZONA niente Telaio di Agnese, niente confronto di h1, niente fazzoletto di Bianca, niente lima.
 *   D. I RINTOCCHI e i NEMICI: tutti i tipi, tutti i loro stati; posa → suona; pietra sveglia, vivi storditi;
 *      corda tirata con un colpo e con [E], ricarica.
 *   E. IL CAMPANARO: tutti gli stati della tabella, fase 2 con le campane a terra che risuonano, sconfitta,
 *      anime di h2, rivelazione una volta sola nello slot, premio.
 *   F. TADDEO SUL SAGRATO: perdonato, accusato, nessun flag; giocando Taddeo niente scena.
 *   G. MEMORIA: conto della notte (noteVoceE6), Diario (b8), «Riprendi la notte» (campi percorso di e6).
 *   H. CICLO 2: la stessa strada al piano 7; zonaP3 azzerato ai piani che non sono il terzo.
 *   I. GENERATORE: 30 piani di Casertavecchia in regola. L. Nessun errore.
 * Uso: node tools/qa-teatro-casertavecchia.js <file html> [prefisso screenshot]
 * Foto <prefisso>-cancello.png, -borgo.png, -rintocco.png, -campanaro.png, -campane.png, -sagrato.png.
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { fermaCiclo, aspetta } = require('./qa-teatro-comune.js');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-h6');
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
  /** Foto: un fotogramma disegnato a ciclo fermo (stesso stato della logica). */
  const scatta = async (nome) => { await p.evaluate(() => disegnaFrame(16)); await p.locator('#c').screenshot({ path: foto(nome) }); };

  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await aspetta(p, 500);
  await fermaCiclo(p, true);

  // attrezzi nella pagina (tutti deterministici: nessuna attesa a tempo reale)
  await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun, P = I.player;
    const libera = () => { R.siparioAttivo = null; R.cartiglioD = null; R.pausa = false; R.graziaIngressoC = 0; };
    const pulisci = (st) => {
      libera();
      for (const n of st.nemici) n.hp = 0;
      for (let i = 0; i < 80 && !st.pulita; i++) { passoLogico(); verificaStanzaPulita(); libera(); }
      return st.pulita;
    };
    const chiudiDialogo = () => { for (let i = 0; i < 40 && window.__teatro.t4qa.dialogo; i++) { const d = window.__teatro.t4qa.dialogo; if (d.scelta) return 'scelta'; if (typeof window.__teatro.t4qa.avanza === 'function') window.__teatro.t4qa.avanza(); else break; } return window.__teatro.t4qa.dialogo ? 'aperto' : null; };
    window.__qa6 = {
      libera, pulisci, chiudiDialogo,
      /** Run nuova, dentro la stanza del boss del piano dato, ripulita. */
      bossBattuto(piano, prima) {
        if (I.bossB6) I.bossB6.forza(null);
        nuovaRun(false);
        if (prima) prima();
        if (piano > 1) avviaPiano(piano, false);
        libera();
        const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
        entraInStanza(st, 'S'); libera();
        P.invuln = 1e9; P.x = 320; P.y = 270;
        pulisci(st);
        return st;
      },
      /** Dalla Villa (piano dato) sale a Casertavecchia col cancelletto. */
      sali(piano = 2) {
        const st = this.bossBattuto(piano);
        const G = I.CASERTAVECCHIA_H6.cancello;
        P.x = G.x; P.y = G.y + 10;
        interagisciStanza(); libera();
        return st;
      },
    };
  });
  const sali = (piano) => p.evaluate((pi) => { window.__qa6.sali(pi); const R = window.__teatro.interni.statoRun; return { piano: R.piano, zona: R.zonaP3 || null }; }, piano);

  const finisciDialogo = async () => {
    for (let i = 0; i < 20; i++) {
      const dd = await p.evaluate(() => window.__teatro.t4qa.dialogo);
      if (!dd) return true;
      await p.keyboard.press('Space');
      await p.evaluate(() => { window.__qa6.libera(); passoLogico(); });
    }
    return false;
  };
  /** Sale a Casertavecchia e chiude i cartigli di T4 che la run nuova può aprire (lettere, sblocchi). */
  const saliPronto = async (piano = 2) => { await p.evaluate((pi) => { window.__qa6.sali(pi); }, piano); await finisciDialogo(); };

  // ------------------------------------------------------------------ A. LA SCELTA
  const a = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun, H = I.casertavecchiaH6;
    const c1 = (window.__qa6.bossBattuto(1), H.cancello);
    const c2 = (window.__qa6.bossBattuto(2), H.cancello);
    const bannerVilla = R.banner || '';
    const c3 = (window.__qa6.bossBattuto(2, () => I.acquedottoD6.segna(2, true)), { c: H.cancello, acq: I.acquedottoD6.attivo(2) });
    const c4 = (window.__qa6.bossBattuto(3), H.cancello);
    return { c1, c2, c3, c4, bannerVilla };
  });
  ok('scelta:piano-1-niente', a.c1 === null, a.c1);
  ok('scelta:villa-cancelletto', a.c2 && a.c2.x > 0 && /CANCELLETTO/.test(a.bannerVilla), a);
  ok('scelta:acquedotto-niente', a.c3.acq && a.c3.c === null, a.c3);
  ok('scelta:piano-3-niente', a.c4 === null, a.c4);
  await p.evaluate(() => { window.__qa6.bossBattuto(2); const I = window.__teatro.interni; I.player.x = 236; I.player.y = 200; });
  await scatta('cancello');
  const s = await sali(2);
  const luogo = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun;
    const q = getQuartierePiano(R.piano);
    const atto = getRaccontoAtto(R.piano, 1);
    return { q: q.id, nome: q.nome, atto: atto && atto.titolo, luce: luceLuogoB2() === I.LUCE_H6, pav: getFloorTileCanvas(R.piano) === getFloorTileCanvas(R.piano) && getFloorTileCanvas(R.piano).width > 0,
      tema: I.casertavecchiaH6.tema, boss: R.mappa.stanze.find((x) => x.tipo === 'boss').nemici.find((n) => n.boss).bossId, run: typeof a7 === 'object' && a7.run ? a7.run.zonaH6 : null };
  });
  ok('luogo:zonaP3', s.piano === 3 && s.zona === 'casertavecchia', s);
  ok('luogo:quartiere-e-sipario', luogo.q === 'casertavecchia' && luogo.nome === 'Casertavecchia' && /CAMPANE/.test(luogo.atto || ''), luogo);
  ok('luogo:luce-pavimento-musica', luogo.luce && luogo.pav && luogo.tema === 'casertavecchia', luogo);
  ok('luogo:boss-campanaro', luogo.boss === 'campanaro-senza-volto', luogo.boss);
  ok('luogo:registro', luogo.run === 'casertavecchia', luogo.run);

  const CONFIG_H1_BOSS = await p.evaluate(() => CONFIG_H1.bossLeucio.slice());
  // ------------------------------------------------------------------ B/C. SAN LEUCIO INTATTO, LA ZONA PULITA
  const sl = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun;
    const leggi = () => {
      if (typeof biancaH2 === 'function') { biancaH2().trovati.leucio = false; biancaH2().tentativi.leucio = 20; }
      for (const st of R.mappa.stanze) delete st.biancaH2;
      const ind = typeof preparaIndizioH2 === 'function' ? preparaIndizioH2() : null;
      return { q: getQuartierePiano(R.piano).id, zona: R.zonaP3 || null, telaio: R.mappa.stanze.some((x) => x.tipo === CONFIG_H1.tipoStanza),
        bianca: Boolean(ind), boss: R.mappa.stanze.find((x) => x.tipo === 'boss').nemici.find((n) => n.boss).bossId, tema: I.casertavecchiaH6.tema };
    };
    window.__qa6.bossBattuto(2); I.player.x = 320; I.player.y = 188; interagisciStanza(); window.__qa6.libera();
    const botola = { piano: R.piano, ...leggi() };
    window.__qa6.sali(2);
    const zona = { piano: R.piano, ...leggi() };
    return { botola, zona };
  });
  ok('botola:san-leucio', sl.botola.piano === 3 && sl.botola.q === 'san-leucio' && sl.botola.zona === null && sl.botola.boss !== 'campanaro-senza-volto', sl.botola);
  ok('botola:telaio-e-bianca', sl.botola.telaio && sl.botola.bianca && sl.botola.tema !== 'casertavecchia', sl.botola);
  ok('zona:niente-telaio-niente-bianca', !sl.zona.telaio && !sl.zona.bianca, sl.zona);

  // ------------------------------------------------------------------ D. RINTOCCHI E NEMICI
  await saliPronto(2);
  const d = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun, P = I.player, H = I.casertavecchiaH6;
    const tipi = new Set(), resti = new Set();
    for (const st of R.mappa.stanze) for (const n of st.nemici) if (!n.boss) (I.NEMICI_H6[n.tipo] ? tipi : resti).add(n.tipo);
    // stanza di prova: un esemplare per tipo, giocatore immortale
    const st = R.mappa.stanze.find((x) => x.tipo === 'normale' && x.nemici.length && x.cordaH6);
    entraInStanza(st, 'S'); window.__qa6.libera();
    P.invuln = 1e9; P.x = 320; P.y = 270;
    const modello = st.nemici[0];
    st.nemici = Object.keys(I.NEMICI_H6).map((tipo, k) => ({ ...modello, id: 'qa6-' + k, tipo, patternMob: tipo, comportamento: tipo, statoH6: null, tH6: 0, sveglioH6: 0, stunTicks: 0,
      hp: 999, maxHp: 999, x: 160 + k * 100, y: 140 + (k % 2) * 60, speed: I.NEMICI_H6[tipo].vel, velH6: 1, champion: null, r: I.NEMICI_H6[tipo].raggio }));
    const stati = {};
    const segna = () => { for (const n of st.nemici) (stati[n.tipo] = stati[n.tipo] || new Set()).add(n.statoH6); };
    // il rintocco tirato a mano
    const c = st.cordaH6; c.fase = 'attesa'; c.t = 9999; c.ricarica = 0;
    const tirata = H.tira(true), seconda = H.tira(true);
    let posa = 0; while (st.cordaH6.fase === 'posa' && posa < 200) { passoLogico(); segna(); posa++; }
    const pen = st.nemici.find((n) => n.tipo === 'penitente_pietra'), cor = st.nemici.find((n) => n.tipo === 'corvo_campanile');
    const dopo = { fase: st.cordaH6.fase, sveglio: pen.sveglioH6, stordito: cor.stunTicks, ricarica: st.cordaH6.ricarica };
    // la pietra si muove solo sveglia; danno ridotto da addormentata
    const px = pen.x, py = pen.y; for (let i = 0; i < 30; i++) { passoLogico(); segna(); }
    const mosso = Math.hypot(pen.x - px, pen.y - py);
    pen.sveglioH6 = 0; for (let i = 0; i < 5; i++) passoLogico();
    const fx = pen.x, fy = pen.y; for (let i = 0; i < 30; i++) { passoLogico(); segna(); }
    const fermo = Math.hypot(pen.x - fx, pen.y - fy);
    const hp0 = pen.hp; danneggiaNemico(pen, 10, 0, 0); const dannoPietra = hp0 - pen.hp;
    pen.sveglioH6 = 50; const hp1 = pen.hp; danneggiaNemico(pen, 10, 0, 0); const dannoSveglio = hp1 - pen.hp;
    // la ruota completa degli stati
    for (let i = 0; i < 900; i++) { for (const n of st.nemici) n.stunTicks = 0; passoLogico(); segna(); }
    const fumo = (st.fumoH6 || []).length > 0 || stati.sagrestano && stati.sagrestano.has('dondola');
    // un colpo del giocatore sulla corda la tira; e [E] sotto la corda
    Object.assign(st.cordaH6, { fase: 'attesa', t: 9999, ricarica: 0 });
    // niente fra il colpo e la corda: un arredo o un nemico lì davanti si prendeva il colpo (rossa ogni tanto)
    st.ostacoli = (st.ostacoli || []).filter((o) => Math.hypot(o.x - st.cordaH6.x, o.y - 120) > 40);
    for (const n of st.nemici) if (Math.hypot(n.x - st.cordaH6.x, n.y - 120) < 40) n.x += n.x < 320 ? 60 : -60;
    R.proiettili.push({ x: st.cordaH6.x, y: 120, vx: 0, vy: 0, dist: 0, dmg: 1, r: 3, maxDist: 400, hitIds: new Set() });
    passoLogico();
    const colpo = st.cordaH6.fase;
    Object.assign(st.cordaH6, { fase: 'attesa', t: 9999, ricarica: 0 });
    P.x = st.cordaH6.x; P.y = I.RINTOCCHI_H6.corda.yFondo + 10; interagisciStanza();
    const conE = st.cordaH6.fase;
    // per la foto: posa a metà, con la pietra che si accende
    Object.assign(st.cordaH6, { fase: 'posa', t: 20, durata: 66 });
    P.x = 320; P.y = 270;
    return { diag: { fase: R.fase, gel: ticksCongelati, sc: Boolean(R.scambioPendente), pb: Boolean(R.pannelloB), dial: Boolean(window.__teatro.t4qa.dialogo), hp: R.hpHalf }, tipi: [...tipi], resti: [...resti], tirata, seconda, posa, dopo, mosso, fermo, dannoPietra, dannoSveglio, fumo,
      stati: Object.fromEntries(Object.entries(stati).map(([k, v]) => [k, [...v].filter(Boolean).sort()])), colpo, conE };
  });
  await scatta('rintocco');
  ok('nemici:tutti-i-tipi', ['penitente_pietra', 'battaglio', 'sagrestano', 'corvo_campanile'].every((t) => d.tipi.includes(t)), d.tipi);
  ok('nemici:niente-san-leucio', !d.resti.some((t) => ['burattino', 'maschera', 'vespa_cieca'].includes(t)), d.resti);
  ok('rintocco:posa-poi-suona', d.tirata && !d.seconda && d.posa >= 10 && d.dopo.fase === 'suona', d);
  ok('rintocco:pietra-sveglia-vivi-storditi', d.dopo.sveglio > 0 && d.dopo.stordito > 0 && d.dopo.ricarica > 0, d.dopo);
  ok('rintocco:pietra-si-muove-solo-sveglia', d.mosso > 10 && d.fermo < 0.5, { mosso: d.mosso, fermo: d.fermo, diag: d.diag });
  ok('rintocco:pietra-dura', d.dannoPietra > 0 && d.dannoPietra < d.dannoSveglio, { pietra: d.dannoPietra, sveglio: d.dannoSveglio });
  ok('rintocco:colpo-e-tasto', d.colpo === 'posa' && d.conE === 'posa', { colpo: d.colpo, conE: d.conE });
  const attesi = { penitente_pietra: ['pietra', 'sveglio'], battaglio: ['fermo', 'oscilla', 'rimbalza', 'rotola'], sagrestano: ['cammina', 'dondola'], corvo_campanile: ['ali', 'posato', 'volo'] };
  for (const [t, v] of Object.entries(attesi)) ok(`nemici:stati:${t}`, v.every((x) => (d.stati[t] || []).includes(x)), d.stati[t]);
  ok('nemici:incenso', d.fumo, d.fumo);

  // il borgo: una stanza qualsiasi con la sua corda, in pace
  await saliPronto(2);
  await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun;
    const st = R.mappa.stanze.find((x) => x.tipo === 'normale' && x.cordaH6 && x.nemici.length >= 3) || R.mappa.stanze.find((x) => x.cordaH6);
    entraInStanza(st, 'S'); window.__qa6.libera(); I.player.x = 320; I.player.y = 270;
    for (let i = 0; i < 40; i++) passoLogico();
  });
  await scatta('borgo');

  // ------------------------------------------------------------------ E. IL CAMPANARO
  await saliPronto(2);
  const e = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun, P = I.player, H = I.casertavecchiaH6;
    const st = R.mappa.stanze.find((x) => x.tipo === 'boss');
    entraInStanza(st, 'S'); window.__qa6.libera();
    const banner = R.banner || '';
    P.invuln = 1e9; P.x = 320; P.y = 270;
    const b = st.nemici.find((n) => n.boss);
    const stati = new Set(); let tettoMax = 0, fotoAnticipo = null;
    for (let i = 0; i < 1400; i++) {
      window.__qa6.libera(); passoLogico(); stati.add(b.statoH6);
      tettoMax = Math.max(tettoMax, R.proiettiliNemici.length);
      if (b.statoH6 === 'avvolge' && b.tStatoH6 === 20 && !fotoAnticipo) { fotoAnticipo = true; break; }
    }
    const rimorsi = st.nemici.filter((n) => n.rimorsoH6).length;
    return { banner, stati1: [...stati], tettoMax, rimorsi, fase2: b.fase2H6 };
  });
  await scatta('campanaro');
  const e2 = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun, P = I.player, H = I.casertavecchiaH6;
    const st = R.stanzaCorrente, b = st.nemici.find((n) => n.boss);
    b.hp = Math.floor(b.maxHp * 0.45); b.stunTicks = 0;
    const stati = new Set(); let campane = null, posaCampana = false, risuona = false, prega = false;
    for (let i = 0; i < 5000; i++) {
      window.__qa6.libera(); passoLogico(); stati.add(b.statoH6);
      if (st.campaneH6 && st.campaneH6.every((c) => c.z === 0)) campane = st.campaneH6.length;
      if (st.campaneH6 && st.campaneH6.some((c) => c.posa > 0)) posaCampana = true;
      if (b.statoH6 === 'risuona') risuona = true;
      if (b.statoH6 === 'prega') prega = true;
      if (risuona && prega && b.statoH6 === 'tendeCorde' && b.tStatoH6 === 30) break;
    }
    // le campane fermano i colpi del giocatore
    if (!st.campaneH6) return { stati2: [...stati], campane, posaCampana, risuona, prega, fase2: b.fase2H6, hp: b.hp, stanza: R.stanzaCorrente === st, fase: R.fase };
    const c = st.campaneH6[0];
    R.proiettili.push({ x: c.x, y: c.y - 10, vx: 0, vy: 0, dist: 0, dmg: 1, r: 3, maxDist: 400, hitIds: new Set() });
    const n0 = R.proiettili.length; window.__qa6.libera(); passoLogico();
    const fermati = R.proiettili.length < n0;
    return { stati2: [...stati], campane, posaCampana, risuona, fase2: b.fase2H6, fermati };
  });
  await scatta('campane');
  const e3 = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun, H = I.casertavecchiaH6;
    const st = R.stanzaCorrente;
    const anime0 = h2.anime.length, vista0 = H.rivelazioneVista;
    R.dannoSubitoNelBoss = false;
    window.__qa6.pulisci(st);
    const anime = h2.anime.length - anime0;
    const lima = JSON.stringify(st.oggettiATerra || []).includes('lima') || Boolean(statoB8().ferri.lima);
    const premio = Boolean(st.oggettoPiedistallo && st.oggettoPiedistallo.premioH6);
    const did = JSON.stringify(typeof b8 === 'object' ? (b8.didascalie || b8.dida || '') : '');
    const confronto = Boolean(st.confrontoH1) || Boolean(window.__teatro.t4qa.dialogo);
    const primaVolta = H.rivelazioneVista && !vista0;
    // seconda caduta nella stessa memoria: niente rivelazione
    window.__qa6.sali(2);
    const st2 = R.mappa.stanze.find((x) => x.tipo === 'boss'); entraInStanza(st2, 'S');
    let chiamate = 0; const base = window.didascaliaH2; window.didascaliaH2 = function (...a) { chiamate++; return base.apply(this, a); };
    window.__qa6.pulisci(st2);
    window.didascaliaH2 = base;
    return { anime, lima, premio, confronto, primaVolta, vista0, chiamate, campane: st.campaneH6, banner: R.banner };
  });
  const CONFIG_H1_BOSS_ = 0; const tutti = ['cammina', 'alzaCorda', 'suona', 'avvolge', 'sferza', 'prega', 'cambiaFase', 'tendeCorde', 'risuona'];
  const visti = new Set([...e.stati1, ...e2.stati2]);
  ok('boss:presentazione', /Campanaro/.test(e.banner) && /rintocco/.test(e.banner), e.banner);
  ok('boss:tutti-gli-stati', tutti.every((x) => visti.has(x)), [...visti]);
  ok('boss:tetto-colpi', e.tettoMax <= 28, e.tettoMax);
  ok('boss:rimorsi', e.rimorsi >= 1, e.rimorsi);
  ok('boss:fase2-campane', e2.fase2 && e2.campane === 3 && e2.posaCampana && e2.risuona && e2.fermati, e2);
  ok('boss:anime-di-h2', e3.anime > 0, e3.anime);
  ok('boss:rivelazione-una-volta', !e3.vista0 && e3.primaVolta && e3.chiamate === 0, e3);
  ok('boss:niente-lima-niente-confronto', !e3.lima && !e3.confronto, e3);
  ok('boss:premio-e-campane-via', e3.premio && !e3.campane, e3);

  // ------------------------------------------------------------------ F. TADDEO SUL SAGRATO
  const sagrato = async (flag, personaggio) => { await p.evaluate(({ flag, personaggio }) => {
    window.__teatro.t4qa.impostaFlag({ taddeo: flag });
    if (personaggio) { try { selezionaPersonaggio(personaggio); } catch (_) { /* */ } }
    window.__qa6.sali(2);
  }, { flag, personaggio }); await finisciDialogo(); return p.evaluate(({ personaggio }) => {
    const I = window.__teatro.interni, R = I.statoRun, P = I.player, H = I.casertavecchiaH6;
    if (personaggio) R.personaggioId = personaggio;
    const st = R.mappa.stanze.find((x) => x.sagratoH6) || R.mappa.stanze.find((x) => x.tipo === 'normale');
    entraInStanza(st, 'S'); window.__qa6.libera();
    window.__qa6.pulisci(st);
    R.hpHalf = 2; const k0 = R.chiavi || 0;
    P.invuln = 1e9; P.x = I.SAGRATO_H6.posto.x; P.y = I.SAGRATO_H6.posto.y + 26;
    for (let i = 0; i < 4; i++) { window.__qa6.libera(); passoLogico(); }
    const dialogo = Boolean(window.__teatro.t4qa.dialogo);
    const voci = dialogo ? (window.__teatro.t4qa.dialogo.voci || []).length : 0;
    return { variante: H.variante, sagrato: H.sagrato, dialogo, voci, k0, banner: R.banner };
  }, { personaggio }); };
  const leggiDopo = () => p.evaluate(() => { const R = window.__teatro.interni.statoRun; const b = R.mappa.stanze.find((x) => x.tipo === 'boss').nemici.find((n) => n.boss);
    return { hp: R.hpHalf, chiavi: R.chiavi || 0, esito: R.sagratoH6, bossHp: b.maxHp, avvisato: Boolean(b.avvisatoH6) }; });

  const fp = await sagrato('perdonato');
  await fermaCiclo(p, false); await aspetta(p, 120); await fermaCiclo(p, true); // il cartiglio di t4 si disegna nel ciclo
  await p.locator('#c').screenshot({ path: foto('sagrato') });
  const chiuso1 = await finisciDialogo();
  const dp = await leggiDopo();
  ok('taddeo:perdonato', fp.variante === 'perdonato' && fp.dialogo && chiuso1 && dp.esito === 'perdonato' && dp.hp === 4 && dp.chiavi === fp.k0 + 1, { fp, dp });
  const fa = await sagrato('accusato');
  const chiuso2 = await finisciDialogo();
  const da = await leggiDopo();
  ok('taddeo:accusato', fa.variante === 'accusato' && fa.dialogo && chiuso2 && da.esito === 'accusato' && da.avvisato && da.hp === 2, { fa, da });
  const fn = await sagrato(null);
  const dn = await leggiDopo();
  ok('taddeo:di-spalle', fn.variante === 'spalle' && !fn.dialogo && fn.sagrato && fn.sagrato.visto && /spalle/.test(fn.banner) && !dn.esito, { fn, dn });
  const ft = await sagrato('perdonato', 'taddeo');
  ok('taddeo:giocando-taddeo-niente', ft.variante === null && !ft.dialogo, ft);
  await p.evaluate(() => { window.__teatro.t4qa.impostaFlag({ taddeo: null }); window.__teatro.interni.statoRun.personaggioId = 'ferruccio'; });

  // ------------------------------------------------------------------ G. MEMORIA
  const g = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun;
    window.__qa6.sali(2);
    const voce = Object.assign({}, typeof a7 === 'object' ? a7.run : {}, { esito: 'morte', premioH6: true });
    const note = typeof noteVoceE6 === 'function' ? noteVoceE6(voce) : [];
    let pagina = null;
    try { pagina = componiPaginaB8(Object.assign({ notte: 1, piano: 3 }, voce), nuovaNotaB8(), statoB8(), leggiDiarioB8().memoria); } catch (err) { pagina = { errore: String(err) }; }
    const campi = typeof campiPercorsoE6 === 'function' ? campiPercorsoE6() : {};
    // «Riprendi la notte»: run nuova, si rimettono i campi salvati, si riavvia il piano
    const salvati = JSON.parse(JSON.stringify(campi));
    nuovaRun(false);
    for (const [k, v] of Object.entries(salvati)) if (/^percorso/.test(k)) R[k] = v;
    avviaPiano(3, false); window.__qa6.libera();
    const ripreso = { zona: R.zonaP3 || null, q: getQuartierePiano(3).id };
    return { note, righe: pagina && pagina.righe, errore: pagina && pagina.errore, campi, ripreso, voceZona: voce.zonaH6 };
  });
  ok('memoria:conto-della-notte', g.note.some((n) => n[0] === 'Percorso' && /Casertavecchia/.test(n[1])), g.note);
  ok('memoria:diario', Array.isArray(g.righe) && g.righe.some((r) => /Casertavecchia|mulattiera|San Leucio, stanotte/.test(r)) && g.righe.some((r) => /Campanaro/.test(r)), g);
  ok('memoria:riprendi-la-notte', g.campi.percorsoH6 && g.campi.percorsoH6[3] === 'casertavecchia' && g.ripreso.zona === 'casertavecchia' && g.ripreso.q === 'casertavecchia', g);

  // ------------------------------------------------------------------ H. CICLO 2
  const h = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun, H = I.casertavecchiaH6;
    window.__qa6.sali(6);
    const p7 = { piano: R.piano, zona: R.zonaP3 || null, q: getQuartierePiano(7).id, boss: R.mappa.stanze.find((x) => x.tipo === 'boss').nemici.find((n) => n.boss).bossId };
    avviaPiano(8, false); window.__qa6.libera();
    const p8 = { zona: R.zonaP3 === undefined ? null : R.zonaP3 };
    avviaPiano(11, false); window.__qa6.libera();
    const p11 = { zona: R.zonaP3 || null, q: getQuartierePiano(11).id };
    return { p7, p8, p11 };
  });
  ok('ciclo2:piano-7', h.p7.piano === 7 && h.p7.zona === 'casertavecchia' && h.p7.q === 'casertavecchia' && h.p7.boss === 'campanaro-senza-volto', h.p7);
  ok('ciclo2:azzerato-fuori-dal-terzo', h.p8.zona === null && h.p11.zona === null && h.p11.q === 'san-leucio', h);

  // ------------------------------------------------------------------ I. GENERATORE
  const gen = await p.evaluate(() => {
    const I = window.__teatro.interni, R = I.statoRun;
    const guai = [];
    for (let k = 0; k < 30; k++) {
      nuovaRun(false); I.casertavecchiaH6.segna(3, true); avviaPiano(3, false); window.__qa6.libera();
      if (R.zonaP3 !== 'casertavecchia') { guai.push(['zona', k]); continue; }
      const boss = R.mappa.stanze.find((x) => x.tipo === 'boss');
      if (!boss || !boss.nemici.some((n) => n.bossId === 'campanaro-senza-volto')) guai.push(['boss', k]);
      if (!R.mappa.stanze.some((x) => x.sagratoH6)) guai.push(['sagrato', k]);
      for (const st of R.mappa.stanze) {
        if (st.tipo === 'normale' && st.nemici.length && !st.cordaH6) guai.push(['corda', k, st.id]);
        if (st.cordaH6 && !(st.cordaH6.x > 100 && st.cordaH6.x < 540)) guai.push(['posto-corda', k, st.cordaH6.x]);
        for (const n of st.nemici) if (!n.boss && I.NEMICI_H6[n.tipo] && !(n.hp > 0 && n.maxHp > 0)) guai.push(['hp', k, n.tipo]);
      }
    }
    return guai;
  });
  ok('generatore:30-piani', gen.length === 0, gen.slice(0, 10));

  // ------------------------------------------------------------------ L. ERRORI
  const erroriTeatro = await p.evaluate(() => (typeof ERRORI_TEATRO !== 'undefined' ? ERRORI_TEATRO.map((x) => `${x.dove}: ${x.testo}`) : []));
  ok('nessun-errore-in-ERRORI_TEATRO', erroriTeatro.length === 0, erroriTeatro);

  await browser.close();
  const falliti = esiti.filter((x) => !x.ok);
  console.log(JSON.stringify({ file: path.relative(RADICE, file), controlli: esiti.length, falliti, erroriConsole: errori }, null, 1));
  console.log(falliti.length || errori.length ? `FALLITI: ${falliti.map((x) => x.caso).join(', ')}${errori.length ? ' + errori console' : ''}` : `TUTTO OK (${esiti.length} controlli)`);
  process.exitCode = falliti.length || errori.length ? 1 : 0;
})();
