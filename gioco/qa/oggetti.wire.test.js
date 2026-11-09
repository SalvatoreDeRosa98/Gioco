/**
 * gioco/qa/oggetti.wire.test.js — Test di pagina della storia P04/P09 (squadra oggetti): `?debug=1&piano=1&seme=1845&personaggio=ferruccio`
 * con il renderer pixel-art. Usa Q con la carica piena (HUD dell'attivo), raccoglie 6 doni → modale di sostituzione → sostituisce,
 * pulisce la stanza con la Crepa Dorata e la apre sparandoci, batte il boss e paga un Patto d'Ombra. Zero errori in console.
 * Screenshot (deviceScaleFactor 1) in production/qa/evidence/: attivo-q.png, slot-sostituzione.png, segreta-crepa.png, patto.png.
 * Esecuzione: `node gioco/qa/oggetti.wire.test.js` (Playwright preinstallato; mai `playwright install`).
 */

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { avviaServer, caso, riepilogo } = require('./patto.wire.test.js');

const RADICE_GIOCO = path.resolve(__dirname, '..');
const CARTELLA_EVIDENZE = path.resolve(RADICE_GIOCO, '..', 'production', 'qa', 'evidence');
const MAX_SLOT = JSON.parse(fs.readFileSync(path.join(RADICE_GIOCO, 'contenuti', 'parametri', 'doni.json'), 'utf8')).limiti.max_slot_doni.base;

async function main() {
  const server = await avviaServer();
  let browser;
  try {
    browser = await chromium.launch();
    await caso('oggetti: Q con carica (HUD), 6 doni → modale → sostituzione, Crepa Dorata aperta con un proiettile, Patto pagato dopo il boss; quattro screenshot', async () => {
      const contesto = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      const pagina = await contesto.newPage();
      const errori = [];
      pagina.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
      pagina.on('pageerror', (e) => errori.push(String(e)));
      await pagina.goto(`${server.base}/?debug=1&piano=1&seme=1845&personaggio=ferruccio`, { waitUntil: 'load' });
      await pagina.waitForFunction(() => window.__gioco && window.__gioco.parametri.caricato() && window.__gioco.piano && window.__gioco.attivi.id);
      await pagina.waitForFunction(() => window.__gioco.tick() > 5);
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);

      // 1. l'attivo iniziale di Ferruccio (forbici) è carico; Q lo usa; l'HUD mostra le tacche
      const attivo = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.ciclo.ferma();
        const prima = g.attivi.stato();
        const hudPrima = g.interfacciaOggetti().attivo;
        const usati = [];
        g.eventi.on('attivo.usato', (p) => usati.push(p));
        g.premi('attivo', 1);
        g.ciclo.disegna?.();
        return { prima, hudPrima, dopo: g.attivi.stato(), usati: usati.length };
      });
      assert.equal(attivo.prima.id, 'forbici');
      assert.equal(attivo.prima.carico, true);
      assert.equal(attivo.hudPrima.tacche, attivo.prima.maxCarica);
      assert.equal(attivo.hudPrima.piene, attivo.prima.maxCarica);
      assert.equal(attivo.usati, 1);
      assert.equal(attivo.dopo.carica, 0);
      await pagina.evaluate(() => window.__gioco.tick(2));
      await pagina.waitForFunction(() => window.__gioco.interfacciaOggetti().attivo && window.__gioco.interfacciaOggetti().attivo.piene === 0);
      fs.mkdirSync(CARTELLA_EVIDENZE, { recursive: true });
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'attivo-q.png') });

      // 2. sei doni: il sesto apre il modale; 1-5 sostituisce
      const slotEsito = await pagina.evaluate((max) => {
        const g = window.__gioco;
        const ids = g.modificatori.catalogo().filter((id) => !g.modificatori.dono(id).ricordo).slice(0, max + 1);
        const esiti = ids.map((id) => g.slotDoni.acquisisci(id, { origine: 'qa' }));
        g.tick(2);
        // `slot` resta lo slot del salvataggio (pagina.test.js), `slotDoni` i cinque slot dei doni
        return { ids, esiti, pendente: g.slotDoni.pendente, attivi: g.modificatori.doniAttivi(), hud: g.interfacciaOggetti().sostituzione, slotSalvataggio: g.slot, maxSlot: g.slotDoni.max };
      }, MAX_SLOT);
      assert.equal(typeof slotEsito.slotSalvataggio, 'string', '__gioco.slot è lo slot del salvataggio, non i cinque slot');
      assert.equal(slotEsito.maxSlot, MAX_SLOT);
      assert.deepEqual(slotEsito.esiti.slice(0, MAX_SLOT), Array(MAX_SLOT).fill('aggiunto'));
      assert.equal(slotEsito.esiti[MAX_SLOT], 'pendente');
      assert.equal(slotEsito.pendente.id, slotEsito.ids[MAX_SLOT]);
      assert.ok(slotEsito.hud, 'modale di sostituzione nel DOM');
      assert.equal(slotEsito.hud.voci.length, MAX_SLOT);
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'slot-sostituzione.png') });
      const dopoScambio = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.slotDoni.conferma(1);
        g.tick(2);
        return { attivi: g.modificatori.doniAttivi(), pendente: g.slotDoni.pendente, hud: g.interfacciaOggetti().sostituzione };
      });
      assert.equal(dopoScambio.pendente, null);
      assert.equal(dopoScambio.hud, null, 'il modale si chiude');
      assert.ok(dopoScambio.attivi.includes(slotEsito.ids[MAX_SLOT]));
      assert.ok(!dopoScambio.attivi.includes(slotEsito.ids[1]));
      assert.equal(dopoScambio.attivi.length, MAX_SLOT);

      // 3. la stanza con la finestra verso la segreta: pulita → crepa visibile → un proiettile la apre
      const crepa = await pagina.evaluate(() => {
        const g = window.__gioco;
        const seg = g.piano.stanze.find((s) => s.tipo === 'segreta');
        const vicina = g.piano.stanze.find((s) => s.tipo !== 'segreta' && s.finestre.length > 0);
        if (!seg || !vicina) return { manca: true };
        g.vaiA(vicina.id);
        for (let i = 0; i < 4000 && g.stanza.stato !== 'pulita'; i++) {
          for (const b of g.bersagli) if (b.stato !== 'morto') b.colpisci(1e6, null);
          g.tick(1);
        }
        const c = g.segreta.crepa();
        return { stato: g.stanza.stato, c, vicina: vicina.id, seg: seg.id };
      });
      assert.equal(crepa.manca, undefined, 'il piano 1 del seme 1845 ha la segreta e una stanza confinante con la finestra');
      assert.equal(crepa.stato, 'pulita');
      assert.ok(crepa.c && crepa.c.visibile && !crepa.c.aperta, 'crepa visibile');
      await pagina.evaluate(() => window.__gioco.tick(2));
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'segreta-crepa.png') });
      const apertura = await pagina.evaluate(() => {
        const g = window.__gioco;
        const c = g.segreta.crepa();
        const verso = { N: [0, 1, 'spara_su'], S: [0, -1, 'spara_giu'], E: [-1, 0, 'spara_destra'], W: [1, 0, 'spara_sinistra'] }[c.lato];
        g.ferruccio.posiziona(c.x + verso[0] * 150, c.y + verso[1] * 150);
        const eventi = [];
        g.eventi.on('segreta.aperta', (p) => eventi.push(p));
        g.tieni(verso[2]);
        for (let i = 0; i < 240 && eventi.length === 0; i++) g.tick(1);
        g.lascia(verso[2]);
        return { eventi, porte: g.stanza.porte.map((p) => p.slot), aperte: g.segreta.aperte, stanza: g.stanza.id, stato: g.stanza.stato, pos: { x: g.ferruccio.x, y: g.ferruccio.y }, crepa: g.segreta.crepa() };
      });
      assert.equal(apertura.eventi.length, 1, 'la crepa si apre con un proiettile');
      assert.ok(apertura.porte.includes(crepa.c.slot), 'la porta verso la segreta esiste');
      assert.equal(apertura.stato, 'pulita');
      assert.equal(apertura.crepa.aperta, true);
      const inSegreta = await pagina.evaluate((seg) => { const g = window.__gioco; const ok = g.vaiA(seg); g.tick(2); return { ok, tipo: g.stanza.tipo, monete: g.economia.aTerra(seg).filter((o) => o.tipo === 'moneta').length }; }, crepa.seg);
      assert.equal(inSegreta.ok, true);
      assert.equal(inSegreta.tipo, 'segreta');
      assert.ok(inSegreta.monete > 0, 'la segreta lascia le monete');

      // 4. il boss: battuto senza danni → altare del Patto → proposta → conferma (−1 maschera massima)
      const patto = await pagina.evaluate(() => {
        const g = window.__gioco;
        const boss = g.piano.stanze.find((s) => s.tipo === 'boss');
        g.vaiA(boss.id);
        const maxPrima = g.modificatori.valore('ferruccio.maschere_max');
        for (let i = 0; i < 4000 && g.stanza.stato !== 'pulita'; i++) {
          for (const b of g.bersagli) if (b.stato !== 'morto') b.colpisci(1e6, null);
          g.tick(1);
        }
        const altare = g.patto.altare;
        if (!altare) return { altare: null };
        const r = altare.reliquie[0];
        g.ferruccio.posiziona(r.x + 12, r.y);
        g.premi('interagisci', 2);
        g.tick(1);
        return { altare, pendente: g.patto.pendente?.id ?? null, pannello: g.interfacciaOggetti().patto, maxPrima, cupa: g.patto.inStanzaAltare() };
      });
      assert.ok(patto.altare, 'l\'altare compare dopo il boss (senza danni: 100 %)');
      assert.equal(patto.pendente, patto.altare.reliquie[0].id);
      assert.ok(patto.pannello && /Maschera massima per sempre/.test(patto.pannello.costo), 'il pannello dice il costo permanente');
      assert.equal(patto.cupa, true);
      await pagina.screenshot({ path: path.join(CARTELLA_EVIDENZE, 'patto.png') });
      const stretto = await pagina.evaluate(() => {
        const g = window.__gioco;
        g.premi('conferma', 2);
        g.tick(1);
        return { stretti: g.patto.stretti, max: g.modificatori.valore('ferruccio.maschere_max'), maschere: g.ferruccio.maschere, pannello: g.interfacciaOggetti().patto, hp: g.statistiche.correnti().maxHpHalf };
      });
      assert.deepEqual(stretto.stretti, [patto.altare.reliquie[0].id]);
      assert.equal(stretto.max, patto.maxPrima - 1, 'una maschera massima in meno');
      assert.ok(stretto.maschere <= stretto.max);
      assert.equal(stretto.pannello, null);
      assert.deepEqual(errori, [], `errori in console:\n${errori.join('\n')}`);
      await contesto.close();
    });
  } finally {
    if (browser) await browser.close();
    await server.chiudi();
  }
  riepilogo();
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
