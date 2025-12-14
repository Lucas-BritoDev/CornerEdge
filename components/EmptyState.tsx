import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';

interface EmptyStateProps {
    message?: string;
    icon?: React.ReactNode;
}

export function EmptyState({ message = "Nenhum item ainda", icon }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                {icon || <ShoppingBag size={48} color="#ccc" />}
            </View>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        marginTop: 40,
    },
    iconContainer: {
        marginBottom: 16,
        opacity: 0.5,
    },
    text: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
    },
});
