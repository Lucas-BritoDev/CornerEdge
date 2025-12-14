import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Trophy, Medal, Star, TrendingUp } from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HouseholdMember } from '../types';

// Mock data for demonstration
const MOCK_MEMBERS: HouseholdMember[] = [
    { id: '1', name: 'Maria Silva', email: 'maria@email.com', role: 'admin', points: 450, joinedAt: Date.now() },
    { id: '2', name: 'João Santos', email: 'joao@email.com', role: 'member', points: 380, joinedAt: Date.now() },
    { id: '3', name: 'Ana Oliveira', email: 'ana@email.com', role: 'member', points: 320, joinedAt: Date.now() },
    { id: '4', name: 'Pedro Costa', email: 'pedro@email.com', role: 'member', points: 250, joinedAt: Date.now() },
    { id: '5', name: 'Lucas Ferreira', email: 'lucas@email.com', role: 'member', points: 180, joinedAt: Date.now() },
];

export default function RankingScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [members] = useState<HouseholdMember[]>(MOCK_MEMBERS);

    // WCAG 2.1 AA Compliant Colors
    const bgColor = isDark ? darkColors.background : colors.background;
    const cardColor = isDark ? darkColors.card : colors.white;
    const textColor = isDark ? darkColors.textPrimary : colors.textPrimary;
    const mutedColor = isDark ? darkColors.textMuted : colors.textMuted;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    // Sort by points
    const sortedMembers = [...members].sort((a, b) => b.points - a.points);
    const top3 = sortedMembers.slice(0, 3);
    const rest = sortedMembers.slice(3);

    const getPodiumColors = (position: number) => {
        switch (position) {
            case 0: return { bg: '#FEF3C7', border: '#F59E0B', medal: '🥇' };
            case 1: return { bg: '#E5E7EB', border: '#9CA3AF', medal: '🥈' };
            case 2: return { bg: '#FED7AA', border: '#F97316', medal: '🥉' };
            default: return { bg: cardColor, border: colors.border, medal: '' };
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋</Text>
                    <Text style={styles.headerTitle}>Ranking</Text>
                </View>
                <View style={styles.trophyIcon}>
                    <Trophy color={colors.white} size={24} />
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            >
                {/* Podium Section */}
                <View style={styles.podiumSection}>
                    <Text style={[styles.sectionTitle, { color: mutedColor }]}>
                        🏆 TOP 3 DA SEMANA
                    </Text>

                    <View style={styles.podiumContainer}>
                        {/* Second Place */}
                        {top3[1] && (
                            <View style={styles.podiumItem}>
                                <View style={[styles.podiumAvatar, { backgroundColor: getPodiumColors(1).bg, borderColor: getPodiumColors(1).border }]}>
                                    <Text style={styles.podiumAvatarText}>{top3[1].name.charAt(0)}</Text>
                                </View>
                                <Text style={styles.podiumMedal}>{getPodiumColors(1).medal}</Text>
                                <Text style={[styles.podiumName, { color: textColor }]} numberOfLines={1}>{top3[1].name.split(' ')[0]}</Text>
                                <Text style={[styles.podiumPoints, { color: mutedColor }]}>{top3[1].points} pts</Text>
                                <View style={[styles.podiumBase, styles.podiumBase2, { backgroundColor: getPodiumColors(1).border }]} />
                            </View>
                        )}

                        {/* First Place */}
                        {top3[0] && (
                            <View style={[styles.podiumItem, styles.podiumItemFirst]}>
                                <View style={[styles.podiumAvatar, styles.podiumAvatarFirst, { backgroundColor: getPodiumColors(0).bg, borderColor: getPodiumColors(0).border }]}>
                                    <Text style={[styles.podiumAvatarText, styles.podiumAvatarTextFirst]}>{top3[0].name.charAt(0)}</Text>
                                </View>
                                <Text style={styles.podiumMedal}>{getPodiumColors(0).medal}</Text>
                                <Text style={[styles.podiumName, { color: textColor }]} numberOfLines={1}>{top3[0].name.split(' ')[0]}</Text>
                                <Text style={[styles.podiumPoints, { color: mutedColor }]}>{top3[0].points} pts</Text>
                                <View style={[styles.podiumBase, styles.podiumBase1, { backgroundColor: getPodiumColors(0).border }]} />
                            </View>
                        )}

                        {/* Third Place */}
                        {top3[2] && (
                            <View style={styles.podiumItem}>
                                <View style={[styles.podiumAvatar, { backgroundColor: getPodiumColors(2).bg, borderColor: getPodiumColors(2).border }]}>
                                    <Text style={styles.podiumAvatarText}>{top3[2].name.charAt(0)}</Text>
                                </View>
                                <Text style={styles.podiumMedal}>{getPodiumColors(2).medal}</Text>
                                <Text style={[styles.podiumName, { color: textColor }]} numberOfLines={1}>{top3[2].name.split(' ')[0]}</Text>
                                <Text style={[styles.podiumPoints, { color: mutedColor }]}>{top3[2].points} pts</Text>
                                <View style={[styles.podiumBase, styles.podiumBase3, { backgroundColor: getPodiumColors(2).border }]} />
                            </View>
                        )}
                    </View>
                </View>

                {/* Full Rankings */}
                <View style={styles.rankingsSection}>
                    <Text style={[styles.sectionTitle, { color: mutedColor }]}>
                        RANKING COMPLETO
                    </Text>

                    {sortedMembers.map((member, index) => (
                        <View
                            key={member.id}
                            style={[styles.rankingCard, { backgroundColor: cardColor }]}
                        >
                            <View style={[styles.rankPosition, index < 3 && { backgroundColor: getPodiumColors(index).bg }]}>
                                <Text style={[styles.rankNumber, { color: index < 3 ? getPodiumColors(index).border : mutedColor }]}>
                                    {index + 1}
                                </Text>
                            </View>
                            <View style={styles.memberAvatar}>
                                <Text style={styles.memberAvatarText}>{member.name.charAt(0)}</Text>
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={[styles.memberName, { color: textColor }]}>{member.name}</Text>
                                <View style={styles.memberStats}>
                                    <Star color={colors.accent} size={14} fill={colors.accent} />
                                    <Text style={[styles.memberPoints, { color: mutedColor }]}>{member.points} pontos</Text>
                                </View>
                            </View>
                            {index === 0 && (
                                <View style={styles.leaderBadge}>
                                    <Text style={styles.leaderText}>👑</Text>
                                </View>
                            )}
                            {index < 3 && index > 0 && (
                                <TrendingUp color={colors.success} size={20} />
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>

            <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24
    },
    menuButton: { padding: spacing.sm, marginRight: spacing.md },
    headerTextContainer: { flex: 1 },
    greeting: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm },
    headerTitle: { color: colors.white, fontSize: fontSize.xl, fontWeight: 'bold' },
    trophyIcon: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: spacing.sm,
        borderRadius: borderRadius.md
    },
    content: { flex: 1 },
    sectionTitle: {
        fontSize: fontSize.xs,
        fontWeight: '600',
        marginBottom: spacing.md,
        letterSpacing: 0.5,
        textAlign: 'center'
    },
    podiumSection: {
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingTop: spacing.xl,
        gap: spacing.sm
    },
    podiumItem: {
        alignItems: 'center',
        width: 100
    },
    podiumItemFirst: {
        marginTop: -20
    },
    podiumAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        marginBottom: 4
    },
    podiumAvatarFirst: {
        width: 72,
        height: 72,
        borderRadius: 36
    },
    podiumAvatarText: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: colors.textPrimary
    },
    podiumAvatarTextFirst: {
        fontSize: fontSize['2xl']
    },
    podiumMedal: {
        fontSize: 28,
        marginBottom: 4
    },
    podiumName: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        maxWidth: 80,
        textAlign: 'center'
    },
    podiumPoints: {
        fontSize: fontSize.xs,
        marginTop: 2
    },
    podiumBase: {
        width: '100%',
        borderTopLeftRadius: borderRadius.md,
        borderTopRightRadius: borderRadius.md,
        marginTop: spacing.sm
    },
    podiumBase1: { height: 80 },
    podiumBase2: { height: 60 },
    podiumBase3: { height: 40 },
    rankingsSection: {
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg
    },
    rankingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        ...shadows.sm
    },
    rankPosition: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md
    },
    rankNumber: {
        fontSize: fontSize.md,
        fontWeight: 'bold'
    },
    memberAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md
    },
    memberAvatarText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: 'bold'
    },
    memberInfo: { flex: 1 },
    memberName: { fontSize: fontSize.md, fontWeight: '600' },
    memberStats: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
    memberPoints: { fontSize: fontSize.sm },
    leaderBadge: { marginLeft: spacing.sm },
    leaderText: { fontSize: 24 },
});
