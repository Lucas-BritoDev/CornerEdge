import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react-native';

export default function SignupScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { signup } = useAuth();
    const { colors } = useTheme();
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSignup = async () => {
        if (!name.trim() || !email.trim() || !password) {
            Alert.alert(t('common.error'), t('auth.signup_error_fields'));
            return;
        }
        if (password.length < 6) {
            Alert.alert(t('common.error'), t('auth.signup_error_password_length'));
            return;
        }
        setLoading(true);
        const result = await signup(name.trim(), email.trim().toLowerCase(), password);
        setLoading(false);

        if (result.success) {
            // Supabase envia e-mail de confirmação
            setEmailSent(true);
        } else {
            const msg = result.error?.includes('already registered')
                ? t('auth.signup_error_exists')
                : result.error ?? t('auth.signup_error_fields');
            Alert.alert(t('common.error'), msg);
        }
    };

    // Estado de sucesso: e-mail de confirmação enviado
    if (emailSent) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                <View style={[styles.successCard, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 40 }]}>
                    <CheckCircle color={colors.accentOrange} size={64} />
                    <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                        {t('auth.verify_email_title')}
                    </Text>
                    <Text style={[styles.successText, { color: colors.textMuted }]}>
                        {t('auth.verify_email_body')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={() => router.replace('/login')}
                    >
                        <Text style={styles.buttonText}>{t('auth.go_to_login')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.logo, { color: colors.accentOrange }]}>CornerEdge</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('auth.signup')}</Text>

                        <View style={styles.form}>
                            {/* Nome */}
                            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('auth.name')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                                <User color={colors.textMuted} size={20} />
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary }]}
                                    placeholder={t('auth.name')}
                                    placeholderTextColor={colors.textMuted}
                                    value={name}
                                    onChangeText={setName}
                                    editable={!loading}
                                />
                            </View>

                            {/* Email */}
                            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('auth.email')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                                <Mail color={colors.textMuted} size={20} />
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary }]}
                                    placeholder={t('auth.email_placeholder')}
                                    placeholderTextColor={colors.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                />
                            </View>

                            {/* Senha */}
                            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('auth.password')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                                <Lock color={colors.textMuted} size={20} />
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary }]}
                                    placeholder={t('auth.password')}
                                    placeholderTextColor={colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword
                                        ? <EyeOff color={colors.textMuted} size={20} />
                                        : <Eye color={colors.textMuted} size={20} />}
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.hint, { color: colors.textMuted }]}>
                                {t('auth.password_hint')}
                            </Text>

                            {/* Botão Criar Conta */}
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
                                onPress={handleSignup}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading
                                    ? <ActivityIndicator color="#FFFFFF" />
                                    : (
                                        <>
                                            <Text style={styles.buttonText}>{t('auth.signup_button').toUpperCase()}</Text>
                                            <ArrowRight color="#FFFFFF" size={20} />
                                        </>
                                    )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textPrimary }]}>{t('auth.has_account')}</Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text style={[styles.footerLink, { color: colors.primary }]}>{t('auth.enter_now')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
    card: { borderRadius: 24, padding: 24, alignItems: 'center' },
    logo: { fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 14, marginBottom: 24 },
    form: { width: '100%' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', height: 48,
        borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16,
    },
    input: { flex: 1, marginLeft: 8, fontSize: 16 },
    hint: { fontSize: 12, marginBottom: 16, marginTop: -8 },
    button: {
        height: 48, borderRadius: 12, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 },
    footerText: { fontSize: 14 },
    footerLink: { fontSize: 14, fontWeight: 'bold' },
    // Sucesso
    successCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    successTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 24, marginBottom: 12, textAlign: 'center' },
    successText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
