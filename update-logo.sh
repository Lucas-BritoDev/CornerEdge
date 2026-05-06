#!/bin/bash

# ============================================================================
# Script para Atualizar Logo do GoalEdge
# ============================================================================
# 
# Uso:
# 1. Salve a logo original como "goaledge-logo.png" na raiz do projeto
# 2. Execute: chmod +x update-logo.sh && ./update-logo.sh
# 
# Requisitos:
# - ImageMagick instalado (brew install imagemagick ou apt-get install imagemagick)
# ============================================================================

echo "🎨 GoalEdge - Atualizador de Logo"
echo "================================="
echo ""

# Verificar se ImageMagick está instalado
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick não encontrado!"
    echo ""
    echo "Instale o ImageMagick primeiro:"
    echo "  Mac: brew install imagemagick"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  Fedora: sudo dnf install imagemagick"
    echo ""
    exit 1
fi

# Usar 'magick' se disponível, senão 'convert' (versão antiga)
if command -v magick &> /dev/null; then
    MAGICK_CMD="magick"
else
    MAGICK_CMD="convert"
fi

echo "✅ ImageMagick encontrado ($MAGICK_CMD)"

# Verificar se a logo original existe
if [ ! -f "goaledge-logo.png" ]; then
    echo ""
    echo "❌ Arquivo 'goaledge-logo.png' não encontrado!"
    echo ""
    echo "Por favor:"
    echo "1. Salve a logo GoalEdge como 'goaledge-logo.png'"
    echo "2. Coloque na raiz do projeto"
    echo "3. Execute este script novamente"
    exit 1
fi

echo "✅ Logo original encontrada"
echo ""

# Criar pasta assets/images se não existir
mkdir -p assets/images
echo "📁 Pasta assets/images verificada"

echo "🔄 Gerando versões da logo..."
echo ""

# 1. icon.png (1024x1024)
echo -n "  📱 Criando icon.png (1024x1024)..."
$MAGICK_CMD goaledge-logo.png -resize 1024x1024 -background none -gravity center -extent 1024x1024 assets/images/icon.png
if [ $? -eq 0 ]; then
    echo " ✅"
else
    echo " ❌"
fi

# 2. adaptive-icon.png (1024x1024 com margem)
echo -n "  🤖 Criando adaptive-icon.png (1024x1024)..."
$MAGICK_CMD goaledge-logo.png -resize 820x820 -background none -gravity center -extent 1024x1024 assets/images/adaptive-icon.png
if [ $? -eq 0 ]; then
    echo " ✅"
else
    echo " ❌"
fi

# 3. splash.png (1284x2778)
echo -n "  💦 Criando splash.png (1284x2778)..."
$MAGICK_CMD goaledge-logo.png -resize 600x600 -background none -gravity center -extent 1284x2778 assets/images/splash.png
if [ $? -eq 0 ]; then
    echo " ✅"
else
    echo " ❌"
fi

# 4. favicon.png (48x48)
echo -n "  🌐 Criando favicon.png (48x48)..."
$MAGICK_CMD goaledge-logo.png -resize 48x48 assets/images/favicon.png
if [ $? -eq 0 ]; then
    echo " ✅"
else
    echo " ❌"
fi

echo ""
echo "✅ Todas as versões da logo foram criadas!"
echo ""

# Verificar tamanhos dos arquivos
echo "📊 Verificando arquivos criados:"
echo ""

files=(
    "assets/images/icon.png:1024x1024"
    "assets/images/adaptive-icon.png:1024x1024"
    "assets/images/splash.png:1284x2778"
    "assets/images/favicon.png:48x48"
)

for file_info in "${files[@]}"; do
    IFS=':' read -r filepath expected_size <<< "$file_info"
    if [ -f "$filepath" ]; then
        size=$(du -h "$filepath" | cut -f1)
        echo "  ✅ $filepath"
        echo "     Tamanho: $size | Esperado: $expected_size"
    else
        echo "  ❌ $filepath - NÃO ENCONTRADO"
    fi
done

echo ""
echo "🚀 Próximos passos:"
echo ""
echo "1. Limpar cache do Expo:"
echo "   npx expo start -c"
echo ""
echo "2. Testar no simulador/dispositivo:"
echo "   npx expo run:android"
echo "   npx expo run:ios"
echo ""
echo "3. Se o ícone não atualizar:"
echo "   - Desinstale o app do dispositivo"
echo "   - Execute novamente: npx expo run:android/ios"
echo ""
echo "✨ Logo GoalEdge atualizada com sucesso!"
