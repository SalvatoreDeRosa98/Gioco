"""Musica in loop per le sei aree di Ferruccio (composizione + arrangiamento + mix).

Lancio:  python3 tools/audio/music.py [nome ...]      (default: tutti)
Uscita:  src/assets/audio/music/<nome>.ogg  (OGG Vorbis q5, stereo, 44.1 kHz, loop perfetto)

Tavolozza comune: archi, pianoforte di feltro, arpa, celesta/carillon, mandolino
lontano, coro; ottoni gravi e percussioni solo per il Custode. Tonalità: re minore
con la sesta napoletana (Mi bemolle maggiore, spesso in primo rivolto Eb/G) e
inflessioni frigie (Mi bemolle sopra Re) per il colore locale.

Leitmotiv di Ferruccio (3/4, re minore): testa di 4 battute + coda di 4.
  testa: La Re Fa | Mib. Re Sib | La Sol Do# | Re    (Dm | N6 | A7 | Dm)
  coda:  Re Do-Sib La | Sol. La Sib | Sol Fa Mi | Re  (Bb | Gm | Eb>A7 | Dm)
Ogni area lo varia: piazza (pianoforte, poi mandolino lontano), menu (sarabanda
d'archi e coro), strada (frammenti alla viola sopra un ostinato di pizzicati
frigio), giardino (celesta/carillon e arpa), belvedere (archi larghi, poi in Fa
maggiore e cadenza piccarda in Re maggiore all'alba), oro (testa in emiola agli
ottoni gravi sopra una tarantella cupa in 6/8).

Seed fissi: ogni brano ha il suo generatore derivato dal nome (dsp.rng_for).
"""
from __future__ import annotations

import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import instruments as I  # noqa: E402
from dsp import (SR, curve, db, formant_curve, make_ir, master_loop, midi, write_ogg)  # noqa: E402
from score import Song  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "src", "assets", "audio", "music")

# ------------------------------------------------------------------ materiale tematico

HEAD = [("A4", 1), ("D5", 1), ("F5", 1), ("Eb5", 1.5), ("D5", 0.5), ("Bb4", 1),
		("A4", 1), ("G4", 1), ("C#5", 1), ("D5", 3)]
TAIL = [("D5", 1), ("C5", 0.5), ("Bb4", 0.5), ("A4", 1), ("G4", 1.5), ("A4", 0.5), ("Bb4", 1),
		("G4", 1), ("F4", 1), ("E4", 1), ("D4", 3)]
THEME = HEAD + TAIL
# la stessa testa in Fa maggiore (ricordo luminoso: Agnese, San Leucio)
HEAD_F = [("C5", 1), ("F5", 1), ("A5", 1), ("G5", 1.5), ("F5", 0.5), ("D5", 1),
		  ("C5", 1), ("Bb4", 1), ("E5", 1), ("F5", 3)]

# accordi: (basso, voci del pad)
CH = {
	"Dm": ("D2", ["D3", "A3", "D4", "F4"]),
	"Dm9": ("D2", ["D3", "A3", "E4", "F4"]),
	"Dm/C": ("C2", ["C3", "A3", "D4", "F4"]),
	"Dm/F": ("F2", ["F3", "A3", "D4"]),
	"N6": ("G2", ["G3", "Bb3", "Eb4", "G4"]),
	"Eb": ("Eb2", ["Eb3", "Bb3", "Eb4", "G4"]),
	"Ebmaj7": ("Eb2", ["Eb3", "Bb3", "D4", "G4"]),
	"Eb#11": ("Eb2", ["Bb2", "G3", "D4", "A4"]),
	"A7": ("A1", ["G3", "C#4", "E4"]),
	"A": ("A1", ["A3", "C#4", "E4"]),
	"Asus": ("A1", ["A3", "D4", "E4"]),
	"A7b9": ("A1", ["G3", "Bb3", "C#4", "E4"]),
	"Bb": ("Bb1", ["F3", "Bb3", "D4"]),
	"Bbmaj7": ("Bb1", ["F3", "A3", "D4"]),
	"Gm": ("G1", ["G3", "Bb3", "D4"]),
	"Gm6": ("G1", ["G3", "Bb3", "E4"]),
	"Gm7": ("G1", ["F3", "Bb3", "D4"]),
	"C": ("C2", ["G3", "C4", "E4"]),
	"C7": ("C2", ["G3", "Bb3", "E4"]),
	"F": ("F1", ["F3", "A3", "C4"]),
	"F/A": ("A1", ["F3", "A3", "C4"]),
	"D5": ("D2", ["D3", "A3", "D4"]),
	"D": ("D2", ["D3", "F#3", "A3", "D4"]),
	"Eb/D": ("D2", ["Bb3", "Eb4", "G4"]),
	"C#o7": ("C#2", ["E3", "G3", "Bb3"]),
	"Bb/D": ("D2", ["F3", "Bb3", "D4"]),
}


def up(p, k=12):
	return midi(p) + k


def segs(name: str, bpb: int) -> list[tuple[str, float, float]]:
	"""Accordi di una battuta: "Eb>A7" = Eb fino al penultimo tempo, A7 sull'ultimo."""
	if ">" in name:
		a, b = name.split(">")
		return [(a, 0.0, bpb - 1.0), (b, bpb - 1.0, 1.0)]
	return [(name, 0.0, float(bpb))]


def low(p):
	"""Porta il basso sopra il Do grave (i contrabbassi sintetici scendono male)."""
	return up(p, 12) if midi(p) < midi("C2") else midi(p)


def arp6(name: str):
	"""Figura di barcarola (6 crome) sull'accordo: basso, voci, ritorno."""
	b, v = CH[name]
	bass = low(b)
	if len(v) >= 4:
		return [bass, v[1], v[2], v[3], v[2], v[1]]
	return [bass, v[0], v[1], v[2], v[1], v[0]]


# ------------------------------------------------------------------ EQ e riverberi

EQ = {
	"strings": curve([(35, -18), (70, -3), (180, 0.5), (300, 1.5), (600, 0), (1300, -2.5), (2600, -0.5), (4200, -3),
					  (7000, -11), (12000, -24)]),
	"violins": curve([(120, -14), (250, -3), (500, 0), (1300, -2.5), (2600, 0), (4200, -3), (7000, -11), (12000, -24)]),
	"low": curve([(25, -16), (40, -3), (80, 0), (300, 0), (800, -3), (2000, -9), (5000, -20)]),
	"piano": curve([(35, -14), (80, -2), (200, 1), (900, 0), (2500, -2), (5000, -6), (9000, -15)]),
	"felt": curve([(35, -14), (80, -2), (200, 1.5), (700, 0), (1800, -3), (3500, -8), (7000, -18)]),
	"mand_far": curve([(100, -24), (250, -8), (450, 1), (900, 0), (1600, -2), (2600, -7), (4000, -15), (6000, -26), (9000, -40)]),
	"harp": curve([(45, -12), (120, 0), (1500, 0), (4000, -3), (8000, -12)]),
	"celesta": curve([(150, -18), (400, -3), (900, 0), (3500, -1), (6500, -7), (11000, -18)]),
	"brass": curve([(35, -14), (70, 0), (250, 1), (700, 0), (1500, -3), (3000, -9), (6000, -22)]),
	"perc": curve([(25, -20), (45, -4), (70, 0), (150, 0), (800, -3), (3000, -8), (8000, -16)]),
	"pizz": curve([(40, -14), (90, 0), (300, 2), (1000, 0), (2500, -3), (5000, -10), (9000, -22)]),
	"bell_far": curve([(120, -20), (250, -4), (600, 0), (1500, -3), (3000, -10), (6000, -22)]),
}
VOWEL_A = formant_curve([(720, 140, 0), (1150, 170, -5), (2550, 280, -15), (3350, 340, -22), (300, 300, -10)], -30)
VOWEL_O = formant_curve([(480, 120, 0), (850, 140, -4), (2500, 260, -18), (3300, 340, -24), (250, 250, -8)], -30)


def irs():
	return {
		"hall": make_ir(4.8, 3.4, 1.3, predelay=0.03, seed=11),
		"cathedral": make_ir(7.5, 5.8, 2.0, predelay=0.05, diffusion=0.06, seed=12),
		"room": make_ir(2.2, 1.3, 0.55, predelay=0.012, seed=13),
		"far": make_ir(6.5, 4.6, 1.5, predelay=0.07, diffusion=0.08, tone_hz=4500, seed=14),
	}



def _vel_arc(lo=0.85, hi=1.1):
	"""Fraseggio: le note centrali un po' più forti delle estreme."""
	def f(i, n):
		x = i / max(1, n - 1)
		return lo + (hi - lo) * np.sin(np.pi * x)
	return f


def pad_bar(s: Song, stem: str, name: str, bar: int, vel: float, inst=I.strings, octave: int = 0, top: int = 0,
			pan_spread: float = 0.4, **kw) -> None:
	"""Accordo tenuto per una battuta (gestisce i cambi a metà battuta)."""
	for ch, b0, nb in segs(name, s.bpb):
		v = CH[ch][1][-top:] if top else CH[ch][1]
		s.chord(stem, inst, [up(p, octave) for p in v], bar, b0, nb, vel, pan_spread=pan_spread, jitter=0.02, **kw)


def bass_bar(s: Song, stem: str, name: str, bar: int, vel: float, inst=I.strings, octave: int = 0, **kw) -> None:
	for ch, b0, nb in segs(name, s.bpb):
		s.note(stem, inst, up(low(CH[ch][0]), octave), bar, b0, nb, vel, 0.0, jitter=0.015, **kw)


def arp_bar(s: Song, stem: str, inst, name: str, bar: int, vel: float, step: float = 0.5, lift: int = 0,
			dur: float = 0.9, pan0: float = -0.15, dpan: float = 0.06, **kw) -> None:
	"""Figura di barcarola: basso, voci, ritorno (crome)."""
	for ch, b0, nb in segs(name, s.bpb):
		f = arp6(ch)
		for j in range(int(round(nb / step))):
			p = f[j % 6]
			if lift and j % 6:
				p = up(p, lift)
			s.note(stem, inst, p, bar, b0 + j * step, dur, vel * (1.2 if j == 0 else 1.0), pan0 + dpan * j, **kw)


def lh_bar(s: Song, stem: str, inst, name: str, bar: int, vel_b: float, vel_c: float, **kw) -> None:
	"""Mano sinistra a sarabanda: basso sul primo tempo, accordo sul secondo."""
	for idx, (ch, b0, nb) in enumerate(segs(name, s.bpb)):
		b, v = CH[ch]
		bass = low(b)
		bass = up(bass) if bass < midi("D2") else bass
		s.note(stem, inst, bass, bar, b0, nb, vel_b, -0.2, **kw)
		cb = b0 + 1 if nb >= 2 else b0
		s.chord(stem, inst, v[:3], bar, cb, nb - (cb - b0), vel_c, pan_spread=0.15, strum=0.03, **kw)


# ------------------------------------------------------------------ PIAZZA DANTE

def song_piazza() -> tuple[Song, dict, float]:
	"""Notte in piazza: pianoforte col tema, mandolino lontano, archi in sordina."""
	s = Song("piazza", bpm=60, beats_per_bar=3, bars=40)
	TH = ["Dm", "N6", "A7", "Dm", "Bb", "Gm", "Eb>A7", "Dm"]
	DEV = ["F", "Gm7", "C7", "F", "Dm", "Bb", "Eb>A7", "A7"]
	plan = ["Dm", "Dm9", "N6", "A7"] + TH + TH + DEV + ["Dm", "N6", "A7", "Dm"] * 2 + ["Dm9", "Bb", "N6", "A7"]
	assert len(plan) == 40
	for i, name in enumerate(plan):
		bar = i + 1
		vel = 0.42 if 21 <= bar <= 28 else (0.32 if bar <= 4 or bar >= 37 else 0.36)
		pad_bar(s, "pad", name, bar, vel, attack=0.7, release=1.4, brightness=0.4, swell=0.3)
		bass_bar(s, "bass", name, bar, 0.38, voices=3, attack=0.6, release=1.3, dark_fc=420, bright_fc=1400,
				 brightness=0.35)

	# intro: rintocchi di pianoforte acuti, come campane lontane
	for bar, p in [(1, "A5"), (2, "F5"), (3, "G5"), (4, "E5")]:
		s.note("piano", I.piano, p, bar, 0, 2.5, 0.32, 0.15, pedal=2.0, bright=0.3)
		s.note("piano", I.piano, up(p, -12), bar, 1.5, 1.5, 0.18, -0.1, pedal=1.5, bright=0.25)

	# tema al pianoforte (bb. 5-12), mano sinistra a sarabanda
	s.melody("piano", I.piano, THEME, 5, vel=0.5, shape=_vel_arc(0.85, 1.12), pedal=0.6, bright=0.4, jitter=0.012)
	for i, name in enumerate(TH):
		lh_bar(s, "piano", I.piano, name, 5 + i, 0.36, 0.22, pedal=0.4, bright=0.3)

	# seconda volta (bb. 13-20): mandolino lontano col tema, pianoforte in barcarola
	s.melody("mand", I.mandolin, THEME, 13, vel=0.55, shape=_vel_arc(0.9, 1.1), jitter=0.01, tremolo=12.5)
	for i, name in enumerate(TH):
		arp_bar(s, "piano", I.piano, name, 13 + i, 0.25, pedal=0.8, bright=0.3, jitter=0.01)
	counter = [("F5", 3), ("G5", 3), ("E5", 3), ("F5", 3), ("F5", 3), ("D5", 3), ("Eb5", 2), ("C#5", 1), ("D5", 3)]
	s.melody("violins", I.strings_flautando, counter, 13, vel=0.3)

	# sviluppo (bb. 21-28): il violoncello canta la testa in Fa maggiore, poi la coda
	cello = [("C4", 1), ("F4", 1), ("A4", 1), ("G4", 1.5), ("F4", 0.5), ("D4", 1), ("C4", 1), ("Bb3", 1), ("E4", 1),
			 ("F4", 3), ("A4", 1), ("G4", 0.5), ("F4", 0.5), ("E4", 1), ("F4", 1.5), ("E4", 0.5), ("D4", 1),
			 ("Eb4", 1), ("D4", 1), ("C#4", 1), ("A3", 3)]
	s.melody("cello", I.strings, cello, 21, vel=0.55, shape=_vel_arc(0.85, 1.1), voices=3, attack=0.18, release=0.7,
			 vib=16, brightness=0.55, swell=0.35, detune=4)
	for i, name in enumerate(DEV):
		arp_bar(s, "piano", I.piano, name, 21 + i, 0.2, lift=12, dur=0.8, pedal=0.8, bright=0.28, pan0=0.1, dpan=0.0)

	# ricordo (bb. 29-36): la testa due volte, pianoforte acuto + arpa; il mandolino risponde da lontano
	s.melody("piano", I.piano, HEAD, 29, vel=0.42, transpose=12, pedal=1.0, bright=0.3, shape=_vel_arc(0.9, 1.1))
	s.melody("harp", I.harp, HEAD, 29, vel=0.4)
	s.melody("piano", I.piano, HEAD[:9] + [("D5", 1.5), ("A4", 1.5)], 33, vel=0.36, transpose=12, pedal=1.2,
			 bright=0.28)
	s.melody("mand", I.mandolin, [("D5", 1), ("C5", 0.5), ("Bb4", 0.5), ("A4", 1), ("G4", 1.5), ("A4", 0.5),
								  ("Bb4", 1), ("A4", 6)], 33, vel=0.42, tremolo=12.0)
	for i, name in enumerate(["Dm", "N6", "A7", "Dm"] * 2):
		b, v = CH[name]
		s.note("harp", I.harp, up(low(b)) if low(b) < midi("D2") else low(b), 29 + i, 0, 3, 0.45, -0.2)
		s.chord("harp", I.harp, v[-3:], 29 + i, 1, 2, 0.28, strum=0.06)

	# coda (bb. 37-40): torna il buio, il pad conduce all'inizio
	s.melody("violins", I.strings_flautando, [("A5", 3), ("F5", 3), ("G5", 3), ("E5", 3)], 37, vel=0.28)

	s.automate("pad", [(1, -2), (5, 0), (21, 1.5), (29, 0), (37, -1.5), (40, -2)])
	settings = {
		"pad": dict(level=-27, eq=EQ["strings"], send=0.45, width=1.2),
		"bass": dict(level=-29, eq=EQ["low"], send=0.3),
		"piano": dict(level=-21, eq=EQ["felt"], send=0.42),
		"mand": dict(level=-27, eq=EQ["mand_far"], send=1.1, rev="far", width=0.5, dry=0.55),
		"violins": dict(level=-31, eq=EQ["violins"], send=0.6, width=1.3),
		"cello": dict(level=-22, eq=EQ["strings"], send=0.4),
		"harp": dict(level=-27, eq=EQ["harp"], send=0.5),
	}
	return s, settings, -16.0


# ------------------------------------------------------------------ MENU (Reggia)

def song_menu() -> tuple[Song, dict, float]:
	"""Reggia: sarabanda solenne e triste, coro, campane lontane."""
	s = Song("menu", bpm=52, beats_per_bar=3, bars=32)
	TH = ["Dm", "N6", "A7", "Dm", "Bb", "Gm", "Eb>A7", "Dm"]
	SOLO = ["Gm", "Dm/F", "Eb", "A7", "Dm", "Bb", "N6", "A7"]
	plan = ["Dm", "Bb", "Gm", "A"] + TH + TH + SOLO + ["Dm", "N6", "A7", "A7"]
	assert len(plan) == 32
	for i, name in enumerate(plan):
		bar = i + 1
		full = 13 <= bar <= 20 or bar >= 29
		vel = 0.42 if full else 0.34
		# sarabanda: accordo sul primo tempo, nuova arcata accentata sul secondo
		for ch, b0, nb in segs(name, 3):
			v = CH[ch][1]
			s.chord("pad", I.strings, v, bar, b0, min(1.1, nb), vel * 0.9, pan_spread=0.4, attack=0.35, release=0.6,
					swell=0)
			if nb >= 2:
				s.chord("pad", I.strings, v, bar, b0 + 1, nb - 1, vel, pan_spread=0.4, attack=0.3, release=1.4,
						swell=0.3, accent=0.25)
		bass_bar(s, "bass", name, bar, 0.45, voices=4, attack=0.4, release=1.5, dark_fc=380, bright_fc=1300,
				 brightness=0.4)
		bass_bar(s, "bass", name, bar, 0.3, octave=-12 if low(CH[segs(name, 3)[0][0]][0]) >= midi("E2") else 0,
				 voices=2, attack=0.6, release=1.5, dark_fc=250, bright_fc=700, brightness=0.3)
		if bar <= 4 or full:
			pad_bar(s, "choir", name, bar, 0.4 if bar > 4 else 0.3, inst=I.choir, top=3, pan_spread=0.5)
		if 13 <= bar <= 20 or 29 <= bar <= 31:
			pad_bar(s, "brass", name, bar, 0.3, inst=I.brass, top=0, pan_spread=0.2, attack=0.4, release=0.9)

	# campane lontane della Reggia (la terza minore della campana è nel modo giusto)
	for bar, p, v in [(1, "D4", 0.5), (3, "G3", 0.4), (21, "G3", 0.25), (29, "D4", 0.45), (30, "G3", 0.35)]:
		s.note("bell", I.bell, p, bar, 0, 3, v, 0.25)
	# timpani: rulli che portano alle sezioni, colpi sui punti forti
	for bar in (4, 12, 32):
		for k in range(18):
			s.note("timp", I.timpani, "A1", bar, 1.0 + k * (2.0 / 18), 0.3, 0.12 + 0.25 * k / 17, 0, ring=1.6,
				   jitter=0.003)
	for bar in (5, 13, 16, 20, 29):
		s.note("timp", I.timpani, "D2", bar, 0, 1, 0.55, 0)

	# tema ai violoncelli (bb. 5-12)
	s.melody("cello", I.strings, THEME, 5, vel=0.58, transpose=-12, shape=_vel_arc(0.85, 1.12), voices=4, attack=0.2,
			 release=0.8, vib=14, brightness=0.55, swell=0.35)
	# tema ai violini, le viole all'ottava sotto (bb. 13-20)
	s.melody("violins", I.strings, THEME, 13, vel=0.6, transpose=12, shape=_vel_arc(0.85, 1.12), voices=5,
			 attack=0.2, release=0.9, vib=13, brightness=0.5, swell=0.35)
	s.melody("cello", I.strings, THEME, 13, vel=0.45, shape=_vel_arc(0.85, 1.1), voices=4, attack=0.2, release=0.9,
			 vib=12, brightness=0.45)
	# pianoforte solo, intimo (bb. 21-28)
	piano_line = [("Bb4", 1), ("A4", 0.5), ("G4", 0.5), ("D4", 1), ("F4", 1.5), ("G4", 0.5), ("A4", 1),
				  ("G4", 1), ("F4", 1), ("Eb4", 1), ("D4", 1), ("C#4", 1), ("E4", 1),
				  ("F4", 1), ("E4", 0.5), ("D4", 0.5), ("A4", 1), ("D5", 1.5), ("C5", 0.5), ("Bb4", 1),
				  ("Bb4", 1), ("G4", 1), ("Eb5", 1), ("D5", 1), ("C#5", 2)]
	s.melody("piano", I.piano, piano_line, 21, vel=0.48, shape=_vel_arc(0.85, 1.15), pedal=0.8, bright=0.38)
	for i, name in enumerate(SOLO):
		lh_bar(s, "piano", I.piano, name, 21 + i, 0.32, 0.2, pedal=0.5, bright=0.3)
	# ritorno (bb. 29-32): la testa ai violini, sospesa sul La
	s.melody("violins", I.strings, HEAD[:9] + [("E5", 3)], 29, vel=0.58, transpose=12, voices=5, attack=0.2,
			 release=1.2, vib=13, brightness=0.5, swell=0.35)
	s.automate("pad", [(1, -3), (5, -1), (13, 1), (21, -2), (29, 1), (32, 0)])
	settings = {
		"pad": dict(level=-25, eq=EQ["strings"], send=0.5, rev="cathedral", width=1.2),
		"bass": dict(level=-27, eq=EQ["low"], send=0.35, rev="cathedral"),
		"choir": dict(level=-30, eq=lambda f: VOWEL_A(f) * EQ["violins"](f), send=0.7, rev="cathedral", width=1.3),
		"brass": dict(level=-30, eq=EQ["brass"], send=0.55, rev="cathedral"),
		"bell": dict(level=-29, eq=EQ["bell_far"], send=1.2, rev="cathedral", dry=0.4),
		"timp": dict(level=-28, eq=EQ["perc"], send=0.5, rev="cathedral"),
		"cello": dict(level=-21, eq=EQ["strings"], send=0.45, rev="cathedral"),
		"violins": dict(level=-21, eq=EQ["violins"], send=0.5, rev="cathedral", width=1.2),
		"piano": dict(level=-21, eq=EQ["felt"], send=0.5, rev="cathedral"),
	}
	return s, settings, -17.0


# ------------------------------------------------------------------ CORSO TRIESTE

PZ = {  # ostinati di pizzicato (8 crome), inquieti: vicino frigio e sospiri
	"Dm": ["D2", "A2", "D3", "Eb3", "D3", "A2", "Bb2", "A2"],
	"Dm'": ["D2", "A2", "D3", "Eb3", "F3", "Eb3", "D3", "A2"],
	"Eb": ["Eb2", "Bb2", "Eb3", "D3", "Eb3", "Bb2", "G2", "Bb2"],
	"Bb": ["Bb1", "F2", "D3", "Eb3", "D3", "F2", "Bb2", "A2"],
	"Gm": ["G1", "D2", "G2", "A2", "Bb2", "D2", "Bb2", "A2"],
	"A": ["A1", "E2", "A2", "Bb2", "A2", "E2", "G2", "C#3"],
}


def song_strada() -> tuple[Song, dict, float]:
	"""Corso Trieste sotto la pioggia: ostinato di pizzicati, frammenti del tema, inquietudine."""
	s = Song("strada", bpm=80, beats_per_bar=4, bars=40)
	THEMEBARS = ["Dm", "Eb", "A", "Dm", "Bb", "Gm", "Eb>A", "Dm"]
	plan = (["Dm", "Dm", "Dm'", "Eb", "Dm", "Dm'", "Bb", "A"] + THEMEBARS
			+ ["Dm", "Dm'", "Eb", "Eb", "Bb", "Gm", "Eb>A", "A"]
			+ ["Bb", "Bb", "Gm", "Gm", "Eb", "Eb", "A", "A"] + THEMEBARS)
	assert len(plan) == 40
	for i, name in enumerate(plan):
		bar = i + 1
		thin = 25 <= bar <= 28
		pat = []
		for ch, b0, nb in segs(name, 4):
			pat += PZ[ch][int(b0 * 2):int((b0 + nb) * 2)]
		for k, p in enumerate(pat):
			if thin and k not in (0, 3, 6):
				continue
			acc = 0.62 if k in (0, 3) else (0.5 if k == 6 else 0.4)
			if 17 <= bar <= 24:
				acc *= 1.12
			s.note("pizz", I.pizz, p, bar, k * 0.5, 0.45, acc, -0.25 + 0.07 * k, jitter=0.006)
		# viole pizz in controtempo
		if 9 <= bar <= 24 or bar >= 33:
			for ch, b0, nb in segs(name, 4):
				v = CH[ch.rstrip("'")][1]
				for beat in (1.5, 3.5):
					if b0 <= beat < b0 + nb:
						s.note("pizz", I.pizz, v[-2] if beat == 1.5 else v[-1], bar, beat, 0.4, 0.3, 0.35, jitter=0.006)
		# bordone grave
		s.note("drone", I.sine_pad, CH[segs(name, 4)[0][0].rstrip("'")][0], bar, 0, 4, 0.35, 0, attack=0.8,
			   release=1.5)

	# armonico acuto (bb. 1-8 e 33-40)
	s.melody("high", I.strings_flautando, [("A5", 12), ("G5", 4), ("A5", 8), ("A5", 8)], 1, vel=0.26, vib=4)
	s.melody("high", I.strings_flautando, [("A5", 8), ("Bb5", 8), ("A5", 16)], 33, vel=0.24, vib=4)
	# viola: la testa in 4/4, poi la coda (bb. 9-16)
	viola = [("A3", 2), ("D4", 1), ("F4", 1), ("Eb4", 3), ("D4", 0.5), ("Bb3", 0.5), ("A3", 2), ("G3", 1),
			 ("C#4", 1), ("D4", 4),
			 ("D4", 2), ("C4", 1), ("Bb3", 1), ("G3", 3), ("A3", 0.5), ("Bb3", 0.5), ("G3", 2), ("F3", 1),
			 ("E3", 1), ("D3", 4)]
	s.melody("viola", I.strings, viola, 9, vel=0.55, shape=_vel_arc(0.85, 1.12), voices=3, attack=0.15, release=0.6,
			 vib=12, brightness=0.5, swell=0.3, detune=4)
	# tremolo d'archi (bb. 17-24) e la coda ai violini, più in alto, che resta sospesa sul Do#
	trem = [["D4", "F4"], ["D4", "F4"], ["Eb4", "G4"], ["D4", "G4"], ["D4", "Bb4"], ["D4", "Bb4"], ["Bb3", "G4"],
			["C#4", "G4"]]
	for i, ps in enumerate(trem):
		s.chord("trem", I.strings, [up(p, 12) for p in ps], 17 + i, 0, 4, 0.42 + 0.03 * i, pan_spread=0.5,
				tremolo=0.75, trem_rate=13, attack=0.25, release=0.5, swell=0.4, brightness=0.55)
	s.melody("viola", I.strings, viola[10:19] + [("C#4", 4)], 21, vel=0.5, transpose=12, voices=4, attack=0.2,
			 release=0.7, vib=12, brightness=0.5, swell=0.3)
	for bar in range(17, 25):
		s.note("timp", I.timpani, "D2" if bar < 23 else "A1", bar, 0, 1, 0.35 + 0.03 * (bar - 17), 0, ring=1.8)
	for k in range(24):
		s.note("timp", I.timpani, "A1", 24, 1.0 + k * (3.0 / 24), 0.2, 0.15 + 0.35 * k / 23, 0, ring=1.4, jitter=0.003)

	# pausa (bb. 25-32): frammenti acuti di pianoforte, come gocce
	frag = [(25, 0, "D6"), (25, 1.5, "C6"), (25, 3, "Bb5"), (26, 1, "A5"), (27, 0, "G5"), (27, 2.5, "A5"),
			(27, 3, "Bb5"), (28, 2, "G5"), (29, 0, "Eb6"), (29, 1, "D6"), (29, 2.5, "Bb5"), (30, 1.5, "G5"),
			(31, 0, "A5"), (31, 1, "G5"), (31, 2, "C#6"), (32, 0, "E5"), (32, 2, "A5")]
	for bar, beat, p in frag:
		s.note("piano", I.piano, p, bar, beat, 1.5, 0.3, 0.25, pedal=1.5, bright=0.3, jitter=0.02)
	for bar, p in [(25, "Bb2"), (27, "G2"), (29, "Eb2"), (31, "A2")]:
		s.note("piano", I.piano, p, bar, 0, 6, 0.3, -0.3, pedal=1.0, bright=0.25)

	# ritorno (bb. 33-40): la testa ai violoncelli, sospiri dei violini
	s.melody("cello", I.strings, viola, 33, vel=0.55, shape=_vel_arc(0.85, 1.1), voices=4, attack=0.16, release=0.7,
			 vib=13, brightness=0.5, swell=0.3)
	sighs = [("F5", 3), ("E5", 1), ("Eb5", 3), ("D5", 1), ("C#5", 4), ("D5", 4), ("D5", 3), ("C5", 1), ("Bb4", 4),
			 ("G4", 3), ("E4", 1), ("D4", 4)]
	s.melody("trem", I.strings_flautando, sighs, 33, vel=0.32)
	s.automate("pizz", [(1, -1), (8, 0), (17, 1), (24, 1.5), (25, -2), (32, -1), (33, 0), (40, 0)])
	settings = {
		"pizz": dict(level=-22, eq=EQ["pizz"], send=0.35, rev="hall", width=1.1),
		"drone": dict(level=-32, eq=EQ["low"], send=0.1),
		"high": dict(level=-32, eq=EQ["violins"], send=0.7, width=1.3),
		"viola": dict(level=-22, eq=EQ["strings"], send=0.4),
		"cello": dict(level=-22, eq=EQ["strings"], send=0.4),
		"trem": dict(level=-27, eq=EQ["violins"], send=0.5, width=1.2),
		"timp": dict(level=-27, eq=EQ["perc"], send=0.4),
		"piano": dict(level=-25, eq=EQ["felt"], send=0.6),
	}
	return s, settings, -16.0


# ------------------------------------------------------------------ VILLA COMUNALE

def song_giardino() -> tuple[Song, dict, float]:
	"""Villa Comunale: mistero, celesta e arpa, quasi un carillon."""
	s = Song("giardino", bpm=72, beats_per_bar=3, bars=48)
	TH = ["Dm9", "N6", "A7", "Dm", "Bbmaj7", "Gm6", "Eb#11>A7", "Dm9"]
	intro = ["Dm9", "Bbmaj7", "Gm6", "Asus"]
	mystery = ["Eb#11", "Dm9", "Eb#11", "A7", "Bbmaj7", "Gm6", "Eb#11", "A7"]
	plan = intro + TH + TH + mystery + TH + intro * 3
	assert len(plan) == 48
	for i, name in enumerate(plan):
		bar = i + 1
		hv = 0.34 if (bar <= 4 or bar >= 37) else 0.28
		# arpa: arpeggio ascendente in crome
		for ch, b0, nb in segs(name, 3):
			b, v = CH[ch]
			pat = [up(low(b)) if low(b) < midi("D2") else low(b)] + list(v) + [up(v[1]), up(v[2])]
			for k in range(int(nb * 2)):
				s.note("harp", I.harp, pat[k], bar, b0 + k * 0.5, 1.0, hv * (1.15 if k == 0 else 1), -0.35 + 0.12 * k,
					   jitter=0.008)
		# archi sul tasto, altissimi e lontani
		pad_bar(s, "pad", name, bar, 0.26, inst=I.strings_flautando, octave=12, top=3, pan_spread=0.5)
		if 21 <= bar <= 28 or bar >= 37:
			s.note("pizz", I.pizz, low(CH[segs(name, 3)[0][0]][0]), bar, 0, 1, 0.45, 0)

	# celesta: il tema all'ottava alta (bb. 5-12), un po' di rubato
	s.melody("celesta", I.celesta, THEME, 5, vel=0.55, transpose=12, shape=_vel_arc(0.9, 1.1), jitter=0.015)
	# arpa col tema, celesta a scintille sulle note dell'accordo (bb. 13-20)
	s.melody("harp", I.harp, THEME, 13, vel=0.5, shape=_vel_arc(0.9, 1.1))
	for i in range(8):
		bar = 13 + i
		for k, beat in enumerate((0.5, 1.5, 2.5)):
			sg = [c for c, b0, nb in segs(TH[i], 3) if b0 <= beat < b0 + nb][0]
			v = CH[sg][1]
			s.note("celesta", I.celesta, up(v[(k + i) % len(v)], 24), bar, beat, 0.4, 0.3, 0.3 - 0.2 * k, jitter=0.01)
	# carillon solo, misterioso (bb. 21-28): la testa a frammenti
	box = [("A5", 1), ("D6", 1), ("F6", 1), (None, 1.5), ("E6", 0.5), ("D6", 1), ("Eb6", 1.5), ("D6", 0.5),
		   ("Bb5", 1), ("A5", 1), ("G5", 1), ("C#6", 1), ("D6", 1.5), (None, 1.5), ("D6", 1), ("C6", 0.5),
		   ("Bb5", 0.5), ("A5", 1), ("G5", 1.5), ("A5", 0.5), ("Bb5", 1), ("G5", 1), ("F5", 1), ("E5", 1)]
	s.melody("box", I.music_box, box, 21, vel=0.55, jitter=0.02)
	# il tema intero, celesta e arpa all'ottava (bb. 29-36), archi sotto
	s.melody("celesta", I.celesta, THEME, 29, vel=0.5, transpose=12, shape=_vel_arc(0.9, 1.1))
	s.melody("harp", I.harp, THEME, 29, vel=0.42)
	s.melody("strings", I.strings, [("D4", 3), ("Eb4", 3), ("C#4", 3), ("D4", 3), ("D4", 3), ("Bb3", 3), ("G3", 2),
									("A3", 1), ("A3", 3)], 29, vel=0.34, attack=0.8, release=1.4, brightness=0.4,
			 swell=0.4)
	# coda (bb. 37-48): il carillon ripete le prime note, sempre più rado
	for bar, beat, p, v in [(37, 0, "A5", 0.42), (37, 1, "D6", 0.38), (37, 2, "F6", 0.36), (39, 0, "G5", 0.36),
							(39, 1, "Bb5", 0.32), (39, 2, "D6", 0.3), (41, 0, "A5", 0.3), (41, 1.5, "D6", 0.26),
							(43, 0, "E6", 0.26), (43, 2, "D6", 0.22), (45, 0, "A5", 0.22), (47, 1, "Bb5", 0.2),
							(48, 0, "E6", 0.16)]:
		s.note("box", I.music_box, p, bar, beat, 1, v, 0.15)
	s.automate("harp", [(1, 0), (13, 0), (21, -2), (29, 0), (37, -1), (48, -1)])
	settings = {
		"harp": dict(level=-23, eq=EQ["harp"], send=0.55, width=1.2),
		"pad": dict(level=-32, eq=EQ["violins"], send=0.7, width=1.3),
		"celesta": dict(level=-22, eq=EQ["celesta"], send=0.6, width=1.1),
		"box": dict(level=-22, eq=EQ["celesta"], send=0.7),
		"pizz": dict(level=-28, eq=EQ["pizz"], send=0.4),
		"strings": dict(level=-28, eq=EQ["strings"], send=0.5),
	}
	return s, settings, -17.0


# ------------------------------------------------------------------ BELVEDERE DI SAN LEUCIO

def song_belvedere() -> tuple[Song, dict, float]:
	"""San Leucio all'alba nella nebbia: archi ampi, fili di seta d'arpa, Re maggiore al culmine."""
	s = Song("belvedere", bpm=46, beats_per_bar=3, bars=32)
	plan = ["D5", "D5", "Eb/D", "D5",
			"Dm", "Eb", "A", "Dm", "Bb", "Gm", "Eb>A", "Dm",
			"F", "Gm7", "C7", "F", "Dm", "Bb", "Gm", "A",
			"Bb", "F/A", "Gm", "Eb", "Bb/D", "C", "Asus>A", "D",
			"D5", "Eb/D", "D5", "D5"]
	assert len(plan) == 32
	for i, name in enumerate(plan):
		bar = i + 1
		climax = 21 <= bar <= 28
		vel = 0.48 if climax else (0.3 if bar <= 4 or bar >= 29 else 0.38)
		pad_bar(s, "pad", name, bar, vel, pan_spread=0.5, attack=1.0, release=1.8, swell=0.35,
				brightness=0.45 + (0.15 if climax else 0))
		pad_bar(s, "pad", name, bar, vel * 0.6, octave=12, top=2, pan_spread=0.6, attack=1.2, release=2.0,
				brightness=0.4)
		bass_bar(s, "bass", name, bar, 0.42 + (0.08 if climax else 0), voices=4, attack=0.9, release=2.0, dark_fc=380,
				 bright_fc=1200, brightness=0.4)
		bass_bar(s, "bass", name, bar, 0.3, inst=I.sine_pad, attack=1.5, release=2.0)
		if bar <= 4 or bar >= 29 or climax:
			pad_bar(s, "choir", name, bar, 0.35, inst=I.choir, octave=12, top=2, pan_spread=0.6, vib=10)
		# fili di seta: arpeggi rapidi dell'arpa che salgono e si perdono nella nebbia
		if bar % 2 == 1 or climax:
			v = CH[segs(name, 3)[0][0]][1]
			for k in range(10):
				p = up(v[k % len(v)], 12 * (k // len(v)))
				s.note("harp", I.harp, p, bar, 1.0 + k * 0.18, 0.5, 0.16 + 0.02 * np.sin(k), -0.5 + 0.1 * k,
					   jitter=0.004)
	# armonici dei violini all'alba
	s.melody("high", I.strings_flautando, [("A5", 6), ("Bb5", 3), ("A5", 3)], 1, vel=0.3)
	s.melody("high", I.strings_flautando, [("A5", 3), ("Bb5", 3), ("A5", 3), ("D6", 3)], 29, vel=0.28)
	# tema ai violini, ampio (bb. 5-12)
	s.melody("violins", I.strings, THEME, 5, vel=0.55, shape=_vel_arc(0.85, 1.12), voices=6, attack=0.35, release=1.2,
			 vib=12, brightness=0.5, swell=0.4)
	# in Fa maggiore: luce, il ricordo di Agnese (bb. 13-20)
	f_tail = [("F5", 1), ("E5", 0.5), ("D5", 0.5), ("C5", 1), ("D5", 1.5), ("E5", 0.5), ("F5", 1), ("Bb4", 1),
			  ("A4", 1), ("G4", 1), ("A4", 3)]
	s.melody("violins", I.strings, HEAD_F + f_tail, 13, vel=0.55, shape=_vel_arc(0.85, 1.12), voices=6, attack=0.35,
			 release=1.2, vib=12, brightness=0.52, swell=0.4)
	s.melody("cello", I.strings, [("F3", 3), ("Bb3", 3), ("Bb3", 1.5), ("C4", 1.5), ("A3", 3), ("A3", 3), ("D4", 3),
								  ("D4", 2), ("C4", 1), ("C#4", 3)], 13, vel=0.45, voices=4, attack=0.4, release=1.2,
			 vib=12, brightness=0.45, swell=0.4)
	# culmine (bb. 21-28): violini e violoncelli a distanza di due ottave, cadenza piccarda
	climax_line = [("D5", 3), ("C5", 3), ("Bb4", 1.5), ("A4", 0.5), ("G4", 1), ("G4", 3), ("F4", 1), ("Bb4", 1),
				   ("D5", 1), ("E5", 3), ("E5", 1.5), ("D5", 0.5), ("C#5", 1), ("D5", 3)]
	s.melody("violins", I.strings, climax_line, 21, vel=0.66, transpose=12, shape=_vel_arc(0.9, 1.1), voices=6,
			 attack=0.3, release=1.4, vib=13, brightness=0.55, swell=0.35)
	s.melody("cello", I.strings, climax_line, 21, vel=0.55, transpose=-12, voices=4, attack=0.3, release=1.4, vib=12,
			 brightness=0.5, swell=0.35)
	s.automate("pad", [(1, -3), (5, -1), (13, 0), (21, 2), (28, 2), (29, -2), (32, -3)])
	settings = {
		"pad": dict(level=-25, eq=EQ["strings"], send=0.55, width=1.3),
		"bass": dict(level=-27, eq=EQ["low"], send=0.35),
		"choir": dict(level=-32, eq=lambda f: VOWEL_O(f) * EQ["violins"](f), send=0.8, width=1.3),
		"harp": dict(level=-29, eq=EQ["harp"], send=0.7, width=1.3),
		"high": dict(level=-32, eq=EQ["violins"], send=0.8, width=1.3),
		"violins": dict(level=-21, eq=EQ["violins"], send=0.5, width=1.2),
		"cello": dict(level=-23, eq=EQ["strings"], send=0.45),
	}
	return s, settings, -16.0


# ------------------------------------------------------------------ CORTILE D'ONORE (boss)

OST = {  # ostinato di tarantella cupa (6 crome per battuta) con la seconda frigia
	"D": ["D3", "D3", "Eb3", "D3", "C3", "D3"],
	"D'": ["D3", "D3", "Eb3", "F3", "Eb3", "D3"],
	"Eb": ["Eb3", "Eb3", "E3", "Eb3", "D3", "Eb3"],
	"F": ["F3", "F3", "Gb3", "F3", "Eb3", "F3"],
	"G": ["G2", "G2", "Ab2", "G2", "F2", "G2"],
	"A": ["A2", "A2", "Bb2", "A2", "G2", "A2"],
	"Bb": ["Bb2", "Bb2", "B2", "Bb2", "A2", "Bb2"],
}
TIMP = {"D": "D2", "D'": "D2", "Eb": "Eb2", "F": "F2", "G": "G2", "A": "A1", "Bb": "Bb1"}


def song_oro() -> tuple[Song, dict, float]:
	"""Il Custode: tarantella cupa in 6/8, ottoni gravi in emiola, percussioni profonde."""
	s = Song("oro", bpm=300, beats_per_bar=6, bars=96)  # 'tempo' = croma; battuta = 1.2 s
	HEADR = ["D", "D'", "Eb", "Eb", "A", "A", "D", "D'"]  # la testa in emiola dura 8 battute
	roots = (["D", "D'"] * 4                                # 1-8 intro
			 + HEADR * 2                                    # 9-24 ottoni
			 + ["Bb", "G", "A", "D"] * 4                    # 25-40 violini
			 + ["D", "D'"] * 2 + ["Eb"] * 4 + ["A"] * 4 + ["D", "D'"] * 2  # 41-56 pausa (coro)
			 + ["D", "D", "Eb", "Eb", "F", "F", "G", "G", "A", "A", "Bb", "Bb", "A", "A", "A", "A"]  # 57-72 salita
			 + HEADR * 2                                    # 73-88 pieno
			 + ["Bb", "G", "A", "D'"]                       # 89-92 violini
			 + ["Bb", "Bb", "A", "A"])                      # 93-96 ponte verso l'inizio
	assert len(roots) == 96, len(roots)

	def section(bar):
		for lim, name in ((8, "intro"), (24, "brass"), (40, "violins"), (56, "break"), (72, "build"), (92, "full")):
			if bar <= lim:
				return name
		return "bridge"

	for i, r in enumerate(roots):
		bar = i + 1
		sec = section(bar)
		vel_base = {"intro": 0.55, "brass": 0.6, "violins": 0.6, "break": 0.42, "build": 0.5 + 0.012 * (bar - 57),
					"full": 0.68, "bridge": 0.62}[sec]
		for k, p in enumerate(OST[r]):
			if sec == "break" and k not in (0, 2, 3, 5):
				continue
			acc = 1.2 if k in (0, 3) else 0.9
			s.note("ost", I.spiccato, p, bar, k, 0.55, vel_base * acc, -0.15, jitter=0.004)
			s.note("ost", I.spiccato, up(p, -12), bar, k, 0.55, vel_base * acc * 0.85, 0.15, jitter=0.004,
				   dark_fc=450, bright_fc=2000)
		# gran cassa
		bd = {"intro": (0, 3), "brass": (0, 3), "violins": (0, 3), "break": (0,) if bar % 2 == 1 else (),
			  "build": (0, 3) if bar < 65 else (0, 2, 3, 5), "full": (0, 3), "bridge": (0, 2, 3, 5)}[sec]
		for k in bd:
			s.note("drums", I.bass_drum, "A1" if k == 0 else "D2", bar, k, 1, 0.85 if k == 0 else 0.62, 0, jitter=0.002)
		# tammorra
		if sec in ("brass", "violins", "full", "bridge") or (sec == "build" and bar >= 61):
			for k in range(6):
				s.note("tamb", I.frame_drum, "F3", bar, k, 0.5, 0.55 if k in (0, 3) else 0.3, 0.3 if k % 2 else -0.2,
					   jitter=0.004, jingle=0.35 if k in (0, 3) else 0.18, open_=k in (0, 3))
		if sec in ("intro", "full") and bar % 2 == 0:
			s.note("drums", I.timpani, "A1", bar, 5, 1, 0.55, 0.1, ring=1.6)
		if sec in ("brass", "violins", "full"):
			s.note("timp", I.timpani, TIMP[r], bar, 0, 3, 0.45, -0.1, ring=2.0)
	# rulli di timpano prima delle sezioni
	for bar in (8, 24, 40, 56, 72, 92):
		for k in range(24):
			s.note("timp", I.timpani, "A1", bar, k * 0.25, 0.2, 0.15 + 0.5 * k / 23, 0, ring=1.2, jitter=0.002)
	# colpi d'ottone nell'intro e nel ponte
	for bar, ch in ((1, ["D2", "A2", "D3"]), (3, ["D2", "A2", "D3"]), (5, ["D2", "A2", "D3"]), (7, ["D2", "A2", "D3"]),
					(93, ["Bb1", "F2", "Bb2"]), (95, ["A1", "E2", "A2"])):
		s.chord("brass", I.brass, ch, bar, 0, 2.5, 0.75, pan_spread=0.3, attack=0.05, release=0.4)
	# la testa in emiola: ogni tempo del 3/4 originale = 4 crome
	head_h = [(p, d * 4) for p, d in HEAD]
	for bar0, oct_, v in [(9, -24, 0.62), (17, -12, 0.6), (73, -24, 0.68), (81, -12, 0.66)]:
		s.melody("brass", I.brass, head_h, bar0, vel=v, transpose=oct_, attack=0.12, release=0.5)
		if oct_ == -12:
			s.melody("brass", I.brass, head_h, bar0, vel=v * 0.8, transpose=-24, attack=0.12, release=0.5)
	# tremolo acuto degli archi sotto gli ottoni
	trem_plan = {9: ["D5", "F5"], 11: ["Eb5", "G5"], 13: ["C#5", "E5"], 15: ["D5", "F5"], 17: ["D5", "A5"],
				 19: ["Eb5", "Bb5"], 21: ["C#5", "G5"], 23: ["D5", "F5"]}
	for base in (0, 64):
		for bar, ps in trem_plan.items():
			s.chord("trem", I.strings, ps, bar + base, 0, 12, 0.42, pan_spread=0.5, tremolo=0.8, trem_rate=14,
					attack=0.3, release=0.4, brightness=0.5)
	# violini: la coda in tarantella (bb. 25-40 e 89-92)
	tar = [("D5", 2), ("C5", 1), ("Bb4", 2), ("A4", 1), ("G4", 2), ("A4", 1), ("Bb4", 3), ("G4", 2), ("F4", 1),
		   ("E4", 2), ("C#4", 1), ("D4", 6)]
	for bar0, tr in [(25, 0), (29, 0), (33, 12), (37, 0), (89, 0)]:
		s.melody("violins", I.strings, tar, bar0, vel=0.6, transpose=tr, voices=5, attack=0.03, release=0.25, vib=8,
				 brightness=0.6, swell=0, accent=0.3)
		s.melody("violins", I.strings, tar, bar0, vel=0.45, transpose=tr - 12, voices=4, attack=0.03, release=0.25,
				 vib=8, brightness=0.55, swell=0, accent=0.3)
	for bar0 in (25, 29, 33, 37):
		for i, name in enumerate(["Bb", "Gm", "A", "Dm"]):
			s.chord("brass", I.brass, [up(p, -12) for p in CH[name][1][:2]], bar0 + i, 0, 5.5, 0.5, pan_spread=0.3,
					attack=0.2)
	# pausa: il coro di Gregorio canta la testa lentissima (1 tempo = 8 crome), campana lontana
	s.melody("choir", I.choir, [(p, d * 8) for p, d in HEAD], 41, vel=0.5, transpose=-12, attack=1.0, release=1.5)
	for bar in (41, 53):
		s.note("bell", I.bell, "D3", bar, 0, 6, 0.6, 0.3, ring=6.0)
	# salita: gli ottoni tengono le radici che crescono
	for i, r in enumerate(roots[56:72]):
		if i % 2 == 0:
			p = midi(OST[r][0])
			lo_ = p - 12 if p >= midi("E3") else p
			s.chord("brass", I.brass, [lo_, lo_ + 7], 57 + i, 0, 11.5, 0.45 + 0.025 * i, pan_spread=0.2, attack=0.4)
	s.automate("ost", [(1, 0), (41, -3), (56, -3), (57, -2), (72, 1), (73, 1), (96, 1)])
	settings = {
		"ost": dict(level=-22, eq=EQ["strings"], send=0.22, rev="hall"),
		"drums": dict(level=-23, eq=EQ["perc"], send=0.3, rev="hall"),
		"timp": dict(level=-27, eq=EQ["perc"], send=0.35, rev="hall"),
		"tamb": dict(level=-31, eq=curve([(80, -10), (150, 0), (1500, -2), (4000, -6), (8000, -14)]), send=0.25,
					 rev="room", width=1.2),
		"brass": dict(level=-21, eq=EQ["brass"], send=0.4, rev="hall"),
		"trem": dict(level=-29, eq=EQ["violins"], send=0.45, width=1.3),
		"violins": dict(level=-22, eq=EQ["violins"], send=0.35, width=1.2),
		"choir": dict(level=-25, eq=lambda f: VOWEL_O(f) * EQ["strings"](f), send=0.7, rev="cathedral", width=1.2),
		"bell": dict(level=-28, eq=EQ["bell_far"], send=1.0, rev="cathedral", dry=0.4),
	}
	return s, settings, -14.0


SONGS = {
	"menu": song_menu,
	"piazza": song_piazza,
	"strada": song_strada,
	"giardino": song_giardino,
	"belvedere": song_belvedere,
	"oro": song_oro,
}


def render(name: str, out_dir: str = OUT, quality: float = 5.0, wav_dir: str | None = None) -> str:
	t0 = time.time()
	s, settings, target = SONGS[name]()
	print(f"  {name}: {s.seconds:.1f} s, {len(s.stems)} stem, composto in {time.time() - t0:.1f} s")
	mix = s.mix(settings, IRS)
	mix = master_loop(mix, target)
	path = os.path.join(out_dir, f"{name}.ogg")
	write_ogg(path, mix, quality)
	if wav_dir:
		from dsp import write_wav
		write_wav(os.path.join(wav_dir, f"{name}.wav"), mix)
	print(f"  {name}: scritto {path} ({os.path.getsize(path) / 1e6:.2f} MB) in {time.time() - t0:.1f} s")
	return path


IRS: dict = {}


def _render_one(name: str) -> str:
	global IRS
	if not IRS:
		IRS = irs()
	return render(name)


def main(names: list[str]) -> None:
	"""Rende i brani richiesti (tutti se la lista è vuota), in parallelo su più processi."""
	from concurrent.futures import ProcessPoolExecutor
	names = names or list(SONGS)
	workers = max(1, min(len(names), (os.cpu_count() or 2), 4))
	with ProcessPoolExecutor(workers) as ex:
		for path in ex.map(_render_one, names):
			print("  ok", path)


if __name__ == "__main__":
	main(sys.argv[1:])
