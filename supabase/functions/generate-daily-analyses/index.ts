import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get('FOOTBALL_API_KEY') || '1a896aad078a4eec7ab7121281bcd5ec';
const API_BASE_URL = 'https://v3.football.api-sports.io';

const MIN_CONFIDENCE = 35; // Reduzido de 38 para 35 para garantir volume de cards
const MIN_VALID_MATCHES = 1; 

const TIER1_IDS = [39, 140, 135, 78, 61, 94, 88, 203, 71, 128];
const TIER2_IDS = [2, 3, 848, 13, 11, 253, 307, 169, 113, 119, 144, 40, 103, 235, 200, 233, 197, 207, 244, 239, 271, 283, 327, 333, 345];

const teamCache = new Map<number, any>();

async function fetchFromAPI(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' },
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const data = await response.json();
  return data.response || [];
}

async function analyzeTeamCorners(teamId: number, teamName: string) {
  if (teamCache.has(teamId)) return teamCache.get(teamId);

  const lastMatches = await fetchFromAPI(`/fixtures?team=${teamId}&last=8`);
  const validMatches = lastMatches.filter((m: any) => m.fixture.status.short === 'FT');
  
  const statsPromises = validMatches.map((m: any) => fetchFromAPI(`/fixtures/statistics?fixture=${m.fixture.id}`));
  const allStats = await Promise.all(statsPromises);

  const cornersHome: number[] = [], cornersAway: number[] = [];
  const concededHome: number[] = [], concededAway: number[] = [];

  allStats.forEach((stats, index) => {
    if (!stats || !stats.length) return;
    const match = validMatches[index];
    let hc = 0, ac = 0;
    for (const ts of stats) {
      const cs = ts.statistics.find((s: any) => s.type === 'Corner Kicks');
      if (cs?.value != null) {
        const v = typeof cs.value === 'number' ? cs.value : parseInt(cs.value, 10);
        if (stats.indexOf(ts) === 0) hc = v; else ac = v;
      }
    }
    if (hc === 0 && ac === 0) return;
    if (match.teams.home.id === teamId) { cornersHome.push(hc); concededHome.push(ac); }
    else { cornersAway.push(ac); concededAway.push(hc); }
  });

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const result = {
    teamId, teamName,
    avgCornersHome: avg(cornersHome), avgCornersAway: avg(cornersAway),
    avgConcededHome: avg(concededHome), avgConcededAway: avg(concededAway),
    stdDevHome: stdDev(cornersHome), stdDevAway: stdDev(cornersAway),
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

function calculatePrediction(hs: any, as_: any) {
  const expectedHome = (hs.avgCornersHome + as_.avgConcededAway) / 2;
  const expectedAway = (as_.avgCornersAway + hs.avgConcededHome) / 2;
  const mu = expectedHome + expectedAway;
  const totalData = hs.totalValidMatches + as_.totalValidMatches;
  const dataWeight = Math.min(1, totalData / 8);
  const expectedTotal = parseFloat((mu * dataWeight + 10.0 * (1 - dataWeight)).toFixed(2));
  const marketLine = toMarketLine(expectedTotal);
  const avgStdDev = ((hs.stdDevHome + hs.stdDevAway) / 2 + (as_.stdDevHome + as_.stdDevAway) / 2) / 2;
  const lambdaAdj = Math.max(expectedTotal - avgStdDev * 0.02, expectedTotal * 0.99);
  const overProb = parseFloat(poissonOverProbability(lambdaAdj, marketLine).toFixed(1));
  const dataQuality = Math.min(100, Math.round((totalData / 12) * 70 + (avgStdDev < 3 ? 30 : 10)));
  const confidence = Math.min(95, Math.max(35, Math.round(overProb * 0.85 + dataQuality * 0.15)));
  const sigma = Math.max(1.2, avgStdDev);
  return { 
    expectedTotal, marketLine, overProbability: overProb, confidence, 
    probableRangeMin: Math.max(5, Math.round(expectedTotal - sigma)), 
    probableRangeMax: Math.round(expectedTotal + sigma),
    distribution: [7.5, 8.5, 9.5, 10.5, 11.5, 12.5].map(line => ({ threshold: line, probability: parseFloat(poissonOverProbability(lambdaAdj, line).toFixed(1)) })),
    dataQuality 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';
    const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    console.log(`Processing date: ${targetDate} (Force: ${force})`);

    if (!force) {
      const { data: existing } = await supabase.from('corner_analyses').select('id').gte('kickoff_at', `${targetDate}T00:00:00.000Z`).lte('kickoff_at', `${targetDate}T23:59:59.999Z`).limit(1);
      if (existing && existing.length > 0) return new Response(JSON.stringify({ success: true, count: 0, message: 'Already generated' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      const { data: toDelete } = await supabase.from('corner_analyses').select('id').gte('kickoff_at', `${targetDate}T00:00:00.000Z`).lte('kickoff_at', `${targetDate}T23:59:59.999Z`);
      if (toDelete && toDelete.length > 0) {
        const ids = toDelete.map(d => d.id);
        await supabase.from('team_statistics').delete().in('analysis_id', ids);
        await supabase.from('robust_scenarios').delete().in('analysis_id', ids);
        await supabase.from('statistical_distribution').delete().in('analysis_id', ids);
        await supabase.from('corner_analyses').delete().in('id', ids);
      }
    }

    const allFixtures = await fetchFromAPI(`/fixtures?date=${targetDate}`);
    console.log(`Found ${allFixtures.length} total fixtures from API`);
    
    const scheduled = allFixtures.filter((f: any) => f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD');
    
    // Priorizar Tiers
    const tier1 = scheduled.filter((f: any) => TIER1_IDS.includes(f.league.id));
    const tier2 = scheduled.filter((f: any) => TIER2_IDS.includes(f.league.id));
    const tier1Ids = new Set(tier1.map((f: any) => f.fixture.id));
    const tier2Ids = new Set(tier2.map((f: any) => f.fixture.id));
    const others = scheduled.filter((f: any) => !tier1Ids.has(f.fixture.id) && !tier2Ids.has(f.fixture.id));
    
    // Aumentado pool para 100 para garantir volume máximo
    const best = [...tier1, ...tier2, ...others].slice(0, 100);
    console.log(`Starting analysis for ${best.length} selected fixtures...`);

    const predictions: any[] = [];
    for (const f of best) {
      try {
        const [hs, as_] = await Promise.all([ analyzeTeamCorners(f.teams.home.id, f.teams.home.name), analyzeTeamCorners(f.teams.away.id, f.teams.away.name) ]);
        if (hs.totalValidMatches + as_.totalValidMatches < MIN_VALID_MATCHES) continue;
        const pred = calculatePrediction(hs, as_);
        
        // Se for Tier 1 ou 2, aceitamos mesmo com confiança um pouco menor para garantir preenchimento dos slots
        const isTiered = TIER1_IDS.includes(f.league.id) || TIER2_IDS.includes(f.league.id);
        if (!isTiered && pred.confidence < MIN_CONFIDENCE) continue;
        
        predictions.push({
          fixtureId: f.fixture.id, homeTeam: f.teams.home.name, awayTeam: f.teams.away.name,
          homeTeamLogo: f.teams.home.logo, awayTeamLogo: f.teams.away.logo,
          league: f.league.name, kickoffAt: f.fixture.date, homeStats: hs, awayStats: as_, ...pred
        });
      } catch (e) { console.error(`Error ${f.fixture.id}: ${e.message}`); }
    }

    predictions.sort((a, b) => b.confidence - a.confidence);
    
    let inserted = 0;
    for (let i = 0; i < predictions.length; i++) {
      const p = predictions[i];
      
      // Nova Lógica de Tier para garantir 6 Premium e 4+ Free:
      // i=0,1 -> FREE
      // i=2-7 -> PREMIUM (6 cards)
      // i>=8  -> FREE
      const tier = (i >= 2 && i < 8) ? 'premium' : 'free';
      
      const { data: analysis, error } = await supabase.from('corner_analyses').insert({
        fixture_id: p.fixtureId, home_team: p.homeTeam, away_team: p.awayTeam,
        home_team_logo: p.homeTeamLogo, away_team_logo: p.awayTeamLogo,
        league: p.league, kickoff_at: p.kickoffAt,
        confidence: p.confidence, avg_prediction: p.marketLine,
        probable_range_min: p.probableRangeMin, probable_range_max: p.probableRangeMax,
        tier, status: 'pending',
      }).select().single();
      
      if (error) {
        console.error(`Error inserting ${p.homeTeam}: ${error.message}`);
        continue;
      }
      
      inserted++;
      const getStability = (prob: number) => prob >= 75 ? 'very_stable' : prob >= 60 ? 'stable' : 'moderate';
      const robustScenarios = p.distribution.filter((d: any) => d.probability >= 35).sort((a: any, b: any) => b.threshold - a.threshold).slice(0, 3).reverse().map((d: any) => ({ threshold: d.threshold, stability: getStability(d.probability), probability: d.probability }));
      
      // Bulk inserts para performance e confiabilidade
      const scenarioInserts = robustScenarios.map((s: any) => ({ analysis_id: analysis.id, threshold: s.threshold, stability: s.stability, probability: s.probability }));
      const distInserts = p.distribution.map((d: any) => ({ analysis_id: analysis.id, threshold: d.threshold, probability: d.probability }));
      
      await Promise.all([
        supabase.from('robust_scenarios').insert(scenarioInserts),
        supabase.from('statistical_distribution').insert(distInserts),
        supabase.from('team_statistics').insert([
          { analysis_id: analysis.id, team_type: 'home', offensive_avg: p.homeStats.avgCornersHome, home_intensity: p.homeStats.avgCornersHome, consistency: p.dataQuality },
          { analysis_id: analysis.id, team_type: 'away', pressure_conceded: p.awayStats.avgConcededAway, corners_conceded_avg: p.awayStats.avgConcededAway, away_intensity: p.dataQuality },
        ])
      ]);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      count: inserted, 
      message: `Generated ${inserted} for ${targetDate}` 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) { 
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); 
  }
});
