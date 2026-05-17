// @ts-nocheck
/**
 * Team Statistics Cache - Cache em memória para estatísticas de times
 * Reduz chamadas à API armazenando resultados por 24h
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const inMemoryCache = new Map<number, { data: any; expires: number }>();

export class TeamStatsCache {
  private supabase: any;
  private ttlHours: number = 24;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  async get(teamId: number): Promise<any | null> {
    // Verificar cache em memória primeiro
    const memEntry = inMemoryCache.get(teamId);
    if (memEntry && memEntry.expires > Date.now()) {
      console.log(`[TeamStatsCache] Cache hit em memória para team ${teamId}`);
      return memEntry.data;
    }

    // Verificar cache no banco de dados
    if (this.supabase) {
      const { data: cached } = await this.supabase
        .from('team_statistics_cache')
        .select('statistics, expires_at')
        .eq('team_id', teamId)
        .single();

      if (cached && new Date(cached.expires_at) > new Date()) {
        console.log(`[TeamStatsCache] Cache hit no banco para team ${teamId}`);
        inMemoryCache.set(teamId, {
          data: cached.statistics,
          expires: new Date(cached.expires_at).getTime()
        });
        return cached.statistics;
      }
    }

    return null;
  }

  async set(teamId: number, teamName: string, stats: any, ttlHours: number = 24): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const expiresMs = expiresAt.getTime();

    // Armazenar em memória
    inMemoryCache.set(teamId, { data: stats, expires: expiresMs });

    // Armazenar no banco de dados
    if (this.supabase) {
      await this.supabase
        .from('team_statistics_cache')
        .upsert({
          team_id: teamId,
          team_name: teamName,
          statistics: stats,
          cached_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        }, { onConflict: 'team_id' });
    }
  }

  async clear(): Promise<void> {
    inMemoryCache.clear();
    console.log('[TeamStatsCache] Cache em memória limpo');
  }

  async clearExpired(): Promise<number> {
    const now = Date.now();
    let cleared = 0;

    for (const [teamId, entry] of inMemoryCache.entries()) {
      if (entry.expires <= now) {
        inMemoryCache.delete(teamId);
        cleared++;
      }
    }

    // Limpar do banco também
    if (this.supabase) {
      await this.supabase
        .from('team_statistics_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());
    }

    console.log(`[TeamStatsCache] Limpou ${cleared} entradas expiradas`);
    return cleared;
  }
}

export function createTeamStatsCache(supabaseUrl: string, supabaseKey: string): TeamStatsCache {
  const supabase = createClient(supabaseUrl, supabaseKey);
  return new TeamStatsCache(supabase);
}