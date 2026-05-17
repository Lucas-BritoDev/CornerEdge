import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Zap, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { CornerAnalysis } from '../types';
import { getTeamLogoFallback, getTeamInitials } from '../services/logo-service';

interface TeamLogoProps {
    teamName: string;
    apiLogo?: string;
    size: number;
    placeholderColor: string;
}

function TeamLogo({ teamName, apiLogo, size, placeholderColor }: TeamLogoProps) {
    const [imageError, setImageError] = useState(false);
    const [hasTriedFallback, setHasTriedFallback] = useState(false);
    
    const logoUrl = hasTriedFallback 
        ? getTeamLogoFallback(teamName, apiLogo)
        : (apiLogo && !imageError ? apiLogo : null);
    
    const handleError = () => {
        if (!hasTriedFallback) {
            setHasTriedFallback(true);
        } else {
            setImageError(true);
        }
    };
    
    if (!logoUrl) {
        return (
            <View style={[styles.miniLogoPlaceholder, { backgroundColor: placeholderColor, width: size, height: size, borderRadius: size/2 }]}>
                <Text style={[styles.miniLogoText, { fontSize: size * 0.4 }]}>
                    {getTeamInitials(teamName)}
                </Text>
            </View>
        );
    }
    
    return (
        <Image 
            source={{ uri: logoUrl }} 
            style={{ width: size, height: size, borderRadius: size/2 }}
            resizeMode="contain"
            onError={handleError}
        />
    );
}

interface MultipleCardCompactProps {
    analysis: CornerAnalysis;
    index: number;
    onPress: () => void;
}

export function MultipleCardCompact({ analysis, index, onPress }: MultipleCardCompactProps) {
    const { colors, resolvedTheme } = useTheme();
    const { t } = useTranslation();
    
    if (!analysis.is_multiple || !analysis.games) {
        return null;
    }
    
    const isPremium = analysis.tier === 'premium' || analysis.tier === 'superodd';
    const isSuperOdd = analysis.tier === 'superodd';
    const games = analysis.games;
    const gamesCount = games.length;
    
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
    
    const statusColor = analysis.status ? legResultColor(analysis.status) : colors.statusPending;
    const statusLabel = analysis.status ? legResultLabel(analysis.status) : legResultLabel('pending');
    
    return (
        <Animated.View entering={FadeInUp.delay(index * 80).duration(400)}>
            <TouchableOpacity
                style={[
                    styles.container,
                    {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: isPremium ? colors.accentOrange : colors.cardBorder,
                        borderWidth: isPremium ? 1.5 : 1,
                    }
                ]}
                onPress={onPress}
                activeOpacity={0.85}
            >
                <View style={styles.header}>
                    <LinearGradient
                        colors={isSuperOdd ? ['#FFD700', '#FF8C00'] : (isPremium ? ['#FF8C00', colors.accentOrange] : [colors.backgroundTertiary, colors.backgroundTertiary])}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.badge}
                    >
                        {isSuperOdd && <Crown color="#FFD700" size={11} style={{ marginRight: 3 }} />}
                        {!isSuperOdd && isPremium && <Crown color="#FFF" size={11} style={{ marginRight: 3 }} />}
                        <Text style={[styles.badgeText, { color: isSuperOdd ? '#FFD700' : (isPremium ? '#FFF' : colors.textMuted) }]}>
                            {isSuperOdd ? 'SUPERODD' : (t('home.multiple'))} {gamesCount}X
                        </Text>
                    </LinearGradient>
                    
                    {analysis.status && analysis.status !== 'pending' && (
                        <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                            <Text style={styles.statusPillText}>{statusLabel}</Text>
                        </View>
                    )}
                </View>
                
                <View style={styles.content}>
                    <View style={styles.oddSection}>
                        <Text style={[styles.oddLabel, { color: colors.textMuted }]}>Odd</Text>
                        <Text style={[styles.oddValue, { color: colors.accentOrange }]}>
                            {analysis.combined_odd?.toFixed(2)}x
                        </Text>
                    </View>
                    
                    <View style={styles.gamesPreview}>
                        {games.slice(0, 3).map((game, idx) => (
                            <View key={`${game.fixture_id}-${idx}`} style={styles.gamePreviewItem}>
                                <View style={styles.gameTeamsMini}>
                                    <TeamLogo 
                                        teamName={game.home_team || ''}
                                        apiLogo={game.home_logo}
                                        size={24}
                                        placeholderColor={colors.backgroundTertiary}
                                    />
                                    <Text style={[styles.miniTeamName, { color: colors.textSecondary }]} numberOfLines={1}>
                                        {game.home_team?.split(' ')[0]}
                                    </Text>
                                    <Text style={[styles.vsText, { color: colors.textMuted }]}>×</Text>
                                    <Text style={[styles.miniTeamName, { color: colors.textSecondary }]} numberOfLines={1}>
                                        {game.away_team?.split(' ')[0]}
                                    </Text>
                                    <TeamLogo 
                                        teamName={game.away_team || ''}
                                        apiLogo={game.away_logo}
                                        size={24}
                                        placeholderColor={colors.backgroundTertiary}
                                    />
                                </View>
                                <View style={styles.strategyRow}>
                                    {game.strategy === 'over' ? (
                                        <TrendingUp size={10} color={colors.accentOrange} />
                                    ) : (
                                        <TrendingDown size={10} color={colors.accentOrange} />
                                    )}
                                    <Text style={[styles.strategyText, { color: colors.accentOrange }]}>
                                        {t(`home.${game.strategy}`)} {game.prediction}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        {gamesCount > 3 && (
                            <Text style={[styles.moreText, { color: colors.textMuted }]}>
                                +{gamesCount - 3} {t('home.more_games') || 'mais'}
                            </Text>
                        )}
                    </View>
                </View>
                
                <View style={styles.footer}>
                    <Text style={[styles.tapHint, { color: colors.textMuted }]}>
                        Ver detalhes
                    </Text>
                    <ChevronDown size={14} color={colors.textMuted} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusPillText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    oddSection: {
        alignItems: 'center',
        paddingRight: 14,
        borderRightWidth: 1,
        borderRightColor: 'rgba(128,128,128,0.2)',
        marginRight: 14,
    },
    oddLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 2,
    },
    oddValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    gamesPreview: {
        flex: 1,
        gap: 6,
    },
    gamePreviewItem: {
        gap: 2,
    },
    gameTeamsMini: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    miniLogo: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    miniLogoPlaceholder: {
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniLogoText: {
        fontSize: 9,
        fontWeight: '700',
    },
    miniTeamName: {
        fontSize: 10,
        fontWeight: '500',
        flex: 1,
    },
    vsText: {
        fontSize: 9,
        fontWeight: '600',
    },
    strategyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    strategyText: {
        fontSize: 11,
        fontWeight: '700',
    },
    moreText: {
        fontSize: 10,
        fontStyle: 'italic',
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128,128,128,0.15)',
    },
    tapHint: {
        fontSize: 10,
    },
});