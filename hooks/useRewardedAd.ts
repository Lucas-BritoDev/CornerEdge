import { useState, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const UNLOCK_KEY_PREFIX = 'rewarded_unlock_';
const LAST_AD_WATCHED_KEY = 'last_rewarded_ad_watched';

// IDs de anúncio — test IDs em dev, produção em release
const REWARDED_AD_UNIT_ID = __DEV__
    ? Platform.OS === 'ios'
        ? 'ca-app-pub-3940256099942544/1712485313' // iOS test rewarded
        : 'ca-app-pub-3940256099942544/5224354917' // Android test rewarded
    : Platform.OS === 'ios'
        ? 'ca-app-pub-8609967398609187~5936939727' // iOS produção
        : 'ca-app-pub-8609967398609187~5936939727'; // Android produção

const isExpoGo = Constants.executionEnvironment === 'storeClient';

let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let TestIds: any = null;

if (!isExpoGo) {
    try {
        const admob = require('react-native-google-mobile-ads');
        RewardedAd = admob.RewardedAd;
        RewardedAdEventType = admob.RewardedAdEventType;
        TestIds = admob.TestIds;
    } catch {
        // Módulo não disponível
    }
}

function getTodayKey(analysisId: string) {
    const today = new Date().toISOString().split('T')[0];
    return `${UNLOCK_KEY_PREFIX}${analysisId}_${today}`;
}

export function useRewardedAd() {
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const adRef = useRef<any>(null);

    const createAndLoadAd = () => {
        if (!RewardedAd || isExpoGo) {
            setLoaded(true); // Em Expo Go, simular como carregado
            return;
        }

        try {
            const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
                requestNonPersonalizedAdsOnly: false,
            });

            ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
                setLoaded(true);
                setLoading(false);
            });

            ad.addAdEventListener(RewardedAdEventType.ERROR, () => {
                setLoaded(false);
                setLoading(false);
                adRef.current = null;
            });

            adRef.current = ad;
            setLoading(true);
            ad.load();
        } catch {
            setLoaded(true); // Fallback
        }
    };

    useEffect(() => {
        createAndLoadAd();
    }, []);

    /**
     * Verifica se esta análise já foi desbloqueada hoje via Rewarded
     */
    const isUnlockedToday = async (analysisId: string): Promise<boolean> => {
        try {
            const value = await AsyncStorage.getItem(getTodayKey(analysisId));
            return value === 'true';
        } catch {
            return false;
        }
    };

    /**
     * Verifica se o usuário pode assistir um anúncio (1 por 24h)
     */
    const canWatchAd = async (): Promise<{ canWatch: boolean; timeRemaining?: number }> => {
        try {
            const lastWatchedStr = await AsyncStorage.getItem(LAST_AD_WATCHED_KEY);
            if (!lastWatchedStr) return { canWatch: true };

            const lastWatched = parseInt(lastWatchedStr, 10);
            const hoursPassed = (Date.now() - lastWatched) / (1000 * 60 * 60);

            if (hoursPassed >= 24) return { canWatch: true };

            return { canWatch: false, timeRemaining: Math.ceil(24 - hoursPassed) };
        } catch {
            return { canWatch: true };
        }
    };

    /**
     * Mostra o anúncio recompensado e desbloqueia a análise
     */
    const showAd = async (analysisId: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { canWatch, timeRemaining } = await canWatchAd();
            if (!canWatch) {
                return {
                    success: false,
                    error: `Você já assistiu um anúncio hoje. Aguarde ${timeRemaining}h.`,
                };
            }

            // Expo Go ou módulo indisponível — simular recompensa
            if (isExpoGo || !RewardedAd || !adRef.current) {
                await AsyncStorage.setItem(getTodayKey(analysisId), 'true');
                await AsyncStorage.setItem(LAST_AD_WATCHED_KEY, Date.now().toString());
                return { success: true };
            }

            // Mostrar anúncio real
            return new Promise((resolve) => {
                const ad = adRef.current;

                const earnedListener = ad.addAdEventListener(
                    RewardedAdEventType.EARNED_REWARD,
                    async () => {
                        await AsyncStorage.setItem(getTodayKey(analysisId), 'true');
                        await AsyncStorage.setItem(LAST_AD_WATCHED_KEY, Date.now().toString());
                        earnedListener();
                        closedListener();
                        // Pré-carregar próximo anúncio
                        createAndLoadAd();
                        resolve({ success: true });
                    }
                );

                const closedListener = ad.addAdEventListener(
                    RewardedAdEventType.CLOSED,
                    () => {
                        // Usuário fechou sem ganhar recompensa
                        setLoaded(false);
                        createAndLoadAd();
                        resolve({ success: false, error: 'Anúncio fechado antes de completar.' });
                    }
                );

                try {
                    ad.show();
                } catch {
                    earnedListener();
                    closedListener();
                    resolve({ success: false, error: 'Erro ao exibir anúncio.' });
                }
            });
        } catch (error) {
            return { success: false, error: 'Erro ao processar anúncio.' };
        }
    };

    return { loaded, loading, showAd, isUnlockedToday, canWatchAd };
}
