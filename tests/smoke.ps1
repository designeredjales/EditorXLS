# Teste rápido: roda o exe em modo linha de comando sobre um recents.xsl de exemplo.
param([Parameter(Mandatory = $true)][string]$Exe)
$ErrorActionPreference = 'Stop'
$dir = Join-Path ([IO.Path]::GetTempPath()) ("editorxsl-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path "$dir\sub" | Out-Null
$xsl = "$dir\sub\recents.xsl"
Copy-Item (Join-Path $PSScriptRoot 'fixtures\recents.xsl') $xsl

$p = Start-Process -FilePath $Exe -ArgumentList "`"$dir`"" -Wait -PassThru
if ($p.ExitCode -ne 0) { throw "Exit code $($p.ExitCode)" }

$conteudo = Get-Content -Raw $xsl
if ($conteudo -match '@date') { throw 'A linha de ordenação por data não foi removida.' }
if ($conteudo -notmatch '@name') { throw 'Uma linha que deveria ficar foi removida.' }
if (-not (Test-Path "$xsl.bak")) { throw 'Backup não foi criado.' }
Write-Host 'Smoke test OK'
