# Script para configurar EXPO_TOKEN no GitHub
# Execute: .\scripts\setup-expo-token.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR EXPO_TOKEN - GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Login no Expo
Write-Host "📋 PASSO 1: Login no Expo" -ForegroundColor Yellow
Write-Host ""
Write-Host "Executando: npx expo login" -ForegroundColor Gray
Write-Host ""

npx expo login

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erro no login. Verifique suas credenciais." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
Write-Host ""

# Passo 2: Criar token
Write-Host "📋 PASSO 2: Criar Token" -ForegroundColor Yellow
Write-Host ""
Write-Host "Executando: npx eas token:create" -ForegroundColor Gray
Write-Host ""

$tokenOutput = npx eas token:create 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erro ao criar token." -ForegroundColor Red
    Write-Host $tokenOutput
    exit 1
}

Write-Host ""
Write-Host "✅ Token criado com sucesso!" -ForegroundColor Green
Write-Host ""

# Extrair token do output
$token = $tokenOutput | Select-String -Pattern "eas_[a-zA-Z0-9_-]+" | ForEach-Object { $_.Matches.Value }

if ($token) {
    Write-Host "🔑 Token gerado:" -ForegroundColor Cyan
    Write-Host $token -ForegroundColor White
    Write-Host ""
    
    # Copiar para clipboard
    $token | Set-Clipboard
    Write-Host "✅ Token copiado para a área de transferência!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⚠️ Não foi possível extrair o token automaticamente." -ForegroundColor Yellow
    Write-Host "Por favor, copie o token manualmente." -ForegroundColor Yellow
    Write-Host ""
}

# Passo 3: Instruções para GitHub
Write-Host "📋 PASSO 3: Adicionar no GitHub Secrets" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Acesse:" -ForegroundColor White
Write-Host "   https://github.com/Lucas-BritoDev/GoalEdge/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Clique em 'New repository secret'" -ForegroundColor White
Write-Host ""
Write-Host "3. Preencha:" -ForegroundColor White
Write-Host "   Name: EXPO_TOKEN" -ForegroundColor Cyan
Write-Host "   Secret: Cole o token (Ctrl+V)" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Clique em 'Add secret'" -ForegroundColor White
Write-Host ""

# Abrir navegador
Write-Host "🌐 Abrindo navegador..." -ForegroundColor Yellow
Start-Process "https://github.com/Lucas-BritoDev/GoalEdge/settings/secrets/actions"

Write-Host ""
Write-Host "⏳ Aguardando você adicionar o secret no GitHub..." -ForegroundColor Yellow
Write-Host ""
Read-Host "Pressione ENTER após adicionar o secret"

# Passo 4: Testar
Write-Host ""
Write-Host "📋 PASSO 4: Testar Configuração" -ForegroundColor Yellow
Write-Host ""
Write-Host "Fazendo commit de teste..." -ForegroundColor Gray

git commit --allow-empty -m "test: Testar EXPO_TOKEN configurado"
git push origin main

Write-Host ""
Write-Host "✅ Commit enviado!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Acompanhe o pipeline em:" -ForegroundColor Cyan
Write-Host "   https://github.com/Lucas-BritoDev/GoalEdge/actions" -ForegroundColor White
Write-Host ""

# Abrir Actions
Write-Host "🌐 Abrindo GitHub Actions..." -ForegroundColor Yellow
Start-Process "https://github.com/Lucas-BritoDev/GoalEdge/actions"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Aguardar conclusão do build (25-35 min)" -ForegroundColor White
Write-Host "2. Baixar AAB e APK do GitHub Artifacts" -ForegroundColor White
Write-Host "3. Testar APK em dispositivo" -ForegroundColor White
Write-Host "4. Publicar na Play Store" -ForegroundColor White
Write-Host ""
