# 📱 Coletar Logs do Crash

**Objetivo:** Descobrir por que o app está crashando

---

## 🚀 Método 1: ADB Logcat (Recomendado)

### Pré-requisitos

- Dispositivo Android conectado via USB
- Depuração USB habilitada
- ADB instalado

### Passo a Passo

```bash
# 1. Verificar se dispositivo está conectado
adb devices

# Resultado esperado:
# List of devices attached
# ABC123XYZ    device

# 2. Limpar logs antigos
adb logcat -c

# 3. Iniciar captura de logs
adb logcat > crash_log.txt

# 4. Em outra janela/terminal, instalar e abrir o app
adb install -r goaledge.apk

# 5. Abrir o app no dispositivo
# O app vai crashar

# 6. Parar captura de logs (Ctrl+C)

# 7. Ver o arquivo crash_log.txt
```

### Filtrar Apenas Erros

```bash
# Ver apenas erros do GoalEdge
adb logcat | grep -i "goaledge\|crash\|fatal\|exception"

# Ou salvar em arquivo
adb logcat | grep -i "goaledge\|crash\|fatal\|exception" > crash_filtered.txt
```

---

## 🚀 Método 2: Build de Debug

### Gerar APK Debug no GitHub Actions

1. **Acesse:** https://github.com/luck1993/goaledge/actions
2. **Clique em:** "Android Debug Build"
3. **Clique em:** "Run workflow"
4. **Selecione:** branch `main`
5. **Clique em:** "Run workflow"
6. **Aguarde:** ~30 minutos
7. **Baixe:** goaledge-debug.apk

### Instalar e Ver Logs

```bash
# Instalar APK debug
adb install goaledge-debug.apk

# Ver logs em tempo real
adb logcat | grep -i "goaledge"

# Abrir o app no dispositivo
```

---

## 🚀 Método 3: Logcat no Android Studio

### Passo a Passo

1. Abra Android Studio
2. Menu: View → Tool Windows → Logcat
3. Conecte o dispositivo via USB
4. Selecione o dispositivo no dropdown
5. Instale e abra o app
6. Veja os logs na janela Logcat
7. Filtre por "goaledge" ou "crash"

---

## 🔍 O Que Procurar nos Logs

### Erros Comuns

#### 1. Variáveis de Ambiente

```
Error: EXPO_PUBLIC_SUPABASE_URL is not defined
Error: Cannot read property 'SUPABASE_URL' of undefined
```

**Solução:** Configurar variáveis no build

#### 2. AdMob

```
Error: AdMob App ID is missing
Error: com.google.android.gms.ads.MobileAds
```

**Solução:** Configurar App ID no AndroidManifest.xml

#### 3. Permissões

```
SecurityException: Permission denied
Error: INTERNET permission is missing
```

**Solução:** Adicionar permissões no AndroidManifest.xml

#### 4. Dependências Nativas

```
Error: Native module cannot be null
Error: Unable to resolve module
```

**Solução:** Reexecutar `npx expo prebuild`

#### 5. Hermes

```
Error: Hermes bytecode version mismatch
Error: Cannot read hermes bytecode
```

**Solução:** Desabilitar Hermes ou atualizar versão

---

## 📋 Checklist

Execute na ordem:

### 1. Habilitar Depuração USB

No dispositivo:
1. Configurações → Sobre o telefone
2. Toque 7x em "Número da versão"
3. Volte → Opções do desenvolvedor
4. Ative "Depuração USB"

### 2. Instalar ADB

**Windows:**
```bash
# Via Chocolatey
choco install adb

# Ou baixar: https://developer.android.com/studio/releases/platform-tools
```

**Verificar:**
```bash
adb version
```

### 3. Conectar Dispositivo

```bash
# Conectar via USB
adb devices

# Se não aparecer, autorize no dispositivo
```

### 4. Coletar Logs

```bash
# Método simples
adb logcat > crash_log.txt

# Abrir app e deixar crashar

# Ctrl+C para parar

# Ver arquivo crash_log.txt
```

---

## 💡 Dicas

### Salvar Logs Completos

```bash
# Todos os logs
adb logcat -d > crash_full.txt

# Apenas erros
adb logcat -d *:E > crash_errors.txt

# Últimas 500 linhas
adb logcat -d -t 500 > crash_recent.txt
```

### Limpar e Testar Novamente

```bash
# Desinstalar app
adb uninstall com.goaledge.app

# Limpar cache
adb shell pm clear com.goaledge.app

# Reinstalar
adb install goaledge.apk

# Ver logs
adb logcat -c
adb logcat | grep -i "goaledge"
```

### Procurar Palavras-Chave

```bash
# Procurar por erro específico
adb logcat | grep -i "supabase"
adb logcat | grep -i "admob"
adb logcat | grep -i "expo"
adb logcat | grep -i "react"
```

---

## 🎯 Próximos Passos

### Após Coletar Logs

1. **Abra o arquivo** `crash_log.txt`
2. **Procure por:**
   - `FATAL EXCEPTION`
   - `Error:`
   - `Exception:`
   - `Caused by:`
3. **Copie a mensagem de erro**
4. **Me envie para análise**

### Correções Comuns

Baseado no erro, vou te ajudar a:
- Configurar variáveis de ambiente
- Ajustar AndroidManifest.xml
- Desabilitar ProGuard/Hermes
- Corrigir dependências

---

## 📚 Recursos

- **ADB:** https://developer.android.com/studio/command-line/adb
- **Logcat:** https://developer.android.com/studio/command-line/logcat
- **Debugging:** https://reactnative.dev/docs/debugging

---

**Status:** ⏳ Aguardando logs  
**Próximo:** Analisar erro e corrigir
