/**
 * CornerEdge Design System
 *
 * Statistical Corner Analysis App
 * Version 1.0 - May 2026
 *
 * Paleta de cores baseada na logomarca CornerEdge
 * Cores principais: Laranja (#FF6B00), Preto (#1A1A1A), Branco (#FFFFFF)
 */

export const colors = {
    backgroundPrimary: '#F5F5F5',
    backgroundSecondary: '#FFFFFF',
    backgroundTertiary: '#1A1A1A',
    background: '#E8E8E8',
    
    textPrimary: '#1A1A1A',
    textSecondary: '#4A4A4A',
    textMuted: '#808080',
    
    cardBorder: '#E0E0E0',
    accentOrange: '#FF6B00',
    
    statusGreen: '#00C853',
    statusRed: '#D32F2F',
    statusPending: '#FF9800',
    
    tabBarBackground: '#FFFFFF',
    tabBarActive: '#FF6B00',
    
    white: '#FFFFFF',
    black: '#1A1A1A',
};

export const darkColors = {
    backgroundPrimary: '#0D0D0D',
    backgroundSecondary: '#1A1A1A',
    backgroundTertiary: '#2A2A2A',
    background: '#151515',
    
    textPrimary: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textMuted: '#999999',
    
    cardBorder: '#333333',
    accentOrange: '#FF7A1A',
    
    statusGreen: '#00E676',
    statusRed: '#FF5252',
    statusPending: '#FFB74D',
    
    tabBarBackground: '#1A1A1A',
    tabBarActive: '#FF7A1A',
    
    white: '#FFFFFF',
    black: '#0D0D0D',
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
    background: isDark ? darkColors.background : colors.background,
    
    textPrimary: isDark ? darkColors.textPrimary : colors.textPrimary,
    textSecondary: isDark ? darkColors.textSecondary : colors.textSecondary,
    textMuted: isDark ? darkColors.textMuted : colors.textMuted,
    
    cardBorder: isDark ? darkColors.cardBorder : colors.cardBorder,
    accentOrange: isDark ? darkColors.accentOrange : colors.accentOrange,
    
    statusGreen: isDark ? darkColors.statusGreen : colors.statusGreen,
    statusRed: isDark ? darkColors.statusRed : colors.statusRed,
    statusPending: isDark ? darkColors.statusPending : colors.statusPending,
    
    tabBarBackground: isDark ? darkColors.tabBarBackground : colors.tabBarBackground,
    tabBarActive: isDark ? darkColors.tabBarActive : colors.tabBarActive,
    
    white: isDark ? darkColors.white : colors.white,
    black: isDark ? darkColors.black : colors.black,
});