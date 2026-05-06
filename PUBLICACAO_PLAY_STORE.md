# 🚀 Guia Completo: Publicar GoalEdge na Google Play Store

## 📋 Checklist Geral

- [ ] Conta Google Play Console criada ($25 taxa única)
- [ ] App configurado e testado
- [ ] Ícones e assets preparados
- [ ] Build de produção gerado (AAB)
- [ ] Política de Privacidade publicada
- [ ] Termos de Serviço publicados
- [ ] Screenshots e descrições preparadas
- [ ] Integração com AdMob configurada (opcional)
- [ ] Sistema de pagamento configurado (Google Play Billing)

---

## 📱 PARTE 1: Preparar o App

### 1.1 Atualizar app.json

```json
{
  "expo": {
    "name": "GoalEdge",
    "slug": "goaledge",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1A1A1A"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#1A1A1A"
      },
      "package": "com.goaledge.app",
      "versionCode": 1,
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ],
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-router",
      "expo-web-browser"
    ]
  }
}
```

### 1.2 Criar Ícones e Assets

**Você precisa criar 4 arquivos de imagem:**

1. **icon.png** (1024x1024) - Ícone principal
2. **adaptive-icon.png** (1024x1024) - Ícone adaptativo Android
3. **splash.png** (1284x2778) - Tela de splash
4. **feature-graphic.png** (1024x500) - Banner da Play Store

**Como criar:**
- Use a logo GoalEdge que você forneceu
- Siga o guia `SUBSTITUIR_LOGO.md` que já criamos
- Ou use: https://www.appicon.co/

### 1.3 Configurar Variáveis de Ambiente

Crie `.env.production`:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon

# API Football
EXPO_PUBLIC_API_FOOTBALL_KEY=sua-chave-api-football

# AdMob (opcional - para anúncios)
EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID=ca-app-pub-xxxxx
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID=ca-app-pub-xxxxx

# Google Play Billing (para Premium)
EXPO_PUBLIC_GOOGLE_PLAY_LICENSE_KEY=sua-chave-licenca
```

---

## 🔧 PARTE 2: Gerar Build de Produção

### 2.1 Instalar EAS CLI

```bash
npm install -g eas-cli
```

### 2.2 Login no Expo

```bash
eas login
```

### 2.3 Configurar EAS Build

```bash
eas build:configure
```

Isso cria `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 2.4 Gerar Keystore (Chave de Assinatura)

**Opção A: Deixar o EAS gerar automaticamente (Recomendado)**

```bash
eas build --platform android --profile production
```

O EAS vai perguntar se quer gerar uma keystore. Responda **YES**.

**Opção B: Gerar manualmente**

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore goaledge.keystore \
  -alias goaledge -keyalg RSA -keysize 2048 -validity 10000
```

Guarde a senha em local seguro!

### 2.5 Build para Play Store (AAB)

```bash
# Build de produção (AAB - Android App Bundle)
eas build --platform android --profile production
```

Aguarde ~15-20 minutos. O EAS vai gerar o arquivo `.aab`.

### 2.6 Download do Build

```bash
# Listar builds
eas build:list

# Download
eas build:download --platform android --latest
```

Você receberá um arquivo: `goaledge-v1.0.0.aab`

---

## 🏪 PARTE 3: Criar Conta na Play Store

### 3.1 Criar Conta de Desenvolvedor

1. Acesse: https://play.google.com/console
2. Clique em "Criar conta"
3. Escolha "Organização" ou "Pessoa física"
4. Pague a taxa única de **$25 USD**
5. Preencha informações da conta

### 3.2 Verificar Identidade

- Google pode pedir verificação de identidade
- Envie documento com foto (RG, CNH, Passaporte)
- Aguarde aprovação (1-3 dias)

---

## 📝 PARTE 4: Criar Listagem do App

### 4.1 Criar Novo App

1. No Play Console, clique em "Criar app"
2. Preencha:
   - **Nome:** GoalEdge
   - **Idioma padrão:** Português (Brasil)
   - **Tipo:** App
   - **Gratuito ou pago:** Gratuito (com compras no app)

### 4.2 Configurar Listagem da Loja

**Descrição Curta (80 caracteres):**
```
Análise estatística de futebol com IA. Múltiplas com 70-80% de acerto.
```

**Descrição Completa (4000 caracteres):**
```
⚽ GoalEdge - Análise Estatística de Futebol com IA

Transforme suas apostas esportivas com análises baseadas em dados reais e inteligência artificial.

🎯 O QUE É O GOALEDGE?

GoalEdge é um aplicativo de análise estatística de futebol que gera múltiplas (acumuladores) com alta probabilidade de acerto. Nosso algoritmo analisa:

• Forma recente dos times (últimos 5 jogos)
• Média de gols marcados e sofridos
• Histórico de confrontos diretos (H2H)
• Estatísticas de mais de 50 ligas ao redor do mundo

🆓 PLANO GRATUITO

• 2-3 múltiplas por dia
• 70-75% de confiança real
• Análise de jogos das principais ligas
• Sem anúncios intrusivos

👑 PLANO PREMIUM ($5/mês)

• 7-10 múltiplas por dia (incluindo as gratuitas)
• 75-80% de confiança real
• Acesso prioritário a novos picks
• Notificações push
• Estatísticas completas e ROI
• Sem anúncios

📊 RECURSOS

✓ Múltiplas geradas diariamente às 06:00 UTC
✓ Análise de mercados: Over/Under, BTTS, Double Chance
✓ Odds razoáveis (1.30 a 8.00)
✓ Histórico de resultados
✓ Prévia de jogos de amanhã
✓ Interface em Português, Inglês e Espanhol
✓ Modo claro e escuro

🔬 CONFIANÇA REAL

Não inventamos probabilidades! Nossa confiança é calculada baseada em:

• Forma recente: Vitórias, empates e derrotas
• Média de gols: Ofensiva e defensiva
• H2H: Últimos 10 confrontos diretos
• Análise específica por mercado

⚠️ JOGO RESPONSÁVEL

GoalEdge é uma ferramenta de análise estatística. Não garantimos lucros.
Jogue com responsabilidade. +18 apenas.

📧 SUPORTE

Email: suporte@goaledge.app
Site: https://goaledge.app

Termos: https://goaledge.app/terms
Privacidade: https://goaledge.app/privacy
```

### 4.3 Screenshots (Obrigatório)

**Você precisa de pelo menos 2 screenshots:**

1. **Tela Home** - Mostrando picks do dia
2. **Tela Results** - Mostrando resultados
3. **Tela Premium** - Mostrando planos (opcional)
4. **Tela Tomorrow** - Prévia de jogos (opcional)

**Especificações:**
- Formato: PNG ou JPEG
- Tamanho: 16:9 ou 9:16
- Resolução mínima: 320px
- Resolução máxima: 3840px

**Como capturar:**
```bash
# Abrir emulador Android
npx expo run:android

# Capturar screenshots no emulador
# Ou usar dispositivo real
```

### 4.4 Gráfico de Recursos (Feature Graphic)

- Tamanho: **1024 x 500 pixels**
- Formato: PNG ou JPEG
- Banner horizontal com logo e texto

**Exemplo de texto:**
```
GoalEdge
Análise Estatística de Futebol
70-80% de Taxa de Acerto
```

### 4.5 Ícone do App

- Tamanho: **512 x 512 pixels**
- Formato: PNG (32-bit)
- Sem transparência

### 4.6 Categoria e Tags

- **Categoria:** Esportes
- **Tags:** futebol, apostas, estatísticas, análise, picks

---

## 🔒 PARTE 5: Política de Privacidade e Termos

### 5.1 Criar Política de Privacidade

**Você PRECISA ter uma URL pública com sua política de privacidade.**

**Opções:**

1. **Criar página no seu site:** `https://goaledge.app/privacy`
2. **Usar GitHub Pages:** Criar repositório público
3. **Usar geradores:** https://www.privacypolicygenerator.info/

**Conteúdo mínimo:**
- Quais dados você coleta (email, nome, uso do app)
- Como usa os dados (autenticação, análise)
- Compartilhamento com terceiros (Supabase, AdMob)
- Direitos do usuário (LGPD/GDPR)
- Contato

### 5.2 Criar Termos de Serviço

**URL:** `https://goaledge.app/terms`

**Conteúdo mínimo:**
- Descrição do serviço
- Responsabilidades do usuário
- Limitações de responsabilidade
- Política de reembolso (Premium)
- Jogo responsável (+18)

---

## 💳 PARTE 6: Configurar Pagamentos (Premium)

### 6.1 Configurar Google Play Billing

1. No Play Console, vá em **Monetização > Produtos**
2. Clique em **Criar produto gerenciado**
3. Preencha:
   - **ID do produto:** `premium_monthly`
   - **Nome:** Premium Mensal
   - **Descrição:** Acesso a todas as múltiplas premium
   - **Preço:** $5.00 USD (ou R$ 25,00)
   - **Status:** Ativo

### 6.2 Integrar no App

**Instalar biblioteca:**
```bash
npx expo install react-native-iap
```

**Código de exemplo:**
```typescript
import * as IAP from 'react-native-iap';

const productIds = ['premium_monthly'];

// Comprar
const purchase = await IAP.requestPurchase({
  sku: 'premium_monthly',
  andDangerouslyFinishTransactionAutomaticallyIOS: false,
});

// Verificar compra no backend (Supabase Edge Function)
```

---

## 📤 PARTE 7: Upload do App

### 7.1 Criar Release

1. No Play Console, vá em **Produção > Releases**
2. Clique em **Criar nova release**
3. Upload do arquivo `.aab`
4. Preencha **Notas da versão:**

```
Versão 1.0.0 - Lançamento Inicial

✨ Novidades:
• 2-3 múltiplas gratuitas por dia (70-75% de acerto)
• Plano Premium com 7-10 múltiplas (75-80% de acerto)
• Análise de mais de 50 ligas
• Histórico de resultados
• Prévia de jogos de amanhã
• Suporte a PT, EN e ES
```

### 7.2 Configurar Países

- Selecione os países onde o app estará disponível
- Recomendado: Brasil, Portugal, EUA, Espanha

### 7.3 Classificação de Conteúdo

1. Preencha o questionário
2. Marque:
   - **Violência:** Não
   - **Sexo:** Não
   - **Drogas:** Não
   - **Apostas simuladas:** **SIM** ⚠️
   - **Compras no app:** SIM

3. Classificação esperada: **+12 ou +16**

### 7.4 Público-Alvo

- **Idade mínima:** 18 anos (por causa de apostas)
- **Público:** Adultos interessados em futebol

---

## 🧪 PARTE 8: Testes

### 8.1 Teste Interno (Recomendado)

1. Crie uma **faixa de teste interno**
2. Adicione emails de testadores (até 100)
3. Publique versão de teste
4. Testadores recebem link para baixar
5. Colete feedback por 1-2 semanas

### 8.2 Teste Fechado (Opcional)

- Até 1000 testadores
- Mais formal que teste interno

### 8.3 Teste Aberto (Opcional)

- Qualquer pessoa pode testar
- Bom para marketing pré-lançamento

---

## 🚀 PARTE 9: Publicação

### 9.1 Enviar para Revisão

1. Revise todas as seções
2. Clique em **Enviar para revisão**
3. Google Play vai revisar (1-7 dias)

### 9.2 Checklist Final

- [ ] AAB enviado
- [ ] Screenshots (mínimo 2)
- [ ] Feature graphic
- [ ] Ícone 512x512
- [ ] Descrição completa
- [ ] Política de privacidade (URL)
- [ ] Termos de serviço (URL)
- [ ] Classificação de conteúdo
- [ ] Países selecionados
- [ ] Preço configurado (Gratuito)
- [ ] Produtos in-app configurados (Premium)

### 9.3 Aguardar Aprovação

**Tempo médio:** 1-7 dias

**Possíveis problemas:**
- Política de privacidade inválida
- Screenshots inadequados
- Conteúdo de apostas (pode ser rejeitado)
- Violação de direitos autorais

---

## ⚠️ ATENÇÃO: Apps de Apostas

### Restrições da Google Play

A Google Play tem **restrições severas** para apps de apostas:

1. **Proibido em muitos países**
2. **Requer licença de jogo** em alguns países
3. **Pode ser rejeitado** se parecer app de apostas

### Como Evitar Rejeição

✅ **Posicione como "Análise Estatística"**
- Não use palavras: "apostar", "ganhar dinheiro", "lucro garantido"
- Use: "análise", "estatísticas", "previsões", "estudo"

✅ **Disclaimer claro:**
```
"GoalEdge é uma ferramenta de análise estatística.
Não incentivamos apostas. Jogo responsável. +18."
```

✅ **Não integre casas de apostas:**
- Não tenha links para bet365, betano, etc.
- Não facilite apostas diretas

✅ **Foco educacional:**
- Ensinar análise de dados
- Estatísticas de futebol
- Estudo de probabilidades

---

## 📊 PARTE 10: Pós-Lançamento

### 10.1 Monitorar Métricas

- Instalações
- Avaliações
- Crashes
- Taxa de retenção

### 10.2 Responder Avaliações

- Responda todas as avaliações (boas e ruins)
- Agradeça feedback positivo
- Resolva problemas reportados

### 10.3 Atualizações

```bash
# Incrementar versionCode no app.json
"versionCode": 2,
"version": "1.0.1"

# Gerar novo build
eas build --platform android --profile production

# Upload no Play Console
```

---

## 💰 PARTE 11: Monetização

### 11.1 AdMob (Anúncios)

1. Criar conta: https://admob.google.com
2. Criar app no AdMob
3. Criar unidades de anúncio:
   - Banner (rodapé)
   - Rewarded (desbloquear pick)
4. Integrar IDs no app

### 11.2 Google Play Billing (Premium)

- Já configurado na PARTE 6
- Comissão: **15%** (primeiros $1M/ano)
- Comissão: **30%** (acima de $1M/ano)

### 11.3 Projeção de Receita

**Cenário conservador (1000 usuários ativos):**

- **Premium (5%):** 50 usuários × $5 = $250/mês
- **AdMob:** 950 usuários × $0.50 CPM = ~$50/mês
- **Total:** ~$300/mês

**Cenário otimista (10.000 usuários ativos):**

- **Premium (5%):** 500 usuários × $5 = $2.500/mês
- **AdMob:** 9.500 usuários × $0.50 CPM = ~$500/mês
- **Total:** ~$3.000/mês

---

## 🎯 RESUMO: Próximos Passos

### Hoje:
1. ✅ Criar conta Google Play Console ($25)
2. ✅ Preparar ícones e screenshots
3. ✅ Criar política de privacidade e termos

### Amanhã:
4. ✅ Gerar build de produção (AAB)
5. ✅ Criar listagem do app
6. ✅ Configurar produtos in-app (Premium)

### Depois:
7. ✅ Enviar para revisão
8. ✅ Aguardar aprovação (1-7 dias)
9. ✅ Publicar! 🎉

---

## 📞 Suporte

**Dúvidas sobre publicação:**
- Google Play Console: https://support.google.com/googleplay/android-developer
- Expo EAS: https://docs.expo.dev/build/introduction/

**Problemas com o app:**
- Revise este guia
- Consulte documentação do Expo
- Teste em dispositivos reais antes de publicar

---

**Boa sorte com o lançamento do GoalEdge! 🚀⚽**

**Última atualização:** 5 de Maio de 2026
