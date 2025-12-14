import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Trophy, Flame, Target, Star, Award, Zap, Calendar, Gift } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { gamificationService, ACHIEVEMENTS, LEVELS, Challenge } from '../services/gamification-service';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { storageService } from '../services/storage-service';
import { Achievement } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DisplayAchievement {
    id: string;
    name: string;
    description: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    icon: string;
    xpReward: number;
    unlocked: boolean;
    progress: number;
}

interface Level {
    level: number;
    name: string;
    minXP: number;
}

export default function AchievementsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'achievements' | 'challenges' | 'levels'>('achievements');
    const [achievements, setAchievements] = useState<DisplayAchievement[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [stats, setStats] = useState({ xp: 0, level: 1, streak: 0 });
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const c = await gamificationService.getChallenges();
        const profile = await storageService.getProfile();

        const unlocked = profile?.achievements || [];
        setUnlockedIds(unlocked);
        setStats({
            xp: profile?.stats.xp || 0,
            level: profile?.stats.level || 1,
            streak: profile?.stats.currentStreak || 0
        });

        // Convert ACHIEVEMENTS to DisplayAchievement format
        const displayAchievements: DisplayAchievement[] = ACHIEVEMENTS.map(a => ({
            id: a.id,
            name: a.title,
            description: a.description,
            tier: a.category as 'bronze' | 'silver' | 'gold' | 'platinum',
            icon: getAchievementIcon(a.category),
            xpReward: a.xpReward,
            unlocked: unlocked.includes(a.id),
            progress: unlocked.includes(a.id) ? 100 : Math.floor(Math.random() * 80),
        }));

        setAchievements(displayAchievements);
        setChallenges(c);
    };

    const getAchievementIcon = (category: string): string => {
        switch (category) {
            case 'bronze': return '🥉';
            case 'silver': return '🥈';
            case 'gold': return '🥇';
            case 'platinum': return '💎';
            default: return '🏆';
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const levels: Level[] = LEVELS.map(l => ({ level: l.level, name: l.name, minXP: l.xpRequired }));
    const currentLevel = levels.find(l => l.level === stats.level) || levels[0];
    const nextLevel = levels.find(l => l.level === stats.level + 1);
    const xpForNext = nextLevel ? nextLevel.minXP - stats.xp : 0;
    const xpProgress = nextLevel ? ((stats.xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100 : 100;

    const unlockedAchievements = achievements.filter(a => a.unlocked);
    const lockedAchievements = achievements.filter(a => !a.unlocked);

    const bgColor = isDark ? '#111827' : colors.background;
    const cardColor = isDark ? '#1F2937' : colors.white;
    const textColor = isDark ? '#F9FAFB' : colors.textPrimary;
    const mutedColor = isDark ? '#9CA3AF' : colors.textMuted;
    const borderColor = isDark ? '#374151' : colors.border;

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'platinum': return '#E5E4E2';
            case 'gold': return '#FFD700';
            case 'silver': return '#C0C0C0';
            default: return '#CD7F32';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}><Menu color={colors.white} size={24} /></TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋</Text>
                    <Text style={styles.headerTitle}>Conquistas</Text>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
                {/* Level Card */}
                <View style={[styles.levelCard, { backgroundColor: colors.primary }]}>
                    <View style={styles.levelHeader}>
                        <View style={styles.levelBadge}><Text style={styles.levelNumber}>{stats.level}</Text></View>
                        <View style={styles.levelInfo}>
                            <Text style={styles.levelTitle}>{currentLevel.name}</Text>
                            <Text style={styles.levelXP}>{stats.xp} XP</Text>
                        </View>
                        <View style={styles.streakBadge}><Flame color={colors.warning} size={18} /><Text style={styles.streakText}>{stats.streak}</Text></View>
                    </View>
                    {nextLevel && (
                        <View style={styles.xpProgressContainer}>
                            <View style={styles.xpProgressBar}><View style={[styles.xpProgressFill, { width: `${xpProgress}%` }]} /></View>
                            <Text style={styles.xpProgressText}>{xpForNext} XP para {nextLevel.name}</Text>
                        </View>
                    )}
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: cardColor }]}>
                        <Trophy color={colors.warning} size={24} /><Text style={[styles.statValue, { color: textColor }]}>{unlockedAchievements.length}</Text><Text style={[styles.statLabel, { color: mutedColor }]}>Conquistas</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: cardColor }]}>
                        <Target color={colors.primary} size={24} /><Text style={[styles.statValue, { color: textColor }]}>{challenges.filter(c => c.completed).length}</Text><Text style={[styles.statLabel, { color: mutedColor }]}>Desafios</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: cardColor }]}>
                        <Flame color={colors.error} size={24} /><Text style={[styles.statValue, { color: textColor }]}>{stats.streak}</Text><Text style={[styles.statLabel, { color: mutedColor }]}>Dias</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={[styles.tabs, { backgroundColor: cardColor }]}>
                    {(['achievements', 'challenges', 'levels'] as const).map(tab => (
                        <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
                            <Text style={[styles.tabText, { color: mutedColor }, activeTab === tab && styles.tabTextActive]}>
                                {tab === 'achievements' ? 'Conquistas' : tab === 'challenges' ? 'Desafios' : 'Níveis'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Achievements Tab */}
                {activeTab === 'achievements' && (
                    <>
                        {unlockedAchievements.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: textColor }]}>Desbloqueadas ({unlockedAchievements.length})</Text>
                                {unlockedAchievements.map(a => (
                                    <View key={a.id} style={[styles.achievementCard, { backgroundColor: cardColor, borderLeftColor: getTierColor(a.tier) }]}>
                                        <Text style={styles.achievementIcon}>{a.icon}</Text>
                                        <View style={styles.achievementInfo}>
                                            <Text style={[styles.achievementName, { color: textColor }]}>{a.name}</Text>
                                            <Text style={[styles.achievementDesc, { color: mutedColor }]}>{a.description}</Text>
                                        </View>
                                        <View style={[styles.tierBadge, { backgroundColor: getTierColor(a.tier) + '30' }]}><Text style={[styles.tierText, { color: getTierColor(a.tier) }]}>+{a.xpReward} XP</Text></View>
                                    </View>
                                ))}
                            </>
                        )}
                        {lockedAchievements.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: textColor }]}>Bloqueadas ({lockedAchievements.length})</Text>
                                {lockedAchievements.slice(0, 6).map(a => (
                                    <View key={a.id} style={[styles.achievementCard, styles.lockedCard, { backgroundColor: cardColor }]}>
                                        <Text style={[styles.achievementIcon, styles.lockedIcon]}>🔒</Text>
                                        <View style={styles.achievementInfo}>
                                            <Text style={[styles.achievementName, { color: mutedColor }]}>{a.name}</Text>
                                            <Text style={[styles.achievementDesc, { color: mutedColor }]}>{a.description}</Text>
                                            <View style={styles.progressRow}>
                                                <View style={[styles.progressBar, { backgroundColor: borderColor }]}><View style={[styles.progressFill, { width: `${a.progress}%` }]} /></View>
                                                <Text style={[styles.progressText, { color: mutedColor }]}>{a.progress}%</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </>
                )}

                {/* Challenges Tab */}
                {activeTab === 'challenges' && (
                    <>
                        {(['daily', 'weekly', 'monthly'] as const).map(type => {
                            const typeLabel = type === 'daily' ? 'Diários' : type === 'weekly' ? 'Semanais' : 'Mensais';
                            const typeChallenges = challenges.filter(c => c.type === type);
                            if (typeChallenges.length === 0) return null;
                            return (
                                <View key={type}>
                                    <Text style={[styles.sectionTitle, { color: textColor }]}>Desafios {typeLabel}</Text>
                                    {typeChallenges.map(c => (
                                        <View key={c.id} style={[styles.challengeCard, { backgroundColor: cardColor }, c.completed && styles.completedCard]}>
                                            <View style={[styles.challengeIcon, { backgroundColor: c.completed ? colors.primaryLight : isDark ? '#374151' : colors.background }]}>
                                                {c.completed ? <Star color={colors.primary} size={20} fill={colors.primary} /> : <Target color={mutedColor} size={20} />}
                                            </View>
                                            <View style={styles.challengeInfo}>
                                                <Text style={[styles.challengeName, { color: textColor }]}>{c.title}</Text>
                                                <Text style={[styles.challengeDesc, { color: mutedColor }]}>{c.description}</Text>
                                                <View style={styles.progressRow}>
                                                    <View style={[styles.progressBar, { backgroundColor: borderColor }]}><View style={[styles.progressFill, { width: `${(c.progress / c.target) * 100}%` }]} /></View>
                                                    <Text style={[styles.progressText, { color: mutedColor }]}>{c.progress}/{c.target}</Text>
                                                </View>
                                            </View>
                                            <View style={[styles.xpBadge, { backgroundColor: colors.primaryLight }]}><Text style={styles.xpBadgeText}>+{c.xpReward}</Text></View>
                                        </View>
                                    ))}
                                </View>
                            );
                        })}
                    </>
                )}

                {/* Levels Tab */}
                {activeTab === 'levels' && (
                    <>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Todos os Níveis</Text>
                        {levels.map(l => {
                            const isUnlocked = stats.level >= l.level;
                            const isCurrent = stats.level === l.level;
                            return (
                                <View key={l.level} style={[styles.levelItem, { backgroundColor: cardColor }, isCurrent && { borderColor: colors.primary, borderWidth: 2 }]}>
                                    <View style={[styles.levelItemBadge, { backgroundColor: isUnlocked ? colors.primary : borderColor }]}><Text style={styles.levelItemNumber}>{l.level}</Text></View>
                                    <View style={styles.levelItemInfo}>
                                        <Text style={[styles.levelItemName, { color: isUnlocked ? textColor : mutedColor }]}>{l.name}</Text>
                                        <Text style={[styles.levelItemXP, { color: mutedColor }]}>{l.minXP} XP</Text>
                                    </View>
                                    {isUnlocked && <Award color={colors.primary} size={20} />}
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>

            <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    menuButton: { padding: spacing.sm, marginRight: spacing.md },
    headerTextContainer: { flex: 1 },
    greeting: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm },
    headerTitle: { color: colors.white, fontSize: fontSize.xl, fontWeight: 'bold' },
    content: { flex: 1 },
    levelCard: { margin: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg },
    levelHeader: { flexDirection: 'row', alignItems: 'center' },
    levelBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    levelNumber: { color: colors.white, fontSize: fontSize['2xl'], fontWeight: 'bold' },
    levelInfo: { flex: 1 },
    levelTitle: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
    levelXP: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm },
    streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, gap: 4 },
    streakText: { color: colors.white, fontWeight: 'bold' },
    xpProgressContainer: { marginTop: spacing.md },
    xpProgressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
    xpProgressFill: { height: '100%', backgroundColor: colors.white, borderRadius: 4 },
    xpProgressText: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center' },
    statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
    statCard: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
    statValue: { fontSize: fontSize.xl, fontWeight: 'bold', marginTop: spacing.xs },
    statLabel: { fontSize: fontSize.xs },
    tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.xs, marginBottom: spacing.md, ...shadows.sm },
    tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: fontSize.sm, fontWeight: '600' },
    tabTextActive: { color: colors.white },
    sectionTitle: { fontSize: fontSize.md, fontWeight: 'bold', paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
    achievementCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: borderRadius.lg, borderLeftWidth: 4, ...shadows.sm },
    lockedCard: { opacity: 0.7, borderLeftWidth: 0 },
    achievementIcon: { fontSize: 32, marginRight: spacing.md },
    lockedIcon: { opacity: 0.5 },
    achievementInfo: { flex: 1 },
    achievementName: { fontSize: fontSize.md, fontWeight: '600' },
    achievementDesc: { fontSize: fontSize.sm, marginTop: 2 },
    tierBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
    tierText: { fontSize: fontSize.sm, fontWeight: '600' },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm },
    progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
    progressText: { fontSize: fontSize.xs, width: 40 },
    challengeCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
    completedCard: { borderColor: colors.primary, borderWidth: 1 },
    challengeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    challengeInfo: { flex: 1 },
    challengeName: { fontSize: fontSize.md, fontWeight: '600' },
    challengeDesc: { fontSize: fontSize.sm, marginTop: 2 },
    xpBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
    xpBadgeText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
    levelItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
    levelItemBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    levelItemNumber: { color: colors.white, fontWeight: 'bold' },
    levelItemInfo: { flex: 1 },
    levelItemName: { fontSize: fontSize.md, fontWeight: '600' },
    levelItemXP: { fontSize: fontSize.sm },
});
