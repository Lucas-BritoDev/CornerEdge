# CornerEdge Múltiplas Bug Design

## Overview

O sistema CornerEdge apresenta falhas críticas na geração diária de múltiplas de escanteios, resultando em timeouts das Edge Functions, geração inconsistente de múltiplas e falta de validação de sucesso. A correção envolve otimização das Edge Functions para processamento em lote, implementação de sistema de retry com validação, correção dos horários de cron jobs e garantia de geração consistente de exatamente 10 múltiplas por dia (6 premium + 4 free).

**Estratégia de Correção:**
1. Refatorar Edge Functions para processamento em lote/paralelo com limite de tempo
2. Implementar sistema de retry inteligente com validação de sucesso
3. Corrigir configuração de horários dos cron jobs (timezone BRT)
4. Adicionar validação de unicidade e completude das múltiplas geradas
5. Implementar logging estruturado para rastreamento de falhas

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug - quando Edge Functions excedem 150 segundos ou geram múltiplas inconsistentes
- **Property (P)**: O comportamento desejado - Edge Functions completam em <150s e geram exatamente 10 múltiplas únicas por dia
- **Preservation**: Lógica de seleção de jogos, cálculo de odds e estrutura de dados das múltiplas que devem permanecer inalterados
- **Edge Function**: Função serverless executada no Supabase com limite de 150 segundos
- **Cron Job**: Tarefa agendada que invoca Edge Functions em horários específicos
- **Múltipla**: Aposta combinada contendo 2-3 jogos com odd combinada
- **Tier**: Categoria da múltipla (premium = 3 jogos, free = 2 jogos)
- **matchScore**: Métrica de qualidade do jogo (0-10) baseada em estatísticas de escanteios
- **Timeout HTTP 546**: Erro retornado quando Edge Function excede 150 segundos
- **Processamento em Lote**: Técnica de agrupar operações para reduzir chamadas de API
- **Retry com Backoff**: Estratégia de retentar operações falhadas com intervalos crescentes

## Bug Details

### Bug Condition

O bug manifesta-se quando as Edge Functions `generate-daily-analyses` e `update-results` são invocadas pelos cron jobs e excedem o limite de 150 segundos do Supabase, resultando em timeout (HTTP 546) e falha na geração/atualização de múltiplas. Adicionalmente, quando as funções conseguem completar, geram quantidades inconsistentes de múltiplas (17 ao invés de 10) com duplicações e horários incorretos.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type EdgeFunctionExecution
  OUTPUT: boolean
  
  RETURN (input.executionTime > 150_000 AND input.httpStatus == 546)
         OR (input.httpStatus == 200 AND input.multiplesGenerated != 10)
         OR (input.httpStatus == 200 AND hasDuplicateMultiples(input.result))
         OR (input.cronJobStatus == "succeeded" AND input.edgeFunctionStatus == "failed")
END FUNCTION

FUNCTION hasDuplicateMultiples(result)
  INPUT: result containing generated multiples
  OUTPUT: boolean
  
  uniqueFixtureSets = new Set()
  FOR EACH multiple IN result.multiples DO
    fixtureSet = sortedSet(multiple.games.map(g => g.fixture_id))
    IF uniqueFixtureSets.contains(fixtureSet) THEN
      RETURN true
    END IF
    uniqueFixtureSets.add(fixtureSet)
  END FOR
  RETURN false
END FUNCTION
```

### Examples

**Exemplo 1: Timeout na geração diária**
- **Input**: Cron job `corneredge-generate-analyses` executa às 03:00 UTC (00:00 BRT)
- **Comportamento Atual**: Edge Function processa 100 fixtures sequencialmente, cada uma com 3-4 chamadas de API (fixtures, team stats, odds), totalizando ~350 chamadas em ~180 segundos → HTTP 546 timeout
- **Comportamento Esperado**: Edge Function processa fixtures em lotes de 20, com chamadas paralelas e cache, completando em ~120 segundos → HTTP 200 com 10 múltiplas criadas

**Exemplo 2: Geração inconsistente de múltiplas**
- **Input**: Edge Function completa com sucesso no dia 15/05/2026
- **Comportamento Atual**: Sistema gera 17 múltiplas (4 free às 10:19, 4 free às 10:56, 9 premium), algumas com apenas 2 jogos, algumas duplicadas
- **Comportamento Esperado**: Sistema gera exatamente 10 múltiplas únicas (6 premium com 3 jogos, 4 free com 2 jogos), sem duplicações

**Exemplo 3: Cron job reporta sucesso mas Edge Function falha**
- **Input**: Cron job executa e chama Edge Function que retorna timeout
- **Comportamento Atual**: Cron job marca execução como "succeeded" mas nenhuma múltipla é criada no banco
- **Comportamento Esperado**: Sistema detecta falha da Edge Function, registra erro em tabela de logs, tenta reexecutar após 5 minutos

**Exemplo 4: Horário incorreto de execução**
- **Input**: Cron job configurado com `0 9 * * *` (09:00 UTC)
- **Comportamento Atual**: Executa às 06:00 BRT ao invés de 00:00 BRT
- **Comportamento Esperado**: Cron job configurado com `0 3 * * *` (03:00 UTC = 00:00 BRT)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Estrutura de dados das múltiplas (campo `games` JSONB com fixture_id, teams, odds, etc.)
- Cálculo de `combined_confidence` como média das confianças individuais
- Cálculo de `combined_odd` como produto das odds individuais
- Lógica de seleção de jogos baseada em `matchScore`, `lineEdge` e `confidence`
- Critérios de qualidade para premium (matchScore >= 6) e free (lineEdge + matchScore)
- Alternância entre estratégias "over" e "under" dentro de cada múltipla
- Integração com API-Sports para buscar fixtures, odds e estatísticas
- Filtro de jogos com status "NS" ou "TBD"
- Atualização de resultados com campos `actual_corners` e `result`
- Notificações push diárias às 06:00 BRT
- Interface de exibição de múltiplas (ordenação por `sort_order`, filtro por data)

**Scope:**
Todas as operações que NÃO envolvem a execução das Edge Functions (timeout, retry, validação) ou a configuração dos cron jobs devem permanecer completamente inalteradas. Isso inclui:
- Toda a lógica de análise de escanteios (Poisson, shrinkage, baseline por liga)
- Cálculo de odds implícitas quando API não retorna mercado de cantos
- Estrutura das tabelas do banco de dados
- Lógica de negócio da aplicação mobile

## Hypothesized Root Cause

Baseado na análise do código das Edge Functions e nos requisitos, as causas mais prováveis são:

### 1. **Processamento Sequencial Excessivo**
A Edge Function `generate-daily-analyses` processa até 100 fixtures sequencialmente, com múltiplas chamadas de API por fixture:
- `fetchFromAPI(/fixtures)` para buscar jogos do dia
- `analyzeTeamCorners()` para cada time (2 por fixture) → `fetchFromAPI(/fixtures?team=X&last=15)` + `fetchFromAPI(/fixtures/statistics)` para cada jogo histórico
- `fetchFromAPI(/odds?fixture=X)` para cada fixture
- Delays de 55-200ms entre chamadas

**Cálculo estimado**: 100 fixtures × (2 teams × 15 historical matches × 2 API calls + 1 odds call) = ~6.100 chamadas de API sequenciais → facilmente excede 150 segundos

### 2. **Falta de Limite de Tempo e Processamento em Lote**
O código não implementa:
- Limite de tempo para interromper processamento antes do timeout
- Processamento em lote (batch) de fixtures
- Paralelização de chamadas de API independentes
- Cache de dados de times já processados entre execuções

### 3. **Lógica de Geração de Múltiplas Não Determinística**
A função `buildCornerMultiples()` usa `Math.random()` para embaralhar candidatos e alternar entre over/under, resultando em:
- Múltiplas diferentes a cada execução (mesmo com mesmos jogos disponíveis)
- Possibilidade de duplicações se a função for chamada múltiplas vezes
- Dificuldade de garantir exatamente 10 múltiplas únicas

### 4. **Ausência de Validação de Sucesso**
O sistema não verifica:
- Se exatamente 10 múltiplas foram criadas no banco após execução
- Se as múltiplas são únicas (sem duplicação de conjuntos de fixtures)
- Se cada múltipla tem o número correto de jogos (3 para premium, 2 para free)
- Se a Edge Function completou com sucesso antes do cron job reportar "succeeded"

### 5. **Configuração Incorreta de Timezone nos Cron Jobs**
Os cron jobs estão configurados com horários UTC sem considerar o fuso BRT:
- `corneredge-generate-analyses`: `0 9 * * *` (09:00 UTC = 06:00 BRT) ao invés de `0 3 * * *` (03:00 UTC = 00:00 BRT)
- `corneredge-update-results`: `0 */3 * * *` executa 24/7 ao invés de apenas durante período de jogos

## Correctness Properties

Property 1: Bug Condition - Edge Functions Completam Sem Timeout

_For any_ execução de Edge Function onde o cron job invoca `generate-daily-analyses` ou `update-results`, a função SHALL completar em menos de 150 segundos e retornar HTTP 200, criando exatamente 10 múltiplas únicas no banco de dados (6 premium + 4 free) sem duplicações.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

Property 2: Preservation - Lógica de Seleção e Estrutura de Dados

_For any_ múltipla gerada após a correção, o sistema SHALL continuar usando a mesma lógica de seleção de jogos (matchScore, lineEdge, confidence), a mesma estrutura de dados JSONB para o campo `games`, os mesmos cálculos de `combined_confidence` e `combined_odd`, e a mesma integração com API-Sports, preservando todo o comportamento existente de análise de escanteios e exibição de resultados.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15**

## Fix Implementation

### Changes Required

Assumindo que nossa análise de causa raiz está correta, as seguintes mudanças são necessárias:

#### **Arquivo 1**: `supabase/functions/generate-daily-analyses/index.ts`

**Mudanças Específicas**:

1. **Implementar Processamento em Lote com Limite de Tempo**
   - Adicionar constante `MAX_EXECUTION_TIME = 140_000` (140 segundos, margem de 10s)
   - Adicionar função `checkTimeRemaining(startTime)` que retorna tempo restante
   - Modificar loop principal para processar fixtures em lotes de 20
   - Interromper processamento se tempo restante < 30 segundos

2. **Paralelizar Chamadas de API Independentes**
   - Usar `Promise.all()` para buscar estatísticas de múltiplos times simultaneamente
   - Limitar paralelização a 5 chamadas simultâneas para evitar rate limiting
   - Implementar cache em memória para dados de times já processados

3. **Otimizar Análise de Times**
   - Reduzir `last=15` para `last=5` em `analyzeTeamCorners()` (suficiente para média ponderada)
   - Implementar cache de 24h para estatísticas de times (armazenar em tabela `team_statistics_cache`)
   - Pular chamada de odds se fixture já tem odds em cache

4. **Tornar Geração de Múltiplas Determinística**
   - Remover `Math.random()` de `buildCornerMultiples()`
   - Ordenar candidatos por critério fixo (matchScore desc, confidence desc, fixture_id asc)
   - Implementar algoritmo determinístico de seleção de jogos para múltiplas
   - Adicionar validação de unicidade antes de inserir no banco

5. **Adicionar Validação de Sucesso**
   - Após inserção no banco, contar múltiplas criadas para o dia
   - Se count != 10, registrar erro e retornar HTTP 500
   - Adicionar campo `generation_metadata` JSONB com timestamp, versão, tempo de execução

6. **Implementar Logging Estruturado**
   - Criar tabela `edge_function_logs` (id, function_name, execution_time, status, error_message, metadata, created_at)
   - Registrar início, progresso (a cada lote) e fim da execução
   - Registrar erros com stack trace completo

#### **Arquivo 2**: `supabase/functions/update-results/index.ts`

**Mudanças Específicas**:

1. **Implementar Processamento em Lote**
   - Processar análises pendentes em lotes de 10
   - Adicionar limite de tempo de 140 segundos
   - Paralelizar busca de fixtures e estatísticas (máximo 5 simultâneas)

2. **Otimizar Chamadas de API**
   - Buscar múltiplos fixtures em uma única chamada quando possível
   - Implementar cache de resultados já processados
   - Reduzir delay entre chamadas de 200ms para 100ms

3. **Adicionar Validação de Atualização**
   - Contar análises atualizadas vs esperadas
   - Registrar em `edge_function_logs` se houver discrepância
   - Retornar HTTP 500 se taxa de falha > 20%

#### **Arquivo 3**: `supabase/migrations/YYYYMMDDHHMMSS_add_retry_and_logging.sql` (novo)

**Mudanças Específicas**:

1. **Criar Tabela de Logs de Edge Functions**
```sql
CREATE TABLE edge_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  execution_time_ms INTEGER,
  status TEXT NOT NULL, -- 'started', 'in_progress', 'completed', 'failed', 'timeout'
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_edge_function_logs_function_status 
  ON edge_function_logs(function_name, status, created_at DESC);
```

2. **Criar Tabela de Cache de Estatísticas de Times**
```sql
CREATE TABLE team_statistics_cache (
  team_id INTEGER PRIMARY KEY,
  team_name TEXT NOT NULL,
  statistics JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_team_statistics_cache_expires 
  ON team_statistics_cache(expires_at);
```

3. **Criar Tabela de Retry de Geração**
```sql
CREATE TABLE generation_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_date DATE NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  last_error TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  next_retry_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

CREATE INDEX idx_generation_retry_queue_status_next_retry 
  ON generation_retry_queue(status, next_retry_at);
```

4. **Adicionar Coluna de Metadata em corner_analyses**
```sql
ALTER TABLE corner_analyses 
ADD COLUMN IF NOT EXISTS generation_metadata JSONB;

CREATE INDEX idx_corner_analyses_generation_metadata 
  ON corner_analyses USING GIN (generation_metadata);
```

#### **Arquivo 4**: `supabase/functions/retry-failed-generations/index.ts` (novo)

**Mudanças Específicas**:

1. **Criar Edge Function de Retry**
   - Buscar entradas em `generation_retry_queue` com `status='pending'` e `next_retry_at <= NOW()`
   - Para cada entrada, invocar `generate-daily-analyses` com parâmetro `date`
   - Se sucesso (10 múltiplas criadas), marcar como `completed`
   - Se falha e `attempt_number < 3`, incrementar tentativa e agendar próximo retry (backoff exponencial: 5min, 15min, 30min)
   - Se falha e `attempt_number >= 3`, marcar como `failed` e enviar notificação de alerta

2. **Implementar Validação de Sucesso**
   - Após invocar `generate-daily-analyses`, contar múltiplas no banco para a data
   - Validar que são exatamente 10 múltiplas únicas
   - Validar que 6 são premium (3 jogos) e 4 são free (2 jogos)

#### **Arquivo 5**: Configuração de Cron Jobs (Supabase Dashboard ou CLI)

**Mudanças Específicas**:

1. **Corrigir Horário de Geração Diária**
   - **Atual**: `0 9 * * *` (09:00 UTC = 06:00 BRT)
   - **Novo**: `0 3 * * *` (03:00 UTC = 00:00 BRT)
   - **Comando**: Atualizar via Supabase Dashboard → Edge Functions → Cron Jobs

2. **Corrigir Horário de Atualização de Resultados**
   - **Atual**: `0 */3 * * *` (a cada 3 horas, 24/7)
   - **Novo**: `0 6,9,12,15,18,21 * * *` (às 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC = 03:00, 06:00, 09:00, 12:00, 15:00, 18:00 BRT)
   - **Justificativa**: Jogos de futebol ocorrem principalmente entre 06:00 e 23:59 BRT, não há necessidade de atualizar de madrugada

3. **Adicionar Cron Job de Retry**
   - **Novo**: `*/10 * * * *` (a cada 10 minutos)
   - **Função**: `retry-failed-generations`
   - **Justificativa**: Verificar fila de retry a cada 10 minutos para reprocessar falhas rapidamente

#### **Arquivo 6**: `supabase/functions/_shared/batch-processor.ts` (novo)

**Mudanças Específicas**:

1. **Criar Utilitário de Processamento em Lote**
```typescript
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize: number;
    maxConcurrent: number;
    delayMs: number;
    timeoutMs?: number;
  }
): Promise<R[]> {
  // Implementar lógica de processamento em lote com:
  // - Divisão em lotes de tamanho batchSize
  // - Paralelização limitada a maxConcurrent
  // - Delay entre lotes
  // - Interrupção se timeout for atingido
}
```

2. **Criar Utilitário de Cache**
```typescript
export class TeamStatsCache {
  async get(teamId: number): Promise<any | null>;
  async set(teamId: number, stats: any, ttlHours: number): Promise<void>;
  async clear(): Promise<void>;
}
```

3. **Criar Utilitário de Logging**
```typescript
export class EdgeFunctionLogger {
  constructor(functionName: string);
  async logStart(metadata?: any): Promise<string>; // retorna log_id
  async logProgress(logId: string, message: string, metadata?: any): Promise<void>;
  async logComplete(logId: string, metadata?: any): Promise<void>;
  async logError(logId: string, error: Error, metadata?: any): Promise<void>;
}
```

## Testing Strategy

### Validation Approach

A estratégia de testes segue uma abordagem de duas fases: primeiro, executar testes exploratórios no código UNFIXED para confirmar os timeouts e inconsistências; depois, verificar que a correção resolve os problemas e preserva o comportamento existente.

### Exploratory Bug Condition Checking

**Goal**: Demonstrar o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotizar.

**Test Plan**: 
1. Executar Edge Function `generate-daily-analyses` localmente com Supabase CLI (`supabase functions serve`)
2. Invocar função com data específica e medir tempo de execução
3. Observar timeouts e padrões de geração inconsistente
4. Analisar logs para identificar gargalos (chamadas de API sequenciais, falta de cache)

**Test Cases**:

1. **Timeout Test - Alto Volume de Fixtures**
   - **Setup**: Invocar função para data com ~80-100 fixtures disponíveis
   - **Expected**: Timeout após 150 segundos, HTTP 546 (will fail on unfixed code)
   - **Validation**: Medir tempo de execução, contar chamadas de API, verificar que nenhuma múltipla foi criada

2. **Inconsistent Generation Test**
   - **Setup**: Invocar função múltiplas vezes para mesma data (com `force=true`)
   - **Expected**: Quantidades diferentes de múltiplas geradas (ex: 8, 12, 17) com duplicações (will fail on unfixed code)
   - **Validation**: Comparar conjuntos de fixtures entre execuções, identificar duplicações

3. **Cron Job vs Edge Function Status Test**
   - **Setup**: Executar cron job via Supabase Dashboard e observar logs
   - **Expected**: Cron job reporta "succeeded" mas Edge Function retorna 546 e nenhuma múltipla é criada (will fail on unfixed code)
   - **Validation**: Comparar status do cron job com status da Edge Function e count de múltiplas no banco

4. **Timezone Configuration Test**
   - **Setup**: Verificar configuração atual de cron jobs no Supabase Dashboard
   - **Expected**: Cron job configurado para 09:00 UTC ao invés de 03:00 UTC (will fail on unfixed code)
   - **Validation**: Comparar horário configurado com horário esperado (00:00 BRT = 03:00 UTC)

**Expected Counterexamples**:
- Edge Function excede 150 segundos com ~80+ fixtures devido a processamento sequencial
- Múltiplas duplicadas geradas devido a `Math.random()` em `buildCornerMultiples()`
- Cron job reporta sucesso mas Edge Function falha (falta de validação)
- Possíveis causas: processamento sequencial excessivo, falta de cache, lógica não determinística, ausência de validação

### Fix Checking

**Goal**: Verificar que para todas as execuções onde a condição de bug se aplica (alto volume de fixtures, múltiplas invocações), a função corrigida produz o comportamento esperado.

**Pseudocode:**
```
FOR ALL execution WHERE isBugCondition(execution) DO
  result := generate_daily_analyses_fixed(execution.date)
  ASSERT result.executionTime < 150_000
  ASSERT result.httpStatus == 200
  ASSERT result.multiplesGenerated == 10
  ASSERT result.premiumCount == 6
  ASSERT result.freeCount == 4
  ASSERT NOT hasDuplicateMultiples(result)
  ASSERT allPremiumHave3Games(result)
  ASSERT allFreeHave2Games(result)
END FOR
```

**Test Cases**:

1. **Performance Test - High Volume**
   - Invocar função corrigida para data com 100 fixtures
   - Validar tempo de execução < 140 segundos
   - Validar HTTP 200 e 10 múltiplas criadas

2. **Determinism Test**
   - Invocar função corrigida 5 vezes para mesma data (com `force=true`)
   - Validar que todas as execuções geram as mesmas 10 múltiplas (mesmos conjuntos de fixtures)

3. **Validation Test**
   - Invocar função corrigida e verificar `generation_metadata`
   - Validar que metadata contém timestamp, versão, tempo de execução
   - Validar que função retorna erro se count != 10

4. **Retry Test**
   - Simular falha na primeira execução (ex: desabilitar API temporariamente)
   - Validar que entrada é criada em `generation_retry_queue`
   - Validar que função de retry reprocessa após 5 minutos
   - Validar que após sucesso, entrada é marcada como `completed`

### Preservation Checking

**Goal**: Verificar que para todas as execuções onde a condição de bug NÃO se aplica (baixo volume de fixtures, lógica de seleção de jogos, estrutura de dados), a função corrigida produz o mesmo resultado que a função original.

**Pseudocode:**
```
FOR ALL execution WHERE NOT isBugCondition(execution) DO
  ASSERT selectionLogic_original(execution) == selectionLogic_fixed(execution)
  ASSERT dataStructure_original(execution) == dataStructure_fixed(execution)
  ASSERT oddsCalculation_original(execution) == oddsCalculation_fixed(execution)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera muitos casos de teste automaticamente através do domínio de entrada
- Captura edge cases que testes unitários manuais podem perder
- Fornece garantias fortes de que o comportamento permanece inalterado para todas as entradas não-buggy

**Test Plan**: Observar comportamento no código UNFIXED primeiro para lógica de seleção de jogos e estrutura de dados, depois escrever testes baseados em propriedades capturando esse comportamento.

**Test Cases**:

1. **Selection Logic Preservation**
   - Observar no código unfixed: jogos com matchScore >= 6 são selecionados para premium
   - Escrever teste: para qualquer conjunto de fixtures, jogos selecionados para premium devem ter matchScore >= 6
   - Validar que código fixed mantém esse critério

2. **Data Structure Preservation**
   - Observar no código unfixed: campo `games` é JSONB com estrutura específica
   - Escrever teste: para qualquer múltipla gerada, validar que estrutura de `games` é idêntica
   - Validar que código fixed não altera estrutura

3. **Odds Calculation Preservation**
   - Observar no código unfixed: `combined_odd` é produto das odds individuais
   - Escrever teste: para qualquer múltipla, validar que `combined_odd` = product(games.map(g => g.selection_odd))
   - Validar que código fixed mantém esse cálculo

4. **API Integration Preservation**
   - Observar no código unfixed: chamadas para API-Sports com headers específicos
   - Escrever teste: para qualquer fixture, validar que dados retornados pela API são processados da mesma forma
   - Validar que código fixed não altera integração

### Unit Tests

- Testar função `processBatch()` com diferentes tamanhos de lote e concorrência
- Testar função `checkTimeRemaining()` com diferentes tempos de início
- Testar função `buildCornerMultiples()` determinística (sem `Math.random()`)
- Testar validação de unicidade de múltiplas
- Testar cache de estatísticas de times (get, set, expiration)
- Testar logging estruturado (start, progress, complete, error)

### Property-Based Tests

- Gerar conjuntos aleatórios de fixtures e verificar que função sempre gera exatamente 10 múltiplas únicas
- Gerar diferentes volumes de fixtures (10, 50, 100) e verificar que tempo de execução < 150s
- Gerar múltiplas execuções para mesma data e verificar determinismo (mesmas múltiplas geradas)
- Gerar fixtures com diferentes matchScores e verificar que critérios de seleção são preservados

### Integration Tests

- Testar fluxo completo: cron job → Edge Function → banco de dados → validação
- Testar fluxo de retry: falha → queue → retry → sucesso
- Testar fluxo de atualização: geração → atualização de resultados → status correto
- Testar integração com API-Sports: rate limiting, cache, fallback para odds implícitas
- Testar notificações: geração → notificação push às 06:00 BRT
