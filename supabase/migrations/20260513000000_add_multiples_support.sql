-- ============================================================================
-- Migration: Add Multiple Bets Support
-- Date: 2026-05-13
-- ============================================================================

-- Adicionar colunas para suporte a múltiplas
ALTER TABLE corner_analyses 
ADD COLUMN IF NOT EXISTS is_multiple BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS games JSONB,
ADD COLUMN IF NOT EXISTS combined_confidence INTEGER,
ADD COLUMN IF NOT EXISTS combined_odd NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS strategy_type TEXT CHECK (strategy_type IN ('over', 'under'));

-- Adicionar índice para múltiplas
CREATE INDEX IF NOT EXISTS idx_corner_analyses_is_multiple ON corner_analyses(is_multiple);

-- Atualizar análises existentes para não serem múltiplas
UPDATE corner_analyses SET is_multiple = FALSE WHERE is_multiple IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN corner_analyses.is_multiple IS 'Indica se esta análise é uma múltipla (3 jogos) ou análise individual';
COMMENT ON COLUMN corner_analyses.games IS 'Array de jogos quando is_multiple=true. Estrutura: [{fixture_id, home_team, away_team, league, kickoff_at, home_logo, away_logo, prediction, strategy, confidence, actual_corners, result}]';
COMMENT ON COLUMN corner_analyses.combined_confidence IS 'Confiança combinada da múltipla (média das confianças individuais)';
COMMENT ON COLUMN corner_analyses.combined_odd IS 'Odd combinada da múltipla';
COMMENT ON COLUMN corner_analyses.strategy_type IS 'Tipo de estratégia: over ou under';
