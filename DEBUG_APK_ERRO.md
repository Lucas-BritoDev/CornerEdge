# 🐛 DEBUG - APK COM ERRO

**Data:** 06/05/2026

---

## 🔍 COMO DESCOBRIR O ERRO

### Método 1: Logs do Android (Mais Eficaz)

```bash
# 1. Conectar celular via USB
# 2. Habilitar depuração USB
# 3. Instalar APK
# 4. Abrir terminal e executar:

adb logcat | grep -E "ReactNativeJS|AndroidRuntime|GoalEdge"

# Ou no Windows PowerShell:
adb logcat | Select-String -Pattern "ReactNativeJS|AndroidRuntime|GoalEdge"

# 5. Abrir o app no celular
# 6. Ver os erros que aparecem
```

### Método 2: Adicionar Logs no Código

**Arquivo:** `lib/supabase.ts`

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// ✅ ADICIONAR LOGS DETALHADOS
console.log('=== SUPABASE INITIALIZATION ===');
console.log('Constants.expoConfig:', Constants.expoConfig ? 'exists' : 'MISSING');
console.log('Constants.expoConfig.extra:', Constants.expoConfig?.extra ? 'exists' : 'MISSING');

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                    process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('supabaseUrl:', supabaseUrl || 'EMPTY');
console.log('supabaseAnonKey:', supabaseAnonKey ? 'configured (length: ' + supabaseAnonKey.length + ')' : 'EMPTY');

// Validar configuração
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration missing!');
    console.error('URL:', supabaseUrl ? 'configured' : 'MISSING');
    console.error('Key:', supabaseAnonKey ? 'configured' : 'MISSING');
    console.error('Check your .env file and app.config.js');
    
    // ✅ ADICIONAR ALERTA VISUAL
    alert('ERRO: Configuração do Supabase está faltando!\n\nURL: ' + (supabaseUrl || 'VAZIO') + '\nKey: ' + (supabaseAnonKey ? 'OK' : 'VAZIO'));
}

console.log('=== END SUPABASE INITIALIZATION ===');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
```

### Método 3: Verificar app.config.js no Build

**Adicionar logs em `app.config.js`:**

```javascript
// app.config.js
console.log('=== APP.CONFIG.JS ===');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL || 'NOT SET');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('EXPO_PUBLIC_API:', process.env.EXPO_PUBLIC_API || 'NOT SET');

export default {
  expo: {
    // ... resto da config
    
    extra: {
      // Valores hardcoded (devem funcionar)
      supabaseUrl: "https://pgglewzdzqbisidecndz.supabase.co",
      supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w",
      apiFootballKey: "1a896aad078a4eec7ab7121281bcd5ec",
    }
  }
};

console.log('=== END APP.CONFIG.JS ===');
```

---

## 🔧 SOLUÇÕES PARA ERROS COMUNS

### Erro 1: "Unable to resolve module"

**Causa:** Dependência faltando ou mal configurada

**Solução:**
```bash
# Limpar tudo e reinstalar
rm -rf node_modules
npm install --legacy-peer-deps

# Rebuild
npx expo prebuild --clean
cd android
./gradlew clean
./gradlew assembleRelease
```

### Erro 2: "Network request failed"

**Causa:** Supabase URL ou key inválidos

**Solução:**
```javascript
// Verificar se os valores estão corretos
const supabaseUrl = "https://pgglewzdzqbisidecndz.supabase.co"; // ✅ Correto
const supabaseAnonKey = "eyJhbGc..."; // ✅ Deve ter ~200+ caracteres
```

### Erro 3: "Cannot read property 'extra' of undefined"

**Causa:** Constants.expoConfig não está disponível

**Solução:**
```typescript
// Usar fallback seguro
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                    "https://pgglewzdzqbisidecndz.supabase.co";
```

### Erro 4: Tela Branca

**Causa:** Erro JavaScript não tratado

**Solução:**
```typescript
// Adicionar Error Boundary
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Erro no App
      </Text>
      <Text style={{ color: 'red' }}>{error.message}</Text>
      <Text style={{ marginTop: 10, fontSize: 12 }}>
        {error.stack}
      </Text>
    </View>
  );
}

// Envolver o app
export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {/* Seu app */}
    </ErrorBoundary>
  );
}
```

### Erro 5: App Fecha Imediatamente (Crash)

**Causa:** Erro nativo (Java/Kotlin) - Geralmente AdMob não configurado

**Solução:**
```bash
# Ver logs de crash
adb logcat | grep "AndroidRuntime"

# Procurar por:
# - FATAL EXCEPTION
# - java.lang.RuntimeException
# - Caused by:
# - MobileAds
```

**Causa Comum:** AdMob Application ID faltando

**Correção em app.config.js:**
```javascript
plugins: [
  "expo-router",
  "expo-web-browser",
  [
    "react-native-google-mobile-ads",
    {
      "androidAppId": "ca-app-pub-8609967398609187~5936939727",
      "iosAppId": "ca-app-pub-8609967398609187~5936939727"
    }
  ]
]
```

**Ou desabilitar AdMob temporariamente:**
```javascript
extra: {
  enableAdMob: false, // ← Desabilitar para testar
}
```

---

## 📋 CHECKLIST DE DEBUG

### Passo 1: Verificar Configuração

- [ ] `app.config.js` tem valores hardcoded?
- [ ] Valores estão corretos (URL, key)?
- [ ] Não tem typos nos nomes das variáveis?

### Passo 2: Verificar Build

- [ ] Build completou sem erros?
- [ ] APK foi gerado?
- [ ] Tamanho do APK é razoável (>20MB)?

### Passo 3: Verificar Instalação

- [ ] APK instalou no celular?
- [ ] Permissões foram concedidas?
- [ ] Celular tem internet?

### Passo 4: Verificar Logs

- [ ] Conectou celular via USB?
- [ ] Habilitou depuração USB?
- [ ] Executou `adb logcat`?
- [ ] Viu os logs ao abrir o app?

---

## 🎯 TESTE RÁPIDO

### Criar APK de Teste Mínimo

**Arquivo:** `app/(tabs)/index.tsx`

```typescript
import { View, Text, Button, Alert } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

export default function TestScreen() {
  const testConfig = () => {
    const url = Constants.expoConfig?.extra?.supabaseUrl;
    const key = Constants.expoConfig?.extra?.supabaseAnonKey;
    
    Alert.alert(
      'Configuração',
      `URL: ${url ? 'OK' : 'FALTANDO'}\nKey: ${key ? 'OK' : 'FALTANDO'}`
    );
  };
  
  const testSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_picks')
        .select('*')
        .limit(1);
      
      if (error) {
        Alert.alert('Erro Supabase', error.message);
      } else {
        Alert.alert('Sucesso!', 'Supabase funcionando!');
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Teste de Configuração
      </Text>
      
      <Button title="Testar Config" onPress={testConfig} />
      <View style={{ height: 10 }} />
      <Button title="Testar Supabase" onPress={testSupabase} />
      
      <Text style={{ marginTop: 20, fontSize: 12, color: 'gray' }}>
        URL: {Constants.expoConfig?.extra?.supabaseUrl || 'VAZIO'}
      </Text>
    </View>
  );
}
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Adicionar logs** no `lib/supabase.ts`
2. **Gerar novo APK** com logs
3. **Instalar e abrir** o app
4. **Executar** `adb logcat` e ver os logs
5. **Me enviar** os logs para eu analisar

---

**Criado por:** Kiro AI  
**Data:** 06/05/2026
