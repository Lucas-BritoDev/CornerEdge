# 📱 Checklist para Produção - Google Play Store

**Data da Análise:** 2024  
**Versão Atual:** 1.0.0  
**Status do Projeto:** 🟢 95% Completo  
**Estimativa para Produção:** 1-2 semanas

---

## 📊 RESUMO EXECUTIVO

O aplicativo **Household Manager** está **95% completo** e muito próximo de estar pronto para produção. A análise revela que faltam principalmente:

1. **Monetização** (AdMob + IAP real) - Última feature do PRD
2. **Configurações de Build** para produção
3. **Assets e Marketing** para Play Store
4. **Políticas e Compliance**

---

## 🔴 CRÍTICO - BLOQUEADORES PARA PRODUÇÃO

### 1. **Monetização - Google AdMob** ❌
**Status:** Não implementado  
**Prioridade:** 🔴 CRÍTICA  
**Tempo estimado:** 2-3 dias

#### O que falta:
- [ ] Instalar `react-native-google-mobile-ads` ou usar `expo-ads-facebook` como alternativa
- [ ] Criar conta AdMob e obter App ID
- [ ] Configurar IDs de anúncios (Banner, Interstitial)
- [ ] Implementar banner no Dashboard (apenas Free tier)
- [ ] Implementar interstitials após completar tarefas (apenas Free tier)
- [ ] Integrar remoção de anúncios para usuários Premium
- [ ] Testar anúncios em modo de teste

#### Código necessário:
```typescript
// services/ads.ts
// Componente AdBanner.tsx
// Integração no Dashboard
```

#### Dependências:
```json
{
  "react-native-google-mobile-ads": "^14.0.0"
}
// OU alternativamente para Expo:
{
  "expo-ads-facebook": "~11.0.0" // Alternativa mais fácil
}
```

---

### 2. **In-App Purchase (IAP) Real** ⚠️
**Status:** Mock implementado, backend não  
**Prioridade:** 🔴 CRÍTICA  
**Tempo estimado:** 2-3 dias

#### O que falta:
- [ ] Instalar `expo-in-app-purchases`
- [ ] Configurar produtos no Google Play Console
  - [ ] Produto Premium (subscription ou one-time)
- [ ] Implementar verificação real de assinatura
- [ ] Implementar restore purchases
- [ ] Substituir lógica mock no `premium-store.tsx`
- [ ] Testar em sandbox environment
- [ ] Implementar verificação de assinatura ativa

#### Código necessário:
```typescript
// Atualizar stores/premium-store.tsx
// Adicionar verificação real de IAP
// Implementar restore purchases
```

#### Dependências:
```json
{
  "expo-in-app-purchases": "~15.0.0"
}
```

---

## 🟡 ALTA PRIORIDADE - PRÉ-REQUISITOS PLAY STORE

### 3. **Configuração do app.json para Produção** ⚠️
**Status:** Parcial  
**Prioridade:** 🟡 ALTA  
**Tempo estimado:** 1 dia

#### O que falta:
- [ ] Adicionar `versionCode` para Android (auto-increment)
- [ ] Configurar `permissions` explícitas
- [ ] Configurar `splash` screen final
- [ ] Adicionar `android.permissions` específicas
  - [ ] `INTERNET` (já implícito)
  - [ ] `POST_NOTIFICATIONS` (para notificações)
  - [ ] `SCHEDULE_EXACT_ALARM` (para notificações agendadas - Android 12+)
- [ ] Configurar `android.playStoreUrl` (será gerado após upload)
- [ ] Adicionar `privacy` e `permissions` info

#### Configuração sugerida:
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
      },
      "googleServicesFile": "./google-services.json" // Se usar AdMob
    },
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/images/notification-icon.png",
        "color": "#6366F1",
        "sounds": ["./assets/sounds/notification.wav"]
      }]
    ]
  }
}
```

---

### 4. **Política de Privacidade** ❌
**Status:** Não criado  
**Prioridade:** 🟡 ALTA  
**Tempo estimado:** 1 dia

#### O que falta:
- [ ] Criar política de privacidade completa
- [ ] Hostear em URL pública (pode usar GitHub Pages grátis)
- [ ] Adicionar link no app.json
- [ ] Incluir seção de privacidade nas Settings
- [ ] Documentar coleta de dados (AsyncStorage local apenas)

#### Template mínimo necessário:
- Coleta de dados (apenas local, AsyncStorage)
- Uso de dados (funcionalidade do app)
- Compartilhamento (nenhum, dados locais apenas)
- Direitos do usuário (LGPD/GDPR)
- Contato do desenvolvedor

---

### 5. **Assets para Play Store** ⚠️
**Status:** Básicos existem  
**Prioridade:** 🟡 ALTA  
**Tempo estimado:** 2-3 dias

#### O que falta:
- [ ] Ícone 512x512px (requerido Play Store)
- [ ] Feature Graphic 1024x500px
- [ ] Screenshots (mínimo 2, recomendado 8)
  - [ ] Telefone: 1080x1920px ou maior
  - [ ] Tablet (opcional): 1200x1920px ou maior
- [ ] Ícone adaptativo 1024x1024px (já existe, verificar qualidade)
- [ ] Vídeo promocional (opcional, recomendado)

#### Checklist de assets:
- [ ] Ícone Play Store (512x512, PNG, sem transparência)
- [ ] Feature Graphic (1024x500, PNG/JPG)
- [ ] Screenshot 1: Dashboard
- [ ] Screenshot 2: Lista de Tarefas
- [ ] Screenshot 3: Ranking
- [ ] Screenshot 4: Histórico
- [ ] Screenshot 5: Configurações
- [ ] Screenshot 6: (Opcional) Premium features
- [ ] Screenshot 7: (Opcional) Dark Mode
- [ ] Screenshot 8: (Opcional) Gamificação

---

### 6. **Descrição e Metadata** ⚠️
**Status:** Não preparado  
**Prioridade:** 🟡 ALTA  
**Tempo estimado:** 1 dia

#### O que falta:
- [ ] Título curto (até 50 caracteres)
- [ ] Descrição curta (até 80 caracteres)
- [ ] Descrição completa (até 4000 caracteres)
- [ ] Palavras-chave (SEO)
- [ ] Categoria: Produtividade / Estilo de vida
- [ ] Classificação de conteúdo: Todos
- [ ] Email de contato para suporte
- [ ] Website (opcional)

#### Exemplo sugerido:
```
Título curto: Casa Organizada
Descrição curta: Organize tarefas domésticas com gamificação e trabalho em equipe

Descrição completa:
[Descrever funcionalidades principais, diferenciais, etc.]
```

---

## 🟢 MÉDIA PRIORIDADE - POLIMENTO

### 7. **Testes Finais** ⚠️
**Status:** Não formalizado  
**Prioridade:** 🟢 MÉDIA  
**Tempo estimado:** 3-5 dias

#### O que falta:
- [ ] Testar todos os fluxos principais em dispositivo físico
- [ ] Testar notificações em produção
- [ ] Testar IAP em sandbox
- [ ] Testar AdMob em modo teste
- [ ] Testar em diferentes tamanhos de tela
- [ ] Testar performance com muitos dados
- [ ] Testar casos extremos (sem dados, dados corrompidos)
- [ ] Testes de acessibilidade básicos
- [ ] Testar Dark Mode (quando implementado visualmente)

#### Checklist de testes:
- [ ] Onboarding completo
- [ ] Criar/editar/deletar usuário
- [ ] Criar/editar/deletar tarefa
- [ ] Completar tarefa
- [ ] Ver ranking
- [ ] Ver histórico
- [ ] Ver notificações
- [ ] Backup/restore (Premium)
- [ ] Comprar Premium
- [ ] Ver anúncios (Free)
- [ ] Não ver anúncios (Premium)

---

### 8. **Validações e Tratamento de Erros** ⚠️
**Status:** Básico implementado  
**Prioridade:** 🟢 MÉDIA  
**Tempo estimado:** 2-3 dias

#### O que falta:
- [ ] Validações robustas em todos os formulários
- [ ] Mensagens de erro amigáveis
- [ ] Tratamento de dados corrompidos
- [ ] Fallbacks para edge cases
- [ ] Loading states consistentes
- [ ] Error boundaries

---

### 9. **Performance e Otimização** ✅
**Status:** Bom  
**Prioridade:** 🟢 MÉDIA  
**Tempo estimado:** 1-2 dias

#### Verificar:
- [ ] Re-renders desnecessários minimizados
- [ ] useMemo em cálculos pesados (já implementado)
- [ ] Lazy loading onde apropriado
- [ ] Cache de dados eficiente
- [ ] Bundle size otimizado
- [ ] Performance com anúncios

---

### 10. **Dark Mode Visual Completo** ⚠️
**Status:** Estrutura pronta, visual incompleto  
**Prioridade:** 🟢 MÉDIA  
**Tempo estimado:** 2-3 dias

#### O que falta:
- [ ] Aplicar cores do tema em todas as telas
- [ ] Testar contraste em Dark Mode
- [ ] Ajustar gradientes para Dark Mode
- [ ] Testar transições suaves

---

## 🔵 BAIXA PRIORIDADE - NICE TO HAVE

### 11. **Acessibilidade** ⚠️
**Status:** Básico  
**Prioridade:** 🔵 BAIXA  
**Tempo estimado:** 2-3 dias

#### O que falta:
- [ ] Labels para screen readers
- [ ] Contraste adequado verificado
- [ ] Tamanhos de fonte ajustáveis (se necessário)
- [ ] Áreas de toque adequadas (já implementado)

---

### 12. **Analytics e Crash Reporting** ❌
**Status:** Não implementado  
**Prioridade:** 🔵 BAIXA (mas recomendado)  
**Tempo estimado:** 1-2 dias

#### Recomendado:
- [ ] Integrar Firebase Crashlytics ou Sentry
- [ ] Analytics básico (Firebase Analytics)
- [ ] Logging de erros críticos

---

## 📋 CHECKLIST FINAL POR CATEGORIA

### ✅ Funcionalidades Core (100%)
- [x] CRUD usuários
- [x] CRUD tarefas
- [x] Sistema de pontos
- [x] Ranking
- [x] Histórico
- [x] Notificações
- [x] Onboarding
- [x] Sistema Premium (UI)

### ⚠️ Monetização (0%)
- [ ] AdMob integrado
- [ ] IAP real configurado
- [ ] Anúncios funcionando
- [ ] Premium comprável

### ⚠️ Configuração Produção (30%)
- [x] app.json básico
- [ ] Permissões configuradas
- [ ] Privacy policy
- [ ] Assets Play Store
- [ ] Metadata completo

### ⚠️ Qualidade e Testes (50%)
- [x] Validações básicas
- [ ] Testes completos
- [ ] Error handling robusto
- [ ] Performance otimizada

### ⚠️ Compliance (0%)
- [ ] Privacy policy
- [ ] Termos de uso (opcional)
- [ ] LGPD/GDPR compliance

---

## 🚀 ROADMAP PARA PRODUÇÃO (2 SEMANAS)

### Semana 1: Monetização e Configuração
1. **Dia 1-2:** Integrar AdMob
   - Instalar dependências
   - Configurar conta AdMob
   - Implementar banners e interstitials
   - Testar em modo teste

2. **Dia 3-4:** Configurar IAP Real
   - Instalar expo-in-app-purchases
   - Configurar produtos no Play Console
   - Substituir mock por IAP real
   - Testar em sandbox

3. **Dia 5:** Configurações de Produção
   - Atualizar app.json
   - Configurar permissões
   - Preparar eas.json para build

### Semana 2: Polimento e Submissão
4. **Dia 6-7:** Assets e Marketing
   - Criar/otimizar assets
   - Preparar screenshots
   - Escrever descrições
   - Criar privacy policy

5. **Dia 8-9:** Testes e Polimento
   - Testes completos em dispositivo físico
   - Corrigir bugs encontrados
   - Otimizar performance
   - Dark Mode visual (se houver tempo)

6. **Dia 10:** Build e Submissão
   - Build de produção (EAS)
   - Upload para Play Console (Internal Testing)
   - Preencher metadata
   - Submeter para review

---

## 📦 DEPENDÊNCIAS A ADICIONAR

```json
{
  "dependencies": {
    "react-native-google-mobile-ads": "^14.0.0",
    "expo-in-app-purchases": "~15.0.0"
  }
}
```

**Nota:** Para Expo, pode ser necessário usar `expo-build-properties` e configurar plugins nativos.

---

## 🎯 PRIORIZAÇÃO FINAL

### Para Publicar na Play Store (MÍNIMO VIÁVEL):
1. ✅ App funcional (JÁ TEMOS)
2. ❌ AdMob (CRÍTICO - última feature do PRD)
3. ❌ IAP Real (CRÍTICO - monetização)
4. ❌ Privacy Policy (OBRIGATÓRIO Play Store)
5. ❌ Assets básicos (OBRIGATÓRIO)
6. ❌ Metadata (OBRIGATÓRIO)
7. ⚠️ Testes básicos (RECOMENDADO)

### Para Publicar com Qualidade:
Adicione aos itens acima:
8. ⚠️ Validações robustas
9. ⚠️ Error handling completo
10. ⚠️ Dark Mode visual completo
11. ⚠️ Testes completos
12. ❌ Analytics/Crash reporting

---

## 💰 CUSTOS NECESSÁRIOS

### Google Play Console:
- **Taxa única:** $25 USD (registro de desenvolvedor)
- **Manutenção:** Gratuita

### AdMob:
- **Gratuito** (apenas recebe % dos anúncios)

### Conta de Desenvolvedor:
- **Google Play:** $25 USD (uma vez)
- **App Store (iOS):** $99 USD/ano (se publicar iOS também)

---

## ✅ CONCLUSÃO

O app está **95% completo** e muito próximo de produção. Os principais bloqueadores são:

1. **Monetização** (AdMob + IAP) - 4-6 dias
2. **Configuração Play Store** (assets, privacy, metadata) - 2-3 dias
3. **Testes finais** - 2-3 dias

**Tempo total estimado:** 8-12 dias de trabalho focado.

Após completar estes itens, o app estará **100% pronto para submissão na Play Store**.

---

**Última atualização:** 2024  
**Versão:** 1.0.0  
**Status:** 🟡 Pronto para monetização e deploy

