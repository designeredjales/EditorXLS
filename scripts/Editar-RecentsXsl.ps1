<#
.SYNOPSIS
  Versão em PowerShell do Editor XSL (não precisa compilar nada).
  Remove a ordenação por data (<xsl:sort select="@date" order="descending"/>)
  de todos os recents.xsl encontrados na pasta informada (busca recursiva).

.EXAMPLE
  .\Editar-RecentsXsl.ps1 -Pasta "C:\Promob" -Simular
  .\Editar-RecentsXsl.ps1 -Pasta "C:\Promob"
#>
param(
    [Parameter(Mandatory = $true)][string]$Pasta,
    [string]$Arquivo = "recents.xsl",
    [switch]$SemBackup,
    [switch]$Simular
)

$tokens = 'xsl:sort', 'select', '"@date"', 'order', '"descending"'

function Test-LinhaOrdenacao([string]$linha) {
    foreach ($t in $tokens) {
        if ($linha.IndexOf($t, [StringComparison]::OrdinalIgnoreCase) -lt 0) { return $false }
    }
    return $true
}

$erros = 0
Get-ChildItem -LiteralPath $Pasta -Filter $Arquivo -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    $path = $_.FullName
    try {
        $bytes = [IO.File]::ReadAllBytes($path)
        $temBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
        $enc = New-Object Text.UTF8Encoding($temBom)
        $offset = if ($temBom) { 3 } else { 0 }
        $texto = $enc.GetString($bytes, $offset, $bytes.Length - $offset)

        # Divide mantendo as quebras de linha originais (CRLF/LF)
        $linhas = [regex]::Split($texto, '(?<=\n)')
        $removidas = @($linhas | Where-Object { Test-LinhaOrdenacao $_ }).Count

        if ($removidas -eq 0) { Write-Host "OK      $path (nada a remover)"; return }
        if ($Simular) { Write-Host "SIMUL.  $path ($removidas linha(s))" -ForegroundColor Yellow; return }

        if (-not $SemBackup) { Copy-Item -LiteralPath $path -Destination "$path.bak" -Force }
        $novo = -join ($linhas | Where-Object { -not (Test-LinhaOrdenacao $_) })
        [IO.File]::WriteAllText("$path.temp", $novo, $enc)
        Copy-Item -LiteralPath "$path.temp" -Destination $path -Force
        Remove-Item -LiteralPath "$path.temp"
        Write-Host "EDITADO $path ($removidas linha(s))" -ForegroundColor Green
    }
    catch {
        $erros++
        Write-Host "ERRO    $path — $($_.Exception.Message)" -ForegroundColor Red
    }
}
if ($erros -gt 0) { exit 1 }
