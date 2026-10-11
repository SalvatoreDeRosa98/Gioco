extends RefCounted
## Limiti della camera dalla stanza (per le stanze in scena: il riquadro Bounds = 0,0 .. size).
## Funziona con qualunque zoom: se la vista (viewport / zoom) è più piccola della stanza i limiti sono
## i bordi della stanza, così la camera si ferma lì e non mostra nulla oltre; se la vista è più grande
## (zoom molto basso) la stanza viene centrata, perché mostrare un po' di fuori è inevitabile.

## Rettangolo dei limiti (mondo) per una stanza di dimensioni size e una vista di dimensioni view.
static func limits(size: Vector2, view: Vector2) -> Rect2:
	var r := Rect2(Vector2.ZERO, size)
	for axis in 2:
		if view[axis] > size[axis]:
			r.position[axis] = (size[axis] - view[axis]) * 0.5
			r.size[axis] = view[axis]
	return r

## Applica i limiti a una camera (anche se lo zoom è cambiato). Ritorna true se li ha cambiati.
static func fit(cam: Camera2D, size: Vector2) -> bool:
	if cam == null or size == Vector2.ZERO:
		return false
	var view := cam.get_viewport_rect().size / cam.zoom
	var r := limits(size, view)
	var want := [int(floor(r.position.x)), int(floor(r.position.y)), int(ceil(r.end.x)), int(ceil(r.end.y))]
	if [cam.limit_left, cam.limit_top, cam.limit_right, cam.limit_bottom] == want:
		return false
	cam.limit_left = want[0]
	cam.limit_top = want[1]
	cam.limit_right = want[2]
	cam.limit_bottom = want[3]
	cam.limit_smoothed = false
	return true

## Area di mondo inquadrata ora dalla camera attiva del viewport.
static func visible_world(vp: Viewport) -> Rect2:
	var inv := vp.get_canvas_transform().affine_inverse()
	var s := vp.get_visible_rect().size
	return Rect2(inv * Vector2.ZERO, Vector2.ZERO).expand(inv * s)
