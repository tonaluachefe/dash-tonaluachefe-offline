# Script para fazer push do projeto para GitHub
# Uso: .\push-to-github.ps1 -RepoName "nome-do-repositorio"
# Exemplo: .\push-to-github.ps1 -RepoName "dash-tonaluachefe-offline"

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoName,
    [string]$Username = "tonaluachefe"
)

Write-Host "=== Configuração do Repositório GitHub ===" -ForegroundColor Cyan
Write-Host "Usuário: $Username" -ForegroundColor Green
Write-Host "Repositório: $RepoName" -ForegroundColor Green
Write-Host ""

$repoUrl = "https://github.com/$Username/$RepoName.git"

Write-Host "URL do repositório: $repoUrl" -ForegroundColor Cyan
Write-Host ""

# Verificar se remote já existe
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "Removendo remote existente..." -ForegroundColor Yellow
    git remote remove origin
}

# Adicionar remote
Write-Host "Configurando repositório remoto..." -ForegroundColor Green
git remote add origin $repoUrl

# Renomear branch para main
Write-Host "Renomeando branch para main..." -ForegroundColor Green
git branch -M main

# Fazer push
Write-Host "Fazendo push para o GitHub..." -ForegroundColor Green
Write-Host ""

try {
    git push -u origin main
    Write-Host ""
    Write-Host "✅ Sucesso! Projeto publicado em: https://github.com/$Username/$RepoName" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao fazer push." -ForegroundColor Red
    Write-Host ""
    Write-Host "Certifique-se de:" -ForegroundColor Yellow
    Write-Host "1. Criar o repositório em: https://github.com/new" -ForegroundColor White
    Write-Host "   Nome: $RepoName" -ForegroundColor White
    Write-Host "   NÃO marque 'Initialize with README'" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Configurar autenticação do Git (se necessário):" -ForegroundColor Yellow
    Write-Host "   Use um Personal Access Token do GitHub" -ForegroundColor White
    Write-Host "   Criar em: https://github.com/settings/tokens" -ForegroundColor White
}
