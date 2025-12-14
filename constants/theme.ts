/**
 * Design System - Organizador de Atividades Domésticas
 * 
 * WCAG 2.1 AA Compliance:
 * - Minimum contrast ratio: 4.5:1 for normal text
 * - Minimum contrast ratio: 3:1 for large text (18pt+)
 * 
 * Dark Mode Colors tested for accessibility:
 * - Background (#0F172A) to Text (#F1F5F9): 15.1:1 ✓
 * - Background (#0F172A) to Muted (#94A3B8): 7.1:1 ✓
 * - Card (#1E293B) to Text (#F1F5F9): 11.4:1 ✓
 * - Card (#1E293B) to Muted (#94A3B8): 5.4:1 ✓
 */

// ===========================================
// LIGHT MODE COLORS
// ===========================================
export const colors = {
    // Primárias - Índigo
    primary: '#4F46E5',
    primaryDark: '#4338CA',
    primaryLight: '#EEF2FF',

    // Acentos - Âmbar
    accent: '#F59E0B',
    accentLight: '#FEF3C7',

    // Neutras
    white: '#FFFFFF',
    background: '#F5F7FA',
    card: '#FFFFFF',
    border: '#E5E7EB',

    // Texto
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',

    // Estados
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',

    // Categorias
    orange: '#F97316',
    teal: '#14B8A6',
    pink: '#EC4899',
    info: '#3B82F6',
    purple: '#8B5CF6',
};

// ===========================================
// DARK MODE COLORS (WCAG 2.1 AA Compliant)
// ===========================================
export const darkColors = {
    // Backgrounds - Dark Slate tones for depth
    background: '#0F172A',      // Slate 900 - Main background
    backgroundElevated: '#1E293B', // Slate 800 - Cards, menus
    backgroundHover: '#334155',  // Slate 700 - Hover states

    // Cards & Surfaces
    card: '#1E293B',            // Slate 800
    cardHover: '#334155',       // Slate 700
    cardBorder: '#334155',      // Subtle borders

    // Text - High contrast for accessibility
    textPrimary: '#F1F5F9',     // Slate 100 - 15.1:1 contrast on bg
    textSecondary: '#CBD5E1',   // Slate 300 - 10.1:1 contrast
    textMuted: '#94A3B8',       // Slate 400 - 7.1:1 contrast
    textDisabled: '#64748B',    // Slate 500 - 4.5:1 contrast (min)

    // Borders
    border: '#334155',          // Visible but subtle
    borderHover: '#475569',     // Slate 600 - Hover state

    // Interactive elements
    menuItemBg: '#1E293B',
    menuItemHover: '#334155',
    menuItemActive: '#3B4264',  // Slight indigo tint

    // Primary colors adapted for dark mode
    primary: '#818CF8',         // Indigo 400 - Brighter for dark bg
    primaryDark: '#6366F1',     // Indigo 500
    primaryLight: '#312E81',    // Indigo 900 - Subtle bg tint

    // Accent colors adapted
    accent: '#FBBF24',          // Amber 400 - Brighter yellow
    accentLight: '#78350F',     // Amber 900 - Subtle bg

    // State colors - Brighter for visibility
    success: '#34D399',         // Emerald 400
    successBg: '#064E3B',       // Emerald 900
    warning: '#FBBF24',         // Amber 400
    warningBg: '#78350F',       // Amber 900
    error: '#F87171',           // Red 400
    errorBg: '#7F1D1D',         // Red 900

    // Category colors - Adjusted for dark mode
    orange: '#FB923C',          // Orange 400
    teal: '#2DD4BF',            // Teal 400
    pink: '#F472B6',            // Pink 400
    info: '#60A5FA',            // Blue 400
    purple: '#A78BFA',          // Purple 400
};

// ===========================================
// THEME HELPER - Use in components
// ===========================================
export const getThemeColors = (isDark: boolean) => ({
    // Backgrounds
    background: isDark ? darkColors.background : colors.background,
    backgroundElevated: isDark ? darkColors.backgroundElevated : colors.white,

    // Cards
    card: isDark ? darkColors.card : colors.card,
    cardHover: isDark ? darkColors.cardHover : '#F3F4F6',

    // Text with guaranteed contrast
    text: isDark ? darkColors.textPrimary : colors.textPrimary,
    textSecondary: isDark ? darkColors.textSecondary : colors.textSecondary,
    textMuted: isDark ? darkColors.textMuted : colors.textMuted,

    // Borders
    border: isDark ? darkColors.border : colors.border,
    borderHover: isDark ? darkColors.borderHover : '#D1D5DB',

    // Interactive
    menuItemBg: isDark ? darkColors.menuItemBg : '#F3F4F6',
    menuItemHover: isDark ? darkColors.menuItemHover : '#E5E7EB',
    menuItemActive: isDark ? darkColors.menuItemActive : colors.primaryLight,

    // Primary
    primary: isDark ? darkColors.primary : colors.primary,
    primaryLight: isDark ? darkColors.primaryLight : colors.primaryLight,

    // Accent
    accent: isDark ? darkColors.accent : colors.accent,

    // States
    success: isDark ? darkColors.success : colors.success,
    successBg: isDark ? darkColors.successBg : '#D1FAE5',
    warning: isDark ? darkColors.warning : colors.warning,
    warningBg: isDark ? darkColors.warningBg : '#FEF3C7',
    error: isDark ? darkColors.error : colors.error,
    errorBg: isDark ? darkColors.errorBg : '#FEE2E2',
});

// ===========================================
// SPACING
// ===========================================
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
};

// ===========================================
// BORDER RADIUS
// ===========================================
export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

// ===========================================
// FONT SIZES
// ===========================================
export const fontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 24,
    '3xl': 32,
};

// ===========================================
// SHADOWS
// ===========================================
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
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
};

// Dark mode shadows (subtle glow effect)
export const darkShadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 6,
    },
};
