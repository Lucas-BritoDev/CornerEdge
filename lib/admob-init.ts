// ============================================================================
// AdMob Initialization - CornerEdge
// ============================================================================
// Inicialização do Google Mobile Ads SDK seguindo documentação oficial
// Docs: https://github.com/invertase/react-native-google-mobile-ads
//
// ✅ CORREÇÃO CRASH: nunca propaga exceção para o caller.
//    O throw original causava crash no startup quando o SDK nativo
//    não estava completamente pronto (race condition).
// ============================================================================

import { Platform } from 'react-native';
import Constants from 'expo-constants';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

async function loadMobileAdsModule(): Promise<any | null> {
  try {
    const module = require('react-native-google-mobile-ads');
    return module.default || module;
  } catch (e) {
    console.log('[AdMob] Módulo nativo não disponível (Expo Go ou ambiente não suportado)');
    return null;
  }
}

/**
 * Inicializa o Google Mobile Ads SDK de forma SEGURA.
 *
 * IMPORTANTE:
 * - Deve ser chamado UMA VEZ no início do app
 * - Deve ser chamado ANTES de carregar qualquer anúncio
 * - NUNCA lança exceção — erros são logados mas não propagados
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

  // Skip in Expo Go or web
  const isExpoGo =
    Constants.executionEnvironment === 'storeClient' ||
    (Constants as any).appOwnership === 'expo' ||
    Platform.OS === 'web';

  if (isExpoGo) {
    console.log('[AdMob] Expo Go detectado — pulando inicialização');
    isInitialized = true;
    return Promise.resolve();
  }

  console.log('[AdMob] Iniciando SDK...');

  // ✅ Toda a lógica envolta em Promise que sempre resolve (nunca rejeita)
  initializationPromise = new Promise<void>(async (resolve) => {
    try {
      const ads = await loadMobileAdsModule();

      if (!ads) {
        console.log('[AdMob] SDK não disponível');
        isInitialized = true;
        return resolve();
      }

      const adapterStatuses = await ads.initialize();
      isInitialized = true;
      console.log('[AdMob] SDK inicializado com sucesso!');

      if (__DEV__) {
        console.log(
          '[AdMob] Adapters inicializados:',
          Object.keys(adapterStatuses).length
        );
      }
    } catch (error) {
      // ✅ CRÍTICO: nunca relança — apenas loga
      // O app continua funcionando sem anúncios
      console.error('[AdMob] Erro ao inicializar SDK (não fatal):', error);
      isInitialized = true; // Evita retry infinito
    } finally {
      resolve(); // Sempre resolve, nunca rejeita
    }
  });

  return initializationPromise;
}

/**
 * Verifica se o AdMob SDK está inicializado
 */
export function isAdMobInitialized(): boolean {
  return isInitialized;
}

/**
 * Aguarda a inicialização do AdMob SDK
 */
export async function waitForAdMobInitialization(): Promise<void> {
  if (isInitialized) return Promise.resolve();
  if (initializationPromise) return initializationPromise;
  return initializeAdMob();
}
