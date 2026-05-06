# 🔧 Correções Comuns para Crash

**Problema:** App fecha ao abrir  
**Soluções:** Aplicar correções preventivas

---

## ✅ Correção 1: Variáveis de Ambiente

### Problema

O app tenta acessar variáveis de ambiente que não existem no build de produção.

### Solução

Criar arquivo `app.config.js` para injetar variáveis no build:

```javascript
// app.config.js
export default {
  expo: {
    name: "GoalEdge",
    slug: "goaledge",
    version: "1.0.0",
    // ... outras configurações do app.json
    
    extra: {
      // Variáveis disponíveis via Constants.expoConfig.extra
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key",
      apiFootballKey: process.env.APIFOOTBALL_KEY || "",
      
      // EAS Project ID
      eas: {
        projectId: "0d9fcdf1-3bbb-416e-bb66-07b3643e99a8"
      }
    }
  }
};
```

### Usar no Código

```typescript
// services/supabase.ts
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase config missing!');
  // Usar valores padrão ou mostrar erro
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## ✅ Correção 2: AdMob App ID

### Problema

AdMob requer App ID configurado no AndroidManifest.xml

### Solução

Verificar se o App ID está configurado:

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application>
    <!-- AdMob App ID -->
    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-3940256099942544~3347511713"/>
    
    <!-- Resto da configuração -->
</application>
```

**Nota:** Use o App ID de teste acima ou seu App ID real do AdMob.

---

## ✅ Correção 3: Desabilitar ProGuard

### Problema

ProGuard/R8 pode estar removendo código necessário.

### Solução

Criar `android/app/proguard-rules.pro`:

```proguard
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Expo
-keep class expo.modules.** { *; }

# Supabase
-keep class io.supabase.** { *; }

# AdMob
-keep class com.google.android.gms.ads.** { *; }

# React Native Google Mobile Ads
-keep class com.google.android.gms.** { *; }
-keep class com.google.firebase.** { *; }

# Não ofuscar classes de erro
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
```

---

## ✅ Correção 4: Desabilitar Hermes (Temporário)

### Problema

Hermes pode causar problemas com algumas bibliotecas.

### Solução

```json
// app.json
{
  "expo": {
    "android": {
      "jsEngine": "jsc"  // Usar JavaScriptCore
    }
  }
}
```

**Nota:** Isso aumentará o tamanho do APK, mas pode resolver o crash.

---

## ✅ Correção 5: Permissões

### Problema

Permissões faltando no AndroidManifest.xml

### Solução

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
    <!-- Permissões necessárias -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
    
    <!-- AdMob -->
    <uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
    
    <application>
        <!-- ... -->
    </application>
</manifest>
```

---

## ✅ Correção 6: Plugin Problemático

### Problema

Plugin `withFixedFrescoVersion` pode estar causando problemas.

### Solução

Remover do `app.json`:

```json
// app.json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-web-browser"
      // Remover: "./plugins/withFixedFrescoVersion"
    ]
  }
}
```

---

## 🚀 Aplicar Todas as Correções

### Script Automático

Crie `fix-crash.sh`:

```bash
#!/bin/bash

echo "🔧 Aplicando correções para crash..."

# 1. Criar app.config.js
cat > app.config.js << 'EOF'
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
      package: "com.goaledge.app",
      jsEngine: "jsc"
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
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      apiFootballKey: process.env.APIFOOTBALL_KEY
    }
  }
};
EOF

echo "✅ app.config.js criado"

# 2. Atualizar package.json para usar app.config.js
echo "✅ Configurações aplicadas"

# 3. Limpar e rebuild
echo "🧹 Limpando..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

echo "✅ Correções aplicadas!"
echo "📝 Próximo passo: Rebuild o app"
```

### Executar

```bash
chmod +x fix-crash.sh
./fix-crash.sh
```

---

## 📋 Checklist de Correções

Marque conforme aplica:

- [ ] Criar `app.config.js` com variáveis de ambiente
- [ ] Verificar AdMob App ID no AndroidManifest.xml
- [ ] Adicionar regras ProGuard
- [ ] Desabilitar Hermes (temporário)
- [ ] Verificar permissões no AndroidManifest.xml
- [ ] Remover plugin `withFixedFrescoVersion`
- [ ] Rebuild o app
- [ ] Testar novamente

---

## 🎯 Rebuild Após Correções

```bash
# 1. Limpar
rm -rf android/
rm -rf node_modules/
rm package-lock.json

# 2. Reinstalar
npm install --legacy-peer-deps

# 3. Prebuild
npx expo prebuild --platform android --clean

# 4. Build
cd android
./gradlew assembleRelease

# 5. Instalar
adb install app/build/outputs/apk/release/app-release.apk

# 6. Ver logs
adb logcat | grep -i "goaledge"
```

---

## 💡 Dica Final

Se nada funcionar, gere um **APK de debug** para ver os logs detalhados:

```bash
# Build debug
cd android
./gradlew assembleDebug

# Instalar
adb install app/build/outputs/apk/debug/app-debug.apk

# Ver logs
adb logcat | grep -i "goaledge\|error\|crash"
```

---

**Status:** ⏳ Aplicar correções  
**Próximo:** Rebuild e testar
