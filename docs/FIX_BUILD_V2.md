# 🔧 FIX v2: Erro de Build Gradle - Solução com Plugin Expo

**Data:** 06/05/2026  
**Status:** ✅ IMPLEMENTADO  
**Commit:** `2c07faa`  
**Versão:** 2.0

---

## 🐛 PROBLEMA ANTERIOR

### Tentativa 1: Script de Patch (❌ Falhou)
- Criamos `scripts/patch-android-build.sh`
- Configuramos `prebuildCommand` no `eas.json`
- **Problema:** `prebuildCommand` executa ANTES do diretório `android/` ser gerado
- **Resultado:** Script não encontrava o arquivo `build.gradle`

### Erro Observado
```
Build falhou em ~1.5 minutos
Erro: android/app/build.gradle não encontrado
```

---

## ✅ SOLUÇÃO v2: Plugin Expo

### Abordagem
Usar um **Config Plugin do Expo** que modifica o `build.gradle` durante o processo de prebuild, quando o arquivo já existe.

### Arquivos Criados

#### 1. `plugins/withFixedFrescoVersion.js`
```javascript
const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Plugin para corrigir a versão do Fresco no build.gradle
 * Substitui ${expoLibs.versions.fresco.get()} por versão fixa 3.1.3
 */
const withFixedFrescoVersion = (config) => {
  return withAppBuildGradle(config, (config) => {
    const { modResults } = config;
    
    // Substituir todas as ocorrências de ${expoLibs.versions.fresco.get()} por 3.1.3
    modResults.contents = modResults.contents.replace(
      /\$\{expoLibs\.versions\.fresco\.get\(\)\}/g,
      '3.1.3'
    );
    
    return config;
  });
};

module.exports = withFixedFrescoVersion;
```

**O que faz:**
- Usa a API oficial de Config Plugins do Expo
- Modifica `android/app/build.gradle` durante o prebuild
- Substitui todas as ocorrências de `${expoLibs.versions.fresco.get()}` por `3.1.3`
- Executa no momento certo (quando o arquivo já existe)

#### 2. `app.json` (atualizado)
```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-web-browser",
      "./plugins/withFixedFrescoVersion"
    ]
  }
}
```

**Mudança:**
- Adicionado `"./plugins/withFixedFrescoVersion"` na lista de plugins
- Plugin será executado automaticamente durante o prebuild

---

## 🔄 FLUXO DE BUILD ATUALIZADO

```
┌─────────────────────────────────────────────────────────────┐
│  1. EAS Build inicia                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Instala dependências (npm install)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Executa prebuild (expo prebuild)                        │
│     - Gera diretório android/                               │
│     - Gera android/app/build.gradle                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Executa Config Plugins                                  │
│     - withFixedFrescoVersion modifica build.gradle          │
│     - Substitui expoLibs por versão fixa (3.1.3)            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Build Gradle continua normalmente                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  6. AAB/APK gerado com sucesso                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 VERSÃO DO FRESCO

**Versão escolhida:** `3.1.3`

**Por quê?**
- ✅ Compatível com React Native 0.81.5
- ✅ Compatível com Expo SDK 54
- ✅ Versão estável e testada
- ✅ Suporta GIF, WebP e WebP animado

**Dependências afetadas:**
```groovy
com.facebook.fresco:animated-gif:3.1.3
com.facebook.fresco:webpsupport:3.1.3
com.facebook.fresco:animated-webp:3.1.3
```

---

## 🧪 TESTE

### Como testar localmente
```bash
# 1. Limpar build anterior
rm -rf android/

# 2. Executar prebuild com plugin
npx expo prebuild --platform android --clean

# 3. Verificar se o patch foi aplicado
cat android/app/build.gradle | grep "fresco"

# Deve mostrar:
# implementation("com.facebook.fresco:animated-gif:3.1.3")
# implementation("com.facebook.fresco:webpsupport:3.1.3")
# implementation("com.facebook.fresco:animated-webp:3.1.3")
```

### Como testar no EAS
```bash
# Fazer commit e push (já feito)
git add .
git commit -m "fix: Usar plugin Expo para corrigir Fresco"
git push origin main

# Acompanhar build
# https://github.com/Lucas-BritoDev/GoalEdge/actions
```

---

## 📊 RESULTADO ESPERADO

### Antes (❌ Falha em 1.5 min)
```
[1 min] Status: ERRORED
❌ Build falhou com status: ERRORED
📋 Detalhes: prebuildCommand failed
⚠️ android/app/build.gradle não encontrado
```

### Depois (✅ Sucesso em 25 min)
```
[25 min] Status: FINISHED
✅ Build concluído com sucesso!
📦 AAB disponível para download
📱 APK disponível para download
```

---

## 🔍 VANTAGENS DO PLUGIN

### vs Script de Patch
| Aspecto | Script | Plugin |
|---------|--------|--------|
| Timing | ❌ Antes do prebuild | ✅ Durante o prebuild |
| Arquivo existe? | ❌ Não | ✅ Sim |
| API oficial | ❌ Não | ✅ Sim |
| Manutenção | ❌ Complexa | ✅ Simples |
| Confiabilidade | ❌ Baixa | ✅ Alta |

### Benefícios
- ✅ Usa API oficial do Expo
- ✅ Executa no momento certo
- ✅ Mais confiável e previsível
- ✅ Fácil de manter e debugar
- ✅ Funciona em qualquer ambiente

---

## 🔍 TROUBLESHOOTING

### Erro: "Plugin not found"
**Causa:** Arquivo `plugins/withFixedFrescoVersion.js` não existe  
**Solução:** Verificar se o arquivo foi commitado corretamente

### Erro: "Cannot find module '@expo/config-plugins'"
**Causa:** Dependência não instalada  
**Solução:** Já está incluída no Expo SDK 54, não precisa instalar

### Build ainda falha
**Causa:** Outro erro não relacionado ao Fresco  
**Solução:** Verificar logs completos em:
```
https://expo.dev/accounts/luck1993/projects/goaledge/builds/[BUILD_ID]
```

### Plugin não está sendo executado
**Causa:** Plugin não está na lista do `app.json`  
**Solução:** Verificar se está em `expo.plugins`

---

## 📚 REFERÊNCIAS

### Documentação
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
- [withAppBuildGradle](https://docs.expo.dev/config-plugins/plugins-and-mods/#android-mods)
- [Creating Config Plugins](https://docs.expo.dev/config-plugins/development-and-debugging/)

### Exemplos
- [Expo Config Plugins Examples](https://github.com/expo/config-plugins)
- [Custom Native Code](https://docs.expo.dev/workflow/customizing/)

---

## ✅ CHECKLIST

Antes de fazer novo build:

- [x] Plugin `withFixedFrescoVersion.js` criado
- [x] `app.json` atualizado com plugin
- [x] Commit e push realizados
- [x] Pipeline CI/CD acionado
- [ ] Build AAB concluído com sucesso
- [ ] Build APK concluído com sucesso
- [ ] Artefatos disponíveis no GitHub

---

## 🎯 PRÓXIMOS PASSOS

1. ⏳ **Aguardar conclusão do build** (25-35 minutos)
2. ✅ **Verificar se o plugin funcionou** (logs do EAS)
3. 📥 **Baixar AAB e APK** (GitHub Artifacts)
4. 🧪 **Testar APK em dispositivo**
5. 🚀 **Publicar na Play Store**

---

## 📝 NOTAS

### Por que Config Plugin é melhor?
- Expo recomenda usar Config Plugins para modificações nativas
- Plugins são executados durante o prebuild, quando os arquivos existem
- API oficial e bem documentada
- Mais confiável que scripts externos

### Alternativas consideradas
1. ❌ Script de patch com `prebuildCommand` - Timing errado
2. ❌ Script de patch com `postinstall` - Não funciona no EAS
3. ✅ Config Plugin - Solução oficial e recomendada

---

## 🔄 HISTÓRICO DE VERSÕES

### v1.0 (❌ Falhou)
- Script de patch com `prebuildCommand`
- Problema: Executava antes do arquivo existir

### v2.0 (✅ Atual)
- Config Plugin do Expo
- Executa durante o prebuild
- Usa API oficial

---

**Status:** ✅ IMPLEMENTADO  
**Próximo build:** Deve funcionar corretamente  
**Tempo estimado:** 25-35 minutos  
**Data:** 06/05/2026  
**Desenvolvido por:** Kiro AI
