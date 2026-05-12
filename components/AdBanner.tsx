import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { AD_UNITS } from '../services/ads-service';

// ── Detecção de ambiente — igual ao GoalEdge (mais abrangente) ────────────────
const isExpoGo =
    Constants.executionEnvironment === 'storeClient' ||
    (Constants as any).appOwnership === 'expo' ||
    Platform.OS === 'web';

// ID do anúncio: test em dev, produção em release
const BANNER_AD_UNIT_ID = __DEV__
    ? Platform.OS === 'ios'
        ? 'ca-app-pub-3940256099942544/2934735716'  // iOS test banner
        : 'ca-app-pub-3940256099942544/6300978111'  // Android test banner
    : Platform.OS === 'ios'
        ? AD_UNITS.IOS_BANNER
        : AD_UNITS.ANDROID_BANNER;

// ── Carregamento seguro do módulo nativo ──────────────────────────────────────
let BannerAd: any = null;
let BannerAdSize: any = null;

if (!isExpoGo) {
    try {
        const admob = require('react-native-google-mobile-ads');
        BannerAd = admob.BannerAd;
        BannerAdSize = admob.BannerAdSize;
    } catch {
        // Módulo não disponível — banner não será exibido
    }
}

export function AdBanner() {
    const [adError, setAdError] = React.useState(false);
    const [retryKey, setRetryKey] = React.useState(0);

    // Retry automático após 30s quando o banner falha
    React.useEffect(() => {
        if (!adError) return;
        const timer = setTimeout(() => {
            setAdError(false);
            setRetryKey(k => k + 1);
        }, 30_000);
        return () => clearTimeout(timer);
    }, [adError]);

    // Não renderiza no Expo Go ou se o módulo nativo não estiver disponível
    if (isExpoGo || !BannerAd || !BannerAdSize) {
        return <View style={styles.placeholder} />;
    }

    if (adError) {
        return <View style={styles.placeholder} />;
    }

    return (
        <View style={styles.container}>
            <BannerAd
                key={retryKey}
                unitId={BANNER_AD_UNIT_ID}
                size={BannerAdSize.BANNER}
                requestOptions={{ requestNonPersonalizedAdsOnly: false }}
                onAdLoaded={() => {
                    console.log('[AdBanner] Banner carregado com sucesso');
                    setAdError(false);
                }}
                onAdFailedToLoad={(error: any) => {
                    console.warn('[AdBanner] Falha ao carregar banner:', error?.message ?? error);
                    setAdError(true);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: '100%',
        minHeight: 50,
    },
    placeholder: {
        width: '100%',
        height: 50,
        backgroundColor: 'transparent',
    },
});
