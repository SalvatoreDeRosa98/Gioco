"""Ascolto oggettivo dei file generati: picchi, loudness, punto di loop, spettro.

Lancio:
	python3 tools/audio/analyze.py [--png DIR] FILE...
	python3 tools/audio/analyze.py --png /tmp/spettri src/assets/audio/music/*.ogg

Per ogni file stampa: durata, peso, picco campione e true peak (dBFS), LUFS
integrati, quota di energia sopra 4 kHz e 8 kHz, centroide spettrale e, per i
loop, il "salto" al punto di giunzione confrontato con i salti tipici del brano
(rapporto ~1 = giunzione invisibile). Con --png salva uno spettrogramma per file.
"""
from __future__ import annotations

import argparse
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dsp import SR, lufs, read_audio, true_peak_db  # noqa: E402


def seam_ratio(x: np.ndarray) -> float:
	"""Errore di predizione lineare alla giunzione fine->inizio diviso il 99.9° percentile
	degli errori interni. <= 1 significa che la giunzione non si distingue dal brano."""
	m = x.mean(axis=0)
	e = np.abs(m[2:] - 2 * m[1:-1] + m[:-2])
	jump = abs(m[0] - 2 * m[-1] + m[-2])
	jump2 = abs(m[1] - 2 * m[0] + m[-1])
	ref = np.percentile(e, 99.9) + 1e-9
	return float(max(jump, jump2) / ref)


def spectrum_stats(x: np.ndarray) -> dict:
	m = x.mean(axis=0)
	n = 1 << 15
	hops = range(0, max(1, len(m) - n), n // 2)
	acc = np.zeros(n // 2 + 1)
	w = np.hanning(n)
	for h in hops:
		seg = m[h:h + n]
		if len(seg) < n:
			break
		acc += np.abs(np.fft.rfft(seg * w)) ** 2
	if acc.sum() == 0:
		seg = np.pad(m, (0, max(0, n - len(m))))[:n]
		acc = np.abs(np.fft.rfft(seg * w)) ** 2
	f = np.fft.rfftfreq(n, 1 / SR)
	tot = acc.sum() + 1e-20
	return {
		"above4k": 10 * np.log10(acc[f > 4000].sum() / tot + 1e-12),
		"above8k": 10 * np.log10(acc[f > 8000].sum() / tot + 1e-12),
		"band2_5k": 10 * np.log10(acc[(f > 2000) & (f < 5000)].sum() / tot + 1e-12),
		"centroid": float((f * acc).sum() / tot),
	}


def spectrogram_png(x: np.ndarray, path: str, title: str) -> None:
	import matplotlib
	matplotlib.use("Agg")
	import matplotlib.pyplot as plt
	from scipy.signal import stft
	m = x.mean(axis=0)
	f, t, Z = stft(m, SR, nperseg=4096, noverlap=3072)
	S = 20 * np.log10(np.abs(Z) + 1e-9)
	S -= S.max()
	fig, axs = plt.subplots(2, 1, figsize=(14, 6.5), gridspec_kw={"height_ratios": [1, 3]}, sharex=True)
	hop = SR // 20
	rms = np.sqrt(np.convolve(m ** 2, np.ones(hop) / hop, "same"))[::hop]
	axs[0].plot(np.arange(len(rms)) / 20, 20 * np.log10(rms + 1e-9), lw=0.8, color="#335")
	axs[0].set_ylim(-60, 0)
	axs[0].set_ylabel("RMS dB")
	axs[0].set_title(title)
	axs[0].grid(alpha=0.3)
	sel = (f > 20) & (f < 16000)
	axs[1].pcolormesh(t, f[sel], S[sel], vmin=-90, vmax=0, shading="auto", cmap="magma")
	axs[1].set_yscale("log")
	axs[1].set_ylim(30, 16000)
	axs[1].set_ylabel("Hz")
	axs[1].set_xlabel("s")
	fig.tight_layout()
	os.makedirs(os.path.dirname(path), exist_ok=True)
	fig.savefig(path, dpi=80)
	plt.close(fig)


def analyze(path: str, png_dir: str | None = None, loop: bool | None = None) -> dict:
	x = read_audio(path)
	if loop is None:
		loop = "/music/" in path or "/ambience/" in path or "loop" in os.path.basename(path)
	r = {
		"file": os.path.basename(path),
		"dur": x.shape[1] / SR,
		"kb": os.path.getsize(path) / 1024,
		"peak": 20 * np.log10(np.abs(x).max() + 1e-12),
		"tp": true_peak_db(x),
		"lufs": lufs(x),
		"dc": float(np.abs(x.mean(axis=1)).max()),
	}
	r.update(spectrum_stats(x))
	r["seam"] = seam_ratio(x) if loop else float("nan")
	if png_dir:
		spectrogram_png(x, os.path.join(png_dir, os.path.splitext(r["file"])[0] + ".png"), r["file"])
	return r


def fmt(r: dict) -> str:
	return (f"{r['file']:28s} {r['dur']:7.2f}s {r['kb']:7.0f}KB peak {r['peak']:6.1f} tp {r['tp']:6.1f} "
			f"LUFS {r['lufs']:6.1f} >4k {r['above4k']:6.1f} >8k {r['above8k']:6.1f} 2-5k {r['band2_5k']:6.1f} "
			f"cent {r['centroid']:6.0f}Hz seam {r['seam']:5.2f}")


def main() -> None:
	ap = argparse.ArgumentParser()
	ap.add_argument("files", nargs="+")
	ap.add_argument("--png", default=None)
	a = ap.parse_args()
	for p in a.files:
		print(fmt(analyze(p, a.png)))


if __name__ == "__main__":
	main()
