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
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignupScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { signup } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Ops!', 'As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Senha Curta', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        setLoading(true);
        const success = await signup(name.trim(), email.trim(), password);
        setLoading(false);
        if (success) {
            router.replace('/');
        } else {
            Alert.alert('Erro', 'Este email já está em uso.');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, '#0891B2']} // Slightly different gradient (Cyan)
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.iconCircle}>
                                <UserPlus color={colors.primary} size={32} />
                            </View>
                            <Text style={styles.title}>Criar Conta</Text>
                            <Text style={styles.subtitle}>Junte-se à sua família e organize tarefas!</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nome</Text>
                                <View style={styles.inputContainer}>
                                    <User color={colors.textMuted} size={20} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Seu nome completo"
                                        placeholderTextColor={colors.textMuted}
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>

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
                                        placeholder="Mínimo 6 caracteres"
                                        placeholderTextColor={colors.textMuted}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ?
                                            <EyeOff color={colors.textMuted} size={20} /> :
                                            <Eye color={colors.textMuted} size={20} />
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirmar Senha</Text>
                                <View style={styles.inputContainer}>
                                    <CheckCircle color={colors.textMuted} size={20} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Repita a senha"
                                        placeholderTextColor={colors.textMuted}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleSignup}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Criando conta...' : 'CADASTRAR'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Já tem uma conta? </Text>
                        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.footerButton}>
                            <Text style={styles.footerLink}>Fazer Login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
    card: {
        backgroundColor: colors.white,
        borderRadius: 32,
        padding: spacing.xl,
        ...shadows.lg,
        alignItems: 'center',
        marginTop: spacing.sm,
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
    button: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        ...shadows.md,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl, gap: spacing.xs },
    footerText: { color: 'rgba(255,255,255,0.9)', fontSize: fontSize.md },
    footerButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
    footerLink: { color: colors.white, fontSize: fontSize.md, fontWeight: 'bold' },
});
