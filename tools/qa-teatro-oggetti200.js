#!/usr/bin/env node
/*
 * tools/qa-teatro-oggetti200.js — verifica Playwright del catalogo a 200 oggetti (squadra b5, gioco/teatro/b5-oggetti.js).
 * Uso: node tools/qa-teatro-oggetti200.js [file html] [prefisso screenshot]
 * Controlla: 200 id unici (passivi + attivi + patti + segreti); campi di ogni oggetto nuovo (nome, lore, temi, tier,
 * polarità, effetto); quote dei nuovi (≥ 12 attivi, ≥ 15 negativi/misti, «solo numeri» ≤ 1/3, ≥ 12 oggetti per tema);
 * icone 12×12 in palette, tutte diverse; pool della run (20 oggetti, 3 negativi, nessun bloccato); prezzi di
 * ECONOMIA_T3; patti/segreti/attivi bloccati che non escono; OGNI oggetto dato al giocatore e giocato 3 secondi
 * (182 tick) in una stanza con nemici senza errori; meccaniche campione; tutto il catalogo addosso insieme (tetti e
 * tempo per tick); Diario e Stanza dello Sviluppatore a pagine. Screenshot nel prefisso; elenco in <prefisso>-catalogo.json.
 * Esce con 1 se c'è una violazione. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-oggetti200');
fs.mkdirSync(path.dirname(prefisso + '-x.png'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;
const TEMI = ['denari', 'ombra', 'maschera', 'fili', 'sacro', 'fuoco', 'bestia', 'cibo'];

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  const violazioni = [];
  const oss = {};
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const viola = (nome, cond, dati) => { if (!cond) violazioni.push({ nome, dati }); return cond; };

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);

  // Attrezzi di prova dentro la pagina (i nomi di primo livello degli script del gioco sono visibili qui).
  await p.evaluate(() => {
    /* eslint-disable no-undef */
    window.__qaB5 = {
      k: 0,
      nuova() {
        statoRun.fase = 'in_gioco';
        nuovaRun(false);
        statoRun.siparioAttivo = null; statoRun.pausa = false; statoRun.diarioD = null;
        statoRun.viteExtra = 0; statoRun.volo = false; player.volo = false; statoRun.dropDoppi = false; // la base non li azzera fra una run e l'altra
        statoRun.baseMaxHpHalf = 12;
        ricalcolaStatistiche();
        statoRun.hpHalf = statoRun.maxHpHalf;
        return this.stanza(0);
      },
      nemico(i, hp, tipo) {
        const t = tipo || ['guardia', 'gatto', 'statua'][i % 3];
        return { id: `qa-${this.k}-${i}`, tipo: t, patternMob: t, nome: 'Comparsa di prova', boss: false, mobSoldi: false, champion: null,
          x: 430 + (i % 3) * 36, y: 130 + i * 36, hp, maxHp: hp, speed: t === 'statua' ? 0 : 0.9, r: t === 'statua' ? 13 : 11, flash: 0, burnTicks: 0,
          stunTicks: 0, state: 'idle', stateTimer: 20, maskOpen: false, shootCd: 30 + i * 10 };
      },
      stanza(n, hp = 80, tipo = null) {
        const st = { id: `qa-st-${this.k++}`, tipo: 'normale', cx: 1, cy: 1, porte: {}, nemici: [], ostacoli: [], oggettiATerra: [], macchie: [], pozzanghereFuoco: [],
          oggettoPiedistallo: null, ricompensaOggetto: null, slotFucina: [], slotPatto: [], uscitaAperta: false, portaPattoAperta: false, visitata: true, pulita: n === 0, muroSegreto: null };
        for (let i = 0; i < n; i++) st.nemici.push(this.nemico(i, hp, tipo));
        statoRun.stanzaCorrente = st;
        statoRun.proiettili = []; statoRun.proiettiliNemici = []; statoRun.graziaIngressoC = 0;
        player.x = 250; player.y = 190; player.invuln = 0; player.cooldown = 0; player.kbx = 0; player.kby = 0;
        return st;
      },
      ticks(n, tasti = []) {
        for (const t of tasti) keys[t] = true;
        try {
          for (let i = 0; i < n; i++) {
            passoLogico();
            if (i % 20 === 0) { iniziaFrame(); disegnaFrame(16.7); }
          }
        } finally { for (const t of tasti) keys[t] = false; }
      },
      /** Dà l'oggetto `id` e gioca 182 tick (3 s) in una stanza con 3 nemici: spari, un colpo subito, una moneta, uccisioni, stanza ripulita. */
      prova(id) {
        const t0 = performance.now();
        const err = [];
        const orig = console.error;
        console.error = (...a) => { err.push(a.map((x) => (x && x.stack) || String(x)).join(' ')); };
        let colpiMax = 0;
        try {
          this.nuova();
          const st = this.stanza(3, 80);
          this.ticks(2);
          const o = trovaOggettoB(id);
          if (!daiOggettoB5(id)) err.push('non si può dare');
          if (o.attivoB5) { if (!statoRun.oggettoAttivo || statoRun.oggettoAttivo.id !== id) err.push('attivo non in mano'); statoRun.caricaAttivo = statoRun.oggettoAttivo.maxCarica; }
          else if (!statoRun.oggettiEquipaggiati.some((x) => x.id === id)) err.push('non equipaggiato');
          this.ticks(30, ['ArrowRight']);
          if (o.attivoB5) usaOggettoAttivo();
          statoRun.proiettiliNemici.push({ x: player.x + 50, y: player.y - 6, vx: -2, vy: 0, dist: 0 });
          this.ticks(30, ['ArrowRight', 'KeyD']);
          colpiMax = Math.max(colpiMax, statoRun.proiettili.length);
          player.invuln = 0; statoRun.graziaIngressoC = 0;
          subisciColpoGiocatore(1, 'la prova', player.x + 10, player.y);
          st.oggettiATerra.push({ tipo: 'moneta', valore: 1, sprite: 'moneta1', x: player.x + 60, y: player.y });
          this.ticks(40, ['ArrowUp']);
          const vivo = st.nemici.find((n) => n.hp > 0);
          if (vivo) danneggiaNemico(vivo, 9999, 1, 0);
          this.ticks(40, ['ArrowLeft', 'KeyA']);
          colpiMax = Math.max(colpiMax, statoRun.proiettili.length);
          for (const n of st.nemici) if (n.hp > 0) danneggiaNemico(n, 9999, 0, 1);
          this.ticks(40, ['ArrowDown']);
          if (!st.pulita) err.push('stanza non ripulita');
        } catch (e) { err.push(`eccezione: ${(e && e.stack) || e}`); } finally { console.error = orig; }
        const finiti = [statoRun.dmg, statoRun.cooldownMax, statoRun.speed, statoRun.range, statoRun.hpHalf, statoRun.maxHpHalf, player.x, player.y].every(Number.isFinite);
        return { id, ms: Math.round(performance.now() - t0), err, finiti, fase: statoRun.fase, colpiMax, hp: statoRun.hpHalf };
      },
    };
  });

  // ------------------------------------------------------------------ 1. catalogo
  const cat = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const base = ['dmgUp', 'flatDmg', 'dmgMult', 'cadenzaUp', 'cadenzaMult', 'speedUp', 'rangeUp', 'bonusMaxHp', 'healOnEquip', 'size', 'ceraExtra'];
    const nuovi = new Set([...I.nuoviB5.passivi, ...I.nuoviB5.patti, ...I.nuoviB5.segreti, ...I.nuoviB5.attivi]);
    return I.sezioniCatalogoB5().flatMap((s) => s.voci.map((o) => ({
      sezione: s.chiave, id: o.id, sprite: o.sprite, nome: o.nome, tier: o.tier, polarita: o.polarita || null, temi: o.temi || null,
      effetto: o.statsDesc || o.desc || '', lore: o.lore || '', prezzo: o.prezzo != null ? o.prezzo : null, cariche: o.maxCarica || null,
      costo: o.costoMaxHpHalf || null, nuovo: nuovi.has(o.id), soloNumeri: !o.attivoB5 && Object.keys(o.mod || {}).every((k) => base.includes(k)),
      chiavi: Object.keys(o.mod || {}), bloccato: Boolean(I.SBLOCCHI_B5.find((s2) => s2.cosa.oggetto === o.id)),
      condizione: (I.SBLOCCHI_B5.find((s2) => s2.cosa.oggetto === o.id) || {}).condizione || null,
    })));
  });
  fs.writeFileSync(`${prefisso}-catalogo.json`, JSON.stringify(cat, null, 1));
  const ids = cat.map((o) => o.id);
  const nuovi = cat.filter((o) => o.nuovo);
  const perSezione = {};
  for (const o of cat) perSezione[o.sezione] = (perSezione[o.sezione] || 0) + 1;
  const perTema = Object.fromEntries(TEMI.map((t) => [t, nuovi.filter((o) => (o.temi || []).includes(t)).length]));
  const perTemaPassivi = Object.fromEntries(TEMI.map((t) => [t, nuovi.filter((o) => o.sezione === 'passivi' && (o.temi || []).includes(t)).length]));
  oss.catalogo = {
    totale: cat.length, unici: new Set(ids).size, perSezione, nuovi: nuovi.length,
    nuoviAttivi: nuovi.filter((o) => o.sezione === 'attivi').length,
    nuoviNegativiMisti: nuovi.filter((o) => o.polarita === 'negativo' || o.polarita === 'misto').length,
    nuoviSoloNumeri: nuovi.filter((o) => o.soloNumeri).map((o) => o.id),
    perTema, perTemaPassivi, dietroSblocco: cat.filter((o) => o.bloccato).length,
  };
  viola('200 oggetti', cat.length === 200, cat.length);
  viola('id unici', new Set(ids).size === cat.length, ids.filter((x, i) => ids.indexOf(x) !== i));
  viola('120 nuovi', nuovi.length === 120, nuovi.length);
  viola('≥ 12 attivi nuovi', oss.catalogo.nuoviAttivi >= 12, oss.catalogo.nuoviAttivi);
  viola('≥ 15 negativi/misti nuovi', oss.catalogo.nuoviNegativiMisti >= 15, oss.catalogo.nuoviNegativiMisti);
  viola('solo numeri ≤ 1/3 dei nuovi', oss.catalogo.nuoviSoloNumeri.length <= nuovi.length / 3, oss.catalogo.nuoviSoloNumeri.length);
  viola('≥ 12 oggetti nuovi per tema', TEMI.every((t) => perTema[t] >= 12), perTema);
  viola('circa venti dietro sblocco', oss.catalogo.dietroSblocco >= 18 && oss.catalogo.dietroSblocco <= 26, oss.catalogo.dietroSblocco);
  const campiMancanti = nuovi.filter((o) => !o.nome || !o.lore || !o.effetto || !o.tier || !o.polarita || !Array.isArray(o.temi) || !o.temi.length
    || o.temi.some((t) => !TEMI.includes(t))).map((o) => o.id);
  viola('campi dei nuovi completi', campiMancanti.length === 0, campiMancanti);
  const nomi = cat.map((o) => o.nome);
  viola('nomi unici', new Set(nomi).size === nomi.length, nomi.filter((x, i) => nomi.indexOf(x) !== i));

  // ------------------------------------------------------------------ 2. icone
  oss.icone = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const tutti = I.tuttiGliOggettiB5();
    const mancanti = [], malfatte = [];
    const griglie = [];
    for (const o of tutti) {
      const g = I.SPRITE_OGGETTI[o.sprite];
      if (!g) { mancanti.push(o.id); continue; }
      if (g.length !== 12 || g.some((r) => r.length !== 12 || [...r].some((ch) => !(ch in PALETTE)))) malfatte.push(o.id);
      griglie.push([o.id, g.join('')]);
    }
    const uguali = [], vicine = [];
    for (let a = 0; a < griglie.length; a++) {
      for (let b = a + 1; b < griglie.length; b++) {
        let d = 0;
        const A = griglie[a][1], B = griglie[b][1];
        for (let i = 0; i < Math.min(A.length, B.length); i++) if (A[i] !== B[i]) d++;
        if (d === 0) uguali.push([griglie[a][0], griglie[b][0]]);
        else if (d < 30) vicine.push([griglie[a][0], griglie[b][0], d]);
      }
    }
    const colori = griglie.filter(([id]) => I.nuoviB5.passivi.concat(I.nuoviB5.patti, I.nuoviB5.segreti, I.nuoviB5.attivi).includes(id))
      .map(([id, g]) => [id, new Set([...g].filter((ch) => ch !== '.')).size]);
    return { totale: tutti.length, mancanti, malfatte, uguali, vicine, difetti: I.ICONE_B5_DIFETTI.slice(),
      coloriMax: Math.max(...colori.map((c) => c[1])), troppiColori: colori.filter((c) => c[1] > 7) };
  });
  viola('icone presenti', oss.icone.mancanti.length === 0, oss.icone.mancanti);
  viola('icone 12×12 in palette', oss.icone.malfatte.length === 0, oss.icone.malfatte);
  viola('icone scritte bene', oss.icone.difetti.length === 0, oss.icone.difetti);
  viola('icone tutte diverse', oss.icone.uguali.length === 0, oss.icone.uguali);

  // ------------------------------------------------------------------ 3. pool, prezzi, sblocchi
  oss.pool = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const neg = (id) => (trovaOggettoB(id) || {}).polarita === 'negativo';
    const campiona = (n) => {
      const visti = new Set(); let taglia = true, unici = true, quote = true, bloccati = 0;
      for (let i = 0; i < n; i++) {
        inizializzaPoolRunB(null);
        const P = I.statoRun.poolRunB.ids;
        if (P.length !== I.OGGETTI_B.dimensionePool) taglia = false;
        if (new Set(P).size !== P.length) unici = false;
        if (P.filter(neg).length !== Math.round(I.OGGETTI_B.dimensionePool * I.OGGETTI_D.pool.pesoNegativi)) quote = false;
        bloccati += P.filter((id) => !oggettoSbloccatoA6(id)).length;
        P.forEach((id) => visti.add(id));
      }
      return { taglia, unici, quote, bloccati, visti: visti.size, nuoviVisti: I.nuoviB5.passivi.filter((id) => visti.has(id)).length };
    };
    I.azzeraSblocchi();
    const chiuso = campiona(300);
    const pattiChiusi = new Set(), segretiChiusi = new Set(), attiviChiusi = new Set();
    for (let i = 0; i < 300; i++) { pattiChiusi.add(estraiOggettoPatto().id); segretiChiusi.add(estraiOggettoSegreto().id); const a = I.estraiAttivoB5(); if (a) attiviChiusi.add(a.id); }
    const bloccatiB5 = I.SBLOCCHI_B5.map((s) => s.cosa.oggetto);
    I.sbloccaTutto();
    const aperto = campiona(600);
    const patti = new Set(), segreti = new Set(), attivi = new Set();
    for (let i = 0; i < 400; i++) { patti.add(estraiOggettoPatto().id); segreti.add(estraiOggettoSegreto().id); const a = I.estraiAttivoB5(); if (a) attivi.add(a.id); }
    const E = I.ECONOMIA_T3.prezzi;
    const prezziSbagliati = I.CATALOGO_OGGETTI.filter((o) => o.prezzo !== (o.polarita === 'negativo' ? E.negativo : E[o.tier])).map((o) => `${o.id}:${o.prezzo}`);
    const attiviPrezzi = Object.values(I.OGGETTI_ATTIVI).filter((a) => a.prezzo !== E[a.tier]).map((a) => a.id);
    return { chiuso, aperto, bloccatiB5: bloccatiB5.length,
      fuoriChiusi: [...pattiChiusi, ...segretiChiusi, ...attiviChiusi].filter((id) => bloccatiB5.includes(id)),
      patti: patti.size, pattiTot: I.CATALOGO_PATTO.length, segreti: segreti.size, segretiTot: I.CATALOGO_SEGRETO.length,
      attivi: attivi.size, attiviTot: Object.keys(I.OGGETTI_ATTIVI).length, prezziSbagliati, attiviPrezzi, passivi: I.CATALOGO_OGGETTI.length };
  });
  viola('pool chiuso: 20 unici, 3 negativi, nessun bloccato', oss.pool.chiuso.taglia && oss.pool.chiuso.unici && oss.pool.chiuso.quote && oss.pool.chiuso.bloccati === 0, oss.pool.chiuso);
  viola('pool aperto: 20 unici, 3 negativi', oss.pool.aperto.taglia && oss.pool.aperto.unici && oss.pool.aperto.quote, oss.pool.aperto);
  viola('pool aperto: escono tutti i passivi', oss.pool.aperto.visti === oss.pool.passivi, oss.pool.aperto);
  viola('patti/segreti/attivi bloccati non escono', oss.pool.fuoriChiusi.length === 0, oss.pool.fuoriChiusi);
  viola('patti/segreti/attivi sbloccati escono tutti', oss.pool.patti === oss.pool.pattiTot && oss.pool.segreti === oss.pool.segretiTot && oss.pool.attivi >= oss.pool.attiviTot - 1, oss.pool);
  viola('prezzi di ECONOMIA_T3', oss.pool.prezziSbagliati.length === 0 && oss.pool.attiviPrezzi.length === 0, [oss.pool.prezziSbagliati, oss.pool.attiviPrezzi]);

  // Stanze generate: tesoro e Fucina (prezzi per tier, attivi ogni tanto), col codice del gioco
  oss.stanze = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const E = I.ECONOMIA_T3.prezzi;
    const r = { tesori: 0, tesoriAttivi: 0, fucine: 0, fucineAttivi: 0, prezziStrani: [], tierStrani: [] };
    for (let seme = 1; seme <= 160; seme++) {
      const m = I.mappaConSeme(1 + (seme % 4), seme * 7919);
      for (const s of m.stanze) {
        if (s.tipo === 'tesoro' && s.oggettoPiedistallo) { r.tesori++; if (s.oggettoPiedistallo.attivoB5) r.tesoriAttivi++; }
        if (s.tipo === 'fucina') {
          r.fucine++;
          for (const sl of s.slotFucina) {
            if (sl.tipo !== 'oggetto' || !sl.item) continue;
            if (sl.item.attivoB5) r.fucineAttivi++;
            const pieno = sl.item.cuoreB ? E.cuore : sl.item.polarita === 'negativo' ? E.negativo : E[sl.item.tier];
            if (sl.prezzo !== pieno && sl.prezzo !== Math.floor(pieno / 2)) r.prezziStrani.push(`${sl.item.id}:${sl.prezzo}`);
          }
        }
      }
    }
    return r;
  });
  viola('Fucina: prezzi per tier (o saldi)', oss.stanze.prezziStrani.length === 0, oss.stanze.prezziStrani.slice(0, 8));
  viola('attivi in tesoro e Fucina ogni tanto', oss.stanze.tesoriAttivi > 0 && oss.stanze.fucineAttivi > 0
    && oss.stanze.tesoriAttivi < oss.stanze.tesori * 0.45 && oss.stanze.fucineAttivi < oss.stanze.fucine * 0.55, oss.stanze);

  // ------------------------------------------------------------------ 4. ogni oggetto: 3 secondi di gioco
  const prove = [];
  for (let i = 0; i < ids.length; i += 20) {
    const blocco = await p.evaluate((lista) => lista.map((id) => window.__qaB5.prova(id)), ids.slice(i, i + 20));
    prove.push(...blocco);
  }
  const conErrori = prove.filter((r) => r.err.length || !r.finiti || r.fase !== 'in_gioco');
  oss.ciclo = { provati: prove.length, conErrori: conErrori.map((r) => ({ id: r.id, err: r.err.slice(0, 3), finiti: r.finiti, fase: r.fase })),
    msMedio: Math.round(prove.reduce((a, r) => a + r.ms, 0) / prove.length), msMax: Math.max(...prove.map((r) => r.ms)),
    piuLento: prove.slice().sort((a, b) => b.ms - a.ms).slice(0, 3).map((r) => `${r.id}:${r.ms}ms`), colpiMax: Math.max(...prove.map((r) => r.colpiMax)) };
  viola('ogni oggetto: 3 s di gioco senza errori', conErrori.length === 0, oss.ciclo.conErrori.slice(0, 10));

  // ------------------------------------------------------------------ 5. meccaniche campione
  oss.meccaniche = await p.evaluate(() => {
    const Q = window.__qaB5, I = window.__teatro.interni;
    const r = {};
    const con = (ids, n = 0, hp = 400) => { Q.nuova(); const st = Q.stanza(n, hp); Q.ticks(2); for (const id of ids) I.daiOggettoB5(id); Q.ticks(1); return st; };
    let st;
    // divisione: un colpo che finisce genera 2 schegge
    st = con(['melagrana'], 1, 4000); st.nemici[0].x = 330; st.nemici[0].y = 190; st.nemici[0].speed = 0; st.nemici[0].tipo = 'statua'; st.nemici[0].patternMob = 'statua';
    Q.ticks(1, ['ArrowRight']); Q.ticks(26);
    r.divisione = { schegge: statoRun.proiettili.filter((x) => x.b5 && x.b5.figlio).length };
    // ritorno: il colpo gira e torna, poi sparisce
    con(['rocchetto']); Q.ticks(1, ['ArrowRight']);
    let girato = false, vita = 0;
    for (let i = 0; i < 400 && statoRun.proiettili.length; i++) { Q.ticks(1); vita++; if (statoRun.proiettili.some((x) => x.b5 && x.b5.rit === 2)) girato = true; }
    r.ritorno = { girato, vitaTick: vita, rimasti: statoRun.proiettili.length };
    // scia
    con(['olio-lucerna']); Q.ticks(40, ['ArrowRight']);
    r.scia = { pozze: I.statoB5().scie.length, tetto: I.OGGETTI_B5.tetti.scie };
    // crescita
    con(['struffolo']); Q.ticks(1, ['ArrowRight']);
    const d0 = statoRun.proiettili[0].dmg; Q.ticks(30);
    r.crescita = { inizio: +d0.toFixed(2), dopo: statoRun.proiettili[0] ? +statoRun.proiettili[0].dmg.toFixed(2) : null };
    // caricato
    con(['archetto']); Q.ticks(100); Q.ticks(1, ['ArrowRight']);
    r.caricato = { molt: +(statoRun.proiettili[0].dmg / statoRun.dmg).toFixed(2), perforante: statoRun.proiettili[0].piercing };
    // ogni N colpi, retro, laterali, rosa
    con(['erma-giano', 'candelabro']); Q.ticks(1, ['ArrowRight']);
    r.retroLaterali = { colpi: statoRun.proiettili.length };
    con(['tromboncino']); Q.ticks(1, ['ArrowRight']);
    r.rosa = { colpi: statoRun.proiettili.length };
    // scudo a tempo
    con(['ombrello']); Q.ticks(3);
    const hp0 = statoRun.hpHalf; player.invuln = 0; subisciColpoGiocatore(1, 'la prova', 300, 190);
    const parato = statoRun.hpHalf === hp0 && !I.statoB5().scudoPronto;
    I.statoB5().scudoTick = 2; Q.ticks(4);
    r.scudoTempo = { parato, ricaricato: I.statoB5().scudoPronto };
    // gazza: raccoglie una moneta lontana senza che il giocatore si muova
    st = con(['gazza']); const m0 = statoRun.monete; st.oggettiATerra.push({ tipo: 'moneta', valore: 1, sprite: 'moneta1', x: 480, y: 250 }); Q.ticks(260);
    r.gazza = { monete: statoRun.monete - m0, aTerra: st.oggettiATerra.length };
    // paladino: para un proiettile davanti
    con(['pupo-paladino']); Q.ticks(1, ['ArrowRight']); Q.ticks(30);
    statoRun.proiettili = []; statoRun.proiettiliNemici.push({ x: player.x + 60, y: player.y - 6, vx: -2, vy: 0, dist: 0 });
    const hpP = statoRun.hpHalf; Q.ticks(40);
    r.paladino = { parato: statoRun.hpHalf === hpP && statoRun.proiettiliNemici.length === 0 };
    // ingresso in stanza: grancassa e zolfo
    con(['grancassa', 'zolfo']); st = Q.stanza(3, 80); Q.ticks(1);
    r.ingresso = { storditi: st.nemici.filter((n) => n.stunTicks > 0).length, inFiamme: st.nemici.filter((n) => n.burnTicks > 0).length };
    // stanza ripulita: cilindro (+0.05 danno fisso) e biglietto del bis
    con(['cilindro-attore', 'biglietto-bis']); st = Q.stanza(2, 10); Q.ticks(2);
    const dmg0 = statoRun.dmg; statoRun.caricaAttivo = 0;
    for (const n of st.nemici) danneggiaNemico(n, 999, 1, 0); Q.ticks(3);
    r.pulizia = { danno: +(statoRun.dmg - dmg0).toFixed(3), carica: statoRun.caricaAttivo };
    // colpo subito: campanaccio stordisce
    con(['campanaccio', 'peperoncini']); st = Q.stanza(3, 80); Q.ticks(2); player.invuln = 0; statoRun.graziaIngressoC = 0;
    subisciColpoGiocatore(1, 'la prova', 300, 190); Q.ticks(1);
    r.colpoSubito = { storditi: st.nemici.filter((n) => n.stunTicks > 0).length, furia: +I.statoB5().moltDanno.toFixed(2) };
    // ex voto e obolo: il colpo mortale non uccide
    con(['ex-voto']); statoRun.hpHalf = 1; player.invuln = 0; subisciColpoGiocatore(2, 'la prova', 300, 190);
    r.exVoto = { hp: statoRun.hpHalf, fase: statoRun.fase, salva: I.statB5().salvaPiano, banner: statoRun.banner, invuln: player.invuln, vite: statoRun.viteExtra, max: statoRun.maxHpHalf };
    con(['obolo']); statoRun.monete = 7; statoRun.hpHalf = 1; player.invuln = 0; subisciColpoGiocatore(2, 'la prova', 300, 190);
    r.obolo = { hp: statoRun.hpHalf, monete: statoRun.monete, fase: statoRun.fase };
    // raccolta: porcellino cura ogni 6 monete
    con(['porcellino']); statoRun.hpHalf = 4; for (let i = 0; i < 6; i++) { statoRun.monete++; Q.ticks(1); }
    r.raccolta = { hp: statoRun.hpHalf };
    // notte: Luna nel Pozzo cresce con le notti
    const notte = localStorage.getItem('ferruccio_notte');
    localStorage.setItem('ferruccio_notte', '2'); con(['luna-pozzo']); const dn2 = statoRun.dmg;
    localStorage.setItem('ferruccio_notte', '9'); ricalcolaStatistiche(); const dn9 = statoRun.dmg;
    if (notte === null) localStorage.removeItem('ferruccio_notte'); else localStorage.setItem('ferruccio_notte', notte);
    r.notte = { notte2: +dn2.toFixed(2), notte9: +dn9.toFixed(2) };
    // pubblico: senza la sonda l'oggetto vale i soli numeri; con la sonda al massimo il danno sale
    // (col pubblico vero di b1 la sonda esiste: la si toglie per misurare il caso «senza», poi la si rimette)
    const sondaVera = I.gradimentoPubblico; delete I.gradimentoPubblico;
    con(['rosa-loggione'], 1); Q.ticks(31); const senza = I.statoB5().moltDanno;
    I.gradimentoPubblico = 1; Q.ticks(31); const colPubblico = I.statoB5().moltDanno; delete I.gradimentoPubblico;
    if (sondaVera !== undefined) I.gradimentoPubblico = sondaVera;
    r.pubblico = { senza: +senza.toFixed(2), entusiasta: +colPubblico.toFixed(2) };
    // bottega: sconto del 25%
    con(['polizza-monte']); st = Q.stanza(0); st.tipo = 'fucina';
    st.slotFucina = [{ tipo: 'oggetto', item: { ...trovaOggettoB('chiodo') }, prezzo: 5, tier: 'base', x: 374, y: 196, comprato: false }, { tipo: 'cura', prezzo: 3, x: 266, y: 196, comprato: false }];
    Q.ticks(1);
    r.sconto = st.slotFucina.map((s) => s.prezzo);
    // oggetto attivo sul piedistallo: scambio con quello in mano
    con([]); st = Q.stanza(0); const prima = statoRun.oggettoAttivo.id;
    st.oggettoPiedistallo = { ...I.OGGETTI_ATTIVI.clessidra, x: 320, y: 192, preso: false };
    player.x = 320; player.y = 200; interagisciStanza();
    r.scambio = { prima, inMano: statoRun.oggettoAttivo.id, sulPiedistallo: st.oggettoPiedistallo.id, preso: st.oggettoPiedistallo.preso, carica: statoRun.caricaAttivo };
    interagisciStanza();
    r.scambio.ritorno = statoRun.oggettoAttivo.id;
    // indulgenza: il patto non costa
    con(['indulgenza']); Q.ticks(2); const max0 = statoRun.baseMaxHpHalf;
    statoRun.baseMaxHpHalf -= 2; statoRun.oggettiEquipaggiati.push({ ...trovaOggettoB('patto_marchio') }); ricalcolaStatistiche(); dopoRaccoltaD(trovaOggettoB('patto_marchio'));
    r.indulgenza = { prima: max0, dopo: statoRun.baseMaxHpHalf };
    // lucciola: niente buio
    con(['lucciola-barattolo']); statoRun.maledizioniD.buio = statoRun.piano;
    r.lucciola = { buio: maledizioneD('buio') };
    return r;
  });
  const M = oss.meccaniche;
  viola('colpi che si dividono', M.divisione.schegge === 2, M.divisione);
  viola('colpi che tornano indietro', M.ritorno.girato && M.ritorno.rimasti === 0, M.ritorno);
  viola('colpi che lasciano scie', M.scia.pozze > 0 && M.scia.pozze <= M.scia.tetto, M.scia);
  viola('colpi che crescono', M.crescita.dopo > M.crescita.inizio, M.crescita);
  viola('colpo caricato', M.caricato.molt > 3 && M.caricato.perforante, M.caricato);
  viola('retro e laterali', M.retroLaterali.colpi === 4, M.retroLaterali);
  viola('rosa di 5', M.rosa.colpi === 5, M.rosa);
  viola('scudo a tempo', M.scudoTempo.parato && M.scudoTempo.ricaricato, M.scudoTempo);
  viola('famiglio che raccoglie', M.gazza.monete === 1 && M.gazza.aTerra === 0, M.gazza);
  viola('famiglio che para', M.paladino.parato, M.paladino);
  viola('effetti all\'ingresso', M.ingresso.storditi === 3 && M.ingresso.inFiamme === 3, M.ingresso);
  viola('effetti a stanza ripulita', M.pulizia.danno > 0.04 && M.pulizia.carica === 2, M.pulizia);
  viola('effetti al colpo subito', M.colpoSubito.storditi === 3 && M.colpoSubito.furia > 1.5, M.colpoSubito);
  viola('ex voto', M.exVoto.hp === 1 && M.exVoto.fase === 'in_gioco', M.exVoto);
  viola('obolo', M.obolo.hp === 1 && M.obolo.monete === 2 && M.obolo.fase === 'in_gioco', M.obolo);
  viola('raccolta di monete', M.raccolta.hp === 5, M.raccolta);
  viola('legati alla notte', M.notte.notte9 > M.notte.notte2, M.notte);
  viola('legati al pubblico (ignorati senza sonda)', M.pubblico.senza === 1 && M.pubblico.entusiasta > 1.3, M.pubblico);
  viola('sconto in Fucina', M.sconto[0] === 4 && M.sconto[1] === 2, M.sconto);
  viola('scambio dell\'attivo', M.scambio.inMano === 'clessidra' && M.scambio.sulPiedistallo === M.scambio.prima && !M.scambio.preso && M.scambio.ritorno === M.scambio.prima, M.scambio);
  viola('indulgenza', M.indulgenza.dopo === M.indulgenza.prima, M.indulgenza);
  viola('lucciola scaccia il buio', M.lucciola.buio === false, M.lucciola);

  // ------------------------------------------------------------------ 6. tutto il catalogo addosso: tetti e tempo per tick
  const carico = (conOggetti) => p.evaluate((pieno) => {
    const Q = window.__qaB5, I = window.__teatro.interni;
    Q.nuova();
    // Qui si misura il costo degli OGGETTI: gli effetti di scena delle altre squadre (ombre lunghe, pubblico, grana,
    // vignetta) si spengono, altrimenti il loro disegno software si somma e la misura non dice più niente sugli oggetti.
    for (const k of ['ombre', 'pubblico', 'grana', 'vignetta']) OPZIONI[k] = false;
    if (pieno) {
      for (const o of I.CATALOGO_OGGETTI) if (!(o.mod && (o.mod.maledizione || o.mod.spada || o.mod.laser))) I.daiOggettoB5(o.id);
      for (const id of I.nuoviB5.patti.concat(I.nuoviB5.segreti)) I.daiOggettoB5(id);
    }
    const st = Q.stanza(8, 100000);
    let colpiMax = 0, scieMax = 0, famMax = 0, nemMax = 0;
    const err = [];
    const orig = console.error;
    console.error = (...a) => { err.push(a.map(String).join(' ')); };
    const N = 900;
    let msTick = 0, msFrame = 0;
    try {
      for (let i = 0; i < N; i++) {
        const tasto = ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown'][Math.floor(i / 40) % 4];
        keys[tasto] = true; keys.KeyD = i % 80 < 40; keys.KeyA = !keys.KeyD;
        if (i % 20 === 0) for (let k = 0; k < 6; k++) statoRun.proiettiliNemici.push({ x: 320 + k * 30, y: 100, vx: 0, vy: 2, dist: 0 });
        if (i % 50 === 0) st.oggettiATerra.push({ tipo: 'moneta', valore: 1, sprite: 'moneta1', x: 200 + (i % 300), y: 240 });
        statoRun.hpHalf = statoRun.maxHpHalf;
        const t0 = performance.now();
        passoLogico();
        const t1 = performance.now();
        iniziaFrame(); disegnaFrame(16.7);
        msTick += t1 - t0; msFrame += performance.now() - t1;
        keys[tasto] = false;
        colpiMax = Math.max(colpiMax, statoRun.proiettili.length);
        scieMax = Math.max(scieMax, I.statoB5().scie.length);
        famMax = Math.max(famMax, I.statoB5().famigli.length + (statoRun.famigliD || []).length);
        nemMax = Math.max(nemMax, statoRun.proiettiliNemici.length);
      }
    } catch (e) { err.push(String((e && e.stack) || e)); } finally { console.error = orig; keys.KeyD = false; keys.KeyA = false; }
    return { oggetti: statoRun.oggettiEquipaggiati.length, msTick: +(msTick / N).toFixed(3), msFrame: +(msFrame / N).toFixed(2), colpiMax, scieMax, famMax, nemMax, err: err.slice(0, 5),
      danno: +statoRun.dmg.toFixed(1), cadenza: +statoRun.colpiAlSec.toFixed(2), tettoColpi: I.OGGETTI_D.clamp.proiettiliGiocatore + I.OGGETTI_B5.tetti.proiettiliExtra, fase: statoRun.fase };
  }, conOggetti);
  oss.caricoVuoto = await carico(false);
  oss.carico = await carico(true);
  viola('tutto addosso: nessun errore', oss.carico.err.length === 0 && oss.carico.fase === 'in_gioco', oss.carico.err);
  viola('tutto addosso: tetti rispettati', oss.carico.colpiMax <= oss.carico.tettoColpi && oss.carico.scieMax <= 36 && oss.carico.famMax <= 4 + 4 + 3 + 3, oss.carico);
  // 60 fps = 16,7 ms a frame: la logica con tutto il catalogo addosso deve restare una piccola parte del frame,
  // e il frame intero (disegno software del browser di prova compreso) sotto il tempo di un frame.
  viola('tutto addosso: logica < 2 ms per tick', oss.carico.msTick < 2, oss.carico.msTick);
  viola('tutto addosso: tick + frame < 16 ms', oss.carico.msTick + oss.carico.msFrame < 16, [oss.carico.msTick, oss.carico.msFrame]);

  // ------------------------------------------------------------------ 7. sblocchi
  oss.sblocchi = await p.evaluate(() => {
    const I = window.__teatro.interni;
    I.azzeraSblocchi();
    I.progressione.controlla();
    const prima = { exVoto: I.oggettoSbloccatoB5('ex-voto'), libero: I.oggettoSbloccatoB5('melagrana') };
    I.progressione.bossSconfitto({ nemici: [{ boss: true, bossId: 'colosso-statua' }] });
    const dopo = I.oggettoSbloccatoB5('ex-voto');
    const stato = I.progressione.stato.sbloccati;
    return { prima, dopo, chiaviB5: Object.keys(stato).filter((k) => k.startsWith('b5-')).length };
  });
  viola('sblocco dietro boss', oss.sblocchi.prima.exVoto === false && oss.sblocchi.prima.libero === true && oss.sblocchi.dopo === true, oss.sblocchi);

  // ------------------------------------------------------------------ 8. screenshot: Diario, pannello, effetti in gioco
  await p.evaluate(() => {
    const I = window.__teatro.interni;
    I.sbloccaTutto();
    const sv = window.__teatroT3 && window.__teatroT3.salvataggi;
    const noti = I.tuttiGliOggettiB5().map((o) => o.id).filter((id, i) => i % 9 !== 4);
    if (sv) sv.impostaFlag('oggettiConosciuti', noti);
    a6.coda.length = 0; a6.notifica = null; sblocchiB5.coda.length = 0; // niente cartigli «SBLOCCATO» sopra le foto
    window.__qaB5.nuova();
    statoRun.pausa = true;
    apriDiarioD();
  });
  oss.diario = { pagine: await p.evaluate(() => pagineDiarioB5().map((pg) => `${pg.titolo}: ${pg.voci.length}`)) };
  viola('Diario: tutte le voci in pagine', oss.diario.pagine.length >= 6, oss.diario.pagine);
  for (const [i, nome] of [[0, 'diario-1-vecchi'], [1, 'diario-2-nuovi'], [2, 'diario-3-nuovi'], [3, 'diario-4-attivi'], [4, 'diario-5-patti'], [5, 'diario-6-segreti']]) {
    await p.evaluate(([pag]) => { statoRun.diarioD.pagB5 = pag; statoRun.diarioD.selB5 = pag === 1 ? 15 : 3; }, [i]);
    await p.waitForTimeout(120);
    await p.screenshot({ path: foto(nome) });
  }
  // navigazione da tastiera: E cambia pagina, C va ai consumabili e torna
  await p.evaluate(() => { statoRun.diarioD.pagB5 = 0; statoRun.diarioD.selB5 = 0; });
  await p.keyboard.press('KeyE'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowDown');
  const nav = await p.evaluate(() => ({ pag: statoRun.diarioD.pagB5, sel: statoRun.diarioD.selB5 }));
  await p.keyboard.press('KeyC');
  const consumabili = await p.evaluate(() => Boolean(statoRun.diarioD && statoRun.diarioD.paginaA2));
  await p.keyboard.press('KeyC');
  await p.keyboard.press('Escape');
  const chiuso = await p.evaluate(() => statoRun.diarioD === null);
  oss.diario.navigazione = { nav, consumabili, chiuso };
  viola('Diario: tasti', nav.pag === 1 && nav.sel === 9 && consumabili && chiuso, oss.diario.navigazione);

  // Stanza dello Sviluppatore a pagine
  await p.evaluate(() => {
    const Q = window.__qaB5; Q.nuova(); const st = Q.stanza(0); st.tipo = 'sviluppatore';
    apriPannelloSviluppatoreB(st); statoRun.pannelloB.sel = 70;
  });
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('sviluppatore-pagina-2') });
  await p.keyboard.press('PageDown');
  oss.pannello = await p.evaluate(() => ({ sel: statoRun.pannelloB.sel, cellaVisibile: cellaPannelloB(statoRun.pannelloB.sel).x > 0, cellaAltraPagina: cellaPannelloB(0).x < 0 }));
  viola('Sviluppatore a pagine', oss.pannello.sel === 108 && oss.pannello.cellaVisibile && oss.pannello.cellaAltraPagina, oss.pannello);
  await p.keyboard.press('Escape');

  // Effetti in gioco (ciclo vero del gioco, tasti veri)
  const scena = async (nome, prepara, tasti, ms) => {
    await p.evaluate(prepara);
    for (const t of tasti) await p.keyboard.down(t);
    await p.waitForTimeout(ms);
    await p.screenshot({ path: foto(nome) });
    for (const t of tasti) await p.keyboard.up(t);
  };
  await scena('effetto-1-colpi', () => {
    const Q = window.__qaB5, I = window.__teatro.interni; Q.nuova(); const st = Q.stanza(4, 900);
    for (const id of ['rocchetto', 'olio-lucerna', 'melagrana', 'struffolo', 'candelabro']) I.daiOggettoB5(id);
    st.nemici.forEach((n, i) => { n.x = 400 + (i % 2) * 70; n.y = 130 + i * 38; });
    player.x = 200; player.y = 190; statoRun.banner = ''; statoRun.cartiglioD = null;
  }, ['ArrowRight'], 1500);
  await scena('effetto-2-famigli', () => {
    const Q = window.__qaB5, I = window.__teatro.interni; Q.nuova(); const st = Q.stanza(3, 900);
    for (const id of ['gazza', 'pupo-paladino', 'zampognaro', 'lucciola-barattolo', 'fuochista', 'presepe_intero']) I.daiOggettoB5(id);
    for (let i = 0; i < 5; i++) st.oggettiATerra.push({ tipo: 'moneta', valore: 1, sprite: 'moneta1', x: 180 + i * 60, y: 250 });
    player.x = 230; player.y = 180; statoRun.cartiglioD = null;
  }, ['ArrowRight'], 1700);
  await scena('effetto-3-scudo-carica-pozza', () => {
    const Q = window.__qaB5, I = window.__teatro.interni; Q.nuova(); const st = Q.stanza(3, 900);
    for (const id of ['ombrello', 'archetto', 'acqua-montevergine', 'girandola', 'acquasantiera']) I.daiOggettoB5(id);
    st.nemici.forEach((n, i) => { n.x = 300 + i * 40; n.y = 200 + (i % 2) * 20; n.speed = 0.3; });
    player.x = 250; player.y = 205; statoRun.caricaAttivo = 9; usaOggettoAttivo(); statoRun.cartiglioD = null;
  }, ['KeyD'], 1600);
  await scena('effetto-4-tesoro-attivo', () => {
    const Q = window.__qaB5, I = window.__teatro.interni; Q.nuova(); const st = Q.stanza(0); st.tipo = 'tesoro';
    st.oggettoPiedistallo = { ...I.OGGETTI_ATTIVI['tric-trac'], x: 320, y: 192, preso: false, forteGratis: false };
    for (const id of ['cilindro-attore', 'quaterna', 'sorbetto', 'porcellino', 'ciuccio', 'patto_eco']) I.daiOggettoB5(id);
    player.x = 262; player.y = 222; statoRun.cartiglioD = null; statoRun.banner = '';
  }, [], 500);
  await scena('effetto-5-attivo-tric-trac', () => {
    const Q = window.__qaB5, I = window.__teatro.interni; Q.nuova(); const st = Q.stanza(5, 900);
    I.daiOggettoB5('tric-trac'); I.daiOggettoB5('castagnola');
    st.nemici.forEach((n, i) => { const a = i * 1.26; n.x = 320 + Math.cos(a) * 90; n.y = 190 + Math.sin(a) * 60; n.speed = 0.2; });
    player.x = 320; player.y = 190; statoRun.caricaAttivo = 9; statoRun.cartiglioD = null; usaOggettoAttivo();
  }, [], 330);

  // Tavola di tutte le icone nuove (per l'autore: le rifà col generatore)
  await p.evaluate(() => {
    const I = window.__teatro.interni;
    statoRun.fase = 'menu_selezione';
    const lista = I.nuoviB5.passivi.concat(I.nuoviB5.patti, I.nuoviB5.segreti, I.nuoviB5.attivi);
    window.__tavolaB5 = () => {
      ctx.save();
      ctx.fillStyle = '#1c130c'; ctx.fillRect(0, 0, W, H);
      lista.forEach((id, i) => {
        const x = 22 + (i % 15) * 42, y = 20 + Math.floor(i / 15) * 43;
        ctx.fillStyle = '#2a1d14'; ctx.fillRect(x - 17, y - 16, 36, 40);
        drawPixelSprite(I.SPRITE_OGGETTI[id], x + 1, y, 2);
        drawTextFit(id, x + 1, y + 21, 36, { size: 5.5, color: '#e6d2aa', shadow: false });
      });
      ctx.restore();
    };
    const base = disegnaFrame;
    disegnaFrame = function (...a) { const r = base.apply(this, a); window.__tavolaB5(); return r; };
  });
  await p.waitForTimeout(200);
  await p.screenshot({ path: foto('icone-nuove') });

  oss.erroriConsole = errori.slice(0, 10);
  viola('nessun errore di console', errori.length === 0, errori.slice(0, 10));
  oss.violazioni = violazioni;
  console.log(JSON.stringify(oss, null, 1));
  await browser.close();
  process.exit(violazioni.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
