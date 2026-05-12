import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
    /** Children rendered below the title/date row (e.g. stats cards) */
    children?: React.ReactNode;
}

/**
 * AppHeader — header padrão do CornerEdge.
 *
 * Especificação visual:
 *  - Fundo laranja sólido #FF6B00
 *  - "CornerEdge" centralizado, branco, bold, fontSize 22
 *  - Data atual formatada embaixo, centralizado, branco, fontSize 13, opacity 0.9
 *  - paddingTop: insets.top + 16
 *  - paddingBottom: 20
 *  - Sem bordas arredondadas (borderBottomLeftRadius: 0, borderBottomRightRadius: 0)
 *  - Sem gradiente, sem botão de notificação, sem logo lateral
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
        <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.title}>CornerEdge</Text>
            <Text style={styles.date}>{dateLabel}</Text>

            {children ? (
                <View style={styles.childrenContainer}>
                    {children}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#FF6B00',
        paddingBottom: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    date: {
        fontSize: 13,
        color: '#FFFFFF',
        opacity: 0.9,
        marginTop: 4,
        textAlign: 'center',
    },
    childrenContainer: {
        width: '100%',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
});
