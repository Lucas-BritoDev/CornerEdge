# 🚀 GERAR NOVO APK - GUIA RÁPIDO

**Data:** 06/05/2026  
**Correções Aplicadas:** ✅ Variáveis hardcoded + Plugin AdMob

---

## ✅ O QUE FOI CORRIGIDO

### 1. Variáveis de Ambiente Vazias
- ✅ Hardcode no `app.config.js`
- ✅ Supabase URL e Anon Key configurados
- ✅ API-Football Key configurada

### 2. Crash ao Abrir (Plugin AdMob)
- ✅ Plugin do AdMob adicionado
- ✅ Application IDs de produção configurados
- ✅ AndroidManifest.xml será gerado corretamente

---

## 🚀 OPÇÕES PARA GERAR APK

### Opção 1: GitHub Actions (RECOMENDADO) ⭐

**Vantagens:**
- ✅ Automático (só fazer push)
- ✅ Build paralelo (APK + AAB)
- ✅ Download direto no GitHub
- ✅ Não precisa de EXPO_TOKEN

**Passos:**

```bash
# 1. Commitar as correções
git add app.config.js
git commit -m "fix: adicionar plugin AdMob e hardcode de variáveis"

# 2. Push para GitHub
git push origin main

# 3. Aguardar build (35-40 min)
# Ir em: https://github.com/seu-usuario/goaledge/actions

# 4. Baixar APK dos artifacts
# Clicar no workflow concluído > Artifacts > android-apk
```

---

### Opção 2: Build Local (RÁPIDO)

**Vantagens:**
- ✅ Mais rápido (15-20 min)
- ✅ Não depende do GitHub
- ✅ Controle total

**Requisitos:**
- ✅ Node.js instalado
- ✅ Android Studio instalado
- ✅ Java JDK 17 instalado

**Passos:**

```bash
# 1. Limpar build anterior
npx expo prebuild --clean

# 2. Ir para pasta android
cd android

# 3. Limpar cache do Gradle
./gradlew clean

# 4. Gerar APK
./gradlew assembleRelease

# 5. APK estará em:
# android/app/build/outputs/apk/release/app-release.apk
```

**Se der erro de permissão no Windows:**
```bash
# Dar permissão ao gradlew
chmod +x gradlew

# Ou usar o wrapper do Windows
gradlew.bat assembleRelease
```

---

### Opção 3: EAS Build (PROFISSIONAL)

**Vantagens:**
- ✅ Build na nuvem
- ✅ Suporte oficial Expo
- ✅ Fácil de usar

**Desvantagens:**
- ⚠️ Precisa de conta Expo
- ⚠️ Limite de builds grátis

**Passos:**

```bash
# 1. Instalar EAS CLI (se não tiver)
npm install -g eas-cli

# 2. Login no Expo
npx eas login

# 3. Build
npx eas build --platform android --profile production

# 4. Aguardar build (20-30 min)
# 5. Baixar APK do link fornecido
```

---

## 📱 INSTALAR E TESTAR

### Instalar via ADB (USB)

```bash
# 1. Conectar celular via USB
# 2. Habilitar depuração USB no celular
# 3. Instalar APK
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Ou se baixou do GitHub:
adb install -r ~/Downloads/app-release.apk
```

### Instalar Manualmente

```
1. Transferir APK para o celular (USB, email, etc)
2. Abrir APK no celular
3. Permitir instalação de fontes desconhecidas
4. Instalar
```

---

## ✅ CHECKLIST DE TESTE

### Teste 1: App Abre
- [ ] App abre normalmente (não crasha)
- [ ] Mostra tela inicial
- [ ] Não fica em tela branca

### Teste 2: Dados Carregam
- [ ] Consegue ver apostas do dia
- [ ] Logos dos times aparecem
- [ ] Horários das partidas aparecem
- [ ] Confiança (%) aparece

### Teste 3: Navegação
- [ ] Consegue navegar entre abas
- [ ] Aba "Amanhã" funciona
- [ ] Aba "Resultados" funciona
- [ ] Aba "Premium" funciona
- [ ] Aba "Perfil" funciona

### Teste 4: Premium
- [ ] Consegue ver múltiplas premium (bloqueadas)
- [ ] Botão "Assinar Premium" funciona
- [ ] Anúncio recompensado funciona (se habilitado)

### Teste 5: Anúncios (se habilitados)
- [ ] Anúncios aparecem
- [ ] Não causam crash
- [ ] Recompensa funciona

---

## 🐛 SE AINDA CRASHAR

### Ver Logs de Crash

```bash
# 1. Conectar celular via USB
# 2. Habilitar depuração USB
# 3. Executar:
adb logcat | grep -E "ReactNativeJS|AndroidRuntime|GoalEdge|MobileAds"

# Ou no Windows PowerShell:
adb logcat | Select-String -Pattern "ReactNativeJS|AndroidRuntime|GoalEdge|MobileAds"

# 4. Abrir o app no celular
# 5. Ver os erros que aparecem
# 6. Me enviar os logs
```

### Salvar Logs em Arquivo

```bash
# Linux/Mac
adb logcat | grep -E "ReactNativeJS|AndroidRuntime|GoalEdge" > crash-log.txt

# Windows PowerShell
adb logcat | Select-String -Pattern "ReactNativeJS|AndroidRuntime|GoalEdge" > crash-log.txt
```

---

## 🎯 EXPECTATIVA

### Após Instalar o Novo APK

1. ✅ App deve **abrir normalmente** (não crashar)
2. ✅ Deve **mostrar tela inicial** com apostas
3. ✅ Deve **carregar dados** do Supabase
4. ✅ Logos dos times devem **aparecer**
5. ✅ Navegação deve **funcionar**
6. ✅ Anúncios devem **funcionar** (se habilitados)

### Se Tudo Funcionar

🎉 **Parabéns!** O app está pronto para publicação!

**Próximos passos:**
1. ✅ Criar keystore de produção
2. ✅ Gerar AAB assinado
3. ✅ Preparar assets (screenshots, feature graphic)
4. ✅ Criar política de privacidade
5. ✅ Enviar para Play Store

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- `CORRECAO_CRASH_APK.md` - Detalhes da correção
- `DEBUG_APK_ERRO.md` - Guia de debug completo
- `DOCS/DIAGNOSTICO_APK_NAO_FUNCIONA.md` - Análise técnica
- `PUBLICACAO_PLAY_STORE.md` - Guia de publicação
- `STATUS_PROJETO.md` - Status geral do projeto

---

## 🚀 COMANDO RÁPIDO (COPIAR E COLAR)

### Build Local Completo

```bash
# Limpar, buildar e instalar (tudo de uma vez)
npx expo prebuild --clean && cd android && ./gradlew clean && ./gradlew assembleRelease && cd .. && adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Ver Logs de Crash

```bash
# Linux/Mac
adb logcat | grep -E "ReactNativeJS|AndroidRuntime|GoalEdge"

# Windows PowerShell
adb logcat | Select-String -Pattern "ReactNativeJS|AndroidRuntime|GoalEdge"
```

---

**Criado por:** Kiro AI  
**Data:** 06/05/2026  
**Versão:** 1.0

---

## 💡 DICA

Se você não tem Android Studio instalado, use a **Opção 1 (GitHub Actions)**. É mais fácil e não precisa instalar nada!

```bash
# Só fazer:
git add app.config.js
git commit -m "fix: corrigir crash do APK"
git push origin main

# Aguardar 35-40 min
# Baixar APK do GitHub Actions
```

✅ **Simples assim!**
