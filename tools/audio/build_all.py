"""Rigenera TUTTO l'audio di Ferruccio e lo prepara per Godot.

Lancio (dalla radice del repository):
	pip install -r tools/audio/requirements.txt      # una volta (serve anche ffmpeg con libvorbis)
	python3 tools/audio/build_all.py                  # musica + ambienti + effetti + analisi
	python3 tools/audio/build_all.py --only sfx       # solo una parte: music | ambience | sfx
	python3 tools/audio/build_all.py --png /tmp/spettri --godot $HOME/Godot_v4.6-stable_linux.x86_64

Passi:
1. music.py    -> src/assets/audio/music/*.ogg     (6 brani in loop, ~2 minuti di calcolo su 4 core)
2. ambience.py -> src/assets/audio/ambience/*.ogg  (5 ambienti in loop)
3. sfx.py      -> src/assets/audio/sfx/*.wav       (effetti brevi + il ronzio in loop)
4. analyze.py  -> tabella di controllo (picchi, LUFS, giunzione del loop, spettro), PNG con --png
5. con --godot: import headless, poi loop=true negli .import di musica/ambienti e loop_mode
   forward (non compresso) per vespa_ronzio.wav, poi un secondo import che li applica,
   infine godot_probe.gd (autoload Audio, loop attivi, ogni effetto si carica e suona).

Tutto è deterministico: stessi script -> stessi file (seed fissi derivati dai nomi).
"""
from __future__ import annotations

import argparse
import glob
import os
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
AUDIO = os.path.join(ROOT, "src", "assets", "audio")
LOOP_SFX = ["vespa_ronzio.wav"]


def patch_imports() -> int:
	"""Attiva il loop negli .import (Godot li crea con loop=false). Restituisce i file toccati."""
	n = 0
	for f in glob.glob(os.path.join(AUDIO, "music", "*.ogg.import")) + glob.glob(
			os.path.join(AUDIO, "ambience", "*.ogg.import")):
		s = open(f).read()
		t = re.sub(r"^loop=false$", "loop=true", s, flags=re.M)
		if t != s:
			open(f, "w").write(t)
			n += 1
	for name in LOOP_SFX:
		f = os.path.join(AUDIO, "sfx", name + ".import")
		if not os.path.exists(f):
			continue
		s = open(f).read()
		t = re.sub(r"^edit/loop_mode=\d+$", "edit/loop_mode=2", s, flags=re.M)
		t = re.sub(r"^compress/mode=\d+$", "compress/mode=0", t, flags=re.M)
		if t != s:
			open(f, "w").write(t)
			n += 1
	return n


def godot_import(godot: str) -> None:
	src = os.path.join(ROOT, "src")
	subprocess.run([godot, "--headless", "--path", src, "--import"], check=True, capture_output=True)


def main() -> None:
	ap = argparse.ArgumentParser()
	ap.add_argument("--only", choices=["music", "ambience", "sfx"], default=None)
	ap.add_argument("--png", default=None, help="cartella per gli spettrogrammi")
	ap.add_argument("--godot", default=None, help="eseguibile di Godot 4.6 per import e loop")
	a = ap.parse_args()
	t0 = time.time()
	parts = [a.only] if a.only else ["music", "ambience", "sfx"]
	if "music" in parts:
		print("== musica")
		import music
		music.main([])
	if "ambience" in parts:
		print("== ambienti")
		import ambience
		ambience.main([])
	if "sfx" in parts:
		print("== effetti")
		import sfx
		sfx.main([])
	print("== analisi")
	import analyze
	for part in parts:
		for f in sorted(glob.glob(os.path.join(AUDIO, part, "*.*"))):
			if f.endswith(".import"):
				continue
			print(analyze.fmt(analyze.analyze(f, a.png)))
	if a.godot:
		print("== import Godot")
		godot_import(a.godot)
		if patch_imports():
			godot_import(a.godot)
		print("== prova headless dell'autoload Audio")
		r = subprocess.run([a.godot, "--headless", "--audio-driver", "Dummy", "--path", os.path.join(ROOT, "src"),
							"--script", os.path.join(HERE, "godot_probe.gd")], capture_output=True, text=True)
		bad = [ln for ln in (r.stdout + r.stderr).splitlines() if ln.startswith("FAIL") or "SCRIPT ERROR" in ln]
		print("\n".join(bad) if bad else "   tutto a posto")
	total = sum(os.path.getsize(f) for f in glob.glob(os.path.join(AUDIO, "*", "*")) if not f.endswith(".import"))
	print(f"== fatto in {time.time() - t0:.0f} s, audio totale {total / 1e6:.1f} MB")


if __name__ == "__main__":
	main()
