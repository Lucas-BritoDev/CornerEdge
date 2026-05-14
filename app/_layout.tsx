import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
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
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        // Aguarda auth terminar de carregar
        if (isLoading) return;

        const currentSegment = segments[0] as string | undefined;
        if (!currentSegment) return;
        const inAuthGroup = ['login', 'signup', 'forgot-password', 'new-password'].includes(currentSegment);
        const inTabs = currentSegment === '(tabs)';

        if (!user) {
            // Sem sessão — vai para login (só se não estiver em tela de auth)
            if (!inAuthGroup) {
                router.replace('/login');
            }
        } else {
            // Com sessão — vai para home (só se estiver em tela de auth)
            if (inAuthGroup) {
                router.replace('/');
            }
        }
    }, [user, isLoading, segments[0]]);

    return null;
}

function AppContent() {
    const { resolvedTheme } = useTheme();
    const { isLoading: authLoading } = useAuth();
    const splashHiddenRef = useRef(false);

    const hideSplash = () => {
        if (splashHiddenRef.current) return;
        splashHiddenRef.current = true;
        SplashScreen.hideAsync().catch(() => {});
    };

    useEffect(() => {
        let cancelled = false;

        import('../lib/admob-init').then(({ initializeAdMob }) => {
            initializeAdMob()
                .then(() => console.log('[CornerEdge] AdMob pronto'))
                .catch(e => console.warn('[CornerEdge] AdMob falhou:', e));
        }).catch(e => console.warn('[CornerEdge] Falha ao importar AdMob:', e));

        const fallbackTimeout = setTimeout(() => {
            if (!cancelled) {
                console.log('[CornerEdge] Splash: timeout de segurança (6s)');
                hideSplash();
            }
        }, 6000);

        return () => {
            cancelled = true;
            clearTimeout(fallbackTimeout);
        };
    }, []);

    // Esconde o splash quando a sessão inicial estiver resolvida (não espera React Query).
    // Esperar ['analyses','today'] aqui podia travar o splash antes da home montar a query.
    useEffect(() => {
        if (authLoading) return;
        console.log('[CornerEdge] Splash: auth pronto, escondendo');
        hideSplash();
    }, [authLoading]);

    const statusBarBg = resolvedTheme === 'dark' ? '#0D0D0D' : '#FFFFFF';

    return (
        <>
            <AuthGate />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
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
