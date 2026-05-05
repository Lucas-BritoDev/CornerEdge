// picks-service.ts
// Camada de dados real — substitui mockData.ts
import { supabase, DailyPick, PickSelection, DailyStats } from '../lib/supabase';

// ─── Picks do dia ────────────────────────────────────────────────────────────

export async function fetchTodayPicks(): Promise<DailyPick[]> {
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
        return [];
    }
    return (data ?? []) as DailyPick[];
}

// ─── Picks por data (resultados) ─────────────────────────────────────────────

export async function fetchPicksByDate(dateStr: string): Promise<DailyPick[]> {
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
        return [];
    }
    return (data ?? []) as DailyPick[];
}

// ─── Datas disponíveis no histórico ──────────────────────────────────────────

export async function fetchAvailableDates(): Promise<string[]> {
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
        return [];
    }

    const unique = [...new Set((data ?? []).map((d: any) => d.pick_date))];
    return unique;
}

// ─── Stats de um dia específico ───────────────────────────────────────────────

export async function fetchDailyStats(dateStr: string): Promise<DailyStats | null> {
    const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('stat_date', dateStr)
        .maybeSingle();

    if (error) {
        console.error('fetchDailyStats error:', error.message);
        return null;
    }
    return data as DailyStats | null;
}

// ─── Stats do usuário (agregado dos últimos 30 dias) ─────────────────────────

export async function fetchUserStats(): Promise<{
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

    // ROI simples: assume stake 1 unidade por pick
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
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

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
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

    try {
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
