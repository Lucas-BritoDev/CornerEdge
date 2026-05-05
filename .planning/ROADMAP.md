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
- [x] Função fetch-fixtures (buscar partidas do dia)
- [x] Função fetch-fixture-details (dados completos)
- [x] Função fetch-team-statistics (estatísticas)
- [x] Função fetch-head-to-head (H2H)
- [x] Função fetch-odds (odds pré-jogo)
- [x] Função fetch-injuries (lesionados)
- [x] Função fetch-standings (classificação)
- [x] Função fetch-predictions (predições API)

##### 2.2 Sistema de Cache
- [x] Estrutura fixture_cache
- [x] TTL control (15 min para odds, 30 min para stats)
- [x] Função cache-validator
- [x] Rate limit handler

##### 2.3 Cron Jobs (pg_cron)
- [x] Agendamento 06:00 UTC (generate-daily-picks)
- [x] Agendamento a cada 30 min (refresh-cache)
- [x] Agendamento 55-65 min antes jogo (validate-pre-kickoff)
- [x] Agendamento a cada 5 min (update-results)
- [x] Agendamento 02:00 UTC (aggregate-daily-stats)

##### 2.4 Motor de Pontuação
- [x] Componente Recent Form (25%)
- [x] Componente Home/Away Performance (20%)
- [x] Componente Goals Ratio (20%)
- [x] Componente Head-to-Head (15%)
- [x] Componente League Tendency (10%)
- [x] Componente Squad Availability (10%)
- [x] Normalização de scores para 0-100
- [x] Calculadora de confidence score

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
- [x] Pipeline de processamento por partida
- [x] Validação de fixtures (discard rules)
- [x] Score calculation para 7 mercados
- [x] Seleção de melhor mercado por partida
- [x] Persistência em pick_selections

##### 3.2 Mercados Suportados
- [x] Over 1.5 Goals (Bet ID 5)
- [x] Over 2.5 Goals (Bet ID 5)
- [x] Under 2.5 Goals (Bet ID 5)
- [x] Both Teams to Score (Bet ID 8)
- [x] Double Chance Home/Draw (Bet ID 3)
- [x] Double Chance Away/Draw (Bet ID 3)
- [x] HT Over 0.5 Goals (Bet ID 57)

##### 3.3 Construtor de Acumuladores
- [x] Algoritmo greedy para odd target
- [x] Free accumulators (2/dia, 65-74%, 1.80-2.20)
- [x] Premium accumulators (até 5/dia, 75%+, 1.80-4.00)
- [x] Estratégia de seleção por tier
- [x] Regras de não-repetição

##### 3.4 Razões Estatísticas
- [x] Geração multilíngue (pt/en/es)
- [x] Estrutura JSON reasons em pick_selections
- [x] Templates de reason strings

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
- [x] Header com logo + date + notification bell
- [x] Seção Free Picks Today (2 accumulator cards)
- [x] Seção Premium Picks Today (blurred para free users)
- [x] Accumulator cards com tier, selections, odd, confidence, status
- [x] Pull-to-refresh
- [x] Estado: sem picks ainda

##### 4.3 Pick Detail Screen
- [x] Accumulator header (combined odd, confidence, status)
- [x] Selection list (team names, league, market, odd, confidence)
- [x] Reasons accordion ( multilíngue)
- [x] Status icons por seleção

##### 4.4 Real-time Updates
- [x] Configurar Supabase Realtime
- [x] Mutation observers para picks
- [x] Status update em tempo real

---

### Fase 5: UI - Results & Tomorrow (Sprint 5)
**Duração Estimada:** 4-5 dias

#### Objetivos
- Implementar tela Results com histórico
- Implementar Tomorrow preview
- Date picker para navegar histórico

#### Entregáveis

##### 5.1 Results Screen (Tab 2)
- [x] Padrão: yesterday's picks
- [x] Calendar date picker
- [x] Hit rate badge por dia
- [x] ROI display
- [x] Lista de accumulator cards com Green/Red
- [x] Expandable accordion por accumulator
- [x] Free users: apenas free picks
- [x] Premium users: todos os picks

##### 5.2 Tomorrow Screen (Tab 3)
- [x] Preview de fixture pool
- [x] Match tiles (home vs away, league, kickoff)
- [x] Mercado + confidence tentativa
- [x] Badge premium nos de alta confiança
- [x] Disclaimer "Final picks at 06:00 UTC"

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
- [x] Full-screen premium upsell dark + gold
- [x] Feature comparison table
- [x] Preço: US$3/month
- [x] Botão Subscribe Now
- [x] Link Restore Purchases
- [x] Social proof: 7-day hit rate

##### 6.2 Google Play Billing
- [x] Configurar expo-in-app-purchases ou react-native-iap
- [x] In-app products setup
- [x] Purchase flow
- [x] Token handling

##### 6.3 Stripe Integration
- [x] Stripe Checkout Session (Edge Function)
- [x] Web redirect flow
- [x] Stripe webhook handler

##### 6.4 Webhook Handlers
- [x] stripe-webhook (created/cancelled/renewed)
- [x] google-play-webhook (RTDN)
- [x] Subscription management

##### 6.5 Premium Gate Logic
- [x] users.subscription_tier check
- [x] Free vs Premium views
- [x] Premium blurred content

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
- [x] Current plan badge (Free/Premium + expiry)
- [x] Stats summary (total picks, hit rate, ROI)
- [x] Settings: notifications, timezone
- [x] Upgrade/Manage Subscription buttons
- [x] Sign out button

##### 7.2 Internacionalização (i18n)
- [x] react-i18next setup
- [x] Arquivos: /locales/pt.json, /locales/en.json, /locales/es.json
- [x] Detecção automática de idioma do dispositivo
- [x] Persistent language choice
- [x] Toggle visor na Profile screen
- [x] Globe icon na Home header

##### 7.3 Theme Toggle
- [x] Dark/Light/System switch
- [x] Persistência local e Supabase
- [x] Aplicação instantânea

##### 7.4 Push Notifications
- [x] expo-notifications setup
- [x] send-daily-notification Edge Function
- [x] Agendamento 07:00 UTC
- [x] Premium-only notifications

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
- [x] Teste completo de todas as funcionalidades
- [x] Teste em dispositivos reais
- [x] Performance profiling
- [x] Accessibility testing

##### 8.2 Build & Submission
- [x] APK build (Android standalone)
- [x] Google Play Console setup
- [x] App listing content
- [x] Screenshots (dark + light)
- [x] Privacy Policy
- [x] Submission

##### 8.3 Documentação
- [x] README.md
- [x] In-app help/FAQ
- [x] Support contact

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
- [x] App funcional com 2 free picks/dia
- [x] Sistema de resultados funcionando
- [x] Premium upsell funcionando
- [x] i18n em 3 idiomas
- [x] Tema dark/light
- [x] APK submittable para Play Store

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