import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Crown, Check, CreditCard, AlertTriangle, TrendingUp, Target, Activity } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useUserStats } from '../../services/analyses-service';
import { supabase } from '../../lib/supabase';
import { Header } from '../../components/Header';

export default function PremiumScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const { isPremium, profile, user, refreshProfile } = useAuth();
    const { data: stats, isLoading: isStatsLoading } = useUserStats();
    const [loading, setLoading] = useState(false);

    const formatDate = () => {
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const features = [
        {
            label: t('premium.all_analyses'),
            free: `2 ${t('common.analyses')}/${t('common.day')}`,
            hasPremium: true,
        },
        {
            label: t('premium.full_access'),
            free: t('premium.limited_preview'),
            hasPremium: true,
        },
        {
            label: t('premium.push_notifications'),
            free: t('premium.no_notifications'),
            hasPremium: true,
        },
        {
            label: t('premium.full_stats'),
            free: t('premium.basic_stats'),
            hasPremium: true,
        },
    ];

    // Simula ativação premium — atualiza subscription_tier no banco
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
                            Alert.alert(t('common.error'), e.message || t('common.generic_error'));
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

    // ── Tela para usuário já premium ──────────────────────────────────────────
    if (isPremium) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                <Header 
                    title="CornerEdge" 
                    subtitle={formatDate()} 
                >
                    <View style={styles.headerStatsRow}>
                        <View style={[styles.headerStatCard, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <TrendingUp size={16} color="#FFF" />
                            <View>
                                <Text style={[styles.headerStatValue, { color: '#FFF' }]}>
                                    {isStatsLoading ? '—' : stats?.totalAnalyses ?? 0}
                                </Text>
                                <Text style={[styles.headerStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('profile.total_analyses')}</Text>
                            </View>
                        </View>

                        <View style={[styles.headerStatCard, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <Target size={16} color="#4ADE80" />
                            <View>
                                <Text style={[styles.headerStatValue, { color: '#4ADE80' }]}>
                                    {isStatsLoading ? '—' : stats?.hitRate7Days != null ? `${stats.hitRate7Days}%` : '—'}
                                </Text>
                                <Text style={[styles.headerStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('results.hit_rate')}</Text>
                            </View>
                        </View>

                        <View style={[styles.headerStatCard, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <Activity size={16} color="#FFF" />
                            <View>
                                <Text style={[styles.headerStatValue, { color: '#FFF' }]}>
                                    {isStatsLoading ? '—' : `${stats?.correct ?? 0}/${stats?.incorrect ?? 0}`}
                                </Text>
                                <Text style={[styles.headerStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('profile.accuracy')}</Text>
                            </View>
                        </View>
                    </View>
                </Header>

                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
                    <View style={[styles.activeCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <Crown color={colors.accentOrange} size={48} />
                        <Text style={[styles.activeTitle, { color: colors.textPrimary }]}>{t('premium.active_plan')}</Text>
                        <Text style={[styles.activeSubtitle, { color: colors.textMuted }]}>
                            {profile?.subscription_expires_at
                                ? `${t('premium.expires')}: ${new Date(profile.subscription_expires_at).toLocaleDateString()}`
                                : t('premium.unlimited_access')
                            }
                        </Text>
                    </View>



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

    // ── Tela para usuário free ────────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <Header 
                title="CornerEdge" 
                subtitle={formatDate()} 
            >
                <View style={styles.headerStatsRow}>
                    <View style={[styles.headerStatCard, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <TrendingUp size={16} color="#FFF" />
                        <View>
                            <Text style={[styles.headerStatValue, { color: '#FFF' }]}>
                                {isStatsLoading ? '—' : stats?.totalAnalyses ?? 0}
                            </Text>
                            <Text style={[styles.headerStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('profile.total_analyses')}</Text>
                        </View>
                    </View>

                    <View style={[styles.headerStatCard, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Target size={16} color="#4ADE80" />
                        <View>
                            <Text style={[styles.headerStatValue, { color: '#4ADE80' }]}>
                                {isStatsLoading ? '—' : stats?.hitRate7Days != null ? `${stats.hitRate7Days}%` : '—'}
                            </Text>
                            <Text style={[styles.headerStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('results.hit_rate')}</Text>
                        </View>
                    </View>

                    <View style={[styles.headerStatCard, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Activity size={16} color="#FFF" />
                        <View>
                            <Text style={[styles.headerStatValue, { color: '#FFF' }]}>
                                {isStatsLoading ? '—' : `${stats?.correct ?? 0}/${stats?.incorrect ?? 0}`}
                            </Text>
                            <Text style={[styles.headerStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('profile.accuracy')}</Text>
                        </View>
                    </View>
                </View>
            </Header>

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

                {/* Feature table */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('premium.subscription_benefits')}</Text>

                    <View style={[styles.featureTable, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <View style={[styles.tableHeader, { borderBottomColor: colors.cardBorder }]}>
                            <Text style={[styles.tableHeaderText, { color: colors.textMuted }]}>{t('premium.feature')}</Text>
                            <Text style={[styles.tableHeaderText, { color: colors.textMuted, textAlign: 'center' }]}>{t('premium.free')}</Text>
                            <Text style={[styles.tableHeaderTextPremium, { color: colors.accentOrange }]}>{t('common.premium')}</Text>
                        </View>
                        {features.map((feature, index) => (
                            <View key={index} style={[styles.tableRow, { borderBottomColor: colors.cardBorder }]}>
                                <Text style={[styles.tableCell, { color: colors.textSecondary }]}>{feature.label}</Text>
                                <Text style={[styles.tableCell, { color: colors.textMuted, textAlign: 'center', fontSize: 11 }]}>{feature.free}</Text>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Check color={colors.statusGreen} size={20} />
                                </View>
                            </View>
                        ))}
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
                            <Text style={styles.ctaButtonText}>{t('premium.subscribe_now')}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
                        <Text style={[styles.restoreText, { color: colors.textMuted }]}>{t('premium.restore_purchases')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimerSection}>
                    <AlertTriangle color={colors.textMuted} size={16} />
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
    header: { paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
    headerDate: { color: '#FFFFFF', fontSize: 14, opacity: 0.8, marginTop: 4, textTransform: 'capitalize' },
    content: { flex: 1, marginTop: -12 },
    heroCard: { margin: 16, padding: 32, borderRadius: 16, alignItems: 'center' },
    heroTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
    heroSubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 16 },
    price: { fontSize: 48, fontWeight: 'bold' },
    pricePeriod: { fontSize: 18, marginLeft: 4 },
    section: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    featureTable: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', padding: 12, borderBottomWidth: 1 },
    tableHeaderText: { flex: 1, fontSize: 12, fontWeight: '600' },
    tableHeaderTextPremium: { flex: 1, fontSize: 12, fontWeight: 'bold', textAlign: 'right' },
    tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, alignItems: 'center' },
    tableCell: { flex: 1, fontSize: 13 },
    ctaSection: { padding: 16 },
    ctaButton: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
    ctaButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    restoreButton: { padding: 12, alignItems: 'center' },
    restoreText: { fontSize: 13 },
    disclaimerSection: { flexDirection: 'row', padding: 16, marginHorizontal: 16, gap: 8 },
    disclaimer: { flex: 1, fontSize: 11, lineHeight: 18 },
    // Premium ativo
    activeCard: { margin: 16, padding: 32, borderRadius: 16, alignItems: 'center' },
    activeTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 16 },
    activeSubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
    headerStatsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 12 },
    headerStatCard: { 
        flex: 1, 
        padding: 10, 
        borderRadius: 16, 
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8
    },
    headerStatValue: { fontSize: 16, fontWeight: '900' },
    headerStatLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
    manageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
    manageButtonText: { fontSize: 15 },
});
