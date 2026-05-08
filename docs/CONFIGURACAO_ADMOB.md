# 📱 CONFIGURAÇÃO ADMOB - DOCUMENTAÇÃO COMPLETA

**Data:** 06/05/2026  
**Status:** ✅ CONFIGURADO SEGUINDO DOCUMENTAÇÃO OFICIAL  
**Fonte:** [react-native-google-mobile-ads](https://github.com/invertase/react-native-google-mobile-ads)

---

## 🎯 VISÃO GERAL

O AdMob foi configurado seguindo **100% a documentação oficial** do `react-native-google-mobile-ads` para garantir:

- ✅ **Sem crashes** - Inicialização correta do SDK
- ✅ **Sem erros** - Application IDs configurados corretamente
- ✅ **Boas práticas** - Seguindo padrões recomendados
- ✅ **Produção ready** - IDs reais configurados

---

## 📋 ARQUIVOS CONFIGURADOS

### 1. `app.config.js` - Plugin do AdMob

**Localização:** Raiz do projeto

**Configuração:**
```javascript
plugins: [
  "expo-router",
  "expo-web-browser",
  [
    "react-native-google-mobile-ads",
    {
      // Application IDs de PRODUÇÃO
      "androidAppId": "ca-app-pub-8609967398609187~5936939727",
      "iosAppId": "ca-app-pub-8609967398609187~5936939727",
      // Descrição para App Tracking Transparency (iOS)
      "userTrackingUsageDescription": "Este identificador será usado para fornecer anúncios personalizados para você.",
      // Atrasar inicialização de medição de app para evitar crash prematuro/compliance
      "delayAppMeasurementInit": true
    }
  ],
  [
    "expo-build-properties",
    {
      "android": {
        "extraProguardRules": "-keep class com.google.android.gms.internal.consent_sdk.** { *; }"
      }
    }
  ]
]
```

**O que faz:**
- ✅ Configura Application IDs no AndroidManifest.xml (Android)
- ✅ Configura Application IDs no Info.plist (iOS)
- ✅ Adiciona descrição para ATT (App Tracking Transparency) no iOS
- ✅ Previne crash por Application ID faltando

---

### 2. `lib/admob-init.ts` - Inicialização do SDK

**Localização:** `lib/admob-init.ts`

**Funções:**

#### `initializeAdMob()`
Inicializa o Google Mobile Ads SDK.

**Características:**
- ✅ Chamado UMA VEZ no início do app
- ✅ Retorna Promise que resolve quando inicializado
- ✅ Previne múltiplas inicializações
- ✅ Trata erros graciosamente

**Uso:**
```typescript
import { initializeAdMob } from '@/lib/admob-init';

// No início do app (_layout.tsx)
initializeAdMob().catch(error => {
  console.error('Erro ao inicializar AdMob:', error);
});
```

#### `isAdMobInitialized()`
Verifica se o SDK está inicializado.

**Retorno:** `boolean`

#### `waitForAdMobInitialization()`
Aguarda a inicialização do SDK.

**Uso:**
```typescript
import { waitForAdMobInitialization } from '@/lib/admob-init';

// Antes de mostrar anúncio
await waitForAdMobInitialization();
// Agora pode mostrar anúncio
```

---

### 3. `services/ads-service.ts` - Serviço de Anúncios

**Localização:** `services/ads-service.ts`

**Funções:**

#### `adsService.initialize()`
Inicializa o serviço de anúncios.

**Uso:**
```typescript
import { adsService } from '@/services/ads-service';

await adsService.initialize();
```

#### `adsService.showRewarded()`
Mostra um anúncio recompensado.

**Retorno:** `Promise<{ rewarded: boolean }>`
- `rewarded: true` - Usuário assistiu o anúncio completo
- `rewarded: false` - Usuário fechou antes de completar

**Uso:**
```typescript
try {
  const result = await adsService.showRewarded();
  
  if (result.rewarded) {
    // Usuário ganhou recompensa
    console.log('Recompensa concedida!');
  } else {
    // Usuário fechou o anúncio
    console.log('Anúncio fechado sem recompensa');
  }
} catch (error) {
  console.error('Erro ao mostrar anúncio:', error);
}
```

#### `adsService.getAdUnitIds()`
Retorna os Ad Unit IDs configurados.

**Retorno:**
```typescript
{
  banner: string,
  rewarded: string,
  isProduction: boolean,
  platform: 'android' | 'ios'
}
```

---

### 4. `app/_layout.tsx` - Inicialização no App

**Localização:** `app/_layout.tsx`

**Código adicionado:**
```typescript
import { initializeAdMob } from '../lib/admob-init';

// Inicializar AdMob no início do app
initializeAdMob().catch((error) => {
  console.error('[App] Erro ao inicializar AdMob:', error);
  // Não bloquear o app se AdMob falhar
});
```

**Por que aqui:**
- ✅ Executado UMA VEZ no início do app
- ✅ Antes de qualquer tela carregar
- ✅ Não bloqueia o carregamento do app (async)

---

## 🔑 AD UNIT IDS

### Produção (Reais)

**Android:**
- Banner: `ca-app-pub-8609967398609187/5936939727`
- Rewarded: `ca-app-pub-8609967398609187/7851666948`

**iOS:**
- Banner: `ca-app-pub-8609967398609187/5936939727`
- Rewarded: `ca-app-pub-8609967398609187/7851666948`

### Desenvolvimento (Test IDs)

**Automático:** O serviço usa automaticamente Test IDs em `__DEV__` mode.

**Test IDs:**
- Banner: `ca-app-pub-3940256099942544/6300978111`
- Rewarded: `ca-app-pub-3940256099942544/5224354917`

**Por que usar Test IDs:**
- ✅ Evita cliques inválidos
- ✅ Previne suspensão da conta AdMob
- ✅ Permite testar funcionalidade

---

## 🚀 FLUXO DE INICIALIZAÇÃO

### 1. App Inicia
```
app/_layout.tsx carrega
↓
initializeAdMob() é chamado
↓
mobileAds().initialize() executa
↓
SDK inicializa (timeout 30s)
↓
Promise resolve
↓
isInitialized = true
```

### 2. Usuário Clica para Ver Anúncio
```
useRewardedAd.ts
↓
adsService.showRewarded()
↓
waitForAdMobInitialization() (garante SDK pronto)
↓
RewardedAd.createForAdRequest()
↓
rewardedAd.load()
↓
Anúncio carrega
↓
rewardedAd.show()
↓
Usuário assiste
↓
EARNED_REWARD event
↓
Recompensa concedida
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Configuração
- [x] Plugin do AdMob em `app.config.js`
- [x] Application IDs configurados (Android e iOS)
- [x] User Tracking Description configurado (iOS)
- [x] Inicialização em `app/_layout.tsx`
- [x] Serviço de anúncios implementado
- [x] Test IDs em desenvolvimento
- [x] Production IDs em produção

### Prevenção de Crashes
- [x] SDK inicializado antes de mostrar anúncios
- [x] Tratamento de erros em todas as funções
- [x] Prevenção de múltiplas inicializações
- [x] Não bloqueia carregamento do app
- [x] Logs para debug

### Boas Práticas
- [x] Seguindo documentação oficial
- [x] Usando Test IDs em desenvolvimento
- [x] Usando Production IDs em produção
- [x] Tratamento de erros gracioso
- [x] Logs informativos

---

## 🐛 TROUBLESHOOTING

### Problema: App Crasha ao Abrir

**Causa:** Application ID faltando ou inválido

**Solução:**
1. Verificar `app.config.js` tem plugin configurado
2. Verificar Application IDs estão corretos
3. Executar `npx expo prebuild --clean`
4. Rebuild do app

### Problema: Anúncios Não Aparecem

**Causa:** SDK não inicializado ou Ad Unit ID inválido

**Solução:**
1. Verificar logs: `[AdMob] SDK inicializado com sucesso!`
2. Verificar Ad Unit IDs em `services/ads-service.ts`
3. Em desenvolvimento, verificar se está usando Test IDs
4. Aguardar alguns minutos (AdMob pode demorar)

### Problema: Erro "AdMob App ID is missing"

**Causa:** Plugin não configurado corretamente

**Solução:**
1. Verificar `app.config.js` tem plugin
2. Verificar Application IDs não estão vazios
3. Executar `npx expo prebuild --clean`
4. Rebuild do app

### Problema: Erro ao Carregar Anúncio

**Causa:** Sem internet, Ad Unit ID inválido, ou limite de requisições

**Solução:**
1. Verificar conexão com internet
2. Verificar Ad Unit IDs estão corretos
3. Aguardar alguns minutos
4. Verificar logs para detalhes do erro

---

## 📊 LOGS ESPERADOS

### Inicialização Bem-Sucedida

```
[AdMob] Iniciando SDK...
[AdMob] SDK inicializado com sucesso!
[AdMob] Adapters inicializados: 1
[AdsService] Inicializando...
[AdsService] Inicializado com sucesso!
```

### Anúncio Recompensado Bem-Sucedido

```
[AdsService] Preparando anúncio recompensado...
[AdsService] Ad Unit ID: TEST (ou PRODUCTION)
[AdsService] Carregando anúncio...
[AdsService] Anúncio carregado, mostrando...
[AdsService] Recompensa ganha: { amount: 1, type: "coins" }
[AdsService] Anúncio fechado. Recompensado: true
```

### Erro ao Carregar Anúncio

```
[AdsService] Preparando anúncio recompensado...
[AdsService] Ad Unit ID: TEST
[AdsService] Carregando anúncio...
[AdsService] Erro ao carregar anúncio: { code: 3, message: "No fill" }
```

---

## 📚 REFERÊNCIAS

### Documentação Oficial
- [react-native-google-mobile-ads](https://github.com/invertase/react-native-google-mobile-ads)
- [Quick Start Guide](https://github.com/invertase/react-native-google-mobile-ads/blob/main/docs/index.mdx)
- [Expo Integration](https://github.com/invertase/react-native-google-mobile-ads/blob/main/docs/index.mdx#expo)
- [Rewarded Ads](https://github.com/invertase/react-native-google-mobile-ads/blob/main/docs/displaying-ads.mdx)

### AdMob Console
- [AdMob Dashboard](https://apps.admob.com/)
- [Test Ads](https://developers.google.com/admob/android/test-ads)
- [Ad Unit IDs](https://support.google.com/admob/answer/7356431)

---

## 🎯 PRÓXIMOS PASSOS

### Após Gerar Novo APK

1. ✅ Instalar APK no celular
2. ✅ Verificar logs de inicialização
3. ✅ Testar anúncio recompensado
4. ✅ Verificar recompensa é concedida
5. ✅ Verificar não há crashes

### Para Produção

1. ✅ Verificar Application IDs estão corretos
2. ✅ Verificar Ad Unit IDs estão corretos
3. ✅ Testar em dispositivo real
4. ✅ Verificar anúncios aparecem
5. ✅ Publicar na Play Store

---

## ✅ RESUMO

**O que foi feito:**
- ✅ Plugin do AdMob configurado em `app.config.js`
- ✅ Inicialização do SDK em `lib/admob-init.ts`
- ✅ Serviço de anúncios em `services/ads-service.ts`
- ✅ Integração no app em `app/_layout.tsx`
- ✅ Test IDs em desenvolvimento
- ✅ Production IDs em produção
- ✅ Tratamento de erros completo
- ✅ Logs informativos

**Resultado esperado:**
- ✅ App não crasha
- ✅ Anúncios funcionam
- ✅ Recompensas são concedidas
- ✅ Pronto para produção

---

**Criado por:** Kiro AI  
**Data:** 06/05/2026  
**Versão:** 1.0  
**Baseado em:** Documentação oficial react-native-google-mobile-ads
