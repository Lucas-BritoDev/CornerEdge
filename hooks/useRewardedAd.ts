import { useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UNLOCK_KEY_PREFIX = 'rewarded_unlock_';
const LAST_AD_WATCHED_KEY = 'last_rewarded_ad_watched';

function getTodayKey(pickId: string) {
    const today = new Date().toISOString().split('T')[0];
    return `${UNLOCK_KEY_PREFIX}${pickId}_${today}`;
}

export function useRewardedAd() {
    const [loaded, setLoaded] = useState(true);
    const [loading, setLoading] = useState(false);
    const adRef = useRef<any>(null);

    const loadAd = () => {
        setLoaded(true);
    };

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
     * Verifica se o usuário já assistiu um anúncio nas últimas 24 horas
     */
    const canWatchAd = async (): Promise<{ canWatch: boolean; timeRemaining?: number }> => {
        try {
            const lastWatchedStr = await AsyncStorage.getItem(LAST_AD_WATCHED_KEY);
            
            if (!lastWatchedStr) {
                return { canWatch: true };
            }

            const lastWatched = parseInt(lastWatchedStr, 10);
            const now = Date.now();
            const hoursPassed = (now - lastWatched) / (1000 * 60 * 60);

            if (hoursPassed >= 24) {
                return { canWatch: true };
            }

            const hoursRemaining = Math.ceil(24 - hoursPassed);
            return { canWatch: false, timeRemaining: hoursRemaining };
        } catch {
            return { canWatch: true };
        }
    };

    /**
     * Mostra o anúncio e desbloqueia o pick
     * REGRA: Apenas 1 anúncio a cada 24 horas
     */
    const showAd = async (pickId: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // Verificar se pode assistir anúncio
            const { canWatch, timeRemaining } = await canWatchAd();
            
            if (!canWatch) {
                return { 
                    success: false, 
                    error: `Você já assistiu um anúncio hoje. Aguarde ${timeRemaining}h para assistir novamente.` 
                };
            }

            // Simular anúncio (em produção, aqui seria o AdMob Rewarded Ad)
            // await adsService.showRewarded();

            // Desbloquear o pick
            await AsyncStorage.setItem(getTodayKey(pickId), 'true');
            
            // Registrar timestamp do último anúncio assistido
            await AsyncStorage.setItem(LAST_AD_WATCHED_KEY, Date.now().toString());

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Erro ao processar anúncio' };
        }
    };

    return { loaded, loading, showAd, isUnlockedToday, canWatchAd };
}