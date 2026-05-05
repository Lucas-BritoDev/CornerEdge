-- GoalEdge Database Schema
-- Supabase / PostgreSQL
-- Version 1.0 - May 2026

-- ===========================================
-- ENUMS
-- ===========================================
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
CREATE TYPE pick_status AS ENUM ('pending', 'green', 'red', 'void');

-- ===========================================
-- TABLE: users
-- ===========================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    google_play_token TEXT,
    push_token TEXT,
    preferred_language TEXT DEFAULT 'pt' CHECK (preferred_language IN ('pt', 'en', 'es')),
    preferred_theme TEXT DEFAULT 'dark' CHECK (preferred_theme IN ('dark', 'light', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ===========================================
-- TABLE: daily_picks
-- ===========================================
CREATE TABLE public.daily_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')),
    combined_odd NUMERIC(5,2) NOT NULL,
    confidence_avg NUMERIC(5,2) NOT NULL,
    status pick_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.daily_picks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read daily_picks" ON public.daily_picks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage daily_picks" ON public.daily_picks
    FOR ALL USING (auth.role() = 'service_role');

-- Index
CREATE INDEX idx_daily_picks_date ON daily_picks(date);
CREATE INDEX idx_daily_picks_tier ON daily_picks(tier);

-- ===========================================
-- TABLE: pick_selections
-- ===========================================
CREATE TABLE public.pick_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_pick_id UUID REFERENCES daily_picks(id) ON DELETE CASCADE,
    fixture_id INTEGER NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    league_name TEXT NOT NULL,
    league_id INTEGER NOT NULL,
    market TEXT NOT NULL,
    market_bet_id INTEGER NOT NULL,
    odd NUMERIC(5,2) NOT NULL,
    confidence_score NUMERIC(5,2) NOT NULL,
    reasons JSONB NOT NULL DEFAULT '{}',
    status pick_status DEFAULT 'pending',
    kickoff_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pick_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read pick_selections" ON public.pick_selections
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage pick_selections" ON public.pick_selections
    FOR ALL USING (auth.role() = 'service_role');

-- Index
CREATE INDEX idx_pick_selections_daily_pick ON pick_selections(daily_pick_id);
CREATE INDEX idx_pick_selections_fixture ON pick_selections(fixture_id);
CREATE INDEX idx_pick_selections_status ON pick_selections(status);
CREATE INDEX idx_pick_selections_kickoff ON pick_selections(kickoff_at);

-- ===========================================
-- TABLE: fixture_cache
-- ===========================================
CREATE TABLE public.fixture_cache (
    fixture_id INTEGER PRIMARY KEY,
    data JSONB,
    odds_data JSONB,
    stats_data JSONB,
    h2h_data JSONB,
    injuries_data JSONB,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fixture_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read fixture_cache" ON public.fixture_cache
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage fixture_cache" ON public.fixture_cache
    FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- TABLE: daily_stats
-- ===========================================
CREATE TABLE public.daily_stats (
    date DATE PRIMARY KEY,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')),
    total_picks INTEGER DEFAULT 0,
    green_picks INTEGER DEFAULT 0,
    red_picks INTEGER DEFAULT 0,
    hit_rate NUMERIC(5,2),
    roi NUMERIC(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read daily_stats" ON public.daily_stats
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage daily_stats" ON public.daily_stats
    FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- TABLE: leagues (cached)
-- ===========================================
CREATE TABLE public.leagues (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT,
    logo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can read leagues" ON public.leagues
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage leagues" ON public.leagues
    FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- TRIGGERS
-- ===========================================
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_picks_updated_at
    BEFORE UPDATE ON daily_picks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pick_selections_updated_at
    BEFORE UPDATE ON pick_selections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at
    BEFORE UPDATE ON daily_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- SEED LEAGUES (API-Football IDs)
-- ===========================================
INSERT INTO public.leagues (id, name, country) VALUES
    (39, 'Premier League', 'England'),
    (140, 'La Liga', 'Spain'),
    (135, 'Serie A', 'Italy'),
    (78, 'Bundesliga', 'Germany'),
    (61, 'Ligue 1', 'France'),
    (71, 'Brasileirão Série A', 'Brazil'),
    (2, 'UEFA Champions League', 'Europe'),
    (94, 'Primeira Liga', 'Portugal'),
    (88, 'Eredivisie', 'Netherlands'),
    (144, 'Belgian Pro League', 'Belgium'),
    (203, 'Süper Lig', 'Turkey'),
    (253, 'MLS', 'USA'),
    (128, 'Liga Profesional', 'Argentina'),
    (307, 'Saudi Pro League', 'Saudi Arabia'),
    (179, 'Scottish Premiership', 'Scotland')
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- FUNCTIONS (Helper)
-- ===========================================
-- Get user's subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_id UUID)
RETURNS TABLE(is_premium BOOLEAN, tier TEXT, expires_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE WHEN u.subscription_tier = 'premium' AND (u.subscription_expires_at IS NULL OR u.subscription_expires_at > NOW())
        THEN true ELSE false END,
        u.subscription_tier::TEXT,
        u.subscription_expires_at
    FROM users u WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate daily hit rate
CREATE OR REPLACE FUNCTION calculate_daily_hit_rate(p_date DATE, p_tier TEXT)
RETURNS NUMERIC(5,2) AS $$
DECLARE
    v_total INTEGER;
    v_green INTEGER;
BEGIN
    SELECT COUNT(*), SUM(CASE WHEN status = 'green' THEN 1 ELSE 0 END)
    INTO v_total, v_green
    FROM daily_picks
    WHERE date = p_date AND tier = p_tier;
    
    IF v_total IS NULL OR v_total = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND((v_green::NUMERIC / v_total::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- REAL-TIME SUBSCRIPTIONS
-- ===========================================
REPLICA IDENTITY TABLE daily_picks;
REPLICA IDENTITY TABLE pick_selections;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE daily_picks;
ALTER PUBLICATION supabase_realtime ADD TABLE pick_selections;

-- ===========================================
-- NOTES
-- ===========================================
-- pg_cron extension must be enabled in Supabase dashboard
-- API-Football key must be stored in Supabase Vault
-- Setup Edge Functions for pick generation
-- Set up Stripe and Google Play webhooks