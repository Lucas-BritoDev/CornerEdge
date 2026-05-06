// Ads Service - Mock for Expo Go, real implementation for production builds
// react-native-google-mobile-ads requires native code and won't work in Expo Go

// AdMob IDs - PRODUÇÃO
const ADMOB_IDS = {
    android: {
        banner: 'ca-app-pub-8609967398609187/5936939727',
        rewarded: 'ca-app-pub-8609967398609187/7851666948',
    },
    ios: {
        banner: 'ca-app-pub-8609967398609187/5936939727', // Atualizar quando tiver iOS
        rewarded: 'ca-app-pub-8609967398609187/7851666948', // Atualizar quando tiver iOS
    }
};

export const adsService = {
    async initialize() {
        if (__DEV__) {
            console.log('[AdsService] Running in dev mode - ads mocked');
            return;
        }
        // In production, initialize AdMob here
        console.log('[AdsService] Initialized with production AdMob IDs');
    },

    async showInterstitial() {
        if (__DEV__) {
            console.log('[AdsService] Mock: Would show interstitial ad');
            return true;
        }
        // In production, show real interstitial
        return false;
    },

    async showRewarded(): Promise<{ rewarded: boolean }> {
        if (__DEV__) {
            console.log('[AdsService] Mock: Would show rewarded ad');
            // Simulate success in dev for testing
            return { rewarded: true };
        }
        // In production, show real rewarded ad
        console.log('[AdsService] Showing rewarded ad:', ADMOB_IDS);
        return { rewarded: false };
    },

    getAdUnitIds() {
        return ADMOB_IDS;
    }
};
