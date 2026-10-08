"""Verifica armonica dei brani senza renderli: elenca gli scontri di semitono.

Lancio:  python3 tools/audio/harmony_check.py [nome ...]

Compone i brani in modalità "a secco" (score.DRY_RUN: solo l'elenco delle note) e
cerca coppie di note di stem diversi che suonano insieme per almeno `--min` tempi
a distanza di seconda minore o nona minore ("aspri"); le settime maggiori, normali
negli accordi di settima maggiore, sono solo contate a parte.
Le percussioni non intonate sono escluse. Sono osservazioni: un'appoggiatura voluta
è legittima, uno scontro tenuto per una battuta intera di solito no.
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import score  # noqa: E402

UNPITCHED = {"drums", "tamb", "timp", "bell"}
NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]


def nn(m: float) -> str:
	m = int(round(m))
	return f"{NAMES[m % 12]}{m // 12 - 1}"


def check(name: str, min_overlap: float) -> tuple[list[str], list[int]]:
	import music
	score.DRY_RUN = True
	s, _settings, _target = music.SONGS[name]()
	ev = [e for e in s.events if e[0] not in UNPITCHED]
	ev.sort(key=lambda e: e[2])
	out: list[str] = []
	soft: list[int] = []
	for i, a in enumerate(ev):
		a_end = a[2] + a[3]
		for b in ev[i + 1:]:
			if b[2] >= a_end:
				break
			if a[0] == b[0]:
				continue
			ov = min(a_end, b[2] + b[3]) - max(a[2], b[2])
			if ov < min_overlap:
				continue
			iv = abs(int(round(a[1])) - int(round(b[1])))
			bar = int(max(a[2], b[2]) // s.bpb) + 1
			if iv in (1, 13):
				out.append(f"  {name:10s} b.{bar:3d}  {a[0]}:{nn(a[1])} contro {b[0]}:{nn(b[1])}  ({ov:.1f} tempi)")
			elif iv % 12 in (1, 11):
				soft.append(bar)
	return out, soft


def main() -> None:
	ap = argparse.ArgumentParser()
	ap.add_argument("names", nargs="*")
	ap.add_argument("--min", type=float, default=1.0, help="sovrapposizione minima in tempi")
	a = ap.parse_args()
	import music
	for n in a.names or list(music.SONGS):
		res, soft = check(n, a.min)
		print(f"{n}: {len(res)} seconde/none minori tenute >= {a.min} tempi; "
			  f"{len(soft)} settime maggiori o intervalli larghi (battute {sorted(set(soft))[:12]})")
		for line in res[:40]:
			print(line)


if __name__ == "__main__":
	main()
