# 🤖 SCRIPT DE AJUSTES AUTOMÁTICOS

Este documento contém scripts para automatizar os ajustes técnicos necessários.

---

## 1. Remover Permissões Desnecessárias

### Script PowerShell (Windows)
```powershell
# Arquivo: fix-permissions.ps1

$manifestPath = "android/app/src/main/AndroidManifest.xml"
$content = Get-Content $manifestPath -Raw

# Remover permissões desnecessárias
$content = $content -replace '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>\r?\n', ''
$content = $content -replace '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>\r?\n', ''
$content = $content -replace '<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>\r?\n', ''

# Salvar arquivo
Set-Content $manifestPath $content -NoNewline

Write-Host "✅ Permissões desnecessárias removidas!" -ForegroundColor Green
```

### Script Bash (Mac/Linux)
```bash
#!/bin/bash
# Arquivo: fix-permissions.sh

MANIFEST="android/app/src/main/AndroidManifest.xml"

# Remover permissões desnecessárias
sed -i.bak '/READ_EXTERNAL_STORAGE/d' "$MANIFEST"
sed -i.bak '/WRITE_EXTERNAL_STORAGE/d' "$MANIFEST"
sed -i.bak '/SYSTEM_ALERT_WINDOW/d' "$MANIFEST"

echo "✅ Permissões desnecessárias removidas!"
```

---

## 2. Atualizar AdMob Application ID

### Script PowerShell (Windows)
```powershell
# Arquivo: update-admob.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$AdMobAppId
)

$manifestPath = "android/app/src/main/AndroidManifest.xml"
$content = Get-Content $manifestPath -Raw

# Substituir placeholder pelo ID real
$content = $content -replace 'ca-app-pub-xxxxxxxx~xxxxxxxx', $AdMobAppId

# Salvar arquivo
Set-Content $manifestPath $content -NoNewline

Write-Host "✅ AdMob Application ID atualizado para: $AdMobAppId" -ForegroundColor Green
```

**Uso:**
```powershell
.\update-admob.ps1 -AdMobAppId "ca-app-pub-1234567890123456~1234567890"
```

### Script Bash (Mac/Linux)
```bash
#!/bin/bash
# Arquivo: update-admob.sh

if [ -z "$1" ]; then
    echo "❌ Erro: Forneça o AdMob Application ID"
    echo "Uso: ./update-admob.sh ca-app-pub-XXXXXXXX~YYYYYY"
    exit 1
fi

ADMOB_ID="$1"
MANIFEST="android/app/src/main/AndroidManifest.xml"

# Substituir placeholder
sed -i.bak "s/ca-app-pub-xxxxxxxx~xxxxxxxx/$ADMOB_ID/g" "$MANIFEST"

echo "✅ AdMob Application ID atualizado para: $ADMOB_ID"
```

**Uso:**
```bash
chmod +x update-admob.sh
./update-admob.sh "ca-app-pub-1234567890123456~1234567890"
```

---

## 3. Criar Keystore de Produção

### Script PowerShell (Windows)
```powershell
# Arquivo: create-keystore.ps1

param(
    [string]$KeystoreName = "@luck1993__goaledge.jks",
    [string]$Alias = "goaledge"
)

Write-Host "🔐 Criando keystore de produção..." -ForegroundColor Cyan
Write-Host ""

# Verificar se keytool está disponível
$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
    Write-Host "❌ Erro: keytool não encontrado!" -ForegroundColor Red
    Write-Host "Certifique-se de que o JDK está instalado e no PATH" -ForegroundColor Yellow
    exit 1
}

# Verificar se keystore já existe
if (Test-Path $KeystoreName) {
    Write-Host "⚠️  Keystore já existe: $KeystoreName" -ForegroundColor Yellow
    $response = Read-Host "Deseja sobrescrever? (s/N)"
    if ($response -ne "s") {
        Write-Host "❌ Operação cancelada" -ForegroundColor Red
        exit 0
    }
    Remove-Item $KeystoreName
}

# Criar keystore
Write-Host "Preencha as informações solicitadas:" -ForegroundColor Yellow
Write-Host ""

keytool -genkeypair -v -storetype PKCS12 `
    -keystore $KeystoreName `
    -alias $Alias `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Keystore criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "1. Guarde o arquivo $KeystoreName em local seguro" -ForegroundColor White
    Write-Host "2. Faça backup do keystore" -ForegroundColor White
    Write-Host "3. Anote as senhas em gerenciador de senhas" -ForegroundColor White
    Write-Host "4. NUNCA commite o keystore no Git" -ForegroundColor White
    Write-Host ""
    Write-Host "📦 Próximo passo:" -ForegroundColor Cyan
    Write-Host "eas credentials" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Erro ao criar keystore" -ForegroundColor Red
    exit 1
}
```

**Uso:**
```powershell
.\create-keystore.ps1
```

### Script Bash (Mac/Linux)
```bash
#!/bin/bash
# Arquivo: create-keystore.sh

KEYSTORE_NAME="@luck1993__goaledge.jks"
ALIAS="goaledge"

echo "🔐 Criando keystore de produção..."
echo ""

# Verificar se keytool está disponível
if ! command -v keytool &> /dev/null; then
    echo "❌ Erro: keytool não encontrado!"
    echo "Certifique-se de que o JDK está instalado"
    exit 1
fi

# Verificar se keystore já existe
if [ -f "$KEYSTORE_NAME" ]; then
    echo "⚠️  Keystore já existe: $KEYSTORE_NAME"
    read -p "Deseja sobrescrever? (s/N): " response
    if [ "$response" != "s" ]; then
        echo "❌ Operação cancelada"
        exit 0
    fi
    rm "$KEYSTORE_NAME"
fi

# Criar keystore
echo "Preencha as informações solicitadas:"
echo ""

keytool -genkeypair -v -storetype PKCS12 \
    -keystore "$KEYSTORE_NAME" \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore criado com sucesso!"
    echo ""
    echo "📋 IMPORTANTE:"
    echo "1. Guarde o arquivo $KEYSTORE_NAME em local seguro"
    echo "2. Faça backup do keystore"
    echo "3. Anote as senhas em gerenciador de senhas"
    echo "4. NUNCA commite o keystore no Git"
    echo ""
    echo "📦 Próximo passo:"
    echo "eas credentials"
else
    echo ""
    echo "❌ Erro ao criar keystore"
    exit 1
fi
```

**Uso:**
```bash
chmod +x create-keystore.sh
./create-keystore.sh
```

---

## 4. Validar Configuração Antes do Build

### Script PowerShell (Windows)
```powershell
# Arquivo: validate-config.ps1

Write-Host "🔍 Validando configuração do projeto..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# 1. Verificar keystore
if (-not (Test-Path "@luck1993__goaledge.jks")) {
    $errors += "❌ Keystore não encontrado: @luck1993__goaledge.jks"
}

# 2. Verificar AdMob ID no AndroidManifest
$manifest = Get-Content "android/app/src/main/AndroidManifest.xml" -Raw
if ($manifest -match 'ca-app-pub-xxxxxxxx~xxxxxxxx') {
    $errors += "❌ AdMob Application ID ainda é placeholder"
}

# 3. Verificar permissões desnecessárias
if ($manifest -match 'READ_EXTERNAL_STORAGE') {
    $warnings += "⚠️  Permissão READ_EXTERNAL_STORAGE ainda presente"
}
if ($manifest -match 'WRITE_EXTERNAL_STORAGE') {
    $warnings += "⚠️  Permissão WRITE_EXTERNAL_STORAGE ainda presente"
}
if ($manifest -match 'SYSTEM_ALERT_WINDOW') {
    $warnings += "⚠️  Permissão SYSTEM_ALERT_WINDOW ainda presente"
}

# 4. Verificar versão no app.json
$appJson = Get-Content "app.json" | ConvertFrom-Json
$version = $appJson.expo.version
Write-Host "📦 Versão do app: $version" -ForegroundColor White

# 5. Verificar package name
$packageName = $appJson.expo.android.package
if ($packageName -ne "com.goaledge.app") {
    $errors += "❌ Package name incorreto: $packageName"
}

# 6. Verificar .env
if (-not (Test-Path ".env")) {
    $warnings += "⚠️  Arquivo .env não encontrado"
}

# Exibir resultados
Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "RESULTADO DA VALIDAÇÃO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ Configuração válida! Pronto para build." -ForegroundColor Green
    exit 0
}

if ($errors.Count -gt 0) {
    Write-Host "ERROS CRÍTICOS:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host $error -ForegroundColor Red
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "AVISOS:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host $warning -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "❌ Corrija os erros antes de gerar o build" -ForegroundColor Red
    exit 1
} else {
    Write-Host "⚠️  Há avisos, mas você pode prosseguir" -ForegroundColor Yellow
    exit 0
}
```

**Uso:**
```powershell
.\validate-config.ps1
```

### Script Bash (Mac/Linux)
```bash
#!/bin/bash
# Arquivo: validate-config.sh

echo "🔍 Validando configuração do projeto..."
echo ""

errors=()
warnings=()

# 1. Verificar keystore
if [ ! -f "@luck1993__goaledge.jks" ]; then
    errors+=("❌ Keystore não encontrado: @luck1993__goaledge.jks")
fi

# 2. Verificar AdMob ID
if grep -q "ca-app-pub-xxxxxxxx~xxxxxxxx" "android/app/src/main/AndroidManifest.xml"; then
    errors+=("❌ AdMob Application ID ainda é placeholder")
fi

# 3. Verificar permissões desnecessárias
if grep -q "READ_EXTERNAL_STORAGE" "android/app/src/main/AndroidManifest.xml"; then
    warnings+=("⚠️  Permissão READ_EXTERNAL_STORAGE ainda presente")
fi
if grep -q "WRITE_EXTERNAL_STORAGE" "android/app/src/main/AndroidManifest.xml"; then
    warnings+=("⚠️  Permissão WRITE_EXTERNAL_STORAGE ainda presente")
fi
if grep -q "SYSTEM_ALERT_WINDOW" "android/app/src/main/AndroidManifest.xml"; then
    warnings+=("⚠️  Permissão SYSTEM_ALERT_WINDOW ainda presente")
fi

# 4. Verificar versão
version=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
echo "📦 Versão do app: $version"

# 5. Verificar .env
if [ ! -f ".env" ]; then
    warnings+=("⚠️  Arquivo .env não encontrado")
fi

# Exibir resultados
echo ""
echo "═══════════════════════════════════════"
echo "RESULTADO DA VALIDAÇÃO"
echo "═══════════════════════════════════════"
echo ""

if [ ${#errors[@]} -eq 0 ] && [ ${#warnings[@]} -eq 0 ]; then
    echo "✅ Configuração válida! Pronto para build."
    exit 0
fi

if [ ${#errors[@]} -gt 0 ]; then
    echo "ERROS CRÍTICOS:"
    for error in "${errors[@]}"; do
        echo "$error"
    done
    echo ""
fi

if [ ${#warnings[@]} -gt 0 ]; then
    echo "AVISOS:"
    for warning in "${warnings[@]}"; do
        echo "$warning"
    done
    echo ""
fi

if [ ${#errors[@]} -gt 0 ]; then
    echo "❌ Corrija os erros antes de gerar o build"
    exit 1
else
    echo "⚠️  Há avisos, mas você pode prosseguir"
    exit 0
fi
```

**Uso:**
```bash
chmod +x validate-config.sh
./validate-config.sh
```

---

## 5. Script Completo de Preparação

### PowerShell (Windows)
```powershell
# Arquivo: prepare-for-production.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$AdMobAppId
)

Write-Host "🚀 Preparando projeto para produção..." -ForegroundColor Cyan
Write-Host ""

# 1. Remover permissões
Write-Host "1️⃣  Removendo permissões desnecessárias..." -ForegroundColor Yellow
.\fix-permissions.ps1

# 2. Atualizar AdMob
Write-Host "2️⃣  Atualizando AdMob Application ID..." -ForegroundColor Yellow
.\update-admob.ps1 -AdMobAppId $AdMobAppId

# 3. Validar configuração
Write-Host "3️⃣  Validando configuração..." -ForegroundColor Yellow
.\validate-config.ps1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Projeto preparado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Criar keystore: .\create-keystore.ps1" -ForegroundColor White
    Write-Host "2. Configurar EAS: eas credentials" -ForegroundColor White
    Write-Host "3. Gerar build: eas build --platform android --profile production" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Há erros que precisam ser corrigidos" -ForegroundColor Red
}
```

**Uso:**
```powershell
.\prepare-for-production.ps1 -AdMobAppId "ca-app-pub-1234567890123456~1234567890"
```

---

## 📋 ORDEM DE EXECUÇÃO

### Windows (PowerShell)
```powershell
# 1. Preparar projeto
.\prepare-for-production.ps1 -AdMobAppId "SEU_ADMOB_ID"

# 2. Criar keystore
.\create-keystore.ps1

# 3. Validar tudo
.\validate-config.ps1

# 4. Gerar build
eas build --platform android --profile production
```

### Mac/Linux (Bash)
```bash
# 1. Tornar scripts executáveis
chmod +x *.sh

# 2. Remover permissões
./fix-permissions.sh

# 3. Atualizar AdMob
./update-admob.sh "SEU_ADMOB_ID"

# 4. Criar keystore
./create-keystore.sh

# 5. Validar tudo
./validate-config.sh

# 6. Gerar build
eas build --platform android --profile production
```

---

## ⚠️ IMPORTANTE

1. **Backup**: Faça backup do projeto antes de executar os scripts
2. **Teste**: Teste o app após cada modificação
3. **Keystore**: NUNCA perca o keystore de produção
4. **Senhas**: Guarde as senhas em local seguro
5. **Git**: Adicione keystore ao .gitignore

---

**Scripts criados por:** Kiro AI  
**Data:** 05/05/2026  
**Versão:** 1.0
