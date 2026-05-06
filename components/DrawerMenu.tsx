import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions, Switch, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Home, Moon, Sun } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface DrawerMenuProps {
    visible: boolean;
    onClose: () => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    route: string;
    badge?: string;
    badgeColor?: string;
}

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { theme, toggleTheme, colors } = useTheme();
    const isDark = theme === 'dark';
    const { width: screenWidth } = useWindowDimensions();
    const drawerWidth = Math.min(screenWidth * 0.85, 320);

    const menuItems: MenuItem[] = [
        { id: 'home', label: 'Início', icon: <Home color={colors.textSecondary} size={22} />, route: '/' },
    ];

    const handleNavigation = (route: string) => {
        onClose();
        setTimeout(() => router.push(route as any), 200);
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                {/* Drawer on LEFT side */}
                <View style={[
                    styles.drawer,
                    {
                        backgroundColor: colors.backgroundPrimary,
                        paddingTop: insets.top + 16,
                        paddingBottom: insets.bottom + 16,
                        width: drawerWidth
                    }
                ]}>
                    {/* Header - User Profile */}
                    <View style={[styles.drawerHeader, { borderBottomColor: colors.cardBorder }]}>
                        <View style={styles.userInfo}>
                            <View style={[styles.avatar, { backgroundColor: colors.accentOrange }]}>
                                <Text style={[styles.avatarText, { color: colors.white }]}>
                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                            <View style={styles.userTextContainer}>
                                <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
                                    Usuário
                                </Text>
                                <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
                                    {user?.email || 'seu@email.com'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color={colors.textMuted} size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items - Scrollable */}
                    <ScrollView
                        style={styles.menuScrollView}
                        contentContainerStyle={styles.menuSection}
                        showsVerticalScrollIndicator={false}
                    >
                        {menuItems.map((item) => (
                            <Pressable
                                key={item.id}
                                style={({ pressed }) => [
                                    styles.menuItem,
                                    {
                                        backgroundColor: pressed ? colors.background : colors.backgroundSecondary,
                                        borderColor: colors.cardBorder
                                    }
                                ]}
                                onPress={() => handleNavigation(item.route)}
                            >
                                <View style={styles.menuItemIcon}>{item.icon}</View>
                                <Text style={[styles.menuItemLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                                    {item.label}
                                </Text>
                                {item.badge && (
                                    <View style={[styles.badge, { backgroundColor: item.badgeColor }]}>
                                        <Text style={styles.badgeText}>{item.badge}</Text>
                                    </View>
                                )}
                            </Pressable>
                        ))}
                    </ScrollView>

                    {/* Theme Toggle */}
                    <View style={[styles.themeToggle, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <View style={styles.themeInfo}>
                            {isDark ? (
                                <Moon color={colors.accentOrange} size={20} />
                            ) : (
                                <Sun color={colors.accentOrange} size={20} />
                            )}
                            <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>
                                {isDark ? 'Modo Escuro' : 'Modo Claro'}
                            </Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{
                                false: '#D1D5DB',
                                true: colors.accentOrange
                            }}
                            thumbColor={colors.white}
                        />
                    </View>

                    {/* Version */}
                    <Text style={[styles.version, { color: colors.textMuted }]}>
                        GoalEdge v1.0.0
                    </Text>
                </View>

                {/* Overlay touch area to close (RIGHT side) */}
                <TouchableOpacity style={styles.overlayTouch} onPress={onClose} activeOpacity={1} />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
    },
    overlayTouch: {
        flex: 1,
    },
    drawer: {
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    userTextContainer: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 12,
        marginTop: 2,
    },
    closeButton: {
        padding: 8,
    },
    menuScrollView: {
        flex: 1,
    },
    menuSection: {
        gap: 8,
        paddingBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    menuItemIcon: {
        marginRight: 16,
        width: 24,
        alignItems: 'center',
    },
    menuItemLabel: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 9999,
        marginLeft: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    themeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 8,
    },
    themeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    themeLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    version: {
        textAlign: 'center',
        fontSize: 10,
        marginTop: 24,
    },
});
