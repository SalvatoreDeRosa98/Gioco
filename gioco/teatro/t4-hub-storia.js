/*
 * teatro/t4-hub-storia.js — Passo T4 della roadmap «Novità nel Teatro» (production/roadmap-teatro-novita.md):
 * hub di Piazza Dante fra una run e l'altra, dialoghi nel cartiglio con le scene di trama/storia.json,
 * Medaglione di Rosa (cade dal Gatto dei Quattro Canti, scelta restituito/negato da Tonino) e sequenza di
 * morte e risveglio (lanterne che si spengono una a una, ≤ 4 s) che riporta all'hub. Tiene conto della
 * Voce narrante (trama/decisione-narratrice-donna-luciana.md): la Voce parla all'ingresso dell'hub, si
 * rivela Donna Luciana all'ingresso del suo boss e tace per sempre dopo la sua sconfitta.
 *
 * Script classico (non modulo), caricato dopo lo script principale di teatro_marionette.html. Il Teatro è
 * una IIFE: i suoi interni arrivano da window.__teatro.interni (esposti in un blocco T4 del file principale);
 * questo file registra i ganci in window.__teatro.t4, che il file principale chiama con t4Gancio(nome, ...):
 *   avvio (menu → hub), tasto, click, logica (un tick a 60 Hz), disegna (sostituisce il frame), sopra
 *   (disegna sopra il frame), morte (le maschere sono finite), bossSconfitto (stanza boss ripulita),
 *   raccogli (un oggetto a terra di tipo 'ricordo'). Un gancio che rende true ha gestito l'evento.
 * Fasi nuove di statoRun.fase: 'hub' e 'morte'.
 *
 * Riferimenti nel motore: motore/mondo/hub.js (presenze, ingresso), motore/storia/incontri.js (scena da
 * mostrare, ripetizioni, scelta ed esito nello stesso cartiglio, scena vista solo alla chiusura),
 * motore/oggetti/ricordi.js (caduta e raccolta del ricordo), motore/storia/risveglio.js (fasi della morte).
 *
 * Flag della trama: salvati con window.__teatro.salvaFlag(flag) se il passo T3 lo espone (slot di
 * salvataggio), altrimenti in localStorage alla chiave CONFIG.chiaveFlag; letti con
 * window.__teatro.caricaFlag() se esiste, altrimenti dalla stessa chiave.
 *
 * DEVIAZIONE NOTA (da confermare con il game-designer): nel motore il ricordo in mano si perde alla morte
 * (ricordi-scelta.md regola 4). Nel Teatro l'unico ritorno all'hub è la morte (la run continua all'infinito
 * dopo ogni boss), quindi il Medaglione raccolto resta in mano fino alla scelta da Tonino, altrimenti la
 * scelta sarebbe irraggiungibile.
 */
(() => {
  'use strict';
  const T = window.__teatro;
  if (!T || !T.interni) {
    console.error('[T4] window.__teatro.interni mancante: il blocco T4 del file principale non è stato caricato.');
    return;
  }
  const I = T.interni;
  const { ctx, W, H, TAU, ARENA, statoRun, player, keys } = I;

  /* T4-DATI: inizio */
  const DATI = {
   "fonte": "generato da tools/teatro-t4-estrai.mjs: non modificare a mano",
   "scene": [
    {
     "id": "piazza-dante.risveglio",
     "tipo": "obbligatoria",
     "ordine": 10,
     "quando": {},
     "ancoraggio": "ingresso-piano:1",
     "tableau": false,
     "battute": []
    },
    {
     "id": "piazza-dante.tutorial",
     "tipo": "obbligatoria",
     "ordine": 20,
     "quando": {},
     "ancoraggio": "ingresso-piano:1",
     "tableau": false,
     "battute": []
    },
    {
     "id": "piazza-dante.targa-commemorativa",
     "tipo": "obbligatoria",
     "ordine": 30,
     "quando": {},
     "ancoraggio": "ingresso-piano:1",
     "tableau": false,
     "battute": [
      {
       "chi": "didascalia",
       "testo": "In memoria degli uomini caduti nell'adempimento del loro dovere."
      }
     ]
    },
    {
     "id": "piazza-dante.tonino-primo-incontro",
     "tipo": "obbligatoria",
     "ordine": 40,
     "quando": {},
     "ancoraggio": "hub:tonino",
     "tableau": false,
     "battute": [
      {
       "chi": "tonino",
       "testo": "Uagliò, ma che è 'sta faccia?"
      },
      {
       "chi": "didascalia",
       "testo": "Ferruccio indica la propria maschera."
      },
      {
       "chi": "tonino",
       "testo": "Ah, è proprio la tua. E che ne sapevo io?"
      },
      {
       "chi": "didascalia",
       "testo": "Gli offre una mozzarella."
      },
      {
       "chi": "tonino",
       "testo": "Mangia. Magari sotto 'sta maschera ce sta ancora qualcuno."
      }
     ]
    },
    {
     "id": "piazza-dante.bottega-di-gaetano",
     "tipo": "indizio",
     "ordine": 50,
     "quando": {},
     "ancoraggio": "hub:tonino",
     "tableau": false,
     "battute": []
    },
    {
     "id": "piazza-dante.filastrocca",
     "tipo": "indizio",
     "ordine": 60,
     "quando": {},
     "ancoraggio": "ricordo:filastrocca",
     "tableau": true,
     "battute": [
      {
       "chi": "didascalia",
       "testo": "Quando il giglio si addormenta, la luna ascolta e non si lamenta."
      }
     ]
    },
    {
     "id": "piazza-dante.gatto-dei-quattro-canti",
     "tipo": "boss",
     "ordine": 70,
     "quando": {},
     "ancoraggio": "dopo-boss:gatto-dei-quattro-canti",
     "tableau": false,
     "battute": []
    },
    {
     "id": "piazza-dante.scelta-tonino",
     "tipo": "scelta",
     "ordine": 80,
     "quando": {},
     "ancoraggio": "banchetto",
     "tableau": false,
     "battute": [
      {
       "chi": "didascalia",
       "testo": "Dopo la sconfitta del Gatto dei Quattro Canti, Ferruccio raccoglie un'anima contenente il ricordo della moglie di Tonino, Rosa."
      },
      {
       "chi": "didascalia",
       "testo": "Può restituirglielo oppure lasciarlo dimenticato."
      }
     ],
     "scelta": {
      "flag": "tonino_ricordo",
      "opzioni": [
       {
        "valore": "restituito",
        "etichetta": "Restituisci il ricordo di Rosa",
        "cosa_sacrifica": "Tonino perde la serenità del Velo: torna a piangere la moglie. Il giocatore sceglie il lutto di Tonino al posto della sua pace (principio 1: tra il ricordo e la serenità di Tonino). In cambio Tonino ricorda la lettera di Agnese."
       },
       {
        "valore": "negato",
        "etichetta": "Lascialo dimenticare",
        "cosa_sacrifica": "Tonino resta sorridente ma continua a fissare una sedia vuota senza sapere perché. Ferruccio non ottiene la lettera di Agnese (il rapporto con lei andrà ricostruito solo tramite gli altri eventi). Scegliere al posto suo è il gesto che Taddeo, più avanti, paragonerà a quello di Violante."
       }
      ]
     }
    },
    {
     "id": "piazza-dante.ricordo-negato",
     "tipo": "condizionale",
     "ordine": 90,
     "quando": {
      "tonino_ricordo": "negato"
     },
     "ancoraggio": "banchetto",
     "tableau": false,
     "battute": [
      {
       "chi": "didascalia",
       "testo": "Tonino continua a sorridere."
      },
      {
       "chi": "tonino",
       "testo": "Moglie? Io? E chi se la ricorda!"
      },
      {
       "chi": "didascalia",
       "testo": "Ride da solo, poi torna a fissare una sedia vuota accanto al banchetto."
      }
     ]
    },
    {
     "id": "piazza-dante.ricordo-restituito",
     "tipo": "condizionale",
     "ordine": 90,
     "quando": {
      "tonino_ricordo": "restituito"
     },
     "ancoraggio": "banchetto",
     "tableau": false,
     "battute": [
      {
       "chi": "didascalia",
       "testo": "Tonino riconosce un vecchio medaglione appartenuto a Rosa."
      },
      {
       "chi": "tonino",
       "testo": "Rosa..."
      },
      {
       "chi": "tonino",
       "testo": "Maronna mia. Erano anni che non dicevo il suo nome."
      },
      {
       "chi": "didascalia",
       "testo": "Comincia a piangere."
      },
      {
       "chi": "didascalia",
       "testo": "Ferruccio si avvicina."
      },
      {
       "chi": "tonino",
       "testo": "Nun fa niente, guagliò."
      },
      {
       "chi": "tonino",
       "testo": "Mi mancava pure questo."
      },
      {
       "chi": "didascalia",
       "testo": "Da quel momento Tonino mantiene la sua ironia, ma le sue battute diventano più consapevoli. Inoltre ricorda di aver custodito una vecchia lettera di Agnese."
      }
     ]
    }
   ],
   "personaggi": {
    "ferruccio": "Ferruccio",
    "tonino": "Tonino",
    "rosa": "Rosa",
    "taddeo": "Taddeo",
    "mariella": "Mariella",
    "agnese": "Agnese",
    "gaetano": "Gaetano",
    "gregorio": "Gregorio Valente, il Custode",
    "violante": "Violante Valente",
    "bianca": "Bianca Valente",
    "guardia": "Guardia della Reggia",
    "cittadino": "Cittadini di Caserta",
    "assunta": "Assunta"
   },
   "flag": {
    "tonino_ricordo": [
     "restituito",
     "negato"
    ],
    "taddeo": [
     "perdonato",
     "accusato"
    ],
    "registro": [
     "conservato",
     "bruciato"
    ],
    "agnese": [
     "risvegliata",
     "sognante"
    ],
    "gregorio": [
     "dialogo",
     "attacco"
    ],
    "violante": [
     "uccisa",
     "risparmiata"
    ],
    "lettera_agnese": [
     "vera",
     "falsa"
    ],
    "lettera_mariella": [
     "vera",
     "falsa"
    ],
    "prove": [
     "vera",
     "falsa"
    ]
   },
   "ripetizioni": {
    "npc_per_ancoraggio": {
     "banchetto": "tonino"
    },
    "npc": {
     "tonino": [
      {
       "quando": {
        "tonino_ricordo": ""
       },
       "chi": "tonino",
       "testo": "Uagliò, 'a mozzarella sta ancora qua. Nun se la mangia nisciuno."
      },
      {
       "quando": {
        "tonino_ricordo": ""
       },
       "chi": "didascalia",
       "testo": "Tonino lustra la lanterna del banchetto e ride da solo."
      },
      {
       "quando": {
        "tonino_ricordo": "restituito"
       },
       "chi": "tonino",
       "testo": "Vai, guagliò. Rosa diceva sempre che chi sta fermo s'arruggina."
      },
      {
       "quando": {
        "tonino_ricordo": "restituito"
       },
       "chi": "didascalia",
       "testo": "Tonino sistema due piatti sul banco. Uno resta vuoto."
      },
      {
       "quando": {
        "tonino_ricordo": "negato"
       },
       "chi": "tonino",
       "testo": "Sempre una bella giornata, uagliò! Pure 'sta notte."
      },
      {
       "quando": {
        "tonino_ricordo": "negato"
       },
       "chi": "didascalia",
       "testo": "Tonino ride, poi torna a fissare la sedia vuota accanto al banchetto."
      }
     ]
    }
   },
   "interfaccia": {
    "hub": {
     "notte": "Notte {n}",
     "parla": "Premi {tasto} per parlare con {nome}",
     "parti": "L'ingresso al piano {piano}: avanti per partire"
    },
    "luogoHub": "Piazza Dante",
    "incontri": {
     "continua": "Continua",
     "scegli": "Scegli",
     "conferma": "Conferma",
     "salta": "Salta",
     "ripetizione_generica": "{nome} non ha altro da dire, per stanotte.",
     "aspetta": "Aspetta: prima le ombre."
    },
    "morte": {
     "lanterne": "Le lanterne della ribalta si spengono, una a una.",
     "fili": "I fili d'oro si spezzano.",
     "maschera": "La maschera si stacca in pezzi che salgono.",
     "buio": "Il sipario cala: una nuova run ha inizio al Piano 1."
    }
   },
   "modelloHub": {
    "griglia": [
     "..........C.C",
     ".............",
     ".BB..........",
     ".............",
     ".............",
     ".............",
     "............."
    ],
    "arrivo": {
     "c": 6,
     "r": 3
    },
    "ingresso": {
     "slot": "E",
     "piano": 1
    },
    "automatiche": [
     {
      "ancoraggio": "ingresso-piano:1",
      "quando": {
       "notte": 1
      }
     }
    ],
    "presenze": [
     {
      "id": "tonino",
      "tipo": "npc",
      "personaggio": "tonino",
      "ancoraggio": "hub:tonino",
      "c": 3,
      "r": 2,
      "etichetta": "banchetto"
     },
     {
      "id": "bottega",
      "tipo": "porta",
      "c": 6,
      "r": -1,
      "aperta_se": {
       "fucina_aperta": "vera"
      },
      "etichetta": "bottega di Gaetano"
     },
     {
      "id": "mariella",
      "tipo": "finestra",
      "personaggio": "mariella",
      "c": 2,
      "r": -1,
      "accesa": true
     },
     {
      "id": "finestra-portico",
      "tipo": "finestra",
      "c": 9,
      "r": -1,
      "accesa": false
     },
     {
      "id": "taddeo",
      "tipo": "npc",
      "personaggio": "taddeo",
      "ancoraggio": "hub:taddeo",
      "c": 8,
      "r": 4,
      "quando": {
       "taddeo": "perdonato"
      }
     },
     {
      "id": "agnese",
      "tipo": "npc",
      "personaggio": "agnese",
      "ancoraggio": "hub:agnese",
      "c": 11,
      "r": 0,
      "quando": {
       "agnese": "risvegliata"
      },
      "etichetta": "portico"
     },
     {
      "id": "luna",
      "tipo": "scenografia",
      "forma": "luna",
      "c": 0.5,
      "r": -2.5
     },
     {
      "id": "filo-1",
      "tipo": "scenografia",
      "forma": "filo_oro",
      "c": 2.5,
      "r": -1.5,
      "fino_a": {
       "c": 6.5,
       "r": -1.9
      }
     },
     {
      "id": "filo-2",
      "tipo": "scenografia",
      "forma": "filo_oro",
      "c": 6.5,
      "r": -1.9,
      "fino_a": {
       "c": 9.5,
       "r": -1.5
      }
     }
    ]
   },
   "ricordo": {
    "id": "medaglione-di-rosa",
    "nome": "Medaglione di Rosa",
    "persona": "tonino",
    "flag": "tonino_ricordo",
    "scena_scelta": "piazza-dante.scelta-tonino",
    "boss": "gatto-dei-quattro-canti",
    "archetipo_boss": "gatto",
    "valore_restituzione": "restituito",
    "effetto_ceduto": {
     "scintille": {
      "base": 12,
      "min": 8,
      "max": 20
     }
    }
   },
   "narratrice": {
    "atti": {
     "1": "Cammina, Ferruccio. Il filo ti sembra spezzato, ma chi cerca la verità trova soltanto altra cenere.",
     "2": "Gli amici d'infanzia hanno il cuore di piombo. Persino il ferro della forgia si piega quando il rimorso è troppo pesante.",
     "3": "Senti il battito dei telai? Mille fili di seta si intrecciano nel buio. Uno solo regge il tuo cuore di pezza.",
     "4": "Il sipario non cala per pietà, Ferruccio. Cala perché la Commedia è finita... ed io sono l'unica che ne conosce la fine."
    },
    "rivelazione": "Credevi davvero che la storia fosse tua, mio piccolo Ferruccio? Ogni parola che udivi nel buio... era solo il mio filo che ti muoveva i passi. Recita la tua ultima scena.",
    "strappato": "[Il copione è strappato. Nessuno detta più le tue parole.]"
   }
  };
  /* T4-DATI: fine */

  /** Manopole di taratura del passo T4 (nessun numero sparso nel codice sotto). */
  const CONFIG = Object.freeze({
    chiaveFlag: 'ferruccio.teatro.flag',
    hub: Object.freeze({
      velocita: 2.0,          // px per tick in piazza (come la velocità base del Teatro)
      raggioInterazione: 46,  // px entro cui E parla con un NPC
      raggioCorpoNpc: 18,     // px: Ferruccio non attraversa gli NPC
      raggioIngresso: 26,     // px dalla porta E che fanno partire la run
      tickAlba: 50,           // dissolvenza dal buio all'ingresso dell'hub dopo il risveglio
      lampione: Object.freeze({ c: 6, r: 1 }), // il lampione che il risveglio riaccende (risveglio.json, fase buio)
    }),
    // Sequenza di morte (risveglio.json › fasi, accorciate al tetto di 4 s della roadmap T4).
    morte: Object.freeze({
      lanterne: 4,
      fasiMs: Object.freeze({ lanterne: 1600, fili: 600, maschera: 900, buio: 500 }),
      tMaxMs: 4000,
      // (bug autore «quando perdo si freeza») Rete di sicurezza a tempo reale: se la fase 'morte' dura
      // oltre watchdogMs (logica ferma, eccezione, tab in secondo piano…) il ritorno all'hub è forzato.
      watchdogMs: 6000,
      velo: 0.45,              // opacità minima del velo scuro fin dal primo frame: il palco si ferma, si vede
      titolo: 'LE MASCHERE SI SPEZZANO',
      causa: 'Caduto contro {fonte} \u2014 la Notte {notte} finisce qui.',
    }),
    ricordo: Object.freeze({
      bossTeatro: 're-gatto',          // id del Gatto dei Quattro Canti nel POOL_BOSS del Teatro
      sprite: 'medaglioneRosa',
    }),
    bossFinale: 'donna-luciana',
    cartiglio: Object.freeze({ x: 36, y: 268, w: 568, h: 84 }),
    nomeVoce: 'La Voce',
    nomeLuciana: 'Donna Luciana',
  });

  const TOT_MORTE_MS = Object.values(CONFIG.morte.fasiMs).reduce((a, b) => a + b, 0);
  if (TOT_MORTE_MS > CONFIG.morte.tMaxMs) console.error(`[T4] la sequenza di morte dura ${TOT_MORTE_MS} ms, oltre ${CONFIG.morte.tMaxMs}`);
  const ticks = (ms) => Math.max(1, Math.round(ms / I.MS_PER_TICK));

  // Sprite pixel-art del Medaglione (dono azzurro con catenella d'oro), nella palette del Teatro.
  I.SPRITE_OGGETTI[CONFIG.ricordo.sprite] = [
    '...kkkk...',
    '..ky..yk..',
    '...kyyk...',
    '..kAAAAk..',
    '.kAaaaaAk.',
    '.kAawwaAk.',
    '.kAaaaaAk.',
    '.kAaaapAk.',
    '..kAaaAk..',
    '...kAAk...',
    '....kk....',
  ];

  // ===========================================================================
  // FLAG DELLA TRAMA (stato narrativo persistente)
  // ===========================================================================
  const FLAG_VUOTI = () => ({
    tonino_ricordo: null, lettera_agnese: null, taddeo: null, agnese: null, registro: null, fucina_aperta: null,
    viste: [], morti: 0, piano_max: 1,
    medaglione_in_mano: false, rivelazione_vista: false, luciana_sconfitta: false,
  });
  function caricaFlag() {
    let dati = null;
    try {
      if (typeof T.caricaFlag === 'function') dati = T.caricaFlag();
      else dati = JSON.parse(localStorage.getItem(CONFIG.chiaveFlag) || 'null');
    } catch (err) { console.warn('[T4] flag illeggibili, si riparte puliti', err); }
    const f = Object.assign(FLAG_VUOTI(), dati && typeof dati === 'object' ? dati : {});
    if (!Array.isArray(f.viste)) f.viste = [];
    delete f.notte; // vecchi salvataggi: la notte non è un flag, la conta il file principale
    return f;
  }
  /**
   * Notte corrente: un solo contatore, quello del file principale (getNumeroNotte, localStorage
   * 'ferruccio_notte', lo stesso delle notti progressive e del menu ESC). T4 lo legge e alla morte lo
   * fa avanzare con incrementaNumeroNotte(); non ne tiene una copia nei flag.
   */
  function notteCorrente() {
    if (typeof I.getNumeroNotte === 'function') return I.getNumeroNotte();
    return statoRun.numeroNotte || 1;
  }
  function salvaFlag() {
    const copia = JSON.parse(JSON.stringify(S.flag));
    delete copia.notte;
    try {
      if (typeof T.salvaFlag === 'function') T.salvaFlag(copia);
      else localStorage.setItem(CONFIG.chiaveFlag, JSON.stringify(copia));
    } catch (err) { console.warn('[T4] salvataggio dei flag non riuscito', err); }
  }

  /** Condizione con la sintassi delle scene: '' = non deciso, '*' = deciso, altrimenti uguaglianza. */
  function valuta(quando, f) {
    for (const [k, v] of Object.entries(quando || {})) {
      const att = k === 'notte' ? notteCorrente() : f[k];
      if (v === '') { if (att !== null && att !== undefined) return false; }
      else if (v === '*') { if (att === null || att === undefined) return false; }
      else if (att !== v) return false;
    }
    return true;
  }

  const S = {
    flag: FLAG_VUOTI(),
    dialogo: null,       // { voci, idx, scelta, sel, scene, poi }
    morte: null,         // { t, totale, px, py, fonte, notte, avvioMs }
    alba: 0,             // tick rimanenti della dissolvenza dal buio
    nuoviStanotte: {},   // npc → true se ha già mostrato una scena nuova in questa notte (incontri regola 3)
    ripetIdx: {},
    rivelazioneRun: false,
    ultimoPiano: 1,
  };

  const nome = (chi) => (chi === 'voce' ? (S.flag.rivelazione_vista ? CONFIG.nomeLuciana : CONFIG.nomeVoce)
    : chi === 'luciana' ? CONFIG.nomeLuciana : DATI.personaggi[chi] || chi);
  const voce = (chi, testo) => ({ chi, testo });
  const scena = (id) => DATI.scene.find((s) => s.id === id);

  // ===========================================================================
  // CARTIGLIO (dialogo): una battuta alla volta, Spazio/E avanza, scelta con frecce/1-2
  // ===========================================================================
  function apriDialogo(voci, { scene = [], scelta = null, poi = null } = {}) {
    if (!voci.length && !scelta) { segnaViste(scene); if (poi) poi(); return; }
    S.dialogo = { voci, idx: 0, scelta, sel: 0, scene, poi, inScelta: !voci.length && Boolean(scelta), fase: statoRun.fase };
  }
  function segnaViste(ids) {
    let cambiato = false;
    for (const id of ids) if (!S.flag.viste.includes(id)) { S.flag.viste.push(id); cambiato = true; }
    if (cambiato) salvaFlag();
  }
  function avanzaDialogo() {
    const d = S.dialogo;
    if (!d) return;
    if (d.inScelta) { scegli(d.sel); return; }
    d.idx += 1;
    if (d.idx < d.voci.length) return;
    if (d.scelta) { d.inScelta = true; return; }
    chiudiDialogo();
  }
  function chiudiDialogo() {
    const d = S.dialogo;
    S.dialogo = null;
    if (!d) return;
    segnaViste(d.scene);
    if (d.poi) d.poi();
  }
  /** Decide il flag della scelta e accoda l'esito (la scena condizionale successiva) nello stesso cartiglio. */
  function scegli(i) {
    const d = S.dialogo;
    const sc = d.scelta;
    const op = sc.scelta.opzioni[i];
    if (!op) return;
    S.flag[sc.scelta.flag] = op.valore;
    if (sc.scelta.flag === DATI.ricordo.flag) {
      S.flag.medaglione_in_mano = false; // ceduto o tenuto, il ricordo non è più da consegnare
      if (op.valore === DATI.ricordo.valore_restituzione) S.flag.lettera_agnese = 'vera'; // flag derivato
    }
    salvaFlag();
    const esito = DATI.scene
      .filter((s) => s.ancoraggio === sc.ancoraggio && s.ordine > sc.ordine && s.tipo === 'condizionale' && valuta(s.quando, S.flag))
      .sort((a, b) => a.ordine - b.ordine)[0];
    d.scelta = null;
    d.inScelta = false;
    if (esito && esito.battute.length) {
      d.voci = esito.battute.map((b) => voce(b.chi, b.testo));
      d.idx = 0;
      d.scene.push(esito.id);
    } else chiudiDialogo();
  }

  // ===========================================================================
  // INCONTRI: quale scena (o ripetizione) parte a un ancoraggio
  // ===========================================================================
  function puoAprire(s) {
    if (s.scelta && s.scelta.flag === DATI.ricordo.flag) return S.flag.medaglione_in_mano; // serve il ricordo in mano
    return true;
  }
  function interagisciNpc(npc, ancoraggi) {
    const candidate = DATI.scene
      .filter((s) => ancoraggi.includes(s.ancoraggio) && !S.flag.viste.includes(s.id) && valuta(s.quando, S.flag)
        && (s.battute.length || s.scelta) && puoAprire(s))
      .sort((a, b) => a.ordine - b.ordine);
    const nonAspetta = (s) => s.tipo === 'scelta' || s.tipo === 'condizionale';
    const s = candidate.find((x) => nonAspetta(x) || !S.nuoviStanotte[npc]);
    if (s) {
      if (!nonAspetta(s)) S.nuoviStanotte[npc] = true;
      apriDialogo(s.battute.map((b) => voce(b.chi, b.testo)), { scene: [s.id], scelta: s.scelta ? s : null });
      return;
    }
    const righe = (DATI.ripetizioni.npc[npc] || []).filter((r) => valuta(r.quando, S.flag));
    if (righe.length) {
      const i = (S.ripetIdx[npc] || 0) % righe.length;
      S.ripetIdx[npc] = i + 1;
      apriDialogo([voce(righe[i].chi, righe[i].testo)]);
      return;
    }
    apriDialogo([voce('didascalia', DATI.interfaccia.incontri.ripetizione_generica.replace('{nome}', nome(npc)))]);
  }

  // ===========================================================================
  // HUB DI PIAZZA DANTE
  // ===========================================================================
  const CELLE = { c: DATI.modelloHub.griglia[0].length, r: DATI.modelloHub.griglia.length };
  const cw = (ARENA.x2 - ARENA.x1) / CELLE.c;
  const ch = (ARENA.y2 - ARENA.y1) / CELLE.r;
  const pos = (c, r) => ({ x: ARENA.x1 + (c + 0.5) * cw, y: ARENA.y1 + (r + 0.5) * ch });
  const PORTE = { N: { x: 320, y: 61 }, S: { x: 320, y: 313 }, W: { x: 59, y: 187 }, E: { x: 581, y: 187 } };
  const INGRESSO = PORTE[DATI.modelloHub.ingresso.slot];
  const BANCHI = [];
  const COLONNE = [];
  DATI.modelloHub.griglia.forEach((riga, r) => [...riga].forEach((cella, c) => {
    if (cella === 'B') BANCHI.push(pos(c, r));
    if (cella === 'C') COLONNE.push(pos(c, r));
  }));
  const RETT_BANCO = BANCHI.length ? {
    x1: Math.min(...BANCHI.map((b) => b.x)) - cw / 2, x2: Math.max(...BANCHI.map((b) => b.x)) + cw / 2,
    y1: BANCHI[0].y - ch / 2 + 4, y2: BANCHI[0].y + ch / 2 - 2,
  } : null;
  const LAMPIONE = pos(CONFIG.hub.lampione.c, CONFIG.hub.lampione.r);

  /** Presenze del modello risolte contro i flag (motore/mondo/hub.js › presenze()). */
  function presenze() {
    return DATI.modelloHub.presenze.map((p) => ({
      ...p, ...pos(p.c, p.r),
      presente: valuta(p.quando, S.flag),
      aperta: p.tipo === 'porta' ? valuta(p.aperta_se, S.flag) : undefined,
    })).filter((p) => p.presente);
  }
  function npcVicino() {
    let meglio = null, dmin = CONFIG.hub.raggioInterazione;
    for (const p of presenze()) {
      if (p.tipo !== 'npc') continue;
      const d = Math.hypot(player.x - p.x, player.y - p.y);
      if (d < dmin) { dmin = d; meglio = p; }
    }
    return meglio;
  }

  /** Entra nell'hub: dal menu ('menu') o dopo la sequenza di morte ('risveglio'). */
  function entraHub(motivo) {
    statoRun.fase = 'hub';
    statoRun.siparioAttivo = null;
    statoRun.scambioPendente = null;
    const arr = pos(DATI.modelloHub.arrivo.c, DATI.modelloHub.arrivo.r);
    player.x = arr.x; player.y = arr.y;
    player.targetX = null; player.targetY = null;
    player.invuln = 0; player.moving = false; player.kbx = 0; player.kby = 0;
    S.alba = motivo === 'risveglio' ? CONFIG.hub.tickAlba : 0;
    S.dialogo = null;
    // Scene automatiche (notte 1: risveglio, tutorial, targa all'ingresso del piano 1) e la Voce narrante.
    const voci = [];
    const sceneViste = [];
    if (S.flag.luciana_sconfitta) {
      voci.push(voce('didascalia', DATI.narratrice.strappato)); // il copione è strappato: nessuna voce
    } else {
      const atto = Math.max(1, Math.min(4, ((S.ultimoPiano - 1) % 4) + 1));
      voci.push(voce('voce', DATI.narratrice.atti[atto]));
    }
    for (const a of DATI.modelloHub.automatiche) {
      if (!valuta(a.quando, S.flag)) continue;
      for (const s of DATI.scene.filter((x) => x.ancoraggio === a.ancoraggio && !S.flag.viste.includes(x.id) && valuta(x.quando, S.flag))) {
        sceneViste.push(s.id); // le scene mute sono segnate viste subito (incontri.js › automatiche)
        for (const b of s.battute) voci.push(voce(b.chi, b.testo));
      }
    }
    apriDialogo(voci, { scene: sceneViste });
  }

  function parti() {
    S.dialogo = null;
    S.rivelazioneRun = false;
    I.nuovaRun(); // fase 'in_gioco', piano 1 con il sipario dell'Atto I
  }

  function bloccato(x, y) {
    if (x < ARENA.x1 || x > ARENA.x2 || y < ARENA.y1 || y > ARENA.y2) return true;
    if (RETT_BANCO && x > RETT_BANCO.x1 - 6 && x < RETT_BANCO.x2 + 6 && y > RETT_BANCO.y1 && y < RETT_BANCO.y2 + 8) return true;
    if (Math.hypot(x - LAMPIONE.x, y - LAMPIONE.y - 10) < 8) return true;
    for (const c of COLONNE) if (Math.hypot(x - c.x, y - c.y - 6) < 11) return true;
    for (const p of presenze()) if (p.tipo === 'npc' && Math.hypot(x - p.x, y - p.y) < CONFIG.hub.raggioCorpoNpc) return true;
    return false;
  }

  function aggiornaHub() {
    if (S.alba > 0) S.alba--;
    player.moving = false;
    if (S.dialogo) return;
    let mx = 0, my = 0;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    if (keys.KeyW || keys.ArrowUp) my -= 1;
    if (keys.KeyS || keys.ArrowDown) my += 1;
    if (!mx && !my) return;
    const l = Math.hypot(mx, my);
    const nx = player.x + (mx / l) * CONFIG.hub.velocita;
    const ny = player.y + (my / l) * CONFIG.hub.velocita;
    if (!bloccato(nx, player.y)) player.x = nx;
    if (!bloccato(player.x, ny)) player.y = ny;
    if (mx) player.flipX = mx < 0;
    player.moving = true;
    if (Math.hypot(player.x - INGRESSO.x, player.y - INGRESSO.y) < CONFIG.hub.raggioIngresso + cw / 2) parti();
  }

  function interagisciHub() {
    const p = npcVicino();
    if (!p) return;
    const ancoraggi = [p.ancoraggio];
    for (const [anc, npc] of Object.entries(DATI.ripetizioni.npc_per_ancoraggio)) if (npc === p.personaggio) ancoraggi.push(anc);
    interagisciNpc(p.personaggio, ancoraggi);
  }

  // ===========================================================================
  // MORTE E RISVEGLIO (motore/storia/risveglio.js: lanterne → fili → maschera → buio)
  // ===========================================================================
  const FASI = Object.entries(CONFIG.morte.fasiMs).map(([f, ms]) => ({ f, t: ticks(ms) }));
  function faseMorte(t) {
    let acc = 0;
    for (const fase of FASI) {
      if (t < acc + fase.t) return { f: fase.f, p: (t - acc) / fase.t };
      acc += fase.t;
    }
    return { f: 'fine', p: 1 };
  }
  function avviaMorte(fonte) {
    // Più colpi letali nello stesso tick (proiettile + contatto + bomba): la sequenza parte una volta sola.
    if (statoRun.fase === 'morte') return true;
    if (statoRun.fase !== 'in_gioco') return false;
    S.ultimoPiano = statoRun.piano;
    S.flag.piano_max = Math.max(S.flag.piano_max || 1, statoRun.piano);
    statoRun.fase = 'morte';
    statoRun.siparioAttivo = null;
    statoRun.scambioPendente = null;
    statoRun.pausa = false;       // un menu ESC aperto nello stesso istante non deve congelare la sequenza
    statoRun.banner = null;       // il banner «Sipario alzato» non copre il messaggio di morte
    statoRun.bannerTimer = 0;
    S.dialogo = null;
    S.morte = {
      t: 0, totale: FASI.reduce((a, b) => a + b.t, 0), px: player.x, py: player.y,
      fonte: String(fonte || 'le ombre').replace(/\s*\(.*?\)/g, ''), notte: statoRun.numeroNotte || 1,
      avvioMs: performance.now(),
    };
    try { salvaFlag(); } catch (err) { console.warn('[T4] salvataggio alla morte non riuscito', err); }
    return true;
  }
  function aggiornaMorte() {
    S.morte.t++;
    if (S.morte.t < S.morte.totale) return;
    concludiMorte();
  }
  /** Risveglio: una notte in più; flag e scene viste restano (una decisione presa non va perduta). */
  function concludiMorte() {
    S.morte = null;
    try {
      statoRun.numeroNotte = typeof I.incrementaNumeroNotte === 'function'
        ? I.incrementaNumeroNotte() : (statoRun.numeroNotte || 1) + 1;
      S.flag.morti = (S.flag.morti || 0) + 1;
      S.nuoviStanotte = {};
      salvaFlag();
    } finally {
      entraHub('risveglio'); // qualunque cosa accada sopra, si torna in piazza
    }
  }
  /** Watchdog a tempo reale (chiamato a ogni frame, anche se la logica è ferma). */
  function sorvegliaMorte() {
    if (statoRun.fase !== 'morte') return;
    if (!S.morte) { console.warn('[T4] fase morte senza sequenza: ritorno all\'hub'); concludiMorte(); return; }
    if (performance.now() - S.morte.avvioMs > CONFIG.morte.watchdogMs) {
      console.warn('[T4] la sequenza di morte supera', CONFIG.morte.watchdogMs, 'ms: ritorno all\'hub forzato');
      concludiMorte();
    }
  }

  function disegnaLanterna(x, y, accesa, scala = 1) {
    ctx.save();
    if (accesa) {
      const g = ctx.createRadialGradient(x, y, 1, x, y, 26 * scala);
      g.addColorStop(0, 'rgba(249, 203, 64, 0.55)');
      g.addColorStop(1, 'rgba(249, 203, 64, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 26 * scala, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(x - 1, y - 14 * scala, 2, 6 * scala);
    ctx.fillRect(x - 5 * scala, y - 8 * scala, 10 * scala, 14 * scala);
    ctx.fillStyle = accesa ? '#f9cb40' : '#2a1d14';
    ctx.fillRect(x - 3 * scala, y - 6 * scala, 6 * scala, 10 * scala);
    if (accesa) { ctx.fillStyle = '#fff3c4'; ctx.fillRect(x - 1 * scala, y - 3 * scala, 2 * scala, 4 * scala); }
    ctx.restore();
  }

  function disegnaMorte() {
    const m = S.morte;
    const { f, p } = faseMorte(m.t);
    const n = CONFIG.morte.lanterne;
    const spente = f === 'lanterne' ? Math.floor(p * (n + 0.999)) : n;
    // Il palco si scurisce con ogni lanterna spenta
    ctx.fillStyle = `rgba(4, 2, 1, ${Math.min(0.92, CONFIG.morte.velo + (spente / n) * 0.4 + (f === 'buio' ? p * 0.08 : 0) + (f === 'fine' ? 1 : 0))})`;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const x = 120 + (i * (W - 240)) / (n - 1);
      disegnaLanterna(x, 312, i >= spente, 1.0);
      if (i === spente - 1 && f === 'lanterne') { // filo di fumo della lanterna appena spenta
        ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
        for (let k = 0; k < 4; k++) ctx.fillRect(x - 1 + Math.sin(m.t * 0.3 + k) * 2, 294 - k * 6, 2, 4);
      }
    }
    // Fili d'oro che si spezzano e ricadono
    if (f === 'fili' || f === 'maschera' || f === 'buio') {
      const caduta = f === 'fili' ? p : 1;
      ctx.save();
      ctx.strokeStyle = I.FEEL.fili.colore;
      ctx.globalAlpha = (1 - caduta) * 0.9 + 0.1;
      ctx.lineWidth = 1;
      for (const lato of [-1, 1]) {
        const sx = m.px + lato * 6;
        ctx.beginPath();
        ctx.moveTo(sx + lato * 30, 20);
        ctx.lineTo(sx + lato * (16 + caduta * 10), 20 + (m.py - 60) * 0.45 - caduta * 30);
        ctx.moveTo(sx, m.py - 26 + caduta * 24);
        ctx.lineTo(sx + lato * (6 + caduta * 14), m.py - 70 + caduta * 60);
        ctx.stroke();
      }
      ctx.restore();
    }
    // La maschera si stacca in pezzi azzurri che salgono
    if (f === 'maschera' || f === 'buio') {
      const q = f === 'maschera' ? p : 1;
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * TAU;
        const x = m.px + Math.cos(a) * (4 + q * 22);
        const y = m.py - 22 - q * (40 + (k % 3) * 18) + Math.sin(a) * 4;
        ctx.fillStyle = `rgba(103, 232, 249, ${1 - q * 0.8})`;
        ctx.fillRect(Math.round(x), Math.round(y), 3, 3);
      }
    }
    // didascalia della fase (contenuti/interfaccia.json › morte); il buio tace: il risveglio porta all'hub
    if (f === 'buio' || f === 'fine') {
      ctx.fillStyle = `rgba(0, 0, 0, ${f === 'fine' ? 1 : p})`;
      ctx.fillRect(0, 0, W, H);
    }
    // Il messaggio di morte resta leggibile per tutta la sequenza, buio compreso (bug autore: «non esce
    // che sono morto»): titolo, causa e didascalia della fase (contenuti/interfaccia.json › morte).
    const entrata = Math.min(1, m.t / 12);
    ctx.save();
    ctx.globalAlpha = entrata;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 120, W, 86);
    I.drawTextFit(CONFIG.morte.titolo, W / 2, 152, 560, { size: 22, color: '#ef4444' });
    const causa = CONFIG.morte.causa.replace('{fonte}', m.fonte).replace('{notte}', String(m.notte));
    I.drawTextFit(causa, W / 2, 174, 520, { size: 10, weight: '', color: '#f5e6c8' });
    const didascalia = DATI.interfaccia.morte[f === 'fine' ? 'buio' : f];
    if (didascalia) I.drawTextFit(didascalia, W / 2, 194, 520, { size: 9, weight: '', style: 'italic', color: '#c9a679' });
    ctx.restore();
  }

  // ===========================================================================
  // RESA DELL'HUB (pixel-art del Teatro: assi, mura di mattoni, braciere, silhouette da teatro d'ombre)
  // ===========================================================================
  function disegnaCielo(t) {
    const g = ctx.createLinearGradient(0, 0, 0, 52);
    g.addColorStop(0, '#05070f');
    g.addColorStop(1, '#16131f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 52);
    // tetti di Caserta in silhouette
    ctx.fillStyle = '#0a0604';
    const tetti = [[0, 30], [60, 22], [120, 34], [200, 18], [270, 28], [380, 16], [440, 30], [520, 20], [590, 32]];
    for (let i = 0; i < tetti.length; i++) {
      const [x, y] = tetti[i];
      const x2 = i + 1 < tetti.length ? tetti[i + 1][0] : W;
      ctx.fillRect(x, y, x2 - x, 52 - y);
      ctx.fillRect(x + 8, y - 6, 4, 6); // comignolo
    }
    // la luna immobile del Velo
    const luna = DATI.modelloHub.presenze.find((p) => p.forma === 'luna');
    if (luna) {
      const lp = pos(luna.c, luna.r);
      const ly = Math.max(14, lp.y);
      const gl = ctx.createRadialGradient(lp.x, ly, 2, lp.x, ly, 26);
      gl.addColorStop(0, 'rgba(243, 223, 193, 0.5)');
      gl.addColorStop(1, 'rgba(243, 223, 193, 0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(lp.x, ly, 26, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f3dfc1';
      ctx.beginPath(); ctx.arc(lp.x, ly, 9, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c9a679';
      ctx.fillRect(lp.x - 3, ly - 2, 2, 2); ctx.fillRect(lp.x + 2, ly + 3, 3, 2);
    }
    // fili d'oro tesi fra le finestre (scenografia del modello)
    ctx.save();
    ctx.strokeStyle = I.FEEL.fili.colore;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    for (const p of DATI.modelloHub.presenze.filter((q) => q.forma === 'filo_oro')) {
      const a = pos(p.c, p.r), b = pos(p.fino_a.c, p.fino_a.r);
      const ay = Math.max(8, a.y), by = Math.max(8, b.y);
      ctx.beginPath();
      ctx.moveTo(a.x, ay);
      ctx.quadraticCurveTo((a.x + b.x) / 2, (ay + by) / 2 + 8 + Math.sin(t * 0.03) * 1.5, b.x, by);
      ctx.stroke();
    }
    ctx.restore();
  }

  function disegnaFinestra(x, y, accesa, t) {
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(x - 11, y - 14, 22, 22);
    if (accesa) {
      const g = ctx.createRadialGradient(x, y - 3, 2, x, y - 3, 30);
      g.addColorStop(0, 'rgba(234, 134, 38, 0.45)');
      g.addColorStop(1, 'rgba(234, 134, 38, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y - 3, 30, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = accesa ? (Math.floor(t / 40) % 7 === 0 ? '#ea8626' : '#f9cb40') : '#1f1510';
    ctx.fillRect(x - 9, y - 12, 18, 18);
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(x - 1, y - 12, 2, 18);
    ctx.fillRect(x - 9, y - 4, 18, 2);
    ctx.fillStyle = '#332218';
    ctx.fillRect(x - 13, y + 6, 26, 3); // davanzale
  }

  function disegnaPortaBottega(p) {
    const { x } = p;
    const y = 62;
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(x - 17, y - 22, 34, 32);
    ctx.beginPath(); ctx.arc(x, y - 22, 17, Math.PI, 0); ctx.fill();
    ctx.fillStyle = p.aperta ? '#090604' : '#5c3a1e';
    ctx.fillRect(x - 13, y - 20, 26, 28);
    ctx.beginPath(); ctx.arc(x, y - 20, 13, Math.PI, 0); ctx.fill();
    if (!p.aperta) {
      ctx.fillStyle = '#3d2614';
      for (let k = -9; k <= 9; k += 6) ctx.fillRect(x + k - 1, y - 30, 2, 38);
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(x - 15, y - 8, 30, 3); // spranga
      ctx.fillStyle = '#f9cb40';
      ctx.fillRect(x + 6, y - 2, 2, 2);
    }
    // insegna del fabbro: martello e incudine
    ctx.fillStyle = '#f9cb40';
    ctx.fillRect(x - 6, y - 46, 12, 4);
    ctx.fillRect(x - 2, y - 42, 4, 3);
  }

  function disegnaBanchetto(t) {
    if (!RETT_BANCO) return;
    const r = RETT_BANCO;
    ctx.fillStyle = 'rgba(8, 5, 3, 0.6)';
    ctx.fillRect(r.x1 + 2, r.y2, r.x2 - r.x1, 6);
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(r.x1 - 2, r.y1 - 2, r.x2 - r.x1 + 4, r.y2 - r.y1 + 4);
    ctx.fillStyle = '#7a4a22';
    ctx.fillRect(r.x1, r.y1, r.x2 - r.x1, 8);
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(r.x1, r.y1 + 8, r.x2 - r.x1, r.y2 - r.y1 - 8);
    ctx.fillStyle = '#3d2614';
    for (let x = r.x1 + 8; x < r.x2; x += 14) ctx.fillRect(x, r.y1 + 10, 2, r.y2 - r.y1 - 12);
    // mozzarelle sul banco
    for (let i = 0; i < 3; i++) {
      const mx = r.x1 + 16 + i * 14;
      ctx.fillStyle = '#0a0604'; ctx.fillRect(mx - 5, r.y1 - 5, 10, 7);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - 4, r.y1 - 4, 8, 5);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(mx - 4, r.y1, 8, 1);
    }
    // due piatti se il ricordo è restituito (uno resta vuoto)
    if (S.flag.tonino_ricordo === DATI.ricordo.valore_restituzione) {
      for (const dx of [r.x2 - 26, r.x2 - 12]) {
        ctx.fillStyle = '#0a0604'; ctx.fillRect(dx - 5, r.y1 + 1, 10, 4);
        ctx.fillStyle = '#f3dfc1'; ctx.fillRect(dx - 4, r.y1 + 2, 8, 2);
      }
    }
    disegnaLanterna(r.x1 + 6, r.y1 - 6, true, 0.9);
    // la sedia vuota di Rosa accanto al banchetto
    const sx = r.x1 - 16, sy = r.y2 - 4;
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(sx - 7, sy - 22, 14, 3);
    ctx.fillRect(sx - 7, sy - 22, 2, 24);
    ctx.fillRect(sx + 5, sy - 22, 2, 24);
    ctx.fillRect(sx - 7, sy - 8, 14, 3);
    ctx.fillStyle = '#7a4a22';
    ctx.fillRect(sx - 5, sy - 7, 10, 1);
    void t;
  }

  /** Tonino: silhouette da teatro d'ombre (berretto, grembiule bianco), si muove appena. */
  function disegnaTonino(x, y, t) {
    const bob = Math.sin(t * 0.08) * 1;
    ctx.save();
    ctx.fillStyle = 'rgba(8, 5, 3, 0.6)';
    ctx.beginPath(); ctx.ellipse(x, y + 10, 12, 4, 0, 0, TAU); ctx.fill();
    ctx.translate(Math.round(x), Math.round(y + bob));
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(-9, -20, 18, 28);   // corpo
    ctx.fillRect(-6, 8, 4, 4); ctx.fillRect(2, 8, 4, 4); // piedi
    ctx.fillRect(-7, -32, 14, 13);   // testa
    ctx.fillRect(-9, -35, 18, 5);    // berretto
    ctx.fillStyle = '#1f1510';
    ctx.fillRect(-7, -18, 14, 24);
    ctx.fillStyle = '#f3dfc1';
    ctx.fillRect(-6, -10, 12, 16);   // grembiule
    ctx.fillStyle = '#c9a679';
    ctx.fillRect(-5, -29, 10, 8);    // volto
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(-3, -27, 2, 2); ctx.fillRect(2, -27, 2, 2);
    ctx.fillRect(-3, -23, 6, 1);     // baffi
    ctx.fillStyle = '#9c4c12';
    ctx.fillRect(-8, -34, 16, 3);
    // braccio che lustra la lanterna
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(-14 + Math.round(Math.sin(t * 0.1) * 2), -14, 6, 4);
    ctx.restore();
  }

  function disegnaColonna(c) {
    ctx.fillStyle = 'rgba(8, 5, 3, 0.65)';
    ctx.beginPath(); ctx.ellipse(c.x, c.y + 8, 14, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(c.x - 9, c.y - 46, 18, 56);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(c.x - 7, c.y - 40, 14, 48);
    ctx.fillStyle = '#334155';
    ctx.fillRect(c.x + 2, c.y - 40, 5, 48);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(c.x - 10, c.y - 46, 20, 6);
    ctx.fillRect(c.x - 10, c.y + 4, 20, 5);
  }

  function disegnaLampione(t) {
    const { x, y } = LAMPIONE;
    const acceso = S.alba <= CONFIG.hub.tickAlba * 0.6;
    if (acceso) {
      const g = ctx.createRadialGradient(x, y - 30, 2, x, y + 10, 90);
      g.addColorStop(0, 'rgba(249, 203, 64, 0.30)');
      g.addColorStop(1, 'rgba(249, 203, 64, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 90, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(8, 5, 3, 0.6)';
    ctx.beginPath(); ctx.ellipse(x, y + 10, 9, 3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(x - 2, y - 30, 4, 40);
    ctx.fillRect(x - 5, y + 6, 10, 4);
    disegnaLanterna(x, y - 34, acceso, 1);
    void t;
  }

  function disegnaIngresso(t) {
    const p = INGRESSO;
    const pulse = 0.6 + 0.4 * Math.sin(t * 0.1);
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(p.x - 11, p.y - 20, 22, 40);
    ctx.fillStyle = '#f9cb40';
    ctx.fillRect(p.x - 9, p.y - 18, 18, 36);
    ctx.fillStyle = '#090604';
    ctx.fillRect(p.x - 6, p.y - 15, 12, 30);
    ctx.fillStyle = `rgba(249, 203, 64, ${(pulse * 0.6).toFixed(2)})`;
    ctx.fillRect(p.x - 6, p.y - 15, 12, 30);
    I.drawTextFit('▶', p.x - 22, p.y + 3, 14, { size: 9, color: '#f9cb40' });
  }

  function disegnaHub() {
    const t = T.tick;
    ctx.save();
    ctx.drawImage(I.getFloorTileCanvas(), 0, 0, W, H); // (T5) la cache è alla risoluzione del buffer
    disegnaCielo(t);
    // velo notturno sul selciato
    ctx.fillStyle = 'rgba(10, 14, 30, 0.28)';
    ctx.fillRect(48, 52, W - 96, H - 96);
    const pr = presenze();
    for (const p of pr) {
      if (p.tipo === 'finestra') disegnaFinestra(p.x, 60, p.accesa, t);
      if (p.tipo === 'porta') disegnaPortaBottega(p);
    }
    disegnaIngresso(t);
    // ordine di profondità per y: banchetto, colonne, lampione, NPC, Ferruccio
    const cose = [];
    if (RETT_BANCO) cose.push({ y: RETT_BANCO.y2, d: () => disegnaBanchetto(t) });
    for (const c of COLONNE) cose.push({ y: c.y + 8, d: () => disegnaColonna(c) });
    cose.push({ y: LAMPIONE.y + 10, d: () => disegnaLampione(t) });
    for (const p of pr) {
      if (p.tipo !== 'npc') continue;
      if (p.personaggio === 'tonino') cose.push({ y: p.y + 10, d: () => disegnaTonino(p.x, p.y, t) });
      else if (I.PERSONAGGI_GIOCABILI[p.personaggio]) {
        cose.push({ y: p.y + 10, d: () => I.disegnaFerruccioPittorico(ctx, p.x, p.y, { scale: 0.9, tick: t, charInfo: I.PERSONAGGI_GIOCABILI[p.personaggio], flipX: p.x > 320, sinergie: {} }) });
      }
    }
    cose.push({ y: player.y + 10, d: () => {
      I.disegnaFiliMarionetta({ x: player.x, piedi: player.y, altezza: 0, mezza: 10 });
      I.disegnaFerruccioPittorico(ctx, player.x, player.y, {
        scale: 1.0, flipX: player.flipX, tick: t, moving: player.moving, charInfo: I.getCharCorrente(), sinergie: {},
      });
    } });
    cose.sort((a, b) => a.y - b.y).forEach((c) => c.d());
    // HUD dell'hub: luogo e numero della notte, Medaglione in mano
    I.drawPillLabel(`${DATI.interfaccia.luogoHub} · ${DATI.interfaccia.hub.notte.replace('{n}', notteCorrente())}`, W - 110, 18, 200, { size: 8, color: '#f9cb40', border: '#8a5a2b' });
    disegnaIconaRicordo(W - 34, 42);
    if (!S.dialogo) {
      const v = npcVicino();
      if (v) {
        I.drawPillLabel(DATI.interfaccia.hub.parla.replace('{tasto}', 'E').replace('{nome}', nome(v.personaggio)), v.x, v.y - 44, 260, { size: 8, color: '#ffffff', border: '#f9cb40' });
      } else if (Math.hypot(player.x - INGRESSO.x, player.y - INGRESSO.y) < 90) {
        I.drawPillLabel(DATI.interfaccia.hub.parti.replace('{piano}', DATI.modelloHub.ingresso.piano), INGRESSO.x - 90, INGRESSO.y - 30, 230, { size: 7.5, color: '#f9cb40', border: '#f9cb40' });
      }
    }
    ctx.restore();
  }

  function disegnaIconaRicordo(x, y) {
    if (!S.flag.medaglione_in_mano) return;
    I.drawPixelSprite(I.SPRITE_OGGETTI[CONFIG.ricordo.sprite], x, y, 1.6);
    I.drawTextFit(DATI.ricordo.nome, x - 14, y + 4, 120, { size: 7, color: '#67e8f9', align: 'right' });
  }

  // ===========================================================================
  // RESA DEL CARTIGLIO
  // ===========================================================================
  function aCapo(testo, maxW, font) {
    ctx.save();
    ctx.font = font;
    const parole = testo.split(/\s+/);
    const righe = [];
    let riga = '';
    for (const p of parole) {
      const prova = riga ? `${riga} ${p}` : p;
      if (ctx.measureText(prova).width > maxW && riga) { righe.push(riga); riga = p; } else riga = prova;
    }
    if (riga) righe.push(riga);
    ctx.restore();
    return righe;
  }
  function disegnaCartiglio() {
    const d = S.dialogo;
    if (!d) return;
    const { x, y, w, h } = CONFIG.cartiglio;
    ctx.save();
    ctx.fillStyle = 'rgba(6, 3, 2, 0.35)';
    ctx.fillRect(0, 0, W, H);
    if (d.inScelta) { disegnaScelta(d); ctx.restore(); return; }
    const v = d.voci[d.idx];
    const didascalia = v.chi === 'didascalia';
    ctx.fillStyle = '#140c08';
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = '#5c3a1e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    // rotoli del cartiglio
    ctx.fillStyle = '#5c110b';
    ctx.fillRect(x - 8, y - 2, 8, h + 4);
    ctx.fillRect(x + w, y - 2, 8, h + 4);
    if (!didascalia) {
      const n = nome(v.chi);
      ctx.font = 'bold 9px ui-monospace, monospace';
      const nw = Math.ceil(ctx.measureText(n).width) + 16;
      ctx.fillStyle = v.chi === 'voce' || v.chi === 'luciana' ? '#3b0d2a' : '#7a1c12';
      ctx.fillRect(x + 14, y - 10, nw, 16);
      ctx.strokeStyle = '#f9cb40';
      ctx.strokeRect(x + 14, y - 10, nw, 16);
      I.drawTextFit(n, x + 14 + nw / 2, y + 2, nw - 6, { size: 9, color: '#f9cb40' });
    }
    const font = didascalia ? 'italic 9px ui-monospace, monospace' : 'bold 10px ui-monospace, monospace';
    const righe = aCapo(didascalia ? v.testo : `«${v.testo}»`, w - 40, font);
    righe.slice(0, 4).forEach((r, i) => {
      I.drawTextFit(r, x + 20, y + 22 + i * 13, w - 40, {
        size: didascalia ? 9 : 10, weight: didascalia ? '' : 'bold', style: didascalia ? 'italic' : '',
        color: didascalia ? '#c9a679' : '#f3dfc1', align: 'left',
      });
    });
    const blink = Math.floor(T.tick / 20) % 2 === 0;
    I.drawTextFit(`${blink ? '▶' : '▷'} Spazio / E`, x + w - 16, y + h - 8, 120, { size: 7.5, color: '#f9cb40', align: 'right' });
    ctx.restore();
  }
  function rettOpzione(i) {
    const { x, y, w } = CONFIG.cartiglio;
    return { x: x + 16, y: y - 96 + i * 34, w: w - 32, h: 28 };
  }
  function disegnaScelta(d) {
    const sc = d.scelta.scelta;
    const { x, y, w, h } = CONFIG.cartiglio;
    ctx.fillStyle = '#140c08';
    ctx.strokeStyle = '#f9cb40';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y - 110, w, h + 110 - 50);
    ctx.strokeRect(x, y - 110, w, h + 110 - 50);
    I.drawTextFit(DATI.interfaccia.incontri.scegli, x + w / 2, y - 98 + 0, w - 40, { size: 9, color: '#f9cb40' });
    sc.opzioni.forEach((op, i) => {
      const r = rettOpzione(i);
      const attiva = i === d.sel;
      ctx.fillStyle = attiva ? '#7a1c12' : '#241811';
      ctx.fillRect(r.x, r.y + 6, r.w, r.h);
      ctx.strokeStyle = attiva ? '#f9cb40' : '#5c3a1e';
      ctx.strokeRect(r.x, r.y + 6, r.w, r.h);
      I.drawTextFit(`${i + 1}. ${op.etichetta}`, r.x + 12, r.y + 24, r.w - 24, { size: 10, color: attiva ? '#ffffff' : '#c9a679', align: 'left' });
    });
    // (cosa_sacrifica di storia.json è una nota di design, non testo per il giocatore: non si mostra)
    I.drawTextFit(`↑↓ / 1-2 · ${DATI.interfaccia.incontri.conferma}: Spazio / E`, x + w - 16, y + h - 58, 260, { size: 7.5, color: '#f9cb40', align: 'right' });
  }

  // ===========================================================================
  // GANCI CHIAMATI DAL FILE PRINCIPALE
  // ===========================================================================
  const AVANZA = ['Space', 'KeyE', 'Enter'];
  /** Un cartiglio resta nella fase in cui è nato: cambiata la fase, si chiude senza esito. */
  function chiudiDialogoOrfano() {
    if (S.dialogo && S.dialogo.fase !== statoRun.fase) S.dialogo = null;
  }
  const t4 = {
    avvio() {
      S.flag = caricaFlag();
      S.nuoviStanotte = {};
      statoRun.pausa = false;
      statoRun.numeroNotte = notteCorrente();
      entraHub('menu');
      return true;
    },
    tasto(e) {
      // (bug autore «non è partito nell'hub») Un cartiglio rimasto aperto quando il menu ESC porta al menu
      // personaggi si mangiava Spazio/Invio/click del menu: nel menu il T4 non intercetta nulla.
      chiudiDialogoOrfano();
      if (statoRun.fase === 'menu_selezione') return false;
      // Il menu ESC dell'autore ha la precedenza: Esc lo apre/chiude (in run e nell'hub), e da aperto
      // riceve tutti i tasti. Durante la sequenza di morte niente menu.
      if (statoRun.fase === 'morte') return true;
      if (statoRun.pausa || e.code === 'Escape') return false;
      if (S.dialogo) {
        const d = S.dialogo;
        if (d.inScelta) {
          const n = d.scelta.scelta.opzioni.length;
          if (['ArrowUp', 'KeyW', 'ArrowLeft', 'KeyA'].includes(e.code)) d.sel = (d.sel - 1 + n) % n;
          else if (['ArrowDown', 'KeyS', 'ArrowRight', 'KeyD'].includes(e.code)) d.sel = (d.sel + 1) % n;
          else if (/^Digit[1-9]$/.test(e.code) && Number(e.code.slice(5)) <= n) { d.sel = Number(e.code.slice(5)) - 1; scegli(d.sel); }
          else if (AVANZA.includes(e.code)) scegli(d.sel);
        } else if (AVANZA.includes(e.code) && !e.repeat) avanzaDialogo();
        return true;
      }
      if (statoRun.fase === 'morte') return true;
      if (statoRun.fase === 'hub') {
        if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') interagisciHub();
        return true;
      }
      return false;
    },
    click(mx, my) {
      chiudiDialogoOrfano();
      if (statoRun.fase === 'menu_selezione') return false;
      if (S.dialogo) {
        const d = S.dialogo;
        if (d.inScelta) {
          d.scelta.scelta.opzioni.forEach((_, i) => {
            const r = rettOpzione(i);
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y + 6 && my <= r.y + 6 + r.h) { d.sel = i; scegli(i); }
          });
        } else avanzaDialogo();
        return true;
      }
      if (statoRun.fase === 'morte') return true;
      if (statoRun.fase === 'hub') {
        const v = npcVicino();
        if (v && Math.hypot(mx - v.x, my - v.y) < 30) interagisciHub();
        return true;
      }
      return false;
    },
    logica() {
      // Un cartiglio resta nella fase in cui è nato: se il menu ESC cambia fase (Ricomincia Notte dall'hub)
      // il dialogo lasciato a metà si chiude senza esito (nessuna scena segnata vista).
      if (S.dialogo && S.dialogo.fase !== statoRun.fase) S.dialogo = null;
      // La rivelazione di Luciana è una per run, anche per le run nuove avviate dal menu ESC.
      if (statoRun.numeroRun !== S.runCorrente) { S.runCorrente = statoRun.numeroRun; S.rivelazioneRun = false; }
      if (statoRun.fase === 'hub') { if (!statoRun.pausa) aggiornaHub(); return true; }
      if (statoRun.fase === 'morte') { if (S.morte) aggiornaMorte(); else concludiMorte(); return true; }
      if (statoRun.fase !== 'in_gioco') return false;
      if (S.dialogo) return true; // il cartiglio ferma la logica della stanza
      // La Voce si rivela: all'ingresso della stanza di Donna Luciana, una volta per run.
      const st = statoRun.stanzaCorrente;
      if (!S.rivelazioneRun && !S.flag.luciana_sconfitta && st && st.tipo === 'boss' && !st.pulita
        && st.nemici.some((n) => n.bossId === CONFIG.bossFinale && n.hp > 0) && !statoRun.siparioAttivo) {
        S.rivelazioneRun = true;
        S.flag.rivelazione_vista = true;
        salvaFlag();
        apriDialogo([voce('luciana', DATI.narratrice.rivelazione)]);
        return true;
      }
      return false;
    },
    disegna() {
      if (statoRun.fase === 'hub') { disegnaHub(); return true; }
      return false;
    },
    sopra() {
      sorvegliaMorte();
      if (statoRun.fase === 'morte' && S.morte) disegnaMorte();
      if (statoRun.fase === 'hub' && S.alba > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(S.alba / CONFIG.hub.tickAlba).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (statoRun.fase === 'in_gioco' && !statoRun.siparioAttivo) disegnaIconaRicordo(W - 34, H - 52);
      if (S.dialogo && !statoRun.pausa && (statoRun.fase === 'hub' || statoRun.fase === 'in_gioco')) disegnaCartiglio();
      if (statoRun.fase === 'hub' && statoRun.pausa && typeof I.disegnaMenuPausa === 'function') I.disegnaMenuPausa();
      return false;
    },
    morte(fonte) { return avviaMorte(fonte); },
    /** «Ricomincia notte» (menu ESC, tasto R, pulsante): la notte successiva comincia in Piazza Dante. */
    ricomincia() {
      if (statoRun.fase === 'menu_selezione' || statoRun.fase === 'morte') return false;
      statoRun.pausa = false;
      S.morte = null;
      statoRun.numeroNotte = typeof I.incrementaNumeroNotte === 'function'
        ? I.incrementaNumeroNotte() : (statoRun.numeroNotte || 1) + 1;
      S.nuoviStanotte = {};
      salvaFlag();
      entraHub('menu');
      return true;
    },
    bossSconfitto(st) {
      const b = st.nemici.find((n) => n.boss) || st.nemici[0];
      if (!b) return false;
      if (b.bossId === CONFIG.bossFinale && !S.flag.luciana_sconfitta) {
        S.flag.luciana_sconfitta = true; // da qui la Voce tace per sempre
        salvaFlag();
      }
      // Il ricordo cade se il flag è ancora nullo, non è già in mano né a terra (motore/oggetti/ricordi.js).
      if (b.bossId === CONFIG.ricordo.bossTeatro && S.flag[DATI.ricordo.flag] == null && !S.flag.medaglione_in_mano
        && !st.oggettiATerra.some((o) => o.tipo === 'ricordo')) {
        st.oggettiATerra.push({
          tipo: 'ricordo', id: DATI.ricordo.id, sprite: CONFIG.ricordo.sprite,
          x: Math.max(ARENA.x1 + 20, Math.min(ARENA.x2 - 20, b.x)), y: Math.max(ARENA.y1 + 20, Math.min(ARENA.y2 - 20, b.y + 26)),
        });
      }
      return false;
    },
    raccogli(pk) {
      if (pk.id !== DATI.ricordo.id) return false;
      S.flag.medaglione_in_mano = true;
      salvaFlag();
      try { I.AudioSys.playMoneta(); } catch (_) { /* audio facoltativo */ }
      const sc = scena(DATI.ricordo.scena_scelta);
      apriDialogo(sc && sc.battute.length ? [voce(sc.battute[0].chi, sc.battute[0].testo)] : []);
      return true;
    },
  };

  /** Sonda per la QA automatica (Playwright) e per i passi successivi. */
  const qa = {
    get flag() { return JSON.parse(JSON.stringify(S.flag)); },
    get dialogo() {
      const d = S.dialogo;
      if (!d) return null;
      if (d.inScelta) return { scelta: d.scelta.scelta.opzioni.map((o) => o.etichetta), sel: d.sel };
      const v = d.voci[d.idx];
      return { chi: v.chi, nome: v.chi === 'didascalia' ? null : nome(v.chi), testo: v.testo };
    },
    get morte() { return S.morte ? { ...faseMorte(S.morte.t), t: S.morte.t, totale: S.morte.totale, ms: TOT_MORTE_MS } : null; },
    get presenze() { return presenze().map((p) => ({ id: p.id, tipo: p.tipo, x: Math.round(p.x), y: Math.round(p.y) })); },
    get ingresso() { return { ...INGRESSO }; },
    azzeraFlag() { S.flag = FLAG_VUOTI(); salvaFlag(); },
    impostaFlag(parz) { Object.assign(S.flag, parz); salvaFlag(); },
    morteForzata() { statoRun.hpHalf = 0; return avviaMorte(); },
    /** QA del watchdog: la sequenza in corso non finirebbe mai da sola (simula una logica bloccata). */
    bloccaMorte() { if (S.morte) S.morte.totale = Number.MAX_SAFE_INTEGER; return Boolean(S.morte); },
  };

  Object.assign(window.__teatro ||= {}, { t4, t4qa: qa });
})();
