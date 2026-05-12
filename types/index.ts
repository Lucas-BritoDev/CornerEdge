// Core Types - CornerEdge
// Updated: 2026-05-12

// ====================
// USER TYPES
// ====================

export interface UserSettings {
    theme: 'light' | 'dark';
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    hapticEnabled: boolean;
    language?: string;
}

export interface UserProfile {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    settings: UserSettings;
    createdAt: number;
}

// ====================
// CORNER ANALYSIS TYPES
// ====================

export interface CornerAnalysis {
    id: string;
    home_team: string;
    away_team: string;
    home_team_logo?: string;
    away_team_logo?: string;
    league: string;
    kickoff_at: string;
    confidence: number;
    avg_prediction: number;
    probable_range_min: number;
    probable_range_max: number;
    tier: 'free' | 'premium';
    status: 'pending' | 'correct' | 'incorrect' | 'void';
    strategy_type: 'over' | 'under';
    actual_corners?: number;
    published_at: string;
    created_at: string;
    updated_at: string;
    
    // Relations (populated via joins)
    robust_scenarios?: RobustScenario[];
    statistical_distribution?: StatisticalDistribution[];
    team_statistics?: TeamStatistics[];
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
    offensive_avg?: number;
    home_intensity?: number;
    away_intensity?: number;
    consistency?: number;
    pressure_conceded?: number;
    corners_conceded_avg?: number;
    created_at: string;
}

// ====================
// API RESPONSE TYPES
// ====================

export interface AnalysisWithDetails extends CornerAnalysis {
    robust_scenarios: RobustScenario[];
    statistical_distribution: StatisticalDistribution[];
    team_statistics: TeamStatistics[];
}
