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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, KeyRound, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPasswordScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = async () => {
        if (!email.trim()) {
            Alert.alert('Ops!', 'Precisamos do seu email para continuar.');
            return;
        }
        setLoading(true);
        const exists = await resetPassword(email.trim());
        setLoading(false);
        if (exists) {
            setSent(true);
        } else {
            Alert.alert('Não encontrado', 'Não encontramos uma conta com este email.');
        }
    };

    if (sent) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[colors.primary, '#0891B2']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.content}>
                    <View style={styles.card}>
                        <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                            <Mail color={colors.primary} size={40} />
                        </View>
                        <Text style={styles.successTitle}>Email Enviado!</Text>
                        <Text style={styles.successText}>
                            Verifique sua caixa de entrada. Enviamos as instruções para você recuperar sua senha.
                        </Text>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.replace('/login')}
                        >
                            <Text style={styles.buttonText}>Voltar ao Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, '#0891B2']}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[styles.card, { marginTop: insets.top + spacing.lg }]}>
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <KeyRound color={colors.primary} size={32} />
                        </View>
                        <Text style={styles.title}>Recuperar Senha</Text>
                        <Text style={styles.subtitle}>
                            Digite seu email e nós ajudaremos você a criar uma nova senha.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Cadastrado</Text>
                            <View style={styles.inputContainer}>
                                <Mail color={colors.textMuted} size={20} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="exemplo@email.com"
                                    placeholderTextColor={colors.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleReset}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Enviando...' : 'ENVIAR INSTRUÇÕES'}
                            </Text>
                            {!loading && <ArrowRight color={colors.white} size={20} />}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backLink}>
                        <Text style={styles.backLinkText}>Voltar para Login</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
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
    title: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.xs },
    subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
    form: { width: '100%', marginBottom: spacing.lg },
    inputGroup: { marginBottom: spacing.lg },
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        ...shadows.md,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },

    backLink: { padding: spacing.sm },
    backLinkText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '600' },

    successTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md, textAlign: 'center' },
    successText: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 24 },
});
