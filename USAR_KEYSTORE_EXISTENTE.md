# 🔑 Usar Keystore Existente

**Data:** 06/05/2026  
**Status:** ✅ Configurado

---

## 📋 Keystore Identificada

**Arquivo:** `@luck1993__goaledge.jks`

**Localização:** Raiz do projeto

---

## ✅ O Que Foi Feito

### 1. Workflow Atualizado

O workflow agora:
1. ✅ Verifica se a keystore existe
2. ✅ Copia para `android/app/`
3. ✅ Usa a keystore para assinar APK e AAB
4. ⚠️ Se não encontrar, cria keystore de debug temporária

### 2. Arquivo de Configuração

**Criado:** `android-signing.gradle`

Este arquivo configura o Gradle para usar a keystore existente.

---

## 🔐 Configurar Senhas (Opcional)

Se a keystore tem senha, configure no GitHub Secrets:

### Passo 1: Adicionar Secrets

1. Acesse: https://github.com/luck1993/goaledge/settings/secrets/actions
2. Clique em "New repository secret"
3. Adicione os seguintes secrets:

| Nome | Valor | Descrição |
|------|-------|-----------|
| `KEYSTORE_PASSWORD` | Sua senha | Senha da keystore |
| `KEY_ALIAS` | goaledge | Alias da chave |
| `KEY_PASSWORD` | Sua senha | Senha da chave |

### Passo 2: Workflow Usa Automaticamente

O workflow já está configurado para usar esses secrets:

```yaml
storePassword System.getenv("KEYSTORE_PASSWORD") ?: "android"
keyAlias System.getenv("KEY_ALIAS") ?: "goaledge"
keyPassword System.getenv("KEY_PASSWORD") ?: "android"
```

**Valores padrão:** Se não configurar secrets, usa `android` como senha.

---

## 🚀 Como Usar

### Opção A: Keystore SEM Senha (Padrão)

Se a keystore não tem senha ou usa senha padrão:

```bash
# Apenas commit e push
git add .
git commit -m "ci: usar keystore existente no build"
git push origin main
```

### Opção B: Keystore COM Senha

Se a keystore tem senha personalizada:

1. **Configure os secrets** (passo acima)
2. **Commit e push:**

```bash
git add .
git commit -m "ci: usar keystore existente no build"
git push origin main
```

---

## 🔍 Verificar Keystore

### Informações da Keystore

```bash
# Ver informações da keystore
keytool -list -v -keystore @luck1993__goaledge.jks

# Você verá:
# - Alias da chave
# - Validade
# - Algoritmo
# - Fingerprint
```

### Testar Localmente

```bash
# Gerar android/ com expo prebuild
npx expo prebuild --platform android --clean

# Copiar keystore
cp @luck1993__goaledge.jks android/app/

# Build APK
cd android
./gradlew assembleRelease

# Build AAB
./gradlew bundleRelease
```

---

## 📊 Comparação

| Aspecto | Keystore de Debug | Keystore Existente |
|---------|-------------------|-------------------|
| **Arquivo** | debug.keystore | @luck1993__goaledge.jks |
| **Senha** | android | Sua senha |
| **Alias** | androiddebugkey | goaledge |
| **Uso** | Apenas testes | Produção |
| **Play Store** | ❌ Não aceita | ✅ Aceita |

---

## ⚠️ IMPORTANTE

### Para Publicação na Play Store

A Play Store requer que você use a **mesma keystore** em todas as atualizações:

1. ✅ **Primeira publicação:** Use `@luck1993__goaledge.jks`
2. ✅ **Atualizações futuras:** Use a **mesma keystore**
3. ❌ **NUNCA perca a keystore!** Faça backup!

### Backup da Keystore

```bash
# Fazer backup
cp @luck1993__goaledge.jks ~/backup/goaledge-keystore-backup.jks

# Ou upload para local seguro
# - Google Drive
# - Dropbox
# - Cofre de senhas
```

---

## 🔧 Troubleshooting

### Erro: "Keystore was tampered with"

**Causa:** Senha incorreta

**Solução:**
1. Verifique a senha da keystore
2. Configure `KEYSTORE_PASSWORD` no GitHub Secrets
3. Ou use senha padrão `android`

### Erro: "Alias not found"

**Causa:** Alias incorreto

**Solução:**
1. Verifique o alias: `keytool -list -keystore @luck1993__goaledge.jks`
2. Configure `KEY_ALIAS` no GitHub Secrets

### Erro: "Keystore not found"

**Causa:** Keystore não está no repositório

**Solução:**
1. Verifique se `@luck1993__goaledge.jks` existe
2. Commit a keystore: `git add @luck1993__goaledge.jks`

---

## 📚 Documentação

- **Workflow:** `.github/workflows/android-build-local.yml`
- **Configuração:** `android-signing.gradle`
- **Keystore:** `@luck1993__goaledge.jks`

---

## 🎯 Próximos Passos

### 1. Verificar Keystore

```bash
keytool -list -v -keystore @luck1993__goaledge.jks
```

### 2. Configurar Secrets (se necessário)

Se a keystore tem senha, configure no GitHub Secrets.

### 3. Commit e Push

```bash
git add .
git commit -m "ci: usar keystore existente no build"
git push origin main
```

### 4. Aguardar Build

Acesse: https://github.com/luck1993/goaledge/actions

---

## ✅ Resultado

Após o build:
- ✅ APK assinado com `@luck1993__goaledge.jks`
- ✅ AAB assinado com `@luck1993__goaledge.jks`
- ✅ Pronto para publicação na Play Store

---

**Status:** ✅ Configurado  
**Keystore:** @luck1993__goaledge.jks  
**Próximo:** Commit e push
