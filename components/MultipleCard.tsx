import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Zap, Calendar, Clock, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { CornerAnalysis, MultipleGame } from '../types';

interface MultipleCardProps {
    analysis: CornerAnalysis;
    index: number;
    onPress: () => void;
}

export function MultipleCard({ analysis, index, onPress }: MultipleCardProps) {
    const { colors, resolvedTheme } = useTheme();
    const { t, i18n } = useTranslation();
    
    if (!analysis.is_multiple || !analysis.games) {
        return null;
    }
    
    const isPremium = analysis.tier === 'premium';
    const games = analysis.games;

    const legResultColor = (r: string) => {
        if (r === 'correct') return colors.statusGreen;
        if (r === 'incorrect') return colors.statusRed;
        if (r === 'void') return colors.textMuted;
        return colors.statusPending;
    };
    const legResultLabel = (r: string) => {
        if (r === 'correct') return t('results.won') || 'GREEN';
        if (r === 'incorrect') return t('results.lost') || 'RED';
        if (r === 'void') return t('results.void') || 'VOID';
        return t('common.pending') || 'PENDING';
    };
    
    const formatKickoffTime = (kickoffAt: string) => {
        const date = new Date(kickoffAt);
        return date.toLocaleTimeString(i18n.language === 'pt' ? 'pt-BR' : i18n.language === 'es' ? 'es-ES' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    
    return (
        <Animated.View 
            entering={FadeInUp.delay(index * 100).duration(500)}
            layout={Layout.springify()}
        >
            <TouchableOpacity
                style={[
                    styles.multipleCard,
                    {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: isPremium ? colors.accentOrange : colors.cardBorder,
                        borderWidth: isPremium ? 1.5 : 1,
                        shadowColor: colors.black,
                    }
                ]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <LinearGradient
                        colors={isPremium ? ['#FF8C00', colors.accentOrange] : [colors.backgroundTertiary, colors.backgroundTertiary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.multipleBadge}
                    >
                        {isPremium && <Crown color="#FFF" size={14} style={{ marginRight: 4 }} />}
                        <Text style={[
                            styles.multipleBadgeText,
                            { color: isPremium ? '#FFF' : colors.textMuted }
                        ]}>
                            {t('home.multiple')} {games.length}X
                        </Text>
                    </LinearGradient>
                    
                    <View style={styles.cardHeaderRight}>
                        <View style={styles.confidenceRow}>
                            <Zap size={14} color={colors.accentOrange} style={{ marginRight: 4 }} />
                            <Text style={[styles.confidenceValue, { color: colors.accentOrange }]}>
                                {analysis.combined_confidence}%
                            </Text>
                        </View>
                        {analysis.status && analysis.status !== 'pending' && (
                            <View style={[styles.multipleCardStatusPill, { backgroundColor: legResultColor(analysis.status) }]}>
                                <Text style={styles.multipleCardStatusPillText}>{legResultLabel(analysis.status)}</Text>
                            </View>
                        )}
                    </View>
                </View>
                
                {/* Combined Odd */}
                <View style={[styles.oddContainer, { backgroundColor: colors.backgroundPrimary }]}>
                    <Text style={[styles.oddLabel, { color: colors.textMuted }]}>
                        {t('home.combined_odd')}
                    </Text>
                    <Text style={[styles.oddValue, { color: colors.accentOrange }]}>
                        {analysis.combined_odd?.toFixed(2)}x
                    </Text>
                </View>
                
                {/* Games List */}
                <View style={styles.gamesList}>
                    {games.map((game, idx) => (
                        <View 
                            key={`${game.fixture_id}-${idx}`}
                            style={[
                                styles.gameRow,
                                { 
                                    borderBottomColor: colors.cardBorder,
                                    borderBottomWidth: idx < games.length - 1 ? 1 : 0
                                }
                            ]}
                        >
                            <View style={styles.gameTeams}>
                                <View style={styles.teamRow}>
                                    {game.home_logo && (
                                        <Image 
                                            source={{ uri: game.home_logo }} 
                                            style={styles.miniLogo} 
                                        />
                                    )}
                                    <Text 
                                        style={[styles.teamText, { color: colors.textPrimary }]}
                                        numberOfLines={1}
                                    >
                                        {game.home_team}
                                    </Text>
                                </View>
                                
                                <Text style={[styles.vsText, { color: colors.textMuted }]}>vs</Text>
                                
                                <View style={styles.teamRow}>
                                    {game.away_logo && (
                                        <Image 
                                            source={{ uri: game.away_logo }} 
                                            style={styles.miniLogo} 
                                        />
                                    )}
                                    <Text 
                                        style={[styles.teamText, { color: colors.textPrimary }]}
                                        numberOfLines={1}
                                    >
                                        {game.away_team}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={styles.gameInfo}>
                                <View style={styles.strategyBadge}>
                                    {game.strategy === 'over' ? (
                                        <TrendingUp size={12} color={colors.accentOrange} />
                                    ) : (
                                        <TrendingDown size={12} color={colors.accentOrange} />
                                    )}
                                    <Text style={[styles.strategyText, { color: colors.accentOrange }]}>
                                        {t(`home.${game.strategy}`)} {game.prediction}
                                    </Text>
                                </View>
                                
                                <View style={styles.timeRow}>
                                    <Clock size={10} color={colors.textMuted} />
                                    <Text style={[styles.timeText, { color: colors.textMuted }]}>
                                        {formatKickoffTime(game.kickoff_at)}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.gameResultRow, { borderTopColor: colors.cardBorder }]}>
                                <View style={[styles.legStatusPill, { backgroundColor: legResultColor(game.result || 'pending') }]}>
                                    <Text style={styles.legStatusPillText}>{legResultLabel(game.result || 'pending')}</Text>
                                </View>
                                {game.actual_corners != null && game.actual_corners !== undefined && (
                                    <Text style={[styles.legCornersText, { color: colors.textSecondary }]}>
                                        {t('results.actual_corners')}: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{game.actual_corners}</Text>
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
                
                {/* View Button */}
                <TouchableOpacity
                    onPress={onPress}
                    style={{ marginTop: 12 }}
                >
                    <LinearGradient
                        colors={isPremium ? [colors.accentOrange, '#FF8C00'] : [colors.backgroundTertiary, colors.backgroundTertiary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.viewBtn}
                    >
                        <Text style={[
                            styles.viewBtnText,
                            { color: isPremium ? '#FFF' : (resolvedTheme === 'light' ? '#CC5500' : colors.accentOrange) }
                        ]}>
                            {t('home.view_details')}
                        </Text>
                        <ChevronRight 
                            size={16} 
                            color={isPremium ? '#FFF' : (resolvedTheme === 'light' ? '#CC5500' : colors.accentOrange)} 
                        />
                    </LinearGradient>
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    multipleCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    multipleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    multipleBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    confidenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    confidenceValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    oddContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    oddLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    oddValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    gamesList: {
        gap: 0,
    },
    gameRow: {
        paddingVertical: 12,
    },
    gameTeams: {
        gap: 6,
        marginBottom: 8,
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    miniLogo: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    teamText: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    vsText: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    gameInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    strategyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    strategyText: {
        fontSize: 13,
        fontWeight: '700',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 11,
        fontWeight: '500',
    },
    gameResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    legStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    legStatusPillText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
    legCornersText: { fontSize: 12, flex: 1, textAlign: 'right' },
    multipleCardStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    multipleCardStatusPillText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
    viewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    viewBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
