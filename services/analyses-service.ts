/**
 * CornerEdge - Analyses Service
 * 
 * Service for fetching corner analyses from Supabase
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { CornerAnalysis, AnalysisWithDetails } from '../types';

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================


/**
 * Fetch today's corner analyses with all related data
 */
export async function fetchTodayAnalyses(): Promise<AnalysisWithDetails[]> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch analyses ordered by created_at (deterministic from backend)
    const { data: analyses, error: analysesError } = await supabase
        .from('corner_analyses')
        .select('*')
        .gte('kickoff_at', today.toISOString())
        .lt('kickoff_at', tomorrow.toISOString())
        .order('created_at', { ascending: false })
        .order('tier', { ascending: true }); // premium first

    if (analysesError) {
        console.error('[AnalysesService] Error fetching analyses:', analysesError);
        throw analysesError;
    }

    if (!analyses || analyses.length === 0) {
        return [];
    }
    
    const analysisIds = analyses.map(a => a.id);

    // Fetch all related data in parallel
    const [robustScenariosResult, distributionResult, teamStatsResult] = await Promise.all([
        supabase
            .from('robust_scenarios')
            .select('*')
            .in('analysis_id', analysisIds)
            .order('threshold', { ascending: true }),
        
        supabase
            .from('statistical_distribution')
            .select('*')
            .in('analysis_id', analysisIds)
            .order('threshold', { ascending: true }),
        
        supabase
            .from('team_statistics')
            .select('*')
            .in('analysis_id', analysisIds)
    ]);

    if (robustScenariosResult.error) {
        console.error('[AnalysesService] Error fetching robust scenarios:', robustScenariosResult.error);
    }
    if (distributionResult.error) {
        console.error('[AnalysesService] Error fetching distribution:', distributionResult.error);
    }
    if (teamStatsResult.error) {
        console.error('[AnalysesService] Error fetching team stats:', teamStatsResult.error);
    }

    // Map related data to analyses maintaining the order from DB
    const analysesWithDetails: AnalysisWithDetails[] = analyses.map(analysis => ({
        ...analysis,
        robust_scenarios: robustScenariosResult.data?.filter(rs => rs.analysis_id === analysis.id) || [],
        statistical_distribution: distributionResult.data?.filter(sd => sd.analysis_id === analysis.id) || [],
        team_statistics: teamStatsResult.data?.filter(ts => ts.analysis_id === analysis.id) || []
    }));

    return analysesWithDetails;
}

/**
 * Fetch analyses for a specific date
 */
export async function fetchAnalysesByDate(date: Date): Promise<AnalysisWithDetails[]> {
    // Usar timezone America/Sao_Paulo (BRT) para consistency com o servidor
    const dateStr = date.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const startOfDay = new Date(`${dateStr}T00:00:00.000-03:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999-03:00`);

    const { data: analyses, error: analysesError } = await supabase
        .from('corner_analyses')
        .select('*')
        .gte('kickoff_at', startOfDay.toISOString())
        .lte('kickoff_at', endOfDay.toISOString())
        .order('created_at', { ascending: false })
        .order('tier', { ascending: true });

    if (analysesError) {
        console.error('[AnalysesService] Error fetching analyses by date:', analysesError);
        throw analysesError;
    }

    if (!analyses || analyses.length === 0) {
        return [];
    }

    const analysisIds = analyses.map(a => a.id);

    const [robustScenariosResult, distributionResult, teamStatsResult] = await Promise.all([
        supabase.from('robust_scenarios').select('*').in('analysis_id', analysisIds),
        supabase.from('statistical_distribution').select('*').in('analysis_id', analysisIds),
        supabase.from('team_statistics').select('*').in('analysis_id', analysisIds)
    ]);

    const analysesWithDetails: AnalysisWithDetails[] = analyses.map(analysis => ({
        ...analysis,
        robust_scenarios: robustScenariosResult.data?.filter(rs => rs.analysis_id === analysis.id) || [],
        statistical_distribution: distributionResult.data?.filter(sd => sd.analysis_id === analysis.id) || [],
        team_statistics: teamStatsResult.data?.filter(ts => ts.analysis_id === analysis.id) || []
    }));

    return analysesWithDetails;
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch today's analyses with caching.
 * Só executa quando `enabled` for true (padrão: sempre).
 * Passe `enabled={!!user}` para aguardar o auth antes de buscar.
 */
export function useTodayAnalyses(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['analyses', 'today'],
        queryFn: fetchTodayAnalyses,
        enabled: options?.enabled !== false, // default true, mas permite desabilitar
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    });
}

/**
 * Hook to fetch analyses by date with caching
 */
export function useAnalysesByDate(date: Date) {
    const dateKey = date.toISOString().split('T')[0];

    return useQuery({
        queryKey: ['analyses', 'date', dateKey],
        queryFn: () => fetchAnalysesByDate(date),
        staleTime: 10 * 60 * 1000,  // 10 minutes
        gcTime: 60 * 60 * 1000,     // 60 minutes
        refetchOnWindowFocus: false,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 6000),
    });
}

/**
 * Calculate hit rate from analyses
 */
export function calculateHitRate(analyses: CornerAnalysis[]): {
    total: number;
    correct: number;
    incorrect: number;
    pending: number;
    hitRate: number;
} {
    const total = analyses.length;
    const correct = analyses.filter(a => a.status === 'correct').length;
    const incorrect = analyses.filter(a => a.status === 'incorrect').length;
    const pending = analyses.filter(a => a.status === 'pending').length;
    
    const hitRate = total > 0 ? (correct / (correct + incorrect)) * 100 : 0;
    
    return {
        total,
        correct,
        incorrect,
        pending,
        hitRate: (correct + incorrect) > 0 ? Math.round(hitRate) : 0,
    };
}

/**
 * Hook to fetch user statistics (last 7 days)
 */
export function useUserStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return useQuery({
        queryKey: ['user-stats', 'last-7-days'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('corner_analyses')
                .select('*')
                .gte('kickoff_at', sevenDaysAgo.toISOString())
                .order('kickoff_at', { ascending: false });

            if (error) {
                console.error('[AnalysesService] Error fetching user stats:', error);
                throw error;
            }

            const analyses = data || [];
            const stats = calculateHitRate(analyses);
            
            return {
                totalAnalyses: stats.total,
                hitRate7Days: stats.hitRate,
                correct: stats.correct,
                incorrect: stats.incorrect,
                pending: stats.pending,
            };
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
