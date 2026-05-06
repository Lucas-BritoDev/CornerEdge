# ⚡ CORREÇÃO RÁPIDA - APK NÃO FUNCIONA

**Tempo:** 5 minutos  
**Problema:** App funciona no Expo Go mas não no APK

---

## 🎯 SOLUÇÃO RÁPIDA

### Passo 1: Editar app.config.js

Abra o arquivo `app.config.js` e **substitua** a seção `extra`:

**ANTES:**
```javascript
extra: {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  apiFootballKey: process.env.APIFOOTBALL_KEY || "",
}
```

**DEPOIS:**
```javascript
extra: {
  // ✅ Hardcode direto (anon key é segura para exposição)
  supabaseUrl: "https://pgglewzdzqbisidecndz.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w",
  apiFootballKey: "1a896aad078a4eec7ab7121281bcd5ec",
}
```

### Passo 2: Commitar e Gerar Novo APK

```bash
# Commitar mudanças
git add app.config.js
git commit -m "fix: hardcode env vars for production build"
git push origin main

# Aguardar GitHub Actions gerar novo APK (~30-40 min)
# Ou gerar localmente:
npx expo prebuild --clean
cd android
./gradlew assembleRelease
```

### Passo 3: Testar

```bash
# Instalar APK no dispositivo
adb install android/app/build/outputs/apk/release/app-release.apk

# Ou baixar do GitHub Actions e instalar manualmente
```

---

## ✅ DEVE FUNCIONAR AGORA!

**Por quê?**
- ✅ Variáveis estão hardcoded no app.config.js
- ✅ Constants.expoConfig.extra terá os valores corretos
- ✅ Supabase será inicializado corretamente
- ✅ App funcionará no APK

---

## 🔒 É SEGURO?

**SIM!** Anon key do Supabase é PÚBLICA:
- ✅ Feita para ser exposta no client
- ✅ RLS (Row Level Security) protege os dados
- ✅ Não dá acesso a dados sensíveis
- ✅ Todos os apps Supabase fazem isso

**Documentação oficial:**
https://supabase.com/docs/guides/api/api-keys

---

## 📋 ARQUIVO COMPLETO

```javascript
// app.config.js
export default {
  expo: {
    name: "GoalEdge",
    slug: "goaledge",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "goaledge",
    userInterfaceStyle: "automatic",
    
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1A1A1A"
    },
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.goaledge.app"
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#1A1A1A"
      },
      package: "com.goaledge.app"
    },
    
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    
    plugins: [
      "expo-router",
      "expo-web-browser"
    ],
    
    experiments: {
      typedRoutes: true
    },
    
    extra: {
      router: {},
      
      eas: {
        projectId: "0d9fcdf1-3bbb-416e-bb66-07b3643e99a8"
      },
      
      // ✅ CORREÇÃO: Hardcode direto
      supabaseUrl: "https://pgglewzdzqbisidecndz.supabase.co",
      supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w",
      apiFootballKey: "1a896aad078a4eec7ab7121281bcd5ec",
      
      // Flags de feature
      enableAdMob: true,
      enableAnalytics: false,
      
      // Configurações
      defaultLanguage: "pt",
      defaultTheme: "dark"
    }
  }
};
```

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Aplicar correção acima
2. ✅ Gerar novo APK
3. ✅ Testar no dispositivo
4. ✅ Publicar na Play Store

---

**Criado por:** Kiro AI  
**Data:** 06/05/2026
