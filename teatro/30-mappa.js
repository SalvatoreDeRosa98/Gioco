/*
 * teatro/30-mappa.js — Generazione della mappa di piano, stanze speciali, porte, popolamento delle stanze, avvio piano ed ingresso in stanza.
 * Script classico (niente moduli ES): le dichiarazioni di primo livello stanno nello scope globale
 * condiviso con gli altri file di teatro/. Ordine di caricamento e regole: teatro/LEGGIMI.md.
 */

function colpisciMuroSegretoC(st, x, y) {
  if (!st?.muroSegreto || st.muroSegreto.aperto) return;
  st.muroSegreto.colpi = (st.muroSegreto.colpi || 0) + 1;
  if (Number.isFinite(x)) statoRun.effettiSplash.push({ x, y, tick: 0 });
  if (st.muroSegreto.colpi >= STANZE_C.segreta.colpiMuro) apriMuroSegreto(st);
}
// --- C: fine ---

function apriMuroSegreto(st) {
  if (!st?.muroSegreto || st.muroSegreto.aperto) return;
  st.muroSegreto.aperto = true;
  const seg = statoRun.mappa.perId.get(st.muroSegreto.idDest);
  if (seg) {
    st.porte[st.muroSegreto.lato] = seg.id;
    seg.porte[st.muroSegreto.opposto] = st.id;
  }
  scuoti(FEEL.scossa.evento);
  mostraBanner('🔓 PASSAGGIO SEGRETO APERTO! Entra nella Stanza Segreta (?) coi Mob d\'Oro per fare soldi!', 220);
}

/** Stanze di combattimento del piano (STANZE_COMBATTIMENTO_PER_PIANO, per piano del ciclo). */
function numeroStanzeCombattimento(piano) {
  const pianoNelCiclo = ((piano - 1) % 4) + 1;
  return STANZE_COMBATTIMENTO_PER_PIANO[pianoNelCiclo] || 6;
}

/**
 * Mappa del piano alla maniera di Isaac: catena principale ingresso → ≥ MAPPA_PIANO.catenaMin stanze di
 * combattimento → boss, poi rami laterali con le altre stanze di combattimento, tesoro e fucina in fondo
 * a un ramo, segreta dietro un muro, patto fuori griglia. Ogni stanza nuova tocca una sola stanza
 * esistente (regola di Isaac: niente anelli, vicoli ciechi veri). I vincoli sono verificati prima di
 * accettare la mappa (tools/qa-teatro-generatore.js li controlla su 200 semi).
 */

function generaMappaPiano(piano) {
  const nCombattimento = numeroStanzeCombattimento(piano);
  const G = MAPPA_PIANO;
  const dirs = [
    { lato: 'N', opposto: 'S', dx: 0, dy: -1 },
    { lato: 'E', opposto: 'W', dx: 1, dy: 0 },
    { lato: 'S', opposto: 'N', dx: 0, dy: 1 },
    { lato: 'W', opposto: 'E', dx: -1, dy: 0 },
  ];

  for (let tentativo = 0; tentativo < G.tentativi; tentativo++) {
    const griglia = new Map();
    const stanze = [];
    const key = (x, y) => `${x},${y}`;
    const aggiungi = (tipo, cx, cy) => {
      const s = {
        id: `r${stanze.length}`,
        tipo,
        cx, cy,
        porte: {},
        muroSegreto: null,
        pulita: tipo === 'ingresso' || tipo === 'tesoro' || tipo === 'fucina' || tipo === 'patto',
        visitata: tipo === 'ingresso',
        nemici: [],
        ostacoli: [],
        oggettiATerra: [],
        oggettoPiedistallo: null,
        ricompensaOggetto: null,
        slotFucina: [],
        slotPatto: [],
        uscitaAperta: false,
        portaPattoAperta: false,
      };
      stanze.push(s);
      if (cx >= 1 && cy >= 1) griglia.set(key(cx, cy), s);
      return s;
    };
    const collega = (a, b, d) => {
      a.porte[d.lato] = b.id;
      b.porte[d.opposto] = a.id;
    };
    const dentro = (x, y) => x >= 1 && x <= G.larghezza && y >= 1 && y <= G.altezza;
    const nVicini = (x, y) => dirs.filter((d) => griglia.has(key(x + d.dx, y + d.dy))).length;
    /** Una cella libera accanto a `da` che tocca solo `da`; null se non c'è. */
    const cellaLibera = (da, evitaBoss = false) => {
      for (const d of shuffle(dirs)) {
        const nx = da.cx + d.dx, ny = da.cy + d.dy;
        if (!dentro(nx, ny) || griglia.has(key(nx, ny)) || nVicini(nx, ny) !== 1) continue;
        if (evitaBoss && dirs.some((d2) => griglia.get(key(nx + d2.dx, ny + d2.dy))?.tipo === 'boss')) continue;
        return { nx, ny, d };
      }
      return null;
    };

    const ingresso = aggiungi('ingresso', Math.ceil(G.larghezza / 2), Math.ceil(G.altezza / 2));
    // 1. Catena principale
    const lungCatena = Math.min(nCombattimento - 1,
      G.catenaMin + Math.floor(rng() * (G.catenaExtraMax + 1)) + Math.floor((nCombattimento - 6) / 2));
    let curr = ingresso;
    let ok = true;
    const catena = [];
    for (let i = 0; i < lungCatena; i++) {
      const c = cellaLibera(curr);
      if (!c) { ok = false; break; }
      const nuova = aggiungi('normale', c.nx, c.ny);
      collega(curr, nuova, c.d);
      catena.push(nuova);
      curr = nuova;
    }
    if (!ok) continue;
    // 2. Boss in fondo alla catena
    const cb = cellaLibera(curr);
    if (!cb) continue;
    const bossRoom = aggiungi('boss', cb.nx, cb.ny);
    collega(curr, bossRoom, cb.d);
    // 3. Rami: le altre stanze di combattimento, attaccate alla catena (non al boss) o a un ramo
    let ultimoRamo = null;
    for (let i = lungCatena; i < nCombattimento && ok; i++) {
      let posto = false;
      const genitori = ultimoRamo && rng() < G.proseguiRamo
        ? [ultimoRamo, ...shuffle([ingresso, ...stanze.filter((x) => x.tipo === 'normale')])]
        : shuffle([...catena, ...stanze.filter((x) => x.tipo === 'normale' && !catena.includes(x)), ingresso]);
      for (const g of genitori) {
        const c = cellaLibera(g, true);
        if (!c) continue;
        const nuova = aggiungi('normale', c.nx, c.ny);
        collega(g, nuova, c.d);
        ultimoRamo = nuova;
        posto = true;
        break;
      }
      if (!posto) ok = false;
    }
    if (!ok) continue;
    // 4. Tesoro e fucina in fondo a un ramo (vicolo cieco), mai attaccati al boss
    for (const tipoSpec of ['tesoro', 'fucina']) {
      let pos = false;
      for (const g of shuffle(stanze.filter((x) => x.tipo === 'normale' || x.tipo === 'ingresso'))) {
        const c = cellaLibera(g, true);
        if (!c) continue;
        const spec = aggiungi(tipoSpec, c.nx, c.ny);
        collega(g, spec, c.d);
        pos = true;
        break;
      }
      if (!pos) { ok = false; break; }
    }
    if (!ok) continue;
    // Vincoli: numero di stanze di combattimento, catena ≥ catenaMin, almeno un bivio fuori dall'ingresso
    if (stanze.filter((x) => x.tipo === 'normale').length !== nCombattimento) continue;
    if (catena.length < G.catenaMin) continue;
    if (!stanze.some((x) => x.tipo === 'normale' && Object.keys(x.porte).length >= 3)) continue;

    let segretaOk = false;
    const candidatiSegreta = shuffle(stanze.filter((s) => s.tipo === 'normale' || s.tipo === 'ingresso'));
    for (const g of candidatiSegreta) {
      for (const d of shuffle(dirs)) {
        const nx = g.cx + d.dx, ny = g.cy + d.dy;
        if (!dentro(nx, ny) || griglia.has(key(nx, ny))) continue;
        const confBoss = dirs.some((d2) => griglia.get(key(nx + d2.dx, ny + d2.dy))?.tipo === 'boss');
        if (confBoss) continue;
        const stanzaSegreta = aggiungi('segreta', nx, ny);
        g.muroSegreto = { lato: d.lato, opposto: d.opposto, idDest: stanzaSegreta.id, aperto: false };
        stanzaSegreta.porte[d.opposto] = g.id;
        segretaOk = true;
        break;
      }
      if (segretaOk) break;
    }
    if (!segretaOk) continue;

    // --- B: inizio --- (Stanza dello Sviluppatore: vicolo cieco attaccato a una stanza di combattimento)
    if (OGGETTI_B.sviluppatore.piani.includes(piano)) {
      let svOk = false;
      for (const g of shuffle(stanze.filter((x) => x.tipo === 'normale'))) {
        const c = cellaLibera(g, true);
        if (!c) continue;
        const sv = aggiungi('sviluppatore', c.nx, c.ny);
        sv.pulita = true;
        sv.sceltaFattaB = false;
        sv.genitoreB = { id: g.id, lato: c.d.lato };
        collega(g, sv, c.d);
        svOk = true;
        break;
      }
      if (!svOk) continue;
    }
    // --- B: fine ---
    // Aggiunge la Stanza del Patto d'Ombra (Proposta 2: accessibile dopo aver sconfitto il Boss!)
    aggiungi('patto', 0, 0);

    for (const s of stanze) popolaStanzaIsaac(s, piano);
    return { piano, stanze, perId: new Map(stanze.map((s) => [s.id, s])) };
  }
  return null;
}

// --- C: inizio ---
/** Centri delle porte (come in disegnaStanza) e punti di entrata del giocatore (come in entraInStanza). */
const PORTE_C = Object.freeze({ N: { x: 320, y: 61 }, S: { x: 320, y: 313 }, W: { x: 59, y: 187 }, E: { x: 581, y: 187 } });

const ENTRATE_C = Object.freeze({
  N: { x: 320, y: ARENA.y1 + 18 }, S: { x: 320, y: ARENA.y2 - 18 },
  W: { x: ARENA.x1 + 22, y: 188 }, E: { x: ARENA.x2 - 22, y: 188 }, inizio: { x: 260, y: 225 },
});

/** Porte di una stanza da cui stare lontani: quelle aperte e il muro segreto (anche se chiuso). */
function porteVietateC(s) {
  const lati = new Set(Object.keys(s?.porte || {}));
  if (s?.muroSegreto) lati.add(s.muroSegreto.lato);
  return [...lati].map((l) => PORTE_C[l]).filter(Boolean);
}
/**
 * Punto più vicino a (x, y) a STANZE_C.distanzaPorte px da ogni punto vietato e ad almeno 26 px dagli
 * altri nemici. Ricerca a griglia deterministica (nessun rng): se nulla è libero, rinuncia allo spazio
 * fra nemici ma mai alla distanza dalle porte.
 * @param {number} x @param {number} y @param {{x:number,y:number}[]} vietati @param {{x:number,y:number}[]} [altri]
 */

function puntoLontanoDallePorteC(x, y, vietati, altri = []) {
  const D = STANZE_C.distanzaPorte;
  const lontano = (px, py) => vietati.every((p) => Math.hypot(px - p.x, py - p.y) >= D);
  const spazio = (px, py) => altri.every((o) => Math.hypot(px - o.x, py - o.y) >= 26);
  if (lontano(x, y) && spazio(x, y)) return { x, y };
  for (const conSpazio of [true, false]) {
    let best = null, bd = Infinity;
    for (let gy = ARENA.y1 + 24; gy <= ARENA.y2 - 24; gy += 6) {
      for (let gx = ARENA.x1 + 24; gx <= ARENA.x2 - 24; gx += 6) {
        if (!lontano(gx, gy) || (conSpazio && !spazio(gx, gy))) continue;
        const d = Math.hypot(gx - x, gy - y);
        if (d < bd) { bd = d; best = { x: gx, y: gy }; }
      }
    }
    if (best) return best;
  }
  return { x, y };
}

/** Allontana i nemici vivi della stanza dalle porte e dai punti vietati (ingresso, spawn a metà lotta). */
function allontanaNemiciDallePorteC(s, extra = []) {
  const vietati = [...porteVietateC(s), ...extra];
  const posti = [];
  for (const n of s.nemici || []) {
    if (n.hp <= 0) continue;
    const p = puntoLontanoDallePorteC(n.x, n.y, vietati, posti);
    n.x = p.x; n.y = p.y;
    posti.push(p);
  }
}
// --- C: fine ---

function popolaStanzaIsaac(s, piano) {
  const ciclo = Math.floor((piano - 1) / 4) + 1;
  const moltCiclo = Math.pow(1.45, ciclo - 1);
  const moltVel = Math.min(1.55, 1 + (piano - 1) * 0.045);
  const nomeCorto = (str) => str.replace(/\s*\(.*?\)/g, '');

  if (s.tipo === 'tesoro') {
    const item = tiraOggettoGratisStanza(true);
    s.oggettoPiedistallo = {
      ...item,
      x: 320,
      y: 192,
      preso: false,
    };
  } else if (s.tipo === 'patto') {
    // STANZA DEL PATTO D'OMBRA (Proposta 2: 2 reliquie proibite in cambio di 1 Maschera Massima!)
    const p1 = estraiOggettoPatto();
    const p2 = estraiOggettoPatto();
    s.slotPatto = [
      {
        tipo: 'patto', item: p1, nome: p1.nome, nomeBreve: nomeCorto(p1.nome),
        statsDesc: p1.statsDesc, costoMaxHpHalf: p1.costoMaxHpHalf || 2,
        sprite: p1.sprite, x: 236, y: 188, comprato: false,
      },
      {
        tipo: 'patto', item: p2, nome: p2.nome, nomeBreve: nomeCorto(p2.nome),
        statsDesc: p2.statsDesc, costoMaxHpHalf: p2.costoMaxHpHalf || 2,
        sprite: p2.sprite, x: 404, y: 188, comprato: false,
      },
    ];
  } else if (s.tipo === 'fucina') {
    const objBase = estraiNegativoD(OGGETTI_D.pool.probNegativoFucina) || estraiOggettoBase(); // D: negativo a 2🪙
    const objForte = estraiOggettoForte();
    const scontoBase = rng() < 0.22;
    const scontoForte = rng() < 0.12;
    const prezzoBase = scontoBase ? Math.floor(objBase.prezzo / 2) : objBase.prezzo;
    const prezzoForte = scontoForte ? Math.floor(objForte.prezzo / 2) : objForte.prezzo;

    s.slotFucina = [
      {
        tipo: 'cura', curaHalf: 1, nome: '½ Maschera di Cera', nomeBreve: '½ Maschera',
        // --- T3: inizio ---
        statsDesc: `Rigenera +½ ❤️ Maschera (consumabile: ${ECONOMIA_T3.prezzi.consumabile}🪙)`,
        prezzo: ECONOMIA_T3.prezzi.consumabile, inSaldo: false,
        sprite: 'mezzaMaschera', tier: 'cura', x: 158, y: 196, comprato: false,
        // --- T3: fine ---
      },
      {
        tipo: 'cura', curaHalf: 2, nome: 'Maschera Intera', nomeBreve: '1 Maschera',
        // --- T3: inizio ---
        statsDesc: `Rigenera +1 ❤️ Maschera intera (cuore: ${ECONOMIA_T3.prezzi.cuore}🪙)`,
        prezzo: ECONOMIA_T3.prezzi.cuore, inSaldo: false,
        sprite: 'cuore', tier: 'cura', x: 266, y: 196, comprato: false,
        // --- T3: fine ---
      },
      {
        tipo: 'oggetto', item: objBase, nome: objBase.nome, nomeBreve: nomeCorto(objBase.nome),
        statsDesc: objBase.statsDesc,
        prezzo: prezzoBase, inSaldo: scontoBase, sprite: objBase.sprite, tier: 'base', x: 374, y: 196, comprato: false,
      },
      {
        tipo: 'oggetto', item: objForte, nome: `★ ${objForte.nome}`, nomeBreve: `★ ${nomeCorto(objForte.nome)}`,
        statsDesc: objForte.statsDesc,
        prezzo: prezzoForte, inSaldo: scontoForte, sprite: objForte.sprite, tier: 'forte', x: 482, y: 196, comprato: false,
      },
    ];
  } else if (s.tipo === 'segreta') {
    s.ricompensaOggetto = null;
    s.nemici = [];
    s.pulita = true;
    // Regola Isaac richiesta: 1/3 di probabilità di avere un oggetto; se c'è, 1/5 che sia molto forte.
    const haOggetto = rng() < (1 / 3);
    if (haOggetto) {
      const forte = rng() < (1 / 5);
      const obj = forte ? estraiOggettoForte() : estraiOggettoBase();
      s.oggettoPiedistallo = {
        ...obj,
        x: 320,
        y: 192,
        preso: false,
        forteGratis: forte,
      };
    } else {
      s.oggettoPiedistallo = null;
      // Se non c'è l'oggetto, spawn sicuro di 3-5 monete dorate a terra e mezza maschera di cera
      const nMonete = 3 + Math.floor(rng() * 3);
      for (let m = 0; m < nMonete; m++) {
        spawnaMonetaATerra(s, 270 + rng() * 100, 160 + rng() * 50, rng() < 0.35 ? 2 : 1);
      }
      s.oggettiATerra.push({ tipo: 'cura', valore: 1, sprite: 'mezzaMaschera', x: 320, y: 192 });
    }
  } else if (s.tipo === 'normale') {
    s.ricompensaOggetto = null; // Regola Isaac: nessun oggetto gratis nelle stanze normali!
    s.macchie = [];
    s.pozzanghereFuoco = [];

    // Ostacoli tattici ambientali leggeri per non ingombrare la visuale
    const layoutOstacoli = [
      [{ tipo: 'colonna', x: 220, y: 140 }, { tipo: 'colonna', x: 420, y: 140 }],
      [{ tipo: 'colonna', x: 200, y: 188 }, { tipo: 'colonna', x: 440, y: 188 }],
      [{ tipo: 'fossa', x: 250, y: 160 }, { tipo: 'fossa', x: 390, y: 210 }],
      [{ tipo: 'braciere', x: 320, y: 188 }],
    ];
    const scelti = layoutOstacoli[Math.floor(rng() * layoutOstacoli.length)];
    for (const o of scelti) {
      s.ostacoli.push({
        tipo: o.tipo,
        x: o.x + Math.round((rng() - 0.5) * 12),
        y: o.y + Math.round((rng() - 0.5) * 12),
        r: o.tipo === 'colonna' ? 14 : o.tipo === 'braciere' ? 10 : 16,
        acceso: o.tipo === 'braciere',
        w: o.tipo === 'fossa' ? 34 : 26,
        h: o.tipo === 'fossa' ? 22 : 26,
      });
    }

    // Archetipi con temi coerenti per stanza (densità calibrata: 2 nemici al Piano 1, raramente 3 vespe)
    const TEMI_STANZA = [
      {
        nome: 'Nido di Vespe',
        getTipi: (p) => Array(p === 1 ? (rng() < 0.5 ? 2 : 3) : Math.min(4, 2 + Math.floor(p * 0.5))).fill('vespa_cieca')
      },
      {
        nome: 'Vicolo dei Gatti',
        getTipi: (p) => Array(p === 1 ? 2 : Math.min(3, 2 + (p >= 3 ? 1 : 0))).fill('gatto')
      },
      {
        nome: 'Pattuglia di Guardia',
        getTipi: (p) => (p === 1 ? ['guardia', rng() < 0.35 ? 'vespa_cieca' : null] : ['guardia', 'guardia']).filter(Boolean)
      },
      {
        nome: 'Cripta delle Maschere',
        getTipi: (p) => (p === 1 ? ['maschera', 'vespa_cieca'] : ['maschera', p >= 3 ? 'maschera' : 'vespa_cieca'])
      },
      {
        nome: 'Deposito di Polvere',
        getTipi: (p) => (p === 1 ? ['bomba_ferma', 'bomba_ferma'] : ['bomba_ferma', 'bomba_ferma', 'vespa_cieca'])
      },
      {
        nome: 'Chiostro di Pietra',
        getTipi: (p) => (p === 1 ? ['statua', 'vespa_cieca'] : ['statua', p >= 3 ? 'statua' : 'bomba_ferma'])
      }
    ];

    // Al Piano 1 qualsiasi stanza normale confinante con l'ingresso ha SEMPRE i Gatti d'Ombra per il playtest
    const vicinaIngresso = Object.values(s.porte || {}).some((p) => p.aStanzaId === 's0');
    const temaScelto = (piano === 1 && (vicinaIngresso || s.id === 's1'))
      ? TEMI_STANZA[1]
      : TEMI_STANZA[Math.floor(rng() * TEMI_STANZA.length)];
    const tipiGenerati = temaScelto.getTipi(piano);
    // --- C: dalla notte 3 a volte una Vespa in più (NOTTI_C.probNemicoExtra) ---
    if (rng() < effettiNotteC().probNemicoExtra) tipiGenerati.push('vespa_cieca');

    const nomiNem = {
      vespa_cieca: 'Vespa Cieca (Attack Fly)',
      bomba_ferma: 'Bozzo Esplosivo (Boil)',
      gatto: 'Gatto d\'Ombra (Hopper)',
      maschera: 'Maschera Corazzata (Host)',
      guardia: 'Guardia di Piombo',
      statua: 'Torrione di Marmo',
    };
    const baseHpMap = { vespa_cieca: 8, bomba_ferma: 12, gatto: 12, maschera: 16, guardia: 20, statua: 22 };
    const stageHpMap = { vespa_cieca: 2, bomba_ferma: 3, gatto: 3.5, maschera: 4.5, guardia: 5, statua: 6 };
    const baseSpdMap = { vespa_cieca: 1.45, bomba_ferma: 0.0, gatto: 1.38, maschera: 0.32, guardia: 0.98, statua: 0.0 };

    // Al Piano 1 i campioni sono quasi inesistenti (5%), nei piani avanzati salgono al 18%
    const probCampione = piano === 1 ? 0.05 : 0.18;

    for (let i = 0; i < tipiGenerati.length; i++) {
      const t = tipiGenerati[i];
      let champion = null;
      if (rng() < probCampione) {
        const rCh = rng();
        champion = rCh < 0.34 ? 'cremisi' : rCh < 0.67 ? 'dorato' : 'elettrico';
      }
      const multHpChamp = champion === 'cremisi' ? 1.6 : champion ? 1.35 : 1.0;
      const multSpdChamp = champion === 'dorato' ? 1.2 : 1.0;
      const hpMax = Math.round((baseHpMap[t] + (piano - 1) * stageHpMap[t]) * moltCiclo * multHpChamp);

      const offsetX = ((i % 3) - 1) * 90;
      const offsetY = Math.floor(i / 3) * 60 - 30;

      s.nemici.push({
        id: `${s.id}-e${i}`,
        tipo: t,
        patternMob: t,
        nome: champion ? `${nomiNem[t]} [Campione ${champion}]` : nomiNem[t],
        boss: false,
        mobSoldi: champion === 'dorato',
        champion,
        x: Math.max(ARENA.x1 + 40, Math.min(ARENA.x2 - 40, 320 + offsetX + (rng() - 0.5) * 40)),
        y: Math.max(ARENA.y1 + 40, Math.min(ARENA.y2 - 40, 185 + offsetY + (rng() - 0.5) * 40)),
        hp: hpMax,
        maxHp: hpMax,
        speed: baseSpdMap[t] * moltVel * multSpdChamp,
        r: t === 'statua' ? 13 : t === 'gatto' ? 14 : 11,
        flash: 0,
        burnTicks: 0,
        stunTicks: 0,
        state: 'idle',
        stateTimer: 20 + Math.floor(rng() * 25),
        maskOpen: false,
        shootCd: 40 + Math.floor(rng() * 45),
      });
    }
    allontanaNemiciDallePorteC(s); // --- C: nemici mai vicino alle porte ---
  } else if (s.tipo === 'boss') {
    const pianoNelCiclo = ((piano - 1) % 4) + 1;
    const bossInfo = pianoNelCiclo === 4
      ? BOSS_FINALE
      : statoRun.bossOrdine[(piano - 1) % statoRun.bossOrdine.length];
    const hpMax = Math.round((bossInfo.hpBase + (pianoNelCiclo - 1) * 45) * moltCiclo);
    s.nemici.push({
      id: `${s.id}-boss`,
      bossId: bossInfo.id,
      nome: ciclo > 1 ? `${bossInfo.nome} (Ciclo ${ciclo})` : bossInfo.nome,
      tipo: bossInfo.tipo,
      pattern: bossInfo.pattern,
      boss: true,
      // --- C: inizio --- il boss parte lontano dalle porte (prima a 320,162: a 101 px dalla porta nord)
      ...puntoLontanoDallePorteC(320, 162, porteVietateC(s)),
      // --- C: fine ---
      vx: 1.35,
      vy: 1.05,
      airZ: 0,
      handSlamY: 0,
      state: 'idle',
      stateTimer: 45,
      hp: hpMax,
      maxHp: hpMax,
      speed: bossInfo.speed * moltVel,
      r: pianoNelCiclo === 4 ? 22 : 18,
      flash: 0,
      burnTicks: 0,
      stunTicks: 0,
      shootCd: 40,
      phaseTick: 0,
    });
  }
}

function avviaPiano(piano, mostraSipario = true) {
  statoRun.piano = piano;
  statoRun.ciclo = Math.floor((piano - 1) / 4) + 1;
  statoRun.dannoSubitoNelBoss = false;
  if ((piano - 1) % 4 === 0 && piano > 1) {
    statoRun.bossOrdine = shuffle(POOL_BOSS);
  }
  statoRun.mappa = generaMappaPiano(piano);
  // rete di sicurezza: con un seme sfortunato si ritenta con un seme nuovo (mai una mappa nulla)
  for (let k = 0; !statoRun.mappa && k < 20; k++) {
    runSeed = (runSeed ^ (0x9E3779B9 * (k + 1))) >>> 0;
    statoRun.mappa = generaMappaPiano(piano);
  }
  const ing = statoRun.mappa.stanze.find((s) => s.tipo === 'ingresso');
  entraInStanza(ing, null);
  aggiornaBottoniPiano();
  if (mostraSipario) {
    statoRun.siparioAttivo = getRaccontoAtto(piano, statoRun.ciclo);
  }
}

function entraInStanza(stanza, daLato) {
  statoRun.stanzaCorrente = stanza;
  macchieStanza = [];
  player.kbx = 0; player.kby = 0;
  if (stanza.tipo !== 'patto') stanza.visitata = true;
  statoRun.proiettili = [];
  statoRun.proiettiliNemici = [];
  statoRun.effettiSplash = [];
  statoRun.ondeEsplosione = [];
  statoRun.scambioPendente = null;
  // --- B: inizio ---
  statoRun.pannelloB = null;
  if (stanza.tipo === 'sviluppatore' && !stanza.sceltaFattaB) {
    apriPannelloSviluppatoreB(stanza);
    mostraBanner('✎ STANZA DELLO SVILUPPATORE: scegli un solo oggetto fra tutti quelli del Teatro!', 220);
  }
  // --- B: fine ---
  // --- T3: inizio ---
  AudioSys.playCampana(); // rintocco di campana a ogni ingresso in stanza (T3)
  // --- T3: fine ---
  player.targetX = null;
  player.targetY = null;
  if (daLato === 'N') { player.x = 320; player.y = ARENA.y1 + 18; }
  else if (daLato === 'S') { player.x = 320; player.y = ARENA.y2 - 18; }
  else if (daLato === 'W') { player.x = ARENA.x1 + 22; player.y = 188; }
  else if (daLato === 'E') { player.x = ARENA.x2 - 22; player.y = 188; }
  else { player.x = 260; player.y = 225; }
  // --- C: inizio --- nemici lontani dalle porte e dal punto di entrata; grazia d'ingresso
  allontanaNemiciDallePorteC(stanza, [{ x: player.x, y: player.y }]);
  statoRun.graziaIngressoC = ticksDaMs(STANZE_C.graziaIngressoMs);
  statoRun.scudoRosaC = Boolean(statoRun.medaglioneC && statoRun.medaglioneC.scudoStanza); // Benedizione di Rosa
  // --- C: fine ---
  // --- D: inizio --- lo scudo del Velo si ricarica a ogni stanza; i famigli entrano con te
  statoRun.scudoStanzaD = (statoRun.statD && statoRun.statD.scudoStanza) || 0;
  for (const f of statoRun.famigliD || []) { f.x = player.x; f.y = player.y; }
  // --- D: fine ---

  if (stanza.tipo === 'tesoro' && stanza.oggettoPiedistallo && !stanza.oggettoPiedistallo.preso) {
    const o = stanza.oggettoPiedistallo;
    mostraBanner(`${o.forteGratis ? '★ OGGETTO FORTE GRATIS' : '🎁 OGGETTO GRATIS'}: ${nomeD(o)} — ${descD(o)}`, 220); // D: effetto nascosto
  } else if (stanza.tipo === 'fucina') {
    // --- T3: inizio ---
    mostraBanner(`⚒ LA FUCINA DI MASTRO PEPPE: Risparmia i Grani (o cerca la Stanza Segreta ?) per le Reliquie da ${ECONOMIA_T3.prezzi.forte}🪙!`, 210);
    // --- T3: fine ---
  } else if (stanza.tipo === 'patto') {
    mostraBanner('😈 STANZA DEL PATTO D\'OMBRA: Cedi 1 ❤️ Maschera Massima per una Reliquia Proibita del Velo!', 230);
  } else if (stanza.tipo === 'segreta' && !stanza.pulita) {
    mostraBanner('🕵️ STANZA SEGRETA SCOPERTA! Sconfiggi i Predoni d\'Oro per raccogliere un bottino di monete!', 220);
  } else if (stanza.tipo === 'boss' && !stanza.pulita) {
    const b = stanza.nemici[0];
    const pianoNelCiclo = ((statoRun.piano - 1) % 4) + 1;
    mostraBanner(
      pianoNelCiclo === 4
        ? `♛ BOSS FINALE (${b.hp} HP): Le Mani di Marionetta scendono e diventano ${b.nome}!`
        : `💀 BOSS PIANO ${statoRun.piano} (${b.hp} HP): ${b.nome}!`,
      220
    );
  } // --- C: nessun avviso della crepa: la Stanza Segreta resta da scoprire ---
}
