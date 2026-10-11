class_name HudQueue
extends RefCounted
## Coda delle notifiche dell'HUD: i messaggi arrivano in fila, se ne vedono al massimo
## max_visible alla volta impilati senza sovrapporsi; gli altri aspettano il loro turno.
## Solo logica (niente disegno), cosi' si testa senza scena.

## Durata a schermo di un messaggio, in secondi (dissolvenze comprese).
var life := 2.8
## Quanti messaggi si vedono insieme.
var max_visible := 3
## Durata della dissolvenza in entrata/uscita.
var fade := 0.35

var _active: Array = []   # [{text, t}] t = tempo trascorso
var _pending: Array = []  # testi in attesa


## Accoda un messaggio. Un testo identico gia' visibile o in attesa viene rinfrescato, non duplicato.
func push(text: String) -> void:
	if text.strip_edges() == "":
		return
	for e in _active:
		if e.text == text:
			e.t = minf(e.t, fade)
			return
	if text in _pending:
		return
	_pending.append(text)
	_promote()


## Avanza il tempo: scadono i vecchi messaggi, salgono quelli in attesa.
func update(delta: float) -> void:
	for e in _active:
		e.t += delta
	_active = _active.filter(func(e): return e.t < life)
	_promote()


func _promote() -> void:
	while _active.size() < max_visible and not _pending.is_empty():
		_active.append({"text": _pending.pop_front(), "t": 0.0})


## Messaggi visibili dal piu' vecchio al piu' recente, con l'opacita' corrente: [{text, alpha}].
func visible() -> Array:
	var out := []
	for e in _active:
		var a := minf(1.0, e.t / fade) * minf(1.0, (life - e.t) / fade)
		out.append({"text": e.text, "alpha": clampf(a, 0.0, 1.0)})
	return out


func pending_count() -> int:
	return _pending.size()


func clear() -> void:
	_active.clear()
	_pending.clear()
