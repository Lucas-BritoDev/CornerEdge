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

## ✅ PASSO 3: TESTAR (Automático)

O workflow já está rodando! Acesse:
https://github.com/Lucas-BritoDev/GoalEdge/actions

**O build será iniciado automaticamente!**

---

## 📦 ACOMPANHAR E BAIXAR BUILD

### Opção 1: Via Expo Dashboard (Recomendado)
1. Acesse: https://expo.dev
2. Faça login
3. Vá para "Builds"
4. Aguarde conclusão (15-25 minutos)
5. Clique em "Download" quando pronto

### Opção 2: Via CLI
```bash
# Ver status dos builds
eas build:list --platform android

# Baixar último build quando pronto
eas build:download --platform android --latest
```

---

## 🎉 PRONTO!

A partir de agora, **a cada push** no repositório:
- ✅ Código será validado automaticamente
- ✅ Build será iniciado no EAS
- ✅ APK e AAB estarão disponíveis no Expo Dashboard

**Tempo total:** 3 minutos de configuração + 20 minutos de build

---

## 🔄 WORKFLOW SIMPLIFICADO

**O que acontece:**
1. ✅ Validação de código (TypeScript, Lint, Testes)
2. ✅ Build iniciado no EAS (não aguarda conclusão)
3. ✅ Você acompanha no Expo Dashboard
4. ✅ Download quando pronto

**Por que não aguarda conclusão?**
- Builds EAS levam 15-25 minutos
- GitHub Actions tem limite de tempo
- Mais eficiente iniciar e acompanhar no Expo

---

**Dúvidas?** Consulte: `DOCS/CONFIGURAR_GITHUB_ACTIONS.md`
