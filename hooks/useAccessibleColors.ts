/**
 * useAccessibleColors Hook
 * 
 * Provides WCAG 2.1 AA compliant colors for all components.
 * Ensures minimum 4.5:1 contrast ratio for normal text.
 * 
 * Usage:
 * const colors = useAccessibleColors();
 * <Text style={{ color: colors.text }}>Hello</Text>
 */

import { useTheme } from '../context/ThemeContext';
import { colors, darkColors } from '../constants/theme';

export interface AccessibleColors {
    // Backgrounds
    background: string;
    backgroundElevated: string;
    card: string;
    cardHover: string;

    // Text (all meet 4.5:1 minimum contrast)
    text: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // Borders
    border: string;
    borderHover: string;

    // Interactive elements
    menuItemBg: string;
    menuItemHover: string;
    inputBg: string;

    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;

    // Accent
    accent: string;
    accentLight: string;

    // States
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    info: string;
    infoBg: string;

    // Category colors
    purple: string;
    orange: string;
    teal: string;
    pink: string;

    // Header specific
    headerBg: string;
    headerText: string;
    headerTextMuted: string;

    // Mode indicator
    isDark: boolean;
}

export function useAccessibleColors(): AccessibleColors {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (isDark) {
        return {
            // Backgrounds - Dark Slate
            background: darkColors.background,           // #0F172A
            backgroundElevated: darkColors.backgroundElevated, // #1E293B
            card: darkColors.card,                       // #1E293B
            cardHover: darkColors.cardHover,             // #334155

            // Text - High contrast for accessibility
            text: darkColors.textPrimary,                // #F1F5F9 - 15.1:1 contrast
            textSecondary: darkColors.textSecondary,     // #CBD5E1 - 10.1:1 contrast
            textMuted: darkColors.textMuted,             // #94A3B8 - 7.1:1 contrast
            textInverse: colors.textPrimary,             // For use on light surfaces

            // Borders
            border: darkColors.border,                   // #334155
            borderHover: darkColors.borderHover,         // #475569

            // Interactive
            menuItemBg: darkColors.menuItemBg,           // #1E293B
            menuItemHover: darkColors.menuItemHover,     // #334155
            inputBg: darkColors.backgroundElevated,      // #1E293B

            // Primary - Adjusted for dark mode
            primary: darkColors.primary,                 // #818CF8 - Brighter indigo
            primaryLight: darkColors.primaryLight,       // #312E81
            primaryDark: darkColors.primaryDark,         // #6366F1

            // Accent
            accent: darkColors.accent,                   // #FBBF24 - Brighter amber
            accentLight: darkColors.accentLight,         // #78350F

            // States - Brighter for visibility
            success: darkColors.success,                 // #34D399
            successBg: darkColors.successBg,             // #064E3B
            warning: darkColors.warning,                 // #FBBF24
            warningBg: darkColors.warningBg,             // #78350F
            error: darkColors.error,                     // #F87171
            errorBg: darkColors.errorBg,                 // #7F1D1D
            info: darkColors.info,                       // #60A5FA
            infoBg: '#1E3A5F',

            // Category colors - Adjusted
            purple: darkColors.purple,                   // #A78BFA
            orange: darkColors.orange,                   // #FB923C
            teal: darkColors.teal,                       // #2DD4BF
            pink: darkColors.pink,                       // #F472B6

            // Header
            headerBg: colors.primary,
            headerText: colors.white,
            headerTextMuted: 'rgba(255,255,255,0.85)',

            isDark: true,
        };
    }

    // Light mode
    return {
        // Backgrounds
        background: colors.background,                   // #F5F7FA
        backgroundElevated: colors.white,                // #FFFFFF
        card: colors.card,                               // #FFFFFF
        cardHover: '#F3F4F6',

        // Text
        text: colors.textPrimary,                        // #1F2937
        textSecondary: colors.textSecondary,             // #4B5563
        textMuted: colors.textMuted,                     // #6B7280
        textInverse: colors.white,

        // Borders
        border: colors.border,                           // #E5E7EB
        borderHover: '#D1D5DB',

        // Interactive
        menuItemBg: '#F3F4F6',
        menuItemHover: '#E5E7EB',
        inputBg: '#F9FAFB',

        // Primary
        primary: colors.primary,                         // #4F46E5
        primaryLight: colors.primaryLight,               // #EEF2FF
        primaryDark: colors.primaryDark,                 // #4338CA

        // Accent
        accent: colors.accent,                           // #F59E0B
        accentLight: colors.accentLight,                 // #FEF3C7

        // States
        success: colors.success,                         // #10B981
        successBg: '#D1FAE5',
        warning: colors.warning,                         // #F59E0B
        warningBg: '#FEF3C7',
        error: colors.error,                             // #EF4444
        errorBg: '#FEE2E2',
        info: colors.info,                               // #3B82F6
        infoBg: '#DBEAFE',

        // Category colors
        purple: colors.purple,                           // #8B5CF6
        orange: colors.orange,                           // #F97316
        teal: colors.teal,                               // #14B8A6
        pink: colors.pink,                               // #EC4899

        // Header
        headerBg: colors.primary,
        headerText: colors.white,
        headerTextMuted: 'rgba(255,255,255,0.8)',

        isDark: false,
    };
}

// Shorthand for common patterns
export function getContrastText(backgroundColor: string): string {
    // Simple luminance check - returns white or dark text
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
}
