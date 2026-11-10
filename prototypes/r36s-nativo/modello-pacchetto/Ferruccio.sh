#!/bin/bash
# Ferruccio — La Notte Immobile · script di lancio per R36S / ArkOS (aarch64).
# Va copiato in  ports/  insieme alla cartella  ferruccio/ : è la stessa forma dei port di PortMaster
# (uno script .sh più la sua cartella), ma è AUTOSUFFICIENTE: non usa nessun file di PortMaster
# (né control.txt, né gptokeyb, né runtime da scaricare). Tutto quello che serve sta in  ferruccio/ .
# NON aprirlo e non salvarlo con un editor di Windows: deve restare coi fine riga di Linux (LF).
#
# Scrive  ferruccio/dati/lancio.log  (sistema, librerie, errori di avvio); il lanciatore scrive
# ferruccio/dati/ferruccio.log  (schermo, tasti, errori del gioco, fotogrammi al secondo).
#
# Permessi: la scheda dei giochi è FAT/exFAT, che non ha i «bit di esecuzione»; il sistema la monta in
# modo che i file risultino eseguibili (è così che partono gli script messi in ports). In più node, se
# non parte direttamente, si riprova attraverso il caricatore di sistema (ld-linux), che quel bit non lo guarda.

QUI="$(cd "$(dirname "$0")" && pwd)"
GAMEDIR="$QUI/ferruccio"
cd "$GAMEDIR" || exit 1
mkdir -p "$GAMEDIR/dati"
LOG="$GAMEDIR/dati/lancio.log"

# scelta della SDL2 (lancio.conf): letta e ripulita, così regge anche un salvataggio da Windows (CRLF)
SDL_SCELTA=auto
if [ -f "$GAMEDIR/lancio.conf" ]; then
  s="$(grep -m 1 '^SDL_SCELTA=' "$GAMEDIR/lancio.conf" | cut -d= -f2 | tr -d '\r\n "')"
  [ -n "$s" ] && SDL_SCELTA="$s"
fi

GLIBC_V="$(getconf GNU_LIBC_VERSION 2>/dev/null | awk '{print $2}')"
[ -z "$GLIBC_V" ] && GLIBC_V="$(ldd --version 2>/dev/null | head -n 1 | grep -o '[0-9]*\.[0-9]*$')"

{
  echo "=== Ferruccio: lancio del $(date) ==="
  echo "cartella: $GAMEDIR · utente: $(id 2>/dev/null) · macchina: $(uname -m)"
  uname -a
  head -n 4 /etc/os-release 2>/dev/null
  echo "glibc: ${GLIBC_V:-sconosciuta} (node chiede almeno 2.28)"
  echo "memoria: $(free -m 2>/dev/null | sed -n 2p)"
  echo "scheda: $(mount 2>/dev/null | grep -E ' /roms2? ' | tr '\n' ' ')"
  echo "schermo: $(cat /sys/class/graphics/fb0/virtual_size 2>/dev/null) · dri: $(ls /dev/dri 2>/dev/null | tr '\n' ' ')"
  echo "ingressi: $(ls /dev/input 2>/dev/null | tr '\n' ' ')"
  echo "SDL2 di sistema: $(ls /usr/lib/aarch64-linux-gnu/libSDL2-2.0.so.0* /usr/lib/libSDL2-2.0.so.0* 2>/dev/null | tr '\n' ' ')"
  echo "variabili SDL già presenti: $(env | grep -i '^SDL' | tr '\n' ' ')"
  echo "PortMaster (non serve, solo per sapere): $(ls -d /opt/system/Tools/PortMaster /roms/tools/PortMaster /roms2/tools/PortMaster /roms/ports/PortMaster 2>/dev/null | tr '\n' ' ')"
} > "$LOG" 2>&1

# Quale SDL2. Quella «in dotazione» (2.32.8, viaggia col gioco) chiede GLIBC 2.34: su ArkOS, che ha una
# GLIBC più vecchia, NON si carica, quindi si usa la SDL2 della console (al lanciatore serve la 2.26 o
# più nuova). auto = in dotazione solo se la GLIBC della console è >= 2.34.
usa_dotazione=0
case "$SDL_SCELTA" in
  dotazione) usa_dotazione=1 ;;
  sistema) ;;
  *) [ -n "$GLIBC_V" ] && [ "$(printf '%s\n2.34\n' "$GLIBC_V" | sort -V | head -n 1)" = "2.34" ] && usa_dotazione=1 ;;
esac
if [ "$usa_dotazione" = "1" ]; then
  export LD_LIBRARY_PATH="$GAMEDIR/sdl-in-dotazione:$LD_LIBRARY_PATH"
  echo "SDL2: quella in dotazione (SDL_SCELTA=$SDL_SCELTA, glibc $GLIBC_V)" >> "$LOG"
else
  echo "SDL2: quella della console (SDL_SCELTA=$SDL_SCELTA, glibc $GLIBC_V)" >> "$LOG"
fi

# node: prima direttamente; se il sistema rifiuta di eseguirlo, attraverso il caricatore di sistema
NODE="$GAMEDIR/node/node"
chmod +x "$NODE" 2>/dev/null
AVVIO=""
if v="$("$NODE" --version 2>&1)"; then
  AVVIO="diretto"
else
  echo "node non parte direttamente: $v" >> "$LOG"
  for ld in /lib/ld-linux-aarch64.so.1 /lib/aarch64-linux-gnu/ld-linux-aarch64.so.1 /lib64/ld-linux-aarch64.so.1; do
    if [ -e "$ld" ] && v="$("$ld" "$NODE" --version 2>&1)"; then AVVIO="$ld"; break; fi
  done
fi
echo "prova di node: $v (avvio: ${AVVIO:-FALLITO})" >> "$LOG"

if [ -z "$AVVIO" ]; then
  echo "node non parte su questo sistema: il gioco non può partire. Mandaci questo file." >> "$LOG"
elif [ "$AVVIO" = "diretto" ]; then
  "$NODE" --max-old-space-size=192 "$GAMEDIR/lanciatore/avvia.js" --dati="$GAMEDIR/dati" >> "$LOG" 2>&1
  echo "=== uscita con codice $? alle $(date +%H:%M:%S) ===" >> "$LOG"
else
  "$AVVIO" "$NODE" --max-old-space-size=192 "$GAMEDIR/lanciatore/avvia.js" --dati="$GAMEDIR/dati" >> "$LOG" 2>&1
  echo "=== uscita con codice $? alle $(date +%H:%M:%S) ===" >> "$LOG"
fi
exit 0
