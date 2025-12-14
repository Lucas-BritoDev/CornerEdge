import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    accentLight: string;
    background: string;
    surface: string;
    white: string;
    black: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    teal: string;
    orange: string;
    pink: string;
}

interface ThemeContextType {
    theme: ThemeMode;
    colors: ThemeColors;
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
}

const lightColors: ThemeColors = {
    primary: '#22C55E',
    primaryLight: '#DCFCE7',
    primaryDark: '#16A34A',
    accent: '#8B5CF6',
    accentLight: '#EDE9FE',
    background: '#F3F4F6',
    surface: '#FFFFFF',
    white: '#FFFFFF',
    black: '#000000',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    teal: '#14B8A6',
    orange: '#F97316',
    pink: '#EC4899',
};

const darkColors: ThemeColors = {
    primary: '#22C55E',
    primaryLight: '#064E3B',
    primaryDark: '#16A34A',
    accent: '#8B5CF6',
    accentLight: '#312E81',
    background: '#111827',
    surface: '#1F2937',
    white: '#FFFFFF',
    black: '#000000',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textMuted: '#6B7280',
    border: '#374151',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    teal: '#14B8A6',
    orange: '#F97316',
    pink: '#EC4899',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('light');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const stored = await AsyncStorage.getItem('@theme');
            if (stored === 'dark' || stored === 'light') {
                setThemeState(stored);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const setTheme = async (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        await AsyncStorage.setItem('@theme', newTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    const colors = theme === 'light' ? lightColors : darkColors;

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
