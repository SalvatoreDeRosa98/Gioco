extends CanvasLayer
## Pausa locale: riprende la stessa sessione anche prima del primo salvataggio.
var world: Node
var opened := false
var _panel: Control
var _resume: Button
var _commands: Label

func _ready() -> void:
	layer = 55
	_panel = Control.new()
	var theme := Theme.new()
	theme.default_font = Art.body_font()
	theme.default_font_size = 21
	_panel.theme = theme
	_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_panel)
	var background := ColorRect.new()
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.color = Color(.015,.02,.03,.94)
	_panel.add_child(background)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_panel.add_child(center)
	var box := VBoxContainer.new()
	box.custom_minimum_size = Vector2(760,0)
	box.add_theme_constant_override("separation",18)
	center.add_child(box)
	var title := Label.new()
	title.text = "IL CAMMINO ATTENDE"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_override("font", Art.title_font())
	title.add_theme_font_size_override("font_size",30)
	box.add_child(title)
	_commands = Label.new()
	_commands.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_commands.add_theme_font_override("font", Art.body_font())
	_commands.add_theme_font_size_override("font_size",21)
	box.add_child(_commands)
	_resume = Button.new()
	_resume.text = "Riprendi"
	_resume.pressed.connect(toggle)
	box.add_child(_resume)
	var leave := Button.new()
	leave.text = "Torna al menu · Ripartirai dall'ultima incudine"
	leave.pressed.connect(func():
		world.exit_requested.emit())
	box.add_child(leave)
	_panel.hide()

## Congela la sessione e aggiorna i comandi del dispositivo corrente.
func toggle() -> void:
	opened = not opened
	_panel.visible = opened
	world._freeze_for_talk(opened)
	if opened:
		var lines: Array[String] = []
		for pair in [["move","Muovi"],["jump","Salta · premi ancora in aria"],["drop","Scendi dalla mensola"],["attack","Colpisci · giù in aria per il colpo in basso"],["parry","Para"],["interact","Parla · entra · custodisci i ricordi"],["map","Mappa"],["shop","Lavorazioni nella fucina"],["dash","Scatto · sciarpa di Agnese"],["grapple","Catena · dono della fucina"],["hammer","Martello · progetto nelle Cisterne"],["heal","Cura · tieni premuto con quattro braci"],["pause","Pausa / riprendi"]]:
			lines.append(Controls.label(pair[0]) + "  " + pair[1])
		_commands.text = "\n".join(lines)
		_resume.grab_focus()
