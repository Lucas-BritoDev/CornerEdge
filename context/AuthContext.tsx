import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, Profile } from '../lib/supabase';

const ONBOARDING_KEY = '@corneredge:onboarded';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    isOnboarded: boolean;
    isPremium: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    updateNewPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
    updateProfile: (data: Partial<Profile>) => Promise<void>;
    completeOnboarding: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboarded, setIsOnboarded] = useState(false); // false até verificar AsyncStorage

    // Derivado: usuário é premium?
    const isPremium =
        profile?.subscription_tier === 'premium' &&
        (profile.subscription_expires_at === null ||
            new Date(profile.subscription_expires_at) > new Date());

    useEffect(() => {
        // Verifica se o onboarding já foi concluído
        AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
            if (value === 'true') setIsOnboarded(true);
        });

        // Recupera sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => setIsLoading(false));
            } else {
                setIsLoading(false);
            }
        });

        // Escuta mudanças de estado de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }

                if (event === 'SIGNED_OUT') {
                    setProfile(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // Perfil pode não ter sido criado ainda pelo trigger
                if (error.code === 'PGRST116') {
                    console.warn('Profile not found yet, trigger may be pending.');
                } else {
                    console.error('Fetch profile error:', error.message);
                }
                return;
            }
            setProfile(data as Profile);
        } catch (err) {
            console.error('fetchProfile exception:', err);
        }
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    // ─── Login ─────────────────────────────────────────────────────────
    const login = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message ?? 'Erro inesperado.' };
        }
    };

    // ─── Cadastro ───────────────────────────────────────────────────────
    const signup = async (name: string, email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name },
                },
            });
            if (error) return { success: false, error: error.message };
            // O trigger handle_new_user cria o perfil automaticamente
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message ?? 'Erro inesperado.' };
        }
    };

    // ─── Logout ─────────────────────────────────────────────────────────
    const signOut = async () => {
        await supabase.auth.signOut();
    };

    // ─── Recuperação de senha (envia e-mail) ────────────────────────────
    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'corneredge://new-password',
            });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message ?? 'Erro inesperado.' };
        }
    };

    // ─── Define nova senha (após link de recuperação) ───────────────────
    const updateNewPassword = async (newPassword: string) => {
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message ?? 'Erro inesperado.' };
        }
    };

    // ─── Atualiza perfil ────────────────────────────────────────────────
    const updateProfile = async (data: Partial<Profile>) => {
        if (!user) return;
        const { error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', user.id);

        if (!error) {
            setProfile((prev) => (prev ? { ...prev, ...data } : prev));
        }
    };

    // ─── Onboarding ─────────────────────────────────────────────────────
    const completeOnboarding = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        setIsOnboarded(true);
    };

    // ─── Excluir conta ───────────────────────────────────────────────────
    const deleteAccount = async () => {
        if (!user) return;
        // O perfil será deletado em cascade via ON DELETE CASCADE
        // A remoção do auth.user requer service role → usar Edge Function em produção
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                isLoading,
                isOnboarded,
                isPremium,
                login,
                signup,
                signOut,
                resetPassword,
                updateNewPassword,
                updateProfile,
                completeOnboarding,
                deleteAccount,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
