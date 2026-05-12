import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, RefreshCw, Target, Activity } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAnalysesByDate, useUserStats } from '../../services/analyses-service';

import { AdBanner } from '../../components/AdBanner';
import { useAuth } from '../../context/AuthContext';

import { Header } from '../../components/Header';
import { DateNavigator } from '../../components/DateNavigator';

export default function ResultsScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const { isPremium } = useAuth();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [expandedPick, setExpandedPick] = React.useState<string | null>(null);

    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    const { data: allPicks = [], isLoading: analysesLoading, isRefetching, refetch: refetchAnalyses } = useAnalysesByDate(selectedDate);
    const userStatsQuery = useUserStats();
    const stats = userStatsQuery.data;
    const isStatsLoading = userStatsQuery.isLoading;

    // Filtrar picks baseado no plano do usuário
    const picks = isPremium ? allPicks : allPicks.filter(p => p.tier === 'free');

    const totalCorrect = picks.filter(p => p.status === 'correct').length;
    const totalIncorrect = picks.filter(p => p.status === 'incorrect').length;
    const total = picks.filter(p => p.status !== 'pending' && p.status !== 'void').length;
    const hitRate = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

    const formatDate = (date: Date) => {
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const formatKickoffTime = (kickoffAt: string) => {
        const date = new Date(kickoffAt);
        return date.toLocaleTimeString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        if (status === 'correct') return colors.statusGreen;
        if (status === 'incorrect') return colors.statusRed;
        if (status === 'void') return colors.textMuted;
        return colors.statusPending;
    };

    const getStatusLabel = (status: string) => {
        if (status === 'correct') return t('results.won');
        if (status === 'incorrect') return t('results.lost');
        if (status === 'void') return t('results.void');
        return t('common.pending');
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);
        if (direction === 'prev') {
            newDate.setDate(newDate.getDate() - 1);
        } else {
            newDate.setDate(newDate.getDate() + 1);
        }
        
        // Limitar a 7 dias atrás e não permitir datas futuras
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - 7);
        minDate.setHours(0, 0, 0, 0);
        
        if (newDate >= minDate && newDate <= today) {
            setSelectedDate(newDate);
        }
    };

    const isToday = selectedDate.toDateString() === today.toDateString();
    const canGoNext = selectedDate < today;
    const canGoPrev = (() => {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - 7);
        minDate.setHours(0, 0, 0, 0);
        return selectedDate > minDate;
    })();

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <Header 
                title="CornerEdge"
                subtitle={formatDate(selectedDate)}
                rightAction={
                    <TouchableOpacity onPress={() => refetchAnalyses()} disabled={isRefetching} style={styles.refreshBtn}>
                        {isRefetching
                            ? <ActivityIndicator size="small" color="#FFFFFF" />
                            : <RefreshCw size={18} color="#FFFFFF" />
                        }
                    </TouchableOpacity>
                }
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

            <View style={styles.content}>
                <DateNavigator 
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    maxDate={new Date()}
                />

                <ScrollView
                    contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => refetchAnalyses()}
                            tintColor={colors.accentOrange}
                            colors={[colors.accentOrange]}
                        />
                    }
                >
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('results.analyses')}</Text>

                        {analysesLoading ? (
                            <ActivityIndicator size="large" color={colors.accentOrange} style={{ marginTop: 40 }} />
                        ) : picks.length === 0 ? (
                            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('results.no_results')}</Text>
                            </View>
                        ) : (
                            <>
                                {total > 0 && (
                                    <View style={[styles.dailyPerformanceCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                                        <View style={styles.dailyStatMain}>
                                            <Text style={[styles.dailyStatLabel, { color: colors.textMuted }]}>{t('results.hit_rate')}</Text>
                                            <Text style={[styles.dailyStatValue, { color: hitRate >= 50 ? colors.statusGreen : colors.statusRed }]}>
                                                {hitRate}%
                                            </Text>
                                        </View>
                                        
                                        <View style={[styles.dailyDivider, { backgroundColor: colors.cardBorder }]} />
                                        
                                        <View style={styles.dailyStatGrid}>
                                            <View style={styles.dailyStatItem}>
                                                <CheckCircle size={16} color={colors.statusGreen} />
                                                <Text style={[styles.dailyStatNum, { color: colors.textPrimary }]}>{totalCorrect}</Text>
                                                <Text style={[styles.dailyStatSmallLabel, { color: colors.textMuted }]}>{t('results.correct')}</Text>
                                            </View>
                                            <View style={styles.dailyStatItem}>
                                                <XCircle size={16} color={colors.statusRed} />
                                                <Text style={[styles.dailyStatNum, { color: colors.textPrimary }]}>{totalIncorrect}</Text>
                                                <Text style={[styles.dailyStatSmallLabel, { color: colors.textMuted }]}>{t('results.incorrect')}</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {picks.map((pick) => {
                                    const isExpanded = expandedPick === pick.id;
                                    const statusColor = getStatusColor(pick.status);

                                    return (
                                        <TouchableOpacity
                                            key={pick.id}
                                            style={[styles.resultCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
                                            onPress={() => setExpandedPick(isExpanded ? null : pick.id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.resultHeader}>
                                                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                                    <Text style={styles.statusBadgeText}>{getStatusLabel(pick.status)}</Text>
                                                </View>
                                                <View style={styles.tierBadge}>
                                                    <Text style={[styles.tierBadgeText, { color: pick.tier === 'premium' ? colors.accentOrange : colors.statusGreen }]}>
                                                        {pick.tier.toUpperCase()}
                                                    </Text>
                                                </View>
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
                                                <View style={styles.teamContainer}>
                                                    {pick.away_team_logo && (
                                                        <Image source={{ uri: pick.away_team_logo }} style={styles.teamLogo} />
                                                    )}
                                                    <Text style={[styles.teamName, { color: colors.textPrimary }]} numberOfLines={1}>
                                                        {pick.away_team}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.infoRow}>
                                                <Text style={[styles.leagueText, { color: colors.textMuted }]}>
                                                    {pick.league} • {formatKickoffTime(pick.kickoff_at)}
                                                </Text>
                                            </View>

                                            <View style={styles.predictionRow}>
                                                <Text style={[styles.predictionLabel, { color: colors.textMuted }]}>
                                                    {t('home.strategy')}:
                                                </Text>
                                                <Text style={[styles.predictionValue, { color: colors.accentOrange }]}>
                                                    {pick.strategy_type.toUpperCase()} - CONF. {pick.confidence}%
                                                </Text>
                                            </View>

                                            {pick.status !== 'pending' && pick.actual_corners !== undefined && (
                                                <View style={styles.actualRow}>
                                                    <Text style={[styles.actualLabel, { color: colors.textMuted }]}>
                                                        {t('results.actual_corners')}:
                                                    </Text>
                                                    <Text style={[styles.actualValue, { color: colors.textPrimary }]}>
                                                        {pick.actual_corners}
                                                    </Text>
                                                </View>
                                            )}

                                            {isExpanded && (
                                                <View style={[styles.scenariosExpanded, { borderTopColor: colors.cardBorder }]}>
                                                    <Text style={[styles.scenariosTitle, { color: colors.textPrimary }]}>
                                                        {t('home.prediction_details')}
                                                    </Text>
                                                    <Text style={[styles.scenarioText, { color: colors.textSecondary }]}>
                                                        Média prevista: {pick.avg_prediction.toFixed(1)} escanteios
                                                    </Text>
                                                    <Text style={[styles.scenarioText, { color: colors.textSecondary }]}>
                                                        Intervalo provável: {pick.probable_range_min} - {pick.probable_range_max}
                                                    </Text>
                                                </View>
                                            )}

                                            <View style={styles.expandIcon}>
                                                <Text style={{ color: colors.textMuted }}>{isExpanded ? '▲' : '▼'}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </>
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
    header: { paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
    headerDate: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4, textTransform: 'capitalize' },
    refreshBtn: { padding: 6 },
    content: { flex: 1 },
    headerStatsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    headerStatCard: { 
        flex: 1, 
        padding: 12, 
        borderRadius: 20, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerStatValue: { fontSize: 18, fontWeight: '900', marginVertical: 2 },
    headerStatLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    section: { padding: 16, paddingTop: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    dailyPerformanceCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },
    dailyStatMain: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dailyStatLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    dailyStatValue: {
        fontSize: 32,
        fontWeight: '900',
    },
    dailyDivider: {
        width: 1,
        height: '80%',
        marginHorizontal: 20,
    },
    dailyStatGrid: {
        flex: 1.2,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    dailyStatItem: {
        alignItems: 'center',
        gap: 4,
    },
    dailyStatNum: {
        fontSize: 18,
        fontWeight: '800',
    },
    dailyStatSmallLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    resultCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    resultConfidence: { fontSize: 16, fontWeight: 'bold' },
    teamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    teamContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    teamLogo: { width: 20, height: 20, borderRadius: 10 },
    teamName: { fontSize: 13, fontWeight: '600', flex: 1 },
    vsText: { fontSize: 11, fontWeight: 'bold', marginHorizontal: 8 },
    infoRow: { marginBottom: 8 },
    leagueText: { fontSize: 12 },
    predictionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    predictionLabel: { fontSize: 13, marginRight: 6 },
    predictionValue: { fontSize: 15, fontWeight: 'bold' },
    actualRow: { flexDirection: 'row', alignItems: 'center' },
    actualLabel: { fontSize: 13, marginRight: 6 },
    actualValue: { fontSize: 15, fontWeight: 'bold' },
    scenariosExpanded: { borderTopWidth: 1, paddingTop: 12, marginTop: 12 },
    scenariosTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
    scenarioRow: { marginBottom: 4 },
    scenarioText: { fontSize: 12 },
    expandIcon: { position: 'absolute', right: 16, bottom: 16 },
    emptyState: { padding: 32, borderRadius: 12, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    bannerWrapper: { alignItems: 'center', width: '100%' },
    tierBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tierBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});