$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8

$ProjectRoot = Split-Path $PSScriptRoot -Parent
$BackupRoot = Join-Path $ProjectRoot "backups"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupDir = Join-Path $BackupRoot $Timestamp
$DbPath = Join-Path $ProjectRoot "prisma\dev.db"
$UploadsPath = Join-Path $ProjectRoot "public\uploads"

Write-Host "Starting Backup..." -ForegroundColor Cyan

if (-not (Test-Path $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot | Out-Null
}

New-Item -ItemType Directory -Path $BackupDir | Out-Null

if (Test-Path $DbPath) {
    Copy-Item -Path $DbPath -Destination $BackupDir
    Write-Host "Database copied." -ForegroundColor Green
} else {
    Write-Warning "Database not found."
}

if (Test-Path $UploadsPath) {
    Copy-Item -Path $UploadsPath -Destination $BackupDir -Recurse
    Write-Host "Uploads copied." -ForegroundColor Green
} else {
    Write-Warning "Uploads folder not found."
}

$ZipPath = Join-Path $BackupRoot "backup_$Timestamp.zip"
Compress-Archive -Path "$BackupDir\*" -DestinationPath $ZipPath

Remove-Item -Path $BackupDir -Recurse -Force

Write-Host "Backup Complete: $ZipPath" -ForegroundColor Green
