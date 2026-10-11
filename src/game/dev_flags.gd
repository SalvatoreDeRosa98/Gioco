class_name DevFlags
extends RefCounted
## Strumenti da sviluppatore (invulnerabilita' con Ctrl+Maiusc+F12 e relativa scritta a schermo).
## Attivi SOLO in una build di debug (editor o export di debug) E con un flag esplicito:
## l'argomento `--dev` oppure l'impostazione di progetto `ferruccio/debug/dev_tools` = true.
## Nell'exe esportato in release non compaiono mai.

const SETTING := "ferruccio/debug/dev_tools"
## Solo per i test: forza lo stato (-1 = automatico, 0 = spento, 1 = acceso).
static var force := -1


static func enabled() -> bool:
	if force >= 0:
		return force == 1
	if not OS.is_debug_build():
		return false
	return "--dev" in OS.get_cmdline_user_args() or "--dev" in OS.get_cmdline_args() or bool(ProjectSettings.get_setting(SETTING, false))