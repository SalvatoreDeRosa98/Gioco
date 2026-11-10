#!/usr/bin/env node
/*
 * tools/qa-teatro-immagini.js — verifica Playwright delle IMMAGINI DI SCENA dell'autore
 * (gioco/teatro/b9-immagini.js, tabella IMMAGINI_B9).
 *
 * Cosa controlla:
 *   1. la tabella ha una voce per ogni PNG di gioco/assets/sprite_teatro/scena/ e ogni voce scartata ha un motivo;
 *   2. ogni immagine con `usa: true` si carica e viene disegnata almeno una volta nel suo contesto (palchetti,
 *      ribalta, ostacoli dei quattro quartieri, forzieri, stanze speciali, trasformazioni, interfaccia);
 *   3. le immagini scartate non vengono nemmeno richieste;
 *   4. senza risorse (il caricatore risponde null) le stesse scene si disegnano coi ripieghi a codice, senza errori;
 *   5. nessun errore di console; il costo del fotogramma su una stanza piena non sale;
 *   6. con --release <cartella>: rigenera lì la release, controlla che incorpori ESATTAMENTE le immagini usate
 *      e che parta (stesse scene, immagini dai data: URI).
 * Foto: per ogni scena tre scatti (prima = tutto a codice, dopo = scelta della tabella, prova = tutte le
 * immagini accese, anche le scartate) e un foglio affiancato per gruppo: <prefisso><gruppo>-prima-dopo.png.
 *
 * Uso: node tools/qa-teatro-immagini.js <file html> <prefisso assoluto> [--release <cartella>] [--solo <gruppo>]
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const argomenti = process.argv.slice(2);
const opzione = (nome) => { const i = argomenti.indexOf(nome); return i >= 0 ? argomenti.splice(i, 2)[1] : null; };
const cartellaRelease = opzione('--release');
const soloGruppo = opzione('--solo');
const file = path.resolve(RADICE, argomenti[0] || 'gioco/teatro_marionette.html');
const pref = argomenti[1] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-immagini-');
fs.mkdirSync(pref.endsWith('/') ? pref : path.dirname(pref), { recursive: true });
const foto = (n) => `${pref}${n}.png`;

/** Limiti dei controlli. */
const LIMITI = Object.freeze({
  costoInPiuMs: 0.35,        // costo medio in più per fotogramma, immagini accese contro spente (stanza piena)
  fotogrammiMisura: 240,
  attesaCaricoMs: 8000,
});

/** Ritaglio in px logici (640×360) → riquadro dello screenshot. */
async function ritaglioPagina(p, r) {
  if (!r) return undefined;
  return p.evaluate(([x, y, w, h]) => {
    const c = document.querySelector('canvas').getBoundingClientRect(), k = c.width / 640;
    return { x: c.left + x * k, y: c.top + y * k, width: w * k, height: h * k };
  }, r);
}

/** Aiuti dentro la pagina (window.__qaB9): scene di prova costruite a mano, senza toccare la logica. */
function installaAiuti() {
  const I = window.__teatro.interni;
  const O = (tipo, x, y, r, extra) => Object.assign({ tipo, x, y, r, w: r * 2, h: r * 2, acceso: false }, extra || {});
  const Q = {
    avvia(piano = 1) {
      statoRun.fase = 'in_gioco'; nuovaRun(false);
      if (piano > 1) avviaPiano(piano, false);
      statoRun.siparioAttivo = null;
      statoRun.pausa = false;
      if (typeof b3 !== 'undefined') b3.opz = null;
      Q.mostra = null;
    },
    stanzaVuota() {
      const st = statoRun.stanzaCorrente;
      st.nemici = []; st.pulita = true; st.ostacoli = []; st.suoloB7 = []; st.oggettiATerra = []; st.forzieriA1 = [];
      statoRun.proiettiliNemici.length = 0; statoRun.proiettili.length = 0;
      statoRun.hpHalf = statoRun.maxHpHalf; player.invuln = 0;
      player.x = 320; player.y = 210;
      Q.zitto();
      return st;
    },
    /** Niente cartigli sopra le foto: notifiche di sblocco (a6), annunci e banner. */
    zitto() { try { a6.coda.length = 0; a6.notifica = null; } catch (_) { /* a6 non c'è */ } statoRun.bannerTimer = 0; statoRun.cartiglioD = null; },
    rientra() { const st = statoRun.stanzaCorrente; entraInStanza(st, null); statoRun.siparioAttivo = null; st.nemici = []; st.pulita = true; player.x = 320; player.y = 205; },
    /** Mostra di tutti gli ostacoli del quartiere `q` (stessi campi che creano 30-mappa.js e b7-stanze.js). */
    ostacoli(q) {
      Q.avvia(q);
      const st = Q.stanzaVuota();
      const fragile = { 1: 'botte', 2: 'vaso', 3: 'balla', 4: 'baule' }[q];
      const su = 150, giu = 250;
      st.ostacoli = [
        O('colonna', 122, su, 14), O('colonna', 184, su, 14),
        O('braciere', 250, su, 10, { acceso: true }), O('braciere', 300, su, 10),
        O('colonna', 352, su, 12, { variante: 'polvere', fragileB7: { genere: 'polvere', colpi: 2, esplode: true } }),
        O('braciere', 404, su, 8, { variante: 'candela', acceso: true }),
        O('colonna', 456, su, 11, { variante: fragile, fragileB7: { genere: 'comune', colpi: 2, esplode: false } }),
      ];
      const propri = {
        1: [O('colonna', 130, giu, 7, { variante: 'lampione' }), O('colonna', 200, giu, 7, { variante: 'lampione' })],
        2: [O('fossa', 130, giu, 15, { variante: 'aiuola', w: 34, h: 18 }), O('colonna', 210, giu, 19, { variante: 'fontana', w: 40, h: 20 })],
        3: [O('colonna', 130, giu, 15, { variante: 'telaio', w: 34, h: 20 }), O('colonna', 200, giu, 12, { variante: 'balla', fragileB7: { genere: 'comune', colpi: 2, esplode: false } })],
        4: [O('colonna', 130, giu, 12, { variante: 'marmo' }), O('colonna', 195, giu, 13, { variante: 'statua' }), O('colonna', 250, giu, 10, { variante: 'capodimonte', fragileB7: { genere: 'capodimonte', colpi: 1, esplode: false } })],
      }[q];
      st.ostacoli.push(...propri);
      st.suoloB7 = [
        { tipo: 'spuntoni', x: 400, y: giu - 4, sfasa: 0, fotoB9: { fase: 'giu', alt: 0, pericolo: false } },
        { tipo: 'spuntoni', x: 444, y: giu - 4, sfasa: 0, fotoB9: { fase: 'su', alt: 0.5, pericolo: true } },
        { tipo: 'spuntoni', x: 488, y: giu - 4, sfasa: 0, fotoB9: { fase: 'su', alt: 1, pericolo: true } },
        { tipo: 'sacco', x: 540, y: giu, r: 12, stato: 'appeso', t: 0 },
      ];
      if (!Q.spuntoniBase) { // i tre stati dei chiodi fermi per la foto (solo qui, solo per gli spuntoni di prova)
        Q.spuntoniBase = statoSpuntoniB7;
        statoSpuntoniB7 = function (o, t) { return o && o.fotoB9 ? o.fotoB9 : Q.spuntoniBase(o, t); };
      }
      Q.rientra();
      player.x = 320; player.y = 200;
      return st.ostacoli.map((o) => `${o.variante || o.tipo}:${I.immaginiB9.pelleOstacolo(o) || 'codice'}`);
    },
    /** Stanza piena per la misura del costo: 40 ostacoli e le trappole. */
    stanzaPiena() {
      Q.avvia(1);
      const st = Q.stanzaVuota();
      const varianti = [null, null, 'lampione', 'polvere', 'botte', 'candela', null];
      for (let i = 0; i < 40; i++) {
        const v = varianti[i % varianti.length], x = 110 + (i % 10) * 46, y = 110 + Math.floor(i / 10) * 44;
        st.ostacoli.push(v === 'candela' ? O('braciere', x, y, 8, { variante: v, acceso: true }) : i % 7 === 6 ? O('braciere', x, y, 10, { acceso: true }) : O('colonna', x, y, 12, v ? { variante: v } : {}));
      }
      for (let i = 0; i < 8; i++) st.suoloB7.push({ tipo: 'spuntoni', x: 120 + i * 56, y: 290, sfasa: i * 20 });
      generaForziere('comune', 300, 300, st); generaForziere('chiuso', 340, 300, st);
      Q.rientra();
    },
    trovaStanza(tipo, campo) {
      const ok = () => statoRun.mappa.stanze.some((x) => x.tipo === tipo && (!campo || x[campo]));
      for (let k = 0; k < 900 && !ok(); k++) avviaPiano(statoRun.piano, false);
      statoRun.siparioAttivo = null;
      const m = statoRun.mappa, s = m.stanze.find((x) => x.tipo === tipo && (!campo || x[campo]));
      if (!s) return false;
      const [lato, idG] = Object.entries(s.porte)[0];
      const g = m.perId.get(idG);
      statoRun.stanzaCorrente = g; g.pulita = true; g.nemici = [];
      statoRun.proiettiliNemici.length = 0;
      statoRun.hpHalf = statoRun.maxHpHalf; player.invuln = 0;
      entraInStanza(s, lato);
      statoRun.siparioAttivo = null;
      return statoRun.stanzaCorrente === s;
    },
    /** Mostra dei costumi: i quattro personaggi con Re di Denari, Pulcinella Traditore, Ombra del Velo (e girati). */
    costumi() {
      Q.avvia(1); Q.stanzaVuota();
      const temi = [['denari'], ['maschera'], ['ombra'], ['denari', 'maschera', 'ombra']];
      const chi = ['ferruccio', 'agnese', 'taddeo', 'ombra'];
      Q.mostra = () => {
        const s = I.statoB4();
        const salvato = { attive: s.attive, ordine: s.ordine };
        ctx.save();
        ctx.fillStyle = '#2a2018'; ctx.fillRect(60, 60, 520, 262);
        ctx.restore();
        for (let r = 0; r < chi.length; r++) {
          for (let c = 0; c < temi.length * 2; c++) {
            const tema = temi[c >> 1];
            s.attive = Object.fromEntries(tema.map((t) => [t, true])); s.ordine = tema.slice();
            disegnaFerruccioPittorico(100 + c * 62, 118 + r * 64, { scale: 1, tick: c % 2 ? tick : 0, flipX: c % 2 === 1, moving: c % 2 === 1,
              charInfo: PERSONAGGI_GIOCABILI[chi[r]], sinergie: statoRun.sinergieVisive });
          }
        }
        s.attive = salvato.attive; s.ordine = salvato.ordine;
      };
    },
  };
  // la mostra dei costumi si disegna sopra ogni frame, finché Q.mostra è impostata
  const base = disegnaFrame;
  disegnaFrame = function (...a) { const r = base.apply(this, a); if (Q.mostra) { try { Q.mostra(); } catch (e) { console.error('[qa] mostra', e); } } return r; };
  window.__qaB9 = Q;
}

/**
 * Le scene: `prepara` costruisce la situazione (una volta per modo), `scatto` gira subito prima della foto,
 * `attesa` ms prima dello scatto, `ritaglio` in px logici, `zoom` del foglio affiancato.
 */
const SCENE = [
  { gruppo: 'palchetti-platea', nome: 'ovazione', attesa: 1500,
    prepara: () => { __qaB9.avvia(1); __qaB9.stanzaVuota(); impostaGradimentoB1(0.95, true); },
    scatto: () => { pubblicoB1.fiori.length = 0; pubblicoB1.umore.t = 0; reazionePubblicoB1('ovazione'); } },
  { gruppo: 'palchetti-platea', nome: 'palchi-da-vicino', ritaglio: [0, 60, 300, 240], zoom: 1, attesa: 300,
    prepara: () => { __qaB9.avvia(1); __qaB9.stanzaVuota(); impostaGradimentoB1(0.95, true); } },
  { gruppo: 'palchetti-platea', nome: 'fischi-e-pomodori', ritaglio: [200, 130, 240, 150], zoom: 1.25, attesa: 1300,
    prepara: () => { __qaB9.avvia(1); __qaB9.stanzaVuota(); impostaGradimentoB1(0.1, true); },
    scatto: () => { pubblicoB1.fiori.length = 0; pubblicoB1.umore.t = 0; reazionePubblicoB1('fischi'); } },
  { gruppo: 'palchetti-platea', nome: 'sipario', attesa: 1100,
    prepara: () => { statoRun.pausa = false; b3.opz = null; __qaB9.mostra = null; statoRun.fase = 'in_gioco'; nuovaRun(false); } },
  { gruppo: 'ribalta', nome: 'lumi-e-cavi', ritaglio: [70, 130, 500, 200], zoom: 0.62, attesa: 1500,
    prepara: () => { __qaB9.avvia(1); const st = __qaB9.stanzaVuota(); st.ostacoli = [{ tipo: 'colonna', x: 200, y: 240, r: 14, w: 26, h: 26 }, { tipo: 'braciere', x: 320, y: 250, r: 10, w: 20, h: 20, acceso: true }, { tipo: 'colonna', x: 440, y: 240, r: 7, w: 14, h: 14, variante: 'lampione' }]; __qaB9.rientra(); player.x = 260; player.y = 200; statoRun.stanzaCorrente.pulita = false; } },
  ...[1, 2, 3, 4].map((q) => ({ gruppo: `ostacoli-${['corso-trieste', 'villa-comunale', 'san-leucio', 'reggia'][q - 1]}`, nome: 'mostra', ritaglio: [70, 70, 500, 220], zoom: 0.62, attesa: 1500,
    prepara: (qq) => __qaB9.ostacoli(qq), arg: q })),
  { gruppo: 'forzieri-lucchetto', nome: 'forzieri', ritaglio: [200, 160, 240, 80], zoom: 1.25, attesa: 400,
    prepara: () => { __qaB9.avvia(2); const st = __qaB9.stanzaVuota(); const a = generaForziere('comune', 240, 205, st), b = generaForziere('comune', 290, 205, st), c = generaForziere('chiuso', 350, 205, st), d = generaForziere('chiuso', 400, 205, st); for (const f of [b, d]) if (f) f.aperto = true; if (!a || !c) throw new Error('generaForziere non restituisce il forziere'); player.x = 320; player.y = 260; } },
  { gruppo: 'forzieri-lucchetto', nome: 'lucchetto', zoom: 2, attesa: 400,
    prepara: () => { __qaB9.avvia(2); const st = __qaB9.stanzaVuota(); const [lato, id] = Object.entries(st.porte)[0]; statoRun.mappa.perId.get(id).chiusaA1 = true; window.__qaB9.porta = PORTE_C[lato]; player.x = 320; player.y = 200; },
    ritaglioDa: () => { const P = window.__qaB9.porta; return [Math.max(0, Math.min(520, P.x - 60)), Math.max(0, Math.min(280, P.y - 40)), 120, 80]; } },
  { gruppo: 'stanze-speciali', nome: 'bisca', ritaglio: [80, 70, 400, 150], zoom: 0.78, attesa: 500,
    prepara: () => { __qaB9.avvia(2); if (!__qaB9.trovaStanza('bisca', 'ciarlatanoB7')) throw new Error('nessuna Bisca col ciarlatano'); const st = statoRun.stanzaCorrente; if (!st.biscaA3.cartomante) st.biscaA3.cartomante = { grani: 0, andata: false }; st.biscaA3.cartomante.andata = false; st.biscaA3.ultimo = { numero: 47 }; st.oggettoPiedistallo = null; player.x = 320; player.y = 250; } },
  { gruppo: 'stanze-speciali', nome: 'sacrificio', ritaglio: [240, 110, 160, 110], zoom: 1.6, attesa: 500,
    prepara: () => { __qaB9.avvia(2); if (!__qaB9.trovaStanza('sacrificio')) throw new Error('nessuna stanza del Sacrificio'); statoRun.stanzaCorrente.sacrificioA3.fatti = 3; player.x = 320; player.y = 250; } },
  { gruppo: 'stanze-speciali', nome: 'clessidra', ritaglio: [158, 80, 150, 150], zoom: 1.6, attesa: 500,
    prepara: () => { __qaB9.avvia(2); if (!__qaB9.trovaStanza('sfida', 'clessidraB7')) throw new Error('nessuna Sfida con la clessidra'); const st = statoRun.stanzaCorrente, K = st.clessidraB7; K.restoTick = Math.round(K.totTick * 0.62); st.nemici = []; player.x = 400; player.y = 250; } },
  { gruppo: 'trasformazioni', nome: 'costumi', ritaglio: [60, 60, 520, 262], zoom: 0.6, attesa: 400,
    prepara: () => __qaB9.costumi() },
  { gruppo: 'interfaccia', nome: 'opzioni-scena', attesa: 400,
    prepara: () => { __qaB9.avvia(1); __qaB9.stanzaVuota(); segnaDispositivoB3('tastiera'); statoRun.pausa = true; apriOpzioniB3('pausa'); b3.opz.sel = 4; } },
  { gruppo: 'interfaccia', nome: 'opzioni-tasti', attesa: 400,
    prepara: () => { __qaB9.avvia(1); __qaB9.stanzaVuota(); segnaDispositivoB3('tastiera'); statoRun.pausa = true; apriOpzioniB3('pausa'); cambiaPaginaB3('tasti'); b3.opz.sel = 2; } },
  { gruppo: 'interfaccia', nome: 'pausa-col-gamepad', attesa: 400,
    prepara: () => { __qaB9.avvia(1); __qaB9.stanzaVuota(); statoRun.pausa = true; segnaDispositivoB3('pad'); b3.cursorePausa = 2; },
    scatto: () => { segnaDispositivoB3('pad'); b3.cursorePausa = 2; } },
  { gruppo: 'interfaccia', nome: 'scena-col-gamepad', ritaglio: [0, 250, 640, 110], zoom: 0.5, attesa: 400,
    prepara: () => { __qaB9.avvia(2); const st = __qaB9.stanzaVuota(); generaForziere('comune', 330, 290, st); player.x = 320; player.y = 292; segnaDispositivoB3('pad'); },
    scatto: () => { segnaDispositivoB3('pad'); }, dopo: () => { segnaDispositivoB3('tastiera'); } },
  { gruppo: 'interfaccia', nome: 'segni-dei-boss', attesa: 500,
    prepara: () => { statoRun.pausa = false; b3.opz = null; __qaB9.mostra = null; segnaDispositivoB3('tastiera'); statoRun.fase = 'menu_selezione';
      if (!__qaB9.statoA6Base) { __qaB9.statoA6Base = statoA6; statoA6 = function () { const s = __qaB9.statoA6Base(); if (__qaB9.segniFinti) for (const id of Object.keys(PERSONAGGI_GIOCABILI)) s.segni[id] = SEGNI_A6.map((x) => x.boss); return s; }; }
      __qaB9.segniFinti = true; },
    dopo: () => { __qaB9.segniFinti = false; } },
];

/** Le immagini della tabella che hanno un contesto di prova in SCENE (tutte quelle collegabili). */
const MODI = Object.freeze([['prima', false], ['dopo', null], ['prova', true]]);

async function apri(browser, fileHtml, errori) {
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  await p.goto('file://' + fileHtml);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await p.evaluate(installaAiuti);
  return p;
}

/** Gira tutte le scene in un modo; con `scatta` salva le foto. Torna i disegni contati per immagine. */
async function giraScene(p, modo, forzatura, scatta, scene) {
  for (const sc of scene) {
    await p.evaluate((f) => { const B = window.__teatro.interni.immaginiB9; if (f === 'senza') B.senzaRisorse(true); else B.forzaTutte(f); }, forzatura);
    await p.evaluate(`(${sc.prepara.toString()})(${JSON.stringify(sc.arg === undefined ? null : sc.arg)})`);
    await p.waitForTimeout(sc.scatto ? 250 : 80);
    if (sc.scatto) await p.evaluate(`(${sc.scatto.toString()})()`);
    await p.evaluate(() => window.__qaB9.zitto());
    await p.waitForTimeout(scatta ? (sc.attesa || 300) : Math.min(sc.attesa || 300, 500));
    if (scatta) {
      await p.evaluate(() => window.__qaB9.zitto());
      await p.waitForTimeout(60);
      const r = sc.ritaglioDa ? await p.evaluate(`(${sc.ritaglioDa.toString()})()`) : sc.ritaglio;
      await p.screenshot({ path: foto(`${sc.gruppo}-${sc.nome}-${modo}`), clip: await ritaglioPagina(p, r) });
    }
    if (sc.dopo) await p.evaluate(`(${sc.dopo.toString()})()`);
  }
}

/** Foglio affiancato di un gruppo: una riga per scena, tre colonne (prima, dopo, prova). */
async function affianca(browser, gruppo, scene) {
  const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
  const righe = scene.map((sc) => {
    const celle = MODI.map(([modo]) => `<td><img src="${b64(foto(`${sc.gruppo}-${sc.nome}-${modo}`))}" style="zoom:${sc.zoom || 0.5}"></td>`).join('');
    return `<tr><th colspan="3">${sc.nome.replace(/-/g, ' ')}</th></tr><tr>${celle}</tr>`;
  }).join('');
  const html = `<html><body style="margin:0;background:#15100c;color:#f3dfc1;font:bold 15px Georgia,serif"><table id="t" style="border-collapse:separate;border-spacing:8px">
    <tr><td style="color:#f9cb40">PRIMA · disegno a codice</td><td style="color:#f9cb40">DOPO · scelta fatta (immagini dell'autore dove migliorano)</td><td style="color:#f9cb40">PROVA · tutte le immagini accese, anche le scartate</td></tr>
    ${righe}</table><style>img{display:block;image-rendering:pixelated}th{text-align:left;color:#c9a679;font-weight:normal;padding-top:6px}</style></body></html>`;
  const pg = await browser.newPage({ viewport: { width: 2000, height: 1200 }, deviceScaleFactor: 1 });
  await pg.setContent(html);
  await pg.waitForTimeout(150);
  await (await pg.$('#t')).screenshot({ path: foto(`${gruppo}-prima-dopo`) });
  await pg.close();
}

(async () => {
  const browser = await chromium.launch();
  const errori = [];
  const esiti = [];
  const ok = (nome, cond, info) => esiti.push({ nome, ok: Boolean(cond), info });
  const scene = soloGruppo ? SCENE.filter((s) => s.gruppo.startsWith(soloGruppo)) : SCENE;

  // ------------------------------------------------------------------ 1. tabella e cartella
  let p = await apri(browser, file, errori);
  const tabella = await p.evaluate(() => { const T = window.__teatro.interni.IMMAGINI_B9; return Object.fromEntries(Object.entries(T).map(([k, v]) => [k, { usa: v.usa, motivo: v.motivo || '', celle: v.celle, alt: v.alt, dove: v.dove }])); });
  const cartella = path.join(path.dirname(file), 'assets', 'sprite_teatro', 'scena');
  const suDisco = fs.existsSync(cartella) ? fs.readdirSync(cartella).filter((n) => n.endsWith('.png')).map((n) => n.slice(0, -4)).sort() : null;
  const usate = Object.keys(tabella).filter((n) => tabella[n].usa).sort();
  const scartate = Object.keys(tabella).filter((n) => !tabella[n].usa).sort();
  if (suDisco) {
    ok('tabella: una voce per ogni PNG della cartella scena/', suDisco.every((n) => tabella[n]) && Object.keys(tabella).every((n) => suDisco.includes(n)),
      { senzaVoce: suDisco.filter((n) => !tabella[n]), senzaFile: Object.keys(tabella).filter((n) => !suDisco.includes(n)) });
  }
  ok('tabella: ogni immagine scartata ha il motivo', scartate.every((n) => tabella[n].motivo.length > 10), scartate.filter((n) => tabella[n].motivo.length <= 10));

  // ------------------------------------------------------------------ 2. caricamento
  await p.waitForFunction((nomi) => { const S = window.__teatro.interni.immaginiB9.stato(); return nomi.every((n) => S[n].pronta || S[n].errore); }, usate, { timeout: LIMITI.attesaCaricoMs }).catch(() => {});
  let stato = await p.evaluate(() => window.__teatro.interni.immaginiB9.stato());
  ok('tutte le immagini usate si caricano', usate.every((n) => stato[n].pronta && !stato[n].errore), usate.filter((n) => !stato[n].pronta));
  ok('le immagini scartate non vengono richieste', scartate.every((n) => !stato[n].pronta && !stato[n].errore), scartate.filter((n) => stato[n].pronta || stato[n].errore));

  // ------------------------------------------------------------------ 3. scene: prima / dopo / prova
  if (!soloGruppo) {
    // costo del fotogramma su una stanza piena: immagini spente, poi accese (stessa stanza, stessi fotogrammi)
    const costo = await p.evaluate(async (n) => {
      const B = window.__teatro.interni.immaginiB9;
      __qaB9.stanzaPiena();
      await new Promise((r) => setTimeout(r, 1400));
      const misura = () => { let tot = 0; const dt = 1000 / 60; for (let i = 0; i < n; i++) { const t0 = performance.now(); iniziaFrame(); disegnaFrame(dt); tot += performance.now() - t0; } return tot / n; };
      const out = { spente: [], accese: [] };
      for (let giro = 0; giro < 3; giro++) {
        B.forzaTutte(false); misura(); out.spente.push(misura());
        B.forzaTutte(null); misura(); out.accese.push(misura());
      }
      B.forzaTutte(null);
      const min = (a) => Math.min(...a);
      return { spente: +min(out.spente).toFixed(3), accese: +min(out.accese).toFixed(3), tutte: out };
    }, LIMITI.fotogrammiMisura).catch((e) => ({ errore: String(e) }));
    ok(`costo del fotogramma su una stanza piena: non sale più di ${LIMITI.costoInPiuMs} ms`, costo.accese !== undefined && costo.accese - costo.spente <= LIMITI.costoInPiuMs, costo);
  }
  for (const [modo, forzatura] of MODI) {
    if (modo === 'dopo') await p.evaluate(() => window.__teatro.interni.immaginiB9.azzeraConti());
    await giraScene(p, modo, forzatura, true, scene);
    if (modo === 'dopo') stato = await p.evaluate(() => window.__teatro.interni.immaginiB9.stato());
  }
  await p.evaluate(() => window.__teatro.interni.immaginiB9.forzaTutte(null));
  if (!soloGruppo) {
    ok('ogni immagine usata è disegnata almeno una volta nel suo contesto', usate.every((n) => stato[n].disegni > 0), usate.filter((n) => !stato[n].disegni));
    ok('le immagini scartate non sono mai disegnate con la tabella così com\'è', scartate.every((n) => !stato[n].disegni), scartate.filter((n) => stato[n].disegni));
  }
  for (const g of [...new Set(scene.map((s) => s.gruppo))]) await affianca(browser, g, scene.filter((s) => s.gruppo === g));
  ok('nessun errore di console con le immagini', errori.length === 0, errori.slice(0, 6));
  const guasti = await p.evaluate(() => window.__teatro.interni.immaginiB9.errori());
  ok('nessun disegno di b9 è caduto sul ripiego per un errore', guasti === 0, guasti);
  await p.close();

  // ------------------------------------------------------------------ 4. senza risorse: ripieghi a codice
  if (!soloGruppo) {
    const erroriSenza = [];
    p = await apri(browser, file, erroriSenza);
    await p.evaluate(() => { const B = window.__teatro.interni.immaginiB9; B.senzaRisorse(true); B.azzeraConti(); });
    await giraScene(p, 'senza', 'senza', false, SCENE);
    const senza = await p.evaluate(() => { const B = window.__teatro.interni.immaginiB9, S = B.stato(); return { disegni: Object.keys(S).filter((n) => S[n].disegni), guasti: B.errori(), nulle: Object.keys(S).every((n) => window.__teatro.interni.immagineScena(n) === null) }; });
    await p.screenshot({ path: foto('senza-risorse') });
    ok('senza risorse: il caricatore risponde null e nessuna immagine viene disegnata', senza.nulle && senza.disegni.length === 0, senza);
    ok('senza risorse: le scene si disegnano coi ripieghi, nessun errore', erroriSenza.length === 0 && senza.guasti === 0, erroriSenza.slice(0, 6));
    await p.close();
  }

  // ------------------------------------------------------------------ 5. release in una cartella a parte
  if (cartellaRelease) {
    fs.mkdirSync(cartellaRelease, { recursive: true });
    const uscita = path.join(path.resolve(cartellaRelease), 'teatro.html');
    const r = spawnSync('node', [path.join(__dirname, 'teatro-release.js'), '--uscita', uscita], { encoding: 'utf8' });
    ok('release: si genera nella cartella indicata', r.status === 0 && fs.existsSync(uscita), (r.stdout || '') + (r.stderr || ''));
    if (fs.existsSync(uscita)) {
      const html = fs.readFileSync(uscita, 'utf8');
      const dentro = [...html.matchAll(/"assets\/sprite_teatro\/scena\/([^"]+)\.png":/g)].map((m) => m[1]).sort();
      ok('release: incorpora esattamente le immagini usate', JSON.stringify(dentro) === JSON.stringify(usate), { inPiu: dentro.filter((n) => !usate.includes(n)), mancanti: usate.filter((n) => !dentro.includes(n)) });
      const erroriR = [];
      p = await apri(browser, uscita, erroriR);
      const richieste = [];
      p.on('request', (q) => { if (/\.png(\?|$)/.test(q.url()) && !q.url().startsWith('data:')) richieste.push(q.url()); });
      await p.waitForFunction((nomi) => { const S = window.__teatro.interni.immaginiB9.stato(); return nomi.every((n) => S[n].pronta); }, usate, { timeout: LIMITI.attesaCaricoMs }).catch(() => {});
      await p.evaluate(() => window.__teatro.interni.immaginiB9.azzeraConti());
      await giraScene(p, 'release', null, false, SCENE);
      const sr = await p.evaluate(() => window.__teatro.interni.immaginiB9.stato());
      await p.evaluate(() => { __qaB9.ostacoli(4); });
      await p.waitForTimeout(1300);
      await p.screenshot({ path: foto('release') });
      ok('release: parte, carica le immagini dai data: URI e le disegna', usate.every((n) => sr[n].pronta && sr[n].disegni > 0) && erroriR.length === 0,
        { nonPronte: usate.filter((n) => !sr[n].pronta), nonDisegnate: usate.filter((n) => !sr[n].disegni), errori: erroriR.slice(0, 5) });
      ok('release: nessun PNG chiesto fuori dal file', richieste.length === 0, richieste.slice(0, 5));
      await p.close();
    }
  }

  await browser.close();
  let falliti = 0;
  for (const e of esiti) {
    if (!e.ok) falliti++;
    console.log(`${e.ok ? 'OK  ' : 'FALLITO'} ${e.nome}${e.ok ? '' : ' → ' + JSON.stringify(e.info)}`);
  }
  console.log(`\nimmagini usate: ${usate.length} · scartate: ${scartate.length}`);
  console.log(`${esiti.length - falliti}/${esiti.length} controlli superati`);
  process.exit(falliti ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
