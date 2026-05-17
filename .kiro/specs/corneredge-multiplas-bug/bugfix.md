# Bugfix Requirements Document

## Introduction

O sistema CornerEdge parou de gerar múltiplas de forma consistente há 3 dias (desde 14/05/2026). O sistema deveria gerar **10 múltiplas por dia** (6 premium + 4 free), mas está gerando quantidades inconsistentes e incompletas. A investigação revelou múltiplos problemas relacionados:

1. **Edge Functions com timeout (HTTP 546)**: As funções `generate-daily-analyses` e `update-results` excedem o limite de 150 segundos do Supabase
2. **Cron jobs reportam sucesso mas Edge Functions falham**: Os cron jobs executam e retornam "succeeded", mas as Edge Functions retornam erro 546
3. **Geração inconsistente**: Dias recentes mostram apenas 17 múltiplas geradas (15/05) ao invés das 10 esperadas por dia, com múltiplas duplicadas e horários inconsistentes
4. **Falta de validação de sucesso**: O sistema não verifica se as múltiplas foram realmente criadas após a execução do cron job

**Impacto:** Usuários não recebem as análises diárias esperadas, comprometendo a proposta de valor do aplicativo.

## Bug Analysis

### Current Behavior (Defect)

#### 1. Timeout nas Edge Functions

1.1 WHEN o cron job `corneredge-generate-analyses` executa às 00:00 BRT (03:00 UTC) THEN a Edge Function `generate-daily-analyses` retorna HTTP 546 (timeout) após 150 segundos

1.2 WHEN o cron job `corneredge-update-results` executa a cada 3 horas THEN a Edge Function `update-results` retorna HTTP 546 (timeout) após 150 segundos

1.3 WHEN as Edge Functions excedem o timeout THEN o cron job reporta "succeeded" mas nenhuma múltipla é criada no banco de dados

#### 2. Geração Inconsistente de Múltiplas

1.4 WHEN múltiplas são geradas no dia 15/05/2026 THEN o sistema cria 17 múltiplas ao invés das 10 esperadas (6 premium + 4 free)

1.5 WHEN múltiplas são geradas THEN algumas são duplicadas com mesmos jogos mas horários diferentes (ex: 4 múltiplas free criadas às 10:19 e 10:56 para o mesmo dia)

1.6 WHEN múltiplas são geradas THEN algumas contêm apenas 2 jogos ao invés dos 3 esperados para premium

#### 3. Falta de Validação de Sucesso

1.7 WHEN o cron job executa `call_generate_analyses()` THEN não há verificação se as múltiplas foram realmente criadas no banco de dados

1.8 WHEN a Edge Function retorna timeout (546) THEN o sistema não tenta reexecutar ou notificar sobre a falha

#### 4. Configuração de Horários Incorreta

1.9 WHEN o cron job está configurado para executar às 09:00 UTC THEN isso corresponde a 06:00 BRT, não 00:00 BRT como especificado nos requisitos

1.10 WHEN o cron job de atualização está configurado para `0 */3 * * *` THEN ele executa a cada 3 horas, mas deveria executar apenas a cada 3 horas durante o dia (não 24/7)

### Expected Behavior (Correct)

#### 1. Edge Functions Devem Completar Sem Timeout

2.1 WHEN o cron job `corneredge-generate-analyses` executa THEN a Edge Function `generate-daily-analyses` SHALL completar em menos de 150 segundos e retornar HTTP 200

2.2 WHEN o cron job `corneredge-update-results` executa THEN a Edge Function `update-results` SHALL completar em menos de 150 segundos e retornar HTTP 200

2.3 WHEN as Edge Functions completam com sucesso THEN o sistema SHALL criar exatamente 10 múltiplas no banco de dados (6 premium + 4 free)

#### 2. Geração Consistente de Múltiplas

2.4 WHEN múltiplas são geradas para um dia THEN o sistema SHALL criar exatamente 10 múltiplas únicas (6 premium + 4 free)

2.5 WHEN múltiplas premium são geradas THEN cada uma SHALL conter exatamente 3 jogos diferentes

2.6 WHEN múltiplas free são geradas THEN cada uma SHALL conter exatamente 2 jogos diferentes

2.7 WHEN múltiplas são geradas THEN nenhum jogo SHALL aparecer em mais de uma múltipla do mesmo tier (premium ou free)

2.8 WHEN múltiplas são geradas THEN uma das 6 premium SHALL ser uma "super odd" com odd combinada >= 10.0

#### 3. Validação de Sucesso e Recuperação de Falhas

2.9 WHEN o cron job executa `call_generate_analyses()` THEN o sistema SHALL verificar se exatamente 10 múltiplas foram criadas no banco de dados

2.10 WHEN a Edge Function retorna timeout (546) ou erro THEN o sistema SHALL registrar a falha em uma tabela de logs e tentar reexecutar após 5 minutos (máximo 3 tentativas)

2.11 WHEN a geração falha após 3 tentativas THEN o sistema SHALL enviar uma notificação de alerta para os administradores

#### 4. Configuração Correta de Horários

2.12 WHEN o cron job de geração é configurado THEN ele SHALL executar às 00:00 BRT (03:00 UTC), não às 06:00 BRT

2.13 WHEN o cron job de atualização é configurado THEN ele SHALL executar a cada 3 horas apenas durante o período de jogos (06:00 às 23:59 BRT)

### Unchanged Behavior (Regression Prevention)

#### 1. Estrutura de Dados das Múltiplas

3.1 WHEN múltiplas são criadas THEN o sistema SHALL CONTINUE TO armazenar os jogos no campo `games` (JSONB) com a estrutura atual: `[{fixture_id, home_team, away_team, league, kickoff_at, home_logo, away_logo, prediction, strategy, confidence, match_score, expected_total, actual_corners, result, selection_odd, gen_telemetry}]`

3.2 WHEN múltiplas são criadas THEN o sistema SHALL CONTINUE TO calcular `combined_confidence` como a média das confianças individuais dos jogos

3.3 WHEN múltiplas são criadas THEN o sistema SHALL CONTINUE TO calcular `combined_odd` como o produto das odds individuais dos jogos

#### 2. Lógica de Seleção de Jogos

3.4 WHEN jogos são selecionados para múltiplas THEN o sistema SHALL CONTINUE TO usar o `matchScore` como critério principal de qualidade

3.5 WHEN jogos são selecionados para múltiplas premium THEN o sistema SHALL CONTINUE TO exigir `matchScore >= 6` (ou 7 quando há volume suficiente)

3.6 WHEN jogos são selecionados para múltiplas free THEN o sistema SHALL CONTINUE TO usar critérios de `lineEdge` e `matchScore`

3.7 WHEN jogos são selecionados THEN o sistema SHALL CONTINUE TO alternar entre estratégias "over" e "under" dentro de cada múltipla

#### 3. Integração com API de Futebol

3.8 WHEN a Edge Function busca jogos THEN o sistema SHALL CONTINUE TO usar a API-Sports com a chave configurada em `FOOTBALL_API_KEY`

3.9 WHEN a Edge Function busca jogos THEN o sistema SHALL CONTINUE TO filtrar apenas jogos com status "NS" (Not Started) ou "TBD" (To Be Determined)

3.10 WHEN a Edge Function busca odds THEN o sistema SHALL CONTINUE TO usar odds da API quando disponíveis, ou calcular odds implícitas do modelo quando não disponíveis

#### 4. Atualização de Resultados

3.11 WHEN o cron job de atualização executa THEN o sistema SHALL CONTINUE TO atualizar o campo `actual_corners` e `result` para jogos finalizados

3.12 WHEN resultados são atualizados THEN o sistema SHALL CONTINUE TO marcar múltiplas como "correct", "incorrect" ou "void" baseado nos resultados individuais

#### 5. Notificações e Interface

3.13 WHEN múltiplas são geradas THEN o sistema SHALL CONTINUE TO enviar notificações push diárias às 06:00 BRT via `send-daily-notification`

3.14 WHEN múltiplas são exibidas no app THEN o sistema SHALL CONTINUE TO mostrar apenas resultados do dia atual e do dia anterior

3.15 WHEN múltiplas são exibidas THEN o sistema SHALL CONTINUE TO ordenar por `sort_order` para evitar que as maiores odds fiquem sempre no topo
