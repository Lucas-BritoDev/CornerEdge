import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    isPremium: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    updateNewPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
    updateProfile: (data: Partial<Profile>) => Promise<void>;
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

    // Derivado: usuário é premium?
    const isPremium =
        profile?.subscription_tier === 'premium' &&
        (profile.subscription_expires_at === null ||
            new Date(profile.subscription_expires_at) > new Date());

    useEffect(() => {
        let cancelled = false;

        const initialize = async () => {
            try {
                console.log('[CornerEdge] Iniciando carregamento de sessão...');
                const { data: { session }, error } = await supabase.auth.getSession();

                if (cancelled) return;

                if (error) {
                    console.error('[CornerEdge] Erro ao carregar sessão:', error);
                    setSession(null);
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                console.log('[CornerEdge] Sessão carregada:', session ? 'autenticado' : 'não autenticado');
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                }
            } catch (err) {
                console.error('[CornerEdge] Erro na inicialização:', err);
                setSession(null);
                setUser(null);
            } finally {
                if (!cancelled) {
                    console.log('[CornerEdge] Inicialização completa, setando isLoading = false');
                    setIsLoading(false);
                }
            }
        };

        initialize();

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

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
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
        try {
            await supabase.auth.signOut();
        } finally {
            // Garante reset de estado mesmo se o listener falhar
            setSession(null);
            setUser(null);
            setProfile(null);
        }
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
                isPremium,
                login,
                signup,
                signOut,
                resetPassword,
                updateNewPassword,
                updateProfile,
                deleteAccount,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
