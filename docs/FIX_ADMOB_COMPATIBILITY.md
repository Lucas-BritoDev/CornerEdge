# 🔧 Correção: Incompatibilidade react-native-google-mobile-ads

## 🐛 Problema Identificado

**Erro:** Build falhou com erro de compilação Kotlin no pacote `react-native-google-mobile-ads`

```
Unresolved reference 'currentActivity'
Unresolved reference 'runOnUiThread'
```

**Causa:** Versão `^14.2.2` incompatível com:
- React Native 0.81.5
- Expo SDK 54

## ✅ Solução Aplicada

### Atualização de Versão

**Antes:**
```json
"react-native-google-mobile-ads": "^14.2.2"
```

**Depois:**
```json
"react-native-google-mobile-ads": "^15.4.0"
```

### Por que v15.4.0?

1. **Compatibilidade:** Versão mais recente compatível com Expo SDK 54
2. **Correções:** Inclui fixes para problemas de compilação Kotlin
3. **Estabilidade:** Versão estável e testada pela comunidade
4. **Suporte:** Mantém compatibilidade com React Native 0.81.x

## 📋 Próximos Passos

### 1. Atualizar Dependências Localmente

```bash
# Remover node_modules e lock files
rm -rf node_modules package-lock.json

# Reinstalar com a nova versão
npm install --legacy-peer-deps
```

### 2. Testar Localmente (Opcional)

```bash
# Verificar se não há erros de TypeScript
npx tsc --noEmit

# Executar testes
npm test
```

### 3. Commit e Push

```bash
git add package.json
git commit -m "fix: atualizar react-native-google-mobile-ads para v15.4.0

- Corrige erro de compilação Kotlin (currentActivity, runOnUiThread)
- Versão compatível com Expo SDK 54 e React Native 0.81.5
- Resolve build failure no EAS"
git push origin main
```

### 4. Aguardar Build no EAS

O pipeline CI/CD será executado automaticamente:

1. ✅ Testes e validação (5-10 min)
2. 🚀 Inicia build AAB (não aguarda)
3. 🚀 Inicia build APK (não aguarda)
4. ⏱️ Aguardar conclusão no Expo Dashboard (15-25 min)

### 5. Verificar Build no Expo Dashboard

1. Acesse: https://expo.dev
2. Vá para "Builds"
3. Aguarde status mudar para "FINISHED"
4. Baixe AAB e APK

## 🔍 Verificação de Sucesso

### Build Bem-Sucedido

✅ Status: `FINISHED`
✅ Artefatos disponíveis:
- `goaledge.aab` (para Play Store)
- `goaledge.apk` (para instalação direta)

### Se Ainda Falhar

Se o build ainda falhar após esta correção, considere:

#### Opção A: Remover AdMob Temporariamente

```bash
npm uninstall react-native-google-mobile-ads
```

Remover do código:
- Imports do AdMob
- Componentes de anúncios
- Configurações relacionadas

#### Opção B: Downgrade para Versão Conhecida

```bash
npm install react-native-google-mobile-ads@14.0.0 --legacy-peer-deps
```

#### Opção C: Atualizar Expo SDK

```bash
npx expo install expo@latest
npx expo install --fix
```

## 📊 Histórico de Versões

| Versão | Status | Notas |
|--------|--------|-------|
| 14.2.2 | ❌ Falhou | Erro de compilação Kotlin |
| 15.4.0 | ⏳ Testando | Versão compatível com Expo SDK 54 |

## 🔗 Referências

- [react-native-google-mobile-ads Releases](https://github.com/invertase/react-native-google-mobile-ads/releases)
- [Expo SDK 54 Compatibility](https://docs.expo.dev/versions/v54.0.0/)
- [React Native 0.81 Changelog](https://github.com/facebook/react-native/releases/tag/v0.81.0)

## 📝 Notas Adicionais

### Configuração do AdMob

Após build bem-sucedido, verifique se as configurações do AdMob estão corretas:

1. **Android:** `android/app/src/main/AndroidManifest.xml`
2. **App ID:** Configurado no Google AdMob Console
3. **Test Ads:** Usar IDs de teste durante desenvolvimento

### Monitoramento

Após publicação, monitore:
- Taxa de preenchimento de anúncios
- Receita por impressão (RPM)
- Crashes relacionados ao AdMob

---

**Data:** 2026-05-06  
**Status:** ✅ Correção aplicada  
**Próximo:** Aguardar build no EAS
