# ⚠️ Workflow Antigo Desabilitado

**Data:** 06/05/2026  
**Ação:** Desabilitar workflow que usa EAS Build

---

## 🔴 Problema

O workflow antigo (`.github/workflows/android-ci.yml`) estava usando **EAS Build**, que:
- ❌ Consome cota do Expo (já esgotada)
- ❌ Requer EXPO_TOKEN
- ❌ Envia builds para o Expo Dashboard
- ❌ Não gera artefatos no GitHub

---

## ✅ Solução

### Workflow Antigo DESABILITADO

**Arquivo:** `.github/workflows/android-ci.yml.disabled`

Este workflow foi **renomeado** para `.disabled` e **não será mais executado**.

### Workflow Novo ATIVO

**Arquivo:** `.github/workflows/android-build-local.yml`

Este workflow:
- ✅ Compila APK e AAB localmente no GitHub Actions
- ✅ Não usa EAS Build (não consome cota Expo)
- ✅ Não precisa de EXPO_TOKEN
- ✅ Gera artefatos no GitHub para download direto
- ✅ 2000 minutos/mês grátis no GitHub

---

## 📋 Comparação

| Aspecto | Workflow Antigo (DESABILITADO) | Workflow Novo (ATIVO) |
|---------|--------------------------------|------------------------|
| **Nome** | Android CI/CD | Android Build Local |
| **Arquivo** | android-ci.yml.disabled | android-build-local.yml |
| **Build** | EAS Build (Expo) | Gradle (GitHub Actions) |
| **Token** | EXPO_TOKEN necessário | Não necessário |
| **Cota** | Consome cota Expo | Usa minutos GitHub |
| **Download** | Expo Dashboard | GitHub Artifacts |
| **Status** | ❌ DESABILITADO | ✅ ATIVO |

---

## 🚀 Próximos Passos

### 1. Commit e Push

```bash
git add .
git commit -m "ci: desabilitar workflow EAS e usar build local

- Renomear android-ci.yml para android-ci.yml.disabled
- Usar apenas android-build-local.yml
- Build 100% no GitHub Actions (sem EAS)
- Não consome cota do Expo
- Download direto no GitHub Artifacts"
git push origin main
```

### 2. Verificar Workflow Ativo

Após o push, apenas o workflow **"Android Build Local"** será executado:

1. Acesse: https://github.com/luck1993/goaledge/actions
2. Você verá apenas: **"Android Build Local"**
3. Não verá mais: ~~"Android CI/CD"~~

### 3. Aguardar Build (35-40 min)

O workflow **"Android Build Local"** irá:
1. Executar testes (10 min)
2. Compilar APK localmente (25 min)
3. Compilar AAB localmente (25 min)
4. Upload para GitHub Artifacts

### 4. Baixar Artefatos

1. GitHub → Actions → Android Build Local
2. Clique na execução
3. Role até "Artifacts"
4. Baixe:
   - **goaledge-apk**
   - **goaledge-aab**

---

## 🔍 Como Verificar

### Workflows Ativos

```bash
# Listar workflows
ls -la .github/workflows/

# Resultado esperado:
# android-build-local.yml     ← ATIVO ✅
# android-ci.yml.disabled     ← DESABILITADO ❌
```

### GitHub Actions

No GitHub, você verá apenas:
- ✅ **Android Build Local** (ativo)
- ~~Android CI/CD~~ (não aparece mais)

---

## 📚 Documentação

- **Workflow ativo:** `.github/workflows/android-build-local.yml`
- **Guia de uso:** `BUILD_LOCAL_GUIA_RAPIDO.md`
- **Documentação técnica:** `DOCS/BUILD_LOCAL_GITHUB_ACTIONS.md`
- **Comandos prontos:** `EXECUTAR_AGORA.md`

---

## 💡 Benefícios

### Antes (EAS Build)
- ❌ Cota esgotada no Expo
- ❌ Não consegue mais buildar
- ❌ Precisa de EXPO_TOKEN
- ❌ Download no Expo Dashboard

### Agora (Build Local)
- ✅ Sem dependência do Expo
- ✅ 2000 min/mês grátis no GitHub
- ✅ Não precisa de token
- ✅ Download direto no GitHub

---

## 🎯 Resultado

Agora você tem:
- ✅ Build 100% no GitHub Actions
- ✅ Sem consumir cota do Expo
- ✅ APK e AAB gerados localmente
- ✅ Download direto na aba Artifacts

**Execute o commit e push agora!**

---

**Status:** ✅ Workflow antigo desabilitado  
**Workflow ativo:** android-build-local.yml  
**Próximo:** Commit, push e aguardar build
