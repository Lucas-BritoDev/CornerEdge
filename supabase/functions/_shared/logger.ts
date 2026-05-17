// @ts-nocheck
/**
 * Edge Function Logger - Logging estruturado para Edge Functions
 * Armazena logs no banco de dados para auditoria e debugging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export class EdgeFunctionLogger {
  private supabase: any;
  private functionName: string;
  private logId: string | null = null;
  private startTime: number = 0;

  constructor(functionName: string, supabaseUrl?: string, supabaseKey?: string) {
    this.functionName = functionName;
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async logStart(metadata?: any): Promise<string> {
    this.startTime = Date.now();
    const logEntry = {
      function_name: this.functionName,
      execution_time_ms: null,
      status: 'started',
      error_message: null,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('edge_function_logs')
        .insert(logEntry)
        .select('id')
        .single();

      if (!error && data) {
        this.logId = data.id;
        console.log(`[${this.functionName}] Log iniciado: ${this.logId}`);
      }
    }

    console.log(`[${this.functionName}] === INÍCIO ===`);
    return this.logId || '';
  }

  async logProgress(message: string, metadata?: any): Promise<void> {
    const elapsed = this.startTime ? Date.now() - this.startTime : 0;
    console.log(`[${this.functionName}] [${elapsed}ms] ${message}`);

    if (this.supabase && this.logId) {
      await this.supabase
        .from('edge_function_logs')
        .update({
          metadata: { 
            ...metadata, 
            last_progress: message,
            elapsed_ms: elapsed 
          }
        })
        .eq('id', this.logId);
    }
  }

  async logComplete(metadata?: any): Promise<void> {
    const totalTime = this.startTime ? Date.now() - this.startTime : 0;
    console.log(`[${this.functionName}] === CONCLUÍDO em ${totalTime}ms ===`);

    if (this.supabase && this.logId) {
      await this.supabase
        .from('edge_function_logs')
        .update({
          execution_time_ms: totalTime,
          status: 'completed',
          metadata: { ...metadata, completed: true },
          created_at: new Date().toISOString()
        })
        .eq('id', this.logId);
    }
  }

  async logError(error: Error | string, metadata?: any): Promise<void> {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? null : error.stack;
    const totalTime = this.startTime ? Date.now() - this.startTime : 0;

    console.error(`[${this.functionName}] ERRO após ${totalTime}ms:`, errorMessage);

    if (this.supabase && this.logId) {
      await this.supabase
        .from('edge_function_logs')
        .update({
          execution_time_ms: totalTime,
          status: 'failed',
          error_message: errorMessage,
          metadata: { ...metadata, stack, failed: true },
          created_at: new Date().toISOString()
        })
        .eq('id', this.logId);
    }
  }

  async logTimeout(metadata?: any): Promise<void> {
    const totalTime = this.startTime ? Date.now() - this.startTime : 0;
    console.error(`[${this.functionName}] TIMEOUT após ${totalTime}ms`);

    if (this.supabase && this.logId) {
      await this.supabase
        .from('edge_function_logs')
        .update({
          execution_time_ms: totalTime,
          status: 'timeout',
          error_message: 'Function exceeded 150 second limit',
          metadata: { ...metadata, timed_out: true },
          created_at: new Date().toISOString()
        })
        .eq('id', this.logId);
    }
  }

  async logInProgress(metadata?: any): Promise<void> {
    if (this.supabase && this.logId) {
      await this.supabase
        .from('edge_function_logs')
        .update({
          status: 'in_progress',
          metadata: { ...metadata, in_progress: true }
        })
        .eq('id', this.logId);
    }
  }
}

export function createLogger(functionName: string): EdgeFunctionLogger {
  return new EdgeFunctionLogger(functionName);
}

export function createLoggerWithClient(
  functionName: string, 
  supabaseUrl: string, 
  supabaseKey: string
): EdgeFunctionLogger {
  return new EdgeFunctionLogger(functionName, supabaseUrl, supabaseKey);
}