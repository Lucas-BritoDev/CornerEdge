# 🚀 Build Local - Guia Rápido

**Versão:** 6.0.0  
**Data:** 06/05/2026

---

## ✨ O Que Mudou?

### ❌ Antes (EAS Build)
- Precisava de EXPO_TOKEN
- Build no servidor Expo
- Download no Expo Dashboard
- Limite de builds no free tier

### ✅ Agora (Build Local)
- **Sem EXPO_TOKEN necessário**
- Build no GitHub Actions
- Download direto no GitHub (aba Artifacts)
- 2000 minutos/mês grátis

---

## 🚀 Como Usar

### 1️⃣ Commit e Push (2 min)

```bash
# Adicionar arquivos
git add .

# Commit
git commit -m "ci: adicionar build local no GitHub Actions"

# Push
git push origin main
```

### 2️⃣ Aguardar Build (35-40 min)

1. Acesse: https://github.com/luck1993/goaledge/actions
2. Clique em "Android Build Local"
3. Aguarde conclusão (verde = sucesso)

### 3️⃣ Baixar Artefatos (1 min)

1. Na página do workflow, role até "Artifacts"
2. Baixe:
   - **goaledge-apk** (para testar)
   - **goaledge-aab** (para Play Store)

---

## 📊 Timeline

```
Agora          → Commit e push (2 min)
+10 min        → Testes concluídos
+35 min        → APK e AAB prontos
+1 min         → Download
─────────────────────────────────────
Total: ~40 minutos
```

---

## 📥 Como Baixar

### Passo a Passo Visual

```
1. GitHub → Repositório
   ↓
2. Aba "Actions"
   ↓
3. "Android Build Local"
   ↓
4. Última execução (verde)
   ↓
5. Seção "Artifacts"
   ↓
6. Download APK e AAB
```

### Exemplo de Tela

```
┌─────────────────────────────────────┐
│ Artifacts (2)                       │
├─────────────────────────────────────┤
│ 📦 goaledge-apk                     │
│    45.2 MB · Expires in 30 days     │
│    [Download]                       │
├─────────────────────────────────────┤
│ 📦 goaledge-aab                     │
│    38.7 MB · Expires in 30 days     │
│    [Download]                       │
└─────────────────────────────────────┘
```

---

## ✅ Vantagens

| Aspecto | Benefício |
|---------|-----------|
| 🔓 **Sem Token** | Não precisa configurar EXPO_TOKEN |
| 📥 **Download Direto** | Baixe no GitHub, não no Expo |
| 💰 **Gratuito** | 2000 min/mês = ~60-100 builds |
| 🚀 **Paralelo** | APK e AAB ao mesmo tempo |
| 🔒 **Privado** | Artefatos só você vê |
| ⏱️ **Retenção** | 30 dias de armazenamento |

---

## 🎯 Próximos Passos

### Após Download

1. **Testar APK**
   ```bash
   adb install goaledge.apk
   ```

2. **Verificar Funcionalidades**
   - Login/Logout
   - Picks do dia
   - Anúncios recompensados
   - Tema claro/escuro
   - Idiomas (PT/EN/ES)

3. **Publicar AAB**
   - Siga: `PUBLICACAO_PLAY_STORE.md`

---

## 🐛 Se Algo Der Errado

### Build Falhou?

1. **Ver logs:**
   - Clique no job que falhou
   - Leia a mensagem de erro

2. **Erros comuns:**
   - Dependências incompatíveis
   - Erro no Gradle
   - Timeout (aumentar tempo)

3. **Soluções:**
   - Verificar `package.json`
   - Atualizar dependências
   - Ver: `DOCS/BUILD_LOCAL_GITHUB_ACTIONS.md`

---

## 📚 Documentação Completa

- **Guia Técnico:** `DOCS/BUILD_LOCAL_GITHUB_ACTIONS.md`
- **Workflow:** `.github/workflows/android-build-local.yml`
- **Publicação:** `PUBLICACAO_PLAY_STORE.md`

---

## 💡 Dicas

### Economizar Minutos

- ✅ Só faça push quando necessário
- ✅ Use branches para testes
- ✅ Builds paralelos já otimizados

### Monitorar Uso

1. GitHub → Settings → Billing
2. Veja minutos usados/restantes
3. 2000 min/mês grátis

### Trigger Manual

Se quiser buildar sem fazer push:

1. Actions → Android Build Local
2. "Run workflow"
3. Selecione branch
4. "Run workflow"

---

## 🎉 Pronto!

Agora você tem:
- ✅ Build 100% no GitHub
- ✅ Sem dependências externas
- ✅ Download direto de APK e AAB
- ✅ Gratuito e ilimitado (dentro do limite)

**Execute o commit e push agora!**

```bash
git add .
git commit -m "ci: adicionar build local no GitHub Actions"
git push origin main
```

**Aguarde ~40 minutos e baixe seus arquivos!** 🚀
