class_name TextDefer
extends RefCounted
## Scritte del mondo (nomi dei nemici, cartelli e scritte dei passaggi, incudine) che aspettano
## che titolo e sottotitolo d'area spariscano, poi entrano in dissolvenza. Un solo meccanismo
## per tutto il gioco: ogni nodo tiene la sua alpha e la fa avanzare con step().

## Durata della dissolvenza in entrata/uscita (secondi).
const FADE := 0.5


## True finche' il titolo d'area e' a schermo: le scritte del mondo restano nascoste.
static func deferred(world: Node) -> bool:
	return world != null and world.get("_hud") != null and world._hud.area_title_visible()


## Nuova alpha dopo delta secondi: verso 0 mentre c'e' il titolo, verso 1 dopo.
static func step(alpha: float, world: Node, delta: float) -> float:
	return move_toward(alpha, 0.0 if deferred(world) else 1.0, delta / FADE)