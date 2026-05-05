# GoalEdge - Roadmap de Desenvolvimento

**Produto:** Statistical Football Betting Analysis App  
**Versão:** 1.0  
**Data de Criação:** May 2026  
**Stack:** React Native + Expo + Supabase

---

## Visão Geral do Produto

GoalEdge é um aplicativo Android freemium que usa dados reais de futebol da API-Football (v3) para analisar partidas estatisticamente, identificar mercados de apostas de alta probabilidade e construir acumuladores automáticos de 3-4 pernas.

### Proposta de Valor
- 2 acumuladores gratuitos/dia (confiança 65-74%, odds 1.80-2.20)
- Até 5 acumuladores premium/dia (confiança 75%+, odds 1.80-4.00)
- Atualização diário automática via Supabase Edge Functions
- Rastreamento completo de resultados (Pending → Green/Red)
- Histórico de resultados com hit rate e ROI
- UI moderna dark-themed com acentos gold

---

## Fases de Desenvolvimento

### Fase 1: Fundação (Sprint 1)
**Duração Estimada:** 3-5 dias

#### Objetivos
- Configurar projeto Expo para GoalEdge
- Configurar Supabase (projeto, auth, database)
- Configurar navigation skeleton
- Implementar schema do banco de dados

#### Entregáveis

##### 1.1 Configuração Projeto Expo
- [ ] Renomear projeto para `goaledge`
- [ ] Atualizar app.json com nome "GoalEdge" e configurações
- [ ] Configurar scheme	goaledge://
- [ ] Atualizar bundle identifier para com.goaledge.app
- [ ] Configurar ícones e splash screen

##### 1.2 Configuração Supabase
- [ ] Criar novo projeto Supabase
- [ ] Configurar Auth (email/password)
- [ ] Configurar RLS em todas as tabelas
- [ ] Configurar Edge Functions runtime
- [ ] Configurar variáveis ambiente (API-Football key, Stripe keys)

##### 1.3 Schema do Banco de Dados
- [ ] Tabela `users` (com colunas preferred_language, preferred_theme)
- [ ] Tabela `daily_picks`
- [ ] Tabela `pick_selections`
- [ ] Tabela `fixture_cache`
- [ ] Tabela `daily_stats`
- [ ] Tabela `leagues` (cache)
- [ ] Trigger para atualizar updated_at

##### 1.4 Navigation Skeleton
- [ ] Bottom Tab Navigator (5 tabs)
- [ ] Stack navigators aninhados
- [ ] Configurar rotas nomeadas

---

### Fase 2: Camada de Dados (Sprint 2)
**Duração Estimada:** 5-7 dias

#### Objetivos
- Implementar API-Football Edge Functions
- Configurar sistema de cache
- Configurar cron jobs
- Implementar motor de pontuação

#### Entregáveis

##### 2.1 API-Football Edge Functions
- [ ] Função fetch-fixtures (buscar partidas do dia)
- [ ] Função fetch-fixture-details (dados completos)
- [ ] Função fetch-team-statistics (estatísticas)
- [ ] Função fetch-head-to-head (H2H)
- [ ] Função fetch-odds (odds pré-jogo)
- [ ] Função fetch-injuries (lesionados)
- [ ] Função fetch-standings (classificação)
- [ ] Função fetch-predictions (predições API)

##### 2.2 Sistema de Cache
- [ ] Estrutura fixture_cache
- [ ] TTL control (15 min para odds, 30 min para stats)
- [ ] Função cache-validator
- [ ] Rate limit handler

##### 2.3 Cron Jobs (pg_cron)
- [ ] Agendamento 06:00 UTC (generate-daily-picks)
- [ ] Agendamento a cada 30 min (refresh-cache)
- [ ] Agendamento 55-65 min antes jogo (validate-pre-kickoff)
- [ ] Agendamento a cada 5 min (update-results)
- [ ] Agendamento 02:00 UTC (aggregate-daily-stats)

##### 2.4 Motor de Pontuação
- [ ] Componente Recent Form (25%)
- [ ] Componente Home/Away Performance (20%)
- [ ] Componente Goals Ratio (20%)
- [ ] Componente Head-to-Head (15%)
- [ ] Componente League Tendency (10%)
- [ ] Componente Squad Availability (10%)
- [ ] Normalização de scores para 0-100
- [ ] Calculadora de confidence score

---

### Fase 3: Motor de Picks (Sprint 3)
**Duração Estimada:** 5-7 dias

#### Objetivos
- Implementar gerador de picks individuais
- Implementar construtor de acumuladores
- Implementar regras de descarte
- Configurar DB storage

#### Entregáveis

##### 3.1 Gerador de Picks Individuais
- [ ] Pipeline de processamento por partida
- [ ] Validação de fixtures (discard rules)
- [ ] Score calculation para 7 mercados
- [ ] Seleção de melhor mercado por partida
- [ ] Persistência em pick_selections

##### 3.2 Mercados Suportados
- [ ] Over 1.5 Goals (Bet ID 5)
- [ ] Over 2.5 Goals (Bet ID 5)
- [ ] Under 2.5 Goals (Bet ID 5)
- [ ] Both Teams to Score (Bet ID 8)
- [ ] Double Chance Home/Draw (Bet ID 3)
- [ ] Double Chance Away/Draw (Bet ID 3)
- [ ] HT Over 0.5 Goals (Bet ID 57)

##### 3.3 Construtor de Acumuladores
- [ ] Algoritmo greedy para odd target
- [ ] Free accumulators (2/dia, 65-74%, 1.80-2.20)
- [ ] Premium accumulators (até 5/dia, 75%+, 1.80-4.00)
- [ ] Estratégia de seleção por tier
- [ ] Regras de não-repetição

##### 3.4 Razões Estatísticas
- [ ] Geração multilíngue (pt/en/es)
- [ ] Estrutura JSON reasons em pick_selections
- [ ] Templates de reason strings

---

### Fase 4: UI - Home & Detail (Sprint 4)
**Duração Estimada:** 5-7 dias

#### Objetivos
- Implementar tela Home com picks do dia
- Implementar Pick Detail screen
- Configurar real-time updates
- Implementar sistema de temas

#### Entregáveis

##### 4.1 Theme System (GoalEdge)
- [ ] Atualizar constants/theme.ts para GoalEdge colors
- [ ] Implementar ThemeContext para GoalEdge
- [ ] Dark mode: #1A1A2E, #16213E, #0F3460
- [ ] Light mode: #F0F4FF, #FFFFFF, #1A1A2E
- [ ] Accent gold: #C9A84C / #B8922A
- [ ] Status colors: green/red/pending

##### 4.2 Home Screen (Tab 1)
- [ ] Header com logo + date + notification bell
- [ ] Seção Free Picks Today (2 accumulator cards)
- [ ] Seção Premium Picks Today (blurred para free users)
- [ ] Accumulator cards com tier, selections, odd, confidence, status
- [ ] Pull-to-refresh
- [ ] Estado: sem picks ainda

##### 4.3 Pick Detail Screen
- [ ] Accumulator header (combined odd, confidence, status)
- [ ] Selection list (team names, league, market, odd, confidence)
- [ ] Reasons accordion ( multilíngue)
- [ ] Status icons por seleção

##### 4.4 Real-time Updates
- [ ] Configurar Supabase Realtime
- [ ] Mutation observers para picks
- [ ] Status update em tempo real

---

### Fase 5: UI - Results & Tomorrow (Sprint 5)
**Duração Estimada:** 4-5 dias

#### Objetivos
- Implementar tela Results com histórico
- Implementar Tomorrow preview
- Date picker para navegar histórico

#### Entregáveis

##### 5.1 Results Screen (Tab 2)
- [ ] Padrão: yesterday's picks
- [ ] Calendar date picker
- [ ] Hit rate badge por dia
- [ ] ROI display
- [ ] Lista de accumulator cards com Green/Red
- [ ] Expandable accordion por accumulator
- [ ] Free users: apenas free picks
- [ ] Premium users: todos os picks

##### 5.2 Tomorrow Screen (Tab 3)
- [ ] Preview de fixture pool
- [ ] Match tiles (home vs away, league, kickoff)
- [ ] Mercado + confidence tentativa
- [ ] Badge premium nos de alta confiança
- [ ] Disclaimer "Final picks at 06:00 UTC"

---

### Fase 6: Monetização (Sprint 6)
**Duração Estimada:** 5-7 dias

#### Objetivos
- Implementar Premium screen
- Configurar Google Play Billing
- Configurar Stripe
- Implementar webhook handlers
- Implementar lógica de premium gate

#### Entregáveis

##### 6.1 Premium Screen (Tab 4)
- [ ] Full-screen premium upsell dark + gold
- [ ] Feature comparison table
- [ ] Preço: US$3/month
- [ ] Botão Subscribe Now
- [ ] Link Restore Purchases
- [ ] Social proof: 7-day hit rate

##### 6.2 Google Play Billing
- [ ] Configurar expo-in-app-purchases ou react-native-iap
- [ ] In-app products setup
- [ ] Purchase flow
- [ ] Token handling

##### 6.3 Stripe Integration
- [ ] Stripe Checkout Session (Edge Function)
- [ ] Web redirect flow
- [ ] Stripe webhook handler

##### 6.4 Webhook Handlers
- [ ] stripe-webhook (created/cancelled/renewed)
- [ ] google-play-webhook (RTDN)
- [ ] Subscription management

##### 6.5 Premium Gate Logic
- [ ] users.subscription_tier check
- [ ] Free vs Premium views
- [ ] Premium blurred content

---

### Fase 7: Profile & notifications (Sprint 7)
**Duração Estimada:** 4-5 dias

#### Objetivos
- Implementar Profile screen
- Implementar i18n (3 idiomas)
- Configurar push notifications
- Subscription management

#### Entregáveis

##### 7.1 Profile Screen (Tab 5)
- [ ] Current plan badge (Free/Premium + expiry)
- [ ] Stats summary (total picks, hit rate, ROI)
- [ ] Settings: notifications, timezone
- [ ] Upgrade/Manage Subscription buttons
- [ ] Sign out button

##### 7.2 Internacionalização (i18n)
- [ ] react-i18next setup
- [ ] Arquivos: /locales/pt.json, /locales/en.json, /locales/es.json
- [ ] Detecção automática de idioma do dispositivo
- [ ] Persistent language choice
- [ ] Toggle visor na Profile screen
- [ ] Globe icon na Home header

##### 7.3 Theme Toggle
- [ ] Dark/Light/System switch
- [ ] Persistência local e Supabase
- [ ] Aplicação instantânea

##### 7.4 Push Notifications
- [ ] expo-notifications setup
- [ ] send-daily-notification Edge Function
- [ ] Agendamento 07:00 UTC
- [ ] Premium-only notifications

---

### Fase 8: QA & Launch (Sprint 8)
**Duração Estimada:** 5-7 dias

#### Objetivos
- Bug fixes
- Performance testing
- Play Store submission
- Marketing assets

#### Entregáveis

##### 8.1 Quality Assurance
- [ ] Teste completo de todas as funcionalidades
- [ ] Teste em dispositivos reais
- [ ] Performance profiling
- [ ] Accessibility testing

##### 8.2 Build & Submission
- [ ] APK build (Android standalone)
- [ ] Google Play Console setup
- [ ] App listing content
- [ ] Screenshots (dark + light)
- [ ] Privacy Policy
- [ ] Submission

##### 8.3 Documentação
- [ ] README.md
- [ ] In-app help/FAQ
- [ ] Support contact

---

## Dependências Externas

### Necessário Configurar
1. **API-Football** (RapidAPI)
   - Plano free ou starter
   - API key para ambiente

2. **Supabase**
   - Projeto novo
   - Edge Functions enabled
   - pg_cron extension

3. **Stripe**
   - Account developer
   - API keys (secret + publishable)
   - Webhook setup

4. **Google Play**
   - Developer account
   - In-app products configured

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|--------|----------|
| API-Football rate limits | Alto | Cache agressivo, fallback bookmakers |
| Match postpone handling | Médio | Re-run às 08:00 UTC |
| Odds movement >10% | Médio | Refresh antes kickoff |
| Subscription sync delays | Médio | Webhook retry logic |

---

## Critérios de Sucesso

### MVP V1
- [ ] App funcional com 2 free picks/dia
- [ ] Sistema de resultados funcionando
- [ ] Premium upsell funcionando
- [ ] i18n em 3 idiomas
- [ ] Tema dark/light
- [ ] APK submittable para Play Store

---

## Ordem de Execução Sugerida

1. Sprint 1 → Fundação
2. Sprint 2 → Camada de Dados
3. Sprint 3 → Motor de Picks
4. Sprint 4 → UI Home & Detail
5. Sprint 5 → UI Results & Tomorrow
6. Sprint 6 → Monetização
7. Sprint 7 → Profile & Notifications
8. Sprint 8 → QA & Launch

**Tempo Total Estimado:** ~32-43 dias

---

*Documento baseado em PRD GoalEdge v1.0 - May 2026*