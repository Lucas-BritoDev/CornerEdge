import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Mock BannerAd for Expo Go (native AdMob doesn't work without prebuild)
// In production, you'll use a development build with real AdMob

export function BannerAd() {
    // Return a placeholder in Expo Go/Dev
    if (__DEV__) {
        return (
            <View style={styles.container}>
                <View style={styles.mockBanner}>
                    <Text style={styles.mockText}>📢 Anúncio (Test)</Text>
                </View>
            </View>
        );
    }

    // In production build, this would use real AdMob
    // For now, return null since we can't use native modules in Expo Go
    return null;
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: 'transparent',
    },
    mockBanner: {
        width: '90%',
        height: 50,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    mockText: {
        color: '#999',
        fontSize: 12,
    }
});
