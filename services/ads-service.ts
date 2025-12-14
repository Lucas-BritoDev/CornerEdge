// Ads Service - Mock for Expo Go, real implementation for production builds
// react-native-google-mobile-ads requires native code and won't work in Expo Go

export const adsService = {
    async initialize() {
        if (__DEV__) {
            console.log('[AdsService] Running in dev mode - ads mocked');
            return;
        }
        // In production, initialize AdMob here
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
        return { rewarded: false };
    }
};
