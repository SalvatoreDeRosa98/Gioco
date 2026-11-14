#!/usr/bin/env node
/*
 * tools/qa-avventura-motore.js — prova Playwright del MOTORE dell'avventura (gioco/avventura.html).
 * Costruisce una pagina di prova (gioco/.prova-avventura-motore.html, poi cancellata) col motore, i file di storia che
 * esistono e la storia-campione tools/avventura-campione/storia-campione.js, parte dal quadro «prova.piazza» e la
 * attraversa coi clic veri: guarda, usa, prendi, combina, usa-con, dialogo a temi, scelta a due voci, cambio quadro,
 * salvataggio e ricarica, tastiera, tocco emulato, finale. Nessun errore di console ammesso.
 * Uso: node tools/qa-avventura-motore.js [cartella foto]   (foto in production/qa/evidence/avventura-motore-*.png)
 * Chromium preinstallato nella sessione: non lanciare `playwright install`. Esce con 1 se un controllo fallisce.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const GIOCO = path.join(RADICE, 'gioco');
const CARTELLA_FOTO = process.argv[2] ? path.resolve(process.argv[2]) : path.join(RADICE, 'production', 'qa', 'evidence');
const foto = (n) => path.join(CARTELLA_FOTO, `avventura-motore-${n}.png`);

function costruisciPagina() {
  const html = fs.readFileSync(path.join(GIOCO, 'avventura.html'), 'utf8');
  const fuori = html.replace(/<script src="(avventura\/storia\/[^"]+)"><\/script>\n?/g, (m, src) => (fs.existsSync(path.join(GIOCO, src)) ? m : ''))
    .replace('<!-- avvio -->', '<script src="../tools/avventura-campione/storia-campione.js"></script>\n<!-- avvio -->');
  const file = path.join(GIOCO, '.prova-avventura-motore.html');
  fs.writeFileSync(file, fuori);
  return file;
}

(async () => {
  fs.mkdirSync(CARTELLA_FOTO, { recursive: true });
  const file = costruisciPagina();
  const url = 'file://' + file;
  const browser = await chromium.launch();
  const esiti = []; const errori = []; const richieste = [];
  const controlla = (nome, ok, info) => { esiti.push({ nome, ok: !!ok, info }); console.log(`${ok ? 'ok ' : 'NO '} ${nome}${info !== undefined ? ' · ' + JSON.stringify(info) : ''}`); };
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
    p.on('pageerror', (e) => errori.push(String(e)));
    p.on('requestfailed', (r) => richieste.push(r.url()));
    const G = (expr) => p.evaluate(new Function('return (' + expr + ')'));
    const pagina = (x, y) => p.evaluate(([x, y]) => { const r = document.getElementById('scena').getBoundingClientRect(); return { x: r.left + (x * r.width) / 640, y: r.top + (y * r.height) / 360 }; }, [x, y]);
    const zona = (chiave) => p.evaluate((k) => { const z = window.__avventura.G.zone.find((z) => z.chiave === k); return z ? { x: z.x + z.w / 2, y: z.y + z.h / 2 } : null; }, chiave);
    const clicZona = async (chiave, tasto = 'left') => {
      let z = null; for (let i = 0; i < 40 && !z; i++) { z = await zona(chiave); if (!z) await p.waitForTimeout(50); }
      if (!z) throw new Error('zona assente: ' + chiave);
      const q = await pagina(z.x, z.y); await p.mouse.move(q.x, q.y); await p.waitForTimeout(40); await p.mouse.click(q.x, q.y, { button: tasto });
      await p.waitForTimeout(80);
    };
    const libero = () => G('(()=>{const g=window.__avventura.G;return !g.titolo&&!g.overlay&&!g.testo&&!g.bivio&&!g.temi&&!g.attesa&&!g.cartello&&!g.finale&&!g.corse.length&&!g.fer.meta})()');
    /** Fa avanzare testi, cartelli e attese finché la scena è libera (o compaiono temi/bivio). Rende i testi visti. */
    const avanza = async (fermaSu) => {
      const visti = [];
      for (let i = 0; i < 200; i++) {
        const s = await G('(()=>{const g=window.__avventura.G;return {testo:g.testo&&g.testo.testo,cart:!!g.cartello,att:!!g.attesa,temi:!!g.temi,bivio:!!g.bivio,fin:!!g.finale,cam:!!g.fer.meta}})()');
        if (s.temi && fermaSu !== 'mai') return visti; if (s.bivio) return visti; if (s.fin && fermaSu === 'finale') return visti;
        if (s.testo) { if (visti[visti.length - 1] !== s.testo) visti.push(s.testo); await clicZona('testo'); await p.waitForTimeout(60); await clicZona('testo').catch(() => {}); }
        else if (s.cart) { await p.waitForTimeout(600); const q = await pagina(320, 180); await p.mouse.click(q.x, q.y); }
        else if (s.att || s.cam) await p.waitForTimeout(120);
        else if (await libero()) return visti;
        else await p.waitForTimeout(80);
      }
      return visti;
    };

    await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.goto(url + '?quadro=prova.piazza');
    await p.waitForFunction(() => window.__avventura && window.__avventura.G.quadro);
    let visti = await avanza();
    controlla('si parte nel quadro della prova col cartello e la prima didascalia', (await G('window.__avventura.G.quadro.id')) === 'prova.piazza' && visti.some((t) => t.includes('selciato')), visti);

    // guarda (clic destro)
    await clicZona('punto:tonino', 'right'); visti = await avanza();
    controlla('clic destro = guarda', visti.some((t) => t.includes('banco vuoto')), visti);
    // punto chiuso
    await clicZona('punto:verso-tavola'); visti = await avanza();
    controlla('uscita chiusa: fa le azioni di «chiuso»', visti.some((t) => t.includes('prima la porta')), visti);
    // punti accesi (H) e foto
    await p.keyboard.press('h'); await p.waitForTimeout(200);
    const q0 = await pagina(220, 210); await p.mouse.move(q0.x, q0.y); await p.waitForTimeout(250);
    await p.screenshot({ path: foto('punti') }); await p.keyboard.press('h');
    // prendi
    await clicZona('punto:chiave'); visti = await avanza();
    controlla('clic = usa: Ferruccio cammina e prende la chiave', (await G('window.__avventura.G.stato.inventario')).includes('prova-chiave'), visti);
    // dialogo a temi
    await clicZona('punto:tonino'); visti = await avanza();
    controlla('il dialogo si apre coi temi', await G('!!window.__avventura.G.temi'), visti);
    await p.screenshot({ path: foto('dialogo') });
    await clicZona('tema:sedia'); visti = await avanza();
    controlla('tema «una volta»: dà la lettera e sparisce', (await G('window.__avventura.G.stato.inventario')).includes('prova-lettera') && !(await zona('tema:sedia')), visti);
    await clicZona('tema:lume'); visti = await avanza();
    controlla('la scelta a due voci compare come bivio', await G('window.__avventura.G.bivio && window.__avventura.G.bivio.voci.length === 2'));
    await clicZona('voce:0'); // troppo presto: il bivio non deve accettarlo
    controlla('il bivio non accetta una risposta nei primi istanti', await G('!!window.__avventura.G.bivio'));
    await p.waitForTimeout(700);
    const qv = await zona('voce:0'); const pq = await pagina(qv.x, qv.y); await p.mouse.move(pq.x, pq.y); await p.waitForTimeout(150);
    await p.screenshot({ path: foto('bivio') });
    await clicZona('voce:0'); visti = await avanza();
    controlla('la decisione scrive il flag', (await G('window.__avventura.G.stato.flag.prova_lume')) === 'acceso', visti);
    await clicZona('tema:-via'); await avanza();
    controlla('«Allontanati» chiude il dialogo', await libero());
    // combina e usa-con
    await clicZona('ogg:prova-chiave'); await clicZona('ogg:prova-lettera'); visti = await avanza();
    controlla('oggetto su oggetto = combina', await G('!!window.__avventura.G.stato.visti["prova-combinati"]'), visti);
    await clicZona('ogg:prova-chiave', 'right'); visti = await avanza();
    controlla('clic destro su un oggetto = guardalo', visti.some((t) => t.includes('nodo')), visti);
    await clicZona('ogg:prova-chiave'); await clicZona('punto:porta'); visti = await avanza();
    controlla('oggetto in mano + clic sul punto = con', await G('!!window.__avventura.G.stato.visti["prova-porta-aperta"]'), visti);
    // Diario
    await p.keyboard.press('d'); await p.waitForTimeout(250); await p.screenshot({ path: foto('diario') });
    controlla('D apre il Diario', (await G('window.__avventura.G.overlay')) === 'diario'); await p.keyboard.press('d');
    // salva e ricarica
    await p.goto(url); await p.waitForFunction(() => window.__avventura); // senza ?quadro: si arriva al menu
    await p.waitForTimeout(300);
    await clicZona('m:continua'); await avanza();
    const dopo = await G('(()=>{const s=window.__avventura.G.stato;return {q:s.quadro,inv:s.inventario,lume:s.flag.prova_lume,porta:!!s.visti["prova-porta-aperta"]}})()');
    controlla('salvataggio e ricarica: Continua riporta lo stato', dopo.q === 'prova.piazza' && dopo.lume === 'acceso' && dopo.porta && dopo.inv.includes('prova-lettera'), dopo);
    // cambio quadro
    await clicZona('punto:verso-tavola'); visti = await avanza();
    controlla('uscita: cambio quadro col cartello del capitolo', (await G('window.__avventura.G.quadro.id')) === 'prova.tavola', visti);
    await p.mouse.move(5, 5); await p.waitForTimeout(400); await p.screenshot({ path: foto('tavola') });
    // tastiera
    await p.keyboard.press('Tab'); const f1 = await G('window.__avventura.G.fuoco'); await p.keyboard.press('ArrowRight'); const f2 = await G('window.__avventura.G.fuoco');
    await p.keyboard.press('q'); visti = await avanza();
    controlla('tastiera: Tab e frecce passano fra i punti, Q guarda', f1 && f2 && f1 !== f2 && visti.some((t) => t.startsWith('Sagoma')), { f1, f2, visti });
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    controlla('Esc apre il menu', (await G('window.__avventura.G.overlay')) === 'menu'); await p.keyboard.press('Escape');
    // finale
    await clicZona('punto:fine'); visti = await avanza('finale');
    controlla('il finale recita le sue scene', visti.some((t) => t.includes('sipario')) && visti.some((t) => t.includes('acceso')), visti);
    await p.waitForTimeout(1500); await p.screenshot({ path: foto('finale') });
    for (let i = 0; i < 3; i++) { await p.waitForTimeout(700); const q = await pagina(320, 180); await p.mouse.click(q.x, q.y); }
    await p.waitForTimeout(300);
    const fin = await G('(()=>{const g=window.__avventura.G;return {menu:g.overlay,visti:g.finaliVisti,mem:localStorage.getItem("ferruccio.avventura.finali")}})()');
    controlla('dopo il finale si torna al menu e il finale resta fra quelli trovati', fin.menu === 'menu' && fin.visti.includes('prova.fine') && /prova\.fine/.test(fin.mem || ''), fin);
    await p.mouse.move(5, 5); await p.waitForTimeout(200); await p.screenshot({ path: foto('menu') });
    // capitoli
    await clicZona('m:capitoli'); await p.waitForTimeout(150);
    controlla('Capitoli elenca i capitoli raggiunti', !!(await zona('c:prova')) && !!(await zona('c:prova-due')));
    await clicZona('c:prova-due'); await avanza();
    controlla('Capitoli: si riparte dall\'ingresso del capitolo', (await G('window.__avventura.G.quadro.id')) === 'prova.tavola');
    await ctx.close();

    // tocco emulato
    const ct = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    const t = await ct.newPage();
    t.on('console', (m) => { if (m.type() === 'error') errori.push('[tocco] ' + m.text()); });
    t.on('pageerror', (e) => errori.push('[tocco] ' + String(e)));
    await t.goto(url); await t.evaluate(() => localStorage.clear()); await t.goto(url + '?quadro=prova.piazza');
    await t.waitForFunction(() => window.__avventura && window.__avventura.G.quadro);
    const tp = async (x, y) => { const r = await t.evaluate(([x, y]) => { const r = document.getElementById('scena').getBoundingClientRect(); return { x: r.left + (x * r.width) / 640, y: r.top + (y * r.height) / 360 }; }, [x, y]); return r; };
    const testoT = () => t.evaluate(() => window.__avventura.G.testo && window.__avventura.G.testo.testo);
    for (let i = 0; i < 12; i++) { const q = await tp(320, 180); await t.touchscreen.tap(q.x, q.y); await t.waitForTimeout(500); }
    const lungo = async (x, y) => { const q = await tp(x, y); await t.evaluate(([x, y]) => { const c = document.getElementById('scena'); const o = { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, button: 0, bubbles: true, isPrimary: true }; c.dispatchEvent(new PointerEvent('pointerdown', o)); setTimeout(() => c.dispatchEvent(new PointerEvent('pointerup', o)), 700); }, [q.x, q.y]); await t.waitForTimeout(900); };
    await lungo(220, 215);
    const tl = await testoT();
    controlla('tocco: pressione lunga = guarda', tl && tl.includes('banco vuoto'), tl);
    for (let i = 0; i < 3; i++) { const q = await tp(320, 180); await t.touchscreen.tap(q.x, q.y); await t.waitForTimeout(300); }
    const qc = await tp(412, 240); await t.touchscreen.tap(qc.x, qc.y); await t.waitForTimeout(2500);
    const inv = await t.evaluate(() => window.__avventura.G.stato.inventario);
    controlla('tocco: tap = usa (prende la chiave)', inv.includes('prova-chiave'), inv);
    await ct.close();
  } catch (e) {
    controlla('la prova arriva in fondo', false, String(e && e.stack || e));
  } finally {
    await browser.close();
    try { fs.unlinkSync(file); } catch (e) { /* già tolta */ }
  }
  controlla('nessun errore di console', errori.length === 0, errori.slice(0, 8));
  controlla('nessuna richiesta a vuoto (immagini che mancano)', richieste.length === 0, richieste.slice(0, 5));
  const male = esiti.filter((e) => !e.ok);
  console.log(`\n${esiti.length - male.length} di ${esiti.length} controlli passati`);
  process.exit(male.length ? 1 : 0);
})();
