import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { Clock, Check, ChevronRight, AlertCircle } from 'lucide-react-native';
import { HouseholdTask, TASK_CATEGORIES } from '../types';

interface NextTaskWidgetProps {
    task: HouseholdTask | null;
    onComplete: (taskId: string) => void;
    onPress: () => void;
    isDark?: boolean;
}

export function NextTaskWidget({ task, onComplete, onPress, isDark = false }: NextTaskWidgetProps) {
    const [timeLeft, setTimeLeft] = useState('');
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (task?.dueDate) {
            const updateTimer = () => {
                const now = Date.now();
                const diff = task.dueDate! - now;

                if (diff <= 0) {
                    setTimeLeft('Atrasada!');
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                    if (hours > 0) {
                        setTimeLeft(`${hours}h ${mins}m`);
                    } else {
                        setTimeLeft(`${mins} min`);
                    }
                }
            };

            updateTimer();
            const interval = setInterval(updateTimer, 60000);
            return () => clearInterval(interval);
        }
    }, [task]);

    useEffect(() => {
        // Pulse animation for urgent tasks
        if (task && timeLeft === 'Atrasada!') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.02, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [timeLeft]);

    if (!task) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1F2937' : colors.white }]}>
                <Check color={colors.success} size={32} />
                <Text style={[styles.emptyTitle, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}>
                    Tudo em dia! 🎉
                </Text>
                <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : colors.textMuted }]}>
                    Nenhuma tarefa pendente no momento
                </Text>
            </View>
        );
    }

    const category = TASK_CATEGORIES.find(c => c.id === task.category) || TASK_CATEGORIES[0];
    const isUrgent = timeLeft === 'Atrasada!' || (task.priority === 'high');
    const cardBg = isUrgent
        ? (isDark ? '#7F1D1D' : '#FEF2F2')
        : (isDark ? '#1F2937' : colors.white);
    const borderCol = isUrgent ? colors.error : colors.primary;

    return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
                style={[styles.container, { backgroundColor: cardBg, borderLeftColor: borderCol }]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <View style={styles.header}>
                    <View style={styles.badge}>
                        <Clock color={isUrgent ? colors.error : colors.primary} size={14} />
                        <Text style={[styles.badgeText, { color: isUrgent ? colors.error : colors.primary }]}>
                            PRÓXIMA TAREFA
                        </Text>
                    </View>
                    {timeLeft && (
                        <View style={[styles.timerBadge, { backgroundColor: isUrgent ? colors.error : colors.primary }]}>
                            {isUrgent && <AlertCircle color={colors.white} size={12} />}
                            <Text style={styles.timerText}>{timeLeft}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.content}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                        <Text style={styles.categoryEmoji}>{category.icon}</Text>
                    </View>
                    <View style={styles.taskInfo}>
                        <Text style={[styles.taskName, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}>
                            {task.name}
                        </Text>
                        <Text style={[styles.taskPoints, { color: colors.accent }]}>
                            +{task.points} pontos
                        </Text>
                    </View>
                    <ChevronRight color={isDark ? '#9CA3AF' : colors.textMuted} size={20} />
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => onComplete(task.id)}
                    >
                        <Check color={colors.white} size={18} />
                        <Text style={styles.completeText}>Já Fiz!</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderLeftWidth: 4,
        ...shadows.md,
    },
    emptyContainer: {
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        ...shadows.sm,
    },
    emptyTitle: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        marginTop: spacing.md,
    },
    emptySubtitle: {
        fontSize: fontSize.sm,
        marginTop: spacing.xs,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    timerText: {
        color: colors.white,
        fontSize: fontSize.xs,
        fontWeight: 'bold',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    categoryEmoji: {
        fontSize: 24,
    },
    taskInfo: {
        flex: 1,
    },
    taskName: {
        fontSize: fontSize.md,
        fontWeight: '600',
        marginBottom: 2,
    },
    taskPoints: {
        fontSize: fontSize.sm,
        fontWeight: '500',
    },
    actions: {
        marginTop: spacing.md,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.success,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    completeText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: '600',
    },
});
