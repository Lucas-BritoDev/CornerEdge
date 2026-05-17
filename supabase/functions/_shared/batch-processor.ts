// @ts-nocheck
/**
 * Batch Processor - Processa itens em lotes com controle de concorrência e tempo
 */

export interface BatchProcessorOptions {
  batchSize: number;
  maxConcurrent: number;
  delayMs: number;
  timeoutMs?: number;
}

export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchProcessorOptions
): Promise<R[]> {
  const { batchSize = 10, maxConcurrent = 5, delayMs = 100, timeoutMs } = options;
  const results: R[] = [];
  const startTime = Date.now();

  // Dividir em lotes
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    // Verificar timeout
    if (timeoutMs && Date.now() - startTime > timeoutMs) {
      console.log(`[BatchProcessor] Timeout excedido após ${Date.now() - startTime}ms, parando processamento`);
      break;
    }

    // Processar lote com concorrência limitada
    const batchPromises: Promise<R>[] = [];
    let running = 0;

    for (const item of batch) {
      // Se atingir limite de concorrência, esperar
      if (running >= maxConcurrent) {
        await new Promise(resolve => setTimeout(resolve, 50));
        continue;
      }

      running++;
      batchPromises.push(
        processor(item).finally(() => {
          running--;
        })
      );
    }

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Delay entre lotes
    if (delayMs > 0 && batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

export function checkTimeRemaining(startTime: number, maxTimeMs: number): number {
  const elapsed = Date.now() - startTime;
  return Math.max(0, maxTimeMs - elapsed);
}

export function shouldStopProcessing(
  startTime: number,
  maxTimeMs: number,
  minRemainingMs: number = 30000
): boolean {
  const remaining = checkTimeRemaining(startTime, maxTimeMs);
  return remaining < minRemainingMs;
}