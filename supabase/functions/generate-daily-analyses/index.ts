// @ts-nocheck — Edge Function (Deno); o TS do VSCode não resolve jsr/https sem projeto Deno
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get('FOOTBALL_API_KEY') || '1a896aad078a4eec7ab7121281bcd5ec';
const API_BASE_URL = 'https://v3.football.api-sports.io';

// ============================================================================
// LIGAS EM CAMADAS — Otimizadas para escanteios (API-Football)
// ============================================================================

// Tier S — Obrigatórias: alta média de escanteios + dados completos
const TIER_S_CORNERS = [
  39,   // Premier League         ~10.6 escanteios/jogo
  78,   // Bundesliga             ~9.8
  135,  // Serie A                ~10.1
  40,   // Championship           ~10.4 (excelente para over corners)
  88,   // Eredivisie             ~10.8 (melhor da Europa para cantos)
  71,   // Brasileirão Série A    ~11.2 (maior média do mundo)
  253,  // MLS                    ~10.5 (muito ofensivo)
];

// Tier A — Essenciais para volume diário
const TIER_A_CORNERS = [
  61,   // Ligue 1               ~9.1
  140,  // La Liga               ~9.2
  94,   // Primeira Liga         ~9.5
  203,  // Super Lig (Turquia)   ~9.8
  128,  // Liga Profesional ARG  ~9.0
  262,  // Liga MX               ~9.3
  179,  // Scottish Premiership  ~10.2
  72,   // Brasileirão Série B   ~10.8
  2,    // UEFA Champions League ~10.0
  3,    // UEFA Europa League    ~9.8
];

// Tier B — Preencher dias vazios (boas médias de escanteios)
const TIER_B_CORNERS = [
  98,   // J1 League (Japão)     ~9.5
  292,  // K League 1 (Coreia)   ~9.2
  106,  // Ekstraklasa (Polônia) ~9.0
  103,  // Allsvenskan (Suécia)  ~9.3
  144,  // Jupiler Pro League    ~10.0
  239,  // Liga BetPlay (COL)    ~9.1
  265,  // Primera Div Chile     ~8.8
  13,   // Copa Libertadores     ~9.5
  11,   // Copa Sul-Americana    ~9.2
  73,   // Copa do Brasil        ~10.0
];

const ALL_CORNER_LEAGUES = [...new Set([...TIER_S_CORNERS, ...TIER_A_CORNERS, ...TIER_B_CORNERS])];

// Média de escanteios por liga (baseline para shrinkage)
const LEAGUE_CORNER_BASELINE: Record<number, number> = {
  39: 10.6,   // Premier League
  78: 9.8,    // Bundesliga
  135: 10.1,  // Serie A
  40: 10.4,   // Championship
  88: 10.8,   // Eredivisie
  71: 11.2,   // Brasileirão Série A
  253: 10.5,  // MLS
  61: 9.1,    // Ligue 1
  140: 9.2,   // La Liga
  94: 9.5,    // Primeira Liga
  203: 9.8,   // Super Lig
  128: 9.0,   // Liga Profesional ARG
  262: 9.3,   // Liga MX
  179: 10.2,  // Scottish Premiership
  72: 10.8,   // Brasileirão Série B
  2: 10.0,    // UCL
  3: 9.8,     // UEL
  98: 9.5,    // J1 League
  292: 9.2,   // K League 1
  106: 9.0,   // Ekstraklasa
  103: 9.3,   // Allsvenskan
  144: 10.0,  // Jupiler Pro League
  239: 9.1,   // Liga BetPlay
  265: 8.8,   // Primera Div Chile
  13: 9.5,    // Copa Libertadores
  11: 9.2,    // Copa Sul-Americana
  73: 10.0,   // Copa do Brasil
};

const MIN_VALID_MATCHES = 1;
const teamCache = new Map<number, any>();

async function fetchFromAPI(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY },
  });
  if (!response.ok) {
    console.error(`[CornerEdge] API ${endpoint} HTTP ${response.status}`);
    return [];
  }
  const data = await response.json();
  if (data.errors?.length) {
    console.error(`[CornerEdge] API ${endpoint} errors:`, JSON.stringify(data.errors));
  }
  return data.response || [];
}

async function analyzeTeamCorners(teamId: number, teamName: string) {
  if (teamCache.has(teamId)) return teamCache.get(teamId);

  const lastMatches = await fetchFromAPI(`/fixtures?team=${teamId}&last=10`);
  const validMatches = lastMatches
    .filter((m: any) => m.fixture.status.short === 'FT')
    .slice(0, 8);

  const statsPromises = validMatches.map((m: any) =>
    fetchFromAPI(`/fixtures/statistics?fixture=${m.fixture.id}`)
  );
  const allStats = await Promise.all(statsPromises);

  const cornersHome: { value: number; weight: number }[] = [];
  const cornersAway: { value: number; weight: number }[] = [];
  const concededHome: { value: number; weight: number }[] = [];
  const concededAway: { value: number; weight: number }[] = [];

  allStats.forEach((stats, index) => {
    if (!stats || !stats.length) return;
    const match = validMatches[index];
    // Decaimento exponencial: jogos recentes valem mais
    const weight = Math.exp(-0.15 * index);

    let hc = 0, ac = 0;
    for (const ts of stats) {
      const cs = ts.statistics.find((s: any) => s.type === 'Corner Kicks');
      if (cs?.value != null) {
        const v = typeof cs.value === 'number' ? cs.value : parseInt(cs.value, 10);
        if (stats.indexOf(ts) === 0) hc = v; else ac = v;
      }
    }
    if (hc === 0 && ac === 0) return;

    if (match.teams.home.id === teamId) {
      cornersHome.push({ value: hc, weight });
      concededHome.push({ value: ac, weight });
    } else {
      cornersAway.push({ value: ac, weight });
      concededAway.push({ value: hc, weight });
    }
  });

  const weightedAvg = (arr: { value: number; weight: number }[]) => {
    if (arr.length === 0) return 0;
    const totalWeight = arr.reduce((sum, item) => sum + item.weight, 0);
    return arr.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
  };
  const rawValues = (arr: { value: number; weight: number }[]) => arr.map(i => i.value);

  const last3Home = weightedAvg(cornersHome.slice(0, 3));
  const last3Away = weightedAvg(cornersAway.slice(0, 3));
  const momentum = (last3Home + last3Away) / 2;

  const result = {
    teamId, teamName,
    avgCornersHome: weightedAvg(cornersHome),
    avgCornersAway: weightedAvg(cornersAway),
    avgConcededHome: weightedAvg(concededHome),
    avgConcededAway: weightedAvg(concededAway),
    momentum,
    stdDevHome: stdDev(rawValues(cornersHome)),
    stdDevAway: stdDev(rawValues(cornersAway)),
    totalValidMatches: cornersHome.length + cornersAway.length,
  };
  teamCache.set(teamId, result);
  return result;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length);
}

function poissonPMF(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 1; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

function poissonOverProbability(lambda: number, threshold: number): number {
  let cumulative = 0;
  for (let k = 0; k <= threshold; k++) cumulative += poissonPMF(lambda, k);
  return Math.max(0, Math.min(100, (1 - cumulative) * 100));
}

function toMarketLine(mu: number): number {
  const line = Math.floor(mu / 0.5) * 0.5 - 0.5;
  return Math.max(7.5, Math.min(12.5, line));
}

/** Uma perna da múltipla (persistida em `corner_analyses.games`) */
interface CornerMultipleGameRow {
  fixture_id: number;
  home_team: string;
  away_team: string;
  league: string;
  kickoff_at: string;
  home_logo: string;
  away_logo: string;
  prediction: number;
  strategy: string;
  confidence: number;
  match_score: number;
  expected_total: number;
  actual_corners: null;
  result: string;
}

interface CornerAccumulator {
  games: CornerMultipleGameRow[];
  combinedConfidence: number;
  combinedOdd: number;
  tier: 'free' | 'premium';
}

// ============================================================================
// SCORE DE CONFIABILIDADE DA PARTIDA (0-10)
// Partidas com score >= 5 são elegíveis para múltiplas
// ============================================================================
function calcCornerMatchScore(
  hs: any,
  as_: any,
  leagueId: number,
  expectedTotal: number,
  confidence: number
): number {
  let score = 0;

  // Média de escanteios do mandante em casa >= 5 (+2)
  if (hs.avgCornersHome >= 5.5) score += 2;
  else if (hs.avgCornersHome >= 4.5) score += 1;

  // Adversário sofre muitos escanteios (+2)
  if (as_.avgConcededAway >= 5.0) score += 2;
  else if (as_.avgConcededAway >= 4.0) score += 1;

  // Projeção total alta (>= 9.5 escanteios) (+2)
  if (expectedTotal >= 10.5) score += 2;
  else if (expectedTotal >= 9.5) score += 1;

  // Confiança do modelo (+2)
  if (confidence >= 65) score += 2;
  else if (confidence >= 55) score += 1;

  // Liga Tier S (dados mais confiáveis) (+1)
  if (TIER_S_CORNERS.includes(leagueId)) score += 1;

  // Momentum positivo (+1)
  const avgMomentum = (hs.momentum + as_.momentum) / 2;
  if (avgMomentum >= 5.0) score += 1;

  return Math.min(score, 10);
}

function calculatePrediction(hs: any, as_: any, leagueId: number) {
  const homeFactor = leagueId === 71 ? 1.12 : 1.05;
  const expectedHome = ((hs.avgCornersHome * 0.6) + (as_.avgConcededAway * 0.4)) * homeFactor;
  const expectedAway = ((as_.avgCornersAway * 0.6) + (hs.avgConcededHome * 0.4)) * 0.92;

  const avgMomentum = (hs.momentum + as_.momentum) / 2;
  const baseMu = expectedHome + expectedAway;
  const muWithMomentum = baseMu * 0.8 + avgMomentum * 0.2;

  const totalData = hs.totalValidMatches + as_.totalValidMatches;
  const leagueBaseline = LEAGUE_CORNER_BASELINE[leagueId] || 9.5;
  const dataWeight = Math.min(1, totalData / 10);
  const expectedTotal = parseFloat(
    (muWithMomentum * dataWeight + leagueBaseline * (1 - dataWeight)).toFixed(2)
  );

  const marketLine = toMarketLine(expectedTotal);
  const avgStdDev =
    ((hs.stdDevHome + hs.stdDevAway) / 2 + (as_.stdDevHome + as_.stdDevAway) / 2) / 2;
  const volatilityPenalty = avgStdDev > 3 ? 0.3 : 0.1;
  const lambdaAdj = Math.max(
    expectedTotal - avgStdDev * volatilityPenalty,
    expectedTotal * 0.92
  );

  const overProb = parseFloat(poissonOverProbability(lambdaAdj, marketLine).toFixed(1));
  const dataQuality = Math.min(
    100,
    Math.round((totalData / 12) * 60 + (avgStdDev < 2.5 ? 40 : 10))
  );

  const isTierS = TIER_S_CORNERS.includes(leagueId);
  const confidenceBonus = isTierS ? 5 : 0;
  const confidence = Math.min(
    98,
    Math.max(35, Math.round(overProb * 0.70 + dataQuality * 0.30) + confidenceBonus)
  );

  const sigma = Math.max(1.0, avgStdDev);

  return {
    expectedTotal, marketLine, overProbability: overProb, confidence,
    probableRangeMin: Math.max(5, Math.round(expectedTotal - sigma)),
    probableRangeMax: Math.round(expectedTotal + sigma),
    distribution: [7.5, 8.5, 9.5, 10.5, 11.5, 12.5].map(line => ({
      threshold: line,
      probability: parseFloat(poissonOverProbability(lambdaAdj, line).toFixed(1)),
    })),
    dataQuality,
  };
}

// ============================================================================
// CONSTRUTOR DE MÚLTIPLAS DE ESCANTEIOS
// ============================================================================
function buildCornerMultiples(
  candidates: any[],
  tier: 'free' | 'premium',
  numMultiples: number,
  gamesPerMultiple: number,
  usedFixtures: Set<number>
): CornerAccumulator[] {
  const multiples: CornerAccumulator[] = [];

  for (let i = 0; i < numMultiples; i++) {
    const games: CornerMultipleGameRow[] = [];
    let combinedConfidence = 0;

    for (const candidate of candidates) {
      if (usedFixtures.has(candidate.fixtureId)) continue;
      if (games.length >= gamesPerMultiple) break;

      games.push({
        fixture_id: candidate.fixtureId,
        home_team: candidate.homeTeam,
        away_team: candidate.awayTeam,
        league: candidate.league,
        kickoff_at: candidate.kickoffAt,
        home_logo: candidate.homeTeamLogo,
        away_logo: candidate.awayTeamLogo,
        prediction: candidate.marketLine,
        strategy: candidate.marketLine >= 9.5 ? 'over' : 'under',
        confidence: candidate.confidence,
        match_score: candidate.matchScore,
        expected_total: candidate.expectedTotal,
        actual_corners: null,
        result: 'pending',
      });

      combinedConfidence += candidate.confidence;
      usedFixtures.add(candidate.fixtureId);
    }

    if (games.length === gamesPerMultiple) {
      // Odd combinada baseada na confiança média (mais realista que 1.8 fixo)
      const avgConf = combinedConfidence / gamesPerMultiple;
      const baseOdd = avgConf >= 65 ? 1.75 : avgConf >= 55 ? 1.65 : 1.55;
      const combinedOdd = parseFloat(Math.pow(baseOdd, gamesPerMultiple).toFixed(2));

      multiples.push({
        games,
        combinedConfidence: Math.round(combinedConfidence / gamesPerMultiple),
        combinedOdd,
        tier,
      });
    }
  }

  return multiples;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';
    const targetDate =
      url.searchParams.get('date') ||
      new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());

    console.log(`[CornerEdge] Processing date: ${targetDate} (Force: ${force})`);

    // Verificar / limpar dados existentes
    if (!force) {
      const { data: existing } = await supabase
        .from('corner_analyses')
        .select('id')
        .gte('kickoff_at', `${targetDate}T00:00:00.000Z`)
        .lte('kickoff_at', `${targetDate}T23:59:59.999Z`)
        .limit(1);
      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({ success: true, count: 0, message: 'Already generated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { data: toDelete } = await supabase
        .from('corner_analyses')
        .select('id')
        .gte('kickoff_at', `${targetDate}T00:00:00.000Z`)
        .lte('kickoff_at', `${targetDate}T23:59:59.999Z`);
      if (toDelete && toDelete.length > 0) {
        const ids = toDelete.map((d: any) => d.id);
        await supabase.from('team_statistics').delete().in('analysis_id', ids);
        await supabase.from('robust_scenarios').delete().in('analysis_id', ids);
        await supabase.from('statistical_distribution').delete().in('analysis_id', ids);
        await supabase.from('corner_analyses').delete().in('id', ids);
      }
    }

    // Buscar fixtures do dia no fuso do app (evita “dia vazio” por UTC vs Brasil)
    const tz = encodeURIComponent('America/Sao_Paulo');
    const [allNS, allTBD] = await Promise.all([
      fetchFromAPI(`/fixtures?date=${targetDate}&timezone=${tz}&status=NS`),
      fetchFromAPI(`/fixtures?date=${targetDate}&timezone=${tz}&status=TBD`),
    ]);
    const byFixtureId = new Map<number, any>();
    for (const f of [...allNS, ...allTBD]) {
      const id = f?.fixture?.id;
      if (id != null) byFixtureId.set(id, f);
    }
    const allFixtures = [...byFixtureId.values()];
    console.log(`[CornerEdge] Found ${allFixtures.length} total fixtures (NS+TBD, tz=America/Sao_Paulo)`);

    const scheduled = allFixtures.filter(
      (f: any) => f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD'
    );

    // Filtrar pelas ligas de escanteios em camadas, priorizando Tier S
    const tierS = scheduled.filter((f: any) => TIER_S_CORNERS.includes(f.league.id));
    const tierA = scheduled.filter((f: any) => TIER_A_CORNERS.includes(f.league.id));
    const tierB = scheduled.filter((f: any) => TIER_B_CORNERS.includes(f.league.id));
    const tierSIds = new Set(tierS.map((f: any) => f.fixture.id));
    const tierAIds = new Set(tierA.map((f: any) => f.fixture.id));
    const tierBFiltered = tierB.filter(
      (f: any) => !tierSIds.has(f.fixture.id) && !tierAIds.has(f.fixture.id)
    );

    let pool = [...tierS, ...tierA, ...tierBFiltered].slice(0, 80);
    // Dias com poucos jogos nas ligas “premium”: incluir outras competições agendadas
    if (pool.length < 25) {
      const inPool = new Set(pool.map((f: any) => f.fixture.id));
      const rest = scheduled.filter((f: any) => !inPool.has(f.fixture.id));
      pool = [...pool, ...rest].slice(0, 80);
    }
    console.log(
      `[CornerEdge] Pool: ${tierS.length} TierS + ${tierA.length} TierA + ${tierBFiltered.length} TierB → ${pool.length} fixtures (after fill)`
    );

    // Analisar cada fixture
    const predictions: any[] = [];
    for (const f of pool) {
      try {
        const [hs, as_] = await Promise.all([
          analyzeTeamCorners(f.teams.home.id, f.teams.home.name),
          analyzeTeamCorners(f.teams.away.id, f.teams.away.name),
        ]);
        if (hs.totalValidMatches + as_.totalValidMatches < MIN_VALID_MATCHES) continue;

        const pred = calculatePrediction(hs, as_, f.league.id);
        const matchScore = calcCornerMatchScore(hs, as_, f.league.id, pred.expectedTotal, pred.confidence);

        predictions.push({
          fixtureId: f.fixture.id,
          homeTeam: f.teams.home.name,
          awayTeam: f.teams.away.name,
          homeTeamLogo: f.teams.home.logo,
          awayTeamLogo: f.teams.away.logo,
          league: f.league.name,
          kickoffAt: f.fixture.date,
          leagueId: f.league.id,
          homeStats: hs,
          awayStats: as_,
          matchScore,
          ...pred,
        });
      } catch (e: any) {
        console.error(`[CornerEdge] Error fixture ${f.fixture.id}: ${e.message}`);
      }
    }

    // Ordenar por matchScore desc, depois por confiança desc
    predictions.sort((a, b) => b.matchScore - a.matchScore || b.confidence - a.confidence);

    console.log(`[CornerEdge] Predictions: ${predictions.length} total`);
    console.log(`  matchScore >= 7: ${predictions.filter(p => p.matchScore >= 7).length}`);
    console.log(`  matchScore 5-6: ${predictions.filter(p => p.matchScore >= 5 && p.matchScore < 7).length}`);
    console.log(`  matchScore < 5: ${predictions.filter(p => p.matchScore < 5).length}`);

    // ============================================================================
    // GERAR APENAS MÚLTIPLAS DE ESCANTEIOS
    // Threshold adaptativo: começa em 5, cai para 3 se não houver candidatos suficientes
    // ============================================================================
    let threshold = 5;
    let candidates = predictions.filter(p => p.matchScore >= threshold);
    if (candidates.length < 3) {
      threshold = 3;
      candidates = predictions.filter(p => p.matchScore >= threshold);
    }
    if (candidates.length < 3) {
      // Último recurso: usar todos
      candidates = [...predictions];
    }

    console.log(`[CornerEdge] Candidates for multiples (threshold=${threshold}): ${candidates.length}`);

    const usedFixtures = new Set<number>();
    let premiumMultiples: CornerAccumulator[] = [];
    let freeMultiples: CornerAccumulator[] = [];

    const maxPossible3 = Math.floor(candidates.length / 3);
    if (maxPossible3 > 0) {
      const numPremium = Math.min(6, maxPossible3);
      const numFree = Math.min(4, Math.max(0, maxPossible3 - numPremium));
      premiumMultiples = buildCornerMultiples(candidates, 'premium', numPremium, 3, usedFixtures);
      freeMultiples = buildCornerMultiples(candidates, 'free', numFree, 3, usedFixtures);
    }

    // Poucos jogos no dia: múltiplas 2 seleções (ainda separando premium/free)
    if (premiumMultiples.length + freeMultiples.length === 0 && candidates.length >= 2) {
      const used2 = new Set<number>();
      const maxPairs = Math.floor(candidates.length / 2);
      const numPrem2 = Math.min(3, maxPairs);
      premiumMultiples = buildCornerMultiples(candidates, 'premium', numPrem2, 2, used2);
      const numFree2 = Math.min(3, Math.max(0, maxPairs - numPrem2));
      freeMultiples = buildCornerMultiples(candidates, 'free', numFree2, 2, used2);
      console.log(
        `[CornerEdge] Sparse day: used 2-leg multiples (premium=${premiumMultiples.length}, free=${freeMultiples.length})`
      );
    }

    const allMultiples = [...premiumMultiples, ...freeMultiples];
    console.log(
      `[CornerEdge] Generated ${premiumMultiples.length} PREMIUM + ${freeMultiples.length} FREE multiples`
    );

    // ============================================================================
    // INSERIR APENAS MÚLTIPLAS (sem análises individuais)
    // ============================================================================
    let insertedMultiples = 0;
    for (const multiple of allMultiples) {
      const { error } = await supabase.from('corner_analyses').insert({
        is_multiple: true,
        games: multiple.games,
        combined_confidence: multiple.combinedConfidence,
        combined_odd: multiple.combinedOdd,
        tier: multiple.tier,
        status: 'pending',
        home_team: `Múltipla ${multiple.games.length}x`,
        away_team: '',
        league: 'Corner Multiple',
        kickoff_at: multiple.games[0].kickoff_at,
        confidence: multiple.combinedConfidence,
        avg_prediction: 0,
        probable_range_min: 0,
        probable_range_max: 0,
        strategy_type: 'over',
      });

      if (error) {
        console.error(`[CornerEdge] Error inserting multiple: ${error.message}`);
        continue;
      }
      insertedMultiples++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        multiples: insertedMultiples,
        premium: premiumMultiples.length,
        free: freeMultiples.length,
        candidates: candidates.length,
        message: `Generated ${insertedMultiples} corner multiples for ${targetDate}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[CornerEdge] Fatal error:', err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
