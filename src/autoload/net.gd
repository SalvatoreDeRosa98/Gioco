extends Node
## Sessione di gioco. Il gioco è per un solo giocatore: start_solo() usa un peer "offline",
## così il mondo resta autorevole (peer 1) senza aprire porte di rete.
## host()/join() restano solo finché non viene tolto il codice co-op dal mondo.

signal lobby_changed
signal game_started
signal session_ended(reason: String)

const DEFAULT_PORT := 7777
const MAX_PLAYERS := 4

var players: Dictionary = {}  # peer_id -> nome visualizzato
var world_seed := 0
var _running := false
var _pending_name := "Ospite"


func _ready() -> void:
	multiplayer.peer_disconnected.connect(_on_peer_disconnected)
	multiplayer.connected_to_server.connect(_on_connected_to_server)
	multiplayer.connection_failed.connect(_on_connection_failed)
	multiplayer.server_disconnected.connect(_on_server_disconnected)


func is_host() -> bool:
	return multiplayer.multiplayer_peer != null and multiplayer.is_server()


func host(port: int, player_name: String) -> Error:
	var peer := ENetMultiplayerPeer.new()
	var err := peer.create_server(port, MAX_PLAYERS)
	if err != OK:
		return err
	multiplayer.multiplayer_peer = peer
	_running = false
	players = {1: player_name}
	lobby_changed.emit()
	return OK


## Avvia una partita per un solo giocatore, senza rete.
func start_solo(player_name: String) -> void:
	multiplayer.multiplayer_peer = OfflineMultiplayerPeer.new()
	players = {1: player_name}
	world_seed = randi()
	_running = true
	game_started.emit()


func join(ip: String, port: int, player_name: String) -> Error:
	var peer := ENetMultiplayerPeer.new()
	var err := peer.create_client(ip, port)
	if err != OK:
		return err
	multiplayer.multiplayer_peer = peer
	_pending_name = player_name
	return OK


func start_game() -> void:
	if is_host() and not players.is_empty():
		_begin.rpc(randi(), players)


func leave() -> void:
	_end_session("")


func _end_session(reason: String) -> void:
	if multiplayer.multiplayer_peer != null:
		multiplayer.multiplayer_peer.close()
	multiplayer.multiplayer_peer = null
	players.clear()
	_running = false
	session_ended.emit(reason)


func _on_connected_to_server() -> void:
	_hello.rpc_id(1, _pending_name)


func _on_connection_failed() -> void:
	_end_session("Connessione fallita: controlla IP e porta.")


func _on_server_disconnected() -> void:
	_end_session("Connessione persa con l'host.")


func _on_peer_disconnected(id: int) -> void:
	# In partita il mondo gestisce l'uscita del giocatore.
	if not is_host() or _running:
		return
	players.erase(id)
	_sync_lobby.rpc(players)


@rpc("any_peer", "reliable")
func _hello(player_name: String) -> void:
	if not is_host():
		return
	var id := multiplayer.get_remote_sender_id()
	if _running or players.size() >= MAX_PLAYERS:
		(multiplayer.multiplayer_peer as ENetMultiplayerPeer).disconnect_peer(id)
		return
	var clean := player_name.strip_edges().left(16)
	players[id] = clean if clean != "" else "Ospite"
	_sync_lobby.rpc(players)


@rpc("authority", "call_local", "reliable")
func _sync_lobby(roster: Dictionary) -> void:
	players = roster
	lobby_changed.emit()


@rpc("authority", "call_local", "reliable")
func _begin(seed_value: int, roster: Dictionary) -> void:
	world_seed = seed_value
	players = roster
	_running = true
	game_started.emit()
