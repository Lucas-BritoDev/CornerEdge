-- ============================================================================
-- CONFIGURAÇÃO DE CRON JOBS - GOALEDGE
-- ============================================================================
-- 
-- Este script configura os cron jobs necessários para o funcionamento
-- automático do sistema de picks e atualização de resultados.
-- 
-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- 
-- Pré-requisitos:
-- 1. Extensão pg_cron habilitada (Settings > Database > Extensions)
-- 2. Extensão http habilitada (para net.http_post)
-- 3. Service role key configurada
-- 
-- ============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Configurar variável com a service role key
-- IMPORTANTE: Substituir pelo valor real da sua service role key
-- Encontre em: Settings > API > service_role (secret)
DO $$
BEGIN
  PERFORM set_config('app.settings.service_role_key', 'YOUR_SERVICE_ROLE_KEY_HERE', false);
END $$;

-- ============================================================================
-- CRON JOB 1: GERAR PICKS DIÁRIOS
-- ============================================================================
-- Executa: Todos os dias às 03:00 UTC (00:00 BRT - Horário de Brasília)
-- Função: Gera picks para o dia atual (que acabou de começar)
-- Duração: ~2-5 minutos
-- API Calls: ~120 na primeira execução, ~10-20 nas seguintes (cache)
-- ============================================================================

SELECT cron.schedule(
  'generate-daily-picks',
  '0 3 * * *',  -- Cron expression: 03:00 UTC = 00:00 Brasília (UTC-3)
  $$
  SELECT net.http_post(
    url := 'https://pgglewzdzqbisidecndz.supabase.co/functions/v1/generate-daily-picks',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- CRON JOB 2: ATUALIZAR RESULTADOS
-- ============================================================================
-- Executa: A cada 5 minutos
-- Função: Atualiza resultados de jogos que já aconteceram
-- Duração: ~30-60 segundos
-- API Calls: ~30 por execução (1 por jogo pendente)
-- ============================================================================

SELECT cron.schedule(
  'update-results',
  '*/5 * * * *',  -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://pgglewzdzqbisidecndz.supabase.co/functions/v1/update-results',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- CRON JOB 3: LIMPAR CACHE
-- ============================================================================
-- Executa: Todos os dias às 04:00 UTC (01:00 BRT)
-- Função: Remove entradas expiradas do cache
-- Duração: ~10-30 segundos
-- API Calls: 0
-- ============================================================================

SELECT cron.schedule(
  'cleanup-cache',
  '0 4 * * *',  -- Todos os dias às 04:00 UTC (01:00 BRT)
  $$
  SELECT net.http_post(
    url := 'https://pgglewzdzqbisidecndz.supabase.co/functions/v1/cleanup-cache',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- VERIFICAÇÃO E MONITORAMENTO
-- ============================================================================

-- Ver todos os cron jobs configurados
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobid;

-- Ver últimas execuções (últimas 24 horas)
SELECT 
  job_id,
  run_id,
  job_name,
  status,
  return_message,
  start_time,
  end_time,
  (end_time - start_time) AS duration
FROM cron.job_run_details
WHERE start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC
LIMIT 50;

-- Ver estatísticas de execução por job
SELECT 
  j.jobname,
  COUNT(*) AS total_runs,
  COUNT(*) FILTER (WHERE jrd.status = 'succeeded') AS successful_runs,
  COUNT(*) FILTER (WHERE jrd.status = 'failed') AS failed_runs,
  ROUND(
    COUNT(*) FILTER (WHERE jrd.status = 'succeeded')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) AS success_rate_percent,
  AVG(EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time))) AS avg_duration_seconds
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON j.jobid = jrd.job_id
WHERE jrd.start_time > NOW() - INTERVAL '7 days'
GROUP BY j.jobname
ORDER BY j.jobname;

-- ============================================================================
-- COMANDOS ÚTEIS PARA GERENCIAMENTO
-- ============================================================================

-- Desabilitar um cron job temporariamente
-- SELECT cron.unschedule('generate-daily-picks');

-- Reabilitar um cron job
-- SELECT cron.schedule(
--   'generate-daily-picks',
--   '0 2 * * *',
--   $$ ... $$
-- );

-- Executar um job manualmente (para testes)
-- SELECT net.http_post(
--   url := 'https://pgglewzdzqbisidecndz.supabase.co/functions/v1/generate-daily-picks',
--   headers := jsonb_build_object(
--     'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
--     'Content-Type', 'application/json'
--   ),
--   body := '{}'::jsonb
-- );

-- Ver logs de erro de um job específico
-- SELECT 
--   job_name,
--   status,
--   return_message,
--   start_time
-- FROM cron.job_run_details
-- WHERE job_name = 'update-results'
--   AND status = 'failed'
-- ORDER BY start_time DESC
-- LIMIT 10;

-- ============================================================================
-- ALERTAS E NOTIFICAÇÕES (OPCIONAL)
-- ============================================================================

-- Criar função para enviar alerta se job falhar
CREATE OR REPLACE FUNCTION notify_cron_failure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' THEN
    -- Aqui você pode adicionar lógica para enviar email, Slack, etc.
    RAISE WARNING 'Cron job % failed: %', NEW.job_name, NEW.return_message;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para monitorar falhas
DROP TRIGGER IF EXISTS cron_failure_alert ON cron.job_run_details;
CREATE TRIGGER cron_failure_alert
  AFTER INSERT ON cron.job_run_details
  FOR EACH ROW
  WHEN (NEW.status = 'failed')
  EXECUTE FUNCTION notify_cron_failure();

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 
-- 1. TIMEZONE: Todos os horários são em UTC
--    - 03:00 UTC = 00:00 BRT (horário de Brasília -3h) ← GERAR PICKS
--    - 04:00 UTC = 01:00 BRT ← LIMPAR CACHE
-- 
-- 2. CRON EXPRESSIONS:
--    - '0 3 * * *'   = Todos os dias às 03:00 UTC (00:00 Brasília)
--    - '*/5 * * * *' = A cada 5 minutos
--    - '0 */2 * * *' = A cada 2 horas
--    - '0 0 * * 0'   = Todo domingo à meia-noite
-- 
-- 3. MONITORAMENTO:
--    - Verifique cron.job_run_details diariamente
--    - Configure alertas para falhas
--    - Monitore duração das execuções
-- 
-- 4. CUSTOS API:
--    - generate-daily-picks: ~120 calls na 1ª vez, ~10-20 depois
--    - update-results: ~30 calls por execução
--    - Total estimado: ~10.000 calls/dia (dentro do limite free tier)
-- 
-- 5. PERFORMANCE:
--    - generate-daily-picks: 2-5 minutos
--    - update-results: 30-60 segundos
--    - cleanup-cache: 10-30 segundos
-- 
-- ============================================================================
