#!/usr/bin/env bash
# Pubblica lo zip come GitHub Release pre-release con tag mobile "beta".
# A ogni build: sposta il tag "beta" sul commit corrente, sostituisce l'asset e
# aggiorna titolo e note della release (la crea se non esiste ancora).
#
# Richiede il CLI `gh` autenticato (GH_TOKEN) con permesso contents: write.
#
# Variabili:
#   GH_TOKEN            token (in Actions: ${{ github.token }})
#   GITHUB_REPOSITORY   owner/repo                       (obbligatoria)
#   GITHUB_SHA          commit da pubblicare             (default: HEAD)
#   GITHUB_REF_NAME     ramo, solo per le note           (default: ramo corrente)
#   ZIP_PATH            zip da caricare                  (default: build/Ferruccio-beta-windows.zip)
#   BETA_TAG            nome del tag mobile              (default: beta)
set -euo pipefail

TAG="${BETA_TAG:-beta}"
ZIP_PATH="${ZIP_PATH:-build/Ferruccio-beta-windows.zip}"
REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY non impostata}"
: "${GH_TOKEN:?GH_TOKEN non impostato}"
SHA="${GITHUB_SHA:-$(git rev-parse HEAD)}"
BRANCH="${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}"
SHORT="${SHA:0:7}"

[[ -f "$ZIP_PATH" ]] || { echo "::error::Manca $ZIP_PATH"; exit 1; }
ZIP_NAME="$(basename "$ZIP_PATH")"

TITLE="Ferruccio — beta ($(date -u +%d/%m/%Y), ${SHORT})"
NOTES="$(mktemp)"
trap 'rm -f "$NOTES"' EXIT

# --- Note: ultimo commit per esteso (senza trailer tecnici) + i 9 precedenti ---
{
	echo "Versione di prova di **Ferruccio — La Menzogna dei Borbone** per Windows. Si aggiorna a ogni build."
	echo
	echo "**Come provarla:** scarica \`${ZIP_NAME}\` qui sotto (sezione Assets), estrailo e fai doppio clic su \`Ferruccio.exe\`."
	echo "Se compare SmartScreen: *Ulteriori informazioni → Esegui comunque*. Le istruzioni e i comandi sono nel \`LEGGIMI.txt\` dentro lo zip."
	echo
	echo "Build del commit \`${SHORT}\` sul ramo \`${BRANCH}\`, $(date -u '+%d/%m/%Y %H:%M') UTC."
	echo
	echo "### Ultime modifiche"
	echo
	git log -n 1 --format='**%s**' "$SHA"
	echo
	git log -n 1 --format='%b' "$SHA" \
		| grep -v -E '^(Co-Authored-By|Claude-Session|Signed-off-by):' \
		| head -n 40 || true
	echo
	if [[ "$(git rev-list --count "$SHA" 2>/dev/null || echo 0)" -gt 1 ]]; then
		echo "Prima:"
		# shellcheck disable=SC2016  # i backtick sono Markdown letterale, non una sostituzione
		git log -n 9 --skip=1 --format='- %s (`%h`)' "$SHA"
	fi
} > "$NOTES"

echo "Titolo: $TITLE"
echo "--- note ---"
cat "$NOTES"
echo "------------"

# --- Sposta (o crea) il tag mobile sul commit corrente ---
if gh api "repos/${REPO}/git/ref/tags/${TAG}" > /dev/null 2>&1; then
	gh api --method PATCH "repos/${REPO}/git/refs/tags/${TAG}" \
		-f sha="$SHA" -F force=true > /dev/null
else
	gh api --method POST "repos/${REPO}/git/refs" \
		-f ref="refs/tags/${TAG}" -f sha="$SHA" > /dev/null
fi
echo "Tag ${TAG} -> ${SHORT}"

# --- Crea o aggiorna la release ---
if gh release view "$TAG" -R "$REPO" > /dev/null 2>&1; then
	# Prima l'asset (--clobber lo sostituisce), poi titolo e note: chi scarica nel frattempo
	# trova comunque uno zip valido.
	gh release upload "$TAG" "$ZIP_PATH" -R "$REPO" --clobber
	gh release edit "$TAG" -R "$REPO" --title "$TITLE" --notes-file "$NOTES" \
		--prerelease --latest=false
else
	gh release create "$TAG" "$ZIP_PATH" -R "$REPO" --verify-tag \
		--title "$TITLE" --notes-file "$NOTES" --prerelease --latest=false
fi

URL="https://github.com/${REPO}/releases/download/${TAG}/${ZIP_NAME}"
echo "Release aggiornata: https://github.com/${REPO}/releases/tag/${TAG}"
echo "Download diretto:   ${URL}"

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
	{
		echo "### Beta Windows pubblicata"
		echo
		echo "- Commit: \`${SHORT}\` (ramo \`${BRANCH}\`)"
		echo "- Pagina: https://github.com/${REPO}/releases/tag/${TAG}"
		echo "- Download diretto: ${URL}"
	} >> "$GITHUB_STEP_SUMMARY"
fi
