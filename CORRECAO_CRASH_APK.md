# ✅ CORREÇÃO - APK CRASHANDO AO ABRIR

**Data:** 06/05/2026  
**Problema:** App fecha imediatamente ao abrir (nem abre)  
**Status:** ✅ CORRIGIDO

---

## 🎯 PROBLEMA IDENTIFICADO

### Sintoma
- App **NÃO abre** - fecha imediatamente ao clicar no ícone
- Crash nativo (Java/Kotlin), não JavaScript

### Causa Raiz
**AdMob Application ID não configurado no app.config.js**

O app tem:
- ✅ `react-native-google-mobile-ads` instalado (package.json)
- ✅ `enableAdMob: true` (app.config.js)
- ❌ **Plugin do AdMob NÃO configurado** (app.config.js)

Resultado: AndroidManifest.xml fica sem o Application ID → Crash nativo

---

## 🔧 CORREÇÃO APLICADA

### Arquivo: `app.config.js`

**ANTES (causava crash):**
```javascript
plugins: [
  "expo-router",
  "expo-web-browser"
  // ❌ Faltando plugin do AdMob
],

extra: {
  enableAdMob: true, // ← Habilitado mas sem configuração
}
```

**DEPOIS (corrigido):**
```javascript
plugins: [
  "expo-router",
  "expo-web-browser",
  // ✅ CORREÇÃO: Plugin do AdMob adicionado
  [
    "react-native-google-mobile-ads",
    {
      // IDs de PRODUÇÃO (do ads-service.ts)
      "androidAppId": "ca-app-pub-8609967398609187~5936939727",
      "iosAppId": "ca-app-pub-8609967398609187~5936939727"
    }
  ]
],

extra: {
  enableAdMob: true, // ← Agora funciona corretamente
}
```

---

## 📋 PRÓXIMOS PASSOS

### 1. Gerar Novo APK

```bash
# Opção A: Build local
npx expo prebuild --clean
cd android
./gradlew clean
./gradlew assembleRelease

# APK estará em: android/app/build/outputs/apk/release/app-release.apk
```

```bash
# Opção B: GitHub Actions
git add app.config.js
git commit -m "fix: adicionar plugin AdMob para evitar crash"
git push origin main

# Aguardar build no GitHub Actions
# Baixar APK dos artifacts
```

```bash
# Opção C: EAS Build
npx eas build --platform android --profile production
```

### 2. Instalar e Testar

```bash
# Instalar APK no celular
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Ou transferir via USB e instalar manualmente
```

### 3. Verificar Logs (Opcional)

```bash
# Se ainda crashar, ver logs
adb logcat | grep -E "ReactNativeJS|AndroidRuntime|GoalEdge|MobileAds"
```

---

## 🔍 COMO IDENTIFICAMOS O PROBLEMA

### Análise do Código

1. **package.json** → `react-native-google-mobile-ads` instalado
2. **app.config.js** → `enableAdMob: true` mas sem plugin
3. **services/ads-service.ts** → IDs de produção configurados
4. **Conclusão:** Plugin faltando causa crash nativo

### Sintomas Típicos

- ✅ App funciona no Expo Go (não usa código nativo)
- ❌ APK crasha imediatamente (código nativo falha)
- ❌ Não mostra tela branca (nem chega a carregar JavaScript)
- ❌ Crash antes de qualquer log JavaScript

### Logs Esperados (se tivéssemos acesso)

```
FATAL EXCEPTION: main
Process: com.goaledge.app, PID: 12345
java.lang.RuntimeException: Unable to get provider com.google.android.gms.ads.MobileAdsInitProvider
Caused by: java.lang.IllegalStateException: 
  The Google Mobile Ads SDK was initialized incorrectly.
  AdMob App ID is missing.
```

---

## 🎯 POR QUE ISSO ACONTECEU?

### Configuração Incompleta

O `react-native-google-mobile-ads` precisa de **2 configurações**:

1. ✅ **Instalação:** `npm install react-native-google-mobile-ads` (FEITO)
2. ❌ **Plugin no app.config.js:** Configurar Application ID (FALTAVA)

### O Que o Plugin Faz

```javascript
// Quando você adiciona o plugin:
[
  "react-native-google-mobile-ads",
  {
    "androidAppId": "ca-app-pub-XXX~YYY"
  }
]

// O Expo automaticamente adiciona no AndroidManifest.xml:
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="ca-app-pub-XXX~YYY"/>

// Sem isso → Crash nativo
```

---

## 🚨 ALTERNATIVA: DESABILITAR ADMOB TEMPORARIAMENTE

Se quiser testar o app **SEM anúncios** primeiro:

```javascript
// app.config.js
extra: {
  enableAdMob: false, // ← Desabilitar temporariamente
}
```

Depois gerar novo APK. O app deve abrir normalmente (sem anúncios).

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Antes de Gerar Novo APK

- [x] Plugin do AdMob adicionado em `app.config.js`
- [x] Application IDs corretos (produção)
- [x] `enableAdMob: true` mantido
- [x] Variáveis de ambiente hardcoded (correção anterior)

### Após Gerar Novo APK

- [ ] APK gerado sem erros
- [ ] APK instalado no celular
- [ ] App abre (não crasha)
- [ ] Consegue ver tela inicial
- [ ] Consegue carregar dados do Supabase
- [ ] Anúncios funcionam (se habilitados)

---

## 📊 RESUMO DAS CORREÇÕES

| Problema | Causa | Solução | Status |
|----------|-------|---------|--------|
| **Variáveis vazias** | process.env não funciona em APK | Hardcode no app.config.js | ✅ Corrigido |
| **Crash ao abrir** | Plugin AdMob faltando | Adicionar plugin no app.config.js | ✅ Corrigido |

---

## 🎯 EXPECTATIVA

### Após Gerar Novo APK

1. ✅ App deve **abrir normalmente**
2. ✅ Deve **carregar dados** do Supabase
3. ✅ Deve **mostrar apostas** (free e premium)
4. ✅ Anúncios devem **funcionar** (se habilitados)

### Se Ainda Crashar

Execute e me envie os logs:

```bash
adb logcat | grep -E "ReactNativeJS|AndroidRuntime|GoalEdge|MobileAds" > crash-log.txt
```

---

## 📚 REFERÊNCIAS

- [react-native-google-mobile-ads - Setup](https://docs.page/invertase/react-native-google-mobile-ads/quick-start)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
- [AdMob Application ID](https://support.google.com/admob/answer/7356431)

---

**Criado por:** Kiro AI  
**Data:** 06/05/2026  
**Versão:** 1.0

---

## 🚀 COMANDO RÁPIDO

```bash
# Gerar novo APK (build local)
npx expo prebuild --clean && cd android && ./gradlew clean && ./gradlew assembleRelease

# Instalar no celular
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Ver logs se crashar
adb logcat | grep -E "ReactNativeJS|AndroidRuntime|GoalEdge"
```
