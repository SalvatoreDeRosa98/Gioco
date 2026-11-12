#!/usr/bin/env python3
"""
tools/grafo-teatro.py — costruisce il grafo del codice del Teatro con graphify e lo completa.

graphify (https://github.com/Graphify-Labs/graphify, pacchetto PyPI `graphifyy`) in modalità «solo codice»
lavora in locale, senza chiavi e senza mandare nulla fuori: legge bene ciò che sta DENTRO ogni file.
Il Teatro però è fatto di script classici senza import: le chiamate fra un file e l'altro passano dallo
scope globale, e le estensioni «avvolgono» le funzioni (`const base = f; f = function (...) { ... }`).
Quelle relazioni graphify non le vede (su 3806 collegamenti solo 98 erano fra file diversi), e sono
proprio quelle che servono per capire il progetto. Questo script:

  1. lancia `graphify extract gioco/teatro --code-only --out .`;
  2. aggiunge al grafo le chiamate fra file (per nome: le funzioni globali con nome unico) e gli avvolgimenti;
  3. rilancia `graphify cluster-only . --no-label` e dà a ogni gruppo il nome del file che vi prevale (tabella COSA_FA);
  4. rende autonoma graphify-out/graph.html (incorpora la libreria che altrimenti scarica da internet);
  5. scrive graphify-out/AVVOLGIMENTI.md: per ogni funzione avvolta, chi la avvolge, in ordine di caricamento.

Uso:  python3 tools/grafo-teatro.py            (dalla radice del progetto; serve `pip install graphifyy`)
      python3 tools/grafo-teatro.py --solo-aggiunte   (non rilancia graphify: completa il graph.json che c'è)
Poi:  graphify explain "passoLogico()"   ·   graphify affected "danneggiaNemico()"   ·   graphify query "..."
"""
import bisect
import collections
import json
import os
import re
import subprocess
import sys

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CODICE = os.path.join(RADICE, 'gioco', 'teatro')
HTML = os.path.join(RADICE, 'gioco', 'teatro_marionette.html')
USCITA = os.path.join(RADICE, 'graphify-out')
GRAFO = os.path.join(USCITA, 'graph.json')
AMBIENTE = dict(os.environ, GRAPHIFY_QUERY_LOG_DISABLE='1')  # niente registro delle domande fuori dal progetto

# Parole che il riconoscitore di chiamate non deve scambiare per funzioni del gioco.
RISERVATE = {'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'new', 'await', 'super'}
CHIAMATA = re.compile(r'(?<![\w.$])([A-Za-z_$][\w$]*)\s*\(')
ALIAS = re.compile(r'\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*;')


def graphify(*argomenti):
    """Lancia graphify nella radice del progetto e si ferma se fallisce."""
    esito = subprocess.run(['graphify', *argomenti], cwd=RADICE, env=AMBIENTE)
    if esito.returncode != 0:
        sys.exit(f'graphify {" ".join(argomenti)} è uscito con {esito.returncode}')


def ordine_di_caricamento():
    """I file di gioco/teatro nell'ordine in cui l'HTML li carica (gli altri in coda, per nome)."""
    with open(HTML, encoding='utf-8') as f:
        caricati = re.findall(r'<script src="teatro/([^"]+\.js)"', f.read())
    resto = sorted(n for n in os.listdir(CODICE) if n.endswith('.js') and n not in caricati)
    return caricati + resto


def senza_commenti(testo):
    """Toglie i commenti lasciando le righe al loro posto (così i numeri di riga restano giusti)."""
    testo = re.sub(r'/\*.*?\*/', lambda m: re.sub(r'[^\n]', ' ', m.group(0)), testo, flags=re.S)
    return re.sub(r'(?<![:\'"`\\])//[^\n]*', lambda m: ' ' * len(m.group(0)), testo)


def riga_di(testo, posizione):
    return testo.count('\n', 0, posizione) + 1


def completa():
    """Aggiunge a graph.json le chiamate fra file e gli avvolgimenti. Restituisce gli avvolgimenti trovati."""
    with open(GRAFO, encoding='utf-8') as f:
        grafo = json.load(f)
    nodi = grafo['nodes']
    # via le aggiunte di un giro precedente (lo script si può rilanciare)
    grafo['links'] = [l for l in grafo['links'] if not str(l.get('_origin', '')).startswith('teatro-')]
    collegamenti = grafo['links']

    nodo_file = {}                                  # 'b3-comandi-opzioni.js' -> id del nodo del file
    funzioni_del_file = collections.defaultdict(list)  # file -> [(riga, id)] ordinate
    per_nome = collections.defaultdict(list)        # 'passoLogico' -> [id]
    for n in nodi:
        file = os.path.basename(n.get('source_file') or '')
        etichetta = n.get('label') or ''
        if etichetta == file and file:
            nodo_file[file] = n['id']
        elif etichetta.endswith('()') and file:
            riga = int(str(n.get('source_location') or 'L0').lstrip('L') or 0)
            funzioni_del_file[file].append((riga, n['id']))
            per_nome[etichetta[:-2]].append(n['id'])
    for elenco in funzioni_del_file.values():
        elenco.sort()
    file_di = {n['id']: os.path.basename(n.get('source_file') or '') for n in nodi}
    unici = {nome: ids[0] for nome, ids in per_nome.items() if len(ids) == 1 and nome not in RISERVATE}

    gia = {(l['source'], l['target'], l.get('relation')) for l in collegamenti}
    avvolgimenti = collections.defaultdict(list)   # id della funzione avvolta -> [(file, riga, nome del nuovo strato)]
    agganci = collections.defaultdict(list)        # id della funzione -> [(file, riga)] di chi la chiama «se esiste»
    aggiunte = collections.Counter()

    def dentro(file, riga):
        """Il nodo della funzione che contiene quella riga (la più vicina prima), o il nodo del file."""
        elenco = funzioni_del_file.get(file, [])
        i = bisect.bisect_right(elenco, (riga, chr(0x10FFFF))) - 1
        return elenco[i][1] if i >= 0 else nodo_file.get(file)

    def aggiungi(sorgente, bersaglio, relazione, contesto, origine, file, riga, fiducia):
        if not sorgente or sorgente == bersaglio or (sorgente, bersaglio, relazione) in gia:
            return
        gia.add((sorgente, bersaglio, relazione))
        collegamenti.append({
            'source': sorgente, 'target': bersaglio, 'relation': relazione, '_origin': origine,
            'confidence': 'INFERRED', 'confidence_score': fiducia, 'context': contesto,
            'source_file': file, 'source_location': f'L{riga}', 'weight': 1.0,
        })
        aggiunte[origine] += 1

    for file in ordine_di_caricamento():
        percorso = os.path.join(CODICE, file)
        if not os.path.exists(percorso):
            continue
        with open(percorso, encoding='utf-8') as f:
            testo = senza_commenti(f.read())

        # 1. avvolgimenti: `const base = nome;` e più sotto `nome = function …` nello stesso file
        avvolte_qui = set()
        for m in ALIAS.finditer(testo):
            nome = m.group(2)
            bersaglio = unici.get(nome)
            if not bersaglio:
                continue
            strato = re.search(r'(?<![\w.$])' + re.escape(nome) + r'\s*=\s*(?:async\s+)?function\b\s*([A-Za-z_$][\w$]*)?', testo[m.end():])
            if not strato:
                continue
            riga = riga_di(testo, m.start())
            avvolte_qui.add(nome)
            avvolgimenti[bersaglio].append((file, riga, strato.group(1) or '(senza nome)'))
            aggiungi(nodo_file.get(file), bersaglio, 'indirect_call', 'avvolge', 'teatro-avvolge', file, riga, 0.95)

        # 1b. agganci facoltativi: `typeof nome === 'function'` verso una funzione di un altro file
        for m in re.finditer(r"typeof\s+([A-Za-z_$][\w$]*)\s*===?\s*'function'", testo):
            bersaglio = unici.get(m.group(1))
            if bersaglio and file_di.get(bersaglio) != file and m.group(1) not in avvolte_qui:
                riga = riga_di(testo, m.start())
                if not agganci[bersaglio] or agganci[bersaglio][-1][0] != file:
                    agganci[bersaglio].append((file, riga))

        # 2. chiamate a funzioni globali definite in un ALTRO file
        for m in CHIAMATA.finditer(testo):
            nome = m.group(1)
            bersaglio = unici.get(nome)
            if not bersaglio or file_di.get(bersaglio) == file:
                continue
            if testo[max(0, m.start() - 9):m.start()].rstrip().endswith('function'):
                continue  # è la definizione di una funzione con lo stesso nome, non una chiamata
            riga = riga_di(testo, m.start())
            aggiungi(dentro(file, riga), bersaglio, 'calls', 'call', 'teatro-globale', file, riga, 0.9)

    with open(GRAFO, 'w', encoding='utf-8') as f:
        json.dump(grafo, f, ensure_ascii=False)
    fra_file = sum(1 for l in collegamenti if file_di.get(l['source']) and file_di.get(l['target'])
                   and file_di[l['source']] != file_di[l['target']])
    print(f'[grafo-teatro] aggiunti {aggiunte["teatro-globale"]} collegamenti di chiamata fra file e '
          f'{aggiunte["teatro-avvolge"]} avvolgimenti; ora {fra_file} collegamenti su {len(collegamenti)} sono fra file diversi')
    return avvolgimenti, agganci, {n['id']: n for n in nodi}


def scrivi_avvolgimenti(avvolgimenti, agganci, nodi):
    """graphify-out/AVVOLGIMENTI.md: chi avvolge che cosa, in ordine di caricamento."""
    ordine = {f: i for i, f in enumerate(ordine_di_caricamento())}
    righe = [
        '# Avvolgimenti del Teatro',
        '',
        'Generato da `tools/grafo-teatro.py`: non modificare a mano. Ogni estensione del Teatro sta nel suo file e',
        '«avvolge» le funzioni globali (`const base = f; f = function (...) { ... base(...) ... }`). Qui, per ogni',
        'funzione avvolta, gli strati **nell\'ordine in cui l\'HTML li carica**: l\'ultimo della riga è quello che gira per primo.',
        'Prima di avvolgere una di queste funzioni, o di cambiarne il comportamento, guarda chi c\'è già.',
        '',
        '| Funzione | Definita in | Strati | Chi la avvolge (in ordine di caricamento) |',
        '|---|---|---|---|',
    ]
    for bersaglio, strati in sorted(avvolgimenti.items(), key=lambda kv: (-len(kv[1]), nodi[kv[0]]['label'])):
        n = nodi[bersaglio]
        strati = sorted(strati, key=lambda s: (ordine.get(s[0], 999), s[1]))
        dove = f"{os.path.basename(n.get('source_file') or '?')}:{str(n.get('source_location') or '').lstrip('L')}"
        elenco = ' → '.join(f"{f.replace('.js', '')}:{r}" for f, r, _ in strati)
        righe.append(f"| `{n['label']}` | {dove} | {len(strati)} | {elenco} |")
    righe += [
        '',
        '## Agganci facoltativi',
        '',
        'Funzioni di un file chiamate da un ALTRO file solo «se esistono» (`typeof f === \'function\'`): sono i punti in cui',
        'un file di base lascia entrare un\'estensione senza conoscerla. Togliere o rinominare una di queste funzioni non dà',
        'errore: l\'aggancio smette di funzionare in silenzio.',
        '',
        '| Funzione | Definita in | Chi la chiama se esiste |',
        '|---|---|---|',
    ]
    for bersaglio, chiamanti in sorted(agganci.items(), key=lambda kv: (os.path.basename(nodi[kv[0]].get('source_file') or ''), nodi[kv[0]]['label'])):
        n = nodi[bersaglio]
        dove = f"{os.path.basename(n.get('source_file') or '?')}:{str(n.get('source_location') or '').lstrip('L')}"
        elenco = ', '.join(f"{f.replace('.js', '')}:{r}" for f, r in sorted(chiamanti, key=lambda c: (ordine.get(c[0], 999), c[1])))
        righe.append(f"| `{n['label']}` | {dove} | {elenco} |")
    righe += [
        '',
        '## Cose che la mappa non dice',
        '',
        '- Alcuni file tengono il loro stato chiuso dentro una funzione (`(() => { ... })()`, per esempio in',
        '  `t3-economia-salvataggi.js` e `b2-ribalta.js`): da fuori non si avvolge, bisogna toccare il file stesso.',
        '- Le `const` globali (`ctx`, le tabelle `Object.freeze`) non si possono riassegnare né estendere da un altro file:',
        '  si avvolgono le `function`, non le costanti.',
    ]
    with open(os.path.join(USCITA, 'AVVOLGIMENTI.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(righe) + '\n')
    print(f'[grafo-teatro] scritto graphify-out/AVVOLGIMENTI.md: {len(avvolgimenti)} funzioni avvolte, {len(agganci)} agganci facoltativi')


# Cosa fa ogni file, in due parole: diventa il nome del suo gruppo nel rapporto e nella pagina del grafo.
# Un file nuovo che qui manca prende come nome il nome del file: aggiungilo.
COSA_FA = {
    '000-errori.js': 'Rete di sicurezza degli errori', '00-config.js': 'Configurazione e tabelle di gioco',
    '10-sprite.js': 'Disegno di personaggi e boss', '15-audio.js': 'Audio', '20-stato.js': 'Stato della notte',
    '30-mappa.js': 'Generatore della mappa', '40-combattimento.js': 'Combattimento',
    '50-oggetti.js': 'Oggetti e Diario degli oggetti', '60-resa.js': 'Disegno della stanza e HUD',
    '70-input.js': 'Tastiera e mouse', '80-ciclo.js': 'Ciclo di gioco', 't2-sprite.js': 'Fogli di sprite',
    't3-economia-salvataggi.js': 'Economia e salvataggi', 't4-hub-storia.js': 'Piazza Dante e storia',
    'a1-bombe-chiavi.js': 'Bombe, chiavi e forzieri', 'a2-consumabili.js': 'Ampolle e carte',
    'a3-stanze-speciali.js': 'Stanze speciali', 'a6-progressione.js': 'Progressione e sblocchi',
    'a7-registro-bilancio.js': 'Registro delle notti', 'a8-musica.js': 'Musica',
    'b1-pubblico.js': 'Pubblico e sipario', 'b2-ribalta.js': 'Ribalta, luci e ombre',
    'b3-comandi-opzioni.js': 'Comandi, gamepad e opzioni', 'b4-trasformazioni.js': 'Trasformazioni e sinergie',
    'b5-oggetti.js': 'I 200 oggetti', 'b5-oggetti-icone.js': 'Icone degli oggetti', 'b6-boss.js': 'Boss per piano',
    'b7-stanze.js': 'Varianti di stanza', 'b8-finali-diario.js': 'Finali, Diario di Ferruccio e Voce',
    'b9-immagini.js': 'Immagini di scena', 'c1-partenza-segreta.js': 'Partenza segreta',
    'c2-tocco.js': 'Comandi a tocco', 'd1-burattinaio.js': 'Scontro col Grande Burattinaio',
    'd2-personaggi.js': 'Stili dei personaggi', 'd3-registro-scena.js': 'Registro di Scena e trionfi',
    'd4-stanze-teatro.js': 'Buca, terna e Camerini', 'd5-cambio-scena.js': 'Cambio di scena e botole',
    'd6-acquedotto.js': 'Acquedotto Carolino', 'd7-rifiniture.js': 'Rifiniture e Ragno della Seta',
    'e4-prestazioni.js': 'Qualità automatica', 'e6-assistenza.js': 'Riprendi la notte, mira assistita, conto',
}


def nomina_i_gruppi():
    """Scrive graphify-out/.graphify_labels.json: ogni gruppo prende il nome del file che vi prevale."""
    with open(GRAFO, encoding='utf-8') as f:
        grafo = json.load(f)
    grado = collections.Counter()
    for l in grafo['links']:
        grado[l['source']] += 1
        grado[l['target']] += 1
    gruppi = collections.defaultdict(list)
    for n in grafo['nodes']:
        if n.get('community') is not None:
            gruppi[n['community']].append(n)
    visti = collections.Counter()
    nomi = {}
    for g in sorted(gruppi, key=lambda g: -len(gruppi[g])):
        file = collections.Counter(os.path.basename(n.get('source_file') or '?') for n in gruppi[g]).most_common(1)[0][0]
        visti[file] += 1
        nome = COSA_FA.get(file, file)
        if visti[file] > 1:  # più gruppi nello stesso file: si distinguono dalla funzione più collegata
            cima = max((n for n in gruppi[g] if str(n.get('label', '')).endswith('()')), key=lambda n: grado[n['id']], default=None)
            if cima:
                nome = f"{nome} · {cima['label']}"
        nomi[str(g)] = f"{nome} ({file.replace('.js', '')})"
    with open(os.path.join(USCITA, '.graphify_labels.json'), 'w', encoding='utf-8') as f:
        json.dump(nomi, f, ensure_ascii=False, indent=1)
    print(f'[grafo-teatro] nomi dati a {len(nomi)} gruppi')


LIBRERIA = ('vis-network', '9.1.6', 'standalone/umd/vis-network.min.js')  # quella che graph.html chiede a unpkg.com


def rendi_autonoma():
    """
    graph.html carica vis-network da internet: senza rete la pagina resta vuota. Qui la libreria viene
    incorporata nel file (presa una volta dal registro npm e tenuta in graphify-out/cache/). Se non si
    riesce a scaricarla la pagina resta com'è, col collegamento a internet.
    """
    pacchetto, versione, percorso = LIBRERIA
    pagina = os.path.join(USCITA, 'graph.html')
    copia = os.path.join(USCITA, 'cache', f'{pacchetto}-{versione}.min.js')
    if not os.path.exists(copia):
        import shutil
        import tarfile
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            esito = subprocess.run(['npm', 'pack', f'{pacchetto}@{versione}', '--silent'], cwd=tmp, capture_output=True, text=True)
            archivi = [n for n in os.listdir(tmp) if n.endswith('.tgz')]
            if esito.returncode != 0 or not archivi:
                print('[grafo-teatro] vis-network non scaricata: graph.html resta con la libreria presa da internet')
                return
            with tarfile.open(os.path.join(tmp, archivi[0])) as tar:
                membro = tar.getmember(f'package/{percorso}')
                os.makedirs(os.path.dirname(copia), exist_ok=True)
                with tar.extractfile(membro) as sorgente, open(copia, 'wb') as destinazione:
                    shutil.copyfileobj(sorgente, destinazione)
    with open(copia, encoding='utf-8') as f:
        libreria = f.read().replace('</script', '<\\/script')
    with open(pagina, encoding='utf-8') as f:
        html = f.read()
    marca = re.search(r'<script src="https://unpkg\.com/vis-network@[^"]+"[^>]*></script>', html)  # ha anche integrity e crossorigin
    if not marca:
        print('[grafo-teatro] graph.html non chiede vis-network a internet: lasciata com\'è')
        return
    html = html[:marca.start()] + '<script>' + libreria + '</script>' + html[marca.end():]
    with open(pagina, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'[grafo-teatro] graph.html resa autonoma (vis-network {versione} incorporata, {len(html) // 1024} KB)')


def main():
    if '--solo-aggiunte' not in sys.argv:
        graphify('extract', 'gioco/teatro', '--code-only', '--out', '.')
    avvolgimenti, agganci, nodi = completa()
    graphify('cluster-only', '.', '--no-label')   # raggruppa col grafo completo
    nomina_i_gruppi()
    graphify('cluster-only', '.', '--no-label')   # riscrive rapporto e pagina coi nomi
    rendi_autonoma()
    scrivi_avvolgimenti(avvolgimenti, agganci, nodi)


if __name__ == '__main__':
    main()
