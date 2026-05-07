import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAnalysesByDate } from '../../services/analyses-service';
import { AdBanner } from '../../components/AdBanner';
import { useAuth } from '../../context/AuthContext';
import { AnalysisWithDetails } from '../../types';

export default function ResultsScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const { isPremium } = useAuth();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [expandedAnalysis, setExpandedAnalysis] = React.useState<string | null>(null);

    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    const {
        data: allAnalyses = [],
        isLoading: analysesLoading,
        refetch: refetchAnalyses,
        isRefetching,
    } = useAnalysesByDate(selectedDate);

    // Filtrar análises baseado no plano do usuário
    const analyses = isPremium ? allAnalyses : allAnalyses.filter(a => a.tier === 'free');

    const totalCorrect = analyses.filter(a => a.status === 'correct').length;
    const totalIncorrect = analyses.filter(a => a.status === 'incorrect').length;
    const total = analyses.filter(a => a.status !== 'pending').length;
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
        return colors.statusPending;
    };

    const getStatusLabel = (status: string) => {
        if (status === 'correct') return t('results.correct');
        if (status === 'incorrect') return t('results.incorrect');
        return t('common.pending');
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);
        if (direction === 'prev') {
            newDate.setDate(newDate.getDate() - 1);
        } else {
            newDate.setDate(newDate.getDate() + 1);
        }
        
        // Não permitir datas futuras
        if (newDate <= today) {
            setSelectedDate(newDate);
        }
    };

    const isToday = selectedDate.toDateString() === today.toDateString();
    const isFutureDate = selectedDate > today;

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.backgroundTertiary }]}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>{t('results.title')}</Text>
                    {isToday && (
                        <TouchableOpacity onPress={() => refetchAnalyses()} disabled={isRefetching} style={styles.refreshBtn}>
                            {isRefetching
                                ? <ActivityIndicator size="small" color="#FFFFFF" />
                                : <RefreshCw size={18} color="#FFFFFF" />
                            }
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.headerDate}>{formatDate(selectedDate)}</Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.dateNav, { backgroundColor: colors.backgroundSecondary }]}>
                    <TouchableOpacity
                        onPress={() => navigateDate('prev')}
                        style={{ opacity: 1 }}
                    >
                        <ChevronLeft color={colors.accentOrange} size={24} />
                    </TouchableOpacity>

                    <View style={styles.dateButton}>
                        <Calendar color={colors.accentOrange} size={20} />
                        <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                            {formatDate(selectedDate)}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigateDate('next')}
                        disabled={isFutureDate}
                        style={{ opacity: isFutureDate ? 0.3 : 1 }}
                    >
                        <ChevronRight color={colors.accentOrange} size={24} />
                    </TouchableOpacity>
                </View>

                {!analysesLoading && total > 0 && (
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
                            <Text style={[styles.statValue, { color: hitRate >= 50 ? colors.statusGreen : colors.statusRed }]}>{hitRate}%</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('results.hit_rate')}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={styles.statRowInline}>
                                <CheckCircle size={16} color={colors.statusGreen} />
                                <Text style={[styles.statMini, { color: colors.statusGreen }]}>{totalCorrect}</Text>
                            </View>
                            <View style={styles.statRowInline}>
                                <XCircle size={16} color={colors.statusRed} />
                                <Text style={[styles.statMini, { color: colors.statusRed }]}>{totalIncorrect}</Text>
                            </View>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
                            {hitRate >= 50 ? (
                                <TrendingUp size={24} color={colors.statusGreen} />
                            ) : (
                                <TrendingDown size={24} color={colors.statusRed} />
                            )}
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('results.performance')}</Text>
                        </View>
                    </View>
                )}

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
                        ) : analyses.length === 0 ? (
                            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('results.no_results')}</Text>
                            </View>
                        ) : (
                            analyses.map((analysis) => {
                                const isExpanded = expandedAnalysis === analysis.id;
                                const statusColor = getStatusColor(analysis.status);

                                return (
                                    <TouchableOpacity
                                        key={analysis.id}
                                        style={[styles.resultCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
                                        onPress={() => setExpandedAnalysis(isExpanded ? null : analysis.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.resultHeader}>
                                            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                                <Text style={styles.statusBadgeText}>{getStatusLabel(analysis.status)}</Text>
                                            </View>
                                            <Text style={[styles.resultConfidence, { color: colors.textPrimary }]}>
                                                {analysis.confidence}%
                                            </Text>
                                        </View>

                                        <View style={styles.teamsRow}>
                                            <View style={styles.teamContainer}>
                                                {analysis.home_team_logo && (
                                                    <Image source={{ uri: analysis.home_team_logo }} style={styles.teamLogo} />
                                                )}
                                                <Text style={[styles.teamName, { color: colors.textPrimary }]} numberOfLines={1}>
                                                    {analysis.home_team}
                                                </Text>
                                            </View>
                                            <Text style={[styles.vsText, { color: colors.textMuted }]}>vs</Text>
                                            <View style={styles.teamContainer}>
                                                {analysis.away_team_logo && (
                                                    <Image source={{ uri: analysis.away_team_logo }} style={styles.teamLogo} />
                                                )}
                                                <Text style={[styles.teamName, { color: colors.textPrimary }]} numberOfLines={1}>
                                                    {analysis.away_team}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Text style={[styles.leagueText, { color: colors.textMuted }]}>
                                                {analysis.league} • {formatKickoffTime(analysis.kickoff_at)}
                                            </Text>
                                        </View>

                                        <View style={styles.predictionRow}>
                                            <Text style={[styles.predictionLabel, { color: colors.textMuted }]}>
                                                {t('home.average_prediction')}:
                                            </Text>
                                            <Text style={[styles.predictionValue, { color: colors.accentOrange }]}>
                                                {analysis.avg_prediction} {t('home.corners')}
                                            </Text>
                                        </View>

                                        {analysis.actual_corners != null && (
                                            <View style={styles.actualRow}>
                                                <Text style={[styles.actualLabel, { color: colors.textMuted }]}>
                                                    {t('results.actual_corners')}:
                                                </Text>
                                                <Text style={[styles.actualValue, { color: colors.textPrimary }]}>
                                                    {analysis.actual_corners}
                                                </Text>
                                            </View>
                                        )}

                                        {isExpanded && analysis.robust_scenarios && analysis.robust_scenarios.length > 0 && (
                                            <View style={[styles.scenariosExpanded, { borderTopColor: colors.cardBorder }]}>
                                                <Text style={[styles.scenariosTitle, { color: colors.textPrimary }]}>
                                                    {t('home.robust_scenarios')}:
                                                </Text>
                                                {analysis.robust_scenarios.map((scenario) => (
                                                    <View key={scenario.id} style={styles.scenarioRow}>
                                                        <Text style={[styles.scenarioText, { color: colors.textSecondary }]}>
                                                            {scenario.threshold}+ → {scenario.stability} ({scenario.probability}%)
                                                        </Text>
                                                    </View>
                                                ))}
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
    header: { paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
    headerDate: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4, textTransform: 'capitalize' },
    refreshBtn: { padding: 6 },
    dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginHorizontal: 16, marginTop: 16, borderRadius: 12 },
    dateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
    dateText: { fontSize: 14, fontWeight: '600', textAlign: 'center', textTransform: 'capitalize' },
    statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
    statCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 28, fontWeight: 'bold' },
    statLabel: { fontSize: 12, marginTop: 4 },
    statRowInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statMini: { fontSize: 14, fontWeight: '600' },
    content: { flex: 1 },
    section: { padding: 16, paddingTop: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
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
});
