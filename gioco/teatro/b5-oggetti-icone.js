/*
 * teatro/b5-oggetti-icone.js — (squadra b5) icone 12×12 dei 120 oggetti nuovi del catalogo a 200.
 *
 * Stesso formato di SPRITE_OGGETTI in 10-sprite.js: 12 righe di 12 caratteri della PALETTE di 00-config.js
 * ('.' = trasparente, k = contorno). Sono segnaposto curati: l'autore può sostituirle con immagini generate
 * (elenco dei file in production/oggetti-200.md). La chiave è l'id dell'oggetto (campo `sprite`).
 * Caricato subito prima di teatro/b5-oggetti.js. Nessuna logica di gioco qui.
 */

/** Lato in celle delle icone degli oggetti (come quelle esistenti). */
const ICONE_B5_LATO = 12;

/** Icone grezze, per id. Le righe vengono riportate a 12 caratteri da normalizzaIconaB5. */
const ICONE_B5 = {
  // ------------------------------------------------------------------ colpi
  'melagrana': ['....k.k.k...', '....kRkRk...', '.....kkk....', '...kkrrrkk..', '..krrrrrrrk.', '.krrwrrrrrRk',
    '.krrrrkkkrRk', '.krrrkwrwkRk', '.krrrkrwrkRk', '..krrrkkkRk.', '...kkRRRkk..', '.....kkk....'],
  'rocchetto': ['............', '..kkkkkkkk..', '..kmmmmmmk..', '...kkkkkk...', '...kyoyoyk..', '...kyoyoyk..',
    '...kyoyoyk..', '...kyoyoyk.y', '...kkkkkk.y.', '..kmmmmmmky.', '..kkkkkkkk..', '............'],
  'olio-lucerna': ['.....kk.....', '....kyyk....', '.....kk.....', '....kggk....', '...kgyygk...', '..kgyyyygk..',
    '..kgyyyygk..', '..kgyyyOgk..', '..kgyyOOgk..', '...kggggk...', '....kkkk..o.', '.........oyo'],
  'china-copista': ['.........kw.', '........kwk.', '.......kwk..', '......kwk...', '.....kgk....', '...kkkkkk...',
    '..kDDDkDDk..', '.kDdddddddk.', '.kDdddddddk.', '.kDdddddddk.', '..kDDDDDDk..', '...kkkkkk...'],
  'acqua-montevergine': ['.....kk.....', '....kmmk....', '....kkkk....', '....kaak....', '...kaawak...', '..kaawwwak..',
    '..kaaawaak..', '..kaaawaak..', '..kaaaaaAk..', '..kaaaaAAk..', '...kAAAAk...', '....kkkk....'],
  'struffolo': ['............', '.....kk.....', '....kyyk....', '....kyok....', '...kkkkkk...', '..kyykkyyk..',
    '..kyokkyok..', '.kkkkkkkkkk.', 'kyykkyykkyyk', 'kyokkyokkyok', '.kkkkkkkkkk.', '..r..v..w...'],
  'archetto': ['..........kk', '.........kmk', '........kmwk', '.......kmwk.', '......kmwk..', '.....kmwk...',
    '....kmwk....', '...kmwk.....', '..kmwk......', '.kmwk.......', 'kMMk........', 'kkk.........'],
  'matita-censore': ['kk..........', 'kdk.........', 'kgGk........', '.kgGk.......', '..kgGk......', '...kgGk.....',
    '....kgGk....', '.....kgGk...', '......kgGk..', '.......kcck.', 'kkkkkk..kck.', '.........kk.'],
  'cartella-tombola': ['............', 'kkkkkkkkkkkk', 'kcccccccccck', 'kcrkckcrkcck', 'kcccccccccck', 'kckcrkckcrck',
    'kcccccccccck', 'kcrkckcckcck', 'kcccccccccck', 'kkkkkkkkkkkk', '............', '............'],
  'girandola': ['.y....o.....', '..y..kkk..y.', '...kkoookk..', '..koyyykook.', '.kooykkkyok.', '.koykwwkyok.',
    '.koykwwkyok.', '.kooykkkyok.', '..koyyyoook.', '...kkoookk..', '.y...kkk..o.', '....o.....y.'],
  'nastro-tarantella': ['kk..........', 'kmk.........', '.kmk........', '..kmkrrr....', '...kkr.rr...', '........rr..',
    '......rrr...', '....rrr.....', '...rr.......', '...rr.......', '....rrrr....', '......yrry..'],
  'erma-giano': ['...kkkkkk...', '..kggkkggk..', '.kgkgkkgkgk.', 'kgggggggggGk', '.kgggkkgggk.', '..kggkkggk..',
    '...kkkkkk...', '....kGGk....', '....kggk....', '....kggk....', '...kGGGGk...', '...kkkkkk...'],
  'candelabro': ['.o...o...o..', '.y...y...y..', '.w...w...w..', '.w...w...w..', '.yk..y..ky..', '..yk.y.ky...',
    '...yyyyy....', '.....y......', '.....y......', '....yyy.....', '...yOOOy....', '...kkkkk....'],
  'quaterna': ['.kkkk..kkkk.', 'kyywykkyyyyk', 'kywyykkyrryk', 'kyyyykkyyyyk', '.kkkk..kkkk.', '............',
    '.kkkk..kkkk.', 'kyyyykkyywyk', 'kybbykkywyyk', 'kyyyykkyyyyk', '.kkkk..kkkk.', '............'],
  'sorbetto': ['....kkkk....', '..kkywwykk..', '.kyywwwwyyk.', '.kyyyywyyyk.', 'kkkkkkkkkkkk', '.kaaaaaaaak.',
    '..kaaaaaak..', '...kaaaak...', '....kaak....', '.....kk.....', '....kkkk....', '...kkkkkk...'],
  'guanto-sfida': ['...k.k.k....', '..kckckck...', '..kckckck.k.', '..kckckckkck', '..kcccccckck', '..kcccccccck',
    '..kccccccck.', '...kcccccck.', '...kssssssk.', '...kkkkkkkk.', '...kssssssk.', '...kkkkkkkk.'],
  'mannaia': ['............', '.kkkkkkkk...', 'kggggggggk..', 'kgwgggggGk..', 'kggggggGGk..', 'kgggggGGGk..',
    'kGGGGGGGGk..', '.kkkkkkkkmk.', '........kmmk', '.........kmk', '.........kMk', '..........k.'],
  'lancia-michele': ['.....kk.....', '....kwwk....', '....kwgk....', '...kwwggk...', '....kwgk....', '.yy.kyyk.yy.',
    'yyyykmmkyyyy', '.yy.kmmk.yy.', '....kmmk....', '....kmmk....', '....kmMk....', '.....kk.....'],
  // ------------------------------------------------------------------ uccisioni e movimento
  'castagnola': ['........y...', '.......yoy..', '......k.y...', '.....k......', '...kkkk.....', '..kccsckk...',
    '.kcrcccsck..', '.kccccrcck..', '.kcsccccsk..', '..kccrcsk...', '...kkkkk....', '............'],
  'sanguinaccio': ['............', '.......kk...', '......kssk..', '.....kssk...', '.kkkkkskkkk.', 'kMMMMkkMMMMk',
    'kMRMMMMMMRMk', 'kwMMMMMMMMwk', '.kwwMMMMwwk.', '..kwwwwwwk..', '...kkkkkk...', '............'],
  'borsellino': ['....kkkk....', '...kmmmmk...', '....kyyk....', '...kmmmmk...', '..kmmmmmmk..', '.kmmMmmmmmk.',
    '.kmmmmmmMmk.', '.kmMmmmmmmk.', '..kmmmmmmk..', '...kkkkkk...', '.......kyk..', '........k...'],
  'piedistallo-mimo': ['.....kk.....', '....kwwk....', '....kwwk....', '...kkwwkk...', '..kwwwwwwk..', '...kwwwwk...',
    '....kwwk....', '....kwwk....', '..kkkkkkkk..', '..kggggggk..', '.kgGGGGGGgk.', '.kkkkkkkkkk.'],
  'scarpette': ['............', '..r.....r...', '.r.r...r.r..', '..kkk...kkk.', '.kpppk.kpppk', '.kpppk.kpppk',
    '.kpppk.kpppk', '.kpppk.kpppk', '.kpPpk.kpPpk', '..kkk...kkk.', '............', '............'],
  // ------------------------------------------------------------------ difesa
  'ombrello': ['.....kk.....', '...kkbbkk...', '..kbbbbbbk..', '.kbbBbbBbbk.', 'kbbBbbbbBbbk', 'kkkkkkkkkkkk',
    '.....km.....', '.....km.....', '.....km.....', '.....km..k..', '.....kmmmk..', '......kkk...'],
  'mantellina': ['............', '...kk..kk...', '..krrkkrrk..', '.krrrryrrrk.', '.krrryyyrrk.', 'krrrrryrrrrk',
    'krrrrrrrrrrk', 'krrRrrrrRrrk', 'krRrrrrrrRrk', 'kRrrrrrrrrRk', '.kkRRRRRRkk.', '...kkkkkk...'],
  'riccio': ['..v..v..v...', '.v.vvvvv.v..', '..vvVvvVvv.v', '.vvVvvvvVvv.', 'vvvvkkkkvvvv', '.vvkmmmmkvv.',
    'vvvkmMmmkvvv', '.vvkmmmmkvv.', '..vvkkkkvv.v', '.v.vvVvvv.v.', '...v.vv.v...', '..v......v..'],
  'campanaccio': ['...kkkkkk...', '...km..mk...', '...kmmmmk...', '..kkkkkkkk..', '..kOOOOOOk..', '.kOOoOOOOOk.',
    '.kOoOOOOOOk.', 'kOOOOOOOOOOk', 'kOOOOOOOOMMk', 'kkkkkkkkkkkk', '.....kgk....', '.....kkk....'],
  'peperoncini': ['.....vv.....', '....vVVv....', '...kvkkvk...', '..krkkrkrk..', '..krkrrkrk..', '.krrkrrkrrk.',
    '.krRkrrkrRk.', '.krk.krk.kRk', '..k..krk..k.', '.....kRk....', '......k.....', '............'],
  'ex-voto': ['...rrrrrr...', '....r..r....', '....kkkk....', '....kggk....', '....kgwk....', '....kggk....',
    '....kggk....', '....kgGk....', '....kggkkk..', '....kggggGk.', '....kGGGGGk.', '....kkkkkkk.'],
  'angelo-cartapesta': ['....yyyy....', '............', '.....kk.....', '.w..kcck..w.', 'ww..kcck..ww', 'wwwkkaakkwww',
    'wwwkaaaakwww', '.wwkaaaakww.', '..wkaaaakw..', '...kaaaak...', '..kaaaaaak..', '..kkkkkkkk..'],
  'obolo': ['............', '....kkkk....', '..kkOOOOkk..', '.kOOooooOOk.', '.kOokOOkoOk.', 'kOOoOOOOoOOk',
    'kOOoOkkOoOOk', '.kOokOOkoOk.', '.kOOooooOMk.', '..kkOOMMkk..', '....kkkk....', '............'],
  // ------------------------------------------------------------------ famigli
  'gazza': ['............', '....kkk.....', '...kdddk.y..', '..kdwdddkyy.', '..kddddkk...', '.kkddwwk....',
    'kddddwwwk...', 'kdBdwwwwk...', '.kddwwwk....', '..kkkkkk....', '...k..k.....', '..kk.kk.....'],
  'pupo-paladino': ['.....rr.....', '....krrk....', '...kggggk...', '...kgkkgk...', '...kggggk...', '....kggk....',
    '.kkkggggkk..', 'kbbkgggggk..', 'kbykggggk...', 'kbbkggggk...', '.kkkg..gk...', '....kk.kk...'],
  'zampognaro': ['....kkkk....', '...kmmmmk...', '..kkkkkkkk..', '...kcccck...', '...kckkck...', '....kcck....',
    '..kkvvvvk...', '.kskvvvvkk..', 'kssskvvkmmk.', '.kskvvvvkk..', '...kv..vk...', '...kk..kk...'],
  'civetta': ['..k......k..', '.kmk....kmk.', '.kmmkkkkmmk.', 'kmyykmmkyymk', 'kmykymmykymk', 'kmyykmmkyymk',
    '.kmmmkkmmmk.', '.kmsmmmmsmk.', '.kmmsmmsmmk.', '..kmmmmmmk..', '...kk..kk...', '...y....y...'],
  'topolino': ['............', '............', '.kk...kk....', 'kppk.kppk...', 'kppkkkppk...', '.kgggggk....',
    'kgkggkggk...', 'kggggggggk..', '.kgggggggk.p', '..kgggggk.p.', '..kkkkkkkp..', '............'],
  'lucciola-barattolo': ['...kkkkkk...', '...kmmmmk...', '..kkkkkkkk..', '..ka....ak..', '..k..yy..k..', '..k.yyyy.k..',
    '..k.yyky.k..', '..k..kk..k..', '..k......k..', '..ka....ak..', '..kaaaaaak..', '...kkkkkk...'],
  'cane-pastore': ['............', '.kk....kk...', 'kcck..kcck..', 'kccckkccck..', '.kcccccck...', '.kckcckck...',
    '.kccccccck..', '.kcckkccccck', '..kccccccck.', '..kcckkcck..', '..kck..kck..', '..kk....kk..'],
  'ciuccio': ['.k..k.......', 'kgk.kgk.....', 'kgk.kgk.....', 'kggkggk.....', 'kgggggkkkkk.', 'kgkgggmmmmmk',
    'kggggkmyymmk', '.kggggmmmmmk', '..kkgggggggk', '...kgkkkkgk.', '...kgk..kgk.', '...kk...kk..'],
  'fuochista': ['....kkk...y.', '...krrrk.yo.', '...kkkkk.k..', '...kccck.k..', '...kckck.k..', '....kck.kk..',
    '..kkmmmkck..', '.kckmmmkk...', '..kkmmmk....', '...kmmmk....', '...kd.dk....', '...kk.kk....'],
  // ------------------------------------------------------------------ ingresso in stanza
  'grancassa': ['..........kk', '...kkkkk.kck', '.kkrrrrrkkk.', 'krrkkkkkrrk.', 'krkwwwwwkrk.', 'krkwwwwwkrk.',
    'krkwwcwwkrk.', 'krkwwwwwkrk.', 'krkwwwwwkrk.', 'krrkkkkkrrk.', '.kkrrrrrkk..', '...kkkkk....'],
  'zolfo': ['...g....g...', '....g..g....', '...g....g...', '............', '.....kk.....', '....kyyk.k..',
    '.k.kyywykyk.', 'kykkyyyykyyk', 'kyykyyOykyOk', 'kyOkyOOykOOk', 'kkkkkkkkkkkk', '............'],
  'fuoco-elmo': ['.....a......', '....aaa.....', '...aawaa....', '...awwwa....', '...aawaa....', '....aaa.....',
    '.....k......', '..kkkkkkk...', '.....k......', '.....k......', '.....k......', '....kkk.....'],
  'naso-tartufaio': ['............', '.k........k.', '..k......k..', '...kkkkkk...', '...kssssk...', '...kscssk...',
    '..ksscsssk..', '..kssssssk..', '.kssssssssk.', '.kskksskksk.', '..kkkkkkkk..', '............'],
  // ------------------------------------------------------------------ stanza ripulita
  'cilindro-attore': ['............', '...kkkkkk...', '...kddddk...', '...kddddk...', '...kddddk...', '...kddddk...',
    '...krrrrk...', '...kddddk...', 'kkkkkkkkkkkk', 'kddddddddddk', '.kkkkkkkkkk.', '............'],
  'biglietto-bis': ['............', '............', 'kkkkkkk.kkkk', 'kcccccck.kck', 'kcrrcrckkcck', 'kcrcccck.kck',
    'kcrrcrckkcck', 'kcccccck.kck', 'kkkkkkk.kkkk', '............', '............', '............'],
  'cassetta-elemosine': ['............', '.kkkkkkkkkk.', '.kmmmkkmmmk.', '.kmmmmmmmmk.', 'kkkkkkkkkkkk', 'kmmmmyymmmmk',
    'kmmmyyyymmmk', 'kmmmmyymmmmk', 'kmmmmyymmmmk', 'kmMMMMMMMMmk', 'kkkkkkkkkkkk', '............'],
  'baba': ['............', '....kkkk....', '..kkooookk..', '.kooyooooOk.', '.koyooooOOk.', '.kooooooOOk.',
    '..kkkOOkkk..', '...kooOOk...', '...kooOOk...', '...kooOOk...', '...kkkkkk...', '............'],
  'cera-vergine': ['.....o......', '....oyo.....', '.....k......', '...kkkkkk...', '..kccccccsk.', '..kcscscssk.',
    '..kccccccsk.', '..kscscscsk.', '..kccccccsk.', '..kcscscssk.', '..kkkkkkkkk.', '............'],
  'grani-incenso': ['....g.......', '.....g......', '....g..g....', '.....g.g....', '......g.....', '............',
    '...y.y.y....', '..yoyoyoy...', '.kkkkkkkkk..', '.kMMMMMMMk..', '..kkkkkkk...', '............'],
  // ------------------------------------------------------------------ raccolta
  'ferro-calamitato': ['............', '..kkk..kkk..', '.krrk..krrk.', '.krrk..krrk.', '.kggk..kggk.', '.kggk..kggk.',
    '.kggk..kggk.', '.kgGk..kGgk.', '.kgGkkkkGgk.', '.kgGGGGGGgk.', '..kggggggk..', '...kkkkkk...'],
  'porcellino': ['............', '..kk....kk..', '.kOOk..kOOk.', '.kooooooook.', 'koookkkkooOk', 'kooooooooook',
    'kokoooooooOk', 'koooooooooOk', '.kooooooOOk.', '..kOkkkkOk..', '..kk....kk..', '............'],
  'zecchino': ['.w........w.', '....kkkk....', '..kkyyyykk..', '.kyywwyyyyk.', '.kywyyyyoyk.', 'kyywyyyyooyk',
    'kyyyyyyyooyk', '.kyyyyyooyk.', '.kyyyooooOk.', '..kkOOOOkk..', '.w..kkkk....', '.........w..'],
  'mazzo-portinaio': ['....kkkk....', '...kg..gk...', '...kg..gk...', '....kkkk....', '...k.kk.k...', '..kg.kg.gk..',
    '..kg.kg.gk..', '.kgk.kg.kgk.', '.kg..kg..gk.', '.kgk.kgk.gkk', '.kk..kk..kk.', '............'],
  'fiasca-polvere': ['........kk..', '.......kyk..', '......kyk...', '.....kkk....', '....kmmmk...', '...kmmmmmk..',
    '..kmmMmmmmk.', '..kmMmmmmmk.', '..kmmmmmmMk.', '..kmmmmmMMk.', '...kmmMMMk..', '....kkkkk...'],
  'santa-barbara': ['.kkkkkkkkkk.', '.kccyyyccck.', '.kccyyycgck.', '.kcckkkcgck.', '.kcckckcgck.', '.kcrrrrcggk.',
    '.kcrrrrcggk.', '.kcrrrrcggk.', '.kcrrrrcggk.', '.kcccccccck.', '.kkkkkkkkkk.', '............'],
  // ------------------------------------------------------------------ pubblico e notte
  'rosa-loggione': ['....kkkk....', '...krrrrk...', '..krRrrRrk..', '..krrRRrrk..', '..krRrrRrk..', '...krrrrk...',
    '....kkvk....', '.....kvk....', '...vvkvk....', '....vvvkvv..', '.....kvkv...', '.....kkk....'],
  'binocolo': ['............', '.kkkk..kkkk.', 'kyyyykkyyyyk', 'kyaaykkyaayk', 'kyaayyyyaayk', 'kyyyykkyyyyk',
    '.kkkk..kkkk.', '.........km.', '.........km.', '.........km.', '.........kk.', '............'],
  'pomodoro-marcio': ['............', '.....vv.....', '...vvVVvv...', '..kkkvvkkk..', '.krrrrrrrrk.', 'krrwrrrVrrrk',
    'krrrrrrrVVrk', 'krrVrrrrrrrk', '.krVVrrrRrk.', '..kkrrRRkk..', '.r..kkkk..r.', '..r.......r.'],
  'lunario': ['............', '.kkkkkkkkk..', '.kBBBBBBBkk.', '.kByyBBBBkck', '.kByBBBBBkck', '.kByBBBBBkck',
    '.kByyBBwBkck', '.kBBBBBBBkck', '.kBBwBBBBkck', '.kBBBBBBBkk.', '.kkkkkkkkk..', '............'],
  'luna-pozzo': ['....yyy.....', '...yy.......', '...yy.......', '....yyy.....', '............', '.kkkkkkkkkk.',
    'kgGgGgGgGgGk', 'kkkkkkkkkkkk', '.kBByyBBBBk.', '.kBBByBBBBk.', '.kGgGgGgGgk.', '.kkkkkkkkkk.'],
  // ------------------------------------------------------------------ bottega e stanze
  'polizza-monte': ['............', '..kkkkkkkk..', '..kcccccck..', '..kckkkkck..', '..kcccccck..', '..kckkkcck..',
    '..kcccccck..', '..kckkcrrk..', '..kcccrRRr..', '..kkkkkrrk..', '........r...', '............'],
  'bilancia-truccata': ['.....kk.....', '....kyyk....', '.kkkkyykkkk.', '.k...yy...k.', '.k...yy...k.', 'kkk..yy..kkk',
    'kyk..yy..kdk', '.k...yy...k.', '.....yy.....', '....yyyy....', '...kOOOOk...', '...kkkkkk...'],
  'indulgenza': ['............', '.kk......kk.', 'kcckkkkkkcck', 'kcsccyyccsck', 'kcscyyyycsck', 'kcsccyyccsck',
    'kcsccyyccsck', 'kcckkkkkkcck', '.kk......kk.', '....pppp....', '...pp..pp...', '............'],
  'doppio-fondo': ['............', '.kkkkkkkkkk.', 'kmmmmmmmmmmk', 'kmMMMMMMMMmk', 'kkkkkyykkkkk', 'kmmmmyymmmmk',
    'kmmmmmmmmmmk', 'kkkkkkkkkkkk', 'kMyMMMMMMyMk', 'kkkkkkkkkkkk', '............', '............'],
  // ------------------------------------------------------------------ a rischio (misti)
  'campana-vetro': ['.....kk.....', '....kaak....', '...kkkkkk...', '..ka....ak..', '.ka..rr..ak.', '.ka..rr..ak.',
    '.ka.rrrr.ak.', '.ka.rrrr.ak.', '.ka..rr..ak.', '.kaaaaaaaak.', 'kmmmmmmmmmmk', 'kkkkkkkkkkkk'],
  'moccolo': ['......o.....', '.....oyo....', '.....oyo....', '......k.....', '....kkkkk...', '....kcccck..',
    '...kkccckck.', '...kcccccck.', '.kkkkkkkkkkk', '.kGGGGGGGGGk', '..kkkkkkkkk.', '............'],
  'maschera-porcellana': ['...kkkkkk...', '..kwwwwwwk..', '.kwwwwwwwwk.', '.kwkkwwkkwk.', '.kwbkwwkbwk.', '.kwwwwwwwwk.',
    '.kwwwggwwwk.', '.kwwwwwwwwk.', '..kwwrrwwk..', '..kwwwwwwk..', '...kwwwwk...', '....kkkk....'],
  'fiasco-gragnano': ['.....kk.....', '.....kmk....', '.....krk....', '.....krk....', '....krrrk...', '...krrrrrk..',
    '..kssssssk..', '..ksesesek..', '..kesesesk..', '..ksesesek..', '...kssssk...', '....kkkk....'],
  'tromboncino': ['............', '............', 'kk......kkk.', 'kGkkkkkkkgGk', 'kGGGGGGGGgGk', 'kGkkkkkkkgGk',
    'kkmmmk..kkk.', '.kmmmmk.....', '..kmmMk.....', '...kmMk.....', '....kk......', '............'],
  // ------------------------------------------------------------------ negativi
  'tasca-bucata': ['............', '.kkkkkkkkkk.', '.kbbbbbbbbk.', '.kbkkkkkkbk.', '.kbbbbbbbbk.', '.kbbbbbbbbk.',
    '.kbbbkkbbbk.', '.kbbk..kbbk.', '..kbk..kbk..', '...kk..kk...', '.....yy.....', '.....yy.....'],
  'occhiali-appannati': ['............', '............', '.kkk....kkk.', 'kgggk..kgggk', 'kgwgkkkkgwgk', 'kgggk..kgggk',
    '.kkk....kkk.', 'k..........k', 'k..........k', '............', '............', '............'],
  'gatto-nero': ['.........k..', '.k......kdk.', 'kdk.....kdk.', 'kdkkkkk.kdk.', 'kyddddkkkdk.', 'kddddddddk..',
    '.kdddddddk..', '.kdddddddk..', '.kdkdkkdkdk.', '.kdkdk.kdkdk', '.kk.kk.kk.kk', '............'],
  'specchio-rotto': ['....kkkk....', '..kkaaaakk..', '.kaakaaaaak.', '.kaaakaawak.', '.kaakkkaaak.', '.kakaakaaak.',
    '.kaaaakaaak.', '..kkaaaakk..', '....kkkk....', '.....mm.....', '.....mm.....', '.....mm.....'],
  'miele-rappreso': ['............', '...kkkkkk...', '..kyyyyyyk..', '..kkkkkkkk..', '.kooooooook.', '.koyooooook.',
    '.kooooooOok.', '.kooooOOOok.', '..kooooook..', '...kkkkkk.y.', '..........y.', '.........yy.'],
  'iettatore': ['............', '...kkkkkk...', '..kddddddk..', '.kddkkkkddk.', '.kdkrwwrkdk.', '.kdkwkkwkdk.',
    '.kdkrwwrkdk.', '.kddkkkkddk.', '..kddddddk..', '...kkkkkkk..', '.........k..', '........k...'],
  'tarlo': ['............', 'kkkkkkkkkkkk', 'kmmmmmmmmmmk', 'kmmkmmmmmkmk', 'kmmmmccmmmmk', 'kmkmcsccmmmk',
    'kmmmmcscckmk', 'kmmmmmccmmmk', 'kmkmmmmmmmmk', 'kmmmmmkmmmmk', 'kkkkkkkkkkkk', '............'],
  'carlino-falso': ['............', '....kkkk....', '..kkggggkk..', '.kggwggkggk.', '.kgwggkgggk.', 'kgggggkggGGk',
    'kggggkgggGGk', '.kgggkggGGk.', '.kggkgGGGGk.', '..kkGGGGkk..', '....kkkk....', '............'],
  'filo-ingarbugliato': ['............', '..yy....yy..', '.y..y..y..y.', '.y...yy...y.', '..y.y..y.y..', '...yy..yy...',
    '..y.y..y.y..', '.y...yy...y.', '.y..y..y..y.', '..yy....yy..', '.....o......', '......o.....'],
  'ceppi-galeotto': ['............', '.kkk....kkk.', 'kGGGk..kGGGk', 'kG.Gk..kG.Gk', 'kG.GkkkkG.Gk', 'kGGGkGGkGGGk',
    '.kkk.kk.kkk.', '....kGGk....', '.....kk.....', '....kGGk....', '....kGGk....', '.....kk.....'],
  'ruggine': ['....kkkk....', '.kk.kOOk.kk.', 'kOOkkOOkkOOk', '.kOOOOOOOOk.', 'kkOOOkkOOOkk', 'kOOOk..kOOOk',
    'kOOOk..kOOOk', 'kkOOOkkOOOkk', '.kOOMOOOMOk.', 'kOOkkMMkkOOk', '.kk.kMMk.kk.', '....kkkk....'],
  'pane-raffermo': ['............', '...kkkkkk...', '..kssssssk..', '.ksseessssk.', '.ksessssesk.', '.kssssskssk.',
    '.ksessksssk.', '.kssskssssk.', '.kssssssesk.', '.keeeeeeeek.', '.kkkkkkkkkk.', '............'],
  // ------------------------------------------------------------------ solo numeri
  'zeppola': ['............', '.....rr.....', '....krrk....', '...kcccck...', '..kooccook..', '.kooocccoook',
    '.kooooooooOk', '.koookkoooOk', '.kooooooOOOk', '..kOOOOOOOk.', '...kkkkkkk..', '............'],
  'friarielli': ['..v...v..v..', '.vVv.vVvvVv.', '.vVVvVVvVVv.', '..vVVVVVVv..', '...vVVVVv...', '....vVVv....',
    '.kkkkkkkkk..', 'kRrRrRrRrRk.', 'krRrRrRrRrk.', '.kkkkkkkkk..', '............', '............'],
  'treccia-bufala': ['............', '....kkkk....', '...kwwwwk...', '..kwwkkwwk..', '..kwkwwkwk..', '...kwwwwk...',
    '..kwwkkwwk..', '..kwkwwkwk..', '...kwwwwk...', '..kwwkkwwk..', '..kwgwwgwk..', '...kkkkkk...'],
  'limone-sorrento': ['............', '......vv....', '.....vVVv...', '....kkvk....', '..kkyyyykk..', '.kyywyyyyyk.',
    'kyywyyyyyyyk', 'kyyyyyyyyyok', 'kyyyyyyyyook', '.kyyyyyyook.', '..kkyoookk..', '....kkkk....'],
  'ragu': ['...g...g....', '....g...g.m.', '...g...g.m..', '........m...', '.kkkkkkmkkk.', 'kkrrrrrmrrkk',
    '.krrRrrrrrk.', '.kGGGGGGGGk.', '.kGGGGGGGGk.', '.kGGgGGGGGk.', '..kGGGGGGk..', '...kkkkkk...'],
  'rosario-corallo': ['...rr.rr....', '..r.....r...', '.r.......r..', '.r.......r..', '.r.......r..', '..r.....r...',
    '...r...r....', '....r.r.....', '.....r......', '....kyk.....', '...kyyyk....', '....kyk.....'],
  'sigillo-borbone': ['............', '...rr.rrr...', '..rrrrrrrr..', '.rrrryyrrrr.', '.rrryyyyrrrr', 'rrrrryyrrrr.',
    'rrryryyryrr.', '.rrryyyyrrr.', '.rrrryyrrrr.', '..rrRRRRrr..', '...rRR.Rr...', '............'],
  'filo-ferro': ['............', '...kkkkkk...', '..kGGGGGGk..', '.kGkkkkkkGk.', '.kGkgggGkGk.', '.kGkgkkgkGk.',
    '.kGkgkGgkGk.', '.kGkgkkkkGk.', '.kGkggggGGk.', '..kGkkkkkk..', '...kGGGGGGkk', '....kkkkkkk.'],
  'croce-comando': ['.....kk.....', '.....mm.....', 'kkkkkmmkkkkk', 'kmmmmmmmmmmk', 'kkkkkmmkkkkk', 'y....mm....y',
    'y...kmmk...y', 'y....kk....y', 'y..........y', 'y....yy....y', '.....yy.....', '.....yy.....'],
  'dente-lupo': ['...m....m...', '....m..m....', '.....mm.....', '....kkkk....', '....kwwk....', '...kwwwwk...',
    '...kwwwck...', '...kwwwck...', '....kwwck...', '....kwck....', '.....kck....', '......k.....'],
  'tenaglie': ['.kk......kk.', 'kGGk....kGGk', '.kGGk..kGGk.', '..kGGkkGGk..', '...kGGGGk...', '....kyyk....',
    '...kGGGGk...', '..kGGkkGGk..', '..kmk..kmk..', '.kmk....kmk.', '.kmk....kmk.', '.kk......kk.'],
  'ombra-lunga': ['............', '..kk........', '.kcck.......', '.kcck.......', '..kk........', '.kcck.......',
    '.kcckD......', '.kk.kDDD....', '....DDDDDD..', '......DDDDDD', '........DDDD', '............'],
  // ------------------------------------------------------------------ patti
  'patto_eco': ['............', '...kk...kk..', '..kcck.kPPk.', '..kcck.kPPk.', '...kk...kk..', '..kcck.kPPk.',
    '.kcccckPPPPk', '.kcccckPPPPk', '.kcccckPPPPk', '..kcck.kPPk.', '..kk.k.kk.k.', '............'],
  'patto_fame': ['............', '..kkkkkkkk..', '.kRRRRRRRRk.', 'kRwRwRRwRwRk', 'kRwRwRRwRwRk', 'kRRkkkkkkRRk',
    'kRRkkkkkkRRk', 'kRwRwRRwRwRk', 'kRwRwRRwRwRk', '.kRRRRRRRRk.', '..kkkkkkkk..', '............'],
  'patto_trenta': ['....kkkk....', '...kPPPPk...', '....krrk....', '...kPPPPk...', '..kPPPPPPk..', '.kPPgPPPPPk.',
    '.kPgwgPPgPk.', '.kPPgPPgwgk.', '..kPPPPPgPk.', '...kkkkkkk..', '..g..g......', '.gwg.gg.....'],
  'patto_luna_nera': ['............', '....pppp....', '..ppkkkkpp..', '.pkkddkk.pp.', '.pkddk....p.', 'pkddk......p',
    'pkddk......p', '.pkddk....p.', '.pkkddkk.pp.', '..ppkkkkpp..', '....pppp....', '............'],
  'patto_nodo': ['.....yy.....', '.....yy.....', '.....yy.....', '....yyyy....', '....kyyk....', '....yyyy....',
    '...yy..yy...', '..yy....yy..', '..y......y..', '..yy....yy..', '...yy..yy...', '....yyyy....'],
  'patto_candela': ['.....p......', '....pPp.....', '....pwp.....', '.....p......', '....kkkk....', '....kddk....',
    '....kddkk...', '....kdddk...', '....kddk....', '....kddk....', '...kkddkk...', '..kkkkkkkk..'],
  // ------------------------------------------------------------------ segreti
  'lanterna_munaciello': ['.....kk.....', '....kMMk....', '...kMMMMk...', '..kMMMMMMk..', '..kkkkkkkk..', '..kvvyyvvk..',
    '..kvyyyyvk..', '..kvyywyvk..', '..kvvyyvvk..', '..kkkkkkkk..', '...kMMMMk...', '....kkkk....'],
  'tombola_piena': ['............', '...y.w.y....', '..ywywywy...', '.kkkkkkkkkk.', '.ksesesesek.', '.kesesesesk.',
    '..ksesesek..', '..kesesesk..', '...ksesek...', '...kkkkkk...', '............', '............'],
  'corona_latta': ['............', '.k...kk...k.', 'kgk.kggk.kgk', 'kgkkkggkkkgk', 'kggggggggggk', 'kgrggrrggrgk',
    'kggggggggggk', 'kGGGGGGGGGGk', 'kkkkkkkkkkkk', '............', '............', '............'],
  'presepe_intero': ['.....y......', '....ywy.....', '.....y......', '....kkkk....', '..kkmmmmkk..', 'kkmmmmmmmmkk',
    '.kkkkkkkkkk.', '.k.c.c..c.k.', '.k.b.r..v.k.', '.k.b.r..v.k.', '.kkkkkkkkkk.', '............'],
  'occhio_lucia': ['............', '..kkk..kkk..', '.kwwwkkwwwk.', '.kwbkwwkbwk.', '.kwwwkkwwwk.', '..kkk..kkk..',
    'kkkkkkkkkkkk', 'kggggggggggk', '.kgGGGGGGgk.', '..kkkkkkkk..', '....kggk....', '...kkkkkk...'],
  // ------------------------------------------------------------------ attivi [Q]
  'bussolotto': ['............', '..kkkkkk....', '..kmmmmk....', '.kmmmmmmk...', '.kmMmmmmk...', '.kmmmmMmk...',
    '.kmmmmmmk.kk', '.kkkkkkkkkwk', '.....kkkkkkk', '.....kwkwk..', '.....kwwwk..', '.....kkkkk..'],
  'cordone-sipario': ['.....yy.....', '.....yo.....', '.....oy.....', '.....yo.....', '.....oy.....', '....kyyk....',
    '...kyyyyk...', '....kyyk....', '...kyoyok...', '...kyoyok...', '...kyoyok...', '...k.k.k....'],
  'clessidra': ['.kkkkkkkkkk.', '.kmmmmmmmmk.', '..kaaaaaak..', '..kayyyyak..', '...kayyak...', '....kayk....',
    '....kayk....', '...kaayak...', '..kaayyaak..', '..kayyyyak..', '.kmmmmmmmmk.', '.kkkkkkkkkk.'],
  'tric-trac': ['.y..........', 'yoy.........', '.k..........', '.kkrrk......', '..krrkk.....', '....kkrrk...',
    '.....krrkk..', '.......kkrrk', '........krrk', '.......krrkk', '......krrk..', '......kkkk..'],
  'acquasantiera': ['............', 'kkkkkkkkkkkk', 'kgaaaaaaaagk', '.kgaawaaagk.', '..kggggggk..', '...kkggkk...',
    '....kggk....', '....kggk....', '....kggk....', '...kgGGgk...', '..kGGGGGGk..', '..kkkkkkkk..'],
  'specchio-camerino': ['.y.y.y.y.y..', 'ykkkkkkkkky.', '.kaaaaaaak..', 'ykaawaaaaky.', '.kawaaaaak..', 'ykaaaaaaaky.',
    '.kaaaaaaak..', 'ykaaaaawaky.', '.kkkkkkkkk..', 'y.y.y.y.y.y.', '...kmmmk....', '..kkkkkkk...'],
  'salvadanaio': ['.....kk.....', '....kOOk....', '...kkkkkk...', '..kOOkkOOk..', '.kOOooooOOk.', 'kOOoooooooOk',
    'kOooooooooOk', 'kOooooooooOk', 'kOOoooooOOMk', '.kOOOOOOMMk.', '..kkMMMMkk..', '....kkkk....'],
  'tazzulella': ['....g..g....', '...g..g.....', '....g..g....', '............', '.kkkkkkkk...', '.kwMMMMwkkk.',
    '.kwwwwwwk.wk', '.kwwwwwwk.wk', '.kwwwwwwkkk.', '..kwwwwk....', 'kkkkkkkkkkk.', '.kkkkkkkkk..'],
  'bacchetta-rabdomante': ['kk........kk', 'kmk......kmk', '.kmk....kmk.', '..kmk..kmk..', '...kmkkmk...', '....kmmk....',
    '....kmmk....', '....kmMk....', '....kmMk....', '....kmMk....', '....kMMk....', '.....kk.....'],
  'cilicio': ['............', '..k.k.k.k...', '.kkkkkkkkkk.', 'kGGGGGGGGGGk', 'kGkGkGkGkGGk', 'kGGGGGGGGGGk',
    '.kkkkkkkkkk.', '..k.k.k.k...', '...r....r...', '........r...', '...r........', '............'],
  'gabbia-cardellini': ['.....kk.....', '....kyyk....', '...kkkkkk...', '..ky.y..yk..', '.ky.y.y..yk.', '.ky.kyyk.yk.',
    '.ky.kyrk.yk.', '.ky..kk..yk.', '.ky.y..y.yk.', '.kyyyyyyyyk.', '.kkkkkkkkkk.', '............'],
  'trampoli': ['..kk....kk..', '..km....km..', '..km....km..', '..kmkk..kmkk', '..kmmk..kmmk', '..kmkk..kmkk',
    '..km....km..', '..km....km..', '..km....km..', '..km....km..', '..kM....kM..', '..kk....kk..'],
  'turibolo': ['.....kk.....', '....k..k....', '...k....k...', '..k..gg..k..', '..k.g..g.k..', '.kkkkkkkkkk.',
    '.kyyoyyoyyk.', 'kyykykkykyyk', 'kyyyyyyyyyyk', '.kyyOOOOyyk.', '..kkkyykkk..', '....kkkk....'],
  'calamita': ['............', '.g........g.', '..g......g..', 'kkkkkkkkkkkk', 'krrrrrwbbbbk', 'krrrrrbbbbbk',
    'krrrrrbbbbbk', 'kkkkkkkkkkkk', '..g......g..', '.g...gg...g.', '.....gg.....', '............'],
  'calza-befana': ['....kkkkkk..', '....kwwwwk..', '....krrrrk..', '....kwwwwk..', '....krrrrk..', '....kwwwwk..',
    '...kkrrrrk..', '.kkwwwwwwk..', 'kwwwrrrrrk..', 'krrrwwwwk...', '.kkkkkkk....', '............'],
};

/** Righe scritte male (lunghezza ≠ 12 o colore fuori palette): le legge la QA, in gioco vengono corrette. */
const ICONE_B5_DIFETTI = [];

/**
 * Riporta un'icona a 12 righe di 12 caratteri della palette (riempie con '.', taglia l'eccesso).
 * @param {string} id chiave dell'icona @param {string[]} righe @returns {string[]}
 */
function normalizzaIconaB5(id, righe) {
  const L = ICONE_B5_LATO;
  const out = [];
  for (let r = 0; r < L; r++) {
    let riga = String(righe[r] || '');
    if (riga.length !== L) ICONE_B5_DIFETTI.push(`${id}: riga ${r + 1} lunga ${riga.length}`);
    riga = riga.slice(0, L).padEnd(L, '.');
    let pulita = '';
    for (const ch of riga) {
      if (Object.prototype.hasOwnProperty.call(PALETTE, ch)) pulita += ch;
      else { pulita += '.'; ICONE_B5_DIFETTI.push(`${id}: colore «${ch}» fuori palette alla riga ${r + 1}`); }
    }
    out.push(pulita);
  }
  if (righe.length !== L) ICONE_B5_DIFETTI.push(`${id}: ${righe.length} righe`);
  return out;
}

for (const id of Object.keys(ICONE_B5)) {
  if (SPRITE_OGGETTI[id]) ICONE_B5_DIFETTI.push(`${id}: copre un'icona già esistente`);
  SPRITE_OGGETTI[id] = normalizzaIconaB5(id, ICONE_B5[id]);
}

// Colpi nuovi (stessa griglia 8×8 di SPRITE_PROIETTILI): d'oro (critici, caricati, quinto colpo) e d'ombra (eco del patto).
SPRITE_PROIETTILI.oro = ['..kkkk..', '.kyyyyk.', 'kywyyoOk', 'kyyyyoOk', 'kyyyooOk', 'kooooOOk', '.kOOOOk.', '..kkkk..'];
SPRITE_PROIETTILI.ombra = ['..kkkk..', '.kPPPPk.', 'kPpPPddk', 'kPPPPddk', 'kPPPdddk', 'kddddddk', '.kddddk.', '..kkkk..'];
