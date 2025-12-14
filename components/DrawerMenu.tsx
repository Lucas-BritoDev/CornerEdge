import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    X, Home, List, ChefHat, Users, Trophy, Settings, Moon, Sun
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
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
}

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const { width: screenWidth } = useWindowDimensions();
    const drawerWidth = Math.min(screenWidth * 0.85, 320); // Responsivo com máximo de 320

    const iconColor = isDark ? colors.white : colors.textPrimary;

    const menuItems: MenuItem[] = [
        { id: 'home', label: 'Dashboard', icon: <Home color={iconColor} size={22} />, route: '/' },
        { id: 'lists', label: 'Lista', icon: <List color={iconColor} size={22} />, route: '/lists' },
        { id: 'recipes', label: 'Receitas', icon: <ChefHat color={iconColor} size={22} />, route: '/recipes' },
        { id: 'group', label: 'Modo Grupo', icon: <Users color={iconColor} size={22} />, route: '/group' },
        { id: 'achievements', label: 'Conquistas', icon: <Trophy color={iconColor} size={22} />, route: '/achievements' },
        { id: 'settings', label: 'Configurações', icon: <Settings color={iconColor} size={22} />, route: '/settings' },
    ];

    const handleNavigation = (route: string) => {
        onClose();
        setTimeout(() => router.push(route as any), 200);
    };

    const bgColor = isDark ? '#1F2937' : colors.white;
    const textColor = isDark ? colors.white : colors.textPrimary;
    const mutedColor = isDark ? '#9CA3AF' : colors.textMuted;
    const menuItemBg = isDark ? '#374151' : '#F3F4F6';
    const borderColor = isDark ? '#4B5563' : '#E5E7EB';

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.overlayTouch} onPress={onClose} activeOpacity={1} />
                <View style={[styles.drawer, { backgroundColor: bgColor, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md, width: drawerWidth }]}>
                    {/* Header - User Profile */}
                    <View style={styles.drawerHeader}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                            <View style={styles.userTextContainer}>
                                <Text style={[styles.userName, { color: textColor }]}>
                                    {user?.name || 'Usuário'}
                                </Text>
                                <Text style={[styles.userEmail, { color: mutedColor }]}>
                                    {user?.email || 'seu@email.com'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color={mutedColor} size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items - Each with rounded background */}
                    <View style={styles.menuSection}>
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.menuItem, { backgroundColor: menuItemBg, borderColor }]}
                                onPress={() => handleNavigation(item.route)}
                            >
                                <View style={styles.menuItemIcon}>{item.icon}</View>
                                <Text style={[styles.menuItemLabel, { color: textColor }]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Theme Toggle with border */}
                    <View style={[styles.themeToggle, { backgroundColor: menuItemBg, borderColor }]}>
                        <View style={styles.themeInfo}>
                            {isDark ? (
                                <Moon color={colors.warning} size={22} />
                            ) : (
                                <Sun color={colors.warning} size={22} />
                            )}
                            <Text style={[styles.themeLabel, { color: textColor }]}>
                                {isDark ? 'Modo Escuro' : 'Modo Claro'}
                            </Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#D1D5DB', true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>

                    {/* Version */}
                    <Text style={[styles.version, { color: mutedColor }]}>Versão 1.2.0</Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row'
    },
    overlayTouch: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    drawer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        ...shadows.lg
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        marginBottom: spacing.md,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md
    },
    avatarText: {
        color: colors.white,
        fontSize: fontSize.xl,
        fontWeight: 'bold'
    },
    userTextContainer: {
        flex: 1
    },
    userName: {
        fontSize: fontSize.lg,
        fontWeight: 'bold'
    },
    userEmail: {
        fontSize: fontSize.sm,
        marginTop: 2
    },
    closeButton: {
        padding: spacing.sm
    },
    menuSection: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
    },
    menuItemIcon: {
        marginRight: spacing.md,
        width: 32,
        alignItems: 'center',
    },
    menuItemLabel: {
        fontSize: fontSize.md,
        fontWeight: '500'
    },
    themeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: spacing.md,
        marginTop: spacing.lg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
    },
    themeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md
    },
    themeLabel: {
        fontSize: fontSize.md,
        fontWeight: '500'
    },
    version: {
        textAlign: 'center',
        fontSize: fontSize.sm,
        marginTop: 'auto',
        paddingBottom: spacing.xl
    },
});
