/**
 * GoalEdge Design System
 *
 * Statistical Football Betting Analysis App
 * Version 1.0 - May 2026
 *
 * WCAG 2.1 AA Compliance
 */

export const colors = {
    backgroundPrimary: '#F0F4FF',
    backgroundSecondary: '#FFFFFF',
    backgroundTertiary: '#1A1A2E',
    
    textPrimary: '#1A1A2E',
    textSecondary: '#4A5568',
    textMuted: '#718096',
    
    cardBorder: '#D1D9E0',
    accentGold: '#B8922A',
    
    statusGreen: '#00A86B',
    statusRed: '#C0392B',
    statusPending: '#F39C12',
    
    tabBarBackground: '#FFFFFF',
    tabBarActive: '#C9A84C',
};

export const darkColors = {
    backgroundPrimary: '#1A1A2E',
    backgroundSecondary: '#16213E',
    backgroundTertiary: '#0F3460',
    
    textPrimary: '#FFFFFF',
    textSecondary: '#A0AEC0',
    textMuted: '#718096',
    
    cardBorder: '#2D3A5C',
    accentGold: '#C9A84C',
    
    statusGreen: '#00C48C',
    statusRed: '#E74C3C',
    statusPending: '#F39C12',
    
    tabBarBackground: '#0F3460',
    tabBarActive: '#C9A84C',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const fontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 24,
    '3xl': 32,
};

export const shadows = {
    xs: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
};

export const getThemeColors = (isDark: boolean) => ({
    backgroundPrimary: isDark ? darkColors.backgroundPrimary : colors.backgroundPrimary,
    backgroundSecondary: isDark ? darkColors.backgroundSecondary : colors.backgroundSecondary,
    backgroundTertiary: isDark ? darkColors.backgroundTertiary : colors.backgroundTertiary,
    
    textPrimary: isDark ? darkColors.textPrimary : colors.textPrimary,
    textSecondary: isDark ? darkColors.textSecondary : colors.textSecondary,
    textMuted: isDark ? darkColors.textMuted : colors.textMuted,
    
    cardBorder: isDark ? darkColors.cardBorder : colors.cardBorder,
    accentGold: isDark ? darkColors.accentGold : colors.accentGold,
    
    statusGreen: isDark ? darkColors.statusGreen : colors.statusGreen,
    statusRed: isDark ? darkColors.statusRed : colors.statusRed,
    statusPending: isDark ? darkColors.statusPending : colors.statusPending,
    
    tabBarBackground: isDark ? darkColors.tabBarBackground : colors.tabBarBackground,
    tabBarActive: isDark ? darkColors.tabBarActive : colors.tabBarActive,
});