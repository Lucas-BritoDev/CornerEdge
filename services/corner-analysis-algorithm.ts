/**
 * CornerEdge - Corner Analysis Algorithm v2.0
 *
 * MODELO MATEMÁTICO:
 * ─────────────────────────────────────────────────────────────────────────────
 * O mercado de escanteios opera em linhas múltiplas de 0.5 (6.5, 7.5, 8.5...).
 * A linha recomendada é sempre um "Over X.5" onde X.5 < média esperada.
 *
 * FÓRMULA PRINCIPAL:
 *   μ = (avgHome_casa × w1) + (avgAway_fora × w2) + (pressão_defensiva × w3)
 *
 *   Onde:
 *   - avgHome_casa  = média de escanteios do mandante jogando em casa
 *   - avgAway_fora  = média de escanteios do visitante jogando fora
 *   - pressão_def   = média de escanteios sofridos pelos dois times
 *   - w1=0.40, w2=0.35, w3=0.25 (pesos calibrados empiricamente)
 *
 * LINHA DE MERCADO:
 *   linha = floor(μ / 0.5) × 0.5 - 0.5
 *   → Se μ = 9.3 → linha = 8.5 (Over 8.5)
 *   → Se μ = 10.1 → linha = 9.5 (Over 9.5)
 *
 * CONFIANÇA ESTATÍSTICA:
 *   Baseada na probabilidade acumulada de Poisson P(X > linha | λ=μ)
 *   Ajustada pelo desvio padrão histórico dos dados
 *
 * FILTRO DE QUALIDADE:
 *   Só publica análises com P(Over linha) ≥ 70%
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
    fetchFixturesByDate,
    fetchTeamLastMatches,
    fetchFixtureStatistics,
    extractCornerStats,
    filterBestAvailableFixtures,
} from './football-api-service';
import { supabase } from '../lib/supabase';

// ─── Pesos do modelo ──────────────────────────────────────────────────────────
const W_HOME_ATK  = 0.40; // Ataque do mandante em casa
const W_AWAY_ATK  = 0.35; // Ataque do visitante fora
const W_DEFENSIVE = 0.25; // Pressão defensiva (escanteios sofridos)

// ─── Filtro mínimo de qualidade ───────────────────────────────────────────────
const MIN_CONFIDENCE = 70; // Só publica se P(Over) ≥ 70%
const MIN_VALID_MATCHES = 3; // Mínimo de jogos para análise confiável

interface TeamCornerStats {
    teamId: number;
    teamName: string;
    // Médias específicas por contexto (casa/fora)
    avgCornersHome: number;      // Média de escanteios marcados jogando em CASA
    avgCornersAway: number;      // Média de escanteios marcados jogando FORA
    avgConcededHome: number;     // Média de escanteios sofridos em CASA
    avgConcededAway: number;     // Média de escanteios sofridos FORA
    stdDevHome: number;          // Desvio padrão em casa
    stdDevAway: number;          // Desvio padrão fora
    validMatchesHome: number;
    validMatchesAway: number;
    totalValidMatches: number;
}

interface MarketLine {
    line: number;           // Ex: 8.5
    overProbability: number; // P(total > line) em %
    label: string;          // Ex: "Over 8.5"
}

interface CornerPrediction {
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    homeTeamLogo: string;
    awayTeamLogo: string;
    league: string;
    kickoffAt: string;
    expectedTotal: number;       // μ calculado
    marketLine: number;          // Linha recomendada (múltiplo de 0.5)
    overProbability: number;     // P(Over linha) em %
    confidence: number;          // Confiança geral (0-100)
    probableRangeMin: number;
    probableRangeMax: number;
    robustScenarios: Array<{ threshold: number; stability: string; probability: number }>;
    distribution: Array<{ threshold: number; probability: number }>;
    homeStats: TeamCornerStats;
    awayStats: TeamCornerStats;
    dataQuality: number;         // Qualidade dos dados (0-100)
}

// ─── Distribuição de Poisson ──────────────────────────────────────────────────
/**
 * Calcula P(X = k) para distribuição de Poisson com λ
 */
function poissonPMF(lambda: number, k: number): number {
    if (lambda <= 0) return k === 0 ? 1 : 0;
    let logP = -lambda + k * Math.log(lambda);
    for (let i = 1; i <= k; i++) logP -= Math.log(i);
    return Math.exp(logP);
}

/**
 * Calcula P(X > threshold) = 1 - P(X ≤ threshold) usando Poisson
 */
function poissonOverProbability(lambda: number, threshold: number): number {
    let cumulative = 0;
    const maxK = Math.ceil(lambda * 3 + 10); // Limite superior seguro
    for (let k = 0; k <= threshold; k++) {
        cumulative += poissonPMF(lambda, k);
    }
    return Math.max(0, Math.min(100, (1 - cumulative) * 100));
}

/**
 * Calcula desvio padrão de um array de números
 */
function standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

/**
 * Converte previsão contínua para linha de mercado (múltiplo de 0.5)
 * Regra: linha = floor(μ / 0.5) × 0.5 - 0.5
 * Garante que a linha está ABAIXO da média (Over com margem)
 */
function toMarketLine(expectedTotal: number): number {
    // Arredonda para baixo no múltiplo de 0.5 mais próximo, depois subtrai 0.5
    const floorHalf = Math.floor(expectedTotal / 0.5) * 0.5;
    const line = floorHalf - 0.5;
    // Mínimo de 5.5, máximo de 13.5
    return Math.max(5.5, Math.min(13.5, line));
}

// ─── Análise de time ──────────────────────────────────────────────────────────
async function analyzeTeamCorners(teamId: number, teamName: string): Promise<TeamCornerStats> {
    const lastMatches = await fetchTeamLastMatches(teamId, 10);

    const cornersHome: number[] = [];
    const cornersAway: number[] = [];
    const concededHome: number[] = [];
    const concededAway: number[] = [];

    for (const match of lastMatches) {
        if (match.fixture.status.short !== 'FT') continue;

        const stats = await fetchFixtureStatistics(match.fixture.id);
        if (stats.length === 0) continue;

        const corners = extractCornerStats(stats);
        if (corners.total === 0) continue;

        const isHomeMatch = match.teams.home.id === teamId;

        if (isHomeMatch) {
            cornersHome.push(corners.home);
            concededHome.push(corners.away);
        } else {
            cornersAway.push(corners.away);
            concededAway.push(corners.home);
        }
    }

    const avg = (arr: number[]) => arr.length > 0
        ? arr.reduce((a, b) => a + b, 0) / arr.length
        : 0;

    return {
        teamId,
        teamName,
        avgCornersHome:   parseFloat(avg(cornersHome).toFixed(2)),
        avgCornersAway:   parseFloat(avg(cornersAway).toFixed(2)),
        avgConcededHome:  parseFloat(avg(concededHome).toFixed(2)),
        avgConcededAway:  parseFloat(avg(concededAway).toFixed(2)),
        stdDevHome:       parseFloat(standardDeviation(cornersHome).toFixed(2)),
        stdDevAway:       parseFloat(standardDeviation(cornersAway).toFixed(2)),
        validMatchesHome: cornersHome.length,
        validMatchesAway: cornersAway.length,
        totalValidMatches: cornersHome.length + cornersAway.length,
    };
}

// ─── Cálculo da previsão ──────────────────────────────────────────────────────
function calculatePrediction(
    homeStats: TeamCornerStats,
    awayStats: TeamCornerStats
): Omit<CornerPrediction, 'fixtureId' | 'homeTeam' | 'awayTeam' | 'homeTeamLogo' | 'awayTeamLogo' | 'league' | 'kickoffAt' | 'homeStats' | 'awayStats'> {

    // ── 1. Calcular μ (esperança matemática do total de escanteios) ────────────
    //
    // Componente ofensivo do mandante (jogando em casa)
    const homeAtk = homeStats.avgCornersHome > 0
        ? homeStats.avgCornersHome
        : homeStats.avgCornersAway * 1.1; // Ajuste casa/fora se sem dados em casa

    // Componente ofensivo do visitante (jogando fora)
    const awayAtk = awayStats.avgCornersAway > 0
        ? awayStats.avgCornersAway
        : awayStats.avgCornersHome * 0.9;

    // Componente defensivo (pressão que cada time sofre)
    const defensivePressure = (
        (homeStats.avgConcededHome > 0 ? homeStats.avgConcededHome : 4.5) +
        (awayStats.avgConcededAway > 0 ? awayStats.avgConcededAway : 4.5)
    ) / 2;

    // μ ponderado
    const mu = (homeAtk * W_HOME_ATK) + (awayAtk * W_AWAY_ATK) + (defensivePressure * W_DEFENSIVE);

    // Ajuste mínimo: média histórica de escanteios em jogos profissionais ≈ 9.5
    // Se dados insuficientes, usar média de mercado
    const totalValidData = homeStats.totalValidMatches + awayStats.totalValidMatches;
    const dataWeight = Math.min(1, totalValidData / 16); // 16 jogos = peso máximo
    const marketAverage = 9.5;
    const expectedTotal = parseFloat((mu * dataWeight + marketAverage * (1 - dataWeight)).toFixed(2));

    // ── 2. Linha de mercado ───────────────────────────────────────────────────
    const marketLine = toMarketLine(expectedTotal);

    // ── 3. Probabilidade Over usando Poisson ──────────────────────────────────
    // Ajuste do λ pelo desvio padrão (maior variância = menor confiança)
    const avgStdDev = (
        (homeStats.stdDevHome + homeStats.stdDevAway) / 2 +
        (awayStats.stdDevHome + awayStats.stdDevAway) / 2
    ) / 2;

    // Usar λ ajustado: se desvio alto, λ efetivo é menor (mais conservador)
    const lambdaAdjusted = Math.max(expectedTotal - avgStdDev * 0.3, expectedTotal * 0.85);
    const overProbability = parseFloat(poissonOverProbability(lambdaAdjusted, marketLine).toFixed(1));

    // ── 4. Confiança geral ────────────────────────────────────────────────────
    // Combina: P(Over) + qualidade dos dados + consistência
    const dataQuality = Math.min(100, Math.round(
        (totalValidData / 20) * 60 + // Até 60 pontos por quantidade de dados
        (avgStdDev < 2 ? 40 : avgStdDev < 3 ? 25 : 10) // Até 40 pontos por baixo desvio
    ));

    // Confiança final = média ponderada entre P(Over) e qualidade dos dados
    const confidence = Math.round(
        overProbability * 0.65 + dataQuality * 0.35
    );

    // ── 5. Janela provável ────────────────────────────────────────────────────
    // Intervalo de confiança de ~68% (±1 desvio padrão)
    const sigma = Math.max(1.5, avgStdDev);
    const probableRangeMin = Math.max(5, Math.round(expectedTotal - sigma));
    const probableRangeMax = Math.round(expectedTotal + sigma);

    // ── 6. Distribuição estatística (linhas de mercado) ───────────────────────
    const distribution: Array<{ threshold: number; probability: number }> = [];
    // Linhas de mercado padrão: 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5
    for (let line = 5.5; line <= 12.5; line += 1) {
        const prob = parseFloat(poissonOverProbability(lambdaAdjusted, line).toFixed(1));
        distribution.push({ threshold: line, probability: prob });
    }

    // ── 7. Cenários robustos ──────────────────────────────────────────────────
    // Seleciona as 3 linhas com maior probabilidade que ainda são "apostáveis"
    const robustScenarios: Array<{ threshold: number; stability: string; probability: number }> = [];

    const getStability = (prob: number): string => {
        if (prob >= 85) return 'very_stable';
        if (prob >= 72) return 'stable';
        return 'moderate';
    };

    // Pegar linhas com P ≥ 65% ordenadas do menor para o maior threshold
    const viableLines = distribution
        .filter(d => d.probability >= 65)
        .sort((a, b) => b.threshold - a.threshold) // Maior threshold primeiro
        .slice(0, 3);

    for (const line of viableLines.reverse()) {
        robustScenarios.push({
            threshold: line.threshold,
            stability: getStability(line.probability),
            probability: line.probability,
        });
    }

    // Se não há cenários viáveis, usar os 3 mais prováveis
    if (robustScenarios.length === 0) {
        distribution
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 3)
            .sort((a, b) => a.threshold - b.threshold)
            .forEach(d => robustScenarios.push({
                threshold: d.threshold,
                stability: getStability(d.probability),
                probability: d.probability,
            }));
    }

    return {
        expectedTotal,
        marketLine,
        overProbability,
        confidence: Math.min(95, Math.max(50, confidence)),
        probableRangeMin,
        probableRangeMax,
        distribution,
        robustScenarios,
        dataQuality,
    };
}

// ─── Geração das análises do dia ──────────────────────────────────────────────
export async function generateTodayAnalyses(): Promise<{ success: boolean; count: number; message: string }> {
    try {
        console.log('[CornerAnalysis] Starting analysis generation v2.0...');

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        const allFixtures = await fetchFixturesByDate(dateStr);
        console.log('[CornerAnalysis] Total fixtures:', allFixtures.length);

        const scheduledFixtures = filterBestAvailableFixtures(allFixtures);
        console.log('[CornerAnalysis] Best available:', scheduledFixtures.length);

        if (scheduledFixtures.length === 0) {
            return { success: true, count: 0, message: 'No scheduled fixtures found for today' };
        }

        const selectedFixtures = scheduledFixtures.slice(0, 14);
        const predictions: CornerPrediction[] = [];

        for (const fixture of selectedFixtures) {
            console.log(`[CornerAnalysis] Analyzing: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);

            const homeStats = await analyzeTeamCorners(fixture.teams.home.id, fixture.teams.home.name);
            const awayStats = await analyzeTeamCorners(fixture.teams.away.id, fixture.teams.away.name);

            // Verificar dados mínimos
            const totalData = homeStats.totalValidMatches + awayStats.totalValidMatches;
            if (totalData < MIN_VALID_MATCHES) {
                console.log(`[CornerAnalysis] Insufficient data for ${fixture.teams.home.name} vs ${fixture.teams.away.name}, skipping`);
                continue;
            }

            const pred = calculatePrediction(homeStats, awayStats);

            // Filtro de qualidade: só publicar se P(Over) ≥ MIN_CONFIDENCE
            if (pred.overProbability < MIN_CONFIDENCE) {
                console.log(`[CornerAnalysis] Low confidence (${pred.overProbability}%) for ${fixture.teams.home.name} vs ${fixture.teams.away.name}, skipping`);
                continue;
            }

            predictions.push({
                fixtureId: fixture.fixture.id,
                homeTeam: fixture.teams.home.name,
                awayTeam: fixture.teams.away.name,
                homeTeamLogo: fixture.teams.home.logo,
                awayTeamLogo: fixture.teams.away.logo,
                league: fixture.league.name,
                kickoffAt: fixture.fixture.date,
                homeStats,
                awayStats,
                ...pred,
            });
        }

        // Ordenar por confiança (maior primeiro)
        predictions.sort((a, b) => b.confidence - a.confidence);

        // Tier: top = premium, últimos 3-4 = free
        const freeCount = predictions.length >= 12 ? 4 : 3;
        const premiumCount = Math.max(0, predictions.length - freeCount);
        let insertedCount = 0;

        for (let i = 0; i < predictions.length; i++) {
            const pred = predictions[i];
            const tier = i < premiumCount ? 'premium' : 'free';

            // avg_prediction agora é a linha de mercado (ex: 8.5)
            // probable_range_min/max é o intervalo esperado
            const { data: analysis, error: analysisError } = await supabase
                .from('corner_analyses')
                .insert({
                    fixture_id: pred.fixtureId,
                    home_team: pred.homeTeam,
                    away_team: pred.awayTeam,
                    home_team_logo: pred.homeTeamLogo,
                    away_team_logo: pred.awayTeamLogo,
                    league: pred.league,
                    kickoff_at: pred.kickoffAt,
                    confidence: pred.confidence,
                    avg_prediction: pred.marketLine,       // Linha de mercado (ex: 8.5)
                    probable_range_min: pred.probableRangeMin,
                    probable_range_max: pred.probableRangeMax,
                    tier,
                    status: 'pending',
                })
                .select()
                .single();

            if (analysisError) {
                console.error('[CornerAnalysis] Error inserting:', analysisError);
                continue;
            }

            insertedCount++;

            for (const scenario of pred.robustScenarios) {
                await supabase.from('robust_scenarios').insert({
                    analysis_id: analysis.id,
                    threshold: scenario.threshold,
                    stability: scenario.stability,
                    probability: scenario.probability,
                });
            }

            for (const dist of pred.distribution) {
                await supabase.from('statistical_distribution').insert({
                    analysis_id: analysis.id,
                    threshold: dist.threshold,
                    probability: dist.probability,
                });
            }

            await supabase.from('team_statistics').insert([
                {
                    analysis_id: analysis.id,
                    team_type: 'home',
                    offensive_avg: pred.homeStats.avgCornersHome,
                    home_intensity: pred.homeStats.avgCornersHome,
                    consistency: pred.dataQuality,
                },
                {
                    analysis_id: analysis.id,
                    team_type: 'away',
                    pressure_conceded: pred.awayStats.avgConcededAway,
                    corners_conceded_avg: pred.awayStats.avgConcededAway,
                    away_intensity: pred.awayStats.avgCornersAway,
                },
            ]);
        }

        console.log(`[CornerAnalysis] Generated ${insertedCount} analyses (filtered from ${predictions.length} candidates)`);

        return {
            success: true,
            count: insertedCount,
            message: `Generated ${insertedCount} corner analyses for today`,
        };

    } catch (error) {
        console.error('[CornerAnalysis] Error:', error);
        return {
            success: false,
            count: 0,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// ─── Atualização de resultados ────────────────────────────────────────────────
export async function updateAnalysisResults(fixtureId: number, actualCorners: number): Promise<void> {
    try {
        const { data: analysis, error: findError } = await supabase
            .from('corner_analyses')
            .select('*')
            .eq('fixture_id', fixtureId)
            .single();

        if (findError || !analysis) {
            console.error('[CornerAnalysis] Analysis not found for fixture:', fixtureId);
            return;
        }

        // Correto se o total real foi ACIMA da linha de mercado (Over X.5)
        const isCorrect = actualCorners > analysis.avg_prediction;
        const status = isCorrect ? 'correct' : 'incorrect';

        await supabase
            .from('corner_analyses')
            .update({
                actual_corners: actualCorners,
                status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', analysis.id);

        console.log(`[CornerAnalysis] Fixture ${fixtureId}: ${status} (${actualCorners} corners, Over ${analysis.avg_prediction})`);

    } catch (error) {
        console.error('[CornerAnalysis] Error updating results:', error);
    }
}

export async function updateTodayResults(): Promise<{ success: boolean; updated: number; message: string }> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: analyses, error: fetchError } = await supabase
            .from('corner_analyses')
            .select('*')
            .eq('status', 'pending')
            .gte('published_at', today.toISOString())
            .lt('published_at', tomorrow.toISOString());

        if (fetchError || !analyses?.length) {
            return { success: true, updated: 0, message: 'No pending analyses to update' };
        }

        let updatedCount = 0;

        for (const analysis of analyses) {
            if (!analysis.fixture_id) continue;

            const stats = await fetchFixtureStatistics(analysis.fixture_id);
            if (stats.length === 0) continue;

            const corners = extractCornerStats(stats);
            if (corners.total === 0) continue;

            await updateAnalysisResults(analysis.fixture_id, corners.total);
            updatedCount++;
        }

        return {
            success: true,
            updated: updatedCount,
            message: `Updated ${updatedCount} analyses with results`,
        };

    } catch (error) {
        console.error('[CornerAnalysis] Error updating today results:', error);
        return {
            success: false,
            updated: 0,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
