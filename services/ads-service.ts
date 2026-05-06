// ============================================================================
// Ads Service - AdMob Integration
// ============================================================================
// Serviço de anúncios usando react-native-google-mobile-ads
// Docs: https://github.com/invertase/react-native-google-mobile-ads
// ============================================================================

import { Platform } from 'react-native';
import { 
  RewardedAd, 
  RewardedAdEventType, 
  TestIds 
} from 'react-native-google-mobile-ads';
import { waitForAdMobInitialization } from '@/lib/admob-init';

// ============================================================================
// AdMob IDs - PRODUÇÃO
// ============================================================================
// IMPORTANTE: Estes são os IDs reais de produção
// Para testes, use TestIds.REWARDED
// ============================================================================

const ADMOB_IDS = {
    android: {
        banner: 'ca-app-pub-8609967398609187/5936939727',
        rewarded: 'ca-app-pub-8609967398609187/7851666948',
    },
    ios: {
        banner: 'ca-app-pub-8609967398609187/5936939727',
        rewarded: 'ca-app-pub-8609967398609187/7851666948',
    }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Retorna o Ad Unit ID correto baseado na plataforma e tipo de anúncio
 * Em desenvolvimento, usa Test IDs para evitar problemas com a conta AdMob
 */
function getAdUnitId(adType: 'banner' | 'rewarded'): string {
  // Em desenvolvimento, sempre usar Test IDs
  if (__DEV__) {
    return adType === 'rewarded' ? TestIds.REWARDED : TestIds.BANNER;
  }

  // Em produção, usar IDs reais
  const platform = Platform.OS as 'android' | 'ios';
  return ADMOB_IDS[platform][adType];
}

// ============================================================================
// Ads Service
// ============================================================================

export const adsService = {
  /**
   * Inicializa o serviço de anúncios
   * Aguarda a inicialização do AdMob SDK
   */
  async initialize() {
    try {
      console.log('[AdsService] Inicializando...');
      await waitForAdMobInitialization();
      console.log('[AdsService] Inicializado com sucesso!');
    } catch (error) {
      console.error('[AdsService] Erro ao inicializar:', error);
      throw error;
    }
  },

  /**
   * Mostra um anúncio recompensado
   * 
   * @returns Promise que resolve com { rewarded: boolean }
   * - rewarded: true se o usuário assistiu o anúncio completo
   * - rewarded: false se o usuário fechou antes de completar
   */
  async showRewarded(): Promise<{ rewarded: boolean }> {
    try {
      console.log('[AdsService] Preparando anúncio recompensado...');

      // Garantir que o SDK está inicializado
      await waitForAdMobInitialization();

      // Criar anúncio recompensado
      const adUnitId = getAdUnitId('rewarded');
      console.log('[AdsService] Ad Unit ID:', __DEV__ ? 'TEST' : 'PRODUCTION');

      const rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      // Carregar anúncio
      console.log('[AdsService] Carregando anúncio...');
      
      return new Promise((resolve, reject) => {
        let isRewarded = false;

        // Listener: Anúncio carregado
        const unsubscribeLoaded = rewardedAd.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            console.log('[AdsService] Anúncio carregado, mostrando...');
            rewardedAd.show();
          }
        );

        // Listener: Usuário ganhou recompensa
        const unsubscribeEarned = rewardedAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          (reward) => {
            console.log('[AdsService] Recompensa ganha:', reward);
            isRewarded = true;
          }
        );

        // Listener: Anúncio fechado
        const unsubscribeClosed = rewardedAd.addAdEventListener(
          RewardedAdEventType.CLOSED,
          () => {
            console.log('[AdsService] Anúncio fechado. Recompensado:', isRewarded);
            
            // Limpar listeners
            unsubscribeLoaded();
            unsubscribeEarned();
            unsubscribeClosed();
            unsubscribeError();

            // Resolver com resultado
            resolve({ rewarded: isRewarded });
          }
        );

        // Listener: Erro ao carregar
        const unsubscribeError = rewardedAd.addAdEventListener(
          RewardedAdEventType.ERROR,
          (error) => {
            console.error('[AdsService] Erro ao carregar anúncio:', error);
            
            // Limpar listeners
            unsubscribeLoaded();
            unsubscribeEarned();
            unsubscribeClosed();
            unsubscribeError();

            // Rejeitar com erro
            reject(new Error(`Erro ao carregar anúncio: ${error.message}`));
          }
        );

        // Iniciar carregamento
        rewardedAd.load();
      });

    } catch (error) {
      console.error('[AdsService] Erro ao mostrar anúncio recompensado:', error);
      throw error;
    }
  },

  /**
   * Retorna os Ad Unit IDs configurados
   * Útil para debug e verificação
   */
  getAdUnitIds() {
    return {
      banner: getAdUnitId('banner'),
      rewarded: getAdUnitId('rewarded'),
      isProduction: !__DEV__,
      platform: Platform.OS,
    };
  }
};
