import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import { ArrowLeft, MoreVertical, Menu } from 'lucide-react-native';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
}

export function Header({ title, showBack, rightAction }: HeaderProps) {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {showBack ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
                        <ArrowLeft color="#333" size={24} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 24 }} /> // Placeholder
                )}
            </View>

            <Text style={styles.title} numberOfLines={1}>{title}</Text>

            <View style={styles.rightContainer}>
                {rightAction || <View style={{ width: 24 }} />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    leftContainer: {
        width: 40,
        alignItems: 'flex-start',
    },
    rightContainer: {
        width: 40,
        alignItems: 'flex-end',
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    button: {
        padding: 8,
        marginLeft: -8,
    },
});
