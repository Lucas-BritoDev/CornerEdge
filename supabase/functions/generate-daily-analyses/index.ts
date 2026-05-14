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
// Modelo: baseline por league_id (shrinkage). O pool do dia = todas as ligas (sem whitelist).
// ============================================================================

// Média de escanteios por liga (baseline para shrinkage; ligas fora da tabela usam 9.5)
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

const MIN_VALID_MATCHES = 0; // reservado; não filtramos mais por histórico FT mínimo
const teamCache = new Map<number, any>();

/** Metas diárias: premium primeiro (melhor matchScore), free com jogos reservados */
const TARGET_PREMIUM_MULTIPLES = 6;
const TARGET_FREE_MULTIPLES = 4;

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

/** IDs de aposta comuns (API-Sports) para total de escanteios Over/Under. */
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

function pickClosestApiCornerLine(
  byLine: Map<number, { over: number[]; under: number[] }>,
  modelLine: number,
): number | null {
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

/** Odds reais (mediana entre casas) para Over/Under na linha da API mais próxima da linha do modelo. */
function cornerApiOddsForModelLine(
  oddsPayload: any[],
  modelLine: number,
): { overOdd: number; underOdd: number; apiLine: number | null } {
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

/** Quando a API não traz mercado de cantos: odd implícita a partir do modelo (P(over) na linha), só para desbloquear múltiplas. */
function ensureCornerLegOdds(p: Record<string, unknown>): void {
  const o = (p.overOdd as number) ?? 0;
  const u = (p.underOdd as number) ?? 0;
  if (o > 1.01 || u > 1.01) {
    p.oddsSource = 'api';
    return;
  }
  const pOver = Math.max(0.07, Math.min(0.93, ((p.overProbability as number) ?? 50) / 100));
  const margin = 1.05;
  p.overOdd = parseFloat(Math.min(2.5, Math.max(1.3, margin / pOver)).toFixed(2));
  p.underOdd = parseFloat(Math.min(2.5, Math.max(1.3, margin / (1 - pOver))).toFixed(2));
  p.oddsSource = 'model_implied';
}

function legSelectionOdd(pred: any): number {
  const st = cornerStrategy(pred);
  return st === 'over' ? (pred.overOdd ?? 0) : (pred.underOdd ?? 0);
}

/** Últimos 5 jogos FT: média ponderada (decaimento) de escanteios por contexto casa/fora. */
async function analyzeTeamCorners(teamId: number, teamName: string) {
  if (teamCache.has(teamId)) return teamCache.get(teamId);

  const lastMatches = await fetchFromAPI(`/fixtures?team=${teamId}&last=15`);
  const validMatches = lastMatches
    .filter((m: any) => m.fixture.status.short === 'FT')
    .slice(0, 5);

  /** Sem FT recentes: usa média neutra para não zerar o modelo (evita 0 candidatos no dia). */
  if (validMatches.length === 0) {
    const neutral = 5.0;
    const empty = {
      teamId,
      teamName,
      avgCornersHome: neutral,
      avgCornersAway: neutral,
      avgConcededHome: neutral,
      avgConcededAway: neutral,
      momentum: neutral,
      stdDevHome: 2.2,
      stdDevAway: 2.2,
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
    teamId,
    teamName,
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
  /** Odd real da API para a perna (Over/Under na linha escolhida). */
  selection_odd?: number;
  gen_telemetry?: Record<string, unknown>;
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

  const confidence = Math.min(
    98,
    Math.max(35, Math.round(overProb * 0.70 + dataQuality * 0.30)),
  );

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

// ============================================================================
// CONSTRUTOR DE MÚLTIPLAS DE ESCANTEIOS
// ============================================================================
/** Direção over/under: primeiro probabilidade na linha; depois μ vs linha. */
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

/**
 * Free: matchScore mínimo + sinal coerente com over/under.
 * Corrige o caso P≈50 com μ acima da linha (estratégia "over") que antes era rejeitado por exigir P≥58.
 */
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

/** Monta múltiplas alternando over/under; odd da API ou implícita do modelo (ensureCornerLegOdds). */
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
    let wantOver = i % 2 === 0;

    while (games.length < gamesPerMultiple) {
      const lane: 'over' | 'under' = wantOver ? 'over' : 'under';
      const inMultiple = new Set(games.map((g) => g.fixture_id));

      const preferred = candidates.find(
        (c: any) =>
          !usedFixtures.has(c.fixtureId) &&
          !inMultiple.has(c.fixtureId) &&
          cornerStrategy(c) === lane &&
          legSelectionOdd(c) > 1.01,
      );
      const candidate =
        preferred ||
        candidates.find(
          (c: any) =>
            !usedFixtures.has(c.fixtureId) &&
            !inMultiple.has(c.fixtureId) &&
            legSelectionOdd(c) > 1.01,
        );
      if (!candidate) break;

      const legOdd = legSelectionOdd(candidate);
      const strat = cornerStrategy(candidate);
      const isSuperCorner = tier === 'premium' && gamesPerMultiple >= 4;

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
        selection_odd: parseFloat(legOdd.toFixed(2)),
        gen_telemetry: {
          tier,
          is_super_corner: isSuperCorner,
          match_score: candidate.matchScore,
          over_probability: candidate.overProbability,
          line_edge: candidate.lineEdge ?? null,
          api_corner_line: candidate.apiCornerLine ?? null,
          odds_source: candidate.oddsSource ?? 'api',
          gen_version: 'corneredge_v4_odds_mixed',
        },
      });

      combinedConfidence += candidate.confidence;
      usedFixtures.add(candidate.fixtureId);
      wantOver = !wantOver;
    }

    if (games.length === gamesPerMultiple) {
      const combinedOdd = parseFloat(
        games.reduce((p, g) => p * (g.selection_odd ?? 1), 1).toFixed(2),
      );

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
    const [allNS, allTBD, nsUtc, tbdUtc] = await Promise.all([
      fetchFromAPI(`/fixtures?date=${targetDate}&timezone=${tz}&status=NS`),
      fetchFromAPI(`/fixtures?date=${targetDate}&timezone=${tz}&status=TBD`),
      fetchFromAPI(`/fixtures?date=${targetDate}&status=NS`),
      fetchFromAPI(`/fixtures?date=${targetDate}&status=TBD`),
    ]);
    const byFixtureId = new Map<number, any>();
    for (const f of [...allNS, ...allTBD, ...nsUtc, ...tbdUtc]) {
      const id = f?.fixture?.id;
      if (id != null) byFixtureId.set(id, f);
    }
    const allFixtures = [...byFixtureId.values()];
    console.log(`[CornerEdge] Found ${allFixtures.length} total fixtures (NS+TBD, tz=America/Sao_Paulo)`);

    const scheduled = allFixtures.filter(
      (f: any) => f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD'
    );

    /** Todas as competições do dia (sem separação por liga); teto só para tempo de API. */
    const MAX_CORNER_POOL = 300;
    const pool = [...scheduled]
      .sort(
        (a: any, b: any) =>
          new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime(),
      )
      .slice(0, MAX_CORNER_POOL);
    console.log(
      `[CornerEdge] Pool: all leagues, ${pool.length} fixtures (cap ${MAX_CORNER_POOL}, scheduled=${scheduled.length})`,
    );

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
    console.log(`[CornerEdge] Pré-cálculo escanteios (últimos 5 FT, peso decrescente) para ${cornerTeamIds.size} times`);
    let ci = 0;
    for (const tid of cornerTeamIds) {
      await analyzeTeamCorners(tid, tidToName.get(tid) ?? String(tid));
      ci++;
      if (ci % 20 === 0) await new Promise((r) => setTimeout(r, 120));
    }

    // Analisar cada fixture
    const predictions: any[] = [];
    for (const f of pool) {
      try {
        const [hs, as_] = await Promise.all([
          analyzeTeamCorners(f.teams.home.id, f.teams.home.name),
          analyzeTeamCorners(f.teams.away.id, f.teams.away.name),
        ]);

        const pred = calculatePrediction(hs, as_, f.league.id);
        const matchScore = calcCornerMatchScore(hs, as_, f.league.id, pred.expectedTotal, pred.confidence);

        const oddsPayload = await fetchFromAPI(`/odds?fixture=${f.fixture.id}`);
        const { overOdd, underOdd, apiLine } = cornerApiOddsForModelLine(oddsPayload, pred.marketLine);
        await new Promise((r) => setTimeout(r, pool.length > 70 ? 55 : 85));

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
        predictions.push(row);
      } catch (e: any) {
        console.error(`[CornerEdge] Error fixture ${f.fixture.id}: ${e.message}`);
      }
    }

    const apiOnly = predictions.filter((p) => p.oddsSource === 'api').length;
    console.log(
      `[CornerEdge] Odds: API em ${apiOnly}/${predictions.length} jogos; restante usa odd implícita do modelo (P over na linha).`,
    );

    // Ordenar por matchScore desc, depois por confiança desc
    predictions.sort((a, b) => b.matchScore - a.matchScore || b.confidence - a.confidence);

    console.log(`[CornerEdge] Predictions: ${predictions.length} total`);
    console.log(`  matchScore >= 7: ${predictions.filter(p => p.matchScore >= 7).length}`);
    console.log(`  matchScore 5-6: ${predictions.filter(p => p.matchScore >= 5 && p.matchScore < 7).length}`);
    console.log(`  matchScore < 5: ${predictions.filter(p => p.matchScore < 5).length}`);

    // ============================================================================
    // GERAR MÚLTIPLAS — Free = alta qualidade (edge + prob + matchScore); Premium = limiar mais alto
    // ============================================================================
    const lowVolCorners = predictions.length < 36;
    const minPremMs =
      predictions.filter((p) => p.matchScore >= 7).length >= 6 && !lowVolCorners ? 7 : 6;
    const minFreeMs =
      lowVolCorners || predictions.length < 18 ? 3 : predictions.length > 45 ? 2 : 4;

    let relaxProb = false;
    let freeList = predictions.filter((p) => passesCornerFreeStrict(p, minFreeMs, false));
    if (freeList.length < 10) {
      relaxProb = true;
      freeList = predictions.filter((p) => passesCornerFreeStrict(p, minFreeMs, true));
    }
    if (freeList.length < 6) {
      const bump = predictions.filter((p) => p.matchScore >= Math.max(3, minFreeMs));
      const byId = new Map<number, any>();
      for (const p of [...freeList, ...bump]) {
        const cur = byId.get(p.fixtureId);
        if (!cur || p.matchScore > cur.matchScore) byId.set(p.fixtureId, p);
      }
      freeList = [...byId.values()];
    }

    let premiumList = predictions.filter((p) => p.matchScore >= minPremMs);
    if (premiumList.length < 10) {
      premiumList = predictions.filter((p) => p.matchScore >= Math.max(4, minPremMs - 1));
    }

    const forPremium = [...premiumList].sort(
      (a, b) =>
        b.confidence - a.confidence ||
        (b.lineEdge ?? 0) - (a.lineEdge ?? 0) ||
        b.matchScore - a.matchScore,
    );
    const forFreeBase = [...freeList].sort(
      (a, b) =>
        (b.lineEdge ?? 0) - (a.lineEdge ?? 0) ||
        b.matchScore - a.matchScore ||
        b.confidence - a.confidence,
    );
    const minFreePool = 2;
    const forFree =
      forFreeBase.length >= minFreePool
        ? forFreeBase
        : [...forPremium, ...forFreeBase]
            .filter((p, i, arr) => arr.findIndex((x) => x.fixtureId === p.fixtureId) === i)
            .sort(
              (a, b) =>
                (b.lineEdge ?? 0) - (a.lineEdge ?? 0) ||
                b.matchScore - a.matchScore ||
                b.confidence - a.confidence,
            );

    let threshold = 4;
    let candidates = predictions.filter((p) => p.matchScore >= threshold);
    if (candidates.length < 8) {
      threshold = 3;
      candidates = predictions.filter((p) => p.matchScore >= threshold);
    }
    if (candidates.length < 8 && predictions.length >= 15) {
      threshold = 2;
      candidates = predictions.filter((p) => p.matchScore >= threshold);
    }
    if (candidates.length < 3) {
      candidates = [...predictions];
    }

    console.log(
      `[CornerEdge] freeList=${forFree.length} (minMs=${minFreeMs}, relaxProb=${relaxProb}) premiumList=${forPremium.length} (minPremMs=${minPremMs}) planningPool=${candidates.length}`,
    );

    const usedFixtures = new Set<number>();
    let premiumMultiples: CornerAccumulator[] = [];
    let freeMultiples: CornerAccumulator[] = [];

    /** Dias cheios: 1 múltipla premium “super” 4x cantos + demais 3x; free 4×2. Meta 6+4. */
    const legsPremiumPrimary = 3;
    const legsFreeMax = 2;
    const oddsReady = (p: any) => legSelectionOdd(p) > 1.01;
    const nPlan = predictions.filter(oddsReady).length;
    if (nPlan === 0) {
      console.warn('[CornerEdge] Nenhuma perna com odd após fallback — revisar modelo ou API.');
    }

    const poolForPremium = [...candidates].sort(
      (a, b) =>
        b.confidence - a.confidence ||
        (b.lineEdge ?? 0) - (a.lineEdge ?? 0) ||
        b.matchScore - a.matchScore,
    );
    const forPremiumBuild =
      forPremium.filter(oddsReady).length >= 2
        ? forPremium.filter(oddsReady)
        : poolForPremium.filter(oddsReady);
    let forFreeBuild = forFree.filter(oddsReady);
    if (forFreeBuild.length < legsFreeMax) {
      const byId = new Map<number, any>();
      for (const p of [...forFreeBuild, ...predictions.filter(oddsReady)]) {
        const cur = byId.get(p.fixtureId);
        if (!cur || p.matchScore > cur.matchScore) byId.set(p.fixtureId, p);
      }
      forFreeBuild = [...byId.values()].sort(
        (a, b) =>
          (b.lineEdge ?? 0) - (a.lineEdge ?? 0) ||
          b.matchScore - a.matchScore ||
          b.confidence - a.confidence,
      );
    }

    if (nPlan >= 16) {
      premiumMultiples.push(
        ...buildCornerMultiples(forPremiumBuild, 'premium', 1, 4, usedFixtures),
      );
    }
    const prem3Need = TARGET_PREMIUM_MULTIPLES - premiumMultiples.length;
    if (prem3Need > 0) {
      premiumMultiples.push(
        ...buildCornerMultiples(forPremiumBuild, 'premium', prem3Need, legsPremiumPrimary, usedFixtures),
      );
    }
    freeMultiples = buildCornerMultiples(
      forFreeBuild,
      'free',
      TARGET_FREE_MULTIPLES,
      legsFreeMax,
      usedFixtures,
    );

    const legs2 = 2;
    let needPrem = TARGET_PREMIUM_MULTIPLES - premiumMultiples.length;
    let needFree = TARGET_FREE_MULTIPLES - freeMultiples.length;
    if (needPrem > 0) {
      premiumMultiples.push(
        ...buildCornerMultiples(forPremiumBuild, 'premium', needPrem, legs2, usedFixtures),
      );
    }
    needFree = TARGET_FREE_MULTIPLES - freeMultiples.length;
    if (needFree > 0) {
      freeMultiples.push(
        ...buildCornerMultiples(forFreeBuild, 'free', needFree, legs2, usedFixtures),
      );
    }

    console.log(
      `[CornerEdge] Montagem: premium=${premiumMultiples.length} (incl. super 4x se nPlan≥16) + free=${freeMultiples.length}; nPlan=${nPlan}`,
    );

    if (premiumMultiples.length + freeMultiples.length === 0 && candidates.length >= 2) {
      const used2 = new Set<number>();
      const legs2sparse = 2;
      const nOdds = predictions.filter(oddsReady).length;
      if (nOdds >= 8) {
        premiumMultiples = buildCornerMultiples(
          forPremiumBuild,
          'premium',
          1,
          4,
          used2,
        );
      }
      const premSlots = Math.min(
        TARGET_PREMIUM_MULTIPLES - premiumMultiples.length,
        Math.max(1, Math.floor((nOdds - used2.size) / 2)),
      );
      if (premSlots > 0) {
        premiumMultiples.push(
          ...buildCornerMultiples(
            forPremiumBuild,
            'premium',
            premSlots,
            legs2sparse,
            used2,
          ),
        );
      }
      const freeSlots = Math.min(
        TARGET_FREE_MULTIPLES,
        Math.max(1, Math.floor((nOdds - used2.size) / 2)),
      );
      freeMultiples = buildCornerMultiples(forFreeBuild, 'free', freeSlots, legs2sparse, used2);
      for (const id of used2) usedFixtures.add(id);
      console.log(
        `[CornerEdge] Sparse day (odds reais): premium=${premiumMultiples.length}, free=${freeMultiples.length}`,
      );
    }

    const allMultiples = [...freeMultiples, ...premiumMultiples];
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
        pool_size: pool.length,
        predictions_total: predictions.length,
        scheduled_merged: allFixtures.length,
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
