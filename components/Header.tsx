import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
    children?: React.ReactNode;
}

export function Header({ title, subtitle, showBack, rightAction, children }: HeaderProps) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={['#1A1A1A', '#FF6B00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.container, { paddingTop: insets.top + 12 }]}
        >
            <View style={styles.content}>
                {/* Espaço esquerdo — botão voltar ou placeholder para manter centralização */}
                <View style={styles.sideSlot}>
                    {showBack && (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
                            <ArrowLeft color="#FFF" size={24} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Título e subtítulo sempre centralizados */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>

                {/* Espaço direito — ações opcionais ou placeholder */}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    // Slots laterais com largura fixa garantem que o centro fique sempre centralizado
    sideSlot: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 3,
        fontWeight: '600',
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    childrenContainer: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 4,
    },
});
