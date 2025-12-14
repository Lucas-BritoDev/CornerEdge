import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Vibration } from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { RotateCcw, Play } from 'lucide-react-native';
import { HouseholdMember } from '../types';

interface TaskRouletteProps {
    members: HouseholdMember[];
    onResult: (member: HouseholdMember) => void;
    isDark?: boolean;
}

export function TaskRoulette({ members, onResult, isDark = false }: TaskRouletteProps) {
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedMember, setSelectedMember] = useState<HouseholdMember | null>(null);
    const spinValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(1)).current;

    const MEMBER_COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

    const spin = () => {
        if (isSpinning || members.length === 0) return;

        setIsSpinning(true);
        setSelectedMember(null);

        // Reset
        spinValue.setValue(0);

        // Random member selection
        const randomMemberIndex = Math.floor(Math.random() * members.length);
        const segmentAngle = 360 / members.length;

        // Calculate target angle so the red arrow points at the selected member
        // The arrow is at the top (0 degrees), so we need to rotate the wheel
        // so the selected segment aligns with the top
        // Each segment starts at angle = index * segmentAngle, center is at angle + segmentAngle/2
        // To align segment's center with top, wheel needs to rotate: -(index * segmentAngle + segmentAngle/2)
        // But we rotate positive, so: 360 - (index * segmentAngle + segmentAngle/2)
        const targetPosition = 360 - (randomMemberIndex * segmentAngle + segmentAngle / 2);
        const fullRotations = 360 * 5; // 5 full spins
        const targetAngle = fullRotations + targetPosition;

        Animated.timing(spinValue, {
            toValue: targetAngle,
            duration: 4000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            setIsSpinning(false);
            setSelectedMember(members[randomMemberIndex]);
            onResult(members[randomMemberIndex]);

            // Vibrate on result
            Vibration.vibrate([0, 100, 50, 100]);

            // Pulse animation
            Animated.sequence([
                Animated.timing(scaleValue, { toValue: 1.1, duration: 150, useNativeDriver: true }),
                Animated.timing(scaleValue, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]).start();
        });
    };

    const spinInterpolate = spinValue.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    const cardBg = isDark ? '#1F2937' : colors.white;
    const textColor = isDark ? '#F9FAFB' : colors.textPrimary;
    const mutedColor = isDark ? '#9CA3AF' : colors.textMuted;

    // Get the color of the selected member for center display
    const selectedMemberIndex = selectedMember ? members.findIndex(m => m.id === selectedMember.id) : -1;
    const selectedColor = selectedMemberIndex >= 0 ? MEMBER_COLORS[selectedMemberIndex % MEMBER_COLORS.length] : colors.primary;

    return (
        <View style={[styles.container, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: textColor }]}>🎰 Roleta de Tarefas</Text>
            <Text style={[styles.subtitle, { color: mutedColor }]}>
                Quem vai fazer a tarefa?
            </Text>

            {/* Roulette Wheel */}
            <View style={styles.wheelContainer}>
                {/* Pointer (Red Arrow) - Fixed at top */}
                <View style={styles.pointer}>
                    <View style={styles.pointerTriangle} />
                </View>

                <Animated.View
                    style={[
                        styles.wheel,
                        {
                            transform: [
                                { rotate: spinInterpolate },
                                { scale: scaleValue }
                            ]
                        }
                    ]}
                >
                    {members.map((member, index) => {
                        const segmentAngle = 360 / members.length;
                        const angle = segmentAngle * index + segmentAngle / 2; // Center of segment
                        const color = MEMBER_COLORS[index % MEMBER_COLORS.length];

                        return (
                            <View
                                key={member.id}
                                style={[
                                    styles.segment,
                                    {
                                        backgroundColor: color,
                                        transform: [
                                            { rotate: `${angle}deg` },
                                            { translateY: -65 },
                                        ],
                                    },
                                ]}
                            >
                                <Text style={styles.segmentText}>{member.name.charAt(0)}</Text>
                            </View>
                        );
                    })}

                    {/* Center Circle - Shows selected member or ? */}
                    <View style={[styles.centerCircle, selectedMember && { backgroundColor: selectedColor }]}>
                        {selectedMember && !isSpinning ? (
                            <Text style={styles.centerTextSelected}>{selectedMember.name.charAt(0)}</Text>
                        ) : (
                            <Text style={[styles.centerText, { color: colors.textPrimary }]}>?</Text>
                        )}
                    </View>
                </Animated.View>
            </View>

            {/* Result */}
            {selectedMember && !isSpinning && (
                <View style={styles.resultContainer}>
                    <View style={[styles.resultAvatar, { backgroundColor: selectedColor }]}>
                        <Text style={styles.resultAvatarText}>{selectedMember.name.charAt(0)}</Text>
                    </View>
                    <Text style={[styles.resultName, { color: textColor }]}>{selectedMember.name}</Text>
                    <Text style={[styles.resultLabel, { color: mutedColor }]}>foi sorteado(a)!</Text>
                </View>
            )}

            {/* Spin Button */}
            <TouchableOpacity
                style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
                onPress={spin}
                disabled={isSpinning}
                activeOpacity={0.8}
            >
                {isSpinning ? (
                    <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
                        <RotateCcw color={colors.white} size={24} />
                    </Animated.View>
                ) : (
                    <>
                        <Play color={colors.white} size={24} fill={colors.white} />
                        <Text style={styles.spinButtonText}>GIRAR ROLETA</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Members Legend */}
            <View style={styles.legend}>
                {members.map((member, index) => (
                    <View key={member.id} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: MEMBER_COLORS[index % MEMBER_COLORS.length] }]} />
                        <Text style={[styles.legendText, { color: mutedColor }]}>{member.name.split(' ')[0]}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        ...shadows.md,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: fontSize.sm,
        marginTop: spacing.xs,
        marginBottom: spacing.xl,
    },
    wheelContainer: {
        width: 240,
        height: 240,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    pointer: {
        position: 'absolute',
        top: -5,
        zIndex: 10,
    },
    pointerTriangle: {
        width: 0,
        height: 0,
        borderLeftWidth: 14,
        borderRightWidth: 14,
        borderTopWidth: 24,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.error,
    },
    wheel: {
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.lg,
    },
    segment: {
        position: 'absolute',
        width: 55,
        height: 55,
        borderRadius: 27.5,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
    },
    segmentText: {
        color: colors.white,
        fontSize: 20,
        fontWeight: 'bold',
    },
    centerCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
    },
    centerText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    centerTextSelected: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.white,
    },
    resultContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    resultAvatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    resultAvatarText: {
        color: colors.white,
        fontSize: 32,
        fontWeight: 'bold',
    },
    resultName: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
    },
    resultLabel: {
        fontSize: fontSize.sm,
    },
    spinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        gap: spacing.sm,
        width: '100%',
        ...shadows.md,
    },
    spinButtonDisabled: {
        backgroundColor: colors.textMuted,
    },
    spinButtonText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: 'bold',
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        fontSize: fontSize.xs,
    },
});
