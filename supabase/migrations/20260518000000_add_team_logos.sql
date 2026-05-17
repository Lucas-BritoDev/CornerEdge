-- Migration: Add team logo columns
-- Date: 2026-05-18
-- Description: Add home_team_logo and away_team_logo columns to corner_analyses table

-- Add columns for team logos
ALTER TABLE corner_analyses 
ADD COLUMN IF NOT EXISTS home_team_logo TEXT,
ADD COLUMN IF NOT EXISTS away_team_logo TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_corner_analyses_home_team_logo ON corner_analyses(home_team_logo);
CREATE INDEX IF NOT EXISTS idx_corner_analyses_away_team_logo ON corner_analyses(away_team_logo);

-- Comments for documentation
COMMENT ON COLUMN corner_analyses.home_team_logo IS 'URL do logo do time da casa';
COMMENT ON COLUMN corner_analyses.away_team_logo IS 'URL do logo do time visitante';