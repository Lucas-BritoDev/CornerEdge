import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
    /** Children rendered below the title/date row (e.g. stats cards) */
    children?: React.ReactNode;
}

/**
 * AppHeader — header padrão do CornerEdge.
 *
 * Especificação visual (igual ao GoalEdge):
 *  - LinearGradient #1A1A1A → #FF6B00 (horizontal, end x:1 y:0.5)
 *  - "CornerEdge" centralizado, branco, fontWeight 900, fontSize 22, letterSpacing -0.5
 *  - Data atual formatada embaixo, centralizado, branco, fontSize 13, opacity 0.8, fontWeight 600
 *  - paddingTop: insets.top + 12
 *  - paddingBottom: 20, paddingHorizontal: 24
 *  - borderBottomLeftRadius: 28, borderBottomRightRadius: 28
 *  - elevation: 10 / shadow forte
 */
export function AppHeader({ children }: AppHeaderProps) {
    const insets = useSafeAreaInsets();

    const formattedDate = React.useMemo(() => {
        return new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
    }, []);

    // Capitaliza a primeira letra
    const dateLabel = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    return (
        <LinearGradient
            colors={['#1A1A1A', '#FF6B00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.container, { paddingTop: insets.top + 12 }]}
        >
            <View style={styles.content}>
                <Text style={styles.title}>CornerEdge</Text>
                <Text style={styles.date}>{dateLabel}</Text>
            </View>

            {children ? (
                <View style={styles.childrenContainer}>
                    {children}
                </View>
            ) : null}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    content: {
        minHeight: 80,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    date: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 3,
        fontWeight: '600',
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    childrenContainer: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 4,
    },
});
