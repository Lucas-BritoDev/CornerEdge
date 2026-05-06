// @ts-nocheck
// ============================================================================
// CACHE STATISTICS VIEWER
// ============================================================================
// 
// This function provides insights into cache performance:
// - Cache hit rates by type
// - API calls saved
// - Current cache sizes
// - Performance metrics
// 
// Usage: GET /cache-stats?days=7
// 
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") ?? "7");
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    
    // 1. Get cache statistics
    const { data: stats, error: statsError } = await supabase
      .from("cache_statistics")
      .select("*")
      .gte("stat_date", startDate)
      .order("stat_date", { ascending: false });
    
    if (statsError) {
      throw new Error(`Error fetching cache stats: ${statsError.message}`);
    }
    
    // 2. Aggregate by cache type
    const aggregated: Record<string, any> = {};
    
    for (const stat of stats ?? []) {
      const type = stat.cache_type;
      if (!aggregated[type]) {
        aggregated[type] = {
          cache_type: type,
          total_requests: 0,
          cache_hits: 0,
          cache_misses: 0,
          api_calls_saved: 0,
          hit_rate: 0,
        };
      }
      
      aggregated[type].total_requests += stat.total_requests;
      aggregated[type].cache_hits += stat.cache_hits;
      aggregated[type].cache_misses += stat.cache_misses;
      aggregated[type].api_calls_saved += stat.api_calls_saved;
    }
    
    // Calculate hit rates
    for (const type in aggregated) {
      const data = aggregated[type];
      data.hit_rate = data.total_requests > 0
        ? Math.round((data.cache_hits / data.total_requests) * 100)
        : 0;
    }
    
    // 3. Get current cache sizes
    const [teamStatsCount, h2hCount, oddsCount, fixturesCount] = await Promise.all([
      supabase.from("team_stats_cache").select("id", { count: "exact", head: true }),
      supabase.from("h2h_cache").select("id", { count: "exact", head: true }),
      supabase.from("odds_cache").select("id", { count: "exact", head: true }),
      supabase.from("fixture_cache").select("id", { count: "exact", head: true }),
    ]);
    
    // 4. Calculate overall metrics
    const totalRequests = Object.values(aggregated).reduce(
      (sum: number, data: any) => sum + data.total_requests,
      0
    );
    const totalHits = Object.values(aggregated).reduce(
      (sum: number, data: any) => sum + data.cache_hits,
      0
    );
    const totalApiCallsSaved = Object.values(aggregated).reduce(
      (sum: number, data: any) => sum + data.api_calls_saved,
      0
    );
    const overallHitRate = totalRequests > 0
      ? Math.round((totalHits / totalRequests) * 100)
      : 0;
    
    const response = {
      success: true,
      period: {
        days: days,
        start_date: startDate,
        end_date: new Date().toISOString().split("T")[0],
      },
      overall: {
        total_requests: totalRequests,
        cache_hits: totalHits,
        cache_misses: totalRequests - totalHits,
        hit_rate_percentage: overallHitRate,
        api_calls_saved: totalApiCallsSaved,
      },
      by_cache_type: Object.values(aggregated),
      current_cache_sizes: {
        team_stats: teamStatsCount.count ?? 0,
        h2h: h2hCount.count ?? 0,
        odds: oddsCount.count ?? 0,
        fixtures: fixturesCount.count ?? 0,
        total: (
          (teamStatsCount.count ?? 0) +
          (h2hCount.count ?? 0) +
          (oddsCount.count ?? 0) +
          (fixturesCount.count ?? 0)
        ),
      },
      performance_insights: {
        estimated_api_cost_saved: `$${(totalApiCallsSaved * 0.001).toFixed(2)}`, // Assuming $0.001 per API call
        cache_efficiency: overallHitRate >= 80 ? "Excellent" : overallHitRate >= 60 ? "Good" : "Needs Improvement",
        recommendation: overallHitRate < 60
          ? "Consider increasing cache TTL or reviewing cache invalidation strategy"
          : "Cache is performing well",
      },
    };
    
    return new Response(JSON.stringify(response, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Cache stats error:", err);
    return new Response(
      JSON.stringify({ error: err.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
