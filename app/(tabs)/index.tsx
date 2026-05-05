import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Trophy, Bell, ChevronRight, Lock, CheckCircle, XCircle, Clock, Play, Crown, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { DailyPick } from '../../lib/supabase';
import { fetchTodayPicks, triggerGeneratePicks } from '../../services/picks-service';
import { AdBanner } from '../../components/AdBanner';
import { useRewardedAd } from '../../hooks/useRewardedAd';

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useTheme();
    const { isPremium } = useAuth();
    const { t, i18n } = useTranslation();
    const [refreshing, setRefreshing] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [picks, setPicks] = React.useState<DailyPick[]>([]);
    const [selectedPick, setSelectedPick] = React.useState<DailyPick | null>(null);
    const [showDetail, setShowDetail] = React.useState(false);
    const [showRewardedModal, setShowRewardedModal] = React.useState(false);
    const [rewardTargetPick, setRewardTargetPick] = React.useState<DailyPick | null>(null);
    const [unlockedPicks, setUnlockedPicks] = React.useState<Set<string>>(new Set());
    const { loaded: rewardedLoaded, loading: rewardedLoading, showAd, isUnlockedToday } = useRewardedAd();

    const freePicks = picks.filter(p => p.tier === 'free');
    const premiumPicksArr = picks.filter(p => p.tier === 'premium');

    const loadPicks = async () => {
        const data = await fetchTodayPicks();
        setPicks(data);
    };

    React.useEffect(() => {
        setLoading(true);
        loadPicks().finally(() => setLoading(false));
    }, []);

    const formatDate = () => {
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'won': return colors.statusGreen;
            case 'lost': return colors.statusRed;
            case 'void': return colors.textMuted;
            default: return colors.statusPending;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'won': return <CheckCircle size={16} color={colors.statusGreen} />;
            case 'lost': return <XCircle size={16} color={colors.statusRed} />;
            case 'void': return <Clock size={16} color={colors.textMuted} />;
            default: return <Clock size={16} color={colors.statusPending} />;
        }
    };

    const getStatusLabel = (status: string) => {
        if (status === 'won') return t('common.green') || 'GREEN';
        if (status === 'lost') return t('common.red') || 'RED';
        if (status === 'void') return t('common.void') || 'VOID';
        return t('common.pending') || 'PENDING';
    };

    const handlePickPress = (pick: DailyPick) => {
        if (pick.tier === 'free' || isPremium || unlockedPicks.has(pick.id)) {
            setSelectedPick(pick);
            setShowDetail(true);
        }
    };

    const handleLockedPress = async (pick: DailyPick) => {
        const alreadyUnlocked = await isUnlockedToday(pick.id);
        if (alreadyUnlocked) {
            setUnlockedPicks(prev => new Set([...prev, pick.id]));
            setSelectedPick(pick);
            setShowDetail(true);
            return;
        }
        setRewardTargetPick(pick);
        setShowRewardedModal(true);
    };

    const handleWatchAd = async () => {
        if (!rewardTargetPick) return;
        setShowRewardedModal(false);
        const rewarded = await showAd(rewardTargetPick.id);
        if (rewarded) {
            setUnlockedPicks(prev => new Set([...prev, rewardTargetPick.id]));
            setSelectedPick(rewardTargetPick);
            setShowDetail(true);
        } else {
            Alert.alert(t('common.error'), 'Não foi possível exibir o anúncio. Tente novamente.');
        }
    };

    const handleGeneratePicks = async () => {
        setLoading(true);
        const result = await triggerGeneratePicks(false);
        await loadPicks();
        setLoading(false);
        if (!result.success) {
            Alert.alert('Aviso', result.message ?? 'Erro ao gerar picks.');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPicks();
        setRefreshing(false);
    };

    const renderPickCard = (pick: DailyPick, isLocked: boolean = false) => {
        const isUnlocked = unlockedPicks.has(pick.id);
        const effectiveLocked = isLocked && !isUnlocked;
        const selections = (pick as any).pick_selections ?? [];

        return (
        <TouchableOpacity
            key={pick.id}
            style={[styles.pickCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
            onPress={() => effectiveLocked ? handleLockedPress(pick) : handlePickPress(pick)}
            activeOpacity={0.7}
        >
            {effectiveLocked ? (
                <View style={styles.lockedContent}>
                    <Lock color={colors.accentGold} size={32} />
                    <Text style={[styles.lockedTitle, { color: colors.textPrimary }]}>{t('home.unlock_premium')}</Text>
                    <Text style={[styles.lockedText, { color: colors.textMuted }]}>{t('home.get_premium')}</Text>
                    <View style={styles.lockedActions}>
                        <TouchableOpacity
                            style={[styles.watchAdBtn, { borderColor: colors.accentGold }]}
                            onPress={() => handleLockedPress(pick)}
                        >
                            <Play color={colors.accentGold} size={14} />
                            <Text style={[styles.watchAdText, { color: colors.accentGold }]}>{t('home.watch_ad')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.premiumBtn, { backgroundColor: colors.accentGold }]}
                            onPress={() => router.push('/premium')}
                        >
                            <Crown color="#FFF" size={14} />
                            <Text style={styles.premiumBtnText}>Premium</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <>
                    <View style={styles.pickHeader}>
                        <View style={[styles.tierBadge, { backgroundColor: pick.tier === 'premium' ? colors.accentGold : colors.statusGreen }]}>
                            <Text style={styles.tierBadgeText}>{t(`common.${pick.tier}`).toUpperCase()}</Text>
                        </View>
                        <View style={styles.statusRow}>
                            {getStatusIcon(pick.status)}
                            <Text style={[styles.statusText, { color: getStatusColor(pick.status) }]}>{getStatusLabel(pick.status)}</Text>
                        </View>
                    </View>
                    <Text style={[styles.pickOdd, { color: colors.textPrimary }]}>{Number(pick.combined_odds).toFixed(2)}</Text>
                    <Text style={[styles.pickSubtitle, { color: colors.textMuted }]}>
                        {selections.length} {t('home.selections')} • {pick.confidence}% {t('home.confidence')}
                    </Text>
                    <View style={styles.selectionsPreview}>
                        {selections.slice(0, 2).map((s: any) => (
                            <Text key={s.id} style={[styles.selectionPreview, { color: colors.textSecondary }]}>
                                {s.home_team_name} vs {s.away_team_name}
                            </Text>
                        ))}
                        {selections.length > 2 && (
                            <Text style={[styles.selectionMore, { color: colors.textMuted }]}>+{selections.length - 2} {t('common.more')}</Text>
                        )}
                    </View>
                </>
            )}
            <View style={styles.chevron}>
                <ChevronRight color={effectiveLocked ? colors.textMuted : colors.accentGold} size={20} />
            </View>
        </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.backgroundTertiary }]}>
                <View style={styles.headerTop}>
                    <Text style={styles.logoText}>{t('app.name')}</Text>
                    <TouchableOpacity style={styles.notificationBtn}>
                        <Bell color={colors.white} size={24} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.dateText}>{formatDate()}</Text>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentGold} />}
            >
                {loading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator size="large" color={colors.accentGold} />
                        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Carregando picks...</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('home.free_picks')}</Text>
                            {freePicks.length === 0 ? (
                                <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                        Picks sendo gerados... Puxe para atualizar.
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.generateBtn, { backgroundColor: colors.accentGold }]}
                                        onPress={handleGeneratePicks}
                                    >
                                        <RefreshCw color="#FFF" size={16} />
                                        <Text style={styles.generateBtnText}>Gerar Picks de Hoje</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                freePicks.map((pick) => (
                                    <View key={pick.id}>{renderPickCard(pick)}</View>
                                ))
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.section}
                            onPress={() => router.push('/premium')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('home.premium_picks')}</Text>
                            {isPremium ? (
                                premiumPicksArr.map((pick) => (
                                    <View key={pick.id}>{renderPickCard(pick)}</View>
                                ))
                            ) : (
                                premiumPicksArr[0] ? renderPickCard(premiumPicksArr[0], true) : (
                                    <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Crown color={colors.accentGold} size={32} />
                                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                            Assine Premium para ver até 5 picks/dia com 75%+ de confiança.
                                        </Text>
                                    </View>
                                )
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>

            <View style={[styles.bannerWrapper, { paddingBottom: insets.bottom }]}>
                <AdBanner />
            </View>

            <Modal visible={showRewardedModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.rewardedModal, { backgroundColor: colors.backgroundPrimary }]}>
                        <Lock color={colors.accentGold} size={36} style={{ marginBottom: 12 }} />
                        <Text style={[styles.rewardedTitle, { color: colors.textPrimary }]}>Pick Premium Bloqueado</Text>
                        <Text style={[styles.rewardedSubtitle, { color: colors.textMuted }]}>
                            Assine para acesso ilimitado ou assista 1 anúncio para ver este pick.
                        </Text>
                        <TouchableOpacity
                            style={[styles.rewardedBtn, { backgroundColor: colors.accentGold }]}
                            onPress={handleWatchAd}
                            disabled={rewardedLoading}
                        >
                            {rewardedLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Play color="#FFF" size={18} />
                                    <Text style={styles.rewardedBtnText}>Assistir anúncio (grátis)</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.rewardedBtnOutline, { borderColor: colors.accentGold }]}
                            onPress={() => { setShowRewardedModal(false); router.push('/premium'); }}
                        >
                            <Crown color={colors.accentGold} size={18} />
                            <Text style={[styles.rewardedBtnOutlineText, { color: colors.accentGold }]}>Assinar por $ 3,00/mês</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowRewardedModal(false)} style={styles.rewardedCancel}>
                            <Text style={[styles.rewardedCancelText, { color: colors.textMuted }]}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showDetail} animationType="slide" transparent>
                <View style={[styles.modalOverlay]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.backgroundPrimary }]}>
                        <View style={[styles.modalHeader, { backgroundColor: colors.backgroundTertiary }]}>
                            <Text style={styles.modalTitle}>{t('home.selections')}</Text>
                            <TouchableOpacity onPress={() => setShowDetail(false)}>
                                <Text style={[styles.modalClose, { color: colors.white }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        {selectedPick && (
                            <ScrollView style={styles.modalBody}>
                                <View style={[styles.oddCard, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.oddLabel, { color: colors.textMuted }]}>{t('common.combined_odd')}</Text>
                                    <Text style={[styles.oddValue, { color: colors.accentGold }]}>{Number(selectedPick.combined_odds).toFixed(2)}</Text>
                                    <Text style={[styles.confidenceLabel, { color: colors.textMuted }]}>{selectedPick.confidence}% {t('home.confidence')}</Text>
                                </View>
                                {((selectedPick as any).pick_selections ?? []).map((sel: any) => {
                                    const lang = i18n.language as 'pt' | 'en' | 'es';
                                    const reason = sel.reasons?.[lang] ?? sel.reasons?.pt ?? '';
                                    return (
                                        <View key={sel.id} style={[styles.selectionCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                                            <View style={styles.selectionHeader}>
                                                <Text style={[styles.selectionTeams, { color: colors.textPrimary }]}>
                                                    {sel.home_team_name} vs {sel.away_team_name}
                                                </Text>
                                                {getStatusIcon(sel.status)}
                                            </View>
                                            <Text style={[styles.selectionLeague, { color: colors.textMuted }]}>{sel.league_name}</Text>
                                            <View style={styles.selectionDetails}>
                                                <Text style={[styles.selectionMarket, { color: colors.accentGold }]}>{sel.market}</Text>
                                                <Text style={[styles.selectionOdd, { color: colors.textPrimary }]}>@{Number(sel.odds).toFixed(2)}</Text>
                                            </View>
                                            {reason ? (
                                                <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{reason}</Text>
                                            ) : null}
                                            <View style={[styles.confidenceBadge, { backgroundColor: colors.background }]}>
                                                <Text style={[styles.confidenceBadgeText, { color: getStatusColor(sel.status) }]}>
                                                    {sel.confidence}%
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
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
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logoText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
    notificationBtn: { padding: 4 },
    dateText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
    content: { flex: 1, marginTop: -12 },
    section: { padding: 16, paddingTop: 24 },
    sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
    loadingState: { alignItems: 'center', paddingTop: 80, gap: 12 },
    loadingText: { fontSize: 14 },
    emptyState: { padding: 24, borderRadius: 16, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    generateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    generateBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    pickCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    pickHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    tierBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    tierBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusText: { fontSize: 12, fontWeight: '600' },
    pickOdd: { fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
    pickSubtitle: { fontSize: 13, marginBottom: 12 },
    selectionsPreview: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12 },
    selectionPreview: { fontSize: 13, marginBottom: 4 },
    selectionMore: { fontSize: 12, fontStyle: 'italic' },
    chevron: { position: 'absolute', right: 16, top: '50%' },
    lockedContent: { alignItems: 'center', paddingVertical: 24 },
    lockedTitle: { fontSize: 18, fontWeight: '600', marginTop: 12, marginBottom: 8 },
    lockedText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 8 },
    lockedActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
    watchAdBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
    watchAdText: { fontSize: 13, fontWeight: '600' },
    premiumBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    premiumBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
    bannerWrapper: { alignItems: 'center', width: '100%' },
    rewardedModal: { margin: 24, padding: 28, borderRadius: 20, alignItems: 'center' },
    rewardedTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    rewardedSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    rewardedBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', padding: 14, borderRadius: 12, marginBottom: 12 },
    rewardedBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    rewardedBtnOutline: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
    rewardedBtnOutlineText: { fontSize: 15, fontWeight: '600' },
    rewardedCancel: { padding: 10 },
    rewardedCancelText: { fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { flex: 1, marginTop: 'auto', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    modalClose: { fontSize: 24 },
    modalBody: { flex: 1, padding: 16 },
    oddCard: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
    oddLabel: { fontSize: 12 },
    oddValue: { fontSize: 48, fontWeight: 'bold', marginVertical: 8 },
    confidenceLabel: { fontSize: 14 },
    selectionCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    selectionTeams: { fontSize: 16, fontWeight: '600', flex: 1 },
    selectionLeague: { fontSize: 12, marginBottom: 8 },
    selectionDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectionMarket: { fontSize: 14, fontWeight: '600' },
    selectionOdd: { fontSize: 16, fontWeight: 'bold' },
    reasonText: { fontSize: 12, marginTop: 8, lineHeight: 16, fontStyle: 'italic' },
    confidenceBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
    confidenceBadgeText: { fontSize: 13, fontWeight: '600' },
});