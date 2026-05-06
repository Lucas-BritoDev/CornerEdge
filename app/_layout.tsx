import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';
import '../i18n';

// ============================================================================
// REACT QUERY CLIENT - Cache global para o app
// ============================================================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutos - dados considerados "frescos"
      gcTime: 30 * 60 * 1000,          // 30 minutos - tempo no cache (antes era cacheTime)
      refetchOnWindowFocus: false,     // Não refaz query ao voltar pro app
      refetchOnReconnect: true,        // Refaz query ao reconectar internet
      retry: 2,                        // Tenta 2 vezes se falhar
    },
  },
});

// ─── Proteção de rotas baseada em sessão ──────────────────────────────
function AuthGate() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = ['login', 'signup', 'forgot-password', 'new-password', 'onboarding'].includes(segments[0] as string);

        if (!user && !inAuthGroup) {
            // Usuário não autenticado tentando acessar área protegida
            router.replace('/login');
        } else if (user && inAuthGroup) {
            // Usuário autenticado tentando acessar telas de auth
            router.replace('/');
        }
    }, [user, isLoading, segments]);

    return null;
}

function AppContent() {
    const { resolvedTheme } = useTheme();

    return (
        <>
            <AuthGate />
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
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
    );
}
