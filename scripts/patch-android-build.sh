#!/bin/bash

# Script para corrigir o erro do Fresco no build.gradle
# Este script é executado automaticamente pelo EAS Build

echo "🔧 Aplicando patch no android/app/build.gradle..."

BUILD_GRADLE="android/app/build.gradle"

if [ -f "$BUILD_GRADLE" ]; then
    # Substituir expoLibs.versions.fresco.get() por versão fixa
    sed -i 's/\${expoLibs\.versions\.fresco\.get()}/3.1.3/g' "$BUILD_GRADLE"
    
    echo "✅ Patch aplicado com sucesso!"
    echo "📝 Versão do Fresco: 3.1.3"
else
    echo "⚠️ Arquivo $BUILD_GRADLE não encontrado"
    exit 1
fi
