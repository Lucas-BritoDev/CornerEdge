import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { AD_UNITS } from '../services/ads-service';

// IDs de anúncio — usa test IDs em dev, produção em release
const BANNER_AD_UNIT_ID = __DEV__
    ? Platform.OS === 'ios'
        ? 'ca-app-pub-3940256099942544/2934735716' // iOS test banner
        : 'ca-app-pub-3940256099942544/6300978111' // Android test banner
    : Platform.OS === 'ios'
        ? AD_UNITS.IOS_BANNER
        : AD_UNITS.ANDROID_BANNER;

const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

let BannerAd: any = null;
let BannerAdSize: any = null;

if (!isExpoGo) {
    try {
        const admob = require('react-native-google-mobile-ads');
        BannerAd = admob.BannerAd;
        BannerAdSize = admob.BannerAdSize;
    } catch {
        // Módulo não disponível
    }
}

export function AdBanner() {
    const [adError, setAdError] = useState(false);

    // Não renderizar no Expo Go ou se módulo não disponível
    if (isExpoGo || !BannerAd || !BannerAdSize) {
        return <View style={styles.placeholder} />;
    }

    if (adError) {
        return <View style={styles.placeholder} />;
    }

    return (
        <View style={styles.container}>
            <BannerAd
                unitId={BANNER_AD_UNIT_ID}
                size={BannerAdSize.BANNER}
                requestOptions={{ requestNonPersonalizedAdsOnly: false }}
                onAdFailedToLoad={() => setAdError(true)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: '100%',
    },
    placeholder: {
        width: '100%',
        height: 50,
        backgroundColor: 'transparent',
    },
});
