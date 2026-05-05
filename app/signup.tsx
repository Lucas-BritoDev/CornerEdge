import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, User, ArrowRight } from 'lucide-react-native';

export default function SignupScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { signup } = useAuth();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name.trim() || !email.trim() || !password) {
            Alert.alert(t('common.error'), t('auth.signup_error_fields'));
            return;
        }
        setLoading(true);
        const success = await signup(name.trim(), email.trim(), password);
        setLoading(false);
        if (success) {
            router.replace('/');
        } else {
            Alert.alert(t('common.error'), t('auth.signup_error_exists'));
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.logo, { color: colors.accentGold }]}>GoalEdge</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('auth.signup')}</Text>

                        <View style={styles.form}>
                            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('auth.name')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                                <User color={colors.textMuted} size={20} />
                                <TextInput style={[styles.input, { color: colors.textPrimary }]} placeholder={t('auth.name')} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
                            </View>

                            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('auth.email')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                                <Mail color={colors.textMuted} size={20} />
                                <TextInput style={[styles.input, { color: colors.textPrimary }]} placeholder={t('auth.email_placeholder')} placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                            </View>

                            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('auth.password')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                                <Lock color={colors.textMuted} size={20} />
                                <TextInput style={[styles.input, { color: colors.textPrimary }]} placeholder={t('auth.password')} placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
                            </View>

                            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSignup} disabled={loading} activeOpacity={0.8}>
                                <Text style={styles.buttonText}>{loading ? t('common.loading') : t('auth.signup_button').toUpperCase()}</Text>
                                {!loading && <ArrowRight color={colors.white} size={20} />}
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
    inputContainer: { flexDirection: 'row', alignItems: 'center', height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
    input: { flex: 1, marginLeft: 8, fontSize: 16 },
    button: { height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 },
    footerText: { fontSize: 14 },
    footerLink: { fontSize: 14, fontWeight: 'bold' },
});