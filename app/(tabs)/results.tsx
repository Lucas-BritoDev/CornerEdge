import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { mockHistoricalPicks, DailyPick } from '../../data/mockData';
import { AdBanner } from '../../components/AdBanner';

export default function ResultsScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(mockHistoricalPicks[0].date);
    const [showCalendar, setShowCalendar] = useState(false);
    const [expandedPick, setExpandedPick] = useState<string | null>(null);

    const currentData = mockHistoricalPicks.find(h => h.date === selectedDate) || mockHistoricalPicks[0];
    const picks = currentData?.picks || [];

    const totalGreen = picks.filter(p => p.status === 'green').length;
    const totalRed = picks.filter(p => p.status === 'red').length;
    const total = picks.length;
    const hitRate = total > 0 ? Math.round((totalGreen / total) * 100) : 0;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'green': return colors.statusGreen;
            case 'red': return colors.statusRed;
            default: return colors.statusPending;
        }
    };

    const renderPick = ({ item }: { item: DailyPick }) => {
        const isExpanded = expandedPick === item.id;
        const statusColor = getStatusColor(item.status);

        return (
            <TouchableOpacity
                style={[styles.resultCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
                onPress={() => setExpandedPick(isExpanded ? null : item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.resultHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusBadgeText}>{t(`common.${item.status.toLowerCase()}`).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.resultOdd, { color: colors.textPrimary }]}>@{item.combinedOdd.toFixed(2)}</Text>
                </View>

                <Text style={[styles.resultSubtitle, { color: colors.textMuted }]}>
                    {item.selections.length} {t('home.selections')} • {item.confidenceAvg}% {t('home.confidence')}
                </Text>

                {isExpanded && (
                    <View style={[styles.selectionsExpanded, { borderTopColor: colors.cardBorder }]}>
                        {item.selections.map((sel) => (
                            <View key={sel.id} style={styles.selectionRow}>
                                {sel.status === 'green' ? (
                                    <CheckCircle size={16} color={colors.statusGreen} />
                                ) : sel.status === 'red' ? (
                                    <XCircle size={16} color={colors.statusRed} />
                                ) : (
                                    <Clock size={16} color={colors.statusPending} />
                                )}
                                <View style={styles.selectionInfo}>
                                    <Text style={[styles.selectionTeams, { color: colors.textPrimary }]}>
                                        {sel.homeTeam} vs {sel.awayTeam}
                                    </Text>
                                    <Text style={[styles.selectionMarket, { color: colors.textSecondary }]}>
                                        {sel.market}
                                    </Text>
                                </View>
                                <Text style={[styles.selectionOdd, { color: colors.textPrimary }]}>@{sel.odd.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.expandIcon}>
                    <Text style={{ color: colors.textMuted }}>{isExpanded ? '▲' : '▼'}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.backgroundTertiary }]}>
                <Text style={styles.headerTitle}>{t('results.title')}</Text>
                <Text style={styles.headerDate}>{formatDate(new Date().toISOString())}</Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.dateNav, { backgroundColor: colors.backgroundSecondary }]}>
                    <TouchableOpacity 
                        onPress={() => {
                            const idx = mockHistoricalPicks.findIndex(h => h.date === selectedDate);
                            if (idx > 0) setSelectedDate(mockHistoricalPicks[idx - 1].date);
                        }}
                        disabled={selectedDate === mockHistoricalPicks[mockHistoricalPicks.length - 1].date}
                    >
                        <ChevronLeft color={colors.accentGold} size={24} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                        <Calendar color={colors.accentGold} size={20} />
                        <Text style={[styles.dateText, { color: colors.textPrimary }]}>{formatDate(selectedDate)}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => {
                            const idx = mockHistoricalPicks.findIndex(h => h.date === selectedDate);
                            if (idx < mockHistoricalPicks.length - 1) setSelectedDate(mockHistoricalPicks[idx + 1].date);
                        }}
                        disabled={selectedDate === mockHistoricalPicks[0].date}
                    >
                        <ChevronRight color={colors.accentGold} size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.statValue, { color: hitRate >= 50 ? colors.statusGreen : colors.statusRed }]}>{hitRate}%</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('results.hit_rate')}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <View style={styles.statRowInline}>
                            <CheckCircle size={16} color={colors.statusGreen} />
                            <Text style={[styles.statMini, { color: colors.statusGreen }]}>{totalGreen}</Text>
                        </View>
                        <View style={styles.statRowInline}>
                            <XCircle size={16} color={colors.statusRed} />
                            <Text style={[styles.statMini, { color: colors.statusRed }]}>{totalRed}</Text>
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

                <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('results.picks')}</Text>
                        {picks.map((pick) => (
                            <View key={pick.id}>{renderPick({ item: pick })}</View>
                        ))}
                        {picks.length === 0 && (
                            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('results.no_results')}</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>

            {/* Banner AdMob fixo acima da tab bar */}
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
    headerDate: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
    dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginHorizontal: 16, borderRadius: 12 },
    dateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
    dateText: { fontSize: 16, fontWeight: '600' },
    statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
    statCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
    statValue: { fontSize: 28, fontWeight: 'bold' },
    statLabel: { fontSize: 12, marginTop: 4 },
    statRowInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statMini: { fontSize: 14, fontWeight: '600' },
    content: { flex: 1, marginTop: 0 },
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
    selectionTeams: { fontSize: 13, fontWeight: '500' },
    selectionMarket: { fontSize: 12 },
    selectionOdd: { fontSize: 13 },
    expandIcon: { position: 'absolute', right: 16, bottom: 16 },
    emptyState: { padding: 32, borderRadius: 12, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    bannerWrapper: { alignItems: 'center', width: '100%' },
});