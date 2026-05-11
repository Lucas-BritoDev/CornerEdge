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
import * as SplashScreen from 'expo-splash-screen';
import '../i18n';

// Manter o splash screen visível enquanto carregamos recursos
SplashScreen.preventAutoHideAsync().catch(() => {});

// ============================================================================
// REACT QUERY CLIENT
// ============================================================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});

// ─── Proteção de rotas baseada em sessão ──────────────────────────────
function AuthGate() {
    const { user, isLoading, isOnboarded } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = ['login', 'signup', 'forgot-password', 'new-password', 'onboarding'].includes(segments[0] as string);

        if (!isOnboarded) {
            if (segments[0] !== 'onboarding') {
                router.replace('/onboarding');
            }
        } else if (!user && !inAuthGroup) {
            router.replace('/login');
        } else if (user && inAuthGroup) {
            router.replace('/');
        }
    }, [user, isLoading, isOnboarded, segments]);

    return null;
}

function AppContent() {
    const { resolvedTheme } = useTheme();
    const { isLoading: authLoading } = useAuth();

    // ✅ Inicialização e Splash Screen: Garantindo que o app entre em no máximo 5s
    useEffect(() => {
        let isMounted = true;
        let splashHidden = false;
        
        const hideSplash = async (reason: string) => {
            if (!splashHidden && isMounted) {
                splashHidden = true;
                console.log(`[CornerEdge] Ocultando Splash Screen. Motivo: ${reason}`);
                await SplashScreen.hideAsync().catch(() => {});
            }
        };

        // Timeout de segurança global: 5 segundos para esconder o splash independente de tudo
        const fallbackTimeout = setTimeout(() => {
            hideSplash('Timeout de segurança (5s)');
        }, 5000);

        const init = async () => {
            // Inicializa AdMob em segundo plano (sem await no fluxo crítico)
            import('../lib/admob-init').then(({ initializeAdMob }) => {
                initializeAdMob()
                    .then(() => console.log('[CornerEdge] AdMob pronto'))
                    .catch(e => console.warn('[CornerEdge] AdMob falhou:', e));
            }).catch(e => console.warn('[CornerEdge] Falha ao importar AdMob:', e));

            // Se o auth já estiver carregado, fecha o splash imediatamente
            if (!authLoading) {
                hideSplash('Auth carregado');
            }
        };

        init();

        return () => {
            isMounted = false;
            clearTimeout(fallbackTimeout);
        };
    }, [authLoading]);

    const statusBarBg = resolvedTheme === 'dark' ? '#0D0D0D' : '#FFFFFF';

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
            <StatusBar
                style={resolvedTheme === 'dark' ? 'light' : 'dark'}
                backgroundColor={statusBarBg}
            />
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
