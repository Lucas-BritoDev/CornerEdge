# 🐛 Debug: App Crashando ao Abrir

**Data:** 06/05/2026  
**Problema:** App fecha imediatamente após abrir  
**Status:** 🔴 Investigando

---

## 🔍 Causas Comuns

### 1. Variáveis de Ambiente Faltando

O app pode estar tentando acessar variáveis de ambiente que não existem no build de produção.

**Solução:** Verificar `.env` e `app.json`

### 2. Dependências Nativas Não Configuradas

Algumas bibliotecas precisam de configuração adicional no build nativo.

**Exemplos:**
- `react-native-google-mobile-ads` (AdMob)
- `@supabase/supabase-js`
- `expo-notifications`

### 3. Hermes Engine

O Hermes pode causar problemas com algumas bibliotecas.

### 4. ProGuard/R8

O minificador pode estar removendo código necessário.

---

## 🚀 Soluções Rápidas

### Solução 1: Ver Logs do Crash

```bash
# Conectar dispositivo via USB
adb devices

# Ver logs em tempo real
adb logcat | grep -i "goaledge\|crash\|error\|exception"

# Ou salvar em arquivo
adb logcat > crash_log.txt
```

### Solução 2: Build de Debug

Vamos criar um APK de debug para ver os logs:

```bash
# Gerar android/
npx expo prebuild --platform android --clean

# Build debug
cd android
./gradlew assembleDebug

# Instalar
adb install app/build/outputs/apk/debug/app-debug.apk

# Ver logs
adb logcat | grep -i "goaledge"
```

### Solução 3: Desabilitar Hermes

Se o problema for o Hermes:

```json
// app.json
{
  "expo": {
    "android": {
      "jsEngine": "jsc"  // Usar JavaScriptCore em vez de Hermes
    }
  }
}
```

### Solução 4: Desabilitar ProGuard

Se o problema for minificação:

```gradle
// android/app/build.gradle
buildTypes {
    release {
        minifyEnabled false  // Desabilitar minificação
        shrinkResources false
    }
}
```

---

## 🔧 Correções Específicas

### AdMob (react-native-google-mobile-ads)

**Problema:** App ID não configurado

**Solução:**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application>
    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"/>
</application>
```

### Supabase

**Problema:** URL ou Anon Key faltando

**Solução:**

```typescript
// Verificar se variáveis existem
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase config missing!');
}
```

### Expo Router

**Problema:** Rotas não configuradas

**Solução:**

```json
// app.json
{
  "expo": {
    "plugins": [
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## 📋 Checklist de Debug

Execute na ordem:

- [ ] **1. Ver logs do crash**
  ```bash
  adb logcat | grep -i "goaledge\|crash\|error"
  ```

- [ ] **2. Verificar variáveis de ambiente**
  - `.env` existe?
  - Variáveis estão corretas?

- [ ] **3. Verificar AndroidManifest.xml**
  - AdMob App ID configurado?
  - Permissões corretas?

- [ ] **4. Build de debug**
  ```bash
  cd android
  ./gradlew assembleDebug
  ```

- [ ] **5. Testar sem minificação**
  - Desabilitar ProGuard
  - Rebuild

- [ ] **6. Testar sem Hermes**
  - Usar JSC
  - Rebuild

---

## 🎯 Próximos Passos

### 1. Coletar Logs

```bash
# Instalar APK
adb install goaledge.apk

# Abrir app e ver logs
adb logcat -c  # Limpar logs
adb logcat | grep -i "goaledge"

# Abrir o app no dispositivo
# Copiar a mensagem de erro
```

### 2. Enviar Logs

Copie a mensagem de erro e me envie para análise.

### 3. Build de Debug

Enquanto isso, vamos criar um build de debug:

```bash
npx expo prebuild --platform android --clean
cd android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## 💡 Dicas

### Ver Crash Report

```bash
# Crash completo
adb logcat -d > crash_full.txt

# Apenas erros
adb logcat -d *:E > crash_errors.txt

# Filtrar por app
adb logcat -d | grep "com.goaledge.app"
```

### Limpar e Reinstalar

```bash
# Desinstalar
adb uninstall com.goaledge.app

# Limpar cache
adb shell pm clear com.goaledge.app

# Reinstalar
adb install goaledge.apk
```

---

## 📚 Recursos

- **Logs ADB:** https://developer.android.com/studio/command-line/logcat
- **Expo Troubleshooting:** https://docs.expo.dev/troubleshooting/
- **React Native Debugging:** https://reactnative.dev/docs/debugging

---

**Status:** 🔴 Aguardando logs do crash  
**Próximo:** Coletar logs com `adb logcat`
