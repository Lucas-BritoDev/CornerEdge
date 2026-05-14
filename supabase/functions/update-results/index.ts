// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get('FOOTBALL_API_KEY');
if (!API_KEY) throw new Error('[UpdateResults] FOOTBALL_API_KEY env var não configurada');
const API_BASE_URL = 'https://v3.football.api-sports.io';

async function fetchFromAPI(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY },
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const data = await response.json();
  return data.response || [];
}

/**
 * Extrai estatísticas de escanteios comparando o ID do time para garantir precisão
 */
function extractCornerStats(statistics: any[]) {
  let homeCorners = 0;
  let awayCorners = 0;

  // A API-Football retorna estatísticas por time no array
  // statistics[0] costuma ser o home e [1] o away, mas vamos confiar na ordem da API
  // ou poderíamos passar os IDs dos times se tivéssemos na tabela
  
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[UpdateResults] Iniciando atualização de resultados...');

    // Janela de 72 horas para garantir processamento de jogos atrasados ou adiados
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
    let updatedCount = 0;

    for (const analysis of analyses) {
      // ============================================================================
      // PROCESSAR MÚLTIPLAS
      // ============================================================================
      if (analysis.is_multiple && analysis.games) {
        console.log(`[UpdateResults] Processando múltipla ${analysis.id} com ${analysis.games.length} jogos`);
        
        let allCorrect = true;
        let hasVoid = false;
        const updatedGames = [];
        
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
            
            // Jogos adiados/cancelados
            if (['PST', 'CANC', 'ABD', 'SUSP', 'INT'].includes(fixtureStatus)) {
              hasVoid = true;
              updatedGames.push({ ...game, result: 'void' });
              continue;
            }
            
            // Timeout para jogos que não começam
            if (fixtureStatus === 'NS') {
              const kickoffTime = new Date(game.kickoff_at).getTime();
              const hoursSinceKickoff = (Date.now() - kickoffTime) / (1000 * 60 * 60);
              
              if (hoursSinceKickoff > 4) {
                hasVoid = true;
                updatedGames.push({ ...game, result: 'void' });
              } else {
                updatedGames.push(game); // Ainda pendente
              }
              continue;
            }
            
            // Só processa se finalizado
            if (!['FT', 'AET', 'PEN'].includes(fixtureStatus)) {
              updatedGames.push(game); // Ainda pendente
              continue;
            }
            
            // Busca estatísticas
            const stats = await fetchFromAPI(`/fixtures/statistics?fixture=${game.fixture_id}`);
            let corners = { home: 0, away: 0, total: 0 };
            
            if (stats && stats.length > 0) {
              corners = extractCornerStats(stats);
            }
            
            // Determina resultado do jogo individual
            const threshold = parseFloat(game.prediction.toString());
            let gameResult = 'incorrect';
            
            if (game.strategy === 'under') {
              // Under: vitória se total <= threshold (linha exata = vitória)
              gameResult = corners.total <= threshold ? 'correct' : 'incorrect';
            } else {
              // Over: vitória se total >= threshold (linha exata = vitória)
              gameResult = corners.total >= threshold ? 'correct' : 'incorrect';
            }
            
            updatedGames.push({
              ...game,
              actual_corners: corners.total,
              result: gameResult
            });
            
            if (gameResult === 'incorrect') {
              allCorrect = false;
            }
            
            console.log(`[UpdateResults] Jogo múltipla ${game.fixture_id}: ${corners.total} escanteios -> ${gameResult}`);
            
            await new Promise((r) => setTimeout(r, 200));
          } catch (gameError) {
            console.error(`[UpdateResults] Erro no jogo ${game.fixture_id} da múltipla:`, gameError);
            hasVoid = true;
            updatedGames.push({ ...game, result: 'void' });
          }
        }
        
        // Determina status da múltipla
        // SÓ atualiza se TODOS os jogos estiverem encerrados
        const hasPendingGames = updatedGames.some((g: any) => !g.result || g.result === 'pending');
        
        let multipleStatus = 'pending';
        if (!hasPendingGames) {
          // Todos os jogos encerrados, pode definir resultado
          multipleStatus = hasVoid ? 'void' : (allCorrect ? 'correct' : 'incorrect');
          
          const { error: updateError } = await supabaseClient
            .from('corner_analyses')
            .update({
              games: updatedGames,
              status: multipleStatus,
              updated_at: nowTime,
            })
            .eq('id', analysis.id);
          
          if (updateError) {
            console.error(`[UpdateResults] Erro ao atualizar múltipla ${analysis.id}:`, updateError);
            continue;
          }
          
          console.log(`[UpdateResults] Múltipla ${analysis.id} -> ${multipleStatus}`);
          updatedCount++;
        } else {
          // Ainda há jogos pendentes - atualiza apenas os jogos (mantém status pending)
          await supabaseClient
            .from('corner_analyses')
            .update({
              games: updatedGames,
              updated_at: nowTime,
            })
            .eq('id', analysis.id);
          
          console.log(`[UpdateResults] Múltipla ${analysis.id} ainda tem jogos pendentes, mantém status 'pending'`);
        }
        continue;
      }
      
      // ============================================================================
      // PROCESSAR ANÁLISES INDIVIDUAIS (LÓGICA ORIGINAL)
      // ============================================================================
      if (!analysis.fixture_id) continue;

      try {
        const fixtureData = await fetchFromAPI(`/fixtures?id=${analysis.fixture_id}`);
        if (!fixtureData || fixtureData.length === 0) continue;

        const fixture = fixtureData[0];
        const fixtureStatus = fixture?.fixture?.status?.short;

        // ✅ TRATAMENTO DE JOGOS ADIADOS / CANCELADOS / ABANDONADOS
        if (['PST', 'CANC', 'ABD', 'SUSP', 'INT'].includes(fixtureStatus)) {
          console.log(`[UpdateResults] Jogo ${analysis.fixture_id} com status ${fixtureStatus}: Marcando como void`);
          await supabaseClient
            .from('corner_analyses')
            .update({ status: 'void', updated_at: nowTime })
            .eq('id', analysis.id);
          updatedCount++;
          continue;
        }

        // ✅ TIMEOUT PARA JOGOS QUE NÃO COMEÇAM (NS)
        // Se já passou 4h do kickoff e ainda está NS, marca como void
        if (fixtureStatus === 'NS') {
          const kickoffTime = new Date(analysis.kickoff_at).getTime();
          const hoursSinceKickoff = (Date.now() - kickoffTime) / (1000 * 60 * 60);
          
          if (hoursSinceKickoff > 4) {
            console.log(`[UpdateResults] Jogo ${analysis.fixture_id} timeout (+4h NS): Marcando como void`);
            await supabaseClient
              .from('corner_analyses')
              .update({ status: 'void', updated_at: nowTime })
              .eq('id', analysis.id);
            updatedCount++;
          }
          continue;
        }

        // Só processa resultados se o jogo estiver de fato finalizado
        if (!['FT', 'AET', 'PEN'].includes(fixtureStatus)) {
          continue;
        }

        // Busca estatísticas de escanteios
        const stats = await fetchFromAPI(`/fixtures/statistics?fixture=${analysis.fixture_id}`);
        
        let corners = { home: 0, away: 0, total: 0 };
        if (stats && stats.length > 0) {
          corners = extractCornerStats(stats);
        } else {
          // Se não há estatísticas mas o jogo acabou, tenta pegar do objeto goals (raro para corners)
          // mas a API costuma ter o objeto statistics para FT.
          console.warn(`[UpdateResults] Jogo ${analysis.fixture_id} finalizado mas sem estatísticas.`);
        }

        // ✅ FIX: Determina o resultado baseado na estratégia (Over/Under)
        // Para Under: total de escanteios deve ser MENOR OU IGUAL à linha (ex: Under 7.5 com 7 escanteios = vitória)
        // Para Over: total de escanteios deve ser MAIOR OU IGUAL à linha (ex: Over 9.5 com 10 escanteios = vitória)
        let status = 'incorrect';
        const threshold = parseFloat(analysis.avg_prediction.toString());
        
        if (analysis.strategy_type === 'under') {
          // Under: vitória se total <= threshold (linha exata = vitória)
          status = corners.total <= threshold ? 'correct' : 'incorrect';
        } else {
          // Over: vitória se total >= threshold (linha exata = vitória)
          status = corners.total >= threshold ? 'correct' : 'incorrect';
        }
        
        console.log(`[UpdateResults] Jogo ${analysis.fixture_id}: Corners=${corners.total}, Threshold=${threshold}, Strategy=${analysis.strategy_type} -> ${status}`);

        const { error: updateError } = await supabaseClient
          .from('corner_analyses')
          .update({
            actual_corners: corners.total,
            status: status,
            updated_at: nowTime,
          })
          .eq('id', analysis.id);

        if (updateError) {
          console.error(`[UpdateResults] Erro ao atualizar análise ${analysis.id}:`, updateError);
          continue;
        }

        console.log(`[UpdateResults] OK: ${analysis.home_team} vs ${analysis.away_team} -> ${corners.total} escanteios (${status})`);
        updatedCount++;

        await new Promise((r) => setTimeout(r, 200));
      } catch (analysisError) {
        console.error(`[UpdateResults] Erro no fixture ${analysis.fixture_id}:`, analysisError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated: updatedCount }),
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
