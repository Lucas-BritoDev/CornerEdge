import React from 'react';
import type { RewardedAdReward } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AD_UNITS } from '../services/ads-service';
import { waitForAdMobInitialization } from '../lib/admob-init';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ── Detecção de ambiente ──────────────────────────────────────────────────────
const isExpoGo =
    Constants.executionEnvironment === 'storeClient' ||
    (Constants as any).appOwnership === 'expo' ||
    Platform.OS === 'web';

// ── Carregamento seguro do módulo nativo ──────────────────────────────────────
let adsModule: any = null;
try {
    if (!isExpoGo) {
        adsModule = require('react-native-google-mobile-ads');
    }
} catch (e) {
    console.log('[RewardedAd] Módulo nativo não disponível:', e);
}

const RewardedAd          = adsModule?.RewardedAd;
const RewardedAdEventType = adsModule?.RewardedAdEventType ?? {
    LOADED: 'rewarded_loaded',
    EARNED_REWARD: 'rewarded_earned_reward',
};
const AdEventType = adsModule?.AdEventType ?? {
    ERROR: 'error',
    CLOSED: 'closed',
};

// ID do anúncio: test em dev, produção em release
const adUnitId = __DEV__
    ? (Platform.OS === 'ios'
        ? 'ca-app-pub-3940256099942544/1712485313'   // iOS test
        : 'ca-app-pub-3940256099942544/5224354917')  // Android test
    : (Platform.OS === 'ios' ? AD_UNITS.IOS_REWARDED : AD_UNITS.ANDROID_REWARDED);

// Chave para o desbloqueio específico de uma análise
const UNLOCK_STORAGE_PREFIX = 'rewarded_unlock_';

// Chave GLOBAL: registra se o usuário já usou o anúncio hoje (independente da pick)
// Formato: 'rewarded_daily_used_YYYY-MM-DD' → id da análise desbloqueada
const DAILY_AD_KEY = 'rewarded_daily_used';

// ── Helpers de data ───────────────────────────────────────────────────────────
function todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useRewardedAd() {
    const { user } = useAuth();

    const adRef      = React.useRef<any>(null);
    const loadedRef  = React.useRef(false);
    const loadingRef = React.useRef(false);

    const [loading, setLoading] = React.useState(false);

    // ── Carrega um novo ad ────────────────────────────────────────────────
    const loadAd = React.useCallback((): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            if (isExpoGo || !RewardedAd) {
                loadedRef.current = true;
                resolve();
                return;
            }

            if (loadingRef.current) {
                resolve();
                return;
            }

            loadingRef.current = true;
            loadedRef.current  = false;

            try {
                await waitForAdMobInitialization();

                const ad = RewardedAd.createForAdRequest(adUnitId, {
                    requestNonPersonalizedAdsOnly: false,
                    keywords: ['sports', 'football', 'soccer'],
                });

                const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
                    loadedRef.current  = true;
                    loadingRef.current = false;
                    adRef.current      = ad;
                    unsubLoaded();
                    resolve();
                });

                const unsubError = ad.addAdEventListener(AdEventType.ERROR, (err: any) => {
                    loadedRef.current  = false;
                    loadingRef.current = false;
                    unsubError();
                    reject(new Error(err?.message ?? 'Falha ao carregar anúncio'));
                });

                ad.load();
            } catch (e: any) {
                loadingRef.current = false;
                reject(new Error(e?.message ?? 'Erro ao criar anúncio'));
            }
        });
    }, []);

    React.useEffect(() => {
        loadAd().catch(() => {});
    }, [loadAd]);

    // ── Verifica se o usuário já usou o anúncio hoje (limite global diário) ──
    const hasUsedAdToday = async (): Promise<boolean> => {
        try {
            const stored = await AsyncStorage.getItem(DAILY_AD_KEY);
            if (!stored) return false;
            const { date } = JSON.parse(stored);
            return date === todayStr();
        } catch {
            return false;
        }
    };

    // ── Verifica se uma análise específica já foi desbloqueada hoje ───────
    const isUnlockedToday = async (id: string): Promise<boolean> => {
        try {
            const today = todayStr();
            
            // ✅ FIX: Verifica no Supabase primeiro (fonte de verdade)
            if (user) {
                const { data } = await supabase
                    .from('user_unlocked_picks')
                    .select('id, created_at')
                    .eq('user_id', user.id)
                    .eq('analysis_id', id)
                    .maybeSingle();

                if (data) {
                    const unlockDate = new Date((data as any).created_at).toISOString().split('T')[0];
                    // ✅ FIX: Compara datas, não horas (resolve problema de reaparecimento)
                    if (unlockDate === today) {
                        // Sincroniza com AsyncStorage para offline
                        await AsyncStorage.setItem(`${UNLOCK_STORAGE_PREFIX}${id}`, JSON.stringify({ date: today }));
                        return true;
                    }
                }
            }

            // Fallback para AsyncStorage (offline ou sem usuário)
            const stored = await AsyncStorage.getItem(`${UNLOCK_STORAGE_PREFIX}${id}`);
            if (!stored) return false;
            
            try {
                const { date } = JSON.parse(stored);
                if (date === today) return true;
                // Limpa desbloqueio de dia anterior
                await AsyncStorage.removeItem(`${UNLOCK_STORAGE_PREFIX}${id}`);
            } catch {
                // Formato antigo (timestamp), migra para novo formato
                await AsyncStorage.removeItem(`${UNLOCK_STORAGE_PREFIX}${id}`);
            }
            
            return false;
        } catch (err) {
            console.error('[RewardedAd] Erro ao verificar desbloqueio:', err);
            return false;
        }
    };

    // ── Exibe o anúncio e retorna o resultado ─────────────────────────────
    // REGRA: 1 anúncio por dia, libera apenas 1 pick premium (a que foi sorteada)
    const showAd = async (id: string): Promise<{ success: boolean; error?: string }> => {
        // Verificar limite diário ANTES de exibir o anúncio
        const alreadyUsed = await hasUsedAdToday();
        if (alreadyUsed) {
            return {
                success: false,
                error: 'Você já assistiu um anúncio hoje. Volte amanhã para desbloquear outra análise.',
            };
        }

        // Expo Go: simula recompensa sem anúncio real
        if (isExpoGo || !RewardedAd) {
            try {
                const today = todayStr();
                // ✅ FIX: Salva com formato de data, não timestamp
                await AsyncStorage.setItem(DAILY_AD_KEY, JSON.stringify({ date: today, analysisId: id }));
                await AsyncStorage.setItem(`${UNLOCK_STORAGE_PREFIX}${id}`, JSON.stringify({ date: today }));
                if (user) {
                    await supabase.from('user_unlocked_picks').upsert(
                        { user_id: user.id, analysis_id: id, created_at: new Date().toISOString() },
                        { onConflict: 'user_id,analysis_id' }
                    );
                }
            } catch { /* silencia */ }
            return { success: true };
        }

        setLoading(true);

        if (!loadedRef.current) {
            try {
                await Promise.race([
                    loadAd(),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 10_000)
                    ),
                ]);
            } catch {
                setLoading(false);
                return { success: false, error: 'Anúncio não disponível. Tente novamente.' };
            }
        }

        const ad = adRef.current;
        if (!ad || !loadedRef.current) {
            setLoading(false);
            return { success: false, error: 'Anúncio não disponível. Tente novamente.' };
        }

        setLoading(false);

        return new Promise((resolve) => {
            let earnedReward = false;

            const unsubEarned = ad.addAdEventListener(
                RewardedAdEventType.EARNED_REWARD,
                async (reward: RewardedAdReward) => {
                    earnedReward = true;
                    try {
                        const today = todayStr();
                        // ✅ FIX: Salva com formato de data, não timestamp
                        await AsyncStorage.setItem(DAILY_AD_KEY, JSON.stringify({ date: today, analysisId: id }));
                        await AsyncStorage.setItem(`${UNLOCK_STORAGE_PREFIX}${id}`, JSON.stringify({ date: today }));
                        if (user) {
                            await supabase.from('user_unlocked_picks').upsert(
                                { user_id: user.id, analysis_id: id, created_at: new Date().toISOString() },
                                { onConflict: 'user_id,analysis_id' }
                            );
                        }
                    } catch (e) {
                        console.error('[RewardedAd] Erro ao salvar recompensa:', e);
                    }
                }
            );

            const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
                unsubEarned();
                unsubClosed();
                loadedRef.current = false;
                adRef.current     = null;
                loadAd().catch(() => {});

                if (earnedReward) {
                    resolve({ success: true });
                } else {
                    resolve({ success: false, error: 'Anúncio fechado antes de completar.' });
                }
            });

            const unsubError = ad.addAdEventListener(AdEventType.ERROR, (err: any) => {
                unsubEarned();
                unsubClosed();
                unsubError();
                loadedRef.current = false;
                adRef.current     = null;
                resolve({ success: false, error: err?.message ?? 'Erro ao exibir anúncio.' });
            });

            try {
                ad.show();
            } catch (e: any) {
                unsubEarned();
                unsubClosed();
                unsubError();
                resolve({ success: false, error: e?.message ?? 'Falha ao exibir anúncio.' });
            }
        });
    };

    return { loading, showAd, isUnlockedToday, hasUsedAdToday, reloadAd: loadAd };
}
