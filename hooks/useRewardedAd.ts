import React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  RewardedAd, 
  RewardedAdEventType, 
  TestIds,
  AdEventType
} from 'react-native-google-mobile-ads';
import { AD_UNITS } from '../services/ads-service';
import { waitForAdMobInitialization } from '../lib/admob-init';

// ID do anúncio baseado na plataforma e ambiente
const adUnitId = __DEV__ 
  ? TestIds.REWARDED 
  : (Platform.OS === 'ios' ? AD_UNITS.IOS_REWARDED : AD_UNITS.ANDROID_REWARDED);

// Chave para armazenar desbloqueios temporários (24h)
const UNLOCK_STORAGE_PREFIX = 'rewarded_unlock_';

export function useRewardedAd() {
  const [rewardedAd, setRewardedAd] = React.useState<RewardedAd | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Inicializa e carrega o anúncio
  const loadAd = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Garante que o SDK está inicializado
      await waitForAdMobInitialization();

      const ad = RewardedAd.createForAdUnitId(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['sports', 'betting', 'football', 'soccer'],
      });

      const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setLoaded(true);
        setLoading(false);
      });

      const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        console.error('AdMob Reward Error:', err);
        setError(err.message);
        setLoading(false);
        setLoaded(false);
      });

      ad.load();
      setRewardedAd(ad);

      return () => {
        unsubscribeLoaded();
        unsubscribeError();
      };
    } catch (e) {
      console.error('Failed to create RewardedAd:', e);
      setError('Initialization failed');
      setLoading(false);
      return () => {};
    }
  }, []);

  React.useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const init = async () => {
      const loadCleanup = await loadAd();
      cleanup = loadCleanup;
    };

    init();

    return () => {
      if (cleanup) cleanup();
    };
  }, [loadAd]);

  // Verifica se o item já foi desbloqueado hoje
  const isUnlockedToday = async (id: string): Promise<boolean> => {
    try {
      const timestamp = await AsyncStorage.getItem(`${UNLOCK_STORAGE_PREFIX}${id}`);
      if (!timestamp) return false;

      const unlockDate = new Date(parseInt(timestamp, 10));
      const now = new Date();
      
      // Expira após 24 horas
      const diffHours = (now.getTime() - unlockDate.getTime()) / (1000 * 60 * 60);
      if (diffHours >= 24) {
        await AsyncStorage.removeItem(`${UNLOCK_STORAGE_PREFIX}${id}`);
        return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  };

  // Mostra o anúncio e retorna o resultado
  const showAd = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!loaded || !rewardedAd) {
      // Tenta carregar novamente se falhou
      loadAd();
      return { success: false, error: 'Ad not ready. Please try again in a moment.' };
    }

    return new Promise((resolve) => {
      let earnedReward = false;

      const unsubscribeEarned = rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        async (reward) => {
          console.log('User earned reward:', reward);
          earnedReward = true;
          try {
            await AsyncStorage.setItem(`${UNLOCK_STORAGE_PREFIX}${id}`, Date.now().toString());
          } catch (e) {
            console.error('Failed to save reward state:', e);
          }
        }
      );

      const unsubscribeClosed = rewardedAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          unsubscribeEarned();
          unsubscribeClosed();
          
          if (earnedReward) {
            setLoaded(false);
            loadAd(); // Pre-load next ad
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'Ad closed before completion' });
          }
        }
      );

      try {
        rewardedAd.show();
      } catch (e) {
        unsubscribeEarned();
        unsubscribeClosed();
        resolve({ success: false, error: 'Failed to display ad' });
      }
    });
  };

  return {
    loaded,
    loading,
    error,
    showAd,
    isUnlockedToday,
    reloadAd: loadAd
  };
}
