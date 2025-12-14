import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Vibration,
    Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Play, Pause, Trophy, Zap, Check, Clock, Star, Users } from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HouseholdMember, HouseholdTask, TASK_CATEGORIES } from '../types';

const BLITZ_DURATION = 30 * 60; // 30 minutes in seconds

const MOCK_MEMBERS: HouseholdMember[] = [
    { id: '1', name: 'Maria', email: 'maria@email.com', role: 'admin', points: 0, joinedAt: Date.now() },
    { id: '2', name: 'João', email: 'joao@email.com', role: 'member', points: 0, joinedAt: Date.now() },
    { id: '3', name: 'Ana', email: 'ana@email.com', role: 'member', points: 0, joinedAt: Date.now() },
];

const BLITZ_TASKS: HouseholdTask[] = [
    { id: '1', name: 'Lavar louça', category: 'cozinha', frequency: 'daily', priority: 'medium', points: 10, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '2', name: 'Aspirar sala', category: 'limpeza', frequency: 'daily', priority: 'medium', points: 15, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '3', name: 'Limpar banheiro', category: 'limpeza', frequency: 'daily', priority: 'high', points: 20, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '4', name: 'Tirar lixo', category: 'limpeza', frequency: 'daily', priority: 'low', points: 5, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '5', name: 'Arrumar cama', category: 'quarto', frequency: 'daily', priority: 'low', points: 5, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '6', name: 'Regar plantas', category: 'jardim', frequency: 'daily', priority: 'low', points: 5, completed: false, createdAt: Date.now(), createdBy: '1' },
];

export default function BlitzScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(BLITZ_DURATION);
    const [tasks, setTasks] = useState(BLITZ_TASKS);
    const [memberScores, setMemberScores] = useState<{ [key: string]: number }>({});
    const [blitzEnded, setBlitzEnded] = useState(false);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        endBlitz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    useEffect(() => {
        if (isActive) {
            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();

            // Progress animation
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: BLITZ_DURATION * 1000,
                useNativeDriver: false,
            }).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isActive]);

    // WCAG 2.1 AA Compliant Colors
    const bgColor = isDark ? darkColors.background : colors.background;
    const cardColor = isDark ? darkColors.card : colors.white;
    const textColor = isDark ? darkColors.textPrimary : colors.textPrimary;
    const mutedColor = isDark ? darkColors.textMuted : colors.textMuted;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startBlitz = () => {
        setIsActive(true);
        setTimeLeft(BLITZ_DURATION);
        setBlitzEnded(false);
        setMemberScores({});
        setTasks(BLITZ_TASKS.map(t => ({ ...t, completed: false })));
        Vibration.vibrate([0, 200, 100, 200]);
    };

    const endBlitz = () => {
        setIsActive(false);
        setBlitzEnded(true);
        Vibration.vibrate([0, 500, 200, 500]);
        Alert.alert('⚡ Blitz Finalizado!', 'Confira os resultados abaixo.');
    };

    const completeTask = (taskId: string, memberId: string) => {
        if (!isActive) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task || task.completed) return;

        // Double points during blitz!
        const earnedPoints = task.points * 2;

        setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: true } : t));
        setMemberScores(prev => ({
            ...prev,
            [memberId]: (prev[memberId] || 0) + earnedPoints
        }));

        Vibration.vibrate(100);
    };

    const getCategoryInfo = (categoryId: string) => {
        return TASK_CATEGORIES.find(c => c.id === categoryId) || TASK_CATEGORIES[0];
    };

    const getLeaderboard = () => {
        return Object.entries(memberScores)
            .map(([id, score]) => ({
                member: MOCK_MEMBERS.find(m => m.id === id)!,
                score
            }))
            .filter(item => item.member)
            .sort((a, b) => b.score - a.score);
    };

    const totalCompleted = tasks.filter(t => t.completed).length;
    const totalPoints = Object.values(memberScores).reduce((sum, pts) => sum + pts, 0);

    return (
        <View style={[styles.container, { backgroundColor: isActive ? '#1E1B4B' : bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: isActive ? '#4C1D95' : colors.warning }]}>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
                    <Menu color={colors.white} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>⚡ Modo Blitz</Text>
                    <Text style={styles.headerTitle}>{isActive ? 'EM ANDAMENTO!' : 'Mutirão'}</Text>
                </View>
                {isActive && (
                    <View style={styles.multiplierBadge}>
                        <Text style={styles.multiplierText}>2x PONTOS</Text>
                    </View>
                )}
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            >
                {/* Timer */}
                <Animated.View style={[styles.timerCard, { transform: [{ scale: pulseAnim }] }]}>
                    <View style={styles.timerCircle}>
                        <Clock color={isActive ? colors.warning : mutedColor} size={32} />
                        <Text style={[styles.timerText, isActive && styles.timerTextActive]}>
                            {formatTime(timeLeft)}
                        </Text>
                        <Text style={[styles.timerLabel, { color: mutedColor }]}>
                            {isActive ? 'Tempo Restante' : 'Duração do Blitz'}
                        </Text>
                    </View>

                    {!isActive && !blitzEnded && (
                        <TouchableOpacity style={styles.startButton} onPress={startBlitz}>
                            <Play color={colors.white} size={24} fill={colors.white} />
                            <Text style={styles.startButtonText}>INICIAR BLITZ!</Text>
                        </TouchableOpacity>
                    )}

                    {isActive && (
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{totalCompleted}</Text>
                                <Text style={[styles.statLabel, { color: mutedColor }]}>Concluídas</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{totalPoints}</Text>
                                <Text style={[styles.statLabel, { color: mutedColor }]}>Pontos (2x)</Text>
                            </View>
                        </View>
                    )}
                </Animated.View>

                {/* Live Leaderboard */}
                {(isActive || blitzEnded) && getLeaderboard().length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
                            {blitzEnded ? '🏆 RESULTADO FINAL' : '📊 PLACAR AO VIVO'}
                        </Text>
                        {getLeaderboard().map((item, index) => (
                            <View key={item.member.id} style={[styles.leaderboardItem, { backgroundColor: cardColor }]}>
                                <View style={[styles.rankBadge, index === 0 && styles.rankBadgeFirst]}>
                                    <Text style={styles.rankText}>{index + 1}º</Text>
                                </View>
                                <View style={[styles.leaderAvatar, { backgroundColor: index === 0 ? colors.warning : colors.primary }]}>
                                    <Text style={styles.leaderAvatarText}>{item.member.name.charAt(0)}</Text>
                                </View>
                                <Text style={[styles.leaderName, { color: textColor }]}>{item.member.name}</Text>
                                <View style={styles.leaderScore}>
                                    <Star color={colors.warning} size={16} fill={colors.warning} />
                                    <Text style={styles.leaderScoreText}>{item.score}</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Tasks */}
                {isActive && (
                    <>
                        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
                            TAREFAS DISPONÍVEIS ({tasks.filter(t => !t.completed).length})
                        </Text>
                        {tasks.map(task => {
                            const category = getCategoryInfo(task.category);
                            return (
                                <View
                                    key={task.id}
                                    style={[
                                        styles.taskCard,
                                        { backgroundColor: cardColor },
                                        task.completed && styles.taskCardCompleted
                                    ]}
                                >
                                    <View style={[styles.taskIcon, { backgroundColor: category.color + '20' }]}>
                                        <Text style={styles.taskEmoji}>{category.icon}</Text>
                                    </View>
                                    <View style={styles.taskInfo}>
                                        <Text style={[
                                            styles.taskName,
                                            { color: textColor },
                                            task.completed && styles.taskNameCompleted
                                        ]}>
                                            {task.name}
                                        </Text>
                                        <View style={styles.taskPoints}>
                                            <Zap color={colors.warning} size={14} />
                                            <Text style={styles.taskPointsText}>+{task.points * 2} pts (2x)</Text>
                                        </View>
                                    </View>
                                    {!task.completed ? (
                                        <View style={styles.memberButtons}>
                                            {MOCK_MEMBERS.slice(0, 3).map(member => (
                                                <TouchableOpacity
                                                    key={member.id}
                                                    style={styles.memberButton}
                                                    onPress={() => completeTask(task.id, member.id)}
                                                >
                                                    <Text style={styles.memberButtonText}>{member.name.charAt(0)}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <View style={styles.completedBadge}>
                                            <Check color={colors.success} size={20} />
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </>
                )}

                {/* Info Card (when not active) */}
                {!isActive && !blitzEnded && (
                    <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                        <Text style={[styles.infoTitle, { color: textColor }]}>⚡ Como funciona o Blitz?</Text>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoEmoji}>⏱️</Text>
                            <Text style={[styles.infoText, { color: mutedColor }]}>30 minutos de mutirão</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoEmoji}>✨</Text>
                            <Text style={[styles.infoText, { color: mutedColor }]}>Pontos em dobro (2x)</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoEmoji}>🏆</Text>
                            <Text style={[styles.infoText, { color: mutedColor }]}>Competição em tempo real</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoEmoji}>👨‍👩‍👧‍👦</Text>
                            <Text style={[styles.infoText, { color: mutedColor }]}>Todos participam juntos</Text>
                        </View>
                    </View>
                )}

                {/* Restart after end */}
                {blitzEnded && (
                    <TouchableOpacity style={styles.restartButton} onPress={startBlitz}>
                        <Zap color={colors.white} size={20} />
                        <Text style={styles.restartButtonText}>Novo Blitz</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
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
    multiplierBadge: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    multiplierText: { color: colors.white, fontSize: fontSize.xs, fontWeight: 'bold' },
    content: { flex: 1, padding: spacing.lg },

    // Timer Card
    timerCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        ...shadows.lg,
    },
    timerCircle: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    timerText: {
        fontSize: 56,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginVertical: spacing.sm,
    },
    timerTextActive: {
        color: colors.warning,
    },
    timerLabel: {
        fontSize: fontSize.sm,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.warning,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        gap: spacing.sm,
        ...shadows.md,
    },
    startButtonText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: 'bold',
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        marginTop: spacing.md,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
    statLabel: { fontSize: fontSize.xs },
    statDivider: { width: 1, backgroundColor: '#E5E7EB', height: '100%' },

    sectionTitle: {
        fontSize: fontSize.xs,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },

    // Leaderboard
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    rankBadgeFirst: { backgroundColor: '#FEF3C7' },
    rankText: { fontSize: fontSize.sm, fontWeight: 'bold', color: colors.textPrimary },
    leaderAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    leaderAvatarText: { color: colors.white, fontSize: fontSize.md, fontWeight: 'bold' },
    leaderName: { flex: 1, fontSize: fontSize.md, fontWeight: '500' },
    leaderScore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    leaderScoreText: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.warning },

    // Task Card
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    taskCardCompleted: { opacity: 0.5 },
    taskIcon: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    taskEmoji: { fontSize: 22 },
    taskInfo: { flex: 1 },
    taskName: { fontSize: fontSize.md, fontWeight: '500' },
    taskNameCompleted: { textDecorationLine: 'line-through' },
    taskPoints: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
    taskPointsText: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '600' },
    memberButtons: { flexDirection: 'row', gap: 4 },
    memberButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberButtonText: { color: colors.white, fontSize: fontSize.sm, fontWeight: 'bold' },
    completedBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.success + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Info Card
    infoCard: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
        ...shadows.sm,
    },
    infoTitle: { fontSize: fontSize.lg, fontWeight: 'bold', marginBottom: spacing.md },
    infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
    infoEmoji: { fontSize: 20 },
    infoText: { fontSize: fontSize.sm },

    restartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.warning,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    restartButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: 'bold' },
});
