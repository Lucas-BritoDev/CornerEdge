// ============================================================================
// AdMob Initialization
// ============================================================================
// Inicialização do Google Mobile Ads SDK seguindo documentação oficial
// Docs: https://github.com/invertase/react-native-google-mobile-ads
// ============================================================================

import { Platform } from 'react-native';
import Constants from 'expo-constants';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

let mobileAds: any = null;

async function loadMobileAdsModule() {
  if (mobileAds) return mobileAds;
  try {
    // Importa o módulo diretamente
    const module = require('react-native-google-mobile-ads');
    mobileAds = module.default || module;
    return mobileAds;
  } catch (e) {
    console.log('[AdMob] Módulo nativo não disponível (Expo Go?)');
    return null;
  }
}

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

  // Skip in Expo Go - native modules not available
  const isExpoGo = Constants.executionEnvironment === 'storeClient' || 
                   Constants.appOwnership === 'expo' || 
                   Platform.OS === 'web';
  
  console.log('[AdMob] lib/admob-init.ts - isExpoGo:', isExpoGo);
  
  if (isExpoGo) {
    console.log('[AdMob] Expo Go detectado — pulando inicialização');
    isInitialized = true; // Consider initialized for flow purposes
    return Promise.resolve();
  }

  console.log('[AdMob] Iniciando SDK...');
  
  const ads = await loadMobileAdsModule();
  if (!ads) {
    console.log('[AdMob] SDK não disponível');
    return Promise.resolve();
  }
  
  initializationPromise = ads.initialize()
    .then((adapterStatuses: any) => {
      isInitialized = true;
      console.log('[AdMob] SDK inicializado com sucesso!');
      
      if (__DEV__) {
        console.log('[AdMob] Adapters inicializados:', 
          Object.keys(adapterStatuses).length
        );
      }
    })
    .catch((error: Error) => {
      console.error('[AdMob] Erro ao inicializar SDK:', error);
      initializationPromise = null;
      throw error;
    });

  return initializationPromise ?? Promise.resolve();
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
