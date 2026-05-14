import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert, ActivityIndicator, Image, Dimensions, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Lock, Play, Crown, RefreshCw, TrendingUp, BarChart3, Target, Calendar, Info, Clock, ShieldCheck, Zap, Share2, TrendingDown, CheckCircle, XCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown, Layout, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AdBanner } from '../../components/AdBanner';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import { Header } from '../../components/Header';
import { MultipleCard } from '../../components/MultipleCard';
import { useTodayAnalyses } from '../../services/analyses-service';
import { AnalysisWithDetails } from '../../types';

const { width } = Dimensions.get('window');

function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors, resolvedTheme } = useTheme();
    const { isPremium } = useAuth();
    const { t, i18n } = useTranslation();
    
    // ✅ FIX: Busca análises imediatamente, não aguarda auth (React Query tem retry automático)
    const { data: analyses = [], isLoading: analysesLoading, error, refetch } = useTodayAnalyses({
        enabled: true, // Sempre habilitado para evitar atraso
    });

    // Lista: só aguarda análises; perfil carrega em background (não trava primeiro login).
    const isLoading = analysesLoading;
    
    const [selectedAnalysis, setSelectedAnalysis] = React.useState<AnalysisWithDetails | null>(null);
    const [showDetail, setShowDetail] = React.useState(false);
    const [showRewardedModal, setShowRewardedModal] = React.useState(false);
    const [rewardTargetAnalysis, setRewardTargetAnalysis] = React.useState<AnalysisWithDetails | null>(null);
    const [unlockedAnalyses, setUnlockedAnalyses] = React.useState<Set<string>>(new Set());
    const [unlocksRestored, setUnlocksRestored] = React.useState(false);
    const { loading: rewardedLoading, showAd, isUnlockedToday, hasUsedAdToday } = useRewardedAd();

    // Filtra análises — separa múltiplas das individuais
    const multipleAnalyses = analyses.filter(a => a.is_multiple === true);
    const individualAnalyses = analyses.filter(a => !a.is_multiple);
    const freeAnalyses = individualAnalyses.filter(a => a.tier === 'free');
    const premiumAnalyses = individualAnalyses.filter(a => a.tier === 'premium');
    const freeMultiples = multipleAnalyses.filter(a => a.tier === 'free');
    const premiumMultiples = multipleAnalyses.filter(a => a.tier === 'premium');
    
    // ✅ FIX: Restaura desbloqueios apenas uma vez quando análises carregarem
    React.useEffect(() => {
        if (unlocksRestored || !analyses.length) return;
        
        if (!premiumAnalyses.length) {
            setUnlocksRestored(true);
            return;
        }

        const restoreUnlocks = async () => {
            console.log('[CornerEdge] Restaurando desbloqueios...');
            const unlocked = new Set<string>();
            for (const analysis of premiumAnalyses) {
                const wasUnlocked = await isUnlockedToday(analysis.id);
                if (wasUnlocked) {
                    console.log(`[CornerEdge] Análise ${analysis.id} já desbloqueada`);
                    unlocked.add(analysis.id);
                }
            }
            if (unlocked.size > 0) {
                setUnlockedAnalyses(unlocked);
            }
            setUnlocksRestored(true);
        };
        restoreUnlocks();
    }, [analyses.length, unlocksRestored, premiumAnalyses.length, isUnlockedToday]);

    // Pick premium sorteada para desbloquear — determinística por dia (seed = data)
    // O usuário só vê UMA pick premium bloqueada, sem saber qual é
    const unlockablePremiumAnalysis = React.useMemo(() => {
        if (!premiumAnalyses.length) return null;
        const today = new Date().toISOString().split('T')[0];
        const seed = today.split('-').reduce((acc, val) => acc + parseInt(val), 0);
        const idx = seed % premiumAnalyses.length;
        return premiumAnalyses[idx];
    }, [premiumAnalyses]);

    const formatDate = () => {
        const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
        return new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    };

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

    const handleAnalysisPress = (analysis: AnalysisWithDetails) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (analysis.tier === 'free' || isPremium || unlockedAnalyses.has(analysis.id)) {
            setSelectedAnalysis(analysis);
            setShowDetail(true);
        }
    };

    const handleLockedPress = async (analysis: AnalysisWithDetails) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        // Verificar limite diário primeiro
        const usedToday = await hasUsedAdToday();
        if (usedToday) {
            Alert.alert(
                '⏰ ' + t('home.ad_limit_reached'),
                t('home.ad_limit_message'),
                [{ text: 'OK' }]
            );
            return;
        }

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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                '✅ ' + t('common.success'),
                t('home.ad_unlocked'),
                [{ text: 'OK' }]
            );
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const errorMessage = result.error?.includes('já assistiu') || result.error?.includes('já usou')
                ? t('home.ad_limit_message')
                : result.error?.includes('fechado') || result.error?.includes('closed')
                ? t('home.ad_closed_early_message')
                : t('home.ad_unavailable_message');
            
            Alert.alert(
                '⚠️ ' + t('common.error'),
                errorMessage,
                [{ text: 'OK' }]
            );
        }
    };

    const handleShare = async (analysis: AnalysisWithDetails) => {
        try {
            const message = `${t('app.name')} - ${t('home.full_analysis')}\n\n⚽️ ${analysis.home_team} vs ${analysis.away_team}\n🏆 ${analysis.league}\n🎯 ${t('home.strategy')}: ${t(`home.${analysis.strategy_type || 'over'}`)} ${analysis.avg_prediction}\n🔥 ${t('home.statistical_confidence')}: ${analysis.confidence}%`;
            await Share.share({ message });
        } catch (error) {
            console.error(error);
        }
    };

    const onRefresh = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await refetch();
    };

    const renderSkeleton = () => (
        <View style={styles.sectionsContainer}>
            {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                    <View style={styles.skeletonHeader} />
                    <View style={styles.skeletonBody} />
                    <View style={styles.skeletonFooter} />
                </View>
            ))}
        </View>
    );

    const cornerStatusColor = (status: string) => {
        if (status === 'correct') return colors.statusGreen;
        if (status === 'incorrect') return colors.statusRed;
        if (status === 'void') return colors.textMuted;
        return colors.statusPending;
    };
    const cornerStatusLabel = (status: string) => {
        if (status === 'correct') return t('results.won') || 'GREEN';
        if (status === 'incorrect') return t('results.lost') || 'RED';
        if (status === 'void') return t('results.void') || 'VOID';
        return t('common.pending') || 'PENDING';
    };

    const renderAnalysisCard = (analysis: AnalysisWithDetails, index: number, isLocked: boolean = false) => {
        const isUnlocked = unlockedAnalyses.has(analysis.id);
        const effectiveLocked = isLocked && !isUnlocked;
        const isPremiumCard = analysis.tier === 'premium';

        return (
            <Animated.View 
                key={analysis.id}
                entering={FadeInUp.delay(index * 100).duration(500)}
                layout={Layout.springify()}
            >
                <TouchableOpacity
                    style={[
                        styles.analysisCard,
                        {
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: effectiveLocked ? colors.cardBorder : (isPremiumCard ? colors.accentOrange : colors.cardBorder),
                            borderWidth: isPremiumCard && !effectiveLocked ? 1.5 : 1,
                            shadowColor: colors.black,
                        }
                    ]}
                    onPress={() => effectiveLocked ? handleLockedPress(analysis) : handleAnalysisPress(analysis)}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardHeaderRow}>
                        <LinearGradient
                            colors={isPremiumCard ? ['#FF8C00', colors.accentOrange] : [colors.backgroundTertiary, colors.backgroundTertiary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.tierBadge}
                        >
                            {isPremiumCard && <Crown color="#FFF" size={12} style={{ marginRight: 4 }} />}
                            <Text style={[
                                styles.tierBadgeText,
                                { color: isPremiumCard ? '#FFF' : colors.textMuted }
                            ]}>
                                {isPremiumCard ? t('common.premium').toUpperCase() : t('common.free').toUpperCase()}
                            </Text>
                        </LinearGradient>
                        
                        {/* Oculta a confiança quando o card está bloqueado */}
                        {!effectiveLocked && (
                            <View style={styles.confidenceBadge}>
                                <Zap size={14} color={colors.accentOrange} style={{ marginRight: 4 }} />
                                <Text style={[styles.confidenceValue, { color: colors.accentOrange }]}>
                                    {analysis.confidence}%
                                </Text>
                            </View>
                        )}
                    </View>

                    {effectiveLocked ? (
                        <View style={styles.lockedContent}>
                            {analysis.status !== 'pending' && (
                                <View style={[styles.homeResultBadge, { backgroundColor: cornerStatusColor(analysis.status) }]}>
                                    {analysis.status === 'correct' ? (
                                        <CheckCircle color="#FFF" size={14} style={{ marginRight: 6 }} />
                                    ) : analysis.status === 'incorrect' ? (
                                        <XCircle color="#FFF" size={14} style={{ marginRight: 6 }} />
                                    ) : (
                                        <Clock color="#FFF" size={14} style={{ marginRight: 6 }} />
                                    )}
                                    <Text style={styles.homeResultBadgeText}>{cornerStatusLabel(analysis.status)}</Text>
                                </View>
                            )}
                            <View style={styles.lockIconContainer}>
                                 <Lock color={colors.accentOrange} size={32} />
                            </View>
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
                                    onPress={() => router.push('/(tabs)/premium')}
                                    style={{ flex: 1 }}
                                >
                                    <LinearGradient
                                        colors={[colors.accentOrange, '#FF8C00']}
                                        style={styles.premiumBtn}
                                    >
                                        <Crown color="#FFF" size={14} />
                                        <Text style={styles.premiumBtnText}>{t('common.premium')}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <View style={styles.teamsHeader}>
                                <View style={styles.teamContainer}>
                                    <View style={[styles.logoContainer, { backgroundColor: colors.backgroundPrimary }]}>
                                        {analysis.home_team_logo ? (
                                            <Image source={{ uri: analysis.home_team_logo }} style={styles.teamLogo} />
                                        ) : (
                                            <View style={[styles.teamLogoPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
                                                <Text style={styles.placeholderText}>{analysis.home_team.substring(0, 1)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.teamName, { color: colors.textPrimary }]} numberOfLines={1}>
                                        {analysis.home_team}
                                    </Text>
                                </View>
                                
                                <View style={styles.vsContainer}>
                                    <View style={[styles.vsCircle, { borderColor: colors.cardBorder }]}>
                                        <Text style={[styles.vsText, { color: colors.textMuted }]}>VS</Text>
                                    </View>
                                </View>

                                <View style={[styles.teamContainer, { flexDirection: 'row-reverse' }]}>
                                    <View style={[styles.logoContainer, { backgroundColor: colors.backgroundPrimary }]}>
                                        {analysis.away_team_logo ? (
                                            <Image source={{ uri: analysis.away_team_logo }} style={styles.teamLogo} />
                                        ) : (
                                            <View style={[styles.teamLogoPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
                                                <Text style={styles.placeholderText}>{analysis.away_team.substring(0, 1)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.teamName, { color: colors.textPrimary, textAlign: 'right' }]} numberOfLines={1}>
                                        {analysis.away_team}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.matchInfoRow}>
                                <View style={styles.infoTag}>
                                    <Calendar size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                                    <Text style={[styles.infoTagText, { color: colors.textMuted }]}>{analysis.league}</Text>
                                </View>
                                <View style={styles.infoTag}>
                                    <Clock size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                                    <Text style={[styles.infoTagText, { color: colors.textMuted }]}>{formatKickoffTime(analysis.kickoff_at)}</Text>
                                </View>
                            </View>

                            <View style={[styles.homeAnalysisResultRow, { backgroundColor: colors.backgroundPrimary, borderColor: colors.cardBorder }]}>
                                <View style={[styles.homeMiniStatus, { backgroundColor: cornerStatusColor(analysis.status) }]}>
                                    <Text style={styles.homeMiniStatusText}>{cornerStatusLabel(analysis.status)}</Text>
                                </View>
                                {analysis.status !== 'pending' && analysis.actual_corners != null && analysis.actual_corners !== undefined && (
                                    <Text style={[styles.homeActualCorners, { color: colors.textSecondary }]}>
                                        {t('results.actual_corners')}: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{analysis.actual_corners}</Text>
                                    </Text>
                                )}
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('home.strategy')}</Text>
                                    <Text style={[styles.statValue, { color: colors.accentOrange }]}>
                                        {t(`home.${analysis.strategy_type || 'over'}`)} {analysis.avg_prediction}
                                    </Text>
                                </View>
                                
                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('home.probable_range')}</Text>
                                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                                        {analysis.probable_range_min} - {analysis.probable_range_max}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => handleAnalysisPress(analysis)}
                                style={{ marginTop: 16 }}
                            >
                                <LinearGradient
                                    colors={isPremiumCard ? [colors.accentOrange, '#FF8C00'] : [colors.backgroundTertiary, colors.backgroundTertiary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.viewAnalysisBtn}
                                >
                                    <Text style={[
                                        styles.viewAnalysisBtnText,
                                        { color: isPremiumCard ? '#FFF' : (resolvedTheme === 'light' ? '#CC5500' : colors.accentOrange) }
                                    ]}>
                                        {t('home.view_full_analysis')}
                                    </Text>
                                    <ChevronRight size={16} color={isPremiumCard ? '#FFF' : (resolvedTheme === 'light' ? '#CC5500' : colors.accentOrange)} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <Header 
                title="CornerEdge"
                subtitle={formatDate()}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.accentOrange} />}
            >
                {isLoading ? renderSkeleton() : (
                    <View style={styles.sectionsContainer}>
                        {/* Múltiplas Premium */}
                        {(isPremium ? premiumMultiples : []).length > 0 && (
                            <>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.premiumTitleRow}>
                                        <Crown size={20} color={colors.accentOrange} style={{ marginRight: 8 }} />
                                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                            {t('home.multiples_premium') || 'Múltiplas Premium'}
                                        </Text>
                                    </View>
                                    <View style={[styles.sectionTitleBadge, { backgroundColor: colors.accentOrange }]}>
                                        <Text style={[styles.sectionTitleBadgeText, { color: colors.white }]}>{premiumMultiples.length}</Text>
                                    </View>
                                </View>
                                <View style={styles.section}>
                                    {premiumMultiples.map((analysis, index) => (
                                        <MultipleCard
                                            key={analysis.id}
                                            analysis={analysis}
                                            index={index}
                                            onPress={() => {
                                                setSelectedAnalysis(analysis);
                                                setShowDetail(true);
                                            }}
                                        />
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Múltiplas Free */}
                        {freeMultiples.length > 0 && (
                            <>
                                <View style={styles.sectionHeader}>
                                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                        {t('home.multiples_free') || 'Múltiplas Free'}
                                    </Text>
                                    <View style={[styles.sectionTitleBadge, { backgroundColor: colors.backgroundTertiary }]}>
                                        <Text style={[styles.sectionTitleBadgeText, { color: colors.white }]}>{freeMultiples.length}</Text>
                                    </View>
                                </View>
                                <View style={styles.section}>
                                    {freeMultiples.map((analysis, index) => (
                                        <MultipleCard
                                            key={analysis.id}
                                            analysis={analysis}
                                            index={index}
                                            onPress={() => {
                                                setSelectedAnalysis(analysis);
                                                setShowDetail(true);
                                            }}
                                        />
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Premium individual — maior assertividade, destaque visual */}
                        {premiumAnalyses.length > 0 && (
                            <>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.premiumTitleRow}>
                                        <Crown size={20} color={colors.accentOrange} style={{ marginRight: 8 }} />
                                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('common.premium')}</Text>
                                    </View>
                                    <View style={[styles.sectionTitleBadge, { backgroundColor: colors.accentOrange }]}>
                                        <Text style={[styles.sectionTitleBadgeText, { color: colors.white }]}>{premiumAnalyses.length}</Text>
                                    </View>
                                </View>
                                <View style={styles.section}>
                                    {premiumAnalyses.map((analysis, index) => {
                                        const isUnlocked = unlockedAnalyses.has(analysis.id);
                                        // Usuário premium: vê todas
                                        if (isPremium || isUnlocked) {
                                            return renderAnalysisCard(analysis, index, false);
                                        }
                                        // Usuário free: só vê a pick sorteada para desbloquear
                                        if (analysis.id === unlockablePremiumAnalysis?.id) {
                                            return renderAnalysisCard(analysis, index, true);
                                        }
                                        // Demais picks premium ficam ocultas
                                        return null;
                                    })}
                                </View>
                            </>
                        )}

                        {/* Free depois */}
                        {freeAnalyses.length > 0 && (
                            <>
                                <View style={styles.sectionHeader}>
                                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('common.free')}</Text>
                                    <View style={[styles.sectionTitleBadge, { backgroundColor: colors.backgroundTertiary }]}>
                                        <Text style={[styles.sectionTitleBadgeText, { color: colors.white }]}>{freeAnalyses.length}</Text>
                                    </View>
                                </View>
                                <View style={styles.section}>
                                    {freeAnalyses.map((analysis, index) => renderAnalysisCard(analysis, index + premiumAnalyses.length))}
                                </View>
                            </>
                        )}

                        {analyses.length === 0 && (
                            <Animated.View 
                                entering={FadeInDown}
                                style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}
                            >
                                <BarChart3 color={colors.textMuted} size={48} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {t('home.no_analyses_today')}
                                </Text>
                                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                                    {t('home.no_analyses_message')}
                                </Text>
                            </Animated.View>
                        )}
                    </View>
                )}
            </ScrollView>

            <View style={[styles.bannerWrapper, { paddingBottom: insets.bottom + 10 }]}>
                <AdBanner />
            </View>

            {/* Rewarded Ad Modal */}
            <Modal visible={showRewardedModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <Animated.View 
                        entering={FadeInUp}
                        style={[styles.rewardedModal, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder, borderWidth: 1 }]}
                    >
                        <View style={[styles.rewardedIconCircle, { backgroundColor: colors.backgroundPrimary }]}>
                            <Lock color={colors.accentOrange} size={36} />
                        </View>
                        <Text style={[styles.rewardedTitle, { color: colors.textPrimary }]}>
                            {t('home.unlock_premium')}
                        </Text>
                        <Text style={[styles.rewardedSubtitle, { color: colors.textMuted }]}>
                            {t('home.get_premium')}
                        </Text>
                        
                        <TouchableOpacity
                            onPress={handleWatchAd}
                            disabled={rewardedLoading}
                            style={{ width: '100%' }}
                        >
                            <LinearGradient
                                colors={[colors.accentOrange, '#FF8C00']}
                                style={styles.rewardedBtn}
                            >
                                {rewardedLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Play color="#FFF" size={18} />
                                        <Text style={styles.rewardedBtnText}>{t('home.watch_ad')}</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.rewardedBtnOutline, { borderColor: colors.cardBorder }]}
                            onPress={() => { setShowRewardedModal(false); router.push('/premium'); }}
                        >
                            <Crown color={colors.accentOrange} size={18} />
                            <Text style={[styles.rewardedBtnOutlineText, { color: colors.textPrimary }]}>
                                {t('premium.subscribe')}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => setShowRewardedModal(false)} style={styles.rewardedCancel}>
                            <Text style={[styles.rewardedCancelText, { color: colors.textMuted }]}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Full Analysis Detail Modal */}
            <Modal visible={showDetail} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.backgroundPrimary }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 }]}>
                            <View style={styles.modalTitleContainer}>
                                <BarChart3 size={20} color={colors.accentOrange} style={{ marginRight: 8 }} />
                                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                    {selectedAnalysis?.is_multiple ? t('home.multiple') || 'Múltipla' : t('home.full_analysis')}
                                </Text>
                            </View>
                            <View style={styles.modalHeaderActions}>
                                <TouchableOpacity 
                                    onPress={() => selectedAnalysis && handleShare(selectedAnalysis)}
                                    style={[styles.modalActionBtn, { backgroundColor: colors.backgroundTertiary }]}
                                >
                                    <Share2 color="#FFF" size={16} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setShowDetail(false)}
                                    style={[styles.modalCloseBtn, { backgroundColor: colors.backgroundTertiary }]}
                                >
                                    <Text style={styles.modalCloseText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {selectedAnalysis && selectedAnalysis.is_multiple && selectedAnalysis.games ? (
                            /* ── MODAL DE MÚLTIPLA ── */
                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                {/* Header da múltipla */}
                                <View style={[styles.multipleModalHeader, { backgroundColor: colors.backgroundSecondary }]}>
                                    <View style={styles.multipleModalBadgeRow}>
                                        <LinearGradient
                                            colors={selectedAnalysis.tier === 'premium' ? ['#FF8C00', colors.accentOrange] : [colors.backgroundTertiary, colors.backgroundTertiary]}
                                            style={styles.multipleModalBadge}
                                        >
                                            {selectedAnalysis.tier === 'premium' && <Crown color="#FFF" size={12} style={{ marginRight: 4 }} />}
                                            <Text style={[styles.multipleModalBadgeText, { color: selectedAnalysis.tier === 'premium' ? '#FFF' : colors.textMuted }]}>
                                                {selectedAnalysis.tier === 'premium' ? 'PREMIUM' : 'FREE'} • {t('home.multiple') || 'MÚLTIPLA'} {selectedAnalysis.games.length}X
                                            </Text>
                                        </LinearGradient>
                                        <View style={styles.multipleModalOddBadge}>
                                            <Text style={[styles.multipleModalOddLabel, { color: colors.textMuted }]}>{t('home.combined_odd') || 'Odd'}</Text>
                                            <Text style={[styles.multipleModalOddValue, { color: colors.accentOrange }]}>{selectedAnalysis.combined_odd?.toFixed(2)}x</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.multipleModalConfRow, { borderTopColor: colors.cardBorder }]}>
                                        <Zap size={16} color={colors.accentOrange} />
                                        <Text style={[styles.multipleModalConfLabel, { color: colors.textMuted }]}>{t('home.statistical_confidence')}</Text>
                                        <Text style={[styles.multipleModalConfValue, { color: colors.accentOrange }]}>{selectedAnalysis.combined_confidence}%</Text>
                                    </View>
                                    <View style={[styles.multipleModalResultRow, { borderTopColor: colors.cardBorder }]}>
                                        <Text style={[styles.multipleModalResultLabel, { color: colors.textMuted }]}>
                                            {t('results.multiple_outcome') || (i18n.language === 'en' ? 'Multiple result' : 'Resultado da múltipla')}
                                        </Text>
                                        <View style={[styles.homeMiniStatus, { backgroundColor: cornerStatusColor(selectedAnalysis.status) }]}>
                                            <Text style={styles.homeMiniStatusText}>{cornerStatusLabel(selectedAnalysis.status)}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Um card por jogo da múltipla */}
                                {selectedAnalysis.games.map((game, idx) => (
                                    <View key={`${game.fixture_id}-${idx}`} style={[styles.multipleGameCard, { backgroundColor: colors.backgroundSecondary }]}>
                                        {/* Número do jogo */}
                                        <View style={styles.multipleGameIndexRow}>
                                            <View style={[styles.multipleGameIndex, { backgroundColor: colors.accentOrange }]}>
                                                <Text style={styles.multipleGameIndexText}>{idx + 1}</Text>
                                            </View>
                                            <Text style={[styles.multipleGameLeague, { color: colors.textMuted }]}>{game.league}</Text>
                                            <View style={styles.multipleGameTimeRow}>
                                                <Clock size={11} color={colors.textMuted} />
                                                <Text style={[styles.multipleGameTime, { color: colors.textMuted }]}>
                                                    {new Date(game.kickoff_at).toLocaleTimeString(
                                                        i18n.language === 'pt' ? 'pt-BR' : i18n.language === 'es' ? 'es-ES' : 'en-US',
                                                        { hour: '2-digit', minute: '2-digit' }
                                                    )}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Times */}
                                        <View style={styles.multipleGameTeamsRow}>
                                            <View style={styles.multipleGameTeam}>
                                                {game.home_logo ? (
                                                    <Image source={{ uri: game.home_logo }} style={styles.multipleGameLogo} />
                                                ) : (
                                                    <View style={[styles.multipleGameLogoPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
                                                        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{game.home_team.substring(0, 1)}</Text>
                                                    </View>
                                                )}
                                                <Text style={[styles.multipleGameTeamName, { color: colors.textPrimary }]} numberOfLines={2}>{game.home_team}</Text>
                                            </View>
                                            <View style={[styles.multipleGameVs, { borderColor: colors.cardBorder }]}>
                                                <Text style={[styles.multipleGameVsText, { color: colors.textMuted }]}>VS</Text>
                                            </View>
                                            <View style={[styles.multipleGameTeam, { alignItems: 'flex-end' }]}>
                                                {game.away_logo ? (
                                                    <Image source={{ uri: game.away_logo }} style={styles.multipleGameLogo} />
                                                ) : (
                                                    <View style={[styles.multipleGameLogoPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
                                                        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{game.away_team.substring(0, 1)}</Text>
                                                    </View>
                                                )}
                                                <Text style={[styles.multipleGameTeamName, { color: colors.textPrimary, textAlign: 'right' }]} numberOfLines={2}>{game.away_team}</Text>
                                            </View>
                                        </View>

                                        {/* Estratégia */}
                                        <View style={[styles.multipleGameStrategyRow, { backgroundColor: colors.backgroundPrimary, borderColor: colors.cardBorder }]}>
                                            {game.strategy === 'over' ? (
                                                <TrendingUp size={16} color={colors.accentOrange} />
                                            ) : (
                                                <TrendingDown size={16} color={colors.accentOrange} />
                                            )}
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.multipleGameStrategyLabel, { color: colors.textMuted }]}>{t('home.strategy')}</Text>
                                                <Text style={[styles.multipleGameStrategyValue, { color: colors.accentOrange }]}>
                                                    {t(`home.${game.strategy}`)} {game.prediction} {t('home.corners') || 'escanteios'}
                                                </Text>
                                            </View>
                                            <View style={[styles.multipleGameConfBadge, { backgroundColor: colors.accentOrange + '22', borderColor: colors.accentOrange }]}>
                                                <Zap size={11} color={colors.accentOrange} />
                                                <Text style={[styles.multipleGameConfText, { color: colors.accentOrange }]}>{game.confidence}%</Text>
                                            </View>
                                        </View>

                                        {/* Resultado do jogo (múltipla) */}
                                        {(game.result && game.result !== 'pending') || game.actual_corners != null ? (
                                            <View style={[styles.multipleGameResultRow, { backgroundColor: colors.backgroundPrimary, borderColor: colors.cardBorder }]}>
                                                <View style={[styles.homeMiniStatus, { backgroundColor: cornerStatusColor(game.result || 'pending') }]}>
                                                    <Text style={styles.homeMiniStatusText}>{cornerStatusLabel(game.result || 'pending')}</Text>
                                                </View>
                                                {game.actual_corners != null && game.actual_corners !== undefined && (
                                                    <Text style={[styles.multipleGameResultCorners, { color: colors.textPrimary }]}>
                                                        {t('results.actual_corners')}: <Text style={{ fontWeight: '900' }}>{game.actual_corners}</Text>
                                                    </Text>
                                                )}
                                            </View>
                                        ) : null}

                                        {/* Justificativa estatística */}
                                        <View style={[styles.multipleGameRationale, { borderTopColor: colors.cardBorder }]}>
                                            <View style={styles.multipleGameRationaleHeader}>
                                                <Info size={13} color={colors.textMuted} />
                                                <Text style={[styles.multipleGameRationaleTitle, { color: colors.textMuted }]}>
                                                    {i18n.language === 'en' ? 'Why this pick?' : i18n.language === 'es' ? '¿Por qué esta pick?' : 'Por que esta pick?'}
                                                </Text>
                                            </View>
                                            <Text style={[styles.multipleGameRationaleText, { color: colors.textSecondary }]}>
                                                {game.strategy === 'over'
                                                    ? i18n.language === 'en'
                                                        ? `Statistical model projects ${game.prediction}+ corners. Both teams show high offensive pressure in recent matches. Confidence: ${game.confidence}%.`
                                                        : i18n.language === 'es'
                                                        ? `El modelo estadístico proyecta ${game.prediction}+ corners. Ambos equipos muestran alta presión ofensiva en partidos recientes. Confianza: ${game.confidence}%.`
                                                        : `Modelo estatístico projeta ${game.prediction}+ escanteios. Ambas as equipes apresentam alta pressão ofensiva nos jogos recentes. Confiança: ${game.confidence}%.`
                                                    : i18n.language === 'en'
                                                        ? `Statistical model projects under ${game.prediction} corners. Both teams show low offensive pressure and defensive solidity. Confidence: ${game.confidence}%.`
                                                        : i18n.language === 'es'
                                                        ? `El modelo estadístico proyecta menos de ${game.prediction} corners. Ambos equipos muestran baja presión ofensiva y solidez defensiva. Confianza: ${game.confidence}%.`
                                                        : `Modelo estatístico projeta menos de ${game.prediction} escanteios. Ambas as equipes apresentam baixa pressão ofensiva e solidez defensiva. Confiança: ${game.confidence}%.`
                                                }
                                            </Text>

                                            {/* Barra de confiança visual */}
                                            <View style={styles.multipleGameConfBar}>
                                                <View style={[styles.multipleGameConfBarTrack, { backgroundColor: colors.backgroundPrimary }]}>
                                                    <LinearGradient
                                                        colors={game.confidence >= 65 ? [colors.accentOrange, '#FF8C00'] : ['#888', '#666']}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={[styles.multipleGameConfBarFill, { width: `${game.confidence}%` }]}
                                                    />
                                                </View>
                                                <Text style={[styles.multipleGameConfBarLabel, { color: colors.textMuted }]}>
                                                    {game.confidence >= 65
                                                        ? (i18n.language === 'en' ? 'High confidence' : i18n.language === 'es' ? 'Alta confianza' : 'Alta confiança')
                                                        : (i18n.language === 'en' ? 'Moderate confidence' : i18n.language === 'es' ? 'Confianza moderada' : 'Confiança moderada')
                                                    }
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                {/* Resumo da múltipla */}
                                <View style={[styles.multipleSummaryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.accentOrange }]}>
                                    <View style={styles.cardHeaderWithIcon}>
                                        <Target size={16} color={colors.accentOrange} style={{ marginRight: 8 }} />
                                        <Text style={[styles.distributionTitle, { color: colors.textPrimary }]}>
                                            {i18n.language === 'en' ? 'Multiple Summary' : i18n.language === 'es' ? 'Resumen de la Múltiple' : 'Resumo da Múltipla'}
                                        </Text>
                                    </View>
                                    <View style={styles.multipleSummaryGrid}>
                                        <View style={styles.multipleSummaryItem}>
                                            <Text style={[styles.multipleSummaryLabel, { color: colors.textMuted }]}>
                                                {i18n.language === 'en' ? 'Games' : i18n.language === 'es' ? 'Partidos' : 'Jogos'}
                                            </Text>
                                            <Text style={[styles.multipleSummaryValue, { color: colors.textPrimary }]}>{selectedAnalysis.games.length}</Text>
                                        </View>
                                        <View style={[styles.multipleSummaryDivider, { backgroundColor: colors.cardBorder }]} />
                                        <View style={styles.multipleSummaryItem}>
                                            <Text style={[styles.multipleSummaryLabel, { color: colors.textMuted }]}>{t('home.combined_odd') || 'Odd'}</Text>
                                            <Text style={[styles.multipleSummaryValue, { color: colors.accentOrange }]}>{selectedAnalysis.combined_odd?.toFixed(2)}x</Text>
                                        </View>
                                        <View style={[styles.multipleSummaryDivider, { backgroundColor: colors.cardBorder }]} />
                                        <View style={styles.multipleSummaryItem}>
                                            <Text style={[styles.multipleSummaryLabel, { color: colors.textMuted }]}>
                                                {i18n.language === 'en' ? 'Avg Conf.' : i18n.language === 'es' ? 'Conf. Media' : 'Conf. Média'}
                                            </Text>
                                            <Text style={[styles.multipleSummaryValue, { color: colors.accentOrange }]}>{selectedAnalysis.combined_confidence}%</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.multipleSummaryNote, { color: colors.textMuted }]}>
                                        {i18n.language === 'en'
                                            ? 'All games must win for the multiple to be correct.'
                                            : i18n.language === 'es'
                                            ? 'Todos los partidos deben ganar para que la múltiple sea correcta.'
                                            : 'Todos os jogos precisam acertar para a múltipla ser correta.'
                                        }
                                    </Text>
                                </View>

                                <TouchableOpacity 
                                    onPress={() => setShowDetail(false)}
                                    style={[styles.modalCloseFooter, { backgroundColor: colors.backgroundTertiary }]}
                                >
                                    <Text style={styles.modalCloseFooterText}>{t('common.close')}</Text>
                                </TouchableOpacity>
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        ) : selectedAnalysis ? (
                            /* ── MODAL DE ANÁLISE INDIVIDUAL (original) ── */
                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                <View style={[styles.modalAnalysisHeader, { backgroundColor: colors.backgroundSecondary }]}>
                                     <View style={styles.teamsHeaderSmall}>
                                        <Text style={[styles.teamNameSmall, { color: colors.textPrimary }]}>{selectedAnalysis.home_team}</Text>
                                        <View style={styles.vsCircleSmall}>
                                            <Text style={[styles.vsTextSmall, { color: colors.textMuted }]}>VS</Text>
                                        </View>
                                        <Text style={[styles.teamNameSmall, { color: colors.textPrimary, textAlign: 'right' }]}>{selectedAnalysis.away_team}</Text>
                                     </View>
                                     <View style={styles.leagueTagSmall}>
                                        <Text style={[styles.leagueTextSmall, { color: colors.textMuted }]}>{selectedAnalysis.league}</Text>
                                     </View>
                                </View>

                                <View style={[styles.modalResultBanner, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                                    <View style={[styles.homeMiniStatus, { backgroundColor: cornerStatusColor(selectedAnalysis.status) }]}>
                                        <Text style={styles.homeMiniStatusText}>{cornerStatusLabel(selectedAnalysis.status)}</Text>
                                    </View>
                                    {selectedAnalysis.actual_corners != null && selectedAnalysis.actual_corners !== undefined && (
                                        <Text style={[styles.modalResultCorners, { color: colors.textSecondary }]}>
                                            {t('results.actual_corners')}: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{selectedAnalysis.actual_corners}</Text>
                                        </Text>
                                    )}
                                </View>

                                <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary }]}>
                                    <View style={styles.summaryTop}>
                                        <View>
                                            <Text style={[styles.summaryTitle, { color: colors.textMuted }]}>
                                                {t('home.strategy')}
                                            </Text>
                                            <Text style={[styles.summaryValue, { color: colors.accentOrange }]}>
                                                {selectedAnalysis.avg_prediction}
                                            </Text>
                                        </View>
                                        <View style={[styles.summaryCircle, { borderColor: colors.accentOrange }]}>
                                            <Zap size={18} color={colors.accentOrange} style={{ marginBottom: 2 }} />
                                            <Text style={[styles.summaryCircleText, { color: colors.accentOrange }]}>{selectedAnalysis.confidence}%</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
                                    
                                    <View style={styles.summaryBottom}>
                                        <View style={styles.summaryInfoItem}>
                                            <Target size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
                                            <Text style={[styles.summaryInfoText, { color: colors.textPrimary }]}>
                                                {t('home.main_range')}: {selectedAnalysis.probable_range_min}–{selectedAnalysis.probable_range_max}
                                            </Text>
                                        </View>
                                        <View style={styles.summaryInfoItem}>
                                            <ShieldCheck size={14} color={colors.statusGreen} style={{ marginRight: 6 }} />
                                            <Text style={[styles.summaryInfoText, { color: colors.textPrimary }]}>
                                                {t('home.high_confidence')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {selectedAnalysis.statistical_distribution && selectedAnalysis.statistical_distribution.length > 0 && (
                                    <View style={[styles.distributionCard, { backgroundColor: colors.backgroundSecondary }]}>
                                        <View style={styles.cardHeaderWithIcon}>
                                            <BarChart3 size={18} color={colors.accentOrange} style={{ marginRight: 8 }} />
                                            <Text style={[styles.distributionTitle, { color: colors.textPrimary }]}>
                                                {t('home.statistical_distribution')}
                                            </Text>
                                        </View>
                                        
                                        {selectedAnalysis.statistical_distribution.map((dist) => (
                                            <View key={dist.id} style={styles.distributionRow}>
                                                <Text style={[styles.distributionThreshold, { color: colors.textSecondary }]}>
                                                    {dist.threshold}+
                                                </Text>
                                                <View style={[styles.distributionBar, { backgroundColor: colors.backgroundPrimary }]}>
                                                    <LinearGradient
                                                        colors={[colors.accentOrange, '#FF8C00']}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={[
                                                            styles.distributionBarFill, 
                                                            { width: `${dist.probability}%` }
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

                                {selectedAnalysis.team_statistics && selectedAnalysis.team_statistics.length > 0 && (
                                    <View style={[styles.trendsCard, { backgroundColor: colors.backgroundSecondary }]}>
                                        <View style={styles.cardHeaderWithIcon}>
                                            <TrendingUp size={18} color={colors.accentOrange} style={{ marginRight: 8 }} />
                                            <Text style={[styles.trendsTitle, { color: colors.textPrimary }]}>
                                                {t('home.team_trends')}
                                            </Text>
                                        </View>
                                        
                                        {selectedAnalysis.team_statistics.map((stats, idx) => (
                                            <View key={stats.id} style={[styles.teamStatsSection, idx !== 0 && styles.teamStatsSectionBorder]}>
                                                <View style={styles.teamTypeHeader}>
                                                    <View style={[styles.indicatorDot, { backgroundColor: stats.team_type === 'home' ? colors.accentOrange : colors.statusBlue }]} />
                                                    <Text style={[styles.teamStatsTitle, { color: colors.textPrimary }]}>
                                                        {stats.team_type === 'home' ? t('home.home_team') : t('home.away_team')}
                                                    </Text>
                                                </View>
                                                
                                                <View style={styles.statsList}>
                                                    {stats.team_type === 'home' ? (
                                                        <>
                                                            <View style={styles.statLine}>
                                                                <View style={styles.statLineLabelRow}>
                                                                    <Target size={12} color={colors.textMuted} style={{ marginRight: 6 }} />
                                                                    <Text style={[styles.statLineLabel, { color: colors.textSecondary }]}>{t('home.offensive_average')}</Text>
                                                                </View>
                                                                <Text style={[styles.statLineValue, { color: colors.accentOrange }]}>{stats.offensive_avg}</Text>
                                                            </View>
                                                            <View style={styles.statLine}>
                                                                <View style={styles.statLineLabelRow}>
                                                                    <TrendingUp size={12} color={colors.textMuted} style={{ marginRight: 6 }} />
                                                                    <Text style={[styles.statLineLabel, { color: colors.textSecondary }]}>{t('home.home_intensity')}</Text>
                                                                </View>
                                                                <Text style={[styles.statLineValue, { color: colors.textPrimary }]}>{stats.home_intensity}</Text>
                                                            </View>
                                                            <View style={styles.statLine}>
                                                                <View style={styles.statLineLabelRow}>
                                                                    <ShieldCheck size={12} color={colors.textMuted} style={{ marginRight: 6 }} />
                                                                    <Text style={[styles.statLineLabel, { color: colors.textSecondary }]}>{t('home.historical_consistency')}</Text>
                                                                </View>
                                                                <Text style={[styles.statLineValue, { color: colors.statusGreen }]}>{stats.consistency}%</Text>
                                                            </View>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <View style={styles.statLine}>
                                                                <View style={styles.statLineLabelRow}>
                                                                    <TrendingDown size={12} color={colors.textMuted} style={{ marginRight: 6 }} />
                                                                    <Text style={[styles.statLineLabel, { color: colors.textSecondary }]}>{t('home.pressure_conceded')}</Text>
                                                                </View>
                                                                <Text style={[styles.statLineValue, { color: colors.accentOrange }]}>{stats.pressure_conceded}</Text>
                                                            </View>
                                                            <View style={styles.statLine}>
                                                                <View style={styles.statLineLabelRow}>
                                                                    <BarChart3 size={12} color={colors.textMuted} style={{ marginRight: 6 }} />
                                                                    <Text style={[styles.statLineLabel, { color: colors.textSecondary }]}>{t('home.corners_conceded_avg')}</Text>
                                                                </View>
                                                                <Text style={[styles.statLineValue, { color: colors.textPrimary }]}>{stats.corners_conceded_avg}</Text>
                                                            </View>
                                                            <View style={styles.statLine}>
                                                                <View style={styles.statLineLabelRow}>
                                                                    <TrendingUp size={12} color={colors.textMuted} style={{ marginRight: 6 }} />
                                                                    <Text style={[styles.statLineLabel, { color: colors.textSecondary }]}>{t('home.away_intensity')}</Text>
                                                                </View>
                                                                <Text style={[styles.statLineValue, { color: colors.textPrimary }]}>{stats.away_intensity}</Text>
                                                            </View>
                                                        </>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                
                                <TouchableOpacity 
                                    onPress={() => setShowDetail(false)}
                                    style={[styles.modalCloseFooter, { backgroundColor: colors.backgroundTertiary }]}
                                >
                                    <Text style={styles.modalCloseFooterText}>{t('common.close')}</Text>
                                </TouchableOpacity>
                                
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        ) : null}
                    </View>
                </View>
</Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { 
        paddingHorizontal: 20, 
        paddingBottom: 24, 
        borderBottomLeftRadius: 32, 
        borderBottomRightRadius: 32,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    logoText: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
    dateText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 2, textTransform: 'capitalize' },
    headerActions: { flexDirection: 'row', gap: 10 },
    headerActionBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    
    headerStatsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    headerStatCard: { 
        flex: 1, 
        padding: 12, 
        borderRadius: 20, 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    headerStatValue: { fontSize: 18, fontWeight: '900', marginVertical: 2 },
    headerStatLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

    content: { flex: 1 },
    sectionsContainer: { paddingVertical: 12 },
    section: { paddingHorizontal: 16, marginBottom: 8 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, marginTop: 12 },
    premiumTitleRow: { flexDirection: 'row', alignItems: 'center' },
    sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    sectionTitleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    sectionTitleBadgeText: { fontSize: 13, fontWeight: '800' },
    
    skeletonCard: { height: 180, marginHorizontal: 16, marginBottom: 16, borderRadius: 24, borderWidth: 1, padding: 20 },
    skeletonHeader: { height: 20, width: '40%', backgroundColor: 'rgba(128,128,128,0.1)', borderRadius: 10, marginBottom: 20 },
    skeletonBody: { height: 60, width: '100%', backgroundColor: 'rgba(128,128,128,0.05)', borderRadius: 12, marginBottom: 20 },
    skeletonFooter: { height: 40, width: '100%', backgroundColor: 'rgba(128,128,128,0.1)', borderRadius: 12 },

    emptyState: { margin: 20, padding: 48, borderRadius: 32, alignItems: 'center', gap: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(128,128,128,0.2)' },
    emptyText: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
    emptySubtext: { fontSize: 14, textAlign: 'center', opacity: 0.7 },
    
    analysisCard: { 
        padding: 20, 
        borderRadius: 28, 
        marginBottom: 16, 
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    tierBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
    tierBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
    confidenceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,0,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    confidenceValue: { fontSize: 15, fontWeight: '900' },
    
    teamsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    teamContainer: { flex: 1, alignItems: 'center', gap: 12, flexDirection: 'row' },
    logoContainer: { width: 48, height: 48, borderRadius: 24, padding: 3, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    teamLogo: { width: 38, height: 38, borderRadius: 19 },
    teamLogoPlaceholder: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    teamName: { fontSize: 16, fontWeight: '800', flex: 1 },
    vsContainer: { width: 40, alignItems: 'center', justifyContent: 'center' },
    vsCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    vsText: { fontSize: 10, fontWeight: '900', opacity: 0.6 },
    
    matchInfoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    infoTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(128,128,128,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    infoTagText: { fontSize: 12, fontWeight: '700' },

    homeAnalysisResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 14,
    },
    homeMiniStatus: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
    homeMiniStatusText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    homeActualCorners: { fontSize: 13, flex: 1, textAlign: 'right' },
    homeResultBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 10 },
    homeResultBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
    modalResultBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 14,
    },
    modalResultCorners: { fontSize: 13, flex: 1 },
    multipleModalResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        marginTop: 4,
        borderTopWidth: 1,
        gap: 10,
    },
    multipleModalResultLabel: { fontSize: 12, fontWeight: '700', flex: 1 },
    multipleGameResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    multipleGameResultCorners: { fontSize: 13 },
    
    divider: { height: 1, width: '100%', opacity: 0.1, marginBottom: 16 },
    
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    statItem: { flex: 1, gap: 6 },
    statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.6 },
    statValue: { fontSize: 18, fontWeight: '900' },
    
    viewAnalysisBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 16, 
        borderRadius: 18,
        gap: 8,
        shadowColor: '#FF6B00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
    },
    viewAnalysisBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
    
    lockedContent: { alignItems: 'center', paddingVertical: 10 },
    lockIconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,107,0,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    lockedTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
    lockedText: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22, paddingHorizontal: 20 },
    lockedActions: { flexDirection: 'row', gap: 12, width: '100%' },
    watchAdBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 18, borderWidth: 2 },
    watchAdText: { fontSize: 14, fontWeight: '800' },
    premiumBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 18 },
    premiumBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
    
    bannerWrapper: { alignItems: 'center', width: '100%', position: 'absolute', bottom: 0, backgroundColor: 'transparent' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    rewardedModal: { padding: 32, borderRadius: 40, alignItems: 'center', margin: 20, marginBottom: 40 },
    rewardedIconCircle: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
    rewardedTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
    rewardedSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24, opacity: 0.8 },
    rewardedBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', padding: 18, borderRadius: 20, marginBottom: 12, width: '100%' },
    rewardedBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    rewardedBtnOutline: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', padding: 18, borderRadius: 20, borderWidth: 1.5, marginBottom: 12, width: '100%' },
    rewardedBtnOutlineText: { fontSize: 17, fontWeight: '800' },
    rewardedCancel: { padding: 16 },
    rewardedCancelText: { fontSize: 15, fontWeight: '700' },
    
    modalContent: { flex: 1, marginTop: 60, borderTopLeftRadius: 48, borderTopRightRadius: 48, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 20 },
    modalTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },
    modalHeaderActions: { flexDirection: 'row', gap: 10 },
    modalActionBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    modalCloseBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    modalCloseText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    modalBody: { flex: 1, paddingHorizontal: 20 },
    
    modalAnalysisHeader: { padding: 20, borderRadius: 24, marginBottom: 20 },
    teamsHeaderSmall: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    teamNameSmall: { fontSize: 16, fontWeight: '800', flex: 1 },
    vsCircleSmall: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(128,128,128,0.1)', justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
    vsTextSmall: { fontSize: 8, fontWeight: '900', opacity: 0.6 },
    leagueTagSmall: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(128,128,128,0.05)' },
    leagueTextSmall: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    
    summaryCard: { padding: 28, borderRadius: 28, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    summaryValue: { fontSize: 56, fontWeight: '900', letterSpacing: -3 },
    summaryCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3.5, justifyContent: 'center', alignItems: 'center' },
    summaryCircleText: { fontSize: 22, fontWeight: '900' },
    summaryDivider: { height: 1, width: '100%', marginVertical: 24, opacity: 0.08 },
    summaryBottom: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryInfoItem: { flexDirection: 'row', alignItems: 'center' },
    summaryInfoText: { fontSize: 14, fontWeight: '800' },
    
    distributionCard: { padding: 24, borderRadius: 28, marginBottom: 20 },
    cardHeaderWithIcon: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    distributionTitle: { fontSize: 18, fontWeight: '900' },
    distributionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    distributionThreshold: { width: 50, fontSize: 15, fontWeight: '900' },
    distributionBar: { flex: 1, height: 12, borderRadius: 6, marginHorizontal: 14, overflow: 'hidden' },
    distributionBarFill: { height: '100%', borderRadius: 6 },
    distributionProbability: { width: 50, fontSize: 15, fontWeight: '900', textAlign: 'right' },
    
    trendsCard: { padding: 24, borderRadius: 28, marginBottom: 24 },
    trendsTitle: { fontSize: 18, fontWeight: '900' },
    teamStatsSection: { paddingTop: 20 },
    teamStatsSectionBorder: { borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.1)', marginTop: 20 },
    teamTypeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    indicatorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    teamStatsTitle: { fontSize: 16, fontWeight: '900' },
    statsList: { gap: 14 },
    statLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statLineLabelRow: { flexDirection: 'row', alignItems: 'center' },
    statLineLabel: { fontSize: 14, fontWeight: '600' },
    statLineValue: { fontSize: 15, fontWeight: '900' },
    
    modalCloseFooter: { paddingVertical: 20, borderRadius: 24, alignItems: 'center', marginTop: 10, marginBottom: 20 },
    modalCloseFooterText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

    // ── Estilos do modal de múltipla ──────────────────────────────────────
    multipleModalHeader: { padding: 16, borderRadius: 16, marginBottom: 12 },
    multipleModalBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    multipleModalBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    multipleModalBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    multipleModalOddBadge: { alignItems: 'flex-end' },
    multipleModalOddLabel: { fontSize: 11, fontWeight: '500' },
    multipleModalOddValue: { fontSize: 22, fontWeight: '900' },
    multipleModalConfRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1 },
    multipleModalConfLabel: { flex: 1, fontSize: 13, fontWeight: '500' },
    multipleModalConfValue: { fontSize: 18, fontWeight: '800' },

    multipleGameCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
    multipleGameIndexRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    multipleGameIndex: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    multipleGameIndexText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    multipleGameLeague: { flex: 1, fontSize: 12, fontWeight: '500' },
    multipleGameTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    multipleGameTime: { fontSize: 12, fontWeight: '600' },

    multipleGameTeamsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    multipleGameTeam: { flex: 1, alignItems: 'flex-start', gap: 6 },
    multipleGameLogo: { width: 36, height: 36, borderRadius: 18 },
    multipleGameLogoPlaceholder: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    multipleGameTeamName: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
    multipleGameVs: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
    multipleGameVsText: { fontSize: 10, fontWeight: '700' },

    multipleGameStrategyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    multipleGameStrategyLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
    multipleGameStrategyValue: { fontSize: 15, fontWeight: '800' },
    multipleGameConfBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    multipleGameConfText: { fontSize: 13, fontWeight: '700' },

    multipleGameRationale: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
    multipleGameRationaleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    multipleGameRationaleTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    multipleGameRationaleText: { fontSize: 13, lineHeight: 20 },
    multipleGameConfBar: { gap: 4 },
    multipleGameConfBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    multipleGameConfBarFill: { height: 6, borderRadius: 3 },
    multipleGameConfBarLabel: { fontSize: 11, fontWeight: '500' },

    multipleSummaryCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5 },
    multipleSummaryGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginVertical: 12 },
    multipleSummaryItem: { alignItems: 'center', gap: 4, flex: 1 },
    multipleSummaryLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
    multipleSummaryValue: { fontSize: 22, fontWeight: '900' },
    multipleSummaryDivider: { width: 1, height: 36 },
    multipleSummaryNote: { fontSize: 12, lineHeight: 18, textAlign: 'center', fontStyle: 'italic' },
});

export default HomeScreen;

