import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { DailyPick } from '../../lib/supabase';
import { usePicksByDate, useAvailableDates } from '../../services/picks-service';
import { AdBanner } from '../../components/AdBanner';
import { useAuth } from '../../context/AuthContext';

export default function ResultsScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const { isPremium } = useAuth();

    const [selectedDate, setSelectedDate] = useState('');
    const [expandedPick, setExpandedPick] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const isToday = selectedDate === today;

    // ✅ Usando hooks com cache
    const { data: allAvailableDates = [], isLoading: datesLoading } = useAvailableDates();
    const {
        data: allPicks = [],
        isLoading: picksLoading,
        refetch: refetchPicks,
        isRefetching,
    } = usePicksByDate(selectedDate);

    // Limitar a apenas hoje e ontem
    const availableDates = allAvailableDates.filter(d => d === today || d === yesterday);

    // Filtrar picks baseado no plano do usuário
    const picks = isPremium ? allPicks : allPicks.filter(p => p.tier === 'free');
    const loading = picksLoading || datesLoading;

    // Definir data inicial quando as datas estiverem disponíveis
    useEffect(() => {
        if (availableDates.length > 0 && !selectedDate) {
            const initial = availableDates.find(d => d === today) ?? availableDates[0];
            setSelectedDate(initial);
        }
    }, [availableDates.length, selectedDate]);

    // ✅ Polling automático a cada 3 minutos quando estiver vendo o dia de hoje
    // e ainda houver picks pendentes
    useEffect(() => {
        if (!isToday) return;
        const hasPending = allPicks.some(p => p.status === 'pending');
        if (!hasPending) return;

        const interval = setInterval(() => {
            refetchPicks();
        }, 3 * 60 * 1000); // 3 minutos

        return () => clearInterval(interval);
    }, [isToday, allPicks, refetchPicks]);

    const totalWon = picks.filter(p => p.status === 'won').length;
    const totalLost = picks.filter(p => p.status === 'lost').length;
    const total = picks.filter(p => p.status !== 'pending').length;
    const hitRate = total > 0 ? Math.round((totalWon / total) * 100) : 0;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00');
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const formatKickoffTime = (kickoffAt: string | null) => {
        if (!kickoffAt) return '';
        const date = new Date(kickoffAt);
        return date.toLocaleTimeString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        if (status === 'won') return colors.statusGreen;
        if (status === 'lost') return colors.statusRed;
        if (status === 'void') return colors.textMuted;
        return colors.statusPending;
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const idx = availableDates.indexOf(selectedDate);
        if (direction === 'prev' && idx < availableDates.length - 1) {
            setSelectedDate(availableDates[idx + 1]);
        } else if (direction === 'next' && idx > 0) {
            setSelectedDate(availableDates[idx - 1]);
        }
    };

    const currentIdx = availableDates.indexOf(selectedDate);

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.backgroundTertiary }]}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>{t('results.title')}</Text>
                    {isToday && (
                        <TouchableOpacity onPress={() => refetchPicks()} disabled={isRefetching} style={styles.refreshBtn}>
                            {isRefetching
                                ? <ActivityIndicator size="small" color="#FFFFFF" />
                                : <RefreshCw size={18} color="#FFFFFF" />
                            }
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.headerDate}>{selectedDate ? formatDate(selectedDate) : ''}</Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.dateNav, { backgroundColor: colors.backgroundSecondary }]}>
                    <TouchableOpacity
                        onPress={() => navigateDate('prev')}
                        disabled={currentIdx >= availableDates.length - 1}
                        style={{ opacity: currentIdx >= availableDates.length - 1 ? 0.3 : 1 }}
                    >
                        <ChevronLeft color={colors.accentOrange} size={24} />
                    </TouchableOpacity>

                    <View style={styles.dateButton}>
                        <Calendar color={colors.accentOrange} size={20} />
                        <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                            {selectedDate ? formatDate(selectedDate) : '—'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigateDate('next')}
                        disabled={currentIdx <= 0}
                        style={{ opacity: currentIdx <= 0 ? 0.3 : 1 }}
                    >
                        <ChevronRight color={colors.accentOrange} size={24} />
                    </TouchableOpacity>
                </View>

                {!loading && total > 0 && (
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
                            <Text style={[styles.statValue, { color: hitRate >= 50 ? colors.statusGreen : colors.statusRed }]}>{hitRate}%</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('results.hit_rate')}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={styles.statRowInline}>
                                <CheckCircle size={16} color={colors.statusGreen} />
                                <Text style={[styles.statMini, { color: colors.statusGreen }]}>{totalWon}</Text>
                            </View>
                            <View style={styles.statRowInline}>
                                <XCircle size={16} color={colors.statusRed} />
                                <Text style={[styles.statMini, { color: colors.statusRed }]}>{totalLost}</Text>
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
                            onRefresh={() => refetchPicks()}
                            tintColor={colors.accentOrange}
                            colors={[colors.accentOrange]}
                        />
                    }
                >
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('results.picks')}</Text>

                        {loading ? (
                            <ActivityIndicator size="large" color={colors.accentOrange} style={{ marginTop: 40 }} />
                        ) : picks.length === 0 ? (
                            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('results.no_results')}</Text>
                            </View>
                        ) : (
                            picks.map((pick) => {
                                const isExpanded = expandedPick === pick.id;
                                const statusColor = getStatusColor(pick.status);
                                const selections: any[] = (pick as any).pick_selections ?? [];

                                let statusLabel = '';
                                if (pick.status === 'won') statusLabel = t('common.green');
                                else if (pick.status === 'lost') statusLabel = t('common.red');
                                else if (pick.status === 'void') statusLabel = t('common.void');
                                else statusLabel = t('common.pending');

                                return (
                                    <TouchableOpacity
                                        key={pick.id}
                                        style={[styles.resultCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
                                        onPress={() => setExpandedPick(isExpanded ? null : pick.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.resultHeader}>
                                            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                                <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                                            </View>
                                            <Text style={[styles.resultOdd, { color: colors.textPrimary }]}>@{Number(pick.combined_odds).toFixed(2)}</Text>
                                        </View>
                                        <Text style={[styles.resultSubtitle, { color: colors.textMuted }]}>
                                            {selections.length} {t('home.selections')} • {pick.confidence}% {t('home.confidence')}
                                        </Text>

                                        {isExpanded && (
                                            <View style={[styles.selectionsExpanded, { borderTopColor: colors.cardBorder }]}>
                                                {selections.map((sel: any) => (
                                                    <View key={sel.id} style={styles.selectionRow}>
                                                        {sel.status === 'won' ? (
                                                            <CheckCircle size={16} color={colors.statusGreen} />
                                                        ) : sel.status === 'lost' ? (
                                                            <XCircle size={16} color={colors.statusRed} />
                                                        ) : (
                                                            <Clock size={16} color={colors.statusPending} />
                                                        )}
                                                        <View style={styles.selectionInfo}>
                                                            <View style={styles.teamsWithLogos}>
                                                                {sel.home_team_logo && (
                                                                    <Image source={{ uri: sel.home_team_logo }} style={styles.teamLogoSmall} />
                                                                )}
                                                                <Text style={[styles.selectionTeams, { color: colors.textPrimary }]}>
                                                                    {sel.home_team_name} vs {sel.away_team_name}
                                                                </Text>
                                                                {sel.away_team_logo && (
                                                                    <Image source={{ uri: sel.away_team_logo }} style={styles.teamLogoSmall} />
                                                                )}
                                                            </View>
                                                            <View style={styles.marketKickoffRow}>
                                                                <Text style={[styles.selectionMarket, { color: colors.textSecondary }]}>
                                                                    {sel.market}
                                                                    {sel.score_home != null ? ` • ${sel.score_home}-${sel.score_away}` : ''}
                                                                </Text>
                                                                {sel.kickoff_at && (
                                                                    <Text style={[styles.kickoffTime, { color: colors.textMuted }]}>
                                                                        {formatKickoffTime(sel.kickoff_at)}
                                                                    </Text>
                                                                )}
                                                            </View>
                                                        </View>
                                                        <Text style={[styles.selectionOdd, { color: colors.textPrimary }]}>@{Number(sel.odds).toFixed(2)}</Text>
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
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    resultOdd: { fontSize: 18, fontWeight: 'bold' },
    resultSubtitle: { fontSize: 13 },
    selectionsExpanded: { borderTopWidth: 1, paddingTop: 12, marginTop: 12 },
    selectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    selectionInfo: { flex: 1, marginLeft: 8 },
    teamsWithLogos: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    teamLogoSmall: { width: 16, height: 16, borderRadius: 8 },
    selectionTeams: { fontSize: 13, fontWeight: '500', flex: 1 },
    marketKickoffRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectionMarket: { fontSize: 12 },
    kickoffTime: { fontSize: 11, fontWeight: '500' },
    selectionOdd: { fontSize: 13 },
    expandIcon: { position: 'absolute', right: 16, bottom: 16 },
    emptyState: { padding: 32, borderRadius: 12, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    bannerWrapper: { alignItems: 'center', width: '100%' },
});
