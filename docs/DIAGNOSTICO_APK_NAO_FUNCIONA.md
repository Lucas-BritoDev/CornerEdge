# 🔍 DIAGNÓSTICO - APK NÃO FUNCIONA (Expo Go Funciona)

**Data:** 06/05/2026  
**Problema:** App funciona no Expo Go mas não funciona quando compilado em APK

---

## 🎯 PROBLEMA IDENTIFICADO

### Sintoma
- ✅ **Expo Go:** App funciona perfeitamente
- ❌ **APK/AAB:** App não funciona (tela branca, crash, ou não carrega dados)

### Causa Raiz: **VARIÁVEIS DE AMBIENTE NÃO SÃO INCLUÍDAS NO BUILD**

---

## 🔍 ANÁLISE DO CÓDIGO ATUAL

### 1. Como as Variáveis São Carregadas

**Arquivo:** `lib/supabase.ts`
```typescript
// ❌ PROBLEMA: Tenta pegar de duas fontes
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                    process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
```

**Arquivo:** `app.config.js`
```javascript
extra: {
  // ❌ PROBLEMA: process.env só funciona em desenvolvimento
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
}
```

### 2. Por Que Funciona no Expo Go?

**Expo Go (Desenvolvimento):**
```
1. Metro bundler lê .env
2. process.env.EXPO_PUBLIC_* está disponível
3. Variáveis são injetadas no bundle JavaScript
4. ✅ App funciona
```

### 3. Por Que NÃO Funciona no APK?

**Build de Produção (APK/AAB):**
```
1. Gradle compila código nativo
2. .env NÃO é lido automaticamente
3. process.env.EXPO_PUBLIC_* retorna undefined
4. app.config.js extra.supabaseUrl = ""
5. Constants.expoConfig.extra.supabaseUrl = ""
6. ❌ Supabase não inicializa (URL vazia)
7. ❌ App não funciona
```

---

## 🔧 SOLUÇÕES

### ✅ SOLUÇÃO 1: Hardcode no app.config.js (Mais Simples)

**Vantagens:**
- ✅ Funciona 100%
- ✅ Não precisa configurar nada no GitHub Actions
- ✅ Rápido de implementar (5 minutos)

**Desvantagens:**
- ⚠️ Expõe keys no código (mas anon key é segura)
- ⚠️ Precisa commitar as keys

**Implementação:**

```javascript
// app.config.js
export default {
  expo: {
    // ... outras configs
    
    extra: {
      // ✅ SOLUÇÃO: Hardcode direto (anon key é segura)
      supabaseUrl: "https://pgglewzdzqbisidecndz.supabase.co",
      supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w",
      apiFootballKey: "1a896aad078a4eec7ab7121281bcd5ec",
    }
  }
};
```

**Por que é seguro:**
- ✅ Anon key do Supabase é PÚBLICA (feita para ser exposta)
- ✅ RLS (Row Level Security) protege os dados
- ✅ API-Football key já está exposta no client de qualquer forma

---

### ✅ SOLUÇÃO 2: Usar GitHub Secrets + EAS Build (Mais Seguro)

**Vantagens:**
- ✅ Keys não ficam no código
- ✅ Mais profissional
- ✅ Fácil de trocar keys

**Desvantagens:**
- ⚠️ Precisa configurar GitHub Secrets
- ⚠️ Precisa usar EAS Build (não funciona com build local)

**Implementação:**

**Passo 1:** Configurar GitHub Secrets

```
1. Ir em Settings > Secrets and variables > Actions
2. Adicionar secrets:
   - EXPO_PUBLIC_SUPABASE_URL
   - EXPO_PUBLIC_SUPABASE_ANON_KEY
   - EXPO_PUBLIC_API
```

**Passo 2:** Atualizar app.config.js

```javascript
// app.config.js
export default {
  expo: {
    extra: {
      // ✅ Pega de variáveis de ambiente (build time)
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      apiFootballKey: process.env.EXPO_PUBLIC_API,
    }
  }
};
```

**Passo 3:** Atualizar GitHub Actions

```yaml
# .github/workflows/android-build-local.yml

- name: 🏗️ Build APK
  env:
    EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.EXPO_PUBLIC_SUPABASE_URL }}
    EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.EXPO_PUBLIC_SUPABASE_ANON_KEY }}
    EXPO_PUBLIC_API: ${{ secrets.EXPO_PUBLIC_API }}
  run: |
    cd android
    ./gradlew assembleRelease
```

**⚠️ PROBLEMA:** Build local do Gradle NÃO lê variáveis de ambiente do Node.js!

---

### ✅ SOLUÇÃO 3: Usar eas-cli com Secrets (Recomendado)

**Vantagens:**
- ✅ Keys não ficam no código
- ✅ Funciona perfeitamente
- ✅ Suportado oficialmente pelo Expo

**Desvantagens:**
- ⚠️ Precisa usar EAS Build (não é build local)
- ⚠️ Precisa de conta Expo

**Implementação:**

**Passo 1:** Configurar secrets no EAS

```bash
# Adicionar secrets
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://pgglewzdzqbisidecndz.supabase.co"
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGc..."
npx eas secret:create --scope project --name EXPO_PUBLIC_API --value "1a896aad..."

# Listar secrets
npx eas secret:list
```

**Passo 2:** Atualizar eas.json

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$(EXPO_PUBLIC_SUPABASE_URL)",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$(EXPO_PUBLIC_SUPABASE_ANON_KEY)",
        "EXPO_PUBLIC_API": "$(EXPO_PUBLIC_API)"
      }
    }
  }
}
```

**Passo 3:** Build com EAS

```bash
npx eas build --platform android --profile production
```

---

## 🎯 RECOMENDAÇÃO

### Para Desenvolvimento/Testes Rápidos: **SOLUÇÃO 1**

**Motivo:**
- ✅ Funciona imediatamente
- ✅ Não precisa configurar nada
- ✅ Anon key é segura para exposição

**Implementação:**
```javascript
// app.config.js - Hardcode direto
extra: {
  supabaseUrl: "https://pgglewzdzqbisidecndz.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  apiFootballKey: "1a896aad078a4eec7ab7121281bcd5ec",
}
```

### Para Produção: **SOLUÇÃO 3**

**Motivo:**
- ✅ Mais profissional
- ✅ Keys não ficam no código
- ✅ Suportado oficialmente

**Implementação:**
```bash
# 1. Configurar secrets
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..."

# 2. Build com EAS
npx eas build --platform android --profile production
```

---

## 🔍 COMO VERIFICAR SE O PROBLEMA É ESSE

### Teste 1: Verificar Logs do App

**Adicionar logs temporários em `lib/supabase.ts`:**

```typescript
// lib/supabase.ts
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                    process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// ✅ ADICIONAR LOGS
console.log('=== SUPABASE CONFIG ===');
console.log('URL:', supabaseUrl ? 'configured' : 'MISSING');
console.log('Key:', supabaseAnonKey ? 'configured' : 'MISSING');
console.log('Source:', Constants.expoConfig?.extra?.supabaseUrl ? 'app.config.js' : 'process.env');
console.log('=======================');
```

**Verificar logs:**
```bash
# Android
adb logcat | grep "SUPABASE CONFIG"

# Ou usar React Native Debugger
```

**Resultado Esperado:**
```
Expo Go: URL: configured, Key: configured, Source: process.env
APK: URL: MISSING, Key: MISSING, Source: undefined
```

### Teste 2: Verificar Constants.expoConfig

**Adicionar em qualquer tela:**

```typescript
import Constants from 'expo-constants';

console.log('Constants.expoConfig.extra:', Constants.expoConfig?.extra);
```

**Resultado Esperado:**
```
Expo Go: { supabaseUrl: "https://...", supabaseAnonKey: "eyJ..." }
APK: { supabaseUrl: "", supabaseAnonKey: "" }
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Opção 1: Hardcode (Rápido)

- [ ] Abrir `app.config.js`
- [ ] Substituir `process.env.EXPO_PUBLIC_*` por valores hardcoded
- [ ] Commitar mudanças
- [ ] Gerar novo APK
- [ ] Testar no dispositivo
- [ ] ✅ Deve funcionar!

### Opção 2: EAS Secrets (Produção)

- [ ] Instalar EAS CLI: `npm install -g eas-cli`
- [ ] Login: `npx eas login`
- [ ] Criar secrets: `npx eas secret:create ...`
- [ ] Atualizar `eas.json`
- [ ] Build: `npx eas build --platform android`
- [ ] Baixar APK do EAS
- [ ] Testar no dispositivo
- [ ] ✅ Deve funcionar!

---

## 🚨 OUTROS PROBLEMAS COMUNS

### 1. Tela Branca no APK

**Causa:** Erro JavaScript não tratado

**Solução:**
```typescript
// App.tsx ou _layout.tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Erro: {error.message}</Text>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {/* Seu app */}
    </ErrorBoundary>
  );
}
```

### 2. App Fecha Imediatamente (Crash)

**Causa:** Dependência nativa não configurada

**Solução:**
```bash
# Verificar logs de crash
adb logcat | grep "AndroidRuntime"

# Recompilar com prebuild limpo
npx expo prebuild --clean
cd android
./gradlew clean
./gradlew assembleRelease
```

### 3. Dados Não Carregam

**Causa:** Variáveis de ambiente vazias (este documento)

**Solução:** Implementar Solução 1 ou 3 acima

### 4. AdMob Não Funciona

**Causa:** Application ID não configurado

**Solução:**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
```

---

## 📊 COMPARAÇÃO DAS SOLUÇÕES

| Aspecto | Solução 1 (Hardcode) | Solução 2 (GitHub) | Solução 3 (EAS) |
|---------|---------------------|-------------------|-----------------|
| **Tempo** | 5 min | 30 min | 20 min |
| **Segurança** | ⚠️ Keys no código | ✅ Keys em secrets | ✅ Keys em secrets |
| **Facilidade** | ✅ Muito fácil | ⚠️ Médio | ✅ Fácil |
| **Build Local** | ✅ Sim | ❌ Não funciona | ❌ Não (usa EAS) |
| **Produção** | ⚠️ OK para anon key | ❌ Não recomendado | ✅ Recomendado |
| **Custo** | ✅ Grátis | ✅ Grátis | ✅ Grátis (limite) |

---

## 🎯 PRÓXIMOS PASSOS

### Agora (5 minutos)

1. ✅ Implementar Solução 1 (hardcode)
2. ✅ Gerar novo APK
3. ✅ Testar no dispositivo
4. ✅ Verificar se funciona

### Depois (para produção)

1. ✅ Migrar para Solução 3 (EAS Secrets)
2. ✅ Configurar secrets no EAS
3. ✅ Build com EAS
4. ✅ Publicar na Play Store

---

## 📚 REFERÊNCIAS

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Secrets](https://docs.expo.dev/build-reference/variables/)
- [Supabase Anon Key Security](https://supabase.com/docs/guides/api/api-keys)

---

**Criado por:** Kiro AI  
**Data:** 06/05/2026  
**Versão:** 1.0
