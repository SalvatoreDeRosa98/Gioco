"""Sequencer circolare e mixer per i brani in loop.

Song tiene uno stem stereo per gruppo di strumenti, tutti buffer CIRCOLARI della
stessa lunghezza L = battute x tempi x campioni_per_tempo. Le note che sforano la
fine si avvolgono all'inizio: il loop è perfetto per costruzione.

Uso tipico (vedi music.py):
	s = Song("piazza", bpm=60, beats_per_bar=3, bars=40)
	s.melody("piano", piano, [("A4", 1), ("D5", 1), ("F5", 1)], bar=5, vel=0.6)
	s.chord("archi", strings, ["D3", "A3", "F4"], bar=5, beats=3)
	mix = s.mix({"piano": dict(gain=-3, send=0.35), ...}, ir)
"""
from __future__ import annotations

import numpy as np

from dsp import (SR, add_circ, as_stereo, db, eq_curve_fft, hz, midi, reverb_circ, rng_for, smooth_len)


def active_rms_db(x: np.ndarray, win_s: float = 0.4, floor_db: float = 30.0) -> float:
	"""RMS (dB) calcolato solo sulle finestre in cui lo stem suona davvero."""
	m = np.mean(x ** 2, axis=0)
	w = int(win_s * SR)
	k = len(m) // w
	e = m[:k * w].reshape(k, w).mean(axis=1)
	if e.max() <= 0:
		return -120.0
	act = e[e > e.max() * 10 ** (-floor_db / 10)]
	return float(10 * np.log10(act.mean() + 1e-20))


DRY_RUN = False  # True: le note vengono solo annotate in Song.events (verifica armonica), niente audio


class Song:
	def __init__(self, name: str, bpm: float, beats_per_bar: int, bars: int, salt: int = 0):
		self.name = name
		self.spb = smooth_len(60.0 / bpm * SR)  # campioni per tempo, con fattori primi piccoli
		self.bpb = beats_per_bar
		self.bars = bars
		self.L = self.spb * beats_per_bar * bars
		self.rng = rng_for(name, salt)
		self.stems: dict[str, np.ndarray] = {}
		self.automation: dict[str, list[tuple[float, float]]] = {}
		self.events: list[tuple[str, float, float, float, float]] = []  # stem, midi, inizio, durata (tempi), vel

	# ------------------------------------------------------------ tempo
	@property
	def seconds(self) -> float:
		return self.L / SR

	@property
	def beat_s(self) -> float:
		return self.spb / SR

	def at(self, bar: float, beat: float = 0.0) -> float:
		"""Posizione in campioni (battute contate da 1)."""
		return ((bar - 1) * self.bpb + beat) * self.spb

	# ------------------------------------------------------------ note
	def stem(self, name: str) -> np.ndarray:
		if name not in self.stems:
			self.stems[name] = np.zeros((2, self.L))
		return self.stems[name]

	def place(self, stem: str, audio: np.ndarray, start: float, pan: float = 0.0, gain_db: float = 0.0) -> None:
		y = as_stereo(audio, pan) * db(gain_db)
		f = min(y.shape[-1], 256)  # sicurezza: nessuna nota finisce con uno scalino
		y[:, -f:] *= np.cos(np.linspace(0, np.pi / 2, f)) ** 2
		add_circ(self.stem(stem), y, int(round(start)))

	def note(self, stem: str, inst, pitch, bar: float, beat: float, beats: float, vel: float = 0.7,
			 pan: float = 0.0, gain_db: float = 0.0, jitter: float = 0.008, vel_jit: float = 0.05, **kw) -> None:
		if pitch is None:
			return
		v = float(np.clip(vel + self.rng.normal(0, vel_jit), 0.05, 1.0))
		start = self.at(bar, beat) + self.rng.normal(0, jitter) * SR
		self.events.append((stem, midi(pitch), (bar - 1) * self.bpb + beat, beats, v))
		if DRY_RUN:
			return
		audio = inst(hz(pitch), beats * self.beat_s, v, self.rng, **kw)
		self.place(stem, audio, start, pan, gain_db)

	def melody(self, stem: str, inst, notes, bar: float, beat: float = 0.0, vel: float = 0.7, legato: float = 1.0,
			   transpose: float = 0.0, pan: float = 0.0, gain_db: float = 0.0, shape=None, **kw) -> float:
		"""notes: lista di (nota|None, tempi[, vel]). shape(i, n) -> moltiplicatore di vel.
		Restituisce il tempo (in tempi dall'inizio della battuta `bar`) dopo l'ultima nota."""
		pos = beat
		n = len(notes)
		for i, item in enumerate(notes):
			p, d = item[0], item[1]
			v = item[2] if len(item) > 2 else vel
			if shape is not None:
				v = v * shape(i, n)
			if p is not None:
				self.note(stem, inst, midi(p) + transpose, bar, pos, d * legato, v, pan, gain_db, **kw)
			pos += d
		return pos

	def chord(self, stem: str, inst, pitches, bar: float, beat: float = 0.0, beats: float = 3.0, vel: float = 0.6,
			  pan_spread: float = 0.3, gain_db: float = 0.0, transpose: float = 0.0, strum: float = 0.0, **kw) -> None:
		k = len(pitches)
		for i, p in enumerate(pitches):
			pan = ((i / (k - 1)) * 2 - 1) * pan_spread if k > 1 else 0.0
			self.note(stem, inst, midi(p) + transpose, bar, beat + i * strum, beats, vel, pan, gain_db, **kw)

	def arp(self, stem: str, inst, pitches, bar: float, beat: float, step: float, count: int, beats_each: float,
			vel: float = 0.5, pan_spread: float = 0.4, accent_first: float = 0.15, **kw) -> None:
		"""Arpeggio ciclico su `pitches` (passo in tempi)."""
		k = len(pitches)
		for i in range(count):
			p = pitches[i % k]
			pan = (((i % k) / max(1, k - 1)) * 2 - 1) * pan_spread
			v = vel * (1 + accent_first if i % k == 0 else 1)
			self.note(stem, inst, p, bar, beat + i * step, beats_each, v, pan, **kw)

	def automate(self, stem: str, points: list[tuple[float, float]]) -> None:
		"""Guadagno dello stem nel tempo: punti (battuta, dB), interpolati, circolari."""
		self.automation[stem] = points

	def _gain_curve(self, points) -> np.ndarray:
		pts = sorted(points)
		xs = np.array([self.at(b) for b, _ in pts])
		gs = np.array([g for _, g in pts])
		# circolare: aggiungo il primo punto dopo la fine
		xs = np.concatenate([xs - self.L, xs, xs + self.L])
		gs = np.concatenate([gs, gs, gs])
		t = np.arange(self.L)
		return 10 ** (np.interp(t, xs, gs) / 20)

	# ------------------------------------------------------------ mix
	def mix(self, settings: dict, irs: dict, verbose: bool = True) -> np.ndarray:
		"""settings[stem] = dict(gain=dB, eq=curva(f)->lin, send=quota riverbero, rev='hall',
		width=0..1.5). irs: nome -> IR stereo. Restituisce il mix stereo periodico."""
		dry = np.zeros((2, self.L))
		sends: dict[str, np.ndarray] = {}
		for name, x in self.stems.items():
			st = settings.get(name, {})
			y = x
			if name in self.automation:
				y = y * self._gain_curve(self.automation[name])
			if st.get("eq") is not None:
				y = eq_curve_fft(y, st["eq"])
			w = st.get("width", 1.0)
			if w != 1.0:
				m = 0.5 * (y[0] + y[1])
				y = np.vstack([m + w * (y[0] - m), m + w * (y[1] - m)])
			if "level" in st:  # livello "attivo" desiderato (dB RMS dove lo stem suona)
				y = y * db(st["level"] - active_rms_db(y))
			y = y * db(st.get("gain", 0.0))
			if verbose:
				print(f"    stem {name:12s} attivo {active_rms_db(y):6.1f} dB")
			dry += y * st.get("dry", 1.0)
			s = st.get("send", 0.25)
			if s > 0:
				rv = st.get("rev", "hall")
				sends.setdefault(rv, np.zeros((2, self.L)))
				sends[rv] += y * s
		wet = np.zeros((2, self.L))
		for rv, x in sends.items():
			wet += reverb_circ(x, irs[rv])
		return dry + wet
