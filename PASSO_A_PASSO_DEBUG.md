# 🔍 Passo a Passo: Descobrir Por Que o App Crasha

**Situação:** APK e AAB gerados com sucesso, mas app fecha ao abrir  
**Objetivo:** Coletar logs do crash para identificar o problema

---

## 📱 Método 1: ADB Logcat (Mais Rápido)

### Pré-requisitos

1. **Dispositivo Android** conectado via USB
2. **Depuração USB** habilitada
3. **ADB** instalado no PC

### Habilitar Depuração USB

1. No dispositivo: **Configurações** → **Sobre o telefone**
2. Toque **7 vezes** em "Número da versão"
3. Volte → **Opções do desenvolvedor**
4. Ative **"Depuração USB"**
5. Conecte o cabo USB ao PC
6. Autorize a depuração no dispositivo

### Instalar ADB (Windows)

```powershell
# Via Chocolatey (recomendado)
choco install adb

# Ou baixar manualmente:
# https://developer.android.com/studio/releases/platform-tools
```

### Verificar Conexão

```bash
# Verificar se dispositivo está conectado
adb devices

# Resultado esperado:
# List of devices attached
# ABC123XYZ    device
```

### Coletar Logs do Crash

```bash
# 1. Limpar logs antigos
adb logcat -c

# 2. Iniciar captura (deixe rodando)
adb logcat > crash_log.txt

# 3. Em outra janela/terminal, instalar o APK
adb install -r goaledge.apk

# 4. Abrir o app no dispositivo
# O app vai crashar

# 5. Voltar ao terminal e parar a captura (Ctrl+C)

# 6. Abrir o arquivo crash_log.txt
```

### Filtrar Apenas Erros

```bash
# Ver apenas erros relevantes
adb logcat | findstr /i "goaledge crash error exception fatal"

# Ou salvar em arquivo
adb logcat | findstr /i "goaledge crash error exception fatal" > crash_filtered.txt
```

---

## 📱 Método 2: Logcat Simplificado

Se o método acima for complicado, use este:

```bash
# Comando único que captura tudo
adb logcat -d > crash_full.txt

# Depois abra crash_full.txt e procure por:
# - "FATAL EXCEPTION"
# - "AndroidRuntime"
# - "Caused by:"
```

---

## 🔍 O Que Procurar nos Logs

### Padrões Comuns de Erro

#### 1. Variáveis de Ambiente

```
Error: EXPO_PUBLIC_SUPABASE_URL is not defined
Cannot read property 'SUPABASE_URL' of undefined
```

#### 2. AdMob

```
Error: AdMob App ID is missing
com.google.android.gms.ads.MobileAds
APPLICATION_ID not found
```

#### 3. Crash Genérico

```
FATAL EXCEPTION: main
Process: com.goaledge.app, PID: 12345
java.lang.RuntimeException: Unable to start activity
```

---

## 📋 Exemplo de Log de Crash

Procure por algo assim:

```
--------- beginning of crash
E/AndroidRuntime(12345): FATAL EXCEPTION: main
E/AndroidRuntime(12345): Process: com.goaledge.app, PID: 12345
E/AndroidRuntime(12345): java.lang.RuntimeException: Unable to start activity
E/AndroidRuntime(12345):     at android.app.ActivityThread.performLaunchActivity
E/AndroidRuntime(12345): Caused by: java.lang.NullPointerException
E/AndroidRuntime(12345):     at com.goaledge.app.MainActivity.onCreate
```

**Copie tudo entre "FATAL EXCEPTION" e o final do stack trace!**

---

## 🚀 Correções Rápidas (Enquanto Aguarda Logs)

### Correção 1: Criar app.config.js

Crie o arquivo `app.config.js` na raiz do projeto:

```javascript
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
      jsEngine: "jsc"  // Usar JSC em vez de Hermes
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
      // Variáveis de ambiente
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      apiFootballKey: process.env.APIFOOTBALL_KEY
    }
  }
};
```

### Correção 2: Atualizar services/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Pegar variáveis do app.config.js
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

// Validar antes de criar cliente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase config missing!');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseAnonKey ? 'exists' : 'missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Correção 3: Commit e Rebuild

```bash
# Adicionar arquivos
git add app.config.js services/supabase.ts

# Commit
git commit -m "fix: adicionar app.config.js para variáveis de ambiente"

# Push
git push origin main

# Aguardar novo build (~45 min)
```

---

## 📊 Checklist

Marque conforme executa:

- [ ] Habilitar Depuração USB no dispositivo
- [ ] Instalar ADB no PC
- [ ] Conectar dispositivo via USB
- [ ] Verificar conexão: `adb devices`
- [ ] Baixar APK do GitHub Actions
- [ ] Limpar logs: `adb logcat -c`
- [ ] Iniciar captura: `adb logcat > crash_log.txt`
- [ ] Instalar APK: `adb install goaledge.apk`
- [ ] Abrir app no dispositivo (vai crashar)
- [ ] Parar captura (Ctrl+C)
- [ ] Abrir crash_log.txt
- [ ] Procurar por "FATAL EXCEPTION"
- [ ] Copiar stack trace completo
- [ ] Enviar para análise

---

## 💡 Dicas

### Se ADB Não Funcionar

1. **Reinstalar drivers USB:**
   - Windows: Instalar drivers do fabricante
   - Ou usar: https://adb.clockworkmod.com/

2. **Modo de Transferência:**
   - Ao conectar USB, selecione "Transferência de arquivos"
   - Não use "Apenas carregar"

3. **Autorizar Depuração:**
   - Popup aparece no dispositivo
   - Marque "Sempre permitir deste computador"
   - Clique em "OK"

### Comandos Úteis

```bash
# Ver dispositivos conectados
adb devices

# Desinstalar app
adb uninstall com.goaledge.app

# Limpar cache do app
adb shell pm clear com.goaledge.app

# Ver apenas erros
adb logcat *:E

# Ver logs de um app específico
adb logcat | findstr "com.goaledge.app"
```

---

## 🎯 Próximos Passos

### Após Coletar Logs

1. **Abra crash_log.txt**
2. **Procure por "FATAL EXCEPTION"**
3. **Copie todo o stack trace**
4. **Me envie para análise**

### Enquanto Isso

Aplique as **Correções Rápidas** acima e faça um novo build.

---

**Status:** ⏳ Aguardando logs do crash  
**Tempo:** 5-10 minutos para coletar logs  
**Próximo:** Analisar erro e aplicar correção específica
