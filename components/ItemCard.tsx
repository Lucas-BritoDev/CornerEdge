import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingItem } from '../types';
import { Check, Circle } from 'lucide-react-native';

interface ItemCardProps {
    item: ShoppingItem;
    onToggle: () => void;
}

export function ItemCard({ item, onToggle }: ItemCardProps) {
    return (
        <TouchableOpacity
            style={[styles.container, item.completed && styles.completedContainer]}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <View style={styles.checkContainer}>
                {item.completed ? (
                    <View style={styles.checkedCircle}>
                        <Check size={16} color="#fff" />
                    </View>
                ) : (
                    <Circle size={24} color="#ccc" />
                )}
            </View>

            <View style={styles.content}>
                <Text style={[styles.name, item.completed && styles.completedText]}>
                    {item.name}
                </Text>
                <Text style={styles.details}>
                    {item.quantity} {item.unit} • {item.category}
                </Text>
            </View>

            {item.price && (
                <Text style={styles.price}>
                    R$ {(item.price * item.quantity).toFixed(2)}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        marginBottom: 1, // separator
        height: 72,
    },
    completedContainer: {
        backgroundColor: '#fafafa',
    },
    checkContainer: {
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: 30,
    },
    checkedCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10b981', // green
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    details: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    price: {
        fontWeight: '600',
        color: '#333'
    }
});
