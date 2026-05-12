import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
    /** @deprecated align is ignored — header is always centered */
    align?: 'left' | 'center';
    children?: React.ReactNode;
}

/**
 * AppHeader — header padrão do CornerEdge.
 *
 * Layout:
 *  - Fundo laranja sólido #FF6B00
 *  - Título centralizado, branco, bold, 22px
 *  - Data/subtítulo centralizado, branco, 13px, opacity 0.9
 *  - Sem bordas arredondadas no rodapé
 *  - Sem gradiente
 */
export function Header({ title, subtitle, showBack, rightAction, children }: HeaderProps) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
            {/* Row: back button | title area | right action */}
            <View style={styles.row}>
                {/* Left slot */}
                <View style={styles.sideSlot}>
                    {showBack && (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <ArrowLeft color="#FFF" size={22} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Center: title + subtitle */}
                <View style={styles.centerSlot}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {subtitle ? (
                        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                    ) : null}
                </View>

                {/* Right slot */}
                <View style={styles.sideSlot}>
                    {rightAction ?? null}
                </View>
            </View>

            {/* Optional children (e.g. stats row) */}
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        minHeight: 52,
    },
    sideSlot: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerSlot: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 13,
        color: '#FFFFFF',
        opacity: 0.9,
        marginTop: 3,
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    childrenContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
});
