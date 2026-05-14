import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Crown, Check, CreditCard, AlertTriangle, Zap, Bell, BarChart2, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Header } from '../../components/Header';

const FEATURE_KEYS = [
    { icon: Zap,      labelKey: 'premium.feat_analyses_label', freeKey: 'premium.feat_analyses_free', premiumKey: 'premium.feat_analyses_premium' },
    { icon: Star,     labelKey: 'premium.feat_access_label',   freeKey: 'premium.feat_access_free',   premiumKey: 'premium.feat_access_premium' },
    { icon: BarChart2,labelKey: 'premium.feat_stats_label',    freeKey: 'premium.feat_stats_free',    premiumKey: 'premium.feat_stats_premium' },
    { icon: Bell,     labelKey: 'premium.feat_notif_label',    freeKey: 'premium.feat_notif_free',    premiumKey: 'premium.feat_notif_premium' },
];

export default function PremiumScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const { isPremium, profile, user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    const formatDate = () => {
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const handleSubscribe = async () => {
        Alert.alert(
            t('premium.subscribe_title'),
            t('premium.subscribe_message'),
            [
                { text: t('premium.subscribe_cancel'), style: 'cancel' },
                {
                    text: t('premium.subscribe_confirm'),
                    onPress: async () => {
                        if (!user) return;
                        setLoading(true);
                        try {
                            const { error } = await supabase
                                .from('profiles')
                                .update({ subscription_tier: 'premium' })
                                .eq('id', user.id);
                            if (error) throw error;
                            await refreshProfile();
                            Alert.alert(
                                t('premium.subscribe_success_title'),
                                t('premium.subscribe_success_message')
                            );
                        } catch (e: any) {
                            Alert.alert(t('common.error'), t('common.generic_error'));
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleRestore = async () => {
        Alert.alert(t('premium.restore_title'), t('premium.restore_not_found'));
    };

    const openPrivacy = () => Linking.openURL('https://corneredge.app/privacy');
    const openTerms = () => Linking.openURL('https://corneredge.app/terms');

    // ── Tela para usuário já premium ──────────────────────────────────────
    if (isPremium) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                <Header
                    title={t('premium.title') || 'Premium'}
                    subtitle={formatDate()}
                />

                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
                    {/* Card de status ativo */}
                    <View style={[styles.activeCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.accentOrange }]}>
                        <View style={[styles.activeBadge, { backgroundColor: colors.accentOrange }]}>
                            <Crown color="#FFF" size={14} />
                            <Text style={styles.activeBadgeText}>{t('premium.premium_active').toUpperCase()}</Text>
                        </View>
                        <Crown color={colors.accentOrange} size={48} style={{ marginTop: 8 }} />
                        <Text style={[styles.activeTitle, { color: colors.textPrimary }]}>{t('premium.active_plan')}</Text>
                        <Text style={[styles.activeSubtitle, { color: colors.textMuted }]}>
                            {profile?.subscription_expires_at
                                ? `${t('premium.expires')}: ${new Date(profile.subscription_expires_at).toLocaleDateString()}`
                                : t('premium.unlimited_access')
                            }
                        </Text>
                    </View>

                    {/* Benefícios ativos */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('premium.subscription_benefits')}</Text>
                        {FEATURE_KEYS.map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <View key={i} style={[styles.benefitRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                                    <View style={[styles.benefitIcon, { backgroundColor: colors.accentOrange + '22' }]}>
                                        <Icon color={colors.accentOrange} size={18} />
                                    </View>
                                    <View style={styles.benefitText}>
                                        <Text style={[styles.benefitLabel, { color: colors.textPrimary }]}>{t(f.labelKey)}</Text>
                                        <Text style={[styles.benefitValue, { color: colors.accentOrange }]}>{t(f.premiumKey)}</Text>
                                    </View>
                                    <Check color={colors.statusGreen} size={20} />
                                </View>
                            );
                        })}
                    </View>

                    {/* Gerenciar */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[styles.manageButton, { borderColor: colors.cardBorder }]}
                            onPress={() => Alert.alert(t('premium.manage_title'), t('premium.manage_message'))}
                        >
                            <CreditCard color={colors.textPrimary} size={20} />
                            <Text style={[styles.manageButtonText, { color: colors.textPrimary }]}>{t('premium.manage_subscription')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // ── Tela para usuário free ────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <Header
                title={t('premium.title') || 'Premium'}
                subtitle={formatDate()}
            />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
                {/* Hero */}
                <View style={[styles.heroCard, { backgroundColor: colors.backgroundSecondary }]}>
                    <Crown color={colors.accentOrange} size={48} />
                    <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{t('premium.unlock_access')}</Text>
                    <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
                        {t('premium.get_analyses')}
                    </Text>
                    <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: colors.accentOrange }]}>{t('premium.price')}</Text>
                        <Text style={[styles.pricePeriod, { color: colors.textMuted }]}>/{t('premium.month')}</Text>
                    </View>
                </View>

                {/* Tabela de comparação */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('premium.feature_comparison')}</Text>

                    <View style={[styles.compTable, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        {/* Cabeçalho */}
                        <View style={[styles.compHeader, { borderBottomColor: colors.cardBorder }]}>
                            <Text style={[styles.compHeaderFeature, { color: colors.textMuted }]}>{t('premium.feature')}</Text>
                            <Text style={[styles.compHeaderFree, { color: colors.textMuted }]}>Free</Text>
                            <View style={[styles.compHeaderPremiumBox, { backgroundColor: colors.accentOrange }]}>
                                <Crown color="#FFF" size={12} />
                                <Text style={styles.compHeaderPremiumText}>Premium</Text>
                            </View>
                        </View>

                        {/* Linhas */}
                        {FEATURE_KEYS.map((f, i) => {
                            const Icon = f.icon;
                            const isLast = i === FEATURE_KEYS.length - 1;
                            return (
                                <View
                                    key={i}
                                    style={[
                                        styles.compRow,
                                        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
                                    ]}
                                >
                                    <View style={styles.compFeatureCell}>
                                        <Icon color={colors.textMuted} size={14} />
                                        <Text style={[styles.compFeatureText, { color: colors.textSecondary }]}>{t(f.labelKey)}</Text>
                                    </View>
                                    <Text style={[styles.compFreeText, { color: colors.textMuted }]}>{t(f.freeKey)}</Text>
                                    <Text style={[styles.compPremiumText, { color: colors.accentOrange }]}>{t(f.premiumKey)}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* CTA */}
                <View style={styles.ctaSection}>
                    <TouchableOpacity
                        style={[styles.ctaButton, { backgroundColor: colors.accentOrange }]}
                        onPress={handleSubscribe}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Crown color="#FFF" size={20} />
                                <Text style={styles.ctaButtonText}>{t('premium.subscribe_now')}</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
                        <Text style={[styles.restoreText, { color: colors.textMuted }]}>{t('premium.restore_purchases')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Disclaimer */}
                <View style={[styles.disclaimerSection, { backgroundColor: colors.backgroundSecondary }]}>
                    <AlertTriangle color={colors.textMuted} size={14} />
                    <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
                        {t('premium.gamble_responsibly')}.{'\n'}
                        18+. {t('premium.skill_analysis')}.{'\n\n'}
                        {t('premium.agree_terms')}{' '}
                        <Text style={{ textDecorationLine: 'underline' }} onPress={openTerms}>{t('premium.terms')}</Text>
                        {' '}{t('common.and')}{' '}
                        <Text style={{ textDecorationLine: 'underline' }} onPress={openPrivacy}>{t('premium.privacy')}</Text>.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, marginTop: -12 },

    // Hero
    heroCard: { margin: 16, padding: 28, borderRadius: 20, alignItems: 'center' },
    heroTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
    heroSubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 16 },
    price: { fontSize: 44, fontWeight: 'bold' },
    pricePeriod: { fontSize: 18, marginLeft: 4 },

    // Tabela
    section: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    compTable: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    compHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
    compHeaderFeature: { flex: 2, fontSize: 12, fontWeight: '600' },
    compHeaderFree: { flex: 1.5, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    compHeaderPremiumBox: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
    compHeaderPremiumText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    compRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
    compFeatureCell: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 },
    compFeatureText: { fontSize: 12, flex: 1 },
    compFreeText: { flex: 1.5, fontSize: 11, textAlign: 'center' },
    compPremiumText: { flex: 1.5, fontSize: 11, fontWeight: '600', textAlign: 'center' },

    // CTA
    ctaSection: { padding: 16, gap: 8 },
    ctaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 14, minHeight: 52 },
    ctaButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    restoreButton: { padding: 12, alignItems: 'center' },
    restoreText: { fontSize: 13 },

    // Disclaimer
    disclaimerSection: { flexDirection: 'row', margin: 16, padding: 16, borderRadius: 12, gap: 10, alignItems: 'flex-start' },
    disclaimer: { flex: 1, fontSize: 11, lineHeight: 18 },

    // Premium ativo
    activeCard: { margin: 16, padding: 28, borderRadius: 20, alignItems: 'center', borderWidth: 2 },
    activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    activeBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    activeTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 12 },
    activeSubtitle: { fontSize: 14, marginTop: 6, textAlign: 'center' },

    benefitRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
    benefitIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    benefitText: { flex: 1 },
    benefitLabel: { fontSize: 13, fontWeight: '500' },
    benefitValue: { fontSize: 12, marginTop: 2 },

    manageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
    manageButtonText: { fontSize: 15 },
});
