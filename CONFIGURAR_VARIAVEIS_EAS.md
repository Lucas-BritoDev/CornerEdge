# 🔧 CONFIGURAR VARIÁVEIS NO EAS

**Tempo:** 10 minutos

---

## ✅ CONFIGURAÇÃO CORRETA

### Variável 1: EXPO_PUBLIC_SUPABASE_URL

```
Name: EXPO_PUBLIC_SUPABASE_URL
Value: https://pgglewzdzqbisidecndz.supabase.co
Visibility: Plain text ✅
Environments: production, preview, development (marcar todos)
```

### Variável 2: EXPO_PUBLIC_SUPABASE_ANON_KEY

```
Name: EXPO_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w
Visibility: Plain text ✅
Environments: production, preview, development (marcar todos)
```

### Variável 3: EXPO_PUBLIC_API

```
Name: EXPO_PUBLIC_API
Value: 1a896aad078a4eec7ab7121281bcd5ec
Visibility: Plain text ✅
Environments: production, preview, development (marcar todos)
```

---

## 🎯 POR QUE PLAIN TEXT?

### Plain text é CORRETO para essas variáveis:

1. **Anon Key do Supabase**
   - ✅ É PÚBLICA por design
   - ✅ Feita para ser exposta no client
   - ✅ RLS protege os dados
   - ✅ Documentação oficial recomenda

2. **URL do Supabase**
   - ✅ É pública (qualquer um pode ver)
   - ✅ Não é sensível

3. **API-Football Key**
   - ✅ Já está exposta no client de qualquer forma
   - ✅ Limite de 100 calls/dia protege contra abuso

### Quando usar Secret?

Use **Secret** apenas para:
- 🔒 Service Role Key do Supabase
- 🔒 Chaves privadas de API
- 🔒 Tokens de autenticação
- 🔒 Senhas

---

## ⚠️ IMPORTANTE: ATUALIZAR eas.json

Depois de adicionar as variáveis no painel EAS, você precisa atualizar o `eas.json`:

```json
{
  "cli": {
    "version": ">= 18.11.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$(EXPO_PUBLIC_SUPABASE_URL)",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$(EXPO_PUBLIC_SUPABASE_ANON_KEY)",
        "EXPO_PUBLIC_API": "$(EXPO_PUBLIC_API)"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$(EXPO_PUBLIC_SUPABASE_URL)",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$(EXPO_PUBLIC_SUPABASE_ANON_KEY)",
        "EXPO_PUBLIC_API": "$(EXPO_PUBLIC_API)"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$(EXPO_PUBLIC_SUPABASE_URL)",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$(EXPO_PUBLIC_SUPABASE_ANON_KEY)",
        "EXPO_PUBLIC_API": "$(EXPO_PUBLIC_API)"
      }
    },
    "production-apk": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$(EXPO_PUBLIC_SUPABASE_URL)",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$(EXPO_PUBLIC_SUPABASE_ANON_KEY)",
        "EXPO_PUBLIC_API": "$(EXPO_PUBLIC_API)"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🔄 ATUALIZAR app.config.js

**IMPORTANTE:** Se você vai usar variáveis do EAS, precisa mudar o `app.config.js`:

### Opção 1: Usar APENAS Hardcode (Recomendado - Mais Simples)

```javascript
// app.config.js
export default {
  expo: {
    // ... outras configs
    
    extra: {
      // ✅ Hardcode direto (funciona sempre)
      supabaseUrl: "https://pgglewzdzqbisidecndz.supabase.co",
      supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w",
      apiFootballKey: "1a896aad078a4eec7ab7121281bcd5ec",
    }
  }
};
```

### Opção 2: Usar Variáveis do EAS (Mais Complexo)

```javascript
// app.config.js
export default {
  expo: {
    // ... outras configs
    
    extra: {
      // ✅ Pega do EAS (só funciona com eas build)
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://pgglewzdzqbisidecndz.supabase.co",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w",
      apiFootballKey: process.env.EXPO_PUBLIC_API || "1a896aad078a4eec7ab7121281bcd5ec",
    }
  }
};
```

**⚠️ ATENÇÃO:** Opção 2 só funciona com `eas build`, não funciona com build local!

---

## 🚀 COMO FAZER BUILD COM EAS

### Passo 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Passo 2: Login

```bash
npx eas login
```

### Passo 3: Build

```bash
# APK (para testar)
npx eas build --platform android --profile production-apk

# AAB (para Play Store)
npx eas build --platform android --profile production
```

### Passo 4: Aguardar

- Build leva ~15-30 minutos
- Você receberá um link para baixar o APK/AAB

---

## 🎯 RECOMENDAÇÃO FINAL

### Para Desenvolvimento/Testes: **HARDCODE**

**Por quê?**
- ✅ Funciona imediatamente
- ✅ Não precisa configurar EAS
- ✅ Funciona com build local
- ✅ Anon key é segura para exposição

**Como:**
```javascript
// app.config.js - Deixar como está (já corrigido)
extra: {
  supabaseUrl: "https://pgglewzdzqbisidecndz.supabase.co",
  supabaseAnonKey: "eyJhbGc...",
  apiFootballKey: "1a896aad...",
}
```

### Para Produção: **EAS SECRETS**

**Por quê?**
- ✅ Mais profissional
- ✅ Fácil de trocar keys
- ✅ Não precisa commitar keys

**Como:**
1. Adicionar variáveis no painel EAS (Plain text)
2. Atualizar `eas.json` com `env`
3. Build com `eas build`

---

## 📋 CHECKLIST

### Se Usar Hardcode (Recomendado)

- [x] `app.config.js` tem valores hardcoded ✅
- [ ] Gerar novo APK
- [ ] Testar no dispositivo

### Se Usar EAS Secrets

- [ ] Adicionar 3 variáveis no painel EAS (Plain text)
- [ ] Atualizar `eas.json` com `env`
- [ ] Commitar mudanças
- [ ] Build com `eas build --platform android --profile production-apk`
- [ ] Baixar APK do link
- [ ] Testar no dispositivo

---

## 🐛 SE AINDA DER ERRO

1. **Ver logs:** `adb logcat | grep "ReactNativeJS"`
2. **Adicionar logs** no `lib/supabase.ts` (ver `DEBUG_APK_ERRO.md`)
3. **Me enviar** os logs para eu analisar

---

**Criado por:** Kiro AI  
**Data:** 06/05/2026
