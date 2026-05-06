# ============================================================================
# Script para Atualizar Logo do GoalEdge
# ============================================================================
# 
# Uso:
# 1. Salve a logo original como "goaledge-logo.png" na raiz do projeto
# 2. Execute: .\update-logo.ps1
# 
# Requisitos:
# - ImageMagick instalado (choco install imagemagick)
# ============================================================================

Write-Host "🎨 GoalEdge - Atualizador de Logo" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se ImageMagick está instalado
$magickInstalled = Get-Command magick -ErrorAction SilentlyContinue

if (-not $magickInstalled) {
    Write-Host "❌ ImageMagick não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale o ImageMagick primeiro:" -ForegroundColor Yellow
    Write-Host "  choco install imagemagick" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou baixe em: https://imagemagick.org/script/download.php" -ForegroundColor White
    exit 1
}

Write-Host "✅ ImageMagick encontrado" -ForegroundColor Green

# Verificar se a logo original existe
if (-not (Test-Path "goaledge-logo.png")) {
    Write-Host ""
    Write-Host "❌ Arquivo 'goaledge-logo.png' não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Salve a logo GoalEdge como 'goaledge-logo.png'" -ForegroundColor White
    Write-Host "2. Coloque na raiz do projeto" -ForegroundColor White
    Write-Host "3. Execute este script novamente" -ForegroundColor White
    exit 1
}

Write-Host "✅ Logo original encontrada" -ForegroundColor Green
Write-Host ""

# Criar pasta assets/images se não existir
if (-not (Test-Path "assets/images")) {
    New-Item -ItemType Directory -Path "assets/images" -Force | Out-Null
    Write-Host "📁 Pasta assets/images criada" -ForegroundColor Green
}

Write-Host "🔄 Gerando versões da logo..." -ForegroundColor Cyan
Write-Host ""

# 1. icon.png (1024x1024)
Write-Host "  📱 Criando icon.png (1024x1024)..." -NoNewline
magick goaledge-logo.png -resize 1024x1024 -background none -gravity center -extent 1024x1024 assets/images/icon.png
if ($LASTEXITCODE -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ❌" -ForegroundColor Red
}

# 2. adaptive-icon.png (1024x1024 com margem)
Write-Host "  🤖 Criando adaptive-icon.png (1024x1024)..." -NoNewline
magick goaledge-logo.png -resize 820x820 -background none -gravity center -extent 1024x1024 assets/images/adaptive-icon.png
if ($LASTEXITCODE -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ❌" -ForegroundColor Red
}

# 3. splash.png (1284x2778)
Write-Host "  💦 Criando splash.png (1284x2778)..." -NoNewline
magick goaledge-logo.png -resize 600x600 -background none -gravity center -extent 1284x2778 assets/images/splash.png
if ($LASTEXITCODE -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ❌" -ForegroundColor Red
}

# 4. favicon.png (48x48)
Write-Host "  🌐 Criando favicon.png (48x48)..." -NoNewline
magick goaledge-logo.png -resize 48x48 assets/images/favicon.png
if ($LASTEXITCODE -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ❌" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Todas as versões da logo foram criadas!" -ForegroundColor Green
Write-Host ""

# Verificar tamanhos dos arquivos
Write-Host "📊 Verificando arquivos criados:" -ForegroundColor Cyan
Write-Host ""

$files = @(
    @{Path="assets/images/icon.png"; ExpectedSize="1024x1024"},
    @{Path="assets/images/adaptive-icon.png"; ExpectedSize="1024x1024"},
    @{Path="assets/images/splash.png"; ExpectedSize="1284x2778"},
    @{Path="assets/images/favicon.png"; ExpectedSize="48x48"}
)

foreach ($file in $files) {
    if (Test-Path $file.Path) {
        $size = (Get-Item $file.Path).Length
        $sizeKB = [math]::Round($size / 1KB, 2)
        Write-Host "  ✅ $($file.Path)" -ForegroundColor Green
        Write-Host "     Tamanho: $sizeKB KB | Esperado: $($file.ExpectedSize)" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ $($file.Path) - NÃO ENCONTRADO" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Limpar cache do Expo:" -ForegroundColor Yellow
Write-Host "   npx expo start -c" -ForegroundColor White
Write-Host ""
Write-Host "2. Testar no simulador/dispositivo:" -ForegroundColor Yellow
Write-Host "   npx expo run:android" -ForegroundColor White
Write-Host "   npx expo run:ios" -ForegroundColor White
Write-Host ""
Write-Host "3. Se o ícone não atualizar:" -ForegroundColor Yellow
Write-Host "   - Desinstale o app do dispositivo" -ForegroundColor White
Write-Host "   - Execute novamente: npx expo run:android/ios" -ForegroundColor White
Write-Host ""
Write-Host "✨ Logo GoalEdge atualizada com sucesso!" -ForegroundColor Green
