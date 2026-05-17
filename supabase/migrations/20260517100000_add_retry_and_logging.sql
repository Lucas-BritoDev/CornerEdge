-- ============================================================================
-- CornerEdge - Tabelas de Logging, Cache e Retry Queue
-- Data: 17/05/2026
-- ============================================================================

-- 1. Tabela de Logs de Edge Functions
CREATE TABLE IF NOT EXISTS edge_function_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    execution_time_ms INTEGER,
    status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'timeout')),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edge_function_logs_function_status 
    ON edge_function_logs(function_name, status, created_at DESC);

-- 2. Tabela de Cache de Estatísticas de Times
CREATE TABLE IF NOT EXISTS team_statistics_cache (
    team_id INTEGER PRIMARY KEY,
    team_name TEXT NOT NULL,
    statistics JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_team_statistics_cache_expires 
    ON team_statistics_cache(expires_at);

-- 3. Tabela de Retry de Geração
CREATE TABLE IF NOT EXISTS generation_retry_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_date DATE NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    last_error TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    next_retry_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

CREATE INDEX IF NOT EXISTS idx_generation_retry_queue_status_next_retry 
    ON generation_retry_queue(status, next_retry_at);

-- 4. Adicionar coluna de metadata em corner_analyses (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corner_analyses' AND column_name = 'generation_metadata'
    ) THEN
        ALTER TABLE corner_analyses ADD COLUMN generation_metadata JSONB;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_corner_analyses_generation_metadata 
    ON corner_analyses USING GIN (generation_metadata);

-- 5. Adicionar colunas necessárias para múltiplas (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corner_analyses' AND column_name = 'is_multiple'
    ) THEN
        ALTER TABLE corner_analyses ADD COLUMN is_multiple BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corner_analyses' AND column_name = 'is_superodd'
    ) THEN
        ALTER TABLE corner_analyses ADD COLUMN is_superodd BOOLEAN;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corner_analyses' AND column_name = 'games'
    ) THEN
        ALTER TABLE corner_analyses ADD COLUMN games JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corner_analyses' AND column_name = 'combined_confidence'
    ) THEN
        ALTER TABLE corner_analyses ADD COLUMN combined_confidence INTEGER;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corner_analyses' AND column_name = 'combined_odd'
    ) THEN
        ALTER TABLE corner_analyses ADD COLUMN combined_odd NUMERIC(6,2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corner_analyses' AND column_name = 'strategy_type'
    ) THEN
        ALTER TABLE corner_analyses ADD COLUMN strategy_type TEXT;
    END IF;
END $$;

-- 6. Adicionar coluna status expandida para múltiplas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'corner_analyses' AND column_name = 'tier'
    ) THEN
        ALTER TABLE corner_analyses ADD COLUMN tier TEXT DEFAULT 'free';
    END IF;
END $$;

-- Remover constraint antiga se existir e recriar com novos valores
ALTER TABLE corner_analyses DROP CONSTRAINT IF EXISTS corner_analyses_tier_check;
ALTER TABLE corner_analyses ADD CONSTRAINT corner_analyses_tier_check 
    CHECK (tier IN ('free', 'premium', 'superodd'));

-- Adicionar status expandida para múltiplas
ALTER TABLE corner_analyses DROP CONSTRAINT IF EXISTS corner_analyses_status_check;
ALTER TABLE corner_analyses ADD CONSTRAINT corner_analyses_status_check 
    CHECK (status IN ('pending', 'correct', 'incorrect', 'void'));

-- 7. Criar função para limpar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_team_cache()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM team_statistics_cache 
    WHERE expires_at < NOW();
END;
$$;

-- Agendar limpeza automática de cache (diariamente às 03:00 UTC)
SELECT cron.schedule(
    'corneredge-cleanup-cache',
    '0 3 * * *',
    'SELECT cleanup_expired_team_cache();'
);