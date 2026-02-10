<# Wrapper non-interactif (auto confirm) pour lancer le refresh Convex avec valeurs par défaut #>
param(
    [string]$BackupDir = "C:\temp\convex_backups",
    [switch]$IncludeStorage
)

Write-Host "Lancement du refresh (auto). BackupDir=$BackupDir IncludeStorage=$IncludeStorage" -ForegroundColor Cyan
$params = @{ BackupDir = $BackupDir; AutoConfirm = $true; ReplaceAll = $true }
if ($IncludeStorage) { $params.IncludeStorage = $true }
$scriptPath = Join-Path $PSScriptRoot 'convex_sync.ps1'
& $scriptPath @params
