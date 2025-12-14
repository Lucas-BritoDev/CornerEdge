// Design System - Cores e estilos baseados no design de referência

export const colors = {
    // Primárias
    primary: '#1B8B4B',
    primaryDark: '#157A3F',
    primaryLight: '#E8F5E9',

    // Acentos
    accent: '#7C3AED',  // Roxo
    accentLight: '#EDE9FE',

    // Neutras
    white: '#FFFFFF',
    background: '#F5F7FA',
    card: '#FFFFFF',
    border: '#E5E7EB',

    // Texto
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',

    // Estados
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',

    // Outros
    orange: '#F97316',
    teal: '#14B8A6',
    pink: '#EC4899',
    info: '#3B82F6',
    purple: '#8B5CF6',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
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
};
