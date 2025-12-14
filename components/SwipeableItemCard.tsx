import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Trash2 } from 'lucide-react-native';
import { ItemCard } from './ItemCard';
import { ShoppingItem } from '../types';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

interface SwipeableItemCardProps {
    item: ShoppingItem;
    onToggle: () => void;
    onDelete: () => void;
}

export function SwipeableItemCard({ item, onToggle, onDelete }: SwipeableItemCardProps) {

    const renderRightActions = (progress: any, dragX: any) => {
        return (
            <View style={styles.rightActions}>
                <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                    <Trash2 color="#fff" size={24} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Swipeable renderRightActions={renderRightActions}>
            <ItemCard item={item} onToggle={onToggle} />
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    rightActions: {
        width: 80,
        height: 72,
        flexDirection: 'row',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
});
