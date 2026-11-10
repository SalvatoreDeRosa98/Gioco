#!/usr/bin/env node
/*
 * tools/qa-teatro-stanze-varianti.js — verifica Playwright di gioco/teatro/b7-stanze.js (varianti di stanza,
 * elementi di scena, gruppi di nemici, le tre scatole del ciarlatano, la Clessidra della Ribalta).
 * Uso: node tools/qa-teatro-stanze-varianti.js [file html] [prefisso screenshot] [semi]
 *  1. Regole dure, tutte le disposizioni × varianti specchiate × 15 combinazioni di porte: verifica del gioco
 *     (verificaDisposizioniB7) e una seconda, indipendente, fatta qui (flood fill a 3 px, nemici piazzati
 *     davvero e poi rimessi in regola per ogni porta d'ingresso).
 *  2. Mappe vere, [semi] semi per piano 1-4: ogni stanza di combattimento ha una disposizione valida per il
 *     suo quartiere e piano minimo; nessun nemico a meno di 110 px da una porta (o dalla crepa della segreta)
 *     né dentro un ostacolo, anche dopo l'ingresso da ogni porta; frequenze di disposizioni, gruppi, stanze a
 *     tema, Clessidra e ciarlatano; curva di difficoltà (le prime stanze più facili).
 *  3. Elementi di scena: chiodi, fragili, Vasi di Capodimonte, casse di polvere, pedana e cancello,
 *     pozzanghera scivolosa, nemici che girano attorno agli ostacoli.
 *  4. Le tre scatole: 100 mani scegliendo a caso (premio ≈ 1/3) e 100 seguendo la scatola con gli occhi
 *     (solo posizioni anonime: 100%), poi una partita vera al tavolino (posta, premio, bomba, congedo).
 *  5. La Clessidra: premio pieno in tempo, premio ridotto a sabbia finita, nessuna morte per il tempo.
 * Screenshot nel prefisso. Esce con 1 se un vincolo salta o ci sono errori di console.
 * Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-stanze-varianti');
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
  const oss = {};

  // ---------------------------------------------------------------- 1. regole dure su tutta la tabella
  oss.tabella = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const A = I.ARENA, LATI = ['N', 'E', 'S', 'W'];
    const v = [];
    const gioco = I.verificaDisposizioniB7();
    for (const m of gioco.violazioni) v.push(`[gioco] ${m}`);
    const perQuartiere = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const d of I.DISPOSIZIONI_B7) perQuartiere[d.q]++;
    // verifica indipendente
    const passo = 3, R = 9;
    const nx = Math.floor((A.x2 - A.x1) / passo) + 1, ny = Math.floor((A.y2 - A.y1) / passo) + 1;
    const nodo = (x, y) => Math.round((y - A.y1) / passo) * nx + Math.round((x - A.x1) / passo);
    const raggiunti = (solidi, da) => {
      const occ = new Uint8Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = A.x1 + i * passo, y = A.y1 + j * passo;
        for (const o of solidi) if (Math.hypot(x - o.x, y - o.y) < o.r + R) { occ[j * nx + i] = 1; break; }
      }
      const visti = new Uint8Array(nx * ny), coda = [nodo(da.x, da.y)];
      if (occ[coda[0]]) return { visti, n: 0 };
      visti[coda[0]] = 1;
      let n = 0;
      while (coda.length) {
        const a = coda.pop(); n++;
        const i = a % nx, j = (a - i) / nx;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ii = i + di, jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
          const b = jj * nx + ii;
          if (!occ[b] && !visti[b]) { visti[b] = 1; coda.push(b); }
        }
      }
      return { visti, n };
    };
    const regole = (st, extra) => {
      const out = [];
      const vietati = Object.keys(st.porte).map((l) => I.PORTE_C[l]);
      if (st.muroSegreto) vietati.push(I.PORTE_C[st.muroSegreto.lato]);
      for (const n of st.nemici) {
        if (n.hp <= 0) continue;
        if (vietati.some((d) => Math.hypot(n.x - d.x, n.y - d.y) < 110 - 1e-6)) out.push('nemico a meno di 110 px da una porta');
        if (extra.some((d) => Math.hypot(n.x - d.x, n.y - d.y) < 110 - 1e-6)) out.push("nemico a meno di 110 px dal punto d'ingresso");
        if (st.ostacoli.some((o) => Math.hypot(n.x - o.x, n.y - o.y) < o.r + 6)) out.push('nemico dentro un ostacolo');
        if (n.x < A.x1 + 8 || n.x > A.x2 - 8 || n.y < A.y1 + 8 || n.y > A.y2 - 8) out.push("nemico fuori dall'arena");
      }
      return out;
    };
    let combinazioni = 0, quotaMin = 1;
    const tipi = ['gatto', 'guardia', 'vespa_cieca', 'statua', 'predone', 'burattino'];
    for (const va of I.variantiB7()) {
      const piano = Math.max(va.disp.pianoMin, va.disp.q || 1);
      const el = I.elementiVarianteB7(va, va.disp.q || 1);
      const F = raggiunti(el.ostacoli, I.ENTRATE_C.N);
      quotaMin = Math.min(quotaMin, F.n / (nx * ny));
      for (const l of LATI) if (!F.visti[nodo(I.ENTRATE_C[l].x, I.ENTRATE_C[l].y)]) v.push(`${va.id}: porta ${l} isolata (verifica indipendente)`);
      if (F.n / (nx * ny) < 0.5) v.push(`${va.id}: meno di metà arena percorribile`);
      for (let m = 1; m < 16; m++) {
        combinazioni++;
        const lati = LATI.filter((_, i) => m & (1 << i));
        const st = { id: 'qa', tipo: 'normale', porte: Object.fromEntries(lati.map((l) => [l, 'x'])), muroSegreto: null,
          nemici: [], ostacoli: [], oggettiATerra: [] };
        I.applicaDisposizioneB7(st, va, piano);
        st.nemici = I.creaNemiciB7(st, piano, tipi);
        I.piazzaNemiciB7(st);
        for (const msg of regole(st, [])) v.push(`${va.id} porte ${lati.join('')}: ${msg}`);
        for (const n of st.nemici) if (!F.visti[nodo(n.x, n.y)]) v.push(`${va.id} porte ${lati.join('')}: nemico in una zona non raggiungibile`);
        for (const l of lati) {
          I.sistemaNemiciB7(st, [I.ENTRATE_C[l]]);
          for (const msg of regole(st, [I.ENTRATE_C[l]])) v.push(`${va.id} porte ${lati.join('')} ingresso ${l}: ${msg}`);
        }
      }
    }
    return { disposizioni: gioco.disposizioni, varianti: gioco.varianti, combinazioni, perQuartiere,
      quotaPercorribileMin: Number(quotaMin.toFixed(3)), violazioni: v };
  });
  violazioni.push(...oss.tabella.violazioni);
  delete oss.tabella.violazioni;
  if (oss.tabella.disposizioni < 40) violazioni.push(`solo ${oss.tabella.disposizioni} disposizioni (ne servono 40)`);
  for (const q of [1, 2, 3, 4]) if (oss.tabella.perQuartiere[q] < 4) violazioni.push(`quartiere ${q}: poche disposizioni dedicate`);

  // ---------------------------------------------------------------- 2. mappe vere
  oss.mappe = await p.evaluate((SEMI) => {
    const I = window.__teatro.interni;
    const A = I.ARENA;
    const v = [], out = {};
    const usate = new Set();
    const varianti = new Map(I.variantiB7().map((x) => [x.id, x]));
    for (const piano of [1, 2, 3, 4]) {
      const disp = {}, gruppi = {}, perProf = {};
      let stanze = 0, temi = 0, clessidre = 0, sfide = 0, bische = 0, ciarlatani = 0, nemici = 0;
      for (let seme = 1; seme <= SEMI; seme++) {
        const m = I.mappaConSeme(piano, seme * 2654435761);
        const err = (msg) => v.push(`piano ${piano} seme ${seme}: ${msg}`);
        if (!m) { err('mappa nulla'); continue; }
        let temiQui = 0;
        for (const s of m.stanze) {
          if (s.tipo === 'sfida') { sfide++; if (s.clessidraB7) clessidre++; }
          if (s.tipo === 'bisca') { bische++; if (s.ciarlatanoB7) ciarlatani++; }
          if (s.tipo !== 'normale') { if (s.disposizioneB7) err(`${s.tipo} con una disposizione di combattimento`); continue; }
          stanze++;
          const D = s.disposizioneB7;
          if (!D) { err(`${s.id} senza disposizione`); continue; }
          const va = varianti.get(D.variante);
          if (!va) { err(`${s.id}: variante sconosciuta ${D.variante}`); continue; }
          usate.add(va.disp.id);
          disp[va.disp.id] = (disp[va.disp.id] || 0) + 1;
          if (va.disp.q !== 0 && va.disp.q !== piano) err(`${D.id}: disposizione di un altro quartiere`);
          if (piano < va.disp.pianoMin) err(`${D.id}: prima del suo piano minimo`);
          if (!I.analizzaVarianteB7(va).ok) err(`${D.id}: variante non valida in gioco`);
          gruppi[s.gruppoB7] = (gruppi[s.gruppoB7] || 0) + 1;
          if (s.temaB7) { temi++; temiQui++; if ((s.profonditaB7 || 0) < I.TEMI_RARI_B7.profonditaMin) err('stanza a tema troppo vicina all\'ingresso'); }
          const g = (I.GRUPPI_B7[piano] || []).find((x) => x.id === s.gruppoB7);
          const k = Math.min(4, s.profonditaB7 || 1);
          perProf[k] = perProf[k] || { stanze: 0, nemici: 0, grado: 0, conGrado: 0 };
          perProf[k].stanze++; perProf[k].nemici += s.nemici.length; nemici += s.nemici.length;
          if (g) { perProf[k].grado += g.diff; perProf[k].conGrado++; }
          if (!s.nemici.length) err(`${s.id} senza nemici`);
          const vietati = Object.keys(s.porte).map((l) => I.PORTE_C[l]);
          if (s.muroSegreto) vietati.push(I.PORTE_C[s.muroSegreto.lato]);
          const controlla = (dove, extra) => {
            for (const n of s.nemici) {
              if ([...vietati, ...extra].some((d) => Math.hypot(n.x - d.x, n.y - d.y) < 110 - 1e-6)) err(`${D.variante} ${dove}: nemico a meno di 110 px da una porta`);
              if (s.ostacoli.some((o) => Math.hypot(n.x - o.x, n.y - o.y) < o.r + 6)) err(`${D.variante} ${dove}: nemico dentro un ostacolo`);
              if (n.x < A.x1 + 8 || n.x > A.x2 - 8 || n.y < A.y1 + 8 || n.y > A.y2 - 8) err(`${D.variante} ${dove}: nemico fuori dall'arena`);
            }
          };
          controlla('alla generazione', []);
          for (const l of Object.keys(s.porte)) { I.sistemaNemiciB7(s, [I.ENTRATE_C[l]]); controlla(`entrando da ${l}`, [I.ENTRATE_C[l]]); }
        }
        if (temiQui > 1) err('più di una stanza a tema nel piano');
      }
      const curva = {};
      for (const [k, x] of Object.entries(perProf)) {
        curva[k] = { stanze: x.stanze, nemiciMedi: Number((x.nemici / x.stanze).toFixed(2)), gradoMedio: x.conGrado ? Number((x.grado / x.conGrado).toFixed(2)) : null };
      }
      if (curva[1] && curva[3] && curva[1].gradoMedio !== null && !(curva[1].gradoMedio < curva[3].gradoMedio)) v.push(`piano ${piano}: le prime stanze non sono più facili`);
      const ordina = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
      out[piano] = {
        stanze, nemiciMediPerStanza: Number((nemici / stanze).toFixed(2)), disposizioniDiverse: Object.keys(disp).length,
        temiPerPiano: Number((temi / SEMI).toFixed(3)), clessidrePerPiano: Number((clessidre / SEMI).toFixed(3)), sfidePerPiano: Number((sfide / SEMI).toFixed(3)),
        ciarlataniPerPiano: Number((ciarlatani / SEMI).toFixed(3)), bischePerPiano: Number((bische / SEMI).toFixed(3)),
        curva, disposizioni: ordina(disp), gruppi: ordina(gruppi),
      };
    }
    const mai = I.DISPOSIZIONI_B7.filter((d) => !usate.has(d.id)).map((d) => d.id);
    return { perPiano: out, maiUscite: mai, violazioni: v };
  }, SEMI);
  violazioni.push(...oss.mappe.violazioni.slice(0, 40));
  if (oss.mappe.violazioni.length > 40) violazioni.push(`... e altre ${oss.mappe.violazioni.length - 40} sulle mappe`);
  delete oss.mappe.violazioni;
  if (SEMI >= 200 && oss.mappe.maiUscite.length) violazioni.push(`disposizioni mai uscite: ${oss.mappe.maiUscite.join(', ')}`);

  // ---------------------------------------------------------------- preparazione di una run vera
  await p.keyboard.press('Space');
  await p.waitForTimeout(200);
  const prepara = (piano) => p.evaluate((piano) => {
    const I = window.__teatro.interni;
    I.selezionaPersonaggio('ferruccio');
    I.nuovaRun(false);
    I.statoRun.fase = 'in_gioco';
    I.statoRun.siparioAttivo = null;
    I.avviaPiano(piano, false);
    I.statoRun.siparioAttivo = null;
    return { piano: I.statoRun.piano, fase: I.statoRun.fase };
  }, piano);
  /** Entra in una stanza di combattimento del piano e vi monta la variante data. */
  const allestisci = (piano, variante, tipi, giocatore) => p.evaluate(({ piano, variante, tipi, giocatore }) => {
    const I = window.__teatro.interni;
    const m = I.statoRun.mappa;
    const s = m.stanze.find((x) => x.tipo === 'normale');
    I.entraInStanza(s, null);
    I.statoRun.siparioAttivo = null;
    const st = I.allestisciB7(variante, piano, tipi);
    if (!st) return null;
    I.player.x = giocatore.x; I.player.y = giocatore.y; I.player.targetX = null; I.player.targetY = null;
    I.sistemaNemiciB7(st, [{ x: I.player.x, y: I.player.y }]);
    I.player.invuln = 0;
    I.statoRun.graziaIngressoC = 900; // i nemici restano in posa per la fotografia
    I.statoRun.proiettili.length = 0; I.statoRun.proiettiliNemici.length = 0;
    I.mostraBanner(`${st.disposizioneB7.nome} (${variante})`, 240);
    return { id: st.disposizioneB7.id, ostacoli: st.ostacoli.length, suolo: st.suoloB7.length, nemici: st.nemici.length };
  }, { piano, variante, tipi, giocatore });

  // ---------------------------------------------------------------- screenshot delle disposizioni
  const SCATTI = [
    [1, 'tombino-allagato', ['gatto', 'gatto', 'vespa_cieca']],
    [1, 'vicolo-delle-botti', ['gatto', 'vespa_cieca', 'vespa_cieca']],
    [1, 'deposito-di-polvere', ['gatto', 'bomba_ferma', 'vespa_cieca']],
    [2, 'la-fontana', ['lucciola', 'lucciola', 'statua']],
    [2, 'labirinto-di-siepi', ['predone', 'predone', 'lucciola']],
    [2, 'chiodi-del-palco', ['lucciola', 'predone']],
    [3, 'sala-dei-telai', ['burattino', 'burattino', 'guardia']],
    [3, 'deposito-chiuso', ['burattino', 'maschera']],
    [4, 'galleria-delle-statue', ['guardia', 'guardia', 'maschera']],
    [4, 'sala-delle-porcellane', ['guardia', 'statua', 'predone']],
    [4, 'tesoro-del-re', ['guardia', 'predone']],
  ];
  oss.scatti = [];
  let pianoCorrente = 0;
  for (const [piano, variante, tipi] of SCATTI) {
    if (piano !== pianoCorrente) { await prepara(piano); pianoCorrente = piano; }
    const r = await allestisci(piano, variante, tipi, { x: 320, y: 262 });
    if (!r) { violazioni.push(`screenshot: variante ${variante} non montata`); continue; }
    await p.waitForTimeout(450);
    await p.screenshot({ path: foto(`p${piano}-${variante}`) });
    oss.scatti.push(`p${piano}-${variante}`);
  }

  // ---------------------------------------------------------------- 3. elementi di scena
  await prepara(2);
  await allestisci(2, 'chiodi-del-palco', [], { x: 320, y: 262 });
  oss.chiodi = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.stanzaCorrente;
    const o = st.suoloB7.find((x) => x.tipo === 'spuntoni');
    const per = I.periodoSpuntoniB7();
    const fasi = {};
    for (let t = 0; t < per; t++) { const s = I.statoSpuntoniB7(o, t - o.sfasa); fasi[s.fase] = (fasi[s.fase] || 0) + 1; }
    // fermo sui chiodi per un giro intero: il colpo arriva solo a chiodi fuori
    I.statoRun.graziaIngressoC = 0; I.player.invuln = 0;
    I.statoRun.hpHalf = I.statoRun.maxHpHalf;
    const prima = I.statoRun.hpHalf;
    let faseAlColpo = null;
    for (let k = 0; k < per + 5 && faseAlColpo === null; k++) {
      I.player.x = o.x; I.player.y = o.y;
      const s = I.statoSpuntoniB7(o, window.__teatro.tick + 1);
      I.passoLogico();
      if (I.statoRun.hpHalf < prima) faseAlColpo = s.fase;
    }
    const perso = prima - I.statoRun.hpHalf;
    I.statoRun.hpHalf = I.statoRun.maxHpHalf; I.player.invuln = 0;
    return { periodoTick: per, fasi, faseAlColpo, mezzeMaschereperse: perso };
  });
  if (oss.chiodi.faseAlColpo !== 'su') violazioni.push(`chiodi: colpo in fase «${oss.chiodi.faseAlColpo}» invece che a chiodi fuori`);
  if (oss.chiodi.mezzeMaschereperse !== 1) violazioni.push('chiodi: il colpo non costa ½ Maschera');
  if (!(oss.chiodi.fasi.avviso >= 20)) violazioni.push('chiodi: avviso troppo corto per leggerlo');

  await allestisci(2, 'botti-in-fila', [], { x: 320, y: 262 });
  oss.fragili = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.stanzaCorrente;
    const r = { botti: st.fragiliB7.length };
    const b = st.fragiliB7[0];
    I.colpisciFragileB7(st, b); I.passoLogico();
    r.dopoUnColpo = st.ostacoli.includes(b);
    I.colpisciFragileB7(st, b); I.passoLogico(); I.passoLogico();
    r.dopoDueColpi = st.ostacoli.includes(b);
    // un colpo vero: proiettile sparato verso una botte
    const c = st.fragiliB7[0];
    I.player.x = c.x - 60; I.player.y = c.y + 6; I.player.cooldown = 0;
    const colpiPrima = c.fragileB7.colpi;
    I.sparaProiettiliDirezione(1, 0);
    for (let k = 0; k < 60 && c.fragileB7.colpi === colpiPrima; k++) I.passoLogico();
    r.proiettileColpisce = c.fragileB7.colpi < colpiPrima;
    r.proiettileAssorbito = I.statoRun.proiettili.length === 0;
    // premi dei fragili su molte rotture (tabella)
    const conta = (variante, n) => {
      const esiti = {};
      for (let k = 0; k < n; k++) {
        const va = I.variantiB7().find((x) => x.id === variante);
        const el = I.elementiVarianteB7(va, 4);
        const f = el.ostacoli.find((o) => o.fragileB7 && !o.fragileB7.esplode);
        const finta = { id: 'qa', nemici: [], ostacoli: [f], fragiliB7: [f], oggettiATerra: [], macchie: [] };
        const e = I.rompiFragileB7(finta, f);
        esiti[e] = (esiti[e] || 0) + 1;
      }
      return Object.fromEntries(Object.entries(esiti).map(([k, x]) => [k, Number((x / n).toFixed(3))]));
    };
    const pianoVero = I.statoRun.piano; I.statoRun.piano = 2; // fuori dal filtro di rarità del piano 1
    r.premiComuni = conta('botti-in-fila', 600);
    r.premiCapodimonte = conta('vasi-di-capodimonte', 600);
    I.statoRun.piano = pianoVero;
    return r;
  });
  if (!oss.fragili.dopoUnColpo || oss.fragili.dopoDueColpi) violazioni.push('fragili: la botte non si rompe al secondo colpo');
  if (!oss.fragili.proiettileColpisce || !oss.fragili.proiettileAssorbito) violazioni.push('fragili: il proiettile non colpisce la botte');
  { const c = oss.fragili.premiCapodimonte, T = { moneta: 0.3, mezzaMaschera: 0.1, ragno: 0.15 };
    for (const [k, atteso] of Object.entries(T)) if (Math.abs((c[k] || 0) - atteso) > 0.07) violazioni.push(`Capodimonte: ${k} ${c[k]} lontano da ${atteso}`); }

  await allestisci(2, 'vasi-di-capodimonte', [], { x: 320, y: 262 });
  oss.ragno = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.stanzaCorrente;
    let n = null;
    // si rompono vasi finché non esce il ragno (tabella: 15%)
    for (let k = 0; k < 400 && !n; k++) {
      const va = I.variantiB7().find((x) => x.id === 'vasi-di-capodimonte');
      const f = I.elementiVarianteB7(va, 2).ostacoli.find((o) => o.variante === 'capodimonte');
      st.ostacoli.push(f); st.fragiliB7.push(f);
      if (I.rompiFragileB7(st, f) === 'ragno') n = st.nemici[st.nemici.length - 1];
    }
    st.oggettiATerra.length = 0;
    return n ? { tipo: n.tipo, hp: n.hp, stordito: n.stunTicks > 0, vivo: n.hp > 0, nemiciInStanza: st.nemici.length } : null;
  });
  if (!oss.ragno || !oss.ragno.vivo || !oss.ragno.stordito) violazioni.push('Capodimonte: il ragno arrabbiato non compare');
  await p.waitForTimeout(250);
  await p.screenshot({ path: foto('capodimonte-ragno') });

  await allestisci(2, 'polveriera-in-fila', ['predone'], { x: 320, y: 262 });
  oss.polvere = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.stanzaCorrente;
    const casse = st.fragiliB7.filter((f) => f.fragileB7.esplode);
    const r = { casse: casse.length };
    const nem = st.nemici[0];
    nem.x = casse[0].x + 20; nem.y = casse[0].y + 20;
    const hpPrima = nem.hp;
    I.player.x = casse[0].x - 30; I.player.y = casse[0].y; I.player.invuln = 0; I.statoRun.graziaIngressoC = 0;
    I.statoRun.hpHalf = I.statoRun.maxHpHalf;
    I.colpisciFragileB7(st, casse[0]);
    for (let k = 0; k < 90; k++) { I.player.invuln = Math.max(I.player.invuln, 0); I.passoLogico(); }
    r.nemicoFerito = nem.hp < hpPrima;
    r.giocatoreFerito = I.statoRun.maxHpHalf - I.statoRun.hpHalf;
    r.casseRimaste = st.fragiliB7.filter((f) => f.fragileB7.esplode).length; // la catena le accende tutte
    I.statoRun.hpHalf = I.statoRun.maxHpHalf;
    return r;
  });
  if (!oss.polvere.nemicoFerito) violazioni.push('polvere: lo scoppio non ferisce il nemico vicino');
  if (oss.polvere.giocatoreFerito < 1) violazioni.push('polvere: lo scoppio non ferisce Ferruccio a ridosso');
  if (oss.polvere.casseRimaste !== 0) violazioni.push('polvere: la catena non accende le casse vicine');

  await allestisci(2, 'pedana-e-cancello', [], { x: 320, y: 262 });
  oss.pedana = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.stanzaCorrente;
    const premio = st.premiB7[0], pedana = st.suoloB7.find((o) => o.tipo === 'pedana');
    const r = { premiInAlcova: st.oggettiATerra.filter((o) => o.alcovaB7).length };
    const chiusa = I.regioniB7(st.ostacoli);
    r.premioChiuso = chiusa.di(premio.x, premio.y) !== chiusa.di(I.ENTRATE_C.N.x, I.ENTRATE_C.N.y);
    r.cancelliPrima = st.ostacoli.filter((o) => o.cancelloB7).length;
    I.player.x = pedana.x; I.player.y = pedana.y;
    I.passoLogico();
    r.premuta = pedana.premuta;
    r.cancelliDopo = st.ostacoli.filter((o) => o.cancelloB7).length;
    const aperta = I.regioniB7(st.ostacoli);
    r.premioRaggiungibile = aperta.di(premio.x, premio.y) === aperta.di(I.ENTRATE_C.N.x, I.ENTRATE_C.N.y);
    return r;
  });
  if (!oss.pedana.premioChiuso || !oss.pedana.premuta || oss.pedana.cancelliDopo !== 0 || !oss.pedana.premioRaggiungibile || oss.pedana.premiInAlcova < 1) {
    violazioni.push('pedana: il cancello non chiude/apre il passaggio al premio');
  }
  await p.waitForTimeout(250);
  await p.screenshot({ path: foto('pedana-cancello-aperto') });

  await prepara(1);
  await allestisci(1, 'viale-dei-lampioni', [], { x: 250, y: 188 });
  oss.pozza = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.stanzaCorrente;
    const corri = (x0, y0) => {
      I.player.x = x0; I.player.y = y0; I.player.kbx = 0; I.player.kby = 0;
      I.scivolataB7.attiva = false; I.scivolataB7.vx = 0; I.scivolataB7.vy = 0;
      for (const k of Object.keys(I.keys)) I.keys[k] = false;
      I.keys.KeyD = true;
      for (let k = 0; k < 30; k++) I.passoLogico();
      const xRilascio = I.player.x;
      I.keys.KeyD = false;
      for (let k = 0; k < 60; k++) I.passoLogico();
      return { percorsi: Number((xRilascio - x0).toFixed(1)), abbrivio: Number((I.player.x - xRilascio).toFixed(1)) };
    };
    const r = { sullaPozza: I.sullaPozzaB7(st, 300, 188), fuori: I.sullaPozzaB7(st, 300, 130) };
    r.asciutto = corri(250, 130);
    r.bagnato = corri(250, 188);
    return r;
  });
  if (!oss.pozza.sullaPozza || oss.pozza.fuori) violazioni.push('pozzanghera: area sbagliata');
  if (!(oss.pozza.bagnato.abbrivio > 6) || Math.abs(oss.pozza.asciutto.abbrivio) > 0.5) violazioni.push('pozzanghera: non si scivola (o si scivola anche all\'asciutto)');
  if (!(oss.pozza.bagnato.percorsi < oss.pozza.asciutto.percorsi)) violazioni.push('pozzanghera: la partenza non è più lenta che all\'asciutto');

  await prepara(4);
  await allestisci(4, 'galleria-delle-statue', ['guardia'], { x: 320, y: 262 });
  oss.urti = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const st = I.statoRun.stanzaCorrente;
    const n = st.nemici[0], o = st.ostacoli[0];
    I.statoRun.graziaIngressoC = 0; I.player.invuln = 99999;
    n.x = o.x + 2; n.y = o.y + 1; n.stunTicks = 5;
    I.passoLogico();
    I.player.invuln = 0;
    return { distanza: Number(Math.hypot(n.x - o.x, n.y - o.y).toFixed(1)), minima: o.r + I.STANZE_B7.raggioUrtoNemico };
  });
  if (oss.urti.distanza < oss.urti.minima - 0.6) violazioni.push('nemici: la guardia resta dentro la statua');

  // ---------------------------------------------------------------- 4. le tre scatole del ciarlatano
  oss.scatole = await p.evaluate(() => {
    const I = window.__teatro.interni;
    const C = I.CIARLATANO_B7;
    const mulberry = (a) => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const finoAScegli = (G, aOgniTick) => { for (let k = 0; k < 20000 && G.fase !== 'scegli'; k++) { I.passoManoB7(G); if (aOgniTick) aOgniTick(); } };
    const aCaso = (postaId, rnd) => {
      const G = I.nuovaManoB7(postaId, rnd, null);
      finoAScegli(G);
      return I.scegliScatolaB7(G, Math.floor(rnd() * 3));
    };
    /** Segue la scatola del premio solo con ciò che si vede: posizioni senza nome, continuità del moto. */
    const seguendo = (postaId, rnd) => {
      const G = I.nuovaManoB7(postaId, rnd, null);
      for (let k = 0; k < 20; k++) I.passoManoB7(G); // scatole alzate: si vede il contenuto
      const viste = I.posizioniScatoleB7(G);
      const premio = viste.find((o) => o.alzata > 0.5 && ['monete', 'oggetto'].includes(G.contenuti[o.scatola].tipo));
      if (!premio) return { esito: 'premio non mostrato', onesta: false };
      let occhio = { x: premio.x, y: premio.y }, prima = { x: premio.x, y: premio.y }, saltoMax = 0;
      finoAScegli(G, () => {
        const pos = I.posizioniScatoleB7(G).map((o) => ({ x: o.x, y: o.y })).sort((a, b) => a.x - b.x || a.y - b.y);
        const atteso = { x: occhio.x * 2 - prima.x, y: occhio.y * 2 - prima.y };
        let best = pos[0], bd = Infinity;
        for (const q of pos) { const d = Math.hypot(q.x - atteso.x, q.y - atteso.y); if (d < bd) { bd = d; best = q; } }
        saltoMax = Math.max(saltoMax, Math.hypot(best.x - occhio.x, best.y - occhio.y));
        prima = occhio; occhio = best;
      });
      let posto = 0;
      for (let i = 1; i < 3; i++) if (Math.abs(C.pannello.slotX[i] - occhio.x) < Math.abs(C.pannello.slotX[posto] - occhio.x)) posto = i;
      const esito = I.scegliScatolaB7(G, posto);
      // onestà: sotto la scatola scelta c'è proprio ciò che il disegno mostra alzandola
      for (let k = 0; k < C.rivelaTick * 2 + 2; k++) I.passoManoB7(G);
      const mostrata = I.posizioniScatoleB7(G).find((o) => o.posto === posto);
      const onesta = mostrata.alzata === 1 && G.contenuti[mostrata.scatola].tipo === (esito === 'vinta' ? G.contenuti[0].tipo : esito === 'bomba' ? 'bomba' : 'niente');
      return { esito, onesta, saltoMax };
    };
    const r = { perPosta: {} };
    let seme = 20261110;
    for (const P of C.poste) {
      const rnd = mulberry(seme++);
      let vinteCaso = 0, bombeCaso = 0, vinteSeguendo = 0, oneste = 0, saltoMax = 0;
      for (let k = 0; k < 100; k++) { const e = aCaso(P.id, rnd); if (e === 'vinta') vinteCaso++; if (e === 'bomba') bombeCaso++; }
      for (let k = 0; k < 100; k++) { const x = seguendo(P.id, rnd); if (x.esito === 'vinta') vinteSeguendo++; if (x.onesta) oneste++; saltoMax = Math.max(saltoMax, x.saltoMax || 0); }
      let vinteTante = 0; const N = 3000;
      for (let k = 0; k < N; k++) if (aCaso(P.id, rnd) === 'vinta') vinteTante++;
      // durata e velocità della mano
      const G = I.nuovaManoB7(P.id, rnd, null); let tick = 0, durate = [];
      for (let k = 0; k < 20000 && G.fase !== 'scegli'; k++) { I.passoManoB7(G); tick++; if (G.scambio && G.scambio.t === 0) durate.push(G.scambio.durata); }
      r.perPosta[P.id] = { aCaso100: vinteCaso / 100, bombeACaso100: bombeCaso / 100, aCaso3000: Number((vinteTante / N).toFixed(3)),
        seguendo100: vinteSeguendo / 100, oneste100: oneste / 100, saltoMaxPx: Number(saltoMax.toFixed(1)),
        scambi: durate.length, primoScambioTick: durate[0], ultimoScambioTick: durate[durate.length - 1], secondiDiMano: Number((tick / 60).toFixed(1)) };
    }
    return r;
  });
  for (const [id, x] of Object.entries(oss.scatole.perPosta)) {
    if (x.seguendo100 !== 1) violazioni.push(`scatole (${id}): seguendo la scatola si vince ${x.seguendo100 * 100}% e non 100%`);
    if (x.oneste100 !== 1) violazioni.push(`scatole (${id}): sotto la scatola non c'è ciò che si è visto`);
    if (x.aCaso100 < 0.18 || x.aCaso100 > 0.5) violazioni.push(`scatole (${id}): a caso su 100 mani ${x.aCaso100}, lontano da 1/3`);
    if (Math.abs(x.aCaso3000 - 1 / 3) > 0.035) violazioni.push(`scatole (${id}): a caso su 3000 mani ${x.aCaso3000}, lontano da 1/3`);
  }
  { const P = Object.values(oss.scatole.perPosta);
    if (!(P[0].ultimoScambioTick > P[1].ultimoScambioTick && P[1].ultimoScambioTick >= P[2].ultimoScambioTick)) violazioni.push('scatole: la velocità non cresce con la posta'); }

  // partita vera al tavolino
  await prepara(2);
  const trovaStanza = (tipo, campo) => p.evaluate(({ tipo, campo }) => {
    const I = window.__teatro.interni;
    const ok = () => I.statoRun.mappa.stanze.some((x) => x.tipo === tipo && x[campo]);
    for (let k = 0; k < 800 && !ok(); k++) I.avviaPiano(I.statoRun.piano, false);
    I.statoRun.siparioAttivo = null;
    const m = I.statoRun.mappa;
    const s = m.stanze.find((x) => x.tipo === tipo && x[campo]);
    if (!s) return null;
    const [lato, idG] = Object.entries(s.porte)[0];
    const g = m.perId.get(idG);
    I.statoRun.stanzaCorrente = g; g.pulita = true; g.nemici = [];
    I.statoRun.proiettiliNemici.length = 0;
    I.statoRun.hpHalf = I.statoRun.maxHpHalf; I.player.invuln = 0;
    I.entraInStanza(s, lato);
    I.statoRun.siparioAttivo = null;
    return { dentro: I.statoRun.stanzaCorrente === s, lato };
  }, { tipo, campo });
  oss.tavolino = { ingresso: await trovaStanza('bisca', 'ciarlatanoB7') };
  if (!oss.tavolino.ingresso || !oss.tavolino.ingresso.dentro) violazioni.push('ciarlatano: nessuna Bisca col ciarlatano trovata');
  else {
    await p.evaluate(() => {
      const I = window.__teatro.interni, P = I.CIARLATANO_B7.posto;
      I.player.x = P.x + 30; I.player.y = P.y + 26; I.player.targetX = null;
      I.statoRun.monete = 20;
    });
    await p.waitForTimeout(300);
    await p.screenshot({ path: foto('ciarlatano-in-bisca') });
    oss.tavolino.apertura = await p.evaluate(() => {
      const I = window.__teatro.interni;
      const st = I.statoRun.stanzaCorrente, T = st.ciarlatanoB7;
      I.interagisciStanza();
      const r = { aperto: T.aperto, pannello: Boolean(I.pannelloCiarlatanoB7()) };
      // a tavolino aperto Ferruccio resta fermo anche coi tasti premuti
      const x0 = I.player.x; I.keys.KeyD = true;
      for (let k = 0; k < 10; k++) I.passoLogico();
      I.keys.KeyD = false;
      r.fermo = I.player.x === x0;
      return r;
    });
    await p.waitForTimeout(200);
    await p.screenshot({ path: foto('scatole-poste') });
    oss.tavolino.posta = await p.evaluate(() => {
      const I = window.__teatro.interni;
      const st = I.statoRun.stanzaCorrente, T = st.ciarlatanoB7;
      I.tastoCiarlatanoB7(st, 'Digit2'); // la posta tipica: cinque grani
      const G = T.partita;
      return { monete: I.statoRun.monete, fase: G && G.fase, contenuti: G && G.contenuti.map((c) => c.tipo), partite: T.partite };
    });
    await p.waitForTimeout(700);
    await p.screenshot({ path: foto('scatole-mostra') });
    await p.waitForFunction(() => {
      const T = window.__teatro.interni.statoRun.stanzaCorrente.ciarlatanoB7;
      return T.partita && T.partita.fase === 'mescola' && T.partita.scambio && T.partita.scambio.t >= 4;
    }, null, { timeout: 8000 });
    await p.screenshot({ path: foto('scatole-mescola') });
    await p.waitForFunction(() => window.__teatro.interni.statoRun.stanzaCorrente.ciarlatanoB7.partita.fase === 'scegli', null, { timeout: 15000 });
    await p.waitForTimeout(150);
    await p.screenshot({ path: foto('scatole-scegli') });
    oss.tavolino.vincita = await p.evaluate(() => {
      const I = window.__teatro.interni;
      const st = I.statoRun.stanzaCorrente, T = st.ciarlatanoB7, G = T.partita;
      const monetePrima = I.statoRun.monete;
      const premio = G.contenuti[0];
      const esito = I.scegliCiarlatanoB7(st, G.ordine.indexOf(0));
      for (let k = 0; k < 80 && T.partita && T.partita.fase !== 'esito'; k++) I.passoLogico();
      return { esito, premio: premio.tipo, monete: I.statoRun.monete - monetePrima, piedistallo: Boolean(st.oggettoPiedistallo && !st.oggettoPiedistallo.preso), vinte: T.vinte };
    });
    await p.waitForTimeout(250);
    await p.screenshot({ path: foto('scatole-premio') });
    oss.tavolino.bomba = await p.evaluate(() => {
      const I = window.__teatro.interni;
      const st = I.statoRun.stanzaCorrente, T = st.ciarlatanoB7;
      // un oggetto vinto manda via il ciarlatano: per provare la bomba lo si rimette al tavolino
      T.andato = false; T.oggettoVinto = false; T.vinte = 0; T.partite = 0; T.partita = null;
      st.oggettoPiedistallo = null;
      I.apriCiarlatanoB7(st);
      I.statoRun.monete = 20;
      const G = I.puntaCiarlatanoB7(st, 'tipica');
      G.contenuti[1].tipo = 'bomba'; // (prova) si forza la bomba sotto la seconda scatola, a scatole ancora alzate
      for (let k = 0; k < 4000 && G.fase !== 'scegli'; k++) I.passoLogico();
      const bombePrima = (I.statoRun.bombeA1 || []).length;
      const esito = I.scegliCiarlatanoB7(st, G.ordine.indexOf(1));
      for (let k = 0; k < 80 && T.aperto; k++) I.passoLogico();
      const r = { esito, pannelloChiuso: !T.aperto, bombeAccese: (I.statoRun.bombeA1 || []).length - bombePrima, monete: I.statoRun.monete };
      // si scappa: lontano dalla bomba non ci si fa male
      I.player.x = 420; I.player.y = 250;
      const hp = I.statoRun.hpHalf;
      for (let k = 0; k < 200; k++) I.passoLogico();
      r.scoppiata = (I.statoRun.bombeA1 || []).length === 0;
      r.dannoScappando = hp - I.statoRun.hpHalf;
      return r;
    });
    oss.tavolino.congedo = await p.evaluate(() => {
      const I = window.__teatro.interni;
      const st = I.statoRun.stanzaCorrente, T = st.ciarlatanoB7, C = I.CIARLATANO_B7;
      const r = { vinte: 0, mani: 0 };
      I.statoRun.monete = 30; I.statoRun.hpHalf = I.statoRun.maxHpHalf;
      for (let giro = 0; giro < 10 && !T.andato; giro++) {
        I.apriCiarlatanoB7(st);
        const G = I.puntaCiarlatanoB7(st, 'piccola');
        if (!G) break;
        r.mani++;
        for (let k = 0; k < 4000 && G.fase !== 'scegli'; k++) I.passoLogico();
        if (I.scegliCiarlatanoB7(st, G.ordine.indexOf(0)) === 'vinta') r.vinte++;
        for (let k = 0; k < 400 && T.partita; k++) I.passoLogico();
      }
      r.andato = T.andato; r.vinciteMax = C.vinciteMax;
      // la posta di sangue non prende l'ultima mezza Maschera
      T.andato = false; T.vinte = 0; T.partite = 0;
      I.apriCiarlatanoB7(st); I.statoRun.hpHalf = 1;
      r.ultimaMascheraRifiutata = I.puntaCiarlatanoB7(st, 'maschera') === null && I.statoRun.hpHalf === 1;
      I.statoRun.hpHalf = I.statoRun.maxHpHalf; T.aperto = false;
      return r;
    });
    const t = oss.tavolino;
    if (!t.apertura.aperto || !t.apertura.pannello || !t.apertura.fermo) violazioni.push('ciarlatano: il tavolino non si apre con [E] o Ferruccio si muove');
    if (t.posta.monete !== 15 || t.posta.fase !== 'mostra') violazioni.push('ciarlatano: la posta tipica non costa 5 grani');
    if (t.vincita.esito !== 'vinta' || !(t.vincita.premio === 'monete' ? t.vincita.monete === 10 : (t.vincita.piedistallo || t.vincita.monete > 0))) violazioni.push('ciarlatano: il premio non arriva');
    if (t.bomba.esito !== 'bomba' || !t.bomba.pannelloChiuso || t.bomba.bombeAccese !== 1 || !t.bomba.scoppiata || t.bomba.dannoScappando !== 0) violazioni.push('ciarlatano: la bomba accesa non spunta o non si può scappare');
    if (!t.congedo.andato || t.congedo.vinte !== t.congedo.vinciteMax) violazioni.push('ciarlatano: non se ne va dopo le vincite previste');
    if (!t.congedo.ultimaMascheraRifiutata) violazioni.push("ciarlatano: accetta l'ultima mezza Maschera");
  }

  // ---------------------------------------------------------------- 5. la Clessidra della Ribalta
  const provaClessidra = async (lasciaScadere, nome) => {
    await prepara(2);
    const ing = await trovaStanza('sfida', 'clessidraB7');
    if (!ing || !ing.dentro) { violazioni.push('clessidra: nessuna Sfida a tempo trovata'); return null; }
    const avvio = await p.evaluate(() => {
      const I = window.__teatro.interni;
      const st = I.statoRun.stanzaCorrente, S = st.sfidaA3, K = st.clessidraB7;
      const P = I.STANZE_SPECIALI_A3.sfida.piedistallo;
      I.player.x = P.x; I.player.y = P.y + 6;
      I.passoLogico();
      I.player.x = 420; I.player.y = 250;
      return { avviata: S.avviata, ondateTot: S.ondateTot, secondi: Math.round(K.totTick / 60), premio: K.premioPieno.nome };
    });
    await p.evaluate((lasciaScadere) => {
      const I = window.__teatro.interni;
      const K = I.statoRun.stanzaCorrente.clessidraB7;
      I.player.invuln = 99999; // in posa per la fotografia
      K.restoTick = Math.round(K.totTick * (lasciaScadere ? 0.5 : 0.72));
    }, lasciaScadere);
    await p.waitForTimeout(300);
    await p.screenshot({ path: foto(`clessidra-${nome}`) });
    if (lasciaScadere) {
      await p.evaluate(() => { const I = window.__teatro.interni; I.statoRun.stanzaCorrente.clessidraB7.restoTick = 60 * 5; I.player.invuln = 99999; });
      await p.waitForTimeout(350);
      await p.screenshot({ path: foto('clessidra-ultimi-secondi') });
    }
    const fine = await p.evaluate((lasciaScadere) => {
      const I = window.__teatro.interni;
      const st = I.statoRun.stanzaCorrente, S = st.sfidaA3, K = st.clessidraB7;
      const r = { hpPrima: I.statoRun.hpHalf };
      if (lasciaScadere) {
        // nessun nemico vivo che possa ferire: si misura solo il tempo
        for (let k = 0; k < K.totTick + 120 && !K.scaduta; k++) { I.player.invuln = 99999; I.passoLogico(); }
        r.scaduta = K.scaduta; r.fase = I.statoRun.fase; r.hpDopoLaSabbia = I.statoRun.hpHalf;
        r.premioInVista = S.premio && S.premio.sprite;
      }
      for (let guard = 0; guard < 20 && !S.finita; guard++) {
        for (const n of st.nemici) n.hp = 0;
        I.verificaStanzaPulita();
        for (let t = 0; t < 300 && S.attesa > 0; t++) { I.player.invuln = 99999; I.passoLogico(); }
      }
      I.player.invuln = 0;
      r.finita = S.finita; r.esito = K.esito;
      r.oggettoSulPiedistallo = Boolean(st.oggettoPiedistallo && !st.oggettoPiedistallo.preso && !st.oggettoPiedistallo.consolazioneB7);
      r.monete = st.oggettiATerra.filter((o) => o.tipo === 'moneta').length;
      r.restoSecondi = Math.round(K.restoTick / 60);
      return r;
    }, lasciaScadere);
    await p.waitForTimeout(250);
    await p.screenshot({ path: foto(`clessidra-${nome}-fine`) });
    return { avvio, fine };
  };
  oss.clessidraPiena = await provaClessidra(false, 'in-tempo');
  oss.clessidraRidotta = await provaClessidra(true, 'a-meta');
  { const C = await p.evaluate(() => window.__teatro.interni.CLESSIDRA_B7);
    const a = oss.clessidraPiena, b = oss.clessidraRidotta;
    if (a && (a.fine.esito !== 'pieno' || !a.fine.oggettoSulPiedistallo || a.fine.monete < C.monetePieno)) violazioni.push('clessidra: premio pieno sbagliato');
    if (b && (!b.fine.scaduta || b.fine.esito !== 'ridotto' || b.fine.oggettoSulPiedistallo || b.fine.monete < C.moneteRidotto)) violazioni.push('clessidra: premio ridotto sbagliato');
    if (b && (b.fine.fase !== 'in_gioco' || b.fine.hpDopoLaSabbia !== b.fine.hpPrima)) violazioni.push('clessidra: la sabbia finita ferisce o uccide');
  }

  console.log(JSON.stringify(oss, null, 1));
  console.log(`\nviolazioni: ${violazioni.length}${violazioni.length ? '\n - ' + violazioni.join('\n - ') : ''}`);
  console.log(`errori di console: ${errori.length}${errori.length ? '\n - ' + errori.slice(0, 12).join('\n - ') : ''}`);
  await browser.close();
  process.exit(violazioni.length || errori.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
