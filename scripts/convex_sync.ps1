<#
.SYNOPSIS
    Automatisation export/import Convex entre dev et prod.

.DESCRIPTION
    Exporte les données depuis une deployment source (dev), effectue un backup
    de la production cible, affiche le contenu des archives et, après confirmation,
    importe les données de dev dans la production. Propose aussi un rollback.

.PARAMETER DevDeployment
    Nom de la deployment source (défaut: festive-porpoise-323).

.PARAMETER ProdDeployment
    Nom de la deployment cible (défaut: glorious-wren-203).

.PARAMETER DevBackup
    Chemin du fichier ZIP d'export dev (défaut: dev-backup.zip).

.PARAMETER ProdBackup
    Chemin du fichier ZIP de backup prod (défaut: prod-backup.zip).

.PARAMETER IncludeStorage
    Indique si le stockage de fichiers doit être inclus (--include-file-storage).

EXAMPLE
    .\convex_sync.ps1 -IncludeStorage

#>

param(
    [string]$DevDeployment = "festive-porpoise-323",
    [string]$ProdDeployment = "glorious-wren-203",
    [string]$DevBackup = "dev-backup.zip",
    [string]$ProdBackup = "prod-backup.zip",
    [string]$BackupDir = "C:\temp\convex_backups",
    [switch]$IncludeStorage,
    [switch]$AutoConfirm = $true,
    [switch]$AutoDeploy = $true,
    [switch]$ReplaceAll = $true,
    [switch]$RemoveLocal = $false
)

function FailIfNoNpx {
    if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
        Write-Error "npx not found in PATH. Install Node.js / npx before running this script."
        exit 2
    }
}

function Run-ConvexExport($deployment, $path) {
    $includeArg = if ($IncludeStorage) { "--include-file-storage" } else { "" }
    Write-Host "Exporting deployment '$deployment' -> $path" -ForegroundColor Cyan
    if (Test-Path $path) {
        Write-Host "Removing existing file $path" -ForegroundColor Yellow
        Remove-Item -Path $path -Force
    }
    & npx convex export --path $path --deployment-name $deployment $includeArg
    if ($LASTEXITCODE -ne 0) {
        throw "Export failed for $deployment (exit $LASTEXITCODE)"
    }
}

function Run-ConvexImport($path, $deployment, $replaceAll) {
    Write-Host "Importing $path -> deployment '$deployment'" -ForegroundColor Yellow
    $replaceArg = if ($replaceAll) { "--replace-all" } else { "" }
    $yesArg = if ($replaceAll) { "-y" } else { "" }
    & npx convex import $path --deployment-name $deployment $replaceArg $yesArg
    if ($LASTEXITCODE -ne 0) {
        throw "Import failed (exit $LASTEXITCODE)"
    }
}

function Expand-And-List($zipPath, $destDir) {
    if (Test-Path $destDir) { Remove-Item $destDir -Recurse -Force }
    Write-Host "Extracting $zipPath -> $destDir" -ForegroundColor Green
    Expand-Archive -Path $zipPath -DestinationPath $destDir -Force
    Write-Host "Contents of ${destDir}:" -ForegroundColor Green
    Get-ChildItem -Path $destDir -Recurse | Select-Object FullName, Length
}

FailIfNoNpx

if ($BackupDir -ne "") {
    if (-not (Test-Path $BackupDir)) {
        Write-Host "Creating backup directory: $BackupDir" -ForegroundColor Cyan
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    $BackupDir = (Resolve-Path $BackupDir).Path
}

try {
    # 1) Export dev
    $devExportPath = if ($BackupDir -ne "") { Join-Path $BackupDir $DevBackup } else { $DevBackup }
    Run-ConvexExport -deployment $DevDeployment -path $devExportPath

    # 2) Backup prod
    $prodExportPath = if ($BackupDir -ne "") { Join-Path $BackupDir $ProdBackup } else { $ProdBackup }
    Run-ConvexExport -deployment $ProdDeployment -path $prodExportPath

    # 3) Vérifier les archives
    $devExtract = "dev-backup"
    $prodExtract = "prod-backup"
    $devZipPath = if ($BackupDir -ne "") { Join-Path $BackupDir $DevBackup } else { $DevBackup }
    $prodZipPath = if ($BackupDir -ne "") { Join-Path $BackupDir $ProdBackup } else { $ProdBackup }
    Expand-And-List -zipPath $devZipPath -destDir $devExtract
    Expand-And-List -zipPath $prodZipPath -destDir $prodExtract

    if ($RemoveLocal) {
        if (Test-Path $devExtract) {
            Remove-Item -Path $devExtract -Recurse -Force
            Write-Host "Removed extracted folder: $devExtract" -ForegroundColor DarkCyan
        }
        if (Test-Path $prodExtract) {
            Remove-Item -Path $prodExtract -Recurse -Force
            Write-Host "Removed extracted folder: $prodExtract" -ForegroundColor DarkCyan
        }
    }

    # 4) Confirmation avant import
    if ($AutoConfirm) {
        $confirm = 'yes'
        Write-Host "AutoConfirm active - import en cours..." -ForegroundColor Cyan
    } else {
        $confirm = Read-Host "Importer les données de '$DevDeployment' vers '$ProdDeployment' ? Tape 'yes' pour confirmer"
    }
    if ($confirm -ne 'yes') {
        Write-Host "Import annulé par l'utilisateur." -ForegroundColor Magenta
        exit 0
    }

    # 6) Optionnel: déployer le schéma local vers la production avant d'importer
    if ($AutoDeploy) {
        Write-Host "Deploying local schema to deployment '$ProdDeployment'..." -ForegroundColor Cyan
        $env:CONVEX_DEPLOYMENT = $ProdDeployment
        & npx convex deploy --yes
        if ($LASTEXITCODE -ne 0) {
            throw "Deploy failed (exit $LASTEXITCODE)"
        }
        Write-Host "Deploy succeeded." -ForegroundColor Green
        Remove-Item Env:\CONVEX_DEPLOYMENT -ErrorAction SilentlyContinue
    }

    # 7) Importer
    $importPath = if ($BackupDir -ne "") { Join-Path $BackupDir $DevBackup } else { $DevBackup }
    Run-ConvexImport -path $importPath -deployment $ProdDeployment -replaceAll:$ReplaceAll
    Write-Host "Import terminé. Vérifier l'instance de production via le dashboard ou des queries." -ForegroundColor Green

    # Rappel rollback
    $rollbackPath = if ($BackupDir -ne "") { Join-Path $BackupDir $ProdBackup } else { $ProdBackup }
    Write-Host "Si besoin de rollback : re-exécuter: npx convex import $rollbackPath --deployment-name $ProdDeployment" -ForegroundColor Yellow

} catch {
    Write-Error "Erreur: $_"
    $rollbackPath = if ($BackupDir -ne "") { Join-Path $BackupDir $ProdBackup } else { $ProdBackup }
    Write-Host "En cas d'echec, pour restaurer la prod depuis le backup local : npx convex import $rollbackPath --deployment-name $ProdDeployment" -ForegroundColor Red
    exit 1
}

Write-Host "Opération terminée." -ForegroundColor Cyan
