#!/usr/bin/env node
/*
 * tools/qa-teatro-trasformazioni.js — verifica Playwright della squadra b4 (gioco/teatro/b4-trasformazioni.js):
 * temi di tutti gli oggetti, le otto trasformazioni (soglia, effetto di gioco, una volta per run, annuncio,
 * voce nel Diario), le sinergie a coppie (attivazione di tutte, ganci provati uno per uno), i tetti di
 * OGGETTI_D.clamp con tutto acceso, HUD e pagine del Diario, tempo di disegno.
 * Uso: node tools/qa-teatro-trasformazioni.js <file html> [cartella/ o prefisso degli screenshot]
 * Esce con 1 se un controllo fallisce. Chromium preinstallato: non lanciare `playwright install`.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(RADICE, process.argv[2] || 'gioco/teatro_marionette.html');
const pref = process.argv[3] || path.join(RADICE, 'production', 'qa', 'evidence', 'teatro-trasformazioni-');
const foto = (n) => (pref.endsWith('/') ? path.join(pref, `trasformazioni-${n}.png`) : `${pref}${n}.png`);
fs.mkdirSync(pref.endsWith('/') ? pref : path.dirname(pref), { recursive: true });

/** Tre oggetti per tema (dal catalogo normale) usati per accendere ogni trasformazione. */
const TERNE = {
  denari: ['mercurio', 'sole', 'dado'],
  ombra: ['anello', 'lanterna', 'salasso'],
  maschera: ['venti', 'nastro', 'pipa'],
  fili: ['triplo', 'doppia', 'stivali'],
  sacro: ['cuore', 'campana', 'cornetto'],
  fuoco: ['chiodo', 'fuoco', 'mantice'],
  bestia: ['gatto', 'ranocchio', 'pettine'],
  cibo: ['pagnotta', 'sfogliatella', 'tarallo'],
};

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const errori = [];
  p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  p.on('pageerror', (e) => errori.push(String(e)));
  const esiti = [];
  const ok = (nome, cond, info) => esiti.push({ nome, ok: Boolean(cond), info });

  const avvia = async () => {
    await p.evaluate(() => {
      const I = window.__teatro.interni;
      I.selezionaPersonaggio('ferruccio');
      I.statoRun.fase = 'in_gioco';
      I.nuovaRun(false);
      I.statoRun.siparioAttivo = null;
    });
    await p.waitForTimeout(150);
  };
  /** Stanza vuota, giocatore al centro, niente oggetti né trasformazioni. */
  const pulisci = () => p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun;
    S.siparioAttivo = null; S.pausa = false; S.diarioD = null; S.pannelloB = null;
    const st = S.stanzaCorrente;
    st.nemici = []; st.ostacoli = []; st.oggettiATerra = []; st.pulita = true; st.muroSegreto = null;
    S.proiettili = []; S.proiettiliNemici = []; S.graziaIngressoC = 0; S.scudoRosaC = false;
    I.player.invuln = 0; I.player.cooldown = 0; I.player.x = 320; I.player.y = 200; I.player.flipX = false;
    I.player.kbx = 0; I.player.kby = 0;
    I.azzeraTrasformazioniQA();
    S.baseMaxHpHalf = 6; I.ricalcolaStatistiche(); S.hpHalf = S.maxHpHalf;
    S.cartiglioD = null; S.bannerTimer = 0;
  });
  const dai = (ids) => p.evaluate((lista) => lista.map((id) => window.__teatro.interni.daiOggettoQA(id)), ids);
  const avanza = (n) => p.evaluate((quanti) => { for (let i = 0; i < quanti; i++) window.__teatro.interni.passoLogico(); }, n);
  const stato = () => p.evaluate(() => window.__teatro.interni.statoTrasformazioni());
  const primoPiano = async (nome) => {
    const b = await p.evaluate(() => {
      const c = document.querySelector('canvas').getBoundingClientRect(); const P = window.__teatro.interni.player;
      const k = c.width / 640; return { x: c.left + (P.x - 70) * k, y: c.top + (P.y - 78) * k, width: 140 * k, height: 104 * k };
    });
    await p.screenshot({ path: foto(nome), clip: b });
  };
  const bersaglio = (id, x, y, extra = {}) => ({ id, x, y, r: 10, hp: 9999, maxHp: 9999, tipo: 'gatto', patternMob: 'gatto', speed: 0, stunTicks: 99999, ...extra });

  await p.goto('file://' + file);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await avvia();
  ok('nessun errore al caricamento', errori.length === 0, errori.slice());

  // ---------------------------------------------------------------- 1. temi
  const temi = await p.evaluate(() => {
    const I = window.__teatro.interni; const T = window.__teatroInterno;
    const tutti = [...I.CATALOGO_OGGETTI, ...T.CATALOGO_PATTO, ...T.CATALOGO_SEGRETO];
    const validi = new Set(I.TEMI_B4.ordine);
    const senza = tutti.filter((o) => !I.temiDi(o).length).map((o) => o.id);
    const ignoti = tutti.filter((o) => I.temiDi(o).some((t) => !validi.has(t))).map((o) => o.id);
    const perTema = {};
    for (const t of I.TEMI_B4.ordine) perTema[t] = I.CATALOGO_OGGETTI.filter((o) => I.temiDi(o).includes(t)).length;
    const orfani = Object.keys(I.TEMI_OGGETTI_B4).filter((id) => !tutti.some((o) => o.id === id));
    return {
      totale: tutti.length, senza, ignoti, perTema, orfani,
      campoPrima: I.temiDi({ id: 'spada', temi: ['cibo'] }), tabella: I.temiDi({ id: 'spada' }), perId: I.temiDi('gatto'),
      nuovoB5: I.temiDi({ id: 'oggetto-nuovo-b5', temi: ['bestia', 'fuoco'] }), ignotoSenzaTemi: I.temiDi({ id: 'boh' }),
    };
  });
  ok('ogni oggetto dei tre cataloghi ha almeno un tema', temi.senza.length === 0 && temi.totale >= 77, temi);
  ok('solo temi della convenzione', temi.ignoti.length === 0 && temi.orfani.length === 0, { ignoti: temi.ignoti, orfani: temi.orfani });
  ok('temiDi legge prima item.temi, poi la tabella', temi.campoPrima.join() === 'cibo' && temi.tabella.join() === 'fuoco'
    && temi.perId.join() === 'bestia' && temi.nuovoB5.join() === 'bestia,fuoco' && temi.ignotoSenzaTemi.length === 0, temi);
  ok('ogni tema ha almeno 6 oggetti nel catalogo normale', Object.values(temi.perTema).every((n) => n >= 6), temi.perTema);

  // ---------------------------------------------------------------- 2. soglia, doppioni, una volta per run
  await pulisci();
  await dai(['mercurio', 'mercurio', 'mercurio', 'sole']);
  let s = await stato();
  ok('i doppioni non contano e a 2/3 non ci si trasforma', s.conteggi.denari === 2 && s.attive.length === 0, s.conteggi);
  await avanza(3);
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('00-hud-due-su-tre') });
  await dai(['dado']);
  s = await stato();
  ok('al terzo oggetto diverso: Re di Denari', s.attive.join() === 'denari' && s.inCoda === 1, s);
  await avanza(2);
  s = await stato();
  ok('annuncio grande in corso', s.annuncio && s.annuncio.tipo === 'trasformazione' && s.annuncio.titolo === 'Re di Denari', s.annuncio);
  const lampo = await p.evaluate(() => window.__teatro.interni.statoB4().lampo);
  ok('lampo acceso all\'annuncio', lampo > 0, lampo);
  await avanza(28);
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('01-annuncio-re-di-denari') });
  const persiste = await p.evaluate(() => {
    const I = window.__teatro.interni;
    I.statoRun.oggettiEquipaggiati = []; I.ricalcolaStatistiche();
    const x = I.statoTrasformazioni();
    return { attive: x.attive, conteggio: x.conteggi.denari, tipo: I.statoRun.tipoProiettile };
  });
  ok('la trasformazione resta per la run anche senza gli oggetti', persiste.attive.join() === 'denari' && persiste.conteggio === 0 && persiste.tipo === 'moneta', persiste);
  const dopoAnnuncio = await p.evaluate(() => {
    const I = window.__teatro.interni;
    for (let i = 0; i < 230; i++) I.passoLogico();
    return { annuncio: I.statoTrasformazioni().annuncio, banner: I.statoRun.banner };
  });
  ok('l\'annuncio finisce e lascia il promemoria nel banner', dopoAnnuncio.annuncio === null && /Re di Denari/.test(dopoAnnuncio.banner), dopoAnnuncio);

  // ---------------------------------------------------------------- 3. le otto trasformazioni, una per una
  // Re di Denari
  await pulisci();
  await dai(TERNE.denari);
  const denari = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    P.x = I.ARENA.x2 - 40; P.y = 190; S.proiettili = [];
    const base = { range: S.range };
    I.sparaProiettiliDirezione(1, 0);
    const pr = S.proiettili[0];
    const r0 = pr.rimbalzi;
    for (let i = 0; i < 30; i++) I.passoLogico();
    return { tipo: pr.tipo, piercing: pr.piercing, r0, rDopo: pr.rimbalzi, vx: pr.vx, vivo: S.proiettili.includes(pr), range: base.range, rimbalziStat: S.statD.rimbalzi };
  });
  ok('Re di Denari: monete perforanti che rimbalzano', denari.tipo === 'moneta' && denari.piercing && denari.r0 === 2 && denari.rDopo === 1 && denari.vx < 0 && denari.vivo, denari);
  await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    P.x = 300; P.y = 200; S.proiettili = [];
    for (const [dx, dy] of [[1, 0], [0, -1], [-1, 0]]) { P.cooldown = 0; I.eseguiAttacco4Direzioni(dx, dy); for (let i = 0; i < 9; i++) I.passoLogico(); }
    P.flipX = false;
  });
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('02-re-di-denari') });
  await primoPiano('02b-re-di-denari-primo-piano');

  // L'Ombra del Velo
  await pulisci();
  await dai(TERNE.ombra);
  const ombra = await p.evaluate((mk) => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    const vicino = { ...mk, id: 'vicino', x: P.x + 34, y: P.y }, lontano = { ...mk, id: 'lontano', x: P.x + 110, y: P.y };
    S.stanzaCorrente.nemici = [vicino, lontano]; S.stanzaCorrente.pulita = false;
    for (let i = 0; i < 60; i++) I.passoLogico();
    return { attive: I.statoTrasformazioni().attive, persoVicino: 9999 - vicino.hp, persoLontano: 9999 - lontano.hp, dmg: S.dmg, tagli: I.statoB4().tagli.length };
  }, bersaglio('x', 0, 0));
  const attesoOmbra = Math.max(1, ombra.dmg * 0.35) * 5;
  ok('L\'Ombra del Velo: i fili neri feriscono solo chi è vicino', ombra.attive.includes('ombra') && Math.abs(ombra.persoVicino - attesoOmbra) < attesoOmbra * 0.25 && ombra.persoLontano === 0, { ...ombra, attesoOmbra });
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('03-ombra-del-velo') });
  await primoPiano('03b-ombra-del-velo-primo-piano');

  // Pulcinella Traditore
  await pulisci();
  await dai(TERNE.maschera);
  const pulc = await p.evaluate((mk) => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    const n = { ...mk, id: 'davanti', x: P.x + 60, y: P.y };
    S.stanzaCorrente.nemici = [n]; S.stanzaCorrente.pulita = false;
    I.statoB4().critForzato = false;
    S.proiettili = []; P.cooldown = 0;
    I.eseguiAttacco4Direzioni(1, 0);
    const subito = S.proiettili.length;
    for (let i = 0; i < 7; i++) I.passoLogico();
    const conEco = S.proiettili.length;
    const dmgPrimo = S.proiettili[0].dmg, dmgEco = S.proiettili[S.proiettili.length - 1].dmg;
    // critico: danno doppio e fumetto
    S.proiettili = [];
    const h0 = n.hp; window.__teatroInterno.danneggiaNemico(n, 10, 1, 0); const normale = h0 - n.hp;
    I.statoB4().critForzato = true;
    const h1 = n.hp; window.__teatroInterno.danneggiaNemico(n, 10, 1, 0); const critico = h1 - n.hp;
    const fumetto = I.statoB4().fumetto ? I.statoB4().fumetto.testo : null;
    const h2 = n.hp; window.__teatroInterno.danneggiaNemico(n, 10, 0, 0); const senzaDirezione = h2 - n.hp;
    return { subito, conEco, dmgPrimo, dmgEco, dmg: S.dmg, normale, critico, fumetto, senzaDirezione, sberleffi: I.SBERLEFFI_B4 };
  }, bersaglio('x', 0, 0));
  ok('Pulcinella Traditore: ogni attacco colpisce due volte (eco al 50%)', pulc.subito === 4 && pulc.conEco === 8 && Math.abs(pulc.dmgEco - pulc.dmgPrimo * 0.5) < 0.01, pulc);
  ok('Pulcinella Traditore: critico ×2 con sberleffo a fumetto, non sui danni senza direzione', pulc.normale === 10 && pulc.critico === 20
    && pulc.sberleffi.includes(pulc.fumetto) && pulc.senzaDirezione === 10, pulc);
  await p.evaluate(() => { const I = window.__teatro.interni; I.statoB4().fumetto.t0 = window.__teatro.tick - 8; });
  await p.waitForTimeout(60);
  await p.screenshot({ path: foto('04-pulcinella-traditore') });
  await primoPiano('04b-pulcinella-traditore-primo-piano');

  // Burattino senza Fili
  await pulisci();
  await dai(TERNE.fili);
  const fili = await p.evaluate((mk) => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    const mob = { ...mk, id: 'mob', x: P.x + 80, y: P.y, stunTicks: 0 }, boss = { ...mk, id: 'boss', x: P.x - 80, y: P.y, stunTicks: 0, boss: true };
    S.stanzaCorrente.nemici = [mob, boss]; S.stanzaCorrente.pulita = false;
    const caso = Math.random; Math.random = () => 0; // il filo si recide sempre
    window.__teatroInterno.danneggiaNemico(mob, 1, 1, 0); window.__teatroInterno.danneggiaNemico(boss, 1, 1, 0);
    Math.random = () => 0.99; const mob2 = { ...mk, id: 'mob2', x: 100, y: 100, stunTicks: 0 }; window.__teatroInterno.danneggiaNemico(mob2, 1, 1, 0);
    Math.random = caso;
    const fermoMob = mob.stunTicks, fermoBoss = boss.stunTicks;
    mob.stunTicks = 99999; boss.stunTicks = 99999; boss.boss = false; // fermi per la foto (nessuna IA di prova)
    for (let i = 0; i < 3; i++) I.passoLogico();
    return { orbitali: S.statD.orbitali, posizioni: (S.orbitaliPosD || []).length, fermoMob, fermoBoss, atteso: I.TRASFORMAZIONI_B4.fili.fermoTick, sfortunato: mob2.stunTicks };
  }, bersaglio('x', 0, 0));
  ok('Burattino senza Fili: due gomitoli e fili recisi (mai ai boss)', fili.orbitali === 2 && fili.posizioni === 2 && fili.fermoMob === fili.atteso && fili.fermoBoss === 0 && fili.sfortunato === 0, fili);
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('05-burattino-senza-fili') });
  await primoPiano('05b-burattino-senza-fili-primo-piano');

  // Santo di Cera
  await pulisci();
  await dai(TERNE.sacro);
  const sacro = await p.evaluate((mk) => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    const vicino = { ...mk, id: 'vicino', x: P.x + 50, y: P.y }, lontano = { ...mk, id: 'lontano', x: P.x + 150, y: P.y };
    S.stanzaCorrente.nemici = [vicino, lontano]; S.stanzaCorrente.pulita = false;
    S.proiettiliNemici = [{ x: P.x + 30, y: P.y - 20, vx: 0, vy: 0, dist: 0 }, { x: P.x + 200, y: P.y, vx: 0, vy: 0, dist: 0 }];
    const scudoSubito = S.scudoStanzaD, hp0 = S.hpHalf;
    P.invuln = 0; I.subisciColpoGiocatore(1, 'prova', P.x - 10, P.y);
    const dopoScudo = { hp: S.hpHalf, scudo: S.scudoStanzaD, persoVicino: 9999 - vicino.hp, persoLontano: 9999 - lontano.hp, colpiNemici: S.proiettiliNemici.length };
    P.invuln = 0; const v1 = vicino.hp; I.subisciColpoGiocatore(1, 'prova', P.x - 10, P.y);
    const dopoFerita = { hp: S.hpHalf, persoVicino: v1 - vicino.hp };
    I.entraInStanza(S.stanzaCorrente, null);
    return { scudoSubito, hp0, dopoScudo, dopoFerita, scudoNuovaStanza: S.scudoStanzaD, dmg: S.dmg, statScudo: S.statD.scudoStanza };
  }, bersaglio('x', 0, 0));
  ok('Santo di Cera: scudo a ogni stanza (tetto 1)', sacro.scudoSubito === 1 && sacro.dopoScudo.hp === sacro.hp0 && sacro.dopoScudo.scudo === 0 && sacro.scudoNuovaStanza === 1 && sacro.statScudo === 1, sacro);
  ok('Santo di Cera: onda di luce che ferisce i vicini e spegne i colpi', Math.abs(sacro.dopoScudo.persoVicino - sacro.dmg * 2.5) < 0.01 && sacro.dopoScudo.persoLontano === 0
    && sacro.dopoScudo.colpiNemici === 1 && sacro.dopoFerita.hp === sacro.hp0 - 1 && sacro.dopoFerita.persoVicino > 0, sacro);
  await pulisci();
  await dai(TERNE.sacro);
  await avanza(3);
  await p.waitForTimeout(120);
  await primoPiano('06b-santo-di-cera-primo-piano');
  await p.evaluate((mk) => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    S.stanzaCorrente.nemici = [{ ...mk, id: 'a', x: P.x + 46, y: P.y - 10 }, { ...mk, id: 'b', x: P.x - 52, y: P.y + 14 }]; S.stanzaCorrente.pulita = false;
    S.scudoStanzaD = 1; P.invuln = 0; I.subisciColpoGiocatore(1, 'prova', P.x - 10, P.y);
  }, bersaglio('x', 0, 0));
  await p.waitForTimeout(90);
  await p.screenshot({ path: foto('06-santo-di-cera-onda') });

  // Mastro di Fucina
  await pulisci();
  await dai(TERNE.fuoco);
  const fuoco = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    S.proiettili = [];
    const magli = [];
    for (let k = 0; k < 6; k++) { P.cooldown = 0; I.eseguiAttacco4Direzioni(1, 0); magli.push(S.proiettili.filter((x) => x.maglioB4).length); }
    const m = S.proiettili.find((x) => x.maglioB4);
    return { burn: S.burn, magli, dmgMaglio: m.dmg, dmg: S.dmg, scoppio: m.esplosiva, tipo: m.tipo, sprite: Boolean(window.__teatro.interni.SPRITE_OGGETTI) };
  });
  ok('Mastro di Fucina: bruciatura e colpo di maglio a ogni terzo attacco', fuoco.burn && fuoco.magli.join() === '0,0,1,1,1,2' && Math.abs(fuoco.dmgMaglio - fuoco.dmg * 2.2) < 0.01 && fuoco.scoppio === 40 && fuoco.tipo === 'maglio', fuoco);
  await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    S.proiettili = []; I.statoB4().colpiMaglio = 2; P.cooldown = 0; I.eseguiAttacco4Direzioni(1, 0);
    for (let i = 0; i < 10; i++) I.passoLogico();
    I.statoB4().colpiMaglio = 2;
  });
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('07-mastro-di-fucina') });
  await primoPiano('07b-mastro-di-fucina-primo-piano');

  // Re dei Gatti
  await pulisci();
  const velPrima = await p.evaluate(() => window.__teatro.interni.statoRun.speed);
  await dai(TERNE.bestia);
  const bestia = await p.evaluate((mk) => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    const n = { ...mk, id: 'topo', x: P.x + 40, y: P.y + 10 };
    S.stanzaCorrente.nemici = [n]; S.stanzaCorrente.pulita = false;
    for (let i = 0; i < 90; i++) I.passoLogico();
    return { famigli: S.famigliD.map((f) => [f.id, f.dmg, Boolean(f.b4)]), perso: 9999 - n.hp, speed: S.speed };
  }, bersaglio('x', 0, 0));
  ok('Re dei Gatti: due gatti in più (oltre a quello dell\'oggetto) e passo svelto', bestia.famigli.length === 3 && bestia.famigli.filter((f) => f[2] && f[1] === 2).length === 2
    && bestia.perso > 0 && Math.abs(bestia.speed - velPrima - 2 * (0.1 + 0.15)) < 0.001, { ...bestia, velPrima }); // pettine +0,10 · Re dei Gatti +0,15
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('08-re-dei-gatti') });
  await primoPiano('08b-re-dei-gatti-primo-piano');

  // Il Mangiamaccheroni
  await pulisci();
  const cibo = await p.evaluate((dati) => {
    const I = window.__teatro.interni; const S = I.statoRun; const P = I.player;
    I.daiOggettoQA(dati.terna[0]); I.daiOggettoQA(dati.terna[1]);
    S.hpHalf = 1; const max2 = S.maxHpHalf;
    I.daiOggettoQA(dati.terna[2]);
    const dopo = { max: S.maxHpHalf, hp: S.hpHalf };
    // stanza ripulita: +½ maschera
    S.hpHalf = 3;
    const n = { ...dati.mk, id: 'ultimo', x: P.x + 60, y: P.y, hp: 1 };
    S.stanzaCorrente.nemici = [n]; S.stanzaCorrente.pulita = false;
    window.__teatroInterno.danneggiaNemico(n, 5, 1, 0);
    const pulita = S.stanzaCorrente.pulita;
    const hpDopoStanza = S.hpHalf;
    S.stanzaCorrente.oggettiATerra = [];
    return { max2, dopo, pulita, hpDopoStanza, bonusOggetto3: 2 };
  }, { terna: TERNE.cibo, mk: bersaglio('x', 0, 0) });
  ok('Il Mangiamaccheroni: +2 maschere, salute piena, +½ a stanza ripulita', cibo.dopo.max === cibo.max2 + 2 + 4 && cibo.dopo.hp === cibo.dopo.max && cibo.pulita && cibo.hpDopoStanza === 4, cibo);
  await avanza(3);
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('09-mangiamaccheroni') });
  await primoPiano('09b-mangiamaccheroni-primo-piano');

  // ---------------------------------------------------------------- 4. sinergie
  await pulisci();
  const sin = await p.evaluate(() => {
    const I = window.__teatro.interni; const S = I.statoRun;
    const righe = [];
    for (const r of I.SINERGIE_B4) {
      I.azzeraTrasformazioniQA();
      I.daiOggettoQA(r.a);
      const conUno = I.statoTrasformazioni().sinergie.includes(r.id);
      I.daiOggettoQA(r.b);
      const x = I.statoTrasformazioni();
      righe.push({ id: r.id, conUno, attiva: x.sinergie.includes(r.id), annunciata: I.statoB4().coda.some((c) => c.tipo === 'sinergia' && c.sinergia.id === r.id),
        esistono: Boolean(I.trovaOggettoB(r.a)) && Boolean(I.trovaOggettoB(r.b)),
        stat: { piercing: S.piercing, triplo: S.triplo, orbitali: S.statD.orbitali, oming: S.statD.oming, esplosiva: S.statD.esplosiva, blocco: S.statD.bloccoProb,
          cad: S.colpiAlSec, speed: S.speed, projScale: S.projScale, fam: S.famigliD.map((f) => [f.id, f.dmg, f.cadenza, f.oming]), eff: x.eff } });
    }
    return righe;
  });
  ok('almeno 12 sinergie, tutte fra oggetti che esistono', sin.length >= 12 && sin.every((r) => r.esistono), sin.length);
  ok('ogni sinergia si accende solo con entrambi gli oggetti ed è annunciata', sin.every((r) => !r.conUno && r.attiva && r.annunciata), sin.filter((r) => r.conUno || !r.attiva || !r.annunciata).map((r) => r.id));
  const S = Object.fromEntries(sin.map((r) => [r.id, r.stat]));
  ok('effetti di statistica delle sinergie', S['ferri-mestiere'].piercing && S['gioco-ombre'].triplo && S['sistema-mondo'].orbitali === 3
    && S['ago-filo'].oming === 0.05 && S['festa-piedigrotta'].esplosiva === 60 && Math.abs(S.malocchio.blocco - 0.25) < 1e-9
    && Math.abs(S['palla-cannone'].projScale - 1.55 * 1.25) < 1e-9 && S['palla-cannone'].eff.spinta === 3
    && S['coppia-scena'].fam.every((f) => f[3]) && Math.abs(S['coppia-scena'].fam[0][1] - 4.5) < 1e-9
    && S['gatto-latte'].fam[0][1] === 6 && Math.abs(S['diavolo-acquasanta'].fam[0][2] - 1.6) < 1e-9, S);
  const cadenze = await p.evaluate(() => {
    const I = window.__teatro.interni; const R = I.statoRun;
    I.azzeraTrasformazioniQA(); I.daiOggettoQA('venti'); I.daiOggettoQA('mercurio'); const senza = R.colpiAlSec;
    I.azzeraTrasformazioniQA(); I.daiOggettoQA('triplo'); const soloTriplo = R.colpiAlSec; I.daiOggettoQA('venti'); const con = R.colpiAlSec;
    I.azzeraTrasformazioniQA(); I.daiOggettoQA('sugna'); const lento = R.speed, d0 = R.dmg; I.daiOggettoQA('tarallo');
    const dSoloTarallo = (() => { const eq = R.oggettiEquipaggiati.slice(); return eq.length; })();
    return { senza, soloTriplo, con, lento, svelto: R.speed, d0, d1: R.dmg, dSoloTarallo };
  });
  ok('Rosa dei Venti: cadenza ×1,4 · \'Nzogna e Pepe: +0,25 velocità', Math.abs(cadenze.con - cadenze.soloTriplo * 1.4) < 1e-9 && Math.abs(cadenze.svelto - cadenze.lento - 0.5) < 1e-9, cadenze);

  // ganci delle sinergie, uno per uno
  const ganci = await p.evaluate((mk) => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player; const out = {};
    const prepara = (ids) => {
      I.azzeraTrasformazioniQA(); for (const id of ids) I.daiOggettoQA(id);
      R.proiettili = []; R.proiettiliNemici = []; R.stanzaCorrente.nemici = []; R.stanzaCorrente.pulita = true; R.stanzaCorrente.oggettiATerra = [];
      P.x = 320; P.y = 200; P.invuln = 0; P.cooldown = 0; R.graziaIngressoC = 0; R.scudoRosaC = false; R.hpHalf = R.maxHpHalf;
    };
    const colpisci = window.__teatroInterno.danneggiaNemico;
    // Carambola Cremisi
    prepara(['gomma', 'anello']);
    P.x = I.ARENA.x2 - 30; I.sparaProiettiliDirezione(1, 0);
    const pr = R.proiettili[0]; const d0 = pr.dmg;
    for (let i = 0; i < 25; i++) I.passoLogico();
    out.carambola = { d0, d1: pr.dmg, rimbalzi: pr.rimbalzi };
    // Argento Vivo
    prepara(['catena', 'mercurio']);
    const a = { ...mk, id: 'a', x: 300, y: 150 }, b = { ...mk, id: 'b', x: 400, y: 150 }, c = { ...mk, id: 'c', x: 460, y: 150 };
    R.stanzaCorrente.nemici = [a, b, c]; R.stanzaCorrente.pulita = false;
    colpisci(a, 10, 1, 0);
    out.argento = { b: 9999 - b.hp, c: 9999 - c.hp };
    // Fucina Accesa
    prepara(['fuoco', 'mantice']);
    const m = { ...mk, id: 'm', x: 300, y: 150, hp: 1 }, v = { ...mk, id: 'v', x: 340, y: 150 }, l = { ...mk, id: 'l', x: 420, y: 150 };
    R.stanzaCorrente.nemici = [m, v, l]; R.stanzaCorrente.pulita = false;
    colpisci(m, 5, 1, 0);
    out.fucina = { vicino: v.burnTicks || 0, lontano: l.burnTicks || 0 };
    // Palla di Cannone
    prepara(['piombo', 'sole']);
    const q = { ...mk, id: 'q', x: 300, y: 150 }; R.stanzaCorrente.nemici = [q]; R.stanzaCorrente.pulita = false;
    colpisci(q, 1, 1, 0); const kbCon = q.kbx;
    prepara(['piombo']);
    const q2 = { ...mk, id: 'q2', x: 300, y: 150 }; R.stanzaCorrente.nemici = [q2]; R.stanzaCorrente.pulita = false;
    colpisci(q2, 1, 1, 0);
    out.palla = { con: kbCon, senza: q2.kbx };
    // Botta e Risposta
    prepara(['carta-ventaglio', 'cuoio']);
    const t = { ...mk, id: 't', x: 420, y: 200 }; R.stanzaCorrente.nemici = [t]; R.stanzaCorrente.pulita = false;
    R.proiettiliNemici = [{ x: P.x, y: P.y - 6, vx: 0, vy: 0, dist: 0 }];
    const caso = Math.random; Math.random = () => 0;
    for (let i = 0; i < 10 && R.proiettiliNemici.length; i++) I.passoLogico(); // (l'hit-stop delle prove prima può durare qualche tick)
    Math.random = caso;
    const risposta = R.proiettili.find((x) => x.tipo === 'viola');
    out.botta = { hp: R.hpHalf, max: R.maxHpHalf, risposta: risposta ? { dmg: risposta.dmg, vx: risposta.vx, oming: risposta.oming } : null, dmg: R.dmg };
    // Grazia Ricevuta
    prepara(['velo-madonna', 'ostia']);
    R.hpHalf = 3; I.subisciColpoGiocatore(1, 'prova', P.x - 10, P.y);
    out.grazia = { hp: R.hpHalf, scudo: R.scudoStanzaD };
    // Scampanata
    prepara(['campana', 'campanello']);
    R.caricaAttivo = 0;
    const u = { ...mk, id: 'u', x: 300, y: 150, hp: 1 }; R.stanzaCorrente.nemici = [u]; R.stanzaCorrente.pulita = false;
    colpisci(u, 5, 1, 0);
    out.scampanata = { carica: R.caricaAttivo, max: R.oggettoAttivo.maxCarica };
    R.stanzaCorrente.oggettiATerra = [];
    // Ferri del Mestiere: il fendente lancia anche un chiodo perforante
    prepara(['spada', 'chiodo']);
    I.eseguiAttacco4Direzioni(1, 0);
    out.ferri = { spada: R.haSpada, colpi: R.proiettili.length, perforante: R.proiettili[0] ? R.proiettili[0].piercing : null };
    // Gioco d'Ombre
    prepara(['lanterna', 'doppia']);
    I.sparaProiettiliDirezione(1, 0);
    out.ombre = { colpi: R.proiettili.length };
    return out;
  }, bersaglio('x', 0, 0));
  ok('Carambola Cremisi: +35% a rimbalzo', Math.abs(ganci.carambola.d1 - ganci.carambola.d0 * 1.35) < 1e-6 && ganci.carambola.rimbalzi === 1, ganci.carambola);
  ok('Argento Vivo: il fulmine arriva oltre i 72 px', Math.abs(ganci.argento.b - 4.5) < 1e-9 && ganci.argento.c === 0, ganci.argento);
  ok('Fucina Accesa: il fuoco passa ai vicini', ganci.fucina.vicino >= 120 && ganci.fucina.lontano === 0, ganci.fucina);
  ok('Palla di Cannone: spinta ×3', Math.abs(ganci.palla.con - ganci.palla.senza * 3) < 1e-9 && ganci.palla.senza > 0, ganci.palla);
  ok('Botta e Risposta: il colpo parato riparte a ricerca', ganci.botta.hp === ganci.botta.max && ganci.botta.risposta && Math.abs(ganci.botta.risposta.dmg - ganci.botta.dmg * 1.5) < 1e-9
    && ganci.botta.risposta.vx > 0 && ganci.botta.risposta.oming > 0, ganci.botta);
  ok('Grazia Ricevuta: +½ maschera quando il Velo para', ganci.grazia.hp === 4 && ganci.grazia.scudo === 0, ganci.grazia);
  ok('Scampanata: una tacca in più a stanza ripulita', ganci.scampanata.carica === 2, ganci.scampanata);
  ok('Ferri del Mestiere: fendente + chiodo perforante', ganci.ferri.spada && ganci.ferri.colpi === 1 && ganci.ferri.perforante === true, ganci.ferri);
  ok('Gioco d\'Ombre: ventaglio di tre', ganci.ombre.colpi === 3, ganci.ombre);

  // annuncio di una sinergia (screenshot)
  await pulisci();
  await dai(['pupo_tonino', 'pupa_agnese']);
  await avanza(30);
  s = await stato();
  ok('annuncio «SINERGIA: …» a schermo', s.annuncio && s.annuncio.tipo === 'sinergia' && s.annuncio.titolo === 'Coppia di Scena', s.annuncio);
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('10-annuncio-sinergia') });

  // ---------------------------------------------------------------- 5. tutto insieme: tetti e tempo di disegno
  await pulisci();
  const tutto = await p.evaluate((terne) => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    for (const lista of Object.values(terne)) for (const id of lista) I.daiOggettoQA(id);
    for (const id of ['gomma', 'gomitolo', 'gomitolo', 'astrolabio', 'velo-madonna', 'cuoio', 'cuoio', 'cuoio', 'corno', 'pupo_tonino', 'pupa_agnese', 'pulcinellino', 'ragno', 'cappello-mago']) I.daiOggettoQA(id);
    const x = I.statoTrasformazioni();
    R.proiettili = [];
    for (let k = 0; k < 60; k++) { P.cooldown = 0; I.eseguiAttacco4Direzioni(1, 0); for (let i = 0; i < 6; i++) { I.passoLogico(); if (R.proiettili.length > I.OGGETTI_D.clamp.proiettiliGiocatore) return { sforato: R.proiettili.length }; } }
    return { attive: x.attive.length, rimbalzi: R.statD.rimbalzi, orbitali: R.statD.orbitali, scudo: R.statD.scudoStanza, blocco: R.statD.bloccoProb,
      famigli: R.famigliD.length, proiettili: R.proiettili.length, range: R.range, cad: R.colpiAlSec, speed: R.speed, maxHp: R.maxHpHalf, clamp: I.OGGETTI_D.clamp };
  }, TERNE);
  ok('otto trasformazioni insieme, tetti rispettati', tutto.attive === 8 && tutto.rimbalzi <= tutto.clamp.rimbalzi && tutto.orbitali <= tutto.clamp.orbitali
    && tutto.scudo <= tutto.clamp.scudoStanza && tutto.blocco <= tutto.clamp.bloccoProb && tutto.famigli <= tutto.clamp.famigli
    && tutto.proiettili <= tutto.clamp.proiettiliGiocatore && tutto.range <= 320 && tutto.cad <= 7.5 && tutto.speed <= 4 && tutto.maxHp <= 24, tutto);
  await p.evaluate((mk) => {
    const I = window.__teatro.interni; const R = I.statoRun; const P = I.player;
    R.proiettili = []; P.x = 320; P.y = 200;
    R.stanzaCorrente.nemici = [{ ...mk, id: 'a', x: 430, y: 180 }, { ...mk, id: 'b', x: 215, y: 232 }]; R.stanzaCorrente.pulita = false;
    I.statoB4().coda.length = 0; I.statoB4().annuncio = null; R.cartiglioD = null; R.bannerTimer = 0;
    for (let k = 0; k < 3; k++) { P.cooldown = 0; I.eseguiAttacco4Direzioni(1, 0); for (let i = 0; i < 8; i++) I.passoLogico(); }
  }, bersaglio('x', 0, 0));
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('11-otto-trasformazioni-insieme') });
  await primoPiano('11b-otto-insieme-primo-piano');
  const tempo = await p.evaluate(() => {
    // costo in JS di un frame (200 disegni di fila) con tutto acceso e, sulla stessa scena, col costume spento
    const I = window.__teatro.interni; const R = I.statoRun;
    const misura = () => { const t0 = performance.now(); for (let i = 0; i < 200; i++) { window.iniziaFrame(); window.disegnaFrame(16.7); } return (performance.now() - t0) / 200; };
    misura();
    const con = misura();
    const salvato = R.trasfB4; R.trasfB4 = null;
    const senza = misura();
    R.trasfB4 = salvato;
    return { conMs: con, senzaMs: senza, costoMs: con - senza };
  });
  ok('costo di disegno del costume, dell\'HUD e degli effetti sotto 1 ms a frame', tempo.costoMs < 1, tempo);

  // ---------------------------------------------------------------- 6. altri personaggi e sipario
  await p.evaluate(() => { const I = window.__teatro.interni; I.selezionaPersonaggio('taddeo'); I.statoRun.fase = 'in_gioco'; I.nuovaRun(false); I.statoRun.siparioAttivo = null; });
  await pulisci();
  await p.evaluate((terne) => { const I = window.__teatro.interni; for (const t of ['denari', 'sacro', 'bestia', 'maschera']) for (const id of terne[t]) I.daiOggettoQA(id); I.statoB4().coda.length = 0; I.statoRun.cartiglioD = null; I.statoRun.bannerTimer = 0; }, TERNE);
  await avanza(3);
  await p.waitForTimeout(120);
  await primoPiano('12-taddeo-primo-piano');
  await p.evaluate(() => { const I = window.__teatro.interni; I.selezionaPersonaggio('ferruccio'); I.statoRun.fase = 'in_gioco'; I.nuovaRun(false); });
  s = await stato();
  ok('una run nuova riparte senza trasformazioni', s.attive.length === 0 && s.sinergie.length === 0, s);
  await p.evaluate((terne) => { const I = window.__teatro.interni; for (const t of ['denari', 'fuoco']) for (const id of terne[t]) I.daiOggettoQA(id); }, TERNE);
  await p.waitForTimeout(150);
  await p.screenshot({ path: foto('13-sipario-col-costume') });
  await p.evaluate(() => { window.__teatro.interni.statoRun.siparioAttivo = null; });

  // ---------------------------------------------------------------- 7. Diario
  s = await stato();
  ok('le trasformazioni e le sinergie viste restano nel Diario dello slot', s.scoperte.length === 8 && s.sinergieScoperte.length === sin.length, { t: s.scoperte, s: s.sinergieScoperte.length });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(120);
  await p.keyboard.press('KeyO');
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('14-diario-oggetti-con-temi') });
  await p.keyboard.press('KeyT');
  await p.waitForTimeout(120);
  const pag1 = await p.evaluate(() => window.__teatro.interni.statoRun.diarioD && window.__teatro.interni.statoRun.diarioD.paginaB4);
  await p.screenshot({ path: foto('15-diario-trasformazioni') });
  await p.keyboard.press('KeyT');
  await p.waitForTimeout(120);
  const pag2 = await p.evaluate(() => window.__teatro.interni.statoRun.diarioD && window.__teatro.interni.statoRun.diarioD.paginaB4);
  await p.screenshot({ path: foto('16-diario-sinergie') });
  await p.keyboard.press('KeyT');
  const pag0 = await p.evaluate(() => window.__teatro.interni.statoRun.diarioD && window.__teatro.interni.statoRun.diarioD.paginaB4);
  await p.keyboard.press('KeyT');
  await p.keyboard.press('KeyC');
  const versoConsumabili = await p.evaluate(() => { const d = window.__teatro.interni.statoRun.diarioD; return d ? { b4: d.paginaB4, a2: Boolean(d.paginaA2) } : null; });
  await p.keyboard.press('KeyT');
  await p.keyboard.press('Escape');
  const chiuso = await p.evaluate(() => ({ diario: Boolean(window.__teatro.interni.statoRun.diarioD), pausa: window.__teatro.interni.statoRun.pausa }));
  ok('Diario: T scorre Trasformazioni → Sinergie → oggetti, C passa ai consumabili, Esc chiude', pag1 === 1 && pag2 === 2 && pag0 === 0
    && versoConsumabili && versoConsumabili.b4 === 0 && versoConsumabili.a2 === true && chiuso.diario === false && chiuso.pausa === true, { pag1, pag2, pag0, versoConsumabili, chiuso });
  await p.keyboard.press('Escape');
  // diario di uno slot vergine: tutto «???»
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await avvia();
  await p.keyboard.press('Escape');
  await p.keyboard.press('KeyO');
  await p.keyboard.press('KeyT');
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('17-diario-trasformazioni-ignote') });
  await p.keyboard.press('KeyT');
  await p.waitForTimeout(120);
  await p.screenshot({ path: foto('18-diario-sinergie-ignote') });

  ok('nessun errore di console in tutta la prova', errori.length === 0, errori);
  const falliti = esiti.filter((e) => !e.ok);
  for (const e of esiti) console.log(`${e.ok ? 'OK  ' : 'FALLITO'} ${e.nome}${e.ok ? '' : ' → ' + JSON.stringify(e.info)}`);
  console.log(`\n${esiti.length - falliti.length}/${esiti.length} controlli passati · screenshot: ${pref}`);
  await browser.close();
  process.exit(falliti.length ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
