#!/usr/bin/env node
/*
 * tools/qa-teatro-stanze-speciali.js — verifica Playwright del miglioramento 3 (stanze speciali: sfida,
 * sacrificio, maledetta, bisca; gioco/teatro/a3-stanze-speciali.js).
 * Uso: node tools/qa-teatro-stanze-speciali.js [file html] [prefisso screenshot] [semi]
 * 1. Generatore, [semi] semi per piano 1-4: ogni tipo nuovo al massimo una volta; è una foglia (1 porta) attaccata
 *    a una stanza di combattimento con porta simmetrica; non tocca il boss né altre stanze; nessuna bisca al
 *    piano 1; restano veri i vincoli base (combattimento per piano, 1 tesoro/fucina/boss/segreta/patto).
 * 2. Meccaniche, su una mappa vera: porta della Sfida sbarrata senza salute piena; ondate e premio; prezzo dei
 *    rovi in entrata e in uscita; ceppo del sacrificio; banco del lotto e cartomante.
 * Esce con 1 se un vincolo salta o ci sono errori di console. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-stanze-speciali');
const SEMI = Number(process.argv[4]) || 200;
const foto = (n) => (fs.existsSync(prefisso) && fs.statSync(prefisso).isDirectory()
  ? path.join(prefisso, `${n}.png`) : `${prefisso}-${n}.png`);

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  const violazioni = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(400);

  // 1. generatore
  const gen = await p.evaluate((SEMI) => {
    const I = window.__teatro.interni;
    const tipi = I.STANZE_SPECIALI_A3.ordine;
    const out = {}; const v = [];
    for (const piano of [1, 2, 3, 4]) {
      const freq = Object.fromEntries(tipi.map((t) => [t, 0]));
      for (let seme = 1; seme <= SEMI; seme++) {
        const m = I.mappaConSeme(piano, seme * 2654435761);
        const err = (msg) => v.push(`piano ${piano} seme ${seme}: ${msg}`);
        if (!m) { err('mappa nulla'); continue; }
        const conta = (t) => m.stanze.filter((s) => s.tipo === t).length;
        if (conta('normale') !== I.STANZE_COMBATTIMENTO_PER_PIANO[piano]) err('stanze di combattimento sbagliate');
        for (const t of ['ingresso', 'tesoro', 'fucina', 'boss', 'segreta', 'patto']) if (conta(t) !== 1) err(`${t} × ${conta(t)}`);
        const celle = new Map(m.stanze.filter((s) => s.tipo !== 'patto').map((s) => [`${s.cx},${s.cy}`, s]));
        if (celle.size !== m.stanze.length - 1) err('celle duplicate');
        for (const t of tipi) {
          const n = conta(t);
          if (n > 1) err(`${t} × ${n}`);
          freq[t] += n;
        }
        if (piano < I.STANZE_SPECIALI_A3.bisca.daPiano && conta('bisca')) err('bisca al piano 1');
        for (const s of m.stanze.filter((x) => tipi.includes(x.tipo))) {
          const porte = Object.entries(s.porte);
          if (porte.length !== 1) { err(`${s.tipo} con ${porte.length} porte`); continue; }
          const [lato, id] = porte[0];
          const g = m.perId.get(id);
          if (!g || g.tipo !== 'normale') err(`${s.tipo} attaccata a ${g && g.tipo}`);
          if (!g || g.porte[{ N: 'S', S: 'N', E: 'W', W: 'E' }[lato]] !== s.id) err(`${s.tipo} porta non simmetrica`);
          let vicini = 0; let boss = false;
          for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            const o = celle.get(`${s.cx + dx},${s.cy + dy}`);
            if (o) { vicini++; if (o.tipo === 'boss') boss = true; }
          }
          if (vicini !== 1) err(`${s.tipo} tocca ${vicini} stanze`);
          if (boss) err(`${s.tipo} accanto al boss`);
        }
      }
      out[piano] = freq;
    }
    return { frequenze: out, violazioni: v };
  }, SEMI);
  violazioni.push(...gen.violazioni);

  // 2. meccaniche: una run vera, piano con tutte e quattro le stanze
  const prepara = (piano) => p.evaluate((piano) => {
    const I = window.__teatro.interni;
    I.statoRun.fase = 'in_gioco';
    I.nuovaRun(false);
    I.statoRun.siparioAttivo = null;
    I.avviaPiano(piano, false);
    return I.statoRun.piano;
  }, piano);
  /** Entra nella stanza `tipo` dalla sua unica porta, partendo dalla stanza genitore. */
  const vaiIn = (tipo) => p.evaluate((tipo) => {
    const I = window.__teatro.interni;
    for (let k = 0; k < 500 && !I.statoRun.mappa.stanze.some((x) => x.tipo === tipo); k++) I.avviaPiano(I.statoRun.piano, false);
    I.statoRun.siparioAttivo = null;
    const m = I.statoRun.mappa;
    const s = m.stanze.find((x) => x.tipo === tipo);
    const [lato, idG] = Object.entries(s.porte)[0];
    const g = m.perId.get(idG);
    I.statoRun.stanzaCorrente = g; g.pulita = true; g.nemici = [];
    I.statoRun.proiettiliNemici = [];
    I.entraInStanza(s, lato);
    return { dentro: I.statoRun.stanzaCorrente === s, lato };
  }, tipo);
  const oss = {};
  oss.piano = await prepara(2);

  // Sfida: sbarrata senza salute piena, poi ondate
  oss.sfida = {};
  await p.evaluate(() => { const I = window.__teatro.interni; I.statoRun.hpHalf = I.statoRun.maxHpHalf - 1; });
  oss.sfida.senzaSalutePiena = await vaiIn('sfida');
  await p.evaluate(() => { const I = window.__teatro.interni; I.statoRun.hpHalf = I.statoRun.maxHpHalf; });
  oss.sfida.conSalutePiena = await vaiIn('sfida');
  oss.sfida.ondate = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.stanzaCorrente; const S = st.sfidaA3;
    const P = I.STANZE_SPECIALI_A3.sfida.piedistallo;
    const r = { ondateTot: S.ondateTot, prima: { pulita: st.pulita } };
    I.player.x = P.x; I.player.y = P.y + 6;
    I.passoStanzeSpecialiA3();
    r.dopoTocco = { avviata: S.avviata, pulita: st.pulita, nemici: st.nemici.length, ondata: S.ondata };
    I.player.invuln = 99999;
    return r;
  });
  await p.waitForTimeout(250);
  await p.screenshot({ path: foto('sfida-ondata') });
  oss.sfida.fine = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.stanzaCorrente; const S = st.sfidaA3;
    const ondateViste = [S.ondata];
    for (let guard = 0; guard < 20 && !S.finita; guard++) {
      for (const n of st.nemici) n.hp = 0;
      I.verificaStanzaPulita();
      for (let t = 0; t < 200 && S.attesa > 0; t++) I.passoStanzeSpecialiA3();
      if (ondateViste[ondateViste.length - 1] !== S.ondata) ondateViste.push(S.ondata);
    }
    I.player.invuln = 0;
    return { finita: S.finita, pulita: st.pulita, ondateViste, piedistallo: Boolean(st.oggettoPiedistallo && !st.oggettoPiedistallo.preso) };
  });
  const sf = oss.sfida;
  if (sf.senzaSalutePiena.dentro) violazioni.push('Sfida: entrata senza salute piena');
  if (!sf.conSalutePiena.dentro) violazioni.push('Sfida: entrata rifiutata a salute piena');
  if (!sf.ondate.prima.pulita || sf.ondate.dopoTocco.pulita || !sf.ondate.dopoTocco.nemici) violazioni.push('Sfida: il tocco non chiude le porte');
  if (sf.ondate.ondateTot < 2 || sf.ondate.ondateTot > 3) violazioni.push('Sfida: ondate fuori da 2-3');
  if (!sf.fine.finita || !sf.fine.pulita || !sf.fine.piedistallo || sf.fine.ondateViste.length !== sf.ondate.ondateTot) violazioni.push('Sfida: fine sbagliata');

  // Maledetta: prezzo in entrata e in uscita
  oss.maledetta = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const T = I.STANZE_SPECIALI_A3.maledetta;
    I.statoRun.hpHalf = I.statoRun.maxHpHalf; I.player.invuln = 0;
    const m = I.statoRun.mappa; const s = m.stanze.find((x) => x.tipo === 'maledetta');
    const [lato, idG] = Object.entries(s.porte)[0]; const g = m.perId.get(idG);
    I.statoRun.stanzaCorrente = g; g.pulita = true;
    const h0 = I.statoRun.hpHalf;
    I.entraInStanza(s, lato);
    const h1 = I.statoRun.hpHalf;
    const contenuto = s.maledettaA3.contenuto;
    for (const n of s.nemici) n.hp = 0;
    I.verificaStanzaPulita();
    const premio = { monete: s.oggettiATerra.filter((o) => o.tipo === 'moneta').length, oggetto: Boolean(s.oggettoPiedistallo) };
    I.entraInStanza(g, { N: 'S', S: 'N', E: 'W', W: 'E' }[lato]);
    const h2 = I.statoRun.hpHalf;
    // all'ultima mezza Maschera (non letale): non si entra
    I.statoRun.hpHalf = T.costoHalf;
    I.entraInStanza(s, lato);
    const rifiuto = I.statoRun.stanzaCorrente === g && I.statoRun.hpHalf === T.costoHalf;
    I.statoRun.hpHalf = I.statoRun.maxHpHalf;
    return { contenuto, costoEntrata: h0 - h1, costoUscita: h1 - h2, premio, rifiutoAllUltima: rifiuto };
  });
  const ml = oss.maledetta;
  if (ml.costoEntrata !== 1 || ml.costoUscita !== 1) violazioni.push('Maledetta: prezzo dei rovi sbagliato');
  if (!ml.rifiutoAllUltima) violazioni.push('Maledetta: entrata all\'ultima mezza Maschera');
  if (!ml.premio.monete && !ml.premio.oggetto && ml.contenuto !== 'forziere') violazioni.push('Maledetta: nessun premio');
  await vaiIn('maledetta');
  await p.evaluate(() => { const I = window.__teatro.interni; I.player.x = 320; I.player.y = 230; });
  await p.waitForTimeout(250);
  await p.screenshot({ path: foto('rovi') });

  // Sacrificio
  await p.evaluate(() => { const I = window.__teatro.interni; I.statoRun.hpHalf = I.statoRun.maxHpHalf; });
  await vaiIn('sacrificio');
  oss.sacrificio = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const T = I.STANZE_SPECIALI_A3.sacrificio;
    const st = I.statoRun.stanzaCorrente;
    I.statoRun.maxHpHalf = 20; I.statoRun.hpHalf = 20;
    const esiti = [];
    for (let k = 0; k < T.maxSacrifici + 1; k++) {
      I.player.x = 320; I.player.y = 280; I.player.invuln = 0; I.passoStanzeSpecialiA3();
      const h = I.statoRun.hpHalf;
      I.player.x = T.ceppo.x; I.player.y = T.ceppo.y; I.passoStanzeSpecialiA3();
      esiti.push({ costo: h - I.statoRun.hpHalf, fatti: st.sacrificioA3.fatti });
    }
    I.statoRun.hpHalf = 1; I.player.invuln = 0;
    st.sacrificioA3.fatti = 0;
    const r = I.sacrificaA3(st);
    return { esiti, ultimaMezzaRifiutata: r === null && I.statoRun.hpHalf === 1, oggettiATerra: st.oggettiATerra.length };
  });
  const sc = oss.sacrificio;
  const T = await p.evaluate(() => window.__teatro.interni.STANZE_SPECIALI_A3.sacrificio.maxSacrifici);
  if (sc.esiti.slice(0, T).some((e) => e.costo !== 1) || sc.esiti[T].costo !== 0) violazioni.push('Sacrificio: costo o limite sbagliati');
  if (!sc.ultimaMezzaRifiutata) violazioni.push('Sacrificio: preso l\'ultima mezza Maschera');
  await p.evaluate(() => { const I = window.__teatro.interni; I.statoRun.maxHpHalf = 6; I.statoRun.hpHalf = 6; });

  // Bisca
  await vaiIn('bisca');
  oss.bisca = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const T = I.STANZE_SPECIALI_A3.bisca;
    const st = I.statoRun.stanzaCorrente;
    I.statoRun.monete = 30;
    I.player.x = T.banco.x; I.player.y = T.banco.y + 30;
    const esiti = [];
    for (let k = 0; k < T.giocateMax + 1; k++) { const m0 = I.statoRun.monete; I.interagisciStanza(); esiti.push({ esito: st.biscaA3.ultimo && st.biscaA3.ultimo.esito, speso: m0 - I.statoRun.monete }); }
    const r = { giocate: st.biscaA3.giocate, chiuso: st.biscaA3.chiuso, esiti, cartomante: Boolean(st.biscaA3.cartomante) };
    if (st.biscaA3.cartomante) {
      const doni = [];
      for (let k = 0; k < 20 && !st.biscaA3.cartomante.andata; k++) doni.push(I.pagaCartomanteA3(st));
      r.cartomanteDoni = doni; r.cartomanteAndata = st.biscaA3.cartomante.andata;
    }
    I.statoRun.monete = 0;
    r.senzaMonete = I.giocaLottoA3(st);
    // per lo screenshot: banco aperto e cartomante presente
    st.biscaA3.chiuso = false; st.biscaA3.giocate = 0;
    if (st.biscaA3.cartomante) st.biscaA3.cartomante.andata = false; else st.biscaA3.cartomante = { grani: 0, andata: false };
    I.statoRun.monete = 5; I.player.x = 320; I.player.y = 250;
    return r;
  });
  const bi = oss.bisca;
  if (bi.giocate !== (await p.evaluate(() => window.__teatro.interni.STANZE_SPECIALI_A3.bisca.giocateMax)) || !bi.chiuso) violazioni.push('Bisca: limite giocate');
  if (bi.esiti.slice(0, -1).some((e) => e.speso !== 1)) violazioni.push('Bisca: costo giocata');
  if (bi.senzaMonete !== null) violazioni.push('Bisca: si gioca senza monete');
  if (bi.cartomante && !bi.cartomanteAndata) violazioni.push('Cartomante: non se ne va mai');
  await p.waitForTimeout(250);
  await p.screenshot({ path: foto('bisca') });

  await browser.close();
  console.log(JSON.stringify({ file: path.relative(RADICE, file), semi: SEMI, frequenze: gen.frequenze, oss,
    violazioni: violazioni.slice(0, 20), nViolazioni: violazioni.length, errori }, null, 1));
  process.exit(violazioni.length || errori.length ? 1 : 0);
})();
