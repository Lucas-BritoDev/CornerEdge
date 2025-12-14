import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Dimensions,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Home } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Ops!', 'Precisamos do seu email e senha para entrar.');
            return;
        }
        setLoading(true);
        const success = await login(email.trim(), password);
        setLoading(false);
        if (success) {
            router.replace('/');
        } else {
            Alert.alert('Erro no acesso', 'Email ou senha incorretos. Tente novamente.');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, '#0F766E']} // Teal Gradient
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.iconCircle}>
                                <Home color={colors.primary} size={32} />
                            </View>
                            <Text style={styles.title}>Bem-vindo!</Text>
                            <Text style={styles.subtitle}>Organize tarefas domésticas em família.</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <View style={styles.inputContainer}>
                                    <Mail color={colors.textMuted} size={20} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="seu@email.com"
                                        placeholderTextColor={colors.textMuted}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Senha</Text>
                                <View style={styles.inputContainer}>
                                    <Lock color={colors.textMuted} size={20} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Sua senha secreta"
                                        placeholderTextColor={colors.textMuted}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff color={colors.textMuted} size={20} /> : <Eye color={colors.textMuted} size={20} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity onPress={() => router.replace('/forgot-password')} style={styles.forgotButton}>
                                <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'ENTRAR'}</Text>
                                {!loading && <ArrowRight color={colors.white} size={20} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Ainda não tem conta?</Text>
                        <TouchableOpacity onPress={() => router.replace('/signup')} style={styles.footerButton}>
                            <Text style={styles.footerLink}>Crie agora</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 32,
        padding: spacing.xl,
        ...shadows.lg,
        alignItems: 'center',
    },
    header: { alignItems: 'center', marginBottom: spacing.xl },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.xs },
    subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
    form: { width: '100%' },
    inputGroup: { marginBottom: spacing.md },
    label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs, marginLeft: spacing.xs },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        height: 56,
        borderWidth: 1,
        borderColor: colors.border,
    },
    input: { flex: 1, marginLeft: spacing.sm, fontSize: fontSize.md, color: colors.textPrimary },
    forgotButton: { alignSelf: 'flex-end', marginBottom: spacing.lg },
    forgotText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
    button: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        ...shadows.md,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl, gap: spacing.xs },
    footerText: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.md },
    footerButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
    footerLink: { color: colors.white, fontSize: fontSize.md, fontWeight: 'bold' },
});
