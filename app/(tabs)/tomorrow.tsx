import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Lock, Crown, Info } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { fetchTomorrowFixtures, TomorrowFixture } from '../../services/picks-service';
import { AdBanner } from '../../components/AdBanner';

export default function TomorrowScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const { isPremium } = useAuth();
    const [fixtures, setFixtures] = useState<TomorrowFixture[]>([]);
    const [loading, setLoading] = useState(true);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    useEffect(() => {
        fetchTomorrowFixtures()
            .then(data => setFixtures(data))
            .finally(() => setLoading(false));
    }, []);

    const formatDate = () => {
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return tomorrow.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.backgroundTertiary }]}>
                <Text style={styles.headerTitle}>{t('tomorrow.title')}</Text>
                <Text style={styles.headerDate}>{formatDate()}</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
                <View style={[styles.disclaimer, { backgroundColor: colors.accentOrange }]}>
                    <Clock color="#FFFFFF" size={16} />
                    <Text style={styles.disclaimerText}>{t('tomorrow.disclaimer')}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        {t('common.fixture_preview')} ({fixtures.length})
                    </Text>

                    {loading ? (
                        <ActivityIndicator size="large" color={colors.accentOrange} style={{ marginTop: 40 }} />
                    ) : fixtures.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
                            <Info color={colors.textMuted} size={32} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                Nenhuma partida encontrada para amanhã nas ligas monitoradas.
                            </Text>
                        </View>
                    ) : (
                        fixtures.map((fixture, index) => {
                            const isHighValue = index % 3 === 0;
                            const isLocked = isHighValue && !isPremium;

                            return (
                                <View
                                    key={fixture.id}
                                    style={[styles.matchCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
                                >
                                    <View style={styles.matchHeader}>
                                        <Text style={[styles.matchLeague, { color: colors.textMuted }]}>{fixture.league}</Text>
                                        {isHighValue && isPremium && (
                                            <View style={[styles.premiumBadge, { backgroundColor: colors.accentOrange }]}>
                                                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.matchRow}>
                                        <View style={styles.teamContainer}>
                                            {fixture.homeLogo && (
                                                <Image source={{ uri: fixture.homeLogo }} style={styles.teamLogo} />
                                            )}
                                            <Text style={[styles.teamName, { color: colors.textPrimary }]}>{fixture.homeTeam}</Text>
                                        </View>
                                        <Text style={[styles.vsText, { color: colors.textMuted }]}>vs</Text>
                                        <View style={styles.teamContainer}>
                                            {fixture.awayLogo && (
                                                <Image source={{ uri: fixture.awayLogo }} style={styles.teamLogo} />
                                            )}
                                            <Text style={[styles.teamName, { color: colors.textPrimary }]}>{fixture.awayTeam}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.matchFooter}>
                                        <Text style={[styles.matchTime, { color: colors.textMuted }]}>{formatTime(fixture.kickoffAt)}</Text>
                                        <View style={[styles.marketHint, { backgroundColor: colors.background }]}>
                                            <Info color={colors.textMuted} size={12} />
                                            <Text style={[styles.marketHintText, { color: colors.textMuted }]}>{t('common.analyzing')}</Text>
                                        </View>
                                    </View>

                                    {isLocked && (
                                        <View style={styles.lockedOverlay}>
                                            <Lock color={colors.accentOrange} size={24} />
                                            <Text style={[styles.lockedText, { color: colors.accentOrange }]}>{t('common.premium')}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>

                <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
                    <Info color={colors.textMuted} size={20} />
                    <Text style={[styles.infoText, { color: colors.textMuted }]}>
                        {t('tomorrow.disclaimer')}.{'\n'}
                        {t('home.get_premium')}
                    </Text>
                </View>
            </ScrollView>

            <View style={[styles.bannerWrapper, { paddingBottom: insets.bottom }]}>
                <AdBanner />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
    headerDate: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4, textTransform: 'capitalize' },
    content: { flex: 1, marginTop: -12 },
    disclaimer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, marginHorizontal: 16, borderRadius: 12, marginTop: 16, gap: 8 },
    disclaimerText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
    section: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    emptyState: { padding: 32, borderRadius: 12, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    matchCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, position: 'relative' },
    matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    matchLeague: { fontSize: 12 },
    premiumBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    premiumBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' },
    matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    teamContainer: { flex: 1, alignItems: 'center', gap: 8 },
    teamLogo: { width: 32, height: 32, borderRadius: 16 },
    teamName: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
    vsText: { fontSize: 14, marginHorizontal: 12 },
    matchFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12 },
    matchTime: { fontSize: 13 },
    marketHint: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    marketHintText: { fontSize: 11 },
    lockedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    lockedText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, marginHorizontal: 16, borderRadius: 12, gap: 8, marginTop: 4 },
    infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
    bannerWrapper: { alignItems: 'center', width: '100%' },
});
