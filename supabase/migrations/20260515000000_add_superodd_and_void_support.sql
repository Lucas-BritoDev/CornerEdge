-- ============================================================================
-- Migration: Add SuperOdd support and fix status check
-- Date: 2026-05-15
-- ============================================================================

-- Adicionar coluna is_superodd para identificar a múltipla especial
ALTER TABLE corner_analyses 
ADD COLUMN IF NOT EXISTS is_superodd BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN corner_analyses.is_superodd IS 'Indica se esta múltipla é uma SuperOdd (odds mais altas)';

-- Atualizar múltiplas existentes para is_superodd = false
UPDATE corner_analyses SET is_superodd = FALSE WHERE is_multiple = TRUE AND is_superodd IS NULL;

-- Corrigir o CHECK da coluna status para incluir 'void'
-- Primeiro, remover a constraint existente se houver
ALTER TABLE corner_analyses DROP CONSTRAINT IF EXISTS corner_analyses_status_check;

-- Adicionar a constraint corrigida
ALTER TABLE corner_analyses ADD CONSTRAINT corner_analyses_status_check 
CHECK (status IN ('pending', 'correct', 'incorrect', 'void'));

-- Criar índice para is_superodd
CREATE INDEX IF NOT EXISTS idx_corner_analyses_is_superodd ON corner_analyses(is_superodd) WHERE is_superodd = TRUE;