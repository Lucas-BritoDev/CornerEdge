-- ============================================================================
-- CornerEdge - Corrigir Timezone dos Cron Jobs
-- Data: 17/05/2026
-- ============================================================================

-- Remover jobs antigos
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'corneredge-generate-analyses', 
  'corneredge-update-results'
);

-- ============================================================================
-- CORREÇÃO: Os horários devem ser em UTC para corresponder a BRT
-- 
-- Antigo (ERRADO):
--   - generate-analyses: 09:00 UTC = 06:00 BRT (deveria ser 00:00 BRT = 03:00 UTC)
--   - update-results: 02:00 UTC = 23:00 BRT (OK, mas现在是 24/7)
--
-- Novo (CORRETO):
--   - generate-analyses: 03:00 UTC = 00:00 BRT
--   - update-results: 06,09,12,15,18,21 UTC = 03,06,09,12,15,18 BRT (período de jogos)
--   - retry-failed-generations: */10 * * * * (a cada 10 minutos)
-- ============================================================================

-- Agendar geração diária: 00:00 BRT = 03:00 UTC
SELECT cron.schedule(
    'corneredge-generate-analyses',
    '0 3 * * *',
    'SELECT call_generate_analyses();'
);

-- Agendar atualização de resultados: 03,06,09,12,15,18 BRT = 06,09,12,15,18,21 UTC
-- Isso cobre o período principal de jogos (06:00-23:59 BRT)
SELECT cron.schedule(
    'corneredge-update-results',
    '0 6,9,12,15,18,21 * * *',
    'SELECT call_update_results();'
);

-- ============================================================================
-- Adicionar função e cron job para retry de gerações falhadas
-- ============================================================================

-- Função para chamar retry-failed-generations
CREATE OR REPLACE FUNCTION call_retry_failed_generations()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM net.http_post(
        url     := 'https://ehpvnayomnueqhtyuabm.supabase.co/functions/v1/retry-failed-generations',
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocHZuYXlvbW51ZXFodHl1YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDg4NDcsImV4cCI6MjA5MzY4NDg0N30.1IcxyRj8tdDuKxkYgdJi2ou7_2DNEdIix8TCaAnPp9Q'
        ),
        body    := '{}'::jsonb
    );
    RAISE NOTICE '[CornerEdge] retry-failed-generations chamado em %', NOW();
END;
$$;

-- Agendar retry a cada 10 minutos
SELECT cron.schedule(
    'corneredge-retry-failed-generations',
    '*/10 * * * *',
    'SELECT call_retry_failed_generations();'
);

-- Confirmar agendamento
SELECT jobid, jobname, schedule, command 
FROM cron.job 
WHERE jobname LIKE 'corneredge-%';