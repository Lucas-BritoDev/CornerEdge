# ⚡ CONFIGURAR EXPO TOKEN - GUIA RÁPIDO

**ATENÇÃO:** Execute estes comandos AGORA para habilitar builds automáticos!

---

## 🚀 PASSO 1: OBTER TOKEN (2 minutos)

### Abra o terminal e execute:

```bash
# 1. Login no Expo
npx expo login

# 2. Criar token
npx eas token:create
```

**Copie o token que aparecer!** Formato: `eas_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

---

## 🔐 PASSO 2: CONFIGURAR NO GITHUB (1 minuto)

### Acesse:
https://github.com/Lucas-BritoDev/GoalEdge/settings/secrets/actions

### Clique em "New repository secret"

**Preencha:**
- Name: `EXPO_TOKEN`
- Secret: Cole o token copiado
- Clique em "Add secret"

---

## ✅ PASSO 3: FAZER COMMIT E PUSH

```bash
git add .
git commit -m "ci: Configurar pipeline CI/CD completo"
git push origin main
```

**O pipeline será executado automaticamente!**

Acesse: https://github.com/Lucas-BritoDev/GoalEdge/actions

---

## 📦 ACOMPANHAR E BAIXAR BUILDS

### Via GitHub Actions (Recomendado)
1. Acesse: https://github.com/Lucas-BritoDev/GoalEdge/actions
2. Clique na execução do workflow
3. Aguarde conclusão (25-35 minutos)
4. Role até "Artifacts"
5. Baixe:
   - **goaledge-aab** → Para Play Store
   - **goaledge-apk** → Para instalação direta

### Via Expo Dashboard (Alternativo)
1. Acesse: https://expo.dev
2. Faça login
3. Vá para "Builds"
4. Veja os 2 builds em andamento (AAB e APK)
5. Aguarde conclusão
6. Clique em "Download" quando prontos

---

## 🎉 PRONTO!

A partir de agora, **a cada push para main**:
- ✅ Código será validado (TypeScript, ESLint, Jest)
- ✅ AAB será gerado (para Play Store)
- ✅ APK será gerado (para instalação direta)
- ✅ Artefatos estarão disponíveis no GitHub (30 dias)

**Tempo total:** 3 minutos de configuração + 30 minutos de build

---

## 🔄 PIPELINE COMPLETO

**O que acontece:**
1. ✅ **Validação** - TypeScript, Lint, Testes (3 min)
2. ✅ **Build AAB** - Aguarda conclusão (25 min)
3. ✅ **Build APK** - Aguarda conclusão (25 min)
4. ✅ **Download** - Artefatos baixados automaticamente
5. ✅ **Upload** - Disponíveis no GitHub Actions

**Diferença da versão anterior:**
- ✅ Agora aguarda conclusão dos builds
- ✅ Faz download automático de AAB e APK
- ✅ Upload para GitHub Artifacts
- ✅ Builds executam em paralelo (AAB + APK)

---

## 📊 O QUE VOCÊ RECEBE

### 1. AAB (Android App Bundle)
- **Uso:** Upload para Google Play Store
- **Tamanho:** ~30-50 MB
- **Formato:** `.aab`

### 2. APK (Android Package)
- **Uso:** Instalação direta em dispositivos
- **Tamanho:** ~40-60 MB
- **Formato:** `.apk`

### 3. Coverage Report
- **Uso:** Análise de cobertura de testes
- **Formato:** HTML + JSON

---

**Dúvidas?** Consulte: `DOCS/PIPELINE_CI_CD_COMPLETO.md`
