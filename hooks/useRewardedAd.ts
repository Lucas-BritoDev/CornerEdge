import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
    RewardedAd,
    RewardedAdEventType,
    TestIds,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Em produção, substitua pelos seus IDs reais do AdMob
const REWARDED_ID = Platform.select({
    android: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxxxxxxx/xxxxxxxxxx',
    ios: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxxxxxxx/xxxxxxxxxx',
}) ?? TestIds.REWARDED;

const UNLOCK_KEY_PREFIX = 'rewarded_unlock_';

function getTodayKey(pickId: string) {
    const today = new Date().toISOString().split('T')[0];
    return `${UNLOCK_KEY_PREFIX}${pickId}_${today}`;
}

export function useRewardedAd() {
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const adRef = useRef<RewardedAd | null>(null);

    const loadAd = () => {
        setLoading(true);
        const rewarded = RewardedAd.createForAdRequest(REWARDED_ID, {
            requestNonPersonalizedAdsOnly: false,
        });

        const unsubscribeLoaded = rewarded.addAdEventListener(
            RewardedAdEventType.LOADED,
            () => {
                setLoaded(true);
                setLoading(false);
            }
        );

        rewarded.load();
        adRef.current = rewarded;

        return () => {
            unsubscribeLoaded();
        };
    };

    useEffect(() => {
        loadAd();
    }, []);

    /**
     * Verifica se este pick já foi desbloqueado hoje via Rewarded
     */
    const isUnlockedToday = async (pickId: string): Promise<boolean> => {
        try {
            const value = await AsyncStorage.getItem(getTodayKey(pickId));
            return value === 'true';
        } catch {
            return false;
        }
    };

    /**
     * Exibe o anúncio Rewarded. Resolve com `true` se o usuário ganhou a recompensa.
     * Resolve com `false` se fechou sem assistir.
     */
    const showAd = (pickId: string): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!adRef.current || !loaded) {
                resolve(false);
                return;
            }

            const unsubscribeEarned = adRef.current.addAdEventListener(
                RewardedAdEventType.EARNED_REWARD,
                async () => {
                    // Salva o unlock para este pick hoje
                    await AsyncStorage.setItem(getTodayKey(pickId), 'true');
                    unsubscribeEarned();
                    resolve(true);

                    // Pré-carrega o próximo anúncio
                    setLoaded(false);
                    loadAd();
                }
            );

            adRef.current.show().catch(() => {
                unsubscribeEarned();
                resolve(false);
            });
        });
    };

    return { loaded, loading, showAd, isUnlockedToday };
}
