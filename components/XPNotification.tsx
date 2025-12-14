import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Trophy } from 'lucide-react-native';

interface XPNotificationProps {
    visible: boolean;
    xpGained: number;
    message: string;
    onDismiss: () => void;
}

export function XPNotification({ visible, xpGained, message, onDismiss }: XPNotificationProps) {
    const slideAnim = React.useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            // Slide down
            Animated.spring(slideAnim, {
                toValue: 50, // Top margin
                useNativeDriver: true,
            }).start();

            // Auto dismiss
            const timer = setTimeout(() => {
                Animated.timing(slideAnim, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => onDismiss());
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.iconContainer}>
                <Trophy size={20} color="#fff" />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>+{xpGained} XP</Text>
                <Text style={styles.message}>{message}</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        backgroundColor: '#333',
        borderRadius: 50,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F59E0B', // Gold
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        color: '#F59E0B',
        fontWeight: 'bold',
        fontSize: 14,
    },
    message: {
        color: '#fff',
        fontSize: 12,
    },
});
