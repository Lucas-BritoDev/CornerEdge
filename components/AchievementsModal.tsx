import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gamificationService, ACHIEVEMENTS } from '../services/gamification-service';
import { storageService } from '../services/storage-service';
import { X } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface AchievementsModalProps {
    visible: boolean;
    onClose: () => void;
}

export function AchievementsModal({ visible, onClose }: AchievementsModalProps) {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [stats, setStats] = useState<any>(null);

    const bgColor = isDark ? '#111827' : colors.background;
    const cardColor = isDark ? '#1F2937' : colors.white;
    const textColor = isDark ? '#F9FAFB' : colors.textPrimary;
    const mutedColor = isDark ? '#9CA3AF' : colors.textMuted;

    useEffect(() => {
        if (visible) {
            loadData();
        }
    }, [visible]);

    const loadData = async () => {
        const profile = await storageService.getProfile();
        if (profile) {
            setUnlockedIds(profile.achievements);
            setStats(profile.stats);
        }
    };

    return (
        <Modal visible={visible} animationType="slide">
            <View style={[styles.container, { backgroundColor: bgColor, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: textColor }]}>🏆 Conquistas</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X color={mutedColor} size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Stats */}
                    <View style={[styles.statsRow, { backgroundColor: cardColor }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{unlockedIds.length}</Text>
                            <Text style={[styles.statLabel, { color: mutedColor }]}>Desbloqueadas</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{ACHIEVEMENTS.length}</Text>
                            <Text style={[styles.statLabel, { color: mutedColor }]}>Total</Text>
                        </View>
                    </View>

                    {/* Achievement Categories */}
                    {['bronze', 'silver', 'gold', 'platinum'].map((category) => (
                        <View key={category} style={styles.categorySection}>
                            <Text style={[styles.categoryTitle, { color: textColor }]}>
                                {category === 'bronze' ? '🥉 Bronze' :
                                    category === 'silver' ? '🥈 Prata' :
                                        category === 'gold' ? '🥇 Ouro' : '💎 Platina'}
                            </Text>
                            {ACHIEVEMENTS.filter(a => a.category === category).map(achievement => {
                                const isUnlocked = unlockedIds.includes(achievement.id);
                                return (
                                    <View
                                        key={achievement.id}
                                        style={[
                                            styles.achievementCard,
                                            { backgroundColor: cardColor },
                                            isUnlocked && styles.unlockedCard,
                                            !isUnlocked && styles.lockedCard
                                        ]}
                                    >
                                        <View style={[styles.iconBox, { backgroundColor: isUnlocked ? colors.primary + '20' : '#E5E7EB' }]}>
                                            <Text style={[styles.icon, !isUnlocked && styles.grayscale]}>{achievement.icon}</Text>
                                        </View>
                                        <View style={styles.info}>
                                            <Text style={[styles.achievementTitle, { color: textColor }]}>{achievement.title}</Text>
                                            <Text style={[styles.achievementDesc, { color: mutedColor }]}>{achievement.description}</Text>
                                            <Text style={[styles.xpReward, { color: colors.primary }]}>+{achievement.xpReward} XP</Text>
                                        </View>
                                        {isUnlocked && (
                                            <View style={styles.checkBadge}>
                                                <Text style={styles.checkEmoji}>✓</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    title: {
        fontSize: fontSize['2xl'],
        fontWeight: 'bold',
    },
    closeButton: {
        padding: spacing.sm,
    },
    content: {
        paddingBottom: spacing.xl,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
    },
    statValue: {
        fontSize: fontSize['2xl'],
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: fontSize.sm,
        marginTop: 4,
    },
    categorySection: {
        marginBottom: spacing.xl,
    },
    categoryTitle: {
        fontSize: fontSize.lg,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    achievementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
        ...shadows.sm,
    },
    unlockedCard: {
        borderColor: colors.primary,
    },
    lockedCard: {
        opacity: 0.6,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    icon: {
        fontSize: 26,
    },
    grayscale: {
        opacity: 0.5,
    },
    info: {
        flex: 1,
    },
    achievementTitle: {
        fontWeight: '600',
        fontSize: fontSize.md,
        marginBottom: 2,
    },
    achievementDesc: {
        fontSize: fontSize.sm,
        marginBottom: 4,
    },
    xpReward: {
        fontSize: fontSize.sm,
        fontWeight: 'bold',
    },
    checkBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkEmoji: {
        color: colors.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
});
