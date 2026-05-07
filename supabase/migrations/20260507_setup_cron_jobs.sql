-- ============================================================================
-- CornerEdge - Configuração de Cron Jobs
-- Projeto: ehpvnayomnueqhtyuabm
-- ============================================================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função: chamar generate-daily-analyses
CREATE OR REPLACE FUNCTION call_generate_analyses()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM net.http_post(
        url     := 'https://ehpvnayomnueqhtyuabm.supabase.co/functions/v1/generate-daily-analyses',
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocHZuYXlvbW51ZXFodHl1YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDg4NDcsImV4cCI6MjA5MzY4NDg0N30.1IcxyRj8tdDuKxkYgdJi2ou7_2DNEdIix8TCaAnPp9Q'
        ),
        body    := '{}'::jsonb
    );
    RAISE NOTICE '[CornerEdge] generate-daily-analyses chamado em %', NOW();
END;
$$;

-- Função: chamar update-results
CREATE OR REPLACE FUNCTION call_update_results()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM net.http_post(
        url     := 'https://ehpvnayomnueqhtyuabm.supabase.co/functions/v1/update-results',
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocHZuYXlvbW51ZXFodHl1YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDg4NDcsImV4cCI6MjA5MzY4NDg0N30.1IcxyRj8tdDuKxkYgdJi2ou7_2DNEdIix8TCaAnPp9Q'
        ),
        body    := '{}'::jsonb
    );
    RAISE NOTICE '[CornerEdge] update-results chamado em %', NOW();
END;
$$;

-- Remover jobs antigos se existirem
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('corneredge-generate-analyses', 'corneredge-update-results');

-- Agendar geração diária: 06:00 BRT = 09:00 UTC
SELECT cron.schedule(
    'corneredge-generate-analyses',
    '0 9 * * *',
    'SELECT call_generate_analyses();'
);

-- Agendar atualização de resultados: 23:00 BRT = 02:00 UTC
SELECT cron.schedule(
    'corneredge-update-results',
    '0 2 * * *',
    'SELECT call_update_results();'
);
