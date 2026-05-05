import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Mail, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ForgotPasswordScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { resetPassword } = useAuth();
    const { colors } = useTheme();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = async () => {
        if (!email.trim()) {
            Alert.alert(t('common.error'), t('auth.forgot_email_required'));
            return;
        }
        setLoading(true);
        const result = await resetPassword(email.trim().toLowerCase());
        setLoading(false);

        if (result.success) {
            setSent(true);
        } else {
            // Supabase não revela se e-mail existe por segurança – sempre mostramos sucesso
            setSent(true);
        }
    };

    if (sent) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                        <CheckCircle color={colors.accentGold} size={64} />
                        <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                            {t('auth.forgot_sent_title')}
                        </Text>
                        <Text style={[styles.successText, { color: colors.textMuted }]}>
                            {t('auth.forgot_sent_body')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: colors.primary }]}
                            onPress={() => router.replace('/login')}
                        >
                            <Text style={styles.buttonText}>{t('auth.go_to_login')}</Text>
                        </TouchableOpacity>
                    </View>
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
                        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Botão Voltar */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft color={colors.textPrimary} size={24} />
                    </TouchableOpacity>

                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.backgroundTertiary }]}>
                            <KeyRound color={colors.accentGold} size={36} />
                        </View>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>
                            {t('auth.forgot_title')}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                            {t('auth.forgot_subtitle')}
                        </Text>

                        {/* Email */}
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

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
                                onPress={handleReset}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading
                                    ? <ActivityIndicator color="#FFFFFF" />
                                    : <Text style={styles.buttonText}>{t('auth.forgot_send').toUpperCase()}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    backButton: { marginBottom: 24 },
    card: { borderRadius: 24, padding: 24, alignItems: 'center' },
    iconCircle: {
        width: 72, height: 72, borderRadius: 36,
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    form: { width: '100%' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', height: 48,
        borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 24,
    },
    input: { flex: 1, marginLeft: 8, fontSize: 16 },
    button: {
        height: 48, borderRadius: 12, alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    // Sucesso
    successTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 12, textAlign: 'center' },
    successText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
