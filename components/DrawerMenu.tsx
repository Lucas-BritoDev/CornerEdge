import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions, Switch, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    X, Home, ClipboardList, Users, Trophy, Settings, Moon, Sun,
    Dices, Zap, AlertTriangle, Gift, Cpu, History
} from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
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
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const { width: screenWidth } = useWindowDimensions();
    const drawerWidth = Math.min(screenWidth * 0.85, 320);

    // WCAG 2.1 AA Compliant Colors
    const themeColors = {
        // Backgrounds
        drawerBg: isDark ? darkColors.background : colors.white,
        menuItemBg: isDark ? darkColors.menuItemBg : '#F3F4F6',
        menuItemHover: isDark ? darkColors.menuItemHover : '#E5E7EB',

        // Text with guaranteed 4.5:1+ contrast
        textPrimary: isDark ? darkColors.textPrimary : colors.textPrimary,    // #F1F5F9 on dark
        textSecondary: isDark ? darkColors.textSecondary : colors.textSecondary, // #CBD5E1 on dark
        textMuted: isDark ? darkColors.textMuted : colors.textMuted,          // #94A3B8 on dark

        // Borders
        border: isDark ? darkColors.border : colors.border,

        // Icons
        iconDefault: isDark ? darkColors.textSecondary : colors.textSecondary,

        // Avatar
        avatarBg: isDark ? darkColors.primary : colors.primary,
        avatarText: colors.white,
    };

    // Icon colors with good visibility on dark backgrounds
    const getIconColor = (itemId: string) => {
        switch (itemId) {
            case 'roulette': return isDark ? '#A78BFA' : colors.purple;
            case 'blitz': return isDark ? '#FBBF24' : colors.warning;
            case 'debt': return isDark ? '#F87171' : colors.error;
            case 'rewards': return isDark ? '#FBBF24' : colors.accent;
            case 'ai-assign': return isDark ? '#34D399' : colors.success;
            case 'ranking': return isDark ? '#FB923C' : colors.orange;
            case 'group': return isDark ? '#2DD4BF' : colors.teal;
            case 'history': return isDark ? '#A78BFA' : colors.purple;
            default: return themeColors.iconDefault;
        }
    };

    const menuItems: MenuItem[] = [
        { id: 'home', label: 'Dashboard', icon: <Home color={themeColors.iconDefault} size={22} />, route: '/' },
        { id: 'tasks', label: 'Tarefas', icon: <ClipboardList color={themeColors.iconDefault} size={22} />, route: '/tasks' },
        { id: 'group', label: 'Minha Casa', icon: <Users color={getIconColor('group')} size={22} />, route: '/group' },
        { id: 'ai-assign', label: 'IA Distribuição', icon: <Cpu color={getIconColor('ai-assign')} size={22} />, route: '/ai-assign', badge: 'IA', badgeColor: isDark ? '#34D399' : colors.success },
        { id: 'roulette', label: 'Roleta', icon: <Dices color={getIconColor('roulette')} size={22} />, route: '/roulette', badge: 'NOVO', badgeColor: isDark ? '#A78BFA' : colors.purple },
        { id: 'blitz', label: 'Modo Blitz', icon: <Zap color={getIconColor('blitz')} size={22} />, route: '/blitz', badge: '2x', badgeColor: isDark ? '#FBBF24' : colors.warning },
        { id: 'debt', label: 'Dívidas', icon: <AlertTriangle color={getIconColor('debt')} size={22} />, route: '/debt' },
        { id: 'rewards', label: 'Recompensas', icon: <Gift color={getIconColor('rewards')} size={22} />, route: '/rewards' },
        { id: 'ranking', label: 'Ranking', icon: <Trophy color={getIconColor('ranking')} size={22} />, route: '/ranking' },
        { id: 'history', label: 'Histórico', icon: <History color={getIconColor('history')} size={22} />, route: '/history' },
        { id: 'settings', label: 'Configurações', icon: <Settings color={themeColors.iconDefault} size={22} />, route: '/settings' },
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
                        backgroundColor: themeColors.drawerBg,
                        paddingTop: insets.top + spacing.md,
                        paddingBottom: insets.bottom + spacing.md,
                        width: drawerWidth
                    }
                ]}>
                    {/* Header - User Profile */}
                    <View style={[styles.drawerHeader, { borderBottomColor: themeColors.border }]}>
                        <View style={styles.userInfo}>
                            <View style={[styles.avatar, { backgroundColor: themeColors.avatarBg }]}>
                                <Text style={[styles.avatarText, { color: themeColors.avatarText }]}>
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                            <View style={styles.userTextContainer}>
                                <Text style={[styles.userName, { color: themeColors.textPrimary }]} numberOfLines={1}>
                                    {user?.name || 'Usuário'}
                                </Text>
                                <Text style={[styles.userEmail, { color: themeColors.textMuted }]} numberOfLines={1}>
                                    {user?.email || 'seu@email.com'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color={themeColors.textMuted} size={24} />
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
                                        backgroundColor: pressed ? themeColors.menuItemHover : themeColors.menuItemBg,
                                        borderColor: themeColors.border
                                    }
                                ]}
                                onPress={() => handleNavigation(item.route)}
                            >
                                <View style={styles.menuItemIcon}>{item.icon}</View>
                                <Text style={[styles.menuItemLabel, { color: themeColors.textPrimary }]} numberOfLines={1}>
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
                    <View style={[styles.themeToggle, { backgroundColor: themeColors.menuItemBg, borderColor: themeColors.border }]}>
                        <View style={styles.themeInfo}>
                            {isDark ? (
                                <Moon color={isDark ? darkColors.primary : colors.primary} size={20} />
                            ) : (
                                <Sun color={colors.warning} size={20} />
                            )}
                            <Text style={[styles.themeLabel, { color: themeColors.textPrimary }]}>
                                {isDark ? 'Modo Escuro' : 'Modo Claro'}
                            </Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{
                                false: '#D1D5DB',
                                true: isDark ? darkColors.primaryLight : colors.primaryLight
                            }}
                            thumbColor={isDark ? darkColors.primary : '#FFFFFF'}
                        />
                    </View>

                    {/* Version */}
                    <Text style={[styles.version, { color: themeColors.textMuted }]}>
                        Organizador de Casa v1.0.0
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
        paddingHorizontal: spacing.lg,
        ...shadows.lg,
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: spacing.sm,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
    },
    userTextContainer: {
        flex: 1,
    },
    userName: {
        fontSize: fontSize.lg,
        fontWeight: '600',
    },
    userEmail: {
        fontSize: fontSize.sm,
        marginTop: 2,
    },
    closeButton: {
        padding: spacing.sm,
    },
    menuScrollView: {
        flex: 1,
    },
    menuSection: {
        gap: spacing.sm,
        paddingBottom: spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
    },
    menuItemIcon: {
        marginRight: spacing.md,
        width: 24,
        alignItems: 'center',
    },
    menuItemLabel: {
        fontSize: fontSize.md,
        fontWeight: '500',
        flex: 1,
    },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        marginLeft: spacing.xs,
    },
    badgeText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    themeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginTop: spacing.sm,
    },
    themeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    themeLabel: {
        fontSize: fontSize.md,
        fontWeight: '500',
    },
    version: {
        textAlign: 'center',
        fontSize: fontSize.xs,
        marginTop: spacing.lg,
    },
});
