import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
    BannerAd,
    BannerAdSize,
    TestIds,
} from 'react-native-google-mobile-ads';
import { mockSubscription } from '../data/mockData';

// Em produção, substitua pelos seus IDs reais do AdMob
const BANNER_ID = Platform.select({
    android: __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxx/xxxxxxxxxx',
    ios: __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxx/xxxxxxxxxx',
}) ?? TestIds.BANNER;

export function AdBanner() {
    const isPremium = mockSubscription.tier.toLowerCase() === 'premium';

    // Usuários premium nunca veem anúncios
    if (isPremium) return null;

    return (
        <View style={styles.container}>
            <BannerAd
                unitId={BANNER_ID}
                size={BannerAdSize.BANNER}
                requestOptions={{ requestNonPersonalizedAdsOnly: false }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'transparent',
    },
});
