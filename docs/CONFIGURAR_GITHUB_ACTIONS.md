# 🔧 CONFIGURAR GITHUB ACTIONS PARA BUILD AUTOMÁTICO

**Projeto:** GoalEdge  
**Data:** 05/05/2026

---

## 🎯 OBJETIVO

Configurar o GitHub Actions para gerar automaticamente APK e AAB a cada push no repositório.

---

## 📋 PRÉ-REQUISITOS

1. ✅ Conta no Expo
2. ✅ Projeto configurado com EAS
3. ✅ Repositório no GitHub
4. ✅ Keystore de produção criado

---

## 🔐 PASSO 1: OBTER EXPO TOKEN

### 1.1 Login no Expo
```bash
npx expo login
```

**Informações necessárias:**
- Email da conta Expo
- Senha

### 1.2 Verificar Login
```bash
npx eas whoami
```

**Resultado esperado:**
```
Logged in as: seu-usuario
```

### 1.3 Criar Access Token

**Opção A: Via CLI**
```bash
npx eas token:create
```

**Opção B: Via Website**
1. Acessar: https://expo.dev/accounts/[seu-usuario]/settings/access-tokens
2. Clicar em "Create Token"
3. Nome: `GitHub Actions - GoalEdge`
4. Copiar o token (só aparece uma vez!)

**Formato do token:**
```
eas_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

⚠️ **IMPORTANTE:** Guarde o token em local seguro! Ele só é exibido uma vez.

---

## 🔧 PASSO 2: CONFIGURAR SECRET NO GITHUB

### 2.1 Acessar Configurações do Repositório
1. Abrir: https://github.com/Lucas-BritoDev/GoalEdge
2. Clicar em **Settings** (⚙️)
3. No menu lateral: **Secrets and variables** > **Actions**

### 2.2 Adicionar Secret
1. Clicar em **New repository secret**
2. Preencher:
   - **Name:** `EXPO_TOKEN`
   - **Secret:** Colar o token do Expo
3. Clicar em **Add secret**

### 2.3 Verificar Secret Criado
Você deve ver:
```
EXPO_TOKEN
Updated X seconds ago
```

---

## 🚀 PASSO 3: CONFIGURAR CREDENCIAIS EAS

### 3.1 Configurar Keystore no EAS
```bash
eas credentials
```

**Selecionar:**
1. Android
2. Production
3. Set up a new keystore
4. Upload do arquivo `@luck1993__goaledge.jks`
5. Informar passwords

### 3.2 Verificar Credenciais
```bash
eas credentials --platform android
```

**Resultado esperado:**
```
✔ Android credentials configured
  Keystore: ✓
  Key Alias: goaledge
```

---

## ✅ PASSO 4: TESTAR WORKFLOW

### 4.1 Fazer um Commit
```bash
git add .
git commit -m "test: Testar GitHub Actions"
git push origin main
```

### 4.2 Acompanhar Execução
1. Acessar: https://github.com/Lucas-BritoDev/GoalEdge/actions
2. Clicar no workflow em execução
3. Acompanhar logs em tempo real

### 4.3 Resultado Esperado

**Jobs executados:**
1. ✅ Detectar Tipo de Projeto
2. ✅ Configurar Ambiente
3. ✅ Validar Código
4. ✅ Build Android
5. ✅ Notificar

**Tempo estimado:** 15-25 minutos

---

## 📦 PASSO 5: BAIXAR ARTEFATOS

### 5.1 Acessar Artefatos
1. Ir para: https://github.com/Lucas-BritoDev/GoalEdge/actions
2. Clicar no workflow concluído
3. Rolar até "Artifacts"

### 5.2 Download
Você verá:
```
goaledge-android-builds
  - application-XXXXXXXX.apk
  - application-XXXXXXXX.aab
```

**Clicar para baixar!**

---

## 🔄 WORKFLOW AUTOMÁTICO

### Quando o Build é Executado?

**Automaticamente:**
- ✅ Push para branch `main`
- ✅ Push para branch `develop`
- ✅ Pull Request para `main` ou `develop`
- ✅ Criação de Release

**Manualmente:**
1. Acessar: https://github.com/Lucas-BritoDev/GoalEdge/actions
2. Selecionar workflow "Android CI/CD"
3. Clicar em "Run workflow"
4. Escolher branch e tipo de build
5. Clicar em "Run workflow"

---

## 📊 MONITORAMENTO

### Verificar Status do Build

**Via GitHub:**
- Badge no README (opcional)
- Aba Actions
- Notificações por email

**Via CLI:**
```bash
# Listar builds recentes
eas build:list --platform android --limit 5

# Ver detalhes de um build
eas build:view [BUILD_ID]

# Download de build específico
eas build:download --id [BUILD_ID]
```

---

## 🐛 TROUBLESHOOTING

### Erro: "EXPO_TOKEN não configurado"

**Solução:**
1. Verificar se o secret foi criado corretamente
2. Nome deve ser exatamente `EXPO_TOKEN`
3. Recriar o token se necessário

### Erro: "Keystore not found"

**Solução:**
```bash
eas credentials
# Configurar keystore novamente
```

### Erro: "Build timeout"

**Solução:**
- Builds EAS podem levar 20-30 minutos
- Verificar se há fila de builds
- Tentar novamente mais tarde

### Erro: "Invalid credentials"

**Solução:**
```bash
# Fazer logout e login novamente
npx expo logout
npx expo login

# Recriar token
npx eas token:create
```

---

## 💡 DICAS

### 1. Cache de Dependências
O workflow já usa cache para:
- ✅ node_modules
- ✅ npm cache
- ✅ Gradle cache

### 2. Builds Paralelos
Você pode ter múltiplos builds rodando simultaneamente.

### 3. Notificações
Configure notificações no GitHub:
- Settings > Notifications
- Ativar "Actions"

### 4. Logs Detalhados
Para ver logs completos:
1. Clicar no job
2. Expandir cada step
3. Ver output completo

---

## 📈 OTIMIZAÇÕES

### Reduzir Tempo de Build

**1. Usar cache agressivo:**
```yaml
cache: 'npm'
```

**2. Builds incrementais:**
```bash
eas build --platform android --profile production --clear-cache=false
```

**3. Paralelizar jobs:**
- Lint e testes em paralelo
- Build APK e AAB em paralelo

---

## 🔒 SEGURANÇA

### Boas Práticas

1. ✅ **NUNCA** commitar tokens no código
2. ✅ Usar GitHub Secrets para credenciais
3. ✅ Rotacionar tokens periodicamente
4. ✅ Limitar permissões dos tokens
5. ✅ Revisar logs de builds

### Secrets Necessários

| Secret | Descrição | Obrigatório |
|--------|-----------|-------------|
| `EXPO_TOKEN` | Token de acesso Expo | ✅ SIM |
| `ANDROID_SIGNING_KEY` | Keystore (base64) | ❌ Não (EAS gerencia) |
| `KEYSTORE_PASSWORD` | Senha do keystore | ❌ Não (EAS gerencia) |
| `KEY_ALIAS` | Alias da key | ❌ Não (EAS gerencia) |
| `KEY_PASSWORD` | Senha da key | ❌ Não (EAS gerencia) |

---

## 📚 REFERÊNCIAS

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo Access Tokens](https://docs.expo.dev/accounts/programmatic-access/)

---

## ✅ CHECKLIST FINAL

Antes de fazer push:

- [ ] EXPO_TOKEN configurado no GitHub
- [ ] Keystore configurado no EAS
- [ ] Workflow testado localmente (opcional)
- [ ] Notificações configuradas
- [ ] README atualizado com badge (opcional)

---

## 🎉 PRONTO!

Agora a cada push no repositório, o GitHub Actions vai:
1. ✅ Validar código (TypeScript, Lint, Testes)
2. ✅ Gerar build de produção (APK + AAB)
3. ✅ Disponibilizar artefatos para download
4. ✅ Notificar sobre sucesso/falha

**Tempo total de setup:** 10-15 minutos  
**Tempo de build automático:** 15-25 minutos

---

**Documento criado por:** Kiro AI  
**Data:** 05/05/2026  
**Versão:** 1.0
