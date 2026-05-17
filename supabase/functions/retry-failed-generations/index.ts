// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MAX_ATTEMPTS = 3;
const BACKOFF_MINUTES = [5, 15, 30];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const functionUrl = `${SUPABASE_URL}/functions/v1/generate-daily-analyses`;

    console.log('[RetryJob] Verificando filas de retry...');

    const { data: pendingRetries, error: fetchError } = await supabase
      .from('generation_retry_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(5);

    if (fetchError) {
      console.error('[RetryJob] Erro ao buscar retries:', fetchError);
      return new Response(
        JSON.stringify({ success: false, message: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingRetries || pendingRetries.length === 0) {
      console.log('[RetryJob] Nenhum retry pendente');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending retries' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[RetryJob] Encontrados ${pendingRetries.length} retries pendentes`);

    let successCount = 0;
    let failCount = 0;
    let maxAttemptsReached = 0;

    for (const retry of pendingRetries) {
      console.log(`[RetryJob] Processando retry ${retry.id} para data ${retry.target_date} (tentativa ${retry.attempt_number}/${MAX_ATTEMPTS})`);

      // Marcar como processando
      await supabase
        .from('generation_retry_queue')
        .update({ status: 'processing' })
        .eq('id', retry.id);

      try {
        // Chamar generate-daily-analyses
        const response = await fetch(`${functionUrl}?date=${retry.target_date}&force=true`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });

        const result = await response.json();

        // Verificar se gerou 10 múltiplas
        const { count } = await supabase
          .from('corner_analyses')
          .select('id', { count: 'exact', head: true })
          .gte('kickoff_at', `${retry.target_date}T00:00:00.000Z`)
          .lte('kickoff_at', `${retry.target_date}T23:59:59.999Z`);

        const generatedCount = count || 0;

        if (response.ok && generatedCount === 10) {
          console.log(`[RetryJob] Sucesso! ${generatedCount}/10 múltiplas geradas para ${retry.target_date}`);

          await supabase
            .from('generation_retry_queue')
            .update({ 
              status: 'completed',
              last_error: null
            })
            .eq('id', retry.id);

          // Log de sucesso
          await supabase.from('edge_function_logs').insert({
            function_name: 'retry-failed-generations',
            execution_time_ms: Date.now() - startTime,
            status: 'completed',
            metadata: {
              target_date: retry.target_date,
              attempt_number: retry.attempt_number,
              multiples_generated: generatedCount,
              original_retry_id: retry.id
            }
          });

          successCount++;
        } else {
          const errorMsg = result.message || `Geradas ${generatedCount}/10 múltiplas`;
          console.error(`[RetryJob] Falha: ${errorMsg}`);

          if (retry.attempt_number >= MAX_ATTEMPTS) {
            console.error(`[RetryJob] Máximo de tentativas atingido para ${retry.target_date}`);
            
            await supabase
              .from('generation_retry_queue')
              .update({ 
                status: 'failed',
                last_error: `Falhou após ${MAX_ATTEMPTS} tentativas: ${errorMsg}`
              })
              .eq('id', retry.id);

            // Log de falha crítica
            await supabase.from('edge_function_logs').insert({
              function_name: 'retry-failed-generations',
              execution_time_ms: Date.now() - startTime,
              status: 'failed',
              error_message: `Falhou após ${MAX_ATTEMPTS} tentativas: ${errorMsg}`,
              metadata: {
                target_date: retry.target_date,
                attempt_number: retry.attempt_number,
                multiples_generated: generatedCount,
                original_retry_id: retry.id
              }
            });

            maxAttemptsReached++;
          } else {
            // Calcular próximo retry com backoff exponencial
            const nextAttempt = retry.attempt_number + 1;
            const backoffMinutes = BACKOFF_MINUTES[Math.min(retry.attempt_number, BACKOFF_MINUTES.length - 1)];
            const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

            console.log(`[RetryJob] Agendando retry ${nextAttempt} para ${nextRetryAt}`);

            await supabase
              .from('generation_retry_queue')
              .update({ 
                status: 'pending',
                attempt_number: nextAttempt,
                last_error: errorMsg,
                next_retry_at: nextRetryAt
              })
              .eq('id', retry.id);

            failCount++;
          }
        }
      } catch (invokeError: any) {
        console.error(`[RetryJob] Erro ao invoking generate-daily-analyses:`, invokeError);

        if (retry.attempt_number >= MAX_ATTEMPTS) {
          await supabase
            .from('generation_retry_queue')
            .update({ 
              status: 'failed',
              last_error: `Erro de execução: ${invokeError.message}`
            })
            .eq('id', retry.id);
          maxAttemptsReached++;
        } else {
          const nextAttempt = retry.attempt_number + 1;
          const backoffMinutes = BACKOFF_MINUTES[Math.min(retry.attempt_number, BACKOFF_MINUTES.length - 1)];
          const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

          await supabase
            .from('generation_retry_queue')
            .update({ 
              status: 'pending',
              attempt_number: nextAttempt,
              last_error: `Erro de execução: ${invokeError.message}`,
              next_retry_at: nextRetryAt
            })
            .eq('id', retry.id);
        }
        failCount++;
      }

      // Delay entre retries
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const totalTime = Date.now() - startTime;
    console.log(`[RetryJob] Concluído em ${totalTime}ms: ${successCount} sucessos, ${failCount} falhas, ${maxAttemptsReached} max atingidos`);

    return new Response(
      JSON.stringify({
        success: failCount === 0 || maxAttemptsReached === 0,
        processed: pendingRetries.length,
        success: successCount,
        failed: failCount,
        max_attempts_reached: maxAttemptsReached,
        execution_time_ms: totalTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[RetryJob] Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});