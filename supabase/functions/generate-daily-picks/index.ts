// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY") ?? "1a896aad078a4eec7ab7121281bcd5ec";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const API_BASE = "https://v3.football.api-sports.io";

const LEAGUE_IDS = [39, 140, 135, 78, 61, 71, 2, 3, 94, 88, 144, 203, 128, 71, 253, 317];
const SEASON = 2026;

const MARKETS = [
  { name: "Over 2.5 Goals", bet_id: 5, selection: "Over 2.5" },
  { name: "Over 1.5 Goals", bet_id: 5, selection: "Over 1.5" },
  { name: "Under 2.5 Goals", bet_id: 5, selection: "Under 2.5" },
  { name: "BTTS", bet_id: 8, selection: "Yes" },
  { name: "Double Chance 1X", bet_id: 3, selection: "Home/Draw" },
  { name: "Double Chance X2", bet_id: 3, selection: "Away/Draw" },
  { name: "HT Over 0.5", bet_id: 57, selection: "Over 0.5" },
];

async function fetchAPI(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "x-apisports-key": API_KEY },
  });
  const json = await res.json();
  return json.response ?? [];
}

async function getFixturesForDate(dateStr: string) {
  const data = await fetchAPI(`/fixtures?date=${dateStr}&status=NS`);
  const filtered = data.filter((f: any) => LEAGUE_IDS.includes(f.league.id));
  if (filtered.length >= 10) return filtered;
  return data.slice(0, 50);
}

async function getTeamStats(teamId: number, leagueId: number, season: number) {
  return fetchAPI(`/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`);
}

async function getH2H(home: number, away: number) {
  return fetchAPI(`/fixtures/headtohead?h2h=${home}-${away}&last=10`);
}

async function getOdds(fixtureId: number) {
  return fetchAPI(`/odds?fixture=${fixtureId}`);
}

function calcRecentForm(stats: any): number {
  try {
    const form = stats?.form ?? "";
    const last5 = form.slice(-5);
    let score = 0;
    for (const r of last5) {
      if (r === "W") score += 20;
      else if (r === "D") score += 10;
    }
    return Math.min(score, 100);
  } catch { return 50; }
}

function calcGoalsRatio(stats: any): number {
  try {
    const scored = stats?.goals?.for?.average?.home ?? 1.5;
    const conceded = stats?.goals?.against?.average?.home ?? 1.5;
    const totalAvg = parseFloat(scored) + parseFloat(conceded);
    return Math.min(Math.round(totalAvg * 20), 100);
  } catch { return 50; }
}

function calcH2HScore(h2h: any[]): number {
  if (!h2h || h2h.length === 0) return 50;
  let totalGoals = 0;
  for (const f of h2h.slice(0, 10)) {
    const home = f.goals?.home ?? 0;
    const away = f.goals?.away ?? 0;
    totalGoals += (home + away);
  }
  const avg = totalGoals / Math.min(h2h.length, 10);
  return Math.min(Math.round(avg * 15), 100);
}

function getOddForMarket(oddsData: any[], betId: number, selectionName: string): number {
  try {
    for (const bookmaker of oddsData?.[0]?.bookmakers ?? []) {
      for (const bet of bookmaker.bets ?? []) {
        if (bet.id === betId) {
          const val = bet.values?.find((v: any) =>
            v.value?.toLowerCase().includes(selectionName.toLowerCase())
          );
          if (val) return parseFloat(val.odd);
        }
      }
    }
  } catch {}
  return 0;
}

function scoreMarket(market: typeof MARKETS[0], homeStats: any, awayStats: any, h2h: any[]) {
  const homeForm = calcRecentForm(homeStats);
  const awayForm = calcRecentForm(awayStats);
  const goalsRatio = calcGoalsRatio(homeStats);
  const h2hScore = calcH2HScore(h2h);
  const baseScore = (homeForm + awayForm) / 2 * 0.4 + goalsRatio * 0.35 + h2hScore * 0.25;

  if (market.name === "Over 2.5 Goals" || market.name === "Over 1.5 Goals") {
    return Math.min(Math.round(baseScore * 1.1), 95);
  }
  if (market.name === "BTTS") {
    return Math.min(Math.round(baseScore * 1.05), 90);
  }
  if (market.name === "Under 2.5 Goals") {
    return Math.min(Math.round((100 - goalsRatio) * 0.7 + 30), 85);
  }
  return Math.min(Math.round(baseScore), 85);
}

function buildReasons(fixture: any, market: typeof MARKETS[0], homeStats: any, awayStats: any): { pt: string; en: string; es: string } {
  const home = fixture.teams?.home?.name ?? "Home";
  const away = fixture.teams?.away?.name ?? "Away";
  const homeForm = homeStats?.form?.slice(-5) ?? "";
  const awayForm = awayStats?.form?.slice(-5) ?? "";
  const homeGoalsAvg = homeStats?.goals?.for?.average?.home ?? "1.5";
  const awayGoalsAvg = awayStats?.goals?.for?.average?.away ?? "1.2";

  if (market.name === "Over 2.5 Goals") {
    return {
      pt: `${home} marcou média de ${homeGoalsAvg} gols em casa. Forma recente: ${homeForm}`,
      en: `${home} averages ${homeGoalsAvg} goals at home. Recent form: ${homeForm}`,
      es: `${home} promedia ${homeGoalsAvg} goles en casa. Forma reciente: ${homeForm}`,
    };
  }
  if (market.name === "BTTS") {
    return {
      pt: `${home} e ${away} marcaram nas últimas partidas. Forma: ${homeForm} vs ${awayForm}`,
      en: `${home} and ${away} both scored recently. Form: ${homeForm} vs ${awayForm}`,
      es: `${home} y ${away} marcaron recientemente. Forma: ${homeForm} vs ${awayForm}`,
    };
  }
  return {
    pt: `Análise estatística: ${home} vs ${away}. Mercado: ${market.name}`,
    en: `Statistical analysis: ${home} vs ${away}. Market: ${market.name}`,
    es: `Análisis estadístico: ${home} vs ${away}. Mercado: ${market.name}`,
  };
}

interface PickCandidate {
  fixture: any;
  market: typeof MARKETS[0];
  odd: number;
  confidence: number;
  homeStats: any;
  awayStats: any;
}

function buildAccumulators(candidates: PickCandidate[], tier: "free" | "premium") {
  const confMin = tier === "free" ? 60 : 70;
  const confMax = 100;
  const oddMin = 1.30;
  const oddMax = tier === "free" ? 5.00 : 15.00;
  const maxAccumulators = tier === "free" ? 2 : 5;

  const filtered = candidates
    .filter(c => c.confidence >= confMin && c.confidence <= confMax && c.odd >= 1.10 && c.odd <= 3.5)
    .sort((a, b) => b.confidence - a.confidence);

  const accumulators: PickCandidate[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < maxAccumulators; i++) {
    const pool = filtered.filter(c => !used.has(c.fixture.fixture.id));
    if (pool.length < 2) break;

    const acc: PickCandidate[] = [];
    let combinedOdd = 1.0;

    for (const c of pool) {
      if (acc.length >= 4) break;
      if (combinedOdd * c.odd > oddMax) continue;
      acc.push(c);
      combinedOdd *= c.odd;
      used.add(c.fixture.fixture.id);
    }

    if (acc.length >= 2 && combinedOdd >= oddMin) {
      accumulators.push(acc);
    }
  }

  return accumulators;
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const today = new Date().toISOString().split("T")[0];

    // Verificar se já gerou hoje
    const { data: existing } = await supabase
      .from("daily_picks")
      .select("id")
      .eq("pick_date", today)
      .limit(1);

    const forceRegen = new URL(req.url).searchParams.get("force") === "true";

    if (existing && existing.length > 0 && !forceRegen) {
      return new Response(JSON.stringify({ message: "Picks already generated for today", date: today }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Buscar fixtures do dia
    const fixtures = await getFixturesForDate(today);
    console.log(`Found ${fixtures.length} fixtures for ${today}`);

    if (fixtures.length === 0) {
      return new Response(JSON.stringify({ message: "No fixtures today", date: today }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const candidates: PickCandidate[] = [];
    const errors: any[] = [];

    for (const fixture of fixtures.slice(0, 30)) {
      const homeTeamId = fixture.teams?.home?.id;
      const awayTeamId = fixture.teams?.away?.id;
      const leagueId = fixture.league?.id;
      const season = fixture.league?.season;
      const fixtureId = fixture.fixture?.id;

      if (!homeTeamId || !awayTeamId || !leagueId || !season) continue;

      const { error: fcError } = await supabase.from("fixture_cache").upsert({
        id: fixtureId,
        league_id: leagueId,
        home_team_id: homeTeamId,
        home_team_name: fixture.teams.home.name,
        home_team_logo: fixture.teams.home.logo,
        away_team_id: awayTeamId,
        away_team_name: fixture.teams.away.name,
        away_team_logo: fixture.teams.away.logo,
        kickoff_at: fixture.fixture.date,
        status: fixture.fixture.status?.short ?? "NS",
        raw_data: fixture,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }, { onConflict: "id" });
      if (fcError) {
        console.error("Fixture cache upsert error:", fcError);
        errors.push({ type: "fixture_cache", id: fixtureId, err: fcError });
      }

      // Buscar stats e h2h
      const [homeStats, awayStats, h2h, oddsData] = await Promise.all([
        getTeamStats(homeTeamId, leagueId, season),
        getTeamStats(awayTeamId, leagueId, season),
        getH2H(homeTeamId, awayTeamId),
        getOdds(fixtureId),
      ]);

      await new Promise(r => setTimeout(r, 300));

      // Calcular melhor mercado
      let bestMarket = MARKETS[0];
      let bestScore = 0;
      let bestOdd = 0;

      for (const market of MARKETS) {
        const odd = getOddForMarket(oddsData, market.bet_id, market.selection);
        if (odd < 1.05 || odd > 4.0) continue;
        const score = scoreMarket(market, homeStats, awayStats, h2h);
        if (score > bestScore) {
          bestScore = score;
          bestMarket = market;
          bestOdd = odd;
        }
      }

      if (bestScore >= 60 && bestOdd >= 1.10) {
        candidates.push({ fixture, market: bestMarket, odd: bestOdd, confidence: bestScore, homeStats, awayStats });
      }
    }

    console.log(`Generated ${candidates.length} candidates`);

    if (forceRegen) {
      await supabase.from("daily_picks").delete().eq("pick_date", today);
    }

    // Gerar acumuladores free e premium
    const freeAccs = buildAccumulators(candidates, "free");
    const premiumAccs = buildAccumulators(candidates, "premium");

    const allAccs = [
      ...freeAccs.map((acc, i) => ({ acc, tier: "free" as const, sortOrder: i })),
      ...premiumAccs.map((acc, i) => ({ acc, tier: "premium" as const, sortOrder: i })),
    ];

    let picksCreated = 0;

    for (const { acc, tier, sortOrder } of allAccs) {
      const combinedOdds = acc.reduce((prod, c) => prod * c.odd, 1.0);
      const avgConf = Math.round(acc.reduce((sum, c) => sum + c.confidence, 0) / acc.length);

      const { data: pick, error: pickError } = await supabase
        .from("daily_picks")
        .insert({
          pick_date: today,
          tier,
          combined_odds: parseFloat(combinedOdds.toFixed(2)),
          confidence: avgConf,
          status: "pending",
          sort_order: sortOrder,
        })
        .select()
        .single();

      if (pickError || !pick) continue;

      for (const c of acc) {
        const reasons = buildReasons(c.fixture, c.market, c.homeStats, c.awayStats);
        const { error: selError } = await supabase.from("pick_selections").insert({
          daily_pick_id: pick.id,
          fixture_id: c.fixture.fixture.id,
          home_team_name: c.fixture.teams.home.name,
          away_team_name: c.fixture.teams.away.name,
          league_name: c.fixture.league.name,
          league_logo: c.fixture.league.logo,
          market: c.market.name,
          bet_id: c.market.bet_id,
          selection: c.market.selection,
          odds: parseFloat(c.odd.toFixed(2)),
          confidence: c.confidence,
          kickoff_at: c.fixture.fixture.date,
          status: "pending",
          reasons,
        });
        if (selError) {
          console.error("Error inserting selection:", selError);
          errors.push({ type: "pick_selection", fixId: c.fixture.fixture.id, err: selError });
        }
      }

      picksCreated++;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      date: today, 
      picksCreated, 
      candidates: candidates.length, 
      errors: JSON.parse(JSON.stringify(errors)) 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
