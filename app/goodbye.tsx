import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, fontSize, shadows, borderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, Home } from 'lucide-react-native';

export default function GoodbyeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const fadeAnim = new Animated.Value(0);
    const scaleAnim = new Animated.Value(0.8);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        const timer = setTimeout(() => {
            router.replace('/login');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#312E81', '#1E1B4B']}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }], marginTop: insets.top }]}>
                <View style={styles.iconContainer}>
                    <Text style={styles.emoji}>👋</Text>
                </View>

                <Text style={styles.title}>Até logo!</Text>
                <Text style={styles.subtitle}>
                    Esperamos te ver em breve para organizar mais tarefas juntos.
                </Text>

                <View style={styles.divider} />

                <Text style={styles.footerText}>
                    Redirecionando em alguns segundos...
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.replace('/login')}
                >
                    <Home color={colors.white} size={20} />
                    <Text style={styles.buttonText}>Voltar ao Início</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 32,
        padding: spacing.xl,
        alignItems: 'center',
        ...shadows.lg,
    },
    iconContainer: {
        marginBottom: spacing.lg,
    },
    emoji: {
        fontSize: 80,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: fontSize.lg,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: spacing.xl,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#E2E8F0',
        marginBottom: spacing.lg,
    },
    footerText: {
        fontSize: fontSize.sm,
        color: '#94A3B8',
        marginBottom: spacing.lg,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        ...shadows.md,
    },
    buttonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: fontSize.md,
    },
});
