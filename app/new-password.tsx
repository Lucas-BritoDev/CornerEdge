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
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

// NOTE: This screen would typically be reached via a deep link from an email.
// For this demo, we assume the user has arrived here with a valid token.
export default function NewPasswordScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Atenção', 'Preencha todos os campos.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Senha Curta', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Sucesso', 'Sua senha foi redefinida!', [
                { text: 'OK', onPress: () => router.replace('/login') }
            ]);
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, '#0891B2']}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.card, { marginTop: insets.top + spacing.lg }]}>
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Lock color={colors.primary} size={32} />
                        </View>
                        <Text style={styles.title}>Nova Senha</Text>
                        <Text style={styles.subtitle}>
                            Crie uma nova senha segura para sua conta.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nova Senha</Text>
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
                            <Text style={styles.label}>Confirmar Nova Senha</Text>
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
                            onPress={handleResetPassword}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Salvando...' : 'REDEFINIR SENHA'}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
});
