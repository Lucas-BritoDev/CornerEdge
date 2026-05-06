# 🔐 Configurar Secrets no GitHub Actions

## ⚠️ IMPORTANTE: Configuração Obrigatória

Para o build funcionar, você precisa configurar as variáveis de ambiente como **Secrets** no GitHub.

---

## 📋 Passo a Passo

### 1. Acessar Configurações do Repositório

1. Vá para: https://github.com/Lucas-BritoDev/GoalEdge
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**

### 2. Adicionar os Secrets

Clique em **New repository secret** e adicione cada uma das variáveis abaixo:

#### Secret 1: EXPO_PUBLIC_SUPABASE_URL
```
Nome: EXPO_PUBLIC_SUPABASE_URL
Valor: https://pgglewzdzqbisidecndz.supabase.co
```

#### Secret 2: EXPO_PUBLIC_SUPABASE_ANON_KEY
```
Nome: EXPO_PUBLIC_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w
```

#### Secret 3: EXPO_PUBLIC_API
```
Nome: EXPO_PUBLIC_API
Valor: 1a896aad078a4eec7ab7121281bcd5ec
```

---

## ✅ Verificar Configuração

Após adicionar os 3 secrets, você deve ver:

```
EXPO_PUBLIC_SUPABASE_URL     Updated X minutes ago
EXPO_PUBLIC_SUPABASE_ANON_KEY Updated X minutes ago
EXPO_PUBLIC_API               Updated X minutes ago
```

---

## 🚀 Próximo Passo

Depois de configurar os secrets:

1. Faça commit e push das mudanças
2. O GitHub Actions vai usar os secrets automaticamente
3. O build deve funcionar corretamente

---

## 🔒 Segurança

- ✅ Secrets são criptografados pelo GitHub
- ✅ Não aparecem nos logs do Actions
- ✅ Só são acessíveis durante o build
- ⚠️ Nunca commite o arquivo `.env` no git!

---

## 📚 Referência

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
