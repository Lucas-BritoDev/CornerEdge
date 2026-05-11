import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
    align?: 'left' | 'center';
    children?: React.ReactNode;
}

export function Header({ title, subtitle, showBack, rightAction, align = 'center', children }: HeaderProps) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    return (
        <LinearGradient
            colors={[colors.backgroundPrimary, colors.accentOrange]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, { paddingTop: insets.top + 12 }]}
        >
            <View style={[styles.content, align === 'left' && { justifyContent: 'flex-start', gap: 16 }]}>
                {showBack && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
                        <ArrowLeft color="#FFF" size={24} />
                    </TouchableOpacity>
                )}

                <View style={[styles.titleContainer, align === 'left' && { alignItems: 'flex-start', flex: 1 }]}>
                    <Text style={[styles.title, align === 'left' && { fontSize: 26, letterSpacing: -1 }]} numberOfLines={1}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>

                {rightAction && (
                    <View style={styles.rightContainer}>
                        {rightAction}
                    </View>
                )}
            </View>
            {children && (
                <View style={styles.childrenContainer}>
                    {children}
                </View>
            )}
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
    childrenContainer: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    titleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
        fontWeight: '700',
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
