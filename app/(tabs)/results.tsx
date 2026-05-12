import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, TrendingUp, Crown, Zap } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAnalysesByDate } from '../../services/analyses-service';
import { AnalysisWithDetails } from '../../types';
import { AdBanner } from '../../components/AdBanner';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';

type TierFilter = 'all' | 'premium' | 'free';

export default function ResultsScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const { isPremium } = useAuth();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterdayDate = new Date(now.getTime() - 86400000);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const [selectedDate, setSelectedDate] = useState<Date>(now);
    const [expandedPick, setExpandedPick] = useState<string | null>(null);
    const [tierFilter, setTierFilter] = useState<TierFilter>('all');

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const isToday = selectedDateStr === todayStr;
    const isYesterday = selectedDateStr === yesterdayStr;

    // Apenas hoje e ontem disponíveis
    const availableDates = [todayStr, yesterdayStr];

    const {
        data: allPicks = [],
        isLoading: picksLoading,
        refetch: refetchPicks,
    } = useAnalysesByDate(selectedDate);

    const visiblePicks = isPremium ? allPicks : allPicks.filter(p => p.tier === 'free');

    // ── Stats por tier ────────────────────────────────────────────────────
    const calcStats = (picks: AnalysisWithDetails[]) => {
        const settled = picks.filter(p => p.status !== 'pending');
        const won = settled.filter(p => p.status === 'correct').length;
        const lost = settled.filter(p => p.status === 'incorrect').length;
        const total = settled.length;
        const hitRate = total > 0 ? Math.round((won / total) * 100) : null;
        return { won, lost, total, hitRate };
    };

    const premiumPicks = visiblePicks.filter(p => p.tier === 'premium');
    const freePicks    = visiblePicks.filter(p => p.tier === 'free');
    const statsAll     = calcStats(visiblePicks);
    const statsPremium = calcStats(premiumPicks);
    const statsFree    = calcStats(freePicks);

    const filteredPicks =
        tierFilter === 'premium' ? premiumPicks :
        tierFilter === 'free'    ? freePicks    :
        visiblePicks;

    // ── Helpers ───────────────────────────────────────────────────────────
    const formatDate = (date: Date) => {
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const formatKickoffTime = (kickoffAt: string) => {
        const date = new Date(kickoffAt);
        return date.toLocaleTimeString(
            i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR',
            { hour: '2-digit', minute: '2-digit' }
        );
    };

    const getStatusColor = (status: string) => {
        if (status === 'correct') return colors.statusGreen;
        if (status === 'incorrect') return colors.statusRed;
        if (status === 'void') return colors.textMuted;
        return colors.statusPending;
    };

    const getStatusLabel = (status: string) => {
        if (status === 'correct') return t('results.won') || 'GREEN';
        if (status === 'incorrect') return t('results.lost') || 'RED';
        if (status === 'void') return t('results.void') || 'VOID';
        return t('common.pending') || 'PENDING';
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        if (direction === 'prev' && isToday) {
            setSelectedDate(yesterdayDate);
        } else if (direction === 'next' && isYesterday) {
            setSelectedDate(now);
        }
    };

    // ── Bloco de stats reutilizável ───────────────────────────────────────
    const StatsBlock = ({
        label, icon, accentColor, stats,
    }: {
        label: string; icon: React.ReactNode; accentColor: string; stats: ReturnType<typeof calcStats>;
    }) => (
        <View style={[styles.statsBlock, { backgroundColor: colors.backgroundSecondary, borderColor: accentColor + '55' }]}>
            <View style={styles.statsBlockHeader}>
                {icon}
                <Text style={[styles.statsBlockLabel, { color: accentColor }]}>{label}</Text>
            </View>
            <View style={styles.statsBlockRow}>
                <View style={styles.statsBlockItem}>
                    <Text style={[styles.statsBlockValue, {
                        color: stats.hitRate !== null
                            ? (stats.hitRate >= 50 ? colors.statusGreen : colors.statusRed)
                            : colors.textMuted,
                    }]}>
                        {stats.hitRate !== null ? `${stats.hitRate}%` : '—'}
                    </Text>
                    <Text style={[styles.statsBlockSub, { color: colors.textMuted }]}>
                        {i18n.language === 'en' ? 'Hit Rate' : 'Acerto'}
                    </Text>
                </View>
                <View style={[styles.statsBlockDivider, { backgroundColor: colors.cardBorder }]} />
                <View style={styles.statsBlockItem}>
                    <View style={styles.statsWonLost}>
                        <CheckCircle size={13} color={colors.statusGreen} />
                        <Text style={[styles.statsWonLostText, { color: colors.statusGreen }]}>{stats.won}</Text>
                    </View>
                    <View style={styles.statsWonLost}>
                        <XCircle size={13} color={colors.statusRed} />
                        <Text style={[styles.statsWonLostText, { color: colors.statusRed }]}>{stats.lost}</Text>
                    </View>
                    <Text style={[styles.statsBlockSub, { color: colors.textMuted }]}>V / D</Text>
                </View>
                <View style={[styles.statsBlockDivider, { backgroundColor: colors.cardBorder }]} />
                <View style={styles.statsBlockItem}>
                    <Text style={[styles.statsBlockValue, { color: colors.textPrimary }]}>{stats.total}</Text>
                    <Text style={[styles.statsBlockSub, { color: colors.textMuted }]}>
                        {i18n.language === 'en' ? 'Settled' : 'Fechadas'}
                    </Text>
                </View>
            </View>
            {stats.total === 0 && (
                <Text style={[styles.statsBlockEmpty, { color: colors.textMuted }]}>
                    {i18n.language === 'en' ? 'No settled picks yet' : 'Nenhuma análise fechada ainda'}
                </Text>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <Header
                title={t('results.title') || 'Resultados'}
                subtitle={formatDate(selectedDate)}
            />

            <View style={styles.content}>
                {/* Navegação de data — apenas hoje e ontem */}
                <View style={[styles.dateNav, { backgroundColor: colors.backgroundSecondary }]}>
                    <TouchableOpacity
                        onPress={() => navigateDate('prev')}
                        disabled={isYesterday}
                        style={{ opacity: isYesterday ? 0.3 : 1 }}
                    >
                        <ChevronLeft color={colors.accentOrange} size={24} />
                    </TouchableOpacity>
                    <View style={styles.dateButton}>
                        <Calendar color={colors.accentOrange} size={18} />
                        <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                            {formatDate(selectedDate)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigateDate('next')}
                        disabled={isToday}
                        style={{ opacity: isToday ? 0.3 : 1 }}
                    >
                        <ChevronRight color={colors.accentOrange} size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={picksLoading}
                            onRefresh={() => refetchPicks()}
                            tintColor={colors.accentOrange}
                            colors={[colors.accentOrange]}
                        />
                    }
                >
                    {/* ── Stats por tier ── */}
                    {!picksLoading && visiblePicks.length > 0 && (
                        <View style={styles.statsSection}>
                            <StatsBlock
                                label={i18n.language === 'en' ? 'Overall' : 'Geral'}
                                icon={<TrendingUp size={16} color={colors.accentOrange} />}
                                accentColor={colors.accentOrange}
                                stats={statsAll}
                            />
                            {isPremium && (
                                <StatsBlock
                                    label="Premium"
                                    icon={<Crown size={16} color={colors.accentOrange} />}
                                    accentColor={colors.accentOrange}
                                    stats={statsPremium}
                                />
                            )}
                            <StatsBlock
                                label="Free"
                                icon={<Zap size={16} color={colors.statusGreen} />}
                                accentColor={colors.statusGreen}
                                stats={statsFree}
                            />
                        </View>
                    )}

                    {/* ── Filtros ── */}
                    <View style={styles.filterRow}>
                        {(['all', ...(isPremium ? ['premium'] : []), 'free'] as TierFilter[]).map((f) => {
                            const isActive = tierFilter === f;
                            const label =
                                f === 'all'     ? (i18n.language === 'en' ? 'All' : 'Todas') :
                                f === 'premium' ? 'Premium' : 'Free';
                            const accent =
                                f === 'free' ? colors.statusGreen : colors.accentOrange;
                            return (
                                <TouchableOpacity
                                    key={f}
                                    onPress={() => setTierFilter(f)}
                                    style={[
                                        styles.filterBtn,
                                        { borderColor: isActive ? accent : colors.cardBorder },
                                        isActive && { backgroundColor: accent + '22' },
                                    ]}
                                >
                                    <Text style={[styles.filterBtnText, { color: isActive ? accent : colors.textMuted }]}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* ── Lista de análises ── */}
                    <View style={styles.section}>
                        {picksLoading ? (
                            <ActivityIndicator size="large" color={colors.accentOrange} style={{ marginTop: 40 }} />
                        ) : filteredPicks.length === 0 ? (
                            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('results.no_results')}</Text>
                            </View>
                        ) : (
                            filteredPicks.map((pick) => {
                                const isExpanded = expandedPick === pick.id;
                                const statusColor = getStatusColor(pick.status);
                                const isPremiumPick = pick.tier === 'premium';
                                const tierAccent = isPremiumPick ? colors.accentOrange : colors.statusGreen;

                                return (
                                    <TouchableOpacity
                                        key={pick.id}
                                        style={[
                                            styles.resultCard,
                                            {
                                                backgroundColor: colors.backgroundSecondary,
                                                borderColor: isPremiumPick
                                                    ? colors.accentOrange + '55'
                                                    : colors.cardBorder,
                                                borderWidth: isPremiumPick ? 1.5 : 1,
                                            },
                                        ]}
                                        onPress={() => setExpandedPick(isExpanded ? null : pick.id)}
                                        activeOpacity={0.7}
                                    >
                                        {/* Badge de tier */}
                                        <View style={styles.tierRow}>
                                            <View style={[styles.tierBadge, {
                                                backgroundColor: tierAccent + '22',
                                                borderColor: tierAccent,
                                            }]}>
                                                {isPremiumPick
                                                    ? <Crown size={11} color={tierAccent} />
                                                    : <Zap size={11} color={tierAccent} />
                                                }
                                                <Text style={[styles.tierBadgeText, { color: tierAccent }]}>
                                                    {isPremiumPick ? 'PREMIUM' : 'FREE'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.resultHeader}>
                                            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                                <Text style={styles.statusBadgeText}>{getStatusLabel(pick.status)}</Text>
                                            </View>
                                            <Text style={[styles.resultConfidence, { color: isPremiumPick ? colors.accentOrange : colors.textPrimary }]}>
                                                {pick.confidence}%
                                            </Text>
                                        </View>

                                        <View style={styles.teamsRow}>
                                            <View style={styles.teamContainer}>
                                                {pick.home_team_logo && (
                                                    <Image source={{ uri: pick.home_team_logo }} style={styles.teamLogo} />
                                                )}
                                                <Text style={[styles.teamName, { color: colors.textPrimary }]} numberOfLines={1}>
                                                    {pick.home_team}
                                                </Text>
                                            </View>
                                            <Text style={[styles.vsText, { color: colors.textMuted }]}>vs</Text>
                                            <View style={[styles.teamContainer, { justifyContent: 'flex-end' }]}>
                                                {pick.away_team_logo && (
                                                    <Image source={{ uri: pick.away_team_logo }} style={styles.teamLogo} />
                                                )}
                                                <Text style={[styles.teamName, { color: colors.textPrimary, textAlign: 'right' }]} numberOfLines={1}>
                                                    {pick.away_team}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={[styles.resultSubtitle, { color: colors.textMuted }]}>
                                            {pick.league} • {formatKickoffTime(pick.kickoff_at)}
                                        </Text>

                                        <View style={styles.predictionRow}>
                                            <Text style={[styles.predictionLabel, { color: colors.textMuted }]}>
                                                {t('home.strategy')}:
                                            </Text>
                                            <Text style={[styles.predictionValue, { color: colors.accentOrange }]}>
                                                {pick.strategy_type?.toUpperCase()} {pick.avg_prediction}
                                            </Text>
                                        </View>

                                        {isExpanded && (
                                            <View style={[styles.selectionsExpanded, { borderTopColor: colors.cardBorder }]}>
                                                <Text style={[styles.expandedTitle, { color: colors.textPrimary }]}>
                                                    {t('home.prediction_details') || 'Detalhes da Previsão'}
                                                </Text>
                                                <Text style={[styles.expandedText, { color: colors.textSecondary }]}>
                                                    Média prevista: {pick.avg_prediction?.toFixed(1)} escanteios
                                                </Text>
                                                <Text style={[styles.expandedText, { color: colors.textSecondary }]}>
                                                    Intervalo provável: {pick.probable_range_min} - {pick.probable_range_max}
                                                </Text>
                                                {pick.status !== 'pending' && pick.actual_corners !== undefined && (
                                                    <Text style={[styles.expandedText, { color: colors.textSecondary }]}>
                                                        {t('results.actual_corners') || 'Escanteios reais'}: {pick.actual_corners}
                                                    </Text>
                                                )}
                                            </View>
                                        )}

                                        <View style={styles.expandIcon}>
                                            <Text style={{ color: colors.textMuted }}>{isExpanded ? '▲' : '▼'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                </ScrollView>
            </View>

            <View style={[styles.bannerWrapper, { paddingBottom: insets.bottom }]}>
                <AdBanner />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },

    dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginHorizontal: 16, marginTop: 16, borderRadius: 12 },
    dateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
    dateText: { fontSize: 13, fontWeight: '600', textAlign: 'center', textTransform: 'capitalize' },

    statsSection: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
    statsBlock: { borderRadius: 14, borderWidth: 1.5, padding: 14 },
    statsBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    statsBlockLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
    statsBlockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    statsBlockItem: { alignItems: 'center', gap: 4, flex: 1 },
    statsBlockValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    statsBlockSub: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
    statsBlockDivider: { width: 1, height: 36, marginHorizontal: 4 },
    statsWonLost: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statsWonLostText: { fontSize: 15, fontWeight: '700' },
    statsBlockEmpty: { fontSize: 12, textAlign: 'center', marginTop: 6, fontStyle: 'italic' },

    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
    filterBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
    filterBtnText: { fontSize: 13, fontWeight: '700' },

    section: { padding: 16, paddingTop: 12 },
    resultCard: { padding: 16, borderRadius: 14, marginBottom: 12 },
    tierRow: { marginBottom: 8 },
    tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
    tierBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    resultConfidence: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    teamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    teamContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    teamLogo: { width: 20, height: 20, borderRadius: 10 },
    teamName: { fontSize: 13, fontWeight: '600', flex: 1 },
    vsText: { fontSize: 11, fontWeight: 'bold', marginHorizontal: 8 },
    resultSubtitle: { fontSize: 12, marginBottom: 8 },
    predictionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    predictionLabel: { fontSize: 13 },
    predictionValue: { fontSize: 14, fontWeight: '700' },

    selectionsExpanded: { borderTopWidth: 1, paddingTop: 12, marginTop: 12, gap: 4 },
    expandedTitle: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    expandedText: { fontSize: 12 },
    expandIcon: { position: 'absolute', right: 16, bottom: 16 },

    emptyState: { padding: 32, borderRadius: 12, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    bannerWrapper: { alignItems: 'center', width: '100%' },
});
