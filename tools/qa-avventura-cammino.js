#!/usr/bin/env node
/*
 * tools/qa-avventura-cammino.js — rifà nell'INTERFACCIA VERA (Playwright, clic del mouse) i cammini che l'esploratore
 * ha trovato sul motore, dall'inizio a un finale: è la prova che la storia si finisce davvero premendo sullo schermo.
 *
 * I cammini stanno in production/qa/avventura-cammini.json, scritto da tools/qa-avventura-percorsi.sh
 * (node tools/avventura-esplora.js --cammini --json …). Ogni mossa è una riga dell'esploratore:
 *   «quadro: usa «Punto»», «quadro: guarda «Punto»», «quadro: oggetto su «Punto»», «guarda l'oggetto x»,
 *   «combina a + b», «[dialogo] tema «Testo»», «[dialogo] allontanati», con le scelte in coda: « → «Voce»».
 *
 * Uso: node tools/qa-avventura-cammino.js [file.html] [--finali a,b,c] [--json file] [--foto cartella]
 *   senza --finali: il cammino più corto, uno che finisce con Donna Luciana uccisa e il finale segreto.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const arg = (nome, def) => { const i = process.argv.indexOf(nome); return i >= 0 ? process.argv[i + 1] : def; };
const FILE = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(RADICE, 'gioco', 'avventura.html'));
const JSON_CAMMINI = path.resolve(arg('--json', path.join(RADICE, 'production', 'qa', 'avventura-cammini.json')));
const FOTO = arg('--foto', path.join(RADICE, 'production', 'qa', 'evidence'));

const esiti = [];
function controllo(ok, nome, dati) { esiti.push(ok); console.log(`${ok ? 'ok ' : 'NO '} ${nome}${dati !== undefined ? ' · ' + JSON.stringify(dati) : ''}`); }

/** Una riga dell'esploratore → { tipo, quadro, punto, oggetto, a, b, dialogo, tema, scelte }. */
function leggiMossa(riga) {
  const scelte = []; let testa = riga;
  const i = riga.indexOf(' → «');
  if (i >= 0) { testa = riga.slice(0, i); for (const m of riga.slice(i).matchAll(/ → «([\s\S]*?)»(?= → «|$)/g)) scelte.push(m[1]); }
  let m;
  if (testa === 'inizio') return { tipo: 'inizio', scelte };
  if ((m = /^\[(.+?)\] allontanati$/.exec(testa))) return { tipo: 'via', dialogo: m[1], scelte };
  if ((m = /^\[(.+?)\] tema «([\s\S]*)»$/.exec(testa))) return { tipo: 'tema', dialogo: m[1], tema: m[2], scelte };
  if ((m = /^guarda l'oggetto (\S+)$/.exec(testa))) return { tipo: 'guarda-oggetto', oggetto: m[1], scelte };
  if ((m = /^combina (\S+) \+ (\S+)$/.exec(testa))) return { tipo: 'combina', a: m[1], b: m[2], scelte };
  if ((m = /^(\S+): (guarda|usa) «([\s\S]*)»$/.exec(testa))) return { tipo: m[2], quadro: m[1], punto: m[3], scelte };
  if ((m = /^(\S+): (\S+) su «([\s\S]*)»$/.exec(testa))) return { tipo: 'con', quadro: m[1], oggetto: m[2], punto: m[3], scelte };
  return { tipo: '?', riga, scelte };
}

const stato = (p) => p.evaluate(() => {
  const g = window.__avventura.G; const c = document.getElementById('scena').getBoundingClientRect();
  return {
    r: { x: c.left, y: c.top, w: c.width, h: c.height }, quadro: g.stato && g.stato.quadro, titolo: !!g.titolo,
    testo: !!g.testo, bivio: g.bivio ? g.bivio.voci.map((v) => ({ i: v.indice, t: v.testo })) : null,
    temi: g.temi ? g.temi.lista.map((t) => ({ id: t.id, t: t.testo })) : null, dialogo: g.dialogo || null,
    attesa: !!g.attesa, cartello: !!g.cartello, finale: g.finale ? g.finale.F.id : null, cammina: !!(g.fer && g.fer.meta), corse: g.corse ? g.corse.length : 0,
    inMano: g.inMano || '', inv: g.stato ? g.stato.inventario.slice() : [],
    punti: g.stato && g.quadro && !g.titolo ? AV.puntiDelQuadro(g.stato.quadro, g.stato).map((x) => ({ id: x.id, nome: x.nome })) : [],
    zone: (g.zone || []).map((z) => ({ k: z.chiave || '', x: z.x, y: z.y, w: z.w, h: z.h, sfondo: !!z.sfondo })),
  };
});
/** Dove premere dentro la zona: un posto che non sia coperto da una zona disegnata dopo (le ultime stanno sopra). */
function postoLibero(s, z) {
  const i = s.zone.indexOf(z); const sopra = s.zone.slice(i + 1).filter((x) => !x.sfondo);
  const dentro = (a, x, y) => x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
  for (const fy of [0.5, 0.25, 0.75, 0.12, 0.88]) for (const fx of [0.5, 0.25, 0.75, 0.12, 0.88]) {
    const x = z.x + z.w * fx, y = z.y + z.h * fy;
    if (!sopra.some((a) => dentro(a, x, y))) return { x, y };
  }
  return null;
}
async function premi(p, s, k, destro) {
  let z = s.zone.find((x) => x.k === k);
  // un oggetto che sta in un'altra pagina della tasca: si gira pagina finché compare
  for (let giro = 0; !z && k.startsWith('ogg:') && giro < 8 && s.zone.some((x) => x.k === 'inv:altri'); giro++) {
    const a = s.zone.find((x) => x.k === 'inv:altri');
    await p.mouse.click(s.r.x + ((a.x + a.w / 2) / 640) * s.r.w, s.r.y + ((a.y + a.h / 2) / 360) * s.r.h); await p.waitForTimeout(80);
    s = await stato(p); z = s.zone.find((x) => x.k === k);
  }
  if (!z) return false;
  const q = postoLibero(s, z); if (!q) return false; // tutta coperta: per il giocatore quel punto non si può premere
  await p.mouse.click(s.r.x + (q.x / 640) * s.r.w, s.r.y + (q.y / 360) * s.r.h, { button: destro ? 'right' : 'left' });
  await p.waitForTimeout(40);
  return true;
}

/** Manda avanti testi, cartelli e attese; alle scelte risponde con la prossima voce scritta nella mossa. Si ferma a schermo libero, a un dialogo aperto o a un finale. */
async function scorri(p, scelte) {
  for (let giro = 0; giro < 900; giro++) {
    const s = await stato(p);
    if (s.finale) return { s };
    if (s.bivio) {
      const voluta = scelte.shift();
      const v = s.bivio.find((x) => x.t === voluta);
      if (!v) return { s, errore: `scelta «${voluta}» non fra le voci: ${s.bivio.map((x) => x.t).join(' | ')}` };
      // le voci non accettano il clic nel primo istante (contro i clic involontari): si riprova finché il bivio se ne va
      const firma = s.bivio.map((x) => x.t).join('|'); let via = false;
      for (let k = 0; k < 30 && !via; k++) {
        const ora = await stato(p);
        if (!ora.bivio || ora.bivio.map((x) => x.t).join('|') !== firma) { via = true; break; }
        await premi(p, ora, 'voce:' + v.i); await p.waitForTimeout(90);
      }
      if (!via) return { s, errore: `la voce «${voluta}» non risponde al clic` };
      continue;
    }
    if (s.cammina) { await p.waitForTimeout(60); continue; }
    if (s.temi && !s.testo && !s.cartello && !s.attesa) return { s }; // dialogo aperto: tocca al giocatore
    if (s.testo || s.cartello || s.attesa) { const z = s.zone.find((x) => x.sfondo); if (z) await premi(p, s, z.k); else await p.waitForTimeout(60); continue; }
    if (s.corse) { await p.waitForTimeout(40); continue; }
    return { s };
  }
  return { s: await stato(p), errore: 'i testi non finiscono mai' };
}

async function rifai(b, url, finale, mosse) {
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('pageerror', (e) => errori.push('pagina: ' + String(e).slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text().slice(0, 200)); });
  await p.goto(url); await p.evaluate(() => localStorage.clear());
  await p.goto(url); await p.waitForFunction(() => window.__avventura && window.__avventura.G && window.__avventura.G.zone.length, null, { timeout: 20000 });
  await p.waitForTimeout(300);
  let s = await stato(p);
  await premi(p, s, 'm:nuova'); await p.waitForTimeout(200);
  let fallito = null; let fatte = 0;
  for (let n = 0; n < mosse.length && !fallito; n++) {
    const M = leggiMossa(mosse[n]);
    const dove = `mossa ${n + 1}/${mosse.length} «${mosse[n].slice(0, 90)}»`;
    let r = await scorri(p, M.tipo === 'inizio' ? M.scelte : []);
    if (r.errore) { fallito = `${dove}: prima della mossa, ${r.errore}`; break; }
    s = r.s;
    if (s.finale) { fallito = `${dove}: il finale «${s.finale}» è arrivato prima`; break; }
    if (M.tipo === 'inizio') { fatte++; continue; }
    const diDialogo = M.tipo === 'tema' || M.tipo === 'via';
    if (s.temi && !diDialogo) { await premi(p, s, 'tema:-via'); r = await scorri(p, []); s = r.s; } // l'esploratore dà il dialogo per chiuso
    if (M.quadro && s.quadro !== M.quadro) { fallito = `${dove}: sono in «${s.quadro}»`; break; }
    const punto = M.punto !== undefined ? s.punti.find((x) => x.nome === M.punto) : null;
    if (M.punto !== undefined && !punto) { fallito = `${dove}: il punto non c'è (ci sono: ${s.punti.map((x) => x.nome).join(' | ')})`; break; }
    let ok = true;
    switch (M.tipo) {
      case 'guarda': ok = await premi(p, s, 'punto:' + punto.id, true); break;
      case 'usa': case 'con': {
        if (M.tipo === 'con') { ok = await premi(p, s, 'ogg:' + M.oggetto); if (!ok) { fallito = `${dove}: l'oggetto non è fra quelli in tasca a schermo (${s.inv.join(', ')})`; break; } s = await stato(p); }
        ok = await premi(p, s, 'punto:' + punto.id);
        const dopo = await stato(p); if (ok && dopo.cammina) await premi(p, dopo, 'punto:' + punto.id); // secondo clic: salta la camminata
        break;
      }
      case 'guarda-oggetto': ok = await premi(p, s, 'ogg:' + M.oggetto, true); break;
      case 'combina': ok = (await premi(p, s, 'ogg:' + M.a)) && (await premi(p, await stato(p), 'ogg:' + M.b)); break;
      case 'tema': { const t = (s.temi || []).find((x) => x.t === M.tema); ok = Boolean(t) && (await premi(p, s, 'tema:' + t.id)); if (!t) fallito = `${dove}: il tema non c'è (${(s.temi || []).map((x) => x.t).join(' | ') || 'nessun dialogo aperto'})`; break; }
      case 'via': ok = !s.temi || (await premi(p, s, 'tema:-via')); break;
      default: fallito = `${dove}: mossa che non so leggere`;
    }
    if (fallito) break;
    if (!ok) { fallito = `${dove}: la zona non è premibile`; break; }
    r = await scorri(p, M.scelte);
    if (r.errore) { fallito = `${dove}: ${r.errore}`; break; }
    if (M.scelte.length) { fallito = `${dove}: scelte non chieste dal gioco: ${M.scelte.join(' | ')}`; break; }
    fatte++;
  }
  s = await stato(p);
  if (s.finale) await p.screenshot({ path: path.join(FOTO, `avventura-cammino-${finale.replace(/[^a-z0-9-]+/g, '_')}.png`) });
  controllo(!fallito && s.finale === finale, `«${finale}»: ${mosse.length} mosse rifatte coi clic fino al finale`, fallito ? { fatte, fallito } : { finale: s.finale });
  controllo(errori.length === 0, `«${finale}»: nessun errore di pagina o di console`, errori.slice(0, 4));
  await p.close();
}

(async () => {
  if (!fs.existsSync(JSON_CAMMINI)) { console.error(`manca ${JSON_CAMMINI}: lancia prima tools/qa-avventura-percorsi.sh`); process.exit(2); }
  const C = JSON.parse(fs.readFileSync(JSON_CAMMINI, 'utf8')).cammini || {};
  const tutti = Object.keys(C);
  let scelti = String(arg('--finali', '')).split(',').filter(Boolean);
  if (!scelti.length) {
    const corto = tutti.slice().sort((a, b) => C[a].length - C[b].length)[0];
    const uccisa = tutti.filter((f) => /uccisa/.test(f)).sort((a, b) => C[a].length - C[b].length)[0];
    const segreto = tutti.find((f) => /segreto/.test(f));
    scelti = [...new Set([corto, uccisa, segreto].filter(Boolean))];
  }
  const b = await chromium.launch();
  for (const f of scelti) { if (!C[f]) { controllo(false, `«${f}»: cammino non trovato nel JSON`); continue; } await rifai(b, 'file://' + FILE, f, C[f]); }
  await b.close();
  const passati = esiti.filter(Boolean).length;
  console.log(`\n${passati} di ${esiti.length} controlli passati`);
  process.exit(passati === esiti.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
