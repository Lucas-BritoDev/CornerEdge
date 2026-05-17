// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get('FOOTBALL_API_KEY') || '1a896aad078a4eec7ab7121281bcd5ec';
const API_BASE_URL = 'https://v3.football.api-sports.io';

const MAX_EXECUTION_TIME = 140000;
const BATCH_SIZE = 10;
const MAX_CONCURRENT = 5;

async function fetchFromAPI(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY },
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const data = await response.json();
  return data.response || [];
}

function checkTimeRemaining(startTime: number): number {
  return Math.max(0, MAX_EXECUTION_TIME - (Date.now() - startTime));
}

function extractCornerStats(statistics: any[]) {
  let homeCorners = 0;
  let awayCorners = 0;

  statistics.forEach((teamStats: any, index: number) => {
    const cornerStat = teamStats.statistics.find((s: any) => s.type === 'Corner Kicks');
    const corners = cornerStat && cornerStat.value !== null
      ? (typeof cornerStat.value === 'number' ? cornerStat.value : parseInt(cornerStat.value, 10))
      : 0;

    if (index === 0) homeCorners = corners;
    else if (index === 1) awayCorners = corners;
  });

  return { home: homeCorners, away: awayCorners, total: homeCorners + awayCorners };
}

async function processAnalysis(analysis: any, fetchFromAPI: Function): Promise<any> {
  if (analysis.is_multiple && analysis.games) {
    const updatedGames = [];
    let allCorrect = true;
    let hasVoid = false;

    for (const game of analysis.games) {
      try {
        const fixtureData = await fetchFromAPI(`/fixtures?id=${game.fixture_id}`);
        if (!fixtureData || fixtureData.length === 0) {
          hasVoid = true;
          updatedGames.push({ ...game, result: 'void' });
          continue;
        }

        const fixture = fixtureData[0];
        const fixtureStatus = fixture?.fixture?.status?.short;

        if (['PST', 'CANC', 'ABD', 'SUSP', 'INT'].includes(fixtureStatus)) {
          hasVoid = true;
          updatedGames.push({ ...game, result: 'void' });
          continue;
        }

        if (fixtureStatus === 'NS') {
          const kickoffTime = new Date(game.kickoff_at).getTime();
          const hoursSinceKickoff = (Date.now() - kickoffTime) / (1000 * 60 * 60);
          
          if (hoursSinceKickoff > 4) {
            hasVoid = true;
            updatedGames.push({ ...game, result: 'void' });
          } else {
            updatedGames.push(game);
          }
          continue;
        }

        if (!['FT', 'AET', 'PEN'].includes(fixtureStatus)) {
          updatedGames.push(game);
          continue;
        }

        const stats = await fetchFromAPI(`/fixtures/statistics?fixture=${game.fixture_id}`);
        let corners = { home: 0, away: 0, total: 0 };
        
        if (stats && stats.length > 0) {
          corners = extractCornerStats(stats);
        }

        const threshold = parseFloat(game.prediction.toString());
        let gameResult = 'incorrect';
        
        if (game.strategy === 'under') {
          gameResult = corners.total <= threshold ? 'correct' : 'incorrect';
        } else {
          gameResult = corners.total >= threshold ? 'correct' : 'incorrect';
        }

        updatedGames.push({
          ...game,
          actual_corners: corners.total,
          result: gameResult
        });

        if (gameResult === 'incorrect') allCorrect = false;
        
      } catch (gameError) {
        hasVoid = true;
        updatedGames.push({ ...game, result: 'void' });
      }
    }

    const hasPendingGames = updatedGames.some((g: any) => !g.result || g.result === 'pending');
    let multipleStatus = 'pending';
    if (!hasPendingGames) {
      multipleStatus = hasVoid ? 'void' : (allCorrect ? 'correct' : 'incorrect');
    }

    return {
      ...analysis,
      updatedGames,
      multipleStatus,
      shouldUpdate: !hasPendingGames || updatedGames.some((g: any) => g.result && g.result !== 'pending')
    };
  }

  // Processar análise individual
  if (!analysis.fixture_id) return { ...analysis, skip: true };

  try {
    const fixtureData = await fetchFromAPI(`/fixtures?id=${analysis.fixture_id}`);
    if (!fixtureData || fixtureData.length === 0) return { ...analysis, skip: true };

    const fixture = fixtureData[0];
    const fixtureStatus = fixture?.fixture?.status?.short;

    if (['PST', 'CANC', 'ABD', 'SUSP', 'INT'].includes(fixtureStatus)) {
      return { ...analysis, newStatus: 'void', shouldUpdate: true };
    }

    if (fixtureStatus === 'NS') {
      const kickoffTime = new Date(analysis.kickoff_at).getTime();
      const hoursSinceKickoff = (Date.now() - kickoffTime) / (1000 * 60 * 60);
      if (hoursSinceKickoff > 4) {
        return { ...analysis, newStatus: 'void', shouldUpdate: true };
      }
      return { ...analysis, skip: true };
    }

    if (!['FT', 'AET', 'PEN'].includes(fixtureStatus)) {
      return { ...analysis, skip: true };
    }

    const stats = await fetchFromAPI(`/fixtures/statistics?fixture=${analysis.fixture_id}`);
    let corners = { home: 0, away: 0, total: 0 };
    if (stats && stats.length > 0) {
      corners = extractCornerStats(stats);
    }

    const threshold = parseFloat(analysis.avg_prediction.toString());
    let status = 'incorrect';
    
    if (analysis.strategy_type === 'under') {
      status = corners.total <= threshold ? 'correct' : 'incorrect';
    } else {
      status = corners.total >= threshold ? 'correct' : 'incorrect';
    }

    return {
      ...analysis,
      actualCorners: corners.total,
      newStatus: status,
      shouldUpdate: true
    };

  } catch (analysisError) {
    return { ...analysis, skip: true };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`[UpdateResults] [${Date.now() - startTime}ms] Iniciando atualização...`);

    if (checkTimeRemaining(startTime) < 30000) {
      return new Response(JSON.stringify({ success: false, message: 'Timeout approaching' }), 
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cutoffTime = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const nowTime = new Date().toISOString();

    const { data: analyses, error: fetchError } = await supabaseClient
      .from('corner_analyses')
      .select('*')
      .eq('status', 'pending')
      .gte('kickoff_at', cutoffTime)
      .lte('kickoff_at', nowTime);

    if (fetchError) {
      console.error('[UpdateResults] Erro ao buscar análises:', fetchError);
      return new Response(
        JSON.stringify({ success: false, updated: 0, message: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!analyses || analyses.length === 0) {
      console.log('[UpdateResults] Nenhuma análise pendente encontrada');
      return new Response(
        JSON.stringify({ success: true, updated: 0, message: 'No pending analyses to update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[UpdateResults] Encontradas ${analyses.length} análises pendentes`);

    // Processar em lotes
    const batches: any[][] = [];
    for (let i = 0; i < analyses.length; i += BATCH_SIZE) {
      batches.push(analyses.slice(i, i + BATCH_SIZE));
    }

    let updatedCount = 0;
    let failedCount = 0;

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      if (checkTimeRemaining(startTime) < 30000) {
        console.log('[UpdateResults] Timeout aproximando, parando processamento');
        break;
      }

      const batch = batches[batchIdx];
      console.log(`[UpdateResults] Processando lote ${batchIdx + 1}/${batches.length} (${batch.length} análises)`);

      // Processar lote com paralelização limitada
      const batchPromises: Promise<any>[] = [];
      let running = 0;

      for (const analysis of batch) {
        if (running >= MAX_CONCURRENT) {
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }
        running++;
        batchPromises.push(
          processAnalysis(analysis, fetchFromAPI).finally(() => { running--; })
        );
      }

      const results = await Promise.all(batchPromises);

      // Aplicar atualizações
      for (const result of results) {
        if (result.skip) continue;

        try {
          if (result.is_multiple && result.games) {
            // Atualizar múltipla
            if (result.shouldUpdate) {
              const updateData: any = {
                games: result.updatedGames,
                updated_at: nowTime,
              };
              if (result.multipleStatus !== 'pending') {
                updateData.status = result.multipleStatus;
              }

              const { error: updateError } = await supabaseClient
                .from('corner_analyses')
                .update(updateData)
                .eq('id', result.id);

              if (!updateError) updatedCount++;
              else {
                console.error(`Erro ao atualizar múltipla ${result.id}:`, updateError);
                failedCount++;
              }
            }
          } else if (result.shouldUpdate) {
            // Atualizar análise individual
            const { error: updateError } = await supabaseClient
              .from('corner_analyses')
              .update({
                actual_corners: result.actualCorners,
                status: result.newStatus,
                updated_at: nowTime,
              })
              .eq('id', result.id);

            if (!updateError) updatedCount++;
            else {
              console.error(`Erro ao atualizar análise ${result.id}:`, updateError);
              failedCount++;
            }
          }
        } catch (applyError) {
          console.error(`Erro ao aplicar atualização para ${result.id}:`, applyError);
          failedCount++;
        }
      }

      // Delay entre lotes
      if (batchIdx < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const totalTime = Date.now() - startTime;
    const failureRate = analyses.length > 0 ? (failedCount / analyses.length) * 100 : 0;

    console.log(`[UpdateResults] Concluído em ${totalTime}ms: ${updatedCount} atualizadas, ${failedCount} falhas (${failureRate.toFixed(1)}%)`);

    // Se taxa de falha > 20%, retornar erro
    if (failureRate > 20) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          updated: updatedCount, 
          failed: failedCount,
          failure_rate: failureRate.toFixed(1),
          message: `Taxa de falha muito alta: ${failureRate.toFixed(1)}%` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updatedCount,
        failed: failedCount,
        execution_time_ms: totalTime 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[UpdateResults] Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});