extends SceneTree
## Verifica dei flag da sviluppatore nell'exe esportato: stampa se gli strumenti dev sono attivi.
## Uso: Ferruccio.exe --headless -s res://scripts/dev_flag_probe.gd -- --dev
func _initialize() -> void:
	print("DEV_FLAGS debug_build=%s dev_arg=%s enabled=%s" % [OS.is_debug_build(), "--dev" in OS.get_cmdline_user_args(), DevFlags.enabled()])
	quit(1 if DevFlags.enabled() else 0)