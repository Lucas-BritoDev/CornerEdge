import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { login } = useAuth();
    const { colors, resolvedTheme } = useTheme();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert(t('common.error'), t('auth.login_error_fields'));
            return;
        }
        setLoading(true);
        const result = await login(email.trim().toLowerCase(), password);
        setLoading(false);

        if (!result.success) {
            const msg = result.error?.includes('Invalid login')
                ? t('auth.login_error_invalid')
                : result.error ?? t('auth.login_error_invalid');
            Alert.alert(t('common.error'), msg);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.logo, { color: colors.accentOrange }]}>GoalEdge</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                            {t('app.tagline')}
                        </Text>

                        <View style={styles.form}>
                            <Text style={[styles.label, { color: colors.textPrimary }]}>
                                {t('auth.email')}
                            </Text>
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

                            <Text style={[styles.label, { color: colors.textPrimary }]}>
                                {t('auth.password')}
                            </Text>
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

                            <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                                <Text style={[styles.forgotText, { color: colors.primary }]}>
                                    {t('auth.forgot_password')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading
                                    ? <ActivityIndicator color="#FFFFFF" />
                                    : (
                                        <>
                                            <Text style={styles.buttonText}>{t('auth.login').toUpperCase()}</Text>
                                            <ArrowRight color="#FFFFFF" size={20} />
                                        </>
                                    )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textPrimary }]}>
                            {t('auth.no_account')}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/signup')}>
                            <Text style={[styles.footerLink, { color: colors.primary }]}>
                                {t('auth.create_account')}
                            </Text>
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
    forgotText: { fontSize: 14, fontWeight: '600', marginBottom: 24, textAlign: 'right' },
    button: {
        height: 48, borderRadius: 12, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 },
    footerText: { fontSize: 14 },
    footerLink: { fontSize: 14, fontWeight: 'bold' },
});
