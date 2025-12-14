import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isOnboarded: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    signup: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<boolean>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    completeOnboarding: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboarded, setIsOnboarded] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const [userData, onboarded] = await Promise.all([
                AsyncStorage.getItem('@user'),
                AsyncStorage.getItem('@onboarded'),
            ]);
            if (userData) {
                setUser(JSON.parse(userData));
            }
            setIsOnboarded(onboarded === 'true');
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            // Simulated login - in real app, call API
            const storedUsers = await AsyncStorage.getItem('@users');
            const users = storedUsers ? JSON.parse(storedUsers) : [];
            const foundUser = users.find((u: any) => u.email === email && u.password === password);

            if (foundUser) {
                const userData = { id: foundUser.id, name: foundUser.name, email: foundUser.email };
                await AsyncStorage.setItem('@user', JSON.stringify(userData));
                setUser(userData);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const signup = async (name: string, email: string, password: string): Promise<boolean> => {
        try {
            const storedUsers = await AsyncStorage.getItem('@users');
            const users = storedUsers ? JSON.parse(storedUsers) : [];

            // Check if email exists
            if (users.some((u: any) => u.email === email)) {
                return false;
            }

            const newUser = {
                id: Date.now().toString(),
                name,
                email,
                password, // In real app, hash this
            };

            users.push(newUser);
            await AsyncStorage.setItem('@users', JSON.stringify(users));

            const userData = { id: newUser.id, name: newUser.name, email: newUser.email };
            await AsyncStorage.setItem('@user', JSON.stringify(userData));
            setUser(userData);
            return true;
        } catch (error) {
            console.error('Signup error:', error);
            return false;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('@user');
        setUser(null);
    };

    const resetPassword = async (email: string): Promise<boolean> => {
        // Simulated - in real app, send email
        const storedUsers = await AsyncStorage.getItem('@users');
        const users = storedUsers ? JSON.parse(storedUsers) : [];
        return users.some((u: any) => u.email === email);
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return;
        const updated = { ...user, ...data };
        await AsyncStorage.setItem('@user', JSON.stringify(updated));
        setUser(updated);
    };

    const completeOnboarding = async () => {
        await AsyncStorage.setItem('@onboarded', 'true');
        setIsOnboarded(true);
    };

    const deleteAccount = async () => {
        if (!user) return;
        const storedUsers = await AsyncStorage.getItem('@users');
        const users = storedUsers ? JSON.parse(storedUsers) : [];
        const filtered = users.filter((u: any) => u.id !== user.id);
        await AsyncStorage.setItem('@users', JSON.stringify(filtered));
        await AsyncStorage.removeItem('@user');
        await AsyncStorage.removeItem('@lists');
        await AsyncStorage.removeItem('@profile');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isOnboarded,
            login,
            signup,
            logout,
            resetPassword,
            updateProfile,
            completeOnboarding,
            deleteAccount,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
