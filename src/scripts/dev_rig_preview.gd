extends SceneTree
## Anteprima del rig a mesh di Ferruccio (CharRig) per controllarlo a occhio, fuori dal gioco.
##
## Uso (dalla radice del repository):
##   xvfb-run -a -s "-screen 0 1280x720x24" $HOME/Godot_v4.6-stable_linux.x86_64 --path src \
##     --rendering-driver opengl3 -s res://scripts/dev_rig_preview.gd [-- --out=CARTELLA]
## Salva in CARTELLA:
##   pose.png        10 pose grandi (scala ~0.5): fermo, corsa 0/90/180/270°, salto, caduta, fendente,
##                   scatto, a terra
##   corsa.png       12 fotogrammi di corsa di fila, con il moto secondario simulato
##   gioco.png       le stesse pose alla scala del gioco (altezza 84 × zoom 1.25), per giudicare la lettura
##   fendente.png    8 istanti del fendente (anticipo, colpo, oltre, rientro)
##   gioco_ambiente.png  come gioco.png con la tinta di tre aree; le ultime 4 rivolte a sinistra, luce da destra
##   dettaglio.png   figura grande senza/con chiaroscuro, e una posa di corsa
##   salto.png       14 istanti di un salto con atterraggio: transizioni e moto secondario
## e stampa "RIG OK" alla fine. Non tocca il gioco: è uno strumento di sviluppo.

const CharRigScript := preload("res://game/char_rig.gd")
const DEFAULT_OUT := "/tmp/claude-0/-home-user-Gioco/0eddf7d9-c1bd-568a-8dfa-80c32f35649d/scratchpad/rig/"
const BG := Color(0.08, 0.085, 0.11)
const FLOOR := Color(0.16, 0.15, 0.17)

var _out := DEFAULT_OUT


func _initialize() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			_out = a.substr(6)
	if not _out.ends_with("/"):
		_out += "/"
	DirAccess.make_dir_recursive_absolute(_out)
	_run.call_deferred()


func _run() -> void:
	var t0 := Time.get_ticks_usec()
	var probe: Node2D = CharRigScript.new()
	var mesh: ArrayMesh = probe._body.mesh
	var arr := mesh.surface_get_arrays(0)
	print("mesh: %d vertici, %d triangoli, costruita in %.1f ms" % [
		(arr[Mesh.ARRAY_VERTEX] as PackedVector2Array).size(),
		(arr[Mesh.ARRAY_INDEX] as PackedInt32Array).size() / 3, (Time.get_ticks_usec() - t0) / 1000.0])
	probe.free()
	var poses: Array[Dictionary] = [
		CharRigScript.pose_idle(0.6),
		CharRigScript.pose_run(0.0),
		CharRigScript.pose_run(PI * 0.5),
		CharRigScript.pose_run(PI),
		CharRigScript.pose_run(PI * 1.5),
		CharRigScript.pose_air(-450.0),
		CharRigScript.pose_air(600.0),
		CharRigScript.blend(CharRigScript.pose_idle(0.0), CharRigScript.pose_slash(0.42, 1.0), 1.0),
		CharRigScript.pose_dash(),
		CharRigScript.pose_dead(),
	]
	# Stoffe come le lascerebbe il movimento di ciascuna posa.
	var cloth: Array[Dictionary] = [
		{"scarf_wave": 5.0, "scarf_phase": 1.0},
		{"scarf_lift": 0.45, "scarf_wave": 16.0, "scarf_phase": 0.0, "hat": -0.08},
		{"scarf_lift": 0.45, "scarf_wave": 16.0, "scarf_phase": 1.6, "hat": -0.12},
		{"scarf_lift": 0.45, "scarf_wave": 16.0, "scarf_phase": 3.1, "hat": -0.05},
		{"scarf_lift": 0.45, "scarf_wave": 16.0, "scarf_phase": 4.7, "hat": -0.1},
		{"scarf_lift": -0.15, "scarf_wave": 10.0, "scarf_phase": 2.0, "hat": -0.3},
		{"scarf_lift": 0.6, "scarf_wave": 14.0, "scarf_phase": 3.5, "hat": 0.35},
		{"scarf_lift": 0.1, "scarf_wave": 8.0, "scarf_phase": 2.5, "hat": 0.1},
		{"scarf_wave": 20.0, "scarf_phase": 1.2},
		{"scarf_wave": 3.0, "scarf_phase": 0.0},
	]
	for i in poses.size():
		poses[i].merge(cloth[i], true)

	await _shoot(poses, 0.5, Vector2i(4000, 600), "pose.png")
	await _detail()
	await _shoot(poses, 84.0 * 1.25 / CharRigScript.FIGURE_SPAN, Vector2i(1400, 170), "gioco.png")
	# Stesse pose con la tinta di tre aree (calda, fredda, verde) e la luce da destra nelle ultime.
	await _shoot(poses, 84.0 * 1.25 / CharRigScript.FIGURE_SPAN, Vector2i(1400, 170), "gioco_ambiente.png", true)

	var slash: Array[Dictionary] = []
	for i in 8:
		var k := float(i) / 7.0
		var p := CharRigScript.pose_idle(0.0)
		p.merge(CharRigScript.pose_slash(k, 1.0), true)
		slash.append(p)
	await _shoot(slash, 0.3, Vector2i(1700, 360), "fendente.png")

	await _run_sequence()
	await _jump_sequence()
	print("RIG OK")
	quit()


## Disegna una fila di pose ferme (niente moto secondario) e salva l'immagine.
func _shoot(poses: Array[Dictionary], scale: float, size: Vector2i, name: String, tinted := false) -> void:
	var tints := [Color(1.0, 0.82, 0.62), Color(0.62, 0.74, 1.0), Color(0.7, 0.95, 0.72)]
	var vp := _viewport(size)
	var step := float(size.x) / poses.size()
	var h := CharRigScript.FIGURE_SPAN * scale
	for i in poses.size():
		var r: Node2D = CharRigScript.new()
		r.height = h
		r.cloth_dynamics = false
		r.position = Vector2(step * (i + 0.5) - h * 0.05, size.y - 14.0 * maxf(scale, 0.3))
		if tinted:
			r.ambient = tints[i % tints.size()]
			r.ambient_amount = 0.35
			r.light_color = tints[i % tints.size()].lightened(0.4)
			if i >= 4:
				# Rivolto a sinistra con la luce da destra: il taglio di luce deve restare a destra.
				r.light_dir = Vector2(0.6, -0.8)
				r.facing = -1.0
		vp.add_child(r)
		r.set_pose(poses[i])
	await _save(vp, name)


## Una figura grande senza e con chiaroscuro e luce di taglio, più un fendente, per i dettagli.
func _detail() -> void:
	var size := Vector2i(3300, 940)
	var vp := _viewport(size)
	var h := CharRigScript.FIGURE_SPAN * 0.9
	var setups := [
		{"rim": 0.0, "shade": false, "pose": CharRigScript.pose_idle(0.0)},
		{"rim": 0.5, "shade": true, "pose": CharRigScript.pose_idle(0.0)},
		{"rim": 0.5, "shade": true, "pose": CharRigScript.pose_run(PI * 0.5)},
		{"rim": 0.5, "shade": true, "pose": CharRigScript.pose_run(0.0)},
		{"rim": 0.5, "shade": true, "pose": CharRigScript.pose_air(-400.0)},
	]
	for i in setups.size():
		var r: Node2D = CharRigScript.new()
		r.height = h
		r.cloth_dynamics = false
		r.position = Vector2(size.x / float(setups.size()) * (i + 0.6), size.y - 16.0)
		r.rim_strength = setups[i]["rim"]
		vp.add_child(r)
		var p: Dictionary = setups[i]["pose"]
		p.merge({"scarf_lift": 0.3, "scarf_wave": 12.0, "scarf_phase": 1.0}, true)
		r.set_pose(p)
		if not setups[i]["shade"]:
			for m in [r._mat, r._hand_mat]:
				m.set_shader_parameter("shade_strength", 0.0)
				m.set_shader_parameter("ground_shade", 0.0)
	await _save(vp, "dettaglio.png")


## 12 fotogrammi di un passo di corsa, dopo un riscaldamento che porta a regime le molle.
func _run_sequence() -> void:
	var size := Vector2i(2400, 380)
	var vp := _viewport(size)
	var scale := 0.3
	var r: Node2D = CharRigScript.new()
	r.height = CharRigScript.FIGURE_SPAN * scale
	vp.add_child(r)
	var dt := 1.0 / 60.0
	var speed := 270.0
	var phase := 0.0
	var frames: Array[Dictionary] = []
	for f in 240:
		phase += dt * speed * 0.048
		r.set_target(CharRigScript.pose_run(phase))
		r.advance(dt, Vector2(speed, 0.0))
	# Un passo intero (2π) diviso in 12 istanti, fotografando la posa con le molle vere.
	var per_frame := TAU / 12.0 / (speed * 0.048)
	var copies: Array[Node2D] = []
	for i in 12:
		var t := 0.0
		while t < per_frame:
			phase += dt * speed * 0.048
			r.set_target(CharRigScript.pose_run(phase))
			r.advance(dt, Vector2(speed, 0.0))
			t += dt
		var c: Node2D = r.make_ghost(Color.WHITE)
		c.flash = 0.0
		c.position = Vector2(size.x / 12.0 * (i + 0.5), size.y - 10.0)
		c.apply()
		copies.append(c)
	r.queue_free()
	for c in copies:
		vp.add_child(c)
	await _save(vp, "corsa.png")


## Un salto con atterraggio e ripresa, a 60 fps simulati: 14 istanti per vedere le transizioni
## morbide (set_target/advance) e il moto secondario di cappello, sciarpa e orlo.
func _jump_sequence() -> void:
	var size := Vector2i(2600, 520)
	var vp := _viewport(size)
	var scale := 0.3
	var r: Node2D = CharRigScript.new()
	r.height = CharRigScript.FIGURE_SPAN * scale
	vp.add_child(r)
	var dt := 1.0 / 60.0
	var t := 0.0
	var vy := 0.0
	var y := 0.0
	var air := false
	var copies: Array[Node2D] = []
	var shots := [0.05, 0.12, 0.2, 0.3, 0.4, 0.5, 0.58, 0.64, 0.7, 0.76, 0.84, 0.95, 1.1, 1.3]
	var next := 0
	# Fermo per mezzo secondo, poi stacco a 0.5 s, atterraggio, ripresa.
	for f in 120:
		t = f * dt - 0.5
		if t >= 0.0 and t < dt:
			vy = -560.0
			air = true
			r.squash = 0.12
		if air:
			vy += 1700.0 * (1.5 if vy > 0.0 else 1.0) * dt
			y += vy * dt
			if y >= 0.0:
				y = 0.0
				air = false
				vy = 0.0
				r.squash = -0.22
		r.set_target(CharRigScript.pose_air(vy) if air else CharRigScript.pose_idle(t))
		r.advance(dt, Vector2(60.0, vy))
		if next < shots.size() and t >= shots[next]:
			var c: Node2D = r.make_ghost(Color.WHITE)
			c.flash = 0.0
			c.position = Vector2(size.x / float(shots.size()) * (next + 0.5), size.y - 14.0 + y * scale * CharRigScript.FIGURE_SPAN / 84.0 * 0.5)
			c.apply()
			copies.append(c)
			next += 1
	r.queue_free()
	for c in copies:
		vp.add_child(c)
	await _save(vp, "salto.png")


func _viewport(size: Vector2i) -> SubViewport:
	var vp := SubViewport.new()
	vp.size = size
	vp.transparent_bg = false
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(vp)
	var bg := ColorRect.new()
	bg.color = BG
	bg.size = Vector2(size)
	vp.add_child(bg)
	var fl := ColorRect.new()
	fl.color = FLOOR
	fl.position = Vector2(0, size.y - 14)
	fl.size = Vector2(size.x, 14)
	vp.add_child(fl)
	return vp


func _save(vp: SubViewport, name: String) -> void:
	for i in 3:
		await RenderingServer.frame_post_draw
	var img := vp.get_texture().get_image()
	img.save_png(_out + name)
	print("salvato ", _out + name)
	vp.queue_free()
