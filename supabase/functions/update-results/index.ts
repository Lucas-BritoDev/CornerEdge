import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get('FOOTBALL_API_KEY') || '1a896aad078a4eec7ab7121281bcd5ec';
const API_BASE_URL = 'https://v3.football.api-sports.io';

async function fetchFromAPI(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    },
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const data = await response.json();
  return data.response || [];
}

function extractCornerStats(statistics: any[]) {
  let homeCorners = 0;
  let awayCorners = 0;

  for (const teamStats of statistics) {
    const cornerStat = teamStats.statistics.find((s: any) => s.type === 'Corner Kicks');
    if (cornerStat && cornerStat.value !== null) {
      const corners =
        typeof cornerStat.value === 'number'
          ? cornerStat.value
          : parseInt(cornerStat.value, 10);
      if (statistics.indexOf(teamStats) === 0) homeCorners = corners;
      else awayCorners = corners;
    }
  }

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

    // Usa timezone de Brasília como referência de data (UTC-3)
    // Busca análises pendentes cujo kickoff foi nas últimas 48h
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const nowTime = new Date().toISOString();

    const { data: analyses, error: fetchError } = await supabaseClient
      .from('corner_analyses')
      .select('*')
      .eq('status', 'pending')
      .gte('kickoff_at', cutoffTime)
      .lte('kickoff_at', nowTime); // Só jogos que já deveriam ter começado

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
    let notFinishedCount = 0;

    for (const analysis of analyses) {
      if (!analysis.fixture_id) continue;

      try {
        // Busca as estatísticas do jogo
        const fixtureData = await fetchFromAPI(`/fixtures?id=${analysis.fixture_id}`);
        if (!fixtureData || fixtureData.length === 0) continue;

        const fixture = fixtureData[0];
        const fixtureStatus = fixture?.fixture?.status?.short;

        // Só processa jogos finalizados
        if (!['FT', 'AET', 'PEN'].includes(fixtureStatus)) {
          notFinishedCount++;
          console.log(`[UpdateResults] Jogo ${analysis.fixture_id} ainda em andamento: ${fixtureStatus}`);
          continue;
        }

        // Busca estatísticas de escanteios
        const stats = await fetchFromAPI(`/fixtures/statistics?fixture=${analysis.fixture_id}`);
        
        let corners = { home: 0, away: 0, total: 0 };
        if (stats.length > 0) {
          corners = extractCornerStats(stats);
        }

        // Determina o resultado baseado no total de escanteios vs. previsão
        let status = 'incorrect';
        if (corners.total >= analysis.probable_range_min && corners.total <= analysis.probable_range_max) {
          status = 'correct';
        }

        // Atualiza a análise com resultado real
        const { error: updateError } = await supabaseClient
          .from('corner_analyses')
          .update({
            actual_corners: corners.total,
            status: status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', analysis.id);

        if (updateError) {
          console.error(`[UpdateResults] Erro ao atualizar análise ${analysis.id}:`, updateError);
          continue;
        }

        console.log(
          `[UpdateResults] Atualizado ${analysis.home_team} vs ${analysis.away_team}: ` +
          `${corners.total} escanteios (range: ${analysis.probable_range_min}-${analysis.probable_range_max}) → ${status}`
        );
        updatedCount++;

        // Rate limiting: aguarda 300ms entre chamadas de API
        await new Promise((r) => setTimeout(r, 300));
      } catch (analysisError) {
        console.error(`[UpdateResults] Erro ao processar fixture ${analysis.fixture_id}:`, analysisError);
        continue;
      }
    }

    const message = `Atualizadas ${updatedCount} de ${analyses.length} análises. ${notFinishedCount} jogos ainda em andamento.`;
    console.log(`[UpdateResults] ${message}`);

    return new Response(
      JSON.stringify({ success: true, updated: updatedCount, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[UpdateResults] Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        updated: 0,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
