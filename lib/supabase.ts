import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Pegar variáveis de ambiente do app.config.js
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validar configuração
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration missing!');
    console.error('URL:', supabaseUrl ? 'configured' : 'MISSING');
    console.error('Key:', supabaseAnonKey ? 'configured' : 'MISSING');
    console.error('Check your .env file and app.config.js');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Tipos gerados do banco
export type SubscriptionTier = 'free' | 'premium';

export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    subscription_tier: SubscriptionTier;
    subscription_expires_at: string | null;
    stripe_customer_id: string | null;
    preferred_language: 'pt' | 'en' | 'es';
    preferred_theme: 'dark' | 'light' | 'system';
    notifications_enabled: boolean;
    timezone: string;
    total_picks_tracked: number;
    total_wins: number;
    total_losses: number;
    created_at: string;
    updated_at: string;
}

export interface DailyPick {
    id: string;
    pick_date: string;
    tier: SubscriptionTier;
    combined_odds: number;
    confidence: number;
    status: 'pending' | 'won' | 'lost' | 'void';
    sort_order: number;
    generated_at: string;
    settled_at: string | null;
    pick_selections?: PickSelection[];
}

export interface PickSelection {
    id: string;
    daily_pick_id: string;
    fixture_id: number | null;
    home_team_name: string;
    home_team_logo: string | null;
    away_team_name: string;
    away_team_logo: string | null;
    league_name: string;
    league_logo: string | null;
    market: string;
    bet_id: number | null;
    selection: string;
    odds: number;
    confidence: number;
    kickoff_at: string | null;
    status: 'pending' | 'won' | 'lost' | 'void';
    score_home: number | null;
    score_away: number | null;
    reasons: { pt: string; en: string; es: string } | null;
}

export interface DailyStats {
    id: string;
    stat_date: string;
    total_picks: number;
    free_picks: number;
    premium_picks: number;
    total_won: number;
    total_lost: number;
    total_void: number;
    free_hit_rate: number | null;
    premium_hit_rate: number | null;
    overall_hit_rate: number | null;
    avg_odds: number | null;
}
