# CornerEdge - Funções e Edge Functions

Este documento descreve todas as funções e edge functions do projeto CornerEdge, incluindo它们的用途, como funcionam e como são executadas.

---

## 1. Serviços do Frontend (React Native / Expo)

### 1.1 analyses-service.ts

**Localização:** `services/analyses-service.ts`

| Função | Descrição |
|--------|-----------|
| `fetchTodayAnalyses()` | Busca as análises de escanteios do dia atual no Supabase, incluindo dados relacionados (robust scenarios, distribuição estatística, estatísticas de times). |
| `fetchAnalysesByDate(date: Date)` | Busca análises para uma data específica usando timezone America/Sao_Paulo. Retorna análises com todos os dados relacionados. |
| `useTodayAnalyses(options?)` | Hook React Query para buscar análises de hoje. Suporta opções de enabled, staleTime (5min), gcTime (30min), retry (3x). |
| `useAnalysesByDate(date: Date)` | Hook React Query para buscar análises por data específica. Cache de 10min, gcTime de 60min. |
| `calculateHitRate(analyses)` | Calcula estatísticas de taxa de acerto: total, correct, incorrect, pending e hitRate (%). |
| `useUserStats()` | Hook para buscar estatísticas do usuário dos últimos 7 dias (não utilizado diretamente no frontend atual). |

---

### 1.2 corner-analysis-algorithm.ts

**Localização:** `services/corner-analysis-algorithm.ts`

> ⚠️ **Nota:** Este é o algoritmo cliente (v2.0). O backend usa uma versão mais recente (v5_deterministic) implementada na Edge Function.

| Função | Descrição |
|--------|-----------|
| `poissonPMF(lambda, k)` | Calcula P(X = k) para distribuição de Poisson. Usada para modelar probabilidade de escanteios. |
| `poissonOverProbability(lambda, threshold)` | Calcula P(X > threshold) = 1 - P(X ≤ threshold). Retorna probabilidade de Over (%). |
| `standardDeviation(values[])` | Calcula o desvio padrão de um array de números. |
| `toMarketLine(mu)` | Converte a média esperada (μ) para linha de mercado (múltiplo de 0.5). Garante linha abaixo da média para margem. |
| `analyzeTeamCorners(teamId, teamName)` | Busca últimos 10 jogos do time e calcula estatísticas de escanteios (média em casa/fora, sofridos, desvio padrão). |
| `calculatePrediction(homeStats, awayStats)` | Calcula a previsão de escanteios usando fórmula: μ = (avgHome × 0.4) + (avgAway × 0.35) + (pressãoDefensiva × 0.25). Retorna linha de mercado, probabilidade de Over, confiança, intervalo provável e distribuição. |
| `generateTodayAnalyses()` | Função exportada que gera análises do dia. **Não usada diretamente** - o backend faz isso via Edge Function. |
| `updateAnalysisResults(fixtureId, actualCorners)` | Atualiza o resultado de uma análise específica: compara escanteios reais com a linha预测 e define status (correct/incorrect). |
| `updateTodayResults()` | Busca todas as análises pendentes do dia e atualiza seus resultados na API-Football. Retorna contagem de atualizadas. |

**Modelo Matemático:**
```
μ = (avgHome × 0.4) + (avgAway × 0.35) + (pressãoDefensiva × 0.25)
linha = floor(μ / 0.5) × 0.5 - 0.5
P(Over) via Poisson λ = μ - (stdDev × 0.3)
```

---

### 1.3 football-api-service.ts

**Localização:** `services/football-api-service.ts`

> ⚠️ **Nota:** O frontend também tem este serviço, mas o backend (Edge Functions) usa sua própria implementação para evitar dependências de bundle.

| Função | Descrição |
|--------|-----------|
| `fetchFixturesByDate(date)` | Busca todos os jogos de uma data específica na API-Football. Retorna array de fixtures com times, league, status, etc. |
| `fetchFixtureStatistics(fixtureId)` | Busca estatísticas detalhadas de um jogo específico, incluindo escanteios. |
| `fetchTeamLastMatches(teamId, last)` | Busca últimos N jogos de um time (padrão: 10). |
| `extractCornerStats(statistics)` | Extrai estatísticas de escanteios do array de estatísticas. Retorna { home, away, total }. |
| `filterMajorLeagues(fixtures)` | Filtra jogos das 10 principais ligas (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Primeira Liga, Eredivisie, Süper Lig, Brasileirão, Liga MX). |
| `filterExpandedLeagues(fixtures)` | Filtra jogos de ligas secundárias (Champions League, Europa League, MLS, Saudi Pro League, etc.). |
| `filterScheduledFixtures(fixtures)` | Filtra apenas jogos ainda não iniciados (status NS ou TBD). |
| `filterBestAvailableFixtures(fixtures)` | Retorna melhores jogos disponíveis: se >= 5 jogos Tier 1, usa só esses; caso contrário, complementa com Tier 2. |

---

### 1.4 logo-service.ts

**Localização:** `services/logo-service.ts`

| Função | Descrição |
|--------|-----------|
| `getTeamLogoFallback(teamName, apiSportsLogo?)` | Retorna URL do logo do time com fallback em cascata: API-Football > Wikimedia > Clearbit. Suporta normalização de nomes (remover FC, CF, SC, etc.). |
| `getTeamInitials(teamName)` | Retorna iniciais do time (2 letras). Ex: "Manchester United" → "MU". |
| `normalizeTeamName(name)` | Normaliza nome do time para busca (lowercase, remove sufixos como FC, CF, SC, Club, etc.). |

**Mapa de Logos:** Contém ~60 times populares mapeados com URLs do Wikimedia/clearbit.

---

## 2. Edge Functions do Supabase (Backend/Cron Jobs)

### 2.1 generate-daily-analyses

**Arquivo:** `supabase/functions/generate-daily-analyses/index.ts`

**Descrição:** Gera automaticamente as análises de escanteios do dia (múltiplas).

**Frequência:** Executada via cron (tipicamente 1x ao dia, às 6:00-8:00 BRT).

**O que faz:**

1. **Busca Jogos do Dia:**
   - Consulta API-Football por jogos do dia (status: NS ou TBD)
   - Filtra apenas ligas permitidas (lista extensa de ~50+ países/competições)
   - Limita a 100 jogos (pool)

2. **Analisa Times:**
   - Para cada jogo, busca últimos 5 jogos de cada time
   - Calcula estatísticas de escanteios (média em casa/fora, sofridos, momentum)
   - Cache em memória e no banco (`team_statistics_cache`)

3. **Calcula Previsões:**
   - Usa distribuição de Poisson com baseline por liga
   - Aplica pesos: ataque home (0.6), ataque away (0.6), pressão defensiva (0.4)
   - Ajusta por momentum e qualidade dos dados
   - Calcula matchScore (0-10) baseado em vários fatores

4. **Busca Odds da API:**
   - Para cada jogo, busca odds de escanteios na API-Football
   - Extrai linhas de mercado Over/Under
   - Usa odds apenas se provenientes da API (não cria odds fake)

5. **Gera Múltiplas:**
   - **Premium:** 6 múltiplas (3 jogos cada)
   - **Free:** 4 múltiplas (2 jogos cada)
   - **SuperOdd:** 1 das premium vira SuperOdd (se odd combinada >= 3x)
   - Ordena deterministicamente por matchScore, confidence, lineEdge

6. **Insere no Banco:**
   - Cria registros na tabela `corner_analyses`
   - Para múltiplas: `is_multiple = true`, `games` (array JSON), `combined_odd`, `combined_confidence`
   - Tier: 'premium', 'free', ou 'superodd'
   - Salva metadados de geração

**Parâmetros:**
- `date`: Data alvo (formato YYYY-MM-DD)
- `force`: Se true, apaga análises existentes antes de gerar

**Retorno:**
```json
{
  "success": true,
  "multiples": 10,
  "total_in_db": 10,
  "premium": 6,
  "free": 4,
  "superodd": 1,
  "execution_time_ms": 120000
}
```

---

### 2.2 update-results

**Arquivo:** `supabase/functions/update-results/index.ts`

**Descrição:** Atualiza os resultados das análises pendentes consultando a API-Football.

**Frequência:** Executada via cron (a cada 1-2 horas) ou sob demanda.

**O que faz:**

1. **Busca Análises Pendentes:**
   - Busca análises com status = 'pending'
   - Filtra últimas 72 horas (kickoff_at entre cutoff e now)

2. **Para Cada Análise:**

   **Se for múltipla (`is_multiple = true`):**
   - Para cada jogo na múltipla:
     - Consulta status do jogo na API
     - Se FT/AET/PEN: busca estatísticas de escanteios
     - Compara com linha (prediction) usando estratégia over/under
     - Define resultado: correct, incorrect, ou void (se cancelado)
   - Status da múltipla: all correct → 'correct', any incorrect → 'incorrect', all void → 'void'

   **Se for individual:**
   - Mesmo processo, mas atualiza `actual_corners` e `status` diretamente

3. **Atualiza o Banco:**
   - Atualiza campos: `actual_corners`, `status`, `games` (para múltiplas), `updated_at`

**Tratamento de Casos Especiais:**
- Jogos não iniciados há > 4h: marca como void
- Jogos cancelados/adiados (PST, CANC, ABD, SUSP, INT): void
- Jogos ainda em andamento: mantém pending

---

### 2.3 send-daily-notification

**Arquivo:** `supabase/functions/send-daily-notification/index.ts`

**Descrição:** Envia notificações push para os usuários do app.

**Frequência:** Executada via cron (após generate-daily-analyses, tipicamente 7:00 BRT).

**O que faz:**

1. **Busca Usuários com Push Token:**
   - Consulta tabela `profiles`
   - Filtra onde `push_token` não é null

2. **Envia Notificações:**
   - Diferencia por tier do usuário:
     - **Premium:** "👑 CornerEdge Premium Picks!" - "As análises premium de hoje já estão disponíveis."
     - **Free:** "⚽ Novos Cantos do Dia!" - "Seus palpites de escanteios chegaram."
   - Envia via Expo Push Service (exp.host)

3. **Estrutura da Mensagem:**
```json
{
  "to": "push_token",
  "sound": "default",
  "title": "...",
  "body": "...",
  "data": { "screen": "index" }
}
```

---

### 2.4 update-team-logos

**Arquivo:** `supabase/functions/update-team-logos/index.ts`

**Descrição:** Atualiza logos de times que estão faltando nas análises.

**Frequência:** Executada sob demanda ou periodicamente.

**O que faz:**

1. **Busca Análises sem Logos:**
   - Seleciona análises onde `home_team_logo` ou `away_team_logo` é null
   - Limite de 100 por execução

2. **Atualiza Logos:**
   - **Para múltiplas:** Extrai logos do primeiro jogo no array `games`
   - **Para individuais:** Busca fixture na API-Football e pega logos dos times

---

### 2.5 retry-failed-generations

**Arquivo:** `supabase/functions/retry-failed-generations/index.ts`

**Descrição:** Retry automático para gerações que falharam.

**Frequência:** Executada periodicamente (a cada 15-30 min).

**O que faz:**

1. **Busca Retry Pendente:**
   - Consulta tabela `generation_retry_queue`
   - Filtra status = 'pending' e `next_retry_at` <= now
   - Ordena por created_at (mais antigos primeiro)

2. **Executa Retry:**
   - Chama `generate-daily-analyses` com `force=true`
   - Verifica se gerou exatamente 10 múltiplas

3. **Lógica de Retry:**
   - Máximo 3 tentativas
   - Backoff exponencial: 5min, 15min, 30min
   - Se OK: marca como 'completed'
   - Se falhar e ainda houver tentativas: agenda próximo retry
   - Se máximo atingido: marca como 'failed'

4. **Log:**
   - Registra execuções na tabela `edge_function_logs`
   - Inclui metadata: target_date, attempt_number, multiples_generated

---

## 3. Tabelas do Banco de Dados

### corner_analyses

Tabela principal que armazena as previsões de escanteios.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| fixture_id | integer | ID do jogo na API-Football |
| home_team | text | Nome do time mandante |
| away_team | text | Nome do time visitante |
| home_team_logo | text | URL do logo (mandante) |
| away_team_logo | text | URL do logo (visitante) |
| league | text | Nome da liga |
| kickoff_at | timestamptz | Data/hora do jogo |
| confidence | integer | Confiança da previsão (0-100) |
| avg_prediction | numeric | Linha de mercado (ex: 8.5) |
| probable_range_min | integer | Mínimo do intervalo provável |
| probable_range_max | integer | Máximo do intervalo provável |
| tier | text | 'free', 'premium', ou 'superodd' |
| status | text | 'pending', 'correct', 'incorrect', 'void' |
| actual_corners | integer | Escanteios reais (após jogo) |
| is_multiple | boolean | Se é uma múltipla |
| is_superodd | boolean | Se é SuperOdd |
| games | jsonb | Array de jogos (para múltiplas) |
| combined_odd | numeric | Odd combinada (para múltiplas) |
| combined_confidence | integer | Confiança combinada (para múltiplas) |
| strategy_type | text | 'over' ou 'under' |

### generation_retry_queue

Tabela para retry de gerações falhas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| target_date | date | Data que deveria ser gerada |
| attempt_number | integer | Tentativa atual (1-3) |
| status | text | 'pending', 'processing', 'completed', 'failed' |
| last_error | text | Mensagem de erro da última tentativa |
| next_retry_at | timestamptz | Quando fazer próximo retry |

### team_statistics_cache

Cache de estatísticas de times.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| team_id | integer | ID do time na API-Football |
| team_name | text | Nome do time |
| statistics | jsonb | Estatísticas de escanteios |
| cached_at | timestamptz | Quando foi cacheado |
| expires_at | timestamptz | Quando expira (24h) |

---

## 4. Configuração de Cron (Supabase)

As Edge Functions são acionadas via Agendador do Supabase (pg_cron ou similar). A configuração típica:

| Função | Frequência | Horário (BRT) |
|--------|------------|---------------|
| generate-daily-analyses | 1x/dia | 6:00 |
| update-results | a cada 1h | - |
| send-daily-notification | 1x/dia | 7:00 |
| retry-failed-generations | a cada 15min | - |

**Nota:** A configuração exata de cron está no dashboard do Supabase e não está versionada neste repositório.

---

## 5. Fluxo Geral de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORNEREDGE FLOW                              │
└─────────────────────────────────────────────────────────────────┘

1. GENERATE (6:00 BRT)
   ┌──────────────────┐
   │ generate-daily   │──► API-Football
   │ -analyses        │    (busca jogos)
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │  Analisa times   │──► Cache stats
   │  Calcula Odds    │    no banco
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Gera múltiplas   │──► 10 análises
   │ (6 premium,      │    salvas no
   │  4 free,         │    banco
   │  1 superodd)     │
   └──────────────────┘

2. NOTIFY (7:00 BRT)
   ┌──────────────────┐
   │ send-daily-      │──► Expo Push
   │ notification     │    (envia pushes)
   └──────────────────┘

3. UPDATE (a cada 1h)
   ┌──────────────────┐
   │ update-results   │──► API-Football
   │                  │    (busca resultados)
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Atualiza status  │──► correct/
   │ de análises      │    incorrect/void
   └──────────────────┘

4. RETRY (a cada 15min)
   ┌──────────────────┐
   │ retry-failed-    │──► generation
   │ generations     │    retry_queue
   └──────────────────┘
```

---

## 6. Como Testar as Edge Functions

### Via curl (local ou produção):

```bash
# Gerar análises do dia
curl -X POST "https://[PROJECT].supabase.co/functions/v1/generate-daily-analyses?date=2026-05-17" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"

# Atualizar resultados
curl -X POST "https://[PROJECT].supabase.co/functions/v1/update-results" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"

# Enviar notificação
curl -X POST "https://[PROJECT].supabase.co/functions/v1/send-daily-notification" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"

# Atualizar logos
curl -X POST "https://[PROJECT].supabase.co/functions/v1/update-team-logos" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"

# Verificar retries
curl -X POST "https://[PROJECT].supabase.co/functions/v1/retry-failed-generations" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"
```

---

## 7. Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (para Edge Functions) |
| `FOOTBALL_API_KEY` | Chave da API-Football (API-Sports) |

---

*Documento gerado em: 17/05/2026*
*Versão do app: CornerEdge Mobile (React Native / Expo)*