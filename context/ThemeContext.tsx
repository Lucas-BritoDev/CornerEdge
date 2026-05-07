import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
    backgroundPrimary: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    cardBorder: string;
    accentOrange: string;
    statusGreen: string;
    statusRed: string;
    statusPending: string;
    tabBarBackground: string;
    tabBarActive: string;
    white: string;
    black: string;
    primary: string;
    statusBar: string;
    statusBarText: string;
}

interface ThemeContextType {
    theme: ThemeMode;
    resolvedTheme: 'light' | 'dark';
    colors: ThemeColors;
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
}

const lightColors: ThemeColors = {
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
    primary: '#FF6B00',
    statusBar: '#FFFFFF',
    statusBarText: '#FFFFFF',
};

const darkColors: ThemeColors = {
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
    primary: '#FF7A1A',
    statusBar: '#0D0D0D',
    statusBarText: '#FFFFFF',
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
            const stored = await AsyncStorage.getItem('@corneredge_theme');
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
        await AsyncStorage.setItem('@corneredge_theme', newTheme);
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