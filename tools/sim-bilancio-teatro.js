#!/usr/bin/env node
/*
 * tools/sim-bilancio-teatro.js — simulazione dell'economia del Teatro (miglioramento 7, parte B).
 * NON è un bot che gioca: nel browser (Playwright, file://) usa il codice VERO del gioco per generare i piani
 * (generaMappaPiano con lucchetti A1, stanze speciali A3, Fucina A2) e per i drop (danneggiaNemico,
 * verificaStanzaPulita avvolta da T3/A1/A2, spawnaMonetaATerra col filtro del piano 1, apriForziereA1):
 * per ogni piano si «abbattono» d'ufficio tutti i nemici delle stanze di combattimento, del boss e della
 * segreta e si conta cosa cade. Le stanze speciali (sacrificio, rovi, bisca) si valutano in valore atteso
 * dalle loro tabelle (STANZE_SPECIALI_A3) con una politica dichiarata sotto.
 *
 * Politica della chiave: le chiavi si portano da un piano all'altro; a ogni piano si aprono prima i
 * lucchetti (tesoro, poi Fucina), poi i forzieri chiusi con le chiavi avanzate. Si raccoglie tutto.
 *
 * Uso: node tools/sim-bilancio-teatro.js [file html] [run=400] [piani=4] [--json file] [--controllo] [--solo-economia]
 * Esce con 1 se la media delle monete al piano 1 è fuori da [5, 8]. Con --controllo esce con 1 se un valore
 * qualsiasi (economia e combattimento, vedi FASCE) esce dalla sua fascia: il bilancio come prova ripetibile.
 * Parte «combattimento» (e3): DPS misurato col codice vero per i 4 personaggi, boss e Grande Burattinaio.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const iJson = argv.indexOf('--json');
const fileJson = iJson >= 0 ? argv.splice(iJson, 2)[1] : null;
const CONTROLLO = argv.includes('--controllo');
const SOLO_ECONOMIA = argv.includes('--solo-economia');
for (const o of ['--controllo', '--solo-economia']) { const i = argv.indexOf(o); if (i >= 0) argv.splice(i, 1); }
const file = path.resolve(RADICE, argv[0] || 'gioco/teatro_marionette.html');
const NRUN = Math.max(1, parseInt(argv[1], 10) || (CONTROLLO ? 200 : 400));
const NPIANI = Math.max(1, parseInt(argv[2], 10) || 4);
const OBIETTIVO_P1 = { min: 5, max: 8 };

/** Nel browser: simula NRUN run di NPIANI piani con il codice del gioco. */
function simulaNelGioco({ nRun, nPiani }) {
  const I = window.__teatro.interni;
  const R = statoRun;
  const P = player;
  const out = [];
  R.fase = 'in_gioco';
  const salvaBanner = mostraBanner;
  for (let k = 0; k < nRun; k++) {
    const run = { piani: [] };
    let chiavi = BOMBE_CHIAVI_A1.inizio.chiavi;
    let bombe = BOMBE_CHIAVI_A1.inizio.bombe;
    R.numeroRun = 100000 + k;
    for (let p = 1; p <= nPiani; p++) {
      const seme = (k * 7919 + p * 104729 + 12345) >>> 0;
      R.piano = p;
      R.chiavi = chiavi; R.bombe = bombe;
      const m = I.mappaConSeme(p, seme);
      R.mappa = m;
      runSeed = (seme ^ 0x5bd1e995) >>> 0;
      const pp = { piano: p, monete: { normale: 0, boss: 0, segreta: 0, forzieri: 0, rovi: 0 }, bombe: 0, chiavi: 0,
        cure: 0, consumabili: 0, forzieriComuni: 0, forzieriChiusi: 0, forzieriChiusiAperti: 0, lucchetti: 0, lucchettiAperti: 0,
        chiaviInizio: chiavi, speciali: {}, rovi: null, chiaveGarantita: false };
      pp.lucchetti = m.stanze.filter((s) => s.chiusaA1).length;
      garantisciChiaveA1(m);
      pp.chiaveGarantita = m.stanze.some((s) => s.chiaveGarantitaA1);
      for (const s of m.stanze) if (['sfida', 'sacrificio', 'maledetta', 'bisca'].includes(s.tipo)) pp.speciali[s.tipo] = (pp.speciali[s.tipo] || 0) + 1;
      const conta = (s, dove) => {
        for (const o of s.oggettiATerra) {
          if (o.contatoSim) continue;
          o.contatoSim = true;
          if (o.tipo === 'moneta') pp.monete[dove] += o.valore || 1;
          else if (o.tipo === 'bomba') pp.bombe += o.valore || 1;
          else if (o.tipo === 'chiave') pp.chiavi += o.valore || 1;
          else if (o.tipo === 'cura') pp.cure += o.valore || 1;
          else if (o.tipo === 'consumabileA2') pp.consumabili++;
        }
      };
      const chiusi = [];
      const ordine = m.stanze.filter((s) => s.tipo === 'normale')
        .concat(m.stanze.filter((s) => s.tipo === 'segreta' || s.tipo === 'boss' || (s.tipo === 'maledetta' && s.nemici.length)));
      for (const s of ordine) {
        R.stanzaCorrente = s;
        P.invuln = 1e9; R.maxHpHalf = 6; R.hpHalf = 5; // ferito di mezza Maschera: le cure possono cadere
        s.pulita = false;
        for (let giro = 0; giro < 6 && s.nemici.some((n) => n.hp > 0); giro++) {
          for (const n of s.nemici.slice()) if (n.hp > 0) { n.airZ = 0; n.maskOpen = true; danneggiaNemico(n, 1e9, 0, 0); }
        }
        verificaStanzaPulita();
        R.proiettiliNemici = [];
        const dove = s.tipo === 'normale' ? 'normale' : s.tipo === 'maledetta' ? 'rovi' : s.tipo;
        conta(s, dove);
        for (const f of s.forzieriA1 || []) {
          if (f.tipo === 'comune') { pp.forzieriComuni++; apriForziereA1(s, f); conta(s, 'forzieri'); } else { pp.forzieriChiusi++; chiusi.push([s, f]); }
        }
      }
      // rovi con monete già a terra (contenuto 'monete')
      for (const s of m.stanze.filter((x) => x.tipo === 'maledetta')) { conta(s, 'rovi'); pp.rovi = s.maledettaA3 && s.maledettaA3.contenuto; }
      // chiavi: lucchetti prima, poi forzieri chiusi (il cui contenuto può dare altre chiavi)
      chiavi += pp.chiavi;
      pp.lucchettiAperti = Math.min(pp.lucchetti, chiavi);
      chiavi -= pp.lucchettiAperti;
      for (const [s, f] of chiusi) {
        if (chiavi <= 0) break;
        chiavi--; pp.forzieriChiusiAperti++;
        const primaC = pp.chiavi;
        apriForziereA1(s, f);
        conta(s, 'forzieri');
        chiavi += pp.chiavi - primaC;
      }
      bombe += pp.bombe;
      pp.chiaviFine = chiavi;
      run.piani.push(pp);
    }
    out.push(run);
  }
  mostraBanner = salvaBanner;
  return {
    runs: out,
    tabelle: { ECONOMIA_T3, BOMBE_CHIAVI_A1, CONS_A2: { drop: CONS_A2.drop }, STANZE_SPECIALI_A3,
      nCarte: CONS_A2_CARTE.length, carteMonete: CONS_A2_CARTE.filter((c) => c.monete).map((c) => ({ id: c.id, monete: c.monete })),
      stanzeCombattimento: STANZE_COMBATTIMENTO_PER_PIANO },
  };
}

// ---------------------------------------------------------------------------
// Valori attesi delle stanze speciali (dalle tabelle; politica dichiarata)
// ---------------------------------------------------------------------------
const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const norm = (pesi) => { const t = Object.values(pesi).reduce((a, b) => a + b, 0) || 1; return (k) => (pesi[k] || 0) / t; };
const mediaInt = (a, b) => (a + b) / 2;

/** Ceppo: n sacrifici (½ Maschera l'uno). Ritorna sangue, monete, mezze Maschere di cura e oggetti attesi. */
function evSacrificio(T, n) {
  const S = T.sacrificio;
  let monete = 0, cura = 0, oggetti = 0;
  for (let i = 1; i <= n; i++) {
    const q = norm(S.premi[Math.min(i, S.premi.length) - 1]);
    monete += q('monete') * mediaInt(S.moneteMin, S.moneteMax);
    cura += q('cuore') * S.cuoreHalf;
    oggetti += q('oggetto');
  }
  return { sangueHalf: n * S.costoHalf, monete, cura, oggetti, nettoHalf: n * S.costoHalf - cura };
}

/** Stanza dei Rovi: entrata + uscita (2 passaggi), contenuto pesato. */
function evRovi(T) {
  const M = T.maledetta;
  const q = norm(M.contenuto);
  const C = T.__forziereComune;
  const monete = q('monete') * mediaInt(M.moneteMin, M.moneteMax) + q('nemici') * M.moneteNemici + q('forziere') * (C ? C.monete : 0);
  return { sangueHalf: 2 * M.costoHalf, monete, oggetti: q('oggetto') + q('nemici') * M.probOggettoNemici };
}

/** Bisca: valore atteso di una giocata al lotto e della Cartomante pagata fino al dono. */
function evBisca(T) {
  const B = T.bisca;
  const q = norm(B.premi);
  const giocata = { costo: B.costo, monete: q('monete') * mediaInt(B.moneteMin, B.moneteMax), cura: q('mezzaMaschera') * 1 + q('cuore') * 2, oggetti: q('oggetto') };
  const C = B.cartomante;
  let pNon = 1, costoAtteso = 0;
  for (let g = 1; g <= 40 && pNon > 1e-6; g++) { costoAtteso += pNon * C.costo; pNon *= 1 - Math.min(1, C.probBase + (g - 1) * C.probPerMoneta); }
  const qc = norm(C.premi);
  const cartomante = { costoAtteso, monete: qc('monete') * C.moneteDono, cura: qc('cuore') * 2, oggetti: qc('oggetto') };
  return { giocata, giocateMax: B.giocateMax, cartomante };
}

/** Valore in monete di un esito (per confrontare con i prezzi della Fucina). */
function valoreMonete(E, { monete = 0, cura = 0, oggetti = 0 }) {
  return monete + (cura / 2) * E.prezzi.cuore + oggetti * E.prezzi.base;
}


// ===========================================================================
// COMBATTIMENTO (e3): danno al secondo misurato col codice VERO del gioco
// ===========================================================================
/*
 * Per ogni prova: run nuova col personaggio, stanza normale svuotata, un bersaglio fermo da 1e6 di vita a
 * `dist` px a destra; si equipaggiano gli oggetti (catalogo vero, ricalcolaStatistiche con tutti gli
 * involucri: B4 trasformazioni e sinergie, B5, D2), si tiene premuta la freccia destra (Taddeo: anche a
 * tocchi brevi, vince il migliore) e si fanno girare `tick` passi di logica. DPS = vita tolta / secondi.
 * Il giocatore è invulnerabile e a vita piena (gli oggetti «a vita piena» contano: stima ottimista).
 */
function misuraDpsNelGioco({ prove, tick }) {
  const I = window.__teatro.interni;
  try { if (I.progressione && I.progressione.sbloccaTutto) I.progressione.sbloccaTutto(); else if (I.sbloccaTutto) I.sbloccaTutto(); } catch (_) {}
  const salvaBanner = mostraBanner;
  mostraBanner = () => {};
  const esiti = [];
  for (const pr of prove) {
    const misura = (modo) => {
      selezionaPersonaggio(pr.pid);
      statoRun.fase = 'in_gioco';
      nuovaRun(false);
      statoRun.siparioAttivo = null;
      const s = statoRun.mappa.stanze.find((x) => x.tipo === 'normale');
      entraInStanza(s, null);
      statoRun.siparioAttivo = null; statoRun.pausa = false;
      const st = statoRun.stanzaCorrente;
      const modello = st.nemici.find((n) => !n.boss && (n.patternMob || n.tipo) !== 'bomba_ferma') || st.nemici[0];
      st.nemici = []; st.ostacoli = []; st.fragiliB7 = []; st.oggettiATerra = []; st.muroSegreto = null; st.suoloB7 = [];
      statoRun.proiettili.length = 0; statoRun.proiettiliNemici.length = 0;
      for (const id of pr.ids) { const o = trovaOggettoB(id); if (o) statoRun.oggettiEquipaggiati.push({ ...o }); }
      ricalcolaStatistiche();
      statoRun.hpHalf = statoRun.maxHpHalf;
      player.x = 260; player.y = 190; player.targetX = null; player.targetY = null; player.cooldown = 0;
      player.dirX = 1; player.dirY = 0; player.flipX = false;
      statoRun.graziaIngressoC = 0;
      const dist = pr.pid === 'taddeo' ? 30 : 60;
      const n = Object.assign({}, modello, { id: 'sim-bersaglio', x: player.x + dist, y: player.y, hp: 1e6, maxHp: 1e6, vx: 0, vy: 0, boss: false });
      st.nemici.push(n); st.pulita = false;
      let giu = false, durata = 0;
      for (let t = 0; t < tick; t++) {
        if (modo === 'tocchi') {
          if (giu && ++durata >= 3) { giu = false; }
          else if (!giu && player.cooldown <= 0) { giu = true; durata = 0; }
          keys.ArrowRight = giu;
        } else keys.ArrowRight = true;
        player.invuln = 1e9; player.x = 260; player.y = 190;
        statoRun.hpHalf = statoRun.maxHpHalf;
        n.x = 260 + dist; n.y = 190; n.vx = 0; n.vy = 0;
        if (!st.nemici.includes(n)) st.nemici.push(n);
        if (n.hp < 1e5) n.hp += 5e5; // non deve mai cadere (si conta a parte)
        statoRun.proiettiliNemici.length = 0;
        ticksCongelati = 0;
        if (statoRun.fase !== 'in_gioco') statoRun.fase = 'in_gioco';
        passoLogico();
      }
      keys.ArrowRight = false;
      let tolto = 0;
      // tolto = 1e6 − hp (+ le ricariche fatte sopra)
      return { n, st };
    };
    const una = (modo) => {
      // si misura la vita tolta con un contatore per non dipendere dalle ricariche
      const r = { tolto: 0 };
      const baseDanneggia = danneggiaNemico;
      danneggiaNemico = function (bers, dmg, ...resto) {
        const prima = bers && bers.id === 'sim-bersaglio' ? bers.hp : null;
        const out = baseDanneggia.call(this, bers, dmg, ...resto);
        if (prima != null) r.tolto += Math.max(0, prima - bers.hp);
        return out;
      };
      try { misura(modo); } finally { danneggiaNemico = baseDanneggia; }
      return r.tolto / (tick / 60);
    };
    let dps = 0, modo = 'tenuto';
    try {
      dps = una('tenuto');
      if (pr.pid === 'taddeo') { const t2 = una('tocchi'); if (t2 > dps) { dps = t2; modo = 'tocchi'; } }
    } catch (err) { esiti.push({ ...pr, errore: String(err && err.stack || err) }); continue; }
    esiti.push({ ...pr, dps, modo, dmg: statoRun.dmg, colpiAlSec: statoRun.colpiAlSec, cooldownMax: statoRun.cooldownMax,
      maxHpHalf: statoRun.maxHpHalf, trasf: Object.keys(statoRun.trasformazioniB4 || {}).length });
  }
  mostraBanner = salvaBanner;
  statoRun.fase = 'menu';
  return esiti;
}

/** Catalogo per le prove: passivi base/forte (niente negativi, patti, segreti), temi, nomi. Più i dati dei boss. */
function catalogoNelGioco() {
  const tutti = (typeof tuttiGliOggettiB5 === 'function' ? tuttiGliOggettiB5() : CATALOGO_OGGETTI);
  const visti = new Set();
  const voci = [];
  for (const o of tutti) {
    if (!o || !o.id || visti.has(o.id)) continue;
    visti.add(o.id);
    const voce = trovaOggettoB(o.id) || o;
    voci.push({ id: o.id, nome: voce.nome, tier: voce.tier, polarita: voce.polarita || null, attivo: Boolean(voce.attivo || voce.maxCarica || o.attivo),
      temi: (typeof temiDi === 'function' ? temiDi(voce) : []).slice(), mod: voce.mod ? JSON.parse(JSON.stringify(voce.mod)) : {} });
  }
  const boss = [];
  for (const [piano, ids] of Object.entries(ROSA_B6.perPiano)) for (const id of ids) {
    const b = POOL_BOSS.find((x) => x.id === id) || SCHEDE_B6[id];
    boss.push({ piano: Number(piano), id, nome: b.nome, hp: Math.round(b.hpBase + (Number(piano) - 1) * 45) });
  }
  boss.push({ piano: 4, id: BOSS_FINALE.id, nome: BOSS_FINALE.nome, hp: Math.round(BOSS_FINALE.hpBase + 3 * 45) });
  const V = BURATTINAIO_D1.vita, M = BURATTINAIO_D1.marionette;
  const marionette = M.perOndata.reduce((a, k) => a + k, 0) * 2 * ((M.vita.burattino + M.vita.guardia + M.vita.predone) / 3);
  boss.push({ piano: 4, id: BURATTINAIO_D1.idCapo, nome: BURATTINAIO_D1.nome, hp: V.mano1 + V.mano2 + V.mano3 + V.forbici, extra: Math.round(marionette) });
  // vita dei nemici delle stanze di combattimento, per piano (mappa vera, 20 semi)
  const vitaStanze = {};
  for (let p = 1; p <= 4; p++) {
    const L = [];
    for (let k = 0; k < 20; k++) {
      statoRun.piano = p;
      const m = window.__teatro.interni.mappaConSeme(p, (k * 7919 + p * 104729 + 999) >>> 0);
      for (const s of m.stanze) if (s.tipo === 'normale' && s.nemici.length) L.push(s.nemici.reduce((a, n) => a + (n.maxHp || n.hp || 0), 0));
    }
    vitaStanze[p] = L.length ? L.reduce((a, b) => a + b, 0) / L.length : 0;
  }
  return { voci, boss, vitaStanze, stanze: STANZE_COMBATTIMENTO_PER_PIANO, bossDannoHalf: BOSS_B6.dannoHalf,
    personaggi: Object.fromEntries(Object.entries(PERSONAGGI_GIOCABILI).map(([k, v]) => [k, { hpHalf: v.hpHalf, baseDmg: v.baseDmg }])),
    ombra: { maxHpHalf: STILI_D2.ombra.maxHpHalf, monetePerMezza: STILI_D2.ombra.monetePerMezza } };
}

/** Generatore deterministico (mulberry32). */
function rng(seme) { let a = seme >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const quantile = (a, f) => { const o = a.slice().sort((x, y) => x - y); return o.length ? o[Math.min(o.length - 1, Math.floor(f * o.length))] : 0; };

/**
 * FASCE del controllo (--controllo esce con 1 se una misura ne esce). Bussola: una notte 25-35 minuti; boss
 * fra 15 s e 2 minuti con una dotazione normale; nessuna dotazione «tipica» oltre 6 volte il danno di partenza.
 */
const FASCE = Object.freeze({
  moneteP1: [5, 8],
  ttkBossSec: [15, 120],          // mediana, dotazione normale del piano (2 × piano − 1 oggetti)
  dpsPartenzaRispettoFerruccio: [0.7, 1.5], // l'Ombra (1,46×) paga con mezza Maschera sola
  dps6SuPartenzaP90: [1, 6],      // 6 oggetti tipici, 90° percentile, rispetto allo stesso personaggio a mani vuote
  notteMin: [12, 40],             // ALLARME sulla stima (il bersaglio di genere è 25-35: vedi rapporto)
  comboMaxSuPartenza: 9,          // le combinazioni peggiori provate (sotto) non oltre 12× la partenza
});
/** Tempi della stima di durata (dichiarati): s per stanza oltre ai nemici, frazione di tempo in cui si colpisce. */
const STIMA = Object.freeze({ transitoStanzaSec: 9, stanzeNonCombattimento: 5, secPerStanzaQuieta: 14, colpireFrazione: 0.45,
  colpireFrazioneBoss: 0.55, intermezziSec: 60, bossExtraSec: 15 });
/** Combinazioni sospette provate a mano (id veri del catalogo). */
const COMBO = Object.freeze([
  { nome: 'Piombo + Bombarda + Cuore Sacro (moltiplicatori di danno)', ids: ['piombo', 'bombarda', 'cuore-sacro'] },
  { nome: 'Raggio Cremisi + Bombarda + Cuore Sacro', ids: ['patto_raggio', 'bombarda', 'cuore-sacro'] },
  { nome: 'Raggio Cremisi + Piombo + Anello', ids: ['patto_raggio', 'piombo', 'anello'] },
  { nome: 'Triplo + Ragno + Venti (ventagli)', ids: ['triplo', 'ragno', 'venti'] },
  { nome: 'Latte + Ranocchio (cadenza)', ids: ['latte', 'ranocchio'] },
]);

async function combattimento(p, { nCampioni, tick }) {
  const cat = await p.evaluate(catalogoNelGioco);
  const pool = cat.voci.filter((v) => (v.tier === 'base' || v.tier === 'forte') && v.polarita !== 'negativo' && !v.attivo);
  const pg = ['ferruccio', 'agnese', 'taddeo', 'ombra'];
  const prove = [];
  for (const pid of pg) {
    prove.push({ pid, n: 0, k: 0, ids: [] });
    for (const n of [3, 6]) for (let k = 0; k < nCampioni; k++) {
      const r = rng(1000 * n + k + 17); const scelti = new Set();
      while (scelti.size < n) scelti.add(pool[Math.floor(r() * pool.length)].id);
      prove.push({ pid, n, k, ids: [...scelti] });
    }
    for (const c of COMBO) prove.push({ pid, n: -1, combo: c.nome, ids: c.ids });
  }
  // un oggetto alla volta su Ferruccio: oggetti che non cambiano nulla o tolgono danno
  for (const v of pool) prove.push({ pid: 'ferruccio', n: 1, singolo: v.id, ids: [v.id] });
  const esiti = [];
  for (let i = 0; i < prove.length; i += 40) esiti.push(...await p.evaluate(misuraDpsNelGioco, { prove: prove.slice(i, i + 40), tick }));
  return { cat, pool, esiti };
}

/** Copia di t3-economia-salvataggi.js CONFIG.raggio (ogniTick 5 → 12 impulsi/s, dannoPerImpulso). */
const LASER_T3 = Object.freeze({ impulsiAlSec: 12, frazione: 0.18 });
/** Le combinazioni col raggio si contano con la stima del raggio, non con la freccia (che col raggio non spara). */
function P0fix(P) { P.combo = P.combo.map((c) => P.raggio.find((r) => r.nome === c.nome) || c); }

function analisiCombattimento({ cat, pool, esiti }) {
  const pg = ['ferruccio', 'agnese', 'taddeo', 'ombra'];
  const errori = esiti.filter((e) => e.errore);
  const ok = esiti.filter((e) => !e.errore);
  const per = {};
  for (const pid of pg) {
    const di = ok.filter((e) => e.pid === pid);
    const zero = (di.find((e) => e.n === 0) || {}).dps || 0;
    const tre = di.filter((e) => e.n === 3).map((e) => e.dps), sei = di.filter((e) => e.n === 6).map((e) => e.dps);
    const hp0 = (di.find((e) => e.n === 0) || {}).maxHpHalf || cat.personaggi[pid].hpHalf;
    const hp6 = quantile(di.filter((e) => e.n === 6).map((e) => e.maxHpHalf), 0.5);
    per[pid] = { dps0: zero, dps3: { p50: quantile(tre, 0.5), p90: quantile(tre, 0.9) }, dps6: { p50: quantile(sei, 0.5), p90: quantile(sei, 0.9), max: Math.max(...sei) },
      colpiRetti0: Math.floor(hp0 / cat.bossDannoHalf), colpiRetti6: Math.floor(hp6 / cat.bossDannoHalf), hp0, hp6,
      combo: di.filter((e) => e.n === -1).map((e) => ({ nome: e.combo, dps: e.dps, volte: zero ? e.dps / zero : 0 })),
      // Raggio Cremisi (t3): si stima da statoRun.dmg perché il raggio non passa dalla freccia della prova
      raggio: di.filter((e) => e.n === -1 && e.ids.includes('patto_raggio')).map((e) => ({ nome: e.combo, dps: LASER_T3.impulsiAlSec * LASER_T3.frazione * e.dmg,
        volte: zero ? LASER_T3.impulsiAlSec * LASER_T3.frazione * e.dmg / zero : 0 })) };
    P0fix(per[pid]);
  }
  // DPS «a inizio piano p»: oggetti posseduti ≈ 2 (p − 1) (tesoro + boss per piano), interpolati fra 0, 3 e 6
  const dpsAOggetti = (pid, n) => { const P = per[pid]; const pts = [[0, P.dps0], [3, P.dps3.p50], [6, P.dps6.p50]];
    if (n >= 6) return P.dps6.p50 + (n - 6) * (P.dps6.p50 - P.dps3.p50) / 3;
    const [a, b] = n <= 3 ? [pts[0], pts[1]] : [pts[1], pts[2]]; return a[1] + (b[1] - a[1]) * (n - a[0]) / (b[0] - a[0]); };
  const inizioPiano = {};
  for (const pid of pg) inizioPiano[pid] = [1, 2, 3, 4].map((pp) => dpsAOggetti(pid, 2 * (pp - 1)));
  // tempo per uccidere i boss: dotazione del piano (2p − 1 oggetti), frazione di tempo in cui si colpisce
  const ttk = cat.boss.map((b) => {
    const r = { ...b, perPg: {} };
    for (const pid of pg) { const d = dpsAOggetti(pid, 2 * b.piano - 1) * STIMA.colpireFrazioneBoss;
      r.perPg[pid] = d > 0 ? (b.hp + (b.extra || 0)) / d + (b.id === 'grande-burattinaio' ? STIMA.intermezziSec / 2 : 0) : Infinity; }
    return r;
  });
  // durata della notte: stanze di combattimento (vita dei nemici / dps) + transiti + stanze quiete + boss
  const notte = {};
  for (const pid of pg) {
    let sec = 0;
    for (let pp = 1; pp <= 4; pp++) {
      const d = dpsAOggetti(pid, 2 * (pp - 1) + 1) * STIMA.colpireFrazione;
      const nSt = cat.stanze[pp];
      sec += nSt * (cat.vitaStanze[pp] / d + STIMA.transitoStanzaSec) + STIMA.stanzeNonCombattimento * STIMA.secPerStanzaQuieta;
      const bp = ttk.filter((b) => b.piano === pp && b.id !== 'grande-burattinaio');
      sec += bp.reduce((a, b) => a + b.perPg[pid], 0) / bp.length + STIMA.bossExtraSec;
    }
    notte[pid] = sec / 60;
  }
  // oggetti singoli su Ferruccio
  const base = per.ferruccio.dps0;
  const singoli = ok.filter((e) => e.singolo).map((e) => ({ id: e.singolo, nome: (pool.find((v) => v.id === e.singolo) || {}).nome, dps: e.dps, rel: base ? e.dps / base : 0, hp: e.maxHpHalf }));
  // trasformazioni: probabilità di completarne una con 8 oggetti presi a caso dal pool (Monte Carlo)
  const temi = {};
  for (const v of pool) for (const t of v.temi) (temi[t] = temi[t] || []).push(v.id);
  const r = rng(4242), prov = 4000, completate = {};
  for (let i = 0; i < prov; i++) {
    const presi = new Set(); while (presi.size < 8) presi.add(pool[Math.floor(r() * pool.length)].id);
    for (const [t, ids] of Object.entries(temi)) if (ids.filter((x) => presi.has(x)).length >= 3) completate[t] = (completate[t] || 0) + 1;
  }
  const trasf = Object.entries(temi).map(([t, ids]) => ({ tema: t, oggetti: ids.length, prob8: (completate[t] || 0) / prov })).sort((a, b) => b.prob8 - a.prob8);
  return { per, inizioPiano, ttk, notte, singoli, trasf, errori: errori.map((e) => ({ pid: e.pid, ids: e.ids, errore: e.errore.slice(0, 300) })) };
}

function stampaCombattimento(A) {
  const f = (x, d = 1) => (Number.isFinite(x) ? Number(x).toFixed(d) : '∞');
  console.log('\nCombattimento (codice del gioco, bersaglio fermo; DPS = danno al secondo tenendo premuto)');
  console.log('  personaggio | DPS 0 ogg | 3 ogg p50/p90 | 6 ogg p50/p90/max | inizio piano 1-4 | colpi di boss retti 0/6 ogg');
  for (const [pid, P] of Object.entries(A.per)) console.log(`  ${pid.padEnd(10)} | ${f(P.dps0)} | ${f(P.dps3.p50)}/${f(P.dps3.p90)} | ${f(P.dps6.p50)}/${f(P.dps6.p90)}/${f(P.dps6.max)} | ${A.inizioPiano[pid].map((x) => f(x)).join(' ')} | ${P.colpiRetti0}/${P.colpiRetti6}`);
  console.log('  boss (vita) → secondi per abbatterlo con la dotazione del piano [ferruccio agnese taddeo ombra]');
  for (const b of A.ttk) console.log(`  P${b.piano} ${b.id.padEnd(18)} ${String(b.hp + (b.extra ? '+' + b.extra : '')).padEnd(8)} ${Object.values(b.perPg).map((x) => f(x, 0)).join(' ')}`);
  console.log(`  notte stimata (min): ${Object.entries(A.notte).map(([k, v]) => `${k} ${f(v)}`).join(' · ')}`);
  console.log('  combinazioni (× DPS a mani vuote):');
  for (const [pid, P] of Object.entries(A.per)) console.log(`   ${pid}: ${P.combo.map((c) => `${c.nome.split(' (')[0]} ${f(c.volte)}×`).join(' | ')}`);
  const s = A.singoli.slice().sort((a, b) => a.rel - b.rel);
  console.log(`  oggetti singoli (Ferruccio): peggiori ${s.slice(0, 8).map((x) => `${x.id} ${f(x.rel, 2)}`).join(', ')}`);
  console.log(`                               migliori ${s.slice(-8).map((x) => `${x.id} ${f(x.rel, 2)}`).join(', ')}`);
  console.log(`  trasformazioni (prob. con 8 oggetti a caso): ${A.trasf.map((t) => `${t.tema} ${t.oggetti}ogg ${f(t.prob8 * 100, 0)}%`).join(' · ')}`);
  if (A.errori.length) console.log(`  ERRORI nelle prove: ${A.errori.length} (primo: ${A.errori[0].errore.split('\n')[0]})`);
}

/** Confronta con le FASCE: ritorna l'elenco dei valori fuori. */
function controllaFasce(A, m1) {
  const fuori = [];
  const dentro = (v, [a, b]) => v >= a && v <= b;
  if (m1 != null && !dentro(m1, FASCE.moneteP1)) fuori.push(`monete al piano 1 ${m1.toFixed(2)} fuori da ${FASCE.moneteP1}`);
  const F = A.per.ferruccio.dps0;
  for (const [pid, P] of Object.entries(A.per)) {
    if (!dentro(P.dps0 / F, FASCE.dpsPartenzaRispettoFerruccio)) fuori.push(`${pid}: DPS di partenza ${(P.dps0 / F).toFixed(2)}× Ferruccio`);
    if (!dentro(P.dps6.p90 / P.dps0, FASCE.dps6SuPartenzaP90)) fuori.push(`${pid}: 6 oggetti p90 = ${(P.dps6.p90 / P.dps0).toFixed(2)}× la partenza`);
    for (const c of P.combo) if (c.volte > FASCE.comboMaxSuPartenza) fuori.push(`${pid}: ${c.nome} = ${c.volte.toFixed(1)}× la partenza`);
    if (!dentro(A.notte[pid], FASCE.notteMin)) fuori.push(`${pid}: notte stimata ${A.notte[pid].toFixed(1)} min`);
  }
  for (const b of A.ttk) for (const [pid, t] of Object.entries(b.perPg)) if (!dentro(t, FASCE.ttkBossSec)) fuori.push(`${b.id} con ${pid}: ${Number.isFinite(t) ? t.toFixed(0) : '∞'} s`);
  if (A.errori.length) fuori.push(`${A.errori.length} prove con errore`);
  return fuori;
}

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage();
  const errori = [];
  p.on('pageerror', (e) => errori.push(String(e)));
  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await p.waitForTimeout(400);
  const t0 = Date.now();
  const ris = await p.evaluate(simulaNelGioco, { nRun: NRUN, nPiani: NPIANI });
  let comb = null;
  if (!SOLO_ECONOMIA) {
    await p.reload(); await p.waitForTimeout(400);
    comb = analisiCombattimento(await combattimento(p, { nCampioni: CONTROLLO ? 8 : 16, tick: 480 }));
  }
  await browser.close();
  const { runs, tabelle } = ris;
  const E = tabelle.ECONOMIA_T3;
  const T = tabelle.STANZE_SPECIALI_A3;
  const A1 = tabelle.BOMBE_CHIAVI_A1;
  // forziere comune in valore atteso (per i rovi)
  const cc = A1.contenuto.comune; const qc = norm(cc.pesi); const pezzi = mediaInt(cc.pezziMin, cc.pezziMax);
  T.__forziereComune = { monete: pezzi * qc('moneta') };

  const perPiano = [];
  for (let k = 0; k < NPIANI; k++) {
    const L = runs.map((r) => r.piani[k]);
    const tot = L.map((x) => x.monete.normale + x.monete.boss + x.monete.segreta + x.monete.forzieri);
    const ord = tot.slice().sort((a, b) => a - b);
    const q = (f) => ord[Math.min(ord.length - 1, Math.floor(f * ord.length))];
    const conLucchetti = L.filter((x) => x.lucchetti > 0);
    perPiano.push({
      piano: k + 1,
      monete: { media: media(tot), p10: q(0.1), mediana: q(0.5), p90: q(0.9), min: ord[0], max: ord[ord.length - 1],
        normale: media(L.map((x) => x.monete.normale)), boss: media(L.map((x) => x.monete.boss)), segreta: media(L.map((x) => x.monete.segreta)),
        forzieri: media(L.map((x) => x.monete.forzieri)), rovi: media(L.map((x) => x.monete.rovi)), senzaSegreta: media(L.map((x) => x.monete.normale + x.monete.boss + x.monete.forzieri)) },
      bombe: media(L.map((x) => x.bombe)), chiavi: media(L.map((x) => x.chiavi)), cure: media(L.map((x) => x.cure)),
      consumabili: media(L.map((x) => x.consumabili)),
      forzieriComuni: media(L.map((x) => x.forzieriComuni)), forzieriChiusi: media(L.map((x) => x.forzieriChiusi)),
      forzieriChiusiAperti: media(L.map((x) => x.forzieriChiusiAperti)),
      lucchetti: media(L.map((x) => x.lucchetti)),
      chiaviInizio: media(L.map((x) => x.chiaviInizio)),
      pianiConLucchetti: conLucchetti.length / L.length,
      pianiSenzaChiave: conLucchetti.filter((x) => x.lucchettiAperti === 0).length / L.length,
      pianiLucchettoRestaChiuso: conLucchetti.filter((x) => x.lucchettiAperti < x.lucchetti).length / L.length,
      chiaveGarantita: L.filter((x) => x.chiaveGarantita).length / L.length,
      speciali: ['sfida', 'sacrificio', 'maledetta', 'bisca'].reduce((o, t) => { o[t] = L.filter((x) => x.speciali[t]).length / L.length; return o; }, {}),
    });
  }
  const runSenzaChiave = runs.filter((r) => r.piani.some((x) => x.lucchetti > 0 && x.lucchettiAperti === 0)).length / runs.length;
  const runLucchettoChiuso = runs.filter((r) => r.piani.some((x) => x.lucchettiAperti < x.lucchetti)).length / runs.length;
  const sac = [1, 2, 3, 4, 5, 6].map((n) => ({ n, ...evSacrificio(T, n) }));
  const rovi = evRovi(T);
  const bisca = evBisca(T);
  const pC = 1 - tabelle.CONS_A2.drop.probAmpolla;
  const moneteCarta = tabelle.carteMonete.reduce((a, c) => a + c.monete, 0) / tabelle.nCarte; // ~ (scorte dà monete solo senza spazio)
  const report = {
    file: path.relative(RADICE, file), run: NRUN, piani: NPIANI, ms: Date.now() - t0, errori,
    prezzi: E.prezzi, perPiano, runSenzaChiave, runLucchettoChiuso,
    speciali: {
      sacrificio: sac.map((s) => ({ ...s, valore: valoreMonete(E, s) })),
      rovi: { ...rovi, valore: valoreMonete(E, rovi) },
      bisca: {
        giocata: { ...bisca.giocata, valore: valoreMonete(E, bisca.giocata), netto: valoreMonete(E, bisca.giocata) - bisca.giocata.costo },
        banco8: { costo: bisca.giocata.costo * bisca.giocateMax, valore: valoreMonete(E, bisca.giocata) * bisca.giocateMax, moneteRese: bisca.giocata.monete * bisca.giocateMax },
        cartomante: { ...bisca.cartomante, valore: valoreMonete(E, bisca.cartomante) },
      },
      monetePerConsumabile: pC * moneteCarta,
    },
  };
  report.combattimento = comb;
  if (fileJson) fs.writeFileSync(path.resolve(fileJson), JSON.stringify(report, null, 1));
  const f = (x, d = 2) => Number(x).toFixed(d);
  console.log(`Simulazione del Teatro: ${NRUN} run × ${NPIANI} piani (codice del gioco, ${report.ms} ms)`);
  console.log(`  prezzi Fucina: cuore ${E.prezzi.cuore}, consumabile ${E.prezzi.consumabile}, base ${E.prezzi.base}, forte ${E.prezzi.forte}`);
  console.log('  piano | monete media (p10-mediana-p90) [norm/boss/segr/forz] | bombe | chiavi | forz c/ch | cons | lucch | chiavi a inizio | senza chiave | lucch. chiuso');
  for (const x of perPiano) {
    console.log(`  ${x.piano}     | ${f(x.monete.media)} (${x.monete.p10}-${x.monete.mediana}-${x.monete.p90}) [${f(x.monete.normale, 1)}/${f(x.monete.boss, 1)}/${f(x.monete.segreta, 1)}/${f(x.monete.forzieri, 1)}]`
      + ` | ${f(x.bombe)} | ${f(x.chiavi)} | ${f(x.forzieriComuni)}/${f(x.forzieriChiusi)} | ${f(x.consumabili)} | ${f(x.lucchetti)} | ${f(x.chiaviInizio)} | ${f(x.pianiSenzaChiave * 100, 1)}% | ${f(x.pianiLucchettoRestaChiuso * 100, 1)}%`);
  }
  console.log(`  run con un piano a lucchetti e nessuna chiave: ${f(runSenzaChiave * 100, 1)}%; run con almeno un lucchetto rimasto chiuso: ${f(runLucchettoChiuso * 100, 1)}%`);
  console.log(`  stanze speciali per piano (presenza): ${perPiano.map((x) => `P${x.piano} ${Object.entries(x.speciali).map(([t, v]) => `${t} ${f(v * 100, 0)}%`).join(' ')}`).join(' | ')}`);
  console.log(`  ceppo: ${report.speciali.sacrificio.map((s) => `${s.n}×: −${s.sangueHalf}½ +${f(s.cura, 2)}½ ${f(s.monete, 1)}🪙 ${f(s.oggetti, 2)}ogg ≈ ${f(s.valore, 1)}🪙`).join(' | ')}`);
  console.log(`  rovi: −${rovi.sangueHalf}½, ${f(rovi.monete, 2)}🪙, ${f(rovi.oggetti, 2)} oggetti ≈ ${f(report.speciali.rovi.valore, 1)}🪙`);
  const g = report.speciali.bisca.giocata;
  console.log(`  bisca: giocata costa ${g.costo}🪙, rende ${f(g.monete, 2)}🪙 + ${f(g.cura, 2)}½ + ${f(g.oggetti, 3)} ogg ≈ ${f(g.valore, 2)}🪙 (netto ${f(g.netto, 2)}); 8 giocate: −${report.speciali.bisca.banco8.costo}🪙 → ${f(report.speciali.bisca.banco8.moneteRese, 1)}🪙 rese`);
  const c = report.speciali.bisca.cartomante;
  console.log(`  cartomante: costo atteso ${f(c.costoAtteso, 2)}🪙 → ${f(c.monete, 2)}🪙 + ${f(c.cura, 2)}½ + ${f(c.oggetti, 2)} ogg ≈ ${f(c.valore, 2)}🪙`);
  const m1 = perPiano[0].monete.media;
  const ok = m1 >= OBIETTIVO_P1.min && m1 <= OBIETTIVO_P1.max && !errori.length;
  console.log(ok ? `  OK: piano 1 = ${f(m1)} monete in [${OBIETTIVO_P1.min}, ${OBIETTIVO_P1.max}]` : `  FUORI: piano 1 = ${f(m1)} monete (obiettivo ${OBIETTIVO_P1.min}-${OBIETTIVO_P1.max})${errori.length ? ` · errori: ${errori[0]}` : ''}`);
  if (comb) stampaCombattimento(comb);
  if (CONTROLLO) {
    const fuori = comb ? controllaFasce(comb, m1) : [];
    if (errori.length) fuori.push(`errori di pagina: ${errori[0]}`);
    if (!comb && !ok) fuori.push('monete al piano 1 fuori fascia');
    console.log(fuori.length ? `\nCONTROLLO: ${fuori.length} valori fuori fascia\n  - ${fuori.join('\n  - ')}` : '\nCONTROLLO: tutto nelle fasce');
    process.exitCode = fuori.length ? 1 : 0;
  } else process.exitCode = ok ? 0 : 1;
})();
