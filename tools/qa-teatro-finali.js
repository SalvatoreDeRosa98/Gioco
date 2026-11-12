#!/usr/bin/env node
/*
 * tools/qa-teatro-finali.js — verifica Playwright della squadra b8 (gioco/teatro/b8-finali-diario.js):
 *   1. porta della bottega chiusa senza condizioni; indizi alle notti giuste (luce, Voce, Tonino, Diario);
 *   2. i tre ferri di Gaetano dentro le run (stanza segreta del piano 1, fontana del piano 2 dopo il boss,
 *      boss del piano 3 senza danni) = i tre sigilli; la Voce presenta ogni boss (anche con id nuovi);
 *   3. finale vero dopo la prima caduta di Donna Luciana, nelle sue varianti (flag diversi), ritorno
 *      all'hub, Notte senza fine sbloccata, cordone del sipario dalla seconda volta, finale rivisto dal Diario;
 *   4. il segreto: bussata col ritmo, porta aperta, Fucina del Ricordo, aggancio entraSopraLaRibalta
 *      (con e senza scontro registrato), finale Sopra la Ribalta, ricompensa «Il Volto Ritrovato» in a6;
 *   5. Diario di Ferruccio: tre notti simulate con eventi diversi → tre pagine diverse e corrette; tetto 60.
 *
 * Uso: node tools/qa-teatro-finali.js <file html> [prefisso screenshot]
 * Screenshot <prefisso>-NN-nome.png. Esce con 1 se un controllo fallisce.
 * Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const prefisso = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-finali');
fs.mkdirSync(path.dirname(prefisso + '-x'), { recursive: true });
const foto = (n) => `${prefisso}-${n}.png`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (caso, cond, dati) => esiti.push({ caso, ok: Boolean(cond), ...(dati !== undefined ? { dati } : {}) });
  const fase = () => p.evaluate(() => window.__teatro.fase);
  const B = (corpo, arg) => p.evaluate(corpo, arg);
  const stato = () => p.evaluate(() => window.__teatro.interni.finaliB8.stato());
  const chiudiDialoghi = async () => {
    for (let i = 0; i < 60; i++) {
      const d = await p.evaluate(() => window.__teatro.t4qa.dialogo);
      if (!d) return;
      await p.keyboard.press(d.scelta ? 'Digit1' : 'Space');
      await p.waitForTimeout(50);
    }
  };
  const chiudiPergamena = async () => {
    for (let i = 0; i < 10; i++) {
      const c = await p.evaluate(() => Boolean(window.__teatro.interni.registroA7 && window.__teatro.interni.registroA7.pergamena));
      if (!c) return;
      await p.keyboard.press('KeyZ');
      await p.waitForTimeout(80);
    }
  };
  const entraNelTeatro = async () => {
    await chiudiPergamena();
    await chiudiDialoghi();
    const ing = await p.evaluate(() => window.__teatro.t4qa.ingresso);
    await p.evaluate((g) => { const P = window.__teatro.interni.player; P.x = g.x - 40; P.y = g.y; }, ing);
    await p.keyboard.down('KeyD'); await p.waitForTimeout(900); await p.keyboard.up('KeyD');
    await p.keyboard.press('Space');
    await p.waitForTimeout(150);
  };
  const impostaNotte = (n) => p.evaluate((k) => { localStorage.setItem('ferruccio_notte', String(k)); window.__teatro.interni.statoRun.numeroNotte = k; }, n);
  /** Va al piano dato, entra nella stanza del boss e (se serve) lo abbatte col danno del gioco. */
  const bossDelPiano = async (piano, { uccidi = true, conDanni = false } = {}) => {
    await p.evaluate((pp) => {
      const I = window.__teatro.interni; const R = I.statoRun;
      I.avviaPiano(pp, false); R.siparioAttivo = null;
      const st = R.mappa.stanze.find((s) => s.tipo === 'boss');
      entraInStanza(st, null);
      R.graziaIngressoC = 0; I.player.invuln = 99999;
    }, piano);
    await p.waitForTimeout(250);
    await chiudiDialoghi();
    if (!uccidi) return;
    await p.evaluate((danni) => {
      const R = window.__teatro.interni.statoRun; const st = R.stanzaCorrente;
      if (danni) R.dannoSubitoNelBoss = true;
      for (const x of st.nemici.slice()) if (x.hp > 0) danneggiaNemico(x, 999999, 0, 0);
      R.proiettiliNemici = [];
    }, conDanni);
    await p.waitForTimeout(250);
  };
  /** Percorre il finale in corso fino alla fine (o a un massimo di passi): rende testi, scene e scelte viste. */
  const percorriFinale = async (scelte = [], fotoA = {}) => {
    const testi = []; const scene = []; let iScelta = 0;
    for (let passo = 0; passo < 400; passo++) {
      const s = await p.evaluate(() => window.__teatro.interni.finaliB8.scena);
      if (!s) break;
      if (!scene.includes(s.id)) { scene.push(s.id); await p.waitForTimeout(320); if (fotoA[s.id]) await p.screenshot({ path: foto(fotoA[s.id]) }); }
      if (s.testo && testi[testi.length - 1] !== s.testo) testi.push(s.testo);
      if (s.inScelta) {
        if (fotoA.scelta && iScelta === 0) { await p.waitForTimeout(120); await p.screenshot({ path: foto(fotoA.scelta) }); }
        const scelta = scelte[iScelta++];
        await p.evaluate((id) => { const F = window.__teatro.interni.finaliB8; F.scegli(Math.max(0, F.scena.opzioni.indexOf(id))); }, scelta);
        await p.waitForTimeout(60);
        continue;
      }
      if (s.fondale === 'nero') await p.waitForTimeout(1350);
      await p.evaluate(() => window.__teatro.interni.finaliB8.avanza());
      await p.waitForTimeout(25);
    }
    return { testi, scene, tutto: testi.join(' | ') };
  };

  await p.goto('file://' + file);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ferruccio.teatro.sbloccaTutto', '1'); });
  await p.reload();
  await p.waitForTimeout(500);
  await p.keyboard.press('Space'); // menu → hub
  await p.waitForTimeout(350);
  await chiudiDialoghi();
  ok('hub', (await fase()) === 'hub', await fase());

  // ------------------------------------------------------------------ 1. porta chiusa, indizi per notte
  const i1 = await B(() => window.__teatro.interni.finaliB8.indiziHub());
  ok('notte1-nessun-indizio', i1.notte === 1 && !i1.luce && !i1.vocePorta && i1.tonino === null && i1.seme === null && !i1.portaAperta, i1);
  ok('sigilli-zero', (await B(() => window.__teatro.interni.sigilli)) === 0);
  const bus0 = await B(() => window.__teatro.interni.finaliB8.bussaRitmo());
  ok('porta-chiusa-senza-condizioni', bus0 === 'risposta' && !(await stato()).portaAperta && (await B(() => window.__teatro.t4qa.flag.fucina_aperta)) == null, bus0);
  await B(() => window.__teatro.interni.finaliB8.impostaSigilli(3));
  const bus3 = await B(() => window.__teatro.interni.finaliB8.bussaRitmo());
  const i3s = await B(() => window.__teatro.interni.finaliB8.indiziHub());
  ok('tre-sigilli-senza-finale-non-apre', bus3 === 'risposta' && !(await stato()).portaAperta && i3s.filoOro === true, { bus3, filo: i3s.filoOro });
  await B(() => window.__teatro.interni.finaliB8.impostaSigilli(0));

  await impostaNotte(2);
  const i2 = await B(() => window.__teatro.interni.finaliB8.indiziHub());
  ok('notte2-luce-e-voce', i2.luce && i2.vocePorta && i2.tonino === null && i2.seme === 'porta', i2);
  // la Voce mente sulla porta appena ci si avvicina
  await B(() => { const P = window.__teatro.interni.player; P.x = 320; P.y = 98; });
  let vocePorta = null;
  for (let i = 0; i < 40 && !vocePorta; i++) {
    await p.waitForTimeout(100);
    vocePorta = await B(() => { const d = window.__teatro.interni.finaliB8.didascalia; const t = [d.attiva, ...d.coda].filter(Boolean).find((x) => x.evento === 'porta'); return t || null; });
  }
  ok('voce-mente-sulla-porta', vocePorta && vocePorta.tipo === 'voce' && /dipint/.test(vocePorta.testo), vocePorta);

  await impostaNotte(3);
  const i3 = await B(() => window.__teatro.interni.finaliB8.indiziHub());
  ok('notte3-tonino-bottega', i3.tonino === 'bottega', i3.tonino);
  // chiacchierata vera con Tonino: finito il suo cartiglio arriva l'indizio
  const ton = await B(() => window.__teatro.t4qa.presenze.find((x) => x.id === 'tonino'));
  await B((t) => { const P = window.__teatro.interni.player; P.x = t.x + 30; P.y = t.y + 14; }, ton);
  await p.waitForTimeout(120);
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(150);
  ok('tonino-parla', await B(() => Boolean(window.__teatro.t4qa.dialogo)));
  await chiudiDialoghi();
  await p.waitForTimeout(200);
  const c1 = await B(() => window.__teatro.interni.finaliB8.cartiglio);
  ok('indizio-tonino-bottega', c1 && c1.chi === 'tonino' && /puteca/.test(c1.testo) && c1.voci === 3, c1);
  await p.screenshot({ path: foto('01-indizio-tonino') });
  for (let i = 0; i < 4; i++) { await p.keyboard.press('Space'); await p.waitForTimeout(60); }
  ok('cartiglio-chiuso', (await B(() => window.__teatro.interni.finaliB8.cartiglio)) === null);
  ok('un-indizio-per-notte', (await B(() => window.__teatro.interni.finaliB8.indizioTonino())) === false);
  await impostaNotte(4);
  const i4 = await B(() => window.__teatro.interni.finaliB8.indiziHub());
  ok('notte4-tonino-mariella', i4.tonino === 'mariella' && (i4.seme === 'tenaglie' || i4.seme === 'porta'), i4);
  await B(() => window.__teatro.interni.finaliB8.indizioTonino());
  const c2 = await B(() => window.__teatro.interni.finaliB8.cartiglio);
  ok('indizio-mariella', c2 && /piccerella/.test(c2.testo), c2);
  for (let i = 0; i < 3; i++) { await p.keyboard.press('Space'); await p.waitForTimeout(60); }

  // ------------------------------------------------------------------ 2. i tre ferri (= sigilli) e la Voce in run
  await impostaNotte(4);
  await entraNelTeatro();
  ok('in-gioco', (await fase()) === 'in_gioco', await fase());
  // 2a. le tenaglie nella stanza segreta del piano 1
  const ten = await B(() => {
    const R = window.__teatro.interni.statoRun; R.siparioAttivo = null;
    const st = R.mappa.stanze.find((s) => s.tipo === 'segreta');
    if (!st) return null;
    entraInStanza(st, null);
    R.graziaIngressoC = 0; window.__teatro.interni.player.invuln = 99999;
    for (const x of st.nemici) x.hp = 0;
    const pk = (st.oggettiATerra || []).find((o) => o.id === 'b8-ferro-tenaglie');
    if (pk) { window.__teatro.interni.player.x = pk.x; window.__teatro.interni.player.y = pk.y; }
    return pk ? { x: pk.x, y: pk.y } : false;
  });
  await p.waitForTimeout(300);
  ok('tenaglie-nella-segreta', ten && (await B(() => window.__teatro.interni.sigilli)) === 1, { ten, s: await B(() => window.__teatro.interni.sigilli) });
  // 2b. la Voce presenta il boss del piano 1 entrando nella sua stanza
  await bossDelPiano(1, { uccidi: false });
  let voceBoss = null;
  for (let i = 0; i < 90 && !voceBoss; i++) {
    await p.waitForTimeout(100);
    voceBoss = await B(() => { const a = window.__teatro.interni.finaliB8.didascalia.attiva; return a && a.evento === 'boss' ? a : null; });
  }
  const righeGatto = await B(() => window.__teatro.interni.finaliB8.righeVoce('boss', { id: 're-gatto' }));
  ok('voce-presenta-il-boss', voceBoss && voceBoss.tipo === 'voce' && voceBoss.nome === 'La Voce' && righeGatto.includes(voceBoss.testo), voceBoss);
  await p.waitForTimeout(350);
  await p.screenshot({ path: foto('02-voce-boss') });
  const tabella = await B(() => {
    const F = window.__teatro.interni.finaliB8; const out = {};
    for (const b of POOL_BOSS.concat([BOSS_FINALE])) out[b.id] = F.righeVoce('boss', { id: b.id, boss: b.nome }).length;
    out.nuovo = F.voce('boss', { id: 'boss-di-un-altra-squadra', boss: 'Il Pazzariello' });
    F.registraVoceBoss('boss-registrato', ['Signori, una prova.']);
    out.registrato = F.righeVoce('boss', { id: 'boss-registrato' });
    return out;
  });
  ok('voce-ogni-boss-ha-varianti', ['re-gatto', 'capitano-guardia', 'regina-vespa', 'colosso-statua', 'maestro-fucina', 'donna-luciana'].every((id) => tabella[id] >= 2), tabella);
  ok('voce-boss-sconosciuto-generico', /Il Pazzariello/.test(tabella.nuovo || ''), tabella.nuovo);
  ok('voce-boss-registrabile', tabella.registrato.length === 1 && tabella.registrato[0] === 'Signori, una prova.');
  // 2c. fine atto: boss del piano 2 abbattuto, poi si torna alla fontana dell'ingresso
  const primaFontana = await B(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    I.avviaPiano(2, false); R.siparioAttivo = null;
    const ing = R.mappa.stanze.find((s) => s.tipo === 'ingresso');
    entraInStanza(ing, null);
    return (ing.oggettiATerra || []).some((o) => o.id === 'b8-ferro-punzone');
  });
  await p.waitForTimeout(200);
  await p.screenshot({ path: foto('03-fontana-muta') });
  await bossDelPiano(2, { conDanni: true });
  const fineAtto = await B(() => { const d = window.__teatro.interni.finaliB8.didascalia; return [d.attiva, ...d.coda].filter(Boolean).map((x) => x.evento); });
  ok('voce-fine-atto', fineAtto.includes('fineAtto'), fineAtto);
  const pun = await B(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    const ing = R.mappa.stanze.find((s) => s.tipo === 'ingresso');
    entraInStanza(ing, null);
    const pk = (ing.oggettiATerra || []).find((o) => o.id === 'b8-ferro-punzone');
    return pk ? { x: pk.x, y: pk.y } : null;
  });
  await p.waitForTimeout(250);
  await p.screenshot({ path: foto('04-fontana-che-scorre') });
  await B((k) => { if (k) { const P = window.__teatro.interni.player; P.x = k.x; P.y = k.y; } }, pun);
  await p.waitForTimeout(300);
  ok('punzone-alla-fontana-dopo-il-boss', primaFontana === false && pun && (await B(() => window.__teatro.interni.sigilli)) === 2, { primaFontana, pun });
  // 2d. l'ago: boss del piano 3 con danni → niente; senza danni → cade
  await bossDelPiano(3, { conDanni: true });
  const agoNo = await B(() => (window.__teatro.interni.statoRun.stanzaCorrente.oggettiATerra || []).some((o) => o.id === 'b8-ferro-ago'));
  await bossDelPiano(3, { conDanni: false });
  const ago = await B(() => {
    const pk = (window.__teatro.interni.statoRun.stanzaCorrente.oggettiATerra || []).find((o) => o.id === 'b8-ferro-ago');
    if (pk) { const P = window.__teatro.interni.player; P.x = pk.x; P.y = pk.y; }
    return Boolean(pk);
  });
  await p.waitForTimeout(300);
  const tre = await B(() => ({ n: window.__teatro.interni.sigilli, nota: window.__teatro.interni.finaliB8.notaRun }));
  ok('ago-solo-senza-danni', agoNo === false && ago === true && tre.n === 3, { agoNo, ago, n: tre.n });
  ok('nota-della-run-coi-ferri', tre.nota && ['tenaglie', 'punzone', 'ago'].every((f) => tre.nota.ferri.includes(f)), tre.nota && tre.nota.ferri);

  // ------------------------------------------------------------------ 3. finale vero (prima caduta di Donna Luciana)
  await B(() => window.__teatro.t4qa.impostaFlag({ tonino_ricordo: 'restituito' }));
  const nottePrima = await B(() => window.__teatro.interni.getNumeroNotte());
  await bossDelPiano(4);
  const dopoBoss = await B(() => ({ pend: window.__teatro.interni.finaliB8.finalePendente, perg: window.__teatro.interni.registroA7.pergamena, fase: window.__teatro.fase }));
  ok('luciana-caduta-finale-in-attesa', dopoBoss.pend === true && dopoBoss.perg && dopoBoss.perg.tipo === 'vittoria' && dopoBoss.fase === 'in_gioco', dopoBoss);
  await chiudiPergamena();
  for (let i = 0; i < 50 && (await fase()) !== 'finale'; i++) await p.waitForTimeout(100);
  const s0 = await B(() => window.__teatro.interni.finaliB8.scena);
  ok('finale-parte-da-solo', (await fase()) === 'finale' && s0 && s0.finale === 'vero' && s0.id === 'mani-ferme', s0);
  await p.waitForTimeout(700);
  await p.screenshot({ path: foto('05-finale-mani-ferme') });
  const v1 = await percorriFinale(['uccisa'], { scelta: '06-finale-scelta', 'caserta-libera': '07-finale-caserta-libera', folla: '08-finale-folla', 'nero-uccisa': '09-finale-nero', bis: '10-finale-bis', 'titoli-vero': '11-finale-titoli' });
  ok('variante-A-restituito-uccisa', /ridato una moglie morta/.test(v1.tutto) && /Nemmeno un dono/.test(v1.tutto) && /Mi hai ridato mia moglie nei ricordi/.test(v1.tutto)
    && /Il primo dono della libert/.test(v1.tutto) && /BIS! DA CAPO!/.test(v1.tutto) && !/Sempre una bella giornata/.test(v1.tutto), v1.scene);
  await p.waitForTimeout(300);
  await chiudiPergamena();
  const dopo1 = await B(() => {
    const I = window.__teatro.interni; const reg = I.registroRun();
    return { fase: window.__teatro.fase, notte: I.getNumeroNotte(), st: I.finaliB8.stato(), violante: window.__teatro.t4qa.flag.violante,
      a6: I.progressione.stato.sbloccati['b8-notte-senza-fine'] === true, ultimo: reg[reg.length - 1] && reg[reg.length - 1].esito,
      pagina: I.finaliB8.pagine().slice(-1)[0], dialogo: window.__teatro.t4qa.dialogo };
  });
  ok('ritorno-in-piazza-una-notte-dopo', dopo1.fase === 'hub' && dopo1.notte === nottePrima + 1, { fase: dopo1.fase, notte: dopo1.notte, nottePrima });
  ok('notte-senza-fine-sbloccata', dopo1.st.finaleVisto && dopo1.st.senzaFine && dopo1.st.scelta === 'uccisa' && dopo1.violante === 'uccisa' && dopo1.a6, { st: dopo1.st, a6: dopo1.a6 });
  ok('registro-vittoria-e-pagina', dopo1.ultimo === 'vittoria' && dopo1.pagina && dopo1.pagina.notte === nottePrima && /spezzato il Velo/.test(dopo1.pagina.righe.join(' ')) && /tenaglie/.test(dopo1.pagina.righe.join(' ')), { ultimo: dopo1.ultimo, pagina: dopo1.pagina });
  ok('copione-strappato', dopo1.dialogo && /copione/.test(dopo1.dialogo.testo), dopo1.dialogo);
  await chiudiDialoghi();
  // il sigillo rotto si annuncia al ritorno in piazza; la Voce adesso è «senza regia»
  const senzaRegia = await B(() => { const F = window.__teatro.interni.finaliB8; return { boss: F.righeVoce('boss', { id: 're-gatto' }), tipo: (F.voce('fineNotte'), F.didascalia.coda.slice(-1)[0]) }; });
  ok('voce-senza-regia-dopo-la-caduta', senzaRegia.boss.every((r) => r.startsWith('[')) && senzaRegia.tipo && senzaRegia.tipo.tipo === 'silenzio', senzaRegia);

  // altre varianti, messe in scena direttamente (contesto = flag diversi)
  const variante = async (contesto, scelta) => {
    await chiudiPergamena(); await chiudiDialoghi();
    await B((cx) => window.__teatro.interni.finaliB8.avviaFinale('vero', { contesto: cx }), contesto);
    const v = await percorriFinale([scelta]);
    await p.waitForTimeout(200);
    await chiudiPergamena(); await chiudiDialoghi();
    return v;
  };
  const v2 = await variante({ tonino: 'negato', patto: true, medaglione: false }, 'risparmiata');
  ok('variante-B-negato-patto-risparmiata', /porti addosso i miei doni/.test(v2.tutto) && /Hai scelto al posto suo/.test(v2.tutto) && /Lo sapevo/.test(v2.tutto)
    && /tornano a scaldarsi/.test(v2.tutto) && /Sempre una bella giornata! Pure quando piove!/.test(v2.tutto) && /Nessuno aveva pi. bisogno di essere salvato/.test(v2.tutto) && !/Assassino/.test(v2.tutto), v2.scene);
  const v3 = await variante({ tonino: null, patto: false, medaglione: true }, 'uccisa');
  ok('variante-C-medaglione-in-mano-uccisa', /ha ancora il Medaglione di Rosa/.test(v3.tutto) && /E tu saresti quello che ci ha salvati/.test(v3.tutto) && !/Mi hai ridato mia moglie/.test(v3.tutto), v3.scene);
  const v4 = await variante({ tonino: 'restituito', patto: false, medaglione: false }, 'risparmiata');
  ok('variante-D-restituito-risparmiata', /Uno per me e uno per/.test(v4.tutto) && !/Pure quando piove/.test(v4.tutto), v4.scene);
  const st4 = await stato();
  ok('finali-visti-entrambi', st4.finali.uccisa && st4.finali.risparmiata && st4.scelta === 'risparmiata', st4.finali);
  ok('quattro-varianti-diverse', new Set([v1.tutto, v2.tutto, v3.tutto, v4.tutto]).size === 4);

  // seconda caduta: niente finale automatico, botola = Notte senza fine, cordone = ultimo atto
  await entraNelTeatro();
  await bossDelPiano(4);
  await chiudiPergamena();
  await p.waitForTimeout(1800);
  const seconda = await B(() => { const R = window.__teatro.interni.statoRun; const st = R.stanzaCorrente; return { fase: R.fase, cordone: Boolean(st.cordoneB8), botola: st.uscitaAperta, banner: R.banner, atto: getRaccontoAtto(5, 2).atto }; });
  ok('seconda-caduta-botola-e-cordone', seconda.fase === 'in_gioco' && seconda.cordone && seconda.botola && /NOTTE SENZA FINE/.test(seconda.banner || '') && /NOTTE SENZA FINE/.test(seconda.atto), seconda);
  await B(() => { const C = window.__teatro.interni.CONFIG_B8.cordone; const P = window.__teatro.interni.player; P.x = C.x + 10; P.y = C.y + 16; });
  await p.waitForTimeout(250);
  await p.screenshot({ path: foto('12-cordone-e-botola') });
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(250);
  ok('cordone-rimette-in-scena-il-finale', (await fase()) === 'finale');
  await percorriFinale(['uccisa']);
  await p.waitForTimeout(200);
  await chiudiPergamena(); await chiudiDialoghi();
  ok('dopo-il-cordone-piazza', (await fase()) === 'hub' && (await stato()).scelta === 'uccisa');

  // ------------------------------------------------------------------ 4. il segreto: la porta, la Fucina, Sopra la Ribalta
  const i5 = await B(() => window.__teatro.interni.finaliB8.indiziHub());
  ok('tre-sigilli-e-finale-si-bussa', i5.sigilli === 3 && !i5.filoOro && i5.seme === 'bussa' && /bussare/.test(i5.esame.join(' ')), i5);
  await B(() => { const P = window.__teatro.interni.player; P.x = 320; P.y = 100; });
  await p.waitForTimeout(600);
  await p.screenshot({ path: foto('13-porta-tre-sigilli') });
  // bussata sbagliata (quattro colpi rapidi): la porta non risponde
  for (let i = 0; i < 4; i++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(140); }
  await p.waitForTimeout(1300);
  ok('bussata-sbagliata-resta-chiusa', !(await stato()).portaAperta);
  // tre colpi, una pausa, uno
  for (let i = 0; i < 3; i++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(150); }
  await p.waitForTimeout(950);
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(1500);
  const aperta = await B(() => ({ st: window.__teatro.interni.finaliB8.stato().portaAperta, flag: window.__teatro.t4qa.flag.fucina_aperta }));
  ok('porta-si-apre-col-ritmo', aperta.st === true && aperta.flag === 'vera', aperta);
  await p.screenshot({ path: foto('14-porta-aperta') });
  // dentro: la Fucina del Ricordo
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(300);
  const sf = await B(() => window.__teatro.interni.finaliB8.scena);
  ok('si-entra-nella-fucina', (await fase()) === 'finale' && sf && sf.finale === 'fucina', sf);
  await p.waitForTimeout(900);
  await p.screenshot({ path: foto('15-fucina') });
  const f1 = await percorriFinale(['resta'], { scelta: '16-fucina-scelta' });
  await p.waitForTimeout(200);
  const dopoF = await B(() => ({ fase: window.__teatro.fase, st: window.__teatro.interni.finaliB8.stato(), a6: window.__teatro.interni.progressione.stato.sbloccati['b8-volto-ritrovato'] === true }));
  ok('fucina-resta-torna-in-piazza', /Fatti guardare/.test(f1.tutto) && /Io non te l.ho mai chiesto/.test(f1.tutto) && /A domani, figlio/.test(f1.tutto) && dopoF.fase === 'hub' && dopoF.st.fucinaVista && !dopoF.st.segretoVisto, { fase: dopoF.fase, scene: f1.scene });
  ok('ricompensa-volto-registrata-in-a6', dopoF.st.volto === true && dopoF.a6 === true, { volto: dopoF.st.volto, a6: dopoF.a6 });
  // l'aggancio per lo scontro: se un'altra squadra lo registra, parte prima della scena
  const gancio = await B(() => {
    const I = window.__teatro.interni; let visto = null;
    I.scontroSopraLaRibalta = (g) => { visto = { fine: typeof g.fine, annulla: typeof g.annulla, sigilli: g.sigilli }; };
    const r = I.entraSopraLaRibalta();
    const faseDopo = window.__teatro.fase;
    I.scontroSopraLaRibalta = null;
    return { r, visto, faseDopo };
  });
  ok('gancio-scontro-prima-della-scena', gancio.r === 'scontro' && gancio.visto && gancio.visto.fine === 'function' && gancio.visto.sigilli === 3 && gancio.faseDopo === 'hub', gancio);
  // senza scontro: si sale e parte la scena narrata
  await B(() => { const P = window.__teatro.interni.player; P.x = 320; P.y = 96; });
  await p.waitForTimeout(150);
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(300);
  const f2 = await percorriFinale(['sali'], { graticcia: '17-sopra-la-ribalta', burattinaio: '18-grande-burattinaio', 'filo-maestro': '19-filo-maestro', 'cala-il-sipario': '20-cala-il-sipario', 'titoli-ribalta': '21-titoli-ribalta' });
  await p.waitForTimeout(300);
  await chiudiDialoghi();
  const dopoR = await B(() => ({ fase: window.__teatro.fase, st: window.__teatro.interni.finaliB8.stato(), a6: window.__teatro.interni.progressione.stato.sbloccati['b8-sipario-calato'] === true,
    ind: window.__teatro.interni.finaliB8.indiziHub(), pagine: window.__teatro.interni.finaliB8.pagine().filter((x) => x.esito === 'segreto').map((x) => x.id) }));
  ok('sopra-la-ribalta-finale-segreto', /Prima fate uscire i ragazzi/.test(f2.tutto) && /Guanti bianchi/.test(f2.tutto) && /DA CAPO!/.test(f2.tutto) && /filo maestro canta/.test(f2.tutto)
    && /Caserta libera, che lo odia/.test(f2.tutto) && /Sotto la maschera c.era ancora qualcuno/.test(f2.tutto) && f2.scene.includes('burattinaio') && f2.scene.includes('titoli-ribalta'), f2.scene);
  ok('dopo-il-segreto', dopoR.fase === 'hub' && dopoR.st.segretoVisto && dopoR.a6 && dopoR.ind.tonino === 'dopo' && dopoR.pagine.includes('segreto-fucina') && dopoR.pagine.includes('segreto-ribalta'), dopoR);
  // la ricompensa in gioco: una volta per notte l'ultima maschera non è la fine
  await entraNelTeatro();
  const volto = await B(() => {
    const R = window.__teatro.interni.statoRun; R.siparioAttivo = null;
    R.hpHalf = 0; const a = t4Gancio('morte', 'prova'); const dopoA = { a, hp: R.hpHalf, fase: R.fase };
    R.hpHalf = 0; const b = t4Gancio('morte', 'prova'); return { ...dopoA, b, faseB: R.fase };
  });
  ok('volto-ritrovato-salva-una-volta', volto.a === true && volto.hp === 1 && volto.fase === 'in_gioco' && volto.faseB === 'morte', volto);
  for (let i = 0; i < 70 && (await fase()) !== 'hub'; i++) await p.waitForTimeout(100);
  await chiudiPergamena(); await chiudiDialoghi();

  // ------------------------------------------------------------------ 5. Diario di Ferruccio
  const pagineVere = await B(() => window.__teatro.interni.finaliB8.pagine());
  ok('diario-pagina-dalla-morte-vera', pagineVere.length >= 3 && /Notte \d+/.test(pagineVere[pagineVere.length - 1].titolo) && pagineVere[pagineVere.length - 1].righe.length >= 4, pagineVere.map((x) => x.titolo));
  const tre3 = await B(() => {
    const F = window.__teatro.interni.finaliB8;
    F.impostaStato({ ferri: {}, segretoVisto: false, portaAperta: false, finaleVisto: false });
    const base = { personaggio: 'ferruccio', nomePersonaggio: 'Ferruccio', vittoria: false, consumabili: [], stanzeSpeciali: {}, sangueHalf: 0 };
    const a = F.scriviPagina({ ...base, id: 'qa-1', notte: 1, esito: 'morte', causa: 'un colpo di Guardia Borbonica', piano: 1, stanzePulite: 2, nemiciUccisi: 5, boss: [], oggetti: [] });
    const b = F.scriviPagina({ ...base, id: 'qa-2', notte: 2, esito: 'morte', causa: 'Vespa Cieca', piano: 2, stanzePulite: 7, nemiciUccisi: 19,
      boss: [{ id: 're-gatto', nome: 'Il Gatto dei Quattro Canti', piano: 1 }],
      oggetti: [{ id: 'chiodo', nome: 'Chiodo della Fucina', tier: 'base', scoperto: true }, { id: 'mantice', nome: 'Mantice del Fabbro', tier: 'base', scoperto: false }],
      consumabili: [{ fam: 'carta', nome: 'Asso di Coppe' }], stanzeSpeciali: { bisca: 1 } }, { patti: ["Sigillo dell'Ombra"] }, { sceltaTonino: 'restituito' });
    F.impostaStato({ ferri: { tenaglie: 3 } }); // il primo sigillo è rotto: il seme della pagina indica il punzone
    const c = F.scriviPagina({ ...base, id: 'qa-3', notte: 3, esito: 'morte', causa: 'Donna Luciana', piano: 4, stanzePulite: 21, nemiciUccisi: 60,
      boss: [{ id: 're-gatto', nome: 'Il Gatto dei Quattro Canti' }, { id: 'colosso-statua', nome: 'Il Custode di Marmo' }, { id: 'boss-nuovo', nome: 'Il Pazzariello' }],
      oggetti: [{ id: 'spada', nome: 'Spada di Gaetano', tier: 'forte', scoperto: false }] }, { trasformazioni: ['Re di Denari'], ferri: ['tenaglie'], medaglione: true });
    return [a, b, c].map((x) => ({ titolo: x.titolo, testo: x.righe.join(' § '), n: x.righe.length }));
  });
  ok('diario-notte-1', tre3[0].titolo === 'Notte 1 — Corso Trieste' && /Mi sono svegliato in Piazza Dante/.test(tre3[0].testo) && /guardia/i.test(tre3[0].testo) && /5 ombre/.test(tre3[0].testo) && /Non ho raccolto niente/.test(tre3[0].testo), tre3[0]);
  ok('diario-notte-2', tre3[1].titolo === 'Notte 2 — Villa Comunale' && /Gatto dei Quattro Canti/.test(tre3[1].testo) && /Chiodo della Fucina e Mantice del Fabbro/.test(tre3[1].testo) && /Sigillo dell'Ombra/.test(tre3[1].testo)
    && /ricordo di Rosa/.test(tre3[1].testo) && /vesp/i.test(tre3[1].testo) && /Bisca/.test(tre3[1].testo) && /(battere|sigilli|dipinta)/.test(tre3[1].testo), tre3[1]);
  ok('diario-notte-3', tre3[2].titolo === 'Notte 3 — La Reggia' && /Donna Luciana/.test(tre3[2].testo) && /Ho battuto il Pazzariello|Il Pazzariello è caduto/.test(tre3[2].testo) && /Re di Denari/.test(tre3[2].testo) && /tenaglie di mio padre/.test(tre3[2].testo)
    && /medaglione/.test(tre3[2].testo) && /(punzone|G\. F\.|acqua)/i.test(tre3[2].testo), tre3[2]);
  ok('diario-tre-pagine-diverse', new Set(tre3.map((x) => x.testo)).size === 3 && tre3.every((x) => x.n >= 5));
  // si sfoglia: [N] dall'hub, frecce, [F] finali, Esc
  await p.keyboard.press('KeyN');
  await p.waitForTimeout(250);
  const dAperto = await B(() => { const R = window.__teatro.interni.statoRun; return { pausa: R.pausa, sez: R.diarioD && R.diarioD.paginaB8 }; });
  ok('diario-si-apre-con-N-dall-hub', dAperto.pausa === true && dAperto.sez === 'notti', dAperto);
  await p.screenshot({ path: foto('22-diario-pagina') });
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(120);
  await p.screenshot({ path: foto('23-diario-pagina-prima') });
  const idx = await B(() => window.__teatro.interni.statoRun.diarioD.paginaIdx);
  await p.keyboard.press('KeyF'); await p.waitForTimeout(150);
  await B(() => window.__teatro.interni.finaliB8.impostaStato({ ferri: { tenaglie: 4, punzone: 4, ago: 4 }, segretoVisto: true, portaAperta: true, finaleVisto: true }));
  await p.waitForTimeout(350);
  await p.screenshot({ path: foto('24-diario-finali') });
  ok('diario-sfoglia-e-finali', idx >= 0 && (await B(() => window.__teatro.interni.statoRun.diarioD.paginaB8)) === 'finali', idx);
  // rivedere il finale dal Diario: nessun effetto sul gioco, Esc torna al Diario
  const notteRiv = await B(() => window.__teatro.interni.getNumeroNotte());
  await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  const riv = await B(() => window.__teatro.interni.finaliB8.scena);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const dopoRiv = await B(() => { const R = window.__teatro.interni.statoRun; return { fase: R.fase, pausa: R.pausa, sez: R.diarioD && R.diarioD.paginaB8, notte: window.__teatro.interni.getNumeroNotte() }; });
  ok('finale-rivisto-dal-diario', riv && riv.finale === 'vero' && riv.rivisto === true && dopoRiv.fase === 'hub' && dopoRiv.sez === 'finali' && dopoRiv.notte === notteRiv, { riv, dopoRiv });
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  const chiuso = await B(() => { const R = window.__teatro.interni.statoRun; return { pausa: R.pausa, d: R.diarioD }; });
  ok('diario-esc-chiude-e-riprende', chiuso.pausa === false && chiuso.d === null, chiuso);
  // dal menu di pausa: linguetta e [N]; dal Diario degli oggetti: [N]
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.screenshot({ path: foto('25-pausa-linguetta') });
  await p.keyboard.press('KeyO'); await p.waitForTimeout(150);
  await p.keyboard.press('KeyN'); await p.waitForTimeout(150);
  const daOggetti = await B(() => window.__teatro.interni.statoRun.diarioD && window.__teatro.interni.statoRun.diarioD.paginaB8);
  await p.keyboard.press('KeyN'); await p.waitForTimeout(120);
  const tornaOggetti = await B(() => window.__teatro.interni.statoRun.diarioD && window.__teatro.interni.statoRun.diarioD.paginaB8);
  await p.keyboard.press('Escape'); await p.waitForTimeout(120);
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok('diario-sezione-del-diario-degli-oggetti', daOggetti === 'notti' && !tornaOggetti && (await B(() => window.__teatro.interni.statoRun.pausa)) === false, { daOggetti, tornaOggetti });
  // tetto di 60 notti
  const tetto = await B(() => {
    const F = window.__teatro.interni.finaliB8;
    for (let i = 0; i < 70; i++) F.scriviPagina({ id: `qa-t-${i}`, notte: 10 + i, personaggio: 'ferruccio', nomePersonaggio: 'Ferruccio', esito: 'morte', causa: 'un gatto', piano: 1, boss: [], oggetti: [] });
    const pg = F.pagine();
    return { n: pg.length, ultima: pg[pg.length - 1].notte, prima: pg[0].notte, max: window.__teatro.interni.CONFIG_B8.maxPagine };
  });
  ok('diario-ultime-60-notti', tetto.n === 60 && tetto.n === tetto.max && tetto.ultima === 79, tetto);
  // il Diario e lo stato restano dopo il ricaricamento della pagina
  await p.reload();
  await p.waitForTimeout(500);
  await p.keyboard.press('Space');
  await p.waitForTimeout(350);
  const ricaricato = await B(() => ({ pagine: window.__teatro.interni.finaliB8.pagine().length, st: window.__teatro.interni.finaliB8.stato(), sig: window.__teatro.interni.sigilli }));
  ok('salvato-per-slot', ricaricato.pagine === 60 && ricaricato.st.volto === true && ricaricato.st.segretoVisto === true && ricaricato.sig === 3, { pagine: ricaricato.pagine, sig: ricaricato.sig });

  ok('nessun-errore-in-console', errori.length === 0, errori.slice(0, 6));
  const falliti = esiti.filter((e) => !e.ok);
  console.log(JSON.stringify({ file: path.relative(RADICE, file), controlli: esiti.length, falliti: falliti.length, esiti: falliti.length ? falliti : esiti.map((e) => e.caso) }, null, 1));
  await browser.close();
  process.exit(falliti.length ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
