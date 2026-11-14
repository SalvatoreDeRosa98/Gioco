#!/usr/bin/env node
/*
 * tools/qa-avventura-storia.js — prova dell'interfaccia dell'avventura CON LA STORIA VERA (Playwright).
 *
 * Non giudica il gioco e non lo «gioca»: preme a caso (con un seme fisso) sui punti, sulle voci, sugli oggetti e sui
 * testi, attraverso il mouse vero, e controlla che l'interfaccia non si rompa mai:
 *   - nessun errore di pagina o di console, nessun errore dei dati (AV.errori);
 *   - mai uno schermo senza niente da premere (tolte le attese a tempo, che devono finire da sole);
 *   - ogni quadro d'ingresso di capitolo si apre da solo con `?quadro=` e mostra i suoi punti;
 *   - il salvataggio si rilegge: dopo la passeggiata «Continua» riporta allo stesso quadro.
 * I percorsi (vicoli ciechi, finali raggiungibili) li prova tools/avventura-esplora.js sul motore, senza browser.
 *
 * Uso: node tools/qa-avventura-storia.js [file.html] [--passi N] [--semi a,b,c] [--foto cartella]
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const arg = (nome, def) => { const i = process.argv.indexOf(nome); return i >= 0 ? process.argv[i + 1] : def; };
const FILE = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(RADICE, 'gioco', 'avventura.html'));
const PASSI = Number(arg('--passi', 500));
const SEMI = String(arg('--semi', '7,19,101')).split(',').map(Number);
const FOTO = arg('--foto', path.join(RADICE, 'production', 'qa', 'evidence'));
const INGRESSI = ['prologo.festa', 'piazza.centro', 'corso.inizio', 'villa.cancello', 'leucio.arrivo', 'strada.bivio', 'reggia.cancello', 'epilogo.libera', 'epilogo.velata'];

const esiti = [];
function controllo(ok, nome, dati) { esiti.push(ok); console.log(`${ok ? 'ok ' : 'NO '} ${nome}${dati !== undefined ? ' · ' + JSON.stringify(dati) : ''}`); }
function caso(seme) { let s = seme >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/** Lo stato dell'interfaccia che serve alla prova. */
const leggi = (p) => p.evaluate(() => {
  const g = window.__avventura.G; const c = document.getElementById('scena').getBoundingClientRect();
  return {
    r: { x: c.left, y: c.top, w: c.width, h: c.height },
    quadro: g.quadro && !g.titolo ? g.quadro.id : null, titolo: !!g.titolo, overlay: g.overlay || null,
    testo: !!g.testo, bivio: !!g.bivio, temi: !!g.temi, attesa: !!g.attesa, cartello: !!g.cartello, finale: g.finale ? g.finale.F.id : null,
    cammina: !!(g.fer && g.fer.meta), corse: g.corse ? g.corse.length : 0,
    zone: (g.zone || []).map((z) => ({ k: z.chiave || '', x: z.x, y: z.y, w: z.w, h: z.h, sfondo: !!z.sfondo })),
    errori: (window.AV && AV.errori ? AV.errori.length : 0),
  };
});
async function premi(p, s, z, destro) {
  const x = s.r.x + ((z.x + z.w / 2) / 640) * s.r.w; const y = s.r.y + ((z.y + z.h / 2) / 360) * s.r.h;
  await p.mouse.click(x, y, { button: destro ? 'right' : 'left' });
}

(async () => {
  const b = await chromium.launch();
  const errori = [];
  const nuovaPagina = async () => {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    p.on('pageerror', (e) => errori.push('pagina: ' + String(e).slice(0, 240)));
    p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text().slice(0, 240)); });
    return p;
  };
  const url = 'file://' + FILE;
  const pronta = (p) => p.waitForFunction(() => window.__avventura && window.__avventura.G && window.__avventura.G.zone, null, { timeout: 20000 });

  // 1) ogni ingresso di capitolo si apre da solo
  {
    const p = await nuovaPagina();
    await p.goto(url); await p.evaluate(() => localStorage.clear());
    const vuoti = []; let aperti = 0;
    for (const q of INGRESSI) {
      const c = await p.evaluate((id) => window.AV && AV.dati.quadro.has(id), q).catch(() => false);
      if (!c) continue; // un ingresso che la storia non ha (ancora) non è un errore di questa prova
      await p.goto(url + '?quadro=' + q); await pronta(p); await p.waitForTimeout(350);
      let s = await leggi(p);
      for (let k = 0; k < 80 && (s.testo || s.cartello || s.attesa || s.corse) && !s.bivio && !s.temi; k++) {
        await p.mouse.click(s.r.x + s.r.w / 2, s.r.y + s.r.h * 0.35); await p.waitForTimeout(90); s = await leggi(p);
      }
      const punti = s.zone.filter((z) => z.k.startsWith('punto:')).length;
      if (s.quadro && (punti || s.bivio || s.temi)) aperti++; else vuoti.push(q + ':' + JSON.stringify({ quadro: s.quadro, punti }));
    }
    controllo(vuoti.length === 0 && aperti > 0, 'gli ingressi dei capitoli si aprono e mostrano i loro punti', { aperti, vuoti });
    await p.close();
  }

  // 2) passeggiata a caso con la storia vera, un seme alla volta
  for (const seme of SEMI) {
    const p = await nuovaPagina();
    await p.goto(url); await p.evaluate(() => localStorage.clear());
    await p.goto(url); await pronta(p); await p.waitForTimeout(400);
    const rnd = caso(seme);
    let s = await leggi(p);
    const nuova = s.zone.find((z) => z.k === 'm:nuova');
    if (nuova) { await premi(p, s, nuova); await p.waitForTimeout(300); }
    const quadri = new Set(); const usate = new Set(); let fermo = 0; let bloccato = null; let finali = 0; let fatti = 0;
    for (let i = 0; i < PASSI; i++) {
      s = await leggi(p);
      if (s.quadro) quadri.add(s.quadro);
      if (s.finale) { finali++; }
      if (s.cammina || (s.attesa && !s.zone.length)) { await p.waitForTimeout(120); if (++fermo > 80) { bloccato = { passo: i, perche: 'cammina o attende senza fine', quadro: s.quadro }; break; } continue; }
      const premibili = s.zone.filter((z) => z.w > 0 && z.h > 0);
      if (!premibili.length) { await p.waitForTimeout(150); if (++fermo > 40) { bloccato = { passo: i, perche: 'niente da premere', quadro: s.quadro, overlay: s.overlay }; break; } continue; }
      fermo = 0;
      let z;
      const avanti = premibili.find((x) => x.sfondo);
      if ((s.testo || s.cartello || s.attesa) && avanti) z = avanti; // un testo: si va avanti
      else {
        // di rado il menu o il diario (si aprono e si richiudono), altrimenti un punto, un oggetto, una voce
        const gioco = premibili.filter((x) => !x.sfondo && !/^(barra:|m:nuova|m:slot|m:capitoli|c:)/.test(x.k));
        const lista = gioco.length ? gioco : premibili;
        z = lista[Math.floor(rnd() * lista.length)];
      }
      usate.add(z.k.replace(/:.*$/, ''));
      await premi(p, s, z, !s.testo && rnd() < 0.2);
      fatti++;
      await p.waitForTimeout(45);
    }
    s = await leggi(p);
    controllo(!bloccato, `seme ${seme}: l'interfaccia non resta mai senza uscita`, bloccato || { mosse: fatti, quadri: quadri.size, tipi: [...usate].sort().join(' '), finali });
    controllo(quadri.size >= 2, `seme ${seme}: la passeggiata cambia quadro`, [...quadri].slice(0, 12));
    if (seme === SEMI[0]) {
      await p.screenshot({ path: path.join(FOTO, 'avventura-storia-passeggiata.png') });
      // 3) il salvataggio si rilegge
      const prima = await p.evaluate(() => { const g = window.__avventura.G; return { q: g.stato.quadro, inv: g.stato.inventario.length }; });
      await p.goto(url); await pronta(p); await p.waitForTimeout(400);
      const m = await leggi(p); const cont = m.zone.find((z) => z.k === 'm:continua');
      if (cont) { await premi(p, m, cont); await p.waitForTimeout(400); }
      const dopo = await p.evaluate(() => { const g = window.__avventura.G; return { q: g.stato && g.stato.quadro, inv: g.stato ? g.stato.inventario.length : -1, titolo: !!g.titolo }; });
      controllo(Boolean(cont) && !dopo.titolo && dopo.q === prima.q, '«Continua» riprende dal quadro salvato', { prima, dopo });
    }
    await p.close();
  }

  const datiRotti = errori.filter((e) => e.includes('[avventura]'));
  controllo(errori.length === 0, 'nessun errore di pagina o di console', errori.slice(0, 6));
  controllo(datiRotti.length === 0, 'nessun errore dei dati della storia', datiRotti.slice(0, 4));
  await b.close();
  const passati = esiti.filter(Boolean).length;
  console.log(`\n${passati} di ${esiti.length} controlli passati`);
  process.exit(passati === esiti.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
