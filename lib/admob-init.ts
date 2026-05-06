// ============================================================================
// AdMob Initialization
// ============================================================================
// Inicialização do Google Mobile Ads SDK seguindo documentação oficial
// Docs: https://github.com/invertase/react-native-google-mobile-ads
// ============================================================================

import mobileAds from 'react-native-google-mobile-ads';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Inicializa o Google Mobile Ads SDK
 * 
 * IMPORTANTE:
 * - Deve ser chamado UMA VEZ no início do app
 * - Deve ser chamado ANTES de carregar qualquer anúncio
 * - Retorna uma Promise que resolve quando a inicialização está completa
 * 
 * @returns Promise que resolve quando o SDK está inicializado
 */
export async function initializeAdMob(): Promise<void> {
  // Se já está inicializado, retornar imediatamente
  if (isInitialized) {
    console.log('[AdMob] SDK já inicializado');
    return Promise.resolve();
  }

  // Se já está inicializando, retornar a Promise existente
  if (initializationPromise) {
    console.log('[AdMob] Aguardando inicialização em andamento...');
    return initializationPromise;
  }

  // Iniciar nova inicialização
  console.log('[AdMob] Iniciando SDK...');
  
  initializationPromise = mobileAds()
    .initialize()
    .then((adapterStatuses) => {
      isInitialized = true;
      console.log('[AdMob] SDK inicializado com sucesso!');
      
      // Log dos adapters inicializados (útil para debug)
      if (__DEV__) {
        console.log('[AdMob] Adapters inicializados:', 
          Object.keys(adapterStatuses).length
        );
      }
    })
    .catch((error) => {
      console.error('[AdMob] Erro ao inicializar SDK:', error);
      // Resetar para permitir retry
      initializationPromise = null;
      throw error;
    });

  return initializationPromise;
}

/**
 * Verifica se o AdMob SDK está inicializado
 * @returns true se inicializado, false caso contrário
 */
export function isAdMobInitialized(): boolean {
  return isInitialized;
}

/**
 * Aguarda a inicialização do AdMob SDK
 * Útil para garantir que o SDK está pronto antes de mostrar anúncios
 * 
 * @returns Promise que resolve quando o SDK está inicializado
 */
export async function waitForAdMobInitialization(): Promise<void> {
  if (isInitialized) {
    return Promise.resolve();
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  // Se não foi inicializado ainda, inicializar agora
  return initializeAdMob();
}
