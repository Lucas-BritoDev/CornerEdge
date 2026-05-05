import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function NewPasswordScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { updateNewPassword } = useAuth();
    const { colors } = useTheme();
    const { t } = useTranslation();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleUpdate = async () => {
        if (!password || !confirm) {
            Alert.alert(t('common.error'), t('auth.new_password_error_fields'));
            return;
        }
        if (password.length < 6) {
            Alert.alert(t('common.error'), t('auth.signup_error_password_length'));
            return;
        }
        if (password !== confirm) {
            Alert.alert(t('common.error'), t('auth.new_password_error_match'));
            return;
        }

        setLoading(true);
        const result = await updateNewPassword(password);
        setLoading(false);

        if (result.success) {
            setDone(true);
        } else {
            Alert.alert(t('common.error'), result.error ?? t('common.generic_error'));
        }
    };

    if (done) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                        <CheckCircle color={colors.accentGold} size={64} />
                        <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                            {t('auth.new_password_success_title')}
                        </Text>
                        <Text style={[styles.successText, { color: colors.textMuted }]}>
                            {t('auth.new_password_success_body')}
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
                        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.logo, { color: colors.accentGold }]}>GoalEdge</Text>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>
                            {t('auth.new_password_title')}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                            {t('auth.new_password_subtitle')}
                        </Text>

                        <View style={styles.form}>
                            {/* Nova Senha */}
                            <Text style={[styles.label, { color: colors.textPrimary }]}>
                                {t('auth.new_password_label')}
                            </Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                                <Lock color={colors.textMuted} size={20} />
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary }]}
                                    placeholder={t('auth.new_password_placeholder')}
                                    placeholderTextColor={colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff color={colors.textMuted} size={20} /> : <Eye color={colors.textMuted} size={20} />}
                                </TouchableOpacity>
                            </View>

                            {/* Confirmar Senha */}
                            <Text style={[styles.label, { color: colors.textPrimary }]}>
                                {t('auth.confirm_password_label')}
                            </Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                                <Lock color={colors.textMuted} size={20} />
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary }]}
                                    placeholder={t('auth.confirm_password_placeholder')}
                                    placeholderTextColor={colors.textMuted}
                                    value={confirm}
                                    onChangeText={setConfirm}
                                    secureTextEntry={!showConfirm}
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                    {showConfirm ? <EyeOff color={colors.textMuted} size={20} /> : <Eye color={colors.textMuted} size={20} />}
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.hint, { color: colors.textMuted }]}>
                                {t('auth.password_hint')}
                            </Text>

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
                                onPress={handleUpdate}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading
                                    ? <ActivityIndicator color="#FFFFFF" />
                                    : <Text style={styles.buttonText}>{t('auth.new_password_save').toUpperCase()}</Text>}
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
    card: { borderRadius: 24, padding: 24, alignItems: 'center' },
    logo: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    form: { width: '100%' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', height: 48,
        borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16,
    },
    input: { flex: 1, marginLeft: 8, fontSize: 16 },
    hint: { fontSize: 12, marginBottom: 24, marginTop: -8 },
    button: {
        height: 48, borderRadius: 12, alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    successTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 12, textAlign: 'center' },
    successText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
