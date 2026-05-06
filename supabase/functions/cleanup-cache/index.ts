// @ts-nocheck
// ============================================================================
// CACHE CLEANUP FUNCTION
// ============================================================================
// 
// This function removes expired cache entries to keep the database lean.
// Should be run daily via cron job (e.g., 03:00 UTC)
// 
// Cleans:
// - Expired team_stats_cache entries (> 24h old)
// - Expired h2h_cache entries (> 7 days old)
// - Expired odds_cache entries (> 30 min old)
// - Old api_rate_limits records (> 7 days old)
// - Old cache_statistics records (> 90 days old)
// 
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const now = new Date().toISOString();
    
    console.log("Starting cache cleanup...");
    
    // 1. Clean expired team stats cache
    const { data: teamStatsDeleted, error: teamStatsError } = await supabase
      .from("team_stats_cache")
      .delete()
      .lt("expires_at", now)
      .select("id");
    
    if (teamStatsError) {
      console.error("Error cleaning team_stats_cache:", teamStatsError);
    } else {
      console.log(`✓ Deleted ${teamStatsDeleted?.length ?? 0} expired team_stats_cache entries`);
    }
    
    // 2. Clean expired H2H cache
    const { data: h2hDeleted, error: h2hError } = await supabase
      .from("h2h_cache")
      .delete()
      .lt("expires_at", now)
      .select("id");
    
    if (h2hError) {
      console.error("Error cleaning h2h_cache:", h2hError);
    } else {
      console.log(`✓ Deleted ${h2hDeleted?.length ?? 0} expired h2h_cache entries`);
    }
    
    // 3. Clean expired odds cache
    const { data: oddsDeleted, error: oddsError } = await supabase
      .from("odds_cache")
      .delete()
      .lt("expires_at", now)
      .select("id");
    
    if (oddsError) {
      console.error("Error cleaning odds_cache:", oddsError);
    } else {
      console.log(`✓ Deleted ${oddsDeleted?.length ?? 0} expired odds_cache entries`);
    }
    
    // 4. Clean old rate limit records (keep last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rateLimitsDeleted, error: rateLimitsError } = await supabase
      .from("api_rate_limits")
      .delete()
      .lt("window_end", sevenDaysAgo)
      .select("id");
    
    if (rateLimitsError) {
      console.error("Error cleaning api_rate_limits:", rateLimitsError);
    } else {
      console.log(`✓ Deleted ${rateLimitsDeleted?.length ?? 0} old api_rate_limits entries`);
    }
    
    // 5. Clean old cache statistics (keep last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data: statsDeleted, error: statsError } = await supabase
      .from("cache_statistics")
      .delete()
      .lt("stat_date", ninetyDaysAgo)
      .select("id");
    
    if (statsError) {
      console.error("Error cleaning cache_statistics:", statsError);
    } else {
      console.log(`✓ Deleted ${statsDeleted?.length ?? 0} old cache_statistics entries`);
    }
    
    // 6. Clean old fixture cache (keep last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: fixturesDeleted, error: fixturesError } = await supabase
      .from("fixture_cache")
      .delete()
      .lt("cached_at", thirtyDaysAgo)
      .select("id");
    
    if (fixturesError) {
      console.error("Error cleaning fixture_cache:", fixturesError);
    } else {
      console.log(`✓ Deleted ${fixturesDeleted?.length ?? 0} old fixture_cache entries`);
    }
    
    const summary = {
      success: true,
      timestamp: now,
      deleted: {
        team_stats: teamStatsDeleted?.length ?? 0,
        h2h: h2hDeleted?.length ?? 0,
        odds: oddsDeleted?.length ?? 0,
        rate_limits: rateLimitsDeleted?.length ?? 0,
        cache_stats: statsDeleted?.length ?? 0,
        fixtures: fixturesDeleted?.length ?? 0,
      },
      total_deleted: (
        (teamStatsDeleted?.length ?? 0) +
        (h2hDeleted?.length ?? 0) +
        (oddsDeleted?.length ?? 0) +
        (rateLimitsDeleted?.length ?? 0) +
        (statsDeleted?.length ?? 0) +
        (fixturesDeleted?.length ?? 0)
      ),
    };
    
    console.log("Cache cleanup completed:", summary);
    
    return new Response(JSON.stringify(summary), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Cache cleanup error:", err);
    return new Response(
      JSON.stringify({ error: err.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
