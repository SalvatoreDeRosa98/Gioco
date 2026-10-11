# Esegue tutti i test GDScript headless e riassume l'esito. Uso: powershell -File tools/levels/run_tests.ps1 [-Out file]
param([string]$Out = "")
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$godot = "E:/gioco/.tools/godot/Godot_v4.6-stable_win64_console.exe"
$results = @()
foreach ($t in Get-ChildItem "$root/tests" -Recurse -Filter *_test.gd) {
  # Parametri dichiarati nell'intestazione del test ("## Uso: ... -- --room=3 --at=2280").
  $usage = Select-String -Path $t.FullName -Pattern '^##\s*Uso:.*\s--\s+(.+)$' | Select-Object -First 1
  $extra = @()
  if ($usage) { $extra = @('--') + ($usage.Matches[0].Groups[1].Value.Trim() -split '\s+') }
  $log = & $godot --headless --path "$root/src" --script $t.FullName.Replace('\','/') @extra 2>&1 | Out-String
  $code = $LASTEXITCODE
  $line = ($log -split "`n" | Where-Object { $_ -match 'fallimenti|failures|passed|FAIL' } | Select-Object -Last 1)
  $errs = ($log -split "`n" | Where-Object { $_ -match '^(ERROR|SCRIPT ERROR)' -and $_ -notmatch 'resources still in use' } | Select-Object -First 3) -join ' | '
  $results += "{0}`t{1}`t{2}`t{3}" -f $t.Name, ($(if ($code -eq 0) {'OK'} else {"FAIL($code)"})), "$line".Trim(), $errs
}
$summary = $results -join "`n"
if ($Out) { $summary | Set-Content -Encoding utf8 $Out }
$summary
