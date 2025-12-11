# Script de Deploy para Sui Testnet
# Uso: .\scripts\deploy.ps1

Write-Host "=== Deploy Sui NFT Contract ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "move/Move.toml")) {
    Write-Host "Erro: Execute este script da raiz do projeto!" -ForegroundColor Red
    exit 1
}

# Compilar
Write-Host "1. Compilando contrato Move..." -ForegroundColor Green
Set-Location move
sui move build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro na compilação!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Compilação bem-sucedida!" -ForegroundColor Green
Write-Host ""

# Publicar
Write-Host "2. Publicando no Sui Testnet..." -ForegroundColor Green
Write-Host "Aguarde..." -ForegroundColor Yellow
Write-Host ""

$output = sui client publish --gas-budget 100000000 2>&1
Write-Host $output

# Extrair Package ID
$packageId = $output | Select-String -Pattern "PackageID:\s*(0x[a-fA-F0-9]+)" | ForEach-Object { $_.Matches.Groups[1].Value }

if ($packageId) {
    Write-Host ""
    Write-Host "✅ Deploy realizado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Package ID: $packageId" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Copie este Package ID e atualize o arquivo frontend/src/config.ts" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "⚠️  Não foi possível extrair o Package ID automaticamente." -ForegroundColor Yellow
    Write-Host "Procure por 'PackageID:' na saída acima e copie manualmente." -ForegroundColor Yellow
}

Set-Location ..

