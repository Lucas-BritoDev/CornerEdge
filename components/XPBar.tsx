import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { gamificationService } from '../services/gamification-service';
import { storageService } from '../services/storage-service';
import { Trophy, Zap } from 'lucide-react-native';

interface XPBarProps {
    compact?: boolean;
    onPress?: () => void;
}

export function XPBar({ compact, onPress }: XPBarProps) {
    const [levelInfo, setLevelInfo] = useState<any>(null);

    const loadData = async () => {
        const profile = await storageService.getProfile();
        if (profile) {
            const info = await gamificationService.getLevelInfo(profile.stats.xp);
            setLevelInfo(info);
        } else {
            // Initial state
            setLevelInfo(await gamificationService.getLevelInfo(0));
        }
    };

    useEffect(() => {
        loadData();
        // In a real app we'd subscribe to updates
        const interval = setInterval(loadData, 2000); // Polling for now
        return () => clearInterval(interval);
    }, []);

    if (!levelInfo) return null;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <View style={[styles.container, compact && styles.compactContainer]}>
                <View style={styles.iconContainer}>
                    <Text style={styles.levelIcon}>{levelInfo.currentIcon}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.levelText}>Nível {levelInfo.currentLevel}: {levelInfo.currentTitle}</Text>
                        <Text style={styles.xpText}>{Math.floor(levelInfo.progress * 100)}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${levelInfo.progress * 100}%` }]} />
                    </View>
                    {!compact && (
                        <Text style={styles.nextLevelText}>Faltam {levelInfo.xpToNext} XP para o próximo nível</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 10,
    },
    compactContainer: {
        padding: 8,
        borderRadius: 8,
        marginBottom: 0,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    levelIcon: {
        fontSize: 20,
    },
    infoContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    levelText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
    },
    xpText: {
        fontSize: 12,
        color: '#666',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#8b5cf6', // Purple primary
        borderRadius: 4,
    },
    nextLevelText: {
        fontSize: 10,
        color: '#999',
        marginTop: 4,
    }
});
