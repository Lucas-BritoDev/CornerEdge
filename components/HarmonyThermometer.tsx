import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { Heart, AlertTriangle, Smile, Frown } from 'lucide-react-native';

interface HarmonyThermometerProps {
    value: number; // 0-100
    isDark?: boolean;
}

export function HarmonyThermometer({ value, isDark = false }: HarmonyThermometerProps) {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(animatedValue, {
            toValue: value,
            friction: 8,
            tension: 40,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const getColor = (val: number) => {
        if (val >= 70) return colors.success;
        if (val >= 40) return colors.warning;
        return colors.error;
    };

    const getEmoji = (val: number) => {
        if (val >= 70) return '😊';
        if (val >= 40) return '😐';
        return '😟';
    };

    const getMessage = (val: number) => {
        if (val >= 85) return 'Casa em harmonia perfeita!';
        if (val >= 70) return 'Tudo indo bem por aqui!';
        if (val >= 55) return 'Algumas tarefas pendentes...';
        if (val >= 40) return 'Precisamos melhorar!';
        if (val >= 25) return 'Atenção: muitas pendências!';
        return 'Hora de uma reunião familiar!';
    };

    const animatedWidth = animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    const animatedColor = animatedValue.interpolate({
        inputRange: [0, 40, 70, 100],
        outputRange: [colors.error, colors.warning, colors.success, colors.success],
    });

    const cardBg = isDark ? '#1F2937' : colors.white;
    const textColor = isDark ? '#F9FAFB' : colors.textPrimary;
    const mutedColor = isDark ? '#9CA3AF' : colors.textMuted;
    const trackBg = isDark ? '#374151' : '#E5E7EB';

    return (
        <View style={[styles.container, { backgroundColor: cardBg }]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Heart color={getColor(value)} size={20} fill={getColor(value)} />
                    <Text style={[styles.title, { color: textColor }]}>Harmonia da Casa</Text>
                </View>
                <Text style={styles.emoji}>{getEmoji(value)}</Text>
            </View>

            <View style={styles.thermometerContainer}>
                <View style={[styles.track, { backgroundColor: trackBg }]}>
                    <Animated.View
                        style={[
                            styles.fill,
                            {
                                width: animatedWidth,
                                backgroundColor: animatedColor
                            }
                        ]}
                    />
                </View>
                <Text style={[styles.percentage, { color: getColor(value) }]}>{Math.round(value)}%</Text>
            </View>

            <Text style={[styles.message, { color: mutedColor }]}>{getMessage(value)}</Text>

            {value < 40 && (
                <View style={styles.alertBanner}>
                    <AlertTriangle color={colors.error} size={16} />
                    <Text style={styles.alertText}>Sugestão: Agende um mutirão!</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    title: {
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    emoji: {
        fontSize: 28,
    },
    thermometerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    track: {
        flex: 1,
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 6,
    },
    percentage: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        minWidth: 50,
        textAlign: 'right',
    },
    message: {
        fontSize: fontSize.sm,
        marginTop: spacing.sm,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    alertText: {
        color: colors.error,
        fontSize: fontSize.sm,
        fontWeight: '500',
    },
});
