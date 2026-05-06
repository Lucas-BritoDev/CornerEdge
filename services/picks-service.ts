// picks-service.ts
// Camada de dados com CACHE NO CLIENTE usando React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, DailyPick, PickSelection, DailyStats } from '../lib/supabase';
import Constants from 'expo-constants';

// ============================================================================
// QUERY KEYS - Centralizados para fácil invalidação
// ============================================================================

export const picksKeys = {
  all: ['picks'] as const,
  today: () => [...picksKeys.all, 'today'] as const,
  byDate: (date: string) => [...picksKeys.all, 'date', date] as const,
  dates: () => [...picksKeys.all, 'dates'] as const,
  stats: (date: string) => [...picksKeys.all, 'stats', date] as const,
  userStats: () => [...picksKeys.all, 'user-stats'] as const,
  tomorrow: () => [...picksKeys.all, 'tomorrow'] as const,
};

// ============================================================================
// FUNÇÕES BASE (usadas pelos hooks)
// ============================================================================

async function fetchTodayPicksBase(): Promise<DailyPick[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('daily_picks')
        .select(`
            *,
            pick_selections (*)
        `)
        .eq('pick_date', today)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('fetchTodayPicks error:', error.message);
        throw error;
    }
    return (data ?? []) as DailyPick[];
}

async function fetchPicksByDateBase(dateStr: string): Promise<DailyPick[]> {
    const { data, error } = await supabase
        .from('daily_picks')
        .select(`
            *,
            pick_selections (*)
        `)
        .eq('pick_date', dateStr)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('fetchPicksByDate error:', error.message);
        throw error;
    }
    return (data ?? []) as DailyPick[];
}

async function fetchAvailableDatesBase(): Promise<string[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    const { data, error } = await supabase
        .from('daily_picks')
        .select('pick_date')
        .gte('pick_date', thirtyDaysAgo)
        .order('pick_date', { ascending: false });

    if (error) {
        console.error('fetchAvailableDates error:', error.message);
        throw error;
    }

    const unique = [...new Set((data ?? []).map((d: any) => d.pick_date))];
    return unique;
}

async function fetchDailyStatsBase(dateStr: string): Promise<DailyStats | null> {
    const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('stat_date', dateStr)
        .maybeSingle();

    if (error) {
        console.error('fetchDailyStats error:', error.message);
        throw error;
    }
    return data as DailyStats | null;
}

async function fetchUserStatsBase(): Promise<{
    totalPicks: number;
    hitRate7Days: number;
    hitRateAllTime: number;
    roi: number;
}> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    const { data: allPicks } = await supabase
        .from('daily_picks')
        .select('status, combined_odds')
        .gte('pick_date', thirtyDaysAgo)
        .neq('status', 'pending');

    const { data: last7 } = await supabase
        .from('daily_picks')
        .select('status')
        .gte('pick_date', sevenDaysAgo)
        .neq('status', 'pending');

    const total = allPicks?.length ?? 0;
    const won = allPicks?.filter((p: any) => p.status === 'won').length ?? 0;
    const hitRateAllTime = total > 0 ? Math.round((won / total) * 100) : 0;

    const total7 = last7?.length ?? 0;
    const won7 = last7?.filter((p: any) => p.status === 'won').length ?? 0;
    const hitRate7Days = total7 > 0 ? Math.round((won7 / total7) * 100) : 0;

    let roi = 0;
    if (allPicks && total > 0) {
        let profit = 0;
        for (const p of allPicks) {
            if (p.status === 'won') profit += (p.combined_odds - 1);
            else if (p.status === 'lost') profit -= 1;
        }
        roi = Math.round((profit / total) * 100);
    }

    return { totalPicks: total, hitRate7Days, hitRateAllTime, roi };
}

// ============================================================================
// HOOKS COM CACHE - Use estes nos componentes!
// ============================================================================

/**
 * Hook para buscar picks de hoje COM CACHE
 * 
 * ANTES: Cada usuário fazia 1 query ao Supabase
 * DEPOIS: Dados ficam em cache por 5 minutos
 * 
 * Uso:
 * const { data: picks, isLoading, error, refetch } = useTodayPicks();
 */
export function useTodayPicks() {
  return useQuery({
    queryKey: picksKeys.today(),
    queryFn: fetchTodayPicksBase,
    staleTime: 5 * 60 * 1000,        // 5 minutos - dados considerados "frescos"
    gcTime: 30 * 60 * 1000,          // 30 minutos - tempo no cache
    refetchOnWindowFocus: true,      // Busca dados frescos ao voltar pro app
    retry: 2,                        // Tenta 2 vezes se falhar
  });
}

/**
 * Hook para buscar picks por data COM CACHE
 * 
 * Uso:
 * const { data: picks, isLoading } = usePicksByDate('2026-05-05');
 */
export function usePicksByDate(dateStr: string) {
  return useQuery({
    queryKey: picksKeys.byDate(dateStr),
    queryFn: () => fetchPicksByDateBase(dateStr),
    staleTime: 10 * 60 * 1000,       // 10 minutos (dados históricos)
    gcTime: 60 * 60 * 1000,          // 1 hora no cache
    refetchOnWindowFocus: false,
    enabled: !!dateStr,              // Só busca se tiver data
  });
}

/**
 * Hook para buscar datas disponíveis COM CACHE
 * 
 * Uso:
 * const { data: dates } = useAvailableDates();
 */
export function useAvailableDates() {
  return useQuery({
    queryKey: picksKeys.dates(),
    queryFn: fetchAvailableDatesBase,
    staleTime: 15 * 60 * 1000,       // 15 minutos
    gcTime: 60 * 60 * 1000,          // 1 hora
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para buscar estatísticas do usuário COM CACHE
 * 
 * Uso:
 * const { data: stats } = useUserStats();
 */
export function useUserStats() {
  return useQuery({
    queryKey: picksKeys.userStats(),
    queryFn: fetchUserStatsBase,
    staleTime: 10 * 60 * 1000,       // 10 minutos
    gcTime: 30 * 60 * 1000,          // 30 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para buscar estatísticas diárias COM CACHE
 * 
 * Uso:
 * const { data: stats } = useDailyStats('2026-05-05');
 */
export function useDailyStats(dateStr: string) {
  return useQuery({
    queryKey: picksKeys.stats(dateStr),
    queryFn: () => fetchDailyStatsBase(dateStr),
    staleTime: 15 * 60 * 1000,       // 15 minutos
    gcTime: 60 * 60 * 1000,          // 1 hora
    refetchOnWindowFocus: false,
    enabled: !!dateStr,
  });
}

/**
 * Hook para gerar picks (admin)
 * 
 * Uso:
 * const { mutate: generatePicks, isPending } = useGeneratePicks();
 * generatePicks({ force: true });
 */
export function useGeneratePicks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ force = false }: { force?: boolean }) => {
      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const anonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration missing');
      }
      
      const url = `${supabaseUrl}/functions/v1/generate-daily-picks${force ? '?force=true' : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${anonKey}` },
      });
      
      if (!res.ok) throw new Error('Failed to generate picks');
      return res.json();
    },
    onSuccess: () => {
      // Invalida todas as queries de picks para buscar dados frescos
      queryClient.invalidateQueries({ queryKey: picksKeys.all });
    },
  });
}

// ============================================================================
// FUNÇÕES LEGADAS (para compatibilidade - NÃO USE MAIS!)
// ============================================================================

/**
 * @deprecated Use useTodayPicks() hook instead
 */
export async function fetchTodayPicks(): Promise<DailyPick[]> {
    console.warn('⚠️ fetchTodayPicks() is deprecated. Use useTodayPicks() hook instead for automatic caching.');
    return fetchTodayPicksBase();
}

/**
 * @deprecated Use usePicksByDate() hook instead
 */
export async function fetchPicksByDate(dateStr: string): Promise<DailyPick[]> {
    console.warn('⚠️ fetchPicksByDate() is deprecated. Use usePicksByDate() hook instead for automatic caching.');
    return fetchPicksByDateBase(dateStr);
}

/**
 * @deprecated Use useAvailableDates() hook instead
 */
export async function fetchAvailableDates(): Promise<string[]> {
    console.warn('⚠️ fetchAvailableDates() is deprecated. Use useAvailableDates() hook instead for automatic caching.');
    return fetchAvailableDatesBase();
}

/**
 * @deprecated Use useDailyStats() hook instead
 */
export async function fetchDailyStats(dateStr: string): Promise<DailyStats | null> {
    console.warn('⚠️ fetchDailyStats() is deprecated. Use useDailyStats() hook instead for automatic caching.');
    return fetchDailyStatsBase(dateStr);
}

// ─── Fixtures de amanhã ───────────────────────────────────────────────────────

export interface TomorrowFixture {
    id: number;
    homeTeam: string;
    homeLogo?: string;
    awayTeam: string;
    awayLogo?: string;
    league: string;
    leagueId: number;
    kickoffAt: string;
}

export async function fetchTomorrowFixtures(): Promise<TomorrowFixture[]> {
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const anonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !anonKey) {
        console.error('Supabase configuration missing');
        return [];
    }

    try {
        const res = await fetch(`${supabaseUrl}/functions/v1/get-tomorrow-fixtures`, {
            headers: { Authorization: `Bearer ${anonKey}` },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return (json.fixtures ?? []) as TomorrowFixture[];
    } catch (e) {
        console.error('fetchTomorrowFixtures error:', e);
        return [];
    }
}

// ─── Forçar geração de picks (admin) ─────────────────────────────────────────

export async function triggerGeneratePicks(force = false): Promise<{ success: boolean; message?: string }> {
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const anonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !anonKey) {
        return { success: false, message: 'Supabase configuration missing' };
    }    try {
        const url = `${supabaseUrl}/functions/v1/generate-daily-picks${force ? '?force=true' : ''}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${anonKey}` },
        });
        const json = await res.json();
        return { success: res.ok, message: json.message ?? json.error };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
