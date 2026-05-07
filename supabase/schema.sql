-- ============================================================================
-- CornerEdge - Database Schema
-- Supabase / PostgreSQL
-- ============================================================================

-- ─── PROFILES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id                      uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email                   text,
    full_name               text,
    avatar_url              text,
    subscription_tier       text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
    subscription_expires_at timestamptz,
    preferred_language      text NOT NULL DEFAULT 'pt' CHECK (preferred_language IN ('pt', 'en', 'es')),
    preferred_theme         text NOT NULL DEFAULT 'dark' CHECK (preferred_theme IN ('dark', 'light', 'system')),
    notifications_enabled   boolean NOT NULL DEFAULT true,
    timezone                text NOT NULL DEFAULT 'America/Sao_Paulo',
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ─── CORNER ANALYSES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS corner_analyses (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id          integer,
    home_team           text NOT NULL,
    away_team           text NOT NULL,
    home_team_logo      text,
    away_team_logo      text,
    league              text NOT NULL,
    kickoff_at          timestamptz NOT NULL,
    confidence          integer NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    avg_prediction      numeric(4,1) NOT NULL,
    probable_range_min  integer NOT NULL,
    probable_range_max  integer NOT NULL,
    tier                text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
    status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'correct', 'incorrect')),
    actual_corners      integer,
    published_at        timestamptz NOT NULL DEFAULT now(),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── ROBUST SCENARIOS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS robust_scenarios (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id uuid NOT NULL REFERENCES corner_analyses ON DELETE CASCADE,
    threshold   integer NOT NULL,
    stability   text NOT NULL CHECK (stability IN ('very_stable', 'stable', 'moderate')),
    probability integer NOT NULL CHECK (probability BETWEEN 0 AND 100),
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── STATISTICAL DISTRIBUTION ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS statistical_distribution (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id uuid NOT NULL REFERENCES corner_analyses ON DELETE CASCADE,
    threshold   integer NOT NULL,
    probability integer NOT NULL CHECK (probability BETWEEN 0 AND 100),
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── TEAM STATISTICS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_statistics (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id          uuid NOT NULL REFERENCES corner_analyses ON DELETE CASCADE,
    team_type            text NOT NULL CHECK (team_type IN ('home', 'away')),
    offensive_avg        numeric(4,1),
    home_intensity       numeric(4,1),
    away_intensity       numeric(4,1),
    consistency          integer,
    pressure_conceded    numeric(4,1),
    corners_conceded_avg numeric(4,1),
    created_at           timestamptz NOT NULL DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_corner_analyses_published_at ON corner_analyses(published_at);
CREATE INDEX IF NOT EXISTS idx_corner_analyses_kickoff_at   ON corner_analyses(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_corner_analyses_fixture_id   ON corner_analyses(fixture_id);
CREATE INDEX IF NOT EXISTS idx_corner_analyses_tier         ON corner_analyses(tier);
CREATE INDEX IF NOT EXISTS idx_corner_analyses_status       ON corner_analyses(status);
CREATE INDEX IF NOT EXISTS idx_robust_scenarios_analysis    ON robust_scenarios(analysis_id);
CREATE INDEX IF NOT EXISTS idx_distribution_analysis        ON statistical_distribution(analysis_id);
CREATE INDEX IF NOT EXISTS idx_team_stats_analysis          ON team_statistics(analysis_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE corner_analyses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE robust_scenarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistical_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_statistics       ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário vê/edita apenas o próprio perfil
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Análises: leitura pública, escrita autenticada
CREATE POLICY "analyses_public_read"  ON corner_analyses       FOR SELECT USING (true);
CREATE POLICY "analyses_auth_write"   ON corner_analyses       FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "analyses_auth_update"  ON corner_analyses       FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "scenarios_public_read" ON robust_scenarios      FOR SELECT USING (true);
CREATE POLICY "scenarios_auth_write"  ON robust_scenarios      FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "dist_public_read"      ON statistical_distribution FOR SELECT USING (true);
CREATE POLICY "dist_auth_write"       ON statistical_distribution FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "stats_public_read"     ON team_statistics       FOR SELECT USING (true);
CREATE POLICY "stats_auth_write"      ON team_statistics       FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ─── TRIGGER: atualiza updated_at automaticamente ────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_analyses_updated_at
    BEFORE UPDATE ON corner_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── TRIGGER: cria perfil automaticamente ao cadastrar ───────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
