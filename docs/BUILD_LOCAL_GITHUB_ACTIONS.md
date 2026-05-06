# 🏗️ Build Local no GitHub Actions

**Data:** 06/05/2026  
**Versão:** 6.0.0  
**Status:** ✅ Implementado

---

## 🎯 Objetivo

Compilar APK e AAB **diretamente no GitHub Actions**, sem usar EAS Build, e disponibilizar os arquivos na aba **Artifacts** para download direto.

---

## ✨ Vantagens

### ✅ Sem Dependências Externas
- ❌ Não precisa de EXPO_TOKEN
- ❌ Não precisa de conta EAS
- ❌ Não precisa acessar Expo Dashboard
- ✅ Tudo no GitHub!

### ✅ Download Direto
- 📥 Baixe APK e AAB direto da aba Actions
- 🔒 Artefatos privados (só você tem acesso)
- ⏱️ Retenção de 30 dias

### ✅ Build Paralelo
- 🚀 APK e AAB compilam ao mesmo tempo
- ⚡ Mais rápido que builds sequenciais

### ✅ Gratuito
- 💰 GitHub Actions tem 2000 minutos/mês grátis
- 📊 Cada build usa ~20-30 minutos
- 🎯 ~60-100 builds/mês grátis

---

## 🔄 Diferenças vs EAS Build

| Aspecto | EAS Build | Build Local (GitHub Actions) |
|---------|-----------|------------------------------|
| **Onde compila** | Servidores Expo | GitHub Actions |
| **Token necessário** | ✅ Sim (EXPO_TOKEN) | ❌ Não |
| **Download** | Expo Dashboard | GitHub Artifacts |
| **Tempo** | 15-25 min | 20-30 min |
| **Custo** | Limitado no free tier | 2000 min/mês grátis |
| **Configuração** | eas.json | Workflow YAML |
| **Keystore** | Gerenciado pelo EAS | Você gerencia |

---

## 📋 Como Funciona

### Pipeline Completo

```
1. 🧪 Testes e Validação (5-10 min)
   ├── TypeScript Check
   ├── ESLint
   └── Jest Tests

2. 🏗️ Build APK (20-30 min)
   ├── Expo Prebuild
   ├── Criar Keystore
   ├── Gradle assembleRelease
   └── Upload Artifact

3. 🏗️ Build AAB (20-30 min)
   ├── Expo Prebuild
   ├── Criar Keystore
   ├── Gradle bundleRelease
   └── Upload Artifact

4. 📢 Notificação
   └── Resumo com links
```

### Jobs Paralelos

APK e AAB compilam **ao mesmo tempo**, economizando tempo:

```
Testes (10 min)
    ↓
    ├─→ Build APK (25 min) ─┐
    └─→ Build AAB (25 min) ─┤
                             ↓
                        Notificação
```

**Tempo total:** ~35 minutos (vs ~50 minutos sequencial)

---

## 📥 Como Baixar os Artefatos

### Passo a Passo

1. **Acesse o repositório no GitHub**
   ```
   https://github.com/luck1993/goaledge
   ```

2. **Vá para a aba "Actions"**
   - Clique em "Actions" no menu superior

3. **Selecione o workflow**
   - Clique em "Android Build Local"
   - Escolha a execução mais recente (verde = sucesso)

4. **Role até "Artifacts"**
   - No final da página, seção "Artifacts"

5. **Baixe os arquivos**
   - `goaledge-apk` (para instalação direta)
   - `goaledge-aab` (para Play Store)

### Screenshot Exemplo

```
┌─────────────────────────────────────────┐
│ Android Build Local                     │
│ ✅ #42 - main - 35 minutes ago         │
├─────────────────────────────────────────┤
│ Jobs:                                   │
│ ✅ Testes e Validação                   │
│ ✅ Build APK                            │
│ ✅ Build AAB                            │
│ ✅ Notificação                          │
├─────────────────────────────────────────┤
│ Artifacts (2)                           │
│ 📦 goaledge-apk (45.2 MB)              │
│ 📦 goaledge-aab (38.7 MB)              │
└─────────────────────────────────────────┘
```

---

## 🔑 Keystore de Debug

### O que é?

O workflow cria automaticamente um **keystore de debug** para assinar os builds.

### Características

- **Tipo:** Debug (não é para produção!)
- **Validade:** 10000 dias (~27 anos)
- **Senha:** `android` (padrão Android)
- **Alias:** `androiddebugkey`

### ⚠️ IMPORTANTE: Produção

Para publicar na Play Store, você precisa de um **keystore de produção**:

```bash
# Criar keystore de produção
keytool -genkeypair -v -storetype PKCS12 \
  -keystore goaledge-release.keystore \
  -alias goaledge \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass SUA_SENHA_FORTE \
  -keypass SUA_SENHA_FORTE \
  -dname "CN=GoalEdge,O=Sua Empresa,C=BR"
```

Depois, configure no workflow usando GitHub Secrets.

---

## 🔧 Configuração Avançada

### Usar Keystore de Produção

1. **Criar keystore** (comando acima)

2. **Converter para Base64**
   ```bash
   base64 goaledge-release.keystore > keystore.base64
   ```

3. **Adicionar no GitHub Secrets**
   - `KEYSTORE_BASE64` - Conteúdo do arquivo base64
   - `KEYSTORE_PASSWORD` - Senha do keystore
   - `KEY_ALIAS` - Alias da chave
   - `KEY_PASSWORD` - Senha da chave

4. **Atualizar workflow**
   ```yaml
   - name: 🔑 Decodificar Keystore
     run: |
       echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/release.keystore
   
   - name: 🏗️ Build com Keystore de Produção
     env:
       KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
       KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
       KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
     run: |
       cd android
       ./gradlew assembleRelease \
         -Pandroid.injected.signing.store.file=app/release.keystore \
         -Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD \
         -Pandroid.injected.signing.key.alias=$KEY_ALIAS \
         -Pandroid.injected.signing.key.password=$KEY_PASSWORD
   ```

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

1. Acesse a execução do workflow
2. Clique em um job (ex: "Build APK")
3. Veja os logs em tempo real

### Verificar Erros

Se o build falhar:

1. **Logs detalhados:** Clique no job que falhou
2. **Stacktrace:** Procure por `ERROR` ou `FAILURE`
3. **Gradle logs:** Seção "Build APK" ou "Build AAB"

### Estatísticas

GitHub Actions mostra:
- ⏱️ Tempo de execução
- 💾 Uso de armazenamento
- 📊 Taxa de sucesso
- 📈 Histórico de builds

---

## 🚀 Uso

### Trigger Automático

O workflow executa automaticamente quando você faz push para `main`:

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

### Trigger Manual

Você também pode executar manualmente:

1. Vá para Actions → Android Build Local
2. Clique em "Run workflow"
3. Selecione a branch
4. Clique em "Run workflow"

---

## 🐛 Troubleshooting

### Build Falha no Gradle

**Erro:** `Gradle build failed`

**Solução:**
1. Verifique logs do Gradle
2. Procure por erros de dependências
3. Verifique compatibilidade de versões

### Prebuild Falha

**Erro:** `Expo prebuild failed`

**Solução:**
1. Verifique `app.json` e `package.json`
2. Remova plugins problemáticos
3. Execute localmente: `npx expo prebuild --clean`

### Keystore Inválido

**Erro:** `Keystore was tampered with, or password was incorrect`

**Solução:**
1. Verifique senha do keystore
2. Recrie o keystore
3. Verifique GitHub Secrets

### Timeout

**Erro:** `The job running on runner ... has exceeded the maximum execution time of 45 minutes`

**Solução:**
1. Aumente timeout no workflow: `timeout-minutes: 60`
2. Otimize dependências
3. Use cache do Gradle

---

## 📚 Arquivos Relacionados

- **Workflow:** `.github/workflows/android-build-local.yml`
- **Configuração:** `app.json`, `package.json`
- **Gradle:** `android/build.gradle`, `android/app/build.gradle`

---

## 🎯 Próximos Passos

### 1. Testar Build Local

```bash
# Commit e push
git add .
git commit -m "ci: adicionar build local no GitHub Actions"
git push origin main
```

### 2. Aguardar Conclusão

- ⏱️ Tempo estimado: 35-40 minutos
- 📊 Acompanhe em: Actions → Android Build Local

### 3. Baixar Artefatos

- 📥 APK: Para testar em dispositivo
- 📥 AAB: Para publicar na Play Store

### 4. Testar APK

```bash
# Instalar no dispositivo via ADB
adb install goaledge.apk
```

### 5. Publicar AAB

- Siga o guia: `PUBLICACAO_PLAY_STORE.md`

---

## 💡 Dicas

### Economizar Minutos

- ✅ Use cache do Gradle (já configurado)
- ✅ Use cache do npm (já configurado)
- ✅ Builds paralelos (já configurado)
- ⚠️ Evite rebuilds desnecessários

### Otimizar Builds

```yaml
# Adicionar no workflow
- name: Cache Gradle
  uses: actions/cache@v4
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
```

### Debug Local

Antes de fazer push, teste localmente:

```bash
# Prebuild
npx expo prebuild --platform android --clean

# Build APK
cd android
./gradlew assembleRelease

# Build AAB
./gradlew bundleRelease
```

---

## 📞 Suporte

### Documentação Oficial

- **GitHub Actions:** https://docs.github.com/actions
- **Expo Prebuild:** https://docs.expo.dev/workflow/prebuild/
- **Gradle:** https://docs.gradle.org/

### Problemas Comuns

- **Erro de memória:** Aumente heap do Gradle
- **Timeout:** Aumente timeout do job
- **Dependências:** Verifique compatibilidade

---

**Status:** ✅ Pronto para usar  
**Tempo de build:** ~35 minutos  
**Custo:** Gratuito (2000 min/mês)  
**Download:** GitHub Artifacts (30 dias)
