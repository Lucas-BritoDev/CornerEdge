import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    Menu, ClipboardList, Users, Trophy, Check, Clock, Star,
    Dices, Zap, Gift, Cpu, AlertTriangle, History
} from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { HarmonyThermometer } from '../components/HarmonyThermometer';
import { NextTaskWidget } from '../components/NextTaskWidget';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HouseholdTask, HouseholdMember, TASK_CATEGORIES } from '../types';

// Mock data
const MOCK_TASKS: HouseholdTask[] = [
    { id: '1', name: 'Lavar a louça', category: 'cozinha', frequency: 'daily', priority: 'high', points: 10, completed: false, createdAt: Date.now(), createdBy: 'user1', dueDate: Date.now() + 3600000 },
    { id: '2', name: 'Aspirar a sala', category: 'limpeza', frequency: 'weekly', priority: 'high', points: 20, completed: false, createdAt: Date.now(), createdBy: 'user1', dueDate: Date.now() + 7200000 },
    { id: '3', name: 'Regar as plantas', category: 'jardim', frequency: 'daily', priority: 'low', points: 5, completed: true, createdAt: Date.now(), createdBy: 'user1' },
    { id: '4', name: 'Tirar o lixo', category: 'limpeza', frequency: 'daily', priority: 'medium', points: 5, completed: false, createdAt: Date.now(), createdBy: 'user1' },
];

const MOCK_MEMBERS: HouseholdMember[] = [
    { id: '1', name: 'Maria', email: 'maria@email.com', role: 'admin', points: 450, joinedAt: Date.now() },
    { id: '2', name: 'João', email: 'joao@email.com', role: 'member', points: 380, joinedAt: Date.now() },
    { id: '3', name: 'Ana', email: 'ana@email.com', role: 'member', points: 320, joinedAt: Date.now() },
];

interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    route: string;
    color: string;
}

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [tasks, setTasks] = useState<HouseholdTask[]>(MOCK_TASKS);
    const [members] = useState<HouseholdMember[]>(MOCK_MEMBERS);

    // WCAG 2.1 AA Compliant Colors
    const bgColor = isDark ? darkColors.background : colors.background;
    const cardColor = isDark ? darkColors.card : colors.white;
    const textColor = isDark ? darkColors.textPrimary : colors.textPrimary;
    const mutedColor = isDark ? darkColors.textMuted : colors.textMuted;


    // All quick actions / shortcuts
    const quickActions: QuickAction[] = [
        { id: 'tasks', label: 'Tarefas', icon: <ClipboardList color={colors.white} size={20} />, route: '/tasks', color: colors.primary },
        { id: 'roulette', label: 'Roleta', icon: <Dices color={colors.white} size={20} />, route: '/roulette', color: '#8B5CF6' },
        { id: 'blitz', label: 'Blitz', icon: <Zap color={colors.white} size={20} />, route: '/blitz', color: colors.warning },
        { id: 'rewards', label: 'Prêmios', icon: <Gift color={colors.white} size={20} />, route: '/rewards', color: colors.accent },
        { id: 'ai', label: 'IA', icon: <Cpu color={colors.white} size={20} />, route: '/ai-assign', color: colors.success },
        { id: 'debt', label: 'Dívidas', icon: <AlertTriangle color={colors.white} size={20} />, route: '/debt', color: colors.error },
        { id: 'ranking', label: 'Ranking', icon: <Trophy color={colors.white} size={20} />, route: '/ranking', color: colors.orange },
        { id: 'group', label: 'Casa', icon: <Users color={colors.white} size={20} />, route: '/group', color: colors.teal },
        { id: 'history', label: 'Histórico', icon: <History color={colors.white} size={20} />, route: '/history', color: colors.purple },
    ];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
    };

    const toggleTaskComplete = (taskId: string) => {
        setTasks(tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        ));
    };

    const getCategoryInfo = (categoryId: string) => {
        return TASK_CATEGORIES.find(c => c.id === categoryId) || TASK_CATEGORIES[0];
    };

    const pendingTasks = tasks.filter(t => !t.completed);
    const pendingTasksCount = pendingTasks.length;
    const completedTodayCount = tasks.filter(t => t.completed).length;
    const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
    const sortedMembers = [...members].sort((a, b) => b.points - a.points).slice(0, 3);

    const nextTask = pendingTasks.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    })[0] || null;

    const harmonyScore = tasks.length > 0
        ? Math.round((completedTodayCount / tasks.length) * 100)
        : 100;

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}!</Text>
                    <Text style={styles.headerTitle}>Minha Casa</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* QUICK ACTIONS - AT THE TOP */}
                <View style={styles.quickActionsSection}>
                    <Text style={[styles.sectionTitle, { color: mutedColor }]}>AÇÕES RÁPIDAS</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quickActionsContainer}
                    >
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[styles.quickAction, { backgroundColor: action.color }]}
                                onPress={() => router.push(action.route as any)}
                            >
                                {action.icon}
                                <Text style={styles.quickActionText}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Next Task Widget */}
                <View style={styles.widgetSection}>
                    <NextTaskWidget
                        task={nextTask}
                        onComplete={(taskId) => toggleTaskComplete(taskId)}
                        onPress={() => router.push('/tasks')}
                        isDark={isDark}
                    />
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: cardColor }]}>
                        <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
                            <Clock color={colors.warning} size={20} />
                        </View>
                        <Text style={[styles.statValue, { color: textColor }]}>{pendingTasksCount}</Text>
                        <Text style={[styles.statLabel, { color: mutedColor }]}>Pendentes</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: cardColor }]}>
                        <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
                            <Check color={colors.success} size={20} />
                        </View>
                        <Text style={[styles.statValue, { color: textColor }]}>{completedTodayCount}</Text>
                        <Text style={[styles.statLabel, { color: mutedColor }]}>Concluídas</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: cardColor }]}>
                        <View style={[styles.statIcon, { backgroundColor: colors.accent + '20' }]}>
                            <Star color={colors.accent} size={20} />
                        </View>
                        <Text style={[styles.statValue, { color: textColor }]}>{totalPoints}</Text>
                        <Text style={[styles.statLabel, { color: mutedColor }]}>Pontos</Text>
                    </View>
                </View>

                {/* Harmony Thermometer */}
                <View style={styles.section}>
                    <HarmonyThermometer value={harmonyScore} isDark={isDark} />
                </View>

                {/* Today's Tasks */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: mutedColor }]}>TAREFAS DE HOJE</Text>
                        <TouchableOpacity onPress={() => router.push('/tasks')}>
                            <Text style={[styles.seeAllButton, { color: colors.primary }]}>Ver todas</Text>
                        </TouchableOpacity>
                    </View>

                    {pendingTasks.slice(0, 3).map(task => {
                        const category = getCategoryInfo(task.category);
                        return (
                            <TouchableOpacity
                                key={task.id}
                                style={[styles.taskCard, { backgroundColor: cardColor }]}
                                onPress={() => toggleTaskComplete(task.id)}
                            >
                                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                                    <Text style={styles.categoryEmoji}>{category.icon}</Text>
                                </View>
                                <View style={styles.taskInfo}>
                                    <Text style={[styles.taskName, { color: textColor }]}>{task.name}</Text>
                                    <Text style={[styles.taskPoints, { color: mutedColor }]}>+{task.points} pts</Text>
                                </View>
                                <View style={styles.checkCircle} />
                            </TouchableOpacity>
                        );
                    })}

                    {pendingTasks.length === 0 && (
                        <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                            <Text style={styles.emptyEmoji}>🎉</Text>
                            <Text style={[styles.emptyText, { color: textColor }]}>Todas as tarefas concluídas!</Text>
                            <Text style={[styles.emptySubtext, { color: mutedColor }]}>Parabéns pelo ótimo trabalho!</Text>
                        </View>
                    )}
                </View>

                {/* Top 3 Ranking */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: mutedColor }]}>🏆 TOP 3 DA SEMANA</Text>
                        <TouchableOpacity onPress={() => router.push('/ranking')}>
                            <Text style={[styles.seeAllButton, { color: colors.primary }]}>Ver ranking</Text>
                        </TouchableOpacity>
                    </View>

                    {sortedMembers.map((member, index) => (
                        <View
                            key={member.id}
                            style={[styles.rankingItem, { backgroundColor: cardColor }]}
                        >
                            <View style={[styles.rankBadge, index === 0 && styles.rankBadgeGold, index === 1 && styles.rankBadgeSilver, index === 2 && styles.rankBadgeBronze]}>
                                <Text style={styles.rankNumber}>{index + 1}</Text>
                            </View>
                            <View style={styles.memberAvatar}>
                                <Text style={styles.memberAvatarText}>{member.name.charAt(0)}</Text>
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={[styles.memberName, { color: textColor }]}>{member.name}</Text>
                                <Text style={[styles.memberPoints, { color: mutedColor }]}>{member.points} pontos</Text>
                            </View>
                            {index === 0 && <Text style={styles.crownEmoji}>👑</Text>}
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
    content: { flex: 1 },

    // Quick actions at top
    quickActionsSection: {
        paddingTop: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    quickActionsContainer: {
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        gap: spacing.sm,
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        marginRight: spacing.sm,
        gap: spacing.xs,
        ...shadows.sm
    },
    quickActionText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '600' },

    widgetSection: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginTop: spacing.lg,
        gap: spacing.md
    },
    statCard: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        ...shadows.sm
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm
    },
    statValue: { fontSize: fontSize['2xl'], fontWeight: 'bold' },
    statLabel: { fontSize: fontSize.xs, marginTop: 2 },
    section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    sectionTitle: { fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.5 },
    seeAllButton: { fontSize: fontSize.sm, fontWeight: '600' },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        ...shadows.sm
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md
    },
    categoryEmoji: { fontSize: 22 },
    taskInfo: { flex: 1 },
    taskName: { fontSize: fontSize.md, fontWeight: '600', marginBottom: 2 },
    taskPoints: { fontSize: fontSize.sm },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border
    },
    emptyState: {
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        ...shadows.sm
    },
    emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
    emptyText: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: 4 },
    emptySubtext: { fontSize: fontSize.md },
    rankingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        ...shadows.sm
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md
    },
    rankBadgeGold: { backgroundColor: '#FEF3C7' },
    rankBadgeSilver: { backgroundColor: '#E5E7EB' },
    rankBadgeBronze: { backgroundColor: '#FED7AA' },
    rankNumber: { fontSize: fontSize.sm, fontWeight: 'bold', color: colors.textPrimary },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md
    },
    memberAvatarText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
    memberInfo: { flex: 1 },
    memberName: { fontSize: fontSize.md, fontWeight: '600' },
    memberPoints: { fontSize: fontSize.sm, marginTop: 2 },
    crownEmoji: { fontSize: 20 },
});
