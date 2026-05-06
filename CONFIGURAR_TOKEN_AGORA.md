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

**Aguarde 15-25 minutos** e o APK + AAB estarão prontos para download!

---

## 📦 BAIXAR APK/AAB

Após o build concluir:
1. Acesse: https://github.com/Lucas-BritoDev/GoalEdge/actions
2. Clique no workflow concluído (✅ verde)
3. Role até "Artifacts"
4. Baixe: `goaledge-android-builds`

---

## 🎉 PRONTO!

A partir de agora, **a cada push** no repositório:
- ✅ Código será validado automaticamente
- ✅ APK e AAB serão gerados automaticamente
- ✅ Artefatos ficarão disponíveis para download por 30 dias

**Tempo total:** 3 minutos de configuração + 20 minutos de build

---

**Dúvidas?** Consulte: `DOCS/CONFIGURAR_GITHUB_ACTIONS.md`
