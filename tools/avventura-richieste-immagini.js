#!/usr/bin/env node
/*
 * tools/avventura-richieste-immagini.js — scrive il FILE PER GEMINI coi disegni che mancano all'avventura:
 *   production/arte/richieste-gemini-avventura.md      le istruzioni (stile, regole, un blocco per ogni disegno)
 *   production/arte/guide-avventura/<nome>.jpg         con --guide: lo schema di composizione di ogni fondale
 *                                                      (il luogo com'è disegnato oggi dal codice, 1280×720, senza
 *                                                      personaggi né interfaccia), reso con Playwright.
 * Tutto viene dai dati della storia: i luoghi (`fondale.immagine`), i punti sensibili con le loro posizioni, le
 * descrizioni nei blocchi «IMMAGINI DA FAR DISEGNARE» in fondo ai file di storia, i personaggi e gli oggetti.
 * Per ogni punto dice se va DIPINTO nel fondale (scenografia ferma: `AV.puntoFisso`) o se lo mette il gioco.
 * Rilanciare quando cambiano i quadri o arrivano immagini: i disegni già fatti sono segnati ✅.
 * Uso: node tools/avventura-richieste-immagini.js [--guide]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RADICE = path.resolve(__dirname, '..');
const GIOCO = path.join(RADICE, 'gioco');
const STORIA = path.join(GIOCO, 'avventura', 'storia');
const ASSETS = path.join(GIOCO, 'assets');
const USCITA = path.join(RADICE, 'production', 'arte', 'richieste-gemini-avventura.md');
const GUIDE = path.join(RADICE, 'production', 'arte', 'guide-avventura');

// ---------------------------------------------------------------- i dati (motore vero + storia)
const AV = require(path.join(GIOCO, 'avventura', '01-logica.js'));
const fileStoria = fs.readdirSync(STORIA).filter((n) => n.endsWith('.js')).sort();
for (const n of fileStoria) vm.runInNewContext(fs.readFileSync(path.join(STORIA, n), 'utf8'), { AV, console }, { filename: n });

// descrizioni dai commenti dei capitoli: dentro il blocco «IMMAGINI DA FAR DISEGNARE» ogni voce comincia con
// «[- ][avventura/]nome[.png]» (con «avventura/» o «.png») e continua nelle righe rientrate che seguono
const descr = {};
for (const f of fileStoria) {
  let dentro = false; let cor = null;
  for (const r of fs.readFileSync(path.join(STORIA, f), 'utf8').split('\n')) {
    if (/IMMAGINI DA FAR DISEGNARE/.test(r)) { dentro = true; cor = null; continue; }
    if (!dentro) continue;
    if (/\*\//.test(r)) { dentro = false; cor = null; continue; }
    const m = /^\s*\*\s+(?:-\s+)?`?(avventura\/[a-z0-9-]+(?:\.png)?|[a-z0-9-]+\.png)`?\s*[.:—–-]*\s*(.*)$/.exec(r);
    if (m) { cor = 'avventura/' + m[1].replace(/^avventura\//, '').replace(/\.png$/, ''); descr[cor] = m[2].trim(); continue; }
    const seg = /^\s*\*\s{2,}(\S.*)$/.exec(r);
    if (cor && seg) descr[cor] += ' ' + seg[1].trim(); else cor = null;
  }
}

// ---------------------------------------------------------------- parole
const LUCE = {
  notte: 'notte: cielo blu-viola, luna piena ferma, lanterne e finestre calde',
  interno: 'interno buio: nessun cielo, luce calda di lanterna o di brace che viene da un punto solo',
  velo: 'sotto il Velo: gli stessi colori ma spenti e grigio-azzurri, foschia bassa, fili d\'oro che scendono dall\'alto',
  alba: 'giorno appena nato: cielo azzurro chiaro, luce calda e piena, colori vivi (sono i soli quadri di giorno)',
};
/** Gli oggetti di scena dell'autore che ridisegnano lo stesso elemento: da rifare IDENTICI (senza il gancio in cima). */
const ARREDI = {
  lampione: 'scena/ostacolo-lampione.png', albero: 'scena/ostacolo-albero.png', statua: 'scena/ostacolo-statua.png',
  telaio: 'scena/ostacolo-telaio.png', colonna: 'scena/ostacolo-colonna.png', siepe: 'scena/ostacolo-aiuola.png',
  fontana: 'scena/ostacolo-fontanella.png',
};
const CHI = {
  rosa: 'Rosa, la moglie di Tonino: popolana sui trent\'anni, capelli raccolti, scialle chiaro, grembiule. È un ricordo: un po\' luminosa.',
  mariella: 'Mariella, alla finestra: giovane donna, scialle lilla, capelli sciolti, un sorriso assente (è sotto il Velo).',
  gaetano: 'Gaetano, il fabbro, padre di Ferruccio: anziano e robusto, grembiule di cuoio, maniche arrotolate, baffi grigi, martello in mano.',
  bianca: 'Bianca, la bambina di Donna Luciana, otto anni: camicia da notte bianca con un giglio ricamato, capelli chiari, scalza.',
  cittadino: 'Un cittadino di Caserta in abito da festa del 1845: giacca corta, panciotto, cappello in mano; dorme in piedi sorridendo.',
  peppe: 'Peppe, il giardiniere della Villa: vecchio magro, cappello di paglia, gilè verde, rastrello.',
  nunzia: 'Nunzia, tessitrice di San Leucio: mezza età, fazzoletto in testa, grembiule, la spola in mano.',
};
const pc = (v, tot) => Math.round((v / tot) * 100);
function dove(p) {
  const cx = (p.x + p.w / 2) / 640, cy = (p.y + p.h / 2) / 360;
  const o = cx < 0.34 ? 'a sinistra' : cx < 0.67 ? 'al centro' : 'a destra';
  const v = cy < 0.36 ? 'in alto' : cy < 0.62 ? 'a mezza altezza' : 'in basso';
  return `${v} ${o} (da ${pc(p.x, 640)}% a ${pc(p.x + p.w, 640)}% della larghezza, da ${pc(p.y, 360)}% a ${pc(p.y + p.h, 360)}% dell'altezza)`;
}
const esiste = (rel) => fs.existsSync(path.join(ASSETS, rel));

// ---------------------------------------------------------------- il file
const capitoli = [...AV.dati.capitolo.values()].sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
const quadri = [...AV.dati.quadro.values()].filter((Q) => Q.fondale && Q.fondale.immagine);
const fatti = quadri.filter((Q) => esiste(Q.fondale.immagine + '.png')).length;
const figure = [...AV.dati.personaggio.values()].filter((P) => !(P.figura && P.figura.foglio));
const oggetti = [...AV.dati.oggetto.values()];
const oggFatti = oggetti.filter((O) => esiste(`avventura/oggetti/${O.id}.png`)).length;

let md = `# Istruzioni per Gemini — i disegni che mancano all'avventura di Ferruccio

Generato da \`tools/avventura-richieste-immagini.js\` (non modificare a mano: si rigenera). Mancano
**${quadri.length - fatti} fondali** su ${quadri.length}, **${figure.length} figure**, **${oggetti.length - oggFatti} oggetti** su ${oggetti.length}.

## 0. Il tuo compito, e i suoi confini

Sei l'illustratore di «Ferruccio — La Notte Immobile», un'avventura grafica ambientata a Caserta nel 1845, la notte in
cui un Velo magico ha fermato la città. Devi disegnare **solo** le immagini elencate qui sotto.

- **Aggiungi soltanto file PNG**, nelle cartelle indicate, col **nome esatto**. Non modificare, rinominare o cancellare
  nessun altro file: niente \`.js\`, \`.html\`, \`.md\`, \`.json\`, e nessuno dei disegni che esistono già.
- **Un'immagine per file.** Se un'immagine non ti convince, rifalla: non consegnarne due versioni.
- Al gioco le collega Claude: tu non devi far altro che metterle al loro posto.

## 1. Lo stile: deve sembrare la stessa mano

Prima di disegnare **apri e guarda** questi disegni dell'autore: sono il modello, e ogni immagine nuova deve poter stare
accanto a loro senza che si noti la differenza.

| File (in \`gioco/assets/sprite_teatro/\`) | Che cosa prenderne |
|---|---|
| \`ferruccio.png\` | **il riferimento principale**: lo spessore del contorno, le ombre, l'avorio caldo, il rosso della sciarpa |
| \`scena/ostacolo-lampione.png\`, \`scena/ostacolo-albero.png\`, \`scena/ostacolo-statua.png\` | come sono fatti gli oggetti di scena: forme semplici, colori pieni |
| \`scena/porta-bottega-chiusa.png\`, \`scena/banchetto-tonino.png\` | il legno, il ferro battuto, la luce di lanterna sulle cose |
| \`scena/npc-tonino.png\`, \`guardia_ferma.png\`, \`colosso_statua_fermo.png\` | le persone e le statue: proporzioni, visi, panneggi |

**Scheda di stile (vale per ogni immagine):**

- **Contorno:** una linea a inchiostro bruno-nera (\`#1c120e\`), netta, di spessore quasi uniforme, attorno a ogni forma
  e sui dettagli principali. Niente contorni colorati, niente bordi sfumati, niente alone chiaro intorno alle figure.
- **Colore:** tinte piene e calde con **due toni di ombra** (luce e ombra, stacco morbido), qualche tratteggio a inchiostro
  nelle ombre. Niente sfumature fotografiche, niente texture realistiche.
- **Tavolozza** (presa dai disegni dell'autore): inchiostro \`#1c120e\` · legni \`#422918\` \`#68452b\` \`#9a693d\` ·
  avorio \`#f7f0c2\` \`#e1d2a1\` \`#cdb388\` · rosso \`#652f24\` e rosso acceso \`#a8322a\` · ferro \`#2d3034\` \`#8b8f98\` ·
  oro di lanterna \`#f0b33b\` \`#fbde85\` · verde scuro \`#1e3f26\` \`#315d39\` · marmo \`#d4d1cc\` \`#96928d\` ·
  notte \`#1b1a33\` \`#2c2e4a\` · tufo e intonaci di Caserta \`#8a6d3c\` \`#b08f62\` \`#7d7468\`.
- **Luce:** è notte, la luna è piena e non si muove; la luce vera viene da lanterne, finestre e braci, calda e dorata, e
  si posa sui muri vicini. I colori si vedono: **niente sagome nere**, niente scene quasi tutte al buio.
- **Materiali:** tufo, intonaco, legno intagliato, ferro battuto, ottone, seta, velluto. È un mondo da teatro di
  marionette: tutto è un po' costruito, un po' dipinto.
- **Non fare:** fotorealismo, rendering 3D, stile manga o cartone moderno, pixel art, acquerello sbiadito, scritte,
  firme, cornici, loghi, filigrane, lo sfondo «a scacchi» disegnato.

## 2. Come restare in linea dall'inizio alla fine

1. **Fai per primo \`piazza-centro.png\`** (sezione 3) e fermati: è il campione. L'autore lo approva o lo fa correggere.
2. Da lì in poi, per ogni fondale usa come riferimenti: \`ferruccio.png\`, **il campione approvato**, il **primo fondale
   già fatto dello stesso capitolo** (stesso luogo = stessi muri, stessi colori, stessa luce) e la **guida** del quadro.
3. Prima di consegnare un'immagine controlla: contorno a inchiostro su tutto? tavolozza della scheda? luce calda da un
   punto preciso? nessuna scritta e nessun personaggio? misure giuste? le cose stanno dove dice l'elenco?

## 3. I fondali (${quadri.length - fatti} da fare)

**Cartella:** \`gioco/assets/avventura/\` · **formato:** PNG opaco, **16:9**, 1920×1080 (minimo 1280×720).

**Regole comuni a tutti i fondali:**

- **La guida.** Per ogni fondale c'è uno schema in \`production/arte/guide-avventura/<stesso nome>.jpg\`: è il luogo
  com'è abbozzato oggi dal gioco. **Serve solo a dire DOVE stanno le cose e quanto sono grandi: ridisegna la stessa
  composizione**, con le cose nelle stesse posizioni. La guida è un abbozzo geometrico fatto col codice: il tuo deve
  essere un'illustrazione vera, più ricca e più viva (muri con la loro materia, tetti, insegne, panni stesi, crepe,
  ombre portate), nello stile della sezione 1.
- **Le posizioni contano.** Il giocatore clicca sulle cose: ogni cosa elencata sotto «Da dipingere» deve stare nel
  rettangolo indicato (percentuali della larghezza e dell'altezza, dall'angolo in alto a sinistra).
- **La fascia in basso** (l'ultimo sesto dell'altezza, sotto l'83%) resta **scura e vuota**: il gioco ci mette gli
  oggetti raccolti e i pulsanti. Niente di importante lì.
- **La terra.** Le figure camminano su una striscia fra la «linea di terra» indicata per ogni quadro e l'83%
  dell'altezza: lì ci vuole pavimento libero (selciato, assi, erba), senza ostacoli.
- **Le misure.** Ferruccio è alto circa il 18% dell'immagine, un adulto il 20%: una porta è alta circa il 28%, un
  lampione il 35%. Vista di tre quarti dall'alto della platea, come un palcoscenico.
- **Niente personaggi e niente scritte.** Le persone e le cose che cambiano le mette il gioco: sono elencate sotto
  «Da NON dipingere» e il loro posto deve restare libero (muro o pavimento che continua).
- **Gli oggetti di scena dell'autore.** Dove un quadro li nomina, lampioni, alberi, statue, telai, colonne e aiuole
  vanno rifatti **uguali** ai file di \`gioco/assets/sprite_teatro/scena/\` (senza l'anello in cima, che serve solo
  al teatro).

`;

for (const C of capitoli) {
  const suoi = quadri.filter((Q) => Q.capitolo === C.id);
  if (!suoi.length) continue;
  md += `### ${C.titolo || C.nome || C.id}\n\n`;
  for (const Q of suoi) {
    const nome = Q.fondale.immagine; const file = nome.replace(/^avventura\//, '') + '.png';
    const fatto = esiste(nome + '.png');
    const disegno = Array.isArray(Q.fondale.disegno) ? Q.fondale.disegno : [];
    const tono = (Q.fondale.luce && Q.fondale.luce.tono) || 'notte';
    const suolo = disegno.find((e) => Array.isArray(e) && e[0] === 'suolo');
    const terra = pc((suolo && suolo[1] && suolo[1].y) || 250, 360);
    const fili = disegno.some((e) => Array.isArray(e) && e[0] === 'fili');
    const arredi = [...new Set(disegno.filter((e) => Array.isArray(e) && ARREDI[e[0]]).map((e) => ARREDI[e[0]]))];
    // il banco di Tonino e la porta della bottega hanno già il loro disegno
    if ((Q.punti || []).some((p) => p.personaggio === 'tonino') && disegno.some((e) => Array.isArray(e) && e[0] === 'banco')) arredi.push('scena/banchetto-tonino.png');
    if (Q.id === 'piazza.bottega') arredi.push('scena/porta-bottega-chiusa.png');
    const daDipingere = []; const daNon = [];
    for (const p of Q.punti || []) {
      if (p.personaggio) { const P = AV.dati.personaggio.get(p.personaggio); daNon.push(`${(P && P.nome) || p.nome} (personaggio) ${dove(p)}`); }
      else if (!AV.puntoFisso(p)) daNon.push(`«${p.nome}» (compare o cambia) ${dove(p)}`);
      else daDipingere.push(`${p.uscita ? '**passaggio** ' : ''}«${p.nome}» ${dove(p)}`);
    }
    md += `#### ${fatto ? '✅' : '⬜'} \`${file}\` — ${Q.nome || Q.id}\n\n`;
    md += `- **Guida:** \`production/arte/guide-avventura/${file.replace(/\.png$/, '.jpg')}\`\n`;
    md += `- **Che cosa si vede:** ${descr[nome] || Q.nome || Q.id}\n`;
    md += `- **Luce:** ${LUCE[tono] || LUCE.notte}${fili && tono !== 'velo' ? '; dall\'alto scendono sottili fili d\'oro' : ''}. **Linea di terra:** ${terra}% dell'altezza.\n`;
    if (arredi.length) md += `- **Oggetti di scena dell'autore da rifare uguali:** ${arredi.map((a) => '`' + a + '`').join(', ')}\n`;
    if (daDipingere.length) md += `- **Da dipingere, in queste posizioni:**\n${daDipingere.map((x) => '  - ' + x).join('\n')}\n`;
    if (daNon.length) md += `- **Da NON dipingere (li mette il gioco: lascia libero il posto):**\n${daNon.map((x) => '  - ' + x).join('\n')}\n`;
    md += '\n';
  }
}

md += `## 4. Le figure (${figure.length} da fare)

**Cartella:** \`gioco/assets/sprite_teatro/\` · **formato:** PNG con **sfondo trasparente vero**; se non ti è possibile,
sfondo **bianco pieno e uniforme** (lo toglie Claude): mai la scacchiera disegnata, mai un alone chiaro.

Ogni figura è un foglio di **una riga con 2 pose, due celle uguali di 256×320** (immagine 512×320), senza righe fra le
celle. Nelle due celle la figura è **la stessa, alla stessa altezza, coi piedi alla stessa quota** (a 8 px dal bordo
basso) e al centro della cella: cambia solo il gesto. Posa 1: ferma. Posa 2: parla, o fa il suo gesto. Figura intera,
di tre quarti, rivolta a sinistra (verso Ferruccio, che arriva da sinistra). Proporzioni e tratto come
\`scena/npc-tonino.png\` e \`guardia_ferma.png\`; nessuna ombra a terra dipinta.

| | File | Chi è |
|---|---|---|
`;
for (const P of figure) md += `| ${esiste(`sprite_teatro/avv_${P.id}.png`) ? '✅' : '⬜'} | \`avv_${P.id}.png\` | ${CHI[P.id] || P.nome} |\n`;
md += `| ${esiste('sprite_teatro/avv_agnese_dorme.png') ? '✅' : '⬜'} | \`avv_agnese_dorme.png\` (una posa sola, 256×320) | Agnese addormentata seduta, la testa sulla spalla, le mani in grembo: la stessa Agnese di \`agnese_telaio.png\` (cuffia bianca, abito scuro, grembiule di pizzo). |

## 5. Gli oggetti (${oggetti.length - oggFatti} da fare)

**Cartella:** \`gioco/assets/avventura/oggetti/\` · **formato:** PNG **256×256** con sfondo trasparente vero (o bianco pieno
uniforme), **un file per oggetto** col nome qui sotto.

L'oggetto da solo, intero, che riempie il riquadro con un piccolo margine, visto di tre quarti; stesso contorno e
stessa tavolozza della sezione 1, leggibile anche piccolo (nel gioco è grande come un francobollo). I «ricordi» sono
piccole fiammelle d'anima, ognuna del suo colore, con dentro appena accennata la cosa che ricordano.

| | File | Oggetto | Com'è |
|---|---|---|---|
`;
for (const O of oggetti) md += `| ${esiste(`avventura/oggetti/${O.id}.png`) ? '✅' : '⬜'} | \`${O.id}.png\` | ${O.nome} | ${String(O.descrizione || '').replace(/\|/g, '/')} |\n`;

md += `
## 6. Consegna

- I fondali in \`gioco/assets/avventura/\`, le figure in \`gioco/assets/sprite_teatro/\`, gli oggetti in
  \`gioco/assets/avventura/oggetti/\`. Solo PNG, nomi esatti, tutto minuscolo coi trattini come scritto.
- Ordine consigliato: il campione \`piazza-centro.png\` → gli altri fondali di Piazza Dante → i capitoli in ordine →
  le figure → gli oggetti.
- Se un'immagine esiste già (segno ✅ in questo file), non rifarla a meno che l'autore non lo chieda.

Fondali fatti: ${fatti} su ${quadri.length}. Figure da fare: ${figure.length}. Oggetti fatti: ${oggFatti} su ${oggetti.length}.
`;
fs.mkdirSync(path.dirname(USCITA), { recursive: true });
fs.writeFileSync(USCITA, md);
console.log(`scritto ${path.relative(RADICE, USCITA)}: ${quadri.length} fondali (${fatti} fatti), ${figure.length} figure, ${oggetti.length} oggetti (${oggFatti} fatti), ${Object.keys(descr).length} descrizioni`);

// ---------------------------------------------------------------- le guide (Playwright)
async function guide() {
  const { chromium } = require('playwright');
  fs.mkdirSync(GUIDE, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  // dal file unico: lì le immagini sono dentro la pagina e la tela si può esportare (da file:// il browser lo vieta)
  const unico = path.join(require('os').tmpdir(), `avventura-guide-${process.pid}.html`);
  const r = require('child_process').spawnSync('node', [path.join(__dirname, 'avventura-release.js'), '--uscita', unico], { stdio: 'ignore' });
  if (r.status !== 0 || !fs.existsSync(unico)) throw new Error('il file unico non si costruisce: tools/avventura-release.js');
  await p.goto('file://' + unico);
  await p.waitForFunction(() => window.__avventura && window.AV && AV.D, null, { timeout: 20000 });
  const resa = (id) => p.evaluate((qid) => {
    const Q = AV.dati.quadro.get(qid); const f = AV.D.fondale(Q, 2);
    const c = document.createElement('canvas'); c.width = 1280; c.height = 720; const x = c.getContext('2d');
    x.drawImage(f.tela, 0, 0); x.save(); x.scale(2, 2); AV.D.atmosfera(x, f, 0); x.restore();
    x.fillStyle = 'rgba(0,0,0,0.88)'; x.fillRect(0, 600, 1280, 120); // la fascia dell'interfaccia
    return c.toDataURL('image/jpeg', 0.8).split(',')[1];
  }, id);
  for (const Q of quadri) await resa(Q.id); // primo giro: fa partire il caricamento delle immagini usate
  await p.waitForTimeout(1200);
  let n = 0;
  for (const Q of quadri) {
    const dati = await resa(Q.id);
    fs.writeFileSync(path.join(GUIDE, Q.fondale.immagine.replace(/^avventura\//, '') + '.jpg'), Buffer.from(dati, 'base64')); n++;
  }
  await b.close();
  fs.unlinkSync(unico);
  console.log(`scritte ${n} guide in ${path.relative(RADICE, GUIDE)}/`);
}
if (process.argv.includes('--guide')) guide().catch((e) => { console.error(e); process.exit(1); });
