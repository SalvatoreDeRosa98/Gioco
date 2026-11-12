#!/usr/bin/env node
/**
 * tools/elenco-testi-teatro.js — tira fuori dal gioco i testi nuovi che l'autore deve ancora approvare e li scrive
 * in production/testi-da-approvare.md, divisi per parte. I testi vengono letti dalle tabelle vere del gioco
 * (TESTI_D1, TRIONFI_D3, CONSIGLI_E6…) aprendo la pagina con Playwright: niente copie a mano.
 * Le voci che sono funzioni (testi con un numero dentro) vengono chiamate con «N» al posto dei numeri.
 * Uso: node tools/elenco-testi-teatro.js [file html] [file di uscita]
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const RADICE = path.resolve(__dirname, '..');
const file = path.resolve(process.argv[2] || path.join(RADICE, 'gioco', 'teatro_marionette.html'));
const uscita = path.resolve(process.argv[3] || path.join(RADICE, 'production', 'testi-da-approvare.md'));

/** Le parti, con le tabelle del gioco da cui leggere e i testi che stanno fuori dalle tabelle. */
const PARTI = [
  { titolo: 'Scontro col Grande Burattinaio', dove: 'gioco/teatro/d1-burattinaio.js', tabelle: ['TESTI_D1'] },
  { titolo: 'Personaggi con stili diversi', dove: 'gioco/teatro/d2-personaggi.js (nome e titolo dell\'Ombra in 00-config.js)',
    tabelle: ['TESTI_D2'], espressioni: [
      ['Nome dell\'Ombra', 'PERSONAGGI_GIOCABILI.ombra.nome'], ['Titolo dell\'Ombra', 'PERSONAGGI_GIOCABILI.ombra.titolo'],
      ['Scheda di Ferruccio', 'schedaD2("ferruccio")'], ['Scheda di Agnese', 'schedaD2("agnese")'],
      ['Scheda di Taddeo', 'schedaD2("taddeo")'], ['Scheda dell\'Ombra', 'schedaD2("ombra")'] ] },
  { titolo: 'Registro di Scena e trionfi', dove: 'gioco/teatro/d3-registro-scena.js',
    tabelle: ['TESTI_D3', 'COMPARSE_D3', 'PRIMI_ATTORI_D3', 'TRIONFI_D3'] },
  { titolo: 'Camerini, terna della Smorfia, Buca dell\'Orchestra', dove: 'gioco/teatro/d4-stanze-teatro.js',
    tabelle: ['TESTI_D4', 'SMORFIA_D4', 'SOSTITUZIONI_D4'] },
  { titolo: 'Cambio di scena e botole', dove: 'gioco/teatro/d5-cambio-scena.js',
    fissi: ['QUADRO I', 'CAMBIO DI SCENA', 'QUADRO II', 'Fine del secondo quadro! Il pubblico ringrazia: premio doppio.'] },
  { titolo: 'Acquedotto Carolino', dove: 'gioco/teatro/d6-acquedotto.js',
    tabelle: ['TESTI_D6', 'QUARTIERE_D6', 'NEMICI_D6', 'SCHEDA_D6'] },
  { titolo: 'Rifiniture (Ragno della Seta, scritte a tocco)', dove: 'gioco/teatro/d7-rifiniture.js, b7-stanze.js',
    tabelle: ['TOCCO_D7'], fissi: ['Ragno della Seta', '🕷 Dal vaso di Capodimonte salta fuori un Ragno della Seta, arrabbiato!'] },
  { titolo: 'Riprendi la notte, mira assistita, conto della notte', dove: 'gioco/teatro/e6-assistenza.js',
    tabelle: ['TESTI_E6', 'CONSIGLI_E6'] },
  { titolo: 'Qualità automatica', dove: 'gioco/teatro/e4-prestazioni.js', tabelle: ['RIGA_E4'] },
  { titolo: 'Ultime correzioni (cestino degli slot, temi dell\'Acquedotto)', dove: 'gioco/teatro/t3-economia-salvataggi.js, d6-acquedotto.js, d7-rifiniture.js',
    fissi: ['Cancellare questo salvataggio?', 'Il salvataggio si perde per sempre.', 'Sì', 'No',
      'Tocca uno slot per sceglierlo, il cestino per cancellarlo',
      'Lo Stormo dei Rondoni', '🪶 LO STORMO DEI RONDONI: sotto gli archi si alza tutto il nido di latta. Chi lo abbatte trova qualcosa in più.',
      'I Fontanieri del Condotto', '🗡 I FONTANIERI DEL CONDOTTO: tre ombre fra le chiuse. Chi le stana trova qualcosa in più.'] },
];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('file://' + file);
  await p.waitForTimeout(600);
  const dati = await p.evaluate((PARTI) => {
    /* eslint-disable no-eval */
    const èTesto = (s) => typeof s === 'string' && s.length >= 3 && /[A-Za-zÀ-ÿ]/.test(s)
      && !/^#[0-9a-f]{3,8}$/i.test(s) && !/^rgba?\(/.test(s) && !/^[a-z0-9_\-./]+$/.test(s) && !/^(Key|Arrow|Digit|Shift|Space)[A-Za-z0-9]*$/.test(s);
    const raccogli = (v, via, out, visti) => {
      if (v === null || v === undefined) return;
      if (typeof v === 'string') { if (èTesto(v)) out.push([via, v]); return; }
      if (typeof v === 'function') {
        try { const r = v('N', 'N', 'N', 'N'); raccogli(r, via + '(N)', out, visti); } catch (_) { /* vuole argomenti veri */ }
        return;
      }
      if (typeof v !== 'object' || visti.has(v)) return;
      visti.add(v);
      if (v instanceof Map) { let i = 0; for (const [, val] of v) raccogli(val, `${via}[${i++}]`, out, visti); return; }
      if (Array.isArray(v)) { v.forEach((x, i) => raccogli(x, `${via}[${i}]`, out, visti)); return; }
      for (const k of Object.keys(v)) raccogli(v[k], via ? `${via}.${k}` : k, out, visti);
    };
    return PARTI.map((parte) => {
      const testi = [];
      for (const nome of parte.tabelle || []) {
        let tabella; try { tabella = (0, eval)(nome); } catch (_) { testi.push([nome, '(tabella non trovata nel gioco)']); continue; }
        raccogli(tabella, nome, testi, new Set());
      }
      for (const [etichetta, espressione] of parte.espressioni || []) {
        try { raccogli((0, eval)(espressione), etichetta, testi, new Set()); } catch (_) { testi.push([etichetta, '(non trovato nel gioco)']); }
      }
      return { titolo: parte.titolo, dove: parte.dove, testi, fissi: parte.fissi || [] };
    });
  }, PARTI);
  await b.close();

  const righe = [
    '# Testi nuovi da approvare — seconda ondata e migliorie',
    '',
    `Generato da \`tools/elenco-testi-teatro.js\` il ${new Date().toISOString().slice(0, 10)}: i testi sono letti dalle tabelle del gioco, quindi sono`,
    'quelli che il giocatore vede. Dove compare **N** il gioco mette un numero. Per cambiare un testo basta dirlo',
    '(«nel Burattinaio la battuta dell\'atto II diventa …»): si corregge nella tabella indicata e l\'elenco si rigenera.',
    'Per approvare tutto com\'è basta un «va bene».',
    '',
    'Altri testi della prima ondata ancora da approvare stanno nei loro documenti: `production/finali-teatro.md`',
    '(finali, voci segnate [nuovo]), `production/oggetti-200.md` (nomi e descrizioni degli oggetti), i nomi dei boss',
    'e delle trasformazioni in `gioco/teatro/b6-boss.js` e `b4-trasformazioni.js`, le battute di Tonino della',
    'partenza segreta (`TESTI_C1`), le esclamazioni del pubblico (`b1-pubblico.js`) e le scritte a tocco (`TESTI_C2`).',
  ];
  let totale = 0;
  for (const parte of dati) {
    const visti = new Set();
    const voci = [];
    for (const [via, testo] of parte.testi) {
      const pulito = testo.replace(/\s+/g, ' ').trim();
      if (visti.has(pulito)) continue;
      visti.add(pulito);
      voci.push(`- ${pulito}  \n  <sub>${via}</sub>`);
    }
    for (const testo of parte.fissi) if (!visti.has(testo)) { visti.add(testo); voci.push(`- ${testo}`); }
    totale += voci.length;
    righe.push('', `## ${parte.titolo} (${voci.length})`, '', `Dove: \`${parte.dove}\``, '', ...voci);
  }
  fs.writeFileSync(uscita, righe.join('\n') + '\n');
  console.log(`scritto ${path.relative(RADICE, uscita)}: ${totale} testi in ${dati.length} parti`);
})();
