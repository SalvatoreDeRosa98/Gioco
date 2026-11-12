#!/usr/bin/env node
/*
 * tools/qa-teatro-morte.js — verifica Playwright del bug autore «quando perdo si freeza, non esce che sono morto».
 *
 * Uso: node tools/qa-teatro-morte.js <file html> [prefisso screenshot]
 * Da file://, 1280x720. Per ogni caso: menu → hub → piano 1, poi la morte arriva davvero dalla logica del gioco
 * (contatto, proiettile di nemico comune, colpo del boss Re-Gatto, esplosione di un Bozzo colpito da un
 * proiettile del giocatore, due colpi letali nello stesso tick, a mezza maschera e a maschere piene, con il menu
 * ESC o un cartiglio appena chiusi). Si controlla che la fase passi per 'morte' (con il messaggio) e torni
 * all'hub entro 6 s, poi il watchdog: una sequenza bloccata a forza deve tornare all'hub entro ~6 s.
 * Screenshot in production/qa/evidence/teatro-bug-morte-[<prefisso>-]*.png. Esce con codice 1 se un caso fallisce.
 * Chromium preinstallato nella sessione: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const { TEMPI_STRETTI } = require('./qa-teatro-comune');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] ? process.argv[3] + '-' : '';
// un prefisso assoluto (es. cartella scratchpad) scrive lì, fuori dal repo
const foto = (n) => (path.isAbsolute(process.argv[3] || '') ? process.argv[3] + '-' + n + '.png'
  : path.join(RADICE, 'production', 'qa', 'evidence', `teatro-bug-morte-${prefisso}${n}.png`));

/** Casi: stanza, maschere iniziali, come arriva il colpo. */
const CASI = [
  { id: 'contatto-mezza', stanza: 'normale', hp: 1, come: 'contatto' },
  { id: 'contatto-zero-piene', stanza: 'normale', hp: 6, come: 'contatto' },
  { id: 'proiettile', stanza: 'normale', hp: 1, come: 'proiettile' },
  { id: 'doppio-colpo', stanza: 'normale', hp: 1, come: 'doppio' },
  { id: 'bomba', stanza: 'normale', hp: 2, come: 'bomba' },
  { id: 'boss-regatto', stanza: 'boss', hp: 2, come: 'boss' },
  { id: 'esc-chiuso', stanza: 'normale', hp: 1, come: 'proiettile', prima: 'esc' },
  { id: 'cartiglio-chiuso', stanza: 'boss', hp: 2, come: 'boss', prima: 'cartiglio', boss: 'donna-luciana' },
  { id: 'watchdog', stanza: 'normale', hp: 1, come: 'proiettile', blocca: true },
];

(async () => {
  const browser = await chromium.launch();
  const esiti = [];
  let errori = [];
  for (const caso of CASI) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const err = [];
    const avvisi = [];
    p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); else if (m.type() === 'warning') avvisi.push(m.text()); });
    p.on('pageerror', (e) => err.push(String(e)));
    await p.goto('file://' + file);
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForTimeout(400);
    await p.keyboard.press('Space'); // menu → hub
    await p.waitForTimeout(300);
    const chiudi = async () => {
      for (let i = 0; i < 40; i++) {
        const d = await p.evaluate(() => window.__teatro.t4qa.dialogo);
        if (!d) return;
        await p.keyboard.press(d.scelta ? 'Digit1' : 'Space');
        await p.waitForTimeout(50);
      }
    };
    await chiudi();
    const ing = await p.evaluate(() => window.__teatro.t4qa.ingresso);
    await p.evaluate((g) => { const P = window.__teatro.interni.player; P.x = g.x - 40; P.y = g.y; }, ing);
    await p.keyboard.down('KeyD'); await p.waitForTimeout(900); await p.keyboard.up('KeyD');
    await p.keyboard.press('Space'); // alza il sipario
    await p.waitForTimeout(150);
    // Prepara la stanza: il colpo letale lo dà la logica del gioco al tick successivo.
    await p.evaluate((c) => {
      const I = window.__teatro.interni; const R = I.statoRun;
      R.siparioAttivo = null;
      const st = R.mappa.stanze.find((s) => s.tipo === c.stanza);
      if (c.stanza === 'boss') {
        const b = st.nemici[0];
        const id = c.boss || 're-gatto';
        b.bossId = id; b.airZ = 0;
        if (id === 're-gatto') { b.pattern = 'salto_gatto'; b.nome = 'Il Gatto dei Quattro Canti'; b.tipo = 'gatto'; }
      }
      if (c.come === 'bomba') {
        st.nemici = [{ id: 'qa-bozzo', tipo: 'bomba_ferma', patternMob: 'bomba_ferma', nome: 'Bozzo Esplosivo', boss: false,
          x: 360, y: 188, hp: 1, maxHp: 12, speed: 0, r: 11, flash: 0, burnTicks: 0, stunTicks: 0, state: 'idle', stateTimer: 30, shootCd: 999 }];
      }
      // La stanza è messa a mano (senza entraInStanza): si azzera la grazia d'ingresso di C (700 ms senza danni,
      // voluta) rimasta dall'ingresso nella prima stanza, altrimenti il colpo preparato cade nella grazia.
      R.graziaIngressoC = 0;
      if (c.come === 'contatto') {
        // Il contatto ripetuto serve un nemico che resti vivo: con la stanza «Deposito di Polvere» (solo Bozzi,
        // a caso secondo il seme) i Bozzi esplodono dopo la miccia e la stanza resta senza nemici. Si tolgono i
        // Bozzi e, se non resta nessuno, si mette un Torrione di Marmo fermo.
        st.nemici = st.nemici.filter((x) => x.hp > 0 && (x.patternMob || x.tipo) !== 'bomba_ferma');
        if (!st.nemici.length) st.nemici = [{ id: 'qa-torrione', tipo: 'statua', nome: 'Torrione di Marmo', boss: false,
          x: 320, y: 150, hp: 22, maxHp: 22, speed: 0, r: 13, flash: 0, burnTicks: 0, stunTicks: 0, state: 'idle', stateTimer: 30, shootCd: 76 }];
      }
      st.visitata = true; R.stanzaCorrente = st; R.proiettiliNemici = [];
      R.hpHalf = c.hp; I.player.invuln = 0;
      const n = st.nemici.find((x) => x.hp > 0);
      if (c.come === 'contatto' || c.come === 'boss') { I.player.x = n.x + 4; I.player.y = n.y; }
      if (c.come === 'proiettile' || c.come === 'doppio') {
        I.player.x = 200; I.player.y = 250;
        R.proiettiliNemici.push({ x: 200, y: 244, vx: 0.01, vy: 0, dist: 0 });
        if (c.come === 'doppio') { R.proiettiliNemici.push({ x: 200, y: 244, vx: -0.01, vy: 0, dist: 0, bossShot: true }); I.player.x = n.x + 2; I.player.y = n.y; R.proiettiliNemici.forEach((q) => { q.x = n.x + 2; q.y = n.y - 6; }); }
      }
      if (c.come === 'bomba') { I.player.x = 336; I.player.y = 188; I.player.dirX = 1; I.player.dirY = 0; }
    }, caso);
    if (caso.prima === 'esc') { await p.keyboard.press('Escape'); await p.waitForTimeout(80); await p.keyboard.press('Escape'); }
    if (caso.come === 'bomba') await p.keyboard.press('Space'); // il colpo fa esplodere il Bozzo addosso al giocatore
    if (caso.prima === 'cartiglio') {
      // la rivelazione di Donna Luciana apre un cartiglio all'ingresso: lo si chiude e si muore subito dopo
      for (let i = 0; i < 10 && !(await p.evaluate(() => window.__teatro.t4qa.dialogo)); i++) await p.waitForTimeout(50);
      await chiudi();
      await p.evaluate(() => { const I = window.__teatro.interni; const b = I.statoRun.stanzaCorrente.nemici[0]; I.player.invuln = 0; I.statoRun.graziaIngressoC = 0; I.player.x = b.x + 4; I.player.y = b.y; });
    }
    const t0 = Date.now();
    const fasi = [];
    let messaggio = null; let fotoFatta = false; let bloccata = false; let tMorte = null; let tickMorte = null; let tickHub = null;
    while (Date.now() - t0 < 20000) {
      const s = await p.evaluate(() => ({ f: window.__teatro.fase, m: window.__teatro.t4qa.morte, tick }));
      if (s.f === 'morte' && tMorte === null) { tMorte = Date.now(); tickMorte = s.tick; }
      if (s.f === 'hub' && tickHub === null) tickHub = s.tick;
      if (fasi[fasi.length - 1] !== s.f) fasi.push(s.f);
      if (s.f === 'morte' && caso.blocca && !bloccata) bloccata = await p.evaluate(() => window.__teatro.t4qa.bloccaMorte());
      if (s.f === 'morte' && s.m && s.m.f === 'fili' && !fotoFatta) { fotoFatta = true; messaggio = s.m; await p.screenshot({ path: foto(caso.id) }); }
      if (s.f === 'hub') break;
      if (s.f === 'in_gioco' && caso.come === 'contatto') {
        // a maschere piene servono più contatti: si torna addosso a un nemico vivo (anche se è fermo)
        await p.evaluate(() => { const I = window.__teatro.interni; const n = I.statoRun.stanzaCorrente.nemici.find((x) => x.hp > 0); if (n) { I.player.x = n.x + 4; I.player.y = n.y; } });
      }
      await p.waitForTimeout(100);
    }
    const ms = tMorte === null ? null : Date.now() - tMorte; // durata della sequenza in tempo reale, fino all'hub
    // Durata in TEMPO DI GIOCO (tick a 60 Hz): a macchina carica i ms reali si allungano anche se la sequenza
    // è giusta. La sequenza normale deve finire entro 6 s di gioco (360 tick). Il caso «watchdog» blocca la
    // logica apposta, quindi lì conta il tempo reale: deve tornare all'hub col ritorno forzato del watchdog
    // (avviso in console) e, con QA_TEMPI=stretti, entro 7,5 s reali.
    const msGioco = tickMorte === null || tickHub === null ? null : Math.round(((tickHub - tickMorte) * 1000) / 60);
    const forzato = avvisi.some((a) => a.includes('ritorno all\'hub forzato'));
    const tempoOk = caso.blocca ? forzato && (!TEMPI_STRETTI || ms < 7500) : (TEMPI_STRETTI ? ms < 6000 : msGioco !== null && msGioco < 6000);
    const fasiOk = fasi.includes('morte') && fasi[fasi.length - 1] === 'hub' && !fasi.slice(fasi.indexOf('morte')).includes('in_gioco');
    const ok = fasiOk && ms !== null && tempoOk && !err.length;
    esiti.push({ caso: caso.id, ok, fasi: fasi.join('>'), ms, msGioco, forzato, fotoFase: messaggio && messaggio.f, errori: err });
    errori = errori.concat(err);
    if (caso.id === 'proiettile') { await p.waitForTimeout(900); await p.screenshot({ path: foto('ritorno-hub') }); }
    await p.close();
  }
  await browser.close();
  console.log(JSON.stringify({ file: path.relative(RADICE, file), esiti, erroriConsole: errori.length }, null, 1));
  process.exit(esiti.every((e) => e.ok) ? 0 : 1);
})();
