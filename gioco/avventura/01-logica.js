/*
 * avventura/01-logica.js — La logica pura dell'avventura: registro dei dati, stato, condizioni, esecuzione delle
 * azioni. Niente DOM: gira uguale nel browser (script classico, `AV` globale) e in Node (`require`).
 * Contratto dei dati e firme dell'API: ../avventura/LEGGIMI.md («Il contratto dei dati», «API del motore»).
 *
 * Il motore non conosce la storia: i file di storia/ chiamano AV.flag/personaggio/oggetto/capitolo/quadro/
 * dialogo/finale, e tutto il resto (interfaccia, esploratore dei percorsi) legge AV.dati e usa AV.corsa.
 */
/* eslint-disable no-var */
var AV = (typeof AV !== 'undefined' && AV) || {};

(function (AV) {
  'use strict';

  /** Testi di ripiego del motore (non della storia): si possono ritoccare senza toccare il codice. */
  AV.config = Object.assign({
    neutroGuarda: (p) => `${p.nome}. Niente di più.`,
    neutroCon: (p, o) => `Ferruccio avvicina ${o ? o.nome.toLowerCase() : 'l\'oggetto'} a ${p.nome.toLowerCase()}: non succede niente.`,
    neutroCombina: (a, b) => `${a ? a.nome : '?'} e ${b ? b.nome.toLowerCase() : '?'} non vanno insieme.`,
    passiMassimi: 5000, // azioni eseguite al più per ogni prossimo(): oltre, è un ciclo nei dati
  }, AV.config || {});

  const GENERI = ['flag', 'personaggio', 'oggetto', 'capitolo', 'quadro', 'dialogo', 'finale'];
  AV.dati = AV.dati || {};
  for (const g of GENERI) if (!(AV.dati[g] instanceof Map)) AV.dati[g] = new Map();
  AV.errori = AV.errori || [];

  /** Un errore nei dati: riga rossa in console, si va avanti. */
  AV.errore = function (msg) {
    AV.errori.push(msg);
    if (typeof console !== 'undefined') console.error('[avventura] ' + msg);
  };

  for (const g of GENERI) {
    AV[g] = function (voce) {
      if (!voce || typeof voce !== 'object' || typeof voce.id !== 'string') { AV.errore(`AV.${g}() senza id`); return; }
      if (AV.dati[g].has(voce.id)) AV.errore(`${g} «${voce.id}» registrato due volte: vale l'ultimo`);
      AV.dati[g].set(voce.id, voce);
    };
  }

  const lista = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
  const chiavePunto = (quadroId, puntoId) => quadroId + '/' + puntoId;
  AV.chiavePunto = chiavePunto;

  /** Il primo quadro del capitolo con l'ordine più basso (o il primo registrato). */
  AV.quadroIniziale = function () {
    const capitoli = [...AV.dati.capitolo.values()].sort((a, b) => a.ordine - b.ordine);
    for (const C of capitoli) for (const Q of AV.dati.quadro.values()) if (Q.capitolo === C.id) return Q.id;
    const primo = AV.dati.quadro.keys().next();
    return primo.done ? '' : primo.value;
  };

  /** Il primo quadro di un capitolo (per «Capitoli» quando non c'è uno stato salvato all'ingresso). */
  AV.primoQuadroDel = function (capitoloId) {
    for (const Q of AV.dati.quadro.values()) if (Q.capitolo === capitoloId) return Q.id;
    return '';
  };

  /** Stato nuovo: solo dati semplici (va in JSON nel salvataggio). */
  AV.nuovoStato = function (quadro) {
    return { quadro: quadro || '', flag: {}, inventario: [], visti: {}, pose: {}, nascosti: {}, diario: [], obiettivo: '',
      capitoli: [], temiFatti: {} };
  };

  /** Rimette in forma uno stato letto da un salvataggio (campi mancanti → vuoti). */
  AV.ripara = function (s) {
    const n = AV.nuovoStato();
    if (!s || typeof s !== 'object') return n;
    for (const k of Object.keys(n)) if (s[k] !== undefined && typeof s[k] === typeof n[k] && Array.isArray(s[k]) === Array.isArray(n[k])) n[k] = s[k];
    return n;
  };

  AV.copia = (s) => JSON.parse(JSON.stringify(s));

  // ---------------------------------------------------------------- condizioni

  /** Vero se la condizione vale nello stato (undefined = sempre vera). Vedi LEGGIMI «Condizioni». */
  AV.valuta = function (c, stato) {
    if (c === undefined || c === null) return true;
    if (typeof c !== 'object' || Array.isArray(c)) { AV.errore('condizione non è un oggetto: ' + JSON.stringify(c)); return false; }
    for (const [k, v] of Object.entries(c.flag || {})) {
      const cur = stato.flag[k] || '';
      const ok = lista(v).some((x) => (x === '' ? cur === '' : x === '*' ? cur !== '' : cur === x));
      if (!ok) return false;
    }
    for (const o of lista(c.ha)) if (!stato.inventario.includes(o)) return false;
    for (const o of lista(c.nonHa)) if (stato.inventario.includes(o)) return false;
    for (const k of lista(c.visto)) if (!stato.visti[k]) return false;
    for (const k of lista(c.nonVisto)) if (stato.visti[k]) return false;
    if (c.tutti !== undefined && !lista(c.tutti).every((s) => AV.valuta(s, stato))) return false;
    if (c.uno !== undefined && !lista(c.uno).some((s) => AV.valuta(s, stato))) return false;
    if (c.non !== undefined && AV.valuta(c.non, stato)) return false;
    return true;
  };

  /** Quante chiavi ha una condizione (per scegliere il finale più preciso). */
  function peso(c) {
    if (!c || typeof c !== 'object') return 0;
    let n = 0;
    for (const k of Object.keys(c)) {
      if (k === 'flag') n += Object.keys(c.flag || {}).length;
      else if (k === 'tutti' || k === 'uno') n += lista(c[k]).reduce((a, s) => a + peso(s), 0);
      else if (k === 'non') n += peso(c.non);
      else n += lista(c[k]).length;
    }
    return n;
  }

  // ---------------------------------------------------------------- esecuzione delle azioni

  /**
   * Esegue una lista di azioni sullo stato. Rende { prossimo(risposta) → evento | null, stato }.
   * Le azioni di stato si applicano da sé; per quelle dell'interfaccia prossimo() rende un evento e si ferma:
   *   {tipo:'dice',chi,testo} {tipo:'pensa',testo} {tipo:'scelta',voci:[{indice,testo}]} (riprende con prossimo(indice))
   *   {tipo:'vai',quadro,da,nuovoCapitolo} (al prossimo() si esegue l'«entrata» del quadro nuovo, poi il resto)
   *   {tipo:'dialogo',id} {tipo:'effetto',nome} {tipo:'suono',nome} {tipo:'attendi',ms} {tipo:'capitolo',id}
   *   {tipo:'finale',id}; alla fine rende null (e da lì in poi sempre null).
   * `contesto` è facoltativo: { quadro } se le azioni di posa/mostra/nascondi riguardano un quadro diverso dal corrente.
   */
  AV.corsa = function (azioni, stato, contesto) {
    const pila = [{ azioni: Array.isArray(azioni) ? azioni : [], i: 0 }];
    if (!Array.isArray(azioni) && azioni !== undefined) AV.errore('le azioni devono essere un array');
    let attesa = null; // la scelta che aspetta una risposta: { voci }
    let entrataDa = null; // il quadro in cui si è appena entrati
    let finita = false;
    const quadroDi = () => (contesto && contesto.quadro) || stato.quadro;

    function spingi(arr) { if (Array.isArray(arr) && arr.length) pila.push({ azioni: arr, i: 0 }); }

    function prossimo(risposta) {
      if (finita) return null;
      if (attesa) {
        const voci = attesa.voci; attesa = null;
        let v = voci.find((x) => x.indice === risposta);
        if (!v) { AV.errore(`risposta «${risposta}» non è fra le voci della scelta: prendo la prima`); v = voci[0]; }
        spingi(v.voce.fai);
      }
      if (entrataDa) {
        const Q = AV.dati.quadro.get(entrataDa); entrataDa = null;
        if (Q) spingi(Q.entrata);
      }
      for (let passi = 0; passi < AV.config.passiMassimi; passi++) {
        const cima = pila[pila.length - 1];
        if (!cima) { finita = true; return null; }
        if (cima.i >= cima.azioni.length) { pila.pop(); continue; }
        const a = cima.azioni[cima.i++];
        const ev = esegui(a);
        if (ev) return ev;
      }
      AV.errore('troppe azioni di fila: c\'è un ciclo nei dati? interrompo');
      finita = true;
      return null;
    }

    function esegui(a) {
      if (!Array.isArray(a) || typeof a[0] !== 'string') { AV.errore('azione non valida: ' + JSON.stringify(a)); return null; }
      const [nome, x, y, z] = a;
      switch (nome) {
        case 'dice': return { tipo: 'dice', chi: x, testo: String(y) };
        case 'pensa': return { tipo: 'pensa', testo: String(x) };
        case 'flag': {
          const F = AV.dati.flag.get(x);
          if (!F) AV.errore(`flag «${x}» non dichiarato`);
          else if (!(F.valori || []).includes(y)) AV.errore(`«${y}» non è un valore di «${x}»`);
          stato.flag[x] = y; return null;
        }
        case 'segna': stato.visti[x] = true; return null;
        case 'prendi':
          if (!AV.dati.oggetto.has(x)) AV.errore(`oggetto «${x}» non esiste`);
          if (!stato.inventario.includes(x)) stato.inventario.push(x);
          return null;
        case 'togli': stato.inventario = stato.inventario.filter((o) => o !== x); return null;
        case 'posa': stato.pose[chiavePunto(quadroDi(), x)] = y; return null;
        case 'mostra': stato.nascosti[chiavePunto(quadroDi(), x)] = false; return null;
        case 'nascondi': stato.nascosti[chiavePunto(quadroDi(), x)] = true; return null;
        case 'diario': if (!stato.diario.includes(x)) stato.diario.push(x); return null;
        case 'obiettivo': stato.obiettivo = x; return null;
        case 'se': spingi(AV.valuta(x, stato) ? y : z); return null;
        case 'unaVolta':
          if (!stato.visti[x]) { stato.visti[x] = true; spingi(y); } else spingi(z);
          return null;
        case 'scelta': {
          const voci = (Array.isArray(x) ? x : []).map((voce, indice) => ({ indice, voce })).filter((v) => v.voce && AV.valuta(v.voce.se, stato));
          if (!voci.length) { AV.errore('scelta senza voci disponibili: la salto'); return null; }
          attesa = { voci };
          return { tipo: 'scelta', voci: voci.map((v) => ({ indice: v.indice, testo: v.voce.testo })) };
        }
        case 'vai': {
          const Q = AV.dati.quadro.get(x);
          if (!Q) { AV.errore(`quadro «${x}» non esiste: resto qui`); return null; }
          const da = stato.quadro;
          stato.quadro = x;
          let nuovoCapitolo = '';
          if (Q.capitolo && !stato.capitoli.includes(Q.capitolo)) { stato.capitoli.push(Q.capitolo); nuovoCapitolo = Q.capitolo; }
          entrataDa = x;
          return { tipo: 'vai', quadro: x, da, nuovoCapitolo };
        }
        case 'dialogo':
          if (!AV.dati.dialogo.has(x)) { AV.errore(`dialogo «${x}» non esiste`); return null; }
          return { tipo: 'dialogo', id: x };
        case 'effetto': return { tipo: 'effetto', nome: x };
        case 'suono': return { tipo: 'suono', nome: x };
        case 'attendi': return { tipo: 'attendi', ms: Number(x) || 0 };
        case 'capitolo':
          if (!AV.dati.capitolo.has(x)) { AV.errore(`capitolo «${x}» non esiste`); return null; }
          if (!stato.capitoli.includes(x)) stato.capitoli.push(x);
          return { tipo: 'capitolo', id: x };
        case 'finale': {
          const id = x !== undefined ? x : AV.finalePer(stato);
          if (id && !AV.dati.finale.has(id)) { AV.errore(`finale «${id}» non esiste`); return null; }
          return { tipo: 'finale', id: id || null };
        }
        default: AV.errore(`azione «${nome}» sconosciuta: la salto`); return null;
      }
    }

    return { prossimo, stato };
  };

  /** Esegue tutto senza interfaccia: le scelte prendono `risposte` in ordine (o la prima voce). Rende gli eventi. */
  AV.esegui = function (azioni, stato, risposte) {
    const c = AV.corsa(azioni, stato); const eventi = []; const r = (risposte || []).slice();
    let ev = c.prossimo();
    while (ev) {
      eventi.push(ev);
      ev = c.prossimo(ev.tipo === 'scelta' ? (r.length ? r.shift() : ev.voci[0].indice) : undefined);
    }
    return eventi;
  };

  // ---------------------------------------------------------------- quadri e punti

  const quadroDa = (q) => (typeof q === 'string' ? AV.dati.quadro.get(q) : q);

  /**
   * I punti che si vedono nel quadro: copie dei punti con `attivo` (la loro `se` vale) e `posa`.
   * Un punto con `se` falso si vede (inattivo) solo se ha `chiuso`; un punto nascosto con ['nascondi'] non si vede.
   */
  AV.puntiDelQuadro = function (quadro, stato) {
    const Q = quadroDa(quadro); if (!Q) return [];
    const fuori = [];
    for (const p of Q.punti || []) {
      if (!p || typeof p.id !== 'string') continue;
      const k = chiavePunto(Q.id, p.id);
      if (stato.nascosti[k] === true) continue;
      const attivo = AV.valuta(p.se, stato);
      if (!attivo && !p.chiuso) continue;
      fuori.push(Object.assign({}, p, { attivo, posa: stato.pose[k] !== undefined ? stato.pose[k] : (p.posa || 0) }));
    }
    return fuori;
  };

  /**
   * Le azioni di un punto per un verbo ('usa' | 'guarda') e l'oggetto in mano (id o '').
   * Punto chiuso: guarda → il suo guarda (se c'è) o chiuso; usa/con → chiuso.
   * Punto attivo: con oggetto → con[oggetto] | con['*'] | riga neutra; guarda → guarda | riga neutra;
   * usa → usa (+ ['vai', uscita] se è un'uscita) | guarda | riga neutra.
   */
  AV.azioniDelPunto = function (quadro, punto, verbo, oggettoInMano, stato) {
    const Q = quadroDa(quadro);
    const p = typeof punto === 'string' ? ((Q && Q.punti) || []).find((x) => x.id === punto) : punto;
    if (!p) { AV.errore(`punto «${punto}» non c'è`); return []; }
    const attivo = AV.valuta(p.se, stato);
    if (!attivo) {
      if (verbo === 'guarda' && !oggettoInMano && p.guarda) return p.guarda;
      return p.chiuso || [];
    }
    if (oggettoInMano) {
      const con = p.con || {};
      return con[oggettoInMano] || con['*'] || [['pensa', AV.config.neutroCon(p, AV.dati.oggetto.get(oggettoInMano))]];
    }
    if (verbo === 'guarda') return p.guarda || [['pensa', AV.config.neutroGuarda(p)]];
    if (p.uscita) return (p.usa || []).concat([['vai', p.uscita]]);
    return p.usa || p.guarda || [['pensa', AV.config.neutroGuarda(p)]];
  };

  // ---------------------------------------------------------------- oggetti

  /** Guardare un oggetto dell'inventario: il suo `guarda`, o la descrizione. */
  AV.azioniDellOggetto = function (oggettoId) {
    const O = AV.dati.oggetto.get(oggettoId);
    if (!O) { AV.errore(`oggetto «${oggettoId}» non esiste`); return []; }
    return O.guarda || [['pensa', O.descrizione || O.nome]];
  };

  /** Un oggetto su un altro: combina[b] di a, o combina[a] di b, o una riga neutra. */
  AV.azioniCombina = function (a, b) {
    const A = AV.dati.oggetto.get(a), B = AV.dati.oggetto.get(b);
    return (A && A.combina && A.combina[b]) || (B && B.combina && B.combina[a]) || [['pensa', AV.config.neutroCombina(A, B)]];
  };

  // ---------------------------------------------------------------- dialoghi

  const chiaveDialogo = (id) => 'dialogo:' + id;
  const chiaveTema = (dlg, tema) => dlg + '/' + tema;

  /** Le azioni con cui si apre un dialogo: `inizio` la prima volta (e lo segna), poi `saluto`. */
  AV.aperturaDialogo = function (dialogo, stato) {
    const D = typeof dialogo === 'string' ? AV.dati.dialogo.get(dialogo) : dialogo;
    if (!D) return [];
    const k = chiaveDialogo(D.id);
    if (!stato.visti[k]) { stato.visti[k] = true; return D.inizio || D.saluto || []; }
    return D.saluto || [];
  };

  /** I temi che si possono scegliere ora: `se` vale e, se `unaVolta`, non già fatti. */
  AV.temiDelDialogo = function (dialogo, stato) {
    const D = typeof dialogo === 'string' ? AV.dati.dialogo.get(dialogo) : dialogo;
    if (!D) return [];
    return (D.temi || []).filter((t) => t && AV.valuta(t.se, stato) && !(t.unaVolta && stato.temiFatti[chiaveTema(D.id, t.id)]));
  };

  /** Le azioni di un tema; lo segna fatto (stato.temiFatti['dialogo/tema'] = true). */
  AV.azioniDelTema = function (dialogo, tema, stato) {
    const D = typeof dialogo === 'string' ? AV.dati.dialogo.get(dialogo) : dialogo;
    if (!D) return [];
    const T = typeof tema === 'string' ? (D.temi || []).find((t) => t.id === tema) : tema;
    if (!T) { AV.errore(`tema «${tema}» non c'è nel dialogo «${D.id}»`); return []; }
    stato.temiFatti[chiaveTema(D.id, T.id)] = true;
    return T.fai || [];
  };

  // ---------------------------------------------------------------- finali

  /** Il finale la cui `se` vale (se più d'uno, quello con la condizione più precisa); '' se nessuno. */
  AV.finalePer = function (stato) {
    let meglio = '', pesoMeglio = -1;
    for (const F of AV.dati.finale.values()) {
      if (!AV.valuta(F.se, stato)) continue;
      const p = peso(F.se);
      if (p > pesoMeglio) { meglio = F.id; pesoMeglio = p; }
    }
    return meglio;
  };

  /** Le decisioni prese (flag con `nome` e un valore): [{ id, nome, valore }]. Per il Diario. */
  AV.decisioniPrese = function (stato) {
    const fuori = [];
    for (const F of AV.dati.flag.values()) if (F.nome && stato.flag[F.id]) fuori.push({ id: F.id, nome: F.nome, valore: stato.flag[F.id] });
    return fuori;
  };
})(AV);

if (typeof module !== 'undefined') module.exports = AV;
