#!/bin/bash
# Ferruccio — MISURA AUTOMATICA sulla console (facoltativa, dura qualche minuto).
# Il gioco si gioca da solo: menu, piazza, una stanza, una stanza piena di nemici, ai tre livelli di
# qualità, e scrive i tempi veri di questa console in  ferruccio/dati/misura.log . Poi torna al menu.
# È lo stesso lancio di Ferruccio.sh, con un programma diverso.
QUI="$(cd "$(dirname "$0")" && pwd)"
FERRUCCIO_MODO=misura bash "$QUI/Ferruccio.sh"
exit 0
