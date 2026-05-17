// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get('FOOTBALL_API_KEY') || '1a896aad078a4eec7ab7121281bcd5ec';
const API_BASE_URL = 'https://v3.football.api-sports.io';

const BATCH_SIZE = 20;
const MAX_CONCURRENT = 5;

async function fetchFromAPI(endpoint: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'x-apisports-key': API_KEY },
    });
    if (!response.ok) {
      console.error(`[UpdateTeamLogos] API ${endpoint} HTTP ${response.status}`);
      return [];
    }
    const data = await response.json();
    return data.response || [];
  } catch (err) {
    console.error(`[UpdateTeamLogos] Error fetching ${endpoint}:`, err);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`[UpdateTeamLogos] [${Date.now() - startTime}ms] Starting update...`);

    // Buscar análises que não têm logos (campo principal)
    //Para múltiplas, vamos extrair dos games; para individuais, buscar da API
    const { data: analyses, error: fetchError } = await supabase
      .from('corner_analyses')
      .select('id, home_team, away_team, home_team_logo, away_team_logo, is_multiple, games, fixture_id')
      .or('home_team_logo.is.null,away_team_logo.is.null')
      .limit(100);

    if (fetchError) {
      console.error('[UpdateTeamLogos] Error fetching analyses:', fetchError);
      return new Response(
        JSON.stringify({ success: false, message: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!analyses || analyses.length === 0) {
      console.log('[UpdateTeamLogos] No analyses need logo update');
      return new Response(
        JSON.stringify({ success: true, updated: 0, message: 'No analyses need logo update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[UpdateTeamLogos] Found ${analyses.length} analyses needing logo update`);

    let updatedCount = 0;

    // Processar em lotes
    for (let i = 0; i < analyses.length; i += BATCH_SIZE) {
      const batch = analyses.slice(i, i + BATCH_SIZE);
      console.log(`[UpdateTeamLogos] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(analyses.length / BATCH_SIZE)}`);

      const batchPromises: Promise<any>[] = [];
      let running = 0;

      for (const analysis of batch) {
        if (running >= MAX_CONCURRENT) {
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }
        running++;

        batchPromises.push(
          (async () => {
            try {
              // Se é múltipla, extrair logos do primeiro jogo
              if (analysis.is_multiple && analysis.games && analysis.games.length > 0) {
                const firstGame = analysis.games[0];
                const updateData: any = {
                  home_team_logo: firstGame.home_logo || null,
                  away_team_logo: firstGame.away_logo || null,
                };

                const { error: updateError } = await supabase
                  .from('corner_analyses')
                  .update(updateData)
                  .eq('id', analysis.id);

                return { id: analysis.id, success: !updateError };
              }

              // Se é análise individual, buscar da API
              if (!analysis.is_multiple && analysis.fixture_id) {
                const fixtures = await fetchFromAPI(`/fixtures?id=${analysis.fixture_id}`);
                if (fixtures && fixtures.length > 0) {
                  const fixture = fixtures[0];
                  const homeLogo = fixture.teams?.home?.logo;
                  const awayLogo = fixture.teams?.away?.logo;

                  if (homeLogo || awayLogo) {
                    const { error: updateError } = await supabase
                      .from('corner_analyses')
                      .update({
                        home_team_logo: homeLogo || null,
                        away_team_logo: awayLogo || null,
                      })
                      .eq('id', analysis.id);

                    return { id: analysis.id, success: !updateError };
                  }
                }
              }

              // Se tem fixture_id mas não tem logo ainda, tentar buscar pelo nome do time
              if (!analysis.is_multiple && !analysis.fixture_id && analysis.home_team) {
                // Não temos fixture_id, tentar buscar pelo nome (menos preciso)
                // Isso é mais complexo e pode dar falsos positivos
              }

              return { id: analysis.id, success: true, skipped: true };
            } catch (e) {
              console.error(`[UpdateTeamLogos] Error processing ${analysis.id}:`, e.message);
              return { id: analysis.id, success: false };
            }
          })()
        );
      }

      const results = await Promise.all(batchPromises);
      updatedCount += results.filter(r => r.success).length;
    }

    const totalTime = Date.now() - startTime;
    console.log(`[UpdateTeamLogos] Completed in ${totalTime}ms: ${updatedCount} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        total: analyses.length,
        execution_time_ms: totalTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[UpdateTeamLogos] Fatal error:', err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});