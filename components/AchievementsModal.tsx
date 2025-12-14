import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { gamificationService, ACHIEVEMENTS } from '../services/gamification-service';
import { storageService } from '../services/storage-service';
import { X, Award } from 'lucide-react-native';

interface AchievementsModalProps {
    visible: boolean;
    onClose: () => void;
}

export function AchievementsModal({ visible, onClose }: AchievementsModalProps) {
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [stats, setStats] = useState<any>(null);

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
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Conquistas</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X color="#333" size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{unlockedIds.length}</Text>
                                <Text style={styles.statLabel}>Desbloqueadas</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{ACHIEVEMENTS.length}</Text>
                                <Text style={styles.statLabel}>Total</Text>
                            </View>
                        </View>

                        {['bronze', 'silver', 'gold', 'platinum'].map((category) => (
                            <View key={category} style={styles.categorySection}>
                                <Text style={styles.categoryTitle}>
                                    {category === 'bronze' ? '🥉 Bronze' :
                                        category === 'silver' ? '🥈 Prata' :
                                            category === 'gold' ? '🥇 Ouro' : '💎 Platina'}
                                </Text>
                                {ACHIEVEMENTS.filter(a => a.category === category).map(achievement => {
                                    const isUnlocked = unlockedIds.includes(achievement.id);
                                    return (
                                        <View key={achievement.id} style={[styles.achievementCard, isUnlocked ? styles.unlockedCard : styles.lockedCard]}>
                                            <View style={styles.iconBox}>
                                                <Text style={[styles.icon, !isUnlocked && styles.grayscale]}>{achievement.icon}</Text>
                                            </View>
                                            <View style={styles.info}>
                                                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                                                <Text style={styles.achievementDesc}>{achievement.description}</Text>
                                                <Text style={styles.xpReward}>+{achievement.xpReward} XP</Text>
                                            </View>
                                            {!isUnlocked && <View style={styles.lockOverlay} />}
                                        </View>
                                    );
                                })}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '90%',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        paddingBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#8b5cf6',
    },
    statLabel: {
        color: '#666',
    },
    categorySection: {
        marginBottom: 20,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
    },
    achievementCard: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
        position: 'relative',
        overflow: 'hidden',
    },
    unlockedCard: {
        borderColor: '#8b5cf6',
        backgroundColor: '#f5f3ff',
    },
    lockedCard: {
        borderColor: '#eee',
        opacity: 0.7,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    icon: {
        fontSize: 24,
    },
    grayscale: {
        opacity: 0.5,
    },
    info: {
        flex: 1,
    },
    achievementTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    achievementDesc: {
        color: '#666',
        fontSize: 14,
        marginBottom: 6,
    },
    xpReward: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#8b5cf6',
    },
    lockOverlay: {
        // optional lock icon
    }
});
