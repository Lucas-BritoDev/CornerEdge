import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Crown, Check, CreditCard, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function PremiumScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const { isPremium, profile } = useAuth();
    const [loading, setLoading] = useState(false);

    const formatDate = () => {
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const features = [
        { free: `2 ${t('common.analyses')}/${t('common.day')}`, premium: `${t('premium.all_analyses')}` },
        { free: t('premium.limited_preview'), premium: t('premium.full_access') },
        { free: t('premium.no_notifications'), premium: t('premium.push_notifications') },
        { free: t('premium.basic_stats'), premium: t('premium.full_stats') },
    ];

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            // Simular compra - em produção, chamar Google Play Billing ou Stripe
            Alert.alert(
                'Subscribe',
                `This would open Google Play Billing in production.\n\nPrice: $ 3,00/${t('premium.month')}`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Confirm Purchase', 
                        onPress: () => {
                            Alert.alert('Success', 'Premium activated! (demo only)');
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to process purchase');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            // Em produção, verificar purchases existentes
            Alert.alert('Restore', 'Checking for existing purchases...');
        } catch (error) {
            Alert.alert('Error', 'Failed to restore purchases');
        } finally {
            setLoading(false);
        }
    };

    const openPrivacy = () => {
        Linking.openURL('https://corneredge.app/privacy');
    };

    const openTerms = () => {
        Linking.openURL('https://corneredge.app/terms');
    };

    if (isPremium) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.backgroundTertiary }]}>
                    <Text style={styles.headerTitle}>{t('common.premium')}</Text>
                    <Text style={styles.headerDate}>{formatDate()}</Text>
                </View>

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

                    <View style={[styles.statsCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>{t('premium.your_stats')}</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.statusGreen }]}>72%</Text>
                                <Text style={[styles.statLabel, { color: colors.textMuted }]}>7-Day Hit Rate</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>+24%</Text>
                                <Text style={[styles.statLabel, { color: colors.textMuted }]}>ROI</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <TouchableOpacity 
                            style={[styles.manageButton, { borderColor: colors.cardBorder }]}
                            onPress={() => Alert.alert('Manage', 'Open subscription management')}
                        >
                            <CreditCard color={colors.textPrimary} size={20} />
                            <Text style={[styles.manageButtonText, { color: colors.textPrimary }]}>{t('premium.manage_subscription')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.backgroundTertiary }]}>
                <Text style={styles.headerTitle}>{t('common.premium')}</Text>
                <Text style={styles.headerDate}>{formatDate()}</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
                <View style={[styles.heroCard, { backgroundColor: colors.backgroundSecondary }]}>
                    <Crown color={colors.accentOrange} size={48} />
                    <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{t('premium.unlock_access')}</Text>
                    <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
                        {t('premium.get_picks')}
                    </Text>
                    <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: colors.accentOrange }]}>{t('premium.price')}</Text>
                        <Text style={[styles.pricePeriod, { color: colors.textMuted }]}>/{t('premium.month')}</Text>
                    </View>
                </View>

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
                                <Text style={[styles.tableCell, { color: colors.textSecondary }]}>{feature.premium.split(' (')[0].split(' ').slice(2).join(' ') || feature.premium.split(' (')[0]}</Text>
                                <Text style={[styles.tableCell, { color: colors.textMuted, textAlign: 'center' }]}>{feature.free.includes('No') || feature.free.includes('Limited') || feature.free.includes('2') ? feature.free.split(' ')[0] : '✓'}</Text>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Check color={colors.statusGreen} size={20} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.ctaSection}>
                    <TouchableOpacity 
                        style={[styles.ctaButton, { backgroundColor: colors.accentOrange }]} 
                        onPress={handleSubscribe}
                        disabled={loading}
                    >
                        {loading ? (
                            <RefreshCw color="#FFFFFF" size={20} />
                        ) : (
                        <Text style={styles.ctaButtonText}>{t('premium.subscribe_now')}</Text>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
                        <Text style={[styles.restoreText, { color: colors.textMuted }]}>{t('premium.restore_purchases')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.statsCard, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.statsLabel, { color: colors.textMuted }]}>7-Day Hit Rate</Text>
                    <Text style={[styles.statsValue, { color: colors.statusGreen }]}>72%</Text>
                </View>

                <View style={styles.disclaimerSection}>
                    <AlertTriangle color={colors.textMuted} size={16} />
                    <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
                        {t('premium.gamble_responsibly')}.{'\n'}
                        18+ only. {t('premium.skill_analysis')}.{'\n'}
                        {'\n'}
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
    heroTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 16 },
    heroSubtitle: { fontSize: 14, marginTop: 8 },
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
    tableCellCross: { flex: 1, fontSize: 13 },
    ctaSection: { padding: 16 },
    ctaButton: { padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    ctaButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    restoreButton: { padding: 12, alignItems: 'center' },
    restoreText: { fontSize: 13 },
    statsCard: { margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
    statsLabel: { fontSize: 12 },
    statsValue: { fontSize: 32, fontWeight: 'bold', marginTop: 4 },
    disclaimerSection: { flexDirection: 'row', padding: 16, marginHorizontal: 16, gap: 8 },
    disclaimer: { flex: 1, fontSize: 11, lineHeight: 18 },
    activeCard: { margin: 16, padding: 32, borderRadius: 16, alignItems: 'center' },
    activeTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 16 },
    activeSubtitle: { fontSize: 14, marginTop: 8 },
    statsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
    statsRow: { flexDirection: 'row', gap: 32 },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold' },
    statLabel: { fontSize: 12, marginTop: 4 },
    manageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
    manageButtonText: { fontSize: 15 },
});
