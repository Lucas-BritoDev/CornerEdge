import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronRight, Lock, Play, Crown, RefreshCw, TrendingUp, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AdBanner } from '../../components/AdBanner';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import { useTodayAnalyses } from '../../services/analyses-service';
import { AnalysisWithDetails } from '../../types';

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useTheme();
    const { isPremium } = useAuth();
    const { t, i18n } = useTranslation();
    
    const { data: analyses = [], isLoading, error, refetch } = useTodayAnalyses();
    
    const [selectedAnalysis, setSelectedAnalysis] = React.useState<AnalysisWithDetails | null>(null);
    const [showDetail, setShowDetail] = React.useState(false);
    const [showRewardedModal, setShowRewardedModal] = React.useState(false);
    const [rewardTargetAnalysis, setRewardTargetAnalysis] = React.useState<AnalysisWithDetails | null>(null);
    const [unlockedAnalyses, setUnlockedAnalyses] = React.useState<Set<string>>(new Set());
    const { loaded: rewardedLoaded, loading: rewardedLoading, showAd, isUnlockedToday } = useRewardedAd();

    const freeAnalyses = analyses.filter(a => a.tier === 'free');
    const premiumAnalyses = analyses.filter(a => a.tier === 'premium');

    const formatTime = () => {
        const now = new Date();
        return now.toLocaleTimeString(i18n.language === 'pt' ? 'pt-BR' : i18n.language === 'es' ? 'es-ES' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatKickoffTime = (kickoffAt: string) => {
        const date = new Date(kickoffAt);
        return date.toLocaleTimeString(i18n.language === 'pt' ? 'pt-BR' : i18n.language === 'es' ? 'es-ES' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStabilityLabel = (stability: string) => {
        if (stability === 'very_stable') return t('home.very_stable');
        if (stability === 'stable') return t('home.stable');
        return t('home.moderate');
    };

    const handleAnalysisPress = (analysis: AnalysisWithDetails) => {
        if (analysis.tier === 'free' || isPremium || unlockedAnalyses.has(analysis.id)) {
            setSelectedAnalysis(analysis);
            setShowDetail(true);
        }
    };

    const handleLockedPress = async (analysis: AnalysisWithDetails) => {
        const alreadyUnlocked = await isUnlockedToday(analysis.id);
        if (alreadyUnlocked) {
            setUnlockedAnalyses(prev => new Set([...prev, analysis.id]));
            setSelectedAnalysis(analysis);
            setShowDetail(true);
            return;
        }
        setRewardTargetAnalysis(analysis);
        setShowRewardedModal(true);
    };

    const handleWatchAd = async () => {
        if (!rewardTargetAnalysis) return;
        setShowRewardedModal(false);
        
        const result = await showAd(rewardTargetAnalysis.id);
        
        if (result.success) {
            setUnlockedAnalyses(prev => new Set([...prev, rewardTargetAnalysis.id]));
            setSelectedAnalysis(rewardTargetAnalysis);
            setShowDetail(true);
            Alert.alert(
                '✅ ' + t('common.success'),
                t('home.unlock_premium'),
                [{ text: 'OK' }]
            );
        } else {
            Alert.alert(
                '⏰ ' + t('common.error'),
                result.error || t('home.watch_ad'),
                [{ text: 'OK' }]
            );
        }
    };

    const onRefresh = async () => {
        await refetch();
    };

    const renderAnalysisCard = (analysis: AnalysisWithDetails, isLocked: boolean = false) => {
        const isUnlocked = unlockedAnalyses.has(analysis.id);
        const effectiveLocked = isLocked && !isUnlocked;
        const isPremiumCard = analysis.tier === 'premium';

        return (
            <TouchableOpacity
                key={analysis.id}
                style={[
                    styles.analysisCard,
                    {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: isPremiumCard ? colors.accentOrange : colors.cardBorder,
                        borderWidth: isPremiumCard ? 1.5 : 1,
                    }
                ]}
                onPress={() => effectiveLocked ? handleLockedPress(analysis) : handleAnalysisPress(analysis)}
                activeOpacity={0.7}
            >
                {/* Badge de tier no topo do card */}
                <View style={[
                    styles.tierBadge,
                    { backgroundColor: isPremiumCard ? colors.accentOrange : colors.backgroundTertiary }
                ]}>
                    {isPremiumCard && <Crown color="#FFF" size={11} />}
                    <Text style={[
                        styles.tierBadgeText,
                        { color: isPremiumCard ? '#FFF' : colors.textMuted }
                    ]}>
                        {isPremiumCard ? t('common.premium').toUpperCase() : t('common.free').toUpperCase()}
                    </Text>
                </View>

                {effectiveLocked ? (
                    <View style={styles.lockedContent}>
                        <Lock color={colors.accentOrange} size={32} />
                        <Text style={[styles.lockedTitle, { color: colors.textPrimary }]}>{t('home.unlock_premium')}</Text>
                        <Text style={[styles.lockedText, { color: colors.textMuted }]}>{t('home.get_premium')}</Text>
                        <View style={styles.lockedActions}>
                            <TouchableOpacity
                                style={[styles.watchAdBtn, { borderColor: colors.accentOrange }]}
                                onPress={() => handleLockedPress(analysis)}
                            >
                                <Play color={colors.accentOrange} size={14} />
                                <Text style={[styles.watchAdText, { color: colors.accentOrange }]}>{t('home.watch_ad')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.premiumBtn, { backgroundColor: colors.accentOrange }]}
                                onPress={() => router.push('/(tabs)/premium')}
                            >
                                <Crown color="#FFF" size={14} />
                                <Text style={styles.premiumBtnText}>{t('common.premium')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        {/* Teams Header */}
                        <View style={styles.teamsHeader}>
                            <View style={styles.teamContainer}>
                                {analysis.home_team_logo && (
                                    <Image source={{ uri: analysis.home_team_logo }} style={styles.teamLogo} />
                                )}
                                <Text style={[styles.teamName, { color: colors.textPrimary }]} numberOfLines={1}>
                                    {analysis.home_team}
                                </Text>
                            </View>
                            <Text style={[styles.vsText, { color: colors.textMuted }]}>VS</Text>
                            <View style={[styles.teamContainer, { justifyContent: 'flex-end' }]}>
                                <Text style={[styles.teamName, { color: colors.textPrimary, textAlign: 'right' }]} numberOfLines={1}>
                                    {analysis.away_team}
                                </Text>
                                {analysis.away_team_logo && (
                                    <Image source={{ uri: analysis.away_team_logo }} style={styles.teamLogo} />
                                )}
                            </View>
                        </View>

                        {/* Match Info */}
                        <View style={styles.matchInfo}>
                            <Text style={[styles.leagueText, { color: colors.textMuted }]}>
                                {analysis.league} • {formatKickoffTime(analysis.kickoff_at)}
                            </Text>
                        </View>

                        {/* Divider com cor do tier */}
                        <View style={[styles.tierDivider, { backgroundColor: isPremiumCard ? colors.accentOrange : colors.cardBorder }]} />

                        {/* Statistical Confidence */}
                        <View style={styles.confidenceSection}>
                            <Text style={[styles.confidenceLabel, { color: colors.textMuted }]}>
                                {t('home.statistical_confidence')}:
                            </Text>
                            <Text style={[styles.confidenceValue, { color: colors.accentOrange }]}>
                                {analysis.confidence}%
                            </Text>
                        </View>

                        {/* Average Prediction */}
                        <View style={styles.predictionSection}>
                            <Text style={[styles.predictionLabel, { color: colors.textMuted }]}>
                                {t('home.average_prediction')}:
                            </Text>
                            <Text style={[styles.predictionValue, { color: colors.textPrimary }]}>
                                {analysis.avg_prediction} {t('home.corners')}
                            </Text>
                        </View>

                        {/* Probable Range */}
                        <View style={styles.rangeSection}>
                            <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>
                                {t('home.probable_range')}:
                            </Text>
                            <Text style={[styles.rangeValue, { color: colors.textPrimary }]}>
                                {analysis.probable_range_min}–{analysis.probable_range_max}
                            </Text>
                        </View>

                        {/* Robust Scenarios */}
                        {analysis.robust_scenarios && analysis.robust_scenarios.length > 0 && (
                            <View style={styles.scenariosSection}>
                                <Text style={[styles.scenariosLabel, { color: colors.textMuted }]}>
                                    {t('home.robust_scenarios')}:
                                </Text>
                                {analysis.robust_scenarios.map((scenario) => (
                                    <Text key={scenario.id} style={[styles.scenarioText, { color: colors.textSecondary }]}>
                                        {scenario.threshold}+ → {getStabilityLabel(scenario.stability)}
                                    </Text>
                                ))}
                            </View>
                        )}

                        {/* View Full Analysis Button */}
                        <TouchableOpacity
                            style={[
                                styles.viewAnalysisBtn,
                                { backgroundColor: isPremiumCard ? colors.accentOrange : colors.backgroundTertiary }
                            ]}
                            onPress={() => handleAnalysisPress(analysis)}
                        >
                            <Text style={[
                                styles.viewAnalysisBtnText,
                                { color: isPremiumCard ? '#FFF' : colors.textMuted }
                            ]}>
                                {t('home.view_full_analysis')}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.backgroundTertiary }]}>
                <View style={styles.headerTop}>
                    <Text style={styles.logoText}>{t('app.name')}</Text>
                    <TouchableOpacity style={styles.notificationBtn}>
                        <Bell color={colors.white} size={24} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>
                    {t('home.analyses_today')}
                </Text>
                <Text style={styles.headerInfo}>
                    {analyses.length} {t('home.matches_selected')} • {t('home.updated_at')} {formatTime()}
                </Text>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.accentOrange} />}
            >
                {isLoading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator size="large" color={colors.accentOrange} />
                        <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t('common.loading')}</Text>
                    </View>
                ) : (
                    <>
                        {/* Free Analyses */}
                        {freeAnalyses.length > 0 && (
                            <View style={styles.section}>
                                {freeAnalyses.map((analysis) => renderAnalysisCard(analysis))}
                            </View>
                        )}

                        {/* Premium Analyses */}
                        {premiumAnalyses.length > 0 && (
                            <View style={styles.section}>
                                {isPremium ? (
                                    premiumAnalyses.map((analysis) => renderAnalysisCard(analysis))
                                ) : (
                                    renderAnalysisCard(premiumAnalyses[0], true)
                                )}
                            </View>
                        )}

                        {/* Empty State */}
                        {analyses.length === 0 && (
                            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
                                <BarChart3 color={colors.textMuted} size={48} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {t('home.no_analyses')}
                                </Text>
                                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                                    {t('home.check_back')}
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Ad Banner */}
            <View style={[styles.bannerWrapper, { paddingBottom: insets.bottom }]}>
                <AdBanner />
            </View>

            {/* Rewarded Ad Modal */}
            <Modal visible={showRewardedModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.rewardedModal, { backgroundColor: colors.backgroundPrimary }]}>
                        <Lock color={colors.accentOrange} size={36} style={{ marginBottom: 12 }} />
                        <Text style={[styles.rewardedTitle, { color: colors.textPrimary }]}>
                            {t('home.unlock_premium')}
                        </Text>
                        <Text style={[styles.rewardedSubtitle, { color: colors.textMuted }]}>
                            {t('home.get_premium')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.rewardedBtn, { backgroundColor: colors.accentOrange }]}
                            onPress={handleWatchAd}
                            disabled={rewardedLoading}
                        >
                            {rewardedLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Play color="#FFF" size={18} />
                                    <Text style={styles.rewardedBtnText}>{t('home.watch_ad')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.rewardedBtnOutline, { borderColor: colors.accentOrange }]}
                            onPress={() => { setShowRewardedModal(false); router.push('/premium'); }}
                        >
                            <Crown color={colors.accentOrange} size={18} />
                            <Text style={[styles.rewardedBtnOutlineText, { color: colors.accentOrange }]}>
                                {t('premium.subscribe')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowRewardedModal(false)} style={styles.rewardedCancel}>
                            <Text style={[styles.rewardedCancelText, { color: colors.textMuted }]}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Detail Modal */}
            <Modal visible={showDetail} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.backgroundPrimary }]}>
                        <View style={[styles.modalHeader, { backgroundColor: colors.backgroundTertiary }]}>
                            <Text style={styles.modalTitle}>{t('home.full_analysis')}</Text>
                            <TouchableOpacity onPress={() => setShowDetail(false)}>
                                <Text style={[styles.modalClose, { color: colors.white }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        {selectedAnalysis && (
                            <ScrollView style={styles.modalBody}>
                                {/* Statistical Summary */}
                                <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.summaryTitle, { color: colors.textMuted }]}>
                                        {t('home.statistical_summary')}
                                    </Text>
                                    <Text style={[styles.summaryValue, { color: colors.accentOrange }]}>
                                        {selectedAnalysis.avg_prediction}
                                    </Text>
                                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                                        {t('home.average_prediction')}
                                    </Text>
                                    <Text style={[styles.summaryRange, { color: colors.textPrimary }]}>
                                        {t('home.main_range')}: {selectedAnalysis.probable_range_min}–{selectedAnalysis.probable_range_max}
                                    </Text>
                                    <Text style={[styles.summaryConfidence, { color: colors.textMuted }]}>
                                        {t('home.confidence_level')}: {t('home.high_confidence')} ({selectedAnalysis.confidence}%)
                                    </Text>
                                </View>

                                {/* Statistical Distribution */}
                                {selectedAnalysis.statistical_distribution && selectedAnalysis.statistical_distribution.length > 0 && (
                                    <View style={[styles.distributionCard, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.distributionTitle, { color: colors.textPrimary }]}>
                                            {t('home.statistical_distribution')}
                                        </Text>
                                        {selectedAnalysis.statistical_distribution.map((dist) => (
                                            <View key={dist.id} style={styles.distributionRow}>
                                                <Text style={[styles.distributionThreshold, { color: colors.textSecondary }]}>
                                                    {dist.threshold}+
                                                </Text>
                                                <View style={[styles.distributionBar, { backgroundColor: colors.background }]}>
                                                    <View 
                                                        style={[
                                                            styles.distributionBarFill, 
                                                            { backgroundColor: colors.accentOrange, width: `${dist.probability}%` }
                                                        ]} 
                                                    />
                                                </View>
                                                <Text style={[styles.distributionProbability, { color: colors.textPrimary }]}>
                                                    {dist.probability}%
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Team Trends */}
                                {selectedAnalysis.team_statistics && selectedAnalysis.team_statistics.length > 0 && (
                                    <View style={[styles.trendsCard, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.trendsTitle, { color: colors.textPrimary }]}>
                                            {t('home.team_trends')}
                                        </Text>
                                        
                                        {selectedAnalysis.team_statistics.map((stats) => (
                                            <View key={stats.id} style={styles.teamStatsSection}>
                                                <Text style={[styles.teamStatsTitle, { color: colors.accentOrange }]}>
                                                    {stats.team_type === 'home' ? t('home.home_team') : t('home.away_team')}
                                                </Text>
                                                
                                                {stats.team_type === 'home' ? (
                                                    <>
                                                        {stats.offensive_avg && (
                                                            <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                                                {t('home.offensive_average')}: {stats.offensive_avg}
                                                            </Text>
                                                        )}
                                                        {stats.home_intensity && (
                                                            <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                                                {t('home.home_intensity')}: {stats.home_intensity}
                                                            </Text>
                                                        )}
                                                        {stats.consistency && (
                                                            <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                                                {t('home.historical_consistency')}: {stats.consistency}%
                                                            </Text>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {stats.pressure_conceded && (
                                                            <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                                                {t('home.pressure_conceded')}: {stats.pressure_conceded}
                                                            </Text>
                                                        )}
                                                        {stats.corners_conceded_avg && (
                                                            <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                                                {t('home.corners_conceded_avg')}: {stats.corners_conceded_avg}
                                                            </Text>
                                                        )}
                                                        {stats.away_intensity && (
                                                            <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                                                {t('home.away_intensity')}: {stats.away_intensity}
                                                            </Text>
                                                        )}
                                                    </>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    logoText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
    notificationBtn: { padding: 4 },
    headerSubtitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 4 },
    headerInfo: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    content: { flex: 1, marginTop: -12 },
    section: { padding: 16, paddingTop: 24 },
    loadingState: { alignItems: 'center', paddingTop: 80, gap: 12 },
    loadingText: { fontSize: 14 },
    emptyState: { margin: 16, padding: 32, borderRadius: 16, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
    emptySubtext: { fontSize: 14, textAlign: 'center' },
    analysisCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 16, position: 'relative' },
    tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 12 },
    tierBadgeText: { fontSize: 10, fontWeight: 'bold' },
    tierDivider: { height: 1.5, borderRadius: 1, marginBottom: 12 },
    teamsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    teamContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    teamLogo: { width: 32, height: 32, borderRadius: 16 },
    teamName: { fontSize: 15, fontWeight: '600', flex: 1 },
    vsText: { fontSize: 12, fontWeight: 'bold', marginHorizontal: 8 },
    matchInfo: { marginBottom: 16 },
    leagueText: { fontSize: 13 },
    confidenceSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    confidenceLabel: { fontSize: 13, marginRight: 6 },
    confidenceValue: { fontSize: 16, fontWeight: 'bold' },
    predictionSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    predictionLabel: { fontSize: 13, marginRight: 6 },
    predictionValue: { fontSize: 16, fontWeight: 'bold' },
    rangeSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rangeLabel: { fontSize: 13, marginRight: 6 },
    rangeValue: { fontSize: 15, fontWeight: '600' },
    scenariosSection: { marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    scenariosLabel: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
    scenarioText: { fontSize: 13, marginBottom: 4 },
    viewAnalysisBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    viewAnalysisBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    chevron: { position: 'absolute', right: 16, top: '50%' },
    lockedContent: { alignItems: 'center', paddingVertical: 24 },
    lockedTitle: { fontSize: 18, fontWeight: '600', marginTop: 12, marginBottom: 8 },
    lockedText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 8, marginBottom: 16 },
    lockedActions: { flexDirection: 'row', gap: 8 },
    watchAdBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
    watchAdText: { fontSize: 13, fontWeight: '600' },
    premiumBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    premiumBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
    bannerWrapper: { alignItems: 'center', width: '100%' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    rewardedModal: { margin: 24, padding: 28, borderRadius: 20, alignItems: 'center' },
    rewardedTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    rewardedSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    rewardedBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', padding: 14, borderRadius: 12, marginBottom: 12 },
    rewardedBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    rewardedBtnOutline: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
    rewardedBtnOutlineText: { fontSize: 15, fontWeight: '600' },
    rewardedCancel: { padding: 10 },
    rewardedCancelText: { fontSize: 13 },
    modalContent: { flex: 1, marginTop: 'auto', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    modalClose: { fontSize: 24 },
    modalBody: { flex: 1, padding: 16 },
    summaryCard: { padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
    summaryTitle: { fontSize: 12, marginBottom: 8 },
    summaryValue: { fontSize: 48, fontWeight: 'bold', marginBottom: 4 },
    summaryLabel: { fontSize: 14, marginBottom: 12 },
    summaryRange: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    summaryConfidence: { fontSize: 13 },
    distributionCard: { padding: 16, borderRadius: 12, marginBottom: 16 },
    distributionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
    distributionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    distributionThreshold: { width: 40, fontSize: 14, fontWeight: '600' },
    distributionBar: { flex: 1, height: 8, borderRadius: 4, marginHorizontal: 12, overflow: 'hidden' },
    distributionBarFill: { height: '100%', borderRadius: 4 },
    distributionProbability: { width: 50, fontSize: 14, fontWeight: '600', textAlign: 'right' },
    trendsCard: { padding: 16, borderRadius: 12, marginBottom: 16 },
    trendsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
    teamStatsSection: { marginBottom: 16 },
    teamStatsTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
    statText: { fontSize: 13, marginBottom: 4, lineHeight: 18 },
});
