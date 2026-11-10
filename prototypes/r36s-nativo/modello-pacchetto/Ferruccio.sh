#!/bin/bash
# Ferruccio — La Notte Immobile · script di lancio in formato PortMaster (R36S / ArkOS, aarch64).
# Va copiato in  ports/  insieme alla cartella  ferruccio/ .
# Scrive  ferruccio/dati/lancio.log  (sistema, librerie, errori di avvio) e il lanciatore scrive
# ferruccio/dati/ferruccio.log  (schermo, controller, errori del gioco, fotogrammi al secondo).

XDG_DATA_HOME=${XDG_DATA_HOME:-$HOME/.local/share}
if [ -d "/opt/system/Tools/PortMaster/" ]; then controlfolder="/opt/system/Tools/PortMaster"
elif [ -d "/opt/tools/PortMaster/" ]; then controlfolder="/opt/tools/PortMaster"
elif [ -d "$XDG_DATA_HOME/PortMaster/" ]; then controlfolder="$XDG_DATA_HOME/PortMaster"
else controlfolder="/roms/ports/PortMaster"; fi

QUI="$(cd "$(dirname "$0")" && pwd)"
PM="no"
if [ -f "$controlfolder/control.txt" ]; then
  source "$controlfolder/control.txt"
  [ -f "${controlfolder}/mod_${CFW_NAME}.txt" ] && source "${controlfolder}/mod_${CFW_NAME}.txt"
  type get_controls >/dev/null 2>&1 && get_controls
  PM="si"
fi

GAMEDIR="$QUI/ferruccio"
[ -d "$GAMEDIR" ] || GAMEDIR="/$directory/ports/ferruccio"
cd "$GAMEDIR" || exit 1
mkdir -p "$GAMEDIR/dati"
LOG="$GAMEDIR/dati/lancio.log"

# scelte di lancio che si cambiano senza toccare questo file (vedi ISTRUZIONI.txt)
SDL_DI_SISTEMA=0
[ -f "$GAMEDIR/lancio.conf" ] && source "$GAMEDIR/lancio.conf"

{
  echo "=== Ferruccio: lancio del $(date) ==="
  echo "cartella: $GAMEDIR · PortMaster trovato: $PM ($controlfolder) · CFW: ${CFW_NAME:-?} ${CFW_VERSION:-} · console: ${DEVICE_NAME:-?} · arch: ${DEVICE_ARCH:-$(uname -m)}"
  uname -a
  head -n 4 /etc/os-release 2>/dev/null
  echo "glibc: $(ldd --version 2>/dev/null | head -n 1)"
  echo "memoria: $(free -m 2>/dev/null | sed -n 2p)"
  echo "schermo: $(cat /sys/class/graphics/fb0/virtual_size 2>/dev/null) · dri: $(ls /dev/dri 2>/dev/null | tr '\n' ' ')"
  echo "ingressi: $(ls /dev/input 2>/dev/null | tr '\n' ' ')"
  echo "SDL di sistema: $(ls /usr/lib/aarch64-linux-gnu/libSDL2-2.0.so.0* 2>/dev/null | tr '\n' ' ')"
  echo "mappa del controller (SDL_GAMECONTROLLERCONFIG): ${sdl_controllerconfig:-assente}"
  echo "SDL_DI_SISTEMA=$SDL_DI_SISTEMA"
} > "$LOG" 2>&1

[ -n "$sdl_controllerconfig" ] && export SDL_GAMECONTROLLERCONFIG="$sdl_controllerconfig"

# Piano B per lo schermo: usare la SDL2 del sistema (quella con cui girano gli altri port) al posto di
# quella che viaggia col modulo. Si accende con SDL_DI_SISTEMA=1 in lancio.conf.
if [ "$SDL_DI_SISTEMA" = "1" ]; then
  for f in /usr/lib/aarch64-linux-gnu/libSDL2-2.0.so.0 /usr/lib/libSDL2-2.0.so.0 /usr/lib64/libSDL2-2.0.so.0; do
    if [ -f "$f" ]; then export LD_PRELOAD="$f"; echo "uso la SDL2 di sistema: $f" >> "$LOG"; break; fi
  done
fi

chmod +x "$GAMEDIR/node/node" 2>/dev/null
type pm_platform_helper >/dev/null 2>&1 && pm_platform_helper "$GAMEDIR/node/node" >> "$LOG" 2>&1

"$GAMEDIR/node/node" --max-old-space-size=192 "$GAMEDIR/lanciatore/avvia.js" --dati="$GAMEDIR/dati" >> "$LOG" 2>&1
echo "=== uscita con codice $? alle $(date +%H:%M:%S) ===" >> "$LOG"

unset LD_PRELOAD
type pm_finish >/dev/null 2>&1 && pm_finish
exit 0
