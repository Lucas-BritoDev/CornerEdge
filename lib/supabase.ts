import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Pegar variáveis de ambiente — prioriza app.config.js extra (funciona em APK/EAS)
const supabaseUrl =
    Constants.expoConfig?.extra?.supabaseUrl ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    '';

const supabaseAnonKey =
    Constants.expoConfig?.extra?.supabaseAnonKey ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Configuração ausente! Verifique .env e app.config.js');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// ─── Tipos do banco CornerEdge ────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'premium';

export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    subscription_tier: SubscriptionTier;
    subscription_expires_at: string | null;
    preferred_language: 'pt' | 'en' | 'es';
    preferred_theme: 'dark' | 'light' | 'system';
    notifications_enabled: boolean;
    timezone: string;
    created_at: string;
    updated_at: string;
}

export interface CornerAnalysis {
    id: string;
    fixture_id: number | null;
    home_team: string;
    away_team: string;
    home_team_logo: string | null;
    away_team_logo: string | null;
    league: string;
    kickoff_at: string;
    confidence: number;
    avg_prediction: number;
    probable_range_min: number;
    probable_range_max: number;
    tier: SubscriptionTier;
    status: 'pending' | 'correct' | 'incorrect';
    actual_corners: number | null;
    published_at: string;
    created_at: string;
    updated_at: string;
}

export interface RobustScenario {
    id: string;
    analysis_id: string;
    threshold: number;
    stability: 'very_stable' | 'stable' | 'moderate';
    probability: number;
    created_at: string;
}

export interface StatisticalDistribution {
    id: string;
    analysis_id: string;
    threshold: number;
    probability: number;
    created_at: string;
}

export interface TeamStatistics {
    id: string;
    analysis_id: string;
    team_type: 'home' | 'away';
    offensive_avg: number | null;
    home_intensity: number | null;
    away_intensity: number | null;
    consistency: number | null;
    pressure_conceded: number | null;
    corners_conceded_avg: number | null;
    created_at: string;
}
