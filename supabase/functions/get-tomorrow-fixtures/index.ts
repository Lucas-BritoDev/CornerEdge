// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY") ?? "1a896aad078a4eec7ab7121281bcd5ec";
const LEAGUE_IDS = [39, 140, 135, 78, 61, 71, 2, 3, 94, 88];
const API_BASE = "https://v3.football.api-sports.io";

Deno.serve(async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const results: any[] = [];

    const res = await fetch(`${API_BASE}/fixtures?date=${dateStr}&status=NS`, {
      headers: { "x-apisports-key": API_KEY },
    });
    const json = await res.json();
    
    if (json.response) {
      for (const f of json.response) {
        if (LEAGUE_IDS.includes(f.league.id)) {
          results.push({
            id: f.fixture.id,
            homeTeam: f.teams.home.name,
            homeLogo: f.teams.home.logo,
            awayTeam: f.teams.away.name,
            awayLogo: f.teams.away.logo,
            league: f.league.name,
            leagueId: f.league.id,
            kickoffAt: f.fixture.date,
          });
        }
      }
    }

    results.sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());

    return new Response(JSON.stringify({ date: dateStr, fixtures: results.slice(0, 30) }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
