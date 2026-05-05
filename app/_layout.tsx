import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';
import '../i18n';

function AppContent() {
    const { resolvedTheme } = useTheme();

    return (
        <>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="forgot-password" />
                <Stack.Screen name="new-password" />
                <Stack.Screen name="goodbye" />
            </Stack>
            <StatusBar style="light" />
        </>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <AuthProvider>
                    <SafeAreaProvider>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                            <AppContent />
                        </GestureHandlerRootView>
                    </SafeAreaProvider>
                </AuthProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}