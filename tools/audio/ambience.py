"""Ambienti sonori in loop (OGG Vorbis q4, stereo, 44.1 kHz) per le cinque aree.

Lancio:  python3 tools/audio/ambience.py [nome ...]   (default: tutti)
Uscita:  src/assets/audio/ambience/<nome>.ogg

  citta   Piazza Dante: città quasi muta, vento lieve, carrozza lontana, un grillo, rintocco lontano
  pioggia Corso Trieste: pioggia fitta, gocce nelle pozzanghere, grondaia, tuono lontanissimo
  notte   Villa Comunale: grilli, fontana lontana, l'assiolo ("chiù"), fruscio di foglie
  vento   Belvedere di San Leucio: vento a raffiche nella nebbia, fischi lievi, uccelli dell'alba lontani
  torce   Cortile d'Onore: torce che crepitano, grande sala, un'eco metallica lontana

Tutto è costruito su buffer CIRCOLARI: i letti di rumore sono rumore bianco
sagomato in frequenza con la FFT (quindi periodico), le modulazioni lente sono
LFO periodici, gli eventi che sforano la fine si avvolgono all'inizio e il
riverbero è una convoluzione circolare. Il loop non ha giunture. Seed fissi.
"""
from __future__ import annotations

import os
import sys

import numpy as np
import scipy.fft as sfft

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dsp import (SR, TWO_PI, add_circ, bp, curve, db, env_perc, filt, hp, lp, make_ir, master_loop, pan_mono,  # noqa: E402
				 ramp_cos, reverb_circ, rng_for, smooth_len, write_ogg)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "src", "assets", "audio", "ambience")


# ------------------------------------------------------------------ mattoni periodici

def shaped_noise(L: int, gain_fn, rng, stereo: bool = True, corr: float = 0.0) -> np.ndarray:
	"""Rumore periodico (lunghezza L) con spettro dato. corr: correlazione tra i canali."""
	f = sfft.rfftfreq(L, 1 / SR)
	g = gain_fn(f)
	chans = []
	common = sfft.rfft(rng.standard_normal(L), workers=-1)
	for _ in range(2 if stereo else 1):
		X = sfft.rfft(rng.standard_normal(L), workers=-1)
		X = np.sqrt(1 - corr) * X + np.sqrt(corr) * common
		chans.append(sfft.irfft(X * g, L, workers=-1))
	y = np.vstack(chans)
	return y / (np.sqrt(np.mean(y ** 2)) + 1e-12)


def lfo(L: int, rate_hz: float, rng, lo: float = 0.0, hi: float = 1.0) -> np.ndarray:
	"""Modulazione lenta periodica (rumore filtrato), riscalata in [lo, hi]."""
	f = sfft.rfftfreq(L, 1 / SR)
	X = sfft.rfft(rng.standard_normal(L), workers=-1) * np.exp(-(f / rate_hz) ** 2)
	X[0] = 0
	y = sfft.irfft(X, L, workers=-1)
	y = (y - y.min()) / (y.max() - y.min() + 1e-12)
	return lo + (hi - lo) * y


def band(lo_hz: float, hi_hz: float, slope: float = 4.0):
	"""Guadagno passa-banda morbido per shaped_noise."""
	def g(f):
		f = np.maximum(f, 1.0)
		return 1 / np.sqrt(1 + (lo_hz / f) ** slope) / np.sqrt(1 + (f / hi_hz) ** slope)
	return g


def pink(f):
	return 1 / np.sqrt(np.maximum(f, 20.0))


def place(buf: np.ndarray, x: np.ndarray, t: float, pan: float = 0.0, gain: float = 1.0) -> None:
	y = pan_mono(x, pan) if x.ndim == 1 else x
	add_circ(buf, y * gain, int(t * SR))


def impulse_texture(L: int, rate: float, rng, gain_fn, alpha: float = 2.2, spread: float = 0.9,
					cap: float = 5.0) -> np.ndarray:
	"""Tessitura di micro-impatti (pioggia, crepitio): impulsi di Poisson con ampiezze a
	coda lunga e pan casuale, poi sagomati in frequenza con la FFT (quindi periodici)."""
	k = int(L / SR * rate)
	pos = rng.integers(0, L, k)
	amp = np.minimum(rng.pareto(alpha, k) + 1.0, cap) * rng.choice([-1.0, 1.0], k)  # niente schiocchi enormi
	th = (rng.uniform(-spread, spread, k) + 1) * np.pi / 4
	out = np.zeros((2, L))
	np.add.at(out[0], pos, amp * np.cos(th))
	np.add.at(out[1], pos, amp * np.sin(th))
	f = sfft.rfftfreq(L, 1 / SR)
	g = gain_fn(f)
	out = sfft.irfft(sfft.rfft(out, axis=-1, workers=-1) * g, L, axis=-1, workers=-1)
	return out / (np.sqrt(np.mean(out ** 2)) + 1e-12)


# ------------------------------------------------------------------ suoni d'evento

def drop(rng, f0: float, dur: float = 0.03, chirp: float = 0.8) -> np.ndarray:
	"""Goccia in una pozzanghera: bolla di Minnaert, sinusoide che sale e si spegne."""
	n = int(dur * SR)
	t = np.arange(n) / SR
	f = f0 * (1 + chirp * t / dur)
	y = np.sin(TWO_PI * np.cumsum(f) / SR) * np.exp(-t / (dur / 4))
	a = min(n, 24)
	y[:a] *= ramp_cos(a)
	return y


def tick(rng, lo: float, hi: float, dur: float = 0.004) -> np.ndarray:
	"""Scoppiettio breve (crepitio, pioggia su legno)."""
	n = max(16, int(dur * SR))
	y = filt(bp(lo, hi, 2), rng.standard_normal(n)) * env_perc(n, 0.0003, dur * 0.8)
	return y


def chirp_cricket(rng, carrier: float, pulses: int = 3) -> np.ndarray:
	"""Un 'cri' di grillo: 3-4 impulsi della stessa portante."""
	pl, gap = 0.016, 0.017
	n = int((pulses * (pl + gap) + 0.02) * SR)
	y = np.zeros(n)
	for k in range(pulses):
		s = int(k * (pl + gap) * SR)
		m = int(pl * SR)
		t = np.arange(m) / SR
		e = np.sin(np.pi * np.arange(m) / m) ** 2
		y[s:s + m] += np.sin(TWO_PI * carrier * (1 - 0.01 * t / pl) * t) * e * (1 - 0.1 * k)
	return y


def owl(rng, f0: float = 1250.0) -> np.ndarray:
	"""Assiolo: un fischio puro e breve ('chiù') che scende appena."""
	d = 0.3
	n = int(d * SR)
	t = np.arange(n) / SR
	f = f0 * (1.02 - 0.05 * t / d)
	e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
	y = np.sin(TWO_PI * np.cumsum(f) / SR) * e
	return y + 0.08 * np.sin(2 * TWO_PI * np.cumsum(f) / SR) * e


def hoof(rng, pitch: float) -> np.ndarray:
	"""Zoccolo sul basolato: colpo legnoso breve."""
	n = int(0.08 * SR)
	t = np.arange(n) / SR
	y = np.zeros(n)
	for r, a, tau in ((1.0, 1.0, 0.012), (2.3, 0.5, 0.008), (3.7, 0.25, 0.005)):
		y += a * np.sin(TWO_PI * pitch * r * t + rng.uniform(0, 6)) * np.exp(-t / tau)
	y += filt(bp(400, 2500), rng.standard_normal(n)) * np.exp(-t / 0.006) * 0.6
	return y


def bell_far(rng, f: float, ring: float = 6.0) -> np.ndarray:
	n = int(ring * SR)
	t = np.arange(n) / SR
	y = np.zeros(n)
	for r, a, k in ((0.5, 0.6, 1.0), (1.0, 0.5, 0.7), (1.183, 0.4, 0.55), (1.506, 0.25, 0.4), (2.0, 0.45, 0.35),
					(2.514, 0.15, 0.25), (3.011, 0.08, 0.15)):
		y += a * np.sin(TWO_PI * f * r * t + rng.uniform(0, 6)) * np.exp(-6.91 * t / (ring * k))
	a = 64
	y[:a] *= ramp_cos(a)
	return y


def bird(rng, f0: float) -> np.ndarray:
	"""Cinguettio lontano: due-tre fischi brevi in glissando."""
	out = []
	for k in range(rng.integers(2, 4)):
		d = rng.uniform(0.06, 0.12)
		n = int(d * SR)
		t = np.arange(n) / SR
		f = f0 * (1 + rng.uniform(-0.25, 0.3) * t / d)
		e = np.sin(np.pi * t / d) ** 2
		out.append(np.sin(TWO_PI * np.cumsum(f) / SR) * e)
		out.append(np.zeros(int(rng.uniform(0.04, 0.09) * SR)))
	return np.concatenate(out)


def clang(rng, f0: float = 180.0, ring: float = 3.0) -> np.ndarray:
	"""Eco metallica lontana (armatura, catena)."""
	n = int(ring * SR)
	t = np.arange(n) / SR
	y = np.zeros(n)
	for r, a in ((1.0, 1.0), (2.76, 0.6), (5.4, 0.3), (1.5, 0.4), (3.9, 0.25)):
		y += a * np.sin(TWO_PI * f0 * r * t + rng.uniform(0, 6)) * np.exp(-6.91 * t / (ring / r ** 0.5))
	y[:32] *= ramp_cos(32)
	return y


# ------------------------------------------------------------------ ambienti

def amb_pioggia():
	rng = rng_for("amb_pioggia")
	L = smooth_len(48 * SR)
	dry = np.zeros((2, L))
	breath = lfo(L, 0.06, rng, 0.8, 1.0)
	# scroscio lontano: un fruscio scuro, quasi un respiro
	wash = shaped_noise(L, lambda f: band(150, 1600, 3)(f) * pink(f), rng, corr=0.2)
	dry += wash * breath * db(-27)
	# pioggia sul basolato: migliaia di micro-impatti per secondo
	mid = impulse_texture(L, 2200, rng, lambda f: band(700, 4200, 3)(f), alpha=3.0)
	dry += mid * breath * db(-29)
	# gocce più grosse e vicine, più rade
	near = impulse_texture(L, 90, rng, lambda f: band(300, 2600, 3)(f), alpha=1.6)
	dry += near * lfo(L, 0.3, rng, 0.6, 1.0) * db(-33)
	# rivolo nella grondaia: medio-bassi gorgoglianti
	gut = shaped_noise(L, band(220, 900, 6), rng, stereo=False)[0]
	dry += pan_mono(gut * lfo(L, 3.0, rng, 0.2, 1.0) ** 2 * db(-36), -0.6)
	# bolle nelle pozzanghere
	for _ in range(int(48 * 30)):
		place(dry, drop(rng, rng.uniform(800, 2200), rng.uniform(0.012, 0.03)), rng.uniform(0, L / SR),
			  rng.uniform(-0.9, 0.9), db(rng.uniform(-46, -30)))
	# gocciolio regolare dalla grondaia (a destra)
	t = 0.0
	while t < L / SR:
		place(dry, drop(rng, rng.uniform(520, 700), 0.05, 0.5), t, 0.55, db(rng.uniform(-30, -25)))
		t += rng.uniform(0.62, 0.9)
	# tuono lontanissimo
	n = int(7 * SR)
	th = filt(lp(160, 4), rng.standard_normal(n))
	e = np.concatenate([ramp_cos(int(0.6 * SR)), np.exp(-np.arange(n - int(0.6 * SR)) / (2.2 * SR))])
	th = th * e * (0.6 + 0.4 * lfo(n, 2.0, rng))
	place(dry, th / np.abs(th).max(), 17.0, -0.2, db(-24))
	ir = make_ir(1.6, 1.1, 0.4, predelay=0.01, seed=31)
	mix = dry + reverb_circ(dry, ir) * 0.3
	return filt_lp_periodic(mix, 6500), -22.0


def amb_notte():
	rng = rng_for("amb_notte")
	L = smooth_len(40 * SR)
	dry = np.zeros((2, L))
	far = np.zeros((2, L))
	# aria e foglie
	air = shaped_noise(L, lambda f: band(80, 1800, 2)(f) * pink(f), rng, corr=0.3)
	dry += air * lfo(L, 0.12, rng, 0.4, 1.0) * db(-46)
	# fontana lontana: gorgoglio filtrato, mosso velocemente
	fon = shaped_noise(L, band(250, 2200, 4), rng, corr=0.6)
	far += fon * lfo(L, 9.0, rng, 0.2, 1.0) ** 2 * db(-40)
	for _ in range(int(40 * 18)):
		place(far, drop(rng, rng.uniform(700, 1700), rng.uniform(0.015, 0.035)), rng.uniform(0, L / SR),
			  rng.uniform(0.1, 0.5), db(rng.uniform(-44, -34)))
	# grilli: cinque individui con portante, ritmo e distanza propri
	for c in range(5):
		carrier = rng.uniform(3900, 4900)
		period = rng.uniform(0.55, 0.85)
		pan = rng.uniform(-0.9, 0.9)
		g = db(rng.uniform(-38, -30))
		pulses = int(rng.integers(3, 5))
		t = rng.uniform(0, period)
		# ogni grillo tace per un tratto (ma il conto torna: il loop è circolare)
		rest0 = rng.uniform(0, L / SR)
		rest_len = rng.uniform(4, 9)
		while t < L / SR:
			if not (rest0 <= t < rest0 + rest_len):
				place(dry, chirp_cricket(rng, carrier * rng.uniform(0.995, 1.005), pulses), t, pan,
					  g * rng.uniform(0.8, 1.1))
			t += period * rng.uniform(0.96, 1.04)
	# assiolo lontano: una serie di 'chiù' regolari
	t = 9.0
	for k in range(7):
		place(far, owl(rng), t, -0.45, db(-27))
		t += 2.6 + rng.normal(0, 0.05)
	ir_far = make_ir(3.0, 2.0, 0.7, predelay=0.04, seed=32, tone_hz=5000)
	mix = dry + reverb_circ(dry, ir_far) * 0.25 + filt_far(far) * 0.6 + reverb_circ(far, ir_far) * 0.8
	mix = filt_lp_periodic(mix, 7500)
	return mix, -24.0


def filt_far(x):
	from dsp import eq_curve_fft
	return eq_curve_fft(x, curve([(100, -6), (300, 0), (1500, -2), (3000, -8), (6000, -20)]))


def filt_lp_periodic(x, fc):
	from dsp import eq_curve_fft
	return eq_curve_fft(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** 6))


def amb_vento():
	rng = rng_for("amb_vento")
	L = smooth_len(50 * SR)
	dry = np.zeros((2, L))
	gust = lfo(L, 0.07, rng, 0.0, 1.0) ** 1.5
	# il vento: bande che si accendono con le raffiche (le alte solo nelle raffiche forti)
	edges = [40, 90, 160, 280, 450, 700, 1100, 1700, 2600, 4000]
	for i in range(len(edges) - 1):
		lo_, hi_ = edges[i], edges[i + 1]
		nb = shaped_noise(L, band(lo_, hi_, 6), rng, corr=0.4)
		k = i / (len(edges) - 2)
		own = lfo(L, 0.18 + 0.05 * i, rng, 0.5, 1.0)
		env = (0.25 + 0.75 * gust) ** (1 + 2.5 * k) * own
		dry += nb * env * db(-22 - 9 * k - (6 if i == 0 else 0))  # il rombo più grave resta sotto
	# fischi: risonanze strette che respirano a turno
	for f0 in (420, 560, 690, 830):
		w = shaped_noise(L, lambda f, f0=f0: 1 / (1 + ((f - f0) / 6.0) ** 2), rng, corr=0.2)
		dry += w * (lfo(L, 0.1, rng, 0.0, 1.0) ** 3) * gust * db(-38)
	# uccelli dell'alba, lontani
	far = np.zeros((2, L))
	for t0 in (6.0, 7.3, 21.5, 33.0, 34.1, 44.0):
		place(far, bird(rng, rng.uniform(2400, 3600)), t0, rng.uniform(-0.8, 0.8), db(-36))
	ir = make_ir(4.5, 3.0, 1.0, predelay=0.06, seed=33, tone_hz=4500)
	mix = dry + reverb_circ(far, ir) * 0.9 + filt_far(far) * 0.3
	return mix, -23.0


def amb_torce():
	rng = rng_for("amb_torce")
	L = smooth_len(40 * SR)
	dry = np.zeros((2, L))
	# due torce: rombo grave che sfarfalla
	for pan in (-0.6, 0.55):
		roar = shaped_noise(L, band(60, 520, 4), rng, stereo=False)[0]
		dry += pan_mono(roar * lfo(L, 6.0, rng, 0.45, 1.0) * lfo(L, 0.3, rng, 0.7, 1.0) * db(-32), pan)
		# crepitii: tanti piccoli, qualche schiocco più forte
		for _ in range(int(40 * 14)):
			lvl = -42 + 22 * rng.random() ** 3
			place(dry, tick(rng, 900, 4200, rng.uniform(0.002, 0.006)), rng.uniform(0, L / SR),
				  pan + rng.normal(0, 0.1), db(lvl))
		for _ in range(int(40 * 0.6)):
			place(dry, tick(rng, 500, 2800, 0.012), rng.uniform(0, L / SR), pan, db(rng.uniform(-24, -18)))
	# la grande sala: aria grave
	room = shaped_noise(L, lambda f: band(30, 220, 4)(f), rng, corr=0.5)
	dry += room * lfo(L, 0.05, rng, 0.6, 1.0) * db(-36)
	# un'eco metallica lontana (il Custode?) e una goccia nell'ombra
	far = np.zeros((2, L))
	place(far, clang(rng, 165.0), 23.0, 0.35, db(-30))
	for t0 in (5.0, 13.7, 31.2):
		place(far, drop(rng, 820, 0.05, 0.4), t0, -0.3, db(-30))
	ir = make_ir(5.0, 3.8, 1.2, predelay=0.05, seed=34, tone_hz=5000)
	mix = dry + reverb_circ(dry, ir) * 0.3 + reverb_circ(far, ir) * 1.0 + far * 0.15
	return mix, -23.0


def amb_citta():
	rng = rng_for("amb_citta")
	L = smooth_len(45 * SR)
	dry = np.zeros((2, L))
	far = np.zeros((2, L))
	# vento lieve tra le case
	air = shaped_noise(L, lambda f: band(60, 1400, 3)(f) * pink(f), rng, corr=0.3)
	dry += air * lfo(L, 0.09, rng, 0.35, 1.0) * db(-42)
	# una carrozza lontana passa (zoccoli a due tempi, si avvicina e si allontana)
	t, k = 14.0, 0
	while t < 30.0:
		x = (t - 14.0) / 16.0
		g = np.sin(np.pi * x) ** 2
		place(far, hoof(rng, rng.uniform(420, 520)), t, -0.7 + 1.4 * x, db(-20) * g)
		t += 0.17 if k % 2 == 0 else 0.33
		t += rng.normal(0, 0.008)
		k += 1
	# ruote sul basolato
	wheel = shaped_noise(int(16 * SR), band(80, 600, 4), rng, stereo=False)[0]
	e = np.sin(np.pi * np.linspace(0, 1, len(wheel))) ** 2
	place(far, wheel * e * lfo(len(wheel), 12, rng, 0.5, 1.0), 14.0, 0.0, db(-36))
	# un grillo solitario
	t = 2.0
	while t < L / SR:
		if not (30 < t < 38):
			place(dry, chirp_cricket(rng, 4300, 3), t, 0.7, db(-40))
		t += 0.72 * rng.uniform(0.97, 1.03)
	# rintocco lontano e l'assiolo
	place(far, bell_far(rng, 293.66), 3.0, -0.3, db(-30))
	place(far, owl(rng, 1180), 38.0, 0.6, db(-28))
	place(far, owl(rng, 1180), 40.6, 0.6, db(-29))
	ir = make_ir(3.5, 2.4, 0.8, predelay=0.05, seed=35, tone_hz=4500)
	mix = dry + filt_far(far) * 0.35 + reverb_circ(far, ir) * 0.8 + reverb_circ(dry, ir) * 0.15
	return mix, -26.0


AMBIENCES = {
	"citta": amb_citta,
	"pioggia": amb_pioggia,
	"notte": amb_notte,
	"vento": amb_vento,
	"torce": amb_torce,
}


def render(name: str, out_dir: str = OUT, quality: float = 4.0) -> str:
	mix, target = AMBIENCES[name]()
	mix = master_loop(mix, target, ceiling_db=-3.0, comp=False, hp_hz=30.0)
	path = os.path.join(out_dir, f"{name}.ogg")
	write_ogg(path, mix, quality)
	print(f"  {name}: {mix.shape[1] / SR:.1f} s -> {path} ({os.path.getsize(path) / 1e6:.2f} MB)")
	return path


def main(names: list[str]) -> None:
	for n in names or list(AMBIENCES):
		render(n)


if __name__ == "__main__":
	main(sys.argv[1:])
