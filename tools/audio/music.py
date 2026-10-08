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
	"Eb/D": ("D2", ["Eb3", "Bb3", "G4"]),
	"C#o7": ("C#2", ["E3", "G3", "Bb3"]),
	"Bb/D": ("D2", ["F3", "Bb3", "D4"]),
}


def up(p, k=12):
	return midi(p) + k


def arp6(name: str):
	"""Figura di barcarola (6 crome) sull'accordo: basso, voci, ritorno."""
	b, v = CH[name]
	b3 = up(b) if midi(b) < midi("C2") + 7 else midi(b)
	return [up(b3, 12) if b3 < midi("D2") else b3, v[0], v[1], v[-1], v[1], v[0]]


# ------------------------------------------------------------------ EQ e riverberi

EQ = {
	"strings": curve([(35, -18), (70, -3), (180, 0.5), (300, 1.5), (600, 0), (1300, -2.5), (2600, -0.5), (4200, -3),
					  (7000, -11), (12000, -24)]),
	"violins": curve([(120, -14), (250, -3), (500, 0), (1300, -2.5), (2600, 0), (4200, -3), (7000, -11), (12000, -24)]),
	"low": curve([(25, -16), (40, -3), (80, 0), (300, 0), (800, -3), (2000, -9), (5000, -20)]),
	"piano": curve([(35, -14), (80, -2), (200, 1), (900, 0), (2500, -2), (5000, -6), (9000, -15)]),
	"felt": curve([(35, -14), (80, -2), (200, 1.5), (700, 0), (1800, -3), (3500, -8), (7000, -18)]),
	"mand_far": curve([(100, -24), (250, -8), (450, 1), (900, 0), (1800, -1), (3200, -6), (5500, -16), (9000, -30)]),
	"harp": curve([(45, -12), (120, 0), (1500, 0), (4000, -3), (8000, -12)]),
	"celesta": curve([(150, -18), (400, -3), (900, 0), (3500, -1), (6500, -7), (11000, -18)]),
	"brass": curve([(35, -14), (70, 0), (250, 1), (700, 0), (1500, -3), (3000, -9), (6000, -22)]),
	"perc": curve([(22, -14), (40, 0), (150, 0), (800, -3), (3000, -8), (8000, -16)]),
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


def pads(s: Song, stem: str, plan: list[str], start_bar: int, vel=0.4, inst=I.strings, bass_stem=None, bass_vel=0.4,
		 beats=None, octave=0, bass_inst=None, **kw):
	"""Accordi tenuti (una battuta ciascuno) con basso opzionale."""
	beats = beats or s.bpb
	for i, name in enumerate(plan):
		if name is None:
			continue
		b, v = CH[name]
		bar = start_bar + i
		s.chord(stem, inst, [up(p, octave) for p in v], bar, 0, beats, vel, pan_spread=0.35, jitter=0.02, **kw)
		if bass_stem:
			bi = bass_inst or I.strings
			s.note(bass_stem, bi, up(b, 12) if midi(b) < midi("C2") else b, bar, 0, beats, bass_vel, 0.0,
				   voices=3, attack=0.5, release=1.2, dark_fc=500, bright_fc=1600, brightness=0.4, jitter=0.015)


# ------------------------------------------------------------------ PIAZZA DANTE

def song_piazza() -> tuple[Song, dict, str, float]:
	"""Notte in piazza: pianoforte col tema, mandolino lontano, archi in sordina."""
	s = Song("piazza", bpm=60, beats_per_bar=3, bars=40)
	TH = ["Dm", "N6", "A7", "Dm", "Bb", "Gm", "Eb", "Dm"]
	plan = ["Dm", "Dm9", "N6", "A7"] + TH + TH + ["F", "Gm7", "C7", "F", "Dm", "Bb", "Eb", "A7"] \
		+ ["Dm", "N6", "A7", "Dm"] * 2 + ["Dm9", "Bb", "N6", "A7"]
	# pad d'archi in sordina, ogni battuta
	for i, name in enumerate(plan):
		bar = i + 1
		vel = 0.32 if bar <= 4 or bar >= 37 else 0.36
		if 21 <= bar <= 28:
			vel = 0.42
		b, v = CH[name]
		s.chord("pad", I.strings, v, bar, 0, 3, vel, pan_spread=0.4, jitter=0.02, attack=0.7, release=1.4,
				brightness=0.4, swell=0.3)
		s.note("bass", I.strings, up(b, 12) if midi(b) < midi("C2") else b, bar, 0, 3, 0.38, 0, voices=3,
			   attack=0.6, release=1.3, dark_fc=420, bright_fc=1400, brightness=0.35)
		if name == "Eb":  # cambio a metà battuta: Eb -> A7 (cadenza napoletana)
			pass
	# Eb>A7 nella battuta 7 del tema: ultimo tempo sul La
	for bar in (11, 19):
		s.note("bass", I.strings, "A2", bar, 2, 1.2, 0.36, 0, voices=3, attack=0.25, release=0.9, dark_fc=420,
			   bright_fc=1400, brightness=0.35)

	# intro: rintocchi di pianoforte acuti, come campane lontane
	for bar, p in [(1, "A5"), (2, "F5"), (3, "G5"), (4, "E5")]:
		s.note("piano", I.piano, p, bar, 0, 2.5, 0.32, 0.15, pedal=2.0, bright=0.3)
		s.note("piano", I.piano, up(p, -12), bar, 1.5, 1.5, 0.18, -0.1, pedal=1.5, bright=0.25)

	# tema al pianoforte (bb. 5-12), mano sinistra a sarabanda
	s.melody("piano", I.piano, THEME, 5, vel=0.5, shape=_vel_arc(0.85, 1.12), pedal=0.6, bright=0.4, jitter=0.012)
	for i, name in enumerate(TH):
		b, v = CH[name]
		bar = 5 + i
		bass = up(b, 12) if midi(b) < midi("A1") + 3 else b
		bass = up(bass, 12) if midi(bass) < midi("D2") else bass
		s.note("piano", I.piano, bass, bar, 0, 3, 0.36, -0.2, pedal=0.5, bright=0.3)
		s.chord("piano", I.piano, v[:3], bar, 1, 2, 0.24, pan_spread=0.15, pedal=0.3, bright=0.3, strum=0.03)

	# seconda volta (bb. 13-20): mandolino lontano col tema, pianoforte in barcarola
	s.melody("mand", I.mandolin, THEME, 13, vel=0.55, shape=_vel_arc(0.9, 1.1), jitter=0.01, tremolo=12.5)
	for i, name in enumerate(TH):
		bar = 13 + i
		notes = arp6(name)
		for k, p in enumerate(notes):
			s.note("piano", I.piano, p, bar, k * 0.5, 0.9, 0.26 + (0.06 if k == 0 else 0), -0.15 + 0.06 * k,
				   pedal=0.8, bright=0.3, jitter=0.01)
	counter = [("F5", 3), ("G5", 3), ("E5", 3), ("F5", 3), ("F5", 3), ("D5", 3), ("Eb5", 2), ("C#5", 1), ("D5", 3)]
	s.melody("violins", I.strings_flautando, counter, 13, vel=0.3)

	# sviluppo (bb. 21-28): il violoncello canta la testa in Fa maggiore, poi la coda
	cello = [("C4", 1), ("F4", 1), ("A4", 1), ("G4", 1.5), ("F4", 0.5), ("D4", 1), ("C4", 1), ("Bb3", 1), ("E4", 1),
			 ("F4", 3), ("A4", 1), ("G4", 0.5), ("F4", 0.5), ("E4", 1), ("F4", 1.5), ("E4", 0.5), ("D4", 1),
			 ("Eb4", 1), ("D4", 1), ("C#4", 1), ("A3", 3)]
	s.melody("cello", I.strings, cello, 21, vel=0.55, shape=_vel_arc(0.85, 1.1), voices=3, attack=0.18, release=0.7,
			 vib=16, brightness=0.55, swell=0.35, detune=4)
	for i, name in enumerate(["F", "Gm7", "C7", "F", "Dm", "Bb", "Eb", "A7"]):
		bar = 21 + i
		for k, p in enumerate(arp6(name)):
			s.note("piano", I.piano, up(p, 12) if k > 0 else p, bar, k * 0.5, 0.8, 0.2, 0.1, pedal=0.8, bright=0.28)

	# ricordo (bb. 29-36): la testa due volte, pianoforte acuto + arpa
	s.melody("piano", I.piano, HEAD, 29, vel=0.42, transpose=12, pedal=1.0, bright=0.3, shape=_vel_arc(0.9, 1.1))
	s.melody("harp", I.harp, HEAD, 29, vel=0.4, legato=1.0)
	s.melody("piano", I.piano, HEAD[:9] + [("D5", 1.5), ("A4", 1.5)], 33, vel=0.36, transpose=12, pedal=1.2,
			 bright=0.28)
	s.melody("mand", I.mandolin, [("D5", 1), ("C5", 0.5), ("Bb4", 0.5), ("A4", 1), ("G4", 1.5), ("A4", 0.5),
								  ("Bb4", 1), ("A4", 6)], 33, beat=0, vel=0.42, tremolo=12.0)
	for i, name in enumerate(["Dm", "N6", "A7", "Dm"] * 2):
		bar = 29 + i
		b, v = CH[name]
		s.note("harp", I.harp, up(b, 12) if midi(b) < midi("D2") else b, bar, 0, 3, 0.45, -0.2)
		s.chord("harp", I.harp, v[-3:], bar, 1, 2, 0.28, strum=0.06)

	# coda (bb. 37-40): torna il buio, il pad conduce all'inizio
	s.melody("violins", I.strings_flautando, [("A5", 3), ("F5", 3), ("G5", 3), ("E5", 3)], 37, vel=0.28)

	s.automate("pad", [(1, -2), (5, 0), (21, 1.5), (29, 0), (37, -1.5), (40, -2)])
	settings = {
		"pad": dict(gain=-2, eq=EQ["strings"], send=0.45, width=1.2),
		"bass": dict(gain=-3, eq=EQ["low"], send=0.3),
		"piano": dict(gain=1, eq=EQ["felt"], send=0.42, width=1.0),
		"mand": dict(gain=-9, eq=EQ["mand_far"], send=1.1, rev="far", width=0.5, dry=0.55),
		"violins": dict(gain=-5, eq=EQ["violins"], send=0.6, width=1.3),
		"cello": dict(gain=-1, eq=EQ["strings"], send=0.4),
		"harp": dict(gain=-4, eq=EQ["harp"], send=0.5),
	}
	return s, settings, "hall", -16.0


# ------------------------------------------------------------------ MENU (Reggia)

def song_menu() -> tuple[Song, dict, str, float]:
	"""Reggia: sarabanda solenne e triste, coro, campane lontane."""
	s = Song("menu", bpm=52, beats_per_bar=3, bars=32)
	TH = ["Dm", "N6", "A7", "Dm", "Bb", "Gm", "Eb", "Dm"]
	plan = ["Dm", "Bb", "Gm", "A"] + TH + TH + ["Gm", "Dm/F", "Eb", "A7", "Dm", "Bb", "N6", "A7"] + \
		["Dm", "N6", "A7", "A7"]
	for i, name in enumerate(plan):
		bar = i + 1
		b, v = CH[name]
		# sarabanda: accento sul secondo tempo (nuova arcata)
		vel = 0.42 if 13 <= bar <= 20 or bar >= 29 else 0.34
		s.chord("pad", I.strings, v, bar, 0, 1.1, vel * 0.9, pan_spread=0.4, attack=0.35, release=0.6, swell=0)
		s.chord("pad", I.strings, v, bar, 1, 2, vel, pan_spread=0.4, attack=0.3, release=1.4, swell=0.3, accent=0.25)
		bb = up(b, 12) if midi(b) < midi("C2") else b
		s.note("bass", I.strings, bb, bar, 0, 3, 0.45, 0, voices=4, attack=0.4, release=1.5, dark_fc=380,
			   bright_fc=1300, brightness=0.4)
		s.note("bass", I.strings, up(bb, -12) if midi(bb) >= midi("E2") else bb, bar, 0, 3, 0.3, 0, voices=2,
			   attack=0.6, release=1.5, dark_fc=250, bright_fc=700, brightness=0.3)
		if bar <= 4 or 13 <= bar <= 20 or bar >= 29:
			s.chord("choir", I.choir, [up(p, 12) for p in v[1:]], bar, 0, 3, 0.4 if bar > 4 else 0.3,
					pan_spread=0.5)
		if 13 <= bar <= 20 or 29 <= bar <= 31:
			s.chord("brass", I.brass, [v[0], v[1]], bar, 0, 3, 0.32, pan_spread=0.2, attack=0.4, release=0.9)
	for bar in (11, 19):
		s.note("bass", I.strings, "A2", bar, 2, 1.2, 0.4, 0, voices=3, attack=0.25, release=1.0, dark_fc=380,
			   bright_fc=1300, brightness=0.4)

	# campane lontane della Reggia
	for bar, p, v in [(1, "D4", 0.5), (3, "A3", 0.4), (29, "D4", 0.45), (31, "A3", 0.4), (21, "F4", 0.25)]:
		s.note("bell", I.bell, p, bar, 0, 3, v, 0.25)
	# timpani: rulli che portano alle sezioni
	for bar in (4, 12, 32):
		for k in range(18):
			s.note("timp", I.timpani, "A1", bar, 1.0 + k * (2.0 / 18), 0.3, 0.12 + 0.25 * k / 17, 0, ring=1.6,
				   jitter=0.003)
	for bar in (5, 13, 16, 20, 29):
		s.note("timp", I.timpani, "D2", bar, 0, 1, 0.55, 0)

	# tema ai violoncelli (bb. 5-12)
	s.melody("cello", I.strings, THEME, 5, vel=0.58, transpose=-12, shape=_vel_arc(0.85, 1.12), voices=4, attack=0.2,
			 release=0.8, vib=14, brightness=0.55, swell=0.35)
	# tema ai violini con le viole all'ottava sotto (bb. 13-20)
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
	for i, name in enumerate(["Gm", "Dm/F", "Eb", "A7", "Dm", "Bb", "N6", "A7"]):
		b, v = CH[name]
		bar = 21 + i
		bb = up(b, 12) if midi(b) < midi("D2") else b
		s.note("piano", I.piano, bb, bar, 0, 3, 0.32, -0.2, pedal=0.6, bright=0.3)
		s.chord("piano", I.piano, v[:3], bar, 1, 2, 0.2, pan_spread=0.15, pedal=0.4, bright=0.3, strum=0.04)
	# ritorno (bb. 29-32): la testa ai violini, sospesa sul La
	s.melody("violins", I.strings, [("A4", 1), ("D5", 1), ("F5", 1), ("Eb5", 1.5), ("D5", 0.5), ("Bb4", 1), ("A4", 1),
								   ("G4", 1), ("C#5", 1), ("E5", 3)], 29, vel=0.58, transpose=12, voices=5,
			 attack=0.2, release=1.2, vib=13, brightness=0.5, swell=0.35)
	s.automate("pad", [(1, -3), (5, -1), (13, 1), (21, -2), (29, 1), (32, 0)])
	settings = {
		"pad": dict(gain=-3, eq=EQ["strings"], send=0.5, rev="cathedral", width=1.2),
		"bass": dict(gain=-2, eq=EQ["low"], send=0.35, rev="cathedral"),
		"choir": dict(gain=-6, eq=lambda f: VOWEL_A(f) * EQ["violins"](f), send=0.7, rev="cathedral", width=1.3),
		"brass": dict(gain=-6, eq=EQ["brass"], send=0.55, rev="cathedral"),
		"bell": dict(gain=-10, eq=EQ["bell_far"], send=1.2, rev="cathedral", dry=0.4),
		"timp": dict(gain=-4, eq=EQ["perc"], send=0.5, rev="cathedral"),
		"cello": dict(gain=0, eq=EQ["strings"], send=0.45, rev="cathedral"),
		"violins": dict(gain=-1, eq=EQ["violins"], send=0.5, rev="cathedral", width=1.2),
		"piano": dict(gain=1, eq=EQ["felt"], send=0.5, rev="cathedral"),
	}
	return s, settings, "cathedral", -17.0


# ------------------------------------------------------------------ CORSO TRIESTE

PZ = {  # ostinati di pizzicato (8 crome), inquieti: vicino frigio e sospiri
	"Dm": ["D2", "A2", "D3", "Eb3", "D3", "A2", "Bb2", "A2"],
	"Dm'": ["D2", "A2", "D3", "Eb3", "F3", "Eb3", "D3", "A2"],
	"Eb": ["Eb2", "Bb2", "Eb3", "D3", "Eb3", "Bb2", "G2", "Bb2"],
	"Bb": ["Bb1", "F2", "D3", "Eb3", "D3", "F2", "Bb2", "A2"],
	"Gm": ["G1", "D2", "G2", "A2", "Bb2", "D2", "Bb2", "A2"],
	"A": ["A1", "E2", "A2", "Bb2", "A2", "E2", "G2", "C#3"],
}


def song_strada() -> tuple[Song, dict, str, float]:
	"""Corso Trieste sotto la pioggia: ostinato di pizzicati, frammenti del tema, inquietudine."""
	s = Song("strada", bpm=80, beats_per_bar=4, bars=40)
	plan = ["Dm", "Dm", "Dm'", "Eb", "Dm", "Dm'", "Bb", "A",
			"Dm", "Eb", "A", "Dm", "Bb", "Gm", "Eb", "Dm",
			"Dm", "Dm'", "Eb", "Eb", "Gm", "Gm", "A", "A",
			"Bb", "Bb", "Gm", "Gm", "Eb", "Eb", "A", "A",
			"Dm", "Dm'", "Eb", "Dm", "Bb", "Gm", "Eb", "A"]
	for i, name in enumerate(plan):
		bar = i + 1
		pat = PZ[name]
		thin = 25 <= bar <= 28
		for k, p in enumerate(pat):
			if thin and k not in (0, 3, 6):
				continue
			acc = 0.62 if k in (0, 3) else (0.5 if k == 6 else 0.4)
			if 17 <= bar <= 24:
				acc *= 1.12
			s.note("pizz", I.pizz, p, bar, k * 0.5, 0.45, acc, -0.25 + 0.07 * k, jitter=0.006)
		# viole pizz in controtempo
		if 9 <= bar <= 24 or bar >= 33:
			b, v = CH[{"Dm'": "Dm"}.get(name, name)]
			for beat in (1.5, 3.5):
				s.note("pizz", I.pizz, v[-2] if beat == 1.5 else v[-1], bar, beat, 0.4, 0.3, 0.35, jitter=0.006)
		# bordone grave
		root = {"Dm'": "Dm"}.get(name, name)
		s.note("drone", I.sine_pad, CH[root][0], bar, 0, 4, 0.35, 0, attack=0.8, release=1.5)

	# armonico acuto (bb. 1-8 e 33-40)
	s.melody("high", I.strings_flautando, [("A5", 16), ("Bb5", 8), ("A5", 8)], 1, vel=0.26, vib=4)
	s.melody("high", I.strings_flautando, [("A5", 8), ("Bb5", 8), ("A5", 16)], 33, vel=0.26, vib=4)
	# viola: la testa in 4/4, poi la coda (bb. 9-16)
	viola = [("A3", 2), ("D4", 1), ("F4", 1), ("Eb4", 3), ("D4", 0.5), ("Bb3", 0.5), ("A3", 2), ("G3", 1),
			 ("C#4", 1), ("D4", 4),
			 ("D4", 2), ("C4", 1), ("Bb3", 1), ("G3", 3), ("A3", 0.5), ("Bb3", 0.5), ("G3", 2), ("F3", 1),
			 ("E3", 1), ("D3", 4)]
	s.melody("viola", I.strings, viola, 9, vel=0.55, shape=_vel_arc(0.85, 1.12), voices=3, attack=0.15, release=0.6,
			 vib=12, brightness=0.5, swell=0.3, detune=4)
	# tremolo d'archi (bb. 17-24): sospiri cromatici
	trem = [(["D4", "F4"], 4), (["D4", "F4"], 4), (["Eb4", "G4"], 4), (["D4", "G4"], 4), (["D4", "Bb4"], 4),
			(["D4", "Bb4"], 4), (["C#4", "E4"], 4), (["C#4", "G4"], 4)]
	for i, (ps, d) in enumerate(trem):
		s.chord("trem", I.strings, [up(p, 12) for p in ps], 17 + i, 0, d, 0.42 + 0.03 * i, pan_spread=0.5,
				tremolo=0.75, trem_rate=13, attack=0.25, release=0.5, swell=0.4, brightness=0.55)
	s.melody("viola", I.strings, viola[10:], 17, vel=0.5, transpose=12, voices=4, attack=0.2, release=0.7, vib=12,
			 brightness=0.5, swell=0.3)
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
	for bar, p in [(25, "Bb1"), (27, "G1"), (29, "Eb2"), (31, "A1")]:
		s.note("piano", I.piano, up(p, 12), bar, 0, 6, 0.3, -0.3, pedal=1.0, bright=0.25)

	# ritorno (bb. 33-40): la testa ai violoncelli, sospiri dei violini
	s.melody("cello", I.strings, viola, 33, vel=0.55, transpose=0, shape=_vel_arc(0.85, 1.1), voices=4,
			 attack=0.16, release=0.7, vib=13, brightness=0.5, swell=0.3)
	sighs = [("F5", 3), ("E5", 1), ("Eb5", 3), ("D5", 1), ("C#5", 4), ("D5", 4), ("D5", 3), ("C5", 1), ("Bb4", 4),
			 ("G4", 3), ("F4", 1), ("E4", 4)]
	s.melody("trem", I.strings_flautando, sighs, 33, vel=0.32)
	s.automate("pizz", [(1, -1), (8, 0), (17, 1), (24, 1.5), (25, -2), (32, -1), (33, 0), (40, 0)])
	settings = {
		"pizz": dict(gain=3, eq=EQ["pizz"], send=0.35, rev="hall", width=1.1),
		"drone": dict(gain=-8, eq=EQ["low"], send=0.1),
		"high": dict(gain=-8, eq=EQ["violins"], send=0.7, width=1.3),
		"viola": dict(gain=-1, eq=EQ["strings"], send=0.4),
		"cello": dict(gain=-1, eq=EQ["strings"], send=0.4),
		"trem": dict(gain=-5, eq=EQ["violins"], send=0.5, width=1.2),
		"timp": dict(gain=-5, eq=EQ["perc"], send=0.4),
		"piano": dict(gain=-1, eq=EQ["felt"], send=0.6),
	}
	return s, settings, "hall", -16.0


# ------------------------------------------------------------------ VILLA COMUNALE

def song_giardino() -> tuple[Song, dict, str, float]:
	"""Villa Comunale: mistero, celesta e arpa, quasi un carillon."""
	s = Song("giardino", bpm=72, beats_per_bar=3, bars=48)
	TH = ["Dm9", "N6", "A7", "Dm", "Bbmaj7", "Gm6", "Eb#11", "Dm9"]
	intro = ["Dm9", "Bbmaj7", "Gm6", "Asus"]
	mystery = ["Eb#11", "Dm9", "Eb#11", "A7b9", "Bbmaj7", "Gm6", "Eb#11", "A7"]
	plan = intro + TH + TH + mystery + TH + intro * 3
	for i, name in enumerate(plan):
		bar = i + 1
		b, v = CH[name]
		# arpa: arpeggio ascendente-discendente in crome
		pat = [up(b, 12) if midi(b) < midi("D2") else b] + v + [up(v[1], 12), up(v[2], 12)]
		seq = pat[:6]
		hv = 0.34 if (bar <= 4 or bar >= 37) else 0.28
		for k, p in enumerate(seq):
			s.note("harp", I.harp, p, bar, k * 0.5, 1.0, hv * (1.15 if k == 0 else 1), -0.35 + 0.12 * k,
				   jitter=0.008)
		# archi sul tasto, altissimi e lontani
		s.chord("pad", I.strings_flautando, [up(p, 12) for p in v[1:]], bar, 0, 3, 0.26, pan_spread=0.5)
		if 21 <= bar <= 28 or bar >= 37:
			s.note("pizz", I.pizz, up(b, 12) if midi(b) < midi("D2") else b, bar, 0, 1, 0.45, 0)

	# celesta: il tema all'ottava alta (bb. 5-12), un po' di rubato
	s.melody("celesta", I.celesta, THEME, 5, vel=0.55, transpose=12, shape=_vel_arc(0.9, 1.1), jitter=0.015)
	# arpa col tema, celesta a scintille (bb. 13-20)
	s.melody("harp", I.harp, THEME, 13, vel=0.5, shape=_vel_arc(0.9, 1.1))
	for i in range(8):
		bar = 13 + i
		b, v = CH[TH[i]]
		for k, beat in enumerate((0.5, 1.5, 2.5)):
			s.note("celesta", I.celesta, up(v[(k + i) % len(v)], 24), bar, beat, 0.4, 0.3, 0.3 - 0.2 * k, jitter=0.01)
	# carillon solo, misterioso (bb. 21-28): la testa a frammenti
	box = [("A5", 1), ("D6", 1), ("F6", 1), (None, 1.5), ("E6", 0.5), ("D6", 1), ("Eb6", 1.5), ("D6", 0.5), ("Bb5", 1),
		   (None, 3), ("A5", 1), ("G5", 1), ("C#6", 1), ("D6", 1.5), (None, 1.5), ("D6", 1), ("C6", 0.5), ("Bb5", 0.5),
		   ("A5", 1), ("G5", 1.5), ("A5", 0.5), ("Bb5", 1), ("G5", 1), ("F5", 1), ("E5", 1), ("A5", 3)]
	s.melody("box", I.music_box, box, 21, vel=0.55, jitter=0.02)
	# il tema intero, celesta e arpa all'ottava (bb. 29-36)
	s.melody("celesta", I.celesta, THEME, 29, vel=0.5, transpose=12, shape=_vel_arc(0.9, 1.1))
	s.melody("harp", I.harp, THEME, 29, vel=0.42)
	s.melody("strings", I.strings, [("D5", 3), ("Eb5", 3), ("C#5", 3), ("D5", 3), ("D5", 3), ("Bb4", 3), ("G4", 2),
									("A4", 1), ("A4", 3)], 29, vel=0.34, transpose=-12, attack=0.8, release=1.4,
			 brightness=0.4, swell=0.4)
	# coda (bb. 37-48): il carillon ripete le prime tre note, sempre più rado
	for bar, beat, p, v in [(37, 0, "A5", 0.42), (37, 1, "D6", 0.38), (37, 2, "F6", 0.36), (39, 0, "A5", 0.36),
							(39, 1, "D6", 0.32), (39, 2, "F6", 0.3), (41, 0, "A5", 0.3), (41, 1.5, "D6", 0.26),
							(43, 0, "E6", 0.26), (43, 2, "D6", 0.22), (45, 0, "A5", 0.22), (47, 1, "C#6", 0.2)]:
		s.note("box", I.music_box, p, bar, beat, 1, v, 0.15)
	s.automate("harp", [(1, 0), (13, 0), (21, -2), (29, 0), (37, -1), (48, -1)])
	settings = {
		"harp": dict(gain=0, eq=EQ["harp"], send=0.55, width=1.2),
		"pad": dict(gain=-6, eq=EQ["violins"], send=0.7, width=1.3),
		"celesta": dict(gain=0, eq=EQ["celesta"], send=0.6, width=1.1),
		"box": dict(gain=0, eq=EQ["celesta"], send=0.7),
		"pizz": dict(gain=-2, eq=EQ["pizz"], send=0.4),
		"strings": dict(gain=-4, eq=EQ["strings"], send=0.5),
	}
	return s, settings, "hall", -17.0


# ------------------------------------------------------------------ BELVEDERE DI SAN LEUCIO

def song_belvedere() -> tuple[Song, dict, str, float]:
	"""San Leucio all'alba nella nebbia: archi ampi, fili di seta d'arpa, Re maggiore al culmine."""
	s = Song("belvedere", bpm=46, beats_per_bar=3, bars=32)
	plan = ["D5", "D5", "Eb/D", "D5",
			"Dm", "Eb", "A", "Dm", "Bb", "Gm", "Eb", "Dm",
			"F", "Gm7", "C7", "F", "Dm", "Bb", "Gm", "A",
			"Bb", "F/A", "Gm", "Eb", "Bb/D", "C", "Asus", "D",
			"D5", "Eb/D", "D5", "D5"]
	for i, name in enumerate(plan):
		bar = i + 1
		b, v = CH[name]
		climax = 21 <= bar <= 28
		vel = 0.48 if climax else (0.3 if bar <= 4 or bar >= 29 else 0.38)
		s.chord("pad", I.strings, v, bar, 0, 3, vel, pan_spread=0.5, attack=1.0, release=1.8, swell=0.35,
				brightness=0.45 + (0.15 if climax else 0))
		s.chord("pad", I.strings, [up(p, 12) for p in v[-2:]], bar, 0, 3, vel * 0.6, pan_spread=0.6, attack=1.2,
				release=2.0, brightness=0.4)
		bb = up(b, 12) if midi(b) < midi("C2") else b
		s.note("bass", I.strings, bb, bar, 0, 3, 0.42 + (0.08 if climax else 0), 0, voices=4, attack=0.9, release=2.0,
			   dark_fc=380, bright_fc=1200, brightness=0.4)
		s.note("bass", I.sine_pad, up(bb, -12) if midi(bb) > midi("C2") else bb, bar, 0, 3, 0.35, 0, attack=1.5,
			   release=2.0)
		if bar <= 4 or bar >= 29 or climax:
			s.chord("choir", I.choir, [up(p, 12) for p in v[1:3]], bar, 0, 3, 0.35, pan_spread=0.6, vib=10)
		# fili di seta: arpeggi rapidi dell'arpa, salgono e si perdono nella nebbia
		if bar % 2 == 1 or climax:
			notes = [up(v[k % len(v)], 12 * (k // len(v))) for k in range(10)]
			for k, p in enumerate(notes):
				s.note("harp", I.harp, p, bar, 1.0 + k * 0.18, 0.5, 0.16 + 0.02 * np.sin(k), -0.5 + 0.1 * k,
					   jitter=0.004)
	# armonici dei violini all'alba
	s.melody("high", I.strings_flautando, [("A5", 6), ("Bb5", 3), ("A5", 3)], 1, vel=0.3)
	s.melody("high", I.strings_flautando, [("A5", 3), ("Bb5", 3), ("A5", 3), ("D6", 3)], 29, vel=0.28)
	# tema ai violini, ampio (bb. 5-12)
	s.melody("violins", I.strings, THEME, 5, vel=0.55, shape=_vel_arc(0.85, 1.12), voices=6, attack=0.35, release=1.2,
			 vib=12, brightness=0.5, swell=0.4)
	# in Fa maggiore: luce, il ricordo di Agnese (bb. 13-20)
	f_tail = [("F5", 1), ("E5", 0.5), ("D5", 0.5), ("C5", 1), ("D5", 1.5), ("E5", 0.5), ("F5", 1), ("Bb4", 1), ("A4", 1),
			  ("G4", 1), ("A4", 3)]
	s.melody("violins", I.strings, HEAD_F + f_tail, 13, vel=0.55, shape=_vel_arc(0.85, 1.12), voices=6, attack=0.35,
			 release=1.2, vib=12, brightness=0.52, swell=0.4)
	s.melody("cello", I.strings, [("F3", 3), ("Bb3", 3), ("Bb3", 1.5), ("C4", 1.5), ("A3", 3), ("A3", 3), ("D4", 3),
								  ("D4", 2), ("C4", 1), ("C#4", 3)], 13, vel=0.45, voices=4, attack=0.4, release=1.2,
			 vib=12, brightness=0.45, swell=0.4)
	# culmine (bb. 21-28): violini e violoncelli all'ottava, cadenza piccarda
	climax = [("D5", 3), ("C5", 3), ("Bb4", 1.5), ("A4", 0.5), ("G4", 1), ("G4", 3), ("F4", 1), ("Bb4", 1), ("D5", 1),
			  ("E5", 3), ("E5", 1.5), ("D5", 0.5), ("C#5", 1), ("D5", 3)]
	s.melody("violins", I.strings, climax, 21, vel=0.66, transpose=12, shape=_vel_arc(0.9, 1.1), voices=6,
			 attack=0.3, release=1.4, vib=13, brightness=0.55, swell=0.35)
	s.melody("cello", I.strings, climax, 21, vel=0.55, transpose=-12, voices=4, attack=0.3, release=1.4, vib=12,
			 brightness=0.5, swell=0.35)
	s.automate("pad", [(1, -3), (5, -1), (13, 0), (21, 2), (28, 2), (29, -2), (32, -3)])
	settings = {
		"pad": dict(gain=-3, eq=EQ["strings"], send=0.55, width=1.3),
		"bass": dict(gain=-3, eq=EQ["low"], send=0.35),
		"choir": dict(gain=-9, eq=lambda f: VOWEL_O(f) * EQ["violins"](f), send=0.8, width=1.3),
		"harp": dict(gain=-3, eq=EQ["harp"], send=0.7, width=1.3),
		"high": dict(gain=-7, eq=EQ["violins"], send=0.8, width=1.3),
		"violins": dict(gain=0, eq=EQ["violins"], send=0.5, width=1.2),
		"cello": dict(gain=-1, eq=EQ["strings"], send=0.45),
	}
	return s, settings, "cathedral", -16.0


# ------------------------------------------------------------------ CORTILE D'ONORE (boss)

OST = {  # ostinato di tarantella cupa (6 crome per battuta), radice -> note
	"D": ["D3", "D3", "Eb3", "D3", "C3", "D3"],
	"D'": ["D3", "D3", "Eb3", "F3", "Eb3", "D3"],
	"Eb": ["Eb3", "Eb3", "E3", "Eb3", "D3", "Eb3"],
	"F": ["F3", "F3", "Gb3", "F3", "Eb3", "F3"],
	"G": ["G2", "G2", "Ab2", "G2", "F2", "G2"],
	"A": ["A2", "A2", "Bb2", "A2", "G2", "A2"],
	"Bb": ["Bb2", "Bb2", "B2", "Bb2", "A2", "Bb2"],
}


def song_oro() -> tuple[Song, dict, str, float]:
	"""Il Custode: tarantella cupa in 6/8, ottoni gravi in emiola, percussioni profonde."""
	s = Song("oro", bpm=300, beats_per_bar=6, bars=96)  # 'tempo' = croma; battuta = 1.2 s
	# struttura: 1-8 intro, 9-24 ottoni, 25-40 violini, 41-56 pausa, 57-72 salita, 73-92 pieno, 93-96 ponte
	roots = (["D", "D'"] * 4 + ["D", "D'", "D", "D'", "Eb", "Eb", "Eb", "Eb", "A", "A", "A", "A", "D", "D'", "D", "D'"]
			 + ["Bb", "Bb", "G", "G", "A", "A", "D", "D'"] * 2
			 + ["D", "D'"] * 8
			 + ["D", "D", "Eb", "Eb", "F", "F", "G", "G", "A", "A", "Bb", "Bb", "A", "A", "A", "A"]
			 + ["D", "D'", "D", "D'", "Eb", "Eb", "Eb", "Eb", "A", "A", "A", "A", "D", "D'", "D", "D'"]
			 + ["Bb", "Bb", "G", "G"] + ["A"] * 4)
	assert len(roots) == 96, len(roots)

	def section(bar):
		if bar <= 8:
			return "intro"
		if bar <= 24:
			return "brass"
		if bar <= 40:
			return "violins"
		if bar <= 56:
			return "break"
		if bar <= 72:
			return "build"
		if bar <= 92:
			return "full"
		return "bridge"

	for i, r in enumerate(roots):
		bar = i + 1
		sec = section(bar)
		pat = OST[r]
		vel_base = {"intro": 0.55, "brass": 0.6, "violins": 0.6, "break": 0.42, "build": 0.5 + 0.012 * (bar - 57),
					"full": 0.68, "bridge": 0.62}[sec]
		for k, p in enumerate(pat):
			acc = 1.2 if k in (0, 3) else 0.9
			if sec == "break" and k not in (0, 2, 3, 5):
				continue
			s.note("ost", I.spiccato, p, bar, k, 0.55, vel_base * acc, -0.15, jitter=0.004)
			s.note("ost", I.spiccato, up(p, -12), bar, k, 0.55, vel_base * acc * 0.85, 0.15, jitter=0.004,
				   dark_fc=450, bright_fc=2000)
		# percussioni
		bd = {"intro": (0, 3), "brass": (0, 3), "violins": (0, 3), "break": (0,) if bar % 2 == 1 else (),
			  "build": (0, 3) if bar < 65 else (0, 2, 3, 5), "full": (0, 3), "bridge": (0, 2, 3, 5)}[sec]
		for k in bd:
			s.note("drums", I.bass_drum, 46 if k == 0 else 50, bar, k, 1, 0.85 if k == 0 else 0.62, 0, jitter=0.002)
		if sec in ("brass", "violins", "full", "bridge") or (sec == "build" and bar >= 61):
			for k in range(6):
				v = 0.55 if k in (0, 3) else 0.3
				s.note("tamb", I.frame_drum, 175, bar, k, 0.5, v, 0.3 if k % 2 else -0.2, jitter=0.004,
					   jingle=0.35 if k in (0, 3) else 0.18, open_=k in (0, 3))
		if sec in ("intro", "full") and bar % 2 == 0:
			s.note("drums", I.timpani, "A1", bar, 5, 1, 0.55, 0.1, ring=1.6)
		if sec in ("brass", "violins", "full"):
			s.note("timp", I.timpani, CH[{"D'": "D"}.get(r, r) if r not in ("D", "D'") else "Dm"][0], bar, 0, 3,
				   0.45, -0.1, ring=2.0)
	# rulli di timpano prima delle sezioni
	for bar in (8, 24, 40, 56, 72, 92):
		for k in range(24):
			s.note("timp", I.timpani, "A1", bar, k * 0.25, 0.2, 0.15 + 0.5 * k / 23, 0, ring=1.2, jitter=0.002)
	# colpi d'ottone nell'intro e nel ponte
	for bar in (1, 3, 5, 7, 93, 95):
		s.chord("brass", I.brass, ["D2", "A2", "D3"], bar, 0, 2.5, 0.75, pan_spread=0.3, attack=0.05, release=0.4)
	# testa in emiola: ogni tempo del 3/4 originale = 4 crome
	head_h = [(p, d * 4) for p, d in HEAD]
	for bar0, oct_, v in [(9, -24, 0.62), (17, -12, 0.6), (73, -24, 0.68), (81, -12, 0.66)]:
		s.melody("brass", I.brass, head_h, bar0, vel=v, transpose=oct_, attack=0.12, release=0.5)
		if oct_ == -12:
			s.melody("brass", I.brass, head_h, bar0, vel=v * 0.8, transpose=-24, attack=0.12, release=0.5)
	# tremolo acuto degli archi sotto gli ottoni
	trem_plan = {9: ["D5", "F5"], 11: ["D5", "F5"], 13: ["Eb5", "G5"], 15: ["Eb5", "Bb5"], 17: ["C#5", "E5"],
				 19: ["C#5", "G5"], 21: ["D5", "F5"], 23: ["D5", "A5"]}
	for base in (0, 64):
		for bar, ps in trem_plan.items():
			s.chord("trem", I.strings, ps, bar + base, 0, 12, 0.42, pan_spread=0.5, tremolo=0.8, trem_rate=14,
					attack=0.3, release=0.4, brightness=0.5)
	# violini: la coda in tarantella (bb. 25-40 e 89-92)
	tar = [("D5", 2), ("C5", 1), ("Bb4", 2), ("A4", 1), ("G4", 2), ("A4", 1), ("Bb4", 3), ("G4", 2), ("F4", 1),
		   ("E4", 2), ("C#4", 1), ("D4", 6)]
	for bar0, tr in [(25, 12), (29, 12), (33, 24), (37, 12), (89, 12)]:
		s.melody("violins", I.strings, tar, bar0, vel=0.6, transpose=tr - 12, voices=5, attack=0.03, release=0.25,
				 vib=8, brightness=0.6, swell=0, accent=0.3)
		s.melody("violins", I.strings, tar, bar0, vel=0.45, transpose=tr - 24, voices=4, attack=0.03, release=0.25,
				 vib=8, brightness=0.55, swell=0, accent=0.3)
	for bar0 in (25, 29, 33, 37):
		for i, name in enumerate(["Bb", "Gm", "A", "Dm"]):
			s.chord("brass", I.brass, [up(p, -12) for p in CH[name][1][:2]], bar0 + i, 0, 5.5, 0.5, pan_spread=0.3,
					attack=0.2)
	# pausa: il coro di Gregorio canta la testa lentissima, campana lontana
	s.melody("choir", I.choir, [("A3", 12), ("D4", 12), ("F4", 12), ("Eb4", 18), ("D4", 6), ("Bb3", 12),
								("A3", 12), ("G3", 12), ("C#4", 12), ("D4", 24)], 41, vel=0.5, attack=1.0,
			 release=1.5)
	for bar in (41, 49):
		s.note("bell", I.bell, "D3", bar, 0, 6, 0.6, 0.3, ring=6.0)
	# salita: ottoni sostengono le radici crescenti
	for i, r in enumerate(roots[56:72]):
		bar = 57 + i
		if i % 2 == 0:
			p = OST[r][0]
			s.chord("brass", I.brass, [up(p, -12), up(p, -5)], bar, 0, 11.5, 0.45 + 0.025 * i, pan_spread=0.2,
					attack=0.4)
	s.automate("ost", [(1, 0), (41, -3), (56, -3), (57, -2), (72, 1), (73, 1), (96, 1)])
	settings = {
		"ost": dict(gain=0, eq=EQ["strings"], send=0.22, rev="hall"),
		"drums": dict(gain=0, eq=EQ["perc"], send=0.3, rev="hall"),
		"timp": dict(gain=-3, eq=EQ["perc"], send=0.35, rev="hall"),
		"tamb": dict(gain=-9, eq=curve([(80, -10), (150, 0), (1500, -2), (4000, -6), (8000, -14)]), send=0.25,
					 rev="room", width=1.2),
		"brass": dict(gain=0, eq=EQ["brass"], send=0.4, rev="hall"),
		"trem": dict(gain=-7, eq=EQ["violins"], send=0.45, width=1.3),
		"violins": dict(gain=-2, eq=EQ["violins"], send=0.35, width=1.2),
		"choir": dict(gain=-5, eq=lambda f: VOWEL_O(f) * EQ["strings"](f), send=0.7, rev="cathedral", width=1.2),
		"bell": dict(gain=-8, eq=EQ["bell_far"], send=1.0, rev="cathedral", dry=0.4),
	}
	return s, settings, "hall", -14.0


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
	s, settings, _main_rev, target = SONGS[name]()
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


def main(names: list[str]) -> None:
	global IRS
	IRS = irs()
	for n in names or list(SONGS):
		render(n)


if __name__ == "__main__":
	main(sys.argv[1:])
