import { useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UNLOCK_KEY_PREFIX = 'rewarded_unlock_';

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
     * Verifica se este pick já foi desbloqueado today via Rewarded
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
     * Simula o ad reward. Para Development, apenas desbloqueia o pick.
     */
    const showAd = (pickId: string): Promise<boolean> => {
        return new Promise(async (resolve) => {
            await AsyncStorage.setItem(getTodayKey(pickId), 'true');
            resolve(true);
        });
    };

    return { loaded, loading, showAd, isUnlockedToday };
}