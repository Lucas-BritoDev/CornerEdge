import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, X, ClipboardList } from 'lucide-react-native';
import { colors, darkColors, spacing, borderRadius, fontSize, shadows } from '../constants/theme';
import { DrawerMenu } from '../components/DrawerMenu';
import { TaskRoulette } from '../components/TaskRoulette';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HouseholdMember, HouseholdTask, TASK_CATEGORIES } from '../types';

const MOCK_MEMBERS: HouseholdMember[] = [
    { id: '1', name: 'Maria Silva', email: 'maria@email.com', role: 'admin', points: 450, joinedAt: Date.now() },
    { id: '2', name: 'João Santos', email: 'joao@email.com', role: 'member', points: 380, joinedAt: Date.now() },
    { id: '3', name: 'Ana Oliveira', email: 'ana@email.com', role: 'member', points: 320, joinedAt: Date.now() },
    { id: '4', name: 'Pedro Costa', email: 'pedro@email.com', role: 'member', points: 250, joinedAt: Date.now() },
];

const PENDING_TASKS: HouseholdTask[] = [
    { id: '1', name: 'Lavar a louça do jantar', category: 'cozinha', frequency: 'daily', priority: 'high', points: 15, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '2', name: 'Passar pano na sala', category: 'limpeza', frequency: 'weekly', priority: 'medium', points: 20, completed: false, createdAt: Date.now(), createdBy: '1' },
    { id: '3', name: 'Levar lixo reciclável', category: 'limpeza', frequency: 'weekly', priority: 'low', points: 10, completed: false, createdAt: Date.now(), createdBy: '1' },
];

export default function RouletteScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<HouseholdTask | null>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [assignedMember, setAssignedMember] = useState<HouseholdMember | null>(null);
    const [assignmentHistory, setAssignmentHistory] = useState<{ task: HouseholdTask; member: HouseholdMember }[]>([]);

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

    const getCategoryInfo = (categoryId: string) => {
        return TASK_CATEGORIES.find(c => c.id === categoryId) || TASK_CATEGORIES[0];
    };

    const handleRouletteResult = (member: HouseholdMember) => {
        setAssignedMember(member);
        if (selectedTask) {
            setAssignmentHistory([{ task: selectedTask, member }, ...assignmentHistory]);
            Alert.alert(
                '🎉 Sorteado!',
                `${member.name} foi sorteado(a) para "${selectedTask.name}"!`,
                [
                    { text: 'OK', style: 'default' }
                ]
            );
        }
    };

    const selectTaskForRoulette = (task: HouseholdTask) => {
        setSelectedTask(task);
        setAssignedMember(null);
        setShowTaskModal(false);
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
                    <Text style={styles.headerTitle}>Roleta de Tarefas</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            >
                {/* Task Selection */}
                <TouchableOpacity
                    style={[styles.taskSelector, { backgroundColor: cardColor }]}
                    onPress={() => setShowTaskModal(true)}
                >
                    {selectedTask ? (
                        <View style={styles.selectedTask}>
                            <View style={[styles.taskIcon, { backgroundColor: getCategoryInfo(selectedTask.category).color + '20' }]}>
                                <Text style={styles.taskEmoji}>{getCategoryInfo(selectedTask.category).icon}</Text>
                            </View>
                            <View style={styles.taskInfo}>
                                <Text style={[styles.taskLabel, { color: mutedColor }]}>TAREFA SELECIONADA</Text>
                                <Text style={[styles.taskName, { color: textColor }]}>{selectedTask.name}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.noTaskSelected}>
                            <ClipboardList color={colors.primary} size={24} />
                            <Text style={[styles.selectTaskText, { color: colors.primary }]}>Selecionar Tarefa para Sortear</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Roulette */}
                <TaskRoulette
                    members={MOCK_MEMBERS}
                    onResult={handleRouletteResult}
                    isDark={isDark}
                />

                {/* Result */}
                {assignedMember && selectedTask && (
                    <View style={[styles.resultCard, { backgroundColor: colors.success + '20' }]}>
                        <Text style={styles.resultEmoji}>✅</Text>
                        <View style={styles.resultInfo}>
                            <Text style={[styles.resultTitle, { color: colors.success }]}>Tarefa Atribuída!</Text>
                            <Text style={[styles.resultText, { color: textColor }]}>
                                <Text style={{ fontWeight: 'bold' }}>{assignedMember.name}</Text> vai fazer "{selectedTask.name}"
                            </Text>
                        </View>
                    </View>
                )}

                {/* Recent Assignments */}
                {assignmentHistory.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: mutedColor }]}>ÚLTIMOS SORTEIOS</Text>
                        {assignmentHistory.slice(0, 5).map((item, index) => (
                            <View key={index} style={[styles.historyItem, { backgroundColor: cardColor }]}>
                                <Text style={styles.historyEmoji}>{getCategoryInfo(item.task.category).icon}</Text>
                                <View style={styles.historyInfo}>
                                    <Text style={[styles.historyTask, { color: textColor }]}>{item.task.name}</Text>
                                    <Text style={[styles.historyMember, { color: mutedColor }]}>Atribuída a {item.member.name}</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Tips */}
                <View style={[styles.tipCard, { backgroundColor: isDark ? '#374151' : '#EEF2FF' }]}>
                    <Text style={styles.tipEmoji}>💡</Text>
                    <Text style={[styles.tipText, { color: mutedColor }]}>
                        Use a roleta quando ninguém quiser fazer uma tarefa. O sorteio é justo e divertido!
                    </Text>
                </View>
            </ScrollView>

            {/* Task Selection Modal - Full Screen */}
            <Modal visible={showTaskModal} animationType="slide">
                <View style={[styles.fullScreenModal, { backgroundColor: bgColor, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: textColor }]}>Escolher Tarefa</Text>
                        <TouchableOpacity onPress={() => setShowTaskModal(false)} style={styles.closeModalButton}>
                            <X color={mutedColor} size={24} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.modalSubtitle, { color: mutedColor }]}>
                        Selecione a tarefa que será sorteada
                    </Text>

                    <ScrollView style={styles.taskList} contentContainerStyle={{ paddingBottom: spacing.xl }}>
                        {PENDING_TASKS.map(task => {
                            const category = getCategoryInfo(task.category);
                            return (
                                <TouchableOpacity
                                    key={task.id}
                                    style={[styles.taskOption, { backgroundColor: cardColor, borderColor: selectedTask?.id === task.id ? colors.primary : 'transparent' }]}
                                    onPress={() => selectTaskForRoulette(task)}
                                >
                                    <View style={[styles.taskOptionIcon, { backgroundColor: category.color + '20' }]}>
                                        <Text style={styles.taskOptionEmoji}>{category.icon}</Text>
                                    </View>
                                    <View style={styles.taskOptionInfo}>
                                        <Text style={[styles.taskOptionName, { color: textColor }]}>{task.name}</Text>
                                        <Text style={[styles.taskOptionPoints, { color: colors.accent }]}>+{task.points} pontos</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </Modal>


            <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        backgroundColor: '#8B5CF6',
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
    content: { flex: 1, padding: spacing.lg },

    // Task Selector
    taskSelector: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        ...shadows.sm,
    },
    selectedTask: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    taskEmoji: { fontSize: 24 },
    taskInfo: { flex: 1 },
    taskLabel: { fontSize: fontSize.xs, letterSpacing: 0.5 },
    taskName: { fontSize: fontSize.md, fontWeight: '600', marginTop: 2 },
    noTaskSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
    },
    selectTaskText: { fontSize: fontSize.md, fontWeight: '600' },

    // Result Card
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
    },
    resultEmoji: { fontSize: 32, marginRight: spacing.md },
    resultInfo: { flex: 1 },
    resultTitle: { fontSize: fontSize.md, fontWeight: 'bold' },
    resultText: { fontSize: fontSize.sm, marginTop: 2 },

    sectionTitle: {
        fontSize: fontSize.xs,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },

    // History
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    historyEmoji: { fontSize: 24, marginRight: spacing.md },
    historyInfo: { flex: 1 },
    historyTask: { fontSize: fontSize.sm, fontWeight: '500' },
    historyMember: { fontSize: fontSize.xs, marginTop: 2 },

    // Tip Card
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    tipEmoji: { fontSize: 20 },
    tipText: { flex: 1, fontSize: fontSize.sm },

    // Full Screen Modal
    fullScreenModal: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    closeModalButton: {
        padding: spacing.sm,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
        paddingTop: spacing.md,
    },
    modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold' },
    modalSubtitle: { fontSize: fontSize.sm, marginBottom: spacing.lg },
    taskList: { flex: 1 },
    taskOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    taskOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    taskOptionEmoji: { fontSize: 24 },
    taskOptionInfo: { flex: 1 },
    taskOptionName: { fontSize: fontSize.md, fontWeight: '600' },
    taskOptionPoints: { fontSize: fontSize.sm, marginTop: 2 },
});
