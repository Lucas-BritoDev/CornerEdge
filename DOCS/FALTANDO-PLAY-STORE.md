# 🚀 O que Falta para Publicar na Play Store

**Versão:** 1.0.0  
**Data:** 2024  
**Status:** 🟢 95% Completo  
**Tempo Estimado:** 8-12 dias de trabalho

---

## 🔴 CRÍTICO - BLOQUEADORES

### 1. **Monetização - Google AdMob** ❌
**Tempo:** 2-3 dias  
**Prioridade:** 🔴 MÁXIMA

#### O que fazer:
```bash
npm install react-native-google-mobile-ads
# OU para Expo:
npx expo install expo-ads-facebook
```

#### Passos:
1. Criar conta no [Google AdMob](https://admob.google.com)
2. Obter App ID e Unit IDs
3. Criar `services/ads.ts`
4. Criar componente `AdBanner.tsx`
5. Adicionar banner no Dashboard (apenas Free)
6. Adicionar interstitials após tarefas (apenas Free)
7. Testar em modo de teste

**Arquivos a criar:**
- `services/ads.ts`
- `components/AdBanner.tsx`
- Modificar `app/(tabs)/index.tsx` para mostrar anúncios

---

### 2. **In-App Purchase Real** ⚠️
**Tempo:** 2-3 dias  
**Prioridade:** 🔴 MÁXIMA

#### O que fazer:
```bash
npx expo install expo-in-app-purchases
```

#### Passos:
1. Configurar produto no Google Play Console
2. Atualizar `stores/premium-store.tsx` com IAP real
3. Implementar verificação de assinatura
4. Implementar restore purchases
5. Testar em sandbox

**Arquivo a modificar:**
- `stores/premium-store.tsx` (substituir mock)

---

## 🟡 OBRIGATÓRIO - PLAY STORE

### 3. **Política de Privacidade** ❌
**Tempo:** 1 dia  
**Obrigatório:** ✅ SIM

#### O que fazer:
1. Criar arquivo HTML/MD com política
2. Hostear em URL pública (GitHub Pages, Netlify, etc.)
3. Adicionar link no `app.json`:
```json
{
  "expo": {
    "privacy": "https://seudominio.com/privacy-policy"
  }
}
```
4. Adicionar link nas Settings do app

**Conteúdo mínimo:**
- O que o app coleta (dados locais apenas)
- Como usa os dados
- Não compartilha com terceiros
- Direitos do usuário (LGPD)
- Contato do desenvolvedor

---

### 4. **Assets para Play Store** ⚠️
**Tempo:** 2-3 dias  
**Obrigatório:** ✅ SIM

#### Assets necessários:

| Asset | Tamanho | Formato | Obrigatório |
|-------|---------|---------|-------------|
| Ícone Play Store | 512x512px | PNG (sem transparência) | ✅ SIM |
| Feature Graphic | 1024x500px | PNG/JPG | ✅ SIM |
| Screenshots | Mín. 2, ideal 8 | 1080x1920px+ | ✅ SIM |
| Ícone Adaptativo | 1024x1024px | PNG | ✅ SIM |

#### Screenshots sugeridos:
1. Dashboard principal
2. Lista de Tarefas
3. Ranking/Pódium
4. Histórico/Timeline
5. Configurações
6. (Opcional) Premium features
7. (Opcional) Dark Mode
8. (Opcional) Gamificação

---

### 5. **Metadata do App** ⚠️
**Tempo:** 1 dia  
**Obrigatório:** ✅ SIM

#### Informações necessárias:

**Título curto:** (máx. 50 caracteres)
```
Casa Organizada
```

**Descrição curta:** (máx. 80 caracteres)
```
Organize tarefas domésticas com gamificação e trabalho em equipe
```

**Descrição completa:** (máx. 4000 caracteres)
```
[Escrever descrição detalhada do app]

Principais funcionalidades:
- Organize tarefas domésticas
- Sistema de pontos e ranking
- Gamificação com badges e streaks
- Notificações inteligentes
- E muito mais...
```

**Categoria:** Produtividade ou Estilo de vida  
**Classificação:** Todos  
**Email de contato:** seu-email@exemplo.com

---

### 6. **Configuração app.json** ⚠️
**Tempo:** 1 dia  
**Prioridade:** 🟡 ALTA

#### Adicionar ao `app.json`:
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "package": "com.householdmanager.app",
      "versionCode": 1,
      "permissions": [
        "POST_NOTIFICATIONS",
        "SCHEDULE_EXACT_ALARM",
        "VIBRATE"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#6366F1"
      }
    },
    "privacy": "https://seudominio.com/privacy-policy",
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/images/notification-icon.png",
        "color": "#6366F1"
      }]
    ]
  }
}
```

---

## 🟢 RECOMENDADO - QUALIDADE

### 7. **Testes Finais** ⚠️
**Tempo:** 3-5 dias  
**Prioridade:** 🟢 MÉDIA

#### Checklist de testes:
- [ ] Onboarding completo
- [ ] CRUD usuários
- [ ] CRUD tarefas
- [ ] Completar tarefa
- [ ] Ver ranking
- [ ] Ver histórico
- [ ] Notificações funcionando
- [ ] IAP em sandbox
- [ ] AdMob em modo teste
- [ ] Backup/restore (Premium)
- [ ] Performance com muitos dados
- [ ] Diferentes tamanhos de tela

---

### 8. **Configuração EAS Build** ⚠️
**Tempo:** 1 dia  
**Prioridade:** 🟢 MÉDIA

#### Passos:
1. Instalar EAS CLI: `npm install -g eas-cli`
2. Fazer login: `eas login`
3. Configurar projeto: `eas build:configure`
4. Build Android: `eas build --platform android --profile production`

---

## 📋 CHECKLIST RÁPIDO

### Para Publicar (Mínimo):
- [ ] AdMob integrado e testado
- [ ] IAP real configurado e testado
- [ ] Privacy Policy criada e hospedada
- [ ] Ícone 512x512 criado
- [ ] Feature Graphic 1024x500 criado
- [ ] Mínimo 2 screenshots criados
- [ ] Metadata completo no Play Console
- [ ] app.json configurado
- [ ] Build de produção criado
- [ ] Testes básicos realizados

### Para Publicar com Qualidade:
Adicione:
- [ ] 8 screenshots profissionais
- [ ] Testes completos em dispositivo físico
- [ ] Dark Mode visual completo
- [ ] Error handling robusto
- [ ] Analytics/Crash reporting

---

## 💰 CUSTOS

| Item | Custo | Periodicidade |
|------|-------|---------------|
| Conta Google Play Developer | $25 USD | Uma vez |
| Hosting Privacy Policy | Gratuito | Contínuo |
| AdMob | Gratuito | - |
| **TOTAL** | **$25 USD** | **Uma vez** |

---

## ⏱️ CRONOGRAMA SUGERIDO

### Semana 1 (Monetização):
- **Dia 1-2:** AdMob (2-3 dias)
- **Dia 3-4:** IAP Real (2-3 dias)
- **Dia 5:** app.json + Permissões (1 dia)

### Semana 2 (Assets e Deploy):
- **Dia 6-7:** Assets Play Store (2-3 dias)
- **Dia 8:** Privacy Policy (1 dia)
- **Dia 9:** Testes Finais (1 dia)
- **Dia 10:** Build e Submissão (1 dia)

---

## 🎯 RESUMO EXECUTIVO

### O que JÁ TEMOS ✅:
- App 100% funcional
- Todas features do PRD (exceto AdMob)
- UX/UI polida
- Onboarding completo
- Gamificação completa
- Sistema Premium (UI)
- Notificações funcionando

### O que FALTA ❌:
1. **AdMob** - Monetização Free tier (2-3 dias)
2. **IAP Real** - Monetização Premium (2-3 dias)
3. **Privacy Policy** - Obrigatório Play Store (1 dia)
4. **Assets** - Obrigatório Play Store (2-3 dias)
5. **Metadata** - Obrigatório Play Store (1 dia)
6. **Configurações** - app.json completo (1 dia)

### Tempo Total: **8-12 dias** de trabalho focado

---

## ✅ CONCLUSÃO

O app está **95% pronto**. Após completar os 6 itens acima (principalmente monetização e obrigatórios da Play Store), estará **100% pronto para publicação**.

**Próximo passo recomendado:** Começar pela monetização (AdMob + IAP), pois são os itens mais técnicos e críticos.

---

**Última atualização:** 2024  
**Status:** 🟡 Pronto para finalização

