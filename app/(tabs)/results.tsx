import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, TrendingUp, Crown, Zap, Layers } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAnalysesByDate } from '../../services/analyses-service';
import { AnalysisWithDetails, MultipleGame } from '../../types';
import { AdBanner } from '../../components/AdBanner';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { getTeamLogoFallback, getTeamInitials } from '../../services/logo-service';

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

    // Separa múltiplas encerradas das pendentes (do dia)
    const settledMultiples = visiblePicks.filter(p => p.is_multiple === true && p.status !== 'pending');
    const pendingMultiples = visiblePicks.filter(p => p.is_multiple === true && p.status === 'pending');
    const settledIndividual = visiblePicks.filter(p => !p.is_multiple && p.status !== 'pending');
    const pendingIndividual = visiblePicks.filter(p => !p.is_multiple && p.status === 'pending');

    // ── Stats por tier ────────────────────────────────────────────────────
    const calcStats = (picks: AnalysisWithDetails[]) => {
        const settled = picks.filter(p => p.status !== 'pending');
        const won = settled.filter(p => p.status === 'correct').length;
        const lost = settled.filter(p => p.status === 'incorrect').length;
        const total = settled.length;
        return { won, lost, total };
    };

    const premiumPicks = settledIndividual.filter(p => p.tier === 'premium' || p.tier === 'superodd');
    const freePicks    = settledIndividual.filter(p => p.tier === 'free');
    const statsAll     = calcStats(settledIndividual);
    const statsPremium = calcStats(premiumPicks);
    const statsFree    = calcStats(freePicks);

    // Separa múltiplas por tier
    const premiumMultiples = visiblePicks.filter(p => p.is_multiple === true && (p.tier === 'premium' || p.tier === 'superodd'));
    const freeMultiples = visiblePicks.filter(p => p.is_multiple === true && p.tier === 'free');

    // Jogo do dia (pendentes) - para exibir na aba resultados
    const visibleMultiples = pendingMultiples;
    const pendingPicks = [...pendingMultiples, ...pendingIndividual];
    
    // Filtro incluindo múltiplas e individuais
    const premiumItems = [...premiumPicks, ...pendingMultiples.filter(p => p.tier === 'premium' || p.tier === 'superodd')];
    const freeItems = [...freeMultiples, ...settledIndividual.filter(p => p.tier === 'free'), ...pendingMultiples.filter(p => p.tier === 'free'), ...pendingIndividual.filter(p => p.tier === 'free')];
    const uniqueById = (arr: AnalysisWithDetails[]) => {
        const seen = new Map<string, AnalysisWithDetails>();
        arr.forEach(item => {
            if (!seen.has(item.id)) {
                seen.set(item.id, item);
            }
        });
        return Array.from(seen.values());
    };

    const filteredPicks = uniqueById(tierFilter === 'premium' 
        ? premiumItems
        : tierFilter === 'free'
        ? freeItems
        : [...settledMultiples, ...settledIndividual, ...pendingMultiples, ...pendingIndividual]);

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
                    <View style={styles.statsWonLost}>
                        <CheckCircle size={13} color={colors.statusGreen} />
                        <Text style={[styles.statsWonLostText, { color: colors.statusGreen }]}>{stats.won}</Text>
                    </View>
                    <View style={styles.statsWonLost}>
                        <XCircle size={13} color={colors.statusRed} />
                        <Text style={[styles.statsWonLostText, { color: colors.statusRed }]}>{stats.lost}</Text>
                    </View>
                    <Text style={[styles.statsBlockSub, { color: colors.textMuted }]}>{t('results.won_abbr')} / {t('results.lost_abbr')}</Text>
                </View>
                <View style={[styles.statsBlockDivider, { backgroundColor: colors.cardBorder }]} />
                <View style={styles.statsBlockItem}>
                    <Text style={[styles.statsBlockValue, { color: colors.textPrimary }]}>{stats.total}</Text>
                    <Text style={[styles.statsBlockSub, { color: colors.textMuted }]}>
                        {t('results.settled')}
                    </Text>
                </View>
            </View>
            {stats.total === 0 && (
                <Text style={[styles.statsBlockEmpty, { color: colors.textMuted }]}>
                    {t('results.no_settled')}
                </Text>
            )}
        </View>
    );

    // ── Renderizador de card de múltipla nos resultados ──────────────────
    const renderMultipleResultCard = (pick: AnalysisWithDetails) => {
        const isExpanded = expandedPick === pick.id;
        const statusColor = getStatusColor(pick.status);
        const isPremiumPick = pick.tier === 'premium' || pick.tier === 'superodd';
        const isSuperOdd = pick.tier === 'superodd';
        const tierAccent = isPremiumPick ? colors.accentOrange : colors.statusGreen;
        const games = pick.games || [];

        return (
            <TouchableOpacity
                key={pick.id}
                style={[
                    styles.resultCard,
                    {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: isPremiumPick ? colors.accentOrange + '55' : colors.cardBorder,
                        borderWidth: isPremiumPick ? 1.5 : 1,
                    },
                ]}
                onPress={() => setExpandedPick(isExpanded ? null : pick.id)}
                activeOpacity={0.7}
            >
                {/* Badge tier + múltipla */}
                <View style={styles.tierRow}>
                    <View style={[styles.tierBadge, { backgroundColor: tierAccent + '22', borderColor: tierAccent }]}>
                        <Layers size={11} color={tierAccent} />
                        <Text style={[styles.tierBadgeText, { color: tierAccent }]}>
                            {isSuperOdd ? 'SUPERODD' : (isPremiumPick ? t('common.premium').toUpperCase() : t('common.free').toUpperCase())} • {t('home.multiple').toUpperCase()} {games.length}X
                        </Text>
                    </View>
                </View>

                <View style={styles.resultHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusBadgeText}>{getStatusLabel(pick.status)}</Text>
                    </View>
                    <Text style={[styles.resultConfidence, { color: tierAccent }]}>
                        {pick.combined_odd?.toFixed(2)}x
                    </Text>
                </View>

                {/* Jogos da múltipla */}
                {games.slice(0, isExpanded ? games.length : 2).map((game: MultipleGame, idx: number) => (
                    <View
                        key={`${game.fixture_id}-${idx}`}
                        style={[styles.multipleGameRow, { borderTopColor: colors.cardBorder }]}
                    >
                        <View style={styles.multipleGameTeamsRow}>
                            {(() => {
                                const homeLogo = getTeamLogoFallback(game.home_team, game.home_logo);
                                return homeLogo ? (
                                    <Image source={{ uri: homeLogo }} style={styles.gameLogo} resizeMode="contain" />
                                ) : (
                                    <View style={[styles.gameLogo, styles.gameLogoPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
                                        <Text style={{ color: colors.textMuted, fontSize: 9 }}>{getTeamInitials(game.home_team)}</Text>
                                    </View>
                                );
                            })()}
                            <Text style={[styles.multipleGameTeams, { color: colors.textPrimary }]} numberOfLines={1}>
                                {game.home_team}
                            </Text>
                            <Text style={[styles.vsText, { color: colors.textMuted, marginHorizontal: 4 }]}>vs</Text>
                            <Text style={[styles.multipleGameTeams, { color: colors.textPrimary }]} numberOfLines={1}>
                                {game.away_team}
                            </Text>
                            {(() => {
                                const awayLogo = getTeamLogoFallback(game.away_team, game.away_logo);
                                return awayLogo ? (
                                    <Image source={{ uri: awayLogo }} style={styles.gameLogo} resizeMode="contain" />
                                ) : (
                                    <View style={[styles.gameLogo, styles.gameLogoPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
                                        <Text style={{ color: colors.textMuted, fontSize: 9 }}>{getTeamInitials(game.away_team)}</Text>
                                    </View>
                                );
                            })()}
                        </View>
                        <View style={styles.multipleGameRight}>
                            <Text style={[styles.multipleGameStrategy, { color: colors.accentOrange }]}>
                                {game.strategy?.toUpperCase()} {game.prediction}
                            </Text>
                            {game.result !== 'pending' && (
                                <View style={[styles.miniStatusBadge, { backgroundColor: getStatusColor(game.result) }]}>
                                    <Text style={styles.miniStatusText}>{getStatusLabel(game.result)}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                ))}

                {!isExpanded && games.length > 2 && (
                    <Text style={[styles.moreGamesText, { color: colors.textMuted }]}>
                        +{games.length - 2} {t('results.more_games')}
                    </Text>
                )}

                {isExpanded && (
                    <View style={[styles.selectionsExpanded, { borderTopColor: colors.cardBorder }]}>
                        <Text style={[styles.expandedTitle, { color: colors.textPrimary }]}>
                            {t('results.multiple_details')}
                        </Text>
                        <Text style={[styles.expandedText, { color: colors.textSecondary }]}>
                            {t('home.combined_odd')}: {pick.combined_odd?.toFixed(2)}x
                        </Text>
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
                                f === 'all'     ? t('results.filter_all') :
                                f === 'premium' ? t('common.premium') : t('common.free');
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

                    {/* ── Lista de análises (múltiplas + individuais) ── */}
                    <View style={styles.section}>
                        {picksLoading ? (
                            <ActivityIndicator size="large" color={colors.accentOrange} style={{ marginTop: 40 }} />
                        ) : filteredPicks.length === 0 ? (
                            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('results.no_results')}</Text>
                            </View>
                        ) : (
                            filteredPicks.map((pick) => {
                                // Se for múltipla, usar o renderizador de múltiplas
                                if (pick.is_multiple) {
                                    return renderMultipleResultCard(pick);
                                }
                                const isExpanded = expandedPick === pick.id;
                                const statusColor = getStatusColor(pick.status);
                                const isPremiumPick = pick.tier === 'premium' || pick.tier === 'superodd';
                                const isSuperOddPick = pick.tier === 'superodd';
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
                                                    {isSuperOddPick ? 'SUPERODD' : (isPremiumPick ? 'PREMIUM' : 'FREE')}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.resultHeader}>
                                            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                                <Text style={styles.statusBadgeText}>{getStatusLabel(pick.status)}</Text>
                                            </View>
                                            <Text style={[styles.resultConfidence, { color: isPremiumPick ? colors.accentOrange : colors.textPrimary }]}>
                                                {pick.combined_odd ? `${pick.combined_odd}x` : (pick.selection_odd ? `${pick.selection_odd}x` : '')}
                                            </Text>
                                        </View>

                                        <View style={styles.teamsRow}>
                                            <View style={styles.teamContainer}>
                                                {(() => {
                                                    const homeLogo = getTeamLogoFallback(pick.home_team, pick.home_team_logo);
                                                    return homeLogo ? (
                                                        <Image source={{ uri: homeLogo }} style={styles.teamLogo} resizeMode="contain" />
                                                    ) : (
                                                        <View style={[styles.teamLogo, styles.teamLogoPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
                                                            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{getTeamInitials(pick.home_team)}</Text>
                                                        </View>
                                                    );
                                                })()}
                                                <Text style={[styles.teamName, { color: colors.textPrimary }]} numberOfLines={1}>
                                                    {pick.home_team}
                                                </Text>
                                            </View>
                                            <Text style={[styles.vsText, { color: colors.textMuted }]}>vs</Text>
                                            <View style={[styles.teamContainer, { justifyContent: 'flex-end' }]}>
                                                {(() => {
                                                    const awayLogo = getTeamLogoFallback(pick.away_team, pick.away_team_logo);
                                                    return awayLogo ? (
                                                        <Image source={{ uri: awayLogo }} style={styles.teamLogo} resizeMode="contain" />
                                                    ) : (
                                                        <View style={[styles.teamLogo, styles.teamLogoPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
                                                            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{getTeamInitials(pick.away_team)}</Text>
                                                        </View>
                                                    );
                                                })()}
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

                                        {pick.status !== 'pending' && pick.actual_corners != null && pick.actual_corners !== undefined && (
                                            <Text style={[styles.resultOutcomeLine, { color: colors.textSecondary }]}>
                                                {t('results.actual_corners')}: <Text style={{ fontWeight: '900', color: colors.textPrimary }}>{pick.actual_corners}</Text>
                                                {' · '}
                                                <Text style={{ color: getStatusColor(pick.status), fontWeight: '800' }}>
                                                    {getStatusLabel(pick.status)}
                                                </Text>
                                            </Text>
                                        )}

                                        {isExpanded && (
                                            <View style={[styles.selectionsExpanded, { borderTopColor: colors.cardBorder }]}>
                                                <Text style={[styles.expandedTitle, { color: colors.textPrimary }]}>
                                                    {t('home.prediction_details') || 'Detalhes da Previsão'}
                                                </Text>
                                                <Text style={[styles.expandedText, { color: colors.textSecondary }]}>
                                                    {t('home.average_prediction')}: {pick.avg_prediction?.toFixed(1)} {t('home.corners')}
                                                </Text>
                                                <Text style={[styles.expandedText, { color: colors.textSecondary }]}>
                                                    {t('home.probable_range')}: {pick.probable_range_min} - {pick.probable_range_max}
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
    teamLogo: { width: 32, height: 32, borderRadius: 16 },
    teamLogoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    teamName: { fontSize: 13, fontWeight: '600', flex: 1 },
    vsText: { fontSize: 11, fontWeight: 'bold', marginHorizontal: 8 },
    resultSubtitle: { fontSize: 12, marginBottom: 8 },
    predictionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    predictionLabel: { fontSize: 13 },
    predictionValue: { fontSize: 14, fontWeight: '700' },
    resultOutcomeLine: { fontSize: 13, marginBottom: 6, marginTop: 2 },

    selectionsExpanded: { borderTopWidth: 1, paddingTop: 12, marginTop: 12, gap: 4 },
    expandedTitle: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    expandedText: { fontSize: 12 },
    expandIcon: { position: 'absolute', right: 16, bottom: 16 },

    emptyState: { padding: 32, borderRadius: 12, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    bannerWrapper: { alignItems: 'center', width: '100%' },

    // Múltiplas
    multiplesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    multiplesHeaderText: { fontSize: 15, fontWeight: '700', flex: 1 },
    multipleGameRow: { borderTopWidth: 1, paddingTop: 8, marginTop: 8, gap: 4 },
    multipleGameTeamsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    gameLogo: { width: 20, height: 20, borderRadius: 10 },
    gameLogoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    multipleGameTeams: { fontSize: 12, fontWeight: '600' },
    multipleGameRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    multipleGameStrategy: { fontSize: 12, fontWeight: '700' },
    miniStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    miniStatusText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
    moreGamesText: { fontSize: 11, marginTop: 6, fontStyle: 'italic' },
});
