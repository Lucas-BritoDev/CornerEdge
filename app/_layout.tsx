import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function AppContent() {
    const { theme } = useTheme();

    return (
        <>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="forgot-password" />
                <Stack.Screen name="index" />
                <Stack.Screen name="lists" />
                <Stack.Screen name="list/[id]" />
                <Stack.Screen name="recipes" />
                <Stack.Screen name="group" />
                <Stack.Screen name="achievements" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="goodbye" />
                <Stack.Screen name="new-password" />
                <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        </>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SafeAreaProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <AppContent />
                    </GestureHandlerRootView>
                </SafeAreaProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
