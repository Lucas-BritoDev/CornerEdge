import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { adsService } from '../services/ads-service';
import { gamificationService } from '../services/gamification-service';
import { Gift } from 'lucide-react-native';

interface Props {
    onReward?: (xp: number) => void;
}

export function RewardedAdButton({ onReward }: Props) {
    const [loading, setLoading] = useState(false);

    const handlePress = async () => {
        setLoading(true);
        try {
            const result = await adsService.showRewarded();
            if (result.rewarded) {
                const xpGained = 25;
                await gamificationService.addXP(xpGained);
                onReward?.(xpGained);
            }
        } catch (e) {
            console.error('Rewarded ad error', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableOpacity style={styles.button} onPress={handlePress} disabled={loading}>
            {loading ? (
                <ActivityIndicator color="#8b5cf6" />
            ) : (
                <>
                    <Gift color="#8b5cf6" size={20} />
                    <Text style={styles.text}>Assistir e ganhar XP</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3e8ff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    text: {
        color: '#8b5cf6',
        fontWeight: '600',
    }
});
