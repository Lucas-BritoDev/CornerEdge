import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
    backgroundPrimary: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    cardBorder: string;
    accentGold: string;
    statusGreen: string;
    statusRed: string;
    statusPending: string;
    tabBarBackground: string;
    tabBarActive: string;
    white: string;
    primary: string;
    primaryLight: string;
    background: string;
    border: string;
}

interface ThemeContextType {
    theme: ThemeMode;
    resolvedTheme: 'light' | 'dark';
    colors: ThemeColors;
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
}

const lightColors: ThemeColors = {
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
    white: '#FFFFFF',
    primary: '#4F46E5',
    primaryLight: '#EEF2FF',
    background: '#F5F7FA',
    border: '#E5E7EB',
};

const darkColors: ThemeColors = {
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
    white: '#FFFFFF',
    primary: '#818CF8',
    primaryLight: '#312E81',
    background: '#0F172A',
    border: '#334155',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('dark');
    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        loadTheme();
        const listener = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemTheme(colorScheme || 'dark');
        });
        return () => listener.remove();
    }, []);

    const resolvedTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme === 'light' ? 'light' : 'dark';

    const loadTheme = async () => {
        try {
            const stored = await AsyncStorage.getItem('@goaledge_theme');
            if (stored === 'dark' || stored === 'light' || stored === 'system') {
                setThemeState(stored);
            } else {
                const system = Appearance.getColorScheme();
                setSystemTheme(system || 'dark');
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const setTheme = async (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        await AsyncStorage.setItem('@goaledge_theme', newTheme);
    };

    const toggleTheme = () => {
        const themes: ThemeMode[] = ['dark', 'light', 'system'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    const colors = resolvedTheme === 'light' ? lightColors : darkColors;

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, colors, toggleTheme, setTheme }}>
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