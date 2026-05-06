# 🚨 CONFIGURAR EXPO_TOKEN - URGENTE

**Status:** ⚠️ OBRIGATÓRIO AGORA  
**Tempo:** 5 minutos  
**Sem isso:** Pipeline não funciona

---

## ❌ ERRO ATUAL

```
Error: Process completed with exit code 1
Run eas build:view $BUILD_ID --json
Error: Unexpected error: Could not authenticate
```

**Causa:** `EXPO_TOKEN` não está configurado no GitHub Secrets

---

## ✅ SOLUÇÃO (5 MINUTOS)

### PASSO 1: Criar Token (2 minutos)

**Abra o terminal e execute:**

```bash
# 1. Login no Expo
npx expo login
```

**Digite:**
- Email: (seu email do Expo)
- Senha: (sua senha do Expo)

```bash
# 2. Criar token
npx eas token:create
```

**Copie o token que aparecer!**

Formato: `eas_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

⚠️ **IMPORTANTE:** Copie agora! O token só aparece uma vez.

---

### PASSO 2: Adicionar no GitHub (2 minutos)

**1. Acesse:**
```
https://github.com/Lucas-BritoDev/GoalEdge/settings/secrets/actions
```

**2. Clique em "New repository secret"**

**3. Preencha:**
- **Name:** `EXPO_TOKEN` (exatamente assim, maiúsculas)
- **Secret:** Cole o token copiado
- Clique em "Add secret"

**4. Verifique:**
Você deve ver:
```
EXPO_TOKEN
Updated X seconds ago
```

---

### PASSO 3: Testar (1 minuto)

**Faça um commit vazio para testar:**

```bash
git commit --allow-empty -m "test: Testar EXPO_TOKEN configurado"
git push origin main
```

**Acompanhe:**
```
https://github.com/Lucas-BritoDev/GoalEdge/actions
```

---

## 🔍 VERIFICAR SE FUNCIONOU

### Logs do GitHub Actions

**Antes (❌ Erro):**
```
Run eas build:view $BUILD_ID --json
Error: Unexpected error: Could not authenticate
```

**Depois (✅ Sucesso):**
```
Run eas build:view $BUILD_ID --json
√ Found a matching build for the project @luck1993/goaledge
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Invalid credentials"
**Causa:** Email ou senha incorretos  
**Solução:** Verificar credenciais do Expo

### Erro: "Token already exists"
**Causa:** Já existe um token  
**Solução:** Usar o token existente ou criar novo

### Erro: "expo: command not found"
**Causa:** Expo CLI não instalado  
**Solução:**
```bash
npm install -g expo-cli
```

### Token não funciona
**Causa:** Token inválido ou expirado  
**Solução:** Criar novo token:
```bash
npx eas token:create --force
```

---

## 📋 CHECKLIST

Antes de continuar:

- [ ] Executei `npx expo login`
- [ ] Executei `npx eas token:create`
- [ ] Copiei o token (formato: `eas_XXX...`)
- [ ] Acessei GitHub Secrets
- [ ] Criei secret com nome `EXPO_TOKEN`
- [ ] Colei o token no valor
- [ ] Cliquei em "Add secret"
- [ ] Fiz commit de teste
- [ ] Pipeline está executando

---

## 🎯 RESULTADO ESPERADO

### Após configurar o token:

**1. Login EAS funcionará:**
```
🔐 Setup EAS
✅ Logged in as: luck1993
```

**2. Build será iniciado:**
```
🚀 Iniciar Build de Produção
✅ Build iniciado com sucesso!
🆔 Build ID: XXXXXXXX
```

**3. Pipeline continuará:**
```
⏳ Aguardar Conclusão do Build
[5 min] Status: IN_PROGRESS
[10 min] Status: IN_PROGRESS
...
[25 min] Status: FINISHED
✅ Build concluído com sucesso!
```

---

## 🚀 PRÓXIMOS PASSOS

**Após configurar o token:**

1. ✅ Pipeline executará automaticamente
2. ⏳ Aguardar 25-35 minutos
3. 📥 Baixar AAB e APK do GitHub
4. 🧪 Testar APK em dispositivo
5. 🚀 Publicar na Play Store

---

## 📞 LINKS ÚTEIS

- **GitHub Secrets:** https://github.com/Lucas-BritoDev/GoalEdge/settings/secrets/actions
- **GitHub Actions:** https://github.com/Lucas-BritoDev/GoalEdge/actions
- **Expo Dashboard:** https://expo.dev
- **Expo Docs:** https://docs.expo.dev/accounts/programmatic-access/

---

## ⚠️ IMPORTANTE

**SEM O EXPO_TOKEN:**
- ❌ Pipeline não funciona
- ❌ Build não inicia
- ❌ Não gera AAB/APK
- ❌ Não pode publicar

**COM O EXPO_TOKEN:**
- ✅ Pipeline funciona
- ✅ Build inicia automaticamente
- ✅ Gera AAB e APK
- ✅ Pode publicar na Play Store

---

**Status:** ⚠️ AÇÃO NECESSÁRIA  
**Tempo:** 5 minutos  
**Prioridade:** 🔴 URGENTE

**CONFIGURE AGORA!**
