// @ts-nocheck — Edge Function (Deno)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get('FOOTBALL_API_KEY') || '1a896aad078a4eec7ab7121281bcd5ec';
const API_BASE_URL = 'https://v3.football.api-sports.io';

const MAX_EXECUTION_TIME = 140000;
const BATCH_SIZE = 20;
const MAX_CONCURRENT = 5;

console.log('[CornerEdge] API Key em uso:', API_KEY.substring(0, 5) + '...');

// ============================================================================
// Modelo: baseline por league_id (shrinkage)
// ============================================================================

const LEAGUE_CORNER_BASELINE: Record<number, number> = {
  39: 10.6, 78: 9.8, 135: 10.1, 40: 10.4, 88: 10.8,
  71: 11.2, 253: 10.5, 61: 9.1, 140: 9.2, 94: 9.5,
  203: 9.8, 128: 9.0, 262: 9.3, 179: 10.2, 72: 10.8,
  2: 10.0, 3: 9.8, 98: 9.5, 292: 9.2, 106: 9.0,
  103: 9.3, 144: 10.0, 239: 9.1, 265: 8.8, 13: 9.5,
  11: 9.2, 73: 10.0,
};

const TARGET_PREMIUM_COUNT = 6;
const TARGET_FREE_COUNT = 4;
const SUPERODD_GAMES = 3;

// ============================================================================
// Lista de ligas permitidas por região
// ============================================================================
const ALLOWED_LEAGUE_IDS = new Set([
  // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra
  39, 40, 41, 42, 43, 45, 48,
  // 🇪🇸 Espanha
  140, 141, 143,
  // 🇮🇹 Itália
  135, 136, 137,
  // 🇩🇪 Alemanha
  78, 79, 80, 81,
  // 🇫🇷 França
  61, 62, 66,
  // 🇵🇹 Portugal
  94, 95, 96,
  // 🇳🇱 Holanda
  88, 89,
  // 🇧🇼 Bélgica
  144, 145,
  // 🇹🇷 Turquia
  203, 204,
  // 🇷🇺 Rússia
  235, 236,
  // 🇺🇦 Ucrânia
  333,
  // 🇬🇷 Grécia
  197, 198,
  // 🇸🇪 Suécia
  113, 114,
  // 🇳🇴 Noruega
  103, 104,
  // 🇩🇰 Dinamarca
  119, 120,
  // 🇨🇭 Suíça
  207, 208,
  // 🇦🇹 Áustria
  218, 219,
  // 🇵🇱 Polônia
  106, 107,
  // 🇷🇴 Romênia
  283,
  // 🇨🇿 República Tcheca
  345,
  // 🇸🇰 Eslováquia
  332,
  // 🇭🇺 Hungria
  271,
  // 🇷🇸 Sérvia
  286,
  // 🇭🇷 Croácia
  210,
  // 🇸🇮 Eslovênia
  200,
  // 🇧🇬 Bulgária
  172,
  // 🇮🇱 Israel
  382,
  // 🇨🇾 Chipre
  261,
  // 🌍 Europa (Competições)
  2, 3, 848, 5,
  // 🇧🇷 Brasil
  71, 72, 73, 75, 475, 476, 477, 480, 481,
  // 🇦🇷 Argentina
  128, 131, 130,
  // 🇺🇾 Uruguai
  268,
  // 🇨🇱 Chile
  265,
  // 🇨🇴 Colômbia
  239,
  // 🇵🇪 Peru
  281,
  // 🇻🇪 Venezuela
  239,
  // 🇧🇴 Bolívia
  307,
  // 🇵🇾 Paraguai
  239,
  // 🇪🇨 Equador
  240,
  // 🌍 América do Sul (Competições)
  13, 11,
  // 🇺🇸 EUA / América do Norte
  253, 254, 16,
  // 🇲🇽 México
  262, 263,
  // 🇯🇵 Japão
  98, 99,
  // 🇰🇷 Coreia do Sul
  292, 293,
  // 🇨🇳 China
  169,
  // 🇸🇦 Arábia Saudita
  307,
  // 🇦🇪 Emirados Árabes
  188,
  // 🇮🇷 Irã
  290,
  // 🇦🇺 Austrália
  188,
]);

// Cache em memória para estatísticas de times
const teamCache = new Map<number, any>();

async function fetchFromAPI(endpoint: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'x-apisports-key': API_KEY },
    });
    if (!response.ok) {
      console.error(`[CornerEdge] API ${endpoint} HTTP ${response.status}`);
      return [];
    }
    const data = await response.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error(`[CornerEdge] API ${endpoint} errors:`, JSON.stringify(data.errors));
    }
    return data.response || [];
  } catch (err) {
    console.error(`[CornerEdge] Fatal error fetching ${endpoint}:`, err);
    return [];
  }
}

const CORNER_OU_BET_IDS = new Set([30, 45, 52, 56, 79, 85]);

function medianOdd(nums: number[]): number {
  if (!nums.length) return 0;
  const a = [...nums].sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)];
}

function aggregateCornerLineOdds(oddsPayload: any[]): Map<number, { over: number[]; under: number[] }> {
  const byLine = new Map<number, { over: number[]; under: number[] }>();
  const add = (line: number, dir: 'over' | 'under', o: number) => {
    if (!(o > 1.02 && o < 50)) return;
    let s = byLine.get(line);
    if (!s) {
      s = { over: [], under: [] };
      byLine.set(line, s);
    }
    (dir === 'over' ? s.over : s.under).push(o);
  };
  for (const entry of oddsPayload ?? []) {
    for (const bm of entry?.bookmakers ?? []) {
      for (const bet of bm?.bets ?? []) {
        const bid = bet.id;
        const nm = (bet.name ?? '').toLowerCase();
        const looksCornerTotal =
          CORNER_OU_BET_IDS.has(bid) ||
          (nm.includes('corner') &&
            (nm.includes('over') || nm.includes('under') || nm.includes('total') || nm.includes('o/u')));
        if (!looksCornerTotal) continue;
        if (nm.includes('first half') || nm.includes('1st half') || nm.includes('race to')) continue;
        for (const v of bet.values ?? []) {
          const oddRaw = parseFloat(v.odd);
          if (!Number.isFinite(oddRaw)) continue;
          const raw = String(v.value ?? '').trim().toLowerCase();
          let dir: 'over' | 'under' | null = null;
          let line = NaN;
          const m1 = raw.match(/\b(over|under)\b\s*([\d.]+)/i);
          if (m1) {
            dir = m1[1].toLowerCase() as 'over' | 'under';
            line = parseFloat(m1[2]);
          } else if (raw.match(/^o\s*[\d.]+/i) || raw.startsWith('o ')) {
            const mo = raw.match(/^o\s*([\d.]+)/i);
            if (mo) {
              dir = 'over';
              line = parseFloat(mo[1]);
            }
          } else if (raw.match(/^u\s*[\d.]+/i) || raw.startsWith('u ')) {
            const mu = raw.match(/^u\s*([\d.]+)/i);
            if (mu) {
              dir = 'under';
              line = parseFloat(mu[1]);
            }
          } else {
            const m2 = raw.match(/^([\d.]+)\s*(over|under)\b/i);
            if (m2) {
              line = parseFloat(m2[1]);
              dir = m2[2].toLowerCase() as 'over' | 'under';
            }
          }
          const h = v.handicap != null && v.handicap !== '' ? parseFloat(String(v.handicap)) : NaN;
          if ((!Number.isFinite(line) || line <= 0) && Number.isFinite(h)) line = h;
          if (!dir || !Number.isFinite(line) || line <= 0) continue;
          add(line, dir, oddRaw);
        }
      }
    }
  }
  return byLine;
}

function pickClosestApiCornerLine(byLine: Map<number, { over: number[]; under: number[] }>, modelLine: number): number | null {
  if (!byLine.size) return null;
  let best: number | null = null;
  let bestD = Infinity;
  for (const L of byLine.keys()) {
    const d = Math.abs(L - modelLine);
    if (d < bestD) {
      bestD = d;
      best = L;
    }
  }
  return best;
}

function cornerApiOddsForModelLine(oddsPayload: any[], modelLine: number): { overOdd: number; underOdd: number; apiLine: number | null } {
  const byLine = aggregateCornerLineOdds(oddsPayload);
  const apiLine = pickClosestApiCornerLine(byLine, modelLine);
  if (apiLine == null) return { overOdd: 0, underOdd: 0, apiLine: null };
  const slot = byLine.get(apiLine)!;
  return {
    overOdd: medianOdd(slot.over),
    underOdd: medianOdd(slot.under),
    apiLine,
  };
}

function ensureCornerLegOdds(p: Record<string, unknown>): void {
  const o = (p.overOdd as number) ?? 0;
  const u = (p.underOdd as number) ?? 0;
  
  // APENAS usar odds da API - não inventar odds
  if (o > 1.01 || u > 1.01) {
    p.oddsSource = 'api';
    p.overOdd = parseFloat(o.toFixed(2));
    p.underOdd = parseFloat(u.toFixed(2));
    return;
  }
  
  // Sem odds da API - deixar como 0 (não criar odds inventadas)
  p.overOdd = 0;
  p.underOdd = 0;
  p.oddsSource = 'none';
}

function legSelectionOdd(pred: any): number {
  // Só usar odds da API - não aceitar odds inventadas
  const st = cornerStrategy(pred);
  const odd = st === 'over' ? (pred.overOdd ?? 0) : (pred.underOdd ?? 0);
  // Retornar 0 se não houver odds da API
  return (pred.oddsSource === 'api' && odd > 1.01) ? odd : 0;
}

function checkTimeRemaining(startTime: number): number {
  return Math.max(0, MAX_EXECUTION_TIME - (Date.now() - startTime));
}

async function analyzeTeamCorners(teamId: number, teamName: string, supabaseClient?: any) {
  if (teamCache.has(teamId)) return teamCache.get(teamId);

  // Verificar cache no banco
  if (supabaseClient) {
    const { data: cached } = await supabaseClient
      .from('team_statistics_cache')
      .select('statistics, expires_at')
      .eq('team_id', teamId)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      teamCache.set(teamId, cached.statistics);
      return cached.statistics;
    }
  }

  const lastMatches = await fetchFromAPI(`/fixtures?team=${teamId}&last=5`);
  const validMatches = lastMatches
    .filter((m: any) => m.fixture.status.short === 'FT')
    .slice(0, 3);

  if (validMatches.length === 0) {
    const neutral = 5.0;
    const empty = {
      teamId, teamName,
      avgCornersHome: neutral, avgCornersAway: neutral,
      avgConcededHome: neutral, avgConcededAway: neutral,
      momentum: neutral, stdDevHome: 2.2, stdDevAway: 2.2,
      totalValidMatches: 0,
    };
    teamCache.set(teamId, empty);
    return empty;
  }

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
    const weight = Math.exp(-0.18 * index);

    let hc = 0, ac = 0;
    for (const ts of stats) {
      const cs = ts.statistics.find((s: any) => s.type === 'Corner Kicks');
      if (cs?.value != null) {
        const v = typeof cs.value === 'number' ? cs.value : parseInt(cs.value, 10);
        if (stats.indexOf(ts) === 0) hc = v; else ac = v;
      }
    }
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
    const tw = arr.reduce((s, x) => s + x.weight, 0);
    return arr.reduce((s, x) => s + x.value * x.weight, 0) / tw;
  };
  const rawValues = (arr: { value: number; weight: number }[]) => arr.map((i) => i.value);

  const momentum =
    cornersHome.length + cornersAway.length > 0
      ? (weightedAvg(cornersHome) * cornersHome.length + weightedAvg(cornersAway) * cornersAway.length) /
        (cornersHome.length + cornersAway.length)
      : (weightedAvg(cornersHome) + weightedAvg(cornersAway)) / 2;

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

  // Salvar no cache do banco
  if (supabaseClient) {
    await supabaseClient
      .from('team_statistics_cache')
      .upsert({
        team_id: teamId,
        team_name: teamName,
        statistics: result,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'team_id' });
  }

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
  // Sempre usar linhas .5 (7.5, 8.5, 9.5, 10.5, 11.5, 12.5)
  const line = Math.round(mu / 0.5 - 0.5) * 0.5 + 0.5;
  return Math.max(7.5, Math.min(12.5, line));
}

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
  selection_odd?: number;
  gen_telemetry?: Record<string, unknown>;
}

interface CornerAccumulator {
  games: CornerMultipleGameRow[];
  combinedConfidence: number;
  combinedOdd: number;
  tier: 'free' | 'premium';
}

function calcCornerMatchScore(hs: any, as_: any, leagueId: number, expectedTotal: number, confidence: number): number {
  let score = 0;
  if (hs.avgCornersHome >= 5.5) score += 2;
  else if (hs.avgCornersHome >= 4.5) score += 1;
  if (as_.avgConcededAway >= 5.0) score += 2;
  else if (as_.avgConcededAway >= 4.0) score += 1;
  if (expectedTotal >= 10.5) score += 2;
  else if (expectedTotal >= 9.5) score += 1;
  if (confidence >= 65) score += 2;
  else if (confidence >= 55) score += 1;
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
  const expectedTotal = parseFloat((muWithMomentum * dataWeight + leagueBaseline * (1 - dataWeight)).toFixed(2));
  const marketLine = toMarketLine(expectedTotal);
  const avgStdDev = ((hs.stdDevHome + hs.stdDevAway) / 2 + (as_.stdDevHome + as_.stdDevAway) / 2) / 2;
  const volatilityPenalty = avgStdDev > 3 ? 0.3 : 0.1;
  const lambdaAdj = Math.max(expectedTotal - avgStdDev * volatilityPenalty, expectedTotal * 0.92);
  const overProb = parseFloat(poissonOverProbability(lambdaAdj, marketLine).toFixed(1));
  const dataQuality = Math.min(100, Math.round((totalData / 12) * 60 + (avgStdDev < 2.5 ? 40 : 10)));
  const confidence = Math.min(98, Math.max(35, Math.round(overProb * 0.70 + dataQuality * 0.30)));
  const sigma = Math.max(1.0, avgStdDev);
  const lineEdge = parseFloat(Math.abs(expectedTotal - marketLine).toFixed(2));

  return {
    expectedTotal, marketLine, overProbability: overProb, confidence,
    lineEdge,
    probableRangeMin: Math.max(5, Math.round(expectedTotal - sigma)),
    probableRangeMax: Math.round(expectedTotal + sigma),
    distribution: [7.5, 8.5, 9.5, 10.5, 11.5, 12.5].map(line => ({
      threshold: line,
      probability: parseFloat(poissonOverProbability(lambdaAdj, line).toFixed(1)),
    })),
    dataQuality,
  };
}

function cornerStrategy(candidate: any): 'over' | 'under' {
  const p = candidate.overProbability ?? 50;
  if (p >= 58) return 'over';
  if (p <= 42) return 'under';
  const line = candidate.marketLine;
  const mu = candidate.expectedTotal;
  if (mu >= line + 0.4) return 'over';
  if (mu <= line - 0.4) return 'under';
  return mu >= line ? 'over' : 'under';
}

function passesCornerFreeStrict(c: any, minMs: number, relaxProb: boolean): boolean {
  if (c.matchScore < minMs) return false;
  const p = c.overProbability ?? 50;
  const line = c.marketLine;
  const mu = c.expectedTotal ?? 0;
  const strat = cornerStrategy(c);
  const edgeMu = relaxProb ? 0.08 : 0.14;

  if (strat === 'over') {
    if (p >= 56) return true;
    if (relaxProb && p >= 52) return true;
    if (!relaxProb && p >= 53) return true;
    return mu >= line + edgeMu;
  }
  if (strat === 'under') {
    if (p <= 44) return true;
    if (relaxProb && p <= 48) return true;
    if (!relaxProb && p <= 47) return true;
    return mu <= line - edgeMu;
  }
  return true;
}

const SUPERODD_GAMES = 4;

function buildCornerMultiples(
  candidates: any[],
  tier: 'free' | 'premium',
  numMultiples: number,
  gamesPerMultiple: number,
  usedFixtures: Set<number>,
  superOddIndex: number = -1
): CornerAccumulator[] {
  const multiples: CornerAccumulator[] = [];

  // Para premium: ordenar por odds (maiores primeiro), depois por matchScore
  // Para free: ordenar por matchScore, depois confidence
  const sortedCandidates = tier === 'premium' 
    ? [...candidates].sort((a, b) => {
        const oddA = legSelectionOdd(a);
        const oddB = legSelectionOdd(b);
        if (oddA > 1.01 && oddB > 1.01) return oddB - oddA;
        if (oddA > 1.01) return -1;
        if (oddB > 1.01) return 1;
        return b.matchScore - a.matchScore || b.confidence - a.confidence;
      })
    : [...candidates].sort((a, b) => 
        b.matchScore - a.matchScore ||
        b.confidence - a.confidence ||
        a.fixtureId - b.fixtureId
      );

  const withApiOdds = sortedCandidates.filter(c => c.oddsSource === 'api' && legSelectionOdd(c) > 1.01);
  const withoutOdds = sortedCandidates.filter(c => !c.oddsSource || c.oddsSource === 'none');

  for (let i = 0; i < numMultiples; i++) {
    const games: CornerMultipleGameRow[] = [];
    let combinedConfidence = 0;
    let wantOver = i % 2 === 0;

    const inMultiple = new Set<number>();
    
    const targetGames = (tier === 'premium' && i === superOddIndex) ? SUPERODD_GAMES : gamesPerMultiple;

    for (let attempt = 0; attempt < 100 && games.length < targetGames; attempt++) {
      const lane: 'over' | 'under' = wantOver ? 'over' : 'under';

      let candidate: any = null;
      
      // Para premium: priorizar com odds da API
      if (tier === 'premium') {
        candidate = withApiOdds.find(
          (c: any) =>
            !usedFixtures.has(c.fixtureId) &&
            !inMultiple.has(c.fixtureId) &&
            cornerStrategy(c) === lane
        );
        if (!candidate) candidate = withApiOdds.find(
          (c: any) => !usedFixtures.has(c.fixtureId) && !inMultiple.has(c.fixtureId)
        );
      }
      
      if (!candidate) {
        candidate = withoutOdds.find(
          (c: any) =>
            !usedFixtures.has(c.fixtureId) &&
            !inMultiple.has(c.fixtureId) &&
            cornerStrategy(c) === lane
        );
      }

      if (!candidate) {
        candidate = sortedCandidates.find(
          (c: any) =>
            !usedFixtures.has(c.fixtureId) &&
            !inMultiple.has(c.fixtureId)
        );
      }

      if (candidate) {
        const hasOdds = candidate.oddsSource === 'api' && legSelectionOdd(candidate) > 1.01;
        const legOdd = hasOdds ? legSelectionOdd(candidate) : 0;
        const strat = cornerStrategy(candidate);

        games.push({
          fixture_id: candidate.fixtureId,
          home_team: candidate.homeTeam,
          away_team: candidate.awayTeam,
          league: candidate.league,
          kickoff_at: candidate.kickoffAt,
          home_logo: candidate.homeTeamLogo,
          away_logo: candidate.awayTeamLogo,
          prediction: candidate.marketLine,
          strategy: strat,
          confidence: candidate.confidence,
          match_score: candidate.matchScore,
          expected_total: candidate.expectedTotal,
          actual_corners: null,
          result: 'pending',
          selection_odd: hasOdds ? parseFloat(legOdd.toFixed(2)) : 0,
          gen_telemetry: {
            tier,
            match_score: candidate.matchScore,
            over_probability: candidate.overProbability,
            odds_source: hasOdds ? 'api' : 'none',
            gen_version: 'corneredge_v5_deterministic'
          },
        });

        if (hasOdds) hasApiOdds = true;
        combinedConfidence += candidate.confidence;
        usedFixtures.add(candidate.fixtureId);
        inMultiple.add(candidate.fixtureId);
        wantOver = !wantOver;
      }
    }

    if (games.length >= 2) {
      // Calcular odd combinada (produto das odds ou 1 se não houver odds)
      let combinedOdd = 1;
      for (const g of games) {
        if (g.selection_odd > 1.01) {
          combinedOdd *= g.selection_odd;
        }
      }
      combinedOdd = parseFloat(combinedOdd.toFixed(2));

      // Gerar múltiplas mesmo sem odds da API - usar 0 como odd combinada
      multiples.push({
        games,
        combinedConfidence: Math.round(combinedConfidence / games.length),
        combinedOdd,
        tier,
      });
    }
  }

  return multiples;
}

function hasDuplicateMultiples(multiples: CornerAccumulator[]): boolean {
  const fixtureSets = new Set<string>();
  for (const m of multiples) {
    const fixtureIds = m.games.map(g => g.fixture_id).sort().join(',');
    if (fixtureSets.has(fixtureIds)) return true;
    fixtureSets.add(fixtureIds);
  }
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();
  const logger = {
    log: (msg: string) => console.log(`[${Date.now() - startTime}ms] ${msg}`),
    error: (msg: string) => console.error(`[${Date.now() - startTime}ms] ERROR: ${msg}`),
  };

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

    logger.log(`Processing date: ${targetDate} (Force: ${force})`);

    // Verificar tempo restante
    if (checkTimeRemaining(startTime) < 30000) {
      logger.error('Tempo insuficiente para processar');
      return new Response(JSON.stringify({ success: false, message: 'Timeout approaching' }), 
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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

    // Buscar fixtures do dia
    const tz = encodeURIComponent('America/Sao_Paulo');
    logger.log(`Buscando jogos para ${targetDate}...`);
    
    const [allNS, allTBD] = await Promise.all([
      fetchFromAPI(`/fixtures?date=${targetDate}&timezone=${tz}&status=NS`),
      fetchFromAPI(`/fixtures?date=${targetDate}&timezone=${tz}&status=TBD`),
    ]);
    
    const byFixtureId = new Map<number, any>();
    for (const f of [...allNS, ...allTBD]) {
      const id = f?.fixture?.id;
      if (id != null) byFixtureId.set(id, f);
    }
    
    if (byFixtureId.size === 0) {
      logger.log('Nenhum jogo achado com timezone, tentando busca UTC...');
      const [nsUtc, tbdUtc] = await Promise.all([
        fetchFromAPI(`/fixtures?date=${targetDate}&status=NS`),
        fetchFromAPI(`/fixtures?date=${targetDate}&status=TBD`),
      ]);
      for (const f of [...nsUtc, tbdUtc]) {
        const id = f?.fixture?.id;
        if (id != null) byFixtureId.set(id, f);
      }
    }

    const allFixtures = [...byFixtureId.values()];
    logger.log(`Total de jogos encontrados: ${allFixtures.length}`);

    // Filtrar apenas jogos das ligas permitidas
    const allowedFixtures = allFixtures.filter((f: any) => {
      const leagueId = f?.league?.id;
      return leagueId && ALLOWED_LEAGUE_IDS.has(leagueId);
    });
    logger.log(`Jogos de ligas permitidas: ${allowedFixtures.length}/${allFixtures.length}`);

    // Filtrar apenas jogos de HOJE (17/05/2026)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayDate = new Date(todayStr + 'T00:00:00.000Z');
    const tomorrowDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
    
    const scheduled = allowedFixtures.filter((f: any) => {
      const gameDate = new Date(f.fixture.date);
      return gameDate >= todayDate && gameDate < tomorrowDate && (f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD');
    });

    const MAX_CORNER_POOL = 100;
    const pool = [...scheduled]
      .sort((a: any, b: any) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
      .slice(0, MAX_CORNER_POOL);
    logger.log(`Pool: ${pool.length} fixtures (cap ${MAX_CORNER_POOL})`);

    // Verificar tempo antes de processar times
    if (checkTimeRemaining(startTime) < 60000) {
      logger.error('Tempo insuficiente após buscar fixtures');
      return new Response(JSON.stringify({ success: false, message: 'Timeout approaching' }), 
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    teamCache.clear();
    const cornerTeamIds = new Set<number>();
    const tidToName = new Map<number, string>();
    for (const f of pool) {
      const hid = f.teams.home.id;
      const aid = f.teams.away.id;
      cornerTeamIds.add(hid);
      cornerTeamIds.add(aid);
      tidToName.set(hid, f.teams.home.name);
      tidToName.set(aid, f.teams.away.name);
    }
    logger.log(`Analisando ${cornerTeamIds.size} times...`);

    // Processar times em lotes paralelos
    const teamIdsArray = [...cornerTeamIds];
    const teamBatches: number[][] = [];
    for (let i = 0; i < teamIdsArray.length; i += BATCH_SIZE) {
      teamBatches.push(teamIdsArray.slice(i, i + BATCH_SIZE));
    }

    let ci = 0;
    for (const batch of teamBatches) {
      if (checkTimeRemaining(startTime) < 30000) {
        logger.error('Timeout durante análise de times');
        break;
      }

      const promises = batch.map(tid => analyzeTeamCorners(tid, tidToName.get(tid) ?? String(tid), supabase));
      await Promise.all(promises);
      ci += batch.length;
      logger.log(`Processados ${ci}/${teamIdsArray.length} times`);
      
      if (ci < teamIdsArray.length) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    // Verificar tempo antes de analisar fixtures
    if (checkTimeRemaining(startTime) < 60000) {
      logger.error('Tempo insuficiente para analisar fixtures');
      return new Response(JSON.stringify({ success: false, message: 'Timeout approaching' }), 
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Analisar cada fixture
    const predictions: any[] = [];
    const fixtureBatches: any[][] = [];
    for (let i = 0; i < pool.length; i += BATCH_SIZE) {
      fixtureBatches.push(pool.slice(i, i + BATCH_SIZE));
    }

    for (const batch of fixtureBatches) {
      if (checkTimeRemaining(startTime) < 30000) {
        logger.error('Timeout durante análise de fixtures');
        break;
      }

      const batchPromises = batch.map(async (f: any) => {
        try {
          const [hs, as_] = await Promise.all([
            analyzeTeamCorners(f.teams.home.id, f.teams.home.name, supabase),
            analyzeTeamCorners(f.teams.away.id, f.teams.away.name, supabase),
          ]);

          const pred = calculatePrediction(hs, as_, f.league.id);
          const matchScore = calcCornerMatchScore(hs, as_, f.league.id, pred.expectedTotal, pred.confidence);

          const oddsPayload = await fetchFromAPI(`/odds?fixture=${f.fixture.id}`);
          const { overOdd, underOdd, apiLine } = cornerApiOddsForModelLine(oddsPayload, pred.marketLine);

          const row: Record<string, unknown> = {
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
            overOdd,
            underOdd,
            apiCornerLine: apiLine,
            ...pred,
          };
          ensureCornerLegOdds(row);
          return row;
        } catch (e: any) {
          console.error(`Error fixture ${f.fixture.id}: ${e.message}`);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      predictions.push(...batchResults.filter(r => r !== null));

      if (checkTimeRemaining(startTime) < 30000) break;
      await new Promise(r => setTimeout(r, 50));
    }

    const apiOnly = predictions.filter((p) => p.oddsSource === 'api').length;
    logger.log(`Predictions: ${predictions.length} total (API: ${apiOnly})`);

    // Ordenar deterministicamente
    predictions.sort((a, b) => 
      b.matchScore - a.matchScore || 
      b.confidence - a.confidence || 
      a.fixtureId - b.fixtureId
    );

    logger.log(`  matchScore >= 7: ${predictions.filter(p => p.matchScore >= 7).length}`);
    logger.log(`  matchScore 5-6: ${predictions.filter(p => p.matchScore >= 5 && p.matchScore < 7).length}`);
    logger.log(`  matchScore < 5: ${predictions.filter(p => p.matchScore < 5).length}`);

    // Filtrar candidatos - thresholds MUITO permissivos
    const minPremMs = 2; // Reduzido para permitir mais candidatos
    const minFreeMs = 1; // Reduzido para permitir mais candidatos

    let freeList = predictions.filter((p) => p.matchScore >= minFreeMs);
    if (freeList.length < 6) {
      freeList = [...predictions];
    }

    let premiumList = predictions.filter((p) => p.matchScore >= minPremMs);
    if (premiumList.length < 6) {
      premiumList = [...predictions];
    }

    const forPremium = [...premiumList].sort((a, b) =>
      b.confidence - a.confidence ||
      (b.lineEdge ?? 0) - (a.lineEdge ?? 0) ||
      b.matchScore - a.matchScore
    );
    let forFree = [...freeList].sort((a, b) =>
      (b.lineEdge ?? 0) - (a.lineEdge ?? 0) ||
      b.matchScore - a.matchScore ||
      b.confidence - a.confidence
    );
    if (forFree.length < 4) {
      forFree = [...predictions].sort((a, b) =>
        b.matchScore - a.matchScore ||
        b.confidence - a.confidence
      );
    }

    let threshold = 1;
    let candidates = predictions.filter((p) => p.matchScore >= threshold);
    if (candidates.length < 8) {
      candidates = [...predictions];
    }

    logger.log(`freeList=${forFree.length}, premiumList=${forPremium.length}, planningPool=${candidates.length}`);

    const usedFixtures = new Set<number>();
    
    // Gerar Premium Multiples primeiro (para identificar SuperOdd)
    const premiumMultiples: CornerAccumulator[] = buildCornerMultiples(
      forPremium,
      'premium',
      TARGET_PREMIUM_COUNT,
      3,
      usedFixtures,
      0 // SuperOdd será a primeira (maior odd)
    );

    // SuperOdd é a primeira premium (índice 0)
    const superOddIndex = 0;
    logger.log(`SuperOdd: ${premiumMultiples[0]?.combinedOdd || 0} odds, ${premiumMultiples[0]?.games.length || 0} jogos`);

    // Gerar Free Multiples (com fixtures diferentes)
    const freeMultiples: CornerAccumulator[] = buildCornerMultiples(
      forFree,
      'free',
      TARGET_FREE_COUNT,
      2,
      usedFixtures
    );

    // Verificar duplicatas
    const allMultiples = [...premiumMultiples, ...freeMultiples];
    if (hasDuplicateMultiples(allMultiples)) {
      logger.error('DUPLICATE MULTIPLES DETECTED!');
    }

    logger.log(`Geradas: premium=${premiumMultiples.length}, free=${freeMultiples.length}, superodd=${superOddIndex >= 0 ? 'yes' : 'no'}`);

    // Inserir múltiplas
    let insertedMultiples = 0;
    const executionTime = Date.now() - startTime;

    for (let i = 0; i < allMultiples.length; i++) {
      const multiple = allMultiples[i];
      // SuperOdd é a primeira premium (índice 0-5 nas premium, 0-5 no allMultiples)
      const isSuperOdd = i === superOddIndex && premiumMultiples[0] && multiple.combinedOdd >= 3;
      
      const { error } = await supabase.from('corner_analyses').insert({
        is_multiple: true,
        is_superodd: isSuperOdd || null,
        games: multiple.games,
        combined_confidence: multiple.combinedConfidence,
        combined_odd: multiple.combinedOdd,
        tier: isSuperOdd ? 'superodd' : multiple.tier,
        status: 'pending',
        home_team: isSuperOdd ? `SuperOdd ${multiple.games.length}x` : `Múltipla ${multiple.games.length}x`,
        away_team: isSuperOdd ? 'SUPERODD' : (multiple.tier === 'premium' ? 'Premium' : 'Free'),
        league: 'Corner Multiple',
        kickoff_at: multiple.games[0].kickoff_at,
        confidence: isSuperOdd ? Math.min(95, multiple.combinedConfidence + 5) : multiple.combinedConfidence,
        avg_prediction: 0,
        probable_range_min: 0,
        probable_range_max: 0,
        strategy_type: multiple.games[0].strategy || 'over',
        home_team_logo: multiple.games[0]?.home_logo || null,
        away_team_logo: multiple.games[0]?.away_logo || null,
        generation_metadata: {
          generated_at: new Date().toISOString(),
          version: 'corneredge_v5_deterministic',
          execution_time_ms: executionTime,
          pool_size: pool.length,
          predictions_count: predictions.length,
          premium_count: premiumMultiples.length,
          free_count: freeMultiples.length,
        }
      });

      if (error) {
        logger.error(`Error inserting multiple: ${error.message}`);
        continue;
      }
      insertedMultiples++;
    }

    // Validar sucesso
    const { count } = await supabase
      .from('corner_analyses')
      .select('id', { count: 'exact', head: true })
      .gte('kickoff_at', `${targetDate}T00:00:00.000Z`)
      .lte('kickoff_at', `${targetDate}T23:59:59.999Z`);

    logger.log(`Validação: ${count} múltiplas no banco (esperado: 10)`);

    // Se gerou menos que o esperado, registrar para retry
    if (count !== 10) {
      logger.error(`GERAÇÃO INCOMPLETA: ${count}/10 múltiplas geradas`);
      
      if (supabase) {
        await supabase.from('generation_retry_queue').insert({
          target_date: targetDate,
          attempt_number: 1,
          last_error: `Geradas ${count}/10 múltiplas`,
          status: 'pending',
          next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });
      }
    }

    const totalTime = Date.now() - startTime;
    return new Response(
      JSON.stringify({
        success: count === 10,
        multiples: insertedMultiples,
        total_in_db: count,
        premium: premiumMultiples.length,
        free: freeMultiples.length,
        superodd: premiumMultiples[0] && premiumMultiples[0].combinedOdd >= 3 ? 1 : 0,
        execution_time_ms: totalTime,
        message: `Generated ${insertedMultiples} corner multiples in ${totalTime}ms`,
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